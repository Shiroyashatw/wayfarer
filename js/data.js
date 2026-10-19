/* 漫步勇者 · 遊戲資料：地點、怪物、詞綴、通貨、天賦樹、版本號 */
'use strict';
/* ================= state ================= */
/* 測試用：網址加 ?p=2 可以在同一個瀏覽器開第二個角色（不同存檔與帳號），用來測多人連線 */
const SLOT = new URLSearchParams(location.search).get('p') || '';
const KEY = 'wayfarer_art_v6' + (SLOT ? '_p' + SLOT : '');
let S,
  B = null,
  D = null,
  modalFns = [],
  sheetName = null,
  ENT = new Map(),
  simTarget = null,
  follow = true,
  resetArm = false,
  selItem = null,
  selGem = null,
  selSlot = null,
  selNode = null,
  MB = null;

/* ================= game data ================= */
/* 天賦盤起點（0.2 起職業不再決定技能與成長，只決定起點、起點數值、角色主色與開局技能石） */
const CLASSES = {
  novice: {
    name: '冒險者之魂',
    color: '#a9a3b8',
    gem: 'power',
    desc: '起點在天賦盤正中央，往任何方向都一樣近，起點數值最平均'
  },
  knight: { name: '戰士之魂', color: '#c94a4a', gem: 'bash', desc: '起點在左下，力量路線：生命、護甲、近戰' },
  ranger: { name: '遊俠之魂', color: '#3f9a52', gem: 'double', desc: '起點在右下，敏捷路線：暴擊、閃避、連擊與毒' },
  mage: { name: '術士之魂', color: '#5865d6', gem: 'fire', desc: '起點在上方，智力路線：法術、魔力、抗性' }
};
/* r 是技能石星級（祈願的稀有度）：3★ 常見、4★ 少見、5★ 稀有 */
const SKILLS = {
  attack: { name: '攻擊', mp: 0, kind: 'attack', mult: 1, icon: 'axe' },
  power: { name: '強力一擊', mp: 4, kind: 'attack', mult: 1.6, icon: 'sword', r: 3 },
  bash: { name: '盾擊', mp: 5, kind: 'attack', mult: 1.3, guard: 2, icon: 'shield', r: 3 },
  whirl: { name: '旋風斬', mp: 10, kind: 'attack', mult: 2.3, fx: 'whirl', icon: 'sword', r: 4 },
  fire: { name: '火球術', mp: 5, kind: 'spell', el: 'fire', mult: 2, fx: 'fire', icon: 'flame', r: 3 },
  ice: { name: '冰矛', mp: 8, kind: 'spell', el: 'cold', mult: 1.7, fx: 'ice', freeze: 0.3, icon: 'ice', r: 4 },
  heal: { name: '治癒', mp: 6, kind: 'heal', icon: 'heart', r: 3 },
  double: { name: '連射', mp: 6, kind: 'attack', mult: 1.05, hits: 2, fx: 'arrow', icon: 'arrow', r: 3 },
  poison: { name: '毒箭', mp: 5, kind: 'attack', mult: 1.1, poison: 3, fx: 'arrow', icon: 'leaf', r: 3 },
  bolt: { name: '落雷', mp: 7, kind: 'spell', el: 'light', mult: 2.1, fx: 'bolt', icon: 'bolt', r: 4 },
  pierce: { name: '穿雲箭', mp: 8, kind: 'attack', mult: 1.9, fx: 'arrow', icon: 'arrow', r: 4 },
  meteor: { name: '隕石術', mp: 16, kind: 'spell', el: 'fire', mult: 3.4, fx: 'fire', icon: 'flame', r: 5 },
  blizzard: { name: '暴風雪', mp: 14, kind: 'spell', el: 'cold', mult: 2.8, fx: 'ice', freeze: 0.5, icon: 'ice', r: 5 },
  cleave: { name: '裂地斬', mp: 14, kind: 'attack', mult: 3, fx: 'whirl', icon: 'axe', r: 5 },
  sanct: { name: '聖域', mp: 14, kind: 'heal', heal: 0.6, icon: 'heart', r: 5 }
};
const RSTAR = { 3: '#7fb4ff', 4: '#c58cff', 5: '#ffcf5a' };
/* 技能石：等級上限 30，每 5 級開 1 個空的刻印槽，要用刻印石點下去才會抽出詞綴 */
const GEM_MAX = 30;
const GEM_DRAW = 10;
const dustNeed = lv => Math.round(8 * Math.pow(lv, 1.5));
/* 刻印詞綴：t 是 T1～T3 的數值範圍（T1 最高、最少見），k 是可以出現的技能種類 */
const GAFF = [
  {
    id: 'dmg',
    n: v => `技能傷害 +${v}%`,
    k: ['attack', 'spell'],
    t: [
      [24, 32],
      [14, 20],
      [8, 12]
    ]
  },
  {
    id: 'cost',
    n: v => `魔力消耗 -${v}%`,
    k: ['attack', 'spell', 'heal'],
    t: [
      [18, 25],
      [12, 16],
      [6, 10]
    ]
  },
  {
    id: 'crit',
    n: v => `暴擊率 +${v}%`,
    k: ['attack', 'spell'],
    t: [
      [5, 7],
      [3, 4],
      [1, 2]
    ]
  },
  {
    id: 'ail',
    n: v => `燃燒、凍結、感電機率 +${v}%`,
    k: ['attack', 'spell'],
    t: [
      [50, 70],
      [30, 45],
      [15, 25]
    ]
  },
  {
    id: 'brk',
    n: v => `碎甲：無視敵人 ${v}% 護甲`,
    k: ['attack'],
    t: [
      [30, 40],
      [18, 25],
      [10, 15]
    ]
  },
  {
    id: 'leech',
    n: v => `吸血 +${v}%`,
    k: ['attack'],
    t: [
      [3, 4],
      [2, 2],
      [1, 1]
    ]
  },
  {
    id: 'dbl',
    n: v => `${v}% 機率多打一下`,
    k: ['attack'],
    t: [
      [16, 22],
      [10, 14],
      [5, 8]
    ]
  },
  {
    id: 'heal',
    n: v => `治癒量 +${v}%`,
    k: ['heal'],
    t: [
      [30, 40],
      [18, 25],
      [10, 15]
    ]
  }
];
const GAFFI = Object.fromEntries(GAFF.map(a => [a.id, a]));
/* 技能石專用通貨（存在 S.cur，但不列在裝備製作） */
const GCUR = [
  { id: 'soul', n: '靈魂碎片', d: `祈願用，每抽 ${GEM_DRAW} 個`, c: '#b7a6ff' },
  { id: 'dust', n: '靈魂粉塵', d: '分解技能石得到，用來替技能石升級', c: '#d8d0ff' },
  { id: 'eng', n: '刻印石', d: '在空的刻印槽抽一條隨機詞綴', c: '#9fd4ef' },
  { id: 'engC', n: '混沌刻印石', d: '隨機重洗一條刻印詞綴', c: '#e58a3a' },
  { id: 'engX', n: '崇高刻印石', d: '在空的刻印槽抽一條 T1～T2 詞綴', c: '#fff2b0' },
  { id: 'prism', n: '昇華稜鏡', d: '重洗階級最低的那條刻印詞綴', c: '#ff8fd8' },
  { id: 'engD', n: '神聖刻印石', d: '不換詞綴種類，重骰所有刻印詞綴的數值', c: '#ffe27a' },
  { id: 'vaal', n: '冥府之血', d: '腐化 Lv30 技能石：超限、擴槽、毀滅或降等（各 25%）', c: '#ff3a5a' }
];
const GCURI = Object.fromEntries(GCUR.map(c => [c.id, c]));
const EL = { phys: '物理', fire: '火焰', cold: '冰冷', light: '閃電' };
const MONS = [
  {
    name: '綠史萊姆',
    bg: 'meadow',
    spr: 'slime',
    pal: { g: '#62b844', w: '#ffffff', e: '#173010' },
    hp: 28,
    atk: 6,
    arm: 5,
    el: 'phys',
    res: [0, 0, 0],
    xp: 8,
    gold: 6,
    w: 5
  },
  {
    name: '霓虹史萊姆',
    bg: 'city',
    spr: 'slime',
    pal: { g: '#d65ac4', w: '#ffffff', e: '#2a1030' },
    hp: 30,
    atk: 7,
    arm: 4,
    el: 'light',
    res: [0, 0, 40],
    xp: 9,
    gold: 8,
    w: 3
  },
  {
    name: '夜蝠',
    bg: 'city',
    spr: 'bat',
    pal: { p: '#6e4bb0', e: '#ffd166', w: '#ffffff' },
    hp: 22,
    atk: 8,
    arm: 0,
    el: 'phys',
    res: [0, 0, 0],
    xp: 9,
    gold: 7,
    w: 4
  },
  {
    name: '稻草人魔',
    bg: 'meadow',
    spr: 'scare',
    pal: { y: '#e6c35c', t: '#c9a878', e: '#2a1a10', m: '#c0392b', w: '#8a6a40', r: '#b8433d' },
    hp: 38,
    atk: 9,
    arm: 10,
    el: 'phys',
    res: [-30, 0, 0],
    xp: 12,
    gold: 10,
    w: 3
  },
  {
    name: '眼鏡蛇',
    bg: 'forest',
    spr: 'snake',
    pal: { s: '#c9a03a', b: '#8a6a2a', e: '#e5484d', w: '#f4e3a8' },
    hp: 34,
    atk: 10,
    arm: 6,
    el: 'phys',
    res: [0, 0, 0],
    xp: 12,
    gold: 9,
    w: 3
  },
  {
    name: '狂暴山豬',
    bg: 'forest',
    spr: 'boar',
    pal: { b: '#6b4a35', e: '#ffdd55', n: '#c99a85', w: '#f4ead2' },
    hp: 55,
    atk: 12,
    arm: 25,
    el: 'phys',
    res: [0, 10, 0],
    xp: 20,
    gold: 14,
    w: 2,
    min: 3
  },
  {
    name: '魔神仔',
    bg: 'forest',
    spr: 'spirit',
    pal: { v: '#8fcdbd', e: '#102a24', m: '#c0392b' },
    hp: 45,
    atk: 13,
    arm: 0,
    el: 'cold',
    res: [0, 40, 0],
    xp: 22,
    gold: 16,
    w: 2,
    min: 4
  },
  {
    name: '雪原狼',
    bg: 'mountain',
    spr: 'wolf',
    pal: { g: '#c3cddb', e: '#e5484d', n: '#2a2a35', w: '#ffffff' },
    hp: 60,
    atk: 15,
    arm: 12,
    el: 'cold',
    res: [0, 50, -10],
    xp: 28,
    gold: 20,
    w: 2,
    min: 5
  },
  {
    name: '岩石魔像',
    bg: 'mountain',
    spr: 'golem',
    pal: { r: '#8a8070', y: '#7fe0ff' },
    hp: 80,
    atk: 14,
    arm: 60,
    el: 'phys',
    res: [20, 20, 20],
    xp: 32,
    gold: 24,
    w: 1,
    min: 6
  },
  {
    name: '焰史萊姆',
    bg: 'meadow',
    spr: 'slime',
    pal: { g: '#e8603a', w: '#ffe0a0', e: '#3a0d05' },
    hp: 32,
    atk: 8,
    arm: 4,
    el: 'fire',
    res: [50, -20, 0],
    xp: 10,
    gold: 8,
    w: 3,
    min: 2
  },
  {
    name: '流浪犬魔',
    bg: 'city',
    spr: 'wolf',
    pal: { g: '#9a7a52', e: '#ff4040', n: '#3a2a1a', w: '#e8d8b8' },
    hp: 40,
    atk: 10,
    arm: 8,
    el: 'phys',
    res: [0, 0, 0],
    xp: 13,
    gold: 10,
    w: 3,
    min: 2
  },
  {
    name: '冰晶史萊姆',
    bg: 'mountain',
    spr: 'slime',
    pal: { g: '#8fd8f0', w: '#ffffff', e: '#0d2a3a' },
    hp: 32,
    atk: 8,
    arm: 6,
    el: 'cold',
    res: [-20, 50, 0],
    xp: 10,
    gold: 8,
    w: 2,
    min: 3
  },
  {
    name: '雷鳴蝠',
    bg: 'city',
    spr: 'bat',
    pal: { p: '#c9b23a', e: '#3a1a5a', w: '#ffffff' },
    hp: 26,
    atk: 10,
    arm: 0,
    el: 'light',
    res: [0, 0, 50],
    xp: 12,
    gold: 9,
    w: 2,
    min: 3
  },
  {
    name: '百步蛇',
    bg: 'forest',
    spr: 'snake',
    pal: { s: '#8a7a5a', b: '#3f3226', e: '#ffdd55', w: '#d8c8a0' },
    hp: 42,
    atk: 13,
    arm: 6,
    el: 'phys',
    res: [0, 0, 0],
    xp: 18,
    gold: 12,
    w: 2,
    min: 4
  },
  {
    name: '石虎',
    bg: 'forest',
    spr: 'wolf',
    pal: { g: '#c98a4a', e: '#7bd36b', n: '#2a1a10', w: '#f4e3c8' },
    hp: 48,
    atk: 14,
    arm: 10,
    el: 'phys',
    res: [0, 0, 0],
    xp: 22,
    gold: 15,
    w: 2,
    min: 4
  },
  {
    name: '水鬼',
    bg: 'meadow',
    spr: 'spirit',
    pal: { v: '#5f8fb8', e: '#06121e', m: '#2a4a6a' },
    hp: 50,
    atk: 14,
    arm: 0,
    el: 'cold',
    res: [0, 40, -20],
    xp: 24,
    gold: 17,
    w: 2,
    min: 5
  },
  {
    name: '熔岩魔像',
    bg: 'mountain',
    spr: 'golem',
    pal: { r: '#7a3020', y: '#ffb040' },
    hp: 85,
    atk: 16,
    arm: 50,
    el: 'fire',
    res: [50, -10, 20],
    xp: 36,
    gold: 26,
    w: 1,
    min: 7
  },
  {
    name: '台灣黑熊',
    bg: 'forest',
    spr: 'bear',
    pal: { b: '#2a2630', e: '#ffdd55', n: '#8a7060', w: '#f4ead2' },
    hp: 95,
    atk: 18,
    arm: 30,
    el: 'phys',
    res: [10, 10, 0],
    xp: 40,
    gold: 28,
    w: 1,
    min: 7
  },
  /* 0.1.7：再加 32 種（共 50 種），min 是玩家等級門檻 */
  {
    name: '招潮蟹',
    bg: 'meadow',
    spr: 'crab',
    pal: { r: '#e86a3a', e: '#1a1a1a', w: '#f4e3c8' },
    hp: 30,
    atk: 7,
    arm: 12,
    el: 'phys',
    res: [0, 0, 0],
    xp: 9,
    gold: 7,
    w: 3,
    min: 1
  },
  {
    name: '毒蘑菇',
    bg: 'forest',
    spr: 'mush',
    pal: { r: '#c0392b', w: '#f4ead2', s: '#e8dcc0', e: '#2a1a10', m: '#7a2a1a' },
    hp: 26,
    atk: 8,
    arm: 2,
    el: 'phys',
    res: [-20, 0, 0],
    xp: 9,
    gold: 7,
    w: 3,
    min: 1
  },
  {
    name: '夜鷺',
    bg: 'meadow',
    spr: 'bird',
    pal: { b: '#4a5a6a', e: '#ffdd55', y: '#f2c14e', w: '#c8d4e0' },
    hp: 24,
    atk: 9,
    arm: 0,
    el: 'phys',
    res: [0, 0, 0],
    xp: 10,
    gold: 7,
    w: 3,
    min: 1
  },
  {
    name: '斑腿樹蛙',
    bg: 'forest',
    spr: 'frog',
    pal: { g: '#6fae4a', w: '#ffffff', m: '#3f6e2a' },
    hp: 28,
    atk: 8,
    arm: 4,
    el: 'cold',
    res: [0, 20, 0],
    xp: 10,
    gold: 8,
    w: 3,
    min: 2
  },
  {
    name: '垃圾史萊姆',
    bg: 'city',
    spr: 'slime',
    pal: { g: '#7a7a5a', w: '#c8c8a0', e: '#1a1a10' },
    hp: 34,
    atk: 8,
    arm: 8,
    el: 'phys',
    res: [0, 0, 0],
    xp: 11,
    gold: 9,
    w: 3,
    min: 2
  },
  {
    name: '夜市鼠王',
    bg: 'city',
    spr: 'boar',
    pal: { b: '#6a6a72', e: '#ff4040', n: '#d8a0a0', w: '#f4ead2' },
    hp: 36,
    atk: 10,
    arm: 8,
    el: 'phys',
    res: [0, 0, 0],
    xp: 12,
    gold: 11,
    w: 3,
    min: 2
  },
  {
    name: '海鷗',
    bg: 'meadow',
    spr: 'bird',
    pal: { b: '#e8eef4', e: '#1a1a1a', y: '#f2a03a', w: '#ffffff' },
    hp: 24,
    atk: 10,
    arm: 0,
    el: 'phys',
    res: [0, 10, 0],
    xp: 11,
    gold: 8,
    w: 2,
    min: 2
  },
  {
    name: '火蟻巢',
    bg: 'meadow',
    spr: 'slime',
    pal: { g: '#b8402a', w: '#ffb15a', e: '#2a0a05' },
    hp: 30,
    atk: 11,
    arm: 6,
    el: 'fire',
    res: [30, 0, 0],
    xp: 12,
    gold: 9,
    w: 2,
    min: 3
  },
  {
    name: '檳榔精',
    bg: 'forest',
    spr: 'scare',
    pal: { y: '#7fae4a', t: '#c9a878', e: '#2a1a10', m: '#c0392b', w: '#6a4a2a', r: '#3f6e2a' },
    hp: 40,
    atk: 11,
    arm: 10,
    el: 'phys',
    res: [0, 0, 0],
    xp: 14,
    gold: 11,
    w: 2,
    min: 3
  },
  {
    name: '電音蝠',
    bg: 'city',
    spr: 'bat',
    pal: { p: '#3fd6e8', e: '#ff3ad6', w: '#ffffff' },
    hp: 28,
    atk: 12,
    arm: 0,
    el: 'light',
    res: [0, 0, 40],
    xp: 14,
    gold: 11,
    w: 2,
    min: 4
  },
  {
    name: '白鷺精',
    bg: 'meadow',
    spr: 'bird',
    pal: { b: '#f4f4f4', e: '#1a1a1a', y: '#f2c14e', w: '#ffffff' },
    hp: 40,
    atk: 13,
    arm: 4,
    el: 'cold',
    res: [0, 30, 0],
    xp: 18,
    gold: 13,
    w: 2,
    min: 4
  },
  {
    name: '寄居蟹',
    bg: 'meadow',
    spr: 'crab',
    pal: { r: '#c9a03a', e: '#1a1a1a', w: '#f4e3c8' },
    hp: 44,
    atk: 12,
    arm: 40,
    el: 'phys',
    res: [10, 10, 10],
    xp: 18,
    gold: 13,
    w: 2,
    min: 4
  },
  {
    name: '夜叉鬼',
    bg: 'forest',
    spr: 'spirit',
    pal: { v: '#8a3a5a', e: '#ffdd55', m: '#2a0a1a' },
    hp: 52,
    atk: 14,
    arm: 0,
    el: 'phys',
    res: [0, 0, 0],
    xp: 22,
    gold: 16,
    w: 2,
    min: 5
  },
  {
    name: '雷鳴蛙',
    bg: 'forest',
    spr: 'frog',
    pal: { g: '#c9c23a', w: '#ffffff', m: '#7a6a1a' },
    hp: 44,
    atk: 14,
    arm: 6,
    el: 'light',
    res: [0, 0, 40],
    xp: 20,
    gold: 15,
    w: 2,
    min: 5
  },
  {
    name: '山羌',
    bg: 'forest',
    spr: 'wolf',
    pal: { g: '#a07a4a', e: '#1a1a1a', n: '#2a1a10', w: '#e8d8b8' },
    hp: 46,
    atk: 13,
    arm: 6,
    el: 'phys',
    res: [0, 0, 0],
    xp: 20,
    gold: 15,
    w: 2,
    min: 5
  },
  {
    name: '毒菇王',
    bg: 'forest',
    spr: 'mush',
    pal: { r: '#7a3aa0', w: '#e8d4ff', s: '#d8c8b8', e: '#2a1a10', m: '#4a1a6a' },
    hp: 50,
    atk: 14,
    arm: 10,
    el: 'phys',
    res: [-10, 0, 0],
    xp: 22,
    gold: 16,
    w: 1,
    min: 6
  },
  {
    name: '黑面琵鷺',
    bg: 'meadow',
    spr: 'bird',
    pal: { b: '#f0f0f0', e: '#1a1a1a', y: '#2a2a2a', w: '#ffffff' },
    hp: 46,
    atk: 15,
    arm: 4,
    el: 'phys',
    res: [0, 10, 0],
    xp: 22,
    gold: 16,
    w: 1,
    min: 6
  },
  {
    name: '鬼火',
    bg: 'city',
    spr: 'spirit',
    pal: { v: '#6ab8ff', e: '#ffffff', m: '#1a3a8a' },
    hp: 44,
    atk: 16,
    arm: 0,
    el: 'fire',
    res: [40, 0, 0],
    xp: 24,
    gold: 17,
    w: 2,
    min: 6
  },
  {
    name: '赤尾青竹絲',
    bg: 'forest',
    spr: 'snake',
    pal: { s: '#4aae4a', b: '#2a6e2a', e: '#ffdd55', w: '#c0392b' },
    hp: 46,
    atk: 17,
    arm: 4,
    el: 'phys',
    res: [0, 0, 0],
    xp: 26,
    gold: 18,
    w: 2,
    min: 6
  },
  {
    name: '高山白鼻心',
    bg: 'mountain',
    spr: 'boar',
    pal: { b: '#7a6a5a', e: '#ffdd55', n: '#f4f4f4', w: '#f4ead2' },
    hp: 56,
    atk: 15,
    arm: 14,
    el: 'phys',
    res: [0, 10, 0],
    xp: 26,
    gold: 18,
    w: 2,
    min: 6
  },
  {
    name: '城隍差役',
    bg: 'city',
    spr: 'scare',
    pal: { y: '#3a3a4a', t: '#d8c8a8', e: '#1a1a1a', m: '#c0392b', w: '#5a4030', r: '#2a2a3a' },
    hp: 58,
    atk: 15,
    arm: 20,
    el: 'phys',
    res: [10, 10, 10],
    xp: 28,
    gold: 20,
    w: 1,
    min: 7
  },
  {
    name: '雲豹',
    bg: 'forest',
    spr: 'wolf',
    pal: { g: '#c9b48a', e: '#7fd6c2', n: '#2a2a35', w: '#f4ead2' },
    hp: 60,
    atk: 17,
    arm: 12,
    el: 'phys',
    res: [0, 0, 0],
    xp: 30,
    gold: 22,
    w: 1,
    min: 8
  },
  {
    name: '冰霧狼',
    bg: 'mountain',
    spr: 'wolf',
    pal: { g: '#8fd8f0', e: '#1a3a5a', n: '#2a4a6a', w: '#ffffff' },
    hp: 66,
    atk: 18,
    arm: 12,
    el: 'cold',
    res: [0, 60, -10],
    xp: 32,
    gold: 23,
    w: 1,
    min: 9
  },
  {
    name: '熊鷹',
    bg: 'mountain',
    spr: 'bird',
    pal: { b: '#6a4a2a', e: '#ffdd55', y: '#f2c14e', w: '#e8d8b8' },
    hp: 70,
    atk: 22,
    arm: 10,
    el: 'phys',
    res: [0, 0, 0],
    xp: 40,
    gold: 28,
    w: 1,
    min: 9
  },
  {
    name: '玉山晶石魔像',
    bg: 'mountain',
    spr: 'golem',
    pal: { r: '#8fb8d8', y: '#ffffff' },
    hp: 95,
    atk: 19,
    arm: 55,
    el: 'cold',
    res: [20, 50, 20],
    xp: 42,
    gold: 30,
    w: 1,
    min: 10
  },
  {
    name: '椰子蟹',
    bg: 'meadow',
    spr: 'crab',
    pal: { r: '#5a3a8a', e: '#ffdd55', w: '#c8a8e8' },
    hp: 90,
    atk: 20,
    arm: 60,
    el: 'phys',
    res: [10, 10, 10],
    xp: 44,
    gold: 31,
    w: 1,
    min: 10
  },
  {
    name: '雷神魔像',
    bg: 'mountain',
    spr: 'golem',
    pal: { r: '#5a5a2a', y: '#fff27a' },
    hp: 92,
    atk: 20,
    arm: 50,
    el: 'light',
    res: [20, 20, 60],
    xp: 42,
    gold: 30,
    w: 1,
    min: 11
  },
  {
    name: '山魈',
    bg: 'forest',
    spr: 'bear',
    pal: { b: '#5a4a3a', e: '#ff4040', n: '#c99a85', w: '#c9a878' },
    hp: 100,
    atk: 22,
    arm: 28,
    el: 'phys',
    res: [10, 0, 0],
    xp: 46,
    gold: 33,
    w: 1,
    min: 11
  },
  {
    name: '赤目魔神仔',
    bg: 'forest',
    spr: 'spirit',
    pal: { v: '#2a4a3a', e: '#ff3a3a', m: '#c0392b' },
    hp: 80,
    atk: 23,
    arm: 0,
    el: 'cold',
    res: [0, 40, 0],
    xp: 46,
    gold: 33,
    w: 1,
    min: 12
  },
  {
    name: '地府判官',
    bg: 'city',
    spr: 'scare',
    pal: { y: '#2a1a1a', t: '#e8d8b8', e: '#ff3a3a', m: '#c0392b', w: '#2a2a2a', r: '#4a0e0e' },
    hp: 96,
    atk: 24,
    arm: 30,
    el: 'fire',
    res: [40, 20, 20],
    xp: 52,
    gold: 37,
    w: 1,
    min: 13
  },
  {
    name: '熔岩巨蛙',
    bg: 'mountain',
    spr: 'frog',
    pal: { g: '#a03a1a', w: '#ffb040', m: '#ff7a3a' },
    hp: 96,
    atk: 24,
    arm: 24,
    el: 'fire',
    res: [60, -20, 0],
    xp: 52,
    gold: 37,
    w: 1,
    min: 13
  },
  {
    name: '黑潮海龍',
    bg: 'meadow',
    spr: 'snake',
    pal: { s: '#2a4a8a', b: '#1a2a5a', e: '#7fe0ff', w: '#c8e8ff' },
    hp: 110,
    atk: 26,
    arm: 30,
    el: 'cold',
    res: [0, 50, 0],
    xp: 60,
    gold: 42,
    w: 1,
    min: 14
  },
  /* 0.2.5.1 新增 */
  {
    name: '台灣獼猴',
    bg: 'forest',
    spr: 'monkey',
    pal: { b: '#8a6a4a', f: '#e8a8a0', e: '#1a1010' },
    hp: 26,
    atk: 7,
    arm: 4,
    el: 'phys',
    res: [0, 0, 0],
    xp: 9,
    gold: 8,
    w: 4
  },
  {
    name: '巷口黑貓',
    bg: 'city',
    spr: 'cat',
    pal: { c: '#2a2630', e: '#ffe24a' },
    hp: 24,
    atk: 8,
    arm: 2,
    el: 'phys',
    res: [0, 0, 0],
    xp: 9,
    gold: 8,
    w: 4
  },
  {
    name: '寬尾鳳蝶',
    bg: 'forest',
    spr: 'butterfly',
    pal: { w: '#3a3a4a', d: '#111018', y: '#e84a4a', b: '#3a3040' },
    hp: 20,
    atk: 6,
    arm: 0,
    el: 'light',
    res: [0, 0, 20],
    xp: 8,
    gold: 7,
    w: 3
  },
  {
    name: '穿山甲',
    bg: 'forest',
    spr: 'pangolin',
    pal: { s: '#9a7a5a', d: '#6a4a32', e: '#111111', n: '#e8b0a0' },
    hp: 34,
    atk: 6,
    arm: 30,
    el: 'phys',
    res: [0, 0, 0],
    xp: 11,
    gold: 9,
    w: 3,
    min: 2
  },
  {
    name: '梅花鹿',
    bg: 'meadow',
    spr: 'deer',
    pal: { b: '#b8783a', w: '#ffffff', a: '#e8d8b0', e: '#111111' },
    hp: 34,
    atk: 8,
    arm: 6,
    el: 'phys',
    res: [0, 0, 0],
    xp: 11,
    gold: 9,
    w: 3,
    min: 2
  },
  {
    name: '獨角仙',
    bg: 'forest',
    spr: 'beetle',
    pal: { b: '#5a3220', h: '#3a2014', s: '#c8a080', e: '#ffd866' },
    hp: 36,
    atk: 9,
    arm: 25,
    el: 'phys',
    res: [0, 0, 0],
    xp: 12,
    gold: 9,
    w: 3,
    min: 2
  },
  {
    name: '水鹿',
    bg: 'mountain',
    spr: 'deer',
    pal: { b: '#7a5a3a', w: '#e8dcc8', a: '#d8c8a0', e: '#111111' },
    hp: 40,
    atk: 9,
    arm: 8,
    el: 'phys',
    res: [0, 0, 0],
    xp: 13,
    gold: 10,
    w: 3,
    min: 3
  },
  {
    name: '飛魚',
    bg: 'meadow',
    spr: 'fish',
    pal: { b: '#3a6ad6', w: '#e8f4ff', f: '#7ab8ff', e: '#111111' },
    hp: 30,
    atk: 11,
    arm: 4,
    el: 'cold',
    res: [0, 20, 0],
    xp: 13,
    gold: 10,
    w: 3,
    min: 3
  },
  {
    name: '綠蠵龜',
    bg: 'meadow',
    spr: 'turtle',
    pal: { s: '#3a6a4a', d: '#2a4a2a', g: '#8ab890', e: '#111111' },
    hp: 60,
    atk: 9,
    arm: 45,
    el: 'cold',
    res: [0, 30, 0],
    xp: 18,
    gold: 14,
    w: 2,
    min: 4
  },
  {
    name: '水母',
    bg: 'meadow',
    spr: 'jelly',
    pal: { j: '#b8a8ff', w: '#ffffff', t: '#8a7ad6', e: '#3a2a6a' },
    hp: 34,
    atk: 12,
    arm: 0,
    el: 'light',
    res: [0, 0, 40],
    xp: 15,
    gold: 12,
    w: 2,
    min: 4
  },
  {
    name: '燈籠妖',
    bg: 'city',
    spr: 'lantern',
    pal: { l: '#d83a2a', y: '#ffd866', e: '#1a0a0a', m: '#3a0a0a' },
    hp: 50,
    atk: 13,
    arm: 6,
    el: 'fire',
    res: [40, 0, 0],
    xp: 22,
    gold: 18,
    w: 2,
    min: 5
  },
  {
    name: '風獅爺',
    bg: 'city',
    spr: 'lion',
    pal: { s: '#b8a890', m: '#7a6a58', r: '#c02a2a', e: '#111111' },
    hp: 80,
    atk: 14,
    arm: 50,
    el: 'phys',
    res: [20, 20, 20],
    xp: 32,
    gold: 24,
    w: 2,
    min: 6
  },
  {
    name: '夜市招財貓',
    bg: 'city',
    spr: 'cat',
    pal: { c: '#f4ead2', e: '#2a1a10' },
    hp: 60,
    atk: 14,
    arm: 12,
    el: 'phys',
    res: [0, 0, 0],
    xp: 30,
    gold: 45,
    w: 1,
    min: 7
  },
  {
    name: '虎爺',
    bg: 'city',
    spr: 'tiger',
    pal: { o: '#e88a2a', d: '#2a1a10', w: '#fff4e0', e: '#111111' },
    hp: 85,
    atk: 19,
    arm: 22,
    el: 'fire',
    res: [30, 0, 0],
    xp: 38,
    gold: 28,
    w: 2,
    min: 8
  },
  {
    name: '電鰻',
    bg: 'city',
    spr: 'fish',
    pal: { b: '#d8c83a', w: '#fff8c8', f: '#8a7a1a', e: '#111111' },
    hp: 70,
    atk: 20,
    arm: 10,
    el: 'light',
    res: [0, 0, 40],
    xp: 40,
    gold: 30,
    w: 1,
    min: 9
  },
  {
    name: '獼猴王',
    bg: 'mountain',
    spr: 'monkey',
    pal: { b: '#c8a040', f: '#f0c0a0', e: '#3a1a00' },
    hp: 110,
    atk: 22,
    arm: 25,
    el: 'phys',
    res: [10, 10, 10],
    xp: 55,
    gold: 40,
    w: 1,
    min: 10
  },
  {
    name: '雪山水鹿王',
    bg: 'mountain',
    spr: 'deer',
    pal: { b: '#6a8aa8', w: '#e8f8ff', a: '#a8e8ff', e: '#111111' },
    hp: 130,
    atk: 24,
    arm: 30,
    el: 'cold',
    res: [0, 50, 0],
    xp: 62,
    gold: 44,
    w: 1,
    min: 12
  },
  {
    name: '石敢當',
    bg: 'mountain',
    spr: 'lion',
    pal: { s: '#6a6a7a', m: '#3a3a48', r: '#ff6a3a', e: '#ffe24a' },
    hp: 150,
    atk: 26,
    arm: 70,
    el: 'phys',
    res: [30, 30, 30],
    xp: 70,
    gold: 50,
    w: 1,
    min: 13
  }
];
const MIMIC = {
  name: '寶箱怪',
  bg: 'city',
  spr: 'mimic',
  pal: { b: '#9a5a2a', y: '#f2c14e', e: '#ff3a3a', w: '#ffffff' },
  hp: 50,
  atk: 12,
  arm: 20,
  el: 'phys',
  res: [10, 10, 10],
  xp: 20,
  gold: 30
};
const EMODS = [
  { id: 'swift', n: '迅捷', d: '有機率行動兩次' },
  { id: 'tough', n: '堅韌', d: '生命 +60%' },
  { id: 'fire', n: '烈焰', d: '攻擊附帶火焰傷害' },
  { id: 'cold', n: '冰霜', d: '攻擊附帶冰冷傷害，可能凍結你' },
  { id: 'shock', n: '雷暴', d: '攻擊附帶閃電傷害' },
  { id: 'leech', n: '吸血', d: '造成傷害時回復生命' },
  { id: 'reflect', n: '反射', d: '反彈 15% 受到的傷害' },
  { id: 'fury', n: '狂暴', d: '生命低於一半時攻擊 +50%' },
  { id: 'armored', n: '鐵甲', d: '護甲大幅提高' }
];
/* 稀有度：0 普通 1 魔法 2 稀有 3 首領（橘）4 危險怪（紅名，只出現在怪物） */
/* 地城種類：層數、等級加成、詞綴數量範圍、掉寶加成（數量 q%／稀有度 r%） */
const DTYPES = {
  normal: {
    n: '普通地城',
    max: 2,
    floors: 3,
    lv: 1,
    mods: [0, 1],
    q: 0,
    r: 0,
    hp: 1,
    col: '#c9b59a',
    pal: { x: '#7b7182', m: '#5b5466', r: '#ff4d4d' },
    desc: '一個人就能攻略，也可以 2 人組隊。'
  },
  party: {
    n: '團體地城',
    max: 3,
    floors: 4,
    lv: 2,
    mods: [1, 2],
    q: 30,
    r: 20,
    hp: 1.5,
    col: '#7fd6ff',
    pal: { x: '#5a6a8a', m: '#3a4a66', r: '#7fd6ff' },
    desc: '最多 3 人組隊。怪物比較硬，掉寶比較多。'
  },
  hell: {
    n: '地獄地城',
    max: 4,
    floors: 5,
    lv: 4,
    mods: [3, 4],
    q: 80,
    r: 60,
    hp: 2,
    col: '#ff4a4a',
    pal: { x: '#6a2a2a', m: '#3a1414', r: '#ffb040' },
    desc: '非常危險。首領是災厄級，最多 4 人，建議等級夠高再組滿隊伍挑戰。'
  },
  /* 以下三種不會在路邊出現，由背包裡的卷軸、石碑、冥府碎片組成；norevive：倒下不會在下一層復活 */
  stele: {
    n: '單人石碑',
    max: 1,
    floors: 3,
    lv: 2,
    mods: [0, 0],
    q: 20,
    r: 20,
    hp: 1.3,
    col: '#b9b6c4',
    pal: { x: '#8a8796', m: '#5a5466', r: '#7fd6ff' },
    desc: '空白石碑卷注入碑文碎片做成的短副本，失敗就沒了。'
  },
  circle: {
    n: '石碑魔法陣',
    max: 4,
    floors: 20,
    lv: 3,
    mods: [0, 0],
    q: 60,
    r: 50,
    hp: 1.6,
    norevive: true,
    col: '#b89aff',
    pal: { x: '#4a3a6a', m: '#2a2040', r: '#b89aff' },
    desc: '4～6 個石碑合成的 20 層地城，倒下不會復活，全隊倒下就失敗。'
  },
  portal: {
    n: '冥府傳送門',
    max: 4,
    floors: 8,
    lv: 5,
    mods: [0, 0],
    q: 120,
    r: 100,
    hp: 2.2,
    norevive: true,
    col: '#ff3a5a',
    pal: { x: '#3a1a2e', m: '#1a0a14', r: '#ff3a5a' },
    desc: '4 片冥府碎片組成的傳送門，首領保證掉落冥府之血。倒下不會復活。'
  }
};
/* 地城詞綴（參考 PoE 地圖詞綴）：讓地城更難，但提高掉落數量與稀有度。em 會加到每隻怪物身上，dm 是怪物數值倍率 */
const DMODS = [
  { id: 'mhp', n: '強壯怪物', d: '怪物生命 +40%', q: 8, r: 5, dm: { hp: 1.4 } },
  { id: 'matk', n: '兇猛怪物', d: '怪物傷害 +25%', q: 10, r: 6, dm: { atk: 1.25 } },
  { id: 'marm', n: '堅甲怪物', d: '怪物護甲 +100%', q: 6, r: 4, dm: { arm: 2 } },
  { id: 'fire', n: '灼熱之地', d: '怪物攻擊附帶火焰傷害', q: 8, r: 6, em: 'fire' },
  { id: 'cold', n: '冰封之地', d: '怪物攻擊附帶冰冷傷害，可能凍結你', q: 8, r: 6, em: 'cold' },
  { id: 'shock', n: '雷霆之地', d: '怪物攻擊附帶閃電傷害', q: 8, r: 6, em: 'shock' },
  { id: 'swift', n: '迅捷怪物', d: '怪物有機率行動兩次', q: 10, r: 8, em: 'swift' },
  { id: 'leech', n: '吸血怪物', d: '怪物造成傷害時回復生命', q: 6, r: 5, em: 'leech' },
  { id: 'eleweak', n: '元素削弱', d: '你的全部抗性 -20%', q: 12, r: 10 },
  { id: 'noregen', n: '枯竭之地', d: '藥水效果減半', q: 10, r: 8 },
  { id: 'elite', n: '精英巢穴', d: '魔法怪與稀有怪大幅增加', q: 15, r: 12 }
];
const DMODI = Object.fromEntries(DMODS.map(m => [m.id, m]));
/* 冥府詞綴：侵蝕柱附近的怪物與冥府傳送門的怪物身上才有，效果在 uwApply */
const UMODS = [
  { id: 'uw_body', n: '冥府之軀', d: '生命 +120%', uw: 1 },
  { id: 'uw_flame', n: '冥火', d: '攻擊 +40%，改為火焰傷害', uw: 1 },
  { id: 'uw_ward', n: '幽冥護體', d: '全部抗性 +40%、護甲 +50%', uw: 1 },
  { id: 'uw_rage', n: '怨念', d: '攻擊 +20%、速度大幅提高', uw: 1 },
  { id: 'uw_soul', n: '噬魂', d: '生命 +40%，攻擊時吸血', uw: 1 }
];
const EMODI = Object.fromEntries([...EMODS, ...UMODS].map(m => [m.id, m]));
/* 冥府碎片的 4 個部位 */
const FRAG_PARTS = ['冥府之眼', '冥府之心', '冥府之手', '冥府之足'];
/* 區域特性：地圖每 2 公里一格，每 2 小時重骰 */
const ZONE_CELL = 2000,
  ZONE_MS = 2 * 3600e3;
const ZMODS = [
  { n: '魔物潮', d: '稀有與魔法怪出現率 +40%', rare: 1.4 },
  { n: '豐收', d: '物品數量 +30%', q: 30 },
  { n: '寶光', d: '物品稀有度 +30%', r: 30 },
  { n: '靈魂共鳴', d: '靈魂碎片掉落加倍', soul: 2 },
  { n: '刻印之風', d: '刻印石掉落率 +50%', eng: 1.5 },
  { n: '金脈', d: '金幣 +50%', gold: 1.5 },
  { n: '修羅場', d: '經驗 +30%，怪物等級 +1', xp: 1.3, mlv: 1 },
  { n: '寧靜', d: '沒有特殊效果' }
];
const RCOL = ['#e8e2d4', '#7fa8ff', '#f2d25e', '#e8873a', '#ff4a4a'],
  RNAME = ['普通', '魔法', '稀有', '傳奇', '危險'];
const RGLOW = ['', '110,160,255', '242,210,94', '232,135,58', '255,60,60'];
const RAREA = ['腐朽', '暴怒', '深淵', '雷霆', '血色', '古老', '狂嘯', '幽影'],
  RAREB = ['獠牙', '之握', '之心', '咆哮', '之眼', '守望', '裂痕', '之刃'];
const SLOTS = ['weapon', 'offhand', 'helm', 'chest', 'gloves', 'boots', 'belt', 'ring1', 'ring2', 'amulet'];
const SLOTN = {
  weapon: '武器',
  offhand: '副手',
  helm: '頭盔',
  chest: '胸甲',
  gloves: '手套',
  boots: '鞋子',
  belt: '腰帶',
  ring: '戒指',
  ring1: '戒指',
  ring2: '戒指',
  amulet: '護身符'
};
const BASES = {
  weapon: [
    { n: '短劍', phys: [3, 7], crit: 6 },
    { n: '長劍', phys: [5, 11], crit: 5 },
    { n: '戰斧', phys: [8, 15], crit: 4 },
    { n: '獵弓', phys: [4, 10], crit: 6 },
    { n: '法杖', phys: [2, 5], crit: 5, imp: ['spellPct', 20] }
  ],
  helm: [
    { n: '皮帽', arm: 1 },
    { n: '鐵盔', arm: 1.6 }
  ],
  chest: [
    { n: '皮甲', arm: 2 },
    { n: '鎖子甲', arm: 3 }
  ],
  gloves: [
    { n: '皮手套', arm: 0.8 },
    { n: '鐵手甲', arm: 1.2 }
  ],
  boots: [
    { n: '皮靴', arm: 0.8, imp: ['speed', 2] },
    { n: '鐵靴', arm: 1.2 }
  ],
  ring: [
    { n: '紅寶石戒指', imp: ['resFire', 12] },
    { n: '藍寶石戒指', imp: ['resCold', 12] },
    { n: '黃玉戒指', imp: ['resLight', 12] },
    { n: '鐵戒指', imp: ['flatPhys', 2] }
  ],
  amulet: [
    { n: '琥珀護身符', imp: ['life', 20] },
    { n: '翡翠護身符', imp: ['critPct', 2] },
    { n: '青金護身符', imp: ['mana', 15] }
  ],
  belt: [
    { n: '皮腰帶', imp: ['life', 15] },
    { n: '重腰帶', arm: 0.6 },
    { n: '鏈腰帶', imp: ['regen', 2] }
  ],
  /* 副手：k 是副手種類，詞綴可以只開放給某一種（例如誘引只出現在提燈） */
  offhand: [
    { n: '提燈', k: 'lantern', imp: ['vision', 30], lure: 20 },
    { n: '聖光提燈', k: 'lantern', imp: ['vision', 45], lure: 35 },
    { n: '木盾', k: 'shield', arm: 1.4 },
    { n: '塔盾', k: 'shield', arm: 2.2 },
    { n: '符文法珠', k: 'focus', imp: ['spellPct', 15] }
  ]
};
const DROPS = ['weapon', 'offhand', 'helm', 'chest', 'gloves', 'boots', 'belt', 'ring', 'amulet'];
const T5 = (a, b, c, d, e) => [
  [40, ...a],
  [28, ...b],
  [18, ...c],
  [8, ...d],
  [1, ...e]
];
const ARMOR = ['helm', 'chest', 'gloves', 'boots', 'belt', 'shield'],
  JEW = ['ring', 'amulet', 'offhand'];
const AFF = [
  {
    id: 'physPct',
    t: 'P',
    n: '鋒利',
    slots: ['weapon'],
    tiers: T5([60, 79], [45, 59], [30, 44], [18, 29], [8, 17]),
    f: v => `物理傷害 +${v}%`
  },
  {
    id: 'flatPhys',
    t: 'P',
    n: '沉重',
    slots: ['weapon', 'gloves', 'ring'],
    tiers: T5([12, 16], [8, 11], [5, 7], [3, 4], [1, 2]),
    f: v => `附加 ${v} 物理傷害`
  },
  {
    id: 'addFire',
    t: 'P',
    n: '灼熱',
    slots: ['weapon', 'gloves', 'ring', 'amulet'],
    tiers: T5([18, 24], [12, 17], [8, 11], [4, 7], [2, 3]),
    f: v => `附加 ${v} 火焰傷害`
  },
  {
    id: 'addCold',
    t: 'P',
    n: '冰冷',
    slots: ['weapon', 'gloves', 'ring', 'amulet'],
    tiers: T5([16, 22], [11, 15], [7, 10], [4, 6], [2, 3]),
    f: v => `附加 ${v} 冰冷傷害`
  },
  {
    id: 'addLight',
    t: 'P',
    n: '雷鳴',
    slots: ['weapon', 'gloves', 'ring', 'amulet'],
    tiers: T5([10, 30], [7, 21], [4, 14], [2, 8], [1, 4]),
    f: v => `附加 ${v} 閃電傷害`
  },
  {
    id: 'spellPct',
    t: 'P',
    n: '博學',
    slots: ['weapon', 'amulet', 'ring', 'helm', 'focus'],
    tiers: T5([50, 64], [36, 49], [24, 35], [14, 23], [6, 13]),
    f: v => `法術傷害 +${v}%`
  },
  {
    id: 'life',
    t: 'P',
    n: '健壯',
    slots: [...ARMOR, ...JEW],
    tiers: T5([70, 89], [50, 69], [35, 49], [20, 34], [8, 19]),
    f: v => `最大生命 +${v}`
  },
  {
    id: 'armor',
    t: 'P',
    n: '堅固',
    slots: ARMOR,
    tiers: T5([80, 110], [55, 79], [35, 54], [20, 34], [8, 19]),
    f: v => `護甲 +${v}`
  },
  {
    id: 'mana',
    t: 'P',
    n: '睿智',
    slots: ['helm', 'ring', 'amulet', 'belt', 'focus'],
    tiers: T5([40, 50], [30, 39], [20, 29], [12, 19], [5, 11]),
    f: v => `最大魔力 +${v}`
  },
  {
    id: 'resFire',
    t: 'S',
    n: '抗火',
    slots: [...ARMOR, ...JEW],
    tiers: T5([36, 45], [28, 35], [20, 27], [12, 19], [6, 11]),
    f: v => `火焰抗性 +${v}%`
  },
  {
    id: 'resCold',
    t: 'S',
    n: '抗寒',
    slots: [...ARMOR, ...JEW],
    tiers: T5([36, 45], [28, 35], [20, 27], [12, 19], [6, 11]),
    f: v => `冰冷抗性 +${v}%`
  },
  {
    id: 'resLight',
    t: 'S',
    n: '抗雷',
    slots: [...ARMOR, ...JEW],
    tiers: T5([36, 45], [28, 35], [20, 27], [12, 19], [6, 11]),
    f: v => `閃電抗性 +${v}%`
  },
  {
    id: 'critPct',
    t: 'S',
    n: '精準',
    slots: ['weapon', 'ring', 'amulet', 'helm'],
    tiers: T5([6, 7], [5, 5], [4, 4], [3, 3], [1, 2]),
    f: v => `暴擊率 +${v}%`
  },
  {
    id: 'critMulti',
    t: 'S',
    n: '暴虐',
    slots: ['weapon', 'amulet', 'gloves'],
    tiers: T5([32, 38], [25, 31], [18, 24], [12, 17], [6, 11]),
    f: v => `暴擊傷害 +${v}%`
  },
  {
    id: 'leech',
    t: 'S',
    n: '吸血',
    slots: ['weapon', 'gloves', 'ring'],
    tiers: T5([5, 6], [4, 4], [3, 3], [2, 2], [1, 1]),
    f: v => `傷害的 ${v}% 轉為生命`
  },
  {
    id: 'speed',
    t: 'S',
    n: '迅捷',
    slots: ['boots', 'gloves', 'amulet'],
    tiers: T5([10, 12], [8, 9], [6, 7], [4, 5], [2, 3]),
    f: v => `速度 +${v}`
  },
  {
    id: 'vision',
    t: 'S',
    n: '遠見',
    slots: ['helm', 'lantern', 'amulet'],
    tiers: T5([26, 30], [20, 25], [14, 19], [9, 13], [4, 8]),
    f: v => `視線範圍 +${v}%`
  },
  {
    id: 'lure',
    t: 'P',
    n: '誘引',
    slots: ['lantern'],
    tiers: T5([36, 45], [28, 35], [20, 27], [12, 19], [6, 11]),
    f: v => `吸引的怪物 +${v}%`
  },
  {
    id: 'regen',
    t: 'S',
    n: '再生',
    slots: ['chest', 'helm', 'amulet', 'ring', 'belt'],
    tiers: T5([10, 13], [7, 9], [5, 6], [3, 4], [1, 2]),
    f: v => `每回合回復 ${v} 生命`
  }
];
const AFFI = Object.fromEntries(AFF.map(a => [a.id, a]));
const STATN = {
  life: v => `最大生命 +${v}`,
  lifePct: v => `最大生命 +${v}%`,
  physPct: v => `物理傷害 +${v}%`,
  flatPhys: v => `附加 ${v} 物理傷害`,
  armor: v => `護甲 +${v}`,
  armorPct: v => `護甲 +${v}%`,
  critPct: v => `暴擊率 +${v}%`,
  critMulti: v => `暴擊傷害 ${v > 0 ? '+' : ''}${v}%`,
  speed: v => `速度 ${v > 0 ? '+' : ''}${v}`,
  leech: v => `傷害的 ${v}% 轉為生命`,
  spellPct: v => `法術傷害 +${v}%`,
  elePct: v => `元素傷害 +${v}%`,
  mana: v => `最大魔力 +${v}`,
  regen: v => `每回合回復 ${v} 生命`,
  resAll: v => `全部抗性 +${v}%`,
  physMore: v => `物理傷害 ${v}%（總乘）`,
  resFire: v => `火焰抗性 +${v}%`,
  vision: v => `視線範圍 +${v}%`,
  lure: v => `吸引的怪物 +${v}%`,
  resCold: v => `冰冷抗性 +${v}%`,
  resLight: v => `閃電抗性 +${v}%`,
  addFire: v => `附加 ${v} 火焰傷害`
};
const sg = v => (v > 0 ? '+' + v : String(v));
Object.assign(STATN, {
  swordPct: v => `持劍時物理傷害 +${v}%`,
  swordCrit: v => `持劍時暴擊率 +${v}%`,
  axePct: v => `持斧時物理傷害 +${v}%`,
  axeCm: v => `持斧時暴擊傷害 +${v}%`,
  bowPct: v => `持弓時物理傷害 +${v}%`,
  bowCrit: v => `持弓時暴擊率 +${v}%`,
  staffPct: v => `持法杖時法術傷害 +${v}%`,
  staffMana: v => `持法杖時最大魔力 +${v}`,
  shieldArm: v => `裝備盾牌時護甲 +${v}%`,
  shieldRes: v => `裝備盾牌時全部抗性 +${v}%`,
  focusPct: v => `裝備法珠時法術傷害 +${v}%`,
  dmgRed: v => `受到的傷害 -${v}%`,
  taunt: v => `嘲諷：組隊時怪物攻擊你的機率 +${v}%`,
  healAll: v => `治癒技能同時替其他隊友回復 ${v}% 的量`,
  allyDmg: v => `組隊時每位活著的隊友，傷害 +${v}%`,
  engPct: v => `技能石每條刻印詞綴，該技能傷害 +${v}%`,
  addCold: v => `附加 ${v} 冰冷傷害`,
  addLight: v => `附加 ${v} 閃電傷害`,
  dmgMore: v => `傷害 ${sg(v)}%（總乘）`,
  lifeMore: v => `最大生命 ${sg(v)}%（總乘）`,
  armorMore: v => `護甲 ${sg(v)}%（總乘）`,
  firePct: v => `火焰傷害 +${v}%`,
  coldPct: v => `冰冷傷害 +${v}%`,
  lightPct: v => `閃電傷害 +${v}%`,
  poisonPct: v => `中毒傷害 +${v}%`,
  poisonCh: v => `攻擊有 ${v}% 機率使敵人中毒`,
  ail: v => `燃燒、凍結、感電機率 +${v}%`,
  dbl: v => `攻擊有 ${v}% 機率多打一下`,
  mpCost: v => `技能消耗 -${v}%`,
  healPct: v => `治癒與藥水效果 +${v}%`,
  goldPct: v => `金幣獲得 +${v}%`,
  manaRegen: v => `每回合回復 ${v} 魔力`,
  evade: v => `閃避率 +${v}%`,
  dodgeCap: v => `閃避上限 +${v}%`,
  conv: v => `${v}% 物理傷害轉換為火焰傷害`,
  noCrit: () => '無法暴擊',
  blood: () => '技能改為消耗生命，不再消耗魔力',
  mom: v => `受到傷害的 ${v}% 改由魔力承受`,
  lowLife: v => `生命低於一半時，傷害 +${v}%（總乘）`,
  vaal: () => '吸血效果加倍，但每回合不再回復生命',
  ironReflex: () => '無法閃避，原本每 1% 閃避轉為 +3% 護甲',
  noFreeze: () => '無法被凍結',
  noDodge: () => '無法閃避'
});
const CUR = [
  { id: 'trans', n: '蛻變石', d: '普通 → 魔法，1 個詞綴', c: '#8fb7ff', w: 30 },
  { id: 'aug', n: '增幅石', d: '魔法裝備未滿時加 1 個詞綴', c: '#a8d8ff', w: 26 },
  { id: 'regal', n: '富豪石', d: '魔法 → 稀有，保留原詞綴再加 1 個', c: '#7fd6c2', w: 14 },
  { id: 'alch', n: '點金石', d: '普通 → 稀有，4 個詞綴', c: '#f2c14e', w: 8 },
  { id: 'chaos', n: '混沌石', d: '稀有裝備隨機移除 1 個詞綴，再加 1 個', c: '#e58a3a', w: 7 },
  { id: 'exalt', n: '崇高石', d: '稀有裝備未滿時加 1 個詞綴', c: '#fff2b0', w: 1.2 }
];
const CURI = Object.fromEntries(CUR.map(c => [c.id, c]));
/* 天賦樹：PoE 式大輪盤。中央冒險者、內圈三職業起點，往外 15 條輻射路線（每 24° 一條），
   每條路線兩側各有兩個節點群（含重要節點），盡頭是改變玩法的基石；中圈、外圈環狀連結讓路線可以互相轉換 */
const TH = {
  life: {
    s: ['體魄', { life: 10 }, 'heart'],
    n: [
      ['巨人之血', { lifePct: 10, life: 20 }, 'heart'],
      ['生生不息', { regen: 3, lifePct: 5 }, 'heart'],
      ['鋼筋鐵骨', { life: 30, armorPct: 10 }, 'heart'],
      ['不滅之心', { lifePct: 12, resAll: 4 }, 'heart'],
      ['戰神之軀', { lifePct: 15 }, 'heart'],
      ['泰坦', { life: 40 }, 'heart']
    ]
  },
  armor: {
    s: ['鋼甲', { armorPct: 12 }, 'shield'],
    n: [
      ['鋼鐵之軀', { armorPct: 30, armor: 30 }, 'shield'],
      ['不動如山', { armorPct: 20, lifePct: 5 }, 'shield'],
      ['堡壘', { armor: 60, resAll: 4 }, 'shield'],
      ['重裝步兵', { armorPct: 25, physPct: 8 }, 'shield'],
      ['盾牆', { armorPct: 35 }, 'shield']
    ]
  },
  phys: {
    s: ['力道', { physPct: 8 }, 'sword'],
    n: [
      ['重擊', { physPct: 20, critMulti: 10 }, 'sword'],
      ['碎骨', { physPct: 16, flatPhys: 3 }, 'sword'],
      ['武器大師', { physPct: 15, dbl: 5 }, 'sword'],
      ['屠夫', { physPct: 22, life: 15 }, 'sword'],
      ['破甲', { physPct: 18, flatPhys: 2 }, 'sword']
    ]
  },
  regen: {
    s: ['堅韌', { regen: 1 }, 'plus'],
    n: [
      ['堅毅不拔', { life: 30, regen: 3 }, 'plus'],
      ['再生之軀', { regen: 4 }, 'plus'],
      ['戰地醫護', { healPct: 25, regen: 2 }, 'plus']
    ]
  },
  crit: {
    s: ['敏銳', { critPct: 1 }, 'target'],
    n: [
      ['獵手直覺', { critPct: 2, critMulti: 15 }, 'target'],
      ['精準打擊', { critPct: 3 }, 'target'],
      ['弱點洞察', { critPct: 2, physPct: 10 }, 'target'],
      ['刺客印記', { critPct: 2, critMulti: 10, dbl: 3 }, 'target'],
      ['冷血', { critPct: 3, critMulti: 5 }, 'target']
    ]
  },
  cmul: {
    s: ['殘暴', { critMulti: 8 }, 'skull'],
    n: [
      ['致命一擊', { critMulti: 25 }, 'skull'],
      ['處決者', { critMulti: 20, physPct: 10 }, 'skull'],
      ['刺客之道', { critMulti: 20, critPct: 1 }, 'skull'],
      ['殘酷', { critMulti: 30 }, 'skull']
    ]
  },
  speed: {
    s: ['輕盈', { speed: 2 }, 'boot'],
    n: [
      ['疾風', { speed: 5, evade: 3 }, 'boot'],
      ['先發制人', { speed: 4, critPct: 1 }, 'boot'],
      ['游擊戰術', { speed: 3, leech: 1, life: 15 }, 'boot'],
      ['風行者', { speed: 4, vision: 10 }, 'boot']
    ]
  },
  evade: {
    s: ['閃避', { evade: 2 }, 'wind'],
    n: [
      ['殘影', { evade: 5, speed: 2 }, 'wind'],
      ['身輕如燕', { evade: 4, critPct: 1 }, 'wind'],
      ['幻影步', { evade: 6 }, 'wind'],
      ['反擊姿態', { evade: 3, physPct: 10 }, 'wind']
    ]
  },
  leech: {
    s: ['渴血', { leech: 1 }, 'blood'],
    n: [
      ['嗜血', { leech: 2, critMulti: 10 }, 'blood'],
      ['血之盛宴', { leech: 2, life: 20 }, 'blood'],
      ['血刃', { leech: 1, physPct: 15 }, 'blood'],
      ['吸血鬼之觸', { leech: 3 }, 'blood'],
      ['血祭', { leech: 2, physPct: 8 }, 'blood'],
      ['血族', { leech: 2, lifePct: 5 }, 'blood']
    ]
  },
  spell: {
    s: ['博學', { spellPct: 8 }, 'book'],
    n: [
      ['秘術專注', { spellPct: 15, critPct: 1 }, 'book'],
      ['奧術學者', { spellPct: 20 }, 'book'],
      ['咒語編織', { spellPct: 12, mpCost: 10 }, 'book'],
      ['法術大師', { spellPct: 15, mana: 15 }, 'book']
    ]
  },
  mana: {
    s: ['冥想', { mana: 8 }, 'mana'],
    n: [
      ['魔力奔流', { mana: 20, manaRegen: 2 }, 'mana'],
      ['清明心智', { mana: 15, mpCost: 10 }, 'mana'],
      ['智慧泉源', { manaRegen: 3 }, 'mana'],
      ['秘法之海', { mana: 30 }, 'mana'],
      ['節能施法', { mpCost: 15 }, 'mana']
    ]
  },
  res: {
    s: ['護符', { resAll: 4 }, 'prism'],
    n: [
      ['元素護符', { resAll: 12 }, 'prism'],
      ['聖騎士之心', { lifePct: 8, resAll: 8 }, 'prism'],
      ['淨化', { resAll: 10, regen: 1 }, 'prism'],
      ['風暴屏障', { resLight: 20, resCold: 10 }, 'prism'],
      ['火焰庇護', { resFire: 20, resAll: 4 }, 'prism']
    ]
  },
  ele: {
    s: ['元素', { elePct: 6 }, 'prism'],
    n: [
      ['元素掌握', { elePct: 15, spellPct: 8 }, 'prism'],
      ['元素鋒芒', { elePct: 10, critMulti: 10 }, 'prism'],
      ['元素專精', { elePct: 16 }, 'prism']
    ]
  },
  fire: {
    s: ['灼熱', { firePct: 10 }, 'flame'],
    n: [
      ['烈焰之心', { firePct: 25 }, 'flame'],
      ['焚燒', { firePct: 15, ail: 20 }, 'flame'],
      ['火焰附魔', { addFire: 6, firePct: 10 }, 'flame'],
      ['熔岩護甲', { firePct: 12, armorPct: 12 }, 'flame'],
      ['燎原', { firePct: 20, elePct: 5 }, 'flame']
    ]
  },
  cold: {
    s: ['寒霜', { coldPct: 10 }, 'ice'],
    n: [
      ['冰霜之心', { coldPct: 25 }, 'ice'],
      ['冰封', { coldPct: 15, ail: 20 }, 'ice'],
      ['冰冷附魔', { addCold: 5, coldPct: 10 }, 'ice'],
      ['冰晶護盾', { coldPct: 12, resAll: 6 }, 'ice'],
      ['永凍', { coldPct: 20, elePct: 5 }, 'ice']
    ]
  },
  light: {
    s: ['雷霆', { lightPct: 10 }, 'bolt'],
    n: [
      ['雷霆之心', { lightPct: 25 }, 'bolt'],
      ['電流', { lightPct: 15, ail: 20 }, 'bolt'],
      ['雷鳴附魔', { addLight: 7, lightPct: 10 }, 'bolt'],
      ['風暴術士', { lightPct: 15, speed: 2 }, 'bolt'],
      ['連鎖閃電', { lightPct: 20, elePct: 5 }, 'bolt']
    ]
  },
  poison: {
    s: ['毒素', { poisonPct: 10 }, 'leaf'],
    n: [
      ['劇毒', { poisonPct: 25, poisonCh: 8 }, 'leaf'],
      ['毒刃', { poisonCh: 12, physPct: 8 }, 'leaf'],
      ['瘴氣', { poisonPct: 30 }, 'leaf'],
      ['致命毒素', { poisonPct: 15, critPct: 1 }, 'leaf']
    ]
  },
  ail: {
    s: ['異常', { ail: 10 }, 'skull'],
    n: [
      ['元素災厄', { ail: 30 }, 'skull'],
      ['凍傷', { ail: 20, coldPct: 10 }, 'skull'],
      ['感電蔓延', { ail: 20, lightPct: 10 }, 'skull'],
      ['餘燼', { ail: 20, firePct: 10 }, 'skull']
    ]
  },
  dbl: {
    s: ['連擊', { dbl: 3 }, 'twin'],
    n: [
      ['疾風連斬', { dbl: 8 }, 'twin'],
      ['劍舞', { dbl: 5, speed: 2 }, 'twin'],
      ['箭雨', { dbl: 6, critPct: 1 }, 'twin'],
      ['亂舞', { dbl: 6, physPct: 8 }, 'twin'],
      ['追擊', { dbl: 5, critMulti: 10 }, 'twin']
    ]
  },
  heal: {
    s: ['治癒', { healPct: 8 }, 'plus'],
    n: [
      ['生命之泉', { healPct: 25 }, 'plus'],
      ['急救', { healPct: 15, regen: 2 }, 'plus']
    ]
  },
  gold: {
    s: ['尋寶', { goldPct: 6 }, 'coin'],
    n: [
      ['財富', { goldPct: 20 }, 'coin'],
      ['拾荒者', { goldPct: 15, vision: 8 }, 'coin'],
      ['黃金獵人', { goldPct: 12, critPct: 1 }, 'coin']
    ]
  },
  vision: {
    s: ['遠見', { vision: 6 }, 'lantern'],
    n: [
      ['鷹眼', { vision: 20, critPct: 1 }, 'lantern'],
      ['夜行者', { vision: 15, evade: 2 }, 'lantern']
    ]
  },
  /* 0.2.4 外圈：武器專精（只在拿著該武器時生效）與組隊、技能石相關 */
  sword: {
    s: ['劍術', { swordPct: 8 }, 'sword'],
    n: [
      ['劍聖', { swordPct: 20, swordCrit: 2 }, 'sword'],
      ['疾風劍', { swordPct: 14, dbl: 4 }, 'sword'],
      ['斬鐵', { swordPct: 18, flatPhys: 3 }, 'sword']
    ]
  },
  axe: {
    s: ['斧技', { axePct: 8 }, 'axe'],
    n: [
      ['伐木者', { axePct: 20, axeCm: 15 }, 'axe'],
      ['斷頭台', { axePct: 16, axeCm: 25 }, 'axe'],
      ['蠻力', { axePct: 15, life: 25 }, 'axe']
    ]
  },
  bow: {
    s: ['弓術', { bowPct: 8 }, 'bow'],
    n: [
      ['神射手', { bowPct: 18, bowCrit: 2 }, 'bow'],
      ['連珠箭', { bowPct: 12, dbl: 6 }, 'bow'],
      ['穿楊', { bowPct: 20, critMulti: 10 }, 'bow']
    ]
  },
  staff: {
    s: ['杖術', { staffPct: 10 }, 'staff'],
    n: [
      ['大法師之杖', { staffPct: 25, staffMana: 15 }, 'staff'],
      ['秘法共鳴', { staffPct: 18, ail: 15 }, 'staff'],
      ['杖心', { staffPct: 15, mpCost: 6 }, 'staff']
    ]
  },
  shield: {
    s: ['盾術', { shieldArm: 15 }, 'shield'],
    n: [
      ['銅牆', { shieldArm: 40, shieldRes: 6 }, 'shield'],
      ['反擊之盾', { shieldArm: 25, life: 30 }, 'shield'],
      ['神聖壁壘', { shieldRes: 10, dmgRed: 4 }, 'shield']
    ]
  },
  focus: {
    s: ['法器', { focusPct: 10 }, 'orb'],
    n: [
      ['法珠共鳴', { focusPct: 25, mana: 15 }, 'orb'],
      ['靈能導管', { focusPct: 15, mpCost: 8 }, 'orb'],
      ['星辰法器', { focusPct: 20, critPct: 1 }, 'orb']
    ]
  },
  guard: {
    s: ['守護', { dmgRed: 1 }, 'shield'],
    n: [
      ['挑釁', { taunt: 50, dmgRed: 3 }, 'taunt'],
      ['不動之盾', { dmgRed: 5, armorPct: 15 }, 'shield'],
      ['替身', { taunt: 40, life: 40 }, 'taunt'],
      ['堅守陣線', { dmgRed: 4, lifePct: 6 }, 'shield']
    ]
  },
  support: {
    s: ['祝福', { healPct: 6 }, 'plus'],
    n: [
      ['群體治癒', { healAll: 30, healPct: 10 }, 'plus'],
      ['聖光', { healAll: 20, regen: 3 }, 'plus'],
      ['靈魂連結', { healPct: 20, manaRegen: 2 }, 'mana'],
      ['守護天使', { healAll: 25, dmgRed: 2 }, 'plus']
    ]
  },
  tactic: {
    s: ['戰術', { allyDmg: 2 }, 'twin'],
    n: [
      ['協同作戰', { allyDmg: 6, critPct: 1 }, 'twin'],
      ['圍獵', { allyDmg: 5, dbl: 4 }, 'twin'],
      ['號令', { allyDmg: 8 }, 'taunt'],
      ['戰場指揮', { allyDmg: 5, dmgRed: 2 }, 'twin']
    ]
  },
  gem: {
    s: ['刻印', { engPct: 1 }, 'gem'],
    n: [
      ['符文之心', { engPct: 5 }, 'gem'],
      ['技藝精通', { engPct: 3, mpCost: 6 }, 'gem'],
      ['石之共鳴', { engPct: 4, healPct: 8 }, 'gem'],
      ['刻印大師', { engPct: 4, critPct: 1 }, 'gem']
    ]
  }
};
/* 15 條路線：角度、路線上的小節點主題、四個節點群主題（第 2、4、6、8 格）、盡頭基石 */
const SPOKES = [
  {
    a: 126,
    k: 's',
    sm: ['phys', 'leech'],
    cl: ['phys', 'leech', 'dbl', 'cmul'],
    ks: ['狂戰之血', { lowLife: 40, lifeMore: -10 }, 'blood']
  },
  {
    a: 150,
    k: 's',
    sm: ['life', 'armor'],
    cl: ['life', 'armor', 'regen', 'life'],
    ks: ['不屈意志', { lifePct: 40, speed: -4 }, 'heart']
  },
  {
    a: 174,
    k: 's',
    sm: ['armor', 'res'],
    cl: ['armor', 'res', 'heal', 'armor'],
    ks: ['鋼鐵反射', { ironReflex: 1 }, 'shield']
  },
  {
    a: 198,
    k: 'si',
    sm: ['fire', 'armor'],
    cl: ['fire', 'armor', 'ele', 'fire'],
    ks: ['烈焰化身', { conv: 50, firePct: 20 }, 'flame']
  },
  {
    a: 222,
    k: 'si',
    sm: ['res', 'life'],
    cl: ['res', 'heal', 'regen', 'res'],
    ks: ['聖靈之軀', { noFreeze: 1, noDodge: 1, resAll: 10 }, 'prism']
  },
  {
    a: 246,
    k: 'i',
    sm: ['fire', 'spell'],
    cl: ['fire', 'spell', 'ail', 'life'],
    ks: ['血魔法', { blood: 1, lifePct: 20 }, 'blood']
  },
  {
    a: 270,
    k: 'i',
    sm: ['spell', 'ele'],
    cl: ['spell', 'ele', 'cold', 'light'],
    ks: ['元素親和', { resAll: 15, elePct: 30, physMore: -40 }, 'prism']
  },
  {
    a: 294,
    k: 'i',
    sm: ['mana', 'spell'],
    cl: ['mana', 'spell', 'cold', 'mana'],
    ks: ['心靈凌駕', { mom: 30, mana: 30 }, 'mana']
  },
  {
    a: 318,
    k: 'id',
    sm: ['light', 'crit'],
    cl: ['light', 'crit', 'ail', 'light'],
    ks: ['玻璃大砲', { dmgMore: 40, lifeMore: -30 }, 'skull']
  },
  {
    a: 342,
    k: 'id',
    sm: ['cold', 'speed'],
    cl: ['cold', 'evade', 'ail', 'cold'],
    ks: ['災厄使者', { ail: 100, dmgMore: -15 }, 'skull']
  },
  {
    a: 366,
    k: 'd',
    sm: ['crit', 'evade'],
    cl: ['crit', 'evade', 'vision', 'speed'],
    ks: ['雜技', { evade: 20, dodgeCap: 20, armorMore: -50 }, 'wind']
  },
  {
    a: 390,
    k: 'd',
    sm: ['crit', 'cmul'],
    cl: ['crit', 'cmul', 'dbl', 'speed'],
    ks: ['致命節奏', { critPct: 8, critMulti: -30 }, 'target']
  },
  {
    a: 414,
    k: 'd',
    sm: ['poison', 'speed'],
    cl: ['poison', 'dbl', 'poison', 'leech'],
    ks: ['瘟疫使者', { poisonCh: 30, poisonPct: 50, dmgMore: -15 }, 'leaf']
  },
  {
    a: 438,
    k: 'ds',
    sm: ['phys', 'crit'],
    cl: ['phys', 'dbl', 'cmul', 'gold'],
    ks: ['堅毅技巧', { noCrit: 1, dmgMore: 30 }, 'sword']
  },
  {
    a: 462,
    k: 'ds',
    sm: ['leech', 'life'],
    cl: ['leech', 'gold', 'life', 'leech'],
    ks: ['不朽魔血', { vaal: 1, leech: 2 }, 'blood']
  }
];
const TREE = (() => {
  const N = [],
    E = [],
    byId = {};
  const P = (r, a) => [r * Math.cos((a * Math.PI) / 180), r * Math.sin((a * Math.PI) / 180)];
  const add = (id, x, y, def, type, extra) => {
    const n = { id, x, y, n: def[0], st: def[1], ic: def[2], type, ...(extra || {}) };
    N.push(n);
    byId[id] = n;
    return id;
  };
  const ln = (a, b) => {
    if (a && b && a !== b) E.push([a, b]);
  };
  const used = {},
    notable = t => {
      const L = TH[t].n,
        i = (used[t] = used[t] || 0);
      used[t]++;
      return L[i % L.length];
    };
  const CLS = {
    knight: { a: 150, name: '戰士', st: { life: 20, armorPct: 10 }, ic: 'shield' },
    ranger: { a: 30, name: '遊俠', st: { critPct: 1, speed: 2 }, ic: 'target' },
    mage: { a: -90, name: '術士', st: { spellPct: 10, mana: 10 }, ic: 'book' }
  };
  const R0 = 125,
    RS = 210,
    STEP = 42;
  add('start_novice', 0, 0, ['冒險者之魂', { life: 8, physPct: 4, spellPct: 4 }, 'star'], 'start', { cls: 'novice' });
  const fork = {};
  for (const [c, v] of Object.entries(CLS)) {
    const [x, y] = P(R0, v.a);
    add('start_' + c, x, y, [v.name + '之魂', v.st, v.ic], 'start', { cls: c });
    const [fx, fy] = P(168, v.a),
      f = add('f_' + c, fx, fy, [...TH[{ knight: 'life', ranger: 'crit', mage: 'spell' }[c]].s], 'small');
    ln('start_' + c, f);
    fork[c] = f;
  }
  // 內圈弧線（職業起點之間）與中央輻條
  const arcs = {};
  [
    ['knight', 'mage', 210],
    ['mage', 'ranger', -30],
    ['ranger', 'knight', 90]
  ].forEach(([a, b, mid], hi) => {
    const A1 = CLS[a].a,
      A2 = A1 + (((CLS[b].a - A1 + 540) % 360) - 180),
      arc = [],
      h = ['si', 'id', 'ds'][hi];
    const pool = [TH[{ si: 'armor', id: 'crit', ds: 'phys' }[h]].s, TH[{ si: 'res', id: 'mana', ds: 'life' }[h]].s];
    for (let q = 0; q < 5; q++) {
      const t = (q + 1) / 6,
        [x, y] = P(R0, A1 + (A2 - A1) * t);
      arc.push(add(`r${h}${q}`, x, y, pool[q % 2], 'small'));
    }
    ln('start_' + a, arc[0]);
    ln(fork[a], arc[0]);
    for (let q = 0; q < 4; q++) ln(arc[q], arc[q + 1]);
    ln(arc[4], 'start_' + b);
    ln(arc[4], fork[b]);
    let pv = 'start_novice';
    for (let q = 0; q < 2; q++) {
      const [x, y] = P(42 + q * 40, mid);
      const id = add(`sp${h}${q}`, x, y, pool[(q + 1) % 2], 'small');
      ln(pv, id);
      pv = id;
    }
    ln(pv, arc[2]);
    arcs[h] = arc;
  });
  // 輻射路線
  const sp = SPOKES.map((s, j) => {
    const ids = [];
    for (let i = 0; i <= 10; i++) {
      const [x, y] = P(RS + i * STEP, s.a);
      ids.push(add(`p${j}_${i}`, x, y, TH[s.sm[i % 2]].s, 'small'));
      if (i) ln(ids[i - 1], ids[i]);
    }
    const [kx, ky] = P(RS + 10 * STEP + 52, s.a);
    add(`k${j}`, kx, ky, s.ks, 'key');
    ln(ids[10], `k${j}`);
    // 節點群：第 2、6 格在順時針側，第 4、8 格在逆時針側；外側兩群是 6 節點
    [
      [2, 1],
      [4, -1],
      [6, 1],
      [8, -1]
    ].forEach(([i, side], ci) => {
      const t = s.cl[ci],
        big = ci >= 2,
        n = big ? 6 : 5,
        rr = big ? 24 : 21,
        off = big ? 48 : 44;
      const a = (s.a * Math.PI) / 180,
        tx = -Math.sin(a) * side,
        ty = Math.cos(a) * side,
        [bx, by] = P(RS + i * STEP, s.a),
        cx = bx + tx * off,
        cy = by + ty * off;
      const base = Math.atan2(-ty, -tx),
        nb = big ? (ci === 3 ? [2, 4] : [3]) : [2],
        ring = [];
      for (let q = 0; q < n; q++) {
        const aa = base + (q / n) * Math.PI * 2,
          isN = nb.includes(q);
        ring.push(
          add(
            `c${j}_${ci}_${q}`,
            cx + rr * Math.cos(aa),
            cy + rr * Math.sin(aa),
            isN ? notable(t) : TH[t].s,
            isN ? 'notable' : 'small'
          )
        );
      }
      ln(ids[i], ring[0]);
      for (let q = 0; q < n; q++) ln(ring[q], ring[(q + 1) % n]);
    });
    return ids;
  });
  // 每條路線的起點
  for (const [c, v] of Object.entries(CLS))
    SPOKES.forEach((s, j) => {
      const d = ((((s.a - v.a) % 360) + 540) % 360) - 180;
      if (Math.abs(d) <= 24) ln(fork[c], sp[j][0]);
    });
  SPOKES.forEach((s, j) => {
    if (s.k.length === 2) {
      const arc = arcs[s.k],
        first = SPOKES.findIndex(q => q.k === s.k) === j;
      ln(first ? arc[1] : arc[3], sp[j][0]);
    }
  });
  /* 0.2.4 外圈：每條路線往外分出兩個 9 節點的專精群（左邊武器、右邊組隊），最外圈再把所有專精群接成一圈 */
  const WEP = [
      'axe',
      'sword',
      'shield',
      'shield',
      'focus',
      'staff',
      'staff',
      'focus',
      'focus',
      'bow',
      'bow',
      'sword',
      'bow',
      'axe',
      'sword'
    ],
    PTY = [
      'guard',
      'guard',
      'guard',
      'guard',
      'support',
      'support',
      'support',
      'support',
      'support',
      'tactic',
      'tactic',
      'tactic',
      'tactic',
      'tactic',
      'guard'
    ],
    CR = 840,
    CRAD = 38,
    RING = 960,
    outer = [];
  const angTo = (x, y, cx, cy) => Math.atan2(y - cy, x - cx);
  SPOKES.forEach((s, j) => {
    const pair = [];
    [
      [WEP[j], -8, 'w'],
      [PTY[j], 8, 'q']
    ].forEach(([t, da, tag]) => {
      const [cx, cy] = P(CR, s.a + da),
        [sx, sy] = P(RS + 9 * STEP, s.a),
        a0 = angTo(sx, sy, cx, cy),
        ex = cx + Math.cos(a0) * CRAD,
        ey = cy + Math.sin(a0) * CRAD;
      let prev = `p${j}_9`;
      for (let q = 1; q <= 3; q++) {
        const id = add(`${tag}${j}_p${q}`, sx + ((ex - sx) * q) / 4, sy + ((ey - sy) * q) / 4, TH[t].s, 'small');
        ln(prev, id);
        prev = id;
      }
      const ring = [];
      for (let q = 0; q < 9; q++) {
        const aa = a0 + (q / 9) * Math.PI * 2,
          isG = q === 5,
          isN = q === 2 || q === 7;
        ring.push(
          add(
            `${tag}${j}_${q}`,
            cx + CRAD * Math.cos(aa),
            cy + CRAD * Math.sin(aa),
            isG ? notable('gem') : isN ? notable(t) : TH[t].s,
            isG || isN ? 'notable' : 'small'
          )
        );
      }
      ln(prev, ring[0]);
      for (let q = 0; q < 9; q++) ln(ring[q], ring[(q + 1) % 9]);
      pair.push({ ring, cx, cy, a0 });
    });
    outer.push(pair);
  });
  /* 最外圈：找專精群裡最靠近目標點的節點接出去 */
  const nearest = (cl, x, y) =>
    cl.ring.reduce((b, id) =>
      Math.hypot(byId[id].x - x, byId[id].y - y) < Math.hypot(byId[b].x - x, byId[b].y - y) ? id : b
    );
  const chain = (from, to, angs, tag) => {
    const pts = angs.map(a => P(RING, a));
    let prev = nearest(from, ...pts[0]);
    pts.forEach(([x, y], q) => {
      const id = add(`${tag}_${q}`, x, y, TH.gem.s, 'small');
      ln(prev, id);
      prev = id;
    });
    ln(prev, nearest(to, ...pts[pts.length - 1]));
  };
  SPOKES.forEach((s, j) => {
    const [w, q] = outer[j],
      nw = outer[(j + 1) % SPOKES.length][0];
    chain(w, q, [s.a - 4, s.a, s.a + 4], `x${j}`);
    chain(q, nw, [s.a + 12], `y${j}`);
  });
  // 中圈（第 5 格）與外圈（第 9 格）把相鄰路線接起來
  for (let j = 0; j < SPOKES.length; j++) {
    const k = (j + 1) % SPOKES.length,
      a1 = SPOKES[j].a,
      a2 = a1 + 24;
    [
      [5, 'm'],
      [9, 'o']
    ].forEach(([i, tag]) => {
      let prev = sp[j][i];
      for (let q = 1; q <= 2; q++) {
        const [x, y] = P(RS + i * STEP, a1 + ((a2 - a1) * q) / 3),
          pool = q === 1 ? SPOKES[j].sm : SPOKES[k].sm;
        const id = add(`${tag}${j}_${q}`, x, y, TH[pool[q % 2]].s, 'small');
        ln(prev, id);
        prev = id;
      }
      ln(prev, sp[k][i]);
    });
  }
  return { N, E, byId };
})();
const VER = '0.2.6';
const START = { lat: 24.1372, lng: 120.6869, name: '台中車站' };
