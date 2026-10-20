/* 漫步勇者 · 亡靈軍團（0.2.6）：亡靈區、亡靈怪、精華、亡靈祭壇與軍團長、亡靈王、藏身處的亡靈製作（屍化值） */
'use strict';
/* ================= data ================= */
const pad16u = rows => rows.map(r => (r + '................').slice(0, 16));
Object.assign(SPR, {
  skeleton: pad16u([
    '.....wwwww......',
    '....wwwwwww.....',
    '....wkwwwkw.....',
    '....wwwwwww.....',
    '.....wkwkw......',
    '......www.......',
    '....wwwwwww.....',
    '...w.w.w.w.w....',
    '...w.wwwww.w....',
    '.....w.w.w......',
    '......www.......',
    '.....w...w......',
    '.....w...w......',
    '....ww...ww.....'
  ]),
  zombie: pad16u([
    '.....hhhh.......',
    '....hgggghh.....',
    '....gegggeg.....',
    '....gggggggg....',
    '.....gmmmgg.....',
    '....cccccc......',
    '..gcccccccggg...',
    '..g.cccccc..gg..',
    '....cccccc......',
    '....pppppp......',
    '....pp..pp......',
    '....pp..pp......',
    '...ggg..ggg.....'
  ]),
  lich: pad16u([
    '......y.y.y.....',
    '......yyyyy.....',
    '.....hhhhhhh....',
    '....hhwwwwwhh...',
    '....hwewwewh....',
    '....hhwwwwhh....',
    '...rrhhhhhhrr...',
    '..rrrrrrrrrrrr..',
    '..r.rrrrrrrr.r.o',
    '....rrrrrrrr..oo',
    '....rrrrrrrr...o',
    '...rrrrrrrrrr...',
    '..rrrrrrrrrrrr..'
  ]),
  reaper: pad16u([
    '.....hhhh....bb.',
    '....hhhhhh..b...',
    '...hhkekkhh.b...',
    '...hhkkkkhh.b...',
    '...hhhhhhhh.b...',
    '..hhhhhhhhhhb...',
    '..hhhhhhhhhhbsss',
    '..hhhhhhhhhhb..s',
    '...hhhhhhhh.b...',
    '...hhhhhhhh.b...',
    '..hhhhhhhhhh....',
    '.hhhhhhhhhhhh...',
    '.h.h.h.h.h.h.h..'
  ]),
  bonelord: pad16u([
    '....y.y.y.y.....',
    '....yyyyyyy.....',
    '....wwwwwww.....',
    '...wwkwwwkww....',
    '...wwwwwwwww....',
    '....wkwkwkw.....',
    '..aaaaaaaaaaa...',
    '.aaayaaaaayaaa..',
    '.w.aaaaaaaaa.w..',
    '.w.aaaaaaaaa.w..',
    '...aaaaaaaaa....',
    '....ww...ww.....',
    '....ww...ww.....',
    '...aaa...aaa....'
  ]),
  ualtar: pad16u([
    '.......gg.......',
    '......gwwg......',
    '.......gg.......',
    '....ssssssss....',
    '...swwswwswws...',
    '...ssssssssss...',
    '....sddddds.....',
    '....sdkdkds.....',
    '....sddddds.....',
    '...ssssssssss...',
    '..ssssssssssss..'
  ])
});
Object.assign(PAL, { ualtar: { s: '#4a5a4a', w: '#d8e8d0', g: '#7bd36b', d: '#2a3a2a' } });
Object.assign(KIND, { ualtar: '亡靈祭壇' });
/* 五種亡靈：ess 是掉的精華 */
const UNDEAD = [
  {
    name: '骷髏兵',
    ess: 'bone',
    bg: 'cave',
    spr: 'a_skeleton',
    pal: { w: '#e8e2d0' },
    hp: 40,
    atk: 11,
    arm: 20,
    el: 'phys',
    res: [0, 30, 0],
    xp: 14,
    gold: 10,
    w: 30
  },
  {
    name: '殭屍',
    ess: 'flesh',
    bg: 'cave',
    spr: 'a_jiangshi',
    pal: { g: '#7a9a6a', h: '#3a2a1a', e: '#ffe24a', m: '#3a1a1a', c: '#4a5a7a', p: '#3a3a4a' },
    hp: 60,
    atk: 9,
    arm: 10,
    el: 'phys',
    res: [0, 0, 0],
    xp: 14,
    gold: 10,
    w: 30
  },
  {
    name: '幽魂',
    ess: 'soul',
    bg: 'cave',
    spr: 'spirit',
    pal: { v: '#b8d8e8', e: '#1a2a3a', m: '#5a7a9a' },
    hp: 30,
    atk: 12,
    arm: 0,
    el: 'cold',
    res: [0, 40, 0],
    xp: 15,
    gold: 10,
    w: 20
  },
  {
    name: '屍巫',
    ess: 'curse',
    bg: 'cave',
    spr: 'lich',
    pal: { y: '#ffd166', h: '#2a2a3a', w: '#d8d0c0', e: '#7fff7a', r: '#5a2a6a', o: '#7fff7a' },
    hp: 38,
    atk: 13,
    arm: 6,
    el: 'fire',
    res: [30, 30, 30],
    xp: 18,
    gold: 12,
    w: 15
  },
  {
    name: '死神',
    ess: 'death',
    bg: 'cave',
    spr: 'reaper',
    pal: { h: '#1a1622', k: '#000000', e: '#ff3a3a', b: '#7a5a3a', s: '#d8dde6' },
    hp: 55,
    atk: 18,
    arm: 12,
    el: 'phys',
    res: [20, 20, 20],
    xp: 30,
    gold: 20,
    w: 5
  }
];
const UNDEADN = Object.fromEntries(UNDEAD.map(u => [u.name, u]));
/* 精華：每種對應一組裝備詞綴 */
const ESS = [
  {
    id: 'bone',
    n: '骨之精華',
    from: '骷髏兵',
    c: '#e8e2d0',
    aff: ['physPct', 'flatPhys', 'critPct', 'critMulti'],
    d: '物理、暴擊'
  },
  { id: 'flesh', n: '腐肉精華', from: '殭屍', c: '#8ab070', aff: ['life', 'armor', 'regen'], d: '生命、護甲、回復' },
  {
    id: 'soul',
    n: '魂之精華',
    from: '幽魂',
    c: '#9fd4ef',
    aff: ['spellPct', 'addFire', 'addCold', 'addLight', 'mana'],
    d: '法術、元素、魔力'
  },
  { id: 'curse', n: '咒之精華', from: '屍巫', c: '#b88ad8', aff: ['resFire', 'resCold', 'resLight'], d: '抗性' },
  {
    id: 'death',
    n: '死之精華',
    from: '死神',
    c: '#e5484d',
    aff: ['speed', 'leech', 'vision', 'lure'],
    d: '速度、吸血、視野'
  }
];
const ESSI = Object.fromEntries(ESS.map(e => [e.id, e]));
const ESS_MAX = 30;
const affCat = id => (ESS.find(e => e.aff.includes(id)) || {}).id;
/* 屍骨通貨與亡靈王相關 */
const UCUR = [
  { id: 'boneRm', n: '招魂骨', d: '移除指定的那一條詞綴', c: '#d8d0c0' },
  { id: 'boneSw', n: '換魂骨', d: '把指定那一條換成同類別的另一條', c: '#a8c8d8' },
  { id: 'kHeart', n: '屍王之心', d: '把指定那一條升一階，數值重骰', c: '#7bd36b' },
  { id: 'kBone', n: '亡靈王的骸骨', d: '集滿 5 個，在亡靈祭壇召喚亡靈王', c: '#c8b890' }
];
const UCURI = Object.fromEntries(UCUR.map(c => [c.id, c]));
const KING_NEED = 5;
/* 圖示：精華是一滴，屍骨通貨是骨頭，屍王之心是心臟 */
(() => {
  const drop = ['...cc...', '..cwcc..', '..cccc..', '.cwcccc.', '.cccccc.', 'cccccccd', '.ccccdd.', '..cddd..'];
  ESS.forEach(e => (PIX['cur_ess_' + e.id] = { r: drop, p: { c: e.c, w: '#ffffff', d: shade(e.c, -0.4) } }));
  const bone = ['ww....ww', 'wwwwwwww', '.ww..ww.', '..wwww..', '..wwww..', '.ww..ww.', 'wwwwwwww', 'ww....ww'];
  PIX.cur_boneRm = { r: bone, p: { w: '#e8e2d0' } };
  PIX.cur_boneSw = { r: bone, p: { w: '#a8d0e8' } };
  PIX.cur_kBone = { r: bone, p: { w: '#c8b890' } };
  PIX.cur_kHeart = {
    r: ['.gg.gg..', 'gggggggg', 'ggwggggg', 'gggggggg', '.gggggg.', '..gggg..', '...gg...', '........'],
    p: { g: '#5ac85a', w: '#d8ffd0' }
  };
})();

/* ================= zones ================= */
const UD_CELL = 1500,
  UD_MS = 3 * 3600e3,
  UD_ALTARS = 3;
const udEp = () => fl(now() / UD_MS);
let UDZ = [];
/* 亡靈區：每 3 小時重骰，約 28% 的 1.5 公里方格會被佔領（玩家 Lv3 起） */
function undeadSpawns(out, cells) {
  UDZ = [];
  if (S.lv < 3) return;
  const ue = udEp();
  cells(UD_CELL, 2200, (i, j) => {
    const r = h(i, j, ue * 19 + 811);
    if (r % 100 >= 28) return;
    const x = (i + 0.25 + ((r >>> 8) % 50) / 100) * UD_CELL,
      y = (j + 0.25 + ((r >>> 16) % 50) / 100) * UD_CELL,
      rad = (450 + ((r >>> 4) % 3) * 100) * (dayPhase().night > 0.5 ? 1.25 : 1),
      id = `ud${i}_${j}_${ue}`;
    UDZ.push({ id, x, y, r: rad });
    for (let k = 0; k < UD_ALTARS; k++) {
      const a = ((r >>> (k * 3)) % 360) * 0.0175 + (k * Math.PI * 2) / UD_ALTARS,
        p = snapRoad(x + Math.cos(a) * rad * 0.5, y + Math.sin(a) * rad * 0.5, 160);
      if (!p) continue;
      const aid = `ua${i}_${j}_${ue}_${k}`,
        [la, ln] = toLL(p[0], p[1]);
      out.set(aid, {
        id: aid,
        kind: 'ualtar',
        x: p[0],
        y: p[1],
        lat: la,
        lng: ln,
        name: '亡靈祭壇',
        zid: id,
        lv: aLv() + 2,
        gl: '120,220,140'
      });
    }
  });
  /* 範圍內的怪物全部換成亡靈 */
  for (const e of out.values()) {
    if (e.kind !== 'monster' || e.ev) continue;
    const z = UDZ.find(z => Math.hypot(z.x - e.x, z.y - e.y) <= z.r);
    if (!z) continue;
    const q = h(fl(e.x), fl(e.y), 61) % 100;
    let acc = 0,
      b = UNDEAD[0];
    for (const u of UNDEAD)
      if (q < (acc += u.w)) {
        b = u;
        break;
      }
    e.base = b;
    e.ud = z.id;
    e.name = e.rar ? makeEnemy(b, e.lv, e.rar, e.mods).name : b.name;
  }
}
const udProg = id => (S.und && S.und[id]) || 0;
const udZoneAt = (x, y) => UDZ.find(z => Math.hypot(z.x - x, z.y - y) <= z.r);
/* 亡靈區：綠色地塊、發光邊緣、中間大大的骷髏標誌 */
function drawUndead(c, t) {
  for (const z of UDZ) {
    const x = SX(z.x),
      y = SY(z.y),
      r = Math.abs(SX(z.x + z.r) - x);
    if (x < -r || x > VW + r || y < -r || y > VH + r) continue;
    const pu = 0.5 + 0.5 * Math.sin(t / 600);
    c.save();
    const g = c.createRadialGradient(x, y, r * 0.15, x, y, r);
    g.addColorStop(0, 'rgba(40,160,70,.16)');
    g.addColorStop(0.75, 'rgba(50,200,90,.24)');
    g.addColorStop(1, `rgba(80,255,120,${0.34 + 0.08 * pu})`);
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r, 0, 6.28);
    c.fill();
    c.shadowColor = '#4dff7a';
    c.shadowBlur = 14 + 8 * pu;
    c.strokeStyle = `rgba(110,255,150,${0.75 + 0.2 * pu})`;
    c.lineWidth = 3;
    c.stroke();
    c.shadowBlur = 0;
    c.strokeStyle = 'rgba(190,255,200,.5)';
    c.lineWidth = 1.2;
    c.setLineDash([6, 10]);
    c.lineDashOffset = -t / 60;
    c.beginPath();
    c.arc(x, y, r * 0.94, 0, 6.28);
    c.stroke();
    c.restore();
  }
}
/* 亡靈區標誌：骷髏＋字，畫在怪物上層，地圖縮小時也看得到 */
function drawUndeadMark(c, t) {
  for (const z of UDZ) {
    const x = SX(z.x),
      y = SY(z.y),
      r = Math.abs(SX(z.x + z.r) - x);
    if (x < -r || x > VW + r || y < -r || y > VH + r) continue;
    const sz = Math.max(22, Math.min(60, r * 0.25)),
      pu = 0.5 + 0.5 * Math.sin(t / 600);
    c.globalAlpha = 0.9;
    glow(c, x, y - sz * 0.45, sz * 1.5, '80,255,120', 0.4 + 0.2 * pu);
    drawSpr(c, 'skeleton', UNDEAD[0].pal, x, y, sz / 9);
    c.globalAlpha = 1;
    label(c, `亡靈區 ${udProg(z.id)}%`, x, y + 12, Math.max(12, Math.min(16, sz * 0.35)), '#8fffa8', true);
  }
}

/* ================= battle ================= */
/* 打倒亡靈：精華、進度 */
function undeadWin(b) {
  const e = b.e,
    u = UNDEADN[b.udBase],
    r = e.rar || 0;
  if (!u) return '';
  S.und = S.und || {};
  for (const k in S.und) if (!k.endsWith('_' + udEp())) delete S.und[k];
  /* 霧中亡靈：精華 +1、進度 ×1.5 */
  const n = ([1, 2, 3, 3, 5][r] || 1) + (b.mist ? 1 : 0),
    got = giveEss(u.ess, n);
  S.und[b.ud] = Math.min(100, udProg(b.ud) + Math.round([5, 8, 14, 14, 20][r] * (b.mist ? 1.5 : 1)));
  let extra = '';
  if (r >= 2 && Math.random() < 0.1) {
    const c = Math.random() < 0.5 ? 'boneRm' : 'boneSw';
    giveCur(c);
    extra = `、${UCURI[c].n}`;
  }
  return `<p style="color:#8fe0a0">${curDot('ess_' + u.ess)}${ESSI[u.ess].n} ×${got}${extra}・亡靈區進度 ${udProg(b.ud)}%${udProg(b.ud) >= 100 ? '：可以去亡靈祭壇挑戰軍團長了！' : ''}</p>`;
}
function giveEss(id, n) {
  S.ess = S.ess || {};
  const before = S.ess[id] || 0;
  S.ess[id] = Math.min(ESS_MAX, before + n);
  return S.ess[id] - before;
}
function udBoss(name, spr, pal, lv, mult) {
  const b = { name, bg: 'cave', spr, pal, hp: 90, atk: 16, arm: 35, el: 'phys', res: [30, 30, 30], xp: 50, gold: 50 },
    e = makeEnemy(b, lv, 4, ['tough', 'leech', 'armored']);
  e.maxhp = Math.round(e.maxhp * mult);
  e.hp = e.maxhp;
  e.name = name;
  return e;
}
function commanderWin(aid) {
  const a = ENT.get(aid),
    zid = a ? a.zid : aid.replace(/^ua/, 'ud').replace(/_\d+$/, '');
  S.cleared[aid] = udEp();
  S.und[zid] = 0;
  const got = [];
  ESS.forEach(e => {
    const n = giveEss(e.id, Math.round((2 + fl(Math.random() * 3)) * tierBoss()));
    if (n) got.push(`${e.n} ×${n}`);
  });
  giveCur('kBone');
  got.push('亡靈王的骸骨');
  for (const c of ['boneRm', 'boneSw'])
    if (Math.random() < 0.4 * tierBoss()) {
      giveCur(c);
      got.push(UCURI[c].n);
    }
  return `<p style="color:#8fe0a0">擊敗亡靈軍團長！得到 ${got.join('、')}（骸骨 ${S.cur.kBone || 0}/${KING_NEED}）。這個亡靈區的進度歸 0。</p>`;
}
function kingWin() {
  const got = [];
  ESS.forEach(e => {
    const n = giveEss(e.id, Math.round((5 + fl(Math.random() * 4)) * tierBoss()));
    if (n) got.push(`${e.n} ×${n}`);
  });
  giveCur('kHeart');
  giveCur('boneRm');
  giveCur('boneSw');
  got.push('屍王之心', '招魂骨', '換魂骨');
  return `<p style="color:#8fe0a0">亡靈王倒下了！得到 ${got.join('、')}</p>`;
}

/* ================= undead crafting（0.3.23 起在藏身處） ================= */
/* 0.3.23：在藏身處做（隨時都能用） */
const atBase = () => true;
const ucCost = (it, n) => Math.ceil(n * (1 + 0.5 * (it.uc || 0)));
function ucBlock(it) {
  if (!it) return '沒有裝備';
  if (it.r !== 1 && it.r !== 2) return '只能用在魔法或稀有裝備';
  if ((it.sh || 0) >= 100) return '屍化值已滿，這件裝備不能再調整';
  return '';
}
const maxPS = it => (it.r === 1 ? 1 : 3);
/* 在指定類別裡加一條詞綴（前綴、後綴都要有空位） */
function rollCat(it, cat, not) {
  const ids = ESSI[cat].aff.filter(id => id !== not),
    types = ['P', 'S'].filter(
      t =>
        cnt(it, t) < maxPS(it) &&
        ids.some(id => AFFI[id].t === t && affFits(AFFI[id], it) && !it.aff.some(a => a.id === id))
    );
  if (!types.length) return false;
  return rollAffix(it, types[fl(Math.random() * types.length)], Math.random, ids);
}
const hasEss = (id, n) => (S.ess && S.ess[id]) >= n;
const payEss = list => list.forEach(([id, n]) => (S.ess[id] -= n));
const UC_SH = { reroll: 15, conv: 25, add: 35, boneRm: 30, boneSw: 20, kHeart: 40 };
function ucDone(it, op) {
  it.sh = Math.min(100, (it.sh || 0) + UC_SH[op]);
  it.uc = (it.uc || 0) + 1;
}
function ucReroll(it, cat) {
  const list = it.aff.filter(a => affCat(a.id) === cat),
    n = ucCost(it, 8);
  if (ucBlock(it) || !list.length || !hasEss(cat, n)) return false;
  payEss([[cat, n]]);
  list.forEach(a => {
    const [, lo, hi] = AFFI[a.id].tiers[a.tier - 1];
    a.v = lo + fl(Math.random() * (hi - lo + 1));
  });
  ucDone(it, 'reroll');
  return true;
}
function ucConv(it, from, to) {
  const list = it.aff.filter(a => affCat(a.id) === from),
    n = ucCost(it, 5);
  if (ucBlock(it) || !list.length || from === to || !hasEss(from, n) || !hasEss(to, n)) return false;
  const i = it.aff.indexOf(list[fl(Math.random() * list.length)]),
    gone = it.aff.splice(i, 1)[0];
  if (!rollCat(it, to)) {
    it.aff.splice(i, 0, gone);
    return false;
  }
  payEss([
    [from, n],
    [to, n]
  ]);
  ucDone(it, 'conv');
  return true;
}
function ucAdd(it, cat) {
  const n = ucCost(it, 10);
  if (ucBlock(it) || !hasEss(cat, n) || !hasEss('death', cat === 'death' ? n + 1 : 1)) return false;
  if (!rollCat(it, cat)) return false;
  payEss([
    [cat, n],
    ['death', 1]
  ]);
  ucDone(it, 'add');
  return true;
}
function ucAff(it, i, op) {
  const a = it.aff[i];
  if (ucBlock(it) || !a || !(S.cur[op] > 0)) return false;
  if (op === 'boneRm') it.aff.splice(i, 1);
  else if (op === 'boneSw') {
    const cat = affCat(a.id);
    it.aff.splice(i, 1);
    if (!rollCat(it, cat, a.id)) {
      it.aff.splice(i, 0, a);
      return false;
    }
  } else if (op === 'kHeart') {
    if (a.tier <= 1) return false;
    a.tier--;
    const [, lo, hi] = AFFI[a.id].tiers[a.tier - 1];
    a.v = lo + fl(Math.random() * (hi - lo + 1));
  }
  S.cur[op]--;
  ucDone(it, op);
  return true;
}
/* 裝備詳情頁的「亡靈製作」區塊 */
function undeadCraftHTML(it) {
  const blk = ucBlock(it),
    cats = [...new Set(it.aff.map(a => affCat(a.id)).filter(Boolean))],
    sel = SEL.ucCat || 'flesh',
    from = cats.includes(SEL.ucFrom) ? SEL.ucFrom : cats[0],
    n5 = ucCost(it, 5),
    n8 = ucCost(it, 8),
    n10 = ucCost(it, 10),
    dis = b => (blk || !b ? 'disabled' : '');
  const chips = (act, list, cur) =>
    list
      .map(
        id =>
          `<button class="btn sm${id === cur ? ' pri' : ''}" data-act="${act}" data-k="${id}">${curDot('ess_' + id)}${ESSI[id].n.slice(0, 1)} <b>${(S.ess && S.ess[id]) || 0}</b></button>`
      )
      .join('');
  return `<h3>亡靈製作 <small class="sub">・屍化 ${it.sh || 0}/100・已製作 ${it.uc || 0} 次（花費 ×${1 + 0.5 * (it.uc || 0)}）</small></h3>
  ${blk ? `<p class="sub" style="color:#ffb27a">${blk}</p>` : ''}
  <div class="card" style="display:grid;gap:6px"><small class="sub">選擇類別：${ESSI[sel].d}</small><div class="btns" style="flex-wrap:wrap">${chips(
    'ucCat',
    ESS.map(e => e.id),
    sel
  )}</div>
  <div class="btns" style="flex-wrap:wrap"><button class="btn sm" data-act="ucDo" data-op="reroll" ${dis(cats.includes(sel) && hasEss(sel, n8))}>強化（${n8}）<small>重骰這類數值・屍化 +15</small></button><button class="btn sm" data-act="ucDo" data-op="add" ${dis(hasEss(sel, n10) && hasEss('death', 1))}>定向加入（${n10}＋死 1）<small>加一條這類詞綴・屍化 +35</small></button></div>
  ${cats.length ? `<small class="sub">轉換：移除一條</small><div class="btns" style="flex-wrap:wrap">${chips('ucFrom', cats, from)}</div><button class="btn sm" data-act="ucDo" data-op="conv" ${dis(from && from !== sel && hasEss(from, n5) && hasEss(sel, n5))}>轉換：移除一條${ESSI[from].n.slice(0, 1)}類 → 加一條${ESSI[sel].n.slice(0, 1)}類（各 ${n5}）・屍化 +25</button>` : ''}</div>
  ${
    it.aff.length
      ? `<div class="card" style="display:grid;gap:4px"><small class="sub">屍骨通貨（指定詞綴）：招魂骨 ${S.cur.boneRm || 0}・換魂骨 ${S.cur.boneSw || 0}・屍王之心 ${S.cur.kHeart || 0}</small>${it.aff
          .map(
            (a, i) =>
              `<div class="rowx"><small>${esc(AFFI[a.id].f(a.v))} <span class="sub">T${a.tier}</span></small><span class="btns" style="flex-wrap:nowrap"><button class="btn sm" data-act="ucAffDo" data-op="boneRm" data-i="${i}" ${dis(S.cur.boneRm > 0)}>招魂</button><button class="btn sm" data-act="ucAffDo" data-op="boneSw" data-i="${i}" ${dis(S.cur.boneSw > 0)}>換魂</button><button class="btn sm" data-act="ucAffDo" data-op="kHeart" data-i="${i}" ${dis(S.cur.kHeart > 0 && a.tier > 1)}>升階</button></span></div>`
          )
          .join('')}</div>`
      : ''
  }`;
}
/* 背包「亡靈」分頁 */
function essHTML() {
  return `<p class="sub">在亡靈區打亡靈取得，每種最多 ${ESS_MAX} 個。在藏身處（或任何地方）打開裝備詳情頁的「亡靈製作」使用。每次製作都會累積屍化值，滿 100 後裝備鎖定。</p>
  <div class="curs">${ESS.map(e => `<span title="${e.d}"><img class="cico lg" src="${curIcon('ess_' + e.id)}" alt=""><span>${e.n}<b>${(S.ess && S.ess[e.id]) || 0}</b></span></span>`).join('')}${UCUR.map(c => `<span title="${c.d}"><img class="cico lg" src="${curIcon(c.id)}" alt=""><span>${c.n}<b>${S.cur[c.id] || 0}</b></span></span>`).join('')}</div>
  ${ESS.map(e => `<div class="card"><div class="rowx"><div class="t"><b>${e.n}</b><small>打${e.from}取得・對應：${e.d}</small></div></div></div>`).join('')}
  <div class="card"><div class="rowx"><div class="t"><b>亡靈王的骸骨 ${S.cur.kBone || 0}/${KING_NEED}</b><small>擊敗亡靈軍團長取得，集滿在亡靈祭壇召喚亡靈王</small></div></div></div>`;
}
MAT_TABS.push(['ess', '亡靈', () => ESS.reduce((a, e) => a + ((S.ess && S.ess[e.id]) || 0), 0)]);

/* ================= actions ================= */
Object.assign(A, {
  ucCat: d => {
    SEL.ucCat = d.k;
    renderSheet();
  },
  ucFrom: d => {
    SEL.ucFrom = d.k;
    renderSheet();
  },
  ucDo: d => {
    const it = selItem && (selItem.eq ? S.eq[selItem.eq] : S.inv[selItem.i]),
      cat = SEL.ucCat || 'flesh',
      from = SEL.ucFrom || [...new Set(it.aff.map(a => affCat(a.id)))][0];
    const ok = d.op === 'reroll' ? ucReroll(it, cat) : d.op === 'add' ? ucAdd(it, cat) : ucConv(it, from, cat);
    toast(ok ? '亡靈製作完成' : '沒有可以加的詞綴或材料不足');
    if (ok) {
      sfx('bless');
      addLog(`亡靈製作：${itemTitle(it)}（屍化 ${it.sh}/100）`);
      clampHP();
      renderHud();
      save();
    } else sfx('nope');
    renderSheet();
  },
  ucAffDo: d => {
    const it = selItem && (selItem.eq ? S.eq[selItem.eq] : S.inv[selItem.i]),
      ok = ucAff(it, +d.i, d.op);
    toast(ok ? `使用${UCURI[d.op].n}` : '沒有可以換的詞綴');
    if (ok) {
      sfx('bless');
      addLog(`使用${UCURI[d.op].n}：${itemTitle(it)}（屍化 ${it.sh}/100）`);
      clampHP();
      renderHud();
      save();
    } else sfx('nope');
    renderSheet();
  },
  udBoss: d => {
    const a = ENT.get(d.id);
    if (!inRange(a) || isDone(a) || udProg(a.zid) < 100) return;
    closeSheet();
    /* 軍團長外觀依祭壇固定（0.3.26 起 7 種） */
    const looks = [
        'a_bonelord',
        'a_death_witch',
        'a_bone_knight',
        'a_ghost_priest',
        'a_wraith_general',
        'a_bone_colossus',
        'a_blood_count'
      ],
      look = looks[[...String(a.zid)].reduce((s, c) => s + c.charCodeAt(0), 0) % looks.length];
    startBattle(udBoss('亡靈軍團長', look, { y: '#ffd166', w: '#e8e2d0', a: '#3a4a3a' }, a.lv, 3), {
      bg: 'cave',
      boss: true,
      commander: a.id,
      onsite: siteBonus(a)
    });
  },
  udKing: d => {
    const a = ENT.get(d.id);
    if (!inRange(a) || !(S.cur.kBone >= KING_NEED)) return;
    S.cur.kBone -= KING_NEED;
    closeSheet();
    startBattle(udBoss('亡靈王', 'a_lichking', BOSSPAL.b_lichking, a.lv + 3, 5), {
      bg: 'cave',
      boss: true,
      king: true,
      onsite: siteBonus(a)
    });
    save();
  }
});
