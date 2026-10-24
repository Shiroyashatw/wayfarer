/* 道具池（0.1.62）：印出／寫出每個主題池有哪些道具，並檢查每個主題、每類職業武器的 1～5★ 都有。
   用法：node tools/pools.js           印檢查結果
         node tools/pools.js --write   寫到 docs/道具池.md
   分配表在 js/items.js 的 POOLS（舊道具）與道具的 th（主題專屬的新道具）；規則：
     b 基本池（每局都有）只放功能道具與反制道具（回復、基本防具、抗異常、反制寵物、淨化、金幣）
     武器（含盾、寵物）每件只屬於一個主題；其他道具最多兩個主題
   新增道具時：主題專屬的寫 th，舊道具要換池就改 POOLS，改完跑這個和 node tools/check.js。 */
'use strict';
const fs = require('fs'),
  path = require('path');
const G = require('./game_node');
const GROUPS = {
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
const items = G.ITEMS.filter(i => G.shopOK(i)),
  isW = i => i.dmg || i.block,
  cat = i =>
    i.tags.includes('pet')
      ? '寵物'
      : i.dmg
        ? '武器'
        : i.block
          ? '盾'
          : i.tags.includes('armor')
            ? '防具'
            : i.pot || i.tags.includes('potion')
              ? '藥水'
              : '飾品';
let bad = 0;
const lines = [];
for (const T of G.POOLTH) {
  const miss = [];
  for (const [g, tg] of Object.entries(GROUPS))
    for (let st = 1; st <= 5; st++)
      if (!items.some(i => isW(i) && i.star === st && tg.some(t => i.tags.includes(t)) && G.thOK(T.k, i)))
        miss.push(`${st}★${g}`);
  const n = items.filter(i => G.thOK(T.k, i) && G.thOf(i) !== 'b').length,
    own = items.filter(i => G.thOf(i) === T.k).length;
  lines.push(
    `${miss.length ? '❌' : '✅'} ${T.n}：主題道具 ${n} 件（只在這池 ${own} 件）${miss.length ? '，缺 ' + miss.join(' ') : ''}`
  );
  bad += miss.length;
}
const shared = items.filter(i => isW(i) && G.thOf(i) !== 'b' && G.thOf(i).length > 1),
  baseW = items.filter(i => i.dmg && G.thOf(i) === 'b'),
  wide = items.filter(i => !isW(i) && G.thOf(i).length > 2);
if (shared.length) lines.push(`❌ 兩個主題以上都有的武器：${shared.map(i => i.n).join('、')}`);
if (baseW.length) lines.push(`❌ 基本池裡的武器：${baseW.map(i => i.n).join('、')}`);
if (wide.length) lines.push(`⚠️ 三個主題都有的道具：${wide.map(i => i.n).join('、')}`);
bad += shared.length + baseW.length;
console.log(lines.join('\n'));
if (process.argv.includes('--write')) {
  const list = f => {
    const by = {};
    for (const i of items.filter(f).sort((a, b) => a.star - b.star || a.n.localeCompare(b.n)))
      (by[cat(i)] = by[cat(i)] || []).push(`${i.star}★ ${i.n}${i.th ? '（新）' : ''}`);
    return Object.entries(by)
      .map(([c, l]) => `- **${c}**（${l.length}）：${l.join('、')}`)
      .join('\n');
  };
  let out = `# 道具池\n\n\`node tools/pools.js --write\` 產生（${new Date().toISOString().slice(0, 10)}）。每局 = 基本池 ＋ 開場內圈轉到的一個主題池。武器每件只屬於一個主題；其他道具最多兩個主題；「新」是那個主題專屬的新道具。\n\n${lines.map(l => '- ' + l).join('\n')}\n\n`;
  out += `## 基本池（每局都有）\n\n${list(i => G.thOf(i) === 'b')}\n\n`;
  for (const T of G.POOLTH)
    out += `## ${T.n}\n\n${T.d.join('；')}\n\n${list(i => G.thOf(i) !== 'b' && G.thOK(T.k, i))}\n\n`;
  fs.writeFileSync(path.join(__dirname, '..', 'docs', '道具池.md'), out);
  console.log('寫到 docs/道具池.md');
}
process.exitCode = bad ? 1 : 0;
