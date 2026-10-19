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
  { k: 'rat', n: '子鼠', el: 'phys', mods: ['swift', 'leech'], d: '速度快，偷你的血', pal: { b: '#4a3a4a' } },
  { k: 'ox', n: '丑牛', el: 'phys', mods: ['tough', 'armored'], d: '又硬又厚', pal: { b: '#4a1a1a', h: '#2a2228' } },
  { k: 'tiger', n: '寅虎', el: 'phys', mods: ['fury', 'swift'], d: '越打越兇', pal: { b: '#a04a1a' } },
  { k: 'rabbit', n: '卯兔', el: 'cold', mods: ['swift', 'cold'], d: '冰冷的連擊', pal: { b: '#c8b8d0', p: '#6a2a8a' } },
  {
    k: 'dragon',
    n: '辰龍',
    el: 'fire',
    mods: ['fire', 'tough', 'fury'],
    d: '十二生肖之首，最難纏',
    pal: { b: '#4a2468', r: '#ff4a3a' }
  },
  { k: 'snake', n: '巳蛇', el: 'cold', mods: ['leech', 'cold'], d: '纏住吸血', pal: { b: '#1e3a2a' } },
  { k: 'horse', n: '午馬', el: 'fire', mods: ['swift', 'fire'], d: '烈火奔馳', pal: { b: '#1e1824', h: '#3a2a2a' } },
  {
    k: 'goat',
    n: '未羊',
    el: 'light',
    mods: ['reflect', 'shock'],
    d: '雷光與反射',
    pal: { b: '#3a2a2a', e: '#ffd23a' }
  },
  { k: 'monkey', n: '申猴', el: 'light', mods: ['swift', 'shock'], d: '雷電亂竄', pal: { b: '#4a2a1a' } },
  { k: 'rooster', n: '酉雞', el: 'fire', mods: ['fire', 'reflect'], d: '火焰反射', pal: { b: '#2a1a1a' } },
  { k: 'dog', n: '戌狗', el: 'phys', mods: ['fury', 'leech'], d: '咬住不放', pal: { b: '#342834', w: '#c0b0a0' } },
  { k: 'pig', n: '亥豬', el: 'phys', mods: ['tough', 'fury'], d: '橫衝直撞', pal: { b: '#5a2a2a', l: '#a06070' } }
].map(z => ({ ...z, spr: 'z_' + z.k }));
const ZODI = Object.fromEntries(ZODIAC.map(z => [z.k, z]));
/* 用結晶在身邊召喚的事件 */
const HSUM = [
  { k: 'dungeon', n: '地城', c: 3, d: '一般或組隊地城' },
  { k: 'stele', n: '空白石碑', c: 2, d: '當場挑戰或壓縮封印' },
  { k: 'vein', n: '靈脈', c: 2, d: '採集刻印石' },
  { k: 'mseal', n: '魔霧封印', c: 4, d: 'Lv5 起', lv: 5 }
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
  PIX.cur_blood = {
    r: ['...r....', '...r....', '..rrr...', '.rrwrr..', '.rrrrr..', '.rrrrd..', '..rdd...', '........'],
    p: { r: '#e5484d', w: '#ffc0c0', d: '#7a1a1a' }
  };
})();
Object.assign(KIND, { zodiac: '墮落生肖' });
FIGHTK.add('zodiac');

/* ================= state ================= */
const H = () => (S.hunt = S.hunt || { on: false, blood: 0, acc: 0, marks: {} });
/* setPos 每次移動都會呼叫：開啟狩獵時每 10 公尺 +1 追蹤之血 */
function huntWalk(m) {
  const h = H();
  if (!h.on || m > 200) return;
  h.acc += m;
  if (h.acc < HUNT_STEP) return;
  const n = fl(h.acc / HUNT_STEP),
    before = h.blood;
  h.acc -= n * HUNT_STEP;
  h.blood = Math.min(BLOOD_MAX, h.blood + n);
  if (before < RITE_COST && h.blood >= RITE_COST) toast('追蹤之血滿 100 了，可以血祭引出墮落獸');
  huntHud();
}
function huntHud() {
  const b = $('huntN');
  if (!b || !S) return;
  const h = H();
  b.textContent = h.blood;
  b.closest('.lfab').classList.toggle('on', !!h.on);
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
function makeZodiac(k, lv) {
  const z = ZODI[k],
    b = {
      name: '墮落' + z.n,
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
    e = makeEnemy(b, lv, 4, [...z.mods]);
  e.maxhp = Math.round(e.maxhp * (k === 'dragon' ? 2.2 : 1.6));
  e.hp = e.maxhp;
  e.name = b.name;
  return e;
}
/* 打贏：墮落獸給結晶，生肖給印記與寶物 */
function huntWin(b) {
  const h = H();
  if (b.hunt === 'beast') {
    const n = 1 + fl(Math.random() * 3) + (b.onsite ? 1 : 0);
    giveCur('dcrys', n);
    addLog(`擊敗墮落獸，得到惡魔結晶 ×${n}`);
    return `<p style="color:#ff8a9a">${curDot('dcrys')}惡魔結晶 ×${n}（共 ${S.cur.dcrys}）</p>`;
  }
  const z = ZODI[b.zod];
  if (!z) return '';
  h.marks[z.k] = (h.marks[z.k] || 0) + 1;
  const got = [`${z.n}印記`];
  for (let i = 0; i < 3; i++) {
    const c = rollCur(2);
    giveCur(c);
    got.push(CURI[c].n);
  }
  giveCur('dcrys', 2);
  got.push('惡魔結晶 ×2');
  if (Math.random() < 0.3) got.push(giveJewel(1 + fl(Math.random() * (z.k === 'dragon' ? 3 : 2))));
  if (Math.random() < (z.k === 'dragon' ? 0.2 : 0.08)) {
    const it = makeLegend(SINS[fl(Math.random() * 7)].k);
    giveItem(it);
    got.push(itemName(it));
  }
  if (ZODIAC.every(q => h.marks[q.k]) && S.title !== '十二生肖獵人') {
    S.title = '十二生肖獵人';
    got.push('稱號「十二生肖獵人」');
  }
  addLog(`討伐墮落${z.n}：${got.join('、')}`);
  return `<p style="color:#ff8a9a">討伐墮落${z.n}！得到 ${got.join('、')}（生肖 ${ZODIAC.filter(q => h.marks[q.k]).length}/12）</p>`;
}

/* ================= sheet ================= */
function huntHTML() {
  const h = H(),
    cr = S.cur.dcrys || 0,
    za = zodActive(),
    list = (S.summons || []).filter(s => s.until > now() && !S.defeated[s.id]);
  return `<div class="card"><div class="rowx"><div class="t"><b>狩獵模式：<span style="color:${h.on ? '#ff6a7a' : 'var(--dim)'}">${h.on ? '追蹤中' : '關閉'}</span></b><small>開啟後每走 ${HUNT_STEP} 公尺得到 1 滴追蹤之血（最多 ${BLOOD_MAX}）。</small></div><button class="btn sm ${h.on ? '' : 'pri'}" data-act="huntOn">${h.on ? '停止' : '開始狩獵'}</button></div>
  ${bar('追蹤之血', h.blood, BLOOD_MAX, '#e5484d')}</div>
  <button class="btn pri" data-act="huntRite" ${h.blood >= RITE_COST ? '' : 'disabled'}>${curDot('blood')}血祭（${RITE_COST} 滴）：引出附近的墮落獸</button>
  <p class="sub">墮落獸會出現在 50～150 公尺內的路上（${BEAST_MS / 60e3} 分鐘內有效），打倒得到 1～3 個惡魔結晶，人在現場打再多 1 個。</p>
  <h3>${curDot('dcrys')}惡魔結晶 ${cr}</h3>
  <p class="sub">在你身邊 60～180 公尺召喚事件，${SUM_MS / 60e3} 分鐘內有效。走完一圈沒東西打的時候用。</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">${HSUM.map(
    s =>
      `<button class="btn sm" data-act="huntSum" data-k="${s.k}" ${cr >= s.c && S.lv >= (s.lv || 0) ? '' : 'disabled'}>${s.n}（${s.c}）<br><small class="sub">${s.d}</small></button>`
  ).join('')}</div>
  <h3>墮落十二生肖（每隻 ${ZOD_COST} 個結晶）</h3>
  <p class="sub">召喚後會出現在 100～250 公尺內，1 小時內要走過去打倒。Lv 你 +4 的首領，掉印記、通貨，有機會掉惡魔珠寶或傳奇裝備；集齊 12 種印記得到稱號。${za ? `<br><span style="color:#ff8a9a">目前已經召喚了墮落${ZODI[za.e.z].n}，先打倒它。</span>` : ''}</p>
  <div class="zgrid">${ZODIAC.map(
    z =>
      `<button class="zcell" data-act="huntZod" data-k="${z.k}" ${cr >= ZOD_COST && !za ? '' : 'disabled'} title="${z.d}"><canvas data-zod="${z.k}" width="18" height="18"></canvas><b>${z.n}</b><small>${h.marks[z.k] ? `印記 ×${h.marks[z.k]}` : z.d}</small></button>`
  ).join('')}</div>
  ${list.length ? `<h3>召喚中</h3><div class="card">${list.map(s => `<div class="rowx"><div class="t"><b>${esc(s.e.name)}</b><small>${fmtD(dist(S.lat, S.lng, ...toLL(s.e.x, s.e.y)))}・剩 ${Math.ceil((s.until - now()) / 60e3)} 分</small></div><button class="btn sm" data-act="openEnt" data-id="${s.id}">查看</button></div>`).join('')}</div>` : ''}`;
}
function huntPaint() {
  document.querySelectorAll('canvas[data-zod]').forEach(cv => {
    const z = ZODI[cv.dataset.zod];
    cv.getContext('2d').drawImage(sprite(z.spr, zodPal(z)), 0, 0);
  });
}

/* ================= actions ================= */
Object.assign(A, {
  hunt: () => {
    openSheet('hunt', '狩獵墮落十二生肖');
  },
  huntOn: () => {
    const h = H();
    h.on = !h.on;
    toast(h.on ? '開始狩獵：走路會累積追蹤之血' : '停止狩獵');
    huntHud();
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
        name: `魔霧封印 ${ROMAN[tier]}`,
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
    const [x, y] = nearSpot(100, 250);
    addSummon(
      {
        kind: 'zodiac',
        x,
        y,
        z: z.k,
        spr: z.spr,
        pal: zodPal(z),
        lv: S.lv + 4,
        name: '墮落' + z.n,
        gl: '255,42,74',
        lbl: '墮落' + z.n,
        lc: '#ff8a9a'
      },
      SUM_MS
    );
    sfx('encounter');
    toast(`墮落${z.n}出現在附近了！`);
    addLog(`用 ${ZOD_COST} 個惡魔結晶召喚墮落${z.n}`);
    save();
    renderSheet();
  },
  zodGo: d => {
    const e = ENT.get(d.id);
    if (!inRange(e) || e.kind !== 'zodiac') return;
    closeSheet();
    startBattle(makeZodiac(e.z, e.lv), {
      entId: e.id,
      bg: 'cave',
      boss: true,
      zod: e.z,
      hunt: 'zod',
      onsite: onSite(e)
    });
  }
});
/* 地圖上的墮落生肖：說明與挑戰按鈕（ui.js 的 openEnt 會呼叫） */
function zodEntHTML(e, inR) {
  const z = ZODI[e.z];
  return {
    desc: `墮落的十二生肖之一（${z.d}）。Lv${e.lv} 首領，帶 ${z.mods.map(id => `<b>${EMODS.find(q => q.id === id).n}</b>`).join('、')}，生命是一般首領的 ${e.z === 'dragon' ? '2.2' : '1.6'} 倍。剩 ${Math.max(0, Math.ceil((e.until - now()) / 60e3))} 分鐘就會離開。`,
    act: `<button class="btn pri" data-act="zodGo" data-id="${e.id}" ${inR ? '' : 'disabled'}>討伐墮落${z.n}</button>`
  };
}
setInterval(huntHud, 2000);
