import test from 'node:test';
import assert from 'node:assert/strict';
import {previewEmbedding,previewAssetTags} from '../server/preview.mjs';
const project={url:'https://website.co/'};
function environment(headers){return {PREVIEW_FETCH:async(url,options)=>{
 if(url.startsWith('https://cloudflare-dns.com/'))return Response.json({Answer:url.includes('type=AAAA')?[]:[{type:1,data:'93.184.216.34'}]});
 assert.equal(options.method,'HEAD');assert.equal(options.headers.Cookie,undefined);
 return new Response(null,{headers});
}};}
test('framing restrictions select Enhanced while unrestricted sites keep native rendering',async()=>{
 for(const headers of [{'x-frame-options':'SAMEORIGIN'},{'x-frame-options':'DENY'},{'content-security-policy':"default-src 'self'; frame-ancestors 'none'"}])assert.equal((await previewEmbedding(environment(headers),project)).directAllowed,false);
 assert.equal((await previewEmbedding(environment({}),project)).directAllowed,true);
 assert.equal((await previewEmbedding(environment({'content-security-policy':'frame-ancestors *'}),project)).directAllowed,true);
});
test('embedding detection retains public URL and redirect checks',async()=>{
 await assert.rejects(previewEmbedding(environment({}),{url:'https://localhost/'}));
 const env=environment({});const fetcher=env.PREVIEW_FETCH;
 env.PREVIEW_FETCH=async(url,options)=>url.startsWith('https://cloudflare-dns.com/')?fetcher(url,options):new Response(null,{status:302,headers:{location:'https://other.co/'}});
 await assert.rejects(previewEmbedding(env,project));
});

test('preview adapts originally same-origin classic assets but preserves CDN and module integrity',()=>{
 const html='<link rel="stylesheet" href="/main.css" crossorigin="anonymous" integrity="sha384-style"><script src="./app.js" crossorigin="anonymous" integrity="sha384-script"></script><script src="https://cdn.other.co/app.js" crossorigin="anonymous" integrity="sha384-cdn"></script><script type="module" src="/module.js" crossorigin="anonymous" integrity="sha384-module"></script>';
 const adapted=previewAssetTags(html,'https://website.co/path/');
 assert.match(adapted,/<link rel="stylesheet" href="\/main.css">/);
 assert.match(adapted,/<script src="\.\/app.js">/);
 assert.match(adapted,/integrity="sha384-cdn"/);assert.match(adapted,/integrity="sha384-module"/);
});
