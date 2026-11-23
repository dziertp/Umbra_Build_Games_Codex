// Deterministic geometric and input-loop checks; these are not human playtests.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
require('./dist/map-data.js');const G=require('./dist/geometry.js');
const report={version:'V4',notice:'Synthetic checks; no human playtest measurements.',geometry:[],interactions:[]};
assert.deepEqual(G.floors[0].stairs,[513,585,78,207]);
assert.deepEqual(G.floors[0].stairs,G.floors[1].stairs,'Both floors share exactly the +40 u stair placement');
const allGrids=new Map();
function grids(diameter){if(!allGrids.has(diameter))allGrids.set(diameter,G.floors.map((_,floor)=>G.grid(diameter,{floor,closetOpen:true})));return allGrids.get(diameter);}
for(const diameter of [16,24]){
 for(const trial of G.trials){const route=G.baseline(grids(diameter),trial);assert(route,'Reachable '+trial.id+' at '+diameter);report.geometry.push({trial:trial.id,diameter,distance:route.distance,changes:route.transitions});}
 for(const floor of [0,1]){
  const m=G.model({floor});
  assert(!G.blocked(480,645,diameter/2,m),'Shifted stair leaves the left-hand passage clear on floor '+floor);
  assert(!G.blocked(552,700,diameter/2,m),'Stair treads are walkable on floor '+floor);
  assert(G.blocked(513,700,diameter/2,m),'Stair railing is solid on floor '+floor);
 }
 const m=G.model();
 for(const [from,to,label] of [ [[230,845],[260,845],'Living sofa/table'],[[900,645],[925,625],'Dining entrance'],[[430,645],[480,645],'Office exit'] ]){
  for(const [a,b] of [[from,to],[to,from]]){const p={x:a[0],y:a[1]};assert(!G.blocked(p.x,p.y,diameter/2,m));G.move(p,b[0]-p.x,b[1]-p.y,diameter/2,m);assert(Math.hypot(p.x-b[0],p.y-b[1])<1e-5,label);}
 }
}
for(const diameter of [16,24,36]){
 const r=diameter/2,p={x:552,y:814};
 G.move(p,0,-300,r,G.model({floor:0}));const up=G.stairDestination(0,p,r);assert(up&&up.floor===1,'Upward transition at '+diameter);assert(!G.blocked(up.x,up.y,r,G.model({floor:1})));
 G.move(up,0,300,r,G.model({floor:1}));const down=G.stairDestination(1,up,r);assert(down&&down.floor===0,'Downward transition at '+diameter);assert(!G.blocked(down.x,down.y,r,G.model({floor:0})));
 const kitchen={x:900,y:450};G.move(kitchen,75,0,r,G.model());G.move(kitchen,0,90,r,G.model());assert(Math.abs(kitchen.x-975)<1e-6&&Math.abs(kitchen.y-540)<1e-6,'Kitchen entrance regression');
}
function app(){
 let now=0,raf=null,stored={},windowEvents={};const timers=[],elements=new Map();
 const ctx=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 function element(id){
  if(elements.has(id))return elements.get(id);
  const listeners={};const e={id,tagName:id==='map'?'CANVAS':'DIV',value:id==='diameter'?'16':id==='speed'?'72':id==='run-speed'?'102':'entrada-fusibles',textContent:'',children:[],attributes:{},disabled:false,
   clientWidth:1000,clientHeight:700,width:1000,height:700,
   addEventListener:(type,fn)=>(listeners[type]??=[]).push(fn),dispatch:(type,event={})=>(listeners[type]||[]).forEach(fn=>fn(event)),
   append(...v){this.children.push(...v)},replaceChildren(...v){this.children=v},setAttribute(k,v){this.attributes[k]=v},
   classList:{toggle(){},remove(){},add(){}},getContext:()=>ctx,focus(){},click(){this.dispatch('click')},showModal(){this.open=true},close(){this.open=false}};
  elements.set(id,e);return e;
 }
 const context={console,Math,Date,JSON,Number,String,Object,Array,Set,Map,Uint8Array,Int32Array,Float64Array,Infinity,Blob,URL,
  performance:{now:()=>now},devicePixelRatio:1,requestAnimationFrame:fn=>{raf=fn},setTimeout:fn=>{timers.push(fn);return timers.length},clearTimeout(){},
  document:{hidden:false,getElementById:element,createElement:tag=>element('generated-'+Math.random()),querySelectorAll:()=>[],addEventListener(){}},
  localStorage:{getItem:k=>stored[k]||null,setItem:(k,v)=>{stored[k]=v}},addEventListener:(type,fn)=>(windowEvents[type]??=[]).push(fn)};
 context.globalThis=context;context.window=context;vm.createContext(context);
 for(const name of ['map-data.js','geometry.js'])vm.runInContext(fs.readFileSync('dist/'+name,'utf8'),context,{filename:name});
 // Reuse grids already checked above; each app instance still runs its own movement and interaction engine.
 context.UmbraGeometry.grid=(diameter,config)=>grids(diameter)[config.floor??0];
 vm.runInContext(fs.readFileSync('dist/app.js','utf8'),context,{filename:'app.js'});
 while(timers.length)timers.shift()();
 function key(code,type='keydown'){
  for(const fn of windowEvents[type]||[])fn({code,repeat:false,target:{tagName:'CANVAS'},preventDefault(){}});
 }
 return {context,element,key,snap:()=>context.umbraSnapshot(),frame:(delta=1/60)=>{now+=delta*1000;raf(now)},flush:()=>{while(timers.length)timers.shift()()},
  choose:id=>{element('trial').value=id;element('trial').dispatch('change');while(timers.length)timers.shift()()},
  click:id=>element(id).click()};
}
function follow(a,trial,sprint=false){
 const route=G.baseline(grids(a.snap().diameter),trial);assert(route);
 const pastFloors=new Set();let frames=0;if(sprint)a.key('ShiftLeft');
 for(const target of route.points){
  if(a.snap().floor!==target.floor){assert(pastFloors.has(target.floor),'Expected floor transition for '+trial.id);continue;}
  let guard=0;
  while(Math.hypot(a.snap().player.x-target.x,a.snap().player.y-target.y)>1e-5){
   const snap=a.snap();if(snap.floor!==target.floor){pastFloors.add(target.floor);break;}
   const p=snap.player,D=G.floors[snap.floor],b=D.closet;
   if(!snap.closetOpen&&Math.hypot(p.x-b[0]-b[2]/2,p.y-b[1]-b[3]-5)<65){a.key('KeyE');a.key('KeyE','keyup');}
   const dx=target.x-p.x,dy=target.y-p.y,codes=[];
   if(Math.abs(dx)>1e-5)codes.push(dx>0?'KeyD':'KeyA');if(Math.abs(dy)>1e-5)codes.push(dy>0?'KeyS':'KeyW');
   const amounts=[Math.abs(dx),Math.abs(dy)].filter(v=>v>1e-5);
   const delta=Math.min(1/60,Math.min(...amounts)/((sprint?snap.runSpeed:snap.speed)/Math.sqrt(codes.length)));
   codes.forEach(c=>a.key(c));a.frame(delta);codes.forEach(c=>a.key(c,'keyup'));frames++;
   assert(++guard<120,'Stuck '+trial.id+' '+JSON.stringify(a.snap().player)+' to '+JSON.stringify(target));
  }
 }
 if(['closet','fuse'].includes(trial.finish)){a.key('KeyE');a.key('KeyE','keyup');a.frame();}
 if(sprint)a.key('ShiftLeft','keyup');
 const snap=a.snap();assert(!snap.running&&snap.history.length===1,'Completes '+trial.id);
 if(trial.finish==='closet')assert(snap.protected,'Wardrobe protects '+trial.id);
 assert.equal(snap.history[0].floorChanges,route.transitions,'Measurement records real floor changes');
 assert.equal(snap.floor,trial.goals.at(-1).floor);
 return {trial:trial.id,diameter:snap.diameter,frames,seconds:snap.history[0].seconds,floorChanges:snap.floorChanges,protected:snap.protected};
}
for(const diameter of [16,24])for(const trial of G.trials){
 const a=app();a.element('diameter').value=String(diameter);a.element('diameter').dispatch('input');a.choose(trial.id);a.click('start');report.interactions.push(follow(a,trial));
}
for(const id of ['subida','bajada','fusibles-a2']){const a=app();a.choose(id);a.click('start');report.interactions.push({mode:'sprint',...follow(a,G.trials.find(t=>t.id===id),true)});assert(a.snap().history[0].sprintSeconds>0);}
const slow=app();slow.choose('circuito');slow.click('start');slow.key('KeyS');slow.frame(.5);slow.key('KeyS','keyup');assert(Math.abs(slow.snap().player.y-656)<1e-6,'Walking speed remains 72 u/s on a slow frame');assert.equal(slow.snap().elapsed,.5);
const a=app();a.click('start');a.frame(1);assert.equal(a.snap().elapsed,0,'Clock waits for movement');a.key('KeyW');a.frame(.25);a.key('KeyW','keyup');assert.equal(a.snap().elapsed,.25);a.key('Space');a.frame(2);assert.equal(a.snap().elapsed,.25,'Pause stops time');a.key('Space');
a.element('speed').value='96';a.element('speed').dispatch('input');assert(!a.snap().running,'Settings cancel previous timing');
a.click('floor-1');assert.equal(a.snap().floor,1);assert(!a.snap().running&&!a.snap().armed,'Manual floor inspection does not count as a timed traversal');a.click('floor-0');assert.equal(a.snap().floor,0);
for(const floor of [0,1]){
 const D=G.floors[floor],x=D.closet[0]+D.closet[2]/2,y=D.closet[1]+D.closet[3];
 assert(G.blocked(x,y,12,G.model({floor,closetOpen:false})),'Closed '+D.closet_id+' blocks entry');
 assert(!G.blocked(x,y,12,G.model({floor,closetOpen:true})),'Open '+D.closet_id+' admits entry');
}
fs.writeFileSync('qa-report.json',JSON.stringify(report,null,2)+'\n');
console.log('PASS: identical +40 u staircase on both floors; walkable stairs and safe transfers at collision sizes 16/24/36; all 13 routes at 16/24; three sprint routes; A1/A2 entry and protection; previous living/dining/office and kitchen passages; clock/pause/reset and manual floor inspection.');
console.log(JSON.stringify(report.interactions));
