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
/* 底材三層（0.2.6，企劃書 5.2）：品質 q（0～0.4，只靠掉落）、孔數 so（各部位有上限）、潛能 pot（還能鍛造幾次） */
const SOCK_MAX = {
  weapon: 3,
  shield: 2,
  quiver: 2,
  helm: 2,
  chest: 4,
  gloves: 2,
  boots: 2,
  belt: 1,
  ring: 1,
  amulet: 1
};
function rollQ(t) {
  /* 地圖階級越高，高區間越常見；35～40% 只在階級 10 以上 */
  const k = 1 + t / 16,
    r = Math.random(),
    p35 = t >= 10 ? 0.001 * (1 + (t - 10) * 0.3) : 0,
    p30 = 0.009 * k,
    p20 = 0.06 * k;
  const band = r < p35 ? [35, 40] : r < p35 + p30 ? [30, 35] : r < p35 + p30 + p20 ? [20, 30] : [0, 20];
  /* 每段上限不含（30～35 不會變成 35），最高那段含 40 */
  return (band[1] === 40 ? Math.round(rnd(35, 40)) : Math.floor(rnd(band[0], band[1]))) / 100;
}
function rollPot() {
  const w = [
      [3, 30],
      [4, 30],
      [5, 25],
      [6, 9],
      [7, 4],
      [8, 1.5],
      [9, 0.4],
      [10, 0.1]
    ],
    tot = w.reduce((a, b) => a + b[1], 0);
  let r = Math.random() * tot;
  for (const [v, p] of w) if ((r -= p) <= 0) return v;
  return 3;
}
function rollSock(k) {
  let n = 0;
  while (n < (SOCK_MAX[k] || 1) && Math.random() < 0.45) n++;
  return n;
}
/* 品質的區間與顏色 */
const qBand = q => (q >= 0.35 ? 3 : q >= 0.3 ? 2 : q >= 0.2 ? 1 : 0);
/* 潛能也分級（顏色跟品質一樣）：6 少見、7～8 很少見、9～10 極稀有 */
const potBand = p => (p >= 9 ? 3 : p >= 7 ? 2 : p >= 6 ? 1 : 0);
const P_N = ['', '少見', '很少見', '極稀有'];
/* 掉落標籤上要不要特別標出來（金字以上） */
function dropTag(it) {
  if (it.gem || it.q == null) return '';
  const t = [];
  if (qBand(it.q) >= 2) t.push(`品質 ${Math.round(it.q * 100)}%`);
  if (potBand(it.pot) >= 2) t.push(`潛能 ${it.pot}`);
  return t.length ? `（${t.join('・')}）` : '';
}
function mkItem(baseId, ilvl, rar) {
  const B = BASEI[baseId],
    K = KINDS[B.k],
    it = { id: ++IID, b: baseId, L: ilvl, r: rar, a: [], q: rollQ(ilvl), so: rollSock(B.k), pot: rollPot() };
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
/* 技能／輔助寶石：1×1，r=3（寶石色），lv 等級、xp 經驗 */
/* 技能寶石自己有孔（0.2.6，照 PoE2）：一開始 2 孔、最多 5 孔，輔助插在 sup 裡 */
function mkGem(g, lv = 1) {
  const it = { id: ++IID, gem: g, lv, xp: 0, r: 3, a: [], L: lv };
  if (SKILLS[g]) (it.so = 2), (it.sup = [null, null]);
  return it;
}
const gemOf = it => SKILLS[it.gem] || SUPPORTS[it.gem] || AURAS[it.gem];
const isAura = it => !!AURAS[it.gem];
const isSup = it => !!SUPPORTS[it.gem];
function dropGem(t) {
  const r = Math.random(),
    pool = r < 0.5 ? Object.keys(SKILLS) : r < 0.85 ? Object.keys(SUPPORTS) : Object.keys(AURAS);
  return mkGem(pick(pool), Math.max(1, Math.min(GEM_MAX, irnd(1, 1 + Math.floor(t / 2)))));
}
const baseOf = it => BASEI[it.b];
const kindOf = it => (it.gem ? 'gem' : baseOf(it).k);
const itemSize = it => (it.gem ? [1, 1] : KINDS[baseOf(it).k].sz);
const itemIc = it => (it.gem ? gemOf(it).ic : baseOf(it).ic);
const itemName = it =>
  it.gem ? gemOf(it).n : it.nm ? it.nm + ' ' + baseOf(it).n : (it.r === 1 ? '魔法' : '') + baseOf(it).n;
const affText = a => AFF[a.k].n.replace('{}', Array.isArray(a.v) ? a.v[0] + '～' + a.v[1] : a.v);
/* 底材的數值（品質放大）＋隱性詞 */
const qMul = it => 1 + (it.q || 0);
const DEFK = ['armor', 'ev', 'es'];
function baseText(it) {
  const B = baseOf(it),
    b = B.b,
    m = qMul(it),
    o = [];
  if (b.dmg) {
    const wt = B.wt || 'sword';
    o.push(
      `${WTN[wt]}${WT2.has(wt) ? '（雙手）' : ''} · 物理傷害 ${Math.round(b.dmg[0] * m)}～${Math.round(b.dmg[1] * m)}`,
      `每秒攻擊 ${b.as}`
    );
    if (wt === 'spear') o.push('近戰距離 +25%');
    if (wt === 'staff') o.push('打中回 1 點魔力');
  }
  const dn = { armor: '護甲', ev: '閃避', es: '能量護盾' };
  for (const k of DEFK) if (b[k]) o.push(`${dn[k]} ${Math.round(b[k] * m)}`);
  if (b.block) o.push(`格擋 ${b.block}%`);
  if (B.k === 'quiver') o.push('只有拿弓才能用');
  for (const k in b)
    if (!['dmg', 'as', 'block', ...DEFK].includes(k))
      o.push(AFF[k] ? affText({ k, v: b[k] }) : (IMPN[k] || k + ' {}').replace('{}', b[k]));
  return o;
}
/* 品質、孔數、潛能（說明框用；舊存檔的裝備沒有就不顯示） */
const Q_N = ['', '稀有', '非常稀有', '超級稀有'];
function baseLayers(it) {
  if (it.gem || it.q == null) return '';
  const qb = qBand(it.q);
  return `品質 <span class="qb${qb}">${Math.round(it.q * 100)}%${qb ? '（' + Q_N[qb] + '）' : ''}</span> · 孔 ${'○'.repeat(it.so || 0) || '無'} · 潛能 <span class="qb${potBand(it.pot)}">${it.pot}${potBand(it.pot) ? '（' + P_N[potBand(it.pot)] + '）' : ''}</span>`;
}
/* 賣價：越高階、詞綴越多越貴 */
const sellPrice = it =>
  it.gem
    ? 2 + it.lv
    : Math.round(
        (1 + it.a.length * 2 + (it.r === 2 ? 4 : 0)) * (1 + it.L * 0.4) * (1 + Math.max(0, (it.q || 0) - 0.2) * 5)
      );
/* 副手合不合規：雙手武器不能拿副手；箭袋只有拿弓才能用 */
function offOK(w, off) {
  if (!off) return true;
  const wt = (w && baseOf(w).wt) || 'sword';
  if (baseOf(off).k === 'quiver') return !!w && wt === 'bow';
  return !(w && WT2.has(wt));
}

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
/* 昇華大點的效果：ascV(s, '浪人.斬鐵' 這種鍵) → 數值，沒點是 0 */
function ascV(s, key) {
  const T = s.asc && ascNodes(s.asc);
  if (!T) return 0;
  let v = 0;
  for (const id of s.at || []) {
    const n = T.I[id];
    if (n && n.fx && n.fx[key]) v += n.fx[key];
  }
  return v;
}
/* 舊的職業核心介面（skills.js 用）：浪人的機制與核心接到昇華，其他職業還沒開放（是 0） */
const coreV = (s, cls, core) => ascV(s, `${cls}.${core}`);
const hasCls = (s, cls) => ascV(s, `${cls}.mech`) > 0;
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
    flask: 0,
    meleeP: 0,
    projP: 0,
    spellP: 0,
    minionP: 0,
    blood: 0,
    es: 0,
    esP: 0,
    esRec: 0,
    spirit: SPIRIT0,
    auraEff: 0,
    unitP: 0,
    units: 0,
    rollCd: 0,
    fireAdd: 0,
    swordP: 0,
    spearP: 0,
    staffP: 0,
    lowHp: 0,
    fullHp: 0,
    esUp: 0,
    afterRoll: 0,
    bossP: 0,
    closeP: 0,
    farP: 0,
    killHeal: 0,
    lowHpRed: 0,
    ev: 0,
    spellLv: 0,
    castP: 0
  };
  const w = s.eq.weapon,
    wb0 = w ? baseOf(w).b : { dmg: HERO.dmg, as: 1.1 },
    wb = w ? { ...wb0, dmg: wb0.dmg.map(v => v * qMul(w)) } : wb0;
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
    if (!it || (e.k === 'off' && !offOK(w, it))) continue;
    const b = baseOf(it).b;
    for (const k in b) if (k !== 'dmg' && k !== 'as') put(k, DEFK.includes(k) ? Math.round(b[k] * qMul(it)) : b[k]);
    for (const a of it.a) put(a.k, a.v);
  }
  /* 天賦樹 */
  const pt = { hpP: 0, armorP: 0, mpP: 0, mpReg: 0, cdr: 0, dmgA: 0, eleP: 0 };
  const T = s.asc && ascNodes(s.asc),
    nodes = [...(s.pt || []).map(id => PTREE.I[id]), ...(T ? (s.at || []).map(id => T.I[id]) : [])];
  for (const n of nodes) {
    if (!n) continue;
    for (const k in n.s) {
      if (k in pt) pt[k] += n.s[k];
      else if (k === 'resA') for (const r of RESK) o.res[r] += n.s[k];
      else o[k] += n.s[k];
    }
  }
  /* 魔劍士：秘法護盾、元素穿透、魔導之心 */
  o.esP += ascV(s, 'spell.ward');
  pt.eleP += ascV(s, 'spell.pen');
  if (ascV(s, 'spell.heart')) (o.spirit += 30), (o.auraEff += 25);
  /* 光環：照光環欄的順序預留精魄，精魄不夠的不生效 */
  o.spiritUsed = 0;
  o.auraOn = [];
  for (const g of s.auras || []) {
    if (!g) continue;
    const A = AURAS[g.gem];
    if (o.spiritUsed + A.sp > o.spirit) continue;
    o.spiritUsed += A.sp;
    o.auraOn.push(g.gem);
    const m = (1 + 0.03 * (g.lv - 1)) * (1 + o.auraEff / 100);
    for (const k in A.fx) {
      const v = A.fx[k] * m;
      if (k === 'wolf') o.auraWolf = 1;
      else if (k === 'resA') for (const r of RESK) o.res[r] += Math.round(v);
      else if (k in pt) pt[k] += v;
      else o[k] += v;
    }
  }
  o.es = Math.round(o.es * (1 + o.esP / 100));
  /* 持武器的加成 */
  o.wt = (w && baseOf(w).wt) || 'sword';
  /* 天賦「持劍／持矛／持棍時傷害」：野太刀也算劍；其他武器種類還沒有對應的天賦 */
  pt.dmgA += o[{ sword: 'swordP', nodachi: 'swordP', spear: 'spearP', staff: 'staffP' }[o.wt]] || 0;
  /* 昇華大點的數值效果 */
  const aura = ascV(s, 'ronin.aura');
  if (aura) (o.meleeP += 15), (o.aoe += aura);
  o.block += ascV(s, 'rapier.parry') ? 15 : 0;
  if (ascV(s, 'berserk.blood')) o.blood = 1;
  o.hp = Math.round(o.hp * (1 + pt.hpP / 100));
  o.armor = Math.round(o.armor * (1 + pt.armorP / 100));
  o.mp = Math.round(o.mp * (1 + pt.mpP / 100));
  o.mpReg = HERO.mpReg * (1 + pt.mpReg / 100);
  o.cdr = Math.min(60, pt.cdr);
  o.dmgA = pt.dmgA;
  o.eleP = pt.eleP;
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
