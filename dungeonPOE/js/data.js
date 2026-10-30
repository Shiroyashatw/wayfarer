/* dungeonPOE · 遊戲表格：道具、詞綴、背包、手牌、怪物、生肖、職業與核心、天賦（設計見 docs/企劃書.md） */
'use strict';
const VER = '0.1.3',
  KEY = 'dungeonpoe_v1',
  SLOT = new URLSearchParams(location.search).get('p') || '';
/* ================= 道具（原始 16 把武器＋9 件防具，《塞令老師》0.4.0） ================= */
/* 形狀：格子相對座標 [x, y] */
const SH = {
  s1: [[0, 0]],
  h2: [
    [0, 0],
    [1, 0]
  ],
  v2: [
    [0, 0],
    [0, 1]
  ],
  v3: [
    [0, 0],
    [0, 1],
    [0, 2]
  ],
  sq: [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1]
  ],
  l3: [
    [0, 0],
    [0, 1],
    [1, 1]
  ],
  t4: [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, 1]
  ],
  big: [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 1]
  ]
};
/* k：w 武器、a 防具、s 盾、p 藥水、g 錢袋；star 是底材等級（越深越常掉高 ★）；on：命中時的異常（%） */
const ITEMS = [
  { id: 'woodsword', n: '桃木劍', k: 'w', star: 1, sh: 'v2', cd: 1.3, dmg: [2, 4], ic: 'gear_weapon_16' },
  { id: 'knife', n: '短刀', k: 'w', star: 1, sh: 's1', cd: 0.9, dmg: [1, 3], crit: 10, ic: 'gear_weapon_13' },
  { id: 'huntbow', n: '獵弓', k: 'w', star: 1, sh: 'v3', cd: 1.6, dmg: [3, 5], ic: 'gear_weapon_3' },
  { id: 'club', n: '單手錘', k: 'w', star: 1, sh: 'v2', cd: 1.8, dmg: [3, 6], on: { shock: 15 }, ic: 'gear_weapon_8' },
  { id: 'ironsword', n: '長劍', k: 'w', star: 2, sh: 'v2', cd: 1.2, dmg: [4, 6], ic: 'gear_weapon_1' },
  { id: 'firestaff', n: '火球法杖', k: 'w', star: 2, sh: 'v3', cd: 1.7, dmg: [3, 5], on: { burn: 60 }, ic: 'sk_fire' },
  {
    id: 'icestaff',
    n: '冰錐法杖',
    k: 'w',
    star: 2,
    sh: 'v3',
    cd: 1.8,
    dmg: [3, 5],
    on: { freeze: 35 },
    ic: 'sk_iceshard'
  },
  {
    id: 'venomknife',
    n: '毒匕首',
    k: 'w',
    star: 2,
    sh: 's1',
    cd: 1,
    dmg: [1, 2],
    on: { poison: 60 },
    ic: 'gear_weapon_28'
  },
  {
    id: 'waraxe',
    n: '戰斧',
    k: 'w',
    star: 2,
    sh: 'l3',
    cd: 2,
    dmg: [6, 9],
    crit: 5,
    on: { bleed: 30 },
    ic: 'gear_weapon_2'
  },
  {
    id: 'thunderhammer',
    n: '雷霆錘',
    k: 'w',
    star: 3,
    sh: 'sq',
    cd: 2.2,
    dmg: [7, 11],
    on: { shock: 40 },
    ic: 'gear_weapon_23'
  },
  { id: 'spear', n: '長槍', k: 'w', star: 3, sh: 'v3', cd: 1.5, dmg: [5, 8], crit: 10, ic: 'gear_weapon_9' },
  { id: 'repeater', n: '連弩', k: 'w', star: 3, sh: 'h2', cd: 0.8, dmg: [2, 4], ic: 'sk_barrage' },
  { id: 'scythe', n: '血關刀', k: 'w', star: 3, sh: 'l3', cd: 1.6, dmg: [4, 7], ls: 30, ic: 'gear_weapon_30' },
  { id: 'dragonslayer', n: '斬鐵大劍', k: 'w', star: 4, sh: 'big', cd: 2, dmg: [12, 18], crit: 10, ic: 'sk_slash2' },
  {
    id: 'phoenixbow',
    n: '火焰弓',
    k: 'w',
    star: 4,
    sh: 'v3',
    cd: 1.4,
    dmg: [6, 9],
    on: { burn: 70 },
    ic: 'sk_firearrow'
  },
  {
    id: 'skythunder',
    n: '天雷',
    k: 'w',
    star: 5,
    sh: 't4',
    cd: 1.8,
    dmg: [14, 20],
    on: { shock: 50 },
    ic: 'sk_thunderstorm'
  },
  { id: 'leathercap', n: '皮帽', k: 'a', star: 1, sh: 's1', hp: 12, arm: 1, ic: 'gear_helm_0' },
  { id: 'leatherarmor', n: '皮甲', k: 'a', star: 1, sh: 'sq', hp: 30, ic: 'gear_chest_0' },
  { id: 'woodshield', n: '木盾', k: 's', star: 1, sh: 'sq', cd: 3, block: 6, ic: 'gear_offhand_2' },
  { id: 'ironhelm', n: '鐵盔', k: 'a', star: 2, sh: 's1', hp: 10, arm: 3, ic: 'gear_helm_1' },
  { id: 'ironshield', n: '鐵盾', k: 's', star: 2, sh: 'sq', cd: 3, block: 10, ic: 'ail_guard' },
  { id: 'boots', n: '輕靴', k: 'a', star: 2, sh: 's1', dodge: 8, ic: 'gear_boots_0' },
  { id: 'chainmail', n: '鎖子甲', k: 'a', star: 3, sh: 'sq', hp: 50, arm: 3, ic: 'gear_chest_1' },
  { id: 'thornshield', n: '骨刺盾', k: 's', star: 3, sh: 'sq', cd: 3, block: 12, thorns: 3, ic: 'gear_offhand_10' },
  { id: 'paladinshield', n: '聖騎士盾', k: 's', star: 4, sh: 'sq', cd: 2.5, block: 18, heal: 3, ic: 'gear_offhand_9' },
  /* 消耗品與錢袋（不掉詞綴） */
  { id: 'potion', n: '生命藥水', k: 'p', star: 1, sh: 's1', pot: 40, ic: 'p:ic_potion', price: 15 },
  { id: 'purse', n: '錢袋', k: 'g', star: 1, sh: 's1', cap: 150, ic: 'mat_gold', price: 30 }
];
const ITEMI = Object.fromEntries(ITEMS.map(it => [it.id, it]));
const GEAR = ITEMS.filter(it => 'was'.includes(it.k));
const KINDN = { w: '武器', a: '防具', s: '盾', p: '藥水', g: '錢袋' };
/* ================= 詞綴：T1～T6（T1 最強），每件最多一個前綴（P，數值）、一個後綴（S，機制） ================= */
/* tiers[0] 是 T1；k：能出現在哪一類（w 武器、a 防具、s 盾） */
const AFF = [
  {
    id: 'dmgPct',
    t: 'P',
    n: '鋒利',
    k: 'w',
    tiers: [
      [40, 50],
      [32, 39],
      [24, 31],
      [17, 23],
      [10, 16],
      [5, 9]
    ],
    f: v => `傷害 +${v}%`
  },
  {
    id: 'flat',
    t: 'P',
    n: '沉重',
    k: 'w',
    tiers: [
      [7, 9],
      [5, 6],
      [4, 4],
      [3, 3],
      [2, 2],
      [1, 1]
    ],
    f: v => `每下傷害 +${v}`
  },
  {
    id: 'hp',
    t: 'P',
    n: '健壯',
    k: 'as',
    tiers: [
      [40, 50],
      [31, 39],
      [23, 30],
      [16, 22],
      [10, 15],
      [5, 9]
    ],
    f: v => `生命 +${v}`
  },
  {
    id: 'arm',
    t: 'P',
    n: '堅固',
    k: 'a',
    tiers: [
      [6, 7],
      [5, 5],
      [4, 4],
      [3, 3],
      [2, 2],
      [1, 1]
    ],
    f: v => `護甲 +${v}`
  },
  {
    id: 'dodge',
    t: 'P',
    n: '靈巧',
    k: 'a',
    tiers: [
      [9, 10],
      [7, 8],
      [6, 6],
      [5, 5],
      [3, 4],
      [2, 2]
    ],
    f: v => `閃避 +${v}%`
  },
  {
    id: 'blockPct',
    t: 'P',
    n: '厚實',
    k: 's',
    tiers: [
      [60, 75],
      [46, 59],
      [34, 45],
      [24, 33],
      [15, 23],
      [8, 14]
    ],
    f: v => `格擋 +${v}%`
  },
  {
    id: 'spd',
    t: 'S',
    n: '迅捷',
    k: 'w',
    tiers: [
      [25, 30],
      [20, 24],
      [15, 19],
      [11, 14],
      [7, 10],
      [4, 6]
    ],
    f: v => `攻速 +${v}%`
  },
  {
    id: 'crit',
    t: 'S',
    n: '精準',
    k: 'w',
    tiers: [
      [15, 18],
      [12, 14],
      [9, 11],
      [7, 8],
      [5, 6],
      [3, 4]
    ],
    f: v => `暴擊率 +${v}%`
  },
  {
    id: 'ls',
    t: 'S',
    n: '吸血',
    k: 'w',
    tiers: [
      [10, 12],
      [8, 9],
      [6, 7],
      [5, 5],
      [3, 4],
      [2, 2]
    ],
    f: v => `吸血 ${v}%`
  },
  {
    id: 'burn',
    t: 'S',
    n: '灼燒',
    k: 'w',
    tiers: [
      [60, 70],
      [48, 59],
      [38, 47],
      [29, 37],
      [21, 28],
      [14, 20]
    ],
    f: v => `命中 ${v}% 燃燒`
  },
  {
    id: 'poison',
    t: 'S',
    n: '劇毒',
    k: 'w',
    tiers: [
      [60, 70],
      [48, 59],
      [38, 47],
      [29, 37],
      [21, 28],
      [14, 20]
    ],
    f: v => `命中 ${v}% 中毒`
  },
  {
    id: 'bleed',
    t: 'S',
    n: '撕裂',
    k: 'w',
    tiers: [
      [50, 60],
      [40, 49],
      [31, 39],
      [24, 30],
      [17, 23],
      [10, 16]
    ],
    f: v => `命中 ${v}% 流血`
  },
  {
    id: 'freeze',
    t: 'S',
    n: '霜凍',
    k: 'w',
    tiers: [
      [30, 35],
      [25, 29],
      [20, 24],
      [16, 19],
      [12, 15],
      [8, 11]
    ],
    f: v => `命中 ${v}% 凍結`
  },
  {
    id: 'shock',
    t: 'S',
    n: '雷擊',
    k: 'w',
    tiers: [
      [50, 60],
      [40, 49],
      [31, 39],
      [24, 30],
      [17, 23],
      [10, 16]
    ],
    f: v => `命中 ${v}% 感電`
  },
  {
    id: 'adjW',
    t: 'S',
    n: '共鳴',
    k: 'was',
    tiers: [
      [16, 20],
      [13, 15],
      [10, 12],
      [8, 9],
      [6, 7],
      [4, 5]
    ],
    f: v => `相鄰每件武器：這件 +${v}%`
  },
  {
    id: 'lone',
    t: 'S',
    n: '孤狼',
    k: 'was',
    tiers: [
      [45, 55],
      [36, 44],
      [28, 35],
      [21, 27],
      [15, 20],
      [10, 14]
    ],
    f: v => `旁邊沒有道具：這件 +${v}%`
  },
  {
    id: 'corner',
    t: 'S',
    n: '據角',
    k: 'was',
    tiers: [
      [35, 40],
      [28, 34],
      [22, 27],
      [16, 21],
      [11, 15],
      [7, 10]
    ],
    f: v => `放在背包角落：這件 +${v}%`
  },
  {
    id: 'row',
    t: 'S',
    n: '列陣',
    k: 'w',
    tiers: [
      [10, 12],
      [8, 9],
      [6, 7],
      [5, 5],
      [3, 4],
      [2, 2]
    ],
    f: v => `同一排每件其他武器：攻速 +${v}%`
  },
  {
    id: 'regen',
    t: 'S',
    n: '再生',
    k: 'as',
    tiers: [
      [2.5, 3],
      [2, 2.4],
      [1.5, 1.9],
      [1.1, 1.4],
      [0.7, 1],
      [0.4, 0.6]
    ],
    f: v => `每秒回 ${v} 生命`
  },
  {
    id: 'thorns',
    t: 'S',
    n: '荊棘',
    k: 'as',
    tiers: [
      [7, 8],
      [5, 6],
      [4, 4],
      [3, 3],
      [2, 2],
      [1, 1]
    ],
    f: v => `被打時反彈 ${v}`
  }
];
const AFFI = Object.fromEntries(AFF.map(a => [a.id, a]));
/* ================= 背包（工坊買；死了會失去）與黑盒 ================= */
/* m：形狀（x 是格子）；p：價格 */
const BAGS = [
  { id: 'b33', n: '新手包', m: ['xxx', 'xxx', 'xxx'], p: 5 },
  { id: 'b44', n: '方包', m: ['xxxx', 'xxxx', 'xxxx', 'xxxx'], p: 20 },
  { id: 'b35', n: '直筒包', m: ['xxx', 'xxx', 'xxx', 'xxx', 'xxx'], p: 30 },
  { id: 'b53', n: '腰包', m: ['xxxxx', 'xxxxx', 'xxxxx'], p: 30 },
  { id: 'b63', n: '長條包', m: ['xxxxxx', 'xxxxxx', 'xxxxxx'], p: 70 },
  { id: 'b45', n: '登山包', m: ['xxxx', 'xxxx', 'xxxx', 'xxxx', 'xxxx'], p: 90 },
  { id: 'b54', n: '方形包', m: ['xxxxx', 'xxxxx', 'xxxxx', 'xxxxx'], p: 90 },
  { id: 'bL', n: 'L 形包', m: ['xxx..', 'xxx..', 'xxx..', 'xxxxx', 'xxxxx'], p: 120 },
  { id: 'bT', n: 'T 字包', m: ['xxxxxx', 'xxxxxx', '.xxxx.', '.xxxx.'], p: 140 },
  { id: 'b46', n: '行軍包', m: ['xxxx', 'xxxx', 'xxxx', 'xxxx', 'xxxx', 'xxxx'], p: 200 },
  { id: 'b64', n: '寬口包', m: ['xxxxxx', 'xxxxxx', 'xxxxxx', 'xxxxxx'], p: 200 },
  { id: 'bX', n: '十字包', m: ['.xxx.', 'xxxxx', 'xxxxx', 'xxxxx', '.xxx.'], p: 160 },
  { id: 'bO', n: '環形包', m: ['xxxxx', 'xxxxx', 'xx.xx', 'xxxxx', 'xxxxx'], p: 220 },
  { id: 'b55', n: '大方包', m: ['xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx'], p: 300 },
  { id: 'b65', n: '遠征包', m: ['xxxxxx', 'xxxxxx', 'xxxxxx', 'xxxxxx', 'xxxxxx'], p: 480 },
  { id: 'b66', n: '傳說行囊', m: ['xxxxxx', 'xxxxxx', 'xxxxxx', 'xxxxxx', 'xxxxxx', 'xxxxxx'], p: 750 }
];
const BAGI = Object.fromEntries(BAGS.map(b => [b.id, b]));
const BOX = { id: 'box', n: '黑盒', m: ['xxx', 'xxx', 'xxx'] };
/* 地上（6×2）、怪物與寶箱的背包（打贏了就是戰利品） */
const MBAGS = {
  g: { n: '地上', m: ['xxxxxx', 'xxxxxx'] },
  m33: { n: '小背包', m: ['xxx', 'xxx', 'xxx'] },
  m44: { n: '背包', m: ['xxxx', 'xxxx', 'xxxx', 'xxxx'] },
  m55: { n: '大背包', m: ['xxxxx', 'xxxxx', 'xxxxx', 'xxxxx', 'xxxxx'] }
};
/* 頭像（地圖與戰鬥裡的你；設定裡換） */
const AVATARS = [
  ['av_kojiro', '佐佐木小次郎'],
  ['av_musashi', '宮本武藏'],
  ['av_zhaoyun', '趙雲'],
  ['av_lubu', '呂布'],
  ['av_knight', '騎士'],
  ['av_pirate', '海盜船長'],
  ['av_diaochan', '貂蟬'],
  ['av_xishi', '西施'],
  ['av_guifei', '楊貴妃'],
  ['av_zhaojun', '王昭君'],
  ['av_elf', '精靈弓手'],
  ['av_fox', '狐妖'],
  ['av_idol', '偶像歌手']
];
/* ================= 熱度（漫步勇者的狩獵） ================= */
/* 每走一步 +1（險路 2 步）；滿了不會再降，之後每 zodEvery 步生一隻生肖 */
const HEAT = { step: 1, fight: 3, chest: 2, flee: 5, max: 75, lv: [0, 35, 75], mul: [0, 0.25, 0.5], zodEvery: 4 };
/* ================= 怪物（台灣妖怪；sp 是 art 的圖名） ================= */
/* hp／atk 是倍率（乘上這一層的基準），cd 秒，on：命中時的異常 */
const MOBS = [
  { n: '綠史萊姆', sp: 'm_slime_green', hp: 1, atk: 0.9, cd: 1.6 },
  { n: '蝙蝠', sp: 'm_bat', hp: 0.7, atk: 0.7, cd: 1.1 },
  { n: '流浪狗', sp: 'm_straydog', hp: 0.9, atk: 1, cd: 1.4 },
  { n: '鬼火', sp: 'm_ghostfire', hp: 0.8, atk: 0.8, cd: 1.5, on: { burn: 40 } },
  { n: '毒菇', sp: 'm_mushroom', hp: 1.1, atk: 0.7, cd: 1.7, on: { poison: 50 } },
  { n: '稻草人', sp: 'm_scarecrow', hp: 1.3, atk: 0.8, cd: 1.8 },
  { n: '紙紮人', sp: 'm_paperdoll', hp: 0.9, atk: 1.1, cd: 1.5 },
  { n: '燈籠妖', sp: 'm_lantern', hp: 1, atk: 0.9, cd: 1.6, on: { burn: 30 } },
  { n: '雷蝠', sp: 'm_thunderbat', hp: 0.8, atk: 0.9, cd: 1.2, on: { shock: 30 } },
  { n: '黑熊', sp: 'm_blackbear', hp: 1.6, atk: 1.3, cd: 2.2 },
  { n: '雪原狼', sp: 'm_snowwolf', hp: 1.1, atk: 1.1, cd: 1.3, on: { freeze: 15 } },
  { n: '百步蛇', sp: 'm_hundredpace', hp: 1, atk: 1, cd: 1.4, on: { poison: 60 } }
];
/* 菁英、生肖的詞綴 */
const MAFF = {
  fast: { n: '迅捷', d: '攻速 +40%' },
  tough: { n: '堅韌', d: '生命 +50%' },
  vamp: { n: '吸血', d: '吸血 30%' },
  rage: { n: '狂暴', d: '生命低於一半：傷害 +50%' },
  iron: { n: '鐵甲', d: '護甲 +3' },
  fire: { n: '烈焰', d: '命中 50% 燃燒' },
  frost: { n: '冰霜', d: '命中 25% 凍結' },
  storm: { n: '雷暴', d: '命中 50% 感電' }
};
/* 王（每座地城第 3 層最深處）：sk 是專屬技能 */
const BOSSES = [
  { n: '魔神仔', sp: 'mosina', sk: 'summon', skd: '每 7 秒叫出一隻迷途小鬼' },
  { n: '虎姑婆', sp: 'hugupo', sk: 'enrage', skd: '每 9 秒狂暴 3 秒：攻速 ×2' },
  { n: '林投姐', sp: 'lintoujie', sk: 'curse', skd: '每 6 秒詛咒：你受到的傷害 +15%（疊加）' },
  { n: '陳守娘', sp: 'chenshouniang', sk: 'enrage', skd: '每 9 秒狂暴 3 秒：攻速 ×2' },
  { n: '牛頭', sp: 'oxhead', sk: 'summon', skd: '每 7 秒叫出一隻迷途小鬼' }
];
/* 墮落十二生肖：熱度滿了每 2 回合生一隻，越生越近，不能逃 */
const ZODIAC = [
  { n: '瘟噬鼠皇', sp: 'z_rat', a: 'fast' },
  { n: '獄鎖魔牛', sp: 'z_ox', a: 'iron' },
  { n: '血牙虎煞', sp: 'z_tiger', a: 'rage' },
  { n: '月蝕狂兔', sp: 'z_rabbit', a: 'fast' },
  { n: '天墜邪龍', sp: 'z_dragon', a: 'tough' },
  { n: '毒涎蛇姬', sp: 'z_snake', a: 'vamp' },
  { n: '焚魂夢魘', sp: 'z_horse', a: 'fire' },
  { n: '魔羊祭司', sp: 'z_goat', a: 'frost' },
  { n: '雷魘猴王', sp: 'z_monkey', a: 'storm' },
  { n: '業火冥雞', sp: 'z_rooster', a: 'fire' },
  { n: '冥府獄犬', sp: 'z_dog', a: 'vamp' },
  { n: '屠野魔豬', sp: 'z_pig', a: 'tough' }
];
/* 這一層的基準：L = (地城 - 1) × 3 + 層 */
const lvOf = (d, f) => (d - 1) * 3 + f;
const mobBase = L => ({ hp: Math.round(26 * Math.pow(1.3, L - 1)), atk: 3.2 * Math.pow(1.24, L - 1) });
/* 怪物等級的倍率：菁英 ×3、王 ×10、生肖 ×4.5（企劃書第 9 節） */
const TIERM = { mob: 1, elite: 3, boss: 10, zod: 4.5 };
/* ================= 職業、核心、天賦 ================= */
/* 主機制不看武器標籤（設計原則第 7 節）；核心 v 是 [原本, 強化後] */
const CLASSES = [
  {
    id: 'ronin',
    n: '浪人',
    ic: 'cls_swordsman',
    av: 'av_kojiro',
    m: '架勢',
    md: '每次攻擊 +1 層，滿 5 層的下一擊是居合（傷害 ×3）',
    cores: [
      { id: 'r_draw', n: '拔刀', v: [3, 5], d: v => `開戰就有 ${v} 層架勢` },
      { id: 'r_swallow', n: '燕返', v: [1, 1.5], d: v => `居合之後馬上再砍一下（傷害 ×${v}）` },
      { id: 'r_mirror', n: '明鏡', v: [5, 10], d: v => `居合命中：回 ${v}% 生命` },
      { id: 'r_gale', n: '疾風', v: [4, 3], d: v => `架勢只要 ${v} 層就能居合` },
      { id: 'r_iron', n: '斬鐵', v: [4, 5], d: v => `居合傷害 ×3 → ×${v}` },
      { id: 'r_eye', n: '心眼', v: [3, 5], d: v => `每層架勢：閃避 +${v}%` }
    ]
  },
  {
    id: 'knight',
    n: '騎士',
    ic: 'cls_knight',
    av: 'av_knight',
    m: '盾勢',
    md: '開戰得到最大生命 10% 的護盾；護盾每吃掉 20 傷害 +1 層盾勢（最多 20），每層傷害 +2%',
    cores: [
      { id: 'k_wall', n: '壁壘', v: [20, 35], d: v => `開戰護盾再 +最大生命 ${v}%` },
      { id: 'k_counter', n: '反擊', v: [1, 2], d: v => `被打時反彈 盾勢層數 ×${v} 傷害` },
      { id: 'k_firm', n: '不動', v: [1, 2], d: v => `每層盾勢：受到的傷害 -${v}%（最多 -40%）` },
      { id: 'k_rally', n: '重整', v: [3, 5], d: v => `每 6 秒得到 盾勢層數 ×${v} 的護盾` },
      { id: 'k_bash', n: '盾擊', v: [1, 2], d: v => `盾牌格擋時：對敵人造成 格擋值 ×${v} 傷害` },
      { id: 'k_hold', n: '堅守', v: [0, 5], d: v => `盾勢上限 30、每層傷害 +3%${v ? `・開戰 ${v} 層` : ''}` }
    ]
  },
  {
    id: 'pyro',
    n: '火法師',
    ic: 'cls_pyro',
    av: 'av_elf',
    m: '燃燒',
    md: '所有命中都疊 2 層燃燒（每層每秒 1 傷害，每 2 秒少 1 層）',
    cores: [
      { id: 'p_kindle', n: '引火', v: [1, 2], d: v => `命中多疊 ${v} 層燃燒` },
      { id: 'p_burst', n: '爆燃', v: [4, 6], d: v => `燃燒滿 10 層時引爆：造成 層數 ×${v} 傷害，清空` },
      { id: 'p_spark', n: '星火', v: [100, 150], d: v => `敵人死時：燃燒的 ${v}% 轉到下一隻` },
      { id: 'p_life', n: '灼命', v: [10, 20], d: v => `燃燒傷害的 ${v}% 回復生命` },
      { id: 'p_wave', n: '熱浪', v: [3, 5], d: v => `每 5 秒：所有敵人 +${v} 層燃燒` },
      { id: 'p_end', n: '焚盡', v: [15, 25], d: v => `燃燒中的敵人生命低於 ${v}%：直接燒死` }
    ]
  },
  {
    id: 'assassin',
    n: '刺客',
    ic: 'cls_assassin',
    av: 'av_fox',
    m: '印記',
    md: '命中 +1 層印記，滿 8 層的下一擊消耗印記：必定暴擊、每層傷害 +5%',
    cores: [
      { id: 'a_mark', n: '標記', v: [3, 6], d: v => `開戰每個敵人身上有 ${v} 層印記` },
      { id: 'a_exec', n: '處決', v: [30, 40], d: v => `消耗印記時目標生命低於 ${v}%：傷害 ×2` },
      { id: 'a_shadow', n: '影步', v: [2, 3], d: v => `消耗印記後 ${v} 秒：閃避 +40%` },
      { id: 'a_chain', n: '連鎖', v: [6, 5], d: v => `印記只要 ${v} 層就能消耗` },
      { id: 'a_venom', n: '毒刃', v: [1, 2], d: v => `每層印記：目標每秒受 ${v} 傷害` },
      { id: 'a_kill', n: '暗殺', v: [30, 60], d: v => `暴擊傷害 +${v}%` }
    ]
  },
  {
    id: 'tamer',
    n: '馴獸師',
    ic: 'cls_tamer',
    av: 'av_zhaoyun',
    m: '獸群',
    md: '開戰帶 1 隻戰狼，每攻擊 6 次再叫 1 隻（最多 3 隻）；狼每 1.5 秒咬一下（你平均一擊的 40%）',
    cores: [
      { id: 't_pack', n: '狼群', v: [30, 60], d: v => `狼的傷害 +${v}%` },
      { id: 't_alpha', n: '頭狼', v: [1, 2], d: v => `開戰多帶 ${v} 隻狼` },
      { id: 't_wild', n: '野性', v: [4, 5], d: v => `獸群上限 ${v} 隻` },
      { id: 't_bite', n: '撕咬', v: [1, 2], d: v => `狼咬中：疊 ${v} 層流血` },
      { id: 't_call', n: '呼喚', v: [4, 3], d: v => `每攻擊 ${v} 次就叫一隻狼` },
      { id: 't_guard', n: '守護獸', v: [5, 8], d: v => `每隻狼：你受到的傷害 -${v}%` }
    ]
  }
];
const CLSI = Object.fromEntries(CLASSES.map(c => [c.id, c]));
const COREI = Object.fromEntries(CLASSES.flatMap(c => c.cores.map((k, i) => [k.id, { ...k, cls: c.id, i }])));
/* 天賦樹（每個職業同一個骨架，19 個節點）：u 解鎖第幾個核心、e 強化第幾個核心、s 小數值；
   第 r 排要先在前面點滿 2r 點（不用連線，照排解鎖） */
const TSTAT = { hp: ['生命', 8, '%'], dmg: ['傷害', 6, '%'], spd: ['攻速', 6, '%'], arm: ['護甲', 2, ''] };
const TREE = [
  [{ s: 'hp' }, { s: 'dmg' }],
  [{ u: 1 }, { u: 2 }],
  [{ e: 0 }, { s: 'spd' }, { s: 'hp' }],
  [{ u: 3 }, { e: 1 }, { e: 2 }],
  [{ s: 'dmg' }, { u: 4 }, { s: 'arm' }],
  [{ e: 3 }, { u: 5 }, { e: 4 }],
  [{ e: 5 }, { s: 'hp', x: 1.5 }]
];
const TNODES = TREE.flatMap((row, r) => row.map((nd, i) => ({ ...nd, r, id: r * 10 + i })));
/* 等級：升到下一級要的經驗 */
const xpNeed = lv => Math.round(40 * Math.pow(lv, 1.35));
const BASE_HP = 50,
  HEARTS = 3;
