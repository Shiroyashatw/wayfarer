/* dungeonPOE · HUD（生命／魔力球、技能列、經驗條、王的血條）、面板（裝備與背包、倉庫、地圖台）、拖曳、說明框、死亡與通關、輸入 */
'use strict';
const C = 36; /* 背包一格的大小（px） */
const icHTML = (n, cls = '') => {
  const u = artIconURL(n);
  return u ? `<img class="ic ${cls}" src="${u}" alt="">` : `<span class="ic ${cls}"></span>`;
};
/* 圖還沒載好時，載好後補畫面板 */
function artRepaint() {
  hudPanels();
  for (const el of document.querySelectorAll('.sk span.ic')) {
    const b = BAR.find(b => b.k === el.parentNode.dataset.k);
    el.outerHTML = icHTML(b.ic || SKILLS[b.k].ic);
  }
}

const BAR = [
  { k: 'flask', key: '1', ic: 'it_potion', n: '藥水', d: '回復一半生命（1.4 秒內）。殺怪會補充。' },
  { k: 'slash', key: '左鍵' },
  { k: 'blade', key: '右鍵' },
  { k: 'whirl', key: 'Q' },
  { k: 'iai', key: 'E' },
  { k: 'storm', key: 'R' },
  { k: 'roll', key: '空白', n: '翻滾', d: '短暫無敵。怪物出手的瞬間翻滾＝見切：時間變慢，下一擊必定暴擊。' }
];
function hudInit() {
  $('hud').innerHTML = `
  <div class="top"><div id="area"></div><div id="bossbar" hidden><b id="bossn"></b><div class="bb"><i></i></div></div><div id="prog" hidden><b>首領進度</b><div class="pb"><i></i></div></div></div>
  <div class="bottom">
    <div class="orb hp" id="ohp"><i></i><span></span></div>
    <div class="mid">
      <div class="xp" id="xp" data-tip="經驗"><i></i></div>
      <div class="bar">${BAR.map(
        b =>
          `<div class="sk" data-k="${b.k}" data-tip="${esc(tipOf(b))}">${b.k === 'roll' ? '<em class="roll">⤳</em>' : icHTML(b.ic || SKILLS[b.k].ic)}<u></u><s></s><kbd>${b.key}</kbd></div>`
      ).join('')}</div>
    </div>
    <div class="orb mp" id="omp"><i></i><span></span></div>
  </div>
  <div class="keys" id="keys"><b>操作</b> WASD 移動 · 滑鼠瞄準 · 左鍵 斬擊 · 右鍵 飛刃 · Q 旋風斬 · E 居合突進 · R 千本櫻 · 空白 翻滾 · 1 藥水 · F 互動／撿東西 · I 背包 · T 回藏身處 · H 隱藏</div>
  <div id="warn"></div>`;
  hudState();
}
function tipOf(b) {
  const D = SKILLS[b.k];
  if (!D) return `${b.n}\n${b.d}`;
  return `${D.n}\n${D.d}${D.mp ? `\n魔力 ${D.mp}` : ''}${D.cd ? ` · 冷卻 ${D.cd} 秒` : ''}`;
}
let warnT;
function hudWarn(t) {
  const w = $('warn');
  w.textContent = t;
  w.classList.remove('on');
  void w.offsetWidth;
  w.classList.add('on');
  clearTimeout(warnT);
  warnT = setTimeout(() => w.classList.remove('on'), 1600);
}
/* 每格畫面更新：只改數值，不重畫 HTML */
const HV = {};
function setV(el, k, v) {
  if (HV[k] === v) return;
  HV[k] = v;
  el.style.setProperty('--v', v);
}
function setT(el, k, v) {
  if (HV[k] !== v) el.textContent = HV[k] = v;
}
function hudTick() {
  if (!P) return;
  setV($('ohp'), 'hp', (P.hp / ST.hp).toFixed(3));
  setV($('omp'), 'mp', (P.mp / ST.mp).toFixed(3));
  setT($('ohp').lastChild, 'ht', Math.ceil(P.hp) + ' / ' + ST.hp);
  setT($('omp').lastChild, 'mt', Math.floor(P.mp) + ' / ' + ST.mp);
  setV($('xp'), 'xp', (S.xp / xpNeed(S.lv)).toFixed(3));
  for (const el of document.querySelectorAll('.sk')) {
    const k = el.dataset.k,
      D = SKILLS[k];
    let cd = 0,
      txt = '';
    if (k === 'flask') {
      cd = P.flask >= 1 ? 0 : 1 - (P.flask % 1);
      txt = Math.floor(P.flask) + '';
    } else if (k === 'roll') cd = (P.cds.roll || 0) / (ROLL.cd + ROLL.t);
    else if (D.cd) {
      cd = (P.cds[k] || 0) / D.cd;
      if (P.cds[k] > 0) txt = Math.ceil(P.cds[k]) + '';
    }
    setV(el, 'cd' + k, cd.toFixed(2));
    setT(el.querySelector('u'), 't' + k, txt);
    const no = (D && P.mp < D.mp) || G.scene === 'hide';
    if (HV['n' + k] !== no) el.classList.toggle('no', (HV['n' + k] = no));
  }
  const b = G.mobs.find(m => m.boss),
    show = !!(b && b.aggro);
  if (HV.boss !== show) {
    $('bossbar').hidden = !(HV.boss = show);
    if (show) $('bossn').textContent = b.D.n;
  }
  if (show) setV($('bossbar'), 'bhp', (b.hp / b.mhp).toFixed(3));
  const pr = G.scene === 'map' && !G.bossOut;
  if (HV.pr !== pr) $('prog').hidden = !(HV.pr = pr);
  if (pr) setV($('prog'), 'prog', Math.min(1, G.prog / G.need).toFixed(3));
  const at =
    G.scene === 'hide'
      ? `藏身處 · Lv ${S.lv} · ${S.gold} 金 · 地圖碎片 ${S.frag}`
      : `地圖 階級 ${G.mapT} · Lv ${S.lv} · 剩 ${G.mobs.length} 隻 · 碎片 ${S.frag}`;
  setT($('area'), 'at', at);
}
/* 死掉、通關：中間的卡片 */
function hudState() {
  const o = $('over');
  if (G.state === 'dead') {
    o.innerHTML = `<div class="card"><h2 class="c-bad">你倒下了</h2><p>這張地圖失敗，失去 ${G.lostXp} 經驗（不會降級）。裝備都還在。</p><button class="btn pri" data-a="home">回到藏身處</button></div>`;
    o.hidden = false;
  } else if (G.state === 'clear') {
    o.innerHTML = `<div class="card"><h2 class="c-gold">打倒${esc(bossOf(G.mapT).n)}！</h2><p>${G.first ? `開放階級 ${S.maxT}。` : ''}地上還有戰利品，撿完走進藍色傳送門回家。</p><button class="btn pri" data-a="stay">撿東西</button> <button class="btn" data-a="home">直接回藏身處</button></div>`;
    o.hidden = false;
  } else o.hidden = true;
}

/* ---------- 面板 ---------- */
const PANEL = { inv: false, stash: false, device: false, pick: 1 };
function openPanel(k) {
  if (k === 'stash') PANEL.inv = PANEL.stash = true;
  else if (k === 'device') {
    PANEL.device = true;
    PANEL.pick = S.maxT;
  } else PANEL[k] = true;
  hideTip();
  hudPanels();
}
function closePanels() {
  PANEL.inv = PANEL.stash = PANEL.device = false;
  hideTip();
  hudPanels();
}
function hudPanels() {
  if (!S) return;
  $('pinv').hidden = !PANEL.inv;
  $('pstash').hidden = !PANEL.stash;
  $('pdev').hidden = !PANEL.device;
  if (PANEL.inv) $('pinv').innerHTML = invHTML();
  if (PANEL.stash)
    $('pstash').innerHTML =
      `<div class="ph"><b>倉庫</b><span>點一下＝放進背包</span><button class="x" data-a="close">✕</button></div>${gridHTML(S.stash, 'stash')}`;
  if (PANEL.device) $('pdev').innerHTML = devHTML();
}
const hudInv = () => PANEL.inv && hudPanels();
/* 裝備欄的位置（照 PoE 的人形擺法），單位 px */
/* 裝備欄的位置（照 PoE 的人形擺法，緊湊版），[x, y, 寬, 高] px；右邊放角色數值 */
const EQPOS = {
  weapon: [0, 0, 72, 108],
  gloves: [0, 116, 72, 72],
  ring1: [80, 116, 36, 36],
  helm: [124, 0, 72, 72],
  chest: [124, 80, 72, 108],
  belt: [124, 196, 72, 36],
  amulet: [204, 36, 36, 36],
  ring2: [204, 116, 36, 36],
  off: [248, 0, 72, 108],
  boots: [248, 116, 72, 72]
};
function invHTML() {
  const s = ST,
    eqs = EQS.map(e => {
      const [x, y, w, h] = EQPOS[e.k],
        it = S.eq[e.k];
      return `<div class="eqs ${it ? 'r' + it.r : ''}" data-eq="${e.k}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">${it ? itemHTML(it, 'eq', e.k) : `<small>${e.n}</small>`}</div>`;
    }).join('');
  const res = RESK.map(r => `<span class="res-${r}">${ELN[r]}抗 <b>${s.res[r]}%</b></span>`).join('');
  return `<div class="ph"><b>裝備</b><span>Lv ${S.lv} · ${S.gold} 金</span><button class="x" data-a="close">✕</button></div>
  <div class="eqrow"><div class="doll">${eqs}</div>
  <div class="st">
    <span>傷害 <b>${Math.round(s.dmg[0])}–${Math.round(s.dmg[1])}</b></span><span>攻速 <b>${s.aps.toFixed(2)}</b></span><span>暴擊 <b>${Math.min(100, s.crit)}%</b></span>
    <span>生命 <b>${s.hp}</b></span><span>護甲 <b>${s.armor}</b></span><span>格擋 <b>${s.block}%</b></span>
    ${res}
  </div></div>
  <div class="ph2">背包 <span>拖曳擺放 · 點一下＝裝備／收起${PANEL.stash ? '／放進倉庫' : ''}</span></div>
  ${gridHTML(S.inv, 'inv')}
  <div class="foot">${G.scene === 'hide' ? `<div class="sell" data-sell="1">拖到這裡賣掉</div>` : `<span class="c-dim">回藏身處才能賣東西</span>`}</div>`;
}
function gridHTML(g, src) {
  return `<div class="grid" data-grid="${src}" style="width:${g.w * C}px;height:${g.h * C}px">${g.items.map(it => itemHTML(it, src)).join('')}</div>`;
}
function itemHTML(it, src, eqk) {
  const [w, h] = itemSize(it),
    pos = src === 'eq' ? '' : `left:${it.x * C}px;top:${it.y * C}px;width:${w * C}px;height:${h * C}px`;
  return `<div class="it r${it.r} ${src === 'eq' ? 'full' : ''}" data-src="${src}" data-id="${it.id}" ${eqk ? `data-eqk="${eqk}"` : ''} style="${pos}">${icHTML(itemIc(it))}</div>`;
}
function devHTML() {
  const t = PANEL.pick,
    c = mapCost(t),
    m = tierMul(t),
    b = bossOf(t);
  return `<div class="ph"><b>地圖台</b><span>放進地圖碎片，選要打的階級</span><button class="x" data-a="close">✕</button></div>
  <div class="tiers">${Array.from({ length: TMAX }, (_, i) => {
    const k = i + 1,
      lock = k > S.maxT;
    return `<button class="tier ${k === t ? 'on' : ''} ${lock ? 'lock' : ''}" data-tier="${k}" ${lock ? 'disabled' : ''}>${lock ? '🔒' : k}</button>`;
  }).join('')}</div>
  <div class="tinfo">
    <div><span>怪物強度</span><b>生命 ×${m.hp.toFixed(1)} · 傷害 ×${m.dmg.toFixed(1)}</b></div>
    <div><span>物品等級</span><b>${tierIlvl(t)}（最高 T${bestTier(tierIlvl(t))} 詞綴）</b></div>
    <div><span>王</span><b>${b.n}</b></div>
    <div><span>費用</span><b class="${S.frag < c ? 'c-bad' : ''}">${c ? `${c} 個地圖碎片（有 ${S.frag}）` : '免費'}</b></div>
  </div>
  <p class="c-dim">打倒最高階的王會開放下一階（目前到 ${S.maxT}）。</p>
  <button class="btn pri" data-a="open" ${S.frag < c ? 'disabled' : ''}>${S.frag < c ? '碎片不夠' : '開啟傳送門'}</button>`;
}

/* ---------- 找道具、移動道具 ---------- */
const GRIDS = () => ({ inv: S.inv, stash: S.stash });
function findItem(src, id, eqk) {
  if (src === 'eq') return S.eq[eqk];
  return GRIDS()[src].items.find(o => o.id === +id);
}
function takeOut(src, it, eqk) {
  if (src === 'eq') S.eq[eqk] = null;
  else {
    const g = GRIDS()[src];
    g.items.splice(g.items.indexOf(it), 1);
  }
}
/* 放回原處（原位放不下就找空位） */
function putBack(src, it, eqk, ox, oy) {
  if (src === 'eq') return (S.eq[eqk] = it), true;
  const g = GRIDS()[src],
    [w, h] = itemSize(it);
  if (ox != null && gridFree(g, ox, oy, w, h)) {
    it.x = ox;
    it.y = oy;
    g.items.push(it);
    return true;
  }
  return gridAuto(g, it);
}
function changed() {
  const hpF = P.hp / ST.hp;
  ST = stats();
  P.hp = Math.min(ST.hp, Math.max(1, hpF * ST.hp));
  P.mp = Math.min(ST.mp, P.mp);
  save();
  hudPanels();
}
/* 點一下：背包→裝上、身上→收進背包、倉庫↔背包 */
function quickMove(src, it, eqk) {
  if (src === 'eq') {
    if (!gridAuto(S.inv, it)) return hudWarn('背包滿了');
    S.eq[eqk] = null;
  } else if (src === 'stash') {
    takeOut('stash', it);
    if (!gridAuto(S.inv, it)) return gridAuto(S.stash, it), hudWarn('背包滿了');
  } else if (PANEL.stash) {
    takeOut('inv', it);
    if (!gridAuto(S.stash, it)) return gridAuto(S.inv, it), hudWarn('倉庫滿了');
  } else {
    const k = kindOf(it),
      slots = EQS.filter(e => e.t === k),
      e = slots.find(e => !S.eq[e.k]) || slots[0];
    if (!e) return;
    const old = S.eq[e.k],
      ox = it.x,
      oy = it.y;
    takeOut('inv', it);
    S.eq[e.k] = it;
    if (old && !putBack('inv', old, null, ox, oy)) {
      S.eq[e.k] = old;
      gridAuto(S.inv, it);
      return hudWarn('背包滿了');
    }
  }
  sfx('equip');
  changed();
}
function sell(src, it, eqk) {
  takeOut(src, it, eqk);
  const p = sellPrice(it);
  S.gold += p;
  hudWarn(`賣了 ${p} 金`);
  sfx('coin');
  changed();
}

/* ---------- 拖曳 ---------- */
let DR = null;
function dragStart(e, el) {
  const src = el.dataset.src,
    eqk = el.dataset.eqk,
    it = findItem(src, el.dataset.id, eqk);
  if (!it) return;
  const r = el.getBoundingClientRect(),
    [w, h] = itemSize(it);
  /* 抓哪一格就跟哪一格 */
  const gx = src === 'eq' ? Math.floor(w / 2) : Math.min(w - 1, Math.floor((e.clientX - r.left) / C)),
    gy = src === 'eq' ? Math.floor(h / 2) : Math.min(h - 1, Math.floor((e.clientY - r.top) / C));
  DR = { src, eqk, it, el, w, h, gx, gy, x0: e.clientX, y0: e.clientY, moved: false, ox: it.x, oy: it.y };
  el.setPointerCapture && el.setPointerCapture(e.pointerId);
}
function dragMove(e) {
  if (!DR) return;
  if (!DR.moved && Math.hypot(e.clientX - DR.x0, e.clientY - DR.y0) < 6) return;
  if (!DR.moved) {
    DR.moved = true;
    hideTip();
    DR.el.classList.add('lift');
    const g = (DR.ghost = document.createElement('div'));
    g.className = 'ghost it r' + DR.it.r;
    g.style.width = DR.w * C + 'px';
    g.style.height = DR.h * C + 'px';
    g.innerHTML = icHTML(itemIc(DR.it));
    document.body.appendChild(g);
  }
  DR.ghost.style.transform = `translate(${e.clientX - DR.gx * C - C / 2}px, ${e.clientY - DR.gy * C - C / 2}px)`;
  DR.tgt = dropTarget(e);
  markTarget();
}
/* 放開的位置：格子（哪一格）、裝備欄、賣出區 */
function dropTarget(e) {
  const under = document.elementsFromPoint(e.clientX, e.clientY);
  for (const el of under) {
    if (el.dataset.sell) return { k: 'sell', el };
    if (el.dataset.eq) {
      const ok = EQS.find(q => q.k === el.dataset.eq).t === kindOf(DR.it);
      return { k: 'eq', eqk: el.dataset.eq, el, ok };
    }
    if (el.dataset.grid) {
      const g = GRIDS()[el.dataset.grid],
        r = el.getBoundingClientRect(),
        x = Math.round((e.clientX - r.left - DR.gx * C - C / 2) / C),
        y = Math.round((e.clientY - r.top - DR.gy * C - C / 2) / C),
        hits = gridHits(g, x, y, DR.w, DR.h, DR.src === el.dataset.grid ? DR.it : null),
        inside = x >= 0 && y >= 0 && x + DR.w <= g.w && y + DR.h <= g.h;
      return {
        k: 'grid',
        src: el.dataset.grid,
        g,
        x,
        y,
        el,
        ok: inside && hits.length <= 1,
        swap: inside && hits.length === 1 ? hits[0] : null
      };
    }
  }
  return null;
}
function markTarget() {
  document.querySelectorAll('.hl').forEach(n => n.remove());
  document.querySelectorAll('.eqs.good,.eqs.bad,.sell.on').forEach(n => n.classList.remove('good', 'bad', 'on'));
  const t = DR.tgt;
  if (!t) return;
  if (t.k === 'sell') t.el.classList.add('on');
  else if (t.k === 'eq') t.el.classList.add(t.ok ? 'good' : 'bad');
  else {
    const h = document.createElement('div');
    h.className = 'hl ' + (!t.ok ? 'bad' : t.swap ? 'swap' : 'good');
    h.style.cssText = `left:${clamp(t.x, 0, t.g.w - DR.w) * C}px;top:${clamp(t.y, 0, t.g.h - DR.h) * C}px;width:${DR.w * C}px;height:${DR.h * C}px`;
    t.el.appendChild(h);
  }
}
function dragEnd(e) {
  if (!DR) return;
  const d = DR,
    t = d.moved && dropTarget(e);
  DR = null;
  if (d.ghost) d.ghost.remove();
  document.querySelectorAll('.hl').forEach(n => n.remove());
  if (!d.moved) return quickMove(d.src, d.it, d.eqk);
  if (!t || (t.k !== 'sell' && !t.ok)) return hudPanels();
  if (t.k === 'sell') return G.scene === 'hide' ? sell(d.src, d.it, d.eqk) : hudPanels();
  takeOut(d.src, d.it, d.eqk);
  if (t.k === 'eq') {
    const old = S.eq[t.eqk];
    S.eq[t.eqk] = d.it;
    /* 換下來的放回拿起來的地方 */
    if (old && !putBack(d.src === 'eq' ? 'inv' : d.src, old, null, d.ox, d.oy)) {
      S.eq[t.eqk] = old;
      putBack(d.src, d.it, d.eqk, d.ox, d.oy);
      hudWarn('放不下換下來的裝備');
    }
  } else {
    const sw = t.swap;
    if (sw) takeOut(t.src, sw);
    d.it.x = t.x;
    d.it.y = t.y;
    t.g.items.push(d.it);
    if (
      sw &&
      !(d.src === 'eq' && kindOf(sw) === EQS.find(q => q.k === d.eqk).t
        ? ((S.eq[d.eqk] = sw), true)
        : putBack(d.src === 'eq' ? 'inv' : d.src, sw, null, d.ox, d.oy))
    ) {
      /* 換不了：還原 */
      t.g.items.splice(t.g.items.indexOf(d.it), 1);
      putBack(t.src, sw, null, sw.x, sw.y);
      putBack(d.src, d.it, d.eqk, d.ox, d.oy);
      hudWarn('換不了：原位放不下');
    }
  }
  sfx('equip');
  changed();
}

/* ---------- 說明框 ---------- */
function itemTip(it, cmp) {
  const B = baseOf(it);
  let html = `<b class="rc${it.r}">${esc(itemName(it))}</b><small>${RARN[it.r]} ${KINDS[B.k].n} · 物品等級 ${it.L}</small>`;
  html += `<p class="base">${baseText(it).join('<br>')}</p>`;
  if (it.a.length) html += `<p class="aff">${it.a.map(a => `${affText(a)} <i>T${a.T}</i>`).join('<br>')}</p>`;
  if (cmp) {
    const slots = EQS.filter(e => e.t === B.k),
      e = slots.find(e => !S.eq[e.k]) || slots[0],
      cur = S.eq[e.k],
      a = ST;
    S.eq[e.k] = it;
    const b = stats();
    S.eq[e.k] = cur;
    const rows = [
      ['每秒傷害', dps(b) - dps(a)],
      ['生命', b.hp - a.hp],
      ['護甲', b.armor - a.armor],
      ...RESK.map(r => [ELN[r] + '抗', b.res[r] - a.res[r]]),
      ['移速', b.spd - a.spd]
    ].filter(r => Math.abs(r[1]) >= 0.5);
    html += `<p class="cmp">${cur ? '換上去' : '這格空著'}：${rows.length ? rows.map(([n, v]) => `<span class="${v > 0 ? 'c-good' : 'c-bad'}">${n} ${v > 0 ? '▲' : '▼'}${Math.abs(Math.round(v))}</span>`).join(' ') : '沒有變化'}</p>`;
  }
  html += `<p class="hint">${G.scene === 'hide' ? '賣價 ' + sellPrice(it) + ' 金' : ''}</p>`;
  return html;
}
function showTip(html, x, y) {
  const t = $('tip');
  t.innerHTML = html;
  t.hidden = false;
  const r = t.getBoundingClientRect();
  let left = x + 16;
  if (left + r.width > innerWidth - 8) left = x - r.width - 56;
  t.style.left = Math.max(8, left) + 'px';
  t.style.top = Math.max(8, Math.min(innerHeight - r.height - 8, y - r.height / 2)) + 'px';
}
function hideTip() {
  $('tip').hidden = true;
}

/* ---------- 輸入 ---------- */
let tWarn = 0;
function inputInit() {
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    const k = e.key.toLowerCase();
    if (e.repeat && !'wasd'.includes(k) && !k.startsWith('arrow')) return;
    K[k] = 1;
    if (k === ' ') {
      e.preventDefault();
      doRoll();
    } else if (k === 'q') useSkill('whirl');
    else if (k === 'e') useSkill('iai');
    else if (k === 'r') useSkill('storm');
    else if (k === '1') drinkFlask();
    else if (k === 'f') interact();
    else if (k === 'i' || k === 'b') PANEL.inv ? closePanels() : openPanel('inv');
    else if (k === 'h') $('keys').classList.toggle('off');
    else if (k === 'escape') closePanels();
    else if (k === 't' && G.scene === 'map' && G.state === 'play') {
      /* 按兩次才回家（這張地圖會結束） */
      if (performance.now() - tWarn < 2000) goHome();
      else (tWarn = performance.now()), hudWarn('再按一次 T 回藏身處（這張地圖會結束）');
    }
    pressFx(k);
  });
  addEventListener('keyup', e => (K[e.key.toLowerCase()] = 0));
  addEventListener('blur', () => {
    for (const k in K) K[k] = 0;
    M.L = M.R = 0;
  });
  CV.addEventListener('pointermove', e => {
    M.x = e.clientX;
    M.y = e.clientY;
    CV.style.cursor = LABELS.some(l => inL(l, e)) || (G.scene === 'hide' && propAt(e)) ? 'pointer' : 'crosshair';
  });
  CV.addEventListener('pointerdown', e => {
    M.x = e.clientX;
    M.y = e.clientY;
    const l = e.button === 0 && LABELS.find(l => inL(l, e));
    if (l) {
      if (dist(P, l.d) < 160) pickup(l.d);
      else hudWarn('走近一點再撿（或按 F）');
      return;
    }
    if (G.scene === 'hide' && e.button === 0) {
      const p = propAt(e);
      if (p === 'portal') return dist(P, G.portal) < 120 ? enterMap(G.portal.to) : hudWarn('走近一點');
      if (p) return useProp(p);
    }
    if (e.button === 0) {
      M.L = 1;
      useSkill('slash');
      pressFx('左鍵');
    }
    if (e.button === 2) {
      M.R = 1;
      useSkill('blade');
      pressFx('右鍵');
    }
  });
  addEventListener('pointerup', e => {
    if (e.button === 0) M.L = 0;
    if (e.button === 2) M.R = 0;
    dragEnd(e);
  });
  addEventListener('pointermove', dragMove);
  addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('pointerdown', e => {
    const el = e.target.closest('.it[data-id]');
    if (el && e.button === 0) {
      e.preventDefault();
      dragStart(e, el);
    }
  });
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-a]');
    if (a) act(a.dataset.a);
    const t = e.target.closest('[data-tier]');
    if (t) {
      PANEL.pick = +t.dataset.tier;
      hudPanels();
    }
  });
  document.addEventListener('pointerover', e => {
    if (DR && DR.moved) return;
    const s = e.target.closest('.it[data-id],[data-tip]');
    if (!s) return hideTip();
    const r = s.getBoundingClientRect();
    if (s.dataset.tip)
      return showTip(`<p class="sktip">${esc(s.dataset.tip).replace(/\n/g, '<br>')}</p>`, r.right - 30, r.top - 40);
    const it = findItem(s.dataset.src, s.dataset.id, s.dataset.eqk);
    if (it) showTip(itemTip(it, s.dataset.src !== 'eq'), r.right, r.top + r.height / 2);
  });
}
/* 滑鼠底下的藏身處物件 */
function propAt(e) {
  const w = {
    x: (e.clientX - CV.clientWidth / 2) / ZOOM + G.cam.x,
    y: (e.clientY - CV.clientHeight / 2) / ZOOM + G.cam.y
  };
  if (G.portal && Math.hypot(w.x - G.portal.x, w.y - G.portal.y) < 50) return 'portal';
  return (G.props || []).find(p => Math.hypot(w.x - p.x, w.y + 25 - p.y) < p.r + 20);
}
const inL = (l, e) => e.clientX >= l.x && e.clientX <= l.x + l.w && e.clientY >= l.y && e.clientY <= l.y + l.h;
function pressFx(key) {
  const b = BAR.find(b => b.key.toLowerCase() === key || (key === ' ' && b.k === 'roll'));
  if (!b) return;
  const el = document.querySelector(`.sk[data-k="${b.k}"]`);
  el.classList.remove('hit');
  void el.offsetWidth;
  el.classList.add('hit');
}
function act(a) {
  if (a === 'close') closePanels();
  else if (a === 'open') {
    openMap(PANEL.pick);
    closePanels();
  } else if (a === 'home') {
    enterHideout();
  } else if (a === 'stay') {
    G.state = 'play';
    hudState();
  }
}
