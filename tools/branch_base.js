/* 0.2 規格書第 5 節的基準：撞職業的代價、同職業背包相似度、核心有沒有改變買法。用法：node tools/branch_base.js 480（場數） */
'use strict';
const { fork } = require('child_process');
const GN = './game_node';
const N = +process.argv[2] || 400,
  JOBS = 16,
  SEED = 515100,
  RT = 1300;

function work(a, b) {
  const G = require(GN),
    out = [];
  for (let g = a; g < b; g++) {
    const seed = SEED + g * 7919,
      mode = G.rollMode(G.rng(G.h(seed, 6))),
      theme = G.rollTheme(G.rng(G.h(seed, 10)), mode),
      L = G.simLobby(seed, RT, { short: 1, mode, theme });
    for (const x of L) {
      const ids = Object.keys(x.snaps);
      if (!ids.length) continue;
      const it = x.snaps[ids[ids.length - 1]].bag.it;
      out.push({
        g,
        cls: x.stat.cls,
        place: x.place,
        c1: (x.stat.log[0] || {}).p || null,
        items: [...new Set(it.map(q => q[0]))],
        t3: it.filter(q => q[1] >= 3).length
      });
    }
  }
  return out;
}
if (process.env.W) {
  const [a, b] = process.env.W.split(':').map(Number);
  process.send(work(a, b));
  return;
}

const jac = (A, B) => {
  const s = new Set(A);
  let i = 0;
  for (const x of B) if (s.has(x)) i++;
  const u = A.length + B.length - i;
  return u ? i / u : 1;
};
const avg = a => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);

(async () => {
  const per = Math.ceil(N / JOBS),
    parts = await Promise.all(
      [...Array(JOBS).keys()]
        .map(j => [j * per, Math.min(N, (j + 1) * per)])
        .filter(([a, b]) => b > a)
        .map(
          ([a, b]) =>
            new Promise(res => fork(__filename, [], { env: { ...process.env, W: `${a}:${b}` } }).on('message', res))
        )
    );
  const R = parts.flat();
  /* 1. 撞職業：名次扣掉該職業平均（職業強弱不算進來） */
  const cm = {};
  for (const r of R) (cm[r.cls] = cm[r.cls] || []).push(r.place);
  const byG = {};
  for (const r of R) (byG[r.g] = byG[r.g] || []).push(r);
  const dup = [],
    solo = [],
    dupT3 = [],
    soloT3 = [],
    sameC1 = [];
  for (const g in byG)
    for (const r of byG[g]) {
      const mates = byG[g].filter(o => o !== r && o.cls === r.cls);
      const res = r.place - avg(cm[r.cls]);
      if (mates.length) {
        dup.push(res);
        dupT3.push(r.t3);
        sameC1.push(mates.some(o => o.c1 && o.c1 === r.c1) ? 1 : 0);
      } else solo.push(res), soloT3.push(r.t3);
    }
  console.log(`對局 ${N} 場、${R.length} 個機器人`);
  console.log(`撞職業：${dup.length} 人（${((100 * dup.length) / R.length).toFixed(1)}%）`);
  console.log(
    `  名次（扣職業平均）：撞 ${avg(dup).toFixed(2)}、沒撞 ${avg(solo).toFixed(2)}、差 ${(avg(dup) - avg(solo)).toFixed(2)}`
  );
  console.log(`  Ⅲ 階以上件數：撞 ${avg(dupT3).toFixed(2)}、沒撞 ${avg(soloT3).toFixed(2)}`);
  console.log(`  撞的人 2-5 拿到同一個核心：${(100 * avg(sameC1)).toFixed(1)}%`);
  /* 2、3. 背包相似度（最後背包的道具種類 Jaccard），不同場之間配對 */
  const S = { cc: [], cd: [], d: [] };
  for (let i = 0; i < R.length; i++)
    for (let j = i + 1; j < R.length; j++) {
      const a = R[i],
        b = R[j];
      if (a.g === b.g) continue;
      if (a.cls !== b.cls) {
        if ((i * 31 + j) % 40 === 0) S.d.push(jac(a.items, b.items));
      } else if (a.c1 && b.c1) (a.c1 === b.c1 ? S.cc : S.cd).push(jac(a.items, b.items));
    }
  console.log(`背包相似度（Jaccard，1 = 一模一樣）：`);
  console.log(`  同職業、2-5 同一個核心：${avg(S.cc).toFixed(3)}（${S.cc.length} 對）`);
  console.log(`  同職業、2-5 不同核心：  ${avg(S.cd).toFixed(3)}（${S.cd.length} 對）`);
  console.log(`  不同職業（參考）：      ${avg(S.d).toFixed(3)}`);
  /* 各職業：同職業相似度、核心造成的差 */
  console.log('職業 | 撞職業名次差 | 同職業相似度 | 同核心 − 不同核心');
  for (const c of Object.keys(cm).sort()) {
    const rs = R.filter(r => r.cls === c),
      cc = [],
      cd = [];
    for (let i = 0; i < rs.length; i++)
      for (let j = i + 1; j < rs.length; j++)
        if (rs[i].g !== rs[j].g && rs[i].c1 && rs[j].c1)
          (rs[i].c1 === rs[j].c1 ? cc : cd).push(jac(rs[i].items, rs[j].items));
    const d = [],
      s = [];
    for (const g in byG)
      for (const r of byG[g]) if (r.cls === c) (byG[g].some(o => o !== r && o.cls === c) ? d : s).push(r.place);
    console.log(
      `${c} | ${d.length ? (avg(d) - avg(s)).toFixed(2) + `（${d.length}）` : '—'} | ${avg([...cc, ...cd]).toFixed(3)} | ${(avg(cc) - avg(cd)).toFixed(3)}`
    );
  }
})();
