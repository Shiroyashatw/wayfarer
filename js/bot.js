/* 塞令老師 · 機器人的腦（0.1.20）：所有決定（買、擺、賣、合成、升背包、刷新、三選一）都用「戰力分數」評估，
   不寫死道具或職業，新道具、新體系只要 compileBag 算得出數值，機器人就會用。
   戰力 ≈ 每秒傷害 × 有效生命（兩邊互打時，誰先把對方打死）；習慣（存多少錢、多常刷新、何時升背包…）是 BOT_P 參數，
   用 tools/bot_train.js 自我對打調出來（skill bot-ai）。run.js 之後載入。 */
'use strict';
/* 訓練出來的參數（tools/bot_train.js 會覆寫這一段） */
let BOT_P = {
  gainMin: 0.01, // 一件道具至少要讓戰力提升這個比例才買
  perGold: 0.009, // 每 1 金至少要換到多少戰力（比例）
  reserve: 14, // 想留著吃利息的錢（後期才存）
  reserveFrom: 7, // 第幾回合開始存利息
  rollGold: 2, // 錢多於這個、又沒東西好買就刷新
  maxRolls: 6, // 一回合最多刷新幾次
  lvFill: 0.777, // 背包塞到幾成滿就考慮升級
  lvKeep: 2, // 升級後至少留幾金
  sellMargin: 0, // 賣掉舊的換新的，戰力至少要多這個比例
  mergeBonus: 0.091, // 湊合成的額外偏好（還沒湊滿也先收）
  dotW: 1.057, // 燃燒、中毒、流血每層的價值（約幾秒）
  ctrlW: 0.572, // 暈眩、凍結、虛弱、致盲的價值倍率
  ehpW: 1.514
};
/* ================= 戰力分數 ================= */
/* 0.1.28 對手平均有幾隻寵物（反制寵物的道具照這個估價）；simLobby 每回合照其他機器人的背包設 run.epet */
let BOT_EPET = 1;
/* 0.1.29 對手每種異常、回復、暴擊大約佔他強度的比例（0～0.3），抗異常的道具照這個估價；run.eres 沒有就用這組平均值 */
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
  crit: 0.04
};
let BOT_ERES = BOT_ERES0;
/* 一個背包對別人的威脅：每種異常（以及吸血回復、暴擊）大約佔它強度的比例 */
function botThreat(F) {
  const o = { burn: 0, poison: 0, bleed: 0, sunder: 0, frozen: 0, stun: 0, weak: 0, blind: 0, heal: 0, crit: 0 };
  let tot = 0.01;
  for (const w of F.weapons) {
    const sp = 1 / Math.max(0.3, w.cd),
      avg = ((w.dmg[0] + w.dmg[1]) / 2) * sp;
    tot += avg;
    o.burn += (w.burn || 0) * sp * 1.5;
    o.poison += (w.poison || 0) * sp * 2;
    o.bleed += (w.bleed || 0) * sp;
    o.sunder += (w.sunder || 0) * sp * 0.5;
    o.frozen += ((w.freeze ? w.freeze[0] * w.freeze[1] : 0) / 100) * avg;
    o.stun += ((w.stun ? w.stun[0] * w.stun[1] * 2 : 0) / 100) * avg;
    o.weak += ((w.weak || 0) / 100) * avg * 0.5;
    o.blind += ((w.blind || 0) / 100) * avg * 0.5;
    o.heal += (((w.ls || 0) + (F.ls || 0)) / 100) * avg;
    o.crit += ((w.crit || 0) / 100) * avg * 0.6;
  }
  o.heal += (F.regen || 0) + F.pots.reduce((n, p) => n + (p.v * p.n) / 20, 0);
  for (const k in o) o[k] = Math.min(0.3, o[k] / tot);
  return o;
}
function botPower(F, P = BOT_P) {
  let dps = 0,
    gd = 0;
  const ep = BOT_EPET;
  const cm = (F.critMul || 160) / 100;
  for (const w of F.weapons) {
    const avg = (w.dmg[0] + w.dmg[1]) / 2,
      crit = Math.min(100, w.crit || 0) / 100;
    let hit = avg * (1 + crit * (cm - 1));
    hit += ((w.burn || 0) + (w.poison || 0) * 1.4 + (w.bleed || 0) * 0.7) * P.dotW;
    hit *= 1 + (w.sunder || 0) * 0.02;
    const ctrl =
      ((w.stun ? w.stun[0] * w.stun[1] : 0) +
        (w.freeze ? w.freeze[0] * w.freeze[1] * 0.5 : 0) +
        (w.weak || 0) * 0.75 +
        (w.blind || 0) * 0.75) /
      100;
    hit *= 1 + ctrl * 0.4 * P.ctrlW;
    hit *= 1 + (w.ls || 0) / 200;
    /* 0.1.28 質變：連鎖、穿甲、守護 */
    hit *= (1 + (w.chain || 0) / 100) * (1 + (w.pierce || 0) * 0.004) * (1 + ((w.chainN || 0) * CHAIN_DMG) / 100);
    dps += hit / Math.max(0.3, w.cd);
    if (w.guard) gd += ((hit * w.guard) / 100 / Math.max(0.3, w.cd)) * 9;
  }
  for (const s of F.shields) if (s.bash) dps += (s.block * s.bash) / 100 / Math.max(0.6, s.cd);
  for (const p of F.pots) if (p.bomb) dps += (p.v * p.n * p.bomb) / 100 / 15;
  if (F.petHunt) dps *= 1 + (F.petHunt * Math.min(5, ep)) / 100;
  dps *= 1 + (F.double || 0) / 100;
  /* 0.1.33 連珠箭（開戰 N 秒必定連擊，一場大約 15 秒）、先手射擊 */
  if (F.openDbl) dps *= 1 + Math.min(1, F.openDbl / 15) * 0.8;
  if (F.firstStrike) dps *= 1.04;
  dps *= 1 + ((F.execute || 0) * 0.25 + (F.rage || 0) * 0.3 + (F.ramp || 0) * 1.5 + (F.opener || 0) * 0.05) / 100;
  if (F.rushT) dps *= 1 + (F.rushP / 100) * Math.min(1, F.rushT / 9);
  let ehp = (F.hp * (1 + Math.max(-10, F.arm || 0) / 50)) / (1 - Math.min(40, F.dodge || 0) / 100);
  for (const s of F.shields)
    ehp += (s.block / Math.max(0.6, s.cd)) * 9 + (s.heal / Math.max(0.6, s.cd)) * 9 + s.thorns * 3;
  ehp += (F.regen || 0) * 9 + (F.startBlock || 0) + (F.thornsF || 0) * 6 + (F.critHeal || 0) * 4;
  for (const p of F.pots) ehp += p.v * p.n;
  ehp += gd;
  /* 開戰效果：讓對手變弱（虛弱、凍結、致盲、封鎖、降階）≈ 自己變強；開戰的燃燒中毒流血算傷害 */
  let pre = 1;
  for (const p of F.pre || []) {
    if (p.k === 'weak') pre += 0.025 * p.v;
    else if (p.k === 'frozen') pre += 0.04 * p.v;
    else if (p.k === 'blind') pre += 0.03 * p.v;
    else if (p.k === 'seal') pre += 0.03 * p.v;
    else if (p.k === 'down') pre += 0.12;
    else if (p.k === 'petLock') pre += 0.12 * Math.min(p.v, ep);
    else if (p.k === 'sealAll') pre += 0.07 * p.v;
    else if (p.k === 'lockBest') pre += 0.3;
    else if (p.k === 'petSeal') pre += 0.012 * p.v * Math.min(3, ep);
    else if (p.k === 'sunder') pre += 0.01 * Math.min(SUNDER_MAX, p.v);
    else dps += ((p.k === 'poison' ? Math.min(POISON_MAX, p.v) : p.v) * P.dotW) / 9;
  }
  if (F.petDown) pre += (Math.min(PETDOWN_MAX, F.petDown) / 100) * 0.3 * Math.min(1, ep / 2);
  /* 0.1.29 抗異常：照對手平均每種異常的強度（run.eres，跟 epet 一樣看上一回合其他人的背包）估價 */
  const er = BOT_ERES,
    rv = k => Math.min(RES_MAX, F[k] || 0) / 100;
  pre +=
    rv('rBurn') * er.burn +
    rv('rPoison') * er.poison +
    rv('rBleed') * er.bleed +
    rv('rSunder') * er.sunder +
    rv('rFreeze') * er.frozen +
    rv('rStun') * er.stun +
    rv('rWeak') * er.weak +
    rv('rBlind') * er.blind +
    Math.min(1, (F.poisonImm || 0) / 10) * er.poison * 0.5 +
    (F.cleanse || 0) * 0.04 * (er.burn + er.poison + er.bleed + er.frozen + er.stun + 0.5) +
    rv('healCut') * er.heal +
    rv('critRes') * er.crit;
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
function botValue(run, id, t, P, cx = {}) {
  const key = id + '|' + t;
  if (cx.val && cx.val.has(key)) return cx.val.get(key);
  const v = botValue0(run, id, t, P, cx);
  if (cx.val) cx.val.set(key, v);
  return v;
}
function botValue0(run, id, t, P, cx) {
  const bag = run.bag,
    base = cx.base || (cx.base = botPowerOf(bag, P)),
    o = { u: '_new', id, t, x: 0, y: 0, r: 0, a: null };
  /* 0.1.29 第二個核心（0.1.34 起是專屬核心）：融入專屬核心，不佔格子 */
  const mc = ITEMI[id].core && bag.items.find(q => ITEMI[q.id].core === 1 && q.id !== id);
  if (mc) {
    const nb = { ...bag, items: bag.items.map(q => (q === mc ? { ...q, sc: id } : q)) };
    return { gain: botPowerOf(nb, P) / base - 1, how: 'core' };
  }
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
/* 把道具 o（已經在暫存區）照評估的方式放進背包 */
function botPlace(run, o, P, cx = {}) {
  const ev = botValue(run, o.id, o.t, P, cx);
  if (ev.how !== 'place' && ev.how !== 'swap') return false;
  botBump(cx);
  if (ev.how === 'swap' && ev.sell) sellItem(run, ev.sell.u);
  if (ev.how === 'place' || ev.how === 'swap') {
    const sp = findSpot(run.bag, o, true);
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
      run.gold += sellOf(o.id, o.t);
      return;
    }
    sellItem(run, w.u);
  }
  run.bench[benchFree(run)] = o;
}
/* ================= 每回合 ================= */
/* q：照評估做的機率（牌階高 q 高）；其他時候用簡單的舊規則（照主題、隨便買），低牌階才會笨一點 */
function botAct(run, theme, q = 0.7, P = BOT_P) {
  const r = curRound(run);
  BOT_EPET = run.epet ?? 1;
  BOT_ERES = run.eres || BOT_ERES0;
  /* 三選一：挑戰力最高的 */
  if (run.pend) {
    const opts = run.pend.opts,
      pick =
        r01(run) < q
          ? opts.map(id => [id, botValue(run, id, 1, P, {}).gain]).sort((a, b) => b[1] - a[1])[0][0]
          : opts[fl(r01(run) * opts.length)];
    takePick(run, pick, true);
  }
  botHold(run, P);
  /* 升背包：背包快滿、錢夠而且升完還留一點 */
  const lv = BAGLV[run.lv + 1],
    cells = run.bag.items.reduce((n, o) => n + shapeOf(o.id).length, 0),
    fill = cells / (run.bag.w * run.bag.h);
  if (lv && lvOpen(run) && run.gold >= lv.cost + P.lvKeep && fill >= P.lvFill) levelUp(run);
  /* 買：每輪挑「每金幣換到最多戰力」的一件，直到沒有值得買的；沒得買又有錢就刷新 */
  const keep = run.ri >= P.reserveFrom ? P.reserve : 0;
  const cx = {};
  botBump(cx);
  for (let rolls = 0, guard = 0; guard < 12; guard++) {
    let best = null;
    run.shop.forEach((s, k) => {
      if (!s) return;
      const price = shopPrice(run, s.id, s.t);
      if (price > run.gold) return;
      const smart = r01(run) < q;
      let gain;
      if (smart) gain = botValue(run, s.id, s.t || 1, P, cx).gain;
      else {
        const I = ITEMI[s.id];
        gain =
          I.tags.includes(theme) || I.for === theme || I.dmg || I.tags.includes('armor')
            ? 0.1 + r01(run) * 0.1
            : r01(run) * 0.05;
      }
      /* 動用到要存的利息錢：門檻提高 */
      const need = Math.max(P.gainMin, price * P.perGold) * (run.gold - price < keep ? 2 : 1);
      if (gain >= need && (!best || gain / price > best.v)) best = { k, v: gain / price };
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
      botBump(
        cx,
        res.merged.some(o => run.bag.items.includes(o))
      );
      /* 買進來的（或合成出來的）馬上試著放進背包 */
      for (const o of run.bench) if (o) botPlace(run, o, P, cx);
      continue;
    }
    if (
      (freeRolls(run) > 0 && rolls < P.maxRolls + 1) ||
      (rolls < P.maxRolls && run.gold - REROLL >= Math.max(P.rollGold, keep) && r01(run) < q + 0.2)
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
  /* 暫存區：放得進去而且有用的放，沒用而且湊不到合成的賣掉 */
  botBump(cx);
  for (const o of run.bench) if (o) botPlace(run, o, P, cx);
  for (const o of run.bench) {
    if (!o) continue;
    const pair = [...run.bag.items, ...run.bench].filter(q => q && q !== o && q.id === o.id && q.t === o.t).length;
    if (!pair && ITEMI[o.id].star < 3) sellItem(run, o.u);
  }
  mergeAll(run, runR(run));
}
/* 舊的買法（0.1.0～0.1.19）：照主題標籤＋隨機買、能升背包就升、全部擺進背包。留著跟新的比較強度（simLobby 的 opt.old） */
function botActOld(run, theme, q = 0.7) {
  const r = curRound(run);
  if (run.lv < BAG_MAX && run.gold >= BAGLV[run.lv + 1].cost + 2 && (run.ri > 3 || run.gold > 12)) levelUp(run);
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
      if (want && run.gold >= shopPrice(run, s.id, s.t) && benchFree(run) >= 0) buyItem(run, k);
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
    .sort((a, b) => shapeOf(b.id).length - shapeOf(a.id).length)
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
