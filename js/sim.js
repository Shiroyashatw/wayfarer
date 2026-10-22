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
        /* 0.1.29 抗性會讓層數有小數，顯示用無條件進位 */
        Math.ceil(x.burn),
        Math.ceil(x.poison),
        Math.ceil(x.bleed),
        Math.ceil(x.sunder),
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
  /* 0.1.29 抗異常：k 是 d 身上的異常（burn、poison…），回傳抗完剩幾成；開戰免毒的秒數內不會中毒 */
  const RK = {
    burn: 'rBurn',
    poison: 'rPoison',
    bleed: 'rBleed',
    sunder: 'rSunder',
    frozen: 'rFreeze',
    stun: 'rStun',
    weak: 'rWeak',
    blind: 'rBlind'
  };
  const res = (d, k, t) =>
    k === 'poison' && t < (d.F.poisonImm || 0) ? 0 : 1 - Math.min(RES_MAX, d.F[RK[k]] || 0) / 100;
  /* 回復（a 是誰回血）：敵人的詛咒繃帶會減少 */
  const healOf = (a, h) => h * (1 - Math.min(RES_MAX, S[1 - S.indexOf(a)].F.healCut || 0) / 100);
  /* mul：0.1.33 連鎖多打的那幾下傷害打折 */
  const attack = (t, a, ai, w, mul = 1) => {
    const d = S[1 - ai];
    if (r() * 100 < d.F.dodge + (a.blind > 0 ? BLIND_MISS : 0)) return log(t, ai, 'miss', 0, { u: w.u });
    let v = (w.dmg[0] + r() * (w.dmg[1] - w.dmg[0])) * mul;
    const crit = r() * 100 < w.crit;
    /* 0.1.29 厚皮：暴擊多出來的傷害減少 */
    if (crit) v *= 1 + (a.F.critMul / 100 - 1) * (1 - Math.min(RES_MAX, d.F.critRes || 0) / 100);
    if (a.weak > 0) v *= 1 - WEAK_PCT / 100;
    /* 0.1.10 處決（敵人生命低於 30%）、背水（自己生命低於 50%） */
    if (a.F.execute && d.hp < d.max * 0.3) v *= 1 + a.F.execute / 100;
    if (a.F.rage && a.hp < a.max * 0.5) v *= 1 + a.F.rage / 100;
    /* 0.1.28 穿甲：無視一部分護甲，那部分傷害也不會被格擋吃掉 */
    const pc = (w.pierce || 0) / 100;
    v *= 50 / (50 + Math.max(-10, (d.F.arm - d.sunder) * (d.F.arm - d.sunder > 0 ? 1 - pc : 1)));
    v *= 1 + d.F.take / 100;
    let ab = 0;
    if (d.block > 0) {
      ab = Math.min(d.block, v * (1 - pc));
      d.block -= ab;
      v -= ab;
    }
    v = Math.max(ab > 0 ? 0 : 1, v);
    hurt(t, v, d, ai, crit ? 'crit' : 'hit', { u: w.u, ab: Math.round(ab), el: w.el });
    a.dmgDone += v;
    /* 0.1.28 守護（質變）：命中時獲得傷害一部分的格擋 */
    if (w.guard && v > 0) a.block = Math.min(a.max, a.block + (v * w.guard) / 100);
    /* 0.1.10 暴擊回血、被打中反彈 */
    if (crit && a.F.critHeal && a.hp > 0) {
      const h = Math.min(a.max - a.hp, healOf(a, a.F.critHeal));
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
      const h = Math.min(a.max - a.hp, healOf(a, v * ls));
      if (h >= 1) {
        a.hp += h;
        log(t, ai, 'heal', Math.round(h), { self: 1 });
      }
    }
    if (w.burn) d.burn += w.burn * res(d, 'burn', t);
    if (w.poison) d.poison = Math.min(POISON_MAX, d.poison + w.poison * res(d, 'poison', t));
    if (w.bleed) d.bleed += w.bleed * res(d, 'bleed', t);
    if (w.sunder) d.sunder = Math.min(SUNDER_MAX, d.sunder + w.sunder * res(d, 'sunder', t));
    /* 控制：抗性縮短秒數（抗到 0 秒就不算） */
    const ctl = (k, ev, sec) => {
      const v = Math.round(sec * res(d, k, t) * 100) / 100;
      if (v <= 0) return;
      d[k] = Math.max(d[k], v);
      log(t, ai, ev, v, {});
    };
    if (w.weak && r() * 100 < w.weak) ctl('weak', 'weak', WEAK_T);
    if (w.blind && r() * 100 < w.blind) ctl('blind', 'blind', BLIND_T);
    if (w.freeze[0] && r() * 100 < w.freeze[0]) ctl('frozen', 'freeze', w.freeze[1]);
    if (w.stun[0] && r() * 100 < w.stun[0]) ctl('stun', 'stun', w.stun[1]);
  };
  /* 0.1.28 反制寵物：驅獸（敵人寵物傷害 -%）、獵人（敵人每隻寵物，自己武器傷害 +%） */
  for (let i = 0; i < 2; i++) {
    const a = S[i],
      d = S[1 - i],
      n = Math.min(5, d.w.filter(w => w.pet).length);
    if (a.F.petDown)
      for (const w of d.w)
        if (w.pet) w.dmg = w.dmg.map(v => Math.max(1, Math.round(v * (1 - Math.min(PETDOWN_MAX, a.F.petDown) / 100))));
    if (a.F.petHunt && n) for (const w of a.w) w.dmg = w.dmg.map(v => Math.round(v * (1 + (a.F.petHunt * n) / 100)));
  }
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
  /* 0.1.28 捕蟲網（星級最高的 N 隻寵物整場不能打）、殺蟲劑（最強的 3 隻寵物封鎖 N 秒） */
  const petRank = w => w.star * 100 + w.t * 10 + (w.dmg[0] + w.dmg[1]) / w.cd / 10;
  for (const k of ['petLock', 'petSeal'])
    for (let i = 0; i < 2; i++)
      for (const p of S[i].F.pre || []) {
        if (p.k !== k) continue;
        const c = S[1 - i].w.filter(w => w.pet && !(w.seal >= MAX_T)).sort((x, y) => petRank(y) - petRank(x));
        for (const w of c.slice(0, k === 'petLock' ? p.v : 3)) {
          const v = k === 'petLock' ? MAX_T : p.v;
          w.seal = Math.max(w.seal || 0, v);
          log(0, i, 'seal', v, { u: p.u, tu: w.u });
        }
      }
  /* 0.1.33 靜電場（開戰 N 秒封鎖敵人所有武器）、賄賂（整場封鎖敵人星級最高的一把） */
  for (let i = 0; i < 2; i++)
    for (const p of S[i].F.pre || []) {
      const d = S[1 - i];
      if (p.k === 'sealAll') {
        for (const w of d.w) w.seal = Math.max(w.seal || 0, p.v);
        if (d.w.length) log(0, i, 'sealAll', p.v, { u: p.u });
      } else if (p.k === 'lockBest') {
        const w = [...d.w].sort((x, y) => petRank(y) - petRank(x))[0];
        if (w) {
          w.seal = MAX_T;
          log(0, i, 'seal', MAX_T, { u: p.u, tu: w.u });
        }
      }
    }
  /* 0.1.33 先手射擊：星級最高的一把開戰先打一下 */
  for (let i = 0; i < 2; i++)
    if (S[i].F.firstStrike) {
      const w = [...S[i].w].filter(x => !(x.seal > 0)).sort((x, y) => petRank(y) - petRank(x))[0];
      if (w) attack(0, S[i], i, w);
    }
  /* 0.1.9 開戰丟出去的藥劑：對方直接吃到異常 */
  for (let i = 0; i < 2; i++)
    for (const p of S[i].F.pre || []) {
      if (['seal', 'down', 'petLock', 'petSeal', 'sealAll', 'lockBest'].includes(p.k)) continue;
      const d = S[1 - i],
        v = p.v * res(d, p.k, 0);
      if (p.k === 'weak' || p.k === 'blind' || p.k === 'frozen') d[p.k] = Math.max(d[p.k], v);
      else if (p.k === 'sunder') d.sunder = Math.min(SUNDER_MAX, d.sunder + v);
      else d[p.k] = p.k === 'poison' ? Math.min(POISON_MAX, d[p.k] + v) : d[p.k] + v;
      log(0, i, 'throw', Math.round(v * 10) / 10, { u: p.u, x: p.k });
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
          /* 0.1.10 連擊：有機率馬上再打一次；0.1.33 連珠箭：開戰 openDbl 秒內必定連擊；0.1.28 質變的連鎖（這一件自己的機率） */
          if (S[1 - i].hp > 0 && ((a.F.openDbl && t <= a.F.openDbl) || (a.F.double && r() * 100 < a.F.double)))
            attack(t, a, i, w);
          /* 0.1.33 閃電鏈：連鎖 N（每次攻擊多打 N 下） */
          for (let c = 0; c < (w.chainN || 0) && S[1 - i].hp > 0; c++) attack(t, a, i, w, CHAIN_DMG / 100);
          if (w.chain && S[1 - i].hp > 0 && r() * 100 < w.chain) attack(t, a, i, w);
        }
      }
      for (const s of a.s) {
        s.tt += SIM_DT * rate;
        if (s.tt >= s.cd) {
          s.tt -= s.cd;
          a.block = Math.min(a.max, a.block + s.block);
          log(t, i, 'block', s.block, { u: s.u });
          /* 0.1.28 尖刺（質變）：格擋時順便撞敵人（吃護甲） */
          if (s.bash) {
            const d = S[1 - i];
            hurt(
              t,
              Math.max(1, ((s.block * s.bash) / 100) * (50 / (50 + Math.max(-10, d.F.arm - d.sunder)))),
              d,
              i,
              'hit',
              {
                u: s.u,
                ab: 0,
                el: 'phys'
              }
            );
          }
          if (s.heal) {
            const h = Math.min(a.max - a.hp, healOf(a, s.heal));
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
          const pv = healOf(a, p.v);
          a.hp = Math.min(a.max, a.hp + pv);
          log(t, i, 'pot', Math.round(pv), { self: 1, u: p.u });
          /* 0.1.28 爆裂（質變）：喝藥水時炸敵人 */
          if (p.bomb) hurt(t, (p.v * p.bomb) / 100, S[1 - i], i, 'hit', { u: p.u, ab: 0, el: 'fire' });
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
        /* 0.1.29 淨化：每 CLEANSE_T 秒清掉最嚴重的 N 種異常（持續傷害先清） */
        if (a.F.cleanse && sec % CLEANSE_T === 0) {
          const ks = ['poison', 'burn', 'bleed', 'frozen', 'stun', 'weak', 'blind', 'sunder'].filter(k => a[k] > 0);
          for (const k of ks.slice(0, a.F.cleanse)) a[k] = 0;
          if (ks.length) log(t, i, 'cleanse', Math.min(ks.length, a.F.cleanse), { self: 1 });
        }
        if (a.F.regen && a.hp > 0 && a.hp < a.max) {
          const h = Math.min(a.max - a.hp, healOf(a, a.F.regen));
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
