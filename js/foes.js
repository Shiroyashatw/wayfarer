/* 漫步勇者 · 各章的怪物池與首領（0.1.0 肉鴿：原本散在地圖玩法裡的首領資料集中到這裡） */
'use strict';
/* 冥府看門人：牛頭、馬面、黑無常、白無常隨機一位，各自的屬性與冥府詞綴不同 */
const WATCHERS = [
  {
    n: '牛頭',
    spr: 'a_oxhead',
    el: 'phys',
    pal: { b: '#6a3a2a', w: '#e8e2d4', r: '#ff3a3a', n: '#c88a7a', a: '#3a2a3a' },
    mods: ['uw_body', 'fury']
  },
  {
    n: '馬面',
    spr: 'a_horseface',
    el: 'fire',
    pal: { g: '#5a7a6a', m: '#2a2a2a', r: '#ff3a3a', n: '#2a3a30', a: '#3a2a3a' },
    mods: ['uw_flame', 'swift']
  },
  {
    n: '黑無常',
    spr: 'a_wuchang_black',
    el: 'cold',
    pal: { h: '#1a1a22', t: '#e8e8e8', f: '#cfd8cf', e: '#111111', r: '#c0202a', c: '#24242c' },
    mods: ['uw_rage', 'cold']
  },
  {
    n: '白無常',
    spr: 'a_wuchang_white',
    el: 'light',
    pal: { h: '#f0f0f0', t: '#c0202a', f: '#f4f4f4', e: '#111111', r: '#e03040', c: '#e4e4ec' },
    mods: ['uw_soul', 'shock']
  }
];
/* 台灣鬼怪：第一章的首領（0.3.26 起地城首領抽籤用的那 9 隻） */
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

/* 第三章的冥府小怪與山海經異獸（0.1.0 肉鴿：PixelLab 第三批先備好的圖）；w 是出現權重，山海經的比較少見、比較強 */
const HELLMON = [
  {
    name: '小鬼',
    bg: 'cave',
    spr: 'a_hell_imp',
    hp: 34,
    atk: 14,
    arm: 6,
    el: 'fire',
    res: [40, 0, 0],
    xp: 20,
    gold: 14,
    w: 30,
    min: 0
  },
  {
    name: '餓鬼',
    bg: 'cave',
    spr: 'a_hungry_ghost',
    hp: 56,
    atk: 12,
    arm: 4,
    el: 'chaos',
    res: [0, 20, 0, 40],
    xp: 24,
    gold: 14,
    w: 20,
    min: 0
  },
  {
    name: '鬼差',
    bg: 'cave',
    spr: 'a_ghost_bailiff',
    hp: 64,
    atk: 16,
    arm: 20,
    el: 'cold',
    res: [10, 40, 10],
    xp: 28,
    gold: 18,
    w: 15,
    min: 0
  },
  {
    name: '孟婆',
    bg: 'cave',
    spr: 'a_mengpo',
    hp: 70,
    atk: 15,
    arm: 16,
    el: 'cold',
    res: [20, 40, 20, 30],
    xp: 32,
    gold: 22,
    w: 5,
    min: 0
  },
  {
    name: '夔',
    bg: 'cave',
    spr: 'a_mist_kui',
    hp: 80,
    atk: 18,
    arm: 30,
    el: 'light',
    res: [20, 20, 50],
    xp: 40,
    gold: 26,
    w: 5,
    min: 0
  },
  {
    name: '畢方',
    bg: 'cave',
    spr: 'a_mist_bifang',
    hp: 60,
    atk: 20,
    arm: 10,
    el: 'fire',
    res: [60, 0, 10],
    xp: 40,
    gold: 26,
    w: 5,
    min: 0
  },
  {
    name: '蠱雕',
    bg: 'cave',
    spr: 'a_mist_gudiao',
    hp: 58,
    atk: 21,
    arm: 12,
    el: 'phys',
    res: [10, 10, 10],
    xp: 40,
    gold: 26,
    w: 5,
    min: 0
  },
  {
    name: '猙',
    bg: 'cave',
    spr: 'a_mist_zheng',
    hp: 75,
    atk: 22,
    arm: 18,
    el: 'phys',
    res: [20, 20, 20],
    xp: 40,
    gold: 26,
    w: 5,
    min: 0
  }
];
/* 第一章的菁英：墮落獸（HUNT_SPR 對應的野怪）之外，再加只有墮落版圖的帝雉 */
const BEAST_X = [
  {
    name: '墮落・帝雉',
    bg: 'mountain',
    spr: 'a_hunt_pheasant',
    hp: 40,
    atk: 15,
    arm: 10,
    el: 'phys',
    res: [0, 10, 10],
    xp: 24,
    gold: 16
  }
];
/* 第二章的首領之一：海盜王（台灣海峽的海盜，十二生肖、四凶之外的選擇） */
const PIRATE_KING = { n: '海盜王', spr: 'a_pirate_king', el: 'phys' };
