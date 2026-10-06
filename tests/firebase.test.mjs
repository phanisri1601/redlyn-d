import {test} from 'node:test';
import assert from 'node:assert/strict';
import {firebaseTestEnv} from './firebase-fixture.mjs';
import {createVercelHandler} from '../server/vercel.mjs';

const live=process.env.RUN_FIREBASE_TESTS==='1';
test('Firestore keeps uniqueness and batch rollback under concurrent signup writes',{skip:!live},async()=>{
 const {DB}=firebaseTestEnv();
 const signup=id=>DB.prepare('INSERT INTO users(id,email,name,password,created_at) VALUES(?,?,?,?,?)').bind(id,'same@example.test','Test','hashed-password',new Date().toISOString()).run();
 const results=await Promise.allSettled([signup('one'),signup('two')]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.equal((await DB.prepare('SELECT COUNT(*) AS n FROM users').first()).n,1);
 await assert.rejects(DB.batch([
  DB.prepare('INSERT INTO workspace_settings VALUES(?,?)').bind('rollback','Should not persist'),
  DB.prepare('INSERT INTO absent_table VALUES(?)').bind('invalid'),
 ]));
 assert.equal(await DB.prepare('SELECT * FROM workspace_settings WHERE owner_id=?').bind('rollback').first(),null);
});
test('Firebase text-only deployment reports ready and rejects uploads without blocking pins',{skip:!live},async()=>{
 const {DB}=firebaseTestEnv(),handler=createVercelHandler({DB,UPLOADS_DISABLED:'true'});
 let cookie='';
 const call=async(path,body)=>{const res=await handler(new Request('https://test.vercel.app'+path,{method:body?'POST':'GET',headers:{cookie,Origin:'https://test.vercel.app','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}));const set=res.headers.get('set-cookie');if(set)cookie=set.split(';')[0];return {status:res.status,data:await res.json()};};
 const health=await call('/api/health');assert.equal(health.status,200);assert.equal(health.data.ready,true);assert.equal(health.data.uploads.enabled,false);
 assert.equal((await call('/api/auth/signup',{name:'Test',email:'test@example.test',password:'test-password-123'})).status,200);
 const project=await call('/api/projects',{name:'Review',url:'https://example.com'});assert.equal(project.status,201);
 const pin=await call('/api/projects/'+project.data.id+'/feedback',{text:'Change heading',device:'desktop',anchor:{x:.3,y:.4},page:'/'});assert.equal(pin.status,201);
 const review=await call('/api/projects/'+project.data.id);assert.equal(review.data.feedback.length,1);
 assert.equal(review.data.uploadsEnabled,false);
 const form=new FormData();form.append('file',new File(['test'],'test.png',{type:'image/png'}));
 const upload=await handler(new Request('https://test.vercel.app/api/projects/'+project.data.id+'/feedback/'+pin.data.id+'/uploads',{method:'POST',headers:{cookie,Origin:'https://test.vercel.app'},body:form}));
 assert.equal(upload.status,503);assert.match((await upload.json()).error,/Uploads are disabled/);
});
