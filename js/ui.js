/* 漫步勇者 · HUD、底部面板、互動、據點、動作表 */
'use strict';
/* ================= HUD & sheets ================= */
function renderHud() {
  clampHP();
  const st = stats();
  $('hpb').style.width = (S.hp / st.maxhp) * 100 + '%';
  $('mpb').style.width = (S.mp / st.maxmp) * 100 + '%';
  $('lvTag').textContent = 'Lv' + S.lv;
  $('gold').innerHTML = `<span style="color:var(--gold)">●</span> ${S.gold}`;
  $('cry').innerHTML = `<span style="color:#9fe7ff">◆</span> ${S.crystal}`;
  const a = $('ava').getContext('2d');
  a.clearRect(0, 0, 18, 18);
  a.drawImage(sprite('heroF', heroPal()), 0, 0);
  $('ptDot').hidden = treePts() <= 0;
}
let toastT;
function toast(t) {
  const el = $('toast');
  el.textContent = t;
  el.style.opacity = 1;
  clearTimeout(toastT);
  toastT = setTimeout(() => (el.style.opacity = 0), 2400);
}
function openSheet(name, title) {
  sheetName = name;
  $('stitle').textContent = title || TITLES[name];
  $('scrim').hidden = false;
  $('sheet').classList.remove('off');
  renderSheet();
}
function closeSheet() {
  sheetName = null;
  $('scrim').hidden = true;
  $('sheet').classList.add('off');
}
const TITLES = {
  hero: '角色',
  bag: '背包',
  item: '裝備',
  tree: '天賦樹',
  base: '據點',
  near: '附近',
  settings: '設定',
  log: '冒險日誌',
  friends: '好友',
  party: '組隊'
};
/* 底部導覽：群組按鈕點了往上展開 2～3 個功能，再點一次或點地圖就收起來 */
const NAVG = {
  adv: [
    ['near', '附近', 'eye'],
    ['base', '據點', 'castle'],
    ['log', '冒險日誌', 'book']
  ],
  soc: [
    ['party', '組隊', 'party'],
    ['friends', '好友', 'heart'],
    ['ptcode', '輸入隊伍代碼', 'key']
  ],
  me: [
    ['hero', '角色', 'shield'],
    ['tree', '天賦樹', 'star']
  ]
};
let navG = null;
function navClose() {
  if (!navG) return;
  navG = null;
  $('npop').hidden = true;
  document.querySelectorAll('#nav [data-g]').forEach(b => {
    b.classList.remove('open');
    b.setAttribute('aria-expanded', 'false');
  });
}
function navOpen(g) {
  if (navG === g) {
    navClose();
    return;
  }
  navClose();
  const btn = document.querySelector(`#nav [data-g="${g}"]`),
    el = $('npop');
  navG = g;
  btn.classList.add('open');
  btn.setAttribute('aria-expanded', 'true');
  const dot = s =>
    (s === 'tree' && treePts() > 0) ||
    (s === 'party' && PT) ||
    (s === 'friends' && SOC.friends.some(f => f.status === 'pending' && f.incoming));
  el.innerHTML = NAVG[g]
    .map(
      ([s, n, ic], i) =>
        `<button class="nb" data-act="${s === 'ptcode' ? 'ptCodeAsk' : 'sheet'}" data-s="${s}" style="animation-delay:${i * 45}ms"><span>${n}</span><i><img src="${iconURL(ic)}" alt="">${dot(s) ? '<b class="ndot"></b>' : ''}</i></button>`
    )
    .join('');
  el.hidden = false;
  const r = btn.getBoundingClientRect(),
    w = el.offsetWidth;
  el.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - 23)) + 'px';
  el.style.bottom = innerHeight - r.top + 4 + 'px';
}
const KIND = {
  monster: '怪物',
  dungeon: '地城',
  shrine: '廟宇',
  town: '城鎮',
  base: '據點',
  chest: '寶箱',
  event: '限時事件'
};
function bar(label, v, max, col) {
  return `<div style="display:grid;gap:3px"><div class="rowx" style="font-size:12px;color:var(--dim)"><span>${label}</span><span>${Math.ceil(v)} / ${max}</span></div><div class="mbar" style="height:8px"><i style="width:${Math.max(0, Math.min(100, (v / max) * 100))}%;background:${col}"></i></div></div>`;
}
function entIcon(e) {
  const c = document.createElement('canvas');
  c.width = 18;
  c.height = 18;
  const x = c.getContext('2d');
  let n, p;
  if (e.kind === 'monster') {
    n = e.base.spr;
    p = e.base.pal;
  } else if (e.kind === 'town') {
    n = e.t.svc.includes('temple') ? 'shrine' : 'crystal';
    p = e.t.svc.includes('temple') ? PAL.shrine : PAL.crystal;
  } else if (e.kind === 'base') {
    n = e.b.type === 'main' ? 'castle' : 'camp';
    p = PAL[n];
  } else if (e.kind === 'event') {
    n = e.sub;
    p = PAL[e.sub];
  } else if (e.kind === 'dungeon') {
    n = 'dungeon';
    p = DTYPES[e.dt].pal;
  } else {
    n = e.kind;
    p = PAL[e.kind];
  }
  x.drawImage(sprite(n, p), 0, 0);
  return c;
}
const fmt1 = v => Math.round(v);
function curRow() {
  return `<div class="curs">${CUR.map(c => `<span title="${c.d}"><img class="cico lg" src="${curIcon(c.id)}" alt=""><span>${c.n}<b>${S.cur[c.id] || 0}</b></span></span>`).join('')}</div>`;
}
function renderSheet() {
  if (!sheetName || sheetName === 'ent') return;
  const el = $('sbody'),
    st = stats(),
    c = CLASSES[S.cls];
  let html = '';
  if (sheetName === 'hero') {
    const avg = (st.physLo + st.physHi) / 2 + st.fire + st.cold + st.light * 1;
    html = `<div class="card"><div class="ent"><canvas id="heroBig" width="18" height="18"></canvas><div style="flex:1;display:grid;gap:6px;min-width:0"><b style="font-family:var(--f-pix);font-size:18px;font-weight:400">${esc(S.name || '旅人')} <span style="color:${c.color};font-size:14px">${c.name}</span> Lv${S.lv}</b><small class="sub">玩家編號 ${playerTag()}</small>${bar('生命', S.hp, st.maxhp, 'var(--hp)')}${bar('魔力', S.mp, st.maxmp, 'var(--mp)')}${bar('經驗', S.xp, xpNeed(S.lv), 'var(--xp)')}</div></div></div>
    <button class="btn pri" data-act="openTree">天賦樹${treePts() > 0 ? `（剩 ${treePts()} 點未分配）` : ''}</button>${(() => {
      const k = treeTotals().keys;
      return k.length
        ? `<div class="sub" style="text-align:center">基石：<span style="color:#e8873a">${k.map(n => n.n).join('、')}</span></div>`
        : '';
    })()}
    <h3>攻擊</h3><div class="kv"><div><span>物理傷害</span><b>${fmt1(st.physLo)}–${fmt1(st.physHi)}</b></div><div><span>元素附加</span><b>${fmt1(st.fire + st.cold + st.light)}</b></div><div><span>法術基礎</span><b>${fmt1(st.spell)}</b></div><div><span>暴擊率</span><b>${st.crit}%</b></div><div><span>暴擊傷害</span><b>${st.critMulti}%</b></div><div><span>吸血</span><b>${st.leech}%</b></div></div>
    <h3>防禦</h3><div class="kv"><div><span>護甲</span><b>${st.armor}</b></div><div><span>閃避</span><b>${fmt1(st.dodge)}%</b></div><div><span>視線範圍</span><b>${st.vision}m</b></div><div><span style="color:#ffb15a">火焰抗性</span><b>${st.res.fire}%</b></div><div><span style="color:#9fe7ff">冰冷抗性</span><b>${st.res.cold}%</b></div><div><span style="color:#fff27a">閃電抗性</span><b>${st.res.light}%</b></div></div>
    <h3>技能</h3><div class="card">${c.skills.map(k => `<div class="rowx"><div class="t"><b>${SKILLS[k].name}</b><small>${SKILLS[k].kind === 'spell' ? EL[SKILLS[k].el] + '法術，吃法術傷害' : SKILLS[k].kind === 'attack' ? '攻擊，吃武器與附加傷害' : '回復'}</small></div><small style="color:${st.blood ? 'var(--hp)' : 'var(--mp)'}">${costTxt(st, SKILLS[k]) || '—'}</small></div>`).join('')}</div>
`;
  } else if (sheetName === 'bag') {
    const cell = (sl, area) => {
      const it = S.eq[sl];
      return `<button class="doll-s" style="grid-area:${area};${it ? `border-color:${RCOL[it.r]};box-shadow:0 0 10px ${RCOL[it.r]}44 inset` : ''}" data-act="eqslot" data-s="${sl}" aria-label="${SLOTN[sl]}"><img src="${slotIcon(it, sl)}" alt=""><small>${it ? esc(itemTitle(it)) : SLOTN[sl]}</small></button>`;
    };
    html = `<div class="doll"><canvas id="dollHero" width="18" height="18"></canvas>${cell('weapon', 'w')}${cell('helm', 'h')}${cell('amulet', 'a')}${cell('offhand', 'o')}${cell('ring1', 'r1')}${cell('chest', 'c')}${cell('ring2', 'r2')}${cell('gloves', 'g')}${cell('belt', 'bt')}${cell('boots', 'b')}</div>
    <h3>通貨</h3>${curRow()}
    <h3>消耗品</h3><div class="card"><div class="rowx"><div class="t"><b>生命藥水 ×${S.potions}</b></div><button class="btn sm" data-act="use" data-k="potions" ${S.potions ? '' : 'disabled'}>使用</button></div><div class="rowx"><div class="t"><b>魔力藥水 ×${S.ethers}</b></div><button class="btn sm" data-act="use" data-k="ethers" ${S.ethers ? '' : 'disabled'}>使用</button></div></div>
    <h3>背包 ${S.inv.length}/30</h3>${S.inv.length ? `<div class="list">${S.inv.map((it, i) => `<button class="irow" data-act="pick" data-i="${i}" style="border-left-color:${RCOL[it.r]}"><img src="${slotIcon(it)}" alt=""><span><b>${itemName(it)}</b><small>${SLOTN[it.slot]}・iLv${it.ilvl}・${esc(itemSum(it))}</small></span></button>`).join('')}</div>` : '<p class="sub">背包是空的。</p>'}`;
  } else if (sheetName === 'slot') {
    const cur = S.eq[selSlot],
      cands = S.inv
        .map((it, i) => ({ it, i }))
        .filter(o => fitsSlot(o.it, selSlot))
        .sort((a, b) => b.it.r - a.it.r || b.it.ilvl - a.it.ilvl);
    html = `${cur ? `${itemCard(cur, '穿戴中')}<div class="btns" style="margin-top:-4px"><button class="btn sm pri" data-act="eqdetail" data-s="${selSlot}">改造</button><button class="btn sm" data-act="unequip" data-s="${selSlot}">卸下</button></div>` : `<p class="sub">${SLOTN[selSlot]}目前是空的。</p>`}
    <h3>可以裝備 ${cands.length}</h3>${cands.length ? `<div class="list">${cands.map(({ it, i }) => `<div class="srow"><button class="irow" data-act="pick" data-i="${i}" data-from="slot" style="border-left-color:${RCOL[it.r]}"><img src="${slotIcon(it)}" alt=""><span><b>${itemName(it)}</b><small>${it.slot === 'offhand' ? esc(baseOf(it).n) + '・' : ''}iLv${it.ilvl}・${esc(itemSum(it))}</small></span></button><button class="btn sm pri" data-act="equipTo" data-i="${i}" data-s="${selSlot}">裝備</button></div>`).join('')}</div>` : `<p class="sub">背包裡沒有可以裝在這個位置的裝備。</p>`}
    <div class="btns"><button class="btn" data-act="sheet" data-s="bag">返回背包</button></div>`;
  } else if (sheetName === 'item') {
    const it = selItem && (selItem.eq ? S.eq[selItem.eq] : S.inv[selItem.i]);
    if (!it) {
      closeSheet();
      return;
    }
    const tgt = it.slot === 'ring' ? (selItem.eq ? null : S.eq.ring1 ? S.eq.ring1 : null) : S.eq[it.slot];
    html = `<div class="ent"><img class="bigico" src="${slotIcon(it)}" alt=""><div class="sub">${selItem.eq ? '穿戴中' : '背包'}・可以用通貨改造</div></div>${itemCard(it, selItem.eq ? '穿戴中' : '')}${!selItem.eq && tgt ? itemCard(tgt, '目前穿戴') : ''}
    <h3>製作</h3><div class="crafts">${CUR.map(cu => `<button class="btn sm" data-act="craft" data-c="${cu.id}" ${craftable(it, cu.id) && S.cur[cu.id] > 0 ? '' : 'disabled'}>${curDot(cu.id)}${cu.n} <b>${S.cur[cu.id] || 0}</b><small>${cu.d}</small></button>`).join('')}</div>
    <div class="btns">${selItem.eq ? `<button class="btn" data-act="unequip" data-s="${selItem.eq}">卸下</button>` : it.slot === 'ring' ? `<button class="btn pri" data-act="equip" data-s="ring1">裝在戒指 1</button><button class="btn pri" data-act="equip" data-s="ring2">裝在戒指 2</button>` : `<button class="btn pri" data-act="equip" data-s="${it.slot}">裝備</button>`}
    ${selItem.eq ? '' : `<button class="btn" data-act="sell">賣出 ${sellVal(it)} 金</button>`}${selSlot ? `<button class="btn" data-act="eqslot" data-s="${selSlot}">返回${SLOTN[selSlot]}</button>` : `<button class="btn" data-act="sheet" data-s="bag">返回背包</button>`}</div>`;
  } else if (sheetName === 'base') {
    const chk = branchCheck(),
      main = S.bases.find(b => b.type === 'main');
    html = `<p class="sub">城鎮是大家共用的地標；據點是你自己的家。據點持續產出金幣（最多累積 8 小時），每 30 分鐘恢復 1 次遠征（上限 3 次），不用出門也能攻略附近的洞窟或城鎮試煉，獎勵為實地的 80%，且不會揭開迷霧。</p>
    ${main ? '' : `<div class="card"><div class="rowx"><div class="t"><b>建立主據點</b><small>${nearTownE() ? '城鎮範圍內不能建立據點' : '在你現在的位置免費建立'}</small></div><button class="btn pri" data-act="buildMain" ${nearTownE() ? 'disabled' : ''}>在此建立</button></div></div>`}
    ${S.bases
      .map(b => {
        const ch = charges(b),
          d = baseTarget(b),
          cost = 120 * b.lv,
          cc = 2 * b.lv;
        return `<div class="card"><div class="rowx"><div class="t"><b>${baseName(b)} Lv${b.lv}</b><small>距離你 ${fmtD(dist(S.lat, S.lng, b.lat, b.lng))}・產出 ${prodRate(b)} 金/小時</small></div><div style="text-align:right"><div style="color:var(--gold);font-family:var(--f-pix)">● ${stored(b)}</div><small class="sub">遠征 ${'■'.repeat(ch)}${'□'.repeat(3 - ch)}</small></div></div>
      <p class="sub">${d ? `遠征目標：${esc(d.name)} Lv${d.lv}（${fmtD(d.d)}）` : '附近沒有可遠征的目標'}</p>
      <div class="btns"><button class="btn sm" data-act="collect" data-id="${b.id}" ${stored(b) ? '' : 'disabled'}>領取</button><button class="btn sm pri" data-act="expedition" data-id="${b.id}" ${ch && d ? '' : 'disabled'}>遠征</button><button class="btn sm" data-act="upgrade" data-id="${b.id}" ${b.lv < 5 && S.gold >= cost && S.crystal >= cc ? '' : 'disabled'}>${b.lv < 5 ? `升級 ${cost}● ${cc}◆` : '已滿級'}</button><button class="btn sm" data-act="goto" data-id="${b.id}">查看</button></div></div>`;
      })
      .join('')}
    ${main ? `<div class="card"><div class="rowx"><div class="t"><b>建立分支據點</b><small>${chk || '可以在你現在的位置建立（150 金幣）'}</small></div><button class="btn pri sm" data-act="buildBranch" ${chk ? 'disabled' : ''}>建立</button></div></div>` : ''}
    <div class="card"><div class="rowx"><div class="t"><b>測試用：時間快轉</b><small>據點產出、遠征恢復、怪物與事件刷新</small></div><button class="btn sm" data-act="ff">快轉 1 小時</button></div></div>`;
  } else if (sheetName === 'near') {
    const list = [...ENT.values()]
      .filter(e => e.kind !== 'base' && visible(e))
      .map(e => ({ ...e, d: dist(S.lat, S.lng, e.lat, e.lng) }))
      .sort((a, b) => (b.ev ? 1 : 0) - (a.ev ? 1 : 0) || a.d - b.d)
      .slice(0, 30);
    html = `<p class="sub">探索面積 ${explKm2().toFixed(2)} 平方公里・下次地圖刷新在 ${mmss(REFRESH - (now() % REFRESH))} 後。迷霧裡的東西要走近才看得到；限時事件排在最前面。</p>${list.map(e => `<button class="card" style="text-align:left;border:0;width:100%;color:inherit;font:inherit" data-act="openEnt" data-id="${e.id}"><div class="ent"><canvas data-ent="${e.id}" width="18" height="18" style="width:44px;height:44px"></canvas><div style="flex:1;min-width:0"><b style="font-weight:500;color:${e.kind === 'monster' ? RCOL[e.rar || 0] : 'inherit'}">${esc(e.kind === 'monster' ? `${e.name} Lv${e.lv}` : e.kind === 'town' && !S.found[e.id] ? '未探索的城鎮' : e.name)}</b><small class="sub" style="display:block">${e.bounty ? '懸賞目標' : KIND[e.kind]}・${dirName(S.lat, S.lng, e.lat, e.lng)}方 ${fmtD(e.d)}${e.d <= (e.kind === 'town' ? 120 : RANGE) ? '・<span style="color:var(--good)">可互動</span>' : ''}</small></div></div></button>`).join('')}`;
  } else if (sheetName === 'settings') {
    html = `<h3>聲音</h3><div class="seg"><button data-act="toggle" data-k="music" aria-pressed="${S.music}">音樂 ${S.music ? '開' : '關'}</button><button data-act="toggle" data-k="sfx" aria-pressed="${S.sfx}">音效・震動 ${S.sfx ? '開' : '關'}</button></div>
    <h3>移動方式</h3><div class="card"><div class="rowx"><div class="t"><b>GPS 定位 ${S.gps ? '開' : '關'}</b><small>${S.gps ? GPS.err || '用手機定位實際走路移動，點地圖不會再走過去' : '目前是點地圖模擬走路。開啟後用真實位置，像寶可夢 GO 一樣'}</small></div><button class="btn sm ${S.gps ? '' : 'pri'}" data-act="gps">${S.gps ? '關閉' : '開啟'}</button></div></div>
    <h3>模擬傳送（測試用）</h3><div class="btns">${['台中車站', '台北車站', '台北101', '九份老街', '日月潭', '赤崁樓', '駁二藝術特區', '墾丁大街', '花蓮車站', '宜蘭車站'].map(n => `<button class="btn sm" data-act="warp" data-n="${n}">${n}</button>`).join('')}</div>
    <h3>名字</h3><div class="card"><div class="srow"><input class="inp" id="nameInp" maxlength="12" value="${esc(S.name || '旅人')}"><button class="btn" data-act="setName">儲存</button></div><p class="sub" style="margin-top:6px">好友列表和組隊時顯示的名字，最多 12 個字。</p></div>
    <h3>帳號</h3><div class="card"><div class="rowx"><div class="t"><b>玩家編號 <span style="color:var(--gold)">${playerTag()}</span></b><small>${CLOUD.anon ? '目前是遊客，存檔綁在這台裝置。註冊後會拿到玩家編號，換手機也能登入，之後的多人地城、副本也需要帳號。' : esc(CLOUD.email || '')}</small></div>${CLOUD.anon ? '' : `<button class="btn sm" data-act="logout">登出</button>`}</div>
      ${
        CLOUD.anon
          ? `${CLOUD.pending ? `<p class="sub" style="color:var(--good)">確認信已寄到 ${esc(CLOUD.pending)}，點信裡的連結回到遊戲就完成綁定，目前的進度會一起帶過去。</p>` : ''}
      <form class="auth" data-auth autocomplete="on" onsubmit="return false"><input class="inp" id="authEmail" type="email" placeholder="信箱" autocomplete="email" required><input class="inp" id="authPw" type="password" placeholder="密碼（至少 6 個字）" autocomplete="current-password" minlength="6" required>
      <div class="btns"><button class="btn pri" type="button" data-act="register" ${CLOUD.sb ? '' : 'disabled'}>註冊並綁定進度</button><button class="btn" type="button" data-act="login" ${CLOUD.sb ? '' : 'disabled'}>登入已有帳號</button></div><p class="sub" id="authMsg"></p></form>`
          : ''
      }</div>
    <h3>雲端存檔</h3><div class="card"><div class="rowx"><div class="t"><b>${esc(CLOUD.status)}</b><small>${CLOUD.uid ? '每 15 秒、切到背景時自動上傳' : '存檔只在這台裝置'}</small></div><button class="btn sm" data-act="cloudSync" ${CLOUD.uid ? '' : 'disabled'}>立即同步</button></div></div><h3>版本</h3><p class="sub">漫步勇者 v${VER}</p><h3>關於這個 demo</h3><p class="sub">地圖是全台灣的真實道路、河流、公園與廟宇（資料來自 OpenStreetMap，第一次到一個地方會稍微載入一下）。可以點地圖模擬走路，或開 GPS 實際走路。</p>
    <h3>資料</h3><div class="card"><div class="rowx"><div class="t"><b>重新開始</b><small>清除這台裝置上的存檔與迷霧</small></div><button class="btn sm" data-act="reset">${resetArm ? '再按一次確認' : '重置'}</button></div></div>`;
  } else if (sheetName === 'friends') {
    html = friendsHTML();
    if (!CLOUD.anon && !SOC.loaded) friendsLoad();
  } else if (sheetName === 'party') {
    html = partyHTML();
  } else if (sheetName === 'log') {
    html = `<div class="log">${S.log.map(t => `<div>${esc(t)}</div>`).join('')}</div>`;
  }
  el.innerHTML = html;
  const hb = $('heroBig');
  if (hb) hb.getContext('2d').drawImage(sprite('heroF', heroPal()), 0, 0);
  el.querySelectorAll('canvas[data-ent]').forEach(cv => {
    const e = ENT.get(cv.dataset.ent);
    if (e) cv.getContext('2d').drawImage(entIcon(e), 0, 0);
  });
  const dh = $('dollHero');
  if (dh) dh.getContext('2d').drawImage(sprite('heroF', heroPal()), 0, 0);
}
function nearTownE() {
  return TOWNS.some(t => dist(S.lat, S.lng, t.lat, t.lng) < 230);
}

/* ================= entity interaction ================= */
function openEnt(id) {
  const e = ENT.get(id);
  if (!e) return;
  const d = dist(S.lat, S.lng, e.lat, e.lng),
    lim = e.kind === 'town' ? 120 : RANGE,
    inR = d <= lim || e.kind === 'base';
  sheetName = 'ent';
  $('stitle').textContent = e.bounty ? '懸賞目標' : KIND[e.kind];
  $('scrim').hidden = false;
  $('sheet').classList.remove('off');
  let desc = '',
    act = '';
  if (e.kind === 'monster') {
    desc = e.rar
      ? `<span style="color:${RCOL[e.rar]}">${RNAME[e.rar]}怪物</span>：${e.mods
          .map(id => {
            const m = EMODS.find(q => q.id === id);
            return `<b>${m.n}</b>（${m.d}）`;
          })
          .join('、')}。掉落更多更好的東西。`
      : `野生的 ${esc(e.name)} 在路上徘徊。`;
    if (e.rar === 4)
      desc = `<span class="danger">⚠ 危險怪物</span> 比你高 ${e.lv - S.lv} 級，生命約一般怪的 3 倍、攻擊 1.6 倍，還帶 ${e.mods.length} 個詞綴：${e.mods.map(id => `<b>${EMODS.find(q => q.id === id).n}</b>`).join('、')}。打贏保證掉 2 件稀有裝備與大量通貨，但很可能會輸。`;
    desc += `<br><span class="sub">攻擊屬性：${EL[e.base.el]}${e.base.res.some(v => v) ? '・抗性 火' + e.base.res[0] + '% 冰' + e.base.res[1] + '% 雷' + e.base.res[2] + '%' : ''}</span>`;
    if (e.bounty) desc += '<br><span style="color:#ff8a6a">懸賞：擊敗可得額外金幣與混沌石。</span>';
    act = `<button class="btn pri" data-act="fight" data-id="${id}" ${inR ? '' : 'disabled'}>戰鬥</button>`;
  } else if (e.kind === 'dungeon') {
    const sp = dunSpec(e),
      T = DTYPES[e.dt],
      ok = inR && !isDone(e);
    desc = isDone(e)
      ? '這座地城已被攻略，地圖刷新（每 15 分鐘）後會換成新的地城。'
      : `<b style="color:${T.col}">${T.n}</b>・共 ${sp.floors} 層，最深處有首領。${T.desc}${sp.noregen ? '' : '每過一層恢復 15% 生命與魔力。'}
      <h3 style="margin-top:10px">地城詞綴</h3>${dunModsHTML(sp)}<div class="kv" style="margin-top:6px"><div><span>物品數量</span><b>+${sp.q}%</b></div><div><span>物品稀有度</span><b>+${sp.r}%</b></div></div>`;
    act = `<button class="btn ${e.dt === 'normal' ? 'pri' : ''}" data-act="enter" data-id="${id}" ${ok ? '' : 'disabled'}>單人進入</button><button class="btn ${e.dt === 'normal' ? '' : 'pri'}" data-act="partyOpen" data-id="${id}" ${ok ? '' : 'disabled'}>組隊進入（好友或隊伍代碼）</button>`;
  } else if (e.kind === 'shrine') {
    desc = '誠心參拜可以恢復全部生命與魔力，偶爾會得到通貨。';
    act = `<button class="btn pri" data-act="pray" data-id="${id}" ${inR ? '' : 'disabled'}>參拜</button>`;
  } else if (e.kind === 'chest') {
    desc = '路邊的寶箱。裡面通常有通貨，偶爾是裝備……也可能是寶箱怪。';
    act = `<button class="btn pri" data-act="openChest" data-id="${id}" ${inR ? '' : 'disabled'}>打開</button>`;
  } else if (e.kind === 'event') {
    desc =
      {
        merchant: '流浪商人只在這裡停留到下次地圖刷新，賣比較好的稀有裝備，還有混沌石。',
        rift: '裂隙裡會連續湧出 3 波魔法怪物，最後一波是稀有怪物。完成可得大量通貨。',
        fountain: '喝下泉水，30 分鐘內經驗與掉落提高 20%。'
      }[e.sub] + `<br><span class="sub">出現在${esc(e.town)}附近，地圖刷新（每 15 分鐘）前有效。</span>`;
    act = isDone(e)
      ? '<button class="btn" disabled>已完成</button>'
      : `<button class="btn pri" data-act="event" data-id="${id}" ${inR ? '' : 'disabled'}>${{ merchant: '交易', rift: '進入裂隙', fountain: '喝下泉水' }[e.sub]}</button>`;
  } else if (e.kind === 'base') {
    desc = `你的${baseName(e.b)}，回到這裡會恢復全部狀態。`;
    act = `<button class="btn pri" data-act="sheet" data-s="base">管理據點</button>`;
  } else if (e.kind === 'town') {
    const t = e.t,
      done = S.cleared[t.id] === epoch(),
      lv = townLv(t),
      known = S.found[t.id];
    desc = known ? `以真實地標「${esc(t.n)}」為中心的城鎮。` : '還沒探索過的城鎮。走到這裡就能解鎖，並獲得發現獎勵。';
    act = !known
      ? ''
      : (t.svc.includes('inn')
          ? `<button class="btn" data-act="inn" ${inR ? '' : 'disabled'}>旅店休息・15 金</button>`
          : '') +
        (t.svc.includes('temple')
          ? `<button class="btn" data-act="pray" data-id="${id}" ${inR ? '' : 'disabled'}>參拜</button>`
          : '') +
        (t.svc.includes('shop')
          ? `<button class="btn" data-act="shop" data-id="${id}" ${inR ? '' : 'disabled'}>商店</button>`
          : '') +
        `<button class="btn pri" data-act="trial" data-id="${id}" ${inR && !done ? '' : 'disabled'}>${done ? '試煉已完成（15 分鐘內重開）' : `地標試煉「${esc(t.dn)}」Lv${lv}`}</button>`;
  }
  const title = e.kind === 'town' && !S.found[e.id] ? '未探索的城鎮' : e.name;
  $('sbody').innerHTML =
    `<div class="ent"><canvas id="entBig" width="18" height="18" style="width:84px;height:84px"></canvas><div style="flex:1;min-width:0;display:grid;gap:4px"><b style="font-family:var(--f-pix);font-size:19px;font-weight:400;color:${e.kind === 'monster' ? RCOL[e.rar || 0] : 'inherit'}">${esc(title)}${e.lv && e.kind !== 'town' ? ` <span class="sub">Lv${e.lv}</span>` : ''}</b><span class="sub">${d < 5 ? '就在這裡' : dirName(S.lat, S.lng, e.lat, e.lng) + '方 ' + fmtD(d)}</span></div></div>
    <p class="sub" style="color:var(--ink)">${desc}</p>${inR ? '' : `<p class="sub" style="color:#ffb27a">距離太遠，需要走到 ${lim} 公尺內（還差 ${fmtD(d - lim)}）。</p>`}
    <div class="btns" style="flex-direction:column">${act}${!inR ? `<button class="btn" data-act="walkto" data-id="${id}">走過去</button>` : ''}</div>`;
  $('entBig').getContext('2d').drawImage(entIcon(e), 0, 0);
}
const inRange = e => e && dist(S.lat, S.lng, e.lat, e.lng) <= (e.kind === 'town' ? 120 : RANGE);

/* ================= bases ================= */
const P30 = 30 * 60e3;
const prodRate = b => (b.type === 'main' ? 60 : 30) * b.lv;
const stored = b => Math.floor(Math.min(prodRate(b) * 8, (prodRate(b) * (now() - b.last)) / 3.6e6));
function charges(b) {
  const t = now();
  if (b.exp >= 3) {
    b.expTs = t;
    return 3;
  }
  const k = fl((t - b.expTs) / P30);
  if (k > 0) {
    b.exp = Math.min(3, b.exp + k);
    b.expTs += k * P30;
    if (b.exp >= 3) b.expTs = t;
  }
  return b.exp;
}
const baseName = b =>
  b.type === 'main' ? '主據點' : `分支據點 ${S.bases.filter(q => q.type === 'branch').indexOf(b) + 1}`;
function baseTarget(b) {
  const [bx, by] = toM(b.lat, b.lng);
  let best = null;
  /* 遠征只能打普通與團體地城；地獄地城要實地組隊 */
  for (let i = fl((bx - 1500) / DCELL); i <= fl((bx + 1500) / DCELL); i++)
    for (let j = fl((by - 1500) / DCELL); j <= fl((by + 1500) / DCELL); j++) {
      const g = dungeonAt(i, j);
      if (!g || g.dt === 'hell' || S.cleared[g.id] === epoch()) continue;
      const d = Math.hypot(g.x - bx, g.y - by);
      if (d <= 1500 && (!best || d < best.d)) best = { ...g, d };
    }
  for (const t of TOWNS) {
    const d = Math.hypot(t.x - bx, t.y - by);
    if (d < 1500 && S.found[t.id] && S.cleared[t.id] !== epoch() && (!best || d < best.d))
      best = { id: t.id, name: t.dn, lat: t.lat, lng: t.lng, d, lv: townLv(t), kind: 'landmark', dn: t.dn };
  }
  return best;
}
function branchCheck() {
  if (!S.bases.some(b => b.type === 'main')) return '先建立主據點';
  if (S.bases.filter(b => b.type === 'branch').length >= 3) return '分支據點已達上限 3 座';
  if (S.gold < 150) return '需要 150 金幣';
  if (nearTownE()) return '城鎮範圍內不能建立據點';
  const near = S.bases.find(b => dist(b.lat, b.lng, S.lat, S.lng) < 1000);
  if (near) return `離${baseName(near)}太近，需要相距 1 公里以上`;
  return '';
}

/* ================= actions ================= */
/* 帳號表單：檢查輸入、執行期間鎖住按鈕、錯誤訊息顯示在表單下方 */
async function authForm(fn) {
  const em = $('authEmail'),
    pw = $('authPw'),
    msg = $('authMsg');
  if (!em || !pw) return;
  const email = em.value.trim(),
    pass = pw.value;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    msg.textContent = '請輸入正確的信箱';
    sfx('nope');
    return;
  }
  if (pass.length < 6) {
    msg.textContent = '密碼至少 6 個字';
    sfx('nope');
    return;
  }
  const btns = document.querySelectorAll('[data-auth] button');
  btns.forEach(b => (b.disabled = true));
  msg.textContent = '處理中…';
  try {
    await fn(email, pass);
    renderHud();
    renderSheet();
  } catch (e) {
    if ($('authMsg')) {
      $('authMsg').textContent = e.message;
      btns.forEach(b => (b.disabled = false));
    }
    sfx('nope');
  }
}
const A = {
  sheet: d => {
    audioInit();
    sfx('tap');
    if (d.s === 'tree') {
      openTree();
      return;
    }
    openSheet(d.s);
  },
  closeSheet: () => closeSheet(),
  openEnt: d => {
    sfx('tap');
    openEnt(d.id);
  },
  mbtn: d => {
    sfx('select');
    const f = modalFns[+d.i];
    f && f();
  },
  recenter: () => {
    follow = true;
    cam.z = Math.max(cam.z, 0.5);
    sfx('tap');
  },
  walkto: d => {
    const e = ENT.get(d.id);
    if (!e) return;
    const lim = (e.kind === 'town' ? 120 : RANGE) * 0.6,
      dd = dist(S.lat, S.lng, e.lat, e.lng),
      k = Math.max(0, 1 - lim / dd);
    simTarget = [S.lat + (e.lat - S.lat) * k, S.lng + (e.lng - S.lng) * k];
    follow = true;
    closeSheet();
  },
  fight: d => {
    const e = ENT.get(d.id);
    if (!inRange(e)) return;
    startBattle(makeEnemy(e.base, e.lv, e.rar, e.mods), { entId: e.id, bg: e.base.bg, bounty: e.bounty });
  },
  enter: d => {
    const e = ENT.get(d.id);
    if (!inRange(e) || isDone(e)) return;
    closeSheet();
    enterDungeon(e, false);
  },
  trial: d => {
    const e = ENT.get(d.id);
    if (!inRange(e)) return;
    const t = e.t;
    if (S.cleared[t.id] === epoch()) return;
    closeSheet();
    enterDungeon({ id: t.id, kind: 'landmark', dn: t.dn, lat: t.lat, lng: t.lng, lv: townLv(t) }, false);
  },
  inn: () => {
    if (S.gold < 15) {
      toast('金幣不足');
      sfx('nope');
      return;
    }
    S.gold -= 15;
    fullHeal();
    sfx('heal');
    toast('在旅店好好休息了一晚，狀態全滿');
    renderHud();
    closeSheet();
  },
  pray: d => {
    const e = ENT.get(d.id);
    if (!inRange(e)) return;
    fullHeal();
    sfx('bless');
    let gift = '';
    if (Math.random() < 0.2) {
      const c = rollCur(1);
      giveCur(c);
      gift = `，還得到 1 個${CURI[c].n}`;
    }
    toast(`參拜完成，狀態全滿${gift}`);
    addLog(`在${e.name}參拜${gift}`);
    closeSheet();
    renderHud();
  },
  shop: d => {
    const e = ENT.get(d.id);
    if (!inRange(e)) return;
    closeSheet();
    openShop({ id: e.id, name: e.name + '・商店', lat: e.lat, lng: e.lng });
  },
  openChest: d => {
    const e = ENT.get(d.id);
    if (!inRange(e)) return;
    closeSheet();
    S.defeated[e.id] = 1;
    ENT.delete(e.id);
    if (e.mimic) {
      toast('寶箱張開了嘴——是寶箱怪！');
      startBattle(makeEnemy(MIMIC, S.lv + 1, 1, ['leech']), { bg: 'city' });
      return;
    }
    const got = [],
      g = 20 + S.lv * 8;
    S.gold += g;
    got.push(`${g} 金幣`);
    const n = 1 + (Math.random() < 0.4 ? 1 : 0) + (Math.random() < 0.15 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const c = rollCur(1.5);
      giveCur(c);
      got.push(curDot(c) + CURI[c].n);
    }
    if (Math.random() < 0.3) {
      const it = makeItem(DROPS[fl(Math.random() * DROPS.length)], S.lv, Math.random() < 0.4 ? 1 : 0);
      giveItem(it);
      got.push(itemName(it));
    }
    sfx('coin');
    showModal('打開寶箱', `<div class="loot">${got.map(x => `<span>${x}</span>`).join('')}</div>`, [
      {
        label: '好',
        pri: 1,
        fn: () => {
          hideModal();
          renderHud();
          save();
        }
      }
    ]);
  },
  event: d => {
    const e = ENT.get(d.id);
    if (!inRange(e) || isDone(e)) return;
    closeSheet();
    if (e.sub === 'merchant') openShop({ id: e.id, name: '流浪商人', lat: e.lat, lng: e.lng }, true);
    else if (e.sub === 'fountain') {
      S.buff = { until: now() + 30 * 60e3 };
      S.cleared[e.id] = evEp();
      sfx('bless');
      toast('祝福生效！30 分鐘內經驗與掉落 +20%');
      addLog('喝下祝福泉');
    } else enterDungeon({ id: e.id, kind: 'rift', lat: e.lat, lng: e.lng, lv: e.lv }, false);
  },
  skill: d => useSkill(d.k),
  bitem: d => bItem(d.k),
  flee: () => flee(),
  bsub: d => {
    if (!B || B.busy) return;
    sfx('tap');
    B.sub = d.k || null;
    renderBHud();
  },
  use: d => {
    const st = stats();
    if (!S[d.k]) return;
    S[d.k]--;
    sfx('heal');
    if (d.k === 'potions') {
      const v = Math.round(st.maxhp * 0.4 * st.healMul);
      S.hp = Math.min(st.maxhp, S.hp + v);
      toast(`恢復 ${v} 生命`);
    } else {
      const v = Math.round(st.maxmp * 0.5 * st.healMul);
      S.mp = Math.min(st.maxmp, S.mp + v);
      toast(`恢復 ${v} 魔力`);
    }
    renderHud();
    renderSheet();
  },
  pick: d => {
    selItem = { i: +d.i };
    if (d.from !== 'slot') selSlot = null;
    sfx('tap');
    openSheet('item');
  },
  eqslot: d => {
    selSlot = d.s;
    sfx('tap');
    openSheet('slot', SLOTN[d.s]);
  },
  eqdetail: d => {
    if (!S.eq[d.s]) return;
    selItem = { eq: d.s };
    sfx('tap');
    openSheet('item');
  },
  equipTo: d => {
    const it = S.inv.splice(+d.i, 1)[0],
      cur = S.eq[d.s];
    if (!it || !fitsSlot(it, d.s)) return;
    S.eq[d.s] = it;
    if (cur) S.inv.push(cur);
    sfx('select');
    toast(`裝備了 ${itemTitle(it)}`);
    clampHP();
    renderHud();
    renderSheet();
    save();
  },
  craft: d => {
    const it = selItem.eq ? S.eq[selItem.eq] : S.inv[selItem.i];
    if (craft(it, d.c)) {
      sfx(d.c === 'exalt' || d.c === 'chaos' || d.c === 'alch' ? 'level' : 'select');
      buzz(30);
      addLog(`使用${CURI[d.c].n}：${itemTitle(it)}`);
      renderHud();
      renderSheet();
      save();
    }
  },
  equip: d => {
    const it = S.inv.splice(selItem.i, 1)[0],
      cur = S.eq[d.s];
    S.eq[d.s] = it;
    if (cur) S.inv.push(cur);
    sfx('select');
    toast(`裝備了 ${itemTitle(it)}`);
    selItem = { eq: d.s };
    renderHud();
    openSheet('item');
    save();
  },
  unequip: d => {
    const it = S.eq[d.s];
    if (!it) return;
    if (S.inv.length >= 30) {
      toast('背包已滿');
      return;
    }
    S.inv.push(it);
    S.eq[d.s] = null;
    sfx('select');
    renderHud();
    if (sheetName === 'slot') {
      renderSheet();
      save();
      return;
    }
    selItem = { i: S.inv.length - 1 };
    openSheet('item');
  },
  sell: () => {
    const it = S.inv.splice(selItem.i, 1)[0];
    S.gold += sellVal(it);
    sfx('coin');
    toast(`賣出 ${itemTitle(it)} +${sellVal(it)} 金`);
    renderHud();
    if (selSlot) openSheet('slot', SLOTN[selSlot]);
    else openSheet('bag');
  },
  refund: () => {
    if (!selNode || !canRefund(selNode)) return;
    S.tree = S.tree.filter(x => x !== selNode);
    sfx('select');
    clampHP();
    renderHud();
    renderTreeCard();
    save();
  },
  treeSum: () => {
    TV.sum = !TV.sum;
    selNode = null;
    sfx('tap');
    renderTreeCard();
  },
  alloc: () => {
    const p = selNode && pathTo(selNode);
    if (!p || !p.length || p.length > treePts()) return;
    S.tree.push(...p);
    sfx('level');
    buzz(30);
    renderHud();
    renderTreeCard();
    save();
  },
  treeReset: () => {
    S.tree = [startOf(S.cls)];
    selNode = null;
    sfx('select');
    renderHud();
    renderTreeCard();
    save();
  },
  cloudSync: async () => {
    CLOUD.dirty = true;
    await cloudPush();
    toast(CLOUD.status);
    renderSheet();
  },
  register: () =>
    authForm(async (email, pw) => {
      const r = await authRegister(email, pw);
      if (r === 'confirm') toast('確認信已寄出，請到信箱點連結');
      else {
        toast(`註冊成功！你的玩家編號是 ${playerTag()}`);
        addLog(`綁定帳號，玩家編號 ${playerTag()}`);
        sfx('level');
      }
    }),
  login: () =>
    authForm(
      (email, pw) =>
        new Promise((ok, ng) =>
          showModal(
            '登入已有帳號',
            '<p>登入後會改用這個帳號的雲端存檔。</p><p class="sub">這台裝置目前的遊客進度會被取代；如果那個帳號還沒有存檔，就會把目前的進度存上去。</p>',
            [
              {
                label: '取消',
                fn: () => {
                  hideModal();
                  ok();
                }
              },
              {
                label: '登入',
                pri: 1,
                fn: async () => {
                  hideModal();
                  try {
                    const r = await authLogin(email, pw);
                    toast(
                      r === 'loaded'
                        ? `歡迎回來 ${playerTag()}，已載入雲端存檔`
                        : `登入成功 ${playerTag()}，已上傳目前進度`
                    );
                    ok();
                  } catch (e) {
                    ng(e);
                  }
                }
              }
            ]
          )
        )
    ),
  logout: () =>
    showModal(
      '登出',
      '<p>登出前會先同步進度。登出後這台裝置會變回新的遊客，從頭開始；之後用信箱和密碼登入就能拿回進度。</p>',
      [
        { label: '取消', fn: hideModal },
        {
          label: '登出',
          pri: 1,
          fn: async () => {
            hideModal();
            try {
              await authLogout();
              try {
                localStorage.removeItem(KEY);
              } catch (e) {}
              S = newGame();
              delete S.intro;
              rebuildWorld();
              toast('已登出，現在是遊客');
            } catch (e) {
              toast('登出失敗：' + e.message);
            }
            renderSheet();
          }
        }
      ]
    ),
  treeBonus: () => {
    S.bonusPts = (S.bonusPts || 0) + 10;
    sfx('level');
    renderHud();
    renderTreeCard();
    save();
  },
  openTree: () => openTree(),
  closeTree: () => closeTree(),
  treeFit: () => {
    treeFit();
    sfx('tap');
  },
  buildMain: () => {
    if (S.bases.some(b => b.type === 'main') || nearTownE()) return;
    S.bases.push({ id: uid(), type: 'main', lat: S.lat, lng: S.lng, lv: 1, last: now(), exp: 3, expTs: now() });
    sfx('level');
    addLog('建立了主據點');
    toast('主據點建立完成！');
    refreshEntities(true);
    renderSheet();
    save();
  },
  buildBranch: () => {
    if (branchCheck()) return;
    S.gold -= 150;
    S.bases.push({ id: uid(), type: 'branch', lat: S.lat, lng: S.lng, lv: 1, last: now(), exp: 3, expTs: now() });
    sfx('level');
    addLog('建立了分支據點');
    toast('分支據點建立完成！');
    refreshEntities(true);
    renderHud();
    renderSheet();
    save();
  },
  collect: d => {
    const b = S.bases.find(q => q.id === d.id),
      v = stored(b);
    S.gold += v;
    b.last = now();
    sfx('coin');
    toast(`領取 ${v} 金幣`);
    addLog(`從${baseName(b)}領取 ${v} 金幣`);
    renderHud();
    renderSheet();
  },
  upgrade: d => {
    const b = S.bases.find(q => q.id === d.id),
      c = 120 * b.lv,
      cc = 2 * b.lv;
    if (b.lv >= 5 || S.gold < c || S.crystal < cc) return;
    S.gold += stored(b);
    b.last = now();
    S.gold -= c;
    S.crystal -= cc;
    b.lv++;
    sfx('level');
    toast(`${baseName(b)} 升級到 Lv${b.lv}`);
    renderHud();
    renderSheet();
  },
  expedition: d => {
    const b = S.bases.find(q => q.id === d.id),
      tg = baseTarget(b);
    if (!tg || charges(b) < 1) return;
    showModal(
      `遠征・${esc(tg.name)} Lv${tg.lv}`,
      `<p>從${baseName(b)}派出遠征，不需要走過去。獎勵為實地攻略的 80%。</p><p class="sub">消耗 1 次遠征（剩 ${charges(b)} 次）・目前生命 ${S.hp}/${stats().maxhp}</p>`,
      [
        { label: '取消', fn: hideModal },
        {
          label: '出發',
          pri: 1,
          fn: () => {
            hideModal();
            closeSheet();
            b.exp--;
            if (b.exp === 2) b.expTs = now();
            enterDungeon(tg, true);
          }
        }
      ]
    );
  },
  goto: d => {
    const b = S.bases.find(q => q.id === d.id);
    closeSheet();
    follow = false;
    [cam.x, cam.y] = toM(b.lat, b.lng);
  },
  setName: () => {
    const v = ($('nameInp').value || '').trim().slice(0, 12);
    if (!v) {
      toast('名字不能是空的');
      return;
    }
    S.name = v;
    save();
    profileSync(true);
    toast(`名字改成「${v}」`);
    renderSheet();
  },
  /* 好友 */
  frAdd: async () => {
    const n = parseInt(($('frNo').value || '').replace(/\D/g, ''), 10),
      msg = $('frMsg');
    if (!n) {
      msg.textContent = '請輸入對方的玩家編號（數字）';
      return;
    }
    msg.textContent = '送出中…';
    try {
      const r = await friendAdd(n);
      toast(r);
      if ($('frMsg')) $('frMsg').textContent = r;
    } catch (e) {
      msg.textContent = e.message;
    }
  },
  frYes: async d => {
    await friendRespond(d.u, true);
    toast('已成為好友！');
    sfx('level');
  },
  frNo: async d => {
    await friendRespond(d.u, false);
    toast('已拒絕');
  },
  frDel: async d => {
    await friendRemove(d.u);
    toast('已刪除');
  },
  frReload: () => {
    friendsLoad();
    toast('重新整理中…');
  },
  /* 組隊 */
  partyOpen: d => {
    const e = ENT.get(d.id);
    if (!inRange(e) || isDone(e)) return;
    sfx('select');
    partyCreate(e);
    friendsLoad();
  },
  ptJoin: () => {
    const v = $('ptCode') && $('ptCode').value;
    if (!$('modal').hidden) hideModal();
    partyJoin(v);
  },
  nav: d => {
    audioInit();
    sfx('tap');
    navOpen(d.g);
  },
  ptCodeAsk: () => {
    showModal(
      '輸入隊伍代碼',
      `<input class="inp" id="ptCode" maxlength="6" placeholder="6 碼隊伍代碼" autocapitalize="characters" style="text-transform:uppercase"><p class="sub">隊長在地城按「組隊進入」就會拿到代碼。遊客也可以用代碼加入。</p>`,
      [
        { label: '取消', fn: hideModal },
        { label: '加入', pri: true, fn: () => A.ptJoin() }
      ]
    );
    setTimeout(() => $('ptCode') && $('ptCode').focus(), 50);
  },
  ptOpen: () => {
    if (PT) openSheet('party', '組隊');
  },
  ptLeave: () => partyLeave(false),
  ptStart: () => mpStart(),
  ptReady: () => ptReady(),
  ptInvite: d => {
    const f = SOC.friends.find(q => q.user_id === d.u);
    if (f) inviteFriend(f);
  },
  mpAct: d => mpMy(d.k),
  mpSub: d => {
    if (!MB) return;
    sfx('tap');
    MB.sub = d.k || null;
    renderMBHud();
  },
  mpQuit: () => mpLeave(),
  gps: () => {
    if (S.gps) {
      S.gps = false;
      gpsStop();
      toast('已關閉 GPS，改為點地圖移動');
    } else {
      if (!gpsStart()) {
        toast(GPS.err);
        return;
      }
      S.gps = true;
      toast('GPS 定位中…');
    }
    save();
    renderSheet();
  },
  warp: d => {
    const t = TOWNS.find(t => t.n === d.n);
    simTarget = null;
    S.lat = t.lat - 0.0009;
    S.lng = t.lng;
    follow = true;
    [cam.x, cam.y] = toM(S.lat, S.lng);
    trailStep(true);
    refreshEntities(true);
    checkArrive();
    closeSheet();
    toast(`模擬傳送：${t.n}`);
  },
  toggle: d => {
    S[d.k] = !S[d.k];
    audioInit();
    if (AU.ctx) {
      AU.music.gain.value = S.music ? 0.5 : 0;
      AU.sfx.gain.value = S.sfx ? 0.8 : 0;
    }
    save();
    renderSheet();
  },
  ff: () => {
    S.timeOffset += 3600e3;
    toast('時間快轉了 1 小時');
    refreshEntities(true);
    renderSheet();
  },
  reset: () => {
    if (!resetArm) {
      resetArm = true;
      renderSheet();
      return;
    }
    try {
      localStorage.removeItem(KEY);
    } catch (e) {}
    resetArm = false;
    S = newGame();
    delete S.intro;
    fogReset();
    [cam.x, cam.y] = toM(S.lat, S.lng);
    trailStep(true);
    refreshEntities(true);
    renderHud();
    closeSheet();
    toast('新的旅程開始了');
  }
};
document.addEventListener('click', ev => {
  if (ev.target.id === 'treeCv') return;
  const el = ev.target.closest('[data-act]');
  if (!el || el.disabled) {
    if (navG && !ev.target.closest('#npop')) navClose();
    return;
  }
  if (el.dataset.act !== 'nav') navClose();
  const f = A[el.dataset.act];
  if (f) {
    ev.stopPropagation();
    f(el.dataset);
  }
});
document.addEventListener('pointerdown', () => audioInit(), { capture: true, passive: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) save();
});
window.addEventListener('resize', sizeWorld);
setInterval(() => {
  if (S && !B) save();
  if (sheetName === 'base' && !resetArm) renderSheet();
  if (!B) refreshEntities();
}, 8000);
