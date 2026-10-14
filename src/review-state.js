export function reviewStatus(project){if(project.reopened_count>0)return 'Changes requested';if(project.approval_count>0&&!project.public_open_count)return 'Approved';return 'In review';}
export const deviceProfiles=[
 ['desktop:1440:900','Desktop · 1440'],['desktop:1280:800','Laptop · 1280'],['desktop:1366:768','Laptop HD · 1366'],['desktop:1536:864','Laptop large · 1536'],['desktop:1600:900','Desktop HD+ · 1600'],['desktop:1920:1080','Full HD · 1920'],['desktop:2560:1440','2K monitor · 2560'],
 ['tablet:768:1024','iPad · 768'],['tablet:820:1180','iPad Air · 820'],['tablet:834:1194','iPad Pro 11 · 834'],['tablet:1024:1366','iPad Pro 12.9 · 1024'],['tablet:800:1280','Galaxy Tab · 800'],['tablet:1024:768','iPad landscape · 1024'],
 ['phone:375:667','iPhone SE · 375'],['phone:390:844','iPhone 13 / 14 · 390'],['phone:393:852','iPhone 15 · 393'],['phone:430:932','iPhone Pro Max · 430'],['phone:360:800','Android · 360'],['phone:412:915','Pixel · 412'],['phone:360:780','Galaxy S · 360'],['phone:375:812','iPhone X · 375'],['phone:414:896','iPhone XR · 414'],['custom','Custom size…']];

// Scale the displayed frame without changing its CSS viewport or breakpoints.
export function previewScale(width,height,availableWidth,availableHeight){
 return Math.min(1,Math.max(1,availableWidth)/width,Math.max(1,availableHeight)/height);
}
export function anchorScreenPoint(anchor,rect,viewport,scroll={x:0,y:0}){
 const x=anchor.viewportOnly?anchor.x*viewport.width:(Number.isFinite(anchor.documentX)?anchor.documentX-scroll.x:anchor.x*viewport.width);
 const y=anchor.viewportOnly?anchor.y*viewport.height:(Number.isFinite(anchor.documentY)?anchor.documentY-scroll.y:anchor.y*viewport.height);
 return {x:rect.left+x*rect.width/viewport.width,y:rect.top+y*rect.height/viewport.height};
}

export function displayScale(width,height,availableWidth,availableHeight,mode='width'){
 if(mode==='actual')return 1;
 if(mode==='screen')return previewScale(width,height,availableWidth,availableHeight);
 return Math.min(1,Math.max(1,availableWidth)/width);
}

// On handheld screens the website uses the visible review space as its viewport.
// The webpage then owns one native scroll area, without a taller hidden frame.
export function visibleReviewHeight(requestedHeight,availableHeight,scale,handheld){
 return handheld?Math.max(1,Math.min(requestedHeight,Math.floor(Math.max(1,availableHeight)/Math.max(.01,scale)))):requestedHeight;
}
