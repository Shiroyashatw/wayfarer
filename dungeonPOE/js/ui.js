/* dungeonPOE · 畫面：城鎮（出發、商店、鐵匠、工坊、天賦）、背包拖曳、地城地圖與手牌、遭遇、戰鬥播放、結算 */
'use strict';
let S = null;
const V = { scr: 'town', tab: 'prep', dlg: null };
/* ================= 小工具 ================= */
const HAPT = { select: 8, coin: 12, nope: [10, 40, 10], hit: 6 };
function snd(n, hp) {
  try {
    audioInit();
  } catch (e) {}
  sfx(n);
  if (hp && navigator.vibrate && S && S.sfx) navigator.vibrate(HAPT[hp] || 8);
}
let toastT;
function toast(m) {
  const t = $('toast');
  t.textContent = m;
  t.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('on'), 1800);
}
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
/* 彈簧（臨界阻尼，response 約 0.35 秒）；減少動態時只淡入淡出 */
const SPRING =
  'linear(0,0.055,0.173,0.309,0.441,0.558,0.656,0.736,0.8,0.849,0.887,0.916,0.938,0.955,0.967,0.976,0.982,0.987,0.991,0.993,0.995,0.997,0.998,0.998,1)';
const EASE_OK = typeof CSS !== 'undefined' && CSS.supports('animation-timing-function', 'linear(0, 1)');
function spr(el, kf, dur = 450) {
  if (!el || !el.animate) return null;
  if (calm()) kf = kf.map(k => ({ opacity: k.opacity ?? 1 }));
  return el.animate(kf, {
    duration: calm() ? 150 : dur,
    easing: calm() ? 'ease-out' : EASE_OK ? SPRING : 'cubic-bezier(0.23,1,0.32,1)'
  });
}
const DESK = () => innerWidth >= 1040;
const SPU = new Map();
function spURL(sp) {
  if (SPU.has(sp)) return SPU.get(sp);
  const c = artSprite('a_' + sp);
  if (c.pending) return 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  const u = c.toDataURL();
  SPU.set(sp, u);
  return u;
}
const icURL = ic => (ic.startsWith('p:') ? pixURL(ic.slice(2)) : artIconURL(ic) || iconURL('star'));
const itIc = o => icURL(baseOf(o).ic);
const GOLDI = () => `<img class="ic" src="${icURL('mat_gold')}" alt="">`;
const itName = o => {
  const p = o.a.find(x => AFFI[x.id].t === 'P');
  return (p ? AFFI[p.id].n + '的' : '') + baseOf(o).n;
};
let rpT;
/* 大圖載好了才重畫（sprites.js 會叫） */
function artRepaint() {
  if (DR) return;
  clearTimeout(rpT);
  rpT = setTimeout(() => {
    SPU.clear();
    if (V.scr !== 'fight') render();
    else {
      document.querySelectorAll('img[data-sp]').forEach(im => (im.src = spURL(im.dataset.sp)));
      document.querySelectorAll('img[data-ic]').forEach(im => (im.src = icURL(im.dataset.ic)));
    }
    if (V.dlg) openDlg(V.dlg.f, V.dlg.c, true);
  }, 80);
}
/* ================= 對話框（底部說明卡） ================= */
/* f：產生內容的函式（內容換掉時重新呼叫，不重播進場）；c：置中 */
function openDlg(f, c, keep) {
  const m = $('modal'),
    again = !m.hidden && keep;
  /* 重畫同一張卡（keep）時保留「這是背包卡」的標記 */
  V.dlg = { f, c, bag: keep && V.dlg ? V.dlg.bag : 0 };
  m.className = c ? 'center' : '';
  /* 遭遇一定要選打或跑，不給關 */
  const noX = S.run && S.run.pend && ['fight', 'dead'].includes(S.run.pend.k) && !(V.dlg && V.dlg.bag);
  m.innerHTML = `<div class="sheet">${c ? '' : '<div class="grab"></div>'}${noX ? '' : '<button class="x" data-act="close" aria-label="關閉">✕</button>'}${f()}</div>`;
  m.hidden = false;
  if (!again) {
    spr(m, [{ opacity: 0 }, { opacity: 1 }], 250);
    spr(
      m.firstChild,
      c
        ? [
            { transform: 'scale(.96)', opacity: 0 },
            { transform: 'none', opacity: 1 }
          ]
        : [{ transform: 'translateY(100%)' }, { transform: 'none' }]
    );
  }
}
function closeDlg() {
  const m = $('modal');
  if (V.sel && V.sel.src === 'own' && S.run) detClose();
  if (m.hidden) return;
  const c = V.dlg && V.dlg.c;
  V.dlg = null;
  const s = m.firstChild,
    a = spr(s, c ? [{ opacity: 1 }, { opacity: 0 }] : [{ transform: 'none' }, { transform: 'translateY(100%)' }], 300);
  spr(m, [{ opacity: 1 }, { opacity: 0 }], 300);
  const done = () => {
    if (!V.dlg) {
      m.hidden = true;
      m.innerHTML = '';
    }
    coachSoon();
  };
  coachSoon();
  if (a) a.onfinish = done;
  else done();
}
const redlg = () => V.dlg && openDlg(V.dlg.f, V.dlg.c, true);
/* ================= 背包格子 ================= */
/* 現在的容器：背包、黑盒；城鎮多一個倉庫（tray，清單），地城多一個地上（gr，格子：怪物或寶箱的背包就攤在這裡） */
function ctx() {
  if (S.run) return { bag: S.run.bag, box: S.run.box, gr: S.run.ground, tray: null, town: 0 };
  return { bag: S.bags.find(b => b.u === S.sel), box: S.box, tray: S.wh, tn: '倉庫', town: 1 };
}
function where(u) {
  const c = ctx();
  for (const k of ['bag', 'box', 'gr']) if (c[k] && c[k].items.some(o => o.u === u)) return k;
  return c.tray && c.tray.some(o => o.u === u) ? 'tray' : null;
}
function findIt(u) {
  const c = ctx();
  return [...c.bag.items, ...c.box.items, ...(c.gr ? c.gr.items : []), ...(c.tray || [])].find(o => o.u === u);
}
function take(u) {
  const c = ctx(),
    k = where(u);
  if (!k) return null;
  const list = k === 'tray' ? c.tray : c[k].items,
    i = list.findIndex(o => o.u === u);
  return list.splice(i, 1)[0];
}
/* 地上那一格叫什麼：打贏了是「戰利品」，寶箱是「寶箱」 */
const grName = () => {
  const p = S.run && S.run.lootFrom;
  return p || '地上';
};
const cellPx = g =>
  g.t === 'box'
    ? 40
    : Math.min(
        g.t === 'g' || g.t[0] === 'm' ? 44 : 52,
        fl((Math.min(innerWidth - 32, DESK() ? 560 : 448) - 8) / gridW(g))
      );
function gridHTML(g, key) {
  const cs = cellPx(g),
    m = maskOf(g);
  let h = '';
  m.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === 'x')
        h += `<i class="cell" data-c="${x},${y}" style="left:${4 + x * cs + 1}px;top:${4 + y * cs + 1}px;width:${cs - 2}px;height:${cs - 2}px"></i>`;
    })
  );
  for (const o of g.items) h += itemHTML(o, cs, 4 + o.x * cs, 4 + o.y * cs);
  return `<div class="grid${g.t === 'box' ? ' box' : ''}" data-g="${key}" style="width:${gridW(g) * cs + 8}px;height:${gridH(g) * cs + 8}px">${h}</div>`;
}
/* 一件道具：外框是外接矩形（不吃點擊），每一格各自可點，所以 L 形的缺角能放別的東西 */
function itemHTML(o, cs, left, top, cls = 'it') {
  const c = cellsOf(o),
    [w, hh] = sizeOf(o),
    first = c.reduce((a, p) => (p[1] < a[1] || (p[1] === a[1] && p[0] < a[0]) ? p : a));
  let parts = '';
  for (const [x, y] of c)
    parts += `<i class="part" data-u="${o.u}" style="position:absolute;left:${x * cs}px;top:${y * cs}px;width:${cs}px;height:${cs}px;border-radius:5px;background:var(--card2);box-shadow:inset 0 0 0 2px var(--${rarity(o) ? 'r1' : 'r0'});pointer-events:auto"></i>`;
  const icx =
      c.length > 1 && (w > 1 || hh > 1)
        ? (c.reduce((s, p) => s + p[0], 0) / c.length + 0.5) * cs
        : (first[0] + 0.5) * cs,
    icy = c.length > 1 ? (c.reduce((s, p) => s + p[1], 0) / c.length + 0.5) * cs : (first[1] + 0.5) * cs,
    is = Math.min(44, cs * 0.8);
  return `<div class="${cls}" data-u="${o.u}" style="left:${left}px;top:${top}px;width:${w * cs}px;height:${hh * cs}px;border:0;background:none;pointer-events:none">${parts}<img class="ic" data-ic="${baseOf(o).ic}" src="${itIc(o)}" alt="${esc(baseOf(o).n)}" style="position:absolute;left:${icx - is / 2}px;top:${icy - is / 2}px;width:${is}px;height:${is}px"></div>`;
}
/* 小格子圖示：框色＝稀有度（白／藍）、左上 ★ 等級、右上形狀（佔幾格） */
function shapeMini(o) {
  const c = cellsOf(o),
    [w, hh] = sizeOf(o);
  return `<i class="shp" style="--w:${w};--h:${hh}" aria-label="${c.length} 格">${c.map(([x, y]) => `<i style="grid-area:${y + 1}/${x + 1}"></i>`).join('')}</i>`;
}
const slotIn = o =>
  `<img class="ic" src="${itIc(o)}" alt="${esc(baseOf(o).n)}"><i class="badge">${baseOf(o).star}★</i>${shapeMini(o)}`;
const WHF = [
  ['all', '全部'],
  ['w', '武器'],
  ['a', '防具'],
  ['s', '盾'],
  ['o', '其他']
];
const whMatch = o => !V.whf || V.whf === 'all' || (V.whf === 'o' ? 'pg'.includes(baseOf(o).k) : baseOf(o).k === V.whf);
function trayHTML(list) {
  const its = list.filter(whMatch);
  return `<div class="tray" data-g="tray">${
    its.length
      ? its
          .map(
            o =>
              `<button class="slot-g${rarity(o) ? ' r1' : ''}${V.sel && V.sel.u === o.u ? ' on' : ''}" data-u="${o.u}">${slotIn(o)}</button>`
          )
          .join('')
      : `<div class="empty">${list.length ? '這一類沒有東西' : '倉庫是空的：去商店買裝備，或下地城撿'}</div>`
  }</div>`;
}
/* where：'prep' 整備（背包＋黑盒）、'wh' 倉庫頁（多倉庫）、地城（多戰利品） */
function editorHTML(where) {
  const c = ctx(),
    P = compile(c.bag, S.run ? S.run.hero : heroOf(S, S.cls)),
    dps = P.weapons.reduce((s, w) => s + (((w.dmg[0] + w.dmg[1]) / 2 + w.flat) * w.mul) / w.cd, 0),
    head = `<div class="bagw bagtop"><div class="lbl"><span>${esc(BAGI[c.bag.t].n)}</span><span>生命 <b>${P.mhp}</b>・每秒 <b>${dps.toFixed(1)}</b>・護甲 <b>${P.arm}</b></span></div>${gridHTML(c.bag, 'bag')}</div>`,
    box = `<div class="bagw" style="flex:none"><div class="lbl"><span>黑盒</span></div>${gridHTML(c.box, 'box')}</div>`,
    note =
      '<p class="sub" style="margin:var(--sp-4) 0 0">拖曳搬動，點一下看說明。黑盒不參與戰鬥，死了裡面的東西會留下。</p>';
  /* 地城：戰利品（怪物的背包）攤在背包下面，想拿的拖進來 */
  if (!c.town)
    return `${head}<div class="row" style="align-items:flex-start;margin-top:var(--sp-2);gap:var(--sp-3);flex-wrap:wrap">
    <div class="bagw" style="flex:none"><div class="lbl"><span>${esc(grName())}<small class="c-warn">・走開就沒了</small></span></div>${gridHTML(c.gr, 'gr')}</div>${box}</div>`;
  if (where === 'wh')
    return `${head}<div class="bagw" style="margin-top:var(--sp-2)"><div class="lbl"><span>倉庫 ${c.tray.length} 件</span></div>
    <div class="chips" style="margin-bottom:var(--sp-1)">${WHF.map(([k, n]) => `<button class="chipb" data-act="whf" data-k="${k}" aria-pressed="${(V.whf || 'all') === k}">${n}</button>`).join('')}</div>${trayHTML(c.tray)}</div>
    <div class="row" style="align-items:flex-start;margin-top:var(--sp-2);gap:var(--sp-3)">${box}${note}</div>`;
  return `${head}<div class="row" style="align-items:flex-start;margin-top:var(--sp-2);gap:var(--sp-3)">${box}<div style="flex:1;min-width:0;display:grid;gap:var(--sp-2);margin-top:var(--sp-4)"><button class="rowx" data-act="tab" data-t="wh" style="margin:0"><div class="t"><b>🗄️ 倉庫</b><small>${c.tray.length} 件・去倉庫拿裝備</small></div><span class="c-dim">›</span></button></div></div>`;
}
/* ---------- 拖曳（跟手、抓哪裡就跟哪裡，放開從現在的位置彈到結果） ---------- */
let DR = null,
  eatClick = false;
document.addEventListener(
  'click',
  e => {
    if (!eatClick) return;
    eatClick = false;
    e.stopPropagation();
    e.preventDefault();
  },
  true
);
document.addEventListener('pointerdown', e => {
  const el = e.target.closest('.part,.tray .slot-g');
  if (!el || e.button > 0 || el.closest('.fgrid')) return;
  const u = el.dataset.u,
    o = findIt(u);
  if (!o) return;
  const fromTray = el.classList.contains('slot-g'),
    g = fromTray ? null : el.closest('.grid'),
    gk = g && g.dataset.g,
    cs = gk ? cellPx(ctx()[gk]) : cellPx(ctx().bag),
    host = fromTray ? el : el.parentElement,
    rc = host.getBoundingClientRect();
  DR = { u, o, x0: e.clientX, y0: e.clientY, el, host, on: false, cs, fromTray, id: e.pointerId };
  /* 從托盤拿起：抓第一格的中間；從格子拿起：照抓的那格 */
  DR.ox = fromTray ? cs / 2 : e.clientX - rc.left;
  DR.oy = fromTray ? cs / 2 : e.clientY - rc.top;
});
document.addEventListener('pointermove', e => {
  if (!DR || e.pointerId !== DR.id) return;
  const dx = e.clientX - DR.x0,
    dy = e.clientY - DR.y0;
  if (!DR.on) {
    if (Math.hypot(dx, dy) < 8) return;
    DR.on = true;
    const cs = DR.cs;
    DR.gh = document.createElement('div');
    DR.gh.className = 'ghost-wrap';
    DR.gh.style.cssText = 'position:fixed;z-index:70;pointer-events:none;left:0;top:0';
    DR.gh.innerHTML = itemHTML(DR.o, cs, 0, 0, 'it ghostit');
    document.body.appendChild(DR.gh);
    DR.gh.firstChild.style.filter = 'drop-shadow(0 8px 16px #0006)';
    DR.host.style.opacity = '.25';
    document.querySelector('.coach')?.remove();
    try {
      DR.el.setPointerCapture(e.pointerId);
    } catch (er) {}
    snd('tap', 'select');
  }
  e.preventDefault();
  DR.lx = e.clientX - DR.ox;
  DR.ly = e.clientY - DR.oy;
  DR.gh.style.transform = `translate(${DR.lx}px,${DR.ly}px)`;
  hover(e.clientX, e.clientY);
});
/* 用道具第一格的中心判斷落點（不看手指底下的元素：底部按鈕蓋住格子也放得下） */
function target(cx, cy, d = DR) {
  const px = d.lx + d.cs / 2,
    py = d.ly + d.cs / 2,
    inR = (el, x, y) => {
      const r = el.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    },
    els = [
      ...document.querySelectorAll(
        ($('modal').hidden ? '#app ' : '#modal ') + '.grid,' + ($('modal').hidden ? '#app ' : '#modal ') + '.tray'
      )
    ],
    g = els.find(el => inR(el, px, py)) || els.find(el => el.classList.contains('tray') && inR(el, cx, cy));
  if (!g) return null;
  const k = g.dataset.g;
  if (k === 'tray') return { k };
  const grid = ctx()[k],
    cs = cellPx(grid),
    r = g.getBoundingClientRect();
  return { k, grid, el: g, x: Math.round((d.lx - r.left - 4) / cs), y: Math.round((d.ly - r.top - 4) / cs) };
}
function hover(cx, cy) {
  document.querySelectorAll('.cell.ok,.cell.no').forEach(c => c.classList.remove('ok', 'no'));
  document.querySelectorAll('.tray.hot').forEach(c => c.classList.remove('hot'));
  const t = target(cx, cy);
  if (!t) return;
  if (t.k === 'tray') return document.querySelector('.tray').classList.add('hot');
  const ok = fits(t.grid, DR.o, t.x, t.y);
  for (const [cx2, cy2] of cellsOf(DR.o)) {
    const c = t.el.querySelector(`.cell[data-c="${t.x + cx2},${t.y + cy2}"]`);
    if (c) c.classList.add(ok ? 'ok' : 'no');
  }
}
document.addEventListener('pointerup', e => {
  if (!DR || e.pointerId !== DR.id) return;
  const d = DR;
  DR = null;
  if (!d.on) {
    /* 放開就打開說明；瀏覽器接著補送的 click 會落在新卡片外的暗處把它關掉，吃掉那一下 */
    eatClick = true;
    setTimeout(() => (eatClick = false), 500);
    return detOpen({ u: d.u, src: 'own' });
  }
  coachSoon();
  const t = target(e.clientX, e.clientY, d),
    c = ctx();
  let ok = false;
  if (t && t.k === 'tray' && where(d.u) !== 'tray') {
    c.tray.push(take(d.u));
    ok = true;
  } else if (t && t.grid && fits(t.grid, d.o, t.x, t.y)) {
    const o = take(d.u);
    o.x = t.x;
    o.y = t.y;
    t.grid.items.push(o);
    ok = true;
  }
  if (!ok) {
    /* 放不下：從現在的位置飛回原位 */
    const r = d.host.getBoundingClientRect(),
      gh = d.gh,
      a = spr(gh, [{ transform: gh.style.transform }, { transform: `translate(${r.left}px,${r.top}px)` }], 350);
    snd('nope', 'nope');
    const end = () => {
      gh.remove();
      d.host.style.opacity = '';
    };
    if (a) a.onfinish = end;
    else end();
    document.querySelectorAll('.cell.ok,.cell.no,.tray.hot').forEach(x => x.classList.remove('ok', 'no', 'hot'));
    return;
  }
  snd('select', 'select');
  save();
  rerenderBag();
  const nel = document.querySelector(`.it[data-u="${d.u}"],.tray .slot-g[data-u="${d.u}"]`);
  if (nel) {
    const r = nel.getBoundingClientRect();
    spr(nel, [{ transform: `translate(${d.lx - r.left}px,${d.ly - r.top}px)` }, { transform: 'none' }], 400);
  }
  d.gh.remove();
});
document.addEventListener('pointercancel', () => {
  if (!DR) return;
  if (DR.gh) DR.gh.remove();
  if (DR.host) DR.host.style.opacity = '';
  DR = null;
});
/* 背包內容變了：城鎮重畫整頁，地城只重畫說明卡 */
function rerenderBag() {
  if (V.dlg && V.dlg.bag) openDlg(V.dlg.f, V.dlg.c, true);
  else {
    render();
    if (V.dlg) redlg();
  }
  if (V.sel) detRender();
}
/* ---------- 道具說明 ---------- */
function itemLines(o) {
  const b = baseOf(o);
  return `<ul class="lines">${baseLines(b)
    .map(l => `<li>${l}</li>`)
    .join('')}${o.a
    .map(x => {
      const l = affLine(x);
      return `<li class="af"><span class="tb t${l.t}">T${l.t}</span>${l.n}：${l.d}</li>`;
    })
    .join('')}</ul>`;
}
/* V.sel：{ u, src }；src：own 自己的（背包、黑盒、倉庫、地上）、shop 商店、mk 市集、mine 我上架的 */
const itemDlg = u => detOpen({ u, src: 'own' });
function selItem() {
  const v = V.sel;
  if (!v) return null;
  if (v.src === 'own') return findIt(v.u);
  if (v.src === 'shop') return S.shop[v.i] && S.shop[v.i].o;
  const r = (v.src === 'mk' ? MK.list : MK.mine).find(x => x.id === v.id);
  return r && r.o;
}
function detHTML() {
  const v = V.sel,
    o = selItem();
  if (!o) return '';
  const b = baseOf(o),
    acts = [];
  let extra = '';
  if (v.src === 'own') {
    const w = where(o.u),
      c = ctx();
    if (w !== 'tray' && b.sh !== 's1') acts.push(`<button class="btn" data-act="rot" data-u="${o.u}">旋轉</button>`);
    if (w === 'tray' || w === 'gr') {
      acts.push(
        `<button class="btn" data-act="toBag" data-u="${o.u}">放進背包</button>`,
        `<button class="btn" data-act="toBox" data-u="${o.u}">放進黑盒</button>`
      );
      if (c.town)
        acts.push(
          `<button class="btn" data-act="sell" data-u="${o.u}">賣出 +${sellPrice(o)}</button>`,
          `<button class="btn" data-act="mkSell" data-u="${o.u}">上架市集</button>`
        );
    } else
      acts.push(`<button class="btn" data-act="toTray" data-u="${o.u}">${c.town ? '放回倉庫' : '放到地上'}</button>`);
  } else if (v.src === 'shop') {
    const s = S.shop[v.i],
      p = itemPrice(o);
    acts.push(
      s.sold
        ? '<button class="btn" disabled>已買</button>'
        : `<button class="btn pri" data-act="buy" data-i="${v.i}" ${S.gold < p ? 'disabled' : ''}>買 ${p} 金${S.gold < p ? '<span class="bnote">金幣不夠</span>' : ''}</button>`
    );
  } else if (v.src === 'mk') {
    const r = MK.list.find(x => x.id === v.id);
    extra = `<p class="sub">賣家：${esc(r.seller_name || '冒險者')}</p>`;
    acts.push(
      `<button class="btn pri" data-act="mkBuy" data-id="${r.id}" ${S.gold < r.price ? 'disabled' : ''}>買 ${r.price} 金${S.gold < r.price ? '<span class="bnote">金幣不夠</span>' : ''}</button>`
    );
  } else if (v.src === 'mine') {
    const r = MK.mine.find(x => x.id === v.id);
    acts.push(
      r.status === 'sold'
        ? '<button class="btn" disabled>賣掉了：去領錢</button>'
        : `<button class="btn" data-act="mkCancel" data-id="${r.id}">下架（${r.price} 金）</button>`
    );
  }
  return `<button class="x" data-act="detX" aria-label="關閉">✕</button><div class="dh"><div class="slot-g${rarity(o) ? ' r1' : ''}">${slotIn(o)}</div><div><b class="${rarity(o) ? 'n1' : ''}">${esc(itName(o))}</b><small>${rarity(o) ? '魔法' : '普通'}・${KINDN[b.k]}・${b.star}★・${cellsOf(o).length} 格</small></div></div>${itemLines(o)}${extra}<div class="acts">${acts.join('')}</div>`;
}
function detOpen(sel) {
  const fresh = !V.sel || V.sel.u !== sel.u || V.sel.id !== sel.id || V.sel.i !== sel.i;
  V.sel = sel;
  detRender(fresh);
}
/* 從底部升上來；換一件只換內容不重播 */
function detRender(anim) {
  let d = $('det');
  const html = V.sel ? detHTML() : '';
  if (!html) {
    if (d && !d.hidden) {
      const a = spr(
        d,
        [{ transform: 'none' }, { transform: d.classList.contains('dtop') ? 'translateY(-110%)' : 'translateY(110%)' }],
        300
      );
      const end = () => (d.hidden = true);
      if (a) a.onfinish = end;
      else end();
    }
    V.sel = null;
    return;
  }
  if (!d) {
    d = document.createElement('aside');
    d.id = 'det';
    d.className = 'det';
    document.body.appendChild(d);
    anim = true;
  }
  /* 說明卡（背包）開著時，道具說明改從頂端降下來，才不會蓋住下面的戰利品、黑盒 */
  const was = d.hidden,
    top = !$('modal').hidden,
    off = top ? 'translateY(-110%)' : 'translateY(110%)';
  d.innerHTML = html;
  d.classList.toggle('dtop', top);
  d.hidden = false;
  if (anim || was) spr(d, [{ transform: off }, { transform: 'none' }]);
  document.querySelectorAll('.on[data-u],.sc.on').forEach(x => x.classList.remove('on'));
}
const detClose = () => {
  V.sel = null;
  detRender();
};
/* ================= 城鎮 ================= */
const TABS = [
  ['prep', '🎒', '整備'],
  ['wh', '🗄️', '倉庫'],
  ['mk', '⚖️', '市集'],
  ['shop', '🏪', '商店'],
  ['tree', '✨', '職業']
];
function miniHTML(m) {
  return `<span class="mini" style="grid-template-columns:repeat(${m[0].length},7px)">${m
    .join('')
    .split('')
    .map(ch => `<i${ch === 'x' ? '' : ' class="o"'}></i>`)
    .join('')}</span>`;
}
/* 主題：沒選過就跟系統；右上角一按就切換並記住 */
const curTheme = () => S.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
function applyTheme() {
  const t = curTheme();
  document.documentElement.dataset.theme = t;
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = t === 'dark' ? '#1d1b21' : '#f2eee7';
}
function topHTML(t) {
  return `<div class="top"><span class="ttl">${t}</span><span class="gold">${GOLDI()}${S.gold}</span><button class="iconbtn" data-act="settings" aria-label="設定">⚙️</button></div>`;
}
/* 設定：頭像、亮色／深色、音效 */
function settingsDlg() {
  openDlg(
    () => `<h2>設定</h2><h3>名字</h3><input class="inp" id="nm" maxlength="12" value="${esc(S.name || '')}" placeholder="冒險者" autocomplete="off"><h3>頭像</h3><div class="avs">${AVATARS.map(([k, n]) => `<button class="slot-g" data-act="av" data-k="${k}" aria-pressed="${S.av === k}" aria-label="${n}"><img class="ic" data-sp="${k}" src="${spURL(k)}" alt=""></button>`).join('')}</div>
    <h3>主題</h3><div class="g3">${[
      [null, '跟系統'],
      ['light', '☀️ 亮色'],
      ['dark', '🌙 深色']
    ]
      .map(
        ([k, n]) =>
          `<button class="btn" data-act="theme" data-k="${k || ''}" aria-pressed="${(S.theme || null) === k}">${n}</button>`
      )
      .join('')}</div>
    <h3>音效</h3><button class="btn" style="width:100%" data-act="sfx" aria-pressed="${S.sfx}">${S.sfx ? '🔊 開' : '🔇 關'}</button>`
  );
}
function prepHTML() {
  const c = S.cls,
    cl = CLSI[c],
    eq = eqOf(S, c),
    lv = clLv(clOf(S, c).xp).lv;
  const bagSel = S.bags
    .map(
      b =>
        `<button class="chipb bagopt" data-act="selBag" data-u="${b.u}" aria-pressed="${b.u === S.sel}">${miniHTML(BAGI[b.t].m)}${esc(BAGI[b.t].n)}</button>`
    )
    .join('');
  const dsel =
    S.maxD > 1
      ? `<div class="chips" style="margin-bottom:var(--sp-2)">${Array.from({ length: S.maxD }, (_, i) => `<button class="chipb" data-act="selD" data-d="${i + 1}" aria-pressed="${S.d === i + 1}">地城 ${i + 1}</button>`).join('')}</div>`
      : '';
  return `${topHTML('dungeonPOE')}
  <div class="two"><div class="pcol">
  ${dsel}
  <button class="rowx" data-act="tab" data-t="tree"><img class="ic" src="${spURL(S.av)}" data-sp="${S.av}" alt="" style="width:40px;height:40px"><div class="t"><b>${cl.n} Lv${lv}<span class="c-dim" style="font-weight:400">・${cl.m}</span></b><small>核心：${eq.map(id => COREI[id].n).join('、')}</small></div><span class="c-dim">換 ›</span></button>
  </div><div class="pcol"><h3>背包 <small>死了會失去</small></h3><div class="chips" style="margin-bottom:var(--sp-2)">${bagSel}</div>${editorHTML('prep')}
  <details class="more"><summary>怎麼玩</summary><div><p class="sub">① 把倉庫的裝備拖進背包（背包就是你的戰鬥力）。② 下地城點相鄰的格子走過去，打怪、開寶箱，怪物背包裡的東西打贏就能拿。③ 每走一步熱度 +1，滿了墮落十二生肖會來追你，記得走到撤離點 🚪。④ 3 顆愛心全碎就死在地城：背包和裡面的東西全部失去，只有黑盒裡的會留下。</p></div></details></div></div>`;
}
function whHTML() {
  return `${topHTML('倉庫')}<div class="chips" style="margin-bottom:var(--sp-2)">${S.bags.map(b => `<button class="chipb bagopt" data-act="selBag" data-u="${b.u}" aria-pressed="${b.u === S.sel}">${miniHTML(BAGI[b.t].m)}${esc(BAGI[b.t].n)}</button>`).join('')}</div>${editorHTML('wh')}`;
}
/* 格子卡片（商店、市集）：框色＝稀有度、★ 等級、形狀、價格 */
const scHTML = (o, price, act, data, sold) =>
  sold
    ? '<div class="sc sold">已賣出</div>'
    : `<button class="sc${rarity(o) ? ' r1' : ''}" data-act="${act}" ${data}><img class="ic" src="${itIc(o)}" alt="${esc(baseOf(o).n)}"><i class="badge">${baseOf(o).star}★</i>${shapeMini(o)}<b class="${S.gold < price ? 'c-bad' : ''}">${price} 金</b></button>`;
const segHTML = (k, opts) =>
  `<div class="seg">${opts.map(([v, n]) => `<button class="chipb" data-act="seg" data-k="${k}" data-v="${v}" aria-pressed="${(V[k] || opts[0][0]) === v}">${n}</button>`).join('')}</div>`;
function shopHTML() {
  const t = V.shopT || 'gear',
    own = id => S.bags.filter(b => b.t === id).length;
  return `${topHTML('商店')}${segHTML('shopT', [
    ['gear', '裝備'],
    ['bags', '背包']
  ])}${
    t === 'gear'
      ? `<p class="sub">白裝，最高 ${shopStar(S)}★・打倒王會進更好的貨。點一下看說明再買。</p><div class="shopg">${S.shop.map((s, i) => scHTML(s.o, itemPrice(s.o), 'shopSel', `data-i="${i}"`, s.sold)).join('')}</div>`
      : `<p class="sub">死了背包會一起失去。越大越貴，前期便宜的先用。</p>${BAGS.map(b => `<div class="rowx">${miniHTML(b.m)}<div class="t"><b>${esc(b.n)}</b><small>${cellCount({ t: b.id })} 格${own(b.id) ? `・有 ${own(b.id)} 個` : ''}</small></div><button class="btn buy" data-act="buyBag" data-t="${b.id}" ${S.gold < b.p ? 'disabled' : ''}>${b.p} 金</button></div>`).join('')}`
  }`;
}
function mkHTML() {
  const t = V.mkT || 'buy';
  if (!MK.at && !MK.busy && !MK.err) mkLoad().then(() => V.tab === 'mk' && render());
  const kf = r => !V.mkf || V.mkf === 'all' || (V.mkf === 'o' ? 'pg'.includes(r.kind) : r.kind === V.mkf);
  let body;
  if (MK.err) body = `<div class="empty">${esc(MK.err)}</div>`;
  else if (!MK.at) body = '<div class="empty">讀取中…</div>';
  else if (t === 'buy') {
    const L = MK.list.filter(kf);
    body = `<div class="chips" style="margin-bottom:var(--sp-2)">${WHF.map(([k, n]) => `<button class="chipb" data-act="mkf" data-k="${k}" aria-pressed="${(V.mkf || 'all') === k}">${n}</button>`).join('')}</div>${L.length ? `<div class="shopg">${L.map(r => scHTML(r.o, r.price, 'mkSel', `data-id="${r.id}"`)).join('')}</div>` : '<div class="empty">還沒有人上架這一類的東西</div>'}`;
  } else
    body = `${MK.owed ? `<div class="card row" style="justify-content:space-between"><span>賣掉了，可以領 <b class="c-gold">${MK.owed} 金</b><small class="c-dim">（已扣 10% 手續費）</small></span><button class="btn pri" data-act="mkClaim">領錢</button></div>` : ''}${
      MK.mine.filter(r => r.status === 'open').length
        ? `<div class="shopg">${MK.mine
            .filter(r => r.status === 'open')
            .map(r => scHTML(r.o, r.price, 'mineSel', `data-id="${r.id}"`))
            .join('')}</div>`
        : '<div class="empty">還沒有上架：到倉庫點道具「上架市集」</div>'
    }<p class="sub">最多同時上架 20 件。賣掉的錢扣 10% 手續費，回來這裡領。</p>`;
  return `${topHTML('市集')}<div class="row" style="justify-content:space-between">${segHTML('mkT', [
    ['buy', '購買'],
    ['mine', '我的上架']
  ])}<button class="btn sm" data-act="mkLoad" ${MK.busy ? 'disabled' : ''}>重新整理</button></div>${body}`;
}
function mkSellDlg(u) {
  const o = S.wh.find(x => x.u === u),
    ref = Math.max(10, sellPrice(o) * 3);
  openDlg(
    () =>
      `<h2>上架市集</h2><div class="dh"><div class="slot-g${rarity(o) ? ' r1' : ''}">${slotIn(o)}</div><div><b class="${rarity(o) ? 'n1' : ''}">${esc(itName(o))}</b><small>賣給商店只有 ${sellPrice(o)} 金</small></div></div>
      <label class="sub" for="mkp">價格（1～99999 金，賣掉扣 10%）</label><input class="inp" id="mkp" type="number" inputmode="numeric" min="1" max="99999" value="${ref}">
      <div class="g3" style="margin-bottom:var(--sp-3)">${[1, 2, 4].map(k => `<button class="btn sm" data-act="mkp" data-v="${ref * k}">${ref * k}</button>`).join('')}</div>
      <button class="btn pri big" data-act="mkSellGo" data-u="${u}">上架</button>`,
    1
  );
}
function nodeTxt(c, n) {
  const cs = CLSI[c].cores;
  if (n.u != null)
    return { ic: '◆', t: '解鎖', n: cs[n.u].n, d: `解鎖核心「${cs[n.u].n}」：${cs[n.u].d(cs[n.u].v[0])}` };
  if (n.e != null) return { ic: '▲', t: '強化', n: cs[n.e].n, d: `強化「${cs[n.e].n}」：${cs[n.e].d(cs[n.e].v[1])}` };
  const s = TSTAT[n.s];
  return { ic: '', t: s[0], n: `+${s[1] * (n.x || 1)}${s[2]}`, d: `${s[0]} +${s[1] * (n.x || 1)}${s[2]}` };
}
function treeHTML() {
  const c = S.cls,
    cl = clOf(S, c),
    L = clLv(cl.xp),
    pts = tPoints(S, c);
  const k = CLSI[c],
    eq = eqOf(S, c),
    hv = heroOf(S, c);
  return `${topHTML('職業')}<div class="clsrow">${CLASSES.map(k => `<button class="clsb" data-act="selCls" data-c="${k.id}" aria-pressed="${k.id === c}"><img class="ic" src="${icURL(k.ic)}" alt="">${k.n}<small>Lv${clLv(clOf(S, k.id).xp).lv}</small></button>`).join('')}</div>
  <div class="card" style="margin-top:var(--sp-2)"><b>${k.n}・${k.m}</b><p class="sub" style="margin:2px 0 0">${k.md}</p>
  <div class="cores2">${[0, 1]
    .map(i => {
      const id = eq[i];
      return id
        ? `<button class="coreb" data-act="cores"><b>${COREI[id].n}${hv.clv[id] ? ' ▲' : ''}</b><small>${COREI[id].d(COREI[id].v[hv.clv[id] ? 1 : 0])}</small></button>`
        : `<button class="coreb add" data-act="cores">＋ 核心<small>${coresOf(S, c).length > 1 ? '點選裝備' : '點天賦解鎖更多核心'}</small></button>`;
    })
    .join('')}</div></div>
  <div class="card"><div class="row" style="justify-content:space-between"><b>Lv${L.lv}</b><span class="sub">可點 <b class="c-gold">${pts}</b> 點</span></div><span class="hpb" style="margin-top:var(--sp-2)"><i style="width:${(L.xp / L.need) * 100}%;background:var(--accent)"></i></span><small class="sub">經驗 ${L.xp}/${L.need}・出地城就拿（死了也有）</small></div>
  <div class="tree">${TREE.map((row, r) => {
    const lock = cl.pts.length < rowNeed(r);
    return `<div class="trow${lock ? ' lock' : ''}">${row
      .map((nd, i) => {
        const id = r * 10 + i,
          tx = nodeTxt(c, { ...nd }),
          on = cl.pts.includes(id);
        return `<button class="tn${on ? ' on' : ''}${nd.u != null ? ' u' : nd.e != null ? ' e' : ''}" data-act="node" data-id="${id}"><small>${tx.ic} ${tx.t}</small><b>${tx.n}</b></button>`;
      })
      .join('')}</div>`;
  }).join('')}</div>
  <p class="sub" style="text-align:center">每往下一排，要先點滿前面的點數（第 r 排要 ⌊1.5r⌋ 點）。</p>
  <button class="btn" style="width:100%" data-act="resetTree">免費重點</button>`;
}
function nodeDlg(id) {
  const c = S.cls;
  openDlg(() => {
    const n = TNODES.find(x => x.id === id),
      tx = nodeTxt(c, n),
      cl = clOf(S, c),
      on = cl.pts.includes(id),
      why = on
        ? '已經點了'
        : tPoints(S, c) <= 0
          ? '沒有點數：升級拿點數'
          : cl.pts.length < rowNeed(n.r)
            ? `前面還要再點 ${rowNeed(n.r) - cl.pts.length} 點`
            : '';
    return `<h2>${tx.t}・${tx.n}</h2><p>${tx.d}</p>${on ? '<p class="sub c-good">✓ 已點</p>' : `<button class="btn pri big" data-act="take" data-id="${id}" ${why ? 'disabled' : ''}>點這個${why ? `<span class="bnote">${why}</span>` : ''}</button>`}`;
  });
}
function coreDlg() {
  const c = S.cls;
  openDlg(() => {
    const eq = eqOf(S, c),
      ok = coresOf(S, c),
      hv = heroOf(S, c);
    return `<h2>核心（最多裝 2 個）</h2>${CLSI[c].cores
      .map(k => {
        const has = ok.includes(k.id),
          on = eq.includes(k.id);
        return `<button class="rowx${has ? '' : ' off'}" data-act="core" data-id="${k.id}" ${has ? '' : 'disabled'} aria-pressed="${on}" style="${on ? 'box-shadow:inset 0 0 0 2px var(--gold)' : ''}"><div class="t"><b>${on ? '✓ ' : ''}${k.n}${hv.clv[k.id] ? ' ▲' : ''}</b><small style="white-space:normal">${has ? k.d(k.v[hv.clv[k.id] ? 1 : 0]) : '天賦解鎖'}</small></div></button>`;
      })
      .join('')}`;
  });
}
function townHTML() {
  const body = ({ prep: prepHTML, wh: whHTML, mk: mkHTML, shop: shopHTML, tree: treeHTML }[V.tab] || prepHTML)();
  const d = Math.min(S.d, S.maxD),
    dock =
      V.tab === 'prep'
        ? `<div class="dock"><div><button class="btn pri big" data-act="go">下地城 ${d}<span class="bnote">怪物 ${lvOf(d, 1)}～${lvOf(d, 3)} 級</span></button></div></div>`
        : '';
  return `<div class="town">${body}</div>${dock}<nav class="tabs"><div>${TABS.map(([k, ic, n]) => `<button class="tab" data-act="tab" data-t="${k}" aria-pressed="${V.tab === k}"><span>${ic}</span>${n}</button>`).join('')}</div></nav>`;
}
/* ================= 地城 ================= */
const NODEIC = {
  in: '⛺',
  fight: '⚔️',
  elite: '💀',
  chest: '📦',
  event: '❓',
  shop: '🛒',
  rest: '🏕️',
  empty: '·',
  exit: '🚪',
  stairs: '🪜',
  boss: '👑'
};
function hudHTML(run) {
  const P = P_of(run),
    hl = heatLv(run),
    zd = zodInfo(run);
  return `<div class="hud"><span class="fl">地城 ${run.d}・第 ${run.f} 層</span><span class="hearts">${'❤️'.repeat(run.hearts)}${'<span class="x">❤️</span>'.repeat(HEARTS - run.hearts)}</span>
  <span class="hpb big" style="grid-column:1/-1"><i style="width:${(run.hp / P.mhp) * 100}%"></i><em>生命 ${run.hp}/${P.mhp}</em></span>
  <div class="heat${run.hot ? ' hot' : ''}"><i style="width:${(run.heat / HEAT.max) * 100}%"></i><u style="left:${(HEAT.lv[1] / HEAT.max) * 100}%"></u><em>${run.hot ? '熱度滿了・生肖出沒' : `熱度 ${run.heat}/${HEAT.max}${hl ? '・怪物 +' + HEAT.mul[hl] * 100 + '%' : ''}`}</em></div>
  ${zd ? `<span class="sub c-bad" style="grid-column:1/-1">${zd}</span>` : ''}</div>`;
}
function zodInfo(run) {
  if (!run.hot) return '';
  const D = dists(run.map, run.pos),
    near = run.zs.length ? Math.min(...run.zs.map(z => D[z.pos])) : null,
    nx = HEAT.zodEvery - ((run.turn - run.hot) % HEAT.zodEvery);
  return `${near != null ? `最近的生肖離你 ${near} 格（你走 2 步牠走 1 格）・` : ''}再走 ${nx} 步出現下一隻`;
}
function mapHTML(run) {
  const M = run.map,
    mv = run.pend ? [] : moves(M, run.pos),
    go = new Set(mv.map(m => m.to));
  let svg = '';
  for (const e of M.E) {
    const a = M.N[e.a],
      b = M.N[e.b],
      on = (e.a === run.pos && go.has(e.b)) || (e.b === run.pos && go.has(e.a));
    svg += `<line x1="${a.x * 100}" y1="${a.y * 100}" x2="${b.x * 100}" y2="${b.y * 100}" class="${e.c > 1 ? 'c2' : ''}${on ? ' go' : ''}"/>`;
    if (e.o) {
      const mx = (a.x + b.x) * 50,
        my = (a.y + b.y) * 50,
        ang = Math.atan2(b.y - a.y, b.x - a.x),
        p = (d, s) => `${mx + Math.cos(ang + s) * d},${my + Math.sin(ang + s) * d}`;
      svg += `<polygon points="${p(2.4, 0)} ${p(2.2, 2.5)} ${p(2.2, -2.5)}"/>`;
    }
  }
  let nodes = '';
  for (const n of M.N) {
    const vis = visible(n),
      m = mv.find(x => x.to === n.id),
      here = n.id === run.pos;
    nodes += `<button class="node${n.done && !'exit'.includes(n.t) ? ' done' : ''}${vis ? '' : ' unk'}${m ? ' go' : ''}${here ? ' here' : ''}${n.t === 'exit' ? ' exit' : ''}" style="left:${n.x * 100}%;top:${n.y * 100}%" data-act="${m ? 'move' : 'nodeInfo'}" data-n="${n.id}" aria-label="${vis ? n.t : '未知'}">${vis ? (n.done && 'fight elite chest event shop rest'.includes(n.t) ? '·' : NODEIC[n.t]) : '?'}${m && m.c > 1 ? `<span class="cost">${m.c}</span>` : ''}</button>`;
  }
  const D = dists(M, run.pos);
  const zs = run.zs
    .map(
      z =>
        `<div class="zt" style="left:${M.N[z.pos].x * 100}%;top:${M.N[z.pos].y * 100}%"><img class="ic" data-sp="${z.foes[0].sp}" src="${spURL(z.foes[0].sp)}" alt="" style="width:34px;height:34px"><b>${D[z.pos]}</b></div>`
    )
    .join('');
  const tok = `<img class="tok ic" id="tok" data-sp="${S.av}" src="${spURL(S.av)}" alt="你" style="left:${M.N[run.pos].x * 100}%;top:${M.N[run.pos].y * 100}%">`;
  return `<div class="map" id="map"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${svg}</svg>${nodes}${zs}${tok}</div>`;
}
function runHTML() {
  const run = S.run,
    gn = run.ground.items.length;
  return `<div class="runv"><div class="pcol">${hudHTML(run)}${mapHTML(run)}</div><div class="pcol">
  <div class="runbar"><button class="btn" data-act="bag" style="position:relative;padding:0 var(--sp-4)">🎒 背包${gn ? `<span class="cost" style="position:absolute;right:-6px;top:-6px;min-width:20px;height:20px;border-radius:10px;background:var(--gold);color:var(--on-accent);font-size:11px;display:grid;place-items:center">${gn}</span>` : ''}</button>
  <p class="sub" style="margin:0;text-align:center">${gn ? `<span class="c-warn">地上有 ${gn} 件：走開就沒了</span>` : !run.pend && moves(run.map, run.pos).some(m => m.c > 1) ? '虛線是險路：走過去算 2 步' : '點亮起來的格子走過去'}</p>
  <span class="gold">${GOLDI()}${run.gold}</span></div></div></div>`;
}
function bagDlg(head = '') {
  V.dlg = null;
  openDlg(() => head + editorHTML());
  V.dlg.bag = 1;
}
/* 遭遇與待辦（打或跑、戰利品、商人、事件、撤離、下樓） */
function foeHTML(f) {
  const tn = { elite: '菁英', boss: '王', zod: '生肖' }[f.tier];
  return `<div class="foe"><img class="ic" data-sp="${f.sp}" src="${spURL(f.sp)}" alt=""><div class="t"><b>${esc(f.n)}</b>${tn ? `<span class="tier ${f.tier}">${tn}</span>` : ''}<small>生命 ${f.mhp}・攻擊 ${f.atk[0]}～${f.atk[1]}／${f.cd} 秒${f.arm ? `・護甲 ${f.arm}` : ''}</small>${f.aff.length ? `<small class="c-warn">${f.aff.map(a => MAFF[a].n + '（' + MAFF[a].d + '）').join('、')}</small>` : ''}${f.sk ? `<small class="c-bad">${BOSSES.find(b => b.n === f.n).skd}</small>` : ''}</div></div>`;
}
/* 怪物的背包（只能看，點道具看說明）：裡面的裝備讓帶頭的怪變強，打贏就是你的 */
function ebagHTML(g) {
  const cs = 30;
  let h = '';
  maskOf(g).forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === 'x')
        h += `<i class="cell" style="left:${4 + x * cs + 1}px;top:${4 + y * cs + 1}px;width:${cs - 2}px;height:${cs - 2}px"></i>`;
    })
  );
  for (const o of g.items)
    h += itemHTML(o, cs, 4 + o.x * cs, 4 + o.y * cs).replace(/class="part"/g, 'class="part" data-act="ebInfo"');
  return `<div class="grid ebag" style="width:${gridW(g) * cs + 8}px;height:${gridH(g) * cs + 8}px">${h}</div>`;
}
function pendDlg() {
  const run = S.run,
    p = run && run.pend;
  if (!p) return closeDlg();
  if (p.k === 'fight')
    return openDlg(() => {
      const P = P_of(run),
        dg = DANGER[danger(predict(P, run.hp, p.foes, h(run.seed, run.pos, 3)), P.mhp)],
        z = p.zod != null,
        lead = p.foes[0];
      return `<h2>${z ? '墮落十二生肖追上你了' : run.map.N[run.pos].t === 'boss' ? '王' : '遭遇'}</h2><div class="foes">${p.foes.map(foeHTML).join('')}</div>
      <div class="row" style="align-items:flex-start;gap:var(--sp-3);margin-bottom:var(--sp-3)">${ebagHTML(p.bag)}<div style="flex:1;min-width:0"><p class="sub" style="margin:0">${esc(lead.n)}的背包：${p.bag.items.length} 件。牠拿著這些裝備打你，打贏就是你的。</p><div class="danger c-${dg.c}"><b>${dg.n}</b><small>${dg.d}</small></div></div></div>
      <div class="g2"><button class="btn" data-act="flee" ${z ? 'disabled' : ''}>${z ? '生肖不能跑' : '跑'}${z ? '' : `<span class="bnote">退回上一格・熱度 +${HEAT.flee}</span>`}</button><button class="btn pri" data-act="fight">打</button></div>`;
    }, 1);
  if (p.k === 'loot') {
    run.lootFrom = p.chest ? '寶箱' : run.lootFrom || '戰利品';
    return bagDlg(
      `<h2>${p.chest ? '📦 寶箱' : '🏆 戰利品'}${p.gold ? ` <span class="gold" style="display:inline-flex">${GOLDI()}+${p.gold}</span>` : ''}</h2>`
    );
  }
  if (p.k === 'shop')
    return openDlg(() => {
      const st = run.map.N[run.pos].stock;
      return `<h2>🛒 地城商人</h2><p class="gold">${GOLDI()}${run.gold}</p>${st
        .map((s, i) => {
          const pr = shopPrice(run, s),
            nm = s.item ? ITEMI[s.item].n : itName(s.o),
            d = s.item ? baseLines(ITEMI[s.item])[0] : baseLines(baseOf(s.o))[0];
          return `<div class="rowx${s.sold ? ' off' : ''}"><div class="t"><b class="${s.o && rarity(s.o) ? 'n1' : ''}">${esc(nm)}</b><small>${d}</small></div>${s.sold ? '<span class="sub">已買</span>' : `<button class="btn buy" data-act="sbuy" data-i="${i}" ${run.gold < pr ? 'disabled' : ''}>${pr} 金</button>`}</div>`;
        })
        .join(
          ''
        )}<p class="sub">買的東西放在地上，離開時再放進背包。</p><button class="btn pri big" data-act="leaveShop">離開</button>`;
    }, 1);
  if (p.k === 'event')
    return openDlg(() => {
      const e = EVENTS[p.e];
      return `<h2>${e.ic} ${e.n}</h2><p>${e.d}</p><div style="display:grid;gap:var(--sp-2)">${e.o.map((o, j) => `<button class="btn${j ? '' : ' pri'}" data-act="ev" data-j="${j}" ${o.need && run.gold < o.need ? 'disabled' : ''}>${o.n}${o.need && run.gold < o.need ? `<span class="bnote">金幣不夠</span>` : ''}</button>`).join('')}</div>`;
    }, 1);
  if (p.k === 'msg')
    return openDlg(
      () => `<h2>${p.ic} ${p.t}</h2><p>${esc(p.d)}</p><button class="btn pri big" data-act="okPend">繼續</button>`,
      1
    );
  if (p.k === 'exit')
    return openDlg(() => {
      const n = run.bag.items.length;
      return `<h2>🚪 撤離點</h2><p>現在離開，背包裡的 ${n} 件、這趟的 ${run.gold} 金都帶回城鎮。</p><div class="g2"><button class="btn" data-act="okPend">繼續探索</button><button class="btn pri" data-act="extract">撤離</button></div>`;
    }, 1);
  if (p.k === 'stairs')
    return openDlg(
      () =>
        `<h2>🪜 往下一層</h2><p>第 ${run.f + 1} 層的怪物更強、寶物更好。生命、熱度會延續。</p><div class="g2"><button class="btn" data-act="okPend">留在這層</button><button class="btn pri" data-act="down">下樓</button></div>`,
      1
    );
  if (p.k === 'lost')
    return openDlg(
      () =>
        `<h2>💔 碎了一顆愛心</h2><p>你被打倒了，退回上一格、生命回滿。還剩 ${run.hearts} 顆愛心：全碎就會死在地城。</p><button class="btn pri big" data-act="okPend">繼續</button>`,
      1
    );
  if (p.k === 'dead') {
    const res = finishRun(S, false);
    save();
    V.scr = 'res';
    V.res = res;
    closeDlg();
    render();
  }
}
/* ================= 戰鬥播放 ================= */
let B = null;
function startFightView(res, foes, fbag) {
  /* 喝掉的藥水已經從背包拿掉了，訊息還要叫得出名字 */
  const gone = Object.fromEntries(res.used.map(u => [u, { id: 'potion' }]));
  B = {
    res,
    foes: foes.map(f => ({ ...f })),
    i: 0,
    t: 0,
    last: performance.now(),
    sp: Math.max(2, res.t / 8),
    wolves: 0,
    log: [],
    gone,
    fbag
  };
  V.scr = 'fight';
  closeDlg();
  render();
  requestAnimationFrame(bTick);
}
function fightHTML() {
  const run = S.run,
    P = P_of(run),
    e = B.res.ev[Math.max(0, B.i - 1)] || { h: run.hp, sh: 0 };
  return `<div class="fightv"><div class="hud"><span class="fl">戰鬥</span><button class="btn sm" data-act="skip">跳過</button></div>
  <div class="arena"><div class="unit" id="u-1"><img data-sp="${S.av}" src="${spURL(S.av)}" alt="" style="width:${DESK() ? 128 : 80}px;height:${DESK() ? 128 : 80}px"><span class="nm">${CLSI[run.hero.cls].n}</span><span class="hpb big" style="width:100%"><i id="mhp" style="width:${(e.h / P.mhp) * 100}%"></i><i class="bk" id="msh" style="width:${Math.min(100, (e.sh / P.mhp) * 100)}%"></i><em id="mtx">${e.h}</em></span><span class="wolves" id="wolves"></span></div>
  <div class="foecol" id="foecol">${B.foes.map((f, i) => unitHTML(f, i)).join('')}</div></div>
  <div class="fbot">${fightBagHTML(run.bag)}<div class="blog" id="blog" aria-live="polite">${B.log.slice(-6).join('')}</div></div></div>`;
}
/* 戰鬥中的背包（只看不能拖）：武器、盾發動時亮一下，底下的條是冷卻 */
function fightBagHTML(g) {
  const cs = Math.max(24, Math.min(DESK() ? 44 : 32, fl(((DESK() ? 520 : innerWidth - 32) * 0.55 - 8) / gridW(g))));
  let h = '';
  maskOf(g).forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === 'x')
        h += `<i class="cell" style="left:${4 + x * cs + 1}px;top:${4 + y * cs + 1}px;width:${cs - 2}px;height:${cs - 2}px"></i>`;
    })
  );
  for (const o of g.items) {
    const k = baseOf(o).k;
    h += itemHTML(o, cs, 4 + o.x * cs, 4 + o.y * cs, 'it fit').replace(
      '</div>',
      `${'ws'.includes(k) ? `<b class="cdb"><i id="cd${o.u}"></i></b>` : ''}</div>`
    );
  }
  return `<div class="grid fgrid" style="width:${gridW(g) * cs + 8}px;height:${gridH(g) * cs + 8}px">${h}</div>`;
}
/* 這件道具發動了：亮一下，冷卻條從頭跑（照播放速度） */
function itemFire(u, cd) {
  const it = document.querySelector(`.fgrid .it[data-u="${u}"]`);
  if (!it) return;
  spr(
    it,
    [
      { transform: 'scale(1.12)', filter: 'brightness(1.6)' },
      { transform: 'none', filter: 'none' }
    ],
    300
  );
  const bar = $('cd' + u);
  if (bar && cd) {
    if (bar._a) bar._a.cancel();
    bar._a = bar.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], {
      duration: (cd * 1000) / B.sp,
      easing: 'linear',
      fill: 'forwards'
    });
  }
}
/* 戰鬥訊息：一行一件事，新的在最下面 */
function logEv(e, P) {
  const run = S.run,
    fn = i => esc((B.foes[i] || {}).n || '敵人'),
    itn = u => {
      const o = run.bag.items.find(x => x.u === u) || B.gone[u] || (B.fbag && B.fbag.items.find(x => x.u === u));
      return o ? esc(baseOf(o).n) : '';
    },
    cdOf = u => {
      const w = P.weapons.find(x => x.u === u) || P.shields.find(x => x.u === u);
      return w && w.cd / (w.dmg ? 1 + P.spdPct / 100 : 1);
    };
  let t = '';
  if (e.k === 'hit') {
    const src = { wolf: '🐺 戰狼', dot: '持續傷害', th: '反彈', burst: '爆燃', bash: '盾擊' }[e.s];
    if (!src) itemFire(e.s, cdOf(e.s));
    if (e.s !== 'dot')
      t = `<span>${src || itn(e.s)} → ${fn(e.g)} <b class="${e.c ? 'c-gold' : ''}">${e.v}${e.c ? ' 暴擊' : ''}</b></span>`;
  } else if (e.k === 'hurt')
    t = e.dot
      ? `<span class="c-dim">持續傷害 <b class="c-bad">-${e.v}</b></span>`
      : `<span>${fn(e.s)}${e.u ? '的' + itn(e.u) : ''} → 你 ${e.v ? `<b class="c-bad">-${e.v}</b>` : '<span class="c-dim">護盾擋下</span>'}</span>`;
  else if (e.k === 'miss') t = `<span class="c-dim">閃過 ${fn(e.s)} 的攻擊</span>`;
  else if (e.k === 'shield') {
    if (e.u) itemFire(e.u, cdOf(e.u));
    t = `<span>${e.u ? itn(e.u) : '重整'} 護盾 <b>+${e.v}</b></span>`;
  } else if (e.k === 'fx') {
    if (e.u) itemFire(e.u);
    t = `<span class="c-gold">${esc(e.n)}${e.g >= 0 ? ' → ' + fn(e.g) : ''}</span>`;
  } else if (e.k === 'ail') t = e.g < 0 ? `<span class="c-warn">你 ${AILN[e.a]}</span>` : '';
  else if (e.k === 'die') t = `<span class="c-dim">${fn(e.g)} 倒下</span>`;
  else if (e.k === 'summon') t = `<span>${e.foe ? `${esc(e.foe.n)} 出現了` : `🐺 叫來戰狼（${e.n} 隻）`}</span>`;
  if (t) B.log.push(t);
}
const unitHTML = (f, i) =>
  `<div class="unit" id="u${i}"><img data-sp="${f.sp}" src="${spURL(f.sp)}" alt="" style="width:48px;height:48px"><div><span class="nm">${esc(f.n)}</span><span class="hpb"><i id="fh${i}" style="width:100%"></i></span></div></div>`;
function floatAt(id, txt, cls) {
  const u = $(id),
    ar = document.querySelector('.arena');
  if (!u || !ar) return;
  const r = u.getBoundingClientRect(),
    a = ar.getBoundingClientRect(),
    d = document.createElement('span');
  d.className = 'dmg ' + (cls || '');
  d.textContent = txt;
  d.style.left = r.left - a.left + r.width / 2 - 10 + (Math.random() * 20 - 10) + 'px';
  d.style.top = r.top - a.top + 4 + 'px';
  ar.appendChild(d);
  const an = d.animate(
    calm()
      ? [{ opacity: 1 }, { opacity: 0 }]
      : [
          { transform: 'translateY(0)', opacity: 1 },
          { transform: 'translateY(-28px)', opacity: 0 }
        ],
    { duration: 700, easing: 'cubic-bezier(0.23,1,0.32,1)' }
  );
  an.onfinish = () => d.remove();
}
function bTick(now) {
  if (!B || V.scr !== 'fight') return;
  const dt = Math.min(0.1, (now - B.last) / 1000);
  B.last = now;
  B.t += dt * B.sp;
  const ev = B.res.ev,
    P = P_of(S.run);
  let n = 0;
  const n0 = B.log.length;
  while (B.i < ev.length && ev[B.i].t <= B.t) {
    const e = ev[B.i++];
    n++;
    if (n < 6) showEv(e, P);
    else syncBars(e, P);
    logEv(e, P);
  }
  if (B.log.length !== n0) {
    const bl = $('blog');
    if (bl) bl.innerHTML = B.log.slice(-6).join('');
  }
  if (B.i >= ev.length) return endFight();
  requestAnimationFrame(bTick);
}
function syncBars(e, P) {
  const mh = $('mhp');
  if (mh) {
    mh.style.width = (Math.max(0, e.h) / P.mhp) * 100 + '%';
    $('msh').style.width = Math.min(100 - (Math.max(0, e.h) / P.mhp) * 100, (e.sh / P.mhp) * 100) + '%';
    $('mtx').textContent = Math.max(0, Math.round(e.h)) + (e.sh ? ` +${e.sh}` : '');
  }
  (e.fh || []).forEach((v, i) => {
    const b = $('fh' + i);
    if (b) b.style.width = (Math.max(0, v) / B.foes[i].mhp) * 100 + '%';
  });
}
function showEv(e, P) {
  if (e.k === 'summon' && e.foe) {
    B.foes[e.g] = e.foe;
    $('foecol').insertAdjacentHTML('beforeend', unitHTML(e.foe, e.g));
  }
  syncBars(e, P);
  if (e.k === 'hit') {
    floatAt('u' + e.g, e.v, e.c ? 'c' : '');
    if (e.c) snd('crit');
    else if (Math.random() < 0.4) snd('hit');
  }
  if (e.k === 'hurt') floatAt('u-1', e.v ? '-' + e.v : '擋', e.v ? 'me' : 'fx');
  if (e.k === 'miss') floatAt('u-1', '閃避', 'fx');
  if (e.k === 'heal') floatAt('u-1', '+' + e.v, 'hl');
  if (e.k === 'fx') floatAt(e.g >= 0 ? 'u' + e.g : 'u-1', e.n, 'fx');
  if (e.k === 'die') {
    const u = $('u' + e.g);
    if (u) u.classList.add('dead');
  }
  if (e.k === 'summon' && !e.foe) $('wolves').textContent = '🐺'.repeat(e.n);
}
function endFight() {
  const P = P_of(S.run);
  B.log.push(
    `<span class="${B.res.win ? 'c-good' : 'c-bad'}"><b>${B.res.win ? '勝利' : '被打倒了'}</b>・${B.res.t.toFixed(1)} 秒</span>`
  );
  if ($('blog')) $('blog').innerHTML = B.log.slice(-6).join('');
  syncBars(B.res.ev[B.res.ev.length - 1], P);
  B.res.ev.filter(e => e.k === 'die').forEach(e => $('u' + e.g) && $('u' + e.g).classList.add('dead'));
  snd(B.res.win ? 'win' : 'lose');
  B = null;
  setTimeout(() => {
    V.scr = 'run';
    render();
    pendDlg();
  }, 450);
}
/* ================= 結算 ================= */
function resHTML() {
  const r = V.res;
  return `<div class="res ${r.ok ? 'ok' : 'no'}"><div class="big">${r.ok ? '撤離成功' : '死在地城'}</div><p class="sub">地城 ${r.d}・第 ${r.f} 層・${r.turn} 回合・打倒 ${r.kills} 隻${r.boss ? '・👑 打倒了王，解鎖下一座地城' : ''}</p>
  <div class="kv" style="margin:var(--sp-4) 0"><div><span>金幣</span><b class="c-gold">+${r.gold}</b></div><div><span>${CLSI[r.cls].n}經驗</span><b>+${r.xp}</b></div><div><span>升級</span><b>${r.lvUp ? '+' + r.lvUp : '—'}</b></div></div>
  ${r.ok ? '<p>背包和裡面的東西都帶回來了。</p>' : `<p class="c-bad">失去了 ${esc(BAGI[r.bag].n)} 和裡面的 ${r.lost.length} 件道具。黑盒裡的東西還在。</p>${r.gold ? `<p class="sub">黑盒裡的錢袋保住了 ${r.gold} 金。</p>` : ''}`}
  ${r.lvUp ? '<p class="c-gold">有新的天賦點數可以點！</p>' : ''}
  <button class="btn pri big" data-act="home">回城鎮</button></div>`;
}
/* ================= 畫面與動作 ================= */
function render() {
  if (!S) return;
  const app = $('app');
  if (V.scr === 'run' && !S.run) V.scr = 'town';
  app.innerHTML =
    V.scr === 'run' ? runHTML() : V.scr === 'fight' ? fightHTML() : V.scr === 'res' ? resHTML() : townHTML();
  if (V.sel) detRender();
  coachSoon();
}
/* ================= 新手教學（框起要按的地方，其他變暗但不擋點擊；做了那個動作就換下一步） ================= */
/* s：要框的東西（null＝現在不適用）；ok：要按「知道了」的說明（其他的做了動作就算完成） */
const TIPS = [
  {
    k: 'go',
    s: () => V.scr === 'town' && V.tab === 'prep' && !V.dlg && '[data-act="go"]',
    t: '背包裡已經有桃木劍和皮甲。先下地城看看！'
  },
  {
    k: 'move',
    s: r => r && !V.dlg && '.node.go',
    t: '點亮起來的格子就走過去。「?」要走到旁邊才知道是什麼，每走一步熱度 +1'
  },
  {
    k: 'enc',
    s: r => r && V.dlg && r.pend && r.pend.k === 'fight' && '#modal .danger',
    t: '看危險等級和牠背包裡的裝備再決定。打不過可以跑：退回上一格、熱度 +5'
  },
  {
    k: 'loot',
    s: r => r && V.dlg && V.dlg.bag && r.ground.items.length && '#modal .grid[data-g="gr"]',
    t: '牠的背包攤在地上了：想要的拖進你的背包（或黑盒），走開就沒了',
    ok: 1
  },
  {
    k: 'heat',
    s: r => r && !V.dlg && r.turn >= 6 && '.heat',
    t: '熱度一直漲，滿了墮落十二生肖會來追殺你。帶著東西走到 🚪 撤離',
    ok: 1
  },
  {
    k: 'exit',
    s: r => r && V.dlg && r.pend && r.pend.k === 'exit' && '[data-act="extract"]',
    t: '撤離就把背包帶回城鎮；死在地城只剩黑盒',
    ok: 1
  },
  {
    k: 'tree',
    s: () =>
      V.scr === 'town' && !V.dlg && V.tab !== 'tree' && tPoints(S, S.cls) > 0 && '[data-act="tab"][data-t="tree"]',
    t: '升級拿到天賦點：去「職業」解鎖新的核心'
  }
];
function tip(k) {
  if (!S.tips[k]) {
    S.tips[k] = 1;
    save();
    coachSoon();
  }
}
let coachT;
const coachSoon = () => {
  cancelAnimationFrame(coachT);
  coachT = requestAnimationFrame(coach);
};
function coach() {
  const old = document.querySelector('.coach'),
    run = V.scr === 'run' ? S.run : null,
    c = !S.tips.skip && !DR && V.scr !== 'fight' && V.scr !== 'res' ? TIPS.find(x => !S.tips[x.k] && x.s(run)) : null,
    el = c && document.querySelector(c.s(run));
  if (!el) return old && old.remove();
  const r = el.getBoundingClientRect(),
    /* 說明卡開著時泡泡放最上面，不蓋到卡片裡的按鈕 */
    up = !V.dlg && r.top > innerHeight / 2,
    same = old && old.dataset.k === c.k,
    w = same ? old : document.createElement('div');
  w.className = 'coach';
  w.dataset.k = c.k;
  w.innerHTML = `<i class="cspot" style="left:${r.left - 4}px;top:${r.top - 4}px;width:${r.width + 8}px;height:${r.height + 8}px"></i><div class="cbub" style="${V.dlg ? 'top:calc(12px + var(--sat))' : up ? `bottom:${innerHeight - r.top + 14}px` : `top:${r.bottom + 14}px`}"><p>${c.t}</p>${c.ok ? `<button class="btn sm" data-act="tipOk" data-k="${c.k}">知道了</button>` : '<button class="btn sm" data-act="tipSkip">跳過教學</button>'}</div>`;
  if (!same) {
    old && old.remove();
    document.body.appendChild(w);
    /* 從框住的東西長出來 */
    spr(
      w.lastChild,
      [
        { opacity: 0, transform: `translateX(-50%) translateY(${up ? 8 : -8}px)` },
        { opacity: 1, transform: 'translateX(-50%)' }
      ],
      300
    );
  }
}
let lastMove = null;
const A = {
  /* 關掉待辦：撤離、下樓、商人、事件都當作「先不要」（之後走回來會再出現） */
  close: () => {
    const p = S.run && S.run.pend;
    if (p && p.k === 'fight') return;
    if (p) {
      S.run.pend = null;
      save();
    }
    closeDlg();
    if (S.run) render();
  },
  settings: () => settingsDlg(),
  ebInfo: el => {
    const p = S.run.pend,
      o = p && p.bag && p.bag.items.find(x => x.u === el.dataset.u);
    if (!o) return;
    openDlg(
      () =>
        `<div class="dh"><div class="slot-g${rarity(o) ? ' r1' : ''}"><img class="ic" src="${itIc(o)}" alt=""></div><div><b class="${rarity(o) ? 'n1' : ''}">${esc(itName(o))}</b><small>${KINDN[baseOf(o).k]}・${'★'.repeat(baseOf(o).star)}</small></div></div>${itemLines(o)}<button class="btn" style="width:100%" data-act="pendBack">← 回到遭遇</button>`,
      1
    );
  },
  pendBack: () => pendDlg(),
  theme: el => {
    S.theme = el.dataset.k || null;
    applyTheme();
    save();
    render();
    redlg();
  },
  av: el => {
    S.av = el.dataset.k;
    snd('select', 'select');
    save();
    render();
    redlg();
  },
  tipOk: el => tip(el.dataset.k),
  tipSkip: () => tip('skip'),
  sfx: () => {
    S.sfx = !S.sfx;
    save();
    render();
    redlg();
  },
  tab: el => {
    detClose();
    V.tab = el.dataset.t;
    if (V.tab === 'tree') tip('tree');
    render();
    scrollTo(0, 0);
  },
  selCls: el => {
    S.cls = el.dataset.c;
    save();
    render();
  },
  selBag: el => {
    S.sel = el.dataset.u;
    save();
    render();
  },
  selD: el => {
    S.d = +el.dataset.d;
    save();
    render();
  },
  cores: () => coreDlg(),
  core: el => {
    toggleCore(S, S.cls, el.dataset.id);
    save();
    render();
    redlg();
  },
  node: el => nodeDlg(+el.dataset.id),
  take: el => {
    const c = S.cls;
    if (takeNode(S, c, +el.dataset.id)) {
      snd('level', 'coin');
      save();
      render();
      closeDlg();
    }
  },
  resetTree: () => {
    resetTree(S, S.cls);
    save();
    render();
    toast('天賦點數全部退回了');
  },
  buy: el => {
    if (buyShop(S, +el.dataset.i)) {
      snd('coin', 'coin');
      save();
      detClose();
      render();
      toast('放進倉庫了');
    }
  },
  detX: () => detClose(),
  whf: el => {
    V.whf = el.dataset.k;
    render();
  },
  mkf: el => {
    V.mkf = el.dataset.k;
    render();
  },
  seg: el => {
    V[el.dataset.k] = el.dataset.v;
    detClose();
    render();
  },
  shopSel: el => detOpen({ src: 'shop', i: +el.dataset.i }),
  mkSel: el => detOpen({ src: 'mk', id: el.dataset.id }),
  mineSel: el => detOpen({ src: 'mine', id: el.dataset.id }),
  mkLoad: async () => {
    MK.at = 0;
    const p = mkLoad();
    render();
    await p;
    render();
  },
  mkBuy: async el => {
    el.disabled = true;
    const o = await mkBuy(el.dataset.id);
    detClose();
    render();
    if (o) {
      snd('coin', 'coin');
      toast(`買到了 ${baseOf(o).n}：放進倉庫`);
    } else toast(MK.err || '晚了一步：被別人買走或下架了');
  },
  mkCancel: async el => {
    el.disabled = true;
    const ok = await mkCancel(el.dataset.id);
    detClose();
    render();
    toast(ok ? '下架了：放回倉庫' : MK.err || '已經賣掉了');
  },
  mkClaim: async () => {
    const g = await mkClaim();
    render();
    if (g) {
      snd('coin', 'coin');
      toast(`+${g} 金`);
    }
  },
  mkSell: el => {
    const u = el.dataset.u;
    detClose();
    mkSellDlg(u);
  },
  mkp: el => ($('mkp').value = el.dataset.v),
  mkSellGo: async el => {
    const v = Math.round(+$('mkp').value);
    if (!(v >= 1 && v <= 99999)) return toast('價格要在 1～99999 之間');
    el.disabled = true;
    const ok = await mkSell(el.dataset.u, v);
    closeDlg();
    if (ok) {
      snd('coin', 'coin');
      toast('上架了');
      MK.at = 0;
      V.tab = 'mk';
      V.mkT = 'mine';
    } else toast(MK.err || '上架失敗');
    render();
  },
  buyBag: el => {
    if (buyBag(S, el.dataset.t)) {
      snd('coin', 'coin');
      save();
      V.tab = 'prep';
      render();
      toast('換上新背包了：把倉庫的裝備拖進去');
    }
  },
  rot: el => {
    const u = el.dataset.u,
      o = findIt(u),
      k = where(u),
      g = ctx()[k],
      r0 = o.r;
    o.r = (o.r + 1) % 4;
    if (!fits(g, o, o.x, o.y)) {
      o.r = r0;
      snd('nope', 'nope');
      return toast('轉了放不下：先挪出空間');
    }
    snd('tap', 'select');
    save();
    rerenderBag();
  },
  toBag: el => moveAuto(el.dataset.u, 'bag'),
  toBox: el => moveAuto(el.dataset.u, 'box'),
  toTray: el => {
    const c = ctx();
    if (!c.town) return moveAuto(el.dataset.u, 'gr');
    c.tray.push(take(el.dataset.u));
    save();
    snd('tap', 'select');
    rerenderBag();
  },
  sell: el => {
    const o = findIt(el.dataset.u),
      p = sellPrice(o);
    if (sellItem(S, el.dataset.u)) {
      snd('coin', 'coin');
      save();
      detClose();
      render();
      toast(`+${p} 金`);
    }
  },
  go: () => {
    tip('go');
    const c = ctx();
    if (!c.bag.items.some(o => baseOf(o).k === 'w')) return toast('背包裡沒有武器：從倉庫拖一把進去');
    depart(S, (Math.random() * 2 ** 31) | 0);
    snd('encounter');
    save();
    V.scr = 'run';
    render();
  },
  move: el => {
    tip('move');
    const run = S.run,
      to = +el.dataset.n,
      from = run.map.N[run.pos];
    if (!moveTo(run, to)) return;
    run.lootFrom = null;
    snd('tap', 'select');
    save();
    render();
    const tok = $('tok'),
      mp = $('map');
    if (tok && mp) {
      const w = mp.clientWidth,
        hh = mp.clientHeight,
        n = run.map.N[to];
      spr(
        tok,
        [{ transform: `translate(${(from.x - n.x) * w}px,${(from.y - n.y) * hh}px)` }, { transform: 'none' }],
        380
      );
    }
    if (run.pend) setTimeout(pendDlg, calm() ? 0 : 260);
  },
  nodeInfo: el => {
    const run = S.run,
      n = run.map.N[+el.dataset.n],
      vis = visible(n),
      NM = {
        in: '入口',
        fight: '戰鬥',
        elite: '菁英',
        chest: '寶箱',
        event: '事件',
        shop: '地城商人',
        rest: '休息',
        empty: '空地',
        exit: '撤離點',
        stairs: '樓梯',
        boss: '王'
      },
      z = run.zs.find(z => z.pos === n.id);
    openDlg(
      () =>
        `<h2>${vis ? NODEIC[n.t] + ' ' + NM[n.t] : '? 還沒看過'}</h2>${z ? foeHTML(z.foe) : ''}${vis && n.foes && !n.done ? `<div class="foes">${n.foes.map(foeHTML).join('')}</div>` : ''}<p class="sub">${n.id === run.pos ? '你在這裡。' : vis ? (n.done ? '已經處理過了。' : '出牌拿移動點，再點亮起來的格子走過去。') : '走到旁邊或用「偵查」才看得到。'}</p>`,
      1
    );
  },
  bag: () => bagDlg(),
  bagFromLoot: () => {
    tip('loot');
    S.run.pend = null;
    save();
    bagDlg();
  },
  lootInfo: el => itemDlg(el.dataset.u),
  okPend: () => {
    if (S.run.pend) tip({ loot: 'loot', exit: 'exit' }[S.run.pend.k] || 'x');
    S.run.pend = null;
    save();
    closeDlg();
    render();
  },
  fight: () => {
    tip('enc');
    const run = S.run,
      foes = run.pend.foes,
      bag = run.pend.bag;
    run.lootFrom = `${foes[0].n}的背包`;
    const res = fightNow(run);
    save();
    startFightView(res, foes, bag);
  },
  flee: () => {
    tip('enc');
    if (flee(S.run)) {
      snd('nope');
      save();
      closeDlg();
      render();
      toast(`逃跑了：熱度 +${HEAT.flee}`);
    }
  },
  skip: () => {
    if (!B) return;
    B.t = 1e9;
    B.sp = 1e9;
  },
  sbuy: el => {
    if (shopBuy(S.run, +el.dataset.i)) {
      snd('coin', 'coin');
      save();
      redlg();
      render();
    }
  },
  leaveShop: () => {
    S.run.map.N[S.run.pos].done = 1;
    S.run.pend = null;
    save();
    if (S.run.ground.items.length) bagDlg();
    else closeDlg();
    render();
  },
  ev: el => {
    if (eventPick(S.run, +el.dataset.j) != null) {
      snd('select', 'select');
      save();
      render();
      pendDlg();
    }
  },
  extract: () => {
    tip('exit');
    const res = finishRun(S, true);
    snd('win');
    save();
    V.scr = 'res';
    V.res = res;
    closeDlg();
    render();
  },
  down: () => {
    goDown(S.run);
    snd('encounter');
    save();
    closeDlg();
    render();
  },
  home: () => {
    V.scr = 'town';
    V.tab = 'prep';
    render();
    scrollTo(0, 0);
  }
};
/* 自動找位置放；放不下就放回原位 */
function moveAuto(u, k) {
  const c = ctx(),
    from = where(u),
    o = take(u),
    back = { x: o.x, y: o.y, r: o.r };
  if (!autoPlace(c[k], o)) {
    Object.assign(o, back);
    (from === 'tray' ? c.tray : c[from].items).push(o);
    snd('nope', 'nope');
    return toast({ bag: '背包放不下：先拿出別的東西', box: '黑盒放不下', gr: '地上放不下' }[k]);
  }
  snd('select', 'select');
  save();
  rerenderBag();
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  if (el.closest('#modal') && !el.closest('.sheet')) return;
  const f = A[el.dataset.act];
  if (f) f(el, e);
});
/* 點卡片外的暗處關閉 */
$('modal').addEventListener('click', e => {
  if (e.target.id === 'modal' && $('modal').querySelector('.x')) A.close();
});
addEventListener('resize', () => {
  clearTimeout(rpT);
  rpT = setTimeout(() => V.scr !== 'fight' && render(), 150);
});
addEventListener('scroll', coachSoon, { passive: true });
document.addEventListener('change', e => {
  if (e.target.id !== 'nm') return;
  S.name = e.target.value.trim().slice(0, 12) || '冒險者';
  save();
  toast('名字改好了');
});
/* 點說明卡以外的地方（不是道具、不是按鈕）就收起來 */
document.addEventListener('pointerdown', e => {
  if (V.sel && !e.target.closest('#det,.part,.tray .slot-g,.sc,[data-act],#modal')) detClose();
});
