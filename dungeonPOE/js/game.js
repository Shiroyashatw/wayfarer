/* dungeonPOE · 遊戲：存檔結構、場景（藏身處／地圖）、玩家與技能、打擊感（停頓、震動、擊退、閃白、見切）、怪物 AI、王、掉落、主迴圈 */
'use strict';
const TAU = Math.PI * 2;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const angDiff = (a, b) => Math.abs(((a - b + Math.PI * 3) % TAU) - Math.PI);

/* ---------- 存檔 ---------- */
let S;
/* 存檔版本 10 是 0.2.0（重製：0.1 的存檔不沿用） */
function newGame() {
  const s = {
    v: 12,
    name: '女忍者',
    lv: 1,
    xp: 0,
    gold: 0,
    frag: 0,
    maxT: 1,
    tier: 1,
    eq: Object.fromEntries(EQS.map(e => [e.k, null])),
    inv: { w: 12, h: 5, items: [] },
    stash: { w: 12, h: 12, items: [] },
    sfx: 1
  };
  s.eq.weapon = mkItem('w_katana', 1, 0);
  /* 技能欄：左鍵斬擊、右鍵飛刃、Q 旋風斬；其他從怪物身上掉 */
  s.skills = Array.from({ length: NSLOT }, () => ({ a: null, s: [null, null] }));
  s.skills[0].a = mkGem('slash');
  s.skills[1].a = mkGem('blade');
  s.skills[2].a = mkGem('whirl');
  s.pt = [...PT_START];
  s.asc = null;
  s.at = [];
  s.eq.chest = mkItem('c_leather', 1, 0);
  return s;
}

/* ---------- 世界 ---------- */
const G = {
  t: 0,
  hs: 0,
  slow: 0,
  trauma: 0,
  cam: { x: 0, y: 0 },
  mobs: [],
  shots: [],
  fx: [],
  nums: [],
  drops: [],
  tele: [],

  state: 'play',
  scene: 'hide'
};
let P, ST;
function resetWorld(W, H) {
  Object.assign(G, {
    W,
    H,
    mobs: [],
    shots: [],
    fx: [],
    nums: [],
    drops: [],
    tele: [],

    props: [],
    tiles: null,
    mini: null,
    bossOut: 0,
    prog: 0,
    need: 1,
    state: 'play',
    portal: null,
    hs: 0,
    slow: 0,
    trauma: 0,
    kills: 0
  });
}
function newPlayer(x, y) {
  ST = stats();
  const keep = P && P.hp > 0 ? { hp: Math.min(ST.hp, P.hp) } : {};
  P = {
    x,
    y,
    vx: 0,
    vy: 0,
    r: 16,
    hp: ST.hp,
    mp: ST.mp,
    face: -Math.PI / 2,
    act: null,
    roll: null,
    cds: {},
    flask: FLASK.n,
    heal: 0,
    iuntil: 0,
    critNext: 0,
    hurtT: 0,
    ...keep
  };
  G.cam.x = x;
  G.cam.y = y;
}
/* 藏身處：小房間，地圖台在中間偏上、倉庫箱在左邊 */
function enterHideout() {
  resetWorld(960, 640);
  G.scene = 'hide';
  G.props = [
    { k: 'device', n: '地圖台', x: 480, y: 210, r: 46 },
    { k: 'stash', n: '倉庫', x: 190, y: 330, r: 34 },
    { k: 'market', n: '市集（之後開放）', x: 770, y: 330, r: 34 },
    { k: 'asc', n: '昇華石碑', x: 770, y: 520, r: 30 }
  ];
  newPlayer(480, 470);
  P.hp = ST.hp;
  P.mp = ST.mp;
  skillsEnter();
  hudState();
}
/* 開地圖：花碎片、地圖台前面出現傳送門 */
function openMap(t) {
  if (t > S.maxT) return hudWarn('先打倒前一階的王');
  const c = mapCost(t);
  if (S.frag < c) return hudWarn(`碎片不夠：要 ${c} 個`);
  S.frag -= c;
  S.tier = t;
  G.portal = { x: 480, y: 330, to: t };
  save();
  sfx('portal');
  hudWarn(`階級 ${t} 的傳送門開了`);
}
/* 地圖（參考 Chronicon）：一塊一塊 14×14 格的房間拼起來，有岔路也沒關係；
   殺怪累積首領進度，滿了王就出現在附近（怪物總量約是需要的 150～160%） */
const TS = 48,
  CHUNK = 14;
/* 從地圖裡的傳送門直接開下一張（花碎片） */
function mapAgain(t) {
  const c = mapCost(t);
  if (t > S.maxT) return hudWarn('先打倒前一階的王');
  if (S.frag < c) return hudWarn(`碎片不夠：要 ${c} 個`);
  S.frag -= c;
  S.tier = t;
  save();
  enterMap(t);
}
function enterMap(t) {
  const CW = 6,
    CHn = 5,
    cols = CW * CHUNK,
    rows = CHn * CHUNK;
  resetWorld(cols * TS, rows * TS);
  G.scene = 'map';
  G.mapT = t;
  const tiles = (G.tiles = new Uint8Array(cols * rows).fill(1));
  G.cols = cols;
  G.rows = rows;
  const carve = (x0, y0, x1, y1) => {
    for (let y = Math.max(1, y0); y <= Math.min(rows - 2, y1); y++)
      for (let x = Math.max(1, x0); x <= Math.min(cols - 2, x1); x++) tiles[y * cols + x] = 0;
  };
  /* 房間的排法：從左邊一塊開始往外長，偶爾從舊房間分岔 */
  const n = Math.min(CW * CHn - 6, 9 + Math.floor(t / 3)),
    rooms = [{ cx: 0, cy: irnd(1, CHn - 2) }],
    has = new Set([rooms[0].cx + ',' + rooms[0].cy]),
    links = [];
  for (let k = 0; rooms.length < n && k < 500; k++) {
    const from = Math.random() < 0.6 ? rooms[rooms.length - 1] : pick(rooms),
      [dx, dy] = pick([
        [1, 0],
        [1, 0],
        [0, 1],
        [0, -1],
        [-1, 0]
      ]),
      c = { cx: from.cx + dx, cy: from.cy + dy };
    if (c.cx < 0 || c.cy < 0 || c.cx >= CW || c.cy >= CHn || has.has(c.cx + ',' + c.cy)) continue;
    has.add(c.cx + ',' + c.cy);
    rooms.push(c);
    links.push([from, c]);
  }
  /* 挖房間（大小隨機）＋幾根柱子 */
  for (const r of rooms) {
    r.x0 = r.cx * CHUNK + irnd(1, 3);
    r.y0 = r.cy * CHUNK + irnd(1, 3);
    r.x1 = (r.cx + 1) * CHUNK - 1 - irnd(1, 3);
    r.y1 = (r.cy + 1) * CHUNK - 1 - irnd(1, 3);
    carve(r.x0, r.y0, r.x1, r.y1);
    for (let k = irnd(0, 3); k > 0; k--) {
      const px = irnd(r.x0 + 2, r.x1 - 3),
        py = irnd(r.y0 + 2, r.y1 - 3);
      if (Math.abs(px + 1 - (r.cx * CHUNK + 7)) < 3 || Math.abs(py + 1 - (r.cy * CHUNK + 7)) < 3) continue;
      for (const [ax, ay] of [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1]
      ])
        tiles[(py + ay) * cols + px + ax] = 1;
    }
  }
  /* 走廊：相連的房間中心對中心，3 格寬；偶爾多開一條成環 */
  const mid = r => [r.cx * CHUNK + 7, r.cy * CHUNK + 7];
  const corridor = (a, b) => {
    const [ax, ay] = mid(a),
      [bx, by] = mid(b);
    carve(Math.min(ax, bx) - 1, Math.min(ay, by) - 1, Math.max(ax, bx) + 1, Math.max(ay, by) + 1);
  };
  for (const [a, b] of links) corridor(a, b);
  for (const a of rooms)
    for (const b of rooms)
      if (a !== b && Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy) === 1 && Math.random() < 0.08) corridor(a, b);
  const st = rooms[0];
  newPlayer((st.cx * CHUNK + 7) * TS, (st.cy * CHUNK + 7) * TS);
  /* 怪物：起點以外的房間各 2～3 群，每 4 群一隻菁英 */
  let pk = 0,
    pts = 0;
  for (const r of rooms.slice(1))
    for (let k = irnd(2, 3); k > 0; k--) {
      const c = floorIn(r);
      if (!c) continue;
      const elite = ++pk % 4 === 0;
      pick(PACKS).forEach((m, j) => {
        const p = floorNear(c.x, c.y, 0, 70, 20) || c;
        spawnMob(MOBS[m], p.x, p.y, pk, elite && j === 0);
        pts += elite && j === 0 ? 6 : 1;
      });
    }
  skillsEnter();
  G.need = Math.ceil(pts / rnd(1.5, 1.6));
  G.prog = 0;
  G.rooms = rooms;
  sfx('portal');
  hudState();
}
const isWall = (x, y) => {
  if (!G.tiles) return false;
  const tx = Math.floor(x / TS),
    ty = Math.floor(y / TS);
  return tx < 0 || ty < 0 || tx >= G.cols || ty >= G.rows || G.tiles[ty * G.cols + tx] === 1;
};
/* 周圍 clear 像素內都不是牆 */
const open = (x, y, c) =>
  !isWall(x, y) && !isWall(x - c, y) && !isWall(x + c, y) && !isWall(x, y - c) && !isWall(x, y + c);
function floorIn(r) {
  for (let k = 0; k < 40; k++) {
    const x = rnd(r.x0 + 1.5, r.x1 - 0.5) * TS,
      y = rnd(r.y0 + 1.5, r.y1 - 0.5) * TS;
    if (open(x, y, 40)) return { x, y };
  }
  return null;
}
function floorNear(x, y, r0, r1, c) {
  for (let k = 0; k < 60; k++) {
    const a = rnd(0, TAU),
      d = rnd(r0, r1),
      p = { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d };
    if (open(p.x, p.y, c)) return p;
  }
  return null;
}
/* 首領進度滿了：王出現在玩家附近 */
function addProg(m) {
  if (m.pack === 99 || m.boss || G.bossOut) return;
  G.prog += m.elite ? 6 : 1;
  if (G.prog < G.need) return;
  G.bossOut = 1;
  const p = floorNear(P.x, P.y, 260, 420, 60) || floorNear(P.x, P.y, 120, 260, 50) || { x: P.x + 1, y: P.y };
  const b = spawnMob(bossOf(G.mapT), p.x, p.y, 99, false);
  b.boss = 1;
  b.aggro = 1;
  b.cd = 1.2;
  fx({ k: 'ring', x: p.x, y: p.y, r: 160, dur: 0.6, col: '#ff6b3d' });
  shake(0.6);
  sfx('boss');
  hudWarn(b.D.n + '出現了！');
}
/* 回藏身處（地圖就結束了） */
function goHome() {
  if (G.scene !== 'map') return;
  save();
  enterHideout();
}
function spawnMob(D, x, y, pack, elite) {
  const m = tierMul(G.mapT || 1),
    e = elite ? ELITE : { hp: 1, dmg: 1, sz: 1 };
  const o = {
    D,
    x,
    y,
    vx: 0,
    vy: 0,
    pack,
    elite,
    r: D.r * e.sz,
    sz: D.sz * e.sz,
    hp: D.hp * m.hp * e.hp,
    dmg: D.dmg * m.dmg * e.dmg,
    el: D.el || 'phys',
    st: 'idle',
    t: 0,
    cd: rnd(0.3, 1),
    flash: 0,
    sq: 0,
    aggro: 0,
    ph: Math.random() * TAU
  };
  o.mhp = o.hp;
  G.mobs.push(o);
  return o;
}

/* ---------- 輸入 ---------- */
const K = {},
  M = { x: 0, y: 0, L: 0, R: 0 };
let CV, CX;
function mouseWorld() {
  return { x: (M.x - CV.clientWidth / 2) / ZOOM + G.cam.x, y: (M.y - CV.clientHeight / 2) / ZOOM + G.cam.y };
}

/* ---------- 打擊感 ---------- */
function hitstop(s) {
  G.hs = Math.max(G.hs, s);
}
function shake(a) {
  G.trauma = Math.min(1, G.trauma + a);
}
function num(x, y, v, c) {
  G.nums.push({ x: x + rnd(-8, 8), y, v: Math.round(v), c, t: 0 });
}
function fx(o) {
  o.t = 0;
  G.fx.push(o);
}
function sparks(x, y, ang, n, col) {
  for (let i = 0; i < n; i++) {
    const a = ang + rnd(-0.9, 0.9),
      s = rnd(160, 420);
    fx({ k: 'p', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, dur: rnd(0.18, 0.35), col, sz: rnd(2, 4) });
  }
}

/* ---------- 玩家（技能在 skills.js） ---------- */
function updPlayer(dt) {
  for (const k in P.cds) P.cds[k] = Math.max(0, P.cds[k] - dt);
  P.mp = Math.min(ST.mp, P.mp + ST.mpReg * dt);
  if (ST.regen) P.hp = Math.min(ST.hp, P.hp + ST.regen * dt);
  if (P.heal > 0) {
    const h = Math.min(P.heal, ((ST.hp * FLASK.heal) / FLASK.t) * dt);
    P.heal -= h;
    P.hp = Math.min(ST.hp, P.hp + h);
  }
  P.hurtT = Math.max(0, P.hurtT - dt);
  if (P.roll) {
    const r = P.roll;
    r.t += dt;
    const sp = (ROLL.dist / ROLL.t) * 1.6 * (1 - r.t / ROLL.t);
    moveBody(P, r.dx * sp * dt, r.dy * sp * dt);
    if (r.t >= ROLL.t) P.roll = null;
    return;
  }
  /* 面板打開時不吃移動鍵以外的東西；打字時（輸入框）不動 */
  let mx = (K.d || K.arrowright ? 1 : 0) - (K.a || K.arrowleft ? 1 : 0),
    my = (K.s || K.arrowdown ? 1 : 0) - (K.w || K.arrowup ? 1 : 0);
  const ml = Math.hypot(mx, my);
  if (ml) (mx /= ml), (my /= ml);
  P.mv = ml ? 1 : 0;
  P.mdx = mx;
  P.mdy = my;
  const spd = ST.spd * moveMul();
  if (P.act) {
    skillTick(P.act, dt, mx, my);
  } else moveBody(P, mx * spd * dt, my * spd * dt);
  if (P.vx || P.vy) {
    moveBody(P, P.vx * dt, P.vy * dt);
    const f = Math.exp(-dt * 10);
    P.vx *= f;
    P.vy *= f;
    if (Math.abs(P.vx) + Math.abs(P.vy) < 5) P.vx = P.vy = 0;
  }
  if (!P.act) {
    if (M.L) useSlot(0);
    else if (M.R) useSlot(1);
    const w = mouseWorld();
    if (G.scene === 'map' || P.mv)
      P.face = P.mv && G.scene === 'hide' ? Math.atan2(my, mx) : Math.atan2(w.y - P.y, w.x - P.x);
  }
}
/* 移動＋碰撞：地圖是牆（一格一格推出去），藏身處是邊界與擺設；分段走，快速衝刺也不會穿牆 */
function moveBody(o, dx, dy) {
  const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (o.r * 0.8)));
  for (let i = 0; i < n; i++) {
    o.x += dx / n;
    o.y += dy / n;
    if (G.tiles) pushTiles(o);
  }
  if (G.tiles) return;
  o.x = clamp(o.x, o.r + 60, G.W - o.r - 60);
  o.y = clamp(o.y, o.r + 100, G.H - o.r - 60);
  for (const k of G.props) {
    const ddx = o.x - k.x,
      ddy = o.y - k.y,
      d = Math.hypot(ddx, ddy),
      min = k.r + o.r;
    if (d < min && d > 0) {
      o.x = k.x + (ddx / d) * min;
      o.y = k.y + (ddy / d) * min;
    }
  }
}
function pushTiles(o) {
  const r = o.r;
  for (let ty = Math.floor((o.y - r) / TS); ty <= Math.floor((o.y + r) / TS); ty++)
    for (let tx = Math.floor((o.x - r) / TS); tx <= Math.floor((o.x + r) / TS); tx++) {
      if (!isWall(tx * TS + 1, ty * TS + 1)) continue;
      const nx = clamp(o.x, tx * TS, tx * TS + TS),
        ny = clamp(o.y, ty * TS, ty * TS + TS),
        ddx = o.x - nx,
        ddy = o.y - ny,
        d = Math.hypot(ddx, ddy);
      if (d >= r) continue;
      if (d > 0) {
        o.x = nx + (ddx / d) * r;
        o.y = ny + (ddy / d) * r;
      } else {
        /* 中心卡進牆裡：往最近的邊推 */
        const l = o.x - tx * TS,
          rr = tx * TS + TS - o.x,
          u = o.y - ty * TS,
          b = ty * TS + TS - o.y,
          mn = Math.min(l, rr, u, b);
        if (mn === l) o.x = tx * TS - r;
        else if (mn === rr) o.x = tx * TS + TS + r;
        else if (mn === u) o.y = ty * TS - r;
        else o.y = ty * TS + TS + r;
      }
    }
}
function doRoll() {
  if (P.roll || G.state !== 'play' || (P.cds.roll || 0) > 0) return;
  let dx = P.mdx || 0,
    dy = P.mdy || 0;
  if (!dx && !dy) (dx = Math.cos(P.face)), (dy = Math.sin(P.face));
  P.act = null;
  P.roll = { t: 0, dx, dy };
  const step = ascV(S, 'rapier.step');
  P.cds.roll = ROLL.cd * (step ? 0.6 : 1) + ROLL.t;
  if (step) P.stepT = G.t + ROLL.t + 2;
  P.iuntil = G.t + ROLL.iframe;
  sfx('roll');
}
function drinkFlask() {
  if (G.scene !== 'map' || G.state !== 'play') return;
  if (P.flask < 1) return hudWarn('藥水用完了：殺怪會補');
  P.flask -= 1;
  P.heal += ST.hp * FLASK.heal * (1 + ST.flask / 100);
  fx({ k: 'heal', x: P.x, y: P.y, dur: 0.5 });
  sfx('drink');
}
/* 受傷：見切 → 無敵 → 格擋 → 護甲（物理）／抗性（元素） */
function hurtPlayer(d, src, el = 'phys') {
  if (G.state !== 'play') return;
  if (P.roll && P.roll.t < ROLL.perfect) {
    if (!G.slow) {
      G.slow = ROLL.slow;
      P.critNext = 1;
      onMikiri();
      fx({ k: 'mikiri', x: P.x, y: P.y, dur: 0.6 });
      num(P.x, P.y - 70, 0, 'mikiri');
      sfx('mikiri');
    }
    return;
  }
  if (G.t < P.iuntil) return;
  if (Math.random() * 100 < ST.block) {
    num(P.x, P.y - 60, 0, 'block');
    sfx('block');
    coreBlock();
    onBlock();
    return;
  }
  if (el === 'phys') d *= 1 - ST.armor / (ST.armor + 10 * d + 1);
  else d *= 1 - ST.res[el] / 100;
  d = coreHurt(d);
  if (d <= 0) return;
  P.hp -= d;
  P.hurtT = 0.35;
  num(P.x, P.y - 60, d, 'hurt');
  shake(0.32);
  hitstop(0.05);
  sfx('hurt');
  if (src) {
    const a = angTo(src, P);
    P.vx += Math.cos(a) * 160;
    P.vy += Math.sin(a) * 160;
  }
  if (P.hp <= 0 && !tryUndying()) die();
}
/* 死亡（PoE 式）：地圖失敗、扣這一級 10% 經驗（不降級），裝備不會掉 */
function die() {
  P.hp = 0;
  G.state = 'dead';
  P.act = P.roll = null;
  G.lostXp = Math.min(S.xp, Math.round(xpNeed(S.lv) * 0.1));
  S.xp -= G.lostXp;
  save();
  sfx('die');
  hudState();
}

/* ---------- 打怪（打中 hitMob 在 skills.js） ---------- */
function aggroPack(m) {
  if (m.aggro) return;
  for (const o of G.mobs) if (o.pack === m.pack) o.aggro = 1;
}
function killMob(m) {
  m.hp = 0;
  G.kills++;
  const t = G.mapT;
  fx({ k: 'die', x: m.x, y: m.y, sp: m.D.sp, sz: m.sz, dur: 0.45, flip: m.x > P.x });
  sparks(m.x, m.y - m.sz * 0.4, rnd(0, TAU), 14, m.boss ? '#ff6b3d' : '#c9b8a8');
  P.flask = Math.min(FLASK.n, P.flask + FLASK.perKill * (m.elite ? 3 : m.boss ? 10 : 1));
  gainXp(m.D.xp * tierMul(t).hp * (m.elite ? 4 : 1));
  /* 掉落：裝備、金幣、地圖碎片（越高階越多） */
  const nItems = m.boss ? 4 : m.elite ? irnd(1, 2) : Math.random() < 0.13 ? 1 : 0;
  for (let i = 0; i < nItems; i++) {
    const it = dropItem(tierIlvl(t), m.boss ? 0.8 : m.elite ? 0.4 : 0);
    if (m.boss && i === 0 && it.r < 2) Object.assign(it, mkItem(it.b, it.L, 2), { id: it.id });
    dropAt(m.x, m.y, { it });
  }
  if (Math.random() < (m.boss || m.elite ? 1 : 0.4))
    dropAt(m.x, m.y, { gold: Math.round(rnd(2, 6) * (1 + t * 0.5) * (m.boss ? 12 : m.elite ? 3 : 1)) });
  const fr = m.boss
    ? 2 + Math.floor(t / 2)
    : m.elite
      ? Math.random() < 0.6
        ? 1
        : 0
      : Math.random() < 0.03 + t * 0.003
        ? 1
        : 0;
  if (fr) dropAt(m.x, m.y, { frag: fr });
  /* 技能寶石：小怪 2%、菁英 25%、王一定掉 */
  if (Math.random() < (m.boss ? 1 : m.elite ? 0.25 : 0.02)) dropAt(m.x, m.y, { it: dropGem(t) });
  coreKill(m);
  onKill();
  addProg(m);
  if (m.boss) bossDown(m);
}
function bossDown(m) {
  const first = G.mapT === S.maxT && S.maxT < TMAX;
  if (first) S.maxT++;
  if (G.mapT === TMAX && !S.t16) (S.t16 = 1), (G.first = 1);
  G.portal = { ...(floorNear(m.x, m.y, 150, 230, 40) || { x: m.x, y: m.y }), home: 1 };
  G.first = G.first || first;
  shake(0.7);
  hitstop(0.25);
  G.slow = 0.9;
  sfx('boss');
  hudWarn(first ? `打倒${m.D.n}！開放階級 ${S.maxT}。撿完走進藍色傳送門` : `打倒${m.D.n}！撿完走進藍色傳送門`);
  save();
}
function dropAt(x, y, o) {
  const a = rnd(0, TAU),
    s = rnd(30, 90);
  Object.assign(o, { x: x + Math.cos(a) * s, y: y + Math.sin(a) * s, sx: x, sy: y, t: 0 });
  if (!open(o.x, o.y, 10)) (o.x = x), (o.y = y);
  G.drops.push(o);
  if (o.it && o.it.r === 2) sfx('rare');
}
function gainXp(v) {
  if (S.lv >= LVMAX) return;
  S.xp += v;
  while (S.xp >= xpNeed(S.lv) && S.lv < LVMAX) {
    S.xp -= xpNeed(S.lv);
    S.lv++;
    ST = stats();
    P.hp = ST.hp;
    P.mp = ST.mp;
    fx({ k: 'lvup', x: P.x, y: P.y, dur: 1.1 });
    num(P.x, P.y - 90, S.lv, 'lv');
    sfx('lvup');
  }
}
/* 撿起來：金幣、碎片直接加；裝備放進格子背包 */
function pickup(d) {
  if (d.gold) {
    S.gold += d.gold;
    num(d.x, d.y - 20, d.gold, 'gold');
    sfx('coin');
  } else if (d.frag) {
    S.frag += d.frag;
    num(d.x, d.y - 20, d.frag, 'frag');
    sfx('pick');
  } else {
    if (!gridAuto(S.inv, d.it)) return hudWarn('背包滿了：回藏身處整理');
    sfx('pick');
    hudInv();
  }
  G.drops.splice(G.drops.indexOf(d), 1);
}
function pickNearest() {
  let best = null,
    bd = 110;
  for (const d of G.drops)
    if (d.it && dist(P, d) < bd) {
      bd = dist(P, d);
      best = d;
    }
  if (best) pickup(best);
  return !!best;
}
/* 藏身處的東西：走到旁邊按 F 或點一下 */
function nearProp() {
  return (G.props || []).find(p => dist(P, p) < p.r + 70);
}
function useProp(p) {
  if (!p) return false;
  if (dist(P, p) > p.r + 90) return hudWarn('走近一點'), true;
  if (p.k === 'device') openPanel('device');
  else if (p.k === 'stash') openPanel('stash');
  else if (p.k === 'asc') openPanel('asc');
  else hudWarn('市集之後開放');
  return true;
}
function interact() {
  if (G.scene === 'hide') {
    if (G.portal && dist(P, G.portal) < 80) return enterMap(G.portal.to);
    if (useProp(nearProp())) return;
  }
  pickNearest();
}

/* ---------- 怪物 AI ---------- */
function updMobs(dt) {
  for (const m of G.mobs) {
    if (m.hp <= 0) continue;
    m.flash = Math.max(0, m.flash - dt);
    m.sq = Math.max(0, m.sq - dt * 6);
    m.ph += dt * 8;
    if (mobTick(m, dt)) continue;
    if (m.vx || m.vy) {
      moveBody(m, m.vx * dt, m.vy * dt);
      const f = Math.exp(-dt * 9);
      m.vx *= f;
      m.vy *= f;
      if (Math.abs(m.vx) + Math.abs(m.vy) < 4) m.vx = m.vy = 0;
    }
    const dP = dist(m, P);
    if (!m.aggro) {
      if (dP < (m.boss ? 520 : 440)) aggroPack(m);
      else continue;
    }
    if (G.state !== 'play') continue;
    m.cd -= dt;
    if (m.boss) {
      bossAI(m, dt, dP);
      continue;
    }
    const D = m.D;
    if (m.st === 'idle' || m.st === 'move') {
      m.st = 'move';
      const a = angTo(m, P);
      let want = 1;
      if (D.ai === 'ranged') want = dP > 300 ? 1 : dP < 200 ? -1 : 0;
      else if (dP < D.reach * (D.ai === 'lunge' ? 0.9 : 0.85)) want = 0;
      let vx = Math.cos(a) * want,
        vy = Math.sin(a) * want;
      for (const o of G.mobs) {
        if (o === m || o.hp <= 0) continue;
        const dd = dist(m, o),
          mn = m.r + o.r + 6;
        if (dd < mn && dd > 0) {
          vx += ((m.x - o.x) / dd) * 0.9;
          vy += ((m.y - o.y) / dd) * 0.9;
        }
      }
      moveBody(m, vx * D.spd * dt, vy * D.spd * dt);
      m.mv = want !== 0;
      if (m.cd <= 0 && dP < D.reach + P.r + 4) {
        m.st = 'wind';
        m.t = D.wind * (m.elite ? 0.85 : 1);
        m.ang = angTo(m, P);
      }
    } else if (m.st === 'wind') {
      m.t -= dt;
      if (m.t <= 0) mobStrike(m);
    } else if (m.st === 'dash') {
      m.t -= dt;
      moveBody(m, Math.cos(m.ang) * 900 * dt, Math.sin(m.ang) * 900 * dt);
      if (!m.hitP && dist(m, P) < m.r + P.r + 6) {
        m.hitP = 1;
        hurtPlayer(m.dmg, m, m.el);
      }
      if (m.t <= 0) recover(m, 0.4);
    } else if (m.st === 'rec') {
      m.t -= dt;
      if (m.t <= 0) m.st = 'move';
    }
  }
  G.mobs = G.mobs.filter(m => m.hp > 0);
}
function recover(m, t) {
  m.st = 'rec';
  m.t = t;
  m.cd = m.D.cd * rnd(0.85, 1.15);
}
function mobStrike(m) {
  const D = m.D;
  if (D.ai === 'melee') {
    fx({ k: 'claw', x: m.x, y: m.y, ang: m.ang, r: D.reach + 10, dur: 0.15 });
    if (dist(m, P) < D.reach + P.r + 6 && angDiff(angTo(m, P), m.ang) < 1.3) hurtPlayer(m.dmg, m, m.el);
    recover(m, 0.3);
  } else if (D.ai === 'lunge') {
    m.st = 'dash';
    m.t = (D.reach / 900) * 1.05;
    m.hitP = 0;
  } else if (D.ai === 'ranged') {
    G.shots.push({
      foe: 1,
      x: m.x,
      y: m.y - m.sz * 0.5,
      vx: Math.cos(m.ang) * 330,
      vy: Math.sin(m.ang) * 330,
      r: 9,
      dmg: m.dmg,
      el: m.el,
      life: 1.6
    });
    recover(m, 0.3);
  } else if (D.ai === 'slam') {
    const x = m.x + Math.cos(m.ang) * 55,
      y = m.y + Math.sin(m.ang) * 55;
    fx({ k: 'ring', x, y, r: 95, dur: 0.3, col: '#ff8a5b' });
    shake(0.3);
    if (Math.hypot(P.x - x, P.y - y) < 95 + P.r) hurtPlayer(m.dmg, m, m.el);
    recover(m, 0.6);
  }
}
/* 王：追一下，然後衝撞／連續砸地／叫小怪／近身揮爪；半血以下更快 */
function bossAI(m, dt, dP) {
  const rage = m.hp < m.mhp / 2 ? 0.72 : 1;
  if (rage < 1 && !m.raged) {
    m.raged = 1;
    hudWarn(m.D.n + '發狂了！');
    shake(0.5);
  }
  if (m.st === 'idle' || m.st === 'move') {
    m.st = 'move';
    const a = angTo(m, P);
    if (dP > 90) moveBody(m, Math.cos(a) * m.D.spd * (rage < 1 ? 1.25 : 1) * dt, Math.sin(a) * m.D.spd * dt);
    m.mv = dP > 90;
    if (m.cd <= 0) {
      m.pat = pick(dP < 140 ? ['swipe', 'swipe', 'slam'] : ['charge', 'slam', 'charge', 'summon']);
      m.st = 'wind';
      m.ang = angTo(m, P);
      m.t = { swipe: 0.5, charge: 0.75, slam: 0.2, summon: 0.6 }[m.pat] * rage;
      if (m.pat === 'slam')
        for (let i = 0; i < 3; i++)
          G.tele.push({
            x: P.x + (i ? rnd(-130, 130) : 0),
            y: P.y + (i ? rnd(-130, 130) : 0),
            r: 95,
            t: 0,
            dur: (0.75 + i * 0.28) * rage,
            dmg: m.dmg * 1.1,
            src: m,
            el: m.el
          });
    }
  } else if (m.st === 'wind') {
    m.t -= dt;
    if (m.pat === 'charge' && m.t > 0.25) m.ang = angTo(m, P);
    if (m.t <= 0) {
      if (m.pat === 'swipe') {
        fx({ k: 'claw', x: m.x, y: m.y, ang: m.ang, r: 150, dur: 0.18, big: 1 });
        if (dP < 150 + P.r && angDiff(angTo(m, P), m.ang) < 1.4) hurtPlayer(m.dmg * 1.2, m, m.el);
        bossRec(m, 0.5, rage);
      } else if (m.pat === 'charge') {
        m.st = 'dash';
        m.t = 0.42;
        m.hitP = 0;
      } else if (m.pat === 'summon') {
        for (let i = 0; i < 4; i++)
          spawnMob(MOBS[m.D.call], m.x + rnd(-90, 90), m.y + rnd(-90, 90), 99, false).aggro = 1;
        fx({ k: 'ring', x: m.x, y: m.y, r: 120, dur: 0.35, col: '#b28dff' });
        bossRec(m, 0.6, rage);
      } else bossRec(m, 0.9, rage);
    }
  } else if (m.st === 'dash') {
    m.t -= dt;
    moveBody(m, Math.cos(m.ang) * 1150 * dt, Math.sin(m.ang) * 1150 * dt);
    if (Math.random() < 0.7) fx({ k: 'dust', x: m.x + rnd(-20, 20), y: m.y + rnd(-6, 6), dur: 0.4 });
    if (!m.hitP && dist(m, P) < m.r + P.r + 10) {
      m.hitP = 1;
      hurtPlayer(m.dmg * 1.4, m, m.el);
    }
    if (m.t <= 0) {
      shake(0.2);
      bossRec(m, 0.55, rage);
    }
  } else if (m.st === 'rec') {
    m.t -= dt;
    if (m.t <= 0) m.st = 'move';
  }
}
function bossRec(m, t, rage) {
  m.st = 'rec';
  m.t = t * rage;
  m.cd = rnd(0.5, 1.1) * rage;
}

/* ---------- 投射物、預警圈 ---------- */
function updShots(dt) {
  for (const s of G.shots) {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt;
    if (s.foe) {
      if (Math.hypot(P.x - s.x, P.y - 20 - s.y) < P.r + s.r) {
        hurtPlayer(s.dmg, s, s.el);
        s.life = 0;
      }
    } else
      for (const m of G.mobs) {
        if (m.hp <= 0 || s.hit.has(m)) continue;
        if (Math.hypot(m.x - s.x, m.y - m.sz * 0.4 - s.y) < m.r + s.r + 6) {
          s.hit.add(m);
          if (s.boom) {
            s.x = m.x;
            s.y = m.y - 18;
            s.life = 0;
            break;
          }
          hitMob(m, s.c, s.ang, 120 * s.c.kb, { a: s.a });
          if (s.pierce-- <= 0) {
            s.life = 0;
            break;
          }
        }
      }
    if (s.boom && s.life <= 0) boom(s);
    if (isWall(s.x, s.y)) {
      if (s.boom) boom(s);
      s.life = 0;
      sparks(s.x, s.y, Math.atan2(-s.vy, -s.vx), 4, '#aaa');
    }
  }
  G.shots = G.shots.filter(s => s.life > 0 && s.x > 0 && s.y > 0 && s.x < G.W && s.y < G.H);
  for (const t of G.tele) {
    t.t += dt;
    if (t.t >= t.dur && !t.done) {
      t.done = 1;
      fx({ k: 'ring', x: t.x, y: t.y, r: t.r, dur: 0.3, col: '#ff8a5b' });
      shake(0.2);
      sfx('slam');
      if (Math.hypot(P.x - t.x, P.y - t.y) < t.r + P.r) hurtPlayer(t.dmg, t.src, t.el);
    }
  }
  G.tele = G.tele.filter(t => !t.done);
}

/* ---------- 主迴圈 ---------- */
let last = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let rdt = Math.min(0.05, (now - last) / 1000 || 0);
  last = now;
  if (G.hs > 0) {
    G.hs -= rdt;
    rdt = 0;
  }
  let dt = rdt;
  if (G.slow > 0) {
    G.slow -= rdt;
    dt *= ROLL.slowScale;
  }
  if (dt > 0) {
    G.t += dt;
    updPlayer(dt);
    updMobs(dt);
    updShots(dt);
    updSkills(dt);
    /* 傳送門：地圖裡打倒王後的門＝回家 */
    if (G.portal && G.portal.home) {
      const on = dist(P, G.portal) < 40;
      if (on && G.state === 'play') (G.state = 'portal'), hudState();
      else if (!on && G.state === 'portal') (G.state = 'play'), hudState();
    }
    for (const d of G.drops.slice()) {
      d.t += dt;
      if ((d.gold || d.frag) && d.t > 0.4 && dist(P, d) < 150) {
        const f = Math.min(1, dt * 10);
        d.x = d.sx = d.x + (P.x - d.x) * f;
        d.y = d.sy = d.y + (P.y - d.y) * f;
        if (dist(P, d) < 24) pickup(d);
      }
    }
  }
  G.trauma = Math.max(0, G.trauma - rdt * 1.6);
  const w = mouseWorld(),
    tx = G.scene === 'hide' ? G.W / 2 + (P.x - G.W / 2) * 0.3 : P.x + (w.x - P.x) * 0.12,
    ty = G.scene === 'hide' ? G.H / 2 + (P.y - G.H / 2) * 0.3 : P.y + (w.y - P.y) * 0.12,
    f = 1 - Math.exp(-rdt * 9);
  G.cam.x += (tx - G.cam.x) * f;
  G.cam.y += (ty - G.cam.y) * f;
  for (const o of G.fx) o.t += dt || rdt * 0.25;
  G.fx = G.fx.filter(o => o.t < o.dur);
  for (const n of G.nums) n.t += rdt;
  G.nums = G.nums.filter(n => n.t < 0.9);
  draw();
  hudTick();
}
