/* 漫步勇者 · 存讀檔與啟動（最後載入） */
'use strict';
/* ================= boot ================= */
/* 0.1.0 肉鴿：存檔格式整個換新（fmt），舊的走路版存檔不讀 */
const SAVE_FMT = 'rogue1';
const saveOk = s => !!s && s.fmt === SAVE_FMT;
function load() {
  try {
    const r = localStorage.getItem(KEY),
      s = r ? JSON.parse(r) : null;
    return saveOk(s) ? s : null;
  } catch (e) {
    return null;
  }
}
function save() {
  CLOUD.dirty = true;
  S.savedAt = Date.now();
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {
    saveFail(e);
  }
}
/* 存檔寫不進 localStorage（多半是手機空間滿了）：提示玩家，最多 5 分鐘一次；雲端存檔照常上傳 */
let saveErrAt = 0;
function saveFail(e) {
  console.error('save failed', e);
  if (Date.now() - saveErrAt < 300e3) return;
  saveErrAt = Date.now();
  toast(
    CLOUD.uid
      ? '本機存檔失敗（空間可能不足），進度改存在雲端'
      : '本機存檔失敗（空間可能不足），請清出手機空間或登入帳號備份'
  );
}
/* 讀進來的存檔：缺的欄位用新遊戲的預設值補上（之後加欄位不用寫版本轉換） */
function migrate(s) {
  const d = newGame();
  for (const k in d) if (s[k] === undefined) s[k] = d[k];
  for (const k in d.meta) if (s.meta[k] === undefined) s.meta[k] = d.meta[k];
  return s;
}
/* 換了存檔（雲端載入、登入）後整個畫面重畫 */
function refreshAll() {
  renderHud();
  homeRender();
  if (sheetName) renderSheet();
}
function start() {
  const local = load();
  S = migrate(local || newGame());
  cloudInit().then(remote => {
    if (saveOk(remote) && (!local || (remote.savedAt || 0) > (local.savedAt || 0))) {
      S = migrate(remote);
      try {
        localStorage.setItem(KEY, JSON.stringify(S));
      } catch (e) {
        saveFail(e);
      }
      refreshAll();
      toast('已從雲端載入存檔');
    } else cloudPush();
  });
  document.querySelectorAll('canvas[data-icon]').forEach(c => paintIcon(c, c.dataset.icon));
  refreshAll();
  requestAnimationFrame(tick);
}
start();
