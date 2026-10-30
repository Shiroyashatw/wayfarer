/* dungeonPOE · 一趟地城：隨機地圖、點了就走、熱度與生肖、遭遇（怪物有背包）、戰利品、逃跑、愛心、撤離與死亡（純邏輯） */
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
    arm = 0,
    el = def.el || 'phys';
  const on = { ...(def.on || {}) },
    res = { ...(def.res || {}) };
  for (const a of aff) {
    if (a === 'fast') cd /= 1.4;
    if (a === 'tough') mhp *= 1.5;
    if (a === 'iron') arm += 3;
    /* 攻擊屬性：本身有就用本身的，沒有才用第一個元素詞綴 */
    const ae = { fire: 'fire', frost: 'cold', storm: 'light' }[a];
    if (ae) {
      on[{ fire: 'burn', cold: 'freeze', light: 'shock' }[ae]] =
        (on[{ fire: 'burn', cold: 'freeze', light: 'shock' }[ae]] || 0) + (ae === 'cold' ? 25 : 50);
      res[ae] = (res[ae] || 0) + 40;
      if (el === 'phys') el = ae;
    }
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
    el,
    res,
    sk: def.sk || null
  };
}
const MAFFK = Object.keys(MAFF);
/* 隨機一件道具（照這一層的深度與熱度；n 是詞綴數；bonus 是多深幾級）。
   T 級：第 1 層最好 T12～T11，越深越好（第三座地城才看得到 T1、T2） */
const bestTier = (L, heat, bonus = 0) =>
  Math.max(1, Math.min(12, 12 - fl((L - 1) * 1.25) - (heat ? 1 : 0) - bonus * 2));
function rollGear(L, heat, r, n, bonus = 0) {
  const LL = L + bonus,
    mx = Math.min(5, 1 + fl(LL / 2)),
    pool = GEAR.filter(b => b.star <= mx && b.star >= Math.max(1, mx - 2));
  return rollItem(pick(pool, r).id, n, bestTier(L, heat, bonus), r);
}
/* 怪物（或寶箱）的背包：裡面的裝備讓帶頭的怪變強，打贏了就是戰利品。
   稀有度照 D2：白 0 條、藍 1～2 條、黃 3～6 條（rollCount 的兩個數字是藍、黃的機率） */
function lootBag(t, L, heat, r) {
  const hb = 0.1 * heat,
    g = { t: { fight: 'm33', chest: 'm33', elite: 'm44', zod: 'm44', boss: 'm55' }[t], items: [] },
    put = o => autoPlace(g, o),
    gear = (blue, rare, bonus) => put(rollGear(L, heat, r, rollCount(r, blue + hb, rare + hb / 2), bonus));
  if (t === 'fight') {
    gear(0.3, 0.04);
    if (r() < 0.35) gear(0.3, 0.04);
    if (r() < 0.12) put(mkItem('potion'));
  } else if (t === 'chest') {
    gear(0.45, 0.1);
    if (r() < 0.4) gear(0.3, 0.05);
    if (r() < 0.15) put(mkItem('potion'));
  } else if (t === 'elite') {
    gear(0.65, 0.35);
    gear(0.35, 0.08);
    if (r() < 0.5) gear(0.35, 0.08);
  } else if (t === 'boss') {
    put(rollGear(L, heat, r, 3 + fl(r() * 3), 1));
    gear(0.6, 0.4, 1);
    gear(0.5, 0.15);
    gear(0.4, 0.1);
    put(mkItem('potion'));
  } else if (t === 'zod') {
    const o = rollGear(L, heat, r, 3 + fl(r() * 2), 1);
    o.a.forEach(x => {
      if (x.t > 3) {
        x.t = 3;
        const [lo, hi] = AFFI[x.id].tiers[2];
        x.v = Math.max(lo, Math.min(hi, x.v));
      }
    });
    put(o);
    gear(0.6, 0.15);
  }
  return g;
}
/* 帶頭的怪拿著背包裡的裝備：武器各自出手、防具加生命護甲；本身的數值打 7 折（裝備補回來） */
function equipFoe(f, g) {
  const P = compile(g, { cls: null, cores: [], clv: {}, tal: {} }),
    out = {
      ...f,
      mhp: Math.round(f.mhp * 0.75 + (P.mhp - BASE_HP) * 2 + P.shields.reduce((s, x) => s + x.block * 2, 0)),
      arm: f.arm + P.arm
    };
  out.atk = f.atk.map(v => Math.max(1, Math.round(v * 0.7)));
  out.wps = P.weapons.map(w => ({
    dmg: w.dmg,
    flat: w.flat,
    mul: w.mul,
    cd: w.cd,
    crit: w.crit,
    on: w.on,
    n: w.n,
    u: w.u
  }));
  return out;
}
function foesFor(t, L, heat, r, d) {
  let foes = [];
  if (t === 'fight') {
    /* 第一層最多 2 隻（新手的第一場不會是打不贏的 3 隻） */
    const n = r() < 0.35 ? 1 : r() < 0.7 || L < 2 ? 2 : 3;
    foes = Array.from({ length: n }, () => mkFoe(pick(MOBS, r), 'mob', L, heat, r)).map(f => ({
      ...f,
      mhp: Math.round(f.mhp * (n === 1 ? 1.3 : n === 3 ? 0.75 : 1))
    }));
  } else if (t === 'elite') {
    const a = [pick(MAFFK, r)];
    if (L >= 4 && r() < 0.5)
      a.push(
        pick(
          MAFFK.filter(k => k !== a[0]),
          r
        )
      );
    foes = [mkFoe(pick(MOBS, r), 'elite', L, heat, r, a)];
    if (r() < 0.5) foes.push(mkFoe(pick(MOBS, r), 'mob', L, heat, r));
  } else if (t === 'boss')
    foes = [mkFoe(BOSSES[(d - 1) % BOSSES.length], 'boss', L, heat, r, d > BOSSES.length ? ['tough'] : [])];
  const bag = lootBag(t, L, heat, r);
  foes[0] = equipFoe(foes[0], bag);
  return { foes, bag };
}
/* ================= 地圖 ================= */
/* 每層 6 排、15～20 格：第 0 排是入口，最上排有樓梯（第 3 層是王）；邊 c 是步數（險路 2 步）、o 是單行道（只能往上） */
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
    if ('fight elite boss'.includes(n.t)) Object.assign(n, foesFor(n.t, L, heat, r, d));
    if (n.t === 'chest') n.bag = lootBag('chest', L, heat, r);
    if (n.t === 'shop') n.stock = shopStock(L, r);
  }
  return { N, E, seed };
}
/* 從 a 能走到的邊（考慮單行道；any＝不管方向，生肖用） */
function moves(map, a, any) {
  const out = [];
  for (const e of map.E) {
    if (e.a === a) out.push({ to: e.b, c: e.c });
    else if (e.b === a && (!e.o || any)) out.push({ to: e.a, c: e.c });
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
const emptyGround = () => ({ t: 'g', items: [] });
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
    ground: emptyGround(),
    hp: 0,
    hearts: HEARTS,
    gold: 0,
    kills: 0,
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
/* 戰鬥用的數值：抗性扣掉這座地城的懲罰 */
const P_of = run => {
  const P = compile(run.bag, run.hero);
  P.rf = finalRes(P, run.d);
  return P;
};
function enterFloor(run) {
  run.map = genMap(h(run.seed, run.f), run.d, run.f, heatLv(run));
  run.pos = run.prev = 0;
  run.zs = [];
  run.ground = emptyGround();
  reveal(run);
}
function addHeat(run, v) {
  if (run.hot && v < 0) return;
  run.heat = Math.max(0, Math.min(HEAT.max, run.heat + v));
  if (run.heat >= HEAT.max && !run.hot) {
    run.hot = run.turn;
    spawnZod(run);
  }
}
/* ================= 移動（點相鄰的格子就走，像殺戮尖塔） ================= */
const canMove = (run, to) => !run.pend && moves(run.map, run.pos).find(m => m.to === to);
/* 走一格：每步熱度 +1（險路 2 步）；生肖每 2 步追 1 格；熱度滿了每 4 步生一隻。地上沒撿的東西走開就不見 */
function moveTo(run, to) {
  const m = canMove(run, to);
  if (!m) return false;
  run.prev = run.pos;
  run.pos = to;
  run.ground = emptyGround();
  for (let k = 0; k < m.c; k++) step(run);
  reveal(run);
  if (!run.pend) arrive(run);
  return true;
}
function step(run) {
  run.turn++;
  addHeat(run, HEAT.step);
  if (run.turn % 2 === 0)
    for (const z of run.zs) {
      if (z.pos === run.pos) continue;
      const D = dists(run.map, run.pos),
        nb = moves(run.map, z.pos, 1).map(m => m.to);
      z.pos = nb.reduce((b, x) => (D[x] < D[b] ? x : b), z.pos);
    }
  if (run.hot && run.turn > run.hot && (run.turn - run.hot) % HEAT.zodEvery === 0) spawnZod(run);
  const z = run.zs.find(z => z.pos === run.pos);
  if (z) run.pend = { k: 'fight', zod: z.id, foes: z.foes, bag: z.bag, forced: 1 };
}
function arrive(run) {
  const n = run.map.N[run.pos],
    z = run.zs.find(z => z.pos === run.pos);
  if (z) return (run.pend = { k: 'fight', zod: z.id, foes: z.foes, bag: z.bag });
  if (n.done) return null;
  if ('fight elite boss'.includes(n.t)) run.pend = { k: 'fight', foes: n.foes, bag: n.bag };
  else if (n.t === 'chest') {
    n.done = 1;
    addHeat(run, HEAT.chest);
    run.ground = n.bag;
    const gold = Math.round((6 + rr(run, 8)() * 8) * (1 + 0.35 * (runL(run) - 1)));
    run.gold += gold;
    run.pend = { k: 'loot', chest: 1, gold };
  } else if (n.t === 'rest') {
    const P = P_of(run),
      v = Math.round(P.mhp * 0.35);
    run.hp = Math.min(P.mhp, run.hp + v);
    n.done = 1;
    run.pend = { k: 'msg', ic: '🏕️', t: '休息', d: `回 ${v} 生命` };
  } else if (n.t === 'shop') run.pend = { k: 'shop' };
  else if (n.t === 'event') run.pend = { k: 'event', e: (run.seed + run.f * 7 + run.pos) % EVENTS.length };
  else if (n.t === 'exit') run.pend = { k: 'exit' };
  else if (n.t === 'stairs') run.pend = { k: 'stairs' };
  return run.pend;
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
    ],
    bag = lootBag('zod', runL(run), 2, r);
  run.zs.push({ id: run.zN, pos: best.id, foes: [equipFoe(mkFoe(def, 'zod', runL(run), 2, r, aff), bag)], bag });
  run.zN++;
  run.log.push({ zod: def.n });
}
/* ================= 遭遇：打或跑 ================= */
function fightNow(run) {
  const p = run.pend;
  if (!p || p.k !== 'fight') return null;
  const P = P_of(run),
    res = simulate(P, run.hp, p.foes, h(run.seed, run.turn * 31 + run.pos, run.f));
  addHeat(run, HEAT.fight);
  for (const u of res.used) {
    const i = run.bag.items.findIndex(o => o.u === u);
    if (i >= 0) run.bag.items.splice(i, 1);
  }
  const n = run.map.N[run.pos];
  if (res.win) {
    run.hp = res.hp;
    run.kills += res.foes.length;
    const loot = lootFor(run, p.zod != null ? 'zod' : n.t, p.bag);
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
  run.pend = null;
  return true;
}
/* ================= 戰利品：打贏了，怪物的背包攤在地上 ================= */
const lootItem = (run, r, n, bonus = 0) => rollGear(runL(run), heatLv(run), r, n, bonus);
function lootFor(run, t, bag) {
  const gm = 1 + 0.35 * (runL(run) - 1),
    gold = Math.round({ fight: 6, elite: 16, boss: 60, zod: 45 }[t] * gm * (0.8 + rr(run, 7)() * 0.4));
  run.gold += gold;
  run.ground = bag || emptyGround();
  return { gold };
}
/* ================= 地城商人 ================= */
function shopStock(L, r) {
  return [
    { item: 'potion', p: 15 },
    { item: 'purse', p: 30 },
    { gear: 1, p: 0 },
    { gear: 2, p: 0 }
  ];
}
/* 買的東西放到地上（要自己拖進背包） */
function shopBuy(run, i) {
  const n = run.map.N[run.pos],
    s = n.stock && n.stock[i];
  if (!s || s.sold) return false;
  const p = shopPrice(run, s);
  if (run.gold < p) return false;
  const o = s.gear ? s.o : mkItem(s.item);
  if (!autoPlace(run.ground, o)) return false;
  run.gold -= p;
  s.sold = 1;
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
    d: '老闆在賣自己熬的藥。',
    o: [
      {
        n: '花 10 金：買一瓶藥水（放在地上）',
        need: 10,
        f: run => {
          run.gold -= 10;
          autoPlace(run.ground, mkItem('potion'));
          return '藥水放在地上了：記得放進背包';
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
/* 下樓：生命與熱度延續 */
function goDown(run) {
  if (!run.pend || run.pend.k !== 'stairs') return false;
  run.f++;
  run.pend = null;
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
