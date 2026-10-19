/* 漫步勇者 · 狩獵墮落十二生肖（0.2.12）：開啟狩獵後走路累積追蹤之血 → 血祭引出墮落獸得惡魔結晶 → 用結晶在身邊召喚地城、石碑等事件，或召喚墮落的十二生肖 */
'use strict';
/* ================= data ================= */
const HUNT_STEP = 10,
  BLOOD_MAX = 500,
  RITE_COST = 100,
  ZOD_COST = 10,
  SUM_MS = 3600e3,
  BEAST_MS = 30 * 60e3;
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
].map(z => ({ ...z, spr: 'z_' + z.k }));
const ZODI = Object.fromEntries(ZODIAC.map(z => [z.k, z]));
/* 用結晶在身邊召喚的事件 */
const HSUM = [
  { k: 'dungeon', n: '地城', c: 3, d: '一般或組隊地城' },
  { k: 'stele', n: '空白石碑', c: 2, d: '當場挑戰或壓縮封印' },
  { k: 'vein', n: '靈脈', c: 2, d: '採集刻印石' },
  { k: 'mseal', n: '魔霧', c: 4, d: 'Lv5 起，在身邊籠罩', lv: 5 }
];
/* 地圖上的墮落生肖：腳下一圈旋轉的血色符文陣與黑紅氣場 */
function drawZodiacs(c, t) {
  for (const e of ENT.values()) {
    if (e.kind !== 'zodiac' || !visible(e)) continue;
    const x = SX(e.x),
      y = SY(e.y),
      s = sprScale() * 1.3,
      r = 20 * s,
      pu = 0.5 + 0.5 * Math.sin(t / 300);
    if (x < -r * 2 || x > VW + r * 2 || y < -r * 3 || y > VH + r * 2) continue;
    glow(c, x, y - 10 * s, r * 1.8, '120,0,30', 0.55 + 0.2 * pu);
    c.save();
    c.translate(x, y);
    c.scale(1, 0.45);
    c.shadowColor = '#ff2a4a';
    c.shadowBlur = 10;
    c.strokeStyle = `rgba(255,50,80,${0.6 + 0.3 * pu})`;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(0, 0, r, 0, 6.28);
    c.stroke();
    c.rotate(t / 1500);
    c.beginPath();
    for (let k = 0; k <= 5; k++) {
      const a = (k * 4 * Math.PI) / 5 - Math.PI / 2;
      k ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    c.stroke();
    c.rotate(-t / 750);
    c.setLineDash([3, 5]);
    c.beginPath();
    c.arc(0, 0, r * 1.25, 0, 6.28);
    c.stroke();
    c.restore();
  }
}
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
Object.assign(KIND, { zodiac: '墮落生肖' });

/* ================= state ================= */
const H = () => (S.hunt = S.hunt || { on: false, blood: 0, acc: 0, marks: {}, heat: 0, tAt: 0 });
/* 獵殺等級（0.3.1.6）：狩獵開著時，時間與擊敗的怪物累積熱度，分三級。等級越高，身邊（玩家的紅圈內）的怪物越強、
   越常成群，但追蹤之血累積越快；關掉狩獵後熱度歸 0，追蹤之血慢慢消退 */
const HUNT_LV = [
  { heat: 0, n: 'Ⅰ', lv: 1, hp: 15, atk: 10, pack: [0.12, 0.06], blood: 1.5 },
  { heat: 40, n: 'Ⅱ', lv: 2, hp: 35, atk: 20, pack: [0.25, 0.14], blood: 2.5 },
  { heat: 100, n: 'Ⅲ', lv: 4, hp: 60, atk: 35, pack: [0.38, 0.25], blood: 4 }
];
const HEAT_MIN = 1,
  HEAT_KILL = 4,
  BLOOD_DECAY = 1;
/* 目前的獵殺等級：0 是沒開，1～3 */
const huntLv = () => {
  const h = S && S.hunt;
  if (!h || !h.on) return 0;
  let L = 1;
  HUNT_LV.forEach((q, i) => (h.heat >= q.heat ? (L = i + 1) : 0));
  return L;
};
const huntCfg = () => HUNT_LV[huntLv() - 1];
function addBlood(n) {
  const h = H(),
    before = h.blood;
  h.blood = Math.min(BLOOD_MAX, h.blood + n);
  quest('blood', h.blood - before);
  if (before < RITE_COST && h.blood >= RITE_COST) toast('追蹤之血滿 100 了，可以血祭引出墮落獸');
  huntHud();
}
/* setPos 每次移動都會呼叫：開啟狩獵時每 10 公尺 +1 追蹤之血 × 獵殺等級倍率 */
function huntWalk(m) {
  const h = H();
  if (!h.on || m > 200) return;
  h.acc += m * huntCfg().blood;
  if (h.acc < HUNT_STEP) return;
  const n = fl(h.acc / HUNT_STEP);
  h.acc -= n * HUNT_STEP;
  addBlood(n);
}
/* 每幀呼叫（timeRegen 旁）：開著時每分鐘熱度 +1；關著時追蹤之血每分鐘 -1 */
function huntTick() {
  const h = H(),
    n = now();
  if (!h.tAt || B || MB) h.tAt = n;
  const k = fl((n - h.tAt) / 60e3);
  if (k <= 0) return;
  h.tAt += k * 60e3;
  const L0 = huntLv();
  if (h.on) h.heat = (h.heat || 0) + HEAT_MIN * Math.min(k, 120);
  else if (h.blood > 0) h.blood = Math.max(0, h.blood - BLOOD_DECAY * k);
  if (huntLv() > L0) huntUp();
  huntHud();
}
/* 戰鬥勝利：每隻怪物增加熱度（菁英更多），也給追蹤之血 */
function huntKills(es) {
  const h = H();
  if (!h.on) return '';
  const L0 = huntLv(),
    heat = es.reduce((a, o) => a + HEAT_KILL * (1 + (o.rar || 0)), 0),
    blood = Math.round(es.length * 2 * huntCfg().blood);
  h.heat = (h.heat || 0) + heat;
  addBlood(blood);
  if (huntLv() > L0) huntUp();
  return `<p style="color:#ff6a6a">獵殺 ${huntCfg().n}：追蹤之血 +${blood}・熱度 ${h.heat}${huntLv() < 3 ? `/${HUNT_LV[huntLv()].heat}` : ''}</p>`;
}
function huntUp() {
  const c = huntCfg();
  sfx('encounter');
  buzz(120);
  toast(`獵殺等級提升到 ${c.n}！附近的怪物變強（等級 +${c.lv}），追蹤之血 ×${c.blood}`);
  addLog(`獵殺等級提升到 ${c.n}`);
  refreshEntities(true);
}
/* 開打時把獵殺等級的強化套在敵人身上（A.fight、packOf 呼叫）；keepLv 表示等級已經算進去了 */
function huntBuff(e, keepLv) {
  const c = huntCfg();
  if (!c || e.hlv) return e;
  e.hlv = huntLv();
  if (!keepLv) e.lv += c.lv;
  e.maxhp = e.hp = Math.round(e.maxhp * (1 + c.hp / 100));
  e.atk = Math.round(e.atk * (1 + c.atk / 100));
  e.xp = Math.round(e.xp * (1 + c.lv * 0.12));
  return e;
}
function huntHud() {
  const b = $('huntN');
  if (!b || !S) return;
  const h = H(),
    L = huntLv();
  b.textContent = h.blood;
  const f = b.closest('.lfab');
  f.classList.toggle('on', !!h.on);
  f.dataset.hl = L;
  const sp = f.querySelector('span');
  if (sp) sp.textContent = L ? `獵殺 ${HUNT_LV[L - 1].n}` : '狩獵';
}
/* 找身邊的路：距離 lo～hi 公尺，找不到路就放在身邊 */
function nearSpot(lo, hi) {
  const [px, py] = toM(S.lat, S.lng);
  for (let t = 0; t < 12; t++) {
    const a = Math.random() * 6.28,
      d = lo + Math.random() * (hi - lo),
      p = snapRoad(px + Math.cos(a) * d, py + Math.sin(a) * d, 90);
    if (p && Math.hypot(p[0] - px, p[1] - py) <= hi + 60) return p;
  }
  return [px + 20, py + 10];
}
function addSummon(e, ms) {
  S.summons = (S.summons || []).filter(s => s.until > now());
  const id = 'z' + uid();
  S.summons.push({ id, until: now() + ms, e: { ...e, id } });
  refreshEntities(true);
  return id;
}
/* genEntities 最後呼叫：把召喚出來、還沒用掉的東西放上地圖 */
function huntSpawns(out) {
  if (!S.summons || !S.summons.length) return;
  S.summons = S.summons.filter(
    s => s.until > now() && !S.defeated[s.id] && !(s.e.kind === 'dungeon' && S.cleared[s.id])
  );
  for (const s of S.summons) {
    const [la, ln] = toLL(s.e.x, s.e.y);
    out.set(s.id, { ...s.e, lat: la, lng: ln, until: s.until });
  }
}
const zodActive = () => (S.summons || []).find(s => s.e.kind === 'zodiac' && s.until > now() && !S.defeated[s.id]);

/* ================= enemies ================= */
function makeBeast() {
  const lv = S.lv + 1,
    b0 = pickMon(fl(Math.random() * 1e6), lv),
    base = { ...b0, pal: corruptPal(b0.pal), res: [...b0.res] };
  return { kind: 'monster', base, lv, rar: 2, mods: rollMods(fl(Math.random() * 1e6), 3), hunt: 'beast' };
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
/* 打贏：墮落獸給結晶，生肖給印記與寶物 */
function huntWin(b) {
  const h = H();
  if (b.hunt === 'beast') {
    const n = 1 + fl(Math.random() * 3);
    giveCur('dcrys', n);
    addLog(`擊敗墮落獸，得到惡魔結晶 ×${n}`);
    return `<p style="color:#ff8a9a">${curDot('dcrys')}惡魔結晶 ×${n}（共 ${S.cur.dcrys}）</p>`;
  }
  const z = ZODI[b.zod];
  if (!z) return '';
  const m = b.uwz ? 2 : 1;
  h.marks[z.k] = (h.marks[z.k] || 0) + m;
  h.slain = h.slain || {};
  h.slain[z.k] = 1;
  const got = [`${z.t}之印${m > 1 ? ' ×2' : ''}`];
  for (let i = 0; i < 3 * m; i++) {
    const c = rollCur(2);
    giveCur(c);
    got.push(CURI[c].n);
  }
  giveCur('dcrys', 2 * m);
  got.push(`惡魔結晶 ×${2 * m}`);
  if (Math.random() < 0.3 * m) got.push(giveJewel(1 + fl(Math.random() * (z.k === 'dragon' ? 3 : 2))));
  if (Math.random() < (z.k === 'dragon' ? 0.2 : 0.08) * m) {
    const it = makeLegend(SINS[fl(Math.random() * 7)].k);
    giveItem(it);
    got.push(itemName(it));
  }
  if (ZODIAC.every(q => h.slain[q.k]) && S.title !== '十二生肖獵人') {
    S.title = '十二生肖獵人';
    got.push('稱號「十二生肖獵人」');
  }
  addLog(`討伐${z.t}：${got.join('、')}`);
  return `<p style="color:#ff8a9a">討伐${b.uwz ? '冥府・' : ''}${z.t}${b.uwz ? '（冥府侵蝕，獎勵加倍）' : ''}！得到 ${got.join('、')}（討伐過 ${ZODIAC.filter(q => h.slain[q.k]).length}/12 種）</p>`;
}

/* ================= sheet ================= */
function huntHTML() {
  const h = H(),
    cr = S.cur.dcrys || 0,
    za = zodActive(),
    list = (S.summons || []).filter(s => s.until > now() && !S.defeated[s.id]);
  const L = huntLv(),
    c = huntCfg(),
    nx = L && L < 3 ? HUNT_LV[L] : null;
  return `<div class="card"><div class="rowx"><div class="t"><b>狩獵模式：<span style="color:${h.on ? '#ff6a7a' : 'var(--dim)'}">${h.on ? `獵殺 ${c.n}` : '關閉'}</span></b><small>${h.on ? `走路每 ${HUNT_STEP} 公尺、每次打贏都會得到追蹤之血（×${c.blood}）。` : `關閉中：追蹤之血每分鐘 -${BLOOD_DECAY}。`}</small></div><button class="btn sm ${h.on ? '' : 'pri'}" data-act="huntOn">${h.on ? '停止' : '開始狩獵'}</button></div>
  ${bar('追蹤之血', h.blood, BLOOD_MAX, '#e5484d')}
  ${h.on ? bar(nx ? `獵殺熱度（到 ${nx.n}）` : '獵殺熱度（已到 Ⅲ）', nx ? h.heat : 1, nx ? nx.heat : 1, '#ff6a3a') : ''}</div>
  <div class="card huntlv"><b>獵殺等級：高風險、高報酬</b><small class="sub">開啟狩獵後，地圖上你的範圍圈變成紅色。時間（每分鐘 +${HEAT_MIN}）與打倒的怪物（每隻 +${HEAT_KILL}，菁英更多）會累積熱度，熱度越高獵殺等級越高：紅圈內的怪物變強、更常成群出現，但追蹤之血累積得更快。停止狩獵後熱度歸 0，追蹤之血會慢慢消退。</small>
  <div class="hlv">${HUNT_LV.map(
    (q, i) =>
      `<div class="${L === i + 1 ? 'on' : ''}"><b>${q.n}</b><small>熱度 ${q.heat}+</small><small>怪物等級 +${q.lv}・生命 +${q.hp}%・攻擊 +${q.atk}%</small><small>成群機率提高</small><small style="color:#ff8a8a">追蹤之血 ×${q.blood}</small></div>`
  ).join('')}</div></div>
  <button class="btn pri" data-act="huntRite" ${h.blood >= RITE_COST ? '' : 'disabled'}>${curDot('blood')}血祭（${RITE_COST} 滴）：引出附近的墮落獸</button>
  <p class="sub">墮落獸會出現在 50～150 公尺內的路上（${BEAST_MS / 60e3} 分鐘內有效），打倒得到 1～3 個惡魔結晶。</p>
  <h3>${curDot('dcrys')}惡魔結晶 ${cr}</h3>
  <p class="sub">在你身邊 60～180 公尺召喚事件，${SUM_MS / 60e3} 分鐘內有效。走完一圈沒東西打的時候用。</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">${HSUM.map(
    s =>
      `<button class="btn sm" data-act="huntSum" data-k="${s.k}" ${cr >= s.c && S.lv >= (s.lv || 0) ? '' : 'disabled'}>${s.n}（${s.c}）<br><small class="sub">${s.d}</small></button>`
  ).join('')}</div>
  <h3>墮落十二生肖（每隻 ${ZOD_COST} 個結晶）</h3>
  <p class="sub">召喚後會出現在 100～250 公尺內，1 小時內要走過去打倒。Lv 你 +4 的首領，帶 4 條隨機詞綴，掉印記、通貨，有機會掉惡魔珠寶或傳奇裝備；集齊 12 種印記得到稱號。<br>在冥府侵蝕柱 ${ZOD_UW_R} 公尺內召喚，生肖會被冥府侵蝕：必帶冥府詞綴、獎勵加倍。${za ? `<br><span style="color:#ff8a9a">目前已經召喚了${ZODI[za.e.z].t}，先打倒它。</span>` : ''}</p>
  <div class="zgrid">${ZODIAC.map(
    z =>
      `<button class="zcell" data-act="huntZod" data-k="${z.k}" ${cr >= ZOD_COST && !za ? '' : 'disabled'} title="${z.d}"><canvas data-zod="${z.k}" width="18" height="18"></canvas><b>${z.t}</b><small>${z.n}・${h.marks[z.k] ? `之印 ×${h.marks[z.k]}` : z.d}</small></button>`
  ).join('')}</div>
  <button class="btn" data-act="sheet" data-s="seal">${curDot('zmark')}印記兌換（生肖傳奇、指定詞綴珠寶）</button>
  ${list.length ? `<h3>召喚中</h3><div class="card">${list.map(s => `<div class="rowx"><div class="t"><b>${esc(s.e.name)}</b><small>${fmtD(dist(S.lat, S.lng, ...toLL(s.e.x, s.e.y)))}・剩 ${Math.ceil((s.until - now()) / 60e3)} 分</small></div><button class="btn sm" data-act="openEnt" data-id="${s.id}">查看</button></div>`).join('')}</div>` : ''}`;
}
function huntPaint() {
  document.querySelectorAll('canvas[data-zod]').forEach(cv => {
    const z = ZODI[cv.dataset.zod];
    cv.getContext('2d').drawImage(sprite(z.spr, zodPal(z)), 0, 0);
  });
}

/* ================= 印記兌換 ================= */
/* 十二生肖傳奇：同一種印記 ×3 兌換，詞綴固定；穿越多件生肖傳奇，共鳴越強 */
const ZLEG = [
  ['rat', '鼠皇疫牙', 'weapon', 0, { physPct: 50, leech: 4, poisonCh: 25, poisonPct: 50 }],
  ['ox', '獄鎖重鎧', 'chest', 1, { life: 100, armorPct: 60, dmgRed: 8, taunt: 30 }],
  ['tiger', '虎煞血爪', 'gloves', 1, { physPct: 30, critPct: 4, critMulti: 40, lowLife: 25 }],
  ['rabbit', '月蝕兔靴', 'boots', 0, { speed: 6, evade: 8, dbl: 8, coldPct: 30 }],
  ['dragon', '邪龍之心', 'amulet', 1, { elePct: 40, resAll: 20, dmgMore: 12, life: 40 }],
  ['snake', '蛇姬毒環', 'ring', 3, { poisonCh: 30, poisonPct: 60, ail: 25, leech: 2 }],
  ['horse', '夢魘焚蹄', 'boots', 1, { speed: 4, conv: 50, firePct: 40, armor: 50 }],
  ['goat', '祭司魔角', 'helm', 0, { spellPct: 50, mana: 40, mpCost: 15, manaRegen: 3 }],
  ['monkey', '猴王雷杖', 'weapon', 4, { spellPct: 40, lightPct: 60, addLight: 8, dbl: 6 }],
  ['rooster', '業火冥羽', 'offhand', 4, { firePct: 50, addFire: 8, ail: 30, critPct: 2 }],
  ['dog', '獄犬鐵項圈', 'amulet', 0, { leech: 5, lowLife: 35, life: 40, physPct: 25 }],
  ['pig', '魔豬獠牙腰帶', 'belt', 1, { life: 90, lifePct: 10, armor: 60, regen: 6 }]
];
const ZLEG_COST = 3,
  ZJEWEL_COST = 2,
  ZRES = { dmgMore: 4, lifeMore: 3 };
ZLEG.forEach(([zk, n, slot, bi, st]) => {
  const L = {
    k: 'z_' + zk,
    zod: zk,
    n,
    slot,
    bi,
    st,
    lines: [
      ...Object.entries(st).map(([k, v]) => STATN[k](v)),
      `生肖共鳴：每穿 1 件生肖傳奇，傷害 +${ZRES.dmgMore}%、最大生命 +${ZRES.lifeMore}%（總乘）`
    ]
  };
  LEGENDS.push(L);
  LEGI[L.k] = L;
});
/* sumStats 呼叫：生肖共鳴 */
function zodStats(A) {
  const n = SLOTS.filter(s => S.eq[s] && S.eq[s].leg && LEGI[S.eq[s].leg] && LEGI[S.eq[s].leg].zod).length;
  if (n) for (const k in ZRES) A(k, ZRES[k] * n);
}
const markTotal = () => ZODIAC.reduce((a, z) => a + (H().marks[z.k] || 0), 0);
function sealHTML() {
  const h = H(),
    pick = SEL.jaff;
  return `<p class="sub">討伐十二生肖得到的印記可以在這裡兌換。印記共 ${markTotal()} 個。</p>
  <h3>生肖傳奇（同一種印記 ×${ZLEG_COST}）</h3>
  <p class="sub">詞綴固定，不能用通貨改造。每穿 1 件生肖傳奇，傷害 +${ZRES.dmgMore}%、最大生命 +${ZRES.lifeMore}%（總乘），穿越多件越強。</p>
  ${ZLEG.map(([zk, n, slot, , st]) => {
    const z = ZODI[zk],
      have = h.marks[zk] || 0;
    return `<div class="card"><div class="rowx"><canvas data-zod="${zk}" width="18" height="18" style="width:40px;height:40px;image-rendering:pixelated"></canvas><div class="t"><b style="color:${RCOL[3]}">${n}</b><small>${SLOTN[slot]}・${Object.entries(
      st
    )
      .map(([k, v]) => STATN[k](v))
      .join(
        '、'
      )}</small><small>${z.t}之印 ${have}/${ZLEG_COST}</small></div><button class="btn sm ${have >= ZLEG_COST ? 'pri' : ''}" data-act="sealLeg" data-k="${zk}" ${have >= ZLEG_COST ? '' : 'disabled'}>兌換</button></div></div>`;
  }).join('')}
  <h3>指定詞綴的惡魔珠寶（任意印記 ×${ZJEWEL_COST}）</h3>
  <p class="sub">選一條詞綴，保證出現而且是最高數值，另外再隨機 2 條。會先用掉數量最多的印記。</p>
  <div class="jpick">${JAFF.map(([k, , hi]) => `<button class="btn sm${pick === k ? ' pri' : ''}" data-act="sealPick" data-k="${k}">${STATN[k](hi)}</button>`).join('')}</div>
  <button class="btn pri" data-act="sealJewel" ${pick && markTotal() >= ZJEWEL_COST ? '' : 'disabled'}>${pick ? `兌換：${STATN[pick](JAFF.find(a => a[0] === pick)[2])} ＋ 2 條隨機` : '先選一條詞綴'}</button>`;
}
/* 用掉 n 個印記：先扣最多的 */
function spendMarks(n) {
  const m = H().marks;
  for (let i = 0; i < n; i++) {
    const k = ZODIAC.map(z => z.k).sort((a, b) => (m[b] || 0) - (m[a] || 0))[0];
    m[k]--;
  }
}

/* ================= actions ================= */
Object.assign(A, {
  hunt: () => {
    openSheet('hunt', '狩獵墮落十二生肖');
  },
  sealLeg: d => {
    const h = H(),
      L = LEGI['z_' + d.k];
    if (!L || (h.marks[d.k] || 0) < ZLEG_COST) return;
    h.marks[d.k] -= ZLEG_COST;
    const it = makeLegend(L.k);
    giveItem(it);
    sfx('level');
    toast(`兌換了${L.n}`);
    addLog(`用 ${ZLEG_COST} 個${ZODI[d.k].t}之印兌換${L.n}`);
    save();
    renderSheet();
  },
  sealPick: d => {
    SEL.jaff = SEL.jaff === d.k ? null : d.k;
    renderSheet();
  },
  sealJewel: () => {
    const a = JAFF.find(a => a[0] === SEL.jaff);
    if (!a || markTotal() < ZJEWEL_COST) return;
    S.jewels = S.jewels || [];
    if (S.jewels.length >= JEWEL_MAX) return toast(`惡魔珠寶最多 ${JEWEL_MAX} 個`);
    spendMarks(ZJEWEL_COST);
    const j = makeJewel(3);
    j.aff = [{ k: a[0], v: a[2] }, ...j.aff.filter(x => x.k !== a[0]).slice(0, 2)];
    S.jewels.push(j);
    sfx('level');
    toast('兌換了惡魔珠寶：' + jewelTxt(j));
    addLog('印記兌換惡魔珠寶：' + jewelTxt(j));
    save();
    renderSheet();
  },
  huntOn: () => {
    const h = H();
    h.on = !h.on;
    h.heat = 0;
    h.tAt = now();
    toast(h.on ? '開始狩獵：獵殺 Ⅰ，附近的怪物變強了' : '停止狩獵：追蹤之血會慢慢消退');
    huntHud();
    refreshEntities(true);
    save();
    renderSheet();
  },
  huntRite: () => {
    const h = H();
    if (h.blood < RITE_COST) return;
    h.blood -= RITE_COST;
    const [x, y] = nearSpot(50, 150),
      e = makeBeast();
    e.name = '墮落・' + makeEnemy(e.base, e.lv, e.rar, e.mods).name;
    Object.assign(e, { x, y, ph: 1, gl: '255,42,74' });
    addSummon(e, BEAST_MS);
    sfx('encounter');
    toast('血的氣味引來了墮落獸！');
    addLog('血祭：引出墮落獸');
    huntHud();
    save();
    renderSheet();
  },
  huntSum: d => {
    const s = HSUM.find(q => q.k === d.k);
    if (!s || (S.cur.dcrys || 0) < s.c || S.lv < (s.lv || 0)) return;
    S.cur.dcrys -= s.c;
    const [x, y] = nearSpot(60, 180);
    let e;
    if (s.k === 'dungeon') {
      const dt = Math.random() < 0.3 ? 'party' : 'normal',
        T = DTYPES[dt],
        pool = DMODS.map(m => m.id),
        mods = [];
      for (let a = T.mods[0] + fl(Math.random() * (T.mods[1] - T.mods[0] + 1)); a > 0; a--)
        mods.push(pool.splice(fl(Math.random() * pool.length), 1)[0]);
      e = { kind: 'dungeon', x, y, dt, mods, lv: S.lv + T.lv, name: T.n };
    } else if (s.k === 'stele') e = { kind: 'stele', x, y, name: '空白石碑', gl: '127,214,255' };
    else if (s.k === 'vein') e = { kind: 'vein', x, y, name: '靈脈', gl: '110,220,255' };
    else {
      const ok = MIST_TIERS.map((t, k) => k).filter(k => MIST_TIERS[k].lv <= S.lv),
        tier = ok[fl(Math.random() * ok.length)];
      e = {
        kind: 'mseal',
        x,
        y,
        tier,
        lv: S.lv + tier,
        name: `魔霧 ${ROMAN[tier]}`,
        gl: '176,107,255',
        lbl: `魔霧 ${ROMAN[tier]}`,
        lc: '#d8b8ff'
      };
    }
    addSummon(e, SUM_MS);
    sfx('coin');
    toast(`惡魔結晶碎裂，附近出現了${s.n}`);
    addLog(`用 ${s.c} 個惡魔結晶召喚${s.n}`);
    save();
    renderSheet();
  },
  huntZod: d => {
    const z = ZODI[d.k];
    if (!z || (S.cur.dcrys || 0) < ZOD_COST || zodActive()) return;
    S.cur.dcrys -= ZOD_COST;
    const [x, y] = nearSpot(100, 250),
      /* 在冥府侵蝕柱附近召喚：被冥府侵蝕，必帶冥府詞綴，獎勵加倍 */
      ob = [...ENT.values()].some(o => o.kind === 'obelisk' && Math.hypot(o.x - x, o.y - y) <= ZOD_UW_R),
      mods = rollZodMods();
    if (ob && !mods.some(m => m.startsWith('uw_'))) mods[0] = UMODS[fl(Math.random() * UMODS.length)].id;
    addSummon(
      {
        kind: 'zodiac',
        uwz: ob ? 1 : 0,
        x,
        y,
        z: z.k,
        spr: z.spr,
        pal: zodPal(z),
        lv: S.lv + 4,
        mods,
        name: (ob ? '冥府・' : '') + z.t,
        gl: '255,42,74',
        lbl: (ob ? '冥府・' : '') + z.t,
        lc: '#ff8a9a'
      },
      SUM_MS
    );
    sfx('encounter');
    toast(ob ? `冥府侵蝕柱的力量侵蝕了${z.t}！獎勵加倍` : `${z.t}出現在附近了！`);
    addLog(`用 ${ZOD_COST} 個惡魔結晶召喚${z.t}`);
    save();
    renderSheet();
  },
  zodGo: d => {
    const e = ENT.get(d.id);
    if (!inRange(e) || e.kind !== 'zodiac') return;
    closeSheet();
    const en = makeZodiac(e.z, e.lv, e.mods);
    en.name = e.name;
    startBattle(en, {
      entId: e.id,
      bg: 'cave',
      boss: true,
      zod: e.z,
      uwz: e.uwz,
      hunt: 'zod',
      onsite: siteBonus(e)
    });
  }
});
/* 地圖上的墮落生肖：說明與挑戰按鈕（ui.js 的 openEnt 會呼叫） */
function zodEntHTML(e, inR) {
  const z = ZODI[e.z];
  return {
    desc: `墮落的十二生肖「${z.n}」（${z.d}）。Lv${e.lv} 首領，帶 ${ZOD_MODS} 條隨機詞綴：${(e.mods || []).map(id => `<b>${EMODI[id].n}</b>（${EMODI[id].d}）`).join('、')}，生命是一般首領的 ${e.z === 'dragon' ? '1.9' : '1.4'} 倍。${e.uwz ? '<br><span style="color:#ff8a9a">被冥府侵蝕柱侵蝕：必帶冥府詞綴，打倒後印記、通貨、結晶加倍，珠寶與傳奇機率加倍。</span>' : ''}剩 ${Math.max(0, Math.ceil((e.until - now()) / 60e3))} 分鐘就會離開。`,
    act: `<button class="btn pri" data-act="zodGo" data-id="${e.id}" ${inR ? '' : 'disabled'}>討伐${z.t}</button>`
  };
}
setInterval(huntHud, 2000);
