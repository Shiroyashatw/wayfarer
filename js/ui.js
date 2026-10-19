/* 漫步勇者 · HUD、底部面板、互動、據點、動作表 */
'use strict';
/* ================= HUD & sheets ================= */
function renderHud() {
  clampHP();
  const st = stats();
  $('hpb').style.width = (S.hp / st.maxhp) * 100 + '%';
  $('mpb').style.width = (S.mp / st.maxmp) * 100 + '%';
  $('lvTag').textContent = 'Lv' + S.lv;
  ibarRender();
  const a = $('ava').getContext('2d');
  a.clearRect(0, 0, 18, 18);
  a.drawImage(sprite(heroSpr('F'), heroPal()), 0, 0);
  $('ptDot').hidden = treePts() <= 0 && !(typeof ascAlert === 'function' && ascAlert());
  /* 頭像上方的經驗值圓弧，快升級時發光 */
  const xr = Math.min(1, S.xp / xpNeed(S.lv));
  $('xpArc').style.strokeDasharray = `${xr * 100} 100`;
  $('xpArc').classList.toggle('near', xr >= 0.9);
  $('gaDot').hidden = (S.cur.wish || 0) < GEM_DRAW * 10;
}
/* 0.3.1.8：主畫面最上方的資訊條：金幣、魔晶、祈願（0.3.11 起是祈願石）、背包空間、藥水、目前的區域特性（點了看說明） */
const ZICON = {
  魔物潮: 'fang',
  豐收: 'bag',
  寶光: 'star',
  靈魂共鳴: 'ghost',
  刻印之風: 'wind',
  金脈: 'crown',
  修羅場: 'swords',
  寧靜: 'leaf'
};
function ibarRender() {
  const el = $('ibar');
  if (!el || !S) return;
  const z = zoneAt(S.lat, S.lng).m,
    full = S.inv.length >= 27,
    chip = (act, data, ic, v, cls = '') =>
      `<button class="ib ${cls}" data-act="${act}" ${data}>${ic}<b>${v}</b></button>`;
  el.innerHTML =
    chip('ibInfo', 'data-k="gold"', '<i style="color:var(--gold)">●</i>', S.gold) +
    chip('ibInfo', 'data-k="cry"', '<i style="color:#9fe7ff">◆</i>', S.crystal) +
    chip(
      'gacha',
      '',
      `<img src="${curIcon('wish')}" alt="">`,
      S.cur.wish || 0,
      (S.cur.wish || 0) >= GEM_DRAW * 10 ? 'hot' : ''
    ) +
    chip('sheet', 'data-s="bag"', `<img src="${iconURL('bag')}" alt="">`, `${S.inv.length}/30`, full ? 'warn' : '') +
    chip('sheet', 'data-s="bag"', `<img src="${iconURL('heart')}" alt="">`, S.potions) +
    chip('tierInfo', '', '<i>T</i>', tierNow() + (tierNow() < tierMax() ? '/' + tierMax() : ''), 'tier') +
    chip('zoneInfo', '', `<img src="${iconURL(ZICON[z.n] || 'leaf')}" alt="">`, z.n, 'zone');
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
  if (name !== sheetName) $('sbody').scrollTop = 0;
  sheetName = name;
  $('stitle').textContent = title || TITLES[name];
  $('scrim').hidden = false;
  $('sheet').classList.remove('off');
  renderSheet();
}
function closeSheet() {
  sheetName = null;
  if (typeof SEL !== 'undefined') SEL.sell = null;
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
  party: '組隊',
  skills: '技能',
  stele: '石碑與傳送門',
  gem: '技能石',
  gemshop: '技能石商店',
  pact: '契靈',
  pboard: '契約板',
  seal: '印記兌換',
  asc: '昇華'
};
/* 底部導覽：群組按鈕點了往上展開 2～3 個功能，再點一次或點地圖就收起來 */
const NAVG = {
  adv: [
    ['near', '附近', 'eye'],
    ['base', '據點', 'castle'],
    ['stele', '石碑', 'key'],
    ['log', '冒險日誌', 'book']
  ],
  soc: [
    ['party', '組隊', 'party'],
    ['friends', '好友', 'heart'],
    ['ptcode', '輸入隊伍代碼', 'key']
  ],
  me: [
    ['hero', '角色', 'shield'],
    ['skills', '技能', 'book'],
    ['tree', '天賦樹', 'star'],
    ['asc', '昇華', 'crown']
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
    (s === 'asc' && ascAlert()) ||
    (s === 'skills' && S.cur.eng > 0 && S.gems.some(g => gemOpen(g) > 0)) ||
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
  } else if (e.spr) {
    n = e.spr;
    p = e.pal;
  } else {
    n = e.kind;
    p = PAL[e.kind];
  }
  const sp = sprite(n, p);
  /* PNG 圖（a_ 開頭）比 18×18 大，直接回傳它自己的畫布，不要裁成 18 格 */
  if (sp.art) return sp;
  x.drawImage(sp, 0, 0);
  return c;
}
const fmt1 = v => Math.round(v);
function curRow() {
  return `<div class="curs">${CUR.map(c => `<span title="${c.d}"><img class="cico lg" src="${curIcon(c.id)}" alt=""><span>${c.n}<b>${S.cur[c.id] || 0}</b></span></span>`).join('')}</div>`;
}
/* 背包上方分頁：裝備與各種地城材料 */
const bagTabs = () =>
  `<div class="seg bagtabs">${[['eq', '裝備', () => S.inv.length], ...MAT_TABS]
    .map(
      ([k, n, c]) =>
        `<button data-act="matTab" data-k="${k}" aria-pressed="${SEL.bag === k}">${n}${k === 'eq' ? '' : ` <b>${c()}</b>`}</button>`
    )
    .join('')}</div>`;
const curRowG = () =>
  `<div class="curs">${GCUR.map(c => `<span title="${c.d}"><img class="cico lg" src="${curIcon(c.id)}" alt=""><span>${c.n}<b>${S.cur[c.id] || 0}</b></span></span>`).join('')}</div>`;
/* 技能說明：類別、傷害、目標形式與特殊效果 */
const BUFFN = { more: '傷害', arm: '護甲', dodge: '閃避', crit: '暴擊率', taunt: '嘲諷', dmgRed: '受傷降低' };
function gemDesc(q) {
  const out = [],
    tg = q.tg === 'all' ? '全體' : q.tg === 'rand' ? '隨機目標' : '';
  if (q.pet) out.push(`召喚 ${q.pet.n || 1} 隻${q.pet.name}（${q.pet.turns} 回合、最多 ${q.pet.max}）`);
  else if (q.kind === 'spell') out.push(`${EL[q.el]}法術・基礎傷害 ${Math.round(q.sb * q.mult)}`);
  else if (q.kind === 'attack')
    out.push(
      `${q.w ? WTAGN[q.w] : ''}攻擊・武器傷害 ${Math.round(q.mult * 100)}%${q.hits > 1 ? ` × ${q.hits} 下` : ''}`
    );
  else if (q.kind === 'heal')
    out.push(`回復 ${Math.round(q.heal * 100)}% 生命${q.healAll ? `，其他隊友 ${q.healAll}%` : ''}`);
  if (tg) out.push(tg);
  if (q.chain) out.push(`連鎖 ${q.chain} 次`);
  if (q.proj) out.push(`多 ${q.proj} 支投射物`);
  if (q.addEl) out.push(`附加 ${Math.round(q.addEl[1] * 100)}% ${EL[q.addEl[0]]}`);
  if (q.stun) out.push(`${Math.round(q.stun * 100)}% 暈眩`);
  if (q.bleed) out.push(`${q.bleed}% 流血`);
  if (q.poison) out.push('中毒');
  if (q.mark) out.push(`標記（受傷 +${q.mark}%）`);
  if (q.curse) out.push(`詛咒（受傷 +${q.curse}%）`);
  if (q.exec) out.push(`斬殺 +${q.exec}%`);
  if (q.buff)
    out.push(
      `${q.buff.n} ${q.buff.turns} 回合：` +
        Object.entries(q.buff)
          .filter(([k]) => BUFFN[k])
          .map(([k, v]) => `${BUFFN[k]} ${k === 'dmgRed' ? '-' : '+'}${Math.round(v)}%`)
          .concat(q.buff.shield ? [`護盾 ${Math.round(q.buff.shield * 100)}% 生命`] : [])
          .join('、')
    );
  if (q.lifeCost) out.push(`消耗 ${Math.round(q.lifeCost * 100)}% 生命`);
  if (q.w) out.push(`需要${WTAGN[q.w]}（不符傷害 -40%）`);
  return out.join('・');
}
/* 技能頁的篩選：全部、全體、單體、物理、元素、輔助（增益、治癒、召喚） */
const SKF = [
  ['all', '全部'],
  ['aoe', '全體'],
  ['one', '單體'],
  ['phys', '物理'],
  ['ele', '元素'],
  ['sup', '輔助']
];
function skfOk(g) {
  const q = SKILLS[g.k],
    f = (typeof SEL !== 'undefined' && SEL.skf) || 'all',
    dmg = !q.pet && (q.kind === 'attack' || q.kind === 'spell');
  if (f === 'aoe') return dmg && (q.tg === 'all' || q.tg === 'rand' || !!q.chain || !!q.proj);
  if (f === 'one') return dmg && !q.tg && !q.chain && !q.proj;
  if (f === 'phys') return dmg && (q.kind === 'attack' || (q.el || 'phys') === 'phys');
  if (f === 'ele') return dmg && ((q.kind === 'spell' && q.el && q.el !== 'phys') || !!q.addEl);
  if (f === 'sup') return !dmg;
  return true;
}
/* 技能石圖示：左上等級、右上刻印槽（亮的是已刻印）、右下「裝」表示在技能欄；底色依種類（攻擊、法術、輔助），0.3.11 起沒有星級 */
const gemKc = k => (SKILLS[k].kind === 'spell' ? 'ks' : SKILLS[k].kind === 'attack' ? 'ka' : 'ku');
const gemCell = (g, noEq) => {
  const n = gemSlots(g);
  return `<span class="gtile ${gemKc(g.k)}${g.cor ? ' gcor' : ''}"><img src="${iconURL(SKILLS[g.k].icon)}" alt=""><i class="glv">${g.lv}</i>${n ? `<span class="gen">${Array.from({ length: n }, (_, i) => `<i class="${i < g.en.length ? 'f' : ''}"></i>`).join('')}</span>` : ''}${!noEq && S.sk.includes(g.id) ? '<i class="geq">裝</i>' : ''}</span>`;
};
const gemRow = (g, tag) => {
  const q = gemSkill(g);
  return `<button class="card" style="text-align:left;border:0;width:100%;color:inherit;font:inherit" data-act="gem" data-id="${g.id}"><div class="rowx"><div class="t"><b><img class="cico" src="${iconURL(q.icon)}" alt=""> ${q.name} Lv${g.lv}${g.cor ? ' <span style="color:#e5484d">腐化</span>' : ''}</b><small>${tag ? tag + '・' : ''}${gemDesc(q)}・刻印 ${g.en.length}/${gemSlots(g)}${gemOpen(g) > 0 ? ' <span style="color:var(--gold)">◇可刻印</span>' : ''}</small></div><small class="sub">${q.mp ? q.mp + ' 魔力' : ''}</small></div></button>`;
};
/* 0.3.11 技能石商店：依 T 分頁（T1～T5），未解鎖的 T 只能看 */
function gemShopHTML() {
  const mx = tierMax(),
    cur = Math.min(5, SEL.gtier || 1),
    ks = GEMK()
      .filter(k => gemTier(k) === cur)
      .sort((a, b) => gemReq(a) - gemReq(b) || a.localeCompare(b));
  return `<p class="sub" style="margin:0">金幣 <b style="color:var(--gold)">${S.gold}</b>・目前解鎖到 T${mx}。買下的技能石是 Lv1，每種只能有一顆；用擊殺怪物得到的靈魂升級。</p>
    <div class="seg gst5">${[1, 2, 3, 4, 5].map(t => `<button data-act="gshopTier" data-v="${t}" aria-pressed="${t === cur}">T${t}${t > mx ? '🔒' : ''}</button>`).join('')}</div>
    ${cur > mx ? `<p class="sub" style="color:#ffb27a">T${cur} 還沒解鎖：到城鎮挑戰突破試煉。</p>` : ''}
    <div class="card">${ks
      .map(k => {
        const q = SKILLS[k],
          blk = gemBuyBlock(k);
        return `<div class="rowx"><div class="t"><b><img class="cico" src="${iconURL(q.icon)}" alt=""> ${q.name} <span class="sub">需要 Lv${gemReq(k)}</span></b>${skTagHTML(q, 3)}<small>${gemDesc(gemSkill(newGem(k)))}</small></div><button class="btn sm ${blk ? '' : 'pri'}" data-act="gemBuy" data-k="${k}" ${blk ? 'disabled' : ''}>${blk || `${gemPrice(k)} 金`}</button></div>`;
      })
      .join('')}</div>`;
}
const prayed = id => !!S.prayed && S.prayed[id] === hepoch();
/* 0.3.1.8：子頁面在右上角有「‹ 返回」（裝備詳情 → 背包或該部位、部位 → 背包、技能石 → 技能、印記兌換 → 狩獵、背包的材料分頁 → 裝備） */
function sheetParent() {
  if (sheetName === 'item') return selSlot ? ['slot', SLOTN[selSlot]] : ['bag'];
  if (sheetName === 'slot') return ['bag'];
  if (sheetName === 'gem') return ['skills'];
  if (sheetName === 'pboard') return ['pact'];
  if (sheetName === 'seal') return ['hunt'];
  if (sheetName === 'bag' && (SEL.bag !== 'eq' || SEL.sell)) return ['bagHome'];
  return null;
}
function renderSheet() {
  {
    const b = $('sback');
    if (b) b.hidden = !sheetName || sheetName === 'ent' || !sheetParent();
  }
  if (!sheetName || sheetName === 'ent') return;
  const el = $('sbody'),
    st = stats(),
    c = CLASSES[S.cls] || CLASSES.novice;
  let html = '';
  if (sheetName === 'hero') {
    const avg = (st.physLo + st.physHi) / 2 + st.fire + st.cold + st.light * 1;
    html = `<div class="card"><div class="ent"><canvas id="heroBig" width="18" height="18"></canvas><div style="flex:1;display:grid;gap:6px;min-width:0"><b style="font-family:var(--f-pix);font-size:18px;font-weight:400">${esc(S.name || '旅人')} <span style="color:${c.color};font-size:14px">${c.name}</span> Lv${S.lv}</b><small class="sub">玩家編號 ${playerTag()}</small>${bar('生命', S.hp, st.maxhp, 'var(--hp)')}${bar('魔力', S.mp, st.maxmp, 'var(--mp)')}${bar('經驗', S.xp, xpNeed(S.lv), 'var(--xp)')}</div></div></div>
    <button class="btn pri" data-act="openTree">天賦樹${treePts() > 0 ? `（剩 ${treePts()} 點未分配）` : ''}</button><button class="btn" data-act="sheet" data-s="pact">契靈${
      pactsOn().length
        ? `・${pactsOn()
            .map(id => PACTI[id].n)
            .join('、')}`
        : ''
    }</button><button class="btn" data-act="asc">昇華${S.asc && S.asc.br ? `・${ASCB[S.asc.br].n}` : ''}${ascPts() > ascUsed() ? `（剩 ${ascPts() - ascUsed()} 點）` : ''}</button>${(() => {
      const k = treeTotals().keys;
      return k.length
        ? `<div class="sub" style="text-align:center">基石：<span style="color:#e8873a">${k.map(n => n.n).join('、')}</span></div>`
        : '';
    })()}
    <h3>攻擊</h3><div class="kv"><div><span>物理傷害</span><b>${fmt1(st.physLo)}–${fmt1(st.physHi)}</b></div><div><span>元素附加</span><b>${fmt1(st.fire + st.cold + st.light)}</b></div><div><span>法術加成</span><b>${Math.round((st.spellMul - 1) * 100)}%</b></div><div><span>暴擊率</span><b>${st.crit}%</b></div><div><span>暴擊傷害</span><b>${st.critMulti}%</b></div><div><span>吸血</span><b>${st.leech}%</b></div></div>
    <h3>防禦</h3><div class="kv"><div><span>護甲</span><b>${st.armor}</b></div><div><span>閃避</span><b>${fmt1(st.dodge)}%</b></div><div><span>視線範圍</span><b>${st.vision}m</b></div><div><span style="color:#ffb15a">火焰抗性</span><b>${st.res.fire}%</b></div><div><span style="color:#9fe7ff">冰冷抗性</span><b>${st.res.cold}%</b></div><div><span style="color:#fff27a">閃電抗性</span><b>${st.res.light}%</b></div></div>
    <h3>技能</h3><div class="card">${mySkills()
      .map((q, i) =>
        q
          ? `<div class="rowx"><div class="t"><b>${q.name} Lv${q.lv}</b><small>${gemDesc(q)}</small></div><small style="color:${st.blood ? 'var(--hp)' : 'var(--mp)'}">${costTxt(st, q) || '—'}</small></div>`
          : `<div class="rowx"><div class="t"><small class="sub">第 ${i + 1} 格：空</small></div></div>`
      )
      .join('')}</div><button class="btn" data-act="sheet" data-s="skills">管理技能石</button>
`;
  } else if (sheetName === 'skills') {
    const eqd = new Set(S.sk),
      list = [...S.gems].sort((a, b) => eqd.has(b.id) - eqd.has(a.id) || b.lv - a.lv || a.k.localeCompare(b.k));
    html = `<div class="gslots">${S.sk
      .map((id, i) => {
        const g = gemOf(id);
        return g
          ? `<button class="gslot" data-act="gem" data-id="${g.id}">${gemCell(g, true)}<span>${SKILLS[g.k].name}</span>${skTagHTML(gemSkill(g), 2)}</button>`
          : `<div class="gslot empty"><span class="gtile" style="background:#0003;border-style:dashed"></span><span>第 ${i + 1} 格</span></div>`;
      })
      .join('')}</div>
    <p class="sub" style="margin:0">另外有固定的普通攻擊。技能石每 5 級開 1 個空的刻印槽，用刻印石點下去才會抽出詞綴。</p>
    <p class="sub" style="margin:0">技能石在城鎮的「技能石商店」購買（依 T 級解鎖），用擊殺怪物得到的${curDot('soul')}靈魂（${S.cur.soul || 0}）升級。</p>
    ${curRowG()}
    <h3>技能石（${S.gems.length}）</h3><div class="seg skf">${SKF.map(([k, n]) => `<button data-act="skFilter" data-k="${k}" aria-pressed="${(SEL.skf || 'all') === k}">${n}</button>`).join('')}</div>
    <div class="ggrid">${
      list
        .filter(g => skfOk(g))
        .map(
          g =>
            `<button class="gcell" data-act="gem" data-id="${g.id}">${gemCell(g)}<span>${SKILLS[g.k].name}</span>${skTagHTML(SKILLS[g.k], 2)}</button>`
        )
        .join('') || `<p class="sub">${S.gems.length ? '沒有符合的技能石' : '還沒有技能石，到城鎮的技能石商店買吧'}</p>`
    }</div>`;
  } else if (sheetName === 'pboard') {
    html = pboardHTML();
  } else if (sheetName === 'pact') {
    html = pactHTML();
  } else if (sheetName === 'gemshop') {
    html = gemShopHTML();
  } else if (sheetName === 'gem') {
    const g = gemOf(selGem);
    if (!g) {
      openSheet('skills');
      return;
    }
    const q = gemSkill(g),
      at = S.sk.indexOf(g.id),
      blk = gemLvBlock(g),
      n = gemSlots(g);
    html = `<div class="card"><div class="rowx" style="justify-content:flex-start;gap:14px">${gemCell(g)}<div class="t"><b style="font-size:17px">${q.name} Lv${g.lv}<span class="sub">/${GEM_MAX}</span></b>${skTagHTML(q)}<small>${gemDesc(q)}・消耗 ${costTxt(st, q) || '無'}${at >= 0 ? `・裝在第 ${at + 1} 格` : ''}${g.cor ? '・<span style="color:#e5484d">已腐化</span>' : ''}</small></div></div></div>
    <h3>刻印槽 ${g.en.length}/${n}${g.lv < GEM_MAX ? `<small class="sub">・下一個在 Lv${(fl(g.lv / 5) + 1) * 5}</small>` : ''}</h3><div class="card">${
      n
        ? [
            ...g.en.map(a => `<div class="rowx"><div class="t"><b>${gAffTxt(a)}</b></div></div>`),
            ...Array.from(
              { length: gemOpen(g) },
              () =>
                '<div class="rowx"><div class="t"><small class="sub">◇ 空的刻印槽：用刻印石點下去</small></div></div>'
            )
          ].join('')
        : '<p class="sub">Lv5 開第一個刻印槽</p>'
    }</div>
    <h3>刻印</h3><div class="crafts">${GCUR.slice(2)
      .map(
        cu =>
          `<button class="btn sm" data-act="gemCraft" data-c="${cu.id}" ${gemCraftable(g, cu.id) && S.cur[cu.id] > 0 ? '' : 'disabled'}>${curDot(cu.id)}${cu.n} <b>${S.cur[cu.id] || 0}</b><small>${cu.d}</small></button>`
      )
      .join('')}</div>
    <h3>升級</h3><div class="card"><div class="rowx"><div class="t"><b>${g.lv < GEM_MAX ? `Lv${g.lv} → Lv${g.lv + 1}` : '已滿級'}</b><small>${g.lv < GEM_MAX ? `需要 ${soulNeed(g.lv)} 靈魂（你有 ${S.cur.soul || 0}）・技能石等級不能超過角色等級` : ''}</small></div><button class="btn pri sm" data-act="gemLv" ${blk ? 'disabled' : ''}>${blk || '升級'}</button></div></div>
    <h3>技能欄</h3><div class="btns">${S.sk.map((id, i) => `<button class="btn sm ${id === g.id ? '' : 'pri'}" data-act="gemEquip" data-i="${i}" ${id === g.id ? 'disabled' : ''}>${id === g.id ? '裝在' : '裝到'}第 ${i + 1} 格${id && id !== g.id && gemOf(id) ? `<small>（換下${SKILLS[gemOf(id).k].name}）</small>` : ''}</button>`).join('')}${at >= 0 ? '<button class="btn sm" data-act="gemOff">卸下</button>' : ''}</div>
    <div class="btns"><button class="btn" data-act="gemBreak">分解（退回 ${gemSoulBack(g)} 靈魂）</button><button class="btn" data-act="sheet" data-s="skills">返回技能</button></div>`;
  } else if (sheetName === 'bag' && SEL.bag !== 'eq') {
    html = bagTabs() + matsHTML(SEL.bag);
  } else if (sheetName === 'bag' && SEL.sell) {
    html = bagListHTML();
  } else if (sheetName === 'bag') {
    const cell = (sl, area) => {
      const it = S.eq[sl];
      return `<button class="doll-s" style="grid-area:${area};${it ? `border-color:${RCOL[it.r]};box-shadow:0 0 10px ${RCOL[it.r]}44 inset` : ''}" data-act="eqslot" data-s="${sl}" aria-label="${SLOTN[sl]}"><img src="${slotIcon(it, sl)}" alt=""><small>${it ? esc(itemTitle(it)) : SLOTN[sl]}</small></button>`;
    };
    html = `${bagTabs()}<div class="doll"><canvas id="dollHero" width="18" height="18"></canvas>${cell('weapon', 'w')}${cell('helm', 'h')}${cell('amulet', 'a')}${cell('offhand', 'o')}${cell('ring1', 'r1')}${cell('chest', 'c')}${cell('ring2', 'r2')}${cell('gloves', 'g')}${cell('belt', 'bt')}${cell('boots', 'b')}</div>
    <h3>通貨</h3>${curRow()}
    <h3>消耗品</h3><div class="card"><div class="rowx"><div class="t"><b>生命藥水 ×${S.potions}</b></div><button class="btn sm" data-act="use" data-k="potions" ${S.potions ? '' : 'disabled'}>使用</button></div><div class="rowx"><div class="t"><b>魔力藥水 ×${S.ethers}</b></div><button class="btn sm" data-act="use" data-k="ethers" ${S.ethers ? '' : 'disabled'}>使用</button></div></div>
    ${bagListHTML()}`;
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
    ${undeadCraftHTML(it)}
    <div class="btns">${selItem.eq ? `<button class="btn" data-act="unequip" data-s="${selItem.eq}">卸下</button>` : it.slot === 'ring' ? `<button class="btn pri" data-act="equip" data-s="ring1">裝在戒指 1</button><button class="btn pri" data-act="equip" data-s="ring2">裝在戒指 2</button>` : `<button class="btn pri" data-act="equip" data-s="${it.slot}">裝備</button>`}
    ${selItem.eq ? '' : `<button class="btn" data-act="lock">${it.lock ? '解鎖' : '上鎖'}</button><button class="btn" data-act="sell" ${canSell() && !it.lock ? '' : 'disabled'}>${it.lock ? '已上鎖' : canSell() ? `賣出 ${sellVal(it)} 金` : '城鎮或據點才能賣'}</button>`}${selSlot ? `<button class="btn" data-act="eqslot" data-s="${selSlot}">返回${SLOTN[selSlot]}</button>` : `<button class="btn" data-act="sheet" data-s="bag">返回背包</button>`}</div>`;
  } else if (sheetName === 'base') {
    html = baseHTML();
  } else if (sheetName === 'stele') {
    html = steleHTML();
  } else if (sheetName === 'near') {
    html = nearHTML();
  } else if (sheetName === 'settings') {
    html = `<h3>聲音</h3><div class="seg"><button data-act="toggle" data-k="music" aria-pressed="${S.music}">音樂 ${S.music ? '開' : '關'}</button><button data-act="toggle" data-k="sfx" aria-pressed="${S.sfx}">音效・震動 ${S.sfx ? '開' : '關'}</button></div>
    <h3>自動喝水</h3><div class="card"><p class="sub" style="margin-bottom:6px">戰鬥結束後低於門檻就自動喝藥水（每種最多 3 瓶）。戰鬥勝利不會自動回復。</p>${[
      ['autoHp', '生命藥水', S.potions],
      ['autoMp', '魔力藥水', S.ethers]
    ]
      .map(
        ([k, n, c]) =>
          `<div style="margin-top:8px"><b>${n}（剩 ${c}）</b><small class="sub">・${S[k] ? `低於 ${S[k]}% 時喝` : '關閉'}</small><div class="seg" style="margin-top:6px">${[0, 30, 50, 70].map(v => `<button data-act="autoPot" data-k="${k}" data-v="${v}" aria-pressed="${(S[k] || 0) === v}">${v ? v + '%' : '關'}</button>`).join('')}</div></div>`
      )
      .join('')}</div>
    <h3>移動方式</h3><div class="card"><div class="rowx"><div class="t"><b>GPS 定位 ${S.gps ? '開' : '關'}</b><small>${S.gps ? GPS.err || '用手機定位實際走路移動，點地圖不會再走過去' : '目前是點地圖模擬走路。開啟後用真實位置，像寶可夢 GO 一樣'}</small></div><button class="btn sm ${S.gps ? '' : 'pri'}" data-act="gps">${S.gps ? '關閉' : '開啟'}</button></div>
      <div style="margin-top:10px"><b>點地圖移動速度</b><small class="sub">・測試用，GPS 開啟時不影響</small><div class="seg" style="margin-top:6px;grid-template-columns:repeat(3,1fr)">${[1, 1.5, 2].map(v => `<button data-act="simSpd" data-v="${v}" aria-pressed="${(S.simSpd || 1) === v}">×${v}</button>`).join('')}</div></div></div>
    <h3>新手教學</h3><div class="card"><div class="rowx"><div class="t"><b>重看新手教學</b><small>一步步介紹畫面上的按鈕與玩法</small></div><button class="btn sm" data-act="tutor">開始</button></div></div>
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
  } else if (sheetName === 'hunt') {
    html = huntHTML();
  } else if (sheetName === 'seal') {
    html = sealHTML();
  } else if (sheetName === 'log') {
    html = `<div class="log">${S.log.map(t => `<div>${esc(t)}</div>`).join('')}</div>`;
  }
  el.innerHTML = html;
  const hb = $('heroBig');
  if (hb) hb.getContext('2d').drawImage(sprite(heroSpr('F'), heroPal()), 0, 0);
  el.querySelectorAll('canvas[data-ent]').forEach(cv => {
    const e = ENT.get(cv.dataset.ent);
    if (e) paintIcon18(cv, entIcon(e));
  });
  if (sheetName === 'hunt' || sheetName === 'seal') huntPaint();
  const dh = $('dollHero');
  if (dh) dh.getContext('2d').drawImage(sprite(heroSpr('F'), heroPal()), 0, 0);
}
function nearTownE() {
  return TOWNS.some(t => dist(S.lat, S.lng, t.lat, t.lng) < 230);
}
/* 商店的出售頁：背包裝備排成格子，點一下勾選，快速選取＋一次賣出（跟背包的批量賣出共用勾選狀態 SEL.sell） */
function shopSellHTML() {
  if (!SEL.sell) SEL.sell = new Set();
  S.inv.forEach(it => it.id || (it.id = uid()));
  if (!S.inv.length) return '<p class="sub">背包裡沒有裝備可以賣。</p>';
  const sel = sellSel(),
    gold = sel.reduce((n, it) => n + sellVal(it), 0),
    ok = canSell(),
    q = (k, n) => `<button class="btn sm" data-act="shopQuick" data-k="${k}">${n}</button>`;
  return `<div class="sellbar">${q('r0', '普通')}${q('r1', '魔法')}${q('r2', '稀有')}${q('worse', '比穿戴的差')}${q('all', '全選')}${q('none', '清除')}</div>
  <div class="sgrid">${S.inv
    .map((it, i) => {
      const on = SEL.sell.has(it.id) && !it.lock;
      return `<button class="stile${on ? ' on' : ''}${it.lock ? ' sold' : ''}" data-act="shopPick" data-i="${i}" style="border-color:${RCOL[it.r]}${on ? '' : '88'}" aria-label="${esc(itemTitle(it))}"><img src="${slotIcon(it)}" alt="">${on ? '<i class="ok">✓</i>' : it.lock ? '<i>鎖</i>' : ''}<small>${sellVal(it)} 金</small></button>`;
    })
    .join('')}</div>
  <p class="sub">${ok ? `點裝備勾選；上鎖的不會被選到。背包 ${S.inv.length}/30` : '⚠ 要在城鎮或據點才能賣出裝備。'}</p>
  <button class="btn pri" data-act="shopSellGo" style="width:100%" ${ok && sel.length ? '' : 'disabled'}>賣出 ${sel.length} 件　+${gold} 金</button>`;
}
/* 0.3.1 賣裝備：只有在城鎮或據點（主據點半徑內、分支據點旁）才能賣 */
function canSell() {
  return (
    nearTownE() || (S.bases || []).some(b => dist(S.lat, S.lng, b.lat, b.lng) <= (b.type === 'main' ? baseR(b.lv) : 60))
  );
}
/* 比身上穿的差：同部位穿戴中的稀有度與物品等級都不低於它（戒指跟比較差的那枚比） */
function worseThanEq(it) {
  const eqs = it.slot === 'ring' ? [S.eq.ring1, S.eq.ring2] : [S.eq[it.slot]];
  if (eqs.some(e => !e)) return false;
  return eqs.some(e => e.r >= it.r && e.ilvl >= it.ilvl);
}
const sellSel = () => S.inv.filter(it => SEL.sell && SEL.sell.has(it.id) && !it.lock);
/* 背包清單：一般模式點開物品；批量賣出模式點一下勾選 */
function bagListHTML() {
  const head = `<div class="baghd"><h3>背包 ${S.inv.length}/30</h3>${S.inv.length ? `<button class="btn sm${SEL.sell ? ' pri' : ''}" data-act="sellMode">${SEL.sell ? '完成' : '批量賣出'}</button>` : ''}</div>`;
  if (!S.inv.length) return head + '<p class="sub">背包是空的。</p>';
  const row = (it, i) => {
    const on = SEL.sell && SEL.sell.has(it.id) && !it.lock;
    return `<button class="irow${on ? ' sel' : ''}${it.lock ? ' locked' : ''}" data-act="${SEL.sell ? 'sellPick' : 'pick'}" data-i="${i}" style="border-left-color:${RCOL[it.r]}">${SEL.sell ? `<i class="ck">${it.lock ? '鎖' : on ? '✓' : ''}</i>` : ''}<img src="${slotIcon(it)}" alt=""><span><b>${itemName(it)}${it.lock && !SEL.sell ? ' <em class="lk">鎖</em>' : ''}</b><small>${SLOTN[it.slot]}・iLv${it.ilvl}・${esc(itemSum(it))}</small></span>${SEL.sell ? `<em class="pr">${sellVal(it)}</em>` : ''}</button>`;
  };
  if (!SEL.sell) return head + `<div class="list">${S.inv.map(row).join('')}</div>`;
  const sel = sellSel(),
    gold = sel.reduce((n, it) => n + sellVal(it), 0),
    ok = canSell(),
    q = (k, n) => `<button class="btn sm" data-act="sellQuick" data-k="${k}">${n}</button>`;
  return `${head}<div class="sellbar">${q('r0', '普通')}${q('r1', '魔法')}${q('r2', '稀有')}${q('worse', '比穿戴的差')}${q('all', '全選')}${q('none', '清除')}</div>
    <p class="sub">${ok ? '點裝備勾選；上鎖的裝備不會被選到（在裝備詳情裡上鎖）。' : '⚠ 要在城鎮或據點才能賣出裝備，現在只能先勾選。'}</p>
    <div class="list">${S.inv.map(row).join('')}</div>
    <div class="sellgo"><button class="btn pri" data-act="sellMany" ${ok && sel.length ? '' : 'disabled'}>${ok ? `賣出 ${sel.length} 件　+${gold} 金` : '不在城鎮或據點'}</button></div>`;
}

/* ================= entity interaction ================= */
function openEnt(id) {
  const e = ENT.get(id);
  if (!e) return;
  const d = dist(S.lat, S.lng, e.lat, e.lng),
    lim = reachOf(e),
    zn = d > lim && e.kind !== 'base' && zoneOf(e),
    inR = d <= lim || e.kind === 'base' || !!zn;
  /* 從別的頁面切過來時，把上一頁留下的狀態清乾淨（返回鍵、捲動位置、背包的賣出模式、展開的導覽） */
  sheetName = 'ent';
  if (SEL.sell) SEL.sell = null;
  navClose();
  $('sback').hidden = true;
  $('stitle').textContent = e.bounty ? '懸賞目標' : KIND[e.kind];
  $('scrim').hidden = false;
  $('sheet').classList.remove('off');
  $('sbody').scrollTop = 0;
  let desc = '',
    act = '',
    pre = '';
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
    pre = lineupHTML(e);
    act = `<button class="btn pri" data-act="fight" data-id="${id}" ${inR ? '' : 'disabled'}>戰鬥</button>`;
  } else if (e.kind === 'dungeon') {
    const sp = dunSpec(e),
      T = DTYPES[e.dt],
      ok = inR && !isDone(e);
    desc = isDone(e)
      ? '這座地城已被攻略，每小時整點刷新後會換成新的地城。'
      : `<b style="color:${T.col}">${T.n}</b>・共 ${sp.floors} 層，最深處有首領。${T.desc}
      <h3 style="margin-top:10px">地城詞綴</h3>${dunModsHTML(sp)}<div class="kv" style="margin-top:6px"><div><span>物品數量</span><b>+${sp.q}%</b></div><div><span>物品稀有度</span><b>+${sp.r}%</b></div></div>`;
    act = `<button class="btn ${e.dt === 'normal' ? 'pri' : ''}" data-act="enter" data-id="${id}" ${ok ? '' : 'disabled'}>單人進入</button><button class="btn ${e.dt === 'normal' ? '' : 'pri'}" data-act="partyOpen" data-id="${id}" ${ok ? '' : 'disabled'}>組隊進入（好友或隊伍代碼）</button>`;
  } else if (e.kind === 'shrine') {
    const pd = prayed(e.id);
    desc = pd
      ? '這座廟宇的祝福已經用過了，每小時整點會恢復。'
      : '誠心參拜可以恢復全部生命與魔力，偶爾會得到通貨。每座廟宇每小時一次。';
    act = `<button class="btn pri" data-act="pray" data-id="${id}" ${inR && !pd ? '' : 'disabled'}>參拜</button>`;
  } else if (e.kind === 'chest') {
    desc = '路邊的寶箱。裡面通常有通貨，偶爾是裝備……也可能是寶箱怪。';
    act = `<button class="btn pri" data-act="openChest" data-id="${id}" ${inR ? '' : 'disabled'}>打開</button>`;
  } else if (e.kind === 'event') {
    desc =
      {
        merchant: '流浪商人只在這裡停留到下次地圖刷新，賣比較好的稀有裝備，還有混沌石。',
        rift: '裂隙裡會連續湧出 3 波魔法怪物，最後一波是稀有怪物。完成可得大量通貨。',
        fountain: '喝下泉水，30 分鐘內經驗與掉落提高 20%。'
      }[e.sub] +
      `<br><span class="sub">${e.town === '路邊' ? '路邊的限時事件' : `出現在${esc(e.town)}附近`}，怪物刷新（每 15 分鐘）前有效。</span>`;
    act = isDone(e)
      ? '<button class="btn" disabled>已完成</button>'
      : `<button class="btn pri" data-act="event" data-id="${id}" ${inR ? '' : 'disabled'}>${{ merchant: '交易', rift: '進入裂隙', fountain: '喝下泉水' }[e.sub]}</button>`;
  } else if (e.kind === 'stele' || e.kind === 'circle') {
    const done = isDone(e),
      nm = e.kind === 'stele' ? '空白石碑卷（單人）' : '空白魔法陣卷（4 人）';
    const st = e.kind === 'stele';
    desc = done
      ? '已經封印或挑戰過了，每小時整點會出現新的。'
      : `兩種用法，都要自己放入${st ? '碑文碎片（0～3 片）' : '石碑（4～6 個）'}：<br>・<b>當場挑戰</b>：不用卷軸，直接在這裡${st ? '開打單人石碑（每片碎片 +1 層，怪物 Lv 玩家 +2，通關得到石碑）' : '組隊開打 20 層魔法陣（倒下不會復活）'}，這座會被用掉。<br>・<b>壓縮封印</b>：收進背包變成【${nm}】，之後再到「冒險 → 石碑」開啟。`;
    act =
      `<button class="btn pri" data-act="siteGo" data-id="${id}" ${inR && !done ? '' : 'disabled'}>當場挑戰（選擇${st ? '碑文碎片' : '石碑'}）</button>` +
      `<button class="btn" data-act="seal" data-id="${id}" ${inR && !done ? '' : 'disabled'}>壓縮封印</button>`;
  } else if (e.kind === 'vein') {
    const done = isDone(e);
    desc = done ? '靈脈已經枯竭，每小時整點會恢復。' : '湧出靈氣的地脈。採集可以得到刻印石，偶爾有混沌刻印石。';
    act = `<button class="btn pri" data-act="gather" data-id="${id}" ${inR && !done ? '' : 'disabled'}>採集</button>`;
  } else if (e.kind === 'obelisk') {
    const n = (S.obel && S.obel[e.id]) || 0;
    desc = `冥府之力從地底湧出，方圓 ${OB_R} 公尺內的怪物帶著冥府詞綴（名字前有「冥府・」，非常危險）。在範圍內擊敗被侵蝕的怪物替柱子充能（${n}/${OB_NEED}），滿了就能召喚「冥府看門人」，打倒它可以解除侵蝕並得到冥府碎片。`;
    act = `<button class="btn pri" data-act="summon" data-id="${id}" ${inR && n >= OB_NEED ? '' : 'disabled'}>${n >= OB_NEED ? '召喚冥府看門人' : `充能 ${n}/${OB_NEED}`}</button>`;
  } else if (e.kind === 'flag') {
    desc = `你插下的冒險營旗，還有 ${Math.ceil((e.f.until - now()) / 60e3)} 分鐘。半徑 ${flagR()} 公尺內的東西不用在現場也能互動。`;
    act = `<button class="btn pri" data-act="sheet" data-s="base">管理據點</button>`;
  } else if (e.kind === 'ualtar') {
    const p = udProg(e.zid),
      used = isDone(e);
    desc = used
      ? '這座祭壇的軍團長已經打倒了。亡靈區每 3 小時重新出現。'
      : `亡靈從地底爬出的祭壇。在這個亡靈區擊敗亡靈累積進度（目前 ${p}%），滿 100% 就能在這裡挑戰「亡靈軍團長」，打完進度歸 0；每座祭壇只能打一次。軍團長會掉亡靈王的骸骨，集滿 ${KING_NEED} 個可以在任一座祭壇召喚亡靈王（目前 ${S.cur.kBone || 0}/${KING_NEED}）。`;
    act =
      `<button class="btn pri" data-act="udBoss" data-id="${id}" ${inR && !used && p >= 100 ? '' : 'disabled'}>${used ? '已挑戰' : p >= 100 ? '挑戰亡靈軍團長' : `進度 ${p}%`}</button>` +
      `<button class="btn" data-act="udKing" data-id="${id}" ${inR && S.cur.kBone >= KING_NEED ? '' : 'disabled'}>召喚亡靈王（骸骨 ${S.cur.kBone || 0}/${KING_NEED}）</button>`;
  } else if (e.kind === 'mseal') {
    const z = MZ.find(q => q.id === e.id),
      p = mistProg(e.id);
    desc = z
      ? `強度 ${ROMAN[z.tier]}：方圓 ${z.r} 公尺被魔霧籠罩（地圖上的紫色圓圈），範圍內的怪物帶魔霧詞綴、等級 +${z.tier}，還會出現魔霧專屬怪。在範圍內打怪累積進度（目前 <b>${p}%</b>），滿 100% 魔霧碎裂，得到 ${z.tier + 1} 片魔霧碎片。剩 ${Math.max(1, Math.ceil((z.until - now()) / 60e3))} 分鐘散去。` +
        bar('魔霧進度', p, 100, '#b06bff')
      : '這團魔霧已經碎裂了。';
    act = '';
  } else if (e.kind === 'sinst') {
    const x = Math.min(SIN_EXTRA, SEL.sinX || 0),
      need = SIN_COST + x,
      done = isDone(e);
    desc = done ? '這座雕像已經挑戰過了，每 2 小時會換一輪。' : sinHTML(e);
    act = done
      ? ''
      : `<div class="btns"><button class="btn sm" data-act="sinX" data-id="${id}" data-v="-1" ${x > 0 ? '' : 'disabled'}>－ 少放 1 片</button><button class="btn sm" data-act="sinX" data-id="${id}" data-v="1" ${x < SIN_EXTRA ? '' : 'disabled'}>＋ 多放 1 片</button></div><button class="btn pri" data-act="sinGo" data-id="${id}" ${inR && (S.cur.mfrag || 0) >= need ? '' : 'disabled'}>放入 ${need} 片魔霧碎片挑戰</button>`;
  } else if (e.kind === 'zodiac') {
    ({ desc, act } = zodEntHTML(e, inR));
  } else if (e.kind === 'base') {
    desc = `你的${baseName(e.b)}，回到這裡會恢復全部狀態。`;
    act = `<button class="btn pri" data-act="sheet" data-s="base">管理據點</button>`;
  } else if (e.kind === 'town') {
    const t = e.t,
      done = S.cleared[t.id] === hepoch(),
      lv = townLv(t),
      known = S.found[t.id];
    desc = known ? `以真實地標「${esc(t.n)}」為中心的城鎮。` : '還沒探索過的城鎮。走到這裡就能解鎖，並獲得發現獎勵。';
    act = !known
      ? ''
      : (t.svc.includes('inn')
          ? `<button class="btn" data-act="inn" ${inR ? '' : 'disabled'}>旅店休息・15 金</button>`
          : '') +
        (t.svc.includes('temple')
          ? `<button class="btn" data-act="pray" data-id="${id}" ${inR && !prayed(id) ? '' : 'disabled'}>${prayed(id) ? '已參拜（每小時一次）' : '參拜'}</button>`
          : '') +
        `<button class="btn" data-act="shop" data-id="${id}" ${inR ? '' : 'disabled'}>商店（購買・出售裝備）</button>` +
        `<button class="btn" data-act="gemShop" data-id="${id}" ${inR ? '' : 'disabled'}>技能石商店</button>` +
        `<button class="btn pri" data-act="trial" data-id="${id}" ${inR && !done ? '' : 'disabled'}>${done ? '試煉已完成（整點重開）' : `地標試煉「${esc(t.dn)}」Lv${lv}`}</button>` +
        tierTownHTML(e, inR) +
        ascTownHTML(e, inR);
  }
  const title = e.kind === 'town' && !S.found[e.id] ? '未探索的城鎮' : e.name;
  $('sbody').innerHTML =
    `<div class="ent">${e.kind === 'monster' ? '' : '<canvas id="entBig" width="18" height="18" style="width:84px;height:84px"></canvas>'}<div style="flex:1;min-width:0;display:grid;gap:4px"><b style="font-family:var(--f-pix);font-size:19px;font-weight:400;color:${e.kind === 'monster' ? RCOL[e.rar || 0] : 'inherit'}">${esc(title)}${e.lv && e.kind !== 'town' ? ` <span class="sub">Lv${e.lv}</span>` : ''}</b><span class="sub">${d < 5 ? '就在這裡' : dirName(S.lat, S.lng, e.lat, e.lng) + '方 ' + fmtD(d)}</span></div></div>
    ${pre}<p class="sub" style="color:var(--ink)">${desc}</p>${siteBonus(e) ? `<p class="sub" style="color:var(--gold)">✦ 現場加成：人在這裡當場挑戰，掉寶數量與稀有度 +${ONSITE_BONUS}%</p>` : ''}${zn ? `<p class="sub" style="color:var(--good)">在${esc(zn.name)}的範圍內，不用走過去就能互動（遠端沒有現場加成）。</p>` : ''}${inR ? '' : `<p class="sub" style="color:#ffb27a">距離太遠，需要走到 ${lim} 公尺內（還差 ${fmtD(d - lim)}）。</p>`}
    <div class="btns" style="flex-direction:column">${act}${!inR ? `<button class="btn" data-act="walkto" data-id="${id}">走過去</button>` : ''}</div>`;
  if ($('entBig')) {
    /* PNG 怪物圖比 18×18 大：畫布跟著圖的大小，CSS 一樣顯示 84px */
    const ic = entIcon(e),
      cv = $('entBig');
    cv.width = ic.width;
    cv.height = ic.height;
    cv.getContext('2d').drawImage(ic, 0, 0);
  }
}
/* 開打前的陣容：這場會遇到的每一隻怪（圖示、名字、等級），帶頭的放大、顏色是稀有度；狩獵中附上獵殺強化 */
function lineupHTML(e) {
  const n = packN(e),
    L = huntLv(),
    c = huntCfg(),
    lv = e.lv + (L ? c.lv : 0),
    pf = e.mist ? (e.ud ? '霧中亡靈・' : '魔霧・') : '',
    mates = packBases({ ud: e.ud, mist: e.mist, lv }, n, packSeed(e)),
    card = (b, name, lvl, col, big) =>
      `<div class="lu${big ? ' big' : ''}"${big ? ` style="border-color:${col}"` : ''}><img src="${portrait(b.spr, b.pal)}" alt=""><b style="color:${col}">${esc(name)}</b><small>Lv${lvl}</small></div>`;
  return `<div class="lineup"><div class="luh">⚔ 本次戰鬥 <b>${n + 1}</b> 隻${n ? '<span>（成群）</span>' : ''}</div><div class="lurow">${card(e.base, e.name, lv, RCOL[e.rar || 0], 1)}${mates.map(m => card(m.b, pf + m.b.name, m.lv, '#d8d0c4')).join('')}</div>${L ? `<div class="luhunt">🩸 獵殺 ${c.n}：全部等級 +${c.lv}、生命 +${c.hp}%、攻擊 +${c.atk}%</div>` : ''}</div>`;
}
/* 0.3.10 T 級：城鎮的突破試煉按鈕（打過就解鎖下一個 T） */
function tierTownHTML(e, inR) {
  const t = tierMax();
  if (t >= T_MAX) return '';
  const need = tierNeed(),
    ok = inR && S.lv >= need && !D;
  return `<button class="btn" data-act="tierTrial" data-id="${e.id}" ${ok ? '' : 'disabled'}>突破試煉 T${t} → T${t + 1}${S.lv < need ? `（需要 Lv${need}）` : `・Lv${TIERS[t][0] + 1}・4 層`}</button>`;
}
/* 突破試煉通關（dungeonClear 呼叫） */
function tierUpDone() {
  const t = Math.min(T_MAX, tierMax() + 1);
  S.tmax = S.tier = t;
  addLog(`突破到 T${t}`);
  refreshEntities(true);
  const [lo, hi] = tierRange(t),
    b = tierBonus(t);
  return `<p style="color:var(--gold)">突破成功！解鎖 T${t}：地圖怪物 Lv${lo}～${hi}，怪物強度 +${b.mon}%、稀有怪 +${b.rare}%、掉寶數量與稀有度 +${b.q}%、機制王掉落 +${b.boss}%。</p>`;
}
/* T 級說明與切換：可以回到比較低的 T 練功 */
function tierInfoHTML() {
  const cur = tierNow(),
    mx = tierMax(),
    [lo, hi] = tierRange(),
    b = tierBonus();
  return `<p>目前在 <b style="color:var(--gold)">T${cur}</b>（已解鎖到 T${mx}）：整張地圖的怪物、地城與事件都在 <b>Lv${lo}～${hi}</b> 之間，跟著你的等級在範圍內調整；等級超過上限，怪物就停在 Lv${hi}。</p>
    <p class="sub">目前加成：怪物生命與攻擊 +${b.mon}%・稀有怪機率 +${b.rare}%・掉寶數量 +${b.q}%・掉寶稀有度 +${b.r}%・機制王（地城首領、七宗罪、亡靈軍團長與亡靈王、十二生肖）掉落 +${b.boss}%</p>
    <p class="sub">${mx < T_MAX ? `要往上突破：等級練到 Lv${tierNeed()}，到任一城鎮挑戰「突破試煉」。` : '已經解鎖全部 16 個 T。'}</p>
    <div class="tlist">${TIERS.map(([a, z], i) => `<button class="tl${i + 1 === cur ? ' on' : ''}" data-act="tierSet" data-v="${i + 1}" ${i + 1 <= mx && i + 1 !== cur && !B && !D && !MB ? '' : 'disabled'}><b>T${i + 1}</b><small>Lv${a}～${z}</small></button>`).join('')}</div>
    <p class="sub">點已解鎖的 T 可以切換（戰鬥與地城中不能換）。</p>`;
}
/* 人實際在現場（不是靠據點、營旗、絲綢之路的遠端範圍） */
const onSite = e => !!e && dist(S.lat, S.lng, e.lat, e.lng) <= reachOf(e);
/* 現場掉寶加成只給可以封印帶走的石碑、魔法陣（人在現場當場挑戰）；路邊野怪、地城、首領都不算（0.3.1.5） */
const ONSITE_K = new Set(['stele', 'circle']);
const siteBonus = e => !!e && ONSITE_K.has(e.kind) && onSite(e);
const inRange = e => !!e && (dist(S.lat, S.lng, e.lat, e.lng) <= reachOf(e) || inZone(e));

/* ================= bases ================= */
const prodRate = b => 60 * b.lv;
const stored = b => Math.floor(Math.min(prodRate(b) * 8, (prodRate(b) * (now() - b.last)) / 3.6e6));
const baseName = () => '主據點';
function flagCheck() {
  if (!mainBase()) return '先建立主據點';
  if (flagsOn().length >= FLAG_MAX) return `營旗最多同時 ${FLAG_MAX} 支`;
  if (S.gold < FLAG_COST) return `需要 ${FLAG_COST} 金幣`;
  if (flagsOn().some(f => dist(f.lat, f.lng, S.lat, S.lng) < 200)) return '這附近已經有營旗了';
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
    if (d.s === 'asc') {
      openAsc();
      return;
    }
    if (d.s === 'stele') SEL.site = null;
    openSheet(d.s);
  },
  closeSheet: () => closeSheet(),
  sheetBack: () => {
    const p = sheetParent();
    if (!p) return;
    sfx('tap');
    if (p[0] === 'bagHome') {
      SEL.bag = 'eq';
      SEL.sell = null;
      renderSheet();
    } else openSheet(p[0], p[1]);
    $('sbody').scrollTop = 0;
  },
  shopTab: d => {
    SHOP.mode = d.k;
    SEL.sell = d.k === 'sell' ? new Set() : null;
    sfx('tap');
    SHOP.render && SHOP.render();
  },
  shopPick: d => {
    const it = S.inv[+d.i];
    if (!it || !SEL.sell) return;
    if (it.lock) return toast('這件已上鎖，先到裝備詳情解鎖');
    SEL.sell.has(it.id) ? SEL.sell.delete(it.id) : SEL.sell.add(it.id);
    sfx('tap');
    SHOP.render && SHOP.render();
  },
  shopQuick: d => {
    A.sellQuick(d);
    SHOP.render && SHOP.render();
  },
  shopSellGo: () => {
    A.sellMany();
    SEL.sell = new Set();
    SHOP.render && SHOP.render();
  },
  ibInfo: d =>
    toast(
      d.k === 'gold' ? `金幣 ${S.gold}：買東西、住旅店、升級據點` : `魔晶 ${S.crystal}：升級據點用，打菁英怪與事件取得`
    ),
  tierInfo: () => {
    sfx('tap');
    showModal('T 級', tierInfoHTML(), [{ label: '知道了', pri: 1, fn: hideModal }]);
  },
  tierSet: d => {
    const t = +d.v;
    if (B || D || MB || t < 1 || t > tierMax() || t === tierNow()) return;
    S.tier = t;
    sfx('select');
    toast(`切換到 T${t}（Lv${tierRange(t).join('～')}）`);
    refreshEntities(true);
    renderHud();
    save();
    hideModal();
  },
  tierTrial: d => {
    const e = ENT.get(d.id),
      t = tierMax();
    if (!e || t >= T_MAX || S.lv < tierNeed() || !inRange(e) || D) return;
    closeSheet();
    enterDungeon(
      {
        id: `tier${t}_${e.id}`,
        kind: 'tier',
        dt: 'normal',
        lat: e.lat,
        lng: e.lng,
        lv: TIERS[t][0] + 1,
        floors: 4,
        onsite: siteBonus(e)
      },
      false
    );
  },
  zoneInfo: () => {
    const z = zoneAt(S.lat, S.lng).m;
    sfx('tap');
    showModal(
      `區域特性：${z.n}`,
      `<div class="zinfo"><img src="${iconURL(ZICON[z.n] || 'leaf')}" alt=""><div><b>${z.n}</b><p>${z.d}</p></div></div>
      <p class="sub">地圖分成一格一格的區域（約 ${ZONE_CELL / 1000} 公里見方），每 2 小時各自重新抽一種特性，影響在這一格裡打怪的獎勵。走到別的區域，上方資訊條的特性就會跟著換。</p>
      <div class="zlist">${ZMODS.map(m => `<div class="${m.n === z.n ? 'on' : ''}"><img src="${iconURL(ZICON[m.n] || 'leaf')}" alt=""><b>${m.n}</b><small>${m.d}</small></div>`).join('')}</div>`,
      [{ label: '知道了', pri: 1, fn: hideModal }]
    );
  },
  skFilter: d => {
    SEL.skf = d.k;
    sfx('tap');
    renderSheet();
  },
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
    if (SILK.view) silkView(null);
    follow = true;
    cam.z = Math.max(cam.z, 0.5);
    sfx('tap');
  },
  walkto: d => {
    const e = ENT.get(d.id);
    if (!e) return;
    const lim = reachOf(e) * 0.6,
      dd = dist(S.lat, S.lng, e.lat, e.lng),
      k = Math.max(0, 1 - lim / dd);
    simTarget = [S.lat + (e.lat - S.lat) * k, S.lng + (e.lng - S.lng) * k];
    follow = true;
    closeSheet();
  },
  fight: d => {
    const e = ENT.get(d.id);
    if (!inRange(e)) return;
    /* 狩獵中：獵殺等級加的等級直接用來產生怪物，再加生命與攻擊 */
    const en = makeEnemy(e.base, e.lv + (huntLv() ? huntCfg().lv : 0), e.rar, e.mods);
    if (e.hunt) en.name = e.name;
    if (huntLv()) huntBuff(en, true);
    startBattle(en, {
      entId: e.id,
      bg: e.base.bg,
      bounty: e.bounty,
      uw: e.uw,
      ud: e.ud,
      udBase: e.ud && e.base.name,
      mist: e.mist,
      mistBase: e.mist && e.base.name,
      hunt: e.hunt,
      pack: true,
      packN: packN(e),
      packSeed: packSeed(e),
      onsite: siteBonus(e)
    });
  },
  enter: d => {
    const e = ENT.get(d.id);
    if (!inRange(e) || isDone(e)) return;
    closeSheet();
    enterDungeon({ ...e, onsite: siteBonus(e) }, false);
  },
  trial: d => {
    const e = ENT.get(d.id);
    if (!inRange(e)) return;
    const t = e.t;
    if (S.cleared[t.id] === hepoch()) return;
    closeSheet();
    enterDungeon(
      { id: t.id, kind: 'landmark', dn: t.dn, lat: t.lat, lng: t.lng, lv: townLv(t), onsite: siteBonus(e) },
      false
    );
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
    if (!inRange(e) || prayed(e.id)) return;
    S.prayed = S.prayed || {};
    for (const k in S.prayed) if (S.prayed[k] !== hepoch()) delete S.prayed[k];
    S.prayed[e.id] = hepoch();
    quest('pray');
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
    quest('chest');
    if (e.mimic) {
      toast('寶箱張開了嘴——是寶箱怪！');
      startBattle(makeEnemy(MIMIC, aLv() + 1, 1, ['leech']), { bg: 'city' });
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
    giveCur('soul', 9);
    giveCur('wish');
    got.push(curDot('soul') + '靈魂 ×9', curDot('wish') + '祈願石');
    if (Math.random() < 0.2) {
      giveCur('eng');
      got.push(curDot('eng') + '刻印石');
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
    } else enterDungeon({ id: e.id, kind: 'rift', lat: e.lat, lng: e.lng, lv: e.lv, onsite: siteBonus(e) }, false);
  },
  skill: d => useSkill(d.k),
  gem: d => {
    selGem = d.id;
    sfx('tap');
    openSheet('gem');
  },
  gemEquip: d => {
    const i = +d.i;
    S.sk = S.sk.map(id => (id === selGem ? null : id));
    S.sk[i] = selGem;
    sfx('select');
    renderSheet();
    save();
  },
  gemOff: () => {
    S.sk = S.sk.map(id => (id === selGem ? null : id));
    renderSheet();
    save();
  },
  gemLv: () => {
    const g = gemOf(selGem);
    if (!g || gemLvBlock(g)) return;
    const n = soulNeed(g.lv);
    S.cur.soul -= n;
    g.dust += n;
    g.lv++;
    sfx(g.lv % 5 ? 'select' : 'level');
    toast(g.lv % 5 ? `${SKILLS[g.k].name} 升到 Lv${g.lv}` : `${SKILLS[g.k].name} Lv${g.lv}：開了一個新的刻印槽！`);
    renderSheet();
    save();
  },
  gemCraft: d => {
    const g = gemOf(selGem),
      nm = g && `${SKILLS[g.k].name} Lv${g.lv}`,
      res = gemCraft(g, d.c);
    if (res && d.c === 'vaal') {
      sfx(gemOf(selGem) ? 'level' : 'lose');
      buzz(120);
      addLog(`腐化 ${nm}：${res}`);
      showModal('腐化', `<p style="text-align:center">${res}</p>`, [{ label: '好', pri: 1, fn: hideModal }]);
      openSheet(gemOf(selGem) ? 'gem' : 'skills');
      save();
    } else if (res) {
      sfx(d.c === 'eng' ? 'select' : 'level');
      buzz(30);
      addLog(`使用${GCURI[d.c].n}：${SKILLS[g.k].name} Lv${g.lv}`);
      renderSheet();
      save();
    }
  },
  gemBreak: () => {
    const g = gemOf(selGem);
    if (!g) return;
    const v = gemSoulBack(g);
    showModal(
      '分解技能石',
      `<p>分解 ${SKILLS[g.k].name} Lv${g.lv}，退回 ${v} 個靈魂（升級花掉的 70%）？刻印詞綴會一起消失，之後可以再到商店買。</p>`,
      [
        {
          label: '分解',
          pri: 1,
          fn: () => {
            S.gems = S.gems.filter(q => q !== g);
            S.sk = S.sk.map(id => (id === g.id ? null : id));
            giveCur('soul', v);
            hideModal();
            sfx('select');
            toast(`退回 ${v} 個靈魂`);
            openSheet('skills');
            save();
          }
        },
        { label: '取消', fn: hideModal }
      ]
    );
  },
  /* 0.3.11 技能石商店（城鎮） */
  gemShop: d => {
    const e = ENT.get(d.id);
    if (!inRange(e)) return;
    SEL.gshop = e.id;
    SEL.gtier = SEL.gtier || Math.min(tierMax(), 5);
    openSheet('gemshop');
  },
  gshopTier: d => {
    SEL.gtier = +d.v;
    sfx('tap');
    renderSheet();
  },
  gemBuy: d => {
    const k = d.k,
      e = ENT.get(SEL.gshop);
    if (!SKILLS[k] || !inRange(e) || gemBuyBlock(k)) return;
    S.gold -= gemPrice(k);
    giveGem(k);
    sfx('coin');
    toast(`買下 ${SKILLS[k].name}`);
    addLog(`在${e.name}買下技能石：${SKILLS[k].name}`);
    renderSheet();
    renderHud();
    save();
  },

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
    const nit = S.inv[selItem.i],
      /* 雙手武器和副手不能同時裝：裝上一邊時另一邊收回背包 */
      clash = d.s === 'weapon' && twoHand(nit) ? 'offhand' : d.s === 'offhand' && twoHand() ? 'weapon' : null;
    if (clash && S.eq[clash] && S.inv.length >= 30 && !S.eq[d.s]) return toast('背包已滿，先騰出空間');
    const it = S.inv.splice(selItem.i, 1)[0],
      cur = S.eq[d.s];
    S.eq[d.s] = it;
    if (cur) S.inv.push(cur);
    if (clash && S.eq[clash]) {
      S.inv.push(S.eq[clash]);
      S.eq[clash] = null;
      toast(clash === 'offhand' ? '雙手武器：副手收回背包' : '裝上副手：雙手武器收回背包');
    }
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
    const cur = S.inv[selItem.i];
    if (!cur || cur.lock || !canSell()) return toast('要在城鎮或據點才能賣出裝備');
    const it = S.inv.splice(selItem.i, 1)[0];
    S.gold += sellVal(it);
    sfx('coin');
    toast(`賣出 ${itemTitle(it)} +${sellVal(it)} 金`);
    renderHud();
    if (selSlot) openSheet('slot', SLOTN[selSlot]);
    else openSheet('bag');
  },
  lock: () => {
    const it = S.inv[selItem.i];
    if (!it) return;
    it.lock = !it.lock;
    if (!it.lock) delete it.lock;
    sfx('tap');
    save();
    renderSheet();
  },
  sellMode: () => {
    SEL.sell = SEL.sell ? null : new Set();
    S.inv.forEach(it => it.id || (it.id = uid()));
    sfx('tap');
    renderSheet();
  },
  sellPick: d => {
    const it = S.inv[+d.i];
    if (!it || !SEL.sell) return;
    if (it.lock) return toast('這件已上鎖，先到裝備詳情解鎖');
    SEL.sell.has(it.id) ? SEL.sell.delete(it.id) : SEL.sell.add(it.id);
    sfx('tap');
    renderSheet();
  },
  sellQuick: d => {
    if (!SEL.sell) return;
    if (d.k === 'none') SEL.sell.clear();
    else
      S.inv.forEach(it => {
        if (it.lock) return;
        if (d.k === 'all' || (d.k === 'worse' ? worseThanEq(it) : d.k === 'r' + it.r)) SEL.sell.add(it.id);
      });
    sfx('tap');
    renderSheet();
  },
  sellMany: () => {
    if (!canSell()) return toast('要在城鎮或據點才能賣出裝備');
    const sel = sellSel();
    if (!sel.length) return;
    const gold = sel.reduce((n, it) => n + sellVal(it), 0);
    S.inv = S.inv.filter(it => !sel.includes(it));
    S.gold += gold;
    SEL.sell = S.inv.length ? new Set() : null;
    sfx('coin');
    toast(`賣出 ${sel.length} 件裝備 +${gold} 金`);
    addLog(`批量賣出 ${sel.length} 件裝備，得到 ${gold} 金`);
    save();
    renderHud();
    renderSheet();
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
    S.bases.push({ id: uid(), type: 'main', lat: S.lat, lng: S.lng, lv: 1, last: now() });
    sfx('level');
    addLog('建立了主據點');
    toast('主據點建立完成！');
    refreshEntities(true);
    renderSheet();
    save();
    baseSync();
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
    toast(`${baseName(b)} 升級到 Lv${b.lv}，半徑 ${baseR(b.lv)} 公尺`);
    refreshEntities(true);
    renderHud();
    renderSheet();
    save();
    baseSync();
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
    partyCreate({ ...e, onsite: siteBonus(e) });
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
  simSpd: d => {
    S.simSpd = +d.v;
    save();
    renderSheet();
  },
  autoPot: d => {
    S[d.k] = +d.v;
    save();
    renderSheet();
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
