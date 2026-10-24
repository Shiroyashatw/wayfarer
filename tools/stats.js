/* 統計（skill stats）：跑 N 場機器人對局（6 人一場，跟產生種子一樣的規則），一次算出：
     道具：商店出現次數、購買率（出現時被買走）、對口職業購買率（主打它的職業看到時）、持有（最後背包有它）、名次（有它的平均名次）
     職業 × 賽制：平均名次（公平是 3.5，越小越好）
   用法：
     node tools/stats.js                      120 場、分數 1300、4 個行程平行跑，印報告
     node tools/stats.js 240 --jobs 4 --write 寫到 docs/道具統計.md
     node tools/stats.js --mode curse         只跑某個賽制（預設每場照權重抽）
     node tools/stats.js --item prism,anvil   只印這幾件（代號或名字）
     node tools/stats.js --save 前.json       存原始數字；改完數值後 --diff 前.json 看每件購買率變多少
   一場約 4 秒（4 核心平行約 1 秒）。同一組種子（--seed）每次結果一樣，改數值前後比較才公平。 */
'use strict';
const fs = require('fs'),
  path = require('path'),
  { fork } = require('child_process');
const args = process.argv.slice(2),
  opt = (k, d) => {
    const i = args.indexOf('--' + k);
    return i < 0 ? d : args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
  },
  N = +args.find(a => /^\d+$/.test(a)) || 120,
  RT = +opt('rating', 1300),
  JOBS = Math.max(1, +opt('jobs', 4)),
  MODE = opt('mode', null),
  SEED = +opt('seed', 515100),
  MIN = 30;

/* ---------- 一個行程：跑 [a, b) 這幾場，回傳原始數字 ---------- */
function work(a, b) {
  const G = require('./game_node'),
    ctx = G.__ctx,
    K = {},
    CM = {},
    k = id => (K[id] = K[id] || { offer: 0, buy: 0, hold: 0, ps: 0, pn: 0, mo: 0, mb: 0 });
  /* 主打這件的職業（道具的 for 是職業的主題或加成標籤，例如符文法珠 for staff） */
  const mine = (run, id) => {
    const f = G.ITEMI[id].for,
      C = G.CLSI[run.bag.cls];
    return !!f && !!C && (C.th === f || (C.m || []).some(x => x.tag === f));
  };
  /* 包住 rollShop、buyItem（遊戲裡的呼叫都經過這兩個全域函式） */
  const rollShop0 = ctx.rollShop,
    buyItem0 = ctx.buyItem;
  ctx.rollShop = function (run, ...r) {
    const v = rollShop0.call(this, run, ...r);
    for (const s of run.shop) if (s) k(s.id).offer++, mine(run, s.id) && k(s.id).mo++;
    return v;
  };
  ctx.buyItem = function (run, i, ...r) {
    const s = run.shop[i],
      v = buyItem0.call(this, run, i, ...r);
    if (s && typeof v !== 'string') k(s.id).buy++, mine(run, s.id) && k(s.id).mb++;
    return v;
  };
  let bots = 0;
  for (let g = a; g < b; g++) {
    const seed = SEED + g * 7919,
      mode = MODE || G.rollMode(G.rng(G.h(seed, 6))),
      L = G.simLobby(seed, RT, { short: 1, mode });
    for (const x of L) {
      const ids = Object.keys(x.snaps);
      if (!ids.length) continue;
      bots++;
      const c = (x.stat && x.stat.cls) || 'none',
        cm = (CM[c + '|' + mode] = CM[c + '|' + mode] || [0, 0]);
      cm[0] += x.place;
      cm[1]++;
      for (const id of new Set(x.snaps[ids[ids.length - 1]].bag.it.map(q => q[0]))) {
        k(id).hold++;
        k(id).ps += x.place;
        k(id).pn++;
      }
    }
  }
  return { K, CM, bots, n: b - a };
}
if (process.env.STATS_WORKER) {
  const [a, b] = process.env.STATS_WORKER.split(':').map(Number);
  process.send(work(a, b));
  return;
}

/* ---------- 主行程：分給 JOBS 個行程，合併 ---------- */
async function main() {
  const t0 = Date.now(),
    per = Math.ceil(N / JOBS),
    parts = await Promise.all(
      [...Array(JOBS).keys()]
        .map(j => [j * per, Math.min(N, (j + 1) * per)])
        .filter(([a, b]) => b > a)
        .map(
          ([a, b]) =>
            new Promise((res, rej) => {
              const c = fork(__filename, args, { env: { ...process.env, STATS_WORKER: `${a}:${b}` } });
              c.on('message', res);
              c.on('exit', code => code && rej(new Error('行程結束碼 ' + code)));
            })
        )
    );
  const R = { K: {}, CM: {}, bots: 0, n: 0, rating: RT, mode: MODE, seed: SEED };
  for (const p of parts) {
    R.bots += p.bots;
    R.n += p.n;
    for (const id in p.K) {
      const x = (R.K[id] = R.K[id] || { offer: 0, buy: 0, hold: 0, ps: 0, pn: 0, mo: 0, mb: 0 });
      for (const f in x) x[f] += p.K[id][f];
    }
    for (const key in p.CM) {
      const x = (R.CM[key] = R.CM[key] || [0, 0]);
      x[0] += p.CM[key][0];
      x[1] += p.CM[key][1];
    }
  }
  const save = opt('save', null);
  if (save) fs.writeFileSync(save, JSON.stringify(R));
  const G = require('./game_node'),
    out = report(G, R, opt('diff', null) ? JSON.parse(fs.readFileSync(opt('diff'), 'utf8')) : null);
  if (opt('write', false)) {
    fs.writeFileSync(path.join(__dirname, '..', 'docs', '道具統計.md'), out);
    console.log('寫到 docs/道具統計.md');
  } else console.log(out);
  console.error(`完成：${R.n} 場、${R.bots} 個機器人、${((Date.now() - t0) / 1000) | 0} 秒`);
}

const CAT = it =>
  it.tags.includes('pet')
    ? '寵物'
    : it.dmg
      ? '武器'
      : it.block
        ? '盾'
        : it.tags.includes('armor')
          ? '防具'
          : it.pot || it.tags.includes('potion')
            ? '藥水'
            : '飾品';
const pct = v => (v == null || isNaN(v) ? '' : (v * 100).toFixed(1) + '%');
function rowsOf(G, R) {
  const rows = G.ITEMS.filter(it => G.shopOK(it)).map(it => {
    const x = R.K[it.id] || { offer: 0, buy: 0, hold: 0, ps: 0, pn: 0, mo: 0, mb: 0 };
    return {
      id: it.id,
      n: it.n,
      star: it.star,
      cat: CAT(it),
      offer: x.offer,
      rate: x.offer ? x.buy / x.offer : 0,
      mrate: x.mo >= 10 ? x.mb / x.mo : null,
      hold: R.bots ? x.hold / R.bots : 0,
      place: x.pn ? x.ps / x.pn : NaN
    };
  });
  /* 同星級同類別比：購買率不到那組中位數一半是冷門、1.6 倍以上是熱門 */
  const grp = {};
  for (const r of rows) (grp[r.star + r.cat] = grp[r.star + r.cat] || []).push(r.rate);
  for (const r of rows) {
    const s = grp[r.star + r.cat].sort((a, b) => a - b),
      m = s[Math.floor(s.length / 2)];
    r.flag = r.offer < MIN ? '樣本少' : r.rate < m * 0.5 ? '冷門' : r.rate > m * 1.6 && r.rate > 0.1 ? '熱門' : '';
  }
  return rows;
}
function report(G, R, D) {
  const rows = rowsOf(G, R),
    old = D ? Object.fromEntries(rowsOf(G, D).map(r => [r.id, r])) : null,
    dlt = r => {
      if (!old || !old[r.id]) return '';
      const d = (r.rate - old[r.id].rate) * 100;
      return `${d >= 0 ? '+' : ''}${d.toFixed(1)}`;
    },
    only = opt('item', null),
    pick = only ? String(only).split(',') : null,
    sel = pick ? rows.filter(r => pick.includes(r.id) || pick.includes(r.n)) : rows;
  let out = `# 道具統計\n\n機器人對局 ${R.n} 場（${R.bots} 個機器人、分數 ${R.rating}、${R.mode ? `只有賽制 ${R.mode}` : '每場照權重抽賽制'}、種子 ${R.seed}），${new Date().toISOString().slice(0, 10)}。用 \`node tools/stats.js\` 產生（skill \`stats\`）。\n\n`;
  out += `- 購買率：商店出現時被買走的比例；對口職業：主打這件的職業（道具的 \`for\`）看到時買走的比例\n- 持有：最後背包裡有它的比例；名次：有它的平均名次（3.5 是平均，越小越好）\n- 冷門／熱門：跟同星級、同類別的中位數比（不到一半／1.6 倍以上）${old ? '\n- 變化：購買率跟 --diff 那份比（百分點）' : ''}\n\n`;
  const head = `| 道具 | 類別 | 出現 | 購買率 | 對口職業 | 持有 | 名次 | |${old ? ' 變化 |' : ''}\n| --- | --- | --- | --- | --- | --- | --- | --- |${old ? ' --- |' : ''}\n`,
    line = r =>
      `| ${r.n} | ${r.cat} | ${r.offer} | ${pct(r.rate)} | ${pct(r.mrate)} | ${pct(r.hold)} | ${isNaN(r.place) ? '—' : r.place.toFixed(2)} | ${r.flag} |${old ? ` ${dlt(r)} |` : ''}\n`;
  if (pick) return out + head + sel.map(line).join('');
  for (let st = 1; st <= 5; st++)
    out += `## ${st}★\n\n${head}${sel
      .filter(r => r.star === st)
      .sort((a, b) => a.cat.localeCompare(b.cat) || b.rate - a.rate)
      .map(line)
      .join('')}\n`;
  const cold = rows.filter(r => r.flag === '冷門').sort((a, b) => a.rate - b.rate);
  out += `## 冷門\n\n${cold.map(r => `- ${r.star}★ ${r.n}（${r.cat}）：購買率 ${pct(r.rate)}${r.mrate == null ? '' : `（對口職業 ${pct(r.mrate)}）`}、持有 ${pct(r.hold)}`).join('\n') || '沒有'}\n\n`;
  /* 職業 × 賽制的平均名次 */
  const modes = [...new Set(Object.keys(R.CM).map(k => k.split('|')[1]))],
    cls = G.CLASSES.map(c => c.id),
    cell = (c, m) => {
      const v = R.CM[c + '|' + m];
      return v && v[1] >= 6 ? (v[0] / v[1]).toFixed(2) : '';
    },
    tot = c => {
      let s = 0,
        n = 0;
      for (const m of modes) if (R.CM[c + '|' + m]) (s += R.CM[c + '|' + m][0]), (n += R.CM[c + '|' + m][1]);
      return n ? `${(s / n).toFixed(2)}（${n}）` : '';
    };
  out += `## 職業 × 賽制（平均名次，3.5 是平均；樣本不到 6 不顯示）\n\n| 職業 | 全部 | ${modes.map(m => (G.MODEI[m] || { n: m }).n).join(' | ')} |\n| --- | --- |${modes.map(() => ' --- |').join('')}\n`;
  for (const c of cls) out += `| ${G.CLSI[c].n} | ${tot(c)} | ${modes.map(m => cell(c, m)).join(' | ')} |\n`;
  return out;
}
main().catch(e => {
  console.error(e);
  process.exit(1);
});
