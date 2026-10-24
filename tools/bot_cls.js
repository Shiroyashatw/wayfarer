/* 0.1.72 機器人挑職業的表（js/bot.js 的 BOT_CLS）：菁英機器人對局，每場 6 個職業隨機指定、賽制＋主題照權重抽，
   統計每個職業的平均名次跟全體平均（3.5）差多少，再拆成「職業本身」「這個主題池」「這個賽制」三部分（樣本少的往 0 拉）。
   用法：
     node tools/bot_cls.js                       預設 800 場，只印結果
     node tools/bot_cls.js --lobbies 1200 --write  寫回 js/bot.js 的 BOT_CLS
     --jobs N                                    幾個行程平行跑（預設 CPU 數） */
const fs = require('fs');
const path = require('path');
const G = require('./game_node');
const pool = require('./lobby_pool');

const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf('--' + k);
  return i < 0 ? d : args[i + 1] && !args[i + 1].startsWith('--') ? Number(args[i + 1]) : true;
};
const N = opt('lobbies', 800),
  WRITE = !!opt('write', false),
  JOBS = opt('jobs', require('os').cpus().length),
  /* 收縮：樣本 n 的偏差乘 n / (n + K) */
  K = 25;
const CL = G.CLASSES.map(c => c.id),
  MID = (G.LOBBY_N + 1) / 2;

(async () => {
  const PL = pool(JOBS),
    t0 = Date.now(),
    tasks = [...Array(N).keys()].map(i => {
      const r = G.rng(G.h(31337, i));
      return {
        seed: 500000 + i * 7919,
        rating: G.BOT_RATING,
        opt: { cls: [...Array(G.LOBBY_N)].map(() => CL[Math.floor(r() * CL.length)]), short: 1 }
      };
    });
  const out = (await PL.run(tasks)).flat();
  PL.close();
  console.log(`${N} 場，${((Date.now() - t0) / 1000).toFixed(0)} 秒`);
  const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0),
    shrink = a => (mean(a) * a.length) / (a.length + K),
    T = {};
  for (const c of CL) {
    const mine = out.filter(x => x.cls === c),
      base = shrink(mine.map(x => x.place - MID)),
      part = key => {
        const o = {};
        for (const v of new Set(out.map(x => x[key]))) {
          const d = shrink(mine.filter(x => x[key] === v).map(x => x.place - MID - base));
          if (Math.abs(d) >= 0.02) o[v] = Math.round(d * 100) / 100;
        }
        return o;
      };
    T[c] = [Math.round(base * 100) / 100, part('theme'), part('mode')];
    console.log(
      `${(G.CLSI[c].n + '　　').slice(0, 4)} ${mine.length} 次 平均名次 ${mean(mine.map(x => x.place)).toFixed(2)}  ` +
        `主題 ${JSON.stringify(T[c][1])}  賽制 ${JSON.stringify(T[c][2])}`
    );
  }
  if (WRITE) {
    const p = path.join(__dirname, '..', 'js', 'bot.js');
    let s = fs.readFileSync(p, 'utf8');
    const i = s.indexOf('let BOT_CLS = '),
      j = s.indexOf(';\n', i) + 2;
    s = s.slice(0, i) + 'let BOT_CLS = ' + JSON.stringify(T) + ';\n' + s.slice(j);
    fs.writeFileSync(p, s);
    console.log('已寫回 js/bot.js 的 BOT_CLS（記得跑 prettier）');
  }
})();
