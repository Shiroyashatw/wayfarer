/* 核心統計（0.1.44）：跑 N 場機器人對局（6 人一場，跟產生種子一樣的規則），統計每個職業核心：
   首領三選一出現幾次、被選幾次（選擇率）、最後拿著它的平均名次，以及「第一個核心 × 第二個核心」最常見的組合與名次。
   用法：node tools/core_stats.js [場數=300] [分數=1300] [--write]
   --write：寫到 docs/核心統計.md（覆蓋）。名次越小越好，公平是 (6+1)/2 = 3.5；樣本少於 MIN 的不排名。 */
const fs = require('fs'),
  path = require('path');
const G = require('./game_node');
const args = process.argv.slice(2),
  N = +args.find(a => /^\d+$/.test(a)) || 300,
  RT = +args.filter(a => /^\d+$/.test(a))[1] || 1300,
  WRITE = args.includes('--write'),
  MIN = 8;
const C = {},
  /* 每個核心：offer 出現次數、pick 被選、place 拿著它的名次 */
  K = {},
  /* 組合：第一個＋第二個 */
  P = {};
const avg = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const t0 = Date.now();
for (let g = 0; g < N; g++) {
  const L = G.simLobby(424200 + g * 7919, RT, { short: 1 });
  for (const b of L) {
    const st = b.stat;
    if (!st) continue;
    (C[st.cls] = C[st.cls] || []).push(b.place);
    for (const x of st.log) {
      for (const id of x.o) (K[id] = K[id] || { offer: 0, pick: 0, place: [] }).offer++;
      K[x.p] = K[x.p] || { offer: 0, pick: 0, place: [] };
      K[x.p].pick++;
    }
    for (const id of st.core.filter(Boolean)) K[id].place.push(b.place);
    if (st.core[0] && st.core[1]) {
      const k = st.core[0] + '+' + st.core[1];
      (P[k] = P[k] || []).push(b.place);
    }
  }
}
const nm = id => (G.ITEMI[id] ? G.ITEMI[id].n.split('・').pop() : id);
const f2 = v => (isNaN(v) ? '—' : v.toFixed(2));
let md = `# 核心統計\n\n機器人對局 ${N} 場（6 人一場、分數 ${RT}、${((Date.now() - t0) / 1000).toFixed(0)} 秒），\`node tools/core_stats.js ${N} ${RT} --write\` 產生。名次越小越好（公平 3.5）；「拿著」是打到最後背包裡有這個核心的人。樣本少於 ${MIN} 的名次不準。\n\n`;
md += '## 職業\n\n| 職業 | 場次 | 平均名次 |\n| --- | --- | --- |\n';
for (const [c, a] of Object.entries(C).sort((x, y) => avg(x[1]) - avg(y[1])))
  md += `| ${G.CLSI[c].n} | ${a.length} | ${f2(avg(a))} |\n`;
for (const Cl of G.CLASSES) {
  const ids = G.ITEMS.filter(i => i.core === 1 && i.cls === Cl.id).map(i => i.id);
  md += `\n## ${Cl.n}（${(C[Cl.id] || []).length} 場、平均 ${f2(avg(C[Cl.id] || []))}）\n\n| 核心 | 出現 | 被選 | 選擇率 | 拿著的平均名次 |\n| --- | --- | --- | --- | --- |\n`;
  for (const id of ids.sort((a, b) => (K[b] ? K[b].pick : 0) - (K[a] ? K[a].pick : 0))) {
    const k = K[id] || { offer: 0, pick: 0, place: [] };
    md += `| ${nm(id)} | ${k.offer} | ${k.pick} | ${k.offer ? Math.round((k.pick / k.offer) * 100) + '%' : '—'} | ${k.place.length >= MIN ? f2(avg(k.place)) : '—'}（${k.place.length}） |\n`;
  }
  const combos = Object.entries(P)
    .filter(([k]) => G.ITEMI[k.split('+')[0]].cls === Cl.id)
    .sort((x, y) => y[1].length - x[1].length)
    .slice(0, 5);
  if (combos.length)
    md +=
      '\n最常見的組合（第一個＋第二個）：' +
      combos
        .map(([k, a]) => `${k.split('+').map(nm).join('＋')} ${a.length} 次・${a.length >= MIN ? f2(avg(a)) : '—'}`)
        .join('；') +
      '\n';
}
const best = Object.entries(P)
  .filter(([, a]) => a.length >= MIN)
  .sort((x, y) => avg(x[1]) - avg(y[1]))
  .slice(0, 10);
md += `\n## 名次最好的組合（至少 ${MIN} 次）\n\n| 職業 | 組合 | 次數 | 平均名次 |\n| --- | --- | --- | --- |\n`;
for (const [k, a] of best)
  md += `| ${G.CLSI[G.ITEMI[k.split('+')[0]].cls].n} | ${k.split('+').map(nm).join('＋')} | ${a.length} | ${f2(avg(a))} |\n`;
if (WRITE) fs.writeFileSync(path.join(__dirname, '..', 'docs', '核心統計.md'), md);
console.log(md);
