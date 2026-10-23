/* 塞令老師 說明文字檢查（skill item-text）：node .claude/skills/item-text/audit.js [關鍵字]
   列出每件道具、核心的說明，找出：同一段重複、同樣加成分開寫、同樣開頭說兩次、錯字（undefined、NaN、+-）、用詞不一致。
   有關鍵字只印名字或說明含關鍵字的那幾件（方便改完看結果）。 */
const path = require('path');
const G = require(path.join(__dirname, '../../../tools/game_node.js'));
const kw = process.argv[2];
const issues = [];
/* 同一段說明裡可以出現兩次的開頭（後面接的是不同結構的句子） */
const OK2 = { 開戰時: 1 };
/* 不要再用的寫法 → 改成 */
const BAD = [
  [/被打中時/, '被攻擊打中時'],
  [/受到的傷害 \+/, '受到的攻擊傷害 +'],
  [/格檔/, '格擋'],
  [/暴集/, '暴擊'],
  [/攻擊速度/, '攻速'],
  [/(?<!開戰)護甲 \+\d{3}/, '三位數的護甲多半是「護盾」']
];
const list = [];
for (const i of G.ITEMS.filter(i => i.core !== 2)) {
  const d = G.itemDesc(i.id);
  list.push([i.id, i.n, d]);
  const seg = d.split(/[；、]/).map(x => x.trim()),
    seen = new Set();
  for (const x of seg) {
    if (x && seen.has(x)) issues.push(['重複片段', i.n, x]);
    seen.add(x);
  }
  const by = {};
  for (const [, t, v] of d.matchAll(/(?:所有|相鄰的|同一排的)([^：；]+)：([^；]+)/g)) (by[v] = by[v] || []).push(t);
  for (const v in by) if (by[v].length > 1) issues.push(['同加成分開寫', i.n, by[v].join('／') + '：' + v]);
  for (const p of ['自己生命低於 50% 時', '開戰時讓敵人', '開戰時', '被攻擊打中時', '命中時', '敵人每有 1 件', '背包裡每有 1 件'])
    if (d.split(p).length > 2 && !OK2[p]) issues.push(['開頭說兩次', i.n, p + ' ×' + (d.split(p).length - 1)]);
  if (/undefined|NaN|\+-|\+ -|\(\)|（）/.test(d)) issues.push(['錯字', i.n, d]);
  for (const [re, fix] of BAD) if (re.test(d)) issues.push(['用詞', i.n, `${d.match(re)[0]} → ${fix}`]);
}
for (const C of G.CLASSES) {
  const d = G.clsDesc(C.id);
  if (/undefined|NaN|\+-/.test(d)) issues.push(['錯字', C.n, d]);
}
if (kw) for (const [id, n, d] of list) if (id.includes(kw) || n.includes(kw) || d.includes(kw)) console.log(`${n}（${id}）\n  ${d}`);
const c = {};
for (const [k] of issues) c[k] = (c[k] || 0) + 1;
console.log(`\n${list.length} 件道具與核心；問題：${JSON.stringify(c)}`);
for (const x of issues) console.log('  ' + x.join(' | '));
process.exitCode = issues.length ? 1 : 0;
