/* 塞令老師 · 背包：格子、擺放、相鄰、合成，以及把背包算成戰鬥用的角色（compileBag） */
'use strict';
/* 背包裡的一件：{ u: 編號, id, t: 階, x, y, r: 旋轉, a: 升階詞綴 } */
const cellsOf = o => shapeOf(o.id, o.r, o.sm).map(([x, y]) => [o.x + x, o.y + y]);
/* 格子上是哪一件（u），沒有回傳 null */
function bagGrid(bag) {
  const g = Array.from({ length: bag.h }, () => Array(bag.w).fill(null));
  for (const o of bag.items) for (const [x, y] of cellsOf(o)) if (g[y] && x >= 0 && x < bag.w) g[y][x] = o.u;
  return g;
}
/* 能不能把 o 放在 (x, y)、旋轉 r（忽略自己） */
function canPlace(bag, o, x, y, r) {
  const g = bagGrid(bag);
  for (const [dx, dy] of shapeOf(o.id, r, o.sm)) {
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
    const sh = shapeOf(o.id, r, o.sm);
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
/* a 給 b 的加成有幾條（相鄰／同排看位置，這裡只看標籤）；質變算 2 條 */
function synergy(a, b) {
  const A = ITEMI[a.id],
    tb = ITEMI[b.id].tags;
  return (
    [...(A.adj || []), ...(A.row || [])].filter(m => m.tag === '*' || tb.includes(m.tag)).length +
    (A.tf && !ITEMI[b.id].tf && tb.includes(A.tf.tag) ? 2 : 0)
  );
}
/* 0.1.28 融合（質變）：質變輔助（tf）放到道具上、或貼在旁邊，就跟它融合成一件新道具「前綴・道具」（輔助消失、空出格子）：
   多了標籤和效果。融合過的道具記著 f（輔助代號）、ft（輔助的階）。一件只能融合一次。
   回傳 Map(道具 u → { id: 輔助代號, t: 階, u: 還在背包裡的輔助 u（已經融合的是 null） })；
   還沒融合、只是貼在旁邊的（機器人評估、擺放的瞬間）也算，每個輔助只算一件（星級最高、再來階數高的） */
const tfRank = o => ITEMI[o.id].star * 10 + o.t;
const canFuse = (s, q) => {
  const T = ITEMI[s.id].tf,
    Q = ITEMI[q.id];
  return !!T && q !== s && !Q.tf && !q.f && Q.tags.includes(T.tag);
};
function tfOf(its, adjQ = adjacent) {
  const out = new Map();
  for (const o of its) if (o.f && ITEMI[o.f]) out.set(o.u, { id: o.f, t: o.ft || 1, u: null });
  const cats = its.filter(o => ITEMI[o.id].tf).sort((a, b) => tfRank(b) - tfRank(a));
  for (const s of cats) {
    let best = null;
    for (const q of its)
      if (canFuse(s, q) && !out.has(q.u) && adjQ(s, q) && (!best || tfRank(q) > tfRank(best))) best = q;
    if (best) out.set(best.u, { id: s.id, t: s.t, u: s.u });
  }
  return out;
}
/* 把輔助 s（背包或暫存區）融合進 q */
function fuseInto(run, s, q) {
  q.f = s.id;
  q.ft = s.t;
  run.bag.items = run.bag.items.filter(x => x !== s);
  const i = run.bench.indexOf(s);
  if (i >= 0) run.bench[i] = null;
  return q;
}
/* 背包裡貼在一起的輔助與道具自動融合；回傳融合好的道具 */
function fuseAll(run) {
  const out = [];
  for (const [u, c] of tfOf(run.bag.items)) {
    if (!c.u) continue;
    const s = run.bag.items.find(o => o.u === c.u),
      q = run.bag.items.find(o => o.u === u);
    if (s && q) out.push(fuseInto(run, s, q));
  }
  out.push(...absorbAll(run));
  return out;
}
/* 0.1.35 魔劍正宗（absorb）：貼在旁邊的劍被吸收，o.ab 累加那把劍（照它的階）的傷害、暴擊率、命中效果 */
const AB_K = ['crit', 'burn', 'poison', 'bleed', 'sunder', 'ls', 'weak', 'blind'];
function absorbAll(run) {
  const out = [];
  for (const o of run.bag.items) {
    const tag = ITEMI[o.id].absorb;
    if (!tag) continue;
    for (const q of run.bag.items.filter(q => q !== o && !ITEMI[q.id].core && ITEMI[q.id].dmg && !ITEMI[q.id].absorb)) {
      if (!ITEMI[q.id].tags.includes(tag) || !adjacent(o, q)) continue;
      const I = ITEMI[q.id],
        on = onT(I, q.t),
        ab = (o.ab = o.ab || { d0: 0, d1: 0, n: 0 });
      ab.d0 += Math.round(I.dmg[0] * TIERM[q.t]);
      ab.d1 += Math.round(I.dmg[1] * TIERM[q.t]);
      for (const k of AB_K) if (on[k]) ab[k] = (ab[k] || 0) + on[k];
      if (on.freeze) ab.freezeCh = (ab.freezeCh || 0) + on.freeze[0];
      if (on.stun) ab.stunCh = (ab.stunCh || 0) + on.stun[0];
      ab.n++;
      run.bag.items = run.bag.items.filter(x => x !== q);
      out.push(o);
    }
  }
  return out;
}
/* 0.1.34 一件道具的定義＋融入它的第二個核心（sc，4-4 首領選的第二個專屬核心；舊存檔可能是副核心） */
const defsOf = o => (o.sc && ITEMI[o.sc] ? [ITEMI[o.id], ITEMI[o.sc]] : [ITEMI[o.id]]);
/* 背包裡某個核心效果的最大值（例如 freeRoll、bribe、defX），融入的也算 */
const coreProp = (its, k) => Math.max(0, ...its.flatMap(o => defsOf(o).map(d => d[k] || 0)));
/* 賣價：融合過的連輔助一起算；0.1.35 回扣送的（z）賣 0 金 */
const sellO = o => (o.z ? 0 : sellOf(o.id, o.t) + (o.f && ITEMI[o.f] ? sellOf(o.f, o.ft || 1) : 0));
/* 融合過的名字 */
const fuName = o => (o.f && ITEMI[o.f] ? ITEMI[o.f].tf.n + '・' : '') + ITEMI[o.id].n;
/* 質變後的標籤（原本的＋質變多的） */
function tagsWith(o, tfm) {
  const s = tfm.get(o.u),
    I = ITEMI[o.id];
  return s && ITEMI[s.id].tf.add ? [...ITEMI[s.id].tf.add, ...I.tags] : I.tags;
}
/* ================= 合成 ================= */
/* 0.1.35 合成要幾件：二天一流（merge2）讓那個標籤的道具 2 件就合成 */
const merge2Of = its => {
  for (const o of its) if (o) for (const d of defsOf(o)) if (d.merge2) return d.merge2;
  return null;
};
function mergeNeed(its, id, t = merge2Of(its)) {
  return t && ITEMI[id].tags.includes(t) && !ITEMI[id].absorb ? 2 : 3;
}
/* 背包＋暫存區裡，同一種同一階的湊滿 3 件就合成（可能連鎖）；r 是亂數（詞綴） */
function mergeAll(run, r) {
  const done = [],
    early = coreProp(run.bag.items, 'early');
  for (let guard = 0; guard < 20; guard++) {
    const all = [...run.bag.items.map(o => ['bag', o]), ...run.bench.filter(Boolean).map(o => ['bench', o])],
      key = {};
    for (const [w, o] of all) (key[o.id + '|' + o.t] = key[o.id + '|' + o.t] || []).push([w, o]);
    const m2 = merge2Of(all.map(([, o]) => o)),
      need = id => mergeNeed(null, id, m2),
      hit = Object.values(key).find(l => l.length >= need(l[0][1].id) && l[0][1].t < TIER_MAX);
    if (!hit) break;
    const use = hit.slice(0, need(hit[0][1].id)),
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
    /* 0.1.35 回扣送的（賣價 0）：全部都是送的才保留 */
    o.z = use.every(([, q]) => q.z) ? 1 : 0;
    /* 0.1.8 升到 Ⅲ 階也開一條隨機詞綴（5★ 已經有一條的話就是第二條）；0.1.35 精品：Ⅱ 階就開 */
    if (o.t === TIER_MAX || (early && o.t === 2 && !o.m)) {
      if (!o.m) (o.m = roll5(o.id, r)), (o.mv = 0);
      else if (!o.m2) (o.m2 = roll5(o.id, r)), (o.mv2 = 0);
    }
    /* 0.1.28 三件裡有融合過的：留星級最高的那個融合 */
    const fu = use
      .map(([, q]) => q)
      .filter(q => q.f)
      .sort((x, y) => tfRank({ id: y.f, t: y.ft || 1 }) - tfRank({ id: x.f, t: x.ft || 1 }))[0];
    if (fu) (o.f = fu.f), (o.ft = fu.ft);
    done.push(o);
  }
  done.fused = fuseAll(run);
  syncShrink(run);
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
      /* 0.1.18 開戰爆發（rush）：開頭幾秒攻速提升（血祭）；取最高的加成、秒數相加 */
      rushP: 0,
      rushT: 0,
      /* 0.1.28 反制寵物：敵人寵物傷害 -%、敵人每隻寵物你的傷害 +% */
      petDown: 0,
      petHunt: 0,
      /* 0.1.33 核心新機制 */
      openDbl: 0,
      firstStrike: 0,
      armDmg: 0,
      /* 0.1.35 招架（被攻擊時的格擋機率、第一次格擋後的護甲）、連鎖追擊、開戰免異常、背水攻速 */
      parry: 0,
      parryArm: 0,
      triple: 0,
      immT: 0,
      rageSpd: 0,
      /* 0.1.35 開戰時身上的金幣（金錢標每次攻擊花 1 金） */
      gold: bag.gp || 0,
      /* 0.1.29 抗異常（%）、開戰免毒秒數、淨化、減敵人回復、減暴擊 */
      rBurn: 0,
      rPoison: 0,
      rBleed: 0,
      rSunder: 0,
      rFreeze: 0,
      rStun: 0,
      rWeak: 0,
      rBlind: 0,
      poisonImm: 0,
      cleanse: 0,
      healCut: 0,
      critRes: 0,
      ...extra
    };
  /* 先收集每件身上的加成 */
  const mods = new Map(its.map(o => [o.u, {}]));
  const add = (o, m, mul = 1) => {
    const t = mods.get(o.u);
    for (const k in m) if (k !== 'tag' && k !== 'per') t[k] = (t[k] || 0) + m[k] * mul;
  };
  /* 0.1.20 相鄰與同一排先用格子表算好（原本每一對都重算一次格子，機器人評估時太慢） */
  const NB = new Map(),
    RW = new Map();
  if (its.some(o => ITEMI[o.id].adj || ITEMI[o.id].row || ITEMI[o.id].tf)) {
    const g = bagGrid(bag);
    for (const o of its) {
      const cs = cellsOf(o),
        nb = new Set();
      for (const [x, y] of cs)
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1]
        ]) {
          const u = g[y + dy] && g[y + dy][x + dx];
          if (u != null && u !== o.u) nb.add(u);
        }
      NB.set(o.u, nb);
      RW.set(o.u, new Set(cs.map(p => p[1])));
    }
  }
  const adjQ = (s, q) => NB.get(s.u).has(q.u),
    rowQ = (s, q) => [...RW.get(s.u)].some(y => RW.get(q.u).has(y));
  /* 0.1.33 鐵甲戰士：防具、盾的效果 ×defX */
  const defX = Math.max(1, coreProp(its, 'defX')),
    isDef = I => I.tags.includes('armor') || I.tags.includes('shield');
  /* 0.1.28 質變：先決定誰被質變（標籤會變，後面的加成都看質變後的標籤） */
  const tfm = tfOf(its, adjQ),
    TG = new Map(its.map(o => [o.u, tagsWith(o, tfm)])),
    has = (o, tag) => TG.get(o.u).includes(tag),
    cnt = tag => its.filter(o => has(o, tag)).length;
  for (const [u, s] of tfm) add({ u }, scaleMod(ITEMI[s.id].tf.m, s.t));
  /* 0.1.35 鈔能力：照開戰時的金幣，所有武器加成、開戰護盾與封鎖 */
  const RB = coreProp(its, 'rich') ? richOf(bag.gp || 0) : null;
  if (RB) {
    const ru = its.find(o => defsOf(o).some(d => d.rich)).u;
    for (const q of its) if (has(q, 'weapon')) add(q, { dmgPct: RB.dmgPct || 0, spd: RB.spd || 0, crit: RB.crit || 0 });
    F.startBlock += RB.startBlock || 0;
    if (RB.seal) F.pre.push({ u: ru, k: 'seal', v: RB.seal });
    if (RB.sealAll) F.pre.push({ u: ru, k: 'sealAll', v: RB.sealAll });
  }
  for (const s of its) {
    const S0 = ITEMI[s.id];
    const give = (list, test) => {
      for (const b0 of list || []) {
        const b = scaleMod(b0, s.t),
          mul = b.per ? cnt(b.per) : 1;
        for (const q of its) if (q !== s && test(q) && (b.tag === '*' || has(q, b.tag))) add(q, b, mul);
      }
    };
    if (S0.adj) give(S0.adj, q => adjQ(s, q));
    if (S0.row) give(S0.row, q => rowQ(s, q));
    give(S0.all, () => true);
    if (S0.fx) {
      const f = fxT(S0, s.t);
      for (const k in f) F[k] += f[k];
    }
    /* 0.1.33 方陣：背包裡每有 1 件某標籤，角色加成 */
    for (const b of S0.fxPer || []) for (const k in b) if (k !== 'tag') F[k] += b[k] * cnt(b.tag);
    /* 0.1.33 賄賂：開戰前付過錢（bag.pay）才有效 */
    if (S0.bribe && bag.pay) F.pre.push({ u: s.u, k: 'lockBest', v: MAX_T });
    /* 0.1.29 融入專屬核心的副核心（sc）：效果跟副核心本身一樣，不佔格子 */
    /* 融入的第二個核心：全背包加成、角色加成、每件某標籤的加成、開戰效果、賄賂都算 */
    const X = s.sc && ITEMI[s.sc];
    if (X) {
      give(X.all, () => true);
      if (X.fx) {
        const f = fxT(X, 1);
        for (const k in f) F[k] += f[k];
      }
      for (const b of X.fxPer || []) for (const k in b) if (k !== 'tag') F[k] += b[k] * cnt(b.tag);
      if (X.pre) F.pre.push({ u: s.u, k: preKey(X.pre), v: preVal(s.sc, 1) });
      if (X.bribe && bag.pay && !S0.bribe) F.pre.push({ u: s.u, k: 'lockBest', v: MAX_T });
    }
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
    for (const b of C.m || []) for (const q of its) if (has(q, b.tag)) add(q, b);
    for (const k in C.F || {}) F[k] += C.F[k];
  }
  for (const o of its) {
    const I = ITEMI[o.id],
      dx = isDef(I) ? defX : 1,
      k = TIERM[o.t] * dx,
      m = mods.get(o.u);
    if (I.hp) F.hp += Math.round(I.hp * k);
    if (I.arm) F.arm += Math.round(I.arm * k);
    if (I.dodge) F.dodge += Math.round(I.dodge * TIERB[o.t] * dx);
    if (I.regen || m.regen) F.regen += Math.round((I.regen || 0) * k) + (m.regen || 0);
    if (m.thornsF) F.thornsF += m.thornsF;
    /* 0.1.29 照格數：巨化的生命 */
    if (m.cellHp) F.hp += m.cellHp * shapeOf(o.id).length;
    if (I.rush) {
      F.rushP = Math.max(F.rushP, Math.round(I.rush[0] * TIERB[o.t]));
      F.rushT += I.rush[1];
    }
    if (I.pre) {
      /* 鍊金術士：丟出去的藥劑（藥水標籤）效果加強 */
      const k = preKey(I.pre),
        boost = I.tags.includes('potion') && F.throwPct ? 1 + F.throwPct / 100 : 1;
      const pb = 1 + (m.preBoost || 0) / 100;
      F.pre.push({
        u: o.u,
        k,
        v: k === 'down' || k === 'petLock' ? preVal(o.id, o.t) : Math.round(preVal(o.id, o.t) * boost * pb)
      });
    }
    if (I.pot)
      F.pots.push({
        u: o.u,
        at: I.pot[0],
        v: Math.round(I.pot[1] * k),
        n: I.pot[2] + (o.t === 3 ? 1 : 0),
        bomb: m.potBomb || 0
      });
    if (I.block)
      F.shields.push({
        u: o.u,
        cd: Math.max(0.6, cdT(I, o.t) / (1 + (m.spd || 0) / 100)),
        block: Math.round((I.block * k + (m.block || 0)) * (1 + (m.blockPct || 0) / 100)),
        thorns: Math.round((I.thorns || 0) * k),
        heal: Math.round((I.heal || 0) * k) + (m.heal || 0),
        bash: m.bash || 0
      });
    else if (I.dmg) {
      const on = onT(I, o.t),
        mul = 1 + ((m.dmgPct || 0) + (m.cellPct || 0) * shapeOf(o.id).length) / 100,
        /* 0.1.35 魔劍正宗吸收的數值（o.ab）當成這把的基礎數值 */
        ab = o.ab || {};
      for (const k of AB_K) if (ab[k]) on[k] = (on[k] || 0) + ab[k];
      for (const k of ['freezeCh', 'stunCh']) if (ab[k]) m[k] = (m[k] || 0) + ab[k];
      F.weapons.push({
        u: o.u,
        id: o.id,
        t: o.t,
        star: I.star,
        pet: has(o, 'pet'),
        el: TG.get(o.u).find(t => ['fire', 'cold', 'light', 'poison', 'dark'].includes(t)) || 'phys',
        cd: Math.max(0.4, cdT(I, o.t) / (1 + (m.spd || 0) / 100)),
        dmg: [
          Math.round((I.dmg[0] * k + (ab.d0 || 0) + (m.dmg || 0)) * mul),
          Math.round((I.dmg[1] * k + (ab.d1 || 0) + (m.dmg || 0)) * mul)
        ],
        crit: on.crit + (m.crit || 0),
        burn: (on.burn || 0) + (m.burn || 0),
        poison: (on.poison || 0) + (m.poison || 0),
        freeze: [(on.freeze ? on.freeze[0] : 0) + (m.freezeCh || 0), on.freeze ? on.freeze[1] : 0.8],
        stun: [(on.stun ? on.stun[0] : 0) + (m.stunCh || 0), on.stun ? on.stun[1] : 0.5],
        ls: (on.ls || 0) + (m.ls || 0),
        bleed: (on.bleed || 0) + (m.bleed || 0),
        sunder: (on.sunder || 0) + (m.sunder || 0),
        weak: (on.weak || 0) + (m.weakCh || 0),
        blind: (on.blind || 0) + (m.blindCh || 0),
        pierce: Math.min(PIERCE_MAX, m.pierce || 0),
        chain: m.chain || 0,
        guard: m.guard || 0,
        chainN: Math.min(CHAIN_MAX, m.chainN || 0),
        /* 0.1.35 雙手大師：每佔 1 格的連擊機率；金錢標：有錢時每次攻擊花 1 金、數值翻倍 */
        dbl: (m.cellDbl || 0) * shapeOf(o.id).length,
        coin: I.coin ? 1 : 0
      });
    }
  }
  /* 0.1.33 審判：每把武器的傷害 +護甲值 */
  if (F.armDmg && F.arm > 0) for (const w of F.weapons) w.dmg = w.dmg.map(v => v + F.arm);
  if (F.potMul) F.pots.forEach(p => ((p.v = Math.round(p.v * (1 + F.potMul / 100))), (p.n += F.potUse)));
  F.dodge = Math.min(40, F.dodge);
  return F;
}
/* 給畫面用：每件道具目前吃到的加成（說明裡顯示「＋」） */
function bagMods(bag) {
  const its = bag.items,
    out = new Map(its.map(o => [o.u, []]));
  const tfm = tfOf(its),
    has = (o, tag) => tagsWith(o, tfm).includes(tag),
    cnt = tag => its.filter(o => has(o, tag)).length;
  for (const [u, s] of tfm) out.get(u).push({ from: s.u || 'f', w: 'tf', m: scaleMod(ITEMI[s.id].tf.m, s.t) });
  for (const s of its) {
    const S0 = ITEMI[s.id];
    for (const [w, test] of [
      ['adj', q => adjacent(s, q)],
      ['row', q => sameRow(s, q)],
      ['all', () => true]
    ])
      for (const b0 of [...(S0[w] || []), ...(w === 'all' && s.sc && ITEMI[s.sc] ? ITEMI[s.sc].all || [] : [])]) {
        const b = scaleMod(b0, s.t),
          mul = b.per ? cnt(b.per) : 1;
        for (const q of its)
          if (q !== s && test(q) && (b.tag === '*' || has(q, b.tag))) {
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
        if (has(q, b.tag)) {
          const m = {};
          for (const k in b) if (k !== 'tag') m[k] = b[k];
          out.get(q.u).push({ from: 'cls', w: 'cls', m });
        }
  return out;
}
/* 快照用的精簡格式：[id, 階, x, y, 旋轉, 詞綴, 5★ 詞綴, 第二條詞綴, 融合的輔助, 輔助的階, 融入的核心, 少 1 格, 魔劍吸收的數值]；
   後面是預設值的就不存。gp：0.1.35 開戰時的金幣（鈔能力、金錢標） */
const PACK_DEF = [0, 0, 1, 0, 0, 0];
const packBag = bag => ({
  w: bag.w,
  h: bag.h,
  cls: bag.cls || null,
  ...(bag.pay ? { pay: 1 } : {}),
  ...(bag.gp ? { gp: bag.gp } : {}),
  it: bag.items.map(o => {
    const a = [o.id, o.t, o.x, o.y, o.r, o.a || 0, o.m || 0],
      t = [o.m2 || 0, o.f || 0, o.ft || 1, o.sc || 0, o.sm ? 1 : 0, o.ab || 0];
    while (t.length && t[t.length - 1] === PACK_DEF[t.length - 1]) t.pop();
    return [...a, ...t];
  })
});
const unpackBag = p => ({
  w: p.w,
  h: p.h,
  cls: p.cls || null,
  pay: p.pay || 0,
  gp: p.gp || 0,
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
      m2: a[7] || null,
      f: a[8] || null,
      ft: a[9] || 1,
      sc: a[10] || null,
      sm: a[11] || 0,
      ab: a[12] || null
    }))
});
/* 0.1.33 長柄大師：背包（含暫存區）裡有 shrink 的核心時，那個標籤的道具少佔 1 格（o.sm）；核心拿掉後放不下的收回暫存區 */
function syncShrink(run) {
  const t = (run.bag.items.flatMap(defsOf).find(d => d.shrink) || {}).shrink;
  for (const o of [...run.bag.items, ...run.bench]) {
    if (!o) continue;
    const want = t && ITEMI[o.id].tags.includes(t) && !ITEMI[o.id].core ? 1 : 0;
    if ((o.sm || 0) === want) continue;
    o.sm = want;
    if (!want && run.bag.items.includes(o) && !canPlace(run.bag, o, o.x, o.y, o.r)) {
      run.bag.items = run.bag.items.filter(q => q !== o);
      const fi = run.bench.indexOf(null);
      if (fi >= 0) run.bench[fi] = o;
      else run.gold += sellO(o);
    }
  }
}
