/* 漫步勇者 · 魔霧與七宗罪（0.2.7～0.2.11）：魔霧封印、魔霧怪、七宗罪雕像與 7 個王、殘魂、傳奇裝備、惡魔珠寶與天賦盤珠寶槽、七宗罪之王 */
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
Object.assign(KIND, { mseal: '魔霧封印', sinst: '七宗罪雕像' });
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
    spr: 'spirit',
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
    spr: 'bird',
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
    spr: 'scare',
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
const MIST_TIERS = [
  { r: 200, min: 30, lv: 5 },
  { r: 400, min: 45, lv: 8 },
  { r: 600, min: 60, lv: 12 },
  { r: 800, min: 90, lv: 16 },
  { r: 1000, min: 120, lv: 20 }
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
const SIN_COST = 3,
  SIN_EXTRA = 4;
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
    lines: ['法術傷害 +40%', '最大魔力 +20', '命中時 15% 機率魅惑敵人，使它跳過一回合']
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
const MS_CELL = 900,
  SIN_CELL = 2600;
let MISTZ = null;
function demonSpawns(out, cells, hp) {
  /* 魔霧消散 */
  if (S.mist && now() > S.mist.until) {
    toast('魔霧散去了，這次沒有碎裂');
    addLog('魔霧時間到，散去了');
    S.mist = null;
  }
  MISTZ = S.mist;
  /* 魔霧封印：每小時刷新，強度依你的等級開放 */
  if (S.lv >= 5)
    cells(MS_CELL, 1000, (i, j) => {
      const r = h(i, j, hp * 23 + 1301);
      if (r % 100 >= 40) return;
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
      const id = `ms${i}_${j}_${hp}`;
      if (S.defeated[id]) return;
      let x = (i + 0.2 + ((r >>> 12) % 60) / 100) * MS_CELL,
        y = (j + 0.2 + ((r >>> 18) % 60) / 100) * MS_CELL;
      if (nearTown(x, y, 150)) return;
      const p = snapRoad(x, y, 140);
      if (!p) return;
      [x, y] = p;
      const [la, ln] = toLL(x, y);
      out.set(id, {
        id,
        kind: 'mseal',
        x,
        y,
        lat: la,
        lng: ln,
        name: `魔霧封印 ${ROMAN[tier]}`,
        tier,
        lv: S.lv + tier,
        gl: '176,107,255',
        lbl: `魔霧 ${ROMAN[tier]}`,
        lc: '#d8b8ff'
      });
    });
  /* 七宗罪雕像：每 2 小時換一輪，Lv8 起 */
  if (S.lv >= 8) {
    const e2 = ep2();
    cells(SIN_CELL, 2600, (i, j) => {
      const r = h(i, j, e2 * 29 + 1709);
      if (r % 100 >= 32) return;
      const id = `sn${i}_${j}_${e2}`,
        sin = SINS[(r >>> 7) % 7];
      let x = (i + 0.2 + ((r >>> 10) % 60) / 100) * SIN_CELL,
        y = (j + 0.2 + ((r >>> 16) % 60) / 100) * SIN_CELL;
      if (nearTown(x, y, 250)) return;
      const p = snapRoad(x, y, 200);
      if (!p) return;
      [x, y] = p;
      const [la, ln] = toLL(x, y);
      out.set(id, {
        id,
        kind: 'sinst',
        x,
        y,
        lat: la,
        lng: ln,
        sin: sin.k,
        name: `${sin.n}的雕像`,
        lv: S.lv + 3,
        pal: sin.pal,
        gl: '255,58,90',
        lbl: sin.n,
        lc: '#ff8a9a'
      });
    });
  }
  /* 啟動中的魔霧：範圍內怪物加魔霧詞綴，約 1/3 換成魔霧專屬怪 */
  if (!MISTZ) return;
  for (const e of out.values()) {
    if (e.kind !== 'monster' || e.ev) continue;
    if (Math.hypot(e.x - MISTZ.x, e.y - MISTZ.y) > MISTZ.r) continue;
    mistify(e, h(fl(e.x), fl(e.y), 71), 3);
  }
  /* 魔霧專屬刷新：每 4 分鐘一輪，範圍內每 120 公尺方格約 55% 冒出一隻魔霧怪 */
  const me = mistEp(),
    Z = MISTZ;
  for (let i = fl((Z.x - Z.r) / MQ_CELL); i <= fl((Z.x + Z.r) / MQ_CELL); i++)
    for (let j = fl((Z.y - Z.r) / MQ_CELL); j <= fl((Z.y + Z.r) / MQ_CELL); j++) {
      const r = h(i, j, me * 7 + 977);
      if (r % 100 >= (dayPhase().night > 0.5 ? 70 : 55)) continue;
      const id = `q${i}_${j}_${me}`;
      if (S.defeated[id]) continue;
      let x = (i + ((r >>> 8) % 100) / 100) * MQ_CELL,
        y = (j + ((r >>> 16) % 100) / 100) * MQ_CELL;
      if (Math.hypot(x - Z.x, y - Z.y) > Z.r || nearTown(x, y, 100)) continue;
      const p = snapRoad(x, y, 70);
      if (!p) continue;
      [x, y] = p;
      const q = r >>> 4,
        rar = q % 100 < 6 ? 2 : q % 100 < 30 ? 1 : 0,
        lv = Math.max(1, S.lv + ((r >>> 3) % 3) - 1),
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
      mistify(e, q, 2);
      const [la, ln] = toLL(x, y);
      out.set(id, { id, lat: la, lng: ln, ...e });
    }
}
const MQ_CELL = 120,
  MIST_MS = 4 * 60e3,
  mistEp = () => fl(now() / MIST_MS);
/* 把怪物變成魔霧怪：加魔霧詞綴、等級 +階級，1/k 換成魔霧專屬怪 */
function mistify(e, q, k) {
  /* 魔霧蓋到亡靈區：亡靈不換成魔霧怪，變成「霧中亡靈」，同時算兩邊的進度 */
  if (q % k === 0 && !e.ud) e.base = MISTMON[(q >>> 3) % MISTMON.length];
  const ids = MMODS.map(m => m.id),
    add = [ids.splice((q >>> 5) % ids.length, 1)[0]];
  if (MISTZ.tier >= 2 && (q >>> 9) % 2) add.push(ids[(q >>> 11) % ids.length]);
  e.mods = [...e.mods.filter(m => !m.startsWith('mi_')), ...add];
  e.lv += MISTZ.tier;
  e.mist = true;
  e.name =
    (e.ud ? '霧中亡靈・' : '魔霧・') +
    (e.rar ? makeEnemy(e.base, e.lv, e.rar, e.mods).name.replace(/^魔霧・/, '') : e.base.name);
}
/* 魔霧：紫色霧氣，邊緣是一圈旋轉的漩渦 */
function drawMist(c, t) {
  const z = S.mist;
  if (!z) return;
  const x = SX(z.x),
    y = SY(z.y),
    r = Math.abs(SX(z.x + z.r) - x),
    rot = t / 1400;
  c.save();
  const g = c.createRadialGradient(x, y, r * 0.1, x, y, r);
  g.addColorStop(0, `rgba(120,70,180,${0.12 + 0.05 * Math.sin(t / 900)})`);
  g.addColorStop(0.8, 'rgba(110,50,170,.26)');
  g.addColorStop(1, 'rgba(150,70,230,.42)');
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, 6.28);
  c.fill();
  c.shadowColor = '#b06bff';
  c.shadowBlur = 16;
  c.strokeStyle = 'rgba(210,160,255,.85)';
  c.lineWidth = 3;
  c.stroke();
  /* 漩渦臂：從邊緣往內捲的弧線，整圈旋轉 */
  c.lineCap = 'round';
  for (let k = 0; k < 10; k++) {
    const a0 = rot + (k * Math.PI * 2) / 10;
    c.strokeStyle = `rgba(${k % 2 ? '190,120,255' : '230,200,255'},${0.55 + 0.25 * Math.sin(t / 500 + k)})`;
    c.lineWidth = k % 2 ? 2.5 : 1.5;
    c.beginPath();
    for (let s = 0; s <= 1.0001; s += 0.1) {
      const rr = r * (1.04 - 0.22 * s),
        aa = a0 + s * 1.3,
        px = x + Math.cos(aa) * rr,
        py = y + Math.sin(aa) * rr;
      s ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.stroke();
  }
  /* 反向旋轉的外圈虛線 */
  c.shadowBlur = 0;
  c.setLineDash([14, 10]);
  c.lineDashOffset = t / 40;
  c.strokeStyle = 'rgba(240,220,255,.5)';
  c.lineWidth = 1.5;
  c.beginPath();
  c.arc(x, y, r * 1.06, 0, 6.28);
  c.stroke();
  c.restore();
  if (cam.z > 0.08)
    label(
      c,
      `魔霧 ${ROMAN[z.tier]} ${z.prog}%・剩 ${Math.max(0, Math.ceil((z.until - now()) / 60e3))} 分`,
      x,
      y - r - 10,
      12,
      '#e0c8ff',
      true
    );
}
/* 打倒魔霧裡的怪：累積進度，滿了碎裂得碎片 */
function mistWin(b) {
  const z = S.mist,
    e = b.e;
  if (!z || !b.mist) return '';
  const inc =
    (([4, 7, 12, 12, 18][e.rar || 0] + (MISTMON.some(m => m.name === b.mistBase) ? 2 : 0)) * (b.ud ? 1.5 : 1)) /
    (1 + 0.15 * z.tier);
  z.prog = Math.min(100, Math.round(z.prog + inc));
  if (z.prog < 100) return `<p style="color:#d8b8ff">魔霧進度 ${z.prog}%</p>`;
  const n = z.tier + 1;
  giveCur('mfrag', n);
  quest('mist');
  addLog(`魔霧 ${ROMAN[z.tier]} 碎裂，得到 ${n} 片魔霧碎片`);
  S.mist = null;
  refreshEntities(true);
  return `<p style="color:#e0c8ff">魔霧碎裂了！得到 ${curDot('mfrag')}魔霧碎片 ×${n}</p>`;
}

/* ================= sin lords ================= */
function makeSinLord(k, lv) {
  const s = SINI[k],
    st = stats(),
    b = {
      name: s.boss,
      bg: 'cave',
      spr: 'demon',
      pal: s.pal,
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
      spr: 'sinking',
      pal: {
        y: '#ffd166',
        h: '#2a0a1a',
        b: '#5a1a3a',
        e: '#ff3a5a',
        m: '#1a0a10',
        c: '#3a0a2a',
        w: '#c8a0ff',
        r: '#ff3a5a'
      },
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
    B.pFrozen = 1;
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
  if (sp.dt === 'sin') {
    const s = SINI[sp.sin];
    S.sins = S.sins || {};
    S.sins[s.k] = (S.sins[s.k] || 0) + 1;
    out.push(`${s.n}的殘魂`);
    if (Math.random() < 0.1 + 0.05 * (sp.xk || 0)) {
      const it = makeLegend(s.k);
      giveItem(it);
      out.push(itemName(it));
    }
    if (Math.random() < 0.35) out.push(giveJewel(1 + fl(Math.random() * 3)));
  } else if (sp.dt === 'sinking') {
    const it = makeLegend(SINS[fl(Math.random() * 7)].k, S.lv + 5);
    giveItem(it);
    out.push(itemName(it), giveJewel(3));
    S.title = '七宗罪之王討伐者';
    out.push('稱號「七宗罪之王討伐者」');
  }
  return out;
}

/* ================= sheets ================= */
function sinHTML(e) {
  const s = SINI[e.sin],
    x = Math.min(SIN_EXTRA, SEL.sinX || 0),
    have = S.cur.mfrag || 0,
    need = SIN_COST + x,
    ms = sinMods(e);
  return `<b style="color:#ff8a9a">${s.boss}</b><br>${s.d}。<br>挑戰需要 ${SIN_COST} 片魔霧碎片，3 層，怪物 Lv${S.lv + 3}，自帶 6 條詞綴：${ms.map(m => DMODI[m].n).join('、')}。每多放 1 片加 1 條魔霧詞綴（最多 +${SIN_EXTRA}），掉寶數量與稀有度各 +15%。<br>固定掉${s.n}的殘魂，${Math.round((0.1 + 0.05 * x) * 100)}% 掉傳奇裝備「${LEGI[s.k].n}」，35% 掉惡魔珠寶。<br><span class="sub">魔霧碎片：${have}・這次放 ${need} 片</span>`;
}
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
  return `<p class="sub">魔霧封印碎裂得到魔霧碎片，放進七宗罪雕像挑戰各宗罪的王。集齊 7 種殘魂可以組隊挑戰七宗罪之王。</p>
  <div class="curs"><span><img class="cico lg" src="${curIcon('mfrag')}" alt=""><span>魔霧碎片<b>${S.cur.mfrag || 0}</b></span></span>${SINS.map(s => `<span title="${s.boss}"><span>${s.n}的殘魂<b style="color:${sins[s.k] ? 'var(--gold)' : 'var(--dim)'}">${sins[s.k] || 0}</b></span></span>`).join('')}</div>
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
MAT_TABS.push(['demon', '魔霧', () => S.cur.mfrag || 0], ['jewels', '珠寶', () => (S.jewels || []).length]);

/* ================= actions ================= */
Object.assign(A, {
  mistGo: d => {
    const e = ENT.get(d.id);
    if (!e || !onSite(e) || S.mist || S.lv < MIST_TIERS[e.tier].lv) return;
    const t = MIST_TIERS[e.tier];
    S.defeated[e.id] = 1;
    S.mist = { id: e.id, x: e.x, y: e.y, r: t.r, tier: e.tier, prog: 0, until: now() + t.min * 60e3 };
    closeSheet();
    sfx('bless');
    buzz(80);
    toast(`魔霧 ${ROMAN[e.tier]} 擴散了！半徑 ${t.r} 公尺，${t.min} 分鐘內打滿進度`);
    addLog(`觸發魔霧封印 ${ROMAN[e.tier]}`);
    refreshEntities(true);
    save();
  },
  sinX: d => {
    SEL.sinX = Math.max(0, Math.min(SIN_EXTRA, (SEL.sinX || 0) + +d.v));
    openEnt(d.id);
  },
  sinGo: d => {
    const e = ENT.get(d.id),
      x = Math.min(SIN_EXTRA, SEL.sinX || 0),
      need = SIN_COST + x;
    if (!inRange(e) || isDone(e) || (S.cur.mfrag || 0) < need) return;
    S.cur.mfrag -= need;
    S.cleared[e.id] = ep2();
    SEL.sinX = 0;
    const ids = MMODS.map(m => m.id),
      um = [];
    for (let i = 0; i < x; i++) um.push(ids.splice(fl(Math.random() * ids.length), 1)[0]);
    closeSheet();
    enterDungeon({
      id: e.id,
      kind: 'dungeon',
      dt: 'sin',
      sin: e.sin,
      mods: sinMods(e),
      umods: um,
      xk: x,
      lv: S.lv + 3,
      lat: e.lat,
      lng: e.lng,
      floors: 3,
      onsite: onSite(e)
    });
    save();
  },
  sinKing: () => {
    const sins = S.sins || {};
    if (!SINS.every(s => sins[s.k] > 0)) return;
    partyCreate({
      id: 'sk' + uid(),
      dt: 'sinking',
      mods: [],
      lv: S.lv + 5,
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
