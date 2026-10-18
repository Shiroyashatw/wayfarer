/* 漫步勇者 · 存讀檔與啟動（最後載入） */
'use strict';
/* ================= boot ================= */
function load(){try{const r=localStorage.getItem(KEY);return r?JSON.parse(r):null}catch(e){return null}}
function save(){CLOUD.dirty=true;S.savedAt=Date.now();try{const ep=epoch();for(const k in S.defeated)if((k[0]==='m'||k[0]==='c')&&!k.endsWith('_'+ep))delete S.defeated[k];if(S.trail.length>4000)S.trail=S.trail.slice(-4000);localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function rebuildWorld(){fogReset();S.trail.forEach(([x,y])=>reveal(x,y));trailStep(true);[cam.x,cam.y]=toM(S.lat,S.lng);refreshEntities(true);renderHud();if(sheetName)renderSheet()}
function migrate(s){if(!s.treeV2){s.tree=[startOf(s.cls)];s.treeV2=1}return s}
function start(){const local=load();S=migrate(local||newGame());cloudInit().then(remote=>{if(remote&&(!local||(remote.savedAt||0)>(local.savedAt||0))){S=migrate(remote);delete S.intro;try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}rebuildWorld();toast('已從雲端載入存檔')}else cloudPush()});document.querySelectorAll('canvas[data-icon]').forEach(c=>paintIcon(c,c.dataset.icon));genRoads();sizeWorld();fogReset();S.trail.forEach(([x,y])=>reveal(x,y));trailStep(true);
  [cam.x,cam.y]=toM(S.lat,S.lng);refreshEntities(true);renderHud();
  if(S.intro){delete S.intro;addLog('冒險開始！');showModal(`漫步勇者 v${VER}`,`<p>真實世界就是你的冒險地圖。道路跟著真實街道走，知名地點會變成城鎮。</p><p class="sub">一開始地圖被迷霧覆蓋，走過的地方才會揭開。點路面讓角色走過去，走進黃色圈內就能戰鬥、開寶箱、參拜。發光的怪物是菁英，掉寶更好；城鎮附近會出現限時事件。背包裡已經放了幾件裝備、一盞提燈和一些通貨，可以先試試改造裝備。晚上視野會縮小，提燈能照得更遠，但也會引來更多怪物。</p>`,[{label:'選擇職業',pri:1,fn:()=>{hideModal();classPicker(()=>{checkArrive();save()})}}])}else checkArrive();
  requestAnimationFrame(tick)}
start();
