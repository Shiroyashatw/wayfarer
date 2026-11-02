/* dungeonPOE · 技能寶石與核心：技能欄設定 slotCfg（輔助）、放技能 useSlot、出手 actHit、打怪 hitMob（傷害、暴擊、屬性）、
   召喚狼 allies、毒刃雨與隕石、寶石升級、五個職業的核心效果（架勢、盾勢、燃燒、印記、獸群） */
'use strict';

/* ---------- 技能欄 ---------- */
const NSLOT = 5;
const SLOTKEY = ['左鍵', '右鍵', 'Q', 'E', 'R'];
const supOK = (D, sp) => {
  const U = SUPPORTS[sp.gem];
  if (U.conv && (D.unit || D.tags.includes('move') || D.tags.includes('minion'))) return false;
  return !U.need.length || U.need.some(t => D.tags.includes(t));
};
/* 一格技能的實際數值（技能等級＋輔助＋天賦冷卻縮減） */
function slotCfg(i) {
  const sl = S.skills[i],
    g = sl && sl.a;
  if (!g) return null;
  const D = SKILLS[g.gem],
    /* 法杖：法術技能等級 +1 */
    lv = g.lv + (D.tags.includes('spell') ? ST.spellLv : 0),
    c = {
      i,
      k: g.gem,
      D,
      lv,
      /* 攻擊的技能倍率（寶石等級）；「更多」另外放在 more（combat.js 的 hitCalc 第 5 步） */
      mult: D.m * Math.pow(1.06, lv - 1),
      more: 1,
      aoe: 1,
      speed: D.tags.includes('spell') ? (1 + ST.castP / 100) * (hasBuff('arcane') ? 1.15 : 1) : 1,
      mp: D.mp,
      cd: (D.cd || 0) * (1 - ST.cdr / 100),
      critInc: 0,
      critX: 0,
      leech: 0,
      proj: D.cnt || 1,
      pierce: D.pierce || 0,
      kb: 1,
      fireAdd: 0,
      pen: 0,
      ailMag: 0,
      bleedCh: 0,
      poisonCh: 0,
      poiStack: 0,
      impaleCh: 0,
      wolves: D.cnt || 0,
      wolfM: 1
    };
  for (const sp of g.sup || []) {
    if (!sp || !supOK(D, sp)) continue;
    c.more *= 1 + 0.01 * (sp.lv - 1);
    const k = sp.gem;
    if (k === 'multi') (c.proj += 2), (c.more *= 0.8);
    else if (k === 'pierce') c.pierce += 3;
    else if (k === 'area') c.aoe *= 1.4;
    else if (k === 'fury') (c.more *= 1.35), (c.mp *= 1.4);
    else if (k === 'haste') c.speed *= 1.25;
    else if (k === 'crit') (c.critInc += 50), (c.critX += 40);
    else if (k === 'leech') c.leech += 0.03;
    else if (k === 'cdr') c.cd *= 0.65;
    else if (k === 'fireadd') c.fireAdd += 0.25;
    else if (k === 'heavy') (c.kb *= 2), (c.more *= 1.15);
    else if (k === 'pack') (c.wolves += 1), (c.wolfM *= 1.3);
    else if (k === 'bleed') c.bleedCh += 25;
    else if (k === 'poison') c.poisonCh += 25;
    else if (k === 'poistack') (c.poiStack += 2), (c.ailMag += 10);
    else if (k === 'ailmag') c.ailMag += 30;
    else if (k === 'scorch' || k === 'brittle' || k === 'sap') c.alt = k;
    else if (k === 'expose') c.expose = 1;
    else if (k === 'armbreak') c.armBreak = 1;
    else if (k === 'elec') c.elc = 1;
    else if (k === 'wither') c.wither = 1;
    else if (k === 'blind') c.blind = 1;
    else if (k === 'arcane') c.arcane = 1;
    else if (SUPPORTS[k].conv && !c.conv) {
      c.conv = SUPPORTS[k].conv;
      c.more *= c.conv === 'trap' ? 1.2 : c.conv === 'totem' ? 0.7 : 1;
    }
  }
  c.mp = Math.round(c.mp);
  c.unit = D.unit || c.conv;
  return c;
}
/* 按下技能鍵 */
/* 武器技能要拿對的武器（照 PoE2） */
const wtOK = D => !D.wt || D.wt.includes(ST.wt);
const wtNeed = D => '要拿' + D.wt.map(w => WTN[w]).join('或');
function useSlot(i) {
  if (P.act || P.roll || G.state !== 'play' || G.scene !== 'map') return false;
  if (P.ail && P.ail.frozen > G.t) return false;
  const c = slotCfg(i);
  if (!c) return false;
  if (!wtOK(c.D)) return hudWarn(c.D.n + '：' + wtNeed(c.D)), false;
  if ((P.cds['s' + i] || 0) > 0) return false;
  if (ST.blood) {
    /* 血祭／血之代價：用生命施放 */
    if (P.hp <= c.mp + 1) return hudWarn('生命不夠施放'), false;
    P.hp -= c.mp;
  } else {
    if (P.mp < c.mp) return hudWarn('魔力不足'), false;
    P.mp -= c.mp;
  }
  if (c.cd) P.cds['s' + i] = c.cd;
  const w = mouseWorld(),
    ang = Math.atan2(w.y - P.y, w.x - P.x),
    D = c.D;
  P.face = ang;
  /* 陷阱、地雷、砲台、圖騰：放在滑鼠位置（最遠 320） */
  if (c.unit) {
    placeUnit(c, w);
    P.act = { k: c.k, c, t: 0, dur: 0.25 / c.speed, ang, hits: [], n: 0, place: 1 };
    sfx('throw');
    return true;
  }
  const a = (P.act = {
    k: c.k,
    c,
    t: 0,
    dur: D.t / ST.asM / c.speed / speedMul(),
    ang,
    hits: D.hits || (c.k === 'swallow' ? [0.3, 0.7] : [0.42]),
    n: 0,
    tx: w.x,
    ty: w.y
  });
  sfx(D.tags.includes('spell') ? 'cast' : D.tags.includes('proj') ? 'throw' : 'swing');
  if (c.k === 'iai') {
    const d = Math.min(D.dist, Math.hypot(w.x - P.x, w.y - P.y));
    Object.assign(a, { sx: P.x, sy: P.y, d, hit: new Set(), hits: [] });
    P.iuntil = G.t + a.dur + 0.05;
  }
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
  if (a.t >= a.dur) P.act = null;
}

/* ---------- 各技能出手 ---------- */
function actHit(a, idx) {
  const c = a.c,
    D = c.D,
    R = (D.r || 0) * ST.aoeM * c.aoe * (ST.wt === 'spear' && D.tags.includes('melee') ? 1.25 : 1);
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
  } else if (a.k === 'thrust' || a.k === 'combo') {
    /* 突刺：前兩下窄、最後一下打穿一整排；連打：左右左，第 3 下得到力量球 */
    const last = idx === a.hits.length - 1,
      ang = a.ang + (a.k === 'combo' ? [-0.3, 0.3, 0][idx] : last ? 0 : idx ? 0.1 : -0.1);
    let n = 0;
    if (a.k === 'thrust' && last) {
      const L = R * 1.9;
      fx({ k: 'slash', x: P.x, y: P.y, ang, r: L, arc: 0.3, dur: 0.16 });
      for (const m of G.mobs) {
        if (m.hp <= 0) continue;
        const dx = m.x - P.x,
          dy = m.y - P.y,
          along = dx * Math.cos(ang) + dy * Math.sin(ang),
          side = Math.abs(-dx * Math.sin(ang) + dy * Math.cos(ang));
        if (along > 0 && along < L + m.r && side < 28 + m.r) hitMob(m, c, ang, 220 * c.kb, { a }), n++;
      }
    } else {
      fx({ k: 'slash', x: P.x, y: P.y, ang, r: R, arc: D.arc, dur: 0.15, flipArc: idx === 1 });
      n = hitArc(ang, D.arc, R, (a.k === 'combo' && last ? 200 : 90) * c.kb);
    }
    if (D.gain && n) P.mp = Math.min(ST.mp, P.mp + D.gain * n);
    if (a.k === 'combo' && last && n) gainChg('p');
  } else if (a.k === 'split') {
    const n = D.cnt + c.proj - 1;
    for (let i = 0; i < n; i++) shoot(a.ang + (i - (n - 1) / 2) * 0.22, D.spd, c, a, { life: 0.7 });
  } else if (a.k === 'frostbolt') {
    const n = c.proj;
    for (let i = 0; i < n; i++)
      shoot(a.ang + (i - (n - 1) / 2) * 0.18, D.spd, c, a, { pierce: 999, life: 0.75, life0: 0.75, decay: 1, cold: 1 });
  } else if (a.k === 'arc') {
    /* 先打滑鼠附近（離自己 450 內）最近的，再跳 chain 次（每次 260 內、不重複） */
    const hit = new Set();
    let from = { x: P.x, y: P.y - 20 },
      cur = null,
      bd = 1e9;
    for (const m of G.mobs)
      if (m.hp > 0 && dist(P, m) < 450) {
        const d = Math.hypot(m.x - a.tx, m.y - a.ty);
        if (d < bd) (bd = d), (cur = m);
      }
    for (let k = 0; cur && k <= D.chain + (c.proj - 1); k++) {
      fx({ k: 'zap', x: from.x, y: from.y, x2: cur.x, y2: cur.y - cur.sz * 0.4, dur: 0.18 });
      hit.add(cur);
      hitMob(cur, c, angTo(from, cur), 60 * c.kb, { a, from });
      from = { x: cur.x, y: cur.y - cur.sz * 0.4 };
      let nx = null,
        nd = 260;
      for (const m of G.mobs)
        if (m.hp > 0 && !hit.has(m)) {
          const d = Math.hypot(m.x - cur.x, m.y - cur.y);
          if (d < nd) (nd = d), (nx = m);
        }
      cur = nx;
    }
    if (!hit.size) fx({ k: 'zap', x: P.x, y: P.y - 20, x2: a.tx, y2: a.ty, dur: 0.15 });
    sfx('cast');
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
  } else if (D.curse) {
    G.meteors.push({ x: a.tx, y: a.ty, r: R, t: 0, dur: 1.5, curse: D.curse, lv: c.lv });
    fx({ k: 'ring', x: a.tx, y: a.ty, r: R, dur: 0.4, col: '#c38bff' });
    sfx('cast');
  } else if (D.mark) {
    const m = G.mobs
      .filter(o => o.hp > 0 && Math.hypot(o.x - a.tx, o.y - a.ty) < 120 + o.r)
      .sort((x, y) => Math.hypot(x.x - a.tx, x.y - a.ty) - Math.hypot(y.x - a.tx, y.y - a.ty))[0];
    if (m) markMob(m, D.mark), fx({ k: 'ring', x: m.x, y: m.y, r: 40, dur: 0.3, col: '#ff6b6b' }), sfx('cast');
  } else if (a.k === 'meteor') {
    G.meteors.push({ x: a.tx, y: a.ty, r: R, t: 0, dur: D.delay, c, a });
  } else if (a.k === 'wolf') {
    G.allies = G.allies.filter(w => w.src !== 'gem');
    for (let i = 0; i < c.wolves; i++) callWolf('gem', c);
    fx({ k: 'ring', x: P.x, y: P.y, r: 90, dur: 0.35, col: '#9df29d' });
  }
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
      hitMob(m, s.c, angTo(s, m), 120 * s.c.kb, { a: s.a, from: { x: s.x, y: s.y + 18 } });
}

/* ---------- 傷害（公式在 combat.js 的 hitCalc） ---------- */
/* 沒有技能時的預設（反擊、盾擊、狼）：左鍵斬擊、沒有輔助 */
const BASEC = () => ({
  D: SKILLS.slash,
  mult: 1,
  more: 1,
  critInc: 0,
  critX: 0,
  fireAdd: 0,
  kb: 1,
  pen: 0,
  ailMag: 0,
  bleedCh: 0,
  poisonCh: 0,
  poiStack: 0,
  impaleCh: 0
});
/* 打中一隻怪：o.a 出手、o.quiet 不停頓不震（狼、毒、反擊）、o.stun 暈眩、o.mult 改這一下的倍率（換成「更多」） */
function hitMob(m, c, ang, kb, o = {}) {
  /* 不能穿牆：從出手的地方（o.from，預設是玩家）看不到就打不到 */
  const f = o.from || P;
  if (!los(f.x, f.y, m.x, m.y)) return;
  const a = o.a || {};
  let mult = (o.mult ? o.mult / (c.mult || 1) : 1) * (a.mul || 1),
    crit = !!(a.crit || o.crit);
  const r = hitCalc(c, m, { mult, crit, minion: o.minion, unit: a.unit });
  applyAil(m, r, c);
  onHitBase(m, r, c);
  if (ST.wt === 'staff' && (c.D.tags || []).includes('melee') && !o.quiet) P.mp = Math.min(ST.mp, P.mp + 1);
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
  fxs(r.crit ? 'crit' : 'hit', m.x, m.y - m.sz * 0.3, m.sz * (r.crit ? 0.8 : 0.5));
  if (!o.quiet) {
    sparks(m.x, m.y - m.sz * 0.4, ang, r.crit ? 10 : 5, r.crit ? '#ffd166' : ELC[r.el]);
    hitstop(r.crit ? 0.085 : 0.04);
    shake(r.crit ? 0.22 : 0.08);
    sfx(r.crit ? 'crit' : 'hit');
    if (ST.loh) P.hp = Math.min(ST.hp, P.hp + ST.loh);
  }
  /* 吸血：1 秒內回完；同時只有一筆（取回得最快的） */
  const lr = r.d * c.leech * (1 + MM('pleech') / 100);
  if (c.leech && (!P.lch || P.lch.t <= G.t || lr > P.lch.rate)) P.lch = { rate: lr, t: G.t + 1 };
  if (m.hp <= 0) killMob(m);
}

/* 不吃暴擊的傷害：只吃抗性 */
function dotHit(m, d, el, quiet) {
  if (el !== 'phys') d *= 1 - resOf(m, el) / 100;
  m.hp -= d;
  if (!quiet) num(m.x, m.y - m.sz, d, el);
  aggroPack(m);
  if (m.hp <= 0) killMob(m);
}
/* 怪物每格：異常（combat.js）；回傳 true＝這格不行動 */
function mobTick(m, dt) {
  const stop = ailTick(m, dt);
  if (m.hp <= 0) return killMob(m), true;
  return stop;
}
/* 能量護盾：受傷先扣護盾（流血、中毒在 combat.js 另外算）；回傳剩下的傷害 */
function esAbsorb(d) {
  P.lastHurt = G.t;
  if (P.es > 0) {
    const ab = Math.min(P.es, d);
    P.es -= ab;
    d -= ab;
  }
  return d;
}

/* ---------- 召喚戰狼：狼跟著你、咬最近的怪 ---------- */
function callWolf(src, c) {
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
      const c = w.c || slotCfg(0) || BASEC(),
        mult = w.src === 'gem' ? c.mult * c.wolfM : 0.4;
      hitMob(t, c, angTo(w, t), 60, { quiet: 1, mult, minion: 1, from: w });
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
          hitMob(m, p.c, 0, 0, { quiet: 1, a: p.a, mult: p.c.mult, from: p });
    }
  }
  G.pools = G.pools.filter(p => p.t < p.dur);
  for (const o of G.meteors) {
    o.t += dt;
    if (o.t >= o.dur && !o.done && o.curse) {
      o.done = 1;
      fxs('dark', o.x, o.y, o.r * 0.6);
      for (const m of G.mobs)
        if (m.hp > 0 && Math.hypot(m.x - o.x, m.y - o.y) < o.r + m.r && los(o.x, o.y, m.x, m.y))
          curseMob(m, o.curse, o.lv);
    } else if (o.t >= o.dur && !o.done) {
      o.done = 1;
      fx({ k: 'ring', x: o.x, y: o.y, r: o.r, dur: 0.4, col: '#ff6b3d' });
      shake(0.45);
      sfx('slam');
      for (const m of G.mobs)
        if (m.hp > 0 && Math.hypot(m.x - o.x, m.y - o.y) < o.r + m.r)
          hitMob(m, o.c, Math.atan2(m.y - o.y, m.x - o.x), 260, { a: o.a, from: o });
    }
  }
  G.meteors = G.meteors.filter(o => !o.done);
}
function updSkills(dt) {
  /* 能量護盾：2 秒沒受傷開始回充，每秒 25% */
  if (ST.es && P.es < ST.es && G.t - (P.lastHurt || -9) > 2)
    P.es = Math.min(ST.es, P.es + ST.es * 0.25 * (1 + (ST.esRec + MM('pes')) / 100) * dt);
  /* 戰狼精魄光環 */
  const aw = G.allies.some(w => w.src === 'aura');
  if (G.scene === 'map' && ST.auraWolf && !aw) callWolf('aura');
  else if (!ST.auraWolf && aw) G.allies = G.allies.filter(w => w.src !== 'aura');
  updAllies(dt);
  updPools(dt);
  updUnits(dt);
}
/* 進地圖、回藏身處：重設狀態 */
function skillsEnter() {
  Object.assign(P, { lastHurt: -9, rage: 0, rageT: 0 });
  Object.assign(G, { allies: [], pools: [], meteors: [], units: [], mineT: 0 });
  P.es = ST.es;
}

/* 出手速度、移動速度：buff 與冰緩、冰凍（combat.js） */
function speedMul() {
  return buffSpeed() * Math.max(0.3, playerSlow());
}
function moveMul() {
  return buffMove() * playerSlow();
}
/* 殺怪：擊殺回血 */
function onKill() {
  if (ST.killHeal) P.hp = Math.min(ST.hp, P.hp + ST.killHeal);
}

/* ---------- 陷阱、地雷、砲台、圖騰（場上單位） ---------- */
const UNIT_MAX = { trap: 4, mine: 6, totem: 2, turret: 2 };
const UNIT_N = { trap: '陷阱', mine: '地雷', totem: '圖騰', turret: '砲台' };
function placeUnit(c, w) {
  const d = Math.min(320, Math.hypot(w.x - P.x, w.y - P.y)),
    a = Math.atan2(w.y - P.y, w.x - P.x);
  /* 往滑鼠方向走，碰到牆就停在牆前（不能丟到隔壁房間） */
  let x = P.x,
    y = P.y;
  for (let s = 12; s <= d; s += 12) {
    const nx = P.x + Math.cos(a) * s,
      ny = P.y + Math.sin(a) * s;
    if (!open(nx, ny, 12)) break;
    (x = nx), (y = ny);
  }
  const type = c.unit,
    mine = G.units.filter(u => u.type === type);
  /* 滿了就收掉最舊的 */
  if (mine.length >= UNIT_MAX[type] + (ST.units || 0)) G.units.splice(G.units.indexOf(mine[0]), 1);
  const D = c.D,
    dur = type === 'trap' || type === 'mine' ? 30 : D.dur || 8,
    rate = D.rate || Math.max(0.5, D.t * 1.8);
  G.units.push({ type, x, y, c, t: 0, dur, cd: 0.3, rate });
  if (type === 'mine') G.mineT = G.t + 1.2;
  fx({ k: 'ring', x, y, r: 30, dur: 0.25, col: '#cfd8e3' });
}
/* 從場上單位施放：本身就是單位的技能（陷阱爆開、地雷爆開、砲台射擊、火焰圖騰）或轉換來的技能 */
function unitFire(u, tgt, mul = 1) {
  const c = u.c,
    D = c.D,
    ang = tgt ? Math.atan2(tgt.y - u.y, tgt.x - u.x) : 0,
    a = { k: c.k, c, ang, tx: tgt ? tgt.x : u.x, ty: tgt ? tgt.y : u.y, hits: [0], n: 0, unit: 1, mul };
  if (D.unit === 'trap' || D.unit === 'mine') {
    const r = (D.r || 100) * ST.aoeM * c.aoe;
    fx({ k: 'ring', x: u.x, y: u.y, r, dur: 0.35, col: D.el === 'cold' ? '#8fd6ff' : '#ff8a4c' });
    shake(0.18);
    sfx('slam');
    for (const m of G.mobs)
      if (m.hp > 0 && Math.hypot(m.x - u.x, m.y - u.y) < r + m.r)
        hitMob(m, c, Math.atan2(m.y - u.y, m.x - u.x), 140, { a, stun: D.stun, from: u });
    return;
  }
  /* 其他：暫時把施放點換成單位的位置，照原本的技能出手（出手完放回來） */
  const px = P.x,
    py = P.y,
    pf = P.face;
  P.x = u.x;
  P.y = u.y;
  if (D.unit === 'turret') shoot(ang, 820, c, a, { life: 0.7, bolt: 1 });
  else if (D.unit === 'totem') shoot(ang, 520, c, a, { boom: D.r * ST.aoeM, fire: 1, life: 1 });
  else for (let i = 0; i < (c.k === 'swallow' ? 2 : 1); i++) actHit(a, i);
  P.x = px;
  P.y = py;
  P.face = pf;
}
function updUnits(dt) {
  const near = (u, r) => {
    let best = null,
      bd = r;
    for (const m of G.mobs)
      if (m.hp > 0 && Math.hypot(m.x - u.x, m.y - u.y) < bd) (bd = Math.hypot(m.x - u.x, m.y - u.y)), (best = m);
    return best;
  };
  const keep = [],
    boomMines = G.mineT && G.t >= G.mineT;
  const mines = G.units.filter(u => u.type === 'mine').length;
  for (const u of G.units) {
    u.t += dt;
    if (u.type === 'trap') {
      const m = u.t > 0.4 && near(u, 70);
      if (m) {
        unitFire(u, m);
        continue;
      }
    } else if (u.type === 'mine') {
      if (boomMines) {
        unitFire(u, near(u, 400), 1 + 0.1 * (mines - 1));
        continue;
      }
    } else if ((u.cd -= dt) <= 0) {
      const m = near(u, 480);
      if (m) (u.cd = u.rate), unitFire(u, m);
    }
    if (u.t < u.dur) keep.push(u);
  }
  if (boomMines) G.mineT = 0;
  G.units = keep;
}
