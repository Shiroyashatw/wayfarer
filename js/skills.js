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
  else if (!q.pet) out.push([q.buff && q.buff.party ? '全隊' : '自身', 'tg']);
  if (q.w) out.push([WTAGN[q.w], 'w']);
  if (q.hits > 1 && q.tg !== 'rand') out.push(['連擊', 'eff']);
  if (q.bleed) out.push(['流血', 'eff']);
  if (q.poison) out.push(['中毒', 'eff']);
  if (q.burn) out.push(['燃燒', 'eff']);
  if (q.stun) out.push(['暈眩', 'eff']);
  if (q.freeze) out.push(['凍結', 'eff']);
  if (q.mark) out.push(['標記', 'eff']);
  if (q.curse) out.push(['詛咒', 'eff']);
  if (q.exec) out.push(['斬殺', 'eff']);
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
