/* 漫步勇者 · 玩家狀態、裝備、詞綴、通貨製作、屬性計算 */
'use strict';
/* ================= player & items ================= */
function newGame() {
  const g = {
    v: 12,
    cls: 'novice',
    lv: 1,
    xp: 0,
    gold: 80,
    crystal: 0,
    hp: 60,
    mp: 20,
    potions: 3,
    ethers: 1,
    inv: [],
    eq: {},
    cur: { trans: 4, aug: 4, regal: 2, alch: 1, chaos: 1, exalt: 0, soul: 0, dust: 0, eng: 1 },
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
    mist: null,
    hunt: { on: false, blood: 0, acc: 0, marks: {} },
    summons: [],
    sins: {},
    jewels: [],
    jsock: {},
    sk: [null, null, null, null],
    autoHp: 0,
    autoMp: 0,
    regenAt: 0,
    tree: ['start_novice'],
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
  if (rar === 1) toMagic(it, r);
  else if (rar === 2) toRare(it, r);
  return it;
}
const baseOf = it => BASES[it.slot][it.bi];
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
  if (it.phys) out.push(`物理 ${it.phys[0]}–${it.phys[1]}`);
  if (it.arm) out.push(`護甲 ${it.arm}`);
  if (!it.aff.length && it.imp) out.push(STATN[it.imp[0]](it.imp[1]));
  it.aff.slice(0, 2).forEach(a => out.push(AFFI[a.id].f(a.v)));
  return out.join('・') + (it.aff.length > 2 ? `・另 ${it.aff.length - 2} 條` : '');
}
function itemCard(it, title) {
  const b = baseOf(it);
  let h = `<div class="icard" style="border-color:${RCOL[it.r]}88"><div class="ihead" style="color:${RCOL[it.r]}">${esc(itemTitle(it))}</div><div class="isub">${it.r === 2 ? esc(b.n) + '・' : ''}${RNAME[it.r]}${SLOTN[it.slot]}・物品等級 ${it.ilvl}${title ? '・' + title : ''}</div>`;
  const base = [];
  if (it.phys) base.push(`物理傷害 ${it.phys[0]}–${it.phys[1]}`, `暴擊率 ${it.crit}%`);
  if (it.arm) base.push(`護甲 ${it.arm}`);
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
    exalt: it.r === 2 && it.aff.length < 6
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
  return true;
}

/* ================= skill gems ================= */
const newGem = k => ({ id: uid(), k, lv: 1, dust: 0, en: [] });
const gemSlots = g => Math.min(6, fl(g.lv / 5)) + (g.xs || 0);
const gemOpen = g => gemSlots(g) - g.en.length;
const gemOf = id => S.gems.find(g => g.id === id);
const GEMK = () => Object.keys(SKILLS).filter(k => k !== 'attack');
/* 技能石換算成戰鬥用的技能：攻擊每級 +6% 倍率，法術的基礎傷害隨等級提高，治癒每級 +6%，消耗每級 +3% */
function gemSkill(g) {
  const b = SKILLS[g.k],
    L = g.lv - 1,
    t = {};
  g.en.forEach(a => (t[a.id] = (t[a.id] || 0) + a.v));
  const sk = {
    ...b,
    gid: g.id,
    lv: g.lv,
    nEn: g.en.length,
    mp: Math.round(b.mp * (1 + 0.03 * L) * (1 - (t.cost || 0) / 100))
  };
  if (b.kind === 'attack') sk.mult = b.mult * (1 + 0.06 * L) * (1 + (t.dmg || 0) / 100);
  if (b.kind === 'spell') {
    sk.mult = b.mult * (1 + (t.dmg || 0) / 100);
    sk.sb = 9 + 4 * L;
  }
  if (b.kind === 'heal') sk.heal = (b.heal || 0.35) * (1 + 0.06 * L) * (1 + (t.heal || 0) / 100);
  ['crit', 'ail', 'brk', 'leech', 'dbl'].forEach(k => (sk[k] = t[k] || 0));
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
/* 升級：要粉塵，而且技能石等級不能超過角色等級 */
function gemLvBlock(g) {
  if (g.cor) return '已腐化';
  if (g.lv >= GEM_MAX) return '已滿級';
  if (g.lv + 1 > S.lv) return `需要角色 Lv${g.lv + 1}`;
  if ((S.cur.dust || 0) < dustNeed(g.lv)) return '粉塵不足';
  return '';
}
const gemDustBack = g => ({ 3: 20, 4: 60, 5: 200 })[SKILLS[g.k].r || 3] + Math.round(g.dust * 0.7);
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
  'legLust'
];
function sumStats() {
  const t = {};
  STAT0.forEach(k => (t[k] = 0));
  const A = (k, v) => (t[k] = (t[k] || 0) + v);
  for (const s of SLOTS) {
    const it = S.eq[s];
    if (!it) continue;
    if (it.arm) t.armor += it.arm;
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
    ph = w ? w.phys : [1, 3];
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
    legLust: t.legLust
  };
}
/* 升級曲線：Lv1→2 約 6 隻怪，Lv5 約 25 隻，Lv10 約 60 隻（同等級怪） */
const xpNeed = lv => Math.round(40 * Math.pow(lv, 2.1) + 20 * lv);
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
    hm = st.healMul * (curSpec() && curSpec().noregen ? 0.5 : 1),
    out = [];
  let n = 0;
  while (S.autoHp && S.potions > 0 && n < 3 && (S.hp / st.maxhp) * 100 < S.autoHp) {
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
    addLog(`升級了！現在是 Lv${S.lv}，獲得 1 天賦點`);
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
    `<h2>${title}</h2><div style="display:grid;gap:8px">${html}</div><div class="btns">${btns.map((b, i) => `<button class="btn ${b.pri ? 'pri' : ''}" data-act="mbtn" data-i="${i}" ${b.dis ? 'disabled' : ''}>${b.label}</button>`).join('')}</div>`;
  $('modal').hidden = false;
}
function hideModal() {
  $('modal').hidden = true;
}
const busy = () => !$('modal').hidden || !!B || !!MB;
function openShop(e, merchant) {
  const he = hepoch(),
    r = rng(h(fl(e.lat * 1e4), fl(e.lng * 1e4), he)),
    lv = S.lv + (merchant ? 2 : 0);
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
  const render = () => {
    const g = sel == null ? null : goods[sel];
    showModal(
      esc(e.name),
      `<div class="sgrid">${goods
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
  sfx('door');
  render();
}
