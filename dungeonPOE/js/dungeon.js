/* dungeonPOE · 一趟地城：隨機地圖、手牌移動、熱度與生肖、遭遇、掉寶、逃跑、愛心、撤離與死亡（純邏輯） */
'use strict';
/* ================= 怪物 ================= */
const pick = (a, r) => a[fl(r() * a.length)];
/* tier：mob／elite／boss／zod；heat：熱度等級 0～2 */
function mkFoe(def, tier, L, heat, r, aff = []) {
  const b = mobBase(L),
    hm = 1 + HEAT.mul[heat],
    atkM = { mob: 1, elite: 1.6, boss: 2.4, zod: 1.8 }[tier];
  let mhp = b.hp * (def.hp || 1) * TIERM[tier] * hm,
    atk = b.atk * (def.atk || 1) * atkM * hm,
    cd = def.cd || 1.6,
    arm = 0;
  const on = { ...(def.on || {}) };
  for (const a of aff) {
    if (a === 'fast') cd /= 1.4;
    if (a === 'tough') mhp *= 1.5;
    if (a === 'iron') arm += 3;
    if (a === 'fire') on.burn = (on.burn || 0) + 50;
    if (a === 'frost') on.freeze = (on.freeze || 0) + 25;
    if (a === 'storm') on.shock = (on.shock || 0) + 50;
  }
  return {
    n: def.n,
    sp: def.sp,
    tier,
    mhp: Math.round(mhp),
    atk: [Math.max(1, Math.round(atk * 0.8)), Math.max(2, Math.round(atk * 1.2))],
    cd: Math.round(cd * 100) / 100,
    arm,
    on,
    aff,
    sk: def.sk || null
  };
}
const MAFFK = Object.keys(MAFF);
function foesFor(t, L, heat, r, d) {
  if (t === 'fight') {
    /* 第一層最多 2 隻（新手的第一場不會是打不贏的 3 隻） */
    const n = r() < 0.35 ? 1 : r() < 0.7 || L < 2 ? 2 : 3;
    return Array.from({ length: n }, () => mkFoe(pick(MOBS, r), 'mob', L, heat, r)).map(f => ({
      ...f,
      mhp: Math.round(f.mhp * (n === 1 ? 1.3 : n === 3 ? 0.75 : 1))
    }));
  }
  if (t === 'elite') {
    const a = [pick(MAFFK, r)];
    if (L >= 4 && r() < 0.5)
      a.push(
        pick(
          MAFFK.filter(k => k !== a[0]),
          r
        )
      );
    const out = [mkFoe(pick(MOBS, r), 'elite', L, heat, r, a)];
    if (r() < 0.5) out.push(mkFoe(pick(MOBS, r), 'mob', L, heat, r));
    return out;
  }
  if (t === 'boss')
    return [mkFoe(BOSSES[(d - 1) % BOSSES.length], 'boss', L, heat, r, d > BOSSES.length ? ['tough'] : [])];
  return [];
}
/* ================= 地圖 ================= */
/* 每層 6 排、15～20 格：第 0 排是入口，最上排有樓梯（第 3 層是王）；邊 c 是移動點、o 是單行道（只能往上） */
const CELLW = [
  ['fight', 40],
  ['elite', 9],
  ['chest', 17],
  ['event', 10],
  ['shop', 7],
  ['rest', 9],
  ['empty', 8]
];
function wpick(ws, r) {
  let s = ws.reduce((a, w) => a + w[1], 0) * r();
  for (const [k, w] of ws) if ((s -= w) < 0) return k;
  return ws[0][0];
}
function genMap(seed, d, f, heat) {
  const r = rng(seed),
    L = lvOf(d, f),
    rows = [1, 3 + fl(r() * 2), 3 + fl(r() * 2), 3 + fl(r() * 2), 3 + fl(r() * 2), 2 + fl(r() * 2)],
    N = [],
    E = [];
  rows.forEach((k, row) => {
    for (let i = 0; i < k; i++)
      N.push({
        id: N.length,
        row,
        x: k === 1 ? 0.5 : 0.12 + (0.76 * i) / (k - 1) + (r() - 0.5) * 0.08,
        y: 0.92 - row * 0.168 + (r() - 0.5) * 0.04,
        t: 'empty',
        done: 0,
        rv: 0
      });
  });
  const inRow = row => N.filter(n => n.row === row).sort((a, b) => a.x - b.x),
    has = (a, b) => E.some(e => (e.a === a && e.b === b) || (e.a === b && e.b === a)),
    add = (a, b, up) => {
      if (a === b || has(a, b)) return;
      E.push({ a, b, c: r() < 0.15 ? 2 : 1, o: up && r() < 0.12 ? 1 : 0 });
    },
    near = (n, list) => list.reduce((m, x) => (Math.abs(x.x - n.x) < Math.abs(m.x - n.x) ? x : m));
  for (let row = 0; row < 5; row++) {
    const A = inRow(row),
      B = inRow(row + 1);
    for (const b of B) add(near(b, A).id, b.id, 1);
    for (const a of A) if (!E.some(e => e.a === a.id && N[e.b].row === row + 1)) add(a.id, near(a, B).id, 1);
    for (let i = 0; i + 1 < Math.min(A.length, B.length); i++) if (r() < 0.3) add(A[i + 1].id, B[i].id, 1);
    if (row > 0) for (let i = 0; i + 1 < A.length; i++) if (r() < 0.3) add(A[i].id, A[i + 1].id, 0);
  }
  const top = inRow(5);
  for (let i = 0; i + 1 < top.length; i++) add(top[i].id, top[i + 1].id, 0);
  N[0].t = 'in';
  N[0].rv = 1;
  const goal = pick(top, r);
  goal.t = f === 3 ? 'boss' : 'stairs';
  const mid = N.filter(n => n.row >= 2 && n.row <= 4),
    nx = 1 + (r() < 0.5 ? 1 : 0);
  for (let k = 0; k < nx; k++) {
    const c = mid.filter(n => n.t === 'empty' && !mid.some(m => m.t === 'exit' && m.row === n.row));
    if (c.length) pick(c, r).t = 'exit';
  }
  for (const n of N) if (n.t === 'empty' && n.id) n.t = wpick(CELLW, r);
  for (const n of N) {
    if ('fight elite boss'.includes(n.t)) n.foes = foesFor(n.t, L, heat, r, d);
    if (n.t === 'shop') n.stock = shopStock(L, r);
  }
  return { N, E, seed };
}
/* 從 a 能走到的邊（考慮單行道；繞道時無視） */
function moves(map, a, detour) {
  const out = [];
  for (const e of map.E) {
    if (e.a === a) out.push({ to: e.b, c: detour ? 1 : e.c });
    else if (e.b === a && (!e.o || detour)) out.push({ to: e.a, c: detour ? 1 : e.c });
  }
  return out;
}
/* 不管方向的距離（生肖追人、偵查用） */
function dists(map, from) {
  const D = new Array(map.N.length).fill(Infinity),
    q = [from];
  D[from] = 0;
  while (q.length) {
    const a = q.shift();
    for (const e of map.E) {
      const b = e.a === a ? e.b : e.b === a ? e.a : -1;
      if (b >= 0 && D[b] === Infinity) {
        D[b] = D[a] + 1;
        q.push(b);
      }
    }
  }
  return D;
}
const ALWAYS = 'in exit stairs boss';
function reveal(run, k = 1) {
  const D = dists(run.map, run.pos);
  run.map.N.forEach((n, i) => {
    if (D[i] <= k) n.rv = 1;
  });
}
const visible = n => n.rv || ALWAYS.includes(n.t);
/* ================= 一趟的狀態 ================= */
/* hero：heroOf(S, 職業)；bag：帶下去的背包（實例，死了就沒了）；box：黑盒 */
function newRun(seed, d, hero, bag, box) {
  const run = {
    seed,
    ver: VER,
    d,
    f: 1,
    turn: 1,
    heat: 0,
    hot: 0,
    zs: [],
    zN: 0,
    hero,
    bag,
    box,
    ground: [],
    hp: 0,
    hearts: HEARTS,
    gold: 0,
    kills: 0,
    deck: [...START_DECK],
    draw: [],
    hand: [],
    disc: [],
    mp: 0,
    fx: {},
    pos: 0,
    prev: 0,
    pend: null,
    boss: 0,
    log: [],
    zOrder: shuffle([...ZODIAC.keys()], rng(h(seed, 9)))
  };
  run.hp = compile(bag, hero).mhp;
  enterFloor(run);
  return run;
}
function shuffle(a, r) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = fl(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const rr = (run, k) => rng(h(run.seed, run.f * 1000 + run.turn * 7 + (run.ctr = (run.ctr || 0) + 1), k));
const heatLv = run => (run.heat >= HEAT.lv[2] ? 2 : run.heat >= HEAT.lv[1] ? 1 : 0);
const runL = run => lvOf(run.d, run.f);
const P_of = run => compile(run.bag, run.hero);
function enterFloor(run) {
  run.map = genMap(h(run.seed, run.f), run.d, run.f, heatLv(run));
  run.pos = run.prev = 0;
  run.zs = [];
  run.draw = shuffle([...run.deck], rr(run, 1));
  run.hand = [];
  run.disc = [];
  run.mp = 0;
  run.fx = {};
  reveal(run);
  drawHand(run);
}
function drawHand(run) {
  const r = rr(run, 2);
  while (run.hand.length < HAND) {
    if (!run.draw.length) {
      if (!run.disc.length) break;
      run.draw = shuffle(run.disc, r);
      run.disc = [];
    }
    run.hand.push(run.draw.pop());
  }
}
function addHeat(run, v) {
  if (run.hot && v < 0) return;
  run.heat = Math.max(0, Math.min(HEAT.max, run.heat + v));
  if (run.heat >= HEAT.max && !run.hot) {
    run.hot = run.turn;
    spawnZod(run);
  }
}
/* ================= 手牌與移動 ================= */
function playCard(run, i) {
  const k = run.hand[i],
    c = CARDS[k];
  if (!c || run.pend) return null;
  run.hand.splice(i, 1);
  if (!c.once) run.disc.push(k);
  else run.deck.splice(run.deck.indexOf(k), 1);
  run.mp += c.mv;
  if (c.heal) run.hp = Math.min(P_of(run).mhp, run.hp + Math.round((P_of(run).mhp * c.heal) / 100));
  if (c.heat) addHeat(run, c.heat);
  if (c.scout) reveal(run, c.scout);
  if (c.detour) run.fx.detour = 1;
  if (c.ambush) run.fx.amb = c.ambush;
  if (c.pick) run.fx.pick = 1;
  return c;
}
function canMove(run, to) {
  return moves(run.map, run.pos, run.fx.detour).find(m => m.to === to && m.c <= run.mp);
}
/* 走到 to：撿的東西沒放進背包就留在原地（不見）；走到的格子交給 arrive 處理 */
function moveTo(run, to) {
  const m = !run.pend && canMove(run, to);
  if (!m) return false;
  run.mp -= m.c;
  run.prev = run.pos;
  run.pos = to;
  run.ground = [];
  reveal(run);
  arrive(run);
  return true;
}
function arrive(run) {
  const n = run.map.N[run.pos],
    z = run.zs.find(z => z.pos === run.pos);
  if (z) return (run.pend = { k: 'fight', zod: z.id, foes: [z.foe] });
  if (n.done) return null;
  if ('fight elite boss'.includes(n.t)) run.pend = { k: 'fight', foes: n.foes };
  else if (n.t === 'chest') openChest(run, n);
  else if (n.t === 'rest') {
    const P = P_of(run),
      v = Math.round(P.mhp * 0.3);
    run.hp = Math.min(P.mhp, run.hp + v);
    n.done = 1;
    run.pend = { k: 'msg', ic: '🏕️', t: '休息', d: `回 ${v} 生命` };
  } else if (n.t === 'shop') run.pend = { k: 'shop' };
  else if (n.t === 'event') run.pend = { k: 'event', e: (run.seed + run.f * 7 + run.pos) % EVENTS.length };
  else if (n.t === 'exit') run.pend = { k: 'exit' };
  else if (n.t === 'stairs') run.pend = { k: 'stairs' };
  return run.pend;
}
function endTurn(run) {
  if (run.pend) return;
  run.disc.push(...run.hand);
  run.hand = [];
  run.mp = 0;
  run.fx = {};
  run.turn++;
  addHeat(run, HEAT.turn);
  /* 生肖每回合往你走 2 格 */
  for (const z of run.zs)
    for (let s = 0; s < 2 && z.pos !== run.pos; s++) {
      const D = dists(run.map, run.pos),
        nb = moves(run.map, z.pos, 1).map(m => m.to);
      z.pos = nb.reduce((b, x) => (D[x] < D[b] ? x : b), z.pos);
    }
  if (run.hot && (run.turn - run.hot) % 2 === 0) spawnZod(run);
  drawHand(run);
  const z = run.zs.find(z => z.pos === run.pos);
  if (z) run.pend = { k: 'fight', zod: z.id, foes: [z.foe], forced: 1 };
}
/* 第 k 隻生肖生在離你「最遠距離 - 2k」的地方（越生越近，最後生在旁邊） */
function spawnZod(run) {
  const D = dists(run.map, run.pos),
    far = Math.max(...D.filter(x => x < Infinity)),
    want = Math.max(1, far - 2 * run.zN),
    c = run.map.N.filter(n => n.id !== run.pos && D[n.id] < Infinity && !run.zs.some(z => z.pos === n.id)),
    best = c.reduce((b, n) => (Math.abs(D[n.id] - want) < Math.abs(D[b.id] - want) ? n : b), c[0]);
  if (!best) return;
  const def = ZODIAC[run.zOrder[run.zN % 12]],
    r = rr(run, 5),
    aff = [
      def.a,
      pick(
        MAFFK.filter(k => k !== def.a),
        r
      )
    ];
  run.zs.push({ id: run.zN, pos: best.id, foe: mkFoe(def, 'zod', runL(run), 2, r, aff) });
  run.zN++;
  run.log.push({ zod: def.n });
}
/* ================= 遭遇：打或跑 ================= */
function fightNow(run) {
  const p = run.pend;
  if (!p || p.k !== 'fight') return null;
  const P = P_of(run),
    res = simulate(P, run.hp, p.foes, h(run.seed, run.turn * 31 + run.pos, run.f), { amb: run.fx.amb || 0 });
  run.fx.amb = 0;
  addHeat(run, HEAT.fight);
  for (const u of res.used) {
    const i = run.bag.items.findIndex(o => o.u === u);
    if (i >= 0) run.bag.items.splice(i, 1);
  }
  const n = run.map.N[run.pos];
  if (res.win) {
    run.hp = res.hp;
    run.kills += res.foes.length;
    const loot = lootFor(run, p.zod != null ? 'zod' : n.t);
    if (p.zod != null) run.zs = run.zs.filter(z => z.id !== p.zod);
    else {
      n.done = 1;
      if (n.t === 'boss') {
        run.boss = 1;
        n.t = 'exit';
        n.done = 0;
      }
    }
    run.pend = { k: 'loot', res, ...loot };
  } else {
    run.hearts--;
    if (run.hearts <= 0) {
      run.pend = { k: 'dead', res };
      return res;
    }
    run.hp = P.mhp;
    run.pos = run.prev;
    run.pend = { k: 'lost', res };
  }
  return res;
}
function flee(run) {
  const p = run.pend;
  if (!p || p.k !== 'fight' || p.zod != null) return false;
  run.pos = run.prev;
  addHeat(run, HEAT.flee);
  if (run.hand.length) run.disc.push(...run.hand.splice(fl(rr(run, 6)() * run.hand.length), 1));
  run.pend = null;
  return true;
}
/* ================= 掉寶 ================= */
const bestT = (run, bonus = 0) =>
  Math.max(1, Math.min(6, 6 - fl((runL(run) - 1) / 1.5) - (heatLv(run) ? 1 : 0) - bonus));
function lootItem(run, r, n, bonus = 0) {
  const L = runL(run) + bonus,
    mx = Math.min(5, 1 + fl(L / 2)),
    pool = GEAR.filter(b => b.star <= mx && b.star >= Math.max(1, mx - 2));
  return rollItem(pick(pool, r).id, n, bestT(run, bonus), r);
}
function lootFor(run, t) {
  const r = rr(run, 7),
    L = runL(run),
    gm = 1 + 0.35 * (L - 1),
    items = [];
  let gold = 0;
  const blue = 0.25 + 0.15 * heatLv(run);
  if (t === 'fight') {
    gold = Math.round((4 + r() * 4) * gm);
    if (r() < 0.35) items.push(lootItem(run, r, r() < blue ? 1 : 0));
    if (r() < 0.06) items.push(mkItem('potion'));
  } else if (t === 'elite') {
    gold = Math.round(16 * gm);
    items.push(lootItem(run, r, r() < 0.4 ? 2 : 1));
  } else if (t === 'boss') {
    gold = Math.round(60 * gm);
    items.push(lootItem(run, r, 2, 1), lootItem(run, r, 1));
  } else if (t === 'zod') {
    gold = Math.round(45 * gm);
    const o = lootItem(run, r, 2, 2);
    o.a.forEach(x => (x.t = Math.min(x.t, 2)));
    items.push(o);
  }
  run.gold += gold;
  run.ground.push(...items);
  return { gold, items: items.map(o => o.u) };
}
function openChest(run, n) {
  const r = rr(run, 8);
  n.done = 1;
  addHeat(run, HEAT.chest);
  const items = [],
    k = r();
  let gold = 0,
    card = null;
  if (k < 0.3) {
    card = pick(LOOT_CARDS, r);
    run.deck.push(card);
    run.disc.push(card);
  } else if (k < 0.5) gold = Math.round((12 + r() * 10) * (1 + 0.35 * (runL(run) - 1)));
  else items.push(lootItem(run, r, r() < 0.4 + 0.15 * heatLv(run) ? 1 : 0));
  if (run.fx.pick) items.push(lootItem(run, r, 1));
  if (r() < 0.12) items.push(mkItem('potion'));
  run.gold += gold;
  run.ground.push(...items);
  run.pend = { k: 'loot', chest: 1, gold, card, items: items.map(o => o.u) };
}
/* ================= 地城商人 ================= */
function shopStock(L, r) {
  const cards = shuffle([...LOOT_CARDS], r).slice(0, 2);
  return [...cards.map(c => ({ card: c, p: 12 })), { item: 'potion', p: 15 }, { gear: 1, p: 0 }];
}
function shopBuy(run, i) {
  const n = run.map.N[run.pos],
    s = n.stock && n.stock[i];
  if (!s || s.sold) return false;
  const o = s.gear ? (s.o = s.o || lootItem(run, rr(run, 9), 1)) : null,
    p = s.gear ? Math.round(itemPrice(o) * 1.5 + 6) : s.p;
  if (run.gold < p) return false;
  run.gold -= p;
  s.sold = 1;
  if (s.card) {
    run.deck.push(s.card);
    run.disc.push(s.card);
  } else run.ground.push(s.item ? mkItem(s.item) : o);
  return true;
}
const shopPrice = (run, s) =>
  s.gear ? Math.round(itemPrice((s.o = s.o || lootItem(run, rr(run, 9), 1))) * 1.5 + 6) : s.p;
/* ================= 事件（台灣民俗） ================= */
const EVENTS = [
  {
    n: '土地公廟',
    ic: '🏮',
    d: '香火還在燒，旁邊有個功德箱。',
    o: [
      { n: '投 20 金：回滿生命', need: 20, f: run => ((run.gold -= 20), (run.hp = P_of(run).mhp), '生命回滿了') },
      { n: '拜一拜就走', f: () => '心裡踏實了一點' }
    ]
  },
  {
    n: '地上的紅包',
    ic: '🧧',
    d: '撿起來就會有人來找你。',
    o: [
      {
        n: '撿：+金幣、熱度 +6',
        f: run => {
          const g = Math.round(25 * (1 + 0.35 * (runL(run) - 1)));
          run.gold += g;
          addHeat(run, 6);
          return `+${g} 金`;
        }
      },
      { n: '不撿', f: () => '什麼事都沒發生' }
    ]
  },
  {
    n: '夜市攤販',
    ic: '🍢',
    d: '老闆塞了一張奇怪的牌給你。',
    o: [
      {
        n: '花 10 金：拿一張牌',
        need: 10,
        f: run => {
          const c = pick(LOOT_CARDS, rr(run, 11));
          run.gold -= 10;
          run.deck.push(c);
          run.disc.push(c);
          return `拿到「${CARDS[c].n}」`;
        }
      },
      { n: '離開', f: () => '你繼續往前走' }
    ]
  },
  {
    n: '孟婆湯',
    ic: '🍵',
    d: '喝了會忘記一些事，也讓追你的東西忘了你。',
    o: [
      {
        n: '喝：熱度 -10、生命 -20%',
        f: run => {
          if (run.hot) return '熱度已經滿了，湯沒有用';
          addHeat(run, -10);
          run.hp = Math.max(1, run.hp - Math.round(P_of(run).mhp * 0.2));
          return '熱度 -10';
        }
      },
      { n: '不喝', f: () => '湯涼了' }
    ]
  }
];
function eventPick(run, j) {
  const p = run.pend;
  if (!p || p.k !== 'event') return null;
  const o = EVENTS[p.e].o[j];
  if (!o || (o.need && run.gold < o.need)) return null;
  run.map.N[run.pos].done = 1;
  const msg = o.f(run);
  run.pend = { k: 'msg', ic: EVENTS[p.e].ic, t: EVENTS[p.e].n, d: msg };
  return msg;
}
/* 下樓：生命與熱度延續，牌組重洗 */
function goDown(run) {
  if (!run.pend || run.pend.k !== 'stairs') return false;
  run.f++;
  run.pend = null;
  run.ground = [];
  enterFloor(run);
  return true;
}
/* 撤離或死亡：回傳要寫回存檔的結果（meta.js 的 finishRun 寫回） */
function runResult(run, ok) {
  const L = runL(run),
    xp = Math.round((20 * L + run.kills * 2 + (run.boss ? 60 : 0)) * (ok ? 1 : 0.4));
  let gold = run.gold;
  if (!ok) {
    const cap = run.box.items.filter(o => o.id === 'purse').reduce((s, o) => s + baseOf(o).cap, 0);
    gold = Math.min(gold, cap);
  }
  return { ok, xp, gold, L, d: run.d, f: run.f, boss: run.boss, kills: run.kills, turn: run.turn };
}
