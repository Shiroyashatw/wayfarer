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
  [/(?<!開戰)護甲 \+\d{3}/, '三位數的護甲多半是「護盾」'],
  /* 0.1.93 白話、統一 */
  [/每秒扣層數/, '括號用 ailx 的說法：每秒扣「層數」的血'],
  [/命中(燃燒|中毒|劇毒|流血|破甲|撕裂)/, '命中時燃燒 +N 層'],
  [/傷害（固定|（固定傷害）/, 'N 固定傷害（不要括號裡再括號）'],
  [/(?<![\d.])(\d+)～\1 傷害/, '兩個數字一樣只寫一個'],
  [/（暴擊 \d/, '（暴擊率 N%）'],
  [/(燃燒|中毒|劇毒|流血|撕裂|麻痺) \+?\d+(?![\d.%]| 層| 秒)/, '層數寫「N 層」'],
  [/回復 \+?\d+(?![\d.%]| 生命)/, '回復寫「回復 N 生命」'],
  [/羈絆算/, '羈絆：算 N 件…'],
  [/[^：；]每(有|被|佔)[^；]*，這件/, '只加在這件身上：「這件：條件，效果」'],
  [/（[^）]*（/, '括號裡不要再括號']
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
/* 0.1.93 道具以外的說明也照同一套用詞：賽制、塔羅、印記、詛咒祝福、星象、遺物、商人、羈絆、道具池（data.js 的表），
   以及百科、怎麼玩（ui.js 的原始碼一行一行看，只看用詞，不看數字） */
const walk = (x, out, d = 0) => {
  if (d > 4 || x == null) return out;
  if (typeof x === 'string') out.push(x);
  else if (typeof x === 'function' && x.length === 1) {
    try {
      const v = x(3);
      if (typeof v === 'string') out.push(v);
    } catch (e) {}
  } else if (typeof x === 'object') for (const k in x) walk(x[k], out, d + 1);
  return out;
};
for (const T of ['MODES', 'TAROT', 'ZODS', 'VANS', 'CURSES', 'BLESS', 'ASTROS', 'RELICS', 'POOLTH', 'SYN'])
  for (const d of walk(G[T], []))
    if (/[\u4e00-\u9fff]/.test(d)) for (const [re, fix] of BAD) if (re.test(d)) issues.push(['用詞', T, `${d.match(re)[0]} → ${fix}`]);
const WORD = BAD.filter(([re]) => !/\\d/.test(re.source)).concat([[/每秒受「層數/, '每秒扣「層數」的血']]);
const fs = require('fs');
for (const f of ['ui.js'])
  fs.readFileSync(path.join(__dirname, '../../../js', f), 'utf8')
    .split('\n')
    .forEach((ln, i) => {
      if (/^\s*(\/\*|\*|\/\/)/.test(ln)) return;
      for (const [re, fix] of WORD) if (re.test(ln)) issues.push(['用詞', `${f}:${i + 1}`, `${ln.match(re)[0]} → ${fix}`]);
    });
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
