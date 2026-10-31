/* dungeonPOE · 存檔與啟動（最後載入） */
'use strict';
let DPR = 1;
function load() {
  try {
    const r = localStorage.getItem(KEY + SLOT);
    return r ? JSON.parse(r) : null;
  } catch (e) {
    return null;
  }
}
function save() {
  if (!S) return;
  S.savedAt = Date.now();
  try {
    localStorage.setItem(KEY + SLOT, JSON.stringify(S));
  } catch (e) {
    console.warn('存檔失敗', e);
  }
  if (typeof CLOUD !== 'undefined') CLOUD.dirty = true;
}
/* 存檔版本 S.v：10 是 0.2.0 重製（0.1 的存檔是 1～3，規則完全不同，直接開新角色） */
function migrate(s) {
  if (!s || !s.v || s.v < 10) return newGame();
  const o = { ...newGame(), ...s };
  /* 存檔 11（0.2.2）：技能寶石、天賦樹、核心樹；0.2.1 以前固定的 5 招換成寶石 */
  if (s.v < 11) {
    o.skills = ['slash', 'blade', 'whirl', 'iai', 'storm'].map(g => ({ a: mkGem(g), s: [null, null] }));
    o.v = 11;
  }
  /* 存檔 12（0.2.3）：天賦樹換成一千多點的大樹，點數全部退回；核心樹改成昇華（到藏身處的昇華石碑選） */
  if (o.v < 12) {
    o.pt = [...PT_START];
    o.asc = null;
    o.at = [];
    delete o.ct;
    o.v = 12;
  }
  /* 存檔 13（0.2.4）：天賦樹換成 18 條各不相同的路線（點數退回）；狂魔改成魔劍士、昇華圖案換新（昇華點退回）；光環欄 */
  if (o.v < 13) {
    o.pt = [...PT_START];
    if (o.asc && !ASC.sword.br[o.asc]) o.asc = null;
    o.at = o.asc ? ['a_st'] : [];
    o.auras = Array(AURA_SLOTS).fill(null);
    o.v = 13;
  }
  /* 天賦樹的形狀換過（點的編號對不上）就把點數全部退回 */
  if (o.pt.some(id => !PTREE.I[id])) o.pt = [...PT_START];
  /* 道具編號接著存檔裡最大的往下編 */
  for (const it of [
    ...Object.values(o.eq),
    ...o.inv.items,
    ...o.stash.items,
    ...o.skills.flatMap(k => [k.a, ...k.s]),
    ...o.auras
  ])
    if (it && it.id > IID) IID = it.id;
  /* 0.2.6：舊裝備補上品質 0、孔 0、潛能 3（不重骰，免得讀檔洗出好底材） */
  for (const it of [...Object.values(o.eq), ...o.inv.items, ...o.stash.items])
    if (it && !it.gem && it.q == null) Object.assign(it, { q: 0, so: 0, pot: 3 });
  /* 飛刃、千本櫻改成要拿短刀：裝著這兩招的，送一把短刀到背包（只送一次） */
  if (!o.gotDagger && o.skills.some(k => k.a && ['blade', 'storm'].includes(k.a.gem))) {
    o.gotDagger = 1;
    const d = mkItem('w_short', 1, 0);
    if (!gridAuto(o.inv, d)) gridAuto(o.stash, d);
  }
  return o;
}
let NARROW = false;
function resize() {
  DPR = Math.min(2, devicePixelRatio || 1);
  /* 手機：畫面高度看得到差不多的範圍；背包格子照寬度（夠寬就兩個面板並排） */
  NARROW = innerWidth < 800;
  ZOOM = TOUCH.on ? clamp(innerHeight / 470, 0.72, 1.35) : 1.35;
  C = TOUCH.on ? clamp(Math.floor(((NARROW ? innerWidth : innerWidth / 2) - 44) / 12), 26, 36) : 36;
  document.documentElement.style.setProperty('--cell', C + 'px');
  if (S) hudPanels();
  CV.width = Math.round(innerWidth * DPR);
  CV.height = Math.round(innerHeight * DPR);
}
function start() {
  CV = $('cv');
  CX = CV.getContext('2d');
  resize();
  addEventListener('resize', resize);
  S = migrate(load());
  ST = stats();
  hudInit();
  enterHideout();
  inputInit();
  treeInit();
  touchInit();
  cloudInit().then(remote => {
    if (remote && remote.v >= 10 && (remote.savedAt || 0) > (S.savedAt || 0)) {
      S = migrate(remote);
      enterHideout();
      save();
      hudWarn('已從雲端載入存檔');
    } else cloudPush();
  });
  setInterval(save, 10000);
  requestAnimationFrame(frame);
}
start();
