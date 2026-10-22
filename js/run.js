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
  '1-1': [
    { n: '綠史萊姆', spr: 'a_m_slime_green', F: () => mkF(28, { w: [mkW(1.7, 1, 3)] }) },
    { n: '蝙蝠', spr: 'a_m_bat', F: () => mkF(22, { dodge: 10, w: [mkW(1.1, 1, 2)] }) },
    { n: '香菇', spr: 'a_m_mushroom', F: () => mkF(32, { w: [mkW(1.9, 1, 3)] }) }
  ],
  '1-2': [
    { n: '稻草人', spr: 'a_m_scarecrow', F: () => mkF(42, { arm: 1, w: [mkW(1.6, 2, 3)] }) },
    { n: '流浪狗', spr: 'a_m_straydog', F: () => mkF(36, { w: [mkW(1.2, 1, 3)] }) },
    { n: '垃圾史萊姆', spr: 'a_m_slime_trash', F: () => mkF(36, { w: [mkW(2.4, 1, 2, { poison: 1 })] }) }
  ],
  '1-3': [
    { n: '火史萊姆', spr: 'a_m_slime_fire', F: () => mkF(60, { w: [mkW(1.6, 2, 3, { burn: 1, el: 'fire' })] }) },
    { n: '夜鷺', spr: 'a_m_nightheron', F: () => mkF(54, { dodge: 12, w: [mkW(1.2, 2, 3)] }) },
    { n: '火蟻', spr: 'a_m_fireant', F: () => mkF(58, { arm: 2, w: [mkW(1.3, 2, 4)] }) }
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
/* 0.1.7 每回合多拿的金幣：商人職業、背包裡的錢袋（每升一階 +1） */
const bonusGold = run =>
  ((CLSI[run.bag.cls] || {}).gold || 0) +
  run.bag.items.reduce((n, o) => n + (ITEMI[o.id].gold ? ITEMI[o.id].gold + o.t - 1 : 0), 0);
/* 0.1.8 選完職業送的起手道具：放進暫存區，回傳道具代號 */
function giveStarter(run) {
  const id = (CLSI[run.bag.cls] || {}).st,
    fi = benchFree(run);
  if (!id || !ITEMI[id] || fi < 0) return null;
  run.bench[fi] = newItem(run, id);
  mergeAll(run, runR(run));
  return id;
}
/* 開局職業三選一：隨機 3 個不重複 */
function rollClasses(run) {
  const ids = CLASSES.map(c => c.id),
    out = [];
  while (out.length < 3) {
    const id = ids.splice(fl(r01(run) * ids.length), 1)[0];
    out.push(id);
  }
  return out;
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
  /* 1-1 開打前先選職業 */
  run.phase = 'cls';
  run.clsOpts = rollClasses(run);
  run.clsRe = 1;
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
  /* 1-1 開打前的商店全是 1★，前 2 格保證是武器或寵物（不然第一場就打不了） */
  run.shop = Array.from({ length: SHOP_N }, (_, k) => ({
    id:
      run.ri === 0
        ? pick(
            run,
            ITEMS.filter(i => i.star === 1 && !i.core && (k >= 2 || i.dmg))
          ).id
        : rollItem(run, special),
    t: run.ri > 0 && r01(run) * 100 < (BAGLV[run.lv].t2 || 0) ? 2 : 1
  }));
}
/* t：商店也可能直接賣 Ⅱ 階（後期才有），價錢 ×3 */
const shopPrice = (run, id, t = 1) => {
  const p = priceOf(id) * 3 ** ((t || 1) - 1);
  return run.sale ? Math.ceil(p / 2) : p;
};
const newItem = (run, id, t = 1) => ({
  u: 'i' + run.un++,
  id,
  t,
  x: 0,
  y: 0,
  r: 0,
  a: null,
  m: ITEMI[id].star === 5 ? roll5(id, runR(run)) : null
});
const benchFree = run => run.bench.indexOf(null);
/* 買：放進暫存區，湊滿 3 件就合成 */
function buyItem(run, k) {
  const s = run.shop[k];
  if (!s) return '這格已經買了';
  const p = shopPrice(run, s.id, s.t);
  if (run.gold < p) return '金幣不夠';
  const fi = benchFree(run);
  if (fi < 0 && !wouldMerge(run, s.id, s.t || 1)) return '暫存區滿了，先把道具放進背包或賣掉';
  run.gold -= p;
  /* 0.1.5 暫存區滿了但買了就湊滿 3 件：先放在多出來的一格，合成後收回 */
  if (fi < 0) run.bench.push(newItem(run, s.id, s.t || 1));
  else run.bench[fi] = newItem(run, s.id, s.t || 1);
  run.shop[k] = null;
  const merged = mergeAll(run, runR(run));
  for (const o of run.bench.splice(BENCH_N)) if (o) run.bench[benchFree(run)] = o;
  return { merged };
}
/* 買這件會不會馬上湊滿 3 件 1 階（暫存區滿了也能買） */
const wouldMerge = (run, id, t = 1) =>
  [...run.bag.items, ...run.bench].filter(o => o && o.id === id && o.t === t).length >= 2 && t < TIER_MAX;
/* 0.1.1 從商店直接拖進背包：買下並放在 (x, y)（放得下才會叫到這裡）；swap 是被擠出來要收進暫存區的道具 */
function buyToBag(run, k, x, y, r, swap) {
  const s = run.shop[k];
  if (!s) return '這格已經買了';
  const p = shopPrice(run, s.id, s.t);
  if (run.gold < p) return '金幣不夠';
  if (swap && benchFree(run) < 0) return '暫存區滿了，換不下來';
  run.gold -= p;
  if (swap) {
    run.bag.items = run.bag.items.filter(q => q !== swap);
    run.bench[benchFree(run)] = swap;
  }
  run.bag.items.push({ ...newItem(run, s.id, s.t || 1), x, y, r });
  run.shop[k] = null;
  return { merged: mergeAll(run, runR(run)) };
}
/* 0.1.1 交換：o 要放到 (tx, ty)，那裡剛好擋著一件 B；B 換到 o 原本的位置（試每個旋轉）。
   o 從暫存區或商店來的話，B 收進暫存區。回傳交換方式，不能換回傳 null */
function swapPlan(run, o, tx, ty, from) {
  const bag = run.bag,
    g = bagGrid(bag),
    hit = new Set();
  for (const [dx, dy] of shapeOf(o.id, o.r)) {
    const cx = tx + dx,
      cy = ty + dy;
    if (cx < 0 || cy < 0 || cx >= bag.w || cy >= bag.h) return null;
    const u = g[cy][cx];
    if (u != null && u !== o.u) hit.add(u);
  }
  if (hit.size !== 1) return null;
  const B = bag.items.find(q => q.u === [...hit][0]),
    rest = bag.items.filter(q => q !== B && q !== o),
    tmp = { w: bag.w, h: bag.h, items: [...rest, { ...o, x: tx, y: ty }] };
  if (!canPlace({ w: bag.w, h: bag.h, items: rest }, o, tx, ty, o.r)) return null;
  if (from !== 'bag') return B ? { B, toBench: true } : null;
  for (const r of [B.r, (B.r + 1) & 3, (B.r + 2) & 3, (B.r + 3) & 3])
    if (canPlace(tmp, B, o.x, o.y, r)) return { B, x: o.x, y: o.y, r };
  return null;
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
/* 0.1.9 下一級背包開放了沒（BAGLV 的 from） */
const lvOpen = run => {
  const nx = BAGLV[run.lv + 1];
  return !!nx && (!nx.from || run.ri >= ROUNDS.findIndex(r => r.id === nx.from));
};
function levelUp(run) {
  if (run.lv >= BAG_MAX) return '背包已經最大了';
  const c = BAGLV[run.lv + 1].cost;
  if (!lvOpen(run)) return `${BAGLV[run.lv + 1].from} 才能升級背包`;
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
    run.gold +=
      BASE_INCOME + Math.min(INTEREST_MAX, fl(run.gold / 10)) + streakBonus(Math.max(run.ws, run.lsk)) + bonusGold(run);
    if (!run.lock) rollShop(run);
    run.sale = false;
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
/* 對手的生命：照他自己那局的快照（0.1.8 曾經加上「你打贏他」的傷害，0.1.10 改成對手那局打完就直接結算） */
const rivalHp = (rv, rid) => {
  const sn = rivalSnap(rv, rid);
  return sn ? Math.max(0, sn.hp - (rv.dmg || 0)) : 0;
};
const rivalAlive = (rv, rid) => rivalHp(rv, rid) > 0;
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
  const m = mobOf(run, r);
  return { kind: r.type, n: m.n, spr: m.spr, F: m.F };
}
/* 這回合的野怪／菁英／首領：有指定回合的用那一組；第 3 階段以後的菁英從菁英池挑一隻、照階段放大生命與傷害 */
/* 第 2 階段的菁英只用 1-4 那組（不能比 2-5 首領強），第 3 階段起加入首領那組 */
const ELITE_POOL = st => (st <= 2 ? MOBS['1-4'] : [...MOBS['1-4'], ...MOBS['2-5']]);
function mobOf(run, r) {
  if (MOBS[r.id]) {
    const m = pick(run, MOBS[r.id]);
    return { n: m.n, spr: m.spr, F: m.F() };
  }
  const m = pick(run, r.type === 'boss' ? MOBS['2-5'] : r.type === 'elite' ? ELITE_POOL(r.st) : MOBS['1-3']),
    k = r.st <= 2 ? 1.3 : 0.9 + 0.55 * (r.st - 1),
    F = m.F();
  F.hp = Math.round(F.hp * k);
  F.weapons.forEach(w => (w.dmg = w.dmg.map(v => Math.round(v * k))));
  F.shields.forEach(s => (s.block = Math.round(s.block * k)));
  return { n: (r.type === 'elite' ? '菁英・' : '') + m.n, spr: m.spr, F };
}
/* 菁英戰利品的星級：越後面越高（不含職業核心） */
const eliteStars = st => (st <= 2 ? [2, 3] : st <= 4 ? [3, 4] : [4, 5]);
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
  /* 菁英：三選一道具（星級照階段）；首領：三選一職業核心 */
  if (r.type === 'elite') {
    const [a, b] = eliteStars(r.st);
    run.pend = {
      kind: 'pick',
      t: '菁英的戰利品：選一件',
      opts: [0, 1, 2].map(
        () =>
          pick(
            run,
            ITEMS.filter(i => !i.core && i.star >= a && i.star <= b)
          ).id
      )
    };
  }
  if (r.type === 'boss') {
    /* 0.1.10 2-5 抽自己職業的專屬核心、4-4 抽副核心 */
    const kind = r.st <= 2 ? 1 : 2,
      cs = ITEMS.filter(i => i.core === kind && (!run.bag.cls || i.cls === run.bag.cls)).map(i => i.id),
      o = [];
    while (o.length < 3) {
      const c = pick(run, cs);
      if (!o.includes(c)) o.push(c);
    }
    run.pend = { kind: 'pick', t: kind === 1 ? '首領掉落了專屬核心：選一個' : '首領掉落了副核心：選一個', opts: o };
  }
  if (run.hp <= 0) {
    run.hp = 0;
    endRun(run, 1 + aliveRivals(run).length);
  } else {
    /* 下一場對戰時對手都淘汰了：第 1 名 */
    /* 0.1.10 還活著的對手那局都打完了（只剩第 1 名、沿用最後的快照）：直接照剩下的生命結算。
       不然你一直打他凍結的快照（他不會再變強），越後面越穩贏，名次會偏向玩家 */
    const np = nextPvpId(run);
    if (np && !run.rivals.some(rv => rivalAlive(rv, np))) endRun(run, 1);
    else if (rivalsDone(run))
      endRun(run, 1 + run.rivals.filter(rv => rivalAlive(rv, r.id) && rivalHp(rv, r.id) > run.hp).length);
  }
  return out;
}
/* 還活著的對手下一回合都沒有自己的快照了（他們那局已經打完） */
function rivalsDone(run) {
  const r = curRound(run),
    nx = ROUNDS[run.ri + 1];
  if (!nx) return false;
  const al = run.rivals.filter(rv => rivalAlive(rv, r.id));
  return al.length > 0 && al.every(rv => !(rv.snaps || {})[nx.id]);
}
/* 下一個有對戰的回合（看對手還在不在） */
function nextPvpId(run) {
  for (let i = run.ri + 1; i < ROUNDS.length; i++) if (ROUNDS[i].type === 'pvp') return ROUNDS[i].id;
  return null;
}
/* 打到最後一回合：比剩下的生命 */
function finalPlace(run) {
  const last = ROUNDS[ROUNDS.length - 1].id;
  return 1 + run.rivals.filter(rv => rivalHp(rv, last) > run.hp).length;
}
function endRun(run, place) {
  if (run.place) return;
  run.place = place;
  run.phase = 'end';
  const d = (PLACE_PTS[place] || 0) * ((S.games || 0) < PLACE_N ? 2 : 1);
  run.delta = d;
  run.rk0 = (S.games || 0) >= PLACE_N ? rankOf(S.rating) : -1;
  S.rating = Math.max(0, S.rating + d);
  S.games = (S.games || 0) + 1;
  S.best = Math.min(S.best || 9, place);
  S.hist = [{ at: Date.now(), place, d, r: curRound(run) ? curRound(run).id : 'end' }, ...(S.hist || [])].slice(0, 30);
  if (typeof ghostEnd === 'function') ghostEnd(run);
}
/* 三選一的獎勵放進暫存區 */
/* 0.1.6 暫存區滿了：剛好湊滿 3 件就先放多出來的一格合成；不然玩家的話先寄放在 run.hold（下回合空出位置再領），不會卡住 */
function takePick(run, id, hold) {
  const fi = benchFree(run);
  if (fi < 0 && !wouldMerge(run, id)) {
    if (!hold) return '暫存區滿了，先騰出一格';
    run.hold = newItem(run, id);
    run.pend = null;
    return '';
  }
  if (fi < 0) run.bench.push(newItem(run, id));
  else run.bench[fi] = newItem(run, id);
  run.pend = null;
  mergeAll(run, runR(run));
  for (const o of run.bench.splice(BENCH_N)) if (o) run.bench[benchFree(run)] = o;
  return '';
}
/* 領取寄放的戰利品：暫存區有空位就放進去，不然找背包的空位 */
function claimHold(run) {
  const o = run.hold;
  if (!o) return '';
  const fi = benchFree(run);
  if (fi >= 0) run.bench[fi] = o;
  else {
    const sp = findSpot(run.bag, o);
    if (!sp) return '還是放不下：先賣掉或擺好一件道具';
    Object.assign(o, sp);
    run.bag.items.push(o);
  }
  run.hold = null;
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
        want =
          I.tags.includes(theme) ||
          I.for === theme ||
          I.tags.includes('weapon') ||
          I.tags.includes('armor') ||
          r01(run) < 0.35;
      if (want && run.gold >= shopPrice(run, s.id, s.t) && benchFree(run) >= 0) buyItem(run, k);
    });
    if (run.gold >= 3 && run.gold < 8 && pass === 0 && r01(run) < q) rerollShop(run);
  }
  if (run.pend) takePick(run, run.pend.opts[0]);
  /* 職業核心放不下：賣掉背包裡最便宜的道具騰空間 */
  const core = run.bench.find(
    o => o && ITEMI[o.id].core && !run.bag.items.some(q => ITEMI[q.id].core === ITEMI[o.id].core)
  );
  if (core)
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
/* 機器人一場（0.1.0）：4 個機器人用跟玩家一樣的規則跑一整局，每回合真的用背包互打（同一套戰鬥模擬），
   生命與淘汰照實際勝負；強的背包活得久。回傳每個機器人的快照（開戰前的生命與背包）、名次。
   rating 越高的機器人買法越聰明（q：擺放看加成、會刷新商店）。 */
function simLobby(seed, rating) {
  const rr = rng(h(seed, 5)),
    bots = [0, 1, 2, 3].map(i => {
      const s = h(seed, i, 31),
        rt = Math.max(600, (rating || 1000) + fl((rr() - 0.5) * 150));
      const run = newRunState(s),
        opts = rollClasses(run),
        cls = opts[fl(rr() * 3)];
      run.bag.cls = cls;
      giveStarter(run);
      return {
        run,
        theme: CLSI[cls].th || THEMES[fl(rr() * THEMES.length)],
        q: Math.max(0.3, Math.min(0.95, 0.6 + (rt - 1000) / 800)),
        /* 0.1.6 牌階越高的機器人每回合多拿一點金幣（越往上越強）；鐵牌、銅牌少拿 */
        gb: Math.max(-2, Math.min(5, fl((rt - 1000) / 200))),
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
      if (b.run.ri > 0) b.run.gold = Math.max(0, b.run.gold + b.gb);
      botAct(b.run, b.theme, b.q);
    }
    const r = ROUNDS[k];
    for (const b of alive) b.info.snaps[r.id] = { hp: b.run.hp, bag: packBag(b.run.bag) };
    alive.forEach((b, i) => {
      const run = b.run;
      let F;
      if (r.type === 'pvp') {
        /* 輪流打其他還活著的機器人（打的是對方這回合的快照，只影響自己） */
        const o = alive[(i + 1 + (k % (alive.length - 1))) % alive.length];
        F = compileBag(o.run.bag);
      } else F = mobOf(run, r).F;
      const res = simulate(compileBag(run.bag), F, h(seed, k, i));
      /* 0.1.10 跟玩家一樣的經濟：打贏拿金幣、連勝連敗（之前沒算，機器人的背包比玩家窮、快照偏弱） */
      if (res.win) {
        run.ws++;
        run.lsk = 0;
        run.gold += r.type === 'pve' ? 2 : 1;
      } else {
        run.lsk++;
        run.ws = 0;
        run.hp -= r.loss;
      }
      if (r.type === 'elite' || r.type === 'boss') {
        const [a, c] = eliteStars(r.st),
          pool = ITEMS.filter(it =>
            r.type === 'boss'
              ? it.core === (r.st <= 2 ? 1 : 2) && it.cls === run.bag.cls
              : !it.core && it.star >= a && it.star <= c
          );
        /* 打完馬上拿（nextRound 會清掉 pend，留到下回合就拿不到了） */
        takePick(run, pick(run, pool).id);
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
  /* 0.1.11 真人快照夠了就不用跑機器人（一場機器人對局要算好一陣子） */
  if (n <= 0) return [];
  return simLobby((Math.random() * 2 ** 31) | 0, rating).slice(0, n);
}
