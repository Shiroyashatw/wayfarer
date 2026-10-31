/* dungeonPOE · 技能寶石與核心：技能欄設定 slotCfg（輔助）、放技能 useSlot、出手 actHit、打怪 hitMob（傷害、暴擊、屬性）、
   召喚狼 allies、毒刃雨與隕石、寶石升級、五個職業的核心效果（架勢、盾勢、燃燒、印記、獸群） */
'use strict';

/* ---------- 技能欄 ---------- */
const NSLOT = 5;
const SLOTKEY = ['左鍵', '右鍵', 'Q', 'E', 'R'];
const supOK = (D, sp) => !SUPPORTS[sp.gem].need.length || SUPPORTS[sp.gem].need.some(t => D.tags.includes(t));
/* 一格技能的實際數值（技能等級＋輔助＋天賦冷卻縮減） */
function slotCfg(i) {
  const sl = S.skills[i],
    g = sl && sl.a;
  if (!g) return null;
  const D = SKILLS[g.gem],
    c = {
      i,
      k: g.gem,
      D,
      lv: g.lv,
      mult: D.m * Math.pow(1.06, g.lv - 1),
      aoe: 1,
      speed: 1,
      mp: D.mp,
      cd: (D.cd || 0) * (1 - ST.cdr / 100),
      crit: 0,
      critX: 0,
      leech: 0,
      proj: D.cnt || 1,
      pierce: D.pierce || 0,
      kb: 1,
      fireAdd: 0,
      wolves: D.cnt || 0,
      wolfM: 1
    };
  for (const sp of sl.s) {
    if (!sp || !supOK(D, sp)) continue;
    c.mult *= 1 + 0.01 * (sp.lv - 1);
    const k = sp.gem;
    if (k === 'multi') (c.proj += 2), (c.mult *= 0.8);
    else if (k === 'pierce') c.pierce += 3;
    else if (k === 'area') c.aoe *= 1.4;
    else if (k === 'fury') (c.mult *= 1.35), (c.mp *= 1.4);
    else if (k === 'haste') c.speed *= 1.25;
    else if (k === 'crit') (c.crit += 10), (c.critX += 40);
    else if (k === 'leech') c.leech += 0.03;
    else if (k === 'cdr') c.cd *= 0.65;
    else if (k === 'fireadd') c.fireAdd += 0.25;
    else if (k === 'heavy') (c.kb *= 2), (c.mult *= 1.15);
    else if (k === 'pack') (c.wolves += 1), (c.wolfM *= 1.3);
  }
  c.mp = Math.round(c.mp);
  return c;
}
/* 按下技能鍵 */
function useSlot(i) {
  if (P.act || P.roll || G.state !== 'play' || G.scene !== 'map') return false;
  const c = slotCfg(i);
  if (!c) return false;
  if ((P.cds['s' + i] || 0) > 0) return false;
  if (P.mp < c.mp) return hudWarn('魔力不足'), false;
  P.mp -= c.mp;
  if (c.cd) P.cds['s' + i] = c.cd;
  const w = mouseWorld(),
    ang = Math.atan2(w.y - P.y, w.x - P.x),
    D = c.D;
  P.face = ang;
  const a = (P.act = {
    k: c.k,
    c,
    t: 0,
    dur: D.t / ST.asM / c.speed,
    ang,
    hits: c.k === 'swallow' ? [0.3, 0.7] : [0.42],
    n: 0,
    tx: w.x,
    ty: w.y
  });
  /* 架勢滿了：這次出手是居合 */
  if (hasCls(S, 'ronin') && P.stance >= stanceNeed()) {
    a.iai = 1;
    P.stance = 0;
    fx({ k: 'mikiri', x: P.x, y: P.y, dur: 0.4 });
  }
  sfx(D.tags.includes('spell') ? 'cast' : D.tags.includes('proj') ? 'throw' : 'swing');
  if (c.k === 'iai') {
    const d = Math.min(D.dist, Math.hypot(w.x - P.x, w.y - P.y));
    Object.assign(a, { sx: P.x, sy: P.y, d, hit: new Set(), hits: [] });
    P.iuntil = G.t + a.dur + 0.05;
  }
  /* 馴獸師：每放 6 次技能叫一隻狼 */
  if (hasCls(S, 'tamer') && ++P.calls % 6 === 0) callWolf('cls');
  return true;
}
/* 每格畫面：出手中的動作 */
function skillTick(a, dt, mx, my) {
  a.t += dt;
  if (a.k === 'iai') {
    const f = Math.min(1, a.t / a.dur),
      e = 1 - Math.pow(1 - f, 3);
    moveBody(P, a.sx + Math.cos(a.ang) * a.d * e - P.x, a.sy + Math.sin(a.ang) * a.d * e - P.y);
    if (Math.random() < 0.8) fx({ k: 'ghost', x: P.x, y: P.y, dur: 0.22, flip: Math.cos(a.ang) < 0 });
    for (const m of G.mobs)
      if (m.hp > 0 && !a.hit.has(m) && dist(P, m) < m.r + 40) {
        a.hit.add(m);
        hitMob(m, a.c, a.ang + Math.PI / 2, 220, { a });
      }
  } else {
    moveBody(P, mx * ST.spd * 0.35 * dt, my * ST.spd * 0.35 * dt);
    while (a.n < a.hits.length && a.t >= a.dur * a.hits[a.n]) actHit(a, a.n++);
  }
  if (a.t >= a.dur) {
    if (a.k === 'iai') endAct(a);
    P.act = null;
  }
}
/* 出手結束：架勢、燕返、明鏡 */
function endAct(a) {
  if (!a.any) return;
  if (a.iai) {
    const sw = coreV(S, 'ronin', 'swallow'),
      mi = coreV(S, 'ronin', 'mirror');
    if (mi) P.hp = Math.min(ST.hp, P.hp + (ST.hp * mi) / 100);
    if (sw && !a.echo && a.k !== 'iai') actHit({ ...a, echo: 1, mul: sw, iai: 0 }, 0);
  } else if (hasCls(S, 'ronin')) P.stance = Math.min(stanceNeed(), P.stance + 1);
}
const stanceNeed = () => coreV(S, 'ronin', 'gale') || 5;

/* ---------- 各技能出手 ---------- */
function actHit(a, idx) {
  const c = a.c,
    D = c.D,
    R = (D.r || 0) * ST.aoeM * c.aoe;
  const hitArc = (ang, arc, r, kb, o) => {
    let n = 0;
    for (const m of G.mobs) {
      if (m.hp <= 0) continue;
      const dd = dist(P, m);
      if (dd < r + m.r && angDiff(angTo(P, m), ang) < arc / 2 + m.r / Math.max(dd, 1))
        hitMob(m, c, angTo(P, m), kb, { a, ...o }), n++;
    }
    return n;
  };
  if (a.k === 'slash' || a.k === 'swallow') {
    const ang = a.k === 'swallow' && idx === 1 ? a.ang + 0.25 : a.ang;
    P.x += Math.cos(ang) * 10;
    P.y += Math.sin(ang) * 10;
    fx({ k: 'slash', x: P.x, y: P.y, ang, r: R, arc: D.arc, dur: 0.18, flipArc: idx === 1 });
    const n = hitArc(ang, D.arc, R, 170 * c.kb);
    if (D.gain && n) P.mp = Math.min(ST.mp, P.mp + D.gain * n);
  } else if (a.k === 'quake') {
    fx({ k: 'quake', x: P.x, y: P.y, ang: a.ang, r: R, arc: D.arc, dur: 0.35 });
    shake(0.3);
    sfx('slam');
    hitArc(a.ang, D.arc, R, 120 * c.kb, { stun: D.stun });
  } else if (a.k === 'whirl') {
    fx({ k: 'ring', x: P.x, y: P.y, r: R, dur: 0.28 });
    shake(0.25);
    for (const m of G.mobs) if (m.hp > 0 && dist(P, m) < R + m.r) hitMob(m, c, angTo(P, m), 320 * c.kb, { a });
  } else if (a.k === 'nova') {
    fx({ k: 'ring', x: P.x, y: P.y, r: R, dur: 0.32, col: '#ff8a4c' });
    shake(0.2);
    for (const m of G.mobs) if (m.hp > 0 && dist(P, m) < R + m.r) hitMob(m, c, angTo(P, m), 140 * c.kb, { a });
  } else if (a.k === 'blade' || a.k === 'fireball') {
    const n = c.proj,
      spread = 0.18;
    for (let i = 0; i < n; i++) {
      const g = a.ang + (i - (n - 1) / 2) * spread;
      shoot(g, D.spd, c, a, a.k === 'fireball' ? { boom: (D.r || 70) * ST.aoeM * c.aoe, fire: 1, life: 1.1 } : {});
    }
  } else if (a.k === 'storm') {
    fx({ k: 'ring', x: P.x, y: P.y, r: 90, dur: 0.3, col: '#ffb3c8' });
    shake(0.15);
    const n = D.cnt + (c.proj - 1) * 2;
    for (let i = 0; i < n; i++) shoot(a.ang + (i / n) * TAU, D.spd, c, a, { pink: 1, life: 0.8 });
  } else if (a.k === 'venom') {
    G.pools.push({ x: a.tx, y: a.ty, r: R, t: 0, dur: D.dur, tick: 0, c, a });
    sfx('cast');
  } else if (a.k === 'meteor') {
    G.meteors.push({ x: a.tx, y: a.ty, r: R, t: 0, dur: D.delay, c, a });
  } else if (a.k === 'wolf') {
    G.allies = G.allies.filter(w => w.src !== 'gem');
    for (let i = 0; i < c.wolves; i++) callWolf('gem', c);
    fx({ k: 'ring', x: P.x, y: P.y, r: 90, dur: 0.35, col: '#9df29d' });
  }
  if (idx === a.hits.length - 1 && a.k !== 'iai' && !a.echo) endAct(a);
}
function shoot(ang, spd, c, a, o) {
  G.shots.push({
    x: P.x + Math.cos(ang) * 20,
    y: P.y - 18 + Math.sin(ang) * 20,
    vx: Math.cos(ang) * spd,
    vy: Math.sin(ang) * spd,
    ang,
    r: 10,
    pierce: c.pierce,
    c,
    a,
    hit: new Set(),
    life: 0.9,
    ...o
  });
}
/* 火球爆炸 */
function boom(s) {
  if (s.done) return;
  s.done = 1;
  fx({ k: 'ring', x: s.x, y: s.y + 18, r: s.boom, dur: 0.3, col: '#ff8a4c' });
  shake(0.12);
  sfx('slam');
  for (const m of G.mobs)
    if (m.hp > 0 && Math.hypot(m.x - s.x, m.y - 18 - s.y) < s.boom + m.r)
      hitMob(m, s.c, angTo(s, m), 120 * s.c.kb, { a: s.a });
}

/* ---------- 傷害 ---------- */
/* 一下的傷害：武器的物理＋附加元素；有屬性的技能全部轉成那個屬性；怪物抗自己的屬性 */
function rollDmg(c, m, o = {}) {
  let el = c.D.el,
    d = rnd(ST.dmg[0], ST.dmg[1]),
    ele = 0,
    big = 'phys',
    bigV = d;
  for (const k in ST.add) {
    const [lo, hi] = ST.add[k];
    if (!hi) continue;
    const v = rnd(lo, hi);
    ele += v;
    if (v > bigV) (bigV = v), (big = k);
  }
  if (el) (ele += d), (d = 0), (big = el);
  let tot = (d + ele * (1 + ST.eleP / 100)) * (o.mult || c.mult) * (1 + ST.dmgA / 100) * (1 + 0.02 * (P.guard || 0));
  tot += tot * c.fireAdd;
  if (m && m.el === big && big !== 'phys') tot *= 0.6;
  let crit = o.crit || P.critNext || Math.random() * 100 < ST.crit + c.crit;
  if (crit) tot *= ST.critM + c.critX / 100 + (P.critNext ? 0.5 : 0);
  if (!o.keep) P.critNext = 0;
  return { d: tot, crit, el: big };
}
/* 打中一隻怪：o.a 出手、o.quiet 不停頓不震（狼、毒、反擊）、o.stun 暈眩、o.mult 改倍率 */
function hitMob(m, c, ang, kb, o = {}) {
  const a = o.a || {};
  let mult = (o.mult || c.mult) * (a.mul || 1),
    crit = false;
  /* 居合：傷害 ×3（斬鐵 ×4、×5）、必定暴擊 */
  if (a.iai) (mult *= coreV(S, 'ronin', 'iron') || 3), (crit = true);
  /* 刺客的印記：滿了就消耗 */
  if (hasCls(S, 'assassin') && !o.quiet) {
    const need = coreV(S, 'assassin', 'chain') || 8;
    if ((m.mark || 0) >= need) {
      crit = true;
      mult *= 1 + 0.05 * m.mark;
      const ex = coreV(S, 'assassin', 'exec');
      if (ex && m.hp < (m.mhp * ex) / 100) mult *= 2;
      const sh = coreV(S, 'assassin', 'shadow');
      if (sh) P.shadowT = 2;
      m.mark = 0;
      fx({ k: 'ring', x: m.x, y: m.y, r: 50, dur: 0.25, col: '#c38bff' });
    } else m.mark = (m.mark || 0) + 1;
  }
  const r = rollDmg(c, m, { mult, crit });
  m.hp -= r.d;
  if (a) a.any = 1;
  m.flash = 0.09;
  m.sq = 1;
  if (o.stun && !m.boss) m.stun = o.stun;
  if (!m.boss && kb) {
    const res = m.elite ? 0.5 : m.D.ai === 'slam' ? 0.4 : 1;
    m.vx += Math.cos(ang) * kb * res * (r.crit ? 1.5 : 1);
    m.vy += Math.sin(ang) * kb * res * (r.crit ? 1.5 : 1);
  }
  aggroPack(m);
  num(m.x, m.y - m.sz, r.d, r.crit ? 'crit' : r.el);
  if (!o.quiet) {
    sparks(m.x, m.y - m.sz * 0.4, ang, r.crit ? 10 : 5, r.crit ? '#ffd166' : ELC[r.el]);
    hitstop(r.crit ? 0.085 : 0.04);
    shake(r.crit ? 0.22 : 0.08);
    sfx(r.crit ? 'crit' : 'hit');
    if (ST.loh) P.hp = Math.min(ST.hp, P.hp + ST.loh);
  }
  if (c.leech) P.hp = Math.min(ST.hp, P.hp + r.d * c.leech);
  if (hasCls(S, 'pyro') && !o.noBurn) addBurn(m, r.d, 1 + coreV(S, 'pyro', 'kindle'));
  if (m.hp > 0 && m.burn && !m.boss) {
    const end = coreV(S, 'pyro', 'end');
    if (end && m.hp < (m.mhp * end) / 100) m.hp = 0;
  }
  if (m.hp <= 0) killMob(m);
}

/* ---------- 火法師：燃燒 ---------- */
function addBurn(m, hit, n) {
  const b = m.burn || (m.burn = { n: 0, per: 0, t: 0 });
  b.n = Math.min(10, b.n + n);
  b.per = Math.max(b.per, hit * 0.08);
  b.t = 4;
  const bu = coreV(S, 'pyro', 'burst');
  if (bu && b.n >= 10) {
    /* 爆燃：周圍受到燃燒 v 秒份的傷害 */
    const dmg = b.per * 10 * bu;
    m.burn = null;
    fx({ k: 'ring', x: m.x, y: m.y, r: 110, dur: 0.3, col: '#ff6b3d' });
    shake(0.15);
    for (const o of G.mobs) if (o.hp > 0 && dist(o, m) < 110 + o.r) dotHit(o, dmg, 'fire');
  }
}
/* 不吃暴擊的傷害（燃燒、爆燃、毒） */
function dotHit(m, d, el, quiet) {
  if (m.el === el) d *= 0.6;
  m.hp -= d;
  if (!quiet) num(m.x, m.y - m.sz, d, el);
  aggroPack(m);
  if (m.hp <= 0) killMob(m);
}
/* 怪物每格：燃燒、暈眩；回傳 true＝這格不行動 */
function mobTick(m, dt) {
  if (m.burn) {
    const b = m.burn,
      d = b.per * b.n * dt;
    m.hp -= d;
    m.dotAcc = (m.dotAcc || 0) + d;
    b.t -= dt;
    if (b.t <= 0) m.burn = null;
    if ((m.dotT = (m.dotT || 0) + dt) > 0.5) {
      if (m.dotAcc >= 1) num(m.x, m.y - m.sz, m.dotAcc, 'fire');
      m.dotT = m.dotAcc = 0;
    }
    if (m.hp <= 0) return killMob(m), true;
  }
  if (m.stun > 0) return (m.stun -= dt), true;
  return false;
}
/* 怪物死掉：星火、寶石經驗 */
function coreKill(m) {
  const sp = coreV(S, 'pyro', 'spark');
  if (sp && m.burn) {
    const near = G.mobs
      .filter(o => o.hp > 0 && o !== m)
      .sort((a, b) => dist(a, m) - dist(b, m))
      .slice(0, 2);
    for (const o of near)
      if (dist(o, m) < 220) addBurn(o, m.burn.per / 0.08, Math.max(1, Math.round((m.burn.n * sp) / 100)));
  }
  gemXp(m.D.xp * tierMul(G.mapT).hp * (m.elite ? 4 : 1));
}
/* 裝著的寶石一起拿經驗；等級不能超過角色等級 */
function gemXp(v) {
  for (const sl of S.skills)
    for (const g of [sl.a, ...sl.s]) {
      if (!g || g.lv >= Math.min(GEM_MAX, S.lv)) continue;
      g.xp += v;
      if (g.xp >= gemNeed(g.lv)) {
        g.xp = 0;
        g.lv++;
        hudWarn(`${gemOf(g).n} 升到 Lv ${g.lv}`);
        sfx('lvup');
      }
    }
}

/* ---------- 騎士：護盾與盾勢 ---------- */
const wardMax = () => (hasCls(S, 'knight') ? ST.hp * (0.1 + coreV(S, 'knight', 'wall') / 100) : 0);
/* 受傷前：減傷（不動、守護獸）、護盾吸收、反擊；回傳剩下的傷害 */
function coreHurt(d) {
  let red =
    Math.min(40, (P.guard || 0) * coreV(S, 'knight', 'firm')) +
    Math.min(40, G.allies.length * coreV(S, 'tamer', 'guard'));
  d *= 1 - Math.min(60, red) / 100;
  P.lastHurt = G.t;
  if (P.ward > 0) {
    const ab = Math.min(P.ward, d);
    P.ward -= ab;
    d -= ab;
    P.wardAbs += ab;
    while (P.wardAbs >= 20) (P.wardAbs -= 20), (P.guard = Math.min(20, P.guard + 1));
  }
  const co = coreV(S, 'knight', 'counter');
  if (co && P.guard) aoeHit(P.x, P.y, 120, (P.guard * co) / 100, '#9ad1ff');
  return d;
}
function coreBlock() {
  const b = coreV(S, 'knight', 'bash');
  if (b) aoeHit(P.x, P.y, 110, b, '#cfd8e3');
}
/* 以玩家為中心的範圍傷害（反擊、盾擊），用左鍵技能的數值 */
function aoeHit(x, y, r, mult, col) {
  const c = slotCfg(0) || { D: SKILLS.slash, mult: 1, crit: 0, critX: 0, fireAdd: 0, kb: 1 };
  fx({ k: 'ring', x, y, r, dur: 0.25, col });
  for (const m of G.mobs)
    if (m.hp > 0 && Math.hypot(m.x - x, m.y - y) < r + m.r)
      hitMob(m, c, Math.atan2(m.y - y, m.x - x), 160, { quiet: 1, mult });
}

/* ---------- 馴獸師與召喚戰狼：狼跟著你、咬最近的怪 ---------- */
function wolfCap() {
  return coreV(S, 'tamer', 'wild') || 3;
}
function callWolf(src, c) {
  if (src === 'cls' && G.allies.filter(w => w.src === 'cls').length >= wolfCap()) return;
  const p = floorNear(P.x, P.y, 30, 80, 14) || { x: P.x, y: P.y };
  G.allies.push({ src, x: p.x, y: p.y, vx: 0, vy: 0, r: 14, cd: rnd(0.2, 0.6), c, ph: Math.random() * TAU });
}
function updAllies(dt) {
  for (const w of G.allies) {
    w.cd -= dt;
    w.ph += dt * 10;
    let t = null,
      bd = 420;
    for (const m of G.mobs)
      if (m.hp > 0 && dist(m, P) < 500 && dist(m, w) < bd) {
        bd = dist(m, w);
        t = m;
      }
    const goal = t || { x: P.x - 40 + (w.ph % 3) * 20, y: P.y + 30 },
      d = dist(w, goal);
    w.mv = d > (t ? t.r + 20 : 50);
    if (w.mv) {
      const a = angTo(w, goal),
        sp = d > 300 && !t ? 420 : 280;
      moveBody(w, Math.cos(a) * sp * dt, Math.sin(a) * sp * dt);
      w.face = Math.cos(a);
    }
    if (t && d < t.r + 30 && w.cd <= 0) {
      w.cd = 0.8;
      fx({ k: 'claw', x: w.x, y: w.y, ang: angTo(w, t), r: 34, dur: 0.12 });
      const c = w.c || slotCfg(0) || { D: SKILLS.slash, mult: 1, crit: 0, critX: 0, fireAdd: 0, kb: 1 },
        mult = w.src === 'gem' ? c.mult * c.wolfM : 0.4 * (1 + coreV(S, 'tamer', 'pack') / 100);
      hitMob(t, c, angTo(w, t), 60, { quiet: 1, mult, noBurn: w.src === 'gem' });
    }
    if (dist(w, P) > 900) (w.x = P.x), (w.y = P.y);
  }
}

/* ---------- 毒刃雨、隕石 ---------- */
function updPools(dt) {
  for (const p of G.pools) {
    p.t += dt;
    p.tick -= dt;
    if (p.tick <= 0) {
      p.tick = 0.5;
      for (const m of G.mobs)
        if (m.hp > 0 && Math.hypot(m.x - p.x, m.y - p.y) < p.r + m.r)
          hitMob(m, p.c, 0, 0, { quiet: 1, a: p.a, mult: p.c.mult });
    }
  }
  G.pools = G.pools.filter(p => p.t < p.dur);
  for (const o of G.meteors) {
    o.t += dt;
    if (o.t >= o.dur && !o.done) {
      o.done = 1;
      fx({ k: 'ring', x: o.x, y: o.y, r: o.r, dur: 0.4, col: '#ff6b3d' });
      shake(0.45);
      sfx('slam');
      for (const m of G.mobs)
        if (m.hp > 0 && Math.hypot(m.x - o.x, m.y - o.y) < o.r + m.r)
          hitMob(m, o.c, Math.atan2(m.y - o.y, m.x - o.x), 260, { a: o.a });
    }
  }
  G.meteors = G.meteors.filter(o => !o.done);
}
function updSkills(dt) {
  if (P.shadowT > 0) P.shadowT -= dt;
  /* 騎士的護盾：4 秒沒受傷就充滿 */
  const wm = wardMax();
  if (wm && G.t - (P.lastHurt || -9) > 4) P.ward = wm;
  updAllies(dt);
  updPools(dt);
}
/* 進地圖、回藏身處：重設核心的狀態；馴獸師帶狼 */
function skillsEnter() {
  Object.assign(P, { stance: 0, guard: 0, ward: wardMax(), wardAbs: 0, calls: 0, shadowT: 0, lastHurt: -9 });
  Object.assign(G, { allies: [], pools: [], meteors: [] });
  if (G.scene === 'map' && hasCls(S, 'tamer')) for (let i = 1 + coreV(S, 'tamer', 'alpha'); i > 0; i--) callWolf('cls');
}
