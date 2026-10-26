/* 七宗罪羈絆的分配（0.1.96）：每件道具固定一組宗罪（5★ 兩組），照規則自動分配
   node tools/sins.js            印出每組的件數、每個星級、每類武器的分布
   node tools/sins.js --write    寫回 js/items.js 的 SIN_OF 表，並產生 docs/羈絆分配.md
   規則：同一星級、同一類武器（劍、斧…）的宗罪盡量分散；道具本身的特色（吸血 → 暴食、盾 → 傲慢…）加一點偏好；
   新增道具後重跑一次（已經分好的不會變：表裡有的照舊） */
'use strict';
const fs = require('fs'),
  path = require('path'),
  G = require('./game_node.js');
const R = path.join(__dirname, '..'),
  KS = G.SYN.map(x => x.k),
  old = G.SIN_OF || {};
/* 道具的特色 → 偏好的宗罪 */
function aff(i) {
  const s = JSON.stringify(i),
    t = i.tags,
    a = {};
  const add = (k, v) => (a[k] = (a[k] || 0) + v);
  if (t.includes('axe') || t.includes('mace') || t.includes('twohand') || /"stun/.test(s)) add('wrath', 1);
  if (t.includes('pet') || t.includes('staff') || i.nth || i.gear || i.chainAdj) add('sloth', 1);
  if (/"ls"|"regen"|"heal|"hp"/.test(s) || t.includes('potion')) add('glut', 1);
  if (i.block || t.includes('armor') || t.includes('shield') || t.includes('holy')) add('pride', 1);
  if (/coin|gold|"gp"|bribe|merchant/.test(s)) add('greed', 1.5);
  if (t.includes('dark') || t.includes('dagger')) add('envy', 1);
  if (t.includes('poison') || /"weak|"blind|"confuse|chaos|"venom/.test(s)) add('lust', 1);
  return a;
}
const grp = i =>
  i.dmg
    ? ['sword', 'axe', 'mace', 'bow', 'xbow', 'spear', 'dagger', 'staff', 'pet'].find(k => i.tags.includes(k)) || 'w'
    : i.block
      ? 'shield'
      : i.tags[0];
const items = G.ITEMS.filter(i => !i.core).sort((a, b) => b.star - a.star || (a.id < b.id ? -1 : 1));
const cS = {},
  cG = {},
  cA = Object.fromEntries(KS.map(k => [k, 0])),
  out = {};
const inc = (m, k1, k) => ((m[k1] = m[k1] || {}), (m[k1][k] = (m[k1][k] || 0) + 1));
for (const i of items) {
  let pick;
  if (old[i.id]) pick = old[i.id].split(',');
  else {
    const A = aff(i),
      g = grp(i),
      sc = KS.map(k => [
        k,
        (A[k] || 0) * 1.2 - 1.5 * ((cS[i.star] || {})[k] || 0) - 1.2 * ((cG[g] || {})[k] || 0) - cA[k] / 20
      ]).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
    pick = sc.slice(0, i.star === 5 ? 2 : 1).map(x => x[0]);
  }
  out[i.id] = pick.join(',');
  for (const k of pick) inc(cS, i.star, k), inc(cG, grp(i), k), cA[k]++;
}
const NM = Object.fromEntries(G.SYN.map(x => [x.k, x.n]));
console.log('每組件數：', KS.map(k => `${NM[k]} ${cA[k]}`).join('、'));
for (const st of [1, 2, 3, 4, 5]) console.log(`${st}★：`, KS.map(k => `${NM[k]} ${(cS[st] || {})[k] || 0}`).join('、'));
for (const g of Object.keys(cG).sort())
  console.log(
    `${g}：`,
    KS.map(k => `${NM[k]} ${cG[g][k] || 0}`).join('、'),
    ` → ${KS.filter(k => cG[g][k]).length} 組`
  );
if (process.argv.includes('--write')) {
  const p = path.join(R, 'js', 'items.js'),
    src = fs.readFileSync(p, 'utf8'),
    A = '/* SIN_OF 開始（tools/sins.js --write 產生，不要手改） */',
    B = '/* SIN_OF 結束 */',
    body = `const SIN_OF = {\n${Object.keys(out)
      .sort()
      .map(id => `  ${id}: '${out[id]}'`)
      .join(',\n')}\n};`;
  const s2 = src.replace(
    new RegExp(A.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + B.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    `${A}\n${body}\n${B}`
  );
  if (s2 === src && !src.includes(A)) throw new Error('items.js 找不到 SIN_OF 區塊');
  fs.writeFileSync(p, s2);
  const md = [
    '# 羈絆分配（七宗罪）',
    '',
    '`node tools/sins.js --write` 產生。每件道具固定一組宗罪（5★ 兩組）；只有七宗罪賽制有羈絆。',
    '',
    `每組件數：${KS.map(k => `${NM[k]} ${cA[k]}`).join('、')}`,
    '',
    ...KS.flatMap(k => [
      `## ${NM[k]}`,
      '',
      ...[1, 2, 3, 4, 5].map(
        st =>
          `- ${st}★：${
            items
              .filter(i => i.star === st && out[i.id].split(',').includes(k))
              .map(i => i.n)
              .join('、') || '（沒有）'
          }`
      ),
      ''
    ])
  ].join('\n');
  fs.writeFileSync(path.join(R, 'docs', '羈絆分配.md'), md);
  console.log('寫好了：js/items.js 的 SIN_OF、docs/羈絆分配.md');
}
