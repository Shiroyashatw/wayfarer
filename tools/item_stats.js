/* 道具統計（0.1.61）：跑 N 場機器人對局（6 人一場，跟產生種子一樣的規則、每場隨機賽制），統計每件商店道具：
     出現：商店裡出現幾次（每次刷新都算）
     購買率：出現時被買走的比例（機器人照戰力評估買，越低代表「看到也不想買」）
     持有：最後背包裡有它的比例（每個機器人那局的最後一個背包）
     名次：最後背包裡有它的機器人平均名次（公平是 3.5，越小越好）
   用法：node tools/item_stats.js [場數=60] [分數=1300] [--write]
   --write：寫到 docs/道具統計.md（覆蓋）。機器人不是真人：購買率低可能是道具真的弱，也可能是機器人不會用（看 botPower 有沒有算到）。 */
const fs = require('fs'),
  path = require('path');
const G = require('./game_node');
const ctx = G.__ctx;
const args = process.argv.slice(2),
  N = +args.find(a => /^\d+$/.test(a)) || 60,
  RT = +args.filter(a => /^\d+$/.test(a))[1] || 1300,
  WRITE = args.includes('--write'),
  MIN = 30;
const K = {};
const k = id => (K[id] = K[id] || { offer: 0, buy: 0, hold: 0, place: [], mo: 0, mb: 0 });
/* 主打這件的職業（道具的 for 是職業的主題，例如符文法珠 for staff）：那些機器人看到時買不買 */
const mine = (run, id) => {
  const f = G.ITEMI[id].for,
    C = G.CLSI[run.bag.cls];
  return !!f && !!C && (C.th === f || (C.m || []).some(b => b.tag === f));
};
/* 記錄商店出現、買走：包住 rollShop、buyItem（遊戲裡的呼叫會經過這兩個全域函式） */
const rollShop0 = ctx.rollShop,
  buyItem0 = ctx.buyItem;
ctx.rollShop = function (run, ...a) {
  const r = rollShop0.call(this, run, ...a);
  for (const s of run.shop) if (s) k(s.id).offer++, mine(run, s.id) && k(s.id).mo++;
  return r;
};
ctx.buyItem = function (run, i, ...a) {
  const s = run.shop[i],
    r = buyItem0.call(this, run, i, ...a);
  if (s && typeof r !== 'string') k(s.id).buy++, mine(run, s.id) && k(s.id).mb++;
  return r;
};
const avg = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const t0 = Date.now();
let bots = 0;
for (let g = 0; g < N; g++) {
  const L = G.simLobby(515100 + g * 7919, RT, { short: 1 });
  for (const b of L) {
    const ids = Object.keys(b.snaps);
    if (!ids.length) continue;
    bots++;
    const last = b.snaps[ids[ids.length - 1]].bag,
      seen = new Set(last.it.map(a => a[0]));
    for (const id of seen) {
      k(id).hold++;
      k(id).place.push(b.place);
    }
  }
  if ((g + 1) % 10 === 0) console.error(`${g + 1}/${N} 場（${((Date.now() - t0) / 1000) | 0} 秒）`);
}
const CAT = it =>
  it.tags.includes('pet')
    ? '寵物'
    : it.dmg
      ? '武器'
      : it.block
        ? '盾'
        : it.tags.includes('armor')
          ? '防具'
          : it.pot || it.tags.includes('potion')
            ? '藥水'
            : '飾品';
const rows = G.ITEMS.filter(it => G.shopOK(it)).map(it => {
  const x = K[it.id] || { offer: 0, buy: 0, hold: 0, place: [], mo: 0, mb: 0 };
  return {
    id: it.id,
    n: it.n,
    star: it.star,
    cat: CAT(it),
    offer: x.offer,
    rate: x.offer ? x.buy / x.offer : 0,
    hold: x.hold / bots,
    place: avg(x.place),
    mrate: x.mo >= 10 ? x.mb / x.mo : null
  };
});
/* 同星級同類別比：購買率低於那組中位數一半的標「冷門」 */
const med = a => {
  const s = [...a].sort((x, y) => x - y);
  return s.length ? s[fl(s.length / 2)] : 0;
};
function fl(x) {
  return Math.floor(x);
}
const grp = {};
for (const r of rows) (grp[r.star + r.cat] = grp[r.star + r.cat] || []).push(r.rate);
for (const r of rows) {
  const m = med(grp[r.star + r.cat]);
  r.flag = r.offer < MIN ? '樣本少' : r.rate < m * 0.5 ? '冷門' : r.rate > m * 1.6 && r.rate > 0.1 ? '熱門' : '';
}
const pct = v => (v * 100).toFixed(1) + '%';
let out = `# 道具統計\n\n機器人對局 ${N} 場（${bots} 個機器人、分數 ${RT}、每場隨機賽制），${new Date().toISOString().slice(0, 10)}。\n`;
out += `對口職業購買率＝主打這件的職業（道具的 for）看到時買走的比例；購買率＝商店出現時被買走的比例；持有＝最後背包裡有它的比例；名次＝有它的平均名次（3.5 是平均，越小越好）；冷門／熱門跟同星級、同類別的中位數比。\n\n`;
for (let st = 1; st <= 5; st++) {
  out += `## ${st}★\n\n| 道具 | 類別 | 出現 | 購買率 | 對口職業購買率 | 持有 | 名次 | |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n`;
  for (const r of rows.filter(r => r.star === st).sort((a, b) => a.cat.localeCompare(b.cat) || b.rate - a.rate))
    out += `| ${r.n} | ${r.cat} | ${r.offer} | ${pct(r.rate)} | ${r.mrate == null ? '' : pct(r.mrate)} | ${pct(r.hold)} | ${isNaN(r.place) ? '—' : r.place.toFixed(2)} | ${r.flag} |\n`;
  out += '\n';
}
const cold = rows.filter(r => r.flag === '冷門').sort((a, b) => a.rate - b.rate);
out += `## 冷門（購買率不到同組中位數一半）\n\n${cold.map(r => `- ${r.star}★ ${r.n}（${r.cat}）：購買率 ${pct(r.rate)}${r.mrate == null ? '' : `（對口職業 ${pct(r.mrate)}）`}、持有 ${pct(r.hold)}`).join('\n') || '沒有'}\n`;
if (WRITE) {
  fs.writeFileSync(path.join(__dirname, '..', 'docs', '道具統計.md'), out);
  console.log('寫到 docs/道具統計.md');
} else console.log(out);
console.error(`完成（${((Date.now() - t0) / 1000) | 0} 秒）`);
