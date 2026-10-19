/* 漫步勇者 · 0.3 昇華：城鎮的昇華試煉（Lv20／30／45／60 各 2 點，共 8 點）、昇華職業與分支、分支節點、重選
   一條分支 19 個節點：入口（免費）→ 第一層 4 組「小→大」→ 第二層 3 組 → 終極 2 組（互斥）；8 點一定拿到 4 個大點
   大點的效果：st 直接加到屬性；sup 是輔助效果，依技能標籤套用（'T' 代表分支的標籤）；cost 是終極的代價 */
'use strict';
/* 昇華大點用的 8×8 圖示（配色 w 白、k 黑、b 棕、y 金、r 紅、c 青、g 綠） */
Object.assign(ICONS, {
  needle: ['.......w', '......w.', '.....w..', '....w...', '...w....', '..w.....', '.y......', 'y.......'],
  burst: ['...y....', 'y..y..y.', '.y.y.y..', '..yyy...', 'yyywyyy.', '..yyy...', '.y.y.y..', 'y..y..y.'],
  spark: ['...w....', '...w....', '..www...', 'wwwywww.', '..www...', '...w....', '...w....', '........'],
  swords: ['w.....w.', '.w...w..', '..w.w...', '...w....', '..w.w...', '.b...b..', 'b.....b.', '........'],
  whirl: ['..cccc..', '.c....c.', 'c..cc..c', 'c.c..c.c', 'c.c.c..c', 'c..c...c', '.c....c.', '..cccc..'],
  flash: ['......yy', '.....yy.', '....yy..', '...yyyy.', '....yy..', '...yy...', '..yy....', '.yy.....'],
  crown: ['........', 'y..y..y.', 'yy.y.yy.', 'yyyyyyy.', 'yrryrry.', 'yyyyyyy.', '........', '........'],
  moon: ['..www...', '.ww.....', 'ww......', 'ww......', 'ww......', '.ww.....', '..www...', '........'],
  stars: ['.y...y..', 'yyy.yyy.', '.y...y..', '...y....', '..yyy...', '...y....', '........', '........'],
  fist: ['.rrrr...', 'rwrwrr..', 'rrrrrr..', 'rrrrrr..', '.rrrrr..', '.rrrr...', '..rr....', '........'],
  anvil: ['........', 'wwwwwww.', '.wwwwwww', '..wccw..', '..wccw..', '.wwwwww.', 'wwwwwwww', '........'],
  crack: ['b...b...', '.b.b....', '..b..b..', '.b..b.b.', 'b..b...b', '..b.b...', '.b...b..', 'b.....b.'],
  bone: ['ww....ww', 'www..www', '.ww..ww.', '..wwww..', '..wwww..', '.ww..ww.', 'www..www', 'ww....ww'],
  sun: ['y..y..y.', '.y.y.y..', '..yyy...', 'yyywyyy.', '..yyy...', '.y.y.y..', 'y..y..y.', '........'],
  chain: ['ww......', 'w.w.....', '.ww.ww..', '...w..w.', '...ww.w.', '.....ww.', '......w.', '........'],
  scale: ['...y....', 'yyyyyyy.', 'y..y..y.', 'yy.y.yy.', '...y....', '...y....', '.yyyyy..', '........'],
  multi: ['.....w.w', '....w.w.', 'w..w.w..', '.w.w.w..', '..w.w...', '.b.w....', 'b.b.....', '........'],
  target: ['.rrrrr..', 'r.....r.', 'r.www.r.', 'r.wrw.r.', 'r.www.r.', 'r.....r.', '.rrrrr..', '........'],
  ghost: ['.wwwww..', 'wwwwwww.', 'wkwwkww.', 'wwwwwww.', 'wwwwwww.', 'wwwwwww.', 'w.w.w.w.', '........'],
  drop: ['...r....', '...r....', '..rrr...', '.rrrrr..', '.rwrrr..', '.rrrrr..', '..rrr...', '........'],
  fang: ['wwwwwww.', 'w.w.w.w.', 'w.w.w.w.', '.w...w..', '........', '.w...w..', 'w.w.w.w.', 'wwwwwww.'],
  trap: ['w.w.w.w.', 'wwwwwww.', 'w..r..w.', 'w.rrr.w.', 'wwwwwww.', 'w.w.w.w.', '........', '........'],
  bomb: ['.....y..', '....b...', '..www...', '.wkkkw..', 'wkwkkkw.', 'wkkkkkw.', '.wkkkw..', '..www...'],
  splat: ['r.....r.', '.r.r.r..', '..rrr...', 'rrrrrrr.', '..rrr...', '.r.r.r..', 'r.....r.', '........'],
  hourglass: ['yyyyyyy.', '.wwwww..', '..www...', '...w....', '..w.w...', '.wwwww..', 'yyyyyyy.', '........'],
  potion: ['..kk....', '..ww....', '..ww....', '.wrrw...', 'wrrrrw..', 'wrrrrw..', '.wwww...', '........'],
  paw: ['.b...b..', 'bbb.bbb.', '.b...b..', '...b....', '.bbbbb..', 'bbbbbbb.', '.bbbbb..', '........'],
  feather: ['......cc', '.....ccc', '....cccc', '...cccc.', '..cccc..', '.ccc....', 'c.......', '........'],
  fang2: ['.r...r..', 'rrr.rrr.', 'rwrrrwr.', 'rrrrrrr.', '.rrrrr..', '..r.r...', '........', '........'],
  heartx: ['.rr.rr..', 'rrrrrrr.', 'rrrrrrr.', 'rrwwwrr.', '.rrwrr..', '..rrr...', '...r....', '........'],
  mask: ['.yyyyy..', 'yyyyyyy.', 'ykkykky.', 'yyyyyyy.', 'yyrrryy.', '.yyyyy..', '..yyy...', '........'],
  lotus: ['...w....', '..www...', '.w.w.w..', 'ww.w.ww.', '.wwwww..', 'ggggggg.', '.ggggg..', '........'],
  flaskg: ['..kk....', '..ww....', '..ww....', '.wggw...', 'wggggw..', 'wggggw..', '.wwww...', '........'],
  /* 終極專用 */
  katana: ['.......w', '......wc', '.....wc.', '....wc..', '...wc...', '.yyc....', '.yy.....', 'y.......'],
  mountain: ['...w....', '..www...', '..wbw...', '.wbbbw..', '.bbbbb..', 'wbbbbbw.', 'bbbbbbbb', '........'],
  standard: ['y.......', 'yrrrrr..', 'yryyrr..', 'yrrrrr..', 'yrr.....', 'y.......', 'y.......', 'yy......'],
  shieldstar: ['.wwwwww.', 'wwwywwww', 'wwyyyww.', 'wyyyyyw.', 'wwyyyww.', '.wywyw..', '..www...', '...w....'],
  dragon: ['.r...r..', 'rrr.rrr.', 'rryrryr.', 'rrrrrrr.', '.rwrwr..', '.rrrrr..', '..r.r...', '........'],
  gavel: ['.bbbb...', '.bbbb...', '..bb....', '...b....', '....b...', '.....b..', 'yyyyyy..', '........'],
  lion: ['.yyyyy..', 'yybbbyy.', 'ybkbkby.', 'ybbbbby.', 'yybrbyy.', '.ybbby..', '..yyy...', '........'],
  wings: ['w......w', 'ww....ww', 'www..www', 'wwwyywww', '.wwyyww.', '..w..w..', '........', '........'],
  eclipse: ['..yyyy..', '.ykkkky.', 'ykkkkkky', 'ykkkkkky', 'ykkkkkky', '.ykkkky.', '..yyyy..', '........'],
  scythe: ['.wwwww..', 'w....ww.', '......w.', '.....b..', '....b...', '...b....', '..b.....', '.b......'],
  bloodclaw: ['r.r.r...', 'r.r.r...', 'r.r.r...', '.r.r.r..', '..rrrr..', '..rrrr..', '...rr...', '........'],
  boom: ['y.r.y.r.', '.yrrry..', 'rrywyrr.', '.ywwwy..', 'rrywyrr.', '.yrrry..', 'y.r.y.r.', '........'],
  bigflame: ['...r....', '..rr..r.', '.rryr.r.', '.ryyrrr.', 'rryyyrr.', 'ryywyyr.', 'ryywwyr.', '.rrrrr..'],
  snow: ['c..c..c.', '.c.c.c..', '..ccc...', 'cccwccc.', '..ccc...', '.c.c.c..', 'c..c..c.', '........'],
  thor: ['.wwwww..', '.wwwww..', '...b..y.', '...b.y..', '...byyy.', '...b..y.', '...b.y..', '........'],
  witch: ['...w....', '..ww....', '..www...', '.wwwww..', '.wyyyw..', 'wwwwwww.', '.rkrkr..', '..rrr...'],
  bloodmoon: ['..rrr...', '.rr.....', 'rr......', 'rr......', 'rr......', '.rr.....', '..rrr...', '........'],
  bagua: ['.wwwww..', 'w.www.w.', 'www.www.', 'w.w.w.w.', 'www.www.', 'w.www.w.', '.wwwww..', '........'],
  flysword: ['w.......', '.w......', '..w....c', '...w..c.', '....wc..', '....cw..', '...c..y.', '..c....y'],
  deity: ['.yyyyy..', 'y.....y.', '..www...', '.wkwkw..', '.wwwww..', '..wrw...', '.yyyyy..', 'yyyyyyy.'],
  starsword: ['...y....', '..yyy...', '...y.w..', '....w...', '...w.w..', '..w.....', '.w......', 'b.......'],
  stone: ['..rrr...', '.ryrrr..', 'rywrrrr.', 'rrrrrrr.', 'rrrrrrr.', '.rrrrr..', '..rrr...', '........'],
  moonshield: ['.cccccc.', 'cc.wwwcc', 'c.ww...c', 'c.w....c', 'c.ww...c', '.c.www.c', '..cccc..', '...cc...'],
  sacredtree: ['..ggg...', '.ggggg..', 'ggggggg.', '.ggggg..', '...b....', '...b....', '.bbbbb..', '........'],
  howl: ['.....bb.', '....bbb.', '...bbwb.', '..bbbbb.', '.bbbb...', 'bb.bb...', 'b..b....', '........']
});
/* ================= data ================= */
const ASC_LV = [20, 30, 45, 60],
  ASC_MAX = 8;
/* N(名稱, 圖示, 屬性, 輔助, 代價) */
const N = (n, g, st, sup, cost) => ({ n, g, st: st || {}, sup: sup || [], cost: cost || null });
const ASC = [
  {
    k: 'warlord',
    n: '鬥神',
    soul: 'knight',
    ic: 'swords',
    d: '以力量壓制戰場的戰士：雙手大劍、巨鎚，或高舉戰旗帶領隊伍。',
    br: [
      {
        k: 'blade',
        n: '斬鐵劍聖',
        tag: 'sword',
        col: '#c8d0dc',
        ic: 'sword',
        d: '雙手大劍：破甲、大範圍斬擊、一閃',
        sm: [
          ['physPct', 8],
          ['critMulti', 10],
          ['armor', 30]
        ],
        en: { physPct: 10 },
        t1: [
          N('破甲劍勢', 'needle', 0, [['T', { pen: 30 }]]),
          N('橫掃千軍', 'burst', 0, [['T', { aoe: 1 }]]),
          N('劍心', 'spark', 0, [['T', { crit: 8, cm: 30 }]]),
          N('迅劍', 'feather', 0, [['T', { hits: 1, more: -20 }]])
        ],
        t2: [
          [0, N('斬鐵', 'swords', 0, [['T', { exec: 50 }]])],
          [1, N('劍刃風暴', 'whirl', { dbl: 10 }, [['T', { more: 25 }]])],
          [2, N('一閃', 'flash', { extraTurn: 15 })]
        ],
        u: [
          [0, N('劍聖', 'katana', 0, [['T', { more: 50, crit: 10 }]], { lifeMore: -15 })],
          [2, N('無我之境', 'moon', { dodgeCrit: 1, extraTurn: 15, evade: 10 }, 0, { armorMore: -40 })]
        ]
      },
      {
        k: 'crusher',
        n: '碎岩者',
        tag: 'axe',
        col: '#b08050',
        ic: 'mace',
        d: '巨鎚與巨斧：暈眩、碎甲、震地',
        sm: [
          ['physPct', 8],
          ['stunCh', 3],
          ['life', 25]
        ],
        en: { stunCh: 5 },
        t1: [
          N('震盪', 'stars', 0, [['T', { stun: 20 }]]),
          N('粉碎', 'anvil', 0, [['T', { pen: 35 }]]),
          N('狂暴', 'fist', { lowLife: 30 }),
          N('重擊', 'mace', 0, [['T', { more: 25, cost: -25 }]])
        ],
        t2: [
          [0, N('地震', 'crack', 0, [['T', { aoe: 1 }]])],
          [1, N('碎骨', 'bone', 0, [['T', { exec: 40, bleed: 25 }]])],
          [2, N('不屈', 'heartx', { killHeal: 8, dmgRed: 8 })]
        ],
        u: [
          [0, N('泰坦', 'mountain', 0, [['T', { more: 60, stun: 20 }]], { speed: -6 })],
          [2, N('狂戰之魂', 'fang2', { lowLife: 60, leech: 4 }, 0, { dmgRed: -15 })]
        ]
      },
      {
        k: 'banner',
        n: '戰旗統帥',
        tag: 'buff',
        col: '#e8873a',
        ic: 'flag',
        d: '戰旗：增益、隊友加成、鐵壁',
        sm: [
          ['allyDmg', 2],
          ['armorPct', 10],
          ['life', 20]
        ],
        en: { allyDmg: 3 },
        t1: [
          N('戰旗高揚', 'flag', { allyDmg: 6 }, [['T', { cost: 30 }]]),
          N('軍令', 'horn', { extraTurn: 10 }),
          N('鐵壁', 'shield', { armorPct: 40, taunt: 40 }),
          N('激勵', 'star', { dmgRed: 5 }, [['all', { more: 10 }]])
        ],
        t2: [
          [0, N('戰意', 'fist', { killStack: 4, killMax: 8 })],
          [2, N('統帥之盾', 'anvil', { block: 20 })],
          [3, N('鼓舞', 'heartx', { healAll: 40, regen: 10 })]
        ],
        u: [
          [0, N('萬軍之王', 'standard', { allyDmg: 15, dmgMore: 15 }, 0, { hpDrain: 3 })],
          [1, N('不落戰旗', 'castle', { shieldPct: 30, taunt: 100, dmgRed: 15 }, 0, { dmgMore: -20 })]
        ]
      }
    ]
  },
  {
    k: 'guardian',
    n: '守護者',
    soul: 'knight',
    ic: 'shield',
    d: '守護隊友的騎士：劍盾格擋、方陣長槍，或以聖錘審判。',
    br: [
      {
        k: 'paladin',
        n: '聖盾騎士',
        tag: 'sword',
        col: '#9fd4ef',
        ic: 'shield',
        d: '劍與盾：格擋、反彈、嘲諷',
        sm: [
          ['armorPct', 10],
          ['block', 3],
          ['life', 25]
        ],
        en: { block: 8 },
        t1: [
          N('盾牆', 'shield', { block: 15 }),
          N('反擊', 'swords', { reflectPct: 20 }),
          N('聖光劍', 'sun', { resAll: 10 }, [['T', { more: 15 }]]),
          N('挑釁', 'horn', { taunt: 60, dmgRed: 8 })
        ],
        t2: [
          [0, N('堅守', 'castle', { shieldPct: 20 })],
          [1, N('荊棘', 'crack', { reflectPct: 30, armor: 80 })],
          [3, N('守護誓言', 'heartx', { healAll: 30, allyDmg: 4 })]
        ],
        u: [
          [0, N('不朽', 'shieldstar', { block: 30, dmgRed: 15 }, 0, { speed: -5 })],
          [1, N('復仇者', 'fist', { reflectPct: 80, lifePct: 10 }, 0, { noDodge: 1 })]
        ]
      },
      {
        k: 'phalanx',
        n: '方陣長槍',
        tag: 'spear',
        col: '#c9a45c',
        ic: 'spear',
        d: '矛與盾：穿刺、槍陣、不動如山',
        sm: [
          ['physPct', 8],
          ['armor', 30],
          ['critPct', 2]
        ],
        en: { physPct: 8, armorPct: 10 },
        t1: [
          N('穿刺', 'needle', 0, [['T', { pen: 30 }]]),
          N('長槍陣', 'chain', 0, [['T', { chain: 1 }]]),
          N('架槍', 'shield', { block: 12, armorPct: 30 }),
          N('突進', 'feather', 0, [['T', { hits: 1, more: -15 }]])
        ],
        t2: [
          [0, N('貫心', 'target', 0, [['T', { crit: 10, cm: 40 }]])],
          [1, N('槍林', 'burst', 0, [['T', { aoe: 1 }]])],
          [2, N('不動', 'anvil', { taunt: 50, dmgRed: 10 })]
        ],
        u: [
          [0, N('龍膽', 'dragon', 0, [['T', { more: 50, exec: 30 }]], { lifeMore: -15 })],
          [2, N('方陣之主', 'castle', { block: 25, reflectPct: 40, armorMore: 30 }, 0, { dmgMore: -15 })]
        ]
      },
      {
        k: 'judge',
        n: '審判者',
        tag: 'axe',
        col: '#ffe9a0',
        ic: 'sun',
        d: '聖錘：雷電、治癒、審判',
        sm: [
          ['lightPct', 10],
          ['healPct', 10],
          ['life', 20]
        ],
        en: { addLight: 5 },
        t1: [
          N('雷錘', 'bolt', { addLight: 8 }, [['T', { more: 15 }]]),
          N('聖光', 'sun', { healPct: 30, healAll: 20 }),
          N('審判', 'scale', 0, [['light', { penRes: 20 }]]),
          N('雷霆', 'chain', 0, [['light', { chain: 1 }]])
        ],
        t2: [
          [0, N('天罰', 'stars', 0, [['T', { stun: 20 }]])],
          [1, N('聖療', 'heartx', { regen: 15, killHeal: 5 })],
          [3, N('雷獄', 'flash', { ailDur: 1 }, [['light', { ail: 60 }]])]
        ],
        u: [
          [
            0,
            N(
              '審判之日',
              'gavel',
              0,
              [
                ['T', { more: 40 }],
                ['light', { more: 40 }]
              ],
              { hpDrain: 3 }
            )
          ],
          [1, N('聖光庇護', 'sacredtree', { healAll: 80, shieldPct: 25 }, 0, { dmgMore: -25 })]
        ]
      }
    ]
  },
  {
    k: 'amazon',
    n: '亞馬遜',
    soul: 'ranger',
    ic: 'spear',
    d: '叢林的女戰士：弓箭獵手、戰矛女武神，或操控月光的祭司。',
    br: [
      {
        k: 'hunter',
        n: '叢林獵手',
        tag: 'bow',
        col: '#7bd36b',
        ic: 'arrow',
        d: '弓：多重射擊、標記獵物、擊殺疊層',
        sm: [
          ['critPct', 2],
          ['speed', 2],
          ['evade', 4]
        ],
        en: {},
        enSup: [['T', { more: 10 }]],
        t1: [
          N('多重箭', 'multi', 0, [['T', { proj: 2 }]]),
          N('疾風之弦', 'feather', { speed: 4 }, [['T', { cost: 20 }]]),
          N('毒藤箭', 'leaf', { poisonPct: 40 }, [['T', { poison: 100 }]]),
          N('標記獵物', 'target', { markFirst: 20 })
        ],
        t2: [
          [0, N('穿心', 'needle', 0, [['T', { pen: 30, penRes: 15 }]])],
          [1, N('連珠', 'arrow', 0, [['T', { echo: 25 }]])],
          [3, N('林間步', 'wind', { dodgeCrit: 1, evade: 6 })]
        ],
        u: [
          [0, N('百獸之王', 'lion', { killStack: 4, killMax: 10, keepStacks: 1 }, 0, { noPotion: 1 })],
          [2, N('影獵者', 'ghost', { evade: 15, counter: 70 }, 0, { lifeMore: -15 })]
        ]
      },
      {
        k: 'valkyrie',
        n: '戰矛女武神',
        tag: 'spear',
        col: '#ff8a6a',
        ic: 'spear',
        d: '矛：投矛、突刺連擊、低血爆發',
        sm: [
          ['physPct', 8],
          ['critPct', 2],
          ['life', 20]
        ],
        en: {},
        enSup: [['T', { more: 10 }]],
        t1: [
          N('投矛', 'spear', 0, [['T', { proj: 1 }]]),
          N('突刺連擊', 'multi', 0, [['T', { hits: 1 }]]),
          N('戰意', 'fist', { lowLife: 30 }),
          N('盾矛', 'shield', { block: 10, armorPct: 20 })
        ],
        t2: [
          [0, N('穿雲', 'chain', 0, [['T', { chain: 2 }]])],
          [1, N('疾風突刺', 'feather', { extraTurn: 12 })],
          [2, N('吸血之矛', 'drop', 0, [['T', { leech: 4 }]])]
        ],
        u: [
          [1, N('女武神降臨', 'wings', { lowLife: 60, extraTurn: 15 }, 0, { lifeMore: -20 })],
          [0, N('天槍', 'flash', 0, [['T', { aoe: 1, more: 30 }]], { hpDrain: 2 })]
        ]
      },
      {
        k: 'moon',
        n: '月影祭司',
        tag: 'spell',
        col: '#c8d8ff',
        ic: 'moon',
        d: '法器：月光法術、閃避回魔',
        sm: [
          ['spellPct', 8],
          ['evade', 3],
          ['mana', 15]
        ],
        en: { spellPct: 10 },
        t1: [
          N('月光', 'moon', 0, [['T', { more: 15 }]]),
          N('月下回魔', 'wind', { evade: 8, killMana: 10 }),
          N('月華', 'spark', 0, [['T', { crit: 6 }]]),
          N('寒月', 'ice', 0, [['cold', { ail: 50 }]])
        ],
        t2: [
          [1, N('月影步', 'feather', { dodgeCrit: 1 })],
          [0, N('滿月', 'sun', 0, [['T', { echo: 20 }]])],
          [2, N('月蝕之咒', 'eye', { curseCh: 20, curseP: 20 })]
        ],
        u: [
          [1, N('月蝕', 'eclipse', 0, [['T', { more: 60 }]], { hpDrain: 3 })],
          [0, N('新月', 'moonshield', { evade: 20, manaRegen: 8, mom: 20 }, 0, { lifeMore: -15 })]
        ]
      }
    ]
  },
  {
    k: 'assassin',
    n: '刺客',
    soul: 'ranger',
    ic: 'dagger',
    d: '暗影中的殺手：匕首背刺、血爪撕裂，或架設機關的弩手。',
    br: [
      {
        k: 'shadow',
        n: '影刃',
        tag: 'dagger',
        col: '#8a6aff',
        ic: 'dagger',
        d: '匕首：背刺暴擊、隱身、割喉',
        sm: [
          ['critPct', 2],
          ['critMulti', 10],
          ['evade', 3]
        ],
        en: {},
        enSup: [['T', { crit: 5 }]],
        t1: [
          N('背刺', 'dagger', 0, [['T', { cm: 50 }]]),
          N('隱身', 'ghost', { evade: 10, dodgeCrit: 1 }),
          N('毒刃', 'leaf', 0, [['T', { poison: 40 }]]),
          N('連擊', 'multi', 0, [['T', { hits: 1 }]])
        ],
        t2: [
          [0, N('割喉', 'needle', 0, [['T', { exec: 60 }]])],
          [1, N('影步', 'feather', { extraTurn: 15 })],
          [3, N('雙刃', 'swords', { dbl: 15 })]
        ],
        u: [
          [0, N('死神', 'scythe', 0, [['T', { crit: 25, cm: 80 }]], { lifeMore: -20 })],
          [1, N('影之舞', 'moon', { evade: 20, counter: 80, extraTurn: 10 }, 0, { armorMore: -50 })]
        ]
      },
      {
        k: 'bloodclaw',
        n: '血爪',
        tag: 'dagger',
        col: '#ff5a5a',
        ic: 'claw',
        d: '爪：流血、吸血連擊、血之狂潮',
        sm: [
          ['leech', 1],
          ['physPct', 8],
          ['life', 20]
        ],
        en: { bleedCh: 10 },
        t1: [
          N('撕裂', 'claw', 0, [['T', { bleed: 40 }]]),
          N('血飲', 'drop', 0, [['T', { leech: 4 }]]),
          N('狂亂', 'fist', 0, [['T', { hits: 1, more: -15 }]]),
          N('嗜血', 'fang', { killHeal: 8 })
        ],
        t2: [
          [0, N('大出血', 'splat', { dotPct: 50, ailDur: 1 })],
          [1, N('血之狂潮', 'heartx', { lowLife: 40 })],
          [2, N('血爪亂舞', 'whirl', 0, [['T', { aoe: 1 }]])]
        ],
        u: [
          [0, N('血魔之爪', 'bloodclaw', { spread: 1, dotPct: 80 }, 0, { hpDrain: 2 })],
          [1, N('不死之身', 'fang2', { lifePct: 15 }, [['T', { leech: 10 }]], { noPotion: 1 })]
        ]
      },
      {
        k: 'engineer',
        n: '機關師',
        tag: 'bow',
        col: '#c8a060',
        ic: 'xbow',
        d: '弩：陷阱、毒霧、定點爆炸',
        sm: [
          ['physPct', 8],
          ['stunCh', 2],
          ['armor', 25]
        ],
        en: { stunCh: 6 },
        t1: [
          N('陷阱', 'trap', 0, [['T', { stun: 25 }]]),
          N('毒霧', 'cloud', { poisonPct: 30 }, [['T', { poison: 50 }]]),
          N('爆炸箭', 'bomb', 0, [['T', { aoe: 1 }]]),
          N('連發弩', 'multi', 0, [['T', { proj: 1 }]])
        ],
        t2: [
          [2, N('定點爆炸', 'burst', { spread: 1 }, [['T', { more: 25 }]])],
          [1, N('麻痺毒', 'flaskg', { ailDur: 1, dotPct: 40 })],
          [3, N('機關槍', 'gear', 0, [['T', { echo: 25 }]])]
        ],
        u: [
          [0, N('爆破大師', 'boom', 0, [['T', { more: 50 }]], { dmgRed: -15 })],
          [2, N('千機', 'hourglass', { extraTurn: 20 }, [['T', { proj: 2 }]], { lifeMore: -15 })]
        ]
      }
    ]
  },
  {
    k: 'elemental',
    n: '元素使',
    soul: 'mage',
    ic: 'sun',
    d: '駕馭元素的法師：焚天之火、霜語之冰，或雷殛之電。',
    br: [
      {
        k: 'pyro',
        n: '焚天者',
        tag: 'fire',
        col: '#ff8a3a',
        ic: 'flame',
        d: '火：燃燒擴散、爆燃、熔岩',
        sm: [
          ['firePct', 10],
          ['spellPct', 6],
          ['resFire', 10]
        ],
        en: { firePct: 12 },
        t1: [
          N('燎原', 'flame', 0, [['T', { ail: 60 }]]),
          N('爆燃', 'bomb', 0, [['T', { aoe: 1 }]]),
          N('烈焰之心', 'sun', 0, [['T', { more: 20 }]]),
          N('引燃', 'splat', { spread: 1 })
        ],
        t2: [
          [0, N('焦土', 'crack', { dotPct: 60, ailDur: 1 })],
          [1, N('火海', 'burst', 0, [['T', { echo: 20 }]])],
          [2, N('熔岩', 'anvil', 0, [['T', { penRes: 25 }]])]
        ],
        u: [
          [2, N('焚天', 'bigflame', 0, [['T', { more: 70 }]], { hpDrain: 3 })],
          [0, N('不滅之火', 'fist', { dotPct: 120, spread: 1 }, 0, { dmgMore: -15 })]
        ]
      },
      {
        k: 'frost',
        n: '霜語者',
        tag: 'cold',
        col: '#9fe7ff',
        ic: 'ice',
        d: '冰：凍結、冰甲、碎冰',
        sm: [
          ['coldPct', 10],
          ['armorPct', 8],
          ['resCold', 10]
        ],
        en: { coldPct: 12 },
        t1: [
          N('凍結', 'ice', 0, [['T', { ail: 80 }]]),
          N('冰錐', 'multi', 0, [['T', { proj: 1 }]]),
          N('冰甲', 'shield', { armorPct: 40, shieldPct: 10 }),
          N('寒氣', 'wind', 0, [['T', { chain: 1 }]])
        ],
        t2: [
          [0, N('碎冰', 'needle', 0, [['T', { exec: 60 }]])],
          [1, N('冰暴', 'burst', 0, [['T', { aoe: 1 }]])],
          [2, N('永凍', 'castle', { dmgRed: 10, noFreeze: 1 })]
        ],
        u: [
          [0, N('絕對零度', 'snow', 0, [['T', { more: 60, ail: 100 }]], { speed: -6 })],
          [2, N('冰霜女王', 'lotus', { shieldPct: 40, reflectPct: 30 }, 0, { dmgMore: -20 })]
        ]
      },
      {
        k: 'storm',
        n: '雷殛者',
        tag: 'light',
        col: '#fff27a',
        ic: 'bolt',
        d: '雷：連鎖閃電、感電、雷速',
        sm: [
          ['lightPct', 10],
          ['critPct', 2],
          ['resLight', 10]
        ],
        en: { lightPct: 12 },
        t1: [
          N('連鎖', 'chain', 0, [['T', { chain: 2 }]]),
          N('感電', 'bolt', 0, [['T', { ail: 60 }]]),
          N('雷速', 'feather', { extraTurn: 10 }),
          N('雷擊', 'spark', 0, [['T', { crit: 8, cm: 30 }]])
        ],
        t2: [
          [0, N('雷暴', 'burst', 0, [['T', { aoe: 1 }]])],
          [1, N('超載', 'flash', { ailDur: 1 }, [['T', { more: 15 }]])],
          [3, N('雷霆萬鈞', 'stars', 0, [['T', { echo: 25 }]])]
        ],
        u: [
          [0, N('雷神', 'thor', 0, [['T', { chain: 3, more: 40 }]], { hpDrain: 3 })],
          [1, N('閃電化身', 'ghost', { extraTurn: 25, evade: 10 }, 0, { lifeMore: -20 })]
        ]
      }
    ]
  },
  {
    k: 'necro',
    n: '死靈師',
    soul: 'mage',
    ic: 'skull',
    d: '操弄死亡的術士：白骨大軍、詛咒與瘟疫，或以血為代價的血魔。',
    br: [
      {
        k: 'bonelord',
        n: '白骨君主',
        tag: 'summon',
        col: '#e8e2d0',
        ic: 'skull',
        d: '召喚：骷髏大軍、骨甲、屍爆',
        sm: [
          ['petPct', 10],
          ['life', 20],
          ['armorPct', 8]
        ],
        en: { petPct: 15 },
        t1: [
          N('骷髏大軍', 'skull', 0, [['T', { petMax: 2 }]]),
          N('骨甲', 'shield', { armorPct: 30 }),
          N('不死軍團', 'hourglass', 0, [['T', { petTurns: 2 }]]),
          N('白骨之力', 'bone', { petPct: 30 })
        ],
        t2: [
          [1, N('骨牆', 'castle', { shieldPct: 20 })],
          [0, N('統御', 'crown', { petPct: 40 })],
          [3, N('屍爆', 'splat', { spread: 1, killHeal: 5 })]
        ],
        u: [
          [1, N('白骨君王', 'ghost', { petPct: 60 }, [['T', { petMax: 3 }]], { dmgMore: -30 })],
          [0, N('骨之鎧', 'anvil', { shieldPct: 40, armorMore: 40 }, 0, { petPct: -40 })]
        ]
      },
      {
        k: 'curse',
        n: '咒怨巫女',
        tag: 'spell',
        col: '#c86aff',
        ic: 'rune',
        d: '詛咒：弱化、腐蝕、瘟疫',
        sm: [
          ['spellPct', 8],
          ['curseCh', 3],
          ['mana', 15]
        ],
        en: { curseCh: 10 },
        t1: [
          N('弱化', 'eye', { curseCh: 20, curseP: 10 }),
          N('腐蝕', 'cloud', { poisonCh: 20, dotPct: 30 }),
          N('削抗', 'scale', 0, [['T', { penRes: 20 }]]),
          N('怨念', 'ghost', { killMana: 10 })
        ],
        t2: [
          [0, N('厄運', 'rune', { curseP: 25 })],
          [1, N('瘟疫', 'splat', { spread: 1, ailDur: 1 })],
          [2, N('咒力', 'spark', 0, [['T', { more: 20 }]])]
        ],
        u: [
          [0, N('咒怨之女', 'witch', { curseCh: 60, curseP: 40 }, 0, { lifeMore: -15 })],
          [1, N('萬毒之母', 'flaskg', { dotPct: 120, poisonCh: 30 }, 0, { hpDrain: 2 })]
        ]
      },
      {
        k: 'bloodmage',
        n: '血魔',
        tag: 'phys',
        col: '#c0203a',
        ic: 'heart',
        d: '鮮血：以血施法、吸血、不朽之血',
        sm: [
          ['life', 30],
          ['lifePct', 4],
          ['leech', 1]
        ],
        en: { lifePct: 8 },
        t1: [
          N('血魔法', 'drop', { blood: 1 }, [['T', { more: 25 }]]),
          N('嗜血', 'fang', { leech: 4 }),
          N('血之狂暴', 'fist', { lowLife: 35 }),
          N('血肉之軀', 'heartx', { lifePct: 15 })
        ],
        t2: [
          [0, N('血爆', 'splat', 0, [['T', { aoe: 1 }]])],
          [1, N('不死', 'bone', { killHeal: 10 })],
          [2, N('血怒', 'fang2', { extraTurn: 12 })]
        ],
        u: [
          [0, N('血魔降臨', 'bloodmoon', 0, [['T', { more: 60, leech: 6 }]], { hpDrain: 3 })],
          [1, N('不朽之血', 'lotus', { regen: 30, lifeMore: 20 }, 0, { noPotion: 1 })]
        ]
      }
    ]
  },
  {
    k: 'taoist',
    n: '道士',
    soul: 'mage',
    ic: 'rune',
    d: '台灣在地的術士：畫符降妖、桃木劍仙，或請神附身的乩童。',
    br: [
      {
        k: 'talisman',
        n: '符籙天師',
        tag: 'light',
        col: '#ffd166',
        ic: 'rune',
        d: '符咒：定身、五雷、封印魔物',
        sm: [
          ['spellPct', 8],
          ['stunCh', 2],
          ['mana', 15]
        ],
        en: { stunCh: 6 },
        t1: [
          N('定身符', 'rune', 0, [['spell', { stun: 25 }]]),
          N('雷符', 'bolt', 0, [['T', { more: 20 }]]),
          N('護身符', 'shield', { shieldPct: 15, resAll: 10 }),
          N('五雷', 'chain', 0, [['T', { chain: 2 }]])
        ],
        t2: [
          [0, N('封印', 'trap', 0, [['spell', { exec: 40 }]])],
          [1, N('天雷', 'flash', 0, [['T', { aoe: 1 }]])],
          [2, N('符陣', 'castle', { dmgRed: 10, block: 10 })]
        ],
        u: [
          [1, N('天師', 'bagua', 0, [['spell', { more: 50, echo: 20 }]], { hpDrain: 2 })],
          [0, N('鎮魔', 'anvil', 0, [['spell', { stun: 40, exec: 60 }]], { dmgMore: -15 })]
        ]
      },
      {
        k: 'peach',
        n: '桃木劍仙',
        tag: 'sword',
        col: '#d8945a',
        ic: 'sword',
        d: '桃木劍：劍符合一、御劍、斬妖',
        sm: [
          ['physPct', 8],
          ['spellPct', 8],
          ['critPct', 2]
        ],
        en: { physPct: 8, spellPct: 8 },
        t1: [
          N('劍符合一', 'swords', { addLight: 6 }, [['T', { more: 15 }]]),
          N('驅邪劍', 'sun', 0, [['T', { exec: 40 }]]),
          N('御劍', 'multi', 0, [['T', { proj: 2 }]]),
          N('劍氣', 'wind', 0, [['T', { chain: 1 }]])
        ],
        t2: [
          [2, N('萬劍', 'burst', 0, [['T', { echo: 20 }]])],
          [0, N('仙劍', 'spark', 0, [['T', { crit: 10, cm: 40 }]])],
          [1, N('斬妖', 'fist', { killStack: 3, killMax: 8 })]
        ],
        u: [
          [0, N('劍仙', 'flysword', 0, [['T', { proj: 2, more: 40 }]], { lifeMore: -15 })],
          [1, N('一劍封神', 'flash', 0, [['T', { more: 80 }]], { speed: -6 })]
        ]
      },
      {
        k: 'medium',
        n: '乩童',
        tag: 'buff',
        col: '#ff4a8a',
        ic: 'mask',
        d: '附身：神明加持、以血換力、刀山',
        sm: [
          ['life', 25],
          ['physPct', 6],
          ['lowLife', 5]
        ],
        en: { lowLife: 10 },
        t1: [
          N('附身', 'mask', { dmgMore: 10 }, [['T', { cost: 40 }]]),
          N('神明加持', 'star', { shieldPct: 15 }),
          N('以血換力', 'drop', { lowLife: 30 }),
          N('刀山', 'dagger', { reflectPct: 25 })
        ],
        t2: [
          [0, N('起乩', 'eye', { extraTurn: 12 })],
          [1, N('神威', 'sun', { dmgRed: 12 })],
          [2, N('血祭', 'fang', { killHeal: 8, leech: 3 })]
        ],
        u: [
          [0, N('神降', 'deity', { dmgMore: 40, extraTurn: 10 }, 0, { hpDrain: 3 })],
          [1, N('金身', 'lotus', { dmgRed: 25, shieldPct: 30 }, 0, { dmgMore: -20 })]
        ]
      }
    ]
  },
  {
    k: 'destiny',
    n: '天命之子',
    soul: 'novice',
    ic: 'star',
    d: '不受限的冒險者：任何武器都能用、藥水鍊金，或馴服野獸。',
    br: [
      {
        k: 'master',
        n: '萬象劍客',
        tag: 'attack',
        col: '#e8e2d4',
        ic: 'swords',
        d: '任意武器：技能不再需要特定武器、破綻、無招',
        sm: [
          ['physPct', 8],
          ['speed', 2],
          ['critPct', 2]
        ],
        en: { anyWep: 1 },
        t1: [
          N('萬象', 'star', 0, [['T', { more: 15 }]]),
          N('流轉', 'feather', 0, [['T', { cost: 30 }]]),
          N('破綻', 'target', { markFirst: 20 }),
          N('隨心', 'multi', 0, [['T', { hits: 1, more: -15 }]])
        ],
        t2: [
          [0, N('萬劍歸宗', 'spark', 0, [['T', { crit: 8, cm: 30 }]])],
          [1, N('無招', 'flash', { extraTurn: 15 })],
          [2, N('洞察', 'needle', 0, [['T', { pen: 30 }]])]
        ],
        u: [
          [0, N('天下無雙', 'starsword', 0, [['T', { more: 50 }]], { lifeMore: -15 })],
          [1, N('天命', 'sun', { extraTurn: 25, dodgeCrit: 1 }, 0, { armorMore: -40 })]
        ]
      },
      {
        k: 'alchemist',
        n: '鍊金術士',
        tag: 'all',
        col: '#5ac8a0',
        ic: 'potion',
        d: '藥水：強化藥水、丟藥瓶炸彈、毒藥',
        sm: [
          ['potPct', 10],
          ['life', 20],
          ['resAll', 4]
        ],
        en: { potPct: 20 },
        t1: [
          N('藥瓶炸彈', 'bomb', { potBomb: 120 }),
          N('藥水大師', 'potion', { potPct: 50 }),
          N('毒藥', 'flaskg', { poisonCh: 25, poisonPct: 30 }),
          N('煉成', 'gear', { killMana: 10, killHeal: 5 })
        ],
        t2: [
          [0, N('連鎖爆炸', 'burst', { spread: 1, potBomb: 80 })],
          [1, N('長效', 'hourglass', { regen: 15 })],
          [2, N('腐蝕藥劑', 'cloud', { dotPct: 60, ailDur: 1 })]
        ],
        u: [
          [1, N('賢者之石', 'stone', { potPct: 120, regen: 20 }, 0, { dmgMore: -15 })],
          [0, N('瘋狂鍊金', 'splat', { potBomb: 300 }, 0, { hpDrain: 2 })]
        ]
      },
      {
        k: 'tamer',
        n: '馴獸師',
        tag: 'summon',
        col: '#9a6a3a',
        ic: 'paw',
        d: '寵物：每場戰鬥帶著野狼，之後接寵物祈願',
        sm: [
          ['petPct', 10],
          ['life', 20],
          ['speed', 2]
        ],
        en: { petPct: 15, petStart: 1 },
        t1: [
          N('野性呼喚', 'paw', { petPct: 20, petStart: 1 }),
          N('群狼', 'hourglass', 0, [['T', { petTurns: 2 }]]),
          N('共生', 'heartx', { regen: 10, healPct: 20 }),
          N('獵犬', 'fang', { petPct: 35 })
        ],
        t2: [
          [0, N('獸王', 'crown', { petPct: 40 })],
          [1, N('狂野', 'fang2', { petStart: 1 }, [['T', { petMax: 2 }]])],
          [3, N('野性', 'feather', { extraTurn: 10 })]
        ],
        u: [
          [0, N('萬獸之主', 'howl', { petPct: 100 }, 0, { dmgMore: -30 })],
          [1, N('狼群戰術', 'stars', { petStart: 2 }, [['T', { petMax: 3, petTurns: 3 }]], { lifeMore: -15 })]
        ]
      }
    ]
  }
];
const TAGN = {
  sword: '劍',
  axe: '斧鎚',
  spear: '矛',
  bow: '弓弩',
  dagger: '匕首爪',
  staff: '法杖',
  fire: '火焰',
  cold: '冰冷',
  light: '閃電',
  phys: '物理法術',
  attack: '攻擊',
  spell: '法術',
  summon: '召喚',
  buff: '增益',
  heal: '回復',
  all: '所有'
};
const SUPN = {
  more: v => `傷害 ${v > 0 ? '+' : ''}${v}%（總乘）`,
  crit: v => `暴擊率 +${v}%`,
  cm: v => `暴擊傷害 +${v}%`,
  cost: v => `消耗 ${v > 0 ? '-' : '+'}${Math.abs(v)}%`,
  proj: v => `多 ${v} 支投射物（各 70% 傷害）`,
  chain: v => `連鎖 +${v} 次`,
  aoe: () => '單體技能改成打全體（65% 傷害）',
  echo: v => `${v}% 機率整個技能再放一次`,
  hits: v => `多打 ${v} 下`,
  pen: v => `無視 ${v}% 護甲`,
  penRes: v => `穿透 ${v}% 抗性`,
  ail: v => `異常狀態機率 +${v}%`,
  bleed: v => `${v}% 機率流血`,
  stun: v => `${v}% 機率暈眩`,
  poison: v => (v >= 100 ? '必定中毒' : `${v}% 機率中毒`),
  leech: v => `吸血 +${v}%`,
  exec: v => `對生命低於 35% 的敵人傷害 +${v}%`,
  dot: v => `持續傷害 +${v}%`,
  petMax: v => `召喚上限 +${v}`,
  petTurns: v => `召喚物多存在 ${v} 回合`
};
/* 分支的節點：id → {id, br, kind: 'e'|'s'|'b'|'u', p: 父節點, n, g, st, sup, cost, col, row} */
const ASCN = {};
const ASCB = {};
(() => {
  for (const c of ASC)
    for (const b of c.br) {
      b.cls = c.k;
      ASCB[b.k] = b;
      const T = s => s.map(([tag, o]) => ({ tag: tag === 'T' ? b.tag : tag, ...o })),
        add = (id, o) => (ASCN[id] = { id, br: b.k, ...o });
      add(b.k + '_e', { kind: 'e', p: null, n: b.n, g: b.ic, st: b.en, sup: T(b.enSup || []), col: 1.5, row: 0 });
      let si = 0;
      const small = (id, p, col, row) => {
        const [k, v] = b.sm[si++ % b.sm.length];
        add(id, { kind: 's', p, n: STATN[k](v), st: { [k]: v }, sup: [], col, row });
      };
      b.t1.forEach((nd, i) => {
        small(`${b.k}_a${i}s`, b.k + '_e', i, 1);
        add(`${b.k}_a${i}`, { kind: 'b', p: `${b.k}_a${i}s`, ...nd, sup: T(nd.sup), col: i, row: 2 });
      });
      b.t2.forEach(([pi, nd], j) => {
        small(`${b.k}_b${j}s`, `${b.k}_a${pi}`, pi, 3);
        add(`${b.k}_b${j}`, { kind: 'b', p: `${b.k}_b${j}s`, ...nd, sup: T(nd.sup), col: pi, row: 4 });
      });
      b.u.forEach(([pj, nd], j) => {
        const col = b.t2[pj][0];
        small(`${b.k}_u${j}s`, `${b.k}_b${pj}`, col, 5);
        add(`${b.k}_u${j}`, { kind: 'u', p: `${b.k}_u${j}s`, ...nd, sup: T(nd.sup), col, row: 6 });
      });
    }
})();

/* ================= state & stats ================= */
const ASCD = () => (S.asc = S.asc || { cls: null, br: null, trials: 0, nodes: [] });
const ascPts = () => Math.min(ASC_MAX, ASCD().trials * 2);
const ascUsed = () => ASCD().nodes.length;
const ascNext = () => (ASCD().trials < ASC_LV.length ? ASC_LV[ASCD().trials] : null);
const ascOn = () => {
  const a = ASCD();
  return a.br ? [a.br + '_e', ...a.nodes].map(id => ASCN[id]).filter(Boolean) : [];
};
/* sumStats 呼叫：昇華節點的屬性與代價 */
function ascStats(A) {
  for (const n of ascOn()) {
    for (const k in n.st) A(k, n.st[k]);
    if (n.cost) for (const k in n.cost) A(k, n.cost[k]);
  }
}
/* stats 呼叫：昇華的輔助效果（依技能標籤套用） */
const ascSup = () => ascOn().flatMap(n => n.sup || []);
/* 節點說明文字 */
function ascTxt(n) {
  const out = Object.entries(n.st || {}).map(([k, v]) => STATN[k](v));
  for (const s of n.sup || [])
    out.push(
      `${TAGN[s.tag] || s.tag}技能：` +
        Object.entries(s)
          .filter(([k]) => k !== 'tag')
          .map(([k, v]) => SUPN[k](v))
          .join('、')
    );
  return out;
}
const ascCostTxt = n => (n.cost ? Object.entries(n.cost).map(([k, v]) => STATN[k](v)) : []);
/* 可不可以點：父節點已點、還有點數、兩個終極互斥 */
function ascCan(id) {
  const n = ASCN[id],
    a = ASCD();
  if (!n || n.kind === 'e' || n.br !== a.br || a.nodes.includes(id) || ascUsed() >= ascPts()) return false;
  if (n.p !== a.br + '_e' && !a.nodes.includes(n.p)) return false;
  if (/_u\ds?$/.test(id)) {
    const j = id.match(/_u(\d)/)[1];
    if (a.nodes.some(x => /_u\ds?$/.test(x) && x.match(/_u(\d)/)[1] !== j)) return false;
  }
  return true;
}
const ascResetCost = () => 300 + S.lv * 60;
/* 紅點提示：有沒用的昇華點數，或等級已經可以挑戰下一場試煉 */
const ascAlert = () => ascPts() > ascUsed() || (ascNext() != null && S.lv >= ascNext());

/* ================= icons ================= */
/* 節點圖示：分支顏色的圓底＋效果圖示；終極是金框，入口是分支徽章 */
const ASCI = new Map();
function ascIcon(n, on) {
  const k = n.id + (on ? 1 : 0);
  if (ASCI.has(k)) return ASCI.get(k);
  const b = ASCB[n.br],
    c = document.createElement('canvas');
  c.width = c.height = 16;
  const x = c.getContext('2d');
  /* 點亮：分支色的深色底＋亮色外框；沒點：灰底暗框 */
  x.fillStyle = on ? shade(b.col, -0.62) : '#221d28';
  x.beginPath();
  x.arc(8, 8, 7.5, 0, 6.28);
  x.fill();
  x.strokeStyle = n.kind === 'u' ? '#ffd166' : on ? b.col : shade(b.col, -0.45);
  x.lineWidth = n.kind === 'u' ? 1.8 : 1.2;
  x.stroke();
  const g = document.createElement('canvas');
  g.width = g.height = 8;
  paintIcon(g, ICONS[n.g] ? n.g : 'star');
  x.globalAlpha = on ? 1 : 0.75;
  x.drawImage(g, 4, 4);
  const u = c.toDataURL();
  ASCI.set(k, u);
  return u;
}

/* ================= sheet ================= */
/* 分支的節點圖與選中節點的說明；preview 是還沒昇華時的預覽（只能看不能點） */
function ascTreeHTML(b, preview) {
  const a = ASCD(),
    cells = [];
  /* 節點圖：7 列 × 4 欄 */
  for (const id in ASCN) {
    const n = ASCN[id];
    if (n.br !== b.k) continue;
    const on = n.kind === 'e' || (!preview && a.nodes.includes(id)),
      can = !preview && ascCan(id);
    cells.push(
      `<button class="an an-${n.kind}${on ? ' on' : ''}${can ? ' can' : ''}${SEL.ascN === id ? ' sel' : ''}" style="grid-row:${n.row + 1};grid-column:${n.kind === 'e' ? '1 / span 4' : n.col + 1}" data-act="ascSel" data-id="${id}">${n.kind === 's' ? '<i></i>' : `<img src="${ascIcon(n, on || preview)}" alt="">`}${n.kind !== 's' ? `<span>${n.n}</span>` : ''}</button>`
    );
  }
  let h = `<div class="atree">${cells.join('')}</div>`;
  const sn = SEL.ascN && ASCN[SEL.ascN];
  if (sn && sn.br === b.k) {
    const on = sn.kind === 'e' || (!preview && a.nodes.includes(sn.id)),
      can = !preview && ascCan(sn.id);
    h += `<div class="card"><b>${sn.kind === 'u' ? '終極・' : sn.kind === 'b' ? '' : sn.kind === 'e' ? '入口・' : '小點・'}${sn.n}</b>${ascTxt(
      sn
    )
      .map(t => `<small class="sub" style="display:block;color:var(--ink)">・${esc(t)}</small>`)
      .join('')}${ascCostTxt(sn)
      .map(t => `<small style="display:block;color:#ff8a8a">代價：${esc(t)}</small>`)
      .join('')}${sn.kind === 'u' ? '<small class="sub">兩個終極只能選一個。</small>' : ''}${
      preview
        ? `<small class="sub">${sn.kind === 'e' ? '選定這條分支就會得到入口的效果。' : '預覽中：選定這條分支後才能點。'}</small>`
        : on
          ? '<small style="color:var(--good)">已點亮</small>'
          : `<button class="btn pri" data-act="ascTake" data-id="${sn.id}" ${can ? '' : 'disabled'}>${can ? '點亮（1 點）' : ascUsed() >= ascPts() ? '沒有昇華點數' : '還不能點（先點前一個節點）'}</button>`
    }</div>`;
  } else h += '<p class="sub">點節點看說明。大的是改變玩法的大點，小的是數值；一小一大交錯點下去。</p>';
  return h;
}
const ascHead = (c, b, extra) =>
  `<div class="card"><div class="rowx"><img class="ascic" src="${ascIcon(ASCN[b.k + '_e'], true)}" alt=""><div class="t"><b>${c.n}・${b.n}</b><small>${b.d}。輔助型大點套用到「${TAGN[b.tag]}」技能。${extra || ''}</small></div></div></div>`;
const ascMine = c => S.cls === 'novice' || c.soul === S.cls || c.soul === 'novice';
function ascHTML() {
  const a = ASCD(),
    nx = ascNext(),
    pts = ascPts(),
    used = ascUsed();
  let h = `<div class="card"><div class="rowx"><div class="t"><b>昇華點數 ${pts - used}/${pts}（共 ${ASC_MAX}）</b><small>${nx ? `下一場昇華試煉：Lv${nx}（到任一城鎮挑戰，通關得 2 點）` : '四場試煉都完成了'}${S.lv < (nx || 0) ? `・目前 Lv${S.lv}` : ''}</small></div></div></div>`;
  if (!a.br) {
    /* 預覽某條分支 */
    const vb = SEL.ascView && ASCB[SEL.ascView];
    if (vb) {
      const c = ASC.find(q => q.k === vb.cls),
        ok = ascMine(c);
      h += `<div class="btns"><button class="btn sm" data-act="ascView" data-k="">← 返回昇華一覽</button></div>`;
      h += ascHead(c, vb, ok ? '' : `（${CLASSES[c.soul].name}的昇華，你的起點不能選）`);
      h += ascTreeHTML(vb, true);
      h += `<button class="btn pri" data-act="ascPick" data-k="${vb.k}" ${ok && pts ? '' : 'disabled'}>${!ok ? '起點不同，不能選這個昇華' : pts ? `選擇${vb.n}` : `先通過昇華試煉（Lv${ASC_LV[0]} 起，在城鎮）才能選擇`}</button>`;
      return h;
    }
    if (!pts)
      h += `<p class="sub">Lv${ASC_LV[0]} 起可以到任一城鎮挑戰「昇華試煉」，通關後選一個昇華職業和其中一條分支。8 點只能點在選定的分支裡，一小一大交錯，最深處有兩個互斥的終極。點分支可以先看裡面的節點。</p>`;
    h += `<h3>${pts ? '選擇昇華（點分支查看節點，選定後要花金幣才能重選）' : '昇華職業一覽（點分支查看節點）'}</h3>`;
    for (const c of ASC) {
      const ok = ascMine(c);
      h += `<div class="card asc-c${ok ? '' : ' off'}"><div class="rowx"><img class="ascic" src="${ascIcon({ id: 'c_' + c.k, br: c.br[0].k, kind: 'e', g: c.ic }, ok)}" alt=""><div class="t"><b>${c.n}</b><small>${c.d}${ok ? '' : `（${CLASSES[c.soul].name}的昇華）`}</small></div></div>${c.br
        .map(
          b =>
            `<button class="btn sm asc-b" data-act="ascView" data-k="${b.k}"><img src="${ascIcon(ASCN[b.k + '_e'], true)}" alt=""><span><b>${b.n}</b><small>${b.d}</small></span><em class="asc-go">查看 ›</em></button>`
        )
        .join('')}</div>`;
    }
    return h;
  }
  const b = ASCB[a.br],
    c = ASC.find(q => q.k === a.cls);
  h += ascHead(c, b) + ascTreeHTML(b, false);
  h += `<button class="btn" data-act="ascReset">重選昇華（${ascResetCost()} 金幣，要在城鎮）</button>`;
  return h;
}

/* ================= trials ================= */
/* 城鎮面板呼叫：下一場試煉的按鈕 */
function ascTownHTML(e, inR) {
  const nx = ascNext();
  if (nx == null) return '';
  const ok = inR && S.lv >= nx;
  return `<button class="btn" data-act="ascTrial" data-id="${e.id}" ${ok ? '' : 'disabled'}>昇華試煉 ${ASCD().trials + 1}/${ASC_LV.length}${S.lv < nx ? `（需要 Lv${nx}）` : '・通關得 2 點昇華點數'}</button>`;
}
/* 試煉通關（dungeonClear 呼叫） */
function ascTrialDone() {
  const a = ASCD();
  a.trials = Math.min(ASC_LV.length, a.trials + 1);
  addLog(`通過昇華試煉 ${a.trials}/${ASC_LV.length}`);
  return `<p style="color:var(--gold)">通過昇華試煉 ${a.trials}/${ASC_LV.length}：獲得 2 點昇華點數！${a.br ? '' : '點下方頭像 →「昇華」選擇你的昇華。'}</p>`;
}

/* ================= actions ================= */
Object.assign(A, {
  asc: () => {
    SEL.ascN = null;
    SEL.ascView = null;
    openSheet('asc', '昇華');
  },
  /* 還沒昇華前預覽分支；k 空字串是回到一覽 */
  ascView: d => {
    SEL.ascView = d.k || null;
    SEL.ascN = d.k ? d.k + '_e' : null;
    renderSheet();
    $('sbody').scrollTop = 0;
  },
  ascPick: d => {
    const b = ASCB[d.k],
      a = ASCD();
    if (!b || a.br || !ascPts()) return;
    const c = ASC.find(q => q.k === b.cls);
    if (!ascMine(c)) return;
    showModal(
      '選擇昇華',
      `<p>確定選擇 <b>${c.n}・${b.n}</b>？</p><p class="sub">${b.d}。選定後 8 點只能點在這條分支裡；之後重選要花 ${ascResetCost()} 金幣並在城鎮。</p>`,
      [
        { label: '再想想', fn: hideModal },
        {
          label: '確定',
          pri: 1,
          fn: () => {
            hideModal();
            Object.assign(a, { cls: c.k, br: b.k, nodes: [] });
            SEL.ascView = null;
            SEL.ascN = b.k + '_a0s';
            sfx('level');
            toast(`昇華為${b.n}！`);
            addLog(`昇華：${c.n}・${b.n}`);
            save();
            renderSheet();
          }
        }
      ]
    );
  },
  ascSel: d => {
    SEL.ascN = d.id;
    renderSheet();
  },
  ascTake: d => {
    if (!ascCan(d.id)) return;
    ASCD().nodes.push(d.id);
    sfx('select');
    clampHP();
    save();
    renderSheet();
    renderHud();
  },
  ascReset: () => {
    const a = ASCD(),
      cost = ascResetCost();
    if (!a.br) return;
    if (!nearTownE()) return toast('要在城鎮附近才能重選昇華');
    if (S.gold < cost) return toast(`需要 ${cost} 金幣`);
    showModal(
      '重選昇華',
      `<p>花 ${cost} 金幣清掉目前的昇華（${ASCB[a.br].n}），點數全部返還，可以重新選擇職業與分支。</p>`,
      [
        { label: '取消', fn: hideModal },
        {
          label: '重選',
          pri: 1,
          fn: () => {
            hideModal();
            S.gold -= cost;
            Object.assign(a, { cls: null, br: null, nodes: [] });
            addLog(`重選昇華（-${cost} 金幣）`);
            clampHP();
            save();
            renderSheet();
            renderHud();
          }
        }
      ]
    );
  },
  ascTrial: d => {
    const e = ENT.get(d.id),
      nx = ascNext();
    if (!e || nx == null || S.lv < nx || !inRange(e)) return;
    closeSheet();
    enterDungeon(
      {
        id: `asc${ASCD().trials}_${e.id}`,
        kind: 'asc',
        dt: 'normal',
        lat: e.lat,
        lng: e.lng,
        lv: nx + 2,
        floors: 3,
        onsite: onSite(e)
      },
      false
    );
  }
});
