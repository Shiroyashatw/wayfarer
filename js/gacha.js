/* 漫步勇者 · 祈願（抽卡）：0.3.12 起契靈只有一種，稀有度 SSR／SR／R。
   每抽一次都是一隻新的契靈（同名也各自獨立），帶 6 條隨機的戰鬥詞綴（T6～T1，SSR 保底 T3 以上、另有 SSR 專屬詞綴），一開始只解鎖第 1 條；
   拿另一隻同名的契靈當材料吃掉就突破一次，解鎖下一條。抽到詞綴更好的同名契靈，可以改培養那一隻。契靈的標籤由詞綴決定。
   欄位 2 格起跳，每通過一場昇華試煉 +1 格（最多 6 格）；任選一隻跟隨，互動範圍 +30 公尺。主畫面左上角的圖示可以直接打開 */
'use strict';
/* ================= pacts ================= */
/* 稀有度 0～2：R、SR、SSR */
const PRAR = ['R', 'SR', 'SSR'],
  PCOL = ['#6ab8ff', '#c58cff', '#ffcf5a'],
  /* 機率（%）：SSR 2.5、SR 17.5、R 80 */
  PRATE = [80, 17.5, 2.5],
  /* 保底：SSR 第 60 抽起每抽 +5%，80 抽必出；十連保證 SR 以上 */
  P_SOFT = 60,
  P_HARD = 80,
  /* 6 條詞綴，第 1 條拿到就解鎖，之後每突破一次解鎖一條（最多 5 次） */
  PAFF_N = 6,
  PBRK_MAX = 5,
  /* 欄位：2 格 + 每通過一場昇華試煉 1 格（ASC_LV 共 4 場，最多 6 格）；跟隨時多出來的互動範圍（公尺） */
  PSLOT0 = 2,
  PSLOT_MAX = 6,
  PFOLLOW_R = 30;
/* 詞綴階級 T6～T1（索引 0～5，T1 最好）的權重：R 全部都可能、SR 最低 T5、SSR 保底 T3 以上 */
const PTW = [
    [30, 26, 20, 14, 7, 3],
    [0, 24, 28, 24, 16, 8],
    [0, 0, 0, 55, 32, 13]
  ],
  PTN = i => 'T' + (6 - i);
/* 標籤：由詞綴決定（例如有火焰傷害的詞綴，契靈就有火焰標籤） */
const PTAG = {
  fire: '火焰',
  cold: '冰冷',
  light: '閃電',
  ele: '元素',
  phys: '物理',
  spell: '法術',
  attack: '攻擊',
  crit: '暴擊',
  life: '生命',
  def: '防禦',
  speed: '速度',
  poison: '中毒',
  dot: '持續傷害',
  pet: '召喚',
  skill: '技能等級'
};
/* 詞綴：k 是屬性欄位（STAT0），v 是 T6～T1 的數值範圍（null 表示這一階不會出現），tg 標籤，ssr 只有 SSR 契靈會出現。
   sk 是「特定技能等級 +N」：從 T3 開始才會出現，T3 +1、T2 +2、T1 +3（可以超過技能石的等級上限） */
const PAFF = [
  {
    id: 'life',
    k: 'life',
    tg: ['life'],
    v: [
      [5, 8],
      [9, 13],
      [14, 19],
      [20, 27],
      [28, 36],
      [37, 48]
    ]
  },
  {
    id: 'lifePct',
    k: 'lifePct',
    tg: ['life'],
    v: [
      [2, 3],
      [3, 4],
      [4, 6],
      [6, 8],
      [8, 10],
      [10, 13]
    ]
  },
  {
    id: 'physPct',
    k: 'physPct',
    tg: ['phys', 'attack'],
    v: [
      [3, 5],
      [5, 8],
      [8, 11],
      [11, 15],
      [15, 19],
      [19, 25]
    ]
  },
  {
    id: 'spellPct',
    k: 'spellPct',
    tg: ['spell'],
    v: [
      [3, 5],
      [5, 8],
      [8, 11],
      [11, 15],
      [15, 19],
      [19, 25]
    ]
  },
  {
    id: 'firePct',
    k: 'firePct',
    tg: ['fire'],
    v: [
      [4, 6],
      [6, 9],
      [9, 13],
      [13, 17],
      [17, 22],
      [22, 28]
    ]
  },
  {
    id: 'coldPct',
    k: 'coldPct',
    tg: ['cold'],
    v: [
      [4, 6],
      [6, 9],
      [9, 13],
      [13, 17],
      [17, 22],
      [22, 28]
    ]
  },
  {
    id: 'lightPct',
    k: 'lightPct',
    tg: ['light'],
    v: [
      [4, 6],
      [6, 9],
      [9, 13],
      [13, 17],
      [17, 22],
      [22, 28]
    ]
  },
  {
    id: 'elePct',
    k: 'elePct',
    tg: ['ele'],
    v: [
      [3, 4],
      [4, 6],
      [6, 9],
      [9, 12],
      [12, 15],
      [15, 19]
    ]
  },
  {
    id: 'critPct',
    k: 'critPct',
    tg: ['crit'],
    v: [
      [1, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6]
    ]
  },
  {
    id: 'critMulti',
    k: 'critMulti',
    tg: ['crit'],
    v: [
      [4, 6],
      [6, 9],
      [9, 13],
      [13, 18],
      [18, 24],
      [24, 30]
    ]
  },
  {
    id: 'armorPct',
    k: 'armorPct',
    tg: ['def'],
    v: [
      [4, 6],
      [6, 9],
      [9, 13],
      [13, 17],
      [17, 22],
      [22, 28]
    ]
  },
  {
    id: 'evade',
    k: 'evade',
    tg: ['def'],
    v: [
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 8]
    ]
  },
  {
    id: 'resAll',
    k: 'resAll',
    tg: ['def'],
    v: [
      [2, 3],
      [3, 4],
      [4, 6],
      [6, 8],
      [8, 10],
      [10, 12]
    ]
  },
  {
    id: 'speed',
    k: 'speed',
    tg: ['speed'],
    v: [
      [1, 1],
      [1, 1],
      [1, 2],
      [2, 2],
      [2, 3],
      [3, 4]
    ]
  },
  {
    id: 'dbl',
    k: 'dbl',
    tg: ['attack'],
    v: [
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 8]
    ]
  },
  {
    id: 'poisonCh',
    k: 'poisonCh',
    tg: ['poison'],
    v: [
      [3, 5],
      [5, 7],
      [7, 10],
      [10, 13],
      [13, 16],
      [16, 20]
    ]
  },
  {
    id: 'poisonPct',
    k: 'poisonPct',
    tg: ['poison', 'dot'],
    v: [
      [5, 8],
      [8, 12],
      [12, 17],
      [17, 23],
      [23, 30],
      [30, 40]
    ]
  },
  {
    id: 'dotPct',
    k: 'dotPct',
    tg: ['dot'],
    v: [
      [4, 6],
      [6, 9],
      [9, 13],
      [13, 17],
      [17, 22],
      [22, 28]
    ]
  },
  {
    id: 'petPct',
    k: 'petPct',
    tg: ['pet'],
    v: [
      [5, 8],
      [8, 12],
      [12, 17],
      [17, 23],
      [23, 30],
      [30, 40]
    ]
  },
  {
    id: 'regen',
    k: 'regen',
    tg: ['life'],
    v: [
      [1, 1],
      [1, 2],
      [2, 2],
      [2, 3],
      [3, 4],
      [4, 5]
    ]
  },
  {
    id: 'mana',
    k: 'mana',
    tg: ['spell'],
    v: [
      [3, 5],
      [5, 8],
      [8, 11],
      [11, 15],
      [15, 20],
      [20, 26]
    ]
  },
  { id: 'sk', sk: 1, tg: ['skill'], v: [null, null, null, [1, 1], [2, 2], [3, 3]] },
  /* SSR 專屬 */
  { id: 'dmgMore', k: 'dmgMore', ssr: 1, tg: ['attack', 'spell'], v: [null, null, null, [4, 6], [6, 8], [8, 10]] },
  { id: 'lifeMore', k: 'lifeMore', ssr: 1, tg: ['life'], v: [null, null, null, [4, 6], [6, 8], [8, 10]] },
  { id: 'extraTurn', k: 'extraTurn', ssr: 1, tg: ['speed'], v: [null, null, null, [2, 3], [3, 4], [4, 5]] },
  { id: 'penRes', k: 'penRes', ssr: 1, tg: ['ele'], v: [null, null, null, [4, 6], [6, 8], [8, 10]] },
  { id: 'allSk', allSk: 1, ssr: 1, tg: ['skill'], v: [null, null, null, [1, 1], [1, 1], [2, 2]] }
];
const PAFFI = Object.fromEntries(PAFF.map(a => [a.id, a]));
/* 契靈本身只有名字、外觀與稀有度；詞綴是抽到時骰的 */
const PACTS = [
  /* ---- SSR ---- */
  { id: 'f_dragon', r: 2, n: '蒼龍', spr: 'a_z_dragon' },
  { id: 'd_pegasus', r: 2, n: '天馬', spr: 'a_z_horse' },
  { id: 'f_tigerlord', r: 2, n: '虎爺', spr: 'a_z_tiger' },
  { id: 'f_lion', r: 2, n: '風獅爺', spr: 'lion' },
  { id: 'd_fortune', r: 2, n: '夜市招財貓', spr: 'a_z_rat' },
  { id: 'd_toad', r: 2, n: '金蟾', spr: 'a_z_rabbit' },
  /* ---- SR ---- */
  { id: 'f_bear', r: 1, n: '台灣黑熊', spr: 'bear' },
  { id: 'f_viper', r: 1, n: '百步蛇', spr: 'snake' },
  { id: 'f_leopard', r: 1, n: '雲豹', spr: 'tiger' },
  { id: 'f_eagle', r: 1, n: '熊鷹', spr: 'bird' },
  { id: 'f_ghost', r: 1, n: '水鬼', spr: 'spirit' },
  { id: 'd_turtle', r: 1, n: '綠蠵龜', spr: 'turtle' },
  { id: 'd_raven', r: 1, n: '冥河渡鴉', spr: 'bird', pal: { b: '#2a2238', e: '#ff5a7a', y: '#5a4a6a', w: '#6a5a8a' } },
  { id: 'd_owl', r: 1, n: '守墓夜梟', spr: 'bat' },
  /* ---- R ---- */
  { id: 'f_slime', r: 0, n: '草原史萊姆', spr: 'slime' },
  { id: 'f_cat', r: 0, n: '巷口黑貓', spr: 'cat' },
  { id: 'f_heron', r: 0, n: '夜鷺', spr: 'bird' },
  { id: 'f_leopardcat', r: 0, n: '石虎', spr: 'cat', pal: { c: '#c8843a', e: '#ffe24a' } },
  { id: 'f_crab', r: 0, n: '招潮蟹', spr: 'crab' },
  { id: 'f_beetle', r: 0, n: '獨角仙', spr: 'beetle' },
  { id: 'd_lucky', r: 0, n: '招財小貓', spr: 'cat', pal: { c: '#f4ead2', e: '#2a1a10' } },
  { id: 'd_mush', r: 0, n: '靈芝', spr: 'mush' },
  { id: 'd_firefly', r: 0, n: '螢火蟲', spr: 'butterfly' },
  { id: 'd_pangolin', r: 0, n: '穿山甲', spr: 'pangolin' },
  { id: 'd_frog', r: 0, n: '樹蛙', spr: 'frog' },
  { id: 'd_lantern', r: 0, n: '燈籠妖', spr: 'lantern' },
  { id: 'd_fox', r: 0, n: '霧中狐', spr: 'wolf' },
  { id: 'd_hound', r: 0, n: '獵犬', spr: 'wolf' }
];
const PACTI = Object.fromEntries(PACTS.map(p => [p.id, p]));
/* 擁有的契靈是一隻一隻的個體：S.pact.list = [{u, k, brk, aff}]（u 是個體編號、k 是 PACTS 的種類），eq／follow 存 u */
const PD = () => {
  const d = (S.pact = S.pact || {});
  if (!Array.isArray(d.list)) d.list = [];
  if (!Array.isArray(d.eq)) d.eq = [];
  return d;
};
const pactOf = u => PD().list.find(o => o.u === u);
const pactKind = u => {
  const o = pactOf(u);
  return o && PACTI[o.k];
};
/* 欄位：2 + 通過的昇華試煉場數；同名的契靈只能裝一隻 */
const pactSlots = () => Math.min(PSLOT_MAX, PSLOT0 + ((S.asc && S.asc.trials) || 0));
const pactsOn = () =>
  PD()
    .eq.filter(u => pactKind(u))
    .slice(0, pactSlots());
const pactIsOn = u => pactsOn().includes(u);
/* 已解鎖的詞綴（第 1 條 + 突破次數） */
const pactOpen = u => {
  const o = pactOf(u);
  return o ? o.aff.slice(0, Math.min(PAFF_N, 1 + o.brk)) : [];
};
/* 可以拿來突破 u 的材料：同名、沒裝著、沒在跟隨的其他個體 */
const pactFodder = u => {
  const o = pactOf(u);
  return o ? PD().list.filter(q => q.k === o.k && q.u !== u && !pactIsOn(q.u) && PD().follow !== q.u) : [];
};
/* ---- 骰詞綴 ---- */
function rollTier(r) {
  const w = PTW[r];
  let x = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < 6; i++) if ((x -= w[i]) < 0) return i;
  return 5;
}
function rollPAff(r, have) {
  const t = rollTier(r),
    used = have.filter(a => !a.sk).map(a => a.id),
    /* 特定技能等級每隻最多 2 條 */
    pool = PAFF.filter(
      a => a.v[t] && !used.includes(a.id) && (!a.ssr || r === 2) && (!a.sk || have.filter(q => q.sk).length < 2)
    ),
    /* SSR 專屬詞綴比較常出現 */
    wt = pool.map(a => (a.ssr ? 3 : a.sk ? 1.2 : 1));
  let x = Math.random() * wt.reduce((a, b) => a + b, 0),
    i = 0;
  while (i < pool.length - 1 && (x -= wt[i]) >= 0) i++;
  const a = pool[i],
    [lo, hi] = a.v[t],
    o = { id: a.id, t, v: lo + fl(Math.random() * (hi - lo + 1)) };
  if (a.sk) {
    const ks = GEMK().filter(k => !have.some(q => q.sk === k));
    o.sk = ks[fl(Math.random() * ks.length)];
  }
  return o;
}
function rollPact(k) {
  const r = PACTI[k].r,
    aff = [];
  for (let i = 0; i < PAFF_N; i++) aff.push(rollPAff(r, aff));
  return { u: uid(), k, brk: 0, aff };
}
/* ---- 標籤與說明 ---- */
function paffTags(a) {
  const out = [...PAFFI[a.id].tg];
  if (a.sk && SKILLS[a.sk]) {
    const s = SKILLS[a.sk];
    if (s.el && PTAG[s.el]) out.push(s.el);
    if (s.pet) out.push('pet');
    if (s.kind === 'spell' || s.kind === 'attack') out.push(s.kind);
  }
  return out;
}
/* 契靈的標籤：詞綴的標籤（all 為 true 時包含還沒解鎖的） */
function pactTags(u, all) {
  const o = pactOf(u),
    list = all ? (o ? o.aff : []) : pactOpen(u);
  return [...new Set(list.flatMap(paffTags))];
}
const pactTagHTML = tags =>
  `<span class="ptags">${tags.map(t => `<i class="ptag ${t}">${PTAG[t]}</i>`).join('')}</span>`;
function paffTxt(a) {
  const d = PAFFI[a.id];
  if (a.sk) return `${SKILLS[a.sk] ? SKILLS[a.sk].name : '技能'} 等級 +${a.v}`;
  if (d.allSk) return `所有技能等級 +${a.v}`;
  return STATN[d.k] ? STATN[d.k](a.v) : `${d.k} +${a.v}`;
}
/* ---- 屬性 ---- */
/* sumStats 呼叫：裝著的契靈加已解鎖的詞綴 */
function pactStats(A) {
  for (const u of pactsOn())
    for (const a of pactOpen(u)) {
      const d = PAFFI[a.id];
      if (d && d.k) A(d.k, a.v);
    }
}
/* 技能石的額外等級（gemSkill 呼叫）：特定技能 +N 與所有技能 +N */
function pactSkLv(k) {
  let v = 0;
  for (const u of pactsOn())
    for (const a of pactOpen(u)) {
      if (a.sk === k) v += a.v;
      else if (PAFFI[a.id] && PAFFI[a.id].allSk) v += a.v;
    }
  return v;
}
/* 跟隨的契靈：互動範圍 +30 公尺（core.js 的 reachOf） */
const pactFollow = () => {
  const u = S.pact && S.pact.follow;
  return u && pactKind(u) ? u : null;
};
/* 契靈的小圖：16×16 怪物圖用自己的配色（pal），沒有就用同名、再來是同種怪物的配色；PNG 的生肖圖直接用 */
const pactPal = id => {
  const p = PACTI[id],
    m = MONS.find(q => q.name === p.n) || MONS.find(q => q.spr === p.spr);
  return p.pal || (m ? m.pal : undefined);
};
const pactImg = id => portrait(PACTI[id].spr, pactPal(id));
const pactTile = (id, extra = '') => {
  const p = PACTI[id];
  return `<span class="ptile p${p.r}" ${extra}><img src="${pactImg(id)}" alt=""><i class="prar">${PRAR[p.r]}</i></span>`;
};

/* ================= banners ================= */
const BANNERS = [
  {
    id: 'pact',
    n: '契靈祈願',
    sub: '常駐',
    feat: ['f_dragon', 'd_pegasus', 'f_tigerlord', 'f_lion'],
    bg: ['#2a1f4a', '#5a2f6a', '#ffcf5a'],
    d: '每隻契靈帶 6 條隨機的戰鬥詞綴（T6～T1），一開始解鎖第 1 條；吃掉另一隻同名的契靈就突破，解鎖下一條。SSR 的詞綴保底 T3 以上，還有專屬詞綴。'
  }
];
const ppool = r => PACTS.filter(p => p.r === r);
const GA = { b: 'pact', res: null, shown: 0, skip: false };
function pityOf(id) {
  S.pity = S.pity || {};
  const p = S.pity[id];
  return p && typeof p === 'object' ? p : (S.pity[id] = { s: 0 });
}
function gachaRoll(bn, guarSR) {
  const pt = pityOf(bn.id);
  pt.s++;
  const ssr = pt.s >= P_HARD ? 100 : PRATE[2] + Math.max(0, pt.s - P_SOFT + 1) * 5;
  let r = Math.random() * 100 < ssr ? 2 : Math.random() * (100 - PRATE[2]) < PRATE[1] ? 1 : 0;
  if (guarSR && r < 1) r = 1;
  if (r === 2) pt.s = 0;
  const pool = ppool(r),
    p = pool[fl(Math.random() * pool.length)];
  return { id: p.id, r, ...pactGive(p.id) };
}
/* 拿到一隻新的契靈（骰 6 條詞綴）；欄位有空、而且沒裝同名的就自動裝上 */
function pactGive(k) {
  const isNew = !PD().list.some(o => o.k === k),
    o = rollPact(k);
  PD().list.push(o);
  if (pactsOn().length < pactSlots() && !pactsOn().some(u => pactOf(u).k === k)) PD().eq = [...pactsOn(), o.u];
  return { u: o.u, isNew, top: Math.max(...o.aff.map(a => a.t)) };
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
  for (let i = 0; i < times; i++) res.push(gachaRoll(bn, times === 10 && i === 9 && !res.some(q => q.r >= 1)));
  addLog(`${bn.n} ×${times}：${res.map(q => `${PRAR[q.r]} ${PACTI[q.id].n}`).join('、')}`);
  save();
  GA.res = res;
  GA.shown = 0;
  GA.skip = false;
  renderGacha();
  const top = Math.max(...res.map(q => q.r));
  sfx(top === 2 ? 'level' : top === 1 ? 'bless' : 'coin');
  buzz(top === 2 ? 300 : top === 1 ? 100 : 40);
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
  else if (GA.res.some(q => q.r === 2)) sfx('win');
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
    pt = pityOf(bn.id);
  let html = `<div class="gaTop"><b>祈願</b><span class="gaCur">${curDot('wish')}祈願石 <b>${have}</b></span><button class="x" data-act="gaClose" aria-label="關閉">✕</button></div>
  <div class="gaTabs">${BANNERS.map(b => `<button class="gaTab${b.id === GA.b ? ' on' : ''}" data-act="gaTab" data-id="${b.id}" style="--c:${b.bg[2]}"><b>${b.n}</b><small>${b.sub}</small></button>`).join('')}<button class="gaTab" data-act="pactOpen" style="--c:#ffd66a"><b>我的契靈</b><small>${PD().list.length} 隻</small></button></div>
  <div class="gaBanner" style="background:radial-gradient(120% 90% at 70% 30%,${bn.bg[1]},${bn.bg[0]} 70%);--c:${bn.bg[2]}">
    <div class="gaFeat">${bn.feat.map(id => `<div>${pactTile(id)}<small style="color:${PCOL[PACTI[id].r]}">${PACTI[id].n}</small></div>`).join('')}</div>
    <div class="gaInfo"><h3>${bn.n}</h3><p>${bn.d}</p>
    <p class="sub">SSR ${PRATE[2]}%・SR ${PRATE[1]}%・R ${PRATE[0]}%・十連保證 SR 以上・${P_HARD} 抽內必出 SSR（${pt.s}/${P_HARD}）</p></div>
  </div>
  <div class="gaBtns"><button class="btn gaPull" data-act="gaPull" data-n="1" ${have >= GEM_DRAW ? '' : 'disabled'}>祈願 ×1<small>${curDot('wish')} ${GEM_DRAW}</small></button><button class="btn pri gaPull" data-act="gaPull" data-n="10" ${have >= GEM_DRAW * 10 ? '' : 'disabled'}>祈願 ×10<small>${curDot('wish')} ${GEM_DRAW * 10}</small></button></div>
  <details class="gaRates"><summary>卡池內容與機率</summary>${[2, 1, 0]
    .map(
      r =>
        `<div><b style="color:${PCOL[r]}">${PRAR[r]}</b> <span class="sub">${PRATE[r]}%</span> ${ppool(r)
          .map(p => p.n)
          .join('、')}</div>`
    )
    .join(
      ''
    )}<p class="sub">詞綴階級機率（T6～T1，%）：R ${PTW[0].join('／')}、SR ${PTW[1].join('／')}、SSR ${PTW[2].join('／')}。「特定技能等級 +N」從 T3 才會出現（T3 +1、T2 +2、T1 +3），可以超過技能石的等級上限。</p><p class="sub">每抽一次都是一隻新的契靈，6 條詞綴各自隨機，同名的也不一樣。拿另一隻同名的契靈當材料吃掉就「突破」，解鎖下一條詞綴，最多 ${PBRK_MAX} 次；抽到更喜歡的同名契靈，可以改培養那一隻。</p><p class="sub">祈願石：升級、今日委託、菁英與首領、廟宇參拜、絲綢之路商隊、地城尾王的靈魂寶藏。</p></details>`;
  if (GA.res) {
    const top = Math.max(...GA.res.map(q => q.r));
    html += `<div class="gaRes p${top}" data-act="gaSkip"><div class="gaGrid${GA.res.length > 1 ? ' ten' : ''}" id="gaRes">${GA.res
      .map(
        (q, i) =>
          `<div class="gcard p${q.r}${i < GA.shown ? ' on' : ''}" style="--d:${i}"><div class="gback"></div><div class="gface">${q.isNew ? '<i class="gnew">NEW</i>' : ''}${pactTile(q.id)}<b style="color:${PCOL[q.r]}">${PACTI[q.id].n}</b><small>${q.isNew ? '新契靈' : '可當突破材料'}・最高 ${PTN(q.top)}</small></div></div>`
      )
      .join(
        ''
      )}</div><div class="btns" id="gaResBtns" ${GA.shown >= GA.res.length ? '' : 'hidden'}><button class="btn" data-act="gaAgain" data-n="${GA.res.length}">再抽 ${GA.res.length} 次</button><button class="btn pri" data-act="gaDone">確定</button></div></div>`;
  }
  $('gacha').innerHTML = html;
}
/* 一隻契靈的 6 條詞綴：已解鎖的亮、沒解鎖的顯示要第幾次突破 */
function pactAffHTML(u) {
  const o = pactOf(u),
    n = pactOpen(u).length;
  return `<div class="paffs">${o.aff
    .map(
      (a, i) =>
        `<div class="${i < n ? 'on' : ''}"><i class="pt t${6 - a.t}">${PTN(a.t)}</i><span>${paffTxt(a)}</span>${i < n ? '' : `<small>突破 ${i}</small>`}</div>`
    )
    .join('')}</div>`;
}
/* 一隻契靈的卡片（mode 'fod' 是突破面板裡的材料，按鈕換成「吃掉」） */
function pactCard(o, mode) {
  const p = PACTI[o.k],
    eq = pactIsOn(o.u),
    fo = pactFollow() === o.u,
    nf = pactFodder(o.u).length,
    btn =
      mode === 'fod'
        ? `<button class="btn sm pri" data-act="pactEat" data-id="${o.u}">當材料</button>`
        : mode === 'main'
          ? ''
          : `<button class="btn sm ${eq ? '' : 'pri'}" data-act="pactEq" data-id="${o.u}">${eq ? '卸下' : '裝備'}</button><button class="btn sm" data-act="pactBrk" data-id="${o.u}" ${o.brk < PBRK_MAX && nf ? '' : 'disabled'}>${o.brk >= PBRK_MAX ? '已全解鎖' : `突破（材料 ${nf}）`}</button><button class="btn sm" data-act="pactFollow" data-id="${o.u}">${fo ? '跟隨中' : '跟隨'}</button>`;
  return `<div class="card pcard${eq ? ' on' : ''}"><div class="rowx"><div class="t" style="display:flex;gap:10px;align-items:center">${pactTile(o.k)}<div style="display:grid;gap:3px"><b><span style="color:${PCOL[p.r]}">${PRAR[p.r]}</span> ${p.n} <span class="sub">突破 ${o.brk}/${PBRK_MAX}${eq ? '・裝備中' : ''}</span></b>${pactTagHTML(pactTags(o.u, true))}</div></div>${btn ? `<div style="display:grid;gap:4px">${btn}</div>` : ''}</div>${pactAffHTML(o.u)}</div>`;
}
/* 「我的契靈」面板（sheet 'pact'）：欄位、標籤篩選、擁有的每一隻契靈 */
function pactHTML() {
  const fo = pactFollow(),
    on = pactsOn(),
    ns = pactSlots(),
    list = PD().list,
    own = [...list].sort(
      (a, b) => pactIsOn(b.u) - pactIsOn(a.u) || PACTI[b.k].r - PACTI[a.k].r || a.k.localeCompare(b.k) || b.brk - a.brk
    ),
    flt = SEL.ptag || '',
    tags = [...new Set(own.flatMap(o => pactTags(o.u, true)))];
  return `<h3>契靈欄位 ${on.length}/${ns}<small class="sub">・每通過一場昇華試煉 +1 格（最多 ${PSLOT_MAX}），同名的只能裝一隻</small></h3>
    <div class="pslots">${Array.from({ length: PSLOT_MAX }, (_, i) => {
      const u = on[i],
        o = u && pactOf(u);
      return i >= ns
        ? `<div class="pslot lock"><span class="ptile"></span><span>昇華試煉 ${i - PSLOT0 + 1}</span></div>`
        : o
          ? `<button class="pslot" data-act="pactEq" data-id="${u}">${pactTile(o.k)}<span style="color:${PCOL[PACTI[o.k].r]}">${PACTI[o.k].n}</span><small>${pactOpen(u).length}/${PAFF_N} 詞綴</small></button>`
          : `<div class="pslot empty"><span class="ptile"></span><span>空</span></div>`;
    }).join('')}</div>
    <h3>擁有 ${list.length} 隻<small class="sub">・${new Set(list.map(o => o.k)).size}/${PACTS.length} 種</small></h3>
    ${tags.length ? `<div class="ptagf"><button data-act="ptag" data-k="" aria-pressed="${!flt}">全部</button>${tags.map(t => `<button data-act="ptag" data-k="${t}" aria-pressed="${flt === t}">${PTAG[t]}</button>`).join('')}</div>` : ''}
    ${
      own
        .filter(o => !flt || pactTags(o.u, true).includes(flt))
        .map(o => pactCard(o))
        .join('') || '<p class="sub">還沒有契靈，去祈願吧</p>'
    }
    <p class="sub">跟隨：任選一隻契靈（不用裝上）在地圖上跟著你，互動範圍 +${PFOLLOW_R} 公尺。${fo ? `目前是${pactKind(fo).n}。` : ''}</p>
    <div class="btns"><button class="btn pri" data-act="gacha">${curDot('wish')}契靈祈願（${S.cur.wish || 0}）</button></div>`;
}
/* 突破面板（sheet 'pbrk'）：上面是要培養的那隻，下面列出可以吃掉的同名契靈 */
function pactBrkHTML() {
  const o = pactOf(SEL.pbrk);
  if (!o) return '<p class="sub">找不到這隻契靈</p>';
  const fod = pactFodder(o.u).sort((a, b) => a.brk - b.brk);
  return `${pactCard(o, 'main')}
    <p class="sub">選一隻同名的契靈當材料，它會消失，上面這隻解鎖下一條詞綴${o.brk < PBRK_MAX ? `（${paffTxt(o.aff[o.brk + 1])}）` : ''}。材料本身的突破次數與詞綴不會繼承。</p>
    <h3>材料 ${fod.length}</h3>${fod.map(q => pactCard(q, 'fod')).join('') || '<p class="sub">沒有可以當材料的同名契靈（裝著或跟隨中的不能用）</p>'}
    <div class="btns"><button class="btn" data-act="sheet" data-s="pact">返回契靈</button></div>`;
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
    const o = pactOf(d.id);
    if (!o || B || MB) return;
    const on = pactsOn(),
      same = on.find(u => u !== o.u && pactOf(u).k === o.k);
    if (on.includes(o.u)) PD().eq = on.filter(q => q !== o.u);
    else if (same) PD().eq = on.map(u => (u === same ? o.u : u));
    else if (on.length >= pactSlots()) {
      toast(`契靈欄位滿了（${pactSlots()} 格），先卸下一隻`);
      sfx('nope');
      return;
    } else PD().eq = [...on, o.u];
    sfx('select');
    pactRefresh();
  },
  pactFollow: d => {
    if (!pactOf(d.id)) return;
    PD().follow = PD().follow === d.id ? null : d.id;
    sfx('tap');
    pactRefresh();
  },
  pactBrk: d => {
    if (!pactOf(d.id)) return;
    SEL.pbrk = d.id;
    openSheet('pbrk');
  },
  pactEat: d => {
    const o = pactOf(SEL.pbrk),
      f = pactOf(d.id);
    if (!o || !f || B || MB || o.brk >= PBRK_MAX || !pactFodder(o.u).includes(f)) return;
    PD().list = PD().list.filter(q => q !== f);
    o.brk++;
    sfx('level');
    buzz(60);
    toast(`${PACTI[o.k].n} 突破 ${o.brk}：${paffTxt(o.aff[o.brk])}`);
    addLog(`${PACTI[o.k].n} 突破 ${o.brk}`);
    if (o.brk >= PBRK_MAX || !pactFodder(o.u).length) openSheet('pact');
    pactRefresh();
  },
  ptag: d => {
    SEL.ptag = d.k || '';
    sfx('tap');
    renderSheet();
  }
});
