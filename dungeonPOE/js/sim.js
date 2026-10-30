/* dungeonPOE · 自動戰鬥：純計算、固定亂數，輸出事件時間軸給畫面播放 */
'use strict';
/* 偽隨機：機率累積，滿 1 就觸發（平均機率一樣，不會連續不中或連續中；設計原則第 4 節） */
const prd = r => {
  const acc = {};
  return (key, pct) => {
    if (pct <= 0) return false;
    if (!(key in acc)) acc[key] = r();
    acc[key] += pct / 100;
    if (acc[key] >= 1) {
      acc[key] -= 1;
      return true;
    }
    return false;
  };
};
/* 怪物實例（戰鬥用）：base 是 mkFoe 產生的資料 */
const unitOf = f => ({
  ...f,
  wps: (f.wps || []).map(w => ({ ...w })),
  hp: f.mhp,
  t: f.cd * (0.5 + (f.i || 0) * 0.15),
  st: { burn: 0, poison: 0, bleed: 0, shock: 0, mark: 0 },
  dead: false
});
const DT = 0.1,
  TMAX = 60;
/* P：compile() 的結果，hp：現在的生命；foes：[怪物資料]；opt.amb：伏擊加傷 %、opt.curse：起始詛咒 */
function simulate(P, hp, foes, seed, opt = {}) {
  const r = rng(seed),
    ok = prd(r),
    ev = [],
    F = foes.map((f, i) => unitOf({ ...f, i })),
    me = { hp: Math.min(hp, P.mhp), mhp: P.mhp, sh: 0, st: { burn: 0, poison: 0, bleed: 0, shock: 0 } },
    cls = P.cls,
    cv = id => coreV(P, id),
    W = P.weapons.map(w => ({ ...w, t: w.cd * 0.4 })),
    S = P.shields.map(s => ({ ...s, t: s.cd })),
    pots = P.pots.map(p => ({ ...p })),
    used = [];
  let t = 0,
    curse = opt.curse || 0,
    stance = cls === 'ronin' ? cv('r_draw') : 0,
    guard = cls === 'knight' ? cv('k_hold') : 0,
    absorbed = 0,
    wolves = cls === 'tamer' ? 1 + cv('t_alpha') : 0,
    wolfT = 1.5,
    atkN = 0,
    shadowT = 0,
    rallyT = 6,
    waveT = 5,
    dotT = 1,
    dotN = 0,
    summonT = 7,
    enrageT = 9,
    enraged = 0,
    curseT = 6;
  const stMax = cls === 'ronin' ? cv('r_gale') || 5 : 0,
    guardMax = cls === 'knight' ? (P.cores.includes('k_hold') ? 30 : 20) : 0,
    guardPer = P.cores.includes('k_hold') ? 3 : 2,
    markMax = cls === 'assassin' ? cv('a_chain') || 8 : 0,
    wolfMax = cls === 'tamer' ? cv('t_wild') || 3 : 0,
    callN = cls === 'tamer' ? cv('t_call') || 6 : 0,
    log = (k, o) =>
      ev.push({ t: Math.round(t * 10) / 10, k, ...o, h: me.hp, sh: Math.round(me.sh), fh: F.map(f => f.hp) });
  if (cls === 'knight') me.sh = P.mhp * (0.1 + cv('k_wall') / 100);
  if (cls === 'assassin' && cv('a_mark')) F.forEach(f => (f.st.mark = cv('a_mark')));
  const alive = () => F.filter(f => !f.dead),
    front = () => alive()[0];
  const avgHit = () => {
    if (!W.length) return 2;
    return W.reduce((s, w) => s + ((w.dmg[0] + w.dmg[1]) / 2 + w.flat) * w.mul, 0) / W.length;
  };
  /* 對怪物造成傷害（共用：武器、狼、異常、反彈） */
  function hurt(f, v, src, crit) {
    if (!f || f.dead) return;
    v = Math.max(1, Math.round(v * (1 + Math.min(5, f.st.shock) * 0.08)));
    f.hp -= v;
    log('hit', { s: src, g: f.i, v, c: crit ? 1 : 0 });
    if (cls === 'pyro' && cv('p_end') && f.st.burn > 0 && f.hp > 0 && f.hp < f.mhp * (cv('p_end') / 100)) {
      log('fx', { g: f.i, n: '焚盡' });
      f.hp = 0;
    }
    if (f.hp <= 0) kill(f);
  }
  function kill(f) {
    f.dead = true;
    f.hp = 0;
    log('die', { g: f.i });
    if (cls === 'pyro' && cv('p_spark') && f.st.burn) {
      const n = front();
      if (n) {
        n.st.burn += Math.round((f.st.burn * cv('p_spark')) / 100);
        log('fx', { g: n.i, n: '星火' });
      }
    }
  }
  function applyOn(f, on, src) {
    for (const k in on) {
      if (!ok(src + k, on[k])) continue;
      if (k === 'freeze') {
        f.t += 1;
        log('ail', { g: f.i, a: 'freeze' });
      } else {
        f.st[k] += k === 'burn' ? 2 : 1;
        log('ail', { g: f.i, a: k });
      }
    }
  }
  function burnAdd(f, n) {
    f.st.burn += n;
    if (cls === 'pyro' && cv('p_burst') && f.st.burn >= 10) {
      const v = f.st.burn * cv('p_burst');
      f.st.burn = 0;
      log('fx', { g: f.i, n: '爆燃' });
      hurt(f, v, 'burst');
    }
  }
  function swing(w, extra = 1) {
    const f = front();
    if (!f) return;
    let v = (w.dmg[0] + r() * (w.dmg[1] - w.dmg[0]) + w.flat) * w.mul * (1 + (P.dmgPct + (opt.amb || 0)) / 100) * extra;
    let crit = ok('c' + w.u, w.crit),
      cd = 1.5 + (cls === 'assassin' ? cv('a_kill') / 100 : 0);
    if (cls === 'ronin') {
      if (stance >= stMax) {
        stance = 0;
        v *= cv('r_iron') || 3;
        log('fx', { g: f.i, n: '居合' });
        if (cv('r_mirror')) heal((P.mhp * cv('r_mirror')) / 100);
        if (cv('r_swallow') && extra === 1) queue.push(() => swing(w, cv('r_swallow')));
      } else stance++;
    }
    if (cls === 'knight') v *= 1 + (guard * guardPer) / 100;
    if (cls === 'assassin') {
      if (f.st.mark >= markMax) {
        crit = true;
        v *= 1 + f.st.mark * 0.05;
        if (cv('a_exec') && f.hp < f.mhp * (cv('a_exec') / 100)) v *= 2;
        f.st.mark = 0;
        log('fx', { g: f.i, n: '印記' });
        if (cv('a_shadow')) shadowT = cv('a_shadow');
      } else f.st.mark++;
    }
    if (crit) v *= cd;
    v = Math.max(1, v - (f.arm || 0));
    if (w.ls) heal((v * w.ls) / 100);
    hurt(f, v, w.u, crit);
    if (!f.dead) {
      applyOn(f, w.on, w.u);
      if (cls === 'pyro') burnAdd(f, 2 + cv('p_kindle'));
    }
    atkN++;
    if (cls === 'tamer' && atkN % callN === 0 && wolves < wolfMax) {
      wolves++;
      log('summon', { n: wolves });
    }
  }
  function heal(v) {
    v = Math.round(v);
    if (v <= 0 || me.hp >= me.mhp) return;
    me.hp = Math.min(me.mhp, me.hp + v);
    log('heal', { v });
  }
  /* 怪物打你 */
  /* w：怪物背包裡的武器（沒有就是牠自己的攻擊） */
  function strike(f, w) {
    let v = w ? (w.dmg[0] + r() * (w.dmg[1] - w.dmg[0]) + w.flat) * w.mul : f.atk[0] + r() * (f.atk[1] - f.atk[0]);
    if (w && ok('mc' + w.u, w.crit)) v *= 1.5;
    if (f.aff.includes('rage') && f.hp < f.mhp / 2) v *= 1.5;
    const dodge = P.dodge + (cls === 'ronin' ? stance * cv('r_eye') : 0) + (shadowT > 0 ? 40 : 0);
    if (ok('dodge', Math.min(75, dodge))) {
      log('miss', { s: f.i });
      return;
    }
    v = Math.max(1, v - P.arm);
    let red = 0;
    if (cls === 'knight') red += Math.min(40, guard * cv('k_firm'));
    if (cls === 'tamer') red += wolves * cv('t_guard');
    v *= (1 - Math.min(60, red) / 100) * (1 + curse * 0.15);
    v = Math.round(v);
    if (me.sh > 0) {
      const a = Math.min(me.sh, v);
      me.sh -= a;
      v -= a;
      if (cls === 'knight') {
        absorbed += a;
        while (absorbed >= 20 && guard < guardMax) {
          absorbed -= 20;
          guard++;
        }
      }
    }
    me.hp -= v;
    log('hurt', { s: f.i, v, u: w && w.u });
    if (f.aff.includes('vamp')) f.hp = Math.min(f.mhp, f.hp + v * 0.3);
    const on = w ? w.on : f.on || {};
    for (const k in on)
      if (ok('m' + f.i + (w ? w.u : '') + k, on[k])) {
        if (k === 'freeze') W.forEach(w => (w.t += 0.8));
        else me.st[k] += k === 'burn' ? 2 : 1;
        log('ail', { g: -1, a: k });
      }
    const th = P.thorns + (cls === 'knight' ? guard * cv('k_counter') : 0);
    if (th > 0) hurt(f, th, 'th');
    if (me.hp > 0 && me.hp < me.mhp * 0.4) {
      const p = pots.shift();
      if (p) {
        used.push(p.u);
        heal((me.mhp * p.heal) / 100);
        log('fx', { g: -1, n: '藥水', u: p.u });
      }
    }
  }
  const queue = [];
  log('start', {});
  while (t < TMAX && me.hp > 0 && alive().length) {
    t += DT;
    /* 武器 */
    for (const w of W) {
      w.t -= DT * (1 + P.spdPct / 100);
      if (w.t <= 0) {
        w.t += w.cd;
        swing(w);
        while (queue.length) queue.shift()();
      }
      if (!alive().length) break;
    }
    /* 盾 */
    for (const s of S) {
      s.t -= DT;
      if (s.t <= 0) {
        s.t += s.cd;
        me.sh += s.block;
        log('shield', { v: Math.round(s.block), u: s.u });
        if (s.heal) heal(s.heal);
        if (cls === 'knight' && cv('k_bash')) hurt(front(), s.block * cv('k_bash'), 'bash');
      }
    }
    /* 狼 */
    if (wolves) {
      wolfT -= DT;
      if (wolfT <= 0) {
        wolfT += 1.5;
        for (let k = 0; k < wolves; k++) {
          const f = front();
          if (!f) break;
          hurt(f, avgHit() * 0.4 * (1 + (P.dmgPct + cv('t_pack')) / 100), 'wolf');
          if (cv('t_bite') && !f.dead) f.st.bleed += cv('t_bite');
        }
      }
    }
    /* 職業的計時效果 */
    if (cls === 'knight' && cv('k_rally') && (rallyT -= DT) <= 0) {
      rallyT += 6;
      if (guard) {
        me.sh += guard * cv('k_rally');
        log('shield', { v: guard * cv('k_rally') });
      }
    }
    if (cls === 'pyro' && cv('p_wave') && (waveT -= DT) <= 0) {
      waveT += 5;
      alive().forEach(f => burnAdd(f, cv('p_wave')));
      log('fx', { g: -2, n: '熱浪' });
    }
    if (shadowT > 0) shadowT -= DT;
    /* 每秒：異常、再生 */
    if ((dotT -= DT) <= 0) {
      dotT += 1;
      dotN++;
      for (const f of alive()) {
        const d = f.st.burn + f.st.poison + f.st.bleed * 2 + (cls === 'assassin' ? f.st.mark * cv('a_venom') : 0);
        if (d > 0) {
          if (cls === 'pyro' && cv('p_life') && f.st.burn) heal((f.st.burn * cv('p_life')) / 100);
          hurt(f, d, 'dot');
        }
        /* 燃燒每 2 秒少 1 層（火法師才疊得起來） */
        if (f.st.burn && dotN % 2) f.st.burn--;
        if (f.st.bleed) f.st.bleed--;
        if (f.st.shock && r() < 0.5) f.st.shock--;
        if (f.st.poison && r() < 0.34) f.st.poison--;
      }
      const md = me.st.burn + me.st.poison + me.st.bleed * 2;
      if (md > 0) {
        me.hp -= md;
        log('hurt', { s: -1, v: md, dot: 1 });
        if (me.st.burn && dotN % 2) me.st.burn--;
        if (me.st.bleed) me.st.bleed--;
        if (me.st.poison && r() < 0.34) me.st.poison--;
      }
      if (P.regen > 0) heal(P.regen);
    }
    if (me.hp <= 0) break;
    /* 怪物 */
    for (const f of alive()) {
      f.t -= DT * (f.sk === 'enrage' && enraged > 0 ? 2 : 1);
      if (f.t <= 0) {
        f.t += f.cd;
        strike(f);
        if (me.hp <= 0) break;
      }
      for (const w of f.wps || []) {
        w.t = (w.t ?? w.cd * 0.6) - DT;
        if (w.t <= 0 && me.hp > 0) {
          w.t += w.cd;
          strike(f, w);
        }
      }
      if (me.hp <= 0) break;
    }
    /* 王的技能 */
    const boss = alive().find(f => f.sk);
    if (boss) {
      if (boss.sk === 'summon' && (summonT -= DT) <= 0) {
        summonT += 7;
        const m = unitOf({
          n: '迷途小鬼',
          sp: 'hungry_ghost',
          mhp: Math.round(boss.mhp * 0.06),
          atk: boss.atk.map(v => v * 0.3),
          cd: 1.4,
          arm: 0,
          aff: [],
          i: F.length
        });
        F.push(m);
        log('summon', { g: m.i, foe: { n: m.n, sp: m.sp, mhp: m.mhp } });
      }
      if (boss.sk === 'enrage') {
        if (enraged > 0) enraged -= DT;
        else if ((enrageT -= DT) <= 0) {
          enrageT += 9;
          enraged = 3;
          log('fx', { g: boss.i, n: '狂暴' });
        }
      }
      if (boss.sk === 'curse' && (curseT -= DT) <= 0) {
        curseT += 6;
        curse++;
        log('fx', { g: -1, n: '詛咒' });
      }
    }
  }
  me.hp = Math.max(0, Math.round(me.hp));
  const win = me.hp > 0 && !alive().length;
  log('end', { win: win ? 1 : 0 });
  return { win, hp: me.hp, t, ev, used, foes: F.map(f => ({ n: f.n, sp: f.sp, mhp: f.mhp, tier: f.tier })) };
}
/* 開打前的預估：同一場用 8 個種子跑，勝率與平均剩下的生命 */
function predict(P, hp, foes, seed, opt) {
  let w = 0,
    left = 0;
  for (let k = 0; k < 8; k++) {
    const s = simulate(P, hp, foes, h(seed, k, 77), opt);
    if (s.win) w++;
    left += s.hp;
  }
  return { win: w / 8, left: Math.round(left / 8) };
}
/* 危險等級（不給玩家看勝率數字：90% 輸了會很賭爛）：0 安全、1 小心、2 危險、3 致命 */
const DANGER = [
  { n: '安全', c: 'good', d: '輕鬆打贏' },
  { n: '小心', c: 'warn', d: '打得贏，但會掉不少血' },
  { n: '危險', c: 'heat', d: '可能會輸' },
  { n: '致命', c: 'bad', d: '很可能會輸' }
];
function danger(pr, mhp) {
  if (pr.win >= 0.95 && pr.left >= mhp * 0.5) return 0;
  if (pr.win >= 0.8) return 1;
  if (pr.win >= 0.4) return 2;
  return 3;
}
