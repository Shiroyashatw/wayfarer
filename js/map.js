/* 漫步勇者 · 世界地圖：全台灣真實道路（OpenStreetMap）、城鎮、分塊迷霧、怪物生成、攝影機、GPS */
'use strict';
/* ================= world coordinates: meters from 台中車站 (x 東, y 南) ================= */
const O={lat:24.1372,lng:120.6869};const KX=111320*Math.cos(O.lat*Math.PI/180),KY=110540;
const toM=(lat,lng)=>[(lng-O.lng)*KX,-(lat-O.lat)*KY];
const toLL=(x,y)=>[O.lat-y/KY,O.lng+x/KX];
/* 地標城鎮。前 11 個是 0.1.x 的台中城鎮，id 不能變（存檔的 found 用 T0～T10） */
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
  {n:'逢甲夜市',lat:24.1789,lng:120.6465,svc:['shop','inn'],dn:'不夜市集',big:1},
  {n:'台北車站',lat:25.0478,lng:121.5170,svc:['inn','shop'],dn:'鐵道迷宮',big:1},
  {n:'台北101',lat:25.0340,lng:121.5645,svc:['inn','shop'],dn:'天際之塔',big:1},
  {n:'西門町',lat:25.0421,lng:121.5081,svc:['shop'],dn:'霓虹街區'},
  {n:'龍山寺',lat:25.0372,lng:121.4999,svc:['temple'],dn:'千年古剎'},
  {n:'士林夜市',lat:25.0880,lng:121.5241,svc:['shop','inn'],dn:'不夜迷宮'},
  {n:'中正紀念堂',lat:25.0346,lng:121.5218,svc:['temple'],dn:'白色殿堂'},
  {n:'淡水老街',lat:25.1700,lng:121.4400,svc:['shop'],dn:'夕陽港灣'},
  {n:'九份老街',lat:25.1097,lng:121.8452,svc:['shop','inn'],dn:'山城霧街',big:1},
  {n:'基隆廟口',lat:25.1283,lng:121.7430,svc:['shop','temple'],dn:'港都夜市'},
  {n:'桃園車站',lat:24.9894,lng:121.3135,svc:['inn','shop'],dn:'桃源驛站'},
  {n:'新竹城隍廟',lat:24.8040,lng:120.9660,svc:['temple','shop'],dn:'風城神殿'},
  {n:'新竹車站',lat:24.8016,lng:120.9716,svc:['inn'],dn:'風城驛站'},
  {n:'苗栗車站',lat:24.5703,lng:120.8226,svc:['inn'],dn:'山線驛站'},
  {n:'八卦山大佛',lat:24.0790,lng:120.5470,svc:['temple'],dn:'大佛山',big:1},
  {n:'鹿港老街',lat:24.0570,lng:120.4340,svc:['shop','temple'],dn:'古港迷巷'},
  {n:'日月潭',lat:23.8650,lng:120.9150,svc:['temple','inn'],dn:'湖中秘境',big:1},
  {n:'嘉義車站',lat:23.4795,lng:120.4410,svc:['inn','shop'],dn:'桃城驛站'},
  {n:'阿里山',lat:23.5100,lng:120.8030,svc:['temple','inn'],dn:'神木森林',big:1},
  {n:'赤崁樓',lat:22.9975,lng:120.2025,svc:['temple'],dn:'赤崁古樓',big:1},
  {n:'安平古堡',lat:23.0016,lng:120.1606,svc:['temple'],dn:'紅磚城塞'},
  {n:'花園夜市',lat:23.0110,lng:120.2060,svc:['shop','inn'],dn:'府城夜市'},
  {n:'高雄車站',lat:22.6394,lng:120.3025,svc:['inn','shop'],dn:'港都驛站'},
  {n:'駁二藝術特區',lat:22.6200,lng:120.2820,svc:['shop'],dn:'港倉藝境',big:1},
  {n:'六合夜市',lat:22.6320,lng:120.2990,svc:['shop','inn'],dn:'南國夜市'},
  {n:'蓮池潭',lat:22.6800,lng:120.2940,svc:['temple'],dn:'龍虎塔'},
  {n:'屏東車站',lat:22.6690,lng:120.4860,svc:['inn'],dn:'阿猴驛站'},
  {n:'墾丁大街',lat:21.9460,lng:120.7980,svc:['shop','inn'],dn:'南國海街',big:1},
  {n:'宜蘭車站',lat:24.7546,lng:121.7580,svc:['inn','shop'],dn:'蘭陽驛站'},
  {n:'羅東夜市',lat:24.6770,lng:121.7710,svc:['shop'],dn:'林場夜市'},
  {n:'花蓮車站',lat:23.9930,lng:121.6010,svc:['inn','shop'],dn:'洄瀾驛站'},
  {n:'太魯閣',lat:24.1590,lng:121.6220,svc:['temple'],dn:'大理石峽谷',big:1},
  {n:'台東車站',lat:22.7930,lng:121.1230,svc:['inn','shop'],dn:'後山驛站'},
  {n:'澎湖馬公',lat:23.5660,lng:119.5660,svc:['inn','temple'],dn:'海島古城'},
  {n:'金門模範街',lat:24.4330,lng:118.3180,svc:['shop','temple'],dn:'戰地古厝'}
];
TOWNS.forEach((t,i)=>{t.i=i;t.id='T'+i;[t.x,t.y]=toM(t.lat,t.lng)});

/* ================= OpenStreetMap vector tiles ================= */
/* 道路資料來自 OpenFreeMap 的向量圖磚（OpenStreetMap，z14，一張約 2.2 公里見方）。
   只取道路、水域、河流、公園與宗教場所，解析後存在 IndexedDB；下載失敗就用生成道路頂替，之後再重試 */
const TZ=14,TN=1<<TZ,BK=100,CHV=2;
const lng2tx=lng=>(lng+180)/360*TN, lat2ty=lat=>{const r=lat*Math.PI/180;return(1-Math.asinh(Math.tan(r))/Math.PI)/2*TN};
const tx2lng=x=>x/TN*360-180, ty2lat=y=>Math.atan(Math.sinh(Math.PI*(1-2*y/TN)))*180/Math.PI;
const m2t=(x,y)=>{const [la,ln]=toLL(x,y);return[lng2tx(ln),lat2ty(la)]};
function tileRect(tx,ty){const [x0,y0]=toM(ty2lat(ty),tx2lng(tx)),[x1,y1]=toM(ty2lat(ty+1),tx2lng(tx+1));return{x0,y0,x1,y1}}
const CHUNKS=new Map();let chunkVer=0,chunkBusy=0,chunkRfT=0;const chunkQ=[];
const ckey=(cx,cy)=>cx+','+cy;
const IDB=(()=>{let p=null;const open=()=>p||(p=new Promise(res=>{try{const r=indexedDB.open('wayfarer_osm',1);r.onupgradeneeded=()=>r.result.createObjectStore('c');r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)}catch(e){res(null)}}));
  return{get:async k=>{const db=await open();if(!db)return null;return new Promise(res=>{try{const q=db.transaction('c').objectStore('c').get(k);q.onsuccess=()=>res(q.result||null);q.onerror=()=>res(null)}catch(e){res(null)}})},
    put:async(k,v)=>{const db=await open();if(!db)return;try{db.transaction('c','readwrite').objectStore('c').put(v,k)}catch(e){}}}})();
/* 最小的 Mapbox Vector Tile 解碼器：只讀需要的圖層，回傳 {圖層:[{type,tags,rings:[[[u,v]...]]}]}，u、v 是 0～1 的圖磚內座標 */
function decodeMVT(buf,want){const b=new Uint8Array(buf),out={},td=new TextDecoder();let p=0;
  const vint=()=>{let v=0,s=1,c;do{c=b[p++];v+=(c&127)*s;s*=128}while(c&128);return v};
  const skip=w=>{if(w===0)vint();else if(w===1)p+=8;else if(w===2){const n=vint();p+=n}else if(w===5)p+=4};
  const str=(a,e)=>td.decode(b.subarray(a,e));
  while(p<b.length){const tag=vint(),f=Math.floor(tag/8),w=tag&7;if(f!==3||w!==2){skip(w);continue}const len=vint(),end=p+len;
    let name='',ext=4096,drop=false;const keys=[],vals=[],feats=[];
    while(p<end){const t=vint(),ff=Math.floor(t/8),ww=t&7;
      if(ff===1&&ww===2){const n=vint();name=str(p,p+n);p+=n;if(!want.has(name)){drop=true;break}}
      else if(ff===3&&ww===2){const n=vint();keys.push(str(p,p+n));p+=n}
      else if(ff===4&&ww===2){const n=vint(),ve=p+n;let v=null;while(p<ve){const vt=vint(),vf=Math.floor(vt/8),vw=vt&7;if(vf===1&&vw===2){const m=vint();v=str(p,p+m);p+=m}else if(vw===0)v=vint();else skip(vw)}vals.push(v)}
      else if(ff===5&&ww===0)ext=vint();
      else if(ff===2&&ww===2){const n=vint(),fe=p+n;let type=0,tags=null,geom=null;
        while(p<fe){const ft=vint(),fff=Math.floor(ft/8),fw=ft&7;if(fff===2&&fw===2){const m=vint(),me=p+m;tags=[];while(p<me)tags.push(vint())}else if(fff===3&&fw===0)type=vint();
          else if(fff===4&&fw===2){const m=vint(),me=p+m,g=[];while(p<me)g.push(vint());geom=g}else skip(fw)}
        feats.push({type,tags,geom})}
      else skip(ww)}
    p=end;if(drop||!name)continue;
    out[name]=feats.map(ft=>{const tg={};if(ft.tags)for(let i=0;i<ft.tags.length;i+=2)tg[keys[ft.tags[i]]]=vals[ft.tags[i+1]];const rings=[];let x=0,y=0,cur=null;const g=ft.geom||[];let i=0;
      while(i<g.length){const c=g[i++],id=c&7,cnt=Math.floor(c/8);if(id===7){if(cur&&cur.length)cur.push(cur[0]);continue}
        for(let k=0;k<cnt;k++){const dx=g[i++],dy=g[i++];x+=(dx>>>1)^-(dx&1);y+=(dy>>>1)^-(dy&1);if(id===1){cur=[];rings.push(cur)}cur.push([x/ext,y/ext])}}
      return{type:ft.type,tags:tg,rings}})}
  return out}
const ROADS={motorway:'M',trunk:'M',primary:'M',secondary:'M',tertiary:'m',minor:'m'};
/* MVT → 精簡格式 {l:[[種類, x0,y0,x1,y1...]], t:[[x,y,名稱]]}，座標是世界公尺。種類 M 主幹道 m 巷道 w 河 W 水域 p 公園 */
function compactTile(tx,ty,L){const l=[],t=[],pt=(u,v)=>{const [x,y]=toM(ty2lat(ty+v),tx2lng(tx+u));return[Math.round(x),Math.round(y)]};
  const push=(k,ring)=>{if(ring.length<2)return;const a=[k];for(const [u,v] of ring){const [x,y]=pt(u,v);if(a.length>1&&a[a.length-2]===x&&a[a.length-1]===y)continue;a.push(x,y)}if(a.length>=5)l.push(a)};
  for(const f of L.water||[])if(f.type===3)f.rings.forEach(r=>push('W',r));
  for(const f of L.park||[])if(f.type===3)f.rings.forEach(r=>push('p',r));
  for(const f of L.waterway||[])if(f.type===2&&f.tags.class!=='drain'&&f.tags.class!=='ditch')f.rings.forEach(r=>push('w',r));
  for(const f of L.transportation||[]){const k=ROADS[f.tags.class];if(k&&f.type===2&&f.tags.brunnel!=='tunnel')f.rings.forEach(r=>push(k,r))}
  for(const f of L.poi||[])if(f.tags.class==='place_of_worship'&&f.rings[0]&&f.rings[0][0]){const [x,y]=pt(...f.rings[0][0]);t.push([x,y,f.tags['name:zh-Hant']||f.tags.name||'廟宇'])}
  return{v:CHV,l,t}}
/* 下載失敗時的生成道路：歪斜的格狀街道 */
function genChunk(tx,ty){const R=tileRect(tx,ty),l=[],r=rng(h(tx,ty,991)),s=110+fl(r()*60),a=(r()-.5)*.6,ca=Math.cos(a),sa=Math.sin(a),ox=(R.x0+R.x1)/2,oy=(R.y0+R.y1)/2,n=Math.ceil((R.x1-R.x0)/s/2)+1;
  const P=(i,j)=>[ox+(i*s)*ca-(j*s)*sa,oy+(i*s)*sa+(j*s)*ca];
  for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++){for(const [di,dj] of [[1,0],[0,1]]){if(h(i+tx*50,j+ty*50,di*3+7)%100<18)continue;const A=P(i,j),B=P(i+di,j+dj);l.push([(i%4===0&&dj)||(j%4===0&&di)?'M':'m',Math.round(A[0]),Math.round(A[1]),Math.round(B[0]),Math.round(B[1])])}}
  return{v:CHV,l,t:[],gen:1}}
/* 精簡資料 → 可以畫的 Path2D 與找路用的線段格子索引 */
function buildChunk(tx,ty,d){const R=tileRect(tx,ty),P={M:new Path2D(),m:new Path2D(),w:new Path2D(),W:new Path2D(),p:new Path2D()},bk=new Map(),GW=Math.ceil((R.x1-R.x0)/BK),GH=Math.ceil((R.y1-R.y0)/BK);let segN=0;
  for(const a of d.l){const k=a[0],path=P[k];path.moveTo(a[1],a[2]);for(let i=3;i<a.length;i+=2)path.lineTo(a[i],a[i+1]);if(k==='W'||k==='p')path.closePath();
    if(k==='M'||k==='m')for(let i=3;i<a.length;i+=2){const s=[a[i-2],a[i-1],a[i],a[i+1]];segN++;
      for(let gx=Math.max(0,fl((Math.min(s[0],s[2])-R.x0)/BK));gx<=Math.min(GW-1,fl((Math.max(s[0],s[2])-R.x0)/BK));gx++)for(let gy=Math.max(0,fl((Math.min(s[1],s[3])-R.y0)/BK));gy<=Math.min(GH-1,fl((Math.max(s[1],s[3])-R.y0)/BK));gy++){const q=gx*1000+gy;if(!bk.has(q))bk.set(q,[]);bk.get(q).push(s)}}}
  return{st:'ok',gen:!!d.gen,R,P,bk,GW,GH,segN,temples:d.t,at:Date.now()}}
function setChunk(tx,ty,d){CHUNKS.set(ckey(tx,ty),buildChunk(tx,ty,d));chunkVer++;spawnAt=null;clearTimeout(chunkRfT);chunkRfT=setTimeout(()=>{if(S&&!B&&!MB)refreshEntities(true)},400)}
let tileURL=null;
async function tileTemplate(){if(tileURL)return tileURL;try{const c=JSON.parse(localStorage.getItem('wayfarer_tiles')||'null');if(c&&Date.now()-c.t<7*864e5)return tileURL=c.u}catch(e){}
  const r=await fetch('https://tiles.openfreemap.org/planet');const j=await r.json();tileURL=j.tiles[0];try{localStorage.setItem('wayfarer_tiles',JSON.stringify({u:tileURL,t:Date.now()}))}catch(e){}return tileURL}
const WANT=new Set(['transportation','water','waterway','park','poi']);
async function fetchChunk(tx,ty){const k=`t${TZ}/${tx}/${ty}`,cached=await IDB.get(k);if(cached&&cached.v===CHV){setChunk(tx,ty,cached);return}
  for(let tries=0;tries<2;tries++){try{const u=(await tileTemplate()).replace('{z}',TZ).replace('{x}',tx).replace('{y}',ty);const r=await fetch(u);
      if(!r.ok){if(r.status===404){tileURL=null;try{localStorage.removeItem('wayfarer_tiles')}catch(e){}}throw new Error(r.status)}
      const d=compactTile(tx,ty,decodeMVT(await r.arrayBuffer(),WANT));IDB.put(k,d);setChunk(tx,ty,d);return}catch(e){await new Promise(r=>setTimeout(r,1500))}}
  setChunk(tx,ty,genChunk(tx,ty))}
function pumpChunks(){while(chunkBusy<3&&chunkQ.length){const [tx,ty]=chunkQ.shift();chunkBusy++;fetchChunk(tx,ty).finally(()=>{chunkBusy--;pumpChunks()})}}
/* 確保 (x,y) 周圍 rad 公尺內的圖磚都已載入或在排隊；生成道路的圖磚一分鐘後重試真實地圖 */
function ensureChunks(x,y,rad){const [a,b]=m2t(x-rad,y-rad),[c,d]=m2t(x+rad,y+rad),[mx,my]=m2t(x,y),add=[];
  for(let tx=fl(a);tx<=fl(c);tx++)for(let ty=fl(b);ty<=fl(d);ty++){const k=ckey(tx,ty),old=CHUNKS.get(k);if(old&&!(old.gen&&Date.now()-old.at>60e3))continue;if(!old)CHUNKS.set(k,{st:'loading'});else old.at=Date.now();add.push([tx,ty])}
  if(add.length){chunkQ.push(...add);chunkQ.sort((p,q)=>Math.hypot(p[0]+.5-mx,p[1]+.5-my)-Math.hypot(q[0]+.5-mx,q[1]+.5-my));pumpChunks()}}
const chunkAt=(x,y)=>{const [tx,ty]=m2t(x,y);return CHUNKS.get(ckey(fl(tx),fl(ty)))};
const mapLoading=()=>{const c=chunkAt(...toM(S.lat,S.lng));return!c||c.st!=='ok'};
/* 和矩形 (x0,y0)-(x1,y1) 重疊的已載入圖磚 */
function tilesIn(x0,y0,x1,y1){const [a,b]=m2t(x0,y0),[c,d]=m2t(x1,y1),out=[];for(let tx=fl(a);tx<=fl(c);tx++)for(let ty=fl(b);ty<=fl(d);ty++){const q=CHUNKS.get(ckey(tx,ty));if(q&&q.st==='ok')out.push(q)}return out}
function snapRoad(x,y,maxD){let best=null,bd=maxD;
  for(const c of tilesIn(x-maxD,y-maxD,x+maxD,y+maxD)){const R=c.R;
    for(let gx=Math.max(0,fl((x-maxD-R.x0)/BK));gx<=Math.min(c.GW-1,fl((x+maxD-R.x0)/BK));gx++)for(let gy=Math.max(0,fl((y-maxD-R.y0)/BK));gy<=Math.min(c.GH-1,fl((y+maxD-R.y0)/BK));gy++){const list=c.bk.get(gx*1000+gy);if(!list)continue;
      for(const [ax,ay,bx,by] of list){const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1))),px=ax+t*dx,py=ay+t*dy,d=Math.hypot(x-px,y-py);if(d<bd){bd=d;best=[px,py]}}}}
  return best}

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

/* ================= fog of war (chunked) ================= */
/* 迷霧跟著地圖方格切塊，每塊 50×50 格（每格 20 公尺）；沒走過的方格不用建立 */
const CH=1000,FOGR=20,FOGC=CH/FOGR,REVEAL=170,FOG=new Map();let fogCount=0;
function fogReset(){FOG.clear();fogCount=0}
function fogChunk(cx,cy){const k=ckey(cx,cy);let f=FOG.get(k);if(!f){const c=document.createElement('canvas');c.width=c.height=FOGC;const x=c.getContext('2d');x.fillStyle='#0a080d';x.fillRect(0,0,FOGC,FOGC);f={c,x,m:new Uint8Array(FOGC*FOGC)};FOG.set(k,f)}return f}
function reveal(x,y){const R=REVEAL;for(let cx=fl((x-R)/CH);cx<=fl((x+R)/CH);cx++)for(let cy=fl((y-R)/CH);cy<=fl((y+R)/CH);cy++){const f=fogChunk(cx,cy),lx=(x-cx*CH)/FOGR,ly=(y-cy*CH)/FOGR,r=R/FOGR;
    f.x.globalCompositeOperation='destination-out';const g=f.x.createRadialGradient(lx,ly,r*.55,lx,ly,r);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');f.x.fillStyle=g;f.x.fillRect(lx-r,ly-r,r*2,r*2);
    const rr=Math.ceil(r*.8);for(let j=-rr;j<=rr;j++)for(let i=-rr;i<=rr;i++){if(i*i+j*j>rr*rr)continue;const gx=fl(lx)+i,gy=fl(ly)+j;if(gx<0||gy<0||gx>=FOGC||gy>=FOGC)continue;const k=gy*FOGC+gx;if(!f.m[k]){f.m[k]=1;fogCount++}}}}
function revealed(x,y){const cx=fl(x/CH),cy=fl(y/CH),f=FOG.get(ckey(cx,cy));if(!f)return false;return f.m[fl((y-cy*CH)/FOGR)*FOGC+fl((x-cx*CH)/FOGR)]===1}
/* 探索面積（平方公里）。里程碑沿用舊的 1%～20%，換算成面積 */
const explKm2=()=>fogCount*FOGR*FOGR/1e6;
const MILES=[.2,.4,.8,1.4,2,3,4];
function trailStep(force){const [x,y]=toM(S.lat,S.lng),last=S.trail[S.trail.length-1];if(force||!last||Math.hypot(last[0]-x,last[1]-y)>30){S.trail.push([Math.round(x),Math.round(y)]);reveal(x,y);
    const ms=MILES[S.explMs];if(ms&&explKm2()>=ms){S.explMs++;const g=60+S.explMs*30,c=rollCur(2);S.gold+=g;giveCur(c);toast(`探索面積達到 ${ms} 平方公里！+${g} 金幣、1 個${CURI[c].n}`);addLog(`探索面積達到 ${ms} 平方公里`);sfx('level')}}}

/* ================= spawns ================= */
let spawnAt=null;const MCELL=130,DCELL=450,CCELL=260,EVMS=REFRESH;
const evEp=()=>fl(now()/EVMS);
function nearTown(x,y,r){return TOWNS.some(t=>Math.abs(t.x-x)<r&&Math.abs(t.y-y)<r&&Math.hypot(t.x-x,t.y-y)<r)}
/* 格子 (i,j) 上的地城：位置固定，種類與詞綴每次地圖刷新重骰。要在道路附近才會出現 */
function dungeonAt(i,j,ep=epoch()){const r=h(i,j,41);if(r%100>=30)return null;let x=(i+.15+((r>>>8)%70)/100)*DCELL,y=(j+.15+((r>>>16)%70)/100)*DCELL;if(nearTown(x,y,160))return null;
  const p=snapRoad(x,y,220);if(!p)return null;[x,y]=[p[0]+18,p[1]-12];const q=h(i,j,ep*7+43),k=q%100,dt=k<7?(S.lv>=5?'hell':'party'):k<30?'party':'normal',T=DTYPES[dt];
  const n=T.mods[0]+((q>>>8)%(T.mods[1]-T.mods[0]+1)),pool=DMODS.map(m=>m.id),mods=[];for(let a=0;a<n;a++)mods.push(pool.splice((q>>>(10+a*4))%pool.length,1)[0]);
  const [la,ln]=toLL(x,y);return{id:`d${i}_${j}`,kind:'dungeon',x,y,lat:la,lng:ln,dt,mods,lv:S.lv+T.lv,name:T.n}}
/* 只把廟宇當成參拜點；教會、清真寺等不算。同一個 350 公尺格子只放一座，避免市區太密 */
const NOT_TEMPLE=/教會|教堂|聖母|基督|浸信|天主|長老|禮拜|清真|福音|聚會所|召會|摩門|耶穌/;
function genEntities(){const out=new Map(),[px,py]=toM(S.lat,S.lng),ep=epoch(),ee=evEp(),R=950,st=stats(),dens=Math.min(70,42*(1+st.lure/100)+(dayPhase().night>.5?8:0));
  const cells=(c,rad,fn)=>{for(let i=fl((px-rad)/c);i<=fl((px+rad)/c);i++)for(let j=fl((py-rad)/c);j<=fl((py+rad)/c);j++)fn(i,j)};
  const put=(id,o)=>{const [la,ln]=toLL(o.x,o.y);out.set(id,{id,lat:la,lng:ln,...o})};
  cells(MCELL,R,(i,j)=>{const r=h(i,j,ep+77);if(r%100>=dens)return;const id=`m${i}_${j}_${ep}`;if(S.defeated[id])return;let x=(i+((r>>>8)%100)/100)*MCELL,y=(j+((r>>>16)%100)/100)*MCELL;
    if(nearTown(x,y,120))return;const p=snapRoad(x,y,80);if(!p)return;[x,y]=p;const q=h(i,j,ep+5)%100,danger=S.lv>=4&&h(i,j,ep+13)%1000<7;
    let lv=Math.max(1,S.lv+((r>>>4)%3)-1),rar=q<(S.lv>=3?4:0)?2:q<(S.lv>=3?20:8)?1:0;if(danger){rar=4;lv=S.lv+3}
    const base=pickMon(r>>>12,lv),mods=rar?rollMods(h(i,j,ep+9),rar===4?4:rar===2?3:1+(q%2)).filter(m=>rar!==4||m!=='tough'):[];put(id,{kind:'monster',x,y,lv,base,rar,mods,name:rar?makeEnemy(base,lv,rar,mods).name:base.name,ph:r%628/100})});
  cells(DCELL,R+300,(i,j)=>{const d=dungeonAt(i,j,ep);if(d)out.set(d.id,d)});
  /* 廟宇：真實地圖上的宗教場所；生成道路的方格才用隨機福德祠 */
  const tcell=new Set();
  for(const c of tilesIn(px-R,py-R,px+R,py+R)){if(c.gen)continue;for(const [x,y,nm] of c.temples){if(Math.hypot(x-px,y-py)>R+200||nearTown(x,y,140)||NOT_TEMPLE.test(nm))continue;const ck=fl(x/350)+','+fl(y/350);if(tcell.has(ck))continue;tcell.add(ck);put(`p${x}_${y}`,{kind:'shrine',x,y,name:nm||'廟宇'})}}
  for(let cx=fl((px-R)/CH);cx<=fl((px+R)/CH);cx++)for(let cy=fl((py-R)/CH);cy<=fl((py+R)/CH);cy++){const c=chunkAt(cx*CH+500,cy*CH+500);if(!c||!c.gen)continue;
    const r=h(cx,cy,53);if(r%100<70){const x=cx*CH+((r>>>8)%800)+100,y=cy*CH+((r>>>16)%800)+100,p=snapRoad(x,y,120);if(p&&!nearTown(p[0],p[1],140))put(`p${cx}_${cy}`,{kind:'shrine',x:p[0],y:p[1],name:'福德祠'})}}
  cells(CCELL,R,(i,j)=>{const r=h(i,j,ep+311);if(r%100>=16)return;const id=`c${i}_${j}_${ep}`;if(S.defeated[id])return;let x=(i+((r>>>8)%100)/100)*CCELL,y=(j+((r>>>16)%100)/100)*CCELL;if(nearTown(x,y,100))return;const p=snapRoad(x,y,80);if(!p)return;[x,y]=p;put(id,{kind:'chest',x,y,name:'寶箱',mimic:(r>>>20)%100<12})});
  TOWNS.forEach(t=>{if(Math.abs(t.x-px)>6000||Math.abs(t.y-py)>6000)return;out.set(t.id,{id:t.id,kind:'town',x:t.x,y:t.y,lat:t.lat,lng:t.lng,name:t.n,t});
    const r=h(t.i,ee,131);if(r%100>=55)return;const types=['merchant','rift','fountain','bounty'],type=types[(r>>>8)%4],a=((r>>>12)%360)*Math.PI/180,d=180+(r>>>20)%140;let x=t.x+Math.cos(a)*d,y=t.y+Math.sin(a)*d;const p=snapRoad(x,y,120);if(p)[x,y]=p;
    const id=`e${t.i}_${ee}`;if(S.cleared[id]===ee)return;
    if(type==='bounty'){const base=pickMon(r,S.lv+1);put(id,{kind:'monster',x,y,lv:S.lv+1,base,rar:2,mods:rollMods(r>>>3,3),bounty:id,name:makeEnemy(base,S.lv+1,2,rollMods(r>>>3,3)).name,ph:1,ev:true})}
    else put(id,{kind:'event',sub:type,x,y,lv:S.lv+1,town:t.n,name:{merchant:'流浪商人',rift:'魔物裂隙',fountain:'祝福泉'}[type],ev:true})});
  S.bases.forEach(b=>{const [x,y]=toM(b.lat,b.lng);out.set('b'+b.id,{id:'b'+b.id,kind:'base',x,y,lat:b.lat,lng:b.lng,b,name:baseName(b)})});
  return out}
function refreshEntities(force){const [px,py]=toM(S.lat,S.lng);ensureChunks(px,py,1400);S.bases.forEach(b=>{const [bx,by]=toM(b.lat,b.lng);ensureChunks(bx,by,1500)});
  const ep=epoch()*1000+evEp()*10+(dayPhase().night>.5?1:0)+fl(stats().lure/5)*100000+chunkVer*1e9;if(!force&&spawnAt&&dist(S.lat,S.lng,spawnAt[0],spawnAt[1])<120&&spawnAt[2]===ep)return;spawnAt=[S.lat,S.lng,ep];ENT=genEntities()}
let VIS={x:0,y:0,r:600};
const MOBILE=new Set(['monster','chest','event']);
const visible=e=>e.kind==='town'||e.kind==='base'?true:MOBILE.has(e.kind)?Math.hypot(e.x-VIS.x,e.y-VIS.y)<=VIS.r:revealed(e.x,e.y);
function isDone(e){return(e.kind==='dungeon'&&S.cleared[e.id]===epoch())||(e.kind==='event'&&S.cleared[e.id]===evEp())}
const townLv=t=>S.lv+1+(t.big?1:0);

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
/* 畫面內看得到的方格範圍 */
function viewChunks(){const hw=VW/2/cam.z+60,hh=VH/cam.z+60,out=[];for(let cx=fl((cam.x-hw)/CH);cx<=fl((cam.x+hw)/CH);cx++)for(let cy=fl((cam.y-hh)/CH);cy<=fl((cam.y+hh)/CH);cy++)out.push([cx,cy]);return out}
let camLoadT=0;
function renderWorld(t){const c=wx,[pmx,pmy]=toM(S.lat,S.lng),st=stats(),dp=dayPhase();VIS={x:pmx,y:pmy,r:st.vision};if(follow){cam.x+=(pmx-cam.x)*.18;cam.y+=(pmy-cam.y)*.18}
  if(performance.now()-camLoadT>800){camLoadT=performance.now();ensureChunks(cam.x,cam.y,Math.min(2200,Math.max(VW,VH)/cam.z*.6))}
  c.setTransform(VD,0,0,VD,0,0);c.imageSmoothingEnabled=false;if(!BGPAT)BGPAT=bgPattern();c.save();c.translate(-((cam.x*cam.z)%96),-((cam.y*cam.z)%96));c.fillStyle=BGPAT;c.fillRect(-96,-96,VW+192,VH+192);c.restore();
  const z=cam.z,hw=VW/2/z+80,vc=tilesIn(cam.x-hw,cam.y-VH*.46/z-80,cam.x+hw,cam.y+VH*.54/z+80);c.save();c.setTransform(VD*z,0,0,VD*z,VD*(VW/2-cam.x*z),VD*(VH*.46-cam.y*z));c.lineCap='round';c.lineJoin='round';
  c.lineWidth=Math.max(5,2/z);c.strokeStyle='rgba(160,82,58,.32)';for(const tw of TOWNS){if(Math.abs(tw.x-cam.x)>5000||Math.abs(tw.y-cam.y)>5000)continue;c.beginPath();c.arc(tw.x,tw.y,230,0,6.28);c.stroke()}
  c.fillStyle='rgba(52,74,50,.75)';for(const q of vc)c.fill(q.P.p);c.fillStyle='#2e4658';for(const q of vc)c.fill(q.P.W);
  c.strokeStyle='#2e4658';c.lineWidth=Math.max(12,3/z);for(const q of vc)c.stroke(q.P.w);
  c.strokeStyle='rgba(178,140,104,.16)';c.lineWidth=Math.max(18,5/z);for(const q of vc)c.stroke(q.P.m);c.strokeStyle='rgba(196,164,126,.5)';c.lineWidth=Math.max(9,2.4/z);for(const q of vc)c.stroke(q.P.m);
  c.strokeStyle='rgba(190,150,110,.2)';c.lineWidth=Math.max(34,8/z);for(const q of vc)c.stroke(q.P.M);c.strokeStyle='rgba(214,184,146,.72)';c.lineWidth=Math.max(17,4/z);for(const q of vc)c.stroke(q.P.M);
  c.fillStyle='rgba(242,193,78,.09)';c.strokeStyle='rgba(242,193,78,.85)';c.lineWidth=2/z;c.setLineDash([6/z,5/z]);c.beginPath();c.arc(pmx,pmy,RANGE,0,6.28);c.fill();c.stroke();
  if(simTarget){const [tx,ty]=toM(simTarget[0],simTarget[1]);c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=2.5/z;c.setLineDash([3/z,5/z]);c.beginPath();c.moveTo(pmx,pmy);c.lineTo(tx,ty);c.stroke();c.setLineDash([]);c.fillStyle='rgba(255,255,255,.8)';c.beginPath();c.arc(tx,ty,4/z,0,6.28);c.fill()}
  c.setLineDash([]);c.restore();
  const s=sprScale(),list=[];
  for(const e of ENT.values()){const x=SX(e.x),y=SY(e.y);if(x<-140||x>VW+140||y<-140||y>VH+160)continue;if(!visible(e))continue;
    if(e.kind==='town'){for(const it of e.t.items)list.push({y:y+it.dy*s,draw:()=>{if(it.glow)glow(c,x+it.dx*s,y+it.dy*s-14*s,26*s,'111,220,255',.35+.15*Math.sin(t/400));drawSpr(c,it.spr,it.pal,x+it.dx*s,y+it.dy*s,s)}});continue}
    let name,pal,bob=0,flp=false,sc=s;
    if(e.kind==='monster'){name=e.base.spr;pal=e.base.pal;bob=Math.sin(t/260+e.ph)*1.5;flp=e.base.spr==='boar'||e.base.spr==='wolf';if(e.rar===2)sc=s*1.25;if(e.rar===4)sc=s*1.45}
    else if(e.kind==='dungeon'){name='dungeon';pal=DTYPES[e.dt].pal;if(e.dt!=='normal')sc=s*1.15}
    else if(e.kind==='base'){name=e.b.type==='main'?'castle':'camp';pal=PAL[name]}else if(e.kind==='event'){name=e.sub;pal=PAL[e.sub]}else{name=e.kind;pal=PAL[e.kind]}
    list.push({y,draw:()=>{if(e.kind==='monster'&&e.rar)glow(c,x,y-8*sc,(e.rar===4?38:e.rar===2?30:22)*sc,RGLOW[e.rar],.45+.15*Math.sin(t/(e.rar===4?160:300)+e.ph));
      if(e.kind==='event')glow(c,x,y-10*s,30*s,e.sub==='rift'?'170,110,255':e.sub==='fountain'?'120,220,255':'255,220,140',.4+.15*Math.sin(t/350));
      if(e.kind==='dungeon'&&e.dt!=='normal')glow(c,x,y-10*s,30*s,e.dt==='hell'?'255,60,40':'110,200,255',.35+.15*Math.sin(t/300));
      c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(x,y,6.5*sc,2*sc,0,0,6.28);c.fill();if(isDone(e))c.globalAlpha=.4;drawSpr(c,name,pal,x,y+bob,sc,flp);c.globalAlpha=1;
      if(e.kind==='monster'&&cam.z>.32)label(c,(e.bounty?'懸賞 ':e.rar===4?'危險 ':'')+'Lv'+e.lv,x,y-17*sc,11,e.bounty?'#ff8a6a':RCOL[e.rar||0]);if(e.kind==='event'&&cam.z>.3)label(c,e.name,x,y-20*s,11,'#f2d9a6');
      if(e.kind==='dungeon'&&cam.z>.3)label(c,`${e.name} Lv${e.lv}`,x,y-20*sc,11,DTYPES[e.dt].col);if(e.kind==='shrine')glow(c,x,y-10*s,16*s,'255,90,60',.3)}})}
  const hx=SX(pmx),hy=SY(pmy),walking=!!simTarget||GPS.moving;
  list.push({y:hy,draw:()=>{glow(c,hx,hy-10*s,34*s,'255,220,160',.18);c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.ellipse(hx,hy,7*s,2.2*s,0,0,6.28);c.fill();drawSpr(c,'heroF',heroPal(),hx,hy-(walking?Math.abs(Math.sin(t/90))*3:0),s+.3)}});
  list.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
  // fog：走過的方格畫迷霧圖，沒走過的方格整塊蓋住
  c.save();c.globalAlpha=.62;c.imageSmoothingEnabled=true;c.fillStyle='#0a080d';
  for(const [cx,cy] of viewChunks()){const x=SX(cx*CH),y=SY(cy*CH),w=CH*z,f=FOG.get(ckey(cx,cy));if(f)c.drawImage(f.c,x-.5,y-.5,w+1,w+1);else c.fillRect(x-.5,y-.5,w+1,w+1)}c.restore();
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
  if(S.gps){toast('GPS 模式：實際走過去就會移動');sfx('nope');return}
  const wxm=(x-VW/2)/cam.z+cam.x,wym=(y-VH*.46)/cam.z+cam.y;
  const p=snapRoad(wxm,wym,60)||[wxm,wym];simTarget=toLL(p[0],p[1]);follow=true;sfx('tap')}

/* ================= movement ================= */
let lastFrame=0,stepAcc=0;const SIM_SPEED=14;
function setPos(lat,lng,moved){S.lat=lat;S.lng=lng;if(moved){S.walked+=moved;S.walkCur+=moved;stepAcc+=moved;if(stepAcc>14){stepAcc=0;sfx('step');const st=stats();S.hp=Math.min(st.maxhp,S.hp+1);if(fl(S.walked/14)%3===0)S.mp=Math.min(st.maxmp,S.mp+1);renderHud()}
    if(S.walkCur>=1000){S.walkCur-=1000;const c=rollCur(1);giveCur(c);toast(`走了 1 公里！獲得 1 個${CURI[c].n}`);addLog(`步行獎勵：${CURI[c].n}`)}}
  trailStep();refreshEntities();checkArrive()}
function checkArrive(){const b=S.bases.find(b=>dist(S.lat,S.lng,b.lat,b.lng)<25);if(b&&!checkArrive.b){const st=stats();if(S.hp<st.maxhp||S.mp<st.maxmp){fullHeal();toast(`回到${baseName(b)}，狀態全滿`);sfx('heal');renderHud()}}checkArrive.b=!!b;
  for(const t of TOWNS){if(!S.found[t.id]&&dist(S.lat,S.lng,t.lat,t.lng)<120){S.found[t.id]=1;const g=40+S.lv*15,c=rollCur(2);S.gold+=g;S.crystal++;giveCur(c);sfx('level');toast(`發現城鎮「${t.n}」！+${g} 金幣、1 魔晶、1 個${CURI[c].n}`);addLog(`發現城鎮「${t.n}」`);renderHud()}}}

/* ================= GPS ================= */
/* 真實定位：像寶可夢 GO 一樣走路移動。速度超過每秒 40 公尺（搭車、瞬移）只更新位置，不算步行距離 */
const GPS={id:null,last:null,moving:false,err:''};
function gpsStart(){if(!navigator.geolocation){GPS.err='這個瀏覽器不支援定位';return false}
  GPS.id=navigator.geolocation.watchPosition(p=>{const {latitude:la,longitude:ln,accuracy:acc}=p.coords,t=p.timestamp;GPS.err='';if(acc>80&&GPS.last)return;
    if(!GPS.last){GPS.last={la,ln,t};simTarget=null;S.lat=la;S.lng=ln;follow=true;trailStep(true);refreshEntities(true);checkArrive();return}
    const d=dist(GPS.last.la,GPS.last.ln,la,ln),dt=Math.max(1,(t-GPS.last.t)/1000);if(d<3)return;GPS.moving=d/dt>.5;setPos(la,ln,d/dt<=40?d:0);GPS.last={la,ln,t}},
    e=>{GPS.err=e.code===1?'沒有定位權限，請在瀏覽器設定允許定位':'暫時抓不到定位';toast(GPS.err)},{enableHighAccuracy:true,maximumAge:5000,timeout:20000});return true}
function gpsStop(){if(GPS.id!=null)navigator.geolocation.clearWatch(GPS.id);GPS.id=null;GPS.last=null;GPS.moving=false}

function tick(t){requestAnimationFrame(tick);const dt=Math.min(.1,(t-lastFrame)/1000||0);lastFrame=t;
  if(MB&&!$('battle').hidden){renderMB(t);return}
  if(B&&!$('battle').hidden){renderBattle(t);return}
  if(simTarget&&!busy()&&!S.gps){const d=dist(S.lat,S.lng,simTarget[0],simTarget[1]);if(d<1.5)simTarget=null;else{const k=Math.min(1,SIM_SPEED*dt/d);setPos(S.lat+(simTarget[0]-S.lat)*k,S.lng+(simTarget[1]-S.lng)*k,Math.min(d,SIM_SPEED*dt))}}
  renderWorld(t);placeLabel()}
const mmss=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return`${fl(s/60)}:${String(s%60).padStart(2,'0')}`};
let plT=0;function placeLabel(){if(performance.now()-plT<500)return;plT=performance.now();
  const dp=dayPhase(),hh=String(fl(dp.hr)).padStart(2,'0'),mm=String(fl(dp.hr%1*60)).padStart(2,'0'),left=REFRESH-now()%REFRESH;
  $('expl').innerHTML=`<span style="color:${dp.night>.5?'#9fb8ff':'#ffd877'}">${dp.label}</span> ${hh}:${mm}・視野 ${stats().vision}m<br><span class="rf${left<60e3?' soon':''}">刷新 ${mmss(left)}</span>・探索 ${explKm2().toFixed(2)} km²`+(buffOn()?`<br>祝福 ${Math.ceil((S.buff.until-now())/60e3)} 分`:'')+(mapLoading()?'<br><span style="color:#9fe7ff">載入地圖中…</span>':'')}
