/* 漫步勇者 · 玩家狀態、裝備、詞綴、通貨製作、屬性計算 */
'use strict';
/* ================= player & items ================= */
function newGame() {
  const g = {
    v: 19,
    cls: 'destiny',
    lv: 1,
    tier: 1,
    tmax: 1,
    xp: 0,
    gold: 80,
    crystal: 0,
    hp: 60,
    mp: 20,
    potions: 3,
    ethers: 1,
    inv: [],
    eq: {},
    cur: { trans: 4, aug: 4, regal: 2, alch: 1, chaos: 1, exalt: 0, soul: 0, wish: 10, eng: 1 },
    pact: { list: [], eq: [], follow: null },
    gems: [],
    flags: [],
    scrolls: { stele: 0, circle: 0 },
    insc: [],
    tabs: [],
    frags: [],
    obel: {},
    caravan: {},
    ess: {},
    und: {},
    mistp: {},
    hunt: { on: false, blood: 0, acc: 0, marks: {} },
    summons: [],
    daily: null,
    foot: {},
    asc: { cls: null, br: null, trials: 0, nodes: [] },
    sins: {},
    jewels: [],
    jsock: {},
    sk: [null, null, null, null],
    autoHp: 0,
    autoMp: 0,
    regenAt: 0,
    tree: ['start'],
    lat: START.lat - 0.0009,
    lng: START.lng,
    walked: 0,
    walkCur: 0,
    bases: [],
    defeated: {},
    cleared: {},
    bought: {},
    found: {},
    log: [],
    timeOffset: 0,
    music: true,
    sfx: true,
    intro: true,
    trail: [],
    explMs: 0,
    buff: null,
    bonusPts: 0,
    treeV: 3
  };
  SLOTS.forEach(s => (g.eq[s] = null));
  g.eq.weapon = makeItem('weapon', 1, 0, 0);
  g.inv.push(
    makeItem('offhand', 1, 0, 0),
    makeItem('belt', 1, 0, 0),
    makeItem('ring', 2, 1, 0),
    makeItem('chest', 2, 0, 0),
    makeItem('boots', 2, 1, 1)
  );
  return g;
}
function makeItem(slot, ilvl, rar, baseIdx, r = Math.random) {
  const bl = BASES[slot],
    bi = baseIdx ?? fl(r() * bl.length),
    b = bl[bi];
  const it = { id: uid(), slot, bi, ilvl, r: 0, aff: [] };
  if (slot === 'weapon') {
    const k = 1 + ilvl * 0.1;
    it.phys = [Math.round(b.phys[0] * k), Math.round(b.phys[1] * k)];
    it.crit = b.crit;
  }
  if (b.arm) it.arm = Math.round(b.arm * (6 + ilvl * 2.5));
  if (b.imp) it.imp = b.imp;
  if (b.lure) it.lure = b.lure;
  /* 0.3.1.9 品質：武器（物理傷害）與有護甲的裝備（護甲）才有；掉落時約 30% 帶 1～10% */
  if (hasQ(it) && r() < 0.3) it.q = 1 + fl(r() * 10);
  if (rar === 1) toMagic(it, r);
  else if (rar === 2) toRare(it, r);
  return it;
}
const baseOf = it => BASES[it.slot][it.bi];
/* 品質：武器加物理傷害、防具加護甲，每 1% 加 1%。一般手段（掉落、磨刀石、護甲片）最多 20%，地城首領的精良裝備可以超過 */
const Q_CAP = 20;
const hasQ = it => !!it && (!!it.phys || !!it.arm);
const qMul = it => 1 + (it.q || 0) / 100;
const qPhys = it => (it.q ? [Math.round(it.phys[0] * qMul(it)), Math.round(it.phys[1] * qMul(it))] : it.phys);
const qArm = it => (it.q ? Math.round(it.arm * qMul(it)) : it.arm);
/* 詞綴可以開放給整個部位（offhand），或只給某種底材（lantern、shield、focus） */
const affFits = (a, it) => a.slots.includes(it.slot) || (!!baseOf(it).k && a.slots.includes(baseOf(it).k));
/* 物品能不能放進某個裝備欄：戒指兩格都可以 */
const fitsSlot = (it, sl) => it.slot === sl.replace(/\d$/, '');
/* only：只從這些詞綴 id 裡抽（亡靈製作的定向加入用） */
function rollAffix(it, type, r = Math.random, only) {
  const have = new Set(it.aff.map(a => a.id));
  const pool = AFF.filter(a => a.t === type && affFits(a, it) && !have.has(a.id) && (!only || only.includes(a.id)));
  if (!pool.length) return false;
  const a = pool[fl(r() * pool.length)],
    ok = a.tiers.map((t, i) => ({ t, i })).filter(o => o.t[0] <= it.ilvl);
  let tot = 0;
  ok.forEach(o => (tot += o.i + 1));
  let x = r() * tot,
    pick = ok[ok.length - 1];
  for (const o of ok) {
    x -= o.i + 1;
    if (x < 0) {
      pick = o;
      break;
    }
  }
  const [, lo, hi] = pick.t;
  it.aff.push({ id: a.id, tier: pick.i + 1, v: lo + fl(r() * (hi - lo + 1)) });
  return true;
}
const cnt = (it, t) => it.aff.filter(a => AFFI[a.id].t === t).length;
function addRandom(it, r = Math.random) {
  const maxP = it.r === 1 ? 1 : 3,
    maxS = it.r === 1 ? 1 : 3,
    opts = [];
  if (cnt(it, 'P') < maxP) opts.push('P');
  if (cnt(it, 'S') < maxS) opts.push('S');
  if (!opts.length) return false;
  const t = opts[fl(r() * opts.length)];
  return rollAffix(it, t, r) || rollAffix(it, t === 'P' ? 'S' : 'P', r);
}
function toMagic(it, r = Math.random, n = r() < 0.5 ? 1 : 2) {
  it.r = 1;
  it.aff = [];
  for (let i = 0; i < n; i++) addRandom(it, r);
  if (!it.aff.length) addRandom(it, r);
  it.rn = null;
}
const rareName = r => RAREA[fl(r() * RAREA.length)] + RAREB[fl(r() * RAREB.length)];
function toRare(it, r = Math.random, n = 4) {
  it.r = 2;
  it.aff = [];
  for (let i = 0; i < n; i++) addRandom(it, r);
  it.rn = rareName(r);
}
function itemTitle(it) {
  const b = baseOf(it);
  if (it.r === 3 && it.leg) return LEGI[it.leg].n;
  if (it.r === 2) return it.rn;
  if (it.r === 1) {
    const p = it.aff.find(a => AFFI[a.id].t === 'P'),
      s = it.aff.find(a => AFFI[a.id].t === 'S');
    return `${p ? AFFI[p.id].n + '的' : ''}${b.n}${s ? '・' + AFFI[s.id].n : ''}`;
  }
  return b.n;
}
const itemName = it => `<span style="color:${RCOL[it.r]}">${esc(itemTitle(it))}</span>`;
function itemSum(it) {
  const out = [];
  if (it.phys) out.push(`物理 ${qPhys(it)[0]}–${qPhys(it)[1]}`);
  if (it.arm) out.push(`護甲 ${qArm(it)}`);
  if (it.q) out.push(`品質 ${it.q}%`);
  if (!it.aff.length && it.imp) out.push(STATN[it.imp[0]](it.imp[1]));
  it.aff.slice(0, 2).forEach(a => out.push(AFFI[a.id].f(a.v)));
  return out.join('・') + (it.aff.length > 2 ? `・另 ${it.aff.length - 2} 條` : '');
}
function itemCard(it, title) {
  const b = baseOf(it);
  let h = `<div class="icard" style="border-color:${RCOL[it.r]}88"><div class="ihead" style="color:${RCOL[it.r]}">${esc(itemTitle(it))}</div><div class="isub">${it.r === 2 ? esc(b.n) + '・' : ''}${RNAME[it.r]}${SLOTN[it.slot]}・物品等級 ${it.ilvl}${typeof gearArt === 'function' && gearArt(it) ? '・' + TIERN[tierOf(it.ilvl)] + '材質' : ''}${title ? '・' + title : ''}</div>`;
  const base = [];
  if (it.phys)
    base.push(
      `${WTAGN[b.t] || ''}${b.th ? '・雙手武器（不能裝副手）' : '・單手武器'}`,
      `物理傷害 ${qPhys(it)[0]}–${qPhys(it)[1]}${it.q ? `（品質 +${it.q}%）` : ''}`,
      `暴擊率 ${it.crit}%`
    );
  if (it.arm) base.push(`護甲 ${qArm(it)}${it.q ? `（品質 +${it.q}%）` : ''}`);
  if (hasQ(it) && !it.q) base.push('品質 0%');
  if (it.imp) base.push(STATN[it.imp[0]](it.imp[1]));
  if (it.lure) base.push(STATN.lure(it.lure));
  if (base.length) h += `<div class="ibase">${base.map(esc).join('<br>')}</div>`;
  if (it.leg)
    h += `<div class="iaff">${LEGI[it.leg].lines.map(l => `<div><span style="color:${RCOL[3]}">${esc(l)}</span><small>傳奇</small></div>`).join('')}</div>`;
  if (it.sh)
    h += `<div class="isub" style="color:${it.sh >= 100 ? '#e5484d' : '#8fd18a'}">屍化 ${it.sh}/100${it.sh >= 100 ? '・已鎖定' : ''}</div>`;
  if (it.aff.length)
    h += `<div class="iaff">${[...it.aff]
      .sort((a, b) => (AFFI[a.id].t < AFFI[b.id].t ? -1 : 1))
      .map(
        a =>
          `<div><span>${esc(AFFI[a.id].f(a.v))}</span><small>${AFFI[a.id].t === 'P' ? '前綴' : '後綴'} T${a.tier}</small></div>`
      )
      .join('')}</div>`;
  return h + '</div>';
}
const sellVal = it => Math.round((6 + it.ilvl * 3) * [1, 2.5, 6, 10][it.r]);
function giveItem(it) {
  if (S.inv.length >= 30) {
    S.gold += sellVal(it);
    addLog(`背包已滿，${itemTitle(it)} 自動賣出`);
    return;
  }
  S.inv.push(it);
}
function giveCur(id, n = 1) {
  S.cur[id] = (S.cur[id] || 0) + n;
}
function rollCur(boost = 1) {
  let tot = 0;
  CUR.forEach(c => (tot += c.id === 'chaos' || c.id === 'exalt' || c.id === 'alch' ? c.w * boost : c.w));
  let x = Math.random() * tot;
  for (const c of CUR) {
    x -= c.id === 'chaos' || c.id === 'exalt' || c.id === 'alch' ? c.w * boost : c.w;
    if (x < 0) return c.id;
  }
  return 'trans';
}
const curDot = id => `<img class="cico" src="${curIcon(id)}" alt="">`;
/* PoE2 式製作：沒有改造石，魔法裝備用增幅石補滿、富豪石升稀有，稀有裝備用崇高石加詞綴、混沌石一次換一條 */
function craftable(it, id) {
  if (!it || (it.sh || 0) >= 100) return false;
  return {
    trans: it.r === 0,
    aug: it.r === 1 && it.aff.length < 2,
    regal: it.r === 1,
    alch: it.r === 0,
    chaos: it.r === 2 && it.aff.length > 0,
    exalt: it.r === 2 && it.aff.length < 6,
    whet: !!it.phys && (it.q || 0) < Q_CAP,
    scrap: !!it.arm && !it.phys && (it.q || 0) < Q_CAP
  }[id];
}
function craft(it, id) {
  if (!craftable(it, id) || !(S.cur[id] > 0)) return false;
  S.cur[id]--;
  if (id === 'trans') toMagic(it, Math.random, 1);
  else if (id === 'aug') addRandom(it);
  else if (id === 'regal') {
    it.r = 2;
    it.rn = rareName(Math.random);
    addRandom(it);
  } else if (id === 'alch') toRare(it);
  else if (id === 'chaos') {
    const gone = it.aff.splice(fl(Math.random() * it.aff.length), 1)[0];
    if (!addRandom(it)) it.aff.push(gone);
  } else if (id === 'exalt') addRandom(it);
  else if (id === 'whet' || id === 'scrap') it.q = Math.min(Q_CAP, (it.q || 0) + [5, 2, 1][Math.min(2, it.r)]);
  return true;
}

/* ================= skill gems ================= */
const newGem = k => ({ id: uid(), k, lv: 1, dust: 0, en: [] });
const gemSlots = g => Math.min(6, fl(g.lv / 5)) + (g.xs || 0);
const gemOpen = g => gemSlots(g) - g.en.length;
const gemOf = id => S.gems.find(g => g.id === id);
const GEMK = () => Object.keys(SKILLS).filter(k => k !== 'attack');
/* 技能石換算成戰鬥用的技能：攻擊每級 +6% 倍率，法術的基礎傷害隨等級提高，治癒每級 +6%，消耗每級 +3%。
   0.3.12：契靈的「技能等級 +N」直接加在等級上（可以超過上限，刻印槽數照技能石本身的等級） */
function gemSkill(g) {
  const b = SKILLS[g.k],
    plus = typeof pactSkLv === 'function' ? pactSkLv(g.k) : 0,
    L = g.lv - 1 + plus,
    t = {};
  g.en.forEach(a => (t[a.id] = (t[a.id] || 0) + a.v));
  const sk = {
    ...b,
    gid: g.id,
    lv: g.lv + plus,
    plus,
    nEn: g.en.length,
    mp: Math.round(b.mp * (1 + 0.03 * L) * (1 - (t.cost || 0) / 100))
  };
  if (b.kind === 'attack') sk.mult = b.mult * (1 + 0.06 * L) * (1 + (t.dmg || 0) / 100);
  if (b.kind === 'spell') {
    sk.mult = b.mult * (1 + (t.dmg || 0) / 100);
    sk.sb = 9 + 4 * L;
  }
  if (b.kind === 'heal') sk.heal = (b.heal || 0.35) * (1 + 0.06 * L) * (1 + (t.heal || 0) / 100);
  ['crit', 'ail', 'brk', 'leech', 'dbl'].forEach(k => (sk[k] = (b[k] || 0) + (t[k] || 0)));
  /* 召喚物與增益也隨等級變強（每級 +4%，回合數不變） */
  if (b.pet) sk.pet = { ...b.pet, mult: b.pet.mult * (1 + 0.06 * L) * (1 + (t.dmg || 0) / 100) };
  if (b.buff)
    sk.buff = Object.fromEntries(
      Object.entries(b.buff).map(([k, v]) =>
        typeof v === 'number' && k !== 'turns' ? [k, Math.round(v * (1 + 0.04 * L) * 100) / 100] : [k, v]
      )
    );
  return sk;
}
/* 目前技能欄的 4 個技能（空格是 null），戰鬥用 's0'～'s3' 指定 */
const mySkills = () => S.sk.map(id => (gemOf(id) ? gemSkill(gemOf(id)) : null));
function rollGAff(g, hi) {
  const kind = SKILLS[g.k].kind,
    have = g.en.map(a => a.id);
  let pool = GAFF.filter(a => a.k.includes(kind) && !have.includes(a.id));
  if (!pool.length) pool = GAFF.filter(a => a.k.includes(kind));
  const a = pool[fl(Math.random() * pool.length)],
    x = Math.random(),
    t = hi ? (x < 0.35 ? 1 : 2) : x < 0.1 ? 1 : x < 0.4 ? 2 : 3;
  return gAffVal({ id: a.id, t });
}
function gAffVal(e) {
  const [lo, hi] = GAFFI[e.id].t[e.t - 1];
  e.v = lo + fl(Math.random() * (hi - lo + 1));
  return e;
}
const gAffTxt = e => `${GAFFI[e.id].n(e.v)} <span class="sub" style="font-weight:400">T${e.t}</span>`;
function gemCraftable(g, id) {
  if (!g) return false;
  /* 腐化後只能用刻印石／崇高刻印石填空槽 */
  if (g.cor) return (id === 'eng' || id === 'engX') && gemOpen(g) > 0;
  return {
    vaal: g.lv >= GEM_MAX,
    eng: gemOpen(g) > 0,
    engX: gemOpen(g) > 0,
    engC: g.en.length > 0,
    prism: g.en.length > 0,
    engD: g.en.length > 0
  }[id];
}
function gemCraft(g, id) {
  if (!gemCraftable(g, id) || !(S.cur[id] > 0)) return false;
  S.cur[id]--;
  if (id === 'eng' || id === 'engX') g.en.push(rollGAff(g, id === 'engX'));
  else if (id === 'engC') {
    const i = fl(Math.random() * g.en.length);
    g.en.splice(i, 1);
    g.en.splice(i, 0, rollGAff(g, false));
  } else if (id === 'prism') {
    let i = 0;
    g.en.forEach((a, j) => a.t > g.en[i].t && (i = j));
    g.en.splice(i, 1);
    g.en.splice(i, 0, rollGAff(g, false));
  } else if (id === 'engD') g.en.forEach(gAffVal);
  else if (id === 'vaal') return corrupt(g);
  return true;
}
/* 腐化：超限（等級 +1）、擴槽（刻印槽 +1）、毀滅、降等，各 25%。回傳結果文字 */
function corrupt(g) {
  g.cor = true;
  const x = fl(Math.random() * 4);
  if (x === 0) {
    g.lv++;
    return '超限突破！等級 +1';
  }
  if (x === 1) {
    g.xs = (g.xs || 0) + 1;
    return '擴槽！刻印槽 +1';
  }
  if (x === 2) {
    S.gems = S.gems.filter(q => q !== g);
    S.sk = S.sk.map(id => (id === g.id ? null : id));
    return '技能石在冥府之血中碎裂了……';
  }
  g.lv--;
  return '劣化：等級 -1';
}
/* 升級：要靈魂（擊殺怪物得到），而且技能石等級不能超過角色等級 */
function gemLvBlock(g) {
  if (g.cor) return '已腐化';
  if (g.lv >= GEM_MAX) return '已滿級';
  if (g.lv + 1 > S.lv) return `需要角色 Lv${g.lv + 1}`;
  if ((S.cur.soul || 0) < soulNeed(g.lv)) return '靈魂不足';
  return '';
}
/* 分解：退回升級花掉的靈魂的 70%（g.dust 是累積投入的靈魂） */
const gemSoulBack = g => Math.round((g.dust || 0) * 0.7);
/* 0.3.11 技能石商店：每種技能有需求等級（開局技能 Lv1，其餘依強度分組平均分散到 Lv1～28，也就是 T1～T5），
   城鎮商店只賣已解鎖 T 的技能石；買下來是 Lv1，每種技能只能有一顆 */
/* 需求 Lv1 的入門技能石（開局送強力一擊與治癒） */
const GEM_START = ['power', 'bash', 'double', 'fire', 'heal', 'poison', 'skeleton', 'talisman'];
let GEMREQ = null;
function gemReq(k) {
  if (!GEMREQ) {
    const ks = GEMK(),
      ord = [
        ...GEM_START,
        ...ks.filter(q => !GEM_START.includes(q)).sort((a, b) => (SKILLS[a].r || 3) - (SKILLS[b].r || 3))
      ];
    GEMREQ = {};
    ord.forEach((q, i) => (GEMREQ[q] = GEM_START.includes(q) ? 1 : 1 + Math.round((27 * i) / (ord.length - 1))));
  }
  return GEMREQ[k] || 1;
}
const gemTier = k => tierOfLv(gemReq(k));
const gemPrice = k => Math.round(30 + 8 * Math.pow(gemReq(k), 1.6));
const hasGem = k => S.gems.some(g => g.k === k);
function gemBuyBlock(k) {
  if (hasGem(k)) return '已擁有';
  if (gemTier(k) > tierMax()) return `T${gemTier(k)} 解鎖`;
  if (S.lv < gemReq(k)) return `需要 Lv${gemReq(k)}`;
  if (S.gold < gemPrice(k)) return '金幣不足';
  return '';
}
function giveGem(k) {
  const g = newGem(k);
  S.gems.push(g);
  const i = S.sk.indexOf(null);
  if (i >= 0 && !S.sk.some(id => gemOf(id) && gemOf(id).k === k)) S.sk[i] = g.id;
  return g;
}

/* ================= stats ================= */
/* 目前所在地城的規格（單人 D 或多人 MB） */
const curSpec = () => (D && D.spec) || (MB && MB.spec) || null;
const STAT0 = [
  'life',
  'lifePct',
  'lifeMore',
  'physPct',
  'flatPhys',
  'addFire',
  'addCold',
  'addLight',
  'spellPct',
  'elePct',
  'firePct',
  'coldPct',
  'lightPct',
  'armor',
  'armorPct',
  'armorMore',
  'mana',
  'resFire',
  'resCold',
  'resLight',
  'resAll',
  'critPct',
  'critMulti',
  'leech',
  'speed',
  'regen',
  'physMore',
  'dmgMore',
  'vision',
  'lure',
  'evade',
  'dodgeCap',
  'conv',
  'poisonPct',
  'poisonCh',
  'ail',
  'dbl',
  'mpCost',
  'healPct',
  'goldPct',
  'manaRegen',
  'noCrit',
  'blood',
  'mom',
  'lowLife',
  'vaal',
  'ironReflex',
  'noFreeze',
  'noDodge',
  'swordPct',
  'swordCrit',
  'axePct',
  'axeCm',
  'bowPct',
  'bowCrit',
  'staffPct',
  'staffMana',
  'shieldArm',
  'shieldRes',
  'focusPct',
  'dmgRed',
  'taunt',
  'healAll',
  'allyDmg',
  'engPct',
  'legPride',
  'legEnvy',
  'legWrath',
  'legGreed',
  'legGlut',
  'legLust',
  'echo',
  'bleedCh',
  'stunCh',
  'exec',
  'penRes',
  'markFirst',
  'dodgeCrit',
  'counter',
  'killStack',
  'killMax',
  'keepStacks',
  'killHeal',
  'killMana',
  'noPotion',
  'hpDrain',
  'block',
  'reflectPct',
  'shieldPct',
  'extraTurn',
  'curseCh',
  'curseP',
  'spread',
  'petPct',
  'potPct',
  'potBomb',
  'ailDur',
  'dotPct',
  'anyWep',
  'petStart'
];
function sumStats() {
  const t = {};
  STAT0.forEach(k => (t[k] = 0));
  const A = (k, v) => (t[k] = (t[k] || 0) + v);
  for (const s of SLOTS) {
    const it = S.eq[s];
    if (!it || (s === 'offhand' && twoHand())) continue;
    if (it.arm) t.armor += qArm(it);
    if (it.imp) A(it.imp[0], it.imp[1]);
    if (it.lure) t.lure += it.lure;
    it.aff.forEach(a => A(a.id, a.v));
    if (it.leg) for (const k in LEGI[it.leg].st) A(k, LEGI[it.leg].st[k]);
  }
  for (const id of S.tree) {
    const n = TREE.byId[id];
    if (n) for (const k in n.st) A(k, n.st[k]);
  }
  jewelStats(A);
  zodStats(A);
  if (typeof pactStats === 'function') pactStats(A);
  if (typeof ascStats === 'function') ascStats(A);
  return t;
}
/* 升級只成長生命與魔力（所有人相同），其他數值靠裝備、天賦與技能石 */
const HP_LV = 10,
  MP_LV = 3;
/* 天賦的基石會改變規則（血魔法、心靈凌駕、鋼鐵反射…），全部在這裡換算成數值，單人與多人戰鬥共用 */
function stats() {
  const L = S.lv - 1,
    t = sumStats(),
    wt = wepType(),
    ot = offType();
  /* 武器專精天賦：只有拿著對應武器時才生效 */
  if (wt === 'sword') {
    t.physPct += t.swordPct;
    t.critPct += t.swordCrit;
  } else if (wt === 'axe') {
    t.physPct += t.axePct;
    t.critMulti += t.axeCm;
  } else if (wt === 'bow') {
    t.physPct += t.bowPct;
    t.critPct += t.bowCrit;
  } else if (wt === 'staff') {
    t.spellPct += t.staffPct;
    t.mana += t.staffMana;
  }
  if (ot === 'shield') {
    t.armorPct += t.shieldArm;
    t.resAll += t.shieldRes;
  } else if (ot === 'focus') t.spellPct += t.focusPct;
  const w = S.eq.weapon,
    ph = w ? qPhys(w) : [1, 3];
  const flat = 4 + t.flatPhys;
  const sp = curSpec(),
    ew = sp && sp.eleweak ? 20 : 0,
    dm = 1 + t.dmgMore / 100,
    elm = {
      fire: 1 + (t.elePct + t.firePct) / 100,
      cold: 1 + (t.elePct + t.coldPct) / 100,
      light: 1 + (t.elePct + t.lightPct) / 100
    };
  const pm = (1 + t.physPct / 100) * (1 + t.physMore / 100) * dm,
    cv = Math.min(100, t.conv) / 100;
  let physLo = (ph[0] + flat) * pm,
    physHi = (ph[1] + flat) * pm;
  const toFire = ((physLo + physHi) / 2) * cv * elm.fire;
  physLo *= 1 - cv;
  physHi *= 1 - cv;
  const dodgeRaw = t.speed * 1.5 + t.evade;
  let armor = (15 + t.armor) * (1 + t.armorPct / 100) * (1 + t.armorMore / 100);
  if (t.ironReflex) armor *= 1 + (Math.max(0, dodgeRaw) * 3) / 100;
  return {
    maxhp: Math.max(1, Math.round((80 + HP_LV * L + t.life) * (1 + t.lifePct / 100) * (1 + t.lifeMore / 100))),
    maxmp: Math.round(20 + MP_LV * L + t.mana),
    armor: Math.round(armor),
    res: {
      fire: Math.min(75, t.resFire + t.resAll - ew),
      cold: Math.min(75, t.resCold + t.resAll - ew),
      light: Math.min(75, t.resLight + t.resAll - ew)
    },
    physLo,
    physHi,
    fire: t.addFire * elm.fire * dm + toFire,
    cold: t.addCold * elm.cold * dm,
    light: t.addLight * elm.light * dm,
    spellMul: (1 + t.spellPct / 100) * dm,
    elm,
    crit: t.noCrit ? 0 : Math.max(0, Math.min(75, (w ? w.crit : 5) + t.critPct)),
    critMulti: Math.max(110, 150 + t.critMulti),
    leech: t.leech * (t.vaal ? 2 : 1),
    speed: 10 + t.speed,
    regen: t.vaal ? 0 : t.regen,
    dodge: t.ironReflex || t.noDodge ? 0 : Math.max(0, Math.min(30 + t.dodgeCap, dodgeRaw)),
    vision: Math.round((dayPhase().night > 0.5 ? 260 : 600) * (1 + t.vision / 100)),
    lure: t.lure,
    mpCost: Math.min(60, t.mpCost),
    blood: !!t.blood,
    mom: Math.min(50, t.mom),
    lowLife: t.lowLife,
    healMul: 1 + t.healPct / 100,
    goldMul: 1 + t.goldPct / 100,
    manaRegen: t.manaRegen,
    poisonCh: Math.min(100, t.poisonCh),
    poisonMul: 1 + t.poisonPct / 100,
    ail: 1 + t.ail / 100,
    dbl: Math.min(50, t.dbl),
    noFreeze: !!t.noFreeze,
    dmgRed: Math.min(50, t.dmgRed),
    taunt: t.taunt,
    healAll: t.healAll,
    allyDmg: t.allyDmg,
    engPct: t.engPct,
    legPride: t.legPride,
    legEnvy: t.legEnvy,
    legWrath: t.legWrath,
    legGreed: t.legGreed,
    legGlut: t.legGlut,
    legLust: t.legLust,
    /* 0.3：武器類別（昇華輔助與技能標籤用）、昇華輔助效果、昇華與新技能的機制 */
    wtag: wt,
    ranged: wt === 'bow',
    sup: typeof ascSup === 'function' ? ascSup() : [],
    ...Object.fromEntries(MECH.map(k => [k, t[k]])),
    dotMul: 1 + t.dotPct / 100,
    killMax: t.killMax || 10
  };
}
/* 0.3 新機制的屬性：直接照加總傳到戰鬥（數值意義見 STATN） */
const MECH = [
  'anyWep',
  'petStart',
  'echo',
  'bleedCh',
  'stunCh',
  'exec',
  'penRes',
  'markFirst',
  'dodgeCrit',
  'counter',
  'killStack',
  'keepStacks',
  'killHeal',
  'killMana',
  'noPotion',
  'hpDrain',
  'block',
  'reflectPct',
  'shieldPct',
  'extraTurn',
  'curseCh',
  'curseP',
  'spread',
  'petPct',
  'potPct',
  'potBomb',
  'ailDur'
];
/* 升級曲線（0.3.1.7／0.3.1.8 前期放緩）：原本的 40·lv^2.1＋20·lv 乘上前期折扣，Lv1 打 2 折，往後平滑回到 Lv25 的原值。
   以同等級一般怪估算：Lv1→2 約 1 隻、Lv5 約 10 隻、Lv10 約 32 隻、Lv15 約 76 隻、Lv20 約 150 隻（到 Lv10 共約 100 隻、到 Lv20 共約 860 隻） */
const xpNeed = lv => {
  const base = 40 * Math.pow(lv, 2.1) + 20 * lv;
  return Math.round(lv >= 25 ? base : base * (0.2 + 0.8 * Math.pow((lv - 1) / 24, 1.8)));
};
function fullHeal() {
  const st = stats();
  S.hp = st.maxhp;
  S.mp = st.maxmp;
}
function clampHP() {
  const st = stats();
  S.hp = Math.min(S.hp, st.maxhp);
  S.mp = Math.min(S.mp, st.maxmp);
}
/* 自動喝水：戰鬥結束後生命／魔力低於設定的百分比，就自動喝藥水直到超過門檻（每種最多 3 瓶），回傳要顯示的文字 */
function autoPot() {
  const st = stats(),
    hm = st.healMul * (curSpec() && curSpec().noregen ? 0.5 : 1) * (1 + (st.potPct || 0) / 100),
    out = [];
  let n = 0;
  while (S.autoHp && !st.noPotion && S.potions > 0 && n < 3 && (S.hp / st.maxhp) * 100 < S.autoHp) {
    S.potions--;
    S.hp = Math.min(st.maxhp, S.hp + Math.round(st.maxhp * 0.4 * hm));
    if (st.legGlut) S.mp = Math.min(st.maxmp, S.mp + Math.round(st.maxhp * 0.4 * hm));
    n++;
  }
  if (n) out.push(`生命藥水 ×${n}`);
  n = 0;
  while (S.autoMp && S.ethers > 0 && n < 3 && (S.mp / st.maxmp) * 100 < S.autoMp) {
    S.ethers--;
    S.mp = Math.min(st.maxmp, S.mp + Math.round(st.maxmp * 0.5 * hm));
    n++;
  }
  if (n) out.push(`魔力藥水 ×${n}`);
  return out.length ? `<p class="sub">自動喝水：${out.join('、')}</p>` : '';
}
/* 自然回復：戰鬥外每走 100 公尺回 5%，靜止時每分鐘回 2%（生命與魔力） */
function naturalRegen(pct) {
  if (B || MB || pct <= 0) return;
  const st = stats();
  if (S.hp >= st.maxhp && S.mp >= st.maxmp) return;
  S.hp = Math.min(st.maxhp, S.hp + Math.max(1, Math.round((st.maxhp * pct) / 100)));
  S.mp = Math.min(st.maxmp, S.mp + Math.max(1, Math.round((st.maxmp * pct) / 100)));
  renderHud();
}
function addLog(t) {
  S.log.unshift(t);
  if (S.log.length > 60) S.log.length = 60;
}
function gainXP(n) {
  let up = false;
  S.xp += n;
  /* 等級上限 Lv100 */
  if (S.lv >= LV_MAX) S.xp = Math.min(S.xp, xpNeed(S.lv) - 1);
  while (S.lv < LV_MAX && S.xp >= xpNeed(S.lv)) {
    S.xp -= xpNeed(S.lv);
    S.lv++;
    up = true;
    /* 0.3.11：每升一級送 2 個祈願石 */
    giveCur('wish', 2);
    addLog(`升級了！現在是 Lv${S.lv}，獲得 1 天賦點、2 個祈願石`);
  }
  return up;
}
const LV_MAX = 100;
const treePts = () => S.lv - 1 + (S.bonusPts || 0) - (S.tree.length - 1);
function dayPhase() {
  const d = new Date(now()),
    hr = d.getHours() + d.getMinutes() / 60;
  let night = hr >= 19.5 || hr < 4.5 ? 1 : hr >= 17.5 ? (hr - 17.5) / 2 : hr < 6.5 ? (6.5 - hr) / 2 : 0;
  return { hr, night, label: night >= 1 ? '夜晚' : night > 0 ? (hr > 12 ? '黃昏' : '清晨') : '白天' };
}
const buffOn = () => S.buff && S.buff.until > now();

/* ================= enemies ================= */
/* 0.3.10 T 級（比照 PoE 的地圖階級）：T1～T16 各有一段怪物等級，你所在的 T 決定整張地圖的怪物、地城、事件等級。
   要往上突破得打過城鎮的「突破試煉」；T 越高怪物越強，但稀有怪變多、掉寶數量與稀有度提高、機制王掉得更好 */
const TIERS = [
  [1, 6],
  [7, 12],
  [13, 18],
  [19, 24],
  [25, 30],
  [31, 36],
  [37, 42],
  [43, 48],
  [49, 54],
  [55, 60],
  [61, 67],
  [68, 74],
  [75, 81],
  [82, 88],
  [89, 94],
  [95, 100]
];
const T_MAX = TIERS.length;
/* 依等級對應的 T（舊存檔轉換用） */
const tierOfLv = lv => Math.max(1, TIERS.findIndex(([lo, hi]) => lv <= hi) + 1 || T_MAX);
const tierMax = () => Math.max(1, Math.min(T_MAX, S.tmax || 1));
const tierNow = () => Math.max(1, Math.min(tierMax(), S.tier || tierMax()));
const tierRange = (t = tierNow()) => TIERS[t - 1];
/* 地圖的基準等級：玩家等級夾在目前 T 的範圍內（等級超過上限時怪物停在上限，要突破才會變強） */
function aLv() {
  const [lo, hi] = tierRange();
  return Math.max(lo, Math.min(hi, S.lv));
}
/* 地城等級：不再固定比你高一級，依位置與刷新週期在基準等級 -2～+2 之間（不超出 T 的範圍），難的地城再往上加 */
function dunLv(q, add = 1) {
  const [lo, hi] = tierRange();
  return Math.max(lo, Math.min(hi, aLv() - 2 + (q % 5))) + Math.max(0, add - 1);
}
/* 高 T 的加成（%）：怪物生命與攻擊、稀有怪機率、掉寶數量、掉寶稀有度、機制王（七宗罪、亡靈軍團長與亡靈王、十二生肖…）的掉落 */
function tierBonus(t = tierNow()) {
  const k = t - 1;
  return { mon: k * 6, rare: k * 5, q: k * 5, r: k * 5, boss: k * 6 };
}
const tierBoss = () => 1 + tierBonus().boss / 100;
/* 突破試煉：要先把等級練到目前 T 的上限；試煉的等級是下一個 T 的下限 +1 */
const tierNeed = () => tierRange(tierMax())[1];
function pickMon(r, lv) {
  const pool = MONS.filter(q => !q.min || q.min <= lv + 1);
  let tot = pool.reduce((a, q) => a + q.w, 0),
    x = r % tot;
  for (const q of pool) {
    x -= q.w;
    if (x < 0) return q;
  }
  return pool[0];
}
/* dm：地城詞綴帶來的倍率 {hp,atk,arm} */
function makeEnemy(b, lv, rar = 0, mods = [], dm) {
  const f = lv - 1,
    e = {
      name: b.name,
      bn: b.name,
      lv,
      spr: b.spr,
      pal: b.pal,
      bg: b.bg,
      el: b.el,
      res: [...b.res],
      rar,
      mods,
      maxhp: Math.round(b.hp * (1 + 0.38 * f)),
      atk: Math.round(b.atk * 0.8 * (1 + 0.2 * f)),
      arm: Math.round(b.arm * (1 + 0.25 * f)),
      xp: Math.round(b.xp * (1 + 0.5 * f)),
      gold: Math.round(b.gold * (1 + 0.4 * f)),
      speed: 10
    };
  const hm = [1, 1.5, 2.4, 1, 3][rar] || 1,
    am = [1, 1.15, 1.3, 1, 1.6][rar] || 1,
    rm = [1, 2.5, 5, 1, 12][rar] || 1;
  e.maxhp = Math.round(e.maxhp * hm);
  e.atk = Math.round(e.atk * am);
  e.xp = Math.round(e.xp * rm);
  e.gold = Math.round(e.gold * rm);
  if (rar === 4) {
    e.arm = Math.round(e.arm * 1.5) + 10;
    e.res = e.res.map(v => v + 20);
    e.speed = 14;
  }
  /* 0.3.10：T 越高怪物越強 */
  const tm = 1 + tierBonus().mon / 100;
  e.maxhp = Math.round(e.maxhp * tm);
  e.atk = Math.round(e.atk * tm);
  if (dm) {
    e.maxhp = Math.round(e.maxhp * (dm.hp || 1));
    e.atk = Math.round(e.atk * (dm.atk || 1));
    e.arm = Math.round(e.arm * (dm.arm || 1));
  }
  if (mods.includes('tough')) e.maxhp = Math.round(e.maxhp * 1.6);
  if (mods.includes('armored')) e.arm = e.arm * 2 + 10;
  if (mods.includes('swift')) e.speed = 18;
  mods.forEach(m => uwApply(e, m));
  if (rar === 4) e.name = `災厄・${b.name}`;
  else if (rar === 2) e.name = `${RAREA[h(lv, b.hp, mods.length) % RAREA.length]}之${b.name}`;
  else if (rar === 1) e.name = `${EMODI[mods[0]].n}的${b.name}`;
  if (mods.some(m => EMODI[m] && EMODI[m].uw)) e.name = '冥府・' + e.name;
  e.hp = e.maxhp;
  return e;
}
function rollMods(r, n) {
  const ids = [],
    pool = EMODS.map(m => m.id);
  for (let i = 0; i < n; i++) {
    const k = (r >>> (i * 5)) % pool.length;
    ids.push(pool.splice(k, 1)[0]);
  }
  return ids;
}
const modNames = e => e.mods.map(id => EMODI[id].n).join('・');
/* 冥府詞綴的數值效果（加在已經算好的怪物上） */
function uwApply(e, id) {
  if (id === 'uw_body') e.maxhp = Math.round(e.maxhp * 2.2);
  else if (id === 'uw_flame') {
    e.atk = Math.round(e.atk * 1.4);
    e.el = 'fire';
  } else if (id === 'uw_ward') {
    e.res = e.res.map(v => v + 40);
    e.arm = Math.round(e.arm * 1.5);
  } else if (id === 'uw_rage') {
    e.atk = Math.round(e.atk * 1.2);
    e.speed += 8;
  } else if (id === 'uw_soul') {
    e.maxhp = Math.round(e.maxhp * 1.4);
    if (!e.mods.includes('leech')) e.mods = [...e.mods, 'leech'];
  } else if (id.startsWith('mi_')) return mistApply(e, id);
  else return;
  e.hp = e.maxhp;
}

/* ================= modal ================= */
function showModal(title, html, btns) {
  modalFns = btns.map(b => b.fn);
  $('dlg').innerHTML =
    `<h2>${title}</h2><div style="display:grid;gap:8px">${html}</div><div class="btns">${btns.map((b, i) => (b.hide ? '' : `<button class="btn ${b.pri ? 'pri' : ''}" data-act="mbtn" data-i="${i}" ${b.dis ? 'disabled' : ''}>${b.label}</button>`)).join('')}</div>`;
  $('modal').hidden = false;
}
function hideModal() {
  $('modal').hidden = true;
}
const busy = () => !$('modal').hidden || !!B || !!MB;
function openShop(e, merchant) {
  const he = hepoch(),
    r = rng(h(fl(e.lat * 1e4), fl(e.lng * 1e4), he)),
    lv = aLv() + (merchant ? 2 : 0);
  const stock = Array.from({ length: merchant ? 6 : 10 }, () =>
    makeItem(DROPS[fl(r() * DROPS.length)], lv, merchant ? 2 : r() < 0.3 ? 2 : 1, undefined, r)
  );
  const price = it => sellVal(it) * (merchant ? 3 : 4),
    key = i => `${e.id},${he},${i}`;
  const goods = [
    {
      n: '生命藥水',
      ic: pixURL('ic_potion'),
      p: 20,
      d: '恢復 40% 生命',
      have: () => S.potions,
      buy: () => S.potions++
    },
    { n: '魔力藥水', ic: pixURL('ic_ether'), p: 30, d: '恢復 50% 魔力', have: () => S.ethers, buy: () => S.ethers++ },
    ...(merchant
      ? [
          {
            n: '混沌石',
            ic: curIcon('chaos'),
            p: 120,
            d: CURI.chaos.d + '・流浪商人限定',
            have: () => S.cur.chaos || 0,
            buy: () => giveCur('chaos')
          }
        ]
      : []),
    ...stock.map((it, i) => ({ it, i, ic: slotIcon(it), p: price(it) }))
  ];
  let sel = null;
  const detail = g => {
    if (!g) return '<p class="sub shint">點上面的商品看詳細資訊。</p>';
    if (!g.it)
      return `<div class="card"><div class="ent"><img class="bigico" src="${g.ic}" alt=""><div class="t" style="flex:1;min-width:0"><b>${g.n}</b><div class="sub">${g.d}・持有 ${g.have()}</div></div></div>
      <button class="btn pri" data-act="mbtn" data-i="1" ${S.gold < g.p ? 'disabled' : ''}>購買 ${g.p} 金</button></div>`;
    const it = g.it,
      sold = S.bought[key(g.i)],
      cur = it.slot === 'ring' ? S.eq.ring1 : S.eq[it.slot];
    return `${itemCard(it)}<div class="sub scmp">${cur ? `目前穿戴：${itemName(cur)}<br>${esc(itemSum(cur))}` : `${SLOTN[it.slot]}欄目前是空的`}</div>
      <button class="btn pri" data-act="mbtn" data-i="1" ${sold || S.gold < g.p ? 'disabled' : ''}>${sold ? '已售出' : S.gold < g.p ? `金幣不足（${g.p} 金）` : `購買 ${g.p} 金`}</button>`;
  };
  /* 0.3.1.8：商店分「購買／出售」兩頁；出售頁可以勾選多件一次賣（在城鎮或據點才能賣） */
  const render = () => {
    const g = sel == null ? null : goods[sel],
      tabs = `<div class="seg shoptab"><button data-act="shopTab" data-k="buy" aria-pressed="${SHOP.mode === 'buy'}">購買</button><button data-act="shopTab" data-k="sell" aria-pressed="${SHOP.mode === 'sell'}">出售裝備 <b>${S.inv.length}</b></button></div>`;
    showModal(
      esc(e.name),
      SHOP.mode === 'sell'
        ? tabs + shopSellHTML()
        : `${tabs}<div class="sgrid">${goods
            .map((q, i) => {
              const sold = q.it && S.bought[key(q.i)];
              return `<button class="stile ${i === sel ? 'on' : ''} ${sold ? 'sold' : ''}" data-act="mbtn" data-i="${2 + i}" style="${q.it ? `border-color:${RCOL[q.it.r]}88;` : ''}" aria-label="${esc(q.it ? itemTitle(q.it) : q.n)}">
        <img src="${q.ic}" alt="">${q.it ? '' : `<i>${q.have()}</i>`}<small class="${S.gold < q.p && !sold ? 'poor' : ''}">${sold ? '售出' : q.p + ' 金'}</small></button>`;
            })
            .join('')}</div>
      <div class="sdet">${detail(g)}</div><p class="sub">持有 <span style="color:var(--gold)">${S.gold}</span> 金・商品每 15 分鐘更換</p>`,
      [
        {
          label: '離開',
          fn: () => {
            hideModal();
            SHOP.render = null;
            SEL.sell = null;
            renderHud();
          }
        }
      ]
    );
    modalFns.push(
      () => {
        if (!g || S.gold < g.p) return;
        if (g.it) {
          if (S.bought[key(g.i)]) return;
          S.bought[key(g.i)] = 1;
          giveItem({ ...g.it, id: uid(), aff: g.it.aff.map(a => ({ ...a })) });
          addLog(`購買了 ${itemTitle(g.it)}`);
        } else g.buy();
        S.gold -= g.p;
        sfx('coin');
        render();
      },
      ...goods.map((q, i) => () => {
        sel = sel === i ? null : i;
        sfx('tap');
        render();
      })
    );
  };
  SHOP.mode = 'buy';
  SHOP.render = render;
  sfx('door');
  render();
}
const SHOP = { mode: 'buy', render: null };
