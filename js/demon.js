/* 漫步勇者 · 魔霧與七宗罪（0.2.7～0.2.11）：魔霧區（0.3.1.6 起直接出現在地圖上）、魔霧怪、七宗罪雕像與 7 個王、殘魂、傳奇裝備、惡魔珠寶與天賦盤珠寶槽、七宗罪之王 */
'use strict';
/* ================= sprites & data ================= */
const pad16d = rows => rows.map(r => (r + '................').slice(0, 16));
Object.assign(SPR, {
  mseal: pad16d([
    '.......pp.......',
    '......pwwp......',
    '.....pwppwp.....',
    '....ssssssss....',
    '...sppsppsppss..',
    '...ssssssssss...',
    '....sddpddds....',
    '....sdpppdds....',
    '....sddpddds....',
    '...ssssssssss...',
    '..ssssssssssss..'
  ]),
  sinstatue: pad16d([
    '....h......h....',
    '....hh....hh....',
    '.....hssssh.....',
    '.....sesses.....',
    '.....ssssss.....',
    '......ssss......',
    '....ssssssss....',
    '...ss.ssss.ss...',
    '...s..ssss..s...',
    '......ssss......',
    '.....ss..ss.....',
    '...dddddddddd...',
    '..dddddddddddd..'
  ]),
  demon: pad16d([
    '..h..........h..',
    '..hh........hh..',
    '...hh.bbbb.hh...',
    '....hbbbbbbh....',
    '....bbebbebb....',
    '....bbbbbbbb....',
    '.....bmmmmb.....',
    'w...cccccccc...w',
    'ww.cccccccccc.ww',
    '.wwcccccccccccw.',
    '...cccccccccc...',
    '....cccccccc....',
    '....bb....bb....',
    '...bbb....bbb...'
  ]),
  sinking: pad16d([
    '.y..y..y..y..y..',
    '.yyyyyyyyyyyyy..',
    '.h.hbbbbbbbh.h..',
    '..hbbebbbebbh...',
    '...bbbbbbbbb....',
    '....bmmmmmb.....',
    'ww.ccccccccc.ww.',
    'wwcccccccccccww.',
    '.wcccrcccrcccw..',
    '..ccccccccccc...',
    '..ccccccccccc...',
    '...ccccccccc....',
    '...bb.....bb....',
    '..bbb.....bbb...'
  ])
});
Object.assign(PAL, {
  mseal: { s: '#3a2a4a', p: '#b06bff', w: '#f0dcff', d: '#241830' },
  sinstatue: { s: '#6a5a6a', h: '#3a2a3a', e: '#ff3a5a', d: '#2a2030' }
});
/* 地圖依物件種類找圖：雕像用 sinstatue */
SPR.sinst = SPR.sinstatue;
PAL.sinst = PAL.sinstatue;
Object.assign(KIND, { mseal: '魔霧', sinst: '七宗罪雕像', szone: '七罪據點' });
/* 魔霧詞綴（效果在 mistApply） */
const MMODS = [
  { id: 'mi_shroud', n: '霧罩', d: '護甲 +60%、全部抗性 +20%', mist: 1 },
  { id: 'mi_bulk', n: '濃霧之軀', d: '生命 +80%', mist: 1 },
  { id: 'mi_frenzy', n: '狂霧', d: '攻擊 +30%、速度提高', mist: 1 },
  { id: 'mi_chill', n: '寒霧', d: '攻擊附帶冰冷傷害', mist: 1 },
  { id: 'mi_drain', n: '蝕魂霧', d: '攻擊時吸血', mist: 1 }
];
MMODS.forEach(m => (EMODI[m.id] = m));
function mistApply(e, id) {
  if (id === 'mi_shroud') {
    e.arm = Math.round(e.arm * 1.6);
    e.res = e.res.map(v => v + 20);
  } else if (id === 'mi_bulk') e.maxhp = Math.round(e.maxhp * 1.8);
  else if (id === 'mi_frenzy') {
    e.atk = Math.round(e.atk * 1.3);
    e.speed += 4;
  } else if (id === 'mi_chill') {
    if (!e.mods.includes('cold')) e.mods = [...e.mods, 'cold'];
  } else if (id === 'mi_drain') {
    if (!e.mods.includes('leech')) e.mods = [...e.mods, 'leech'];
  }
  e.hp = e.maxhp;
}
/* 魔霧專屬怪（沿用現有像素圖換色） */
const MISTMON = [
  {
    name: '霧中人影',
    bg: 'cave',
    spr: 'a_mist_shade',
    pal: { v: '#6a5a8a', e: '#e8d8ff', m: '#2a1a3a' },
    hp: 45,
    atk: 14,
    arm: 10,
    el: 'cold',
    res: [10, 40, 10],
    xp: 22,
    gold: 14,
    w: 1
  },
  {
    name: '霧鴉',
    bg: 'cave',
    spr: 'a_mist_crow',
    pal: { b: '#3a2a4a', w: '#8a7aa8', y: '#b06bff', e: '#f0dcff' },
    hp: 32,
    atk: 16,
    arm: 4,
    el: 'phys',
    res: [0, 20, 0],
    xp: 20,
    gold: 12,
    w: 1
  },
  {
    name: '迷途魂',
    bg: 'cave',
    spr: 'a_mist_lost',
    pal: { s: '#5a4a6a', y: '#b06bff', e: '#ffffff', r: '#3a2a4a', b: '#2a1a3a' },
    hp: 50,
    atk: 13,
    arm: 14,
    el: 'light',
    res: [20, 20, 30],
    xp: 22,
    gold: 14,
    w: 1
  }
];
/* 魔霧區的強度（0.3.1.6 起直接出現在地圖上，不用觸發）：r 半徑、lv 開放等級 */
const MIST_TIERS = [
  { r: 200, lv: 5 },
  { r: 240, lv: 8 },
  { r: 280, lv: 12 },
  { r: 320, lv: 16 },
  { r: 360, lv: 20 }
];
const ROMAN = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ'];
/* 七宗罪：王的名字、形象顏色、詞綴與機制 */
const SINS = [
  {
    k: 'pride',
    n: '傲慢',
    boss: '傲慢之王・路西法',
    el: 'light',
    pal: { h: '#f2d25e', b: '#e8e2d4', e: '#3a6aff', m: '#8a7a6a', c: '#f2f2ff', w: '#d8dde6' },
    mods: ['reflect', 'armored'],
    d: '生命高於一半時，受到的傷害 -30%'
  },
  {
    k: 'envy',
    n: '嫉妒',
    boss: '嫉妒之王・利維坦',
    el: 'cold',
    pal: { h: '#2a6a5a', b: '#3a8a6a', e: '#e8ff5a', m: '#1a3a2a', c: '#2a5a4a', w: '#7fe0c0' },
    mods: ['leech'],
    d: '攻擊力會依你的傷害提高'
  },
  {
    k: 'wrath',
    n: '暴怒',
    boss: '暴怒之王・撒旦',
    el: 'fire',
    pal: { h: '#2a0a0a', b: '#c8302a', e: '#ffe24a', m: '#4a0a0a', c: '#8a1a1a', w: '#ff8a3a' },
    mods: ['fury', 'swift'],
    d: '生命越低越狂暴，行動更頻繁'
  },
  {
    k: 'sloth',
    n: '怠惰',
    boss: '怠惰之王・貝爾芬格',
    el: 'cold',
    pal: { h: '#4a4a5a', b: '#7a8a9a', e: '#c8c8ff', m: '#3a3a4a', c: '#5a6a7a', w: '#a8b8c8' },
    mods: ['tough', 'cold'],
    d: '生命極高，有機率讓你無法行動'
  },
  {
    k: 'greed',
    n: '貪婪',
    boss: '貪婪之王・瑪門',
    el: 'phys',
    pal: { h: '#8a6a1a', b: '#d8a83a', e: '#3a1a00', m: '#5a3a0a', c: '#b8862e', w: '#fff2b0' },
    mods: ['armored'],
    d: '每次攻擊偷走金幣，打倒後加倍還你'
  },
  {
    k: 'gluttony',
    n: '暴食',
    boss: '暴食之王・別西卜',
    el: 'phys',
    pal: { h: '#3a4a1a', b: '#8a9a3a', e: '#ff3a3a', m: '#2a1a0a', c: '#6a7a2a', w: '#c8d87a' },
    mods: ['tough', 'leech'],
    d: '會吃掉你的生命藥水回血'
  },
  {
    k: 'lust',
    n: '色慾',
    boss: '色慾之王・阿斯莫德',
    el: 'fire',
    pal: { h: '#5a1a4a', b: '#e87ab8', e: '#ffffff', m: '#8a2a6a', c: '#b84a8a', w: '#ffb8e0' },
    mods: ['swift'],
    d: '魅惑：你的攻擊有機率打到自己'
  }
];
const SINI = Object.fromEntries(SINS.map(s => [s.k, s]));
/* 傳奇裝備：詞綴固定、不能用通貨或亡靈製作改造；st 直接加進屬性（leg* 是特效旗標） */
const LEGENDS = [
  {
    k: 'pride',
    n: '傲慢之冠',
    slot: 'helm',
    bi: 1,
    st: { life: 60, resAll: 15, legPride: 1 },
    lines: ['最大生命 +60', '全部抗性 +15%', '生命全滿時，傷害 +30%（總乘）']
  },
  {
    k: 'envy',
    n: '嫉妒之戒',
    slot: 'ring',
    bi: 3,
    st: { critPct: 3, critMulti: 30, legEnvy: 1 },
    lines: ['暴擊率 +3%', '暴擊傷害 +30%', '敵人生命比你高時，傷害 +25%（總乘）']
  },
  {
    k: 'wrath',
    n: '暴怒戰斧',
    slot: 'weapon',
    bi: 2,
    st: { physPct: 80, legWrath: 1 },
    lines: ['物理傷害 +80%', '生命低於一半時，攻擊多打一下']
  },
  {
    k: 'sloth',
    n: '怠惰之靴',
    slot: 'boots',
    bi: 1,
    st: { life: 80, armor: 60, speed: -4, dmgRed: 15 },
    lines: ['最大生命 +80', '護甲 +60', '速度 -4', '受到的傷害 -15%']
  },
  {
    k: 'greed',
    n: '貪婪護符',
    slot: 'amulet',
    bi: 1,
    st: { goldPct: 60, critPct: 2, legGreed: 1 },
    lines: ['金幣獲得 +60%', '暴擊率 +2%', '擊敗敵人多掉 1 個通貨']
  },
  {
    k: 'gluttony',
    n: '暴食腰帶',
    slot: 'belt',
    bi: 0,
    st: { life: 50, healPct: 30, legGlut: 1 },
    lines: ['最大生命 +50', '治癒與藥水效果 +30%', '喝生命藥水時也回復同量的魔力']
  },
  {
    k: 'lust',
    n: '色慾法珠',
    slot: 'offhand',
    bi: 4,
    st: { spellPct: 40, mana: 20, legLust: 1 },
    lines: ['法術傷害 +40%', '最大魔力 +20', '命中時 15% 機率魅惑敵人，使它跳過下一次行動']
  }
];
const LEGI = Object.fromEntries(LEGENDS.map(l => [l.k, l]));
function makeLegend(k, ilvl = S.lv) {
  const L = LEGI[k],
    it = makeItem(L.slot, ilvl, 0, L.bi);
  it.r = 3;
  it.leg = k;
  it.aff = [];
  delete it.imp;
  return it;
}
/* 惡魔珠寶：1～3 條詞綴，放進天賦盤的珠寶槽 */
const JAFF = [
  ['life', 12, 25],
  ['lifePct', 3, 6],
  ['physPct', 6, 12],
  ['spellPct', 6, 12],
  ['elePct', 5, 10],
  ['critPct', 1, 2],
  ['critMulti', 6, 12],
  ['armorPct', 6, 12],
  ['resAll', 3, 6],
  ['dmgRed', 1, 3],
  ['healPct', 6, 12],
  ['speed', 1, 2],
  ['dbl', 2, 4],
  ['mpCost', 3, 6],
  ['engPct', 1, 2],
  ['taunt', 10, 20],
  ['allyDmg', 1, 3]
];
const JEWEL_MAX = 30;
function makeJewel(n) {
  const pool = [...JAFF],
    aff = [];
  for (let i = 0; i < n; i++) {
    const [k, lo, hi] = pool.splice(fl(Math.random() * pool.length), 1)[0];
    aff.push({ k, v: lo + fl(Math.random() * (hi - lo + 1)) });
  }
  return { id: uid(), r: n, aff };
}
function giveJewel(n) {
  S.jewels = S.jewels || [];
  if (S.jewels.length >= JEWEL_MAX) return '惡魔珠寶（背包已滿，消失了）';
  const j = makeJewel(n);
  S.jewels.push(j);
  return `惡魔珠寶（${n} 條詞綴）`;
}
const jewelTxt = j => j.aff.map(a => STATN[a.k](a.v)).join('、');
/* 珠寶槽：依等級開放可以放的數量 */
const jewelCap = () => (S.lv >= 95 ? 4 : S.lv >= 75 ? 3 : S.lv >= 50 ? 2 : S.lv >= 25 ? 1 : 0);
const jewelsIn = () =>
  Object.entries(S.jsock || {}).filter(
    ([nid, jid]) => S.tree.includes(nid) && (S.jewels || []).some(j => j.id === jid)
  );
/* sumStats 用：已放進已點亮珠寶槽的珠寶詞綴 */
function jewelStats(A) {
  for (const [, jid] of jewelsIn()) {
    const j = S.jewels.find(q => q.id === jid);
    j.aff.forEach(a => A(a.k, a.v));
  }
}

/* ================= map: mist seals, active mist, sin statues ================= */
const MS_CELL = 1300,
  SIN_CELL = 2600;
/* 這一輪地圖上的魔霧區（demonSpawns 產生）：{ id, x, y, r, tier, until } */
let MZ = [];
const mistAt = (x, y) => MZ.find(z => Math.hypot(z.x - x, z.y - y) <= z.r);
const mistProg = id => (S.mistp && S.mistp[id]) || 0;
function demonSpawns(out, cells, hp) {
  MZ = [];
  /* 魔霧區：每 2 小時換一輪，像冥府侵蝕柱一樣直接出現在地圖上（Lv5 起，強度依等級開放）；中心是魔霧標誌，點了看進度 */
  const e2 = ep2();
  if (S.mistp && S.mistp._ep !== e2) S.mistp = { _ep: e2 };
  if (S.lv >= 5)
    cells(MS_CELL, 2400, (i, j) => {
      const r = h(i, j, e2 * 23 + 1301);
      if (r % 100 >= 45) return;
      const ok = MIST_TIERS.map((t, k) => k).filter(k => MIST_TIERS[k].lv <= S.lv),
        w = [40, 25, 18, 11, 6],
        tot = ok.reduce((a, k) => a + w[k], 0);
      let x0 = (r >>> 9) % tot,
        tier = ok[0];
      for (const k of ok)
        if ((x0 -= w[k]) < 0) {
          tier = k;
          break;
        }
      const id = `ms${i}_${j}_${e2}`;
      if (S.defeated[id]) return;
      let x = (i + 0.2 + ((r >>> 12) % 60) / 100) * MS_CELL,
        y = (j + 0.2 + ((r >>> 18) % 60) / 100) * MS_CELL;
      if (nearTown(x, y, 250)) return;
      const p = snapRoad(x, y, 160);
      if (!p) return;
      [x, y] = p;
      MZ.push({ id, x, y, r: MIST_TIERS[tier].r, tier, until: (e2 + 1) * ZONE_MS });
    });
  /* 惡魔結晶召喚的魔霧也算一區 */
  for (const q of S.summons || [])
    if (q.e.kind === 'mseal' && q.until > now() && !S.defeated[q.id])
      MZ.push({ id: q.id, x: q.e.x, y: q.e.y, r: MIST_TIERS[q.e.tier].r, tier: q.e.tier, until: q.until, sum: 1 });
  for (const z of MZ) {
    if (z.sum) continue;
    const [la, ln] = toLL(z.x, z.y);
    out.set(z.id, {
      id: z.id,
      kind: 'mseal',
      x: z.x,
      y: z.y,
      lat: la,
      lng: ln,
      name: `魔霧 ${ROMAN[z.tier]}`,
      tier: z.tier,
      lv: aLv() + z.tier,
      gl: '176,107,255',
      lbl: `魔霧 ${ROMAN[z.tier]} ${mistProg(z.id)}%`,
      lc: '#d8b8ff'
    });
  }
  /* 0.3.24：七宗罪雕像拿掉；0.3.37 七罪改成地圖上的七罪據點 */
  siegeSpawns(out, cells);
  if (!MZ.length) return;
  /* 魔霧區裡的怪物加魔霧詞綴，約 1/3 換成魔霧專屬怪 */
  for (const e of out.values()) {
    if (e.kind !== 'monster' || e.ev) continue;
    const z = mistAt(e.x, e.y);
    if (z) mistify(e, h(fl(e.x), fl(e.y), 71), 3, z);
  }
  /* 魔霧專屬刷新：每 4 分鐘一輪，每區每 120 公尺方格約 55% 冒出一隻魔霧怪（晚上 70%） */
  const me = mistEp();
  for (const Z of MZ)
    for (let i = fl((Z.x - Z.r) / MQ_CELL); i <= fl((Z.x + Z.r) / MQ_CELL); i++)
      for (let j = fl((Z.y - Z.r) / MQ_CELL); j <= fl((Z.y + Z.r) / MQ_CELL); j++) {
        const r = h(i, j, me * 7 + 977);
        if (r % 100 >= (dayPhase().night > 0.5 ? 70 : 55)) continue;
        const id = `q${i}_${j}_${me}`;
        if (S.defeated[id] || out.has(id)) continue;
        let x = (i + ((r >>> 8) % 100) / 100) * MQ_CELL,
          y = (j + ((r >>> 16) % 100) / 100) * MQ_CELL;
        if (Math.hypot(x - Z.x, y - Z.y) > Z.r || nearTown(x, y, 100)) continue;
        const p = snapRoad(x, y, 70);
        if (!p) continue;
        [x, y] = p;
        const q = r >>> 4,
          rar = q % 100 < 6 ? 2 : q % 100 < 30 ? 1 : 0,
          lv = Math.max(1, aLv() + ((r >>> 3) % 3) - 1),
          e = {
            kind: 'monster',
            x,
            y,
            lv,
            base: pickMon(r >>> 12, lv),
            rar,
            mods: rar ? rollMods(h(i, j, me + 9), rar === 2 ? 3 : 1 + (q % 2)) : [],
            ph: (r % 628) / 100
          };
        const uz = udZoneAt(x, y);
        if (uz) {
          e.base = UNDEAD[q % UNDEAD.length];
          e.ud = uz.id;
        }
        mistify(e, q, 2, Z);
        const [la, ln] = toLL(x, y);
        out.set(id, { id, lat: la, lng: ln, ...e });
      }
}
const MQ_CELL = 120,
  MIST_MS = 4 * 60e3,
  mistEp = () => fl(now() / MIST_MS);
/* 把怪物變成魔霧怪：加魔霧詞綴、等級 +階級，1/k 換成魔霧專屬怪；e.mist 記住是哪一區 */
function mistify(e, q, k, Z) {
  /* 魔霧蓋到亡靈區：亡靈不換成魔霧怪，變成「霧中亡靈」，同時算兩邊的進度 */
  if (q % k === 0 && !e.ud) e.base = MISTMON[(q >>> 3) % MISTMON.length];
  const ids = MMODS.map(m => m.id),
    add = [ids.splice((q >>> 5) % ids.length, 1)[0]];
  if (Z.tier >= 2 && (q >>> 9) % 2) add.push(ids[(q >>> 11) % ids.length]);
  e.mods = [...e.mods.filter(m => !m.startsWith('mi_')), ...add];
  e.lv += Z.tier;
  e.mist = Z.id;
  e.name =
    (e.ud ? '霧中亡靈・' : '魔霧・') +
    (e.rar ? makeEnemy(e.base, e.lv, e.rar, e.mods).name.replace(/^魔霧・/, '') : e.base.name);
}
/* 魔霧區：跟冥府侵蝕柱一樣的脈動圓圈＋往外擴散的波紋＋光柱，顏色是紫色；中心地上是惡魔法陣 */
function drawSeals(c, t) {
  for (const z of MZ) {
    const x = SX(z.x),
      y = SY(z.y),
      r = Math.abs(SX(z.x + z.r) - x),
      pu = 0.5 + 0.5 * Math.sin(t / 380);
    if (x < -r - 40 || x > VW + r + 40 || y < -r - 200 || y > VH + r + 40) continue;
    c.save();
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(150,70,230,.06)');
    g.addColorStop(1, `rgba(150,70,230,${0.2 + 0.1 * pu})`);
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r, 0, 6.28);
    c.fill();
    c.shadowColor = '#b06bff';
    c.shadowBlur = 12;
    c.strokeStyle = `rgba(190,120,255,${0.6 + 0.3 * pu})`;
    c.lineWidth = 2.5;
    c.stroke();
    const w = (t / 1600) % 1;
    c.shadowBlur = 0;
    c.strokeStyle = `rgba(200,140,255,${0.6 * (1 - w)})`;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(x, y, r * w, 0, 6.28);
    c.stroke();
    /* 中心的惡魔法陣（五芒星不動，外圈虛線慢慢轉） */
    const R = 17 * sprScale() * (1 + z.tier * 0.12);
    c.save();
    c.translate(x, y);
    c.scale(1, 0.42);
    c.strokeStyle = 'rgba(200,140,255,.85)';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(0, 0, R * 1.5, 0, 6.28);
    c.stroke();
    c.beginPath();
    for (let k = 0; k <= 5; k++) {
      const a = (k * 4 * Math.PI) / 5 - Math.PI / 2;
      c[k ? 'lineTo' : 'moveTo'](Math.cos(a) * R * 1.5, Math.sin(a) * R * 1.5);
    }
    c.stroke();
    c.rotate(t / 9000);
    c.setLineDash([4, 6]);
    c.beginPath();
    c.arc(0, 0, R * 1.85, 0, 6.28);
    c.stroke();
    c.restore();
    /* 光柱 */
    const bw = 10 + 4 * pu,
      bh = 150,
      lg = c.createLinearGradient(0, y - bh, 0, y);
    lg.addColorStop(0, 'rgba(150,70,230,0)');
    lg.addColorStop(1, `rgba(170,100,255,${0.5 + 0.25 * pu})`);
    c.fillStyle = lg;
    c.fillRect(x - bw / 2, y - bh, bw, bh);
    c.fillStyle = `rgba(240,220,255,${0.5 + 0.3 * pu})`;
    c.fillRect(x - 1.5, y - bh * 0.8, 3, bh * 0.8);
    c.restore();
  }
}
/* 拉遠時：在封印位置畫大大的惡魔符號，遠遠就看得到 */
function drawSealMark(c, t) {
  if (cam.z > 0.5) return;
  for (const e of MZ) {
    const x = SX(e.x),
      y = SY(e.y) - 18,
      r = 18 + e.tier * 2,
      pu = 0.5 + 0.5 * Math.sin(t / 350);
    if (x < -30 || x > VW + 30 || y < -30 || y > VH + 30) continue;
    c.save();
    glow(c, x, y, r * 2.4, '176,107,255', 0.45 + 0.2 * pu);
    c.fillStyle = 'rgba(20,8,30,.9)';
    c.beginPath();
    c.arc(x, y, r, 0, 6.28);
    c.fill();
    c.strokeStyle = '#d8b8ff';
    c.lineWidth = 2;
    c.stroke();
    /* 惡魔角＋倒五芒星 */
    c.strokeStyle = `rgba(200,140,255,${0.8 + 0.2 * pu})`;
    c.lineWidth = 1.6;
    c.beginPath();
    for (let k = 0; k <= 5; k++) {
      const a = (k * 4 * Math.PI) / 5 + Math.PI / 2;
      c[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r * 0.72, y + Math.sin(a) * r * 0.72);
    }
    c.stroke();
    c.fillStyle = '#d8b8ff';
    for (const sgn of [-1, 1]) {
      c.beginPath();
      c.moveTo(x + sgn * r * 0.55, y - r * 0.75);
      c.lineTo(x + sgn * r * 1.05, y - r * 1.6);
      c.lineTo(x + sgn * r * 0.2, y - r * 0.95);
      c.fill();
    }
    c.restore();
  }
}
/* 打倒魔霧裡的怪：累積進度，滿了碎裂得碎片 */
function mistWin(b) {
  const e = b.e,
    z = MZ.find(q => q.id === b.mist);
  if (!z) return '';
  const inc =
    (([4, 7, 12, 12, 18][e.rar || 0] + (MISTMON.some(m => m.name === b.mistBase) ? 2 : 0)) * (b.ud ? 1.5 : 1)) /
    (1 + 0.15 * z.tier);
  S.mistp = S.mistp || { _ep: ep2() };
  const p = Math.min(100, Math.round(mistProg(z.id) + inc));
  S.mistp[z.id] = p;
  if (p < 100) return `<p style="color:#d8b8ff">魔霧 ${ROMAN[z.tier]} 進度 ${p}%</p>`;
  /* 0.3.24：進度滿了，霧的中心出現四凶（打倒才會散去） */
  addLog(`魔霧 ${ROMAN[z.tier]} 的中心出現了${xiongOf(z).n}`);
  refreshEntities(true);
  return `<p style="color:#e0c8ff">魔霧翻湧……四凶之一・<b>${xiongOf(z).n}</b>在霧的中心現身！</p>`;
}

/* ================= sin lords ================= */
/* 七宗罪的王各自的圖（sprites.js 的 b_*） */
const SINSPR = {
  pride: 'a_lucifer',
  envy: 'a_leviathan',
  wrath: 'a_satan',
  sloth: 'a_belphegor',
  greed: 'a_mammon',
  gluttony: 'a_beelzebub',
  lust: 'a_asmodeus'
};
function makeSinLord(k, lv) {
  const s = SINI[k],
    st = stats(),
    b = {
      name: s.boss,
      bg: 'cave',
      spr: SINSPR[k],
      pal: BOSSPAL[SINSPR[k]],
      hp: 110,
      atk: 18,
      arm: 35,
      el: s.el,
      res: [35, 35, 35],
      xp: 90,
      gold: 90
    },
    e = makeEnemy(b, lv, 4, [...s.mods]);
  e.maxhp = Math.round(e.maxhp * (k === 'sloth' ? 2.6 : 1.6));
  e.atk = Math.round(e.atk * 1.2);
  if (k === 'envy') e.atk += Math.round((st.physLo + st.physHi) / 4 + 6 * (st.spellMul || 1));
  e.hp = e.maxhp;
  e.name = s.boss;
  e.sin = k;
  return e;
}
function makeSinKing(lv) {
  const b = {
      name: '七宗罪之王',
      bg: 'cave',
      spr: 'a_sinking',
      pal: BOSSPAL.b_sinking,
      hp: 160,
      atk: 24,
      arm: 50,
      el: 'fire',
      res: [45, 45, 45],
      xp: 300,
      gold: 300
    },
    e = makeEnemy(b, lv, 4, ['reflect', 'swift', 'fury', 'leech']);
  e.maxhp = Math.round(e.maxhp * 4);
  e.hp = e.maxhp;
  e.name = '七宗罪之王';
  e.sin = 'king';
  return e;
}
/* 王的回合開始前（單人）：貪婪偷錢、暴食吃藥、怠惰定身；七宗罪之王每回合隨機一種 */
function sinTurn(e, p) {
  const k = e.sin === 'king' ? SINS[fl(Math.random() * 7)].k : e.sin;
  if (k === 'greed' && S.gold > 0) {
    const n = Math.min(S.gold, 5 + e.lv * 3);
    S.gold -= n;
    e.stolen = (e.stolen || 0) + n;
    pop(`-${n} 金`, p.hx, p.hy - 110, '#f2c14e');
  } else if (k === 'gluttony' && S.potions > 0 && Math.random() < 0.35) {
    S.potions--;
    const v = Math.round(e.maxhp * 0.12);
    e.hp = Math.min(e.maxhp, e.hp + v);
    pop(`吃掉藥水 +${v}`, p.ex, p.y - 110, '#9be36b');
  } else if (k === 'sloth' && Math.random() < 0.25) {
    B.me.frozen = 1;
    pop('怠惰：無法行動', p.hx, p.hy - 110, '#c8c8ff');
  }
}
/* 你打王時（單人）：傲慢減傷、色慾魅惑反打自己 */
function sinHit(e, d, p) {
  const k = e.sin === 'king' ? SINS[fl(Math.random() * 7)].k : e.sin;
  if (k === 'pride' && e.hp > e.maxhp / 2) return Math.round(d * 0.7);
  if (k === 'lust' && Math.random() < 0.2) {
    const self = Math.max(1, Math.round(d * 0.4));
    S.hp = Math.max(1, S.hp - self);
    pop(`魅惑！-${self}`, p.hx, p.hy - 100, '#ff8ad8');
    return 0;
  }
  return d;
}
function sinBattleWin(e) {
  if (!e.stolen) return '';
  S.gold += e.stolen * 2;
  return `<p style="color:var(--gold)">貪婪之王吐回 ${e.stolen * 2} 金幣</p>`;
}
/* 七宗罪挑戰通關：殘魂、傳奇、珠寶 */
function sinReward(sp) {
  const out = [];
  /* 0.3.25 攻佔城鎮的七罪之王：解放城鎮，傳奇裝備機率較高 */
  if (sp.siege) out.push(...siegeDone());
  if (sp.dt === 'sin') {
    const s = SINI[sp.sin];
    S.sins = S.sins || {};
    S.sins[s.k] = (S.sins[s.k] || 0) + 1;
    out.push(`${s.n}的殘魂`);
    if (Math.random() < (sp.siege ? 0.35 : 0.1 + 0.05 * (sp.xk || 0)) * tierBoss()) {
      const it = makeLegend(s.k);
      giveItem(it);
      out.push(itemName(it));
    }
    if (Math.random() < 0.35 * tierBoss()) out.push(giveJewel(1 + fl(Math.random() * 3)));
  } else if (sp.dt === 'sinking') {
    const it = makeLegend(SINS[fl(Math.random() * 7)].k, aLv() + 5);
    giveItem(it);
    out.push(itemName(it), giveJewel(3));
    /* 0.3.10：高 T 有機會多一件傳奇 */
    if (Math.random() < tierBoss() - 1) {
      const it2 = makeLegend(SINS[fl(Math.random() * 7)].k, aLv() + 5);
      giveItem(it2);
      out.push(itemName(it2));
    }
    S.title = '七宗罪之王討伐者';
    out.push('稱號「七宗罪之王討伐者」');
  }
  return out;
}

/* ================= sheets ================= */
const sinMods = e => {
  const pool = DMODS.map(m => m.id),
    out = [];
  let r = h(fl(e.x), fl(e.y), 37);
  for (let i = 0; i < 6; i++) {
    out.push(pool.splice(r % pool.length, 1)[0]);
    r = h(r, i, 17);
  }
  return out;
};
function demonHTML() {
  const sins = S.sins || {};
  return `<p class="sub">地圖上的魔霧區（紫色圓圈）打滿進度，霧的中心會出現山海經的四凶之一，打倒得到牠的凶獸之印；四種印各 1 個可以在魔霧中心召喚尾王燭龍。Lv5 起地圖上會出現七罪據點，解放據點、打倒那個罪的王得到殘魂；集齊 7 種殘魂可以組隊挑戰七宗罪之王。</p>${S.siege && siegeTown() ? `<p class="sub" style="color:#ff9aa4">目前：${SINI[S.siege.sin].boss}攻佔${siegeTown().n}（解放 ${S.siege.prog}%）</p>` : ''}
  <div class="curs">${XIONG.map(x => `<span title="${x.d}"><span>${x.n}之印<b style="color:${xseal(x.k) ? 'var(--gold)' : 'var(--dim)'}">${xseal(x.k)}</b></span></span>`).join('')}</div>
  <div class="curs">${SINS.map(s => `<span title="${s.boss}"><span>${s.n}的殘魂<b style="color:${sins[s.k] ? 'var(--gold)' : 'var(--dim)'}">${sins[s.k] || 0}</b></span></span>`).join('')}</div>
  ${S.title ? `<p class="sub" style="color:var(--gold)">稱號：${S.title}</p>` : ''}
  <h3>傳奇裝備圖鑑</h3>${LEGENDS.map(l => `<div class="card"><b style="color:${RCOL[3]}">${l.n}</b><small class="sub" style="display:block">${SLOTN[l.slot]}・${l.lines.join('、')}・${l.zod ? `${ZODI[l.zod].t}之印 ×${ZLEG_COST} 兌換` : `${SINI[l.k].n}之王掉落`}</small></div>`).join('')}`;
}
function jewelHTML() {
  const js = S.jewels || [],
    used = new Set(Object.values(S.jsock || {}));
  return `<p class="sub">七宗罪的王有機率掉落，1～3 條詞綴。在天賦盤點亮「珠寶槽」後放入；可以同時使用的數量跟著等級開放（Lv25 1 個、Lv50 2 個、Lv75 3 個、Lv95 4 個，目前 ${jewelsIn().length}/${jewelCap()}）。最多 ${JEWEL_MAX} 個（目前 ${js.length}）。</p>${
    js
      .map(
        j =>
          `<div class="card"><div class="rowx"><div class="t"><b style="color:${['', '#7fa8ff', '#c58cff', '#ffcf5a'][j.r]}">惡魔珠寶 ${'◆'.repeat(j.r)}</b><small>${jewelTxt(j)}${used.has(j.id) ? '・<span style="color:var(--good)">鑲嵌中</span>' : ''}</small></div><button class="btn sm" data-act="matDrop" data-k="jewels" data-id="${j.id}" ${used.has(j.id) ? 'disabled' : ''}>丟棄</button></div></div>`
      )
      .join('') || '<p class="sub">還沒有惡魔珠寶</p>'
  }`;
}
/* 天賦盤：珠寶槽的說明卡 */
function socketCardHTML(n) {
  const on = S.tree.includes(n.id),
    jid = (S.jsock || {})[n.id],
    j = jid && (S.jewels || []).find(q => q.id === jid),
    free = (S.jewels || []).filter(q => !Object.values(S.jsock || {}).includes(q.id)),
    full = jewelsIn().length >= jewelCap();
  if (!on) return '<p class="sub">珠寶槽：點亮後可以放入一顆惡魔珠寶。</p>';
  if (j)
    return `<p class="sub">已鑲嵌：${jewelTxt(j)}</p><button class="btn sm" data-act="jOut" data-n="${n.id}">取下</button>`;
  if (full) return `<p class="sub">目前等級最多同時鑲嵌 ${jewelCap()} 顆（Lv25／50／75／95 各多 1 顆）。</p>`;
  return free.length
    ? `<div style="display:grid;gap:4px">${free.map(q => `<button class="btn sm" style="text-align:left" data-act="jIn" data-n="${n.id}" data-id="${q.id}">放入：${jewelTxt(q)}</button>`).join('')}</div>`
    : '<p class="sub">沒有可以放的惡魔珠寶（七宗罪的王會掉）。</p>';
}
(() => {
  PIX.cur_mfrag = {
    r: ['...pp...', '..pwpp..', '.pwppp..', '.ppppdp.', 'pppppddp', '.ppdddp.', '..pddp..', '...pp...'],
    p: { p: '#b06bff', w: '#f0dcff', d: '#5a2a8a' }
  };
})();
MAT_TABS.push(
  ['demon', '魔霧', () => XIONG.reduce((a, x) => a + xseal(x.k), 0)],
  ['jewels', '珠寶', () => (S.jewels || []).length]
);

/* ================= actions ================= */
Object.assign(A, {
  sinKing: () => {
    const sins = S.sins || {};
    if (!SINS.every(s => sins[s.k] > 0)) return;
    partyCreate({
      id: 'sk' + uid(),
      dt: 'sinking',
      mods: [],
      lv: aLv() + 5,
      lat: S.lat,
      lng: S.lng,
      name: '七宗罪之王',
      pay: { souls: 1 }
    });
  },
  jIn: d => {
    if (jewelsIn().length >= jewelCap()) return;
    S.jsock = S.jsock || {};
    S.jsock[d.n] = d.id;
    sfx('bless');
    renderTreeCard();
    renderHud();
    save();
  },
  jOut: d => {
    delete (S.jsock || {})[d.n];
    renderTreeCard();
    renderHud();
    save();
  }
});

/* ================= 0.3.24 魔霧：山海經四凶與燭龍 ================= */
/* 魔霧進度滿 100% 時，霧的中心出現一隻四凶（依位置固定是哪一隻），打倒得到牠的凶獸之印；四種印各 1 個在魔霧中心召喚燭龍。
   圖先沿用相近的十二生肖圖，PixelLab 提示詞在 docs/怪物提示詞.md */
const XIONG = [
  { k: 'hundun', n: '混沌', spr: 'a_hundun', el: 'chaos', d: '看不到牠的行動順序；每次行動換一種元素抗性' },
  { k: 'qiongqi', n: '窮奇', spr: 'a_qiongqi', el: 'cold', d: '專挑生命比例最低的人打；被打時反刺 15% 傷害' },
  { k: 'taowu', n: '檮杌', spr: 'a_taowu', el: 'phys', d: '每次行動護甲 +15%，越打越硬' },
  { k: 'taotie', n: '饕餮', spr: 'a_taotie', el: 'fire', d: '吃掉目標身上的增益回血；會偷吃你的生命藥水' }
];
const XIONGI = Object.fromEntries(XIONG.map(x => [x.k, x]));
const xiongOf = z => XIONG[h(fl(z.x), fl(z.y), 31) % 4];
const xseal = k => (S.xseal && S.xseal[k]) || 0;
const xsealAll = () => XIONG.every(x => xseal(x.k) > 0);
function makeXiong(x, lv) {
  const e = makeEnemy(
    { name: x.n, bg: 'forest', spr: x.spr, hp: 90, atk: 15, arm: 30, el: x.el, res: [30, 30, 30], xp: 70, gold: 70 },
    lv,
    4,
    ['tough']
  );
  e.maxhp = e.hp = Math.round(e.maxhp * 3.2);
  e.atk = Math.round(e.atk * 1.3);
  e.name = x.n;
  e.xiong = x.k;
  if (x.k === 'qiongqi') e.mods.push('reflect');
  if (x.k === 'hundun') e.hideAv = 1;
  return e;
}
function makeZhulong(lv) {
  const e = makeEnemy(
    {
      name: '燭龍',
      bg: 'cave',
      spr: 'a_zhulong',
      hp: 110,
      atk: 18,
      arm: 40,
      el: 'fire',
      res: [40, 20, 30],
      xp: 160,
      gold: 150
    },
    lv,
    4,
    ['tough', 'armored']
  );
  e.maxhp = e.hp = Math.round(e.maxhp * 6);
  e.atk = Math.round(e.atk * 1.4);
  e.name = '燭龍（晝）';
  e.zhulong = 1;
  e.phase = 'day';
  e.zt = 0;
  return e;
}
/* 敵人回合開頭的特殊行動（enemyResolve 呼叫）：回傳 {ev, at, done}，done 表示這回合已經做完了 */
function beastTurn(e, i, party, at) {
  const ev = [],
    L = party.filter(p => p.alive !== false && p.hp > 0);
  if (e.xiong === 'hundun') {
    const opts = [
      [60, 0, -20],
      [0, 60, -20],
      [-20, 0, 60],
      [60, -20, 0],
      [-20, 60, 0],
      [0, -20, 60]
    ];
    e.res = opts[fl(Math.random() * opts.length)];
    ev.push({ t: 'st', i, s: `混沌之變：${['火', '冰', '電'][e.res.indexOf(60)]}抗性變高`, col: '#d8b8ff', at });
  }
  if (e.xiong === 'taowu') {
    e.arm = Math.round(e.arm * 1.15);
    ev.push({ t: 'msg', s: '檮杌的皮更硬了（護甲 +15%）', at });
    at += 400;
  }
  if (e.xiong === 'taotie') {
    const p = L.find(q => (q.buffs || []).length);
    if (p) {
      const n = p.buffs.length;
      p.buffs = [];
      e.hp = Math.min(e.maxhp, e.hp + Math.round(e.maxhp * 0.08 * n));
      ev.push({ t: 'msg', s: `饕餮吞掉 ${p.name} 的 ${n} 個增益回血`, at });
      at += 500;
    }
    if (L.some(q => q.uid === 'me') && S.potions > 0 && Math.random() < 0.3) {
      S.potions--;
      e.hp = Math.min(e.maxhp, e.hp + Math.round(e.maxhp * 0.12));
      ev.push({ t: 'msg', s: '饕餮偷吃了你的生命藥水！', at });
      at += 500;
    }
  }
  if (e.zhulong) {
    e.zt++;
    if (e.zt % 3 === 0) {
      e.phase = e.phase === 'day' ? 'night' : 'day';
      e.name = `燭龍（${e.phase === 'day' ? '晝' : '夜'}）`;
      e.hideAv = e.phase === 'night' ? 1 : 0;
      for (const p of party) p.blind = e.phase === 'night' ? 1 : 0;
      ev.push({ t: 'msg', s: e.phase === 'night' ? '燭龍閉上眼睛——黑夜降臨' : '燭龍睜開眼睛——白晝灼燒', at });
      at += 700;
    }
    if (e.phase === 'night') {
      const v = Math.round(e.maxhp * 0.06);
      e.hp = Math.min(e.maxhp, e.hp + v);
      ev.push({ t: 'msg', s: `燭龍在黑夜中恢復 ${v} 生命`, at });
      at += 450;
    } else {
      /* 白晝：燭火灼燒全體 */
      ev.push({ t: 'msg', s: '燭龍的燭火灼燒全體！', at });
      ev.push({ t: 'lunge', i, at });
      at += 250;
      for (const p of L) {
        const st = p.st,
          d = Math.max(
            1,
            Math.round(
              mitigate(
                { phys: 0, fire: e.atk * 0.7 * rnd(0.9, 1.1), cold: 0, light: 0 },
                st.armor,
                Array.isArray(st.res) ? st.res : [st.res.fire, st.res.cold, st.res.light, st.res.chaos || 0],
                false
              ) *
                (1 - Math.min(75, st.dmgRed || 0) / 100)
            )
          );
        const toMp = takeDmg(p, st, d);
        ev.push({ t: 'dmg', who: p.uid, d: d - toMp, mp: toMp, col: '#ffb15a', at });
        if (p.hp <= 0) {
          p.alive = false;
          ev.push({ t: 'down', who: p.uid, at: at + 200 });
        }
      }
      at += 600;
      return { ev, at, done: true };
    }
  }
  return { ev, at, done: false };
}
function xiongWin(o) {
  S.xseal = S.xseal || {};
  S.xseal[o.k] = xseal(o.k) + 1;
  if (o.zid) S.defeated[o.zid] = 1;
  quest('mist');
  addLog(`打倒四凶・${XIONGI[o.k].n}，得到凶獸之印`);
  refreshEntities(true);
  return `<p style="color:#e0c8ff">得到 ${XIONGI[o.k].n}之印（${XIONG.map(x => `${x.n} ${xseal(x.k)}`).join('、')}）${xsealAll() ? '・四種都有了，可以在魔霧中心召喚燭龍！' : ''}</p>`;
}
function zhulongWin() {
  const got = [];
  giveCur('prism', 3);
  got.push('寶石稜鏡 ×3');
  giveCur('exalt');
  got.push('崇高石');
  giveCur('wish', 2);
  got.push('祈願石 ×2');
  const l = SUPG.filter(x => x.lin && x.m === 'mist'),
    x = l[fl(Math.random() * l.length)];
  if (Math.random() < 0.6) {
    giveSup(x.k);
    got.push(`族裔輔助・${x.n}`);
  }
  addLog('打倒魔霧尾王・燭龍');
  return `<p style="color:#ffd166">燭龍倒下了！得到 ${got.join('、')}</p>`;
}
Object.assign(A, {
  xiongGo: d => {
    const e = ENT.get(d.id),
      z = MZ.find(q => q.id === d.id);
    if (!inRange(e) || !z || mistProg(z.id) < 100 || S.defeated[z.id]) return;
    const x = xiongOf(z);
    closeSheet();
    startBattle(makeXiong(x, aLv() + z.tier + 3), {
      bg: 'forest',
      boss: true,
      xiong: { k: x.k, zid: z.id },
      onsite: siteBonus(e)
    });
    save();
  },
  zhulongGo: d => {
    const e = ENT.get(d.id),
      z = MZ.find(q => q.id === d.id);
    if (!inRange(e) || !z || !xsealAll()) return;
    for (const x of XIONG) S.xseal[x.k]--;
    closeSheet();
    startBattle(makeZhulong(aLv() + z.tier + 6), { bg: 'cave', boss: true, zhulong: 1, onsite: siteBonus(e) });
    save();
  }
});

/* ================= 0.3.25 七罪（0.3.37 改成地圖上的七罪據點） ================= */
/* 七罪據點：跟魔霧一樣每 2 小時換一輪，隨機出現在地圖上（Lv5 起；每 SG_CELL 公尺方格約 45%，0.3.44 密度提高約 4 倍，不在城鎮旁、不跟魔霧重疊）。
   範圍畫成那個罪的顏色，範圍內冒出信徒、戰鬥套用那個罪的特效；打信徒累積解放度（S.sgp，每輪換新），
   滿 100% 在據點中心挑戰那個罪的王（3 層、終局難度），打完這一輪這個據點就消失。信徒的圖先用現有怪物圖＋罪的配色 */
const SIEGE_LV = 5,
  SG_CELL = 1800,
  SIEGE_R = 320;
let SZ = [];
/* 城鎮特效（範圍內的戰鬥） */
const SIEGE_FX = {
  pride: '怪物生命高於一半時受到的傷害 -30%',
  envy: '怪物攻擊依你的傷害提高',
  wrath: '怪物狂暴（生命越低攻擊越高）、速度提高',
  sloth: '你的行動值變慢（×0.6）',
  greed: '每場戰鬥被偷金幣，解放後加倍還',
  gluttony: '藥水回復量減半',
  lust: '你的攻擊有 10% 機率打到自己（魅惑）'
};
/* 信徒：t 是特色（battle.js 的 followerTurn／followerHit）、spr 是先用的現有圖 */
const SINF = {
  pride: [
    { n: '墮天騎士', t: 'proud', spr: 'a_sin_pride_paladin', d: '生命高於一半時受傷 -30%' },
    { n: '光輪祭司', t: 'healer', spr: 'a_sin_pride_priest', d: '替生命最低的信徒回血' },
    { n: '鏡面衛兵', t: 'mirror', spr: 'a_sin_pride_mirror', d: '反射 15% 傷害' },
    { n: '金冠貴族', t: 'bully', spr: 'a_sin_pride_noble', d: '對生命比例比自己低的目標傷害 ×1.5' },
    { n: '聖像傀儡', t: 'idol', spr: 'a_sin_pride_idol', d: '護甲極高、很慢' }
  ],
  envy: [
    { n: '妒火魚人', t: 'envy', spr: 'a_sin_envy_fishman', d: '攻擊依你的傷害提高' },
    { n: '竊影者', t: 'thief', spr: 'a_sin_envy_thief', d: '偷走你一個增益' },
    { n: '綠眼海蛇', t: 'venom', spr: 'a_sin_envy_serpent', d: '命中讓你中毒（每 3 秒扣血）' },
    { n: '模仿者', t: 'mimic', spr: 'a_sin_envy_mimic', d: '對你上一招的元素抗性變高' },
    { n: '深海觸手', t: 'grab', spr: 'a_sin_envy_tentacle', d: '纏住你：行動值延後' }
  ],
  wrath: [
    { n: '狂戰惡魔', t: 'fury', spr: 'a_sin_wrath_berserker', d: '生命越低攻擊越高' },
    { n: '熔岩獵犬', t: 'hound', spr: 'a_sin_wrath_hound', d: '火焰攻擊、速度快' },
    { n: '自爆怨火', t: 'boom', spr: 'a_sin_wrath_bomber', d: '死亡時爆炸，傷害打倒牠的人' },
    { n: '血角鬥士', t: 'stack', spr: 'a_sin_wrath_gladiator', d: '每次行動攻擊 +12%' },
    { n: '怒焰狂信者', t: 'zealot', spr: 'a_sin_wrath_cultist', d: '讓其他信徒攻擊 +10%' }
  ],
  sloth: [
    { n: '沉睡巨人', t: 'sleep', spr: 'a_sin_sloth_giant', d: '前兩次輪到都在睡，醒來猛擊（×2）' },
    { n: '泥沼史萊姆', t: 'mud', spr: 'a_sin_sloth_slime', d: '命中讓你行動值延後' },
    { n: '夢魘綿羊', t: 'dream', spr: 'a_sin_sloth_sheep', d: '25% 讓你睡著（跳過下一次行動）' },
    { n: '苔蘚樹人', t: 'regen', spr: 'a_sin_sloth_treant', d: '生命高，每次行動回 10% 生命' },
    { n: '蝸牛騎士', t: 'snail', spr: 'a_sin_sloth_snail', d: '護甲極高、很慢' }
  ],
  greed: [
    { n: '金幣竊賊', t: 'coin', spr: 'a_sin_greed_goblin', d: '偷你的金幣，3 次行動後逃走就拿不回來' },
    { n: '寶箱怪', t: 'chest', spr: 'a_sin_greed_mimic', d: '傷害很高（×1.6）' },
    { n: '黃金魔像', t: 'goldg', spr: 'a_sin_greed_golem', d: '護甲極高，打倒掉很多金幣' },
    { n: '放貸惡魔', t: 'debt', spr: 'a_sin_greed_usurer', d: '「債務」：每次行動偷的金幣越來越多' },
    { n: '黃金傭兵', t: 'merc', spr: 'a_sin_greed_merc', d: '還活著時，其他信徒受傷 -20%' }
  ],
  gluttony: [
    { n: '腐食鬣狗', t: 'flies', spr: 'a_sin_glut_hyena', d: '打牠有 30% 打空' },
    { n: '腐肉胖子', t: 'devour', spr: 'a_sin_glut_glutton', d: '吃掉旁邊的信徒回血' },
    { n: '嘔吐蛆蟲', t: 'venom', spr: 'a_sin_glut_maggot', d: '命中讓你中毒（每 3 秒扣血）' },
    { n: '吞噬口', t: 'maw', spr: 'a_sin_glut_maw', d: '偷吃你的生命藥水' },
    { n: '寄生巫婆', t: 'parasite', spr: 'a_sin_glut_witch', d: '吸血' }
  ],
  lust: [
    { n: '魅魔', t: 'charm', spr: 'a_sin_lust_succubus', d: '打牠有 20% 被魅惑、打到自己' },
    { n: '薔薇藤妖', t: 'vine', spr: 'a_sin_lust_vine', d: '纏繞並流血（每 3 秒扣血）' },
    { n: '假面舞者', t: 'dancer', spr: 'a_sin_lust_dancer', d: '打牠有 35% 被閃過並反擊' },
    { n: '心碎吟遊詩人', t: 'bard', spr: 'a_sin_lust_bard', d: '降低你的傷害（6 秒 -20%）' },
    { n: '傀儡情人', t: 'puppet', spr: 'a_sin_lust_puppet', d: '還活著時，其他信徒受傷 -25%' }
  ]
};
/* 據點的進度與被偷的金幣：S.sgp = {_ep, [據點 id]: {prog, stolen}} */
const sgRec = id => {
  if (!S.sgp || S.sgp._ep !== ep2()) S.sgp = { _ep: ep2() };
  return (S.sgp[id] = S.sgp[id] || { prog: 0, stolen: 0 });
};
const sgProg = id => (S.sgp && S.sgp._ep === ep2() && S.sgp[id] ? S.sgp[id].prog : 0);
const sgDone = id => !!(S.sgp && S.sgp._ep === ep2() && S.sgp[id] && S.sgp[id].done);
/* 現在位置在哪個七罪據點裡（打完的不算） */
const siegeAt = (lat, lng) => {
  const [x, y] = toM(lat, lng);
  return SZ.find(z => !sgDone(z.id) && Math.hypot(z.x - x, z.y - y) <= z.r) || null;
};
/* 這一輪的七罪據點（demonSpawns 算完魔霧之後呼叫） */
function siegeZones(cells) {
  SZ = [];
  if (S.lv < SIEGE_LV) return;
  const e2 = ep2();
  cells(SG_CELL, 4000, (i, j) => {
    const r = h(i, j, e2 * 29 + 7717);
    if (r % 100 >= 45) return;
    const id = `sz${i}_${j}_${e2}`;
    let x = (i + 0.2 + ((r >>> 12) % 60) / 100) * SG_CELL,
      y = (j + 0.2 + ((r >>> 18) % 60) / 100) * SG_CELL;
    if (nearTown(x, y, 300)) return;
    const p = snapRoad(x, y, 200);
    if (!p) return;
    [x, y] = p;
    if (MZ.some(z => Math.hypot(z.x - x, z.y - y) < z.r + SIEGE_R)) return;
    SZ.push({ id, x, y, r: SIEGE_R, sin: SINS[(r >>> 5) % SINS.length].k });
  });
}
/* 信徒：用現有怪物的圖、罪的配色；followerBase 是地圖上的怪物資料（fol 記住是哪一種），followerize 套上特色 */
function followerBase(sk, f) {
  const s = SINI[sk];
  return {
    name: f.n,
    bg: 'city',
    spr: f.spr,
    pal: { ...(MONS.find(m => (m.px || m.spr) === f.spr) || {}).pal, b: s.pal.b, e: s.pal.e },
    hp: f.t === 'regen' || f.t === 'idol' || f.t === 'snail' || f.t === 'goldg' ? 75 : 48,
    atk: f.t === 'chest' ? 16 : 11,
    arm: f.t === 'idol' || f.t === 'snail' || f.t === 'goldg' ? 60 : 22,
    el: f.t === 'hound' ? 'fire' : s.el,
    res: [20, 20, 20],
    xp: 18,
    gold: f.t === 'goldg' ? 60 : 16,
    fol: f
  };
}
function followerize(e, sk, f) {
  e.name = (e.rar ? e.name.replace(f.n, '') : '') + f.n;
  e.siege = sk;
  e.trait = f.t;
  if (f.t === 'mirror') e.mods = [...(e.mods || []), 'reflect'];
  if (f.t === 'fury') e.mods = [...(e.mods || []), 'fury'];
  if (f.t === 'parasite') e.mods = [...(e.mods || []), 'leech'];
  if (f.t === 'idol' || f.t === 'snail') e.speed = 6;
  if (f.t === 'hound') e.speed = 16;
  return e;
}
const makeFollower = (sk, f, lv, rar = 0, mods = []) =>
  followerize(makeEnemy(followerBase(sk, f), lv, rar, mods), sk, f);
/* 地圖：七罪據點的中心（點了看進度、挑戰王）與範圍內的信徒（每 4 分鐘一輪、每 120 公尺方格約 60%） */
function siegeSpawns(out, cells) {
  siegeZones(cells);
  const me = mistEp();
  for (const z of SZ) {
    if (sgDone(z.id)) continue;
    const s = SINI[z.sin],
      [la, ln] = toLL(z.x, z.y),
      p = sgProg(z.id);
    out.set(z.id, {
      id: z.id,
      kind: 'szone',
      x: z.x,
      y: z.y,
      lat: la,
      lng: ln,
      name: `${s.n}據點`,
      /* 0.3.44 據點中心直接畫那個罪的王（新的 PNG），不再用舊的雕像 */
      spr: SINSPR[z.sin],
      lv: aLv() + 6,
      gl: hex2rgb(s.pal.b).join(','),
      lbl: `${s.n}據點 ${p}%`,
      lc: s.pal.b
    });
    const list = SINF[z.sin];
    for (let i = fl((z.x - z.r) / MQ_CELL); i <= fl((z.x + z.r) / MQ_CELL); i++)
      for (let j = fl((z.y - z.r) / MQ_CELL); j <= fl((z.y + z.r) / MQ_CELL); j++) {
        const r = h(i, j, me * 11 + 4243);
        if (r % 100 >= 60) continue;
        const id = `sg${i}_${j}_${me}`;
        if (S.defeated[id] || out.has(id)) continue;
        let x = (i + ((r >>> 8) % 100) / 100) * MQ_CELL,
          y = (j + ((r >>> 16) % 100) / 100) * MQ_CELL;
        if (Math.hypot(x - z.x, y - z.y) > z.r || Math.hypot(x - z.x, y - z.y) < 40) continue;
        const sp = snapRoad(x, y, 70);
        if (sp) [x, y] = sp;
        const q = r >>> 4,
          rar = q % 100 < 6 ? 2 : q % 100 < 30 ? 1 : 0,
          lv = Math.max(1, aLv() + 3 + ((r >>> 3) % 2)),
          f = list[(q >>> 6) % list.length],
          [la2, ln2] = toLL(x, y),
          base = followerBase(z.sin, f),
          mods = rar ? rollMods(h(i, j, me + 5), rar === 2 ? 3 : 1) : [];
        out.set(id, {
          id,
          lat: la2,
          lng: ln2,
          kind: 'monster',
          x,
          y,
          lv,
          base,
          rar,
          mods,
          /* 0.3.44 地圖上的名字（以前沒有，面板顯示 undefined）；跟 followerize 的規則一樣 */
          name: (rar ? makeEnemy(base, lv, rar, mods).name.replace(f.n, '') : '') + f.n,
          siege: z.sin,
          trait: f.t,
          ph: (r % 628) / 100
        });
      }
  }
}
/* 地圖：七罪據點的範圍畫成那個罪的顏色 */
function drawSiege(c, t) {
  for (const z of SZ) {
    if (sgDone(z.id)) continue;
    const x = SX(z.x),
      y = SY(z.y),
      r = Math.abs(SX(z.x + z.r) - x),
      col = SINI[z.sin].pal.b,
      pu = 0.5 + 0.5 * Math.sin(t / 420);
    if (x < -r - 40 || x > VW + r + 40 || y < -r - 40 || y > VH + r + 40) continue;
    c.save();
    c.globalAlpha = 0.16 + 0.08 * pu;
    c.fillStyle = col;
    c.beginPath();
    c.arc(x, y, r, 0, 6.28);
    c.fill();
    c.globalAlpha = 0.8;
    c.strokeStyle = col;
    c.lineWidth = 3;
    c.setLineDash([10, 6]);
    c.stroke();
    c.setLineDash([]);
    c.restore();
  }
}
/* 開打時：在七罪據點範圍裡就套用那個罪的特效（startBattle 呼叫） */
function siegeApply(B) {
  const sg = siegeAt(S.lat, S.lng);
  if (!sg) return '';
  B.siegeK = sg.sin;
  const st = stats();
  for (const e of B.es) {
    if (sg.sin === 'pride') e.sinAura = 'pride';
    if (sg.sin === 'envy') e.atk += Math.round((st.physLo + st.physHi) / 6 + 4 * (st.spellMul || 1));
    if (sg.sin === 'wrath') {
      e.mods = [...(e.mods || []), 'fury'];
      e.speed = Math.max(e.speed || 10, 14);
    }
  }
  if (sg.sin === 'sloth') B.me.slow = 999;
  if (sg.sin === 'lust') B.me.charmed = 1;
  if (sg.sin === 'greed' && S.gold > 0) {
    const n = Math.min(S.gold, 10 + S.lv * 3);
    S.gold -= n;
    sgRec(sg.id).stolen += n;
    return `貪婪：被偷走 ${n} 金幣`;
  }
  return `${SINI[sg.sin].n}據點：${SIEGE_FX[sg.sin]}`;
}
/* 打倒信徒：累積所在據點的解放度（winBattle 呼叫） */
function siegeWin(es) {
  const sg = siegeAt(S.lat, S.lng);
  if (!sg) return '';
  let inc = 0;
  for (const o of es) if (o.siege === sg.sin) inc += [4, 7, 12, 12, 20][o.rar || 0];
  if (!inc) return '';
  const rec = sgRec(sg.id);
  rec.prog = Math.min(100, rec.prog + inc);
  quest('kill');
  const n = SINI[sg.sin].n;
  return rec.prog >= 100
    ? `<p style="color:#ffd166">${n}據點的解放度 100%！到據點中心挑戰${SINI[sg.sin].boss}</p>`
    : `<p style="color:#ff9aa4">${n}據點的解放度 ${rec.prog}%</p>`;
}
/* 打倒七罪的王：這個據點這一輪消失、還回偷走的金幣（sinReward 呼叫） */
function siegeDone() {
  const id = S.sgDun;
  if (!id) return [];
  const rec = sgRec(id),
    z = SZ.find(q => q.id === id),
    out = [];
  if (rec.stolen) {
    S.gold += rec.stolen * 2;
    out.push(`<span style="color:var(--gold)">貪婪吐回 ${rec.stolen * 2} 金幣</span>`);
  }
  addLog(`解放了${z ? SINI[z.sin].n + '據點' : '七罪據點'}`);
  rec.done = 1;
  S.sgDun = null;
  refreshEntities(true);
  return out;
}
/* 據點中心的面板（ui.js 的 openEnt 呼叫） */
function siegeZoneHTML(e, inR) {
  const z = SZ.find(q => q.id === e.id);
  if (!z) return { desc: '這個七罪據點已經消失了。', act: '' };
  const s = SINI[z.sin],
    p = sgProg(z.id);
  return {
    desc:
      `<b style="color:${s.pal.b}">${s.boss}</b>帶著信徒在這裡築起據點。範圍內的戰鬥：${SIEGE_FX[z.sin]}。` +
      bar('解放度', p, 100, s.pal.b) +
      more(
        '據點規則與信徒',
        `<p>打倒範圍內的信徒累積解放度（一般 4%、魔法 7%、稀有 12%、紅名 20%），滿 100% 在這裡挑戰${s.boss}（3 層、終局難度、還帶兩個信徒）。七罪據點每 2 小時換一輪，沒解放就會消失。</p><p>${SINF[z.sin].map(f => `<b>${f.n}</b>：${f.d}`).join('<br>')}</p>`
      ),
    act: `<button class="btn pri" data-act="siegeGo" data-id="${e.id}" ${inR && p >= 100 ? '' : 'disabled'}>${p >= 100 ? `挑戰${s.boss}` : `解放度 ${p}%`}</button>`
  };
}
Object.assign(A, {
  siegeGo: d => {
    const e = ENT.get(d.id),
      z = SZ.find(q => q.id === d.id);
    if (!inRange(e) || !z || sgProg(z.id) < 100 || sgDone(z.id)) return;
    closeSheet();
    S.sgDun = z.id;
    enterDungeon({
      id: 'siege_' + z.id,
      kind: 'dungeon',
      dt: 'sin',
      sin: z.sin,
      siege: 1,
      mods: sinMods(e),
      umods: [],
      xk: 4,
      lv: aLv() + 6,
      lat: e.lat,
      lng: e.lng,
      floors: 3,
      onsite: siteBonus(e)
    });
    save();
  }
});
/* ---- 信徒的特色（battle.js 呼叫） ---- */
/* 信徒的回合開頭：回傳 {ev, at, done, mul}，mul 是這回合攻擊的倍率 */
function followerTurn(e, i, es, party, at) {
  const ev = [],
    L = party.filter(p => p.alive !== false && p.hp > 0),
    me = L.find(p => p.uid === 'me');
  let mul = 1,
    done = false;
  e.ft = (e.ft || 0) + 1;
  const T = e.trait;
  if (T === 'sleep' && e.ft <= 2) {
    ev.push({ t: 'msg', s: `${e.name} 呼呼大睡中……`, at });
    return { ev, at: at + 600, done: true, mul };
  }
  if (T === 'sleep' && e.ft === 3) {
    ev.push({ t: 'msg', s: `${e.name} 醒了，猛力一擊！`, at });
    at += 300;
    mul = 2;
  }
  if (T === 'healer') {
    const o = es.filter(x => x.hp > 0 && x !== e).sort((a, b) => a.hp / a.maxhp - b.hp / b.maxhp)[0];
    if (o) {
      const v = Math.round(o.maxhp * 0.1);
      o.hp = Math.min(o.maxhp, o.hp + v);
      ev.push({ t: 'msg', s: `${e.name} 替 ${o.name} 回復 ${v} 生命`, at });
      at += 450;
    }
  }
  if (T === 'regen') {
    e.hp = Math.min(e.maxhp, e.hp + Math.round(e.maxhp * 0.1));
    ev.push({ t: 'st', i, s: '再生', col: '#9be36b', at });
  }
  if (T === 'stack') {
    e.atk = Math.round(e.atk * 1.12);
    ev.push({ t: 'st', i, s: '攻擊 +12%', col: '#ff8a3a', at });
  }
  if (T === 'zealot')
    for (const o of es)
      if (o !== e && o.hp > 0) {
        o.atk = Math.round(o.atk * 1.1);
        ev.push({ t: 'st', i: es.indexOf(o), s: '狂熱', col: '#ff8a3a', at });
      }
  if (T === 'mimic' && me && me.lastEl) {
    const k = ['fire', 'cold', 'light'].indexOf(me.lastEl);
    if (k >= 0) {
      e.res = e.res.map((v, j) => (j === k ? 75 : v));
      ev.push({ t: 'st', i, s: `模仿：${EL[me.lastEl]}抗性 75%`, col: '#9fe7ff', at });
    }
  }
  if (T === 'thief') {
    const p = L.find(q => (q.buffs || []).some(b => b.turns < 900));
    if (p) {
      const b = p.buffs.find(q => q.turns < 900);
      p.buffs = p.buffs.filter(q => q !== b);
      ev.push({ t: 'msg', s: `${e.name} 偷走了 ${p.name} 的「${b.n || '增益'}」`, at });
      at += 450;
    }
  }
  if ((T === 'coin' || T === 'debt') && me && S.gold > 0) {
    const n = Math.min(S.gold, T === 'debt' ? 4 * e.ft + e.lv : 6 + e.lv * 2);
    S.gold -= n;
    {
      const sg = siegeAt(S.lat, S.lng);
      if (sg && T === 'debt') sgRec(sg.id).stolen += n;
    }
    e.stolen = (e.stolen || 0) + n;
    ev.push({ t: 'msg', s: `${e.name} 偷走 ${n} 金幣${T === 'debt' ? '（債務越滾越大）' : ''}`, at });
    at += 450;
    if (T === 'coin' && e.ft >= 3) {
      e.hp = 0;
      e.fled = 1;
      ev.push({ t: 'msg', s: `${e.name} 帶著 ${e.stolen} 金幣逃走了！`, at }, { t: 'kill', i, at: at + 100 });
      return { ev, at: at + 500, done: true, mul };
    }
  }
  if (T === 'devour') {
    const o = es.filter(x => x.hp > 0 && x !== e).sort((a, b) => a.hp - b.hp)[0];
    if (o && Math.random() < 0.35) {
      o.hp = 0;
      e.hp = Math.min(e.maxhp, e.hp + Math.round(e.maxhp * 0.3));
      ev.push({ t: 'msg', s: `${e.name} 把 ${o.name} 吃掉了！`, at }, { t: 'kill', i: es.indexOf(o), at: at + 100 });
      at += 600;
    }
  }
  if (T === 'maw' && me && S.potions > 0 && Math.random() < 0.3) {
    S.potions--;
    e.hp = Math.min(e.maxhp, e.hp + Math.round(e.maxhp * 0.15));
    ev.push({ t: 'msg', s: `${e.name} 偷吃了你的生命藥水！`, at });
    at += 450;
  }
  if (T === 'chest') mul *= 1.6;
  return { ev, at, done, mul };
}
/* 信徒打中人之後 */
function followerAfter(e, p, d, ext, at) {
  const ev = [],
    T = e.trait;
  if ((T === 'venom' || T === 'vine') && d > 0) {
    p.pdot = { n: Math.max(1, Math.round(p.st.maxhp * 0.04)), turns: 3 };
    ev.push({ t: 'st', who: p.uid, s: T === 'vine' ? '纏繞流血' : '中毒', col: '#9be36b', at });
  }
  if ((T === 'mud' || T === 'grab') && ext.av) {
    ext.av[p.uid] = (ext.av[p.uid] || 0) - 30;
    ev.push({ t: 'st', who: p.uid, s: T === 'grab' ? '被纏住' : '陷入泥沼', col: '#c8b0ff', at });
  }
  if (T === 'dream' && Math.random() < 0.25) {
    p.frozen = 1;
    ev.push({ t: 'st', who: p.uid, s: '睡著了', col: '#c8c8ff', at });
  }
  if (T === 'bard') {
    p.buffs = (p.buffs || []).filter(b => b.id !== 'heartbreak');
    p.buffs.push({ id: 'heartbreak', n: '心碎', turns: 2, more: -20 });
    ev.push({ t: 'st', who: p.uid, s: '心碎（傷害 -20%）', col: '#ff8ad8', at });
  }
  return ev;
}
/* 你打信徒（或被攻佔城鎮裡的怪）時：回傳 {d, miss, self, ev} */
function followerHit(e, es, me, d, i, t) {
  const ev = [],
    T = e.trait,
    other = k => es.some(o => o !== e && o.hp > 0 && o.trait === k);
  if (T === 'flies' && Math.random() < 0.3)
    return { d: 0, miss: 1, ev: [{ t: 'st', i, s: '打空了', col: '#8a8aa0', at: t }] };
  if (T === 'dancer' && Math.random() < 0.35) {
    const c = Math.max(1, Math.round(e.atk * 0.6));
    me.hp = Math.max(1, me.hp - c);
    return {
      d: 0,
      miss: 1,
      ev: [
        { t: 'st', i, s: '閃過了', col: '#ff8ad8', at: t },
        { t: 'dmg', who: me.uid, d: c, col: '#ff8ad8', at: t + 120 }
      ]
    };
  }
  if ((T === 'charm' && Math.random() < 0.2) || (me.charmed && Math.random() < 0.1)) {
    const c = Math.max(1, Math.round(d * 0.4));
    me.hp = Math.max(1, me.hp - c);
    return {
      d: 0,
      miss: 1,
      ev: [
        { t: 'dmg', who: me.uid, d: c, col: '#ff8ad8', at: t },
        { t: 'st', i, s: '魅惑！', col: '#ff8ad8', at: t }
      ]
    };
  }
  if ((T === 'proud' || e.sinAura === 'pride') && e.hp > e.maxhp / 2) d = Math.round(d * 0.7);
  if (other('merc')) d = Math.round(d * 0.8);
  if (other('puppet')) d = Math.round(d * 0.75);
  return { d, ev };
}
