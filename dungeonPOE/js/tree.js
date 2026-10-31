/* dungeonPOE · 天賦樹（P，照 PoE）：一千多個點，中間挖空放昇華；拖曳移動、滾輪縮放；
   點亮著的點＝點下去，再點一次＝退回（不能把後面斷開）。昇華點嚴格 4 小 4 大 */
'use strict';
const TREE = { open: false, x: 0, y: 0, z: 0.55, drag: null };
const ptLeft = () => ptPoints(S.lv) - (S.pt.length - PT_START.length);
const ascT = () => ascNodes(S.asc);
const ascLeft = () => ascPoints(S) - (S.at.length - 1);
const ascCount = set => {
  const T = ascT();
  let sm = 0,
    bg = 0;
  for (const id of set) if (id !== 'a_st') T.I[id].big ? bg++ : sm++;
  return [sm, bg];
};
/* 昇華：加了這個點之後，還能不能補成 4 小 4 大（不會卡住、也不會變成 5 大 3 小） */
function ascFeasible(set) {
  const T = ascT(),
    memo = new Set(),
    go = cur => {
      const [sm, bg] = ascCount(cur);
      if (sm > 4 || bg > 4) return false;
      if (sm === 4 && bg === 4) return true;
      const key = [...cur].sort().join();
      if (memo.has(key)) return false;
      memo.add(key);
      for (const [a, b] of T.E)
        for (const [x, y] of [
          [a, b],
          [b, a]
        ])
          if (cur.has(x) && !cur.has(y) && go(new Set([...cur, y]))) return true;
      return false;
    };
  return go(new Set(set));
}
function treeCan(id) {
  if (id.startsWith('a_')) {
    const T = ascT();
    if (!T || S.at.includes(id) || ascLeft() <= 0) return false;
    if (!T.E.some(([a, b]) => (a === id && S.at.includes(b)) || (b === id && S.at.includes(a)))) return false;
    return ascFeasible([...S.at, id]);
  }
  if (S.pt.includes(id) || ptLeft() <= 0) return false;
  return (PTREE.ADJ[id] || []).some(o => S.pt.includes(o));
}
/* 退回後其他點還連得到起點嗎 */
function treeCanRefund(id) {
  const asc = id.startsWith('a_'),
    have = new Set(asc ? S.at : S.pt),
    start = asc ? ['a_st'] : PT_START;
  if (start.includes(id) || !have.has(id)) return false;
  have.delete(id);
  const adj = asc ? ascAdj() : PTREE.ADJ,
    seen = new Set(start),
    q = [...start];
  while (q.length) for (const o of adj[q.pop()] || []) if (have.has(o) && !seen.has(o)) seen.add(o), q.push(o);
  return seen.size === have.size;
}
function ascAdj() {
  const A = {};
  for (const [a, b] of ascT().E) (A[a] = A[a] || []).push(b), (A[b] = A[b] || []).push(a);
  return A;
}
function treeOpen() {
  if (TREE.open) return treeClose();
  closePanels();
  Object.assign(TREE, { open: true, x: 0, y: 0, z: 0.55 });
  $('ptree').hidden = false;
  treeRender();
}
function treeClose() {
  TREE.open = false;
  $('ptree').hidden = true;
  hideTip();
}
function treeRender() {
  if (!TREE.open) return;
  const have = new Set(S.pt),
    T = ascT(),
    ah = new Set(S.at);
  const line = (A, B, on, near, cls = '') =>
    `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" class="${on ? 'on' : near ? 'near' : ''} ${cls}"/>`;
  /* 同一圈的連線畫成弧（PoE 的軌道），其他是直線 */
  const arc = (A, B, cls) => {
    const r = Math.hypot(A.x, A.y),
      cw = A.x * B.y - A.y * B.x > 0 ? 1 : 0;
    return `<path d="M${A.x.toFixed(1)} ${A.y.toFixed(1)} A${r.toFixed(1)} ${r.toFixed(1)} 0 0 ${cw} ${B.x.toFixed(1)} ${B.y.toFixed(1)}" class="${cls}"/>`;
  };
  let html = PTREE.E.map(([a, b]) => {
    const A = PTREE.I[a],
      B = PTREE.I[b],
      on = have.has(a) && have.has(b),
      near = have.has(a) || have.has(b);
    return A.orb && A.orb === B.orb ? arc(A, B, on ? 'on' : near ? 'near' : '') : line(A, B, on, near);
  }).join('');
  html += PTREE.N.map(n => {
    const r = n.big === 2 ? 30 : n.gate ? 20 : n.big ? 19 : 10,
      st = have.has(n.id) ? 'on' : treeCan(n.id) ? 'can' : 'off',
      u = n.big && artIconURL(n.ic);
    return `<g class="nd ${st} b${n.big}" data-n="${n.id}" transform="translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})" style="--c:${PT_THEME[n.th].c}"><circle r="${r}"/>${u ? `<image href="${u}" x="${-r * 0.7}" y="${-r * 0.7}" width="${r * 1.4}" height="${r * 1.4}"/>` : ''}</g>`;
  }).join('');
  /* 中間：昇華 */
  html += `<circle class="hollow" r="${PT_R0 - 40}"/>`;
  if (T) {
    html += T.E.map(([a, b]) => line(T.I[a], T.I[b], ah.has(a) && ah.has(b), ah.has(a) || ah.has(b), 'asc')).join('');
    html += T.N.map(n => {
      const r = n.big === 3 ? 26 : n.big ? 24 : 12,
        st = ah.has(n.id) ? 'on' : treeCan(n.id) ? 'can' : 'off',
        u = n.ic && artIconURL(n.ic);
      return `<g class="nd asc ${st} b${n.big}" data-n="${n.id}" transform="translate(${n.x} ${n.y})"><circle r="${r}"/>${u ? `<image href="${u}" x="${-r * 0.7}" y="${-r * 0.7}" width="${r * 1.4}" height="${r * 1.4}"/>` : ''}${n.big === 1 ? `<text y="${r + 16}">${esc(n.n)}</text>` : ''}</g>`;
    }).join('');
  } else
    html += `<text class="hint" y="-10">還沒有昇華</text><text class="hint sm" y="22">到藏身處的昇華石碑選擇</text>`;
  const [sm, bg] = T ? ascCount(S.at) : [0, 0];
  $('ptree').innerHTML = `<div class="tbar">
    <b>天賦樹</b>
    <span>天賦點 剩 <b class="${ptLeft() > 0 ? 'c-gold' : ''}">${ptLeft()}</b>（每升一級 1 點）</span>
    <span>昇華 ${T ? `${ASC.sword.br[S.asc].n} · 剩 <b class="${ascLeft() > 0 ? 'c-gold' : ''}">${ascLeft()}</b> 點 · 小 ${sm}/4 大 ${bg}/4` : '還沒選'}</span>
    <button class="btn" data-ta="reset" ${S.pt.length > PT_START.length ? '' : 'disabled'}>重置天賦</button>
    <button class="btn" data-ta="areset" ${S.at.length > 1 ? '' : 'disabled'}>重置昇華</button>
    <button class="x" data-ta="close">✕</button></div>
  <svg id="tsvg"><g id="tg">${html}</g></svg>
  <p class="thelp">照 PoE2：中間是起點的 6 個門，交叉點用長直線連成格網，將近一百塊形狀都不一樣的拼塊掛在格網上（有的是死路、有的兩頭都接）。方向大致是：上方生命護甲、右上近戰矛攻速、右邊身法棍投射物陷阱、下方暴擊圖騰召喚、左下元素法術、左上能量護盾精魄魔力；越外面的大點越強，帶代價的是強力大點。點亮著的點＝點下去，再點一次＝退回。拖曳移動、滾輪縮放。</p>`;
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
  const asc = id.startsWith('a_'),
    have = asc ? S.at : S.pt;
  if (have.includes(id)) {
    if (!treeCanRefund(id)) return hudWarn((asc ? ['a_st'] : PT_START).includes(id) ? '起點不能退' : '先退後面的點');
    have.splice(have.indexOf(id), 1);
  } else if (treeCan(id)) have.push(id);
  else if (asc && ascLeft() <= 0) return hudWarn('沒有昇華點了：階級 6、12、16 的王第一次打倒各 +2');
  else if (asc) return hudWarn('要跟點過的點連在一起，而且最後要剛好 4 小 4 大');
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
  const n = id.startsWith('a_') ? ascT().I[id] : PTREE.I[id];
  const kind = n.asc
    ? n.big === 3
      ? '昇華入口'
      : n.big
        ? '昇華大點'
        : '昇華小點'
    : n.big === 2
      ? '基石'
      : n.gate
        ? '起點'
        : n.big
          ? '大點'
          : '小點';
  const lines = n.d ? [esc(n.d)] : statLines(n.s);
  return `<b class="${n.big === 2 || n.asc ? 'c-gold' : ''}">${esc(n.n)}</b><small>${kind}</small>${lines.length ? `<p class="aff">${lines.join('<br>')}</p>` : ''}`;
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
      const z = clamp(TREE.z * (e.deltaY < 0 ? 1.15 : 1 / 1.15), 0.12, 1.6),
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
    const a = e.target.closest('[data-ta]');
    if (!a) return;
    if (a.dataset.ta === 'close') treeClose();
    if (a.dataset.ta === 'reset') (S.pt = [...PT_START]), treeChanged();
    if (a.dataset.ta === 'areset') (S.at = ['a_st']), treeChanged();
  });
  addEventListener('resize', treeView);
}
