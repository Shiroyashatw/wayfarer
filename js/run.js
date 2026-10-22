/* 塞令老師 · 一局的流程：回合、商店、經濟、野怪與首領、對手（快照或機器人）、名次 */
'use strict';
/* ================= 野怪、菁英、首領（也是一組道具，直接寫成戰鬥用的角色） ================= */
const mkW = (cd, a, b, on = {}) => ({
  u: 'm',
  id: 'm',
  pet: false,
  el: on.el || 'phys',
  cd,
  dmg: [a, b],
  crit: on.crit || 0,
  burn: on.burn || 0,
  poison: on.poison || 0,
  freeze: on.freeze || [0, 0],
  stun: on.stun || [0, 0],
  ls: on.ls || 0
});
const mkF = (hp, o = {}) => ({
  hp,
  arm: o.arm || 0,
  dodge: o.dodge || 0,
  regen: o.regen || 0,
  ls: 0,
  critMul: 160,
  take: 0,
  weapons: o.w || [],
  shields: (o.s || []).map(([cd, block]) => ({ u: 'm', cd, block, thorns: 0, heal: 0 })),
  pots: []
});
const MOBS = {
  '1-2': [
    { n: '綠史萊姆', spr: 'a_m_slime_green', F: () => mkF(35, { w: [mkW(1.6, 2, 3)] }) },
    { n: '蝙蝠', spr: 'a_m_bat', F: () => mkF(28, { dodge: 10, w: [mkW(1, 1, 2)] }) }
  ],
  '1-3': [
    { n: '稻草人', spr: 'a_m_scarecrow', F: () => mkF(50, { arm: 2, w: [mkW(1.5, 2, 4)] }) },
    { n: '火史萊姆', spr: 'a_m_slime_fire', F: () => mkF(45, { w: [mkW(1.7, 2, 3, { burn: 1, el: 'fire' })] }) }
  ],
  '1-4': [
    {
      n: '雷蝠王',
      spr: 'a_m_thunderbat',
      F: () => mkF(85, { dodge: 12, w: [mkW(1.1, 2, 4, { stun: [10, 0.4], el: 'light' })] })
    },
    { n: '殭屍', spr: 'a_jiangshi', F: () => mkF(100, { arm: 3, regen: 1, w: [mkW(1.8, 4, 6)] }) }
  ],
  /* 2-2 群體小怪：很多隻一起打（很多把弱武器），考驗範圍傷害與清怪效率 */
  '2-2': [
    {
      n: '史萊姆群',
      spr: 'a_m_slime_green',
      F: () => mkF(110, { w: [mkW(1.4, 1, 3), mkW(1.6, 1, 3), mkW(1.8, 1, 3), mkW(2, 1, 3)] })
    },
    {
      n: '蝙蝠群',
      spr: 'a_m_bat',
      F: () => mkF(90, { dodge: 15, w: [mkW(0.9, 1, 2), mkW(1, 1, 2), mkW(1.1, 1, 2), mkW(1.2, 1, 2)] })
    },
    {
      n: '骷髏兵團',
      spr: 'a_skeleton',
      F: () => mkF(120, { arm: 3, w: [mkW(1.6, 2, 3), mkW(1.8, 2, 3), mkW(2, 2, 4)] })
    }
  ],
  /* 2-5 菁英首領：各有一個機制要破（高護甲、高閃避會暈人、會回血會凍人） */
  '2-5': [
    { n: '牛頭', spr: 'a_oxhead', F: () => mkF(190, { arm: 4, w: [mkW(2, 7, 10)], s: [[4, 12]] }) },
    {
      n: '馬面',
      spr: 'a_horseface',
      F: () => mkF(170, { dodge: 10, w: [mkW(1.2, 4, 6), mkW(2.5, 6, 8, { stun: [20, 0.5] })] })
    },
    {
      n: '水鬼',
      spr: 'a_shuigui',
      F: () => mkF(175, { regen: 3, w: [mkW(1.5, 4, 7, { freeze: [30, 1], el: 'cold' })] })
    }
  ]
};
/* ================= 一局 ================= */
/* 這局專用的亂數（存在存檔裡，重新整理也一樣） */
const runR = run => rng(h(run.seed, run.rc++, 77));
const r01 = run => runR(run)();
const pick = (run, a) => a[fl(r01(run) * a.length)];
function newRunState(seed) {
  return {
    seed,
    rc: 0,
    ri: -1,
    hp: START_HP,
    gold: 0,
    lv: 1,
    bag: { w: BAGLV[1].w, h: BAGLV[1].h, items: [] },
    bench: Array(BENCH_N).fill(null),
    shop: [],
    lock: false,
    sale: false,
    ws: 0,
    lsk: 0,
    un: 0
  };
}
/* 開新的一局；rivals 是 3 位對手（ghost.js 配好，或機器人） */
function newRun(rivals) {
  const run = newRunState((Math.random() * 2 ** 31) | 0);
  Object.assign(run, {
    rivals,
    rp: 0,
    log: [],
    phase: 'prep',
    pend: null,
    place: null,
    startAt: Date.now(),
    rating0: S.rating
  });
  nextRound(run);
  return run;
}
const curRound = run => ROUNDS[run.ri];
/* 商店的一格：照背包等級的機率抽星級（商店關多升一級、半價） */
function rollItem(run, special) {
  const lv = Math.min(BAG_MAX, run.lv + (special ? 1 : 0)),
    od = BAGLV[lv].odds;
  let x = r01(run) * 100,
    st = 1;
  for (let i = 0; i < 5; i++) {
    if (x < od[i]) {
      st = i + 1;
      break;
    }
    x -= od[i];
  }
  if (special) st = Math.max(st, 2);
  /* 職業核心只在商店關的 5★ 出現 */
  const pool = ITEMS.filter(it => it.star === st && (special && st === 5 ? true : !it.core));
  return pick(run, pool.length ? pool : ITEMS.filter(it => it.star === 1)).id;
}
function rollShop(run, special = false) {
  run.sale = special;
  run.shop = Array.from({ length: SHOP_N }, () => ({
    id:
      run.ri === 0
        ? pick(
            run,
            ITEMS.filter(i => i.star === 1)
          ).id
        : rollItem(run, special)
  }));
}
const shopPrice = (run, id) => (run.sale ? Math.ceil(priceOf(id) / 2) : priceOf(id));
const newItem = (run, id, t = 1) => ({ u: 'i' + run.un++, id, t, x: 0, y: 0, r: 0, a: null });
const benchFree = run => run.bench.indexOf(null);
/* 買：放進暫存區，湊滿 3 件就合成 */
function buyItem(run, k) {
  const s = run.shop[k];
  if (!s) return '這格已經買了';
  const p = shopPrice(run, s.id);
  if (run.gold < p) return '金幣不夠';
  const fi = benchFree(run);
  if (fi < 0) return '暫存區滿了，先把道具放進背包或賣掉';
  run.gold -= p;
  run.bench[fi] = newItem(run, s.id);
  run.shop[k] = null;
  return { merged: mergeAll(run, runR(run)) };
}
function sellItem(run, u) {
  let o = run.bag.items.find(q => q.u === u);
  if (o) run.bag.items = run.bag.items.filter(q => q !== o);
  else {
    const i = run.bench.findIndex(q => q && q.u === u);
    if (i < 0) return 0;
    o = run.bench[i];
    run.bench[i] = null;
  }
  const v = sellOf(o.id, o.t);
  run.gold += v;
  return v;
}
function rerollShop(run) {
  if (run.gold < REROLL) return '金幣不夠';
  run.gold -= REROLL;
  rollShop(run, run.sale);
  return '';
}
/* 背包升級：變大、商店機率變好；放不下的不會發生（只會變大） */
function levelUp(run) {
  if (run.lv >= BAG_MAX) return '背包已經最大了';
  const c = BAGLV[run.lv + 1].cost;
  if (run.gold < c) return '金幣不夠';
  run.gold -= c;
  run.lv++;
  run.bag.w = BAGLV[run.lv].w;
  run.bag.h = BAGLV[run.lv].h;
  return '';
}
/* 下一回合：收入、商店 */
function nextRound(run) {
  run.ri++;
  const r = curRound(run);
  run.pend = null;
  if (!r) return endRun(run, finalPlace(run));
  if (run.ri === 0) {
    run.gold = START_GOLD;
    rollShop(run);
  } else {
    run.gold += BASE_INCOME + Math.min(INTEREST_MAX, fl(run.gold / 10)) + streakBonus(Math.max(run.ws, run.lsk));
    if (r.type === 'shop') rollShop(run, true);
    else if (!run.lock) rollShop(run);
    else run.sale = false;
  }
  run.lock = false;
  run.phase = 'prep';
}
/* ================= 對手 ================= */
/* 對手在這一回合還在不在：有這回合的快照、而且生命 > 0 */
/* 第 1 名的對局在他贏的那回合就結束了，之後的回合沿用他最後的快照（不然會被當成淘汰） */
function rivalSnap(rv, rid) {
  const s = rv.snaps || {};
  if (s[rid] || rv.place !== 1) return s[rid];
  const ri = ROUNDS.findIndex(r => r.id === rid);
  for (let k = ri - 1; k >= 0; k--) if (s[ROUNDS[k].id]) return s[ROUNDS[k].id];
  return undefined;
}
const rivalAlive = (rv, rid) => !!rivalSnap(rv, rid) && rivalSnap(rv, rid).hp > 0;
const aliveRivals = run => run.rivals.filter(rv => rivalAlive(rv, curRound(run).id));
/* 這回合的對手：PvP 輪流打還活著的；其他是野怪 */
function opponentOf(run) {
  const r = curRound(run);
  if (r.type === 'pvp') {
    const al = run.rivals.map((rv, i) => [rv, i]).filter(([rv]) => rivalAlive(rv, r.id));
    if (!al.length) return null;
    const [rv, i] = al.find(([, i]) => i >= run.rp % run.rivals.length) || al[0];
    run.rp = i + 1;
    const sn = rivalSnap(rv, r.id);
    return {
      kind: 'pvp',
      n: rv.name,
      spr: 'a_' + rv.av,
      F: compileBag(unpackBag(sn.bag)),
      bag: unpackBag(sn.bag),
      rv: i
    };
  }
  const pool = MOBS[r.id] || MOBS['1-3'],
    m = pick(run, pool);
  return { kind: r.type, n: m.n, spr: m.spr, F: m.F() };
}
/* ================= 戰鬥 ================= */
/* 開戰：存快照（給別人當對手）、算好整場（固定亂數） */
function startFight(run) {
  const r = curRound(run);
  if (typeof ghostSnap === 'function') ghostSnap(run, r.id);
  const opp = opponentOf(run);
  if (!opp) return null;
  const me = compileBag(run.bag),
    res = simulate(me, opp.F, h(run.seed, run.ri, 991));
  return { r, opp, me, res };
}
/* 打完：扣血、連勝連敗、獎勵；回傳這場的結算 */
function finishFight(run, fb) {
  const { r, opp, res } = fb,
    out = { win: res.win, loss: 0, gold: 0 };
  if (res.win) {
    run.ws++;
    run.lsk = 0;
    out.gold = r.type === 'pve' ? 2 : 1;
  } else {
    run.lsk++;
    run.ws = 0;
    out.loss =
      r.loss +
      (opp.kind === 'pvp' ? Math.min(2, opp.bag.items.filter(o => ITEMI[o.id].tags.includes('pet')).length) : 0);
    run.hp -= out.loss;
  }
  run.gold += out.gold;
  run.log.push({ id: r.id, type: r.type, win: res.win, opp: opp.n, loss: out.loss });
  /* 菁英：三選一道具（2～3★）；首領：三選一職業核心 */
  if (r.type === 'elite')
    run.pend = {
      kind: 'pick',
      t: '菁英的戰利品：選一件',
      opts: [0, 1, 2].map(
        () =>
          pick(
            run,
            ITEMS.filter(i => !i.core && (i.star === 2 || i.star === 3))
          ).id
      )
    };
  if (r.type === 'boss') {
    const cs = ITEMS.filter(i => i.core).map(i => i.id),
      o = [];
    while (o.length < 3) {
      const c = pick(run, cs);
      if (!o.includes(c)) o.push(c);
    }
    run.pend = { kind: 'pick', t: '首領掉落了職業核心：選一個', opts: o };
  }
  if (run.hp <= 0) {
    run.hp = 0;
    endRun(run, 1 + aliveRivals(run).length);
  } else {
    /* 下一場對戰時對手都淘汰了：第 1 名 */
    const np = nextPvpId(run);
    if (np && !run.rivals.some(rv => rivalAlive(rv, np))) endRun(run, 1);
  }
  return out;
}
/* 下一個有對戰的回合（看對手還在不在） */
function nextPvpId(run) {
  for (let i = run.ri + 1; i < ROUNDS.length; i++) if (ROUNDS[i].type === 'pvp') return ROUNDS[i].id;
  return null;
}
/* 打到最後一回合：比剩下的生命 */
function finalPlace(run) {
  const last = ROUNDS[ROUNDS.length - 1].id;
  return 1 + run.rivals.filter(rv => rivalSnap(rv, last) && rivalSnap(rv, last).hp > run.hp).length;
}
function endRun(run, place) {
  if (run.place) return;
  run.place = place;
  run.phase = 'end';
  const d = PLACE_PTS[place] || 0;
  run.delta = d;
  S.rating = Math.max(0, S.rating + d);
  S.games = (S.games || 0) + 1;
  S.best = Math.min(S.best || 9, place);
  S.hist = [{ at: Date.now(), place, d, r: curRound(run) ? curRound(run).id : 'end' }, ...(S.hist || [])].slice(0, 30);
  if (typeof ghostEnd === 'function') ghostEnd(run);
}
/* 三選一的獎勵放進暫存區 */
function takePick(run, id) {
  const fi = benchFree(run);
  if (fi < 0) return '暫存區滿了，先騰出一格';
  run.bench[fi] = newItem(run, id);
  run.pend = null;
  mergeAll(run, runR(run));
  return '';
}
/* ================= 機器人對手（沒有真人快照時補位；跟玩家用同一套規則跑一整局） ================= */
const THEMES = ['sword', 'bow', 'dagger', 'fire', 'pet', 'shield', 'mace', 'cold', 'poison'];
/* 機器人這回合的買法：有主題就偏好主題標籤；能升背包就升；全部擺進背包 */
function botAct(run, theme, q = 0.7) {
  const r = curRound(run);
  if (run.lv < BAG_MAX && run.gold >= BAGLV[run.lv + 1].cost + 2 && (run.ri > 3 || run.gold > 12)) levelUp(run);
  for (let pass = 0; pass < 2; pass++) {
    run.shop.forEach((s, k) => {
      if (!s) return;
      const I = ITEMI[s.id],
        want = I.tags.includes(theme) || I.tags.includes('weapon') || I.tags.includes('armor') || r01(run) < 0.35;
      if (want && run.gold >= shopPrice(run, s.id) && benchFree(run) >= 0) buyItem(run, k);
    });
    if (run.gold >= 3 && run.gold < 8 && pass === 0 && r01(run) < q) rerollShop(run);
  }
  if (run.pend) takePick(run, run.pend.opts[0]);
  /* 職業核心放不下：賣掉背包裡最便宜的道具騰空間 */
  const core = run.bench.find(o => o && ITEMI[o.id].core);
  if (core && !run.bag.items.some(o => ITEMI[o.id].core))
    for (let g = 0; g < 4 && !findSpot(run.bag, core); g++) {
      const low = [...run.bag.items].sort((a, b) => ITEMI[a.id].star * a.t - ITEMI[b.id].star * b.t)[0];
      if (!low || ITEMI[low.id].star >= 4) break;
      sellItem(run, low.u);
    }
  /* 暫存區的擺進背包（大的先），放不下的賣掉 */
  run.bench
    .filter(Boolean)
    .sort((a, b) => shapeOf(b.id).length - shapeOf(a.id).length)
    .forEach(o => {
      const sp = findSpot(run.bag, o, r01(run) < q);
      if (!sp) return;
      Object.assign(o, sp);
      run.bench[run.bench.indexOf(o)] = null;
      run.bag.items.push(o);
    });
  run.bench.forEach(o => o && ITEMI[o.id].star < 3 && sellItem(run, o.u));
  mergeAll(run, runR(run));
}
/* 機器人一場（0.4.0）：4 個機器人用跟玩家一樣的規則跑一整局，每回合真的用背包互打（同一套戰鬥模擬），
   生命與淘汰照實際勝負；強的背包活得久。回傳每個機器人的快照（開戰前的生命與背包）、名次。
   rating 越高的機器人買法越聰明（q：擺放看加成、會刷新商店）。 */
function simLobby(seed, rating) {
  const rr = rng(h(seed, 5)),
    bots = [0, 1, 2, 3].map(i => {
      const s = h(seed, i, 31),
        rt = Math.max(600, rating + fl((rr() - 0.5) * 300));
      return {
        run: newRunState(s),
        theme: THEMES[fl(rr() * THEMES.length)],
        q: Math.max(0.3, Math.min(0.95, 0.6 + (rt - 1000) / 800)),
        info: {
          name: randName(rng(h(s, 9))),
          av: AVATARS[(s >>> 3) % AVATARS.length][0],
          rating: rt,
          bot: 1,
          snaps: {}
        },
        out: null
      };
    });
  let order = 0;
  for (let k = 0; k < ROUNDS.length; k++) {
    const alive = bots.filter(b => !b.out);
    if (alive.length <= 1) break;
    for (const b of alive) {
      nextRound(b.run);
      botAct(b.run, b.theme, b.q);
    }
    const r = ROUNDS[k];
    if (r.type === 'start' || r.type === 'shop') continue;
    for (const b of alive) b.info.snaps[r.id] = { hp: b.run.hp, bag: packBag(b.run.bag) };
    alive.forEach((b, i) => {
      const run = b.run;
      let F;
      if (r.type === 'pvp') {
        /* 輪流打其他還活著的機器人（打的是對方這回合的快照，只影響自己） */
        const o = alive[(i + 1 + (k % (alive.length - 1))) % alive.length];
        F = compileBag(o.run.bag);
      } else F = pick(run, MOBS[r.id] || MOBS['1-3']).F();
      const res = simulate(compileBag(run.bag), F, h(seed, k, i));
      if (!res.win) run.hp -= r.loss;
      if (r.type === 'elite' || r.type === 'boss') {
        const pool = ITEMS.filter(it => (r.type === 'boss' ? it.core : !it.core && it.star >= 2 && it.star <= 3));
        run.pend = { opts: [pick(run, pool).id] };
      }
    });
    for (const b of alive) if (b.run.hp <= 0) b.out = ++order;
  }
  /* 名次：越晚淘汰越前面；活到最後的照剩下生命 */
  const rk = [...bots].sort((a, b) => (b.out || 99) - (a.out || 99) || b.run.hp - a.run.hp);
  rk.forEach((b, i) => (b.info.place = i + 1));
  return bots.map(b => b.info);
}
/* 補位用的 n 位機器人對手（從一場機器人對局裡取） */
function makeBots(n, rating) {
  return simLobby((Math.random() * 2 ** 31) | 0, rating).slice(0, n);
}
