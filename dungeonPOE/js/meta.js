/* dungeonPOE · 局外：存檔結構、城鎮（倉庫、商店、鐵匠、背包工坊）、職業等級與天賦、出發與結算（純邏輯） */
'use strict';
const newBag = t => ({ u: newUid(), t, items: [] });
function newGame() {
  const S = {
    v: 1,
    gold: 20,
    bags: [newBag('b44')],
    sel: null,
    wh: [],
    box: { t: 'box', items: [] },
    cls: 'ronin',
    cl: {},
    eq: {},
    maxD: 1,
    d: 1,
    run: null,
    last: null,
    shop: null,
    st: { runs: 0, esc: 0, dead: 0, best: 0 },
    sfx: true,
    tut: 0,
    savedAt: 0
  };
  const b = S.bags[0];
  autoPlace(b, mkItem('woodsword'));
  autoPlace(b, mkItem('leatherarmor'));
  S.sel = b.u;
  refreshShop(S);
  return S;
}
/* ---------- 職業等級與天賦 ---------- */
const clOf = (S, c) => (S.cl[c] = S.cl[c] || { xp: 0, pts: [] });
function clLv(xp) {
  let lv = 1;
  while (xp >= xpNeed(lv)) xp -= xpNeed(lv++);
  return { lv, xp, need: xpNeed(lv) };
}
const tPoints = (S, c) => clLv(clOf(S, c).xp).lv - 1 - clOf(S, c).pts.length;
const rowNeed = r => fl(r * 1.5);
function canTake(S, c, id) {
  const cl = clOf(S, c),
    nd = TNODES.find(n => n.id === id);
  return nd && !cl.pts.includes(id) && tPoints(S, c) > 0 && cl.pts.length >= rowNeed(nd.r);
}
function takeNode(S, c, id) {
  if (!canTake(S, c, id)) return false;
  clOf(S, c).pts.push(id);
  return true;
}
function resetTree(S, c) {
  clOf(S, c).pts = [];
  S.eq[c] = [CLSI[c].cores[0].id];
}
/* 解鎖的核心：第 0 個一開始就有，其他靠天賦的 u 節點 */
function coresOf(S, c) {
  const pts = clOf(S, c).pts,
    cs = CLSI[c].cores;
  return cs.filter((k, i) => !i || pts.some(id => TNODES.find(n => n.id === id).u === i)).map(k => k.id);
}
const eqOf = (S, c) => {
  const ok = coresOf(S, c),
    e = (S.eq[c] || []).filter(id => ok.includes(id)).slice(0, 2);
  return e.length ? e : [ok[0]];
};
function toggleCore(S, c, id) {
  const e = eqOf(S, c);
  if (e.includes(id)) S.eq[c] = e.filter(x => x !== id);
  else if (coresOf(S, c).includes(id)) S.eq[c] = [...e, id].slice(-2);
  if (!S.eq[c].length) S.eq[c] = [id];
}
/* 出發用的角色：職業、2 個核心、核心強化、天賦小數值 */
function heroOf(S, c) {
  const pts = clOf(S, c).pts.map(id => TNODES.find(n => n.id === id)),
    cs = CLSI[c].cores,
    tal = {},
    clv = {};
  for (const n of pts) {
    if (n.s) tal[n.s] = (tal[n.s] || 0) + TSTAT[n.s][1] * (n.x || 1);
    if (n.e != null) clv[cs[n.e].id] = 1;
  }
  return { cls: c, cores: eqOf(S, c), clv, tal };
}
/* ---------- 城鎮 ---------- */
const allItems = S => [...S.wh, ...S.box.items, ...S.bags.flatMap(b => b.items)];
/* 跑刀：沒有背包就送新手包；完全沒有武器（或防具）就送桃木劍（皮甲） */
function ensureStarter(S) {
  if (!S.bags.length) S.bags.push(newBag('b44'));
  if (!S.bags.some(b => b.u === S.sel)) S.sel = S.bags[0].u;
  const has = k => allItems(S).some(o => baseOf(o).k === k);
  if (!has('w')) S.wh.push(mkItem('woodsword'));
  if (!has('a')) S.wh.push(mkItem('leatherarmor'));
}
const shopStar = S => Math.min(5, S.maxD + 1);
function refreshShop(S) {
  const r = rng(h(Date.now() & 0xffffff, S.st.runs, 3)),
    pool = GEAR.filter(b => b.star <= shopStar(S));
  S.shop = Array.from({ length: 6 }, () => ({ o: mkItem(pick(pool, r).id) }));
  S.shop.push({ o: mkItem('potion') }, { o: mkItem('purse') });
}
function buyShop(S, i) {
  const s = S.shop[i];
  if (!s || s.sold || S.gold < itemPrice(s.o)) return false;
  S.gold -= itemPrice(s.o);
  s.sold = 1;
  S.wh.push(s.o);
  return true;
}
function sellItem(S, u) {
  const i = S.wh.findIndex(o => o.u === u);
  if (i < 0) return false;
  S.gold += sellPrice(S.wh[i]);
  S.wh.splice(i, 1);
  return true;
}
const smithCost = (o, i) => 10 + baseOf(o).star * 8 + (7 - o.a[i].t) * 4;
function smith(S, u, i) {
  const o = allItems(S).find(x => x.u === u);
  if (!o || !o.a[i] || S.gold < smithCost(o, i)) return false;
  S.gold -= smithCost(o, i);
  rerollAff(o, i, rng(h(Date.now() & 0xffffff, i, 5)));
  return true;
}
function buyBag(S, t) {
  const b = BAGI[t];
  if (!b || S.gold < b.p) return false;
  S.gold -= b.p;
  const g = newBag(t);
  S.bags.push(g);
  S.sel = g.u;
  return true;
}
/* ---------- 出發與結算 ---------- */
function depart(S, seed) {
  ensureStarter(S);
  const bi = S.bags.findIndex(b => b.u === S.sel),
    bag = S.bags.splice(bi, 1)[0],
    box = S.box;
  S.box = null;
  S.run = newRun(seed, Math.min(S.d, S.maxD), heroOf(S, S.cls), bag, box);
  S.st.runs++;
  return S.run;
}
/* ok：撤離成功（背包帶回來）；否則背包和裡面的東西都失去，只留黑盒 */
function finishRun(S, ok) {
  const run = S.run,
    res = runResult(run, ok),
    cl = clOf(S, run.hero.cls),
    lv0 = clLv(cl.xp).lv;
  if (ok) S.bags.push(run.bag);
  S.box = run.box;
  S.gold += res.gold;
  cl.xp += res.xp;
  res.lvUp = clLv(cl.xp).lv - lv0;
  if (run.boss) S.maxD = Math.max(S.maxD, run.d + 1);
  if (ok) S.st.esc++;
  else S.st.dead++;
  S.st.best = Math.max(S.st.best, res.L);
  res.cls = run.hero.cls;
  res.lost = ok ? [] : run.bag.items.map(o => o.id);
  res.bag = run.bag.t;
  S.last = res;
  S.run = null;
  ensureStarter(S);
  refreshShop(S);
  return res;
}
