/* PvE 勝率與對戰秒數（Node 版，比瀏覽器快）：用機器人代打玩家打 N 局，統計每種野怪／菁英／首領的勝率。
   用法：node tools/pve_check.js [局數=40] [q=0.8] [MOB_HP] [MOB_DMG]
   後兩個參數可以暫時改 run.js 的怪物成長倍率來試（不會改檔案）。skill balance／bot-ai 用。 */
const vm = require('vm');
const G = require('./game_node');
const [n = 40, q = 0.8, mh, md] = process.argv.slice(2).map(Number);
if (!isNaN(mh)) vm.runInContext(`MOB_HP = ${mh}`, G.__ctx);
if (!isNaN(md)) vm.runInContext(`MOB_DMG = ${md}`, G.__ctx);
const st = {},
  dur = {},
  pl = [];
let pw = 0,
  pn = 0;
for (let g = 0; g < n; g++) {
  const run = G.newRun(G.makeBots(G.LOBBY_N - 1, 1000));
  run.bag.cls = run.clsOpts[g % 3];
  run.phase = 'prep';
  G.giveStarter(run);
  const th = G.CLSI[run.bag.cls].th || 'sword';
  for (let k = 0; run.phase !== 'end' && k < 80; k++) {
    G.botAct(run, th, q);
    const fb = G.startFight(run);
    if (!fb) {
      G.endRun(run, 1);
      break;
    }
    const r = fb.r;
    if (fb.opp.kind === 'pvp') {
      pn++;
      if (fb.res.win) pw++;
      (dur[r.st] = dur[r.st] || []).push(fb.res.t);
    } else {
      const key = /^1-|^2-2$|^2-5$|^4-4$/.test(r.id) ? r.id : `菁英${r.st}`;
      const s = (st[key] = st[key] || [0, 0]);
      s[1]++;
      if (fb.res.win) s[0]++;
    }
    G.finishFight(run, fb);
    if (run.phase === 'end') break;
    if (run.pend) G.takePick(run, run.pend.opts[0], true);
    if (run.hold) G.claimHold(run);
    G.nextRound(run);
  }
  pl.push(run.place);
}
const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
console.log(
  'PvE：' +
    Object.entries(st)
      .map(([k, [w, c]]) => `${k} ${Math.round((w / c) * 100)}%`)
      .join(' ')
);
console.log(
  '對戰秒數：' +
    Object.entries(dur)
      .map(([k, a]) => `${k}:${avg(a).toFixed(1)}s`)
      .join(' ')
);
console.log(`對戰勝率 ${Math.round((pw / pn) * 100)}%、平均名次 ${avg(pl).toFixed(2)}`);
