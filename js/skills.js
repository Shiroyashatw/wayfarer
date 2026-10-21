/* 漫步勇者 · 0.3 技能石擴充（data.js 之後載入）：依武器類別與元素分組，約 100 種
   欄位：w 武器類別（0.3.18 起不符就不能用）、el 法術元素、tg 目標（one 單體／all 全體／rand 隨機）、hits 段數、chain 連鎖、proj 額外投射物、
   addEl 攻擊附加元素 [元素, 物理的比例]、bleed／stun 機率、mark 標記、curse 詛咒、exec 斬殺、pet 召喚、buff 增益、lifeCost 扣生命 */
'use strict';
Object.assign(SKILLS, {
  /* ---- 劍 ---- */
  slash2: { name: '斬鐵', mp: 5, kind: 'attack', w: 'sword', mult: 1.7, brk: 20, icon: 'sword', r: 3 },
  swordwave: { name: '劍氣', mp: 6, kind: 'attack', w: 'sword', mult: 1.5, fx: 'arrow', icon: 'wind', r: 3 },
  thrust: { name: '刺擊', mp: 4, kind: 'attack', w: 'sword', mult: 1.4, crit: 10, icon: 'sword', r: 3 },
  riposte: {
    name: '反擊架式',
    mp: 6,
    kind: 'attack',
    w: 'sword',
    mult: 1.1,
    icon: 'shield',
    r: 3,
    buff: { id: 'riposte', n: '反擊架式', turns: 2, dodge: 15 }
  },
  spinslash: {
    name: '迴旋斬',
    mp: 9,
    kind: 'attack',
    w: 'sword',
    mult: 1.1,
    tg: 'all',
    fx: 'whirl',
    icon: 'sword',
    r: 4
  },
  crosscut: { name: '十字斬', mp: 8, kind: 'attack', w: 'sword', mult: 1.1, hits: 2, bleed: 30, icon: 'sword', r: 4 },
  mirage: { name: '幻影劍', mp: 9, kind: 'attack', w: 'sword', mult: 1.2, proj: 2, fx: 'arrow', icon: 'wind', r: 4 },
  judgment: { name: '裁決之劍', mp: 15, kind: 'attack', w: 'sword', mult: 3, exec: 40, icon: 'sword', r: 5 },
  bladestorm: {
    name: '劍刃風暴',
    mp: 16,
    kind: 'attack',
    w: 'sword',
    mult: 0.85,
    hits: 5,
    tg: 'rand',
    fx: 'whirl',
    icon: 'wind',
    r: 5
  },
  /* ---- 斧鎚 ---- */
  groundslam: {
    name: '震地',
    mp: 7,
    kind: 'attack',
    w: 'axe',
    mult: 0.9,
    tg: 'all',
    stun: 0.2,
    fx: 'whirl',
    icon: 'mace',
    r: 3
  },
  bonecrush: { name: '碎骨', mp: 5, kind: 'attack', w: 'axe', mult: 1.8, brk: 30, icon: 'mace', r: 3 },
  shatter: { name: '粉碎', mp: 6, kind: 'attack', w: 'axe', mult: 1.5, stun: 0.35, icon: 'mace', r: 3 },
  warcry: {
    name: '戰吼',
    mp: 6,
    kind: 'buff',
    icon: 'horn',
    r: 3,
    buff: { id: 'warcry', n: '戰吼', turns: 3, more: 25 }
  },
  axespin: {
    name: '旋風斧',
    mp: 10,
    kind: 'attack',
    w: 'axe',
    mult: 0.7,
    hits: 2,
    tg: 'all',
    fx: 'whirl',
    icon: 'axe',
    r: 4
  },
  execute: { name: '處決', mp: 8, kind: 'attack', w: 'axe', mult: 1.6, exec: 60, icon: 'axe', r: 4 },
  rage: {
    name: '狂怒',
    mp: 4,
    kind: 'buff',
    lifeCost: 0.1,
    icon: 'horn',
    r: 4,
    buff: { id: 'rage', n: '狂怒', turns: 3, more: 45 }
  },
  earthquake: {
    name: '地裂',
    mp: 16,
    kind: 'attack',
    w: 'axe',
    mult: 1.6,
    tg: 'all',
    stun: 0.3,
    fx: 'whirl',
    icon: 'mace',
    r: 5
  },
  thorhammer: {
    name: '雷神之鎚',
    mp: 15,
    kind: 'attack',
    w: 'axe',
    mult: 2.2,
    chain: 2,
    addEl: ['light', 0.5],
    fx: 'bolt',
    icon: 'bolt',
    r: 5
  },
  /* ---- 矛 ---- */
  javelin: { name: '投矛', mp: 5, kind: 'attack', w: 'spear', mult: 1.6, fx: 'arrow', icon: 'spear', r: 3 },
  lunge: { name: '突刺', mp: 6, kind: 'attack', w: 'spear', mult: 0.95, hits: 2, icon: 'spear', r: 3 },
  phalanx: {
    name: '方陣',
    mp: 7,
    kind: 'buff',
    icon: 'shield',
    r: 3,
    buff: { id: 'phalanx', n: '方陣', turns: 3, arm: 50, taunt: 30 }
  },
  sweep: { name: '橫掃', mp: 9, kind: 'attack', w: 'spear', mult: 1, tg: 'all', fx: 'whirl', icon: 'spear', r: 4 },
  impale: { name: '貫穿', mp: 9, kind: 'attack', w: 'spear', mult: 1.5, chain: 1, brk: 25, icon: 'spear', r: 4 },
  spinspear: {
    name: '迴旋槍',
    mp: 11,
    kind: 'attack',
    w: 'spear',
    mult: 0.6,
    hits: 2,
    tg: 'all',
    fx: 'whirl',
    icon: 'spear',
    r: 4
  },
  valkyrie: { name: '女武神之槍', mp: 15, kind: 'attack', w: 'spear', mult: 1, hits: 3, crit: 15, icon: 'spear', r: 5 },
  skypierce: {
    name: '天槍',
    mp: 17,
    kind: 'attack',
    w: 'spear',
    mult: 1.5,
    tg: 'all',
    addEl: ['light', 0.4],
    fx: 'bolt',
    icon: 'spear',
    r: 5
  },
  /* ---- 弓弩 ---- */
  multishot: { name: '多重箭', mp: 6, kind: 'attack', w: 'bow', mult: 1, proj: 2, fx: 'arrow', icon: 'arrow', r: 3 },
  markshot: { name: '標記射擊', mp: 5, kind: 'attack', w: 'bow', mult: 1.3, mark: 25, fx: 'arrow', icon: 'eye', r: 3 },
  apshot: { name: '穿甲射擊', mp: 6, kind: 'attack', w: 'bow', mult: 1.5, brk: 50, fx: 'arrow', icon: 'arrow', r: 3 },
  firearrow: {
    name: '火焰箭',
    mp: 6,
    kind: 'attack',
    w: 'bow',
    mult: 1.3,
    addEl: ['fire', 0.6],
    fx: 'arrow',
    icon: 'flame',
    r: 3
  },
  frostarrow: {
    name: '冰霜箭',
    mp: 6,
    kind: 'attack',
    w: 'bow',
    mult: 1.3,
    addEl: ['cold', 0.5],
    freeze: 0.3,
    fx: 'arrow',
    icon: 'ice',
    r: 3
  },
  trapshot: { name: '捕獸夾', mp: 6, kind: 'attack', w: 'bow', mult: 1.1, stun: 0.45, fx: 'arrow', icon: 'xbow', r: 3 },
  rainarrow: {
    name: '箭雨',
    mp: 10,
    kind: 'attack',
    w: 'bow',
    mult: 0.65,
    hits: 2,
    tg: 'all',
    fx: 'arrow',
    icon: 'arrow',
    r: 4
  },
  snipe: { name: '狙擊', mp: 9, kind: 'attack', w: 'bow', mult: 2.4, crit: 20, fx: 'arrow', icon: 'eye', r: 4 },
  burstbolt: {
    name: '爆裂弩矢',
    mp: 10,
    kind: 'attack',
    w: 'bow',
    mult: 1,
    tg: 'all',
    addEl: ['fire', 0.4],
    fx: 'fire',
    icon: 'xbow',
    r: 4
  },
  lightarrow: {
    name: '雷光箭',
    mp: 9,
    kind: 'attack',
    w: 'bow',
    mult: 1.2,
    chain: 3,
    addEl: ['light', 0.5],
    fx: 'arrow',
    icon: 'bolt',
    r: 4
  },
  barrage: { name: '連珠箭', mp: 9, kind: 'attack', w: 'bow', mult: 0.55, hits: 4, fx: 'arrow', icon: 'arrow', r: 4 },
  poisoncloud: {
    name: '毒霧箭',
    mp: 10,
    kind: 'attack',
    w: 'bow',
    mult: 0.6,
    tg: 'all',
    poison: 3,
    fx: 'arrow',
    icon: 'cloud',
    r: 4
  },
  starfall: {
    name: '流星箭雨',
    mp: 18,
    kind: 'attack',
    w: 'bow',
    mult: 0.7,
    hits: 3,
    tg: 'all',
    fx: 'arrow',
    icon: 'star',
    r: 5
  },
  deadeye: {
    name: '神射',
    mp: 15,
    kind: 'attack',
    w: 'bow',
    mult: 3.2,
    crit: 25,
    brk: 30,
    fx: 'arrow',
    icon: 'eye',
    r: 5
  },
  /* ---- 匕首爪 ---- */
  backstab: { name: '背刺', mp: 5, kind: 'attack', w: 'dagger', mult: 1.6, crit: 25, icon: 'dagger', r: 3 },
  bloodclaw: {
    name: '血爪',
    mp: 6,
    kind: 'attack',
    w: 'dagger',
    mult: 0.9,
    hits: 2,
    bleed: 40,
    leech: 2,
    icon: 'claw',
    r: 3
  },
  venomfang: { name: '毒牙', mp: 5, kind: 'attack', w: 'dagger', mult: 1.2, poison: 4, icon: 'cloud', r: 3 },
  shadowstep: {
    name: '影步',
    mp: 6,
    kind: 'buff',
    icon: 'wind',
    r: 3,
    buff: { id: 'shadow', n: '影步', turns: 2, dodge: 20, crit: 15 }
  },
  smokebomb: {
    name: '煙霧彈',
    mp: 5,
    kind: 'buff',
    icon: 'cloud',
    r: 3,
    buff: { id: 'smoke', n: '煙霧', turns: 2, dodge: 30 }
  },
  fanblade: { name: '飛刃', mp: 9, kind: 'attack', w: 'dagger', mult: 0.9, proj: 3, fx: 'arrow', icon: 'dagger', r: 4 },
  whirlblade: {
    name: '刃舞',
    mp: 10,
    kind: 'attack',
    w: 'dagger',
    mult: 0.7,
    hits: 2,
    tg: 'all',
    bleed: 25,
    fx: 'whirl',
    icon: 'claw',
    r: 4
  },
  frenzy: { name: '狂亂連擊', mp: 9, kind: 'attack', w: 'dagger', mult: 0.6, hits: 4, icon: 'claw', r: 4 },
  assassinate: {
    name: '暗殺',
    mp: 14,
    kind: 'attack',
    w: 'dagger',
    mult: 2.6,
    exec: 80,
    crit: 20,
    icon: 'dagger',
    r: 5
  },
  shadowclone: {
    name: '影分身',
    mp: 16,
    kind: 'spell',
    el: 'phys',
    mult: 0,
    icon: 'party',
    r: 5,
    pet: {
      name: '影分身',
      spr: 'heroS',
      pal: {
        h: '#2a2238',
        s: '#5a4a6a',
        e: '#ff3a5a',
        c: '#2a2238',
        a: '#1a1226',
        b: '#3a2a4a',
        l: '#1a1226',
        f: '#1a1226'
      },
      mult: 1.6,
      n: 2,
      max: 2,
      turns: 3
    }
  },
  /* ---- 火焰 ---- */
  flamelance: { name: '炎槍', mp: 6, kind: 'spell', el: 'fire', mult: 2, fx: 'fire', icon: 'flame', r: 3 },
  firewall: { name: '火牆', mp: 8, kind: 'spell', el: 'fire', mult: 1, tg: 'all', fx: 'fire', icon: 'flame', r: 3 },
  fireburst: { name: '爆炎', mp: 10, kind: 'spell', el: 'fire', mult: 1.6, chain: 2, fx: 'fire', icon: 'flame', r: 4 },
  combust: { name: '自燃', mp: 8, kind: 'spell', el: 'fire', mult: 1.4, ail: 80, fx: 'fire', icon: 'flame', r: 4 },
  inferno: { name: '煉獄', mp: 18, kind: 'spell', el: 'fire', mult: 2.2, tg: 'all', fx: 'fire', icon: 'flame', r: 5 },
  phoenix: {
    name: '鳳凰',
    mp: 18,
    kind: 'spell',
    el: 'fire',
    mult: 0,
    icon: 'flame',
    r: 5,
    pet: {
      name: '鳳凰',
      spr: 'bird',
      pal: { b: '#ff7a2a', w: '#ffd166', e: '#fff', k: '#7a1a1a' },
      el: 'fire',
      mult: 2.2,
      n: 1,
      max: 1,
      turns: 4
    }
  },
  /* ---- 冰冷 ---- */
  frostnova: {
    name: '霜爆',
    mp: 8,
    kind: 'spell',
    el: 'cold',
    mult: 1,
    tg: 'all',
    freeze: 0.25,
    fx: 'ice',
    icon: 'ice',
    r: 3
  },
  iceshard: { name: '冰錐', mp: 6, kind: 'spell', el: 'cold', mult: 1.3, proj: 2, fx: 'ice', icon: 'ice', r: 3 },
  iceshield: {
    name: '冰甲',
    mp: 9,
    kind: 'buff',
    icon: 'shield',
    r: 4,
    buff: { id: 'icearmor', n: '冰甲', turns: 3, arm: 60, dmgRed: 10, shield: 0.15 }
  },
  frostchain: {
    name: '寒冰鎖鏈',
    mp: 10,
    kind: 'spell',
    el: 'cold',
    mult: 1.3,
    chain: 3,
    freeze: 0.2,
    fx: 'ice',
    icon: 'ice',
    r: 4
  },
  coldsnap: { name: '急凍', mp: 10, kind: 'spell', el: 'cold', mult: 2, freeze: 0.6, fx: 'ice', icon: 'ice', r: 4 },
  glacier: {
    name: '冰河',
    mp: 18,
    kind: 'spell',
    el: 'cold',
    mult: 2,
    tg: 'all',
    freeze: 0.4,
    fx: 'ice',
    icon: 'ice',
    r: 5
  },
  /* ---- 閃電 ---- */
  arc: { name: '電弧', mp: 6, kind: 'spell', el: 'light', mult: 1.7, chain: 1, fx: 'bolt', icon: 'bolt', r: 3 },
  chainlight: {
    name: '連鎖閃電',
    mp: 8,
    kind: 'spell',
    el: 'light',
    mult: 1.3,
    chain: 3,
    fx: 'bolt',
    icon: 'bolt',
    r: 3
  },
  spark: {
    name: '電火花',
    mp: 7,
    kind: 'spell',
    el: 'light',
    mult: 0.7,
    hits: 4,
    tg: 'rand',
    fx: 'bolt',
    icon: 'bolt',
    r: 3
  },
  ballight: {
    name: '球狀閃電',
    mp: 10,
    kind: 'spell',
    el: 'light',
    mult: 0.9,
    hits: 3,
    fx: 'bolt',
    icon: 'bolt',
    r: 4
  },
  staticfield: {
    name: '靜電場',
    mp: 10,
    kind: 'spell',
    el: 'light',
    mult: 1,
    tg: 'all',
    ail: 80,
    fx: 'bolt',
    icon: 'bolt',
    r: 4
  },
  thunderstorm: {
    name: '雷暴',
    mp: 18,
    kind: 'spell',
    el: 'light',
    mult: 1.1,
    hits: 2,
    tg: 'all',
    fx: 'bolt',
    icon: 'bolt',
    r: 5
  },
  smite: { name: '天罰', mp: 16, kind: 'spell', el: 'light', mult: 3.6, fx: 'bolt', icon: 'star', r: 5 },
  /* ---- 召喚、詛咒、鮮血 ---- */
  skeleton: {
    name: '召喚骷髏',
    mp: 8,
    kind: 'spell',
    el: 'phys',
    mult: 0,
    icon: 'skull',
    r: 3,
    pet: { name: '骷髏', spr: 'skeleton', pal: { w: '#e8e2d0' }, mult: 1, n: 2, max: 4, turns: 5 }
  },
  bonewall: {
    name: '骨牆',
    mp: 7,
    kind: 'buff',
    icon: 'skull',
    r: 3,
    buff: { id: 'bonewall', n: '骨牆', turns: 3, arm: 40, shield: 0.2 }
  },
  bonespear: { name: '骨矛', mp: 6, kind: 'spell', el: 'phys', mult: 2, brk: 30, fx: 'pierce', icon: 'skull', r: 3 },
  weaken: {
    name: '弱化詛咒',
    mp: 7,
    kind: 'spell',
    el: 'cold',
    mult: 0.3,
    tg: 'all',
    curse: 20,
    curseW: 15,
    fx: 'ice',
    icon: 'rune',
    r: 3
  },
  bloodlance: {
    name: '血槍',
    mp: 0,
    kind: 'spell',
    el: 'phys',
    mult: 2.2,
    lifeCost: 0.05,
    leech: 5,
    fx: 'pierce',
    icon: 'heart',
    r: 3
  },
  skelmage: {
    name: '召喚骷髏法師',
    mp: 11,
    kind: 'spell',
    el: 'cold',
    mult: 0,
    icon: 'skull',
    r: 4,
    pet: { name: '骷髏法師', spr: 'skeleton', pal: { w: '#9fd4ef' }, el: 'cold', mult: 1.4, n: 1, max: 3, turns: 5 }
  },
  doom: { name: '厄運詛咒', mp: 9, kind: 'spell', el: 'phys', mult: 0.5, curse: 35, fx: 'pierce', icon: 'rune', r: 4 },
  decay: {
    name: '腐化',
    mp: 9,
    kind: 'spell',
    el: 'phys',
    mult: 0.4,
    tg: 'all',
    poison: 4,
    fx: 'pierce',
    icon: 'cloud',
    r: 4
  },
  bloodburst: {
    name: '血爆',
    mp: 0,
    kind: 'spell',
    el: 'phys',
    mult: 1.6,
    tg: 'all',
    lifeCost: 0.08,
    fx: 'fire',
    icon: 'heart',
    r: 4
  },
  vampire: {
    name: '吸血鬼之觸',
    mp: 9,
    kind: 'spell',
    el: 'phys',
    mult: 1.5,
    leech: 15,
    fx: 'pierce',
    icon: 'heart',
    r: 4
  },
  wraith: {
    name: '召喚怨靈',
    mp: 18,
    kind: 'spell',
    el: 'cold',
    mult: 0,
    icon: 'skull',
    r: 5,
    pet: {
      name: '怨靈',
      spr: 'spirit',
      pal: { v: '#3a5a7a', e: '#7fffd0', m: '#0a1a2a' },
      el: 'cold',
      mult: 2.2,
      n: 2,
      max: 3,
      turns: 5
    }
  },
  sacrifice: {
    name: '血祭',
    mp: 0,
    kind: 'buff',
    lifeCost: 0.2,
    icon: 'heart',
    r: 5,
    buff: { id: 'sacrifice', n: '血祭', turns: 3, more: 60 }
  },
  /* ---- 光環、戰吼、支援 ---- */
  banner: {
    name: '戰旗',
    mp: 7,
    kind: 'buff',
    icon: 'flag',
    r: 3,
    buff: { id: 'banner', n: '戰旗', turns: 4, more: 15, crit: 5 }
  },
  haste: {
    name: '加速',
    mp: 6,
    kind: 'buff',
    icon: 'wind',
    r: 3,
    buff: { id: 'haste', n: '加速', turns: 3, dodge: 15, more: 10 }
  },
  tauntroar: {
    name: '嘲諷吼',
    mp: 6,
    kind: 'buff',
    icon: 'horn',
    r: 3,
    buff: { id: 'taunt', n: '嘲諷', turns: 3, taunt: 100, arm: 40 }
  },
  purify: { name: '淨化', mp: 7, kind: 'heal', heal: 0.3, icon: 'heart', r: 3 },
  regenaura: { name: '再生光環', mp: 10, kind: 'heal', heal: 0.25, healAll: 60, icon: 'heart', r: 4 },
  holyshield: {
    name: '聖盾',
    mp: 10,
    kind: 'buff',
    icon: 'shield',
    r: 4,
    buff: { id: 'holy', n: '聖盾', turns: 3, dmgRed: 10, shield: 0.3 }
  },
  inspire: {
    name: '鼓舞',
    mp: 9,
    kind: 'buff',
    icon: 'flag',
    r: 4,
    buff: { id: 'inspire', n: '鼓舞', turns: 3, more: 20, dmgRed: 5 }
  },
  battlecry: {
    name: '戰神之吼',
    mp: 16,
    kind: 'buff',
    icon: 'horn',
    r: 5,
    buff: { id: 'battlecry', n: '戰神之吼', turns: 4, more: 35, crit: 10, dmgRed: 10 }
  },
  /* ---- 道士 ---- */
  talisman: { name: '符咒', mp: 6, kind: 'spell', el: 'light', mult: 1.5, stun: 0.3, fx: 'bolt', icon: 'rune', r: 3 },
  exorcise: { name: '驅邪', mp: 10, kind: 'spell', el: 'fire', mult: 1.2, tg: 'all', fx: 'fire', icon: 'rune', r: 4 },
  possession: {
    name: '附身',
    mp: 0,
    kind: 'buff',
    lifeCost: 0.1,
    icon: 'eye',
    r: 4,
    buff: { id: 'possess', n: '附身', turns: 3, more: 45, dodge: 10 }
  },
  summongod: {
    name: '請神',
    mp: 20,
    kind: 'spell',
    el: 'light',
    mult: 0,
    icon: 'star',
    r: 5,
    pet: {
      name: '神將',
      spr: 'oxhead',
      pal: { h: '#ffd166', t: '#c0202a', f: '#f2c14e', e: '#fff', r: '#c0202a', c: '#d8a838' },
      el: 'light',
      mult: 2.6,
      n: 1,
      max: 1,
      turns: 4
    }
  }
});
/* 技能類別的中文（技能石說明、祈願卡片） */
const SKKIND = { attack: '攻擊', spell: '法術', heal: '回復', buff: '增益' };
/* 新圖示（8×8） */
Object.assign(ICONS, {
  spear: ['.......w', '......ww', '.....wb.', '....b...', '...b....', '..b.....', '.b......', 'b.......'],
  dagger: ['........', '......ww', '.....ww.', '....ww..', '..kww...', '..bk....', '.b......', '........'],
  claw: ['w...w...', '.w...w..', '..w...w.', 'w..w...w', '.w..w...', '..w..w..', '...kkk..', '...bbb..'],
  mace: ['..kkk...', '.kwwwk..', '.kwwwk..', '..kkkb..', '....b...', '.....b..', '......b.', '.......b'],
  skull: ['.wwwww..', 'wwwwwww.', 'wkkwkkw.', 'wkkwkkw.', 'wwwkwww.', '.wwwww..', '.wkwkw..', '........'],
  rune: ['..yyy...', '.y...y..', 'y.y.y.y.', 'y..y..y.', 'y.y.y.y.', '.y...y..', '..yyy...', '........'],
  wind: ['.cccc...', 'c....c..', '...ccc..', 'cccc....', '....cc..', '.ccc..c.', '.....c..', '........'],
  horn: ['......b.', '.....bb.', '....bwb.', '.bbbbwb.', 'bwwwwwb.', '.bbbbb..', '........', '........'],
  cloud: ['..gg....', '.gggg.g.', 'gggggggg', 'gggggggg', '.gggggg.', '..g..g..', '.g..g...', '........'],
  xbow: ['k.......', '.k......', 'bbbbbbbw', '.k......', 'k.......', '........', '........', '........']
});
/* 技能標籤（0.3.18 直覺化）：類型、目標、元素、武器、效果；只放分類，不放數字（連鎖幾次、幾下寫在說明裡）。
   技能頁、技能石詳情、商店、戰鬥按鈕共用；回傳 [文字, 類別]，類別決定顏色 */
const SKTYPE = q =>
  q.pet
    ? '召喚'
    : q.cry
      ? '戰吼'
      : q.aura
        ? '光環'
        : q.kind === 'heal'
          ? '治癒'
          : q.kind === 'buff'
            ? '增益'
            : q.kind === 'spell'
              ? '法術'
              : '攻擊';
function skTags(q) {
  const out = [[SKTYPE(q), 'ty']],
    dmg = !q.pet && (q.kind === 'attack' || q.kind === 'spell');
  if (dmg) {
    out.push(
      q.tg === 'all'
        ? ['全體', 'tg all']
        : q.tg === 'rand'
          ? ['隨機', 'tg rand']
          : q.chain
            ? ['連鎖', 'tg rand']
            : q.proj
              ? ['投射', 'tg rand']
              : ['單體', 'tg']
    );
    const el = q.kind === 'spell' ? q.el || 'phys' : 'phys';
    out.push([EL[el], 'el ' + el]);
    if (q.addEl && q.addEl[0] !== el) out.push([EL[q.addEl[0]], 'el ' + q.addEl[0]]);
  } else if (q.kind === 'heal') out.push([q.healAll ? '全隊' : '自身', 'tg']);
  else if (q.cry) out.push(['全體', 'tg all']);
  else if (!q.pet) out.push([(q.buff && q.buff.party) || q.party ? '全隊' : '自身', 'tg']);
  if (q.w) out.push([WTAGN[q.w], 'w']);
  if (q.oh) out.push(['盾', 'w']);
  if (q.hits > 1 && q.tg !== 'rand') out.push(['連擊', 'eff']);
  if (q.bleed) out.push(['流血', 'eff']);
  if (q.poison) out.push(['中毒', 'eff']);
  if (q.ignite) out.push(['燃燒', 'eff']);
  if (q.stun) out.push(['暈眩', 'eff']);
  if (q.freeze) out.push(['凍結', 'eff']);
  if (q.mark) out.push(['標記', 'eff']);
  if (q.curse) out.push(['詛咒', 'eff']);
  if (q.exec) out.push(['斬殺', 'eff']);
  if (q.slow) out.push(['衰老', 'eff']);
  if (q.vulP || q.vulE) out.push(['易傷', 'eff']);
  if (q.dmark) out.push(['印記', 'eff']);
  if (q.det) out.push(['引爆', 'eff']);
  if (q.consume === 'frozen') out.push(['碎冰', 'eff']);
  if (q.charge) out.push(['蓄力', 'eff']);
  if (q.combo) out.push(['連續', 'eff']);
  if (q.sac || q.cmd) out.push([q.sac ? '犧牲' : '號令', 'pet']);
  if (q.totem) out.push(['圖騰', 'pet']);
  if (q.turret) out.push(['砲台', 'pet']);
  if (q.trap) out.push(['陷阱', 'pet']);
  if (q.mine) out.push(['地雷', 'pet']);
  if (q.guard) out.push(['格擋', 'buf']);
  if (q.lifeCost) out.push(['耗血', 'eff']);
  return out;
}
/* n 是最多幾個，from 1 是略過類型（技能石格子的底色已經代表類型） */
const skTagHTML = (q, n = 99, from = 0) =>
  `<span class="sktags">${skTags(q)
    .slice(from, from + n)
    .map(([t, c]) => `<i class="skt ${c}">${t}</i>`)
    .join('')}</span>`;
/* 戰鬥按鈕上的短標籤：目標＋傷害類型 */
const skShort = q =>
  skTags(q)
    .slice(1, 3)
    .map(t => t[0])
    .join('・');
/* ---- 0.3.19：每顆技能都有自己的條件或取捨（欄位說明在 battle.js 的「技能的通用條件與狀態連動」） ---- */
const SK_COND = {
  power: { vsCrit: 'stun' },
  bash: { stun: 0.25 },
  whirl: { foes: -10 },
  fire: { ignite: 1 },
  ice: { vs: { frozen: 80 }, consume: 'frozen' },
  heal: { healLow: 8 },
  double: { combo: 12 },
  bolt: { vs: { shock: 40 } },
  pierce: { brk: 50 },
  meteor: { ignite: 1 },
  blizzard: {},
  cleave: { foes: 8 },
  sanct: {},
  slash2: { fullT: 40 },
  swordwave: { combo: 10 },
  thrust: { vs: { bleed: 15 } },
  riposte: {},
  spinslash: { foes: -10 },
  crosscut: { vs: { bleed: 10 } },
  mirage: { vs: { mark: 30 } },
  judgment: { lowT: 60 },
  bladestorm: {},
  groundslam: { foes: 6 },
  bonecrush: { vsCrit: 'stun' },
  shatter: { vs: { frozen: 100 }, consume: 'frozen' },
  warcry: { cry: 1, perFoe: { more: 6 }, buff: { id: 'warcry', n: '戰吼', turns: 3, more: 10 } },
  axespin: { foes: -10 },
  execute: { mult: 1.1, lowT: 90 },
  earthquake: { foes: 6 },
  thorhammer: { shockChain: 1 },
  javelin: { fullT: 30 },
  lunge: { combo: 12 },
  sweep: { foes: 6 },
  impale: { vs: { bleed: 15 } },
  spinspear: { foes: -8 },
  valkyrie: { vs: { mark: 40 } },
  skypierce: { vs: { shock: 30 } },
  firearrow: { vs: { burn: 30 } },
  rainarrow: { foes: 6 },
  snipe: { mult: 1.8, charge: 2.6 },
  burstbolt: { killBoom: 40 },
  lightarrow: { shockChain: 1 },
  barrage: { combo: 10 },
  starfall: {},
  deadeye: { charge: 2.2 },
  backstab: { fullT: 60 },
  bloodclaw: { vs: { bleed: 12 } },
  venomfang: { vs: { poison: 8 } },
  shadowstep: {},
  smokebomb: {},
  fanblade: { vs: { mark: 25 } },
  whirlblade: { foes: -8 },
  frenzy: { combo: 15 },
  assassinate: { lowT: 60 },
  shadowclone: {},
  flamelance: { vs: { burn: 40 } },
  firewall: { ignite: 1 },
  fireburst: { det: 'burn', detMul: 0.8 },
  combust: { det: 'burn', detMul: 1.4 },
  inferno: { vs: { burn: 30 } },
  phoenix: {},
  iceshard: { vs: { frozen: 40 } },
  iceshield: {},
  coldsnap: { vs: { frozen: 60 }, consume: 'frozen' },
  glacier: {},
  arc: { shockChain: 2 },
  chainlight: { shockChain: 1 },
  ballight: { combo: 10 },
  thunderstorm: {},
  smite: { vs: { shock: 50 } },
  bonewall: {},
  bonespear: { petN: 10 },
  bloodlance: { lowMe: 8 },
  doom: { spreadSt: 1 },
  bloodburst: { lowMe: 6 },
  wraith: {},
  sacrifice: {},
  banner: {},
  haste: { buff: { id: 'haste', n: '加速', turns: 3, dodge: 10, more: 5, spd: 25 } },
  tauntroar: {
    cry: 1,
    perFoe: { arm: 15 },
    buff: { id: 'taunt', n: '嘲諷', turns: 3, taunt: 100, arm: 20 }
  },
  purify: { healLow: 10 },
  regenaura: {},
  holyshield: {},
  inspire: { cry: 1, party: 1 },
  battlecry: { cry: 1, party: 1, perFoe: { more: 4 } },
  exorcise: { vs: { curse: 40 } },
  possession: {},
  summongod: {}
};
for (const k in SK_COND) if (SKILLS[k]) Object.assign(SKILLS[k], SK_COND[k]);
/* 0.3.19 新技能：戰吼、條件攻擊、狀態連動（碎冰、引爆、毒爆）、召喚連動、詛咒 */
Object.assign(SKILLS, {
  /* ---- 戰吼（任何武器都能用） ---- */
  daunt: {
    name: '震懾怒吼',
    mp: 6,
    kind: 'buff',
    cry: 1,
    perFoe: { more: 9 },
    cryCurse: 10,
    buff: { id: 'daunt', n: '震懾', turns: 3, more: 4 },
    icon: 'horn',
    r: 3
  },
  provoke: {
    name: '挑釁戰吼',
    mp: 5,
    kind: 'buff',
    cry: 1,
    perFoe: { arm: 20, dmgRed: 3 },
    buff: { id: 'provoke', n: '挑釁', turns: 3, taunt: 150 },
    icon: 'horn',
    r: 3
  },
  valor: { name: '戰意激昂', mp: 7, kind: 'buff', cry: 1, emp: 45, icon: 'horn', r: 4 },
  dread: {
    name: '恐懼咆哮',
    mp: 8,
    kind: 'buff',
    cry: 1,
    fear: 30,
    cryCurse: 15,
    cryWeak: 10,
    icon: 'horn',
    r: 4
  },
  ancestral: {
    name: '先祖吶喊',
    mp: 9,
    kind: 'buff',
    cry: 1,
    party: 1,
    avUp: 50,
    buff: { id: 'ancestral', n: '先祖', turns: 2, spd: 15 },
    icon: 'horn',
    r: 4
  },
  bloodhowl: {
    name: '血怒嚎叫',
    mp: 0,
    kind: 'buff',
    cry: 1,
    lifeCost: 0.1,
    lowMeBuff: 9,
    buff: { id: 'bloodhowl', n: '血怒', turns: 3, more: 8 },
    icon: 'horn',
    r: 5
  },
  /* ---- 條件攻擊（不限武器） ---- */
  reckless: { name: '捨身一擊', mp: 3, kind: 'attack', mult: 3, lifeCost: 0.15, icon: 'axe', r: 4 },
  rend: { name: '撕裂斬', mp: 7, kind: 'attack', mult: 1, vs: { bleed: 25 }, icon: 'sword', r: 4 },
  chainslash: { name: '連環斬', mp: 5, kind: 'attack', w: 'sword', mult: 0.95, combo: 20, icon: 'sword', r: 4 },
  blastarrow: {
    name: '爆裂箭',
    mp: 8,
    kind: 'attack',
    w: 'bow',
    mult: 1.3,
    killBoom: 60,
    fx: 'arrow',
    icon: 'flame',
    r: 4
  },
  /* ---- 狀態連動 ---- */
  detonate: {
    name: '爆燃',
    mp: 8,
    kind: 'spell',
    el: 'fire',
    mult: 0.6,
    det: 'burn',
    detMul: 1.5,
    fx: 'fire',
    icon: 'flame',
    r: 4
  },
  iceshatter: {
    name: '碎冰',
    mp: 8,
    kind: 'spell',
    el: 'cold',
    mult: 1,
    vs: { frozen: 120 },
    consume: 'frozen',
    fx: 'ice',
    icon: 'ice',
    r: 4
  },
  venomburst: {
    name: '毒爆',
    mp: 8,
    kind: 'spell',
    el: 'phys',
    mult: 0.4,
    det: 'poison',
    detMul: 1.2,
    icon: 'leaf',
    r: 4
  },
  toxin: { name: '毒雲', mp: 9, kind: 'spell', el: 'phys', mult: 0.25, tg: 'all', poison: 3, icon: 'cloud', r: 3 },
  /* ---- 召喚連動 ---- */
  corpseburst: { name: '屍爆', mp: 7, kind: 'spell', el: 'phys', mult: 0, sac: 3, icon: 'skull', r: 4 },
  command: { name: '號令', mp: 6, kind: 'buff', cmd: 1, icon: 'skull', r: 4 },
  /* ---- 詛咒與印記（本身傷害低，要接後續） ---- */
  frailty: { name: '脆弱', mp: 5, kind: 'spell', el: 'phys', mult: 0.2, vulP: 30, icon: 'eye', r: 3 },
  elemweak: { name: '元素弱化', mp: 6, kind: 'spell', el: 'cold', mult: 0.2, vulE: 30, icon: 'eye', r: 4 },
  enfeeble: { name: '衰老', mp: 6, kind: 'spell', el: 'phys', mult: 0.2, slow: 3, icon: 'eye', r: 4 },
  deathmark: { name: '死亡印記', mp: 5, kind: 'spell', el: 'phys', mult: 0.3, dmark: 1, icon: 'skull', r: 3 },
  /* ---- 治療 ---- */
  emergency: { name: '緊急治療', mp: 6, kind: 'heal', heal: 0.12, healLow: 25, icon: 'heart', r: 3 }
});
/* ---- 0.3.20 輔助寶石（取代刻印）：插在技能石的插槽裡，改變技能怎麼運作 ----
   sup 是戰鬥的輔助效果（跟昇華共用 supOf）、sk 是加到技能上的條件欄位（數值相加，vs 合併）、mp 是魔力消耗 +%；
   req 是能插的技能（標籤）、conv 轉換類一顆技能石只能一個、t 是商店的 T 級；lin 是族裔輔助（機制菁英／首領掉落，同名一個角色只能用一顆）、m 是機制 */
const SUPG = [
  { k: 'sp_dmg', n: '強化', t: 1, req: 'dmg', mp: 15, sup: { more: 25 }, d: '傷害 +25%（總乘）' },
  { k: 'sp_proj', n: '多重投射', t: 1, req: 'one', mp: 30, sup: { proj: 2, more: -25 }, d: '多 2 支投射物，傷害 -25%' },
  { k: 'sp_chain', n: '連鎖', t: 1, req: 'one', mp: 30, sup: { chain: 2, more: -15 }, d: '連鎖 +2 次，傷害 -15%' },
  { k: 'sp_bleed', n: '撕裂', t: 1, req: 'attack', mp: 10, sup: { bleed: 35 }, d: '35% 機率流血' },
  { k: 'sp_ign', n: '引燃', t: 1, req: 'fire', mp: 15, sk: { ignite: 1 }, d: '火焰傷害必定燃燒' },
  { k: 'sp_crit', n: '精準', t: 1, req: 'dmg', mp: 15, sup: { crit: 8, cm: 30 }, d: '暴擊率 +8%、暴擊傷害 +30%' },
  {
    k: 'sp_aoe',
    n: '範圍擴大',
    t: 2,
    req: 'one',
    mp: 40,
    conv: 1,
    sup: { aoe: 1 },
    d: '單體技能改成打全體（65% 傷害）'
  },
  { k: 'sp_poison', n: '毒性', t: 2, req: 'attack', mp: 15, sup: { poison: 60 }, d: '60% 機率中毒（會疊層）' },
  { k: 'sp_stun', n: '震盪', t: 2, req: 'attack', mp: 15, sup: { stun: 25 }, d: '25% 機率暈眩' },
  {
    k: 'sp_echo',
    n: '迴響',
    t: 2,
    req: 'spell',
    mp: 40,
    sup: { echo: 35, more: -10 },
    d: '35% 機率整個法術再放一次，傷害 -10%'
  },
  { k: 'sp_multi', n: '多重打擊', t: 2, req: 'attack', mp: 35, sup: { hits: 1, more: -20 }, d: '多打 1 下，傷害 -20%' },
  { k: 'sp_pen', n: '穿透', t: 2, req: 'dmg', mp: 15, sup: { pen: 30, penRes: 15 }, d: '無視 30% 護甲、穿透 15% 抗性' },
  { k: 'sp_exec', n: '斬首', t: 3, req: 'dmg', mp: 15, sup: { exec: 50 }, d: '對生命低於 35% 的敵人傷害 +50%' },
  { k: 'sp_leech', n: '吸血', t: 3, req: 'attack', mp: 10, sup: { leech: 4 }, d: '吸血 +4%' },
  { k: 'sp_dot', n: '持續傷害', t: 3, req: 'dmg', mp: 15, sup: { dot: 40 }, d: '燃燒、中毒、流血傷害 +40%' },
  {
    k: 'sp_pet',
    n: '召喚強化',
    t: 3,
    req: 'pet',
    mp: 30,
    sup: { petMax: 1, petTurns: 2, petPct: 25 },
    d: '召喚上限 +1、多存在 6 秒、召喚物傷害 +25%'
  },
  { k: 'sp_shatter', n: '碎冰', t: 3, req: 'cold', mp: 15, sk: { vs: { frozen: 60 } }, d: '對凍結的目標傷害 +60%' },
  { k: 'sp_combo', n: '連續', t: 3, req: 'dmg', mp: 10, sk: { combo: 12 }, d: '連續使用每次傷害 +12%（最多 5 層）' },
  { k: 'sp_foes', n: '群戰', t: 4, req: 'dmg', mp: 15, sk: { foes: 8 }, d: '每多一隻敵人傷害 +8%' },
  {
    k: 'sp_charge',
    n: '蓄力',
    t: 4,
    req: 'dmg',
    mp: 20,
    conv: 1,
    sk: { charge: 2.3 },
    d: '這次行動先蓄力，下次放同一招 ×2.3'
  },
  { k: 'sp_boom', n: '爆裂', t: 4, req: 'dmg', mp: 20, sk: { killBoom: 40 }, d: '擊殺時把這下傷害的 40% 炸到其他敵人' },
  {
    k: 'sp_cd',
    n: '冷卻縮減',
    t: 4,
    req: 'cd',
    mp: 20,
    sup: { cdr: 25, more: -10 },
    d: '冷卻 -25%（冷卻縮減最多 40%），傷害 -10%'
  },
  { k: 'sp_heavy', n: '重擊', t: 5, req: 'attack', mp: 15, sk: { vsCrit: 'stun' }, d: '對暈眩的目標必定暴擊' },
  { k: 'sp_cry', n: '咆哮', t: 5, req: 'cry', mp: 20, sk: { cryMul: 50 }, d: '戰吼依敵人數的效果 +50%' },
  { k: 'sp_ext', n: '延長', t: 5, req: 'buff', mp: 20, sk: { buffT: 1 }, d: '增益多 3 秒' },
  /* ---- 族裔輔助：一個角色同名只能用一顆 ---- */
  {
    k: 'ln_soul',
    n: '靈魂收割',
    lin: 1,
    m: 'ud',
    req: 'dmg',
    mp: 20,
    sk: { killBoom: 50 },
    sup: { leech: 4 },
    d: '擊殺時爆炸（50%）、吸血 +4%'
  },
  {
    k: 'ln_legion',
    n: '不死軍團',
    lin: 1,
    m: 'ud',
    req: 'pet',
    mp: 30,
    sup: { petMax: 2, petTurns: 3, petPct: 40 },
    d: '召喚上限 +2、多存在 9 秒、召喚物傷害 +40%'
  },
  {
    k: 'ln_wrath',
    n: '憤怒之罪',
    lin: 1,
    m: 'sin',
    req: 'dmg',
    mp: 0,
    sup: { more: 60 },
    sk: { lifeCost: 0.05 },
    d: '傷害 +60%，每次消耗 5% 生命'
  },
  {
    k: 'ln_greed',
    n: '貪婪之罪',
    lin: 1,
    m: 'sin',
    req: 'dmg',
    mp: 20,
    sk: { lowMe: 12 },
    d: '自己每少 10% 生命，傷害 +12%'
  },
  {
    k: 'ln_void',
    n: '冥府穿透',
    lin: 1,
    m: 'uw',
    req: 'dmg',
    mp: 20,
    sup: { pen: 40, penRes: 30 },
    d: '無視 40% 護甲、穿透 30% 抗性'
  },
  {
    k: 'ln_hellfire',
    n: '冥火轉化',
    lin: 1,
    m: 'uw',
    req: 'attack',
    mp: 20,
    sk: { addEl: ['fire', 0.6], ignite: 1 },
    d: '附加 60% 火焰、必定燃燒'
  },
  {
    k: 'ln_pack',
    n: '獸群',
    lin: 1,
    m: 'hunt',
    req: 'one',
    mp: 30,
    sup: { proj: 3, more: -15 },
    d: '多 3 支投射物，傷害 -15%'
  },
  {
    k: 'ln_frenzy',
    n: '狂獵',
    lin: 1,
    m: 'hunt',
    req: 'attack',
    mp: 30,
    sup: { hits: 2, more: -10 },
    d: '多打 2 下，傷害 -10%'
  },
  {
    k: 'ln_fatal',
    n: '致命',
    lin: 1,
    m: 'wild',
    req: 'dmg',
    mp: 20,
    sup: { crit: 20, cm: 60 },
    d: '暴擊率 +20%、暴擊傷害 +60%'
  },
  {
    k: 'ln_iron',
    n: '鐵壁',
    lin: 1,
    m: 'wild',
    req: 'buff',
    mp: 20,
    sk: { buffT: 2 },
    sup: { cdr: 20 },
    d: '增益多 6 秒、冷卻 -20%'
  },
  /* 0.3.25：魔霧（四凶、燭龍）從七宗罪拆開，有自己的族裔輔助 */
  {
    k: 'ln_chaos',
    n: '混沌無面',
    lin: 1,
    m: 'mist',
    req: 'dmg',
    mp: 30,
    sup: { echo: 30, more: -10 },
    d: '30% 機率整個技能再放一次，傷害 -10%'
  },
  {
    k: 'ln_candle',
    n: '燭照',
    lin: 1,
    m: 'mist',
    req: 'dmg',
    mp: 20,
    sk: { ignite: 1, vs: { burn: 40 } },
    d: '必定燃燒，對燃燒的目標傷害 +40%'
  },
  {
    k: 'ln_maw',
    n: '饕餮之口',
    lin: 1,
    m: 'mist',
    req: 'dmg',
    mp: 20,
    sup: { leech: 5 },
    sk: { lowT: 50 },
    d: '吸血 +5%，對生命低於 30% 的目標傷害 +50%'
  }
];
const SUPGI = Object.fromEntries(SUPG.map(s => [s.k, s]));
const SUPM = {
  ud: '亡靈軍團',
  mist: '魔霧（四凶、燭龍）',
  sin: '七罪（攻佔城鎮、七罪的王）',
  uw: '冥府',
  hunt: '狩獵十二生肖',
  wild: '野外紅名危險怪'
};
/* 輔助寶石能不能插在這個技能上（看技能標籤） */
const SUPREQ = {
  dmg: q => !q.pet && !q.sac && (q.kind === 'attack' || q.kind === 'spell'),
  one: q => SUPREQ.dmg(q) && q.tg !== 'all',
  attack: q => q.kind === 'attack',
  spell: q => q.kind === 'spell' && !q.pet && !q.sac,
  fire: q => SUPREQ.dmg(q) && ((q.kind === 'spell' && q.el === 'fire') || (q.addEl && q.addEl[0] === 'fire')),
  cold: q => SUPREQ.dmg(q) && ((q.kind === 'spell' && q.el === 'cold') || (q.addEl && q.addEl[0] === 'cold')),
  pet: q => !!q.pet,
  cd: q => (q.cd || 0) > 0,
  cry: q => !!q.cry,
  buff: q => !!q.buff
};
const SUPREQN = {
  dmg: '傷害技能',
  one: '非全體的傷害技能',
  attack: '攻擊技能',
  spell: '法術',
  fire: '火焰技能',
  cold: '冰冷技能',
  pet: '召喚技能',
  cd: '有冷卻的技能',
  cry: '戰吼',
  buff: '有增益的技能'
};
const supFits = (k, q) => !!SUPGI[k] && SUPREQ[SUPGI[k].req](q);
/* ---- 0.3.21 光環（比照 PoE2 的精魄）：放在光環欄、不佔技能欄，開著就一直生效，預留精魄；精魄不夠就開不了 ----
   aura 是加到角色身上的屬性（隨等級每級 +3%、品質每 1% +1%）、spirit 是預留的精魄、party 組隊時隊友也受益（pb 是給隊友的增益）、avs 對有該狀態的敵人加傷（所有技能） */
Object.assign(SKILLS, {
  anger: { name: '憤怒', kind: 'aura', mp: 0, spirit: 20, aura: { firePct: 22, addFire: 3 }, icon: 'flame', r: 3 },
  hatred: { name: '憎恨', kind: 'aura', mp: 0, spirit: 20, aura: { coldPct: 22, addCold: 3 }, icon: 'ice', r: 3 },
  wrathaura: { name: '雷霆', kind: 'aura', mp: 0, spirit: 20, aura: { lightPct: 22, addLight: 3 }, icon: 'bolt', r: 3 },
  determination: { name: '決心', kind: 'aura', mp: 0, spirit: 20, aura: { armorPct: 35 }, icon: 'shield', r: 3 },
  purityaura: { name: '純淨', kind: 'aura', mp: 0, spirit: 20, aura: { resAll: 12 }, icon: 'shield', r: 4 },
  grace: { name: '優雅', kind: 'aura', mp: 0, spirit: 25, aura: { evade: 8, speed: 2 }, icon: 'wind', r: 4 },
  precise: {
    name: '精準光環',
    kind: 'aura',
    mp: 0,
    spirit: 25,
    aura: { critPct: 6, critMulti: 15 },
    icon: 'eye',
    r: 4
  },
  vitality: { name: '活力', kind: 'aura', mp: 0, spirit: 15, aura: { regen: 4 }, icon: 'heart', r: 3 },
  clarity: { name: '清晰', kind: 'aura', mp: 0, spirit: 15, aura: { manaRegen: 3 }, icon: 'drop', r: 3 },
  scorch: {
    name: '灼燒光環',
    kind: 'aura',
    mp: 0,
    spirit: 25,
    aura: { firePct: 8 },
    avs: { burn: 25 },
    icon: 'flame',
    r: 5
  },
  cruelty: {
    name: '殘酷光環',
    kind: 'aura',
    mp: 0,
    spirit: 25,
    aura: { physPct: 8 },
    avs: { bleed: 6 },
    icon: 'sword',
    r: 5
  }
});
/* 原本的戰旗、再生光環改成光環（組隊時隊友也受益） */
Object.assign(SKILLS.banner, {
  kind: 'aura',
  mp: 0,
  spirit: 25,
  party: 1,
  aura: { physPct: 12, critPct: 3 },
  pb: { more: 10, crit: 3 }
});
delete SKILLS.banner.buff;
delete SKILLS.banner.cd;
Object.assign(SKILLS.regenaura, { kind: 'aura', mp: 0, spirit: 20, party: 1, aura: { regen: 5 }, pb: { hot: 3 } });
delete SKILLS.regenaura.heal;
delete SKILLS.regenaura.healAll;
delete SKILLS.regenaura.cd;
/* ---- 0.3.22 圖騰、砲台、陷阱、地雷（欄位說明在 battle.js 的「戰場單位」） ---- */
Object.assign(SKILLS, {
  firetotem: {
    name: '火焰圖騰',
    mp: 12,
    kind: 'spell',
    el: 'fire',
    mult: 1.6,
    ignite: 1,
    totem: { n: '火焰圖騰', hp: 0.35, turns: 4, mul: 0.7 },
    fx: 'fire',
    icon: 'flame',
    r: 4
  },
  guardtotem: {
    name: '守護圖騰',
    mp: 10,
    kind: 'spell',
    el: 'phys',
    mult: 0,
    totem: { n: '守護圖騰', hp: 0.9, turns: 5, taunt: 250 },
    icon: 'shield',
    r: 3
  },
  crytotem: {
    name: '戰吼圖騰',
    mp: 10,
    kind: 'buff',
    totem: { n: '戰吼圖騰', hp: 0.4, turns: 4, cry: { n: '戰吼圖騰', turns: 2, more: 10 } },
    icon: 'horn',
    r: 4
  },
  frosttrap: {
    name: '冰霜陷阱',
    mp: 7,
    kind: 'spell',
    el: 'cold',
    mult: 1.5,
    freeze: 0.8,
    trap: { n: '冰霜陷阱', mul: 1.3 },
    fx: 'ice',
    icon: 'ice',
    r: 3
  },
  poisontrap: {
    name: '毒霧陷阱',
    mp: 9,
    kind: 'spell',
    el: 'phys',
    mult: 0.35,
    tg: 'all',
    poison: 4,
    trap: { n: '毒霧陷阱', mul: 1.2 },
    icon: 'cloud',
    r: 4
  },
  blastmine: {
    name: '爆裂地雷',
    mp: 5,
    kind: 'spell',
    el: 'fire',
    mult: 1.1,
    ignite: 1,
    mine: { n: '爆裂地雷', mul: 1 },
    fx: 'fire',
    icon: 'flame',
    r: 3
  },
  ballista: {
    name: '弩砲台',
    mp: 10,
    kind: 'spell',
    el: 'phys',
    mult: 1.2,
    turret: { n: '弩砲台', turns: 4, mul: 0.8 },
    fx: 'arrow',
    icon: 'xbow',
    r: 3
  },
  tesla: {
    name: '雷電砲台',
    mp: 12,
    kind: 'spell',
    el: 'light',
    mult: 0.8,
    chain: 2,
    turret: { n: '雷電砲台', turns: 4, mul: 0.8 },
    fx: 'bolt',
    icon: 'bolt',
    r: 4
  }
});
/* 轉圖騰、轉陷阱、轉地雷：任何傷害技能都能變成單位（轉換類） */
SUPREQ.unit = q => SUPREQ.dmg(q) && !q.totem && !q.turret && !q.trap && !q.mine;
SUPREQN.unit = '還不是圖騰／陷阱／地雷的傷害技能';
SUPG.splice(
  25,
  0,
  {
    k: 'sp_totem',
    n: '轉圖騰',
    t: 3,
    req: 'unit',
    mp: 30,
    conv: 1,
    sk: { totem: { hp: 0.35, turns: 4, mul: 0.65 } },
    d: '改成放圖騰：之後每 3 秒由圖騰施放（65% 傷害、12 秒、圖騰會被打）'
  },
  {
    k: 'sp_trap',
    n: '轉陷阱',
    t: 3,
    req: 'unit',
    mp: 20,
    conv: 1,
    sk: { trap: { mul: 1.25 } },
    d: '改成佈置陷阱：下一隻行動的敵人先觸發（125% 傷害）'
  },
  {
    k: 'sp_mine',
    n: '轉地雷',
    t: 4,
    req: 'unit',
    mp: 15,
    conv: 1,
    sk: { mine: { mul: 0.85 } },
    d: '改成放地雷：疊好幾顆一起引爆（每顆 85%，每多一顆 +10%）'
  }
);
for (const sp of SUPG.slice(25, 28)) SUPGI[sp.k] = sp;

/* ================= 0.3.35 冷卻（秒）與自動施放 =================
   即時行動條：速度 10 大約每 3 秒行動一次。全部技能重新審視冷卻：
   便宜的單體技能不冷卻（每次行動都能用）；強力單體、控制、引爆、詛咒 3～6 秒；全體 3～8 秒；
   終極（r5）9～15 秒；增益、戰吼、召喚、圖騰比效果時間長一點（效果 9 秒 → 冷卻 12 秒），才不會一直掛著 */
const SK_CD = {
  bash: 4,
  whirl: 3,
  ice: 3,
  heal: 6,
  pierce: 3,
  meteor: 12,
  blizzard: 12,
  cleave: 6,
  sanct: 15,
  slash2: 3,
  riposte: 9,
  spinslash: 3,
  crosscut: 3,
  mirage: 3,
  judgment: 12,
  bladestorm: 9,
  groundslam: 6,
  bonecrush: 3,
  shatter: 4,
  warcry: 15,
  axespin: 4,
  execute: 3,
  rage: 12,
  earthquake: 12,
  thorhammer: 9,
  phalanx: 12,
  sweep: 3,
  impale: 3,
  spinspear: 4,
  valkyrie: 9,
  skypierce: 12,
  markshot: 3,
  apshot: 3,
  frostarrow: 3,
  trapshot: 5,
  rainarrow: 4,
  snipe: 3,
  burstbolt: 4,
  lightarrow: 3,
  poisoncloud: 5,
  starfall: 15,
  deadeye: 9,
  backstab: 3,
  shadowstep: 9,
  smokebomb: 9,
  fanblade: 3,
  whirlblade: 4,
  assassinate: 12,
  shadowclone: 15,
  firewall: 4,
  fireburst: 4,
  combust: 4,
  inferno: 12,
  phoenix: 18,
  frostnova: 6,
  iceshield: 12,
  frostchain: 4,
  coldsnap: 4,
  glacier: 12,
  chainlight: 3,
  staticfield: 4,
  thunderstorm: 12,
  smite: 9,
  skeleton: 12,
  bonewall: 12,
  weaken: 6,
  skelmage: 12,
  doom: 6,
  decay: 6,
  bloodburst: 4,
  vampire: 3,
  wraith: 18,
  sacrifice: 15,
  haste: 12,
  tauntroar: 12,
  purify: 6,
  holyshield: 12,
  inspire: 15,
  battlecry: 18,
  talisman: 5,
  exorcise: 4,
  possession: 15,
  summongod: 18,
  daunt: 12,
  provoke: 12,
  valor: 12,
  dread: 12,
  ancestral: 15,
  bloodhowl: 15,
  reckless: 6,
  blastarrow: 3,
  detonate: 4,
  iceshatter: 3,
  venomburst: 4,
  toxin: 5,
  corpseburst: 5,
  command: 9,
  frailty: 6,
  elemweak: 6,
  enfeeble: 6,
  deathmark: 6,
  emergency: 8,
  firetotem: 9,
  guardtotem: 12,
  crytotem: 12,
  frosttrap: 3,
  poisontrap: 4,
  ballista: 9,
  tesla: 9
};
for (const k in SKILLS) if (SKILLS[k].kind !== 'aura' && k !== 'attack') SKILLS[k].cd = SK_CD[k] || 0;
/* 自動施放：行動條滿了、冷卻好、付得起就自動放（照技能欄順序，第一個能放的）；代價是傷害降低、消耗增加、多冷卻 2 秒 */
SUPREQ.act = q => q.kind !== 'aura';
SUPREQN.act = '主動技能';
SUPG.push({
  k: 'sp_auto',
  n: '自動施放',
  t: 1,
  req: 'act',
  mp: 30,
  sup: { auto: 1, more: -20, cdAdd: 2 },
  d: '行動條滿了 0.8 秒內沒下指令，冷卻好就自動施放（照技能欄順序）・傷害 -20%、冷卻 +2 秒'
});
SUPGI.sp_auto = SUPG[SUPG.length - 1];

/* ================= 0.3.36 技能池擴充、武器限制補齊、混沌傷害 =================
   w 是武器類型（sword／axe／bow／dagger／spear／staff），'melee' 是弓弩以外的武器；oh: 'shield' 要拿盾。 */
/* 武器限制補齊：連射、毒箭、穿雲箭是弓；盾擊、盾衝要盾；其他通用攻擊限近戰 */
for (const k of ['double', 'poison', 'pierce']) SKILLS[k].w = 'bow';
for (const k of ['power', 'whirl', 'cleave', 'reckless', 'rend']) SKILLS[k].w = 'melee';
SKILLS.bash.oh = 'shield';
/* 偏黑暗的法術改成混沌傷害 */
for (const k of ['decay', 'doom', 'vampire', 'toxin', 'weaken']) SKILLS[k].el = 'chaos';
Object.assign(SKILLS, {
  /* ---- 混沌法術 ---- */
  chaosbolt: {
    name: '混沌箭',
    mp: 6,
    kind: 'spell',
    el: 'chaos',
    mult: 1.3,
    fx: 'pierce',
    icon: 'eclipse',
    r: 3,
    vs: { poison: 10 }
  },
  blight: {
    name: '枯萎',
    mp: 8,
    kind: 'spell',
    el: 'chaos',
    mult: 0.5,
    tg: 'all',
    poison: 3,
    fx: 'pierce',
    icon: 'cloud',
    r: 3
  },
  essence: {
    name: '靈魂吸取',
    mp: 9,
    kind: 'spell',
    el: 'chaos',
    mult: 1.1,
    poison: 4,
    leech: 8,
    fx: 'pierce',
    icon: 'ghost',
    r: 4
  },
  contagion: {
    name: '瘟疫',
    mp: 10,
    kind: 'spell',
    el: 'chaos',
    mult: 0.45,
    tg: 'all',
    poison: 4,
    vs: { poison: 10 },
    fx: 'pierce',
    icon: 'splat',
    r: 4
  },
  shadowbolt: {
    name: '暗影飛彈',
    mp: 9,
    kind: 'spell',
    el: 'chaos',
    mult: 0.9,
    proj: 2,
    fx: 'pierce',
    icon: 'moon',
    r: 4
  },
  chaoschain: {
    name: '混沌鎖鏈',
    mp: 10,
    kind: 'spell',
    el: 'chaos',
    mult: 0.9,
    chain: 3,
    fx: 'pierce',
    icon: 'chain',
    r: 4
  },
  despair: {
    name: '絕望詛咒',
    mp: 9,
    kind: 'spell',
    el: 'chaos',
    mult: 0.3,
    tg: 'all',
    curse: 25,
    fx: 'pierce',
    icon: 'mask',
    r: 4
  },
  voidrift: {
    name: '虛空裂隙',
    mp: 18,
    kind: 'spell',
    el: 'chaos',
    mult: 1.5,
    tg: 'all',
    vs: { poison: 20 },
    fx: 'pierce',
    icon: 'eclipse',
    r: 5
  },
  souldrain: {
    name: '魂噬',
    mp: 16,
    kind: 'spell',
    el: 'chaos',
    mult: 3,
    lowT: 50,
    leech: 10,
    fx: 'pierce',
    icon: 'scythe',
    r: 5
  },
  /* ---- 法杖 ---- */
  staffstrike: { name: '杖擊', mp: 4, kind: 'attack', w: 'staff', mult: 1.5, stun: 0.15, icon: 'mace', r: 3 },
  staffspin: {
    name: '旋杖',
    mp: 8,
    kind: 'attack',
    w: 'staff',
    mult: 0.9,
    tg: 'all',
    fx: 'whirl',
    icon: 'whirl',
    r: 3
  },
  pressure: {
    name: '點穴',
    mp: 7,
    kind: 'attack',
    w: 'staff',
    mult: 1.2,
    stun: 0.4,
    vsCrit: 'stun',
    icon: 'needle',
    r: 4
  },
  mantra: { name: '咒杖', mp: 8, kind: 'attack', w: 'staff', mult: 1.1, addEl: ['light', 0.5], icon: 'bagua', r: 4 },
  sweepstaff: {
    name: '棍掃千軍',
    mp: 11,
    kind: 'attack',
    w: 'staff',
    mult: 0.75,
    hits: 2,
    tg: 'all',
    fx: 'whirl',
    icon: 'wind',
    r: 4
  },
  skypillar: {
    name: '天柱崩',
    mp: 17,
    kind: 'attack',
    w: 'staff',
    mult: 2.4,
    tg: 'all',
    stun: 0.3,
    icon: 'mountain',
    r: 5
  },
  /* ---- 斧鎚 ---- */
  hack: { name: '劈砍', mp: 5, kind: 'attack', w: 'axe', mult: 1.5, bleed: 25, icon: 'axe', r: 3 },
  berserk: { name: '狂戰斬', mp: 8, kind: 'attack', w: 'axe', mult: 1.3, lowMe: 8, icon: 'fang2', r: 4 },
  titanfall: {
    name: '泰坦之擊',
    mp: 17,
    kind: 'attack',
    w: 'axe',
    mult: 2.4,
    tg: 'all',
    stun: 0.3,
    icon: 'crack',
    r: 5
  },
  /* ---- 匕首爪 ---- */
  venomblade: {
    name: '毒刃',
    mp: 5,
    kind: 'attack',
    w: 'dagger',
    mult: 1.1,
    addEl: ['chaos', 0.5],
    poison: 3,
    icon: 'dagger',
    r: 3
  },
  flurry: { name: '疾風刃', mp: 9, kind: 'attack', w: 'dagger', mult: 0.55, hits: 3, combo: 10, icon: 'claw', r: 4 },
  eviscerate: {
    name: '開膛',
    mp: 15,
    kind: 'attack',
    w: 'dagger',
    mult: 2.2,
    vs: { bleed: 30, poison: 20 },
    icon: 'bloodclaw',
    r: 5
  },
  /* ---- 矛 ---- */
  spearrush: { name: '突進', mp: 5, kind: 'attack', w: 'spear', mult: 1.5, crit: 8, icon: 'spear', r: 3 },
  spearwall: { name: '槍林', mp: 10, kind: 'attack', w: 'spear', mult: 0.9, tg: 'all', icon: 'spear', r: 4 },
  dragonspear: {
    name: '龍槍',
    mp: 16,
    kind: 'attack',
    w: 'spear',
    mult: 2.3,
    chain: 2,
    addEl: ['fire', 0.3],
    icon: 'dragon',
    r: 5
  },
  /* ---- 劍 ---- */
  blink: { name: '瞬斬', mp: 6, kind: 'attack', w: 'sword', mult: 0.75, hits: 2, crit: 10, icon: 'flash', r: 3 },
  iai: { name: '居合', mp: 9, kind: 'attack', w: 'sword', mult: 1.6, charge: 2, crit: 15, icon: 'katana', r: 4 },
  /* ---- 弓弩 ---- */
  rotarrow: {
    name: '腐蝕箭',
    mp: 8,
    kind: 'attack',
    w: 'bow',
    mult: 1.2,
    addEl: ['chaos', 0.6],
    poison: 3,
    fx: 'arrow',
    icon: 'arrow',
    r: 4
  },
  /* ---- 盾 ---- */
  shieldcharge: {
    name: '盾衝',
    mp: 6,
    kind: 'attack',
    oh: 'shield',
    mult: 1.2,
    stun: 0.3,
    guard: 1,
    icon: 'shield',
    r: 3
  },
  shieldwall: {
    name: '盾牆',
    mp: 8,
    kind: 'buff',
    oh: 'shield',
    buff: { id: 'shieldwall', n: '盾牆', turns: 3, dmgRed: 25, arm: 30, taunt: 50 },
    icon: 'shieldstar',
    r: 4
  },
  /* ---- 精魄光環 ---- */
  envy: { name: '怨毒', kind: 'aura', mp: 0, spirit: 20, aura: { chaosPct: 22, addChaos: 3 }, icon: 'eclipse', r: 3 },
  wardaura: { name: '虛空守護', kind: 'aura', mp: 0, spirit: 20, aura: { resChaos: 25 }, icon: 'moonshield', r: 3 },
  discipline: { name: '紀律', kind: 'aura', mp: 0, spirit: 20, aura: { shieldPct: 10, mana: 20 }, icon: 'bagua', r: 3 },
  zealotry: { name: '狂熱', kind: 'aura', mp: 0, spirit: 25, aura: { spellPct: 18, critPct: 3 }, icon: 'sun', r: 4 },
  hasteaura: { name: '迅捷', kind: 'aura', mp: 0, spirit: 25, aura: { speed: 3, evade: 6 }, icon: 'feather', r: 4 },
  pride: { name: '傲慢', kind: 'aura', mp: 0, spirit: 25, aura: { physPct: 25, flatPhys: 2 }, icon: 'lion', r: 4 },
  malice: { name: '惡意', kind: 'aura', mp: 0, spirit: 25, aura: { dotPct: 25, poisonCh: 10 }, icon: 'fang', r: 4 },
  meditate: { name: '冥想', kind: 'aura', mp: 0, spirit: 30, aura: { cdr: 8 }, icon: 'hourglass', r: 5 },
  bloodlust: { name: '嗜血', kind: 'aura', mp: 0, spirit: 25, aura: { leech: 2, lowLife: 15 }, icon: 'bloodmoon', r: 5 }
});
/* 新技能的冷卻（秒） */
for (const [k, v] of Object.entries({
  blight: 4,
  essence: 3,
  contagion: 5,
  shadowbolt: 3,
  chaoschain: 3,
  despair: 6,
  voidrift: 12,
  souldrain: 9,
  staffspin: 3,
  pressure: 4,
  mantra: 0,
  sweepstaff: 4,
  skypillar: 12,
  berserk: 3,
  titanfall: 12,
  flurry: 0,
  eviscerate: 9,
  spearwall: 4,
  dragonspear: 9,
  iai: 3,
  rotarrow: 3,
  shieldcharge: 4,
  shieldwall: 12
}))
  SKILLS[k].cd = v;
for (const k in SKILLS) if (SKILLS[k].cd == null && SKILLS[k].kind !== 'aura' && k !== 'attack') SKILLS[k].cd = 0;
/* ---- 0.3.36 輔助寶石：附加、轉換、集中、殘暴、控制毀滅、快速、效率…（參考 PoE／PoE2） ---- */
SUPREQ.melee = q => q.kind === 'attack' && q.w !== 'bow';
SUPREQ.aoe = q => SUPREQ.dmg(q) && q.tg === 'all';
SUPREQ.chaos = q =>
  SUPREQ.dmg(q) && ((q.kind === 'spell' && q.el === 'chaos') || (q.addEl && q.addEl[0] === 'chaos') || !!q.poison);
SUPREQN.melee = '近戰攻擊';
SUPREQN.aoe = '打全部敵人的傷害技能';
SUPREQN.chaos = '混沌或中毒技能';
for (const sp of [
  { k: 'sp_gfire', n: '附加火焰', t: 1, req: 'dmg', mp: 15, sup: { gFire: 25 }, d: '另外附加這下傷害 25% 的火焰傷害' },
  { k: 'sp_gcold', n: '附加冰冷', t: 1, req: 'dmg', mp: 15, sup: { gCold: 25 }, d: '另外附加這下傷害 25% 的冰冷傷害' },
  {
    k: 'sp_glight',
    n: '附加閃電',
    t: 1,
    req: 'dmg',
    mp: 15,
    sup: { gLight: 25 },
    d: '另外附加這下傷害 25% 的閃電傷害'
  },
  {
    k: 'sp_gchaos',
    n: '附加混沌',
    t: 2,
    req: 'dmg',
    mp: 20,
    sup: { gChaos: 20 },
    d: '另外附加這下傷害 20% 的混沌傷害'
  },
  { k: 'sp_eff', n: '效率', t: 1, req: 'act', mp: 0, sup: { cost: 30, more: -10 }, d: '魔力消耗 -30%，傷害 -10%' },
  {
    k: 'sp_cvfire',
    n: '物理轉火焰',
    t: 2,
    req: 'attack',
    mp: 15,
    conv: 1,
    sup: { cvFire: 60 },
    d: '60% 物理傷害轉成火焰'
  },
  {
    k: 'sp_cvcold',
    n: '物理轉冰冷',
    t: 2,
    req: 'attack',
    mp: 15,
    conv: 1,
    sup: { cvCold: 60 },
    d: '60% 物理傷害轉成冰冷'
  },
  {
    k: 'sp_cvlight',
    n: '物理轉閃電',
    t: 2,
    req: 'attack',
    mp: 15,
    conv: 1,
    sup: { cvLight: 60 },
    d: '60% 物理傷害轉成閃電'
  },
  {
    k: 'sp_fastatk',
    n: '快速攻擊',
    t: 2,
    req: 'attack',
    mp: 20,
    sup: { avBack: 25, more: -10 },
    d: '用完行動條先補 25%（更快再行動），傷害 -10%'
  },
  {
    k: 'sp_fastcast',
    n: '快速施法',
    t: 2,
    req: 'spell',
    mp: 20,
    sup: { avBack: 25, more: -10 },
    d: '用完行動條先補 25%（更快再行動），傷害 -10%'
  },
  { k: 'sp_mpleech', n: '魔力吸取', t: 2, req: 'dmg', mp: 10, sup: { mpLeech: 4 }, d: '造成傷害的 4% 回復魔力' },
  { k: 'sp_melee', n: '近戰物理', t: 3, req: 'melee', mp: 20, sup: { physMore: 30 }, d: '物理傷害 +30%（總乘）' },
  {
    k: 'sp_elefocus',
    n: '元素集中',
    t: 3,
    req: 'dmg',
    mp: 25,
    sup: { eleMore: 35, noAil: 1 },
    d: '元素傷害 +35%（總乘），不能造成異常狀態'
  },
  {
    k: 'sp_brutal',
    n: '殘暴',
    t: 3,
    req: 'attack',
    mp: 20,
    sup: { physMore: 45, noEle: 1 },
    d: '物理傷害 +45%（總乘），不再造成元素與混沌傷害'
  },
  {
    k: 'sp_ctrl',
    n: '控制毀滅',
    t: 3,
    req: 'spell',
    mp: 25,
    sup: { more: 30, noCrit: 1 },
    d: '傷害 +30%（總乘），不會暴擊'
  },
  {
    k: 'sp_conc',
    n: '範圍集中',
    t: 3,
    req: 'aoe',
    mp: 25,
    sup: { more: 30, foesCap: 3 },
    d: '打全部敵人的技能傷害 +30%（總乘），最多打 3 隻'
  },
  { k: 'sp_ailx', n: '異常延長', t: 3, req: 'dmg', mp: 15, sup: { ailDur: 1 }, d: '燃燒、中毒、流血、感電多 3 秒' },
  {
    k: 'sp_cvchaos',
    n: '元素轉混沌',
    t: 4,
    req: 'dmg',
    mp: 20,
    conv: 1,
    sup: { cvChaos: 50 },
    d: '50% 元素傷害轉成混沌'
  },
  {
    k: 'sp_wither',
    n: '枯萎',
    t: 4,
    req: 'chaos',
    mp: 20,
    sup: { gChaos: 10, poison: 30 },
    d: '附加 10% 混沌傷害，30% 機率中毒'
  }
]) {
  SUPG.push(sp);
  SUPGI[sp.k] = sp;
}
/* 0.3.40 召喚與戰場單位的輔助 */
SUPREQ.unitsk = q => !!(q.totem || q.turret || q.trap || q.mine);
SUPREQN.unitsk = '圖騰、砲台、陷阱、地雷';
for (const sp of [
  {
    k: 'sp_deploy',
    n: '部署強化',
    t: 3,
    req: 'unitsk',
    mp: 20,
    sup: { more: 30 },
    d: '圖騰、砲台、陷阱、地雷的傷害 +30%（總乘）'
  },
  {
    k: 'sp_deployfast',
    n: '快速部署',
    t: 2,
    req: 'unitsk',
    mp: 15,
    sup: { avBack: 30 },
    d: '放置後行動條先補 30%（更快再行動）'
  },
  { k: 'sp_horde', n: '召喚狂熱', t: 3, req: 'pet', mp: 20, sup: { petPct: 35 }, d: '召喚物傷害 +35%' }
]) {
  SUPG.push(sp);
  SUPGI[sp.k] = sp;
}
