/* dungeonPOE · 規則式自動玩家：整理背包、點天賦、下地城（打或跑、什麼時候撤），量撤離率、死亡率、熱度、生肖、進度
   node tools/autoplay.js [每個職業幾趟=40] [職業=全部] */
'use strict';
const G = require('./game_node.js').load();
const score = o => {
  const b = G.baseOf(o);
  const a = o.a.reduce((s, x) => s + (7 - x.t) * 2, 0);
  if (b.k === 'w') return ((b.dmg[0] + b.dmg[1]) / 2 / b.cd) * 10 + a;
  if (b.k === 's') return (b.block / b.cd) * 6 + a;
  if (b.k === 'a') return (b.hp || 0) / 3 + (b.arm || 0) * 4 + (b.dodge || 0) + a;
  if (b.k === 'p') return 8;
  return 0;
};
/* 把所有道具重新塞：好的先放背包，錢袋與剩下最好的放黑盒 */
function pack(S) {
  const bag = S.bags.find(b => b.u === S.sel),
    all = [...S.wh, ...bag.items, ...S.box.items];
  bag.items = [];
  S.box.items = [];
  S.wh = [];
  all.sort((a, b) => score(b) - score(a));
  for (const o of all.filter(o => o.id === 'purse')) if (!G.autoPlace(S.box, o)) S.wh.push(o);
  let w = 0;
  for (const o of all.filter(o => o.id !== 'purse')) {
    const k = G.baseOf(o).k;
    if (k === 'w' && w >= 3) {
      if (!G.autoPlace(S.box, o)) S.wh.push(o);
      continue;
    }
    if (G.autoPlace(bag, o)) w += k === 'w';
    else if (!G.autoPlace(S.box, o)) S.wh.push(o);
  }
  /* 倉庫太多就賣掉最差的 */
  S.wh.sort((a, b) => score(a) - score(b));
  while (S.wh.length > 12) G.sellItem(S, S.wh[0].u);
}
function town(S) {
  G.ensureStarter(S);
  /* 背包：買得起比較大的就買（留 20 金） */
  const cur = S.bags.find(b => b.u === S.sel),
    cn = G.cellCount(cur);
  const up = G.BAGS.filter(b => b.p + 20 <= S.gold && G.cellCount({ t: b.id }) > cn).sort((a, b) => b.p - a.p)[0];
  if (up && !S.bags.some(b => G.cellCount(b) >= G.cellCount({ t: up.id }))) {
    const old = cur.items;
    G.buyBag(S, up.id);
    S.wh.push(...old);
    cur.items = [];
  }
  if (S.gold > 60 && !G.allItems(S).some(o => o.id === 'purse'))
    G.buyShop(
      S,
      S.shop.findIndex(s => s.o.id === 'purse')
    );
  for (let k = 0; k < 2 && S.gold > 40; k++) {
    const i = S.shop.findIndex(s => !s.sold && s.o.id === 'potion');
    if (i >= 0) G.buyShop(S, i);
  }
  for (const n of G.TNODES) G.takeNode(S, S.cls, n.id);
  const cs = G.coresOf(S, S.cls);
  S.eq[S.cls] = cs.slice(-2);
  pack(S);
  S.d = S.maxD;
}
/* 最短路（照移動點，單行道算進去） */
function path(run, goal) {
  const N = run.map.N.length,
    D = new Array(N).fill(Infinity),
    from = new Array(N).fill(-1),
    q = [run.pos];
  D[run.pos] = 0;
  while (q.length) {
    q.sort((a, b) => D[a] - D[b]);
    const a = q.shift();
    for (const m of G.moves(run.map, a, run.fx.detour))
      if (D[a] + m.c < D[m.to]) {
        D[m.to] = D[a] + m.c;
        from[m.to] = a;
        q.push(m.to);
      }
  }
  if (D[goal] === Infinity) return null;
  const p = [goal];
  while (p[0] !== run.pos) p.unshift(from[p[0]]);
  return { d: D[goal], p };
}
function nearest(run, ok) {
  let best = null;
  for (const n of run.map.N) {
    if (n.id === run.pos || !ok(n)) continue;
    const p = path(run, n.id);
    if (p && (!best || p.d < best.d)) best = { ...p, n };
  }
  return best;
}
const M = { fights: 0, fled: 0, zodF: 0, zodW: 0, bossF: 0, bossW: 0, exitHeat: [], hot: 0, hotEsc: 0 };
function dungeon(S) {
  const run = G.depart(S, (Math.random() * 1e9) | 0);
  let leave = false,
    guard = 0;
  while (guard++ < 400) {
    const P = G.P_of(run);
    /* 處理待辦 */
    const p = run.pend;
    if (p) {
      if (p.k === 'fight') {
        const pr = G.predict(P, run.hp, p.foes, run.turn * 13 + run.pos);
        const isZ = p.zod != null,
          isB = run.map.N[run.pos].t === 'boss';
        if (isZ || pr.win >= 0.6 || (isB && pr.win >= 0.4)) {
          M.fights++;
          if (isZ) M.zodF++;
          if (isB) M.bossF++;
          const r = G.fightNow(run);
          if (r.win && isZ) M.zodW++;
          if (r.win && isB) M.bossW++;
        } else {
          G.flee(run);
          M.fled++;
        }
        continue;
      }
      if (p.k === 'dead') return G.finishRun(S, false);
      if (p.k === 'loot') {
        for (const o of run.ground.splice(0)) if (!G.autoPlace(run.bag, o)) G.autoPlace(run.box, o);
        run.pend = null;
        continue;
      }
      if (p.k === 'shop') {
        const st = run.map.N[run.pos].stock;
        st.forEach((s, i) => s.item === 'potion' && run.gold >= 15 && G.shopBuy(run, i));
        for (const o of run.ground.splice(0)) G.autoPlace(run.bag, o);
        run.map.N[run.pos].done = 1;
        run.pend = null;
        continue;
      }
      if (p.k === 'event') {
        if (!G.eventPick(run, 0)) G.eventPick(run, 1);
        continue;
      }
      if (p.k === 'stairs') {
        if (leave) run.pend = null;
        else G.goDown(run);
        continue;
      }
      if (p.k === 'exit') {
        if (leave || run.boss) {
          M.exitHeat.push(run.heat);
          if (run.hot) M.hotEsc++;
          return G.finishRun(S, true);
        }
        run.pend = null;
        continue;
      }
      run.pend = null;
      continue;
    }
    if (run.hot && !run._hot) {
      run._hot = 1;
      M.hot++;
    }
    /* 要不要撤 */
    const hpR = run.hp / P.mhp;
    leave = run.boss || (run.hot && run.f < 3) || run.heat >= (GREED ? 40 : 34) || (run.hearts <= 1 && hpR < 0.5);
    /* 出牌：先出移動牌；生命低才喘息 */
    for (let i = run.hand.length - 1; i >= 0; i--) {
      const c = G.CARDS[run.hand[i]];
      if (c.mv || c.scout || c.ambush || c.detour || c.pick || c.heat || (c.heal && hpR < 0.7)) G.playCard(run, i);
    }
    /* 選目標 */
    let tgt;
    if (leave) tgt = nearest(run, n => n.t === 'exit');
    if (!tgt)
      tgt = nearest(
        run,
        n =>
          !n.done &&
          (('chest event shop'.includes(n.t) && n.rv) ||
            (n.t === 'rest' && hpR < 0.7) ||
            (n.t === 'fight' && n.rv && G.predict(P, run.hp, n.foes, n.id).win >= 0.8))
      );
    if (!tgt) tgt = nearest(run, n => n.t === (run.f === 3 ? 'boss' : 'stairs'));
    if (!tgt) tgt = nearest(run, n => n.t === 'exit');
    let moved = false;
    if (tgt) {
      const nx = tgt.p[1],
        m = G.canMove(run, nx);
      if (m) moved = G.moveTo(run, nx);
    }
    if (!moved) G.endTurn(run);
  }
  return G.finishRun(S, false);
}
const GREED = process.argv.includes('--greedy');
const N = +process.argv[2] || 40,
  only = process.argv[3];
const rows = [];
for (const c of G.CLASSES) {
  if (only && c.id !== only) continue;
  let esc = 0,
    dead = 0,
    sumL = 0,
    maxD = 0,
    gold = 0;
  for (let car = 0; car < 4; car++) {
    const S = G.newGame();
    S.cls = c.id;
    for (let i = 0; i < N; i++) {
      town(S);
      const r = dungeon(S);
      r.ok ? esc++ : dead++;
      sumL += r.L;
    }
    maxD += S.maxD;
    gold += S.gold;
  }
  const lv = G.clLv(G.newGame().cl[c.id] ? 0 : 0);
  rows.push({
    職業: c.n,
    撤離率: (esc / (esc + dead)).toFixed(2),
    平均深度L: (sumL / (esc + dead)).toFixed(1),
    最深地城: (maxD / 4).toFixed(1),
    剩金幣: Math.round(gold / 4)
  });
}
console.table(rows);
const avg = a => (a.length ? (a.reduce((s, x) => s + x, 0) / a.length).toFixed(1) : '-');
console.log(
  `戰鬥 ${M.fights}・逃跑 ${M.fled}（${((M.fled / (M.fights + M.fled)) * 100).toFixed(0)}%）・王 ${M.bossW}/${M.bossF}・生肖 ${M.zodW}/${M.zodF}・熱度滿 ${M.hot} 次、之後撤離成功 ${M.hotEsc}・撤離時平均熱度 ${avg(M.exitHeat)}`
);
