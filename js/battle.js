/* 漫步勇者 · 戰鬥：背景、邏輯、繪製 */
'use strict';
/* ================= battle: painted backgrounds ================= */
const bbg = $('bbg'),
  bfx = $('bfx'),
  bctx = bfx.getContext('2d');
let BW = 360,
  BH = 480,
  DPR = 1;
function sizeBattle() {
  const r = $('bview').getBoundingClientRect();
  DPR = Math.min(2, window.devicePixelRatio || 1);
  /* 0.3.36 畫面還沒排版好（寬高 0，例如分頁在背景）時用預設大小，免得 paintBG 的迴圈步長變 0 卡死 */
  BW = r.width || 360;
  BH = r.height || 480;
  for (const c of [bbg, bfx]) {
    c.width = Math.round(BW * DPR);
    c.height = Math.round(BH * DPR);
  }
}
function blob(x, cx, cy, r, col) {
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, col);
  g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
  x.fillStyle = g;
  x.fillRect(cx - r, cy - r, r * 2, r * 2);
}
function paintBG(kind) {
  const x = bbg.getContext('2d'),
    W = bbg.width,
    H = bbg.height,
    r = rng(h(fl(S.lat * 1e3), fl(S.lng * 1e3), kind.length)),
    HZ = H * 0.6;
  x.save();
  const hr = new Date(now()).getHours(),
    night = hr < 6 || hr >= 19,
    dusk = !night && hr >= 16;
  const soft = (px, fn) => {
    x.save();
    if ('filter' in x) x.filter = `blur(${px * DPR}px)`;
    fn();
    x.restore();
  };
  const pal = {
    forest: {
      sky: ['#e9f0c8', '#9cc27a'],
      far: '#6f9a5c',
      mid: '#3f6e36',
      near: '#264a22',
      ground: ['#9a9a3a', '#6d7a28'],
      fog: 'rgba(240,245,200,.55)'
    },
    meadow: {
      sky: ['#bfe3f2', '#e8f2d0'],
      far: '#8fb7a0',
      mid: '#6fa155',
      near: '#4f8a3c',
      ground: ['#a7c766', '#7aa548'],
      fog: 'rgba(255,255,240,.45)'
    },
    city: {
      sky: ['#3a3f7a', '#d99a7a'],
      far: '#5b5f8e',
      mid: '#3c3f66',
      near: '#25263f',
      ground: ['#5a5560', '#3e3a44'],
      fog: 'rgba(255,200,170,.3)'
    },
    mountain: {
      sky: ['#a9c3e0', '#eef2f6'],
      far: '#9aa9c0',
      mid: '#7a8a8f',
      near: '#5c6a60',
      ground: ['#8e9c70', '#6c7a52'],
      fog: 'rgba(255,255,255,.55)'
    },
    cave: {
      sky: ['#140f1a', '#2a2030'],
      far: '#2a2232',
      mid: '#1f1926',
      near: '#120e17',
      ground: ['#3a3242', '#241e2a'],
      fog: 'rgba(255,150,80,.18)'
    }
  }[kind];
  if (night && kind !== 'cave') {
    pal.sky = ['#0b1030', '#2e3570'];
    pal.fog = 'rgba(150,180,255,.2)';
  } else if (dusk && kind !== 'cave' && kind !== 'city') {
    pal.sky = ['#f2b77a', '#f6e1b0'];
  }
  let g = x.createLinearGradient(0, 0, 0, HZ);
  g.addColorStop(0, pal.sky[0]);
  g.addColorStop(1, pal.sky[1]);
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  blob(x, W * 0.6, H * 0.22, W * 0.6, night ? 'rgba(160,180,255,.25)' : 'rgba(255,250,220,.7)');
  const trees = (col, base, n, size, blur) =>
    soft(blur, () => {
      x.fillStyle = col;
      for (let i = 0; i < n; i++) {
        const cx = r() * W,
          cy = base - r() * size * 0.6,
          rr = size * (0.5 + r() * 0.6);
        x.beginPath();
        x.ellipse(cx, cy, rr * 1.1, rr, 0, 0, 6.28);
        x.fill();
        x.fillRect(cx - rr * 0.08, cy, rr * 0.16, base - cy + size * 0.5);
      }
      x.fillRect(0, base, W, H - base);
    });
  const ridge = (col, base, amp, blur, snow) =>
    soft(blur, () => {
      x.fillStyle = col;
      x.beginPath();
      x.moveTo(0, H);
      let y = base;
      for (let i = 0; i <= W; i += Math.max(1, W / 14)) {
        y = base - amp * (0.4 + r() * 0.6);
        x.lineTo(i, y);
      }
      x.lineTo(W, H);
      x.fill();
      if (snow) {
        x.fillStyle = 'rgba(255,255,255,.8)';
        for (let i = 0; i < 6; i++) {
          const cx = r() * W,
            cy = base - amp * 0.9;
          x.beginPath();
          x.moveTo(cx - 20 * DPR, cy + 16 * DPR);
          x.lineTo(cx, cy - 4 * DPR);
          x.lineTo(cx + 20 * DPR, cy + 16 * DPR);
          x.fill();
        }
      }
    });
  const skyline = (col, base, lit, blur) =>
    soft(blur, () => {
      for (let i = 0; i < W; ) {
        const w = (16 + r() * 30) * DPR,
          hh = (40 + r() * 140) * DPR;
        x.fillStyle = col;
        x.fillRect(i, base - hh, w, hh + H);
        if (lit) {
          x.fillStyle = 'rgba(255,215,130,.85)';
          for (let wy = base - hh + 6 * DPR; wy < base - 4 * DPR; wy += 8 * DPR)
            for (let wx = i + 4 * DPR; wx < i + w - 4 * DPR; wx += 7 * DPR)
              if (r() < 0.4) x.fillRect(wx, wy, 3 * DPR, 4 * DPR);
        }
        i += w + r() * 6 * DPR;
      }
    });
  if (kind === 'forest') {
    trees(pal.far, HZ * 0.72, 26, W * 0.09, 6);
    blob(x, W * 0.5, HZ * 0.6, W * 0.5, pal.fog);
    trees(pal.mid, HZ * 0.88, 16, W * 0.13, 2.5);
  } else if (kind === 'meadow') {
    ridge(pal.far, HZ * 0.8, H * 0.12, 5);
    blob(x, W * 0.5, HZ * 0.75, W * 0.6, pal.fog);
    trees(pal.mid, HZ * 0.95, 9, W * 0.08, 2);
  } else if (kind === 'city') {
    skyline(pal.far, HZ * 0.9, true, 4);
    blob(x, W * 0.5, HZ * 0.8, W * 0.7, pal.fog);
    skyline(pal.mid, HZ, night || dusk, 1.5);
  } else if (kind === 'mountain') {
    ridge(pal.far, HZ * 0.62, H * 0.22, 4, true);
    blob(x, W * 0.5, HZ * 0.7, W * 0.7, pal.fog);
    ridge(pal.mid, HZ * 0.9, H * 0.1, 2);
  } else {
    soft(3, () => {
      x.fillStyle = pal.far;
      for (let i = 0; i < W; i += 18 * DPR) {
        x.beginPath();
        x.moveTo(i, 0);
        x.lineTo(i + 9 * DPR, (40 + r() * 90) * DPR);
        x.lineTo(i + 18 * DPR, 0);
        x.fill();
      }
    });
  }
  g = x.createLinearGradient(0, HZ, 0, H);
  g.addColorStop(0, pal.ground[0]);
  g.addColorStop(1, pal.ground[1]);
  x.fillStyle = g;
  x.beginPath();
  x.moveTo(0, HZ);
  for (let i = 0; i <= W; i += Math.max(1, W / 10)) x.lineTo(i, HZ + (r() - 0.5) * 14 * DPR);
  x.lineTo(W, H);
  x.lineTo(0, H);
  x.fill();
  soft(1.5, () => {
    for (let i = 0; i < 140; i++) {
      const yy = HZ + Math.pow(r(), 1.4) * (H - HZ),
        s = (yy - HZ) / (H - HZ);
      x.fillStyle = `rgba(${kind === 'cave' ? '90,80,100' : kind === 'city' ? '120,115,125' : '60,90,30'},${0.25 + r() * 0.3})`;
      x.beginPath();
      x.ellipse(r() * W, yy, (8 + r() * 30) * DPR * s + 2, (2 + r() * 5) * DPR * s + 1, 0, 0, 6.28);
      x.fill();
    }
  });
  blob(x, W * 0.5, HZ + (H - HZ) * 0.45, W * 0.55, kind === 'cave' ? 'rgba(255,170,90,.15)' : 'rgba(255,250,210,.22)');
  if (kind === 'forest' || kind === 'meadow') {
    soft(5, () => {
      x.fillStyle = pal.near;
      x.beginPath();
      x.ellipse(-W * 0.05, H * 0.05, W * 0.3, H * 0.3, 0, 0, 6.28);
      x.fill();
      x.beginPath();
      x.ellipse(W * 1.05, H * 0.08, W * 0.28, H * 0.28, 0, 0, 6.28);
      x.fill();
      x.beginPath();
      x.ellipse(W * 0.1, H * 1.02, W * 0.35, H * 0.1, 0, 0, 6.28);
      x.fill();
      x.beginPath();
      x.ellipse(W * 0.95, H * 1.02, W * 0.35, H * 0.1, 0, 0, 6.28);
      x.fill();
    });
  }
  if (kind === 'cave') {
    [
      [0.12, 0.35],
      [0.88, 0.35]
    ].forEach(([a, b]) => {
      blob(x, W * a, H * b, W * 0.3, 'rgba(255,150,60,.45)');
      x.fillStyle = '#5a3a20';
      x.fillRect(W * a - 3 * DPR, H * b, 6 * DPR, 24 * DPR);
      x.fillStyle = '#ffc46a';
      x.fillRect(W * a - 5 * DPR, H * b - 10 * DPR, 10 * DPR, 11 * DPR);
    });
  }
  const vg = x.createRadialGradient(W / 2, H * 0.55, H * 0.3, W / 2, H * 0.55, H * 0.95);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,.45)');
  x.fillStyle = vg;
  x.fillRect(0, 0, W, H);
  x.restore();
}

/* ================= battle: logic ================= */
const BFX = { pops: [], fx: [], shake: 0, hero: { a: null }, en: [], t0: 0, motes: [] };
/* 戰鬥站位：y 是怪物腳下，hy 是玩家腳下（比怪物低一點） */
const POS = () => {
  const y = Math.min(BH * 0.6, BH - 118);
  return { hx: BW * 0.27, ex: BW * 0.7, y, hy: Math.min(y + 22, BH - 128) };
};
/* 敵人站位（0.3）：依數量排成前後兩排，[x 比例, 往下的位移]；首領固定第 0 格、放大 */
const ESLOT = {
  1: [[0.7, 0]],
  2: [
    [0.6, 26],
    [0.84, -24]
  ],
  3: [
    [0.72, -10],
    [0.56, 42],
    [0.88, 40]
  ],
  4: [
    [0.6, -44],
    [0.85, -46],
    [0.57, 40],
    [0.84, 44]
  ],
  5: [
    [0.72, -2],
    [0.58, -54],
    [0.87, -56],
    [0.56, 48],
    [0.87, 50]
  ]
};
const battleSc = () => Math.max(3, Math.min(6, Math.round(BW / 90)));
/* 第 i 隻敵人的位置與大小（es 是敵人陣列，boss 時第 0 隻放大） */
function epos(i, es, boss) {
  const n = es.length,
    s = (ESLOT[n] || ESLOT[5])[i] || [0.7, 0],
    p = POS(),
    sc = battleSc(),
    solo = boss && i === 0 && n === 1;
  return {
    /* 首領單獨一隻時：右半邊、垂直置中（頂部血條約 85px 到行動順序約 BH-55 的中間，腳底再往下半個身高） */
    x: BW * (solo ? 0.72 : s[0]),
    y: solo ? (BH + 30) / 2 + 10 * (sc + 2) : p.y + s[1] * Math.min(1, BH / 560),
    s: boss && i === 0 ? sc + 2 : n <= 2 ? sc + 1 : n === 3 ? sc : Math.max(2, sc - 1)
  };
}
/* 怪物頭頂（名字放在這裡） */
const etop = q => q.y - 16 * q.s - 8;
function placeBName(q) {
  const el = $('bname');
  el.style.left = q.x + 'px';
  el.style.top = etop(q) + 'px';
}
/* 異常狀態圖示：o 是有狀態回合數的物件（敵人或隊員），keys 選要顯示哪些 */
const AIL_E = [
    ['burn', 'flame', '燃燒'],
    ['frozen', 'ice', '凍結'],
    ['shock', 'bolt', '感電'],
    ['poison', 'leaf', '中毒'],
    ['bleed', 'heart', '流血'],
    ['stun', 'star', '暈眩'],
    ['curse', 'eye', '詛咒'],
    ['mark', 'arrow', '標記'],
    ['slow', 'wind', '衰老'],
    ['vul', 'shield', '易傷'],
    ['dmark', 'skull', '死亡印記']
  ],
  AIL_H = [
    ['frozen', 'ice', '凍結'],
    ['guard', 'shield', '防禦'],
    ['stacks', 'star', '疊層'],
    ['shield', 'heart', '護盾'],
    ['chgN', 'bolt', '蓄力'],
    ['doom', 'skull', '生死簿'],
    ['empN', 'horn', '強化'],
    ['comboN', 'sword', '連續']
  ];
/* 圖示右下的數字：中毒、流血顯示層數；0.3.35 有時間的狀態顯示剩下幾秒（AIL_T），其他是次數 */
const AIL_NUM = { poison: 'poisonN', bleed: 'bleedN' },
  AIL_T = new Set(['burn', 'shock', 'curse', 'slow', 'vul', 'dmark', 'guard']);
/* 剩下 n 跳 → 大約剩幾秒（扣掉這一跳已經過的時間） */
const tLeft = n =>
  Math.max(1, Math.ceil(n * TURN_S - ((B && B.tick) || (typeof MB !== 'undefined' && MB && MB.tick) || 0)));
const ailHTML = (o, keys) =>
  keys
    .filter(([k]) => o && o[k] > 0)
    .map(
      ([k, ic, n]) =>
        `<span class="ail ail-${ic}" title="${n}"><img src="${iconURL(ic)}" alt="${n}">${(() => {
          if (AIL_T.has(k)) return `<b>${tLeft(o[k])}</b>`;
          const v = AIL_NUM[k] ? o[AIL_NUM[k]] : o[k];
          return v > 1 && k !== 'shield' && k !== 'chgN' && k !== 'mark' ? `<b>${v}</b>` : '';
        })()}</span>`
    )
    .join('');
/* 0.3.19 自己身上的狀態＋增益（增益顯示剩下幾秒） */
const heroAilHTML = o =>
  ailHTML(o, AIL_H) +
  /* 0.3.22 圖騰（剩下的生命 %）、砲台（剩下幾秒）、陷阱、地雷（數量） */
  ((o && o.units) || [])
    .map(
      u =>
        `<span class="ail ail-shield" title="${u.n}"><img src="${unitIcon(u, u.kind === 'totem' ? 'rune' : 'xbow')}" alt="${u.n}"><b>${u.kind === 'totem' ? Math.ceil((u.hp / u.maxhp) * 100) + '%' : tLeft(u.turns)}</b></span>`
    )
    .join('') +
  (o && o.traps && o.traps.length
    ? `<span class="ail ail-ice" title="陷阱"><img src="${unitIcon(o.traps[0], 'eye')}" alt="陷阱"><b>${o.traps.length}</b></span>`
    : '') +
  (o && o.pdot
    ? `<span class="ail ail-leaf" title="中毒"><img src="${iconURL('leaf')}" alt="中毒"><b>${tLeft(o.pdot.turns)}</b></span>`
    : '') +
  (o && o.mines && o.mines.length
    ? `<span class="ail ail-flame" title="地雷"><img src="${unitIcon(o.mines[0], 'flame')}" alt="地雷"><b>${o.mines.length}</b></span>`
    : '') +
  ((o && o.buffs) || [])
    .map(
      b =>
        `<span class="ail ${b.bad ? 'ail-skull' : 'ail-shield'}" title="${b.n || ''}"><img src="${iconURL(b.bad ? 'skull' : b.cry ? 'horn' : 'star')}" alt="${b.n || ''}"><b>${b.turns >= 99 ? '' : tLeft(b.turns)}</b></span>`
    )
    .join('');
function placeAil(id, x, y, html) {
  const el = $(id);
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.innerHTML = html;
}
/* 頭目（地城首領、看門人、紅名危險怪）：名字與血條放到畫面最上方 */
function bossBar(e, boss) {
  const on = !!e && (boss || (e.rar || 0) >= 3),
    el = $('bboss');
  el.hidden = !on;
  $('bview').classList.toggle('bossmode', on);
  if (!on) return false;
  el.innerHTML = `<div class="bbname" style="color:${RCOL[e.rar || 3]}">${esc(e.name)} <small>Lv${e.lv}${e.mods && e.mods.length ? '・' + modNames(e) : ''}</small></div><div class="bbar"><i style="width:${Math.max(0, (e.hp / e.maxhp) * 100)}%"></i><span>${Math.max(0, Math.ceil(e.hp)).toLocaleString()} / ${e.maxhp.toLocaleString()}</span></div>${avBar('e' + (B ? B.es : MB ? MB.es : []).indexOf(e))}`;
  return true;
}
/* 0.3.35 行動條（每幀由 atbPaint 更新寬度）；cd 遮罩在技能按鈕上 */
const avBar = id => `<i class="avb" data-av="${id}"><i></i></i>`;
const cdMask = q => (q ? `<i class="cdm" data-cdk="${skKey(q)}"></i>` : '');
/* 0.3.44 戰鬥中喝藥水：不用掉行動，但同一種藥水要冷卻 POT_CD 秒（冷卻放在 me.cd['pot_potions'／'pot_ethers']，遮罩共用 cdMask） */
const POT_CD = 10;
const potKey = k => 'pot_' + (k === 'potion' || k === 'potions' ? 'potions' : 'ethers');
const potMask = k => `<i class="cdm" data-cdk="${potKey(k)}"></i>`;
const potLeft = (me, k) => (me && me.cd && me.cd[potKey(k)]) || 0;
function potStart(me, k) {
  (me.cd = me.cd || {})[potKey(k)] = POT_CD;
  (me.cdMax = me.cdMax || {})[potKey(k)] = POT_CD;
}
/* 每幀更新：行動條寬度、滿了發亮；技能冷卻遮罩的高度與剩下秒數（單人與組隊共用） */
function atbPaint(av, me) {
  for (const el of document.querySelectorAll('#battle [data-av]')) {
    const w = Math.min(100, ((av[el.dataset.av] || 0) / AV_MAX) * 100);
    el.firstChild.style.width = w + '%';
    el.classList.toggle('full', w >= 100);
  }
  for (const el of document.querySelectorAll('#battle [data-cdk]')) {
    const k = el.dataset.cdk,
      left = (me && me.cd && me.cd[k]) || 0,
      max = (me && me.cdMax && me.cdMax[k]) || 1;
    el.style.height = left > 0 ? Math.min(100, (left / max) * 100) + '%' : '0';
    el.textContent = left > 0 ? Math.ceil(left) : '';
  }
}
/* 每隻敵人腳下的小血條與異常狀態；目前目標加框 */
function enemyBars(es, ti, boss) {
  return es
    .map((e, i) => {
      if (e.hp <= 0 || (boss && i === 0)) return '';
      const q = epos(i, es, boss);
      return `<div class="ebar${i === ti ? ' tg' : ''}" style="left:${q.x}px;top:${q.y + 6}px"><i class="hb hhp"><i style="width:${Math.max(0, (e.hp / e.maxhp) * 100)}%"></i><em>${Math.max(0, Math.ceil(e.hp)).toLocaleString()}</em></i>${avBar('e' + i)}<span class="eails">${ailHTML(e, AIL_E)}</span></div>`;
    })
    .join('');
}
/* 左上角層數（不在地城就隱藏） */
function setFloor(t) {
  $('bfloor').textContent = t;
  $('bfloor').hidden = !t;
}
/* 小頭像：用像素圖轉成圖片，快取起來 */
const PORT = new Map();
function portrait(spr, pal) {
  const k = spr + JSON.stringify(pal);
  if (!PORT.has(k)) {
    const sp = sprite(spr, pal);
    if (sp.pending) return sp.toDataURL();
    PORT.set(k, sp.toDataURL());
  }
  return PORT.get(k);
}
/* 行動順序（戰鬥畫面底部橫列）：list 是 [{n, c, on, dead, img}]，c 是 'me'／'e'／''；{h} 是分隔（下一輪） */
/* 0.3.31 行動順序列的名字用怪物本名（不含稀有詞綴前綴），完整名字在怪物頭上 */
const shortName = e => e.bn || (e.base && e.base.name) || e.name;
function renderOrder(list) {
  $('border').innerHTML = list
    .map(q =>
      q.h
        ? `<span class="bo-sep">${q.h}</span>`
        : `<div class="bo${q.c ? ' bo-' + q.c : ''}${q.on ? ' on' : ''}${q.dead ? ' dead' : ''}"><img src="${q.img}" alt=""><span>${esc(q.n)}</span></div>`
    )
    .join('');
}
function bmsg(t, lg) {
  blog(lg || t, 'msg');
  const el = $('bmsg');
  el.textContent = t;
  el.style.opacity = 1;
  clearTimeout(bmsg.t);
  bmsg.t = setTimeout(() => (el.style.opacity = 0), 1300);
}
/* 0.3.27 戰鬥紀錄：訊息、傷害、狀態各記一行（最多 80 行），右上角「狀態」面板的「紀錄」分頁看 */
let BLOG = [],
  BINFO = 'st';
function blog(s, c) {
  if (!s) return;
  BLOG.push({ s, c });
  if (BLOG.length > 80) BLOG.shift();
  if (!$('binfo').hidden && BINFO === 'log') binfoRender();
}
/* 把一個結算事件寫進紀錄；nm(uid) 回傳隊員名字（單人是「你」） */
function logEv(f, es, nm) {
  const en = f.i != null && es[f.i] ? es[f.i].name : '';
  if (f.t === 'hit')
    blog(`${en} 受到 ${f.d}${f.crit ? '（暴擊）' : ''}${f.dot ? '（持續傷害）' : f.pet ? '（召喚物）' : ''}`, 'hit');
  else if (f.t === 'kill') blog(`${en} 倒下了`, 'kill');
  else if (f.t === 'st') blog(`${f.i != null ? en : nm(f.who)}：${f.s}`, 'st');
  else if (f.t === 'dmg') blog(`${nm(f.who)}受到 ${f.d} 傷害`, 'dmg');
  else if (f.t === 'heal') blog(`${nm(f.who)}回復 ${f.v} 生命`, 'heal');
  else if (f.t === 'dodge') blog(`${nm(f.who)}閃過了攻擊`, 'st');
}
/* 0.3.27 狀態面板：自己與每隻敵人身上的增益、異常、詞綴與特色，都寫成文字 */
const BUFFK = {
    more: v => `傷害 ${v > 0 ? '+' : ''}${v}%`,
    dodge: v => `閃避 +${v}%`,
    arm: v => `護甲 ${v > 0 ? '+' : ''}${v}%`,
    dmgRed: v => `受到傷害 -${v}%`,
    crit: v => `暴擊率 +${v}%`,
    spd: v => `速度 +${v}%`,
    taunt: v => `嘲諷 +${v}%`,
    hot: v => `每 3 秒回復 ${v}% 生命`,
    shield: v => `護盾 ${Math.round(v * 100)}% 生命`
  },
  AILD = {
    burn: '每 3 秒受到火焰傷害',
    frozen: '跳過下一次行動',
    shock: '受到的傷害提高',
    poison: '每 3 秒受到傷害（層數越多越痛）',
    bleed: '每 3 秒受到傷害（層數越多越痛）',
    stun: '跳過下一次行動',
    curse: '受到的傷害提高、攻擊降低',
    mark: '受到的傷害提高',
    slow: '速度變慢',
    vul: '受到的傷害提高',
    dmark: '受到的傷害提高，打倒時有額外效果',
    guard: '受到的傷害減半',
    stacks: '技能的疊層',
    shield: '先扣護盾再扣生命',
    chgN: '蓄力中，放出時傷害提高',
    doom: '生死簿：歸零時受到大量傷害',
    empN: '接下來的技能傷害提高',
    comboN: '連續使用同一招，傷害越來越高'
  };
function binfoAil(o, keys) {
  return keys
    .filter(([k]) => o && o[k] > 0)
    .map(([k, ic, n]) => {
      const v = AIL_NUM[k]
        ? o[AIL_NUM[k]] + ' 層'
        : AIL_T.has(k)
          ? '剩 ' + tLeft(o[k]) + ' 秒'
          : k === 'shield' || k === 'mark' || k === 'frozen' || k === 'stun'
            ? ''
            : o[k] + ' 次';
      return `<li><img src="${iconURL(ic)}" alt=""><b>${n}</b> ${v}<small>${AILD[k] || ''}</small></li>`;
    })
    .join('');
}
function binfoBuffs(o) {
  return ((o && o.buffs) || [])
    .map(b => {
      const fx = Object.keys(BUFFK)
        .filter(k => b[k])
        .map(k => BUFFK[k](b[k]))
        .join('、');
      return `<li><img src="${iconURL(b.bad ? 'skull' : b.cry ? 'horn' : 'star')}" alt=""><b>${esc(b.n || b.id || '增益')}</b> ${b.turns >= 99 ? '常駐' : '剩 ' + tLeft(b.turns) + ' 秒'}<small>${fx}</small></li>`;
    })
    .join('');
}
function binfoTrait(e) {
  if (e.siege) {
    const f = (SINF[e.siege] || []).find(f => f.t === e.trait);
    if (f) return f.d;
  }
  if (e.xiong && XIONGI[e.xiong]) return XIONGI[e.xiong].d;
  if (e.zhulong) return '白晝燭火灼燒全體；每 3 次行動睜眼閉眼交替，黑夜回血、看不到行動順序、你的攻擊 30% 打空';
  if (e.yama) return '生死簿：點名一人，下一次受到的傷害加倍；判官筆抹掉增益';
  return '';
}
function binfoRender() {
  const el = $('binfo'),
    mp = !B && typeof MB !== 'undefined' && MB,
    me = B ? B.me : mp ? MB.ps.find(p => p.uid === CLOUD.uid) : null,
    es = B ? B.es : mp ? MB.es : [];
  let body = '';
  if (BINFO === 'log')
    body = BLOG.length
      ? `<ol class="blog">${BLOG.slice()
          .reverse()
          .map(l => `<li class="l-${l.c}">${esc(l.s)}</li>`)
          .join('')}</ol>`
      : '<p class="sub">還沒有紀錄</p>';
  else {
    const st = stats(),
      au = auraOn(st.spirit)
        .map(q => esc(q.name))
        .join('、'),
      mine =
        binfoAil(me, AIL_H) +
        binfoBuffs(me) +
        ((me && me.units) || [])
          .map(
            u =>
              `<li><img src="${unitIcon(u, u.kind === 'totem' ? 'rune' : 'xbow')}" alt=""><b>${esc(u.n)}</b> ${u.kind === 'totem' ? `生命 ${Math.ceil(u.hp)}` : '剩 ' + tLeft(u.turns) + ' 秒'}</li>`
          )
          .join('') +
        (me && me.traps && me.traps.length
          ? `<li><img src="${unitIcon(me.traps[0], 'eye')}" alt=""><b>陷阱</b> ×${me.traps.length}<small>敵人行動時觸發</small></li>`
          : '') +
        (me && me.mines && me.mines.length
          ? `<li><img src="${unitIcon(me.mines[0], 'flame')}" alt=""><b>地雷</b> ×${me.mines.length}<small>按「引爆地雷」一次炸掉</small></li>`
          : '') +
        (me && me.pdot
          ? `<li><img src="${iconURL('leaf')}" alt=""><b>中毒／流血</b> 剩 ${tLeft(me.pdot.turns)} 秒<small>每 3 秒扣血</small></li>`
          : '');
    body =
      `<h4>你</h4><ul class="bil">${mine || '<li class="none">沒有增益或異常</li>'}</ul>${au ? `<p class="bau">光環：${au}</p>` : ''}` +
      es
        .filter(e => e.hp > 0)
        .map(e => {
          const mods = (e.mods || [])
              .filter(id => EMODI[id])
              .map(id => `<li><b>${EMODI[id].n}</b><small>${EMODI[id].d}</small></li>`)
              .join(''),
            tr = binfoTrait(e),
            mk = (e.msk || []).map(k => MSK[k].n).join('、'),
            ail = binfoAil(e, AIL_E) + binfoBuffs(e);
          return `<h4 style="color:${RCOL[e.rar || 0]}">${esc(e.name)} <small>Lv${e.lv}・生命 ${Math.ceil(e.hp).toLocaleString()} / ${e.maxhp.toLocaleString()}</small></h4><ul class="bil">${tr ? `<li><b>特色</b><small>${esc(tr)}</small></li>` : ''}${mk ? `<li><b>招式</b><small>${mk}</small></li>` : ''}${mods}${ail || (mods || tr ? '' : '<li class="none">沒有詞綴或異常</li>')}</ul>`;
        })
        .join('');
  }
  el.innerHTML = `<div class="binfo-tabs"><button class="${BINFO === 'st' ? 'on' : ''}" data-act="binfoTab" data-k="st">狀態</button><button class="${BINFO === 'log' ? 'on' : ''}" data-act="binfoTab" data-k="log">紀錄</button><button class="x" data-act="binfo" aria-label="關閉">✕</button></div><div class="binfo-body">${body}</div>`;
}
function pop(text, x, y, col) {
  BFX.pops.push({ text, x, y, col, t: performance.now() });
}
/* o 是 BFX.hero 或 BFX.en[i]；sign 是衝刺方向（玩家往右 1、敵人往左 -1） */
function anim(o, type, dur = 360) {
  if (o) o.a = { type, t: performance.now(), dur };
}
function animOff(o, sign) {
  const a = o && o.a;
  if (!a) return [0, 0];
  const p = (performance.now() - a.t) / a.dur;
  if (p >= 1) {
    o.a = null;
    return [0, 0];
  }
  const s = Math.sin(Math.PI * p);
  if (a.type === 'lunge') return [sign * BW * 0.2 * s, -6 * s];
  if (a.type === 'cast') return [0, -8 * s];
  if (a.type === 'hurt') return [-sign * 8 * Math.sin(p * 20) * (1 - p), 0];
  return [0, 0];
}
function later(ms, fn) {
  setTimeout(() => {
    if (B) fn();
  }, ms);
}

/* ================= battle: rules（單人與組隊共用） ================= */
/* 敵人身上的戰鬥狀態 */
function eInit(e) {
  Object.assign(e, { poison: 0, pMul: 1, burn: 0, burnDmg: 0, shock: 0, frozen: 0, bleed: 0, bleedDmg: 0, stun: 0 });
  Object.assign(e, { curse: 0, curseP: 0, mark: 0, markP: 0 });
  /* 0.3.19：中毒、流血可以疊層；衰老（行動值變慢）、易傷（物理／元素受傷增加）、死亡印記 */
  Object.assign(e, { poisonN: 0, bleedN: 0, slow: 0, vul: 0, vulP: 0, vulE: 0, dmark: 0 });
  return e;
}
/* 怪物群：地圖上的一隻怪代表一群，依稀有度帶 0～3 隻小怪（最多 5 隻）；小怪跟著帶頭的種族（亡靈、魔霧） */
/* 野外怪物帶幾隻同伴（0.3.1.5 調低）：依地圖上那隻怪的位置與刷新週期固定，開打前的說明就能顯示 */
const PACK_P = { 0: [0.75, 0.95], 1: [0.45, 0.85], 2: [0.25, 0.7], 4: [0.6, 0.9] };
function packN(e) {
  if (S.lv < 3 || !PACK_P[e.rar || 0]) return 0;
  const q = (h(fl(e.lat * 1e5), fl(e.lng * 1e5), epoch() + 77) % 1000) / 1000,
    /* 狩獵中：獵殺等級越高越常成群 */
    hp = huntLv() ? huntCfg().pack : [0, 0],
    a = PACK_P[e.rar || 0][0] - hp[0],
    b = PACK_P[e.rar || 0][1] - hp[1];
  return q < a ? 0 : q < b ? 1 : 2;
}
/* 同伴的種類與等級也依位置與刷新週期固定（packSeed），開打前的說明就能畫出這場會遇到的每一隻 */
const packSeed = e => h(fl(e.lat * 1e5), fl(e.lng * 1e5), epoch() + 91);
function packBases(lead, n, seed) {
  const r = rng(seed),
    out = [];
  for (let k = 0; k < Math.min(4, n); k++) {
    const lv = Math.max(1, (lead.lv || S.lv) - (r() < 0.5 ? 1 : 0)),
      b = lead.siege
        ? followerBase(lead.siege, SINF[lead.siege][fl(r() * 5)])
        : lead.ud
          ? UNDEAD[fl(r() * UNDEAD.length)]
          : lead.mist && r() < 0.5
            ? MISTMON[fl(r() * MISTMON.length)]
            : pickMon(fl(r() * 1e6), lv);
    out.push({ b, lv });
  }
  return out;
}
function packOf(lead, extra = 0, n = 0, seed) {
  const out = [];
  for (const { b, lv } of packBases(lead, n + extra, seed ?? fl(Math.random() * 1e9))) {
    const m = makeEnemy(b, lv, 0, []);
    m.maxhp = m.hp = Math.round(m.maxhp * 0.6);
    m.atk = Math.round(m.atk * 0.7);
    m.xp = Math.round(m.xp * 0.6);
    m.gold = Math.round(m.gold * 0.6);
    m.minion = 1;
    /* 小怪的等級已經跟著帶頭的（含獵殺加的等級），這裡只加生命與攻擊 */
    if (lead.hlv) huntBuff(m, true);
    for (const k2 of ['ud', 'mist', 'uw']) if (lead[k2]) m[k2] = lead[k2];
    if (lead.siege && b.fol) followerize(m, lead.siege, b.fol);
    if (lead.mist) m.name = (lead.ud ? '霧中亡靈・' : '魔霧・') + m.name;
    out.push(m);
  }
  return out;
}
/* 技能的標籤：法術看元素，攻擊看武器類別（劍、斧鎚、矛、弓弩、匕首爪、法杖），昇華的輔助型大點依標籤套用 */
const skTag = (sk, st) => (sk.kind === 'spell' ? sk.el : sk.w || (st && st.wtag) || 'sword');
/* 昇華輔助：把符合這個技能的效果加總（tag 可以是武器類別、元素、'attack'／'spell'、'all'） */
function supOf(st, sk) {
  const tag = skTag(sk, st),
    o = {};
  for (const s of (st && st.sup) || [])
    if (s.tag === 'all' || s.tag === tag || s.tag === sk.kind || (s.tag === 'summon' && sk.pet))
      for (const k in s) if (k !== 'tag') o[k] = (o[k] || 0) + s[k];
  /* 0.3.20 技能石上插的輔助寶石 */
  for (const k in sk.gsup || {}) o[k] = (o[k] || 0) + sk.gsup[k];
  return o;
}
/* 增益（戰旗、冰甲、附身…）：me.buffs 是 [{k: 值, turns}]，取同一個欄位的總和 */
const bsum = (me, k) => ((me && me.buffs) || []).reduce((a, b) => a + (b[k] || 0), 0);
/* damage packets: {phys,fire,cold,light} */
function mitigate(pk, arm, res, shock) {
  const pr = pk.phys > 0 ? arm / (arm + 10 * pk.phys) : 0;
  /* 0.3.36 混沌傷害：res[3] 是混沌抗性（沒寫就是 0） */
  let d =
    pk.phys * (1 - pr) +
    pk.fire * (1 - res[0] / 100) +
    pk.cold * (1 - res[1] / 100) +
    pk.light * (1 - res[2] / 100) +
    (pk.chaos || 0) * (1 - (res[3] || 0) / 100);
  if (shock) d *= 1.2;
  return Math.max(1, d);
}
/* ---- 天賦規則（單人與多人共用）：o 是有 hp/mp 的對象（S 或隊員），st 是它的屬性 ---- */
const skCost = (st, sk) => Math.round(sk.mp * (1 - Math.min(80, (st.mpCost || 0) + (supOf(st, sk).cost || 0)) / 100));
const lifeCost = (st, sk) => (sk.lifeCost ? Math.round(st.maxhp * sk.lifeCost) : 0);
/* 0.3.18：技能要求的武器類型不符就不能用（昇華「技能不再需要特定武器」例外） */
/* 0.3.36：'melee' 是弓弩以外的武器；oh: 'shield' 要拿盾 */
const wOk = (st, sk) =>
  !st ||
  !!st.anyWep ||
  ((!sk.w || !st.wtag || (sk.w === 'melee' ? st.wtag !== 'bow' : sk.w === st.wtag)) && (!sk.oh || st.otag === sk.oh));
const canPay = (o, st, sk) =>
  wOk(st, sk) &&
  (st.blood ? o.hp > skCost(st, sk) + lifeCost(st, sk) : o.mp >= skCost(st, sk) && o.hp > lifeCost(st, sk));
/* 戰鬥按鈕的小字：武器不符就寫「需要劍」，否則是消耗與短標籤 */
/* 0.3.19：冷卻中寫「冷卻 N」；蓄力中寫「釋放 ×N」；有條件加成時寫預覽（例：+24%） */
const skSub = (st, q, me, es, ti) =>
  !wOk(st, q)
    ? `需要${q.oh && st.otag !== q.oh ? '盾' : WTAGN[q.w]}`
    : cdLeft(me, q)
      ? '冷卻中'
      : [charging(me, q) ? '' : costTxt(st, q), (me && condTxt(q, me, st, es, ti)) || skShort(q)]
          .filter(Boolean)
          .join('・');
/* 能不能按：武器、冷卻、消耗（蓄力好的那一下不用再付） */
const skReady = (o, me, st, q) => wOk(st, q) && !cdLeft(me, q) && (charging(me, q) || canPay(o, st, q));
function payCost(o, st, sk) {
  const n = skCost(st, sk);
  if (st.blood) o.hp = Math.max(1, o.hp - n);
  else o.mp -= n;
  if (sk.lifeCost) o.hp = Math.max(1, o.hp - lifeCost(st, sk));
}
const costTxt = (st, sk) =>
  [sk.mp ? skCost(st, sk) + (st.blood ? ' 生命' : ' 魔力') : '', sk.lifeCost ? lifeCost(st, sk) + ' 生命' : '']
    .filter(Boolean)
    .join('＋');
/* 技能石自己的數值（暴擊、異常、吸血…）只在用那個技能時生效；0.3.20 刻印共鳴改成每顆輔助寶石 */
const skSt = (st, sk) =>
  sk.gid
    ? {
        ...st,
        crit: st.crit ? Math.min(75, st.crit + sk.crit) : 0,
        ail: (st.ail || 1) * (1 + sk.ail / 100),
        leech: (st.leech || 0) + sk.leech,
        dbl: Math.min(60, (st.dbl || 0) + sk.dbl),
        brk: sk.brk,
        skMul: 1 + ((st.engPct || 0) * (sk.nEn || 0)) / 100
      }
    : st;
/* 依代號取技能：'attack' 是固定的普通攻擊，'s0'～'s3' 是技能欄（list 是 mySkills() 或隊員快照的 sks） */
const skByKey = (k, list) => (k === 'attack' ? SKILLS.attack : (k && k[0] === 's' && list[+k.slice(1)]) || null);
const extraHit = (st, sk) => (sk.kind === 'attack' && st.dbl && Math.random() * 100 < st.dbl ? 1 : 0);
function heroPacket(st, sk, mult) {
  if (sk.kind === 'spell') {
    const pk = { phys: 0, fire: 0, cold: 0, light: 0, chaos: 0 };
    pk[sk.el] =
      (sk.sb || 9) * (st.spellMul || 1) * ((st.elm && st.elm[sk.el]) || 1) * mult * (st.skMul || 1) * rnd(0.85, 1.15);
    return pk;
  }
  mult *= st.skMul || 1;
  return {
    phys: rnd(st.physLo, st.physHi) * mult,
    fire: st.fire * mult * rnd(0.8, 1.2),
    cold: st.cold * mult * rnd(0.8, 1.2),
    light: st.light * mult * rnd(0.3, 1.7),
    chaos: (st.chaos || 0) * mult * rnd(0.8, 1.2)
  };
}
/* 0.3.36 輔助寶石對傷害的改變：轉換（物理 → 元素、元素 → 混沌）、附加（另外加這下傷害的 N%）、元素／物理總乘、殘暴 */
function pkSup(pk, sup, st) {
  const elm = (st && st.elm) || {},
    E = ['fire', 'cold', 'light'];
  pk.chaos = pk.chaos || 0;
  for (const [k, el] of [
    ['cvFire', 'fire'],
    ['cvCold', 'cold'],
    ['cvLight', 'light']
  ])
    if (sup[k]) {
      const x = (pk.phys * Math.min(100, sup[k])) / 100;
      pk.phys -= x;
      pk[el] += x * (elm[el] || 1);
    }
  if (sup.cvChaos)
    for (const el of E) {
      const x = (pk[el] * Math.min(100, sup.cvChaos)) / 100;
      pk[el] -= x;
      pk.chaos += x * (elm.chaos || 1);
    }
  const tot = pk.phys + pk.fire + pk.cold + pk.light + pk.chaos;
  for (const [k, el] of [
    ['gFire', 'fire'],
    ['gCold', 'cold'],
    ['gLight', 'light'],
    ['gChaos', 'chaos']
  ])
    if (sup[k]) pk[el] += ((tot * sup[k]) / 100) * (elm[el] || 1);
  if (sup.eleMore) for (const el of E) pk[el] *= 1 + sup.eleMore / 100;
  if (sup.physMore) pk.phys *= 1 + sup.physMore / 100;
  if (sup.noEle) for (const el of [...E, 'chaos']) pk[el] = 0;
}
function heroDmg(st, pk, e, shock, o) {
  const pen = st.penRes || 0;
  let d = mitigate(pk, e.arm * (1 - Math.min(90, st.brk || 0) / 100), pen ? e.res.map(v => v - pen) : e.res, shock);
  const crit = Math.random() * 100 < st.crit;
  if (crit) d *= st.critMulti / 100;
  if (st.lowLife && o.hp < st.maxhp / 2) d *= 1 + st.lowLife / 100;
  if (st.legPride && o.hp >= st.maxhp) d *= 1.3;
  if (st.legEnvy && e.hp > o.hp) d *= 1.25;
  if (st.exec && e.hp < e.maxhp * 0.35) d *= 1 + st.exec / 100;
  if (e.mark > 0) d *= 1 + (e.markP || 20) / 100;
  if (e.curse > 0) d *= 1 + (e.curseP || 15) / 100;
  return { d: Math.round(d), crit };
}
/* 命中後的異常狀態，es 是那隻敵人，回傳要跳出的文字 */
function heroAil(st, sk, pk, es) {
  /* 0.3.36 元素集中：不能造成異常 */
  if (st.noAil) return [];
  const out = [],
    m = st.ail || 1,
    dur = 3 + (st.ailDur || 0);
  if (pk.fire > 0 && (sk.ignite || Math.random() < (sk.el === 'fire' ? 0.4 : 0.2) * m)) {
    es.burn = dur;
    es.burnDmg = Math.max(1, Math.round(pk.fire * 0.3 * (st.dotMul || 1)));
    out.push(['燃燒', '#ffb15a']);
  }
  if (pk.cold > 0 && Math.random() < (sk.freeze || 0.12) * m) {
    es.frozen = 1;
    out.push(['凍結', '#9fe7ff']);
  }
  if (pk.light > 0 && Math.random() < 0.25 * m) {
    es.shock = 2 + (st.ailDur || 0);
    out.push(['感電', '#fff27a']);
  }
  if (st.legLust && Math.random() < 0.15) {
    es.frozen = 1;
    out.push(['魅惑', '#ff8ad8']);
  }
  /* 0.3.36 混沌傷害 20% 機率中毒 */
  if (pk.chaos > 0 && !sk.poison && Math.random() < 0.2 * m) {
    addPoison(es, dur, (st.poisonMul || 1) * (st.dotMul || 1));
    out.push([es.poisonN > 1 ? `中毒×${es.poisonN}` : '中毒', '#9be36b']);
  } else if (sk.kind === 'attack' && !sk.poison && st.poisonCh && Math.random() * 100 < st.poisonCh) {
    addPoison(es, dur, (st.poisonMul || 1) * (st.dotMul || 1));
    out.push([es.poisonN > 1 ? `中毒×${es.poisonN}` : '中毒', '#9be36b']);
  }
  if (st.bleedCh && Math.random() * 100 < st.bleedCh) {
    es.bleed = dur;
    es.bleedN = Math.min(5, (es.bleedN || 0) + 1);
    es.bleedDmg = Math.max(
      es.bleedDmg || 0,
      1,
      Math.round((pk.phys || pk.fire + pk.cold + pk.light) * 0.25 * (st.dotMul || 1))
    );
    out.push([es.bleedN > 1 ? `流血×${es.bleedN}` : '流血', '#ff5a5a']);
  }
  if (st.stunCh && Math.random() * 100 < st.stunCh) {
    es.stun = 1;
    out.push(['暈眩', '#ffe27a']);
  }
  if (st.curseCh && Math.random() * 100 < st.curseCh) {
    es.curse = 3;
    es.curseP = Math.max(es.curseP || 0, st.curseP || 15);
    out.push(['詛咒', '#c86aff']);
  }
  return out;
}
/* 中毒每層 +30%（最多 8 層）；流血每層 +50%（最多 5 層） */
const poisonTick = (e, es) =>
  Math.max(1, Math.round(e.maxhp * 0.08 * (es.pMul || 1) * (1 + 0.3 * Math.max(0, (es.poisonN || 1) - 1))));
const bleedTick = e => Math.max(1, Math.round(e.bleedDmg * (1 + 0.5 * Math.max(0, (e.bleedN || 1) - 1))));
const addPoison = (e, turns, mul) => {
  e.poison = Math.max(e.poison || 0, turns);
  e.poisonN = Math.min(8, (e.poisonN || 0) + 1);
  e.pMul = mul;
};
/* 受到傷害：心靈凌駕讓一部分改扣魔力，護盾先吸收 */
function takeDmg(o, st, d) {
  if (o.shield > 0) {
    const a = Math.min(o.shield, d);
    o.shield -= a;
    d -= a;
  }
  const m = st.mom ? Math.max(0, Math.min(o.mp, Math.round((d * st.mom) / 100))) : 0;
  o.mp -= m;
  o.hp = Math.max(0, o.hp - (d - m));
  return m;
}
const hitCol = pk =>
  (pk.chaos || 0) > pk.phys * 0.5 && pk.chaos >= pk.fire && pk.chaos >= pk.cold && pk.chaos >= pk.light
    ? '#c86aff'
    : pk.fire > pk.cold && pk.fire > pk.light && pk.fire > pk.phys * 0.5
      ? '#ffb15a'
      : pk.cold > pk.phys * 0.5 && pk.cold > pk.light
        ? '#9fe7ff'
        : pk.light > pk.phys * 0.5
          ? '#fff27a'
          : '#ffffff';
const aliveIdx = es => es.map((e, i) => (e.hp > 0 ? i : -1)).filter(i => i >= 0);
/* ---- 0.3.19 技能的通用條件與狀態連動 ----
   技能欄位：cd 冷卻（秒，0.3.35 起）、foes 每多一隻敵人傷害 ±%（最多算 4 隻）、vs {狀態: %} 對有該狀態的目標加傷（中毒、流血每層算一次）、
   vsCrit 對有該狀態的目標必定暴擊、lowT／fullT 目標低血（30% 以下）／滿血加傷、lowMe 自己每少 10% 生命加傷、combo 連續使用每層加傷（最多 5 層）、
   petN 每隻召喚物加傷、consume 命中後消耗目標的狀態、det 引爆目標的持續傷害（一次結算剩下的回合）、shockChain 目標感電時多連鎖、
   charge 先蓄力一回合、下次放同一招 ×倍數（蓄力時被打會減弱）、slow 衰老、vulP／vulE 物理／元素易傷、dmark 死亡印記、spreadSt 狀態擴散、
   killBoom 擊殺時把這下傷害的 % 炸到其他敵人、sac 引爆一隻召喚物、cmd 召喚物立刻再行動一次；
   戰吼 cry：perFoe 增益依敵人數放大、lowMeBuff、emp 強化接下來 N 次攻擊（N = 吼到的敵人數）、fear 低血敵人恐懼、avUp 全隊行動值提前 */
const skKey = sk => sk.gid || sk.k || sk.name;
const cdLeft = (me, sk) => (me && me.cd && me.cd[skKey(sk)]) || 0;
const charging = (me, sk) => !!(me && me.chg && me.chg.k === skKey(sk));
const COND_ST = {
  burn: '燃燒',
  shock: '感電',
  frozen: '凍結',
  stun: '暈眩',
  poison: '中毒',
  bleed: '流血',
  mark: '標記',
  curse: '詛咒',
  slow: '衰老'
};
const stackOf = (e, k) => (k === 'poison' ? e.poisonN || 1 : k === 'bleed' ? e.bleedN || 1 : 1);
/* cn 是連續使用的層數（結算時是這次的層數，預覽時是下一次的） */
function condMul(sk, e, me, st, n, cn = 0) {
  let m = 1;
  if (sk.foes) m *= Math.max(0.2, 1 + (sk.foes * Math.min(4, Math.max(0, n - 1))) / 100);
  if (sk.vs && e) for (const k in sk.vs) if (e[k] > 0) m *= 1 + (sk.vs[k] * stackOf(e, k)) / 100;
  /* 0.3.21 光環的條件加傷（灼燒光環、殘酷光環…）對所有傷害技能 */
  if (st && st.auraVs && e && !sk.pet && !sk.cry)
    for (const k in st.auraVs) if (e[k] > 0) m *= 1 + (st.auraVs[k] * stackOf(e, k)) / 100;
  if (sk.lowT && e && e.hp < e.maxhp * 0.3) m *= 1 + sk.lowT / 100;
  if (sk.fullT && e && e.hp >= e.maxhp) m *= 1 + sk.fullT / 100;
  if (sk.lowMe && me) m *= 1 + (sk.lowMe * fl((1 - me.hp / st.maxhp) * 10)) / 100;
  if (sk.combo) m *= 1 + (sk.combo * cn) / 100;
  if (sk.petN && me) m *= 1 + (sk.petN * (me.pets || []).filter(p => p.turns > 0).length) / 100;
  return m;
}
/* 戰鬥按鈕上的條件預覽（對目前選的目標） */
function condTxt(sk, me, st, es, ti) {
  if (charging(me, sk)) return `釋放 ×${Math.round(me.chg.mul * 10) / 10}`;
  const e = es && es[ti],
    n = es ? aliveIdx(es).length : 1,
    m = condMul(sk, e, me, st, n, me && me.combo === skKey(sk) ? Math.min(5, (me.comboN || 0) + 1) : 0);
  if (sk.cry && sk.perFoe) return `吼 ${n} 隻`;
  if (sk.det && e && e[sk.det] > 0) return `可引爆${COND_ST[sk.det]}`;
  if (sk.sac) return `召喚物 ${(me.pets || []).filter(p => p.turns > 0).length}`;
  if (Math.abs(m - 1) < 0.01) return '';
  return `${m > 1 ? '+' : ''}${Math.round((m - 1) * 100)}%`;
}
/* 一次行動的結算（單人與組隊共用）：me 是施放者（hp、mp、戰鬥狀態，uid），es 是敵人，ti 是目標，party 是隊員
   回傳事件陣列，at 是相對時間（毫秒）；畫面由單人的 playEv 或組隊的 mpApply 播 */
function actResolve(me, st0, sk, es, ti, party, ext = {}) {
  const ev = [],
    sup = supOf(st0, sk),
    st = skSt(st0, sk),
    S2 = {
      ...st,
      crit: st.crit && !sup.noCrit ? Math.min(90, st.crit + (sup.crit || 0) + bsum(me, 'crit')) : 0,
      noAil: !!sup.noAil,
      ailDur: (st.ailDur || 0) + (sup.ailDur || 0),
      critMulti: st.critMulti + (sup.cm || 0),
      ail: (st.ail || 1) * (1 + (sup.ail || 0) / 100),
      leech: (st.leech || 0) + (sup.leech || 0),
      brk: Math.max(st.brk || 0, sup.pen || 0),
      penRes: (st.penRes || 0) + (sup.penRes || 0),
      bleedCh: (st.bleedCh || 0) + (sup.bleed || 0) + (sk.bleed || 0),
      stunCh: (st.stunCh || 0) + (sup.stun || 0),
      poisonCh: Math.min(100, (st.poisonCh || 0) + (sup.poison || 0)),
      exec: (st.exec || 0) + (sup.exec || 0) + (sk.exec || 0),
      dotMul: (st.dotMul || 1) * (1 + (sup.dot || 0) / 100)
    },
    key = skKey(sk);
  let more =
    (1 + (sup.more || 0) / 100) *
    (1 + bsum(me, 'more') / 100) *
    (1 + ((me.stacks || 0) * (st.killStack || 0)) / 100) *
    (ext.allyMul || 1);
  const who = me.uid;
  if (me.dc) {
    S2.crit = 100;
    me.dc = 0;
  }
  /* 模仿者看你上一招的元素 */
  me.lastEl = sk.kind === 'spell' ? sk.el : sk.addEl ? sk.addEl[0] : 'phys';
  /* 連續使用同一招才疊層，換招就歸零 */
  me.comboN = me.combo === key ? Math.min(5, (me.comboN || 0) + 1) : 0;
  me.combo = key;
  /* 蓄力：先蓄一回合，下次放同一招才打出去；改放別招就取消 */
  if (me.chg && me.chg.k !== key) me.chg = me.chgN = 0;
  if (sk.charge) {
    if (!me.chg) {
      me.chg = { k: key, mul: sk.charge };
      me.chgN = 1;
      ev.push({ t: 'msg', s: `${sk.name}：蓄力中（下次 ×${sk.charge}）`, at: 0 });
      ev.push({ t: 'st', who, s: '蓄力', col: '#ffd166', at: 120 });
      ev.push({ t: 'fx', type: 'heal', who, at: 100 });
      ev.push({ t: 'end', at: 600 });
      return ev;
    }
    more *= me.chg.mul;
    ev.push({ t: 'msg', s: `${sk.name}・釋放！`, at: 0 });
    me.chg = me.chgN = 0;
  }
  /* 0.3.35 冷卻以秒計（cdTick 倒數），cdMax 給按鈕畫冷卻遮罩 */
  {
    const c = skCdS(st0, sk);
    if (c > 0) {
      (me.cd = me.cd || {})[key] = c;
      (me.cdMax = me.cdMax || {})[key] = c;
    }
  }
  /* 0.3.36 快速攻擊／快速施法：行動條先補一些 */
  if (sup.avBack && ext.av) ext.av[me.uid] = (ext.av[me.uid] || 0) + sup.avBack;
  /* 戰意激昂：接下來 N 次攻擊強化 */
  if (me.empN > 0 && sk.kind === 'attack' && !sk.pet) {
    more *= 1 + (me.empMore || 0) / 100;
    me.empN--;
  }
  if (sk.cry) return cryResolve(me, st, sk, es, party, ext, ev);
  /* 0.3.22 戰場單位：圖騰、砲台、陷阱、地雷 */
  if (sk.totem || sk.turret || sk.trap || sk.mine) return placeUnit(me, st, sk, ev);
  if (sk.kind === 'heal') {
    const tg = party.filter(q => q.alive !== false).sort((a, b) => a.hp / a.st.maxhp - b.hp / b.st.maxhp)[0] || me,
      /* 緊急治療：目標每少 10% 生命，治療量 +healLow% */
      v = Math.round(
        tg.st.maxhp *
          (sk.heal || 0.35) *
          (st.healMul || 1) *
          (1 + ((sk.healLow || 0) * fl((1 - tg.hp / tg.st.maxhp) * 10)) / 100)
      );
    tg.hp = Math.min(tg.st.maxhp, tg.hp + v);
    ev.push({ t: 'heal', who: tg.uid, from: who, v, at: 250 });
    const ha = (st.healAll || 0) + (sk.healAll || 0);
    if (ha)
      party
        .filter(q => q.alive !== false && q !== tg)
        .forEach(q => {
          const w = Math.round((v * ha) / 100);
          q.hp = Math.min(q.st.maxhp, q.hp + w);
          ev.push({ t: 'heal', who: q.uid, from: who, v: w, at: 300 });
        });
    if (sk.buff) addBuff(me, sk, ev);
    return ev;
  }
  /* 號令：召喚物立刻再行動一次 */
  if (sk.cmd) {
    const pe = petsAct(me, st, es);
    if (!pe.length) ev.push({ t: 'msg', s: '沒有召喚物可以號令', at: 0 }, { t: 'end', at: 500 });
    else ev.push({ t: 'msg', s: '號令！', at: 0 }, ...pe.map(f => ({ ...f, at: (f.at || 0) + 200 })));
    return ev;
  }
  if (sk.kind === 'buff') {
    addBuff(me, sk, ev);
    return ev;
  }
  if (sk.pet) {
    const max = (sk.pet.max || 3) + (sup.petMax || 0);
    me.pets = (me.pets || []).filter(p => p.turns > 0);
    for (let k = 0; k < (sk.pet.n || 1) && me.pets.length < max; k++)
      me.pets.push({ ...sk.pet, turns: (sk.pet.turns || 4) + (sup.petTurns || 0), pct: sup.petPct || 0 });
    ev.push({ t: 'msg', s: `召喚${sk.pet.name}（${me.pets.length}/${max}）`, at: 0 });
    ev.push({ t: 'fx', type: 'summon', who, at: 200 });
    if (!sk.mult) return ev;
  }
  /* 屍爆：引爆一隻召喚物，炸全部敵人 */
  if (sk.sac) {
    me.pets = (me.pets || []).filter(p => p.turns > 0);
    if (!me.pets.length) {
      ev.push({ t: 'msg', s: '沒有召喚物可以引爆', at: 0 }, { t: 'end', at: 500 });
      return ev;
    }
    const pt = me.pets.sort((a, b) => (b.mult || 1) - (a.mult || 1)).shift(),
      base = (8 + (me.lv || S.lv) * 1.8) * (pt.mult || 1) * sk.sac * more * (1 + (st.petPct || 0) / 100);
    ev.push({ t: 'msg', s: `引爆${pt.name}！`, at: 0 });
    aliveIdx(es).forEach((i, n) => {
      const e = es[i],
        pk = { phys: 0, fire: 0, cold: 0, light: 0, chaos: 0 };
      pk[pt.el || 'phys'] = base * rnd(0.9, 1.1);
      const d = Math.round(mitigate(pk, e.arm, e.res, e.shock > 0));
      e.hp = Math.max(0, e.hp - d);
      ev.push({ t: 'hit', i, d, col: '#ffb15a', fx: 'whirl', from: who, at: 250 + n * 60 });
      if (e.hp <= 0) ev.push({ t: 'kill', i, at: 350 + n * 60 });
    });
    ev.push({ t: 'end', at: 800 });
    return ev;
  }
  if (sk.guard) {
    me.guard = sk.guard;
    ev.push({ t: 'st', who, s: '護甲↑', col: '#9fd4ef', at: 100 });
  }
  const spell = sk.kind === 'spell',
    gap = spell ? 260 : 330,
    fx = spell ? sk.fx : sk.fx === 'whirl' ? 'whirl' : sk.fx === 'arrow' || st.ranged ? 'pierce' : 'slash';
  let at = spell ? 600 : 200;
  const live = () => aliveIdx(es),
    n0 = live().length;
  const one = (i, mult, t, kind) => {
    const e = es[i];
    if (!e || e.hp <= 0) return;
    /* 燭龍的黑夜：30% 打空 */
    if (me.blind && Math.random() < 0.3) {
      ev.push({ t: 'st', i, s: '打空了', col: '#8a8aa0', at: t });
      return;
    }
    const had = sk.consume && e[sk.consume] > 0,
      S3 = sk.vsCrit && e[sk.vsCrit] > 0 ? { ...S2, crit: 100 } : S2,
      pk = heroPacket(S3, sk, mult * more * condMul(sk, e, me, st, n0, me.comboN || 0));
    if (sk.addEl) pk[sk.addEl[0]] += pk.phys * sk.addEl[1] * ((st.elm && st.elm[sk.addEl[0]]) || 1);
    pkSup(pk, sup, st);
    /* 易傷：脆弱（物理）、元素弱化（火冰電） */
    if (e.vul > 0) {
      pk.phys *= 1 + (e.vulP || 0) / 100;
      for (const k of ['fire', 'cold', 'light']) pk[k] *= 1 + (e.vulE || 0) / 100;
    }
    const r = heroDmg(S3, pk, e, e.shock > 0, me);
    let d = r.d;
    /* 0.3.25 信徒與被攻佔城鎮的特效 */
    if (e.trait || e.sinAura || me.charmed) {
      const fh = followerHit(e, es, me, d, i, t);
      ev.push(...fh.ev);
      if (fh.miss) return;
      d = fh.d;
    }
    /* 引爆：把目標身上剩下的燃燒／中毒／流血一次結算 */
    if (sk.det && e[sk.det] > 0) {
      const per = sk.det === 'burn' ? e.burnDmg : sk.det === 'poison' ? poisonTick(e, e) : bleedTick(e),
        x = Math.round(per * e[sk.det] * (sk.detMul || 1) * (S2.dotMul || 1));
      e[sk.det] = 0;
      if (sk.det === 'poison') e.poisonN = 0;
      if (sk.det === 'bleed') e.bleedN = 0;
      ev.push({ t: 'st', i, s: `引爆 ${x}`, col: '#ffb15a', at: t + 40 });
      d += x;
    }
    if (had) {
      e[sk.consume] = 0;
      ev.push({ t: 'st', i, s: COND_ST[sk.consume] ? '碎' + COND_ST[sk.consume] : '消耗', col: '#9fe7ff', at: t + 30 });
    }
    if (e.sin && ext.sinHit) d = ext.sinHit(e, d, i);
    /* 0.3.38 怪物的護盾先吸收 */
    if (e.eshield > 0) {
      const a = Math.min(e.eshield, d);
      e.eshield -= a;
      d -= a;
      if (a) ev.push({ t: 'st', i, s: `護盾 -${a}`, col: '#9fd4ef', at: t + 20 });
    }
    e.hp = Math.max(0, e.hp - d);
    ev.push({ t: 'hit', i, d, crit: r.crit, col: r.crit ? '#ffd166' : hitCol(pk), fx: kind || fx, from: who, at: t });
    if (S2.leech && d > 0) me.hp = Math.min(st.maxhp, me.hp + Math.max(1, Math.round((d * S2.leech) / 100)));
    if (sup.mpLeech && d > 0) me.mp = Math.min(st.maxmp, me.mp + Math.max(1, Math.round((d * sup.mpLeech) / 100)));
    if (e.hp > 0) {
      heroAil(S2, sk, pk, e).forEach(([s, col]) => ev.push({ t: 'st', i, s, col, at: t + 60 }));
      if (sk.poison) {
        addPoison(e, sk.poison, st.poisonMul || 1);
        ev.push({ t: 'st', i, s: e.poisonN > 1 ? `中毒×${e.poisonN}` : '中毒', col: '#9be36b', at: t + 80 });
      }
      if (sk.slow) {
        e.slow = sk.slow;
        ev.push({ t: 'st', i, s: '衰老', col: '#c8b0ff', at: t + 85 });
      }
      if (sk.vulP || sk.vulE) {
        e.vul = 3;
        e.vulP = Math.max(e.vulP || 0, sk.vulP || 0);
        e.vulE = Math.max(e.vulE || 0, sk.vulE || 0);
        ev.push({ t: 'st', i, s: sk.vulE ? '元素弱化' : '脆弱', col: '#ff9aa4', at: t + 88 });
      }
      if (sk.dmark) {
        e.dmark = 3;
        ev.push({ t: 'st', i, s: '死亡印記', col: '#c86aff', at: t + 92 });
      }
      if (sk.spreadSt)
        for (const j of live())
          if (j !== i) {
            const o = es[j];
            for (const k of ['curse', 'mark', 'vul', 'slow', 'dmark']) if (e[k] > 0) o[k] = Math.max(o[k] || 0, e[k]);
            for (const k of ['curseP', 'curseW', 'markP', 'vulP', 'vulE']) if (e[k]) o[k] = Math.max(o[k] || 0, e[k]);
            ev.push({ t: 'st', i: j, s: '擴散', col: '#c86aff', at: t + 140 });
          }
      if ((sk.mark || st.markFirst) && !e.mark) {
        e.mark = 99;
        e.markP = Math.max(sk.mark || 0, st.markFirst || 0);
        ev.push({ t: 'st', i, s: '標記', col: '#ffd166', at: t + 90 });
      }
      if (sk.curse) {
        e.curse = 3;
        e.curseP = Math.max(e.curseP || 0, sk.curse);
        e.curseW = Math.max(e.curseW || 0, sk.curseW || 0);
        ev.push({ t: 'st', i, s: '詛咒', col: '#c86aff', at: t + 75 });
      }
      if (sk.stun && Math.random() < sk.stun) {
        e.stun = 1;
        ev.push({ t: 'st', i, s: '暈眩', col: '#ffe27a', at: t + 70 });
      }
    } else {
      ev.push({ t: 'kill', i, at: t + 100 });
      /* 自爆怨火：死亡時爆炸，傷害打倒牠的人 */
      if (e.trait === 'boom') {
        const bx = Math.max(1, Math.round(e.atk * 1.5));
        me.hp = Math.max(1, me.hp - bx);
        ev.push({ t: 'dmg', who, d: bx, col: '#ffb15a', at: t + 160 });
      }
      /* 死亡印記：目標死亡時回 10% 生命與魔力 */
      if (e.dmark > 0) {
        const hv = Math.round(st.maxhp * 0.1);
        me.hp = Math.min(st.maxhp, me.hp + hv);
        me.mp = Math.min(st.maxmp, me.mp + Math.round(st.maxmp * 0.1));
        ev.push({ t: 'heal', who, from: who, v: hv, at: t + 150 });
      }
      if (sk.killBoom)
        for (const j of live()) {
          const o = es[j],
            x = Math.max(1, Math.round((d * sk.killBoom) / 100));
          o.hp = Math.max(0, o.hp - x);
          ev.push({ t: 'hit', i: j, d: x, col: '#ffb15a', fx: 'whirl', from: who, at: t + 180 });
          if (o.hp <= 0) ev.push({ t: 'kill', i: j, at: t + 260 });
        }
      if (st.killStack) me.stacks = Math.min(st.killMax || 10, (me.stacks || 0) + 1);
      if (st.killHeal) me.hp = Math.min(st.maxhp, me.hp + Math.round((st.maxhp * st.killHeal) / 100));
      if (st.killMana) me.mp = Math.min(st.maxmp, me.mp + Math.round((st.maxmp * st.killMana) / 100));
      /* 異常擴散：死掉的敵人身上的燃燒、中毒、流血傳給其他敵人 */
      if (st.spread || sup.spread)
        for (const j of live()) {
          const o = es[j];
          if (e.burn) Object.assign(o, { burn: Math.max(o.burn, 2), burnDmg: Math.max(o.burnDmg, e.burnDmg) });
          if (e.poison) Object.assign(o, { poison: Math.max(o.poison, 2), pMul: e.pMul });
          if (e.bleed) Object.assign(o, { bleed: Math.max(o.bleed, 2), bleedDmg: Math.max(o.bleedDmg, e.bleedDmg) });
        }
    }
    if (e.mods && e.mods.includes('reflect')) {
      const rf = Math.max(1, Math.round(d * 0.15));
      me.hp = Math.max(1, me.hp - rf);
      ev.push({ t: 'dmg', who, d: rf, col: '#ff8a8a', at: t + 50 });
    }
  };
  const target = () => (es[ti] && es[ti].hp > 0 ? ti : live()[0]);
  const wave = () => {
    const tg = sup.aoe ? 'all' : sk.tg || 'one',
      hits = Math.max(
        1,
        (sk.hits || 1) + (sup.hits || 0) + extraHit(st, sk) + (st.legWrath && me.hp < st.maxhp / 2 ? 1 : 0)
      ),
      chain =
        (sk.chain || 0) +
        (sup.chain || 0) +
        (sk.shockChain && es[target()] && es[target()].shock > 0 ? sk.shockChain : 0),
      proj = (sk.proj || 0) + (sup.proj || 0);
    for (let h = 0; h < hits; h++) {
      if (!live().length) break;
      if (tg === 'all')
        live()
          .sort((a, b) => (a === ti ? -1 : b === ti ? 1 : 0))
          .slice(0, sup.foesCap || 99)
          .forEach(i => one(i, sk.mult * (sup.aoe && sk.tg !== 'all' ? 0.65 : 1), at, fx));
      else if (tg === 'rand') {
        const L = live();
        one(L[fl(Math.random() * L.length)], sk.mult, at, fx);
      } else {
        const i0 = target();
        if (i0 == null) break;
        one(i0, sk.mult, at, fx);
        const seen = new Set([i0]);
        for (let c = 0; c < chain; c++) {
          const L = live().filter(j => !seen.has(j));
          if (!L.length) break;
          const j = L[fl(Math.random() * L.length)];
          seen.add(j);
          one(j, sk.mult * Math.pow(Math.min(1, 0.8 + (sk.chainDecay || 0) / 100), c + 1), at + 120 * (c + 1), 'chain');
        }
      }
      for (let p = 0; p < proj; p++) {
        const L = live(),
          o = L.filter(j => j !== ti);
        const j = (o.length ? o : L)[fl(Math.random() * (o.length ? o : L).length)];
        if (j != null) one(j, sk.mult * 0.7, at + 60 * (p + 1), fx);
      }
      at += gap;
    }
  };
  wave();
  /* 法術迴響／連珠：有機率整個技能再放一次 */
  if (live().length && Math.random() * 100 < (sup.echo || 0) + (st.echo || 0)) {
    ev.push({ t: 'msg', s: `${sk.name}・迴響！`, at });
    at += 200;
    wave();
  }
  if (sk.buff) addBuff(me, sk, ev);
  ev.push({ t: 'end', at: at + 200 });
  return ev;
}
/* ---- 0.3.22 戰場單位 ----
   圖騰（totem）：放在自己旁邊，有生命、敵人會打它（taunt 越高越常被打），每次自己行動後施放這個技能（mul 倍率），最多 2 個；
   砲台（turret）：打不到、存在 turns 跳（每跳 TURN_S 秒），每一跳自動射擊，最多 2 個；
   陷阱（trap）：佈置好之後，下一隻行動的敵人會先觸發（mul 倍率），最多 3 個；
   地雷（mine）：一直疊（最多 5 顆），用「引爆地雷」一次炸掉，每多一顆每顆 +10% */
const UNIT_MAX = { totem: 2, turret: 2, trap: 3, mine: 5 };
const UNIT_N = { totem: '圖騰', turret: '砲台', trap: '陷阱', mine: '地雷' };
/* 單位施放的技能：拿掉單位欄位、條件中的連續與蓄力，乘上倍率 */
function unitSk(sk, mul) {
  const o = { ...sk, mult: (sk.mult || 0) * mul, gid: (sk.gid || sk.name) + ':u' };
  for (const k of ['totem', 'turret', 'trap', 'mine', 'charge', 'combo', 'cd', 'lifeCost']) delete o[k];
  return o;
}
function placeUnit(me, st, sk, ev) {
  const kind = sk.totem ? 'totem' : sk.turret ? 'turret' : sk.trap ? 'trap' : 'mine',
    u = sk[kind],
    who = me.uid,
    list =
      kind === 'trap'
        ? (me.traps = me.traps || [])
        : kind === 'mine'
          ? (me.mines = me.mines || [])
          : (me.units = me.units || []),
    same = kind === 'trap' || kind === 'mine' ? list : list.filter(x => x.kind === kind),
    o = {
      kind,
      n: u.n || sk.name + UNIT_N[kind],
      sk: unitSk(sk, u.mul || 1),
      turns: u.turns || 4,
      cry: u.cry,
      taunt: u.taunt || 0
    };
  if (kind === 'totem') o.hp = o.maxhp = Math.max(1, Math.round(st.maxhp * (u.hp || 0.35)));
  /* 滿了就換掉最舊的 */
  if (same.length >= UNIT_MAX[kind]) list.splice(list.indexOf(same[0]), 1);
  list.push(o);
  const n = kind === 'trap' || kind === 'mine' ? list.length : list.filter(x => x.kind === kind).length;
  ev.push({ t: 'msg', s: `放置${o.n}（${UNIT_N[kind]} ${n}/${UNIT_MAX[kind]}）`, at: 0 });
  ev.push({ t: 'fx', type: 'summon', who, at: 150 });
  ev.push({ t: 'st', who, s: o.n, col: '#d8c8ff', at: 200 });
  ev.push({ t: 'end', at: 650 });
  return ev;
}
/* 單位用的施放者（不影響自己的連續、蓄力、冷卻） */
const unitCaster = (me, hp) => ({
  uid: me.uid,
  hp: hp || me.hp,
  mp: 9999,
  lv: me.lv,
  buffs: me.buffs,
  stacks: 0,
  pets: []
});
const shiftEv = (list, t0) => list.filter(f => f.t !== 'end').map(f => ({ ...f, at: (f.at || 0) + t0 }));
const evEnd = list => list.reduce((a, f) => Math.max(a, f.at || 0), 0);
/* 引爆地雷：每顆打目前的目標（範圍技能打全部），每多一顆每顆 +10% */
function mineBlast(me, st, es, ti, party, ext = {}) {
  const ms = me.mines || [],
    n = ms.length;
  let ev = [{ t: 'msg', s: `引爆 ${n} 顆地雷！`, at: 0 }],
    at = 150;
  me.mines = [];
  for (const m of ms) {
    if (!aliveIdx(es).length) break;
    const e2 = actResolve(unitCaster(me), st, { ...m.sk, mult: m.sk.mult * (1 + 0.1 * (n - 1)) }, es, ti, party, ext);
    ev = ev.concat(shiftEv(e2, at));
    at = evEnd(ev) + 120;
  }
  ev.push({ t: 'end', at: at + 200 });
  return ev;
}
/* 自己行動後：圖騰與砲台施放（petsAct 呼叫） */
function unitsAct(me, st, es, t0) {
  let ev = [],
    at = t0;
  me.units = (me.units || []).filter(u => u.turns > 0 && (u.kind !== 'totem' || u.hp > 0));
  for (const u of me.units) {
    if (u.cry) {
      const tmp = [];
      addBuff(me, { name: u.n, buff: { ...u.cry, id: 'u_' + u.n, n: u.n } }, tmp);
      ev.push({ t: 'msg', s: `${u.n}：${u.cry.n || '鼓舞'}`, at }, ...shiftEv(tmp, at));
      at += 400;
    } else if (u.sk.mult > 0 && aliveIdx(es).length) {
      const L = aliveIdx(es),
        e2 = actResolve(unitCaster(me, u.hp), st, u.sk, es, L[fl(Math.random() * L.length)], [me]);
      ev.push({ t: 'msg', s: `${u.n}施放`, at });
      ev = ev.concat(shiftEv(e2, at + 80));
      at = evEnd(ev) + 120;
    }
    u.turns--;
  }
  me.units = me.units.filter(u => u.turns > 0);
  return ev;
}
/* 戰吼：吼全部敵人，效果常常跟敵人數有關（最多算 5 隻） */
function cryResolve(me, st, sk, es, party, ext, ev) {
  const L = aliveIdx(es),
    c = Math.min(5, L.length),
    who = me.uid;
  ev.push({ t: 'msg', s: `${sk.name}！吼到 ${L.length} 隻敵人`, at: 0 });
  ev.push({ t: 'fx', type: 'summon', who, at: 100 });
  L.forEach((i, n) => ev.push({ t: 'lunge', i, at: 150 + n * 40 }));
  if (sk.buff) {
    const b = { ...sk.buff };
    if (sk.perFoe) for (const k in sk.perFoe) b[k] = (b[k] || 0) + sk.perFoe[k] * c * (1 + (sk.cryMul || 0) / 100);
    if (sk.lowMeBuff) b.more = (b.more || 0) + sk.lowMeBuff * fl((1 - me.hp / st.maxhp) * 10);
    (sk.party ? party.filter(q => q.alive !== false) : [me]).forEach(q => addBuff(q, { ...sk, buff: b }, ev));
  }
  if (sk.emp) {
    me.empN = c;
    me.empMore = sk.emp;
    ev.push({ t: 'st', who, s: `強化 ${c} 次`, col: '#ffd166', at: 260 });
  }
  if (sk.fear)
    L.forEach(i => {
      const e = es[i];
      if (e.hp < (e.maxhp * sk.fear) / 100) {
        e.stun = 1;
        ev.push({ t: 'st', i, s: '恐懼', col: '#c8b0ff', at: 300 });
      }
    });
  if (sk.cryCurse)
    L.forEach(i => {
      const e = es[i];
      e.curse = 3;
      e.curseP = Math.max(e.curseP || 0, sk.cryCurse);
      e.curseW = Math.max(e.curseW || 0, sk.cryWeak || 0);
      ev.push({ t: 'st', i, s: '震懾', col: '#c86aff', at: 320 });
    });
  if (sk.avUp && ext.av)
    party
      .filter(q => q.alive !== false)
      .forEach(q => {
        ext.av[q.uid] = (ext.av[q.uid] || 0) + sk.avUp;
        ev.push({ t: 'st', who: q.uid, s: '行動提前', col: '#9fd4ef', at: 340 });
      });
  ev.push({ t: 'end', at: 700 });
  return ev;
}
function addBuff(me, sk, ev) {
  me.buffs = (me.buffs || []).filter(b => b.id !== sk.buff.id);
  me.buffs.push({
    ...sk.buff,
    id: sk.buff.id || sk.name,
    turns: (sk.buff.turns || 3) + (sk.buffT || 0),
    cry: sk.cry ? 1 : 0
  });
  if (sk.buff.shield) me.shield = Math.round((me.st ? me.st.maxhp : 100) * sk.buff.shield);
  ev.push({ t: 'st', who: me.uid, s: sk.buff.n || sk.name, col: '#9fd4ef', at: 200 });
  ev.push({ t: 'fx', type: 'heal', who: me.uid, at: 150 });
}
/* 召喚物在施放者行動後攻擊隨機敵人 */
function petsAct(me, st, es) {
  const ev = [];
  let at = 0;
  me.pets = (me.pets || []).filter(p => p.turns > 0);
  for (const p of me.pets) {
    const L = aliveIdx(es);
    if (!L.length) break;
    const i = L[fl(Math.random() * L.length)],
      e = es[i],
      base = (8 + (me.lv || S.lv) * 1.8) * (p.mult || 1) * (1 + ((st.petPct || 0) + (p.pct || 0)) / 100),
      pk = { phys: 0, fire: 0, cold: 0, light: 0, chaos: 0 };
    pk[p.el || 'phys'] = base * rnd(0.85, 1.15) * (p.el && p.el !== 'phys' ? st.spellMul || 1 : 1);
    const d = Math.round(mitigate(pk, e.arm, e.res, e.shock > 0));
    e.hp = Math.max(0, e.hp - d);
    ev.push({ t: 'hit', i, d, col: '#d8c8ff', fx: 'slash', pet: 1, at });
    if (e.hp <= 0) ev.push({ t: 'kill', i, at: at + 100 });
    p.turns--;
    at += 260;
  }
  const ue = unitsAct(me, st, es, at);
  ev.push(...ue);
  if (ue.length) at = evEnd(ev) + 100;
  if (ev.length) ev.push({ t: 'end', at: at + 150 });
  return ev;
}
/* 敵人 i 的行動（單人與組隊共用）：先結算持續傷害，再攻擊隊員；party 是 [{uid, hp, mp, st, guard, …}] */
/* 0.3.35 敵人身上的持續傷害與狀態倒數：每 TURN_S 秒一跳（以前是敵人自己行動時才算） */
function enemyDot(es, i) {
  const e = es[i],
    ev = [];
  let at = 0;
  const dot = (n, col) => {
    e.hp = Math.max(0, e.hp - n);
    ev.push({ t: 'hit', i, d: n, col, dot: 1, at });
    at += 180;
  };
  if (e.poison > 0) {
    dot(poisonTick(e, e), '#9be36b');
    if (!--e.poison) e.poisonN = 0;
  }
  if (e.burn > 0) {
    dot(e.burnDmg, '#ffb15a');
    e.burn--;
  }
  if (e.bleed > 0) {
    dot(bleedTick(e), '#ff5a5a');
    if (!--e.bleed) e.bleedN = 0;
  }
  if (e.shock > 0) e.shock--;
  if (e.curse > 0) e.curse--;
  if (e.slow > 0) e.slow--;
  if (e.vul > 0) e.vul--;
  if (e.dmark > 0) e.dmark--;
  if (e.rage > 0) e.rage--;
  if (e.hp <= 0) ev.push({ t: 'kill', i, at });
  return ev;
}
/* 一跳（TURN_S 秒）要結算的全部事件：每隻敵人的持續傷害、隊員的回復與增益倒數、召喚物與圖騰行動（單人與組隊共用） */
function tickResolve(es, party) {
  let ev = [];
  for (const i of aliveIdx(es)) ev = ev.concat(shiftEv(enemyDot(es, i), ev.length ? evEnd(ev) + 120 : 0));
  for (const p of party) {
    if (p.alive === false || p.hp <= 0) continue;
    roundEnd(p);
    const pe = petsAct(p, p.st, es);
    if (pe.length) ev = ev.concat(shiftEv(pe, ev.length ? evEnd(ev) + 120 : 0));
  }
  if (ev.length) ev.push({ t: 'end', at: evEnd(ev) + 150 });
  return ev;
}
function enemyResolve(es, i, party, ext = {}) {
  const e = es[i],
    ev = [];
  let at = 0;
  if (e.frozen || e.stun) {
    ev.push({ t: 'msg', s: `${e.name} ${e.frozen ? '被凍住' : '暈眩中'}，無法行動`, at });
    e.frozen = e.stun = 0;
    ev.push({ t: 'end', at: at + 700 });
    return ev;
  }
  /* 0.3.22 陷阱：敵人行動時先觸發一個 */
  {
    const owner = party.find(p => p.alive !== false && p.traps && p.traps.length);
    if (owner) {
      const tr = owner.traps.shift();
      ev.push({ t: 'msg', s: `${e.name} 觸發了${tr.n}！`, at });
      const e2 = actResolve(unitCaster(owner), owner.st, tr.sk, es, i, party, ext);
      ev.push(...shiftEv(e2, at + 100));
      at = evEnd(ev) + 150;
      if (e.hp <= 0) {
        ev.push({ t: 'end', at: at + 200 });
        return ev;
      }
      if (e.frozen || e.stun) {
        ev.push({ t: 'msg', s: `${e.name} ${e.frozen ? '被凍住' : '暈眩中'}，無法行動`, at });
        e.frozen = e.stun = 0;
        ev.push({ t: 'end', at: at + 700 });
        return ev;
      }
    }
  }
  if (e.sin && ext.sinTurn) ext.sinTurn(e, i);
  /* 0.3.25 七罪的信徒 */
  let fmul = 1;
  if (e.trait) {
    const r = followerTurn(e, i, es, party, at);
    ev.push(...r.ev);
    at = r.at;
    fmul = r.mul;
    if (r.done || e.hp <= 0) {
      ev.push({ t: 'end', at: at + 200 });
      return ev;
    }
  }
  /* 0.3.24 四凶與燭龍 */
  if (e.xiong || e.zhulong) {
    const r = beastTurn(e, i, party, at);
    ev.push(...r.ev);
    at = r.at;
    if (r.done) {
      ev.push({ t: 'end', at: at + 200 });
      return ev;
    }
  }
  /* 0.3.23 閻羅王：每 3 次行動用生死簿點名一人（下一次受到的傷害加倍），每 4 次用判官筆抹掉一人的增益 */
  if (e.yama) {
    e.yt = (e.yt || 0) + 1;
    const L = party.filter(p => p.alive !== false && p.hp > 0),
      pk = () => L[fl(Math.random() * L.length)];
    if (L.length && e.yt % 3 === 0) {
      const p = pk();
      p.doom = 1;
      ev.push({ t: 'msg', s: `閻羅王翻開生死簿：點名 ${p.name}！`, at });
      ev.push({ t: 'st', who: p.uid, s: '生死簿', col: '#c86aff', at: at + 120 });
      at += 600;
    }
    if (L.length && e.yt % 4 === 0) {
      const p = pk();
      if ((p.buffs || []).length) {
        p.buffs = [];
        ev.push({ t: 'msg', s: `判官筆一揮，${p.name} 的增益全部消失`, at });
        at += 600;
      }
    }
  }
  /* 0.3.38 怪物招式：冷卻好的招式有機率放出來（monskill.js） */
  {
    const mk = monPick(e, !!ext.boss && i === 0, es);
    if (mk) {
      const r = monCast(mk, e, i, es, party, at, ext);
      ev.push(...r.ev);
      return ev;
    }
  }
  /* 0.3.10：迅捷改成靠速度（行動值）多行動，不再另外骰行動兩次 */
  const acts = 1,
    ew = ext.ew || 0;
  for (let n = 0; n < acts; n++) {
    const alive = party.filter(p => p.alive !== false && p.hp > 0);
    if (!alive.length) break;
    /* 嘲諷：每 1% 嘲諷讓自己被選中的權重 +1% */
    /* 0.3.22 圖騰也會被打（嘲諷越高越常被選） */
    const tots = alive.flatMap(q => (q.units || []).filter(u => u.kind === 'totem' && u.hp > 0).map(u => ({ q, u }))),
      wt = alive
        .map(q => 1 + ((q.st.taunt || 0) + bsum(q, 'taunt')) / 100)
        .concat(tots.map(o => 0.7 + (o.u.taunt || 0) / 100));
    let x = Math.random() * wt.reduce((a, b) => a + b, 0),
      pi = 0;
    while (pi < wt.length - 1 && (x -= wt[pi]) >= 0) pi++;
    /* 窮奇：專挑生命比例最低的人 */
    if (e.xiong === 'qiongqi')
      pi = alive.reduce((b, q, k) => (q.hp / q.st.maxhp < alive[b].hp / alive[b].st.maxhp ? k : b), 0);
    if (pi >= alive.length) {
      const { q, u } = tots[pi - alive.length],
        d = Math.max(1, Math.round(e.atk * rnd(0.9, 1.1) * (1 - Math.min(60, q.st.dmgRed || 0) / 100)));
      u.hp = Math.max(0, u.hp - d);
      ev.push({ t: 'msg', s: `${e.name} 攻擊${u.n}`, at });
      ev.push({ t: 'lunge', i, at });
      ev.push({ t: 'st', who: q.uid, s: `${u.n} -${d}${u.hp <= 0 ? '（毀壞）' : ''}`, col: '#ffb27a', at: at + 210 });
      at += 600;
      continue;
    }
    const p = alive[pi],
      st = p.st,
      strong = Math.random() < 0.15;
    ev.push({
      t: 'msg',
      s: strong ? `${e.name} 的猛力一擊！` : `${e.name} 攻擊${party.length > 1 ? ' ' + p.name : ''}`,
      at
    });
    ev.push({ t: 'lunge', i, at });
    at += 210;
    if (Math.random() * 100 < Math.min(75, (st.dodge || 0) + bsum(p, 'dodge'))) {
      ev.push({ t: 'dodge', who: p.uid, at });
      if (st.dodgeCrit) p.dc = 1;
      /* 閃避反擊：用普通攻擊的一部分傷害打回去 */
      if (st.counter) {
        const pk = heroPacket(st, SKILLS.attack, st.counter / 100),
          r = heroDmg(st, pk, e, e.shock > 0, p);
        e.hp = Math.max(0, e.hp - r.d);
        ev.push({ t: 'hit', i, d: r.d, crit: r.crit, col: '#ffd166', fx: 'pierce', from: p.uid, at: at + 120 });
        if (e.hp <= 0) {
          ev.push({ t: 'kill', i, at: at + 220 });
          break;
        }
      }
      at += 480;
      continue;
    }
    let atk = e.atk * (strong ? 1.5 : 1) * rnd(0.9, 1.1) * fmul * (e.rage > 0 ? 1.35 : 1);
    /* 金冠貴族：對生命比例比自己低的目標 ×1.5 */
    if (e.trait === 'bully' && p.hp / st.maxhp < e.hp / e.maxhp) atk *= 1.5;
    if (e.mods && e.mods.includes('fury') && e.hp < e.maxhp / 2) atk *= 1.5;
    if (e.curse > 0 && e.curseW) atk *= 1 - e.curseW / 100;
    const pk = { phys: 0, fire: 0, cold: 0, light: 0, chaos: 0 };
    pk[e.el] += atk;
    if (e.mods) {
      if (e.mods.includes('fire')) pk.fire += atk * 0.4;
      if (e.mods.includes('cold')) pk.cold += atk * 0.4;
      if (e.mods.includes('shock')) pk.light += atk * 0.4;
    }
    let d = Math.round(
      mitigate(
        pk,
        st.armor * (p.guard > 0 ? 2 : 1) * (1 + bsum(p, 'arm') / 100),
        (Array.isArray(st.res) ? st.res : [st.res.fire, st.res.cold, st.res.light, st.res.chaos || 0]).map((v, k) =>
          k < 3 ? v - ew : v
        ),
        false
      ) *
        (1 - Math.min(75, (st.dmgRed || 0) + bsum(p, 'dmgRed')) / 100)
    );
    if (st.block && Math.random() * 100 < st.block) {
      d = Math.round(d * 0.3);
      ev.push({ t: 'st', who: p.uid, s: '格擋', col: '#9fd4ef', at });
    }
    /* 生死簿應驗：被點名的人這一下傷害加倍 */
    if (p.doom) {
      d *= 2;
      p.doom = 0;
      ev.push({ t: 'st', who: p.uid, s: '生死簿應驗', col: '#c86aff', at });
    }
    const toMp = takeDmg(p, st, d);
    if (e.trait) ev.push(...followerAfter(e, p, d, ext, at + 80));
    /* 蓄力中被打：倍數 ×0.75（最低 1） */
    if (p.chg && d > 0) {
      p.chg.mul = Math.max(1, Math.round(p.chg.mul * 0.75 * 100) / 100);
      ev.push({ t: 'st', who: p.uid, s: '蓄力受干擾', col: '#ffb27a', at: at + 60 });
    }
    ev.push({
      t: 'dmg',
      who: p.uid,
      d: d - toMp,
      mp: toMp,
      strong,
      col:
        pk.chaos > pk.phys
          ? '#c86aff'
          : pk.fire > pk.phys
            ? '#ffb15a'
            : pk.cold > pk.phys
              ? '#9fe7ff'
              : pk.light > pk.phys
                ? '#fff27a'
                : '#ff8a8a',
      at
    });
    if (st.reflectPct) {
      const rf = Math.max(1, Math.round((d * st.reflectPct) / 100));
      e.hp = Math.max(0, e.hp - rf);
      ev.push({ t: 'hit', i, d: rf, col: '#9fd4ef', at: at + 120 });
    }
    if (e.mods && e.mods.includes('leech')) {
      const hl = Math.round(d * 0.15);
      if (hl > 0) e.hp = Math.min(e.maxhp, e.hp + hl);
    }
    if (pk.cold > 0 && !st.noFreeze && Math.random() < 0.12 && p.hp > 0) {
      p.frozen = 1;
      ev.push({ t: 'st', who: p.uid, s: '凍結', col: '#9fe7ff', at: at + 100 });
    }
    if (p.hp <= 0) {
      p.alive = false;
      ev.push({ t: 'down', who: p.uid, at: at + 200 });
    }
    if (e.hp <= 0) {
      ev.push({ t: 'kill', i, at: at + 220 });
      break;
    }
    at += 520;
  }
  ev.push({ t: 'end', at: at + 200 });
  return ev;
}
/* 0.3.10 行動值：每個單位依速度累積行動值，先滿 AV_MAX 的先行動（滿了扣掉 AV_MAX 繼續累積）。
   速度是對方兩倍就能連續行動兩次；units 是 [{id, spd}]，av 是 {id: 目前的行動值}（同時滿的照 units 的順序） */
const AV_MAX = 100;
/* 0.3.19：衰老讓敵人行動值變慢（×0.6）；增益的 spd 讓自己變快 */
const avSpd = u =>
  Math.max(1, ((u.st ? u.st.speed : u.speed) || 10) * (u.slow > 0 ? 0.6 : 1) * (1 + bsum(u, 'spd') / 100));
function avNext(av, units) {
  let best = null,
    bt = Infinity;
  for (const u of units) {
    const t = (AV_MAX - (av[u.id] || 0)) / u.spd;
    if (t < bt - 1e-9) {
      bt = t;
      best = u;
    }
  }
  if (!best) return null;
  bt = Math.max(0, bt);
  for (const u of units) av[u.id] = (av[u.id] || 0) + u.spd * bt;
  av[best.id] -= AV_MAX;
  return best.id;
}
/* 接下來 n 次行動的預測（行動順序橫列用，不改動 av） */
const avPreview = (av, units, n) => {
  const c = { ...av };
  return Array.from({ length: n }, () => avNext(c, units));
};
/* ================= 0.3.35 即時行動條（單人與組隊共用） =================
   時間照真的跑：每個單位的行動條依速度填滿（速度 10 每 TURN_S 秒滿一次），滿了就能行動；
   持續效果（中毒、燃燒、增益、回復、召喚物與圖騰…）每 TURN_S 秒結算一跳，資料裡的「回合」就是 TURN_S 秒；
   技能冷卻以秒計（sk.cd），冷卻縮減 cdr 最多 CDR_MAX%。結算動畫播放時時間暫停。 */
const TURN_S = 3,
  ATB_K = AV_MAX / (10 * TURN_S),
  CDR_MAX = 40,
  AUTO_WAIT = 0.8;
/* 回合數 → 秒（說明文字用） */
const secs = n => Math.round(n * TURN_S * 10) / 10;
/* 冷卻縮減（%）：屬性 cdr（裝備、天賦、契靈）＋輔助寶石，上限 CDR_MAX */
const cdrOf = (st, sk) => Math.min(CDR_MAX, ((st && st.cdr) || 0) + (supOf(st, sk).cdr || 0));
/* 這招放完的冷卻秒數：技能本身 cd ＋ 輔助寶石加的 cdAdd（自動施放），再套冷卻縮減 */
const skCdS = (st, sk) =>
  Math.round(Math.max(0, (sk.cd || 0) + (supOf(st, sk).cdAdd || 0)) * (1 - cdrOf(st, sk) / 100) * 10) / 10;
/* 時間前進 dt 秒：冷卻倒數，有技能冷卻好了回傳 true（要重畫按鈕） */
function cdTick(p, dt) {
  let done = false;
  if (p.cd)
    for (const k in p.cd)
      if ((p.cd[k] -= dt) <= 0) {
        delete p.cd[k];
        done = true;
      }
  return done;
}
/* 自動施放：輔助寶石 auto 插著的技能，冷卻好、付得起就自動放（照技能欄順序，第一個能放的）；
   行動條滿了先等 AUTO_WAIT 秒，這段時間自己下指令就不會自動放 */
const autoPick = (o, me, st, sks) => sks.findIndex(q => q && supOf(st, q).auto && skReady(o, me, skSt(st, q), q));
/* 每一跳（TURN_S 秒）：回復、防禦與增益倒數、昇華的扣血代價（0.3.35 起照時間，不再是輪到自己才算） */
function roundEnd(p) {
  const st = p.st;
  if (p.alive === false || p.hp <= 0) return;
  if (st.regen) p.hp = Math.min(st.maxhp, p.hp + st.regen);
  if (st.manaRegen) p.mp = Math.min(st.maxmp, p.mp + st.manaRegen);
  /* 0.3.25 信徒造成的中毒、流血（每跳扣血） */
  if (p.pdot && p.pdot.turns > 0) {
    p.hp = Math.max(1, p.hp - p.pdot.n);
    if (!--p.pdot.turns) p.pdot = null;
  }
  /* 0.3.21 隊友光環的回血（每跳 hot% 生命） */
  if (bsum(p, 'hot')) p.hp = Math.min(st.maxhp, p.hp + Math.round((st.maxhp * bsum(p, 'hot')) / 100));
  if (st.hpDrain) p.hp = Math.max(1, p.hp - Math.round((st.maxhp * st.hpDrain) / 100));
  if (p.guard > 0) p.guard--;
  p.buffs = (p.buffs || []).filter(b => --b.turns > 0);
}
/* 開場：昇華的護盾、先制增益 */
function battleOpen(p) {
  const st = p.st;
  if (st.shieldPct) p.shield = Math.round((st.maxhp * st.shieldPct) / 100);
  /* 馴獸師：戰鬥開始就帶著野狼 */
  if (st.petStart) {
    const w = MONS.find(m => m.spr === 'wolf');
    p.pets = (p.pets || []).concat(
      Array.from({ length: st.petStart }, () => ({ name: '野狼', spr: 'wolf', pal: w && w.pal, mult: 0.9, turns: 99 }))
    );
  }
  if (!st.keepStacks) p.stacks = 0;
}

/* ================= battle: solo ================= */
/* 單人的自己：hp、mp 直接讀寫 S，其他是這場戰鬥的狀態 */
function heroMe() {
  return {
    uid: 'me',
    get name() {
      return S.name || '你';
    },
    get hp() {
      return S.hp;
    },
    set hp(v) {
      S.hp = v;
    },
    get mp() {
      return S.mp;
    },
    set mp(v) {
      S.mp = v;
    },
    lv: S.lv,
    st: stats(),
    guard: 0,
    frozen: 0,
    shield: 0,
    dc: 0,
    stacks: S.stacks || 0,
    pets: [],
    buffs: []
  };
}
/* 0.3.35 開場的行動條：你先有一半，敵人隨機 0～30（不會全部同時出手） */
const atbStart = es => {
  const av = { me: AV_MAX * 0.5 };
  es.forEach((_, i) => (av['e' + i] = Math.random() * AV_MAX * 0.3));
  return av;
};
/* e 可以是一隻敵人或陣列；opts.pack 會依稀有度帶小怪 */
function startBattle(e, opts = {}) {
  if (B) return;
  closeSheet();
  if (!Array.isArray(e)) for (const k of ['ud', 'mist', 'uw']) if (opts[k]) e[k] = opts[k];
  const es = (
    Array.isArray(e) ? e : [e, ...(opts.pack ? packOf(e, opts.extra || 0, opts.packN || 0, opts.packSeed) : [])]
  ).map(eInit);
  es.forEach((x, k) => (x.msk = monSkills(x, !!opts.boss && k === 0)));
  B = {
    ...opts,
    e: es[0],
    es,
    ti: 0,
    me: heroMe(),
    hold: true,
    anim: false,
    over: false,
    ready: false,
    sub: null,
    act: -1,
    av: atbStart(es),
    tick: 0
  };
  BLOG = [];
  $('binfo').hidden = true;
  /* 0.3.25 在被攻佔的城鎮裡：套用城鎮特效 */
  {
    const sm = siegeApply(B);
    if (sm) setTimeout(() => toast(sm), 400);
  }
  battleOpen(B.me);
  simTarget = null;
  BFX.pops = [];
  BFX.fx = [];
  BFX.en = es.map(() => ({ a: null, flash: 0 }));
  BFX.hero = { a: null };
  BFX.motes = Array.from({ length: 30 }, () => ({
    x: Math.random(),
    y: Math.random(),
    v: rnd(0.0005, 0.0015),
    p: Math.random() * 6.28
  }));
  sfx('encounter');
  buzz(60);
  $('battle').hidden = false;
  renderBHud();
  sizeBattle();
  paintBG(opts.bg || es[0].bg || 'meadow');
  BFX.t0 = performance.now();
  playSong(B.boss || es.some(q => q.rar >= 2) ? 'boss' : 'battle');
  renderBHud();
  bmsg(
    es.length > 1
      ? `${es[0].name} 帶著 ${es.length - 1} 隻同伴出現了！`
      : es[0].rar
        ? `${RNAME[es[0].rar]}怪物：${es[0].name}`
        : `${es[0].name} 出現了！`
  );
  later(700, () => (B.hold = false));
}
/* 點畫面上的敵人換目標（單人與組隊共用） */
function pickTarget(x, y) {
  const es = B ? B.es : MB ? MB.es : null,
    boss = B ? B.boss : MB && MB.boss;
  if (!es) return;
  let best = -1,
    bd = 1e9;
  es.forEach((e, i) => {
    if (e.hp <= 0) return;
    const q = epos(i, es, boss),
      d = Math.hypot(q.x - x, q.y - 8 * q.s - y);
    if (d < bd && d < 14 * q.s + 30) {
      bd = d;
      best = i;
    }
  });
  if (best < 0) return;
  sfx('tap');
  if (B) {
    B.ti = best;
    renderBHud();
  } else {
    MB.tg = best;
    renderMBHud();
  }
}
$('bview').addEventListener('pointerdown', ev => {
  if (ev.target.closest('button')) return;
  const r = $('bview').getBoundingClientRect();
  pickTarget(ev.clientX - r.left, ev.clientY - r.top);
});
function renderBHud() {
  if (!B) return;
  const st = stats(),
    es = B.es;
  if (!es[B.ti] || es[B.ti].hp <= 0) B.ti = Math.max(0, aliveIdx(es)[0] ?? 0);
  const e = es[B.ti],
    q = epos(B.ti, es, B.boss),
    p = POS();
  $('bname').innerHTML =
    `<span style="color:${RCOL[e.rar || 0]}">${esc(e.name)}</span><small>Lv${e.lv}${B.boss && B.ti === 0 ? '・首領' : ''}${e.mods && e.mods.length ? '・' + modNames(e) : ''}</small>`;
  placeBName(q);
  {
    /* 0.3.10：依行動值預測接下來的 7 次行動；正在行動的放最前面 */
    const me = { n: S.name || '你', c: 'me', img: portrait(heroSpr('F'), heroPal()) },
      /* 0.3.24 混沌、夜晚的燭龍：行動順序看不到 */
      eo = i =>
        es[i].hideAv
          ? { n: '？？？', c: 'e', img: iconURL('eye') }
          : { n: shortName(es[i]), c: 'e', img: portrait(es[i].spr, es[i].pal) },
      cur = B.act >= 0 ? { ...eo(B.act), on: 1 } : { ...me, on: B.ready && !B.anim && !B.over },
      nx = avPreview(B.av || {}, soloUnits(), 6).map(id => (id === 'me' ? me : eo(+id.slice(1))));
    renderOrder([cur, ...nx]);
  }
  setFloor(
    D ? `${D.kind === 'rift' ? '裂隙' : ''}第 ${D.room + 1}/${D.spec.floors} ${D.kind === 'rift' ? '波' : '層'}` : ''
  );
  $('bstat').hidden = true;
  const sc = battleSc(),
    big = bossBar(B.boss ? es[0] : es.find(o => (o.rar || 0) >= 3 && o.hp > 0), B.boss && es[0].hp > 0);
  $('bname').hidden = big && (B.ti === 0 || !B.boss);
  $('eail').innerHTML = '';
  placeAil('hail', p.hx + 6 * sc, p.hy - 16 * sc, heroAilHTML(B.me));
  const hp = $('hpills');
  hp.style.left = p.hx + 'px';
  hp.style.top = p.hy + 14 + 'px';
  /* 單人的玩家面板：名字與等級、生命（數值）、魔力（數值）、經驗細條 */
  const bar = (cls, v, max, txt) =>
    `<i class="hb ${cls}"><i style="width:${Math.max(0, Math.min(100, (v / max) * 100))}%"></i>${txt ? `<em>${txt}</em>` : ''}</i>`;
  hp.innerHTML = `<div class="hpanel${S.hp < st.maxhp * 0.3 ? ' low' : ''}"><div class="hrow"><b>${esc(S.name || '你')}</b><span>Lv${S.lv}</span></div>${bar('hhp', S.hp, st.maxhp, `${Math.max(0, Math.ceil(S.hp))} / ${st.maxhp}`)}${bar('hmp', S.mp, st.maxmp, `${Math.max(0, Math.round(S.mp))} / ${st.maxmp}`)}${avBar('me')}</div>`;
  $('epills').innerHTML = enemyBars(es, es.length > 1 ? B.ti : -1, B.boss);
  const sks = mySkills(),
    sk = sks.map((q, i) => q && 's' + i).filter(Boolean),
    dis = !B || B.over ? 'disabled' : '';
  /* 0.3.44 還沒輪到你時按技能＝預選（B.queued，按鈕閃金框），輪到你就自動放 */
  const cb = (label, icon, sub, act, data, disabled, extra = '') =>
    `<button class="cb ${extra}${B.queued && data === `data-k="${B.queued}"` ? ' q' : ''}" data-act="${act}" ${data} ${disabled || dis}><img src="${icoSrc(icon)}" alt="">${label}${sub ? `<small>${sub}</small>` : ''}</button>`;
  const noPot = st.noPotion;
  const slot = k => {
    const q = k && sks[+k.slice(1)];
    return q
      ? cb(
          q.name + cdMask(q),
          skIcon(q.k, q.icon),
          skSub(st, q, B.me, es, B.ti),
          'skill',
          `data-k="${k}"`,
          skReady(S, B.me, skSt(st, q), q) ? '' : 'disabled'
        )
      : '';
  };
  const potB = (k, label, icon, no) =>
    cb(
      label + potMask(k),
      icon,
      no ? '無法使用' : '×' + S[k],
      'bitem',
      `data-k="${k}"`,
      S[k] && !no && !potLeft(B.me, k) ? '' : 'disabled'
    );
  /* 0.3.27：左邊兩欄 6 格都是技能；右邊一欄是攻擊、生命／魔力藥水、逃跑（有地雷時逃跑上面多一顆「引爆地雷」） */
  const six = [0, 1, 2, 3, 4, 5].map(i =>
      sks[i]
        ? slot('s' + i)
        : `<button class="cb empty" disabled><img src="${iconURL('book')}" alt="">空的技能欄</button>`
    ),
    pot = potB('potions', '生命藥水', 'heart', noPot),
    eth = potB('ethers', '魔力藥水', 'ice'),
    run = cb('逃跑', 'run', D ? '無法逃跑' : '', 'flee', '', D || pBusy() ? 'disabled' : '', 'run'),
    mn = (B.me.mines || []).length;
  $('bcmd').classList.add('six');
  let html =
    six[0] +
    six[1] +
    cb('攻擊', skIcon('attack', 'axe'), '', 'skill', 'data-k="attack"', '', 'atk') +
    six[2] +
    six[3] +
    `<div class="brow2">${pot}${eth}</div>` +
    six[4] +
    six[5] +
    (mn
      ? `<div class="brow2">${cb('引爆地雷', 'flame', `×${mn}`, 'skill', 'data-k="mines"', '', 'mine')}${run}</div>`
      : run);
  if (B.sub === 'skills')
    html += `<div class="bsub">${sk.length ? sk.map(slot).join('') : '<p class="sub">技能欄是空的，到「角色 → 技能」裝上技能石</p>'}${cb('返回', 'run', '', 'bsub', 'data-k=""', '')}</div>`;
  if (B.sub === 'items')
    html += `<div class="bsub">${cb('生命藥水', 'heart', noPot ? '昇華代價：無法使用' : '×' + S.potions + '・恢復 40%', 'bitem', 'data-k="potions"', S.potions && !noPot ? '' : 'disabled')}${cb('魔力藥水', 'ice', '×' + S.ethers + '・恢復 50%', 'bitem', 'data-k="ethers"', S.ethers ? '' : 'disabled')}${cb('返回', 'run', '', 'bsub', 'data-k=""', '')}</div>`;
  $('bcmd').innerHTML = html;
  if (!$('binfo').hidden) binfoRender();
}
/* 把結算事件排進畫面：跳數字、特效、動畫；回傳這段要播多久 */
function playEv(ev) {
  let end = 0;
  const p = POS();
  for (const f of ev) {
    end = Math.max(end, f.at || 0);
    later(f.at || 0, () => {
      const es = B.es,
        q = f.i != null ? epos(f.i, es, B.boss) : null;
      logEv(f, es, () => '你');
      if (f.t === 'hit') {
        const fe = BFX.en[f.i] || (BFX.en[f.i] = {});
        fe.flash = performance.now();
        anim(fe, 'hurt', 300);
        if (f.from === 'me' && !f.dot && !f.pet) {
          if (f.fx === 'slash' || f.fx === 'whirl') anim(BFX.hero, 'lunge', 380);
          else anim(BFX.hero, 'cast', 300);
          BFX.fx.push({ type: f.fx, t: performance.now(), dur: f.fx === 'fire' || f.fx === 'ice' ? 600 : 300, i: f.i });
          if (f.fx === 'pierce') BFX.fx.push({ type: 'arrow', t: performance.now() - 200, dur: 260, i: f.i });
        }
        if (f.pet) BFX.fx.push({ type: 'slash', t: performance.now(), dur: 260, i: f.i });
        pop(f.crit ? f.d + '!' : String(f.d), q.x + rnd(-12, 12), etop(q) + 24, f.col);
        if (f.crit) {
          BFX.shake = performance.now();
          sfx('crit');
          buzz(40);
        } else
          sfx(f.fx === 'fire' ? 'fire' : f.fx === 'ice' ? 'ice' : f.fx === 'bolt' ? 'bolt' : f.dot ? 'tap' : 'hit');
      } else if (f.t === 'kill') {
        (BFX.en[f.i] || (BFX.en[f.i] = {})).dying = performance.now();
        sfx('win');
      } else if (f.t === 'st') {
        if (f.i != null) pop(f.s, q.x, etop(q) + 4, f.col);
        else pop(f.s, p.hx, p.hy - 110, f.col);
      } else if (f.t === 'dmg') {
        anim(BFX.hero, 'hurt', 320);
        BFX.shake = performance.now();
        sfx('hurt');
        buzz(f.strong ? 120 : 50);
        if (f.mp) pop(f.mp + ' MP', p.hx + 30, p.hy - 70, '#6ab8ff');
        pop(String(f.d), p.hx, p.hy - 90, f.col);
      } else if (f.t === 'heal') {
        BFX.fx.push({ type: 'heal', t: performance.now(), dur: 700 });
        sfx('heal');
        pop('+' + f.v, p.hx, p.hy - 90, '#7bd36b');
      } else if (f.t === 'dodge') {
        pop('閃避', p.hx, p.hy - 90, '#d8d2c4');
        sfx('tap');
      } else if (f.t === 'lunge') anim(BFX.en[f.i], 'lunge', 420);
      else if (f.t === 'msg') bmsg(f.s);
      else if (f.t === 'fx') BFX.fx.push({ type: f.type, t: performance.now(), dur: 700 });
      renderBHud();
    });
  }
  return end;
}
const soloExt = () => ({
  sinHit: (e, d, i) => {
    const q = epos(i, B.es, B.boss),
      p = POS();
    return sinHit(e, d, { hx: p.hx, hy: p.hy, ex: q.x, y: q.y });
  },
  sinTurn: (e, i) => {
    const q = epos(i, B.es, B.boss),
      p = POS();
    sinTurn(e, { hx: p.hx, hy: p.hy, ex: q.x, y: q.y });
  },
  ew: curSpec() && curSpec().eleweak ? 20 : 0,
  boss: !!B.boss,
  av: B.av
});
/* ================= 0.3.35 單人的即時行動條 =================
   每幀 soloStep 推進時間：敵人行動條滿了就出手；你的行動條滿了（B.ready）才能下指令，等你的時候時間照樣跑；
   時間一直跑（動畫疊著播），只有開場、換層、打完時停（B.hold／B.over）；B.anim 是你自己的動作還在播，這時不能再下指令。
   敵人出手之間至少隔 STAGGER 毫秒，畫面才不會擠成一團。每 TURN_S 秒結算一跳持續效果（tickResolve）。 */
const STAGGER = 450;
const pBusy = () => !B || !B.ready || !!B.anim || !!B.over;
/* 結算後馬上判斷勝負：t 是這段動畫多長，播完才進結算畫面 */
function soloEnd(t) {
  if (S.hp > 0 && !allDead(B.es)) return false;
  B.over = true;
  later(t + 500, S.hp <= 0 ? loseBattle : winBattle);
  return true;
}
function beginAct() {
  B.queued = null;
  B.ready = false;
  B.av.me = Math.max(0, (B.av.me || 0) - AV_MAX);
  B.anim = true;
  B.sub = null;
  B.nextAct = Math.max(B.nextAct || 0, performance.now() + STAGGER);
}
function useSkill(k, auto) {
  /* 0.3.44 預選：還沒輪到你（或動畫還在播）時按的技能先記著，再按一次取消 */
  if (B && !B.over && !auto && (!B.ready || B.anim)) {
    B.queued = B.queued === k ? null : k;
    sfx('tap');
    if (B.queued) bmsg(`預選：${k === 'mines' ? '引爆地雷' : (skByKey(k, mySkills()) || {}).name || '攻擊'}`);
    renderBHud();
    return;
  }
  /* 0.3.22 引爆地雷：不花魔力，用掉這次行動 */
  if (k === 'mines') {
    if (pBusy() || !(B.me.mines || []).length) return;
    beginAct();
    sfx('select');
    bmsg('引爆地雷');
    B.me.st = stats();
    const ev = mineBlast(B.me, B.me.st, B.es, B.ti, [B.me], { ...soloExt(), av: B.av }),
      t = playEv(ev);
    renderBHud();
    if (!soloEnd(t)) later(t + 150, afterPlayer);
    return;
  }
  const sk = skByKey(k, mySkills()),
    st0 = sk && skSt(stats(), sk);
  if (pBusy() || !sk || !skReady(S, B.me, st0, sk)) return;
  beginAct();
  if (!charging(B.me, sk)) payCost(S, stats(), sk);
  sfx('select');
  bmsg(auto ? `自動施放・${sk.name}` : sk.name, `你${auto ? '自動施放' : '使用'} ${sk.name}`);
  B.me.st = stats();
  B.me.lv = S.lv;
  const ev = actResolve(B.me, B.me.st, sk, B.es, B.ti, [B.me], {
    ...soloExt(),
    allyMul: 1,
    av: B.av
  });
  if (sk.kind === 'spell') {
    anim(BFX.hero, 'cast', 500);
    BFX.fx.push({ type: 'charge', t: performance.now(), dur: 450 });
  }
  renderBHud();
  const t = playEv(ev);
  if (!soloEnd(t)) later(t + 150, afterPlayer);
}
function bItem(k) {
  if (!B || B.over || !S[k] || potLeft(B.me, k)) return;
  const st = stats();
  if (k === 'potions' && st.noPotion) return;
  /* 0.3.44 喝藥水不用掉行動條，改成這種藥水冷卻 POT_CD 秒 */
  potStart(B.me, k);
  sfx('heal');
  const p = POS(),
    hm = st.healMul * (curSpec() && curSpec().noregen ? 0.5 : 1) * (1 + (st.potPct || 0) / 100);
  S[k]--;
  if (k === 'potions') {
    /* 0.3.25 暴食攻佔的城鎮：藥水回復量減半 */
    const v = Math.round(st.maxhp * 0.4 * hm * (B.siegeK === 'gluttony' ? 0.5 : 1));
    S.hp = Math.min(st.maxhp, S.hp + v);
    pop('+' + v, p.hx, p.hy - 90, '#7bd36b');
    if (st.legGlut) S.mp = Math.min(st.maxmp, S.mp + v);
  } else {
    const v = Math.round(st.maxmp * 0.5 * hm);
    S.mp = Math.min(st.maxmp, S.mp + v);
    pop('+' + v + ' MP', p.hx, p.hy - 90, '#6ab8ff');
  }
  BFX.fx.push({ type: 'heal', t: performance.now(), dur: 700 });
  bmsg(k === 'potions' ? '生命藥水' : '魔力藥水', `你喝了${k === 'potions' ? '生命藥水' : '魔力藥水'}`);
  /* 鍊金術士：喝藥水時順便丟藥瓶炸所有敵人 */
  let t = 0;
  if (st.potBomb) {
    const ev = [];
    aliveIdx(B.es).forEach(i => {
      const e = B.es[i],
        d = Math.round(
          mitigate(
            { phys: 0, fire: (st.physLo + st.physHi) * 0.5 * (st.potBomb / 100), cold: 0, light: 0 },
            e.arm,
            e.res,
            false
          )
        );
      e.hp = Math.max(0, e.hp - d);
      ev.push({ t: 'hit', i, d, col: '#ffb15a', fx: 'fire', from: 'me', at: 300 });
      if (e.hp <= 0) ev.push({ t: 'kill', i, at: 400 });
    });
    t = playEv(ev);
  }
  renderBHud();
  soloEnd(t);
}
function flee() {
  if (pBusy() || D) return;
  beginAct();
  sfx('select');
  renderBHud();
  if (Math.random() < 0.7) {
    bmsg('成功逃跑！');
    addLog(`從 ${B.e.name} 身邊逃走了`);
    B.over = true;
    later(700, () => endBattle());
  } else {
    bmsg('逃跑失敗！');
    later(700, afterPlayer);
  }
}
const allDead = es => es.every(e => e.hp <= 0);
/* 你的行動播完：全滅就勝利；昇華的「再行動一次」直接把行動條補滿 */
function afterPlayer() {
  if (B.over) return;
  if (B.me.st.extraTurn && Math.random() * 100 < B.me.st.extraTurn) {
    bmsg('再行動一次！');
    B.av.me = AV_MAX;
  }
  B.anim = false;
  renderBHud();
}
/* 0.3.10 行動值：單人戰鬥裡的你（id 'me'）與每隻活著的敵人（'e' + 索引） */
const soloUnits = () => [
  { id: 'me', spd: avSpd(B.me) },
  ...aliveIdx(B.es).map(i => ({ id: 'e' + i, spd: avSpd(B.es[i]) }))
];
/* 每幀推進 dt 秒（renderBattle 呼叫） */
function soloStep(dt) {
  if (!B || B.hold || B.over) return;
  dt = Math.min(dt, 0.1);
  const me = B.me;
  if (cdTick(me, dt)) renderBHud();
  for (const u of soloUnits())
    B.av[u.id] = Math.min(u.id === 'me' ? AV_MAX : AV_MAX * 2, (B.av[u.id] || 0) + u.spd * ATB_K * dt);
  if ((B.tick += dt) >= TURN_S) {
    B.tick -= TURN_S;
    me.st = stats();
    /* 持續效果與召喚物不暫停時間（動畫疊著播）；打完或倒下才停 */
    const ev = tickResolve(B.es, [me]),
      end = ev.length ? playEv(ev) : 0;
    renderBHud();
    if (soloEnd(end)) return;
  }
  /* 敵人：行動條滿了就出手（同時滿的，滿越多的先） */
  const rd = aliveIdx(B.es)
    .filter(i => B.av['e' + i] >= AV_MAX)
    .sort((a, b) => B.av['e' + b] - B.av['e' + a]);
  if (rd.length && performance.now() >= (B.nextAct || 0)) {
    B.av['e' + rd[0]] -= AV_MAX;
    return enemyAct(rd[0]);
  }
  if (B.av.me >= AV_MAX && !B.ready && !B.anim) meReady();
  else if (B.ready && (B.readyT += dt) >= AUTO_WAIT && !B.autoDone) {
    B.autoDone = true;
    const ai = autoPick(S, me, (me.st = stats()), mySkills());
    if (ai >= 0) useSkill('s' + ai, true);
  }
}
/* 你的行動條滿了：凍結就跳過這次；有自動施放的技能就直接放 */
function meReady() {
  const me = B.me;
  me.st = stats();
  if (me.frozen) {
    me.frozen = 0;
    B.av.me = 0;
    bmsg('你被凍住了，這次行動跳過');
    renderBHud();
    return;
  }
  B.ready = true;
  B.readyT = 0;
  B.autoDone = false;
  /* 0.3.44 有預選的技能：還能放就馬上放（不用等自動施放） */
  const q = B.queued;
  B.queued = null;
  if (q) {
    const sk = q === 'mines' ? null : skByKey(q, mySkills());
    if (q === 'mines' ? (me.mines || []).length : sk && skReady(S, me, skSt(me.st, sk), sk)) {
      B.autoDone = true;
      return useSkill(q);
    }
    bmsg('預選的技能現在不能放');
  }
  sfx('tap');
  renderBHud();
}
/* 一隻敵人行動 */
function enemyAct(i) {
  const es = B.es;
  B.act = i;
  B.nextAct = performance.now() + STAGGER;
  const ev = enemyResolve(es, i, [B.me], soloExt()),
    t = playEv(ev);
  renderBHud();
  if (soloEnd(t)) return;
  later(t + 100, () => {
    if (B.act !== i) return;
    B.act = -1;
    renderBHud();
  });
}

/* ================= dungeons (shared by solo and party) ================= */
/* 把地圖上的地城／裂隙／試煉整理成一份規格：層數、怪物倍率、附加詞綴、掉寶加成 */
function dunSpec(t) {
  const dt = DTYPES[t.dt || 'normal'],
    mods = (t.mods || []).map(id => DMODI[id]).filter(Boolean),
    dm = { hp: dt.hp, atk: 1, arm: 1 };
  let q = dt.q,
    r = dt.r;
  q += (t.xk || 0) * 15;
  r += (t.xk || 0) * 15;
  for (const m of mods) {
    q += m.q;
    r += m.r;
    if (m.dm) for (const k in m.dm) dm[k] *= m.dm[k];
  }
  const has = id => mods.some(m => m.id === id);
  return {
    dt: t.dt || 'normal',
    floors: t.floors || (t.kind === 'rift' || t.kind === 'landmark' ? 3 : dt.floors),
    mods: mods.map(m => m.id),
    q,
    r,
    dm,
    em: [...new Set([...mods.filter(m => m.em).map(m => m.em), ...(t.umods || [])])],
    norevive: !!dt.norevive,
    sin: t.sin,
    siege: t.siege || 0,
    xk: t.xk || 0,
    noregen: has('noregen'),
    eleweak: has('eleweak'),
    elite: has('elite')
  };
}
const dunName = t =>
  t.kind === 'rift'
    ? '魔物裂隙'
    : t.kind === 'landmark'
      ? t.dn
      : t.kind === 'asc'
        ? '昇華試煉'
        : t.kind === 'tier'
          ? '突破試煉'
          : DTYPES[t.dt || 'normal'].n;
/* 0.3.23 冥府傳送門的最終王是閻羅王；0.3.26 換成 PNG 圖 */
const BIGBOSS = { hell: '地獄領主', circle: '魔法陣主宰', portal: '閻羅王', stele: '石碑守衛' },
  BOSSSPR = { hell: 'b_hellord', circle: 'b_arcane', portal: 'a_yanluo', stele: 'b_stelekeeper' };
/* 0.3.26 地城、石碑、魔法陣、地獄、組隊地城的首領：從台灣鬼怪裡抽一隻（每座地城固定，看種子） */
const GHOSTS = [
  { n: '魔神仔', spr: 'a_mosina', el: 'cold' },
  { n: '虎姑婆', spr: 'a_hugupo', el: 'phys' },
  { n: '陳守娘', spr: 'a_chenshouniang', el: 'cold' },
  { n: '椅仔姑', spr: 'a_yiagu', el: 'light' },
  { n: '林投姐', spr: 'a_lintoujie', el: 'cold' },
  { n: '水鬼', spr: 'a_shuigui', el: 'cold' },
  { n: '冥婚新娘', spr: 'a_guixinniang', el: 'fire' },
  { n: '紅衣小女孩', spr: 'a_hongy', el: 'phys' },
  { n: '吊死鬼', spr: 'a_diaosi', el: 'phys' }
];
const ghostOf = D => GHOSTS[h(D.seed, 77, 7) % GHOSTS.length];
/* 第 room 層的敵人群（0.3 起一層是一群，最多 5 隻）。boss 在最後一層；extra 是組隊多出來的隻數 */
function dunEnemy(D, room, extra = 0) {
  const sp = D.spec,
    boss = room === sp.floors - 1,
    r = h(D.seed, room, 9),
    addEm = e => {
      for (const m of sp.em)
        if (!e.mods.includes(m)) {
          e.mods.push(m);
          if (m === 'swift') e.speed = Math.max(e.speed || 10, 18);
          uwApply(e, m);
        }
      if (sp.em.some(m => EMODI[m] && EMODI[m].uw) && !e.name.startsWith('冥府')) e.name = '冥府・' + e.name;
      return e;
    },
    /* 一般小怪（菁英詞綴的地城比較常出魔法、稀有） */
    mob = (k, lv = D.lv) => {
      const q = h(r, k, 3) % 100,
        el = sp.elite ? 55 : 25,
        rar = sp.elite && q < 12 ? 2 : q < el ? 1 : 0,
        rr = h(r, k, 5);
      return makeEnemy(pickMon(rr, lv), lv, rar, rar ? rollMods(rr, rar === 2 ? 3 : 1) : [], sp.dm);
    },
    group = (lead, n) => {
      const out = [lead];
      for (let k = 0; k < Math.min(4, n + extra); k++) {
        /* 0.3.25 攻佔城鎮的七罪挑戰：小怪是那個罪的信徒 */
        const m = sp.siege
          ? makeFollower(
              sp.sin,
              SINF[sp.sin][h(r, k, 13) % 5],
              Math.max(1, D.lv - (k % 2)),
              h(r, k, 3) % 100 < 30 ? 1 : 0
            )
          : mob(k + 1, Math.max(1, D.lv - (k % 2)));
        /* 同一群的其他怪稍微弱一點，避免一層的總傷害爆掉 */
        m.maxhp = m.hp = Math.round(m.maxhp * 0.7);
        m.atk = Math.round(m.atk * 0.7);
        m.minion = 1;
        out.push(m);
      }
      return out.map(addEm);
    };
  /* 七宗罪：雕像挑戰的最後一層是該宗罪的王；七宗罪之王 7 層依序是 7 個王，第 8 層是七宗罪之王 */
  if (sp.dt === 'sinking' || (boss && sp.sin)) {
    const e =
      sp.dt === 'sinking'
        ? room < 7
          ? makeSinLord(SINS[room].k, D.lv)
          : makeSinKing(D.lv + 2)
        : makeSinLord(sp.sin, D.lv + 1);
    /* 0.3.25 攻佔城鎮的七罪之王：終局難度，還帶著兩個信徒 */
    if (sp.siege) {
      e.maxhp = e.hp = Math.round(e.maxhp * 2.2);
      e.atk = Math.round(e.atk * 1.3);
      const fs = SINF[sp.sin],
        es = [
          e,
          ...[0, 1].map(k => makeFollower(sp.sin, fs[h(r, k, 9) % fs.length], D.lv, 1, rollMods(h(r, k, 11), 1)))
        ];
      return { e, es, bg: 'cave', boss: true };
    }
    const es = group(e, 0);
    return { e: es[0], es, bg: 'cave', boss: true };
  }
  let e, bg, n;
  if (D.kind === 'rift') {
    const b = pickMon(r, D.lv);
    e = boss
      ? makeEnemy(b, D.lv + 1, 2, rollMods(r, 3), sp.dm)
      : makeEnemy(b, D.lv, 1, rollMods(r, 1 + (r % 2)), sp.dm);
    bg = b.bg;
    n = boss ? 1 : 1 + (r % 2);
  } else if (boss) {
    const hell = (!!BIGBOSS[sp.dt] && sp.dt !== 'stele') || D.kind === 'asc' || D.kind === 'tier',
      /* 地標是石獅、昇華試煉是鍾馗、突破之門是門神、冥府是閻羅王，其他抽台灣鬼怪 */
      gh = ghostOf(D),
      fix = D.lm
        ? { n: `${D.lm.dn}守護者`, spr: 'a_lion', el: 'cold' }
        : D.kind === 'tier'
          ? { n: '門神・秦叔寶', spr: 'a_menshen_qin', el: 'light' }
          : D.kind === 'asc'
            ? { n: '鍾馗', spr: 'a_zhongkui', el: 'fire' }
            : sp.dt === 'portal'
              ? { n: BIGBOSS.portal, spr: BOSSSPR.portal, el: 'fire' }
              : gh,
      bn = fix.n,
      bspr = fix.spr;
    e = makeEnemy(
      {
        name: bn,
        bg: 'cave',
        hp: 70,
        atk: 12,
        arm: 30,
        el: fix.el,
        res: [25, 25, 25],
        xp: 30,
        gold: 30,
        spr: bspr,
        pal: BOSSPAL[bspr]
      },
      D.lv + 1,
      0,
      hell ? rollMods(r, 2) : [],
      sp.dm
    );
    e.maxhp = Math.round(e.maxhp * (hell ? 2.8 : 2));
    e.hp = e.maxhp;
    e.atk = Math.round(e.atk * (hell ? 1.4 : 1.15));
    e.xp *= hell ? 4 : 2;
    e.rar = hell ? 4 : 3;
    e.big = hell ? 1 : 0;
    e.minion = 0;
    if (sp.dt === 'portal') e.yama = 1;
    bg = 'cave';
    n = hell ? 2 : 1 + (sp.dt === 'party' ? 1 : 0);
    /* 突破之門：兩位門神一起守門，尉遲恭是第二隻（生命 70%） */
    if (D.kind === 'tier') {
      const es = group(e, n - 1),
        e2 = makeEnemy(
          {
            name: '門神・尉遲恭',
            bg: 'cave',
            hp: 70,
            atk: 12,
            arm: 30,
            el: 'phys',
            res: [25, 25, 25],
            xp: 30,
            gold: 30,
            spr: 'a_menshen_yu'
          },
          D.lv + 1,
          0,
          rollMods(h(r, 2, 21), 2),
          sp.dm
        );
      e2.maxhp = e2.hp = Math.round(e.maxhp * 0.7);
      e2.atk = e.atk;
      e2.xp = e.xp;
      e2.rar = 4;
      e2.minion = 0;
      es.splice(1, 0, e2);
      return { e: es[0], es: es.slice(0, 5), bg, boss: true };
    }
  } else {
    e = sp.siege ? makeFollower(sp.sin, SINF[sp.sin][r % 5], D.lv, r % 3 === 0 ? 2 : 1, rollMods(r, 1)) : mob(0);
    bg = D.lm ? 'forest' : 'cave';
    n = (sp.dt === 'hell' ? 2 : 1) + (r % 2) + (sp.elite ? 1 : 0);
  }
  if (S.lv < 3) n = Math.min(n, 1);
  const es = group(e, n);
  return { e: es[0], es, bg, boss: boss && D.kind !== 'rift' };
}
function dropLoot(e, boss, sp, remote, minion) {
  const buf = buffOn() ? 1.2 : 1,
    rem = remote ? 0.8 : 1,
    out = [],
    r = e.rar || 0,
    zm = zoneAt(S.lat, S.lng).m,
    os = onsiteNow() ? ONSITE_BONUS : 0,
    /* 0.3.10：T 級的掉寶數量與稀有度；首領與災厄另外加上機制王的加成 */
    tb = tierBonus(),
    tk = boss || r >= 3 ? tb.boss : 0,
    Q = 1 + ((sp ? sp.q : 0) + (zm.q || 0) + os + tb.q + tk) / 100,
    R = 1 + ((sp ? sp.r : 0) + (zm.r || 0) + os + tb.r + tk) / 100;
  const mm = (minion ? 0.5 : 1) * rate('drop'),
    itemCh = ([0.22, 0.5, 1, 1, 1][r] || 0.22) * buf * rem * Q * mm,
    curN =
      (boss
        ? 3 + fl(Math.random() * 2)
        : r === 4
          ? 4 + fl(Math.random() * 3)
          : r === 2
            ? 2 + fl(Math.random() * 2)
            : r === 1
              ? (Math.random() < 0.6 ? 1 : 0) + (Math.random() < 0.3 ? 1 : 0)
              : Math.random() < 0.25 * buf
                ? 1
                : 0) *
      Q *
      mm;
  const mk = minR => {
    const p = 1 - (1 - Math.random()) / R;
    let rar = p < 0.55 ? 0 : p < 0.9 ? 1 : 2;
    rar = Math.max(rar, minR);
    const it = makeItem(DROPS[fl(Math.random() * DROPS.length)], e.lv, rar);
    giveItem(it);
    out.push(itemName(it));
  };
  if (boss) mk(2);
  else if (Math.random() < itemCh) mk(r >= 2 ? 1 : 0);
  if (r === 2 && Math.random() < 0.5 * Q) mk(0);
  if (r === 4) {
    mk(2);
    mk(2);
    if (Math.random() < 0.5) mk(1);
  }
  /* 機率超過 1 的部分變成額外的裝備（設定的掉寶倍率最多 10 倍） */
  for (let x = itemCh - 1; x > 0; x--) if (Math.random() < x) mk(0);
  for (let i = 0; i < Math.round(curN * rem); i++) {
    const c = rollCur(boss || r >= 2 ? 3 : 1);
    giveCur(c);
    out.push(curDot(c) + CURI[c].n);
  }
  if (stats().legGreed) {
    const c = rollCur(2);
    giveCur(c);
    out.push(curDot(c) + CURI[c].n);
  }
  gemLoot(e, boss, sp && sp.dt !== 'normal' && sp.dt !== 'party' && sp.dt !== 'stele', rem, out);
  if (boss && sp && sp.dt === 'circle') {
    giveCur('engX', 1 + (Math.random() < 0.5 ? 1 : 0));
    out.push(curDot('engX') + '崇高刻印石');
  }
  if (boss && sp && sp.dt === 'portal') {
    giveCur('vaal');
    out.push(curDot('vaal') + '冥府之血');
    for (const id of ['prism', 'engD'])
      if (Math.random() < 0.5) {
        giveCur(id);
        out.push(curDot(id) + GCURI[id].n);
      }
  }
  if (r >= 1 || boss) {
    const ins = rollInsc(r, boss);
    if (ins) out.push(ins);
  }
  if (Math.random() < 0.12) {
    S.potions++;
    out.push('生命藥水');
  }
  return out;
}
/* 技能石材料：靈魂與刻印石系列（開插槽）；0.3.20 寶石稜鏡與輔助寶石在 supLoot */
/* 靈魂隨怪物強度增加：稀有度底數 + 每條詞綴 2（冥府詞綴 3）+ 每 4 級 1，首領再加 */
/* 0.3.1.8：靈魂全部來源 ×1.5（0.3.11 起靈魂拿來升級技能石） */
const SOUL_MUL = 1.5;
function gemLoot(e, boss, hell, rem, out) {
  const r = e.rar || 0,
    mods = e.mods || [],
    soul =
      [2, 4, 7, 8, 15][r] +
      mods.reduce((a, m) => a + (EMODI[m] && EMODI[m].uw ? 3 : 2), 0) +
      fl((e.lv || 1) / 4) +
      (boss ? 6 + (hell ? 6 : 0) : 0),
    z = zoneAt(S.lat, S.lng).m,
    dm = rate('drop'),
    ch = p => Math.random() < p * rem * (z.eng || 1) * dm,
    add = (id, n = 1) => {
      if (n <= 0) return;
      giveCur(id, n);
      out.push(curDot(id) + GCURI[id].n + (n > 1 ? ' ×' + n : ''));
    };
  add('soul', Math.round(soul * rem * (z.soul || 1) * SOUL_MUL * dm));
  /* 0.3.11 祈願石：菁英與首領比較常掉 */
  const wm = rem * dm;
  if (boss) add('wish', Math.round((1 + (hell ? 1 : 0)) * wm) || 1);
  else if (Math.random() < [0.01, 0.04, 0.12, 0.12, 0.4][r] * wm) add('wish');
  if (boss || ch([0, 0.25, 0.6, 0.6, 1][r])) add('eng');
  if (ch(boss ? (hell ? 0.6 : 0.3) : [0, 0, 0.2, 0.2, 0.5][r])) add('engC');
  if (ch(boss && hell ? 0.25 : r === 4 ? 0.05 : 0)) add('engX');
  if (r === 4 && ch(0.08)) add('engD');
  supLoot(e, boss, rem * dm, out);
}
/* 0.3.20：寶石稜鏡與族裔輔助只從野外機制掉（菁英低機率、首領高機率），一般輔助寶石菁英與首領都會掉 */
const mechOf = e =>
  e.ud
    ? 'ud'
    : e.sin || e.siege
      ? 'sin'
      : e.mist || e.xiong || e.zhulong
        ? 'mist'
        : e.uw
          ? 'uw'
          : e.hunt || e.zod || (typeof B !== 'undefined' && B && B.hunt && !e.minion)
            ? 'hunt'
            : '';
function supLoot(e, boss, rem, out) {
  const r = e.rar || 0,
    m = mechOf(e),
    big = boss || r >= 3,
    pick = a => a[fl(Math.random() * a.length)],
    giveS = sp => {
      giveSup(sp.k);
      out.push(
        `<span style="color:${sp.lin ? '#ffd166' : '#9fd4ef'}">${sp.lin ? '族裔輔助・' : '輔助寶石・'}${sp.n}</span>`
      );
    };
  if (m) {
    const n = big ? 1 + (Math.random() < 0.5 ? 1 : 0) : r >= 1 && Math.random() < 0.08 * rem ? 1 : 0;
    if (n) {
      giveCur('prism', n);
      out.push(curDot('prism') + GCURI.prism.n + (n > 1 ? ' ×' + n : ''));
    }
    if (Math.random() < (big ? 0.25 : r >= 1 ? 0.015 : 0) * rem) giveS(pick(SUPG.filter(sp => sp.lin && sp.m === m)));
  } else if (r === 4 && Math.random() < 0.04 * rem) giveS(pick(SUPG.filter(sp => sp.lin && sp.m === 'wild')));
  if (Math.random() < (boss ? 0.15 : [0, 0.01, 0.03, 0.05, 0.1][r] || 0) * rem)
    giveS(pick(SUPG.filter(sp => !sp.lin && sp.t <= Math.max(1, Math.min(5, tierNow())))));
}
/* 現場加成：人實際走到互動範圍內（150 公尺，城鎮 200）打（不是靠據點、營旗、絲綢之路遠端），掉寶數量與稀有度 +20% */
const ONSITE_BONUS = 20;
const onsiteNow = () => (D ? !!D.onsite : B ? !!B.onsite : MB ? !!(MB.d && MB.d.onsite && amLeader()) : false);
/* 地城通關獎勵 */
function dunReward(D) {
  const sp = D.spec,
    mult = D.remote ? 0.8 : 1,
    tb = tierBonus(),
    Q = 1 + (sp.q + (D.onsite ? ONSITE_BONUS : 0) + tb.q + tb.boss) / 100,
    bonus = (D.lm ? 1.6 : 1) * Q,
    gold = Math.round((40 + D.lv * 25) * mult * bonus * rate('gold')),
    cry = D.kind === 'rift' ? 0 : Math.max(1, Math.round((2 + fl(D.lv / 2)) * mult * bonus));
  const items = [
    makeItem(DROPS[fl(Math.random() * DROPS.length)], D.lv + 1, D.lm || D.kind === 'rift' || sp.dt !== 'normal' ? 2 : 1)
  ];
  if (sp.dt === 'hell') items.push(makeItem(DROPS[fl(Math.random() * DROPS.length)], D.lv + 2, 2));
  S.gold += gold;
  S.crystal += cry;
  items.forEach(giveItem);
  const curs = [];
  for (let i = 0; i < Math.round((D.kind === 'rift' ? 4 : 2) * Q * rate('drop')); i++) {
    const c = rollCur(sp.dt === 'hell' ? 5 : 3);
    giveCur(c);
    curs.push(curDot(c) + CURI[c].n);
  }
  if (sp.dt === 'stele') curs.push(makeTablet(D.lv, sp.mods));
  if (sp.dt === 'sin' || sp.dt === 'sinking') curs.push(...sinReward(sp));
  /* 0.3.20：冥府傳送門與七宗罪的首領：寶石稜鏡、族裔輔助 */
  const lm = sp.dt === 'portal' ? 'uw' : sp.dt === 'sin' || sp.dt === 'sinking' ? 'sin' : '';
  if (lm) {
    giveCur('prism', 2);
    curs.push(curDot('prism') + GCURI.prism.n + ' ×2');
    if (Math.random() < (sp.dt === 'sinking' ? 0.6 : 0.3)) {
      const l = SUPG.filter(x => x.lin && x.m === lm),
        x = l[fl(Math.random() * l.length)];
      giveSup(x.k);
      curs.push(`<span style="color:#ffd166">族裔輔助・${x.n}</span>`);
    }
  } else if (sp.dt === 'hell' && Math.random() < 0.4) {
    giveCur('prism');
    curs.push(curDot('prism') + GCURI.prism.n);
  }
  return { gold, cry, items, curs };
}
function dunModsHTML(sp) {
  return sp.mods.length
    ? `<div class="dmods">${sp.mods.map(id => `<div><b>${DMODI[id].n}</b><small>${DMODI[id].d}</small></div>`).join('')}</div>`
    : '<p class="sub">沒有地城詞綴。</p>';
}
/* 戰利品清單：同樣的東西合併成「×n」 */
function lootList(a) {
  const m = new Map();
  for (const s of a) {
    const mt = /^(.*) ×(\d+)$/.exec(s),
      k = mt ? mt[1] : s;
    m.set(k, (m.get(k) || 0) + (mt ? +mt[2] : 1));
  }
  return [...m].map(([s, n]) => (n > 1 ? `${s} ×${n}` : s));
}
function winBattle() {
  const es = B.es,
    e = es[0],
    zm = zoneAt(S.lat, S.lng).m,
    st = stats(),
    mult = (D && D.remote ? 0.8 : 1) * (buffOn() ? 1.2 : 1);
  let xp = 0,
    gold = 0;
  const drops = [];
  es.forEach((o, i) => {
    xp += Math.round(o.xp * mult * (zm.xp || 1) * rate('xp'));
    gold += Math.round(o.gold * rnd(0.8, 1.2) * mult * st.goldMul * (zm.gold || 1) * rate('gold'));
    drops.push(...dropLoot(o, B.boss && i === 0, D && D.spec, D && D.remote, o.minion));
  });
  S.gold += gold;
  const up = gainXP(xp);
  if (B.entId) {
    S.defeated[B.entId] = 1;
    ENT.delete(B.entId);
  }
  S.stacks = st.keepStacks ? B.me.stacks || 0 : 0;
  let bonus = autoPot();
  if (B.bounty) {
    const g = 100 + S.lv * 30;
    S.gold += g;
    giveCur('chaos');
    bonus += `<p style="color:var(--gold)">懸賞完成！額外 ${g} 金幣與 1 個混沌石</p>`;
    S.cleared[B.bounty] = evEp();
  }
  if (onsiteNow()) bonus += `<p class="sub" style="color:var(--gold)">✦ 現場加成：掉寶 +${ONSITE_BONUS}%</p>`;
  /* 每隻敵人各自算：侵蝕柱充能、亡靈區與魔霧進度（同一種只顯示最後一行） */
  let ob = '',
    ud = '',
    mi = '';
  for (const o of es) {
    if (o.uw) ob = obeliskCharge(o.uw);
    if (o.ud) ud = undeadWin({ e: o, ud: o.ud, udBase: o.bn, mist: o.mist }) || ud;
    if (o.mist) mi = mistWin({ e: o, ud: o.ud, mist: o.mist, mistBase: o.bn }) || mi;
    if (o.sin) bonus += sinBattleWin(o);
    quest('kill');
    if (o.rar >= 2) quest('rare');
    if (o.ud) quest('ud');
  }
  bonus += ob + ud + mi;
  if (B.commander) bonus += commanderWin(B.commander);
  if (B.king) bonus += kingWin();
  if (B.xiong) bonus += xiongWin(B.xiong);
  bonus += siegeWin(es);
  if (B.zhulong) bonus += zhulongWin();
  if (B.watcher) bonus += watcherWin(B.watcher);
  if (B.hunt) bonus += huntWin(B);
  bonus += huntKills(es);
  if (B.hunt === 'beast') quest('beast');
  addLog(`擊敗 ${e.name}${es.length > 1 ? ` 等 ${es.length} 隻` : ''} Lv${e.lv}，獲得 ${xp} 經驗、${gold} 金幣`);
  if (up) setTimeout(() => sfx('level'), 500);
  renderBHud();
  save();
  const inD = !!D;
  const next = () => {
    if (inD) {
      D.room++;
      const F = D.spec.floors;
      if (D.room >= F) return dungeonClear();
      const st = stats();
      showModal(
        D.kind === 'rift' ? `裂隙第 ${D.room + 1}/${F} 波` : `第 ${D.room + 1}/${F} 層`,
        `<p>${D.room === F - 1 ? (D.kind === 'rift' ? '裂隙深處湧出一隻稀有怪物。' : '更深處傳來強大的氣息，首領就在前方。') : '下一波敵人正在逼近。'}</p><p class="sub">生命 ${S.hp}/${st.maxhp}・魔力 ${S.mp}/${st.maxmp}</p>`,
        [
          {
            label: '撤退',
            fn: () => {
              hideModal();
              addLog('撤退了');
              D = null;
              endBattle();
            }
          },
          {
            label: '繼續',
            pri: 1,
            fn: () => {
              hideModal();
              nextRoom();
            }
          }
        ]
      );
    } else {
      hideModal();
      endBattle();
    }
  };
  showModal(
    '勝利！',
    `<p>獲得 <span style="color:var(--good)">${xp} 經驗</span>、<span style="color:var(--gold)">${gold} 金幣</span></p>${
      drops.length
        ? `<div class="loot">${lootList(drops)
            .map(d => `<span>${d}</span>`)
            .join('')}</div>`
        : ''
    }${bonus}${up ? `<p style="color:var(--gold)">升級到 Lv${S.lv}！獲得 1 天賦點</p>` : ''}`,
    [{ label: '繼續', pri: 1, fn: next }]
  );
}
function loseBattle() {
  sfx('lose');
  buzz(300);
  const lost = fl(S.gold * 0.1);
  S.gold -= lost;
  fullHeal();
  D = null;
  addLog(`戰敗，損失 ${lost} 金幣`);
  /* 0.3.1.7 起一律原地復活（不再送回主據點） */
  showModal(
    '你倒下了……',
    `<p>損失 ${lost} 金幣，在原地醒來，狀態已恢復。</p><p class="sub">提示：看看角色頁的抗性，元素怪物對低抗性很痛。</p>`,
    [
      {
        label: '重新出發',
        pri: 1,
        fn: () => {
          hideModal();
          endBattle();
        }
      }
    ]
  );
}
function endBattle() {
  $('battle').hidden = true;
  $('eail').innerHTML = $('hail').innerHTML = $('epills').innerHTML = '';
  bossBar(null);
  B = null;
  playSong('field');
  renderHud();
  save();
}
function enterDungeon(t, remote) {
  D = {
    id: t.id,
    kind: t.kind,
    lat: t.lat,
    lng: t.lng,
    lv: t.lv,
    room: 0,
    remote,
    onsite: !!t.onsite,
    lm: t.kind === 'landmark' ? t : null,
    seed: h(fl(t.lat * 1e4), fl(t.lng * 1e4), hepoch()),
    spec: dunSpec(t)
  };
  sfx('door');
  addLog(`${remote ? '從據點遠征' : '進入'}${dunName(t)}（Lv${t.lv}）`);
  nextRoom();
}
function nextRoom() {
  const { es, bg, boss } = dunEnemy(D, D.room);
  if (B) {
    es.forEach(eInit);
    es.forEach((x, k) => (x.msk = monSkills(x, !!boss && k === 0)));
    Object.assign(B, {
      e: es[0],
      es,
      ti: 0,
      boss,
      hold: true,
      anim: false,
      over: false,
      ready: false,
      act: -1,
      tick: 0
    });
    /* 0.3.44 進下一層：技能與藥水冷卻清空 */
    Object.assign(B.me, { guard: 0, frozen: 0, cd: {}, cdMax: {} });
    B.queued = null;
    BFX.en = es.map(() => ({ a: null, flash: 0 }));
    BFX.pops = [];
    paintBG(bg);
    BFX.t0 = performance.now();
    playSong(boss ? 'boss' : 'battle');
    renderBHud();
    bmsg(es.length > 1 ? `${es[0].name} 等 ${es.length} 隻出現了！` : `${es[0].name} 出現了！`);
    sfx('encounter');
    /* 每層重新累積行動值 */
    B.av = atbStart(es);
    later(800, () => (B.hold = false));
  } else startBattle(es, { boss, bg });
}
function dungeonClear() {
  const kind = D.kind,
    rw = dunReward(D);
  S.cleared[D.id] = kind === 'rift' ? evEp() : hepoch();
  const ascMsg = kind === 'asc' ? ascTrialDone() : kind === 'tier' ? tierUpDone() : '';
  quest('dun');
  const nm =
      kind === 'rift'
        ? '魔物裂隙'
        : D.lm
          ? D.lm.dn
          : kind === 'asc' || kind === 'tier'
            ? dunName(D)
            : DTYPES[D.spec.dt].n,
    rem = D.remote;
  addLog(`攻略${nm}（Lv${D.lv}）`);
  sfx('level');
  const lv = D.lv;
  D = null;
  /* 0.3.1.9：打倒尾王後三選一（昇華試煉除外）；選完才能離開 */
  const picks = kind === 'asc' ? [] : bossPicks(lv),
    head = `<p><span style="color:var(--gold)">${rw.gold} 金幣</span>${rw.cry ? `・<span style="color:#9fe7ff">${rw.cry} 魔晶</span>` : ''}</p>${rw.items.map(it => itemCard(it, '首領寶箱')).join('')}<div class="loot">${rw.curs.map(c => `<span>${c}</span>`).join('')}</div>${ascMsg}${rem ? '<p class="sub">遠征獎勵為實地攻略的 80%。</p>' : ''}`;
  let got = null;
  const render = () =>
    showModal(
      '攻略完成！',
      head +
        (picks.length
          ? got
            ? `<h3>首領的獎勵</h3><div class="loot">${got.map(t => `<span>${t}</span>`).join('')}</div>`
            : `<h3>首領的獎勵：三選一</h3><div class="bpick">${picks.map((p, i) => `<button class="bpk" data-act="mbtn" data-i="${i + 1}"><img src="${p.ic}" alt=""><b>${p.n}</b><small>${p.d}</small></button>`).join('')}</div>`
          : ''),
      [
        {
          label: picks.length && !got ? '先選一個獎勵' : '返回地圖',
          pri: 1,
          dis: picks.length && !got,
          fn: () => {
            if (picks.length && !got) return;
            hideModal();
            endBattle();
          }
        },
        ...picks.map(p => () => {
          if (got) return;
          got = p.give();
          sfx('coin');
          addLog(`首領獎勵：${p.n}`);
          save();
          render();
        })
      ].map(f => (typeof f === 'function' ? { label: '', fn: f, hide: 1 } : f))
    );
  render();
}
/* 尾王三選一的獎勵池：稀有裝備、通貨、或一批高品質的普通裝備（品質超過一般上限 20%，拿來自己做裝） */
const BP_ARMOR = ['helm', 'chest', 'gloves', 'boots', 'belt'],
  BP_QARM = ['helm', 'chest', 'gloves', 'boots'];
function bossPicks(lv) {
  const pick = a => a[fl(Math.random() * a.length)],
    hiQ = it => ((it.q = 21 + fl(Math.random() * 10)), it),
    gear = (slot, rar, n, q) =>
      Array.from({ length: n }, () => {
        const it = makeItem(typeof slot === 'function' ? slot() : slot, lv + 1, rar);
        if (q && hasQ(it)) hiQ(it);
        giveItem(it);
        return itemName(it) + (it.q ? `（品質 ${it.q}%）` : '');
      }),
    curs = list =>
      list.map(([id, n]) => {
        giveCur(id, n);
        return curDot(id) + (CURI[id] || GCURI[id]).n + (n > 1 ? ' ×' + n : '');
      }),
    pool = [
      { n: '稀有武器', d: '1 把稀有武器', ic: slotIcon(null, 'weapon'), give: () => gear('weapon', 2, 1) },
      { n: '稀有防具', d: '1 件稀有防具', ic: slotIcon(null, 'chest'), give: () => gear(() => pick(BP_ARMOR), 2, 1) },
      {
        n: '稀有飾品',
        d: '1 個稀有戒指或護身符',
        ic: slotIcon(null, 'ring1'),
        give: () => gear(() => pick(['ring', 'amulet']), 2, 1)
      },
      {
        n: '精良武器 ×3',
        d: '3 把普通武器，品質 21～30%（超過一般上限），自己做裝',
        ic: curIcon('whet'),
        give: () => gear('weapon', 0, 3, 1)
      },
      {
        n: '精良防具 ×3',
        d: '3 件普通防具，品質 21～30%（超過一般上限），自己做裝',
        ic: curIcon('scrap'),
        give: () => gear(() => pick(BP_QARM), 0, 3, 1)
      },
      {
        n: '通貨包',
        d: '5 個隨機通貨（容易出點金、混沌）',
        ic: curIcon('chaos'),
        give: () => {
          const out = [];
          for (let i = 0; i < 5; i++) {
            const c = rollCur(4);
            giveCur(c);
            out.push(curDot(c) + CURI[c].n);
          }
          return lootList(out);
        }
      },
      {
        n: '製作材料',
        d: '蛻變石 ×3、增幅石 ×2、富豪石、磨刀石 ×2、護甲片 ×2',
        ic: curIcon('regal'),
        give: () =>
          curs([
            ['trans', 3],
            ['aug', 2],
            ['regal', 1],
            ['whet', 2],
            ['scrap', 2]
          ])
      },
      {
        n: '靈魂寶藏',
        d: `靈魂 ×${30 + lv * 2}、祈願石 ×2、刻印石 ×2`,
        ic: curIcon('wish'),
        give: () =>
          curs([
            ['soul', 30 + lv * 2],
            ['wish', 2],
            ['eng', 2]
          ])
      }
    ];
  const out = [];
  while (out.length < 3) {
    const p = pool.splice(fl(Math.random() * pool.length), 1)[0];
    out.push(p);
  }
  return out;
}
/* ================= battle: drawing ================= */
/* 畫一群敵人（單人與組隊共用）：fx 是 BFX.en／MBFX.en，ti 是目前目標（-1 不畫箭頭） */
function drawEnemies(c, t, es, boss, fx, ti) {
  selTrack(fx, ti, es.length + ':' + (es[0] ? es[0].name : ''));
  const now_ = performance.now(),
    order = es.map((e, i) => i).sort((a, b) => epos(a, es, boss).y - epos(b, es, boss).y);
  for (const i of order) {
    const e = es[i],
      f = fx[i] || (fx[i] = {}),
      q = epos(i, es, boss),
      es_ = q.s;
    /* 血量已歸零但擊倒動畫還沒播（結算比動畫早）：照常畫，等 kill 事件；太久沒等到就自己開始倒下 */
    if (e.hp <= 0 && !f.dying) {
      f.pend = f.pend || now_;
      if (now_ - f.pend > 1500) f.dying = now_;
    }
    if (e.hp <= 0 && f.dying && now_ - f.dying > 850) continue;
    const [ox, oy] = animOff(f, -1),
      alpha = f.dying ? 1 - (now_ - f.dying) / 850 : 1;
    if (e.rar)
      glow(c, q.x + ox, q.y - 8 * es_, (e.rar >= 2 ? 16 : 12) * es_, RGLOW[e.rar], 0.35 + 0.12 * Math.sin(t / 300));
    c.fillStyle = 'rgba(0,0,0,.3)';
    c.beginPath();
    c.ellipse(q.x + ox, q.y + 2, es_ * 6.5, es_ * 1.5, 0, 0, 6.28);
    c.fill();
    c.globalAlpha = Math.max(0, alpha);
    const flash = now_ - (f.flash || 0) < 120 || (f.dying && fl((now_ - f.dying) / 80) % 2 === 0);
    drawSpr(
      c,
      e.spr,
      e.pal,
      q.x + ox,
      q.y + oy + Math.sin(t / 260 + i) * 2,
      es_,
      e.spr === 'boar' || e.spr === 'wolf',
      flash
    );
    c.globalAlpha = 1;
    /* 選取特效：腳下光圈＋四角框，剛選到時框從外面收進來 */
    if (i === ti && e.hp > 0) drawSel(c, t, q, es_, now_ - (fx._ts || 0), es.length > 1);
  }
}
/* 目標選取：ti 換了就記下時間，名字顯示一下再淡出（ti 是 -1 表示動畫中，不算換目標） */
function selTrack(fx, ti, key) {
  if (ti < 0) return;
  if (fx._ti === ti && fx._key === key) return;
  fx._ti = ti;
  fx._key = key;
  fx._ts = performance.now();
  const el = $('bname');
  el.classList.add('on');
  clearTimeout(selTrack.t);
  selTrack.t = setTimeout(() => el.classList.remove('on'), 1800);
}
function drawSel(c, t, q, s, age, multi) {
  const k = Math.max(0, 1 - age / 260),
    pulse = 0.55 + 0.25 * Math.sin(t / 160);
  c.save();
  c.strokeStyle = `rgba(255,209,102,${pulse})`;
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(q.x, q.y + 2, s * 8 + k * 14, s * 2.2 + k * 4, 0, 0, 6.28);
  c.stroke();
  if (multi || k > 0) {
    const w = s * 9 + 6 + k * 18,
      top = q.y - 16 * s - 4 - k * 14,
      bot = q.y + 6 + k * 6,
      L = Math.max(5, s * 3);
    c.strokeStyle = `rgba(255,209,102,${multi ? 0.95 : k})`;
    c.lineWidth = 2.5;
    c.shadowColor = '#ffd166';
    c.shadowBlur = 6;
    [
      [-1, top, 1],
      [1, top, 1],
      [-1, bot, -1],
      [1, bot, -1]
    ].forEach(([sx, y, sy]) => {
      const x = q.x + sx * w;
      c.beginPath();
      c.moveTo(x - sx * L, y);
      c.lineTo(x, y);
      c.lineTo(x, y + sy * L);
      c.stroke();
    });
  }
  c.restore();
}
/* 召喚物：站在施放者後面的小隻像素圖 */
function drawPets(c, t, pets, x, y, s) {
  (pets || []).forEach((p, k) => {
    if (p.turns <= 0) return;
    const px = x - 26 - k * 20,
      py = y + 10 - (k % 2) * 16;
    glow(c, px, py - 6 * s * 0.6, 10 * s * 0.6, '200,170,255', 0.25);
    drawSpr(c, p.spr || 'skeleton', p.pal || {}, px, py + Math.sin(t / 240 + k) * 2, Math.max(2, s - 1), true);
  });
}
function renderBattle(t) {
  /* 0.3.35 推進即時行動條與冷卻，並更新畫面上的行動條、冷卻遮罩 */
  {
    const dt = B.lt ? (t - B.lt) / 1000 : 0;
    B.lt = t;
    soloStep(dt);
    if (!B) return;
    atbPaint(B.av, B.me);
  }
  const c = bctx,
    now_ = performance.now(),
    p = POS();
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  c.clearRect(0, 0, BW, BH);
  c.imageSmoothingEnabled = false;
  let sx = 0,
    sy = 0;
  if (now_ - BFX.shake < 260) {
    const k = 1 - (now_ - BFX.shake) / 260;
    sx = rnd(-5, 5) * k;
    sy = rnd(-4, 4) * k;
  }
  c.save();
  c.translate(sx, sy);
  const sc = battleSc();
  drawEnemies(c, t, B.es, B.boss, BFX.en, pBusy() ? -1 : B.ti);
  const [hox, hoy] = animOff(BFX.hero, 1),
    hx = p.hx + hox,
    hy = p.hy + hoy + Math.sin(t / 320) * 1.5,
    hs = sc;
  c.fillStyle = 'rgba(0,0,0,.3)';
  c.beginPath();
  c.ellipse(p.hx + hox, p.hy + 2, hs * 6.5, hs * 1.5, 0, 0, 6.28);
  c.fill();
  drawPets(c, t, B.me.pets, p.hx, p.hy, hs);
  const hpal = heroPal();
  drawWeapon(c, wepKind(), hx, hy, hs, hpal.W);
  drawSpr(c, heroSpr('S'), hpal, hx, hy, hs, true);
  for (let i = BFX.fx.length - 1; i >= 0; i--) {
    const f = BFX.fx[i],
      q = (now_ - f.t) / f.dur;
    if (q >= 1) {
      BFX.fx.splice(i, 1);
      continue;
    }
    if (q < 0) continue;
    const tq = f.i != null ? epos(f.i, B.es, B.boss) : null;
    drawFx(c, f, q, tq ? { ...p, ex: tq.x, y: tq.y } : p, hs);
  }
  c.globalCompositeOperation = 'lighter';
  for (const q of BFX.motes) {
    q.y -= q.v;
    q.x += Math.sin(t / 900 + q.p) * 0.0006;
    if (q.y < 0) q.y = 1;
    c.fillStyle = `rgba(255,240,180,${0.35 + 0.3 * Math.sin(t / 400 + q.p)})`;
    c.fillRect(q.x * BW, q.y * BH * 0.9, 2, 2);
  }
  c.globalCompositeOperation = 'source-over';
  c.font = 'bold 22px DotGothic16, sans-serif';
  c.textAlign = 'center';
  for (let i = BFX.pops.length - 1; i >= 0; i--) {
    const q = BFX.pops[i],
      k = (now_ - q.t) / 1000;
    if (k >= 1) {
      BFX.pops.splice(i, 1);
      continue;
    }
    const y = q.y - k * 30 - (k < 0.15 ? Math.sin((k / 0.15) * Math.PI) * 10 : 0);
    c.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
    c.lineWidth = 4;
    c.strokeStyle = '#000';
    c.strokeText(q.text, q.x, y);
    c.fillStyle = q.col;
    c.fillText(q.text, q.x, y);
    c.globalAlpha = 1;
  }
  c.restore();
  const intro = (now_ - BFX.t0) / 450;
  if (intro < 1) {
    c.fillStyle = `rgba(255,255,255,${1 - intro})`;
    c.fillRect(0, 0, BW, BH);
  }
}
/* 手上的武器（kind 是 wepKind；玩家面向右邊，hx/hy 是腳下，u 是像素大小） */
function drawWeapon(c, wep, hx, hy, u, mc) {
  /* mc 是刃的顏色（材質階級），沒給就用原本的鐵色 */
  const M1 = mc || '#d8dde6',
    M2 = mc ? shade(mc, -0.18) : '#aab2bc',
    M3 = mc ? shade(mc, -0.32) : '#8a929c';
  const R = (col, x, y, w, h) => {
    c.fillStyle = col;
    c.fillRect(hx + x * u, hy + y * u, w * u, h * u);
  };
  const bowArc = (r, x) => {
    c.strokeStyle = '#8a5a2f';
    c.lineWidth = u;
    c.beginPath();
    c.arc(hx + x * u, hy - 9 * u, r * u, -Math.PI * 0.42, Math.PI * 0.42);
    c.stroke();
    c.strokeStyle = '#eee';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(hx + (x + r * 0.3) * u, hy - (9 + r * 0.92) * u);
    c.lineTo(hx + (x + r * 0.3) * u, hy - (9 - r * 0.92) * u);
    c.stroke();
  };
  if (wep === 'sword' || wep === 'gsword' || wep === 'peach') {
    const g = wep === 'gsword',
      wood = wep === 'peach';
    R(wood ? '#b8743a' : M1, 5, g ? -20 : -15, g ? 1.6 : 1, g ? 14 : 9);
    if (!wood) R('#f6f8fb', 5, g ? -20 : -15, 0.4, g ? 14 : 9);
    R(wood ? '#c0392b' : '#b8862e', g ? 3 : 3.5, -6, g ? 5.6 : 4, 1);
    if (wood) R('#e5484d', 4.5, -5, 1, 3);
  } else if (wep === 'axe' || wep === 'gaxe') {
    const g = wep === 'gaxe';
    R('#7a5230', 5, g ? -19 : -15, 1, g ? 17 : 11);
    R(M2, 6, g ? -19 : -15, g ? 4 : 3, g ? 5 : 3.5);
    if (g) R(M2, 2, -19, 3, 5);
    R('#e8edf2', g ? 9.4 : 8.4, g ? -19 : -15, 0.6, g ? 5 : 3.5);
  } else if (wep === 'mace' || wep === 'gmace') {
    const g = wep === 'gmace';
    R('#7a5230', 5, g ? -17 : -13, 1, g ? 15 : 9);
    R(M3, g ? 3.5 : 4, g ? -21 : -16, g ? 4 : 3, g ? 4 : 3);
    if (g) {
      R('#c8ced6', 5, -22, 1, 1);
      R('#c8ced6', 2.5, -20, 1, 1);
      R('#c8ced6', 7.5, -20, 1, 1);
    }
  } else if (wep === 'spear' || wep === 'halberd') {
    R('#7a5230', 5, -21, 0.8, 21);
    R(M1, 4.5, -25, 1.8, 4);
    R('#f6f8fb', 5.1, -26, 0.6, 1);
    if (wep === 'halberd') {
      R(M2, 5.8, -21, 3, 3);
      R(M2, 2.5, -20.5, 2.5, 1.2);
    }
  } else if (wep === 'bow' || wep === 'lbow') bowArc(wep === 'lbow' ? 8 : 6, 3);
  else if (wep === 'xbow') {
    R('#7a5230', 2, -9, 8, 1.2);
    R('#5a3a26', 9, -12, 1, 7);
    c.strokeStyle = '#eee';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(hx + 9.5 * u, hy - 12 * u);
    c.lineTo(hx + 4 * u, hy - 8.6 * u);
    c.lineTo(hx + 9.5 * u, hy - 5 * u);
    c.stroke();
  } else if (wep === 'dagger') {
    R(M1, 6, -11, 0.8, 4.5);
    R('#b8862e', 5.2, -6.5, 2.4, 0.8);
  } else if (wep === 'claw') {
    for (let k = 0; k < 3; k++) R('#e8edf2', 6 + k * 0.2, -10 + k * 1.6, 3, 0.6);
    R('#5a3a26', 5, -9, 1.2, 4);
  } else if (wep === 'scepter') {
    R('#d8a838', 5, -14, 0.9, 10);
    R('#c86aff', 4.2, -16.5, 2.5, 2.5);
    R('#ffd166', 4.6, -17.5, 1.7, 0.8);
  } else {
    R('#7a5230', 5, -17, 1, 16);
    R('#7fe0ff', 4, -19, 3, 3);
  }
}
function drawFx(c, f, q, p, u) {
  const ex = p.ex,
    ey = p.y - 8 * u;
  c.save();
  c.globalCompositeOperation = 'lighter';
  if (f.type === 'slash' || f.type === 'whirl') {
    const n = f.type === 'whirl' ? 3 : 1;
    for (let k = 0; k < n; k++) {
      c.strokeStyle = `rgba(255,255,255,${1 - q})`;
      c.lineWidth = 5 * (1 - q) + 1;
      c.beginPath();
      c.arc(ex, ey, 7 * u + k * 10, -2.2 + q * 2 + k, -0.6 + q * 2 + k);
      c.stroke();
    }
  } else if (f.type === 'arrow') {
    const x = p.hx + 6 * u + (ex - p.hx - 6 * u) * q;
    c.fillStyle = '#fff';
    c.fillRect(x - 8, ey, 16, 2);
  } else if (f.type === 'pierce') {
    c.fillStyle = `rgba(255,255,220,${1 - q})`;
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * 6.28;
      c.fillRect(ex + Math.cos(a) * q * 34, ey + Math.sin(a) * q * 34, 3, 3);
    }
  } else if (f.type === 'charge') blob(c, p.hx + 5 * u, p.hy - 18 * u, 10 + 40 * q, 'rgba(170,200,255,.6)');
  else if (f.type === 'fire') {
    for (let k = 0; k < 26; k++) {
      const a = k * 2.39,
        r = q * 56 * (0.4 + (k % 5) / 5),
        y = ey - q * 22 * (k % 3);
      c.fillStyle = k % 2 ? `rgba(255,140,40,${1 - q})` : `rgba(255,220,90,${1 - q})`;
      const s = 7 * (1 - q) + 2;
      c.fillRect(ex + Math.cos(a) * r - s / 2, y + Math.sin(a) * r * 0.6 - s / 2, s, s);
    }
    blob(c, ex, ey, 80, `rgba(255,120,40,${0.55 * (1 - q)})`);
  } else if (f.type === 'ice') {
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * 6.28,
        r = 44 * (1 - q) + 8;
      c.fillStyle = `rgba(170,235,255,${1 - q * 0.7})`;
      c.save();
      c.translate(ex + Math.cos(a) * r, ey + Math.sin(a) * r * 0.7);
      c.rotate(a);
      c.fillRect(-11, -2, 22, 4);
      c.restore();
    }
    blob(c, ex, ey, 70, `rgba(140,220,255,${0.5 * (1 - q)})`);
  } else if (f.type === 'bolt') {
    c.strokeStyle = `rgba(255,240,120,${1 - q})`;
    c.lineWidth = 4 * (1 - q) + 1;
    for (let k = 0; k < 2; k++) {
      c.beginPath();
      let x = ex + (k ? 10 : -6),
        y = ey - 120;
      c.moveTo(x, y);
      for (let s = 0; s < 6; s++) {
        x += (s % 2 ? 1 : -1) * (8 + ((s * 7 + k * 5) % 9));
        y += 20;
        c.lineTo(x, y);
      }
      c.stroke();
    }
    blob(c, ex, ey, 70, `rgba(255,240,120,${0.55 * (1 - q)})`);
  } else if (f.type === 'chain') {
    c.strokeStyle = `rgba(200,220,255,${1 - q})`;
    c.lineWidth = 3 * (1 - q) + 1;
    c.beginPath();
    let x = ex - 30,
      y = ey - 30;
    c.moveTo(x, y);
    for (let s = 0; s < 4; s++) c.lineTo((x += 15), (y += s % 2 ? -12 : 20));
    c.stroke();
    blob(c, ex, ey, 40, `rgba(200,220,255,${0.5 * (1 - q)})`);
  } else if (f.type === 'summon') {
    for (let k = 0; k < 16; k++) {
      const a = k * 0.39 + q * 4,
        r = 30 * (1 - q) + 8;
      c.fillStyle = `rgba(200,160,255,${1 - q})`;
      c.fillRect(p.hx - 30 + Math.cos(a) * r, (p.hy ?? p.y) - 20 + Math.sin(a) * r * 0.5, 3, 3);
    }
  } else if (f.type === 'heal') {
    for (let k = 0; k < 14; k++) {
      const x = p.hx - 26 + ((k * 37) % 52),
        y = (p.hy ?? p.y) - 10 - q * 80 - (k % 4) * 8;
      c.fillStyle = `rgba(140,255,150,${1 - q})`;
      c.fillRect(x, y, 3, 3);
    }
  }
  c.restore();
}
window.addEventListener('resize', () => {
  if (B && !$('battle').hidden) {
    sizeBattle();
    paintBG(B.boss || D ? 'cave' : B.e.bg || 'meadow');
    renderBHud();
  }
});
