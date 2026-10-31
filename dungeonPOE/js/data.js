/* dungeonPOE · 資料表：版本、主角、技能、地圖階級、裝備欄與底材、詞綴（T12～T1）、怪物、王 */
'use strict';
const VER = '0.2.2';
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
  }
};
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
  pack: { n: '群狼', ic: 'sup_sp_pet', need: ['minion'], d: '多 1 隻狼、狼的傷害 ×1.3' }
};
/* 寶石等級：上限 20、不能超過角色等級；每級傷害 +6%（輔助每級 +1%） */
const GEM_MAX = 20;
const gemNeed = lv => Math.round(30 * lv * lv);

/* ---------- 天賦樹（全員共用一張）：中心起點、6 個方向、每升一級 1 點，要連著點 ---------- */
const PT_THEMES = [
  {
    n: '生命',
    ic: 'asc_s_heart',
    s: { hpP: 5 },
    a: { n: '強健', ic: 'asc_s_heartx', s: { hpP: 12, regen: 3 } },
    b: { n: '不屈', ic: 'asc_s_heartx', s: { hpP: 18, flask: 30 } }
  },
  {
    n: '護甲',
    ic: 'asc_s_shield',
    s: { armorP: 12 },
    a: { n: '鐵壁', ic: 'asc_s_anvil', s: { armorP: 30, block: 4 } },
    b: { n: '堡壘', ic: 'asc_s_anvil', s: { armorP: 40, block: 6 } }
  },
  {
    n: '攻速',
    ic: 'asc_s_wind',
    s: { as: 3 },
    a: { n: '疾風', ic: 'asc_s_feather', s: { as: 8, ms: 5 } },
    b: { n: '連斬', ic: 'asc_s_feather', s: { as: 12, ms: 5 } }
  },
  {
    n: '暴擊',
    ic: 'asc_s_eye',
    s: { crit: 2 },
    a: { n: '精準', ic: 'asc_s_stars', s: { crit: 5, critX: 20 } },
    b: { n: '致命', ic: 'asc_s_stars', s: { critX: 45 } }
  },
  {
    n: '範圍',
    ic: 'asc_s_spark',
    s: { aoe: 4 },
    a: { n: '擴散', ic: 'asc_s_flame', s: { aoe: 12 } },
    b: { n: '元素掌握', ic: 'asc_s_flame', s: { eleP: 30, aoe: 8 } }
  },
  {
    n: '魔力',
    ic: 'asc_s_drop',
    s: { mpP: 6 },
    a: { n: '冥想', ic: 'asc_s_lotus', s: { mpP: 15, mpReg: 40 } },
    b: { n: '迅捷施術', ic: 'asc_s_lotus', s: { cdr: 15, mpP: 10 } }
  }
];
const STATN = {
  hpP: ['生命', '%'],
  armorP: ['護甲', '%'],
  as: ['攻速', '%'],
  crit: ['暴擊率', '%'],
  critX: ['暴擊傷害', '%'],
  aoe: ['範圍', '%'],
  mpP: ['魔力', '%'],
  mpReg: ['魔力回復', '%'],
  cdr: ['冷卻縮減', '%'],
  dmgA: ['傷害', '%'],
  resA: ['全部抗性', '%'],
  regen: ['每秒回復生命', ''],
  flask: ['藥水回復', '%'],
  block: ['格擋', '%'],
  ms: ['移動速度', '%'],
  eleP: ['元素傷害', '%']
};
/* 產生節點：6 條輻線各 6 點（第 3、6 點是大點），第 2、5 圈用中間點把相鄰輻線接起來 */
const PTREE = (() => {
  const N = [{ id: 'c', x: 0, y: 0, n: '起點', ic: 'asc_s_stars', s: {}, big: 1 }],
    E = [];
  PT_THEMES.forEach((th, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    for (let r = 1; r <= 6; r++) {
      const big = r === 3 ? th.a : r === 6 ? th.b : null;
      N.push({
        id: `p${i}_${r}`,
        x: Math.cos(a) * r * 92,
        y: Math.sin(a) * r * 92,
        n: big ? big.n : th.n,
        ic: big ? big.ic : th.ic,
        s: big ? big.s : th.s,
        big: big ? 1 : 0
      });
      E.push([r === 1 ? 'c' : `p${i}_${r - 1}`, `p${i}_${r}`]);
    }
    for (const r of [2, 5]) {
      const b = a + Math.PI / 6,
        mid =
          r === 2 ? { n: '傷害', ic: 'asc_s_sword', s: { dmgA: 6 } } : { n: '抗性', ic: 'asc_s_rune', s: { resA: 6 } };
      N.push({ id: `m${i}_${r}`, x: Math.cos(b) * r * 92 * 0.95, y: Math.sin(b) * r * 92 * 0.95, ...mid, big: 0 });
      E.push([`p${i}_${r}`, `m${i}_${r}`], [`m${i}_${r}`, `p${(i + 1) % 6}_${r}`]);
    }
  });
  return { N, E, I: Object.fromEntries(N.map(n => [n.id, n])) };
})();
const ptPoints = lv => lv - 1;

/* ---------- 核心昇華樹：0.1 五個職業的機制、核心、強化核心放在同一張樹；每 3 級 1 點 ----------
   路線：起點 → 職業機制 → 核心 → 強化核心（自己選要走哪些） */
const CORE_CLS = [
  {
    id: 'ronin',
    n: '浪人',
    ic: 'cls_swordsman',
    ci: 'swordsman',
    m: '架勢',
    md: '每次出手打中 +1 層架勢，滿 5 層的下一次出手是「居合」：傷害 ×3、必定暴擊',
    cores: [
      { id: 'swallow', n: '燕返', v: [0.5, 1], d: v => `居合之後馬上再砍一次（傷害 ×${v}）` },
      { id: 'mirror', n: '明鏡', v: [5, 10], d: v => `居合命中：回 ${v}% 生命` },
      { id: 'gale', n: '疾風', v: [4, 3], d: v => `架勢只要 ${v} 層就能居合` },
      { id: 'iron', n: '斬鐵', v: [4, 5], d: v => `居合傷害 ×3 → ×${v}` }
    ]
  },
  {
    id: 'knight',
    n: '騎士',
    ic: 'cls_knight',
    ci: 'knight',
    m: '盾勢',
    md: '有一層最大生命 10% 的護盾，4 秒沒受傷就充滿；護盾每吃掉 20 傷害 +1 層盾勢（最多 20），每層傷害 +2%',
    cores: [
      { id: 'wall', n: '壁壘', v: [20, 35], d: v => `護盾再 +最大生命 ${v}%` },
      { id: 'firm', n: '不動', v: [1, 2], d: v => `每層盾勢：受到的傷害 -${v}%（最多 -40%）` },
      { id: 'counter', n: '反擊', v: [4, 8], d: v => `被打時周圍爆出 盾勢層數 ×${v}% 的傷害` },
      { id: 'bash', n: '盾擊', v: [0.8, 1.5], d: v => `格擋時周圍造成 ×${v} 傷害` }
    ]
  },
  {
    id: 'pyro',
    n: '火法師',
    ic: 'cls_pyro',
    ci: 'pyro',
    m: '燃燒',
    md: '打中疊 1 層燃燒（最多 10 層、4 秒）：每層每秒受到那一下 8% 的火焰傷害',
    cores: [
      { id: 'kindle', n: '引火', v: [1, 2], d: v => `打中多疊 ${v} 層燃燒` },
      {
        id: 'burst',
        n: '爆燃',
        v: [3, 5],
        d: v => `燃燒滿 10 層時引爆：周圍受到 層數 ×${v}% 最大生命的火焰傷害，清空`
      },
      { id: 'spark', n: '星火', v: [50, 100], d: v => `燒著的敵人死掉：${v}% 的燃燒傳給附近 2 隻` },
      { id: 'end', n: '焚盡', v: [15, 25], d: v => `燒著的敵人生命低於 ${v}%：直接燒死（王除外）` }
    ]
  },
  {
    id: 'assassin',
    n: '刺客',
    ic: 'cls_assassin',
    ci: 'assassin',
    m: '印記',
    md: '打中 +1 層印記，滿 8 層的下一擊消耗印記：必定暴擊、每層傷害 +5%',
    cores: [
      { id: 'exec', n: '處決', v: [30, 40], d: v => `消耗印記時目標生命低於 ${v}%：傷害 ×2` },
      { id: 'shadow', n: '影步', v: [25, 40], d: v => `消耗印記後 2 秒：移動速度 +${v}%` },
      { id: 'chain', n: '連鎖', v: [6, 5], d: v => `印記只要 ${v} 層就能消耗` },
      { id: 'kill', n: '暗殺', v: [30, 60], d: v => `暴擊傷害 +${v}%` }
    ]
  },
  {
    id: 'tamer',
    n: '馴獸師',
    ic: 'cls_tamer',
    ci: 'tamer',
    m: '獸群',
    md: '帶 1 隻戰狼，每放 6 次技能再叫 1 隻（最多 3 隻）；狼咬一下是你平均一擊的 40%',
    cores: [
      { id: 'pack', n: '狼群', v: [30, 60], d: v => `狼的傷害 +${v}%` },
      { id: 'alpha', n: '頭狼', v: [1, 2], d: v => `一進地圖多帶 ${v} 隻狼` },
      { id: 'wild', n: '野性', v: [4, 5], d: v => `獸群上限 ${v} 隻` },
      { id: 'guard', n: '守護獸', v: [5, 8], d: v => `每隻狼：你受到的傷害 -${v}%` }
    ]
  }
];
/* 核心樹節點：c 起點、職業機制 `${cls}`、核心 `${cls}.${core}`、強化 `${cls}.${core}+` */
const CTREE = (() => {
  const N = [{ id: 'c', x: 0, y: 0, n: '起點', ic: 'asc_s_stars', big: 1 }],
    E = [];
  CORE_CLS.forEach((c, i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    N.push({ id: c.id, x: Math.cos(a) * 120, y: Math.sin(a) * 120, n: c.n + '：' + c.m, ic: c.ic, big: 2, cls: c.id });
    E.push(['c', c.id]);
    c.cores.forEach((k, j) => {
      const b = a + (j - 1.5) * 0.3,
        ic = `it_c_${c.ci}_${j}`;
      N.push({
        id: `${c.id}.${k.id}`,
        x: Math.cos(b) * 245,
        y: Math.sin(b) * 245,
        n: k.n,
        ic,
        big: 1,
        cls: c.id,
        core: k,
        lvl: 0
      });
      N.push({
        id: `${c.id}.${k.id}+`,
        x: Math.cos(b) * 340,
        y: Math.sin(b) * 340,
        n: '強化' + k.n,
        ic,
        big: 0,
        cls: c.id,
        core: k,
        lvl: 1
      });
      E.push([c.id, `${c.id}.${k.id}`], [`${c.id}.${k.id}`, `${c.id}.${k.id}+`]);
    });
  });
  return { N, E, I: Object.fromEntries(N.map(n => [n.id, n])) };
})();
const ctPoints = lv => Math.floor(lv / 3);

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
  shield: { n: '盾', sz: [2, 2], aff: ['life', 'armor', 'block', 'resF', 'resC', 'resL', 'resX', 'resA'] },
  helm: { n: '頭盔', sz: [2, 2], aff: ['life', 'armor', 'mp', 'crit', 'aoe', 'resF', 'resC', 'resL', 'resX'] },
  chest: { n: '胸甲', sz: [2, 3], aff: ['life', 'armor', 'regen', 'resF', 'resC', 'resL', 'resX'] },
  gloves: {
    n: '手套',
    sz: [2, 2],
    aff: ['life', 'armor', 'flat', 'fire', 'cold', 'light', 'as', 'loh', 'resF', 'resC', 'resL']
  },
  boots: { n: '鞋子', sz: [2, 2], aff: ['life', 'armor', 'ms', 'resF', 'resC', 'resL', 'resX'] },
  belt: { n: '腰帶', sz: [2, 1], aff: ['life', 'armor', 'mp', 'regen', 'flask', 'resF', 'resC', 'resL', 'resX'] },
  ring: {
    n: '戒指',
    sz: [1, 1],
    aff: ['life', 'mp', 'flat', 'fire', 'cold', 'light', 'as', 'crit', 'regen', 'resF', 'resC', 'resL', 'resX', 'resA']
  },
  amulet: { n: '護身符', sz: [1, 1], aff: ['life', 'mp', 'dmgP', 'crit', 'critX', 'aoe', 'regen', 'resA'] }
};
/* 底材：lv 從幾階開始掉、ic 圖示、b 固定數值（武器：物理傷害、攻速；防具：護甲；飾品：固定詞綴） */
const BASES = [
  { id: 'w_short', k: 'weapon', n: '短刀', lv: 1, ic: 'gear_weapon_0', b: { dmg: [4, 9], as: 1.3 } },
  { id: 'w_katana', k: 'weapon', n: '打刀', lv: 1, ic: 'gear_weapon_18', b: { dmg: [6, 13], as: 1.15 } },
  { id: 'w_nodachi', k: 'weapon', n: '野太刀', lv: 4, ic: 'gear_weapon_5', b: { dmg: [14, 26], as: 0.95 } },
  { id: 'w_kris', k: 'weapon', n: '蛇紋刃', lv: 7, ic: 'gear_weapon_28', b: { dmg: [12, 22], as: 1.35 } },
  { id: 'w_moon', k: 'weapon', n: '月影刀', lv: 10, ic: 'gear_weapon_17', b: { dmg: [24, 42], as: 1.15 } },
  { id: 'w_demon', k: 'weapon', n: '妖刀', lv: 14, ic: 'gear_weapon_20', b: { dmg: [34, 62], as: 1.1 } },
  { id: 's_wood', k: 'shield', n: '木盾', lv: 1, ic: 'gear_offhand_2', b: { armor: 12, block: 10 } },
  { id: 's_iron', k: 'shield', n: '鐵盾', lv: 6, ic: 'gear_offhand_8', b: { armor: 40, block: 14 } },
  { id: 's_tower', k: 'shield', n: '塔盾', lv: 12, ic: 'gear_offhand_3', b: { armor: 95, block: 18 } },
  { id: 'h_cloth', k: 'helm', n: '頭巾', lv: 1, ic: 'gear_helm_5', b: { armor: 6 } },
  { id: 'h_iron', k: 'helm', n: '鐵盔', lv: 6, ic: 'gear_helm_1', b: { armor: 22 } },
  { id: 'h_oni', k: 'helm', n: '鬼面盔', lv: 12, ic: 'gear_helm_9', b: { armor: 55 } },
  { id: 'c_leather', k: 'chest', n: '皮甲', lv: 1, ic: 'gear_chest_0', b: { armor: 14 } },
  { id: 'c_chain', k: 'chest', n: '鎖子甲', lv: 5, ic: 'gear_chest_1', b: { armor: 45 } },
  { id: 'c_plate', k: 'chest', n: '大鎧', lv: 11, ic: 'gear_chest_3', b: { armor: 110 } },
  { id: 'g_cloth', k: 'gloves', n: '布手套', lv: 1, ic: 'gear_gloves_0', b: { armor: 4 } },
  { id: 'g_iron', k: 'gloves', n: '鐵手甲', lv: 7, ic: 'gear_gloves_1', b: { armor: 18 } },
  { id: 'b_straw', k: 'boots', n: '草鞋', lv: 1, ic: 'gear_boots_4', b: { armor: 4 } },
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
  resA: { p: 0, n: '全部抗性 +{}%', r: [3, 18] }
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
