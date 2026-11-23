'use strict';
const G=UmbraGeometry,$=id=>document.getElementById(id),canvas=$('map'),ctx=canvas.getContext('2d');
let floor=0,D=G.floors[0],closetStates=[false,false],floorChanges=0;
const C={wall:'#b8c1cc',door:'#cfac73',muted:'#8c9cac',teal:'#82c5b6',blue:'#81aac8',amber:'#e1b66e'};
let history=[];try{history=JSON.parse(localStorage.getItem('umbra-v3-runs')||'[]');if(!Array.isArray(history))history=[];}catch{}
let selected=G.trials[0],diameter=16,speed=72,runSpeed=102,stairShift=40,closetOpen=false,nearView=false,showPath=false;
let player={x:640,y:990},keys=new Set(),armed=false,running=false,completed=false,paused=false,elapsed=0,distance=0,sprintSeconds=0,checkpoint=0;
let trail=[],baseline=null,model=G.model(),message='Pulsa Iniciar recorrido o explora con WASD.',until=0,last=performance.now(),uiAt=0,lastTrail=0;
let gridTimer=null,gridCache=new Map();const cfg=()=>({floor,closetOpen});
function rebuild(){model=G.model(cfg());}
function tell(text,seconds=4){message=text;until=performance.now()+seconds*1000;$('toast').textContent=text;}
function isInside(){const [x,y,w,h]=D.closet,r=diameter/2;return player.x>=x+r+1.5&&player.x<=x+w-r-1.5&&player.y>=y+r+1.5&&player.y<=y+h-r-1.5;}
function protectedNow(){return isInside()&&!closetOpen;}
function updateFloorUI(){
 for(const n of [0,1])$('floor-'+n).setAttribute('aria-pressed',String(floor===n));
 $('floor-state').textContent=floor===0?'PLANTA BAJA':'SEGUNDO PISO';
 $('closet-label').textContent='ARMARIO '+D.closet_id;
 $('map-foot').textContent=(floor===0?'1F · base V3.2':'2F · distribución corregida')+' · escalera +40 u';
 $('finding').textContent='Ambos pisos: escalera en x = 513 (+40 u). Paso junto al muro: 59,5 u.';
}
function changeFloor(destination){
 closetStates[floor]=closetOpen;floor=destination.floor;D=G.floors[floor];
 closetOpen=closetStates[floor];player={x:destination.x,y:destination.y};
 trail.push({...player,floor});if(running)floorChanges++;
 rebuild();updateFloorUI();tell(floor===1?'Segundo piso · continúa desde el distribuidor.':'Planta baja · de vuelta al hall.',3);
}
function reset(prepare=false,free=false){
 closetStates=[false,false];closetOpen=false;floorChanges=0;
 if(!free)floor=selected.start.floor??0;
 D=G.floors[floor];player={...(free?D.spawn:selected.start)};keys.clear();rebuild();
 armed=prepare;running=false;completed=false;paused=false;elapsed=0;distance=0;sprintSeconds=0;checkpoint=0;trail=[{...player,floor}];lastTrail=0;
 $('stage').classList.remove('paused');$('pause').textContent='Pausar';updateFloorUI();
 if(prepare)tell('Prueba lista. El reloj comienza al moverte.',8);
 else tell(free?'Exploración libre en '+D.floor_name.toLowerCase()+'. Recorre la escalera para cambiar de piso.':'Pulsa Iniciar recorrido para medir este trayecto.',8);
 updateUI();canvas.focus({preventScroll:true});
}
function inspectFloor(next){
 floor=next;D=G.floors[floor];selected=G.trials.find(t=>t.start.floor===floor);
 $('trial').value=selected.id;$('trial-desc').textContent=selected.description;
 reset(false,true);calculate();
}
function selectTrial(){selected=G.trials.find(t=>t.id===$('trial').value);$('trial-desc').textContent=selected.description;reset();calculate();}
function calculate(){
 clearTimeout(gridTimer);$('baseline').textContent='Calculando…';baseline=null;
 const trial=selected,size=diameter;
 gridTimer=setTimeout(()=>{
  if(trial!==selected||size!==diameter)return;
  const grids=G.floors.map((_,f)=>{
   const key=size+':'+f;
   if(!gridCache.has(key)){if(gridCache.size>12)gridCache.clear();gridCache.set(key,G.grid(size,{floor:f,closetOpen:true}));}
   return gridCache.get(key);
  });
  baseline=G.baseline(grids,trial);
  $('baseline').textContent=baseline?(baseline.distance/speed).toLocaleString('es-CL',{minimumFractionDigits:1,maximumFractionDigits:1})+' s':'Sin ruta con este tamaño';
 },60);
}
function updateSettings(){
 diameter=Number($('diameter').value);speed=Number($('speed').value);
 runSpeed=Math.max(speed,Number($('run-speed').value));$('run-speed').value=String(runSpeed);
 $('diameter-value').textContent=diameter+' u';$('speed-value').textContent=speed+' u/s';
 $('run-speed-value').textContent=runSpeed+' u/s';
 $('ratio').textContent='Caminar '+speed+' u/s · correr '+runSpeed+' u/s.';
 updateFinding();reset();calculate();
}
function updateFinding(){updateFloorUI();}
function finish(){
 if(!running)return;running=false;armed=false;completed=true;paused=false;
 const row={date:new Date().toISOString(),version:D.version,trial:selected.id,name:selected.name,seconds:elapsed,distance,diameter,speed,runSpeed,sprintSeconds,visualDiameter:Math.max(24,diameter),stairShift,
  referenceSeconds:baseline?baseline.distance/speed:null,startFloor:selected.start.floor,endFloor:floor,floorChanges};
 history.unshift(row);history=history.slice(0,50);try{localStorage.setItem('umbra-v3-runs',JSON.stringify(history));}catch{}
 renderHistory();tell('Recorrido completado: '+elapsed.toFixed(1)+' s. Puedes repetirlo con los mismos parámetros.',10);updateUI();
}
function nearCloset(){const [x,y,w,h]=D.closet;return Math.hypot(player.x-x-w/2,player.y-y-h-5)<71;}
function nearFuse(){return D.fuse&&Math.hypot(player.x-D.fuse[0]-D.fuse[2]/2,player.y-D.fuse[1]-D.fuse[3]/2)<48;}
function interact(){
 if(paused){tell('Reanuda la prueba antes de interactuar.');return;}
 const goal=selected.goals.at(-1);
 if(nearCloset()){
  const next=!closetOpen,nextModel=G.model({floor,closetOpen:next});
  if(!next&&G.blocked(player.x,player.y,diameter/2,nextModel)){
   tell('Entra por completo o aléjate del umbral antes de cerrar.');return;
  }
  closetOpen=next;closetStates[floor]=next;rebuild();
  if(protectedNow()){
   tell(D.closet_id+' cerrado. Estás protegido.');
   if(running&&selected.finish==='closet'&&goal.floor===floor)finish();
  }else tell(closetOpen?D.closet_id+' abierto. Entra y pulsa E para cerrar.':D.closet_id+' cerrado.');
  updateUI();return;
 }
 if(nearFuse()){
  tell('Electricidad restablecida para esta prueba.');
  if(running&&selected.finish==='fuse'&&goal.floor===floor)finish();return;
 }
 tell('Acércate al frente de '+D.closet_id+(floor===0?' o a la caja de fusibles.':'. La escalera se recorre caminando.'));
}
function togglePause(){
 if(!running&&!armed)return;paused=!paused;keys.clear();$('stage').classList.toggle('paused',paused);$('pause').textContent=paused?'Reanudar':'Pausar';updateUI();canvas.focus({preventScroll:true});
}
function updateUI(){
 const mins=Math.floor(elapsed/60),seconds=(elapsed%60).toFixed(1).padStart(4,'0');$('timer').textContent=String(mins).padStart(2,'0')+':'+seconds;
 const sprinting=keys.has('ShiftLeft')||keys.has('ShiftRight');
 $('distance').textContent=Math.round(distance)+' u · '+(sprinting?'Corriendo '+runSpeed:'Caminando '+speed)+' u/s';
 $('pause').disabled=!running&&!armed;
 $('run-state').textContent=paused?'En pausa':completed?'Prueba completada':running?'Midiendo recorrido':armed?'Listo para empezar':'Exploración libre';
 const target=selected.goals[checkpoint]||selected.goals.at(-1);
 let goal=target.floor!==floor?(target.floor===1?'Sube por la escalera al segundo piso':'Baja por la escalera a planta baja'):
 selected.finish==='fuse'?'Activa la caja con E':selected.finish==='closet'?'Entra en '+D.closet_id+' y cierra con E':target.label||'Alcanza la marca';
 $('objective').textContent=completed?selected.name:armed||running?goal:'Explora '+D.floor_name.toLowerCase();
 const safe=protectedNow();$('protection').textContent=safe?'Protegido':isInside()?'Puerta abierta':closetOpen?'Abierto':'Fuera del refugio';$('protection').classList.toggle('safe',safe);
 if(performance.now()>until){$('toast').textContent=paused?'Pulsa Espacio o Reanudar para continuar.':nearCloset()?'E · '+(closetOpen?'Cerrar '+D.closet_id:'Abrir '+D.closet_id):nearFuse()?'E · Restablecer electricidad':armed?'Muévete para iniciar el cronómetro.':running?goal:'WASD para explorar · recorre la escalera para cambiar de piso';}

}
function renderHistory(){
 const box=$('history');box.replaceChildren();$('export').disabled=!history.length;
 if(!history.length){const p=document.createElement('p');p.className='empty';p.textContent='Aún no hay recorridos completados. El reloj empieza al moverte.';box.append(p);return;}
 for(const row of history.slice(0,10)){
  const item=document.createElement('div');item.className='history-row';const details=document.createElement('div');
  const title=document.createElement('strong');title.textContent=row.name;const sub=document.createElement('small');
  sub.textContent=(row.version||'V3')+' · '+row.diameter+' u · '+row.speed+' u/s'+(row.floorChanges?' · '+row.floorChanges+' cambio de piso':'');
  const time=document.createElement('time');time.textContent=Number(row.seconds).toFixed(1)+' s';details.append(title,sub);item.append(details,time);box.append(item);
 }
}
function exportCSV(){
 const rows=[['fecha','recorrido','tiempo_activo_s','distancia_u','diametro_u','velocidad_u_s','escalera_desplazamiento_u','referencia_geometrica_s','version_mapa','velocidad_correr_u_s','tiempo_corriendo_s','ancho_visual_u','piso_inicio','piso_fin','cambios_piso']];
 for(const r of history)rows.push([r.date,r.name,r.seconds.toFixed(3),r.distance.toFixed(2),r.diameter,r.speed,r.stairShift,r.referenceSeconds===null?'':r.referenceSeconds.toFixed(3),r.version||'V3',r.runSpeed??'',r.sprintSeconds?.toFixed(3)??'',r.visualDiameter??r.diameter,r.startFloor===undefined?'':r.startFloor+1,r.endFloor===undefined?'':r.endFloor+1,r.floorChanges??'']);
 const csv='\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Umbra_mediciones_dos_pisos_V4.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function poly(points,color,width=2,dash=[]){ctx.beginPath();ctx.setLineDash(dash);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';points.forEach((p,i)=>i?ctx.lineTo(p.x??p[0],p.y??p[1]):ctx.moveTo(p.x??p[0],p.y??p[1]));ctx.stroke();ctx.setLineDash([]);}
function box(x,y,w,h,fill,stroke){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.2;ctx.strokeRect(x,y,w,h);}}
function text(s,x,y,size=16,color='#e1e5e7'){ctx.font='500 '+size+'px system-ui,sans-serif';ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(s,x,y);}
function draw(){
 const w=canvas.clientWidth,h=canvas.clientHeight,ratio=Math.min(devicePixelRatio||1,2);
 if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);}
 ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
 // Fit inside the space left by the toolbar and the bottom interaction hint.
 // Canvas bitmap dimensions must not influence the surrounding flex layout.
 const top=66,bottom=100,usableH=Math.max(1,h-top-bottom);
 const zoom=nearView?2:1,scale=Math.min(Math.max(1,w-32)/D.bounds[2],usableH/D.bounds[3])*zoom;
 const center=nearView?{x:player.x,y:player.y}:{x:D.bounds[0]+D.bounds[2]/2,y:D.bounds[1]+D.bounds[3]/2};
 ctx.translate(w/2,top+usableH/2);ctx.scale(scale,scale);ctx.translate(-center.x,-center.y);
 for(const [x,y,rw,rh,label] of D.roofs||[]){box(x,y,rw,rh,'#1b222c');poly([[x,y],[x+rw,y],[x+rw,y+rh],[x,y+rh],[x,y]],'#445161',1.4,[7,7]);if(label)text(label,x+rw/2,y+rh/2,12,'#718093');}
 for(const [name,x,y,rw,rh,fill] of D.rooms)box(x,y,rw,rh,fill);
 if(floor===0){box(505,215,285,125,'#26333d');box(515,1015,250,75,'#292e35');for(const y of [1039,1063,1087])poly([[525,y],[755,y]],'#68717b',1.5);}
 for(const [name,x,y,rw,rh] of D.furniture)box(x,y,rw,rh,name==='Vehículo'?'#475769':'#4d5158','#87919c');
 if(floor===0){box(931,875,58,47,'#263440','#8191a5');box(137,377,76,25,'#a6a7a3');}
 else{box(132,374,74,25,'#a6a7a3');box(1010,338,104,29,'#b2aaa2');}
 const [sx,sy,sw,sh]=D.stairs;box(sx,sy,sw,sh,'#252e3a');
 for(let y=sy+13;y<sy+sh;y+=14)poly([[sx+2,y],[sx+sw-2,y]],'#8190a2',1.4);
 poly([[sx,sy],[sx,sy+sh]],'#9cabbc',3);poly([[sx+sw,sy],[sx+sw,sy+sh]],'#9cabbc',3);
 const cyStair=sx+sw/2;
 if(floor===0){poly([[sx,sy],[sx+sw,sy]],'#9cabbc',3);poly([[cyStair,768],[cyStair,613]],C.door,2.5);poly([[cyStair-9,625],[cyStair,613],[cyStair+9,625]],C.door,2.5);}
 else{poly([[sx,sy+sh],[sx+sw,sy+sh]],'#9cabbc',3);poly([[cyStair,613],[cyStair,768]],C.door,2.5);poly([[cyStair-9,756],[cyStair,768],[cyStair+9,756]],C.door,2.5);}
 text(floor===0?'SUBIR A 2F':'BAJAR A 1F',cyStair,822,12,C.door);
 text('+40 u · x = 513',cyStair,840,11,'#9cabbc');
 for(const [x,y,r] of D.circles){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle='#59504b';ctx.fill();ctx.strokeStyle='#9a9087';ctx.stroke();}
 for(const s of D.walls)poly([[s[0],s[1]],[s[2],s[3]]],C.wall,s[4]);
 for(const s of D.leaves)poly([[s[0],s[1]],[s[2],s[3]]],C.door,s[4]);
 for(const s of D.windows)poly([[s[0],s[1]],[s[2],s[3]]],C.blue,6);
 for(const [o,at,a,b,side] of D.doors){
  const len=b-a,pts=[];for(let i=0;i<=16;i++){const t=i/16*Math.PI/2;if(o==='v')pts.push([at+(side==='left'?-1:1)*len*Math.cos(t),a+len*Math.sin(t)]);else pts.push([a+len*Math.cos(t),at+(side==='up'?-1:1)*len*Math.sin(t)]);}
  poly(pts,'#786c58',1,[3,4]);
 }
 const [cx,cy,cw,ch]=D.closet;box(cx,cy,cw,ch,protectedNow()?'#3c6c60':'#294a45');
 poly([[cx,cy+ch],[cx,cy],[cx+cw,cy],[cx+cw,cy+ch]],C.teal,3);
 if(closetOpen){poly([[cx,cy+ch],[cx,cy+ch+45]],C.door,2.4);poly([[cx+cw,cy+ch],[cx+cw,cy+ch+45]],C.door,2.4);}
 else{poly([[cx,cy+ch],[cx+cw,cy+ch]],C.door,3);poly([[cx+cw/2,cy],[cx+cw/2,cy+ch]],C.teal,1);}
 text(D.closet_id,cx+cw/2,cy+30,14,'#d6f3e8');
 if(D.fuse){box(1072,923,23,34,'#493a22',C.amber);poly([[1087,929],[1079,941],[1087,941],[1080,951]],C.amber,2.4);}
 for(const [s,x,y] of D.labels)text(s,x,y,['DESPENSA','PASO'].includes(s)?10:['BAÑO','SECUNDARIO','PRINCIPAL'].includes(s)?13:17);
 if(floor===0){text('FUSIBLES',1062,983,12,C.amber);text('ENTRADA PRINCIPAL',640,1120,16,'#9cabbc');}
 function drawSegments(points,color,width,dash){let segment=[];for(const p of points){if((p.floor??0)===floor)segment.push(p);else{if(segment.length>1)poly(segment,color,width,dash);segment=[];}}if(segment.length>1)poly(segment,color,width,dash);}
 if(showPath&&baseline)drawSegments(baseline.points,C.blue,2,[5,6]);
 drawSegments(trail,C.teal,2,[]);
 if(armed||running){
  for(let i=0;i<selected.goals.length;i++){
   const p=selected.goals[i],active=i===checkpoint;if(i<checkpoint||p.floor!==floor)continue;
   ctx.beginPath();ctx.arc(p.x,p.y,active?23:17,0,Math.PI*2);ctx.strokeStyle=active?C.amber:'#748598';ctx.lineWidth=2;ctx.setLineDash([4,5]);ctx.stroke();ctx.setLineDash([]);
   if(selected.goals.length>1)text(String(i+1),p.x,p.y+5,14,active?C.amber:'#b1bac5');
  }
 }
 ctx.save();ctx.shadowColor=protectedNow()?'#7ce6c9':'#c7dfef';ctx.shadowBlur=15;
 const visualRadius=Math.max(24,diameter)/2;
 ctx.beginPath();ctx.arc(player.x,player.y,visualRadius,0,Math.PI*2);ctx.fillStyle=protectedNow()?C.teal:'#e2eaf0';ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#ffffff';ctx.lineWidth=1.2;ctx.stroke();
 ctx.beginPath();ctx.arc(player.x,player.y,diameter/2,0,Math.PI*2);ctx.strokeStyle=C.amber;ctx.lineWidth=1.5;ctx.setLineDash([2,2]);ctx.stroke();ctx.setLineDash([]);
 ctx.beginPath();ctx.arc(player.x,player.y,2,0,Math.PI*2);ctx.fillStyle='#293747';ctx.fill();ctx.restore();
}
function animate(now){
 // Collision movement already uses small substeps; retain elapsed time at low frame rates.
 const realDelta=Math.max(0,(now-last)/1000),dt=realDelta;last=now;
 if(!paused){
  let x=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
  let y=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);
  if(x||y){
   if(armed&&!running){running=true;armed=false;tell('Cronómetro en marcha.',2);}
   const sprinting=keys.has('ShiftLeft')||keys.has('ShiftRight'),movementSpeed=sprinting?runSpeed:speed;
   const n=Math.hypot(x,y),result=G.move(player,x/n*movementSpeed*dt,y/n*movementSpeed*dt,diameter/2,model);
   if(running)distance+=result.distance;
   if(running&&sprinting&&result.distance>0)sprintSeconds+=realDelta;
   if(result.distance&&now-lastTrail>80){trail.push({...player,floor});lastTrail=now;if(trail.length>1500)trail.shift();}
   const destination=G.stairDestination(floor,player,diameter/2);if(destination)changeFloor(destination);
  }
  if(running){
   elapsed+=realDelta;
   if(selected.finish==='touch'){
    const p=selected.goals[checkpoint];if(p&&p.floor===floor&&Math.hypot(player.x-p.x,player.y-p.y)<22){checkpoint++;if(checkpoint===selected.goals.length)finish();else tell('Punto alcanzado. Continúa hacia '+selected.goals[checkpoint].label+'.');}
   }
  }
 }
 if(now-uiAt>100){updateUI();uiAt=now;}draw();requestAnimationFrame(animate);
}
for(const t of G.trials){const o=document.createElement('option');o.value=t.id;o.textContent=t.name;$('trial').append(o);}
$('trial-desc').textContent=selected.description;
for(const n of [0,1])$('floor-'+n).addEventListener('click',()=>inspectFloor(n));
$('trial').addEventListener('change',selectTrial);$('start').addEventListener('click',()=>reset(true));$('free').addEventListener('click',()=>reset(false,true));
$('diameter').addEventListener('input',updateSettings);$('speed').addEventListener('input',updateSettings);
$('run-speed').addEventListener('input',updateSettings);
$('camera').addEventListener('click',()=>{nearView=!nearView;$('camera').setAttribute('aria-pressed',String(nearView));canvas.focus({preventScroll:true});});
$('fit').addEventListener('click',()=>{nearView=false;$('camera').setAttribute('aria-pressed','false');tell('Mapa completo encajado en el espacio disponible.');canvas.focus({preventScroll:true});});
$('path').addEventListener('click',()=>{showPath=!showPath;$('path').setAttribute('aria-pressed',String(showPath));canvas.focus({preventScroll:true});});
$('pause').addEventListener('click',togglePause);$('export').addEventListener('click',exportCSV);
const guide=$('guide');$('help').addEventListener('click',()=>{if(running&&!paused)togglePause();guide.showModal();});
for(const id of ['close-guide','guide-start'])$(id).addEventListener('click',()=>{guide.close();canvas.focus({preventScroll:true});});
const movement=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight']);
window.addEventListener('keydown',e=>{
 if(guide.open||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
 if(movement.has(e.code)||e.code==='ShiftLeft'||e.code==='ShiftRight'){e.preventDefault();keys.add(e.code);}
 if(e.repeat)return;
 if(e.code==='KeyE'){e.preventDefault();interact();}
 if(e.code==='Space'){e.preventDefault();togglePause();}
 if(e.code==='KeyR'){e.preventDefault();reset(true);}
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();if(running&&!paused)togglePause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();if(running&&!paused)togglePause();}});
canvas.addEventListener('pointerdown',()=>canvas.focus({preventScroll:true}));
for(const b of document.querySelectorAll('[data-key]')){
 b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(b.dataset.key));
}
$('touch-e').addEventListener('click',interact);
// This read-only snapshot makes geometric and state checks reproducible in local QA.
window.umbraSnapshot=()=>({player:{...player},floor,stairs:[...D.stairs],floorChanges,closetStates:[...closetStates],diameter,visualDiameter:Math.max(24,diameter),speed,runSpeed,sprintSeconds,stairShift,closetOpen,protected:protectedNow(),running,armed,paused,elapsed,distance,checkpoint,selected:selected.id,history:[...history],baseline:baseline?.distance??null});
rebuild();renderHistory();updateFinding();calculate();updateUI();requestAnimationFrame(animate);
