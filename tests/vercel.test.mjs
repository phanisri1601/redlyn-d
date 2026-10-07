import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createClient} from '@libsql/client';
import {migrateDatabase} from '../server/migrations.mjs';
import {databaseBinding} from '../server/turso.mjs';
import {createVercelHandler,privateMediaBinding,assetBinding,originalRequest} from '../server/vercel.mjs';
async function fixture(t) {
  const dir=await mkdtemp(path.join(tmpdir(),'redlyn-vercel-'));
  const client=createClient({url:'file:'+path.join(dir,'test.sqlite')});
  t.after(async()=>{client.close();await rm(dir,{recursive:true,force:true});});
  await migrateDatabase(client);
  const objects=new Map(),calls=[];
  const MEDIA=privateMediaBinding({
    async put(name,body,options){calls.push({method:'put',name,options});objects.set(name,new Uint8Array(await new Response(body).arrayBuffer()));},
    async get(name,options){calls.push({method:'get',name,options});return objects.has(name)?{statusCode:200,stream:new Response(objects.get(name)).body}:null;}
  },'test-only-token');
  const DB=databaseBinding(client),handler=createVercelHandler({DB,MEDIA,ASSETS:assetBinding()});
  function browser(ip) {
    let cookie='';
    return async(route,body,method=body?'POST':'GET',extraHeaders={})=> {
      const url=new URL('https://redlyn-test.vercel.app/api/index');url.searchParams.set('__redlyn_path',route);
      const multipart=body instanceof FormData;
      const response=await handler(new Request(url,{method,headers:{cookie,origin:url.origin,'x-forwarded-for':ip,...extraHeaders,...(!multipart?{'Content-Type':'application/json'}:{})},body:body?(multipart?body:JSON.stringify(body)):undefined}));
      if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];
      return {status:response.status,data:response.headers.get('content-type')?.includes('json')?await response.json():await response.text(),headers:response.headers};
    };
  }
  return {client,DB,handler,browser,calls};
}
test('Vercel rewrites preserve query, method, body, cookie and origin',async()=>{
  const req=new Request('https://test.vercel.app/api/index?__redlyn_path=%2Fapi%2Fauth%2Flogin&workspace=abc',{method:'POST',headers:{cookie:'session=value',origin:'https://test.vercel.app'},body:'{"text":"hi"}'});
  const r=originalRequest(req);assert.equal(new URL(r.url).pathname,'/api/auth/login');assert.equal(new URL(r.url).search,'?workspace=abc');assert.equal(r.method,'POST');assert.equal(await r.text(),'{"text":"hi"}');assert.equal(r.headers.get('cookie'),'session=value');assert.equal(r.headers.get('origin'),'https://test.vercel.app');
  assert.throws(()=>originalRequest(new Request('https://test.vercel.app/api/index?__redlyn_path=https://bad.example')));
});
test('Turso migrations are repeatable, preserve data and batches roll back together',async t=>{
  const {client,DB}=await fixture(t);await DB.prepare('INSERT INTO workspace_settings VALUES(?,?)').bind('keep','Existing workspace').run();assert.deepEqual(await migrateDatabase(client),[]);assert.equal((await DB.prepare('SELECT name FROM workspace_settings WHERE owner_id=?').bind('keep').first()).name,'Existing workspace');
  await assert.rejects(DB.batch([DB.prepare('INSERT INTO workspace_settings VALUES(?,?)').bind('rollback','Never committed'),DB.prepare('INSERT INTO absent_table VALUES(?)').bind('fail')]));assert.equal(await DB.prepare('SELECT * FROM workspace_settings WHERE owner_id=?').bind('rollback').first(),null);
});
test('Vercel flow persists accounts, protects internal uploads and supports client sign-off',async t=>{
  const {browser,calls}=await fixture(t),owner=browser('1.1.1.1'),client=browser('2.2.2.2'),other=browser('3.3.3.3');
  const signup=await owner('/api/auth/signup',{name:'Owner',email:'owner@example.test',password:'test-password-123'});assert.equal(signup.status,200);assert.match(signup.headers.get('set-cookie'),/HttpOnly.*Secure/);
  const project=(await owner('/api/projects',{name:'Vercel QA',url:'https://example.org'})).data;
  const review=await client('/api/review/'+project.clientToken,{name:'Client'});const reviewHeader={'X-Review-Session':review.data.token};
  const pin={text:'Test change',device:'desktop',anchor:{x:.2,y:.3},page:'/'};
  const publicPin=(await owner('/api/projects/'+project.id+'/feedback',pin)).data.id;
  const privatePin=(await owner('/api/projects/'+project.id+'/feedback',{...pin,text:'Private estimate',internal:true})).data.id;
  const form=new FormData();form.append('file',new File(['image bytes'],'private.png',{type:'image/png'}));const upload=await owner('/api/projects/'+project.id+'/feedback/'+privatePin+'/uploads',form);assert.equal(upload.status,200);assert.equal(calls.find(c=>c.method==='put').options.access,'private');
  assert.equal((await owner('/api/media/'+upload.data.id)).status,200);
  await other('/api/auth/signup',{name:'Other',email:'other@example.test',password:'test-password-123'});const before=calls.length;assert.equal((await other('/api/media/'+upload.data.id)).status,403);assert.equal(calls.length,before);
  await owner('/api/projects/'+project.id+'/feedback/'+publicPin,{status:'In review'},'PATCH');
  const visible=await client('/api/projects/'+project.id,undefined,'GET',reviewHeader);assert.equal(visible.data.feedback.length,1);assert.equal(visible.data.feedback[0].id,publicPin);
  assert.equal((await client('/api/media/'+upload.data.id,undefined,'GET',reviewHeader)).status,404);
  assert.equal((await client('/api/projects/'+project.id+'/feedback/'+publicPin,{status:'Resolved'},'PATCH',reviewHeader)).status,200);
  assert.equal((await client('/api/projects/'+project.id+'/approve',{page:'/'},'POST',reviewHeader)).status,200);
  const approvals=(await owner('/api/projects/'+project.id)).data.approvals;assert.equal(approvals.length,1);
  const invalid=await owner('/api/projects/'+project.id+'/feedback',pin);assert.equal(invalid.status,201);assert.equal((await owner('/api/projects/'+project.id)).data.approvals.length,0);
});
test('Vercel upload cap fails before private storage and health reports missing setup',async t=>{
  const {browser,calls}=await fixture(t),owner=browser('4.4.4.4');await owner('/api/auth/signup',{name:'Owner',email:'cap@example.test',password:'test-password-123'});const project=(await owner('/api/projects',{name:'Cap QA',url:'https://example.org'})).data;const pin=(await owner('/api/projects/'+project.id+'/feedback',{text:'Cap',device:'desktop',anchor:{x:.2,y:.3}})).data.id;
  const form=new FormData();form.append('file',new File([new Uint8Array(4*1024*1024+1)],'large.png',{type:'image/png'}));const result=await owner('/api/projects/'+project.id+'/feedback/'+pin+'/uploads',form);assert.equal(result.status,400);assert.match(result.data.error,/4 MB/);assert.equal(calls.length,0);
  const handler=createVercelHandler({});const health=await handler(new Request('https://example.vercel.app/api/health'));assert.equal(health.status,503);assert.deepEqual(await health.json(),{ready:false,workspaceReady:false,database:{configured:false,reachable:false,schemaReady:false},uploads:{configured:false}});const login=await handler(new Request('https://example.vercel.app/api/auth/login'));assert.equal(login.status,503);assert.match((await login.json()).error,/TURSO_DATABASE_URL and TURSO_AUTH_TOKEN/);
});
test('asset adapter serves preview documents and cannot escape its root',async()=>{
  const assets=assetBinding(path.resolve('public'));const demo=await assets.fetch(new Request('https://example.vercel.app/demo.html'));assert.equal(demo.status,200);assert.match(demo.headers.get('content-type'),/html/);assert.equal((await assets.fetch(new Request('https://example.vercel.app/%2e%2e%2fpackage.json'))).status,404);
});

test('Next.js deployment uses native route handlers and the Mumbai region',async()=>{
  const config=JSON.parse(await readFile('vercel.json','utf8'));
  assert.equal(config.framework,'nextjs');assert.deepEqual(config.regions,['bom1']);
  assert.equal(config.outputDirectory,undefined);assert.equal(config.rewrites,undefined);
  for(const file of ['app/api/[...path]/route.js','app/preview/[...path]/route.js']) {
    const route=await readFile(file,'utf8');assert.match(route,/runtime='nodejs'/);assert.match(route,/dynamic='force-dynamic'/);assert.match(route,/GET=handleVercelRequest/);assert.match(route,/POST=handleVercelRequest/);
  }
});

test('Vercel rate limits use the platform IP and ignore spoofed Cloudflare headers',async t=>{
  const {browser,DB}=await fixture(t);const first=browser('8.8.8.8'),second=browser('9.9.9.9');const invalid={email:'unknown@example.test',password:'not-a-valid-password'};
  for(let i=0;i<30;i++)assert.equal((await first('/api/auth/login',invalid,'POST',{'CF-Connecting-IP':'spoof-'+i})).status,401);
  assert.equal((await first('/api/auth/login',invalid,'POST',{'CF-Connecting-IP':'different-spoof'})).status,429);
  assert.equal((await second('/api/auth/login',invalid)).status,401);assert.equal((await DB.prepare('SELECT COUNT(*) AS n FROM rate_limits').first()).n,2);
});

test('missing Blob does not block database-backed login, comments or approvals',async t=>{
  const {DB}=await fixture(t);const handler=createVercelHandler({DB});let cookie='';
  const call=async(route,body,method=body?'POST':'GET')=>{const multipart=body instanceof FormData;const res=await handler(new Request('https://test.vercel.app'+route,{method,headers:{cookie,origin:'https://test.vercel.app','x-forwarded-for':'1.2.3.4',...(!multipart?{'Content-Type':'application/json'}:{})},body:body?(multipart?body:JSON.stringify(body)):undefined}));if(res.headers.get('set-cookie'))cookie=res.headers.get('set-cookie').split(';')[0];return {status:res.status,data:await res.json()};};
  assert.equal((await call('/api/auth/signup',{name:'Tester',email:'no-blob@example.test',password:'test-password-123'})).status,200);
  assert.equal((await call('/api/me')).data.user.name,'Tester');
  const project=(await call('/api/projects',{name:'No Blob test',url:'https://example.org'})).data;
  const pin=(await call('/api/projects/'+project.id+'/feedback',{text:'Saved without Blob',device:'desktop',anchor:{x:.2,y:.3},page:'/'})).data.id;
  assert.equal((await call('/api/projects/'+project.id)).data.feedback[0].text,'Saved without Blob');
  const form=new FormData();form.append('file',new File(['test'],'image.png',{type:'image/png'}));const upload=await call('/api/projects/'+project.id+'/feedback/'+pin+'/uploads',form);assert.equal(upload.status,503);assert.match(upload.data.error,/PRIVATE Blob store/);
  await call('/api/projects/'+project.id+'/feedback/'+pin,{status:'Resolved'},'PATCH');assert.equal((await call('/api/projects/'+project.id+'/approve',{page:'/'})).status,200);
  const health=await call('/api/health');assert.equal(health.data.workspaceReady,true);assert.equal(health.data.ready,false);assert.equal(health.data.uploads.configured,false);
});
test('health distinguishes unreachable database from missing schema without leaking errors',async()=>{
  const DB={prepare(){return {async first(){return {ok:1};},async all(){throw new Error('secret provider connection detail');}};}};
  const health=await createVercelHandler({DB})(new Request('https://test.vercel.app/api/health'));const data=await health.json();assert.equal(data.database.reachable,true);assert.equal(data.database.schemaReady,false);assert.equal(JSON.stringify(data).includes('secret'),false);
});
