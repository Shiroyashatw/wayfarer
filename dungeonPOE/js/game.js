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
    v: 10,
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
  rocks: [],
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
    rocks: [],
    props: [],
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
    { k: 'market', n: '市集（之後開放）', x: 770, y: 330, r: 34 }
  ];
  newPlayer(480, 470);
  P.hp = ST.hp;
  P.mp = ST.mp;
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
function enterMap(t) {
  const W = 3400,
    H = 2300;
  resetWorld(W, H);
  G.scene = 'map';
  G.mapT = t;
  newPlayer(220, H / 2);
  for (let i = 0; i < 46; i++) {
    const r = rnd(26, 80),
      x = rnd(r, W - r),
      y = rnd(r, H - r);
    if (Math.hypot(x - P.x, y - P.y) < 320 || Math.hypot(x - (W - 340), y - H / 2) < 380) continue;
    G.rocks.push({ x, y, r });
  }
  const spots = [];
  for (let tries = 0; spots.length < 15 && tries < 600; tries++) {
    const p = { x: rnd(500, W - 650), y: rnd(160, H - 160) };
    if (Math.hypot(p.x - P.x, p.y - P.y) < 550 || spots.some(q => dist(p, q) < 330) || hitRock(p, 60)) continue;
    spots.push(p);
  }
  spots.forEach((p, i) => {
    const kinds = pick(PACKS),
      elite = i % 4 === 3;
    kinds.forEach((k, j) => spawnMob(MOBS[k], p.x + rnd(-70, 70), p.y + rnd(-70, 70), i, elite && j === 0));
  });
  const b = spawnMob(bossOf(t), W - 340, H / 2, 99, false);
  b.boss = 1;
  sfx('portal');
  hudState();
}
/* 回藏身處（地圖就結束了） */
function goHome() {
  if (G.scene !== 'map') return;
  save();
  enterHideout();
}
function hitRock(p, r) {
  return G.rocks.some(k => Math.hypot(p.x - k.x, p.y - k.y) < k.r + r);
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

/* ---------- 玩家 ---------- */
/* 一下的傷害：物理扣怪物的物理減傷，元素看怪物抗性 */
function rollDmg(mult, m) {
  let d = rnd(ST.dmg[0], ST.dmg[1]),
    big = 'phys',
    bigV = d;
  for (const k in ST.add) {
    const [a, b] = ST.add[k];
    if (!b) continue;
    let v = rnd(a, b);
    if (m && m.el === k) v *= 0.6;
    d += v;
    if (v > bigV) (bigV = v), (big = k);
  }
  d *= mult;
  const crit = P.critNext || Math.random() * 100 < ST.crit;
  if (crit) d *= ST.critM + (P.critNext ? 0.5 : 0);
  P.critNext = 0;
  return { d, crit, el: big };
}
function useSkill(k) {
  const D = SKILLS[k];
  if (P.act || P.roll || G.state !== 'play' || G.scene !== 'map') return false;
  if ((P.cds[k] || 0) > 0) return false;
  if (P.mp < D.mp) {
    hudWarn('魔力不足');
    return false;
  }
  P.mp -= D.mp;
  if (D.cd) P.cds[k] = D.cd;
  const w = mouseWorld(),
    ang = Math.atan2(w.y - P.y, w.x - P.x);
  P.face = ang;
  P.act = { k, t: 0, dur: D.t / ST.asM, ang, done: 0 };
  sfx(k === 'blade' ? 'throw' : 'swing');
  if (k === 'iai') {
    const d = Math.min(D.dist, Math.hypot(w.x - P.x, w.y - P.y));
    Object.assign(P.act, { sx: P.x, sy: P.y, d, hit: new Set() });
    P.iuntil = G.t + D.t / ST.asM + 0.05;
  }
  return true;
}
function actHit(a) {
  const D = SKILLS[a.k];
  if (a.k === 'slash') {
    P.x += Math.cos(a.ang) * 10;
    P.y += Math.sin(a.ang) * 10;
    const R = D.r * ST.aoeM;
    fx({ k: 'slash', x: P.x, y: P.y, ang: a.ang, r: R, arc: D.arc, dur: 0.18 });
    let n = 0;
    for (const m of G.mobs) {
      if (m.hp <= 0) continue;
      const dd = dist(P, m);
      if (dd < R + m.r && angDiff(angTo(P, m), a.ang) < D.arc / 2 + m.r / Math.max(dd, 1)) {
        hitMob(m, D.m, angTo(P, m), 170);
        n++;
      }
    }
    if (n) P.mp = Math.min(ST.mp, P.mp + D.gain * n);
  } else if (a.k === 'blade') {
    G.shots.push({
      x: P.x + Math.cos(a.ang) * 20,
      y: P.y - 18 + Math.sin(a.ang) * 20,
      vx: Math.cos(a.ang) * D.spd,
      vy: Math.sin(a.ang) * D.spd,
      ang: a.ang,
      r: 10,
      pierce: D.pierce,
      m: D.m,
      hit: new Set(),
      life: 0.9
    });
  } else if (a.k === 'whirl') {
    const R = D.r * ST.aoeM;
    fx({ k: 'ring', x: P.x, y: P.y, r: R, dur: 0.28 });
    shake(0.25);
    for (const m of G.mobs) if (m.hp > 0 && dist(P, m) < R + m.r) hitMob(m, D.m, angTo(P, m), 320);
  }
}
function updPlayer(dt) {
  for (const k in P.cds) P.cds[k] = Math.max(0, P.cds[k] - dt);
  P.mp = Math.min(ST.mp, P.mp + HERO.mpReg * dt);
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
  if (P.act) {
    const a = P.act;
    a.t += dt;
    if (a.k === 'iai') {
      const f = Math.min(1, a.t / a.dur),
        e = 1 - Math.pow(1 - f, 3);
      moveBody(P, a.sx + Math.cos(a.ang) * a.d * e - P.x, a.sy + Math.sin(a.ang) * a.d * e - P.y);
      if (Math.random() < 0.8) fx({ k: 'ghost', x: P.x, y: P.y, dur: 0.22, flip: Math.cos(a.ang) < 0 });
      for (const m of G.mobs)
        if (m.hp > 0 && !a.hit.has(m) && dist(P, m) < m.r + 40) {
          a.hit.add(m);
          hitMob(m, SKILLS.iai.m, a.ang + Math.PI / 2, 220);
        }
    } else {
      moveBody(P, mx * ST.spd * 0.35 * dt, my * ST.spd * 0.35 * dt);
      if (!a.done && a.t >= a.dur * 0.42) {
        a.done = 1;
        actHit(a);
      }
    }
    if (a.t >= a.dur) P.act = null;
  } else moveBody(P, mx * ST.spd * dt, my * ST.spd * dt);
  if (P.vx || P.vy) {
    moveBody(P, P.vx * dt, P.vy * dt);
    const f = Math.exp(-dt * 10);
    P.vx *= f;
    P.vy *= f;
    if (Math.abs(P.vx) + Math.abs(P.vy) < 5) P.vx = P.vy = 0;
  }
  if (!P.act) {
    if (M.L) useSkill('slash');
    else if (M.R) useSkill('blade');
    const w = mouseWorld();
    if (G.scene === 'map' || P.mv)
      P.face = P.mv && G.scene === 'hide' ? Math.atan2(my, mx) : Math.atan2(w.y - P.y, w.x - P.x);
  }
}
function moveBody(o, dx, dy) {
  const pad = G.scene === 'hide' ? 60 : 0;
  o.x = clamp(o.x + dx, o.r + pad, G.W - o.r - pad);
  o.y = clamp(o.y + dy, o.r + pad + (G.scene === 'hide' ? 40 : 0), G.H - o.r - pad);
  if (o.D && o.D.fly) return;
  for (const k of G.rocks.concat(G.props || [])) {
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
function doRoll() {
  if (P.roll || G.state !== 'play' || (P.cds.roll || 0) > 0) return;
  let dx = P.mdx || 0,
    dy = P.mdy || 0;
  if (!dx && !dy) (dx = Math.cos(P.face)), (dy = Math.sin(P.face));
  P.act = null;
  P.roll = { t: 0, dx, dy };
  P.cds.roll = ROLL.cd + ROLL.t;
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
    return;
  }
  if (el === 'phys') d *= 1 - ST.armor / (ST.armor + 10 * d + 1);
  else d *= 1 - ST.res[el] / 100;
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
  if (P.hp <= 0) die();
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

/* ---------- 打怪 ---------- */
function hitMob(m, mult, ang, kb) {
  const { d, crit, el } = rollDmg(mult, m);
  m.hp -= d;
  m.flash = 0.09;
  m.sq = 1;
  if (!m.boss) {
    const res = m.elite ? 0.5 : m.D.ai === 'slam' ? 0.4 : 1;
    m.vx += Math.cos(ang) * kb * res * (crit ? 1.5 : 1);
    m.vy += Math.sin(ang) * kb * res * (crit ? 1.5 : 1);
  }
  aggroPack(m);
  num(m.x, m.y - m.sz, d, crit ? 'crit' : el);
  sparks(m.x, m.y - m.sz * 0.4, ang, crit ? 10 : 5, crit ? '#ffd166' : ELC[el]);
  hitstop(crit ? 0.085 : 0.04);
  shake(crit ? 0.22 : 0.08);
  sfx(crit ? 'crit' : 'hit');
  if (ST.loh) P.hp = Math.min(ST.hp, P.hp + ST.loh);
  if (m.hp <= 0) killMob(m);
}
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
  if (m.boss) bossDown(m);
}
function bossDown(m) {
  const first = G.mapT === S.maxT && S.maxT < TMAX;
  if (first) S.maxT++;
  G.portal = { x: Math.min(G.W - 60, m.x + 190), y: m.y, home: 1 };
  G.state = 'clear';
  G.first = first;
  shake(0.7);
  hitstop(0.25);
  G.slow = 0.9;
  sfx('boss');
  save();
  setTimeout(hudState, 900);
}
function dropAt(x, y, o) {
  const a = rnd(0, TAU),
    s = rnd(30, 90);
  Object.assign(o, { x: x + Math.cos(a) * s, y: y + Math.sin(a) * s, sx: x, sy: y, t: 0 });
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
          hitMob(m, s.m, s.ang, 120);
          if (s.pierce-- <= 0) {
            s.life = 0;
            break;
          }
        }
      }
    if (hitRock(s, 0)) {
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
    /* 傳送門：地圖裡打倒王後的門＝回家 */
    if (G.portal && G.portal.home && G.state === 'play' && dist(P, G.portal) < 36) return goHome();
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
