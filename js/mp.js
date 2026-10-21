/* 漫步勇者 · 組隊與多人地城戰鬥（Supabase Realtime 廣播，隊長的裝置負責計算） */
'use strict';
/* 流程：隊長在地城按「組隊進入」→ 拿到 6 碼代碼 → 好友用邀請或代碼加入 → 隊長開始。
   0.3.35 即時行動條：隊長的裝置每 100 毫秒推進時間（mpClock），每個人的行動條滿了就能行動（有 15 秒，時間到自動普攻），
   怪物的行動條滿了就出手；結算動畫播放時（MB.lock）時間暫停，這時送來的行動排隊（MB.q）。
   戰鬥狀態只在隊長那邊算，算完廣播 state 給大家；每個人的經驗、金幣、掉寶在自己的裝置結算。 */
let PT = null;
const TURN_MS = 15000,
  MSGS = ['join', 'lobby', 'leave', 'kick', 'ready', 'start', 'state', 'act', 'roomclear', 'clear', 'wipe', 'end'];
/* 人數上限依地城危險度：普通 2、團體 3、地獄 4 */
const ptMax = () => (PT && PT.dun ? DTYPES[PT.dun.dt || 'normal'].max || 4 : 4);
const allReady = () => PT && PT.members.size > 0 && [...PT.members.values()].every(m => m.ready);
const genCode = () =>
  Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[fl(Math.random() * 32)]).join('');
const amLeader = () => PT && PT.leader === CLOUD.uid;
function mySnap() {
  const st = stats();
  return {
    uid: CLOUD.uid,
    name: S.name || '旅人',
    no: CLOUD.no,
    cls: S.cls,
    lv: S.lv,
    hp: S.hp,
    mp: S.mp,
    sks: mySkills(),
    pal: heroPal(),
    look: heroLook(),
    wep: wepKind(),
    st: JSON.parse(JSON.stringify(st))
  };
}
const palFor = q => q.pal || heroPal(q.cls, {});

/* ================= party / lobby ================= */
function ptSend(ev, payload) {
  if (PT && PT.ch) PT.ch.send({ type: 'broadcast', event: ev, payload });
}
function ptConnect() {
  const ch = CLOUD.sb.channel('wf-party-' + PT.code, {
    config: { broadcast: { self: false }, presence: { key: CLOUD.uid } }
  });
  PT.ch = ch;
  MSGS.forEach(ev => ch.on('broadcast', { event: ev }, m => ptMsg(ev, m.payload || {})));
  ch.on('presence', { event: 'leave' }, ({ key }) => ptGone(key));
  ch.subscribe(async st => {
    if (st !== 'SUBSCRIBED') return;
    await ch.track({ uid: CLOUD.uid });
    if (amLeader()) ptLobby();
    else ptSend('join', mySnap());
  });
}
function ptPill() {
  const sd = $('socDot');
  if (sd) sd.hidden = !PT && !SOC.friends.some(f => f.status === 'pending' && f.incoming);
  const el = $('ptPill');
  if (!el) return;
  el.hidden = !PT || !!MB;
  if (PT) el.textContent = `隊伍 ${PT.code}・${PT.members.size} 人`;
}
/* 隊長建立隊伍 */
function partyCreate(e) {
  if (!CLOUD.sb || !CLOUD.uid) {
    toast('雲端沒有連線，暫時不能組隊');
    return;
  }
  if (PT) partyLeave(true);
  PT = {
    code: genCode(),
    leader: CLOUD.uid,
    dun: {
      id: e.id,
      kind: 'dungeon',
      dt: e.dt,
      mods: e.mods,
      umods: e.umods,
      lv: e.lv,
      lat: e.lat,
      lng: e.lng,
      name: e.name,
      pay: e.pay,
      floors: e.floors,
      onsite: !!e.onsite
    },
    members: new Map([[CLOUD.uid, mySnap()]]),
    started: false
  };
  ptConnect();
  ptPill();
  openSheet('party', '組隊');
  addLog(`建立隊伍 ${PT.code}：${dunName(PT.dun)} Lv${PT.dun.lv}`);
}
/* 用代碼加入。6 秒內沒收到隊長回應就當作找不到 */
function partyJoin(code) {
  code = String(code || '')
    .trim()
    .toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) {
    toast('隊伍代碼是 6 個英數字');
    return;
  }
  if (!CLOUD.sb || !CLOUD.uid) {
    toast('雲端沒有連線，暫時不能組隊');
    return;
  }
  if (PT) partyLeave(true);
  PT = { code, leader: null, dun: null, members: new Map(), started: false };
  ptConnect();
  ptPill();
  openSheet('party', '組隊');
  toast(`正在加入隊伍 ${code}…`);
  const me = PT;
  setTimeout(() => {
    if (PT === me && !PT.leader) {
      toast('找不到這個隊伍，可能已經解散');
      partyLeave(true);
    }
  }, 6000);
}
function partyLeave(silent) {
  if (!PT) return;
  try {
    if (amLeader()) ptSend('end', { reason: '隊長解散了隊伍' });
    else ptSend('leave', { uid: CLOUD.uid });
  } catch (e) {}
  const ch = PT.ch;
  PT = null;
  setTimeout(() => {
    try {
      CLOUD.sb.removeChannel(ch);
    } catch (e) {}
  }, 300);
  ptPill();
  if (sheetName === 'party') closeSheet();
  if (!silent) toast('離開隊伍');
}
function ptLobby() {
  if (!amLeader()) return;
  ptSend('lobby', { leader: PT.leader, dun: PT.dun, members: [...PT.members.values()], started: PT.started });
  ptPill();
  if (sheetName === 'party') renderSheet();
}
function ptGone(uid) {
  if (!PT || uid === CLOUD.uid) return;
  if (uid === PT.leader) {
    if (MB) {
      mpEnd('隊長離線了，戰鬥中止。已經拿到的獎勵會保留。');
    } else {
      toast('隊長離開了，隊伍解散');
      partyLeave(true);
    }
    return;
  }
  if (amLeader()) {
    if (MB) {
      const p = MB.ps.find(q => q.uid === uid);
      if (p && !p.gone) {
        p.gone = true;
        mpPush([{ t: 'msg', s: `${p.name} 斷線了，之後都自動普攻` }]);
        if (MB.ready[uid]) MB.ready[uid] = Math.min(MB.ready[uid], Date.now() + 1500);
      }
    } else if (PT.members.delete(uid)) ptLobby();
  }
}
function ptMsg(ev, p) {
  if (!PT) return;
  if (amLeader()) {
    if (ev === 'join') {
      if (!p.uid) return;
      if (PT.started) {
        ptSend('kick', { uid: p.uid, reason: '這個隊伍已經開始戰鬥了' });
        return;
      }
      if (!PT.members.has(p.uid) && PT.members.size >= ptMax()) {
        ptSend('kick', { uid: p.uid, reason: `隊伍已滿（${DTYPES[PT.dun.dt || 'normal'].n}最多 ${ptMax()} 人）` });
        return;
      }
      const old = PT.members.get(p.uid);
      p.ready = old ? old.ready : false;
      const isNew = !PT.members.has(p.uid);
      PT.members.set(p.uid, p);
      ptLobby();
      if (isNew) {
        toast(`${p.name} 加入了隊伍`);
        sfx('select');
      }
    } else if (ev === 'leave') {
      if (MB) {
        ptGone(p.uid);
      } else if (PT.members.delete(p.uid)) {
        ptLobby();
        toast('有隊員離開了');
      }
    } else if (ev === 'ready') {
      const m = PT.members.get(p.uid);
      if (m && !PT.started) {
        m.ready = !!p.ready;
        ptLobby();
      }
    } else if (ev === 'act') mpOnAct(p.uid, p.k, p.tok, p.tg);
    return;
  }
  if (ev === 'lobby') {
    const first = !PT.leader;
    PT.leader = p.leader;
    PT.dun = p.dun;
    PT.members = new Map(p.members.map(m => [m.uid, m]));
    PT.started = p.started;
    ptPill();
    if (!PT.members.has(CLOUD.uid) && !p.started) ptSend('join', mySnap());
    if (first) {
      toast(`已加入隊伍 ${PT.code}`);
      sfx('select');
    }
    if (sheetName === 'party') renderSheet();
  } else if (ev === 'kick') {
    if (p.uid === CLOUD.uid) {
      toast(p.reason || '無法加入隊伍');
      partyLeave(true);
    }
  } else if (ev === 'end') {
    if (MB) mpEnd(p.reason || '隊伍解散了');
    else {
      toast(p.reason || '隊伍解散了');
      partyLeave(true);
    }
  } else if (ev === 'start') {
    mpEnter(p.mb);
  } else if (ev === 'state') {
    if (MB) mpApply(p.mb, p.fx);
  } else if (ev === 'roomclear') {
    if (MB) mpRoomReward(p.e, p.n);
  } else if (ev === 'clear') {
    if (MB) mpClear();
  } else if (ev === 'wipe') {
    if (MB) mpWipe();
  }
}
const ptCodeHTML = () =>
  `<h3>用隊伍代碼加入</h3><div class="card"><div class="srow"><input class="inp" id="ptCode" maxlength="6" placeholder="6 碼隊伍代碼" autocapitalize="characters" style="text-transform:uppercase"><button class="btn pri" data-act="ptJoin">加入</button></div><p class="sub" style="margin-top:6px">隊長在地城按「組隊進入」就會拿到代碼。遊客也可以用代碼加入。</p></div>`;
function partyHTML() {
  if (!PT)
    return `<div class="card"><p class="sub">目前沒有隊伍。走到地城旁邊按「組隊進入」就能當隊長開隊，或用下面的代碼加入別人的隊伍。</p></div>${ptCodeHTML()}`;
  const d = PT.dun,
    lead = amLeader();
  if (!d)
    return `<div class="card"><p>正在連線隊伍 <b style="color:var(--gold)">${PT.code}</b>…</p></div><div class="btns"><button class="btn" data-act="ptLeave">取消</button></div>`;
  const sp = dunSpec(d),
    T = DTYPES[d.dt || 'normal'],
    mem = [...PT.members.values()];
  let h = `<div class="card"><b style="color:${T.col};font-family:var(--f-pix);font-size:18px;font-weight:400">${esc(dunName(d))} Lv${d.lv}</b><p class="sub">${sp.floors} 層・物品數量 +${sp.q}%・稀有度 +${sp.r}%・怪物生命隨人數提高</p>${dunModsHTML(sp)}</div>
    <div class="card ptcode"><small class="sub">隊伍代碼</small><b>${PT.code}</b><small class="sub">好友在「好友與組隊」輸入這組代碼就能加入</small></div>
    <h3>大廳・隊員 ${mem.length}/${ptMax()}・準備 ${mem.filter(m => m.ready).length}/${mem.length}</h3>${mem.map(m => `<div class="card"><div class="rowx"><div class="t"><b>${esc(m.name)}${m.uid === PT.leader ? ' <span style="color:var(--gold)">隊長</span>' : ''}${m.uid === CLOUD.uid ? ' <span class="sub">（你）</span>' : ''}</b><small><span style="color:${clsOf(m.cls).color}">${clsOf(m.cls).name}</span> Lv${m.lv}・生命 ${m.st.maxhp}・速度 ${m.st.speed}</small></div><span class="rdy ${m.ready ? 'ok' : ''}">${m.ready ? '✓ 準備好了' : '準備中…'}</span></div></div>`).join('')}`;
  if (lead && !CLOUD.anon) {
    const fr = SOC.friends
      .filter(f => f.status === 'accepted' && !PT.members.has(f.user_id))
      .sort((a, b) => isOnline(b) - isOnline(a));
    h += `<h3>邀請好友</h3>${fr.length ? fr.map(f => `<div class="card"><div class="rowx"><div class="t"><b>${esc(f.name)}</b><small>Lv${f.lv}・${isOnline(f) ? '<span style="color:var(--good)">在線</span>' : '離線'}</small></div><button class="btn sm pri" data-act="ptInvite" data-u="${f.user_id}">邀請</button></div></div>`).join('') : '<p class="sub">沒有可以邀請的好友。也可以把代碼直接傳給朋友。</p>'}`;
  } else if (lead) h += `<p class="sub">註冊帳號後可以直接邀請好友；現在也能把代碼傳給朋友。</p>`;
  /* 全員按「準備」後，隊長才能出發 */
  const me = PT.members.get(CLOUD.uid),
    ok = allReady();
  h += `<div class="btns"><button class="btn ${me && me.ready ? '' : 'pri'}" data-act="ptReady" ${PT.started ? 'disabled' : ''}>${me && me.ready ? '取消準備' : '準備'}</button>
    ${lead ? `<button class="btn pri" data-act="ptStart" ${PT.started || !ok ? 'disabled' : ''}>${ok ? `出發（${mem.length} 人）` : '等待全員準備'}</button>` : `<p class="sub" style="width:100%">${ok ? '全員準備好了，等待隊長出發…' : '全員按「準備」後，隊長就能出發。'}</p>`}
    <button class="btn" data-act="ptLeave">${lead ? '解散隊伍' : '離開隊伍'}</button></div>`;
  return h;
}

/* ================= battle state (leader authoritative) ================= */
let MBT = null,
  MBbg = null,
  MBloc = null;
/* 0.3.35 輪到自己了沒（行動條滿了、還沒送出） */
const mpMine = () => !!MB && !!MB.rl && CLOUD.uid in MB.rl && MB.sent !== (MB.rt || {})[CLOUD.uid];
const MBFX = { pops: [], fx: [], shake: 0, hurt: {}, lunge: {}, en: [], t0: 0 };
/* 廣播用的狀態：去掉只屬於自己的欄位（戰利品、選單、已送出的回合） */
const pub = () => {
  const o = { ...MB };
  delete o.loot;
  delete o.sub;
  delete o.sent;
  delete o.dl;
  delete o.rdl;
  delete o.q;
  return JSON.parse(JSON.stringify(o));
};
function mpPush(fx) {
  if (!MB) return;
  /* 每個人剩多少毫秒可以下指令（各裝置的時鐘不同，送剩下的時間） */
  MB.rl = {};
  for (const u in MB.ready || {}) MB.rl[u] = Math.max(0, MB.ready[u] - Date.now());
  MB.order = avPreview(MB.av, mpUnits(), 6);
  ptSend('state', { mb: pub(), fx: fx || [] });
  mpApply(null, fx || []);
}
let MBclk = null;
/* 隊長按開始 */
function ptReady() {
  if (!PT || PT.started) return;
  const me = PT.members.get(CLOUD.uid);
  if (!me) return;
  me.ready = !me.ready;
  sfx('select');
  if (amLeader()) ptLobby();
  else {
    ptSend('ready', { uid: CLOUD.uid, ready: me.ready });
    renderSheet();
  }
}
function mpStart() {
  if (!amLeader() || PT.started || MB || !allReady()) return;
  const d = PT.dun,
    mem = [...PT.members.values()];
  /* 魔法陣與冥府傳送門：出發時才扣掉隊長的卷軸、石碑或碎片 */
  if (d.pay && !payDun(d.pay)) {
    toast('卷軸、石碑或碎片不見了，不能出發');
    return;
  }
  PT.started = true;
  ptLobby();
  const seed = h(fl(d.lat * 1e4), fl(d.lng * 1e4), hepoch()),
    spec = dunSpec(d);
  BLOG = [];
  $('binfo').hidden = true;
  MB = {
    spec,
    d: {
      id: d.id,
      kind: 'dungeon',
      dt: d.dt,
      mods: d.mods,
      umods: d.umods,
      lv: d.lv,
      lat: d.lat,
      lng: d.lng,
      floors: d.floors,
      onsite: d.onsite,
      seed,
      spec,
      lm: null
    },
    room: 0,
    floors: spec.floors,
    n: mem.length,
    av: {},
    ready: {},
    rt: {},
    q: [],
    lock: true,
    tick: 0,
    tok: 0,
    ea: -1,
    order: [],
    actor: null,
    leader: CLOUD.uid,
    ps: mem.map(m => ({
      uid: m.uid,
      name: m.name,
      cls: m.cls,
      lv: m.lv,
      hp: Math.max(1, Math.min(m.hp, m.st.maxhp)),
      mp: Math.min(m.mp, m.st.maxmp),
      st: m.st,
      sks: m.sks || [],
      pal: m.pal,
      wep: m.wep,
      alive: true,
      gone: false,
      guard: 0,
      frozen: 0,
      shield: 0,
      stacks: 0,
      pets: [],
      buffs: []
    })),
    es: []
  };
  MB.ps.forEach(battleOpen);
  /* 0.3.21 組隊光環：隊友開的戰旗、再生光環給其他人增益（整場戰鬥） */
  for (const p of MB.ps)
    for (const q of MB.ps)
      if (q !== p && q.st.paura && Object.keys(q.st.paura).length)
        p.buffs.push({ id: 'aura_' + q.uid, n: `${q.name}的光環`, turns: 999, ...q.st.paura });
  mpSpawn();
  ptSend('start', { mb: pub() });
  mpEnter(null);
  setTimeout(mpRound, 900);
}
function mpSpawn() {
  const n = MB.n,
    { es, bg, boss } = dunEnemy(MB.d, MB.room, n - 1);
  es.forEach((x, k) => (x.msk = monSkills(x, !!boss && k === 0)));
  for (const e of es) {
    e.maxhp = Math.round(e.maxhp * (1 + 0.3 * (n - 1)));
    e.atk = Math.round(e.atk * (1 + 0.08 * (n - 1)));
    e.hp = e.maxhp;
    eInit(e);
  }
  MB.es = es;
  MB.e = es[0];
  MB.bg = bg;
  MB.boss = boss;
}
/* 0.3.10 行動值：每位隊員與每隻敵人依速度輪流行動（共用 battle.js 的 avNext） */
const mpUnits = () => [
  ...MB.ps.filter(p => p.alive).map(p => ({ id: p.uid, spd: avSpd(p) })),
  ...aliveIdx(MB.es).map(i => ({ id: 'e' + i, spd: avSpd(MB.es[i]) }))
];
/* 每層重新累積行動值，開始跑時間 */
function mpRound() {
  if (!MB) return;
  MB.av = atbStart(MB.es);
  delete MB.av.me;
  for (const p of MB.ps) MB.av[p.uid] = AV_MAX * 0.5;
  MB.ready = {};
  MB.q = [];
  MB.tick = 0;
  MB.actor = null;
  MB.lock = false;
  MB.lastT = performance.now();
  clearInterval(MBclk);
  MBclk = setInterval(mpClock, 100);
  mpPush();
}
/* 隊長每 100 毫秒推進一次：冷卻、行動條、每 TURN_S 秒一跳持續效果、怪物出手、隊員輪到與逾時 */
function mpClock() {
  if (!MB || !amLeader()) return clearInterval(MBclk);
  const now = performance.now(),
    dt = Math.min(0.25, (now - (MB.lastT || now)) / 1000);
  MB.lastT = now;
  if (MB.lock) return;
  let dirty = false;
  const alive = MB.ps.filter(p => p.alive);
  for (const p of alive) if (cdTick(p, dt)) dirty = true;
  for (const u of mpUnits()) {
    const pl = MB.ps.some(p => p.uid === u.id);
    MB.av[u.id] = Math.min(pl ? AV_MAX : AV_MAX * 2, (MB.av[u.id] || 0) + u.spd * ATB_K * dt);
  }
  if ((MB.tick += dt) >= TURN_S) {
    MB.tick -= TURN_S;
    /* 持續效果與召喚物不暫停時間；打完這層或全滅才走 mpRun 結算 */
    const ev = tickResolve(MB.es, alive);
    if (!MB.ps.some(p => p.alive) || MB.es.every(e => e.hp <= 0)) return mpRun(ev, '');
    if (ev.length) {
      for (const f of ev) if (f.t === 'down') f.s = `${(MB.ps.find(p => p.uid === f.who) || {}).name} 倒下了！`;
      mpPush(ev);
    }
    dirty = !ev.length;
  }
  /* 怪物：行動條滿了就出手（同時滿的，滿越多的先） */
  const rd = aliveIdx(MB.es)
    .filter(i => MB.av['e' + i] >= AV_MAX)
    .sort((a, b) => MB.av['e' + b] - MB.av['e' + a]);
  if (rd.length && now >= (MB.nextAct || 0)) {
    MB.av['e' + rd[0]] -= AV_MAX;
    MB.ea = rd[0];
    MB.nextAct = now + STAGGER;
    return mpEnemy();
  }
  /* 隊員：行動條滿了就輪到他（凍結跳過；插了自動施放就直接放） */
  for (const p of alive) {
    if (MB.av[p.uid] < AV_MAX || MB.ready[p.uid]) continue;
    if (p.frozen) {
      p.frozen = 0;
      MB.av[p.uid] = 0;
      mpPush([{ t: 'msg', s: `${p.name} 被凍住了，這次行動跳過` }]);
      continue;
    }
    MB.ready[p.uid] = Date.now() + (p.gone ? 1500 : TURN_MS);
    (MB.rAt = MB.rAt || {})[p.uid] = Date.now();
    MB.rt[p.uid] = ++MB.tok;
    mpPush([{ t: 'turn', uid: p.uid }]);
    dirty = false;
  }
  /* 排隊的行動（動畫播放時送來的） */
  if (MB.q.length) {
    const a = MB.q.shift();
    return mpResolve(a.uid, a.k, false, a.tg);
  }
  /* 自動施放：輪到之後 AUTO_WAIT 秒還沒下指令，就放插了自動施放的技能 */
  for (const u in MB.ready) {
    const p = MB.ps.find(q => q.uid === u);
    if (!p || Date.now() - ((MB.rAt || {})[u] || 0) < AUTO_WAIT * 1000 || (MB.rAt || {})[u] < 0) continue;
    MB.rAt[u] = -1;
    const ai = autoPick(p, p, p.st, p.sks || []);
    if (ai >= 0) return mpResolve(u, 's' + ai, false, p.tg || 0, true);
  }
  /* 時間到：自動普攻 */
  for (const u in MB.ready)
    if (Date.now() > MB.ready[u]) return mpResolve(u, 'attack', true, MB.ps.find(p => p.uid === u).tg || 0);
  if (dirty || now - (MB.syncT || 0) > 1000) {
    MB.syncT = now;
    mpPush();
  }
}
/* 播一段結算：鎖住時間，播完解鎖並檢查全滅與過關 */
/* 播一段結算（時間不停，動畫疊著播）；打完這層或全滅才停下來，播完進結算 */
function mpRun(fx, actor) {
  const tot = fx.reduce((a, f) => Math.max(a, f.at || 0), 0),
    wipe = !MB.ps.some(p => p.alive),
    clear = MB.es.every(e => e.hp <= 0);
  for (const f of fx) if (f.t === 'down') f.s = `${(MB.ps.find(p => p.uid === f.who) || {}).name} 倒下了！`;
  /* 倒下的人不能行動 */
  for (const u in MB.ready) if (!(MB.ps.find(p => p.uid === u) || {}).alive) delete MB.ready[u];
  MB.actor = actor;
  if (wipe || clear) MB.lock = true;
  mpPush(fx);
  if (wipe || clear) {
    clearInterval(MBclk);
    clearTimeout(MBT);
    MBT = setTimeout(() => {
      if (!MB) return;
      MB.actor = null;
      if (wipe) {
        ptSend('wipe', {});
        mpWipe();
      } else mpRoomClear();
    }, tot + 400);
    return;
  }
  setTimeout(() => MB && MB.actor === actor && (MB.actor = null), tot);
}
function mpOnAct(uid, k, tok, tg) {
  if (!MB || !MB.ready[uid] || tok !== MB.rt[uid]) return;
  if (MB.lock) {
    if (!MB.q.some(a => a.uid === uid)) MB.q.push({ uid, k, tg });
    return;
  }
  mpResolve(uid, k, false, tg);
}
/* 一位玩家的行動（共用 actResolve），tg 是他選的目標；auto 是逾時普攻、ac 是自動施放 */
function mpResolve(uid, k, auto, tg = 0, ac) {
  const p = MB.ps.find(q => q.uid === uid);
  if (!p || !MB.es || !MB.ready[uid]) return;
  delete MB.ready[uid];
  MB.q = MB.q.filter(a => a.uid !== uid);
  MB.av[uid] = Math.max(0, (MB.av[uid] || 0) - AV_MAX);
  MB.nextAct = Math.max(MB.nextAct || 0, performance.now() + STAGGER);
  p.tg = tg;
  let sk = skByKey(k, p.sks || []);
  const done = ev => {
    /* 昇華：有機率再行動一次（行動條直接補滿） */
    if (p.st.extraTurn && Math.random() * 100 < p.st.extraTurn) {
      MB.av[uid] = AV_MAX;
      ev.push({ t: 'msg', s: `${p.name} 再行動一次！`, at: ev.reduce((a, f) => Math.max(a, f.at || 0), 0) + 100 });
    }
    mpRun(ev, uid);
  };
  if (k === 'potion' || k === 'ether') {
    const hm = (p.st.healMul || 1) * (MB.spec.noregen ? 0.5 : 1) * (1 + (p.st.potPct || 0) / 100),
      v = k === 'potion' ? Math.round(p.st.maxhp * 0.4 * hm) : Math.round(p.st.maxmp * 0.5 * hm);
    if (k === 'potion') p.hp = Math.min(p.st.maxhp, p.hp + v);
    else p.mp = Math.min(p.st.maxmp, p.mp + v);
    return done([
      { t: 'msg', s: `${p.name} 使用${k === 'potion' ? '生命' : '魔力'}藥水` },
      { t: 'heal', who: uid, v, mp: k === 'ether', at: 100 },
      { t: 'end', at: 500 }
    ]);
  }
  /* 0.3.22 引爆地雷 */
  if (k === 'mines' && (p.mines || []).length) {
    const alive = MB.ps.filter(q => q.alive);
    return done(
      [{ t: 'msg', s: `${p.name}：引爆地雷` }].concat(
        mineBlast(p, p.st, MB.es, tg, alive, { ew: MB.spec.eleweak ? 20 : 0, av: MB.av })
      )
    );
  }
  if (!sk || !skReady(p, p, skSt(p.st, sk), sk)) {
    sk = SKILLS.attack;
    k = 'attack';
  }
  if (!charging(p, sk)) payCost(p, p.st, sk);
  const alive = MB.ps.filter(q => q.alive);
  done(
    [
      {
        t: 'msg',
        s: auto ? `${p.name} 時間到，自動攻擊` : ac ? `${p.name} 自動施放・${sk.name}` : `${p.name}：${sk.name}`
      }
    ].concat(
      actResolve(p, p.st, sk, MB.es, tg, alive, {
        allyMul: 1 + ((p.st.allyDmg || 0) * (alive.length - 1)) / 100,
        ew: MB.spec.eleweak ? 20 : 0,
        av: MB.av
      })
    )
  );
}
/* 怪物行動：行動條滿的那一隻敵人結算（共用 enemyResolve） */
function mpEnemy() {
  if (!MB) return;
  const i = MB.ea,
    fx =
      MB.es[i] && MB.es[i].hp > 0 && MB.ps.some(p => p.alive)
        ? enemyResolve(MB.es, i, MB.ps, { ew: MB.spec.eleweak ? 20 : 0, boss: !!MB.boss, av: MB.av })
        : [];
  mpRun(fx, 'E');
}
/* 打倒這層的怪物群：經驗大家平均分，金幣與掉寶各自結算；倒下的隊員以 20% 生命復活，進下一層 */
function mpRoomClear() {
  if (!MB) return;
  MB.lock = true;
  MB.ready = {};
  const info = MB.es.map((e, i) => ({
    name: e.name,
    lv: e.lv,
    rar: e.rar,
    xp: e.xp,
    gold: e.gold,
    mods: e.mods,
    minion: e.minion,
    boss: MB.boss && i === 0
  }));
  ptSend('roomclear', { e: info, n: MB.n });
  mpRoomReward(info, MB.n);
  MB.room++;
  if (MB.room >= MB.floors) {
    MBT = setTimeout(() => {
      ptSend('clear', {});
      mpClear();
    }, 2200);
    return;
  }
  for (const p of MB.ps) {
    if (!p.alive && !MB.spec.norevive) {
      p.alive = true;
      p.hp = Math.round(p.st.maxhp * 0.2);
    }
  }
  MBT = setTimeout(() => {
    if (!MB) return;
    mpSpawn();
    MB.actor = null;
    mpPush([
      { t: 'room' },
      { t: 'msg', s: MB.room === MB.floors - 1 ? '首領出現了！' : `第 ${MB.room + 1}/${MB.floors} 層` }
    ]);
    MBT = setTimeout(mpRound, 1200);
  }, 2400);
}

/* ================= battle (every client) ================= */
function mpEnter(mb) {
  if (mb) MB = mb;
  if (!MB) return;
  closeSheet();
  hideModal();
  simTarget = null;
  MBbg = null;
  MB.loot = [];
  MBFX.pops = [];
  MBFX.fx = [];
  MBFX.en = [];
  MBFX.t0 = performance.now();
  MB.tg = 0;
  $('battle').hidden = false;
  renderMBHud();
  sizeBattle();
  mpBG();
  renderMBHud();
  playSong(MB.boss || (MB.es || []).some(e => e.rar >= 2) ? 'boss' : 'battle');
  sfx('encounter');
  ptPill();
  addLog(`組隊進入${dunName(MB.d)}（Lv${MB.d.lv}，${MB.n} 人）`);
}
function mpBG() {
  if (MB && MB.bg !== MBbg) {
    MBbg = MB.bg;
    paintBG(MB.bg || 'cave');
  }
}
function mpApply(mb, fx) {
  if (mb) {
    const keep = MB ? { loot: MB.loot, sub: MB.sub, sent: MB.sent, tg: MB.tg } : { loot: [] };
    MB = Object.assign(mb, keep);
  }
  /* 0.3.35 各人的剩下時間換成自己裝置的時間；行動條與冷卻在每幀補間（mpLocal） */
  MB.rdl = {};
  for (const u in MB.rl || {}) MB.rdl[u] = Date.now() + MB.rl[u];
  {
    const me = MB.ps.find(p => p.uid === CLOUD.uid);
    MBloc = {
      av: { ...(MB.av || {}) },
      cd: { ...((me && me.cd) || {}) },
      cdMax: (me && me.cdMax) || {},
      t: performance.now()
    };
  }
  const me = MB.ps.find(p => p.uid === CLOUD.uid);
  if (me) {
    S.hp = Math.max(1, me.hp);
    S.mp = me.mp;
  }
  for (const f of fx || []) setTimeout(() => MB && mpFx(f), f.at || 0);
  renderMBHud();
}
/* 播一個事件（跳數字、動畫、音效） */
function mpFx(f) {
  const now_ = performance.now(),
    en = i => MBFX.en[i] || (MBFX.en[i] = {});
  if (MB)
    logEv(f, MB.es, uid => (uid === CLOUD.uid ? '你' : ((MB.ps.find(p => p.uid === uid) || {}).name || '隊員') + ' '));
  if (f.t === 'msg') bmsg(f.s);
  else if (f.t === 'turn') {
    if (f.uid === CLOUD.uid) {
      sfx('select');
      buzz(60);
    }
  } else if (f.t === 'room') {
    mpBG();
    MBFX.en = [];
    MBFX.t0 = now_;
    MB.tg = 0;
    sfx('encounter');
    playSong(MB.boss ? 'boss' : 'battle');
  } else if (f.t === 'hit') {
    en(f.i).flash = now_;
    MBFX.pops.push({ text: f.crit ? f.d + '!' : String(f.d), who: 'E', i: f.i, col: f.col, t: now_ });
    if (f.from && !f.dot && !f.pet) {
      MBFX.lunge[f.from] = now_;
      MBFX.fx.push({
        type: f.fx === 'arrow' ? 'pierce' : f.fx,
        t: now_,
        dur: f.fx === 'fire' || f.fx === 'ice' ? 600 : 300,
        from: f.from,
        i: f.i
      });
    }
    if (f.crit) {
      MBFX.shake = now_;
      sfx('crit');
    } else sfx(f.fx === 'fire' ? 'fire' : f.fx === 'ice' ? 'ice' : 'hit');
  } else if (f.t === 'kill') {
    en(f.i).dying = now_;
    sfx('win');
  } else if (f.t === 'lunge') en(f.i).a = { type: 'lunge', t: now_, dur: 420 };
  else if (f.t === 'dmg') {
    MBFX.hurt[f.who] = now_;
    MBFX.pops.push({ text: String(f.d), who: f.who, col: f.col, t: now_ });
    sfx('hurt');
    if (f.who === CLOUD.uid) {
      MBFX.shake = now_;
      buzz(f.strong ? 120 : 50);
    }
  } else if (f.t === 'heal') {
    MBFX.pops.push({ text: '+' + f.v + (f.mp ? ' MP' : ''), who: f.who, col: f.mp ? '#6ab8ff' : '#7bd36b', t: now_ });
    MBFX.fx.push({ type: 'heal', t: now_, dur: 700, at: f.who });
    sfx('heal');
  } else if (f.t === 'dodge') {
    MBFX.pops.push({ text: '閃避', who: f.who, col: '#d8d2c4', t: now_ });
    sfx('tap');
  } else if (f.t === 'st') {
    MBFX.pops.push({ text: f.s, who: f.who || 'E', i: f.i, col: f.col, t: now_, up: 20 });
  } else if (f.t === 'down') bmsg(f.s || '有隊員倒下了！');
  else if (f.t === 'fx') MBFX.fx.push({ type: f.type, t: now_, dur: 700, at: f.who });
  renderMBHud();
}
/* 自己的行動：隊長直接算，隊員送給隊長；tg 是自己選的目標 */
function mpMy(k) {
  if (!mpMine()) return;
  const me = MB.ps.find(p => p.uid === CLOUD.uid);
  if (!me) return;
  if (k === 'potion' || k === 'ether') {
    const key = k === 'potion' ? 'potions' : 'ethers';
    if (!S[key] || (k === 'potion' && me.st.noPotion)) return;
    S[key]--;
  } else {
    const sk = skByKey(k, me.sks || []);
    if (k === 'mines' ? !(me.mines || []).length : !sk || !skReady(me, me, skSt(me.st, sk), sk)) return;
  }
  const tok = MB.rt[CLOUD.uid];
  MB.sent = tok;
  MB.sub = null;
  sfx('select');
  renderMBHud();
  const tg = MB.tg || 0;
  if (amLeader()) mpOnAct(CLOUD.uid, k, tok, tg);
  else ptSend('act', { uid: CLOUD.uid, k, tok, tg });
}
/* 一層的獎勵：經驗是整群加總後依人數平均，金幣與掉寶各自結算 */
function mpRoomReward(info, n = 1) {
  const list = Array.isArray(info) ? info : [info],
    xp = Math.round((list.reduce((a, e) => a + e.xp, 0) / Math.max(1, n)) * rate('xp'));
  let gold = 0;
  const drops = [];
  for (const e of list) {
    gold += Math.round(e.gold * rnd(0.8, 1.2) * stats().goldMul * rate('gold'));
    drops.push(...dropLoot({ ...e }, e.boss, MB.spec, false, e.minion));
    quest('kill');
  }
  S.gold += gold;
  const up = gainXP(xp);
  MB.loot = (MB.loot || []).concat(drops);
  addLog(
    `組隊擊敗 ${list[0].name}${list.length > 1 ? ` 等 ${list.length} 隻` : ''}，獲得 ${xp} 經驗（${n} 人平分）、${gold} 金幣`
  );
  bmsg(`擊敗！+${xp} 經驗 +${gold} 金幣${drops.length ? `・${drops.length} 樣戰利品` : ''}`);
  sfx('win');
  if (up) setTimeout(() => sfx('level'), 500);
  save();
  renderMBHud();
}
function mpClear() {
  if (!MB) return;
  const d = MB.d,
    rw = dunReward({
      spec: MB.spec,
      lv: d.lv,
      kind: 'dungeon',
      lm: null,
      remote: false,
      onsite: d.onsite && amLeader()
    }),
    loot = MB.loot || [];
  S.cleared[d.id] = hepoch();
  addLog(`組隊攻略${dunName(d)}（Lv${d.lv}）`);
  sfx('level');
  const html = `<p><span style="color:var(--gold)">${rw.gold} 金幣</span>・<span style="color:#9fe7ff">${rw.cry} 魔晶</span></p>${rw.items.map(it => itemCard(it, '首領寶箱')).join('')}<div class="loot">${lootList(
    rw.curs.concat(loot)
  )
    .map(c => `<span>${c}</span>`)
    .join('')}</div>`;
  mpStop();
  const ap = autoPot();
  showModal('組隊攻略完成！', html + ap, [
    {
      label: '返回地圖',
      pri: 1,
      fn: () => {
        hideModal();
        renderHud();
      }
    }
  ]);
}
function mpWipe() {
  if (!MB) return;
  const lost = fl(S.gold * 0.1);
  S.gold -= lost;
  addLog(`組隊全滅，損失 ${lost} 金幣`);
  sfx('lose');
  buzz(300);
  mpStop();
  fullHeal();
  showModal(
    '全隊倒下了……',
    `<p>損失 ${lost} 金幣，狀態已恢復。</p><p class="sub">地獄地城很危險：先把等級和抗性練起來，或找更多隊友。</p>`,
    [
      {
        label: '返回地圖',
        pri: 1,
        fn: () => {
          hideModal();
          renderHud();
        }
      }
    ]
  );
}
function mpEnd(reason) {
  if (!MB) {
    partyLeave(true);
    return;
  }
  mpStop();
  showModal('戰鬥結束', `<p>${esc(reason)}</p>`, [
    {
      label: '返回地圖',
      pri: 1,
      fn: () => {
        hideModal();
        renderHud();
      }
    }
  ]);
}
function mpStop() {
  clearTimeout(MBT);
  clearInterval(MBclk);
  MB = null;
  $('battle').hidden = true;
  $('mpills').innerHTML = '';
  partyLeave(true);
  playSong('field');
  clampHP();
  renderHud();
  save();
}
function mpLeave() {
  showModal('撤退', `<p>離開隊伍後，你的角色會改成自動普攻，直到隊伍打完或全滅。已經拿到的獎勵會保留。</p>`, [
    { label: '取消', fn: hideModal },
    {
      label: '撤退',
      pri: 1,
      fn: () => {
        hideModal();
        if (amLeader()) ptSend('end', { reason: '隊長撤退了，戰鬥中止' });
        mpStop();
      }
    }
  ]);
}

/* ================= battle rendering ================= */
/* 隊員站左邊（最多 4 人，兩排交錯），怪物在右邊 */
function mpPos(i) {
  const p = POS(),
    col = i % 2,
    row = fl(i / 2);
  return { x: BW * (col ? 0.13 : 0.35) - row * 4, y: p.hy - row * 112 - col * 50 };
}
function renderMBHud() {
  if (!MB) return;
  const es = MB.es || [],
    p = POS(),
    me = MB.ps.find(q => q.uid === CLOUD.uid),
    my = mpMine() && me && me.alive;
  if (es.length && (!es[MB.tg || 0] || es[MB.tg || 0].hp <= 0)) MB.tg = Math.max(0, aliveIdx(es)[0] ?? 0);
  const ti = MB.tg || 0,
    e = es[ti];
  $('bname').innerHTML = e
    ? `<span style="color:${RCOL[e.rar || 0]}">${esc(e.name)}</span><small>Lv${e.lv}${MB.boss && ti === 0 ? '・首領' : ''}${e.mods && e.mods.length ? '・' + modNames(e) : ''}</small>`
    : '';
  if (e) placeBName(epos(ti, es, MB.boss));
  {
    /* 0.3.10 行動順序：目前行動的（亮起來）＋隊長算好的接下來 6 次行動 */
    const row = (a, on) => {
      if (a == null) return null;
      const q = MB.ps.find(p => p.uid === a);
      if (q)
        return {
          n: q.name,
          c: a === CLOUD.uid ? 'me' : '',
          on,
          dead: !q.alive,
          img: portrait(heroSpr('F', q.look || '.....'), palFor(q))
        };
      const o = a[0] === 'e' && es[+a.slice(1)];
      return o && o.hp > 0
        ? o.hideAv
          ? { n: '？？？', c: 'e', on, img: iconURL('eye') }
          : { n: shortName(o), c: 'e', on, img: portrait(o.spr, o.pal) }
        : null;
    };
    const cur = row(MB.actor === 'E' ? 'e' + MB.ea : MB.actor || null, true);
    renderOrder([cur, ...(MB.order || []).map(a => row(a, false))].filter(Boolean));
  }
  const big = bossBar(
    MB.boss ? es[0] : es.find(o => (o.rar || 0) >= 3 && o.hp > 0),
    !!(MB.boss && es[0] && es[0].hp > 0)
  );
  $('bname').hidden = big && (ti === 0 || !MB.boss);
  $('eail').innerHTML = '';
  $('hail').innerHTML = '';
  $('epills').innerHTML = enemyBars(es, es.length > 1 ? ti : -1, MB.boss);
  $('hpills').innerHTML = '';
  $('mpills').innerHTML = MB.ps
    .map((q, i) => {
      const ps = mpPos(i);
      const hp = Math.max(0, Math.ceil(q.hp)),
        hr = hp / q.st.maxhp,
        low = q.alive && hr < 0.3;
      return (
        `<div class="mp ${q.uid === MB.actor || (MB.rl && q.uid in MB.rl) ? 'on' : ''} ${q.alive ? '' : 'down'} ${low ? 'low' : ''} ${q.uid === CLOUD.uid ? 'mine' : ''}" style="left:${ps.x}px;top:${ps.y + 8}px"><b>${esc(q.name)}${q.gone ? '（離線）' : q.alive ? '' : '（倒下）'}</b><i class="mh"><i style="width:${hr * 100}%"></i><em>${hp}/${q.st.maxhp}</em></i><i class="mm"><i style="width:${(q.mp / q.st.maxmp) * 100}%"></i><em>${Math.max(0, Math.round(q.mp))}</em></i>${avBar(q.uid)}</div>` +
        `<div class="ailbox" style="left:${ps.x + 5 * (battleSc() - 1)}px;top:${ps.y - 16 * (battleSc() - 1)}px">${heroAilHTML(q)}</div>`
      );
    })
    .join('');
  const sks = (me && me.sks) || mySkills(),
    sk = sks.map((q, i) => q && 's' + i).filter(Boolean),
    dis = my ? '' : 'disabled',
    noPot = me && me.st.noPotion;
  const cb = (label, icon, sub, data, disabled, extra = '') =>
    `<button class="cb ${extra}" data-act="mpAct" ${data} ${disabled || dis}><img src="${iconURL(icon)}" alt="">${label}${sub ? `<small>${sub}</small>` : ''}</button>`;
  const slot = k => {
    const q = sks[+k.slice(1)];
    return cb(
      q.name + cdMask(q),
      q.icon,
      skSub(me ? me.st : stats(), q, me, MB.es, MB.tg || 0),
      `data-k="${k}"`,
      me && skReady(me, me, skSt(me.st, q), q) ? '' : 'disabled'
    );
  };
  /* 0.3.27：左邊兩欄 6 格都是技能；右邊一欄是攻擊、生命／魔力藥水、撤退（有地雷時多一顆「引爆地雷」） */
  const six = [0, 1, 2, 3, 4, 5].map(i =>
      sks[i]
        ? slot('s' + i)
        : `<button class="cb empty" disabled><img src="${iconURL('book')}" alt="">空的技能欄</button>`
    ),
    pot = cb(
      '生命藥水',
      'heart',
      noPot ? '無法使用' : '×' + S.potions,
      'data-k="potion"',
      S.potions && !noPot ? '' : 'disabled'
    ),
    eth = cb('魔力藥水', 'ice', '×' + S.ethers, 'data-k="ether"', S.ethers ? '' : 'disabled'),
    run = `<button class="cb run" data-act="mpQuit"><img src="${iconURL('run')}" alt="">撤退<small>離開隊伍</small></button>`,
    mn = me ? (me.mines || []).length : 0;
  $('bcmd').classList.add('six');
  let html =
    `<div class="mpturn" id="mpTurn"></div>` +
    six[0] +
    six[1] +
    cb('攻擊', 'axe', '', 'data-k="attack"', '', 'atk') +
    six[2] +
    six[3] +
    `<div class="brow2">${pot}${eth}</div>` +
    six[4] +
    six[5] +
    (mn ? `<div class="brow2">${cb('引爆地雷', 'flame', `×${mn}`, 'data-k="mines"', '', 'mine')}${run}</div>` : run);
  if (MB.sub === 'skills' && my)
    html += `<div class="bsub">${sk.map(slot).join('')}<button class="cb" data-act="mpSub" data-k=""><img src="${iconURL('run')}" alt="">返回</button></div>`;
  if (MB.sub === 'items' && my)
    html += `<div class="bsub">${cb('生命藥水', 'heart', noPot ? '昇華代價：無法使用' : '×' + S.potions + '・恢復 40%', 'data-k="potion"', S.potions && !noPot ? '' : 'disabled')}${cb('魔力藥水', 'ice', '×' + S.ethers + '・恢復 50%', 'data-k="ether"', S.ethers ? '' : 'disabled')}<button class="cb" data-act="mpSub" data-k=""><img src="${iconURL('run')}" alt="">返回</button></div>`;
  $('bcmd').innerHTML = html;
  mpTurnBar();
  if (!$('binfo').hidden) binfoRender();
}
let mpTurnT = 0;
function mpTurnBar() {
  const el = $('mpTurn');
  if (!el || !MB) return;
  /* 0.3.35：輪到自己時顯示剩下的秒數，否則顯示誰在行動 */
  const a = MB.actor,
    mine = mpMine(),
    p = mine ? MB.ps.find(q => q.uid === CLOUD.uid) : MB.ps.find(q => q.uid === a),
    left = mine ? Math.max(0, (MB.rdl || {})[CLOUD.uid] - Date.now()) : 0;
  setFloor(`第 ${Math.min(MB.room + 1, MB.floors)}/${MB.floors} 層`);
  /* 倒數條：一開始是滿的，從右往左縮短；輪到自己是金色，剩 5 秒變紅 */
  el.className = `mpturn${mine ? ' mine' : ''}${left && left < 5000 ? ' hurry' : ''}`;
  el.innerHTML = mine
    ? `<i style="width:${(left / TURN_MS) * 100}%"></i><span><b>輪到你了</b></span><span>${Math.ceil(left / 1000)} 秒</span>`
    : a === 'E'
      ? '<span>怪物行動中…</span>'
      : p
        ? `<span>${esc(p.name)} 行動中…</span>`
        : '<span>行動條累積中…</span>';
  $('bstat').hidden = true;
}
/* 0.3.35 每幀補間：沒在播結算時，行動條照速度往前、自己的冷卻往下數（下一次 state 會校正） */
function mpLocal() {
  if (!MB || !MBloc) return;
  const now = performance.now(),
    dt = Math.min(0.25, (now - MBloc.t) / 1000);
  MBloc.t = now;
  if (MB.lock) return;
  for (const u of mpUnits()) {
    const pl = MB.ps.some(p => p.uid === u.id);
    MBloc.av[u.id] = Math.min(pl ? AV_MAX : AV_MAX * 2, (MBloc.av[u.id] || 0) + u.spd * ATB_K * dt);
  }
  for (const k in MBloc.cd) if ((MBloc.cd[k] -= dt) <= 0) delete MBloc.cd[k];
}
function renderMB(t) {
  mpLocal();
  if (MBloc) atbPaint(MBloc.av, MBloc);
  const c = bctx,
    now_ = performance.now(),
    p = POS();
  if (now_ - mpTurnT > 250) {
    mpTurnT = now_;
    mpTurnBar();
  }
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  c.clearRect(0, 0, BW, BH);
  c.imageSmoothingEnabled = false;
  let sx = 0,
    sy = 0;
  if (now_ - MBFX.shake < 260) {
    const k = 1 - (now_ - MBFX.shake) / 260;
    sx = rnd(-5, 5) * k;
    sy = rnd(-4, 4) * k;
  }
  c.save();
  c.translate(sx, sy);
  const sc = battleSc(),
    es = MB.es || [];
  drawEnemies(c, t, es, MB.boss, MBFX.en, MB.tg || 0);
  const hs = sc - 1,
    where = {};
  MB.ps.forEach((q, i) => {
    const ps = mpPos(i),
      lu = MBFX.lunge[q.uid],
      hu = MBFX.hurt[q.uid];
    let ox = 0;
    if (lu && now_ - lu < 380) ox = Math.sin((Math.PI * (now_ - lu)) / 380) * BW * 0.18;
    if (hu && now_ - hu < 320) ox += -8 * Math.sin((now_ - hu) / 16) * (1 - (now_ - hu) / 320);
    where[q.uid] = { x: ps.x, y: ps.y };
    if (q.uid === MB.actor) glow(c, ps.x, ps.y - 6 * hs, 12 * hs, '242,193,78', 0.35 + 0.15 * Math.sin(t / 200));
    c.fillStyle = 'rgba(0,0,0,.3)';
    c.beginPath();
    c.ellipse(ps.x, ps.y + 2, hs * 6, hs * 1.4, 0, 0, 6.28);
    c.fill();
    c.globalAlpha = q.alive ? 1 : 0.35;
    drawPets(c, t, q.pets, ps.x, ps.y, hs);
    drawWeapon(c, q.wep || 'sword', ps.x + ox, ps.y + Math.sin(t / 320 + i) * 1.5, hs, palFor(q).W);
    drawSpr(c, heroSpr('S', q.look || '.....'), palFor(q), ps.x + ox, ps.y + Math.sin(t / 320 + i) * 1.5, hs, true);
    c.globalAlpha = 1;
  });
  for (let i = MBFX.fx.length - 1; i >= 0; i--) {
    const f = MBFX.fx[i],
      q = (now_ - f.t) / f.dur;
    if (q >= 1) {
      MBFX.fx.splice(i, 1);
      continue;
    }
    const w = where[f.from || f.at] || { x: p.hx, y: p.y },
      tq = f.i != null && es[f.i] ? epos(f.i, es, MB.boss) : { x: p.ex, y: p.y };
    drawFx(c, f, q, { hx: w.x, ex: tq.x, y: tq.y, hy: w.y }, hs);
  }
  c.font = 'bold 22px DotGothic16, sans-serif';
  c.textAlign = 'center';
  for (let i = MBFX.pops.length - 1; i >= 0; i--) {
    const q = MBFX.pops[i],
      k = (now_ - q.t) / 1000;
    if (k >= 1) {
      MBFX.pops.splice(i, 1);
      continue;
    }
    let w;
    if (q.who === 'E') {
      const eq = es[q.i || 0] ? epos(q.i || 0, es, MB.boss) : { x: p.ex, y: p.y, s: sc };
      w = { x: eq.x, y: etop(eq) + 24 };
    } else w = where[q.who] ? { x: where[q.who].x, y: where[q.who].y - 70 } : { x: p.hx, y: p.y - 70 };
    const y = w.y - (q.up || 0) - k * 30;
    c.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
    c.lineWidth = 4;
    c.strokeStyle = '#000';
    c.strokeText(q.text, w.x, y);
    c.fillStyle = q.col;
    c.fillText(q.text, w.x, y);
    c.globalAlpha = 1;
  }
  c.restore();
  const intro = (now_ - MBFX.t0) / 450;
  if (intro < 1) {
    c.fillStyle = `rgba(255,255,255,${1 - intro})`;
    c.fillRect(0, 0, BW, BH);
  }
}
window.addEventListener('resize', () => {
  if (MB && !$('battle').hidden) {
    sizeBattle();
    MBbg = null;
    mpBG();
    renderMBHud();
  }
});
window.addEventListener('beforeunload', () => {
  if (PT) partyLeave(true);
});
