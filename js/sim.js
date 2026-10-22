/* 塞令老師 · 自動戰鬥模擬（純計算，不碰畫面）：輸入兩個角色與亂數種子，輸出勝負與事件時間軸。
   同樣的背包＋同樣的種子，結果一定一樣（固定亂數），畫面只負責照時間軸播放。 */
'use strict';
const SIM_DT = 0.05;
/* 0.1.9 異常狀態的數值 */
const WEAK_PCT = 25,
  WEAK_T = 3,
  BLIND_MISS = 30,
  BLIND_T = 2.5,
  SUNDER_MAX = 15,
  /* 0.1.19 中毒不會退，戰鬥拉長以後會一直疊、太強：最多 12 層 */
  POISON_MAX = 12;
/* 一方的戰鬥狀態 */
function simSide(F) {
  return {
    F,
    hp: F.hp,
    max: F.hp,
    block: F.startBlock || 0,
    burn: 0,
    poison: 0,
    frozen: 0,
    stun: 0,
    /* 0.1.9 新異常：流血（層數，每秒扣層數然後減半）、破甲（扣護甲，會疊）、虛弱（秒，傷害 -25%）、致盲（秒，30% 打不中） */
    bleed: 0,
    sunder: 0,
    weak: 0,
    blind: 0,
    /* 0.1.10 先手（opener）：開戰時武器已經充能幾 % */
    w: F.weapons.map((w, i) => ({ ...w, i, tt: w.cd * Math.max(0.25, Math.min(0.99, (F.opener || 0) / 100)) })),
    s: F.shields.map((s, i) => ({ ...s, i, tt: s.cd * 0.5 })),
    pots: F.pots.map(p => ({ ...p })),
    dmgDone: 0
  };
}
/* A 是你（左邊）、B 是對手；回傳 { win, t, ev: [事件], end: [A 剩生命, B 剩生命] } */
function simulate(FA, FB, seed) {
  const r = rng(seed),
    S = [simSide(FA), simSide(FB)],
    ev = [];
  const log = (t, s, k, v, extra) =>
    ev.push({
      t: Math.round(t * 100) / 100,
      s,
      k,
      v,
      hp: [Math.max(0, Math.round(S[0].hp)), Math.max(0, Math.round(S[1].hp))],
      st: S.map(x => [
        x.burn,
        x.poison,
        x.bleed,
        x.sunder,
        +(x.frozen > 0),
        +(x.stun > 0),
        +(x.weak > 0),
        +(x.blind > 0)
      ]),
      ...extra
    });
  const hurt = (t, d, def, src, k, extra) => {
    def.hp -= d;
    log(t, src, k, Math.round(d), extra);
  };
  const attack = (t, a, ai, w) => {
    const d = S[1 - ai];
    if (r() * 100 < d.F.dodge + (a.blind > 0 ? BLIND_MISS : 0)) return log(t, ai, 'miss', 0, { u: w.u });
    let v = w.dmg[0] + r() * (w.dmg[1] - w.dmg[0]);
    const crit = r() * 100 < w.crit;
    if (crit) v *= a.F.critMul / 100;
    if (a.weak > 0) v *= 1 - WEAK_PCT / 100;
    /* 0.1.10 處決（敵人生命低於 30%）、背水（自己生命低於 50%） */
    if (a.F.execute && d.hp < d.max * 0.3) v *= 1 + a.F.execute / 100;
    if (a.F.rage && a.hp < a.max * 0.5) v *= 1 + a.F.rage / 100;
    v *= 50 / (50 + Math.max(-10, d.F.arm - d.sunder));
    v *= 1 + d.F.take / 100;
    let ab = 0;
    if (d.block > 0) {
      ab = Math.min(d.block, v);
      d.block -= ab;
      v -= ab;
    }
    v = Math.max(ab > 0 ? 0 : 1, v);
    hurt(t, v, d, ai, crit ? 'crit' : 'hit', { u: w.u, ab: Math.round(ab), el: w.el });
    a.dmgDone += v;
    /* 0.1.10 暴擊回血、被打中反彈 */
    if (crit && a.F.critHeal && a.hp > 0) {
      const h = Math.min(a.max - a.hp, a.F.critHeal);
      if (h > 0) {
        a.hp += h;
        log(t, ai, 'heal', Math.round(h), { self: 1 });
      }
    }
    if (d.F.thornsF && v > 0) hurt(t, d.F.thornsF, a, 1 - ai, 'thorns', {});
    /* 格擋時反彈 */
    if (ab > 0) {
      const th = d.s.reduce((n, s) => n + s.thorns, 0);
      if (th) hurt(t, th, a, 1 - ai, 'thorns', {});
    }
    const ls = (w.ls + a.F.ls) / 100;
    if (ls > 0 && v > 0) {
      const h = Math.min(a.max - a.hp, v * ls);
      if (h >= 1) {
        a.hp += h;
        log(t, ai, 'heal', Math.round(h), { self: 1 });
      }
    }
    if (w.burn) d.burn += w.burn;
    if (w.poison) d.poison = Math.min(POISON_MAX, d.poison + w.poison);
    if (w.bleed) d.bleed += w.bleed;
    if (w.sunder) d.sunder = Math.min(SUNDER_MAX, d.sunder + w.sunder);
    if (w.weak && r() * 100 < w.weak) {
      d.weak = Math.max(d.weak, WEAK_T);
      log(t, ai, 'weak', WEAK_T, {});
    }
    if (w.blind && r() * 100 < w.blind) {
      d.blind = Math.max(d.blind, BLIND_T);
      log(t, ai, 'blind', BLIND_T, {});
    }
    if (w.freeze[0] && r() * 100 < w.freeze[0]) {
      d.frozen = Math.max(d.frozen, w.freeze[1]);
      log(t, ai, 'freeze', w.freeze[1], {});
    }
    if (w.stun[0] && r() * 100 < w.stun[0]) {
      d.stun = Math.max(d.stun, w.stun[1]);
      log(t, ai, 'stun', w.stun[1], {});
    }
  };
  /* 0.1.6 開戰前：降階、封鎖（打對方隨機一把武器） */
  for (const k of ['down', 'seal'])
    for (let i = 0; i < 2; i++)
      for (const p of S[i].F.pre || []) {
        if (p.k !== k) continue;
        const d = S[1 - i],
          c = d.w.filter(w => (k === 'down' ? w.t > 1 : !w.seal));
        if (!c.length) continue;
        const w = c[fl(r() * c.length)];
        if (k === 'down') {
          const m = TIERM[w.t - 1] / TIERM[w.t];
          w.dmg = w.dmg.map(v => Math.max(1, Math.round(v * m)));
          w.t--;
        } else w.seal = p.v;
        log(0, i, k, p.v, { u: p.u, tu: w.u });
      }
  /* 0.1.9 開戰丟出去的藥劑：對方直接吃到異常 */
  for (let i = 0; i < 2; i++)
    for (const p of S[i].F.pre || []) {
      if (p.k === 'seal' || p.k === 'down') continue;
      const d = S[1 - i];
      if (p.k === 'weak' || p.k === 'blind' || p.k === 'frozen') d[p.k] = Math.max(d[p.k], p.v);
      else if (p.k === 'sunder') d.sunder = Math.min(SUNDER_MAX, d.sunder + p.v);
      else d[p.k] = p.k === 'poison' ? Math.min(POISON_MAX, d[p.k] + p.v) : d[p.k] + p.v;
      log(0, i, 'throw', p.v, { u: p.u, x: p.k });
    }
  let t = 0,
    sec = 0;
  while (t < MAX_T) {
    t += SIM_DT;
    for (let i = 0; i < 2; i++) {
      const a = S[i];
      if (a.weak > 0) a.weak -= SIM_DT;
      if (a.blind > 0) a.blind -= SIM_DT;
      if (a.stun > 0) {
        a.stun -= SIM_DT;
        /* 0.1.27 暈眩時凍結、封鎖照樣倒數（之前會跟著暫停，暈眩＋凍結變得比說明強） */
        if (a.frozen > 0) a.frozen -= SIM_DT;
        for (const w of a.w) if (w.seal > 0) w.seal -= SIM_DT;
        continue;
      }
      /* 0.1.10 越戰越快（ramp）：每 5 秒攻速 +N%，最多 5 次 */
      const rate =
        (a.frozen > 0 ? 0.5 : 1) *
        (1 + (Math.min(5, fl(t / 5)) * (a.F.ramp || 0)) / 100) *
        (a.F.rushT && t <= a.F.rushT ? 1 + a.F.rushP / 100 : 1);
      if (a.frozen > 0) a.frozen -= SIM_DT;
      for (const w of a.w) {
        if (w.seal > 0) {
          w.seal -= SIM_DT;
          continue;
        }
        w.tt += SIM_DT * rate;
        if (w.tt >= w.cd) {
          w.tt -= w.cd;
          attack(t, a, i, w);
          /* 0.1.10 連擊：有機率馬上再打一次 */
          if (a.F.double && S[1 - i].hp > 0 && r() * 100 < a.F.double) attack(t, a, i, w);
        }
      }
      for (const s of a.s) {
        s.tt += SIM_DT * rate;
        if (s.tt >= s.cd) {
          s.tt -= s.cd;
          a.block = Math.min(a.max, a.block + s.block);
          log(t, i, 'block', s.block, { u: s.u });
          if (s.heal) {
            const h = Math.min(a.max - a.hp, s.heal);
            if (h > 0) {
              a.hp += h;
              log(t, i, 'heal', Math.round(h), { self: 1, u: s.u });
            }
          }
        }
      }
      for (const p of a.pots)
        if (p.n > 0 && a.hp > 0 && a.hp < (a.max * p.at) / 100) {
          p.n--;
          a.hp = Math.min(a.max, a.hp + p.v);
          log(t, i, 'pot', p.v, { self: 1, u: p.u });
        }
    }
    /* 每秒：燃燒（每秒 -1 層）、中毒（不會退）、回復、疲勞 */
    if (fl(t + 1e-6) > sec) {
      sec = fl(t + 1e-6);
      for (let i = 0; i < 2; i++) {
        const a = S[i];
        if (a.burn > 0) {
          hurt(t, a.burn, a, 1 - i, 'dot', { el: 'fire' });
          a.burn--;
        }
        if (a.poison > 0) hurt(t, a.poison, a, 1 - i, 'dot', { el: 'poison' });
        if (a.bleed > 0) {
          hurt(t, a.bleed, a, 1 - i, 'dot', { el: 'bleed' });
          a.bleed = fl(a.bleed / 2);
        }
        if (a.F.regen && a.hp > 0 && a.hp < a.max) {
          const h = Math.min(a.max - a.hp, a.F.regen);
          a.hp += h;
          log(t, i, 'heal', Math.round(h), { self: 1, regen: 1 });
        }
        if (sec >= FATIGUE_T) hurt(t, 2 * (sec - FATIGUE_T + 1), a, 1 - i, 'fatigue', {});
      }
    }
    if (S[0].hp <= 0 || S[1].hp <= 0) break;
  }
  /* 同時倒下：剩比較多血的贏；完全一樣算對手贏 */
  const win = S[1].hp <= 0 && (S[0].hp > 0 || S[0].hp > S[1].hp);
  return {
    win,
    t,
    ev,
    end: [Math.max(0, Math.round(S[0].hp)), Math.max(0, Math.round(S[1].hp))],
    max: [S[0].max, S[1].max]
  };
}
