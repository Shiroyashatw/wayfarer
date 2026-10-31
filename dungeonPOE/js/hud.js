/* dungeonPOE · HUD（生命／魔力球、技能列、經驗條、王的血條）、面板（裝備與背包、倉庫、地圖台）、拖曳、說明框、死亡與通關、輸入 */
'use strict';
let C = 36; /* 背包一格的大小（px）；手機照螢幕寬度調（main.js 的 resize） */
const icHTML = (n, cls = '') => {
  const u = artIconURL(n);
  return u ? `<img class="ic ${cls}" src="${u}" alt="">` : `<span class="ic ${cls}"></span>`;
};
/* 圖還沒載好時，載好後補畫面板 */
function artRepaint() {
  hudPanels();
  if (document.querySelector('.sk span.ic')) hudBar();
  if (TREE.open && document.querySelector('#tg .nd:not(:has(image))')) treeRender();
}

/* 技能列：1 藥水、5 個技能欄（左鍵、右鍵、Q、E、R）、空白翻滾 */
const BAR = [
  { k: 'flask', key: '1', ic: 'it_potion', n: '藥水', d: '回復一半生命（1.4 秒內）。殺怪會補充。' },
  ...SLOTKEY.map((key, i) => ({ k: 's' + i, key, slot: i })),
  { k: 'roll', key: '空白', n: '翻滾', d: '短暫無敵。怪物出手的瞬間翻滾＝見切：時間變慢，下一擊必定暴擊。' },
  { k: 'use', key: 'F', n: '互動', d: '撿東西、使用藏身處的擺設', touch: 1 }
];
function hudInit() {
  $('hud').innerHTML = `
  <div class="top"><div id="area"></div><div id="bossbar" hidden><b id="bossn"></b><div class="bb"><i></i></div></div><div id="prog" hidden><b>首領進度</b><div class="pb"><i></i></div></div></div>
  <div class="bottom">
    <div class="orb hp" id="ohp"><i></i><b class="ward"></b><span></span></div>
    <div class="mid">
      <div class="mech" id="mech"></div>
      <div class="xp" id="xp" data-tip="經驗"><i></i></div>
      <div class="bar" id="bar"></div>
    </div>
    <div class="orb mp" id="omp"><i></i><span></span></div>
  </div>
  <div class="keys" id="keys"><b>操作</b> WASD 移動 · 滑鼠瞄準 · 技能 左鍵／右鍵／Q／E／R · 空白 翻滾 · 1 藥水 · F 互動／撿東西 · I 背包 · G 技能寶石 · P 天賦與昇華 · T 回藏身處 · H 隱藏</div>
  <div id="warn"></div>
  <div class="tonly" id="stick"><i></i></div>
  <div class="tonly tmenu"><button data-tm="fs" id="tfs">全螢幕</button><button data-tm="inv">背包</button><button data-tm="skill">技能</button><button data-tm="tree">天賦</button><button data-tm="home" id="thome">回家</button></div>
  <div class="tonly" id="rot">把手機橫過來玩</div>`;
  hudBar();
  hudState();
}
/* 技能列的圖示跟著技能欄換（換寶石後重畫） */
function hudBar() {
  $('bar').innerHTML = BAR.map(b => {
    const g = b.slot != null && S.skills[b.slot].a,
      ic =
        b.k === 'roll'
          ? '<em class="roll">⤳</em>'
          : b.k === 'use'
            ? '<em class="use">互動</em>'
            : b.slot != null
              ? g
                ? icHTML(SKILLS[g.gem].ic)
                : '<em class="empty">＋</em>'
              : icHTML(b.ic);
    return `<div class="sk${b.touch ? ' tonly' : ''}" data-k="${b.k}" data-tip="${esc(tipOf(b))}">${ic}<u></u><s></s><kbd>${b.key}</kbd></div>`;
  }).join('');
  for (const k in HV) if (/^[tn]s\d|^cds\d/.test(k)) delete HV[k];
}
function tipOf(b) {
  if (b.slot == null) return `${b.n}\n${b.d}`;
  const c = slotCfg(b.slot);
  if (!c) return `${b.key}：空的\n按 G 打開技能寶石，把技能寶石放進來`;
  return `${c.D.n} Lv ${c.lv}${c.D.wt ? `（${wtNeed(c.D)}）` : ''}\n${c.D.d}${c.mp ? `\n魔力 ${c.mp}` : ''}${c.cd ? ` · 冷卻 ${c.cd.toFixed(1)} 秒` : ''}`;
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
  setT($('ohp').lastChild, 'ht', Math.ceil(P.hp) + ' / ' + ST.hp + (ST.es ? `\n盾 ${Math.floor(P.es || 0)}` : ''));
  setT($('omp').lastChild, 'mt', Math.floor(P.mp) + ' / ' + ST.mp);
  setV($('xp'), 'xp', (S.xp / xpNeed(S.lv)).toFixed(3));
  for (const el of document.querySelectorAll('.sk')) {
    const k = el.dataset.k,
      c = k[0] === 's' ? slotCfg(+k[1]) : null;
    let cd = 0,
      txt = '';
    if (k === 'flask') {
      cd = P.flask >= 1 ? 0 : 1 - (P.flask % 1);
      txt = Math.floor(P.flask) + '';
    } else if (k === 'roll') cd = (P.cds.roll || 0) / (ROLL.cd + ROLL.t);
    else if (c && c.cd) {
      cd = (P.cds[k] || 0) / c.cd;
      if (P.cds[k] > 0) txt = Math.ceil(P.cds[k]) + '';
    }
    setV(el, 'cd' + k, cd.toFixed(2));
    setT(el.querySelector('u'), 't' + k, txt);
    const no = (c && (P.mp < c.mp || !wtOK(c.D))) || G.scene === 'hide';
    if (HV['n' + k] !== no) el.classList.toggle('no', (HV['n' + k] = no));
  }
  const wm = wardMax();
  const wv = wm || ST.es ? Math.min(1, ((P.ward || 0) + (P.es || 0)) / ST.hp).toFixed(3) : '0';
  if (HV.ward !== wv) $('ohp').style.setProperty('--w', (HV.ward = wv));
  const mech = [
    hasCls(S, 'ronin') ? `架勢 ${P.stance}/${stanceNeed()}` : '',
    ascV(S, 'berserk.rage') ? `怒氣 ${Math.floor(P.rage || 0)}` : '',
    hasCls(S, 'knight') ? `盾勢 ${P.guard}` : '',
    G.allies && G.allies.length ? `狼 ${G.allies.length}` : '',
    G.units && G.units.length ? `場上 ${G.units.length}` : '',
    ST.auraOn.length ? `精魄 ${ST.spiritUsed}/${ST.spirit}` : '',
    P.pcT > G.t && P.pc ? `力量球 ${P.pc}` : ''
  ]
    .filter(Boolean)
    .join(' · ');
  setT($('mech'), 'mech', mech);
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
  const hm = G.scene !== 'map';
  if (HV.hm !== hm) $('thome').hidden = HV.hm = hm;
}
/* 死掉、通關：中間的卡片 */
function hudState() {
  const o = $('over');
  if (G.state === 'dead') {
    o.innerHTML = `<div class="card"><h2 class="c-bad">你倒下了</h2><p>這張地圖失敗，失去 ${G.lostXp} 經驗（不會降級）。裝備都還在。</p><button class="btn pri" data-a="home">回到藏身處</button></div>`;
    o.hidden = false;
  } else if (G.state === 'portal') {
    /* 站在傳送門上：回藏身處，或直接開下一張（同一階、或剛開放的下一階） */
    const t = G.mapT,
      up = Math.min(S.maxT, TMAX),
      btn = (k, a, lab) =>
        `<button class="btn ${a === 'again' && up === t ? 'pri' : a === 'up' ? 'pri' : ''}" data-a="${a}" ${S.frag < mapCost(k) ? 'disabled' : ''}>${lab}<small>${mapCost(k) ? `${mapCost(k)} 碎片（有 ${S.frag}）` : '免費'}</small></button>`;
    o.innerHTML = `<div class="card portal"><h2>傳送門</h2><p>${G.first ? `<span class="c-gold">開放階級 ${S.maxT}！</span>` : '地上的東西撿完了嗎？'}</p>
      <div class="pbtns">${up > t ? btn(up, 'up', `下一把：階級 ${up}`) : ''}${btn(t, 'again', `下一把：階級 ${t}`)}<button class="btn" data-a="home">回藏身處<small>整理背包、點天賦</small></button></div>
      <p class="c-dim">走開就關掉</p></div>`;
    o.hidden = false;
  } else o.hidden = true;
}

/* ---------- 面板 ---------- */
const PANEL = { inv: false, stash: false, device: false, skill: false, asc: false, craft: false, pick: 1 };
function openPanel(k) {
  TOUCH.front = k === 'stash' || k === 'skill' || k === 'craft' ? 'other' : 'inv';
  /* 左邊一次只開一個（倉庫／技能寶石／鍛造台），右邊是背包 */
  if (k === 'stash' || k === 'skill' || k === 'craft') {
    PANEL.stash = PANEL.skill = PANEL.craft = false;
    PANEL.inv = PANEL[k] = true;
  } else if (k === 'device') {
    PANEL.device = true;
    PANEL.pick = S.maxT;
  } else PANEL[k] = true;
  hideTip();
  hudPanels();
}
function closePanels() {
  PANEL.inv = PANEL.stash = PANEL.device = PANEL.skill = PANEL.asc = PANEL.craft = false;
  hideTip();
  hudPanels();
}
function hudPanels() {
  if (!S) return;
  $('pinv').hidden = !PANEL.inv;
  $('pstash').hidden = !PANEL.stash;
  $('pdev').hidden = !PANEL.device;
  $('pskill').hidden = !PANEL.skill;
  $('pasc').hidden = !PANEL.asc;
  $('pcraft').hidden = !PANEL.craft;
  if (TOUCH.on && NARROW && PANEL.inv && (PANEL.stash || PANEL.skill || PANEL.craft)) {
    if (TOUCH.front === 'inv') $('pstash').hidden = $('pskill').hidden = $('pcraft').hidden = true;
    else $('pinv').hidden = true;
  }
  if (PANEL.asc) $('pasc').innerHTML = ascHTML();
  if (PANEL.skill) $('pskill').innerHTML = skillHTML();
  if (PANEL.craft) $('pcraft').innerHTML = forgeHTML();
  if (PANEL.inv) $('pinv').innerHTML = invHTML();
  if (PANEL.stash)
    $('pstash').innerHTML =
      `<div class="ph"><b>倉庫</b><span>${TOUCH.on ? '點一下＝說明與動作' : '點一下＝放進背包'}</span>${swapB('背包')}<button class="x" data-a="close">✕</button></div>${gridHTML(S.stash, 'stash')}`;
  if (PANEL.device) $('pdev').innerHTML = devHTML();
}
const hudInv = () => PANEL.inv && hudPanels();
/* 手機窄螢幕：兩個面板一次只顯示一個，標題列的按鈕切換 */
const swapB = n =>
  TOUCH.on && (PANEL.stash || PANEL.skill || PANEL.craft) ? `<button class="x sw" data-tm="swap">${n}</button>` : '';
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
    z = C / 36,
    eqs = EQS.map(e => {
      const [x, y, w, h] = EQPOS[e.k].map(v => Math.round(v * z)),
        it = S.eq[e.k];
      return `<div class="eqs ${it ? 'r' + it.r : ''}" data-eq="${e.k}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">${it ? itemHTML(it, 'eq', e.k) : `<small>${e.n}</small>`}</div>`;
    }).join('');
  const res = RESK.map(r => `<span class="res-${r}">${ELN[r]}抗 <b>${s.res[r]}%</b></span>`).join('');
  return `<div class="ph"><b>裝備</b><span>Lv ${S.lv} · ${S.gold} 金</span>${swapB(PANEL.stash ? '倉庫' : PANEL.craft ? '鍛造' : '技能')}<button class="x" data-a="close">✕</button></div>
  <div class="eqrow"><div class="doll" style="width:${Math.round(320 * z)}px;height:${Math.round(232 * z)}px">${eqs}</div>
  <div class="st">
    <span>傷害 <b>${Math.round(s.dmg[0])}–${Math.round(s.dmg[1])}</b></span><span>攻速 <b>${s.aps.toFixed(2)}</b></span><span>暴擊 <b>${Math.min(100, s.crit)}%</b></span>
    <span>生命 <b>${s.hp}</b></span>${s.es ? `<span>能量護盾 <b>${s.es}</b></span>` : ''}<span>護甲 <b>${s.armor}</b></span><span>格擋 <b>${s.block}%</b></span><span>精魄 <b>${s.spiritUsed}/${s.spirit}</b></span>
    ${res}
  </div></div>
  <div class="ph2">背包 <span>${TOUCH.on ? '按住拖＝搬移 · 點一下＝說明與動作' : PANEL.craft ? '拖曳擺放 · 點一下＝放上鍛造台' : `拖曳擺放 · 點一下＝裝備／收起${PANEL.stash ? '／放進倉庫' : ''}`}</span></div>
  ${gridHTML(S.inv, 'inv')}
  <div class="foot">${G.scene === 'hide' ? `<div class="sell" data-sell="1">拖到這裡賣掉</div>` : `<span class="c-dim">回藏身處才能賣東西</span>`}</div>`;
}
function gridHTML(g, src) {
  return `<div class="grid" data-grid="${src}" style="width:${g.w * C}px;height:${g.h * C}px">${g.items.map(it => itemHTML(it, src)).join('')}</div>`;
}
function itemHTML(it, src, eqk) {
  const [w, h] = itemSize(it),
    pos = isSlot(src) ? '' : `left:${it.x * C}px;top:${it.y * C}px;width:${w * C}px;height:${h * C}px`;
  return `<div class="it r${it.r} ${isSlot(src) ? 'full' : ''}" data-src="${src}" data-id="${it.id}" ${eqk ? `data-eqk="${eqk}"` : ''} style="${pos}">${icHTML(itemIc(it))}</div>`;
}
/* 技能寶石面板：5 個技能欄，每欄 1 顆技能＋2 顆輔助 */
const TAGN = {
  attack: '攻擊',
  melee: '近戰',
  proj: '投射物',
  aoe: '範圍',
  spell: '法術',
  cd: '冷卻',
  minion: '召喚',
  dot: '持續傷害',
  move: '位移'
};
function skillHTML() {
  const sock = (key, it, cls, lab, bad) =>
      `<div class="eqs sock ${cls} ${it ? 'r3' : ''} ${bad ? 'bad-link' : ''}" data-sock="${key}">${it ? itemHTML(it, 'sock', key) : `<small>${lab}</small>`}</div>`,
    mini = (fg, lab, why) =>
      `<button class="btn mini" data-fg="${fg}" ${why ? `disabled title="${esc(why)}"` : ''}>${lab}</button>`,
    M = MAT();
  return `<div class="ph"><b>技能寶石</b><span>靈魂 <b class="c-gold">${M.soul}</b> · ${TOUCH.on ? '點背包裡的寶石再按鑲上' : '拖進來或點背包裡的寶石'}</span>${swapB('背包')}<button class="x" data-a="close">✕</button></div>
  ${S.skills
    .map((sl, i) => {
      const c = slotCfg(i),
        g = sl.a;
      if (!g)
        return `<div class="skrow"><kbd>${SLOTKEY[i]}</kbd>${sock(i + ':a', null, 'act', '技能')}<div class="skinfo"><small class="c-dim">放一顆技能寶石（書庫可以複製白板）</small></div></div>`;
      const up = gemUpCheck(g),
        sups = g.sup.filter(Boolean),
        supC = sups.filter(x => !gemUpCheck(x).why).reduce((a, x) => a + soulCost(x.lv, 1), 0),
        dr = drillCheck(g);
      return `<div class="skrow"><kbd>${SLOTKEY[i]}</kbd>${sock(i + ':a', g, 'act', '技能')}<div class="links">${g.sup
        .map((x, j) => sock(i + ':' + j, x, 'sup', '輔助', x && !supOK(SKILLS[g.gem], x)))
        .join(
          ''
        )}</div><div class="skinfo"><b>${esc(c.D.n)} <span>Lv ${g.lv}${c.lv > g.lv ? `（+${c.lv - g.lv}）` : ''} · ${g.so} 孔</span></b><small>${c.mp ? `魔力 ${c.mp}` : '不耗魔力'}${c.cd ? ` · 冷卻 ${c.cd.toFixed(1)} 秒` : ''}${c.D.wt ? ` · <span class="${wtOK(c.D) ? '' : 'c-bad'}">${wtNeed(c.D)}</span>` : ''}</small>
        <span class="gbtns">${mini('gup:' + i, `升級 ${up.c} 魂`, up.why)}${sups.length ? mini('sup:' + i, `輔助 +1 ${supC} 魂`, supC ? '' : '輔助都升不了（滿級、超過角色等級或靈魂不夠）') : ''}${g.so < GEM_SO_MAX ? mini('dri:' + i, `開孔（${DRILLS[dr.k]}）`, dr.why) : ''}</span></div></div>`;
    })
    .join('')}
  <div class="aurah"><b>光環</b><span>精魄 ${ST.spiritUsed} / ${ST.spirit} · 開著就一直生效，精魄不夠的不會生效</span></div>
  <div class="aurarow">${S.auras
    .map((g, j) => {
      const on = g && ST.auraOn.includes(g.gem),
        up = g && gemUpCheck(g);
      return `<div class="aurac">${sock('A:' + j, g, 'act', '光環', g && !on)}<small>${g ? `${esc(AURAS[g.gem].n)} Lv ${g.lv}` : '空的'}</small>${g ? mini('aup:' + j, `升級 ${up.c}`, up.why) : ''}</div>`;
    })
    .join('')}</div>
  <div class="aurah"><b>書庫</b><span>學會的寶石永遠會；點一下複製一顆白板（Lv 1、2 孔）到背包</span></div>
  <div class="lib">${LIB()
    .map(
      k =>
        `<button class="eqs libg" data-fg="lib:${k}" title="${esc(gemOf({ gem: k }).n)}">${icHTML(gemOf({ gem: k }).ic)}</button>`
    )
    .join('')}</div>`;
}
/* 昇華石碑：選職業（目前只有劍士）與分支；點數在天賦樹中間點 */
function ascHTML() {
  const A = ASC.sword,
    pts = ascPoints(S),
    soon = ['騎士', '火法師', '刺客', '馴獸師'];
  return `<div class="ph"><b>昇華石碑</b><span>昇華點 ${pts} / 8（階級 6、12、16 的王第一次打倒各 +2）</span><button class="x" data-a="close">✕</button></div>
  <div class="ascls"><div class="acls on">${icHTML(A.ic)}<b>${A.n}</b></div>${soon.map(n => `<div class="acls off"><b>${n}</b><small>之後開放</small></div>`).join('')}</div>
  <div class="abrs">${Object.entries(A.br)
    .map(([k, B]) => {
      const cur = S.asc === k;
      return `<div class="abr ${cur ? 'on' : ''}"><div class="abh">${icHTML(B.ic)}<div><b>${B.n}</b><small>${B.d}</small></div></div>
      <ul>${Object.values(B.big)
        .map(g => `<li><b>${g.n}</b>${esc(g.d)}</li>`)
        .join('')}</ul>
      <button class="btn ${cur ? '' : 'pri'}" data-a="asc:${k}" ${cur ? 'disabled' : ''}>${cur ? '目前的昇華' : S.asc ? `改成${B.n}（點數退回）` : `成為${B.n}`}</button></div>`;
    })
    .join('')}</div>
  <p class="c-dim">選好後按 P：天賦樹中間挖空的地方就是昇華點。每條分支 8 點只能點成 4 小 4 大（大點是獨特效果）。</p>`;
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
/* 欄位：裝備欄 eq（key＝欄位名）、寶石插槽 sock（key＝「技能欄:a」是技能、「技能欄:0／1」是輔助） */
const isSlot = src => src === 'eq' || src === 'sock';
function slotGet(src, key) {
  if (src === 'eq') return S.eq[key];
  const [i, p] = key.split(':');
  if (i === 'A') return S.auras[+p];
  const a = S.skills[i].a;
  return p === 'a' ? a : a && a.sup ? a.sup[+p] : null;
}
function slotSet(src, key, it) {
  if (src === 'eq') return (S.eq[key] = it);
  const [i, p] = key.split(':');
  if (i === 'A') S.auras[+p] = it;
  else if (p === 'a') S.skills[i].a = it;
  else S.skills[i].a.sup[+p] = it;
}
const slotFits = (src, key, it) =>
  src === 'eq'
    ? eqTakes(
        EQS.find(q => q.k === key),
        kindOf(it)
      ) &&
      (key !== 'off' || offOK(S.eq.weapon, it))
    : !!it.gem &&
      (key[0] === 'A'
        ? isAura(it)
        : key.endsWith(':a')
          ? !isSup(it) && !isAura(it)
          : isSup(it) && !!S.skills[key.split(':')[0]].a && +key.split(':')[1] < S.skills[key.split(':')[0]].a.so);
function findItem(src, id, eqk) {
  if (isSlot(src)) return slotGet(src, eqk);
  return GRIDS()[src].items.find(o => o.id === +id);
}
function takeOut(src, it, eqk) {
  if (isSlot(src)) slotSet(src, eqk, null);
  else {
    const g = GRIDS()[src];
    g.items.splice(g.items.indexOf(it), 1);
  }
}
/* 放回原處（原位放不下就找空位） */
function putBack(src, it, eqk, ox, oy) {
  if (isSlot(src)) return slotSet(src, eqk, it), true;
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
  /* 換上雙手武器（或換掉弓）：不合規的副手收進背包 */
  if (!offOK(S.eq.weapon, S.eq.off)) {
    const off = S.eq.off;
    if (gridAuto(S.inv, off)) (S.eq.off = null), hudWarn('雙手武器不能拿副手：副手收進背包');
    else hudWarn('背包滿了：副手沒有作用（雙手武器不能拿副手）');
  }
  const hpF = P.hp / ST.hp;
  ST = stats();
  P.hp = Math.min(ST.hp, Math.max(1, hpF * ST.hp));
  P.mp = Math.min(ST.mp, P.mp);
  save();
  hudPanels();
  hudBar();
}
/* 點一下：背包→裝上、身上→收進背包、倉庫↔背包 */
function quickMove(src, it, eqk) {
  /* 鍛造台開著：點裝備＝放上鍛造台 */
  if (PANEL.craft && !it.gem) return craftPick(src, it, eqk);
  if (isSlot(src)) {
    if (!gridAuto(S.inv, it)) return hudWarn('背包滿了');
    slotSet(src, eqk, null);
  } else if (it.gem && src === 'inv' && !PANEL.stash) {
    /* 寶石：技能放進第一個空的技能欄、輔助放進第一個相容的空插槽 */
    const key = gemSlotFor(it);
    if (!key)
      return hudWarn(isAura(it) ? '光環欄滿了' : isSup(it) ? '沒有空的輔助插槽' : '技能欄滿了：拖到想換的那一欄');
    takeOut('inv', it);
    slotSet('sock', key, it);
    if (!PANEL.skill) openPanel('skill');
  } else if (src === 'stash') {
    takeOut('stash', it);
    if (!gridAuto(S.inv, it)) return gridAuto(S.stash, it), hudWarn('背包滿了');
  } else if (PANEL.stash) {
    takeOut('inv', it);
    if (!gridAuto(S.stash, it)) return gridAuto(S.inv, it), hudWarn('倉庫滿了');
  } else {
    const k = kindOf(it),
      slots = EQS.filter(e => eqTakes(e, k)),
      e = slots.find(e => !S.eq[e.k]) || slots[0];
    if (!e) return;
    if (e.k === 'off' && !offOK(S.eq.weapon, it))
      return hudWarn(k === 'quiver' ? '箭袋只有拿弓才能用' : '拿雙手武器時不能拿副手');
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
function gemSlotFor(it) {
  if (isAura(it)) {
    const j = S.auras.findIndex(g => !g);
    return j < 0 ? null : 'A:' + j;
  }
  for (let i = 0; i < NSLOT; i++) {
    const sl = S.skills[i];
    if (!isSup(it) && !sl.a) return i + ':a';
    if (isSup(it) && sl.a && supOK(SKILLS[sl.a.gem], it)) {
      const j = sl.a.sup.findIndex(x => !x);
      if (j >= 0) return i + ':' + j;
    }
  }
  if (isSup(it))
    for (let i = 0; i < NSLOT; i++) {
      const a = S.skills[i].a,
        j = a ? a.sup.findIndex(x => !x) : -1;
      if (j >= 0) return i + ':' + j;
    }
  return null;
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
  const gx = isSlot(src) ? Math.floor(w / 2) : Math.min(w - 1, Math.floor((e.clientX - r.left) / C)),
    gy = isSlot(src) ? Math.floor(h / 2) : Math.min(h - 1, Math.floor((e.clientY - r.top) / C));
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
    if (el.dataset.eq) return { k: 'eq', src: 'eq', eqk: el.dataset.eq, el, ok: slotFits('eq', el.dataset.eq, DR.it) };
    if (el.dataset.sock)
      return { k: 'eq', src: 'sock', eqk: el.dataset.sock, el, ok: slotFits('sock', el.dataset.sock, DR.it) };
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
  if (!d.moved) return TOUCH.on ? tapItem(d) : quickMove(d.src, d.it, d.eqk);
  if (!t || (t.k !== 'sell' && !t.ok)) return hudPanels();
  if (t.k === 'sell') return G.scene === 'hide' ? sell(d.src, d.it, d.eqk) : hudPanels();
  takeOut(d.src, d.it, d.eqk);
  if (t.k === 'eq') {
    const old = slotGet(t.src, t.eqk);
    slotSet(t.src, t.eqk, d.it);
    /* 換下來的放回拿起來的地方（從另一個欄位拖來的，放得進就互換） */
    const back =
      old &&
      (isSlot(d.src) && slotFits(d.src, d.eqk, old)
        ? (slotSet(d.src, d.eqk, old), true)
        : putBack(isSlot(d.src) ? 'inv' : d.src, old, null, d.ox, d.oy));
    if (old && !back) {
      slotSet(t.src, t.eqk, old);
      putBack(d.src, d.it, d.eqk, d.ox, d.oy);
      hudWarn('放不下換下來的東西');
    }
  } else {
    const sw = t.swap;
    if (sw) takeOut(t.src, sw);
    d.it.x = t.x;
    d.it.y = t.y;
    t.g.items.push(d.it);
    if (
      sw &&
      !(isSlot(d.src) && slotFits(d.src, d.eqk, sw)
        ? (slotSet(d.src, d.eqk, sw), true)
        : putBack(isSlot(d.src) ? 'inv' : d.src, sw, null, d.ox, d.oy))
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
function gemTip(it) {
  const D = gemOf(it),
    sup = isSup(it),
    sl = S.skills.find(sl => sl.a && sl.a.sup.includes(it)),
    bad = sl && sl.a && !supOK(SKILLS[sl.a.gem], it);
  let html = `<b class="rc3">${esc(D.n)}</b><small>${isAura(it) ? '光環寶石' : sup ? '輔助寶石' : '技能寶石'} · Lv ${it.lv}</small><p>${esc(D.d)}</p>`;
  if (isAura(it)) {
    const on = S.auras.includes(it),
      act = on && ST.auraOn.includes(it.gem);
    html += `<p class="base">預留精魄 ${D.sp} · 效果 ×${((1 + 0.03 * (it.lv - 1)) * (1 + ST.auraEff / 100)).toFixed(2)}（等級與光環效果）</p>`;
    if (on && !act) html += `<p class="c-bad">精魄不夠，沒有生效</p>`;
  } else if (sup)
    html += `<p class="base">${D.need.length ? '要有標籤：' + D.need.map(t => TAGN[t]).join('、') : '所有技能都能用'}</p>`;
  else if (!isAura(it))
    html += `${D.wt ? `<p class="${wtOK(D) ? 'base' : 'c-bad'}">${wtNeed(D)}</p>` : ''}<p class="base">標籤：${D.tags.map(t => TAGN[t]).join('、')}${D.mp ? ` · 魔力 ${D.mp}` : ''}${D.cd ? ` · 冷卻 ${D.cd} 秒` : ''}<br>傷害 ×${(D.m * Math.pow(1.06, it.lv - 1)).toFixed(2)}${D.el ? `（全部是${ELN[D.el]}）` : ''}</p>`;
  if (bad) html += `<p class="c-bad">跟這個技能不相容，沒有效果</p>`;
  if (it.sup)
    html += `<p class="base">孔 ${it.so}／${GEM_SO_MAX}${
      it.sup.some(Boolean)
        ? '：' +
          it.sup
            .filter(Boolean)
            .map(x => gemOf(x).n)
            .join('、')
        : ''
    }</p>`;
  html += `<p class="hint">升級要 ${soulCost(it.lv, isSup(it))} 靈魂（不能超過角色等級）</p>`;
  return html;
}
function itemTip(it, cmp) {
  if (it.gem) return gemTip(it);
  const B = baseOf(it);
  let html = `<b class="rc${it.r}">${esc(itemName(it))}</b><small>${RARN[it.r]} ${KINDS[B.k].n} · 物品等級 ${it.L}</small>`;
  const lay = baseLayers(it);
  if (lay) html += `<p class="lay">${lay}</p>`;
  html += `<p class="base">${baseText(it).join('<br>')}</p>`;
  if (it.a.length) html += `<p class="aff">${it.a.map(a => `${affText(a)} <i>T${a.T}</i>`).join('<br>')}</p>`;
  if (cmp) {
    const slots = EQS.filter(e => eqTakes(e, B.k)),
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
  $('tip').classList.remove('act');
  TOUCH.sel = null;
}

/* ---------- 輸入 ---------- */
function inputInit() {
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    const k = e.key.toLowerCase();
    if (e.repeat && !'wasd'.includes(k) && !k.startsWith('arrow')) return;
    K[k] = 1;
    if (k === ' ') {
      e.preventDefault();
      doRoll();
    } else if (k === 'q') useSlot(2);
    else if (k === 'e') useSlot(3);
    else if (k === 'r') useSlot(4);
    else if (k === 'g') PANEL.skill ? closePanels() : openPanel('skill');
    else if (k === 'p') treeOpen('pt');
    else if (k === '1') drinkFlask();
    else if (k === 'f') interact();
    else if (k === 'i' || k === 'b') PANEL.inv ? closePanels() : openPanel('inv');
    else if (k === 'h') $('keys').classList.toggle('off');
    else if (k === 'escape') TREE.open ? treeClose() : closePanels();
    else if (k === 't') homeAsk();
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
    if (e.pointerType === 'touch') return; /* 觸控在 touch.js */
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
      useSlot(0);
      pressFx('左鍵');
    }
    if (e.button === 2) {
      M.R = 1;
      useSlot(1);
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
    if (e.pointerType !== 'mouse' || (DR && DR.moved)) return; /* 觸控：點一下才出說明框 */
    const s = e.target.closest('.it[data-id],[data-tip]');
    if (!s) return hideTip();
    const r = s.getBoundingClientRect();
    if (s.dataset.tip)
      return showTip(`<p class="sktip">${esc(s.dataset.tip).replace(/\n/g, '<br>')}</p>`, r.right - 30, r.top - 40);
    const it = findItem(s.dataset.src, s.dataset.id, s.dataset.eqk);
    if (it) showTip(itemTip(it, !isSlot(s.dataset.src)), r.right, r.top + r.height / 2);
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
  } else if (a === 'again') mapAgain(G.mapT);
  else if (a === 'up') mapAgain(Math.min(S.maxT, TMAX));
  else if (a.startsWith('asc:')) {
    /* 選昇華分支（換分支＝昇華點全部退回） */
    S.asc = a.slice(4);
    S.at = ['a_st'];
    save();
    ST = stats();
    hudPanels();
    hudWarn(`成為${ASC.sword.br[S.asc].n}！按 P 在天賦樹中間點昇華`);
    sfx('lvup');
  }
}
