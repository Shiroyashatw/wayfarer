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
  /* 道具編號接著存檔裡最大的往下編 */
  for (const it of [...Object.values(o.eq), ...o.inv.items, ...o.stash.items, ...o.skills.flatMap(k => [k.a, ...k.s])])
    if (it && it.id > IID) IID = it.id;
  return o;
}
function resize() {
  DPR = Math.min(2, devicePixelRatio || 1);
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
