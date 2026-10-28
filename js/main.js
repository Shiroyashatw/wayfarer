/* 塞令老師 · 存檔與啟動（最後載入） */
'use strict';
/* 存檔：帳號資料（名字、頭像、分數、戰績、圖鑑、設定）＋進行中的那一局（run） */
const newGame = () => ({
  v: 101,
  /* 0.1.92 玩家等級的經驗、教學關打完了沒 */
  xp: 0,
  tutDone: 0,
  name: randName(),
  av: AVATARS[0][0],
  rating: 1000,
  games: 0,
  best: 9,
  hist: [],
  seen: {},
  sfx: true,
  speed: 1,
  theme: 'dark',
  themeSet: false,
  newsSeen: '',
  run: null,
  tut: 0,
  savedAt: 0
});
function load() {
  try {
    const r = localStorage.getItem(KEY);
    return r ? JSON.parse(r) : null;
  } catch (e) {
    return null;
  }
}
function save() {
  if (!S) return;
  S.savedAt = Date.now();
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {
    console.warn('存檔失敗', e);
  }
  if (typeof CLOUD !== 'undefined') CLOUD.dirty = true;
}
/* 0.1.0 轉型：舊版（漫步勇者）的存檔不轉移，只留名字與音效設定 */
function migrate(s) {
  if (!s || !s.v || s.v < 100) {
    const n = newGame();
    if (s && s.name && s.name !== '旅人') n.name = s.name;
    if (s && s.sfx === false) n.sfx = false;
    return n;
  }
  const o = { ...newGame(), ...s };
  /* 進行中的一局如果是別的版本（道具或回合表可能變了），直接結束 */
  if (o.run && o.run.ver !== VER) o.run = null;
  /* 開發中用過的預設名字換成隨機名字 */
  if (o.name === '新來的老師') o.name = randName();
  /* 0.1.4 預設改成深色：沒自己選過主題的存檔也跟著換 */
  if (!o.themeSet) o.theme = 'dark';
  delete o.music;
  /* 0.1.92 玩家等級：舊存檔全部從 Lv1 開始、賽制道具池回到預設（標準＋巨人國）；打過的不用再玩教學關 */
  if (s.v < 101) Object.assign(o, { v: 101, xp: 0, pick: null, tutDone: (s.games || 0) > 0 ? 1 : 0 });
  /* 0.1.96 印記賽制換成七宗罪：設定裡選了印記的改成七宗罪（等級解鎖照新的表） */
  if (o.pick && o.pick.m)
    o.pick.m = [...new Set(o.pick.m.map(k => (k === 'sigil' ? 'sins' : k)))].filter(k => MODEI[k]);
  /* 0.1.116 巨人國下架：從選的道具池拿掉，沒剩就回到預設（pickNow 看到空的會用 DEF_PICK） */
  if (o.pick && o.pick.t) o.pick.t = o.pick.t.filter(k => POOLTH.some(x => x.k === k));
  /* 0.1.17 頭像換成新的一批：舊的（鍾馗、門神…）不在清單裡就換成第一個 */
  if (!AVATARS.some(x => x[0] === o.av)) o.av = AVATARS[0][0];
  return o;
}
function start() {
  const local = load();
  S = migrate(local);
  /* 0.1.96 有進行中的對局：打開就直接回到對局（手機誤按上一頁跳出去再回來，不會以為紀錄不見） */
  if (S.run && S.run.phase !== 'end') V.scr = 'run';
  cloudInit().then(remote => {
    if (remote && remote.v >= 100 && (remote.savedAt || 0) > (S.savedAt || 0)) {
      S = migrate(remote);
      if (S.run && S.run.phase !== 'end') V.scr = 'run';
      save();
      if (!typing()) render();
      toast('已從雲端載入存檔');
    } else cloudPush();
  });
  render();
}
start();
