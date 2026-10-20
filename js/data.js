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
/* 0.3.13 起天賦樹沒有出發點（從中間的契靈圓盤往外點），CLASSES 只剩角色主色與名稱（好友列表、組隊大廳）；
   舊的四個「之魂」用 clsOf 換成對應的名稱 */
const CLASSES = {
  warlord: { name: '鬥神', color: '#c94a4a' },
  guardian: { name: '守護者', color: '#d8a24a' },
  destiny: { name: '冒險者', color: '#a9a3b8' },
  necro: { name: '死靈師', color: '#7a5ad6' },
  elemental: { name: '元素使', color: '#5865d6' },
  taoist: { name: '道士', color: '#e8c860' },
  assassin: { name: '刺客', color: '#3a8a6a' },
  amazon: { name: '亞馬遜', color: '#3f9a52' }
};
const OLDCLS = { novice: 'destiny', knight: 'warlord', ranger: 'amazon', mage: 'elemental' };
const clsOf = k => CLASSES[k] || CLASSES[OLDCLS[k]] || CLASSES.destiny;
/* r 是技能的強度分組（0.3.11 起只用來排商店的需求等級，見 items.js 的 gemReq） */
const SKILLS = {
  attack: { name: '攻擊', mp: 0, kind: 'attack', mult: 1, icon: 'axe' },
  power: { name: '強力一擊', mp: 4, kind: 'attack', mult: 1.6, icon: 'sword', r: 3 },
  bash: { name: '盾擊', mp: 5, kind: 'attack', mult: 1.3, guard: 2, icon: 'shield', r: 3 },
  whirl: { name: '旋風斬', mp: 10, kind: 'attack', mult: 1.25, tg: 'all', bleed: 20, fx: 'whirl', icon: 'sword', r: 4 },
  fire: { name: '火球術', mp: 5, kind: 'spell', el: 'fire', mult: 2, fx: 'fire', icon: 'flame', r: 3 },
  ice: { name: '冰矛', mp: 8, kind: 'spell', el: 'cold', mult: 1.7, fx: 'ice', freeze: 0.3, icon: 'ice', r: 4 },
  heal: { name: '治癒', mp: 6, kind: 'heal', icon: 'heart', r: 3 },
  double: { name: '連射', mp: 6, kind: 'attack', mult: 1.05, hits: 2, fx: 'arrow', icon: 'arrow', r: 3 },
  poison: { name: '毒箭', mp: 5, kind: 'attack', mult: 1.1, poison: 3, fx: 'arrow', icon: 'leaf', r: 3 },
  bolt: { name: '落雷', mp: 7, kind: 'spell', el: 'light', mult: 2.1, fx: 'bolt', icon: 'bolt', r: 4 },
  pierce: { name: '穿雲箭', mp: 8, kind: 'attack', mult: 1.9, fx: 'arrow', icon: 'arrow', r: 4 },
  meteor: { name: '隕石術', mp: 16, kind: 'spell', el: 'fire', mult: 2.1, tg: 'all', fx: 'fire', icon: 'flame', r: 5 },
  blizzard: {
    name: '暴風雪',
    mp: 14,
    kind: 'spell',
    el: 'cold',
    mult: 1.8,
    tg: 'all',
    fx: 'ice',
    freeze: 0.4,
    icon: 'ice',
    r: 5
  },
  cleave: { name: '裂地斬', mp: 14, kind: 'attack', mult: 1.7, tg: 'all', fx: 'whirl', icon: 'axe', r: 5 },
  sanct: { name: '聖域', mp: 14, kind: 'heal', heal: 0.6, healAll: 40, icon: 'heart', r: 5 }
};
/* 技能石：等級上限 30；0.3.20 起有 2～5 個輔助插槽（刻印石系列開槽） */
const GEM_MAX = 30;
/* 0.3.11：技能石在城鎮商店購買，用擊殺怪物得到的靈魂升級（取代粉塵）；祈願每抽 1 個祈願石 */
const GEM_DRAW = 1;
const soulNeed = lv => Math.round(8 * Math.pow(lv, 1.5));
/* 0.3.20：技能石的刻印詞綴拿掉，改成輔助寶石（skills.js 的 SUPG） */
/* 技能石專用通貨（存在 S.cur，但不列在裝備製作） */
const GCUR = [
  { id: 'soul', n: '靈魂', d: '擊殺怪物得到，用來替技能石升級', c: '#b7a6ff' },
  { id: 'wish', n: '祈願石', d: `契靈祈願用，每抽 ${GEM_DRAW} 個`, c: '#ffd66a' },
  { id: 'eng', n: '刻印石', d: '技能石的插槽從 2 格開到 3 格', c: '#9fd4ef' },
  { id: 'engX', n: '崇高刻印石', d: '技能石的插槽從 3 格開到 4 格', c: '#fff2b0' },
  { id: 'engD', n: '神聖刻印石', d: '技能石的插槽從 4 格開到 5 格', c: '#ffe27a' },
  { id: 'engC', n: '混沌刻印石', d: '技能石的插槽數重骰（2～5 格，變少時多的輔助寶石退回）', c: '#e58a3a' },
  { id: 'prism', n: '寶石稜鏡', d: '技能石品質 +1～5%（最多 20%，越高加越少）；野外機制的獎勵', c: '#ff8fd8' },
  { id: 'vaal', n: '冥府之血', d: '腐化 Lv30 技能石：超限、品質超限、擴槽、沒變化或毀滅', c: '#ff3a5a' }
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
  { id: 'swift', n: '迅捷', d: '速度大幅提升，更常輪到行動' },
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
  },
  sin: {
    n: '七宗罪挑戰',
    max: 1,
    floors: 3,
    lv: 3,
    mods: [0, 0],
    q: 60,
    r: 50,
    hp: 1.6,
    col: '#ff8a9a',
    pal: { x: '#4a2a3a', m: '#2a1020', r: '#ff3a5a' },
    desc: '七宗罪雕像的單人挑戰，最後一層是該宗罪的王。'
  },
  sinking: {
    n: '七宗罪之王',
    max: 4,
    floors: 8,
    lv: 5,
    mods: [0, 0],
    q: 150,
    r: 120,
    hp: 2.4,
    norevive: true,
    col: '#ff3a5a',
    pal: { x: '#3a0a1a', m: '#1a0510', r: '#ff3a5a' },
    desc: '集齊 7 種殘魂後挑戰。7 層依序是七宗罪的王，第 8 層是七宗罪之王。倒下不會復活。'
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
  { id: 'swift', n: '迅捷怪物', d: '怪物速度大幅提升，更常輪到行動', q: 10, r: 8, em: 'swift' },
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
  { n: '靈魂共鳴', d: '靈魂掉落加倍', soul: 2 },
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
  /* 武器：k 是外觀種類，t 是武器類別（技能標籤、昇華、天賦專精用），th 是雙手（不能裝副手）；新武器只能加在最後面（存檔用索引） */
  weapon: [
    { n: '短劍', k: 'sword', t: 'sword', phys: [3, 7], crit: 6 },
    { n: '長劍', k: 'sword', t: 'sword', phys: [5, 11], crit: 5 },
    { n: '戰斧', k: 'axe', t: 'axe', phys: [8, 15], crit: 4 },
    { n: '獵弓', k: 'bow', t: 'bow', th: 1, phys: [5, 12], crit: 6 },
    { n: '法杖', k: 'staff', t: 'staff', th: 1, phys: [2, 5], crit: 5, imp: ['spellPct', 24] },
    { n: '雙手大劍', k: 'gsword', t: 'sword', th: 1, phys: [9, 18], crit: 5 },
    { n: '巨斧', k: 'gaxe', t: 'axe', th: 1, phys: [11, 21], crit: 4 },
    { n: '巨鎚', k: 'gmace', t: 'axe', th: 1, phys: [12, 19], crit: 3, imp: ['stunCh', 8] },
    { n: '單手錘', k: 'mace', t: 'axe', phys: [6, 12], crit: 4, imp: ['stunCh', 4] },
    { n: '矛', k: 'spear', t: 'spear', th: 1, phys: [8, 16], crit: 6 },
    { n: '戟', k: 'halberd', t: 'spear', th: 1, phys: [10, 19], crit: 5 },
    { n: '長弓', k: 'lbow', t: 'bow', th: 1, phys: [7, 15], crit: 7 },
    { n: '弩', k: 'xbow', t: 'bow', th: 1, phys: [10, 17], crit: 6, imp: ['penRes', 8] },
    { n: '匕首', k: 'dagger', t: 'dagger', phys: [3, 7], crit: 9 },
    { n: '爪', k: 'claw', t: 'dagger', phys: [4, 8], crit: 7, imp: ['leech', 2] },
    { n: '權杖', k: 'scepter', t: 'staff', phys: [3, 6], crit: 5, imp: ['spellPct', 12] },
    { n: '桃木劍', k: 'peach', t: 'sword', phys: [4, 8], crit: 5, imp: ['spellPct', 10] }
  ],
  /* 防具與飾品一樣只能往後加（存檔用索引）；外觀與圖示在 gear.js */
  helm: [
    { n: '皮帽', arm: 1 },
    { n: '鐵盔', arm: 1.6 },
    { n: '兜帽', arm: 0.7, imp: ['mana', 15] },
    { n: '角盔', arm: 1.9 },
    { n: '王冠', arm: 0.8, imp: ['critPct', 2] }
  ],
  chest: [
    { n: '皮甲', arm: 2 },
    { n: '鎖子甲', arm: 3 },
    { n: '法袍', arm: 1.4, imp: ['spellPct', 10] },
    { n: '板甲', arm: 4 },
    { n: '鱗甲', arm: 3.4, imp: ['resAll', 5] }
  ],
  gloves: [
    { n: '皮手套', arm: 0.8 },
    { n: '鐵手甲', arm: 1.2 },
    { n: '法術手套', arm: 0.6, imp: ['spellPct', 6] },
    { n: '臂鎧', arm: 1.6 }
  ],
  boots: [
    { n: '皮靴', arm: 0.8, imp: ['speed', 2] },
    { n: '鐵靴', arm: 1.2 },
    { n: '法師鞋', arm: 0.6, imp: ['mana', 10] },
    { n: '戰靴', arm: 1.5, imp: ['life', 15] }
  ],
  ring: [
    { n: '紅寶石戒指', imp: ['resFire', 12] },
    { n: '藍寶石戒指', imp: ['resCold', 12] },
    { n: '黃玉戒指', imp: ['resLight', 12] },
    { n: '鐵戒指', imp: ['flatPhys', 2] },
    { n: '月石戒指', imp: ['mana', 12] }
  ],
  amulet: [
    { n: '琥珀護身符', imp: ['life', 20] },
    { n: '翡翠護身符', imp: ['critPct', 2] },
    { n: '青金護身符', imp: ['mana', 15] },
    { n: '骨護身符', imp: ['leech', 1] }
  ],
  belt: [
    { n: '皮腰帶', imp: ['life', 15] },
    { n: '重腰帶', arm: 0.6 },
    { n: '鏈腰帶', imp: ['regen', 2] },
    { n: '符文腰帶', imp: ['spellPct', 6] }
  ],
  /* 副手：k 是副手種類，詞綴可以只開放給某一種（例如誘引只出現在提燈） */
  offhand: [
    { n: '提燈', k: 'lantern', imp: ['vision', 30], lure: 20 },
    { n: '聖光提燈', k: 'lantern', imp: ['vision', 45], lure: 35 },
    { n: '木盾', k: 'shield', arm: 1.4 },
    { n: '塔盾', k: 'shield', arm: 2.2 },
    { n: '符文法珠', k: 'focus', imp: ['spellPct', 15] },
    { n: '月光法器', k: 'focus', imp: ['spellPct', 20] },
    { n: '符咒', k: 'talisman', imp: ['elePct', 14] }
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
  /* 0.3：新武器與昇華的機制 */
  echo: v => `技能 ${v}% 機率再放一次`,
  bleedCh: v => `命中有 ${v}% 機率使敵人流血`,
  stunCh: v => `命中有 ${v}% 機率使敵人暈眩`,
  exec: v => `對生命低於 35% 的敵人傷害 +${v}%`,
  penRes: v => `穿透 ${v}% 敵人抗性`,
  markFirst: v => `第一擊標記敵人，標記中的敵人受傷 +${v}%`,
  dodgeCrit: () => '閃避成功後，下一擊必定暴擊',
  counter: v => `閃避成功時反擊（普通攻擊 ${v}% 傷害）`,
  killStack: v => `每擊倒一隻敵人疊 1 層，每層傷害 +${v}%`,
  killMax: v => `疊層上限 ${v} 層`,
  keepStacks: () => '疊層在戰鬥結束後保留',
  killHeal: v => `擊倒敵人回復 ${v}% 生命`,
  killMana: v => `擊倒敵人回復 ${v}% 魔力`,
  noPotion: () => '無法使用生命藥水',
  hpDrain: v => `每回合失去 ${v}% 最大生命`,
  block: v => `${v}% 機率格擋（受到的傷害 -70%）`,
  reflectPct: v => `受到攻擊時反彈 ${v}% 傷害`,
  shieldPct: v => `戰鬥開始時獲得 ${v}% 最大生命的護盾`,
  extraTurn: v => `行動後 ${v}% 機率再行動一次`,
  curseCh: v => `命中有 ${v}% 機率詛咒敵人（3 回合）`,
  curseP: v => `詛咒中的敵人受傷 +${v}%`,
  spread: () => '敵人死亡時，身上的燃燒、中毒、流血擴散給其他敵人',
  petPct: v => `召喚物傷害 +${v}%`,
  potPct: v => `藥水效果 +${v}%`,
  potBomb: v => `喝藥水時對所有敵人丟藥瓶（物理傷害 ${v}% 的火焰）`,
  ailDur: v => `燃燒、中毒、流血、感電多持續 ${v} 回合`,
  dotPct: v => `持續傷害 +${v}%`,
  anyWep: () => '技能不再需要特定武器',
  petStart: v => `每場戰鬥開始時帶著 ${v} 隻野狼`,
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
  engPct: v => `技能石每插一顆輔助寶石，該技能傷害 +${v}%`,
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
  { id: 'exalt', n: '崇高石', d: '稀有裝備未滿時加 1 個詞綴', c: '#fff2b0', w: 1.2 },
  /* 0.3.1.9 品質通貨：普通 +5%、魔法 +2%、稀有 +1%，最多 20% */
  { id: 'whet', n: '磨刀石', d: '武器品質 +5%／+2%／+1%（普通／魔法／稀有，最多 20%）', c: '#c8ced6', w: 10 },
  { id: 'scrap', n: '護甲片', d: '防具品質 +5%／+2%／+1%（普通／魔法／稀有，最多 20%）', c: '#b8a07a', w: 10 }
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
  /* c 是弧線的圓心（世界座標，0.3.14）：有的話 tree.js 把這條連線畫成繞著圓心的弧 */
  const ln = (a, b, c) => {
    if (a && b && a !== b) E.push(c ? [a, b, c] : [a, b]);
  };
  const used = {},
    notable = t => {
      const L = TH[t].n,
        i = (used[t] = used[t] || 0);
      used[t]++;
      return L[i % L.length];
    };
  /* 0.3.13：中間是放契靈的圓盤（半徑 130 以內沒有天賦節點，tree.js 畫）。比照 PoE 沒有出發點：
     看不見的根節點 start 在圓心，接到每一條輻射路線的第一格，從圓盤旁邊的任何一條路線都可以開始點 */
  add('start', 0, 0, ['契靈圓盤', {}, 'star'], 'start');
  /* 0.3.14 每條路線各自不同（比照 PoE2，不追求每條一樣公平）：路線拆成內段（圓盤 → 中圈，半徑約 290～570）與外段
     （中圈 → 外圈 → 基石，約 570～880）。內段 6 種結構、外段 5 種結構，15 條路線的組合都不重複，奇偶路線左右鏡像。
     座標用路線自己的 (r, l)：r 是離圓心的距離、l 是橫向（右手邊為正），寬度大約只能用到 ±0.17r。
     小節點用路線的兩種小點屬性交錯；重要節點依序用 cl 的四個主題 */
  const sec = SPOKES.map((s, j) => {
    const th = (s.a * Math.PI) / 180,
      mir = j % 2 ? 1 : -1,
      W = (r, l) => [r * Math.cos(th) - l * mir * Math.sin(th), r * Math.sin(th) + l * mir * Math.cos(th)];
    let k = 0,
      si = 0,
      ni = 0;
    const sm = (r, l) => add(`t${j}_${k++}`, ...W(r, l), TH[s.sm[si++ % 2]].s, 'small'),
      nb = (r, l) => add(`t${j}_${k++}`, ...W(r, l), notable(s.cl[ni++ % 4]), 'notable'),
      /* 串成一條線：pts 是 [r, l, 'n'?]，回傳 id 陣列；from 是要接上的起點 */
      path = (from, pts) => {
        let prev = from;
        return pts.map(([r, l, n]) => {
          const id = n ? nb(r, l) : sm(r, l);
          ln(prev, id);
          prev = id;
          return id;
        });
      },
      /* 一圈：中心 (cr, cl)、半徑 rad、n 個點，第 0 個點朝 a0（弧度，0 是往外）；far 個離入口最遠的當重要節點 */
      loop = (from, cr, cl, rad, n, a0, far = 1) => {
        const ids = Array.from({ length: n }, (_, q) => {
          const t = a0 + (q / n) * 6.283,
            isN = far && Math.abs(q - n / 2) < far / 2 + 0.01;
          return (isN ? nb : sm)(cr + rad * Math.cos(t), cl + rad * Math.sin(t));
        });
        ids.forEach((id, q) => ln(id, ids[(q + 1) % n], W(cr, cl)));
        ln(from, ids[0]);
        return ids;
      },
      /* 沿著以 (cr, cl) 為圓心的弧串起來：第一段從 from 直線接上，之後畫成弧線 */
      arc = (from, cr, cl, pts) => {
        let prev = from;
        return pts.map(([r, l, n], q) => {
          const id = n ? nb(r, l) : sm(r, l);
          ln(prev, id, q ? W(cr, cl) : null);
          prev = id;
          return id;
        });
      };
    /* ---- 內段：entry（接圓盤）→ mid（中圈的連接點） ---- */
    const IN = [
      /* 大菱形框架：兩條邊夾著中間的脊，邊的轉角往內掛重要節點 */
      () => {
        const e = sm(290, 0),
          L = path(e, [
            [335, -30],
            [385, -62],
            [435, -90]
          ]),
          Rr = path(e, [
            [335, 30],
            [385, 62],
            [435, 90]
          ]),
          sp = path(e, [
            [340, 0],
            [390, 0],
            [440, 0, 1],
            [490, 0],
            [530, 0]
          ]),
          m = sm(570, 0);
        ln(
          path(L[2], [
            [490, -60],
            [535, -30]
          ])[1],
          m
        );
        ln(
          path(Rr[2], [
            [490, 60],
            [535, 30]
          ])[1],
          m
        );
        ln(sp[4], m);
        path(L[1], [[420, -40, 1]]);
        path(Rr[1], [[420, 40, 1]]);
        return [e, m];
      },
      /* 螺旋：入口旁邊捲進去，中心是重要節點；另一條路繞過去接中圈 */
      () => {
        const e = sm(290, 0),
          c = [440, 18],
          sp = [];
        let prev = sm(330, 15),
          t = Math.PI;
        ln(e, prev);
        /* 每一步沿著螺旋走約 34，越往中心半徑越小 */
        for (let q = 0; q < 8; q++) {
          const rad = 62 - q * 5.5,
            id = (q >= 6 ? nb : sm)(c[0] + rad * Math.cos(t), c[1] + rad * Math.sin(t));
          t += 34 / rad;
          ln(prev, id, q ? W(...c) : null);
          prev = id;
          sp.push(id);
        }
        const by = path(e, [
            [330, -42],
            [390, -70],
            [455, -74],
            [515, -50]
          ]),
          m = sm(570, 0);
        ln(by[3], m);
        ln(sp[3], m);
        return [e, m];
      },
      /* 輪軸：直線到中心，往四個方向伸出輻條，輻條末端是重要節點 */
      () => {
        const e = sm(290, 0),
          st = path(e, [
            [335, 0],
            [380, 0]
          ]),
          h = sm(430, 0);
        ln(st[1], h);
        [60, 120, 240, 300].forEach((d, q) => {
          const t = (d * Math.PI) / 180;
          path(h, [
            [430 + 45 * Math.cos(t), 45 * Math.sin(t)],
            [430 + 85 * Math.cos(t), 85 * Math.sin(t), q % 2 === 0]
          ]);
        });
        const out = path(h, [
            [478, 0],
            [524, 0]
          ]),
          m = sm(570, 0);
        ln(out[1], m);
        return [e, m];
      },
      /* 雙軌梯子：兩條平行的軌道，中間兩根橫檔，外側掛著重要節點 */
      () => {
        const e = sm(285, 0),
          rs = [320, 365, 410, 455, 500, 545],
          A = path(
            e,
            rs.map(r => [r, -42])
          ),
          Bz = path(
            e,
            rs.map(r => [r, 42])
          ),
          m = sm(570, 0);
        ln(A[1], Bz[1]);
        ln(A[4], Bz[4]);
        ln(A[5], m);
        ln(Bz[5], m);
        path(A[3], [[475, -82, 1]]);
        path(Bz[2], [[430, 78, 1]]);
        const c = nb(432, 0);
        ln(A[3], c);
        ln(Bz[3], c);
        return [e, m];
      },
      /* 分岔樹：一分三，左邊再分岔，葉子是重要節點，右邊接中圈 */
      () => {
        const e = sm(290, 0),
          f = path(e, [
            [340, 0],
            [385, 0]
          ])[1],
          Lb = path(f, [
            [425, -38],
            [465, -58]
          ]),
          Rb = path(f, [
            [425, 38],
            [465, 56]
          ]),
          m = sm(570, 0);
        path(f, [[435, 0, 1]]);
        path(Lb[1], [[505, -82, 1]]);
        path(Lb[1], [
          [515, -40],
          [550, -25, 1]
        ]);
        ln(path(Rb[1], [[520, 30]])[0], m);
        path(Rb[1], [[500, 84]]);
        return [e, m];
      },
      /* 花：莖往上，兩片花瓣是繞回來的小圈 */
      () => {
        const e = sm(290, 0),
          st = path(e, [
            [335, 0],
            [380, 0]
          ]),
          h = sm(425, 0);
        ln(st[1], h);
        [-55, 55].forEach(d => {
          const t = (d * Math.PI) / 180,
            P1 = [425 + 48 * Math.cos(t - 0.42), 48 * Math.sin(t - 0.42)],
            P2 = [425 + 88 * Math.cos(t), 88 * Math.sin(t)],
            P3 = [425 + 48 * Math.cos(t + 0.42), 48 * Math.sin(t + 0.42)],
            pc = [425 + 52 * Math.cos(t), 52 * Math.sin(t)],
            pe = arc(h, ...pc, [P1, [...P2, 1], P3]);
          ln(pe[2], h, W(...pc));
        });
        const up = path(h, [
            [470, 0],
            [515, 0, 1]
          ]),
          m = sm(570, 0);
        ln(up[1], m);
        return [e, m];
      },
      /* 沙漏：兩個三角形尖對尖，腰上是重要節點，上下三角形中間各一個重要節點 */
      () => {
        const e = sm(290, 0),
          w = nb(430, 0),
          m = sm(570, 0),
          lowN = nb(350, 0),
          upN = nb(510, 0);
        [-1, 1].forEach(sd => {
          const lo = path(e, [
            [322, 58 * sd],
            [376, 30 * sd]
          ]);
          ln(lo[1], w);
          ln(lo[0], lowN);
          const up = path(w, [
            [484, 30 * sd],
            [538, 58 * sd]
          ]);
          ln(up[1], m);
          ln(up[1], upN);
        });
        return [e, m];
      },
      /* 新月：一道大弧往旁邊掃過去，內側掛兩個重要節點 */
      () => {
        const e = sm(292, 0),
          c = [430, 70],
          cr = (t, rad = 150) => [c[0] + rad * Math.cos(t), c[1] + rad * Math.sin(t)],
          ar = arc(
            e,
            ...c,
            [-2.35, -2.02, -1.69, -1.36, -1.03, -0.7].map((t, q) => [...cr(t), q === 3])
          ),
          m = sm(570, 0);
        ln(ar[5], m, W(...c));
        /* 弧的內側掛兩個重要節點，外側一條短路 */
        path(ar[1], [[378, -22, 1]]);
        path(ar[4], [[500, -22, 1]]);
        path(e, [
          [340, 30],
          [392, 48]
        ]);
        return [e, m];
      }
    ];
    /* ---- 外段：mid → out（外圈的連接點，外圈專精群從這裡出去）→ 基石 ---- */
    const OUT = [
      /* 長路線，兩側各掛一個環 */
      m => {
        const pt = path(m, [
          [615, 0],
          [660, 0],
          [705, 0],
          [750, 0],
          [795, 0]
        ]);
        loop(pt[1], 680, -78, 30, 5, Math.PI / 2 + 0.6);
        loop(pt[2], 728, 80, 30, 6, -Math.PI / 2 - 0.4, 2);
        return pt[4];
      },
      /* 三角框架：兩條斜邊在外圈會合，底邊中間是重要節點 */
      m => {
        const Lf = path(m, [
            [620, -52],
            [675, -100]
          ]),
          Rf = path(m, [
            [620, 52],
            [675, 100]
          ]),
          base = path(Lf[1], [
            [680, -50],
            [685, 0, 1],
            [680, 50]
          ]),
          o = sm(800, 0);
        ln(base[2], Rf[1]);
        ln(path(Lf[1], [[740, -55]])[0], o);
        ln(path(Rf[1], [[740, 55]])[0], o);
        ln(path(base[1], [[742, 0, 1]])[0], o);
        return o;
      },
      /* 連環：一串大小不同的圈 */
      m => {
        const a = loop(m, 642, 0, 32, 4, Math.PI, 1),
          b = loop(a[2], 748, 0, 40, 6, Math.PI, 1),
          o = sm(830, 0);
        ln(b[3], o);
        return o;
      },
      /* 扇形：像昇華盤一樣從一點散開成四條弧，其中一條繼續往外 */
      m => {
        const h = sm(612, 0);
        ln(m, h);
        [-62, -30, 30, 62].forEach((d, q) => {
          const t = (d * Math.PI) / 180,
            pts = [45, 90, 135].map((dd, z) => {
              const tt = t + (d > 0 ? 1 : -1) * 0.1 * z;
              return [612 + dd * Math.cos(tt), dd * Math.sin(tt), z === 2 && q % 3 === 0];
            });
          path(h, pts);
        });
        const pt = path(h, [
          [662, 0],
          [712, 0],
          [762, 0, 1],
          [805, 0]
        ]);
        return pt[3];
      },
      /* 星形：中心掛滿四個方向的墜飾 */
      m => {
        const h = path(m, [
          [615, 0],
          [668, 0]
        ])[1];
        [55, 115, 245, 305].forEach((d, q) => {
          const t = (d * Math.PI) / 180;
          path(h, [
            [668 + 42 * Math.cos(t), 42 * Math.sin(t)],
            [668 + 80 * Math.cos(t), 80 * Math.sin(t), q === 1 || q === 2]
          ]);
        });
        const pt = path(h, [
          [722, 0],
          [770, 0, 1],
          [810, 0]
        ]);
        return pt[2];
      },
      /* 蝴蝶：身體是一條路，兩邊各一大一小的翅膀 */
      m => {
        const pt = path(m, [
          [620, 0],
          [670, 0],
          [720, 0],
          [770, 0],
          [815, 0]
        ]);
        loop(pt[0], 652, -68, 34, 6, Math.PI / 2 + 0.9, 1);
        loop(pt[0], 652, 68, 34, 6, -Math.PI / 2 - 0.9, 1);
        loop(pt[2], 742, -64, 24, 4, Math.PI / 2 + 0.6, 0);
        loop(pt[2], 742, 64, 24, 4, -Math.PI / 2 - 0.6, 0);
        return pt[4];
      },
      /* 皇冠：一條橫帶，往外伸出三根尖刺，中間那根接外圈 */
      m => {
        const c = sm(628, 0),
          band = [-92, -46, 46, 92].map(l => sm(650, l));
        ln(m, c);
        ln(c, band[1], [0, 0]);
        ln(c, band[2], [0, 0]);
        ln(band[0], band[1], [0, 0]);
        ln(band[2], band[3], [0, 0]);
        path(band[0], [[720, -96, 1]]);
        path(band[3], [[720, 96, 1]]);
        path(band[1], [[700, -50]]);
        path(band[2], [[700, 50]]);
        return path(c, [
          [690, 0],
          [748, 0, 1],
          [805, 0]
        ])[2];
      },
      /* 眼：上下兩道弧夾成一個眼睛，中間的瞳孔是一圈 */
      m => {
        const s0 = sm(612, 0),
          o = sm(818, 0);
        ln(m, s0);
        const tops = [-1, 1].map(sd => {
          const a = arc(s0, 715, -150 * sd, [
            [648, 52 * sd],
            [692, 74 * sd],
            [740, 74 * sd],
            [784, 50 * sd]
          ]);
          ln(a[3], o, W(715, -150 * sd));
          return a;
        });
        const iris = loop(tops[0][1], 716, 0, 28, 5, Math.PI / 2 + Math.PI, 1);
        ln(iris[2], tops[1][1]);
        return o;
      }
    ];
    /* 內段 8 種、外段 8 種，15 條路線的組合都不重複 */
    const [entry, mid] = IN[j % IN.length](),
      out = OUT[(j * 3 + (j >= 8 ? 1 : 2)) % OUT.length](mid),
      [kx, ky] = W(885, 0);
    add(`k${j}`, kx, ky, s.ks, 'key');
    ln(out, `k${j}`);
    return { entry, mid, out };
  });
  // 每條路線的入口都接到圓盤
  sec.forEach(q => ln('start', q.entry));
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
    CR = 1120,
    CRAD = 48,
    RING = 1280,
    outer = [];
  const angTo = (x, y, cx, cy) => Math.atan2(y - cy, x - cx);
  SPOKES.forEach((s, j) => {
    const pair = [];
    [
      [WEP[j], -7, 'w'],
      [PTY[j], 7, 'q']
    ].forEach(([t, da, tag]) => {
      const [cx, cy] = P(CR, s.a + da),
        sx = byId[sec[j].out].x,
        sy = byId[sec[j].out].y,
        a0 = angTo(sx, sy, cx, cy),
        ex = cx + Math.cos(a0) * CRAD,
        ey = cy + Math.sin(a0) * CRAD;
      let prev = sec[j].out;
      /* 0.3.14：先往旁邊彎出去再往外，才不會貼著路線最外面那格 */
      const r9 = Math.hypot(sx, sy),
        a9 = Math.atan2(sy, sx),
        re = Math.hypot(ex, ey),
        ae = Math.atan2(ey, ex),
        dA = ((ae - a9 + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
      for (let q = 1; q <= 3; q++) {
        const rr = r9 + ((re - r9) * q) / 4,
          aa = a9 + dA * Math.min(1, q / 2),
          id = add(`${tag}${j}_p${q}`, rr * Math.cos(aa), rr * Math.sin(aa), TH[t].s, 'small');
        ln(prev, id);
        prev = id;
      }
      /* 0.3.14：專精群輪流用三種形狀（9 個節點，第 0 個接進來）：環、輪（中心是刻印重要節點）、星（中心往外放射） */
      const form = (j + (tag === 'q' ? 1 : 0)) % 3,
        pos = q => {
          if (form === 0 || (form === 1 && q < 8)) {
            const aa = a0 + (q / (form === 0 ? 9 : 8)) * Math.PI * 2;
            return [cx + CRAD * Math.cos(aa), cy + CRAD * Math.sin(aa)];
          }
          if (form === 1) return [cx, cy];
          if (q === 0) return [cx + CRAD * Math.cos(a0), cy + CRAD * Math.sin(a0)];
          if (q === 1) return [cx, cy];
          const aa = a0 + Math.PI * (0.45 + ((q - 2) / 6) * 1.1);
          return [cx + CRAD * 1.15 * Math.cos(aa), cy + CRAD * 1.15 * Math.sin(aa)];
        },
        gq = form === 1 ? 8 : 5,
        nq = form === 2 ? [3, 7] : [2, 6],
        ring = [];
      for (let q = 0; q < 9; q++) {
        const isG = q === gq,
          isN = nq.includes(q),
          [x, y] = pos(q);
        ring.push(
          add(
            `${tag}${j}_${q}`,
            x,
            y,
            isG ? notable('gem') : isN ? notable(t) : TH[t].s,
            isG || isN ? 'notable' : 'small'
          )
        );
      }
      ln(prev, ring[0]);
      if (form === 0) for (let q = 0; q < 9; q++) ln(ring[q], ring[(q + 1) % 9]);
      else if (form === 1) {
        for (let q = 0; q < 8; q++) ln(ring[q], ring[(q + 1) % 8]);
        [0, 2, 4, 6].forEach(q => ln(ring[q], ring[8]));
      } else {
        ln(ring[0], ring[1]);
        for (let q = 2; q < 9; q++) ln(ring[1], ring[q]);
      }
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
      /* 最外圈畫成繞著圓心的弧 */
      ln(prev, id, q ? [0, 0] : null);
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
    const k = (j + 1) % SPOKES.length;
    [
      [5, 'm'],
      [9, 'o']
    ].forEach(([i, tag]) => {
      const anc = q => (i === 5 ? sec[q].mid : sec[q].out);
      let prev = anc(j);
      for (let q = 1; q <= 2; q++) {
        /* 0.3.14：路線會彎，連接點改用兩端節點的實際角度內插 */
        const nA = byId[anc(j)],
          nB = byId[anc(k)],
          A1 = Math.atan2(nA.y, nA.x),
          A2 = A1 + ((Math.atan2(nB.y, nB.x) - A1 + 3 * Math.PI) % (2 * Math.PI)) - Math.PI,
          rr = (Math.hypot(nA.x, nA.y) + Math.hypot(nB.x, nB.y)) / 2,
          [x, y] = P(rr, ((A1 + ((A2 - A1) * q) / 3) * 180) / Math.PI),
          pool = q === 1 ? SPOKES[j].sm : SPOKES[k].sm;
        const id = add(`${tag}${j}_${q}`, x, y, TH[pool[q % 2]].s, 'small');
        /* 中圈、外圈的連接畫成繞著圓心的弧 */
        ln(prev, id, [0, 0]);
        prev = id;
      }
      ln(prev, anc(k), [0, 0]);
    });
  }
  /* 0.2.9 珠寶槽：最外圈每條路線一個（15）＋中圈 6 個，點亮後可以放惡魔珠寶 */
  [...SPOKES.map((_, j) => `x${j}_1`), ...[1, 3, 6, 8, 11, 13].map(j => `m${j}_1`)].forEach(id => {
    const n = byId[id];
    if (!n) return;
    Object.assign(n, { n: '珠寶槽', st: {}, ic: 'gem', type: 'socket' });
  });
  return { N, E, byId };
})();
const VER = '0.3.20';
const START = { lat: 24.1372, lng: 120.6869, name: '台中車站' };
