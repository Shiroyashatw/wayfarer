/* 漫步勇者 · 0.2 終局內容：石碑與魔法陣、據點半徑與冒險營旗、靈脈、區域特性、冥府侵蝕、絲綢之路 */
'use strict';
/* ================= map objects ================= */
const pad16 = rows => rows.map(r => (r + '................').slice(0, 16));
Object.assign(SPR, {
  stele: pad16([
    '.....kkkkkk.....',
    '....kllllllk....',
    '...kllssssllk...',
    '...klsrrrrslk...',
    '...klssrrsslk...',
    '...klsrrrrslk...',
    '...klsssssslk...',
    '...klsrssrslk...',
    '...klssrrsslk...',
    '...klsssssslk...',
    '...klsssssslk...',
    '..kggggggggggk..',
    '..kkkkkkkkkkkk..'
  ]),
  circle: pad16([
    '.....pppppp.....',
    '...ppwwwwwwpp...',
    '..pw..y..y..wp..',
    '.pw...yyyy...wp.',
    '.pw..yy..yy..wp.',
    '.pw...yyyy...wp.',
    '..pw..y..y..wp..',
    '...ppwwwwwwpp...',
    '.....pppppp.....'
  ]),
  vein: pad16([
    '.......w........',
    '......wc....w...',
    '......cc...wc...',
    '..w..ccd...cc...',
    '..cc.ccd..ccd...',
    '.ccd.cdd..cdd...',
    '.cdd.cdd.ccdd...',
    'gggggggggggggg..'
  ]),
  obelisk: pad16([
    '.......kk.......',
    '......kmmk......',
    '......kmrk......',
    '.....kmmmmk.....',
    '.....kmrrmk.....',
    '.....kmmmmk.....',
    '.....kmrrmk.....',
    '.....kmmmmk.....',
    '.....kmrrmk.....',
    '.....kmmmmk.....',
    '....kmmmmmmk....',
    '...kooooooook...',
    '...kkkkkkkkkk...'
  ])
});
Object.assign(PAL, {
  stele: { s: '#8a8796', l: '#b9b6c4', r: '#7fd6ff', g: '#5a5466' },
  circle: { p: '#9a6bff', w: '#e8dcff', y: '#ffd166' },
  vein: { c: '#6fdcff', w: '#ffffff', d: '#2a8ab0', g: '#5a5466' },
  obelisk: { o: '#2a1a2e', m: '#5a2a4a', r: '#ff3a5a' },
  flag: PAL.camp
});
Object.assign(KIND, {
  stele: '空白石碑',
  circle: '石碑魔法陣',
  vein: '靈脈',
  obelisk: '冥府侵蝕柱',
  flag: '冒險營旗'
});
const ep2 = () => fl(now() / ZONE_MS);

/* ================= zones: base radius, flags, silk-road view ================= */
const BASE_R = [50, 100, 150, 225, 300];
const baseR = lv => BASE_R[Math.max(0, Math.min(4, lv - 1))];
const mainBase = () => S.bases.find(b => b.type === 'main');
const flagR = () => {
  const m = mainBase();
  return m && m.lv > 1 ? baseR(m.lv - 1) : 30;
};
const flagMs = () => 3600e3 + 600e3 * ((mainBase() ? mainBase().lv : 1) - 1);
const FLAG_MAX = 2,
  FLAG_COST = 100;
const flagsOn = () => (S.flags || []).filter(f => f.until > now());
/* 可以遠端互動的範圍：主據點、冒險營旗、絲綢之路正在看的好友據點 */
function zones() {
  const out = [],
    add = (lat, lng, r, kind, name) => {
      const [x, y] = toM(lat, lng);
      out.push({ x, y, r, lat, lng, kind, name });
    };
  const m = mainBase();
  if (m) add(m.lat, m.lng, baseR(m.lv), 'base', '主據點');
  flagsOn().forEach((f, i) => add(f.lat, f.lng, flagR(), 'flag', `冒險營旗 ${i + 1}`));
  if (SILK.view) add(SILK.view.base_lat, SILK.view.base_lng, baseR(SILK.view.base_lv || 1), 'silk', SILK.view.name);
  return out;
}
const zonesKey = () =>
  zones()
    .map(z => `${fl(z.x)},${fl(z.y)},${z.r}`)
    .join(';');
const zoneOf = e => zones().find(z => Math.hypot(e.x - z.x, e.y - z.y) <= z.r);
const inZone = e => !!e && e.kind !== 'town' && e.x != null && !!zoneOf(e);
function drawZones(c) {
  for (const z of zones()) {
    const x = SX(z.x),
      y = SY(z.y),
      r = Math.abs(SX(z.x + z.r) - x);
    if (x < -r || x > VW + r || y < -r || y > VH + r) continue;
    c.save();
    c.strokeStyle =
      z.kind === 'silk' ? 'rgba(255,200,120,.7)' : z.kind === 'flag' ? 'rgba(140,220,140,.6)' : 'rgba(255,210,120,.55)';
    c.fillStyle = z.kind === 'silk' ? 'rgba(255,200,120,.06)' : 'rgba(255,230,160,.05)';
    c.lineWidth = 1.5;
    c.setLineDash([6, 5]);
    c.beginPath();
    c.arc(x, y, r, 0, 6.28);
    c.fill();
    c.stroke();
    c.restore();
  }
}

/* ================= zone modifiers ================= */
function zoneXY(x, y) {
  const i = fl(x / ZONE_CELL),
    j = fl(y / ZONE_CELL),
    m = ZMODS[h(i, j, ep2() * 3 + 701) % ZMODS.length];
  return { i, j, m };
}
const zoneAt = (lat, lng) => zoneXY(...toM(lat, lng));

/* ================= spawns ================= */
const STCELL = 380,
  VCELL = 520,
  OBCELL = 2400,
  OB_R = 150,
  OB_NEED = 8;
function endgameSpawns(out, cells, put, hp) {
  /* 空白石碑：每小時刷新，約 1/5 是石碑魔法陣 */
  cells(STCELL, 1000, (i, j) => {
    const r = h(i, j, hp * 13 + 907);
    if (r % 100 >= 32) return;
    const circ = (r >>> 9) % 5 === 0,
      id = `${circ ? 'o' : 's'}${i}_${j}_${hp}`;
    let x = (i + ((r >>> 12) % 100) / 100) * STCELL,
      y = (j + ((r >>> 18) % 100) / 100) * STCELL;
    if (nearTown(x, y, 140)) return;
    const p = snapRoad(x, y, 120);
    if (!p) return;
    [x, y] = [p[0] + 10, p[1] + 6];
    put(
      id,
      circ
        ? { kind: 'circle', x, y, name: '石碑魔法陣', gl: '170,120,255' }
        : { kind: 'stele', x, y, name: '空白石碑', gl: '127,214,255' }
    );
  });
  /* 靈脈：每小時刷新，採集得刻印石 */
  cells(VCELL, 1000, (i, j) => {
    const r = h(i, j, hp * 17 + 433);
    if (r % 100 >= 30) return;
    const id = `v${i}_${j}_${hp}`;
    let x = (i + ((r >>> 8) % 100) / 100) * VCELL,
      y = (j + ((r >>> 16) % 100) / 100) * VCELL;
    if (nearTown(x, y, 140)) return;
    const p = snapRoad(x, y, 120);
    if (!p) return;
    [x, y] = [p[0] - 12, p[1] + 8];
    put(id, { kind: 'vein', x, y, name: '靈脈', gl: '110,220,255' });
  });
  /* 冥府侵蝕柱：每 2 小時換一輪，附近 150 公尺的怪物被侵蝕 */
  const e2 = ep2(),
    obs = [];
  cells(OBCELL, 2400, (i, j) => {
    if (S.lv < 5) return;
    const r = h(i, j, e2 * 7 + 1201);
    if (r % 100 >= 45) return;
    const id = `u${i}_${j}_${e2}`;
    if (S.cleared[id] === e2) return;
    let x = (i + 0.2 + ((r >>> 8) % 60) / 100) * OBCELL,
      y = (j + 0.2 + ((r >>> 16) % 60) / 100) * OBCELL;
    if (nearTown(x, y, 300)) return;
    const p = snapRoad(x, y, 200);
    if (!p) return;
    [x, y] = p;
    const n = (S.obel && S.obel[id]) || 0;
    put(id, {
      kind: 'obelisk',
      x,
      y,
      name: '冥府侵蝕柱',
      lv: S.lv + 3,
      gl: '255,58,90',
      lbl: `侵蝕 ${n}/${OB_NEED}`,
      lc: '#ff8a9a'
    });
    obs.push(out.get(id));
  });
  for (const e of out.values()) {
    if (e.kind !== 'monster' || e.ev) continue;
    const o = obs.find(o => Math.hypot(o.x - e.x, o.y - e.y) <= OB_R);
    if (!o) continue;
    const r = h(fl(e.x), fl(e.y), 77),
      ids = UMODS.map(m => m.id),
      add = [ids.splice(r % ids.length, 1)[0]];
    if ((r >>> 5) % 2) add.push(ids[(r >>> 8) % ids.length]);
    e.mods = [...e.mods, ...add];
    e.uw = o.id;
    e.name = makeEnemy(e.base, e.lv, e.rar, e.mods).name;
  }
  flagsOn().forEach(f => {
    const [x, y] = toM(f.lat, f.lng);
    out.set('f' + f.id, { id: 'f' + f.id, kind: 'flag', x, y, lat: f.lat, lng: f.lng, f, name: '冒險營旗' });
  });
}

/* ================= scrolls, inscriptions, tablets ================= */
const INSC_MAX = 40,
  TAB_MAX = 30,
  FRAG_MAX = 20;
/* 碑文碎片：菁英怪掉落，帶一條地城詞綴 */
function rollInsc(r, boss) {
  if (!(Math.random() < (boss ? 0.5 : [0, 0.12, 0.35, 0.35, 1][r]))) return '';
  S.insc = S.insc || [];
  if (S.insc.length >= INSC_MAX) return '';
  const m = DMODS[fl(Math.random() * DMODS.length)].id;
  S.insc.push({ id: uid(), m });
  return `碑文碎片（${DMODI[m].n}）`;
}
/* 單人石碑通關掉出的石碑：注入的詞綴再加 1～2 條，總共 2～4 條 */
function makeTablet(lv, mods) {
  S.tabs = S.tabs || [];
  const pool = DMODS.map(m => m.id).filter(id => !mods.includes(id)),
    ms = mods.slice(0, 3);
  while (ms.length < 2 || (ms.length < 4 && Math.random() < 0.5))
    ms.push(pool.splice(fl(Math.random() * pool.length), 1)[0]);
  const t = { id: uid(), lv, mods: ms };
  if (S.tabs.length >= TAB_MAX) return '石碑（背包已滿，消失了）';
  S.tabs.push(t);
  return `石碑 Lv${lv}（${ms.length} 條詞綴）`;
}
const modList = ids => ids.map(id => (EMODI[id] || DMODI[id]).n).join('、');
/* 同一種詞綴最多疊 3 次，避免魔法陣變成不可能 */
function capMods(ids) {
  const n = {};
  return ids.filter(id => (n[id] = (n[id] || 0) + 1) <= 3);
}
/* 組隊地城開打時，由隊長付出卷軸與石碑／碎片（沒有了就不能開） */
function payDun(pay) {
  if (!pay) return true;
  const tabs = S.tabs || [],
    frags = S.frags || [];
  if (pay.scroll && !((S.scrolls || {})[pay.scroll] > 0)) return false;
  if ((pay.tabs || []).some(id => !tabs.some(t => t.id === id))) return false;
  if ((pay.frags || []).some(id => !frags.some(t => t.id === id))) return false;
  if (pay.scroll) S.scrolls[pay.scroll]--;
  S.tabs = tabs.filter(t => !(pay.tabs || []).includes(t.id));
  S.frags = frags.filter(t => !(pay.frags || []).includes(t.id));
  save();
  return true;
}

/* ================= underworld ================= */
function obeliskCharge(id) {
  S.obel = S.obel || {};
  for (const k in S.obel) if (!k.endsWith('_' + ep2())) delete S.obel[k];
  S.obel[id] = Math.min(OB_NEED, (S.obel[id] || 0) + 1);
  const n = S.obel[id];
  const e = ENT.get(id);
  if (e) e.lbl = `侵蝕 ${n}/${OB_NEED}`;
  return `<p style="color:#ff8a9a">冥府侵蝕柱充能 ${n}/${OB_NEED}${n >= OB_NEED ? '：看門人可以召喚了！' : ''}</p>`;
}
function watcherWin(id) {
  S.cleared[id] = ep2();
  delete (S.obel || {})[id];
  ENT.delete(id);
  return `<p style="color:#ff8a9a">侵蝕解除！得到 ${makeFrag(S.lv + 3)}</p>`;
}
function makeFrag(lv) {
  S.frags = S.frags || [];
  const part = fl(Math.random() * 4),
    dp = DMODS.map(m => m.id),
    up = UMODS.map(m => m.id),
    take = a => a.splice(fl(Math.random() * a.length), 1)[0];
  const f = { id: uid(), part, lv, mods: [take(dp), take(dp)], um: [take(up), take(up)] };
  if (S.frags.length >= FRAG_MAX) return `${FRAG_PARTS[part]}（背包已滿，消失了）`;
  S.frags.push(f);
  return `${FRAG_PARTS[part]} Lv${lv}`;
}
function summonWatcher(e) {
  const b = {
    name: '冥府看門人',
    bg: 'cave',
    spr: 'golem',
    pal: { r: '#3a1a2e', y: '#ff3a5a' },
    hp: 80,
    atk: 14,
    arm: 30,
    el: 'fire',
    res: [30, 30, 30],
    xp: 40,
    gold: 40
  };
  const en = makeEnemy(b, e.lv, 4, ['uw_body', 'uw_flame', 'fury']);
  en.name = '冥府看門人';
  startBattle(en, { bg: 'cave', boss: true, watcher: e.id });
}

/* ================= silk road (Supabase) ================= */
const SILK = { roads: [], loaded: false, view: null };
const SILK_FREE = 1;
async function silkLoad() {
  if (!CLOUD.sb || CLOUD.anon) return;
  try {
    const { data, error } = await CLOUD.sb.rpc('silk_list');
    if (error) throw error;
    SILK.roads = data || [];
    SILK.loaded = true;
    caravans();
    if (sheetName === 'base') renderSheet();
  } catch (e) {
    SILK.err = e.message;
  }
}
async function baseSync() {
  if (!CLOUD.sb || CLOUD.anon || !CLOUD.uid) return;
  const m = mainBase();
  try {
    await CLOUD.sb
      .from('profiles')
      .update({ base_lat: m ? m.lat : null, base_lng: m ? m.lng : null, base_lv: m ? m.lv : 0 })
      .eq('user_id', CLOUD.uid);
  } catch (e) {}
}
const SILK_MSG = {
  ok: '絲綢之路建立了！',
  not_friend: '只能和好友建立',
  no_base: '你還沒有主據點',
  friend_no_base: '對方還沒有主據點',
  limit: `商路已達上限 ${SILK_FREE} 條`,
  friend_limit: '對方的商路已滿',
  already: '已經連線了',
  guest: '註冊帳號才能建立商路'
};
async function silkCreate(other) {
  if (!CLOUD.sb) return;
  await baseSync();
  const { data, error } = await CLOUD.sb.rpc('silk_create', { other });
  toast(error ? '建立失敗：' + error.message : SILK_MSG[data] || data);
  silkLoad();
}
async function silkRemove(other) {
  if (!CLOUD.sb) return;
  await CLOUD.sb.rpc('silk_remove', { other });
  if (SILK.view && SILK.view.user_id === other) silkView(null);
  silkLoad();
}
/* 商隊：每條商路每天帶回一次對方地區的特產（依對方據點位置決定的一種通貨）與金幣、靈魂碎片 */
const specialty = r => GCUR.slice(2, 5)[h(fl(r.base_lat * 100), fl(r.base_lng * 100), 5) % 3].id;
function caravans() {
  const day = fl((now() + 8 * 3600e3) / 864e5),
    got = [];
  S.caravan = S.caravan || {};
  for (const r of SILK.roads) {
    if (r.base_lat == null || S.caravan[r.user_id] === day) continue;
    S.caravan[r.user_id] = day;
    const g = 60 + S.lv * 10,
      sp = specialty(r);
    S.gold += g;
    giveCur('soul', 3);
    giveCur(sp);
    got.push(`${esc(r.name)}：${g} 金幣、靈魂碎片 ×3、${GCURI[sp].n}`);
  }
  if (got.length) {
    addLog('商隊回來了：' + got.join('；'));
    toast('絲綢之路的商隊回來了');
    save();
  }
}
function silkView(r) {
  SILK.view = r || null;
  if (r) {
    const [x, y] = toM(r.base_lat, r.base_lng);
    follow = false;
    cam.x = x;
    cam.y = y;
    cam.z = Math.max(cam.z, 0.6);
    toast(`切換到 ${r.name} 的據點，範圍內的怪物和石碑都可以直接打`);
  } else follow = true;
  refreshEntities(true);
  renderHud();
}

/* ================= sheets ================= */
const SEL = { insc: new Set(), tabs: new Set() };
const chip = (on, act, id, txt) =>
  `<button class="btn sm${on ? ' pri' : ''}" data-act="${act}" data-id="${id}" style="text-align:left">${txt}</button>`;
function baseHTML() {
  const m = mainBase(),
    fc = flagCheck();
  if (!SILK.loaded) silkLoad();
  if (!SOC.loaded) friendsLoad();
  let html = `<p class="sub">主據點是你自己的家：持續產出金幣（最多累積 8 小時），回到這裡會恢復全部狀態。據點半徑內的怪物、寶箱、空白石碑與靈脈不用出門就能直接互動，半徑隨等級擴大（${BASE_R.join('／')} 公尺）。</p>`;
  if (!m)
    html += `<div class="card"><div class="rowx"><div class="t"><b>建立主據點</b><small>${nearTownE() ? '城鎮範圍內不能建立據點' : '在你現在的位置免費建立'}</small></div><button class="btn pri" data-act="buildMain" ${nearTownE() ? 'disabled' : ''}>在此建立</button></div></div>`;
  else {
    const cost = 120 * m.lv,
      cc = 2 * m.lv;
    html += `<div class="card"><div class="rowx"><div class="t"><b>主據點 Lv${m.lv}</b><small>距離你 ${fmtD(dist(S.lat, S.lng, m.lat, m.lng))}・半徑 ${baseR(m.lv)} 公尺・產出 ${prodRate(m)} 金/小時</small></div><div style="color:var(--gold);font-family:var(--f-pix)">● ${stored(m)}</div></div>
    <div class="btns"><button class="btn sm" data-act="collect" data-id="${m.id}" ${stored(m) ? '' : 'disabled'}>領取</button><button class="btn sm" data-act="upgrade" data-id="${m.id}" ${m.lv < 5 && S.gold >= cost && S.crystal >= cc ? '' : 'disabled'}>${m.lv < 5 ? `升級 ${cost}● ${cc}◆（半徑 ${baseR(m.lv + 1)}m）` : '已滿級'}</button><button class="btn sm" data-act="goto" data-id="${m.id}">查看</button></div></div>`;
  }
  html += `<h3>冒險營旗</h3><p class="sub">到熱門地點（夜市、觀光區）現場插旗，之後 ${Math.round(flagMs() / 60e3)} 分鐘內離開也能遠端打旗子半徑 ${flagR()} 公尺內的怪物與石碑。最多同時 ${FLAG_MAX} 支，每支 ${FLAG_COST} 金幣；主據點每升 1 級多 10 分鐘，半徑比主據點小一級。</p>
  ${flagsOn()
    .map(
      (f, i) =>
        `<div class="card"><div class="rowx"><div class="t"><b>營旗 ${i + 1}</b><small>距離你 ${fmtD(dist(S.lat, S.lng, f.lat, f.lng))}・還有 ${Math.ceil((f.until - now()) / 60e3)} 分鐘</small></div><button class="btn sm" data-act="flagGo" data-id="${f.id}">查看</button></div></div>`
    )
    .join('')}
  <div class="card"><div class="rowx"><div class="t"><b>在這裡插旗</b><small>${fc || `${FLAG_COST} 金幣`}</small></div><button class="btn pri sm" data-act="flagPlant" ${fc ? 'disabled' : ''}>插旗</button></div></div>`;
  html += `<h3>絲綢之路</h3>${silkHTML()}`;
  html += `<div class="card"><div class="rowx"><div class="t"><b>測試用：時間快轉</b><small>據點產出、怪物與地城刷新、營旗時間</small></div><button class="btn sm" data-act="ff">快轉 1 小時</button></div></div>`;
  return html;
}
function silkHTML() {
  if (!CLOUD.sb || CLOUD.anon) return '<p class="sub">註冊帳號、加好友後，雙方都有主據點就能建立絲綢之路。</p>';
  let html = `<p class="sub">和好友的主據點連線：可以切換到對方據點的視角，直接打對方據點範圍內的怪物與石碑；每天商隊會自動帶回對方地區的特產。免費 ${SILK_FREE} 條。</p>`;
  if (SILK.view)
    html += `<div class="card"><div class="rowx"><div class="t"><b>正在看 ${esc(SILK.view.name)} 的據點</b><small>範圍內的東西可以直接互動</small></div><button class="btn pri sm" data-act="silkEnd">回到自己</button></div></div>`;
  html += SILK.roads
    .map(
      r =>
        `<div class="card"><div class="rowx"><div class="t"><b>${esc(r.name)}</b><small>${r.base_lat == null ? '對方目前沒有主據點' : `據點 Lv${r.base_lv}・距離 ${fmtD(dist(S.lat, S.lng, r.base_lat, r.base_lng))}・特產 ${GCURI[specialty(r)].n}`}</small></div></div><div class="btns"><button class="btn sm pri" data-act="silkGo" data-id="${r.user_id}" ${r.base_lat == null ? 'disabled' : ''}>切換視角</button><button class="btn sm" data-act="silkDel" data-id="${r.user_id}">斷開</button></div></div>`
    )
    .join('');
  if (SILK.roads.length < SILK_FREE) {
    const fr = SOC.friends.filter(f => f.status === 'accepted' && !SILK.roads.some(r => r.user_id === f.user_id));
    html += fr.length
      ? `<div class="btns">${fr.map(f => `<button class="btn sm" data-act="silkNew" data-id="${f.user_id}">與 ${esc(f.name)} 建立商路</button>`).join('')}</div>`
      : '<p class="sub">還沒有可以連線的好友。</p>';
  }
  if (SILK.err) html += `<p class="sub" style="color:#ffb27a">${esc(SILK.err)}</p>`;
  return html;
}
function steleHTML() {
  const sc = S.scrolls || {},
    ins = S.insc || [],
    tabs = S.tabs || [],
    frags = S.frags || [];
  SEL.insc.forEach(id => ins.some(q => q.id === id) || SEL.insc.delete(id));
  SEL.tabs.forEach(id => tabs.some(q => q.id === id) || SEL.tabs.delete(id));
  const ni = SEL.insc.size,
    nt = SEL.tabs.size,
    best = portalPick();
  return `<p class="sub">路上的空白石碑與魔法陣按「壓縮封印」收成卷軸，回家再組裝成地城。菁英怪會掉碑文碎片，冥府侵蝕柱的看門人會掉冥府碎片。</p>
  <div class="curs"><span><img class="cico lg" src="${entURL('stele')}" alt=""><span>空白石碑卷<b>${sc.stele || 0}</b></span></span><span><img class="cico lg" src="${entURL('circle')}" alt=""><span>空白魔法陣卷<b>${sc.circle || 0}</b></span></span><span><img class="cico lg" src="${entURL('obelisk')}" alt=""><span>冥府碎片<b>${frags.length}</b></span></span></div>
  <h3>單人石碑</h3><p class="sub">選 0～3 個碑文碎片注入詞綴（每個 +1 層，最多 3 層）。怪物等級是你 +2，失敗就沒了；通關掉出帶 2～4 條詞綴的石碑。</p>
  <div class="btns" style="flex-wrap:wrap">${ins.map(q => chip(SEL.insc.has(q.id), 'selI', q.id, DMODI[q.m].n)).join('') || '<span class="sub">沒有碑文碎片</span>'}</div>
  <button class="btn pri" data-act="steleRun" ${sc.stele > 0 && ni <= 3 ? '' : 'disabled'}>開啟單人石碑（${Math.max(1, Math.min(3, ni))} 層・Lv${S.lv + 2}）</button>
  <h3>4 人石碑魔法陣</h3><p class="sub">選 4～6 個石碑，詞綴全部疊加（同一種最多 3 次），合成 20 層地城。倒下不會復活，全隊倒下就失敗；首領掉崇高刻印石。</p>
  <div style="display:grid;gap:6px">${tabs.map(t => chip(SEL.tabs.has(t.id), 'selT', t.id, `石碑 Lv${t.lv}・${modList(t.mods)}`)).join('') || '<span class="sub">沒有石碑（通關單人石碑取得）</span>'}</div>
  <button class="btn pri" data-act="circleOpen" ${sc.circle > 0 && nt >= 4 && nt <= 6 ? '' : 'disabled'}>組隊開啟魔法陣（已選 ${nt}/4～6）</button>
  <h3>冥府傳送門</h3><p class="sub">集滿 4 個不同部位的冥府碎片（${FRAG_PARTS.join('、')}）就能組成傳送門，8 層、詞綴全部疊加，首領保證掉冥府之血。</p>
  <div style="display:grid;gap:6px">${frags.map(f => `<div class="card"><b>${FRAG_PARTS[f.part]} Lv${f.lv}</b><small class="sub" style="display:block">${modList(f.mods)}・<span style="color:#ff8a9a">${modList(f.um)}</span></small></div>`).join('') || '<span class="sub">沒有冥府碎片</span>'}</div>
  <button class="btn pri" data-act="portalOpen" ${best ? '' : 'disabled'}>組隊開啟冥府傳送門${best ? '' : `（還缺 ${FRAG_PARTS.filter((_, i) => !frags.some(f => f.part === i)).join('、')}）`}</button>`;
}
const ENTURL = new Map();
function entURL(k) {
  if (!ENTURL.has(k)) ENTURL.set(k, sprite(k, PAL[k]).toDataURL());
  return ENTURL.get(k);
}
/* 每個部位挑等級最高的那片 */
function portalPick() {
  const fr = S.frags || [],
    pick = [0, 1, 2, 3].map(p => fr.filter(f => f.part === p).sort((a, b) => b.lv - a.lv)[0]);
  return pick.every(Boolean) ? pick : null;
}

/* ================= actions ================= */
Object.assign(A, {
  seal: d => {
    const e = ENT.get(d.id);
    if (!inRange(e) || isDone(e)) return;
    S.scrolls = S.scrolls || { stele: 0, circle: 0 };
    S.scrolls[e.kind] = (S.scrolls[e.kind] || 0) + 1;
    S.defeated[e.id] = 1;
    sfx('bless');
    buzz(40);
    toast(`壓縮封印完成：${e.kind === 'stele' ? '空白石碑卷' : '空白魔法陣卷'} +1`);
    addLog(`封印了${e.name}`);
    closeSheet();
    save();
  },
  gather: d => {
    const e = ENT.get(d.id);
    if (!inRange(e) || isDone(e)) return;
    S.defeated[e.id] = 1;
    const got = ['刻印石'];
    giveCur('eng');
    giveCur('soul', 3);
    got.push('靈魂碎片 ×3');
    if (Math.random() < 0.3) {
      giveCur('engC');
      got.push('混沌刻印石');
    }
    sfx('coin');
    toast('採集：' + got.join('、'));
    addLog('採集靈脈：' + got.join('、'));
    closeSheet();
    save();
  },
  summon: d => {
    const e = ENT.get(d.id);
    if (!inRange(e) || !((S.obel || {})[e.id] >= OB_NEED)) return;
    closeSheet();
    summonWatcher(e);
  },
  flagPlant: () => {
    if (flagCheck()) return;
    S.gold -= FLAG_COST;
    S.flags = flagsOn();
    S.flags.push({ id: uid(), lat: S.lat, lng: S.lng, until: now() + flagMs() });
    sfx('level');
    toast(`插好營旗了，${Math.round(flagMs() / 60e3)} 分鐘內可以遠端互動`);
    addLog('插下冒險營旗');
    refreshEntities(true);
    renderHud();
    renderSheet();
    save();
  },
  flagGo: d => {
    const f = flagsOn().find(q => q.id === d.id);
    if (!f) return;
    closeSheet();
    follow = false;
    [cam.x, cam.y] = toM(f.lat, f.lng);
  },
  selI: d => {
    SEL.insc.has(d.id) ? SEL.insc.delete(d.id) : SEL.insc.size < 3 && SEL.insc.add(d.id);
    renderSheet();
  },
  selT: d => {
    SEL.tabs.has(d.id) ? SEL.tabs.delete(d.id) : SEL.tabs.size < 6 && SEL.tabs.add(d.id);
    renderSheet();
  },
  steleRun: () => {
    if (!((S.scrolls || {}).stele > 0) || SEL.insc.size > 3) return;
    const mods = S.insc.filter(q => SEL.insc.has(q.id)).map(q => q.m),
      lv = S.lv + 2;
    S.scrolls.stele--;
    S.insc = S.insc.filter(q => !SEL.insc.has(q.id));
    SEL.insc.clear();
    closeSheet();
    enterDungeon({
      id: 'st' + uid(),
      kind: 'dungeon',
      dt: 'stele',
      mods,
      lv,
      lat: S.lat,
      lng: S.lng,
      floors: Math.max(1, Math.min(3, mods.length))
    });
    save();
  },
  circleOpen: () => {
    const tabs = (S.tabs || []).filter(t => SEL.tabs.has(t.id));
    if (!((S.scrolls || {}).circle > 0) || tabs.length < 4 || tabs.length > 6) return;
    const lv = Math.round(tabs.reduce((a, t) => a + t.lv, 0) / tabs.length) + 2;
    partyCreate({
      id: 'mc' + uid(),
      dt: 'circle',
      mods: capMods(tabs.flatMap(t => t.mods)),
      lv,
      lat: S.lat,
      lng: S.lng,
      name: '石碑魔法陣',
      pay: { scroll: 'circle', tabs: tabs.map(t => t.id) }
    });
    SEL.tabs.clear();
  },
  portalOpen: () => {
    const fr = portalPick();
    if (!fr) return;
    partyCreate({
      id: 'up' + uid(),
      dt: 'portal',
      mods: capMods(fr.flatMap(f => f.mods)),
      umods: [...new Set(fr.flatMap(f => f.um))],
      lv: Math.round(fr.reduce((a, f) => a + f.lv, 0) / 4) + 2,
      lat: S.lat,
      lng: S.lng,
      name: '冥府傳送門',
      pay: { frags: fr.map(f => f.id) }
    });
  },
  silkNew: d => silkCreate(d.id),
  silkDel: d => silkRemove(d.id),
  silkGo: d => {
    const r = SILK.roads.find(q => q.user_id === d.id);
    if (!r || r.base_lat == null) return;
    closeSheet();
    silkView(r);
  },
  silkEnd: () => {
    silkView(null);
    renderSheet();
  }
});
