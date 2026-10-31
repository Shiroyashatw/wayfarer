/* ARPG 原型 · HUD（生命／魔力球、技能列、經驗條、王的血條）、裝備面板、說明、結算，以及輸入 */
'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const icStyle = n => {
  const r = ART[n];
  return r ? `background-position:-${r[0]}px -${r[1]}px;width:${r[2]}px;height:${r[3]}px` : '';
};
const icHTML = (n, cls = '') => `<i class="ic ${cls}" style="${icStyle(n)}"></i>`;

const BAR = [
  { k: 'flask', key: '1', ic: 'it_potion', n: '藥水', d: '回復一半生命（1.4 秒內）。殺怪會補充。' },
  { k: 'slash', key: '左鍵' },
  { k: 'blade', key: '右鍵' },
  { k: 'whirl', key: 'Q' },
  { k: 'iai', key: 'E' },
  { k: 'roll', key: '空白', ic: null, n: '翻滾', d: '短暫無敵。怪物出手的瞬間翻滾＝見切：時間變慢，下一擊必定暴擊。' }
];
function hudInit() {
  $('#hud').innerHTML = `
  <div class="top"><div id="area"></div><div id="bossbar" hidden><b>虎姑婆</b><div class="bb"><i></i></div></div></div>
  <div class="bottom">
    <div class="orb hp" id="ohp"><i></i><span></span></div>
    <div class="mid">
      <div class="xp" id="xp"><i></i></div>
      <div class="bar">${BAR.map(
        b =>
          `<div class="sk" data-k="${b.k}" data-tip="${esc(tipOf(b))}">${b.k === 'roll' ? '<em class="roll">⤳</em>' : icHTML(b.ic || SKILLS[b.k].ic)}<u></u><s></s><kbd>${b.key}</kbd></div>`
      ).join('')}</div>
    </div>
    <div class="orb mp" id="omp"><i></i><span></span></div>
  </div>
  <div class="keys" id="keys"><b>操作</b> WASD 移動 · 滑鼠瞄準 · 左鍵 斬擊 · 右鍵 飛刃 · Q 旋風斬 · E 居合突進 · 空白 翻滾 · 1 藥水 · F 撿東西 · I 背包 · H 隱藏</div>
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
  const w = $('#warn');
  w.textContent = t;
  w.classList.remove('on');
  void w.offsetWidth;
  w.classList.add('on');
  clearTimeout(warnT);
  warnT = setTimeout(() => w.classList.remove('on'), 1400);
}
/* 每格畫面更新：只改數值，不重畫 HTML */
const HV = {};
function setV(el, k, v) {
  if (HV[k] === v) return;
  HV[k] = v;
  el.style.setProperty('--v', v);
}
function hudTick() {
  if (!P) return;
  setV($('#ohp'), 'hp', (P.hp / ST.hp).toFixed(3));
  setV($('#omp'), 'mp', (P.mp / ST.mp).toFixed(3));
  const ht = Math.ceil(P.hp) + ' / ' + ST.hp,
    mt = Math.floor(P.mp) + ' / ' + ST.mp;
  if (HV.ht !== ht) $('#ohp span').textContent = HV.ht = ht;
  if (HV.mt !== mt) $('#omp span').textContent = HV.mt = mt;
  setV($('#xp'), 'xp', (S.xp / xpNeed(S.lv)).toFixed(3));
  for (const el of document.querySelectorAll('.sk')) {
    const k = el.dataset.k,
      D = SKILLS[k];
    let cd = 0,
      txt = '';
    if (k === 'flask') {
      cd = 1 - (P.flask % 1);
      cd = P.flask >= 1 ? 0 : cd;
      txt = Math.floor(P.flask) + '';
    } else if (k === 'roll') cd = (P.cds.roll || 0) / (ROLL.cd + ROLL.t);
    else if (D.cd) {
      cd = (P.cds[k] || 0) / D.cd;
      if (P.cds[k] > 0) txt = Math.ceil(P.cds[k]) + '';
    }
    setV(el, 'cd' + k, cd.toFixed(2));
    if (HV['t' + k] !== txt) el.querySelector('u').textContent = HV['t' + k] = txt;
    const no = D && P.mp < D.mp;
    if (HV['n' + k] !== no) el.classList.toggle('no', (HV['n' + k] = no));
  }
  const b = G.mobs.find(m => m.boss);
  const show = !!(b && b.aggro);
  if (HV.boss !== show) $('#bossbar').hidden = !(HV.boss = show);
  if (show) setV($('#bossbar'), 'bhp', (b.hp / b.mhp).toFixed(3));
  const at = `地城 Lv ${S.area} · 角色 Lv ${S.lv} · ${S.gold} 金 · 剩 ${G.mobs.length} 隻`;
  if (HV.at !== at) $('#area').textContent = HV.at = at;
}
/* 死掉、通關：中間的卡片 */
function hudState() {
  const o = $('#over');
  if (G.state === 'dead') {
    o.innerHTML = `<div class="card"><h2 class="c-bad">你倒下了</h2><p>裝備和經驗都還在（原型先不做掉寶懲罰）。</p><button class="btn pri" data-a="retry">重新進入地城</button></div>`;
    o.hidden = false;
  } else if (G.state === 'clear') {
    o.innerHTML = `<div class="card"><h2 class="c-gold">打倒虎姑婆！</h2><p>地上還有戰利品，撿完再走。</p><button class="btn pri" data-a="next">前往地城 Lv ${S.area + 1}</button> <button class="btn" data-a="stay">先撿東西</button></div>`;
    o.hidden = false;
  } else o.hidden = true;
}

/* ---------- 裝備面板 ---------- */
const INV = { open: false, sel: null };
function hudInv() {
  const p = $('#inv');
  if (!INV.open) return (p.hidden = true);
  p.hidden = false;
  const s = ST;
  p.innerHTML = `<div class="ph"><b>裝備</b><span>Lv ${S.lv} · ${S.gold} 金</span><button class="x" data-a="inv">✕</button></div>
  <div class="eq">${SLOTK.map(k => {
    const it = S.gear[k];
    return `<div class="slot ${it ? 'r' + it.r : 'empty'} s-${k}" data-eq="${k}">${it ? icHTML(itemIc(it)) : `<small>${SLOTS[k].n}</small>`}</div>`;
  }).join('')}</div>
  <div class="st">
    <span>傷害 <b>${Math.round(s.dmg[0])}–${Math.round(s.dmg[1])}</b></span><span>攻速 <b>${Math.round(s.asM * 100)}%</b></span><span>暴擊 <b>${s.crit}%</b></span>
    <span>生命 <b>${s.hp}</b></span><span>護甲 <b>${s.armor}</b></span><span>移速 <b>${Math.round(s.spd)}</b></span>
  </div>
  <div class="ph2">背包 <span>${S.inv.length}/30 · 點一下裝備 · 右鍵賣掉</span></div>
  <div class="grid">${Array.from({ length: 30 }, (_, i) => {
    const it = S.inv[i];
    return it ? `<div class="slot r${it.r}" data-inv="${i}">${icHTML(itemIc(it))}</div>` : '<div class="slot empty"></div>';
  }).join('')}</div>`;
}
const sellPrice = it => Math.round((2 + it.a.length * 3) * it.L * (1 + it.r));
function itemTip(it, cmp) {
  const base = Object.entries(it.b).map(([k, v]) => (k === 'armor' ? `護甲 ${v}` : `附加 ${v} 物理傷害`));
  let html = `<b class="rc${it.r}">${esc(itemName(it))}</b><small>${RARN[it.r]} ${SLOTS[it.slot].n} · 物品等級 ${it.L}</small>`;
  if (base.length) html += `<p class="base">${base.join('<br>')}</p>`;
  if (it.a.length) html += `<p class="aff">${it.a.map(affText).join('<br>')}</p>`;
  if (cmp) {
    /* 換上去之後的差別 */
    const cur = S.gear[it.slot],
      a = ST;
    S.gear[it.slot] = it;
    const b = stats();
    S.gear[it.slot] = cur;
    const dps = x => ((x.dmg[0] + x.dmg[1]) / 2) * x.asM * (1 + (x.crit / 100) * (HERO.critX - 1));
    const rows = [
      ['每秒傷害', dps(b) - dps(a)],
      ['生命', b.hp - a.hp],
      ['護甲', b.armor - a.armor],
      ['移速', b.spd - a.spd]
    ].filter(r => Math.abs(r[1]) >= 0.5);
    html += `<p class="cmp">${cur ? '跟身上的比' : '這格沒裝東西'}：${rows.length ? rows.map(([n, v]) => `<span class="${v > 0 ? 'c-good' : 'c-bad'}">${n} ${v > 0 ? '▲' : '▼'}${Math.abs(Math.round(v))}</span>`).join(' ') : '一樣'}</p>`;
  }
  html += `<p class="hint">${cmp ? '點一下裝備 · 右鍵賣 ' + sellPrice(it) + ' 金' : ''}</p>`;
  return html;
}
function showTip(html, x, y) {
  const t = $('#tip');
  t.innerHTML = html;
  t.hidden = false;
  const r = t.getBoundingClientRect();
  t.style.left = Math.min(innerWidth - r.width - 8, x + 16) + 'px';
  t.style.top = Math.max(8, Math.min(innerHeight - r.height - 8, y - r.height / 2)) + 'px';
}
function hideTip() {
  $('#tip').hidden = true;
}
function equip(i) {
  const it = S.inv[i],
    cur = S.gear[it.slot];
  S.gear[it.slot] = it;
  if (cur) S.inv[i] = cur;
  else S.inv.splice(i, 1);
  const hpF = P.hp / ST.hp;
  ST = stats();
  P.hp = Math.min(ST.hp, Math.max(1, hpF * ST.hp));
  P.mp = Math.min(ST.mp, P.mp);
  sfx('equip');
  save();
  hudInv();
}
function sell(i) {
  const it = S.inv[i];
  S.gold += sellPrice(it);
  S.inv.splice(i, 1);
  sfx('coin');
  save();
  hudInv();
}

/* ---------- 輸入 ---------- */
function inputInit() {
  addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (e.repeat && k !== 'w' && k !== 'a' && k !== 's' && k !== 'd') return;
    K[k] = 1;
    if (k === ' ') {
      e.preventDefault();
      doRoll();
    } else if (k === 'q') useSkill('whirl');
    else if (k === 'e') useSkill('iai');
    else if (k === '1') drinkFlask();
    else if (k === 'f') pickNearest();
    else if (k === 'i' || k === 'b') toggleInv();
    else if (k === 'h') $('#keys').classList.toggle('off');
    else if (k === 'escape' && INV.open) toggleInv();
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
    CV.style.cursor = LABELS.some(l => inL(l, e)) ? 'pointer' : 'crosshair';
  });
  CV.addEventListener('pointerdown', e => {
    M.x = e.clientX;
    M.y = e.clientY;
    /* 點到掉落的名字：在旁邊就撿，不然走過去再撿太麻煩，先只提示 */
    const l = e.button === 0 && LABELS.find(l => inL(l, e));
    if (l) {
      if (dist(P, l.d) < 160) pickup(l.d);
      else hudWarn('走近一點再撿（或按 F）');
      return;
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
  });
  addEventListener('contextmenu', e => e.preventDefault());
  /* 面板、按鈕 */
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-a]');
    if (a) act(a.dataset.a);
    const s = e.target.closest('[data-inv]');
    if (s) {
      equip(+s.dataset.inv);
      hideTip();
    }
  });
  document.addEventListener('contextmenu', e => {
    const s = e.target.closest('[data-inv]');
    if (s) {
      sell(+s.dataset.inv);
      hideTip();
    }
  });
  document.addEventListener('pointerover', e => {
    const s = e.target.closest('[data-inv],[data-eq],[data-tip]');
    if (!s) return hideTip();
    const r = s.getBoundingClientRect();
    if (s.dataset.tip) return showTip(`<p class="sktip">${esc(s.dataset.tip).replace(/\n/g, '<br>')}</p>`, r.right - 30, r.top - 40);
    const it = s.dataset.inv != null ? S.inv[+s.dataset.inv] : S.gear[s.dataset.eq];
    if (it) showTip(itemTip(it, s.dataset.inv != null), r.right, r.top + r.height / 2);
    else hideTip();
  });
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
function toggleInv() {
  INV.open = !INV.open;
  hideTip();
  hudInv();
}
function act(a) {
  if (a === 'inv') toggleInv();
  else if (a === 'retry') {
    newArea();
    hudState();
  } else if (a === 'next') {
    S.area++;
    save();
    newArea();
    hudState();
  } else if (a === 'stay') {
    G.state = 'play';
    hudState();
    hudWarn('撿完走進紫色傳送門＝下一層');
  }
}
