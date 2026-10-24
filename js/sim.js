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
  /* 0.1.19 中毒不會退，戰鬥拉長以後會一直疊、太強：最多 12 層（0.1.37 毒師提高到 24，看攻擊方的 poisonCap） */
  POISON_MAX = 12,
  /* 0.1.37 新異常：劇毒（不退，每秒層數 ×2）、點燃（燃燒每秒 +1、傷害 ×1.5）、腐蝕（不能獲得護盾，本來會獲得時扣 CORRODE_HP）、
     衰老（不能暴擊）、混亂（出手 CONFUSE% 打到自己）；凍結、冰緩改成單件道具的狀態：凍結 FREEZE_T 秒充能 ×0（凍結中的不能再凍）、冰緩充能 ×0.5 */
  VENOM_MAX = 20,
  VENOM_MUL = 2,
  IGNITE_MUL = 1.5,
  CORRODE_HP = 30,
  CONFUSE = 50,
  FREEZE_T = 6,
  CHILL_T = 4,
  /* 0.1.37 陷阱：藥劑炸彈的傷害與流血 */
  BOMB_DMG = [8, 12],
  BOMB_BLEED = 4;
/* 一方的戰鬥狀態 */
function simSide(F) {
  return {
    F,
    hp: F.hp,
    max: F.hp,
    block: F.startBlock || 0,
    burn: 0,
    poison: 0,
    stun: 0,
    /* 0.1.9 新異常：流血（層數，每秒扣層數然後減半）、破甲（扣護甲，會疊）、虛弱（秒，傷害 -25%）、致盲（秒，30% 打不中） */
    bleed: 0,
    sunder: 0,
    weak: 0,
    blind: 0,
    /* 0.1.37 劇毒（層）、點燃（0／1）、腐蝕、衰老、混亂（秒）；傷害降低 %（腐蝕藥劑） */
    venom: 0,
    ignite: 0,
    corrode: 0,
    age: 0,
    confuse: 0,
    dmgDown: 0,
    /* 0.1.10 先手（opener）：開戰時武器已經充能幾 %；0.1.37 每件道具的凍結 fz、冰緩 ch（秒） */
    w: F.weapons.map((w, i) => ({
      ...w,
      i,
      fz: 0,
      ch: 0,
      tt: w.cd * Math.max(0.25, Math.min(0.99, (F.opener || 0) / 100))
    })),
    s: F.shields.map((s, i) => ({ ...s, i, fz: 0, ch: 0, tt: s.cd * 0.5 })),
    pots: F.pots.map(p => ({ ...p })),
    dmgDone: 0,
    /* 0.1.35 金錢標：身上的金幣、花掉的金幣；招架成功後多的護甲 */
    gold: F.gold || 0,
    spent: 0,
    parA: 0,
    parried: 0,
    /* 0.1.37 放在這個人背包裡的陷阱；這個人觸發的凍結＋冰緩次數（寒冰之心）；萬能藥的加成到幾秒 */
    traps: [],
    iceN: 0,
    /* 0.1.40 每件道具這場觸發了幾次（給道具詳細顯示「上一回合觸發 N 次」） */
    trig: {},
    buffT: 0,
    bDmg: 0,
    bSpd: 0,
    /* 0.1.50 身上被插的箭、要引爆的時間（爆裂箭）、撕裂（層）、被插的矛；連珠箭層數、浴血戰姬層數、
       復活過了沒、女武神；矛弓連攜（矛、弓各出手幾次、下一下 ×2）；日月輪轉現在是不是白天 */
    arrow: 0,
    boomQ: [],
    rend: 0,
    pin: 0,
    streak: 0,
    furyN: 0,
    rev: 0,
    valk: 0,
    cS: 0,
    cB: 0,
    bowX: 0,
    spearX: 0,
    sunP: 1,
    /* 0.1.51 身上的電荷、麻痺；放了幾次電、疾雷層數、雷神；爆燃後火命中 +1、火之化身；
       星星之火（著火的格子、上面的道具、蔓延計時；沒有背包的怪物 sparkM）；流星、雷暴雲、炎爆的計時；鳳凰涅槃用過了沒 */
    chg: 0,
    para: 0,
    zapN: 0,
    zapS: 0,
    god: 0,
    flashed: 0,
    avatarOn: 0,
    fireC: null,
    fireU: null,
    spT: 0,
    sparkM: 0,
    metT: 0,
    clT: 0,
    cbT: 0,
    phx: 0,
    /* 0.1.52 印記守護 3 級：下一次能盾擊的時間 */
    gT: 0,
    /* 0.1.53 馴獸師：撲殺過了沒、狂暴層數、馴獸鞭計時 */
    pnc: 0,
    frz: 0,
    wpT: 0
  };
}
/* 0.1.35 金錢標花 1 金那一下：傷害、暴擊率、命中效果、吸血都翻倍 */
function coinW(w) {
  const d = v => v * 2;
  return {
    ...w,
    dmg: w.dmg.map(d),
    crit: d(w.crit),
    burn: d(w.burn),
    poison: d(w.poison),
    bleed: d(w.bleed),
    sunder: d(w.sunder),
    ls: d(w.ls),
    weak: d(w.weak),
    blind: d(w.blind),
    venom: d(w.venom || 0),
    chill: d(w.chill || 0),
    freeze: [d(w.freeze[0]), w.freeze[1]],
    stun: [d(w.stun[0]), w.stun[1]]
  };
}
/* 0.1.37 時段加成（狂暴藥劑、致命毒素）：t 秒以前用 a，以後用 b */
function phaseOf(F, t) {
  const o = { dmgPct: 0, spd: 0, crit: 0 };
  for (const p of F.phase || []) {
    const x = t <= p.t ? p.a : p.b;
    for (const k in o) o[k] += x[k] || 0;
  }
  return o;
}
/* A 是你（左邊）、B 是對手；回傳 { win, t, ev: [事件], end: [A 剩生命, B 剩生命] } */
function simulate(FA, FB, seed) {
  const r = rng(seed),
    S = [simSide(FA), simSide(FB)],
    ev = [];
  const items = x => [...x.w, ...x.s];
  /* 0.1.40 記一次觸發：x 那邊給了加成 k 的道具都 +n */
  const tr = (x, k, n = 1) => {
    for (const u of (x.F.src || {})[k] || []) x.trig[u] = (x.trig[u] || 0) + n;
  };
  const log = (t, s, k, v, extra) =>
    ev.push({
      t: Math.round(t * 100) / 100,
      s,
      k,
      v,
      hp: [Math.max(0, Math.round(S[0].hp)), Math.max(0, Math.round(S[1].hp))],
      /* 異常（給畫面）：燃燒、中毒、流血、破甲、凍結中幾件、暈眩、虛弱、致盲、劇毒、點燃、腐蝕、衰老、冰緩中幾件、混亂 */
      st: S.map(x => [
        /* 0.1.29 抗性會讓層數有小數，顯示用無條件進位 */
        Math.ceil(x.burn),
        Math.ceil(x.poison),
        Math.ceil(x.bleed),
        Math.ceil(x.sunder),
        items(x).filter(o => o.fz > 0).length,
        +(x.stun > 0),
        +(x.weak > 0),
        +(x.blind > 0),
        Math.ceil(x.venom),
        x.ignite,
        +(x.corrode > 0),
        +(x.age > 0),
        items(x).filter(o => o.ch > 0).length,
        +(x.confuse > 0),
        /* 0.1.50 插箭、撕裂、插矛 */
        x.arrow,
        Math.ceil(x.rend),
        x.pin,
        /* 0.1.51 電荷、麻痺 */
        x.chg,
        Math.ceil(x.para)
      ]),
      /* 0.1.35 雙方的護盾（格擋量），戰鬥畫面的白色護盾條用 */
      bk: [Math.round(S[0].block), Math.round(S[1].block)],
      ...extra
    });
  const hurt = (t, d, def, src, k, extra) => {
    def.hp -= d;
    log(t, src, k, Math.round(d), extra);
    if (def.hp <= 0 && def.F.revive && !def.rev) revive(t, def);
  };
  /* 0.1.50 女武神降臨：第一次倒下時復活、清掉持續傷害，之後傷害、攻速提升、免疫暈眩凍結冰緩 */
  function revive(t, x) {
    x.rev = x.valk = 1;
    x.hp = (x.max * x.F.revive) / 100;
    for (const k of ['burn', 'poison', 'venom', 'bleed', 'rend', 'ignite']) x[k] = 0;
    log(t, S.indexOf(x), 'revive', Math.round(x.hp), { self: 1 });
    tr(x, 'revive');
  }
  /* 0.1.29 抗異常：k 是 d 身上的異常（burn、poison…），回傳抗完剩幾成；開戰免毒的秒數內不會中毒；
     0.1.37 賢者之石免疫所有異常、冰甲免疫凍結與冰緩 */
  const RK = {
    burn: 'rBurn',
    ignite: 'rBurn',
    poison: 'rPoison',
    venom: 'rPoison',
    bleed: 'rBleed',
    rend: 'rBleed',
    sunder: 'rSunder',
    frozen: 'rFreeze',
    chill: 'rFreeze',
    stun: 'rStun',
    para: 'rStun',
    weak: 'rWeak',
    age: 'rWeak',
    blind: 'rBlind',
    confuse: 'rBlind'
  };
  const res = (d, k, t) => {
    if (d.F.immAll) return tr(d, 'immAll'), 0;
    if ((k === 'frozen' || k === 'chill') && d.F.immFz) return tr(d, 'immFz'), 0;
    if ((k === 'poison' || k === 'venom') && t < (d.F.poisonImm || 0)) return tr(d, 'poisonImm'), 0;
    if (t < (d.F.immT || 0)) return 0;
    if (d.valk && (k === 'stun' || k === 'frozen' || k === 'chill' || k === 'para')) return 0;
    const v = Math.min(RES_MAX, d.F[RK[k]] || 0);
    if (v > 0) tr(d, RK[k]);
    return 1 - v / 100;
  };
  /* 回復（a 是誰回血）：敵人的詛咒繃帶會減少 */
  const healOf = (a, h) => {
    const o = S[1 - S.indexOf(a)];
    if (o.F.healCut) tr(o, 'healCut');
    return h * (1 - Math.min(RES_MAX, o.F.healCut || 0) / 100);
  };
  const heal = (t, a, i, v, extra = {}) => {
    const raw = healOf(a, v),
      h = Math.min(a.max - a.hp, raw);
    if (h > 0) {
      a.hp += h;
      log(t, i, 'heal', Math.round(h), { self: 1, ...extra });
    }
    /* 0.1.52 印記生命 2 級：回復超過上限的部分變成護盾 */
    if (a.F.sgLife >= 2 && raw - Math.max(0, h) > 0.5) gainBlock(t, a, i, raw - Math.max(0, h), null);
  };
  /* 0.1.37 獲得護盾：腐蝕中不能獲得，改成扣 CORRODE_HP 生命 */
  const gainBlock = (t, a, i, v, u) => {
    if (a.corrode > 0) return hurt(t, CORRODE_HP, a, 1 - i, 'corrode', { u });
    a.block = Math.min(a.max, a.block + v);
    /* 0.1.52 印記守護 3 級：獲得護盾時最強的武器立刻出手（每秒最多一次） */
    if (a.F.sgGuard >= 3 && t >= a.gT && a.hp > 0 && S[1 - i].hp > 0) {
      const w = a.w.filter(x => !(x.seal > 0) && !(x.fz > 0)).sort((x, y) => wPow(y) - wPow(x))[0];
      if (w) {
        a.gT = t + 1;
        log(t, i, 'sgBash', 0, { u: w.u, self: 1 });
        attack(t, a, i, w);
      }
    }
    return true;
  };
  /* 0.1.37 中毒、劇毒：上限看攻擊方（毒師 24、劇毒核心 40）；以毒為生：讓敵人中毒時自己也中毒（自己的中毒變回血） */
  const pCap = a => Math.max(POISON_MAX, a.F.poisonCap || 0),
    vCap = a => Math.max(VENOM_MAX, a.F.venomCap || 0);
  const addPoison = (a, d, n, t) => {
    if (!n) return;
    d.poison = Math.min(pCap(a), d.poison + n * res(d, 'poison', t));
    if (a.F.poisonLife && d !== a) a.poison = Math.min(pCap(a), a.poison + n);
  };
  const addVenom = (a, d, n, t) => {
    if (n) d.venom = Math.min(vCap(a), d.venom + n * res(d, 'venom', t));
  };
  /* 0.1.37 凍結／冰緩一件道具（di 是被凍的那邊）：凍結中的不能再凍；抗性縮短秒數；ai 那邊記一次（寒冰之心） */
  const freezeIt = (t, di, o, ai, sec = FREEZE_T) => {
    const d = S[di];
    if (!o || o.imm || o.fz > 0) return;
    const v = Math.round(sec * res(d, 'frozen', t) * 100) / 100;
    if (v <= 0) return;
    o.fz = v;
    S[ai].iceN++;
    log(t, ai, 'freeze', v, { tu: o.u });
  };
  const chillIt = (t, di, o, ai, sec = CHILL_T) => {
    const d = S[di];
    if (!o || o.imm) return;
    const v = Math.round(sec * res(d, 'chill', t) * 100) / 100;
    if (v <= 0) return;
    if (!(o.ch > 0)) log(t, ai, 'chill', v, { tu: o.u });
    o.ch = Math.max(o.ch, v);
    S[ai].iceN++;
  };
  const rndIt = (x, f) => {
    const c = items(x).filter(o => !o.imm && f(o));
    return c.length ? c[fl(r() * c.length)] : null;
  };
  /* 0.1.37 陷阱觸發：di 那邊的道具 u 出手時，蓋在它格子上的陷阱都觸發（每次都會） */
  const trapFire = (t, di, u) => {
    const d = S[di];
    /* 0.1.50 捕獸夾：那次出手落空（回傳 true），夾幾次後壞掉 */
    let cancel = false;
    /* 0.1.51 星星之火：著火格子上的道具出手，燃燒 +；怪物沒有背包，火苗隨時間變大 */
    if ((d.fireU && d.fireU.has(u)) || d.sparkM)
      d.burn += SPARK_BURN * (d.sparkM ? Math.min(1, t / 10) : 1) * res(d, 'burn', t);
    for (const p of d.traps) {
      if (!p.us.has(u)) continue;
      if (p.k === 'snare' && !(p.left > 0)) continue;
      const a = S[p.by];
      /* 0.1.47 每次觸發都記一筆（畫面讓那個陷阱閃一下）；i 是放陷阱時的編號 */
      log(t, p.by, 'trapHit', 0, { tu: u, x: p.k, ti: p.i });
      if (p.k === 'ignite') igniteIt(t, p.by, d, { tu: u });
      else if (p.k === 'bomb') {
        hurt(t, BOMB_DMG[0] + r() * (BOMB_DMG[1] - BOMB_DMG[0]), d, p.by, 'trap', { tu: u, x: 'bomb', el: 'fire' });
        d.bleed += BOMB_BLEED * res(d, 'bleed', t);
      } else if (p.k === 'spore') {
        addPoison(a, d, 3, t);
        addVenom(a, d, 3, t);
        log(t, p.by, 'trap', 0, { tu: u, x: 'spore' });
      } else if (p.k === 'icicle')
        freezeIt(
          t,
          di,
          items(d).find(o => o.u === u),
          p.by
        );
      else if (p.k === 'snare') {
        p.left--;
        cancel = true;
        d.bleed += SNARE_BLEED * res(d, 'bleed', t);
        log(t, p.by, 'trap', 0, { tu: u, x: 'snare', ...(p.left ? {} : { brk: 1 }) });
      } else if (p.k === 'net') {
        const v = Math.round(NET_STUN * res(d, 'stun', t) * 100) / 100;
        log(t, p.by, 'trap', 0, { tu: u, x: 'net' });
        if (v > 0) (d.stun = Math.max(d.stun, v)), log(t, p.by, 'stun', v, {});
      } else if (p.k === 'stake') {
        hurt(t, STAKE_DMG, d, p.by, 'trap', { tu: u, x: 'stake' });
        d.sunder = Math.min(SUNDER_MAX, d.sunder + STAKE_SUNDER * res(d, 'sunder', t));
        addRend(a, d, STAKE_REND, t);
      } else if (p.k === 'shock') {
        log(t, p.by, 'trap', 0, { tu: u, x: 'shock' });
        addPara(t, p.by, d, SHOCK_PARA);
        addCharge(t, p.by, d, SHOCK_CHG);
      }
    }
    return cancel;
  };
  /* 0.1.50 插箭（ai 插到 d 身上 n 支）：上限、爆裂箭排定引爆時間、倒鉤箭的流血 */
  const stickArrows = (t, ai, d, n) => {
    const a = S[ai];
    if (!n) return;
    d.arrow = Math.min(ARROW_MAX + (a.F.arrowCap || 0), d.arrow + n);
    if (a.F.boom) for (let k = 0; k < n; k++) d.boomQ.push(t + BOOM_T);
    if (a.F.barb) d.bleed += a.F.barb * n * res(d, 'bleed', t);
  };
  /* 0.1.50 撕裂：浴血戰姬 ×2 */
  const addRend = (a, d, n, t) => {
    if (n) d.rend += n * (a.F.rendX || 1) * res(d, 'rend', t);
  };
  const isDay = t => fl(t / SUN_T + 1e-6) % 2 === 0;
  /* 0.1.51 點燃（ai 點燃 d）：爆燃（那一刻爆炸、之後火命中 +1）、火之化身 */
  const igniteIt = (t, ai, d, extra = {}) => {
    if (d.ignite || res(d, 'ignite', t) <= 0) return;
    const a = S[ai];
    d.ignite = 1;
    log(t, ai, 'ignite', 1, extra);
    if (a.F.flash) {
      if (d.burn > 0) hurt(t, d.burn * a.F.flash, d, ai, 'flash', { el: 'fire' });
      a.flashed = 1;
      tr(a, 'flash');
    }
    if (a.F.avatar) (a.avatarOn = 1), log(t, ai, 'avatar', 1, { self: 1 }), tr(a, 'avatar');
  };
  /* 0.1.51 暈眩（ai 暈 d）：雷鳴（暈到敵人時你所有武器充能） */
  const stunIt = (t, ai, d, sec) => {
    const v = Math.round(sec * res(d, 'stun', t) * 100) / 100;
    if (v <= 0) return;
    d.stun = Math.max(d.stun, v);
    d.frz = 0;
    log(t, ai, 'stun', v, {});
    const a = S[ai];
    if (a.F.stunCharge && d !== a) {
      for (const x of a.w) x.tt = Math.min(x.cd * 0.99, x.tt + (x.cd * a.F.stunCharge) / 100);
      tr(a, 'stunCharge');
    }
  };
  /* 0.1.51 麻痺（每層攻速 -、每秒少 1 層）：癱瘓（滿了暈眩、清空） */
  const addPara = (t, ai, d, n) => {
    const a = S[ai];
    d.para = Math.min(PARA_MAX, d.para + n * res(d, 'para', t));
    if (a.F.palsy && d.para >= PARA_MAX - 1e-6) {
      d.para = 0;
      log(t, ai, 'palsy', PALSY_STUN, {});
      stunIt(t, ai, d, PALSY_STUN);
      tr(a, 'palsy');
    }
  };
  /* 0.1.51 電荷：雷神降臨後 ×2；滿了放電（超載要更多層） */
  const addCharge = (t, ai, d, n) => {
    const a = S[ai];
    if (!n || d.hp <= 0) return;
    d.chg += n * (a.god ? 2 : 1);
    if (d.chg >= (a.F.overload ? OVERLOAD_N : CHARGE_MAX)) zap(t, ai, d);
  };
  /* 放電：傷害、麻痺、暈眩；疾雷、雷神降臨、電磁脈衝、雷火 */
  function zap(t, ai, d) {
    const a = S[ai],
      ov = a.F.overload ? 1 : 0;
    d.chg = 0;
    a.zapN++;
    hurt(t, ZAP_DMG * (ov ? OVERLOAD_MUL : 1) * (1 + (a.F.zapPct || 0) / 100), d, ai, 'zap', { el: 'light', ov });
    if (d.hp <= 0) return;
    addPara(t, ai, d, ZAP_PARA);
    stunIt(t, ai, d, ov ? OVERLOAD_STUN : ZAP_STUN);
    if (a.F.zapSpd) a.zapS = Math.min(5, a.zapS + 1);
    if (a.F.thunderGod && !a.god && a.zapN >= GOD_N)
      (a.god = 1), log(t, ai, 'god', 1, { self: 1 }), tr(a, 'thunderGod');
    if (a.F.emp) {
      const w = d.w.filter(x => !x.imm).sort((x, y) => wPow(y) - wPow(x))[0];
      if (w) (w.seal = Math.max(w.seal || 0, a.F.emp)), log(t, ai, 'seal', a.F.emp, { tu: w.u }), tr(a, 'emp');
    }
    if (a.F.zapIgnite) igniteIt(t, ai, d);
  }
  /* mul：0.1.33 連鎖多打的那幾下傷害打折 */
  /* o：0.1.50 這一下的特殊效果（force 必定暴擊並無視護甲護盾、el3 元素箭袋輪到哪個、rend 多的撕裂、ctr 反擊、lk 連攜 ×2） */
  const attack = (t, a, ai, w, mul = 1, o = {}) => {
    /* 0.1.37 混亂：一半機率打到自己 */
    const self = a.confuse > 0 && r() * 100 < CONFUSE,
      d = self ? a : S[1 - ai],
      di = S.indexOf(d);
    /* 0.1.50 風之箭（sure）不會被閃避、招架；閃避成功：游擊充能、迴避反擊；沒打中連珠箭歸零 */
    const rr = self || w.sure ? 100 : r() * 100;
    if (rr < d.F.dodge + (a.blind > 0 ? BLIND_MISS : 0)) {
      a.streak = 0;
      if (d.F.dodge) tr(d, 'dodge');
      log(t, ai, 'miss', 0, { u: w.u });
      if (rr < d.F.dodge) {
        if (d.F.kite) for (const x of d.w) x.tt = Math.min(x.cd * 0.99, x.tt + (x.cd * d.F.kite) / 100);
        counter(t, di);
      }
      return;
    }
    /* 0.1.35 招架：有機率格擋這一下（不受傷害）；第一次成功後護甲 +parryArm */
    if (!self && !w.sure && d.F.parry && r() * 100 < d.F.parry) {
      a.streak = 0;
      if (d.F.parryArm && !d.parried) (d.parried = 1), (d.parA += d.F.parryArm);
      log(t, ai, 'miss', 0, { u: w.u, parry: 1 });
      return counter(t, di);
    }
    /* 0.1.35 金錢標：身上還有錢就花 1 金，這一下的數值翻倍 */
    if (w.coin && a.gold >= 1) {
      a.gold--;
      a.spent++;
      w = coinW(w);
    }
    const ph = phaseOf(a.F, t);
    let v = (w.dmg[0] + r() * (w.dmg[1] - w.dmg[0])) * mul;
    /* 0.1.37 衰老：不能暴擊 */
    /* 0.1.50 狙擊（必定暴擊）、血獵（敵人撕裂中暴擊率提升）、鷹眼（敵人每支箭暴擊傷害提升） */
    const cr = r() * 100,
      crit = !(a.age > 0) && (o.force || cr < w.crit + ph.crit + (a.F.huntCrit && d.rend > 0 ? a.F.huntCrit : 0)),
      cm = a.F.critMul + (a.F.critArrow || 0) * d.arrow;
    /* 0.1.29 厚皮：暴擊多出來的傷害減少 */
    if (crit) v *= 1 + (cm / 100 - 1) * (1 - Math.min(RES_MAX, d.F.critRes || 0) / 100);
    if (crit && d.F.critRes) tr(d, 'critRes');
    if (a.weak > 0) v *= 1 - WEAK_PCT / 100;
    /* 0.1.37 時段加成、萬能藥（喝藥水後幾秒）、腐蝕藥劑（整場傷害降低）、碎冰（敵人每件凍結中的道具） */
    v *= Math.max(0.1, 1 + ph.dmgPct / 100);
    if (a.buffT > t) v *= 1 + a.bDmg / 100;
    if (a.dmgDown) v *= Math.max(0, 1 - a.dmgDown / 100);
    if (a.F.shatterF && w.cold) v *= 1 + (a.F.shatterF * items(S[1 - ai]).filter(o => o.fz > 0).length) / 100;
    /* 0.1.10 處決（敵人生命低於 30%）、背水（自己生命低於 50%） */
    if (a.F.execute && d.hp < d.max * 0.3) v *= 1 + a.F.execute / 100;
    if (a.F.rage && a.hp < a.max * 0.5) v *= 1 + a.F.rage / 100;
    /* 0.1.50 插箭（敵人每支箭）、女武神、日月輪轉（白天矛）、浴血戰姬（被打中幾次） */
    if (a.F.arrowPct && d.arrow) v *= 1 + (a.F.arrowPct * d.arrow) / 100;
    if (a.valk) v *= 1 + VALK_DMG / 100;
    if (a.F.sunmoon && w.kind === 'spear' && isDay(t)) v *= 1 + a.F.sunmoon / 100;
    if (a.F.fury && w.kind && a.furyN) v *= 1 + (a.F.fury * a.furyN) / 100;
    /* 0.1.51 火之化身：不是火的武器傷害 +10% */
    if (a.avatarOn && w.el !== 'fire') v *= 1.1;
    /* 0.1.53 饕餮吞噬（這場累積）、檮杌（你受到的攻擊傷害 -%） */
    if (w.gb) v *= 1 + w.gb / 100;
    if (d.F.dr) v *= Math.max(0.2, 1 - d.F.dr / 100);
    /* 0.1.52 印記：幸運一擊（幸運道具 10% 傷害 ×3）、力量的重擊（o.hv） */
    const lucky = w.sgK && r() * 100 < 10;
    if (lucky) v *= 3;
    /* 0.1.28 穿甲：無視一部分護甲，那部分傷害也不會被格擋吃掉 */
    const pc = o.force ? 1 : (w.pierce || 0) / 100;
    const arm = d.F.arm + d.parA - d.sunder;
    v *= 50 / (50 + Math.max(-10, arm * (arm > 0 ? 1 - pc : 1)));
    v *= 1 + d.F.take / 100;
    /* 0.1.53 護主：被打時機率由寵物擋下一半，那隻寵物反咬 */
    let biter = null;
    if (!self && !inGd && d.F.petGuard && r() * 100 < d.F.petGuard) {
      const ps = d.w.filter(x => x.pet && !(x.seal > 0));
      if (ps.length) (biter = ps[fl(r() * ps.length)]), (v *= 0.5);
    }
    let ab = 0;
    if (d.block > 0) {
      ab = Math.min(d.block, v * (1 - pc));
      d.block -= ab;
      v -= ab;
      /* 0.1.52 印記守護 2 級：護盾被打破時反彈 */
      if (d.F.sgGuard >= 2 && d.block <= 0.5 && !self && !(w.pet && a.F.petNoThorns))
        hurt(t, 20, a, di, 'thorns', { sg: 1 });
    }
    v = Math.max(ab > 0 ? 0 : 1, v);
    hurt(t, v, d, ai, crit ? 'crit' : 'hit', {
      u: w.u,
      ab: Math.round(ab),
      el: w.el,
      ...(self ? { self: 1 } : {}),
      ...(o.ctr ? { ctr: 1 } : {}),
      ...(o.lk ? { lk: 1 } : {}),
      ...(o.ch ? { ch: 1 } : {}),
      ...(o.hv ? { hv: 1 } : {}),
      ...(lucky ? { luck: 1 } : {})
    });
    a.dmgDone += v;
    if (a.F.streak) a.streak = Math.min(STREAK_MAX, a.streak + 1);
    if (!self && d.F.fury && v > 0) d.furyN = Math.min(FURY_MAX, d.furyN + 1);
    if (crit && a.F.huntHeal && d.rend > 0 && a.hp > 0) heal(t, a, ai, a.F.huntHeal), tr(a, 'huntHeal');
    /* 0.1.28 守護（質變）：命中時獲得傷害一部分的格擋 */
    if (w.guard && v > 0) gainBlock(t, a, ai, (v * w.guard) / 100, w.u);
    /* 0.1.10 暴擊回血、被打中反彈 */
    if (crit && a.F.critHeal && a.hp > 0) heal(t, a, ai, a.F.critHeal), tr(a, 'critHeal');
    /* 0.1.53 馴獸師：寵物的攻擊不觸發反彈；共生（寵物命中回血）；狂暴（寵物命中疊層） */
    const noTh = w.pet && a.F.petNoThorns;
    if (w.pet && !self && v > 0) {
      if (a.F.symHeal && a.hp > 0) heal(t, a, ai, a.F.symHeal);
      if (a.F.frenzy) a.frz = Math.min(FRENZY_MAX, a.frz + 1);
    }
    if (biter && a.hp > 0 && d.hp > 0) {
      inGd = 1;
      log(t, di, 'petGuard', 0, { u: biter.u, self: 1 });
      attack(t, d, di, biter);
      inGd = 0;
    }
    if (!self) {
      if (d.F.thornsF && v > 0 && !noTh) hurt(t, d.F.thornsF, a, 1 - ai, 'thorns', {}), tr(d, 'thornsF');
      /* 0.1.37 毒刺皮膚：被打中時讓攻擊者中毒 */
      if (d.F.thornsP && v > 0) addPoison(d, a, d.F.thornsP, t);
      /* 0.1.51 火焰護體（攻擊者燃燒）、避雷針（機率電擊攻擊者） */
      if (d.F.thornsBurn && v > 0) a.burn += d.F.thornsBurn * res(a, 'burn', t);
      if (d.F.rod && v > 0 && !noTh && r() * 100 < d.F.rod) {
        hurt(t, ROD_DMG, a, 1 - ai, 'thorns', { rod: 1 });
        addCharge(t, 1 - ai, a, 1);
        tr(d, 'rod');
      }
      /* 格擋時反彈 */
      if (ab > 0 && !noTh) {
        const th = d.s.reduce((n, s) => n + s.thorns, 0);
        if (th) hurt(t, th, a, 1 - ai, 'thorns', {});
      }
      const ls = (w.ls + a.F.ls) / 100;
      if (ls > 0 && v > 0) heal(t, a, ai, v * ls);
    }
    if (!self) stickArrows(t, ai, d, w.stick);
    if (o.sub) return;
    /* 0.1.51 爆燃後火命中燃燒 +1；火之化身：不是火的武器命中燃燒 +2；電荷 */
    const xb = (a.flashed && w.el === 'fire' ? 1 : 0) + (a.avatarOn && w.el !== 'fire' ? 2 : 0);
    if (w.burn || xb) d.burn += (w.burn + xb) * res(d, 'burn', t);
    if (!self && w.charge) addCharge(t, ai, d, w.charge);
    /* 0.1.50 插箭、撕裂、插矛（插滿後下一次命中拔出：撕裂）、元素箭袋（燃燒 → 冰緩 → 中毒） */
    addRend(a, d, (w.rend || 0) + (o.rend || 0), t);
    if (w.pin && !self) {
      if (d.pin >= PIN_MAX) (d.pin = 0), addRend(a, d, PIN_REND, t), log(t, ai, 'pinOut', PIN_MAX, {});
      else d.pin = Math.min(PIN_MAX, d.pin + w.pin);
    }
    if (o.el3 === 1) d.burn += 2 * res(d, 'burn', t);
    else if (o.el3 === 2 && r() * 100 < 50)
      chillIt(
        t,
        di,
        rndIt(d, () => true),
        ai
      );
    else if (o.el3 === 0) addPoison(a, d, 1, t);
    addPoison(a, d, w.poison, t);
    addVenom(a, d, w.venom || 0, t);
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
    if (w.freeze[0] && r() * 100 < w.freeze[0])
      freezeIt(
        t,
        di,
        rndIt(d, o => !(o.fz > 0)),
        ai
      );
    if (w.chill && r() * 100 < w.chill)
      chillIt(
        t,
        di,
        rndIt(d, () => true),
        ai
      );
    /* 0.1.51 彈射（連鎖）的那幾下不會暈眩 */
    if (w.stun[0] && !o.ch && r() * 100 < w.stun[0]) stunIt(t, ai, d, w.stun[1]);
    /* 0.1.37 墮落蛇、別西卜：命中衰老、腐蝕 N 秒 */
    if (w.age) ctl('age', 'age', w.age);
    /* 0.1.53 四兇 */
    if (w.gorge && !self) w.gb = Math.min(GORGE_MAX, (w.gb || 0) + w.gorge);
    if (w.sealHit && !self && r() * 100 < w.sealHit[0]) {
      const x = rndIt(d, o => d.w.includes(o) && !(o.seal > 0));
      if (x) (x.seal = Math.max(x.seal || 0, w.sealHit[1])), log(t, ai, 'seal', w.sealHit[1], { u: w.u, tu: x.u });
    }
    if (w.chaos && !self) {
      const k = fl(r() * 6);
      if (k === 0) d.burn += 3 * res(d, 'burn', t);
      else if (k === 1) addPoison(a, d, 3, t);
      else if (k === 2) d.bleed += 4 * res(d, 'bleed', t);
      else if (k === 3) ctl('weak', 'weak', WEAK_T);
      else if (k === 4) ctl('blind', 'blind', BLIND_T);
      else ctl('confuse', 'confuse', 1);
    }
    if (w.corr) ctl('corrode', 'corrode', w.corr);
  };
  /* 0.1.50 迴避反擊：閃避、招架、盾格擋時，最強的一把矛（沒有矛就最強的武器）立刻反擊（反擊不會再引發反擊） */
  let inCtr = 0;
  const wPow = w => (w.dmg[0] + w.dmg[1]) / w.cd;
  const counter = (t, i) => {
    const a = S[i];
    if (!a.F.counter || inCtr || a.hp <= 0 || S[1 - i].hp <= 0) return;
    const c = a.w.filter(w => !(w.seal > 0) && !w.pet).sort((x, y) => wPow(y) - wPow(x)),
      w = c.find(x => x.kind === 'spear') || c[0];
    if (!w) return;
    inCtr = 1;
    tr(a, 'counter');
    attack(t, a, i, w, a.F.counter / 100, { rend: CTR_REND, ctr: 1 });
    inCtr = 0;
  };
  /* 0.1.50 一把武器出手一次：狙擊（每第 N 次）、元素箭袋輪替、矛弓連攜（×2）、多重射擊（射 N 支） */
  let inHv = 0,
    inGd = 0;
  const fire = (t, a, ai, w, mul = 1) => {
    const o = {};
    w.k = (w.k || 0) + 1;
    /* 0.1.52 印記力量：每第 4 次出手是重擊（×2）；2 級暈眩、3 級其他力量道具跟著出手 */
    const hv = w.sgM && w.k % 4 === 0;
    if (hv) (mul *= 2), (o.hv = 1);
    if (w.snipe && w.k % w.snipe === 0) o.force = 1;
    if (w.elem) o.el3 = w.k % 3;
    if (a.F.link3 && w.kind) {
      if (w.kind === 'bow' && a.bowX) (a.bowX = 0), (mul *= 2), (o.lk = 1);
      else if (w.kind === 'spear' && a.spearX) (a.spearX = 0), (mul *= 2), (o.lk = 1), (o.rend = LINK_REND);
      if (w.kind === 'spear' && ++a.cS >= a.F.link3) (a.cS = 0), (a.bowX = 1);
      if (w.kind === 'bow' && ++a.cB >= a.F.link3) (a.cB = 0), (a.spearX = 1);
    }
    const n = Math.max(1, w.shots || 1);
    /* 多射的箭（第 2 支起）只有傷害與插箭，不重複命中效果 */
    for (let c = 0; c < n && S[1 - ai].hp > 0; c++)
      attack(t, a, ai, w, mul * (n > 1 ? SHOT_DMG / 100 : 1), c ? { ...o, sub: 1, el3: -1 } : o);
    if (hv && S[1 - ai].hp > 0) {
      if (a.F.sgMight >= 2) stunIt(t, ai, S[1 - ai], 0.3);
      if (a.F.sgMight >= 3 && !inHv) {
        inHv = 1;
        for (const x of a.w)
          if (x !== w && x.sgM && !(x.seal > 0) && !(x.fz > 0) && S[1 - ai].hp > 0) fire(t, a, ai, x);
        inHv = 0;
      }
    }
  };
  /* 0.1.52 印記迅捷：出手後下一件迅捷道具充能（接力）；3 級 25% 再往下接 */
  const relay = (a, w) => {
    const l = a.w.filter(x => x.sgS);
    if (l.length < 2) return;
    const p = a.F.sgSwift >= 2 ? 35 : 20;
    let i = l.indexOf(w);
    for (let n = 0; n < l.length - 1; n++) {
      i = (i + 1) % l.length;
      const x = l[i];
      if (x !== w && !(x.seal > 0)) x.tt = Math.min(x.cd * 0.99, x.tt + (x.cd * p) / 100);
      if (!(a.F.sgSwift >= 3 && r() * 100 < 25)) break;
    }
  };
  /* 0.1.50 協同作戰：開戰召喚亞馬遜戰士，各自隨機繼承一把武器（不是寵物；複製一份、u 是 sm0、sm1，不在背包格子上） */
  for (let i = 0; i < 2; i++) {
    const a = S[i],
      c = a.w.filter(w => !w.pet),
      pool = [...c];
    for (let k = 0; k < (a.F.summon || 0) && c.length; k++) {
      if (!pool.length) pool.push(...c);
      const src = pool.splice(fl(r() * pool.length), 1)[0];
      a.w.push({ ...src, u: 'sm' + k, src: src.u, i: a.w.length });
      log(0, i, 'summon', k, { u: 'sm' + k, tu: src.u, id: src.id });
      tr(a, 'summon');
    }
  }
  /* 0.1.28 反制寵物：驅獸（敵人寵物傷害 -%）、獵人（敵人每隻寵物，自己武器傷害 +%） */
  for (let i = 0; i < 2; i++) {
    const a = S[i],
      d = S[1 - i],
      n = Math.min(5, d.w.filter(w => w.pet && !w.vw).length);
    if (a.F.petDown && n) tr(a, 'petDown', n);
    if (a.F.petHunt && n) tr(a, 'petHunt', n);
    if (a.F.petDown)
      for (const w of d.w)
        if (w.pet) w.dmg = w.dmg.map(v => Math.max(1, Math.round(v * (1 - Math.min(PETDOWN_MAX, a.F.petDown) / 100))));
    if (a.F.petHunt && n) for (const w of a.w) w.dmg = w.dmg.map(v => Math.round(v * (1 + (a.F.petHunt * n) / 100)));
  }
  /* 0.1.6 開戰前：降階、封鎖（打對方隨機一把武器）；0.1.37 免疫的（別西卜）不會被封鎖 */
  for (const k of ['down', 'seal'])
    for (let i = 0; i < 2; i++)
      for (const p of S[i].F.pre || []) {
        if (p.k !== k) continue;
        /* 0.1.35 降階的 v 是幾把（奸商 2 把） */
        for (let n = 0; n < (k === 'down' ? p.v || 1 : 1); n++) {
          const d = S[1 - i],
            c = d.w.filter(w => !w.imm && (k === 'down' ? w.t > 1 : !w.seal));
          if (!c.length) continue;
          const w = c[fl(r() * c.length)];
          if (k === 'down') {
            const m = TIERM[w.t - 1] / TIERM[w.t];
            w.dmg = w.dmg.map(v => Math.max(1, Math.round(v * m)));
            w.t--;
          } else w.seal = p.v;
          log(0, i, k, k === 'down' ? 1 : p.v, { u: p.u, tu: w.u });
        }
      }
  /* 0.1.28 捕蟲網（星級最高的 N 隻寵物整場不能打）、殺蟲劑（最強的 3 隻寵物封鎖 N 秒） */
  const petRank = w => w.star * 100 + w.t * 10 + (w.dmg[0] + w.dmg[1]) / w.cd / 10;
  for (const k of ['petLock', 'petSeal'])
    for (let i = 0; i < 2; i++)
      for (const p of S[i].F.pre || []) {
        if (p.k !== k) continue;
        const c = S[1 - i].w.filter(w => w.pet && !w.imm && !(w.seal >= MAX_T)).sort((x, y) => petRank(y) - petRank(x));
        /* 0.1.53 捕蟲網關住星級最高的 1 隻 N 秒（之前整場關住 N 隻）；殺蟲劑封鎖最強的 3 隻 N 秒 */
        for (const w of c.slice(0, k === 'petLock' ? 1 : 3)) {
          const v = p.v;
          w.seal = Math.max(w.seal || 0, v);
          log(0, i, 'seal', v, { u: p.u, tu: w.u });
        }
      }
  /* 0.1.33 靜電場（開戰 N 秒封鎖敵人所有武器）、賄賂（整場封鎖敵人星級最高的一把） */
  for (let i = 0; i < 2; i++)
    for (const p of S[i].F.pre || []) {
      const d = S[1 - i];
      if (p.k === 'sealAll') {
        for (const w of d.w) if (!w.imm) w.seal = Math.max(w.seal || 0, p.v);
        if (d.w.length) log(0, i, 'sealAll', p.v, { u: p.u });
      } else if (p.k === 'lockBest') {
        const w = [...d.w].filter(w => !w.imm).sort((x, y) => petRank(y) - petRank(x))[0];
        if (w) {
          w.seal = MAX_T;
          log(0, i, 'seal', MAX_T, { u: p.u, tu: w.u });
        }
      }
    }
  /* 0.1.37 陷阱：放進對方背包（1 格或 2 格，整個背包隨機、含空格）；怪物沒有背包，掛在隨機一把武器上 */
  for (let i = 0; i < 2; i++)
    for (const tp of S[i].F.traps || []) {
      const d = S[1 - i],
        G = d.F.grid;
      for (let n = 0; n < tp.n; n++) {
        let cells = [],
          us = new Set();
        if (G && G.w && G.h) {
          const x = fl(r() * G.w),
            y = fl(r() * G.h);
          cells.push([x, y]);
          if (tp.sz > 1) {
            const dir = [
              [1, 0],
              [0, 1],
              [-1, 0],
              [0, -1]
            ].filter(([dx, dy]) => x + dx >= 0 && y + dy >= 0 && x + dx < G.w && y + dy < G.h);
            if (dir.length) {
              const [dx, dy] = dir[fl(r() * dir.length)];
              cells.push([x + dx, y + dy]);
            }
          }
          const key = new Set(cells.map(c => c + ''));
          for (const u in G.at) if (G.at[u].some(c => key.has(c + ''))) us.add(u);
        } else if (d.w.length) us.add(d.w[fl(r() * d.w.length)].u);
        d.traps.push({ k: tp.k, by: i, us, i: d.traps.length, ...(tp.k === 'snare' ? { left: SNARE_N } : {}) });
        log(0, i, 'trapSet', tp.sz || 1, { x: tp.k, cells, tus: [...us], ti: d.traps.length - 1 });
      }
    }
  /* 0.1.50 箭雨：開戰射出「弓、弩數量 × N」支箭插在敵人身上；日月輪轉從白天開始 */
  for (let i = 0; i < 2; i++) {
    const a = S[i],
      n = a.F.rain ? a.w.filter(w => w.kind === 'bow' && !w.src).length * a.F.rain : 0;
    if (n) {
      stickArrows(0, i, S[1 - i], n);
      hurt(0, n * RAIN_DMG, S[1 - i], i, 'rain', { n });
      tr(a, 'rain');
    }
    if (a.F.sunmoon) log(0, i, 'sun', 1, { self: 1 });
    /* 0.1.51 星星之火：敵人背包隨機一格著火（怪物沒有背包：火苗隨時間變大）；引火：開戰點燃 */
    if (a.F.spark) {
      const d = S[1 - i],
        G = d.F.grid;
      if (G && G.w && G.h) {
        const x = fl(r() * G.w),
          y = fl(r() * G.h);
        d.fireC = new Set([x + ',' + y]);
        d.fireU = new Set(Object.keys(G.at).filter(u => G.at[u].some(c => c[0] === x && c[1] === y)));
        log(0, i, 'spark', 1, { cells: [[x, y]] });
      } else (d.sparkM = 1), log(0, i, 'spark', 1, {});
      tr(a, 'spark');
    }
    if (a.F.igniteStart) igniteIt(0, i, S[1 - i]);
    /* 0.1.52 印記幸運 3 級：擲骰，隨機一把 Ⅲ 階以下的武器這場升一階（傷害 ×3） */
    if (a.F.sgLuck >= 3) {
      const c = a.w.filter(w => w.t < TIER_MAX && !w.src);
      if (c.length) {
        const w = c[fl(r() * c.length)];
        w.dmg = w.dmg.map(v => v * (TIERM[w.t + 1] / TIERM[w.t]));
        w.t++;
        log(0, i, 'dice', w.t, { u: w.u, self: 1 });
      }
    }
  }
  /* 0.1.33 先手射擊：星級最高的一把開戰先打一下 */
  for (let i = 0; i < 2; i++)
    if (S[i].F.firstStrike) {
      const w = [...S[i].w].filter(x => !(x.seal > 0)).sort((x, y) => petRank(y) - petRank(x))[0];
      if (w) attack(0, S[i], i, w);
    }
  /* 0.1.9 開戰丟出去的藥劑：對方直接吃到異常；0.1.37 凍結 N 秒改成所有道具冰緩 N 秒，多了劇毒、腐蝕、衰老、混亂、傷害降低、
     凍結 N 把武器、自殘（N 把武器出手時自己吃劇毒） */
  const SKIP = ['seal', 'down', 'petLock', 'petSeal', 'sealAll', 'lockBest'];
  for (let i = 0; i < 2; i++)
    for (const p of S[i].F.pre || []) {
      if (SKIP.includes(p.k)) continue;
      const a = S[i],
        d = S[1 - i];
      if (p.k === 'frozen') {
        for (const o of items(d)) chillIt(0, 1 - i, o, i, p.v);
        log(0, i, 'throw', p.v, { u: p.u, x: 'chill' });
        continue;
      }
      if (p.k === 'freezeN') {
        for (let n = 0; n < p.v; n++)
          freezeIt(
            0,
            1 - i,
            rndIt(d, o => !(o.fz > 0) && d.w.includes(o)),
            i
          );
        continue;
      }
      if (p.k === 'selfV') {
        const c = d.w.filter(w => !w.imm && !w.selfV);
        for (let n = 0; n < (p.n || 1) && c.length; n++) c.splice(fl(r() * c.length), 1)[0].selfV = p.v;
        log(0, i, 'throw', p.v, { u: p.u, x: 'selfV' });
        continue;
      }
      if (p.k === 'dmgDown') {
        d.dmgDown = Math.min(90, d.dmgDown + p.v * (d.F.immAll ? 0 : 1));
        log(0, i, 'throw', p.v, { u: p.u, x: 'dmgDown' });
        continue;
      }
      const v = p.v * res(d, p.k, 0);
      if (['weak', 'blind', 'corrode', 'age', 'confuse'].includes(p.k)) d[p.k] = Math.max(d[p.k], v);
      else if (p.k === 'sunder') d.sunder = Math.min(SUNDER_MAX, d.sunder + v);
      else if (p.k === 'poison') d.poison = Math.min(pCap(a), d.poison + v);
      else if (p.k === 'venom') d.venom = Math.min(vCap(a), d.venom + v);
      else d[p.k] += v;
      log(0, i, 'throw', Math.round(v * 10) / 10, { u: p.u, x: p.k });
    }
  /* 0.1.37 致命毒素：時段結束後衰老（整場） */
  const ageAt = S.map(x => Math.min(MAX_T + 1, ...(x.F.phase || []).filter(p => p.b.age).map(p => p.t)));
  let t = 0,
    sec = 0,
    half = 0;
  while (t < MAX_T) {
    t += SIM_DT;
    for (let i = 0; i < 2; i++) {
      const a = S[i];
      if (t > ageAt[i] && !(a.age >= MAX_T)) a.age = MAX_T;
      for (const k of ['weak', 'blind', 'corrode', 'age', 'confuse']) if (a[k] > 0) a[k] -= SIM_DT;
      for (const o of items(a)) {
        if (o.fz > 0) o.fz -= SIM_DT;
        if (o.ch > 0) o.ch -= SIM_DT;
      }
      if (a.stun > 0) {
        a.stun -= SIM_DT;
        /* 0.1.27 暈眩時封鎖照樣倒數（之前會跟著暫停，暈眩＋凍結變得比說明強） */
        for (const w of a.w) if (w.seal > 0) w.seal -= SIM_DT;
        continue;
      }
      /* 0.1.10 越戰越快（ramp）：每 5 秒攻速 +N%，最多 5 次 */
      const ph = phaseOf(a.F, t),
        rate =
          (1 + (Math.min(5, fl(t / 5)) * (a.F.ramp || 0)) / 100) *
          (a.F.rushT && t <= a.F.rushT ? 1 + a.F.rushP / 100 : 1);
      /* 0.1.35 背水：生命低於 50% 時武器攻速提升；0.1.37 時段加成、萬能藥、碎冰（敵人每件冰緩中的道具，冰系武器攻速 +） */
      const wr =
          rate *
          (a.F.rageSpd && a.hp < a.max * 0.5 ? 1 + a.F.rageSpd / 100 : 1) *
          Math.max(0.1, 1 + ph.spd / 100) *
          (a.buffT > t ? 1 + a.bSpd / 100 : 1),
        shS = a.F.shatterS ? 1 + (a.F.shatterS * items(S[1 - i]).filter(o => o.ch > 0).length) / 100 : 1,
        /* 0.1.50 連珠箭、女武神、被插的矛（攻速 -）；日月輪轉：夜晚弓攻速 + */
        wr2 =
          wr *
          (a.F.streak ? 1 + (a.F.streak * a.streak) / 100 : 1) *
          (a.valk ? 1 + VALK_SPD / 100 : 1) *
          Math.max(0.1, 1 - (a.pin * PIN_SLOW) / 100) *
          /* 0.1.51 麻痺、疾雷、雷神、火之化身、熱浪（敵人的） */
          Math.max(0.1, 1 - (a.para * PARA_SLOW) / 100) *
          (a.zapS ? 1 + (a.zapS * a.F.zapSpd) / 100 : 1) *
          (a.god ? 1 + GOD_SPD / 100 : 1) *
          (a.avatarOn ? 1 + a.F.avatar / 100 : 1) *
          (S[1 - i].F.heat ? Math.max(0.4, 1 - (fl(a.burn / 5) * S[1 - i].F.heat) / 100) : 1),
        night = a.F.sunmoon && !isDay(t);
      if (a.F.sunmoon && +!night !== a.sunP) (a.sunP = +!night), log(t, i, 'sun', a.sunP, { self: 1 });
      /* 0.1.37 凍結：充能 ×0；冰緩：×0.5 */
      const ice = o => (o.fz > 0 ? 0 : o.ch > 0 ? 0.5 : 1);
      for (const w of a.w) {
        if (w.seal > 0) {
          w.seal -= SIM_DT;
          continue;
        }
        w.tt +=
          SIM_DT *
          wr2 *
          ice(w) *
          (w.cold ? shS : 1) *
          (night && w.kind === 'bow' ? 1 + a.F.sunmoon / 100 : 1) *
          (w.sgL && a.F.sgLife >= 3 && a.hp < a.max * 0.3 ? 2 : 1) *
          /* 0.1.53 撲殺之後寵物攻速 ×2、狂暴 */
          (w.pet && a.pnc ? 2 : 1) *
          (w.pet && a.frz ? 1 + (a.frz * a.F.frenzy) / 100 : 1);
        /* 0.1.53 召喚的戰狼解封時記一筆（畫面跳「戰狼加入」） */
        if (w.vw && !w.joined && !(w.seal > 0)) (w.joined = 1), log(t, i, 'wolf', w.vw, { u: w.u, self: 1 });
        if (w.tt >= w.cd) {
          w.tt -= w.cd;
          /* 0.1.51 靜電場（敵人的）：機率觸電，這次落空、電荷 +1 */
          const so = S[1 - i];
          if (so.F.static && r() * 100 < so.F.static) {
            log(t, 1 - i, 'static', 0, { tu: w.u });
            addCharge(t, 1 - i, a, 1);
            tr(so, 'static');
            if (a.hp <= 0) break;
            continue;
          }
          /* 0.1.37 出手：先觸發蓋在它上面的陷阱、自殘的劇毒；0.1.50 被捕獸夾夾到這次落空 */
          const miss = trapFire(t, i, w.u);
          if (w.selfV) addVenom(S[1 - i], a, w.selfV, t);
          /* 0.1.51 自焚（敵人的）：點燃中出手扣燃燒層數的一部分 */
          if (so.F.selfBurn && a.ignite && a.burn > 0)
            hurt(t, (a.burn * so.F.selfBurn) / 100, a, 1 - i, 'dot', { el: 'fire', sb: 1 });
          if (a.hp <= 0) break;
          if (miss) continue;
          fire(t, a, i, w);
          if (w.sgS) relay(a, w);
          /* 0.1.53 群狼戰術：寵物出手時其他寵物充能 */
          if (a.F.pack && w.pet)
            for (const x of a.w)
              if (x.pet && x !== w && !(x.seal > 0)) x.tt = Math.min(x.cd * 0.99, x.tt + (x.cd * a.F.pack) / 100);
          /* 0.1.50 戰舞：矛出手時弓充能、弓出手時矛充能 */
          if (a.F.link && w.kind)
            for (const x of a.w)
              if (x.kind && x.kind !== w.kind && !(x.seal > 0))
                x.tt = Math.min(x.cd * 0.99, x.tt + (x.cd * a.F.link) / 100);
          /* 0.1.10 連擊：有機率馬上再打一次；0.1.33 連珠箭：開戰 openDbl 秒內必定連擊；0.1.28 質變的連鎖（這一件自己的機率）；
             0.1.35 連鎖追擊（triple：再打兩下）、雙手大師（這一件自己的連擊機率 dbl） */
          const dc = (a.F.double || 0) + (w.dbl || 0);
          if (S[1 - i].hp > 0 && a.F.triple && r() * 100 < a.F.triple)
            for (let c = 0; c < 2 && S[1 - i].hp > 0; c++) fire(t, a, i, w);
          else if (S[1 - i].hp > 0 && ((a.F.openDbl && t <= a.F.openDbl) || (dc && r() * 100 < dc))) fire(t, a, i, w);
          /* 0.1.33 閃電鏈：連鎖 N（每次攻擊多打 N 下） */
          for (let c = 0; c < (w.chainN || 0) && S[1 - i].hp > 0; c++) attack(t, a, i, w, CHAIN_DMG / 100, { ch: 1 });
          if (w.chain && S[1 - i].hp > 0 && r() * 100 < w.chain) attack(t, a, i, w);
        }
      }
      for (const s of a.s) {
        s.tt += SIM_DT * rate * ice(s);
        if (s.tt >= s.cd) {
          s.tt -= s.cd;
          if (trapFire(t, i, s.u)) continue;
          if (gainBlock(t, a, i, s.block, s.u)) log(t, i, 'block', s.block, { u: s.u }), counter(t, i);
          /* 0.1.28 尖刺（質變）：格擋時順便撞敵人（吃護甲） */
          if (s.bash) {
            const d = S[1 - i];
            hurt(
              t,
              Math.max(1, ((s.block * s.bash) / 100) * (50 / (50 + Math.max(-10, d.F.arm + d.parA - d.sunder)))),
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
          if (s.heal) heal(t, a, i, s.heal, { u: s.u });
        }
      }
      for (const p of a.pots)
        if (p.n > 0 && a.hp > 0 && a.hp < (a.max * p.at) / 100) {
          p.n--;
          trapFire(t, i, p.u);
          tr(a, 'potMul');
          const pv = healOf(a, p.v),
            over = a.hp + pv - a.max;
          a.hp = Math.min(a.max, a.hp + pv);
          /* 0.1.54 印記生命 2 級：藥水溢出的回復也變護盾 */
          if (a.F.sgLife >= 2 && over > 0.5) gainBlock(t, a, i, over, p.u);
          log(t, i, 'pot', Math.round(pv), { self: 1, u: p.u });
          /* 0.1.28 爆裂（質變）：喝藥水時炸敵人 */
          if (p.bomb) hurt(t, (p.v * p.bomb) / 100, S[1 - i], i, 'hit', { u: p.u, ab: 0, el: 'fire' });
          /* 0.1.37 萬能藥：喝下時獲得護盾、幾秒內傷害與攻速提升 */
          if (a.F.potBuff) {
            gainBlock(t, a, i, a.F.potBuff[0], p.u);
            a.buffT = t + a.F.potBuff[1];
            a.bDmg = Math.max(a.bDmg, a.F.potBuff[2]);
            a.bSpd = Math.max(a.bSpd, a.F.potBuff[3]);
          }
          /* 0.1.37 終極藥劑的效果 */
          if (p.ex) brewFx(t, a, i, p);
        }
    }
    /* 0.1.51 火法師、雷法師的定時效果（i 是放的人、o 是敵人） */
    for (let i = 0; i < 2; i++) {
      const a = S[i],
        o = S[1 - i];
      if (a.hp <= 0 || o.hp <= 0) continue;
      /* 0.1.53 撲殺（敵人第一次低於 30%：寵物全部出手一次）、馴獸鞭（每 N 秒最慢的寵物出手 ×2） */
      if (a.F.pounce && !a.pnc && o.hp < o.max * 0.3) {
        a.pnc = 1;
        log(t, i, 'pounce', 0, { self: 1 });
        for (const x of a.w) if (x.pet && !(x.seal > 0) && o.hp > 0) fire(t, a, i, x);
        tr(a, 'pounce');
      }
      if (a.F.whip && (a.wpT += SIM_DT) >= a.F.whip - 1e-6) {
        a.wpT = 0;
        const x = a.w.filter(x => x.pet && !(x.seal > 0) && !(x.fz > 0)).sort((p, q) => q.cd - p.cd)[0];
        if (x) log(t, i, 'whip', 0, { u: x.u, self: 1 }), fire(t, a, i, x, 2), tr(a, 'whip');
      }
      if (a.F.meteor && (a.metT += SIM_DT) >= (o.ignite ? METEOR_FAST : METEOR_T) - 1e-6) {
        a.metT = 0;
        hurt(t, a.F.meteor, o, i, 'meteor', { el: 'fire' });
        o.burn += METEOR_BURN * res(o, 'burn', t);
        tr(a, 'meteor');
      }
      if (a.F.cloud && (a.clT += SIM_DT) >= CLOUD_T - 1e-6) {
        a.clT = 0;
        hurt(t, a.F.cloud, o, i, 'bolt', { el: 'light' });
        addCharge(t, i, o, 1);
        tr(a, 'cloud');
      }
      if (a.F.combust && (a.cbT += SIM_DT) >= COMBUST_T - 1e-6) {
        a.cbT = 0;
        const n = fl(o.burn);
        if (n > 0) {
          hurt(t, n * a.F.combust * (o.ignite ? IGNITE_MUL : 1), o, i, 'combust', { el: 'fire', n });
          tr(a, 'combust');
        }
      }
      if (a.F.igniteAt && !o.ignite && o.burn >= a.F.igniteAt) igniteIt(t, i, o);
      if (a.F.burnout && o.hp > 0 && o.burn > 0 && o.hp < o.burn * a.F.burnout) {
        hurt(t, o.hp, o, i, 'burnout', { el: 'fire' });
        tr(a, 'burnout');
      }
      if (a.F.phoenix && !a.phx && a.hp > 0 && a.hp < a.max * 0.3) {
        a.phx = 1;
        for (const k of [
          'burn',
          'poison',
          'venom',
          'bleed',
          'rend',
          'ignite',
          'stun',
          'weak',
          'blind',
          'confuse',
          'age',
          'corrode',
          'para'
        ])
          a[k] = 0;
        log(t, i, 'phoenix', 1, { self: 1 });
        heal(t, a, i, Math.ceil(o.burn) * a.F.phoenix);
        tr(a, 'phoenix');
      }
      /* 星星之火蔓延：著火的格子往上下左右多 1 格 */
      if (o.fireC && (o.spT += SIM_DT) >= SPARK_T - 1e-6) {
        o.spT = 0;
        const G = o.F.grid,
          add = [];
        for (const k of o.fireC) {
          const [x, y] = k.split(',').map(Number);
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
          ]) {
            const nx = x + dx,
              ny = y + dy,
              nk = nx + ',' + ny;
            if (
              nx >= 0 &&
              ny >= 0 &&
              nx < G.w &&
              ny < G.h &&
              !o.fireC.has(nk) &&
              !add.some(c => c + '' === nx + ',' + ny)
            )
              add.push([nx, ny]);
          }
        }
        if (add.length) {
          for (const c of add) o.fireC.add(c + '');
          for (const u in G.at) if (G.at[u].some(c => o.fireC.has(c + ''))) o.fireU.add(u);
          log(t, i, 'spark', add.length, { cells: add });
        }
      }
    }
    /* 0.1.50 爆裂箭：插上 BOOM_T 秒的箭引爆（固定傷害＋燃燒）；撕裂：每 0.5 秒扣層數、之後剩 3/4 */
    for (let i = 0; i < 2; i++) {
      const a = S[i],
        o = S[1 - i];
      let n = 0;
      while (a.boomQ.length && a.boomQ[0] <= t + 1e-6) a.boomQ.shift(), n++;
      if (n && a.hp > 0) {
        hurt(t, n * o.F.boom, a, 1 - i, 'boom', { n, el: 'fire' });
        a.burn += n * BOOM_BURN * res(a, 'burn', t);
        tr(o, 'boom', n);
      }
    }
    if (fl(t * 2 + 1e-6) > half) {
      half = fl(t * 2 + 1e-6);
      for (let i = 0; i < 2; i++) {
        const a = S[i];
        if (a.rend > 0) {
          hurt(t, a.rend, a, 1 - i, 'dot', { el: 'rend' });
          a.rend = fl(a.rend * REND_KEEP);
        }
      }
    }
    /* 每秒：燃燒（每秒 -1 層；點燃時 +1 層、傷害 ×1.5）、中毒（不會退）、劇毒（不退，×2）、回復、疲勞 */
    if (fl(t + 1e-6) > sec) {
      sec = fl(t + 1e-6);
      for (let i = 0; i < 2; i++) {
        const a = S[i],
          o = S[1 - i];
        if (a.burn > 0) {
          const bd = a.burn * (a.ignite ? IGNITE_MUL : 1);
          hurt(t, bd, a, 1 - i, 'dot', { el: 'fire' });
          /* 0.1.51 灼命：敵人燃燒的傷害回復你 */
          if (o.F.burnLeech && o.hp > 0) heal(t, o, 1 - i, (bd * o.F.burnLeech) / 100), tr(o, 'burnLeech');
          a.burn += a.ignite ? 1 : -1;
        }
        if (a.para > 0) a.para = Math.max(0, a.para - 1);
        /* 0.1.37 以毒為生：自己身上的中毒變成回血 */
        if (a.poison > 0) {
          if (a.F.poisonLife) heal(t, a, i, a.poison, { el: 'poison' });
          else hurt(t, a.poison, a, 1 - i, 'dot', { el: 'poison' });
        }
        if (a.venom > 0) hurt(t, a.venom * VENOM_MUL, a, 1 - i, 'dot', { el: 'venom' });
        if (a.bleed > 0) {
          hurt(t, a.bleed, a, 1 - i, 'dot', { el: 'bleed' });
          a.bleed = fl(a.bleed / 2);
        }
        /* 0.1.37 劇毒核心：敵人中毒滿層後每 2 秒 +1 劇毒；毒師的腐蝕：每 N 秒讓敵人腐蝕 N 秒 */
        if (o.F.p2v && sec % 2 === 0 && a.poison >= pCap(o) - 0.01) addVenom(o, a, 1, t);
        if (o.F.corrodeRe && (sec - 1) % o.F.corrodeRe === 0) {
          const v = o.F.corrodeRe * res(a, 'corrode', t);
          if (v > 0) a.corrode = Math.max(a.corrode, v);
        }
        /* 0.1.29 淨化：每 CLEANSE_T 秒清掉最嚴重的 N 種異常（持續傷害先清） */
        if (a.F.cleanse && sec % CLEANSE_T === 0) {
          const ks = [
            'venom',
            'poison',
            'burn',
            'rend',
            'bleed',
            'stun',
            'para',
            'corrode',
            'weak',
            'age',
            'blind',
            'confuse',
            'sunder'
          ].filter(k => a[k] > 0);
          for (const k of ks.slice(0, a.F.cleanse)) a[k] = 0;
          if (ks.length) log(t, i, 'cleanse', Math.min(ks.length, a.F.cleanse), { self: 1 }), tr(a, 'cleanse');
        }
        if (a.F.regen && a.hp > 0 && a.hp < a.max) heal(t, a, i, a.F.regen, { regen: 1 }), tr(a, 'regen');
        if (sec >= FATIGUE_T) hurt(t, 2 * (sec - FATIGUE_T + 1), a, 1 - i, 'fatigue', {});
      }
    }
    if (S[0].hp <= 0 || S[1].hp <= 0) break;
  }
  /* 0.1.37 終極藥劑：喝下時依序套用煉成選的效果 */
  function brewFx(t, a, i, p) {
    const d = S[1 - i];
    for (const k of p.ex) {
      const B = BREW[k];
      if (!B) continue;
      if (B.heal) heal(t, a, i, B.heal, { u: p.u });
      if (B.block) gainBlock(t, a, i, B.block, p.u);
      if (B.buff) {
        a.buffT = Math.max(a.buffT, t + B.buff[0]);
        a.bDmg = Math.max(a.bDmg, B.buff[1]);
        a.bSpd = Math.max(a.bSpd, B.buff[2]);
      }
      if (B.regen) a.F = { ...a.F, regen: (a.F.regen || 0) + B.regen };
      if (B.cleanse)
        for (const k2 of [
          'venom',
          'poison',
          'burn',
          'bleed',
          'rend',
          'stun',
          'corrode',
          'weak',
          'age',
          'blind',
          'confuse'
        ])
          a[k2] = 0;
      if (B.poison) addPoison(a, d, B.poison, t);
      if (B.venom) addVenom(a, d, B.venom, t);
      if (B.burn) d.burn += B.burn * res(d, 'burn', t);
      if (B.ignite) igniteIt(t, i, d);
      if (B.chill) for (const o of items(d)) chillIt(t, 1 - i, o, i, B.chill);
      if (B.age) d.age = Math.max(d.age, B.age * res(d, 'age', t));
    }
  }
  /* 同時倒下：剩比較多血的贏；完全一樣算對手贏 */
  const win = S[1].hp <= 0 && (S[0].hp > 0 || S[0].hp > S[1].hp);
  return {
    win,
    t,
    ev,
    end: [Math.max(0, Math.round(S[0].hp)), Math.max(0, Math.round(S[1].hp))],
    max: [S[0].max, S[1].max],
    /* 0.1.35 金錢標花掉的金幣；0.1.37 各自觸發的凍結＋冰緩次數（寒冰之心） */
    spent: [S[0].spent, S[1].spent],
    ice: [S[0].iceN, S[1].iceN],
    /* 0.1.40 每件道具觸發了幾次：角色加成的觸發＋有標道具的事件（攻擊、格擋、喝藥水、開戰效果、陷阱） */
    trig: S.map((x, i) => {
      const o = { ...x.trig };
      for (const e of ev)
        if (e.s === i && e.u && !['dot', 'heal', 'thorns', 'fatigue', 'corrode'].includes(e.k))
          o[e.u] = (o[e.u] || 0) + 1;
      return o;
    })
  };
}
