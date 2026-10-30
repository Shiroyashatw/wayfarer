/* dungeonPOE · 裝備實例、詞綴、背包格子與擺放、把背包算成戰鬥數值 */
'use strict';
/* 一件道具：{ u 編號, id 底材, r 旋轉 0～3, x, y（在格子裡時）, a: [{ id, t: T 級, v }] } */
let UID = 1;
const newUid = () => Date.now().toString(36) + (UID++).toString(36);
const mkItem = (id, a = []) => ({ u: newUid(), id, r: 0, a });
const baseOf = o => ITEMI[o.id];
/* ---------- 詞綴 ---------- */
const affFits = (af, b) => af.k.includes(b.k);
/* T 級的機率：最好的 T 機率最低（tb＝這裡能出現的最好 T） */
function rollTier(tb, r) {
  const ts = [];
  for (let t = tb; t <= 6; t++) for (let w = 0; w < t - tb + 1; w++) ts.push(t);
  return ts[fl(r() * ts.length)];
}
function rollAff(b, type, tb, r, not) {
  const pool = AFF.filter(af => af.t === type && affFits(af, b) && af.id !== not);
  if (!pool.length) return null;
  const af = pool[fl(r() * pool.length)],
    t = rollTier(tb, r),
    [lo, hi] = af.tiers[t - 1],
    v = lo % 1 || hi % 1 ? Math.round((lo + r() * (hi - lo)) * 10) / 10 : lo + fl(r() * (hi - lo + 1));
  return { id: af.id, t, v };
}
/* n：詞綴數（0 白、1 或 2 藍）；tb：最好的 T */
function rollItem(id, n, tb, r) {
  const b = ITEMI[id],
    a = [];
  if (n && 'was'.includes(b.k)) {
    const types = n >= 2 ? ['P', 'S'] : [r() < 0.5 ? 'P' : 'S'];
    for (const t of types) {
      const x = rollAff(b, t, tb, r);
      if (x) a.push(x);
    }
  }
  return mkItem(id, a);
}
/* 鐵匠：重骰一個詞綴（同一個位置、同一類），T 級照這件的底材 ★ 決定上限 */
function rerollAff(o, i, r) {
  const b = baseOf(o),
    old = o.a[i],
    x = rollAff(b, AFFI[old.id].t, Math.max(1, 6 - b.star), r, old.id);
  if (x) o.a[i] = x;
  return o;
}
const rarity = o => (o.a.length ? 1 : 0);
const itemPrice = o => {
  const b = baseOf(o);
  if (b.price) return b.price;
  return Math.round(8 * Math.pow(b.star, 1.5));
};
const sellPrice = o => {
  const b = baseOf(o);
  if (b.price) return fl(b.price / 3);
  return Math.round(2 * b.star + o.a.reduce((s, x) => s + (7 - x.t) * 3, 0));
};
/* ---------- 形狀與格子 ---------- */
/* 旋轉 r 次（順時針），再平移回 (0,0) */
function cellsOf(o) {
  let c = SH[baseOf(o).sh].map(p => [...p]);
  for (let k = 0; k < (o.r || 0); k++) c = c.map(([x, y]) => [-y, x]);
  const mx = Math.min(...c.map(p => p[0])),
    my = Math.min(...c.map(p => p[1]));
  return c.map(([x, y]) => [x - mx, y - my]);
}
const sizeOf = o => {
  const c = cellsOf(o);
  return [Math.max(...c.map(p => p[0])) + 1, Math.max(...c.map(p => p[1])) + 1];
};
/* 背包（或黑盒）：{ t: 背包種類, items: [] }；mask：t 的形狀 */
const maskOf = g => (g.t === 'box' ? BOX : BAGI[g.t] || MBAGS[g.t]).m;
const gridW = g => maskOf(g)[0].length,
  gridH = g => maskOf(g).length;
const inMask = (g, x, y) => y >= 0 && y < gridH(g) && x >= 0 && x < gridW(g) && maskOf(g)[y][x] === 'x';
function occ(g, skip) {
  const m = new Map();
  for (const o of g.items) if (o !== skip) for (const [cx, cy] of cellsOf(o)) m.set(o.x + cx + ',' + (o.y + cy), o);
  return m;
}
function fits(g, o, x, y, skip = o) {
  const m = occ(g, skip);
  return cellsOf(o).every(([cx, cy]) => inMask(g, x + cx, y + cy) && !m.has(x + cx + ',' + (y + cy)));
}
/* 放得下就放（自動找位置，會試四個方向），回傳成功與否 */
function autoPlace(g, o) {
  const r0 = o.r || 0;
  for (let k = 0; k < 4; k++) {
    o.r = (r0 + k) % 4;
    for (let y = 0; y < gridH(g); y++)
      for (let x = 0; x < gridW(g); x++)
        if (fits(g, o, x, y)) {
          o.x = x;
          o.y = y;
          g.items.push(o);
          return true;
        }
  }
  o.r = r0;
  return false;
}
const cellCount = g => maskOf(g).join('').split('x').length - 1;
/* 相鄰的道具（上下左右貼著） */
function neighbors(g, o) {
  const m = occ(g),
    out = new Set();
  for (const [cx, cy] of cellsOf(o)) {
    const x = o.x + cx,
      y = o.y + cy;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ]) {
      const n = m.get(x + dx + ',' + (y + dy));
      if (n && n !== o) out.add(n);
    }
  }
  return [...out];
}
/* 背包角落：形狀裡上下左右最多只有 2 個鄰格的格子（奇怪的形狀也算） */
function isCorner(g, x, y) {
  let n = 0;
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ])
    if (inMask(g, x + dx, y + dy)) n++;
  return n <= 2;
}
const onCorner = (g, o) => cellsOf(o).some(([cx, cy]) => isCorner(g, o.x + cx, o.y + cy));
/* 位置詞綴（共鳴、孤狼、據角）對這件的總倍率 */
function posMul(g, o) {
  let m = 1;
  for (const x of o.a) {
    if (x.id === 'adjW') m += (x.v / 100) * neighbors(g, o).filter(n => baseOf(n).k === 'w').length;
    if (x.id === 'lone' && !neighbors(g, o).length) m += x.v / 100;
    if (x.id === 'corner' && onCorner(g, o)) m += x.v / 100;
  }
  return m;
}
const affV = (o, id) => o.a.filter(x => x.id === id).reduce((s, x) => s + x.v, 0);
/* ---------- 把背包算成戰鬥數值 ---------- */
/* cls：職業、cores：[核心 id]、tal：天賦的小數值加總 { hp, dmg, spd, arm }、lv：核心強化 { 核心 id: 1 } */
function compile(g, hero) {
  const tal = hero.tal || {},
    P = {
      mhp: BASE_HP,
      arm: tal.arm || 0,
      dodge: 0,
      regen: 0,
      thorns: 0,
      weapons: [],
      shields: [],
      pots: [],
      dmgPct: tal.dmg || 0,
      spdPct: tal.spd || 0
    };
  let hpPct = tal.hp || 0;
  for (const o of g.items) {
    const b = baseOf(o),
      pm = posMul(g, o);
    if (b.k === 'p') {
      P.pots.push({ u: o.u, heal: b.pot });
      continue;
    }
    if (b.k === 'g') continue;
    P.mhp += ((b.hp || 0) + affV(o, 'hp')) * pm;
    P.arm += ((b.arm || 0) + affV(o, 'arm')) * pm;
    P.dodge += ((b.dodge || 0) + affV(o, 'dodge')) * pm;
    P.regen += affV(o, 'regen') * pm;
    P.thorns += ((b.thorns || 0) + affV(o, 'thorns')) * pm;
    if (b.k === 's')
      P.shields.push({ u: o.u, cd: b.cd, block: b.block * (1 + affV(o, 'blockPct') / 100) * pm, heal: b.heal || 0 });
    if (b.k === 'w') {
      const rowSpd = affV(o, 'row')
          ? affV(o, 'row') *
            g.items.filter(n => n !== o && baseOf(n).k === 'w' && cellsOf(n).some(([, cy]) => n.y + cy === o.y)).length
          : 0,
        on = { ...(b.on || {}) };
      for (const k of ['burn', 'poison', 'bleed', 'freeze', 'shock']) if (affV(o, k)) on[k] = (on[k] || 0) + affV(o, k);
      P.weapons.push({
        u: o.u,
        n: b.n,
        dmg: b.dmg,
        flat: affV(o, 'flat'),
        mul: pm * (1 + affV(o, 'dmgPct') / 100),
        cd: b.cd / (1 + (affV(o, 'spd') + rowSpd) / 100),
        crit: (b.crit || 0) + affV(o, 'crit'),
        ls: (b.ls || 0) + affV(o, 'ls'),
        on
      });
    }
  }
  P.mhp = Math.round(P.mhp * (1 + hpPct / 100));
  P.arm = Math.round(P.arm);
  P.dodge = Math.min(60, P.dodge);
  P.cls = hero.cls;
  P.cores = hero.cores || [];
  P.clv = hero.clv || {};
  return P;
}
/* 核心目前的數值（有強化就用強化後的） */
const coreV = (P, id) => (P.cores.includes(id) ? COREI[id].v[P.clv[id] ? 1 : 0] : 0);
/* ---------- 說明文字 ---------- */
const AILN = { burn: '燃燒', poison: '中毒', bleed: '流血', freeze: '凍結', shock: '感電' };
function baseLines(b) {
  const L = [];
  if (b.k === 'w') {
    L.push(`傷害 ${b.dmg[0]}～${b.dmg[1]}・每 ${b.cd} 秒`);
    if (b.crit) L.push(`暴擊率 ${b.crit}%`);
    if (b.ls) L.push(`吸血 ${b.ls}%`);
    for (const k in b.on || {}) L.push(`命中 ${b.on[k]}% ${AILN[k]}`);
  }
  if (b.hp) L.push(`生命 +${b.hp}`);
  if (b.arm) L.push(`護甲 +${b.arm}`);
  if (b.dodge) L.push(`閃避 +${b.dodge}%`);
  if (b.block) L.push(`每 ${b.cd} 秒：護盾 +${b.block}`);
  if (b.thorns) L.push(`被打時反彈 ${b.thorns}`);
  if (b.heal) L.push(`格擋時回 ${b.heal} 生命`);
  if (b.pot) L.push(`戰鬥中生命低於 40%：回 ${b.pot}% 生命（用完就沒了）`);
  if (b.cap) L.push(`放在黑盒裡：死了也保住這趟最多 ${b.cap} 金幣`);
  return L;
}
const affLine = x => ({ t: x.t, n: AFFI[x.id].n, d: AFFI[x.id].f(x.v), p: AFFI[x.id].t });
