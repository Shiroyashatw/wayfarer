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
/* 存檔版本 S.v：1 是 0.1.0、2 是 0.1.3、3 是 0.1.4；進行中的一局記著遊戲版本，版本不同就算撤離（東西不會不見） */
function migrate(s) {
  if (!s || !s.v) return newGame();
  const o = { ...newGame(), ...s };
  /* 存檔 2（0.1.3）：新手包是 3×3。0.1.2 以前的 4×4 新手包換回 3×3，放不下的放倉庫；鐵匠拿掉 */
  if (s.v < 2) {
    for (const b of o.bags)
      if (b.t === 'b44') {
        const its = b.items.splice(0);
        b.t = 'b33';
        for (const x of its) if (!autoPlace(b, x)) o.wh.push(x);
      }
    o.v = 2;
  }
  /* 存檔 3（0.1.4）：詞綴從 T6～T1 拉寬成 T12～T1，舊的 T 乘 2，數值夾進新的範圍 */
  if (o.v < 3) {
    for (const x of allItems(o))
      for (const a of x.a) {
        a.t = Math.min(12, a.t * 2);
        const [lo, hi] = AFFI[a.id].tiers[a.t - 1];
        a.v = Math.max(lo, Math.min(hi, a.v));
      }
    o.v = 3;
  }
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
