/* dungeonPOE · 裝備：產生（稀有度、詞綴）、名字與說明、格子背包（放得下、自動擺）、角色數值 stats */
'use strict';
const rnd = (a, b) => a + Math.random() * (b - a);
const irnd = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
let IID = Date.now() % 1e6;

/* ---------- 產生 ---------- */
/* 稀有度：bonus 越高越容易出藍、黃 */
function rollRarity(bonus) {
  const r = Math.random() * (1 + bonus);
  return r > 0.93 ? 2 : r > 0.64 ? 1 : 0;
}
function rollAff(k, ilvl) {
  const best = bestTier(ilvl),
    T = Math.min(12, best + irnd(0, 4)),
    [lo, hi] = tierRange(k, T);
  if (AFF[k].add) {
    /* 附加傷害：a～b，b 大約是 a 的 2 倍 */
    const v = irnd(lo, hi);
    return { k, T, v: [Math.max(1, Math.round(v * 0.5)), v] };
  }
  return { k, T, v: irnd(lo, hi) };
}
/* 隨機挑一種當下能掉的底材 */
function pickBase(ilvl, kind) {
  const pool = BASES.filter(b => b.lv <= ilvl && (!kind || b.k === kind));
  /* 高階的底材機率高一點 */
  const w = pool.map(b => 1 + b.lv / 4);
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) if ((r -= w[i]) <= 0) return pool[i];
  return pool[pool.length - 1];
}
function mkItem(baseId, ilvl, rar) {
  const B = BASEI[baseId],
    K = KINDS[B.k],
    it = { id: ++IID, b: baseId, L: ilvl, r: rar, a: [] };
  if (rar === 0) return it;
  /* 魔法 1～2 條（前、後綴各最多 1）；稀有 3～6 條（各最多 3） */
  const n = rar === 1 ? irnd(1, 2) : irnd(3, 6),
    cap = rar === 1 ? 1 : 3,
    pool = K.aff.slice();
  let np = 0,
    ns = 0;
  for (let i = 0; i < 40 && it.a.length < n && pool.length; i++) {
    const j = Math.floor(Math.random() * pool.length),
      k = pool[j],
      pre = AFF[k].p;
    if ((pre && np >= cap) || (!pre && ns >= cap)) continue;
    pool.splice(j, 1);
    it.a.push(rollAff(k, ilvl));
    pre ? np++ : ns++;
  }
  /* 前綴在前 */
  it.a.sort((x, y) => AFF[y.k].p - AFF[x.k].p);
  if (rar === 2) it.nm = pick(NAME_A) + pick(NAME_B);
  return it;
}
function dropItem(ilvl, bonus) {
  return mkItem(pickBase(ilvl).id, ilvl, rollRarity(bonus));
}
const baseOf = it => BASEI[it.b];
const kindOf = it => (it.frag ? 'frag' : baseOf(it).k);
const itemSize = it => (it.frag ? [1, 1] : KINDS[baseOf(it).k].sz);
const itemIc = it => (it.frag ? 'mat_frag' : baseOf(it).ic);
const itemName = it =>
  it.frag ? '地圖碎片' : it.nm ? it.nm + ' ' + baseOf(it).n : (it.r === 1 ? '魔法' : '') + baseOf(it).n;
const affText = a => AFF[a.k].n.replace('{}', Array.isArray(a.v) ? a.v[0] + '～' + a.v[1] : a.v);
/* 底材的固定數值說明 */
function baseText(it) {
  const b = baseOf(it).b,
    o = [];
  if (b.dmg) o.push(`物理傷害 ${b.dmg[0]}～${b.dmg[1]}`, `每秒攻擊 ${b.as}`);
  if (b.armor) o.push(`護甲 ${b.armor}`);
  if (b.block) o.push(`格擋 ${b.block}%`);
  for (const k of ['life', 'resF', 'resC', 'resL', 'regen', 'crit']) if (b[k]) o.push(affText({ k, v: b[k] }));
  return o;
}
/* 賣價：越高階、詞綴越多越貴 */
const sellPrice = it => (it.frag ? 1 : Math.round((1 + it.a.length * 2 + (it.r === 2 ? 4 : 0)) * (1 + it.L * 0.4)));

/* ---------- 格子背包：g = { w, h, items: [道具（含 x, y）] } ---------- */
function gridFree(g, x, y, w, h, skip) {
  if (x < 0 || y < 0 || x + w > g.w || y + h > g.h) return false;
  for (const o of g.items) {
    if (o === skip) continue;
    const [ow, oh] = itemSize(o);
    if (x < o.x + ow && o.x < x + w && y < o.y + oh && o.y < y + h) return false;
  }
  return true;
}
/* 範圍裡擋到的道具 */
function gridHits(g, x, y, w, h, skip) {
  return g.items.filter(o => {
    if (o === skip) return false;
    const [ow, oh] = itemSize(o);
    return x < o.x + ow && o.x < x + w && y < o.y + oh && o.y < y + h;
  });
}
/* 從左上往下、往右找第一個放得下的位置（PoE 的順序：一欄一欄） */
function gridAuto(g, it) {
  const [w, h] = itemSize(it);
  for (let x = 0; x <= g.w - w; x++)
    for (let y = 0; y <= g.h - h; y++)
      if (gridFree(g, x, y, w, h)) {
        it.x = x;
        it.y = y;
        g.items.push(it);
        return true;
      }
  return false;
}

/* ---------- 角色數值：等級＋穿在身上的裝備 ---------- */
function stats(s = S) {
  const o = {
    hp: HERO.hp + 12 * (s.lv - 1),
    mp: HERO.mp + 3 * (s.lv - 1),
    dmgP: 4 * (s.lv - 1),
    flat: [0, 0],
    add: { fire: [0, 0], cold: [0, 0], light: [0, 0], chaos: [0, 0] },
    as: 0,
    crit: HERO.crit,
    critX: 0,
    armor: 0,
    block: 0,
    res: { fire: 0, cold: 0, light: 0, chaos: 0 },
    ms: 0,
    regen: 0,
    loh: 0,
    aoe: 0,
    flask: 0
  };
  const w = s.eq.weapon,
    wb = w ? baseOf(w).b : { dmg: HERO.dmg, as: 1.1 };
  const put = (k, v) => {
    if (k === 'life') o.hp += v;
    else if (k === 'resF') o.res.fire += v;
    else if (k === 'resC') o.res.cold += v;
    else if (k === 'resL') o.res.light += v;
    else if (k === 'resX') o.res.chaos += v;
    else if (k === 'resA') for (const r of ['fire', 'cold', 'light']) o.res[r] += v;
    else if (k === 'flat') (o.flat[0] += v[0]), (o.flat[1] += v[1]);
    else if (o.add[k]) (o.add[k][0] += v[0]), (o.add[k][1] += v[1]);
    else if (k === 'dmgP') o.dmgP += v;
    else if (k in o) o[k] += v;
  };
  for (const e of EQS) {
    const it = s.eq[e.k];
    if (!it) continue;
    const b = baseOf(it).b;
    for (const k in b) if (k !== 'dmg' && k !== 'as') put(k, b[k]);
    for (const a of it.a) put(a.k, a.v);
  }
  const m = 1 + o.dmgP / 100;
  o.dmg = [(wb.dmg[0] + o.flat[0]) * m, (wb.dmg[1] + o.flat[1]) * m];
  o.aps = wb.as * (1 + o.as / 100);
  o.asM = o.aps / 1.1;
  o.spd = HERO.spd * (1 + o.ms / 100);
  o.aoeM = 1 + o.aoe / 100;
  o.critM = HERO.critX + o.critX / 100;
  o.block = Math.min(50, o.block);
  for (const r of RESK) o.res[r] = Math.min(RES_CAP, o.res[r]);
  return o;
}
/* 平均每秒傷害（給比較用） */
function dps(o) {
  let d = (o.dmg[0] + o.dmg[1]) / 2;
  for (const k in o.add) d += (o.add[k][0] + o.add[k][1]) / 2;
  return d * o.aps * (1 + (Math.min(100, o.crit) / 100) * (o.critM - 1));
}
