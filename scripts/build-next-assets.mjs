import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
// Keep immutable bundles available to reviews already open during local rebuilds.
await mkdir('public/generated',{recursive:true});
const result=await build({entryPoints:{app:'src/app.js',bridge:'src/bridge.js'},bundle:true,format:'esm',outdir:'public/generated',entryNames:'[name]-[hash]',chunkNames:'chunk-[hash]',splitting:true,minify:true,metafile:true});
const entries=Object.fromEntries(Object.entries(result.metafile.outputs).filter(([,v])=>['src/app.js','src/bridge.js'].includes(v.entryPoint)).map(([file,v])=>[v.entryPoint.includes('bridge')?'bridge':'app','/'+file.replace(/^public\//,'')]));
await writeFile('app/assets.json',JSON.stringify(entries));
// The running Next development server can retain an earlier assets.json import.
// A stable bootstrap always points a fresh page at the latest built app module.
await writeFile('public/app-runtime.js',`import(${JSON.stringify(entries.app)});`);
// Preview scripts use a classic script tag. Keep that stable URL and lazily load the versioned module.
await writeFile('public/bridge.js',`(()=>{const script=document.currentScript;const origin=script?.dataset.reviewOrigin||script?.src||location.origin;let pending=null;const buffer=e=>{if(e.source===parent&&e.data?.type==='redlyn:init')pending=e;};window.addEventListener('message',buffer);import(new URL(${JSON.stringify(entries.bridge)},origin).href).then(()=>{window.removeEventListener('message',buffer);if(pending)window.dispatchEvent(new MessageEvent('message',{data:pending.data,origin:pending.origin,source:pending.source}));});})();`);
console.log('Built versioned browser assets.');
