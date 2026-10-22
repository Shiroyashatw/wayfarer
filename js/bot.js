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
  rollGold: 8, // 錢多於這個、又沒東西好買就刷新
  maxRolls: 4, // 一回合最多刷新幾次
  lvFill: 0.777, // 背包塞到幾成滿就考慮升級
  lvKeep: 2, // 升級後至少留幾金
  sellMargin: 0.039, // 賣掉舊的換新的，戰力至少要多這個比例
  mergeBonus: 0.154, // 湊合成的額外偏好（還沒湊滿也先收）
  dotW: 1.36, // 燃燒、中毒、流血每層的價值（約幾秒）
  ctrlW: 0.665, // 暈眩、凍結、虛弱、致盲的價值倍率
  ehpW: 1.141 // 防禦的指數（>1 偏坦、<1 偏攻）
};
/* ================= 戰力分數 ================= */
function botPower(F, P = BOT_P) {
  let dps = 0;
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
    dps += hit / Math.max(0.3, w.cd);
  }
  dps *= 1 + (F.double || 0) / 100;
  dps *= 1 + ((F.execute || 0) * 0.25 + (F.rage || 0) * 0.3 + (F.ramp || 0) * 1.5 + (F.opener || 0) * 0.05) / 100;
  if (F.rushT) dps *= 1 + (F.rushP / 100) * Math.min(1, F.rushT / 9);
  let ehp = (F.hp * (1 + Math.max(-20, F.arm || 0) / 50)) / (1 - Math.min(40, F.dodge || 0) / 100);
  for (const s of F.shields)
    ehp += (s.block / Math.max(0.6, s.cd)) * 9 + (s.heal / Math.max(0.6, s.cd)) * 9 + s.thorns * 3;
  ehp += (F.regen || 0) * 9 + (F.startBlock || 0) + (F.thornsF || 0) * 6 + (F.critHeal || 0) * 4;
  for (const p of F.pots) ehp += p.v * p.n;
  /* 開戰效果：讓對手變弱（虛弱、凍結、致盲、封鎖、降階）≈ 自己變強；開戰的燃燒中毒流血算傷害 */
  let pre = 1;
  for (const p of F.pre || []) {
    if (p.k === 'weak') pre += 0.025 * p.v;
    else if (p.k === 'frozen') pre += 0.04 * p.v;
    else if (p.k === 'blind') pre += 0.03 * p.v;
    else if (p.k === 'seal') pre += 0.03 * p.v;
    else if (p.k === 'down') pre += 0.12;
    else if (p.k === 'sunder') pre += 0.01 * p.v;
    else dps += (p.v * P.dotW) / 9;
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
/* ================= 每回合 ================= */
/* q：照評估做的機率（牌階高 q 高）；其他時候用簡單的舊規則（照主題、隨便買），低牌階才會笨一點 */
function botAct(run, theme, q = 0.7, P = BOT_P) {
  const r = curRound(run);
  /* 三選一：挑戰力最高的 */
  if (run.pend) {
    const opts = run.pend.opts,
      pick =
        r01(run) < q
          ? opts.map(id => [id, botValue(run, id, 1, P, {}).gain]).sort((a, b) => b[1] - a[1])[0][0]
          : opts[fl(r01(run) * opts.length)];
    takePick(run, pick, true);
    if (run.hold) {
      const h = run.hold;
      run.hold = null;
      const fi = benchFree(run);
      if (fi >= 0) run.bench[fi] = h;
    }
  }
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
    if (rolls < P.maxRolls && run.gold - REROLL >= Math.max(P.rollGold, keep) && r01(run) < q + 0.2) {
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
