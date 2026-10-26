/* 巨人國的改造值不值得：每場一半機器人會用工具（縮小藥、巨大藥、鑿子）、一半不用（P.noMod），比平均名次。
   用法：node tools/mod_ab.js [場數 60] [--mode std]；3.5 是平均，越小越好 */
'use strict';
const G = require('./game_node');
const args = process.argv.slice(2),
  N = +args.find(a => /^\d+$/.test(a)) || 60,
  mi = args.indexOf('--mode'),
  mode = mi >= 0 ? args[mi + 1] : 'std';
const S = { use: [0, 0], no: [0, 0], md: {} };
for (let g = 0; g < N; g++) {
  /* 換邊：偶數場前一半用工具、奇數場後一半，抵掉座位的差別 */
  const P = [...Array(G.LOBBY_N).keys()].map(i => ((i < G.LOBBY_N / 2) === (g % 2 === 0) ? G.BOT_P : { ...G.BOT_P, noMod: 1 })),
    L = G.simLobby(424242 + g * 7919, 1300, { short: 1, mode, theme: 'g', P });
  L.forEach((x, i) => {
    const k = P[i].noMod ? 'no' : 'use';
    S[k][0] += x.place;
    S[k][1]++;
    const ks = Object.keys(x.snaps);
    if (k === 'use' && ks.length)
      for (const o of G.unpackBag(x.snaps[ks[ks.length - 1]].bag).items) if (o.md) S.md[o.md] = (S.md[o.md] || 0) + 1;
  });
}
console.log(`${N} 場（${mode}）平均名次：用工具 ${(S.use[0] / S.use[1]).toFixed(2)}、不用 ${(S.no[0] / S.no[1]).toFixed(2)}`);
console.log('用工具的機器人最後背包裡的改造：', S.md);
