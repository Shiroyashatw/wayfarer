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
    on: { stun: [10, 0.5] },
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
    on: { stun: [25, 0.6] },
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
    on: { ls: 30 },
    pre: { seal: 3 },
    ic: 'gear_weapon_30'
  },
  {
    id: 'dragonslayer',
    n: '屠龍大劍',
    star: 4,
    sh: 'big',
    tags: ['weapon', 'sword'],
    cd: 2,
    dmg: [12, 18],
    crit: 10,
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
    ic: 'sup_sp_crit'
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
    n: '戰鼓',
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
    n: '劍鞘',
    star: 2,
    sh: 's1',
    tags: ['trinket'],
    for: 'sword',
    adj: [{ tag: 'sword', crit: 12, dmg: 1 }],
    ic: 'sk_iai'
  },
  {
    id: 'anvil',
    n: '鐵砧',
    star: 4,
    sh: 'sq',
    tags: ['trinket'],
    for: 'mace',
    adj: [{ tag: 'weapon', dmgPct: 30, spd: -10 }],
    ic: 'sk_power'
  },
  {
    id: 'cloak',
    n: '暗影斗篷',
    star: 3,
    sh: 'h2',
    tags: ['trinket'],
    for: 'dagger',
    fx: { dodge: 8 },
    adj: [{ tag: 'dagger', crit: 10 }],
    ic: 'sk_smokebomb'
  },
  {
    id: 'spellbook',
    n: '法術書',
    star: 3,
    sh: 'h2',
    tags: ['trinket'],
    for: 'staff',
    row: [{ tag: 'staff', dmgPct: 25 }],
    ic: 'sk_mantra'
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
    ic: 'sk_iceshard'
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
    n: '肉骨頭',
    star: 1,
    sh: 's1',
    tags: ['trinket'],
    for: 'pet',
    adj: [{ tag: 'pet', dmg: 2, spd: 10 }],
    ic: 'sk_bonecrush'
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
    ic: 'sk_haste'
  },
  {
    id: 'cauldron',
    n: '鍊金壺',
    star: 3,
    sh: 'sq',
    tags: ['trinket'],
    for: 'potion',
    fx: { potMul: 40, potUse: 1 },
    ic: 'sup_sp_eff'
  },
  { id: 'purse', n: '錢袋', star: 2, sh: 's1', tags: ['trinket'], gold: 1, ic: 'cur_regal' },
  /* ---------- 藥水 ---------- */
  { id: 'potion', n: '生命藥水', star: 1, sh: 's1', tags: ['potion'], pot: [50, 20, 1], ic: 'p:ic_potion' },
  { id: 'herb', n: '再生花', star: 2, sh: 's1', tags: ['potion'], regen: 1, ic: 'sk_regenaura' },
  { id: 'bigpotion', n: '大生命藥水', star: 3, sh: 'v2', tags: ['potion'], pot: [40, 45, 1], ic: 'sk_heal' },
  /* ---------- 寵物（原本的契靈） ---------- */
  { id: 'slime', n: '小史萊姆', star: 2, sh: 's1', tags: ['pet'], cd: 1.5, dmg: [1, 3], ic: 'a:m_slime_green' },
  { id: 'skeleton', n: '骷髏兵', star: 3, sh: 's1', tags: ['pet', 'dark'], cd: 1.8, dmg: [3, 5], ic: 'sk_skeleton' },
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
  /* ---------- 職業核心（原本的昇華；一個背包最多 1 個） ---------- */
  {
    id: 'c_blade',
    n: '斬鐵劍聖之證',
    star: 5,
    core: 1,
    sh: 'l3',
    tags: ['core'],
    all: [
      { tag: 'sword', dmgPct: 30 },
      { tag: 'sword', spd: 5, per: 'sword' }
    ],
    d: '劍的傷害 +30%；背包裡每把劍讓所有劍攻速 +5%',
    ic: 'asc_cls_warlord'
  },
  {
    id: 'c_banner',
    n: '戰旗統帥之旗',
    star: 5,
    core: 1,
    sh: 'v2',
    tags: ['core'],
    adj: [{ tag: 'weapon', spd: 25 }],
    all: [{ tag: 'pet', dmgPct: 30 }],
    d: '相鄰的武器攻速 +25%；寵物傷害 +30%',
    ic: 'sk_banner'
  },
  {
    id: 'c_hunter',
    n: '叢林獵手之弦',
    star: 5,
    core: 1,
    sh: 'v2',
    tags: ['core'],
    all: [
      { tag: 'bow', crit: 15, spd: 20 },
      { tag: 'xbow', crit: 15, spd: 20 }
    ],
    d: '弓與弩：暴擊率 +15%、攻速 +20%',
    ic: 'asc_cls_amazon'
  },
  {
    id: 'c_alchemy',
    n: '煉金術士的坩堝',
    star: 5,
    core: 1,
    sh: 'sq',
    tags: ['core'],
    fx: { potMul: 100, potUse: 1 },
    all: [{ tag: 'potion', regen: 1 }],
    d: '藥水回復量 ×2、每瓶多用 1 次；再生類 +1',
    ic: 'sup_ln_greed'
  },
  {
    id: 'c_elemental',
    n: '元素使之核',
    star: 5,
    core: 1,
    sh: 'sq',
    tags: ['core'],
    all: [
      { tag: 'fire', dmgPct: 35, burn: 1 },
      { tag: 'cold', dmgPct: 35, freezeCh: 10 },
      { tag: 'light', dmgPct: 35, stunCh: 10 }
    ],
    d: '火、冰、雷的武器傷害 +35%，異常效果更強',
    ic: 'asc_cls_elemental'
  },
  {
    id: 'c_necro',
    n: '死靈師的骨冠',
    star: 5,
    core: 1,
    sh: 'h2',
    tags: ['core'],
    all: [{ tag: 'pet', dmgPct: 50, spd: 20 }],
    fx: { ls: 5 },
    d: '寵物傷害 +50%、攻速 +20%；你的攻擊吸血 5%',
    ic: 'asc_cls_necro'
  },
  {
    id: 'c_guardian',
    n: '守護者之誓',
    star: 5,
    core: 1,
    sh: 'sq',
    tags: ['core'],
    all: [{ tag: 'shield', blockPct: 50 }],
    fx: { hp: 40 },
    d: '盾的格擋 +50%；生命 +40',
    ic: 'asc_cls_guardian'
  },
  {
    id: 'c_assassin',
    n: '刺客之影',
    star: 5,
    core: 1,
    sh: 'v2',
    tags: ['core'],
    all: [{ tag: 'dagger', crit: 25 }],
    fx: { critMul: 60 },
    pre: { down: 1 },
    d: '匕首暴擊率 +25%；暴擊傷害 ×2.2',
    ic: 'asc_cls_assassin'
  }
];
const ITEMI = Object.fromEntries(ITEMS.map(it => [it.id, it]));
/* 0.1.7 開局職業：1-1 開打前三選一（可以刷新一次），整局都有效。
   m：對有那個標籤的道具加成（跟飾品一樣算進道具身上）；F：角色身上；gold：每回合多拿的金幣；th：機器人選了這個職業偏好買的標籤 */
const CLASSES = [
  {
    id: 'archer',
    n: '弓箭手',
    ic: 'sk_multishot',
    th: 'bow',
    m: [
      { tag: 'bow', dmgPct: 20, spd: 15 },
      { tag: 'xbow', dmgPct: 20, spd: 15 }
    ]
  },
  { id: 'swordsman', n: '劍士', ic: 'sk_swordwave', th: 'sword', m: [{ tag: 'sword', dmgPct: 20, crit: 10 }] },
  {
    id: 'berserker',
    n: '狂戰士',
    ic: 'sk_rage',
    th: 'mace',
    m: [
      { tag: 'axe', dmgPct: 25, spd: 10 },
      { tag: 'mace', dmgPct: 25, spd: 10 }
    ]
  },
  {
    id: 'spearman',
    n: '槍兵',
    ic: 'sk_spearrush',
    th: 'spear',
    m: [{ tag: 'spear', dmgPct: 30, spd: 10 }],
    F: { arm: 5 }
  },
  { id: 'assassin', n: '刺客', ic: 'sk_backstab', th: 'dagger', m: [{ tag: 'dagger', crit: 15 }], F: { critMul: 40 } },
  {
    id: 'pyro',
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
    n: '冰法師',
    ic: 'sk_frostnova',
    th: 'cold',
    m: [
      { tag: 'cold', freezeCh: 15, dmgPct: 15 },
      { tag: 'staff', spd: 20 }
    ]
  },
  { id: 'storm', n: '雷法師', ic: 'sk_chainlight', th: 'light', m: [{ tag: 'light', stunCh: 12, dmgPct: 25 }] },
  {
    id: 'venom',
    n: '毒師',
    ic: 'sk_poison',
    th: 'poison',
    m: [
      { tag: 'poison', poison: 2 },
      { tag: 'dagger', poison: 1 }
    ]
  },
  { id: 'tamer', n: '馴獸師', ic: 'sk_tauntroar', th: 'pet', m: [{ tag: 'pet', dmgPct: 30, spd: 15 }] },
  { id: 'knight', n: '騎士', ic: 'sk_shieldwall', th: 'shield', m: [{ tag: 'shield', blockPct: 40 }], F: { hp: 20 } },
  { id: 'alchemist', n: '鍊金術士', ic: 'cur_alch', th: 'potion', F: { potMul: 30, regen: 1 } },
  { id: 'merchant', n: '商人', ic: 'cur_exalt', gold: 1 }
];
const CLSI = Object.fromEntries(CLASSES.map(c => [c.id, c]));
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
const MODN = {
  dmg: v => `傷害 +${v}`,
  dmgPct: v => `傷害 +${pct(v)}`,
  spd: v => `攻速 +${pct(v)}`,
  crit: v => `暴擊率 +${pct(v)}`,
  burn: v => `命中燃燒 +${v}`,
  poison: v => `命中中毒 +${v}`,
  ls: v => `吸血 ${pct(v)}`,
  block: v => `格擋 +${v}`,
  blockPct: v => `格擋 +${pct(v)}`,
  freezeCh: v => `${pct(v)} 凍結`,
  stunCh: v => `${pct(v)} 暈眩`,
  regen: v => `每秒回復 +${v}`,
  hp: v => `生命 +${v}`,
  arm: v => `護甲 +${v}`,
  dodge: v => `閃避 +${pct(v)}`,
  critMul: v => `暴擊傷害 +${pct(v)}`
};
const modTxt = m =>
  Object.entries(m)
    .filter(([k]) => MODN[k])
    .map(([k, v]) => MODN[k](v))
    .join('、');
const tagTxt = t => (t === 'weapon' ? '武器' : t === '*' ? '道具' : TAGN[t] || t);
/* 0.1.6 開戰前的特殊效果（越強越稀有）：seal 封鎖敵人隨機一把武器 N 秒（每升一階 +1 秒）、down 敵人隨機一把武器降 1 階（最低 Ⅰ 階） */
const preVal = (id, t = 1) => {
  const p = ITEMI[id].pre;
  return p ? (p.seal ? p.seal + (t - 1) : 1) : 0;
};
function preTxt(id, t = 1) {
  const p = ITEMI[id].pre;
  if (!p) return '';
  return p.seal ? `開戰時封鎖敵人隨機一把武器 ${preVal(id, t)} 秒` : '開戰時把敵人隨機一把武器降 1 階（最低 Ⅰ 階）';
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
    for (const b of it[w] || []) out.push(`${n}${tagTxt(b.tag)}：${modTxt(scaleMod(b, t))}`);
  if (it.fx && it.fx.take) out.push(`受到的傷害 +${it.fx.take}%`);
  if (it.fx && it.fx.dodge) out.push(`閃避 +${it.fx.dodge}%`);
  if (it.fx && it.fx.potMul) out.push(`藥水回復 +${it.fx.potMul}%${it.fx.potUse ? `、多喝 ${it.fx.potUse} 次` : ''}`);
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
