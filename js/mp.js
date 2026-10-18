/* 漫步勇者 · 組隊與多人地城戰鬥（Supabase Realtime 廣播，隊長的裝置負責計算） */
'use strict';
/* 流程：隊長在地城按「組隊進入」→ 拿到 6 碼代碼 → 好友用邀請或代碼加入 → 隊長開始。
   每回合依速度排順序，輪到的人有 15 秒；時間到自動普攻，換下一個人。怪物在每輪最後行動。
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
    st: {
      maxhp: st.maxhp,
      maxmp: st.maxmp,
      armor: st.armor,
      res: [st.res.fire, st.res.cold, st.res.light],
      physLo: st.physLo,
      physHi: st.physHi,
      fire: st.fire,
      cold: st.cold,
      light: st.light,
      spell: st.spell,
      crit: st.crit,
      critMulti: st.critMulti,
      leech: st.leech,
      speed: st.speed,
      regen: st.regen,
      dodge: st.dodge,
      elm: st.elm,
      mpCost: st.mpCost,
      blood: st.blood,
      mom: st.mom,
      lowLife: st.lowLife,
      healMul: st.healMul,
      manaRegen: st.manaRegen,
      poisonCh: st.poisonCh,
      poisonMul: st.poisonMul,
      ail: st.ail,
      dbl: st.dbl,
      noFreeze: st.noFreeze
    }
  };
}
const palFor = cls => ({
  h: '#6b3324',
  s: '#f1c27d',
  e: '#1a1626',
  c: (CLASSES[cls] || CLASSES.novice).color,
  a: shade((CLASSES[cls] || CLASSES.novice).color, -0.35),
  b: '#d9a441',
  l: '#3b3550',
  f: '#5a3a26'
});

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
    dun: { id: e.id, kind: 'dungeon', dt: e.dt, mods: e.mods, lv: e.lv, lat: e.lat, lng: e.lng, name: e.name },
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
        mpPush([{ t: 'msg', s: `${p.name} 斷線了，之後的回合自動普攻` }]);
        if (MB.actor === uid) mpArm(1500);
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
    } else if (ev === 'act') mpOnAct(p.uid, p.k, p.tok);
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
    if (MB) mpRoomReward(p.e);
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
    <h3>大廳・隊員 ${mem.length}/${ptMax()}・準備 ${mem.filter(m => m.ready).length}/${mem.length}</h3>${mem.map(m => `<div class="card"><div class="rowx"><div class="t"><b>${esc(m.name)}${m.uid === PT.leader ? ' <span style="color:var(--gold)">隊長</span>' : ''}${m.uid === CLOUD.uid ? ' <span class="sub">（你）</span>' : ''}</b><small><span style="color:${(CLASSES[m.cls] || CLASSES.novice).color}">${(CLASSES[m.cls] || CLASSES.novice).name}</span> Lv${m.lv}・生命 ${m.st.maxhp}・速度 ${m.st.speed}</small></div><span class="rdy ${m.ready ? 'ok' : ''}">${m.ready ? '✓ 準備好了' : '準備中…'}</span></div></div>`).join('')}`;
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
  MBbg = null;
const MBFX = { pops: [], fx: [], shake: 0, hurt: {}, lunge: {}, en: { flash: 0, dying: 0 }, t0: 0 };
/* 廣播用的狀態：去掉只屬於自己的欄位（戰利品、選單、已送出的回合） */
const pub = () => {
  const o = { ...MB };
  delete o.loot;
  delete o.sub;
  delete o.sent;
  delete o.dl;
  return JSON.parse(JSON.stringify(o));
};
function mpPush(fx) {
  if (!MB) return;
  MB.left = MB.dl ? Math.max(0, MB.dl - Date.now()) : 0;
  ptSend('state', { mb: pub(), fx: fx || [] });
  mpApply(null, fx || []);
}
function mpArm(ms) {
  clearTimeout(MBT);
  const tok = MB.tok,
    uid = MB.actor;
  MB.dl = Date.now() + ms;
  MBT = setTimeout(() => {
    if (MB && MB.tok === tok && MB.actor === uid) mpResolve(uid, 'attack', true);
  }, ms);
}
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
  PT.started = true;
  ptLobby();
  const seed = h(fl(d.lat * 1e4), fl(d.lng * 1e4), epoch()),
    spec = dunSpec(d);
  MB = {
    spec,
    d: { id: d.id, kind: 'dungeon', dt: d.dt, mods: d.mods, lv: d.lv, lat: d.lat, lng: d.lng, seed, spec, lm: null },
    room: 0,
    floors: spec.floors,
    n: mem.length,
    round: 0,
    tok: 0,
    ti: -1,
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
      alive: true,
      gone: false,
      guard: 0,
      frozen: 0
    })),
    es: {}
  };
  mpSpawn();
  ptSend('start', { mb: pub() });
  mpEnter(null);
  setTimeout(mpRound, 900);
}
function mpSpawn() {
  const { e, bg, boss } = dunEnemy(MB.d, MB.room),
    n = MB.n;
  e.maxhp = Math.round(e.maxhp * (1 + 0.65 * (n - 1)));
  e.atk = Math.round(e.atk * (1 + 0.08 * (n - 1)));
  e.hp = e.maxhp;
  MB.e = e;
  MB.bg = bg;
  MB.boss = boss;
  MB.es = { poison: 0, burn: 0, burnDmg: 0, shock: 0, frozen: 0 };
}
function mpRound() {
  if (!MB) return;
  MB.round++;
  MB.order = MB.ps
    .filter(p => p.alive)
    .sort((a, b) => b.st.speed - a.st.speed)
    .map(p => p.uid);
  MB.order.push('E');
  MB.ti = -1;
  mpNext();
}
function mpNext() {
  if (!MB) return;
  MB.ti++;
  if (MB.ti >= MB.order.length) {
    mpEndRound();
    return mpRound();
  }
  const a = MB.order[MB.ti];
  MB.tok++;
  if (a === 'E') {
    MB.actor = 'E';
    MB.dl = 0;
    mpPush();
    clearTimeout(MBT);
    MBT = setTimeout(mpEnemy, 850);
    return;
  }
  const p = MB.ps.find(q => q.uid === a);
  if (!p || !p.alive) return mpNext();
  if (p.frozen) {
    p.frozen = 0;
    MB.actor = a;
    MB.dl = 0;
    mpPush([{ t: 'msg', s: `${p.name} 被凍住了，跳過這回合` }]);
    clearTimeout(MBT);
    MBT = setTimeout(mpNext, 1100);
    return;
  }
  MB.actor = a;
  mpArm(p.gone ? 1500 : TURN_MS);
  mpPush([{ t: 'turn', uid: a }]);
}
function mpEndRound() {
  for (const p of MB.ps) {
    if (!p.alive) continue;
    if (p.st.regen) p.hp = Math.min(p.st.maxhp, p.hp + p.st.regen);
    if (p.st.manaRegen) p.mp = Math.min(p.st.maxmp, p.mp + p.st.manaRegen);
    if (p.guard > 0) p.guard--;
  }
}
function mpOnAct(uid, k, tok) {
  if (!MB || MB.actor !== uid || tok !== MB.tok) return;
  clearTimeout(MBT);
  mpResolve(uid, k, false);
}
/* 一位玩家的行動 */
function mpResolve(uid, k, auto) {
  const p = MB.ps.find(q => q.uid === uid),
    e = MB.e,
    fx = [],
    ES = MB.es;
  if (!p || !e) return;
  MB.tok++;
  MB.actor = null;
  MB.dl = 0;
  let sk = SKILLS[k];
  if (k === 'potion' || k === 'ether') {
    const hm = p.st.healMul || 1,
      v = k === 'potion' ? Math.round(p.st.maxhp * 0.4 * hm) : Math.round(p.st.maxmp * 0.5 * hm);
    if (k === 'potion') p.hp = Math.min(p.st.maxhp, p.hp + v);
    else p.mp = Math.min(p.st.maxmp, p.mp + v);
    fx.push(
      { t: 'msg', s: `${p.name} 使用${k === 'potion' ? '生命' : '魔力'}藥水` },
      { t: 'heal', uid, v, mp: k === 'ether' }
    );
    mpPush(fx);
    MBT = setTimeout(mpNext, 900);
    return;
  }
  if (!sk || !(CLASSES[p.cls] || CLASSES.novice).skills.includes(k) || !canPay(p, p.st, sk)) {
    sk = SKILLS.attack;
    k = 'attack';
  }
  payCost(p, p.st, sk);
  fx.push({ t: 'msg', s: auto ? `${p.name} 時間到，自動攻擊` : `${p.name}：${sk.name}` });
  if (sk.kind === 'heal') {
    const tg = MB.ps.filter(q => q.alive).sort((a, b) => a.hp / a.st.maxhp - b.hp / b.st.maxhp)[0],
      v = Math.round(tg.st.maxhp * 0.35 * (p.st.healMul || 1));
    tg.hp = Math.min(tg.st.maxhp, tg.hp + v);
    fx.push({ t: 'heal', uid: tg.uid, from: uid, v });
  } else {
    const hits = (sk.hits || 1) + extraHit(p.st, sk);
    for (let n = 0; n < hits && e.hp > 0; n++) {
      const st = p.st,
        pk = heroPacket(st, sk, sk.mult);
      const { d, crit } = heroDmg(st, pk, e, ES.shock > 0, p);
      e.hp = Math.max(0, e.hp - d);
      const col =
        pk.fire > pk.cold && pk.fire > pk.light && pk.fire > pk.phys * 0.5
          ? '#ffb15a'
          : pk.cold > pk.phys * 0.5 && pk.cold > pk.light
            ? '#9fe7ff'
            : pk.light > pk.phys * 0.5
              ? '#fff27a'
              : '#ffffff';
      fx.push({
        t: 'hit',
        from: uid,
        d,
        crit,
        col,
        fx:
          sk.kind === 'spell'
            ? sk.fx
            : sk.fx === 'whirl'
              ? 'whirl'
              : sk.fx === 'arrow' || p.cls === 'ranger'
                ? 'arrow'
                : 'slash'
      });
      if (st.leech && d > 0) p.hp = Math.min(st.maxhp, p.hp + Math.max(1, Math.round((d * st.leech) / 100)));
      if (e.hp > 0) heroAil(st, sk, pk, ES).forEach(([s, col]) => fx.push({ t: 'st', s, col }));
      if (e.mods.includes('reflect')) {
        const r = Math.max(1, Math.round(d * 0.15));
        p.hp = Math.max(1, p.hp - r);
        fx.push({ t: 'dmg', uid, d: r, col: '#ff8a8a' });
      }
    }
    if (sk.guard) {
      p.guard = sk.guard;
      fx.push({ t: 'st', uid, s: '護甲↑', col: '#9fd4ef' });
    }
    if (sk.poison && e.hp > 0) {
      ES.poison = sk.poison;
      ES.pMul = p.st.poisonMul || 1;
      fx.push({ t: 'st', s: '中毒', col: '#9be36b' });
    }
  }
  mpPush(fx);
  clearTimeout(MBT);
  MBT = setTimeout(
    () => {
      if (!MB) return;
      if (MB.e.hp <= 0) mpRoomClear();
      else mpNext();
    },
    700 + (sk.hits || 1) * 350
  );
}
/* 怪物行動：先結算中毒、燃燒，再隨機打一位活著的隊員 */
function mpEnemy() {
  if (!MB) return;
  const e = MB.e,
    ES = MB.es,
    fx = [];
  if (ES.poison > 0) {
    const d = poisonTick(e, ES);
    e.hp = Math.max(0, e.hp - d);
    fx.push({ t: 'hit', d, col: '#9be36b', dot: 1 });
    ES.poison--;
  }
  if (ES.burn > 0) {
    e.hp = Math.max(0, e.hp - ES.burnDmg);
    fx.push({ t: 'hit', d: ES.burnDmg, col: '#ffb15a', dot: 1 });
    ES.burn--;
  }
  if (ES.shock > 0) ES.shock--;
  if (e.hp <= 0) {
    mpPush(fx);
    MBT = setTimeout(mpRoomClear, 700);
    return;
  }
  if (ES.frozen) {
    ES.frozen = 0;
    fx.push({ t: 'msg', s: `${e.name} 被凍住，無法行動` });
    mpPush(fx);
    MBT = setTimeout(mpNext, 1000);
    return;
  }
  const acts = e.mods.includes('swift') && Math.random() < 0.35 ? 2 : 1,
    ew = MB.spec.eleweak ? 20 : 0;
  for (let n = 0; n < acts; n++) {
    const alive = MB.ps.filter(p => p.alive);
    if (!alive.length) break;
    const p = alive[fl(Math.random() * alive.length)],
      strong = Math.random() < 0.15;
    fx.push({ t: 'msg', s: strong ? `${e.name} 的猛力一擊！` : `${e.name} 攻擊 ${p.name}` });
    if (Math.random() * 100 < p.st.dodge) {
      fx.push({ t: 'dodge', uid: p.uid });
      continue;
    }
    let atk = e.atk * (strong ? 1.5 : 1) * rnd(0.9, 1.1);
    if (e.mods.includes('fury') && e.hp < e.maxhp / 2) atk *= 1.5;
    const pk = { phys: 0, fire: 0, cold: 0, light: 0 };
    pk[e.el] += atk;
    if (e.mods.includes('fire')) pk.fire += atk * 0.4;
    if (e.mods.includes('cold')) pk.cold += atk * 0.4;
    if (e.mods.includes('shock')) pk.light += atk * 0.4;
    const d = Math.round(
      mitigate(
        pk,
        p.st.armor * (p.guard > 0 ? 2 : 1),
        p.st.res.map(v => v - ew),
        false
      )
    );
    takeDmg(p, p.st, d);
    fx.push({
      t: 'dmg',
      uid: p.uid,
      d,
      strong,
      col: pk.fire > pk.phys ? '#ffb15a' : pk.cold > pk.phys ? '#9fe7ff' : pk.light > pk.phys ? '#fff27a' : '#ff8a8a'
    });
    if (e.mods.includes('leech')) {
      const hl = Math.round(d * 0.15);
      if (hl > 0) e.hp = Math.min(e.maxhp, e.hp + hl);
    }
    if (pk.cold > 0 && !p.st.noFreeze && Math.random() < 0.12 && p.hp > 0) {
      p.frozen = 1;
      fx.push({ t: 'st', uid: p.uid, s: '凍結', col: '#9fe7ff' });
    }
    if (p.hp <= 0) {
      p.alive = false;
      fx.push({ t: 'msg', s: `${p.name} 倒下了！` });
    }
  }
  mpPush(fx);
  clearTimeout(MBT);
  MBT = setTimeout(
    () => {
      if (!MB) return;
      if (!MB.ps.some(p => p.alive)) {
        ptSend('wipe', {});
        mpWipe();
      } else mpNext();
    },
    900 + acts * 300
  );
}
/* 打倒這層的怪物：大家各自領獎，倒下的隊員以 20% 生命復活，進下一層 */
function mpRoomClear() {
  if (!MB) return;
  const e = MB.e,
    info = { name: e.name, lv: e.lv, rar: e.rar, xp: e.xp, gold: e.gold, boss: MB.boss };
  ptSend('roomclear', { e: info });
  mpRoomReward(info);
  MB.room++;
  if (MB.room >= MB.floors) {
    MBT = setTimeout(() => {
      ptSend('clear', {});
      mpClear();
    }, 2200);
    return;
  }
  for (const p of MB.ps) {
    if (!p.alive) {
      p.alive = true;
      p.hp = Math.round(p.st.maxhp * 0.2);
    } else if (!MB.spec.noregen) {
      p.hp = Math.min(p.st.maxhp, p.hp + Math.round(p.st.maxhp * 0.15));
      p.mp = Math.min(p.st.maxmp, p.mp + Math.round(p.st.maxmp * 0.15));
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
  MBFX.en = { flash: 0, dying: 0 };
  MBFX.t0 = performance.now();
  $('battle').hidden = false;
  renderMBHud();
  sizeBattle();
  mpBG();
  renderMBHud();
  playSong(MB.boss || (MB.e && MB.e.rar >= 2) ? 'boss' : 'battle');
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
    const keep = MB ? { loot: MB.loot, sub: MB.sub, sent: MB.sent } : { loot: [] };
    MB = Object.assign(mb, keep);
    MB.dl = MB.left ? Date.now() + MB.left : 0;
  }
  const me = MB.ps.find(p => p.uid === CLOUD.uid);
  if (me) {
    S.hp = Math.max(1, me.hp);
    S.mp = me.mp;
  }
  const now_ = performance.now();
  for (const f of fx || []) {
    if (f.t === 'msg') bmsg(f.s);
    else if (f.t === 'turn') {
      if (f.uid === CLOUD.uid) {
        sfx('select');
        buzz(60);
      }
    } else if (f.t === 'room') {
      mpBG();
      MBFX.en = { flash: 0, dying: 0 };
      MBFX.t0 = now_;
      sfx('encounter');
      playSong(MB.boss ? 'boss' : 'battle');
    } else if (f.t === 'hit') {
      MBFX.en.flash = now_;
      MBFX.pops.push({ text: f.crit ? f.d + '!' : String(f.d), who: 'E', col: f.crit ? '#ffd166' : f.col, t: now_ });
      if (f.from) {
        MBFX.lunge[f.from] = now_;
        MBFX.fx.push({
          type: f.fx === 'arrow' ? 'pierce' : f.fx,
          t: now_,
          dur: f.fx === 'fire' || f.fx === 'ice' ? 600 : 300,
          from: f.from
        });
      }
      if (f.crit) {
        MBFX.shake = now_;
        sfx('crit');
      } else sfx(f.fx === 'fire' ? 'fire' : f.fx === 'ice' ? 'ice' : 'hit');
      if (MB.e.hp <= 0) MBFX.en.dying = now_;
    } else if (f.t === 'dmg') {
      MBFX.hurt[f.uid] = now_;
      MBFX.pops.push({ text: String(f.d), who: f.uid, col: f.col, t: now_ });
      sfx('hurt');
      if (f.uid === CLOUD.uid) {
        MBFX.shake = now_;
        buzz(f.strong ? 120 : 50);
      }
    } else if (f.t === 'heal') {
      MBFX.pops.push({ text: '+' + f.v + (f.mp ? ' MP' : ''), who: f.uid, col: f.mp ? '#6ab8ff' : '#7bd36b', t: now_ });
      MBFX.fx.push({ type: 'heal', t: now_, dur: 700, at: f.uid });
      sfx('heal');
    } else if (f.t === 'dodge') {
      MBFX.pops.push({ text: '閃避', who: f.uid, col: '#d8d2c4', t: now_ });
      sfx('tap');
    } else if (f.t === 'st') {
      MBFX.pops.push({ text: f.s, who: f.uid || 'E', col: f.col, t: now_, up: 20 });
    }
  }
  renderMBHud();
}
/* 自己的行動：隊長直接算，隊員送給隊長 */
function mpMy(k) {
  if (!MB || MB.actor !== CLOUD.uid || MB.sent === MB.tok) return;
  const me = MB.ps.find(p => p.uid === CLOUD.uid);
  if (!me) return;
  if (k === 'potion' || k === 'ether') {
    const key = k === 'potion' ? 'potions' : 'ethers';
    if (!S[key]) return;
    S[key]--;
  } else if (SKILLS[k] && !canPay(me, me.st, SKILLS[k])) return;
  MB.sent = MB.tok;
  MB.sub = null;
  sfx('select');
  renderMBHud();
  if (amLeader()) mpOnAct(CLOUD.uid, k, MB.tok);
  else ptSend('act', { uid: CLOUD.uid, k, tok: MB.tok });
}
function mpRoomReward(info) {
  const e = { ...info },
    xp = e.xp,
    gold = Math.round(e.gold * rnd(0.8, 1.2) * stats().goldMul);
  S.gold += gold;
  const up = gainXP(xp),
    drops = dropLoot(e, e.boss, MB.spec, false);
  MB.loot = (MB.loot || []).concat(drops);
  addLog(`組隊擊敗 ${e.name} Lv${e.lv}，獲得 ${xp} 經驗、${gold} 金幣`);
  bmsg(`擊敗 ${e.name}！+${xp} 經驗 +${gold} 金幣${drops.length ? `・${drops.length} 樣戰利品` : ''}`);
  sfx('win');
  if (up) setTimeout(() => sfx('level'), 500);
  save();
  renderMBHud();
}
function mpClear() {
  if (!MB) return;
  const d = MB.d,
    rw = dunReward({ spec: MB.spec, lv: d.lv, kind: 'dungeon', lm: null, remote: false }),
    loot = MB.loot || [];
  S.cleared[d.id] = epoch();
  addLog(`組隊攻略${dunName(d)}（Lv${d.lv}）`);
  sfx('level');
  const html = `<p><span style="color:var(--gold)">${rw.gold} 金幣</span>・<span style="color:#9fe7ff">${rw.cry} 魔晶</span></p>${rw.items.map(it => itemCard(it, '首領寶箱')).join('')}<div class="loot">${rw.curs
    .concat(loot)
    .map(c => `<span>${c}</span>`)
    .join('')}</div>`;
  mpStop();
  showModal('組隊攻略完成！', html, [
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
  return { x: BW * (col ? 0.15 : 0.3) - row * 4, y: p.y - row * 58 - col * 30 };
}
function renderMBHud() {
  if (!MB) return;
  const e = MB.e,
    p = POS(),
    me = MB.ps.find(q => q.uid === CLOUD.uid),
    my = MB.actor === CLOUD.uid && MB.sent !== MB.tok && me && me.alive;
  $('bname').innerHTML = e
    ? `<span style="color:${RCOL[e.rar || 0]}">${esc(e.name)}</span><small>等級 ${e.lv}${MB.boss ? '・首領' : ''}${e.mods && e.mods.length ? '・' + modNames(e) : ''}</small>`
    : '';
  const ep = $('epills');
  ep.style.left = p.ex + 'px';
  ep.style.top = p.y + 14 + 'px';
  ep.innerHTML = e
    ? `<div class="bp hp"><i style="width:${Math.max(0, (e.hp / e.maxhp) * 100)}%"></i><span>${Math.ceil(e.hp).toLocaleString()}</span></div>`
    : '';
  $('hpills').innerHTML = '';
  $('mpills').innerHTML = MB.ps
    .map((q, i) => {
      const ps = mpPos(i);
      return `<div class="mp ${q.uid === MB.actor ? 'on' : ''} ${q.alive ? '' : 'down'}" style="left:${ps.x}px;top:${ps.y + 10}px"><b>${esc(q.name)}${q.gone ? '（離線）' : ''}</b><i class="mh"><i style="width:${(q.hp / q.st.maxhp) * 100}%"></i></i><i class="mm"><i style="width:${(q.mp / q.st.maxmp) * 100}%"></i></i></div>`;
    })
    .join('');
  const c = CLASSES[(me && me.cls) || S.cls],
    sk = c.skills.filter(k => k !== 'attack'),
    dis = my ? '' : 'disabled';
  const cb = (label, icon, sub, data, disabled, extra = '') =>
    `<button class="cb ${extra}" data-act="mpAct" ${data} ${disabled || dis}><img src="${iconURL(icon)}" alt="">${label}${sub ? `<small>${sub}</small>` : ''}</button>`;
  const slot = k =>
    cb(
      SKILLS[k].name,
      SKILLS[k].icon,
      costTxt(me ? me.st : stats(), SKILLS[k]),
      `data-k="${k}"`,
      me && canPay(me, me.st, SKILLS[k]) ? '' : 'disabled'
    );
  let html =
    `<div class="mpturn" id="mpTurn"></div>` +
    (sk[0] ? slot(sk[0]) : cb('生命藥水', 'heart', '×' + S.potions, 'data-k="potion"', S.potions ? '' : 'disabled')) +
    cb('攻擊', 'axe', '', 'data-k="attack"', '') +
    (sk[1] ? slot(sk[1]) : cb('魔力藥水', 'ice', '×' + S.ethers, 'data-k="ether"', S.ethers ? '' : 'disabled')) +
    `<button class="cb" data-act="mpSub" data-k="skills" ${dis}><img src="${iconURL('book')}" alt="">技能</button><button class="cb run" data-act="mpQuit"><img src="${iconURL('run')}" alt="">撤退<small>離開隊伍</small></button><button class="cb" data-act="mpSub" data-k="items" ${dis}><img src="${iconURL('bag')}" alt="">物品</button>`;
  if (MB.sub === 'skills' && my)
    html += `<div class="bsub">${c.skills.map(k => (SKILLS[k].mp ? slot(k) : cb(SKILLS[k].name, SKILLS[k].icon, '', `data-k="${k}"`, ''))).join('')}<button class="cb" data-act="mpSub" data-k=""><img src="${iconURL('run')}" alt="">返回</button></div>`;
  if (MB.sub === 'items' && my)
    html += `<div class="bsub">${cb('生命藥水', 'heart', '×' + S.potions + '・恢復 40%', 'data-k="potion"', S.potions ? '' : 'disabled')}${cb('魔力藥水', 'ice', '×' + S.ethers + '・恢復 50%', 'data-k="ether"', S.ethers ? '' : 'disabled')}<button class="cb" data-act="mpSub" data-k=""><img src="${iconURL('run')}" alt="">返回</button></div>`;
  $('bcmd').innerHTML = html;
  mpTurnBar();
}
let mpTurnT = 0;
function mpTurnBar() {
  const el = $('mpTurn');
  if (!el || !MB) return;
  const a = MB.actor,
    p = MB.ps.find(q => q.uid === a),
    left = MB.dl ? Math.max(0, MB.dl - Date.now()) : 0,
    fl_ = `第 ${Math.min(MB.room + 1, MB.floors)}/${MB.floors} 層`;
  el.innerHTML =
    a === 'E'
      ? `<span>${fl_}・怪物行動中</span>`
      : p
        ? `<span>${fl_}・${p.uid === CLOUD.uid ? '<b style="color:var(--gold)">輪到你了</b>' : `輪到 ${esc(p.name)}`}</span><span>${Math.ceil(left / 1000)} 秒</span><i style="width:${(left / TURN_MS) * 100}%"></i>`
        : `<span>${fl_}</span>`;
  $('bstat').textContent = [
    MB.es.poison ? `中毒 ${MB.es.poison}` : '',
    MB.es.burn ? `燃燒 ${MB.es.burn}` : '',
    MB.es.shock ? `感電 ${MB.es.shock}` : '',
    MB.es.frozen ? '凍結' : ''
  ]
    .filter(Boolean)
    .join('・');
  $('bstat').hidden = !$('bstat').textContent;
}
function renderMB(t) {
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
  const sc = Math.max(3, Math.min(6, Math.round(BW / 90))),
    e = MB.e,
    es = MB.boss ? sc + 2 : sc + 1;
  if (e && (!MBFX.en.dying || now_ - MBFX.en.dying < 850)) {
    const alpha = MBFX.en.dying ? 1 - (now_ - MBFX.en.dying) / 850 : 1;
    if (e.rar) glow(c, p.ex, p.y - 8 * es, (e.rar >= 2 ? 16 : 12) * es, RGLOW[e.rar], 0.35 + 0.12 * Math.sin(t / 300));
    c.fillStyle = 'rgba(0,0,0,.3)';
    c.beginPath();
    c.ellipse(p.ex, p.y + 2, es * 6.5, es * 1.5, 0, 0, 6.28);
    c.fill();
    c.globalAlpha = Math.max(0, alpha);
    const fl2 = now_ - MBFX.en.flash < 120;
    drawSpr(
      c,
      e.spr,
      e.pal,
      p.ex + (fl2 ? rnd(-3, 3) : 0),
      p.y + Math.sin(t / 260) * 2,
      es,
      e.spr === 'boar' || e.spr === 'wolf',
      fl2
    );
    c.globalAlpha = 1;
  }
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
    drawSpr(c, 'heroS', palFor(q.cls), ps.x + ox, ps.y + Math.sin(t / 320 + i) * 1.5, hs, true);
    c.globalAlpha = 1;
  });
  for (let i = MBFX.fx.length - 1; i >= 0; i--) {
    const f = MBFX.fx[i],
      q = (now_ - f.t) / f.dur;
    if (q >= 1) {
      MBFX.fx.splice(i, 1);
      continue;
    }
    const w = where[f.from || f.at] || { x: p.hx, y: p.y };
    drawFx(c, f, q, { hx: w.x, ex: p.ex, y: f.type === 'heal' ? w.y : p.y }, hs);
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
    const w =
      q.who === 'E'
        ? { x: p.ex, y: p.y - 60 }
        : where[q.who]
          ? { x: where[q.who].x, y: where[q.who].y - 70 }
          : { x: p.hx, y: p.y - 70 };
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
