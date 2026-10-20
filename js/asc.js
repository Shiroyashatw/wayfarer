/* 漫步勇者 · 0.3 昇華：城鎮的昇華試煉（Lv20／30／45／60 各 2 點，共 8 點）、昇華職業與分支、分支節點、重選
   0.3.16 每條分支的排法是 ASC_ART 裡自己的一張圖案（24 種，比照 PoE2 的昇華圖：路線短、會分岔）：一般大點是 t1 的 4 個與 t2 的前 2 個，
   「三選一」是一個抉擇大點旁邊掛三個小點、只能點一個，選項是 t2 的第 3 個與 u 的 2 個（原本的終極）；8 點要自己取捨。
   大點的效果：st 直接加到屬性；sup 是輔助效果，依技能標籤套用（'T' 代表分支的標籤）；cost 是代價 */
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
  /* 0.3.13 前終極點用的圖示（終極點已拿掉，圖示保留給之後的節點） */
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
/* 分支的節點：id → {id, br, kind: 'e'|'s'|'b', p: 父節點, n, g, st, sup, cost, col, row} */
/* 小點的圖示（依屬性） */
const SMG = {
  physPct: 'sword',
  critMulti: 'spark',
  critPct: 'spark',
  armor: 'shield',
  armorPct: 'shield',
  stunCh: 'stars',
  life: 'heart',
  lifePct: 'heart',
  allyDmg: 'flag',
  block: 'anvil',
  lightPct: 'bolt',
  resLight: 'bolt',
  healPct: 'heartx',
  speed: 'feather',
  evade: 'wind',
  spellPct: 'book',
  mana: 'rune',
  leech: 'drop',
  firePct: 'flame',
  resFire: 'flame',
  coldPct: 'ice',
  resCold: 'ice',
  petPct: 'paw',
  curseCh: 'eye',
  lowLife: 'fist',
  potPct: 'potion',
  resAll: 'lotus'
};
const ASCN = {};
const ASCB = {};
/* 0.3.16 分支造型（比照 PoE2 的昇華圖）：24 條分支各自一張圖案，配合分支主題（劍、鎚、旗、盾…）。
   座標是分支自己的 (d 往外, l 橫向)，入口在 (0, 0)。工具：
   s(k, d, l) 小點、b(k, d, l, slot) 一般大點（slot 0～5 對應 t1 的 4 個與 t2 的前 2 個）、
   ch(k, d, l, 角度) 三選一：一個大點（抉擇）旁邊掛三個小點，三個只能點一個（選項是 t2 的第 3 個與原本的 2 個終極）、
   L(甲, 乙, 圓心?) 連線（有圓心畫成弧）、P(起點, [k...]) 依序連成一條 */
const ASC_ART = {
  /* 劍：劍身直直往外，護手往兩邊，劍尖是三選一 */
  blade: ({ s, b, ch, L, P }) => {
    s('h', 80, 0);
    s('g', 135, 0);
    s('gl', 135, -72);
    b('b0', 135, -145, 0);
    s('gr', 135, 72);
    b('b1', 135, 145, 1);
    s('m', 205, 0);
    b('b2', 275, 0, 2);
    b('b3', 235, -62, 3);
    s('t', 345, 0);
    b('b4', 320, 62, 4);
    b('b5', 370, -62, 5);
    ch('c', 430, 0, 0);
    P('e', ['h', 'g', 'm', 'b2', 't', 'c']);
    P('g', ['gl', 'b0']);
    P('g', ['gr', 'b1']);
    L('m', 'b3');
    L('b2', 'b4');
    L('t', 'b5');
  },
  /* 鎚：長柄往外，末端一顆橫向的大鎚頭 */
  crusher: ({ s, b, ch, L, P }) => {
    s('h1', 90, 0);
    s('h2', 175, 0);
    s('hd', 255, 0);
    s('hl', 255, -68);
    b('b0', 255, -138, 0);
    b('b1', 330, -138, 1);
    s('hr', 255, 68);
    b('b2', 255, 138, 2);
    b('b3', 330, 138, 3);
    b('b5', 335, 0, 5);
    b('b4', 125, 92, 4);
    ch('c', 175, -95, -135);
    P('e', ['h1', 'h2', 'hd', 'b5']);
    P('hd', ['hl', 'b0', 'b1']);
    P('hd', ['hr', 'b2', 'b3']);
    L('h1', 'b4');
    L('h2', 'c');
  },
  /* 旗：旗桿往外，桿頂往一邊掛一面方旗 */
  banner: ({ s, b, ch, L, P }) => {
    s('p1', 90, 0);
    s('p2', 180, 0);
    s('p3', 265, 0);
    b('b0', 350, 0, 0);
    s('f1', 265, 70);
    b('b1', 265, 150, 1);
    s('f2', 350, 70);
    b('b2', 350, 150, 2);
    b('b3', 308, 110, 3);
    b('b4', 195, -75, 4);
    b('b5', 425, 0, 5);
    ch('c', 105, -95, -90);
    P('e', ['p1', 'p2', 'p3', 'b0', 'b5']);
    P('p3', ['f1', 'b1', 'b2', 'f2', 'b0']);
    L('f1', 'b3');
    L('p2', 'b4');
    L('p1', 'c');
  },
  /* 盾：一面盾牌的外框，盾尖是三選一，盾面上一個十字 */
  paladin: ({ s, b, ch, L, P }) => {
    s('t', 95, 0);
    s('tl', 150, -95);
    s('tr', 150, 95);
    b('b0', 265, -100, 0);
    b('b1', 265, 100, 1);
    b('b3', 190, 0, 3);
    b('b4', 270, 0, 4);
    b('b5', 120, -175, 5);
    b('b2', 205, 170, 2);
    ch('c', 365, 0, 0);
    P('e', ['t', 'b3', 'b4']);
    L('t', 'tl');
    L('t', 'tr');
    L('tl', 'b0', [200, 30]);
    L('b0', 'c', [200, 30]);
    L('tr', 'b1', [200, -30]);
    L('b1', 'c', [200, -30]);
    L('tl', 'b5');
    L('tr', 'b2');
  },
  /* 長槍：一支長槍（槍頭是菱形），兩側是方陣的短槍 */
  phalanx: ({ s, b, ch, L, P }) => {
    s('m1', 90, 0);
    s('m2', 170, 0);
    s('m3', 250, 0);
    s('hl', 315, -42);
    s('hr', 315, 42);
    b('b0', 380, 0, 0);
    s('l1', 80, -85);
    b('b1', 165, -115, 1);
    b('b2', 250, -128, 2);
    s('r1', 80, 85);
    b('b3', 165, 115, 3);
    b('b4', 370, -100, 4);
    b('b5', 455, 0, 5);
    ch('c', 255, 130, 30);
    P('e', ['m1', 'm2', 'm3']);
    L('m3', 'hl');
    L('m3', 'hr');
    L('hl', 'b0');
    L('hr', 'b0');
    L('b0', 'b5');
    L('hl', 'b4');
    P('e', ['l1', 'b1', 'b2']);
    P('e', ['r1', 'b3', 'c']);
  },
  /* 天秤：中柱往外，頂上一根橫桿，兩端吊著秤盤 */
  judge: ({ s, b, ch, L, P }) => {
    s('p1', 90, 0);
    s('p2', 175, 0);
    s('top', 255, 0);
    s('al', 255, -95);
    s('ar', 255, 95);
    b('b0', 190, -150, 0);
    b('b1', 190, -60, 1);
    b('b2', 335, 0, 2);
    b('b3', 335, -70, 3);
    b('b4', 335, 70, 4);
    b('b5', 110, -95, 5);
    ch('c', 175, 145, 180);
    P('e', ['p1', 'p2', 'top', 'b2']);
    L('top', 'al');
    L('top', 'ar');
    L('al', 'b0');
    L('al', 'b1');
    L('ar', 'c');
    L('b2', 'b3');
    L('b2', 'b4');
    L('p1', 'b5');
  },
  /* 弓：一道弓臂（弧），弓弦拉直，箭往外射出去 */
  hunter: ({ s, b, ch, L, P }) => {
    s('n', 85, 0);
    s('k', 165, 0);
    b('b1', 165, -125, 1);
    s('a1', 228, -76);
    s('a2', 252, 0);
    s('a3', 228, 76);
    b('b2', 165, 125, 2);
    s('ar', 330, 0);
    b('b0', 410, 0, 0);
    b('b3', 100, -185, 3);
    b('b4', 305, -82, 4);
    b('b5', 305, 82, 5);
    ch('c', 100, 185, 180);
    P('e', ['n', 'k', 'a2', 'ar', 'b0']);
    L('k', 'b1');
    L('k', 'b2');
    L('b1', 'a1', [120, 0]);
    L('a1', 'a2', [120, 0]);
    L('a2', 'a3', [120, 0]);
    L('a3', 'b2', [120, 0]);
    L('b1', 'b3');
    L('b2', 'c');
    L('a1', 'b4');
    L('a3', 'b5');
  },
  /* 翅膀：身體往外，兩邊各兩根羽毛往後掠 */
  valkyrie: ({ s, b, ch, L, P }) => {
    s('m1', 90, 0);
    s('m2', 170, 0);
    s('m3', 250, 0);
    s('wl1', 160, -78);
    b('b0', 115, -150, 0);
    s('wl2', 220, -72);
    b('b1', 245, -145, 1);
    b('b4', 305, -200, 4);
    s('wr1', 160, 78);
    b('b2', 115, 150, 2);
    s('wr2', 220, 72);
    b('b3', 245, 145, 3);
    b('b5', 305, 200, 5);
    ch('c', 330, 0, 0);
    P('e', ['m1', 'm2', 'm3', 'c']);
    P('m2', ['wl1', 'b0']);
    P('m2', ['wl2', 'b1', 'b4']);
    P('m2', ['wr1', 'b2']);
    P('m2', ['wr2', 'b3', 'b5']);
  },
  /* 新月：外弧與內弧夾成一彎月亮，月尖往兩邊翹 */
  moon: ({ s, b, ch, L, P }) => {
    s('e1', 80, 0);
    s('i1', 190, -72);
    b('b2', 250, 0, 2);
    s('i3', 190, 72);
    s('o1', 128, -142);
    b('b0', 255, -130, 0);
    s('o5', 128, 142);
    b('b1', 255, 130, 1);
    b('b3', 62, -205, 3);
    b('b4', 62, 205, 4);
    b('b5', 340, -200, 5);
    ch('c', 335, 0, 0);
    L('e', 'e1');
    L('e1', 'i1');
    L('e1', 'i3');
    L('i1', 'b2', [330, 0]);
    L('b2', 'i3', [330, 0]);
    L('i1', 'o1');
    L('o1', 'b0', [180, 0]);
    L('b0', 'c', [180, 0]);
    L('c', 'b1', [180, 0]);
    L('b1', 'o5', [180, 0]);
    L('o5', 'i3');
    L('o1', 'b3');
    L('o5', 'b4');
    L('b0', 'b5');
  },
  /* 交叉雙匕：兩把匕首交叉成 X，交叉點往外還有一個大點 */
  shadow: ({ s, b, ch, L, P }) => {
    s('a1', 90, -110);
    s('a2', 145, -55);
    s('x', 200, 0);
    s('a4', 255, 55);
    b('b0', 310, 110, 0);
    s('c1', 90, 110);
    s('c2', 145, 55);
    s('c4', 255, -55);
    b('b1', 310, -110, 1);
    b('b2', 40, -170, 2);
    b('b3', 40, 170, 3);
    b('b4', 375, 175, 4);
    b('b5', 290, 0, 5);
    ch('c', 375, -175, -45);
    P('e', ['a1', 'a2', 'x', 'a4', 'b0', 'b4']);
    P('e', ['c1', 'c2', 'x', 'c4', 'b1', 'c']);
    L('a1', 'b2');
    L('c1', 'b3');
    L('x', 'b5');
  },
  /* 三道爪痕：三條斜斜的平行線 */
  bloodclaw: ({ s, b, ch, L, P }) => {
    s('k', 70, 0);
    s('x1', 105, -120);
    s('x2', 195, -85);
    b('b0', 285, -50, 0);
    s('y1', 105, -30);
    b('b1', 195, 5, 1);
    b('b2', 285, 40, 2);
    s('z1', 105, 60);
    s('z2', 195, 95);
    b('b3', 375, -15, 3);
    b('b4', 370, 80, 4);
    b('b5', 175, -190, 5);
    ch('c', 290, 135, 60);
    L('e', 'k');
    P('k', ['x1', 'x2', 'b0', 'b3']);
    P('k', ['y1', 'b1', 'b2', 'b4']);
    P('k', ['z1', 'z2', 'c']);
    L('x1', 'b5');
  },
  /* 齒輪：一個圓環，往外伸出一圈齒 */
  engineer: ({ s, b, ch, L, P }) => {
    const C = [220, 0];
    s('h', 70, 0);
    s('r0', 135, 0);
    s('r1', 178, -74);
    b('b0', 263, -74, 0);
    s('r3', 305, 0);
    b('b1', 263, 74, 1);
    s('r5', 178, 74);
    b('b2', 145, -150, 2);
    b('b3', 145, 150, 3);
    b('b4', 300, -150, 4);
    b('b5', 300, 150, 5);
    ch('c', 385, 0, 0);
    P('e', ['h', 'r0']);
    L('r0', 'r1', C);
    L('r1', 'b0', C);
    L('b0', 'r3', C);
    L('r3', 'b1', C);
    L('b1', 'r5', C);
    L('r5', 'r0', C);
    L('r1', 'b2');
    L('r5', 'b3');
    L('b0', 'b4');
    L('b1', 'b5');
    L('r3', 'c');
  },
  /* 火焰：火舌從底部往上燒，兩側彎彎的往中間收，頂端是三選一，旁邊有火星 */
  pyro: ({ s, b, ch, L, P }) => {
    s('k', 80, 0);
    s('base', 150, 0);
    s('l1', 205, -82);
    b('b0', 285, -92, 0);
    s('r1', 205, 82);
    b('b1', 285, 92, 1);
    b('b2', 250, 0, 2);
    b('b3', 335, -160, 3);
    b('b4', 335, 160, 4);
    b('b5', 115, -95, 5);
    ch('c', 385, 0, 0);
    P('e', ['k', 'base', 'b2']);
    L('base', 'l1', [170, 60]);
    L('l1', 'b0', [170, 60]);
    L('b0', 'c', [170, 60]);
    L('base', 'r1', [170, -60]);
    L('r1', 'b1', [170, -60]);
    L('b1', 'c', [170, -60]);
    L('b0', 'b3');
    L('b1', 'b4');
    L('k', 'b5');
  },
  /* 雪花：中心往六個方向伸出分岔的枝 */
  frost: ({ s, b, ch, L, P }) => {
    s('st', 110, 0);
    s('o', 220, 0);
    s('f', 300, 0);
    s('a60', 260, 69);
    b('b0', 300, 139, 0);
    s('a120', 180, 69);
    b('b1', 140, 139, 1);
    s('a240', 180, -69);
    b('b2', 140, -139, 2);
    s('a300', 260, -69);
    b('b3', 300, -139, 3);
    b('b4', 335, 62, 4);
    b('b5', 335, -62, 5);
    ch('c', 385, 0, 0);
    P('e', ['st', 'o', 'f', 'c']);
    P('o', ['a60', 'b0']);
    P('o', ['a120', 'b1']);
    P('o', ['a240', 'b2']);
    P('o', ['a300', 'b3']);
    L('a60', 'b4');
    L('a300', 'b5');
  },
  /* 閃電：一道之字形往外劈，轉角分出細枝 */
  storm: ({ s, b, ch, L, P }) => {
    s('z1', 80, 0);
    s('z2', 140, -72);
    s('z3', 205, 10);
    b('b0', 265, -62, 0);
    s('z5', 325, 18);
    b('b1', 125, -155, 1);
    b('b2', 235, 92, 2);
    b('b3', 300, -145, 3);
    b('b4', 370, 100, 4);
    b('b5', 70, 92, 5);
    ch('c', 405, -40, -20);
    P('e', ['z1', 'z2', 'z3', 'b0', 'z5', 'c']);
    L('z2', 'b1');
    L('z3', 'b2');
    L('b0', 'b3');
    L('z5', 'b4');
    L('z1', 'b5');
  },
  /* 脊椎與肋骨：一條脊椎往外，兩邊三對肋骨，頂端是頭骨 */
  bonelord: ({ s, b, ch, L, P }) => {
    s('v1', 80, 0);
    s('v2', 160, 0);
    s('v3', 240, 0);
    s('v4', 320, 0);
    b('b0', 150, -90, 0);
    b('b1', 150, 90, 1);
    s('r3l', 230, -90);
    b('b2', 250, -165, 2);
    s('r3r', 230, 90);
    b('b3', 250, 165, 3);
    b('b4', 315, -90, 4);
    b('b5', 315, 90, 5);
    ch('c', 400, 0, 0);
    P('e', ['v1', 'v2', 'v3', 'v4', 'c']);
    L('v2', 'b0');
    L('v2', 'b1');
    P('v3', ['r3l', 'b2']);
    P('v3', ['r3r', 'b3']);
    L('v4', 'b4');
    L('v4', 'b5');
  },
  /* 眼：上下兩道弧夾成眼睛，中間是瞳孔（三選一），還有睫毛 */
  curse: ({ s, b, ch, L, P }) => {
    s('lc', 100, 0);
    s('u1', 170, -78);
    b('b0', 260, -112, 0);
    s('u3', 345, -64);
    s('rc', 385, 0);
    s('d1', 170, 78);
    b('b1', 260, 112, 1);
    s('d3', 345, 64);
    b('b2', 460, 0, 2);
    b('b3', 160, -158, 3);
    b('b4', 160, 158, 4);
    b('b5', 350, -145, 5);
    ch('c', 245, 0, 0);
    L('e', 'lc');
    L('lc', 'u1', [260, 160]);
    L('u1', 'b0', [260, 160]);
    L('b0', 'u3', [260, 160]);
    L('u3', 'rc', [260, 160]);
    L('lc', 'd1', [260, -160]);
    L('d1', 'b1', [260, -160]);
    L('b1', 'd3', [260, -160]);
    L('d3', 'rc', [260, -160]);
    L('rc', 'b2');
    L('u1', 'b3');
    L('d1', 'b4');
    L('u3', 'b5');
    L('lc', 'c');
  },
  /* 血滴：靠近入口是圓圓的底，往外收成尖，尖端是三選一，旁邊滴著血 */
  bloodmage: ({ s, b, ch, L, P }) => {
    const C = [170, 0];
    s('bt', 90, 0);
    s('l1', 130, -69);
    b('b0', 210, -69, 0);
    s('r1', 130, 69);
    b('b1', 210, 69, 1);
    s('t1', 290, -36);
    s('t2', 290, 36);
    b('b2', 170, 0, 2);
    b('b3', 62, -118, 3);
    b('b4', 62, 118, 4);
    b('b5', 235, -150, 5);
    ch('c', 365, 0, 0);
    L('e', 'bt');
    L('bt', 'l1', C);
    L('l1', 'b0', C);
    L('bt', 'r1', C);
    L('r1', 'b1', C);
    P('b0', ['t1', 'c']);
    P('b1', ['t2', 'c']);
    L('bt', 'b2');
    L('l1', 'b3');
    L('r1', 'b4');
    L('b0', 'b5');
  },
  /* 符紙：一張長長的符，裡面一道符文，底下垂著兩條流蘇 */
  talisman: ({ s, b, ch, L, P }) => {
    s('tm', 100, 0);
    s('tl', 100, -62);
    s('tr', 100, 62);
    s('l2', 190, -62);
    b('b0', 280, -62, 0);
    s('l4', 370, -62);
    s('r2', 190, 62);
    b('b1', 280, 62, 1);
    s('r4', 370, 62);
    s('g1', 165, 0);
    b('b2', 240, 0, 2);
    b('b3', 315, 0, 3);
    b('b4', 45, -120, 4);
    b('b5', 45, 120, 5);
    ch('c', 430, 0, 0);
    L('e', 'tm');
    L('tm', 'tl');
    L('tm', 'tr');
    P('tl', ['l2', 'b0', 'l4', 'c']);
    P('tr', ['r2', 'b1', 'r4', 'c']);
    P('tm', ['g1', 'b2', 'b3']);
    L('tl', 'b4');
    L('tr', 'b5');
  },
  /* 飛劍：三把劍從入口扇形飛出去，中間那把的劍尖是三選一 */
  peach: ({ s, b, ch, L, P }) => {
    s('a1', 69, -58);
    s('a2', 130, -109);
    b('b0', 192, -161, 0);
    s('m1', 90, 0);
    s('m2', 170, 0);
    b('b1', 170, -55, 1);
    b('b5', 170, 55, 5);
    s('c1', 69, 58);
    s('c2', 130, 109);
    b('b2', 192, 161, 2);
    b('b3', 245, -215, 3);
    b('b4', 245, 215, 4);
    ch('c', 265, 0, 0);
    P('e', ['a1', 'a2', 'b0', 'b3']);
    P('e', ['m1', 'm2', 'c']);
    L('m2', 'b1');
    L('m2', 'b5');
    P('e', ['c1', 'c2', 'b2', 'b4']);
  },
  /* 神轎：一根橫向的轎槓，上面是方方的轎子，轎頂是三選一 */
  medium: ({ s, b, ch, L, P }) => {
    s('k', 60, 0);
    s('pm', 120, 0);
    s('pl', 120, -85);
    b('b0', 120, -170, 0);
    s('pr', 120, 85);
    b('b1', 120, 170, 1);
    s('cl', 185, -70);
    s('cr', 185, 70);
    b('b2', 275, -70, 2);
    b('b3', 275, 70, 3);
    b('b4', 230, 0, 4);
    b('b5', 340, -135, 5);
    ch('c', 350, 0, 0);
    P('e', ['k', 'pm']);
    P('pm', ['pl', 'b0']);
    P('pm', ['pr', 'b1']);
    P('pl', ['cl', 'b2', 'c']);
    P('pr', ['cr', 'b3', 'c']);
    L('cl', 'b4');
    L('b2', 'b5');
  },
  /* 羅盤：中心往八個方向放射的星芒 */
  master: ({ s, b, ch, L, P }) => {
    s('st', 110, 0);
    s('o', 220, 0);
    b('b0', 220, -112, 0);
    b('b1', 220, 112, 1);
    s('ne', 298, -78);
    b('b2', 350, -132, 2);
    s('se', 298, 78);
    b('b3', 350, 132, 3);
    s('nw', 142, -78);
    b('b4', 90, -132, 4);
    s('sw', 142, 78);
    b('b5', 90, 132, 5);
    ch('c', 330, 0, 0);
    P('e', ['st', 'o', 'c']);
    L('o', 'b0');
    L('o', 'b1');
    P('o', ['ne', 'b2']);
    P('o', ['se', 'b3']);
    P('o', ['nw', 'b4']);
    P('o', ['sw', 'b5']);
  },
  /* 燒瓶：細細的瓶頸往外，接一顆圓圓的瓶身，瓶身裡冒著泡 */
  alchemist: ({ s, b, ch, L, P }) => {
    const C = [320, 0];
    s('n1', 80, 0);
    s('n2', 150, 0);
    s('r0', 235, 0);
    b('b0', 278, -74, 0);
    s('r2', 362, -74);
    s('r4', 362, 74);
    b('b1', 278, 74, 1);
    b('b2', 320, 0, 2);
    b('b3', 150, -82, 3);
    b('b4', 150, 82, 4);
    b('b5', 440, -135, 5);
    ch('c', 430, 0, 0);
    P('e', ['n1', 'n2', 'r0', 'b2']);
    L('r0', 'b0', C);
    L('b0', 'r2', C);
    L('r2', 'c', C);
    L('c', 'r4', C);
    L('r4', 'b1', C);
    L('b1', 'r0', C);
    L('n2', 'b3');
    L('n2', 'b4');
    L('r2', 'b5');
  },
  /* 爪印：一塊肉墊，前面四顆趾頭，其中一顆是三選一 */
  tamer: ({ s, b, ch, L, P }) => {
    s('k', 90, 0);
    s('pad', 200, 0);
    b('b3', 150, -68, 3);
    b('b4', 150, 68, 4);
    s('t1', 240, -66);
    b('b0', 272, -135, 0);
    s('t2', 262, -24);
    b('b1', 325, -52, 1);
    s('t4', 240, 66);
    b('b2', 272, 135, 2);
    b('b5', 105, -140, 5);
    ch('c', 330, 58, 10);
    P('e', ['k', 'pad']);
    L('k', 'b3');
    L('k', 'b4');
    P('pad', ['t1', 'b0']);
    P('pad', ['t2', 'b1']);
    P('pad', ['t4', 'b2']);
    L('pad', 'c');
    L('b3', 'b5');
  }
};
const ASCE = [];
(() => {
  ASC.forEach(c =>
    c.br.forEach((b, bi) => {
      b.cls = c.k;
      ASCB[b.k] = b;
      const T = s => s.map(([tag, o]) => ({ tag: tag === 'T' ? b.tag : tag, ...o })),
        add = (id, o) => (ASCN[id] = { id, br: b.k, nb: [], ...o }),
        mir = bi % 2 ? -1 : 1,
        /* 一般大點：第一層 4 個＋第二層前 2 個；三選一的三個小點：第二層最後 1 個＋原本的 2 個終極 */
        big = [...b.t1, b.t2[0][1], b.t2[1][1]],
        opts = [b.t2[2][1], ...b.u.map(q => q[1])],
        id = k => (k === 'e' ? b.k + '_e' : `${b.k}_${k}`);
      add(b.k + '_e', { kind: 'e', n: b.n, g: b.ic, st: b.en, sup: T(b.enSup || []), d: 0, l: 0, mir });
      let si = 0;
      const L = (x, y, ct) => {
          ASCN[id(x)].nb.push(id(y));
          ASCN[id(y)].nb.push(id(x));
          ASCE.push([id(x), id(y), ct]);
        },
        api = {
          s: (k, d, l) => {
            const [sk, v] = b.sm[si++ % b.sm.length];
            add(id(k), { kind: 's', n: STATN[sk](v), g: SMG[sk] || 'star', st: { [sk]: v }, sup: [], d, l, mir });
          },
          b: (k, d, l, slot) => add(id(k), { kind: 'b', ...big[slot], sup: T(big[slot].sup), d, l, mir }),
          /* 抉擇大點本身給分支的第一種小點屬性 ×2；三個小點離它 80、間隔 50° */
          ch: (k, d, l, ang) => {
            const [sk, v] = b.sm[0];
            add(id(k), {
              kind: 'c',
              n: '三選一',
              full: `${b.n}的抉擇`,
              g: 'stars',
              st: { [sk]: v * 2 },
              sup: [],
              d,
              l,
              mir
            });
            opts.forEach((nd, i) => {
              const t = ((ang + (i - 1) * 50) * Math.PI) / 180;
              add(id(`${k}${i}`), {
                kind: 'o',
                hub: id(k),
                ...nd,
                sup: T(nd.sup),
                d: d + 80 * Math.cos(t),
                l: l + 80 * Math.sin(t),
                mir
              });
              L(k, `${k}${i}`);
            });
          },
          L,
          P: (from, ks) => ks.reduce((p, k) => (L(p, k), k), from)
        };
      ASC_ART[b.k](api);
    })
  );
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
/* 可不可以點：旁邊有已點的節點（或入口）、還有點數；三選一的小點要先點抉擇，而且三個只能點一個 */
function ascCan(id) {
  const n = ASCN[id],
    a = ASCD();
  if (!n || n.kind === 'e' || n.br !== a.br || a.nodes.includes(id) || ascUsed() >= ascPts()) return false;
  if (n.kind === 'o') return a.nodes.includes(n.hub) && !a.nodes.some(q => ASCN[q] && ASCN[q].hub === n.hub);
  return n.nb.some(q => q === a.br + '_e' || a.nodes.includes(q));
}
const ascResetCost = () => 300 + S.lv * 60;
/* 紅點提示：有沒用的昇華點數，或等級已經可以挑戰下一場試煉 */
const ascAlert = () => ascPts() > ascUsed() || (ascNext() != null && S.lv >= ascNext());

/* ================= icons ================= */
/* 節點圖示：分支顏色的圓底＋效果圖示；中間的職業徽章是金框（kind 'u'） */
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

/* ================= board（0.3.0.3：比照天賦樹的全螢幕昇華盤） ================= */
/* 一個昇華職業一張盤：中間是職業徽章，三條分支往外放射（上、右下、左下），可以縮放、拖曳、點節點看說明 */
const AV = { s: 1, x: 0, y: 0, W: 0, H: 0, D: 1, cls: null, sel: null };
/* 0.3.13：昇華不綁天賦樹起點，每個職業都可以選 */
const ascMine = () => true;
const AV_ANG = [-90, 30, 150],
  AV_R = { e: 24, b: 17, c: 21, o: 12, u: 21, s: 11 };
/* 0.3.16 節點在盤上的座標：入口在分支方向離中心 AV_E 的位置，節點用分支造型裡的 (d, l) 轉過去（奇數分支左右鏡像） */
/* AV_K 是整體放大倍率（點跟點拉開） */
const AV_E = 190,
  AV_K = 1.15;
function ascXY(n) {
  const c = ASC.find(q => q.k === ASCB[n.br].cls),
    bi = c.br.findIndex(b => b.k === n.br),
    t = (AV_ANG[bi] * Math.PI) / 180,
    u = [Math.cos(t), Math.sin(t)],
    v = [-u[1], u[0]],
    d = AV_E + n.d * AV_K,
    l = n.l * n.mir * AV_K;
  return [u[0] * d + v[0] * l, u[1] * d + v[1] * l];
}
/* 弧線的控制點：圓心 ct（分支座標）換成世界座標後，取兩端切線交點 */
function ascCtl(A, Bn, ct) {
  const [ax, ay] = ascXY(A),
    [bx, by] = ascXY(Bn),
    [cx, cy] = ascXY({ br: A.br, d: ct[0], l: ct[1], mir: A.mir }),
    mx = (ax + bx) / 2 - cx,
    my = (ay + by) / 2 - cy,
    d2 = mx * mx + my * my,
    r = (Math.hypot(ax - cx, ay - cy) + Math.hypot(bx - cx, by - cy)) / 2;
  if (d2 < 1) return null;
  const f = (r * r) / d2;
  return [cx + mx * f, cy + my * f];
}
const AIMG = new Map();
function ascImg(n, on) {
  const k = n.id + (on ? 1 : 0);
  if (!AIMG.has(k)) {
    const im = new Image();
    im.onload = drawAsc;
    im.src = ascIcon(n, on);
    AIMG.set(k, im);
  }
  return AIMG.get(k);
}
const AX = x => (x - AV.x) * AV.s + AV.W / 2,
  AY = y => (y - AV.y) * AV.s + AV.H / 2;
function openAsc(cls) {
  closeSheet();
  navClose();
  const a = ASCD();
  AV.cls = cls || a.cls || (ASC.find(ascMine) || ASC[0]).k;
  AV.sel = null;
  $('ascView').hidden = false;
  sizeAsc();
  ascFit();
  renderAscCard();
  sfx('select');
}
function closeAsc() {
  $('ascView').hidden = true;
  renderHud();
  save();
}
function sizeAsc() {
  const cv = $('ascCv');
  AV.D = Math.min(2, window.devicePixelRatio || 1);
  AV.W = window.innerWidth;
  AV.H = window.innerHeight;
  cv.width = Math.round(AV.W * AV.D);
  cv.height = Math.round(AV.H * AV.D);
}
/* 有昇華時對準自己的分支，否則看整張盤 */
function ascFit() {
  const a = ASCD();
  if (a.br && a.cls === AV.cls) {
    /* 對準自己分支所有節點的中心 */
    const ps = Object.values(ASCN)
        .filter(n => n.br === a.br)
        .map(ascXY),
      xs = ps.map(q => q[0]),
      ys = ps.map(q => q[1]);
    AV.s = Math.min(
      AV.W / (Math.max(...xs) - Math.min(...xs) + 140),
      (AV.H * 0.62) / (Math.max(...ys) - Math.min(...ys) + 140)
    );
    AV.x = (Math.max(...xs) + Math.min(...xs)) / 2;
    AV.y = (Math.max(...ys) + Math.min(...ys)) / 2 + 60;
  } else {
    AV.s = Math.min(AV.W, AV.H * 0.62) / 1500;
    AV.x = 0;
    AV.y = 40;
  }
  drawAsc();
}
/* 節點狀態：on 已點亮（或是自己分支的入口）、can 現在可以點 */
function ascState(n) {
  const a = ASCD(),
    mine = a.br === n.br;
  return { on: mine && (n.kind === 'e' || a.nodes.includes(n.id)), can: mine && ascCan(n.id), mine };
}
function drawAsc() {
  const cv = $('ascCv');
  if (!cv || $('ascView').hidden) return;
  const x = cv.getContext('2d'),
    c = ASC.find(q => q.k === AV.cls),
    a = ASCD();
  x.setTransform(AV.D, 0, 0, AV.D, 0, 0);
  x.imageSmoothingEnabled = false;
  const g = x.createRadialGradient(AX(0), AY(0), 20 * AV.s, AX(0), AY(0), 620 * AV.s);
  g.addColorStop(0, '#2b2436');
  g.addColorStop(0.6, '#16121c');
  g.addColorStop(1, '#0c0a10');
  x.fillStyle = g;
  x.fillRect(0, 0, AV.W, AV.H);
  /* 裝飾圓環 */
  x.strokeStyle = 'rgba(201,164,92,.16)';
  x.lineWidth = Math.max(1, 6 * AV.s);
  x.beginPath();
  x.arc(AX(0), AY(0), 60 * AV.s, 0, 6.28);
  x.stroke();
  x.strokeStyle = 'rgba(201,164,92,.06)';
  x.lineWidth = Math.max(1, 3 * AV.s);
  x.beginPath();
  x.arc(AX(0), AY(0), 860 * AV.s, 0, 6.28);
  x.stroke();
  const nodes = Object.values(ASCN).filter(n => ASCB[n.br].cls === c.k);
  /* 連線：中心→入口（直線），分支裡的邊照造型畫（有圓心的畫成弧） */
  const line = (A, Bn, on, can, ct) => {
    const [ax, ay] = A ? ascXY(A) : [0, 0],
      [bx, by] = ascXY(Bn),
      k = ct && ascCtl(A, Bn, ct);
    x.strokeStyle = on ? ASCB[Bn.br].col : can ? 'rgba(242,193,78,.7)' : 'rgba(255,255,255,.13)';
    x.lineWidth = Math.max(1.2, (on ? 4 : 2.4) * AV.s);
    x.beginPath();
    x.moveTo(AX(ax), AY(ay));
    if (k) x.quadraticCurveTo(AX(k[0]), AY(k[1]), AX(bx), AY(by));
    else x.lineTo(AX(bx), AY(by));
    x.stroke();
  };
  for (const n of nodes) if (n.kind === 'e') line(null, n, a.br === n.br, false);
  for (const [p, q, ct] of ASCE) {
    const P = ASCN[p],
      Q = ASCN[q];
    if (ASCB[P.br].cls !== c.k) continue;
    const s0 = ascState(P),
      s1 = ascState(Q);
    line(P, Q, s0.on && s1.on, (s0.on && s1.can) || (s1.on && s0.can), ct);
  }
  /* 中心徽章 */
  {
    const r = 42 * AV.s,
      im = ascImg({ id: 'c_' + c.k, br: c.br[0].k, kind: 'u', g: c.ic }, a.cls === c.k);
    x.fillStyle = '#1c1822';
    x.beginPath();
    x.arc(AX(0), AY(0), r, 0, 6.28);
    x.fill();
    if (im.complete) x.drawImage(im, AX(0) - r, AY(0) - r, r * 2, r * 2);
  }
  const fs = Math.max(9, Math.min(14, 17 * AV.s)),
    lab = [];
  x.font = `${fs}px DotGothic16, sans-serif`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  for (const n of nodes) {
    const [wx, wy] = ascXY(n),
      sx = AX(wx),
      sy = AY(wy),
      r = AV_R[n.kind] * AV.s * 1.6,
      st = ascState(n);
    if (sx < -60 || sx > AV.W + 60 || sy < -60 || sy > AV.H + 60) continue;
    if (n.id === AV.sel) {
      x.strokeStyle = '#fff';
      x.lineWidth = 2;
      x.beginPath();
      x.arc(sx, sy, r + 5, 0, 6.28);
      x.stroke();
    }
    if (st.can) {
      x.strokeStyle = `rgba(242,193,78,${0.5 + 0.3 * Math.sin(performance.now() / 300)})`;
      x.lineWidth = 2;
      x.beginPath();
      x.arc(sx, sy, r + 3, 0, 6.28);
      x.stroke();
    }
    const im = ascImg(n, st.on);
    x.globalAlpha = st.on ? 1 : a.br && !st.mine ? 0.4 : 0.8;
    if (im.complete) x.drawImage(im, sx - r, sy - r, r * 2, r * 2);
    x.globalAlpha = 1;
    /* 三選一的三個小點放大一點才顯示名字，不然會擠在一起 */
    if (n.kind !== 's' && (n.kind !== 'o' || AV.s > 1.05) && (AV.s > 0.5 || n.kind === 'e'))
      lab.push([n, sx, sy + r + fs * 0.75, st.on]);
  }
  for (const [n, sx, sy, on] of lab) {
    const nm = n.n,
      w = x.measureText(nm).width + 8;
    x.fillStyle = 'rgba(12,10,16,.75)';
    x.fillRect(sx - w / 2, sy - fs * 0.62, w, fs * 1.24);
    x.fillStyle = n.kind === 'e' ? ASCB[n.br].col : on ? '#f2d9a6' : '#b8ae98';
    x.fillText(nm, sx, sy);
  }
  const pts = ascPts(),
    used = ascUsed();
  $('avPts').innerHTML =
    `<b>${pts - used}</b> 點可用<small>昇華點數 ${used}/${pts}・共 ${ASC_MAX} 點${ascNext() ? `・下一場試煉 Lv${ascNext()}` : ''}</small>`;
  $('avCls').innerHTML =
    `<button class="btn sm" data-act="ascCls" data-v="-1">‹</button><b>${c.n}${a.cls === c.k ? '<small>（目前的昇華）</small>' : ''}</b><button class="btn sm" data-act="ascCls" data-v="1">›</button>`;
}
/* 下方卡片：選中節點的說明與按鈕；沒選時顯示職業說明 */
function renderAscCard() {
  const el = $('avCard'),
    a = ASCD(),
    c = ASC.find(q => q.k === AV.cls),
    n = AV.sel && ASCN[AV.sel],
    pts = ascPts();
  if (!n) {
    el.innerHTML = `<b>${c.n}</b><small class="sub">${c.d}</small><small class="sub">${c.br.map(b => `<span style="color:${b.col}">${b.n}</span>（${b.d}）`).join('<br>')}</small><small class="sub">點節點看效果。8 點只能點在選定的分支裡；每條分支是一張自己的圖案（劍、鎚、盾、弓、火焰…），路線很短、會分岔；「抉擇」大點旁邊掛著三個小點，三個只能點一個。要自己取捨走哪幾條。${pts ? '' : `Lv${ASC_LV[0]} 起到城鎮挑戰昇華試煉取得點數。`}</small>${a.br ? `<button class="btn sm" data-act="ascReset">重選昇華（${ascResetCost()} 金幣，要在城鎮）</button>` : ''}`;
    drawAsc();
    return;
  }
  const b = ASCB[n.br],
    st = ascState(n),
    ok = ascMine(c);
  let act = '';
  if (!a.br) {
    act = !ok
      ? '<small class="sub">起點不同，不能選這個昇華。</small>'
      : pts
        ? `<button class="btn pri" data-act="ascPick" data-k="${b.k}">選擇${b.n}</button>`
        : `<small class="sub">先通過昇華試煉（Lv${ASC_LV[0]} 起，在城鎮）才能選擇分支。</small>`;
  } else if (st.mine) {
    const taken = n.kind === 'o' && a.nodes.some(q => ASCN[q] && ASCN[q].hub === n.hub);
    act = st.on
      ? '<small style="color:var(--good)">已點亮</small>'
      : `<button class="btn pri" data-act="ascTake" data-id="${n.id}" ${st.can ? '' : 'disabled'}>${st.can ? '點亮（1 點）' : ascUsed() >= pts ? '沒有昇華點數' : taken ? '三選一已經選了別的' : n.kind === 'o' ? '先點旁邊的抉擇' : '還不能點（先點旁邊的節點）'}</button>`;
  } else if (a.cls === c.k)
    act = `<button class="btn" data-act="ascSwitch" data-k="${b.k}">改走${b.n}（重選，${ascResetCost()} 金幣，要在城鎮）</button>`;
  else act = `<small class="sub">目前的昇華是 ${ASCB[a.br].n}，要換成這個職業需要先重選昇華。</small>`;
  el.innerHTML = `<div class="rowx"><b style="color:${b.col}">${n.kind === 'e' ? '入口・' : n.kind === 's' ? '小點・' : n.kind === 'o' ? '三選一・' : ''}${n.n}</b><small class="sub">${b.n}</small></div>${
    n.kind === 'c'
      ? '<small class="sub">點了之後，旁邊三個小點可以挑一個點（三個只能點一個）。</small>'
      : n.kind === 'o'
        ? '<small class="sub">三選一：這三個只能點其中一個，要換的話重選昇華。</small>'
        : ''
  }${ascTxt(n)
    .map(t => `<small class="sub" style="display:block;color:var(--ink)">・${esc(t)}</small>`)
    .join('')}${ascCostTxt(n)
    .map(t => `<small style="display:block;color:#ff8a8a">代價：${esc(t)}</small>`)
    .join(
      ''
    )}${n.kind === 'e' ? `<small class="sub">選定${b.n}就會得到入口的效果；輔助型大點套用到「${TAGN[b.tag]}」技能。</small>` : ''}${act}`;
  drawAsc();
}
(() => {
  const cv = $('ascCv'),
    pts = new Map();
  let drag = null,
    pinch = null;
  cv.addEventListener('pointerdown', ev => {
    cv.setPointerCapture(ev.pointerId);
    pts.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pts.size === 1) drag = { x: ev.clientX, y: ev.clientY, cx: AV.x, cy: AV.y, moved: false };
    if (pts.size === 2) {
      const [p, q] = [...pts.values()];
      pinch = {
        d: Math.hypot(p.x - q.x, p.y - q.y),
        s: AV.s,
        mx: (p.x + q.x) / 2,
        my: (p.y + q.y) / 2,
        cx: AV.x,
        cy: AV.y
      };
      drag = null;
    }
  });
  cv.addEventListener('pointermove', ev => {
    if (!pts.has(ev.pointerId)) return;
    pts.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pinch && pts.size === 2) {
      const [p, q] = [...pts.values()],
        ns = Math.max(0.2, Math.min(2.4, (pinch.s * Math.hypot(p.x - q.x, p.y - q.y)) / pinch.d)),
        wx = (pinch.mx - AV.W / 2) / pinch.s + pinch.cx,
        wy = (pinch.my - AV.H / 2) / pinch.s + pinch.cy;
      AV.s = ns;
      AV.x = wx - ((p.x + q.x) / 2 - AV.W / 2) / ns;
      AV.y = wy - ((p.y + q.y) / 2 - AV.H / 2) / ns;
      drawAsc();
      return;
    }
    if (drag) {
      const dx = ev.clientX - drag.x,
        dy = ev.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 8) drag.moved = true;
      if (drag.moved) {
        AV.x = drag.cx - dx / AV.s;
        AV.y = drag.cy - dy / AV.s;
        drawAsc();
      }
    }
  });
  const end = ev => {
    const tap = drag && !drag.moved && pts.size === 1 && ev.type === 'pointerup';
    pts.delete(ev.pointerId);
    if (pts.size < 2) pinch = null;
    if (!pts.size) drag = null;
    if (!tap) return;
    const wx = (ev.clientX - AV.W / 2) / AV.s + AV.x,
      wy = (ev.clientY - AV.H / 2) / AV.s + AV.y;
    let best = null,
      bd = 1e9;
    for (const n of Object.values(ASCN)) {
      if (ASCB[n.br].cls !== AV.cls) continue;
      const [nx, ny] = ascXY(n),
        d = Math.hypot(nx - wx, ny - wy);
      if (d < AV_R[n.kind] * 1.6 + 8 / AV.s && d < bd) {
        bd = d;
        best = n;
      }
    }
    AV.sel = best ? best.id : null;
    sfx('tap');
    renderAscCard();
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
  cv.addEventListener(
    'wheel',
    ev => {
      ev.preventDefault();
      const ns = Math.max(0.2, Math.min(2.4, AV.s * Math.exp(-ev.deltaY * 0.0015))),
        wx = (ev.clientX - AV.W / 2) / AV.s + AV.x,
        wy = (ev.clientY - AV.H / 2) / AV.s + AV.y;
      AV.s = ns;
      AV.x = wx - (ev.clientX - AV.W / 2) / ns;
      AV.y = wy - (ev.clientY - AV.H / 2) / ns;
      drawAsc();
    },
    { passive: false }
  );
  window.addEventListener('resize', () => {
    if (!$('ascView').hidden) {
      sizeAsc();
      drawAsc();
    }
  });
  /* 可以點的節點有呼吸光，每 120ms 重畫一次 */
  setInterval(() => !$('ascView').hidden && ascPts() > ascUsed() && drawAsc(), 120);
})();

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
  asc: () => openAsc(),
  ascClose: () => closeAsc(),
  ascFitAll: () => {
    AV.s = Math.min(AV.W, AV.H * 0.62) / 1500;
    AV.x = 0;
    AV.y = 40;
    drawAsc();
  },
  ascFit: () => ascFit(),
  /* 換看其他昇華職業 */
  ascCls: d => {
    const i = ASC.findIndex(q => q.k === AV.cls);
    AV.cls = ASC[(i + +d.v + ASC.length) % ASC.length].k;
    AV.sel = null;
    ascFit();
    renderAscCard();
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
            AV.cls = c.k;
            AV.sel = b.k + '_a0s';
            sfx('level');
            toast(`昇華為${b.n}！`);
            addLog(`昇華：${c.n}・${b.n}`);
            save();
            ascFit();
            renderAscCard();
          }
        }
      ]
    );
  },
  /* 同一個職業換分支：等於重選，點數返還後直接選新分支 */
  ascSwitch: d => {
    const b = ASCB[d.k],
      a = ASCD(),
      cost = ascResetCost();
    if (!b || !a.br || b.cls !== a.cls) return;
    if (!nearTownE()) return toast('要在城鎮附近才能重選昇華');
    if (S.gold < cost) return toast(`需要 ${cost} 金幣`);
    showModal(
      '改走其他分支',
      `<p>花 ${cost} 金幣從 ${ASCB[a.br].n} 改走 <b>${b.n}</b>，已點的節點全部清掉、點數返還。</p>`,
      [
        { label: '取消', fn: hideModal },
        {
          label: '改走',
          pri: 1,
          fn: () => {
            hideModal();
            S.gold -= cost;
            Object.assign(a, { br: b.k, nodes: [] });
            addLog(`昇華改走${b.n}（-${cost} 金幣）`);
            AV.sel = b.k + '_a0s';
            clampHP();
            save();
            ascFit();
            renderAscCard();
            renderHud();
          }
        }
      ]
    );
  },
  ascTake: d => {
    if (!ascCan(d.id)) return;
    ASCD().nodes.push(d.id);
    sfx('select');
    clampHP();
    save();
    renderAscCard();
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
        onsite: siteBonus(e)
      },
      false
    );
  }
});
