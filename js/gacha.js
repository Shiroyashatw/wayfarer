/* 漫步勇者 · 祈願（抽卡）：0.3.11 起抽「契靈」（比照火炬之光無限）。分戰鬥、掉落兩池，每類可以裝 3 隻：
   戰鬥契靈裝上會解鎖自己的「契約板」（用契約點加點），掉落契靈不用加點、裝上就全部生效，每隻對應一個地圖機制；
   任選一隻跟隨，互動範圍 +30 公尺。重複的契靈拿來突破。主畫面左上角的圖示可以直接打開 */
'use strict';
/* ================= pacts ================= */
/* 稀有度 0～5：N、M、R、SR、SSR、UR */
const PRAR = ['N', 'M', 'R', 'SR', 'SSR', 'UR'],
  PCOL = ['#a9a3b8', '#7bd36b', '#6ab8ff', '#c58cff', '#ffcf5a', '#ff5a7a'],
  /* 機率（%）：UR 0.5、SSR 2、SR 6.5、R 16、M 30、N 45 */
  PRATE = [45, 30, 16, 6.5, 2, 0.5],
  /* 保底：SSR 以上 50 抽內必出；UR 第 140 抽起每抽 +2%，180 抽必出；十連保證 SR 以上 */
  P_SSR = 50,
  P_UR_SOFT = 140,
  P_UR_HARD = 180,
  /* 突破：重複抽到同一隻 +1 階（最多 5 階），每階效果 +20%（UR +25%）；滿階後的重複換成祈願石／靈魂 */
  PBRK_MAX = 5,
  PBRK_BACK = [
    ['soul', 10],
    ['soul', 25],
    ['wish', 1],
    ['wish', 2],
    ['wish', 5],
    ['wish', 15]
  ],
  /* 每類的欄位數、跟隨時多出來的互動範圍（公尺） */
  PSLOTS = 3,
  PFOLLOW_R = 30,
  /* 契約板：內環 4 個小節點、中環 3 個中節點、外環 1 個大節點；中環要先點 2 個內環、外環要先點 2 個中環。
     三個環在 Lv1／20／40 開放，越稀有的契靈越早開（N～UR 提早 0／0／3／6／10／15 級）。契約點 = 1 + 等級 ÷ 3（最多 24） */
  PRING = [1, 20, 40],
  PRED = [0, 0, 3, 6, 10, 15],
  PNODE = ['s', 's', 's', 's', 'm', 'm', 'm', 'l'],
  PNODEN = { s: '小節點', m: '中節點', l: '大節點' };
/* 戰鬥契靈：b 是契約板的 s／m／l 節點效果（屬性，STAT0 的欄位）。
   掉落契靈：st 加屬性、mech 加機制（%）：q 掉寶數量、r 掉寶稀有度、xp 經驗、soul 靈魂、wish 祈願石、
   eng 刻印石系列、ud 亡靈精華與亡靈區進度、mist 魔霧進度、sin 七宗罪的傳奇與珠寶、hunt 追蹤之血與惡魔結晶、
   uw 侵蝕柱多充能一次的機率、stele 碑文碎片、dun 地城首領掉寶（有的話尾王三選一變四選一） */
const PACTS = [
  /* ---- 戰鬥 ---- */
  {
    id: 'f_slime',
    t: 'fight',
    r: 0,
    n: '草原史萊姆',
    spr: 'slime',
    th: '生命',
    b: { s: { life: 8 }, m: { lifePct: 4 }, l: { lifePct: 8, regen: 2 } }
  },
  {
    id: 'f_cat',
    t: 'fight',
    r: 0,
    n: '巷口黑貓',
    spr: 'cat',
    th: '暴擊',
    b: { s: { critPct: 1 }, m: { critMulti: 6 }, l: { critPct: 3, critMulti: 12 } }
  },
  {
    id: 'f_heron',
    t: 'fight',
    r: 0,
    n: '夜鷺',
    spr: 'bird',
    th: '閃避',
    b: { s: { evade: 2 }, m: { speed: 1 }, l: { evade: 5, speed: 1 } }
  },
  {
    id: 'f_leopardcat',
    t: 'fight',
    r: 1,
    n: '石虎',
    spr: 'cat',
    pal: { c: '#c8843a', e: '#ffe24a' },
    th: '物理',
    b: { s: { physPct: 4 }, m: { physPct: 8 }, l: { physMore: 6 } }
  },
  {
    id: 'f_crab',
    t: 'fight',
    r: 1,
    n: '招潮蟹',
    spr: 'crab',
    th: '護甲',
    b: { s: { armorPct: 6 }, m: { armorPct: 10 }, l: { armorMore: 8, block: 5 } }
  },
  {
    id: 'f_beetle',
    t: 'fight',
    r: 1,
    n: '獨角仙',
    spr: 'beetle',
    th: '抗性',
    b: { s: { resAll: 2 }, m: { resAll: 4 }, l: { resAll: 6, dmgRed: 3 } }
  },
  {
    id: 'f_leopard',
    t: 'fight',
    r: 2,
    n: '雲豹',
    spr: 'tiger',
    th: '暴擊',
    b: { s: { critPct: 2 }, m: { critMulti: 12 }, l: { critPct: 4, critMulti: 25 } }
  },
  {
    id: 'f_eagle',
    t: 'fight',
    r: 2,
    n: '熊鷹',
    spr: 'bird',
    th: '速度',
    b: { s: { speed: 1 }, m: { evade: 4 }, l: { speed: 3, dbl: 5 } }
  },
  {
    id: 'f_ghost',
    t: 'fight',
    r: 2,
    n: '水鬼',
    spr: 'spirit',
    th: '法術',
    b: { s: { spellPct: 6 }, m: { elePct: 8 }, l: { spellPct: 12, coldPct: 15 } }
  },
  {
    id: 'f_bear',
    t: 'fight',
    r: 3,
    n: '台灣黑熊',
    spr: 'bear',
    th: '坦克',
    b: { s: { lifePct: 4 }, m: { armorPct: 15 }, l: { lifeMore: 8, dmgRed: 5 } }
  },
  {
    id: 'f_viper',
    t: 'fight',
    r: 3,
    n: '百步蛇',
    spr: 'snake',
    th: '中毒',
    b: { s: { poisonCh: 5 }, m: { poisonPct: 15 }, l: { poisonCh: 15, poisonPct: 30, dotPct: 15 } }
  },
  {
    id: 'f_lion',
    t: 'fight',
    r: 4,
    n: '風獅爺',
    spr: 'lion',
    th: '守護',
    b: { s: { resAll: 3 }, m: { dmgMore: 4 }, l: { dmgMore: 10, resAll: 8 } }
  },
  {
    id: 'f_tigerlord',
    t: 'fight',
    r: 4,
    n: '虎爺',
    spr: 'a_z_tiger',
    th: '暴擊',
    b: { s: { critPct: 2 }, m: { critMulti: 15 }, l: { critPct: 5, critMulti: 30, speed: 2 } }
  },
  {
    id: 'f_dragon',
    t: 'fight',
    r: 5,
    n: '蒼龍',
    spr: 'a_z_dragon',
    th: '連動',
    b: { s: { dmgMore: 2 }, m: { speed: 2 }, l: { dmgMore: 12, extraTurn: 6, speed: 2 } }
  },
  /* ---- 掉落（每隻對應一個機制） ---- */
  {
    id: 'd_lucky',
    t: 'drop',
    r: 0,
    n: '招財小貓',
    spr: 'cat',
    pal: { c: '#f4ead2', e: '#2a1a10' },
    th: '金幣',
    st: { goldPct: 10 }
  },
  { id: 'd_mush', t: 'drop', r: 0, n: '靈芝', spr: 'mush', th: '靈魂', mech: { soul: 10 } },
  { id: 'd_firefly', t: 'drop', r: 0, n: '螢火蟲', spr: 'butterfly', th: '經驗', st: { vision: 8 }, mech: { xp: 6 } },
  { id: 'd_pangolin', t: 'drop', r: 1, n: '穿山甲', spr: 'pangolin', th: '掉寶', mech: { q: 6 } },
  { id: 'd_frog', t: 'drop', r: 1, n: '樹蛙', spr: 'frog', th: '刻印石', mech: { eng: 20 } },
  { id: 'd_lantern', t: 'drop', r: 1, n: '燈籠妖', spr: 'lantern', th: '石碑', mech: { stele: 25 } },
  { id: 'd_owl', t: 'drop', r: 2, n: '守墓夜梟', spr: 'bat', th: '亡靈', mech: { ud: 25 } },
  { id: 'd_fox', t: 'drop', r: 2, n: '霧中狐', spr: 'wolf', th: '魔霧', mech: { mist: 25, sin: 10 } },
  { id: 'd_hound', t: 'drop', r: 2, n: '獵犬', spr: 'wolf', th: '狩獵', mech: { hunt: 25 } },
  { id: 'd_turtle', t: 'drop', r: 3, n: '綠蠵龜', spr: 'turtle', th: '稀有度', mech: { r: 10, q: 5 } },
  {
    id: 'd_raven',
    t: 'drop',
    r: 3,
    n: '冥河渡鴉',
    spr: 'bird',
    pal: { b: '#2a2238', e: '#ff5a7a', y: '#5a4a6a', w: '#6a5a8a' },
    th: '冥府',
    mech: { uw: 25, q: 5 }
  },
  {
    id: 'd_fortune',
    t: 'drop',
    r: 4,
    n: '夜市招財貓',
    spr: 'a_z_rat',
    th: '財富',
    st: { goldPct: 40 },
    mech: { q: 12 }
  },
  { id: 'd_toad', t: 'drop', r: 4, n: '金蟾', spr: 'a_z_rabbit', th: '祈願', mech: { wish: 30, soul: 25 } },
  { id: 'd_pegasus', t: 'drop', r: 5, n: '天馬', spr: 'a_z_horse', th: '地城', mech: { dun: 30, q: 15, r: 15 } }
];
const PACTI = Object.fromEntries(PACTS.map(p => [p.id, p]));
const PTYPE = { fight: '戰鬥', drop: '掉落' };
const PMECHN = {
  q: '掉寶數量',
  r: '掉寶稀有度',
  xp: '經驗',
  soul: '靈魂',
  wish: '祈願石掉落',
  eng: '刻印石系列掉落機率',
  ud: '亡靈精華與亡靈區進度',
  mist: '魔霧進度',
  sin: '七宗罪的傳奇與珠寶機率',
  hunt: '追蹤之血與惡魔結晶',
  uw: '侵蝕柱多充能一次的機率',
  stele: '碑文碎片掉落機率',
  dun: '地城首領掉寶（尾王三選一變四選一）'
};
const PD = () => {
  const d = (S.pact = S.pact || {});
  d.have = d.have || {};
  if (!d.eq || !Array.isArray(d.eq.fight)) d.eq = { fight: [], drop: [] };
  d.board = d.board || {};
  return d;
};
/* 目前效果倍率：突破每階 +20%（UR +25%） */
const pactMul = (id, brk = PD().have[id] || 0) => 1 + brk * (PACTI[id].r === 5 ? 0.25 : 0.2);
const pactOwned = id => PD().have[id] != null;
const pactEqOf = t => PD().eq[t].filter(id => PACTI[id] && pactOwned(id));
const pactsOn = () => [...pactEqOf('fight'), ...pactEqOf('drop')];
const pactIsOn = id => pactsOn().includes(id);
/* 數值會四捨五入到整數（太小的保留一位小數） */
const pv = (v, m) => (Math.abs(v * m) < 10 ? Math.round(v * m * 10) / 10 : Math.round(v * m));
const stTxt = (o, m) => Object.entries(o || {}).map(([k, v]) => (STATN[k] ? STATN[k](pv(v, m)) : `${k} +${pv(v, m)}`));
const mechTxt = (o, m) => Object.entries(o || {}).map(([k, v]) => `${PMECHN[k]} +${pv(v, m)}%`);
/* ---- 契約板 ---- */
const pactPts = () => Math.min(24, 1 + fl(S.lv / 3));
const pactBoard = id => PD().board[id] || (PD().board[id] = []);
const pactUsed = () => pactEqOf('fight').reduce((a, id) => a + pactBoard(id).length, 0);
const ringOf = i => (i < 4 ? 0 : i < 7 ? 1 : 2);
const ringLv = (id, k) => Math.max(1, PRING[k] - PRED[PACTI[id].r]);
/* 這組已點的節點是否合法（中環要 2 個內環、外環要 2 個中環、環要開放） */
function boardOk(id, set) {
  const n = k => set.filter(i => ringOf(i) === k).length;
  return set.every(i => {
    const k = ringOf(i);
    return S.lv >= ringLv(id, k) && (k === 0 || n(k - 1) >= 2);
  });
}
function nodeBlock(id, i) {
  const set = pactBoard(id);
  if (set.includes(i))
    return boardOk(
      id,
      set.filter(q => q !== i)
    )
      ? ''
      : '其他節點要靠它';
  const k = ringOf(i);
  if (S.lv < ringLv(id, k)) return `Lv${ringLv(id, k)} 開放`;
  if (k && set.filter(q => ringOf(q) === k - 1).length < 2) return `先點 2 個${k === 1 ? '內環' : '中環'}`;
  if (pactUsed() >= pactPts()) return '契約點不夠';
  return '';
}
/* sumStats 呼叫：戰鬥契靈加已點的契約板節點，掉落契靈加全部屬性 */
function pactStats(A) {
  for (const id of pactEqOf('fight')) {
    const p = PACTI[id],
      m = pactMul(id);
    for (const i of pactBoard(id)) {
      const o = p.b[PNODE[i]];
      for (const k in o) A(k, pv(o[k], m));
    }
  }
  for (const id of pactEqOf('drop')) {
    const p = PACTI[id],
      m = pactMul(id);
    for (const k in p.st || {}) A(k, pv(p.st[k], m));
  }
}
/* 掉落契靈的機制加成（%） */
function pactMech(k) {
  let v = 0;
  for (const id of pactEqOf('drop')) {
    const p = PACTI[id];
    if (p.mech && p.mech[k]) v += pv(p.mech[k], pactMul(id));
  }
  return v;
}
const pactK = k => 1 + pactMech(k) / 100;
/* 跟隨的契靈：互動範圍 +30 公尺（core.js 的 reachOf） */
const pactFollow = () => {
  const id = S.pact && S.pact.follow;
  return id && PACTI[id] && pactOwned(id) ? id : null;
};
/* 效果說明：戰鬥契靈列出三種節點（滿板的總和），掉落契靈列出全部 */
function pactTxt(id, brk) {
  const p = PACTI[id],
    m = pactMul(id, brk);
  if (p.t === 'fight') return ['s', 'm', 'l'].map(k => `${PNODEN[k]}：${stTxt(p.b[k], m).join('、')}`).join('；');
  return [...stTxt(p.st, m), ...mechTxt(p.mech, m)].join('、');
}
/* 契靈的小圖：16×16 怪物圖用自己的配色（pal），沒有就用同名、再來是同種怪物的配色；PNG 的生肖圖直接用 */
function pactImg(id) {
  const p = PACTI[id],
    m = MONS.find(q => q.name === p.n) || MONS.find(q => q.spr === p.spr);
  return portrait(p.spr, p.pal || (m ? m.pal : undefined));
}
const pactPal = id => {
  const p = PACTI[id],
    m = MONS.find(q => q.name === p.n) || MONS.find(q => q.spr === p.spr);
  return p.pal || (m ? m.pal : undefined);
};
const pactTile = (id, extra = '') => {
  const p = PACTI[id];
  return `<span class="ptile p${p.r}" ${extra}><img src="${pactImg(id)}" alt=""><i class="prar">${PRAR[p.r]}</i></span>`;
};

/* ================= banners ================= */
const BANNERS = [
  {
    id: 'fight',
    n: '戰鬥契靈',
    sub: '常駐',
    feat: ['f_dragon', 'f_tigerlord', 'f_lion', 'f_bear'],
    bg: ['#3a1f2a', '#6a2f3a', '#ff7a6a'],
    d: '戰鬥契靈可以裝 3 隻，每隻裝上會解鎖自己的契約板（一種主題：暴擊、毒、坦、法術…），用契約點加點。'
  },
  {
    id: 'drop',
    n: '掉落契靈',
    sub: '常駐',
    feat: ['d_pegasus', 'd_fortune', 'd_toad', 'd_raven'],
    bg: ['#1f3a2a', '#2f6a4a', '#7bd36b'],
    d: '掉落契靈也可以裝 3 隻，不用加點、裝上就全部生效。每隻對應一個機制：亡靈、魔霧、狩獵、冥府、石碑、地城、刻印石、靈魂、金幣…'
  }
];
const ppool = (t, r) => PACTS.filter(p => p.t === t && p.r === r);
const GA = { b: 'fight', res: null, shown: 0, skip: false };
function pityOf(id) {
  S.pity = S.pity || {};
  const p = S.pity[id];
  return p && typeof p === 'object' ? p : (S.pity[id] = { u: 0, s: 0 });
}
function gachaRoll(bn, guarSR) {
  const pt = pityOf(bn.id);
  pt.u++;
  pt.s++;
  const ur = pt.u >= P_UR_HARD ? 100 : PRATE[5] + Math.max(0, pt.u - P_UR_SOFT + 1) * 2;
  let x = Math.random() * 100,
    r;
  if (x < ur) r = 5;
  else {
    x = Math.random() * (100 - PRATE[5]);
    r = 0;
    for (let k = 4, acc = 0; k >= 0; k--) {
      acc += PRATE[k];
      if (x < acc) {
        r = k;
        break;
      }
    }
  }
  if (r < 4 && pt.s >= P_SSR) r = 4;
  if (guarSR && r < 3) r = 3;
  if (r === 5) pt.u = 0;
  if (r >= 4) pt.s = 0;
  const pool = ppool(bn.id, r),
    p = pool[fl(Math.random() * pool.length)];
  return { id: p.id, r, ...pactGive(p.id) };
}
/* 拿到一隻契靈：新的、突破、或滿階換成材料 */
function pactGive(id) {
  const h = PD().have;
  if (h[id] == null) {
    h[id] = 0;
    const t = PACTI[id].t;
    if (pactEqOf(t).length < PSLOTS) PD().eq[t].push(id);
    return { isNew: true };
  }
  if (h[id] < PBRK_MAX) {
    h[id]++;
    return { brk: h[id] };
  }
  const [c, n] = PBRK_BACK[PACTI[id].r];
  giveCur(c, n);
  return { back: `${GCURI[c].n} ×${n}` };
}
function gachaPull(times) {
  const bn = BANNERS.find(b => b.id === GA.b);
  if (!bn) return;
  const cost = GEM_DRAW * times;
  if ((S.cur.wish || 0) < cost) {
    toast(`祈願石不足（需要 ${cost}）`);
    sfx('nope');
    return;
  }
  S.cur.wish -= cost;
  const res = [];
  for (let i = 0; i < times; i++) res.push(gachaRoll(bn, times === 10 && i === 9 && !res.some(q => q.r >= 3)));
  addLog(`${bn.n}祈願 ×${times}：${res.map(q => `${PRAR[q.r]} ${PACTI[q.id].n}`).join('、')}`);
  save();
  GA.res = res;
  GA.shown = 0;
  GA.skip = false;
  renderGacha();
  const top = Math.max(...res.map(q => q.r));
  sfx(top >= 4 ? 'level' : top === 3 ? 'bless' : 'coin');
  buzz(top === 5 ? 300 : top === 4 ? 150 : 60);
  revealNext();
}
function revealNext() {
  if (!GA.res) return;
  if (GA.skip) GA.shown = GA.res.length;
  else GA.shown++;
  document.querySelectorAll('#gaRes .gcard').forEach((el, i) => el.classList.toggle('on', i < GA.shown));
  const done = GA.shown >= GA.res.length;
  $('gaResBtns').hidden = !done;
  if (!done) setTimeout(revealNext, GA.res.length > 1 ? 160 : 300);
  else if (GA.res.some(q => q.r >= 4)) sfx('win');
}

/* ================= ui ================= */
function openGacha() {
  closeSheet();
  navClose();
  GA.res = null;
  $('gacha').hidden = false;
  sfx('door');
  renderGacha();
}
function closeGacha() {
  $('gacha').hidden = true;
  GA.res = null;
  renderHud();
}
function renderGacha() {
  const bn = BANNERS.find(b => b.id === GA.b),
    have = S.cur.wish || 0,
    pt = pityOf(bn.id),
    eq = pactEqOf(bn.id);
  let html = `<div class="gaTop"><b>契靈祈願</b><span class="gaCur">${curDot('wish')}祈願石 <b>${have}</b></span><button class="x" data-act="gaClose" aria-label="關閉">✕</button></div>
  <div class="gaTabs">${BANNERS.map(b => `<button class="gaTab${b.id === GA.b ? ' on' : ''}" data-act="gaTab" data-id="${b.id}" style="--c:${b.bg[2]}"><b>${b.n}</b><small>${b.sub}</small></button>`).join('')}<button class="gaTab" data-act="pactOpen" style="--c:#ffd66a"><b>我的契靈</b><small>${Object.keys(PD().have).length}/${PACTS.length}</small></button></div>
  <div class="gaBanner" style="background:radial-gradient(120% 90% at 70% 30%,${bn.bg[1]},${bn.bg[0]} 70%);--c:${bn.bg[2]}">
    <div class="gaFeat">${bn.feat.map(id => `<div>${pactTile(id)}<small style="color:${PCOL[PACTI[id].r]}">${PACTI[id].n}</small></div>`).join('')}</div>
    <div class="gaInfo"><h3>${bn.n}</h3><p>${bn.d}</p><p class="sub">目前裝著（${eq.length}/${PSLOTS}）：${eq.length ? eq.map(id => `<b style="color:${PCOL[PACTI[id].r]}">${PACTI[id].n}</b>`).join('、') : '沒有'}</p>
    <p class="sub">UR ${PRATE[5]}%・SSR ${PRATE[4]}%・SR ${PRATE[3]}%・十連保證 SR 以上・${P_SSR} 抽內必出 SSR 以上（${pt.s}/${P_SSR}）・${P_UR_HARD} 抽內必出 UR（${pt.u}/${P_UR_HARD}）</p></div>
  </div>
  <div class="gaBtns"><button class="btn gaPull" data-act="gaPull" data-n="1" ${have >= GEM_DRAW ? '' : 'disabled'}>祈願 ×1<small>${curDot('wish')} ${GEM_DRAW}</small></button><button class="btn pri gaPull" data-act="gaPull" data-n="10" ${have >= GEM_DRAW * 10 ? '' : 'disabled'}>祈願 ×10<small>${curDot('wish')} ${GEM_DRAW * 10}</small></button></div>
  <details class="gaRates"><summary>卡池內容與機率</summary>${[5, 4, 3, 2, 1, 0]
    .map(
      r =>
        `<div><b style="color:${PCOL[r]}">${PRAR[r]}</b> <span class="sub">${PRATE[r]}%</span> ${ppool(bn.id, r)
          .map(p => `${p.n}<span class="sub">（${p.th}）</span>`)
          .join('、')}</div>`
    )
    .join(
      ''
    )}<p class="sub">重複抽到同一隻會「突破」：每階效果 +20%（UR +25%），最多 ${PBRK_MAX} 階；滿階之後的重複換成祈願石或靈魂。</p><p class="sub">祈願石：升級、今日委託、菁英與首領、廟宇參拜、絲綢之路商隊、地城尾王的靈魂寶藏。</p></details>`;
  if (GA.res) {
    const top = Math.max(...GA.res.map(q => q.r));
    html += `<div class="gaRes p${top}" data-act="gaSkip"><div class="gaGrid${GA.res.length > 1 ? ' ten' : ''}" id="gaRes">${GA.res
      .map(
        (q, i) =>
          `<div class="gcard p${q.r}${i < GA.shown ? ' on' : ''}" style="--d:${i}"><div class="gback"></div><div class="gface">${q.isNew ? '<i class="gnew">NEW</i>' : ''}${pactTile(q.id)}<b style="color:${PCOL[q.r]}">${PACTI[q.id].n}</b><small>${q.isNew ? PTYPE[PACTI[q.id].t] : q.brk ? `突破 ${q.brk} 階` : q.back}</small></div></div>`
      )
      .join(
        ''
      )}</div><div class="btns" id="gaResBtns" ${GA.shown >= GA.res.length ? '' : 'hidden'}><button class="btn" data-act="gaAgain" data-n="${GA.res.length}">再抽 ${GA.res.length} 次</button><button class="btn pri" data-act="gaDone">確定</button></div></div>`;
  }
  $('gacha').innerHTML = html;
}
/* 「我的契靈」面板（sheet 'pact'）：戰鬥與掉落各 3 格、跟隨、已擁有的契靈 */
function pactHTML() {
  const h = PD().have,
    fo = pactFollow(),
    slots = t => {
      const on = pactEqOf(t);
      return `<div class="pslots">${Array.from({ length: PSLOTS }, (_, i) => {
        const id = on[i];
        return id
          ? `<button class="pslot" data-act="${t === 'fight' ? 'pboard' : 'pinfo'}" data-id="${id}">${pactTile(id)}<span style="color:${PCOL[PACTI[id].r]}">${PACTI[id].n}</span><small>${t === 'fight' ? `契約板 ${pactBoard(id).length}/8` : PACTI[id].th}</small></button>`
          : `<div class="pslot empty"><span class="ptile"></span><span>第 ${i + 1} 格</span></div>`;
      }).join('')}</div>`;
    };
  return ['fight', 'drop']
    .map(t => {
      const own = PACTS.filter(p => p.t === t && h[p.id] != null).sort(
        (a, b) => b.r - a.r || (h[b.id] || 0) - (h[a.id] || 0)
      );
      return `<h3>${PTYPE[t]}契靈・已裝 ${pactEqOf(t).length}/${PSLOTS}${t === 'fight' ? `<small class="sub">・契約點 ${pactUsed()}/${pactPts()}</small>` : ''}</h3>
      <p class="sub" style="margin:0">${t === 'fight' ? '裝上後點頭像打開它的契約板，用契約點加點（點數隨等級增加，卸下會退回）。越稀有的契靈越早開放中環與外環。' : '不用加點，裝上就全部生效。每隻對應一個地圖機制。'}</p>
      ${slots(t)}<div class="card">${
        own
          .map(p => {
            const on = pactIsOn(p.id);
            return `<div class="rowx"><div class="t" style="display:flex;gap:10px;align-items:center">${pactTile(p.id)}<div style="display:grid;gap:2px"><b><span style="color:${PCOL[p.r]}">${PRAR[p.r]}</span> ${p.n} <span class="sub">${p.th}${h[p.id] ? `・突破 ${h[p.id]}/${PBRK_MAX}` : ''}</span></b><small>${pactTxt(p.id)}</small></div></div><div style="display:grid;gap:4px"><button class="btn sm ${on ? '' : 'pri'}" data-act="pactEq" data-id="${p.id}">${on ? '卸下' : '裝備'}</button><button class="btn sm" data-act="pactFollow" data-id="${p.id}">${fo === p.id ? '跟隨中' : '跟隨'}</button></div></div>`;
          })
          .join('') || '<p class="sub">還沒有，去祈願吧</p>'
      }</div>`;
    })
    .join('')
    .concat(
      `<p class="sub">跟隨：任選一隻契靈（不用裝上）在地圖上跟著你，互動範圍 +${PFOLLOW_R} 公尺。${fo ? `目前是${PACTI[fo].n}。` : ''}</p><div class="btns"><button class="btn pri" data-act="gacha">${curDot('wish')}契靈祈願（${S.cur.wish || 0}）</button></div>`
    );
}
/* 戰鬥契靈的契約板（sheet 'pboard'）：中間是契靈，內環 4、中環 3、外環 1 */
function pboardHTML() {
  const id = SEL.pboard,
    p = PACTI[id];
  if (!p || !pactOwned(id)) return '<p class="sub">找不到這隻契靈</p>';
  const set = pactBoard(id),
    m = pactMul(id),
    on = pactIsOn(id),
    R = [34, 62, 88],
    pos = i => {
      const k = ringOf(i),
        a = k === 0 ? -90 + 45 + i * 90 : k === 1 ? -90 + (i - 4) * 120 : -90,
        r = R[k];
      return [50 + r * 0.5 * Math.cos((a * Math.PI) / 180), 50 + r * 0.5 * Math.sin((a * Math.PI) / 180)];
    };
  const nodes = PNODE.map((t, i) => {
    const [x, y] = pos(i),
      got = set.includes(i),
      blk = nodeBlock(id, i);
    return `<button class="pnode ${t}${got ? ' on' : ''}${!got && blk ? ' lock' : ''}" style="left:${x}%;top:${y}%" data-act="pnode" data-i="${i}" ${on ? '' : 'disabled'} aria-label="${PNODEN[t]}"></button>`;
  }).join('');
  return `<div class="card"><div class="rowx" style="justify-content:flex-start;gap:12px">${pactTile(id)}<div class="t"><b><span style="color:${PCOL[p.r]}">${PRAR[p.r]}</span> ${p.n} <span class="sub">${p.th}${PD().have[id] ? `・突破 ${PD().have[id]}/${PBRK_MAX}（效果 ×${m}）` : ''}</span></b><small>契約點 ${pactUsed()}/${pactPts()}・中環 Lv${ringLv(id, 1)}、外環 Lv${ringLv(id, 2)} 開放</small></div></div></div>
    ${on ? '' : '<p class="sub" style="color:#ffb27a">先把這隻契靈裝到戰鬥欄位，才能加點。</p>'}
    <div class="pboard"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="17" /><circle cx="50" cy="50" r="31" /><circle cx="50" cy="50" r="44" /></svg><span class="pcore" style="left:50%;top:50%">${pactTile(id)}</span>${nodes}</div>
    <div class="card">${['s', 'm', 'l']
      .map(
        t =>
          `<div class="rowx"><div class="t"><b>${PNODEN[t]}（${t === 's' ? '內環 ×4' : t === 'm' ? '中環 ×3' : '外環 ×1'}）</b><small>${stTxt(p.b[t], m).join('、')}</small></div><small class="sub">已點 ${set.filter(i => PNODE[i] === t).length}</small></div>`
      )
      .join('')}</div>
    <div class="btns"><button class="btn" data-act="pboardReset" ${set.length ? '' : 'disabled'}>全部退點</button><button class="btn" data-act="sheet" data-s="pact">返回契靈</button></div>`;
}
const pactRefresh = () => {
  clampHP();
  renderSheet();
  renderHud();
  save();
};
Object.assign(A, {
  gacha: () => {
    audioInit();
    openGacha();
  },
  gaClose: () => closeGacha(),
  gaTab: d => {
    GA.b = d.id;
    sfx('tap');
    renderGacha();
  },
  gaPull: d => gachaPull(+d.n),
  gaAgain: d => gachaPull(+d.n),
  gaSkip: () => {
    if (GA.res && GA.shown < GA.res.length) GA.skip = true;
  },
  gaDone: () => {
    GA.res = null;
    renderGacha();
  },
  pactOpen: () => {
    closeGacha();
    openSheet('pact');
  },
  pactEq: d => {
    const p = PACTI[d.id];
    if (!p || !pactOwned(p.id) || B || MB) return;
    const eq = PD().eq,
      on = pactEqOf(p.t);
    if (on.includes(p.id)) {
      /* 卸下：契約板的點數退回 */
      eq[p.t] = on.filter(q => q !== p.id);
      PD().board[p.id] = [];
    } else if (on.length >= PSLOTS) {
      toast(`${PTYPE[p.t]}契靈最多裝 ${PSLOTS} 隻，先卸下一隻`);
      sfx('nope');
      return;
    } else eq[p.t] = [...on, p.id];
    sfx('select');
    pactRefresh();
  },
  pactFollow: d => {
    if (!pactOwned(d.id)) return;
    PD().follow = PD().follow === d.id ? null : d.id;
    sfx('tap');
    pactRefresh();
  },
  pboard: d => {
    SEL.pboard = d.id;
    openSheet('pboard');
  },
  pinfo: d => {
    const p = PACTI[d.id];
    if (p) toast(`${p.n}：${pactTxt(p.id)}`);
  },
  pnode: d => {
    const id = SEL.pboard,
      i = +d.i;
    if (!pactIsOn(id) || B || MB || nodeBlock(id, i)) {
      if (pactIsOn(id) && nodeBlock(id, i)) toast(nodeBlock(id, i));
      return;
    }
    const set = pactBoard(id);
    PD().board[id] = set.includes(i) ? set.filter(q => q !== i) : [...set, i];
    sfx('select');
    pactRefresh();
  },
  pboardReset: () => {
    if (B || MB) return;
    PD().board[SEL.pboard] = [];
    sfx('tap');
    pactRefresh();
  }
});
