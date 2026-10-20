/* 漫步勇者 · 像素圖：16x16 角色怪物、8x8 圖示 */
'use strict';
/* ================= pixel sprites (original art) ================= */
const SPR = {
  /* 0.2.5.1 新增怪物：獼猴、穿山甲、水鹿、海龜、飛魚、風獅爺、虎爺、鳳蝶、獨角仙、水母、黑貓、燈籠妖；冥府看門人：牛頭、馬面、黑白無常 */
  monkey: [
    '.....bbbbb......',
    '....bbbbbbb.....',
    '...bbffffbbb....',
    '...bfefeffbb....',
    '...bffffffbb....',
    '....bfffbbb.....',
    '.....bbbbbb...b.',
    '....bbbbbbbb..b.',
    '...bb.bbbbbb.bb.',
    '...b..bbbbbbbb..',
    '......bbbbbb....',
    '.....bb....bb...',
    '.....bb....bb...',
    '....kk....kk....'
  ],
  pangolin: [
    '.......ssss.....',
    '.....sdsdsdss...',
    '....sdsdsdsdsse.',
    '...sdsdsdsdssssn',
    '..sdsdsdsdsdsss.',
    '.sdsdsdsdsdsds..',
    'ssdsdsdsdsdsss..',
    'ss.ss.....ss....',
    'k..kk.....kk....'
  ],
  deer: [
    '..........a.a...',
    '..........aaa...',
    '...........bb...',
    '..........bbeb..',
    '..........bbbbb.',
    '...........bb...',
    '..bbbbbbbbbbb...',
    '.bbwbbwbbwbbb...',
    '.bbbbbbbbbbbb...',
    '..bbbbbbbbbb....',
    '..b.b....b.b....',
    '..b.b....b.b....',
    '..k.k....k.k....'
  ],
  turtle: [
    '.....ssssss.....',
    '...ssdsdsdsss...',
    '..sdsdsdsdsdsgg.',
    '.sssssssssssgeg',
    '..gg......gg.gg.',
    '.gg........gg...'
  ],
  fish: [
    '.....ff.........',
    '....fff.........',
    '..fffbbbbbb.....',
    '.ffbbbbbbbbbb...',
    'ffbbbbbbbbbebb..',
    '.bbwwwwwwwwbbbb.',
    '..bwwwwwwwwbb...',
    '....fff..ff.....'
  ],
  lion: [
    '.....mmmmmm.....',
    '....mmmmmmmm....',
    '...mmsssssmmm...',
    '...msesessmm....',
    '...mssssssmm....',
    '...mmsrrrsmm....',
    '....mmssssmm....',
    '.....ssssss.....',
    '....ssssssss....',
    '...sssssssssss..',
    '...ss.ssss.ss...',
    '...ss.ssss.ss...',
    '..kkkkkkkkkkkk..'
  ],
  tiger: [
    '..........o.o...',
    '.........ooooo..',
    '.........oeoeoo.',
    '.........owwwo..',
    '..ooooooooooo...',
    '.ododdoddoddo...',
    'oooooooooooooo..',
    '.owwwwwwwwwoo...',
    '..oo.oo..oo.oo..',
    '..oo.oo..oo.oo..',
    '..kk.kk..kk.kk..'
  ],
  butterfly: [
    '.ddd........ddd.',
    'dwwwd..b...dwwwd',
    'dwywwd.b..dwwywd',
    'dwwwwwdbbdwwwwwd',
    '.dwwwwdbbdwwwwd.',
    '..ddddbbbbdddd..',
    '...dwwdbbdwwd...',
    '...dwwd.bdwwd...',
    '....dd..b.dd....'
  ],
  beetle: [
    '..h.............',
    '..hh............',
    '...hhb..........',
    '....hbbbbbb.....',
    '...bbebbsbbbb...',
    '..bbbbbbbsbbbb..',
    '..bbbbbbbbbbbb..',
    '..bbbbbbbbbbbb..',
    '...bbbbbbbbbb...',
    '..k.k.k..k.k.k..'
  ],
  jelly: [
    '.....jjjjjj.....',
    '...jjjwwjjjjj...',
    '..jjjwjjjjjjjj..',
    '..jjjjjjjjjjjj..',
    '..jjejjjjjejjj..',
    '...jjjjjjjjjj...',
    '...t.t.tt.t.t...',
    '..t.t.t..t.t.t..',
    '...t.t.tt.t.t...',
    '..t..t....t..t..'
  ],
  cat: [
    '...c...c........',
    '...cc.cc........',
    '...ccccc........',
    '..cecccec.......',
    '..ccccccc.......',
    '...ccccc........',
    '...cccccccccc...',
    '..ccccccccccc..c',
    '..cccccccccccccc',
    '...cc.cc..cc.cc.',
    '...kk.kk..kk.kk.'
  ],
  lantern: [
    '......kkk.......',
    '.....kkkkk......',
    '....llllllll....',
    '...lllllllllll..',
    '...llyllllylll..',
    '...lllelllelll..',
    '...lllllllllll..',
    '...lllmmmmmlll..',
    '...llllmmmllll..',
    '....llllllll....',
    '.....kkkkkk.....',
    '......y..y......'
  ],
  oxhead: [
    '.w..........w...',
    '.ww........ww...',
    '..ww.bbbbb.ww...',
    '...wbbbbbbbbw...',
    '....brbbbrbb....',
    '....bbbbbbbb....',
    '....bbnnnnbb....',
    '.....bnnnnb.....',
    '...aaaaaaaaaa...',
    '..aaaaaaaaaaaa..',
    '..bbaaaaaaaabb..',
    '..bb.aaaaaa.bb..',
    '.....aa..aa.....',
    '.....aa..aa.....',
    '....kkk..kkk....'
  ],
  horseface: [
    '.....mmm........',
    '....mmggg.......',
    '...mmggggg......',
    '...mgrgggg......',
    '...mggggggg.....',
    '....gggggggg....',
    '.....ggggnngg...',
    '......gggnn.....',
    '...aaaaaaaaaa...',
    '..aaaaaaaaaaaa..',
    '..ggaaaaaaaagg..',
    '..gg.aaaaaa.gg..',
    '.....aa..aa.....',
    '.....aa..aa.....',
    '....kkk..kkk....'
  ],
  wuchang: [
    '.....hhhhh......',
    '.....htthh......',
    '.....hhhhh......',
    '.....hthhh......',
    '....hhhhhhh.....',
    '....ffffff......',
    '....fefeff......',
    '....ffffff......',
    '.....frrf.......',
    '...cccccrcc.....',
    '..ccccccrccc....',
    '..cfccccccfc....',
    '..c.cccccc.c....',
    '....cccccc......',
    '....cc..cc......',
    '...kkk..kkk.....'
  ],
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
  bolt: ['....yy..', '...yy...', '..yy....', '.yyyyy..', '...yy...', '..yy....', '.yy.....', 'yy......'],
  gift: ['.r..r...', '..rr....', 'yyyyyyy.', 'yyyryyy.', 'bbbrbbb.', 'bbbrbbb.', 'bbbrbbb.', 'bbbbbbb.'],
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
/* ---------- PNG 像素圖（art/monsters → js/art.js，圖名 a_檔名）：比 16×16 精細，畫的時候每個像素是 s × ART_U（首領也用 64 格） ---------- */
const ART_U = 0.36,
  ARTIMG = {};
function artImg(k) {
  if (!ARTIMG[k] && typeof ART !== 'undefined' && ART[k]) {
    const im = new Image();
    im.src = ART[k];
    ARTIMG[k] = im;
  }
  return ARTIMG[k];
}
/* 回傳正方形畫布（圖貼底置中、留 1 格邊），c.art 標記給 drawSpr 換算大小；還沒載好時回傳空白（不快取） */
function artSprite(name, white) {
  const key = name + (white ? '|w' : '');
  let c = SPC.get(key);
  if (c) return c;
  const im = artImg(name.slice(2));
  c = document.createElement('canvas');
  if (!im || !im.complete || !im.naturalWidth) {
    c.width = c.height = 18;
    c.pending = true;
    return c;
  }
  const N = Math.max(im.naturalWidth, im.naturalHeight) + 2;
  c.width = c.height = N;
  c.art = true;
  const x = c.getContext('2d');
  x.drawImage(im, fl((N - im.naturalWidth) / 2), N - 1 - im.naturalHeight);
  if (white) {
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = '#fff';
    x.fillRect(0, 0, N, N);
  }
  SPC.set(key, c);
  return c;
}
function sprite(name, pal, white) {
  if (name.startsWith('a_')) return artSprite(name, white);
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
/* 把圖畫進列表用的小畫布：PNG 圖（a_ 開頭）比 18×18 大，畫布跟著圖的大小，CSS 顯示大小不變 */
function paintIcon18(cv, sp) {
  if (cv.width !== sp.width) cv.width = cv.height = sp.width;
  const x = cv.getContext('2d');
  x.clearRect(0, 0, cv.width, cv.height);
  x.drawImage(sp, 0, 0);
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
  if (sp.art) {
    /* PNG 圖：腳底對齊 y */
    const u = s * ART_U,
      z = sp.width * u;
    if (flip) {
      c.translate(x, 0);
      c.scale(-1, 1);
      c.drawImage(sp, -z / 2, y - z + u, z, z);
    } else c.drawImage(sp, x - z / 2, y - z + u, z, z);
  } else if (flip) {
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
  /* 0.3.29：圖示名稱打錯或還沒定義時改畫星星，不要讓整個面板當掉 */
  const x = c.getContext('2d'),
    r = ICONS[n] || ICONS.star;
  x.clearRect(0, 0, 8, 8);
  for (let j = 0; j < 8; j++)
    for (let i = 0; i < 8; i++) {
      const ch = r[j][i];
      if (ch === '.') continue;
      x.fillStyle = ICOPAL[ch];
      x.fillRect(i, j, 1, 1);
    }
}
/* 武器外觀種類；角色外觀與配色（heroPal、heroSpr）在 gear.js */
const wepKind = (w = S.eq.weapon) => (w ? BASES.weapon[w.bi].k : 'sword');
/* 武器類別（天賦專精、技能標籤、昇華用）：劍、斧鎚、矛、弓弩、匕首爪、法杖；副手是盾牌、法珠、符咒或提燈 */
const wepType = (w = S.eq.weapon) => (w ? BASES.weapon[w.bi].t : 'sword');
const twoHand = (w = S.eq.weapon) => !!(w && BASES.weapon[w.bi].th);
const WTAGN = { sword: '劍', axe: '斧鎚', spear: '矛', bow: '弓弩', dagger: '匕首爪', staff: '法杖' };
const offType = () => (S.eq.offhand && !twoHand() ? BASES.offhand[S.eq.offhand.bi].k : '');
/* ================= icons: currency, item slots, passive nodes ================= */
const PIX = {
  cur_vaal: {
    r: ['...rr...', '...rr...', '..rrrr..', '.rrwrrr.', '.rwrrrr.', '.rrrrdr.', '..rrdd..', '...dd...'],
    p: { r: '#e5304a', w: '#ffb0bc', d: '#7a1020' }
  },
  cur_soul: {
    r: ['...pp...', '..plwp..', '.plwwlp.', '.pllllp.', '..pllp..', '...pp...', '..p..p..', '.p....p.'],
    p: { p: '#7f6bd6', l: '#b7a6ff', w: '#efeaff' }
  },
  cur_wish: {
    r: ['...ww...', '...yy...', 'wyyyyyyw', '.yyowyy.', '..yyyy..', '.yyoyyy.', '.yy..yy.', 'y......y'],
    p: { y: '#ffd66a', w: '#fff8d8', o: '#c8902a' }
  },
  cur_eng: {
    r: ['..kkkk..', '.kbbbbk.', 'kbbwbbbk', 'kbwwwbbk', 'kbbwbbbk', 'kbbwbbbk', '.kbbbbk.', '..kkkk..'],
    p: { b: '#5fa8d0', w: '#e8f6ff', k: '#2a4a60' }
  },
  cur_engC: {
    r: ['..kkkk..', '.kbbbbk.', 'kbwbbwbk', 'kbbwwbbk', 'kbbwwbbk', 'kbwbbwbk', '.kbbbbk.', '..kkkk..'],
    p: { b: '#e58a3a', w: '#fff0d8', k: '#6a3a14' }
  },
  cur_engX: {
    r: ['..kkkk..', '.kbbbbk.', 'kbbwwbbk', 'kbwwwwbk', 'kbbwwbbk', 'kbwbbwbk', '.kbbbbk.', '..kkkk..'],
    p: { b: '#e8c860', w: '#ffffff', k: '#806020' }
  },
  cur_prism: {
    r: ['...w....', '..wll...', '.wllpp..', 'wllpppp.', '.llpppp.', '..pppp..', '...pp...', '........'],
    p: { l: '#ffd0f0', p: '#ff8fd8', w: '#ffffff' }
  },
  cur_engD: {
    r: ['..kkkk..', '.kbbbbk.', 'kbbwwbbk', 'kwwwwwwk', 'kbbwwbbk', 'kbbwwbbk', '.kbbbbk.', '..kkkk..'],
    p: { b: '#ffe27a', w: '#ffffff', k: '#a07818' }
  },
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
  cur_whet: {
    r: ['......ww', '.....wlw', '....wlw.', '...wlw..', '..wlw...', '.wlw....', 'bbw.....', 'bb......'],
    p: { w: '#9aa2ae', l: '#eef3fa', b: '#6a5a4a' }
  },
  cur_scrap: {
    r: ['.mmmmmm.', 'mhhmmmmm', 'mhmmmmmd', 'mmmmmmdd', '.mmmmdd.', '..mmdd..', '...dd...', '........'],
    p: { m: '#b8a07a', h: '#f0e0b8', d: '#7a6448' }
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
  ic_axe: {
    r: ['..kkk...', '.kwwwk..', 'kwwwwbk.', '.kwwbk..', '..kbk...', '...b....', '....b...', '.....b..'],
    p: { w: '#d8dde6', b: '#8a5a2f' }
  },
  ic_bow: {
    r: ['..bbw...', '.b...w..', 'b....w..', 'b..kkkkk', 'b....w..', '.b...w..', '..bbw...', '........'],
    p: { b: '#b8862e', w: '#e8e2d4', k: '#d8dde6' }
  },
  ic_staff: {
    r: ['.....cc.', '....cwc.', '....cc..', '...b....', '..b.....', '.b......', 'b.......', '........'],
    p: { c: '#7fe0ff', w: '#ffffff', b: '#8a5a2f' }
  },
  ic_orb: {
    r: ['..pppp..', '.pwlppp.', 'pwllpppp', 'plllpppp', 'pppppppp', '.pppppp.', '..pppp..', '.bbbbbb.'],
    p: { p: '#7a5ad6', l: '#b9a6ff', w: '#ffffff', b: '#8a5a2f' }
  },
  ic_taunt: {
    r: ['......r.', '..rr.r..', '.rrrr...', 'rrrrr.rr', '.rrrr...', '..rr.r..', '......r.', '........'],
    p: { r: '#ff7a5a' }
  },
  ic_gem: {
    r: ['..cccc..', '.cwcccc.', 'cwcccccd', 'ccccccdd', '.ccccdd.', '..ccdd..', '...dd...', '........'],
    p: { c: '#7fd6ff', w: '#ffffff', d: '#3a8ab0' }
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
  if (it && typeof gearIcon === 'function') {
    const u = gearIcon(it);
    if (u) return u;
  }
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

/* ================= boss sprites ================= */
/* 首領專屬圖（0.2.13）：七宗罪的 7 個王、七宗罪之王、亡靈王、各種地城首領；配色在 BOSSPAL */
Object.assign(SPR, {
  b_lucifer: [
    '.....y.yy.y.....',
    '....y......y....',
    'w....bbbbbb....d',
    'ww..bbebbebb..dd',
    'www..bbbbbb..ddd',
    'wwww..bmmb..dddd',
    '.wwww.cggc.dddd.',
    '..wwwccccccddd..',
    '...wccccccccd...',
    '.w..cccggccc..d.',
    'ww..cccccccc..dd',
    'www.cccccccc.ddd',
    '.ww..cccccc..dd.',
    '.....cc..cc.....',
    '....gg....gg....'
  ],
  b_leviathan: [
    '.f.f........f.f.',
    '.fffssssssssfff.',
    '..fssssssssssf..',
    '..sseessssseess.',
    '..ssssssssssss..',
    '.sswmwmwmwmwmss.',
    '.ssmmmmmmmmmmss.',
    '..swmwmwmwmwms..',
    '...ssllllllss...',
    '....sllllllss...',
    '.f...sllllss..f.',
    'ffs...ssssss.sff',
    '.ssss..ssss.sss.',
    'aassssssssssssaa',
    'aaaaaaaaaaaaaaaa'
  ],
  b_satan: [
    '.f..f......f..f.',
    '.ff.ff....ff.ff.',
    '..hh.hffffh.hh..',
    '...hhbbbbbbhh...',
    '....bbbbbbbb....',
    '....beebbeeb....',
    '....bbbbbbbb....',
    '.....bwmmwb.....',
    '.x..cccccccc....',
    'xxxcccrccrccc...',
    '.x.ccccrrcccccc.',
    '.x.cc.cccccc.bb.',
    '.x...cccccccc...',
    '.x...cc....cc...',
    '....hhh....hhh..'
  ],
  b_belphegor: [
    '...h........h...',
    '...hh......hh...',
    '....hbbbbbbh....',
    '....bbbbbbbb....',
    '...bbddbbddbb...',
    '...bbeebbeebb...',
    '...bbbbbbbbbb...',
    '....bbmmmmbb....',
    '..bbbbbbbbbbbb..',
    '.bbbbbbllbbbbbbb',
    'tbbbbbllllbbbbbt',
    'tbbbbbllllbbbbbt',
    'ttbbbbbbbbbbbbtt',
    'tttttttttttttttt',
    'tt..tt....tt..tt'
  ],
  b_mammon: [
    '...y.y.y.y.y....',
    '...yyyyyyyyy....',
    '....bbbbbbb.....',
    '...bbebbbebb....',
    '...bbbbbbbbb....',
    '...bygygygyb....',
    '....bbbbbbb.....',
    '..ccccccccccc...',
    '.ccccyccyccccc..',
    'cc.ccccccccc.yy.',
    'b..cccyycccc.yyy',
    '...ccccccccc.yyy',
    '...ccc...ccc.yy.',
    '..yy.y.y.y.yy...',
    '.yyyyyyyyyyyyyy.'
  ],
  b_beelzebub: [
    '....y.y.y.y.....',
    '....yyyyyyy.....',
    'ww..bbbbbbb..ww.',
    'www.eeebeee.www.',
    'wwwweeebeeewwww.',
    '.wwwbeebbeebwww.',
    '..wwbbbmbbbww...',
    '...k.bmmmb.k....',
    '..k.bbbbbbb.k...',
    '....brbrbrb.....',
    '...bbbbbbbbb....',
    '..k.brbrbrb.k...',
    '.k...bbbbb...k..',
    '......bbb.......',
    '.......b........'
  ],
  b_asmodeus: [
    '...h........h...',
    '..hh.pppppp.hh..',
    '..h.pppppppp.h..',
    '...ppsssssspp...',
    'ww.pssessessp.ww',
    'www.ssssssss.www',
    'wwww.ssmmss.wwww',
    '.wwwwcccccccwww.',
    '..www.ccrcc.www.',
    '......cccccc..t.',
    '.....cccccccc.t.',
    '.....cccrcccc.t.',
    '....cccccccccct.',
    '.....ss....ss.r.',
    '....ss......ssrr'
  ],
  b_sinking: [
    'r.y.g.y.p.y.o.b.',
    'yyyyyyyyyyyyyyy.',
    'hh..nnnnnnn..hh.',
    '.hhnnennnennhh..',
    'w..nnnnnnnnn..w.',
    'ww..nwmmmwn..ww.',
    'www.ccccccc.www.',
    'wwwcccyccyccwww.',
    '.wcccccyycccccw.',
    '.ccccccccccccc..',
    'cc.cccrcrccc.cc.',
    'c..ccccccccc..c.',
    '...ccccccccc....',
    '..cccc...cccc...',
    '.yyyy.....yyyy..'
  ],
  b_lichking: [
    '....g.g.g.g.....',
    '....ggggggg...o.',
    '....wwwwwww..ooo',
    '...wwkwwwkww..o.',
    '...wwowwwoww..y.',
    '....wwwwwww...y.',
    '.....wkwkw....y.',
    '..cccccccccc..y.',
    '.ccccrccrcccc.y.',
    'cc.cccccccccw.y.',
    'c..cccccccccwwy.',
    'c..ccccccccc..y.',
    '...ccccccccc..y.',
    '..ccccccccccc.y.',
    '.ccccccccccccc..'
  ],
  b_golem: [
    '..q..........q..',
    '.qqq........qqq.',
    '.qsss......sssq.',
    '..ssssssssssss..',
    '...sssssssssss..',
    '...sseessseess..',
    '...sssssssssss..',
    '.ssssddddddsssss',
    'sssssdsssssdssss',
    'ssssdsssssdsssss',
    'ss.sssssssssss.s',
    'ss.ssssdsssss..s',
    '...sssssssssss..',
    '...ssss...ssss..',
    '..ddddd...ddddd.'
  ],
  b_abyss: [
    '.t....t...t...t.',
    '..t..t.....t.t..',
    '...tt.bbbbb.tt..',
    '....bbbbbbbbb...',
    '...bbbwwwwwbbb..',
    '..bbbwwweewwbbb.',
    '..bbbwweeeewbbb.',
    '..bbbwwweewwbbb.',
    '...bbbwwwwwbbb..',
    '...bbbbbbbbbbb..',
    '....bmwmwmwmb...',
    '.....bbbbbbb....',
    '..tt..t.t.t..tt.',
    '.t...t..t..t...t',
    't...t...t...t...'
  ],
  b_hellord: [
    'f..f........f..f',
    'ff.ff......ff.ff',
    '.fhhh.....hhhf..',
    '...hhhbbbbhh....',
    '....bbbbbbbb....',
    '....beebbeeb....',
    '....bbmmmmbb....',
    '..aaaabbbbaaaa..',
    '.aaaaaaaaaaaaaa.',
    'aa.aarrrrrraa.aa',
    'aa.aaarrrraaa.ff',
    'bb.aaaaaaaaaa.ff',
    '...aaaaaaaaaa...',
    '...aaa....aaa...',
    '..fff......fff..'
  ],
  b_arcane: [
    '......pppp......',
    '.....pwppwp.....',
    '....pppppppp....',
    '....bbbbbbbb....',
    '....beebbeeb....',
    '.....bbbbbb.....',
    '..r..cccccc..r..',
    '.r..cccccccc..r.',
    'r..cccrccrccc..r',
    'r.ww.cccccc.ww.r',
    'r..wcccccccw...r',
    '.r..cccccccc..r.',
    '..r.cccccccc.r..',
    '...rrcccccrrr...',
    '.....rrrrrr.....'
  ],
  b_hades: [
    '.u.u..u..u..u.u.',
    '..uu.uuuuu.uu...',
    '....kwwwwwk.....',
    '....wkkwkkw.....',
    '....wouwwuo.....',
    '....wwwkwww.....',
    '.....wkkkw......',
    '..cccccccccc....',
    '.ccccuccucccc...',
    'cc.cccccccccc.x.',
    'w..cccccccccc.x.',
    '...ccccuucccc.x.',
    '...cccccccccc.x.',
    '..cccccccccccc..',
    '.cccccccccccccc.'
  ],
  b_stelekeeper: [
    '....ssssssss....',
    '...ssddssddss...',
    '...sseessseess..',
    '...ssssssssss...',
    '.....ssddss.....',
    '.tttt.ssss......',
    'tqqqqtsssssss...',
    'tqrrqtsssssssss.',
    'tqqqqtsdsssssss.',
    'tqrrqtssssssss..',
    'tqqqqtssssss.ss.',
    '.tttt.ssssss....',
    '......sss.sss...',
    '.....ssss.ssss..',
    '....dddd..dddd..'
  ],
  b_lion: [
    '..mmmmmmmmmmm...',
    '.mmmmssssssmmm..',
    'mmmssssssssssmm.',
    'mmsseessssseesm.',
    'mmssssssssssssm.',
    'mmsssnnssnnsssm.',
    '.mmsswwwwwwssmm.',
    '.mmsswrrrrwssm..',
    '..mmsswwwwssmm..',
    '...mmssssssmm...',
    '..ssssssssssss..',
    '.sssgsssssgssss.',
    '.ssssssssssssss.',
    '.ss.ss....ss.ss.',
    'ppppppppppppppp.'
  ]
});
const BOSSPAL = {
  b_lucifer: {
    y: '#ffd166',
    w: '#eceaf4',
    d: '#2a2238',
    b: '#e8dcc8',
    e: '#3a6aff',
    m: '#8a4a4a',
    c: '#d8d0e8',
    g: '#d8a838'
  },
  b_leviathan: { f: '#3ad0a0', s: '#1e6a6a', e: '#d4ff3a', w: '#f0f0e0', m: '#3a0a14', l: '#8ae0c0', a: '#2a4a8a' },
  b_satan: {
    f: '#ff7a2a',
    h: '#2a1a1a',
    b: '#b0201a',
    e: '#ffe24a',
    w: '#f2e8dc',
    m: '#3a0a0a',
    c: '#6a1010',
    r: '#ff4a2a',
    x: '#9aa0a8'
  },
  b_belphegor: { h: '#c8b890', b: '#6a7a3a', d: '#3a4a1a', e: '#ff3a5a', m: '#2a1a0a', l: '#9aaa5a', t: '#5a3a6a' },
  b_mammon: { y: '#ffd166', b: '#7a5a2a', e: '#ff3a5a', g: '#3a2a0a', c: '#4a2a5a' },
  b_beelzebub: { y: '#ffd166', w: '#a0c8d0', b: '#2a3a1a', e: '#ff2a2a', m: '#7a1a1a', r: '#c8b030' },
  b_asmodeus: {
    h: '#2a1a2a',
    p: '#e04aa0',
    s: '#f0b8c8',
    e: '#ff3a8a',
    m: '#c0203a',
    w: '#5a1a4a',
    c: '#8a1a5a',
    r: '#ff4a8a',
    t: '#5a1a4a'
  },
  b_sinking: {
    r: '#ff3a5a',
    y: '#ffd166',
    g: '#4ae08a',
    p: '#c86aff',
    o: '#ff9a3a',
    b: '#5aa0ff',
    h: '#2a0a1a',
    n: '#7a2a4a',
    e: '#ff2a4a',
    w: '#3a0a2a',
    m: '#1a0a10',
    c: '#5a1a3a'
  },
  b_lichking: { g: '#9aa0a8', w: '#d8d8c8', o: '#7fff7a', y: '#5a4a3a', c: '#1a2a2a', r: '#4aff8a' },
  b_golem: { q: '#7fd6ff', s: '#7a7068', e: '#ffb03a', d: '#4a4440' },
  b_abyss: { t: '#5a3a8a', b: '#3a2a5a', w: '#f2e8dc', e: '#ff2a4a', m: '#1a0a14' },
  b_hellord: { f: '#ff7a2a', h: '#1a0a0a', b: '#7a1010', e: '#ffe24a', m: '#ff3a1a', a: '#3a3038', r: '#ff4a2a' },
  b_arcane: { p: '#5a2a8a', w: '#c8a0ff', b: '#3a2a4a', e: '#c8f0ff', c: '#4a2a7a', r: '#b06bff' },
  b_hades: { u: '#5ab8ff', w: '#d8d8c8', o: '#5ab8ff', c: '#141a2a', x: '#8a8aa0' },
  b_stelekeeper: { s: '#8a8fa0', d: '#4a4e5a', e: '#7fd6ff', t: '#5a5a6a', q: '#b8bcc8', r: '#7fd6ff' },
  b_lion: {
    m: '#2a7a5a',
    s: '#c8b890',
    e: '#ff3a2a',
    n: '#6a5a3a',
    w: '#f2e8dc',
    r: '#c0203a',
    g: '#ffd166',
    p: '#8a7a6a'
  }
};
