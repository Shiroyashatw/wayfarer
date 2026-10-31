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
    else if (SUPPORTS[k].conv && !c.conv) {
      c.conv = SUPPORTS[k].conv;
      c.mult *= c.conv === 'trap' ? 1.2 : c.conv === 'totem' ? 0.7 : 1;
    }
  }
  c.mp = Math.round(c.mp);
  c.unit = D.unit || c.conv;
  return c;
}
/* 按下技能鍵 */
function useSlot(i) {
  if (P.act || P.roll || G.state !== 'play' || G.scene !== 'map') return false;
  const c = slotCfg(i);
  if (!c) return false;
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
  /* 魔劍士：放法術後 4 秒，近戰附加那個屬性 */
  if (D.tags.includes('spell') && ascV(S, 'spell.enchant')) P.ench = { el: D.el || 'light', until: G.t + 4 };
  const a = (P.act = {
    k: c.k,
    c,
    t: 0,
    dur: D.t / ST.asM / c.speed / speedMul(),
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
  /* 刺劍姬：致命節奏（每第 4 次出手必定暴擊） */
  const rh = ascV(S, 'rapier.rhythm');
  if (rh && ++P.beat % rh === 0) a.crit = 1;
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
  if (!a.any || a.unit) return;
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
  const fl = ascV(S, 'rapier.flurry');
  if (fl && D.tags.includes('melee') && a.k !== 'iai' && idx === 0)
    for (let i = 0; i < fl; i++)
      shoot(a.ang + (i - (fl - 1) / 2) * 0.22, 700, { ...c, mult: c.mult * 0.5, pierce: 1 }, a, { life: 0.45 });
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
  const tg0 = c.D.tags || [];
  if (tg0.includes('melee') && P.ench && P.ench.until > G.t) {
    const v = (rnd(ST.dmg[0], ST.dmg[1]) * ascV(S, 'spell.enchant')) / 100;
    ele += v;
    if (v > bigV) (bigV = v), (big = P.ench.el);
  }
  if (el) (ele += d), (d = 0), (big = el);
  const tg = c.D.tags || [],
    inc =
      ST.dmgA +
      (tg.includes('melee') ? ST.meleeP : 0) +
      (tg.includes('proj') ? ST.projP : 0) +
      (tg.includes('spell') ? ST.spellP : 0) +
      (o.minion ? ST.minionP : 0) +
      (o.unit ? ST.unitP : 0) +
      (tg.includes('melee') && ascV(S, 'spell.arcane') ? ST.spellP : 0) +
      (P.rage || 0) +
      ascV(S, 'berserk.blood') +
      ascV(S, 'berserk.last') * (1 - P.hp / ST.hp);
  let tot = (d + ele * (1 + ST.eleP / 100)) * (o.mult || c.mult) * (1 + inc / 100) * (1 + 0.02 * (P.guard || 0));
  if (m && m.exposeT > G.t) tot *= 1 + ascV(S, 'rapier.expose') / 100;
  tot += tot * (c.fireAdd + ST.fireAdd / 100);
  if (m && m.el === big && big !== 'phys' && !ascV(S, 'spell.pen')) tot *= 0.6;
  let crit = o.crit || P.critNext || Math.random() * 100 < ST.crit + c.crit;
  if (crit) tot *= ST.critM + c.critX / 100 + (P.critNext ? 0.5 : 0);
  if (!o.keep) P.critNext = 0;
  return { d: tot, crit, el: big };
}
/* 打中一隻怪：o.a 出手、o.quiet 不停頓不震（狼、毒、反擊）、o.stun 暈眩、o.mult 改倍率 */
function hitMob(m, c, ang, kb, o = {}) {
  const a = o.a || {};
  let mult = (o.mult || c.mult) * (a.mul || 1),
    crit = !!(a.crit || o.crit);
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
  const r = rollDmg(c, m, { mult, crit, minion: o.minion, unit: a.unit });
  /* 魔劍士：魔力之刃回魔、劍氣 */
  if ((c.D.tags || []).includes('melee') && !o.quiet && !a.unit) {
    if (ascV(S, 'spell.arcane')) P.mp = Math.min(ST.mp, P.mp + 1);
    const wv = ascV(S, 'spell.wave');
    if (wv && Math.random() * 100 < wv) {
      const el = (P.ench && P.ench.until > G.t && P.ench.el) || 'light';
      shoot(
        angTo(P, m),
        640,
        { ...c, D: { ...c.D, el, tags: ['spell', 'proj'] }, mult: c.mult * 0.8, pierce: 1 },
        {},
        { life: 0.6, wave: el }
      );
    }
  }
  if (r.crit && ascV(S, 'rapier.expose')) m.exposeT = G.t + 4;
  /* 狂魔：怒氣、嗜血 */
  const rg = ascV(S, 'berserk.rage');
  if (rg && !o.quiet) (P.rage = Math.min(rg, (P.rage || 0) + 1)), (P.rageT = G.t);
  const lc = ascV(S, 'berserk.leech');
  if (lc) P.hp = Math.min(ST.hp, P.hp + (r.d * lc) / 100);
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
  for (const g of [...S.skills.flatMap(sl => [sl.a, ...sl.s]), ...S.auras]) {
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
  if (P.es > 0) {
    const ab = Math.min(P.es, d);
    P.es -= ab;
    d -= ab;
  }
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
      hitMob(t, c, angTo(w, t), 60, { quiet: 1, mult, noBurn: w.src === 'gem', minion: 1 });
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
  /* 怒氣：3 秒沒打中，每秒掉 5 點 */
  if (P.rage && G.t - P.rageT > 3) P.rage = Math.max(0, P.rage - 5 * dt);
  /* 騎士的護盾：4 秒沒受傷就充滿 */
  const wm = wardMax();
  if (wm && G.t - (P.lastHurt || -9) > 4) P.ward = wm;
  /* 能量護盾：2 秒沒受傷（秘法護盾 1 秒）開始回充，每秒 25% */
  if (ST.es && P.es < ST.es && G.t - (P.lastHurt || -9) > (ascV(S, 'spell.ward') ? 1 : 2))
    P.es = Math.min(ST.es, P.es + ST.es * 0.25 * (1 + ST.esRec / 100) * dt);
  /* 戰狼精魄光環 */
  const aw = G.allies.some(w => w.src === 'aura');
  if (G.scene === 'map' && ST.auraWolf && !aw) callWolf('aura');
  else if (!ST.auraWolf && aw) G.allies = G.allies.filter(w => w.src !== 'aura');
  updAllies(dt);
  updPools(dt);
  updUnits(dt);
}
/* 進地圖、回藏身處：重設核心的狀態；馴獸師帶狼 */
function skillsEnter() {
  Object.assign(P, {
    stance: 0,
    guard: 0,
    ward: wardMax(),
    wardAbs: 0,
    calls: 0,
    shadowT: 0,
    lastHurt: -9,
    rage: 0,
    rageT: 0,
    beat: 0,
    frenzy: [],
    undying: 1,
    flashT: 0,
    stepT: 0
  });
  Object.assign(G, { allies: [], pools: [], meteors: [], units: [], mineT: 0 });
  P.es = ST.es;
  P.ench = null;
  if (G.scene === 'map' && hasCls(S, 'tamer')) for (let i = 1 + coreV(S, 'tamer', 'alpha'); i > 0; i--) callWolf('cls');
}

/* ---------- 劍士昇華的其他效果 ---------- */
/* 出手速度：怒氣（每點 +0.5%）、狂亂（每層 +8%）、步法（翻滾後 +30%） */
function speedMul() {
  const fz = (P.frenzy || []).filter(t => t > G.t).length;
  return (
    (1 + (P.rage || 0) * 0.005) *
    (1 + (fz * ascV(S, 'berserk.frenzy')) / 100) *
    (P.stepT > G.t ? 1 + ascV(S, 'rapier.step') / 100 : 1)
  );
}
/* 移動速度：狂亂、一閃、刺客的影步 */
function moveMul() {
  const fz = (P.frenzy || []).filter(t => t > G.t).length;
  return (
    (1 + (fz * ascV(S, 'berserk.frenzy')) / 100) *
    (P.flashT > G.t ? 1 + ascV(S, 'ronin.flash') / 100 : 1) *
    (P.shadowT > 0 ? 1 + coreV(S, 'assassin', 'shadow') / 100 : 1)
  );
}
/* 見切成功：浪人一閃（架勢滿）、刺劍姬反擊 */
function onMikiri() {
  if (ascV(S, 'ronin.flash')) (P.stance = stanceNeed()), (P.flashT = G.t + 2);
  const rp = ascV(S, 'rapier.riposte');
  if (rp) {
    const c = slotCfg(0) || { D: SKILLS.slash, mult: 1, crit: 0, critX: 0, fireAdd: 0, kb: 1 };
    fx({ k: 'slash', x: P.x, y: P.y, ang: P.face, r: 130, arc: TAU * 0.9, dur: 0.2 });
    for (const m of G.mobs)
      if (m.hp > 0 && dist(m, P) < 140 + m.r) hitMob(m, c, angTo(P, m), 220, { quiet: 1, mult: rp, crit: 1 });
  }
}
/* 格擋：刺劍姬的格擋大師反擊 */
function onBlock() {
  const pa = ascV(S, 'rapier.parry');
  if (pa) aoeHit(P.x, P.y, 120, pa, '#cfd8e3');
}
/* 殺怪：狂亂疊層 */
function onKill() {
  if (ascV(S, 'berserk.frenzy')) {
    P.frenzy = (P.frenzy || []).filter(t => t > G.t).slice(-2);
    P.frenzy.push(G.t + 3);
  }
}
/* 致命傷害：狂魔的不死（每張地圖一次） */
function tryUndying() {
  if (!ascV(S, 'berserk.undying') || !P.undying || G.scene !== 'map') return false;
  P.undying = 0;
  P.hp = 1;
  P.iuntil = G.t + ascV(S, 'berserk.undying');
  fx({ k: 'mikiri', x: P.x, y: P.y, dur: 0.8 });
  hudWarn('不死！');
  sfx('mikiri');
  return true;
}

/* ---------- 陷阱、地雷、砲台、圖騰（場上單位） ---------- */
const UNIT_MAX = { trap: 4, mine: 6, totem: 2, turret: 2 };
const UNIT_N = { trap: '陷阱', mine: '地雷', totem: '圖騰', turret: '砲台' };
function placeUnit(c, w) {
  const d = Math.min(320, Math.hypot(w.x - P.x, w.y - P.y)),
    a = Math.atan2(w.y - P.y, w.x - P.x);
  let x = P.x + Math.cos(a) * d,
    y = P.y + Math.sin(a) * d;
  if (!open(x, y, 12)) (x = P.x), (y = P.y);
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
        hitMob(m, c, Math.atan2(m.y - u.y, m.x - u.x), 140, { a, stun: D.stun });
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
