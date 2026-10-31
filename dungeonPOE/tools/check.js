/* dungeonPOE 0.2 · 固定檢查：在 Node 載入 data.js＋items.js，檢查裝備產生、數值、格子背包。有 ❌ 結束碼 1 */
'use strict';
const fs = require('fs'),
  vm = require('vm'),
  path = require('path');
const ctx = { console, Math, Date, JSON, Object, Array, location: { search: '' }, URLSearchParams };
vm.createContext(ctx);
for (const f of ['data.js', 'items.js', 'craft.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
const G = vm.runInContext(
  '({ BASES, BASEI, KINDS, AFF, EQS, eqTakes, offOK, SOCK_MAX, SHARDS, FORGE, forgeCheck, forgeDo, temperDo, tierRange, affPct, decompDo, newMat, gemUp, drillDo, soulCost, TMAX, MOBS, BOSSES, SKILLS, SUPPORTS, PTREE, PT_START, ASC, ascNodes, ascPoints, mkItem, mkGem, dropItem, dropGem, itemSize, stats, dps, gridAuto, sellPrice, bestTier, tierRange, affText, itemName })',
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
  G.BASES.every(b => G.KINDS[b.k] && G.EQS.some(e => G.eqTakes(e, b.k)))
);
/* 0.2.6：底材三層的範圍、雙手武器與箭袋的規則 */
{
  const bad = [];
  for (let i = 0; i < 3000; i++) {
    const it = G.dropItem(1 + (i % 16), 0.5),
      k = G.BASEI[it.b].k;
    if (!(it.q >= 0 && it.q <= 0.4)) bad.push('品質 ' + it.q);
    if (it.q >= 0.35 && it.L < 10) bad.push('階級 ' + it.L + ' 出了 ' + it.q);
    if (!(it.so >= 0 && it.so <= G.SOCK_MAX[k])) bad.push(k + ' 孔 ' + it.so);
    if (!(it.pot >= 3 && it.pot <= 10)) bad.push('潛能 ' + it.pot);
  }
  ok('品質 0～40%（35% 以上只在階級 10 以上）、孔數不超過上限、潛能 3～10', !bad.length, bad.slice(0, 4).join('、'));
  const mk = id => G.mkItem(id, 10, 0),
    rules = [
      [mk('w_nodachi'), mk('s_wood'), false],
      [mk('w_katana'), mk('s_wood'), true],
      [mk('w_bow'), mk('q_bamboo'), true],
      [mk('w_katana'), mk('q_bamboo'), false],
      [mk('w_bow'), mk('s_wood'), false],
      [mk('w_charm'), mk('s_orb'), true]
    ].filter(([w, o, want]) => G.offOK(w, o) !== want);
  /* 每種武器都拿一次：所有數值都要是數字（新武器種類查不到天賦加成會變 NaN） */
  const nan = [];
  for (const B of G.BASES.filter(b => b.k === 'weapon')) {
    const s = { lv: 20, eq: Object.fromEntries(G.EQS.map(e => [e.k, null])), pt: [], at: [], auras: [] };
    s.eq.weapon = G.mkItem(B.id, 10, 2);
    const o = G.stats(s),
      badK = Object.keys(o).filter(k => typeof o[k] === 'number' && !Number.isFinite(o[k]));
    if (badK.length || o.dmg.some(v => !Number.isFinite(v))) nan.push(B.n + '：' + badK.join(','));
  }
  ok('每種武器的數值都不是 NaN', !nan.length, nan.join('；'));
  /* 0.2.6 鍛造：材料給滿，隨機鍛造 2000 次 */
  vm.runInContext('var S = { gold: 1e12, lv: 60, mat: null, lib: [] }', ctx);
  vm.runInContext(
    'S.mat = newMat(); S.mat.dust = 1e9; for (const k in S.mat.sh) S.mat.sh[k] = 1e6; S.mat.soul = 1e12; S.mat.drill = [99, 99, 99];',
    ctx
  );
  const fbad = [],
    ops = Object.keys(G.FORGE);
  let done = 0;
  for (let i = 0; i < 2000; i++) {
    const it = G.dropItem(1 + (i % 16), 0.6);
    it.pot = 10;
    const op = ops[i % ops.length],
      cls = G.SHARDS[i % 8].k,
      before = it.a.slice(),
      p0 = it.pot,
      err = G.forgeDo(it, op, cls);
    if (err) continue;
    done++;
    const add = it.a.filter(a => !before.includes(a)),
      np = it.a.filter(a => G.AFF[a.k].p).length,
      cap = it.r === 2 ? 3 : 1;
    if (add.some(a => a.T < 2)) fbad.push(op + ' 做出 T1');
    if (it.a.length > (it.r === 2 ? 6 : 2) || np > cap || it.a.length - np > cap) fbad.push(op + ' 超過條數');
    if (new Set(it.a.map(a => a.k)).size !== it.a.length) fbad.push(op + ' 重複的詞');
    if (it.pot !== p0 - G.FORGE[op].pot) fbad.push(op + ' 潛能沒扣');
    const tiers = it.a.map(a => a.T).join();
    if (
      !G.temperDo(it, null) &&
      (it.a.map(a => a.T).join() !== tiers || it.a.some(a => G.affPct(a) < 0 || G.affPct(a) > 1))
    )
      fbad.push('淬鍊改到階級或超出範圍');
  }
  ok(
    `鍛造 ${done} 次：沒有做出 T1、不超過條數、不重複、潛能有扣；淬鍊不改階級`,
    done > 500 && !fbad.length,
    [...new Set(fbad)].slice(0, 4).join('、') || done
  );
  /* 藍裝（後綴已經用掉）強化成黃：還能加後綴（照強化之後的上限） */
  const blue = G.mkItem('c_leather', 10, 0);
  blue.r = 1;
  blue.a = [{ k: 'resF', T: 8, v: 20 }];
  blue.pot = 5;
  ok(
    '藍裝後綴滿了也能「強化」加抗性（照黃裝的上限）',
    !G.forgeDo(blue, 'enhance', 'res') && blue.r === 2 && blue.a.length === 2
  );
  const g = G.mkGem('fireball', 1);
  let up = 0;
  while (!G.gemUp(g)) up++;
  let dr = 0;
  while (!G.drillDo(g)) dr++;
  ok(
    '寶石：靈魂升到 20 級為止、開孔開到 5 孔為止',
    g.lv === 20 && up === 19 && g.so === 5 && g.sup.length === 5 && dr === 3,
    `Lv ${g.lv}、${g.so} 孔`
  );
  ok('雙手武器不能拿副手、箭袋只有弓能用', !rules.length, rules.map(([w, o]) => w.b + '+' + o.b).join('、'));
}
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
const ascAll = Object.keys(G.ASC.sword.br).map(b => [b, G.ascNodes(b)]);
const miss2 = [
  ...Object.values(G.SKILLS),
  ...Object.values(G.SUPPORTS),
  ...G.PTREE.N,
  ...ascAll.flatMap(([, T]) => T.N)
]
  .map(x => x.ic)
  .filter(n => n && !has(n));
ok('技能、輔助、天賦、昇華的圖示都在', !miss2.length, [...new Set(miss2)].join(','));
{
  const T = G.PTREE,
    bad = T.E.flat().filter(id => !T.I[id]),
    seen = new Set(G.PT_START),
    q = [...G.PT_START];
  while (q.length) for (const o of T.ADJ[q.pop()] || []) if (!seen.has(o)) seen.add(o), q.push(o);
  ok(
    `天賦樹 ${T.N.length} 個點，每個都從起點連得到`,
    T.N.length >= 1000 && !bad.length && seen.size === T.N.length,
    `${seen.size}/${T.N.length}`
  );
}
{
  const T = G.PTREE;
  let close = 0;
  for (let i = 0; i < T.N.length; i++)
    for (let j = i + 1; j < T.N.length; j++) if (Math.hypot(T.N[i].x - T.N[j].x, T.N[i].y - T.N[j].y) < 30) close++;
  ok('天賦樹的點沒有疊在一起', !close, close + ' 組');
}
/* 昇華：一小一大交錯、6 小 6 大、點得成 4 小 4 大 */
for (const [b, T] of ascAll) {
  const big = id => T.I[id].big === 1,
    alt = T.E.every(([x, y]) => (x === 'a_st' ? !big(y) : big(x) !== big(y))),
    nb = T.N.filter(n => n.big === 1).length,
    ns = T.N.filter(n => n.big === 0).length;
  let can44 = false;
  const go = set => {
    const sm = [...set].filter(id => id !== 'a_st' && !big(id)).length,
      bg = [...set].filter(id => big(id)).length;
    if (sm > 4 || bg > 4 || can44) return;
    if (sm === 4 && bg === 4) return (can44 = true);
    for (const [x, y] of T.E)
      for (const [p, q] of [
        [x, y],
        [y, x]
      ])
        if (set.has(p) && !set.has(q)) go(new Set([...set, q]));
  };
  go(new Set(['a_st']));
  ok(`昇華「${G.ASC.sword.br[b].n}」一小一大交錯、6 小 6 大、點得成 4 小 4 大`, alt && nb === 6 && ns === 6 && can44);
}
ok(
  '昇華點：一開始 2 點，階級 6、12、16 各 +2',
  G.ascPoints({ maxT: 1 }) === 2 && G.ascPoints({ maxT: 16, t16: 1 }) === 8
);
for (const [b, T] of ascAll) {
  const full = { lv: 60, eq: {}, pt: G.PTREE.N.map(n => n.id), asc: b, at: T.N.map(n => n.id) },
    o = G.stats(full),
    vals = [
      o.hp,
      o.mp,
      o.mpReg,
      o.cdr,
      o.dmgA,
      o.eleP,
      o.meleeP,
      o.dmg[0],
      o.aps,
      o.crit,
      o.critM,
      o.spd,
      G.dps(o),
      ...Object.values(o.res)
    ];
  ok(`天賦全點滿＋${G.ASC.sword.br[b].n}：數值沒有 NaN`, vals.every(Number.isFinite), JSON.stringify(vals));
}
const gems = Array.from({ length: 200 }, (_, i) => G.dropGem(1 + (i % 16)));
ok(
  '寶石掉落：等級 1～20、大小 1×1、有名字',
  gems.every(g => g.lv >= 1 && g.lv <= 20 && G.itemSize(g).join() === '1,1' && G.itemName(g))
);
process.exit(bad ? 1 : 0);
