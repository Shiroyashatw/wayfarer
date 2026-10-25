/* 塞令老師 · 機器人的腦（0.1.20）：所有決定（買、擺、賣、合成、升背包、刷新、三選一）都用「戰力分數」評估，
   不寫死道具或職業，新道具、新體系只要 compileBag 算得出數值，機器人就會用。
   戰力 ≈ 每秒傷害 × 有效生命（兩邊互打時，誰先把對方打死）；習慣（存多少錢、多常刷新、何時升背包…）是 BOT_P 參數，
   用 tools/bot_train.js 自我對打調出來（skill bot-ai）。run.js 之後載入。 */
'use strict';
/* 訓練出來的參數（tools/bot_train.js 會覆寫這一段） */
let BOT_P = {
  gainMin: 0.023, // 一件道具至少要讓戰力提升這個比例才買
  perGold: 0.007, // 每 1 金至少要換到多少戰力（比例）
  reserve: 34, // 想留著吃利息的錢（後期才存）
  reserveFrom: 9, // 第幾回合開始存利息
  rollGold: 3, // 錢多於這個、又沒東西好買就刷新
  maxRolls: 8, // 一回合最多刷新幾次
  lvFill: 0.97, // 背包塞到幾成滿就考慮升級
  lvKeep: 3, // 升級後至少留幾金
  sellMargin: 0.037, // 賣掉舊的換新的，戰力至少要多這個比例
  mergeBonus: 0.123, // 湊合成的額外偏好（還沒湊滿也先收）
  dotW: 0.5, // 燃燒、中毒、流血每層的價值（約幾秒）
  ctrlW: 1.084, // 暈眩、凍結、虛弱、致盲的價值倍率
  lowHp: 12, // 0.1.72 生命剩這麼少就不存利息錢
  resW: 1.339, // 0.1.72 抗異常、抗暴擊（擋掉對手幾成傷害）的權重
  nemW: 1.988, // 0.1.72 被同一個人打敗：評估對手時他的權重多幾倍（每輸一次 +nemW，慢慢淡掉）
  synW: 0.03, // 0.1.74 羈絆進度（還差幾件到下一個門檻）的價值
  ehpW: 1.581 // 有效生命的指數（戰力 = 每秒傷害 × 有效生命^ehpW）
};
/* 0.1.72 職業挑選：每個職業在每個主題池、每個賽制的平均名次跟全體平均差多少（負的比較強），
   tools/bot_cls.js 用菁英機器人對局統計後寫回（--write 會覆寫這一段）。開局三選一挑「職業本身＋這個主題＋這個賽制」加起來最強的 */
let BOT_CLS = {
  archer: [
    0.33,
    { m: 0.17, c: 0.08, z: -0.14, f: -0.02 },
    {
      legacy: 0.36,
      caravan: 0.03,
      curse: 0.21,
      dual: 0.24,
      sigil: -0.09,
      gale: -0.19,
      astro: 0.03,
      shape: -0.52,
      tarot: -0.03
    }
  ],
  swordsman: [
    0.27,
    { g: -0.23, m: 0.25, c: -0.23, z: 0.24, f: 0.05 },
    { legacy: -0.26, caravan: 0.16, curse: 0.45, relic: -0.08, sigil: 0.03, gale: 0.05, astro: 0.06, shape: -0.39 }
  ],
  berserker: [
    0.62,
    { g: 0.16, m: -0.08, c: -0.09, z: 0.09, f: 0.06 },
    { legacy: 0.04, curse: 0.37, relic: 0.03, dual: -0.09, gale: 0.13, astro: 0.14, shape: -0.36, tarot: -0.12 }
  ],
  spearman: [
    0,
    { g: -0.64, m: 0.35, c: -0.04, z: 0.15, f: 0.12 },
    {
      legacy: 0.33,
      caravan: -0.16,
      curse: -0.36,
      relic: 0.11,
      dual: 0.05,
      sigil: 0.12,
      gale: 0.14,
      astro: 0.05,
      shape: -0.12,
      tarot: -0.08
    }
  ],
  assassin: [
    0.17,
    { g: 0.24, m: -0.19, c: 0.36, z: -0.19, f: -0.15 },
    {
      legacy: 0.41,
      caravan: 0.03,
      curse: -0.23,
      relic: -0.3,
      dual: -0.14,
      sigil: -0.09,
      gale: -0.13,
      astro: 0.1,
      shape: 0.45
    }
  ],
  pyro: [
    -0.26,
    { g: -0.16, m: 0.49, c: 0.02, z: -0.22, f: -0.3 },
    { curse: -0.57, relic: 0.2, sigil: 0.56, astro: -0.28, shape: 0.12, tarot: 0.08 }
  ],
  cryo: [
    0.19,
    { g: 0.39, m: 0.25, c: 0.11, z: -0.04, f: -0.66 },
    { legacy: 0.12, caravan: -0.04, curse: 0.14, relic: -0.13, dual: 0.03, gale: 0.09, shape: -0.03, tarot: -0.15 }
  ],
  storm: [
    -0.62,
    { g: 0.29, m: -0.58, c: 0.1, z: -0.46, f: 0.7 },
    { legacy: -0.15, curse: -0.08, dual: -0.13, sigil: -0.1, gale: -0.27, shape: 0.23, tarot: 0.28 }
  ],
  venom: [
    -0.21,
    { g: -0.07, m: -0.04, c: -0.12, z: 0.06, f: 0.12 },
    {
      legacy: -0.16,
      caravan: -0.22,
      curse: 0.06,
      relic: -0.03,
      dual: -0.07,
      sigil: 0.2,
      gale: 0.14,
      astro: 0.1,
      shape: 0.04,
      tarot: -0.07
    }
  ],
  tamer: [
    0.33,
    { g: 0.31, m: -0.37, c: -0.33, z: -0.03, f: 0.65 },
    {
      legacy: -0.21,
      caravan: 0.07,
      curse: -0.13,
      relic: 0.22,
      dual: -0.16,
      sigil: 0.12,
      gale: 0.1,
      astro: -0.08,
      shape: 0.38,
      tarot: -0.17
    }
  ],
  knight: [
    0.02,
    { g: -0.42, m: 0.1, c: -0.03, z: 0.26, f: 0.07 },
    {
      legacy: -0.23,
      caravan: -0.04,
      curse: -0.08,
      relic: -0.02,
      dual: 0.26,
      sigil: -0.11,
      gale: -0.03,
      astro: -0.1,
      shape: 0.21,
      tarot: 0.14
    }
  ],
  alchemist: [
    -0.6,
    { g: -0.07, m: -0.05, c: 0.04, z: 0.19, f: -0.25 },
    {
      legacy: -0.07,
      caravan: 0.15,
      curse: 0.18,
      relic: -0.11,
      dual: 0.05,
      sigil: -0.36,
      gale: -0.14,
      astro: 0.08,
      shape: -0.09
    }
  ],
  merchant: [
    -0.28,
    { g: 0.16, m: 0.13, c: 0.09, f: -0.4 },
    {
      legacy: 0.04,
      caravan: 0.06,
      curse: 0.08,
      relic: 0.14,
      dual: -0.07,
      sigil: -0.44,
      gale: -0.23,
      astro: 0.11,
      shape: 0.04,
      tarot: 0.07
    }
  ]
};
function botClass(opts, mode, theme) {
  const sc = c => {
    const t = BOT_CLS[c];
    if (!t) return 0;
    return t[0] + ((t[1] || {})[theme] || 0) + ((t[2] || {})[mode] || 0);
  };
  return opts.map(c => [c, sc(c)]).sort((a, b) => a[1] - b[1])[0][0];
}
/* 換職業（還沒開始的一局）：清掉起手道具、換成新職業的 */
function botSetCls(run, cls) {
  run.bag.cls = cls;
  run.bag.items = [];
  run.bench = Array(BENCH_N).fill(null);
  giveStarter(run);
}
/* ================= 戰力分數 ================= */
/* 0.1.28 對手平均有幾隻寵物（反制寵物的道具照這個估價）；simLobby 每回合照其他機器人的背包設 run.epet */
let BOT_EPET = 1;
/* 0.1.29 對手每種異常、回復、暴擊大約佔他強度的比例（0～0.6；0.1.72 從 0.3 放寬），抗異常的道具照這個估價；run.eres 沒有就用這組平均值。
   0.1.72 arm：對手的護甲、護盾有多厚（穿甲、破甲照這個估價） */
const BOT_ERES0 = {
  burn: 0.05,
  poison: 0.05,
  bleed: 0.05,
  sunder: 0.03,
  frozen: 0.03,
  stun: 0.03,
  weak: 0.02,
  blind: 0.02,
  heal: 0.04,
  crit: 0.04,
  arm: 0.1
};
let BOT_ERES = BOT_ERES0;
/* 一個背包對別人的威脅：每種異常（以及吸血回復、暴擊）大約佔它強度的比例 */
function botThreat(F) {
  const o = {
    burn: 0,
    poison: 0,
    bleed: 0,
    sunder: 0,
    frozen: 0,
    stun: 0,
    weak: 0,
    blind: 0,
    heal: 0,
    crit: 0,
    arm: 0
  };
  let tot = 0.01;
  for (const w of F.weapons) {
    const sp = 1 / Math.max(0.3, w.cd),
      avg = ((w.dmg[0] + w.dmg[1]) / 2) * sp;
    tot += avg;
    o.burn += (w.burn || 0) * sp * 1.5;
    o.poison += (w.poison || 0) * sp * 2;
    /* 0.1.74 撕裂也算流血（抗流血擋撕裂） */
    o.bleed += ((w.bleed || 0) + (w.rend || 0) * 2 + (w.rendEv || 0) / 1.5) * sp;
    o.sunder += (w.sunder || 0) * sp * 0.5;
    o.frozen += (((w.freeze ? w.freeze[0] * FREEZE_T * 0.3 : 0) + (w.chill || 0) * CHILL_T * 0.08) / 100) * avg;
    o.poison += (w.venom || 0) * sp * 4;
    o.stun += ((w.stun ? w.stun[0] * w.stun[1] * 2 : 0) / 100) * avg;
    o.weak += ((w.weak || 0) / 100) * avg * 0.5;
    o.blind += ((w.blind || 0) / 100) * avg * 0.5;
    o.heal += (((w.ls || 0) + (F.ls || 0)) / 100) * avg;
    o.crit += ((w.crit || 0) / 100) * avg * 0.6;
  }
  o.heal += (F.regen || 0) + F.pots.reduce((n, p) => n + (p.v * p.n) / 20, 0);
  for (const k in o) o[k] = Math.min(0.6, o[k] / tot);
  /* 護甲每 50 點、護盾每秒擋的量佔自己生命的比例 */
  o.arm = Math.min(
    0.6,
    Math.max(0, F.arm || 0) / 50 +
      (F.shields.reduce((n, x) => n + (x.block || 0) / Math.max(0.6, x.cd), 0) / Math.max(20, F.hp)) * 4
  );
  return o;
}
function botPower(F, P = BOT_P) {
  let dps = 0,
    gd = 0;
  const ep = BOT_EPET;
  const cm = (F.critMul || 160) / 100;
  /* 0.1.50 撕裂（一層一共約扣 4 倍，比流血強）、每秒插幾支箭、矛／弓的數量（亞馬遜的連攜、戰舞） */
  const rendW = 2 * (F.rendX || 1);
  let arrowRate = 0,
    rendSrc = 0,
    /* 0.1.51 每秒幾個電荷、有沒有燃燒來源 */
    chgRate = 0,
    burnSrc = 0;
  /* 每把武器一下的期望傷害（齒輪、連鎖機關用） */
  const HIT = new Map();
  const nS = F.weapons.filter(w => w.kind === 'spear').length,
    nB = F.weapons.filter(w => w.kind === 'bow').length;
  for (const w of F.weapons) {
    const avg = (w.dmg[0] + w.dmg[1]) / 2,
      crit = Math.min(100, w.crit || 0) / 100;
    /* 0.1.50 多重射擊：傷害是 N 支 × SHOT_DMG%，命中效果只有一次；狙擊：每第 N 次必暴擊 */
    let hit = avg * (1 + crit * (cm - 1)) * (w.shots > 1 ? (w.shots * SHOT_DMG) / 100 : 1);
    if (w.snipe) hit *= 1 + 0.35 / w.snipe;
    arrowRate += ((w.stick || 0) * Math.max(1, w.shots || 1)) / Math.max(0.3, w.cd);
    if (w.rend || w.pin || w.rendEv) rendSrc++;
    chgRate += ((w.charge || 0) * (1 + (w.chainN || 0))) / Math.max(0.3, w.cd);
    if (w.burn) burnSrc++;
    hit += ((w.rend || 0) + (w.pin ? PIN_REND / (PIN_MAX + 1) : 0)) * rendW * P.dotW;
    if (w.pin) hit *= 1.15;
    if (w.elem) hit = hit * 1.3 + 3 * P.dotW;
    if (w.sure) hit *= 1.05;
    /* 0.1.53 四兇：吞噬、命中封鎖、隨機異常 */
    if (w.gorge) hit *= 1.3;
    if (w.sealHit) hit *= 1 + (w.sealHit[0] / 100) * w.sealHit[1] * 0.15 * P.ctrlW;
    if (w.chaos) hit += 2 * P.dotW;
    /* 0.1.37 劇毒不退、每秒 ×2；中毒上限高（毒師）多算一點 */
    hit +=
      ((w.burn || 0) +
        (w.poison || 0) * 1.4 * (F.poisonCap > POISON_MAX ? 1.3 : 1) +
        (w.bleed || 0) * 0.7 +
        (w.venom || 0) * 2.6) *
      P.dotW;
    /* 0.1.72 破甲、穿甲：對手越硬越值錢 */
    hit *= 1 + (w.sunder || 0) * 0.02 * (1 + 2 * BOT_ERES.arm);
    const ctrl =
      /* 0.1.37 凍結：一件道具 6 秒不能充能；冰緩：一件 4 秒減半；衰老：命中就衰老幾秒 */
      ((w.stun ? w.stun[0] * w.stun[1] : 0) +
        (w.freeze ? w.freeze[0] * FREEZE_T * 0.3 : 0) +
        (w.chill || 0) * CHILL_T * 0.08 +
        (w.weak || 0) * 0.75 +
        (w.blind || 0) * 0.75 +
        (w.age || 0) * 8 +
        (w.corr || 0) * 6) /
      100;
    hit *= 1 + ctrl * 0.4 * P.ctrlW;
    /* 0.1.74 狂戰士：狂血（一場平均少 4 成生命：斧、鎚攻速、吸血）、戰意沸騰、撕裂猛擊、碎骨（無視護盾，對手越硬越值錢） */
    const bl = w.bz ? (F.blood || 0) * (F.selfCut ? 1.6 : 1) : 0;
    hit *= 1 + ((w.ls || 0) + bl * BLOOD_LS * 4) / 200;
    if (bl) hit *= 1 + (bl * BLOOD_SPD * 4) / 100;
    if (w.bz && F.bzFury) hit *= 1 + 0.08 * F.bzFury;
    if (w.rendEv) hit += (w.rendEv / REND_EV) * rendW * P.dotW;
    if (w.shPierce) hit *= 1 + (w.shPierce / 100) * BOT_ERES.arm;
    /* 0.1.28 質變：連鎖、穿甲、守護 */
    hit *=
      (1 + (w.chain || 0) / 100) *
      (1 + (w.pierce || 0) * 0.004 * (1 + 2 * BOT_ERES.arm)) *
      (1 + ((w.chainN || 0) * CHAIN_DMG) / 100);
    /* 0.1.35 雙手大師（這一件的連擊）、金錢標（開戰時的錢夠打大半場才算翻倍） */
    hit *= 1 + (w.dbl || 0) / 100;
    /* 0.1.62 機關城：每第 N 次多打 k 下；開戰幾秒後才啟動（雷電砲台、詛咒・沉睡的 seal） */
    if (w.nth) hit *= 1 + w.nth[1] / w.nth[0];
    if (w.seal && !w.vw) hit *= Math.max(0.4, 1 - w.seal / 20);
    HIT.set(w.u, hit);
    if (w.coin) hit *= 1 + Math.min(1, (F.gold || 0) / 15);
    /* 0.1.53 召喚的戰狼開戰後才陸續加入，算一半 */
    dps += (hit / Math.max(0.3, w.cd)) * (w.vw ? 0.5 : 1);
    if (w.guard) gd += ((hit * w.guard) / 100 / Math.max(0.3, w.cd)) * 9;
  }
  /* 0.1.62 齒輪（出手時其他相鄰武器充能 p%）、連鎖機關（每秒最多帶動一件相鄰的武器出手） */
  for (const w of F.weapons) {
    if (w.gear) for (const u of w.gear.us) dps += ((HIT.get(u) || 0) * w.gear.p) / 100 / Math.max(0.3, w.cd);
    if (w.drv && w.drv.length) dps += (HIT.get(w.drv[0]) || 0) / Math.max(1, w.cd);
  }
  for (const s of F.shields) if (s.bash) dps += (s.block * s.bash) / 100 / Math.max(0.6, s.cd);
  /* 0.1.50 協同作戰：多了 N 把平均的武器 */
  if (F.summon && F.weapons.length) dps *= 1 + F.summon / Math.max(2, F.weapons.filter(w => !w.pet).length);
  /* 0.1.50 插箭：一場平均插著幾支（上限）、每支傷害 +%、爆裂箭（固定傷害＋燃燒）、倒鉤（流血）、鷹眼（暴擊傷害）、箭雨（開戰的箭） */
  const rainN = F.rain ? nB * F.rain : 0;
  if (arrowRate || rainN) {
    const avgA = Math.min(ARROW_MAX + (F.arrowCap || 0), rainN + arrowRate * 6);
    dps *= 1 + ((F.arrowPct || 0) * avgA + (F.critArrow || 0) * avgA * 0.3) / 100;
    dps += arrowRate * ((F.boom || 0) + (F.boom ? BOOM_BURN * 2 * P.dotW : 0)) * 0.75;
    dps += arrowRate * (F.barb || 0) * 1.2 * P.dotW;
    dps += (rainN * (RAIN_DMG + (F.boom || 0) + (F.barb || 0) * 0.7 * P.dotW)) / 6;
  }
  /* 0.1.50 亞馬遜：矛弓連攜（另一種的下一下 ×2）、戰舞（互相充能）、反擊、血獵、日月輪轉、浴血戰姬、連珠箭、游擊 */
  if (F.link3 && nS && nB) dps *= 1.4;
  if (F.link && nS && nB) dps *= 1 + (F.link / 100) * Math.min(nS, nB) * 1.2;
  if (F.counter) dps *= 1 + (((F.dodge || 0) + (F.parry || 0)) / 100 + F.shields.length * 0.08) * (F.counter / 100);
  if (F.huntCrit && rendSrc) dps *= 1 + (F.huntCrit / 100) * 1.2 * (cm - 1);
  if (F.sunmoon) dps *= 1 + (F.sunmoon / 100) * 0.45;
  if (F.fury) dps *= 1 + (F.fury * 8) / 100;
  if (F.streak) dps *= 1 + (F.streak * 6) / 100;
  if (F.kite) dps *= 1 + ((F.dodge || 0) / 100) * (F.kite / 100) * 2;
  /* 0.1.51 雷法師：放電（每秒幾次 × 傷害、暈眩、麻痺）、雷暴雲、超載、疾雷、雷神、雷鳴、電磁脈衝、雷火、靜電場 */
  if (F.cloud) (dps += F.cloud / CLOUD_T), (chgRate += 1 / CLOUD_T);
  const zapR = chgRate / (F.overload ? OVERLOAD_N : CHARGE_MAX);
  if (zapR) {
    const ov = F.overload ? OVERLOAD_MUL : 1;
    dps += zapR * ZAP_DMG * ov * (1 + (F.zapPct || 0) / 100);
    dps *= 1 + Math.min(0.6, zapR * ((F.overload ? OVERLOAD_STUN : ZAP_STUN) + ZAP_PARA * 0.04) * 0.6 * P.ctrlW);
    if (F.palsy) dps *= 1.08;
    if (F.thunderGod) dps *= 1.25;
    if (F.zapSpd) dps *= 1 + (F.zapSpd * 3) / 100;
    if (F.stunCharge) dps *= 1 + (F.stunCharge / 100) * Math.min(1, zapR * 2);
    if (F.emp) dps *= 1 + Math.min(0.25, zapR * F.emp * 0.1);
    if (F.zapIgnite) dps *= 1.1;
  }
  if (F.static) dps *= 1 + (F.static / 100) * 1.2;
  /* 0.1.52 印記：照有印記的武器佔幾成估（力量重擊、迅捷接力、幸運一擊）；守護、生命算進有效生命 */
  const nW = Math.max(1, F.weapons.length),
    sh = k => F.weapons.filter(w => w[k]).length / nW;
  if (F.sgMight) dps *= 1 + sh('sgM') * (0.25 + (F.sgMight >= 2 ? 0.08 : 0) + (F.sgMight >= 3 ? 0.2 : 0));
  if (F.sgSwift) dps *= 1 + sh('sgS') * (F.sgSwift >= 2 ? 0.3 : 0.17) * (F.sgSwift >= 3 ? 1.3 : 1);
  if (F.sgLuck) dps *= (1 + sh('sgK') * 0.2) * (F.sgLuck >= 3 ? 1.15 : 1);
  if (F.sgGuard >= 3) dps *= 1.12;
  /* 0.1.53 馴獸師：群狼戰術、撲殺、狂暴、馴獸鞭（寵物佔幾成） */
  const nP = F.weapons.filter(w => w.pet).length,
    pS = nP / nW;
  if (F.pack && nP > 1) dps *= 1 + (F.pack / 100) * (nP - 1) * 0.5 * pS;
  if (F.pounce && nP) dps *= 1 + 0.15 * pS;
  if (F.frenzy && nP) dps *= 1 + ((F.frenzy * 8) / 100) * pS;
  if (F.whip && nP) dps *= 1.08;
  /* 0.1.51 火法師：點燃（職業）、爆燃、流星火雨、焚盡、自焚、火之化身、引火、炎爆、熱浪、星星之火 */
  if (burnSrc || F.meteor || F.spark) {
    if (F.igniteAt) dps *= 1.12;
    if (F.flash) dps *= 1.12;
    if (F.burnout) dps *= 1.2;
    if (F.selfBurn) dps *= 1.12;
    if (F.avatar) dps *= 1.18;
    /* 0.1.62 引爆照層數算（羈絆、煉獄之火會疊） */
    if (F.combust) dps *= 1 + 0.08 * Math.min(3, F.combust);
    if (F.heat) dps *= 1.1;
  }
  if (F.meteor) dps += (F.meteor + METEOR_BURN * 2 * P.dotW) / METEOR_T;
  if (F.igniteStart) dps *= 1.15;
  if (F.spark) dps *= 1.2;
  for (const p of F.pots) if (p.bomb) dps += (p.v * p.n * p.bomb) / 100 / 15;
  if (F.petHunt) dps *= 1 + (F.petHunt * Math.min(5, ep)) / 100;
  dps *= 1 + (F.double || 0) / 100 + ((F.triple || 0) * 2) / 100;
  /* 0.1.33 連珠箭（開戰 N 秒必定連擊，一場大約 15 秒）、先手射擊 */
  if (F.openDbl) dps *= 1 + Math.min(1, F.openDbl / 15) * 0.8;
  if (F.firstStrike) dps *= 1.04;
  dps *=
    1 +
    ((F.execute || 0) * 0.25 +
      (F.rage || 0) * 0.3 +
      (F.rageSpd || 0) * 0.3 +
      (F.ramp || 0) * 1.5 +
      (F.opener || 0) * 0.05) /
      100;
  if (F.rushT) dps *= 1 + (F.rushP / 100) * Math.min(1, F.rushT / 9);
  /* 0.1.37 時段加成（一場大約 15 秒，看前 15 秒）、碎冰、以毒為生、劇毒滿層轉換、萬能藥 */
  for (const p of F.phase || []) {
    const f = Math.min(1, p.t / 15);
    dps *=
      Math.max(0.3, 1 + ((p.a.dmgPct || 0) + (p.a.spd || 0) * 0.8) / 100) * f +
      Math.max(0.3, 1 + ((p.b.dmgPct || 0) + (p.b.spd || 0) * 0.8) / 100) * (1 - f);
  }
  if (F.shatterF)
    dps *= 1 + Math.min(2, F.weapons.filter(w => w.cold).length * 0.15) * (F.shatterF / 100 + F.shatterS / 200);
  if (F.p2v) dps *= 1.1;
  if (F.potBuff && F.pots.length) dps *= 1 + (F.potBuff[2] + F.potBuff[3]) / 400;
  /* 0.1.35 招架：格擋機率像閃避，第一次成功後的護甲算一半 */
  let ehp =
    (F.hp * (1 + Math.max(-10, (F.arm || 0) + (F.parry ? (F.parryArm || 0) / 2 : 0)) / 50)) /
    (1 - Math.min(40, F.dodge || 0) / 100) /
    (1 - Math.min(40, F.parry || 0) / 100);
  for (const s of F.shields)
    ehp += (s.block / Math.max(0.6, s.cd)) * 9 + (s.heal / Math.max(0.6, s.cd)) * 9 + s.thorns * 3;
  ehp += (F.regen || 0) * 9 + (F.startBlock || 0) + (F.thornsF || 0) * 6 + (F.critHeal || 0) * 4 + (F.thornsP || 0) * 8;
  /* 0.1.50 女武神降臨：多一條命（復活的生命）＋之後的加成；血獵的暴擊回血 */
  if (F.revive) ehp *= 1 + F.revive / 100 + 0.1;
  /* 0.1.74 狂戰士：諸神黃昏、不死之怒、血祭（少的生命；免異常算在 immT）、血泉、嗜血護甲、處刑看撕裂、擲斧 */
  if (F.ragna) (ehp *= 1.15), (dps *= 1.15);
  if (F.undying) (ehp *= 1.25), (dps *= 1.1);
  if (F.selfCut) ehp *= 1 - F.selfCut / 200;
  if (F.rendLeech && rendSrc) ehp *= 1 + F.rendLeech / 300;
  if (F.lsShield && (F.ls || F.weapons.some(w => w.ls || (w.bz && F.blood)))) ehp *= 1.06;
  if (F.execRend && F.execute && rendSrc) dps *= 1.05;
  if (F.axeThrow && F.axeN) dps += (AXE_REND * 4 * F.axeN * F.axeThrow * rendW * P.dotW) / 18;
  /* 0.1.52 印記：守護 2 級（護盾被打破反彈）、生命 2、3 級（溢出變護盾、低血加速） */
  if (F.sgGuard >= 2) ehp += 40;
  /* 0.1.53 護主、共生（寵物每秒命中幾次 × 回復） */
  const petRate = F.weapons.filter(w => w.pet).reduce((n, w) => n + 1 / Math.max(0.3, w.cd), 0);
  if (F.petGuard && petRate) ehp *= 1 + (F.petGuard / 100) * 0.5;
  if (F.dr) ehp /= Math.max(0.2, 1 - F.dr / 100);
  if (F.symHeal) ehp += petRate * F.symHeal * 9;
  if (F.sgLife >= 2) ehp *= F.sgLife >= 3 ? 1.15 : 1.05;
  /* 0.1.51 鳳凰涅槃（一次大回復）、灼命、火焰護體、避雷針 */
  if (F.phoenix) ehp *= 1.25;
  if (F.burnLeech) ehp *= 1.12;
  ehp += (F.thornsBurn || 0) * 6;
  if (F.rod) ehp *= 1 + (F.rod / 100) * 0.3;
  if (F.huntHeal && rendSrc) ehp += F.huntHeal * 4;
  for (const p of F.pots) ehp += p.v * p.n + (p.ex ? p.ex.length * 25 * p.n : 0) + (F.potBuff ? F.potBuff[0] * p.n : 0);
  if (F.poisonLife) ehp *= 1.08;
  if (F.immAll) ehp *= 1.15;
  /* 0.1.43 受到的傷害 +%（詛咒面具這類缺點）、免疫一切的寵物（別西卜） */
  if (F.take) ehp /= 1 + F.take / 100;
  /* 0.1.72 塔羅牌陣的戰鬥牌（正義反彈、月亮幻影、太陽逆位減傷、審判逆位背水） */
  if (F.tarRefl) dps *= 1 + F.tarRefl / 150;
  if (F.tarCopy) dps *= 1 + F.tarCopy / 350;
  if (F.tarMiss) ehp *= 1.04;
  if (F.tarHi) ehp *= 1 + F.tarHi / 200;
  if (F.tarLow) dps *= 1 + F.tarLow / 600;
  if (F.weapons.some(w => w.imm)) dps *= 1.08;
  else if (F.immFz) ehp *= 1.05;
  ehp += gd;
  /* 開戰效果：讓對手變弱（虛弱、凍結、致盲、封鎖、降階）≈ 自己變強；開戰的燃燒中毒流血算傷害 */
  let pre = 1;
  for (const p of F.pre || []) {
    if (p.k === 'weak') pre += 0.025 * p.v;
    else if (p.k === 'frozen') pre += 0.04 * p.v;
    else if (p.k === 'blind') pre += 0.03 * p.v;
    else if (p.k === 'seal') pre += 0.03 * p.v;
    else if (p.k === 'down') pre += 0.12;
    else if (p.k === 'petLock') pre += 0.008 * p.v * Math.min(1, ep);
    else if (p.k === 'sealAll') pre += 0.07 * p.v;
    else if (p.k === 'lockBest') pre += 0.3;
    else if (p.k === 'petSeal') pre += 0.012 * p.v * Math.min(3, ep);
    else if (p.k === 'sunder') pre += 0.01 * Math.min(SUNDER_MAX, p.v);
    /* 0.1.37 新的開戰效果 */ else if (p.k === 'freezeN') pre += 0.05 * p.v;
    else if (p.k === 'selfV') pre += 0.03 * p.v * (p.n || 1);
    else if (p.k === 'corrode') pre += 0.012 * p.v;
    else if (p.k === 'age') pre += 0.012 * p.v;
    else if (p.k === 'confuse') pre += 0.025 * p.v;
    else if (p.k === 'dmgDown') pre += p.v / 100;
    else if (p.k === 'venom') dps += (p.v * 2 * 12 * P.dotW) / 9 / 9;
    else dps += ((p.k === 'poison' ? Math.min(POISON_MAX, p.v) : p.v) * P.dotW) / 9;
  }
  if (F.petDown) pre += (Math.min(PETDOWN_MAX, F.petDown) / 100) * 0.3 * Math.min(1, ep / 2);
  /* 0.1.37 陷阱：大約每個 1 格陷阱蓋到一件道具的機率一半，蓋到的話每次出手都觸發 */
  const TW = { ignite: 0.05, bomb: 0.04, spore: 0.06, icicle: 0.07, snare: 0.07, net: 0.08, stake: 0.07, shock: 0.08 };
  for (const t of F.traps || []) pre += (TW[t.k] || 0.04) * t.n * (t.sz > 1 ? 1.5 : 1);
  if (F.corrodeRe) pre += 0.12;
  /* 0.1.29 抗異常：照對手平均每種異常的強度（run.eres，跟 epet 一樣看上一回合其他人的背包）估價。
     0.1.72 改成「擋掉對手幾成傷害」：red 是對手少打的比例，等於有效生命 ÷ (1 - red)（跟生命一樣吃 ehpW 次方）；
     減回復是對手少回的血，算進傷害。之前是加在 pre 上的小數字，對手 6 成傷害靠燃燒也只值 +15%，機器人不會去買反制 */
  const er = BOT_ERES,
    rv = k => Math.min(RES_MAX, F[k] || 0) / 100;
  const red =
    rv('rBurn') * er.burn +
    rv('rPoison') * er.poison +
    rv('rBleed') * er.bleed +
    rv('rSunder') * er.sunder +
    rv('rFreeze') * er.frozen +
    rv('rStun') * er.stun +
    rv('rWeak') * er.weak +
    rv('rBlind') * er.blind +
    Math.min(1, (F.poisonImm || 0) / 10) * er.poison * 0.5 +
    Math.min(1, (F.immT || 0) / 15) *
      (er.burn + er.poison + er.bleed + er.sunder + er.frozen + er.stun + er.weak + er.blind) +
    (F.cleanse || 0) * 0.04 * (er.burn + er.poison + er.bleed + er.frozen + er.stun + 0.5) +
    rv('critRes') * er.crit;
  pre *= Math.pow(1 / (1 - Math.min(0.75, red * (P.resW ?? 1))), P.ehpW);
  dps *= 1 + rv('healCut') * er.heal * 1.5;
  /* 0.1.74 羈絆的進度：還沒到下一個門檻的件數也算一點（每一系照「湊到下一級的幾成」× synW），
     不然機器人只看已經開的門檻，差 1 件的那件買不下去、星座的相鄰也不會去湊 */
  if (F.synN) {
    let sp = 0;
    F.synN.forEach((n, i) => {
      const lv = (F.syn && F.syn[i]) || 0;
      if (!n || lv >= (F.synMx || 3)) return;
      const lo = lv ? SYN_AT[lv - 1] : 0,
        hi = SYN_AT[lv];
      sp += ((n - lo) / (hi - lo)) * (1 + lv * 0.5);
    });
    pre *= 1 + (P.synW ?? 0.03) * sp;
  }
  return Math.max(0.01, dps) * Math.pow(Math.max(1, ehp), P.ehpW) * pre;
}
const botPowerOf = (bag, P) => botPower(compileBag(bag), P);
/* 假設把 o 放到背包（找最好的位置；prefer 看加成）：回傳 { bag, spot } 或 null */
function botTry(bag, o, P) {
  const sp = findSpot(bag, o, true);
  if (!sp) return null;
  const nb = { ...bag, items: [...bag.items, { ...o, ...sp }] };
  return { bag: nb, spot: sp, pow: botPowerOf(nb, P) };
}
/* 背包裡每件的貢獻（拿掉它戰力掉多少比例），最弱的在前面 */
function botWeakest(bag, P) {
  const base = botPowerOf(bag, P);
  return bag.items
    .filter(o => !ITEMI[o.id].core)
    .map(o => ({ o, loss: 1 - botPowerOf({ ...bag, items: bag.items.filter(q => q !== o) }, P) / base }))
    .sort((a, b) => a.loss - b.loss);
}
/* 一件新道具（id、階）對現在的背包值多少：直接放得下就放；放不下試著換掉最弱的一件；湊得到合成另外算 */
/* cx：這一回合共用的快取（現在的戰力、最弱的兩件、每件道具的評估），背包或暫存區變了要清掉（botBump） */
const botBump = (cx, bagToo = true) => {
  if (!cx.val) cx.val = new Map();
  cx.val.clear();
  if (bagToo) cx.base = cx.weak = null;
};
/* ex：0.1.59 這件身上的形狀（七十二變）、詛咒（{ sh, cu }），沒給就照這局的形狀表、沒有詛咒 */
const botEx = o => (o && (o.cu || o.bl) ? { sh: o.sh, cu: o.cu, bl: o.bl } : null);
function botValue(run, id, t, P, cx = {}, ex = null) {
  const key = id + '|' + t + (ex && ex.cu ? '|c' + ex.cu.join('.') : '') + (ex && ex.bl ? '|b' + ex.bl.join('.') : '');
  if (cx.val && cx.val.has(key)) return cx.val.get(key);
  const v = botValue0(run, id, t, P, cx, ex);
  /* 0.1.59 詛咒・吸金：每回合少的錢（戰力算不到） */
  if (ex && ex.cu && CURSES[ex.cu[0]] && CURSES[ex.cu[0]].k === 'drain')
    v.gain -= 0.05 * cuV({ id, cu: ex.cu }) * (Math.max(0, ROUNDS.length - run.ri) / ROUNDS.length);
  if (cx.val) cx.val.set(key, v);
  return v;
}
function botValue0(run, id, t, P, cx, ex) {
  const bag = run.bag,
    base = cx.base || (cx.base = botPowerOf(bag, P)),
    o = {
      u: '_new',
      id,
      t,
      x: 0,
      y: 0,
      r: 0,
      a: null,
      sh: (ex && ex.sh) || shmOf(run, id),
      ...(ex && ex.cu ? { cu: ex.cu } : {}),
      ...(ex && ex.bl ? { bl: ex.bl } : {})
    };
  /* 0.1.29 第二個核心（0.1.34 起是專屬核心）：融入專屬核心，不佔格子 */
  /* 0.1.42 核心在核心欄：第一個直接放進去，第二個融入 */
  if (ITEMI[id].core) {
    const mc = bag.core,
      nb = { ...bag, core: mc ? (mc.id === id ? mc : { ...mc, sc: id }) : { ...o } };
    return { gain: botPowerOf(nb, P) / base - 1 + botEcon(run, ITEMI[id]), how: 'core' };
  }
  return botValue1(run, id, t, P, cx, bag, base, o);
}
/* 0.1.35 核心的經濟效果（戰力分數算不到的）大約值多少戰力比例：送錢、收入、刷新、商店、背包折價、合成、送的道具 */
function botEcon(run, d) {
  const left = Math.max(0, ROUNDS.length - run.ri) / ROUNDS.length;
  let v = 0;
  if (d.gain) v += d.gain / 200;
  if (d.goldSt) v += 0.25 * left;
  if (d.gold) v += d.gold * 0.05 * left;
  if (d.freeRoll) v += d.freeRoll * 0.04 * left;
  if (d.lotto) v += 0.18 * left;
  if (d.lvOff) v += (run.lv < BAG_MAX ? 0.12 : 0) * left;
  if (d.kick) v += 0.18 * left;
  if (d.early) v += 0.1 * left;
  if (d.merge2) v += 0.25 * left;
  if (d.give) v += 0.2 * left;
  if (d.eliteAll) v += 0.12 * left;
  if (d.gift) v += 0.15;
  if (d.brew) v += 0.2 * left;
  /* 0.1.43 劍修大師的 Ⅱ 階戰利品、再生藥劑的提早詞綴、長柄大師少佔格子、賄賂（戰力只在付了錢才算得到）、豪賭的刷新上限 */
  if (d.eliteT) v += 0.1 * left;
  if (d.earlyPot) v += 0.03 * left;
  if (d.shrink) v += 0.04 * run.bag.items.filter(o => ITEMI[o.id].tags.includes(d.shrink)).length;
  if (d.bribe) v += run.gold > d.bribe ? 0.15 : 0.05;
  if (d.rollCap) v -= 0.03 * left;
  if (d.rich) v += Math.min(0.3, run.gold / 200);
  /* 0.1.53 馴獸師：捕獲、進化 */
  if (d.capture) v += 0.15 * left;
  if (d.evolve) v += 0.2 * left;
  return v;
}
function botValue1(run, id, t, P, cx, bag, base, o) {
  /* 湊滿 3 件：當成背包那件直接升一階 */
  if (wouldMerge(run, id, t)) {
    const inBag = bag.items.find(q => q.id === id && q.t === t);
    if (inBag) {
      const nb = { ...bag, items: bag.items.map(q => (q === inBag ? { ...q, t: t + 1 } : q)) };
      return { gain: botPowerOf(nb, P) / base - 1 + P.mergeBonus, how: 'merge' };
    }
    return { gain: P.mergeBonus, how: 'merge' };
  }
  const tr = botTry(bag, o, P);
  let best = tr ? { gain: tr.pow / base - 1, how: 'place' } : { gain: -1, how: 'none' };
  /* 放不下：試著賣掉最弱的一件（只看最弱的兩件，省時間） */
  if (!tr) {
    if (!cx.weak) cx.weak = botWeakest(bag, P).slice(0, 2);
    for (const { o: weak } of cx.weak) {
      const nb = { ...bag, items: bag.items.filter(q => q !== weak) },
        t2 = botTry(nb, o, P);
      if (!t2) continue;
      const g = t2.pow / base - 1 - P.sellMargin;
      if (g > best.gain) best = { gain: g, how: 'swap', sell: weak };
    }
  }
  /* 有同一件 1 個：先收著等合成 */
  if ([...bag.items, ...run.bench].some(q => q && q.id === id && q.t === t))
    best.gain = Math.max(best.gain, P.mergeBonus * 0.5);
  return best;
}
/* 0.1.72 擺位看戰力：列出 o 能放的位置（同一組格子只算一次），先照「加成條數、貼著幾件」排，
   取前 BOT_SPOTS 個真的算戰力，挑最高的。共生森林（越擠越強）、棋盤（棋子走法）、黃道（星座）、機關（齒輪）這些
   看位置的效果，findSpot 的標籤加成猜不到，要算過才知道 */
const BOT_SPOTS = 16;
function botBestSpot(bag, o, P) {
  const I = ITEMI[o.id];
  if (I.core && bag.items.some(q => q.u !== o.u && ITEMI[q.id].core === I.core)) return null;
  const g = bagGrid(bag),
    rest = bag.items.filter(q => q.u !== o.u),
    rel = rest.map(q => [q, synergy(o, q) + synergy(q, o)]).filter(([, n]) => n > 0),
    seen = new Set(),
    cand = [];
  for (let r = 0; r < 4; r++) {
    const sh = shapeO(o, r);
    for (let y = 0; y < bag.h; y++)
      for (let x = 0; x < bag.w; x++) {
        const cs = sh.map(([dx, dy]) => [x + dx, y + dy]);
        if (cs.some(([cx, cy]) => cx >= bag.w || cy >= bag.h || (g[cy][cx] != null && g[cy][cx] !== o.u))) continue;
        const key = cs
          .map(c => c.join(','))
          .sort()
          .join(' ');
        if (seen.has(key) && !I.hole && !I.pc) continue;
        seen.add(key + (I.hole || I.pc ? '|' + r : ''));
        const t = { ...o, x, y, r },
          nb = new Set();
        for (const [cx, cy] of cs)
          for (const [ax, ay] of [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1]
          ]) {
            const u = g[ay] && g[ay][ax];
            if (u != null && u !== o.u) nb.add(u);
          }
        let sc = nb.size;
        for (const [q, n] of rel) if (adjacent(t, q)) sc += n * 3;
        cand.push({ x, y, r, sc });
      }
  }
  if (!cand.length) return null;
  if (cand.length === 1) return cand[0];
  /* 同分的照位置散開取（不要全部擠在左上角） */
  cand.sort((a, b) => b.sc - a.sc);
  const pick =
    cand.length <= BOT_SPOTS
      ? cand
      : [
          ...cand.slice(0, BOT_SPOTS / 2),
          ...cand.slice(BOT_SPOTS / 2).filter((c, i, a) => i % Math.ceil(a.length / (BOT_SPOTS / 2)) === 0)
        ];
  let best = null;
  for (const c of pick) {
    const pw = botPowerOf({ ...bag, items: [...rest, { ...o, x: c.x, y: c.y, r: c.r }] }, P);
    if (!best || pw > best.pw) best = { ...c, pw };
  }
  return best;
}
/* 0.1.72 整理背包：每件（核心以外）拿起來找戰力最高的位置，比原本好就搬過去；搬了要再跑 mergeAll（融合、吸收照新位置） */
function botRelayout(run, P) {
  const bag = run.bag;
  let base = botPowerOf(bag, P),
    moved = false;
  for (let pass = 0; pass < 2; pass++) {
    let any = false;
    for (const o of [...bag.items]) {
      if (ITEMI[o.id].core || ITEMI[o.id].absorb) continue;
      const sp = botBestSpot(bag, o, P);
      if (!sp || sp.pw <= base * 1.003 || (sp.x === o.x && sp.y === o.y && sp.r === o.r)) continue;
      Object.assign(o, { x: sp.x, y: sp.y, r: sp.r });
      base = sp.pw;
      any = moved = true;
    }
    if (!any) break;
  }
  if (moved) mergeAll(run, runR(run));
  return moved;
}
/* 把道具 o（已經在暫存區）照評估的方式放進背包 */
function botPlace(run, o, P, cx = {}) {
  const ev = botValue(run, o.id, o.t, P, cx, botEx(o));
  if (ev.how !== 'place' && ev.how !== 'swap') return false;
  botBump(cx);
  if (ev.how === 'swap' && ev.sell) sellItem(run, ev.sell.u);
  if (ev.how === 'place' || ev.how === 'swap') {
    const sp = (!P.plain && botBestSpot(run.bag, o, P)) || findSpot(run.bag, o, true);
    if (!sp) return false;
    Object.assign(o, sp);
    const i = run.bench.indexOf(o);
    if (i >= 0) run.bench[i] = null;
    run.bag.items.push(o);
    return true;
  }
  return false;
}
/* 0.1.27 寄放的戰利品（暫存區滿了）：賣掉暫存區最沒用的一件騰位置；它比暫存區每件都沒用就直接賣掉它。
   之前暫存區滿就把戰利品丟了（機器人對局約 1/4 的菁英、首領戰利品不見） */
function botHold(run, P, cx = {}) {
  const o = run.hold;
  if (!o) return;
  run.hold = null;
  if (benchFree(run) < 0) {
    const val = q => botValue(run, q.id, q.t, P, cx).gain,
      [w, wv] = run.bench.map(q => [q, val(q)]).sort((a, b) => a[1] - b[1])[0];
    if (val(o) <= wv) {
      /* 0.1.74 照玩家的賣價（複製品 0 金、回扣送的、賽制的規則） */
      run.gold += sellO(o, run);
      return;
    }
    sellItem(run, w.u);
  }
  run.bench[benchFree(run)] = o;
}
/* 0.1.46 試著把吸收型的道具（魔劍正宗）放進背包：找旁邊最多可吸收武器的位置，模擬吸收後戰力不變差就放；
   放不下就賣最弱的（不賣會被吸收的）再試 */
function botAbsorb(run, o, P) {
  const tags = [ITEMI[o.id].absorb].flat(),
    eat = q =>
      !ITEMI[q.id].core && ITEMI[q.id].dmg && !ITEMI[q.id].absorb && tags.some(t => ITEMI[q.id].tags.includes(t)),
    base = botPowerOf(run.bag, P);
  for (let g = 0; g < 3 && !findSpot(run.bag, o); g++) {
    const w = botWeakest(run.bag, P).find(x => !eat(x.o));
    if (!w) return;
    sellItem(run, w.o.u);
  }
  const sp = findSpot(run.bag, o, true);
  if (!sp) return;
  /* 模擬：複製一份背包，放下去後吸收旁邊的 */
  const tmp = { ...run, bag: { ...run.bag, items: run.bag.items.map(q => ({ ...q })) } },
    t = { ...o, ...sp, ab: o.ab ? JSON.parse(JSON.stringify(o.ab)) : null };
  tmp.bag.items.push(t);
  absorbAll(tmp);
  if (botPowerOf(tmp.bag, P) < base * 0.97 && !(t.ab && t.ab.n)) return;
  Object.assign(o, sp);
  run.bench[run.bench.indexOf(o)] = null;
  run.bag.items.push(o);
  absorbAll(run);
}
/* 0.1.43 照核心與道具要留著不花的錢：鈔能力（守住已經到的那一級）、金錢標（開戰每下花 1 金）、賄賂（要超過 5 金） */
/* 鈔能力已經到的那一級是硬底線（掉級就少一截加成），其他是軟的（動到時門檻加倍） */
/* 0.1.74 商人職業特性（RICH_C）也一樣守住已經到的那一級 */
const botFloor = run => {
  const ns = [
    ...(coreProp(bagAll(run.bag), 'rich') ? RICH : []),
    ...(((CLSI[run.bag.cls] || {}).F || {}).richC ? RICH_C : [])
  ].map(([n]) => n);
  return Math.max(0, ...ns.filter(n => run.gold >= n));
};
function botKeep(run) {
  const its = bagAll(run.bag);
  let k = botFloor(run);
  if (its.some(o => ITEMI[o.id].coin)) k = Math.max(k, 12);
  if (coreProp(its, 'bribe')) k = Math.max(k, coreProp(its, 'bribe') + 1);
  return k;
}
/* ================= 每回合 ================= */
/* 三選一（菁英、首領、回扣）：照評估挑，pend.tier 是送的階 */
/* 0.1.37 煉成的效果偏好（機器人照這個順序挑） */
const BOT_BREW = ['dmg', 'shield', 'heal', 'poison', 'spd', 'burn', 'chill', 'age', 'regen', 'cleanse'];
function botPend(run, q, P) {
  if (!run.pend) return;
  if (run.pend.brew) {
    const o = run.pend.opts;
    return takePick(
      run,
      r01(run) < q ? [...o].sort((a, b) => BOT_BREW.indexOf(a) - BOT_BREW.indexOf(b))[0] : o[0],
      true
    );
  }
  const opts = run.pend.opts,
    t = run.pend.tier || 1,
    pick =
      r01(run) < q
        ? opts.map(id => [id, botValue(run, id, t, P, {}).gain]).sort((a, b) => b[1] - a[1])[0][0]
        : opts[fl(r01(run) * opts.length)];
  takePick(run, pick, true);
}
/* 0.1.52 印記：差一件就升級的印記多加分（評估時新道具沒有印記，用這個補） */
function sgBias(run, sg) {
  if (sg == null) return 1;
  const n = sgCount(run.bag)[sg];
  return n === 1 || n === 3 || n === 5 ? 1.25 : n >= 2 ? 1.1 : 1;
}
/* 0.1.52 流浪商隊：機器人跟商人交易（每回合一次）；有交易回傳 true */
function botCaravan(run, q, P, cx) {
  const v = run.van && !run.van.done && VANI[run.van.k];
  if (!v || r01(run) > q) return false;
  const ok = r => typeof r !== 'string',
    its = [...run.bag.items, ...run.bench].filter(o => o && vanOK(o)),
    val = o => botValue(run, o.id, o.t, P, cx).gain;
  if (v.k === 'twin') return ok(vanDo(run));
  if (v.k === 'gamble') return run.gold >= 9 && ok(vanDo(run));
  if (v.k === 'blood') return run.hp > 25 && ok(vanDo(run, 'weapon'));
  if (v.k === 'smith') {
    const o = run.bag.items
      .filter(o => o.t >= 2 && !(o.m && o.m2) && ITEMI[o.id].dmg)
      .sort((a, b) => ITEMI[b.id].star * 10 + b.t - (ITEMI[a.id].star * 10 + a.t))[0];
    return !!o && run.gold >= 7 && ok(vanDo(run, o.u));
  }
  /* 煉金、變形：拿最不值錢的（暫存區優先） */
  const weak = its
    .filter(o => ITEMI[o.id].star < 5 && o.t === 1)
    .map(o => [o, val(o)])
    .sort((a, b) => a[1] - b[1]);
  if (v.k === 'morph') {
    const w = weak[0];
    return !!w && w[1] < P.gainMin && run.gold >= 5 && ok(vanDo(run, w[0].u));
  }
  if (v.k === 'alch')
    for (let i = 0; i < weak.length; i++)
      for (let j = i + 1; j < weak.length; j++)
        if (ITEMI[weak[i][0].id].star === ITEMI[weak[j][0].id].star && weak[j][1] < P.gainMin * 2)
          return ok(vanDo(run, [weak[i][0].u, weak[j][0].u]));
  return false;
}
/* 0.1.59 法老王的遺物：拿到這個遺物戰力多幾成（黃金面具算收入） */
function botRelic(run, k, P = BOT_P) {
  const bag = run.bag,
    base = botPowerOf(bag, P),
    left = Math.max(0, ROUNDS.length - run.ri) / ROUNDS.length;
  return botPowerOf({ ...bag, rel: [...(bag.rel || []), k] }, P) / base - 1 + (k === 'mask' ? 0.1 * left : 0);
}
/* 0.1.59 遺產市集：攤位上划算的就買（跟商店一樣看每金幣換到多少戰力） */
function botLegacy(run, q, P, cx) {
  if (!run.leg || !run.leg.length || r01(run) > q) return false;
  let did = false;
  for (let g = 0; g < 6; g++) {
    const floor = botFloor(run),
      best = run.leg
        .map((e, k) => [
          k,
          legPrice(run, e),
          botValue(run, e.id, e.t || 1, P, cx, { sh: e.sh, cu: e.cu, bl: e.bl }).gain
        ])
        .filter(([, p, v]) => p <= run.gold - floor && v >= Math.max(P.gainMin, p * P.perGold))
        .sort((a, b) => b[2] / Math.max(0.5, b[1]) - a[2] / Math.max(0.5, a[1]))[0];
    if (!best || benchFree(run) < 0) break;
    if (typeof legacyBuy(run, best[0]) === 'string') break;
    did = true;
    botBump(cx);
    for (const o of run.bench) if (o) botPlace(run, o, P, cx);
  }
  return did;
}
/* 0.1.69 塔羅牌陣：四選一（靜態分數＋看背包的調整＋一點隨機，不然大家都選一樣的） */
const BOT_TAROT = {
  fool: 2,
  fool_r: 3,
  magician: 4,
  magician_r: 3,
  priestess: 4,
  priestess_r: 2,
  empress: 1,
  empress_r: 2,
  emperor: 3,
  emperor_r: 3,
  hierophant: 2,
  hierophant_r: 3,
  lovers: 3,
  lovers_r: 3,
  chariot: 3,
  chariot_r: 2,
  strength: 4,
  strength_r: 2,
  hermit: 0,
  hermit_r: 3,
  wheel: 3,
  wheel_r: 3,
  justice: 2,
  justice_r: 3,
  hanged: 1,
  hanged_r: 2,
  death: 0,
  death_r: 3,
  temperance: 2,
  temperance_r: 3,
  devil: 2,
  devil_r: 1,
  tower: 3,
  tower_r: 1,
  star: 3,
  star_r: 2,
  moon: 3,
  moon_r: 1,
  sun: 2,
  sun_r: 2,
  judgement: 1,
  judgement_r: 2,
  world: 4,
  world_r: 3
};
/* 0.1.72 戰鬥類的牌（compileBag 看 bag.tar 算得到的）直接比戰力：每多 10% 戰力約 +2.5 分；
   經濟、構築類照靜態分數＋看背包、生命、錢的調整（一點隨機，不然大家都選一樣的） */
function botTarot(run, opts, P = BOT_P) {
  const pets = run.bag.items.filter(o => ITEMI[o.id].tags.includes('pet')).length,
    base = botPowerOf({ ...run.bag, tar: '', tarN: 0 }, P),
    left = Math.max(0, ROUNDS.length - run.ri) / ROUNDS.length,
    sc = k => {
      const T = tarOf(k),
        fight = T && TAROT_FIGHT.includes(T.e.c);
      let v = (BOT_TAROT[k] || 0) * (fight ? 0.5 : 1);
      if (fight) v += 25 * (botPowerOf({ ...run.bag, tar: k, tarN: 0 }, P) / base - 1);
      if (k === 'empress' && pets >= 2) v += 2;
      if (k === 'hermit' && run.bag.items.length <= 5) v += 2;
      if (k === 'devil' && run.hp < 15) v -= 4;
      if (k === 'death_r' && run.hp < 15) v += 3;
      if (k === 'justice_r' && run.hp < 20) v += 2;
      /* 前期經濟牌比較值錢、後期戰鬥牌比較值錢 */
      if (T && T.e.c === 'eco') v += 2 * left - 0.5;
      if (k === 'hanged' && run.ri > ROUNDS.length * 0.6) v -= 3;
      return v + r01(run) * 0.5;
    };
  return opts.map(k => [k, sc(k)]).sort((a, b) => b[1] - a[1])[0][0];
}
/* q：照評估做的機率（牌階高 q 高）；其他時候用簡單的舊規則（照主題、隨便買），低牌階才會笨一點 */
function botAct(run, theme, q = 0.7, P = BOT_P) {
  const r = curRound(run);
  BOT_EPET = run.epet ?? 1;
  BOT_ERES = run.eres || BOT_ERES0;
  /* 三選一：挑戰力最高的 */
  for (let g = 0; g < 5 && run.pend; g++) botPend(run, q, P);
  botHold(run, P);
  /* 0.1.35 鈔能力：評估時用現在的金幣 */
  run.bag.gp = run.gold;
  /* 升背包：背包快滿、錢夠而且升完還留一點 */
  const lv = BAGLV[run.lv + 1],
    cells = run.bag.items.reduce((n, o) => n + shapeO(o).length, 0),
    fill = cells / (run.bag.w * run.bag.h);
  /* 0.1.46 暫存區有背包放不下的長條（吸收型的道具）：錢夠就先升背包 */
  const tooLong = run.bench.some(
    o => o && ITEMI[o.id].absorb && Math.max(...shapeO(o).flat()) + 1 > Math.max(run.bag.w, run.bag.h)
  );
  if (lv && lvOpen(run) && run.gold >= lvCost(run) + Math.max(P.lvKeep, botFloor(run)) && (fill >= P.lvFill || tooLong))
    levelUp(run);
  /* 買：每輪挑「每金幣換到最多戰力」的一件，直到沒有值得買的；沒得買又有錢就刷新 */
  /* 0.1.72 生命剩 P.lowHp 以下：不存利息錢，全部拿來變強（輸了就出局，存錢沒有用） */
  const keep = Math.max(run.ri >= P.reserveFrom && run.hp > (P.lowHp || 0) ? P.reserve : 0, botKeep(run)),
    floor = botFloor(run);
  const cx = {};
  botBump(cx);
  /* 0.1.53 遠古之器：暫存區的寵物（不是四兇）都拿去獻祭 */
  if ([...run.bag.items, ...run.bench].some(o => o && ITEMI[o.id].sacrifice)) {
    const us = run.bench.filter(o => sacOK(o) && !wouldMerge(run, o.id, o.t)).map(o => o.u);
    if (us.length) sacrifice(run, us), botBump(cx);
  }
  /* 0.1.52 流浪商隊：先跟商人交易 */
  if (botCaravan(run, q, P, cx)) {
    botBump(cx);
    for (const o of run.bench) if (o) botPlace(run, o, P, cx);
  }
  /* 0.1.59 遺產市集 */
  botLegacy(run, q, P, cx);
  for (let rolls = 0, guard = 0; guard < 12; guard++) {
    let best = null;
    run.shop.forEach((s, k) => {
      if (!s) return;
      const price = slotPrice(run, s);
      if (price > run.gold - floor) return;
      const smart = r01(run) < q;
      let gain;
      if (smart) gain = botValue(run, s.id, s.t || 1, P, cx, botEx(s)).gain * sgBias(run, s.sg);
      else {
        const I = ITEMI[s.id];
        gain =
          I.tags.includes(theme) || I.for === theme || I.dmg || I.tags.includes('armor')
            ? 0.1 + r01(run) * 0.1
            : r01(run) * 0.05;
      }
      /* 動用到要存的利息錢：門檻提高 */
      const need = Math.max(P.gainMin, price * P.perGold) * (run.gold - price < keep ? 2 : 1);
      if (gain >= need && (!best || gain / Math.max(0.5, price) > best.v)) best = { k, v: gain / Math.max(0.5, price) };
    });
    if (best) {
      const s = run.shop[best.k];
      if (benchFree(run) < 0 && !wouldMerge(run, s.id, s.t || 1)) {
        /* 暫存區滿了：先把暫存區沒用的賣掉 */
        const junk = run.bench.find(
          o => o && !wouldMerge(run, o.id, o.t) && botValue(run, o.id, o.t, P, cx).gain < P.gainMin
        );
        if (junk) sellItem(run, junk.u), botBump(cx, false);
        else break;
      }
      const res = buyItem(run, best.k);
      if (typeof res === 'string') break;
      /* 0.1.35 回扣：買滿幾次送的三選一 */
      if (run.pend) botPend(run, q, P), botHold(run, P);
      botBump(
        cx,
        res.merged.some(o => run.bag.items.includes(o))
      );
      /* 買進來的（或合成出來的）馬上試著放進背包 */
      for (const o of run.bench) if (o) botPlace(run, o, P, cx);
      continue;
    }
    if (
      rollsLeft(run) > 0 &&
      ((freeRolls(run) > 0 && rolls < P.maxRolls + 1) ||
        (rolls < P.maxRolls && run.gold - REROLL >= Math.max(P.rollGold, keep) && r01(run) < q + 0.2))
    ) {
      rerollShop(run);
      rolls++;
      continue;
    }
    break;
  }
  /* 職業核心一定要放：放不下就賣最弱的 */
  for (const o of run.bench) {
    if (!o || !ITEMI[o.id].core) continue;
    for (let g = 0; g < 4 && !findSpot(run.bag, o); g++) {
      const w = botWeakest(run.bag, P)[0];
      if (!w) break;
      sellItem(run, w.o.u);
    }
    const sp = findSpot(run.bag, o, true);
    if (sp) {
      Object.assign(o, sp);
      run.bench[run.bench.indexOf(o)] = null;
      run.bag.items.push(o);
    }
  }
  /* 0.1.46 魔劍正宗（absorb）：本身沒有數值，照評估不會想放；改成「放下去、旁邊的劍矛被吸收」之後的戰力來決定 */
  for (const o of run.bench) if (o && ITEMI[o.id].absorb) botAbsorb(run, o, P);
  /* 暫存區：放得進去而且有用的放，沒用而且湊不到合成的賣掉 */
  botBump(cx);
  for (const o of run.bench) if (o) botPlace(run, o, P, cx);
  for (const o of run.bench) {
    if (!o) continue;
    const pair = [...run.bag.items, ...run.bench].filter(q => q && q !== o && q.id === o.id && q.t === o.t).length;
    if (!pair && ITEMI[o.id].star < 3) sellItem(run, o.u);
  }
  mergeAll(run, runR(run));
  /* 0.1.72 買完、擺完：整理一次位置（看位置的加成）；P.plain 是 0.1.71 的擺法（bot_train.js --vs-plain 比較用） */
  if (!P.plain && r01(run) < q) botRelayout(run, P);
}
/* 舊的買法（0.1.0～0.1.19）：照主題標籤＋隨機買、能升背包就升、全部擺進背包。留著跟新的比較強度（simLobby 的 opt.old） */
function botActOld(run, theme, q = 0.7) {
  const r = curRound(run);
  if (run.lv < BAG_MAX && run.gold >= lvCost(run) + 2 && (run.ri > 3 || run.gold > 12)) levelUp(run);
  for (let pass = 0; pass < 2; pass++) {
    run.shop.forEach((s, k) => {
      if (!s) return;
      const I = ITEMI[s.id],
        want =
          I.tags.includes(theme) ||
          I.for === theme ||
          I.tags.includes('weapon') ||
          I.tags.includes('armor') ||
          r01(run) < 0.35;
      if (want && run.gold >= slotPrice(run, s) && benchFree(run) >= 0) buyItem(run, k);
    });
    if (run.gold >= 3 && run.gold < 8 && pass === 0 && r01(run) < q) rerollShop(run);
  }
  if (run.pend) takePick(run, run.pend.opts[0]);
  /* 職業核心放不下：賣掉背包裡最便宜的道具騰空間 */
  const core = run.bench.find(
    o => o && ITEMI[o.id].core && !run.bag.items.some(q => ITEMI[q.id].core === ITEMI[o.id].core)
  );
  if (core)
    for (let g = 0; g < 4 && !findSpot(run.bag, core); g++) {
      const low = [...run.bag.items].sort((a, b) => ITEMI[a.id].star * a.t - ITEMI[b.id].star * b.t)[0];
      if (!low || ITEMI[low.id].star >= 4) break;
      sellItem(run, low.u);
    }
  /* 暫存區的擺進背包（大的先），放不下的賣掉 */
  run.bench
    .filter(Boolean)
    .sort((a, b) => shapeO(b).length - shapeO(a).length)
    .forEach(o => {
      const sp = findSpot(run.bag, o, r01(run) < q);
      if (!sp) return;
      Object.assign(o, sp);
      run.bench[run.bench.indexOf(o)] = null;
      run.bag.items.push(o);
    });
  run.bench.forEach(o => o && ITEMI[o.id].star < 3 && sellItem(run, o.u));
  mergeAll(run, runR(run));
}
