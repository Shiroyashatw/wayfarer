/* dungeonPOE · 天賦樹（P）與核心昇華樹（O）：全螢幕盤面，拖曳移動、滾輪縮放；點亮著的點＝點下去，再點一次＝退回（不能把後面斷開） */
'use strict';
const TREE = { open: false, tab: 'pt', x: 0, y: 0, z: 1, drag: null };
const TDEF = () =>
  TREE.tab === 'pt'
    ? { T: PTREE, key: 'pt', pts: ptPoints(S.lv), hint: '每升一級 1 點' }
    : { T: CTREE, key: 'ct', pts: ctPoints(S.lv), hint: '每 3 級 1 點' };
function treeOpen(tab) {
  if (TREE.open && TREE.tab === tab) return treeClose();
  closePanels();
  Object.assign(TREE, { open: true, tab, x: 0, y: 0 });
  $('ptree').hidden = false;
  treeRender();
  treeFit();
}
function treeClose() {
  TREE.open = false;
  $('ptree').hidden = true;
  hideTip();
}
const treeLeft = d => d.pts - (S[d.key].length - 1);
/* 這個點能不能點：還沒點、旁邊有點過的、還有點數 */
function treeCan(d, id) {
  const have = S[d.key];
  if (have.includes(id) || treeLeft(d) <= 0) return false;
  return d.T.E.some(([a, b]) => (a === id && have.includes(b)) || (b === id && have.includes(a)));
}
/* 退回這個點後，其他點還連得到起點嗎 */
function treeCanRefund(d, id) {
  const have = new Set(S[d.key]);
  if (id === 'c' || !have.has(id)) return false;
  have.delete(id);
  const seen = new Set(['c']),
    q = ['c'];
  while (q.length) {
    const n = q.pop();
    for (const [a, b] of d.T.E) {
      const o = a === n ? b : b === n ? a : null;
      if (o && have.has(o) && !seen.has(o)) seen.add(o), q.push(o);
    }
  }
  return seen.size === have.size;
}
function treeRender() {
  if (!TREE.open) return;
  const d = TDEF(),
    have = new Set(S[d.key]),
    left = treeLeft(d);
  const edges = d.T.E.map(([a, b]) => {
    const A = d.T.I[a],
      B = d.T.I[b];
    return `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" class="${have.has(a) && have.has(b) ? 'on' : have.has(a) || have.has(b) ? 'near' : ''}"/>`;
  }).join('');
  const nodes = d.T.N.map(n => {
    const r = n.big === 2 ? 30 : n.big ? 22 : 15,
      st = have.has(n.id) ? 'on' : treeCan(d, n.id) ? 'can' : 'off',
      u = artIconURL(n.ic);
    return `<g class="nd ${st} b${n.big}" data-n="${n.id}" transform="translate(${n.x} ${n.y})"><circle r="${r}"/>${u ? `<image href="${u}" x="${-r * 0.72}" y="${-r * 0.72}" width="${r * 1.44}" height="${r * 1.44}"/>` : ''}</g>`;
  }).join('');
  $('ptree').innerHTML = `<div class="tbar">
    <div class="tabs"><button class="${TREE.tab === 'pt' ? 'on' : ''}" data-tt="pt">天賦樹 <kbd>P</kbd></button><button class="${TREE.tab === 'ct' ? 'on' : ''}" data-tt="ct">核心昇華樹 <kbd>O</kbd></button></div>
    <span>剩 <b class="${left > 0 ? 'c-gold' : ''}">${left}</b> 點 · ${d.hint}</span>
    <button class="btn" data-ta="reset" ${S[d.key].length > 1 ? '' : 'disabled'}>全部重置</button>
    <button class="x" data-ta="close">✕</button></div>
  <svg id="tsvg"><g id="tg">${edges}${nodes}</g></svg>
  <p class="thelp">${TREE.tab === 'pt' ? '從中間的起點往外點：生命、護甲、攻速、暴擊、範圍與元素、魔力與冷卻六個方向。' : '先點職業機制，再往外點核心、強化核心；可以混著走好幾個職業。'}點亮著的點＝點下去，再點一次＝退回。拖曳移動、滾輪縮放。</p>`;
  treeView();
}
function treeView() {
  const svg = $('tsvg');
  if (!svg) return;
  const w = svg.clientWidth,
    h = svg.clientHeight;
  $('tg').setAttribute('transform', `translate(${w / 2 + TREE.x} ${h / 2 + TREE.y}) scale(${TREE.z})`);
}
/* 整張樹放得進畫面 */
function treeFit() {
  const svg = $('tsvg'),
    R = Math.max(...TDEF().T.N.map(n => Math.hypot(n.x, n.y))) + 40;
  TREE.z = clamp(Math.min(svg.clientWidth, svg.clientHeight) / (2 * R), 0.5, 1.2);
  TREE.x = TREE.y = 0;
  treeView();
}
function treeToggle(id) {
  const d = TDEF(),
    have = S[d.key];
  if (have.includes(id)) {
    if (!treeCanRefund(d, id)) return hudWarn(id === 'c' ? '起點不能退' : '先退後面的點');
    have.splice(have.indexOf(id), 1);
  } else if (treeCan(d, id)) have.push(id);
  else return hudWarn(treeLeft(d) <= 0 ? '沒有點數了：升級會再給' : '要跟點過的點連在一起');
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
/* 說明 */
function treeTip(id) {
  const n = TDEF().T.I[id];
  if (TREE.tab === 'pt') {
    const lines = Object.entries(n.s).map(([k, v]) => `${STATN[k][0]} +${v}${STATN[k][1]}`);
    return `<b>${esc(n.n)}</b><small>${n.big ? '大點' : '小點'}</small>${lines.length ? `<p class="aff">${lines.join('<br>')}</p>` : ''}`;
  }
  if (n.big === 2) {
    const c = CORE_CLS.find(c => c.id === n.cls);
    return `<b>${esc(c.n)}：${esc(c.m)}</b><small>職業機制</small><p class="aff">${esc(c.md)}</p>`;
  }
  if (!n.core) return `<b>起點</b>`;
  const k = n.core;
  return `<b>${esc(n.n)}</b><small>${n.lvl ? '強化核心（取代核心的數值）' : '核心'}</small><p class="aff">${esc(k.d(k.v[n.lvl]))}</p>`;
}
function treeInit() {
  const el = $('ptree');
  el.addEventListener('pointerdown', e => {
    if (!e.target.closest('#tsvg')) return;
    TREE.drag = { x: e.clientX, y: e.clientY, ox: TREE.x, oy: TREE.y, moved: false, n: e.target.closest('.nd') };
    e.target.closest('#tsvg').setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', e => {
    const g = TREE.drag;
    if (g) {
      if (Math.hypot(e.clientX - g.x, e.clientY - g.y) > 5) g.moved = true;
      if (g.moved) {
        TREE.x = g.ox + e.clientX - g.x;
        TREE.y = g.oy + e.clientY - g.y;
        treeView();
        return hideTip();
      }
    }
    const n = e.target.closest('.nd');
    if (n) {
      const r = n.getBoundingClientRect();
      showTip(treeTip(n.dataset.n), r.right, r.top + r.height / 2);
    } else hideTip();
  });
  el.addEventListener('pointerup', () => {
    const g = TREE.drag;
    TREE.drag = null;
    if (g && !g.moved && g.n) treeToggle(g.n.dataset.n);
  });
  el.addEventListener(
    'wheel',
    e => {
      e.preventDefault();
      const z = clamp(TREE.z * (e.deltaY < 0 ? 1.12 : 1 / 1.12), 0.5, 2.2),
        svg = $('tsvg').getBoundingClientRect(),
        mx = e.clientX - svg.left - svg.width / 2 - TREE.x,
        my = e.clientY - svg.top - svg.height / 2 - TREE.y;
      /* 以滑鼠位置為中心縮放 */
      TREE.x -= mx * (z / TREE.z - 1);
      TREE.y -= my * (z / TREE.z - 1);
      TREE.z = z;
      treeView();
    },
    { passive: false }
  );
  el.addEventListener('click', e => {
    const t = e.target.closest('[data-tt]'),
      a = e.target.closest('[data-ta]');
    if (t && t.dataset.tt !== TREE.tab) {
      TREE.tab = t.dataset.tt;
      treeRender();
      treeFit();
    }
    if (a && a.dataset.ta === 'close') treeClose();
    if (a && a.dataset.ta === 'reset') {
      S[TDEF().key] = ['c'];
      treeChanged();
    }
  });
  addEventListener('resize', treeView);
}
