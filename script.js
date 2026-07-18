(() => {
"use strict";

const garden=document.getElementById("gardenCanvas"),g=garden.getContext("2d");
const bouquet=document.getElementById("bouquetCanvas"),b=bouquet.getContext("2d");
const fieldScene=document.getElementById("fieldScene"),bouquetScene=document.getElementById("bouquetScene");
const intro=document.getElementById("intro"),enterButton=document.getElementById("enterButton");
const resetButton=document.getElementById("resetButton"),backToField=document.getElementById("backToField");
const selectedCount=document.getElementById("selectedCount"),flowerInfoList=document.getElementById("flowerInfoList");
const messageModal=document.getElementById("messageModal"),closeMessage=document.getElementById("closeMessage");
const messageFlowerName=document.getElementById("messageFlowerName"),messageText=document.getElementById("messageText");

const TARGET=7,DPR_LIMIT=1.7;
const meta=[
{name:"Lirio rojo",type:"lily-red",note:"Intensidad, valentía y amor profundo.",message:"Tu manera de amar tiene la intensidad de un lirio rojo: firme, cálida y difícil de olvidar."},
{name:"Lirio blanco",type:"lily-white",note:"Calma, cuidado y ternura silenciosa.",message:"Hay una paz especial en la forma en que cuidas a quienes quieres."},
{name:"Lirio degradado",type:"lily-gradient",note:"Dulzura y fuerza conviviendo juntas.",message:"En ti pueden existir al mismo tiempo la delicadeza y una fuerza inmensa."},
{name:"Lirio rojo intenso",type:"lily-red",note:"Una forma de amar profunda y verdadera.",message:"Cuando amas, lo haces con una fuerza que se siente incluso en los silencios."},
{name:"Lirio blanco puro",type:"lily-white",note:"Serenidad, refugio y sensibilidad.",message:"Tu presencia puede sentirse como un lugar tranquilo al que siempre dan ganas de volver."},
{name:"Lirio rosado",type:"lily-gradient",note:"Ternura, dulzura y sensibilidad.",message:"Tu ternura aparece en detalles pequeños que para mí terminan significándolo todo."},
{name:"Lirio especial",type:"lily-special",note:"La mezcla de todas tus formas de querer.",message:"No eres una sola flor: eres el jardín entero que aparece cuando alguien aprende a conocerte."}
];

const s={started:false,scene:"field",time:0,last:performance.now(),w:0,h:0,bw:0,bh:0,flowers:[],grass:[],stars:[],dust:[],pollen:[],bpollen:[],selected:[],hits:[],seed:912735};
function rnd(){s.seed=(1664525*s.seed+1013904223)>>>0;return s.seed/4294967296}
function rr(a,z){return a+(z-a)*rnd()}
function fit(canvas,ctx){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,DPR_LIMIT);canvas.width=Math.max(1,Math.floor(r.width*d));canvas.height=Math.max(1,Math.floor(r.height*d));ctx.setTransform(d,0,0,d,0,0);return{w:r.width,h:r.height}}
function resize(){const a=fit(garden,g),c=fit(bouquet,b);s.w=a.w;s.h=a.h;s.bw=c.w;s.bh=c.h;build()}
function wind(y,p,m=1){const d=Math.max(0,Math.min(1,(y-s.h*.3)/(s.h*.7)));return(Math.sin(s.time*.0012+p)*(1.4+d*5.8)+Math.sin(s.time*.00042+p*2.4)*(1+d*2.2))*m}

function build(){
 s.seed=912735;s.flowers=[];s.grass=[];s.stars=[];s.dust=[];
 const h=s.h,w=s.w,hor=h*.32,phone=w<720;
 for(let i=0;i<(phone?170:320);i++)s.stars.push({x:rr(0,w),y:rr(0,hor*.95),r:rr(.25,1.45),a:rr(.2,.95),p:rr(0,Math.PI*2)});
 for(let i=0;i<(phone?1300:2400);i++){const d=rnd(),y=hor+Math.pow(d,1.1)*(h-hor);s.grass.push({x:rr(-10,w+10),y,d,l:rr(12,52)*(.28+d),p:rr(0,6.28),lean:rr(-.34,.34)})}
 const pool=["lily-white","lily-red","lily-gradient","valley","spider-red","spider-blue"],cand=[];
 for(let i=0;i<(phone?760:1380);i++){
   const d=rnd(),y=hor+Math.pow(d,1.58)*(h-hor-3),pers=.055+Math.pow(d,1.72)*1.52,type=pool[Math.floor(rnd()*pool.length)];
   let size=rr(6.2,15.8)*pers;if(type==="valley")size*=.74;if(type.startsWith("spider"))size*=.90;
   const f={id:i,x:rr(-35,w+35),y,d,size,stem:rr(18,54)*pers,p:rr(0,6.28),rot:rr(-.34,.34),type,special:false,selected:false,mi:-1,gp:rr(0,6.28)};
   s.flowers.push(f);if(d>.48&&d<.91&&f.x>w*.06&&f.x<w*.94)cand.push(f);
 }
 for(let i=0;i<TARGET;i++){
   const dx=w*(.11+i*(.78/(TARGET-1))),dd=.58+(i%3)*.095,dt=["lily-red","lily-white","lily-gradient","lily-red","lily-white","lily-gradient","lily-special"][i];let best=null,score=1e9;
   for(const f of cand){if(f.special)continue;const sc=Math.abs(f.x-dx)+Math.abs(f.d-dd)*210+(f.type===dt?0:90);if(sc<score){best=f;score=sc}}
   if(best){best.special=true;best.mi=i;best.type=dt;best.size*=1.25;best.stem*=1.08}
 }
 for(let i=0;i<(phone?70:130);i++)s.dust.push({x:rr(0,w),y:rr(hor*.75,h),r:rr(.6,2.1),p:rr(0,6.28),sp:rr(.12,.42),a:rr(.15,.55)});
 s.flowers.sort((a,z)=>a.d-z.d);
 for(const q of s.selected){const f=s.flowers.find(x=>x.special&&x.mi===q.mi);if(f)f.selected=true}
}

function moon(ctx,x,y,r){
 let q=ctx.createRadialGradient(x,y,0,x,y,r*3.4);q.addColorStop(0,"rgba(244,248,255,.62)");q.addColorStop(.33,"rgba(160,190,235,.16)");q.addColorStop(1,"rgba(120,160,220,0)");
 ctx.fillStyle=q;ctx.beginPath();ctx.arc(x,y,r*3.4,0,6.28);ctx.fill();
 q=ctx.createRadialGradient(x-r*.3,y-r*.35,r*.06,x,y,r);q.addColorStop(0,"#fffef7");q.addColorStop(.54,"#dae5f1");q.addColorStop(1,"#8498af");
 ctx.fillStyle=q;ctx.beginPath();ctx.arc(x,y,r,0,6.28);ctx.fill();
 ctx.globalAlpha=.22;ctx.fillStyle="#60758a";for(const [cx,cy,cr] of [[-.32,-.11,.15],[.17,-.27,.1],[.28,.17,.18],[-.12,.32,.11],[-.4,.28,.07],[.03,.05,.07]]){ctx.beginPath();ctx.arc(x+cx*r,y+cy*r,cr*r,0,6.28);ctx.fill()}ctx.globalAlpha=1;
}

function sky(){
 const w=s.w,h=s.h,hor=h*.32;let q=g.createLinearGradient(0,0,0,hor+80);q.addColorStop(0,"#010510");q.addColorStop(.43,"#071329");q.addColorStop(.76,"#1a2b47");q.addColorStop(1,"#46536a");g.fillStyle=q;g.fillRect(0,0,w,h);
 for(const st of s.stars){const a=st.a*(.68+Math.sin(s.time*.002+st.p)*.28);g.fillStyle=`rgba(222,235,255,${a})`;g.beginPath();g.arc(st.x,st.y,st.r,0,6.28);g.fill()}
 moon(g,w*.22,h*.13,Math.min(w,h)*.058);
 q=g.createLinearGradient(0,hor-4,0,h);q.addColorStop(0,"#18261d");q.addColorStop(.28,"#0d1f16");q.addColorStop(1,"#020807");g.fillStyle=q;g.fillRect(0,hor,w,h-hor);
 g.fillStyle="rgba(3,9,11,.96)";g.beginPath();g.moveTo(0,hor+22);for(let x=0;x<=w+20;x+=9){const p=hor-(8+Math.sin(x*.041)*7+((x*13)%19));g.lineTo(x,p);g.lineTo(x+5,hor+13)}g.lineTo(w,hor+45);g.lineTo(0,hor+45);g.closePath();g.fill();
 q=g.createLinearGradient(0,hor-28,0,hor+85);q.addColorStop(0,"rgba(195,213,226,0)");q.addColorStop(.45,"rgba(195,213,226,.12)");q.addColorStop(1,"rgba(195,213,226,0)");g.fillStyle=q;g.fillRect(0,hor-30,w,120);
}

function grass(){
 for(const z of s.grass){const sw=wind(z.y,z.p,.55);g.strokeStyle=z.d>.55?`rgba(44,94,55,${.26+z.d*.46})`:`rgba(31,68,42,${.18+z.d*.4})`;g.lineWidth=.45+z.d*1.1;g.beginPath();g.moveTo(z.x,z.y);g.quadraticCurveTo(z.x+z.lean*z.l+sw*.35,z.y-z.l*.56,z.x+z.lean*z.l+sw,z.y-z.l);g.stroke()}
}

function petal(ctx,L,W,A,C,V,front=true){
 ctx.save();ctx.rotate(A);
 ctx.shadowBlur=front?Math.max(1,L*.06):0;
 ctx.shadowColor="rgba(0,0,0,.22)";
 const q=ctx.createLinearGradient(-W*.2,2,W*.2,-L);
 q.addColorStop(0,C[0]);q.addColorStop(.34,C[1]);q.addColorStop(.74,C[1]);q.addColorStop(1,C[2]);
 ctx.fillStyle=q;ctx.strokeStyle=front?"rgba(255,242,232,.38)":"rgba(255,238,228,.18)";
 ctx.lineWidth=Math.max(.42,W*.034);
 ctx.beginPath();
 ctx.moveTo(0,2);
 ctx.bezierCurveTo(-W*.82,-L*.18,-W*.78,-L*.58,-W*.12,-L*.94);
 ctx.quadraticCurveTo(0,-L*1.06,W*.12,-L*.94);
 ctx.bezierCurveTo(W*.78,-L*.58,W*.82,-L*.18,0,2);
 ctx.closePath();ctx.fill();ctx.stroke();
 ctx.shadowBlur=0;

 // nervadura central
 ctx.strokeStyle=V;ctx.lineWidth=Math.max(.32,W*.022);
 ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(W*.03,-L*.25,-W*.025,-L*.55,0,-L*.88);ctx.stroke();

 // nervaduras secundarias
 ctx.globalAlpha=.58;
 for(let n=0;n<3;n++){
   const yy=-L*(.30+n*.16);
   ctx.beginPath();ctx.moveTo(0,yy);ctx.quadraticCurveTo(-W*.22,yy-L*.06,-W*.38,yy-L*.12);ctx.stroke();
   ctx.beginPath();ctx.moveTo(0,yy);ctx.quadraticCurveTo(W*.22,yy-L*.06,W*.38,yy-L*.12);ctx.stroke();
 }
 ctx.globalAlpha=1;

 // pequeñas manchas naturales
 for(let i=0;i<7;i++){
   const sx=((i%3)-1)*W*.12 + Math.sin(i*2.1)*W*.035;
   const sy=-L*(.38+i*.065);
   ctx.fillStyle=i%2?"rgba(91,20,39,.38)":"rgba(130,44,57,.26)";
   ctx.beginPath();ctx.ellipse(sx,sy,Math.max(.28,W*.022),Math.max(.42,W*.034),.25,0,6.28);ctx.fill();
 }

 // brillo fino en el borde para dar sensación de pétalo curvado
 if(front){
   ctx.strokeStyle="rgba(255,255,255,.16)";
   ctx.lineWidth=Math.max(.35,W*.018);
   ctx.beginPath();ctx.moveTo(-W*.04,-L*.96);ctx.quadraticCurveTo(-W*.42,-L*.75,-W*.54,-L*.48);ctx.stroke();
 }
 ctx.restore();
}
function pal(t,i){
 if(t==="lily-white")return["#fffdf7","#f3ece8","#cfd8e2","rgba(92,58,70,.24)"];
 if(t==="lily-red")return["#ffd4c6","#ce2f4b","#630817","rgba(255,230,219,.26)"];
 if(t==="lily-special")return i%2===0?["#fff8f0","#f0b7bf","#9b1532","rgba(119,26,49,.3)"]:["#fff1e8","#dd5f75","#6d0920","rgba(255,230,220,.25)"];
 return i%2===0?["#fff9f1","#efc4c9","#aa1533","rgba(115,27,49,.3)"]:["#fff0e8","#dc6a7c","#78091f","rgba(255,232,221,.24)"];
}
function classic(ctx,f,x,y,z){
 ctx.save();ctx.translate(x,y);ctx.rotate(f.rot);

 // pétalos posteriores, ligeramente oscuros
 for(let i=0;i<3;i++){
   const idx=i*2+1,p=pal(f.type,idx);
   ctx.globalAlpha=.91;
   petal(ctx,z*1.13,z*.53,idx*Math.PI/3,p.slice(0,3),p[3],false);
 }
 ctx.globalAlpha=1;

 // pétalos frontales
 for(let i=0;i<3;i++){
   const idx=i*2,p=pal(f.type,idx);
   petal(ctx,z*1.10,z*.55,idx*Math.PI/3,p.slice(0,3),p[3],true);
 }

 // garganta con profundidad
 const throat=ctx.createRadialGradient(0,0,0,0,0,z*.32);
 throat.addColorStop(0,"rgba(255,237,164,.95)");
 throat.addColorStop(.45,"rgba(239,199,118,.82)");
 throat.addColorStop(1,"rgba(129,79,61,0)");
 ctx.fillStyle=throat;ctx.beginPath();ctx.arc(0,0,z*.32,0,6.28);ctx.fill();

 // estambres curvos
 for(let i=0;i<6;i++){
   const a=i*Math.PI/3+.20,L=z*(.58+(i%2)*.09);
   const ex=Math.cos(a)*L,ey=Math.sin(a)*L;
   ctx.strokeStyle="rgba(244,215,157,.96)";
   ctx.lineWidth=Math.max(.55,z*.038);
   ctx.beginPath();ctx.moveTo(0,0);
   ctx.quadraticCurveTo(Math.cos(a+.16)*L*.52,Math.sin(a+.16)*L*.52,ex,ey);
   ctx.stroke();
   ctx.fillStyle="#4a1a15";
   ctx.beginPath();ctx.ellipse(ex,ey,z*.052,z*.11,a,0,6.28);ctx.fill();
   ctx.fillStyle="rgba(255,202,92,.35)";
   ctx.beginPath();ctx.ellipse(ex-z*.012,ey-z*.015,z*.018,z*.045,a,0,6.28);ctx.fill();
 }

 // pistilo
 ctx.strokeStyle="rgba(221,201,135,.94)";
 ctx.lineWidth=Math.max(.6,z*.045);
 ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(z*.05,-z*.22,z*.03,-z*.62);ctx.stroke();
 ctx.fillStyle="#b47a58";ctx.beginPath();ctx.arc(z*.03,-z*.62,z*.055,0,6.28);ctx.fill();

 ctx.restore();
}
function spider(ctx,f,x,y,z,blue){
 ctx.save();ctx.translate(x,y);ctx.rotate(f.rot);const base=blue?"#6fa9ff":"#d52f4e",light=blue?"#cfe4ff":"#ffd1c6",dark=blue?"#174f9e":"#7c091f";
 for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.save();ctx.rotate(a);let q=ctx.createLinearGradient(0,0,0,-z*1.55);q.addColorStop(0,light);q.addColorStop(.5,base);q.addColorStop(1,dark);ctx.strokeStyle=q;ctx.lineWidth=Math.max(.8,z*.11);ctx.lineCap="round";ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-z*.38,-z*.35,z*.32,-z*1.05,0,-z*1.48);ctx.stroke();ctx.lineWidth=Math.max(.35,z*.045);for(let j=0;j<2;j++){const o=(j?1:-1)*z*.11;ctx.beginPath();ctx.moveTo(o,-z*.18);ctx.bezierCurveTo(o*1.6,-z*.55,o*2.5,-z*1.15,o*.7,-z*1.72);ctx.stroke()}ctx.restore()}
 ctx.fillStyle=light;ctx.beginPath();ctx.arc(0,0,z*.2,0,6.28);ctx.fill();
 for(let i=0;i<12;i++){const a=i*Math.PI/6,L=z*(1.2+(i%3)*.18);ctx.strokeStyle=light;ctx.lineWidth=Math.max(.35,z*.035);ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(Math.cos(a+.18)*L*.55,Math.sin(a+.18)*L*.55,Math.cos(a)*L,Math.sin(a)*L);ctx.stroke();ctx.fillStyle=dark;ctx.beginPath();ctx.arc(Math.cos(a)*L,Math.sin(a)*L,z*.045,0,6.28);ctx.fill()}ctx.restore();
}
function valley(ctx,f,x,y,z){
 ctx.save();ctx.translate(x,y);ctx.rotate(f.rot);ctx.strokeStyle="#5a8a54";ctx.lineWidth=Math.max(.8,z*.12);ctx.beginPath();ctx.moveTo(0,z*.6);ctx.quadraticCurveTo(z*.18,0,z*.1,-z*1.5);ctx.stroke();
 for(let i=0;i<6;i++){const side=i%2===0?-1:1,cy=-z*(.18+i*.22),cx=side*z*(.28+i*.035);ctx.strokeStyle="#6e9b62";ctx.lineWidth=Math.max(.4,z*.055);ctx.beginPath();ctx.moveTo(z*.08,cy+z*.06);ctx.quadraticCurveTo(cx*.5,cy,cx,cy);ctx.stroke();const q=ctx.createRadialGradient(cx,cy-z*.05,0,cx,cy,z*.28);q.addColorStop(0,"#fffef9");q.addColorStop(.72,"#edf4ec");q.addColorStop(1,"#b9c9b7");ctx.fillStyle=q;ctx.beginPath();ctx.moveTo(cx-z*.18,cy-z*.1);ctx.quadraticCurveTo(cx-z*.22,cy+z*.1,cx,cy+z*.22);ctx.quadraticCurveTo(cx+z*.22,cy+z*.1,cx+z*.18,cy-z*.1);ctx.quadraticCurveTo(cx,cy-z*.3,cx-z*.18,cy-z*.1);ctx.closePath();ctx.fill()}ctx.restore();
}
function stem(ctx,f,x,y,hx,hy,z,bouq){
 ctx.strokeStyle=bouq?"#47683f":`rgba(45,88,47,${.48+f.d*.48})`;ctx.lineWidth=Math.max(.8,z*.1);ctx.lineCap="round";ctx.beginPath();ctx.moveTo(x,y+3);ctx.quadraticCurveTo(x+(hx-x)*.35,y-f.stem*.54,hx,hy+z*.12);ctx.stroke();
 ctx.fillStyle=bouq?"rgba(59,108,51,.95)":"rgba(41,84,43,.88)";const ly=y-f.stem*.35;for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(x,ly);ctx.quadraticCurveTo(x+side*z*.92,ly-z*.1,x+side*z*.26,ly-z*1.18);ctx.quadraticCurveTo(x+side*z*.04,ly-z*.5,x,ly);ctx.fill()}
}
function flower(ctx,f,x,y,o={}){
 const bouq=!!o.bouquet,sc=o.scale||1,z=f.size*sc,sw=bouq?Math.sin(s.time*.001+f.p)*1.1:wind(y,f.p),hx=x+sw,hy=y-f.stem*sc;
 if(f.special&&!f.selected&&!bouq){const pu=.72+Math.sin(s.time*.0034+f.gp)*.2,q=ctx.createRadialGradient(hx,hy,0,hx,hy,z*3.8);q.addColorStop(0,`rgba(255,246,214,${.48*pu})`);q.addColorStop(.26,`rgba(255,92,118,${.23*pu})`);q.addColorStop(.55,`rgba(98,160,255,${.1*pu})`);q.addColorStop(1,"rgba(255,80,105,0)");ctx.fillStyle=q;ctx.beginPath();ctx.arc(hx,hy,z*3.8,0,6.28);ctx.fill();ctx.strokeStyle=`rgba(255,231,188,${.58+pu*.27})`;ctx.lineWidth=1.15;ctx.beginPath();ctx.arc(hx,hy,z*1.72,0,6.28);ctx.stroke()}
 stem(ctx,f,x,y,hx,hy,z,bouq);
 ctx.save();
 const perspectiveAlpha=bouq?1:Math.max(.48,.40+f.d*.72);
 ctx.globalAlpha=perspectiveAlpha;
 if(f.type==="spider-red")spider(ctx,f,hx,hy,z,false);
 else if(f.type==="spider-blue")spider(ctx,f,hx,hy,z,true);
 else if(f.type==="valley")valley(ctx,f,hx,hy,z);
 else classic(ctx,f,hx,hy,z);
 ctx.restore();
 return{x:hx,y:hy,r:Math.max(z*1.75,12)}
}
function drawFlowers(){for(const f of s.flowers)if(!f.selected)flower(g,f,f.x,f.y)}
function dust(){for(const d of s.dust){const x=d.x+Math.sin(s.time*.0003+d.p)*15,y=d.y+Math.cos(s.time*d.sp*.01+d.p)*9,a=d.a*(.55+(Math.sin(s.time*.003+d.p)+1)*.28);g.shadowBlur=8;g.shadowColor="rgba(255,208,108,.85)";g.fillStyle=`rgba(255,215,119,${a})`;g.beginPath();g.arc(x,y,d.r,0,6.28);g.fill();g.shadowBlur=0}}
function spawn(x,y,strong=false,bouq=false){const list=bouq?s.bpollen:s.pollen,n=strong?62:32;for(let i=0;i<n;i++){const a=rr(-Math.PI,Math.PI),v=rr(.35,strong?2.3:1.45);list.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rr(.25,1.08),life:rr(720,1450),r:rr(.8,strong?2.8:1.9),blue:strong&&rnd()<.22})}}
function particles(ctx,list,dt){for(let i=list.length-1;i>=0;i--){const p=list[i];p.life-=dt;if(p.life<=0){list.splice(i,1);continue}p.vy+=.009;p.vx+=.003;p.x+=p.vx*dt/16.67;p.y+=p.vy*dt/16.67;const a=Math.min(1,p.life/390);ctx.shadowBlur=9;ctx.shadowColor=p.blue?"rgba(110,170,255,.9)":"rgba(255,211,116,.9)";ctx.fillStyle=p.blue?`rgba(131,184,255,${a*.9})`:`rgba(255,220,137,${a*.9})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.28);ctx.fill();ctx.shadowBlur=0}}
function renderField(dt){sky();grass();drawFlowers();dust();particles(g,s.pollen,dt)}

function bouquetLayout(){
 const phone=s.bw<800;
 const cx=phone?s.bw*.46:s.bw*.47;
 const by=s.bh*.84;
 const sc=Math.max(.62,Math.min(1.18,Math.min(s.bw*.56,s.bh*.80)/430));
 return{
   cx,by,sc,
   p:[
     [-90,-10,.90,-.20],
     [-58,-55,.96,-.13],
     [-28,-18,.94,-.07],
     [0,-92,1.08,0],
     [30,-20,.94,.07],
     [60,-55,.96,.13],
     [92,-8,.90,.20]
   ]
 };
}
function bouquetBg(){const w=s.bw,h=s.bh;let q=b.createLinearGradient(0,0,0,h);q.addColorStop(0,"#070b15");q.addColorStop(.62,"#090711");q.addColorStop(1,"#15080f");b.fillStyle=q;b.fillRect(0,0,w,h);moon(b,w*.16,h*.18,Math.min(w,h)*.045);for(let i=0;i<120;i++){const x=(i*91.37)%w,y=(i*47.81)%h,a=.06+((i%9)/9)*.18;b.fillStyle=`rgba(225,236,255,${a})`;b.beginPath();b.arc(x,y,.45+(i%3)*.38,0,6.28);b.fill()}q=b.createRadialGradient(w*.47,h*.48,0,w*.47,h*.48,Math.min(w,h)*.58);q.addColorStop(0,"rgba(143,37,58,.3)");q.addColorStop(.45,"rgba(63,18,35,.1)");q.addColorStop(1,"rgba(0,0,0,0)");b.fillStyle=q;b.fillRect(0,0,w,h)}
function wrapBack(L){
 b.save();b.translate(L.cx,L.by);
 const sc=L.sc;
 let q=b.createLinearGradient(-120*sc,-170*sc,120*sc,110*sc);
 q.addColorStop(0,"rgba(219,193,165,.72)");
 q.addColorStop(.48,"rgba(167,132,101,.78)");
 q.addColorStop(1,"rgba(95,69,58,.88)");
 b.fillStyle=q;

 // abanico de papel trasero
 b.beginPath();
 b.moveTo(-38*sc,95*sc);
 b.lineTo(-145*sc,-105*sc);
 b.lineTo(-55*sc,-72*sc);
 b.lineTo(0,75*sc);
 b.closePath();b.fill();

 b.beginPath();
 b.moveTo(38*sc,95*sc);
 b.lineTo(145*sc,-105*sc);
 b.lineTo(55*sc,-72*sc);
 b.lineTo(0,75*sc);
 b.closePath();b.fill();

 b.fillStyle="rgba(234,213,190,.48)";
 b.beginPath();
 b.moveTo(-28*sc,90*sc);
 b.lineTo(-95*sc,-145*sc);
 b.lineTo(-20*sc,-88*sc);
 b.lineTo(8*sc,70*sc);
 b.closePath();b.fill();

 b.beginPath();
 b.moveTo(28*sc,90*sc);
 b.lineTo(95*sc,-145*sc);
 b.lineTo(20*sc,-88*sc);
 b.lineTo(-8*sc,70*sc);
 b.closePath();b.fill();

 b.restore();
}

function wrapFront(L){
 b.save();b.translate(L.cx,L.by);
 const sc=L.sc;

 // cono frontal que realmente recoge los tallos
 let q=b.createLinearGradient(-72*sc,-22*sc,72*sc,135*sc);
 q.addColorStop(0,"rgba(235,207,174,.96)");
 q.addColorStop(.50,"rgba(174,137,103,.96)");
 q.addColorStop(1,"rgba(92,65,55,.98)");
 b.fillStyle=q;
 b.beginPath();
 b.moveTo(-70*sc,-28*sc);
 b.quadraticCurveTo(-54*sc,34*sc,-32*sc,126*sc);
 b.lineTo(32*sc,126*sc);
 b.quadraticCurveTo(54*sc,34*sc,70*sc,-28*sc);
 b.quadraticCurveTo(0,5*sc,-70*sc,-28*sc);
 b.closePath();b.fill();

 // pliegues del papel
 b.strokeStyle="rgba(255,239,216,.18)";
 b.lineWidth=1;
 for(const x of [-42,-20,20,42]){
   b.beginPath();b.moveTo(x*sc,-16*sc);b.lineTo(x*.48*sc,112*sc);b.stroke();
 }

 // cinta
 b.fillStyle="#71152d";
 b.beginPath();b.ellipse(0,34*sc,60*sc,15*sc,0,0,6.28);b.fill();
 const ribbon=b.createLinearGradient(-65*sc,0,65*sc,0);
 ribbon.addColorStop(0,"#611025");ribbon.addColorStop(.5,"#b24760");ribbon.addColorStop(1,"#651127");
 b.fillStyle=ribbon;
 for(const side of [-1,1]){
   b.beginPath();
   b.moveTo(side*4*sc,31*sc);
   b.bezierCurveTo(side*48*sc,4*sc,side*72*sc,44*sc,side*22*sc,56*sc);
   b.bezierCurveTo(side*48*sc,82*sc,side*9*sc,86*sc,-side*7*sc,45*sc);
   b.fill();
 }
 b.restore();
}

function renderBouquet(dt){
 bouquetBg();
 const L=bouquetLayout();
 s.hits=[];

 // papel trasero antes de las flores
 wrapBack(L);

 // hojas de relleno discretas
 b.save();
 b.translate(L.cx,L.by);
 for(let i=0;i<18;i++){
   const a=-1.35+i*(2.7/17);
   const len=(115+(i%4)*18)*L.sc;
   b.strokeStyle="rgba(54,101,49,.72)";
   b.lineWidth=Math.max(1.2,2.4*L.sc);
   b.beginPath();b.moveTo(0,18*L.sc);
   b.quadraticCurveTo(Math.sin(a)*len*.28,-len*.42,Math.sin(a)*len,-Math.cos(a)*len*.72);
   b.stroke();
 }
 b.restore();

 for(let i=0;i<s.selected.length;i++){
   const q=s.selected[i],p=L.p[i];
   const f={...q,size:30*p[2]*L.sc,stem:188*L.sc,rot:p[3],selected:false,special:false,d:1};
   const x=L.cx+p[0]*L.sc,y=L.by+p[1]*L.sc;
   const h=flower(b,f,x,y,{bouquet:true});
   s.hits.push({x:h.x,y:h.y,r:Math.max(24,h.r),mi:q.mi});
 }

 // papel frontal después de los tallos para que parezca realmente envuelto
 wrapFront(L);
 particles(b,s.bpollen,dt);
}

function hitField(x,y){let best=null,bd=1e9;for(let i=s.flowers.length-1;i>=0;i--){const f=s.flowers[i];if(f.selected)continue;const hx=f.x+wind(f.y,f.p),hy=f.y-f.stem,r=Math.max(11,f.size*(f.type.startsWith("spider")?2.2:1.7)),d=Math.hypot(x-hx,y-hy);if(d<=r&&d<bd){best=f;bd=d}}return best}
function onField(e){if(!s.started||s.scene!=="field"||!messageModal.classList.contains("hidden"))return;const r=garden.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,f=hitField(x,y);if(!f){spawn(x,y);return}const hx=f.x+wind(f.y,f.p),hy=f.y-f.stem;spawn(hx,hy,f.special);if(f.special&&!f.selected&&s.selected.length<TARGET){f.selected=true;s.selected.push({...f});selectedCount.textContent=String(s.selected.length);if(s.selected.length===TARGET)setTimeout(openBouquet,900)}}
function onBouquet(e){if(s.scene!=="bouquet"||!messageModal.classList.contains("hidden"))return;const r=bouquet.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;let hit=null,bd=1e9;for(const h of s.hits){const d=Math.hypot(x-h.x,y-h.y);if(d<=h.r&&d<bd){hit=h;bd=d}}if(!hit)return;spawn(hit.x,hit.y,true,true);const m=meta[hit.mi];messageFlowerName.textContent=m.name;messageText.textContent=m.message;messageModal.classList.remove("hidden")}
function info(){flowerInfoList.innerHTML="";for(const f of s.selected){const m=meta[f.mi],item=document.createElement("div");item.className="info-item";const sw=document.createElement("div");sw.className="swatch";sw.style.background=m.type==="lily-white"?"radial-gradient(circle,#fffef8,#d7e0e5)":m.type==="lily-red"?"radial-gradient(circle,#ffd4c8,#ce304b 55%,#6d091c)":"radial-gradient(circle,#fff5ed,#df7887 55%,#7d1029)";const tx=document.createElement("div"),st=document.createElement("strong"),sp=document.createElement("span");st.textContent=m.name;sp.textContent=m.note;tx.append(st,sp);item.append(sw,tx);flowerInfoList.append(item)}}
function openBouquet(){info();s.scene="bouquet";fieldScene.classList.add("hidden");bouquetScene.classList.remove("hidden")}
function openField(){s.scene="field";bouquetScene.classList.add("hidden");fieldScene.classList.remove("hidden")}
function reset(){s.selected=[];s.pollen=[];s.bpollen=[];selectedCount.textContent="0";messageModal.classList.add("hidden");openField();build()}
function loop(now){const dt=Math.min(40,now-s.last);s.last=now;s.time=now;renderField(dt);renderBouquet(dt);requestAnimationFrame(loop)}

enterButton.addEventListener("click",()=>{s.started=true;intro.classList.add("hidden")});
resetButton.addEventListener("click",reset);backToField.addEventListener("click",openField);
garden.addEventListener("pointerdown",onField);bouquet.addEventListener("pointerdown",onBouquet);
closeMessage.addEventListener("click",()=>messageModal.classList.add("hidden"));
messageModal.addEventListener("click",e=>{if(e.target===messageModal)messageModal.classList.add("hidden")});
addEventListener("resize",resize,{passive:true});
resize();requestAnimationFrame(loop);
})();
