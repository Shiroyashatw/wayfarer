/* 在 Node 裡載入遊戲的純邏輯（不含畫面）：core、data、items、bag、sim、run。給機器人訓練、大量模擬用。
   用法：const G = require('./game_node'); G.simLobby(seed, 1300) … 全部遊戲的全域都在 G 上。
   這些檔案是瀏覽器用的一般 <script>（共用全域），這裡用 vm 在同一個 context 依序執行，補上需要的假 location、S。 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const R = path.join(__dirname, '..');
const FILES = ['core', 'data', 'items', 'bag', 'sim', 'run', 'bot'];

function load() {
  const ctx = {
    console,
    Math,
    JSON,
    Date,
    performance: { now: () => Number(process.hrtime.bigint() / 1000n) / 1000 },
    location: { search: '' },
    URLSearchParams,
    /* run.js 的 newRun／endRun 會讀存檔 S（分數、場數），給一份最小的 */
    S: { rating: 1000, games: 0, best: 9, hist: [], seen: {} }
  };
  vm.createContext(ctx);
  /* 檔案裡的頂層 const／function 在同一個 context 共用；最後把需要的名稱掛到 G 上 */
  let src = FILES.map(f => fs.readFileSync(path.join(R, 'js', f + '.js'), 'utf8')).join('\n;\n');
  const names = [...src.matchAll(/^(?:const|let|function)\s+([A-Za-z_$][\w$]*)/gm)].map(m => m[1]);
  src +=
    '\n;globalThis.__G = {' +
    [...new Set(names)].map(n => `${n}: typeof ${n} !== 'undefined' ? ${n} : undefined`).join(',') +
    '};';
  vm.runInContext(src, ctx, { filename: 'game.js' });
  const G = ctx.__G;
  G.__ctx = ctx;
  return G;
}
module.exports = load();
