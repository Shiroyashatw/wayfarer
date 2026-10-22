/* 塞令老師 · 背包：格子、擺放、相鄰、合成，以及把背包算成戰鬥用的角色（compileBag） */
'use strict';
/* 背包裡的一件：{ u: 編號, id, t: 階, x, y, r: 旋轉, a: 升階詞綴 } */
const cellsOf = o => shapeOf(o.id, o.r).map(([x, y]) => [o.x + x, o.y + y]);
/* 格子上是哪一件（u），沒有回傳 null */
function bagGrid(bag) {
  const g = Array.from({ length: bag.h }, () => Array(bag.w).fill(null));
  for (const o of bag.items) for (const [x, y] of cellsOf(o)) if (g[y] && x >= 0 && x < bag.w) g[y][x] = o.u;
  return g;
}
/* 能不能把 o 放在 (x, y)、旋轉 r（忽略自己） */
function canPlace(bag, o, x, y, r) {
  const g = bagGrid(bag);
  for (const [dx, dy] of shapeOf(o.id, r)) {
    const cx = x + dx,
      cy = y + dy;
    if (cx < 0 || cy < 0 || cx >= bag.w || cy >= bag.h) return false;
    const u = g[cy][cx];
    if (u != null && u !== o.u) return false;
  }
  /* 職業核心一個背包最多一個 */
  /* 專屬核心（core 1）、副核心（core 2）各最多 1 個 */
  if (ITEMI[o.id].core && bag.items.some(q => q.u !== o.u && ITEMI[q.id].core === ITEMI[o.id].core)) return false;
  return true;
}
/* 兩件是不是相鄰（上下左右） */
function adjacent(a, b) {
  const s = new Set(cellsOf(b).map(([x, y]) => x + ',' + y));
  return cellsOf(a).some(
    ([x, y]) => s.has(x + 1 + ',' + y) || s.has(x - 1 + ',' + y) || s.has(x + ',' + (y + 1)) || s.has(x + ',' + (y - 1))
  );
}
const rowsOf = o => new Set(cellsOf(o).map(p => p[1]));
const sameRow = (a, b) => [...rowsOf(a)].some(y => rowsOf(b).has(y));
/* 找一個放得下的位置（先試每個旋轉；score 越高越好：跟有加成關係的道具相鄰） */
/* 0.1.11 變快：格子表只建一次（canPlace 每次都重建，背包大了機器人一場要 0.6 秒，開局會卡），只對有加成關係的道具算分 */
function findSpot(bag, o, prefer = true) {
  const I = ITEMI[o.id];
  if (I.core && bag.items.some(q => q.u !== o.u && ITEMI[q.id].core === I.core)) return null;
  const g = bagGrid(bag),
    rel = prefer
      ? bag.items.map(q => [q, q.u !== o.u ? synergy(o, q) + synergy(q, o) : 0]).filter(([, n]) => n > 0)
      : [];
  let best = null;
  for (let r = 0; r < 4; r++) {
    const sh = shapeOf(o.id, r);
    for (let y = 0; y < bag.h; y++)
      for (let x = 0; x < bag.w; x++) {
        let ok = true;
        for (const [dx, dy] of sh) {
          const cx = x + dx,
            cy = y + dy;
          if (cx >= bag.w || cy >= bag.h || (g[cy][cx] != null && g[cy][cx] !== o.u)) {
            ok = false;
            break;
          }
        }
        if (!ok) continue;
        let sc = 0;
        if (rel.length) {
          const t = { ...o, x, y, r };
          for (const [q, n] of rel) if (adjacent(t, q)) sc += n;
        }
        if (!best || sc > best.sc) best = { x, y, r, sc };
      }
  }
  return best;
}
/* a 給 b 的加成有幾條（相鄰／同排看位置，這裡只看標籤） */
function synergy(a, b) {
  const A = ITEMI[a.id],
    tb = ITEMI[b.id].tags;
  return [...(A.adj || []), ...(A.row || [])].filter(m => m.tag === '*' || tb.includes(m.tag)).length;
}
/* ================= 合成 ================= */
/* 背包＋暫存區裡，同一種同一階的湊滿 3 件就合成（可能連鎖）；r 是亂數（詞綴） */
function mergeAll(run, r) {
  const done = [];
  for (let guard = 0; guard < 20; guard++) {
    const all = [...run.bag.items.map(o => ['bag', o]), ...run.bench.filter(Boolean).map(o => ['bench', o])],
      key = {};
    for (const [w, o] of all) (key[o.id + '|' + o.t] = key[o.id + '|' + o.t] || []).push([w, o]);
    const hit = Object.values(key).find(l => l.length >= 3 && l[0][1].t < TIER_MAX);
    if (!hit) break;
    const use = hit.slice(0, 3),
      keep = use.find(([w]) => w === 'bag') || use[0],
      o = keep[1];
    for (const [w, q] of use) {
      if (q === o) continue;
      if (w === 'bag') run.bag.items = run.bag.items.filter(x => x !== q);
      else run.bench[run.bench.indexOf(q)] = null;
    }
    o.t++;
    o.a = affOf(o.id, r);
    /* 5★ 合成：留三件裡開得最好的那條詞綴 */
    const ms = use.map(([, q]) => q.m).filter(Boolean);
    if (ms.length) o.m = ms.sort((x, y) => mod5Q(y) - mod5Q(x))[0];
    /* 0.1.8 升到 Ⅲ 階也開一條隨機詞綴（5★ 已經有一條的話就是第二條） */
    if (o.t === TIER_MAX) {
      if (!o.m) (o.m = roll5(o.id, r)), (o.mv = 0);
      else if (!o.m2) (o.m2 = roll5(o.id, r)), (o.mv2 = 0);
    }
    done.push(o);
  }
  return done;
}
/* ================= 戰鬥數值 ================= */
/* 把背包算成戰鬥用的角色：hp、護甲、武器（含所有加成）、盾、藥水… */
function compileBag(bag, extra = {}) {
  const its = bag.items,
    F = {
      hp: BASE_HP,
      arm: 0,
      dodge: 0,
      regen: 0,
      ls: 0,
      critMul: 160,
      take: 0,
      potMul: 0,
      potUse: 0,
      weapons: [],
      shields: [],
      pots: [],
      pre: [],
      throwPct: 0,
      /* 0.1.10 核心的新機制 */
      opener: 0,
      execute: 0,
      rage: 0,
      ramp: 0,
      startBlock: 0,
      double: 0,
      thornsF: 0,
      critHeal: 0,
      ...extra
    };
  const cnt = tag => its.filter(o => ITEMI[o.id].tags.includes(tag)).length;
  /* 先收集每件身上的加成 */
  const mods = new Map(its.map(o => [o.u, {}]));
  const add = (o, m, mul = 1) => {
    const t = mods.get(o.u);
    for (const k in m) if (k !== 'tag' && k !== 'per') t[k] = (t[k] || 0) + m[k] * mul;
  };
  for (const s of its) {
    const S0 = ITEMI[s.id];
    const give = (list, test) => {
      for (const b0 of list || []) {
        const b = scaleMod(b0, s.t),
          mul = b.per ? cnt(b.per) : 1;
        for (const q of its)
          if (q !== s && test(q) && (b.tag === '*' || ITEMI[q.id].tags.includes(b.tag))) add(q, b, mul);
      }
    };
    give(S0.adj, q => adjacent(s, q));
    give(S0.row, q => sameRow(s, q));
    give(S0.all, () => true);
    if (S0.fx) for (const k in S0.fx) F[k] += S0.fx[k];
    if (s.a) {
      const a = AFFX.find(x => x.k === s.a);
      if (a.k === 'hp') F.hp += a.v;
      else add(s, { [a.k]: a.v });
    }
    /* 0.1.5 5★ 的隨機詞綴 */
    for (const mm of [s.m, s.m2])
      if (mm && MOD5[mm[0]]) {
        const x = MOD5[mm[0]];
        if (x.F) F[x.k] += mm[1];
        else add(s, { [x.k]: mm[1] });
      }
  }
  /* 0.1.7 開局職業：對有那個標籤的道具加成、角色加成 */
  const C = CLSI[bag.cls];
  if (C) {
    for (const b of C.m || []) for (const q of its) if (ITEMI[q.id].tags.includes(b.tag)) add(q, b);
    for (const k in C.F || {}) F[k] += C.F[k];
  }
  for (const o of its) {
    const I = ITEMI[o.id],
      k = TIERM[o.t],
      m = mods.get(o.u);
    if (I.hp) F.hp += Math.round(I.hp * k);
    if (I.arm) F.arm += Math.round(I.arm * k);
    if (I.dodge) F.dodge += Math.round(I.dodge * TIERB[o.t]);
    if (I.regen || m.regen) F.regen += Math.round((I.regen || 0) * k) + (m.regen || 0);
    if (I.pre) {
      /* 鍊金術士：丟出去的藥劑（藥水標籤）效果加強 */
      const k = preKey(I.pre),
        boost = I.tags.includes('potion') && F.throwPct ? 1 + F.throwPct / 100 : 1;
      F.pre.push({ u: o.u, k, v: k === 'down' ? 1 : Math.round(preVal(o.id, o.t) * boost) });
    }
    if (I.pot) F.pots.push({ u: o.u, at: I.pot[0], v: Math.round(I.pot[1] * k), n: I.pot[2] + (o.t === 3 ? 1 : 0) });
    if (I.block)
      F.shields.push({
        u: o.u,
        cd: Math.max(0.6, cdT(I, o.t) / (1 + (m.spd || 0) / 100)),
        block: Math.round((I.block * k + (m.block || 0)) * (1 + (m.blockPct || 0) / 100)),
        thorns: Math.round((I.thorns || 0) * k),
        heal: Math.round((I.heal || 0) * k)
      });
    else if (I.dmg) {
      const on = onT(I, o.t),
        mul = 1 + (m.dmgPct || 0) / 100;
      F.weapons.push({
        u: o.u,
        id: o.id,
        t: o.t,
        pet: I.tags.includes('pet'),
        el: ['fire', 'cold', 'light', 'poison', 'dark'].find(t => I.tags.includes(t)) || 'phys',
        cd: Math.max(0.4, cdT(I, o.t) / (1 + (m.spd || 0) / 100)),
        dmg: [Math.round((I.dmg[0] * k + (m.dmg || 0)) * mul), Math.round((I.dmg[1] * k + (m.dmg || 0)) * mul)],
        crit: on.crit + (m.crit || 0),
        burn: (on.burn || 0) + (m.burn || 0),
        poison: (on.poison || 0) + (m.poison || 0),
        freeze: [(on.freeze ? on.freeze[0] : 0) + (m.freezeCh || 0), on.freeze ? on.freeze[1] : 0.8],
        stun: [(on.stun ? on.stun[0] : 0) + (m.stunCh || 0), on.stun ? on.stun[1] : 0.5],
        ls: (on.ls || 0) + (m.ls || 0),
        bleed: (on.bleed || 0) + (m.bleed || 0),
        sunder: (on.sunder || 0) + (m.sunder || 0),
        weak: (on.weak || 0) + (m.weakCh || 0),
        blind: (on.blind || 0) + (m.blindCh || 0)
      });
    }
  }
  if (F.potMul) F.pots.forEach(p => ((p.v = Math.round(p.v * (1 + F.potMul / 100))), (p.n += F.potUse)));
  F.dodge = Math.min(40, F.dodge);
  return F;
}
/* 給畫面用：每件道具目前吃到的加成（說明裡顯示「＋」） */
function bagMods(bag) {
  const its = bag.items,
    out = new Map(its.map(o => [o.u, []]));
  const cnt = tag => its.filter(o => ITEMI[o.id].tags.includes(tag)).length;
  for (const s of its) {
    const S0 = ITEMI[s.id];
    for (const [w, test] of [
      ['adj', q => adjacent(s, q)],
      ['row', q => sameRow(s, q)],
      ['all', () => true]
    ])
      for (const b0 of S0[w] || []) {
        const b = scaleMod(b0, s.t),
          mul = b.per ? cnt(b.per) : 1;
        for (const q of its)
          if (q !== s && test(q) && (b.tag === '*' || ITEMI[q.id].tags.includes(b.tag))) {
            const m = {};
            for (const k in b) if (k !== 'tag' && k !== 'per') m[k] = b[k] * mul;
            out.get(q.u).push({ from: s.u, w, m });
          }
      }
  }
  const C = CLSI[bag.cls];
  if (C)
    for (const b of C.m || [])
      for (const q of its)
        if (ITEMI[q.id].tags.includes(b.tag)) {
          const m = {};
          for (const k in b) if (k !== 'tag') m[k] = b[k];
          out.get(q.u).push({ from: 'cls', w: 'cls', m });
        }
  return out;
}
/* 快照用的精簡格式：[id, 階, x, y, 旋轉, 詞綴, 5★ 詞綴] */
const packBag = bag => ({
  w: bag.w,
  h: bag.h,
  cls: bag.cls || null,
  it: bag.items.map(o => [o.id, o.t, o.x, o.y, o.r, o.a || 0, o.m || 0, ...(o.m2 ? [o.m2] : [])])
});
const unpackBag = p => ({
  w: p.w,
  h: p.h,
  cls: p.cls || null,
  items: (p.it || [])
    .filter(a => ITEMI[a[0]])
    .map((a, i) => ({
      u: 'g' + i,
      id: a[0],
      t: a[1],
      x: a[2],
      y: a[3],
      r: a[4],
      a: a[5] || null,
      m: a[6] || null,
      m2: a[7] || null
    }))
});
