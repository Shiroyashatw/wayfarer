/* dungeonPOE · 手機操作（0.2.4）：桌機為主、手機為輔，規則在 docs/企劃書.md「操作模式」。
   模式：一碰觸控就切成觸控模式（body.touch），滑鼠一按就切回桌機；鍵盤兩邊都能用。
   觸控：左半邊浮動搖桿；右下 5 個技能鍵（大的是普攻＝左鍵欄），點一下自動瞄準最近的敵人（王優先）、
   按住拖＝手動瞄準（地上畫線）放開施放、拖回按鈕上取消；普攻按住連打。翻滾、藥水、互動在技能鍵外圈。 */
'use strict';
const TOUCH = { on: false, stick: null, mv: [0, 0], sk: null, cast: false, sel: null, front: 'inv' };
const AIM_R = 360; /* 手動瞄準最遠的距離 */

function setTouch(on) {
  if (TOUCH.on === on) return;
  TOUCH.on = on;
  document.body.classList.toggle('touch', on);
  resize();
  hideTip();
  hudPanels();
  if (TREE.open) treeRender();
}
/* 最近的敵人（王的距離打六折＝優先打王） */
function autoTarget() {
  let best = null,
    bd = 560;
  for (const m of G.mobs) {
    if (m.hp <= 0) continue;
    const d = Math.hypot(m.x - P.x, m.y - P.y) * (m.boss ? 0.6 : 1);
    if (d < bd) (bd = d), (best = m);
  }
  return best;
}
/* 觸控模式的瞄準點：拖曳中＝拖的方向；按技能時＝最近的敵人；其他＝面向的前方 */
function touchAim() {
  const s = TOUCH.sk;
  if (s && s.drag) {
    const L = 40 + s.t * (AIM_R - 40);
    return { x: P.x + s.ux * L, y: P.y + s.uy * L };
  }
  if (s || TOUCH.cast) {
    const m = autoTarget();
    if (m) return { x: m.x, y: m.y };
  }
  return { x: P.x + Math.cos(P.face) * 200, y: P.y + Math.sin(P.face) * 200 };
}
/* 地上的瞄準線（拖曳技能鍵時；拖回按鈕上＝取消，變紅） */
function drawAim() {
  const s = TOUCH.sk;
  if (!TOUCH.on || !s || !s.drag) return;
  const w = touchAim(),
    col = s.cancel ? 'rgba(229,72,77,' : 'rgba(255,209,102,';
  CX.lineWidth = 2;
  CX.strokeStyle = col + '0.18)';
  CX.beginPath();
  CX.arc(P.x, P.y, AIM_R, 0, Math.PI * 2);
  CX.stroke();
  CX.lineWidth = 6;
  CX.strokeStyle = col + '0.55)';
  CX.beginPath();
  CX.moveTo(P.x, P.y);
  CX.lineTo(w.x, w.y);
  CX.stroke();
  CX.fillStyle = col + '0.35)';
  CX.beginPath();
  CX.arc(w.x, w.y, 22, 0, Math.PI * 2);
  CX.fill();
}
/* 在地圖裡按兩次才回家（這張地圖會結束） */
let tHome = 0;
function homeAsk() {
  if (G.scene !== 'map' || G.state !== 'play') return;
  if (performance.now() - tHome < 2000) return goHome();
  tHome = performance.now();
  hudWarn(TOUCH.on ? '再按一次回藏身處（這張地圖會結束）' : '再按一次 T 回藏身處（這張地圖會結束）');
}

/* ---------- 搖桿 ---------- */
const STICK_R = 56;
function stickShow(x, y) {
  const el = $('stick');
  el.classList.add('on');
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.bottom = 'auto';
  stickKnob(0, 0);
}
function stickKnob(dx, dy) {
  $('stick').firstChild.style.transform = `translate(${dx}px, ${dy}px)`;
}
function stickHide() {
  const el = $('stick');
  el.classList.remove('on');
  el.style.left = el.style.top = el.style.bottom = '';
  stickKnob(0, 0);
  TOUCH.stick = null;
  TOUCH.mv = [0, 0];
}

/* ---------- 面板：點一下道具＝說明＋動作 ---------- */
function moveLabel(src, it) {
  if (isSlot(src)) return '卸下';
  if (it.gem && src === 'inv' && !PANEL.stash) return '鑲上';
  if (src === 'stash') return '放進背包';
  if (PANEL.stash) return '放進倉庫';
  return '裝備';
}
function tapItem(d) {
  const r = d.el.getBoundingClientRect();
  TOUCH.sel = { src: d.src, id: d.it.id, eqk: d.eqk };
  const sellB = G.scene === 'hide' ? `<button class="btn" data-tq="sell">賣 ${sellPrice(d.it)} 金</button>` : '';
  showTip(
    itemTip(d.it, !isSlot(d.src)) +
      `<div class="tqa"><button class="btn pri" data-tq="move">${moveLabel(d.src, d.it)}</button>${sellB}</div>`,
    r.right,
    r.top + r.height / 2
  );
  $('tip').classList.add('act');
}

function touchInit() {
  /* 一碰就切模式（能力判斷，不看機型） */
  addEventListener(
    'pointerdown',
    e => {
      if (e.pointerType === 'touch') setTouch(true);
      else if (e.pointerType === 'mouse') setTouch(false);
    },
    true
  );
  /* 畫面：撿東西、藏身處的擺設，左半邊是搖桿 */
  CV.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch') return;
    const l = LABELS.find(l => inL(l, e));
    if (l) return dist(P, l.d) < 160 ? pickup(l.d) : hudWarn('走近一點再撿（或按互動）');
    if (G.scene === 'hide') {
      const p = propAt(e);
      if (p === 'portal') return dist(P, G.portal) < 120 ? enterMap(G.portal.to) : hudWarn('走近一點');
      if (p) return useProp(p);
    }
    if (e.clientX < innerWidth * 0.55 && !TOUCH.stick) {
      TOUCH.stick = { id: e.pointerId, x0: e.clientX, y0: e.clientY };
      stickShow(e.clientX, e.clientY);
    }
  });
  addEventListener('pointermove', e => {
    const st = TOUCH.stick;
    if (st && e.pointerId === st.id) {
      let dx = e.clientX - st.x0,
        dy = e.clientY - st.y0;
      const L = Math.hypot(dx, dy);
      /* 拉超過範圍：底座跟著手指走（不用回頭找底座） */
      if (L > STICK_R) {
        st.x0 += (dx / L) * (L - STICK_R);
        st.y0 += (dy / L) * (L - STICK_R);
        $('stick').style.left = st.x0 + 'px';
        $('stick').style.top = st.y0 + 'px';
        dx = e.clientX - st.x0;
        dy = e.clientY - st.y0;
      }
      stickKnob(dx, dy);
      TOUCH.mv = L > 10 ? [dx / Math.max(L, 1), dy / Math.max(L, 1)] : [0, 0];
    }
    const s = TOUCH.sk;
    if (s && e.pointerId === s.id) {
      const dx = e.clientX - s.cx,
        dy = e.clientY - s.cy,
        L = Math.hypot(dx, dy);
      if (!s.drag && L > 14) s.drag = true;
      if (s.drag) {
        if (L > 0) {
          s.ux = dx / L;
          s.uy = dy / L;
          s.t = Math.min(1, Math.max(0, (L - s.rad * 0.5) / 90));
        }
        s.cancel = L < s.rad;
      }
    }
  });
  const up = e => {
    if (TOUCH.stick && e.pointerId === TOUCH.stick.id) stickHide();
    const s = TOUCH.sk;
    if (s && e.pointerId === s.id) {
      s.el.classList.remove('down');
      if (s.i === 0) M.L = 0;
      else if (e.type === 'pointerup' && !(s.drag && s.cancel)) {
        TOUCH.cast = !s.drag;
        useSlot(s.i);
        TOUCH.cast = false;
      }
      TOUCH.sk = null;
    }
  };
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);
  /* 技能鍵、翻滾、藥水、互動 */
  $('hud').addEventListener('pointerdown', e => {
    const el = e.target.closest('.sk');
    if (!el || e.pointerType !== 'touch') return;
    e.preventDefault();
    const k = el.dataset.k;
    el.classList.remove('hit');
    void el.offsetWidth;
    el.classList.add('hit');
    if (k === 'roll') return doRoll();
    if (k === 'flask') return drinkFlask();
    if (k === 'use') return interact();
    const i = +k[1],
      r = el.getBoundingClientRect();
    el.classList.add('down');
    el.setPointerCapture(e.pointerId);
    TOUCH.sk = {
      id: e.pointerId,
      i,
      el,
      cx: r.left + r.width / 2,
      cy: r.top + r.height / 2,
      rad: r.width / 2,
      drag: false
    };
    if (i === 0) M.L = 1;
  });
  /* 右上選單、說明框的動作 */
  document.addEventListener('click', e => {
    const m = e.target.closest('[data-tm]');
    if (m) {
      const k = m.dataset.tm;
      if (k === 'inv') PANEL.inv && !PANEL.stash && !PANEL.skill ? closePanels() : openPanel('inv');
      else if (k === 'skill') PANEL.skill ? closePanels() : openPanel('skill');
      else if (k === 'tree') treeOpen('pt');
      else if (k === 'home') homeAsk();
      else if (k === 'swap') (TOUCH.front = TOUCH.front === 'inv' ? 'other' : 'inv'), hudPanels();
      return;
    }
    const q = e.target.closest('[data-tq]');
    if (q && TOUCH.sel) {
      const { src, id, eqk } = TOUCH.sel,
        it = findItem(src, id, eqk);
      hideTip();
      if (!it) return;
      if (q.dataset.tq === 'sell') sell(src, it, eqk);
      else quickMove(src, it, eqk);
    }
  });
  /* 點說明框以外的地方：收起說明框 */
  document.addEventListener('pointerdown', e => {
    if (TOUCH.on && !$('tip').hidden && !e.target.closest('#tip') && !e.target.closest('.it[data-id]')) hideTip();
  });
  setTouch(matchMedia('(pointer: coarse)').matches);
}
