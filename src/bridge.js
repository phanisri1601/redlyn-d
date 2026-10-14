(() => {
 const assetCache=new Map(),pendingAssets=new Map();let nonce=null,capture=false,reviewMode='browse',allowed=null,anchors=[],screenshots=true;
 const script=[...document.scripts].find(s=>s.src.includes('/bridge.js')||s.hasAttribute('data-redlyn-preview'));
 const configured=script?.dataset.reviewOrigin;const sourceURL=script?.dataset.sourceUrl;
 if(sourceURL)document.addEventListener('click',e=>{
  if(e.defaultPrevented)return;
  if(reviewMode==='comment'&&e.detail!==0&&Date.now()-lastSwipe<500){e.preventDefault();e.stopImmediatePropagation();return;}
  if(capture&&!e.altKey&&!altHeld)return;
  const a=e.target.closest?.('a[href]');if(!a)return;
  const href=a.getAttribute('href').trim();
  // Placeholder links are UI controls: let the site's click handlers open menus.
  if(/^javascript:/i.test(href))return;if(!href||href==='#'){e.preventDefault();return;}
  let target;try{target=new URL(href,sourceURL);}catch{return;}
  if(!['https:','http:'].includes(target.protocol))return;
  const source=new URL(sourceURL);
  if(target.origin===source.origin&&target.hash&&target.pathname===source.pathname&&target.search===source.search){
   e.preventDefault();try{document.getElementById(decodeURIComponent(target.hash.slice(1)))?.scrollIntoView({behavior:'smooth'});}catch{}return;
  }
  if(e.ctrlKey||e.metaKey||e.shiftKey||a.hasAttribute('download'))return;
  e.preventDefault();e.stopImmediatePropagation();
  if(target.origin===source.origin)post({type:'redlyn:navigate',url:target.href});
  else window.open(target.href,'_blank','noopener');
 },false);
 // Mobile review gestures must scroll the page, not turn a swipe into a pin.
 let touchGesture=null,lastSwipe=0;
 function moveTouchScroll(target,delta){
  let remaining=delta;
  for(let el=target;el&&el!==document.body&&el!==document.documentElement;el=el.parentElement){
   if(el.nodeType!==1||!/(auto|scroll)/.test(getComputedStyle(el).overflowY)||el.scrollHeight<=el.clientHeight)continue;
   const before=el.scrollTop,next=Math.max(0,Math.min(el.scrollHeight-el.clientHeight,before+remaining));
   if(next!==before){el.scrollTo({top:next,behavior:'instant'});remaining-=next-before;}
   if(Math.abs(remaining)<1)return true;
  }
  const root=document.scrollingElement||document.documentElement,before=root.scrollTop,next=Math.max(0,Math.min(root.scrollHeight-root.clientHeight,before+remaining));
  if(next!==before){window.scrollBy({top:next-before,behavior:'instant'});return true;}
  return Math.abs(remaining-delta)>0;
 }
 document.addEventListener('touchstart',e=>{
  if(!nonce||reviewMode==='browse'||parent===window||innerWidth>760||e.touches.length!==1){touchGesture=null;return;}
  const t=e.touches[0];touchGesture={x:t.clientX,y:t.clientY,lastY:t.clientY,target:e.target,vertical:false};
 },{passive:true});
 document.addEventListener('touchmove',e=>{
  if(!touchGesture||e.touches.length!==1)return;
  const t=e.touches[0],dx=t.clientX-touchGesture.x,dy=t.clientY-touchGesture.y;
  if(!touchGesture.vertical){if(Math.abs(dy)<10||Math.abs(dy)<=Math.abs(dx))return;touchGesture.vertical=true;}
  const delta=touchGesture.lastY-t.clientY;touchGesture.lastY=t.clientY;
  lastSwipe=Date.now();
  if(moveTouchScroll(touchGesture.target,delta)&&e.cancelable){e.preventDefault();e.stopImmediatePropagation();}
 },{passive:false,capture:true});
 document.addEventListener('wheel',e=>{if(!nonce||reviewMode==='browse'||parent===window||innerWidth>760||e.ctrlKey||Math.abs(e.deltaY)<=Math.abs(e.deltaX))return;if(moveTouchScroll(e.target,e.deltaY)&&e.cancelable)e.preventDefault();},{passive:false,capture:true});
 document.addEventListener('touchend',()=>{touchGesture=null;},{passive:true});
 document.addEventListener('touchcancel',()=>{touchGesture=null;},{passive:true});
 document.addEventListener('click',e=>{if(reviewMode==='comment'&&e.detail!==0&&Date.now()-lastSwipe<500){e.preventDefault();e.stopImmediatePropagation();}},true);
 const cursor=document.createElement('div');cursor.setAttribute('data-html2canvas-ignore','true');cursor.setAttribute('data-redlyn-cursor','true');cursor.setAttribute('aria-hidden','true');cursor.textContent='+';cursor.style.cssText='position:fixed;display:none;width:32px;height:32px;border:2px solid white;border-radius:50%;background:#ea444f;color:white;font:24px/28px Arial,sans-serif;text-align:center;pointer-events:none;z-index:2147483647;transform:translate(-50%,-50%);box-shadow:0 2px 8px #0005;';document.body.append(cursor);
 const cursorStyle=document.createElement('style');cursorStyle.textContent='html[data-redlyn-comment] *,html[data-redlyn-comment]{cursor:none!important}';document.head.append(cursorStyle);
 let pointerInside=false,altHeld=false;
 const showCursor=()=>{const active=capture&&pointerInside&&!altHeld;cursor.style.display=active?'block':'none';document.documentElement.toggleAttribute('data-redlyn-comment',active);};
 document.addEventListener('pointermove',e=>{pointerInside=true;if(e.altKey)altHeld=true;cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px';showCursor();},{passive:true});
 document.addEventListener('pointerleave',()=>{pointerInside=false;showCursor();});
 window.addEventListener('blur',()=>{pointerInside=false;altHeld=false;showCursor();});
 document.addEventListener('keydown',e=>{if(e.key==='Alt'){altHeld=true;showCursor();}});
 document.addEventListener('keyup',e=>{if(e.key==='Alt'){altHeld=false;showCursor();}});
 const post=(data)=>{if(nonce)parent.postMessage({...data,nonce},allowed||'*');};
 function selector(el){if(el===document.body)return 'body';if(el===document.documentElement)return 'html';if(el.id)return '#'+CSS.escape(el.id);const path=[];for(let n=el;n&&n!==document.body;n=n.parentElement){let s=n.tagName.toLowerCase();const siblings=[...(n.parentElement?.children||[])].filter(e=>e.tagName===n.tagName);if(siblings.length>1)s+=':nth-of-type('+(siblings.indexOf(n)+1)+')';path.unshift(s);if(path.length>=6)break;}return path.join(' > ');}
 const scroll=()=>{post({type:'redlyn:scroll',x:scrollX,y:scrollY,width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight});const positions=anchors.map(({id,anchor:a})=>{let x=a.x*document.documentElement.scrollWidth-scrollX,y=a.y*document.documentElement.scrollHeight-scrollY;try{const el=a.element?.selector?document.querySelector(a.element.selector):null;if(el){const r=el.getBoundingClientRect();x=r.left+r.width*(a.element.offsetX||0);y=r.top+r.height*(a.element.offsetY||0);}}catch{}return {id,x,y};});post({type:'redlyn:positions',positions});};
 window.addEventListener('message',e=>{if(e.source!==parent||parent===window)return;const m=e.data;if(m?.type==='redlyn:init'){if(configured&&e.origin!==configured)return;if(!configured&&location.pathname!=='/demo.html')return;nonce=m.nonce;screenshots=m.screenshots!==false;allowed=e.origin==='null'?'*':e.origin;post({type:'redlyn:ready',url:sourceURL||location.href});scroll();return;}if(m?.nonce!==nonce||e.origin!==allowed&&allowed!=='*')return;if(m.type==='redlyn:pick'&&Number.isFinite(m.x)&&Number.isFinite(m.y)&&m.x>=0&&m.x<=innerWidth&&m.y>=0&&m.y<=innerHeight){pinAt(m.x,m.y);return;}if(m.type==='redlyn:scroll-to'&&Number.isFinite(m.y)){const root=document.scrollingElement||document.documentElement;window.scrollTo({top:Math.max(0,Math.min(root.scrollHeight-root.clientHeight,m.y)),behavior:'instant'});scroll();return;}if(m.type==='redlyn:scroll-by'&&Number.isFinite(m.delta)){moveTouchScroll(document.body,Math.max(-2000,Math.min(2000,m.delta)));scroll();return;}if(m.type==='redlyn:capture-asset-result'){pendingAssets.get(m.id)?.(m.data);pendingAssets.delete(m.id);}if(m.type==='redlyn:modifier'){altHeld=!!m.alt;showCursor();}if(m.type==='redlyn:mode'){capture=!!m.capture;reviewMode=m.mode|| (capture?'comment':'browse');showCursor();}if(m.type==='redlyn:locate'){const a=m.anchor;try{for(const tab of a.tabs||[]){const t=document.querySelector(tab.selector);if(t&&t.getAttribute('aria-selected')!=='true')t.click();}const el=a.element?.selector?document.querySelector(a.element.selector):null;if(el)el.scrollIntoView({block:'center',behavior:'smooth'});else window.scrollTo({left:a.documentX||0,top:Math.max(0,(a.documentY||0)-innerHeight/2),behavior:'smooth'});}catch{}setTimeout(scroll,400);}if(m.type==='redlyn:device')setTimeout(scroll,300);});
 window.addEventListener('message',e=>{if(e.source!==parent||e.data?.nonce!==nonce||e.data?.type!=='redlyn:anchors')return;anchors=e.data.anchors||[];scroll();});
 window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',scroll);if(typeof ResizeObserver!=='undefined'){const pageSize=new ResizeObserver(scroll);pageSize.observe(document.documentElement);pageSize.observe(document.body);}
 async function imageData(url){if(url?.startsWith('data:image/'))return url;if(!url?.startsWith('https:'))return null;if(assetCache.has(url))return assetCache.get(url);if(assetCache.size>=10)return null;const promise=new Promise(resolve=>{const id=crypto.randomUUID();pendingAssets.set(id,resolve);post({type:'redlyn:capture-asset',id,url});setTimeout(()=>{if(pendingAssets.has(id)){pendingAssets.delete(id);resolve(null);}},9000);});assetCache.set(url,promise);return promise;}
 async function renderedScreenshot(){const clone=document.body.cloneNode(true),source=[document.body,...document.body.querySelectorAll('*')],copies=[clone,...clone.querySelectorAll('*')],jobs=[];for(let i=0;i<source.length;i++){const el=source[i],copy=copies[i];if(!copy)continue;const style=getComputedStyle(el);copy.setAttribute('style',[...style].map(k=>`${k}:${style.getPropertyValue(k)}`).filter(v=>!v.includes('url(')).join(';'));const r=el.getBoundingClientRect(),visible=r.bottom>=0&&r.top<innerHeight&&r.right>=0&&r.left<innerWidth;if(copy.tagName==='IMG'){copy.removeAttribute('src');copy.removeAttribute('srcset');if(visible)jobs.push(imageData(el.currentSrc||el.src).then(data=>{if(data)copy.src=data;}));}const bg=style.backgroundImage?.match(/^url\(["']?(.+?)["']?\)$/);if(bg&&visible)jobs.push(imageData(bg[1]).then(data=>{if(data)copy.style.backgroundImage='url("'+data+'")';}));if(copy.tagName==='CANVAS'){try{const img=document.createElement('img');img.src=el.toDataURL('image/png');img.setAttribute('style',copy.getAttribute('style'));copy.replaceWith(img);}catch{copy.remove();}}if(['SCRIPT','LINK','STYLE','IFRAME','VIDEO','AUDIO'].includes(copy.tagName)||copy.hasAttribute('data-redlyn-cursor'))copy.remove();if(el instanceof HTMLInputElement)copy.setAttribute('value',el.type==='password'?'':el.value);}await Promise.all(jobs);clone.style.margin='0';clone.style.width=document.documentElement.scrollWidth+'px';clone.style.transform=`translate(${-scrollX}px,${-scrollY}px)`;clone.style.transformOrigin='top left';const bg=getComputedStyle(document.body).backgroundColor;const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${innerWidth}" height="${innerHeight}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${innerWidth}px;height:${innerHeight}px;overflow:hidden;background:${bg}">${new XMLSerializer().serializeToString(clone)}</div></foreignObject></svg>`;const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;});const canvas=document.createElement('canvas');canvas.width=innerWidth;canvas.height=innerHeight;canvas.getContext('2d').drawImage(img,0,0);canvas.toDataURL('image/png');return canvas;}
 async function pinAt(x,y){const previousCapture=capture;capture=false;showCursor();const el=document.elementFromPoint(x,y)||document.body;
  // Phone menus must stay usable even while the review's Comment tool is active.
  const menu=innerWidth<=760?el.closest?.('button[aria-expanded],[role="button"][aria-expanded],a[aria-expanded],[aria-haspopup="menu"],[data-toggle="collapse"],[data-bs-toggle="collapse"],[class*="hamburger"],[aria-label*="menu" i],nav a[href],[role="navigation"] a[href]'):null;
  if(menu){menu.click();capture=previousCapture;showCursor();return;}
  const rect=el.getBoundingClientRect(),width=document.documentElement.scrollWidth,height=document.documentElement.scrollHeight;const anchor={x:(x+scrollX)/width,y:(y+scrollY)/height,documentX:x+scrollX,documentY:y+scrollY,scrollX,scrollY,element:{selector:selector(el),tag:el.tagName.toLowerCase(),id:el.id,ariaLabel:el.getAttribute('aria-label')||'',text:(el.innerText||el.textContent||el.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim().slice(0,160),offsetX:rect.width?(x-rect.left)/rect.width:0,offsetY:rect.height?(y-rect.top)/rect.height:0},tabs:[...document.querySelectorAll('[role="tab"][aria-selected="true"]')].map(el=>({selector:selector(el)}))};let screenshot=null;if(screenshots)try{const c=sourceURL?await renderedScreenshot():await (await import('html2canvas')).default(document.body,{backgroundColor:null,useCORS:true,scale:Math.min(devicePixelRatio,1.5),x:scrollX,y:scrollY,width:innerWidth,height:innerHeight,windowWidth:innerWidth,windowHeight:innerHeight,logging:false});const ctx=c.getContext('2d'),scale=c.width/innerWidth;ctx.fillStyle='#ea444f';ctx.beginPath();ctx.arc(x*scale,y*scale,14*scale,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2*scale;ctx.stroke();ctx.fillStyle='#fff';ctx.font=`${20*scale}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('+',x*scale,y*scale);screenshot=c.toDataURL('image/png');}catch{}post({type:'redlyn:pin',anchor,screenshot});}
 document.addEventListener('click',e=>{if(!capture||!nonce||e.altKey||altHeld||!e.isTrusted)return;e.preventDefault();e.stopImmediatePropagation();pinAt(e.clientX,e.clientY);},true);
})();
