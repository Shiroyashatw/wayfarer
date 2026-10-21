/* 漫步勇者 · 墮落十二生肖與墮落獸（0.1.0 肉鴿：狩獵、血祭、印記拿掉，只留首領與菁英的資料） */
'use strict';
/* ================= data ================= */
/* 十二生肖專屬像素圖：b 身體、d 暗部、h 角、e 發紅的眼、r 血紋、p 紫色腐化、w 獠牙骨刺、m 血口、f 火焰、g 金、l 臉 */
const pad16z = rows => rows.map(r => (r + '................').slice(0, 16));
Object.assign(SPR, {
  z_rat: pad16z([
    '..pp........pp..',
    '.pbbp......pbbp.',
    '.pbbbp....pbbbp.',
    '..pbbbbbbbbbbp..',
    '...bbbbbbbbbb...',
    '..bbebbbbbbebb..',
    '..bbbbbddbbbbb..',
    '...bbbwmmwbbb...',
    '....bbwmmwbb....',
    '...rbbbbbbbbr...',
    '..rbbbrbbrbbbr..',
    '..bbbbbrrbbbbb.w',
    '..bbbbbbbbbbbbww',
    '...dd......ddww.',
    '..ww........ww..'
  ]),
  z_ox: pad16z([
    'hh............hh',
    '.hh..........hh.',
    '..hh........hh..',
    '...hhbbbbbbhh...',
    '....bbbbbbbb....',
    '...bbebbbbebb...',
    '...bbbbbbbbbb...',
    '....bbrrrrbb....',
    '....bmmggmmb....',
    '..bbbbbggbbbbb..',
    '.bbbrbbbbbbrbbb.',
    '.bbbbrrbbrrbbbb.',
    '.bbbbbbbbbbbbbb.',
    '..dd.dd..dd.dd..',
    '..kk.kk..kk.kk..'
  ]),
  z_tiger: pad16z([
    '.hb..........bh.',
    '.bbb........bbb.',
    '.bbbbbbbbbbbbbb.',
    '.bdbbdbbbbdbbdb.',
    '.bbeebbbbbbeebb.',
    '.bbbbbbddbbbbbb.',
    '..bdbbbmmbbbdb..',
    '..bbbwmmmmwbbb..',
    '...bbwbmmbwbb...',
    '...dbwbbbbwbd...',
    '..bbbbbbbbbbbb..',
    '.bdbbdbbbbdbbdb.',
    '.bbbbbbbbbbbbbb.',
    '.bb.bb....bb.bb.',
    '.ww.ww....ww.ww.'
  ]),
  z_rabbit: pad16z([
    '...pp....pp.....',
    '...pbp...pbp....',
    '...pbp...pbp....',
    '....bp...pb.....',
    '....bb...bb.....',
    '...bbbbbbbbb....',
    '..bbebbbbbebb...',
    '..bbbbbbbbbbb...',
    '..bwmwmwmwmwb...',
    '...bbbbbbbbb....',
    '..rbbbbbbbbbr...',
    '.ww.bbbbbbb.ww..',
    '....bbrrrbb.....',
    '....bb...bb.....',
    '...ddd...ddd....'
  ]),
  z_dragon: pad16z([
    '.hh.hh..........',
    '..hhh...........',
    '.bbbbbb.........',
    'bbebbbbr........',
    'wbbbbbbrr.......',
    'mwmbbbbbrr......',
    'wm..gbbbbr......',
    '......gbbbr.....',
    '.......bbbbrrr..',
    '..rrr..gbbbbbrr.',
    '.rbbbrr.gbbbbbr.',
    'rbbbbbbbbbbbbb..',
    'gbbgggbbbbgbb...',
    '.w.w..gggg..w.w.'
  ]),
  z_snake: pad16z([
    '....bbbbbbbb....',
    '...bbpbbbbpbb...',
    '..bbpebbbbepbb..',
    '..bbbbbbbbbbbb..',
    '..bpbbmmmmbbpb..',
    '...bbbwmmwbbb...',
    '....bbbwwbbb....',
    '....rbbbbbbr....',
    '.....rbbbbr.....',
    '......bbbb......',
    '.......bbb......',
    '...bbbbbbbb.....',
    '..bbrbbrbbrbb...',
    '.bbbbbbbbbbbbbb.',
    '..dddddddddddd..'
  ]),
  z_horse: pad16z([
    '.....f.f.f......',
    '....frfrfrf.....',
    '..hbbfrfrff.....',
    '.bebbbbfrf......',
    'bbbbbbbbfrf.....',
    'wmbbdbbbbff.....',
    'mm...bbbbbbbbbf.',
    '.....bbbbbbbbbff',
    '.....bbrbbbrbbff',
    '.....dbbbbbbbbf.',
    '.....bb.....bb..',
    '.....bb.....bb..',
    '....ff......ff..',
    '....ff.....ff...'
  ]),
  z_goat: pad16z([
    'hh............hh',
    'h.h..........h.h',
    'h..hh.pppp.hh..h',
    '.h..hbbbbbbh..h.',
    '..hhbbbbbbbbhh..',
    '....beebbeeb....',
    '....bbbbbbbb....',
    '.....bbbbbb.....',
    '.....bbwwbb.....',
    '......bmmb......',
    '......wwww......',
    '.....rwwwwr.....',
    '....r..ww..r....',
    '.....r....r.....',
    '......rrrr......'
  ]),
  z_monkey: pad16z([
    '.....bbbbbb.....',
    '....bbhbbhbb....',
    '..lbbllllllbbl..',
    '..lblellllelbl..',
    '...bllllllllb...',
    '....blwmmwlb....',
    '.....bbbbbb.....',
    '...bbbbbbbbbb...',
    '..bb.bbrrbb.bb..',
    '.bb..bbbbbb..bb.',
    '.ww..bbbbbb..ww.',
    '.....bb..bb...b.',
    '....bbb..bbb.b..',
    '.............bb.'
  ]),
  z_rooster: pad16z([
    '....ff..........',
    '...frff.........',
    '...rrrr.........',
    '..bbbbbb........',
    '.bebbbbb........',
    'gggbbbbb.....ff.',
    '.gg.rbbbb...frf.',
    '.....rbbbbbbrff.',
    '.....bbbbbbbbrf.',
    '....bbbbbbbbbb..',
    '....bbrbbrbbbb..',
    '.....bbbbbbbb...',
    '.......g..g.....',
    '......wg..gw....',
    '......gg.gg.....'
  ]),
  z_dog: pad16z([
    '..h.............',
    '.hbh............',
    '.bbbb...........',
    'bebbbb.........f',
    'bbbbbbbb......ff',
    'wmwbbbbbbbbbbbf.',
    'mw.wwwwbbbbbbb..',
    '....bbbbbbbbbbb.',
    '....bbrbbbrbbbb.',
    '....bbbbbbbbbbb.',
    '....bb.dbbbd.bb.',
    '....bb......bb..',
    '...ff......ff...'
  ]),
  z_pig: pad16z([
    '...w.w....w.w...',
    '..hwwbbbbbbwwh..',
    '..hbbbbbbbbbbh..',
    '..bbebbbbbbebb..',
    '..bbbbbbbbbbbb..',
    '..bbbllllllbbb..',
    '.wbbllkllkllbbw.',
    '.wwbbllllllbbww.',
    '..wbbbmmmmbbbw..',
    '.bbbbbbbbbbbbbb.',
    'bbbrbbbbbbbbrbbb',
    'bbbbrrbbbbrrbbbb',
    'bbbbbbbbbbbbbbbb',
    '.dd.dd....dd.dd.',
    '.kk.kk....kk.kk.'
  ])
});
/* 共用的墮落配色，各生肖再換身體色 */
const ZBASE = {
  d: '#14080e',
  h: '#cfc2a8',
  e: '#ff2a4a',
  r: '#d0203a',
  p: '#8a3ad0',
  w: '#efe6d8',
  m: '#4a0610',
  f: '#ff7a2a',
  g: '#d8a838',
  l: '#8a5a6a'
};
const ZODIAC = [
  {
    k: 'rat',
    t: '瘟噬鼠皇',
    n: '子鼠',
    el: 'phys',
    d: '瘟疫與鼠群的主宰',
    pal: { b: '#4a3a4a' }
  },
  {
    k: 'ox',
    t: '獄鎖魔牛',
    n: '丑牛',
    el: 'phys',
    d: '鎖鏈纏身的地獄蠻牛',
    pal: { b: '#4a1a1a', h: '#2a2228' }
  },
  { k: 'tiger', t: '血牙虎煞', n: '寅虎', el: 'phys', d: '嗜血的劍齒虎煞', pal: { b: '#a04a1a' } },
  {
    k: 'rabbit',
    t: '月蝕狂兔',
    n: '卯兔',
    el: 'cold',
    d: '月蝕之夜發狂的魔兔',
    pal: { b: '#c8b8d0', p: '#6a2a8a' }
  },
  {
    k: 'dragon',
    t: '天墜邪龍',
    n: '辰龍',
    el: 'fire',
    d: '十二生肖之首，最難纏',
    pal: { b: '#4a2468', r: '#ff4a3a' }
  },
  { k: 'snake', t: '毒涎蛇姬', n: '巳蛇', el: 'cold', d: '吐著毒涎的蛇姬', pal: { b: '#1e3a2a' } },
  {
    k: 'horse',
    t: '焚魂夢魘',
    n: '午馬',
    el: 'fire',
    d: '燃燒靈魂的夢魘之馬',
    pal: { b: '#1e1824', h: '#3a2a2a' }
  },
  {
    k: 'goat',
    t: '魔羊祭司',
    n: '未羊',
    el: 'light',
    d: '主持黑彌撒的魔羊',
    pal: { b: '#3a2a2a', e: '#ffd23a' }
  },
  {
    k: 'monkey',
    t: '雷魘猴王',
    n: '申猴',
    el: 'light',
    d: '操弄雷電的魔猴',
    pal: { b: '#4a2a1a' }
  },
  {
    k: 'rooster',
    t: '業火冥雞',
    n: '酉雞',
    el: 'fire',
    d: '浴火的冥界凶禽',
    pal: { b: '#2a1a1a' }
  },
  {
    k: 'dog',
    t: '冥府獄犬',
    n: '戌狗',
    el: 'phys',
    d: '看守冥府的三頭犬',
    pal: { b: '#342834', w: '#c0b0a0' }
  },
  {
    k: 'pig',
    t: '屠野魔豬',
    n: '亥豬',
    el: 'phys',
    d: '踐踏一切的魔豬',
    pal: { b: '#5a2a2a', l: '#a06070' }
  }
].map(z => ({ ...z, spr: 'a_z_' + z.k }));
const ZODI = Object.fromEntries(ZODIAC.map(z => [z.k, z]));
/* 墮落配色：整體偏暗紅紫、眼睛發紅 */
function corruptPal(p) {
  const out = {},
    to = [42, 6, 20];
  for (const k in p) {
    const v = p[k];
    if (typeof v !== 'string' || v[0] !== '#' || v.length !== 7) {
      out[k] = v;
      continue;
    }
    const c = [1, 3, 5].map((i, n) => Math.round(parseInt(v.slice(i, i + 2), 16) * 0.55 + to[n] * 0.45 + (n ? 0 : 30)));
    out[k] = '#' + c.map(x => Math.min(255, x).toString(16).padStart(2, '0')).join('');
  }
  out.e = '#ff2a4a';
  return out;
}
const zodPal = z => ({ ...ZBASE, ...z.pal });
(() => {
  PIX.cur_dcrys = {
    r: ['...rr...', '..rwrr..', '.rwrrrr.', 'rrrrrrdr', '.rrrrdd.', '..rrdd..', '...dd...', '........'],
    p: { r: '#ff3a5a', w: '#ffd0d8', d: '#7a0a20' }
  };
  PIX.cur_zmark = {
    r: ['..rrrr..', '.rkrrkr.', 'rrkrrkrr', 'rrrkkrrr', 'rrrkkrrr', 'rrkrrkrr', '.rkrrkr.', '..rrrr..'],
    p: { r: '#c0203a', k: '#ffd166' }
  };
  PIX.cur_blood = {
    r: ['...r....', '...r....', '..rrr...', '.rrwrr..', '.rrrrr..', '.rrrrd..', '..rdd...', '........'],
    p: { r: '#e5484d', w: '#ffc0c0', d: '#7a1a1a' }
  };
})();
/* ================= enemies ================= */
/* 0.3.50 墮落獸的 PNG（art/monsters/hunt_*.png）：野怪名 → 圖名；抽到沒有墮落版圖的就改抽有圖的 */
const HUNT_SPR = {
  水鹿: 'hunt_sambar',
  台灣黑熊: 'hunt_bear',
  狂暴山豬: 'hunt_boar',
  石虎: 'hunt_leopardcat',
  雲豹: 'hunt_cloudleopard',
  百步蛇: 'hunt_viper',
  台灣獼猴: 'hunt_macaque',
  穿山甲: 'hunt_pangolin',
  熊鷹: 'hunt_hawkeagle',
  梅花鹿: 'hunt_sika',
  山羌: 'hunt_muntjac',
  高山白鼻心: 'hunt_civet',
  台灣藍鵲: 'hunt_magpie'
};
/* 墮落獸：有墮落版圖的野怪（HUNT_SPR）換成墮落圖與暗紅配色，當第一章的菁英 */
function beastBase(b0) {
  return { ...b0, name: '墮落・' + b0.name, spr: 'a_' + HUNT_SPR[b0.name], pal: corruptPal(b0.pal), res: [...b0.res] };
}
/* 十二生肖的詞綴：召喚時從一般、冥府、魔霧詞綴隨機抽 4 條 */
const ZOD_MODS = 4,
  ZOD_UW_R = 400;
function rollZodMods() {
  const pool = [...EMODS, ...UMODS, ...MMODS].map(m => m.id),
    out = [];
  while (out.length < ZOD_MODS) out.push(pool.splice(fl(Math.random() * pool.length), 1)[0]);
  return out;
}
function makeZodiac(k, lv, mods) {
  const z = ZODI[k],
    b = {
      name: z.t,
      bg: 'cave',
      spr: z.spr,
      pal: zodPal(z),
      hp: 100,
      atk: 17,
      arm: 32,
      el: z.el,
      res: [30, 30, 30],
      xp: 80,
      gold: 80
    },
    e = makeEnemy(b, lv, 4, [...(mods || rollZodMods())]);
  /* makeEnemy 會把有冥府詞綴的加上「冥府・」，這裡統一用召喚時的名字 */
  e.maxhp = Math.round(e.maxhp * (k === 'dragon' ? 1.9 : 1.4));
  e.hp = e.maxhp;
  e.name = b.name;
  return e;
}
