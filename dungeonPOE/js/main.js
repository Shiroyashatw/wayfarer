/* dungeonPOE · 存檔與啟動（最後載入） */
'use strict';
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
/* 存檔版本 S.v：1 是 0.1.0；進行中的一局記著遊戲版本，版本不同就算撤離（東西不會不見） */
function migrate(s) {
  if (!s || !s.v) return newGame();
  const o = { ...newGame(), ...s };
  if (o.run && o.run.ver !== VER) {
    finishRun(o, true);
    o.last = null;
  }
  ensureStarter(o);
  if (!o.shop) refreshShop(o);
  return o;
}
function start() {
  S = migrate(load());
  applyTheme();
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => !S.theme && (applyTheme(), render()));
  if (S.run) V.scr = 'run';
  cloudInit().then(remote => {
    if (remote && remote.v && (remote.savedAt || 0) > (S.savedAt || 0)) {
      S = migrate(remote);
      applyTheme();
      V.scr = S.run ? 'run' : 'town';
      save();
      render();
      toast('已從雲端載入存檔');
    } else cloudPush();
  });
  render();
  if (S.run && S.run.pend) pendDlg();
}
start();
