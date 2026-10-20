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
  meteor: { cd: 2, ignite: 1 },
  blizzard: { cd: 2 },
  cleave: { foes: 8 },
  sanct: { cd: 3 },
  slash2: { fullT: 40 },
  swordwave: { combo: 10 },
  thrust: { vs: { bleed: 15 } },
  riposte: { cd: 2 },
  spinslash: { foes: -10 },
  crosscut: { vs: { bleed: 10 } },
  mirage: { vs: { mark: 30 } },
  judgment: { cd: 3, lowT: 60 },
  bladestorm: { cd: 2 },
  groundslam: { foes: 6 },
  bonecrush: { vsCrit: 'stun' },
  shatter: { vs: { frozen: 100 }, consume: 'frozen' },
  warcry: { cry: 1, cd: 3, perFoe: { more: 6 }, buff: { id: 'warcry', n: '戰吼', turns: 3, more: 10 } },
  axespin: { foes: -10 },
  execute: { mult: 1.1, lowT: 90 },
  earthquake: { cd: 2, foes: 6 },
  thorhammer: { cd: 2, shockChain: 1 },
  javelin: { fullT: 30 },
  lunge: { combo: 12 },
  sweep: { foes: 6 },
  impale: { vs: { bleed: 15 } },
  spinspear: { foes: -8 },
  valkyrie: { cd: 2, vs: { mark: 40 } },
  skypierce: { cd: 2, vs: { shock: 30 } },
  firearrow: { vs: { burn: 30 } },
  rainarrow: { foes: 6 },
  snipe: { mult: 1.8, charge: 2.6 },
  burstbolt: { killBoom: 40 },
  lightarrow: { shockChain: 1 },
  barrage: { combo: 10 },
  starfall: { cd: 3 },
  deadeye: { cd: 2, charge: 2.2 },
  backstab: { fullT: 60 },
  bloodclaw: { vs: { bleed: 12 } },
  venomfang: { vs: { poison: 8 } },
  shadowstep: { cd: 2 },
  smokebomb: { cd: 2 },
  fanblade: { vs: { mark: 25 } },
  whirlblade: { foes: -8 },
  frenzy: { combo: 15 },
  assassinate: { cd: 3, lowT: 60 },
  shadowclone: { cd: 3 },
  flamelance: { vs: { burn: 40 } },
  firewall: { ignite: 1 },
  fireburst: { det: 'burn', detMul: 0.8 },
  combust: { det: 'burn', detMul: 1.4 },
  inferno: { cd: 3, vs: { burn: 30 } },
  phoenix: { cd: 4 },
  iceshard: { vs: { frozen: 40 } },
  iceshield: { cd: 3 },
  coldsnap: { vs: { frozen: 60 }, consume: 'frozen' },
  glacier: { cd: 3 },
  arc: { shockChain: 2 },
  chainlight: { shockChain: 1 },
  ballight: { combo: 10 },
  thunderstorm: { cd: 3 },
  smite: { cd: 2, vs: { shock: 50 } },
  bonewall: { cd: 3 },
  bonespear: { petN: 10 },
  bloodlance: { lowMe: 8 },
  doom: { spreadSt: 1 },
  bloodburst: { lowMe: 6 },
  wraith: { cd: 3 },
  sacrifice: { cd: 4 },
  banner: { cd: 3 },
  haste: { cd: 2, buff: { id: 'haste', n: '加速', turns: 3, dodge: 10, more: 5, spd: 25 } },
  tauntroar: {
    cry: 1,
    cd: 3,
    perFoe: { arm: 15 },
    buff: { id: 'taunt', n: '嘲諷', turns: 3, taunt: 100, arm: 20 }
  },
  purify: { healLow: 10 },
  regenaura: { cd: 2 },
  holyshield: { cd: 3 },
  inspire: { cry: 1, party: 1, cd: 3 },
  battlecry: { cry: 1, party: 1, cd: 4, perFoe: { more: 4 } },
  exorcise: { vs: { curse: 40 } },
  possession: { cd: 3 },
  summongod: { cd: 4 }
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
    cd: 3,
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
    cd: 3,
    perFoe: { arm: 20, dmgRed: 3 },
    buff: { id: 'provoke', n: '挑釁', turns: 3, taunt: 150 },
    icon: 'horn',
    r: 3
  },
  valor: { name: '戰意激昂', mp: 7, kind: 'buff', cry: 1, cd: 3, emp: 45, icon: 'horn', r: 4 },
  dread: {
    name: '恐懼咆哮',
    mp: 8,
    kind: 'buff',
    cry: 1,
    cd: 3,
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
    cd: 4,
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
    cd: 3,
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
  command: { name: '號令', mp: 6, kind: 'buff', cmd: 1, cd: 2, icon: 'skull', r: 4 },
  /* ---- 詛咒與印記（本身傷害低，要接後續） ---- */
  frailty: { name: '脆弱', mp: 5, kind: 'spell', el: 'phys', mult: 0.2, vulP: 30, icon: 'eye', r: 3 },
  elemweak: { name: '元素弱化', mp: 6, kind: 'spell', el: 'cold', mult: 0.2, vulE: 30, icon: 'eye', r: 4 },
  enfeeble: { name: '衰老', mp: 6, kind: 'spell', el: 'phys', mult: 0.2, slow: 3, icon: 'eye', r: 4 },
  deathmark: { name: '死亡印記', mp: 5, kind: 'spell', el: 'phys', mult: 0.3, dmark: 1, icon: 'skull', r: 3 },
  /* ---- 治療 ---- */
  emergency: { name: '緊急治療', mp: 6, kind: 'heal', heal: 0.12, healLow: 25, cd: 2, icon: 'heart', r: 3 }
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
    d: '召喚上限 +1、多存在 2 回合、召喚物傷害 +25%'
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
    d: '先蓄一回合，下次放同一招 ×2.3'
  },
  { k: 'sp_boom', n: '爆裂', t: 4, req: 'dmg', mp: 20, sk: { killBoom: 40 }, d: '擊殺時把這下傷害的 40% 炸到其他敵人' },
  {
    k: 'sp_cd',
    n: '冷卻縮減',
    t: 4,
    req: 'cd',
    mp: 20,
    sk: { cd: -1 },
    sup: { more: -10 },
    d: '冷卻 -1 回合，傷害 -10%'
  },
  { k: 'sp_heavy', n: '重擊', t: 5, req: 'attack', mp: 15, sk: { vsCrit: 'stun' }, d: '對暈眩的目標必定暴擊' },
  { k: 'sp_cry', n: '咆哮', t: 5, req: 'cry', mp: 20, sk: { cryMul: 50 }, d: '戰吼依敵人數的效果 +50%' },
  { k: 'sp_ext', n: '延長', t: 5, req: 'buff', mp: 20, sk: { buffT: 1 }, d: '增益多 1 回合' },
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
    d: '召喚上限 +2、多存在 3 回合、召喚物傷害 +40%'
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
    sk: { buffT: 2, cd: -1 },
    d: '增益多 2 回合、冷卻 -1'
  }
];
const SUPGI = Object.fromEntries(SUPG.map(s => [s.k, s]));
const SUPM = { ud: '亡靈軍團', sin: '魔霧與七宗罪', uw: '冥府', hunt: '狩獵十二生肖', wild: '野外紅名危險怪' };
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
