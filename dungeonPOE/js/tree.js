/* dungeonPOE · 天賦樹（P，照 PoE）：一千多個點；拖曳移動、滾輪縮放；
   點亮著的點＝點下去，再點一次＝退回（不能把後面斷開）。昇華（中間挖空的地方）0.2.9 砍掉，之後重新設計 */
'use strict';
const TREE = { open: false, x: 0, y: 0, z: 0.55, drag: null };
const ptLeft = () => ptPoints(S.lv) - (S.pt.length - PT_START.length);
function treeCan(id) {
  if (S.pt.includes(id) || ptLeft() <= 0) return false;
  return (PTREE.ADJ[id] || []).some(o => S.pt.includes(o));
}
/* 退回後其他點還連得到起點嗎 */
function treeCanRefund(id) {
  const have = new Set(S.pt),
    start = PT_START;
  if (start.includes(id) || !have.has(id)) return false;
  have.delete(id);
  const adj = PTREE.ADJ,
    seen = new Set(start),
    q = [...start];
  while (q.length) for (const o of adj[q.pop()] || []) if (have.has(o) && !seen.has(o)) seen.add(o), q.push(o);
  return seen.size === have.size;
}
function treeOpen() {
  if (TREE.open) return treeClose();
  closePanels();
  /* 起點的 6 個門大約在半徑 560 的圈上；窄螢幕（直立）縮到看得到全部的門 */
  Object.assign(TREE, { open: true, x: 0, y: 0, z: Math.min(0.55, (innerWidth / 2 - 30) / 560) });
  $('ptree').hidden = false;
  treeRender();
}
function treeClose() {
  TREE.open = false;
  TREE.sel = null;
  $('ptree').hidden = true;
  hideTip();
}
function treeRender() {
  if (!TREE.open) return;
  const have = new Set(S.pt);
  const line = (A, B, on, near, cls = '') =>
    `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" class="${on ? 'on' : near ? 'near' : ''} ${cls}"/>`;
  /* 軌道拼塊的連線畫成弧（PTREE.ARC：圓心、半徑），其他是直線 */
  const arc = (A, B, [cx, cy, r], cls) => {
    const cw = (A.x - cx) * (B.y - cy) - (A.y - cy) * (B.x - cx) > 0 ? 1 : 0;
    return `<path d="M${A.x.toFixed(1)} ${A.y.toFixed(1)} A${r.toFixed(1)} ${r.toFixed(1)} 0 0 ${cw} ${B.x.toFixed(1)} ${B.y.toFixed(1)}" class="${cls}"/>`;
  };
  let html = PTREE.E.map(([a, b]) => {
    const A = PTREE.I[a],
      B = PTREE.I[b],
      on = have.has(a) && have.has(b),
      near = have.has(a) || have.has(b);
    const c = PTREE.ARC[a + '|' + b];
    return c ? arc(A, B, c, on ? 'on' : near ? 'near' : '') : line(A, B, on, near);
  }).join('');
  /* 圖示：每張只定義一次（<defs>），點用 <use> 引用，一千多個點也不會太重 */
  const used = new Set(PTREE.N.map(n => n.ic).filter(Boolean)),
    defs = [...used]
      .map(ic => [ic, artIconURL(ic)])
      .filter(([, u]) => u)
      .map(([ic, u]) => `<image id="ti_${ic}" href="${u}" width="1" height="1"/>`)
      .join('');
  html = `<defs>${defs}</defs>` + html;
  html += PTREE.N.map(n => {
    const r = n.big === 2 ? 30 : n.gate ? 20 : n.big ? 19 : 10,
      st = have.has(n.id) ? 'on' : treeCan(n.id) ? 'can' : 'off',
      s = r * (n.big ? 1.4 : 1.3),
      img =
        n.ic && artIconURL(n.ic)
          ? `<use href="#ti_${n.ic}" transform="translate(${-s / 2} ${-s / 2}) scale(${s})"/>`
          : '';
    return `<g class="nd ${st} b${n.big}${TREE.sel === n.id ? ' sel' : ''}" data-n="${n.id}" transform="translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})" style="--c:${PT_THEME[n.th].c}"><circle r="${r}"/>${img}</g>`;
  }).join('');
  html += `<circle class="hollow" r="${PT_R0 - 40}"/><text class="hint" y="6">昇華重新設計中</text>`;
  $('ptree').innerHTML = `<div class="tbar">
    <b>天賦樹</b>
    <span>天賦點 剩 <b class="${ptLeft() > 0 ? 'c-gold' : ''}">${ptLeft()}</b>（每升一級 1 點）</span>
    <button class="btn" data-ta="reset" ${S.pt.length > PT_START.length ? '' : 'disabled'}>重置天賦</button>
    <button class="x" aria-label="關閉" data-ta="close">${ICO.x}</button></div>
  <svg id="tsvg"><g id="tg">${html}</g></svg>
  <p class="thelp"><b>方向</b> 上 生命護甲 · 右上 近戰攻速 · 右 投射物陷阱 · 下 暴擊圖騰召喚 · 左下 元素法術 · 左上 能量護盾精魄　<b>操作</b> 點亮著的點＝點下去，再點＝退回 · 拖曳移動 · 滾輪縮放　越外圈的大點越強，帶代價的最強</p>`;
  treeView();
}
function treeView() {
  const svg = $('tsvg');
  if (!svg) return;
  $('tg').setAttribute(
    'transform',
    `translate(${svg.clientWidth / 2 + TREE.x} ${svg.clientHeight / 2 + TREE.y}) scale(${TREE.z})`
  );
}
function treeToggle(id) {
  const have = S.pt;
  if (have.includes(id)) {
    if (!treeCanRefund(id)) return hudWarn(PT_START.includes(id) ? '起點不能退' : '先退後面的點');
    have.splice(have.indexOf(id), 1);
  } else if (treeCan(id)) have.push(id);
  else return hudWarn(ptLeft() <= 0 ? '沒有天賦點了：升級會再給' : '要跟點過的點連在一起');
  sfx('equip');
  treeChanged();
}
function treeChanged() {
  const hpF = P.hp / ST.hp;
  ST = stats();
  P.hp = Math.min(ST.hp, Math.max(1, hpF * ST.hp));
  P.mp = Math.min(ST.mp, P.mp);
  save();
  hudBar();
  treeRender();
}
const statLines = s =>
  Object.entries(s).map(([k, v]) =>
    k === 'blood' ? STATN[k][0] : `${STATN[k][0]} ${v > 0 ? '+' : ''}${v}${STATN[k][1]}`
  );
function treeTip(id) {
  const n = PTREE.I[id];
  const kind = n.big === 2 ? '基石' : n.gate ? '起點' : n.big ? '大點' : '小點';
  const lines = n.d ? [esc(n.d)] : statLines(n.s);
  return `<b class="${n.big === 2 ? 'c-gold' : ''}">${esc(n.n)}</b><small>${kind}</small>${lines.length ? `<p class="aff">${lines.join('<br>')}</p>` : ''}`;
}
/* 以畫面上一點為中心縮放 */
function treeZoomAt(cx, cy, z) {
  const svg = $('tsvg').getBoundingClientRect(),
    mx = cx - svg.left - svg.width / 2 - TREE.x,
    my = cy - svg.top - svg.height / 2 - TREE.y;
  z = clamp(z, 0.12, 1.6);
  TREE.x -= mx * (z / TREE.z - 1);
  TREE.y -= my * (z / TREE.z - 1);
  TREE.z = z;
  treeView();
}
function treeInit() {
  const el = $('ptree'),
    TP = new Map(); /* 按著的手指（兩指＝縮放） */
  const pinchD = () => {
    const [a, b] = [...TP.values()];
    return [Math.hypot(a.x - b.x, a.y - b.y), (a.x + b.x) / 2, (a.y + b.y) / 2];
  };
  el.addEventListener('pointerdown', e => {
    if (!e.target.closest('#tsvg')) return;
    TP.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.target.closest('#tsvg').setPointerCapture(e.pointerId);
    if (TP.size === 2) {
      TREE.pinch = { d: pinchD()[0], z: TREE.z };
      TREE.drag = null;
      return hideTip();
    }
    TREE.drag = { x: e.clientX, y: e.clientY, ox: TREE.x, oy: TREE.y, moved: false, n: e.target.closest('.nd') };
  });
  el.addEventListener('pointermove', e => {
    if (TP.has(e.pointerId)) TP.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (TREE.pinch && TP.size >= 2) {
      const [d, cx, cy] = pinchD();
      return treeZoomAt(cx, cy, (TREE.pinch.z * d) / TREE.pinch.d);
    }
    const g = TREE.drag;
    if (g) {
      if (Math.hypot(e.clientX - g.x, e.clientY - g.y) > 8) g.moved = true;
      if (g.moved) {
        TREE.x = g.ox + e.clientX - g.x;
        TREE.y = g.oy + e.clientY - g.y;
        treeView();
        return hideTip();
      }
    }
    if (e.pointerType !== 'mouse') return;
    const n = e.target.closest('.nd');
    if (n) {
      const r = n.getBoundingClientRect();
      showTip(treeTip(n.dataset.n), r.right, r.top + r.height / 2);
    } else hideTip();
  });
  const up = e => {
    TP.delete(e.pointerId);
    if (TREE.pinch) {
      if (TP.size < 2) TREE.pinch = null;
      TREE.drag = null;
      return;
    }
    const g = TREE.drag;
    TREE.drag = null;
    if (!g || g.moved || e.type !== 'pointerup') return;
    if (!g.n) {
      if (TOUCH.on && TREE.sel) (TREE.sel = null), hideTip(), treeRender();
      return;
    }
    const id = g.n.dataset.n;
    /* 手機：點一下＝選取看說明，再點一次才點亮／退回 */
    if (TOUCH.on && TREE.sel !== id) {
      TREE.sel = id;
      treeRender();
      const r = document.querySelector(`#tg [data-n="${id}"]`).getBoundingClientRect(),
        have = S.pt.includes(id);
      showTip(treeTip(id) + `<p class="hint">再點一次${have ? '退回' : '點亮'}</p>`, r.right, r.top + r.height / 2);
      return;
    }
    TREE.sel = null;
    hideTip();
    treeToggle(id);
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener(
    'wheel',
    e => {
      e.preventDefault();
      treeZoomAt(e.clientX, e.clientY, TREE.z * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
    },
    { passive: false }
  );
  el.addEventListener('click', e => {
    const a = e.target.closest('[data-ta]');
    if (!a) return;
    if (a.dataset.ta === 'close') treeClose();
    if (a.dataset.ta === 'reset') (S.pt = [...PT_START]), treeChanged();
  });
  addEventListener('resize', treeView);
}
