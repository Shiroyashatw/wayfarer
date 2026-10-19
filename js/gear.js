/* ================= 0.3.1 裝備外觀：每種底材的 12×12 圖示、材質階級配色、角色外觀疊圖 ================= */
/* 圖示字母：w 刃、l 刃亮面、b 木柄、t 金屬飾、g 寶石（顏色看稀有度）、m 材質、d 材質暗、h 材質亮、r 紅、c 青、y 黃 */
const GEAR = {
  weapon: [
    /* 短劍 */ [
      'metal',
      '............|.........ww.|........wlw.|.......wlw..|......wlw...|.....wlw....|..t.wlw.....|...tlw......|...bt.......|..b..t......|.g..........|............'
    ],
    /* 長劍 */ [
      'metal',
      '..........ww|.........wlw|........wlw.|.......wlw..|......wlw...|.....wlw....|....wlw.....|.tt.lw......|..ttt.......|..btt.......|.b...t......|g...........'
    ],
    /* 戰斧 */ [
      'metal',
      '....wwww....|...wllllw...|..wllwwlw...|..wlw.bbw...|...ww.b.....|......b.....|.....b......|.....b......|....b.......|....b.......|...t........|............'
    ],
    /* 獵弓 */ [
      'wood',
      '......mm....|.....m..w...|....m....w..|...m......w.|...m......w.|..tt......w.|..tt......w.|...m......w.|...m......w.|....m....w..|.....m..w...|......mm....'
    ],
    /* 法杖 */ [
      'wood',
      '.........gg.|........gllg|........gggg|.......t.gg.|......mt....|.....m......|....m.......|...m........|..m.........|.m..........|d...........|............'
    ],
    /* 雙手大劍 */ [
      'metal',
      '.........www|........wllw|.......wllw.|......wllw..|.....wllw...|....wllw....|.t.wllw.....|..tllw......|..ttt.......|.bbt.t......|bb...t......|g...........'
    ],
    /* 巨斧 */ [
      'metal',
      '.ww.b..ww...|wllwbbwllw..|wlllbblllw..|wllwbbwllw..|.ww.bb.ww...|....bb......|....bb......|....bb......|....bb......|....bb......|....tt......|....gg......'
    ],
    /* 巨鎚 */ [
      'metal',
      '..wwwwwwww..|..wllllllw..|..wlllllww..|..wwwwwwww..|.....bb.....|.....bb.....|.....bb.....|.....bb.....|.....bb.....|.....tt.....|.....bb.....|.....gg.....'
    ],
    /* 單手錘 */ [
      'metal',
      '............|....w.w.....|...wwwww....|..wwlllww...|...wlllw....|..wwwwwww...|....w.w.....|.....b......|.....b......|.....t......|.....b......|.....g......'
    ],
    /* 矛 */ [
      'metal',
      '.........ww.|........wlw.|.......wlw..|......twt...|.....b......|....b.......|...b........|..b.........|.b..........|b...........|............|............'
    ],
    /* 戟 */ [
      'metal',
      '........w...|........w...|.....wwwwww.|.....wllwt..|......wwb...|.......b....|......b.....|.....b......|....b.......|...b........|..b.........|.g..........'
    ],
    /* 長弓 */ [
      'wood',
      '.....mm.....|....m...w...|...m.....w..|..m......w..|..m.......w.|..tt......w.|..tt......w.|..m.......w.|..m......w..|...m.....w..|....m...w...|.....mm.....'
    ],
    /* 弩 */ [
      'wood',
      '............|..t.....t...|...m...m....|....m.m.....|.wwwwwwwwww.|....m.m.....|...mmmmm....|..m..t..m...|.....m......|.....m......|.....dd.....|............'
    ],
    /* 匕首 */ [
      'metal',
      '............|............|........w...|.......wl...|......wl....|.....wl.....|...ttl......|....bt......|...b..t.....|..g.........|............|............'
    ],
    /* 爪 */ [
      'metal',
      '.w...w...w..|.w...w...w..|.wl..wl..wl.|.wl..wl..wl.|..w...w...w.|..w...w...w.|.ttttttttt..|.mmmmmmmmm..|.mhhhhhhhm..|.mmmmmmmmm..|..d..d..d...|............'
    ],
    /* 權杖 */ [
      'wood',
      '.....tgt....|....tgllt...|....tggg....|.....tt.....|.....mm.....|.....mm.....|.....mm.....|.....tt.....|.....mm.....|.....mm.....|.....dd.....|.....t......'
    ],
    /* 桃木劍 */ [
      'wood',
      '..........mm|.........mhm|........mhm.|.......mhm..|......mhm...|.....mhm....|..t.mhm.....|...tmm......|...dt.......|..r..t......|.rr.........|r...........'
    ]
  ],
  helm: [
    /* 皮帽 */ [
      'leather',
      '............|............|....mmmm....|...mhhmmm...|..mhmmmmmm..|..mmmmmmmm..|.dddddddddd.|.d........d.|............|............|............|............'
    ],
    /* 鐵盔 */ [
      'metal',
      '....mmmm....|...mhhmmm...|..mhmmmmmm..|..mmmmmmmm..|..mmtttmmm..|..mm.t..mm..|..mm.t..mm..|..mm....mm..|...m....m...|............|............|............'
    ],
    /* 兜帽 */ [
      'cloth',
      '.....mm.....|....mhhm....|...mhmmmm...|..mhmmmmmm..|..mm....mm..|.mm......mm.|.mm......mm.|.mm......mm.|mmm......mmm|mmmm....mmmm|dddddddddddd|............'
    ],
    /* 角盔 */ [
      'metal',
      'w..........w|w..........w|ww..mmmm..ww|.wwmhhmmmww.|..wmmmmmmw..|..mmmmmmmm..|..mmtttmmm..|..mm....mm..|..mm....mm..|............|............|............'
    ],
    /* 王冠 */ [
      'gold',
      '............|............|..m..m..m...|..mm.m.mm...|..mmmmmmm...|..mgmmmgm...|..mmmmmmm...|..ddddddd...|............|............|............|............'
    ]
  ],
  chest: [
    /* 皮甲 */ [
      'leather',
      '..mm....mm..|.mmmm..mmmm.|.mmmmmmmmmm.|.mhmmmmmmmm.|..mmmddmmm..|..mmmmmmmm..|..mmmddmmm..|..mmmmmmmm..|..tttttttt..|..mmmmmmmm..|...mmmmmm...|............'
    ],
    /* 鎖子甲 */ [
      'metal',
      '..mm....mm..|.mmmm..mmmm.|.mdmdmmdmdm.|.mmhmmmmmmm.|..dmdmdmdm..|..mdmdmdmd..|..dmdmdmdm..|..mdmdmdmd..|..tttttttt..|..dmdmdmdm..|...mmmmmm...|............'
    ],
    /* 法袍 */ [
      'cloth',
      '...mm..mm...|..mmmttmmm..|.mmmmttmmmm.|.mhmmttmmmm.|..mmmttmmm..|..mmmttmmm..|..ggggggggg.|..mmmmmmmm..|.mmmmmmmmmm.|.mmmmmmmmmm.|mmmmmmmmmmmm|dddddddddddd'
    ],
    /* 板甲 */ [
      'metal',
      'mmm......mmm|mhmm....mmmm|mmmmmmmmmmmm|.mhhmmmmmmm.|..mhmmmmmm..|..mmmttmmm..|..mmmttmmm..|..dmmmmmmd..|..tttttttt..|..mmmmmmmm..|...dddddd...|............'
    ],
    /* 鱗甲 */ [
      'scale',
      '..mm....mm..|.mmmm..mmmm.|.mhmhmmhmhm.|.hmhmhhmhmh.|..mhmhmhmh..|..hmhmhmhm..|..mhmhmhmh..|..hmhmhmhm..|..tttttttt..|..mhmhmhmh..|...mmmmmm...|............'
    ]
  ],
  gloves: [
    /* 皮手套 */ [
      'leather',
      '............|...m.m.m....|...m.m.m.m..|...mhmmm.m..|...mmmmmmm..|.m.mmmmmmm..|.mmmmmmmmm..|..mmmmmmm...|...ddddd....|...mmmmm....|...mmmmm....|............'
    ],
    /* 鐵手甲 */ [
      'metal',
      '............|...m.m.m....|..mmmmmmm...|..mhmmmmmm..|..mmmmmmmm..|mmmmmmmmmm..|.mmmtttmmm..|..mmmmmmm...|..ddddddd...|..mmmmmmm...|..mmmmmmm...|............'
    ],
    /* 法術手套 */ [
      'cloth',
      '............|...m.m.m....|...m.m.m.m..|...mmmmm.m..|...mmgmmmm..|.m.mmmmmmm..|.mmmmmmmmm..|..mmmmmmm...|...ttttt....|...mmmmm....|...mmmmm....|............'
    ],
    /* 臂鎧 */ [
      'metal',
      '............|..m.m.m.....|.mmmmmmm....|.mhmmmmmm...|mmmmmmmmm...|.mmmmmmmmm..|..tttttttm..|...mmmmmmmm.|...mhmmmmmm.|....tttttttt|....mmmmmmmm|.....ddddddd'
    ]
  ],
  boots: [
    /* 皮靴 */ [
      'leather',
      '............|....mmmm....|....mhmm....|....mmmm....|....mmmm....|....mmmm....|....mmmmm...|....mmmmmm..|...mmmmmmmm.|...dddddddd.|............|............'
    ],
    /* 鐵靴 */ [
      'metal',
      '....mmmm....|....mhmm....|....tttt....|....mmmm....|....mmmm....|....mmmmm...|....mmmmmm..|...mmmmmmmm.|...mhmmmmmm.|...dddddddd.|............|............'
    ],
    /* 法師鞋 */ [
      'cloth',
      '............|............|............|.....mmm....|.....mhm....|.....mmm....|....mmmmm...|...mmmmmmm..|..mmmgmmmmm.|.mdddddddd..|............|............'
    ],
    /* 戰靴 */ [
      'metal',
      '...mmmmm....|...mhmmm....|...ttttt....|...mmmmm....|...mmmmm....|...ttttt....|...mmmmmm...|...mmmmmmm..|..mmmmmmmmm.|..mhmmmmmmm.|..ddddddddd.|............'
    ]
  ],
  ring: [
    /* 紅寶石 */ [
      'gold',
      '....rrr.....|...rwrrr....|....rrr.....|...mmmmm....|..m.....m...|.m.......m..|.m.......m..|.m.......m..|..m.....m...|...mmmmm....|............|............'
    ],
    /* 藍寶石 */ [
      'gold',
      '....ccc.....|...cwccc....|....ccc.....|...mmmmm....|..m.....m...|.m.......m..|.m.......m..|.m.......m..|..m.....m...|...mmmmm....|............|............'
    ],
    /* 黃玉 */ [
      'gold',
      '....ggg.....|...gwggg....|....ggg.....|...mmmmm....|..m.....m...|.m.......m..|.m.......m..|.m.......m..|..m.....m...|...mmmmm....|............|............'
    ],
    /* 鐵 */ [
      'metal',
      '............|............|....mmmm....|...mhmmmm...|..mm....mm..|..m......m..|..m......m..|..mm....mm..|...mmmmmm...|....dddd....|............|............'
    ],
    /* 月石 */ [
      'gold',
      '....www.....|...wcww.....|....ww......|...mmmmm....|..m.....m...|.m.......m..|.m.......m..|.m.......m..|..m.....m...|...mmmmm....|............|............'
    ]
  ],
  amulet: [
    /* 琥珀 */ [
      'gold',
      't.........t.|.t.......t..|..t.....t...|...t...t....|....ttt.....|...mmmmm....|..mrrrrrm...|..mrwrrrm...|..mrrrrrm...|...mmmmm....|....mmm.....|............'
    ],
    /* 翡翠 */ [
      'gold',
      't.........t.|.t.......t..|..t.....t...|...t...t....|....ttt.....|....mmm.....|...mgggm....|..mgwgggm...|...mgggm....|....mmm.....|.....m......|............'
    ],
    /* 青金 */ [
      'gold',
      't.........t.|.t.......t..|..t.....t...|...t...t....|....ttt.....|...mmmmm....|..mcccccm...|..mcwcccm...|..mcccccm...|...mmmmm....|............|............'
    ],
    /* 骨 */ [
      'bone',
      't.........t.|.t.......t..|..t.....t...|...t...t....|....ttt.....|...mmmmm....|..mmmmmmm...|..mdmmmdm...|..mmmmmmm...|...mdmdm....|...m.m.m....|............'
    ]
  ],
  belt: [
    /* 皮 */ [
      'leather',
      '............|............|............|mmmmmmmmmmmm|mhmmmtttmmmm|mmmmmt.tmmmm|dddddtttdddd|............|............|............|............|............'
    ],
    /* 重 */ [
      'metal',
      '............|............|mmmmmmmmmmmm|mhmmmmmmmmmm|mmmmttttmmmm|mmmmt..tmmmm|mmmmttttmmmm|dddddddddddd|............|............|............|............'
    ],
    /* 鏈 */ [
      'metal',
      '............|............|............|mdmdmdmdmdmd|dmdmdtttdmdm|mdmdmt.tmdmd|dmdmdtttdmdm|............|............|............|............|............'
    ],
    /* 符文 */ [
      'cloth',
      '............|............|............|mmmmmmmmmmmm|mgmmmtttmmgm|mmmmmtgtmmmm|dddddtttdddd|....r..r....|....r..r....|............|............|............'
    ]
  ],
  offhand: [
    /* 提燈 */ [
      'metal',
      '.....tt.....|....t..t....|...tttttt...|...tyyyyt...|...tywyyt...|...tyyyyt...|...tyyyyt...|...tttttt...|....tttt....|............|............|............'
    ],
    /* 聖光提燈 */ [
      'gold',
      '.....mm.....|....m..m....|..mmmmmmmm..|..mywyyyym..|..myyyyyym..|..myyyyyym..|..myyyyyym..|..mmmmmmmm..|...mmmmmm...|....m..m....|............|............'
    ],
    /* 木盾 */ [
      'wood',
      '..mmmmmmmm..|.mhmmdmmmmm.|.mmmmdmmmmm.|.mmmmdmmmmm.|.ddddtdddddd|.mmmmdmmmmm.|.mmmmdmmmmm.|..mmmdmmmm..|...mmdmmm...|....mdmm....|.....mm.....|............'
    ],
    /* 塔盾 */ [
      'metal',
      '.mmmmmmmmmm.|mhhmmmmmmmmm|mhmmmttmmmmm|mmmmmttmmmmm|mmmttttttmmm|mmmttttttmmm|mmmmmttmmmmm|mmmmmttmmmmm|mmmmmmmmmmmm|.mmmmmmmmmm.|..mmmmmmmm..|...dddddd...'
    ],
    /* 符文法珠 */ [
      'gold',
      '............|....gggg....|...gllggg...|..glggggggg.|..gggggggg..|..gggggggg..|...gggggg...|....gggg....|...mmmmmm...|..mmmmmmmm..|..dddddddd..|............'
    ],
    /* 月光法器 */ [
      'metal',
      '...www......|..ww........|.ww.........|.ww.....g...|.ww....ggg..|.ww.....g...|..ww........|...www......|.....ttt....|.....t.t....|.....ttt....|............'
    ],
    /* 符咒 */ [
      'paper',
      '...mmmmmm...|...mmmmmm...|...mmrrmm...|...mrmmrm...|...mmrrmm...|...mmmmmm...|...mmrmmm...|...mrrrmm...|...mmrmmm...|...mmmmmm...|...mmmmmm...|....r..r....'
    ]
  ]
};
/* 材質階級：看物品等級，越高顏色越稀有 */
const TIER_LV = [0, 10, 25, 45, 70],
  TIERN = ['粗製', '精製', '精工', '大師', '星辰'];
const tierOf = ilvl => TIER_LV.reduce((t, v, i) => (ilvl >= v ? i : t), 0);
const MATC = {
  metal: ['#8d949c', '#b8c4d0', '#7fc8dc', '#d8b04a', '#9a7ae0'],
  leather: ['#9a6a3a', '#6b4426', '#5a7a3a', '#8a2a2a', '#3e2e62'],
  cloth: ['#c8b890', '#4a7ad8', '#8a4ad0', '#d04a6a', '#e8ecff'],
  gold: ['#c88a4a', '#f2c14e', '#dfe6ee', '#ff9a7a', '#a8f0ff'],
  wood: ['#8a5a2f', '#b8743a', '#5a3a2a', '#c8b07a', '#4a3a6a'],
  scale: ['#3a8a7a', '#4aa8a0', '#2a6ab8', '#c84a3a', '#8a4ad0'],
  bone: ['#e8e2d4', '#d8c8a0', '#b0b8c0', '#e0a8a0', '#a0f0d0'],
  paper: ['#f2e2a8', '#f6e8b8', '#fff0c8', '#ffe0e0', '#e8f8ff']
};
/* 刃的顏色（鐵、鋼、秘銀、精金、星鐵）與金屬飾 */
const BLADEC = ['#c8ced6', '#eef3fa', '#8fe6ff', '#ffd76a', '#c8a0ff'],
  TRIMC = ['#7a6a52', '#b8862e', '#f2c14e', '#ffe08a', '#fff4c8'],
  GEMC = ['#9a92a8', '#5a8aff', '#ffd166', '#ff8a3a', '#ff4a4a'];
const gearArt = it => GEAR[it.slot] && GEAR[it.slot][it.bi];
/* 一件裝備的配色（圖示和角色外觀共用） */
function gearPal(it) {
  const a = gearArt(it),
    t = tierOf(it.ilvl || 1),
    mat = a ? a[0] : 'metal',
    m = MATC[mat][t],
    w = BLADEC[t];
  return {
    mat,
    t,
    k: baseOf(it).k,
    m,
    d: shade(m, -0.35),
    h: shade(m, 0.4),
    w: mat === 'wood' && it.slot === 'weapon' && baseOf(it).t === 'bow' ? '#efe8d8' : w,
    l: shade(w, 0.55),
    b: '#7a5230',
    tr: TRIMC[t],
    g: GEMC[it.r] || GEMC[0],
    r: '#d84a4a',
    c: '#5ac8f0',
    y: '#f2d25e'
  };
}
const GIC = new Map();
/* 裝備圖示：16×16，外框是稀有度顏色，裡面是底材的圖、顏色看材質階級 */
function gearIcon(it) {
  const a = gearArt(it);
  if (!a) return null;
  const p = gearPal(it),
    k = it.slot + it.bi + '|' + p.t + '|' + it.r;
  if (GIC.has(k)) return GIC.get(k);
  const rows = a[1].split('|'),
    c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const x = c.getContext('2d'),
    rc = it.r ? RCOL[it.r] : '#5a5464';
  x.fillStyle = '#1a1622';
  x.fillRect(1, 1, 14, 14);
  if (it.r) {
    x.fillStyle = `rgba(${RGLOW[it.r]},.2)`;
    x.fillRect(2, 2, 12, 12);
    x.fillStyle = `rgba(${RGLOW[it.r]},.14)`;
    x.fillRect(4, 4, 8, 8);
  }
  x.fillStyle = rc;
  x.fillRect(1, 0, 14, 1);
  x.fillRect(1, 15, 14, 1);
  x.fillRect(0, 1, 1, 14);
  x.fillRect(15, 1, 1, 14);
  if (it.r >= 2) {
    x.fillStyle = shade(rc, 0.5);
    [
      [1, 1],
      [14, 1],
      [1, 14],
      [14, 14]
    ].forEach(([i, j]) => x.fillRect(i, j, 1, 1));
  }
  const F = (i, j) => i >= 0 && j >= 0 && i < 12 && j < 12 && rows[j][i] !== '.';
  x.fillStyle = 'rgba(8,6,12,.95)';
  for (let j = -1; j <= 12; j++)
    for (let i = -1; i <= 12; i++)
      if (!F(i, j) && (F(i + 1, j) || F(i - 1, j) || F(i, j + 1) || F(i, j - 1))) x.fillRect(i + 2, j + 2, 1, 1);
  for (let j = 0; j < 12; j++)
    for (let i = 0; i < 12; i++) {
      const ch = rows[j][i];
      if (ch === '.') continue;
      x.fillStyle = (ch === 't' ? p.tr : p[ch]) || '#f0f';
      x.fillRect(i + 2, j + 2, 1, 1);
    }
  const u = c.toDataURL();
  GIC.set(k, u);
  return u;
}

/* ---------- 角色外觀：頭盔、胸甲、手套、鞋子、副手、武器都會畫在角色身上 ---------- */
const GLOOK = {
  helm: ['cap', 'iron', 'hood', 'horn', 'crown'],
  chest: ['leather', 'chain', 'robe', 'plate', 'scale'],
  gloves: ['cuff', 'gaunt', 'wrap', 'brace'],
  boots: ['low', 'tall', 'shoe', 'tall']
};
/* 外觀代碼（多人時也傳給隊友）：頭／胸／手／鞋／副手／武器 */
function heroLook(eq = S.eq) {
  const g = sl => (eq && eq[sl] && GLOOK[sl] ? GLOOK[sl][eq[sl].bi] || '' : '');
  const w = eq && eq.weapon,
    th = !!(w && BASES.weapon[w.bi].th),
    off = eq && eq.offhand && !th ? BASES.offhand[eq.offhand.bi].k : '';
  return [g('helm'), g('chest'), g('gloves'), g('boots'), off, w ? BASES.weapon[w.bi].k : ''].join('.');
}
/* 正面的武器（畫在第 13～15 欄）：W 刃、L 亮面、B 柄、Y 飾、Q 寶石、S 弦、M 桃木 */
const WFRONT = {
  sword: {
    1: '.L.',
    2: '.W.',
    3: '.W.',
    4: '.W.',
    5: '.W.',
    6: '.W.',
    7: '.W.',
    8: '.W.',
    9: 'YYY',
    10: '.B.',
    11: '.Y.'
  },
  gsword: {
    0: '.L.',
    1: 'LW.',
    2: 'LW.',
    3: 'LW.',
    4: 'LW.',
    5: 'LW.',
    6: 'LW.',
    7: 'LW.',
    8: 'LW.',
    9: 'YYY',
    10: '.B.',
    11: '.B.',
    12: '.Y.'
  },
  dagger: { 5: '.L.', 6: '.W.', 7: '.W.', 8: '.W.', 9: 'YY.', 10: '.B.' },
  peach: {
    1: '.M.',
    2: '.M.',
    3: '.M.',
    4: '.M.',
    5: '.M.',
    6: '.M.',
    7: '.M.',
    8: '.M.',
    9: 'RRR',
    10: '.B.',
    11: '.R.',
    12: '.R.'
  },
  axe: { 3: '.BW', 4: '.BL', 5: '.BW', 6: '.B.', 7: '.B.', 8: '.B.', 9: '.B.', 10: '.B.', 11: '.B.' },
  gaxe: {
    1: '.Y.',
    2: 'WBW',
    3: 'LBL',
    4: 'WBW',
    5: '.B.',
    6: '.B.',
    7: '.B.',
    8: '.B.',
    9: '.B.',
    10: '.B.',
    11: '.B.',
    12: '.B.'
  },
  mace: { 3: '.W.', 4: 'WLW', 5: '.W.', 6: '.B.', 7: '.B.', 8: '.B.', 9: '.B.', 10: '.B.', 11: '.B.' },
  gmace: {
    1: '.L.',
    2: 'WWW',
    3: 'WLW',
    4: 'WWW',
    5: '.B.',
    6: '.B.',
    7: '.B.',
    8: '.B.',
    9: '.B.',
    10: '.B.',
    11: '.B.',
    12: '.B.'
  },
  spear: {
    0: '.L.',
    1: '.W.',
    2: '.W.',
    3: '.Y.',
    4: '.B.',
    5: '.B.',
    6: '.B.',
    7: '.B.',
    8: '.B.',
    9: '.B.',
    10: '.B.',
    11: '.B.',
    12: '.B.',
    13: '.B.',
    14: '.B.'
  },
  halberd: {
    0: '.L.',
    1: '.WW',
    2: 'WWL',
    3: '.WW',
    4: '.Y.',
    5: '.B.',
    6: '.B.',
    7: '.B.',
    8: '.B.',
    9: '.B.',
    10: '.B.',
    11: '.B.',
    12: '.B.',
    13: '.B.',
    14: '.B.'
  },
  bow: { 3: '.B.', 4: 'S.B', 5: 'S.B', 6: 'S.B', 7: 'S.B', 8: 'S.B', 9: 'S.B', 10: 'S.B', 11: 'S.B', 12: '.B.' },
  lbow: {
    1: '.B.',
    2: 'S.B',
    3: 'S.B',
    4: 'S.B',
    5: 'S.B',
    6: 'S.B',
    7: 'S.B',
    8: 'S.B',
    9: 'S.B',
    10: 'S.B',
    11: 'S.B',
    12: 'S.B',
    13: 'S.B',
    14: '.B.'
  },
  xbow: { 6: '..W', 7: '..W', 8: 'BBB', 9: '..W', 10: '..W' },
  claw: { 6: 'L.L', 7: 'W.W', 8: 'WWW', 9: '.B.' },
  staff: {
    0: '.Q.',
    1: 'QLQ',
    2: '.Q.',
    3: '.Y.',
    4: '.B.',
    5: '.B.',
    6: '.B.',
    7: '.B.',
    8: '.B.',
    9: '.B.',
    10: '.B.',
    11: '.B.',
    12: '.B.',
    13: '.B.',
    14: '.B.'
  },
  scepter: { 3: '.Q.', 4: 'YQY', 5: '.Y.', 6: '.Y.', 7: '.Y.', 8: '.Y.', 9: '.Y.', 10: '.Y.', 11: '.Y.' }
};
/* 副手：正面畫在第 0～2 欄（左手邊），側面背在背後（第 12～14 欄） */
const OFRONT = {
  shield: { 8: 'OOO', 9: 'OPO', 10: 'OOO', 11: 'OOO', 12: '.O.' },
  lantern: { 9: '.P.', 10: 'POP', 11: 'POP', 12: '.P.' },
  focus: { 7: '.O.', 8: 'OPO', 9: '.O.' },
  talisman: { 8: '.O.', 9: '.O.', 10: '.R.', 11: '.O.' }
};
const put = (rows, x, y, ch, onlyEmpty) => {
  if (y < 0 || y > 15 || x < 0 || x > 15) return;
  if (onlyEmpty && rows[y][x] !== '.') return;
  rows[y][x] = ch;
};
const stamp = (rows, map, x0, onlyEmpty) =>
  Object.entries(map).forEach(([y, s]) =>
    [...s].forEach((ch, i) => ch !== '.' && put(rows, x0 + i, +y, ch, onlyEmpty))
  );
/* 依外觀代碼組出角色像素圖（F 正面、S 側面），註冊進 SPR 並回傳名稱 */
function heroSpr(view = 'F', look = heroLook()) {
  const name = 'hero' + view + ':' + look;
  if (SPR[name]) return name;
  const [hm, ch, gl, bt, off, wk] = look.split('.'),
    F = view === 'F',
    rows = SPR['hero' + view].map(r => [...r.padEnd(16, '.')]);
  const each = (fn, y0 = 0, y1 = 15) => {
    for (let y = y0; y <= y1; y++) for (let x = 0; x < 16; x++) fn(x, y, rows[y][x]);
  };
  /* 頭盔 */
  if (hm === 'cap') {
    each((x, y, c) => c === 'h' && put(rows, x, y, 'H'), 0, 1);
    each((x, y, c) => c === 'h' && put(rows, x, y, 'T'), 2, 2);
  } else if (hm === 'iron' || hm === 'horn' || hm === 'hood') {
    each((x, y, c) => c === 'h' && put(rows, x, y, 'H'));
    if (hm !== 'hood') each((x, y, c) => c === 'H' && put(rows, x, y, 'T'), 2, 2);
    if (F) {
      if (hm !== 'hood') [7, 8].forEach(x => put(rows, x, 3, 'T'));
      else {
        put(rows, 3, 5, 'H');
        put(rows, 12, 5, 'H');
        put(rows, 4, 6, 'H');
        put(rows, 11, 6, 'H');
      }
    } else if (hm === 'hood') {
      put(rows, 3, 2, 'H');
      [9, 10, 11].forEach(x => put(rows, x, 7, 'H'));
    } else put(rows, 4, 3, 'T');
    if (hm === 'horn') {
      if (F)
        [
          [2, 2],
          [2, 1],
          [1, 0],
          [13, 2],
          [13, 1],
          [14, 0]
        ].forEach(([x, y]) => put(rows, x, y, 'X'));
      else
        [
          [13, 2],
          [13, 1],
          [14, 0]
        ].forEach(([x, y]) => put(rows, x, y, 'X'));
    }
  } else if (hm === 'crown') {
    if (F) {
      rows[0] = [...'.....H.HH.H.....'];
      for (let x = 4; x <= 11; x++) put(rows, x, 1, x === 7 || x === 8 ? 'J' : 'H');
    } else {
      rows[0] = [...'......H.H.H.....'];
      each((x, y, c) => c === 'h' && put(rows, x, y, x === 8 ? 'J' : 'H'), 1, 1);
    }
  }
  /* 胸甲 */
  if (ch === 'chain' || ch === 'scale')
    each(
      (x, y, c) =>
        c === 'a' && (ch === 'chain' ? (x + y) % 2 === 0 : (x + (y % 2) * 2) % 3 === 0) && put(rows, x, y, 'A'),
      8,
      11
    );
  else if (ch === 'plate') {
    if (F) {
      [2, 3, 4, 5, 10, 11, 12, 13].forEach(x => put(rows, x, 7, 'c'));
      [3, 4, 11, 12].forEach(x => put(rows, x, 6, 'c'));
      [7, 8].forEach(x => [8, 9].forEach(y => put(rows, x, y, 'A')));
    } else {
      [9, 10, 11, 12].forEach(x => put(rows, x, 6, 'c', true));
      [5, 6].forEach(y => put(rows, 6, y + 3, 'A'));
    }
  } else if (ch === 'robe') {
    if (F) {
      [12, 13, 14].forEach(y => {
        for (let x = 4; x <= 11; x++) put(rows, x, y, x === 7 || x === 8 ? 'A' : 'a');
      });
      put(rows, 3, 14, 'a');
      put(rows, 12, 14, 'a');
    } else
      [12, 13, 14].forEach(y => {
        for (let x = 3; x <= 12; x++) if (rows[y][x] !== '.' || (x > 3 && x < 12)) put(rows, x, y, 'a');
      });
  }
  /* 手套：手的位置；鐵手甲與臂鎧連袖口一起包 */
  if (gl) {
    const hands = F
      ? [
          [3, 9],
          [3, 10],
          [12, 9],
          [12, 10]
        ]
      : [
          [3, 9],
          [2, 10],
          [3, 10]
        ];
    hands.forEach(([x, y]) => put(rows, x, y, 'G'));
    if (gl === 'gaunt' || gl === 'brace')
      (F
        ? [
            [2, 9],
            [2, 10],
            [13, 9],
            [13, 10]
          ]
        : [[4, 9]]
      ).forEach(([x, y]) => rows[y][x] !== '.' && put(rows, x, y, 'G'));
  }
  /* 鞋子：高筒的蓋到小腿 */
  if (bt === 'tall') each((x, y, c) => c === 'l' && put(rows, x, y, 'f'), 14, 14);
  if (bt === 'shoe') each((x, y, c) => c === 'f' && (x === 3 || x === 2) && put(rows, x, y, 'Z'), 15, 15);
  /* 副手與武器 */
  if (off && OFRONT[off]) stamp(rows, OFRONT[off], F ? 0 : 12, !F);
  if (F && wk && WFRONT[wk]) stamp(rows, WFRONT[wk], 13);
  SPR[name] = rows.map(r => r.join(''));
  return name;
}
/* 角色配色：主色看天賦盤起點，身上的裝備用材質階級的顏色 */
function heroPal(cls = S.cls, eq = S.eq) {
  const cc = (CLASSES[cls] || CLASSES.novice).color,
    P = sl => (eq && eq[sl] && gearArt(eq[sl]) ? gearPal(eq[sl]) : null),
    hp = P('helm'),
    cp = P('chest'),
    gp = P('gloves'),
    bp = P('boots'),
    lp = P('belt'),
    wp = P('weapon'),
    op = P('offhand');
  const ok = op && op.k,
    wr = eq && eq.weapon ? eq.weapon.r : 0;
  return {
    h: '#6b3324',
    s: '#f1c27d',
    e: '#1a1626',
    c: cp ? (cp.mat === 'cloth' ? cp.tr : cp.m) : cc,
    a: cp ? (cp.mat === 'leather' ? cc : cp.mat === 'cloth' ? cp.m : shade(cp.m, -0.18)) : shade(cc, -0.35),
    A: cp ? (cp.mat === 'cloth' ? cp.tr : cp.h) : cc,
    b: lp ? lp.m : '#d9a441',
    l: '#3b3550',
    f: bp ? bp.m : '#5a3a26',
    Z: bp ? bp.tr : '#d9a441',
    H: hp ? hp.m : '#6b3324',
    T: hp ? (hp.mat === 'cloth' ? hp.d : hp.tr) : '#d9a441',
    X: '#efe6d0',
    J: hp ? hp.g : '#e5484d',
    G: gp ? gp.m : '#f1c27d',
    W: wp ? wp.w : '#c8ced6',
    L: wp ? wp.l : '#ffffff',
    B: wp && wp.mat === 'wood' ? wp.m : '#7a5230',
    Y: wp ? wp.tr : '#b8862e',
    Q: wr ? GEMC[wr] : '#7fe0ff',
    S: '#efe8d8',
    M: wp ? wp.m : '#b8743a',
    R: '#e5484d',
    O: !op
      ? '#8a5a2f'
      : ok === 'lantern'
        ? '#ffe08a'
        : ok === 'focus'
          ? op.mat === 'gold'
            ? '#c86aff'
            : '#7fe0ff'
          : op.m,
    P: !op ? '#d9a441' : ok === 'focus' ? '#ffffff' : op.tr
  };
}
