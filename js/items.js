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
    n: '木劍',
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
    n: '木棒',
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
    n: '鐵劍',
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
    n: '火焰法杖',
    star: 2,
    sh: 'v3',
    tags: ['weapon', 'staff', 'fire'],
    cd: 1.7,
    dmg: [3, 5],
    on: { burn: 2 },
    ic: 'gear_weapon_4'
  },
  {
    id: 'icestaff',
    n: '冰霜法杖',
    star: 2,
    sh: 'v3',
    tags: ['weapon', 'staff', 'cold'],
    cd: 1.8,
    dmg: [3, 5],
    on: { freeze: [35, 1] },
    ic: 'gear_weapon_15'
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
    ic: 'gear_weapon_12'
  },
  {
    id: 'scythe',
    n: '吸血鐮刀',
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
    n: '屠龍大劍',
    star: 4,
    sh: 'big',
    tags: ['weapon', 'sword', 'twohand'],
    cd: 2,
    dmg: [12, 18],
    crit: 10,
    on: { bleed: 2 },
    ic: 'gear_weapon_5'
  },
  {
    id: 'phoenixbow',
    n: '鳳凰弓',
    star: 4,
    sh: 'v3',
    tags: ['weapon', 'bow', 'fire'],
    cd: 1.4,
    dmg: [6, 9],
    on: { burn: 3 },
    ic: 'gear_weapon_24'
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
    ic: 'gear_weapon_0'
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
    n: '破城鎬',
    star: 3,
    sh: 'v3',
    tags: ['weapon', 'mace', 'twohand'],
    cd: 2.2,
    dmg: [8, 12],
    on: { sunder: 3 },
    ic: 'gear_weapon_22'
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
    ic: 'gear_weapon_29'
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
    ic: 'sk_bash'
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
    ic: 'gear_weapon_17'
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
    ic: 'sk_crosscut'
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
    ic: 'sk_shadowbolt'
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
    ic: 'sk_smite'
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
    ic: 'gear_weapon_19'
  },
  {
    id: 'emberwand',
    n: '火苗短杖',
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
    n: '霜木杖',
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
    n: '電擊棒',
    star: 1,
    sh: 'v2',
    tags: ['weapon', 'mace', 'light'],
    cd: 1.5,
    dmg: [2, 3],
    on: { stun: [10, 0.4] },
    ic: 'unit_tesla'
  },
  {
    id: 'needle',
    n: '毒針',
    star: 1,
    sh: 's1',
    tags: ['weapon', 'dagger', 'poison'],
    cd: 1.2,
    dmg: [1, 1],
    on: { poison: 1 },
    ic: 'gear_weapon_18'
  },
  /* ---------- 0.1.8 各系的 5★ ---------- */
  {
    id: 'excalibur',
    n: '王者之劍',
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
    n: '落日神弓',
    star: 5,
    sh: 'v3',
    tags: ['weapon', 'bow', 'fire'],
    cd: 1.1,
    dmg: [10, 15],
    crit: 15,
    on: { burn: 2 },
    ic: 'gear_weapon_25'
  },
  {
    id: 'stormxbow',
    n: '暴風連弩',
    star: 5,
    sh: 'h2',
    tags: ['weapon', 'xbow'],
    cd: 0.7,
    dmg: [5, 8],
    crit: 10,
    ic: 'gear_weapon_26'
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
    on: { poison: 1, ls: 10 },
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
    ic: 'sk_staffstrike'
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
  { id: 'ironshield', n: '鐵盾', star: 2, sh: 'sq', tags: ['shield'], cd: 3, block: 10, ic: 'gear_offhand_3' },
  { id: 'boots', n: '輕靴', star: 2, sh: 's1', tags: ['armor'], dodge: 8, ic: 'gear_boots_0' },
  { id: 'chainmail', n: '鎖子甲', star: 3, sh: 'sq', tags: ['armor'], hp: 50, arm: 3, ic: 'gear_chest_1' },
  {
    id: 'thornshield',
    n: '荊棘盾',
    star: 3,
    sh: 'sq',
    tags: ['shield'],
    cd: 3,
    block: 12,
    thorns: 3,
    ic: 'gear_offhand_12'
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
    ic: 'gear_offhand_8'
  },
  { id: 'towershield', n: '塔盾', star: 3, sh: 'v3', tags: ['shield'], cd: 2.6, block: 16, ic: 'sk_phalanx' },
  { id: 'spikedmail', n: '尖刺鎧甲', star: 3, sh: 'x5', tags: ['armor'], hp: 60, arm: 4, ic: 'gear_chest_4' },
  { id: 'cape', n: '披風', star: 2, sh: 'h3', tags: ['armor'], hp: 20, dodge: 6, ic: 'gear_chest_11' },
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
    n: '幸運草',
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
    n: '毒囊',
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
    n: '盾牌架',
    star: 3,
    sh: 'h2',
    tags: ['trinket'],
    adj: [{ tag: 'shield', spd: 20, block: 3 }],
    ic: 'sk_shieldcharge'
  },
  {
    id: 'bersmask',
    n: '狂戰面具',
    star: 4,
    sh: 's1',
    tags: ['trinket'],
    all: [{ tag: 'weapon', spd: 15 }],
    fx: { take: 10 },
    ic: 'sk_berserk'
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
    n: '鷹眼鏡',
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
    n: '重擊護符',
    star: 4,
    sh: 'sq',
    tags: ['trinket'],
    for: 'mace',
    adj: [{ tag: 'weapon', dmgPct: 30, spd: -10 }],
    ic: 'sk_groundslam'
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
    n: '火藥桶',
    star: 3,
    sh: 'sq',
    tags: ['trinket'],
    for: 'fire',
    adj: [{ tag: 'fire', burn: 2, dmgPct: 10 }],
    ic: 'sk_detonate'
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
    n: '劇毒瓶',
    star: 3,
    sh: 'v2',
    tags: ['trinket'],
    for: 'poison',
    row: [
      { tag: 'poison', poison: 1 },
      { tag: 'dagger', poison: 1 }
    ],
    ic: 'sk_toxin'
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
    n: '盾徽',
    star: 2,
    sh: 's1',
    tags: ['trinket'],
    for: 'shield',
    adj: [{ tag: 'shield', block: 4, blockPct: 15 }],
    ic: 'sk_holyshield'
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
    n: '鍊金燒瓶',
    star: 3,
    sh: 'sq',
    tags: ['trinket'],
    for: 'potion',
    fx: { potMul: 40, potUse: 1 },
    ic: 'cur_alch'
  },
  { id: 'purse', n: '錢袋', star: 2, sh: 's1', tags: ['trinket'], gold: 1, ic: 'mat_gold' },
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
    n: '磨刀輪',
    star: 3,
    sh: 'z4',
    tags: ['trinket'],
    for: 'sword',
    adj: [{ tag: 'weapon', bleed: 1 }],
    ic: 'sk_rend'
  },
  {
    id: 'sunderstone',
    n: '碎甲石',
    star: 2,
    sh: 's1',
    tags: ['trinket'],
    for: 'mace',
    adj: [{ tag: 'weapon', sunder: 1 }],
    ic: 'mat_frag'
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
    n: '聖光鏡',
    star: 3,
    sh: 's1',
    tags: ['trinket', 'holy'],
    adj: [{ tag: 'weapon', blindCh: 12 }],
    ic: 'gear_offhand_11'
  },
  {
    id: 'weaponrack',
    n: '武器架',
    star: 4,
    sh: 'h3',
    tags: ['trinket'],
    row: [{ tag: 'weapon', dmgPct: 15 }],
    ic: 'sk_spearwall'
  },
  {
    id: 'grimoire',
    n: '禁忌魔典',
    star: 4,
    sh: 'x5',
    tags: ['trinket'],
    for: 'staff',
    all: [{ tag: 'staff', dmgPct: 25 }],
    ic: 'gear_offhand_4'
  },
  /* ---------- 藥水 ---------- */
  { id: 'potion', n: '生命藥水', star: 1, sh: 's1', tags: ['potion'], pot: [50, 20, 1], ic: 'p:ic_potion' },
  { id: 'herb', n: '再生花', star: 2, sh: 's1', tags: ['potion'], regen: 1, ic: 'sk_regenaura' },
  { id: 'bigpotion', n: '大生命藥水', star: 3, sh: 'v2', tags: ['potion'], pot: [40, 45, 1], ic: 'sk_heal' },
  /* ---------- 0.1.9 藥劑（開戰時丟向敵人；鍊金術士加強） ---------- */
  { id: 'weakbrew', n: '虛弱藥劑', star: 2, sh: 's1', tags: ['potion'], pre: { weak: 3 }, ic: 'sk_weaken' },
  { id: 'firebottle', n: '火焰瓶', star: 2, sh: 's1', tags: ['potion', 'fire'], pre: { burn: 3 }, ic: 'sk_combust' },
  { id: 'blindpowder', n: '致盲粉', star: 2, sh: 's1', tags: ['potion'], pre: { blind: 3 }, ic: 'sk_smokebomb' },
  { id: 'bleedoil', n: '放血毒油', star: 2, sh: 's1', tags: ['potion'], pre: { bleed: 4 }, ic: 'sk_bloodburst' },
  { id: 'ironskin', n: '鐵膚藥水', star: 2, sh: 's1', tags: ['potion'], fx: { arm: 4 }, ic: 'sk_determination' },
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
  { id: 'acidflask', n: '酸液瓶', star: 3, sh: 's1', tags: ['potion'], pre: { sunder: 4 }, ic: 'sk_decay' },
  {
    id: 'ragepotion',
    n: '狂暴藥水',
    star: 3,
    sh: 's1',
    tags: ['potion'],
    all: [{ tag: 'weapon', spd: 15 }],
    ic: 'sk_frenzy'
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
  /* ---------- 0.1.8 寵物：1★ 起手、5★ ---------- */
  { id: 'treefrog', n: '樹蛙', star: 1, sh: 's1', tags: ['pet'], cd: 1.4, dmg: [1, 2], ic: 'a:m_treefrog' },
  {
    id: 'qilin',
    n: '麒麟',
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
      { tag: 'bow', dmgPct: 20, spd: 15 },
      { tag: 'xbow', dmgPct: 20, spd: 15 }
    ]
  },
  {
    id: 'swordsman',
    st: 'woodsword',
    n: '劍士',
    ic: 'sk_swordwave',
    th: 'sword',
    m: [{ tag: 'sword', dmgPct: 25, crit: 10, bleed: 1 }]
  },
  {
    id: 'berserker',
    st: 'club',
    n: '狂戰士',
    ic: 'sk_rage',
    th: 'mace',
    m: [
      { tag: 'axe', dmgPct: 30, spd: 15, sunder: 1 },
      { tag: 'mace', dmgPct: 30, spd: 15, sunder: 1 }
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
      { tag: 'fire', burn: 3, dmgPct: 15 },
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
    m: [{ tag: 'light', stunCh: 12, dmgPct: 25 }]
  },
  {
    id: 'venom',
    st: 'needle',
    n: '毒師',
    ic: 'sk_poison',
    th: 'poison',
    m: [
      { tag: 'poison', poison: 2 },
      { tag: 'dagger', poison: 1 }
    ]
  },
  { id: 'tamer', st: 'treefrog', n: '馴獸師', ic: 'sk_tauntroar', th: 'pet', m: [{ tag: 'pet', dmgPct: 40, spd: 20 }] },
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
  { id: 'merchant', st: 'purse', n: '商人', ic: 'cur_exalt', gold: 1 }
];
const CLSI = Object.fromEntries(CLASSES.map(c => [c.id, c]));
/* 0.1.9 職業核心池：首領（2-5）從你的職業的池子三選一，每個職業 20 多個。
   照模板產生：P 是那個職業主打的標籤，模板對 P 加成；CORE_X 是各職業專屬的幾個 */
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
const CORE_T = [
  ['狂怒', P => ({ all: onP(P, { dmgPct: 35 }) })],
  ['疾風', P => ({ all: onP(P, { spd: 30 }) })],
  ['致命', P => ({ all: onP(P, { crit: 25 }) })],
  ['處決', P => ({ all: onP(P, { crit: 10 }), fx: { critMul: 60 } })],
  ['血刃', P => ({ all: onP(P, { bleed: 2 }) })],
  ['碎甲', P => ({ all: onP(P, { sunder: 2 }) })],
  ['詛咒', P => ({ all: onP(P, { weakCh: 25 }) })],
  ['閃光', P => ({ all: onP(P, { blindCh: 25 }) })],
  ['烈焰', P => ({ all: onP(P, { burn: 2 }) })],
  ['劇毒', P => ({ all: onP(P, { poison: 2 }) })],
  ['寒霜', P => ({ all: onP(P, { freezeCh: 20 }) })],
  ['雷鳴', P => ({ all: onP(P, { stunCh: 15 }) })],
  ['嗜血', P => ({ all: onP(P, { ls: 15 }) })],
  ['軍團', P => ({ all: onP(P, { dmgPct: 8, per: P[0] }) })],
  ['堅韌', P => ({ all: onP(P, { dmgPct: 10 }), fx: { hp: 60 } })],
  ['鐵壁', P => ({ all: onP(P, { dmgPct: 10 }), fx: { arm: 8 } })],
  ['幻影', P => ({ all: onP(P, { spd: 10 }), fx: { dodge: 12 } })],
  ['生命之泉', P => ({ all: onP(P, { dmgPct: 5 }), fx: { regen: 4 } })],
  ['封印', P => ({ all: onP(P, { dmgPct: 10 }), pre: { seal: 4 } })],
  ['衰敗', P => ({ all: onP(P, { dmgPct: 10 }), pre: { down: 1 } })],
  ['全能', P => ({ all: onP(P, { dmgPct: 20, spd: 15 }) })],
  ['重擊', P => ({ all: onP(P, { dmg: 5 }) })]
];
const CORE_X = {
  archer: [
    [
      '鷹眼',
      {
        all: [
          { tag: 'bow', crit: 15, spd: 15 },
          { tag: 'xbow', crit: 15, spd: 15 }
        ]
      }
    ]
  ],
  swordsman: [['劍聖', { all: [{ tag: 'sword', dmgPct: 25, bleed: 1 }] }]],
  berserker: [['狂暴', { all: [{ tag: 'weapon', spd: 20 }], fx: { take: 10, hp: 30 } }]],
  spearman: [['方陣', { all: [{ tag: 'spear', dmgPct: 20 }], fx: { arm: 6 } }]],
  assassin: [['影殺', { all: [{ tag: 'dagger', crit: 20 }], fx: { critMul: 40, dodge: 8 } }]],
  pyro: [['焚城', { all: [{ tag: 'fire', burn: 3 }], pre: { burn: 5 } }]],
  cryo: [['絕對零度', { all: [{ tag: 'cold', freezeCh: 15 }], pre: { frozen: 2 } }]],
  storm: [['天譴', { all: [{ tag: 'light', stunCh: 10, dmgPct: 20 }] }]],
  venom: [['瘟疫', { all: [{ tag: 'poison', poison: 2 }], pre: { poison: 4 } }]],
  tamer: [['獸群', { all: [{ tag: 'pet', dmgPct: 10, per: 'pet' }] }]],
  knight: [
    ['聖盾', { all: [{ tag: 'shield', blockPct: 60 }] }],
    ['堡壘', { all: [{ tag: 'shield', block: 10 }], fx: { hp: 40 } }]
  ],
  alchemist: [
    ['煉成', { fx: { throwPct: 80, potMul: 30 } }],
    ['萬能藥', { fx: { potMul: 60, potUse: 1 } }]
  ],
  merchant: [
    ['財神', { gold: 3 }],
    ['大富翁', { gold: 2, all: [{ tag: 'weapon', dmgPct: 10 }] }]
  ]
};
function genCores() {
  const out = [];
  for (const C of CLASSES) {
    const P = CORE_P[C.id] || ['weapon'],
      list = [...CORE_T.map(([n, f]) => [n, f(P)]), ...(CORE_X[C.id] || [])];
    list.forEach(([n, d], k) =>
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
  TIERM = [0, 1, 1.8, 3.2],
  TIERB = [0, 1, 1.5, 2];
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
  freezeCh: v => `${pct(v)} 凍結`,
  stunCh: v => `${pct(v)} 暈眩`,
  regen: v => `每秒回復 ${sg(v)}${v}`,
  hp: v => `生命 ${sg(v)}${v}`,
  arm: v => `護甲 ${sg(v)}${v}`,
  dodge: v => `閃避 ${sg(v)}${pct(v)}`,
  critMul: v => `暴擊傷害 ${sg(v)}${pct(v)}`,
  bleed: v => `命中流血 ${sg(v)}${v}`,
  sunder: v => `命中破甲 ${sg(v)}${v}`,
  weakCh: v => `${pct(v)} 虛弱`,
  blindCh: v => `${pct(v)} 致盲`,
  throwPct: v => `丟出的藥劑效果 ${sg(v)}${pct(v)}`
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
  if (it.dmg) {
    const a = Math.round(it.dmg[0] * k),
      b = Math.round(it.dmg[1] * k);
    out.push(`每 ${it.cd} 秒造成 ${a}～${b} 傷害${it.crit ? `（暴擊 ${it.crit}%）` : ''}`);
  }
  if (it.on) {
    const o = it.on;
    if (o.burn) out.push(`命中燃燒 ${o.burn} 層`);
    if (o.poison) out.push(`命中中毒 ${o.poison} 層`);
    if (o.freeze) out.push(`${o.freeze[0]}% 凍結 ${o.freeze[1]} 秒`);
    if (o.stun) out.push(`${o.stun[0]}% 暈眩 ${o.stun[1]} 秒`);
    if (o.ls) out.push(`吸血 ${o.ls}%`);
    if (o.bleed) out.push(`命中流血 ${o.bleed} 層`);
    if (o.sunder) out.push(`命中破甲 ${o.sunder}`);
    if (o.weak) out.push(`${o.weak}% 虛弱 3 秒`);
    if (o.blind) out.push(`${o.blind}% 致盲 2.5 秒`);
  }
  if (it.block)
    out.push(
      `每 ${it.cd} 秒格擋 ${Math.round(it.block * k)}${it.thorns ? `，格擋時反彈 ${it.thorns}` : ''}${it.heal ? `、回復 ${Math.round(it.heal * k)}` : ''}`
    );
  if (it.hp) out.push(`生命 +${Math.round(it.hp * k)}`);
  if (it.arm) out.push(`護甲 +${Math.round(it.arm * k)}`);
  if (it.dodge) out.push(`閃避 ${Math.round(it.dodge * TIERB[t])}%`);
  if (it.regen) out.push(`每秒回復 ${Math.round(it.regen * k)}`);
  if (it.pot) out.push(`生命低於 ${it.pot[0]}% 時回復 ${Math.round(it.pot[1] * k)}（${it.pot[2]} 次）`);
  for (const [w, n] of [
    ['adj', '相鄰的'],
    ['row', '同一排的'],
    ['all', '所有']
  ])
    for (const b of it[w] || [])
      out.push(`${n}${tagTxt(b.tag)}：${modTxt(scaleMod(b, t))}${b.per ? `（背包裡每有 1 件${tagTxt(b.per)}）` : ''}`);
  if (it.fx) {
    const f = it.fx,
      rest = Object.fromEntries(Object.entries(f).filter(([k]) => MODN[k]));
    if (Object.keys(rest).length) out.push(modTxt(rest));
    if (f.take) out.push(`受到的傷害 +${f.take}%`);
    if (f.potMul) out.push(`藥水回復 +${f.potMul}%${f.potUse ? `、多喝 ${f.potUse} 次` : ''}`);
  }
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
