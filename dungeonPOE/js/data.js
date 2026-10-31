/* dungeonPOE · 資料表：版本、主角、技能、地圖階級、裝備欄與底材、詞綴（T12～T1）、怪物、王 */
'use strict';
const VER = '0.2.4';
const KEY = 'dungeonpoe_v1';
const SLOT = new URLSearchParams(location.search).get('p') || '';

/* ---------- 主角（等級每升一級：生命 +12、魔力 +3、物理傷害 +4%） ---------- */
const HERO = { hp: 120, mp: 60, mpReg: 5, spd: 230, dmg: [6, 10], crit: 5, critX: 1.5 };
const LVMAX = 60;
const xpNeed = lv => Math.round(40 * Math.pow(lv, 1.7));

/* ---------- 技能寶石（0.2.2）：技能欄固定 5 格（左鍵、右鍵、Q、E、R），每格 1 顆技能＋2 顆輔助 ----------
   t 出手時間（吃攻速）、mp 魔力、cd 冷卻、m 傷害倍率、tags 標籤（輔助看標籤）、el 傷害全部轉成這個屬性、cls 主題（0.1 的職業） */
const SKILLS = {
  slash: {
    n: '斬擊',
    ic: 'sk_slash2',
    cls: 'ronin',
    t: 0.36,
    mp: 0,
    m: 1,
    r: 100,
    arc: 2.1,
    gain: 2,
    tags: ['attack', 'melee'],
    d: '向前揮出扇形斬擊，打中每隻回 2 魔力'
  },
  swallow: {
    n: '燕返',
    ic: 'sk_crosscut',
    cls: 'ronin',
    t: 0.5,
    mp: 6,
    m: 0.85,
    r: 110,
    arc: 2.4,
    tags: ['attack', 'melee'],
    d: '連砍兩刀：先往前、再反手一刀'
  },
  whirl: {
    n: '旋風斬',
    ic: 'sk_whirl',
    cls: 'ronin',
    t: 0.4,
    mp: 18,
    cd: 3,
    m: 1.8,
    r: 150,
    tags: ['attack', 'melee', 'aoe', 'cd'],
    d: '原地迴旋，打周圍所有敵人並擊退'
  },
  iai: {
    n: '居合突進',
    ic: 'sk_iai',
    cls: 'ronin',
    t: 0.22,
    mp: 12,
    cd: 4,
    m: 1.5,
    dist: 300,
    tags: ['attack', 'melee', 'move', 'cd'],
    d: '衝向滑鼠位置，斬過路上的敵人；衝刺中無敵'
  },
  quake: {
    n: '震地',
    ic: 'sk_groundslam',
    cls: 'knight',
    t: 0.55,
    mp: 14,
    m: 2,
    r: 170,
    arc: 1.4,
    stun: 0.6,
    tags: ['attack', 'melee', 'aoe'],
    d: '往前重擊地面，扇形範圍的敵人暈眩 0.6 秒'
  },
  blade: {
    n: '飛刃',
    ic: 'sk_fanblade',
    cls: 'assassin',
    t: 0.42,
    mp: 6,
    m: 0.8,
    spd: 760,
    pierce: 2,
    cnt: 1,
    tags: ['attack', 'proj'],
    d: '射出飛刃，穿透 2 隻'
  },
  storm: {
    n: '千本櫻',
    ic: 'sk_bladestorm',
    cls: 'assassin',
    t: 0.45,
    mp: 24,
    cd: 6,
    m: 0.9,
    cnt: 10,
    spd: 620,
    pierce: 3,
    tags: ['attack', 'proj', 'cd'],
    d: '向四面八方射出 10 把飛刃，各穿透 3 隻'
  },
  venom: {
    n: '毒刃雨',
    ic: 'sk_poisoncloud',
    cls: 'assassin',
    t: 0.4,
    mp: 16,
    m: 0.35,
    r: 110,
    dur: 3,
    el: 'chaos',
    tags: ['spell', 'aoe', 'dot'],
    d: '在滑鼠位置下 3 秒毒刃雨：範圍裡的敵人每秒受混沌傷害'
  },
  fireball: {
    n: '火球',
    ic: 'sk_fire',
    cls: 'pyro',
    t: 0.45,
    mp: 9,
    m: 1.1,
    spd: 560,
    r: 70,
    cnt: 1,
    pierce: 0,
    el: 'fire',
    tags: ['spell', 'proj', 'aoe'],
    d: '射出火球，打中爆炸（範圍火焰傷害）'
  },
  nova: {
    n: '火焰新星',
    ic: 'sk_fireburst',
    cls: 'pyro',
    t: 0.4,
    mp: 15,
    m: 1.3,
    r: 165,
    el: 'fire',
    tags: ['spell', 'aoe'],
    d: '以自己為中心爆出一圈火焰'
  },
  meteor: {
    n: '隕石',
    ic: 'sk_meteor',
    cls: 'pyro',
    t: 0.5,
    mp: 28,
    cd: 5,
    m: 3.2,
    r: 125,
    delay: 0.7,
    el: 'fire',
    tags: ['spell', 'aoe', 'cd'],
    d: '0.7 秒後隕石砸在滑鼠位置，大範圍火焰傷害'
  },
  wolf: {
    n: '召喚戰狼',
    ic: 'sk_bloodhowl',
    cls: 'tamer',
    t: 0.5,
    mp: 20,
    cd: 2,
    m: 0.5,
    cnt: 2,
    tags: ['minion', 'cd'],
    d: '叫出 2 隻戰狼（這張地圖一直跟著你）；再放一次會補滿'
  },
  /* 0.2.4 陷阱、地雷、砲台、圖騰：放在場上的東西（unit），上限一起算 */
  frosttrap: {
    n: '冰霜陷阱',
    ic: 'sk_frosttrap',
    t: 0.3,
    mp: 10,
    m: 1.6,
    r: 110,
    stun: 1,
    el: 'cold',
    unit: 'trap',
    tags: ['spell', 'trap', 'aoe'],
    d: '丟出陷阱，敵人靠近就爆開：範圍冰冷傷害、凍住 1 秒'
  },
  blastmine: {
    n: '爆裂地雷',
    ic: 'sk_blastmine',
    t: 0.25,
    mp: 8,
    m: 1.4,
    r: 100,
    el: 'fire',
    unit: 'mine',
    tags: ['spell', 'mine', 'aoe'],
    d: '埋下地雷（可以疊好幾顆）；最後一顆埋下 1.2 秒後一起引爆，每多一顆全部 +10% 傷害'
  },
  ballista: {
    n: '弩砲台',
    ic: 'sk_ballista',
    t: 0.3,
    mp: 18,
    cd: 1,
    m: 0.45,
    dur: 10,
    rate: 0.45,
    unit: 'turret',
    tags: ['attack', 'proj', 'turret', 'cd'],
    d: '架起弩砲台（10 秒），自動射擊附近的敵人'
  },
  firetotem: {
    n: '火焰圖騰',
    ic: 'sk_firetotem',
    t: 0.35,
    mp: 20,
    cd: 1,
    m: 0.7,
    dur: 8,
    rate: 0.8,
    r: 60,
    el: 'fire',
    unit: 'totem',
    tags: ['spell', 'totem', 'proj', 'cd'],
    d: '立起圖騰（8 秒），自動對附近的敵人吐火彈（小範圍爆炸）'
  }
};
/* 光環（0.2.4，照 PoE2）：插在光環欄、開著就一直生效，預留精魄；效果跟著寶石等級與光環效果變強 */
const AURAS = {
  anger: { n: '憤怒', ic: 'sk_anger', sp: 30, fx: { fireAdd: 15 }, d: '多造成傷害 15% 的火焰傷害' },
  precise: { n: '精準', ic: 'sk_precise', sp: 30, fx: { crit: 5, critX: 20 }, d: '暴擊率 +5%、暴擊傷害 +20%' },
  swift: { n: '迅捷', ic: 'sk_hasteaura', sp: 40, fx: { as: 10, ms: 8 }, d: '攻速 +10%、移動速度 +8%' },
  iron: { n: '堅毅', ic: 'sk_determination', sp: 30, fx: { armorP: 40, regen: 4 }, d: '護甲 +40%、每秒回復 4 生命' },
  purity: { n: '純淨', ic: 'sk_purityaura', sp: 30, fx: { resA: 15 }, d: '全部抗性 +15%' },
  clarity: { n: '冥思', ic: 'sk_clarity', sp: 30, fx: { esP: 25, mpReg: 40 }, d: '能量護盾 +25%、魔力回復 +40%' },
  wolfsp: {
    n: '戰狼精魄',
    ic: 'sk_command',
    sp: 40,
    fx: { wolf: 1 },
    d: '一隻戰狼一直跟著你（不用放技能，換地圖也在）'
  }
};
const AURA_SLOTS = 3,
  SPIRIT0 = 30;
/* 輔助寶石：need 要有其中一個標籤才生效 */
const SUPPORTS = {
  multi: { n: '多重投射', ic: 'sup_sp_multi', need: ['proj'], d: '投射物 +2，傷害 ×0.8' },
  pierce: { n: '穿透', ic: 'sup_sp_pen', need: ['proj'], d: '投射物多穿透 3 隻' },
  area: { n: '範圍擴大', ic: 'sup_sp_aoe', need: ['aoe', 'melee'], d: '範圍 ×1.4' },
  fury: { n: '狂暴', ic: 'sup_sp_dmg', need: [], d: '傷害 ×1.35，魔力消耗 ×1.4' },
  haste: { n: '連擊', ic: 'sup_sp_fastatk', need: ['attack', 'spell'], d: '出手速度 ×1.25' },
  crit: { n: '致命', ic: 'sup_sp_crit', need: [], d: '暴擊率 +10%、暴擊傷害 +40%' },
  leech: { n: '吸血', ic: 'sup_sp_leech', need: [], d: '造成傷害的 3% 回復生命' },
  cdr: { n: '冷卻縮減', ic: 'sup_sp_cd', need: ['cd'], d: '冷卻 ×0.65' },
  fireadd: { n: '附加火焰', ic: 'sup_sp_gfire', need: [], d: '多造成傷害 25% 的火焰傷害' },
  heavy: { n: '重擊', ic: 'sup_sp_heavy', need: ['melee'], d: '擊退 ×2、傷害 ×1.15' },
  pack: { n: '群狼', ic: 'sup_sp_pet', need: ['minion'], d: '多 1 隻狼、狼的傷害 ×1.3' },
  /* 轉換：技能改成丟陷阱／埋地雷／立圖騰，一顆技能只能插一個 */
  trapc: {
    n: '轉陷阱',
    ic: 'sup_sp_trap',
    need: ['spell', 'attack'],
    conv: 'trap',
    d: '這個技能改成丟陷阱：敵人靠近才觸發，傷害 ×1.2'
  },
  minec: {
    n: '轉地雷',
    ic: 'sup_sp_mine',
    need: ['spell', 'attack'],
    conv: 'mine',
    d: '這個技能改成埋地雷：可以疊好幾顆一起引爆，每多一顆 +10%'
  },
  totemc: {
    n: '轉圖騰',
    ic: 'sup_sp_totem',
    need: ['spell', 'attack'],
    conv: 'totem',
    d: '這個技能改成立圖騰（8 秒）：圖騰替你自動施放，傷害 ×0.7'
  }
};
/* 寶石等級：上限 20、不能超過角色等級；每級傷害 +6%（輔助每級 +1%） */
const GEM_MAX = 20;
const gemNeed = lv => Math.round(30 * lv * lv);

/* ---------- 天賦樹（0.2.4，照 PoE＋漫步勇者）：中間挖空放昇華；18 條路線、每條「內段×外段」結構都不一樣；
   每個方向偏重一種體系、但小點會混搭隔壁的主題；沒有基石，大點都是全職業通用的強效果 ---------- */
const STATN = {
  hpP: ['生命', '%'],
  regen: ['每秒回復生命', ''],
  flask: ['藥水回復', '%'],
  armorP: ['護甲', '%'],
  block: ['格擋', '%'],
  meleeP: ['近戰傷害', '%'],
  swordP: ['持劍時傷害', '%'],
  spearP: ['持矛時傷害', '%'],
  staffP: ['持棍時傷害', '%'],
  as: ['攻速', '%'],
  critX: ['暴擊傷害', '%'],
  crit: ['暴擊率', '%'],
  ms: ['移動速度', '%'],
  projP: ['投射物傷害', '%'],
  unitP: ['陷阱、地雷、圖騰、砲台傷害', '%'],
  units: ['陷阱、地雷、圖騰、砲台數量上限', ''],
  minionP: ['召喚物傷害', '%'],
  eleP: ['元素傷害', '%'],
  spellP: ['法術傷害', '%'],
  aoe: ['範圍', '%'],
  es: ['能量護盾', ''],
  esP: ['能量護盾', '%'],
  esRec: ['能量護盾回充速度', '%'],
  spirit: ['精魄', ''],
  auraEff: ['光環效果', '%'],
  mpP: ['魔力', '%'],
  mpReg: ['魔力回復', '%'],
  cdr: ['冷卻縮減', '%'],
  resA: ['全部抗性', '%'],
  dmgA: ['傷害', '%'],
  rollCd: ['翻滾冷卻縮短', '%'],
  lowHp: ['生命低於一半時傷害', '%'],
  fullHp: ['生命全滿時傷害', '%'],
  esUp: ['有能量護盾時傷害', '%'],
  afterRoll: ['翻滾後 2 秒內傷害', '%'],
  bossP: ['對王與菁英傷害', '%'],
  closeP: ['對近身（160 內）的敵人傷害', '%'],
  farP: ['對遠處（350 外）的敵人傷害', '%'],
  killHeal: ['擊殺回復生命', ''],
  lowHpRed: ['生命低於一半時受到的傷害減少', '%'],
  blood: ['技能改用生命施放（不耗魔力）', '']
};
/* 18 條路線的主題：sm 小點（輪流）、nt 大點（名字＋效果，全職業通用）；繞一圈，相鄰的主題會混搭 */
const PT_THEME = [
  {
    n: '生命',
    c: '#d9534f',
    ic: 'asc_s_heart',
    sm: [{ hpP: 4 }, { hpP: 3, regen: 1 }],
    nt: [
      ['不屈', { hpP: 12, regen: 4 }],
      ['血氣方剛', { hpP: 10, flask: 30 }],
      ['生生不息', { regen: 12, hpP: 5 }]
    ]
  },
  {
    n: '護甲',
    c: '#b0835a',
    ic: 'asc_s_shield',
    sm: [{ armorP: 10 }, { armorP: 6, hpP: 2 }],
    nt: [
      ['鐵骨', { armorP: 35, resA: 5 }],
      ['金剛', { armorP: 30, hpP: 6 }],
      ['磐石', { armorP: 50, ms: -3 }]
    ]
  },
  {
    n: '格擋',
    c: '#9aa7b8',
    ic: 'asc_s_anvil',
    sm: [{ block: 2 }, { block: 1, armorP: 6 }],
    nt: [
      ['銅牆', { block: 6, armorP: 20 }],
      ['以盾為劍', { block: 4, meleeP: 15 }],
      ['不動如山', { block: 5, hpP: 8 }]
    ]
  },
  {
    n: '近戰',
    c: '#e8a33d',
    ic: 'asc_s_sword',
    sm: [{ meleeP: 6 }, { swordP: 6 }, { meleeP: 4, as: 2 }],
    nt: [
      ['斬鐵', { meleeP: 25, critX: 10 }],
      ['劍意', { meleeP: 20, aoe: 8 }],
      ['破甲', { meleeP: 22, dmgA: 5 }]
    ]
  },
  {
    n: '矛',
    c: '#d9a066',
    ic: 'gear_weapon_9',
    sm: [{ spearP: 6 }, { spearP: 4, as: 2 }],
    nt: [
      ['穿刺', { spearP: 25, critX: 10 }],
      ['長槍陣', { spearP: 20, aoe: 10 }],
      ['擲矛', { spearP: 18, projP: 12 }]
    ]
  },
  {
    n: '攻速',
    c: '#f2c14e',
    ic: 'asc_s_wind',
    sm: [{ as: 3 }, { as: 2, ms: 1 }],
    nt: [
      ['疾風', { as: 10, ms: 4 }],
      ['連斬', { as: 12 }],
      ['流水', { as: 8, cdr: 4 }]
    ]
  },
  {
    n: '暴擊傷害',
    c: '#ffd166',
    ic: 'asc_s_stars',
    sm: [{ critX: 8 }, { critX: 5, crit: 1 }],
    nt: [
      ['致命', { critX: 35 }],
      ['要害', { critX: 25, crit: 3 }],
      ['斬首', { critX: 30, meleeP: 8 }]
    ]
  },
  {
    n: '身法',
    c: '#7bd36b',
    ic: 'asc_s_feather',
    sm: [{ ms: 2 }, { ms: 1, rollCd: 4 }],
    nt: [
      ['輕功', { ms: 8, rollCd: 15 }],
      ['殘影', { ms: 6, as: 6 }],
      ['踏雪', { rollCd: 20, resA: 6 }]
    ]
  },
  {
    n: '棍',
    c: '#b5d36b',
    ic: 'gear_weapon_4',
    sm: [{ staffP: 6 }, { staffP: 4, ms: 1 }],
    nt: [
      ['武僧', { staffP: 22, as: 6 }],
      ['迴棍', { staffP: 20, aoe: 10 }],
      ['禪定', { staffP: 15, es: 25, resA: 5 }]
    ]
  },
  {
    n: '投射物',
    c: '#8fe0a5',
    ic: 'asc_s_bolt',
    sm: [{ projP: 6 }, { projP: 4, crit: 1 }],
    nt: [
      ['鷹眼', { projP: 25, crit: 3 }],
      ['穿雲', { projP: 22, as: 5 }],
      ['連珠', { projP: 20, critX: 15 }]
    ]
  },
  {
    n: '陷阱地雷',
    c: '#a3d977',
    ic: 'asc_s_spark',
    sm: [{ unitP: 7 }, { unitP: 4, cdr: 2 }],
    nt: [
      ['機關師', { unitP: 25, units: 1 }],
      ['連環爆', { unitP: 20, aoe: 10 }],
      ['伏擊', { unitP: 22, crit: 4 }]
    ]
  },
  {
    n: '暴擊率',
    c: '#fff08a',
    ic: 'asc_s_eye',
    sm: [{ crit: 2 }, { crit: 1, critX: 4 }],
    nt: [
      ['精準', { crit: 6, critX: 15 }],
      ['心眼', { crit: 8 }],
      ['洞察', { crit: 5, projP: 10 }]
    ]
  },
  {
    n: '圖騰砲台',
    c: '#c9a46b',
    ic: 'asc_s_rune',
    sm: [{ unitP: 6 }, { unitP: 4, armorP: 6 }],
    nt: [
      ['堡壘工匠', { unitP: 25, units: 1 }],
      ['砲陣', { unitP: 22, projP: 10 }],
      ['祖靈', { unitP: 20, hpP: 6 }]
    ]
  },
  {
    n: '召喚',
    c: '#9df29d',
    ic: 'asc_s_paw',
    sm: [{ minionP: 8 }, { minionP: 5, hpP: 2 }],
    nt: [
      ['御獸', { minionP: 30 }],
      ['群狼', { minionP: 25, spirit: 15 }],
      ['魂契', { minionP: 22, cdr: 5 }]
    ]
  },
  {
    n: '元素',
    c: '#ff8a4c',
    ic: 'asc_s_flame',
    sm: [{ eleP: 6 }, { eleP: 4, resA: 2 }],
    nt: [
      ['燎原', { eleP: 25 }],
      ['共鳴', { eleP: 20, aoe: 8 }],
      ['元素親和', { eleP: 18, resA: 10 }]
    ]
  },
  {
    n: '法術',
    c: '#8fd6ff',
    ic: 'asc_s_spark',
    sm: [{ spellP: 6 }, { spellP: 4, mpP: 2 }],
    nt: [
      ['天雷', { spellP: 25 }],
      ['咒法', { spellP: 20, cdr: 5 }],
      ['秘術', { spellP: 18, es: 30 }]
    ]
  },
  {
    n: '範圍',
    c: '#b7e3ff',
    ic: 'asc_s_stars',
    sm: [{ aoe: 4 }, { aoe: 3, dmgA: 2 }],
    nt: [
      ['擴散', { aoe: 15 }],
      ['震波', { aoe: 12, meleeP: 10 }],
      ['星爆', { aoe: 12, spellP: 10 }]
    ]
  },
  {
    n: '能量護盾',
    c: '#7aa8ff',
    ic: 'asc_s_drop',
    sm: [{ esP: 8 }, { es: 10 }, { esP: 5, esRec: 5 }],
    nt: [
      ['靈障', { esP: 30, es: 20 }],
      ['快速充能', { esRec: 40, esP: 10 }],
      ['魂盾', { esP: 25, resA: 6 }]
    ]
  },
  {
    n: '精魄光環',
    c: '#c38bff',
    ic: 'asc_s_lotus',
    sm: [{ auraEff: 4 }, { spirit: 5 }],
    nt: [
      ['靈識', { spirit: 20 }],
      ['聖域', { auraEff: 20, spirit: 10 }],
      ['共感', { auraEff: 15, resA: 6 }]
    ]
  },
  {
    n: '魔力冷卻',
    c: '#b28dff',
    ic: 'asc_s_book',
    sm: [{ mpP: 5 }, { mpReg: 10 }, { cdr: 2 }],
    nt: [
      ['冥想', { mpP: 15, mpReg: 25 }],
      ['迅捷施術', { cdr: 10 }],
      ['血之代價', { blood: 1, hpP: 10 }]
    ]
  }
];
/* 軌道拼塊（照 PoE2）：1～3 圈軌道（整圈或一段弧）＋中心點、輻條、尾巴隨機組合，產生 120 塊不重複的形狀；
   同一圈上相鄰的點用圓弧連（arc：[圓心 x, 圓心 y, 半徑]，座標是 -1～1 的單位圓） */
const PT_ORBITS = (() => {
  let seed = 20261031;
  const rnd = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296,
    RADII = [0.3, 0.52, 0.74, 1],
    out = [],
    seen = new Set();
  for (let tries = 0; out.length < 120 && tries < 5000; tries++) {
    const no = 1 + Math.floor(rnd() * 3),
      radii = RADII.slice()
        .sort(() => rnd() - 0.5)
        .slice(0, no)
        .sort((a, b) => a - b),
      center = rnd() < 0.55,
      pts = [],
      e = [],
      arc = [],
      sig = [center ? 'c' : ''];
    if (center) pts.push([0, 0, rnd() < 0.6 ? 1 : 0]);
    const rings = [];
    for (const r of radii) {
      const full = rnd() < 0.45,
        span = full ? Math.PI * 2 : Math.PI * (0.5 + rnd() * 1.1),
        maxN = Math.max(2, Math.floor((span * r) / 0.42)),
        n = Math.max(full ? 3 : 2, Math.min(maxN, 2 + Math.floor(rnd() * 6))),
        a0 = rnd() * Math.PI * 2,
        ids = [];
      for (let k = 0; k < n; k++) {
        const a = a0 + (full ? (k / n) * span : (k / (n - 1)) * span);
        ids.push(pts.length);
        pts.push([Math.cos(a) * r, Math.sin(a) * r, 0, a]);
      }
      for (let k = 1; k < n; k++) e.push([ids[k - 1], ids[k]]), arc.push([0, 0, r]);
      if (full) e.push([ids[n - 1], ids[0]]), arc.push([0, 0, r]);
      /* 大點：弧的兩端或圈上隨機 1～2 個 */
      const nb = rnd() < 0.45 ? 1 : 0;
      for (let k = 0; k < nb; k++) pts[ids[full ? Math.floor(rnd() * n) : k ? n - 1 : 0]][2] = 1;
      rings.push({ r, ids, full });
      sig.push(`${r}:${n}:${full ? 'F' : Math.round(span * 4)}`);
    }
    /* 輻條：中心接最內圈，圈與圈之間接 1～3 條（找角度最近的點） */
    const closestTo = (ids, a) =>
      ids.reduce((b, id) =>
        Math.abs(Math.atan2(Math.sin(pts[id][3] - a), Math.cos(pts[id][3] - a))) <
        Math.abs(Math.atan2(Math.sin(pts[b][3] - a), Math.cos(pts[b][3] - a)))
          ? id
          : b
      );
    const spokes = [];
    if (center) {
      const k = 1 + Math.floor(rnd() * Math.min(3, rings[0].ids.length));
      for (let j = 0; j < k; j++) {
        const id = rings[0].ids[Math.floor((j * rings[0].ids.length) / k)];
        e.push([0, id]), arc.push(null), spokes.push('c' + j);
      }
    }
    for (let i = 1; i < rings.length; i++) {
      const k = 1 + Math.floor(rnd() * 3),
        used = new Set();
      for (let j = 0; j < k; j++) {
        const from = rings[i].ids[Math.floor(rnd() * rings[i].ids.length)],
          to = closestTo(rings[i - 1].ids, pts[from][3]);
        if (used.has(from + ',' + to)) continue;
        used.add(from + ',' + to);
        e.push([to, from]), arc.push(null), spokes.push(i + '' + j);
      }
    }
    /* 尾巴：從最外圈往外伸出 1～2 個點 */
    if (rnd() < 0.35 && rings.length) {
      const last = rings[rings.length - 1],
        from = last.ids[last.full ? 0 : last.ids.length - 1],
        a = pts[from][3],
        len = 1 + Math.floor(rnd() * 2);
      let prev = from;
      for (let k = 1; k <= len; k++) {
        const rr = last.r + 0.3 * k;
        pts.push([Math.cos(a) * rr, Math.sin(a) * rr, k === len ? 1 : 0, a]);
        e.push([prev, pts.length - 1]), arc.push(null);
        prev = pts.length - 1;
      }
      sig.push('t' + len);
    }
    sig.push(spokes.length);
    const key = sig.join('|');
    /* 要連通、而且跟之前的都不一樣 */
    const adj = {},
      vis = new Set([0]),
      q = [0];
    for (const [a, b] of e) (adj[a] = adj[a] || []).push(b), (adj[b] = adj[b] || []).push(a);
    while (q.length) for (const o of adj[q.pop()] || []) if (!vis.has(o)) vis.add(o), q.push(o);
    if (seen.has(key) || vis.size !== pts.length || pts.length < 4 || !pts.some(p => p[2])) continue;
    seen.add(key);
    /* 縮放到半徑 1 以內 */
    const R = Math.max(...pts.map(p => Math.hypot(p[0], p[1])));
    out.push({
      pts: pts.map(p => [p[0] / R, p[1] / R, p[2]]),
      e,
      arc: arc.map(a => a && [0, 0, a[2] / R]),
      f: { no: rings.length, full: rings.filter(r => r.full).length, center, spokes: spokes.length }
    });
  }
  return out;
})();
/* 直線拼塊庫（照 PoE：形狀都不一樣的拼塊拼起來）：28 種家族 × 4 種參數，天賦樹每種家族挑一塊（另外配軌道拼塊 PT_ORBITS）。
   座標 u＝往外 0～1、v＝左右 -1～1；第三個值 1＝大點 */
const PT_PIECES = (() => {
  const out = [],
    TAU2 = Math.PI * 2;
  const mk = f => {
    const p = [],
      e = [],
      n = (u, v, big = 0) => (p.push([u, v, big]), p.length - 1),
      l = (a, b) => e.push([a, b]),
      chain = ids => ids.forEach((id, k) => k && l(ids[k - 1], id)),
      loop = ids => ids.forEach((id, k) => l(id, ids[(k + 1) % ids.length]));
    f(n, l, chain, loop);
    out.push({ pts: p.map(([u, v, b]) => [(u - 0.5) * 2, v, b]), e });
  };
  const ringPts = (n, cu, cv, ru, rv, a0, bigAt = -1) =>
    Array.from({ length: n }, (_, k) => [
      cu + Math.cos(a0 + (k / n) * TAU2) * ru,
      cv + Math.sin(a0 + (k / n) * TAU2) * rv,
      k === bigAt ? 1 : 0
    ]);
  /* 輪子：中間大點、外圈 n 個、幾條輻條 */ for (const [n, spk] of [
    [5, 5],
    [6, 3],
    [7, 1],
    [8, 4]
  ])
    mk((N, l, ch, lp) => {
      const c = N(0.5, 0, 1),
        rim = ringPts(n, 0.5, 0, 0.45, 0.9, Math.PI).map(q => N(...q));
      lp(rim);
      for (let k = 0; k < n; k += n / spk) l(c, rim[k]);
    });
  /* 雙軌梯子 */ for (const r of [3, 4, 5, 6])
    mk((N, l, ch) => {
      const L = [],
        Rr = [];
      for (let k = 0; k < r; k++)
        L.push(N(k / (r - 1), -0.6, k === r - 1 ? 1 : 0)), Rr.push(N(k / (r - 1), 0.6, k === 1 ? 1 : 0));
      ch(L), ch(Rr);
      for (let k = 0; k < r; k += 2) l(L[k], Rr[k]);
    });
  /* 螺旋：捲進中心的大點 */ for (const m of [5, 6, 8, 10])
    mk((N, l, ch) => {
      const ids = [];
      for (let k = 0; k < m; k++) {
        const a = (k / m) * TAU2 * 1.3 + Math.PI,
          r = 1 - k / m;
        ids.push(N(0.5 + Math.cos(a) * r * 0.48, Math.sin(a) * r * 0.95, k === m - 1 ? 1 : 0));
      }
      ch(ids);
    });
  /* 星形：尖端連到隔一個尖端，中間大點 */ for (const pts of [4, 5, 6, 7])
    mk((N, l) => {
      const c = N(0.5, 0, 1),
        tips = ringPts(pts, 0.5, 0, 0.48, 0.95, -Math.PI / 2, 0).map(q => N(...q));
      tips.forEach((t, k) => l(t, tips[(k + 2) % pts]));
      l(c, tips[0]);
    });
  /* 扇形：從底部散開，末端連成弧 */ for (const rays of [2, 3, 4, 5])
    mk((N, l, ch) => {
      const o = N(0, 0),
        ends = [];
      for (let k = 0; k < rays; k++) {
        const v = rays === 1 ? 0 : -0.9 + (k * 1.8) / (rays - 1),
          m = N(0.5, v * 0.5),
          t = N(0.95, v, k % 2 ? 0 : 1);
        l(o, m), l(m, t), ends.push(t);
      }
      ch(ends);
    });
  /* 新月：一道大弧，中間一條短路 */ for (const side of [1, -1, 0.6, -0.6])
    mk((N, l, ch) => {
      const arc = [];
      for (let k = 0; k <= 6; k++) arc.push(N(k / 6, side * -Math.sin((k / 6) * Math.PI) * 0.95, k === 3 ? 1 : 0));
      ch(arc);
      const m = N(0.5, side * 0.2, side > 0 ? 1 : 0);
      l(arc[0], m), l(m, arc[6]);
    });
  /* 連環：k 個小環串在一起 */ for (const k0 of [2, 3, 2.5, 1.5])
    mk((N, l) => {
      let last = null;
      for (let j = 0; j < k0; j++) {
        const cu = (j + 0.5) / k0,
          rg = ringPts(4, cu, 0, 0.28 / k0, 0.55, Math.PI, j === k0 - 1 ? 2 : -1).map(q => N(...q));
        rg.forEach((id, k) => l(id, rg[(k + 1) % 4]));
        if (last !== null) l(last, rg[0]);
        last = rg[2];
      }
    });
  /* 花：中間大點，幾片繞回來的花瓣 */ for (const pet of [2, 3, 4, 5])
    mk((N, l) => {
      const c = N(0.5, 0, 1);
      for (let j = 0; j < pet; j++) {
        const a = (j / pet) * TAU2,
          p1 = N(0.5 + Math.cos(a - 0.4) * 0.3, Math.sin(a - 0.4) * 0.6),
          p2 = N(0.5 + Math.cos(a) * 0.48, Math.sin(a) * 0.95, j === 0 ? 1 : 0),
          p3 = N(0.5 + Math.cos(a + 0.4) * 0.3, Math.sin(a + 0.4) * 0.6);
        l(c, p1), l(p1, p2), l(p2, p3), l(p3, c);
      }
    });
  /* 分岔樹 */ for (const d of [1, 2, 3, 2.5])
    mk((N, l) => {
      const root = N(0, 0);
      let layer = [root];
      for (let k = 1; k <= d; k++) {
        const next = [],
          w = 2 ** k;
        for (let j = 0; j < w; j++) next.push(N(k / d, -0.9 + (j * 1.8) / (w - 1), k === d && j % 3 === 0 ? 1 : 0));
        next.forEach((id, j) => l(layer[Math.floor(j / 2)], id));
        layer = next;
      }
    });
  /* 鋸齒 */ for (const n of [4, 5, 6, 8])
    mk((N, l, ch) =>
      ch(
        Array.from({ length: n }, (_, k) =>
          N(k / (n - 1), k % 2 ? 0.7 : -0.7, k === n - 1 || k === Math.floor(n / 2) ? 1 : 0)
        )
      )
    );
  /* 格子（帶一條斜線） */ for (const [c, r] of [
    [2, 2],
    [3, 2],
    [2, 3],
    [3, 3]
  ])
    mk((N, l) => {
      const g = [];
      for (let i = 0; i < c; i++)
        for (let j = 0; j < r; j++) g.push(N(i / (c - 1), -0.8 + (j * 1.6) / (r - 1), i === c - 1 && j === 0 ? 1 : 0));
      for (let i = 0; i < c; i++)
        for (let j = 0; j < r; j++) {
          if (i < c - 1) l(g[i * r + j], g[(i + 1) * r + j]);
          if (j < r - 1 && (i + j) % 2 === 0) l(g[i * r + j], g[i * r + j + 1]);
        }
      l(g[0], g[r + 1 < g.length ? r + 1 : 1]);
    });
  /* 沙漏 */ for (const w of [0.5, 0.65, 0.8, 0.95])
    mk((N, l) => {
      const a = N(0, 0),
        b = N(0.3, -w),
        c = N(0.3, w, 1),
        m = N(0.5, 0),
        d = N(0.7, -w, 1),
        e = N(0.7, w),
        f = N(1, 0);
      l(a, b), l(a, c), l(b, m), l(c, m), l(m, d), l(m, e), l(d, f), l(e, f), l(b, c);
    });
  /* 眼：上下兩道弧夾著瞳孔 */ for (const k0 of [2, 3, 4, 5])
    mk((N, l, ch) => {
      const a = N(0, 0),
        b = N(1, 0),
        up = [a],
        dn = [a];
      for (let k = 1; k < k0; k++)
        up.push(N(k / k0, -Math.sin((k / k0) * Math.PI) * 0.85)),
          dn.push(N(k / k0, Math.sin((k / k0) * Math.PI) * 0.85));
      up.push(b), dn.push(b);
      ch(up), ch(dn);
      const p = N(0.5, 0, 1);
      l(p, up[1]), l(p, dn[dn.length - 2]);
    });
  /* 三角框架 */ for (const k0 of [1, 2, 3, 4])
    mk((N, l, ch) => {
      const A = [0, 0],
        B = [1, -0.9],
        C = [1, 0.9],
        side = (P, Q, big) =>
          Array.from({ length: k0 + 1 }, (_, k) => [
            P[0] + ((Q[0] - P[0]) * k) / k0,
            P[1] + ((Q[1] - P[1]) * k) / k0,
            big && k === k0 ? 1 : 0
          ]);
      const s1 = side(A, B, 1).map(q => N(...q)),
        s2 = side(B, C)
          .slice(1)
          .map(q => N(...q)),
        s3 = side(C, A, 0)
          .slice(1, -1)
          .map(q => N(...q));
      ch([...s1, ...s2, ...s3, s1[0]]);
    });
  /* 皇冠：橫帶伸出尖刺 */ for (const sp of [1, 2, 3, 4])
    mk((N, l, ch) => {
      const band = [];
      for (let k = 0; k <= sp * 2; k++) band.push(N(0.3, -0.9 + (k * 1.8) / (sp * 2)));
      ch(band);
      for (let k = 0; k <= sp * 2; k += 2) {
        const a = N(0.65, band.length && -0.9 + (k * 1.8) / (sp * 2)),
          b = N(1, -0.9 + (k * 1.8) / (sp * 2), 1);
        l(band[k], a), l(a, b);
      }
    });
  /* 蝴蝶：一大一小的翅膀 */ for (const big of [1, 1.4, 1.7, 2])
    mk((N, l) => {
      const c = N(0.5, 0),
        w1 = ringPts(5, 0.5, -0.5 * big * 0.6, 0.3, 0.45 * big * 0.6, 0, 2).map(q => N(...q)),
        w2 = ringPts(3, 0.5, 0.45, 0.2, 0.3, 0, 1).map(q => N(...q));
      w1.forEach((id, k) => l(id, w1[(k + 1) % 5])), w2.forEach((id, k) => l(id, w2[(k + 1) % 3]));
      l(c, w1[0]), l(c, w2[0]);
    });
  /* 十字 */ for (const len of [1, 2, 3, 4])
    mk((N, l, ch) => {
      const c = N(0.5, 0, 1),
        arm = (du, dv) =>
          ch([
            c,
            ...Array.from({ length: len }, (_, k) =>
              N(0.5 + (du * (k + 1)) / len, (dv * (k + 1)) / len, k === len - 1 && dv ? 1 : 0)
            )
          ]);
      arm(0.5, 0), arm(-0.5, 0), arm(0, 0.9), arm(0, -0.9);
    });
  /* 多邊形帶一條弦 */ for (const n of [5, 6, 7, 9])
    mk((N, l) => {
      const rg = ringPts(n, 0.5, 0, 0.48, 0.92, Math.PI, Math.floor(n / 2)).map(q => N(...q));
      rg.forEach((id, k) => l(id, rg[(k + 1) % n]));
      l(rg[1], rg[n - 2]);
    });
  /* 彗星：一個環拖著尾巴 */ for (const n of [3, 4, 5, 6])
    mk((N, l, ch) => {
      const rg = ringPts(n, 0.72, 0, 0.25, 0.6, Math.PI, Math.floor(n / 2)).map(q => N(...q));
      rg.forEach((id, k) => l(id, rg[(k + 1) % n]));
      const tail = [N(0, 0.3), N(0.22, 0.15), rg[0]];
      ch(tail);
    });
  /* 雙輪 */ for (const off of [0, 0.5, 0.75, 1])
    mk((N, l) => {
      const a = N(0.28, -0.35 * off, 1),
        b = N(0.75, 0.4 * off),
        ra = ringPts(5, 0.28, -0.35 * off, 0.2, 0.42, 0).map(q => N(...q)),
        rb = ringPts(5, 0.75, 0.4 * off, 0.2, 0.42, 0, 2).map(q => N(...q));
      ra.forEach((id, k) => l(id, ra[(k + 1) % 5])), rb.forEach((id, k) => l(id, rb[(k + 1) % 5]));
      l(a, ra[0]), l(b, rb[3]), l(ra[0], rb[3]);
    });
  /* 三叉 */ for (const pr of [2, 3, 4, 5])
    mk((N, l, ch) => {
      const s = [N(0, 0), N(0.35, 0)];
      ch(s);
      const bar = Array.from({ length: pr }, (_, k) => N(0.45, -0.9 + (k * 1.8) / (pr - 1)));
      ch(bar);
      l(s[1], bar[Math.floor(pr / 2)]);
      bar.forEach((b, k) => l(b, N(0.95, -0.9 + (k * 1.8) / (pr - 1), k % 2 ? 0 : 1)));
    });
  /* 蛇：S 形 */ for (const n of [5, 7, 9, 11])
    mk((N, l, ch) =>
      ch(
        Array.from({ length: n }, (_, k) =>
          N(k / (n - 1), Math.sin((k / (n - 1)) * TAU2) * 0.85, k === n - 1 || k === Math.floor(n / 3) ? 1 : 0)
        )
      )
    );
  /* 箭頭（人字） */ for (const d of [1, 2, 3, 4])
    mk((N, l, ch) => {
      const tip = N(1, 0, 1),
        up = [tip],
        dn = [tip];
      for (let k = 1; k <= d; k++) up.push(N(1 - k * 0.3, -k * 0.3)), dn.push(N(1 - k * 0.3, k * 0.3));
      ch(up), ch(dn);
      const shaft = [tip];
      for (let k = 1; k <= d + 1; k++) shaft.push(N(1 - k * 0.28, 0, k === d + 1 ? 1 : 0));
      ch(shaft);
    });
  /* 鑰匙：一個環、桿子、齒 */ for (const t of [1, 2, 3, 4])
    mk((N, l, ch) => {
      const rg = ringPts(5, 0.18, 0, 0.17, 0.45, 0, 2).map(q => N(...q));
      rg.forEach((id, k) => l(id, rg[(k + 1) % 5]));
      const shaft = [rg[0]];
      for (let k = 1; k <= 3; k++) shaft.push(N(0.35 + k * 0.2, 0));
      ch(shaft);
      for (let k = 0; k < t; k++) l(shaft[3 - k], N(0.95 - k * 0.2, 0.55, k === 0 ? 1 : 0));
    });
  /* 環＋內三角 */ for (const n of [6, 8, 9, 12])
    mk((N, l) => {
      const rg = ringPts(n, 0.5, 0, 0.48, 0.95, Math.PI, 0).map(q => N(...q));
      rg.forEach((id, k) => l(id, rg[(k + 1) % n]));
      const t = [0, Math.round(n / 3), Math.round((2 * n) / 3)];
      t.forEach((a, k) => l(rg[a], rg[t[(k + 1) % 3]]));
    });
  /* 同心雙環 */ for (const [a, b] of [
    [3, 6],
    [4, 8],
    [5, 10],
    [3, 9]
  ])
    mk((N, l) => {
      const ri = ringPts(a, 0.5, 0, 0.2, 0.4, 0, 0).map(q => N(...q)),
        ro = ringPts(b, 0.5, 0, 0.48, 0.95, 0, b - 1).map(q => N(...q));
      ri.forEach((id, k) => l(id, ri[(k + 1) % a]));
      ro.forEach((id, k) => l(id, ro[(k + 1) % b]));
      for (let k = 0; k < a; k++) l(ri[k], ro[(k * b) / a]);
    });
  /* 膠囊（燈籠）：兩道弧＋中間一條直線 */ for (const kk of [2, 3, 4, 5])
    mk((N, l, ch) => {
      const top = N(0, 0),
        bot = N(1, 0),
        L = [top],
        Rr = [top],
        mid = [top];
      for (let k = 1; k < kk + 1; k++) {
        const u = k / (kk + 1);
        L.push(N(u, -Math.sin(u * Math.PI) * 0.9));
        Rr.push(N(u, Math.sin(u * Math.PI) * 0.9));
        if (k % 2) mid.push(N(u, 0, k === 1 ? 1 : 0));
      }
      L.push(bot), Rr.push(bot), mid.push(bot);
      ch(L), ch(Rr), ch(mid);
    });
  /* 放射：中間大點，幾條兩節的射線 */ for (const rays of [3, 4, 6, 7])
    mk((N, l) => {
      const c = N(0.5, 0, 1);
      for (let k = 0; k < rays; k++) {
        const a = (k / rays) * TAU2,
          m = N(0.5 + Math.cos(a) * 0.24, Math.sin(a) * 0.48),
          t = N(0.5 + Math.cos(a) * 0.48, Math.sin(a) * 0.95, k === 0 ? 1 : 0);
        l(c, m), l(m, t);
      }
    });
  return out;
})();
const PT_R0 = 470;
const PTREE = (() => {
  const N = [],
    E = [],
    I = {},
    deg = Math.PI / 180,
    add = o => ((I[o.id] = o), N.push(o), o),
    link = (a, b) => E.push([a.id, b.id]),
    pol = (a, r) => [Math.cos(a) * r, Math.sin(a) * r];
  const NR = PT_THEME.length,
    STEP = 360 / NR;
  /* 小點的數值：主題 70%、隔壁主題 30%（每個方向偏重一種體系，但不會全部都是那個） */
  const smallOf = (ti, k) => {
    const T = PT_THEME[ti],
      sj = (ti + (k % 2 ? 1 : NR - 1)) % NR,
      side = PT_THEME[sj];
    return k % 10 < 7 ? { s: T.sm[k % T.sm.length], th: ti } : { s: side.sm[k % side.sm.length], th: sj };
  };
  const near = (x, y, d) => N.some(o => Math.hypot(o.x - x, o.y - y) < d);
  const SUFFIX = ['之心', '之道', '極意', '奧義', '秘訣', '真髓', '之魂', '心法', '之印', '之誓', '領悟', '妙法'],
    CONDS = [
      { lowHp: 30 },
      { fullHp: 20 },
      { esUp: 20 },
      { afterRoll: 25 },
      { bossP: 20 },
      { closeP: 20 },
      { farP: 20 },
      { killHeal: 8 },
      { lowHpRed: 12 },
      { crit: 4 },
      { as: 6 },
      { hpP: 8 },
      { resA: 8 },
      { ms: 5 },
      { aoe: 10 },
      { cdr: 6 },
      { spirit: 10 },
      { es: 30 }
    ],
    COST = [{ hpP: -8 }, { ms: -6 }, { resA: -8 }, { armorP: -20 }, { mpP: -12 }],
    used = new Set();
  let ntK = 0;
  /* 第一個大點用手寫的（名字有特色），之後的照「主屬性 × 深度＋條件」組出來 */
  const notableOf = (ti, depth) => {
    const T = PT_THEME[ti],
      k = ntK++;
    if (k % 5 === 0) {
      const [n, st] = T.nt[(k / 5) % T.nt.length];
      if (!used.has(n)) return used.add(n), { n, s: st };
    }
    const [mk] = Object.keys(T.sm[0]),
      base = T.sm[0][mk] * 4 * depth,
      power = k % 4 === 3,
      st = { [mk]: Math.round(base * (power ? 2.2 : 1)) };
    const extra = power ? COST[k % COST.length] : CONDS[(k * 7 + ti * 3) % CONDS.length];
    for (const ck in extra) st[ck] = (st[ck] || 0) + Math.round(extra[ck] * (power ? 1 : depth));
    const words = [T.n, ...T.nt.map(x => x[0])];
    let n = '';
    for (let t = 0; !n || used.has(n); t++)
      n =
        words[(k + t) % words.length] +
        SUFFIX[(k * 5 + t * 3 + ti) % SUFFIX.length] +
        (t >= 60 ? ['', ' II', ' III', ' IV', ' V', ' VI'][Math.min(5, Math.floor(t / 60))] : '');
    used.add(n);
    return { n, s: st, power };
  };
  /* 照 PoE2：沒有大格網。拼塊一塊挨一塊排得很密，相鄰的拼塊直接相連（過路點很少，遠一點的才補 1～2 個）；
     六個方向各有自己的樣子：堡壘（多圈大輪盤）、戰陣（直線拼塊朝外排）、疾風（弧、蛇、鋸齒順著繞）、
     機關（小而密的多邊形）、星界（星、花、放射、帶輻條的軌道）、靈能（小泡泡） */
  const hsh = i => ((Math.imul(i + 7, 2654435761) >>> 0) % 1000) / 1000,
    thAt = (x, y) => Math.floor((((Math.atan2(y, x) * 180) / Math.PI + 90 + 360) % 360) / STEP) % NR,
    RMAX = 2250;
  const par = {},
    find = a => (par[a] === a || par[a] === undefined ? ((par[a] = a), a) : (par[a] = find(par[a]))),
    uni = (a, b) => (par[find(a)] = find(b));
  /* 起點：6 個門（免費），不連成環 */
  for (let g = 0; g < 6; g++) {
    const a = (g * 60 - 90) * deg,
      [x, y] = pol(a, PT_R0),
      th = thAt(x, y);
    add({ id: 'g' + g, x, y, n: PT_THEME[th].n + '之門', ic: PT_THEME[th].ic, s: {}, big: 1, gate: 1, th });
  }
  /* 主題 → 區域風格 */
  const REG = [0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5],
    O = PT_ORBITS,
    fam = (...ks) => ks.flatMap(k => [0, 1, 2, 3].map(j => PT_PIECES[k * 4 + j])),
    small = o => o.f.full && o.pts.length < 8,
    wheel = o => o.f.full && o.pts.length >= 8 && (o.f.no >= 3 || o.f.full >= 2),
    STY = [
      { lib: [...O.filter(wheel), ...fam(0, 19, 25, 24)], base: 120, gap: 64, rot: 0 },
      { lib: fam(1, 16, 20, 22, 23, 8, 10), base: 100, gap: 44, rot: 1 },
      { lib: [...O.filter(o => !o.f.full), ...fam(5, 9, 21, 18, 2)], base: 100, gap: 50, rot: 2 },
      { lib: fam(17, 13, 11, 12, 14, 6, 26), base: 80, gap: 40, rot: 0 },
      {
        lib: [...O.filter(o => o.f.full && !small(o) && !wheel(o)), ...fam(3, 7, 27, 4, 15)],
        base: 110,
        gap: 56,
        rot: 0
      },
      { lib: O.filter(small), base: 90, gap: 58, rot: 0 }
    ].map((St, ri) => {
      St.lib = St.lib
        .map(p => {
          let d = 9;
          for (let x = 0; x < p.pts.length; x++)
            for (let y = x + 1; y < p.pts.length; y++)
              d = Math.min(d, Math.hypot(p.pts[x][0] - p.pts[y][0], p.pts[x][1] - p.pts[y][1]));
          const sc = Math.max(St.base, 40 / d);
          return { p, sc, R: sc * Math.max(...p.pts.map(q => Math.hypot(q[0], q[1]))) };
        })
        .filter(o => {
          /* 拼塊本身要連成一塊 */
          const seen = new Set([0]),
            q = [0];
          while (q.length) {
            const a = q.pop();
            for (const [x, y] of o.p.e)
              for (const [u, v] of [
                [x, y],
                [y, x]
              ])
                if (u === a && !seen.has(v)) seen.add(v), q.push(v);
          }
          return o.R < 330 && seen.size === o.p.pts.length;
        })
        .sort((a, b) => hsh(a.R * 7 + ri) - hsh(b.R * 7 + ri));
      St.q = [...St.lib];
      St.round = 0;
      return St;
    });
  /* 擺拼塊：從裡往外一圈一圈掃，放得下就放（每區先用完自己的形狀，用完才鏡像再用） */
  const cl = [];
  for (let r = PT_R0 + 150; r < RMAX; r += 30) {
    const steps = Math.ceil((Math.PI * 2 * r) / 30),
      off = hsh(r) * Math.PI * 2;
    for (let k = 0; k < steps; k++) {
      const a = off + (k / steps) * Math.PI * 2,
        x = Math.cos(a) * r,
        y = Math.sin(a) * r,
        th = thAt(x, y),
        ri = REG[th],
        St = STY[ri];
      if (!St.q.length) (St.q = [...St.lib]), St.round++;
      /* 這裡最多放得下多大的拼塊 */
      let room = Math.min(r - PT_R0 - 70, RMAX - r, 330);
      for (const c of cl) {
        const dx = c.x - x,
          dy = c.y - y,
          lim = room + c.R + 64;
        if (room <= 0) break;
        if (dx > lim || dx < -lim || dy > lim || dy < -lim) continue;
        room = Math.min(room, Math.sqrt(dx * dx + dy * dy) - c.R - Math.max(c.gap, St.gap));
      }
      if (room <= 0) continue;
      const pick = St.q.slice(0, 6).findIndex(U => U.R <= room);
      if (pick < 0) continue;
      const U = St.q.splice(pick, 1)[0];
      cl.push({
        x,
        y,
        R: U.R,
        U,
        gap: St.gap,
        th,
        mir: St.round % 2 ? -1 : 1,
        rot: St.rot === 1 ? a : St.rot === 2 ? a + Math.PI / 2 : hsh(cl.length * 31 + 5) * Math.PI * 2,
        id: 'k' + cl.length
      });
    }
  }
  /* 拼塊的點 */
  const ARC = {};
  for (const c of cl) {
    const dep = 1 + (Math.hypot(c.x, c.y) / RMAX) * 0.8,
      sc = c.U.sc,
      at = ([u, v]) => [
        c.x + (Math.cos(c.rot) * u - Math.sin(c.rot) * v * c.mir) * sc,
        c.y + (Math.sin(c.rot) * u + Math.cos(c.rot) * v * c.mir) * sc
      ];
    c.nodes = c.U.p.pts.map(([u, v, big], k) => {
      const [x, y] = at([u, v]);
      if (big) {
        const nt = notableOf(c.th, dep);
        return add({
          id: `${c.id}_${k}`,
          x,
          y,
          n: nt.n,
          ic: PT_THEME[c.th].ic,
          s: nt.s,
          big: 1,
          power: nt.power,
          th: c.th
        });
      }
      const o = smallOf(c.th, k + N.length);
      return add({ id: `${c.id}_${k}`, x, y, n: PT_THEME[o.th].n, s: o.s, big: 0, th: o.th });
    });
    c.U.p.e.forEach(([p, q], k) => {
      const A = c.nodes[p],
        B = c.nodes[q];
      link(A, B);
      uni(A.id, B.id);
      const a = c.U.p.arc && c.U.p.arc[k];
      if (a) ARC[A.id + '|' + B.id] = ARC[B.id + '|' + A.id] = [c.x, c.y, a[2] * sc];
    });
  }
  /* 拼塊之間的連線：相鄰（中間沒有別塊擋著）的才連，先連成一棵樹保證走得到，其他的留一半當岔路 */
  const segD = (P, A, B) => {
    const dx = B.x - A.x,
      dy = B.y - A.y,
      f = Math.max(0, Math.min(1, ((P.x - A.x) * dx + (P.y - A.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(P.x - A.x - dx * f, P.y - A.y - dy * f);
  };
  const gates = [0, 1, 2, 3, 4, 5].map(g => ({ x: I['g' + g].x, y: I['g' + g].y, R: 0, nodes: [I['g' + g]], gate: 1 })),
    all = [...gates, ...cl],
    dc = (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
    cand = [];
  for (let i = 0; i < all.length; i++)
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i],
        b = all[j],
        d = dc(a, b);
      if ((a.gate && b.gate) || d > a.R + b.R + 300) continue;
      if (all.some((k, kk) => kk !== i && kk !== j && Math.max(dc(a, k), dc(k, b)) < d)) continue;
      let best = null;
      for (const A of a.nodes)
        for (const B of b.nodes) {
          const L = Math.hypot(A.x - B.x, A.y - B.y),
            cost = L + (A.big && !A.gate ? 60 : 0) + (B.big && !B.gate ? 60 : 0);
          if (!best || cost < best[3]) best = [A, B, L, cost];
        }
      if (cl.some(k => k !== a && k !== b && segD(k, best[0], best[1]) < k.R * 0.8)) continue;
      cand.push([...best, i, j]);
    }
  cand.sort((p, q) => p[3] - q[3]);
  const gp = {},
    gf = a => (gp[a] === undefined || gp[a] === a ? ((gp[a] = a), a) : (gp[a] = gf(gp[a]))),
    gDeg = {},
    use = [];
  for (const c of cand) {
    const [, , , , i, j] = c;
    if (gf(i) !== gf(j))
      (gp[gf(i)] = gf(j)), use.push(c), (gDeg[i] = (gDeg[i] || 0) + 1), (gDeg[j] = (gDeg[j] || 0) + 1);
    else if (hsh(i * 97 + j) < 0.5 || (i < 6 && (gDeg[i] || 0) < 2)) use.push(c), (gDeg[i] = (gDeg[i] || 0) + 1);
  }
  /* 連線太長才在中間補過路點（每 150 一個） */
  for (const [A, B, L] of use) {
    const n = Math.floor(L / 150);
    let prev = A;
    for (let k = 1; k <= n; k++) {
      const f = k / (n + 1),
        x = A.x + (B.x - A.x) * f,
        y = A.y + (B.y - A.y) * f;
      if (near(x, y, 36)) continue;
      const o = smallOf(A.th, k + N.length),
        nd = add({ id: 'x' + N.length, x, y, n: PT_THEME[o.th].n, s: o.s, big: 0, th: o.th });
      link(prev, nd);
      uni(prev.id, nd.id);
      prev = nd;
    }
    link(prev, B);
    uni(prev.id, B.id);
  }
  /* 被擋住沒連上的拼塊：接到最近的已連通點 */
  for (const c of cl) {
    if (find(c.nodes[0].id) === find('g0')) continue;
    let best = null;
    for (const A of c.nodes)
      for (const B of N)
        if (!B.gate && find(B.id) === find('g0')) {
          const L = Math.hypot(A.x - B.x, A.y - B.y);
          if (!best || L < best[2]) best = [A, B, L];
        }
    link(best[0], best[1]);
    uni(best[0].id, best[1].id);
  }
  const ADJ = {};
  for (const [a, b] of E) (ADJ[a] = ADJ[a] || []).push(b), (ADJ[b] = ADJ[b] || []).push(a);
  return { N, E, I, ADJ, ARC };
})();
const PT_START = ['g0', 'g1', 'g2', 'g3', 'g4', 'g5'];
const ptPoints = lv => lv - 1;

/* ---------- 昇華（0.2.3，照 PoE）：藏身處的昇華石碑選，點在天賦樹中間挖空的地方 ----------
   一開始 2 點，第一次打倒階級 6、12、16 的王各 +2，共 8 點；嚴格 4 小 4 大（一小一大交錯，路線起點與中間都有分岔） */
const ascPoints = s => 2 + (s.maxT > 6 ? 2 : 0) + (s.maxT > 12 ? 2 : 0) + (s.t16 ? 2 : 0);
/* 每條分支自己的圖案（st 入口免費；s 小點、b 大點；連線一律一小一大） */
const pol2 = (deg, r) => [
  Math.round(Math.cos((deg * Math.PI) / 180) * r),
  Math.round(Math.sin((deg * Math.PI) / 180) * r)
];
const ASC = {
  sword: {
    n: '劍士',
    ic: 'cls_swordsman',
    d: '用劍的近戰職業：三條分支各走不同的打法。',
    br: {
      ronin: {
        n: '浪人',
        ic: 'it_c_swordsman_0',
        d: '居合：累積架勢，一刀定勝負',
        /* 劍形：護手（左右兩條路）→ 刀身 → 分岔 → 刀尖 */
        pos: {
          st: [0, 330],
          s1: [-95, 250],
          s2: [95, 250],
          b1: [-110, 150],
          b2: [110, 150],
          s3: [0, 60],
          b3: [0, -40],
          s4: [-95, -110],
          s5: [95, -110],
          b4: [-95, -205],
          b5: [95, -205],
          s6: [0, -270],
          b6: [0, -365]
        },
        edges: [
          ['st', 's1'],
          ['st', 's2'],
          ['s1', 'b1'],
          ['s2', 'b2'],
          ['b1', 's3'],
          ['b2', 's3'],
          ['s3', 'b3'],
          ['b3', 's4'],
          ['b3', 's5'],
          ['s4', 'b4'],
          ['s5', 'b5'],
          ['b4', 's6'],
          ['b5', 's6'],
          ['s6', 'b6']
        ],
        small: {
          s1: { as: 6 },
          s2: { meleeP: 12 },
          s3: { crit: 3 },
          s4: { as: 4, meleeP: 6 },
          s5: { ms: 5 },
          s6: { critX: 20 }
        },
        big: {
          b1: {
            n: '架勢',
            fx: { 'ronin.mech': 1 },
            d: '出手打中 +1 層架勢，滿 5 層的下一次出手是「居合」：傷害 ×3、必定暴擊'
          },
          b2: { n: '刀氣', fx: { 'ronin.aura': 30 }, d: '近戰技能範圍 +30%、近戰傷害 +15%' },
          b3: { n: '斬鐵', fx: { 'ronin.iron': 5 }, d: '居合的傷害 ×3 → ×5' },
          b4: { n: '燕返', fx: { 'ronin.swallow': 1 }, d: '居合之後馬上再砍一次（同樣的傷害）' },
          b5: { n: '一閃', fx: { 'ronin.flash': 30 }, d: '見切（出手瞬間翻滾）後架勢直接滿，2 秒內移動速度 +30%' },
          b6: { n: '明鏡止水', fx: { 'ronin.mirror': 8, 'ronin.gale': 3 }, d: '架勢只要 3 層；居合命中回 8% 生命' }
        }
      },
      rapier: {
        n: '刃舞者',
        ic: 'it_c_swordsman_3',
        d: '細劍之舞：見切反擊、破綻、步法，越靈活越痛',
        /* 三片旋轉的花瓣：中心往三個方向，每片再往外轉一點 */
        pos: {
          st: [0, 0],
          s1: pol2(-90, 95),
          b1: pol2(-90, 190),
          s2: pol2(30, 95),
          b2: pol2(30, 190),
          s3: pol2(150, 95),
          b3: pol2(150, 190),
          s4: pol2(-55, 275),
          b4: pol2(-35, 365),
          s5: pol2(65, 275),
          b5: pol2(85, 365),
          s6: pol2(185, 275),
          b6: pol2(205, 365)
        },
        edges: [
          ['st', 's1'],
          ['st', 's2'],
          ['st', 's3'],
          ['s1', 'b1'],
          ['s2', 'b2'],
          ['s3', 'b3'],
          ['b1', 's4'],
          ['s4', 'b4'],
          ['b2', 's5'],
          ['s5', 'b5'],
          ['b3', 's6'],
          ['s6', 'b6']
        ],
        small: {
          s1: { crit: 3 },
          s2: { as: 6 },
          s3: { block: 4 },
          s4: { critX: 15 },
          s5: { ms: 6 },
          s6: { crit: 2, as: 4 }
        },
        big: {
          b1: { n: '反擊', fx: { 'rapier.riposte': 2 }, d: '見切時立刻反擊周圍的敵人（左鍵技能 ×2 傷害，必定暴擊）' },
          b2: { n: '致命節奏', fx: { 'rapier.rhythm': 4 }, d: '每第 4 次出手必定暴擊' },
          b3: { n: '格擋大師', fx: { 'rapier.parry': 1.5 }, d: '格擋 +15%；格擋時反擊周圍（×1.5 傷害）' },
          b4: { n: '破綻', fx: { 'rapier.expose': 20 }, d: '暴擊的敵人 4 秒內受到的傷害 +20%' },
          b5: { n: '步法', fx: { 'rapier.step': 30 }, d: '翻滾冷卻 -40%；翻滾後 2 秒攻速 +30%' },
          b6: { n: '千刺', fx: { 'rapier.flurry': 3 }, d: '近戰技能出手時多刺出 3 道劍氣（投射物，傷害 ×0.5）' }
        }
      },
      spell: {
        n: '魔劍士',
        ic: 'it_c_storm_0',
        d: '劍＋元素附魔：法術與劍互相強化，靠能量護盾與光環撐場',
        /* 一圈軌道：兩邊繞上去在頂端會合，中間再掛一個核心 */
        pos: {
          st: [0, 320],
          s1: [-150, 250],
          s2: [150, 250],
          b1: [-255, 125],
          b2: [255, 125],
          s3: [-270, -25],
          s4: [270, -25],
          b3: [-195, -170],
          b4: [195, -170],
          s5: [0, -235],
          b5: [0, -345],
          s6: [0, 120],
          b6: [0, 10]
        },
        edges: [
          ['st', 's1'],
          ['st', 's2'],
          ['s1', 'b1'],
          ['s2', 'b2'],
          ['b1', 's3'],
          ['b2', 's4'],
          ['s3', 'b3'],
          ['s4', 'b4'],
          ['b3', 's5'],
          ['b4', 's5'],
          ['s5', 'b5'],
          ['b1', 's6'],
          ['b2', 's6'],
          ['s6', 'b6']
        ],
        small: {
          s1: { spellP: 10 },
          s2: { meleeP: 10 },
          s3: { esP: 15 },
          s4: { eleP: 12 },
          s5: { spirit: 10 },
          s6: { as: 4, spellP: 6 }
        },
        big: {
          b1: {
            n: '附魔之刃',
            fx: { 'spell.enchant': 40 },
            d: '放法術後 4 秒內，近戰攻擊附加那個法術屬性的傷害（武器傷害 40%）'
          },
          b2: { n: '魔力之刃', fx: { 'spell.arcane': 1 }, d: '法術傷害加成也套用到近戰；近戰打中回 1 點魔力' },
          b3: {
            n: '劍氣',
            fx: { 'spell.wave': 25 },
            d: '近戰打中時 25% 機率射出一道元素劍氣（附魔的屬性，傷害 ×0.8）'
          },
          b4: { n: '秘法護盾', fx: { 'spell.ward': 40 }, d: '能量護盾 +40%，受傷 1 秒後就開始回充（原本 2 秒）' },
          b5: { n: '元素穿透', fx: { 'spell.pen': 20 }, d: '元素傷害 +20%，而且無視怪物對自己屬性的抗性' },
          b6: { n: '魔導之心', fx: { 'spell.heart': 30 }, d: '精魄 +30、光環效果 +25%' }
        }
      }
    }
  }
};
/* 選好的分支的節點（放在天賦樹中間） */
function ascNodes(br) {
  const B = br && ASC.sword.br[br];
  if (!B) return null;
  const N = Object.entries(B.pos).map(([k, [x, y]]) => {
    const big = B.big[k];
    return {
      id: 'a_' + k,
      k,
      x,
      y,
      asc: 1,
      big: k === 'st' ? 3 : big ? 1 : 0,
      n: k === 'st' ? B.n : big ? big.n : B.n,
      ic: k === 'st' || big ? B.ic : null,
      s: B.small[k] || {},
      fx: big ? big.fx : null,
      d: big ? big.d : ''
    };
  });
  return { N, E: B.edges.map(([a, b]) => ['a_' + a, 'a_' + b]), I: Object.fromEntries(N.map(n => [n.id, n])) };
}

const ROLL = { t: 0.32, dist: 175, iframe: 0.26, cd: 0.55, perfect: 0.16, slow: 0.55, slowScale: 0.3 };
const FLASK = { n: 3, heal: 0.5, t: 1.4, perKill: 0.12 };

/* ---------- 地圖：階級 1～16，打倒王開放下一階；階級 t 花 t-1 個碎片 ---------- */
const TMAX = 16;
const mapCost = t => t - 1;
/* 怪物等級：生命、傷害跟著階級長 */
const tierMul = t => ({ hp: Math.pow(1.32, t - 1), dmg: Math.pow(1.2, t - 1) });
const tierIlvl = t => t;

/* ---------- 抗性 ---------- */
const RESK = ['fire', 'cold', 'light', 'chaos'];
/* 武器種類：矛的近戰距離 +25%、棍打中回 1 魔力 */
const WTN = { sword: '劍', spear: '矛', staff: '棍' };
const ELN = { phys: '物理', fire: '火焰', cold: '冰冷', light: '閃電', chaos: '混沌' };
const ELC = { phys: '#fff3e0', fire: '#ff8a4c', cold: '#8fd6ff', light: '#ffe066', chaos: '#c38bff' };
const RES_CAP = 75;

/* ---------- 裝備 ---------- */
/* 裝備欄：k 欄位、t 能放的種類、n 名稱 */
const EQS = [
  { k: 'weapon', t: 'weapon', n: '武器' },
  { k: 'off', t: 'shield', n: '副手' },
  { k: 'helm', t: 'helm', n: '頭盔' },
  { k: 'chest', t: 'chest', n: '胸甲' },
  { k: 'gloves', t: 'gloves', n: '手套' },
  { k: 'boots', t: 'boots', n: '鞋子' },
  { k: 'belt', t: 'belt', n: '腰帶' },
  { k: 'amulet', t: 'amulet', n: '護身符' },
  { k: 'ring1', t: 'ring', n: '戒指' },
  { k: 'ring2', t: 'ring', n: '戒指' }
];
/* 種類：大小（格）、圖示前綴、可以出現的詞綴 */
const KINDS = {
  weapon: {
    n: '武器',
    sz: [1, 3],
    aff: ['dmgP', 'flat', 'fire', 'cold', 'light', 'chaos', 'as', 'crit', 'critX', 'loh']
  },
  shield: { n: '盾', sz: [2, 2], aff: ['life', 'armor', 'block', 'resF', 'resC', 'resL', 'resX', 'resA', 'es'] },
  helm: {
    n: '頭盔',
    sz: [2, 2],
    aff: ['life', 'armor', 'mp', 'crit', 'aoe', 'resF', 'resC', 'resL', 'resX', 'es', 'spirit']
  },
  chest: { n: '胸甲', sz: [2, 3], aff: ['life', 'armor', 'regen', 'resF', 'resC', 'resL', 'resX', 'es', 'spirit'] },
  gloves: {
    n: '手套',
    sz: [2, 2],
    aff: ['life', 'armor', 'flat', 'fire', 'cold', 'light', 'as', 'loh', 'resF', 'resC', 'resL', 'es']
  },
  boots: { n: '鞋子', sz: [2, 2], aff: ['life', 'armor', 'ms', 'resF', 'resC', 'resL', 'resX', 'es'] },
  belt: { n: '腰帶', sz: [2, 1], aff: ['life', 'armor', 'mp', 'regen', 'flask', 'resF', 'resC', 'resL', 'resX'] },
  ring: {
    n: '戒指',
    sz: [1, 1],
    aff: [
      'life',
      'mp',
      'flat',
      'fire',
      'cold',
      'light',
      'as',
      'crit',
      'regen',
      'resF',
      'resC',
      'resL',
      'resX',
      'resA',
      'es'
    ]
  },
  amulet: {
    n: '護身符',
    sz: [1, 1],
    aff: ['life', 'mp', 'dmgP', 'crit', 'critX', 'aoe', 'regen', 'resA', 'es', 'spirit']
  }
};
/* 底材：lv 從幾階開始掉、ic 圖示、b 固定數值（武器：物理傷害、攻速；防具：護甲；飾品：固定詞綴） */
const BASES = [
  { id: 'w_short', k: 'weapon', n: '短刀', lv: 1, ic: 'gear_weapon_0', b: { dmg: [4, 9], as: 1.3 } },
  { id: 'w_katana', k: 'weapon', n: '打刀', lv: 1, ic: 'gear_weapon_18', b: { dmg: [6, 13], as: 1.15 } },
  { id: 'w_nodachi', k: 'weapon', n: '野太刀', lv: 4, ic: 'gear_weapon_5', b: { dmg: [14, 26], as: 0.95 } },
  { id: 'w_kris', k: 'weapon', n: '蛇紋刃', lv: 7, ic: 'gear_weapon_28', b: { dmg: [12, 22], as: 1.35 } },
  { id: 'w_moon', k: 'weapon', n: '月影刀', lv: 10, ic: 'gear_weapon_17', b: { dmg: [24, 42], as: 1.15 } },
  { id: 'w_demon', k: 'weapon', n: '妖刀', lv: 14, ic: 'gear_weapon_20', b: { dmg: [34, 62], as: 1.1 } },
  { id: 'w_spear', k: 'weapon', n: '短矛', lv: 1, ic: 'gear_weapon_9', wt: 'spear', b: { dmg: [5, 12], as: 1.2 } },
  {
    id: 'w_trident',
    k: 'weapon',
    n: '三叉戟',
    lv: 6,
    ic: 'gear_weapon_29',
    wt: 'spear',
    b: { dmg: [12, 26], as: 1.15 }
  },
  {
    id: 'w_glaive',
    k: 'weapon',
    n: '偃月矛',
    lv: 12,
    ic: 'gear_weapon_30',
    wt: 'spear',
    b: { dmg: [26, 48], as: 1.1 }
  },
  { id: 'w_staff', k: 'weapon', n: '長棍', lv: 1, ic: 'gear_weapon_4', wt: 'staff', b: { dmg: [6, 12], as: 1.3 } },
  {
    id: 'w_ironstaff',
    k: 'weapon',
    n: '鐵棍',
    lv: 6,
    ic: 'gear_weapon_15',
    wt: 'staff',
    b: { dmg: [11, 23], as: 1.3 }
  },
  {
    id: 'w_demonstaff',
    k: 'weapon',
    n: '降魔杖',
    lv: 13,
    ic: 'gear_weapon_31',
    wt: 'staff',
    b: { dmg: [24, 44], as: 1.25 }
  },
  { id: 's_wood', k: 'shield', n: '木盾', lv: 1, ic: 'gear_offhand_2', b: { armor: 12, block: 10 } },
  { id: 's_iron', k: 'shield', n: '鐵盾', lv: 6, ic: 'gear_offhand_8', b: { armor: 40, block: 14 } },
  { id: 's_orb', k: 'shield', n: '法珠', lv: 4, ic: 'gear_offhand_11', b: { es: 30 } },
  { id: 's_tower', k: 'shield', n: '塔盾', lv: 12, ic: 'gear_offhand_3', b: { armor: 95, block: 18 } },
  { id: 'h_cloth', k: 'helm', n: '頭巾', lv: 1, ic: 'gear_helm_5', b: { armor: 6 } },
  { id: 'h_iron', k: 'helm', n: '鐵盔', lv: 6, ic: 'gear_helm_1', b: { armor: 22 } },
  { id: 'h_circlet', k: 'helm', n: '頭冠', lv: 2, ic: 'gear_helm_7', b: { es: 20 } },
  { id: 'h_mitre', k: 'helm', n: '法冠', lv: 10, ic: 'gear_helm_10', b: { es: 60 } },
  { id: 'h_oni', k: 'helm', n: '鬼面盔', lv: 12, ic: 'gear_helm_9', b: { armor: 55 } },
  { id: 'c_leather', k: 'chest', n: '皮甲', lv: 1, ic: 'gear_chest_0', b: { armor: 14 } },
  { id: 'c_chain', k: 'chest', n: '鎖子甲', lv: 5, ic: 'gear_chest_1', b: { armor: 45 } },
  { id: 'c_robe', k: 'chest', n: '法袍', lv: 2, ic: 'gear_chest_2', b: { es: 35 } },
  { id: 'c_silk', k: 'chest', n: '天絲衣', lv: 9, ic: 'gear_chest_8', b: { es: 100 } },
  { id: 'c_plate', k: 'chest', n: '大鎧', lv: 11, ic: 'gear_chest_3', b: { armor: 110 } },
  { id: 'g_cloth', k: 'gloves', n: '布手套', lv: 1, ic: 'gear_gloves_0', b: { armor: 4 } },
  { id: 'g_silk', k: 'gloves', n: '絲手套', lv: 3, ic: 'gear_gloves_7', b: { es: 12 } },
  { id: 'g_iron', k: 'gloves', n: '鐵手甲', lv: 7, ic: 'gear_gloves_1', b: { armor: 18 } },
  { id: 'b_straw', k: 'boots', n: '草鞋', lv: 1, ic: 'gear_boots_4', b: { armor: 4 } },
  { id: 'b_cloth', k: 'boots', n: '布靴', lv: 3, ic: 'gear_boots_2', b: { es: 12 } },
  { id: 'b_iron', k: 'boots', n: '鐵脛靴', lv: 7, ic: 'gear_boots_1', b: { armor: 18 } },
  { id: 'bt_rope', k: 'belt', n: '繩帶', lv: 1, ic: 'gear_belt_0', b: { life: 10 } },
  { id: 'bt_leather', k: 'belt', n: '皮帶', lv: 6, ic: 'gear_belt_5', b: { life: 25 } },
  { id: 'r_iron', k: 'ring', n: '鐵戒', lv: 1, ic: 'gear_ring_5', b: { life: 6 } },
  { id: 'r_ruby', k: 'ring', n: '紅玉戒', lv: 3, ic: 'gear_ring_0', b: { resF: 12 } },
  { id: 'r_sapph', k: 'ring', n: '藍玉戒', lv: 3, ic: 'gear_ring_1', b: { resC: 12 } },
  { id: 'r_topaz', k: 'ring', n: '黃玉戒', lv: 3, ic: 'gear_ring_2', b: { resL: 12 } },
  { id: 'a_jade', k: 'amulet', n: '玉珮', lv: 1, ic: 'gear_amulet_1', b: { life: 12 } },
  { id: 'a_coral', k: 'amulet', n: '珊瑚墜', lv: 5, ic: 'gear_amulet_2', b: { regen: 2 } },
  { id: 'a_gold', k: 'amulet', n: '金鎖片', lv: 9, ic: 'gear_amulet_4', b: { crit: 8 } }
];
const BASEI = Object.fromEntries(BASES.map(b => [b.id, b]));

/* 詞綴：p 前綴（1）／後綴（0）、r：[T12 的最小, T1 的最大]、add 是「附加 a～b」兩個數 */
const AFF = {
  dmgP: { p: 1, n: '物理傷害 +{}%', r: [10, 170] },
  flat: { p: 1, n: '附加 {} 物理傷害', r: [1, 28], add: 1 },
  fire: { p: 1, n: '附加 {} 火焰傷害', r: [2, 40], add: 1 },
  cold: { p: 1, n: '附加 {} 冰冷傷害', r: [2, 36], add: 1 },
  light: { p: 1, n: '附加 {} 閃電傷害', r: [1, 48], add: 1 },
  chaos: { p: 1, n: '附加 {} 混沌傷害', r: [1, 30], add: 1 },
  life: { p: 1, n: '最大生命 +{}', r: [8, 120] },
  armor: { p: 1, n: '護甲 +{}', r: [6, 260] },
  mp: { p: 1, n: '最大魔力 +{}', r: [6, 70] },
  block: { p: 1, n: '格擋 +{}%', r: [2, 12] },
  as: { p: 0, n: '攻擊速度 +{}%', r: [4, 28] },
  crit: { p: 0, n: '暴擊率 +{}%', r: [2, 30] },
  critX: { p: 0, n: '暴擊傷害 +{}%', r: [8, 70] },
  regen: { p: 0, n: '每秒回復 {} 生命', r: [1, 30] },
  loh: { p: 0, n: '擊中回復 {} 生命', r: [1, 20] },
  ms: { p: 0, n: '移動速度 +{}%', r: [6, 32] },
  aoe: { p: 0, n: '範圍 +{}%', r: [5, 30] },
  flask: { p: 0, n: '藥水回復 +{}%', r: [10, 60] },
  resF: { p: 0, n: '火焰抗性 +{}%', r: [6, 48] },
  resC: { p: 0, n: '冰冷抗性 +{}%', r: [6, 48] },
  resL: { p: 0, n: '閃電抗性 +{}%', r: [6, 48] },
  resX: { p: 0, n: '混沌抗性 +{}%', r: [5, 35] },
  resA: { p: 0, n: '全部抗性 +{}%', r: [3, 18] },
  es: { p: 1, n: '能量護盾 +{}', r: [6, 140] },
  spirit: { p: 0, n: '精魄 +{}', r: [4, 30] }
};
/* T12（最低）～T1（最高）各一段；物品等級越高，能出現的最高階越高 */
function tierRange(k, T) {
  const [lo, hi] = AFF[k].r,
    step = (hi - lo) / 12,
    a = lo + step * (12 - T),
    b = a + step;
  return [Math.max(1, Math.round(a)), Math.max(1, Math.round(b))];
}
const bestTier = ilvl => Math.max(1, 12 - Math.floor(((ilvl - 1) * 11) / (TMAX - 1)));
const RARN = ['普通', '魔法', '稀有'];
const NAME_A = ['血', '鴉', '霜', '雷', '屍', '魂', '龍', '狼', '影', '骨', '焰', '夜', '鬼', '蛇', '鐵', '星'];
const NAME_B = ['之牙', '之爪', '之握', '之心', '之怒', '之歌', '之嚎', '之印', '之刃', '之殼', '之眼', '之息'];

/* ---------- 怪物：hp／dmg 是階級 1 的值，r 碰撞半徑、sz 畫的高度、ai 行為、el 屬性（抗自己的屬性） ---------- */
const MOBS = {
  slime: {
    n: '綠史萊姆',
    sp: 'm_slime_green',
    hp: 34,
    dmg: 9,
    spd: 95,
    r: 18,
    sz: 40,
    ai: 'melee',
    wind: 0.5,
    reach: 46,
    cd: 1.3,
    xp: 6
  },
  dog: {
    n: '流浪狗',
    sp: 'm_straydog',
    hp: 26,
    dmg: 8,
    spd: 200,
    r: 16,
    sz: 42,
    ai: 'lunge',
    wind: 0.38,
    reach: 230,
    cd: 1.6,
    xp: 6
  },
  bat: {
    n: '蝙蝠',
    sp: 'm_bat',
    hp: 14,
    dmg: 5,
    spd: 230,
    r: 13,
    sz: 34,
    ai: 'melee',
    wind: 0.28,
    reach: 36,
    cd: 0.9,
    xp: 3,
    fly: 1
  },
  fire: {
    n: '鬼火',
    sp: 'm_ghostfire',
    hp: 22,
    dmg: 10,
    spd: 120,
    r: 15,
    sz: 40,
    ai: 'ranged',
    wind: 0.55,
    reach: 330,
    cd: 2.0,
    xp: 7,
    fly: 1,
    el: 'fire'
  },
  wolf: {
    n: '雪原狼',
    sp: 'm_snowwolf',
    hp: 30,
    dmg: 9,
    spd: 210,
    r: 17,
    sz: 44,
    ai: 'lunge',
    wind: 0.36,
    reach: 220,
    cd: 1.5,
    xp: 7,
    el: 'cold'
  },
  tbat: {
    n: '雷蝠',
    sp: 'm_thunderbat',
    hp: 16,
    dmg: 6,
    spd: 240,
    r: 13,
    sz: 34,
    ai: 'melee',
    wind: 0.28,
    reach: 36,
    cd: 0.9,
    xp: 4,
    fly: 1,
    el: 'light'
  },
  shroom: {
    n: '毒菇',
    sp: 'm_mushroom',
    hp: 40,
    dmg: 9,
    spd: 70,
    r: 18,
    sz: 40,
    ai: 'ranged',
    wind: 0.6,
    reach: 300,
    cd: 2.2,
    xp: 7,
    el: 'chaos'
  },
  bear: {
    n: '黑熊',
    sp: 'm_blackbear',
    hp: 95,
    dmg: 24,
    spd: 80,
    r: 26,
    sz: 64,
    ai: 'slam',
    wind: 0.85,
    reach: 100,
    cd: 2.4,
    xp: 18
  }
};
/* 一群的組成 */
const PACKS = [
  ['slime', 'slime', 'slime', 'slime'],
  ['dog', 'dog', 'dog'],
  ['bat', 'bat', 'bat', 'bat', 'bat', 'bat'],
  ['fire', 'fire', 'slime', 'slime'],
  ['bear', 'slime', 'slime'],
  ['wolf', 'wolf', 'wolf'],
  ['tbat', 'tbat', 'tbat', 'tbat', 'bat', 'bat'],
  ['shroom', 'shroom', 'slime', 'slime'],
  ['bear', 'tbat', 'tbat', 'fire']
];
const ELITE = { hp: 3.2, dmg: 1.5, sz: 1.3 };
/* 王：照階級輪替；sk 叫小怪的種類、el 屬性 */
const BOSSES = [
  { n: '虎姑婆', sp: 'hugupo', hp: 480, dmg: 22, spd: 135, r: 40, sz: 120, xp: 200, call: 'bat' },
  { n: '魔神仔', sp: 'mosina', hp: 450, dmg: 21, spd: 150, r: 38, sz: 116, xp: 200, call: 'shroom', el: 'chaos' },
  { n: '林投姐', sp: 'lintoujie', hp: 470, dmg: 22, spd: 140, r: 38, sz: 118, xp: 200, call: 'wolf', el: 'cold' }
];
const bossOf = t => BOSSES[(t - 1) % BOSSES.length];
