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
  ]
};
/* 標籤的中文 */
const TAGN = {
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
  holy: '聖'
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
    adj: [{ tag: 'weapon', crit: 15 }],
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
    adj: [{ tag: 'weapon', dmgPct: 30, spd: -10 }],
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
    sh: 'z4',
    tags: ['trinket'],
    for: 'sword',
    adj: [{ tag: 'weapon', bleed: 1 }],
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
    adj: [{ tag: 'weapon', weakCh: 15 }],
    ic: 'a:m_paperdoll'
  },
  {
    id: 'holymirror',
    n: '八卦鏡',
    star: 3,
    sh: 's1',
    tags: ['trinket', 'holy'],
    adj: [{ tag: 'weapon', blindCh: 12 }],
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
    sh: 'x5',
    tags: ['trinket'],
    for: 'staff',
    all: [{ tag: 'staff', dmgPct: 25 }],
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
    sh: 'sq',
    tags: ['trinket', 'dark'],
    for: 'dark',
    all: [{ tag: 'dark', dmgPct: 20, ls: 5 }],
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
    for: 'fire',
    all: [{ tag: 'fire', dmgPct: 20 }],
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
    for: 'cold',
    all: [{ tag: 'cold', dmgPct: 20 }],
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
  }
];
const ITEMI = Object.fromEntries(ITEMS.map(it => [it.id, it]));
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
    m: [
      { tag: 'bow', dmgPct: 25, spd: 20 },
      { tag: 'xbow', dmgPct: 25, spd: 20 }
    ]
  },
  {
    id: 'swordsman',
    st: 'woodsword',
    n: '劍士',
    ic: 'sk_swordwave',
    th: 'sword',
    m: [{ tag: 'sword', dmgPct: 35, crit: 15, bleed: 2 }]
  },
  {
    id: 'berserker',
    st: 'club',
    n: '狂戰士',
    ic: 'sk_rage',
    th: 'mace',
    m: [
      { tag: 'axe', dmgPct: 25, spd: 10, sunder: 1 },
      { tag: 'mace', dmgPct: 25, spd: 10, sunder: 1 }
    ]
  },
  {
    id: 'spearman',
    st: 'woodspear',
    n: '槍兵',
    ic: 'sk_spearrush',
    th: 'spear',
    m: [{ tag: 'spear', dmgPct: 30, spd: 10 }],
    F: { arm: 5 }
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
      { tag: 'fire', burn: 2, dmgPct: 15 },
      { tag: 'staff', dmgPct: 15 }
    ]
  },
  {
    id: 'cryo',
    st: 'frostwand',
    n: '冰法師',
    ic: 'sk_frostnova',
    th: 'cold',
    m: [
      { tag: 'cold', freezeCh: 20, dmgPct: 15 },
      { tag: 'staff', spd: 20 }
    ]
  },
  {
    id: 'storm',
    st: 'sparkrod',
    n: '雷法師',
    ic: 'sk_chainlight',
    th: 'light',
    m: [{ tag: 'light', stunCh: 15, dmgPct: 35 }]
  },
  {
    id: 'venom',
    st: 'needle',
    n: '毒師',
    ic: 'sk_poison',
    th: 'poison',
    m: [
      { tag: 'poison', poison: 1, dmgPct: 10 },
      { tag: 'dagger', poison: 1 }
    ]
  },
  { id: 'tamer', st: 'treefrog', n: '馴獸師', ic: 'sk_tauntroar', th: 'pet', m: [{ tag: 'pet', dmgPct: 50, spd: 25 }] },
  {
    id: 'knight',
    st: 'woodshield',
    n: '騎士',
    ic: 'sk_shieldwall',
    th: 'shield',
    m: [{ tag: 'shield', blockPct: 40 }],
    F: { hp: 20 }
  },
  {
    id: 'alchemist',
    st: 'potion',
    n: '鍊金術士',
    ic: 'cur_vaal',
    th: 'potion',
    F: { potMul: 20, throwPct: 25 }
  },
  { id: 'merchant', st: 'purse', n: '商人', ic: 'cur_regal', gold: 1 }
];
const CLSI = Object.fromEntries(CLASSES.map(c => [c.id, c]));
/* 0.1.10 職業核心兩次：2-5 首領掉「專屬核心」（每個職業 12 個、各有特色），4-4 首領掉「副核心」（照模板對主打標籤加成，12 個）。
   背包裡專屬核心、副核心各最多 1 個。P 是那個職業主打的標籤 */
const CORE_P = {
  archer: ['bow', 'xbow'],
  swordsman: ['sword'],
  berserker: ['axe', 'mace'],
  spearman: ['spear'],
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
  archer: P => [
    ['連珠箭', { all: onP(P, { spd: 25 }), fx: { double: 15 } }],
    ['穿雲箭', { all: onP(P, { dmgPct: 30, crit: 10 }) }],
    ['先手射擊', { all: onP(P, { dmgPct: 15 }), fx: { opener: 90 } }],
    ['狙擊', { all: onP(P, { crit: 15 }), fx: { execute: 60 } }],
    ['火箭', { all: onP(P, { burn: 2, dmgPct: 10 }) }],
    ['毒箭', { all: onP(P, { poison: 2, dmgPct: 10 }) }],
    ['鷹眼', { all: onP(P, { crit: 20 }), fx: { critMul: 40 } }],
    ['箭雨', { all: onP(P, { dmgPct: 8, per: 'bow' }) }],
    ['游擊', { all: onP(P, { spd: 15 }), fx: { dodge: 15 } }],
    ['閃光箭', { all: onP(P, { blindCh: 20, dmgPct: 10 }) }],
    ['連射', { all: onP(P, { spd: 10 }), fx: { ramp: 8 } }],
    ['獵人陷阱', { all: onP(P, { bleed: 1 }), pre: { bleed: 6 } }]
  ],
  swordsman: P => [
    ['劍意', { all: onP(P, { dmgPct: 35 }) }],
    ['拔刀術', { all: onP(P, { crit: 15 }), fx: { opener: 100 } }],
    ['血劍', { all: onP(P, { bleed: 2, ls: 10 }) }],
    ['斬殺', { all: onP(P, { dmgPct: 10 }), fx: { execute: 70 } }],
    ['招架', { all: onP(P, { dmgPct: 15 }), fx: { startBlock: 30 } }],
    ['連斬', { all: onP(P, { dmgPct: 10 }), fx: { double: 20 } }],
    ['劍心', { all: onP(P, { crit: 20 }), fx: { critMul: 50 } }],
    ['背水', { all: onP(P, { spd: 10 }), fx: { rage: 50 } }],
    ['雙手大師', { all: [{ tag: 'twohand', dmgPct: 40, spd: 10 }] }],
    ['劍陣', { all: onP(P, { dmgPct: 10, per: 'sword' }) }],
    ['破甲斬', { all: onP(P, { sunder: 2, dmgPct: 10 }) }],
    ['劍舞', { all: onP(P, { dmgPct: 10 }), fx: { ramp: 10 } }]
  ],
  berserker: P => [
    ['狂怒', { all: onP(P, { dmgPct: 15 }), fx: { rage: 60 } }],
    ['血腥風暴', { all: onP(P, { bleed: 2, spd: 15 }) }],
    ['碎骨', { all: onP(P, { sunder: 3, dmgPct: 10 }) }],
    ['越戰越勇', { all: onP(P, { dmgPct: 10 }), fx: { ramp: 12 } }],
    ['嗜血', { all: onP(P, { ls: 20 }) }],
    ['震地', { all: onP(P, { stunCh: 15, dmgPct: 15 }) }],
    ['不屈', { fx: { hp: 80, regen: 2 } }],
    ['處刑', { all: onP(P, { dmgPct: 10 }), fx: { execute: 60 } }],
    ['野蠻衝鋒', { all: onP(P, { dmgPct: 20 }), fx: { opener: 80 } }],
    ['血怒', { all: onP(P, { crit: 10 }), fx: { rage: 30, critHeal: 6 } }],
    ['巨力', { all: [{ tag: 'twohand', dmgPct: 40 }] }],
    ['尖刺皮膚', { fx: { thornsF: 4, arm: 5 } }]
  ],
  spearman: P => [
    ['突刺', { all: onP(P, { dmgPct: 35 }) }],
    ['方陣', { fx: { arm: 10, startBlock: 20 } }],
    ['貫穿', { all: onP(P, { sunder: 2, crit: 10 }) }],
    ['槍林', { all: onP(P, { spd: 25 }) }],
    ['衝鋒', { all: onP(P, { dmgPct: 15 }), fx: { opener: 100 } }],
    ['放血', { all: onP(P, { bleed: 2, dmgPct: 10 }) }],
    ['反擊', { all: onP(P, { dmgPct: 10 }), fx: { thornsF: 5 } }],
    ['致命一擊', { all: onP(P, { crit: 20 }), fx: { critMul: 40 } }],
    ['連刺', { all: onP(P, { dmgPct: 10 }), fx: { double: 18 } }],
    ['長柄大師', { all: [{ tag: 'twohand', dmgPct: 35, spd: 10 }] }],
    ['戰意', { fx: { ramp: 8, hp: 30 } }],
    ['處決', { all: onP(P, { dmgPct: 10 }), fx: { execute: 60 } }]
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
  pyro: P => [
    ['烈焰', { all: onP(P, { burn: 3 }) }],
    ['焚身', { all: onP(P, { dmgPct: 10 }), pre: { burn: 6 } }],
    ['炎爆', { all: onP(P, { dmgPct: 35 }) }],
    ['灰燼', { all: onP(P, { burn: 1 }), fx: { execute: 50 } }],
    ['火牆', { fx: { startBlock: 25, thornsF: 3 } }],
    ['燎原', { all: onP(P, { burn: 1, per: 'fire' }) }],
    ['鳳凰', { fx: { regen: 4, hp: 40 } }],
    ['狂焰', { all: onP(P, { spd: 10 }), fx: { ramp: 10 } }],
    ['火雨', { all: onP(P, { dmgPct: 10 }), fx: { double: 15 } }],
    ['熔甲', { all: onP(P, { sunder: 2, burn: 1 }) }],
    ['炙熱', { all: onP(P, { crit: 15 }), fx: { critMul: 40 } }],
    ['火焰護體', { fx: { thornsF: 6, hp: 20 } }]
  ],
  cryo: P => [
    ['寒霜', { all: onP(P, { freezeCh: 20 }) }],
    ['冰封', { all: onP(P, { dmgPct: 10 }), pre: { frozen: 4 } }],
    ['冰錐', { all: onP(P, { dmgPct: 35 }) }],
    ['碎冰', { all: onP(P, { freezeCh: 10 }), fx: { execute: 60 } }],
    ['冰甲', { fx: { arm: 10, startBlock: 25 } }],
    ['暴風雪', { all: onP(P, { spd: 25 }) }],
    ['冰晶共鳴', { all: onP(P, { dmgPct: 10, per: 'cold' }) }],
    ['凍傷', { all: onP(P, { bleed: 2, dmgPct: 10 }) }],
    ['寒冰之心', { fx: { regen: 3, hp: 40 } }],
    ['冰刃', { all: onP(P, { crit: 20 }), fx: { critMul: 30 } }],
    ['霜凍連擊', { all: onP(P, { dmgPct: 10 }), fx: { double: 18 } }],
    ['永凍', { all: onP(P, { weakCh: 20, freezeCh: 10 }) }]
  ],
  storm: P => [
    ['雷鳴', { all: onP(P, { stunCh: 15, dmgPct: 10 }) }],
    ['落雷', { all: onP(P, { dmgPct: 35 }) }],
    ['雷暴', { all: onP(P, { dmgPct: 10 }), fx: { double: 20 } }],
    ['閃電鏈', { all: onP(P, { dmgPct: 10, per: 'light' }) }],
    ['電光', { all: onP(P, { blindCh: 15 }), pre: { blind: 4 } }],
    ['雷神', { all: onP(P, { crit: 20 }), fx: { critMul: 40 } }],
    ['超載', { all: onP(P, { dmgPct: 10 }), fx: { ramp: 12 } }],
    ['靜電場', { fx: { thornsF: 5, startBlock: 15 } }],
    ['雷擊', { all: onP(P, { stunCh: 5 }), fx: { opener: 100 } }],
    ['天譴', { all: onP(P, { dmgPct: 10 }), fx: { execute: 70 } }],
    ['疾雷', { all: onP(P, { spd: 25 }) }],
    ['電磁破甲', { all: onP(P, { sunder: 2, dmgPct: 10 }) }]
  ],
  venom: P => [
    ['劇毒', { all: onP(P, { poison: 3 }) }],
    ['瘟疫', { all: onP(P, { dmgPct: 10 }), pre: { poison: 5 } }],
    ['毒霧', { all: onP(P, { weakCh: 10 }), pre: { weak: 4 } }],
    ['腐蝕', { all: onP(P, { sunder: 2, poison: 1 }) }],
    ['毒液噴濺', { all: onP(P, { poison: 1, per: 'poison' }) }],
    ['蛇吻', { all: onP(P, { dmgPct: 10 }), fx: { double: 18 } }],
    ['致命毒素', { all: onP(P, { dmgPct: 10 }), fx: { execute: 60 } }],
    ['毒囊', { fx: { hp: 50, regen: 2 } }],
    ['毒刺皮膚', { fx: { thornsF: 5, hp: 20 } }],
    ['麻痺毒', { all: onP(P, { stunCh: 10, poison: 1 }) }],
    ['血毒', { all: onP(P, { bleed: 2, poison: 1 }) }],
    ['疾毒', { all: onP(P, { spd: 25 }) }]
  ],
  tamer: P => [
    ['獸群', { all: onP(P, { dmgPct: 10, per: 'pet' }) }],
    ['野性', { all: onP(P, { dmgPct: 35 }) }],
    ['狂奔', { all: onP(P, { spd: 30 }) }],
    ['撕咬', { all: onP(P, { bleed: 2, dmgPct: 10 }) }],
    ['守護獸', { fx: { startBlock: 25, hp: 40 } }],
    ['獸王之怒', { all: onP(P, { dmgPct: 10 }), fx: { rage: 50 } }],
    ['獵殺', { all: onP(P, { dmgPct: 10 }), fx: { execute: 60 } }],
    ['群獵', { all: onP(P, { dmgPct: 10 }), fx: { double: 15 } }],
    ['野獸本能', { all: onP(P, { crit: 15 }), fx: { opener: 80 } }],
    ['血脈', { all: onP(P, { ls: 15, dmgPct: 10 }) }],
    ['獸牙', { all: onP(P, { sunder: 2, dmgPct: 10 }) }],
    ['共生', { fx: { regen: 4, hp: 20 } }]
  ],
  knight: P => [
    ['聖盾', { all: [{ tag: 'shield', blockPct: 60 }] }],
    ['堡壘', { all: [{ tag: 'shield', block: 10 }], fx: { hp: 40 } }],
    ['盾擊', { fx: { thornsF: 6, arm: 4 } }],
    ['起手盾', { fx: { startBlock: 40 } }],
    ['鐵壁', { fx: { arm: 14 } }],
    ['聖光', { all: onP(P, { blindCh: 15 }), fx: { regen: 2 } }],
    ['不動如山', { fx: { hp: 100 } }],
    ['審判', { all: onP(P, { dmgPct: 10 }), fx: { execute: 50 } }],
    ['守護誓約', { all: [{ tag: 'shield', spd: 30 }] }],
    ['復仇', { fx: { rage: 40, thornsF: 3 } }],
    ['騎士精神', { all: onP(P, { dmgPct: 20, spd: 10 }) }],
    ['盾牆', { all: [{ tag: 'shield', blockPct: 15, per: 'shield' }] }]
  ],
  alchemist: P => [
    ['煉成', { fx: { throwPct: 80, potMul: 30 } }],
    ['萬能藥', { fx: { potMul: 60, potUse: 1 } }],
    ['劇毒煉金', { fx: { throwPct: 30 }, pre: { poison: 4 } }],
    ['爆裂藥劑', { fx: { throwPct: 20 }, pre: { burn: 6 } }],
    ['腐蝕藥劑', { fx: { throwPct: 20 }, pre: { sunder: 8 } }],
    ['迷霧藥劑', { fx: { throwPct: 20 }, pre: { blind: 5 } }],
    ['衰弱藥劑', { fx: { throwPct: 20 }, pre: { weak: 5 } }],
    ['冰凍藥劑', { fx: { throwPct: 20 }, pre: { frozen: 4 } }],
    ['再生藥劑', { fx: { regen: 5 } }],
    ['鋼鐵藥劑', { fx: { arm: 10, startBlock: 20 } }],
    ['狂暴藥劑', { all: onP(P, { spd: 25 }) }],
    ['賢者之石', { gold: 2, fx: { throwPct: 40 } }]
  ],
  merchant: P => [
    ['財神', { gold: 3 }],
    ['大富翁', { gold: 2, all: onP(P, { dmgPct: 10 }) }],
    ['投資', { gold: 1, fx: { hp: 40 } }],
    ['傭兵', { all: onP(P, { dmgPct: 25 }) }],
    ['黃金甲', { gold: 1, fx: { arm: 10 } }],
    ['精品', { all: onP(P, { crit: 15 }), fx: { critMul: 30 } }],
    ['賄賂', { all: onP(P, { dmgPct: 10 }), pre: { seal: 5 } }],
    ['搶先', { all: onP(P, { spd: 10 }), fx: { opener: 100 } }],
    ['回扣', { gold: 1, fx: { regen: 3 } }],
    ['奸商', { gold: 1, pre: { down: 1 } }],
    ['保鏢', { fx: { startBlock: 30, thornsF: 3 } }],
    ['豪賭', { fx: { rage: 50, execute: 40 } }]
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
function genCores() {
  const out = [];
  for (const C of CLASSES) {
    const P = CORE_P[C.id] || ['weapon'];
    CORE_MAIN[C.id](P).forEach(([n, d], k) =>
      out.push({
        id: `c_${C.id}_${k}`,
        n: `${C.n}・${n}`,
        star: 5,
        core: 1,
        cls: C.id,
        sh: ['s1', 'v2', 'h2'][k % 3],
        tags: ['core'],
        ic: C.ic,
        ...d
      })
    );
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
  if (c.gold) out.push(`每回合 +${c.gold} 金（沒有戰鬥加成）`);
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
    stun: o.stun ? [ch(o.stun[0]), o.stun[1]] : null
  };
}
/* 星級顏色：CSS 變數（跟著淺色／深色主題變） */
const STARC = ['', 'var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)'];
/* 價格：星級；賣出：退一半（升階的照材料數） */
const priceOf = id => ITEMI[id].star;
const sellOf = (id, t = 1) => Math.max(1, Math.ceil((ITEMI[id].star * 3 ** (t - 1)) / 2));
/* 形狀旋轉 r 次（90°），回傳從 0 開始的格子 */
function shapeOf(id, rot = 0) {
  let c = SH[ITEMI[id].sh].map(p => [...p]);
  for (let i = 0; i < (rot & 3); i++) c = c.map(([x, y]) => [-y, x]);
  const mx = Math.min(...c.map(p => p[0])),
    my = Math.min(...c.map(p => p[1]));
  return c.map(([x, y]) => [x - mx, y - my]);
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
const MODN = {
  dmg: v => `傷害 ${sg(v)}${v}`,
  dmgPct: v => `傷害 ${sg(v)}${pct(v)}`,
  spd: v => `攻速 ${sg(v)}${pct(v)}`,
  crit: v => `暴擊率 ${sg(v)}${pct(v)}`,
  burn: v => `命中燃燒 ${sg(v)}${v}`,
  poison: v => `命中中毒 ${sg(v)}${v}`,
  ls: v => `吸血 ${pct(v)}`,
  block: v => `格擋 ${sg(v)}${v}`,
  blockPct: v => `格擋 ${sg(v)}${pct(v)}`,
  freezeCh: v => `命中時凍結機率 ${sg(v)}${pct(v)}`,
  stunCh: v => `命中時暈眩機率 ${sg(v)}${pct(v)}`,
  regen: v => `每秒回復 ${sg(v)}${v}`,
  hp: v => `生命 ${sg(v)}${v}`,
  arm: v => `護甲 ${sg(v)}${v}`,
  dodge: v => `閃避 ${sg(v)}${pct(v)}`,
  critMul: v => `暴擊傷害 ${sg(v)}${pct(v)}`,
  bleed: v => `命中流血 ${sg(v)}${v}`,
  sunder: v => `命中破甲 ${sg(v)}${v}`,
  weakCh: v => `命中時虛弱機率 ${sg(v)}${pct(v)}`,
  blindCh: v => `命中時致盲機率 ${sg(v)}${pct(v)}`,
  throwPct: v => `丟出的藥劑效果 ${sg(v)}${pct(v)}`,
  opener: v => `開戰時武器先充能 ${pct(v)}`,
  execute: v => `對生命低於 30% 的敵人傷害 +${pct(v)}`,
  rage: v => `自己生命低於 50% 時傷害 +${pct(v)}`,
  ramp: v => `每 5 秒攻速 +${pct(v)}（最多 5 次）`,
  startBlock: v => `開戰時有 ${v} 護盾`,
  double: v => `${pct(v)} 機率連擊`,
  thornsF: v => `被打中時反彈 ${v}`,
  critHeal: v => `暴擊時回復 ${v}`
};
const modTxt = m =>
  Object.entries(m)
    .filter(([k]) => MODN[k])
    .map(([k, v]) => MODN[k](v))
    .join('、');
const tagTxt = t => (t === 'weapon' ? '武器' : t === '*' ? '道具' : TAGN[t] || t);
/* 0.1.6 開戰前的特殊效果（越強越稀有）：seal 封鎖敵人隨機一把武器 N 秒（每升一階 +1 秒）、down 敵人隨機一把武器降 1 階（最低 Ⅰ 階） */
/* 0.1.9 擴充成各種開戰效果（藥劑丟出去）：秒數類每升一階 +1 秒，層數類照升階倍率 */
const PRE_T = ['seal', 'weak', 'blind', 'frozen'],
  PREN = {
    seal: v => `開戰時封鎖敵人隨機一把武器 ${v} 秒`,
    down: () => '開戰時把敵人隨機一把武器降 1 階（最低 Ⅰ 階）',
    weak: v => `開戰時讓敵人虛弱 ${v} 秒（傷害 -25%）`,
    blind: v => `開戰時讓敵人致盲 ${v} 秒（30% 打不中）`,
    frozen: v => `開戰時凍結敵人 ${v} 秒（攻速減半）`,
    burn: v => `開戰時讓敵人燃燒 ${v} 層`,
    poison: v => `開戰時讓敵人中毒 ${v} 層`,
    bleed: v => `開戰時讓敵人流血 ${v} 層`,
    sunder: v => `開戰時讓敵人破甲 ${v}`
  };
const preKey = p => Object.keys(p)[0];
const preVal = (id, t = 1) => {
  const p = ITEMI[id].pre;
  if (!p) return 0;
  const k = preKey(p),
    v = p[k];
  return k === 'down' ? 1 : PRE_T.includes(k) ? v + (t - 1) : Math.round(v * TIERM[t]);
};
function preTxt(id, t = 1) {
  const p = ITEMI[id].pre;
  return p ? PREN[preKey(p)](preVal(id, t)) : '';
}
function itemDesc(id, t = 1) {
  const it = ITEMI[id],
    k = TIERM[t],
    out = [];
  if (it.d) return [it.d, preTxt(id, t)].filter(Boolean).join('；');
  const o = onT(it, t);
  if (it.dmg) {
    const a = Math.round(it.dmg[0] * k),
      b = Math.round(it.dmg[1] * k);
    out.push(`每 ${cdT(it, t)} 秒造成 ${a}～${b} 傷害${o.crit ? `（暴擊 ${o.crit}%）` : ''}`);
  }
  if (it.on) {
    if (o.burn) out.push(`命中時讓敵人燃燒 ${o.burn} 層（每秒扣層數，每秒少 1 層）`);
    if (o.poison) out.push(`命中時讓敵人中毒 ${o.poison} 層（每秒扣層數，不會退，最多 12 層）`);
    if (o.freeze) out.push(`命中時 ${o.freeze[0]}% 機率凍結敵人 ${o.freeze[1]} 秒（攻速減半）`);
    if (o.stun) out.push(`命中時 ${o.stun[0]}% 機率暈眩敵人 ${o.stun[1]} 秒（不能動）`);
    if (o.ls) out.push(`吸血 ${o.ls}%`);
    if (o.bleed) out.push(`命中時讓敵人流血 ${o.bleed} 層（每秒扣層數，然後減半）`);
    if (o.sunder) out.push(`命中時讓敵人護甲 -${o.sunder}（會疊加）`);
    if (o.weak) out.push(`命中時 ${o.weak}% 機率讓敵人虛弱 3 秒（敵人傷害 -25%）`);
    if (o.blind) out.push(`命中時 ${o.blind}% 機率讓敵人致盲 2.5 秒（敵人 30% 打不中）`);
  }
  if (it.block)
    out.push(
      `每 ${cdT(it, t)} 秒格擋 ${Math.round(it.block * k)}${it.thorns ? `，格擋時反彈 ${it.thorns}` : ''}${it.heal ? `、回復 ${Math.round(it.heal * k)}` : ''}`
    );
  if (it.hp) out.push(`生命 +${Math.round(it.hp * k)}`);
  if (it.arm) out.push(`護甲 +${Math.round(it.arm * k)}`);
  if (it.dodge) out.push(`閃避 ${Math.round(it.dodge * TIERB[t])}%`);
  if (it.regen) out.push(`每秒回復 ${Math.round(it.regen * k)}`);
  if (it.pot)
    out.push(`生命低於 ${it.pot[0]}% 時回復 ${Math.round(it.pot[1] * k)}（${it.pot[2] + (t === 3 ? 1 : 0)} 次）`);
  for (const [w, n] of [
    ['adj', '相鄰的'],
    ['row', '同一排的'],
    ['all', '所有']
  ])
    for (const b of it[w] || [])
      out.push(`${n}${tagTxt(b.tag)}：${modTxt(scaleMod(b, t))}${b.per ? `（背包裡每有 1 件${tagTxt(b.per)}）` : ''}`);
  if (it.fx) {
    const f = fxT(it, t),
      rest = Object.fromEntries(Object.entries(f).filter(([k]) => MODN[k]));
    if (Object.keys(rest).length) out.push(modTxt(rest));
    if (f.take) out.push(`受到的傷害 +${f.take}%`);
    if (f.potMul) out.push(`藥水回復 +${f.potMul}%${f.potUse ? `、多喝 ${f.potUse} 次` : ''}`);
  }
  if (it.rush) out.push(`開戰後 ${it.rush[1]} 秒內所有武器攻速 +${Math.round(it.rush[0] * TIERB[t])}%`);
  if (it.gold) out.push(`放在背包裡每回合 +${it.gold} 金（每升一階 +1）`);
  if (it.pre) out.push(preTxt(id, t));
  return out.join('；');
}
/* 加成照階數放大（per、tag 不動） */
function scaleMod(b, t) {
  const o = {};
  for (const k in b) o[k] = k === 'tag' || k === 'per' ? b[k] : Math.round(b[k] * TIERB[t]);
  return o;
}
