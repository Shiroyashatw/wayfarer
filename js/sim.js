/* 塞令老師 · 自動戰鬥模擬（純計算，不碰畫面）：輸入兩個角色與亂數種子，輸出勝負與事件時間軸。
   同樣的背包＋同樣的種子，結果一定一樣（固定亂數），畫面只負責照時間軸播放。 */
'use strict';
const SIM_DT = 0.05;
/* 一方的戰鬥狀態 */
function simSide(F) {
  return {
    F,
    hp: F.hp,
    max: F.hp,
    block: 0,
    burn: 0,
    poison: 0,
    frozen: 0,
    stun: 0,
    w: F.weapons.map((w, i) => ({ ...w, i, tt: w.cd * 0.25 })),
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
      ...extra
    });
  const hurt = (t, d, def, src, k, extra) => {
    def.hp -= d;
    log(t, src, k, Math.round(d), extra);
  };
  const attack = (t, a, ai, w) => {
    const d = S[1 - ai];
    if (r() * 100 < d.F.dodge) return log(t, ai, 'miss', 0, { u: w.u });
    let v = w.dmg[0] + r() * (w.dmg[1] - w.dmg[0]);
    const crit = r() * 100 < w.crit;
    if (crit) v *= a.F.critMul / 100;
    v *= 50 / (50 + d.F.arm);
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
    if (w.poison) d.poison += w.poison;
    if (w.freeze[0] && r() * 100 < w.freeze[0]) {
      d.frozen = Math.max(d.frozen, w.freeze[1]);
      log(t, ai, 'freeze', w.freeze[1], {});
    }
    if (w.stun[0] && r() * 100 < w.stun[0]) {
      d.stun = Math.max(d.stun, w.stun[1]);
      log(t, ai, 'stun', w.stun[1], {});
    }
  };
  let t = 0,
    sec = 0;
  while (t < MAX_T) {
    t += SIM_DT;
    for (let i = 0; i < 2; i++) {
      const a = S[i];
      if (a.stun > 0) {
        a.stun -= SIM_DT;
        continue;
      }
      const rate = a.frozen > 0 ? 0.5 : 1;
      if (a.frozen > 0) a.frozen -= SIM_DT;
      for (const w of a.w) {
        w.tt += SIM_DT * rate;
        if (w.tt >= w.cd) {
          w.tt -= w.cd;
          attack(t, a, i, w);
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
