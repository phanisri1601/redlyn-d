import {build} from 'esbuild';
import {mkdir,cp,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist/client',{recursive:true});await mkdir('dist/server',{recursive:true});
await cp('public','dist/client',{recursive:true});
await build({entryPoints:['src/app.js'],bundle:true,format:'esm',outfile:'dist/client/app.js',minify:true});
await build({entryPoints:['src/bridge.js'],bundle:true,format:'iife',outfile:'dist/client/bridge.js',minify:true});
await build({entryPoints:['server/worker.mjs'],bundle:true,format:'esm',platform:'browser',outfile:'dist/server/index.js',minify:true});
console.log('Built frontend and Cloudflare Worker.');
