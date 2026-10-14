import test from 'node:test';
import assert from 'node:assert/strict';
import {previewScale,anchorScreenPoint,displayScale} from '../src/review-state.js';

test('phone and tablet previews fit the canvas without changing native viewport dimensions',()=>{
 for(const [width,height] of [[393,852],[820,1180],[1024,1366],[1024,768]])for(const [availableWidth,availableHeight] of [[910,670],[650,450],[340,500]]){
  const scale=previewScale(width,height,availableWidth,availableHeight);
  assert.ok(scale>0&&scale<=1);
  assert.ok(width*scale<=availableWidth+0.001);
  assert.ok(height*scale<=availableHeight+0.001);
 }
 assert.equal(previewScale(393,852,1000,1000),1);
});
test('element and fallback comment anchors align with scaled frames after scroll',()=>{
 const rect={left:320,top:100,width:410,height:590},viewport={width:820,height:1180};
 assert.deepEqual(anchorScreenPoint({documentX:410,documentY:500},rect,viewport,{x:0,y:100}),{x:525,y:300});
 assert.deepEqual(anchorScreenPoint({viewportOnly:true,x:.5,y:.5},rect,viewport),{x:525,y:395});
 // Zero document coordinates must remain valid, rather than falling back to percentages.
 assert.deepEqual(anchorScreenPoint({documentX:0,documentY:0,x:.5,y:.5},rect,viewport),{x:320,y:100});
});

test('readable preview modes preserve native pixels unless width requires downscaling',()=>{
 assert.equal(displayScale(393,852,910,466,'width'),1);
 assert.equal(displayScale(820,1180,910,466,'width'),1);
 assert.equal(displayScale(820,1180,650,466,'width'),650/820);
 assert.equal(displayScale(820,1180,650,466,'actual'),1);
 assert.equal(displayScale(820,1180,650,466,'screen'),previewScale(820,1180,650,466));
});

test('handheld review uses the visible space while desktop device previews keep their requested height',async()=>{
 const {visibleReviewHeight}=await import('../src/review-state.js');
 assert.equal(visibleReviewHeight(852,632,1,true),632);
 assert.equal(visibleReviewHeight(852,632,1,false),852);
 const scale=300/393,actual=visibleReviewHeight(852,590,scale,true);
 assert.ok(actual*scale<=590);assert.ok(actual>590);
 assert.equal(visibleReviewHeight(852,300,1,true),300);
 assert.equal(visibleReviewHeight(852,900,1,true),852);
});
