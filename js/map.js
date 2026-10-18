/* 漫步勇者 · 世界地圖：道路、城鎮、迷霧、怪物生成、攝影機 */
'use strict';
/* ================= demo area: Taichung (positions approximate) ================= */
const O={lat:24.1372,lng:120.6869};const KX=111320*Math.cos(O.lat*Math.PI/180),KY=110540;
const toM=(lat,lng)=>[(lng-O.lng)*KX,-(lat-O.lat)*KY];
const toLL=(x,y)=>[O.lat-y/KY,O.lng+x/KX];
const TOWNS=[
  {n:'台中車站',lat:24.1372,lng:120.6869,svc:['inn','shop'],dn:'鐵道遺跡',big:1},
  {n:'台中公園',lat:24.1442,lng:120.6840,svc:['temple'],dn:'湖心亭秘境'},
  {n:'第二市場',lat:24.1424,lng:120.6788,svc:['shop'],dn:'百年市集'},
  {n:'一中街',lat:24.1495,lng:120.6855,svc:['shop','inn'],dn:'不眠商街'},
  {n:'審計新村',lat:24.1440,lng:120.6630,svc:['shop'],dn:'老宿舍迷巷'},
  {n:'勤美誠品',lat:24.1510,lng:120.6630,svc:['inn','shop'],dn:'綠意書塔'},
  {n:'科博館',lat:24.1573,lng:120.6660,svc:['temple'],dn:'古生物殿堂',big:1},
  {n:'台中市政府',lat:24.1617,lng:120.6469,svc:['inn'],dn:'議事之城'},
  {n:'國家歌劇院',lat:24.1626,lng:120.6406,svc:['inn','temple'],dn:'曲面音之殿',big:1},
  {n:'秋紅谷',lat:24.1673,lng:120.6380,svc:['temple'],dn:'低窪湖谷'},
  {n:'逢甲夜市',lat:24.1789,lng:120.6465,svc:['shop','inn'],dn:'不夜市集',big:1}
];
TOWNS.forEach((t,i)=>{t.i=i;t.id='T'+i;[t.x,t.y]=toM(t.lat,t.lng)});
const ARTERIALS=[
  [[24.1372,120.6869],[24.1430,120.6795],[24.1505,120.6700],[24.1565,120.6600],[24.1620,120.6500],[24.1670,120.6400],[24.1725,120.6290]],
  [[24.1620,120.6845],[24.1500,120.6760],[24.1400,120.6690],[24.1290,120.6610]],
  [[24.1880,120.6490],[24.1700,120.6475],[24.1500,120.6480],[24.1300,120.6500]],
  [[24.1508,120.6330],[24.1508,120.6620],[24.1505,120.6760]],
  [[24.1330,120.6640],[24.1500,120.6640],[24.1660,120.6650]],
  [[24.1480,120.6835],[24.1650,120.6720],[24.1860,120.6610]],
  [[24.1530,120.6660],[24.1660,120.6560],[24.1800,120.6450]],
  [[24.1850,120.6420],[24.1650,120.6435],[24.1450,120.6445]],
  [[24.1600,120.6330],[24.1605,120.6600]],
  [[24.1330,120.6950],[24.1340,120.6800],[24.1350,120.6650]]
];
const WATERS=[[[24.1560,120.6935],[24.1460,120.6895],[24.1372,120.6880],[24.1290,120.6840]],[[24.1560,120.6760],[24.1450,120.6740],[24.1350,120.6700],[24.1270,120.6680]]];
const PARKS=[{lat:24.1442,lng:120.6840,r:190,lake:70},{lat:24.1673,lng:120.6380,r:130,lake:60},{lat:24.1626,lng:120.6406,r:95}];
const STRIPS=[[[24.1573,120.6660],[24.1500,120.6648],[24.1420,120.6635]]];
const GRIDS=[{c:[24.1420,120.6810],a:42,s:115,R:1300},{c:[24.1600,120.6500],a:-8,s:165,R:2000},{c:[24.1785,120.6470],a:20,s:85,R:520},{c:[24.1480,120.6620],a:5,s:140,R:900}];
const BOUND=3600; // meters from station
let RD={};
function genRoads(){const minor=[],G=GRIDS.map(g=>({...g,cm:toM(g.c[0],g.c[1]),ar:g.a*Math.PI/180}));
  const own=(x,y)=>{let best=null,bd=1e9;for(const g of G){const d=Math.hypot(x-g.cm[0],y-g.cm[1])/g.R;if(d<bd){bd=d;best=g}}return bd<=1?best:null};
  G.forEach((g,gi)=>{const n=Math.ceil(g.R/g.s)+1,ca=Math.cos(g.ar),sa=Math.sin(g.ar);
    const P=(i,j)=>{const jx=((h(i,j,gi*7+1)%100)/100-.5)*g.s*.18,jy=((h(i,j,gi*7+2)%100)/100-.5)*g.s*.18,u=i*g.s+jx,v=j*g.s+jy;return[g.cm[0]+u*ca-v*sa,g.cm[1]+u*sa+v*ca]};
    for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++){const a=P(i,j);for(const [di,dj,k] of [[1,0,3],[0,1,4]]){const b=P(i+di,j+dj);if(own((a[0]+b[0])/2,(a[1]+b[1])/2)!==g)continue;if(h(i,j,gi*11+k)%100<16)continue;minor.push([a,b])}}});
  const major=ARTERIALS.map(r=>r.map(p=>toM(p[0],p[1]))),water=WATERS.map(r=>r.map(p=>toM(p[0],p[1]))),strips=STRIPS.map(r=>r.map(p=>toM(p[0],p[1])));
  const mk=lines=>{const p=new Path2D();for(const l of lines){p.moveTo(l[0][0],l[0][1]);for(let k=1;k<l.length;k++)p.lineTo(l[k][0],l[k][1])}return p};
  const segs=[];minor.forEach(s=>segs.push(s));major.forEach(l=>{for(let k=1;k<l.length;k++)segs.push([l[k-1],l[k]])});
  RD={minor:mk(minor),major:mk(major),water:mk(water),strips:mk(strips),segs,parks:PARKS.map(p=>({...p,m:toM(p.lat,p.lng)}))}}
function snapRoad(x,y,maxD){let best=null,bd=maxD;for(const [a,b] of RD.segs){if(Math.min(a[0],b[0])-maxD>x||Math.max(a[0],b[0])+maxD<x||Math.min(a[1],b[1])-maxD>y||Math.max(a[1],b[1])+maxD<y)continue;
    const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1))),px=a[0]+t*dx,py=a[1]+t*dy,d=Math.hypot(x-px,y-py);if(d<bd){bd=d;best=[px,py]}}return best}

/* ================= extra sprites for the game map ================= */
Object.assign(SPR,{
  house:["....rrrrrrrr....","...rrrrrrrrrr...","..rrrrrrrrrrrr..",".rrrrrrrrrrrrrr.","rrrrrrrrrrrrrrrr",".wwwwwwwwwwwwww.",".wbbwwwkkwwwbbw.",".wbbwwwkkwwwbbw.",".wwwwwwkkwwwwww.","..xxxxxxxxxxxx.."],
  pine:[".......g........","......ggg.......",".....ggggg......","......ggg.......",".....ggggg......","....ggggggg.....",".....ggggg......","....ggggggg.....","...ggggggggg....","..ggggggggggg...",".......t........",".......t........"],
  well:["....rrrrrrrr....","....r......r....","....r......r....","...xxxxxxxxxx...","...xbbbbbbbbx...","...xxxxxxxxxx..."],
  lamp:["......yy........",".....yyyy.......","......kk........","......kk........","......kk........","......kk........",".....kkkk......."],
  inn:["...rrrrrrrrrr...","..rrrrrrrrrrrr..",".rrrrrrrrrrrrrr.","rrrrrrrrrrrrrrrr",".wwwwwwwwwwwwww.",".wbbwwwwwwwwbbw.",".wbbwwyyyywwbbw.",".wwwwwwwwwwwwww.",".wbbwwwkkwwwbbw.",".wbbwwwkkwwwbbw.",".wwwwwwkkwwwwww.","..xxxxxxxxxxxx.."]
});
const HOUSEPALS=[{r:'#8a4636',w:'#d9cdb4',b:'#f2c14e',k:'#3b2a1a',x:'#6f6a60'},{r:'#5b5f46',w:'#cfc3a8',b:'#f2c14e',k:'#3b2a1a',x:'#6f6a60'},{r:'#6a4a32',w:'#e0d6bf',b:'#9fd4ef',k:'#3b2a1a',x:'#6f6a60'}];
const TPAL={pine:{g:'#2f6b3a',t:'#5e4027'},well:{r:'#7a5230',x:'#8a8577',b:'#3f7fb8'},lamp:{y:'#ffd877'},inn:{r:'#9a3b2c',w:'#e0d6bf',b:'#f2c14e',y:'#ffd877',x:'#6f6a60'}};
function townLayout(t){const r=rng(h(t.i,7,99)),items=[],n=t.big?13:9;
  items.push(t.svc.includes('temple')?{dx:0,dy:0,spr:'shrine',pal:PAL.shrine}:{dx:0,dy:-2,spr:'crystal',pal:PAL.crystal,glow:1});
  if(t.svc.includes('inn'))items.push({dx:-20,dy:6,spr:'inn',pal:TPAL.inn});
  if(t.svc.includes('shop'))items.push({dx:20,dy:6,spr:'shop',pal:PAL.shop});
  for(let k=0;k<n;k++){const a=k/n*6.28+r()*.5,rad=24+r()*16,q=r();items.push({dx:Math.cos(a)*rad,dy:Math.sin(a)*rad*.7+4,spr:q<.7?'house':q<.85?'well':'lamp',pal:q<.7?HOUSEPALS[fl(r()*3)]:TPAL[q<.85?'well':'lamp']})}
  for(let k=0;k<(t.big?12:8);k++){const a=r()*6.28,rad=42+r()*14;items.push({dx:Math.cos(a)*rad,dy:Math.sin(a)*rad*.7+4,spr:'pine',pal:TPAL.pine})}
  return items.sort((a,b)=>a.dy-b.dy)}
TOWNS.forEach(t=>t.items=townLayout(t));

/* ================= extra sprites ================= */
Object.assign(SPR,{
  chest:["....kkkkkkkk....","...kbbbbbbbbk...","..kbbbbbbbbbbk..","..kyyyyyyyyyyk..","..kbbbbyybbbbk..","..kbbbbkkbbbbk..","..kbbbbbbbbbbk..","..kyyyyyyyyyyk..","..kkkkkkkkkkkk.."],
  mimic:["....kkkkkkkk....","...kbbbbbbbbk...","..kbbebbbbebbk..","..kyyyyyyyyyyk..","..kwkwkwkwkwkk..","..k..........k..","..kwkwkwkwkwkk..","..kbbbbbbbbbbk..","..kyyyyyyyyyyk..","..kkkkkkkkkkkk.."],
  rift:["......pppp......","....pppqqppp....","...ppqqqqqqpp...","..ppqqwwwwqqpp..","..pqqwwkkwwqqp..","..pqqwkkkkwqqp..","..pqqwwkkwwqqp..","..ppqqwwwwqqpp..","...ppqqqqqqpp...","....pppqqppp....","......pppp......"],
  fountain:["......c.c.......",".......c........","......ccc.......","...xxxxxxxxx....","..xcccccccccx...","..xcccccccccx...","...xxxxxxxxx....","....xx...xx....."],
  merchant:["....rrrrrrrr....","...rwrwrwrwrw...","..rwrwrwrwrwrw..","..bbbbbbbbbbbb..","..bggbyybggbbb..","..bbbbbbbbbbbb..","...kk......kk...","..kwwk....kwwk..","...kk......kk..."]
});
Object.assign(PAL,{chest:{b:'#9a5a2a',y:'#f2c14e'},rift:{p:'#6a3fb0',q:'#a06ee6',w:'#e6d4ff'},fountain:{c:'#7fe0ff',x:'#a8a49a'},merchant:{r:'#2f7fb8',w:'#eef0f2',b:'#8a5a2f',g:'#7bd36b',y:'#f2c14e'}});

/* ================= fog of war ================= */
const FOGR=20, FOGN=Math.ceil(BOUND*2/FOGR), REVEAL=170;
const fogC=document.createElement('canvas');fogC.width=fogC.height=FOGN;const fogX=fogC.getContext('2d');const fogM=new Uint8Array(FOGN*FOGN);let fogCount=0;
function fogReset(){fogX.globalCompositeOperation='source-over';fogX.fillStyle='#0a080d';fogX.fillRect(0,0,FOGN,FOGN);fogM.fill(0);fogCount=0}
function reveal(x,y){const cx=(x+BOUND)/FOGR,cy=(y+BOUND)/FOGR,r=REVEAL/FOGR;fogX.globalCompositeOperation='destination-out';const g=fogX.createRadialGradient(cx,cy,r*.55,cx,cy,r);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');fogX.fillStyle=g;fogX.fillRect(cx-r,cy-r,r*2,r*2);
  const rr=Math.ceil(r*.8);for(let j=-rr;j<=rr;j++)for(let i=-rr;i<=rr;i++){if(i*i+j*j>rr*rr)continue;const gx=fl(cx)+i,gy=fl(cy)+j;if(gx<0||gy<0||gx>=FOGN||gy>=FOGN)continue;const k=gy*FOGN+gx;if(!fogM[k]){fogM[k]=1;fogCount++}}}
function revealed(x,y){const gx=fl((x+BOUND)/FOGR),gy=fl((y+BOUND)/FOGR);if(gx<0||gy<0||gx>=FOGN||gy>=FOGN)return false;return fogM[gy*FOGN+gx]===1}
const EXPL_TOTAL=Math.round(Math.PI*(2500/FOGR)**2);
const explPct=()=>Math.min(100,fogCount/EXPL_TOTAL*100);
const MILES=[1,2,4,7,10,15,20];
function trailStep(force){const [x,y]=toM(S.lat,S.lng),last=S.trail[S.trail.length-1];if(force||!last||Math.hypot(last[0]-x,last[1]-y)>30){S.trail.push([Math.round(x),Math.round(y)]);reveal(x,y);
    const ms=MILES[S.explMs];if(ms&&explPct()>=ms){S.explMs++;const g=60+ms*20,c=rollCur(2);S.gold+=g;giveCur(c);toast(`探索度達到 ${ms}%！+${g} 金幣、1 個${CURI[c].n}`);addLog(`探索度達到 ${ms}%`);sfx('level')}}}

/* ================= spawns ================= */
let spawnAt=null;const MCELL=130,DCELL=450,SCELL=350,CCELL=260,EVMS=REFRESH;
const evEp=()=>fl(now()/EVMS);
function nearTown(x,y,r){return TOWNS.some(t=>Math.hypot(t.x-x,t.y-y)<r)}
function genEntities(){const out=new Map(),[px,py]=toM(S.lat,S.lng),ep=epoch(),ee=evEp(),R=950,st=stats(),dens=Math.min(70,42*(1+st.lure/100)+(dayPhase().night>.5?8:0));
  const cells=(c,rad,fn)=>{for(let i=fl((px-rad)/c);i<=fl((px+rad)/c);i++)for(let j=fl((py-rad)/c);j<=fl((py+rad)/c);j++)fn(i,j)};
  const put=(id,o)=>{const [la,ln]=toLL(o.x,o.y);out.set(id,{id,lat:la,lng:ln,...o})};
  cells(MCELL,R,(i,j)=>{const r=h(i,j,ep+77);if(r%100>=dens)return;const id=`m${i}_${j}_${ep}`;if(S.defeated[id])return;let x=(i+((r>>>8)%100)/100)*MCELL,y=(j+((r>>>16)%100)/100)*MCELL;
    if(Math.hypot(x,y)>BOUND||nearTown(x,y,120))return;const p=snapRoad(x,y,80);if(!p)return;[x,y]=p;const lv=Math.max(1,S.lv+((r>>>4)%3)-1),base=pickMon(r>>>12,lv),q=h(i,j,ep+5)%100;
    const rar=q<(S.lv>=3?4:0)?2:q<(S.lv>=3?20:8)?1:0,mods=rar?rollMods(h(i,j,ep+9),rar===2?3:1+(q%2)):[];put(id,{kind:'monster',x,y,lv,base,rar,mods,name:rar?makeEnemy(base,lv,rar,mods).name:base.name,ph:r%628/100})});
  cells(DCELL,R+300,(i,j)=>{const r=h(i,j,41);if(r%100>=30)return;const x=(i+.15+((r>>>8)%70)/100)*DCELL,y=(j+.15+((r>>>16)%70)/100)*DCELL;if(Math.hypot(x,y)>BOUND||nearTown(x,y,160))return;put(`d${i}_${j}`,{kind:'dungeon',x,y,lv:S.lv+1,name:'洞窟'})});
  cells(SCELL,R,(i,j)=>{const r=h(i,j,53);if(r%100>=30)return;let x=(i+((r>>>8)%100)/100)*SCELL,y=(j+((r>>>16)%100)/100)*SCELL;if(Math.hypot(x,y)>BOUND||nearTown(x,y,140))return;const p=snapRoad(x,y,90);if(!p)return;[x,y]=p;put(`p${i}_${j}`,{kind:'shrine',x,y,name:'福德祠'})});
  cells(CCELL,R,(i,j)=>{const r=h(i,j,ep+311);if(r%100>=16)return;const id=`c${i}_${j}_${ep}`;if(S.defeated[id])return;let x=(i+((r>>>8)%100)/100)*CCELL,y=(j+((r>>>16)%100)/100)*CCELL;if(Math.hypot(x,y)>BOUND||nearTown(x,y,100))return;const p=snapRoad(x,y,80);if(!p)return;[x,y]=p;put(id,{kind:'chest',x,y,name:'寶箱',mimic:(r>>>20)%100<12})});
  TOWNS.forEach(t=>{out.set(t.id,{id:t.id,kind:'town',x:t.x,y:t.y,lat:t.lat,lng:t.lng,name:t.n,t});
    const r=h(t.i,ee,131);if(r%100>=55)return;const types=['merchant','rift','fountain','bounty'],type=types[(r>>>8)%4],a=((r>>>12)%360)*Math.PI/180,d=180+(r>>>20)%140;let x=t.x+Math.cos(a)*d,y=t.y+Math.sin(a)*d;const p=snapRoad(x,y,120);if(p)[x,y]=p;
    const id=`e${t.i}_${ee}`;if(S.cleared[id]===ee)return;
    if(type==='bounty'){const base=pickMon(r,S.lv+1);put(id,{kind:'monster',x,y,lv:S.lv+1,base,rar:2,mods:rollMods(r>>>3,3),bounty:id,name:makeEnemy(base,S.lv+1,2,rollMods(r>>>3,3)).name,ph:1,ev:true})}
    else put(id,{kind:'event',sub:type,x,y,lv:S.lv+1,town:t.n,name:{merchant:'流浪商人',rift:'魔物裂隙',fountain:'祝福泉'}[type],ev:true})});
  S.bases.forEach(b=>{const [x,y]=toM(b.lat,b.lng);out.set('b'+b.id,{id:'b'+b.id,kind:'base',x,y,lat:b.lat,lng:b.lng,b,name:baseName(b)})});
  return out}
function refreshEntities(force){const ep=epoch()*1000+evEp()*10+(dayPhase().night>.5?1:0)+fl(stats().lure/5)*100000;if(!force&&spawnAt&&dist(S.lat,S.lng,spawnAt[0],spawnAt[1])<120&&spawnAt[2]===ep)return;spawnAt=[S.lat,S.lng,ep];ENT=genEntities()}
let VIS={x:0,y:0,r:600};
const MOBILE=new Set(['monster','chest','event']);
const visible=e=>e.kind==='town'||e.kind==='base'?true:MOBILE.has(e.kind)?Math.hypot(e.x-VIS.x,e.y-VIS.y)<=VIS.r:revealed(e.x,e.y);
function isDone(e){return(e.kind==='dungeon'&&S.cleared[e.id]===epoch())||(e.kind==='event'&&S.cleared[e.id]===evEp())}
const townLv=t=>S.lv+1+fl(Math.hypot(t.x,t.y)/1500);

/* ================= world rendering ================= */
const wv=$('world'),wx=wv.getContext('2d');let VW=390,VH=844,VD=1;
const cam={x:0,y:0,z:.62};const ZMIN=.18,ZMAX=1.6;
function sizeWorld(){VD=Math.min(2,window.devicePixelRatio||1);VW=window.innerWidth;VH=window.innerHeight;wv.width=Math.round(VW*VD);wv.height=Math.round(VH*VD)}
const SX=x=>(x-cam.x)*cam.z+VW/2, SY=y=>(y-cam.y)*cam.z+VH*.46;
let BGPAT=null;
function bgPattern(){const c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d'),r=rng(7);x.fillStyle='#211d22';x.fillRect(0,0,96,96);for(let i=0;i<700;i++){x.fillStyle=r()<.5?'rgba(255,240,220,.025)':'rgba(0,0,0,.08)';x.fillRect(fl(r()*96),fl(r()*96),2,2)}return wx.createPattern(c,'repeat')}
function glow(c,x,y,r,col,a){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${col},${a})`);g.addColorStop(1,`rgba(${col},0)`);c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)}
function label(c,txt,x,y,size,col,box){c.font=`${size}px DotGothic16, "Noto Sans TC", sans-serif`;c.textAlign='center';c.textBaseline='middle';if(box){const w=c.measureText(txt).width+14;c.fillStyle='rgba(20,16,22,.82)';c.fillRect(x-w/2,y-size*.8,w,size*1.6);c.strokeStyle='rgba(201,164,92,.6)';c.lineWidth=1;c.strokeRect(x-w/2+.5,y-size*.8+.5,w-1,size*1.6-1)}
  else{c.lineWidth=3;c.strokeStyle='rgba(0,0,0,.85)';c.strokeText(txt,x,y)}c.fillStyle=col;c.fillText(txt,x,y)}
const sprScale=()=>Math.max(1.3,Math.min(2.4,1.2+cam.z*1.3));
function renderWorld(t){const c=wx,[pmx,pmy]=toM(S.lat,S.lng),st=stats(),dp=dayPhase();VIS={x:pmx,y:pmy,r:st.vision};if(follow){cam.x+=(pmx-cam.x)*.18;cam.y+=(pmy-cam.y)*.18}
  c.setTransform(VD,0,0,VD,0,0);c.imageSmoothingEnabled=false;if(!BGPAT)BGPAT=bgPattern();c.save();c.translate(-((cam.x*cam.z)%96),-((cam.y*cam.z)%96));c.fillStyle=BGPAT;c.fillRect(-96,-96,VW+192,VH+192);c.restore();
  const z=cam.z;c.save();c.setTransform(VD*z,0,0,VD*z,VD*(VW/2-cam.x*z),VD*(VH*.46-cam.y*z));c.lineCap='round';c.lineJoin='round';
  c.lineWidth=Math.max(5,2/z);c.strokeStyle='rgba(160,82,58,.32)';for(const tw of TOWNS){c.beginPath();c.arc(tw.x,tw.y,230,0,6.28);c.stroke()}
  for(const p of RD.parks){c.fillStyle='rgba(52,74,50,.75)';c.beginPath();c.arc(p.m[0],p.m[1],p.r,0,6.28);c.fill();if(p.lake){c.fillStyle='#2e4658';c.beginPath();c.ellipse(p.m[0],p.m[1],p.lake*1.3,p.lake,.4,0,6.28);c.fill()}}
  c.strokeStyle='rgba(52,74,50,.8)';c.lineWidth=46;c.stroke(RD.strips);c.strokeStyle='#2e4658';c.lineWidth=Math.max(12,3/z);c.stroke(RD.water);
  c.strokeStyle='rgba(178,140,104,.16)';c.lineWidth=Math.max(18,5/z);c.stroke(RD.minor);c.strokeStyle='rgba(196,164,126,.5)';c.lineWidth=Math.max(9,2.4/z);c.stroke(RD.minor);
  c.strokeStyle='rgba(190,150,110,.2)';c.lineWidth=Math.max(34,8/z);c.stroke(RD.major);c.strokeStyle='rgba(214,184,146,.72)';c.lineWidth=Math.max(17,4/z);c.stroke(RD.major);
  c.fillStyle='rgba(242,193,78,.09)';c.strokeStyle='rgba(242,193,78,.85)';c.lineWidth=2/z;c.setLineDash([6/z,5/z]);c.beginPath();c.arc(pmx,pmy,RANGE,0,6.28);c.fill();c.stroke();
  if(simTarget){const [tx,ty]=toM(simTarget[0],simTarget[1]);c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=2.5/z;c.setLineDash([3/z,5/z]);c.beginPath();c.moveTo(pmx,pmy);c.lineTo(tx,ty);c.stroke();c.setLineDash([]);c.fillStyle='rgba(255,255,255,.8)';c.beginPath();c.arc(tx,ty,4/z,0,6.28);c.fill()}
  c.setLineDash([]);c.restore();
  const s=sprScale(),list=[];
  for(const e of ENT.values()){const x=SX(e.x),y=SY(e.y);if(x<-140||x>VW+140||y<-140||y>VH+160)continue;if(!visible(e))continue;
    if(e.kind==='town'){for(const it of e.t.items)list.push({y:y+it.dy*s,draw:()=>{if(it.glow)glow(c,x+it.dx*s,y+it.dy*s-14*s,26*s,'111,220,255',.35+.15*Math.sin(t/400));drawSpr(c,it.spr,it.pal,x+it.dx*s,y+it.dy*s,s)}});continue}
    let name,pal,bob=0,flp=false,sc=s;
    if(e.kind==='monster'){name=e.base.spr;pal=e.base.pal;bob=Math.sin(t/260+e.ph)*1.5;flp=e.base.spr==='boar'||e.base.spr==='wolf';if(e.rar===2)sc=s*1.25}
    else if(e.kind==='base'){name=e.b.type==='main'?'castle':'camp';pal=PAL[name]}else if(e.kind==='event'){name=e.sub;pal=PAL[e.sub]}else{name=e.kind;pal=PAL[e.kind]}
    list.push({y,draw:()=>{if(e.kind==='monster'&&e.rar)glow(c,x,y-8*sc,(e.rar===2?30:22)*sc,e.rar===2?'242,210,94':'110,160,255',.45+.15*Math.sin(t/300+e.ph));
      if(e.kind==='event')glow(c,x,y-10*s,30*s,e.sub==='rift'?'170,110,255':e.sub==='fountain'?'120,220,255':'255,220,140',.4+.15*Math.sin(t/350));
      c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(x,y,6.5*sc,2*sc,0,0,6.28);c.fill();if(isDone(e))c.globalAlpha=.4;drawSpr(c,name,pal,x,y+bob,sc,flp);c.globalAlpha=1;
      if(e.kind==='monster'&&cam.z>.32)label(c,(e.bounty?'懸賞 ':'')+'Lv'+e.lv,x,y-17*sc,11,e.bounty?'#ff8a6a':RCOL[e.rar||0]);if(e.kind==='event'&&cam.z>.3)label(c,e.name,x,y-20*s,11,'#f2d9a6');if(e.kind==='shrine')glow(c,x,y-10*s,16*s,'255,90,60',.3)}})}
  const hx=SX(pmx),hy=SY(pmy),walking=!!simTarget;
  list.push({y:hy,draw:()=>{glow(c,hx,hy-10*s,34*s,'255,220,160',.18);c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.ellipse(hx,hy,7*s,2.2*s,0,0,6.28);c.fill();drawSpr(c,'heroF',heroPal(),hx,hy-(walking?Math.abs(Math.sin(t/90))*3:0),s+.3)}});
  list.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
  // fog
  c.save();c.imageSmoothingEnabled=true;c.globalAlpha=.62;c.setTransform(VD*z*FOGR,0,0,VD*z*FOGR,VD*(VW/2+(-BOUND-cam.x)*z),VD*(VH*.46+(-BOUND-cam.y)*z));c.drawImage(fogC,0,0);c.restore();
  if(dp.night>0){const r=st.vision*z,hx0=SX(pmx),hy0=SY(pmy),g=c.createRadialGradient(hx0,hy0,r*.7,hx0,hy0,r);const a=.82*dp.night;g.addColorStop(0,'rgba(6,8,24,0)');g.addColorStop(1,`rgba(6,8,24,${a})`);c.fillStyle=g;c.fillRect(0,0,VW,VH);
    c.fillStyle=`rgba(40,50,120,${.18*dp.night})`;c.fillRect(0,0,VW,VH);c.strokeStyle=`rgba(255,220,140,${.35*dp.night})`;c.lineWidth=1.5;c.setLineDash([4,6]);c.beginPath();c.arc(hx0,hy0,r,0,6.28);c.stroke();c.setLineDash([])}
  else{c.strokeStyle='rgba(255,236,190,.12)';c.lineWidth=1.5;c.setLineDash([4,8]);c.beginPath();c.arc(SX(pmx),SY(pmy),st.vision*z,0,6.28);c.stroke();c.setLineDash([])}
  if(dp.night>0&&dp.night<1){c.fillStyle=`rgba(255,140,60,${.08*(1-Math.abs(dp.night-.5)*2)})`;c.fillRect(0,0,VW,VH)}
  for(const tw of TOWNS){const x=SX(tw.x),y=SY(tw.y);if(x<-100||x>VW+100||y<-80||y>VH+80)continue;const known=revealed(tw.x,tw.y)||S.found[tw.id];
    if(!known){glow(c,x,y-10,40,'111,220,255',.25+.1*Math.sin(t/500));c.globalAlpha=.55;drawSpr(c,'crystal',PAL.crystal,x,y,s);c.globalAlpha=1}
    if(cam.z>.24)label(c,known?tw.n:'未探索的城鎮',x,y+62*s*.7*(known?1:.5),13,known?'#f2d9a6':'#9a90a8',true)}
  arrows(c,pmx,pmy)}
function arrows(c,pmx,pmy){const near=TOWNS.map(t=>({t,d:Math.hypot(t.x-pmx,t.y-pmy)})).sort((a,b)=>a.d-b.d).slice(0,3);
  for(const {t,d} of near){const x=SX(t.x),y=SY(t.y);if(x>20&&x<VW-20&&y>90&&y<VH-130)continue;const cx=VW/2,cy=VH*.46,a=Math.atan2(y-cy,x-cx),rx=VW/2-30,ry=VH*.46-110;
    const k=Math.min(Math.abs(rx/Math.cos(a)),Math.abs(ry/Math.sin(a))),ax=cx+Math.cos(a)*k,ay=cy+Math.sin(a)*k;c.save();c.translate(ax,ay);c.rotate(a);c.fillStyle='rgba(242,193,78,.9)';c.beginPath();c.moveTo(10,0);c.lineTo(-6,-7);c.lineTo(-6,7);c.fill();c.restore();
    label(c,`${S.found[t.id]?t.n:'城鎮'} ${fmtD(d)}`,ax-Math.cos(a)*30,ay-Math.sin(a)*18,11,'#f2d9a6')}}

/* ================= input ================= */
const ptrs=new Map();let drag=null,pinch=null;
wv.addEventListener('pointerdown',ev=>{audioInit();wv.setPointerCapture(ev.pointerId);ptrs.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});if(ptrs.size===1)drag={x:ev.clientX,y:ev.clientY,cx:cam.x,cy:cam.y,moved:false};
  if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:cam.z};drag=null}});
wv.addEventListener('pointermove',ev=>{if(!ptrs.has(ev.pointerId))return;ptrs.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
  if(pinch&&ptrs.size===2){const [a,b]=[...ptrs.values()];cam.z=Math.max(ZMIN,Math.min(ZMAX,pinch.z*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d));return}
  if(drag){const dx=ev.clientX-drag.x,dy=ev.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)>8){drag.moved=true;follow=false}if(drag.moved){cam.x=drag.cx-dx/cam.z;cam.y=drag.cy-dy/cam.z}}});
let tapOK=false;const endPtr=ev=>{tapOK=!!(drag&&!drag.moved&&ptrs.size===1&&ev.type==='pointerup');ptrs.delete(ev.pointerId);if(ptrs.size<2)pinch=null;if(!ptrs.size)drag=null};
wv.addEventListener('click',ev=>{if(!tapOK)return;tapOK=false;tapWorld(ev.clientX,ev.clientY)});
wv.addEventListener('pointerup',endPtr);wv.addEventListener('pointercancel',endPtr);
wv.addEventListener('wheel',ev=>{ev.preventDefault();cam.z=Math.max(ZMIN,Math.min(ZMAX,cam.z*Math.exp(-ev.deltaY*.0015)))},{passive:false});
function tapWorld(x,y){if(busy())return;const s=sprScale();let best=null,bd=1e9;
  for(const e of ENT.values()){if(!visible(e))continue;const ex=SX(e.x),ey=SY(e.y)-(e.kind==='town'?4*s:8*s),r=e.kind==='town'?46*s/2+20:26;const d=Math.hypot(x-ex,y-ey);if(d<r&&d<bd){bd=d;best=e}}
  if(best){sfx('tap');openEnt(best.id);return}
  const wxm=(x-VW/2)/cam.z+cam.x,wym=(y-VH*.46)/cam.z+cam.y;if(Math.hypot(wxm,wym)>BOUND){toast('這個 demo 只做了台中車站周邊的區域');sfx('nope');return}
  const p=snapRoad(wxm,wym,60)||[wxm,wym];simTarget=toLL(p[0],p[1]);follow=true;sfx('tap')}

/* ================= movement ================= */
let lastFrame=0,stepAcc=0;const SIM_SPEED=14;
function setPos(lat,lng,moved){S.lat=lat;S.lng=lng;if(moved){S.walked+=moved;S.walkCur+=moved;stepAcc+=moved;if(stepAcc>14){stepAcc=0;sfx('step');const st=stats();S.hp=Math.min(st.maxhp,S.hp+1);if(fl(S.walked/14)%3===0)S.mp=Math.min(st.maxmp,S.mp+1);renderHud()}
    if(S.walkCur>=1000){S.walkCur-=1000;const c=rollCur(1);giveCur(c);toast(`走了 1 公里！獲得 1 個${CURI[c].n}`);addLog(`步行獎勵：${CURI[c].n}`)}}
  trailStep();refreshEntities();checkArrive()}
function checkArrive(){const b=S.bases.find(b=>dist(S.lat,S.lng,b.lat,b.lng)<25);if(b&&!checkArrive.b){const st=stats();if(S.hp<st.maxhp||S.mp<st.maxmp){fullHeal();toast(`回到${baseName(b)}，狀態全滿`);sfx('heal');renderHud()}}checkArrive.b=!!b;
  for(const t of TOWNS){if(!S.found[t.id]&&dist(S.lat,S.lng,t.lat,t.lng)<120){S.found[t.id]=1;const g=40+S.lv*15,c=rollCur(2);S.gold+=g;S.crystal++;giveCur(c);sfx('level');toast(`發現城鎮「${t.n}」！+${g} 金幣、1 魔晶、1 個${CURI[c].n}`);addLog(`發現城鎮「${t.n}」`);renderHud()}}}
function tick(t){requestAnimationFrame(tick);const dt=Math.min(.1,(t-lastFrame)/1000||0);lastFrame=t;
  if(B&&!$('battle').hidden){renderBattle(t);return}
  if(simTarget&&!busy()){const d=dist(S.lat,S.lng,simTarget[0],simTarget[1]);if(d<1.5)simTarget=null;else{const k=Math.min(1,SIM_SPEED*dt/d);setPos(S.lat+(simTarget[0]-S.lat)*k,S.lng+(simTarget[1]-S.lng)*k,Math.min(d,SIM_SPEED*dt))}}
  renderWorld(t);placeLabel()}
let plT=0;function placeLabel(){if(performance.now()-plT<500)return;plT=performance.now();const [x,y]=toM(S.lat,S.lng);let best=null,bd=1e9;for(const t of TOWNS){const d=Math.hypot(t.x-x,t.y-y);if(d<bd){bd=d;best=t}}
  const nm=S.found[best.id]?best.n:'未知城鎮';$('place').textContent=bd<230?nm:`${nm}${dirName(best.lat,best.lng,S.lat,S.lng)}方 ${fmtD(bd)}`;
  const dp=dayPhase(),hh=String(fl(dp.hr)).padStart(2,'0'),mm=String(fl(dp.hr%1*60)).padStart(2,'0');$('expl').innerHTML=`<span style="color:${dp.night>.5?'#9fb8ff':'#ffd877'}">${dp.label}</span> ${hh}:${mm}・視野 ${stats().vision}m<br>探索 ${explPct().toFixed(1)}%`+(buffOn()?`・祝福 ${Math.ceil((S.buff.until-now())/60e3)} 分`:'')}
