/* 塞令老師 · 存檔與啟動（最後載入） */
'use strict';
/* 存檔：帳號資料（名字、頭像、分數、戰績、圖鑑、設定）＋進行中的那一局（run） */
const newGame = () => ({
  v: 100,
  name: randName(),
  av: AVATARS[0][0],
  rating: 1000,
  games: 0,
  best: 9,
  hist: [],
  seen: {},
  music: true,
  sfx: true,
  speed: 1,
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
/* 0.4.0 轉型：舊版（漫步勇者）的存檔不轉移，只留名字與聲音設定 */
function migrate(s) {
  if (!s || !s.v || s.v < 100) {
    const n = newGame();
    if (s && s.name && s.name !== '旅人') n.name = s.name;
    if (s && s.music === false) n.music = false;
    if (s && s.sfx === false) n.sfx = false;
    return n;
  }
  const o = { ...newGame(), ...s };
  /* 進行中的一局如果是別的版本（道具或回合表可能變了），直接結束 */
  if (o.run && o.run.ver !== VER) o.run = null;
  /* 開發中用過的預設名字換成隨機名字 */
  if (o.name === '新來的老師') o.name = randName();
  return o;
}
function start() {
  const local = load();
  S = migrate(local);
  cloudInit().then(remote => {
    if (remote && remote.v >= 100 && (remote.savedAt || 0) > (S.savedAt || 0)) {
      S = migrate(remote);
      save();
      render();
      toast('已從雲端載入存檔');
    } else cloudPush();
  });
  render();
}
start();
