/* 漫步勇者 · 像素圖：16x16 角色怪物、8x8 圖示 */
'use strict';
/* ================= pixel sprites (original art) ================= */
const SPR = {
  heroF: [
    '.....hhhhhh.....',
    '....hhhhhhhh....',
    '...hhhhhhhhhh...',
    '...hhsssssshh...',
    '...hsessssesh...',
    '....ssssssss....',
    '.....ssssss.....',
    '...cccaaaaccc...',
    '..ccaaaaaaaacc..',
    '..csaaaaaaaasc..',
    '..csabbbbbbasc..',
    '...caaaaaaaac...',
    '....aaa..aaa....',
    '....lll..lll....',
    '....lll..lll....',
    '...ffff..ffff...'
  ],
  heroS: [
    '......hhhhh.....',
    '.....hhhhhhhh...',
    '....hhhhhhhhhh..',
    '....sshhhhhhhh..',
    '...sesshhhhhhh..',
    '...ssssshhhhh...',
    '....sssshhh.....',
    '.....aaaaccc....',
    '....aaaaacccc...',
    '...saaaaaccccc..',
    '..ssabbbbacccc..',
    '....aaaaaaccc...',
    '....aaa..aacc...',
    '....ll....ll....',
    '...lll....lll...',
    '..fff....fff....'
  ],
  slime: [
    '................',
    '................',
    '................',
    '......gggg......',
    '....gggggggg....',
    '...gggwggggggg..',
    '..ggwwgggggggg..',
    '..gggggggggggg..',
    '.gggeegggeeggg..',
    '.gggeegggeeggg..',
    '.gggggggggggggg.',
    'gggggggggggggggg',
    'gggggggggggggggg',
    '.gggggggggggggg.',
    '..gggggggggggg..',
    '................'
  ],
  bat: [
    '................',
    '................',
    '................',
    '.p............p.',
    '.pp...p..p...pp.',
    '.ppp..pppp..ppp.',
    'pppppppppppppppp',
    'pppppeppppeppppp',
    '.pppppppppppppp.',
    '..pp.pppppp.pp..',
    '...p..pppp..p...',
    '......pwwp......',
    '......p..p......',
    '................',
    '................',
    '................'
  ],
  boar: [
    '................',
    '................',
    '................',
    '................',
    '.....bbbbbbb....',
    '...bbbbbbbbbbb..',
    '..bbbbbbbbbbbbb.',
    '.bbbbbbbbbbbbeb.',
    '.bbbbbbbbbbbbbnn',
    '.bbbbbbbbbbbbwnn',
    '..bbbbbbbbbbbw..',
    '..bbbbbbbbbbb...',
    '..bb.bb...bb.bb.',
    '..bb.bb...bb.bb.',
    '..kk.kk...kk.kk.',
    '................'
  ],
  scare: [
    '....yyyyyyyy....',
    '..yyyyyyyyyyyy..',
    '.....tttttt.....',
    '.....tettet.....',
    '.....ttmmtt.....',
    '.......ww.......',
    'rrrrrrrrrrrrrrrr',
    'yy.rrrrrrrrrr.yy',
    '....rrrrrrrr....',
    '....rrrrrrrr....',
    '.....yyyyyy.....',
    '.......ww.......',
    '.......ww.......',
    '.......ww.......',
    '.......ww.......',
    '.....wwwwww.....'
  ],
  spirit: [
    '................',
    '......vvvv......',
    '....vvvvvvvv....',
    '...vvvvvvvvvv...',
    '..vvveevveevvv..',
    '..vvveevveevvv..',
    '..vvvvvvvvvvvv..',
    '..vvvvmmmmvvvv..',
    '..vvvvvmmvvvvv..',
    '.vvvvvvvvvvvvvv.',
    '.vvvvvvvvvvvvvv.',
    'vvvvvvvvvvvvvvvv',
    'vv.vvvvvvvvvv.vv',
    'v...vvv..vvv...v',
    '.....v....v.....',
    '................'
  ],
  wolf: [
    '................',
    '................',
    '................',
    '...........g.g..',
    '..........gggg..',
    '..........ggegg.',
    'g.........gggggg',
    'gg..ggggggggggnn',
    '.ggggggggggggg..',
    '..gggggggggggg..',
    '..ggggggggggg...',
    '..gwwwwwwwwgg...',
    '..gg.gg..gg.gg..',
    '..gg.gg..gg.gg..',
    '..kk.kk..kk.kk..',
    '................'
  ],
  golem: [
    '................',
    '.....rrrrrr.....',
    '....rrrrrrrr....',
    '....ryyrryyr....',
    '....rrrrrrrr....',
    '..rrrrrrrrrrrr..',
    '.rrrrrrrrrrrrrr.',
    'rrrrrrryyrrrrrrr',
    'rrr.rrryyrrr.rrr',
    'rrr.rrrrrrrr.rrr',
    'rr..rrrrrrrr..rr',
    '....rrrrrrrr....',
    '....rrr..rrr....',
    '...rrrr..rrrr...',
    '...rrrr..rrrr...',
    '................'
  ],
  bear: [
    '................',
    '...bb......bb...',
    '..bbbb....bbbb..',
    '..bbbbbbbbbbbb..',
    '...bbbbbbbbbb...',
    '...bebbbbbbeb...',
    '...bbbbnnbbbb...',
    '....bbnkknbb....',
    '...bbbbnnbbbb...',
    '..bbbwwwwwwbbb..',
    '.bbbbbwwwwbbbbb.',
    '.bbbbbbwwbbbbbb.',
    '.bbbbbbbbbbbbbb.',
    '..bbbbb..bbbbb..',
    '..bbbb....bbbb..',
    '..kkk......kkk..'
  ],
  crab: [
    '................',
    '................',
    '..rr........rr..',
    '.rrrr......rrrr.',
    '.rr.r......r.rr.',
    '..rrr.e..e.rrr..',
    '....r.e..e.r....',
    '...rrrrrrrrrr...',
    '..rrrrrrrrrrrr..',
    '.rrrrwrrrrwrrrr.',
    '.rrrrrrrrrrrrrr.',
    '..rrrrrrrrrrrr..',
    '..r.r.r..r.r.r..',
    '.r..r..r..r..r..',
    '................',
    '................'
  ],
  mush: [
    '................',
    '.....rrrrrr.....',
    '...rrrwwrrrrr...',
    '..rrrrwwrrrwwr..',
    '.rrwwrrrrrrwwrr.',
    '.rrwwrrrrrrrrrr.',
    'rrrrrrrrrwwrrrrr',
    'rrrrrrrrrwwrrrrr',
    '..ssssssssssss..',
    '....ssssssss....',
    '....sesssses....',
    '....ssssssss....',
    '....sssmmsss....',
    '....ssssssss....',
    '...ssssssssss...',
    '................'
  ],
  bird: [
    '................',
    '................',
    '........bbbb....',
    '.......bbbbbb...',
    '.......bbebbyy..',
    '.......bbbbbyy..',
    '..bbbbbbbbbb....',
    '.bbbbbbbbbbb....',
    'bbbbwwbbbbbb....',
    'bbbbbbbbbbb.....',
    '.bbbbbbbbbb.....',
    '...bbbbbbb......',
    '.....k..k.......',
    '.....k..k.......',
    '....kk.kk.......',
    '................'
  ],
  frog: [
    '................',
    '................',
    '................',
    '...gg......gg...',
    '..gwwg....gwwg..',
    '..gwkg....gkwg..',
    '..gggggggggggg..',
    '.gggggggggggggg.',
    '.ggmmmmmmmmmmgg.',
    '.gggggggggggggg.',
    '..gwwwwwwwwwwg..',
    '.gg.gwwwwwwg.gg.',
    'gg..gg....gg..gg',
    'g...g......g...g',
    '................',
    '................'
  ],
  snake: [
    '................',
    '....ssssss......',
    '...ssssssss.....',
    '...sessssess....',
    '...ssssssssss...',
    '....swwwwss.....',
    '....sbbbbs......',
    '.....sbbs.......',
    '.....ssss.......',
    '......sss.......',
    '.......sss......',
    '...bbbbbsss.....',
    '..bbbbbbbbbb....',
    '.bbbbbbbbbbbbb..',
    '..bbbbbbbbbbbbb.',
    '................'
  ],
  shrine: [
    '.r............r.',
    '.rrrrrrrrrrrrrr.',
    'rrrrrrrrrrrrrrrr',
    '..oooooooooooo..',
    '...wwwwwwwwww...',
    '...wrrwwwwrrw...',
    '...wrrwkkwrrw...',
    '...wrrwkkwrrw...',
    '...wrrwyywrrw...',
    '...wrrwwwwrrw...',
    '.oooooooooooooo.',
    '.gggggggggggggg.'
  ],
  shop: [
    'wwwwwwwwwwwwwwww',
    'goggoggoggoggogg',
    'wwwwwwwwwwwwwwww',
    'wbbbbbbwwbbbbbbw',
    'wbbbbbbwwbbbbbbw',
    'wbbbbbbwwbbbbbbw',
    'wwwwwwwkkwwwwwww',
    'wwwwwwwkkwwwwwww',
    'xxxxxxxxxxxxxxxx'
  ],
  dungeon: [
    '....xxxxxxxx....',
    '..xxxxxxxxxxxx..',
    '.xxxxkkkkkkxxxx.',
    'xxxxkkkkkkkkxxxx',
    'xxxkkkkkkkkkkxxx',
    'xxxkkkkkkkkkkxxx',
    'xxkkkkrkkrkkkkxx',
    'xxkkkkkkkkkkkkxx',
    'xxkkkkkkkkkkkkxx',
    'mmmmmmmmmmmmmmmm'
  ],
  crystal: [
    '.......cc.......',
    '......cwcc......',
    '......cwcc......',
    '.....ccwccc.....',
    '.....cwcccc.....',
    '.....cwcccc.....',
    '.....ccccccc....',
    '......ccccc.....',
    '......ccccc.....',
    '.......ccc......',
    '................',
    '....xxxxxxxx....',
    '...xxxxxxxxxx...',
    '..xxxxxxxxxxxx..'
  ],
  castle: [
    '..f.........f...',
    '..ff........ff..',
    '..s..........s..',
    '.sss........sss.',
    '.sss.ssssss.sss.',
    '.ssssssssssssss.',
    '.sssbsssssbssss.',
    '.ssssssssssssss.',
    'ssssssssssssssss',
    'sssbssskksssbsss',
    'ssssssskksssssss',
    'ssssssskksssssss',
    'xxxxxxxxxxxxxxxx'
  ],
  camp: [
    '......f.........',
    '......fff.......',
    '......f.........',
    '.......cc.......',
    '......cccc......',
    '.....cccccc.....',
    '....ccckkccc....',
    '...cccckkcccc...',
    '..ccccckkccccc..',
    '.cccccckkcccccc.',
    'xxxxxxxxxxxxxxxx'
  ]
};
const ICONS = {
  sword: ['.......w', '......ww', '.....ww.', '....ww..', 'k.ww....', '.kw.....', 'bkk.....', 'b..k....'],
  axe: ['..kkk...', '.kwwwk..', 'kwwwwbk.', '.kwwbk..', '..kbk...', '...b....', '....b...', '.....b..'],
  shield: ['.kkkkkk.', 'kwwbbwwk', 'kwwbbwwk', 'kbbbbbbk', 'kwwbbwwk', '.kwbbwk.', '..kwwk..', '...kk...'],
  flame: ['...r....', '..rr....', '..ryr...', '.ryyr.r.', '.ryyyrr.', 'ryyyyyr.', 'ryyyyyr.', '.rrrrr..'],
  ice: ['...c....', '..ccc...', 'c..c..c.', '.c.c.c..', 'ccccccc.', '.c.c.c..', 'c..c..c.', '...c....'],
  heart: ['.rr.rr..', 'rrrrrrr.', 'rrwrrrr.', 'rrrrrrr.', '.rrrrr..', '..rrr...', '...r....', '........'],
  arrow: ['......ww', '.....kww', '....k.w.', '...k....', '..k.....', 'bk......', 'bb......', '........'],
  leaf: ['.....gg.', '...gggg.', '..gggyg.', '.ggygg..', '.gygg...', '..gg....', '.b......', 'b.......'],
  book: ['.bbbbbb.', 'bwwwwwbb', 'bwkkwwbb', 'bwwwwwbb', 'bwkkkwbb', 'bwwwwwbb', '.bbbbbbb', '........'],
  bag: ['..kkkk..', '.k....k.', '..kkkk..', '.bbbbbb.', 'bbbybbbb', 'bbbbbbbb', 'bbbbbbbb', '.bbbbbb.'],
  run: ['....kk..', '...kwwk.', '..kwwk..', '.kwwk...', 'kwwwwk..', 'kbbbbbk.', 'kkkkkkk.', '........'],
  castle: ['w.w..w.w', 'wwwwwwww', '.wwwwww.', '.wkwwkw.', '.wwwwww.', '.wwkkww.', '.wwkkww.', '........'],
  eye: ['........', '..wwww..', '.wwccww.', 'wwckkcww', 'wwckkcww', '.wwccww.', '..wwww..', '........'],
  flag: ['k.......', 'kyyyyy..', 'kyyyyyy.', 'kyyyyy..', 'kyyyy...', 'k.......', 'k.......', 'kk......'],
  party: ['.ww..yy.', 'wwwwyyyy', '.ww..yy.', '........', 'wwwwyyyy', 'wwwwyyyy', 'wwwwyyyy', '........'],
  key: ['..yyy...', '.y...y..', '.y...y..', '..yyy...', '...y....', '...yy...', '...y....', '...yy...'],
  star: ['...yy...', '...yy...', 'yyyyyyyy', '.yyyyyy.', '..yyyy..', '.yy..yy.', 'yy....yy', '........'],
  gear: ['...ww...', '.w.ww.w.', '..wwww..', 'wwwkkwww', 'wwwkkwww', '..wwww..', '.w.ww.w.', '...ww...']
};
const ICOPAL = { w: '#e8e6e0', k: '#3a3340', b: '#9a6a3a', y: '#ffd166', r: '#e5484d', c: '#8fe0ff', g: '#7bd36b' };
const PAL = {
  shrine: { r: '#c23a30', o: '#e8a33a', w: '#f2e6cc', y: '#ffd34d', g: '#8a8577' },
  shop: { w: '#eef0f2', o: '#e98a2f', g: '#3fa35a', b: '#9fd4ef', x: '#8a8790' },
  dungeon: { x: '#7b7182', m: '#5b5466', r: '#ff4d4d' },
  crystal: { c: '#6fdcff', w: '#ffffff', x: '#8a8577' },
  castle: { s: '#d8cfb8', f: '#e5484d', b: '#f2c14e', x: '#8a8577' },
  camp: { c: '#c9a46a', f: '#3f9ae0', x: '#8a8577' }
};
const FIXED = { k: '#120e1a' },
  SPC = new Map();
function sprite(name, pal, white) {
  const key = name + '|' + JSON.stringify(pal) + (white ? 'w' : '');
  let c = SPC.get(key);
  if (c) return c;
  let rows = SPR[name].map(r => r.padEnd(16, '.').slice(0, 16));
  while (rows.length < 16) rows.unshift('................');
  c = document.createElement('canvas');
  c.width = 18;
  c.height = 18;
  const x = c.getContext('2d');
  const F = (i, j) => j >= 0 && j < 16 && i >= 0 && i < 16 && rows[j][i] !== '.';
  for (let j = 0; j < 16; j++)
    for (let i = 0; i < 16; i++) {
      const ch = rows[j][i];
      if (ch === '.') continue;
      let col = FIXED[ch] || pal[ch] || '#ff00ff';
      if (white) col = '#ffffff';
      else if (ch !== 'e' && ch !== 'k') {
        if (!F(i, j - 1)) col = shade(col, 0.3);
        else if (!F(i, j + 1)) col = shade(col, -0.32);
        else if (!F(i + 1, j)) col = shade(col, -0.16);
        else if (!F(i - 1, j)) col = shade(col, 0.1);
      }
      x.fillStyle = col;
      x.fillRect(i + 1, j + 1, 1, 1);
    }
  if (!white) {
    x.fillStyle = 'rgba(14,10,22,.92)';
    for (let j = -1; j <= 16; j++)
      for (let i = -1; i <= 16; i++) {
        if (F(i, j)) continue;
        if (F(i + 1, j) || F(i - 1, j) || F(i, j + 1) || F(i, j - 1)) x.fillRect(i + 1, j + 1, 1, 1);
      }
  }
  SPC.set(key, c);
  return c;
}
function spriteCanvas(name, pal, flip) {
  const c = document.createElement('canvas');
  c.width = 18;
  c.height = 18;
  const x = c.getContext('2d');
  if (flip) {
    x.translate(18, 0);
    x.scale(-1, 1);
  }
  x.drawImage(sprite(name, pal), 0, 0);
  return c;
}
function drawSpr(c, name, pal, x, y, s, flip, white) {
  const sp = sprite(name, pal, white);
  c.save();
  c.imageSmoothingEnabled = false;
  if (flip) {
    c.translate(x, 0);
    c.scale(-1, 1);
    c.drawImage(sp, -9 * s, y - 17 * s, 18 * s, 18 * s);
  } else c.drawImage(sp, x - 9 * s, y - 17 * s, 18 * s, 18 * s);
  c.restore();
}
const ICC = new Map();
function iconURL(n) {
  if (ICC.has(n)) return ICC.get(n);
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 8;
  paintIcon(c, n);
  const u = c.toDataURL();
  ICC.set(n, u);
  return u;
}
function paintIcon(c, n) {
  const x = c.getContext('2d'),
    r = ICONS[n];
  x.clearRect(0, 0, 8, 8);
  for (let j = 0; j < 8; j++)
    for (let i = 0; i < 8; i++) {
      const ch = r[j][i];
      if (ch === '.') continue;
      x.fillStyle = ICOPAL[ch];
      x.fillRect(i, j, 1, 1);
    }
}
const heroPal = () => ({
  h: '#6b3324',
  s: '#f1c27d',
  e: '#1a1626',
  c: CLASSES[S.cls].color,
  a: shade(CLASSES[S.cls].color, -0.35),
  b: '#d9a441',
  l: '#3b3550',
  f: '#5a3a26'
});

/* ================= icons: currency, item slots, passive nodes ================= */
const PIX = {
  cur_trans: {
    r: ['...ww...', '..wbbw..', '.wbbbbw.', 'wbbllbbw', 'wbbllbbw', '.wbbbbw.', '..wbbw..', '...ww...'],
    p: { w: '#dfe8ff', b: '#5f8fff', l: '#bcd2ff' }
  },
  cur_regal: {
    r: ['y..y..y.', 'yy.yy.yy', 'yyyyyyyy', '.tttttt.', 'tttwtttt', 'tttttttt', '.tttttt.', '..tttt..'],
    p: { y: '#f2c14e', t: '#3fae96', w: '#d6fff4' }
  },
  cur_aug: {
    r: ['...bb...', '...bb...', '..bwwb..', 'bbwbbwbb', 'bbwbbwbb', '..bwwb..', '...bb...', '...bb...'],
    p: { b: '#6aa8ff', w: '#e8f2ff' }
  },
  cur_alch: {
    r: ['..yyyy..', '.yywyyy.', 'yywyyyyo', 'yyyyyyyo', 'yyyyyyyo', 'yyyyyyoo', '.yyyyoo.', '..oooo..'],
    p: { y: '#f2c14e', w: '#fff6c8', o: '#b07d1a' }
  },
  cur_chaos: {
    r: ['..oooo..', '.oorroo.', 'oor..roo', 'or.oo.ro', 'or.o.rro', 'oorr.roo', '.oorroo.', '..oooo..'],
    p: { o: '#e58a3a', r: '#9a2f7a' }
  },
  cur_exalt: {
    r: ['...ww...', '...yy...', 'wwyyyyww', '.wyyyyw.', '..wyyw..', '.wy..yw.', 'wy....yw', '........'],
    p: { w: '#ffffff', y: '#fff0a0' }
  },
  sl_sword: { r: ['.......w', '......wm', '.....wm.', '....wm..', 'k.wm....', '.kw.....', 'bkk.....', 'b..k....'] },
  sl_axe: { r: ['..mmm...', '.mwwwm..', 'mwwwwbm.', '.mwwbm..', '..mbm...', '...b....', '....b...', '.....b..'] },
  sl_bow: { r: ['..mm..w.', '.m...w..', 'm...w...', 'm..w....', 'm.w.....', 'mw......', '.mm.....', '...mm...'] },
  sl_staff: { r: ['.....mm.', '....mwm.', '....mm..', '...b....', '..b.....', '.b......', 'b.......', '........'] },
  sl_helm: { r: ['........', '..mmmm..', '.mwmmmm.', 'mmmmmmmm', 'mm.mm.mm', 'mm....mm', 'm......m', '........'] },
  sl_chest: { r: ['.m....m.', 'mmm..mmm', 'mmmmmmmm', '.mwmmmm.', '.mmmmmm.', '.mmkkmm.', '.mmmmmm.', '..mmmm..'] },
  sl_gloves: { r: ['..m.m.m.', '.mmmmmm.', '.mmmmmm.', '.mwmmmm.', '.mmmmmm.', '..mmmm..', '..kkkk..', '..kkkk..'] },
  sl_boots: { r: ['..mmm...', '..mwm...', '..mmm...', '..mmmm..', '..mmmmm.', '.mmmmmmm', '.kkkkkkk', '........'] },
  sl_ring: { r: ['...mm...', '..mwwm..', '.yyyyyy.', 'y......y', 'y......y', 'y......y', '.y....y.', '..yyyy..'] },
  sl_amulet: { r: ['y......y', '.y....y.', '..y..y..', '...yy...', '..mmmm..', '.mwmmm..', '.mmmmm..', '..mmm...'] },
  sl_lantern: { r: ['...kk...', '..k..k..', '.kkkkkk.', '.kmmmmk.', '.kmwmmk.', '.kmmmmk.', '.kkkkkk.', '........'] },
  sl_shield: { r: ['.mmmmmm.', 'mwwmmmmm', 'mwmmmmmm', 'mmmkkmmm', 'mmmkkmmm', '.mmmmmm.', '..mmmm..', '...mm...'] },
  sl_focus: { r: ['...mm...', '..mwmm..', '.mwmmmm.', '.mmmmmm.', '..mmmm..', '...kk...', '..kkkk..', '........'] },
  sl_belt: { r: ['........', '........', 'mmmmmmmm', 'mmkkkkmm', 'mmkwwkmm', 'mmkkkkmm', '........', '........'] },
  ic_heart: {
    r: ['.rr.rr..', 'rrrrrrr.', 'rrwrrrr.', 'rrrrrrr.', '.rrrrr..', '..rrr...', '...r....', '........'],
    p: { r: '#e5484d', w: '#ffd0d0' }
  },
  ic_shield: {
    r: ['.kkkkkk.', 'kwwbbwwk', 'kwwbbwwk', 'kbbbbbbk', 'kwwbbwwk', '.kwbbwk.', '..kwwk..', '...kk...'],
    p: { k: '#3a3340', w: '#cfd6e0', b: '#8a6a3a' }
  },
  ic_sword: {
    r: ['.......w', '......ww', '.....ww.', '....ww..', 'k.ww....', '.kw.....', 'bkk.....', 'b..k....'],
    p: { w: '#e8e6e0', k: '#3a3340', b: '#b8862e' }
  },
  ic_plus: {
    r: ['...gg...', '...gg...', '...gg...', 'gggggggg', 'gggggggg', '...gg...', '...gg...', '...gg...'],
    p: { g: '#7bd36b' }
  },
  ic_target: {
    r: ['..rrrr..', '.r....r.', 'r..ww..r', 'r.wrrw.r', 'r.wrrw.r', 'r..ww..r', '.r....r.', '..rrrr..'],
    p: { r: '#e5484d', w: '#f3ede0' }
  },
  ic_boot: {
    r: ['..www...', '..www...', '..www...', '..wwww..', '..wwwww.', '.wwwwwww', '.kkkkkkk', '........'],
    p: { w: '#c9a46a', k: '#5a3a26' }
  },
  ic_skull: {
    r: ['..wwww..', '.wwwwww.', 'wwkwwkww', 'wwkwwkww', '.wwwwww.', '..w..w..', '..wwww..', '........'],
    p: { w: '#e8e2d4', k: '#2a1a1a' }
  },
  ic_blood: {
    r: ['...r....', '...r....', '..rrr...', '.rrrrr..', '.rrwrr..', '.rrrrr..', '..rrr...', '........'],
    p: { r: '#c8243a', w: '#ff9aa8' }
  },
  ic_book: {
    r: ['.bbbbbb.', 'bwwwwwbb', 'bwkkwwbb', 'bwwwwwbb', 'bwkkkwbb', 'bwwwwwbb', '.bbbbbbb', '........'],
    p: { b: '#5865d6', w: '#e8e6e0', k: '#3a3340' }
  },
  ic_mana: {
    r: ['...b....', '...b....', '..bbb...', '.bbbbb..', '.bbwbb..', '.bbbbb..', '..bbb...', '........'],
    p: { b: '#3a8cf0', w: '#bfe0ff' }
  },
  ic_prism: {
    r: ['...ww...', '..wrrw..', '..wrrw..', '.wccyyw.', '.wccyyw.', 'wccccyyw', 'wwwwwwww', '........'],
    p: { w: '#f3ede0', r: '#ff8a5a', c: '#8fe0ff', y: '#fff27a' }
  },
  ic_flame: {
    r: ['...r....', '..rr....', '..ryr...', '.ryyr.r.', '.ryyyrr.', 'ryyyyyr.', 'ryyyyyr.', '.rrrrr..'],
    p: { r: '#e5484d', y: '#ffd166' }
  },
  ic_lantern: {
    r: ['...kk...', '..k..k..', '.kkkkkk.', '.kyyyyk.', '.kywyyk.', '.kyyyyk.', '.kkkkkk.', '........'],
    p: { k: '#3a3340', y: '#ffd877', w: '#ffffff' }
  },
  ic_star: {
    r: ['...yy...', '...yy...', 'yyyyyyyy', '.yyyyyy.', '..yyyy..', '.yy..yy.', 'yy....yy', '........'],
    p: { y: '#f2c14e' }
  },
  ic_ice: {
    r: ['...c....', 'c..c..c.', '.c.c.c..', '..ccc...', 'ccc.ccc.', '..ccc...', '.c.c.c..', 'c..c..c.'],
    p: { c: '#9fe7ff' }
  },
  ic_bolt: {
    r: ['....yy..', '...yy...', '..yy....', '.yyyyy..', '...yy...', '..yy....', '.yy.....', 'yy......'],
    p: { y: '#fff27a' }
  },
  ic_leaf: {
    r: ['......gg', '.....ggg', '...gggwg', '..gggwgg', '.ggwggg.', '.gwggg..', '.wggg...', 'w.......'],
    p: { g: '#7bd36b', w: '#2e6b2a' }
  },
  ic_wind: {
    r: ['........', 'wwwww...', '.....w..', 'wwwwww..', '........', '..wwwwww', '.w......', '..www...'],
    p: { w: '#cfe6f0' }
  },
  ic_coin: {
    r: ['..yyyy..', '.yywwyy.', 'yywyyyyo', 'yywyyyyo', 'yyyyyyyo', 'yyyyyyyo', '.yyyyoo.', '..oooo..'],
    p: { y: '#f2c14e', w: '#fff6c8', o: '#b07d1a' }
  },
  ic_twin: {
    r: ['w.....w.', 'ww...ww.', '.ww.ww..', '..www...', '..www...', '.bb.bb..', 'bb...bb.', 'b.....b.'],
    p: { w: '#e8e6e0', b: '#b8862e' }
  },
  ic_potion: {
    r: ['..kk....', '..ww....', '.wrrw...', 'wrrrrw..', 'wrwrrw..', 'wrrrrw..', '.wwww...', '........'],
    p: { r: '#e5484d', w: '#e8e2d4', k: '#8a5a2f' }
  },
  ic_ether: {
    r: ['..kk....', '..ww....', '.wbbw...', 'wbbbbw..', 'wbwbbw..', 'wbbbbw..', '.wwww...', '........'],
    p: { b: '#3a8cf0', w: '#e8e2d4', k: '#8a5a2f' }
  }
};
const PIXC = new Map();
function pixURL(key, tint) {
  const k = key + '|' + (tint || '');
  if (PIXC.has(k)) return PIXC.get(k);
  const d = PIX[key],
    c = document.createElement('canvas');
  c.width = 10;
  c.height = 10;
  const x = c.getContext('2d');
  const pal = Object.assign(
    { k: '#2a2430', w: '#ffffff', b: '#8a5a2f', y: '#f2c14e' },
    d.p || {},
    tint ? { m: tint } : {}
  );
  for (let j = 0; j < 8; j++)
    for (let i = 0; i < 8; i++) {
      const ch = d.r[j][i];
      if (ch === '.') continue;
      x.fillStyle = pal[ch] || '#f0f';
      x.fillRect(i + 1, j + 1, 1, 1);
    }
  const out = document.createElement('canvas');
  out.width = 10;
  out.height = 10;
  const o = out.getContext('2d');
  o.fillStyle = 'rgba(10,8,14,.9)';
  const F = (i, j) => i >= 0 && j >= 0 && i < 8 && j < 8 && d.r[j][i] !== '.';
  for (let j = -1; j <= 8; j++)
    for (let i = -1; i <= 8; i++)
      if (!F(i, j) && (F(i + 1, j) || F(i - 1, j) || F(i, j + 1) || F(i, j - 1))) o.fillRect(i + 1, j + 1, 1, 1);
  o.drawImage(c, 0, 0);
  const u = out.toDataURL();
  PIXC.set(k, u);
  return u;
}
const curIcon = id => pixURL('cur_' + id);
function slotIcon(it, slot) {
  const s = it ? it.slot : slot.replace(/\d/, '');
  let key = 'sl_' + s;
  if (s === 'weapon') {
    const n = it ? baseOf(it).n : '短劍';
    key = n.includes('斧') ? 'sl_axe' : n.includes('弓') ? 'sl_bow' : n.includes('杖') ? 'sl_staff' : 'sl_sword';
  }
  if (s === 'offhand') key = 'sl_' + (it ? baseOf(it).k : 'shield');
  return pixURL(key, it ? shade(RCOL[it.r] === '#e8e2d4' ? '#b8b2a4' : RCOL[it.r], 0) : '#5a5064');
}
const ICIMG = new Map();
function nodeIcon(ic) {
  if (ICIMG.has(ic)) return ICIMG.get(ic);
  const im = new Image();
  im.src = pixURL('ic_' + ic);
  ICIMG.set(ic, im);
  return im;
}
