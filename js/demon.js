/* 漫步勇者 · 七宗罪、魔霧、四凶與燭龍、七罪信徒、傳奇裝備（0.1.0 肉鴿：魔霧區與七罪據點拿掉，只留首領、菁英與機制） */
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

/* ================= 山海經四凶與燭龍（首領） ================= */
const XIONG = [
  { k: 'hundun', n: '混沌', spr: 'a_hundun', el: 'chaos', d: '看不到牠的行動順序；每次行動換一種元素抗性' },
  { k: 'qiongqi', n: '窮奇', spr: 'a_qiongqi', el: 'cold', d: '專挑生命比例最低的人打；被打時反刺 15% 傷害' },
  { k: 'taowu', n: '檮杌', spr: 'a_taowu', el: 'phys', d: '每次行動護甲 +15%，越打越硬' },
  { k: 'taotie', n: '饕餮', spr: 'a_taotie', el: 'fire', d: '吃掉目標身上的增益回血；會偷吃你的生命藥水' }
];
const XIONGI = Object.fromEntries(XIONG.map(x => [x.k, x]));
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

/* ================= 七罪信徒（第二章的菁英） ================= */
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
