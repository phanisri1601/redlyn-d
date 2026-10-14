import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
function bridge(){
 const listeners={},messages=[],popups=[],parent={postMessage:m=>messages.push(m)},win={addEventListener:(k,f)=>(listeners[k]??=[]).push(f),open:u=>popups.push(u)};
 const clicks=[],touch={},root={scrollTop:0,scrollHeight:3000,clientHeight:600},document={scripts:[{src:'',hasAttribute:()=>true,dataset:{reviewOrigin:'https://review.co',sourceUrl:'https://website.co/'}}],addEventListener:(k,f)=>{if(k==='click')clicks.push(f);if(k.startsWith('touch'))touch[k]=f},createElement:()=>({setAttribute(){},style:{}}),body:{append(){}},head:{append(){}},scrollingElement:root,documentElement:{scrollWidth:1000,scrollHeight:900,toggleAttribute(){}},getElementById:()=>null};
 win.scrollBy=({top})=>{root.scrollTop+=top};win.scrollTo=({top})=>{root.scrollTop=top};vm.runInNewContext(readFileSync(new URL('../src/bridge.js',import.meta.url),'utf8'),{document,window:win,parent,URL,Map,location:{pathname:'/preview/qa'},scrollX:0,scrollY:0,innerWidth:440,getComputedStyle:el=>({overflowY:el.overflow||'visible'})});
 listeners.message[0]({source:parent,origin:'https://review.co',data:{type:'redlyn:init',nonce:'qa',screenshots:false}});
 listeners.message[0]({source:parent,origin:'https://review.co',data:{type:'redlyn:mode',nonce:'qa',capture:false,mode:'comment'}});messages.length=0;
 return {messages,popups,touch,root,message:data=>listeners.message[0]({source:parent,origin:'https://review.co',data}),click(href,target=''){
  const anchor={target,getAttribute:()=>href,hasAttribute:()=>false};
  const event={target:{closest:()=>anchor},preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true}};
  clicks[0](event);return event;
 }};
}
test('mobile sidebar and placeholder controls do not navigate or open a blank tab',()=>{
 const b=bridge();for(const href of ['#','']){const e=b.click(href);assert.equal(e.prevented,true);assert.equal(e.stopped,undefined);}
 const js=b.click('javascript:void(0)');assert.equal(js.prevented,undefined);assert.equal(b.messages.length,0);assert.equal(b.popups.length,0);
});
test('internal page links, including target blank, route through the review; external URLs open separately',()=>{
 const b=bridge();assert.equal(b.click('/about','_blank').stopped,true);
 assert.equal(b.messages[0].type,'redlyn:navigate');assert.equal(b.messages[0].url,'https://website.co/about');
 b.click('https://external.co/');assert.deepEqual(b.popups,['https://external.co/']);
 const e=b.click('mailto:hello@website.co');assert.equal(e.prevented,undefined);
});

test('mobile vertical swipes scroll the reviewed page; horizontal gestures remain with the website',()=>{
 const b=bridge(),target={nodeType:1,parentElement:null};
 b.touch.touchstart({touches:[{clientX:100,clientY:400}],target});
 const vertical={touches:[{clientX:103,clientY:200}],cancelable:true,preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true}};
 b.touch.touchmove(vertical);assert.equal(b.root.scrollTop,200);assert.equal(vertical.prevented,true);
 b.touch.touchend();
 b.touch.touchstart({touches:[{clientX:100,clientY:400}],target});
 const horizontal={touches:[{clientX:250,clientY:397}],cancelable:true,preventDefault(){this.prevented=true}};
 b.touch.touchmove(horizontal);assert.equal(b.root.scrollTop,200);assert.equal(horizontal.prevented,undefined);
});

test('touch scrolling respects nested scroll panels and continues into the page at their edge',()=>{
 const b=bridge(),panel={nodeType:1,parentElement:null,overflow:'auto',scrollTop:0,scrollHeight:1000,clientHeight:200,scrollTo({top}){this.scrollTop=top}};
 const swipe=()=>{b.touch.touchstart({touches:[{clientX:100,clientY:400}],target:panel});b.touch.touchmove({touches:[{clientX:100,clientY:100}],cancelable:true,preventDefault(){},stopImmediatePropagation(){}});b.touch.touchend();};
 swipe();assert.equal(panel.scrollTop,300);assert.equal(b.root.scrollTop,0);
 panel.scrollTop=750;swipe();assert.equal(panel.scrollTop,800);assert.equal(b.root.scrollTop,250);
});

test('parent page scrolling can reach the footer and return to the top with nonce protection',()=>{
 const b=bridge();b.message({type:'redlyn:scroll-to',nonce:'qa',y:100000});assert.equal(b.root.scrollTop,2400);
 b.message({type:'redlyn:scroll-to',nonce:'wrong',y:0});assert.equal(b.root.scrollTop,2400);
 b.message({type:'redlyn:scroll-to',nonce:'qa',y:0});assert.equal(b.root.scrollTop,0);
});

test('Browse mode preserves native touch input and website-handled navigation',()=>{
 const b=bridge();b.message({type:'redlyn:mode',nonce:'qa',capture:false,mode:'browse'});
 b.touch.touchstart({touches:[{clientX:100,clientY:400}],target:{nodeType:1,parentElement:null}});
 const e={touches:[{clientX:100,clientY:100}],cancelable:true,preventDefault(){this.prevented=true}};
 b.touch.touchmove(e);assert.equal(e.prevented,undefined);assert.equal(b.root.scrollTop,0);
});
