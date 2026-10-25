/* 機器人訓練：自我對打調 js/bot.js 的 BOT_P（skill bot-ai）。
   做法：每一輪把目前最好的參數隨機微調一組「挑戰者」，跟最好的各 2 個放進同一場（位置輪流換），
   打 N 場比平均名次；挑戰者明顯比較好（平均名次低 0.08 以上）再打 N 場確認，兩批平均低 0.06 以上就換成它（--seed 換一組亂數）。
   用法：
     node tools/bot_train.js                      預設 30 輪、每輪 40 場，只印結果
     node tools/bot_train.js --iters 60 --lobbies 60 --write   跑完把最好的參數寫回 js/bot.js
     node tools/bot_train.js --vs-old              只比較：現在的機器人 vs 舊買法（botActOld）
     node tools/bot_train.js --vs-rcls             只比較：照賽制＋主題挑職業 vs 隨便挑職業
     node tools/bot_train.js --vs-plain            只比較：擺位看戰力＋整理背包 vs 0.1.71 的擺法
     --jobs N                                      幾個行程平行跑（預設 CPU 數）
     --theme 代號                                  0.1.79 只訓練一個道具池（g f m c z），寫回 BOT_PT[代號]
   0.1.72 rating 預設 BOT_RATING（菁英：每個決定都照評估、每回合多拿的金幣最多），玩家遇到的即時機器人就是這個強度。 */
const fs = require('fs');
const path = require('path');
const G = require('./game_node');
const pool = require('./lobby_pool');

const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf('--' + k);
  return i < 0 ? d : args[i + 1] && !args[i + 1].startsWith('--') ? Number(args[i + 1]) : true;
};
const ITERS = opt('iters', 30),
  LOBBIES = opt('lobbies', 40),
  WRITE = !!opt('write', false),
  RATING = opt('rating', G.BOT_RATING),
  JOBS = opt('jobs', require('os').cpus().length),
  /* 0.1.72 換一組亂數（挑戰者、場次都不一樣），重跑時不會跟上次一模一樣 */
  SEED = opt('seed', 0),
  /* 0.1.79 --theme 代號：只訓練這個道具池（每場都是這個主題），寫回 js/bot.js 的 BOT_PT[代號]（跟 BOT_P 不一樣的參數） */
  THEME = (i => (i >= 0 ? args[i + 1] : null))(args.indexOf('--theme'));
const PL = pool(JOBS);

/* 每個參數的範圍與微調幅度 */
const SPACE = {
  gainMin: [0.005, 0.2, 0.02],
  perGold: [0.001, 0.05, 0.004],
  reserve: [0, 40, 5],
  reserveFrom: [0, 20, 2],
  rollGold: [2, 40, 3],
  maxRolls: [0, 8, 1],
  lvFill: [0.3, 1, 0.08],
  lvKeep: [0, 20, 2],
  sellMargin: [0, 0.3, 0.03],
  mergeBonus: [0, 0.6, 0.05],
  dotW: [0.5, 6, 0.5],
  ctrlW: [0, 3, 0.25],
  ehpW: [0.5, 1.6, 0.08],
  lowHp: [0, 40, 4],
  resW: [0.3, 3, 0.25],
  nemW: [0, 6, 0.75],
  synW: [0, 0.15, 0.015]
};
const INT = new Set(['reserve', 'reserveFrom', 'rollGold', 'maxRolls', 'lvKeep', 'lowHp']);
const avg = a => a.reduce((x, y) => x + y, 0) / a.length;

function mutate(P, seed) {
  const r = G.rng(seed),
    Q = { ...P },
    keys = Object.keys(SPACE);
  /* 一次動 1～3 個參數 */
  const n = 1 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const k = keys[Math.floor(r() * keys.length)],
      [lo, hi, step] = SPACE[k];
    let v = Q[k] + (r() < 0.5 ? -1 : 1) * step * (0.5 + r());
    v = Math.max(lo, Math.min(hi, v));
    Q[k] = INT.has(k) ? Math.round(v) : Math.round(v * 1000) / 1000;
  }
  return Q;
}
/* A、B 各一半放同一場，回傳 [A 的平均名次, B 的平均名次]；mode：'old' 舊買法、'rcls' 隨便挑職業（B 是 null） */
async function duel(A, B, n, seed0, mode) {
  const pa = [],
    pb = [],
    sides = [],
    tasks = [];
  for (let i = 0; i < n; i++) {
    /* 0.1.29 一場 LOBBY_N 人：A、B 各一半交錯坐 */
    const side = [...Array(G.LOBBY_N).keys()].map(k => (k + i) % 2);
    sides.push(side);
    tasks.push({
      seed: seed0 + i * 7919,
      rating: RATING,
      opt:
        mode === 'old'
          ? { old: side, short: 1 }
          : mode === 'rcls'
            ? { rcls: side, short: 1 }
            : { P: side.map(s => (s ? B : A)), short: 1 }
    });
    if (THEME) tasks[tasks.length - 1].opt.theme = THEME;
  }
  const out = await PL.run(tasks);
  out.forEach((L, i) => L.forEach((b, k) => (sides[i][k] ? pb : pa).push(b.place)));
  return [avg(pa), avg(pb)];
}

(async () => {
  if (opt('vs-plain', false)) {
    const [a, b] = await duel(G.BOT_P, { ...G.BOT_P, plain: 1 }, LOBBIES, 424242);
    console.log(`擺位看戰力 平均名次 ${a.toFixed(2)}、0.1.71 的擺法 ${b.toFixed(2)}（${LOBBIES} 場，各一半）`);
    PL.close();
    return;
  }
  if (opt('vs-old', false) || opt('vs-rcls', false)) {
    const old = opt('vs-old', false),
      [a, b] = await duel(G.BOT_P, null, LOBBIES, 424242, old ? 'old' : 'rcls');
    console.log(
      `現在的機器人 平均名次 ${a.toFixed(2)}、${old ? '舊買法' : '隨便挑職業'} ${b.toFixed(2)}（${LOBBIES} 場，各一半）`
    );
    PL.close();
    return;
  }

  /* 0.1.79 分主題：從 BOT_P＋這個主題已經有的參數開始（pt：完整參數，遊戲裡不再疊 BOT_PT） */
  const start = THEME ? { ...G.BOT_P, ...(G.BOT_PT[THEME] || {}), pt: 1 } : { ...G.BOT_P };
  let best = { ...start };
  console.log('起點', JSON.stringify(best));
  const t0 = Date.now();
  for (let it = 1; it <= ITERS; it++) {
    const cand = mutate(best, 1000 + it * 31 + SEED),
      [a, b] = await duel(cand, best, LOBBIES, 90000 + it * 1009 + SEED);
    let better = a <= b - 0.08;
    /* 0.1.72 贏了再用另一批場次確認（0.1.60、0.1.72 都是 40 場被運氣騙，換了一堆最後驗證反而比較差）：兩批平均還是好 0.06 以上才換 */
    if (better) {
      const [c, d] = await duel(cand, best, LOBBIES, 190000 + it * 1013 + SEED);
      better = (a + c) / 2 <= (b + d) / 2 - 0.06;
      console.log(`  確認：挑戰者 ${c.toFixed(2)} vs 目前 ${d.toFixed(2)}`);
    }
    console.log(`第 ${it} 輪：挑戰者 ${a.toFixed(2)} vs 目前 ${b.toFixed(2)}${better ? '  → 換成挑戰者' : ''}`);
    if (better) best = cand;
  }
  console.log(`\n${((Date.now() - t0) / 1000).toFixed(0)} 秒；最好的參數：`);
  console.log(JSON.stringify(best, null, 2));
  /* 0.1.43 最後用比較多場（至少 120）驗證；沒有明顯比一開始的好就不寫回（0.1.35 訓練完反而變差，寫回後才發現） */
  const VAL = Math.max(LOBBIES, 120),
    [x, y] = await duel(best, start, VAL, 777),
    won = x <= y - 0.05;
  console.log(`最好的 vs 一開始的（${VAL} 場）：${x.toFixed(2)} vs ${y.toFixed(2)}${won ? '' : '  → 沒有明顯比較好'}`);
  if (WRITE && !won) console.log('不寫回 js/bot.js（加 --force 強制寫回）');
  if (WRITE && (won || opt('force', false)) && THEME) {
    const p = path.join(__dirname, '..', 'js', 'bot.js');
    let s = fs.readFileSync(p, 'utf8');
    const T = { ...G.BOT_PT };
    T[THEME] = Object.fromEntries(Object.entries(best).filter(([k, v]) => k !== 'pt' && G.BOT_P[k] !== v));
    const i = s.indexOf('let BOT_PT = '),
      j = s.indexOf(';\n', i) + 2;
    s = s.slice(0, i) + 'let BOT_PT = ' + JSON.stringify(T) + ';\n' + s.slice(j);
    fs.writeFileSync(p, s);
    console.log(`已寫回 js/bot.js 的 BOT_PT.${THEME}（記得跑 prettier）`);
  } else if (WRITE && (won || opt('force', false))) {
    const p = path.join(__dirname, '..', 'js', 'bot.js');
    let s = fs.readFileSync(p, 'utf8');
    const i = s.indexOf('let BOT_P = {'),
      j = s.indexOf('};', i) + 2;
    const keep = s.slice(i, j);
    /* 保留每行的註解，只換數字 */
    let out = keep;
    for (const [k, v] of Object.entries(best)) out = out.replace(new RegExp(`(\\n\\s*${k}: )[-\\d.e]+`), `$1${v}`);
    s = s.slice(0, i) + out + s.slice(j);
    fs.writeFileSync(p, s);
    console.log('已寫回 js/bot.js 的 BOT_P');
  }
  PL.close();
})();
