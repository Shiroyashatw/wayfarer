/* 覺醒／質變的強度（docs/質變核心.md）：機器人對局裡 2-5 拿了有變體的核心的背包（最後一筆快照），
   核心分別換成「原本＋同職業隨機一個新核心」「覺醒」「質變」，對同一批對手打，比勝率；也印 4-4 機器人怎麼選。
   用法：node tools/core_var.js [場數=120] [--jobs 8] */
'use strict';
const { fork } = require('child_process');
const args = process.argv.slice(2),
  N = +args.find(a => /^\d+$/.test(a)) || 120,
  JOBS = +(args[args.indexOf('--jobs') + 1] || 8) || 8,
  SEED = 727100,
  OPP = 40;

function work(a, b) {
  const G = require('./game_node'),
    bags = [],
    picks = {};
  for (let g = a; g < b; g++) {
    const L = G.simLobby(SEED + g * 7919, 1300, { short: 1 });
    for (const x of L) {
      const ids = Object.keys(x.snaps);
      if (!ids.length) continue;
      const last = x.snaps[ids[ids.length - 1]].bag,
        lg = x.stat.log,
        c1 = lg[0] && lg[0].p;
      bags.push({ bag: last, c1, st: G.ROUNDS[ids.length - 1].st });
      if (lg[1] && c1 && G.coreVars(c1).length) {
        const P = (picks[c1] = picks[c1] || { n: 0, d: 0, t: 0 }),
          V = G.ITEMI[lg[1].p] || {};
        P.n++;
        if (V.vk) P[V.vk]++;
      }
    }
  }
  return { bags, picks };
}
if (process.env.W) {
  const [a, b] = process.env.W.split(':').map(Number);
  process.send(work(a, b));
  return;
}

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
  const G = require('./game_node'),
    bags = parts.flatMap(p => p.bags),
    picks = {};
  for (const p of parts)
    for (const k in p.picks) {
      const P = (picks[k] = picks[k] || { n: 0, d: 0, t: 0 });
      for (const f in P) P[f] += p.picks[k][f];
    }
  const late = bags.filter(x => x.st >= 5),
    rng = G.rng(G.h(SEED, 1)),
    opps = [...Array(OPP)].map(() => late[Math.floor(rng() * late.length)]);
  const win = (bag, st) => {
    const F = G.stageHp(G.compileBag(G.unpackBag(bag)), st);
    let w = 0;
    opps.forEach((o, k) => {
      const r = G.simulate(F, G.stageHp(G.compileBag(G.unpackBag(o.bag)), st), G.h(SEED, k, 9));
      if (r.win) w++;
    });
    return w / OPP;
  };
  console.log(`對局 ${N} 場；對手 ${OPP} 個後期快照\n`);
  console.log('核心 | 背包數 | 原本＋新核心 | 覺醒 | 質變 | 4-4 機器人選（新／覺醒／質變）');
  const base = [...new Set(G.ITEMS.filter(i => i.vof).map(i => i.vof))];
  for (const id of base) {
    const mine = late.filter(x => x.c1 === id).slice(0, 25);
    if (!mine.length) {
      console.log(`${G.ITEMI[id].n} | 0 | — | — | — | —`);
      continue;
    }
    const [vd, vt] = ['d', 't'].map(k => id + k),
      others = G.ITEMS.filter(i => i.core === 1 && !i.vof && i.cls === G.ITEMI[id].cls && i.id !== id).map(i => i.id),
      r = { a: 0, d: 0, t: 0 };
    mine.forEach((x, k) => {
      const co = G.unpackIt(x.bag.co, 'c'),
        b0 = { ...x.bag, co: G.packIt({ ...co, id, sc: others[k % others.length] }) },
        bd = { ...x.bag, co: G.packIt({ ...co, id: vd, sc: null }) },
        bt = { ...x.bag, co: G.packIt({ ...co, id: vt, sc: null }) };
      r.a += win(b0, x.st);
      r.d += win(bd, x.st);
      r.t += win(bt, x.st);
    });
    const P = picks[id] || { n: 0, d: 0, t: 0 },
      pct = v => ((100 * v) / mine.length).toFixed(0) + '%';
    console.log(
      `${G.ITEMI[id].n} | ${mine.length} | ${pct(r.a)} | ${pct(r.d)} | ${pct(r.t)} | ${P.n ? `${P.n - P.d - P.t}／${P.d}／${P.t}` : '—'}`
    );
  }
})();
