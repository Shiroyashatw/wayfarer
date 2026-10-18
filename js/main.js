/* 漫步勇者 · 存讀檔與啟動（最後載入） */
'use strict';
/* ================= boot ================= */
function load(){try{const r=localStorage.getItem(KEY);return r?JSON.parse(r):null}catch(e){return null}}
function save(){CLOUD.dirty=true;S.savedAt=Date.now();try{const ep=epoch();for(const k in S.defeated)if((k[0]==='m'||k[0]==='c')&&!k.endsWith('_'+ep))delete S.defeated[k];if(S.trail.length>4000)S.trail=S.trail.slice(-4000);localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function rebuildWorld(){fogReset();S.trail.forEach(([x,y])=>reveal(x,y));trailStep(true);[cam.x,cam.y]=toM(S.lat,S.lng);refreshEntities(true);renderHud();if(sheetName)renderSheet()}
function migrate(s){// 0.1.8：天賦樹大改版，舊的節點全部作廢，點數返還
  if((s.treeV||0)<3){const had=s.tree&&s.tree.length>1;s.tree=[startOf(s.cls)];s.treeV=3;delete s.treeV2;if(had&&s.log)s.log.unshift('天賦樹大改版：已點的天賦全部返還，可以重新分配')}
  if((s.v||0)<6){// 0.1.5：改造石換成蛻變石、提燈欄改為副手、新增腰帶欄
    if(s.cur.alt){s.cur.trans=(s.cur.trans||0)+s.cur.alt}delete s.cur.alt;s.cur.regal=s.cur.regal||1;
    const fix=it=>{if(it&&it.slot==='lantern')it.slot='offhand'};s.inv.forEach(fix);Object.values(s.eq).forEach(fix);
    if(!s.eq.offhand)s.eq.offhand=s.eq.lantern||null;delete s.eq.lantern;if(!s.eq.belt)s.eq.belt=null;s.v=6}
  if(s.v<7){// 0.1.6：洗淨石移除，換成增幅石
    if(s.cur.scour){s.cur.aug=(s.cur.aug||0)+s.cur.scour}delete s.cur.scour;s.v=7}
  return s}
function start(){const local=load();S=migrate(local||newGame());cloudInit().then(remote=>{if(remote&&(!local||(remote.savedAt||0)>(local.savedAt||0))){S=migrate(remote);delete S.intro;try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}rebuildWorld();toast('已從雲端載入存檔')}else cloudPush()});document.querySelectorAll('canvas[data-icon]').forEach(c=>paintIcon(c,c.dataset.icon));sizeWorld();if(S.gps)gpsStart();fogReset();S.trail.forEach(([x,y])=>reveal(x,y));trailStep(true);
  [cam.x,cam.y]=toM(S.lat,S.lng);refreshEntities(true);renderHud();
  if(S.intro){delete S.intro;addLog('冒險開始！');showModal(`漫步勇者 v${VER}`,`<p>真實世界就是你的冒險地圖。道路跟著真實街道走，知名地點會變成城鎮。</p><p class="sub">一開始地圖被迷霧覆蓋，走過的地方才會揭開。點路面讓角色走過去，走進黃色圈內就能戰鬥、開寶箱、參拜。發光的怪物是菁英，掉寶更好；城鎮附近會出現限時事件。背包裡已經放了幾件裝備、一盞提燈（裝在副手）、一條腰帶和一些通貨，可以先試試改造裝備。晚上視野會縮小，提燈能照得更遠，但也會引來更多怪物。</p>`,[{label:'選擇職業',pri:1,fn:()=>{hideModal();classPicker(()=>{checkArrive();save()})}}])}else checkArrive();
  requestAnimationFrame(tick)}
start();
