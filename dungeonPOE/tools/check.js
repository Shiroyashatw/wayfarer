/* dungeonPOE · 固定檢查：自動玩家整趟跑＋不變量（沒有 NaN、道具不重疊、地圖走得到、買了馬上賣不賺、存檔還原一樣、圖名存在）
   node tools/check.js [趟數=200]；有 ❌ 結束碼 1 */
'use strict';
const fs = require('fs'),
  path = require('path'),
  G = require('./game_node.js').load();
let bad = 0;
const fail = m => (bad++, console.log('❌ ' + m));
const ok = m => console.log('✅ ' + m);
/* 圖名：art.js 裡要有 */
const art = fs.readFileSync(path.join(__dirname, '../js/art.js'), 'utf8'),
  has = k => new RegExp('^  ' + k + ':', 'm').test(art);
const sp = [
  ...G.ITEMS.filter(i => !i.ic.startsWith('p:')).map(i => i.ic),
  ...G.MOBS.map(m => m.sp),
  ...G.BOSSES.map(m => m.sp),
  ...G.ZODIAC.map(m => m.sp),
  ...G.CLASSES.flatMap(c => [c.ic, c.av]),
  'hungry_ghost',
  'mat_gold'
];
const miss = sp.filter(k => !has(k));
miss.length ? fail('找不到圖：' + miss.join(' ')) : ok(`圖名 ${sp.length} 個都在`);
/* 買了馬上賣不會賺 */
const earn = G.ITEMS.filter(b => G.sellPrice(G.mkItem(b.id)) >= G.itemPrice(G.mkItem(b.id)));
earn.length ? fail('買了馬上賣會賺：' + earn.map(b => b.id).join(' ')) : ok('買了馬上賣不會賺');
/* 地圖：每一格從入口都走得到、從每一格都走得到樓梯或王 */
let mapBad = 0;
for (let s = 1; s <= 300; s++) {
  const M = G.genMap(s, 1 + (s % 3), 1 + (s % 3), 0),
    reach = from => {
      const seen = new Set([from]),
        q = [from];
      while (q.length) for (const m of G.moves(M, q.shift(), 0)) if (!seen.has(m.to)) seen.add(m.to), q.push(m.to);
      return seen;
    },
    goal = M.N.find(n => n.t === 'stairs' || n.t === 'boss').id;
  if (reach(0).size !== M.N.length || M.N.some(n => !reach(n.id).has(goal))) mapBad++;
  if (M.N.length < 15 || M.N.length > 20) mapBad++;
}
mapBad
  ? fail(`地圖 ${mapBad} 張有走不到的格子或大小不對`)
  : ok('300 張地圖：格數 15～20、全部走得到、每格都能到樓梯／王');
/* 整趟：自動玩家（簡化版）跑，檢查 NaN、重疊、存檔還原 */
const overlap = g => {
  const seen = new Set();
  for (const o of g.items)
    for (const [x, y] of G.cellsOf(o)) {
      const k = o.x + x + ',' + (o.y + y);
      if (seen.has(k) || !G.fits({ ...g, items: g.items.filter(i => i !== o) }, o, o.x, o.y)) return true;
      seen.add(k);
    }
  return false;
};
const N = +process.argv[2] || 200;
let nan = 0,
  ov = 0,
  rt = 0,
  done = 0;
for (let k = 0; k < N; k++) {
  const S = G.newGame();
  S.cls = G.CLASSES[k % 5].id;
  S.cl[S.cls] = { xp: k * 40, pts: [] };
  for (const n of G.TNODES) G.takeNode(S, S.cls, n.id);
  S.eq[S.cls] = G.coresOf(S, S.cls).slice(-2);
  const run = G.depart(S, k * 7919 + 1);
  for (let t = 0; t < 300 && S.run; t++) {
    const p = run.pend;
    if (p) {
      if (p.k === 'fight') {
        const r = G.fightNow(run);
        if (!Number.isFinite(r.hp) || r.ev.some(e => !Number.isFinite(e.h) || (e.v != null && !Number.isFinite(e.v))))
          nan++;
      } else if (p.k === 'dead') G.finishRun(S, false);
      else if (p.k === 'loot') {
        for (const o of run.ground.splice(0)) G.autoPlace(run.bag, o) || G.autoPlace(run.box, o);
        run.pend = null;
      } else if (p.k === 'event') G.eventPick(run, 0) || G.eventPick(run, 1);
      else if (p.k === 'stairs') G.goDown(run);
      else if (p.k === 'exit' && (run.f > 1 || run.heat > 30)) G.finishRun(S, true);
      else run.pend = null;
      continue;
    }
    while (run.hand.length) G.playCard(run, 0);
    const m = G.moves(run.map, run.pos, run.fx.detour).filter(m => m.c <= run.mp);
    if (m.length) G.moveTo(run, m[(t * 31) % m.length].to);
    else G.endTurn(run);
    if (k === 0 && t === 20) {
      const a = JSON.stringify(S),
        b = JSON.stringify(JSON.parse(a));
      if (a !== b) rt++;
    }
  }
  if (S.run) G.finishRun(S, true);
  done++;
  for (const g of [...S.bags, S.box]) if (overlap(g)) ov++;
  if (!Number.isFinite(S.gold)) nan++;
}
nan ? fail(`${nan} 次出現 NaN`) : ok(`${done} 趟：沒有 NaN`);
ov ? fail(`${ov} 個背包有重疊`) : ok('背包、黑盒沒有重疊');
rt ? fail('存檔還原不一樣') : ok('存檔還原一樣');
/* 核心都有被戰鬥讀到（裝上去有差） */
const P0 = G.compile(
  {
    t: 'b44',
    items: [G.mkItem('ironsword'), G.mkItem('woodshield'), G.mkItem('leatherarmor')].map(
      (o, i) => ((o.x = i * 1), (o.y = 0), o)
    )
  },
  { cls: 'ronin', cores: [], clv: {}, tal: {} }
);
const noEff = [];
for (const c of G.CLASSES)
  for (const k of c.cores) {
    /* 長一點的戰鬥（菁英＋王級血量的小怪）、六成血開打，回血與疊層的核心才看得出來 */
    const foes = [
        G.mkFoe(G.MOBS[0], 'mob', 2, 0, G.rng(1)),
        { ...G.mkFoe(G.MOBS[5], 'boss', 1, 0, G.rng(2)), mhp: 150, sk: null }
      ],
      hp = 180,
      base = G.simulate({ ...P0, mhp: 300, cls: c.id, cores: [] }, hp, foes, 11),
      w = G.simulate({ ...P0, mhp: 300, cls: c.id, cores: [k.id] }, hp, foes, 11);
    if (JSON.stringify(base.ev) === JSON.stringify(w.ev)) noEff.push(k.n);
  }
noEff.length ? fail('裝了沒差的核心：' + noEff.join('、')) : ok('30 個核心裝上去戰鬥都有變化');
process.exit(bad ? 1 : 0);
