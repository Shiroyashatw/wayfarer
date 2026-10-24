/* 塞令老師 · 固定檢查：每次改完道具、賽制、經濟、戰鬥都跑一次（沒有 ❌ 才交差）。
   用法：
     node tools/check.js                 每個賽制跑 3 局（玩家由機器人代打、5 位即時機器人）＋各項不變量
     node tools/check.js --games 6       每個賽制 6 局
     node tools/check.js --modes curse,relic
     node tools/check.js --golden        重構用：印出固定種子的對局雜湊（重構前後要一模一樣）
   檢查項目（每回合）：
     1. 買了馬上賣：商店每一格、遺產每一件都不會賺錢（狂風市集、六合彩那種漏洞）
     2. 戰鬥數值沒有 NaN／Infinity，戰鬥時間是有限的；收入不是負的
     3. 背包格子不重疊、不出界
     4. 快照打包 → JSON → 還原，戰力一樣
     5. 怪物 × 星象每條規則：數值都是有限的
     6. 七十二變：1★ 的形狀放得進 3×3、最多 3 格
     7. 整局不丟錯（丟錯會印出堆疊）
     9. 0.1.69 塔羅牌陣：44 種牌每種強制整局生效跑一局（上面 1～7 照樣檢查）
     8. 0.1.62 道具池：商店只出這局的主題池＋基本池；每個主題、每類職業武器 1～5★ 都要有；基本池沒有武器（每局輪流三個主題） */
'use strict';
const G = require('./game_node');
require('vm').runInContext('var __tarotOpts = tarotOpts, __botTarot = botTarot;', G.__ctx);
const arg = k => {
  const i = process.argv.indexOf('--' + k);
  return i < 0 ? null : process.argv[i + 1] || true;
};
/* 固定亂數：newRun 用 Math.random 抽種子，檢查要每次一樣 */
let seed = 12345;
Math.random = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296;

const MODES = arg('modes') ? String(arg('modes')).split(',') : G.MODES.map(m => m.k),
  N = +arg('games') || 3;
const bad = {};
let checks = 0;
const flag = (m, k, x) => {
  bad[m] = bad[m] || {};
  bad[m][k] = (bad[m][k] || 0) + 1;
  if (bad[m][k] <= 2) console.log(`❌ ${m}・${k}`, JSON.stringify(x).slice(0, 240));
};
const finite = v => typeof v !== 'number' || isFinite(v);
function nanOf(F) {
  for (const k in F) if (!finite(F[k])) return k;
  for (const w of F.weapons) {
    for (const k in w) if (!finite(w[k])) return 'w.' + k;
    if (!w.dmg.every(isFinite)) return 'w.dmg';
  }
  for (const s of F.shields) for (const k in s) if (!finite(s[k])) return 's.' + k;
  return null;
}
/* 一局：玩家換成機器人（q 0.9），開場直接指定賽制 */
function newGame(m, g) {
  const run = G.newRun(G.liveBots(G.LOBBY_N - 1, 1000, g * 97 + 5));
  G.setMode(run, m);
  /* 0.1.62 道具池的主題：每局輪流（跟賽制衝突的跳過） */
  const ths = G.POOLTH.map(x => x.k).filter(k => !(G.MODE_TH_BAN[m] || []).includes(k));
  G.setTheme(run, ths[g % ths.length]);
  G.rollShop(run);
  run.bag.cls = run.clsOpts[g % 3];
  run.phase = 'prep';
  run.mseen = 1;
  G.giveStarter(run);
  G.modeFix(run);
  return run;
}
/* 複製這一局（不含對手），拿來試買試賣 */
const clone = run =>
  JSON.parse(JSON.stringify({ ...run, rivals: [], lob: undefined }, (k, v) => (k === 'live' ? undefined : v)));
/* 0.1.62 商店只能出這局的主題池＋基本池 */
function checkPool(m, run) {
  for (const s of run.shop) {
    checks++;
    if (s && !G.thOK(run.theme, G.ITEMI[s.id])) flag(m, `商店出現別的主題的道具`, { theme: run.theme, id: s.id });
  }
}
/* 0.1.62 每個主題、每類職業武器的 1～5★ 都要有（不然抽到那個主題的職業會斷線）；基本池不能有武器 */
function checkThemes() {
  const W = G.ITEMS.filter(i => G.shopOK(i) && (i.dmg || i.block)),
    groups = {
      弓弩: ['bow', 'xbow'],
      劍: ['sword'],
      矛: ['spear'],
      斧鎚: ['axe', 'mace'],
      匕首: ['dagger'],
      火: ['fire'],
      冰: ['cold'],
      雷: ['light'],
      毒: ['poison'],
      聖: ['holy'],
      暗: ['dark'],
      法杖: ['staff'],
      寵物: ['pet'],
      盾: ['shield']
    };
  for (const T of G.POOLTH)
    for (const [g, tg] of Object.entries(groups))
      for (let st = 1; st <= 5; st++) {
        checks++;
        if (!W.some(i => i.star === st && tg.some(t => i.tags.includes(t)) && G.thOK(T.k, i)))
          flag('pool', `${T.n}缺 ${st}★ ${g}`, '');
      }
  for (const i of W) {
    checks++;
    if (G.thOf(i) === 'b') flag('pool', '基本池裡有武器', i.id);
  }
}
function tryBuySell(m, run) {
  for (let k = 0; k < run.shop.length; k++) {
    if (!run.shop[k]) continue;
    const c = clone(run);
    c.gold = 999;
    const before = new Set(c.bench.filter(Boolean).map(o => o.u)),
      r = G.buyItem(c, k);
    if (typeof r === 'string' || r.merged.length) continue;
    const o = c.bench.find(q => q && !before.has(q.u));
    if (!o) continue;
    G.sellItem(c, o.u);
    checks++;
    if (c.gold > 999) flag(m, '商店買了馬上賣會賺', { id: run.shop[k].id, t: run.shop[k].t, d: c.gold - 999 });
  }
  for (let k = 0; k < (run.leg || []).length; k++) {
    const c = clone(run);
    c.gold = 999;
    const before = new Set(c.bench.filter(Boolean).map(o => o.u)),
      r = G.legacyBuy(c, k);
    if (typeof r === 'string' || r.merged.length) continue;
    const o = c.bench.find(q => q && !before.has(q.u));
    if (!o) continue;
    G.sellItem(c, o.u);
    checks++;
    if (c.gold > 999) flag(m, '遺產買了馬上賣會賺', { id: run.leg[k].id, d: c.gold - 999 });
  }
}
function checkBag(m, run) {
  const g = {};
  for (const o of run.bag.items)
    for (const [x, y] of G.cellsOf(o)) {
      if (x < 0 || y < 0 || x >= run.bag.w || y >= run.bag.h || g[x + ',' + y])
        flag(m, '背包格子重疊或出界', { id: o.id, x, y });
      g[x + ',' + y] = 1;
    }
  const a = G.compileBag(run.bag),
    b = G.compileBag(G.unpackBag(JSON.parse(JSON.stringify(G.packBag(run.bag))))),
    sig = F => JSON.stringify([F.hp, F.arm, F.weapons.map(w => [w.dmg, w.cd, w.crit]), F.shields.map(s => s.block)]);
  checks += 2;
  if (sig(a) !== sig(b)) flag(m, '快照還原後戰力不一樣', { ri: run.ri });
  const nk = nanOf(a);
  if (nk) flag(m, '戰鬥數值有 NaN', nk);
}
function playMode(m, games = N, tag = m) {
  for (let g = 0; g < games; g++) {
    const run = newGame(m, g),
      th = G.CLSI[run.bag.cls].th || 'sword';
    if (m === 'shape')
      for (const it of G.ITEMS.filter(i => i.star === 1 && run.shm[i.id])) {
        const sh = G.SH[run.shm[it.id]];
        checks++;
        if (sh.length > 3 || Math.max(...sh.flat()) > 2) flag(tag, '1★ 形狀太大', it.id);
      }
    try {
      for (let k = 0; run.phase !== 'end' && k < 80; k++) {
        if (run.relq) G.relicPick(run, run.relq.opts[0]);
        tryBuySell(tag, run);
        checkPool(tag, run);
        G.botAct(run, th, 0.9, G.BOT_P);
        checkBag(tag, run);
        checks++;
        if (G.incomeOf(run) < 0) flag(tag, '收入是負的', G.incomeOf(run));
        const fb = G.startFight(run);
        if (!fb) {
          G.endRun(run, 1);
          break;
        }
        checks++;
        if (!isFinite(fb.res.t) || !isFinite(fb.res.end[0]) || !isFinite(fb.res.end[1]))
          flag(tag, '戰鬥結果不是有限的數', { t: fb.res.t, end: fb.res.end });
        G.finishFight(run, fb);
        if (run.phase === 'end') break;
        if (run.pend) G.takePick(run, run.pend.opts[0], true);
        if (run.hold) G.claimHold(run);
        G.nextRound(run);
      }
    } catch (e) {
      flag(tag, '丟錯', e.stack.split('\n').slice(0, 4).join(' | '));
    }
  }
}
/* 0.1.69 塔羅：每張牌（正逆位）強制整局生效各跑一局 */
function checkTarot() {
  const vm = require('vm'),
    keys = G.TAROT.flatMap(T => [T.k, T.k + '_r']);
  for (const k of keys) {
    vm.runInContext(`tarotOpts = () => [${JSON.stringify(k)}]; botTarot = (run, o) => o[0];`, G.__ctx);
    playMode('tarot', 1, 'tarot:' + k);
  }
  vm.runInContext('tarotOpts = __tarotOpts; botTarot = __botTarot;', G.__ctx);
}
/* 怪物 × 星象 */
function checkAstro() {
  const run = G.newRun([]);
  G.setMode(run, 'astro');
  for (const a of G.ASTROS)
    for (const r of G.ROUNDS.filter(r => r.type !== 'pvp')) {
      const F = G.astroF(G.stageHp(G.mobOf(run, r).F, r.st, 1), a.k),
        nk = nanOf(F);
      checks++;
      if (nk) flag('astro', `怪物 ${r.id} × ${a.n} 有 NaN`, nk);
    }
}
/* 重構用：固定種子的機器人對局（每個賽制 2 場）＋玩家那局的結果，印成雜湊 */
function golden() {
  const hash = s => {
    let x = 2166136261;
    for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619) >>> 0;
    return x.toString(16);
  };
  for (const m of MODES) {
    const out = [];
    for (let k = 0; k < 2; k++) {
      const bots = G.simLobby(900 + k, 1100, { mode: m });
      out.push(hash(JSON.stringify(bots.map(b => [b.place, b.snaps]))));
    }
    seed = 777;
    const run = newGame(m, 1),
      th = G.CLSI[run.bag.cls].th || 'sword';
    for (let k = 0; run.phase !== 'end' && k < 80; k++) {
      if (run.relq) G.relicPick(run, run.relq.opts[0]);
      G.botAct(run, th, 0.9, G.BOT_P);
      const fb = G.startFight(run);
      if (!fb) break;
      G.finishFight(run, fb);
      if (run.phase === 'end') break;
      if (run.pend) G.takePick(run, run.pend.opts[0], true);
      if (run.hold) G.claimHold(run);
      G.nextRound(run);
    }
    out.push(hash(JSON.stringify([run.place, run.hp, G.packBag(run.bag), run.log.map(l => [l.id, l.win])])));
    console.log(m, out.join(' '));
  }
}

if (arg('golden')) golden();
else {
  const t0 = Date.now();
  for (const m of MODES) playMode(m);
  if (MODES.includes('tarot')) checkTarot();
  if (MODES.includes('astro')) checkAstro();
  checkThemes();
  const n = Object.values(bad).reduce((a, x) => a + Object.values(x).reduce((p, q) => p + q, 0), 0);
  console.log(
    n
      ? `❌ ${n} 個問題（${checks} 項檢查，${((Date.now() - t0) / 1000) | 0} 秒）：${JSON.stringify(bad)}`
      : `✅ 沒有問題（${MODES.length} 個賽制 × ${N} 局，${checks} 項檢查，${((Date.now() - t0) / 1000) | 0} 秒）`
  );
  process.exitCode = n ? 1 : 0;
}
