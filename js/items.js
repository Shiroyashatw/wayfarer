/* 塞令老師 · 道具：形狀、星級、標籤、效果與相鄰加成（設計見 docs/企劃書.md 第 3 節） */
'use strict';
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
  /* 0.1.9 更多形狀：長條、Z 字、L 字、十字、2×3（雙手武器） */
  v4: [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3]
  ],
  h3: [
    [0, 0],
    [1, 0],
    [2, 0]
  ],
  z4: [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1]
  ],
  l4: [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 2]
  ],
  x5: [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [1, 2]
  ],
  r6: [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
    [0, 2],
    [1, 2]
  ],
  big: [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 1]
  ],
  /* 0.1.62 巨人國的大形狀：U 形、環形、H 形、C 形有凹口（SHHOLE），L 五格、T 五格、P 五格、橫四格 */
  u5: [
    [0, 0],
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1]
  ],
  o8: [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2]
  ],
  h7: [
    [0, 0],
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [0, 2],
    [2, 2]
  ],
  c5: [
    [0, 0],
    [1, 0],
    [0, 1],
    [0, 2],
    [1, 2]
  ],
  l5: [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 3]
  ],
  t5: [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, 1],
    [1, 2]
  ],
  p5: [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
    [0, 2]
  ],
  h4: [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0]
  ],
  /* 0.1.35 直五格（魔劍正宗） */
  v5: [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4]
  ]
};
/* 標籤的中文 */
const TAGN = {
  /* 0.1.103 料理 */
  food: '食物',
  weapon: '武器',
  sword: '劍',
  dagger: '匕首',
  bow: '弓',
  xbow: '弩',
  mace: '鎚',
  axe: '斧',
  spear: '矛',
  staff: '法杖',
  armor: '防具',
  shield: '盾',
  trinket: '飾品',
  potion: '藥水',
  pet: '寵物',
  core: '職業核心',
  fire: '火',
  cold: '冰',
  light: '雷',
  poison: '毒',
  dark: '暗',
  twohand: '雙手',
  holy: '聖',
  tf: '融合'
};
/* 道具（ic：借用的圖示，0.1.1 起裝備類用舊版的 PNG 裝備圖 gear_欄位_序號；有 it_代號.png 時優先用）：
   cd 攻擊冷卻（秒）、dmg 傷害區間、crit 暴擊率、on 命中效果（burn 燃燒層、poison 中毒層、freeze／stun [機率%, 秒]、ls 吸血%）
   hp／arm／dodge／regen／block（盾：每 cd 秒獲得格擋）／thorns（格擋時反彈）／pot（藥水：[生命低於%, 回復, 次數]）
   adj／row／all：給相鄰／同一排／整個背包裡有這個標籤的道具加成（spd 攻速%、dmg 傷害、dmgPct 傷害%、crit、burn、poison、ls、block、freezeCh、stunCh）
   fx：整個角色（hp、arm、dodge、regen、ls、critMul、take、potMul、potUse） */
const ITEMS = [
  /* ---------- 武器 ---------- */
  {
    id: 'woodsword',
    n: '桃木劍',
    star: 1,
    sh: 'v2',
    tags: ['weapon', 'sword'],
    cd: 1.3,
    dmg: [2, 4],
    ic: 'gear_weapon_16'
  },
  {
    id: 'knife',
    n: '短刀',
    star: 1,
    sh: 's1',
    tags: ['weapon', 'dagger'],
    cd: 0.9,
    dmg: [1, 3],
    crit: 10,
    ic: 'gear_weapon_13'
  },
  { id: 'huntbow', n: '獵弓', star: 1, sh: 'v3', tags: ['weapon', 'bow'], cd: 1.6, dmg: [3, 5], ic: 'gear_weapon_3' },
  {
    id: 'club',
    n: '單手錘',
    star: 1,
    sh: 'v2',
    tags: ['weapon', 'mace'],
    cd: 1.8,
    dmg: [3, 6],
    on: { sunder: 1, stun: [10, 0.5] },
    ic: 'gear_weapon_8'
  },
  {
    id: 'ironsword',
    n: '長劍',
    star: 2,
    sh: 'v2',
    tags: ['weapon', 'sword'],
    cd: 1.2,
    dmg: [4, 6],
    on: { bleed: 1 },
    ic: 'gear_weapon_1'
  },
  {
    id: 'firestaff',
    n: '火球法杖',
    star: 2,
    sh: 'v3',
    tags: ['weapon', 'staff', 'fire'],
    cd: 1.7,
    dmg: [3, 5],
    on: { burn: 2 },
    ic: 'sk_fire'
  },
  {
    id: 'icestaff',
    n: '冰錐法杖',
    star: 2,
    sh: 'v3',
    tags: ['weapon', 'staff', 'cold'],
    cd: 1.8,
    dmg: [3, 5],
    on: { freeze: [35, 1] },
    ic: 'sk_iceshard'
  },
  {
    id: 'venomknife',
    n: '毒匕首',
    star: 2,
    sh: 's1',
    tags: ['weapon', 'dagger', 'poison'],
    cd: 1,
    dmg: [1, 2],
    on: { poison: 1 },
    ic: 'gear_weapon_28'
  },
  {
    id: 'waraxe',
    n: '戰斧',
    star: 2,
    sh: 'l3',
    tags: ['weapon', 'axe'],
    cd: 2,
    dmg: [6, 9],
    crit: 5,
    on: { bleed: 1, sunder: 1 },
    ic: 'gear_weapon_2'
  },
  {
    id: 'thunderhammer',
    n: '雷霆錘',
    star: 3,
    sh: 'sq',
    tags: ['weapon', 'mace', 'light'],
    cd: 2.2,
    dmg: [7, 11],
    on: { sunder: 1, stun: [25, 0.6] },
    ic: 'gear_weapon_23'
  },
  {
    id: 'spear',
    n: '長槍',
    star: 3,
    sh: 'v3',
    tags: ['weapon', 'spear'],
    cd: 1.5,
    dmg: [5, 8],
    crit: 10,
    on: { bleed: 1 },
    ic: 'gear_weapon_9'
  },
  {
    id: 'repeater',
    n: '連弩',
    star: 3,
    sh: 'h2',
    tags: ['weapon', 'xbow'],
    cd: 0.8,
    dmg: [2, 4],
    ic: 'sk_barrage'
  },
  {
    id: 'scythe',
    n: '血關刀',
    star: 3,
    sh: 'l3',
    tags: ['weapon', 'dark'],
    cd: 1.6,
    dmg: [4, 7],
    on: { weak: 20, ls: 30 },
    pre: { seal: 3 },
    ic: 'gear_weapon_30'
  },
  {
    id: 'dragonslayer',
    n: '斬鐵大劍',
    star: 4,
    sh: 'big',
    tags: ['weapon', 'sword', 'twohand'],
    cd: 2,
    dmg: [12, 18],
    crit: 10,
    on: { bleed: 2 },
    ic: 'sk_slash2'
  },
  {
    id: 'phoenixbow',
    n: '火焰弓',
    star: 4,
    sh: 'v3',
    tags: ['weapon', 'bow', 'fire'],
    cd: 1.4,
    dmg: [6, 9],
    on: { burn: 3 },
    ic: 'sk_firearrow'
  },
  {
    id: 'skythunder',
    n: '天雷',
    star: 5,
    sh: 't4',
    tags: ['weapon', 'light'],
    cd: 1.8,
    dmg: [14, 20],
    on: { stun: [30, 0.8] },
    pre: { down: 1 },
    ic: 'sk_thunderstorm'
  },
  /* ---------- 0.1.9 雙手武器與更多形狀（佔格子多、數值高，要取捨） ---------- */
  {
    id: 'greatsword',
    n: '雙手劍',
    star: 3,
    sh: 'r6',
    tags: ['weapon', 'sword', 'twohand'],
    cd: 2,
    dmg: [12, 18],
    on: { bleed: 2 },
    ic: 'gear_weapon_5'
  },
  {
    id: 'greataxe',
    n: '雙手斧',
    star: 3,
    sh: 'l4',
    tags: ['weapon', 'axe', 'twohand'],
    cd: 2.1,
    dmg: [11, 16],
    on: { bleed: 1, sunder: 2 },
    ic: 'gear_weapon_21'
  },
  {
    id: 'pickaxe',
    n: '碎石鎚',
    star: 3,
    sh: 'v3',
    tags: ['weapon', 'mace', 'twohand'],
    cd: 2.2,
    dmg: [8, 12],
    on: { sunder: 3 },
    ic: 'sk_shatter'
  },
  {
    id: 'longbow',
    n: '長弓',
    star: 2,
    sh: 'v4',
    tags: ['weapon', 'bow', 'twohand'],
    cd: 1.7,
    dmg: [4, 7],
    crit: 10,
    ic: 'gear_weapon_11'
  },
  {
    id: 'halberd',
    n: '戰戟',
    star: 3,
    sh: 'v4',
    tags: ['weapon', 'spear', 'axe', 'twohand'],
    cd: 1.8,
    dmg: [7, 11],
    on: { bleed: 1 },
    ic: 'gear_weapon_10'
  },
  {
    id: 'flail',
    n: '流星錘',
    star: 2,
    sh: 'z4',
    tags: ['weapon', 'mace'],
    cd: 1.6,
    dmg: [4, 7],
    on: { sunder: 1 },
    ic: 'gear_weapon_22'
  },
  {
    id: 'twinblades',
    n: '雙刀',
    star: 2,
    sh: 'h2',
    tags: ['weapon', 'dagger'],
    cd: 0.8,
    dmg: [1, 3],
    on: { bleed: 1 },
    ic: 'sk_whirlblade'
  },
  {
    id: 'katana',
    n: '太刀',
    star: 4,
    sh: 'l4',
    tags: ['weapon', 'sword'],
    cd: 1.3,
    dmg: [9, 14],
    crit: 15,
    on: { bleed: 2 },
    ic: 'gear_weapon_18'
  },
  {
    id: 'shadowstaff',
    n: '暗影法杖',
    star: 3,
    sh: 'v3',
    tags: ['weapon', 'staff', 'dark'],
    cd: 1.6,
    dmg: [4, 7],
    on: { weak: 25 },
    ic: 'gear_weapon_4'
  },
  {
    id: 'holymace',
    n: '聖光錘',
    star: 3,
    sh: 'v2',
    tags: ['weapon', 'mace', 'holy'],
    cd: 1.7,
    dmg: [5, 8],
    on: { blind: 20 },
    ic: 'sk_titanfall'
  },
  /* ---------- 0.1.13 補上各系星級的空窗（冰、雷、毒、暗、聖、匕首、弓弩、斧、槍、法杖） ---------- */
  {
    id: 'handaxe',
    n: '手斧',
    star: 1,
    sh: 's1',
    tags: ['weapon', 'axe'],
    cd: 1.5,
    dmg: [2, 4],
    on: { bleed: 1 },
    ic: 'sk_hack'
  },
  {
    id: 'handxbow',
    n: '手弩',
    star: 1,
    sh: 's1',
    tags: ['weapon', 'xbow'],
    cd: 1.2,
    dmg: [1, 3],
    ic: 'gear_weapon_12'
  },
  {
    id: 'huntxbow',
    n: '爆矢弩',
    star: 2,
    sh: 'h2',
    tags: ['weapon', 'xbow'],
    cd: 1.1,
    dmg: [2, 4],
    crit: 5,
    ic: 'sk_burstbolt'
  },
  {
    id: 'pike',
    n: '投矛',
    star: 2,
    sh: 'v3',
    tags: ['weapon', 'spear'],
    cd: 1.5,
    dmg: [3, 6],
    on: { bleed: 1 },
    ic: 'sk_javelin'
  },
  {
    id: 'sparkdagger',
    n: '電弧刃',
    star: 2,
    sh: 's1',
    tags: ['weapon', 'dagger', 'light'],
    cd: 1,
    dmg: [1, 3],
    on: { stun: [10, 0.4] },
    ic: 'sk_arc'
  },
  {
    id: 'shadowknife',
    n: '暗影之牙',
    star: 2,
    sh: 's1',
    tags: ['weapon', 'dagger', 'dark'],
    cd: 1,
    dmg: [1, 3],
    on: { weak: 15 },
    ic: 'sk_malice'
  },
  {
    id: 'holywand',
    n: '淨蓮法杖',
    star: 2,
    sh: 'v2',
    tags: ['weapon', 'staff', 'holy'],
    cd: 1.6,
    dmg: [2, 4],
    on: { blind: 20 },
    ic: 'sk_purify'
  },
  {
    id: 'frostbow',
    n: '冰霜長弓',
    star: 3,
    sh: 'v3',
    tags: ['weapon', 'bow', 'cold'],
    cd: 1.5,
    dmg: [4, 7],
    on: { freeze: [25, 1] },
    ic: 'sk_frostarrow'
  },
  {
    id: 'assassinblade',
    n: '刺客短劍',
    star: 3,
    sh: 's1',
    tags: ['weapon', 'dagger'],
    cd: 0.9,
    dmg: [2, 4],
    crit: 20,
    on: { bleed: 1 },
    ic: 'sk_assassinate'
  },
  {
    id: 'flamesword',
    n: '炎槍',
    star: 3,
    sh: 'v3',
    tags: ['weapon', 'spear', 'fire'],
    cd: 1.4,
    dmg: [4, 7],
    on: { burn: 2 },
    ic: 'sk_flamelance'
  },
  {
    id: 'rotstaff',
    n: '枯萎法杖',
    star: 3,
    sh: 'v3',
    tags: ['weapon', 'staff', 'poison'],
    cd: 1.5,
    dmg: [2, 4],
    on: { poison: 2, sunder: 1 },
    ic: 'sk_blight'
  },
  {
    id: 'icefang',
    n: '碎冰刃',
    star: 4,
    sh: 's1',
    tags: ['weapon', 'dagger', 'cold'],
    cd: 0.8,
    dmg: [3, 6],
    crit: 15,
    on: { freeze: [20, 0.8] },
    ic: 'sk_iceshatter'
  },
  {
    id: 'frostaxe',
    n: '冰河斧',
    star: 4,
    sh: 'l3',
    tags: ['weapon', 'axe', 'cold'],
    cd: 1.8,
    dmg: [9, 14],
    on: { freeze: [25, 1], bleed: 1 },
    ic: 'sk_glacier'
  },
  {
    id: 'crystalstaff',
    n: '暴風雪法杖',
    star: 4,
    sh: 'v3',
    tags: ['weapon', 'staff', 'cold'],
    cd: 1.7,
    dmg: [7, 11],
    on: { freeze: [35, 1.2] },
    ic: 'sk_blizzard'
  },
  {
    id: 'stormhammer',
    n: '雷神之錘',
    star: 4,
    sh: 'sq',
    tags: ['weapon', 'mace', 'light'],
    cd: 2,
    dmg: [11, 16],
    on: { stun: [25, 0.7], sunder: 1 },
    ic: 'sk_thorhammer'
  },
  {
    id: 'venomspear',
    n: '毒三叉戟',
    star: 4,
    sh: 'v3',
    tags: ['weapon', 'spear', 'poison'],
    cd: 1.5,
    dmg: [6, 10],
    on: { poison: 3 },
    ic: 'gear_weapon_29'
  },
  {
    id: 'heavyxbow',
    n: '重弩',
    star: 4,
    sh: 'sq',
    tags: ['weapon', 'xbow', 'twohand'],
    cd: 1.6,
    dmg: [10, 15],
    crit: 10,
    on: { sunder: 2 },
    ic: 'gear_weapon_26'
  },
  {
    id: 'nightscythe',
    n: '夜魔鐮',
    star: 4,
    sh: 'l3',
    tags: ['weapon', 'dark'],
    cd: 1.5,
    dmg: [7, 11],
    on: { weak: 25, ls: 20 },
    ic: 'sk_souldrain'
  },
  {
    id: 'holysword',
    n: '聖劍',
    star: 4,
    sh: 'v3',
    tags: ['weapon', 'sword', 'holy'],
    cd: 1.4,
    dmg: [8, 12],
    crit: 10,
    on: { blind: 20 },
    ic: 'sk_judgment'
  },
  { id: 'mithril', n: '精鋼板甲', star: 4, sh: 'sq', tags: ['armor'], hp: 80, arm: 6, dodge: 5, ic: 'gear_chest_3' },
  {
    id: 'phoenixdown',
    n: '鳳凰羽毛',
    star: 4,
    sh: 's1',
    tags: ['potion', 'fire'],
    pot: [30, 60, 1],
    regen: 1,
    ic: 'sk_phoenix'
  },
  /* ---------- 0.1.14 補武器空窗（暗、聖沒有 1★；吸血缺 1～2★） ---------- */
  {
    id: 'shadowdirk',
    n: '暗影拳刃',
    star: 1,
    sh: 's1',
    tags: ['weapon', 'dagger', 'dark'],
    cd: 1.1,
    dmg: [1, 2],
    on: { weak: 10 },
    ic: 'gear_weapon_27'
  },
  {
    id: 'acolytewand',
    n: '見習權杖',
    star: 1,
    sh: 'v2',
    tags: ['weapon', 'staff', 'holy'],
    cd: 1.6,
    dmg: [1, 3],
    on: { blind: 10 },
    ic: 'gear_weapon_15'
  },
  {
    id: 'bloodsword',
    n: '吸血短劍',
    star: 2,
    sh: 'v2',
    tags: ['weapon', 'sword', 'dark'],
    cd: 1.3,
    dmg: [3, 5],
    on: { ls: 15 },
    ic: 'gear_weapon_0'
  },
  /* ---------- 0.1.8 職業的 1★ 起手武器（選完職業送一把） ---------- */
  {
    id: 'woodspear',
    n: '竹槍',
    star: 1,
    sh: 'v3',
    tags: ['weapon', 'spear'],
    cd: 1.6,
    dmg: [2, 4],
    ic: 'sk_lunge'
  },
  {
    id: 'emberwand',
    n: '鬼火骨杖',
    star: 1,
    sh: 'v2',
    tags: ['weapon', 'staff', 'fire'],
    cd: 1.6,
    dmg: [1, 3],
    on: { burn: 1 },
    ic: 'gear_weapon_31'
  },
  {
    id: 'frostwand',
    n: '冰矛短杖',
    star: 1,
    sh: 'v2',
    tags: ['weapon', 'staff', 'cold'],
    cd: 1.7,
    dmg: [2, 3],
    on: { freeze: [15, 0.8] },
    ic: 'sk_ice'
  },
  {
    id: 'sparkrod',
    n: '雷紋棍',
    star: 1,
    sh: 'v2',
    tags: ['weapon', 'mace', 'light'],
    cd: 1.5,
    dmg: [2, 3],
    on: { stun: [10, 0.4] },
    ic: 'sk_mantra'
  },
  {
    id: 'needle',
    n: '毒牙',
    star: 1,
    sh: 's1',
    tags: ['weapon', 'dagger', 'poison'],
    cd: 1.2,
    dmg: [1, 1],
    on: { poison: 1 },
    ic: 'msk_venom'
  },
  /* ---------- 0.1.8 各系的 5★ ---------- */
  {
    id: 'excalibur',
    n: '符文王劍',
    star: 5,
    sh: 'v3',
    tags: ['weapon', 'sword', 'holy'],
    cd: 1.4,
    dmg: [14, 20],
    crit: 20,
    on: { blind: 15 },
    ic: 'gear_weapon_20'
  },
  {
    id: 'sunbow',
    n: '流星神弓',
    star: 5,
    sh: 'v3',
    tags: ['weapon', 'bow', 'fire'],
    cd: 1.1,
    dmg: [10, 15],
    crit: 15,
    on: { burn: 2 },
    ic: 'sk_starfall'
  },
  {
    id: 'stormxbow',
    n: '攻城弩砲',
    star: 5,
    sh: 'h2',
    tags: ['weapon', 'xbow'],
    cd: 0.7,
    dmg: [5, 8],
    crit: 10,
    ic: 'unit_ballista'
  },
  {
    id: 'shadowclaw',
    n: '影爪',
    star: 5,
    sh: 's1',
    tags: ['weapon', 'dagger', 'dark'],
    cd: 0.7,
    dmg: [5, 8],
    crit: 25,
    on: { poison: 1, ls: 10, weak: 20 },
    ic: 'gear_weapon_14'
  },
  {
    id: 'archstaff',
    n: '大賢者法杖',
    star: 5,
    sh: 'v3',
    tags: ['weapon', 'staff', 'fire', 'cold'],
    cd: 1.8,
    dmg: [10, 15],
    on: { burn: 3, freeze: [25, 1] },
    ic: 'sk_elemweak'
  },
  {
    id: 'plaguestaff',
    n: '瘟疫法杖',
    star: 5,
    sh: 'v3',
    tags: ['weapon', 'staff', 'poison'],
    cd: 1.2,
    dmg: [4, 6],
    on: { poison: 4 },
    ic: 'sk_contagion'
  },
  {
    id: 'worldhammer',
    n: '碎界戰鎚',
    star: 5,
    sh: 'sq',
    tags: ['weapon', 'mace'],
    cd: 2.4,
    dmg: [24, 34],
    on: { sunder: 3, stun: [25, 1] },
    ic: 'gear_weapon_7'
  },
  {
    id: 'demonaxe',
    n: '魔斧',
    star: 5,
    sh: 'l3',
    tags: ['weapon', 'axe', 'dark'],
    cd: 1.9,
    dmg: [18, 26],
    on: { bleed: 2, ls: 15 },
    ic: 'gear_weapon_6'
  },
  {
    id: 'dragonlance',
    n: '龍騎槍',
    star: 5,
    sh: 'v3',
    tags: ['weapon', 'spear', 'fire'],
    cd: 1.5,
    dmg: [14, 20],
    crit: 15,
    on: { burn: 1 },
    ic: 'sk_dragonspear'
  },
  /* ---------- 防具與盾 ---------- */
  { id: 'leathercap', n: '皮帽', star: 1, sh: 's1', tags: ['armor'], hp: 12, arm: 1, ic: 'gear_helm_0' },
  { id: 'leatherarmor', n: '皮甲', star: 1, sh: 'sq', tags: ['armor'], hp: 30, ic: 'gear_chest_0' },
  { id: 'woodshield', n: '木盾', star: 1, sh: 'sq', tags: ['shield'], cd: 3, block: 6, ic: 'gear_offhand_2' },
  { id: 'ironhelm', n: '鐵盔', star: 2, sh: 's1', tags: ['armor'], hp: 10, arm: 3, ic: 'gear_helm_1' },
  { id: 'ironshield', n: '鐵盾', star: 2, sh: 'sq', tags: ['shield'], cd: 3, block: 10, ic: 'ail_guard' },
  { id: 'boots', n: '輕靴', star: 2, sh: 's1', tags: ['armor'], dodge: 8, ic: 'gear_boots_0' },
  { id: 'chainmail', n: '鎖子甲', star: 3, sh: 'sq', tags: ['armor'], hp: 50, arm: 3, ic: 'gear_chest_1' },
  {
    id: 'thornshield',
    n: '骨刺盾',
    star: 3,
    sh: 'sq',
    tags: ['shield'],
    cd: 3,
    block: 12,
    thorns: 3,
    ic: 'gear_offhand_10'
  },
  {
    id: 'paladinshield',
    n: '聖騎士盾',
    star: 4,
    sh: 'sq',
    tags: ['shield', 'holy'],
    cd: 2.5,
    block: 18,
    heal: 3,
    pre: { seal: 5 },
    ic: 'gear_offhand_9'
  },
  /* ---------- 0.1.8 防具、盾的 5★ ---------- */
  { id: 'dragonmail', n: '龍鱗甲', star: 5, sh: 'sq', tags: ['armor', 'fire'], hp: 110, arm: 8, ic: 'gear_chest_10' },
  {
    id: 'aegis',
    n: '神盾',
    star: 5,
    sh: 'sq',
    tags: ['shield', 'holy'],
    cd: 2.2,
    block: 30,
    thorns: 6,
    heal: 5,
    ic: 'sk_holyshield'
  },
  { id: 'towershield', n: '塔盾', star: 3, sh: 'v3', tags: ['shield'], cd: 2.6, block: 16, ic: 'gear_offhand_3' },
  { id: 'spikedmail', n: '鱗甲', star: 3, sh: 'x5', tags: ['armor'], hp: 60, arm: 4, ic: 'gear_chest_4' },
  { id: 'cape', n: '聖袍', star: 2, sh: 'h3', tags: ['armor'], hp: 20, dodge: 6, ic: 'gear_chest_11' },
  /* ---------- 飾品（相鄰加成；天賦都變成這些） ---------- */
  {
    id: 'whetstone',
    n: '磨刀石',
    star: 1,
    sh: 's1',
    tags: ['trinket'],
    adj: [{ tag: 'weapon', dmg: 2 }],
    ic: 'cur_whet'
  },
  {
    id: 'clover',
    n: '翡翠護符',
    star: 1,
    sh: 's1',
    tags: ['trinket'],
    all: [{ tag: 'weapon', crit: 4 }],
    ic: 'gear_amulet_1'
  },
  {
    id: 'fireorb',
    n: '火焰寶珠',
    star: 2,
    sh: 's1',
    tags: ['trinket', 'fire'],
    adj: [{ tag: 'weapon', burn: 1 }],
    ic: 'sup_sp_gfire'
  },
  {
    id: 'icecrystal',
    n: '冰晶',
    star: 2,
    sh: 's1',
    tags: ['trinket', 'cold'],
    adj: [{ tag: 'weapon', freezeCh: 15 }],
    ic: 'sup_sp_gcold'
  },
  {
    id: 'venomsac',
    n: '毒性寶石',
    star: 2,
    sh: 's1',
    tags: ['trinket', 'poison'],
    adj: [{ tag: 'weapon', poison: 1 }],
    ic: 'sup_sp_poison'
  },
  {
    id: 'wardrum',
    n: '戰號角',
    star: 2,
    sh: 'h2',
    tags: ['trinket'],
    row: [{ tag: 'weapon', spd: 12 }],
    ic: 'sk_warcry'
  },
  {
    id: 'vampfang',
    n: '吸血牙',
    star: 3,
    sh: 's1',
    tags: ['trinket', 'dark'],
    adj: [{ tag: 'weapon', ls: 10 }],
    ic: 'sup_sp_leech'
  },
  {
    id: 'prism',
    n: '暴擊稜鏡',
    star: 3,
    sh: 's1',
    tags: ['trinket'],
    /* 0.1.62 重做：暴擊傷害＋相鄰暴擊率 */
    fx: { critMul: 30 },
    adj: [{ tag: 'weapon', crit: 10 }],
    ic: 'cur_prism'
  },
  {
    id: 'shieldrack',
    n: '守護圖騰',
    star: 3,
    sh: 'h2',
    tags: ['trinket'],
    adj: [{ tag: 'shield', spd: 20, block: 3 }],
    ic: 'sk_guardtotem'
  },
  {
    id: 'bersmask',
    n: '詛咒面具',
    star: 4,
    sh: 's1',
    tags: ['trinket'],
    all: [{ tag: 'weapon', spd: 15 }],
    fx: { take: 10 },
    ic: 'sk_despair'
  },
  /* ---------- 0.1.7 輔助道具（配合開局職業的流派；佔格子，要取捨） ---------- */
  {
    id: 'quiver',
    n: '箭袋',
    star: 2,
    sh: 'v2',
    tags: ['trinket'],
    for: 'bow',
    adj: [
      { tag: 'bow', spd: 20 },
      { tag: 'xbow', spd: 20 }
    ],
    ic: 'sk_rainarrow'
  },
  {
    id: 'hawkeye',
    n: '神射之眼',
    star: 4,
    sh: 's1',
    tags: ['trinket'],
    for: 'bow',
    all: [
      { tag: 'bow', crit: 12 },
      { tag: 'xbow', crit: 12 }
    ],
    ic: 'sk_deadeye'
  },
  {
    id: 'sheath',
    n: '劍帶',
    star: 2,
    sh: 's1',
    tags: ['trinket'],
    for: 'sword',
    adj: [{ tag: 'sword', crit: 12, dmg: 1 }],
    ic: 'gear_belt_4'
  },
  {
    id: 'anvil',
    n: '重擊寶石',
    star: 4,
    sh: 'sq',
    tags: ['trinket'],
    for: 'mace',
    /* 0.1.62 重做：拿掉攻速 -10%，傷害加成提高 */
    adj: [{ tag: 'weapon', dmgPct: 45 }],
    ic: 'sup_sp_heavy'
  },
  {
    id: 'cloak',
    n: '暗影兜帽',
    star: 3,
    sh: 'h2',
    tags: ['trinket'],
    for: 'dagger',
    fx: { dodge: 8 },
    adj: [{ tag: 'dagger', crit: 10 }],
    ic: 'gear_helm_2'
  },
  {
    id: 'spellbook',
    n: '法術卷軸',
    star: 3,
    sh: 'h2',
    tags: ['trinket'],
    for: 'staff',
    row: [{ tag: 'staff', dmgPct: 25 }],
    ic: 'sk_exorcise'
  },
  {
    id: 'powder',
    n: '火藥地雷',
    star: 3,
    sh: 'sq',
    tags: ['trinket'],
    for: 'fire',
    adj: [{ tag: 'fire', burn: 2, dmgPct: 10 }],
    ic: 'unit_blastmine'
  },
  {
    id: 'frostrune',
    n: '冰霜符文',
    star: 3,
    sh: 's1',
    tags: ['trinket'],
    for: 'cold',
    row: [{ tag: 'cold', freezeCh: 10 }],
    ic: 'mat_tablet'
  },
  {
    id: 'thunderstone',
    n: '雷石',
    star: 2,
    sh: 's1',
    tags: ['trinket'],
    for: 'light',
    adj: [{ tag: 'light', stunCh: 8, dmg: 2 }],
    ic: 'sk_spark'
  },
  {
    id: 'toxinvial',
    n: '毒氣罐',
    star: 3,
    sh: 'v2',
    tags: ['trinket'],
    for: 'poison',
    row: [
      { tag: 'poison', poison: 1 },
      { tag: 'dagger', poison: 1 }
    ],
    ic: 'unit_poisontrap'
  },
  {
    id: 'bone',
    n: '獸牙項鍊',
    star: 1,
    sh: 's1',
    tags: ['trinket'],
    for: 'pet',
    adj: [{ tag: 'pet', dmg: 2, spd: 10 }],
    ic: 'gear_amulet_6'
  },
  {
    id: 'beasttotem',
    n: '獸王圖騰',
    star: 4,
    sh: 'v2',
    tags: ['trinket'],
    for: 'pet',
    all: [{ tag: 'pet', dmgPct: 20 }],
    ic: 'sk_crytotem'
  },
  {
    id: 'crest',
    n: '小圓盾',
    star: 2,
    sh: 's1',
    tags: ['trinket'],
    for: 'shield',
    adj: [{ tag: 'shield', block: 4, blockPct: 15 }],
    ic: 'gear_offhand_8'
  },
  {
    id: 'warbanner',
    n: '戰旗',
    star: 3,
    sh: 'v3',
    tags: ['trinket'],
    for: 'spear',
    row: [{ tag: 'weapon', spd: 10 }],
    ic: 'sk_banner'
  },
  {
    id: 'hourglass',
    n: '沙漏',
    star: 3,
    sh: 's1',
    tags: ['trinket'],
    adj: [{ tag: 'weapon', spd: 15 }],
    ic: 'sk_meditate'
  },
  {
    id: 'cauldron',
    n: '點金石',
    star: 3,
    sh: 'sq',
    tags: ['trinket'],
    for: 'potion',
    fx: { potMul: 40, potUse: 1 },
    ic: 'cur_alch'
  },
  { id: 'purse', n: '金幣堆', star: 2, sh: 's1', tags: ['trinket'], gold: 1, ic: 'mat_gold' },
  /* 0.1.35 金錢標：傷害只有同星一格武器的六成，開戰時身上有錢就每次攻擊花 1 金、整把武器的攻擊數值翻倍（coin） */
  {
    id: 'coindart',
    n: '金錢標',
    star: 3,
    sh: 's1',
    tags: ['weapon'],
    cd: 1,
    dmg: [1, 3],
    crit: 10,
    coin: 1,
    ic: 'tree_n089'
  },
  /* 0.1.35 魔劍正宗：浪人核心送的，商店與戰利品不會出（ns）；本身沒有數值，貼在旁邊的劍會被吸收、加上那把劍的數值（absorb） */
  {
    id: 'masamune',
    n: '魔劍正宗',
    star: 5,
    sh: 'v4',
    tags: ['weapon', 'sword'],
    cd: 1.3,
    dmg: [0, 0],
    /* 0.1.46 劍、矛都會吸收（浪人的職業加成也是劍、矛）；0.1.47 直五格 → 直四格（4×4 背包也放得下） */
    absorb: ['sword', 'spear'],
    ns: 1,
    ic: 'asc_master_b4'
  },
  /* 0.1.37 核心送的道具（ns：商店、戰利品、池子都不會出） */
  {
    id: 'philstone',
    n: '賢者之石',
    star: 5,
    sh: 's1',
    tags: ['trinket'],
    fx: { immAll: 1 },
    ns: 1,
    ic: 'asc_alchemist_c1'
  },
  /* 0.1.74 商人・奸商送的：開戰時讓敵人隨機兩把武器降一階 */
  {
    id: 'blackgoods',
    n: '黑心貨',
    star: 3,
    sh: 's1',
    tags: ['trinket'],
    pre: { down: 2 },
    ns: 1,
    ic: 'cur_chaos'
  },
  /* 煉成做出來的：效果存在道具的 ex（BREW 的代號），生命低於 50% 喝、可以喝 2 次 */
  {
    id: 'ultelixir',
    n: '終極藥劑',
    star: 5,
    sh: 's1',
    tags: ['potion'],
    pot: [50, 0, 2],
    ns: 1,
    ic: 'asc_alchemist_b1'
  },
  {
    id: 'fsnake',
    n: '墮落十二生肖・蛇',
    star: 5,
    sh: 'sq',
    tags: ['pet', 'poison'],
    cd: 1.4,
    dmg: [8, 12],
    on: { poison: 5, venom: 3, age: 2 },
    ns: 1,
    ic: 'z_snake'
  },
  /* 別西卜的封印：拿到後過 SEAL_RC 回合變成別西卜（nextRound 的 sealTick） */
  {
    id: 'bzseal',
    n: '別西卜的封印',
    star: 5,
    sh: 's1',
    tags: ['trinket'],
    hatch: 'beelzebub',
    ns: 1,
    ic: 'asc_talisman_b4'
  },
  {
    id: 'beelzebub',
    n: '七宗罪・別西卜',
    star: 5,
    sh: 'sq',
    tags: ['pet', 'poison', 'dark'],
    cd: 1.8,
    dmg: [20, 34],
    on: { poison: 12, venom: 8, age: 5, corrode: 5 },
    imm: 1,
    ns: 1,
    ic: 'beelzebub'
  },
  /* 寒冰之心：生命 +10，每場自己觸發的凍結、冰緩每次 +5 生命（o.hh，跨場累積） */
  {
    id: 'icheart',
    n: '寒冰之心',
    star: 5,
    sh: 'sq',
    tags: ['trinket', 'cold'],
    hp: 10,
    iceHp: 5,
    ns: 1,
    ic: 'tree_n039'
  },
  /* 0.1.50 弓箭手核心「神鷹」送的寵物：帶弓標籤（吃弓箭手的加成），每次命中插 2 支箭 */
  {
    id: 'skyhawk',
    n: '神鷹',
    star: 5,
    sh: 'h2',
    tags: ['pet', 'bow'],
    cd: 0.9,
    dmg: [5, 8],
    on: { blind: 20 },
    stick: 1,
    ns: 1,
    ic: 'a:hunt_hawkeagle'
  },
  /* 0.1.51 雷系道具（雷法師重製）：雷霆標槍（矛、雷）、雷光弓（弓、雷）、電容線圈（相鄰雷電荷 +1）、雷霆之心（放電傷害）、雷蝙蝠（寵物） */
  {
    id: 'thunderjav',
    n: '雷霆標槍',
    star: 2,
    sh: 'v3',
    tags: ['weapon', 'spear', 'light'],
    cd: 1.3,
    dmg: [3, 5],
    on: { stun: [10, 0.4] },
    chainN: 1,
    ic: 'asc_storm_b3'
  },
  {
    id: 'thunderbow',
    n: '雷光弓',
    star: 3,
    sh: 'v3',
    tags: ['weapon', 'bow', 'light'],
    cd: 1.3,
    dmg: [4, 7],
    on: { stun: [15, 0.4] },
    ic: 'sk_lightarrow'
  },
  {
    id: 'teslacoil',
    n: '電容線圈',
    star: 2,
    sh: 's1',
    tags: ['trinket', 'light'],
    adj: [{ tag: 'light', charge: 1 }],
    ic: 'unit_tesla'
  },
  {
    id: 'thunderheart',
    n: '雷霆之心',
    star: 3,
    sh: 's1',
    tags: ['trinket', 'light'],
    fx: { zapPct: 50 },
    ic: 'tree_n040'
  },
  {
    id: 'thunderbat',
    n: '雷蝙蝠',
    star: 4,
    sh: 's1',
    tags: ['pet', 'light'],
    cd: 0.9,
    dmg: [4, 6],
    on: { stun: [10, 0.3] },
    chainN: 1,
    ic: 'a:m_thunderbat'
  },
  /* 0.1.53 馴獸師核心「四兇召來」：遠古之器（獻祭寵物累積星數，每 VESSEL_N 星召喚一隻四兇）；四兇都免疫異常與封鎖（imm） */
  {
    id: 'vessel',
    n: '遠古之器',
    star: 5,
    sh: 's1',
    tags: ['trinket'],
    sacrifice: 1,
    ns: 1,
    ic: 'it_cauldron'
  },
  {
    id: 'taotie',
    n: '四兇・饕餮',
    star: 5,
    sh: 'sq',
    tags: ['pet', 'dark'],
    cd: 1.3,
    dmg: [14, 20],
    on: { ls: 25 },
    gorge: 3,
    imm: 1,
    ns: 1,
    ic: 'a:taotie'
  },
  {
    id: 'qiongqi',
    n: '四兇・窮奇',
    star: 5,
    sh: 'sq',
    tags: ['pet'],
    cd: 1,
    dmg: [12, 18],
    sealHit: [30, 1.5],
    imm: 1,
    ns: 1,
    ic: 'a:qiongqi'
  },
  {
    id: 'taowu',
    n: '四兇・檮杌',
    star: 5,
    sh: 'sq',
    tags: ['pet'],
    cd: 1.8,
    dmg: [18, 28],
    hp: 120,
    fx: { dr: 15 },
    imm: 1,
    ns: 1,
    ic: 'a:taowu'
  },
  {
    id: 'hundun',
    n: '四兇・混沌',
    star: 5,
    sh: 'sq',
    tags: ['pet', 'dark'],
    cd: 1.2,
    dmg: [12, 18],
    chaos: 1,
    imm: 1,
    ns: 1,
    ic: 'a:hundun'
  },
  {
    id: 'kingcrown',
    n: '王者之冠',
    star: 5,
    sh: 's1',
    tags: ['trinket'],
    all: [{ tag: 'weapon', dmgPct: 15, spd: 10 }],
    ic: 'gear_helm_4'
  },
  /* ---------- 0.1.9 異常狀態的輔助道具 ---------- */
  {
    id: 'whetwheel',
    n: '流血寶石',
    star: 3,
    /* 0.1.62 重做：Z 四格 → 橫兩格、流血 +2 */
    sh: 'h2',
    tags: ['trinket'],
    for: 'sword',
    adj: [{ tag: 'weapon', bleed: 2 }],
    ic: 'sup_sp_bleed'
  },
  {
    id: 'sunderstone',
    n: '破甲片',
    star: 2,
    sh: 's1',
    tags: ['trinket'],
    for: 'mace',
    adj: [{ tag: 'weapon', sunder: 1 }],
    ic: 'msk_sunder'
  },
  {
    id: 'hexdoll',
    n: '詛咒娃娃',
    star: 3,
    sh: 's1',
    tags: ['trinket', 'dark'],
    /* 0.1.62 重做：算 2 件暗、相鄰吸血 */
    adj: [{ tag: 'weapon', ls: 5 }],
    ic: 'a:m_paperdoll'
  },
  {
    id: 'holymirror',
    n: '八卦鏡',
    star: 3,
    sh: 's1',
    tags: ['trinket', 'holy'],
    /* 0.1.62 重做：算 2 件聖、反彈 */
    fx: { thornsF: 3 },
    ic: 'gear_offhand_12'
  },
  {
    id: 'weaponrack',
    n: '槍林',
    star: 4,
    sh: 'h3',
    tags: ['trinket'],
    row: [{ tag: 'weapon', dmgPct: 15 }],
    ic: 'sk_spearwall'
  },
  {
    id: 'grimoire',
    n: '符文法珠',
    star: 4,
    /* 0.1.62 重做：十字五格 → 直兩格，算 2 件法杖、法杖攻速 */
    sh: 'v2',
    tags: ['trinket'],
    all: [{ tag: 'staff', spd: 15 }],
    ic: 'gear_offhand_4'
  },
  /* ---------- 0.1.14 補輔助道具（平衡檢查：斧、雙手、暗、聖沒有，槍、火、冰、雷、毒只有 1 件） ---------- */
  {
    id: 'axestone',
    n: '斧魂',
    star: 2,
    sh: 's1',
    tags: ['trinket'],
    for: 'axe',
    adj: [{ tag: 'axe', bleed: 1, dmg: 2 }],
    ic: 'sk_cleave'
  },
  {
    id: 'warpaint',
    n: '血月',
    star: 4,
    sh: 'v2',
    tags: ['trinket'],
    for: 'axe',
    all: [{ tag: 'axe', dmgPct: 20, spd: 10 }],
    ic: 'sk_bloodlust'
  },
  {
    id: 'grip',
    n: '鐵手甲',
    star: 2,
    sh: 's1',
    tags: ['trinket'],
    for: 'twohand',
    adj: [{ tag: 'twohand', spd: 15 }],
    ic: 'gear_gloves_1'
  },
  {
    id: 'giantbelt',
    n: '巨人腰帶',
    star: 4,
    sh: 'h2',
    tags: ['trinket'],
    for: 'twohand',
    all: [{ tag: 'twohand', dmgPct: 25 }],
    fx: { hp: 20 },
    ic: 'gear_belt_1'
  },
  {
    id: 'darkorb',
    n: '暗影寶珠',
    star: 2,
    sh: 's1',
    tags: ['trinket', 'dark'],
    for: 'dark',
    adj: [{ tag: 'dark', weakCh: 10, ls: 5 }],
    ic: 'msk_chaosb'
  },
  {
    id: 'necrotome',
    n: '生死簿',
    star: 4,
    tags: ['trinket', 'dark'],
    /* 0.1.62 重做：算 2 件暗＋低血加成（之前全暗系 +20%、購買率 0%） */
    sh: 'v2',
    fx: { execute: 25 },
    ic: 'ail_doom'
  },
  {
    id: 'holywater',
    n: '聖光提燈',
    star: 2,
    sh: 's1',
    tags: ['trinket', 'holy'],
    for: 'holy',
    adj: [{ tag: 'holy', blindCh: 10, dmg: 2 }],
    ic: 'gear_offhand_1'
  },
  {
    id: 'holysigil',
    n: '聖星護符',
    star: 4,
    sh: 'v2',
    tags: ['trinket', 'holy'],
    for: 'holy',
    all: [{ tag: 'holy', dmgPct: 20 }],
    fx: { regen: 1 },
    ic: 'gear_amulet_7'
  },
  {
    id: 'spearrest',
    n: '槍魂',
    star: 2,
    sh: 's1',
    tags: ['trinket'],
    for: 'spear',
    adj: [{ tag: 'spear', crit: 10, bleed: 1 }],
    ic: 'sk_spinspear'
  },
  {
    id: 'emberstone',
    n: '餘燼石',
    star: 2,
    sh: 's1',
    tags: ['trinket'],
    for: 'fire',
    adj: [{ tag: 'fire', burn: 1, dmg: 1 }],
    ic: 'mat_dcrys'
  },
  {
    id: 'lavaheart',
    n: '煉獄之火',
    star: 4,
    sh: 'sq',
    tags: ['trinket'],
    /* 0.1.62 重做：算 2 件火、引爆燃燒 */
    fx: { combust: 2 },
    ic: 'sk_inferno'
  },
  {
    id: 'frostgem',
    n: '霜晶',
    star: 2,
    sh: 's1',
    tags: ['trinket'],
    for: 'cold',
    adj: [{ tag: 'cold', freezeCh: 10, dmg: 1 }],
    ic: 'mat_crystal'
  },
  {
    id: 'iceheart',
    n: '冰甲',
    star: 4,
    sh: 'sq',
    tags: ['trinket'],
    /* 0.1.62 重做：算 2 件冰、免疫凍結冰緩、護甲 */
    fx: { immFz: 1, arm: 6 },
    ic: 'sk_iceshield'
  },
  {
    id: 'stormcore',
    n: '雷霆之核',
    star: 4,
    sh: 'v2',
    tags: ['trinket'],
    for: 'light',
    all: [{ tag: 'light', dmgPct: 20, stunCh: 5 }],
    ic: 'sk_staticfield'
  },
  {
    id: 'venomking',
    n: '毒王之刃',
    star: 4,
    sh: 's1',
    tags: ['trinket'],
    for: 'poison',
    all: [{ tag: 'poison', dmgPct: 20, poison: 1 }],
    ic: 'sk_venomblade'
  },
  /* ---------- 藥水 ---------- */
  { id: 'potion', n: '生命藥水', star: 1, sh: 's1', tags: ['potion'], pot: [50, 20, 1], ic: 'p:ic_potion' },
  { id: 'herb', n: '再生花', star: 2, sh: 's1', tags: ['potion'], regen: 1, ic: 'sk_regenaura' },
  { id: 'bigpotion', n: '大生命藥水', star: 3, sh: 'v2', tags: ['potion'], pot: [40, 45, 1], ic: 'sk_heal' },
  /* ---------- 0.1.9 藥劑（開戰時丟向敵人；鍊金術士加強） ---------- */
  { id: 'weakbrew', n: '弱化符咒', star: 2, sh: 's1', tags: ['potion'], pre: { weak: 3 }, ic: 'sk_weaken' },
  { id: 'firebottle', n: '隕火彈', star: 2, sh: 's1', tags: ['potion', 'fire'], pre: { burn: 3 }, ic: 'sk_meteor' },
  { id: 'blindpowder', n: '致盲粉', star: 2, sh: 's1', tags: ['potion'], pre: { blind: 3 }, ic: 'sk_smokebomb' },
  { id: 'bleedoil', n: '血爆珠', star: 2, sh: 's1', tags: ['potion'], pre: { bleed: 4 }, ic: 'sk_bloodburst' },
  { id: 'ironskin', n: '鐵膚藥水', star: 2, sh: 's1', tags: ['potion'], fx: { arm: 4 }, ic: 'msk_harden' },
  {
    id: 'poisonbrew',
    n: '劇毒藥劑',
    star: 3,
    sh: 's1',
    tags: ['potion', 'poison'],
    pre: { poison: 2 },
    ic: 'sk_venomburst'
  },
  {
    id: 'frostbrew',
    n: '冰凍藥劑',
    star: 3,
    sh: 'v2',
    tags: ['potion', 'cold'],
    pre: { frozen: 3 },
    ic: 'sk_coldsnap'
  },
  { id: 'acidflask', n: '腐化毒霧', star: 3, sh: 's1', tags: ['potion'], pre: { sunder: 4 }, ic: 'sk_decay' },
  {
    id: 'ragepotion',
    n: '血祭',
    star: 3,
    sh: 's1',
    tags: ['potion'],
    rush: [25, 3],
    ic: 'sk_sacrifice'
  },
  { id: 'elixir', n: '萬靈藥', star: 5, sh: 's1', tags: ['potion'], pot: [50, 70, 2], regen: 2, ic: 'sk_vitality' },
  /* ---------- 寵物（原本的契靈） ---------- */
  { id: 'slime', n: '小史萊姆', star: 2, sh: 's1', tags: ['pet'], cd: 1.5, dmg: [1, 3], ic: 'a:m_slime_green' },
  {
    id: 'skeleton',
    n: '骷髏兵',
    star: 3,
    sh: 's1',
    tags: ['pet', 'dark'],
    cd: 1.8,
    dmg: [3, 5],
    on: { weak: 10 },
    ic: 'sk_skeleton'
  },
  {
    id: 'wolf',
    n: '戰狼',
    star: 3,
    sh: 'h2',
    tags: ['pet'],
    cd: 1.2,
    dmg: [3, 5],
    on: { ls: 10 },
    ic: 'sk_bloodhowl'
  },
  {
    id: 'babydragon',
    n: '幼龍',
    star: 4,
    sh: 'sq',
    tags: ['pet', 'fire'],
    cd: 2,
    dmg: [6, 9],
    on: { burn: 2 },
    ic: 'a:z_dragon'
  },
  /* ---------- 0.1.9 寵物（帶異常） ---------- */
  {
    id: 'viper',
    n: '青竹絲',
    star: 2,
    sh: 's1',
    tags: ['pet', 'poison'],
    cd: 1.3,
    dmg: [1, 2],
    on: { poison: 1 },
    ic: 'a:m_greenviper'
  },
  {
    id: 'hawk',
    n: '獵鷹',
    star: 3,
    sh: 's1',
    tags: ['pet'],
    cd: 1,
    dmg: [2, 4],
    on: { blind: 15 },
    ic: 'a:m_hawkeagle'
  },
  {
    id: 'bear',
    n: '黑熊',
    star: 4,
    sh: 'sq',
    tags: ['pet'],
    cd: 2,
    dmg: [8, 12],
    on: { sunder: 2 },
    ic: 'a:m_blackbear'
  },
  {
    id: 'vampbat',
    n: '吸血蝙蝠',
    star: 1,
    sh: 's1',
    tags: ['pet', 'dark'],
    cd: 1.2,
    dmg: [1, 2],
    on: { ls: 20 },
    ic: 'a:m_bat'
  },
  /* ---------- 0.1.8 寵物：1★ 起手、5★ ---------- */
  { id: 'treefrog', n: '樹蛙', star: 1, sh: 's1', tags: ['pet'], cd: 1.4, dmg: [1, 2], ic: 'a:m_treefrog' },
  {
    id: 'qilin',
    n: '風獅爺',
    star: 5,
    sh: 'sq',
    tags: ['pet', 'light', 'holy'],
    cd: 1.3,
    dmg: [10, 15],
    on: { stun: [15, 0.6] },
    ic: 'a:m_windlion'
  },
  {
    id: 'firecat',
    n: '火焰石虎',
    star: 5,
    sh: 'h2',
    tags: ['pet', 'fire'],
    cd: 0.9,
    dmg: [6, 9],
    on: { burn: 2 },
    ic: 'a:m_leopardcat'
  },
  /* ---------- 0.1.28 質變輔助（tf）：讓相鄰、有那個標籤的道具質變成「前綴・道具」，多了標籤（吃那一系的加成）和效果。
     一件道具只吃一個質變（取星級最高、再取階數高的）；效果照輔助的階數放大（跟相鄰加成一樣 ×1.6／×2.6）。
     tf：{ tag 對象標籤, n 前綴, add 多的標籤, m 加成（同 adj，另有 pierce、chain、guard、bash、heal、potBomb、preBoost、thornsF） } ---------- */
  {
    id: 'fireflower',
    n: '火焰之花',
    star: 3,
    sh: 's1',
    tags: ['trinket', 'tf'],
    tf: { tag: 'weapon', n: '火焰', add: ['fire'], m: { burn: 1 } },
    ic: 'sup_sp_cvfire'
  },
  {
    id: 'frostflower',
    n: '冰晶之花',
    star: 2,
    sh: 's1',
    tags: ['trinket', 'tf'],
    tf: { tag: 'weapon', n: '冰霜', add: ['cold'], m: { freezeCh: 15 } },
    ic: 'sup_sp_cvcold'
  },
  {
    id: 'venomflower',
    n: '毒藤之花',
    star: 2,
    sh: 's1',
    tags: ['trinket', 'tf'],
    tf: { tag: 'weapon', n: '劇毒', add: ['poison'], m: { poison: 1 } },
    ic: 'sk_toxin'
  },
  {
    id: 'holyflower',
    n: '聖光之花',
    star: 2,
    sh: 's1',
    tags: ['trinket', 'tf'],
    tf: { tag: 'weapon', n: '聖光', add: ['holy'], m: { blindCh: 12, dmg: 1 } },
    ic: 'asc_s_lotus'
  },
  {
    id: 'thunderflower',
    n: '雷鳴之花',
    star: 3,
    sh: 's1',
    tags: ['trinket', 'tf'],
    tf: { tag: 'weapon', n: '雷光', add: ['light'], m: { stunCh: 10, chain: 10 } },
    ic: 'sup_sp_cvlight'
  },
  {
    id: 'shadowflower',
    n: '冥府之花',
    star: 3,
    sh: 's1',
    tags: ['trinket', 'tf'],
    tf: { tag: 'weapon', n: '暗影', add: ['dark'], m: { weakCh: 15, ls: 8 } },
    ic: 'sup_sp_cvchaos'
  },
  {
    id: 'bloodrune',
    n: '嗜血符文',
    star: 2,
    sh: 's1',
    tags: ['trinket', 'tf'],
    tf: { tag: 'weapon', n: '嗜血', m: { bleed: 2, ls: 6 } },
    ic: 'sk_rend'
  },
  {
    id: 'piercerune',
    n: '破甲符文',
    star: 3,
    sh: 's1',
    tags: ['trinket', 'tf'],
    tf: { tag: 'weapon', n: '穿甲', m: { pierce: 40 } },
    ic: 'sup_sp_pen'
  },
  {
    id: 'assassinmark',
    n: '刺客印記',
    star: 3,
    sh: 's1',
    tags: ['trinket', 'tf'],
    tf: { tag: 'weapon', n: '暗殺', add: ['dagger'], m: { crit: 10 } },
    ic: 'sk_shadowstep'
  },
  {
    id: 'arcaneink',
    n: '秘法墨水',
    star: 3,
    sh: 's1',
    tags: ['trinket', 'tf'],
    tf: { tag: 'weapon', n: '秘法', add: ['staff'], m: { dmgPct: 10 } },
    ic: 'asc_s_rune'
  },
  {
    id: 'puppetstring',
    n: '傀儡絲線',
    star: 3,
    sh: 's1',
    tags: ['trinket', 'tf'],
    for: 'pet',
    tf: { tag: 'weapon', n: '傀儡', add: ['pet'], m: { spd: 10 } },
    ic: 'sk_possession'
  },
  {
    id: 'echostone',
    n: '迴音石',
    star: 4,
    sh: 's1',
    tags: ['trinket', 'tf'],
    tf: { tag: 'weapon', n: '迴響', m: { chain: 25 } },
    ic: 'sup_sp_echo'
  },
  /* 寵物質變（召喚物升級） */
  {
    id: 'venomgland',
    n: '毒腺',
    star: 2,
    sh: 's1',
    tags: ['trinket', 'tf'],
    for: 'pet',
    tf: { tag: 'pet', n: '毒牙', add: ['poison'], m: { poison: 1, dmg: 1 } },
    ic: 'sk_venomfang'
  },
  {
    id: 'necroessence',
    n: '死靈精華',
    star: 3,
    sh: 's1',
    tags: ['trinket', 'tf', 'dark'],
    for: 'pet',
    tf: { tag: 'pet', n: '亡靈', add: ['dark'], m: { weakCh: 15, ls: 15 } },
    ic: 'sup_ln_soul'
  },
  {
    id: 'stormfeather',
    n: '雷鳥羽',
    star: 3,
    sh: 's1',
    tags: ['trinket', 'tf'],
    for: 'pet',
    tf: { tag: 'pet', n: '雷獸', add: ['light'], m: { stunCh: 12, spd: 15 } },
    ic: 'asc_s_feather'
  },
  {
    id: 'holycollar',
    n: '聖光項圈',
    star: 3,
    sh: 's1',
    tags: ['trinket', 'tf', 'holy'],
    for: 'pet',
    tf: { tag: 'pet', n: '守護', add: ['holy'], m: { guard: 40 } },
    ic: 'gear_amulet_3'
  },
  {
    id: 'dragonblood',
    n: '龍血',
    star: 4,
    sh: 's1',
    tags: ['trinket', 'tf', 'fire'],
    for: 'pet',
    tf: { tag: 'pet', n: '龍裔', add: ['fire'], m: { burn: 2, dmgPct: 25 } },
    ic: 'sup_ln_hellfire'
  },
  {
    id: 'frenzywhistle',
    n: '狂暴哨',
    star: 4,
    sh: 's1',
    tags: ['trinket', 'tf'],
    for: 'pet',
    tf: { tag: 'pet', n: '狂暴', m: { chain: 25, spd: 10 } },
    ic: 'sup_ln_frenzy'
  },
  /* 盾、防具、藥水質變 */
  {
    id: 'spikestud',
    n: '尖刺鑲片',
    star: 2,
    sh: 's1',
    tags: ['trinket', 'tf'],
    for: 'shield',
    tf: { tag: 'shield', n: '尖刺', m: { bash: 60 } },
    ic: 'sup_sp_brutal'
  },
  {
    id: 'holyoil',
    n: '聖油',
    star: 3,
    sh: 's1',
    tags: ['trinket', 'tf', 'holy'],
    for: 'shield',
    tf: { tag: 'shield', n: '神聖', add: ['holy'], m: { heal: 3, blockPct: 10 } },
    ic: 'sk_sanct'
  },
  {
    id: 'thornvine',
    n: '荊棘藤',
    star: 2,
    sh: 's1',
    tags: ['trinket', 'tf'],
    tf: { tag: 'armor', n: '荊棘', m: { thornsF: 2 } },
    ic: 'sup_sp_wither'
  },
  {
    id: 'fuse',
    n: '導火線',
    star: 3,
    sh: 's1',
    tags: ['trinket', 'tf'],
    for: 'potion',
    tf: { tag: 'potion', n: '爆裂', m: { potBomb: 100, preBoost: 50 } },
    ic: 'sup_sp_boom'
  },
  /* ---------- 0.1.28 反制寵物 ---------- */
  {
    id: 'bugspray',
    n: '殺蟲劑',
    star: 2,
    sh: 's1',
    tags: ['potion'],
    pre: { petSeal: 6 },
    ic: 'sk_poisoncloud'
  },
  {
    id: 'bugnet',
    n: '捕蟲網',
    star: 3,
    sh: 'v2',
    tags: ['trinket'],
    pre: { petLock: 8 },
    ic: 'sk_trapshot'
  },
  {
    id: 'beastbell',
    n: '驅獸鈴',
    star: 2,
    sh: 's1',
    tags: ['trinket'],
    fx: { petDown: 15 },
    ic: 'sk_daunt'
  },
  {
    id: 'hunterbadge',
    n: '獵人徽章',
    star: 3,
    sh: 's1',
    tags: ['trinket'],
    fx: { petHunt: 8 },
    ic: 'sup_sp_foes'
  },
  /* ---------- 0.1.29 抗異常（反制燃燒、中毒、流血、凍結、暈眩、致盲、破甲、吸血回復、暴擊） ---------- */
  {
    id: 'fireproof',
    n: '防火衣',
    star: 2,
    sh: 'v2',
    tags: ['armor'],
    hp: 15,
    fx: { rBurn: 50 },
    ic: 'gear_chest_5'
  },
  {
    id: 'gasmask',
    n: '毒氣面具',
    star: 2,
    sh: 's1',
    tags: ['armor'],
    fx: { rPoison: 30, poisonImm: 5 },
    ic: 'gear_helm_7'
  },
  {
    id: 'tourniquet',
    n: '止血帶',
    star: 2,
    sh: 's1',
    tags: ['trinket'],
    fx: { rBleed: 50 },
    ic: 'gear_belt_3'
  },
  {
    id: 'handwarmer',
    n: '暖暖包',
    star: 2,
    sh: 's1',
    tags: ['trinket'],
    fx: { rFreeze: 50 },
    ic: 'ail_burn'
  },
  {
    id: 'sunglasses',
    n: '墨鏡',
    star: 2,
    sh: 's1',
    tags: ['trinket'],
    fx: { rBlind: 50, rWeak: 30 },
    ic: 'asc_s_eye'
  },
  {
    id: 'rivetvest',
    n: '鉚釘背心',
    star: 2,
    sh: 'v2',
    tags: ['armor'],
    arm: 2,
    fx: { rSunder: 50 },
    ic: 'gear_chest_8'
  },
  {
    id: 'lightningrod',
    n: '避雷針',
    star: 3,
    sh: 'v2',
    tags: ['trinket'],
    fx: { rStun: 50 },
    ic: 'sk_tesla'
  },
  {
    id: 'cleansebell',
    n: '淨化之鈴',
    star: 3,
    sh: 's1',
    tags: ['trinket', 'holy'],
    fx: { cleanse: 1 },
    ic: 'sk_clarity'
  },
  {
    id: 'cursedbandage',
    n: '詛咒繃帶',
    star: 3,
    sh: 's1',
    tags: ['trinket', 'dark'],
    fx: { healCut: 40 },
    ic: 'ail_curse'
  },
  {
    id: 'thickhide',
    n: '厚皮背心',
    star: 3,
    sh: 'v2',
    tags: ['armor'],
    hp: 30,
    fx: { critRes: 40 },
    ic: 'gear_chest_2'
  },
  /* ---------- 0.1.29 大件武器的融合（寵物 1 格好湊三階，這兩件讓佔越多格的武器越強） ---------- */
  {
    id: 'forgehammer',
    n: '鍛造之錘',
    star: 3,
    sh: 's1',
    tags: ['trinket', 'tf'],
    tf: { tag: 'weapon', n: '重鍛', m: { cellPct: 10 } },
    ic: 'asc_s_anvil'
  },
  {
    id: 'giantblood',
    n: '巨人之血',
    star: 4,
    sh: 's1',
    tags: ['trinket', 'tf'],
    tf: { tag: 'weapon', n: '巨化', m: { cellPct: 6, cellHp: 10 } },
    ic: 'sk_earthquake'
  },
  /* ================= 0.1.62 主題池的專屬道具（th：只在那個主題出現） ================= */
  /* ---------- 巨人國：又大又重、形狀特別；hole 是凹口裡那件道具吃到的加成 ---------- */
  {
    id: 'gtrunk',
    n: '巨木棒',
    star: 1,
    th: 'g',
    sh: 'big',
    tags: ['weapon', 'mace', 'twohand'],
    cd: 1.9,
    dmg: [5, 8],
    on: { stun: [15, 0.5] },
    ic: 'sk_staffstrike'
  },
  {
    id: 'gram',
    n: '攻城槌',
    star: 2,
    th: 'g',
    sh: 'c5',
    tags: ['weapon', 'mace', 'twohand'],
    cd: 2,
    dmg: [11, 16],
    on: { sunder: 2 },
    hole: { tag: 'weapon', dmgPct: 40, spd: 15 },
    ic: 'sk_bash'
  },
  {
    id: 'gaxe',
    n: '巨人戰斧',
    star: 3,
    th: 'g',
    sh: 't5',
    tags: ['weapon', 'axe', 'twohand'],
    cd: 2.2,
    dmg: [22, 31],
    on: { bleed: 2, sunder: 1 },
    ic: 'sk_execute'
  },
  {
    id: 'gbow',
    n: '巨人長弓',
    star: 3,
    th: 'g',
    sh: 'l5',
    tags: ['weapon', 'bow', 'twohand'],
    cd: 1.6,
    dmg: [12, 19],
    crit: 10,
    ic: 'gear_weapon_24'
  },
  {
    id: 'gpike',
    n: '泰坦長槍',
    star: 4,
    th: 'g',
    sh: 'v5',
    tags: ['weapon', 'spear', 'twohand'],
    cd: 1.7,
    dmg: [25, 36],
    crit: 10,
    on: { bleed: 2 },
    ic: 'sk_skypierce'
  },
  {
    id: 'gmount',
    n: '山嶽之鎚',
    star: 5,
    th: 'g',
    sh: 'x5',
    tags: ['weapon', 'mace', 'twohand'],
    cd: 2.4,
    dmg: [30, 42],
    on: { stun: [30, 1], sunder: 3 },
    ic: 'sk_bonecrush'
  },
  {
    id: 'gcrown',
    n: '巨人王冠',
    star: 3,
    th: 'g',
    sh: 'u5',
    tags: ['trinket'],
    hp: 60,
    hole: { tag: 'weapon', dmgPct: 90, spd: 20 },
    ic: 'sk_pride'
  },
  {
    id: 'gheart',
    n: '巨人之心',
    star: 3,
    th: 'g',
    sh: 'h7',
    tags: ['trinket'],
    hp: 100,
    hole: { tag: 'def', defPct: 60 },
    ic: 'gear_amulet_9'
  },
  {
    id: 'gbanner',
    n: '圍城旗',
    star: 4,
    th: 'g',
    sh: 'o8',
    tags: ['trinket'],
    hp: 80,
    hole: { tag: '*', allPct: 100 },
    all: [{ tag: 'weapon', spd: 10, dmgPct: 10 }],
    ic: 'sk_inspire'
  },
  {
    id: 'gwall',
    n: '城牆',
    star: 2,
    th: 'g',
    sh: 'h4',
    tags: ['shield'],
    cd: 2.6,
    block: 14,
    thorns: 3,
    ic: 'sup_ln_iron'
  },
  { id: 'gflask', n: '巨人藥瓶', star: 3, th: 'g', sh: 'sq', tags: ['potion'], pot: [40, 90, 1], ic: 'gear_belt_6' },
  { id: 'garmor', n: '巨人鎧', star: 4, th: 'g', sh: 'p5', tags: ['armor'], hp: 100, arm: 8, ic: 'gear_helm_6' },
  /* 0.1.100 巨人國×小人國的改造工具（mod）：拖到道具上生效，每件道具只能改造一次（o.md），跟融合分開算 */
  { id: 'gshrink', n: '縮小藥', star: 2, th: 'g', sh: 's1', tags: ['trinket'], mod: 'shrink', ic: 'asc_alchemist_e' },
  { id: 'ggrow', n: '巨大藥', star: 3, th: 'g', sh: 's1', tags: ['trinket'], mod: 'grow', ic: 'asc_alchemist_b5' },
  { id: 'gchisel', n: '鑿子', star: 2, th: 'g', sh: 's1', tags: ['trinket'], mod: 'chisel', ic: 'tree_n099' },
  /* ---------- 共生森林：看旁邊有幾件道具（perAdj 給這件、perAdjF 給角色，每有 1 件相鄰的道具算一次） ---------- */
  {
    id: 'fvine',
    n: '藤鞭',
    star: 1,
    th: 'f',
    sh: 's1',
    tags: ['weapon', 'poison'],
    cd: 1.2,
    dmg: [1, 2],
    on: { poison: 1 },
    perAdj: { spd: 6 },
    ic: 'sk_chainslash'
  },
  {
    id: 'fpollen',
    n: '花粉法杖',
    star: 2,
    th: 'f',
    sh: 'v2',
    tags: ['weapon', 'staff', 'holy'],
    cd: 1.5,
    dmg: [2, 4],
    on: { blind: 10 },
    perAdj: { dmgPct: 8 },
    ic: 'sk_staffspin'
  },
  {
    id: 'fthorn',
    n: '荊棘之矛',
    star: 3,
    th: 'f',
    sh: 'v3',
    tags: ['weapon', 'spear', 'poison'],
    cd: 1.5,
    dmg: [4, 7],
    on: { poison: 2 },
    perAdj: { poison: 1 },
    ic: 'sk_bonespear'
  },
  {
    id: 'fbow',
    n: '古樹長弓',
    star: 4,
    th: 'f',
    sh: 'v3',
    tags: ['weapon', 'bow'],
    cd: 1.4,
    dmg: [6, 9],
    crit: 5,
    perAdj: { dmgPct: 10 },
    ic: 'gear_weapon_25'
  },
  {
    id: 'fygg',
    n: '世界樹之杖',
    star: 5,
    th: 'f',
    sh: 'v3',
    tags: ['weapon', 'staff', 'cold'],
    cd: 1.6,
    dmg: [10, 14],
    on: { freeze: [20, 1] },
    perAdj: { dmgPct: 12 },
    adj: [{ tag: '*', spd: 8 }],
    ic: 'sk_sweepstaff'
  },
  {
    id: 'fshroom',
    n: '蘑菇精',
    star: 2,
    th: 'f',
    sh: 's1',
    tags: ['weapon', 'pet', 'poison'],
    cd: 1.4,
    dmg: [1, 3],
    on: { poison: 1 },
    perAdj: { poison: 1 },
    ic: 'sk_poisontrap'
  },
  {
    id: 'fent',
    n: '樹人',
    star: 3,
    th: 'f',
    sh: 'sq',
    tags: ['weapon', 'pet'],
    cd: 2,
    dmg: [6, 9],
    perAdjF: { hp: 20 },
    ic: 'unit_guardtotem'
  },
  { id: 'fmoss', n: '共生苔', star: 2, th: 'f', sh: 's1', tags: ['trinket'], perAdjF: { regen: 1 }, ic: 'gear_ring_8' },
  {
    id: 'fheart',
    n: '森林之心',
    star: 3,
    th: 'f',
    sh: 's1',
    tags: ['trinket'],
    adj: [{ tag: '*', spd: 10, dmgPct: 10 }],
    ic: 'gear_amulet_4'
  },
  {
    id: 'fthrone',
    n: '藤蔓王座',
    star: 4,
    th: 'f',
    sh: 'sq',
    tags: ['trinket'],
    adj: [{ tag: 'weapon', dmgPct: 20 }],
    perAdjF: { hp: 15 },
    ic: 'unit_crytotem'
  },
  {
    id: 'farmor',
    n: '荊棘鎧',
    star: 3,
    th: 'f',
    sh: 'v2',
    tags: ['armor'],
    hp: 40,
    perAdjF: { thornsF: 2 },
    ic: 'gear_chest_7'
  },
  {
    id: 'fpouch',
    n: '花粉囊',
    star: 2,
    th: 'f',
    sh: 's1',
    tags: ['potion'],
    pot: [50, 25, 2],
    perAdjF: { regen: 1 },
    ic: 'gear_amulet_5'
  },
  /* ---------- 機關城：觸發條件、互相帶動（nth：每第 N 次出手多打幾下；gear：齒輪；chainAdj：連鎖機關；wake：開戰幾秒後才啟動） ---------- */
  {
    id: 'mspring',
    n: '彈簧刀',
    star: 1,
    th: 'm',
    sh: 's1',
    tags: ['weapon', 'dagger'],
    cd: 1,
    dmg: [1, 3],
    nth: [3, 1],
    ic: 'gear_weapon_17'
  },
  {
    id: 'mclock',
    n: '發條弩',
    star: 2,
    th: 'm',
    sh: 'h2',
    tags: ['weapon', 'xbow'],
    cd: 1.2,
    dmg: [2, 4],
    nth: [4, 2],
    ic: 'sk_double'
  },
  {
    id: 'msteam',
    n: '蒸汽重鎚',
    star: 3,
    th: 'm',
    sh: 'sq',
    tags: ['weapon', 'mace'],
    cd: 2.6,
    dmg: [12, 18],
    on: { stun: [20, 0.6] },
    nth: [3, 1],
    ic: 'sk_reckless'
  },
  {
    id: 'mknives',
    n: '機關飛刀',
    star: 3,
    th: 'm',
    sh: 'h2',
    tags: ['weapon', 'dagger', 'light'],
    cd: 0.8,
    dmg: [2, 4],
    on: { stun: [8, 0.3] },
    nth: [5, 2],
    ic: 'sk_fanblade'
  },
  {
    id: 'mtesla',
    n: '雷電砲台',
    star: 4,
    th: 'm',
    sh: 'sq',
    tags: ['weapon', 'light'],
    cd: 0.7,
    dmg: [5, 8],
    on: { stun: [10, 0.3] },
    wake: 4,
    ic: 'unit_tesla'
  },
  {
    id: 'mcannon',
    n: '連發加農',
    star: 5,
    th: 'm',
    sh: 'sq',
    tags: ['weapon', 'xbow', 'fire'],
    cd: 1.6,
    dmg: [16, 24],
    on: { burn: 3 },
    nth: [3, 2],
    ic: 'sk_ballista'
  },
  /* 0.1.69 齒輪的充能照階數：Ⅰ 12%、Ⅱ 20%、Ⅲ 30%（之前固定 20%，升階沒有變強） */
  { id: 'mgear', n: '齒輪', star: 1, th: 'm', sh: 's1', tags: ['trinket'], gear: [12, 20, 30], ic: 'sup_sp_auto' },
  { id: 'mkey', n: '發條鑰匙', star: 2, th: 'm', sh: 's1', tags: ['trinket'], fx: { opener: 30 }, ic: 'sup_sp_cd' },
  {
    id: 'mtrapbox',
    n: '陷阱工具箱',
    star: 2,
    th: 'm',
    sh: 'sq',
    tags: ['trinket'],
    traps: [{ k: 'snare', n: 1, sz: 1 }],
    ic: 'sup_sp_trap'
  },
  { id: 'mchain', n: '連鎖機關', star: 3, th: 'm', sh: 'h2', tags: ['trinket'], chainAdj: 1, ic: 'sup_sp_chain' },
  {
    id: 'mheart',
    n: '機械心臟',
    star: 5,
    th: 'm',
    sh: 'sq',
    tags: ['trinket'],
    fx: { ramp: 8 },
    gear: 15,
    ic: 'sup_sp_combo'
  },
  {
    id: 'marmor',
    n: '鋼鐵護甲',
    star: 3,
    th: 'm',
    sh: 'sq',
    tags: ['armor'],
    hp: 50,
    arm: 5,
    fx: { thornsF: 3 },
    ic: 'gear_boots_7'
  },
  {
    id: 'mshield',
    n: '機關盾',
    star: 4,
    th: 'm',
    sh: 'sq',
    tags: ['shield'],
    cd: 2.2,
    block: 18,
    thorns: 4,
    ic: 'sk_determination'
  },
  /* ---------- 0.1.62 主題的武器線（tools/pools.js 算出每個主題缺的職業武器 × 星級，一件補一個類別＋一個元素）：
     巨人國又大又重、每佔 1 格傷害 +4%（C 形、U 形有凹口）；共生森林每有 1 件相鄰的道具變強；機關城每第 N 次出手多打、盾格擋時反擊 ---------- */
  {
    id: 'g1icesword',
    n: '寒霜巨劍',
    star: 1,
    th: 'g',
    sh: 'big',
    tags: ['weapon', 'sword', 'cold', 'twohand'],
    cd: 1.5,
    dmg: [3, 5],
    on: { freeze: [15, 0.8] },
    crit: 7,
    self: { cellPct: 4 },
    ic: 'gear_weapon_16'
  },
  {
    id: 'g1holybow',
    n: '聖光巨弓',
    star: 1,
    th: 'g',
    sh: 'v3',
    tags: ['weapon', 'bow', 'holy'],
    cd: 1.6,
    dmg: [4, 5],
    on: { blind: 10 },
    self: { cellPct: 4 },
    ic: 'gear_weapon_3'
  },
  {
    id: 'g1thunderspear',
    n: '雷鳴巨槍',
    star: 1,
    th: 'g',
    sh: 'v3',
    tags: ['weapon', 'spear', 'light'],
    cd: 1.7,
    dmg: [4, 6],
    on: { stun: [10, 0.4] },
    self: { cellPct: 4 },
    ic: 'asc_storm_b3'
  },
  {
    id: 'g2firebow',
    n: '烈焰巨弓',
    star: 2,
    th: 'g',
    sh: 'v4',
    tags: ['weapon', 'bow', 'fire', 'twohand'],
    cd: 1.6,
    dmg: [5, 8],
    on: { burn: 2 },
    self: { cellPct: 4 },
    ic: 'sk_firearrow'
  },
  {
    id: 'g2holyaxe',
    n: '聖光巨斧',
    star: 2,
    th: 'g',
    sh: 'c5',
    tags: ['weapon', 'axe', 'holy', 'twohand'],
    cd: 2.2,
    dmg: [8, 11],
    on: { blind: 12 },
    hole: { tag: 'weapon', dmgPct: 30, spd: 16 },
    self: { cellPct: 4 },
    ic: 'sk_titanfall'
  },
  {
    id: 'g2thundermace',
    n: '雷鳴巨鎚',
    star: 2,
    th: 'g',
    sh: 'c5',
    tags: ['weapon', 'mace', 'light', 'twohand'],
    cd: 2.2,
    dmg: [8, 11],
    on: { stun: [12, 0.4] },
    hole: { tag: 'weapon', dmgPct: 30, spd: 16 },
    self: { cellPct: 4 },
    ic: 'gear_weapon_23'
  },
  {
    id: 'g3icedagger',
    n: '寒霜大砍刀',
    star: 3,
    th: 'g',
    sh: 'l3',
    tags: ['weapon', 'dagger', 'cold'],
    cd: 1,
    dmg: [5, 7],
    on: { freeze: [30, 1] },
    crit: 11,
    self: { cellPct: 4 },
    ic: 'sk_iceshatter'
  },
  {
    id: 'g3venomstaff',
    n: '劇毒石杖',
    star: 3,
    th: 'g',
    sh: 't5',
    tags: ['weapon', 'staff', 'poison', 'twohand'],
    cd: 1.8,
    dmg: [9, 13],
    on: { poison: 2 },
    self: { cellPct: 4 },
    ic: 'sk_blight'
  },
  {
    id: 'g3fireaxe',
    n: '烈焰巨斧',
    star: 3,
    th: 'g',
    sh: 't5',
    tags: ['weapon', 'axe', 'fire', 'twohand'],
    cd: 2.2,
    dmg: [11, 16],
    on: { burn: 2, stun: [24, 0.5] },
    self: { cellPct: 4 },
    ic: 'gear_weapon_8'
  },
  {
    id: 'g3holymace',
    n: '聖光巨鎚',
    star: 3,
    th: 'g',
    sh: 't5',
    tags: ['weapon', 'mace', 'holy', 'twohand'],
    cd: 2.2,
    dmg: [11, 16],
    on: { blind: 15, stun: [24, 0.5] },
    self: { cellPct: 4 },
    ic: 'sk_titanfall'
  },
  {
    id: 'g4shadowstaff',
    n: '暗影石杖',
    star: 4,
    th: 'g',
    sh: 't5',
    tags: ['weapon', 'staff', 'dark', 'twohand'],
    cd: 1.8,
    dmg: [13, 20],
    on: { ls: 15, weak: 18 },
    self: { cellPct: 4 },
    ic: 'gear_weapon_4'
  },
  {
    id: 'g4venommace',
    n: '劇毒巨鎚',
    star: 4,
    th: 'g',
    sh: 'p5',
    tags: ['weapon', 'mace', 'poison', 'twohand'],
    cd: 2.2,
    dmg: [16, 25],
    on: { poison: 3, stun: [27, 0.5] },
    self: { cellPct: 4 },
    ic: 'gear_weapon_8'
  },
  {
    id: 'g5shadowsword',
    n: '暗影巨劍',
    star: 5,
    th: 'g',
    sh: 'l5',
    tags: ['weapon', 'sword', 'dark', 'twohand'],
    cd: 1.5,
    dmg: [17, 26],
    on: { ls: 18, weak: 20 },
    crit: 15,
    self: { cellPct: 4 },
    ic: 'gear_weapon_0'
  },
  {
    id: 'g5venomdagger',
    n: '劇毒大砍刀',
    star: 5,
    th: 'g',
    sh: 'sq',
    tags: ['weapon', 'dagger', 'poison', 'twohand'],
    cd: 1,
    dmg: [11, 17],
    on: { poison: 4 },
    crit: 15,
    self: { cellPct: 4 },
    ic: 'gear_weapon_28'
  },
  {
    id: 'g5thunderpet',
    n: '雷鳴石像',
    star: 5,
    th: 'g',
    sh: 'p5',
    tags: ['weapon', 'pet', 'light'],
    cd: 1.6,
    dmg: [18, 27],
    on: { stun: [22, 0.6] },
    self: { cellPct: 4 },
    ic: 'a:m_thunderbat'
  },
  {
    id: 'g5bow',
    n: '泰坦巨弓',
    star: 5,
    th: 'g',
    sh: 'l5',
    tags: ['weapon', 'bow', 'twohand'],
    cd: 1.6,
    dmg: [18, 27],
    on: { sunder: 3 },
    self: { cellPct: 4 },
    ic: 'gear_weapon_3'
  },
  {
    id: 'g5spear',
    n: '山丘巨槍',
    star: 5,
    th: 'g',
    sh: 'v5',
    tags: ['weapon', 'spear', 'twohand'],
    cd: 1.7,
    dmg: [19, 29],
    on: { sunder: 3 },
    self: { cellPct: 4 },
    ic: 'gear_weapon_9'
  },
  {
    id: 'f1icedagger',
    n: '寒霜荊刺',
    star: 1,
    th: 'f',
    sh: 's1',
    tags: ['weapon', 'dagger', 'cold'],
    cd: 0.9,
    dmg: [1, 2],
    on: { freeze: [15, 0.8] },
    crit: 7,
    perAdj: { dmgPct: 8 },
    ic: 'sk_iceshatter'
  },
  {
    id: 'f1shield',
    n: '翠綠樹皮盾',
    star: 1,
    th: 'f',
    sh: 'sq',
    tags: ['shield'],
    cd: 3,
    block: 6,
    perAdj: { blockPct: 10 },
    ic: 'gear_offhand_2'
  },
  {
    id: 'f1shadowspear',
    n: '暗影荊矛',
    star: 1,
    th: 'f',
    sh: 'v3',
    tags: ['weapon', 'spear', 'dark'],
    cd: 1.5,
    dmg: [2, 3],
    on: { ls: 8, weak: 10 },
    perAdj: { ls: 3 },
    ic: 'gear_weapon_9'
  },
  {
    id: 'f1firestaff',
    n: '烈焰花杖',
    star: 1,
    th: 'f',
    sh: 'v2',
    tags: ['weapon', 'staff', 'fire'],
    cd: 1.6,
    dmg: [2, 4],
    on: { burn: 1 },
    perAdj: { burn: 1 },
    ic: 'sk_fire'
  },
  {
    id: 'f2icesword',
    n: '寒霜藤劍',
    star: 2,
    th: 'f',
    sh: 'v2',
    tags: ['weapon', 'sword', 'cold'],
    cd: 1.3,
    dmg: [3, 4],
    on: { freeze: [25, 1] },
    crit: 9,
    perAdj: { dmgPct: 8 },
    ic: 'gear_weapon_16'
  },
  {
    id: 'f2shadowdagger',
    n: '暗影荊刺',
    star: 2,
    th: 'f',
    sh: 's1',
    tags: ['weapon', 'dagger', 'dark'],
    cd: 0.9,
    dmg: [2, 3],
    on: { ls: 10, weak: 12 },
    crit: 9,
    perAdj: { ls: 3 },
    ic: 'sk_malice'
  },
  {
    id: 'f2shield',
    n: '古木樹皮盾',
    star: 2,
    th: 'f',
    sh: 'sq',
    tags: ['shield'],
    cd: 3,
    block: 10,
    perAdj: { blockPct: 12 },
    ic: 'gear_offhand_2'
  },
  {
    id: 'f2firestaff',
    n: '赤花法杖',
    star: 2,
    th: 'f',
    sh: 'v3',
    tags: ['weapon', 'staff', 'fire'],
    cd: 1.6,
    dmg: [4, 6],
    on: { burn: 2 },
    perAdj: { burn: 1 },
    ic: 'sk_fire'
  },
  {
    id: 'f3firesword',
    n: '烈焰藤劍',
    star: 3,
    th: 'f',
    sh: 'v3',
    tags: ['weapon', 'sword', 'fire'],
    cd: 1.3,
    dmg: [4, 7],
    on: { burn: 2 },
    crit: 11,
    perAdj: { burn: 1 },
    ic: 'gear_weapon_16'
  },
  {
    id: 'f4shadowdagger',
    n: '夜影荊刺',
    star: 4,
    th: 'f',
    sh: 's1',
    tags: ['weapon', 'dagger', 'dark'],
    cd: 0.9,
    dmg: [4, 8],
    on: { ls: 15, weak: 18 },
    crit: 13,
    perAdj: { ls: 3 },
    ic: 'sk_malice'
  },
  {
    id: 'f4firestaff',
    n: '焰心花杖',
    star: 4,
    th: 'f',
    sh: 'v3',
    tags: ['weapon', 'staff', 'fire'],
    cd: 1.6,
    dmg: [9, 13],
    on: { burn: 3 },
    perAdj: { burn: 1 },
    ic: 'sk_fire'
  },
  {
    id: 'f4shield',
    n: '苔石樹皮盾',
    star: 4,
    th: 'f',
    sh: 'sq',
    tags: ['shield'],
    cd: 2.5,
    block: 18,
    perAdj: { blockPct: 16 },
    ic: 'gear_offhand_2'
  },
  {
    id: 'f5venomsword',
    n: '劇毒藤劍',
    star: 5,
    th: 'f',
    sh: 'v3',
    tags: ['weapon', 'sword', 'poison'],
    cd: 1.3,
    dmg: [11, 17],
    on: { poison: 4 },
    crit: 15,
    perAdj: { poison: 1 },
    ic: 'gear_weapon_16'
  },
  {
    id: 'f5mace',
    n: '苔石樹鎚',
    star: 5,
    th: 'f',
    sh: 'sq',
    tags: ['weapon', 'mace'],
    cd: 1.9,
    dmg: [18, 26],
    perAdj: { dmgPct: 16 },
    ic: 'gear_weapon_8'
  },
  {
    id: 'f5shield',
    n: '花樹皮盾',
    star: 5,
    th: 'f',
    sh: 'sq',
    tags: ['shield'],
    cd: 2.2,
    block: 28,
    perAdj: { blockPct: 18 },
    ic: 'gear_offhand_2'
  },
  {
    id: 'm1venomsword',
    n: '劇毒機關劍',
    star: 1,
    th: 'm',
    sh: 'v2',
    tags: ['weapon', 'sword', 'poison'],
    cd: 1.2,
    dmg: [2, 3],
    on: { poison: 1 },
    crit: 7,
    nth: [3, 1],
    ic: 'gear_weapon_16'
  },
  {
    id: 'm1firepet',
    n: '烈焰機械犬',
    star: 1,
    th: 'm',
    sh: 's1',
    tags: ['weapon', 'pet', 'fire'],
    cd: 1.3,
    dmg: [2, 3],
    on: { burn: 1 },
    nth: [3, 1],
    ic: 'a:z_dragon'
  },
  {
    id: 'm1holyaxe',
    n: '聖光鏈鋸斧',
    star: 1,
    th: 'm',
    sh: 'v2',
    tags: ['weapon', 'axe', 'holy'],
    cd: 1.7,
    dmg: [3, 4],
    on: { blind: 10 },
    nth: [3, 1],
    ic: 'sk_titanfall'
  },
  {
    id: 'm1shield',
    n: '蒸汽齒輪盾',
    star: 1,
    th: 'm',
    sh: 'sq',
    tags: ['shield'],
    cd: 3,
    block: 6,
    self: { bash: 40 },
    ic: 'gear_offhand_2'
  },
  {
    id: 'm1thunderdagger',
    n: '雷鳴彈刃',
    star: 1,
    th: 'm',
    sh: 's1',
    tags: ['weapon', 'dagger', 'light'],
    cd: 0.8,
    dmg: [1, 2],
    on: { stun: [10, 0.4] },
    crit: 7,
    nth: [3, 1],
    ic: 'sk_arc'
  },
  {
    id: 'm2icepet',
    n: '寒霜機械犬',
    star: 2,
    th: 'm',
    sh: 's1',
    tags: ['weapon', 'pet', 'cold'],
    cd: 1.3,
    dmg: [3, 4],
    on: { freeze: [25, 1] },
    nth: [4, 2],
    ic: 'a:m_thunderbat'
  },
  {
    id: 'm2venomaxe',
    n: '劇毒鏈鋸斧',
    star: 2,
    th: 'm',
    sh: 'l3',
    tags: ['weapon', 'axe', 'poison'],
    cd: 1.7,
    dmg: [4, 7],
    on: { poison: 1 },
    nth: [4, 2],
    ic: 'gear_weapon_8'
  },
  {
    id: 'm2holyspear',
    n: '聖光鑽槍',
    star: 2,
    th: 'm',
    sh: 'v3',
    tags: ['weapon', 'spear', 'holy'],
    cd: 1.4,
    dmg: [3, 6],
    on: { blind: 12 },
    nth: [4, 2],
    ic: 'gear_weapon_9'
  },
  {
    id: 'm3icesword',
    n: '寒霜機關劍',
    star: 3,
    th: 'm',
    sh: 'v3',
    tags: ['weapon', 'sword', 'cold'],
    cd: 1.2,
    dmg: [4, 7],
    on: { freeze: [30, 1] },
    crit: 11,
    nth: [3, 1],
    ic: 'gear_weapon_16'
  },
  {
    id: 'm3pet',
    n: '齒輪機械犬',
    star: 3,
    th: 'm',
    sh: 'h2',
    tags: ['weapon', 'pet'],
    cd: 1.3,
    dmg: [4, 8],
    nth: [3, 1],
    ic: 'a:m_thunderbat'
  },
  {
    id: 'm3shield',
    n: '精工齒輪盾',
    star: 3,
    th: 'm',
    sh: 'sq',
    tags: ['shield'],
    cd: 2.6,
    block: 15,
    self: { bash: 60 },
    ic: 'gear_offhand_2'
  },
  {
    id: 'm3holydagger',
    n: '聖光彈刃',
    star: 3,
    th: 'm',
    sh: 's1',
    tags: ['weapon', 'dagger', 'holy'],
    cd: 0.8,
    dmg: [3, 4],
    on: { blind: 15 },
    crit: 11,
    nth: [3, 1],
    ic: 'gear_weapon_13'
  },
  {
    id: 'm4venomdagger',
    n: '劇毒彈刃',
    star: 4,
    th: 'm',
    sh: 's1',
    tags: ['weapon', 'dagger', 'poison'],
    cd: 0.8,
    dmg: [4, 7],
    on: { poison: 3 },
    crit: 13,
    nth: [4, 2],
    ic: 'gear_weapon_28'
  },
  {
    id: 'm4pet',
    n: '蒸汽機械犬',
    star: 4,
    th: 'm',
    sh: 'h2',
    tags: ['weapon', 'pet'],
    cd: 1.3,
    dmg: [8, 12],
    nth: [4, 2],
    ic: 'a:m_thunderbat'
  },
  {
    id: 'm4holyaxe',
    n: '聖光齒輪斧',
    star: 4,
    th: 'm',
    sh: 'sq',
    tags: ['weapon', 'axe', 'holy'],
    cd: 1.7,
    dmg: [9, 13],
    on: { blind: 18 },
    nth: [4, 2],
    ic: 'sk_titanfall'
  },
  {
    id: 'm4spear',
    n: '精工鑽槍',
    star: 4,
    th: 'm',
    sh: 'v3',
    tags: ['weapon', 'spear'],
    cd: 1.4,
    dmg: [9, 12],
    nth: [4, 2],
    ic: 'gear_weapon_9'
  },
  {
    id: 'm5icedagger',
    n: '寒霜彈刃',
    star: 5,
    th: 'm',
    sh: 'h2',
    tags: ['weapon', 'dagger', 'cold'],
    cd: 0.8,
    dmg: [7, 10],
    on: { freeze: [40, 1.2] },
    crit: 15,
    nth: [3, 2],
    ic: 'sk_iceshatter'
  },
  {
    id: 'm5shield',
    n: '發條齒輪盾',
    star: 5,
    th: 'm',
    sh: 'sq',
    tags: ['shield'],
    cd: 2.2,
    block: 28,
    self: { bash: 80 },
    ic: 'gear_offhand_2'
  },
  {
    id: 'm5spear',
    n: '蒸汽鑽槍',
    star: 5,
    th: 'm',
    sh: 'v3',
    tags: ['weapon', 'spear'],
    cd: 1.4,
    dmg: [12, 20],
    nth: [3, 2],
    ic: 'gear_weapon_9'
  }
];
/* ================= 0.1.69 棋盤王國（c）、黃道十二宮（z） ================= */
/* 棋子（pc）：1 格的飾品，照西洋棋的走法影響別的道具；ray 是方向（每個方向只影響碰到的第一件），jump 是跳到的格子（不會被擋）。
   被棋子影響的道具拿到 m（照棋子的階數變強）；棋盤王國的武器（pcHit）每被 1 個棋子影響再加成 */
const PC_DIR = {
  pawn: { ray: [[0, -1]] },
  knight: {
    jump: [
      [1, 2],
      [2, 1],
      [2, -1],
      [1, -2],
      [-1, -2],
      [-2, -1],
      [-2, 1],
      [-1, 2]
    ]
  },
  bishop: {
    ray: [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1]
    ]
  },
  rook: {
    ray: [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ]
  },
  queen: {
    ray: [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1]
    ]
  },
  king: {
    jump: [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1]
    ]
  }
};
/* 棋子的走法說明（說明文字、百科用） */
const PC_TXT = {
  pawn: '正上方碰到的第一件道具',
  knight: '日字形跳到的 8 格上的道具（不會被擋）',
  bishop: '4 條斜線上各自碰到的第一件道具',
  rook: '上下左右各自碰到的第一件道具',
  queen: '8 個方向各自碰到的第一件道具',
  king: '周圍 8 格的道具'
};
/* 星座（zod，0.1.96 改成星河）：同一排或同一行最近的兩個星座之間是一條河，夾在中間的道具拿到兩端星座的效果（data.js 的 ZODS） */
const THEME_ITEMS = [
  {
    id: 'cpawn',
    n: '兵',
    star: 1,
    th: 'c',
    sh: 's1',
    tags: ['trinket'],
    pc: { k: 'pawn', m: { dmgPct: 25 } },
    ic: 'asc_s_fist'
  },
  {
    id: 'cknight',
    n: '騎士',
    star: 2,
    th: 'c',
    sh: 's1',
    tags: ['trinket'],
    pc: { k: 'knight', m: { dmgPct: 12 } },
    ic: 'horseface'
  },
  {
    id: 'cbishop',
    n: '主教',
    star: 3,
    th: 'c',
    sh: 's1',
    tags: ['trinket'],
    pc: { k: 'bishop', m: { spd: 15, crit: 8 } },
    ic: 'asc_s_book'
  },
  {
    id: 'crook',
    n: '城堡',
    star: 3,
    th: 'c',
    sh: 's1',
    tags: ['trinket'],
    pc: { k: 'rook', m: { dmgPct: 20 } },
    ic: 'sk_phalanx'
  },
  {
    id: 'cking',
    n: '國王',
    star: 4,
    th: 'c',
    sh: 's1',
    tags: ['trinket'],
    pc: { k: 'king', m: { dmgPct: 12, spd: 8 } },
    fx: { hp: 40 },
    ic: 'it_kingcrown'
  },
  {
    id: 'cqueen',
    n: '皇后',
    star: 5,
    th: 'c',
    sh: 's1',
    tags: ['trinket'],
    pc: { k: 'queen', m: { dmgPct: 18, spd: 10 } },
    ic: 'it_gcrown'
  },
  ...[
    ['zaries', '牡羊座', 3, 'aries', 'it_gram'],
    ['ztaurus', '金牛座', 2, 'taurus', 'z_ox'],
    ['zgemini', '雙子座', 3, 'gemini', 'tree_n115'],
    ['zcancer', '巨蟹座', 3, 'cancer', 'm_coconutcrab'],
    ['zleo', '獅子座', 3, 'leo', 'lion'],
    ['zvirgo', '處女座', 2, 'virgo', 'asc_s_feather'],
    ['zlibra', '天秤座', 2, 'libra', 'asc_s_anvil'],
    ['zscorpio', '天蠍座', 3, 'scorpio', 'asc_s_drop'],
    ['zsagitt', '射手座', 2, 'sagitt', 'it_c_archer_0'],
    ['zcapri', '摩羯座', 2, 'capri', 'z_goat'],
    ['zaquar', '水瓶座', 2, 'aquar', 'asc_s_eye'],
    ['zpisces', '雙魚座', 3, 'pisces', 'm_flyfish']
  ].map(([id, n, star, zod, ic]) => ({
    id,
    n,
    star,
    th: 'z',
    sh: 's1',
    tags: ['trinket'],
    zod,
    fx: { hp: 10 * star },
    ic
  }))
];
/* 主題的職業武器線：8 類（弓、劍、矛、斧、匕首、法杖、寵物、盾）× 1～5★，數值照舊武器同星同類的水準。
   兩個新主題每個星級 6 把帶一個元素（元素每星級各一次）：棋盤王國的武器每被一個棋子影響變強（pcHit），黃道的武器每在一條星河裡變強（synPer，0.1.96）；
   0.1.69 舊的三個主題補缺的、補到每個星級 8 把，帶各自的機制 */
function genThemeW() {
  const C = {
      bow: {
        t: ['bow'],
        n: '弓',
        sh: ['v3', 'v3', 'v3', 'v3', 'v3'],
        cd: [1.6, 1.6, 1.5, 1.5, 1.4],
        d: [
          [3, 5],
          [4, 7],
          [5, 8],
          [7, 11],
          [11, 16]
        ]
      },
      sword: {
        t: ['sword'],
        n: '劍',
        sh: ['v2', 'v2', 'v3', 'v3', 'v3'],
        cd: [1.3, 1.3, 1.4, 1.4, 1.4],
        d: [
          [2, 4],
          [4, 6],
          [6, 9],
          [9, 14],
          [14, 20]
        ]
      },
      spear: {
        t: ['spear'],
        n: '長槍',
        sh: ['v3', 'v3', 'v3', 'v3', 'v3'],
        cd: [1.6, 1.5, 1.5, 1.5, 1.5],
        d: [
          [2, 4],
          [3, 6],
          [5, 8],
          [7, 11],
          [13, 19]
        ]
      },
      axe: {
        t: ['axe'],
        n: '戰斧',
        sh: ['v2', 'l3', 'sq', 'l3', 'sq'],
        cd: [1.8, 2, 2.1, 1.9, 2.2],
        d: [
          [3, 5],
          [5, 8],
          [8, 12],
          [11, 16],
          [20, 28]
        ]
      },
      dagger: {
        t: ['dagger'],
        n: '匕首',
        sh: ['s1', 's1', 's1', 's1', 's1'],
        cd: [1, 0.9, 0.9, 0.8, 0.7],
        d: [
          [1, 3],
          [1, 3],
          [2, 4],
          [3, 6],
          [5, 8]
        ]
      },
      staff: {
        t: ['staff'],
        n: '法杖',
        sh: ['v2', 'v3', 'v3', 'v3', 'v3'],
        cd: [1.6, 1.7, 1.6, 1.7, 1.7],
        d: [
          [1, 3],
          [3, 5],
          [4, 7],
          [7, 11],
          [10, 15]
        ]
      },
      pet: {
        t: ['pet'],
        n: '',
        sh: ['s1', 's1', 's1', 'h2', 'sq'],
        cd: [1.3, 1.4, 1.3, 1.2, 1.3],
        d: [
          [1, 2],
          [1, 3],
          [3, 5],
          [5, 8],
          [9, 13]
        ]
      },
      shield: {
        t: ['shield'],
        n: '盾',
        sh: ['sq', 'sq', 'sq', 'sq', 'sq'],
        cd: [3, 3, 2.8, 2.5, 2.2],
        b: [6, 10, 14, 18, 28]
      }
    },
    E = ['fire', 'cold', 'light', 'poison', 'holy', 'dark'],
    EN = { fire: '烈焰', cold: '寒霜', light: '雷霆', poison: '劇毒', holy: '聖光', dark: '暗影' },
    ON = {
      fire: st => ({ burn: st }),
      cold: st => ({ freeze: [4 + 2 * st, 0.8] }),
      light: st => ({ stun: [6 + 2 * st, 0.4] }),
      poison: st => ({ poison: st }),
      holy: st => ({ blind: 8 + 2 * st }),
      dark: st => ({ ls: 2 + st })
    },
    /* 寵物的名字（照主題、星級） */
    PET = {
      c: ['棋盤小馬', '象牙戰馬', '黑檀獵鷹', '王庭獅鷲', '棋聖巨龍'],
      z: ['星砂小羊', '星辰靈貓', '星座天鵝', '星宮天馬', '黃道神龍'],
      g: ['石像小獸', '岩甲蜥', '山丘巨熊', '泰坦石像', '巨神魔像'],
      f: ['苔蘚小兔', '藤蔓狐', '古木鹿', '森靈貓頭鷹', '世界樹守衛'],
      m: ['發條小鼠', '齒輪鳥', '蒸汽蜘蛛', '精工機械豹', '機神龍']
    },
    /* 每個主題：名字的星級字、主題機制（x：這件的額外欄位）、形狀（sh：沒寫照 C） */
    TH = {
      c: {
        w: ['木棋', '象牙', '黑檀', '王庭', '棋聖'],
        x: (k, st) => ({ pcHit: k === 'shield' ? { blockPct: 8 + 2 * st } : { dmgPct: 8 + 2 * st } })
      },
      z: {
        w: ['星砂', '星辰', '星座', '星宮', '黃道'],
        x: (k, st) => ({ synPer: k === 'shield' ? { blockPct: 14 + 3 * st } : { dmgPct: 6 + 2 * st } })
      },
      /* 0.1.69 舊的三個主題也只賣主題專屬武器：缺的星級、類別用這個補（巨人國大形狀＋每格傷害、森林每件相鄰、機關城每第 N 次多打） */
      g: {
        w: ['粗石', '巨岩', '山嶽', '泰坦', '巨神'],
        x: (k, st) => ({ self: k === 'shield' ? { blockPct: 10 + 3 * st } : { cellPct: 4 } }),
        sh: {
          bow: ['v3', 'v4', 'v4', 'l5', 'l5'],
          sword: ['v3', 'big', 'l4', 'l5', 'l5'],
          spear: ['v3', 'v4', 'v4', 'v5', 'v5'],
          axe: ['l3', 'sq', 't5', 't5', 'p5'],
          dagger: ['h2', 'l3', 'l3', 'sq', 'sq'],
          staff: ['v3', 'v4', 't5', 't5', 't5'],
          pet: ['h2', 'sq', 'sq', 'p5', 'p5'],
          shield: ['sq', 'h4', 'sq', 'h4', 'big']
        }
      },
      f: {
        w: ['嫩枝', '藤蔓', '古木', '森靈', '世界樹'],
        x: (k, st) => ({ perAdj: k === 'shield' ? { blockPct: 6 + 2 * st } : { dmgPct: 3 + st } })
      },
      m: {
        w: ['齒輪', '發條', '蒸汽', '精工', '機神'],
        x: (k, st) => (k === 'shield' ? { self: { spd: 10 + 3 * st } } : { nth: st % 2 ? [3, 1] : [4, 2] })
      }
    },
    ks = Object.keys(C),
    GR = {
      bow: ['bow', 'xbow'],
      sword: ['sword'],
      spear: ['spear'],
      axe: ['axe', 'mace'],
      dagger: ['dagger'],
      staff: ['staff'],
      pet: ['pet'],
      shield: ['shield']
    },
    /* 圖示：借同類同元素的舊武器（沒有就借同類的） */
    icOf = (tags, el) => {
      const ok = it => !it.th && it.ic && tags.every(t => it.tags.includes(t));
      const a = ITEMS.find(it => ok(it) && (!el || it.tags.includes(el))) || ITEMS.find(ok);
      return a ? a.ic : 'gear_weapon_0';
    },
    mk = (th, st, k, el) => {
      const c = C[k],
        s = st - 1,
        sh = (TH[th].sh || {})[k] ? TH[th].sh[k][s] : c.sh[s],
        it = {
          id: `${th}${st}${el || 'x'}${k}`,
          n: k === 'pet' ? (el ? EN[el] : '') + PET[th][s] : (el ? EN[el] : '') + TH[th].w[s] + c.n,
          star: st,
          th,
          sh,
          tags: [
            ...(k === 'shield' ? [] : ['weapon']),
            ...c.t,
            ...(el ? [el] : []),
            ...(SH[sh].length >= 4 && k !== 'shield' && k !== 'pet' ? ['twohand'] : [])
          ],
          cd: c.cd[s],
          ic: icOf(c.t, el)
        };
      if (c.b) it.block = c.b[s];
      else {
        it.dmg = c.d[s];
        if (el) it.on = ON[el](st);
        if (k === 'dagger') it.crit = 10;
      }
      return Object.assign(it, TH[th].x(k, st));
    },
    out = [];
  for (const th of ['c', 'z'])
    for (let st = 1; st <= 5; st++)
      ks.forEach((k, i) => {
        const j = (i + st + (th === 'z' ? 3 : 0)) % ks.length;
        out.push(mk(th, st, k, j < E.length ? E[j] : null));
      });
  /* 舊的三個主題：先補缺的（每個星級每類職業、每個元素都要有），再補到每個星級 8 把（跟新主題一樣多） */
  for (const th of ['g', 'f', 'm'])
    for (let st = 1; st <= 5; st++) {
      const have = () => [...ITEMS, ...out].filter(it => it.th === th && it.star === st && (it.dmg || it.block)),
        has = tags => have().some(it => tags.some(t => it.tags.includes(t))),
        put = (k, el) => {
          const it = mk(th, st, k, el);
          if (![...ITEMS, ...out].some(o => o.id === it.id)) out.push(it);
        },
        mc = ks.filter(k => !has(GR[k])),
        me = E.filter(e => !has([e]));
      let r = st;
      while (mc.length || me.length) {
        const k = mc.shift() || ks.filter(x => x !== 'shield')[r++ % (ks.length - 1)];
        put(k, me.shift() || null);
      }
      for (let g = 0; have().length < 8 && g < 30; g++) {
        const cnt = k => have().filter(it => GR[k].some(t => it.tags.includes(t))).length,
          k = [...ks].sort((a, b) => cnt(a) - cnt(b) || ks.indexOf(a) - ks.indexOf(b))[0];
        put(k, E[(st + g) % E.length]);
      }
    }
  return out;
}
/* 0.1.103 料理（docs/料理.md）：7 種食材（商店每格 20% 機率出現），拖到另一個食材上合成：
   不同的＝混合料理（兩個特性 ×1.25）、相同的＝半成品（×1.25，帶招牌效果）；兩個不同的半成品＝2 格大料理（數值相加、兩個招牌都發動）。
   食物只加角色本身（開戰時吃下），不升階、不吃也不給相鄰加成；同一道只算一份 */
const FOOD_HPOF = { ing: 8, mix: 20, semi: 20, big: 40 };
const FOOD_K = ['meat', 'bread', 'fish', 'honey', 'mint', 'coffee', 'lemon'];
/* 一份的數值：hpP 生命 %、dr 受到的命中傷害 -%、dodge 閃避、regP 每秒回復生命上限 %、rDot 抗持續傷害 %、rCtl 抗限制行動 %、cln 淨化次數 */
const FOOD_V = {
  meat: { hpP: 8 },
  bread: { dr: 5 },
  fish: { dodge: 4 },
  honey: { regP: 0.5 },
  mint: { rDot: 12 },
  coffee: { rCtl: 12 },
  lemon: { cln: 1 }
};
const FOOD_N = { meat: '肉', bread: '麵包', fish: '魚', honey: '蜂蜜', mint: '薄荷', coffee: '咖啡', lemon: '檸檬' },
  FOOD_MIX = {
    meat_bread: '漢堡',
    meat_fish: '海陸燒烤',
    meat_honey: '蜜汁烤肉',
    meat_mint: '薄荷羊排',
    meat_coffee: '咖啡燉肉',
    meat_lemon: '檸檬雞',
    bread_fish: '魚排三明治',
    bread_honey: '蜂蜜吐司',
    bread_mint: '香草麵包',
    bread_coffee: '早餐套餐',
    bread_lemon: '檸檬塔',
    fish_honey: '蜜汁烤魚',
    fish_mint: '香草烤魚',
    fish_coffee: '提神魚排',
    fish_lemon: '檸檬魚',
    honey_mint: '草本茶',
    honey_coffee: '蜂蜜拿鐵',
    honey_lemon: '蜂蜜檸檬水',
    mint_coffee: '薄荷摩卡',
    mint_lemon: '薄荷檸檬氣泡飲',
    coffee_lemon: '冰檸檬咖啡'
  },
  FOOD_SEMI = {
    meat: '絞肉',
    bread: '麵團',
    fish: '魚漿',
    honey: '蜂巢',
    mint: '薄荷醬',
    coffee: '咖啡豆',
    lemon: '醃檸檬'
  },
  FOOD_BIG = {
    meat_bread: '大漢堡',
    meat_fish: '海陸大餐',
    meat_honey: '蜜汁肉丸',
    meat_mint: '香草肉捲',
    meat_coffee: '摩卡牛排',
    meat_lemon: '檸香烤全雞',
    bread_fish: '魚排堡',
    bread_honey: '蜂蜜鬆餅塔',
    bread_mint: '香草佛卡夏',
    bread_coffee: '提拉米蘇',
    bread_lemon: '檸檬奶油派',
    fish_honey: '照燒魚定食',
    fish_mint: '薄荷烤鮭魚',
    fish_coffee: '咖啡烤鰻魚',
    fish_lemon: '檸檬奶油鮭魚',
    honey_mint: '蜂蜜薄荷茶凍',
    honey_coffee: '蜂蜜拿鐵蛋糕',
    honey_lemon: '蜂蜜檸檬塔',
    mint_coffee: '薄荷摩卡聖代',
    mint_lemon: '薄荷檸檬雪酪',
    coffee_lemon: '檸檬咖啡蛋糕'
  };
/* 數值相加；k 倍（淨化次數不乘） */
const fdAdd = (...l) => {
  const o = {};
  for (const x of l) for (const k in x) o[k] = (o[k] || 0) + x[k];
  return o;
};
const fdMul = (x, k) =>
  Object.fromEntries(Object.entries(x).map(([a, v]) => [a, a === 'cln' ? v : Math.round(v * k * 100) / 100]));
function genFood() {
  const out = [],
    it = (id, n, fk, fd, x) =>
      out.push({
        id,
        n,
        star: 2,
        sh: fk === 'big' ? 'h2' : 's1',
        tags: ['food'],
        fk,
        /* 飽足感：每個食材 +FOOD_HP 生命（料理、半成品 ×1.25 取整到 10、大料理再加倍），食物是主要的防禦來源 */
        fd: { hp: FOOD_HPOF[fk], ...fd },
        ic: 'it_' + id,
        ...(fk === 'ing' ? { pool: 14, th: 'b' } : { ns: 1 }),
        ...x
      });
  for (const k of FOOD_K) it('fd_' + k, FOOD_N[k], 'ing', fdMul(FOOD_V[k], 0.5), { fa: [k] });
  FOOD_K.forEach((a, i) =>
    FOOD_K.slice(i + 1).forEach(b =>
      it(`fm_${a}_${b}`, FOOD_MIX[a + '_' + b], 'mix', fdMul(fdAdd(FOOD_V[a], FOOD_V[b]), 1.25), { fa: [a, b] })
    )
  );
  /* 半成品：檸檬（醃檸檬）是淨化 2 次 */
  for (const k of FOOD_K)
    it('fs_' + k, FOOD_SEMI[k], 'semi', k === 'lemon' ? { cln: 2 } : fdMul(FOOD_V[k], 2.5), { fa: [k, k], sg: k });
  FOOD_K.forEach((a, i) =>
    FOOD_K.slice(i + 1).forEach(b =>
      it(
        `fb_${a}_${b}`,
        FOOD_BIG[a + '_' + b],
        'big',
        fdAdd(out.find(x => x.id === 'fs_' + a).fd, out.find(x => x.id === 'fs_' + b).fd),
        {
          fa: [a, a, b, b],
          sg: [a, b]
        }
      )
    )
  );
  return out;
}
/* 兩件食物 a、b（物件）合成出什麼；不能合回傳 null */
function cookOf(a, b) {
  const A = ITEMI[a.id],
    B = ITEMI[b.id];
  if (!A || !B || !A.fk || !B.fk || a === b) return null;
  const [x, y] = [A.fa[0], B.fa[0]].sort((p, q) => FOOD_K.indexOf(p) - FOOD_K.indexOf(q));
  if (A.fk === 'ing' && B.fk === 'ing') return x === y ? 'fs_' + x : `fm_${x}_${y}`;
  if (A.fk === 'semi' && B.fk === 'semi' && x !== y) return `fb_${x}_${y}`;
  return null;
}
ITEMS.push(...THEME_ITEMS, ...genThemeW(), ...genFood());
const ITEMI = Object.fromEntries(ITEMS.map(it => [it.id, it]));
/* 0.1.62 道具池：每件道具在哪幾個池（b 基本池＝每局都有；g 巨人國、f 共生森林、m 機關城、c 棋盤王國、z 黃道十二宮＝主題池，開場內圈轉一個）。
   主題專屬的新道具寫在道具的 th；這張表是舊道具的分配（tools/pools.js 產生：照標籤、形狀排每個主題的合適度，從最不合的拿掉，
   拿掉後每個主題、每類職業武器的 1～5★ 都還要有）。沒寫到的道具三個主題都有 */
const POOLS = {
  /* 0.1.103 基本池：食材（genFood 的 th: 'b'）＋金幣堆＋藥水＋詛咒繃帶；基本防具、抗異常、剋寵物、淨化之鈴、磨刀石退出（x） */
  b: 'bigpotion bugspray cursedbandage elixir herb ironskin phoenixdown potion purse',
  x: 'beastbell boots bugnet cape cleansebell fireproof gasmask handwarmer hunterbadge ironhelm leatherarmor leathercap lightningrod rivetvest sunglasses thickhide tourniquet whetstone',
  fg: 'holycollar holymirror holyoil holysigil iceheart',
  /* 0.1.69 原本 f、m 共用的飾品分一半給棋盤王國（c）、黃道十二宮（z）：每件還是兩個主題 */
  fc: 'acidflask beasttotem cloak echostone fireorb frostgem giantblood hexdoll piercerune shadowflower spellbook sunderstone toxinvial venomking weaponrack',
  fz: 'assassinmark bloodrune crest firebottle frenzywhistle fuse grip hourglass puppetstring shieldrack stormcore thunderflower venomflower wardrum',
  mc: 'axestone bone darkorb fireflower frostflower giantbelt hawkeye kingcrown quiver spearrest stormfeather thunderstone venomgland warpaint',
  mz: 'arcaneink bersmask clover emberstone forgehammer frostrune grimoire holyflower prism sheath spikestud thornvine vampfang warbanner whetwheel',
  gm: 'necroessence necrotome',
  f: 'acolytewand assassinblade bear bleedoil blindpowder coindart dragonlance frostaxe frostbow frostbrew hawk holymace holysword holywand holywater huntbow icecrystal longbow poisonbrew qilin ragepotion shadowclaw shadowstaff sparkrod sunbow thunderbat thunderbow thunderjav towershield treefrog venomsac venomspear viper waraxe weakbrew wolf woodsword',
  g: 'aegis anvil archstaff babydragon bloodsword cauldron chainmail club dragonmail dragonslayer emberwand flail greataxe greatsword halberd handaxe heavyxbow icefang icestaff lavaheart mithril needle paladinshield pickaxe pike powder skeleton slime spikedmail stormhammer thornshield thunderhammer vampbat venomknife woodshield worldhammer',
  m: 'crystalstaff demonaxe dragonblood excalibur firecat firestaff flamesword frostwand handxbow huntxbow ironshield ironsword katana knife nightscythe phoenixbow plaguestaff repeater rotstaff scythe shadowdirk shadowknife skythunder sparkdagger spear stormxbow teslacoil thunderheart twinblades woodspear'
};
const ITEM_TH = {};
for (const k in POOLS) for (const id of POOLS[k].split(' ')) ITEM_TH[id] = k;
/* 0.1.69 主題池的武器全部是主題專屬的：舊武器（POOLS 裡分給 g／f／m 的）退出商店（x：不在任何池），
   只當起手道具、核心送的、舊快照用；那三個主題缺的武器由 genThemeW 補 */
for (const id in ITEM_TH) if (ITEM_TH[id] !== 'b' && ITEMI[id] && (ITEMI[id].dmg || ITEMI[id].block)) ITEM_TH[id] = 'x';
/* 0.1.103 通用融合（tf）退出商店，由料理取代（docs/料理.md） */
for (const id in ITEM_TH) if (ITEMI[id] && ITEMI[id].tf) ITEM_TH[id] = 'x';
const thOf = it => it.th || ITEM_TH[it.id] || 'fgm';
/* 這件在主題 th 的局裡會不會出現（th 沒給＝不分主題，例如舊存檔） */
const thOK = (th, it) => !th || thOf(it) === 'b' || thOf(it).includes(th);
/* 商店、戰利品、送的寵物會出的道具：不是職業核心、也不是核心送的專屬道具（ns） */
const shopOK = it => !it.core && !it.ns;
/* 0.1.7 開局職業：1-1 開打前三選一（可以刷新一次），整局都有效。
   m：對有那個標籤的道具加成（跟飾品一樣算進道具身上）；F：角色身上；gold：每回合多拿的金幣；th：機器人選了這個職業偏好買的標籤；
   st：0.1.8 選完送的 1★ 起手道具 */
const CLASSES = [
  {
    id: 'archer',
    st: 'huntbow',
    n: '弓箭手',
    ic: 'sk_multishot',
    th: 'bow',
    /* 0.1.50 職業特性：弓、弩命中插箭（敵人身上每支箭，受到你的攻擊傷害 +1%） */
    m: [
      { tag: 'bow', dmgPct: 25, spd: 20, stick: 1 },
      { tag: 'xbow', dmgPct: 25, spd: 20, stick: 1 }
    ],
    F: { arrowPct: 1 }
  },
  {
    id: 'swordsman',
    st: 'woodsword',
    /* 0.1.35 劍士 → 浪人：劍、矛都吃職業加成 */
    n: '浪人',
    ic: 'sk_swordwave',
    th: 'sword',
    m: [
      { tag: 'sword', dmgPct: 35, crit: 15, bleed: 2 },
      { tag: 'spear', dmgPct: 35, crit: 15, bleed: 2 }
    ]
  },
  {
    id: 'berserker',
    st: 'club',
    n: '狂戰士',
    ic: 'sk_rage',
    th: 'mace',
    /* 0.1.74 狂戰士重製（狂血）：斧、鎚傷害 +25%、命中撕裂 1；每少 10% 生命，斧、鎚攻速 +BLOOD_SPD%、吸血 +BLOOD_LS%（blood） */
    m: [
      { tag: 'axe', dmgPct: 25, spd: 10, rend: 1 },
      { tag: 'mace', dmgPct: 25, spd: 10, rend: 1 }
    ],
    F: { blood: 1 }
  },
  {
    id: 'spearman',
    st: 'woodspear',
    /* 0.1.35 槍兵 → 亞馬遜：矛、弓都吃職業加成（傷害 +30% 墊底 4.28 → +40%，護甲 +5、生命 +20 加回來） */
    n: '亞馬遜',
    ic: 'sk_spearrush',
    th: 'spear',
    m: [
      { tag: 'spear', dmgPct: 40, spd: 15, crit: 10 },
      { tag: 'bow', dmgPct: 40, spd: 15, crit: 10 },
      /* 0.1.50 矛、弓、盾：盾格擋 +20% */
      { tag: 'shield', blockPct: 20 }
    ],
    F: { arm: 5, hp: 20 }
  },
  {
    id: 'assassin',
    st: 'knife',
    n: '刺客',
    ic: 'sk_backstab',
    th: 'dagger',
    m: [{ tag: 'dagger', crit: 20 }],
    F: { critMul: 60 }
  },
  {
    id: 'pyro',
    st: 'emberwand',
    n: '火法師',
    ic: 'sk_fireburst',
    th: 'fire',
    m: [
      { tag: 'fire', burn: 2, dmgPct: 10 },
      { tag: 'staff', dmgPct: 15 }
    ],
    /* 0.1.51 職業特性：敵人燃燒到 15 層自動點燃 */
    F: { igniteAt: 15 }
  },
  {
    id: 'cryo',
    st: 'frostwand',
    n: '冰法師',
    ic: 'sk_frostnova',
    th: 'cold',
    m: [
      /* 0.1.37 凍結改成單件 6 秒：凍結 +20% → +10%，多了冰緩 +20% */
      { tag: 'cold', freezeCh: 10, chillCh: 20, dmgPct: 30 },
      { tag: 'staff', spd: 20 }
    ]
  },
  {
    id: 'storm',
    st: 'sparkrod',
    n: '雷法師',
    ic: 'sk_chainlight',
    th: 'light',
    /* 0.1.51 職業特性：雷命中彈射 1 次（連鎖）、每一下（含彈射）讓敵人 +1 電荷，滿了放電 */
    m: [{ tag: 'light', chainN: 1, charge: 1 }]
  },
  {
    id: 'venom',
    st: 'needle',
    n: '毒師',
    ic: 'sk_poison',
    th: 'poison',
    m: [
      /* 0.1.37 傷害 +25% → +15%，中毒上限 12 → 24 */
      { tag: 'poison', poison: 1, dmgPct: 15 },
      { tag: 'dagger', poison: 1 }
    ],
    F: { poisonCap: 24 }
  },
  /* 0.1.53 馴獸師重製：寵物 +30%、攻速 +10%（機器人測 +45%／+20% 排第 1；玩家擺法比機器人好，再砍）；寵物會成長、寵物的攻擊不觸發反彈 */
  {
    id: 'tamer',
    st: 'treefrog',
    n: '馴獸師',
    ic: 'sk_tauntroar',
    th: 'pet',
    m: [{ tag: 'pet', dmgPct: 30, spd: 10 }],
    F: { petGrow: 4, petNoThorns: 1 }
  },
  {
    id: 'knight',
    st: 'woodshield',
    n: '騎士',
    ic: 'sk_shieldwall',
    th: 'shield',
    /* 0.1.29 6 人一場騎士墊底：格擋 40% → 60%、生命 20 → 40、被打中反彈 2 */
    m: [{ tag: 'shield', blockPct: 60 }],
    /* 0.1.33 生命 40 → 50、反彈 2 → 3 */
    F: { hp: 50, thornsF: 3 }
  },
  {
    id: 'alchemist',
    st: 'potion',
    n: '鍊金術士',
    ic: 'cur_vaal',
    th: 'potion',
    /* 0.1.37 藥劑效果 +50%、生命藥水多喝 1 次（拿掉藥水回復 +30%、回復 +1） */
    F: { throwPct: 50, potUse: 1 }
  },
  /* 0.1.33 eliteGold：打完菁英多拿的金幣 */
  /* 0.1.74 商人職業特性：開戰時身上的金幣越多越強（鈔能力的弱化版 RICH_C，鈔能力改成中後期的 RICH） */
  { id: 'merchant', st: 'purse', n: '商人', ic: 'cur_regal', gold: 1, eliteGold: 3, F: { richC: 1 } }
];
const CLSI = Object.fromEntries(CLASSES.map(c => [c.id, c]));
/* 0.1.10 職業核心兩次：2-5 首領掉「專屬核心」（每個職業 12 個、各有特色），4-4 首領掉「副核心」（照模板對主打標籤加成，12 個）。
   背包裡專屬核心、副核心各最多 1 個。P 是那個職業主打的標籤 */
const CORE_P = {
  archer: ['bow', 'xbow'],
  swordsman: ['sword', 'spear'],
  berserker: ['axe', 'mace'],
  spearman: ['spear', 'bow'],
  assassin: ['dagger'],
  pyro: ['fire'],
  cryo: ['cold'],
  storm: ['light'],
  venom: ['poison'],
  tamer: ['pet'],
  knight: ['weapon'],
  alchemist: ['weapon'],
  merchant: ['weapon']
};
const onP = (P, m) => P.map(tag => ({ tag, ...m }));
/* 專屬核心：[名字, 效果]；效果用 all（對標籤加成）、fx（角色身上，含 0.1.10 的新機制）、pre（開戰效果）、gold */
const CORE_MAIN = {
  /* 0.1.50 弓箭手重製（獵人、插箭）：插箭是職業特性，核心大多跟插箭連動 */
  archer: P => [
    ['爆裂箭', { fx: { boom: 3 }, ic: 'sk_blastarrow' }],
    ['多重射擊', { all: onP(P, { shots: 5 }), ic: 'sk_multishot' }],
    ['箭雨', { fx: { rain: 4 }, ic: 'sk_rainarrow' }],
    ['倒鉤箭', { fx: { arrowCap: 30, barb: 2 }, ic: 'sk_rotarrow' }],
    ['鷹眼狙擊', { all: onP(P, { snipe: 3 }), fx: { critArrow: 3 }, ic: 'tree_n064' }],
    ['神鷹', { give: 'skyhawk', ic: 'a:hunt_hawkeagle' }],
    ['元素箭袋', { all: onP(P, { elem: 1 }), ic: 'sk_firearrow' }],
    ['連珠箭', { all: onP(P, { spd: 10 }), fx: { streak: 4 }, ic: 'sk_lightarrow' }],
    ['游擊', { all: onP(P, { spd: 10 }), fx: { dodge: 20, kite: 30 } }],
    ['風之箭', { all: onP(P, { sure: 1, pierce: 50, dmgPct: 25 }), ic: 'sk_frostarrow' }],
    ['捕獸夾', { all: onP(P, { bleed: 1 }), traps: [{ k: 'snare', n: 4, sz: 1 }], ic: 'sk_trapshot' }],
    ['獵網', { traps: [{ k: 'net', n: 2, sz: 2 }], fx: { dodge: 8 }, ic: 'it_bugnet' }]
  ],
  /* 0.1.35 浪人（P 是劍、矛）：武士道只加劍；二天一流兩件就合成；招架是被打時的格擋機率；魔劍正宗送一把會吸收劍的 5★ 劍 */
  swordsman: P => [
    ['武士道', { all: [{ tag: 'sword', dmgPct: 35, spd: 20, crit: 5 }] }],
    ['拔刀術', { all: onP(P, { crit: 25 }), fx: { opener: 100 } }],
    ['浴血越戰', { all: onP(P, { bleed: 6, ls: 30 }) }],
    ['二天一流', { merge2: 'sword' }],
    ['招架', { fx: { parry: 15, parryArm: 30 } }],
    ['連斬', { all: onP(P, { dmgPct: 10 }), fx: { double: 30, triple: 10 } }],
    ['心如止水', { all: onP(P, { crit: 20 }), fx: { critMul: 60, immT: 5 } }],
    ['背水', { fx: { rage: 50, rageSpd: 50, double: 10 } }],
    ['雙手大師', { all: [{ tag: 'twohand', dmgPct: 40, spd: 20, cellDbl: 5 }] }],
    /* 0.1.33 劍陣 → 劍修大師：打贏菁英時三選一都是劍；0.1.35 劍或矛、必定 Ⅱ 階 */
    ['劍修大師', { eliteAll: ['sword', 'spear'], eliteT: 2 }],
    ['破甲斬', { all: onP(P, { sunder: 5, dmgPct: 20, pierce: 50 }) }],
    ['魔劍正宗', { give: 'masamune' }]
  ],
  /* 0.1.74 狂戰士重製（狂血：越接近死亡越強）：諸神黃昏、不死之怒、血祭（進入低血）、擲斧、撕裂猛擊、血泉、狂血沸騰、處刑（看撕裂）、
     碎骨（無視護盾）、戰意沸騰、嗜血護甲、巨力（雙手武器充能） */
  berserker: P => [
    ['諸神黃昏', { fx: { ragna: 1 }, ic: 'sk_berserk' }],
    ['不死之怒', { fx: { undying: 1 }, ic: 'asc_bloodmage_b5' }],
    ['血祭', { all: onP(P, { dmgPct: 20 }), fx: { selfCut: 25, immT: 3 }, ic: 'tree_n092' }],
    ['擲斧', { fx: { axeThrow: 1 }, all: onP(P, { dmgPct: 10 }), ic: 'sk_axespin' }],
    ['撕裂猛擊', { all: onP(P, { rendEv: 5 }), ic: 'asc_bloodclaw_b0' }],
    ['血泉', { fx: { rendLeech: 30 }, all: onP(P, { rend: 1 }), ic: 'asc_bloodclaw_b1' }],
    ['狂血沸騰', { fx: { blood: 1 }, ic: 'asc_bloodmage_b2' }],
    ['處刑', { all: onP(P, { dmgPct: 10 }), fx: { execute: 60, execRend: 1 }, ic: 'it_c_berserker_7' }],
    ['碎骨', { all: onP(P, { sunder: 3, dmgPct: 10, shPierce: 20 }), ic: 'it_c_berserker_2' }],
    ['戰意沸騰', { fx: { bzFury: 1 }, all: onP(P, { dmgPct: 10 }), ic: 'asc_bloodmage_c0' }],
    ['嗜血護甲', { all: onP(P, { ls: 10 }), fx: { lsShield: 1 }, ic: 'asc_bloodmage_b3' }],
    ['巨力', { all: [{ tag: 'twohand', spd: 50 }], ic: 'it_c_berserker_10' }]
  ],
  /* 0.1.50 亞馬遜重製（矛、弓、盾）：協同作戰（召喚戰士）、女武神降臨（復活）、撕裂（新異常）、矛弓連攜、戰舞、插矛、日月輪轉 */
  spearman: P => [
    ['協同作戰', { fx: { summon: 2 }, ic: 'asc_cls_amazon' }],
    ['女武神降臨', { fx: { revive: 40 }, ic: 'asc_valkyrie_c1' }],
    ['矛弓連攜', { fx: { link3: 3 }, ic: 'asc_valkyrie_b1' }],
    ['戰舞', { fx: { link: 12 }, ic: 'asc_valkyrie_b5' }],
    ['插矛', { all: [{ tag: 'spear', pin: 1, dmgPct: 10 }], ic: 'sk_javelin' }],
    ['迴避反擊', { fx: { dodge: 15, counter: 100 }, ic: 'asc_valkyrie_b3' }],
    ['叢林陷阱', { traps: [{ k: 'stake', n: 3, sz: 2 }], all: onP(P, { dmgPct: 10 }), ic: 'it_spikestud' }],
    ['血獵', { fx: { huntCrit: 25, huntHeal: 6 }, all: onP(P, { rend: 1 }), ic: 'asc_valkyrie_c0' }],
    ['日月輪轉', { fx: { sunmoon: 50 }, ic: 'asc_valkyrie_c2' }],
    ['姊妹盟約', { sisters: [30, 15], ic: 'asc_valkyrie_e' }],
    ['部落之盾', { all: [...onP(P, { guard: 35 }), { tag: 'shield', blockPct: 40 }], ic: 'asc_valkyrie_b2' }],
    ['浴血戰姬', { fx: { fury: 3, rendX: 2 }, ic: 'sk_bloodhowl' }]
  ],
  assassin: P => [
    ['影襲', { all: onP(P, { crit: 15 }), fx: { opener: 100 } }],
    ['毒刃', { all: onP(P, { poison: 2, dmgPct: 10 }) }],
    ['致命', { all: onP(P, { crit: 25 }), fx: { critMul: 50 } }],
    ['暗殺', { all: onP(P, { dmgPct: 10 }), fx: { execute: 80 } }],
    ['殘影', { all: onP(P, { spd: 10 }), fx: { dodge: 18 } }],
    ['連擊', { all: onP(P, { dmgPct: 10 }), fx: { double: 25 } }],
    ['割喉', { all: onP(P, { bleed: 2, dmgPct: 10 }) }],
    ['煙霧彈', { fx: { dodge: 8 }, pre: { blind: 4 } }],
    ['嗜血刃', { all: onP(P, { crit: 10 }), fx: { critHeal: 5 } }],
    ['刀陣', { all: onP(P, { dmgPct: 10, per: 'dagger' }) }],
    ['虛弱毒', { all: onP(P, { weakCh: 25 }) }],
    ['疾影', { all: onP(P, { spd: 30 }) }]
  ],
  /* 0.1.51 火法師重製（點燃）：星星之火（會蔓延的火苗陷阱）、爆燃、流星火雨、焚盡（斬殺線）、自焚、火之化身、引火、炎爆、灼命、熱浪、火焰護體、鳳凰涅槃 */
  pyro: P => [
    ['星星之火', { fx: { spark: 1 }, ic: 'sk_fire' }],
    ['爆燃', { fx: { flash: 4 }, ic: 'sk_fireburst' }],
    ['流星火雨', { fx: { meteor: 15 }, ic: 'msk_meteor' }],
    ['焚盡', { fx: { burnout: 5 }, ic: 'sup_ln_hellfire' }],
    ['自焚', { fx: { selfBurn: 100 }, ic: 'asc_s_flame' }],
    ['火之化身', { fx: { avatar: 30 }, ic: 'sk_flamelance' }],
    ['引火', { fx: { igniteStart: 1 }, pres: { burn: 5 }, ic: 'sup_sp_gfire' }],
    ['炎爆', { fx: { combust: 2 }, ic: 'sup_sp_cvfire' }],
    ['灼命', { fx: { burnLeech: 25 }, ic: 'sk_firetotem' }],
    ['熱浪', { fx: { heat: 5 }, ic: 'sk_firewall' }],
    ['火焰護體', { fx: { thornsBurn: 1, hp: 20 }, ic: 'it_fireorb' }],
    ['鳳凰涅槃', { fx: { phoenix: 5 }, ic: 'sk_phoenix' }]
  ],
  /* 0.1.37 冰法重製：冰錐（陷阱）、碎冰（照敵人凍結／冰緩的道具數）、冰甲、暴風雪、寒冰之心（送會成長的道具） */
  cryo: P => [
    ['寒霜', { all: onP(P, { freezeCh: 35 }) }],
    /* 0.1.37 開戰凍結改成開戰冰緩 */
    ['冰封', { all: onP(P, { dmgPct: 10 }), pre: { frozen: 4 } }],
    ['冰錐', { traps: [{ k: 'icicle', n: 3, sz: 2 }] }],
    ['碎冰', { fx: { shatterF: 20, shatterS: 5 } }],
    ['冰甲', { fx: { startBlock: 100, immFz: 1 } }],
    ['暴風雪', { pre: { frozen: 8 } }],
    ['冰晶共鳴', { all: onP(P, { dmgPct: 10, per: 'cold' }) }],
    ['凍傷', { all: onP(P, { bleed: 2, dmgPct: 10 }) }],
    ['寒冰之心', { give: 'icheart' }],
    ['冰刃', { all: onP(P, { crit: 20 }), fx: { critMul: 30 } }],
    ['霜凍連擊', { all: onP(P, { dmgPct: 10 }), fx: { double: 18 } }],
    ['永凍', { all: onP(P, { weakCh: 20, freezeCh: 15, chillCh: 10 }) }]
  ],
  /* 0.1.51 雷法師重製（連鎖 → 電荷 → 放電 → 麻痺）：連鎖閃電、癱瘓、超載、雷神降臨、雷暴雲、疾雷、雷鳴、電磁脈衝、雷火、靜電場、避雷針、電網陷阱 */
  storm: P => [
    ['連鎖閃電', { all: [{ tag: 'light', chainN: 2 }], ic: 'asc_storm_b0' }],
    ['癱瘓', { fx: { palsy: 1 }, ic: 'asc_storm_b1' }],
    ['超載', { fx: { overload: 1 }, ic: 'asc_storm_b5' }],
    ['雷神降臨', { fx: { thunderGod: 1 }, ic: 'asc_storm_c1' }],
    ['雷暴雲', { fx: { cloud: 6 }, ic: 'asc_storm_b4' }],
    ['疾雷', { fx: { zapSpd: 10 }, ic: 'asc_storm_b2' }],
    ['雷鳴', { fx: { stunCharge: 20 }, ic: 'asc_storm_c0' }],
    ['電磁脈衝', { fx: { emp: 2 }, ic: 'asc_judge_c0' }],
    ['雷火', { all: [{ tag: 'light', burn: 1 }], fx: { zapIgnite: 1 }, ic: 'asc_talisman_b1' }],
    ['靜電場', { fx: { static: 15 }, ic: 'sk_staticfield' }],
    ['避雷針', { fx: { rod: 20, rStun: 50 }, ic: 'tree_s09' }],
    ['電網陷阱', { traps: [{ k: 'shock', n: 3, sz: 2 }], ic: 'asc_judge_b3' }]
  ],
  /* 0.1.37 毒師重製：劇毒（新異常）、以毒為生、腐蝕、墮落蛇、致命毒素（時段）、毒囊（陷阱）、別西卜的封印 */
  venom: P => [
    ['劇毒', { fx: { p2v: 1, venomCap: 40 } }],
    ['瘟疫', { all: onP(P, { dmgPct: 10 }), pres: { poison: 12, venom: 4 } }],
    ['以毒為生', { fx: { poisonLife: 1 } }],
    ['腐蝕', { fx: { corrodeRe: 3 } }],
    ['毒液噴濺', { all: onP(P, { poison: 2 }) }],
    ['蛇吻', { give: 'fsnake' }],
    ['致命毒素', { phase: { t: 20, a: { dmgPct: 80, spd: 50, crit: 30 }, b: { dmgPct: -30, spd: -20, age: 1 } } }],
    ['毒囊', { traps: [{ k: 'spore', n: 3, sz: 2 }] }],
    ['毒刺皮膚', { fx: { startBlock: 150, hp: 100, thornsF: 5, thornsP: 2 } }],
    ['麻痺毒', { all: onP(P, { stunCh: 20, poison: 1 }) }],
    ['血毒', { all: onP(P, { bleed: 4, poison: 1 }) }],
    ['別西卜的封印', { give: 'bzseal' }]
  ],
  /* 0.1.53 馴獸師重製：捕獲、進化、獸群召喚、獸群首領、巨獸化、群狼戰術、護主、撲殺、狂暴、馴獸鞭、共生、四兇召來 */
  tamer: P => [
    ['捕獲', { capture: 35, ic: 'it_bugnet' }],
    ['進化', { evolve: 6, ic: 'asc_tamer_c1' }],
    ['獸群召喚', { fx: { wolves: 4 }, ic: 'asc_tamer_b0' }],
    ['獸群首領', { fx: { alpha: 1 }, ic: 'asc_tamer_b4' }],
    ['巨獸化', { fx: { giant: 1 }, ic: 'sin_sloth_giant' }],
    ['群狼戰術', { fx: { pack: 5 }, ic: 'asc_tamer_c2' }],
    ['護主', { fx: { petGuard: 25 }, ic: 'asc_tamer_b3' }],
    ['撲殺', { fx: { pounce: 1 }, ic: 'asc_tamer_b5' }],
    ['狂暴', { fx: { frenzy: 3 }, ic: 'msk_roar' }],
    ['馴獸鞭', { fx: { whip: 5 }, ic: 'asc_tamer_c0' }],
    ['共生', { fx: { symHeal: 1 }, fxPer: [{ tag: 'pet', hp: 12 }], ic: 'asc_tamer_b2' }],
    ['四兇召來', { give: 'vessel', ic: 'it_cauldron' }]
  ],
  knight: P => [
    ['聖盾', { all: [{ tag: 'shield', blockPct: 60 }] }],
    ['堡壘', { all: [{ tag: 'shield', block: 10 }], fx: { hp: 40 } }],
    ['盾擊', { fx: { thornsF: 6, arm: 4 } }],
    ['起手盾', { fx: { startBlock: 40 } }],
    ['鐵壁', { fx: { arm: 14 } }],
    ['聖光', { all: onP(P, { blindCh: 15 }), fx: { regen: 2 } }],
    /* 0.1.33 不動如山 → 鐵甲戰士：防具、盾的效果 ×1.5 */
    ['鐵甲戰士', { defX: 1.5 }],
    /* 0.1.33 護甲變成每把武器的傷害、每把武器暈眩 +10% */
    ['審判', { all: onP(P, { stunCh: 10 }), fx: { armDmg: 1 } }],
    ['守護誓約', { all: [{ tag: 'shield', spd: 30 }] }],
    ['復仇', { fx: { rage: 40, thornsF: 3 } }],
    ['騎士精神', { all: onP(P, { dmgPct: 20, spd: 10 }) }],
    ['盾牆', { all: [{ tag: 'shield', blockPct: 15, per: 'shield' }] }]
  ],
  /* 0.1.37 鍊金重製：煉成（三次三選一做終極藥劑）、萬能藥、開戰的多重效果（pres）、陷阱（點燃、藥劑炸彈）、狂暴藥劑（時段）、賢者之石 */
  alchemist: P => [
    ['煉成', { brew: 3 }],
    ['萬能藥', { potBuff: [80, 5, 35, 20] }],
    ['劇毒煉金', { pres: { selfV: 3, poison: 6 }, selfN: 2 }],
    ['爆裂藥劑', { pres: { burn: 30 }, traps: [{ k: 'ignite', n: 4, sz: 1 }] }],
    ['腐蝕藥劑', { pres: { corrode: 10, dmgDown: 30 } }],
    ['迷霧藥劑', { pres: { blind: 15, confuse: 15 } }],
    ['衰弱藥劑', { pres: { weak: 10, age: 10 } }],
    ['冰凍藥劑', { pres: { freezeN: 4 } }],
    ['再生藥劑', { fx: { potUse: 2 }, earlyPot: 1 }],
    ['藥劑炸彈', { traps: [{ k: 'bomb', n: 5, sz: 1 }] }],
    ['狂暴藥劑', { phase: { t: 20, a: { dmgPct: 50, spd: 40 }, b: { dmgPct: 25, spd: 20 } } }],
    ['賢者之石', { give: 'philstone' }]
  ],
  /* 0.1.35 商人改版：大多是經濟效果（拿到送錢、照階段的收入、照身上金幣的加成、商店打亂價格、背包升級打折、買 5 次送三選一） */
  merchant: P => [
    ['第一桶金', { gain: 60 }],
    /* [從第幾階段起, 每回合幾金] */
    [
      '財源滾滾',
      {
        goldSt: [
          [1, 2],
          [4, 4],
          [6, 6]
        ]
      }
    ],
    ['鈔能力', { rich: 1 }],
    /* 0.1.33 傭兵 → 投機商人：每回合免費刷新商店；0.1.35 1 → 2 次 */
    ['投機商人', { freeRoll: 2 }],
    ['六合彩', { lotto: 1 }],
    ['精品', { early: 1 }],
    /* 0.1.33 開戰時金幣超過 5 金就花 5 金，整場封鎖敵人星級最高的武器 */
    ['賄賂', { bribe: 5 }],
    ['折價卷', { lvOff: 50 }],
    ['回扣', { kick: 5 }],
    /* 0.1.74 奸商：送一件黑心貨（1 格，開戰時讓敵人隨機兩把武器降一階） */
    ['奸商', { gold: 1, give: 'blackgoods' }],
    /* 0.1.33 拿到時送 2 隻隨機 4★ 寵物 */
    ['保鏢', { gift: [4, 'pet', 2] }],
    ['豪賭', { all: onP(P, { dmgPct: 50, spd: 30 }), rollCap: 2 }]
  ]
};
/* 副核心：通用模板，對職業主打的標籤加成 */
const CORE_SUB = [
  ['狂怒', P => ({ all: onP(P, { dmgPct: 30 }) })],
  ['疾風', P => ({ all: onP(P, { spd: 25 }) })],
  ['致命', P => ({ all: onP(P, { crit: 20 }) })],
  ['處決', P => ({ all: onP(P, { crit: 8 }), fx: { critMul: 50 } })],
  ['血刃', P => ({ all: onP(P, { bleed: 2 }) })],
  ['碎甲', P => ({ all: onP(P, { sunder: 2 }) })],
  ['詛咒', P => ({ all: onP(P, { weakCh: 20 }) })],
  ['閃光', P => ({ all: onP(P, { blindCh: 20 }) })],
  ['嗜血', P => ({ all: onP(P, { ls: 12 }) })],
  ['堅韌', () => ({ fx: { hp: 60 } })],
  ['鐵壁', () => ({ fx: { arm: 8 } })],
  ['幻影', () => ({ fx: { dodge: 12 } })]
];
/* 0.1.101 覺醒／質變（docs/質變核心.md）：4-4 時 2-5 拿的核心有變體，三選一是「1 個新核心＋覺醒＋質變」，選了就取代原本的核心。
   d 覺醒（原本效果全部保留再加強）、t 質變（換掉機制、只留主題）；強度對齊「原本＋新核心」 */
const CORE_VAR = {
  archer: P => ({
    游擊: {
      d: ['疾風游擊', { all: onP(P, { spd: 15 }), fx: { dodge: 25, kite: 40 }, kitePer: 10 }],
      t: ['一箭入魂', { all: onP(P, { spd: -25, dmgPct: 170, crit: 25 }), fx: { critMul: 60 } }]
    }
  }),
  swordsman: P => ({
    連斬: {
      d: ['千刃', { all: onP(P, { dmgPct: 15 }), fx: { double: 30, triple: 10 }, perBlade: 5 }],
      t: ['居合', { all: onP(P, { dmgPct: 30, pierce: 60 }), iai: [3, 2] }]
    }
  }),
  spearman: () => ({
    女武神降臨: {
      d: ['英靈殿', { fx: { revive: 50 }, revShield: 10, valhalla: 1, ic: 'asc_valkyrie_c1' }],
      t: ['女武神之槍', { fx: { valkAt: 60 }, all: [{ tag: 'spear', rend: 1, dmgPct: 30 }], ic: 'asc_valkyrie_c1' }]
    }
  }),
  assassin: P => ({
    連擊: {
      d: ['淬毒連擊', { all: onP(P, { dmgPct: 20 }), fx: { double: 30, dblDot: 1 } }],
      t: ['刀陣輪舞', { all: onP(P, { dmgPct: 60 }), bladeDrv: 1 }]
    }
  }),
  pyro: () => ({
    鳳凰涅槃: {
      d: ['不滅之火', { fx: { phoenix: 6, phx2: 30 }, ic: 'sk_phoenix' }],
      t: ['火鳥', { fx: { bird: 45 }, ic: 'sk_phoenix' }]
    }
  }),
  cryo: P => ({
    冰甲: {
      d: ['永凍堡壘', { fx: { startBlock: 120, immFz: 1 }, iceBlk: 25 }],
      t: ['碎冰之甲', { fx: { fzBlk: 20 }, all: onP(P, { freezeCh: 15 }) }]
    }
  }),
  berserker: () => ({
    諸神黃昏: {
      d: ['永恆黃昏', { fx: { ragX: 1 }, ic: 'sk_berserk' }],
      t: ['血之契約', { fx: { rag0: 2 }, ic: 'sk_berserk' }]
    }
  }),
  storm: () => ({
    連鎖閃電: {
      d: ['雷霆網', { all: [{ tag: 'light', chainN: 2 }], chainChg: 1, chainPer: 8, ic: 'asc_storm_b0' }],
      t: ['導電', { all: [{ tag: 'light', dmgPct: 60 }], conduct: 30, ic: 'asc_storm_b0' }]
    }
  }),
  venom: () => ({
    毒刺皮膚: {
      d: ['劇毒甲殼', { fx: { startBlock: 150, hp: 120, thornsF: 6, thornsP: 2 }, thPer: 1 }],
      t: ['蛻皮', { fx: { thornsF: 5, thornsP: 3, molt: 40 } }]
    }
  }),
  knight: () => ({
    鐵壁: {
      d: ['不動如山', { fx: { arm: 18 }, armPer: 4 }],
      t: ['荊棘鐵壁', { fx: { thornsF: 10 }, armTh: 70 }]
    }
  }),
  alchemist: () => ({
    萬能藥: {
      d: ['藥劑大師', { potBuff: [90, 5, 40, 25], potAdj: 1 }],
      t: ['投擲藥劑', { potThrow: 200 }]
    }
  }),
  merchant: () => ({
    鈔能力: {
      d: ['富可敵國', { rich: 1, richX: 1 }],
      t: ['一擲千金', { spendUp: 10 }]
    }
  }),
  tamer: () => ({
    進化: {
      d: ['適者生存', { evolve: 4, fitPet: 50, ic: 'asc_tamer_c1' }],
      t: ['突變', { mutate: 1, all: [{ tag: 'pet', dmgPct: 20 }], ic: 'asc_tamer_c1' }]
    }
  })
};
/* 0.1.101 這個核心的覺醒、質變（沒有就是空的） */
const coreVars = id => ITEMS.filter(i => i.vof === id).map(i => i.id);
function genCores() {
  const out = [];
  for (const C of CLASSES) {
    const P = CORE_P[C.id] || ['weapon'],
      V = CORE_VAR[C.id] ? CORE_VAR[C.id](P) : {};
    CORE_MAIN[C.id](P).forEach(([n, d], k) => {
      const base = {
        id: `c_${C.id}_${k}`,
        n: `${C.n}・${n}`,
        star: 5,
        core: 1,
        cls: C.id,
        sh: ['s1', 'v2', 'h2'][k % 3],
        tags: ['core'],
        ic: C.ic,
        ...d,
        /* 0.1.51 重製過的核心自己指定圖示（icx：不用舊的 it_c_職業_編號 圖） */
        ...(d.ic ? { icx: 1 } : {})
      };
      out.push(base);
      /* 0.1.101 覺醒（vk d）、質變（vk t）：vof 是原本的核心；圖示沿用原本的（畫面加標記） */
      for (const vk of ['d', 't'])
        if (V[n] && V[n][vk]) {
          const [vn, vd] = V[n][vk];
          out.push({
            ...base,
            ...Object.fromEntries(Object.keys(d).map(x => [x, undefined])),
            ...vd,
            id: base.id + vk,
            n: `${C.n}・${vn}`,
            vof: base.id,
            vk,
            ic: vd.ic || base.ic,
            ...(vd.ic || base.icx ? { icx: 1 } : {})
          });
        }
    });
    CORE_SUB.forEach(([n, f], k) =>
      out.push({
        id: `s_${C.id}_${k}`,
        n: `副核・${n}`,
        star: 5,
        core: 2,
        cls: C.id,
        sh: 's1',
        tags: ['core'],
        ic: 'cur_soul',
        ...f(P)
      })
    );
  }
  return out;
}
ITEMS.push(...genCores());
for (const it of ITEMS) ITEMI[it.id] = it;
/* 0.1.96 七宗罪：每件道具的羈絆（核心沒有）；表沒寫到的（新道具）要跑 node tools/sins.js --write */
/* SIN_OF 開始（tools/sins.js --write 產生，不要手改） */
const SIN_OF = {
  acidflask: 'glut',
  acolytewand: 'sloth',
  aegis: 'glut,pride',
  anvil: 'wrath',
  arcaneink: 'envy',
  archstaff: 'sloth,envy',
  assassinblade: 'greed',
  assassinmark: 'lust',
  axestone: 'envy',
  babydragon: 'sloth',
  bear: 'pride',
  beastbell: 'pride',
  beasttotem: 'glut',
  beelzebub: 'lust,greed',
  bersmask: 'envy',
  bigpotion: 'pride',
  blackgoods: 'sloth',
  bleedoil: 'greed',
  blindpowder: 'lust',
  bloodrune: 'glut',
  bloodsword: 'sloth',
  bone: 'wrath',
  boots: 'wrath',
  bugnet: 'wrath',
  bugspray: 'envy',
  bzseal: 'wrath,envy',
  c1coldbow: 'greed',
  c1darkdagger: 'glut',
  c1fireshield: 'lust',
  c1holyaxe: 'envy',
  c1lightsword: 'pride',
  c1poisonspear: 'lust',
  c1xpet: 'sloth',
  c1xstaff: 'greed',
  c2coldshield: 'glut',
  c2darkaxe: 'sloth',
  c2firepet: 'greed',
  c2holyspear: 'pride',
  c2lightbow: 'wrath',
  c2poisonsword: 'lust',
  c2xdagger: 'envy',
  c2xstaff: 'pride',
  c3coldpet: 'glut',
  c3darkspear: 'envy',
  c3firestaff: 'sloth',
  c3holysword: 'pride',
  c3lightshield: 'lust',
  c3poisonbow: 'greed',
  c3xaxe: 'wrath',
  c3xdagger: 'pride',
  c4coldstaff: 'greed',
  c4darksword: 'lust',
  c4firedagger: 'sloth',
  c4holybow: 'lust',
  c4lightpet: 'wrath',
  c4poisonshield: 'lust',
  c4xaxe: 'greed',
  c4xspear: 'glut',
  c5colddagger: 'glut,greed',
  c5darkbow: 'lust,pride',
  c5fireaxe: 'wrath,sloth',
  c5holyshield: 'envy,greed',
  c5lightstaff: 'wrath,glut',
  c5poisonpet: 'sloth,lust',
  c5xspear: 'pride,envy',
  c5xsword: 'glut,greed',
  cape: 'sloth',
  cauldron: 'glut',
  cbishop: 'greed',
  chainmail: 'envy',
  cking: 'pride',
  cknight: 'lust',
  cleansebell: 'pride',
  cloak: 'lust',
  clover: 'wrath',
  club: 'envy',
  coindart: 'greed',
  cpawn: 'glut',
  cqueen: 'lust,pride',
  crest: 'greed',
  crook: 'sloth',
  crystalstaff: 'envy',
  cursedbandage: 'wrath',
  darkorb: 'wrath',
  demonaxe: 'wrath,envy',
  dragonblood: 'wrath',
  dragonlance: 'sloth,glut',
  dragonmail: 'pride,greed',
  dragonslayer: 'pride',
  echostone: 'greed',
  elixir: 'lust,sloth',
  emberstone: 'glut',
  emberwand: 'pride',
  excalibur: 'wrath,lust',
  f1firestaff: 'sloth',
  f1holysword: 'glut',
  f1icedagger: 'greed',
  f1lightbow: 'wrath',
  f1shadowspear: 'envy',
  f1shield: 'lust',
  f1xaxe: 'sloth',
  f1xpet: 'pride',
  f2firestaff: 'sloth',
  f2icesword: 'envy',
  f2lightbow: 'greed',
  f2shadowdagger: 'glut',
  f2shield: 'wrath',
  f2xaxe: 'pride',
  f2xspear: 'lust',
  f3coldbow: 'envy',
  f3darkstaff: 'glut',
  f3firesword: 'sloth',
  f3holydagger: 'lust',
  f3lightaxe: 'glut',
  f3xshield: 'wrath',
  f4coldsword: 'glut',
  f4firestaff: 'sloth',
  f4holypet: 'envy',
  f4lightspear: 'wrath',
  f4poisonaxe: 'lust',
  f4shadowdagger: 'glut',
  f4shield: 'sloth',
  f5darkpet: 'envy,glut',
  f5firebow: 'greed,sloth',
  f5holydagger: 'pride,wrath',
  f5lightspear: 'wrath,greed',
  f5mace: 'envy,glut',
  f5shield: 'lust,pride',
  f5venomsword: 'sloth,envy',
  farmor: 'lust',
  fbow: 'envy',
  fent: 'wrath',
  fheart: 'envy',
  firebottle: 'wrath',
  firecat: 'pride,sloth',
  fireflower: 'greed',
  fireorb: 'envy',
  fireproof: 'pride',
  firestaff: 'greed',
  flail: 'sloth',
  flamesword: 'pride',
  fmoss: 'lust',
  forgehammer: 'sloth',
  fpollen: 'pride',
  fpouch: 'glut',
  frenzywhistle: 'pride',
  frostaxe: 'greed',
  frostbow: 'lust',
  frostbrew: 'glut',
  frostflower: 'sloth',
  frostgem: 'envy',
  frostrune: 'pride',
  frostwand: 'glut',
  fshroom: 'greed',
  fsnake: 'wrath,glut',
  fthorn: 'sloth',
  fthrone: 'glut',
  fuse: 'envy',
  fvine: 'lust',
  fygg: 'greed,lust',
  g1darkpet: 'envy',
  g1firedagger: 'pride',
  g1holybow: 'lust',
  g1icesword: 'wrath',
  g1poisonstaff: 'greed',
  g1thunderspear: 'wrath',
  g1xshield: 'greed',
  g2coldsword: 'wrath',
  g2darkdagger: 'glut',
  g2firebow: 'lust',
  g2holyaxe: 'glut',
  g2poisonspear: 'sloth',
  g2thundermace: 'pride',
  g2xpet: 'envy',
  g2xstaff: 'wrath',
  g3darkspear: 'wrath',
  g3fireaxe: 'greed',
  g3holymace: 'lust',
  g3icedagger: 'sloth',
  g3lightsword: 'envy',
  g3venomstaff: 'wrath',
  g3xpet: 'glut',
  g3xshield: 'greed',
  g4coldsword: 'wrath',
  g4firebow: 'sloth',
  g4holypet: 'lust',
  g4lightdagger: 'envy',
  g4shadowstaff: 'wrath',
  g4venommace: 'greed',
  g4xshield: 'pride',
  g5bow: 'wrath,envy',
  g5coldshield: 'sloth,glut',
  g5firestaff: 'pride,greed',
  g5holystaff: 'lust,pride',
  g5shadowsword: 'envy,glut',
  g5spear: 'lust,wrath',
  g5thunderpet: 'greed,sloth',
  g5venomdagger: 'envy,lust',
  garmor: 'glut',
  gasmask: 'lust',
  gaxe: 'pride',
  gbanner: 'sloth',
  gbow: 'wrath',
  gcrown: 'glut',
  gflask: 'greed',
  gheart: 'lust',
  giantbelt: 'envy',
  giantblood: 'greed',
  gmount: 'wrath,greed',
  gpike: 'pride',
  gram: 'greed',
  greataxe: 'envy',
  greatsword: 'sloth',
  grimoire: 'lust',
  grip: 'pride',
  gtrunk: 'glut',
  gwall: 'envy',
  halberd: 'pride',
  handaxe: 'sloth',
  handwarmer: 'greed',
  handxbow: 'envy',
  hawk: 'lust',
  hawkeye: 'wrath',
  heavyxbow: 'sloth',
  herb: 'sloth',
  hexdoll: 'glut',
  holycollar: 'pride',
  holyflower: 'lust',
  holymace: 'wrath',
  holymirror: 'greed',
  holyoil: 'envy',
  holysigil: 'pride',
  holysword: 'lust',
  holywand: 'wrath',
  holywater: 'pride',
  hourglass: 'sloth',
  hundun: 'pride,envy',
  huntbow: 'pride',
  hunterbadge: 'wrath',
  huntxbow: 'glut',
  icecrystal: 'sloth',
  icefang: 'envy',
  iceheart: 'glut',
  icestaff: 'envy',
  icheart: 'glut,sloth',
  ironhelm: 'wrath',
  ironshield: 'glut',
  ironskin: 'greed',
  ironsword: 'lust',
  katana: 'greed',
  kingcrown: 'greed,glut',
  knife: 'sloth',
  lavaheart: 'sloth',
  leatherarmor: 'glut',
  leathercap: 'greed',
  lightningrod: 'glut',
  longbow: 'glut',
  m1coldbow: 'envy',
  m1darkspear: 'wrath',
  m1firepet: 'lust',
  m1holyaxe: 'pride',
  m1shield: 'sloth',
  m1thunderdagger: 'greed',
  m1venomsword: 'envy',
  m1xstaff: 'lust',
  m2darkstaff: 'envy',
  m2firesword: 'greed',
  m2holyspear: 'pride',
  m2icepet: 'sloth',
  m2lightdagger: 'wrath',
  m2venomaxe: 'lust',
  m2xshield: 'envy',
  m3darkstaff: 'envy',
  m3firebow: 'sloth',
  m3holydagger: 'pride',
  m3icesword: 'greed',
  m3pet: 'lust',
  m3poisonspear: 'lust',
  m3shield: 'envy',
  m4coldsword: 'pride',
  m4darkstaff: 'glut',
  m4firebow: 'wrath',
  m4holyaxe: 'pride',
  m4pet: 'greed',
  m4spear: 'envy',
  m4venomdagger: 'lust',
  m5darkpet: 'wrath,lust',
  m5holystaff: 'sloth,pride',
  m5icedagger: 'sloth,envy',
  m5lightsword: 'pride,wrath',
  m5poisonaxe: 'lust,glut',
  m5shield: 'greed,wrath',
  m5spear: 'sloth,envy',
  marmor: 'pride',
  masamune: 'greed,lust',
  mcannon: 'glut,pride',
  mchain: 'greed',
  mclock: 'sloth',
  mgear: 'pride',
  mheart: 'sloth,envy',
  mithril: 'glut',
  mkey: 'wrath',
  mknives: 'wrath',
  mshield: 'wrath',
  mspring: 'sloth',
  msteam: 'sloth',
  mtesla: 'sloth',
  mtrapbox: 'greed',
  necroessence: 'glut',
  necrotome: 'envy',
  needle: 'lust',
  nightscythe: 'lust',
  paladinshield: 'greed',
  philstone: 'greed,lust',
  phoenixbow: 'glut',
  phoenixdown: 'envy',
  pickaxe: 'envy',
  piercerune: 'lust',
  pike: 'glut',
  plaguestaff: 'glut,wrath',
  poisonbrew: 'glut',
  potion: 'wrath',
  powder: 'pride',
  prism: 'wrath',
  puppetstring: 'greed',
  purse: 'pride',
  qilin: 'pride,wrath',
  qiongqi: 'envy,glut',
  quiver: 'lust',
  ragepotion: 'sloth',
  repeater: 'envy',
  rivetvest: 'envy',
  rotstaff: 'lust',
  scythe: 'glut',
  shadowclaw: 'lust,greed',
  shadowdirk: 'glut',
  shadowflower: 'pride',
  shadowknife: 'greed',
  shadowstaff: 'greed',
  sheath: 'sloth',
  shieldrack: 'sloth',
  skeleton: 'wrath',
  skyhawk: 'sloth,pride',
  skythunder: 'wrath,envy',
  slime: 'pride',
  sparkdagger: 'wrath',
  sparkrod: 'wrath',
  spear: 'glut',
  spearrest: 'glut',
  spellbook: 'envy',
  spikedmail: 'sloth',
  spikestud: 'lust',
  stormcore: 'wrath',
  stormfeather: 'wrath',
  stormhammer: 'sloth',
  stormxbow: 'greed,lust',
  sunbow: 'glut,pride',
  sunderstone: 'envy',
  sunglasses: 'wrath',
  taotie: 'sloth,envy',
  taowu: 'glut,greed',
  teslacoil: 'greed',
  thickhide: 'greed',
  thornshield: 'lust',
  thornvine: 'pride',
  thunderbat: 'pride',
  thunderbow: 'pride',
  thunderflower: 'lust',
  thunderhammer: 'glut',
  thunderheart: 'envy',
  thunderjav: 'sloth',
  thunderstone: 'glut',
  tourniquet: 'lust',
  towershield: 'pride',
  toxinvial: 'greed',
  treefrog: 'greed',
  twinblades: 'sloth',
  ultelixir: 'pride,wrath',
  vampbat: 'glut',
  vampfang: 'sloth',
  venomflower: 'envy',
  venomgland: 'wrath',
  venomking: 'lust',
  venomknife: 'lust',
  venomsac: 'greed',
  venomspear: 'greed',
  vessel: 'lust,sloth',
  viper: 'glut',
  waraxe: 'pride',
  warbanner: 'wrath',
  wardrum: 'sloth',
  warpaint: 'greed',
  weakbrew: 'lust',
  weaponrack: 'pride',
  whetstone: 'envy',
  whetwheel: 'glut',
  wolf: 'envy',
  woodshield: 'pride',
  woodspear: 'greed',
  woodsword: 'sloth',
  worldhammer: 'lust,pride',
  z1coldstaff: 'envy',
  z1darksword: 'glut',
  z1firedagger: 'pride',
  z1holybow: 'lust',
  z1lightpet: 'wrath',
  z1poisonshield: 'wrath',
  z1xaxe: 'glut',
  z1xspear: 'greed',
  z2colddagger: 'envy',
  z2darkbow: 'glut',
  z2fireaxe: 'greed',
  z2holyshield: 'pride',
  z2lightstaff: 'wrath',
  z2poisonpet: 'wrath',
  z2xspear: 'envy',
  z2xsword: 'pride',
  z3coldaxe: 'lust',
  z3darkshield: 'sloth',
  z3firespear: 'greed',
  z3holypet: 'pride',
  z3lightdagger: 'wrath',
  z3poisonstaff: 'lust',
  z3xbow: 'envy',
  z3xsword: 'glut',
  z4coldspear: 'glut',
  z4darkpet: 'sloth',
  z4firesword: 'wrath',
  z4holystaff: 'lust',
  z4lightaxe: 'envy',
  z4poisondagger: 'wrath',
  z4xbow: 'glut',
  z4xshield: 'sloth',
  z5coldsword: 'sloth,envy',
  z5darkstaff: 'glut,envy',
  z5firebow: 'greed,wrath',
  z5holydagger: 'pride,glut',
  z5lightspear: 'greed,lust',
  z5poisonaxe: 'sloth,wrath',
  z5xpet: 'greed,lust',
  z5xshield: 'envy,pride',
  zaquar: 'glut',
  zaries: 'pride',
  zcancer: 'greed',
  zcapri: 'sloth',
  zgemini: 'sloth',
  zleo: 'wrath',
  zlibra: 'greed',
  zpisces: 'glut',
  zsagitt: 'lust',
  zscorpio: 'lust',
  ztaurus: 'envy',
  zvirgo: 'pride'
};
/* SIN_OF 結束 */
for (const it of ITEMS) it.sins = it.core ? [] : (SIN_OF[it.id] || '').split(',').filter(Boolean);
/* 職業的說明：標籤加成、角色加成、金幣 */
function clsDesc(id) {
  const c = CLSI[id];
  if (!c) return '';
  /* 加成一樣的標籤合在一起：「弓、弩：傷害 +20%」 */
  const g = new Map();
  for (const b of c.m || []) {
    const t = modTxt(b);
    g.set(t, [...(g.get(t) || []), tagTxt(b.tag)]);
  }
  const out = [...g].map(([t, tags]) => `${tags.join('、')}：${t}`);
  if (c.F) out.push(modTxt(Object.fromEntries(Object.entries(c.F).filter(([k]) => MODN[k]))));
  if (c.F && c.F.potMul) out.push(`藥水回復 +${c.F.potMul}%${c.F.potUse ? `、多喝 ${c.F.potUse} 次` : ''}`);
  else if (c.F && c.F.potUse) out.push(`生命藥水多喝 ${c.F.potUse} 次`);
  if (c.gold)
    out.push(
      `每回合 +${c.gold} 金${c.eliteGold ? `、打完菁英 +${c.eliteGold} 金` : ''}${c.m || c.F ? '' : '（沒有戰鬥加成）'}`
    );
  return out.filter(Boolean).join('；');
}
/* 升階：3 件相同、相同階的合成高一階（最多 3 階）；數值倍率與加成倍率 */
const TIER_MAX = 3,
  TIERM = [0, 1, 3, 9],
  TIERB = [0, 1, 1.6, 2.6];
/* 升階連冷卻、暴擊、命中效果一起變強。0.1.13：合成是自動的，合完不能比 3 件分開放還弱，
   所以基礎數值（傷害、生命、護甲、格擋、回復）×3／×9（等於 3 件、9 件的總和，再加上冷卻 -8%／-20%、機率 +5／+12、
   空出格子）；百分比與層數 ×1.6／×2.6；藥水 Ⅲ 多喝 1 次 */
const TIERCD = [0, 1, 0.92, 0.8],
  TIERCH = [0, 0, 5, 12];
const cdT = (it, t = 1) => Math.round(it.cd * TIERCD[t] * 100) / 100;
/* 0.1.13 fx（角色身上的加成，例如鐵膚藥水的護甲）也照升階變強：固定數值照 TIERM、百分比照 TIERB；
   受到的傷害（懲罰）與多喝幾次不變 */
const FX_FLAT = ['hp', 'arm', 'regen', 'thornsF', 'startBlock', 'critHeal'];
function fxT(it, t = 1) {
  const o = {};
  for (const k in it.fx || {}) {
    const v = it.fx[k];
    o[k] = k === 'take' || k === 'potUse' ? v : Math.round(v * (FX_FLAT.includes(k) ? TIERM[t] : TIERB[t]));
  }
  return o;
}
function onT(it, t = 1) {
  const o = it.on || {},
    st = v => (v ? Math.round(v * TIERB[t]) : 0),
    ch = v => (v ? v + TIERCH[t] : 0);
  return {
    crit: (it.crit || 0) + (it.dmg ? TIERCH[t] : 0),
    burn: st(o.burn),
    poison: st(o.poison),
    bleed: st(o.bleed),
    sunder: st(o.sunder),
    ls: ch(o.ls),
    weak: ch(o.weak),
    blind: ch(o.blind),
    freeze: o.freeze ? [ch(o.freeze[0]), o.freeze[1]] : null,
    stun: o.stun ? [ch(o.stun[0]), o.stun[1]] : null,
    /* 0.1.37 劇毒層、命中衰老／腐蝕秒數、冰緩機率 */
    venom: st(o.venom),
    age: o.age || 0,
    corrode: o.corrode || 0,
    chill: ch(o.chill)
  };
}
/* 星級顏色：CSS 變數（跟著淺色／深色主題變） */
const STARC = ['', 'var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)'];
/* 價格：星級；賣出：退一半（升階的照材料數） */
const priceOf = id => ITEMI[id].star;
/* 0.1.103 食物：賣價＝用了幾個食材（食材 1 金、料理 2 金、大料理 4 金），買了馬上賣不會賺 */
const sellOf = (id, t = 1) =>
  ITEMI[id].fk ? ITEMI[id].fa.length : Math.max(1, Math.ceil((ITEMI[id].star * 3 ** (t - 1)) / 2));
/* 形狀旋轉 r 次（90°），回傳從 0 開始的格子 */
/* 0.1.20 形狀算過就記住（機器人評估時一回合要算上千次）；回傳的陣列大家共用，不要改它 */
const SHC = new Map();
/* sm：0.1.33 長柄大師讓雙手武器少佔 1 格（拿掉一格，剩下的還連在一起）；sh：0.1.59 七十二變換過的形狀（SH 的鍵） */
function shapeOf(id, rot = 0, sm = 0, sh) {
  const key = id + '|' + (rot & 3) + (sm ? 's' : '') + (sh ? '|' + sh : '');
  let v = SHC.get(key);
  if (!v) SHC.set(key, (v = shapeRaw(id, rot, sm, sh)));
  return v;
}
/* 一件道具（背包、暫存區、商店的一格）的形狀；r 沒給就用它自己的旋轉 */
const shapeO = (o, r = o.r || 0) => shapeOf(o.id, r, o.sm, o.sh);
/* 格子連在一起（上下左右） */
const linked = a => {
  const seen = new Set([a[0] + '']),
    st = [a[0]];
  while (st.length) {
    const [x, y] = st.pop();
    for (const p of a)
      if (!seen.has(p + '') && Math.abs(p[0] - x) + Math.abs(p[1] - y) === 1) seen.add(p + ''), st.push(p);
  }
  return seen.size === a.length;
};
function shrinkShape(c) {
  if (c.length < 2) return c;
  for (let i = c.length - 1; i >= 0; i--) {
    const d = c.filter((_, j) => j !== i);
    if (linked(d)) return d;
  }
  return c.slice(0, -1);
}
function shapeRaw(id, rot, sm, sh) {
  let c = SH[(sh && shReg(sh) && sh) || ITEMI[id].sh].map(p => [...p]);
  if (sm) c = shrinkShape(c);
  for (let i = 0; i < (rot & 3); i++) c = c.map(([x, y]) => [-y, x]);
  const mx = Math.min(...c.map(p => p[0])),
    my = Math.min(...c.map(p => p[1]));
  return c.map(([x, y]) => [x - mx, y - my]);
}
/* 0.1.62 巨人國：形狀的凹口（形狀的方框裡空著、被包住的格子），放在那格的道具吃這件的 hole 加成；跟著旋轉 */
const SHHOLE = {
  u5: [[1, 0]],
  o8: [[1, 1]],
  h7: [
    [1, 0],
    [1, 2]
  ],
  c5: [[1, 1]]
};
function holeOf(o) {
  const k = o.sh || ITEMI[o.id].sh,
    hs = shReg(k) && SHHOLE[k];
  if (!hs || o.sm || !holeMod(o)) return [];
  let c = SH[k].map(p => [...p]),
    hh = hs.map(p => [...p]);
  for (let i = 0; i < ((o.r || 0) & 3); i++) (c = c.map(([x, y]) => [-y, x])), (hh = hh.map(([x, y]) => [-y, x]));
  const mx = Math.min(...c.map(p => p[0])),
    my = Math.min(...c.map(p => p[1]));
  return hh.map(([x, y]) => [o.x + x - mx, o.y + y - my]);
}
/* 0.1.100 巨人國的改造（o.md）：縮小變 1 格、數值 ×0.6；放大照格數換成有凹口的大形狀、數值 ×2（×0.5／×1.6 時巨大藥幾乎沒人買）；
   鑿子挖掉一格變凹口（形狀代號 k:原形狀:第幾格，用到時才登記進 SH／SHHOLE，快照存的就是這個代號） */
const MD_K = { shrink: 0.6, grow: 2 };
const mdK = o => MD_K[o.md] || 1;
const growSh = n => (n <= 2 ? 'u5' : n <= 4 ? 'h7' : 'o8');
function shReg(k) {
  if (SH[k] || typeof k !== 'string' || !k.startsWith('k:')) return SH[k];
  const [, b, i] = k.split(':');
  if (!SH[b] || !SH[b][+i]) return undefined;
  SHHOLE[k] = [...(SHHOLE[b] || []), SH[b][+i]];
  return (SH[k] = SH[b].filter((_, j) => j !== +i));
}
/* 凹口加成：手做的照 I.hole；放大、鑿子做出來的照這件的類別（武器→裡面的武器、防具和盾→裡面的護甲與生命、其他→全部但小） */
const HOLE_C = {
  w: { tag: 'weapon', dmgPct: 50, spd: 15 },
  d: { tag: 'def', defPct: 50 },
  a: { tag: '*', allPct: 30 }
};
function holeMod(o) {
  const I = ITEMI[o.id];
  if (I.hole) return I.hole;
  if (o.md !== 'grow' && o.md !== 'chisel') return null;
  return HOLE_C[I.block || I.tags.includes('armor') ? 'd' : I.dmg ? 'w' : 'a'];
}
/* 凹口裡的道具 q（標籤 tags）吃不吃得到 */
const holeFits = (hm, tags) =>
  hm.tag === '*' || (hm.tag === 'def' ? tags.includes('armor') || tags.includes('shield') : tags.includes(hm.tag));
/* 鑿子挖背包座標 c 那格：回傳原形狀的第幾格；不能挖（不是這件、剩 1 格、斷開）回傳 -1 */
function chiselIdx(q, c) {
  if (!c || q.x == null || q.x < 0) return -1;
  const b = q.sh || ITEMI[q.id].sh,
    cs = shapeO(q),
    i = cs.findIndex(([dx, dy]) => q.x + dx === c[0] && q.y + dy === c[1]);
  if (i < 0 || cs.length < 3) return -1;
  return linked(cs.filter((_, j) => j !== i)) && SH[b] ? i : -1;
}
/* 升階時隨機多一條小詞綴（保留一點刷寶感） */
const AFFX = [
  { k: 'dmgPct', v: 15, n: '傷害 +15%', w: 1 },
  { k: 'spd', v: 12, n: '攻速 +12%', w: 1 },
  { k: 'crit', v: 8, n: '暴擊率 +8%', w: 1 },
  { k: 'hp', v: 15, n: '生命 +15', w: 0 },
  { k: 'ls', v: 5, n: '吸血 5%', w: 1 }
];
const affOf = (id, r) => {
  const isW = !!ITEMI[id].cd && !ITEMI[id].block,
    pool = AFFX.filter(a => (isW ? a.w : a.k === 'hp'));
  return pool[fl(r() * pool.length)].k;
};
/* 0.1.5 5★ 道具一拿到就開一條隨機詞綴（像 POE）：類型隨機、數值在範圍內隨機。
   on：w 武器／寵物、s 盾、* 全部；F 是加在角色身上（生命、護甲、閃避、暴擊傷害），其他加在道具自己身上 */
const MOD5 = [
  { k: 'dmgPct', lo: 12, hi: 30, on: 'w' },
  { k: 'spd', lo: 8, hi: 20, on: 'w' },
  { k: 'crit', lo: 5, hi: 15, on: 'w' },
  { k: 'ls', lo: 3, hi: 8, on: 'w' },
  { k: 'burn', lo: 1, hi: 3, on: 'w' },
  { k: 'poison', lo: 1, hi: 3, on: 'w' },
  { k: 'stunCh', lo: 3, hi: 8, on: 'w' },
  { k: 'freezeCh', lo: 3, hi: 8, on: 'w' },
  { k: 'bleed', lo: 1, hi: 3, on: 'w' },
  { k: 'sunder', lo: 1, hi: 3, on: 'w' },
  { k: 'weakCh', lo: 5, hi: 15, on: 'w' },
  { k: 'blindCh', lo: 5, hi: 15, on: 'w' },
  { k: 'block', lo: 2, hi: 6, on: 's' },
  { k: 'blockPct', lo: 10, hi: 25, on: 's' },
  { k: 'spd', lo: 8, hi: 20, on: 's' },
  { k: 'hp', lo: 15, hi: 40, on: '*', F: 1 },
  { k: 'arm', lo: 2, hi: 6, on: '*', F: 1 },
  { k: 'dodge', lo: 3, hi: 8, on: '*', F: 1 },
  { k: 'critMul', lo: 10, hi: 30, on: '*', F: 1 },
  { k: 'regen', lo: 1, hi: 3, on: '*' }
];
const mod5Pool = id => {
  const I = ITEMI[id],
    t = I.block ? 's' : I.dmg ? 'w' : '';
  return MOD5.filter(x => x.on === '*' || x.on === t);
};
/* 擲一條：回傳 [類型索引, 數值]（存檔與快照只存這兩個數字） */
const roll5 = (id, r) => {
  const pool = mod5Pool(id),
    x = pool[fl(r() * pool.length)];
  return [MOD5.indexOf(x), x.lo + fl(r() * (x.hi - x.lo + 1))];
};
/* 這條詞綴開得好不好：0～1（數值在範圍裡的位置） */
const mod5Q = m => {
  const x = MOD5[m[0]];
  return x.hi > x.lo ? (m[1] - x.lo) / (x.hi - x.lo) : 1;
};
const mod5Txt = m => MODN[MOD5[m[0]].k](m[1]);
/* 說明文字 */
const pct = v => Math.round(v) + '%';
/* 正數加 +，負數本來就有 -（不要變成「+-10%」） */
const sg = v => (v < 0 ? '' : '+');
const MOD_TXT = {
  shrink: `拖到道具上：變成 1 格、數值 ×${MD_K.shrink * 100}%`,
  grow: `拖到道具上：變大、數值 ×${MD_K.grow * 100}%，長出凹口（1～2 格變 U 形、3～4 格變 H 形、5 格以上變口字形）`,
  chisel: '拖到道具的某一格上：那格挖成凹口，少佔 1 格、數值不變；不能挖到剩 1 格或斷成兩塊'
};
/* 0.1.100 凹口吃得到的類別（holeMod 的 tag） */
const HOLE_N = { weapon: '武器', def: '防具或盾', '*': '道具' };
const MODN = {
  dmg: v => `傷害 ${sg(v)}${v}`,
  dmgPct: v => `傷害 ${sg(v)}${pct(v)}`,
  /* 0.1.100 巨人國的凹口 */
  defPct: v => `護甲、生命、格擋 ${sg(v)}${pct(v)}`,
  allPct: v => `所有數值 ${sg(v)}${pct(v)}`,
  spd: v => `攻速 ${sg(v)}${pct(v)}`,
  crit: v => `暴擊率 ${sg(v)}${pct(v)}`,
  burn: v => `命中時燃燒 ${sg(v)}${v} 層`,
  poison: v => `命中時中毒 ${sg(v)}${v} 層`,
  ls: v => `吸血 ${pct(v)}`,
  block: v => `格擋 ${sg(v)}${v}`,
  blockPct: v => `格擋 ${sg(v)}${pct(v)}`,
  freezeCh: v => `命中時凍結機率 ${sg(v)}${pct(v)}`,
  stunCh: v => `命中時暈眩機率 ${sg(v)}${pct(v)}`,
  regen: v => `每秒回復 ${sg(v)}${v} 生命`,
  hp: v => `生命 ${sg(v)}${v}`,
  arm: v => `護甲 ${sg(v)}${v}`,
  dodge: v => `閃避 ${sg(v)}${pct(v)}`,
  critMul: v => `暴擊傷害 ${sg(v)}${pct(v)}`,
  bleed: v => `命中時流血 ${sg(v)}${v} 層`,
  sunder: v => `命中時破甲 ${sg(v)}${v}`,
  weakCh: v => `命中時虛弱機率 ${sg(v)}${pct(v)}`,
  blindCh: v => `命中時致盲機率 ${sg(v)}${pct(v)}`,
  throwPct: v => `丟出的藥劑效果 ${sg(v)}${pct(v)}`,
  opener: v => `開戰時武器已經充能 ${pct(v)}`,
  execute: v => `對生命低於 30% 的敵人傷害 +${pct(v)}`,
  /* 0.1.62 羈絆用 */
  potMul: v => `藥水回復 +${pct(v)}`,
  potUse: v => `每瓶藥水多喝 ${v} 次`,
  rage: v => `自己生命低於 50% 時傷害 +${pct(v)}`,
  ramp: v => `每 5 秒攻速 +${pct(v)}（最多 5 次）`,
  startBlock: v => `開戰時有 ${v} 護盾`,
  double: v => `${pct(v)} 機率連擊`,
  thornsF: v => `被攻擊打中時反彈 ${v} 固定傷害`,
  critHeal: v => `暴擊時回復 ${v} 生命`,
  /* 0.1.28 質變與反制寵物 */
  pierce: v => `無視 ${pct(Math.min(PIERCE_MAX, v))} 護甲與格擋`,
  chain: v => `${pct(v)} 機率連鎖（多打一次）`,
  guard: v => `命中時獲得傷害 ${pct(v)} 的格擋`,
  bash: v => `格擋時對敵人造成格擋量 ${pct(v)} 的傷害`,
  heal: v => `格擋時回復 ${v} 生命`,
  potBomb: v => `喝下時對敵人造成回復量 ${pct(v)} 的傷害`,
  preBoost: v => `開戰丟出的效果 +${pct(v)}`,
  petDown: v => `敵人的寵物傷害 -${pct(Math.min(PETDOWN_MAX, v))}`,
  petHunt: v => `敵人每有 1 隻寵物，你的武器傷害 +${pct(v)}（最多算 5 隻）`,
  /* 0.1.29 抗異常、照格數 */
  rBurn: v => `受到的燃燒 -${pct(Math.min(RES_MAX, v))}`,
  rPoison: v => `受到的中毒 -${pct(Math.min(RES_MAX, v))}`,
  rBleed: v => `受到的流血 -${pct(Math.min(RES_MAX, v))}`,
  rSunder: v => `受到的破甲 -${pct(Math.min(RES_MAX, v))}`,
  rFreeze: v => `被凍結的時間 -${pct(Math.min(RES_MAX, v))}`,
  rStun: v => `被暈眩的時間 -${pct(Math.min(RES_MAX, v))}`,
  rWeak: v => `被虛弱的時間 -${pct(Math.min(RES_MAX, v))}`,
  rBlind: v => `被致盲的時間 -${pct(Math.min(RES_MAX, v))}`,
  poisonImm: v => `開戰 ${v} 秒內不會中毒`,
  cleanse: v => `每 ${CLEANSE_T} 秒清掉身上最嚴重的 ${v} 種異常`,
  healCut: v => `敵人的回復與吸血 -${pct(Math.min(RES_MAX, v))}`,
  critRes: v => `受到的暴擊額外傷害 -${pct(Math.min(RES_MAX, v))}`,
  cellPct: v => `每佔 1 格，傷害 +${pct(v)}`,
  cellHp: v => `每佔 1 格，生命 +${v}`,
  /* 0.1.33 核心新機制（連鎖 = 這一下打完再多打一下） */
  chainN: v => `連鎖 +${v}（每次攻擊多打 ${Math.min(CHAIN_MAX, v)} 下、傷害 ${CHAIN_DMG}%，最多 +${CHAIN_MAX}）`,
  openDbl: v => `開戰 ${v} 秒內每次攻擊都連擊`,
  firstStrike: () => '開戰時星級最高的一把武器先打一下',
  armDmg: () => '每把武器的傷害 +護甲值',
  /* 0.1.35 浪人核心 */
  parry: v => `被攻擊時 ${pct(v)} 機率格擋（這一下不受傷害）`,
  parryArm: v => `第一次格擋成功後護甲 +${v}`,
  triple: v => `${pct(v)} 機率連鎖追擊（一共打三下）`,
  immT: v => `開戰 ${v} 秒內不會中任何異常`,
  rageSpd: v => `自己生命低於 50% 時攻速 +${pct(v)}`,
  cellDbl: v => `每佔 1 格，${pct(v)} 機率連擊`,
  /* 0.1.37 異常重製 */
  chillCh: v => `命中時冰緩機率 ${sg(v)}${pct(v)}`,
  venom: v => `命中時劇毒 ${sg(v)}${v} 層`,
  poisonCap: v => `敵人中毒上限提高到 ${v} 層`,
  venomCap: v => `敵人劇毒上限提高到 ${v} 層`,
  p2v: () => '敵人中毒滿層後，每 2 秒 +1 劇毒',
  poisonLife: () => '以毒為生：讓敵人中毒時自己也中毒，但自己身上的中毒改成回血',
  corrodeRe: v => `每 ${v} 秒讓敵人腐蝕 ${v} 秒`,
  thornsP: v => `被攻擊打中時讓攻擊者中毒 ${v} 層`,
  immAll: () => '免疫所有異常狀態',
  immFz: () => '免疫凍結與冰緩',
  shatterF: v => `所有冰：敵人每有 1 件凍結中的道具傷害 +${pct(v)}`,
  shatterS: v => `每有 1 件冰緩中的道具攻速 +${pct(v)}`,
  /* 0.1.50 弓箭手（插箭）、亞馬遜（撕裂、召喚、復活）的新機制 */
  stick: v => `命中時在敵人身上插 ${v} 支箭`,
  shots: v => `每次攻擊射出 ${v} 支箭（每支 ${SHOT_DMG}% 傷害；命中效果只有第 1 支有，每支都會插箭）`,
  snipe: v => `每第 ${v} 次攻擊必定暴擊、無視全部護甲與護盾`,
  elem: () => '攻擊輪流附加：燃燒 2 層、50% 機率冰緩敵人一件道具、中毒 1 層',
  sure: () => '不會被閃避、招架',
  pin: v =>
    `命中時插 ${v} 把矛在敵人身上（每把敵人攻速 -${PIN_SLOW}%，最多 ${PIN_MAX} 把；插滿後下一次命中全部拔出，撕裂 ${PIN_REND} 層）`,
  rend: v => `命中時撕裂 ${sg(v)}${v} 層`,
  arrowPct: v => `敵人身上每支箭，受到你的攻擊傷害 +${pct(v)}（最多 ${ARROW_MAX} 支）`,
  boom: v => `每支箭插上 ${BOOM_T} 秒後引爆：${v} 固定傷害、燃燒 +${BOOM_BURN} 層`,
  rain: v => `開戰時射出「弓、弩數量 × ${v}」支箭插在敵人身上（每支 ${RAIN_DMG} 傷害）`,
  arrowCap: v => `插箭上限 +${v}`,
  barb: v => `每插一支箭，敵人流血 +${v} 層`,
  critArrow: v => `敵人身上每支箭，暴擊傷害 +${pct(v)}`,
  streak: v => `連續命中每次所有武器攻速 +${pct(v)}（最多 ${STREAK_MAX} 層，被閃開或招架就歸零）`,
  kite: v => `閃避成功時所有武器充能 +${pct(v)}`,
  summon: v => `開戰時召喚 ${v} 名亞馬遜戰士，各自隨機繼承你背包裡一把武器（傷害、加成都一樣，不會被攻擊）`,
  revive: v =>
    `第一次倒下時以 ${pct(v)} 生命復活、清掉身上的持續傷害，化身女武神：傷害 +${VALK_DMG}%、攻速 +${VALK_SPD}%、免疫暈眩、凍結與冰緩`,
  link3: v =>
    `矛攻擊 ${v} 次後，下一次弓、弩攻擊傷害 ×2；弓、弩攻擊 ${v} 次後，下一次矛攻擊傷害 ×2、撕裂 +${LINK_REND} 層`,
  link: v => `矛出手時所有弓、弩充能 +${pct(v)}；弓、弩出手時所有矛充能 +${pct(v)}`,
  counter: v => `閃開、招架攻擊或盾格擋時，最強的一把矛立刻反擊（${pct(v)} 傷害、撕裂 +${CTR_REND} 層）`,
  huntCrit: v => `敵人撕裂中時暴擊率 +${pct(v)}`,
  huntHeal: v => `敵人撕裂中時暴擊回復 ${v} 生命`,
  sunmoon: v => `每 ${SUN_T} 秒日夜交替（從白天開始）：白天矛傷害 +${pct(v)}，夜晚弓、弩攻速 +${pct(v)}`,
  fury: v => `每被攻擊打中一次，矛、弓、弩傷害 +${pct(v)}（最多 ${FURY_MAX} 層）`,
  rendX: v => `造成的撕裂 ×${v}`,
  /* 0.1.74 狂戰士 */
  blood: v => `每少 10% 生命，斧、鎚攻速 +${BLOOD_SPD * v}%、吸血 +${BLOOD_LS * v}%`,
  ragna: () =>
    `生命第一次低於 ${RAGNA_AT}% 時發動諸神黃昏：${RAGNA_T} 秒內免疫暈眩、凍結、冰緩與麻痺，攻速 +${RAGNA_SPD}%、傷害 +${RAGNA_DMG}%、吸血 ×2`,
  undying: () =>
    `第一次受到致命傷時留 1 生命，${UNDY_T} 秒內不會死；${UNDY_B} 秒內傷害 +${UNDY_DMG}%、攻速 +${UNDY_SPD}%、暴擊率 +${UNDY_CRIT}%`,
  selfCut: v => `開戰時扣自己 ${pct(v)} 生命（不會因此倒下）`,
  axeThrow: v => `開戰時擲出背包裡的斧：每把斧讓敵人破甲 ${AXE_SUNDER * v}、撕裂 ${AXE_REND * v} 層`,
  rendEv: v => `每第 ${REND_EV} 次命中，撕裂 +${v} 層`,
  rendLeech: v => `敵人撕裂的傷害 ${pct(v)} 回復你`,
  execRend: v => `敵人每層撕裂，處決線 +${v}%（最多 +20%）`,
  shPierce: v => `${pct(v)} 傷害無視護盾`,
  bzFury: v => `每被攻擊打中一次，斧、鎚攻速 +${pct(v)}（最多 ${BZFURY_MAX} 層）`,
  lsShield: () => '回復超過生命上限的部分變成護盾',
  /* 0.1.74 商人職業特性 */
  richC: () => `開戰時身上的金幣越多越強：${RICHCN.join('；')}`,
  /* 0.1.51 火法師（點燃）、雷法師（電荷、放電、麻痺） */
  igniteAt: v => `敵人燃燒到 ${v} 層時自動點燃（燃燒不退反增、傷害 ×${IGNITE_MUL}）`,
  spark: () =>
    `開戰時在敵人背包隨機放 1 格火苗，每 ${SPARK_T} 秒往上下左右蔓延 1 格；著火格子上的道具每次出手，敵人燃燒 +${SPARK_BURN} 層`,
  flash: v => `敵人被點燃的那一刻爆炸：燃燒層數 ×${v} 固定傷害；之後火的命中時燃燒 +1 層`,
  meteor: v =>
    `每 ${METEOR_T} 秒落下一顆隕石：${v} 固定傷害、燃燒 +${METEOR_BURN} 層；敵人點燃後改成每 ${METEOR_FAST} 秒一顆`,
  burnout: v => `敵人剩下的生命低於「燃燒層數 ×${v}」時直接燒死`,
  selfBurn: v => `點燃中的敵人每次出手，受到燃燒層數 ${pct(v)} 的固定傷害`,
  avatar: v => `敵人被點燃後化身火焰：所有武器攻速 +${pct(v)}，不是火的武器也命中時燃燒 +2 層、傷害 +10%`,
  igniteStart: () => '開戰時點燃敵人',
  combust: v => `每 ${COMBUST_T} 秒引爆敵人身上的燃燒：每層 ${v} 固定傷害（點燃中 ×${IGNITE_MUL}），層數不會減少`,
  burnLeech: v => `敵人燃燒每秒造成的傷害，回復你 ${pct(v)}`,
  heat: v => `敵人每 5 層燃燒，攻速 -${pct(v)}（最多 -60%）`,
  thornsBurn: v => `被攻擊打中時讓攻擊者燃燒 ${v} 層`,
  phoenix: v => `生命低於 30% 時清掉自己的異常、回復「敵人燃燒層數 ×${v}」（一次）`,
  /* 0.1.101 覺醒／質變 */
  phx2: v => `生命低於 15% 時再涅槃一次；每次涅槃後所有武器傷害 +${v}%（整場，可以疊加）`,
  bird: v => `開戰召喚火鳥（不佔格子）：每 2 秒啄一次，造成 ${v} 傷害、敵人燃燒 +2 層；敵人被點燃時每 1.2 秒一次`,
  valkAt: v =>
    `生命第一次低於 ${v}% 時化身女武神：傷害 +${VALK_DMG}%、攻速 +${VALK_SPD}%、免疫暈眩、凍結與冰緩（不會復活）`,
  fzBlk: v => `凍結敵人的道具時獲得 ${v} 護盾`,
  ragX: () =>
    `生命第一次低於 ${RAGNA_AT}% 時發動諸神黃昏：${RAGNA_T * 2} 秒內免疫暈眩、凍結、冰緩與麻痺，攻速 +${RAGNA_SPD}%、傷害 +${RAGNA_DMG}%、吸血 ×3`,
  rag0: v =>
    `開戰就發動諸神黃昏（整場）：免疫暈眩、凍結、冰緩與麻痺，攻速 +${RAGNA_SPD}%、傷害 +${RAGNA_DMG}%、吸血 ×2；之後每秒失去 ${v}% 最大生命（不會因此倒下）`,
  molt: v => `每少 10% 生命蛻皮一次：清掉自己的異常、獲得 ${v} 護盾、敵人中毒 +3 層`,
  dblDot: () => '連擊的那一下，這把的中毒、流血再疊一次',
  charge: v => `命中時讓敵人 +${v} 電荷（滿 ${CHARGE_MAX} 層放電：${ZAP_DMG} 固定傷害、麻痺 ${ZAP_PARA} 層）`,
  palsy: () => `敵人麻痺滿 ${PARA_MAX} 層時暈眩 ${PALSY_STUN} 秒，然後麻痺清空`,
  overload: () => `放電改成要 ${OVERLOAD_N} 層電荷，但傷害 ×${OVERLOAD_MUL}，而且暈眩 ${OVERLOAD_STUN} 秒`,
  thunderGod: () => `放電 ${GOD_N} 次後化身雷神：所有武器攻速 +${GOD_SPD}%，命中的電荷 ×2`,
  cloud: v => `每 ${CLOUD_T} 秒落雷打敵人一次：${v} 固定傷害、電荷 +1`,
  zapSpd: v => `每次放電，所有武器攻速 +${pct(v)}（最多 5 層）`,
  stunCharge: v => `每次暈眩敵人，你所有武器充能 +${pct(v)}`,
  emp: v => `放電時封鎖敵人最強的一把武器（每秒傷害最高） ${v} 秒`,
  zapIgnite: () => '放電時點燃敵人',
  static: v => `敵人每次出手 ${pct(v)} 機率觸電：那次出手落空、電荷 +1`,
  rod: v => `被攻擊打中時 ${pct(v)} 機率電擊攻擊者：${ROD_DMG} 固定傷害、電荷 +1`,
  zapPct: v => `放電傷害 +${pct(v)}`,
  /* 0.1.69 聖羈絆 10 件（跟法老王的安卡一樣） */
  ankh: v => `每場第一次倒下時以 ${pct(v)} 生命復活`,
  /* 0.1.53 馴獸師 */
  petGrow: v => `寵物每打贏一場，那隻永久傷害 +${v}%（最多 +${v * 10}%，合成時留最高的）`,
  petNoThorns: () => '寵物的攻擊不會觸發對手的反彈',
  wolves: v => `開戰後每 ${WOLF_T} 秒召喚一隻戰狼加入戰鬥（最多 ${v} 隻，吃寵物的加成）`,
  alpha: () => '星級最高的寵物成為首領：傷害 ×2；其他寵物傷害 +15%',
  dr: v => `受到的攻擊傷害 -${pct(v)}`,
  giant: () => '背包裡只有 1～2 隻寵物時，牠們變成巨獸：傷害 ×2.5、生命 +80',
  pack: v => `每隻寵物出手時，其他寵物充能 +${pct(v)}`,
  petGuard: v => `被攻擊時 ${pct(v)} 機率由寵物擋下一半傷害，那隻寵物立刻反咬`,
  pounce: () => '敵人生命第一次低於 30% 時，所有寵物立刻出手一次，之後寵物攻速 ×2',
  frenzy: v => `寵物每命中一次疊 1 層狂暴：寵物攻速 +${pct(v)}（最多 ${FRENZY_MAX} 層；你被暈眩時歸零）`,
  whip: v => `每 ${v} 秒鞭策：最慢的寵物立刻出手，這一下傷害 ×2`,
  symHeal: v => `寵物每命中一次，你回復 ${v} 生命`
};
/* 0.1.37 終極藥劑的效果（煉成三選一）：喝下時套用 */
const BREW = {
  heal: { n: '回復 80 生命', heal: 80 },
  shield: { n: '獲得 100 護盾', block: 100 },
  dmg: { n: '8 秒內傷害 +50%', buff: [8, 50, 0] },
  spd: { n: '8 秒內攻速 +40%', buff: [8, 0, 40] },
  regen: { n: '之後每秒回復 5 生命', regen: 5 },
  cleanse: { n: '清掉身上所有異常', cleanse: 1 },
  poison: { n: '讓敵人中毒 10 層、劇毒 4 層', poison: 10, venom: 4 },
  burn: { n: '讓敵人燃燒 15 層並點燃', burn: 15, ignite: 1 },
  chill: { n: '敵人所有道具冰緩 6 秒', chill: 6 },
  age: { n: '讓敵人衰老 8 秒', age: 8 }
};
/* 0.1.37 別西卜的封印：拿到後過幾回合變成別西卜 */
const SEAL_RC = 10;
const brewTxt = ex =>
  (ex || [])
    .map(k => (BREW[k] ? BREW[k].n : ''))
    .filter(Boolean)
    .join('、');
/* 0.1.35 鈔能力：開戰時身上的金幣到幾金有什麼加成（同一種取最高的那一級，不疊加） */
/* 0.1.74 鈔能力改成中後期（40 金起，120 金免疫所有異常）；前期的 10／25 金給商人職業特性（RICH_C，跟鈔能力的加成相加） */
const RICH = [
  [40, { dmgPct: 15, spd: 15, startBlock: 150 }],
  [60, { dmgPct: 15, spd: 15, startBlock: 150, sealAll: 4 }],
  [80, { dmgPct: 25, spd: 25, crit: 10, startBlock: 150, sealAll: 4 }],
  [100, { dmgPct: 40, spd: 35, crit: 15, startBlock: 150, sealAll: 4 }],
  [120, { dmgPct: 40, spd: 35, crit: 15, startBlock: 150, sealAll: 4, immAll: 1 }]
];
const richOf = g => (RICH.filter(([n]) => g >= n).pop() || [0, null])[1];
const RICHN = [
  '40 金：所有武器傷害 +15%、攻速 +15%，開戰有 150 護盾',
  '60 金：開戰封鎖敵人所有武器 4 秒',
  '80 金：所有武器傷害提升到 +25%、攻速提升到 +25%、暴擊率 +10%',
  '100 金：所有武器傷害提升到 +40%、攻速提升到 +35%、暴擊率提升到 +15%',
  '120 金：免疫所有異常'
];
const RICH_C = [
  [10, { dmgPct: 5 }],
  [25, { dmgPct: 10, spd: 10 }],
  [40, { dmgPct: 15, spd: 15 }]
];
const richCOf = g => (RICH_C.filter(([n]) => g >= n).pop() || [0, null])[1];
const RICHCN = [
  '10 金：所有武器傷害 +5%',
  '25 金：傷害提升到 +10%、攻速 +10%',
  '40 金：傷害提升到 +15%、攻速提升到 +15%'
];
/* 0.1.35 財源滾滾：這個階段每回合幾金 */
const goldStOf = (G, st) => (G.filter(([s]) => st >= s).pop() || [0, 0])[1];
/* 0.1.29 抗異常最多 -80%、淨化每 5 秒一次 */
const RES_MAX = 80,
  CLEANSE_T = 5,
  /* 0.1.33 閃電鏈的連鎖：最多多打 2 下、多打的那幾下傷害 50% */
  CHAIN_MAX = 3,
  CHAIN_DMG = 50;
/* 0.1.51 火法師：星星之火（每幾秒蔓延、著火道具出手的燃燒）、流星火雨（每幾秒、點燃後每幾秒、傷害、燃燒）、炎爆每幾秒；
   雷法師：電荷上限、放電（傷害、麻痺、暈眩）、麻痺（最多、每層攻速 -%）、超載、雷神降臨、癱瘓、雷暴雲；陷阱電網（麻痺、電荷） */
const SPARK_T = 2,
  SPARK_BURN = 2,
  METEOR_T = 3,
  METEOR_FAST = 1,
  METEOR_BURN = 4,
  COMBUST_T = 6,
  CHARGE_MAX = 7,
  ZAP_DMG = 10,
  ZAP_PARA = 2,
  /* 平衡：一般放電不暈眩（暈眩讓雷法師平均名次 1.5），只有超載會 */
  ZAP_STUN = 0,
  PARA_MAX = 6,
  PARA_SLOW = 4,
  OVERLOAD_N = 10,
  OVERLOAD_MUL = 3,
  OVERLOAD_STUN = 1.2,
  GOD_N = 3,
  GOD_SPD = 40,
  PALSY_STUN = 1.5,
  CLOUD_T = 2,
  SHOCK_PARA = 2,
  SHOCK_CHG = 2,
  ROD_DMG = 5;
/* 0.1.50 插箭（最多幾支、爆裂箭幾秒後引爆與燃燒、箭雨每支傷害、多重射擊每支傷害）、連珠箭層數、
   插矛（最多幾把、每把攻速 -%、拔出的撕裂）、撕裂（每 0.5 秒扣層數、之後剩 3/4）、矛弓連攜與反擊的撕裂、
   日月輪轉每幾秒交替、浴血戰姬層數、女武神的加成 */
/* 0.1.53 馴獸師：獸群召喚每幾秒一隻、狂暴最多幾層 */
const WOLF_T = 4,
  FRENZY_MAX = 20,
  /* 遠古之器：每幾星召喚一隻四兇；饕餮吞噬最多 +% */
  VESSEL_N = 20,
  GORGE_MAX = 60,
  PERILS = ['taotie', 'qiongqi', 'taowu', 'hundun'];
const ARROW_MAX = 30,
  BOOM_T = 4,
  BOOM_BURN = 1,
  RAIN_DMG = 4,
  SHOT_DMG = 30,
  STREAK_MAX = 15,
  PIN_MAX = 3,
  PIN_SLOW = 8,
  PIN_REND = 8,
  REND_KEEP = 0.75,
  LINK_REND = 4,
  CTR_REND = 3,
  SUN_T = 5,
  FURY_MAX = 20,
  VALK_DMG = 40,
  VALK_SPD = 30,
  /* 0.1.74 狂戰士：狂血（每少 10% 生命）、諸神黃昏、不死之怒、擲斧（每把斧）、撕裂猛擊（每第幾下）、戰意沸騰上限 */
  BLOOD_SPD = 5,
  BLOOD_LS = 2,
  RAGNA_AT = 35,
  RAGNA_T = 6,
  RAGNA_SPD = 60,
  RAGNA_DMG = 20,
  UNDY_T = 4,
  UNDY_B = 5,
  UNDY_DMG = 50,
  UNDY_SPD = 25,
  UNDY_CRIT = 25,
  AXE_SUNDER = 2,
  AXE_REND = 4,
  REND_EV = 3,
  BZFURY_MAX = 20,
  /* 陷阱：捕獸夾（流血、夾幾次壞掉）、獵網（暈眩秒數）、尖樁（固定傷害、破甲、撕裂） */
  SNARE_BLEED = 3,
  SNARE_N = 3,
  NET_STUN = 0.5,
  STAKE_DMG = 12,
  STAKE_SUNDER = 2,
  STAKE_REND = 3;
/* 0.1.28 上限：穿甲最多無視 80%、驅獸最多 -60% */
const PIERCE_MAX = 80,
  PETDOWN_MAX = 40;
/* 0.1.44 說明文字的寫法（skill item-text）：同樣的開頭只寫一次，「命中時凍結機率 +10%、命中時冰緩機率 +20%」→「命中時凍結機率 +10%、冰緩機率 +20%」。
   開頭後面接空格、數字或「時」的不合併（「命中時 35% 機率…」那種句子各自完整） */
const JOIN_P = [
  '自己生命低於 50% 時',
  '敵人撕裂中時',
  '對生命低於 30% 的敵人',
  '命中時讓敵人',
  '開戰時讓敵人',
  '開戰時敵人',
  '開戰時',
  '被攻擊打中時',
  '命中時'
];
const headOf = p => JOIN_P.find(x => p.startsWith(x) && !/^[\s\d時]/.test(p.slice(x.length)));
function joinTxt(parts, sep = '、') {
  const out = [];
  for (const p of parts.filter(Boolean)) {
    const last = out[out.length - 1],
      h = headOf(p);
    if (last && h && last.h === h) last.s += '、' + p.slice(h.length);
    else out.push({ s: p, h });
  }
  return out.map(o => o.s).join(sep);
}
const modTxt = m =>
  joinTxt(
    Object.entries(m)
      .filter(([k]) => MODN[k])
      .map(([k, v]) => MODN[k](v))
  );
const tagTxt = t => (t === 'weapon' ? '武器' : t === '*' ? '道具' : TAGN[t] || t);
/* 0.1.6 開戰前的特殊效果（越強越稀有）：seal 封鎖敵人隨機一把武器 N 秒（每升一階 +1 秒）、down 敵人隨機一把武器降 1 階（最低 Ⅰ 階） */
/* 0.1.9 擴充成各種開戰效果（藥劑丟出去）：秒數類每升一階 +1 秒，層數類照升階倍率 */
/* 0.1.93 異常的白話說明（括號裡那一段）：道具的命中效果、開戰效果用同一套說法，數字從常數拿（常數在 sim.js，呼叫時才讀） */
const ailx = k =>
  ({
    burn: '每秒扣「層數」的血，每秒少 1 層',
    poison: '每秒扣「層數」的血，不會減少',
    venom: `每秒扣「層數 ×${VENOM_MUL}」的血，不會減少`,
    bleed: '每秒扣「層數」的血，然後層數減半',
    freeze: `那件 ${FREEZE_T} 秒不能充能`,
    chill: '充能變慢一半',
    stun: '不能出手',
    weak: `敵人傷害 -${WEAK_PCT}%`,
    blind: `敵人 ${BLIND_MISS}% 打不中`,
    age: '敵人不能暴擊',
    corrode: '敵人不能獲得護盾',
    confuse: '敵人出手一半機率打到自己'
  })[k];
const PRE_T = ['seal', 'weak', 'blind', 'frozen', 'sealAll', 'corrode', 'age', 'confuse'],
  PREN = {
    seal: v => `開戰時封鎖敵人隨機一把武器 ${v} 秒`,
    down: v => `開戰時把敵人隨機 ${v > 1 ? v + ' 把' : '一把'}武器降 1 階（最低 Ⅰ 階）`,
    weak: v => `開戰時讓敵人虛弱 ${v} 秒（${ailx('weak')}）`,
    blind: v => `開戰時讓敵人致盲 ${v} 秒（${ailx('blind')}）`,
    /* 0.1.37 凍結改成單件道具 6 秒，開戰的「凍結」改成所有道具冰緩 */
    frozen: v => `開戰時讓敵人所有道具冰緩 ${v} 秒（${ailx('chill')}）`,
    freezeN: v => `開戰時凍結敵人隨機 ${v} 把武器（${ailx('freeze')}）`,
    selfV: (v, n) => `開戰時讓敵人隨機 ${n || 1} 把武器自殘（那把出手時敵人自己劇毒 +${v} 層）`,
    venom: v => `開戰時讓敵人劇毒 ${v} 層`,
    corrode: v => `開戰時讓敵人腐蝕 ${v} 秒（${ailx('corrode')}，要獲得時改成扣 30 生命）`,
    age: v => `開戰時讓敵人衰老 ${v} 秒（${ailx('age')}）`,
    confuse: v => `開戰時讓敵人混亂 ${v} 秒（${ailx('confuse')}）`,
    dmgDown: v => `敵人整場傷害 -${v}%`,
    burn: v => `開戰時讓敵人燃燒 ${v} 層`,
    poison: v => `開戰時讓敵人中毒 ${v} 層`,
    bleed: v => `開戰時讓敵人流血 ${v} 層`,
    sunder: v => `開戰時讓敵人破甲 ${v}`,
    /* 0.1.28 反制寵物 */
    /* 0.1.53 捕蟲網改成限時：整場關住 N 隻 → 關住 1 隻 N 秒 */
    petSeal: v => `開戰時封鎖敵人最強的 3 隻寵物 ${v} 秒`,
    petLock: v => `開戰時關住敵人星級最高的寵物 ${v} 秒（不能攻擊）`,
    /* 0.1.33 靜電場 */
    sealAll: v => `開戰後 ${v} 秒內封鎖敵人所有武器`
  };
const preKey = p => Object.keys(p)[0];
const preVal = (id, t = 1) => {
  const p = ITEMI[id].pre;
  if (!p) return 0;
  const k = preKey(p),
    v = p[k];
  if (k === 'petLock') return v + 4 * (t - 1);
  if (k === 'petSeal') return v + 2 * (t - 1);
  return k === 'down' ? v : PRE_T.includes(k) ? v + (t - 1) : Math.round(v * TIERM[t]);
};
function preTxt(id, t = 1) {
  const p = ITEMI[id].pre;
  return p ? PREN[preKey(p)](preVal(id, t)) : '';
}
/* 0.1.103 料理的說明：開戰時吃下的數值、招牌效果（半成品寫「做成大料理時」）、怎麼合成 */
const FOOD_SG = {
  meat: '開戰時獲得護盾（生命上限的 10%）',
  bread: '前 3 次受到的命中傷害減半',
  fish: '前 2 次被攻擊必定閃避',
  honey: '生命低於 30% 時回復加倍',
  mint: '開戰 3 秒內不會受到持續傷害',
  coffee: '開戰 3 秒內不會被限制行動',
  lemon: '每次淨化回復 5% 生命'
};
function foodDesc(it) {
  const f = it.fd,
    v = [];
  if (f.hp) v.push(`生命 +${f.hp}${f.hpP ? `，再 +${f.hpP}%` : ''}`);
  if (f.dr) v.push(`受到的命中傷害 -${f.dr}%`);
  if (f.dodge) v.push(`閃避 +${f.dodge}%`);
  if (f.regP) v.push(`每秒回復 ${f.regP}% 生命`);
  if (f.rDot) v.push(`受到的持續傷害（燃燒、中毒、流血類）-${f.rDot}%`);
  if (f.rCtl) v.push(`被限制行動（凍結、暈眩、虛弱、致盲類）的時間 -${f.rCtl}%`);
  if (f.cln) v.push(`每 ${CLEANSE_T} 秒淨化 1 種異常，共 ${f.cln} 次`);
  const out = [`開戰時吃下：${v.join('、')}`];
  if (it.fk === 'semi') out.push(`做成大料理時：${FOOD_SG[it.sg]}`);
  if (it.fk === 'big') out.push(`招牌：${it.sg.map(k => FOOD_SG[k]).join('、')}`);
  out.push(
    it.fk === 'ing'
      ? '拖到另一個食材上合成料理（相同的變半成品）'
      : it.fk === 'semi'
        ? '拖到另一種半成品上合成大料理'
        : '同一道只算一份'
  );
  return out.join('；');
}
function itemDesc(id, t = 1) {
  const it = ITEMI[id],
    k = TIERM[t],
    out = [];
  if (it.fk) return foodDesc(it);
  if (it.d) return [it.d, preTxt(id, t)].filter(Boolean).join('；');
  /* 0.1.101 覺醒、質變：先說會取代哪個核心（覺醒／質變的標記在三選一、圖鑑） */
  if (it.vof) out.push(`取代原本的「${ITEMI[it.vof].n.split('・')[1]}」`);
  const o = onT(it, t);
  if (it.dmg) {
    const a = Math.round(it.dmg[0] * k),
      b = Math.round(it.dmg[1] * k);
    out.push(
      it.absorb
        ? `每 ${cdT(it, t)} 秒攻擊一次（本身沒有傷害）`
        : `每 ${cdT(it, t)} 秒造成 ${a === b ? a : `${a}～${b}`} 傷害${o.crit ? `（暴擊率 ${o.crit}%）` : ''}`
    );
  }
  if (it.on) {
    /* 0.1.44 命中效果合成一行「命中時：…」；括號用白話說明異常（ailx，百科有完整規則） */
    const h = [];
    if (o.burn) h.push(`燃燒 ${o.burn} 層（${ailx('burn')}）`);
    if (o.poison) h.push(`中毒 ${o.poison} 層（${ailx('poison')}）`);
    if (o.venom) h.push(`劇毒 ${o.venom} 層（${ailx('venom')}）`);
    if (o.bleed) h.push(`流血 ${o.bleed} 層（${ailx('bleed')}）`);
    if (o.sunder) h.push(`破甲 ${o.sunder}（敵人護甲 -${o.sunder}，可以疊加）`);
    if (o.freeze) h.push(`${o.freeze[0]}% 機率凍結敵人一件道具（${ailx('freeze')}）`);
    if (o.chill) h.push(`${o.chill}% 機率冰緩敵人一件道具 ${CHILL_T} 秒（${ailx('chill')}）`);
    if (o.stun) h.push(`${o.stun[0]}% 機率暈眩敵人 ${o.stun[1]} 秒（${ailx('stun')}）`);
    if (o.weak) h.push(`${o.weak}% 機率虛弱 ${WEAK_T} 秒（${ailx('weak')}）`);
    if (o.blind) h.push(`${o.blind}% 機率致盲 ${BLIND_T} 秒（${ailx('blind')}）`);
    if (o.age) h.push(`衰老 ${o.age} 秒（${ailx('age')}）`);
    if (o.corrode) h.push(`腐蝕 ${o.corrode} 秒（${ailx('corrode')}）`);
    if (h.length) out.push(`命中時：${h.join('、')}`);
    if (o.ls) out.push(`吸血 ${o.ls}%`);
  }
  if (it.block)
    out.push(
      `每 ${cdT(it, t)} 秒格擋 ${Math.round(it.block * k)}${it.thorns ? `，格擋時反彈 ${it.thorns} 傷害` : ''}${it.heal ? `、回復 ${Math.round(it.heal * k)} 生命` : ''}`
    );
  if (it.hp) out.push(`生命 +${Math.round(it.hp * k)}`);
  if (it.arm) out.push(`護甲 +${Math.round(it.arm * k)}`);
  if (it.dodge) out.push(`閃避 ${Math.round(it.dodge * TIERB[t])}%`);
  if (it.regen) out.push(`每秒回復 ${Math.round(it.regen * k)} 生命`);
  if (it.pot)
    out.push(
      `生命低於 ${it.pot[0]}% 時喝下，回復 ${Math.round(it.pot[1] * k)} 生命（可以喝 ${it.pot[2] + (t === 3 ? 1 : 0)} 次）`
    );
  for (const [w, n] of [
    ['adj', '相鄰的'],
    ['row', '同一排的'],
    ['all', '所有']
  ]) {
    /* 0.1.44 同樣的加成給好幾種標籤：合成一行「所有弓、弩：傷害 +30%」 */
    const g = new Map();
    for (const b of it[w] || []) {
      /* 0.1.93 條件寫在前面：「所有匕首：背包裡每有 1 件匕首，傷害 +10%」 */
      const txt = `${b.per ? `背包裡每有 1 件${tagTxt(b.per)}，` : ''}${modTxt(scaleMod(b, t))}`;
      g.set(txt, [...(g.get(txt) || []), tagTxt(b.tag)]);
    }
    for (const [txt, tags] of g) out.push(`${n}${tags.join('、')}：${txt}`);
  }
  if (it.tf) out.push(tfTxt(it.tf, t));
  /* 0.1.100 巨人國的改造工具 */
  if (it.mod) out.push(MOD_TXT[it.mod], '每件道具只能改造一次');
  /* 0.1.62 主題池的專屬道具 */
  /* 0.1.93 只加在這件身上的都寫「這件：（條件，）效果」；前面已經有「命中時：」，這裡不再寫一次 */
  const selfT = m => modTxt(scaleMod(m, t)).replace(/(^|、)命中時/g, '$1');
  if (it.self) out.push(`這件：${selfT(it.self)}`);
  if (it.perAdj) out.push(`這件：每有 1 件相鄰的道具，${selfT(it.perAdj)}`);
  if (it.perAdjF) out.push(`每有 1 件相鄰的道具，${modTxt(scaleMod(it.perAdjF, t))}`);
  if (it.hole) out.push(`凹口裡的${HOLE_N[it.hole.tag] || '道具'}：${modTxt(scaleMod(it.hole, t))}`);
  if (it.nth) out.push(`每第 ${it.nth[0]} 次出手，多打 ${it.nth[1]} 下`);
  if (it.wake) out.push(`開戰 ${it.wake} 秒後才開始出手`);
  if (it.gear) out.push(`相鄰的武器出手時，其他相鄰的武器充能 +${gearV(it, t)}%`);
  if (it.chainAdj) out.push('相鄰的武器出手時，帶動另一件相鄰的武器出手（每件每秒最多一次）');
  /* 0.1.69 棋盤王國、黃道十二宮 */
  if (it.pc) out.push(`棋子：${PC_TXT[it.pc.k]}${modTxt(scaleMod(it.pc.m, t))}`);
  if (it.pcHit) out.push(`這件：每被 1 個棋子影響，${selfT(it.pcHit)}`);
  if (it.synPer) out.push(`這件：每在 1 條星河裡，${selfT(it.synPer)}`);
  if (it.zod) {
    const Z = ZODS[it.zod];
    /* 0.1.96 星河的規則放百科（CX_STAT 的星河）；這裡只寫這個星座給河裡道具的效果 */
    out.push(
      `星座：跟同一排或同一行最近的星座連成星河，河裡的道具${Z.d}${t > 1 ? `（Ⅱ 階起效果 ×${zodMul(t)}）` : ''}`
    );
  }

  /* 0.1.33 核心的特殊效果（fxPer 寫在角色加成後面：「護甲 +20、開戰時有 10 護盾；背包裡每有 1 件矛，開戰護盾再 +10」） */
  if (it.shrink) out.push(`所有${tagTxt(it.shrink)}武器少佔 1 格`);
  if (it.eliteAll)
    out.push(
      `打贏菁英時，三選一的三件都是${[it.eliteAll].flat().map(tagTxt).join('或')}${it.eliteT ? `，而且必定是 ${'Ⅰ Ⅱ Ⅲ'.split(' ')[it.eliteT - 1]} 階` : ''}`
    );
  /* 0.1.35 浪人、商人的核心 */
  if (it.merge2) out.push(`${tagTxt(it.merge2)}只要 2 件一樣的就能合成升階（本來要 3 件）`);
  if (it.give)
    out.push(
      `拿到時送${ITEMI[it.give].tags.includes('pet') ? '一隻' : ITEMI[it.give].dmg ? '一把' : '一件'} ${ITEMI[it.give].star}★ ${ITEMI[it.give].n}`
    );
  if (it.coin) out.push('開戰時身上有金幣：每次攻擊花 1 金，傷害、暴擊率、命中效果翻倍');
  if (it.absorb)
    out.push(
      `貼在旁邊的${[it.absorb].flat().map(tagTxt).join('、')}會被吸收（那件消失），加上它的傷害、暴擊率、命中效果、詞綴與融合的效果（可以一直變強）`
    );
  if (it.gain) out.push(`拿到時立刻獲得 ${it.gain} 金`);
  if (it.goldSt)
    out.push(
      `每回合 +${it.goldSt[0][1]} 金${it.goldSt
        .slice(1)
        .map(([st, g]) => `、第 ${st} 階段起 +${g} 金`)
        .join('')}`
    );
  if (it.rich && !it.richX) out.push(`開戰時身上的金幣越多越強（到哪一級就用那一級）：${RICHN.join('；')}`);
  if (it.lotto) out.push('每回合第一次的商店價格打亂（0 金到 5★ 的價格都有可能），而且更常出高星級');
  if (it.early) out.push('合成到 Ⅱ 階就開一條隨機詞綴（本來要 Ⅲ 階）');
  if (it.lvOff) out.push(`背包升級費用 -${it.lvOff}%`);
  if (it.kick) out.push(`每買 ${it.kick} 次送一次菁英三選一（拿到的道具賣價 0 金）`);
  if (it.rollCap) out.push(`每回合最多只能刷新商店 ${it.rollCap} 次`);
  /* 0.1.37 異常重製的核心與道具 */
  for (const k in it.pres || {}) if (PREN[k]) out.push(PREN[k](it.pres[k], it.selfN));
  /* 陷阱：[名字, 觸發時做什麼] */
  const TRN = {
    ignite: ['點燃陷阱', '敵人被點燃（燃燒不退反增、傷害 ×1.5）'],
    bomb: ['藥劑炸彈', `敵人受 ${BOMB_DMG[0]}～${BOMB_DMG[1]} 固定傷害、流血 ${BOMB_BLEED} 層`],
    spore: ['劇毒孢子', '敵人中毒 +3 層、劇毒 +3 層'],
    icicle: ['冰錐', '凍結觸發的那件道具'],
    /* 0.1.50 弓箭手、亞馬遜的陷阱 */
    snare: ['捕獸夾', `那次出手落空、敵人流血 ${SNARE_BLEED} 層（夾 ${SNARE_N} 次後壞掉）`],
    net: ['獵網', `敵人暈眩 ${NET_STUN} 秒`],
    stake: ['尖樁', `敵人受 ${STAKE_DMG} 固定傷害、破甲 ${STAKE_SUNDER}、撕裂 ${STAKE_REND} 層`],
    /* 0.1.51 雷法師的陷阱 */
    shock: ['電網', `敵人麻痺 ${SHOCK_PARA} 層、電荷 +${SHOCK_CHG}`]
  };
  for (const tp of it.traps || [])
    out.push(
      `開戰時在敵人背包隨機放 ${tp.n} 個${tp.sz > 1 ? ` ${tp.sz} 格` : ''}${TRN[tp.k][0]}：那格的道具每次出手都觸發，${TRN[tp.k][1]}`
    );
  if (it.phase) {
    const f = x =>
      [
        x.dmgPct && `傷害 ${sg(x.dmgPct)}${x.dmgPct}%`,
        x.spd && `攻速 ${sg(x.spd)}${x.spd}%`,
        x.crit && `暴擊率 ${sg(x.crit)}${x.crit}%`,
        x.age && '衰老（不能暴擊）'
      ]
        .filter(Boolean)
        .join('、');
    out.push(`開戰 ${it.phase.t} 秒內所有武器${f(it.phase.a)}；之後${f(it.phase.b)}`);
  }
  if (it.potBuff)
    out.push(
      `生命藥水每次喝下：獲得 ${it.potBuff[0]} 護盾、${it.potBuff[1]} 秒內傷害 +${it.potBuff[2]}%、攻速 +${it.potBuff[3]}%`
    );
  if (it.brew)
    out.push(`拿到時連續 ${it.brew} 次三選一藥劑效果，煉成一瓶 1 格「終極藥劑」（生命低於 50% 喝，可以喝 2 次）`);
  if (it.earlyPot) out.push('生命藥水合成到 Ⅱ 階就開一條隨機詞綴');
  if (it.hatch) out.push(`拿到後過 ${SEAL_RC} 回合變成「${ITEMI[it.hatch].n}」`);
  if (it.iceHp) out.push(`每場自己觸發一次凍結或冰緩，最大生命 +${it.iceHp}（一直累積）`);
  if (it.imm) out.push('免疫所有異常與封鎖');
  if (it.chainN && it.dmg) out.push(MODN.chainN(it.chainN));
  if (it.stick) out.push(MODN.stick(it.stick) + '（再加上職業的插箭）');
  /* 0.1.53 遠古之器、四兇 */
  if (it.sacrifice)
    out.push(
      `點這件可以獻祭背包或暫存區的寵物：每累積 ${VESSEL_N} 星，召喚一隻隨機四兇（饕餮、窮奇、檮杌、混沌，先給還沒有的）`
    );
  if (it.gorge) out.push(`吞噬：每命中一次這隻的傷害 +${it.gorge}%（這場累積，最多 +${GORGE_MAX}%）`);
  if (it.sealHit) out.push(`命中時 ${it.sealHit[0]}% 機率封鎖敵人一把武器 ${it.sealHit[1]} 秒`);
  if (it.chaos) out.push('命中時隨機附加一種：燃燒 3 層、中毒 3 層、流血 4 層、虛弱、致盲、混亂 1 秒');
  if (it.capture) out.push(`打贏野怪、菁英時 ${it.capture}% 機率捕獲一隻寵物（星級照現在商店最高的，首領不行）`);
  if (it.evolve) out.push(`寵物在背包裡每待滿 ${it.evolve} 回合，自動升一階（最多 Ⅲ 階）`);
  /* 0.1.101 覺醒／質變 */
  if (it.kitePer) out.push(`背包裡每有 1 件有閃避的道具，閃避時的充能再 +${it.kitePer}%（最多 +60%）`);
  if (it.perBlade)
    out.push(`背包裡每有 1 件劍或矛，連擊機率 +${it.perBlade}%（最多 +40%）、連鎖追擊機率 +2%（最多 +16%）`);
  if (it.iai) out.push(`劍、矛每第 ${it.iai[0]} 次出手，多打 ${it.iai[1]} 下`);
  if (it.revShield) out.push(`背包裡每有 1 面盾，復活的生命 +${it.revShield}%`);
  if (it.valhalla) out.push('復活時對敵人造成「所有盾的格擋值總和」傷害');
  if (it.bladeDrv) out.push('匕首出手時，帶動一把相鄰的匕首跟著出手（每把每秒一次）');
  if (it.iceBlk) out.push(`背包裡每有 1 件冰系道具，開戰護盾 +${it.iceBlk}`);
  if (it.thPer) out.push('背包裡每有 1 件毒系道具，反彈時讓攻擊者多中毒 1 層');
  if (it.armPer) out.push(`背包裡每有 1 件防具或盾，護甲 +${it.armPer}`);
  if (it.armTh) out.push(`沒有護甲：護甲的 ${it.armTh}% 改成加進反彈的傷害`);
  if (it.chainPer) out.push(`背包裡每有 1 件雷系道具，連鎖的傷害 +${it.chainPer}%`);
  if (it.chainChg) out.push('連鎖每多打一下，敵人電荷 +1');
  if (it.conduct) out.push(`雷系武器旁邊的其他武器：命中時電荷 +1、傷害 +${it.conduct}%`);
  if (it.potAdj) out.push('喝藥水時，相鄰的武器馬上出手一次');
  if (it.potThrow)
    out.push(
      `生命藥水不喝了：開戰 2 秒起每 3 秒丟向敵人一次（次數跟能喝的一樣），造成回復量 ${it.potThrow}% 的傷害、敵人中毒 +3 層`
    );
  if (it.richX)
    out.push(
      `開戰時身上的金幣越多越強（效果跟鈔能力一樣），門檻改成 ${RICH.map(([n]) => (n < 120 ? n + 10 : n)).join('／')} 金；120 金以上每多 20 金再升一級（所有武器傷害、攻速各 +5%，最多 10 級）`
    );
  if (it.spendUp) out.push(`拿到後買東西每淨花 ${it.spendUp} 金，所有武器傷害 +1%（整局累積，賣掉會扣回）`);
  if (it.fitPet) out.push(`Ⅲ 階的寵物傷害 +${it.fitPet}%`);
  if (it.mutate) out.push('每回合開始：沒有詞綴的寵物開一條詞綴，再隨機挑一隻還沒有 5★ 詞綴的寵物開一條');
  if (it.sisters)
    out.push(`背包裡矛和弓、弩一樣多（至少各 1 件）時，所有武器傷害 +${it.sisters[0]}%、攻速 +${it.sisters[1]}%`);
  if (it.defX) out.push(`所有防具、盾的效果 ×${it.defX}`);
  if (it.bribe) out.push(`開戰時金幣超過 ${it.bribe} 金就花 ${it.bribe} 金，整場封鎖敵人星級最高的武器`);
  if (it.gift) out.push(`拿到時送 ${it.gift[2]} 隻隨機 ${it.gift[0]}★ ${tagTxt(it.gift[1])}`);
  if (it.freeRoll) out.push(`每回合可以免費刷新商店 ${it.freeRoll} 次`);
  if (it.fx) {
    const f = fxT(it, t),
      rest = Object.fromEntries(Object.entries(f).filter(([k]) => MODN[k] && k !== 'potMul' && k !== 'potUse'));
    if (Object.keys(rest).length) out.push(modTxt(rest));
    if (f.take) out.push(`受到的攻擊傷害 +${f.take}%`);
    if (f.potMul) out.push(`藥水回復 +${f.potMul}%${f.potUse ? `、多喝 ${f.potUse} 次` : ''}`);
    else if (f.potUse) out.push(`生命藥水多喝 ${f.potUse} 次`);
  }
  for (const b of it.fxPer || [])
    out.push(
      `背包裡每有 1 件${tagTxt(b.tag)}，${Object.entries(b)
        .filter(([k]) => k !== 'tag')
        .map(([k, v]) => (k === 'startBlock' ? `開戰護盾再 +${v}` : MODN[k] ? MODN[k](v) : ''))
        .filter(Boolean)
        .join('、')}`
    );
  if (it.rush) out.push(`開戰後 ${it.rush[1]} 秒內所有武器攻速 +${Math.round(it.rush[0] * TIERB[t])}%`);
  if (it.gold) out.push(`放在背包裡每回合 +${it.gold} 金（每升一階 +1）`);
  if (it.pre) out.push(preTxt(id, t));
  return joinTxt(out, '；');
}
/* 0.1.28 融合的說明：放到○○上融合成「前綴・○○」 */
function tfTxt(T, t = 1) {
  const m = modTxt(scaleMod(T.m, t)),
    add = (T.add || []).map(x => TAGN[x]).join('、');
  /* 0.1.74 寫短：融合怎麼運作（這件消失、空出格子、一件只能融合一次）寫在百科的「融合」 */
  return `貼在${tagTxt(T.tag)}旁邊融合成「${T.n}・${tagTxt(T.tag)}」：${add ? `變成${add}系、` : ''}${m}`;
}
/* 加成照階數放大（per、tag 不動） */
/* 0.1.69 齒輪的充能 %：寫陣列的照階數拿，不然照百分比的升階倍率 */
const gearV = (it, t = 1) => (Array.isArray(it.gear) ? it.gear[t - 1] : Math.round(it.gear * TIERB[t]));
function scaleMod(b, t) {
  const o = {};
  for (const k in b) o[k] = k === 'tag' || k === 'per' ? b[k] : Math.round(b[k] * TIERB[t]);
  return o;
}
