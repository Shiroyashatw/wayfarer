/* 漫步勇者 · 亡靈軍團（0.1.0 肉鴿：亡靈區、祭壇、精華與亡靈製作拿掉，只留第三章的亡靈怪與首領） */
'use strict';
/* ================= data ================= */
const pad16u = rows => rows.map(r => (r + '................').slice(0, 16));
Object.assign(SPR, {
  skeleton: pad16u([
    '.....wwwww......',
    '....wwwwwww.....',
    '....wkwwwkw.....',
    '....wwwwwww.....',
    '.....wkwkw......',
    '......www.......',
    '....wwwwwww.....',
    '...w.w.w.w.w....',
    '...w.wwwww.w....',
    '.....w.w.w......',
    '......www.......',
    '.....w...w......',
    '.....w...w......',
    '....ww...ww.....'
  ]),
  zombie: pad16u([
    '.....hhhh.......',
    '....hgggghh.....',
    '....gegggeg.....',
    '....gggggggg....',
    '.....gmmmgg.....',
    '....cccccc......',
    '..gcccccccggg...',
    '..g.cccccc..gg..',
    '....cccccc......',
    '....pppppp......',
    '....pp..pp......',
    '....pp..pp......',
    '...ggg..ggg.....'
  ]),
  lich: pad16u([
    '......y.y.y.....',
    '......yyyyy.....',
    '.....hhhhhhh....',
    '....hhwwwwwhh...',
    '....hwewwewh....',
    '....hhwwwwhh....',
    '...rrhhhhhhrr...',
    '..rrrrrrrrrrrr..',
    '..r.rrrrrrrr.r.o',
    '....rrrrrrrr..oo',
    '....rrrrrrrr...o',
    '...rrrrrrrrrr...',
    '..rrrrrrrrrrrr..'
  ]),
  reaper: pad16u([
    '.....hhhh....bb.',
    '....hhhhhh..b...',
    '...hhkekkhh.b...',
    '...hhkkkkhh.b...',
    '...hhhhhhhh.b...',
    '..hhhhhhhhhhb...',
    '..hhhhhhhhhhbsss',
    '..hhhhhhhhhhb..s',
    '...hhhhhhhh.b...',
    '...hhhhhhhh.b...',
    '..hhhhhhhhhh....',
    '.hhhhhhhhhhhh...',
    '.h.h.h.h.h.h.h..'
  ]),
  bonelord: pad16u([
    '....y.y.y.y.....',
    '....yyyyyyy.....',
    '....wwwwwww.....',
    '...wwkwwwkww....',
    '...wwwwwwwww....',
    '....wkwkwkw.....',
    '..aaaaaaaaaaa...',
    '.aaayaaaaayaaa..',
    '.w.aaaaaaaaa.w..',
    '.w.aaaaaaaaa.w..',
    '...aaaaaaaaa....',
    '....ww...ww.....',
    '....ww...ww.....',
    '...aaa...aaa....'
  ]),
  ualtar: pad16u([
    '.......gg.......',
    '......gwwg......',
    '.......gg.......',
    '....ssssssss....',
    '...swwswwswws...',
    '...ssssssssss...',
    '....sddddds.....',
    '....sdkdkds.....',
    '....sddddds.....',
    '...ssssssssss...',
    '..ssssssssssss..'
  ])
});
/* 五種亡靈：ess 是掉的精華 */
const UNDEAD = [
  {
    name: '骷髏兵',
    ess: 'bone',
    bg: 'cave',
    spr: 'a_skeleton',
    pal: { w: '#e8e2d0' },
    hp: 40,
    atk: 11,
    arm: 20,
    el: 'phys',
    res: [0, 30, 0],
    xp: 14,
    gold: 10,
    w: 30
  },
  {
    name: '殭屍',
    ess: 'flesh',
    bg: 'cave',
    spr: 'a_jiangshi',
    pal: { g: '#7a9a6a', h: '#3a2a1a', e: '#ffe24a', m: '#3a1a1a', c: '#4a5a7a', p: '#3a3a4a' },
    hp: 60,
    atk: 9,
    arm: 10,
    el: 'chaos',
    res: [0, 0, 0],
    xp: 14,
    gold: 10,
    w: 30
  },
  {
    name: '幽魂',
    ess: 'soul',
    bg: 'cave',
    spr: 'a_wraith',
    pal: { v: '#b8d8e8', e: '#1a2a3a', m: '#5a7a9a' },
    hp: 30,
    atk: 12,
    arm: 0,
    el: 'cold',
    res: [0, 40, 0],
    xp: 15,
    gold: 10,
    w: 20
  },
  {
    name: '屍巫',
    ess: 'curse',
    bg: 'cave',
    spr: 'a_necro',
    pal: { y: '#ffd166', h: '#2a2a3a', w: '#d8d0c0', e: '#7fff7a', r: '#5a2a6a', o: '#7fff7a' },
    hp: 38,
    atk: 13,
    arm: 6,
    el: 'fire',
    res: [30, 30, 30],
    xp: 18,
    gold: 12,
    w: 15
  },
  {
    name: '死神',
    ess: 'death',
    bg: 'cave',
    spr: 'a_reaper',
    pal: { h: '#1a1622', k: '#000000', e: '#ff3a3a', b: '#7a5a3a', s: '#d8dde6' },
    hp: 55,
    atk: 18,
    arm: 12,
    el: 'chaos',
    res: [20, 20, 20, 40],
    xp: 30,
    gold: 20,
    w: 5
  }
];
const UNDEADN = Object.fromEntries(UNDEAD.map(u => [u.name, u]));
/* 精華：每種對應一組裝備詞綴 */
/* 亡靈軍團長：7 種外觀，各有名字 */
const UD_LORDS = [
  ['a_bonelord', '骷髏將軍'],
  ['a_death_witch', '死亡巫女'],
  ['a_bone_knight', '骷髏騎士'],
  ['a_ghost_priest', '冥燈道士'],
  ['a_wraith_general', '怨靈將軍'],
  ['a_bone_colossus', '屍骸巨像'],
  ['a_blood_count', '血族伯爵']
];
/* ================= bosses ================= */
function udBoss(name, spr, pal, lv, mult) {
  const b = { name, bg: 'cave', spr, pal, hp: 90, atk: 16, arm: 35, el: 'phys', res: [30, 30, 30], xp: 50, gold: 50 },
    e = makeEnemy(b, lv, 4, ['tough', 'leech', 'armored']);
  e.maxhp = Math.round(e.maxhp * mult);
  e.hp = e.maxhp;
  e.name = name;
  return e;
}
