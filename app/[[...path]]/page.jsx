import {landing,comparison,legal} from '../../src/marketing.js';
// Public pages are rendered during the build. Authenticated screens retain the
// existing tested review engine, which mounts after the Next.js page hydrates.
export function generateStaticParams(){return [[],['pricing'],['features'],['compare'],['privacy'],['terms'],['refund'],['login'],['signup']].map(path=>({path}));}
export default async function Page({params}) {
 const {path=[]}=await params;
 const route='/'+path.join('/');
 let html='';
 if(['/', '/pricing','/features'].includes(route))html=landing();
 else if(route==='/compare')html=comparison();
 else if(['/privacy','/terms','/refund'].includes(route))html=legal(path[0]);
 return <div id="app" data-server-rendered={html?'true':undefined} dangerouslySetInnerHTML={{__html:html||'<div class="loading">Loading your workspace…</div>'}}/>;
}
