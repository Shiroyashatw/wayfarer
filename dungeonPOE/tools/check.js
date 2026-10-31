/* dungeonPOE 0.2 · 固定檢查：在 Node 載入 data.js＋items.js，檢查裝備產生、數值、格子背包。有 ❌ 結束碼 1 */
'use strict';
const fs = require('fs'),
  vm = require('vm'),
  path = require('path');
const ctx = { console, Math, Date, JSON, Object, Array, location: { search: '' }, URLSearchParams };
vm.createContext(ctx);
for (const f of ['data.js', 'items.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
const G = vm.runInContext(
  '({ BASES, KINDS, AFF, EQS, TMAX, MOBS, BOSSES, SKILLS, SUPPORTS, PTREE, CTREE, CORE_CLS, mkItem, mkGem, dropItem, dropGem, itemSize, stats, dps, gridAuto, sellPrice, bestTier, tierRange, affText, itemName })',
  ctx
);
let bad = 0;
const ok = (name, cond, info = '') => {
  console.log((cond ? '✅ ' : '❌ ') + name + (cond ? '' : ' ' + info));
  if (!cond) bad++;
};
/* 1. 圖都在：底材、怪物、王 */
const art = fs.readFileSync(path.join(__dirname, '..', 'js', 'art.js'), 'utf8'),
  has = n => new RegExp(`^\\s*'?${n}'?:`, 'm').test(art);
const miss = [...G.BASES.map(b => b.ic), ...Object.values(G.MOBS).map(m => m.sp), ...G.BOSSES.map(b => b.sp)].filter(
  n => !has(n)
);
ok('底材、怪物、王的圖都在', !miss.length, miss.join(','));
ok(
  '底材種類都有裝備欄',
  G.BASES.every(b => G.KINDS[b.k] && G.EQS.some(e => e.t === b.k))
);
/* 2. 產生 3000 件：詞綴數、前後綴上限、不重複、數值在那一階的範圍 */
const err = [];
for (let i = 0; i < 3000; i++) {
  const L = 1 + (i % G.TMAX),
    it = G.dropItem(L, (i % 5) / 4),
    n = it.a.length,
    np = it.a.filter(a => G.AFF[a.k].p).length;
  if (it.r === 0 && n) err.push('普通有詞綴');
  if (it.r === 1 && (n < 1 || n > 2 || np > 1 || n - np > 1)) err.push('魔法詞綴數 ' + n);
  if (it.r === 2 && (n < 3 || n > 6 || np > 3 || n - np > 3)) err.push('稀有詞綴數 ' + n);
  if (new Set(it.a.map(a => a.k)).size !== n) err.push('詞綴重複');
  for (const a of it.a) {
    if (a.T < G.bestTier(L) || a.T > 12) err.push(`階級超出 T${a.T} L${L}`);
    const [lo, hi] = G.tierRange(a.k, a.T),
      v = Array.isArray(a.v) ? a.v[1] : a.v;
    if (v < lo || v > hi) err.push(`數值超出 ${a.k} ${v}`);
    if (!G.KINDS[G.BASES.find(b => b.id === it.b).k].aff.includes(a.k)) err.push('不該出現的詞綴 ' + a.k);
  }
  if (!(G.sellPrice(it) > 0)) err.push('賣價');
  if (!G.itemName(it) || it.a.some(a => G.affText(a).includes('{}'))) err.push('文字');
}
ok('3000 件裝備的稀有度、詞綴、數值範圍', !err.length, [...new Set(err)].slice(0, 5).join('；'));
/* 3. 全身穿滿的數值沒有 NaN */
let nan = 0;
for (let i = 0; i < 300; i++) {
  const s = { lv: 1 + (i % 60), eq: {} };
  for (const e of G.EQS) {
    const pool = G.BASES.filter(b => b.k === e.t);
    s.eq[e.k] = Math.random() < 0.8 ? G.mkItem(pool[i % pool.length].id, 1 + (i % 16), i % 3) : null;
  }
  const o = G.stats(s),
    vals = [o.hp, o.mp, o.dmg[0], o.dmg[1], o.aps, o.crit, o.armor, o.spd, G.dps(o), ...Object.values(o.res)];
  if (vals.some(v => !Number.isFinite(v))) nan++;
}
ok('300 套全身裝備的數值沒有 NaN', !nan, nan + ' 套');
/* 4. 格子背包：自動擺放不重疊、不出界 */
let over = 0;
for (let k = 0; k < 50; k++) {
  const g = { w: 12, h: 5, items: [] };
  for (let i = 0; i < 40; i++) G.gridAuto(g, G.dropItem(8, 0.5));
  for (const a of g.items) {
    const [w, h] = G.itemSize(a);
    if (a.x < 0 || a.y < 0 || a.x + w > g.w || a.y + h > g.h) over++;
    for (const b of g.items) {
      if (a === b) continue;
      const [bw, bh] = G.itemSize(b);
      if (a.x < b.x + bw && b.x < a.x + w && a.y < b.y + bh && b.y < a.y + h) over++;
    }
  }
}
ok('格子背包自動擺放不重疊、不出界', !over, over + ' 處');
/* 5. 技能寶石、天賦樹、核心樹 */
const miss2 = [...Object.values(G.SKILLS), ...Object.values(G.SUPPORTS), ...G.PTREE.N, ...G.CTREE.N]
  .map(x => x.ic)
  .filter(n => !has(n));
ok('技能、輔助、天賦、核心的圖示都在', !miss2.length, [...new Set(miss2)].join(','));
for (const [name, T] of [
  ['天賦樹', G.PTREE],
  ['核心樹', G.CTREE]
]) {
  const bad = T.E.flat().filter(id => !T.I[id]),
    seen = new Set(['c']),
    q = ['c'];
  while (q.length) {
    const n = q.pop();
    for (const [a, b] of T.E) {
      const o = a === n ? b : b === n ? a : null;
      if (o && !seen.has(o)) seen.add(o), q.push(o);
    }
  }
  ok(
    `${name}的每個點都從起點連得到`,
    !bad.length && seen.size === T.N.length,
    `${bad.join(',')} 連到 ${seen.size}/${T.N.length}`
  );
}
const full = { lv: 60, eq: {}, pt: G.PTREE.N.map(n => n.id), ct: G.CTREE.N.map(n => n.id) },
  o = G.stats(full),
  vals = [
    o.hp,
    o.mp,
    o.mpReg,
    o.cdr,
    o.dmgA,
    o.eleP,
    o.dmg[0],
    o.aps,
    o.crit,
    o.critM,
    G.dps(o),
    ...Object.values(o.res)
  ];
ok('天賦、核心全點滿數值沒有 NaN', vals.every(Number.isFinite), JSON.stringify(vals));
const gems = Array.from({ length: 200 }, (_, i) => G.dropGem(1 + (i % 16)));
ok(
  '寶石掉落：等級 1～20、大小 1×1、有名字',
  gems.every(g => g.lv >= 1 && g.lv <= 20 && G.itemSize(g).join() === '1,1' && G.itemName(g))
);
process.exit(bad ? 1 : 0);
