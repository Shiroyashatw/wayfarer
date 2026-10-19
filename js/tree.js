/* 漫步勇者 · 天賦樹全螢幕介面 */
'use strict';
/* ================= passive tree (full screen) ================= */
const startOf = cls => 'start_' + (cls || 'novice');
const blockedStart = id => {
  const n = TREE.byId[id];
  return n && n.type === 'start' && n.cls !== S.cls;
};
const treeAdj = () =>
  TREE.adj ||
  (TREE.adj = (() => {
    const m = {};
    for (const [a, b] of TREE.E) {
      (m[a] = m[a] || []).push(b);
      (m[b] = m[b] || []).push(a);
    }
    return m;
  })());
function canAlloc(id, have = new Set(S.tree)) {
  if (have.has(id) || blockedStart(id)) return false;
  return (treeAdj()[id] || []).some(y => have.has(y));
}
function pathTo(id) {
  if (S.tree.includes(id) || blockedStart(id)) return null;
  const have = new Set(S.tree),
    prev = new Map(),
    q = [...S.tree];
  const seen = new Set(q),
    adj = treeAdj();
  while (q.length) {
    const x = q.shift();
    if (x === id) break;
    for (const y of adj[x] || []) {
      if (seen.has(y) || blockedStart(y)) continue;
      seen.add(y);
      prev.set(y, x);
      q.push(y);
    }
  }
  if (!seen.has(id)) return null;
  const path = [];
  let c = id;
  while (c && !have.has(c)) {
    path.push(c);
    c = prev.get(c);
  }
  return path.reverse();
}
/* 退點（demo 免費）：拿掉後其他已點的節點仍然要連回起點 */
function canRefund(id) {
  if (!S.tree.includes(id) || TREE.byId[id].type === 'start') return false;
  const rest = new Set(S.tree.filter(x => x !== id)),
    st = startOf(S.cls),
    seen = new Set([st]),
    q = [st],
    adj = treeAdj();
  while (q.length) {
    for (const y of adj[q.shift()] || [])
      if (rest.has(y) && !seen.has(y)) {
        seen.add(y);
        q.push(y);
      }
  }
  return seen.size === rest.size;
}
/* 已點節點的效果加總 */
function treeTotals() {
  const t = {},
    keys = [];
  for (const id of S.tree) {
    const n = TREE.byId[id];
    if (!n) continue;
    if (n.type === 'key') keys.push(n);
    for (const k in n.st) t[k] = (t[k] || 0) + n.st[k];
  }
  return { t, keys };
}
const TV = { s: 1, x: 0, y: 0, W: 0, H: 0, D: 1, sum: false };
function openTree() {
  closeSheet();
  $('treeView').hidden = false;
  sizeTree();
  treeFit();
  renderTreeCard();
  sfx('select');
}
function closeTree() {
  $('treeView').hidden = true;
  selNode = null;
  TV.sum = false;
  renderHud();
  save();
}
function sizeTree() {
  const cv = $('treeCv');
  TV.D = Math.min(2, window.devicePixelRatio || 1);
  TV.W = window.innerWidth;
  TV.H = window.innerHeight;
  cv.width = Math.round(TV.W * TV.D);
  cv.height = Math.round(TV.H * TV.D);
}
function treeFit() {
  const st = TREE.byId[startOf(S.cls)];
  TV.s = Math.min(TV.W, TV.H) / 560;
  TV.x = st.x * 0.8;
  TV.y = st.y * 0.8 + 40 / TV.s;
  drawTree();
}
const TX = x => (x - TV.x) * TV.s + TV.W / 2,
  TY = y => (y - TV.y) * TV.s + TV.H / 2;
const CLSN = { novice: '冒險者之魂', knight: '戰士之魂', ranger: '遊俠之魂', mage: '術士之魂' };
const NR = { start: 28, key: 17, notable: 13, small: 8 };
function drawTree() {
  const cv = $('treeCv');
  if (!cv || $('treeView').hidden) return;
  const x = cv.getContext('2d');
  x.setTransform(TV.D, 0, 0, TV.D, 0, 0);
  x.imageSmoothingEnabled = false;
  const g = x.createRadialGradient(TX(0), TY(0), 20 * TV.s, TX(0), TY(0), 820 * TV.s);
  g.addColorStop(0, '#2b2436');
  g.addColorStop(0.5, '#18131f');
  g.addColorStop(1, '#0c0a10');
  x.fillStyle = g;
  x.fillRect(0, 0, TV.W, TV.H);
  // 裝飾圓環：起始圓盤、中圈、外圈
  x.strokeStyle = 'rgba(201,164,92,.18)';
  x.lineWidth = Math.max(1, 10 * TV.s);
  x.beginPath();
  x.arc(TX(0), TY(0), 125 * TV.s, 0, 6.28);
  x.stroke();
  x.strokeStyle = 'rgba(201,164,92,.07)';
  x.lineWidth = Math.max(1, 4 * TV.s);
  [420, 588].forEach(r => {
    x.beginPath();
    x.arc(TX(0), TY(0), r * TV.s, 0, 6.28);
    x.stroke();
  });
  x.fillStyle = 'rgba(201,164,92,.06)';
  x.beginPath();
  x.arc(TX(0), TY(0), 100 * TV.s, 0, 6.28);
  x.fill();
  const fs = Math.max(10, Math.min(16, 13 * TV.s));
  x.font = `${fs}px DotGothic16, sans-serif`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  [
    ['力量', 150],
    ['力量・智力', 210],
    ['智力', -90],
    ['智力・敏捷', -30],
    ['敏捷', 30],
    ['敏捷・力量', 90]
  ].forEach(([t, a]) => {
    x.fillStyle = 'rgba(255,255,255,.2)';
    x.fillText(t, TX(780 * Math.cos((a * Math.PI) / 180)), TY(780 * Math.sin((a * Math.PI) / 180)));
  });
  const have = new Set(S.tree),
    path = selNode ? pathTo(selNode) : null,
    pset = new Set(path || []);
  for (const [a, b] of TREE.E) {
    const A = TREE.byId[a],
      Bn = TREE.byId[b],
      on = have.has(a) && have.has(b),
      pp = (pset.has(a) || have.has(a)) && (pset.has(b) || have.has(b)) && (pset.has(a) || pset.has(b));
    const ax = TX(A.x),
      ay = TY(A.y),
      bx = TX(Bn.x),
      by = TY(Bn.y);
    if (
      Math.max(ax, bx) < -20 ||
      Math.min(ax, bx) > TV.W + 20 ||
      Math.max(ay, by) < -20 ||
      Math.min(ay, by) > TV.H + 20
    )
      continue;
    x.strokeStyle = on ? '#f2c14e' : pp ? 'rgba(140,220,255,.85)' : 'rgba(255,255,255,.13)';
    x.lineWidth = Math.max(1.2, (on ? 4 : pp ? 3 : 2.4) * TV.s);
    x.beginPath();
    x.moveTo(ax, ay);
    x.lineTo(bx, by);
    x.stroke();
  }
  const lab = [];
  for (const n of TREE.N) {
    const sx = TX(n.x),
      sy = TY(n.y);
    if (sx < -60 || sx > TV.W + 60 || sy < -60 || sy > TV.H + 60) continue;
    const on = have.has(n.id),
      can = canAlloc(n.id, have),
      inp = pset.has(n.id);
    const r = NR[n.type] * TV.s;
    if (n.type === 'start') {
      const mine = n.cls === S.cls;
      x.fillStyle = mine ? '#3a2e16' : '#1c1822';
      x.strokeStyle = mine ? '#f2c14e' : 'rgba(201,164,92,.35)';
      x.lineWidth = Math.max(2, 4 * TV.s);
      x.beginPath();
      x.arc(sx, sy, r, 0, 6.28);
      x.fill();
      x.stroke();
      x.lineWidth = Math.max(1, 1.5 * TV.s);
      x.beginPath();
      x.arc(sx, sy, r * 0.78, 0, 6.28);
      x.stroke();
      const im = nodeIcon(n.ic),
        is = r * 1.05;
      x.globalAlpha = mine ? 1 : 0.45;
      if (im.complete) x.drawImage(im, sx - is / 2, sy - is / 2, is, is);
      else im.onload = drawTree;
      x.globalAlpha = 1;
      x.fillStyle = mine ? '#f2d9a6' : 'rgba(242,217,166,.45)';
      x.fillText(CLSN[n.cls], sx, n.cls === 'novice' ? sy - r - fs * 0.9 : sy + r + fs * 0.9);
      if (n.id === selNode) {
        x.strokeStyle = '#fff';
        x.lineWidth = 2;
        x.beginPath();
        x.arc(sx, sy, r + 6, 0, 6.28);
        x.stroke();
      }
      continue;
    }
    if (n.id === selNode) {
      x.strokeStyle = '#fff';
      x.lineWidth = 2;
      x.beginPath();
      x.arc(sx, sy, r + 6 * TV.s + 2, 0, 6.28);
      x.stroke();
    }
    if (on) {
      x.fillStyle = n.type === 'key' ? 'rgba(232,135,58,.35)' : 'rgba(242,193,78,.3)';
      x.beginPath();
      x.arc(sx, sy, r + 5 * TV.s, 0, 6.28);
      x.fill();
    }
    x.fillStyle = on ? '#3a2e16' : inp ? '#203040' : can ? '#2e2836' : '#1a1620';
    x.strokeStyle = on
      ? n.type === 'key'
        ? '#e8873a'
        : '#f2c14e'
      : inp
        ? '#8fdcff'
        : can
          ? '#c9a45c'
          : n.type === 'key'
            ? '#7a5a3a'
            : '#4a4054';
    x.lineWidth = Math.max(1, (n.type === 'small' ? 1.6 : 2.6) * TV.s);
    x.beginPath();
    if (n.type === 'key') {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * 6.28 - Math.PI / 2;
        x[i ? 'lineTo' : 'moveTo'](sx + Math.cos(a) * r, sy + Math.sin(a) * r);
      }
      x.closePath();
    } else x.arc(sx, sy, r, 0, 6.28);
    x.fill();
    x.stroke();
    const im = nodeIcon(n.ic),
      is = r * (n.type === 'small' ? 1.3 : 1.15);
    x.globalAlpha = on || inp ? 1 : can ? 0.85 : 0.42;
    if (im.complete) x.drawImage(im, sx - is / 2, sy - is / 2, is, is);
    else im.onload = drawTree;
    x.globalAlpha = 1;
    if ((n.type === 'key' && TV.s > 0.3) || (n.type === 'notable' && TV.s > 1.25))
      lab.push([n, sx, sy + r + fs * 0.75, on]);
  }
  // 名稱最後畫，才不會被節點蓋住
  for (const [n, sx, sy, on] of lab) {
    const w = x.measureText(n.n).width + 8;
    x.fillStyle = 'rgba(12,10,16,.75)';
    x.fillRect(sx - w / 2, sy - fs * 0.62, w, fs * 1.24);
    x.fillStyle = n.type === 'key' ? (on ? '#ffb877' : '#e8873a') : on ? '#f2d9a6' : '#c9b88a';
    x.fillText(n.n, sx, sy);
  }
  $('tvPts').innerHTML =
    `<b>${treePts()}</b> 點可用<small>已點 ${S.tree.length - 1} / ${TREE.N.length - 4}・每升一級 +1</small>`;
}
function renderTreeCard() {
  const el = $('tvCard'),
    n = selNode && TREE.byId[selNode];
  if (TV.sum) {
    const { t, keys } = treeTotals(),
      rows = Object.entries(t)
        .filter(([k, v]) => v && STATN[k])
        .map(([k, v]) => STATN[k](v));
    el.innerHTML = `<div class="rowx"><b style="color:var(--gold)">已點天賦效果</b><button class="btn sm" data-act="treeSum">返回</button></div>${keys.length ? `<div class="sub" style="color:#e8873a">基石：${keys.map(k => k.n).join('、')}</div>` : ''}<div class="sub tsum">${rows.length ? rows.join('<br>') : '還沒有點任何天賦。'}</div>`;
    drawTree();
    return;
  }
  if (!n) {
    el.innerHTML = `<div class="rowx"><span class="sub">點節點看效果。從你的起點（金框圓盤）往外點；藍色線是要點亮的路徑。路線盡頭的六角形是<b style="color:#e8873a">基石</b>，會改變戰鬥規則。</span><button class="btn sm" style="flex:none;white-space:nowrap" data-act="treeSum">總覽</button></div>`;
    drawTree();
    return;
  }
  const path = pathTo(n.id),
    cost = path ? path.length : 0,
    stats = Object.entries(n.st)
      .map(([k, v]) => STATN[k](v))
      .join('<br>');
  let btn;
  if (S.tree.includes(n.id))
    btn =
      n.type === 'start'
        ? '<span class="sub" style="color:var(--good)">你的起點</span>'
        : canRefund(n.id)
          ? `<div class="btns"><span class="sub" style="color:var(--good);align-self:center">已點亮</span><button class="btn sm" data-act="refund">退點</button></div>`
          : '<span class="sub" style="color:var(--good)">已點亮・要退點請先退掉更外面的節點</span>';
  else if (blockedStart(n.id)) btn = '<span class="sub">其他起點，無法點亮，但可以從旁邊的節點繞過去</span>';
  else if (!path) btn = '<span class="sub">無法到達</span>';
  else
    btn = `<button class="btn pri" data-act="alloc" ${cost <= treePts() ? '' : 'disabled'}>${cost <= treePts() ? `點亮（${cost} 點）` : `需要 ${cost} 點，目前 ${treePts()} 點`}</button>`;
  el.innerHTML = `<div class="ent"><img class="bigico" src="${pixURL('ic_' + n.ic)}" alt=""><div style="min-width:0;flex:1"><b style="color:${n.type === 'key' ? '#e8873a' : n.type === 'notable' || n.type === 'start' ? 'var(--gold)' : 'var(--ink)'}">${n.n}${n.type === 'key' ? '・基石' : n.type === 'notable' ? '・重要節點' : ''}</b><div class="sub">${stats || '—'}</div></div></div>${btn}`;
  drawTree();
}
(() => {
  const cv = $('treeCv'),
    pts = new Map();
  let drag = null,
    pinch = null;
  cv.addEventListener('pointerdown', ev => {
    cv.setPointerCapture(ev.pointerId);
    pts.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pts.size === 1) drag = { x: ev.clientX, y: ev.clientY, cx: TV.x, cy: TV.y, moved: false };
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch = {
        d: Math.hypot(a.x - b.x, a.y - b.y),
        s: TV.s,
        mx: (a.x + b.x) / 2,
        my: (a.y + b.y) / 2,
        cx: TV.x,
        cy: TV.y
      };
      drag = null;
    }
  });
  cv.addEventListener('pointermove', ev => {
    if (!pts.has(ev.pointerId)) return;
    pts.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pinch && pts.size === 2) {
      const [a, b] = [...pts.values()],
        ns = Math.max(0.2, Math.min(3.2, (pinch.s * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.d));
      const wx = (pinch.mx - TV.W / 2) / pinch.s + pinch.cx,
        wy = (pinch.my - TV.H / 2) / pinch.s + pinch.cy;
      TV.s = ns;
      TV.x = wx - ((a.x + b.x) / 2 - TV.W / 2) / ns;
      TV.y = wy - ((a.y + b.y) / 2 - TV.H / 2) / ns;
      drawTree();
      return;
    }
    if (drag) {
      const dx = ev.clientX - drag.x,
        dy = ev.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 8) drag.moved = true;
      if (drag.moved) {
        TV.x = drag.cx - dx / TV.s;
        TV.y = drag.cy - dy / TV.s;
        drawTree();
      }
    }
  });
  const end = ev => {
    const tap = drag && !drag.moved && pts.size === 1 && ev.type === 'pointerup';
    pts.delete(ev.pointerId);
    if (pts.size < 2) pinch = null;
    if (!pts.size) drag = null;
    if (tap) {
      const wx = (ev.clientX - TV.W / 2) / TV.s + TV.x,
        wy = (ev.clientY - TV.H / 2) / TV.s + TV.y;
      let best = null,
        bd = 1e9;
      for (const n of TREE.N) {
        const r = NR[n.type] + 4 + 10 / TV.s,
          d = Math.hypot(n.x - wx, n.y - wy);
        if (d < r && d < bd) {
          bd = d;
          best = n;
        }
      }
      if (best) {
        selNode = best.id;
        TV.sum = false;
        sfx('tap');
        renderTreeCard();
      }
    }
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
  cv.addEventListener(
    'wheel',
    ev => {
      ev.preventDefault();
      const ns = Math.max(0.2, Math.min(3.2, TV.s * Math.exp(-ev.deltaY * 0.0015))),
        wx = (ev.clientX - TV.W / 2) / TV.s + TV.x,
        wy = (ev.clientY - TV.H / 2) / TV.s + TV.y;
      TV.s = ns;
      TV.x = wx - (ev.clientX - TV.W / 2) / ns;
      TV.y = wy - (ev.clientY - TV.H / 2) / ns;
      drawTree();
    },
    { passive: false }
  );
  window.addEventListener('resize', () => {
    if (!$('treeView').hidden) {
      sizeTree();
      drawTree();
    }
  });
})();
function classPicker(after) {
  const opts = ['knight', 'ranger', 'mage', 'novice'].map(k => [
    k,
    CLASSES[k].name,
    `${CLASSES[k].desc}。開局技能石：${SKILLS[CLASSES[k].gem].name}、治癒`
  ]);
  showModal(
    '選擇起點',
    `<p class="sub">選擇天賦盤的起點，只影響起點位置、起點數值與開局的技能石；之後的技能全部來自技能石。天賦點從 0 開始，每升一級得 1 點。</p>${opts.map(([k, n, d], i) => `<button class="btn" style="text-align:left;display:grid;gap:2px" data-act="mbtn" data-i="${i}"><span style="color:${CLASSES[k].color};font-weight:500">${n}</span><small class="sub">${d}</small></button>`).join('')}`,
    []
  );
  modalFns = opts.map(([k]) => () => {
    S.cls = k;
    S.tree = [startOf(k)];
    if (!S.gems.length) {
      giveGem(CLASSES[k].gem);
      giveGem('heal');
    }
    fullHeal();
    sfx('level');
    addLog(`選擇了起點：${CLASSES[k].name}`);
    hideModal();
    renderHud();
    after && after();
  });
}
