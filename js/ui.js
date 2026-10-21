/* 漫步勇者 · HUD、底部面板、互動、藏身處、動作表 */
'use strict';
/* ================= HUD & sheets ================= */
function renderHud() {
  clampHP();
  const st = stats();
  $('hpb').style.width = (S.hp / st.maxhp) * 100 + '%';
  $('mpb').style.width = (S.mp / st.maxmp) * 100 + '%';
  /* 0.3.44 條上寫百分比 */
  $('hpt').textContent = Math.round((S.hp / st.maxhp) * 100) + '%';
  $('mpt').textContent = Math.round((S.mp / st.maxmp) * 100) + '%';
  $('lvTag').textContent = 'Lv' + S.lv;
  ibarRender();
  const a = $('ava').getContext('2d');
  a.clearRect(0, 0, 18, 18);
  a.drawImage(sprite(heroSpr('F'), heroPal()), 0, 0);
  $('ptDot').hidden =
    !(typeof pendPicks === 'function' && pendPicks() > 0) && !(typeof ascAlert === 'function' && ascAlert());
  /* 頭像上方的經驗值圓弧，快升級時發光 */
  const xr = Math.min(1, S.xp / xpNeed(S.lv));
  $('xpArc').style.strokeDasharray = `${xr * 100} 100`;
  $('xpArc').classList.toggle('near', xr >= 0.9);
}
/* 頂部資訊條：一局裡是金幣、背包、藥水；主選單是祈願石與魂晶（局外貨幣） */
function ibarRender() {
  const el = $('ibar');
  if (!el || !S) return;
  const chip = (act, data, ic, v, cls = '') =>
    `<button class="ib ${cls}" data-act="${act}" ${data}>${ic}<b>${v}</b></button>`;
  el.innerHTML = S.run
    ? chip('ibInfo', 'data-k="gold"', '<i style="color:var(--gold)">●</i>', S.gold) +
      chip(
        'sheet',
        'data-s="bag"',
        `<img src="${iconURL('bag')}" alt="">`,
        `${S.inv.length}/30`,
        S.inv.length >= 27 ? 'warn' : ''
      ) +
      chip('sheet', 'data-s="bag"', `<img src="${iconURL('heart')}" alt="">`, S.potions)
    : chip(
        'gacha',
        '',
        `<img src="${curIcon('wish')}" alt="">`,
        S.cur.wish || 0,
        (S.cur.wish || 0) >= GEM_DRAW * 10 ? 'hot' : ''
      ) + chip('ibInfo', 'data-k="soul"', '<i style="color:#9fe7ff">◆</i>', S.meta.soul);
}
/* 面板的選取狀態（背包分頁、批量賣出、篩選、商店） */
const SEL = { bag: 'eq' };
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
  base: '藏身處',
  quest: '委託',
  settings: '設定',
  log: '冒險日誌',
  friends: '好友',
  party: '組隊',
  skills: '技能',
  stele: '石碑與傳送門',
  gem: '技能石',
  gemshop: '技能石商店',
  pact: '契靈',
  pbrk: '契靈突破',
  seal: '印記兌換',
  asc: '昇華'
};
/* 底部導覽：群組按鈕點了往上展開 2～3 個功能，再點一次或點地圖就收起來 */
const NAVG = {
  me: [
    ['hero', '角色', 'shield'],
    ['skills', '技能', 'book'],
    ['asc', '昇華', 'crown'],
    ['log', '冒險日誌', 'book']
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
  const dot = s => (s === 'tree' && treePts() > 0) || (s === 'asc' && ascAlert()) || (s === 'skills' && supHint());
  el.innerHTML = NAVG[g]
    .map(
      ([s, n, ic], i) =>
        `<button class="nb" data-act="sheet" data-s="${s}" style="animation-delay:${i * 45}ms"><span>${n}</span><i><img src="${iconURL(ic)}" alt="">${dot(s) ? '<b class="ndot"></b>' : ''}</i></button>`
    )
    .join('');
  el.hidden = false;
  const r = btn.getBoundingClientRect(),
    w = el.offsetWidth;
  el.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - 23)) + 'px';
  el.style.bottom = innerHeight - r.top + 4 + 'px';
}
/* 0.3.31 摺疊說明（設計規範：規則、機制預設收起，點了才看） */
const more = (title, html) => `<details class="more"><summary>${title}</summary><div>${html}</div></details>`;
/* 0.3.43 會記住開關的摺疊（裡面有按鈕、按了會重畫面板的用這個，不然一按就收起來） */
const OPEN = new Set();
const moreK = (k, title, html) =>
  `<details class="more" data-keep="${k}"${OPEN.has(k) ? ' open' : ''}><summary>${title}</summary><div>${html}</div></details>`;
document.addEventListener(
  'toggle',
  e => {
    const k = e.target.dataset && e.target.dataset.keep;
    if (k) e.target.open ? OPEN.add(k) : OPEN.delete(k);
  },
  true
);
function bar(label, v, max, col) {
  return `<div style="display:grid;gap:3px"><div class="rowx" style="font-size:12px;color:var(--dim)"><span>${label}</span><span>${Math.ceil(v)} / ${max}</span></div><div class="mbar" style="height:8px"><i style="width:${Math.max(0, Math.min(100, (v / max) * 100))}%;background:${col}"></i></div></div>`;
}
const fmt1 = v => Math.round(v);
function curRow() {
  return `<div class="chips">${CUR.map(c => `<span class="chip${S.cur[c.id] ? '' : ' zero'}" aria-label="${c.n}"><img src="${curIcon(c.id)}" alt=""><b>${S.cur[c.id] || 0}</b></span>`).join('')}</div>`;
}
/* 0.3.44 藥水列：目前的量＋喝了會回到哪裡（閃爍的那段），按右邊直接喝 */
function potRow(k) {
  const st = stats(),
    hp = k === 'potions',
    cur = hp ? S.hp : S.mp,
    max = hp ? st.maxhp : st.maxmp,
    v = potVal(k, st),
    to = Math.min(max, cur + v),
    pc = x => Math.round((x / max) * 100),
    full = cur >= max;
  return `<div class="potr"><img src="${pixURL(hp ? 'ic_potion' : 'ic_ether')}" alt=""><div class="pbar ${hp ? 'php' : 'pmp'}"><i class="now" style="width:${pc(cur)}%"></i><i class="gain" style="left:${pc(cur)}%;width:${pc(to) - pc(cur)}%"></i><em>${pc(cur)}%${full ? '' : ` → ${pc(to)}%`}</em></div><button class="btn sm" data-act="use" data-k="${k}" ${S[k] && !full ? '' : 'disabled'}>${full ? '已滿' : `喝 ×${S[k]}`}</button></div>`;
}
/* 0.3.43 通貨的名稱與效果（背包、裝備詳情的摺疊說明） */
const curHelp = () =>
  more(
    '通貨說明',
    CUR.map(c => `<p><img class="cico" src="${curIcon(c.id)}" alt=""><b>${c.n}</b>：${c.d}</p>`).join('')
  );
/* 背包上方分頁：裝備與各種地城材料 */
/* 0.3.44 特殊倉庫（像 PoE 的通貨、碎片倉庫頁）：有東西的才出現，點了才進去看 */
const MAT_IC = {
  insc: 'book',
  tabs: 'rune',
  frags: 'skull',
  scroll: 'book',
  ess: 'skull',
  demon: 'eye',
  jewels: 'star'
};
/* 0.3.44 跟穿戴中的比：把這件換上去重算屬性（傷害、防禦），回傳差多少（比例）；戒指取比較好的那一格 */
function eqPower(st) {
  const hit = Math.max(1, (st.physLo + st.physHi) / 2 + st.fire + st.cold + st.light + st.chaos),
    cf = 1 + (st.crit / 100) * (st.critMulti / 100 - 1),
    rs = Math.max(0, (st.res.fire + st.res.cold + st.res.light + st.res.chaos) / 4);
  return {
    dmg: hit * cf * (st.spellMul || 1) * (st.speed / 10),
    def: (st.maxhp / (1 - (st.armor / (st.armor + 400)) * 0.6) / (1 - rs / 100)) * (1 + (st.dodge || 0) / 100)
  };
}
function eqCmp(it) {
  const base = eqPower(stats());
  let best = null;
  for (const sl of it.slot === 'ring' ? ['ring1', 'ring2'] : [it.slot]) {
    const old = S.eq[sl];
    let st;
    S.eq[sl] = it;
    try {
      st = stats();
    } finally {
      S.eq[sl] = old;
    }
    const p = eqPower(st),
      r = { sl, dmg: p.dmg / base.dmg - 1, def: p.def / base.def - 1 };
    r.s = r.dmg + r.def * 0.7;
    if (!best || r.s > best.s) best = r;
  }
  return best;
}
/* 格子上的角標：▲ 綠（比較強）、▼ 紅（比較弱），差不到 2% 不標 */
const cmpBadge = it => {
  const c = eqCmp(it);
  return c.s > 0.02 ? '<i class="badge up">▲</i>' : c.s < -0.02 ? '<i class="badge dn">▼</i>' : '';
};
/* 「傷害 +12%・防禦 -3%」 */
const cmpTxt = c =>
  [
    ['傷害', c.dmg],
    ['防禦', c.def]
  ]
    .filter(([, v]) => Math.abs(v) >= 0.005)
    .map(
      ([n, v]) =>
        `<span class="${v > 0 ? 'c-good' : 'c-bad'}">${n} ${v > 0 ? '▲' : '▼'}${Math.round(Math.abs(v) * 100)}%</span>`
    )
    .join('・') || '<span class="c-dim">差不多</span>';
const curRowG = () =>
  `<div class="curs">${GCUR.map(c => `<span title="${c.d}"><img class="cico lg" src="${curIcon(c.id)}" alt=""><span>${c.n}<b>${S.cur[c.id] || 0}</b></span></span>`).join('')}</div>`;
/* 技能說明：類別、傷害、目標形式與特殊效果；0.3.18 特殊效果的關鍵字上色（kw） */
const BUFFN = {
  more: '傷害',
  arm: '護甲',
  dodge: '閃避',
  crit: '暴擊率',
  taunt: '嘲諷',
  dmgRed: '受傷降低',
  spd: '速度'
};
const kw = (t, c) => `<i class="kw ${c}">${t}</i>`;
/* 0.3.18 換武器後，技能欄裡武器不符的技能提示（戰鬥中不能用） */
function wepWarn(sl) {
  if (sl !== 'weapon') return;
  const st = stats(),
    bad = mySkills().filter(q => q && !wOk(st, q));
  if (bad.length)
    toast(
      `${bad.map(q => q.name).join('、')} 需要${[...new Set(bad.map(q => WTAGN[q.w]))].join('／')}，現在的武器不能用`
    );
}
function gemDesc(q, st) {
  const out = [],
    elc = q.kind === 'spell' ? q.el || 'phys' : 'phys';
  if (q.kind === 'aura') {
    out.push(
      `${kw('光環', 'buf')}・預留 ${kw(auraCost(q) + ' 精魄', 'num')}：` +
        Object.entries(q.aura || {})
          .map(([k, v]) => (STATN[k] ? STATN[k](v) : `${k} +${v}`))
          .join('、')
    );
    for (const k in q.avs || {})
      out.push(
        `所有傷害技能對${kw(COND_ST[k] || k, 'eff')}的目標 +${q.avs[k]}%${k === 'bleed' || k === 'poison' ? '（每層）' : ''}`
      );
    if (q.party)
      out.push(
        kw('組隊時隊友也受益', 'tg') +
          '：' +
          Object.entries(q.pb || {})
            .map(([k, v]) => (k === 'hot' ? `每 ${TURN_S} 秒回復 ${v}% 生命` : `${BUFFN[k] || k} +${v}%`))
            .join('、')
      );
    return out.join('・');
  }
  if (q.pet) out.push(`召喚 ${q.pet.n || 1} 隻${kw(q.pet.name, 'buf')}（${secs(q.pet.turns)} 秒、最多 ${q.pet.max}）`);
  else if (q.kind === 'spell')
    out.push(`${kw(EL[q.el] + '法術', elc)}・基礎傷害 ${kw(Math.round(q.sb * q.mult), 'num')}`);
  else if (q.kind === 'attack')
    out.push(
      `${q.w ? WTAGN[q.w] : ''}攻擊・武器傷害 ${kw(Math.round(q.mult * 100) + '%', 'num')}${q.hits > 1 ? ` × ${kw(q.hits + ' 下', 'num')}` : ''}`
    );
  else if (q.kind === 'heal')
    out.push(`回復 ${kw(Math.round(q.heal * 100) + '%', 'num')} 生命${q.healAll ? `，其他隊友 ${q.healAll}%` : ''}`);
  if (q.tg === 'all') out.push(kw('打全部敵人', 'tg'));
  if (q.tg === 'rand') out.push(kw(`隨機打 ${q.hits || 1} 下`, 'tg'));
  if (q.chain) out.push(kw(`連鎖 ${q.chain} 次`, 'tg') + '（每次 -20%）');
  if (q.proj) out.push(kw(`多 ${q.proj} 支投射物`, 'tg') + '（各 70%）');
  if (q.addEl) out.push(`附加 ${Math.round(q.addEl[1] * 100)}% ${kw(EL[q.addEl[0]], q.addEl[0])}`);
  if (q.stun) out.push(`${Math.round(q.stun * 100)}% 機率${kw('暈眩', 'eff')}`);
  if (q.freeze) out.push(`${Math.round(q.freeze * 100)}% 機率${kw('凍結', 'eff')}`);
  if (q.bleed) out.push(`${q.bleed}% 機率${kw('流血', 'eff')}`);
  if (q.poison) out.push(`造成${kw('中毒', 'eff')}（${secs(q.poison)} 秒）`);
  if (q.mark) out.push(`${kw('標記', 'eff')}目標（受傷 +${q.mark}%）`);
  if (q.curse) out.push(`${kw('詛咒', 'eff')}目標（受傷 +${q.curse}%）`);
  if (q.exec) out.push(`${kw('斬殺', 'eff')}：低血敵人傷害 +${q.exec}%`);
  if (q.brk) out.push(`${kw('碎甲', 'eff')}：無視 ${q.brk}% 護甲`);
  if (q.guard) out.push(`${kw('格擋', 'buf')} ${secs(q.guard)} 秒（護甲加倍）`);
  if (q.buff)
    out.push(
      `${kw(q.buff.n, 'buf')} ${secs(q.buff.turns)} 秒：` +
        Object.entries(q.buff)
          .filter(([k]) => BUFFN[k])
          .map(([k, v]) => `${BUFFN[k]} ${k === 'dmgRed' ? '-' : '+'}${Math.round(v)}%`)
          .concat(q.buff.shield ? [`護盾 ${Math.round(q.buff.shield * 100)}% 生命`] : [])
          .join('、')
    );
  /* 0.3.19 條件與狀態連動 */
  const SN = typeof COND_ST !== 'undefined' ? COND_ST : {};
  if (q.ignite) out.push(`必定${kw('燃燒', 'fire')}`);
  if (q.foes > 0) out.push(`每多一隻敵人傷害 ${kw('+' + q.foes + '%', 'num')}（最多算 5 隻）`);
  if (q.foes < 0) out.push(`每多一隻敵人，每隻傷害 ${kw(q.foes + '%', 'bad')}`);
  if (q.vs)
    for (const k in q.vs)
      out.push(
        `對${kw(SN[k] || k, 'eff')}的目標傷害 ${kw('+' + q.vs[k] + '%', 'num')}${k === 'poison' || k === 'bleed' ? '（每層）' : ''}`
      );
  if (q.vsCrit) out.push(`對${kw(SN[q.vsCrit], 'eff')}的目標${kw('必定暴擊', 'num')}`);
  if (q.consume) out.push(`命中後${kw('消耗', 'eff')}目標的${SN[q.consume]}`);
  if (q.det)
    out.push(
      `${kw('引爆', 'eff')}目標的${kw(SN[q.det], 'eff')}：剩下的持續傷害一次結算${q.detMul && q.detMul !== 1 ? `（×${q.detMul}）` : ''}`
    );
  if (q.shockChain) out.push(`目標${kw('感電', 'light')}時${kw(`多連鎖 ${q.shockChain} 次`, 'tg')}`);
  if (q.lowT) out.push(`對生命低於 30% 的目標傷害 ${kw('+' + q.lowT + '%', 'num')}`);
  if (q.fullT) out.push(`對滿血目標傷害 ${kw('+' + q.fullT + '%', 'num')}`);
  if (q.lowMe) out.push(`自己每少 10% 生命，傷害 ${kw('+' + q.lowMe + '%', 'num')}`);
  if (q.combo) out.push(`${kw('連續使用', 'eff')}每次傷害 ${kw('+' + q.combo + '%', 'num')}（最多 5 層，換招歸零）`);
  if (q.petN) out.push(`每隻召喚物讓傷害 ${kw('+' + q.petN + '%', 'num')}`);
  if (q.charge)
    out.push(`${kw('蓄力', 'eff')}：這次行動先蓄力，下次放同一招傷害 ${kw('×' + q.charge, 'num')}（蓄力時被打會減弱）`);
  if (q.slow) out.push(`${kw('衰老', 'eff')}：目標行動條變慢 ${secs(q.slow)} 秒`);
  if (q.vulP) out.push(`${kw('脆弱', 'eff')}：目標受到的物理傷害 +${q.vulP}%（${secs(3)} 秒）`);
  if (q.vulE) out.push(`${kw('元素弱化', 'eff')}：目標受到的元素傷害 +${q.vulE}%（${secs(3)} 秒）`);
  if (q.dmark) out.push(`${kw('死亡印記', 'eff')}：目標 ${secs(3)} 秒內死亡時，回復 10% 生命與魔力`);
  if (q.spreadSt) out.push(`把目標身上的${kw('詛咒、印記、易傷、衰老', 'eff')}${kw('擴散', 'tg')}給全部敵人`);
  if (q.killBoom) out.push(`擊殺時${kw('爆炸', 'fire')}：這下傷害的 ${q.killBoom}% 打其他敵人`);
  if (q.sac) out.push(`${kw('引爆', 'eff')}一隻召喚物，炸全部敵人（召喚物傷害 ×${q.sac}）`);
  if (q.cmd) out.push(`所有召喚物${kw('立刻再行動一次', 'buf')}`);
  if (q.healLow) out.push(`目標每少 10% 生命，治療量 ${kw('+' + q.healLow + '%', 'num')}`);
  if (q.cry) {
    out.push(kw(`吼全部敵人${q.party ? '（全隊受益）' : ''}`, 'tg'));
    if (q.perFoe)
      out.push(
        `每吼到一隻敵人（最多 5 隻）：${Object.entries(q.perFoe)
          .map(([k, v]) => `${BUFFN[k] || k} ${k === 'dmgRed' ? '-' : '+'}${v}%`)
          .join('、')}`
      );
    if (q.lowMeBuff) out.push(`自己每少 10% 生命，傷害再 ${kw('+' + q.lowMeBuff + '%', 'num')}`);
    if (q.emp) out.push(`強化接下來的 ${kw('N 次攻擊', 'num')}（N = 吼到的敵人數）：傷害 +${q.emp}%`);
    if (q.fear) out.push(`生命低於 ${q.fear}% 的敵人${kw('恐懼', 'eff')}，跳過下一次行動`);
    if (q.cryCurse)
      out.push(
        `全部敵人${kw('震懾', 'eff')}：受傷 +${q.cryCurse}%${q.cryWeak ? `、攻擊 -${q.cryWeak}%` : ''}（${secs(3)} 秒）`
      );
    if (q.avUp) out.push(`全隊${kw('行動條', 'buf')} +${q.avUp}%`);
  }
  /* 0.3.22 戰場單位 */
  if (q.totem)
    out.push(
      `${kw('放置圖騰', 'buf')}（生命 ${Math.round((q.totem.hp || 0.35) * 100)}%、${secs(q.totem.turns || 4)} 秒，敵人會打它${q.totem.taunt ? '，很會吸引攻擊' : ''}）${q.totem.cry ? `：每 ${TURN_S} 秒給你 ${q.totem.cry.n} 傷害 +${q.totem.cry.more}%` : q.mult ? `：每 ${TURN_S} 秒施放（${Math.round((q.totem.mul || 1) * 100)}% 傷害）` : ''}`
    );
  if (q.turret)
    out.push(
      `${kw('放置砲台', 'buf')}（${secs(q.turret.turns || 4)} 秒、打不到）：每 ${TURN_S} 秒射擊（${Math.round((q.turret.mul || 1) * 100)}% 傷害）`
    );
  if (q.trap)
    out.push(
      `${kw('佈置陷阱', 'eff')}：下一隻行動的敵人先觸發（${Math.round((q.trap.mul || 1) * 100)}% 傷害，最多 3 個）`
    );
  if (q.mine)
    out.push(
      `${kw('放置地雷', 'eff')}：最多疊 5 顆，按「引爆地雷」一次炸掉（每顆 ${Math.round((q.mine.mul || 1) * 100)}%，每多一顆每顆 +10%）`
    );
  /* 0.3.35 冷卻以秒計（含輔助寶石加的、冷卻縮減）；自動施放 */
  {
    const c = skCdS(st || {}, q);
    if (c > 0) out.push(kw(`冷卻 ${c} 秒`, 'bad'));
    if (supOf(st || {}, q).auto) out.push(kw('自動施放', 'buf'));
  }
  if (q.lifeCost) out.push(kw(`消耗 ${Math.round(q.lifeCost * 100)}% 生命`, 'bad'));
  if (q.w) out.push(st && !wOk(st, q) ? kw(`需要${WTAGN[q.w]}（目前不能用）`, 'bad') : `需要${WTAGN[q.w]}`);
  if (q.oh) out.push(st && !wOk(st, q) ? kw('需要盾（目前不能用）', 'bad') : '需要盾');
  return out.join('・');
}
/* 技能頁的篩選：全部、全體、單體、物理、元素、輔助（增益、治癒、召喚） */
const SKF = [
  ['all', '全部'],
  ['aoe', '全體'],
  ['one', '單體'],
  ['phys', '物理'],
  ['ele', '元素'],
  ['chaos', '混沌'],
  ['sup', '輔助']
];
/* 0.3.36 武器篩選（技能頁與商店共用，SEL.skw） */
const SKW = [
  ['all', '全部武器'],
  ['mine', '目前武器能用'],
  ['sword', '劍'],
  ['axe', '斧鎚'],
  ['bow', '弓'],
  ['xbow', '弩'],
  ['dagger', '匕首爪'],
  ['spear', '矛'],
  ['staff', '法杖'],
  ['shield', '盾'],
  ['none', '不限武器']
];
function skwOk(k) {
  const q = SKILLS[k],
    f = SEL.skw || 'all';
  if (f === 'all') return true;
  if (f === 'mine') return wOk(stats(), q);
  if (f === 'shield') return q.oh === 'shield';
  if (f === 'none') return !q.w && !q.oh;
  return q.w === f || (q.w === 'melee' && f !== 'bow' && f !== 'xbow');
}
/* 0.3.44 篩選改成兩個下拉（類型、武器），技能頁與商店共用 */
const skfSel = () =>
  `<span class="sels"><select class="sel" data-chg="skFilter" aria-label="類型">${SKF.map(([k, n]) => `<option value="${k}"${(SEL.skf || 'all') === k ? ' selected' : ''}>${n}</option>`).join('')}</select><select class="sel" data-chg="skWep" aria-label="武器">${SKW.map(([k, n]) => `<option value="${k}"${(SEL.skw || 'all') === k ? ' selected' : ''}>${n}</option>`).join('')}</select></span>`;
const skfRows = () => `<div class="selrow">${skfSel()}</div>`;
/* 0.3.36 輔助寶石商店的分類 */
const SUPF = [
  ['all', '全部'],
  ['dmg', '傷害'],
  ['attack', '攻擊'],
  ['spell', '法術'],
  ['ele', '元素／混沌'],
  ['pet', '召喚'],
  ['util', '增益與其他']
];
function supfOk(sp) {
  const f = SEL.supf || 'all',
    r = sp.req;
  if (f === 'all') return true;
  if (f === 'dmg') return ['dmg', 'one', 'aoe'].includes(r);
  if (f === 'attack') return ['attack', 'melee'].includes(r);
  if (f === 'spell') return r === 'spell';
  if (f === 'ele')
    return ['fire', 'cold', 'chaos'].includes(r) || Object.keys(sp.sup || {}).some(k => /^(g|cv)[A-Z]/.test(k));
  if (f === 'pet') return ['pet', 'unit'].includes(r);
  return ['cry', 'buff', 'cd', 'act'].includes(r);
}
function skfOk(g) {
  const q = SKILLS[g.k],
    f = (typeof SEL !== 'undefined' && SEL.skf) || 'all',
    dmg = !q.pet && (q.kind === 'attack' || q.kind === 'spell');
  if (f === 'aoe') return dmg && (q.tg === 'all' || q.tg === 'rand' || !!q.chain || !!q.proj);
  if (f === 'one') return dmg && !q.tg && !q.chain && !q.proj;
  if (f === 'phys') return dmg && (q.kind === 'attack' || (q.el || 'phys') === 'phys');
  if (f === 'ele')
    return (
      dmg &&
      ((q.kind === 'spell' && q.el && !['phys', 'chaos'].includes(q.el)) || (!!q.addEl && q.addEl[0] !== 'chaos'))
    );
  if (f === 'chaos') return dmg && (q.el === 'chaos' || (!!q.addEl && q.addEl[0] === 'chaos'));
  if (f === 'sup') return !dmg;
  return true;
}
/* 技能石圖示：左上等級、右上插槽（亮的是插了輔助寶石）、右下「裝」表示在技能欄；底色依種類（攻擊、法術、輔助），0.3.11 起沒有星級 */
const gemKc = k => (SKILLS[k].kind === 'spell' ? 'ks' : SKILLS[k].kind === 'attack' ? 'ka' : 'ku');
const gemCell = (g, noEq) => {
  const n = g.sock || 2,
    m = (g.sp || []).length;
  return `<span class="gtile ${gemKc(g.k)}${g.cor ? ' gcor' : ''}"><img src="${skIcon(g.k, SKILLS[g.k].icon)}" alt=""><i class="glv">${g.lv}</i><span class="gen">${Array.from({ length: n }, (_, i) => `<i class="${i < m ? 'f' : ''}"></i>`).join('')}</span>${g.q ? `<i class="gq">${g.q}%</i>` : ''}${!noEq && S.sk.includes(g.id) ? '<i class="geq">裝</i>' : ''}</span>`;
};
const gemRow = (g, tag) => {
  const q = gemSkill(g);
  return `<button class="card" style="text-align:left;border:0;width:100%;color:inherit;font:inherit" data-act="gem" data-id="${g.id}"><div class="rowx"><div class="t"><b><img class="cico sk" src="${skIcon(g.k, q.icon)}" alt=""> ${q.name} Lv${g.lv}${g.cor ? ' <span style="color:#e5484d">腐化</span>' : ''}</b><small>${tag ? tag + '・' : ''}${gemDesc(q, stats())}・插槽 ${(g.sp || []).length}/${g.sock || 2}</small></div><small class="sub">${q.mp ? q.mp + ' 魔力' : ''}</small></div></button>`;
};
/* 0.3.20 輔助寶石 */
/* 光環能不能開：光環欄最多 AURA_MAX 個、精魄要夠 */
function auraBlock(g, st) {
  if ((S.aura || []).length >= AURA_MAX) return '光環欄滿了';
  const need = auraCost(gemSkill(g));
  if (st.spiritUsed + need > st.spirit) return `精魄不夠（要 ${need}，剩 ${st.spirit - st.spiritUsed}）`;
  return '';
}
const supPrice = sp => Math.round(60 + 110 * Math.pow(sp.t || 1, 1.7));
function supBuyBlock(sp) {
  if (sp.lin) return '只會掉落';
  if (sp.t > tierMax()) return `T${sp.t} 解鎖`;
  if (S.gold < supPrice(sp)) return '金幣不足';
  return '';
}
const supN = k => (S.sups || []).filter(x => x.k === k).length;
/* 紅點：有沒插的輔助寶石，而且技能欄裡有技能石插得進去 */
const supHint = () => (S.sups || []).some(x => S.sk.some(id => gemOf(id) && !supBlock(gemOf(id), x)));
const supLine = sp =>
  `${sp.lin ? '<i class="kw num">族裔</i> ' : ''}<b>${supIcon(sp)}${sp.n}</b><small>${sp.d}・只能插${SUPREQN[sp.req]}${sp.mp ? `・魔力消耗 +${sp.mp}%` : ''}${sp.conv ? '・轉換類（一顆技能石只能一個）' : ''}${sp.lin ? `・同名一個角色只能用一顆・${SUPM[sp.m]}掉落` : ''}</small>`;
/* 0.3.11 技能石商店：依 T 分頁（T1～T5），未解鎖的 T 只能看 */
function gemShopHTML() {
  if (SEL.gshopK === 'sup') return supShopHTML();
  const st = stats(),
    mx = tierMax(),
    cur = Math.min(5, SEL.gtier || 1),
    ks = GEMK()
      .filter(k => gemTier(k) === cur && skfOk({ k }) && skwOk(k))
      .sort((a, b) => gemReq(a) - gemReq(b) || a.localeCompare(b));
  return `${gshopKind()}<p class="sub" style="margin:0">金幣 <b class="c-gold">${S.gold}</b>・解鎖到 T${mx}・買到的是 Lv1，可以重複買</p>
    <div class="seg gst5">${[1, 2, 3, 4, 5].map(t => `<button data-act="gshopTier" data-v="${t}" aria-pressed="${t === cur}">T${t}${t > mx ? '🔒' : ''}</button>`).join('')}</div>
    ${cur > mx ? `<p class="sub" style="color:#ffb27a">T${cur} 還沒解鎖：到城鎮挑戰突破試煉。</p>` : ''}
    ${skfRows()}
    <div class="card">${ks
      .map(k => {
        const q = SKILLS[k],
          blk = gemBuyBlock(k);
        return `<div class="rowx"><div class="t"><b><img class="cico sk" src="${skIcon(k, q.icon)}" alt=""> ${q.name} <span class="sub">需要 Lv${gemReq(k)}${gemCount(k) ? `・<span style="color:var(--gold)">已有 ${gemCount(k)} 顆</span>` : ''}</span></b>${skTagHTML(q)}<small>${gemDesc(gemSkill(newGem(k)), st)}</small></div><button class="btn sm ${blk ? '' : 'buy'}" data-act="gemBuy" data-k="${k}" ${blk ? 'disabled' : ''}>${blk || `${gemPrice(k)} 金`}</button></div>`;
      })
      .join('')}</div>`;
}
const gshopKind = () =>
  `<div class="seg" style="grid-template-columns:1fr 1fr">${[
    ['gem', '技能石'],
    ['sup', '輔助寶石']
  ]
    .map(
      ([k, n]) => `<button data-act="gshopK" data-k="${k}" aria-pressed="${(SEL.gshopK || 'gem') === k}">${n}</button>`
    )
    .join('')}</div>`;
function supShopHTML() {
  const mx = tierMax();
  return `${gshopKind()}<p class="sub" style="margin:0">金幣 <b style="color:var(--gold)">${S.gold}</b>・目前解鎖到 T${mx}。輔助寶石插在技能石的插槽裡（一開始 2 格），可以隨時拆下來換到別顆；同一種可以買很多顆。族裔輔助只會從野外機制的菁英與首領掉落。</p>
    <div class="ptagf">${SUPF.map(([k, n]) => `<button data-act="supF" data-k="${k}" aria-pressed="${(SEL.supf || 'all') === k}">${n}</button>`).join('')}</div>
    <div class="card">${SUPG.filter(sp => !sp.lin && supfOk(sp))
      .map(sp => {
        const blk = supBuyBlock(sp);
        return `<div class="rowx"><div class="t">${supLine(sp)}<small class="sub">T${sp.t}${supN(sp.k) ? `・<span style="color:var(--gold)">已有 ${supN(sp.k)} 顆</span>` : ''}</small></div><button class="btn sm ${blk ? '' : 'buy'}" data-act="supBuy" data-k="${sp.k}" ${blk ? 'disabled' : ''}>${blk || `${supPrice(sp)} 金`}</button></div>`;
      })
      .join('')}</div>`;
}
const prayed = id => !!S.prayed && S.prayed[id] === hepoch();
/* 0.3.1.8：子頁面在右上角有「‹ 返回」（裝備詳情 → 背包或該部位、部位 → 背包、技能石 → 技能、印記兌換 → 狩獵、背包的材料分頁 → 裝備） */
function sheetParent() {
  if (sheetName === 'item') return selSlot ? ['slot', SLOTN[selSlot]] : ['bag'];
  if (sheetName === 'slot') return ['bag'];
  if (sheetName === 'gem') return ['skills'];
  if (sheetName === 'pdet') return ['pact'];
  if (sheetName === 'pbrk') return pactOf(SEL.pdet) ? ['pdet', PACTI[pactOf(SEL.pdet).k].n] : ['pact'];
  if (sheetName === 'bag' && (SEL.bag !== 'eq' || SEL.sell)) return ['bagHome'];
  return null;
}
function renderSheet() {
  {
    const b = $('sback');
    if (b) b.hidden = !sheetName || !sheetParent();
  }
  if (!sheetName) return;
  const el = $('sbody'),
    st = stats(),
    c = clsOf(S.cls);
  let html = '';
  if (sheetName === 'hero') {
    const avg = (st.physLo + st.physHi) / 2 + st.fire + st.cold + st.light * 1;
    html = `<div class="card"><div class="ent"><canvas id="heroBig" width="18" height="18"></canvas><div style="flex:1;display:grid;gap:6px;min-width:0"><b style="font-family:var(--f-pix);font-size:18px;font-weight:400">${esc(S.name || '旅人')} <span style="color:${c.color};font-size:14px">${c.name}</span> Lv${S.lv}</b><small class="sub">玩家編號 ${playerTag()}</small>${bar('生命', S.hp, st.maxhp, 'var(--hp)')}${bar('魔力', S.mp, st.maxmp, 'var(--mp)')}${bar('經驗', S.xp, xpNeed(S.lv), 'var(--xp)')}</div></div></div>
    <button class="btn" data-act="sheet" data-s="pact">契靈${
      pactsOn().length
        ? `・${pactsOn()
            .map(u => pactKind(u).n)
            .join('、')}`
        : ''
    }</button><button class="btn" data-act="asc">昇華${S.asc && S.asc.br ? `・${ASCB[S.asc.br].n}` : ''}${ascPts() > ascUsed() ? `（剩 ${ascPts() - ascUsed()} 點）` : ''}</button>${(() => {
      const k = S.tree.map(id => TREE.byId[id]).filter(n => n && n.type === 'key');
      return k.length
        ? `<div class="sub" style="text-align:center">基石：<span style="color:#e8873a">${k.map(n => n.n).join('、')}</span></div>`
        : '';
    })()}
    <h3>攻擊</h3><div class="kv"><div><span>物理傷害</span><b>${fmt1(st.physLo)}–${fmt1(st.physHi)}</b></div><div><span>元素附加</span><b>${fmt1(st.fire + st.cold + st.light)}</b></div><div><span>法術加成</span><b>${Math.round((st.spellMul - 1) * 100)}%</b></div><div><span>暴擊率</span><b>${st.crit}%</b></div><div><span>暴擊傷害</span><b>${st.critMulti}%</b></div><div><span>吸血</span><b>${st.leech}%</b></div></div>
    <h3>防禦</h3><div class="kv"><div><span>護甲</span><b>${st.armor}</b></div><div><span>閃避</span><b>${fmt1(st.dodge)}%</b></div><div><span>視線範圍</span><b>${st.vision}m</b></div><div><span>精魄</span><b>${st.spiritUsed}/${st.spirit}</b></div><div><span style="color:#ffb15a">火焰抗性</span><b>${st.res.fire}%</b></div><div><span style="color:#9fe7ff">冰冷抗性</span><b>${st.res.cold}%</b></div><div><span style="color:#fff27a">閃電抗性</span><b>${st.res.light}%</b></div><div><span style="color:#c86aff">混沌抗性</span><b>${st.res.chaos}%</b></div></div>
    <h3>技能</h3><div class="card">${mySkills()
      .map((q, i) =>
        q
          ? `<div class="rowx"><div class="t"><b>${q.name} Lv${q.lv}</b><small>${gemDesc(q, st)}</small></div><small style="color:${st.blood ? 'var(--hp)' : 'var(--mp)'}">${costTxt(st, q) || '—'}</small></div>`
          : `<div class="rowx"><div class="t"><small class="sub">第 ${i + 1} 格：空</small></div></div>`
      )
      .join('')}</div><button class="btn" data-act="sheet" data-s="skills">管理技能石</button>
`;
  } else if (sheetName === 'skills') {
    /* 0.3.44 設計規範：技能欄、光環欄、技能石都是小格子（點了看詳情）；篩選兩個下拉；通貨小格子；說明收起來 */
    const eqd = new Set(S.sk),
      list = [...S.gems].sort((a, b) => eqd.has(b.id) - eqd.has(a.id) || b.lv - a.lv || a.k.localeCompare(b.k)),
      shown = list.filter(g => skfOk(g) && skwOk(g.k)),
      tile = (g, noEq) =>
        `<button class="gpick" data-act="gem" data-id="${g.id}" aria-label="${SKILLS[g.k].name}">${gemCell(g, noEq)}</button>`,
      empty = n => `<div class="gpick"><span class="gtile emp"><small>${n}</small></span></div>`,
      ns = [...new Set((S.sups || []).map(x => x.k))].map(k => SUPGI[k]).filter(Boolean);
    html = `<h3>技能欄</h3><div class="sgrid6">${S.sk
      .map((id, i) => {
        const g = gemOf(id);
        return g
          ? tile(g, true).replace('</button>', `${wOk(st, SKILLS[g.k]) ? '' : '<i class="gwarn">武器</i>'}</button>`)
          : empty(i + 1);
      })
      .join('')}</div>
    <h3>光環<small class="sub">・精魄 ${st.spiritUsed}/${st.spirit}</small></h3><div class="sgrid6">${Array.from(
      { length: AURA_MAX },
      (_, i) => {
        const g = gemOf((S.aura || [])[i]),
          on = g && auraOn(st.spirit).some(q => q.gid === g.id);
        return g
          ? tile(g, true).replace('</button>', on ? '</button>' : '<i class="gwarn">精魄</i></button>')
          : empty('光環');
      }
    ).join('')}</div>
    <div class="baghd"><h3>技能石 ${S.gems.length}</h3>${skfSel()}</div>
    ${shown.length ? `<div class="sgrid6">${shown.map(g => tile(g)).join('')}</div>` : `<p class="empty">${S.gems.length ? '沒有符合的技能石' : '還沒有技能石，到城鎮的技能石商店買吧'}</p>`}
    <h3>技能石通貨</h3><div class="chips">${GCUR.map(c => `<span class="chip${S.cur[c.id] ? '' : ' zero'}" aria-label="${c.n}"><img src="${curIcon(c.id)}" alt=""><b>${S.cur[c.id] || 0}</b></span>`).join('')}</div>
    ${ns.length ? moreK('sups', `輔助寶石 ${(S.sups || []).length} 顆沒插`, ns.map(sp => `<div class="rowx"><div class="t">${supLine(sp)}</div><small class="sub">×${supN(sp.k)}</small></div>`).join('')) : ''}
    ${more('技能石、輔助寶石與光環', `<p>技能石在城鎮的「技能石商店」買，用靈魂（${S.cur.soul || 0}）升級；另外有固定的普通攻擊。</p><p>技能石有 2～5 個插槽，插上輔助寶石改變技能怎麼運作；品質用寶石稜鏡提高。</p><p>光環要預留精魄才會生效，精魄來自天賦的魔力、法術節點與契靈。</p>${GCUR.map(c => `<p><img class="cico" src="${curIcon(c.id)}" alt=""><b>${c.n}</b>：${c.d}</p>`).join('')}`)}`;
  } else if (sheetName === 'pbrk') {
    html = pactBrkHTML();
  } else if (sheetName === 'pact') {
    html = pactHTML();
  } else if (sheetName === 'pdet') {
    html = pactDetHTML();
  } else if (sheetName === 'gemshop') {
    html = gemShopHTML();
  } else if (sheetName === 'gem') {
    const g = gemOf(selGem);
    if (!g) {
      openSheet('skills');
      return;
    }
    /* 0.3.44 設計規範：標題 → 動作（升級、技能欄）→ 輔助插槽（一列一顆）→ 能用的通貨；品質、說明、分解收起來 */
    const q = gemSkill(g),
      at = S.sk.indexOf(g.id),
      blk = gemLvBlock(g),
      n = g.sock || 2,
      qf = gemQFx(SKILLS[g.k]),
      aura = SKILLS[g.k].kind === 'aura',
      okc = ['eng', 'engX', 'engD', 'engC', 'prism', 'vaal']
        .map(id => GCURI[id])
        .filter(cu => gemCraftable(g, cu.id) && S.cur[cu.id] > 0);
    html = `<div class="ihd">${gemCell(g)}<div><b>${q.name} Lv${g.lv}<span class="sub">/${GEM_MAX}</span>${q.plus ? ` <span class="c-gold">+${q.plus}</span>` : ''}</b>${skTagHTML(q)}</div></div>
    <p class="gdesc">${gemDesc(q, st)}・消耗 ${costTxt(st, q) || '無'}${g.cor ? '・<span class="c-bad">已腐化</span>' : ''}</p>
    <div class="btns iact2"><button class="btn pri" data-act="gemLv" ${blk ? 'disabled' : ''}>${g.lv < GEM_MAX ? '升級' : '已滿級'}<small class="bnote">${blk || `${soulNeed(g.lv)} 靈魂`}</small></button>${
      aura
        ? (S.aura || []).includes(g.id)
          ? '<button class="btn" data-act="auraOff">關閉光環</button>'
          : `<button class="btn" data-act="auraOn" ${auraBlock(g, st) ? 'disabled' : ''}>開啟光環<small class="bnote">${auraBlock(g, st) || `${auraCost(q)} 精魄`}</small></button>`
        : at >= 0
          ? '<button class="btn" data-act="gemOff">卸下</button>'
          : ''
    }</div>
    ${
      aura
        ? ''
        : `<h3>放到技能欄</h3><div class="sgrid6">${S.sk
            .map((id, i) => {
              const o = gemOf(id);
              return `<button class="slot-g${id === g.id ? ' on' : ''}" data-act="gemEquip" data-i="${i}" ${id === g.id ? 'disabled' : ''} aria-label="裝到第 ${i + 1} 格"><img src="${o ? skIcon(o.k, SKILLS[o.k].icon) : iconURL('book')}" alt=""${o ? '' : ' style="opacity:.25"'}><i class="badge lk">${i + 1}</i></button>`;
            })
            .join('')}</div>`
    }
    <h3>輔助插槽 ${(g.sp || []).length}/${n}</h3><div class="list">${[
      ...(g.sp || []).map(x => {
        const sp = SUPGI[x.k];
        return `<div class="srow2"><span class="t">${sp ? `<b>${supIcon(sp)}${sp.n}</b><small>${sp.d}</small>` : x.k}</span><button class="btn sm" data-act="supOut" data-u="${x.u}">拆下</button></div>`;
      }),
      ...Array.from(
        { length: Math.max(0, n - (g.sp || []).length) },
        () =>
          `<div class="srow2 emp"><span class="t"><small>◇ 空的插槽</small></span><button class="btn sm buy" data-act="supPick">插入</button></div>`
      )
    ].join('')}</div>
    <h3>技能石通貨</h3>${okc.length ? `<div class="crafts2">${okc.map(cu => `<button class="chip" data-act="gemCraft" data-c="${cu.id}"><img src="${curIcon(cu.id)}" alt=""><span>${cu.n}</span><b>${S.cur[cu.id]}</b></button>`).join('')}</div>` : '<p class="sub">現在沒有能用的技能石通貨</p>'}
    ${more(`品質 ${g.q || 0}%・${qf.t(g.q || 0)}`, `<p>每 1% 品質：${qf.t(1)}。最多 ${Q_GEM}%（腐化可以超過），寶石稜鏡一次 +${prismAdd(g)}%（越高加越少）。</p>`)}
    ${more(
      '技能石通貨說明',
      ['eng', 'engX', 'engD', 'engC', 'prism', 'vaal']
        .map(id => GCURI[id])
        .map(
          cu =>
            `<p><img class="cico" src="${curIcon(cu.id)}" alt=""><b>${cu.n}</b>（${S.cur[cu.id] || 0}）：${cu.d}</p>`
        )
        .join('')
    )}
    ${more('分解', `<p>分解這顆技能石，退回 ${gemSoulBack(g)} 靈魂（插著的輔助寶石會退回背包）。</p><button class="btn" data-act="gemBreak">分解</button>`)}`;
  } else if (sheetName === 'bag' && SEL.sell) {
    html = bagListHTML();
  } else if (sheetName === 'bag') {
    /* 0.3.43 設計規範第 11 節：裝備欄兩排 × 5、背包格子、通貨與藥水小格子 */
    const cell = sl => {
      const it = S.eq[sl];
      return `<button class="slot-g ${it ? 'r' + it.r : 'emp'}${slotFramed(it) ? ' fill' : ''}" data-act="eqslot" data-s="${sl}" aria-label="${SLOTN[sl]}${it ? '：' + esc(itemTitle(it)) : ''}"><img src="${slotIcon(it, sl)}" alt=""></button>`;
    };
    /* 0.3.44 裝備欄照人形排（頭上、手邊、腳下），格子小一點；材料改成下面的「倉庫」格子 */
    html = `<div class="doll2"><canvas id="dollHero" width="18" height="18"></canvas>${[
      ['helm', 'h'],
      ['amulet', 'a'],
      ['weapon', 'w'],
      ['ring1', 'r1'],
      ['chest', 'c'],
      ['ring2', 'r2'],
      ['offhand', 'o'],
      ['gloves', 'g'],
      ['belt', 'bt'],
      ['boots', 'b']
    ]
      .map(([sl, ar]) => cell(sl).replace('<button ', `<button style="grid-area:${ar}" `))
      .join('')}</div>
    ${bagListHTML()}
    <h3>藥水</h3>${potRow('potions')}${potRow('ethers')}
    <h3>通貨</h3>${curRow()}${curHelp()}`;
  } else if (sheetName === 'slot') {
    const cur = S.eq[selSlot],
      cands = S.inv
        .map((it, i) => ({ it, i }))
        .filter(o => fitsSlot(o.it, selSlot))
        .sort((a, b) => b.it.r - a.it.r || b.it.ilvl - a.it.ilvl);
    html = `${cur ? `${itemCard(cur, '穿戴中')}<div class="btns" style="margin-top:-4px"><button class="btn sm pri" data-act="eqdetail" data-s="${selSlot}">改造</button><button class="btn sm" data-act="unequip" data-s="${selSlot}">卸下</button></div>` : `<p class="sub">${SLOTN[selSlot]}目前是空的。</p>`}
    <h3>可以裝備 ${cands.length}</h3>${cands.length ? `<div class="list">${cands.map(({ it, i }) => `<div class="srow"><button class="irow" data-act="pick" data-i="${i}" data-from="slot" style="border-left-color:${RCOL[it.r]}"><img src="${slotIcon(it)}" alt=""><span><b>${itemName(it)}</b><small>${cmpTxt(eqCmp(it))}・iLv${it.ilvl}</small></span></button><button class="btn sm" data-act="equipTo" data-i="${i}" data-s="${selSlot}">裝備</button></div>`).join('')}</div>` : `<p class="sub">背包裡沒有可以裝在這個位置的裝備。</p>`}
    <div class="btns"><button class="btn" data-act="sheet" data-s="bag">返回背包</button></div>`;
  } else if (sheetName === 'item') {
    const it = selItem && (selItem.eq ? S.eq[selItem.eq] : S.inv[selItem.i]);
    if (!it) {
      closeSheet();
      return;
    }
    const tgt = it.slot === 'ring' ? (selItem.eq ? null : S.eq.ring1 ? S.eq.ring1 : null) : S.eq[it.slot];
    /* 0.3.43 設計規範第 11 節：標題列 → 動作 → 數值（▲▼ 比較）→ 能用的通貨；比較、亡靈製作、通貨說明收起來 */
    const ok = CUR.filter(cu => craftable(it, cu.id) && S.cur[cu.id] > 0),
      no = CUR.length - ok.length;
    html = `<div class="ihd"><img class="bigico${slotFramed(it) ? ' fill' : ''}" src="${slotIcon(it)}" alt=""><div><b style="color:${RCOL[it.r]}">${esc(itemTitle(it))}</b><small>${itemType(it)}${selItem.eq ? '・穿戴中' : ''}${it.lock ? '・已上鎖' : ''}</small></div></div>
    <div class="btns iact">${selItem.eq ? `<button class="btn" data-act="unequip" data-s="${selItem.eq}">卸下</button>` : it.slot === 'ring' ? `<button class="btn pri" data-act="equip" data-s="ring1">戒指 1</button><button class="btn" data-act="equip" data-s="ring2">戒指 2</button>` : `<button class="btn pri" data-act="equip" data-s="${it.slot}">裝備</button>`}${selItem.eq ? '' : `<button class="btn" data-act="sell" ${canSell() && !it.lock ? '' : 'disabled'}>${it.lock ? '已上鎖' : `賣 ${sellVal(it)} 金`}${canSell() || it.lock ? '' : '<small class="bnote">商店才能賣</small>'}</button><button class="btn" data-act="lock" aria-pressed="${!!it.lock}">${it.lock ? '解鎖' : '上鎖'}</button>`}</div>
    ${selItem.eq ? '' : `<p class="cmpl">換上後：${cmpTxt(eqCmp(it))}</p>`}${itemCard(it, '', { head: false, cmp: !selItem.eq && tgt })}
    ${!selItem.eq && tgt ? more(`比較：穿戴中的${esc(itemTitle(tgt))}`, itemCard(tgt, '目前穿戴')) : ''}
    <h3>製作</h3>${ok.length ? `<div class="crafts2">${ok.map(cu => `<button class="chip" data-act="craft" data-c="${cu.id}"><img src="${curIcon(cu.id)}" alt=""><span>${cu.n}</span><b>${S.cur[cu.id]}</b></button>`).join('')}</div>` : ''}
    <p class="sub">${no ? `其他 ${no} 種現在不能用` : ''}</p>${curHelp()}`;
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
    <h3>名字</h3><div class="card"><div class="srow"><input class="inp" id="nameInp" maxlength="12" value="${esc(S.name || '旅人')}"><button class="btn" data-act="setName">儲存</button></div><p class="sub" style="margin-top:6px">結算與排行顯示的名字，最多 12 個字。</p></div>
    <h3>帳號</h3><div class="card"><div class="rowx"><div class="t"><b>玩家編號 <span style="color:var(--gold)">${playerTag()}</span></b><small>${CLOUD.anon ? '目前是遊客，存檔綁在這台裝置。註冊後會拿到玩家編號，換手機也能登入。' : esc(CLOUD.email || '')}</small></div>${CLOUD.anon ? '' : `<button class="btn sm" data-act="logout">登出</button>`}</div>
      ${
        CLOUD.anon
          ? `${CLOUD.pending ? `<p class="sub" style="color:var(--good)">確認信已寄到 ${esc(CLOUD.pending)}，點信裡的連結回到遊戲就完成綁定，目前的進度會一起帶過去。</p>` : ''}
      <form class="auth" data-auth autocomplete="on" onsubmit="return false"><input class="inp" id="authEmail" type="email" placeholder="信箱" autocomplete="email" required><input class="inp" id="authPw" type="password" placeholder="密碼（至少 6 個字）" autocomplete="current-password" minlength="6" required>
      <div class="btns"><button class="btn pri" type="button" data-act="register" ${CLOUD.sb ? '' : 'disabled'}>註冊並綁定進度</button><button class="btn" type="button" data-act="login" ${CLOUD.sb ? '' : 'disabled'}>登入已有帳號</button></div><p class="sub" id="authMsg"></p></form>`
          : ''
      }</div>
    <h3>雲端存檔</h3><div class="card"><div class="rowx"><div class="t"><b>${esc(CLOUD.status)}</b><small>${CLOUD.uid ? '每 15 秒、切到背景時自動上傳' : '存檔只在這台裝置'}</small></div><button class="btn sm" data-act="cloudSync" ${CLOUD.uid ? '' : 'disabled'}>立即同步</button></div></div><h3>版本</h3><p class="sub">漫步勇者 v${VER}</p>
    <h3>資料</h3><div class="card"><div class="rowx"><div class="t"><b>重新開始</b><small>清除這台裝置上的存檔（局外進度、契靈也會清掉）</small></div><button class="btn sm" data-act="reset">${resetArm ? '再按一次確認' : '重置'}</button></div></div>`;
  } else if (sheetName === 'log') {
    html = `<div class="log">${S.log.map(t => `<div>${esc(t)}</div>`).join('')}</div>`;
  }
  el.innerHTML = html;
  const hb = $('heroBig');
  if (hb) hb.getContext('2d').drawImage(sprite(heroSpr('F'), heroPal()), 0, 0);
  const dh = $('dollHero');
  if (dh) dh.getContext('2d').drawImage(sprite(heroSpr('F'), heroPal()), 0, 0);
}
function artRepaint() {
  clearTimeout(artRepaint.t);
  artRepaint.t = setTimeout(() => {
    if (document.activeElement && document.activeElement.matches('input,textarea')) return;
    const sb = $('sbody'),
      top = sb.scrollTop;
    if (sheetName) renderSheet();
    sb.scrollTop = top;
    if (!$('gacha').hidden) renderGacha();
    ascArtReload();
  }, 80);
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
  <p class="sub">${ok ? `點裝備勾選；上鎖的不會被選到。背包 ${S.inv.length}/30` : ''}</p>
  <button class="btn pri" data-act="shopSellGo" style="width:100%" ${ok && sel.length ? '' : 'disabled'}>賣出 ${sel.length} 件　+${gold} 金</button>`;
}
/* 賣裝備：0.3.23 起藏身處隨時都能進，所以隨時都能賣 */
/* 商店開著才能賣（0.1.0 肉鴿：商店節點） */
const canSell = () => !!SHOP.render;
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
  if (!S.inv.length) return head + '<p class="empty">背包是空的：打怪、開寶箱、地城尾王都會掉裝備。</p>';
  /* 0.3.43 格子：框色 = 稀有度，角標 ▲ 可能比穿戴的好、鎖、批量賣出的勾 */
  const row = (it, i) => {
    const on = SEL.sell && SEL.sell.has(it.id) && !it.lock;
    return `<button class="slot-g r${it.r}${slotFramed(it) ? ' fill' : ''}${on ? ' sel' : ''}${it.lock ? ' locked' : ''}" data-act="${SEL.sell ? 'sellPick' : 'pick'}" data-i="${i}" aria-label="${esc(itemTitle(it))}"><img src="${slotIcon(it)}" alt="">${SEL.sell && on ? '<i class="badge ck">✓</i>' : !SEL.sell ? cmpBadge(it) : ''}${it.lock ? '<i class="badge lk">鎖</i>' : ''}</button>`;
  };
  const grid = `<div class="bagg">${S.inv.map(row).join('')}</div>`;
  if (!SEL.sell) return head + grid;
  const sel = sellSel(),
    gold = sel.reduce((n, it) => n + sellVal(it), 0),
    ok = canSell(),
    q = (k, n) => `<button class="btn sm" data-act="sellQuick" data-k="${k}">${n}</button>`;
  return `${head}<div class="sellbar">${q('r0', '普通')}${q('r1', '魔法')}${q('r2', '稀有')}${q('worse', '比穿戴的差')}${q('all', '全選')}${q('none', '清除')}</div>
    <p class="sub">${ok ? '點裝備勾選；上鎖的不會被選到。' : '⚠ 要在城鎮或據點才能賣，現在只能先勾選。'}</p>
    ${grid}
    <div class="sellgo"><button class="btn pri" data-act="sellMany" ${ok && sel.length ? '' : 'disabled'}>${ok ? `賣出 ${sel.length} 件　+${gold} 金` : '不在城鎮或據點'}</button></div>`;
}

/* ================= entity interaction ================= */

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
    if (d.s === 'asc') {
      openAsc();
      return;
    }
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
      d.k === 'gold'
        ? `金幣 ${S.gold}：在商店買東西，這一局結束就沒了`
        : `魂晶 ${S.meta.soul}：每局結束時結算，用來解鎖角色與技能`
    ),
  skFilter: d => {
    SEL.skf = d.k;
    sfx('tap');
    renderSheet();
  },
  skWep: d => {
    SEL.skw = d.k;
    sfx('tap');
    renderSheet();
  },
  supF: d => {
    SEL.supf = d.k;
    sfx('tap');
    renderSheet();
  },
  mbtn: d => {
    sfx('select');
    const f = modalFns[+d.i];
    f && f();
  },
  skill: d => useSkill(d.k),
  gem: d => {
    selGem = d.id;
    sfx('tap');
    openSheet('gem');
  },
  auraOn: () => {
    const g = gemOf(selGem);
    if (!g || auraBlock(g, stats())) return;
    (S.aura = S.aura || []).push(g.id);
    sfx('select');
    clampHP();
    renderSheet();
    renderHud();
    save();
  },
  auraOff: () => {
    S.aura = (S.aura || []).filter(id => id !== selGem);
    sfx('tap');
    clampHP();
    renderSheet();
    renderHud();
    save();
  },
  gemEquip: d => {
    if (gemOf(selGem) && SKILLS[gemOf(selGem).k].kind === 'aura') return;
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
    toast(`${SKILLS[g.k].name} 升到 Lv${g.lv}`);
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
      addLog(`使用${GCURI[d.c].n}：${SKILLS[g.k].name} Lv${g.lv}${typeof res === 'string' ? '・' + res : ''}`);
      if (typeof res === 'string') toast(res);
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
      `<p>分解 ${SKILLS[g.k].name} Lv${g.lv}，退回 ${v} 個靈魂（升級花掉的 70%）？品質與插槽會一起消失，插著的輔助寶石退回背包；之後可以再到商店買。</p>`,
      [
        {
          label: '分解',
          pri: 1,
          fn: () => {
            for (const y of g.sp || []) S.sups.push(y);
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
  /* 技能石商店（一局裡的商店節點打開，SEL.gshop 有值才能買） */
  gemShop: () => {
    SEL.gshop = 'run';
    SEL.gtier = SEL.gtier || Math.min(tierMax(), 5);
    openSheet('gemshop');
  },
  gshopK: d => {
    SEL.gshopK = d.k;
    sfx('tap');
    renderSheet();
  },
  supBuy: d => {
    const sp = SUPGI[d.k];
    if (!sp || !SEL.gshop || supBuyBlock(sp)) return;
    S.gold -= supPrice(sp);
    giveSup(sp.k);
    sfx('coin');
    toast(`買下輔助寶石：${sp.n}`);
    addLog(`在商店買下輔助寶石：${sp.n}`);
    renderSheet();
    renderHud();
    save();
  },
  /* 插入：列出背包裡的輔助寶石，不能插的寫原因 */
  supPick: () => {
    const g = gemOf(selGem);
    if (!g) return;
    const ks = [...new Set((S.sups || []).map(x => x.k))].filter(k => SUPGI[k]);
    showModal(
      '插入輔助寶石',
      ks.length
        ? `<div class="card">${ks
            .map(k => {
              const x = S.sups.find(y => y.k === k),
                blk = supBlock(g, x);
              return `<div class="rowx"><div class="t">${supLine(SUPGI[k])}<small class="sub">×${supN(k)}</small></div><button class="btn sm ${blk ? '' : 'pri'}" data-act="supIn" data-u="${x.u}" ${blk ? 'disabled' : ''}>${blk || '插入'}</button></div>`;
            })
            .join('')}</div>`
        : '<p class="sub">背包裡沒有輔助寶石。到城鎮的技能石商店買，或打菁英、首領掉落。</p>',
      [{ label: '關閉', fn: hideModal }]
    );
  },
  supIn: d => {
    const g = gemOf(selGem);
    if (!g || !supIn(g, d.u)) return;
    hideModal();
    sfx('select');
    renderSheet();
    save();
  },
  supOut: d => {
    const g = gemOf(selGem);
    if (!g || !supOut(g, d.u)) return;
    sfx('tap');
    renderSheet();
    save();
  },
  gshopTier: d => {
    SEL.gtier = +d.v;
    sfx('tap');
    renderSheet();
  },
  gemBuy: d => {
    const k = d.k;
    if (!SKILLS[k] || !SEL.gshop || gemBuyBlock(k)) return;
    S.gold -= gemPrice(k);
    giveGem(k);
    sfx('coin');
    toast(`買下 ${SKILLS[k].name}`);
    addLog(`在商店買下技能石：${SKILLS[k].name}`);
    renderSheet();
    renderHud();
    save();
  },

  bitem: d => bItem(d.k),
  /* 0.3.27 戰鬥中的狀態與紀錄面板 */
  binfo: () => {
    const el = $('binfo');
    el.hidden = !el.hidden;
    sfx('tap');
    if (!el.hidden) binfoRender();
  },
  binfoTab: d => {
    BINFO = d.k;
    sfx('tap');
    binfoRender();
  },
  flee: () => flee(),
  bsub: d => {
    if (pBusy()) return;
    sfx('tap');
    B.sub = d.k || null;
    renderBHud();
  },
  use: d => {
    const st = stats();
    if (!S[d.k]) return;
    if (d.k === 'potions' && st.noPotion) return toast('昇華代價：無法使用生命藥水');
    S[d.k]--;
    sfx('heal');
    if (d.k === 'potions') {
      const v = potVal('potions', st);
      S.hp = Math.min(st.maxhp, S.hp + v);
      toast(`恢復 ${v} 生命`);
    } else {
      const v = potVal('ethers', st);
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
    wepWarn(d.s);
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
      bowW = d.s === 'weapon' && wepType(nit) === 'bow',
      clash =
        d.s === 'weapon'
          ? S.eq.offhand && (isQuiver(S.eq.offhand) ? !bowW : twoHand(nit))
            ? 'offhand'
            : null
          : d.s === 'offhand' && !isQuiver(nit) && twoHand()
            ? 'weapon'
            : null;
    if (d.s === 'offhand' && isQuiver(nit) && wepType() !== 'bow') return toast('箭袋要先裝備弓才能用');
    if (clash && S.eq[clash] && S.inv.length >= 30 && !S.eq[d.s]) return toast('背包已滿，先騰出空間');
    const it = S.inv.splice(selItem.i, 1)[0],
      cur = S.eq[d.s];
    S.eq[d.s] = it;
    if (cur) S.inv.push(cur);
    if (clash && S.eq[clash]) {
      S.inv.push(S.eq[clash]);
      S.eq[clash] = null;
      toast(
        clash === 'offhand' ? (bowW ? '弓只能配箭袋：副手收回背包' : '副手收回背包') : '裝上副手：雙手武器收回背包'
      );
    }
    sfx('select');
    toast(`裝備了 ${itemTitle(it)}`);
    wepWarn(d.s);
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
    wepWarn(d.s);
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
              refreshAll();
              toast('已登出，現在是遊客');
            } catch (e) {
              toast('登出失敗：' + e.message);
            }
            renderSheet();
          }
        }
      ]
    ),
  setName: () => {
    const v = ($('nameInp').value || '').trim().slice(0, 12);
    if (!v) {
      toast('名字不能是空的');
      return;
    }
    S.name = v;
    save();
    toast(`名字改成「${v}」`);
    renderSheet();
  },
  nav: d => {
    audioInit();
    sfx('tap');
    navOpen(d.g);
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
    closeSheet();
    refreshAll();
    toast('存檔已清除');
  }
};
document.addEventListener('change', ev => {
  /* 0.3.43 下拉選單：<select data-chg="動作名">，值放在 d.k */
  const f = ev.target.matches('select[data-chg]') && A[ev.target.dataset.chg];
  if (f) f({ k: ev.target.value });
});
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
setInterval(() => {
  if (S && !B) save();
}, 8000);
