// Deterministic geometric and input-loop checks; these are not human playtests.
const assert=require('node:assert/strict');
const path=require('node:path');require(path.join(__dirname,'../src/data/map-data.js'));const G=require(path.join(__dirname,'../src/geometry.js'));
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
for(const floor of [0,1]){
 const D=G.floors[floor],x=D.closet[0]+D.closet[2]/2,y=D.closet[1]+D.closet[3];
 assert(G.blocked(x,y,12,G.model({floor,closetOpen:false})),'Closed '+D.closet_id+' blocks entry');
 assert(!G.blocked(x,y,12,G.model({floor,closetOpen:true})),'Open '+D.closet_id+' admits entry');
}
console.log('PASS: escalera idéntica en ambos pisos; escalera transitable y cambios de piso seguros (16/24/36 u); 13 recorridos alcanzables (16/24 u); pasos de living, comedor, oficina y cocina; armarios A1/A2 bloquean cerrados y admiten abiertos.');
