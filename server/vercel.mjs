import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {createClient} from '@libsql/client';
import {put,get} from '@vercel/blob';
import worker from './worker.mjs';
import {databaseBinding} from './turso.mjs';
import {firebaseConnection} from './firebase.mjs';
import {firestoreBinding} from './firestore-db.mjs';
const MIME={'.js':'application/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'};
export const VERCEL_UPLOAD_LIMIT=4*1024*1024;
export function privateMediaBinding(blobSDK={put,get},token) {
  const options={access:'private',...(token?{token}:{})};
  return {
    async put(id,body,metadata={}) {
      if(!/^[\w-]+$/.test(id))throw new Error('Invalid media identifier');
      await blobSDK.put('redlyn/'+id,body,{...options,addRandomSuffix:false,contentType:metadata.httpMetadata?.contentType||'application/octet-stream'});
    },
    async get(id) {
      if(!/^[\w-]+$/.test(id))return null;
      const value=await blobSDK.get('redlyn/'+id,{...options,useCache:false});
      return value?.statusCode===200&&value.stream?{body:value.stream}:null;
    }
  };
}
export function assetBinding(root=path.resolve('dist/client')) {
  return {async fetch(req) {
    try {
      const pathname=decodeURIComponent(new URL(req.url).pathname);
      const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
      if(!file.startsWith(root+path.sep))return new Response('',{status:404});
      return new Response(await readFile(/* turbopackIgnore: true */ file),{headers:{'Content-Type':MIME[path.extname(file)]||'application/octet-stream'}});
    } catch {return new Response('',{status:404});}
  }};
}
export function originalRequest(req) {
  const u=new URL(req.url),route=u.searchParams.get('__redlyn_path');
  if(route) {
    // Only the two backend route families may be forwarded by Vercel rewrites.
    if(!/^\/(api|preview)\//.test(route)||route.includes('?')||route.includes('#'))throw new Error('Invalid backend route');
    u.pathname=route;u.searchParams.delete('__redlyn_path');
    return new Request(u,req);
  }
  return req;
}
export const DATABASE_SETUP_MESSAGE='Database setup is incomplete. In Vercel → Project → Settings → Environment Variables, add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY (or TURSO_DATABASE_URL and TURSO_AUTH_TOKEN for the SQL backend), then redeploy.';
export const STORAGE_SETUP_MESSAGE='Uploads are not connected yet. In Vercel → Project → Storage, connect a PRIVATE Blob store and redeploy. Text comments still work.';
function missingMediaBinding() {
  const unavailable=()=>{throw Object.assign(new Error(STORAGE_SETUP_MESSAGE),{status:503});};
  return {put:unavailable,get:unavailable};
}
export async function hostingHealth(env) {
  const database={configured:!!env.DB,reachable:false,schemaReady:false};
  if(env.DB) {
    try {
      if(env.DB.provider!=='firebase'){await env.DB.prepare('SELECT 1 AS ok').first();database.reachable=true;}
      await env.DB.prepare('SELECT id FROM users LIMIT 1').all();database.schemaReady=true;
      database.reachable=true;
    } catch {} // Health results expose statuses only, never provider errors or credentials.
  }
  const uploads={configured:!!env.MEDIA,...(env.UPLOADS_DISABLED==='true'?{enabled:false}:{})};
  return {ready:database.schemaReady&&(uploads.configured||env.UPLOADS_DISABLED==='true'),workspaceReady:database.schemaReady,database,uploads};
}
export function createVercelHandler(env) {
  return async req=> {
    try {
      req=originalRequest(req);
      // Vercel overwrites x-forwarded-for. Do not trust a visitor-supplied Cloudflare header.
      const requestHeaders=new Headers(req.headers);requestHeaders.set('CF-Connecting-IP',(requestHeaders.get('x-forwarded-for')||'local').split(',')[0].trim());req=new Request(req,{headers:requestHeaders});
      if(new URL(req.url).pathname==='/api/health') {
        const health=await hostingHealth(env);
        return Response.json(health,{status:health.ready?200:503,headers:{'Cache-Control':'no-store'}});
      }
      if(!env.DB)return Response.json({error:DATABASE_SETUP_MESSAGE,code:'DATABASE_NOT_CONFIGURED'},{status:503,headers:{'Cache-Control':'no-store'}});
      const response=await worker.fetch(req,{...env,MEDIA:env.MEDIA||missingMediaBinding(),MAX_UPLOAD_BYTES:VERCEL_UPLOAD_LIMIT});
      const headers=new Headers(response.headers);headers.set('Cache-Control','private, no-store');
      return new Response(response.body,{status:response.status,headers});
    } catch {return Response.json({error:'The service is temporarily unavailable. Please try again.'},{status:503,headers:{'Cache-Control':'no-store'}});}
  };
}
let handler;
export async function handleVercelRequest(req) {
  if(!handler) {
    const env={...process.env,ASSETS:assetBinding(path.resolve('public'))};
    const url=env.TURSO_DATABASE_URL?.trim(),authToken=env.TURSO_AUTH_TOKEN?.trim();
    if(env.FIREBASE_PROJECT_ID) {
      try {env.DB=firestoreBinding(firebaseConnection(env).db);env.UPLOADS_DISABLED=env.UPLOADS_DISABLED||'true';}catch {}
    } else if(url&&authToken&&/^(libsql|https):\/\//.test(url)) {
      try {env.DB=databaseBinding(createClient({url,authToken}));}catch {} // Invalid URL remains a clear setup error.
    }
    if(env.UPLOADS_DISABLED!=='true'&&(env.BLOB_READ_WRITE_TOKEN?.trim()||(env.BLOB_STORE_ID?.trim()&&env.VERCEL_OIDC_TOKEN)))env.MEDIA=privateMediaBinding(undefined,env.BLOB_READ_WRITE_TOKEN?.trim());
    handler=createVercelHandler(env);
  }
  return handler(req);
}
