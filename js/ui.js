/* 塞令老師 · 畫面：首頁、準備（背包、暫存區、商店）、戰鬥播放、結算、三選一、圖鑑、說明、設定；拖曳擺放 */
'use strict';
let S = null, // 存檔（main.js）
  B = null; // 播放中的戰鬥
const V = { scr: 'home', sel: null, drag: null }; // 畫面狀態（不存檔）
/* ================= 小工具 ================= */
function toast(t) {
  const el = $('toast');
  el.textContent = t;
  el.style.opacity = 1;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (el.style.opacity = 0), 1800);
}
const snd = n => typeof sfx === 'function' && sfx(n);
/* 道具圖示：先用專屬的 art/icons/it_代號.png；還沒有就借 ic：'sk_…'（舊的 PNG 圖示）、'p:鍵'（程式像素圖）、'a:檔名'（怪物 PNG） */
const ICU = new Map();
function borrowIcon(id) {
  const ic = ITEMI[id].ic;
  if (ic.startsWith('p:')) return pixURL(ic.slice(2));
  if (ic.startsWith('a:')) {
    const c = artSprite('a_' + ic.slice(2));
    return c.pending ? null : c.toDataURL();
  }
  return artIconURL(ic);
}
function itemIcon(id) {
  if (ICU.has(id)) return ICU.get(id);
  const u = artIconURL('it_' + id) || borrowIcon(id);
  if (!u) return iconURL('star');
  ICU.set(id, u);
  return u;
}
/* 頭像：PNG 怪物圖畫到 canvas（render 後統一畫） */
const sprCv = (name, cls = '') => `<canvas class="spr ${cls}" data-spr="${name}" width="18" height="18"></canvas>`;
function paintSprites(root = document) {
  root.querySelectorAll('canvas[data-spr]').forEach(cv => {
    const sp = sprite(cv.dataset.spr);
    if (cv.width !== sp.width) cv.width = cv.height = sp.width;
    const x = cv.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.clearRect(0, 0, cv.width, cv.height);
    x.drawImage(sp, 0, 0);
  });
}
/* 大圖載好時重畫（sprites.js 呼叫）；拖曳中、戰鬥中不重畫整頁 */
/* 正在輸入框裡打字 */
const typing = () => !!document.activeElement && document.activeElement.matches('input,textarea,select');
function artRepaint() {
  clearTimeout(artRepaint.t);
  artRepaint.t = setTimeout(() => {
    ICU.clear();
    if (!V.drag && !B && !typing()) render();
    else paintSprites();
  }, 80);
}
const stars = n => '★'.repeat(n);
const tierTxt = t => ['', '', ' Ⅱ', ' Ⅲ'][t];
const tierBadge = t => (t > 1 ? `<b class="tier">${t === 2 ? 'Ⅱ' : 'Ⅲ'}</b>` : '');
const avName = av => (AVATARS.find(a => a[0] === av) || AVATARS[0])[1];
/* ================= 牌階 ================= */
/* 0.1.6 牌階的像素圖示（16×16，程式畫）：盾牌底；金牌起上面兩根尖角、鑽石起中間寶石、大師起兩邊翅膀、菁英加皇冠；
   一二三是下面 1～3 個小點。-1 是定級中（灰色問號盾） */
const RANKC = [
  ['#4b4f57', '#7d838c', '#b4bac2'],
  ['#6b3a1f', '#b0683a', '#e3a06c'],
  ['#5d6b7c', '#a9b6c5', '#eef3f8'],
  ['#8a5a00', '#e0a422', '#ffe08a'],
  ['#1f6f68', '#3fb8a9', '#a6f2e6'],
  ['#233f99', '#4f84ef', '#b8d2ff'],
  ['#552288', '#9a52e0', '#dcb2ff'],
  ['#8c1f1a', '#e2493c', '#ffc07a']
];
const RANK_SHIELD = [
  '................',
  '................',
  '...oooooooooo...',
  '..ommmmmmmmmmo..',
  '..omllmmmmmmmo..',
  '..omlmmmmmmmmo..',
  '..ommmmmmmmmmo..',
  '..ommmmmmmmmmo..',
  '..ommmmmmmmmmo..',
  '...ommmmmmmmo...',
  '...ommmmmmmmo...',
  '....ommmmmmo....',
  '.....ommmmo.....',
  '......oooo......',
  '................',
  '................'
];
const RKC = new Map();
function rankIcon(i) {
  if (RKC.has(i)) return RKC.get(i);
  const t = i < 0 ? -1 : fl(i / 3),
    d = i < 0 ? 0 : (i % 3) + 1,
    [o, m, l] = t < 0 ? ['#4a4650', '#8a8590', '#c9c4cf'] : RANKC[t],
    g = RANK_SHIELD.map(r => r.split(''));
  const set = (x, y, c) => (g[y][x] = c);
  if (t >= 3) [3, 12].forEach(x => (set(x, 1, 'o'), set(x, 2, 'o')));
  if (t >= 5) {
    [
      [7, 5],
      [8, 5],
      [6, 6],
      [9, 6],
      [6, 7],
      [9, 7],
      [7, 8],
      [8, 8]
    ].forEach(([x, y]) => set(x, y, 'o'));
    [
      [7, 6],
      [8, 6],
      [7, 7],
      [8, 7]
    ].forEach(([x, y]) => set(x, y, 'l'));
  }
  if (t >= 6) {
    for (let y = 4; y <= 8; y++) set(1, y, 'w'), set(14, y, 'w');
    for (let y = 3; y <= 7; y++) set(0, y, 'o'), set(15, y, 'o');
    [3, 9].forEach(y => (set(1, y, 'o'), set(14, y, 'o')));
  }
  if (t === 7) {
    [4, 7, 8, 11].forEach(x => set(x, 0, 'y'));
    for (let x = 4; x <= 11; x++) set(x, 1, 'y');
  }
  if (t < 0) {
    [
      [6, 5],
      [7, 4],
      [8, 4],
      [9, 5],
      [9, 6],
      [8, 7],
      [7, 8],
      [7, 10]
    ].forEach(([x, y]) => set(x, y, 'l'));
  }
  const px = { 1: [[7]], 2: [[5], [9]], 3: [[4], [7], [10]] }[d] || [];
  px.forEach(([x]) => (set(x, 10, 'l'), set(x + 1, 10, 'l')));
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const x = c.getContext('2d'),
    pal = { o, m, l, w: m, y: '#ffd24a' };
  g.forEach((r, y) =>
    r.forEach((ch, xx) => {
      if (!pal[ch]) return;
      x.fillStyle = pal[ch];
      x.fillRect(xx, y, 1, 1);
    })
  );
  const u = c.toDataURL();
  RKC.set(i, u);
  return u;
}
/* 牌階一列：圖示＋名字＋這一級的進度條（定級中顯示場數） */
function rankHTML(big) {
  if (!placed())
    return `<div class="rank${big ? ' big' : ''}"><img src="${rankIcon(-1)}" alt=""><span><b>定級中</b><small>再打 ${PLACE_N - (S.games || 0)} 場決定牌階</small></span></div>`;
  const i = rankOf(S.rating);
  return `<div class="rank${big ? ' big' : ''}"><img src="${rankIcon(i)}" alt=""><span><b class="rk${fl(i / 3)}">${rankName(i)}</b><i class="rkbar"><i style="width:${Math.round(rankProg(S.rating) * 100)}%"></i></i></span></div>`;
}
/* ================= 主題 ================= */
/* 0.1.2 淺色／深色（0.1.4 起預設）／跟隨系統：設在 <html data-theme> */
const darkMQ = matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const t = (S && S.theme) || 'dark',
    d = t === 'dark' || (t === 'auto' && darkMQ.matches);
  document.documentElement.dataset.theme = d ? 'dark' : 'light';
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = d ? '#1d1b21' : '#f2eee7';
}
darkMQ.addEventListener('change', () => S && S.theme === 'auto' && applyTheme());
/* 畫面最上方的深淺切換（跟隨系統時切到相反的那一個） */
const themeBtn = () => {
  const d = document.documentElement.dataset.theme === 'dark';
  return `<button class="iconbtn" data-act="themeTog" aria-label="${d ? '切到淺色' : '切到深色'}">${d ? '☀' : '☾'}</button>`;
};
/* ================= 畫面切換 ================= */
function render() {
  if (!S) return;
  applyTheme();
  const run = S.run,
    app = $('app');
  let html = '';
  if (V.scr === 'run' && run) {
    if (run.phase === 'battle') return renderBattle();
    if (run.phase === 'end') html = endHTML(run);
    else
      html =
        prepHTML(run) +
        (run.phase === 'result' ? resultHTML(run) : '') +
        (run.phase === 'pick' ? pickHTML(run) : '') +
        (run.phase === 'prep' ? revealHTML(run) : '') +
        (run.phase === 'cls' ? clsHTML(run) : '');
  } else if (V.scr === 'codex') html = codexHTML();
  else if (V.scr === 'help') html = helpHTML();
  else if (V.scr === 'settings') html = settingsHTML();
  else html = homeHTML();
  app.innerHTML = html;
  paintSprites(app);
}
const go = scr => {
  V.scr = scr;
  V.sel = null;
  render();
};
/* ================= 首頁 ================= */
function homeHTML() {
  const run = S.run;
  return `<div class="home">
    <div class="htop">${themeBtn()}</div>
    <div class="logo"><b>塞令老師</b><small>背包自動對戰</small></div>
    <div class="card prof">${sprCv('a_' + S.av, 'big')}<div><b>${esc(S.name)}</b>${rankHTML()}<div class="kv3"><span>場數<b>${S.games || 0}</b></span><span>最佳<b>${S.best < 9 ? '第 ' + S.best : '—'}</b></span><span>第 1 名<b>${(S.hist || []).filter(x => x.place === 1).length}</b></span></div></div></div>
    <button class="btn pri big" data-act="play">${run ? `繼續對局（${curRound(run) ? curRound(run).id : ''}）` : '開始對戰'}</button>
    <div class="g3"><button class="btn" data-act="go" data-k="help">怎麼玩</button><button class="btn" data-act="go" data-k="codex">道具圖鑑</button><button class="btn" data-act="go" data-k="settings">設定</button></div>
    ${
      (S.hist || []).length
        ? `<h3>最近的對局</h3><div class="hist">${S.hist
            .slice(0, 6)
            .map(
              x =>
                `<div><b class="pl p${x.place}">第 ${x.place} 名</b><span>${x.r}</span><span class="${x.d >= 0 ? 'c-good' : 'c-bad'}">${x.d >= 0 ? '▲' : '▼'}</span></div>`
            )
            .join('')}</div>`
        : ''
    }
    <p class="sub ver">塞令老師 v${VER}・${esc(typeof CLOUD !== 'undefined' ? CLOUD.status : '')}</p>
  </div>`;
}
async function startRun() {
  audioOn();
  $('app').innerHTML =
    `<div class="home"><div class="logo"><b>配對中…</b><small>尋找牌階相近的對手</small></div></div>`;
  const rivals = await ghostRivals(S.rating);
  S.run = newRun(rivals);
  S.run.ver = VER;
  V.scr = 'run';
  V.sel = null;
  save();
  render();
  ghostBegin(S.run);
}
/* ================= 準備畫面 ================= */
const GAP = 4;
const cellSize = w =>
  Math.max(30, Math.min(w <= 3 ? 64 : 52, fl((Math.min(innerWidth, 480) - 32 - (w - 1) * GAP) / w)));
function rivalHTML(run) {
  const nx = curRound(run) && curRound(run).type === 'pvp' ? nextRival(run) : -1;
  return `<div class="rivals">${run.rivals
    .map((rv, i) => {
      /* 只看到這回合為止的快照（不能偷看對手之後的生命）；最後一筆快照在這回合之前就是淘汰了 */
      const ids = Object.keys(rv.snaps || {}).map(id => ROUNDS.findIndex(r => r.id === id)),
        last = Math.max(-1, ...ids),
        now = Math.max(-1, ...ids.filter(k => k <= run.ri)),
        sn = now >= 0 ? rv.snaps[ROUNDS[now].id] : null,
        out = last < run.ri && rv.place !== 1,
        hp = out ? 0 : Math.max(0, (sn ? sn.hp : START_HP) - (rv.dmg || 0));
      if (hp <= 0)
        return `<div class="rv out">${sprCv('a_' + rv.av)}<span><b>${esc(rv.name)}</b><i class="hpb"><i style="width:0"></i></i><small>淘汰</small></span></div>`;
      return `<div class="rv${out ? ' out' : ''}${i === nx ? ' nx' : ''}">${sprCv('a_' + rv.av)}<span><b>${esc(rv.name)}</b><i class="hpb"><i style="width:${(hp / START_HP) * 100}%"></i></i><small>${out ? '淘汰' : '♥ ' + hp}</small></span></div>`;
    })
    .join('')}</div>`;
}
/* 下一場 PvP 會打誰（跟 opponentOf 一樣的規則，只看不改） */
function nextRival(run) {
  const r = curRound(run),
    al = run.rivals.map((rv, i) => [rv, i]).filter(([rv]) => rivalAlive(rv, r.id));
  if (!al.length) return -1;
  return (al.find(([, i]) => i >= run.rp % run.rivals.length) || al[0])[1];
}
function tutHTML() {
  if (S.tut >= 3) return '';
  const t = [
    '點商店的道具看說明，或直接把它拖進背包（也可以先買到暫存區）',
    '把暫存區的道具拖進背包格子（點一下可以旋轉、賣出；拖到別的道具上可以交換位置）',
    '擺好就按右下角的按鈕，戰鬥全自動！'
  ][S.tut];
  return `<div class="tut">💡 ${t}</div>`;
}
function bagHTML(bag, cs, opt = {}) {
  const W = bag.w * cs + (bag.w - 1) * GAP,
    H = bag.h * cs + (bag.h - 1) * GAP,
    mods = opt.mods,
    sel = V.sel && bag.items.find(o => o.u === V.sel),
    lit = new Set();
  if (sel && mods) for (const [u, l] of mods) if (l.some(x => x.from === sel.u)) lit.add(u);
  let h = `<div class="bag${opt.mini ? ' mini' : ''}" id="${opt.id || 'bag'}" style="width:${W}px;height:${H}px;--cs:${cs}px">`;
  for (let y = 0; y < bag.h; y++)
    for (let x = 0; x < bag.w; x++)
      h += `<i class="cell" style="left:${x * (cs + GAP)}px;top:${y * (cs + GAP)}px"></i>`;
  for (const o of bag.items) {
    const I = ITEMI[o.id],
      cs0 = cellsOf(o),
      mx = Math.min(...cs0.map(p => p[0])),
      my = Math.min(...cs0.map(p => p[1])),
      Mx = Math.max(...cs0.map(p => p[0])),
      My = Math.max(...cs0.map(p => p[1])),
      bw = (Mx - mx + 1) * (cs + GAP) - GAP,
      bh = (My - my + 1) * (cs + GAP) - GAP,
      buf = mods && mods.get(o.u) && mods.get(o.u).length;
    h += `<div class="it s${I.star}${V.sel === o.u ? ' sel' : ''}${lit.has(o.u) ? ' lit' : ''}${I.core ? ' core' : ''}" data-u="${o.u}" style="left:${mx * (cs + GAP)}px;top:${my * (cs + GAP)}px;width:${bw}px;height:${bh}px">${cs0
      .map(([x, y]) => {
        /* 同一件的格子連在一起：相鄰那一邊補滿間隙、不畫框線與圓角 */
        const has = (a, b) => cs0.some(p => p[0] === a && p[1] === b),
          R = has(x + 1, y),
          D = has(x, y + 1),
          L = has(x - 1, y),
          U = has(x, y - 1),
          bw2 = opt.mini ? 1 : 2,
          rr = opt.mini ? 4 : 6;
        return `<i class="c" data-u="${o.u}" data-cx="${x}" data-cy="${y}" style="left:${(x - mx) * (cs + GAP)}px;top:${(y - my) * (cs + GAP)}px;width:${cs + (R ? GAP : 0)}px;height:${cs + (D ? GAP : 0)}px;border-width:${U ? 0 : bw2}px ${R ? 0 : bw2}px ${D ? 0 : bw2}px ${L ? 0 : bw2}px;border-radius:${U || L ? 0 : rr}px ${U || R ? 0 : rr}px ${D || R ? 0 : rr}px ${D || L ? 0 : rr}px"></i>`;
      })
      .join(
        ''
      )}<img src="${itemIcon(o.id)}" alt="${I.n}">${tierBadge(o.t)}${buf && !opt.mini ? '<b class="buf">+</b>' : ''}</div>`;
  }
  /* 0.1.4 選中的道具右上角放旋轉鈕，不用到下面說明區按 */
  if (sel && !opt.mini && shapeOf(sel.id).length > 1) {
    const c = cellsOf(sel),
      rx = (Math.max(...c.map(p => p[0])) + 1) * (cs + GAP) - GAP,
      ry = Math.min(...c.map(p => p[1])) * (cs + GAP);
    h += `<button class="rotb" data-act="rot" aria-label="旋轉" style="left:${Math.min(rx - 16, W - 22)}px;top:${Math.max(ry - 12, -10)}px">↻</button>`;
  }
  return h + '</div>';
}
/* 0.1.4 道具形狀的小圖（商店、說明、三選一）：幾格、怎麼排一眼看得出來 */
function shapeMini(id, r = 0) {
  const c = shapeOf(id, r),
    w = Math.max(...c.map(p => p[0])) + 1,
    h = Math.max(...c.map(p => p[1])) + 1;
  return `<i class="shp" style="--w:${w};--h:${h}" aria-label="${c.length} 格">${c
    .map(([x, y]) => `<i style="grid-area:${y + 1}/${x + 1}"></i>`)
    .join('')}</i>`;
}
/* 0.1.1 回合列：這一階段每一輪的事件（過去的變暗、這一輪亮起來），右邊是下一階段的開頭 */
function roundBarHTML(run) {
  const r = curRound(run),
    st = ROUNDS.filter(q => q.st === r.st),
    nx = ROUNDS.find(q => q.st === r.st + 1);
  return `<div class="rbar" aria-label="回合">${st
    .map(q => {
      const k = ROUNDS.indexOf(q),
        lg = run.log.find(l => l.id === q.id);
      return `<span class="rb t-${q.type}${k === run.ri ? ' on' : k < run.ri ? ' past' : ''}${lg ? (lg.win ? ' w' : ' l') : ''}"><b>${q.id}</b><small>${RSHORT[q.type]}</small></span>`;
    })
    .join('')}${nx ? `<span class="rb nx"><b>${nx.id}</b><small>下一階段</small></span>` : ''}</div>`;
}
function prepHTML(run) {
  const r = curRound(run),
    bag = run.bag,
    cs = cellSize(bag.w),
    mods = bagMods(bag),
    lvNext = run.lv < BAG_MAX ? BAGLV[run.lv + 1] : null,
    nr = r.type === 'pvp' ? nextRival(run) : -1,
    oppTxt = r.type === 'pvp' ? (nr >= 0 ? `對戰 ${esc(run.rivals[nr].name)}` : '對戰') : RTYPE[r.type];
  return `<div class="prep">
    <div class="top"><button class="iconbtn" data-act="menu" aria-label="選單">☰</button><button class="me" data-act="stats" aria-label="角色數值">${sprCv('a_' + S.av)}<span><b>${esc(S.name)}</b><small class="hpt">♥ ${run.hp}／${START_HP}<em>${CLSI[run.bag.cls] ? CLSI[run.bag.cls].n : '數值'} ›</em></small></span></button><div class="rinfo"><b class="gold">${run.gold} 金</b><small>${r.id}・${oppTxt}</small></div>${themeBtn()}</div>
    ${roundBarHTML(run)}
    ${rivalHTML(run)}
    ${tutHTML()}
    ${holdHTML(run)}
    <div class="bagwrap" id="bagwrap">${bagHTML(bag, cs, { mods })}</div>
    <div class="benchrow"><span class="lbl">暫存</span><div class="bench" id="bench">${run.bench
      .map((o, i) =>
        o
          ? `<div class="bs s${ITEMI[o.id].star}${V.sel === o.u ? ' sel' : ''}" data-bu="${o.u}" data-bi="${i}"><img src="${itemIcon(o.id)}" alt="${ITEMI[o.id].n}">${shapeMini(o.id, o.r || 0)}${tierBadge(o.t)}</div>`
          : `<div class="bs emp" data-bi="${i}"></div>`
      )
      .join('')}</div></div>
    <div class="shop" id="shop">${run.shop
      .map((s, k) =>
        s
          ? `<button class="sc s${ITEMI[s.id].star}${V.sel === 'shop' + k ? ' sel' : ''}" data-act="shopSel" data-k="${k}" data-sk="${k}"><img src="${itemIcon(s.id)}" alt="">${tierBadge(s.t || 1)}${shapeMini(s.id)}<span>${ITEMI[s.id].n}</span><b class="${run.gold < shopPrice(run, s.id, s.t) ? 'c-bad' : ''}">${shopPrice(run, s.id, s.t)} 金</b></button>`
          : `<div class="sc sold">已買</div>`
      )
      .join('')}</div>
    <div class="acts"><button class="btn" data-act="reroll" ${run.gold < REROLL ? 'disabled' : ''}>刷新<small class="bnote">${REROLL} 金</small></button><button class="btn" data-act="lock" aria-pressed="${!!run.lock}">${run.lock ? '已鎖' : '鎖住'}<small class="bnote">商店</small></button><button class="btn" data-act="lvup" ${!lvNext || !lvOpen(run) || run.gold < lvNext.cost ? 'disabled' : ''}>${lvNext ? `背包 ${lvNext.w}×${lvNext.h}` : '背包最大'}<small class="bnote">${lvNext ? (lvOpen(run) ? lvNext.cost + ' 金' : lvNext.from + ' 開放') : ''}</small></button><button class="btn pri" data-act="fight">開戰<small class="bnote">輸了 -${r.loss}</small></button></div>
    ${detailHTML(run)}
  </div>`;
}
/* 點道具：說明、加成、操作 */
function detailHTML(run) {
  if (!V.sel) return '';
  let o,
    where,
    k = -1;
  if (V.sel.startsWith('shop')) {
    k = +V.sel.slice(4);
    const s = run.shop[k];
    if (!s) return '';
    o = { id: s.id, t: s.t || 1 };
    where = 'shop';
  } else {
    o = run.bag.items.find(q => q.u === V.sel);
    where = 'bag';
    if (!o) {
      o = run.bench.find(q => q && q.u === V.sel);
      where = 'bench';
    }
    if (!o) return '';
  }
  const I = ITEMI[o.id],
    mods = where === 'bag' ? bagMods(run.bag).get(o.u) || [] : [],
    tot = {};
  for (const x of mods) for (const k2 in x.m) tot[k2] = (tot[k2] || 0) + x.m[k2];
  const aff = o.a && AFFX.find(a => a.k === o.a),
    tags =
      I.tags
        .filter(t => t !== 'weapon')
        .map(t => TAGN[t])
        .join('・') || '道具';
  return `<div class="det" id="det"><div class="dh"><img src="${itemIcon(o.id)}" alt=""><div><b style="color:${STARC[I.star]}">${I.n}${tierTxt(o.t)}</b><small>${stars(I.star)}・${tags}・${shapeMini(o.id, o.r || 0)} ${shapeOf(o.id).length} 格${I.core ? '・一個背包最多 1 個' : ''}</small></div><button class="iconbtn" data-act="desel" aria-label="關閉">✕</button></div>
    <p>${itemDesc(o.id, o.t)}</p>${o.m ? mod5HTML(o.m) : ''}${o.m2 ? mod5HTML(o.m2) : ''}${aff ? `<p class="c-gold">升階詞綴：${aff.n}</p>` : ''}${Object.keys(tot).length ? `<p class="c-good">目前加成：${modTxt(tot)}</p>` : ''}
    <div class="btns">${
      where === 'shop'
        ? `<button class="btn pri" data-act="buy" data-k="${k}" ${run.gold < shopPrice(run, o.id, o.t) ? 'disabled' : ''}>買 ${shopPrice(run, o.id, o.t)} 金</button>`
        : `${where === 'bag' ? '<button class="btn" data-act="rot">旋轉</button><button class="btn" data-act="toBench">收回暫存</button>' : '<button class="btn" data-act="autoPlace">放進背包</button>'}<button class="btn" data-act="sell">賣 ${sellOf(o.id, o.t)} 金</button>`
    }</div></div>`;
}
/* 0.1.5 5★ 詞綴：數值越接近上限顏色越好，括號是這條詞綴的範圍 */
function mod5HTML(m) {
  const x = MOD5[m[0]],
    q = mod5Q(m);
  return `<p class="mod5 ${q >= 0.8 ? 'q3' : q >= 0.4 ? 'q2' : 'q1'}">✦ ${mod5Txt(m)}<small>（${x.lo}～${x.hi}）</small></p>`;
}
/* 剛拿到的 5★ 道具：開獎畫面（看過就標 mv） */
function revealHTML(run) {
  const o = [...run.bag.items, ...run.bench].find(q => q && ((q.m && !q.mv) || (q.m2 && !q.mv2)));
  if (!o) return '';
  const m = o.m2 && !o.mv2 && o.mv ? o.m2 : o.m,
    q = mod5Q(m);
  return `<div class="ovl"><div class="dlg2 reveal"><b>開出詞綴！</b><img src="${itemIcon(o.id)}" alt=""><b style="color:${STARC[ITEMI[o.id].star]}">${ITEMI[o.id].n}${tierTxt(o.t)}</b>${mod5HTML(m)}<p class="c-dim">${q >= 0.8 ? '極品！接近上限' : q >= 0.4 ? '還不錯' : '普普通通'}</p><button class="btn pri" data-act="seen5" data-k="${o.u}">收下</button></div></div>`;
}
/* 0.1.5 角色數值：整個背包算出來的戰鬥數值（跟戰鬥用的是同一份 compileBag） */
function statsHTML(run) {
  const F = compileBag(run.bag),
    red = Math.round((1 - 50 / (50 + F.arm)) * 100),
    dps = w => (((w.dmg[0] + w.dmg[1]) / 2) * (1 + (Math.min(100, w.crit) * (F.critMul - 100)) / 10000)) / w.cd,
    tot = F.weapons.reduce((a, w) => a + dps(w), 0),
    kv = (k, v) => `<span>${k}<b>${v}</b></span>`,
    fx = w =>
      [
        w.burn && `燃燒 ${w.burn}`,
        w.poison && `中毒 ${w.poison}`,
        w.freeze[0] && `凍結 ${w.freeze[0]}%`,
        w.stun[0] && `暈眩 ${w.stun[0]}%`,
        w.ls && `吸血 ${w.ls}%`
      ]
        .filter(Boolean)
        .join('・');
  const C = CLSI[run.bag.cls];
  return `<div class="stt">${C ? `<div class="sw"><img src="${artIconURL(C.ic) || iconURL('star')}" alt=""><span><b>職業：${C.n}</b><small>${clsDesc(C.id)}</small></span></div>` : ''}
    <div class="kv3">${kv('生命', F.hp)}${kv('護甲', `${F.arm}<small>減傷 ${red}%</small>`)}${kv('閃避', F.dodge + '%')}${kv('每秒回復', F.regen)}${kv('吸血', F.ls + '%')}${kv('暴擊傷害', F.critMul + '%')}</div>
    <h4>攻擊　<small>每秒約 ${tot.toFixed(1)} 傷害</small></h4>
    ${
      F.weapons
        .map(
          w =>
            `<div class="sw"><img src="${itemIcon(w.id)}" alt=""><span><b>${ITEMI[w.id].n}</b><small>${w.dmg[0]}～${w.dmg[1]}・每 ${w.cd.toFixed(2)} 秒・暴擊 ${Math.min(100, w.crit)}%${fx(w) ? '・' + fx(w) : ''}</small></span><b class="c-gold">${dps(w).toFixed(1)}</b></div>`
        )
        .join('') || '<p class="c-dim">還沒有武器或寵物</p>'
    }
    ${F.shields.length ? `<h4>格擋</h4>${F.shields.map(b => `<p>每 ${b.cd.toFixed(2)} 秒擋 ${b.block}${b.thorns ? `・反彈 ${b.thorns}` : ''}${b.heal ? `・回復 ${b.heal}` : ''}</p>`).join('')}` : ''}
    ${F.pots.length ? `<h4>藥水</h4>${F.pots.map(p => `<p>生命低於 ${p.at}% 時回復 ${p.v}（${p.n} 次）</p>`).join('')}` : ''}
  </div>`;
}
/* ================= 結算、三選一、一局結束 ================= */
function resultHTML(run) {
  const l = run.last;
  return `<div class="ovl"><div class="dlg2 ${l.win ? 'win' : 'lose'}"><b class="big">${l.win ? '勝利！' : '落敗'}</b><p>${esc(l.opp)}</p>${l.loss ? `<p class="c-bad">生命 -${l.loss}（剩 ${run.hp}）</p>` : ''}${l.hit ? `<p class="c-good">${l.ko ? '對手淘汰！' : `對手生命 -${l.hit}`}</p>` : ''}${l.gold ? `<p class="c-gold">+${l.gold} 金</p>` : ''}<button class="btn pri" data-act="afterRes">繼續</button></div></div>`;
}
function pickHTML(run) {
  const p = run.pend;
  return `<div class="ovl"><div class="dlg2"><b>${p.t}</b><div class="picks">${p.opts
    .map(
      id =>
        `<button class="pk s${ITEMI[id].star}" data-act="pick" data-k="${id}"><img src="${itemIcon(id)}" alt="">${shapeMini(id)}<span><b style="color:${STARC[ITEMI[id].star]}">${ITEMI[id].n}</b><small>${itemDesc(id)}</small></span></button>`
    )
    .join('')}</div></div></div>`;
}
/* 0.1.7 開局職業三選一（可以刷新一次） */
function clsHTML(run) {
  return `<div class="ovl"><div class="dlg2"><b>選擇職業</b><p class="c-dim">整局都有效，照職業去買道具</p><div class="picks">${run.clsOpts
    .map(
      id =>
        `<button class="pk cls" data-act="cls" data-k="${id}"><img src="${artIconURL(CLSI[id].ic) || iconURL('star')}" alt=""><span><b>${CLSI[id].n}</b><small>${clsDesc(id)}</small></span></button>`
    )
    .join(
      ''
    )}</div><button class="btn" data-act="clsRe" ${run.clsRe > 0 ? '' : 'disabled'}>${run.clsRe > 0 ? `刷新<small class="bnote">剩 ${run.clsRe} 次</small>` : '已經刷新過了'}</button></div></div>`;
}
/* 0.1.6 寄放中的戰利品（三選一時暫存區滿了） */
function holdHTML(run) {
  const o = run.hold;
  if (!o) return '';
  return `<div class="hold s${ITEMI[o.id].star}"><img src="${itemIcon(o.id)}" alt=""><span><b>戰利品：${ITEMI[o.id].n}</b><small>暫存區滿了，空出一格再領</small></span><button class="btn" data-act="claim">領取</button><button class="btn" data-act="sellHold">賣 ${sellOf(o.id, o.t)} 金</button></div>`;
}
/* 這一局打完牌階有沒有變：升級／降級／定級完成，或只是進度條往哪邊走 */
function rankMove(run) {
  if (!placed()) return `<p class="c-dim">定級賽 ${S.games}／${PLACE_N}</p>`;
  if (run.rk0 == null || run.rk0 < 0) return `<p class="c-gold">定級完成！</p>`;
  const i = rankOf(S.rating);
  if (i > run.rk0) return `<p class="c-good">升級！${rankName(run.rk0)} → ${rankName(i)}</p>`;
  if (i < run.rk0) return `<p class="c-bad">降級：${rankName(run.rk0)} → ${rankName(i)}</p>`;
  return `<p class="${run.delta >= 0 ? 'c-good' : 'c-bad'}">${run.delta >= 0 ? '▲ 進度往前' : '▼ 進度往後'}</p>`;
}
function endHTML(run) {
  const cs = Math.min(40, cellSize(run.bag.w));
  return `<div class="home"><div class="logo"><b class="pl p${run.place}">第 ${run.place} 名</b><small>${run.place === 1 ? '你是第一名！' : run.place === 2 ? '差一點點' : '下次再來'}</small></div>
    <div class="card endrk">${rankHTML(1)}${rankMove(run)}<small class="c-dim">打到 ${curRound(run) ? curRound(run).id : '最後'}</small></div>
    <h3>最後的背包</h3><div class="bagwrap">${bagHTML(run.bag, cs, { mini: 1, id: 'endbag' })}</div>
    <button class="btn pri big" data-act="again">再來一局</button><button class="btn" data-act="home">回首頁</button></div>`;
}
/* ================= 戰鬥播放 ================= */
/* 開戰：算好整場（固定亂數），照時間軸播 */
function beginFight() {
  const run = S.run,
    fb = startFight(run);
  if (!fb) {
    endRun(run, 1);
    save();
    return render();
  }
  run.fight = { opp: fb.opp, seed: h(run.seed, run.ri, 991) };
  run.phase = 'battle';
  save();
  B = {
    fb,
    t: 0,
    i: 0,
    hp: [fb.me.hp, fb.opp.F.hp],
    max: fb.res.max,
    block: [0, 0],
    done: false,
    last: performance.now()
  };
  audioOn();
  snd('encounter');
  renderBattle();
}
/* 重新整理後回到戰鬥：用存下的對手與種子重算（結果一樣） */
function resumeFight() {
  const run = S.run,
    f = run.fight,
    me = compileBag(run.bag),
    res = simulate(me, f.opp.F, f.seed);
  B = {
    fb: { r: curRound(run), opp: f.opp, me, res },
    t: 0,
    i: 0,
    hp: [me.hp, f.opp.F.hp],
    max: res.max,
    block: [0, 0],
    done: false,
    last: performance.now()
  };
}
function renderBattle() {
  if (!B) resumeFight();
  const { fb } = B,
    run = S.run,
    cs = Math.min(30, fl(cellSize(run.bag.w) * 0.6)),
    ob = fb.opp.bag;
  $('app').innerHTML = `<div class="bt">
    <div class="btop"><small>${fb.r.id}・${RTYPE[fb.r.type]}</small><b id="btime">0.0 秒</b></div>
    <div class="arena"><div class="fr">${sprCv('a_' + S.av, 'big')}<b>${esc(S.name)}</b><i class="hpb big"><i id="hp0"></i><em id="hpt0"></em></i><div class="sts" id="sts0"></div></div>
    <div class="vs">VS</div>
    <div class="fr">${sprCv(fb.opp.spr, 'big flip')}<b>${esc(fb.opp.n)}</b><i class="hpb big"><i id="hp1"></i><em id="hpt1"></em></i><div class="sts" id="sts1"></div></div>
    <div class="fx" id="fx"></div></div>
    <div class="bbags"><div><small>你的背包</small>${bagHTML(run.bag, cs, { mini: 1, id: 'bb0' })}</div>${ob ? `<div><small>對手的背包</small>${bagHTML(ob, Math.min(cs, 26), { mini: 1, id: 'bb1' })}</div>` : ''}</div>
    <div class="bctl"><button class="btn" data-act="spd">×${S.speed || 1}</button><button class="btn" data-act="skip">跳過</button></div>
  </div>`;
  paintSprites();
  bShow();
  clearInterval(renderBattle.iv);
  renderBattle.iv = setInterval(bTick, 33);
}
function bShow() {
  for (let i = 0; i < 2; i++) {
    const el = $('hp' + i);
    if (!el) return;
    el.style.width = Math.max(0, (B.hp[i] / B.max[i]) * 100) + '%';
    $('hpt' + i).textContent = `${Math.max(0, B.hp[i])}${B.block[i] > 0 ? `　盾 ${B.block[i]}` : ''}`;
  }
  $('btime').textContent = B.t.toFixed(1) + ' 秒' + (B.t >= FATIGUE_T ? '・疲勞' : '');
}
/* 0.1.6 冷卻條：照時間軸，每件武器／盾在兩次出手之間格子由下往上填滿；被封鎖的變暗。
   B.cdt[邊][u] = 出手時間；B.seal[邊][u] = 封鎖到幾秒 */
function cdTimeline(ev) {
  const t = [{}, {}],
    seal = [{}, {}];
  for (const e of ev) {
    if (e.u && (e.k === 'hit' || e.k === 'crit' || e.k === 'miss' || e.k === 'block'))
      (t[e.s][e.u] = t[e.s][e.u] || []).push(e.t);
    if (e.k === 'seal') seal[1 - e.s][e.tu] = e.v;
  }
  return { t, seal };
}
function bCd() {
  if (!B.cdt) B.cdt = cdTimeline(B.fb.res.ev);
  for (let s = 0; s < 2; s++) {
    const root = $('bb' + s);
    if (!root) continue;
    for (const [u, ts] of Object.entries(B.cdt.t[s])) {
      const el = root.querySelector(`.it[data-u="${u}"]`);
      if (!el) continue;
      let k = 0;
      while (k < ts.length && ts[k] <= B.t) k++;
      const a = k ? ts[k - 1] : 0,
        b = ts[k];
      el.style.setProperty('--cd', b == null ? 0 : Math.min(1, (B.t - a) / Math.max(0.05, b - a)).toFixed(3));
    }
    for (const [u, v] of Object.entries(B.cdt.seal[s])) {
      const el = root.querySelector(`.it[data-u="${u}"]`);
      if (el) el.classList.toggle('sealed', B.t < v);
    }
  }
}
/* 0.1.9 戰鬥中角色身上的異常（照時間軸最後一筆事件的狀態）：圖示＋層數 */
const STN = {
    burn: '燃燒',
    poison: '中毒',
    bleed: '流血',
    sunder: '破甲',
    frozen: '凍結',
    stun: '暈眩',
    weak: '虛弱',
    blind: '致盲'
  },
  STI = [
    ['burn', 'ail_burn', 1],
    ['poison', 'ail_poison', 1],
    ['bleed', 'ail_bleed', 1],
    ['sunder', 'ail_vul', 1],
    ['frozen', 'ail_frozen', 0],
    ['stun', 'ail_stun', 0],
    ['weak', 'ail_curse', 0],
    ['blind', 'ail_mark', 0]
  ];
function bSts() {
  if (!B.st) return;
  for (let s = 0; s < 2; s++) {
    const el = $('sts' + s),
      key = B.st[s].join(',');
    if (!el || el.dataset.k === key) continue;
    el.dataset.k = key;
    el.innerHTML = STI.map(([k, ic, n], i) =>
      B.st[s][i] > 0
        ? `<span title="${STN[k]}"><img src="${artIconURL(ic) || iconURL('star')}" alt="${STN[k]}">${n ? `<b>${B.st[s][i]}</b>` : ''}</span>`
        : ''
    ).join('');
  }
}
const ELC = {
  fire: '#ff9a5a',
  cold: '#8fd8ff',
  light: '#fff27a',
  poison: '#9be36b',
  dark: '#c58cff',
  phys: '#ffffff',
  bleed: '#ff5a5a',
  burn: '#ff9a5a',
  sunder: '#ffb15a',
  frozen: '#8fd8ff',
  weak: '#c58cff',
  blind: '#fff27a'
};
function bPop(side, txt, col, big) {
  const fx = $('fx');
  if (!fx) return;
  const s = document.createElement('span');
  s.className = 'pop' + (big ? ' big' : '');
  s.textContent = txt;
  s.style.color = col;
  s.style.left = (side ? 75 : 25) + (Math.random() * 16 - 8) + '%';
  s.style.top = 25 + Math.random() * 25 + '%';
  fx.appendChild(s);
  setTimeout(() => s.remove(), 900);
}
function bFlash(side, u) {
  if (!u) return;
  const el = document.querySelector(`#bb${side} .it[data-u="${u}"]`);
  if (!el) return;
  el.classList.remove('act');
  void el.offsetWidth;
  el.classList.add('act');
}
function bTick() {
  if (!B || B.done) return;
  const n = performance.now(),
    dt = Math.min(0.2, (n - B.last) / 1000);
  B.last = n;
  B.t += dt * (S.speed || 1);
  const ev = B.fb.res.ev;
  let k = 0;
  while (B.i < ev.length && ev[B.i].t <= B.t) {
    const e = ev[B.i++],
      tg = e.self ? e.s : 1 - e.s;
    B.hp = e.hp;
    if (e.st) B.st = e.st;
    if ((e.k === 'hit' || e.k === 'crit') && e.ab) B.block[tg] = Math.max(0, B.block[tg] - e.ab);
    if (e.k === 'block') B.block[e.s] += e.v;
    if (k++ > 6) continue;
    if (e.k === 'hit' || e.k === 'crit') {
      bPop(
        tg,
        (e.k === 'crit' ? '暴擊 ' : '') + e.v + (e.ab ? `（擋 ${e.ab}）` : ''),
        ELC[e.el] || '#fff',
        e.k === 'crit'
      );
      bFlash(e.s, e.u);
      if (k < 2) snd(e.k === 'crit' ? 'crit' : 'hit');
    } else if (e.k === 'miss') bPop(tg, '閃避', '#b3a9bd');
    else if (e.k === 'dot') bPop(tg, e.v, ELC[e.el]);
    else if (e.k === 'fatigue') bPop(tg, '疲勞 ' + e.v, '#ff6a3a');
    else if (e.k === 'heal' && !e.regen) bPop(e.s, '+' + e.v, '#7bd36b');
    else if (e.k === 'pot') {
      bPop(e.s, '藥水 +' + e.v, '#7bd36b', 1);
      bFlash(e.s, e.u);
    } else if (e.k === 'block') bFlash(e.s, e.u);
    else if (e.k === 'stun') bPop(tg, '暈眩', '#ffe27a');
    else if (e.k === 'freeze') bPop(tg, '凍結', '#8fd8ff');
    else if (e.k === 'thorns') bPop(tg, '反彈 ' + e.v, '#ffb15a');
    else if (e.k === 'weak') bPop(tg, '虛弱', '#c58cff');
    else if (e.k === 'blind') bPop(tg, '致盲', '#fff27a');
    else if (e.k === 'throw') {
      bPop(tg, `${STN[e.x] || ''} ${e.v}`, ELC[e.x] || '#ffd27a', 1);
      bFlash(e.s, e.u);
    } else if (e.k === 'seal') {
      bPop(tg, `封鎖 ${e.v} 秒`, '#c58cff', 1);
      bFlash(e.s, e.u);
    } else if (e.k === 'down') {
      bPop(tg, '降階！', '#ff8a8a', 1);
      bFlash(e.s, e.u);
    }
  }
  bShow();
  bSts();
  bCd();
  if (B.i >= ev.length && B.t >= B.fb.res.t + 0.6) bEnd();
}
/* 播完（或跳過）：結算 */
function bEnd() {
  if (!B || B.done) return;
  B.done = true;
  clearInterval(renderBattle.iv);
  const run = S.run,
    out = finishFight(run, B.fb);
  snd(out.win ? 'win' : 'lose');
  run.last = {
    win: out.win,
    loss: out.loss,
    gold: out.gold,
    hit: out.hit,
    ko: out.ko,
    opp: (out.win ? '打贏了 ' : '輸給了 ') + B.fb.opp.n
  };
  run.after = run.phase === 'end' ? 'end' : run.pend ? 'pick' : 'next';
  run.fight = null;
  run.phase = 'result';
  B = null;
  if (S.tut === 2) S.tut = 3;
  save();
  render();
}
/* ================= 圖鑑、說明、設定 ================= */
function codexHTML() {
  return `<div class="page"><div class="ptop"><button class="iconbtn" data-act="home" aria-label="返回">‹</button><b>道具圖鑑</b><small>${ITEMS.length} 種・拿過的會亮起來</small></div>${[
    1, 2, 3, 4, 5
  ]
    .map(
      st =>
        `<h3 style="color:${STARC[st]}">${stars(st)}</h3><div class="codex">${ITEMS.filter(
          i => i.star === st && !i.core
        )
          .map(
            i =>
              `<div class="cx s${st}${S.seen[i.id] ? '' : ' unseen'}"><img src="${itemIcon(i.id)}" alt=""><div><b>${i.n}</b><small>${i.tags
                .filter(t => t !== 'weapon')
                .map(t => TAGN[t])
                .join('・')}・${shapeOf(i.id).length} 格</small><p>${itemDesc(i.id)}</p></div></div>`
          )
          .join('')}</div>`
    )
    .join('')}<h3>職業核心（首領 2-5 從你的職業池三選一）</h3>${CLASSES.map(
    C =>
      `<details class="more"><summary>${C.n}（${ITEMS.filter(i => i.cls === C.id).length}）</summary><div class="cores">${ITEMS.filter(
        i => i.cls === C.id
      )
        .map(i => `<p><b>${i.n.split('・')[1]}</b>　${itemDesc(i.id)}</p>`)
        .join('')}</div></details>`
  ).join('')}</div>`;
}
function helpHTML() {
  return `<div class="page"><div class="ptop"><button class="iconbtn" data-act="${S.run && S.run.phase !== 'end' ? 'play' : 'home'}" aria-label="返回">‹</button><b>怎麼玩</b></div>
  <div class="card"><b>一局</b><p>4 位玩家一場，每人 ${START_HP} 點生命。每回合在商店買道具、擺進背包，然後自動戰鬥。輸了扣生命，歸零就淘汰；最後活下來的是第 1 名。</p></div>
  <div class="card"><b>職業</b><p>每局開打前三選一（可以刷新一次），整局都有效：例如弓箭手讓弓、弩傷害 +20%、攻速 +15%。照職業去買武器和輔助道具（箭袋、劍鞘、法術書、火藥桶、肉骨頭…），輔助道具要擺在武器旁邊或同一排才有用，背包空間要取捨。點左上角頭像可以看職業與數值。</p></div>
  <div class="card"><b>回合</b><p>開局有 ${START_GOLD} 金、商店 5 件 1★，買好擺好就開打：1-1～1-3 野怪 → 1-4 菁英（打完三選一）→ 第 2 階段對戰與野怪穿插：2-1 對戰、2-2 群體野怪、2-3 對戰、2-4 菁英、2-5 首領（打完職業核心三選一）→ 第 3 階段起以對戰為主，每階段第 4 輪是菁英（戰利品越後面越高星）。每一輪開始都能逛商店。畫面上方的回合列看得到這一階段每一輪是什麼。越後面輸一場扣越多。</p></div>
  <div class="card"><b>金幣</b><p>每回合 ${BASE_INCOME} 金＋利息（每 10 金 +1，最多 +${INTEREST_MAX}）＋連勝或連敗獎勵。刷新商店 ${REROLL} 金，鎖住的商店下回合不換。</p></div>
  <div class="card"><b>背包</b><p>從 3×3 開始，花金幣升級（最大 6×7，每一級從固定的回合起才開放，例如 3×4 要 1-3、4×4 要 2-1），背包越大商店越容易出高星道具。道具有形狀，點一下可以旋轉；商店的道具可以直接拖進背包，拖到別的道具上會交換位置（放得下的話），拖回暫存區收起來，拖到商店區直接賣掉。</p></div>
  <div class="card"><b>合成</b><p>3 件相同、同一階的道具（背包＋暫存區都算）會自動合成高一階，最多 Ⅲ 階，數值大幅提升，還會多一條詞綴。</p></div>
  <div class="card"><b>相鄰效果</b><p>飾品會加強「相鄰」（上下左右）、「同一排」或「所有」特定種類的道具。點一下道具，被它加強的道具會亮起來，有吃到加成的道具右上角有「＋」。</p></div>
  <div class="card"><b>職業核心</b><p>首領（2-5）掉落的 5★ 道具，一個背包只能放 1 個，決定這局的流派（劍聖、獵手、元素使、死靈師…）。</p></div>
  <div class="card"><b>戰鬥</b><p>完全自動：每件武器照自己的冷卻出手，盾定時格擋，藥水在生命低的時候喝。${FATIGUE_T} 秒後進入疲勞，雙方受到的傷害越來越高，一定分出勝負。</p></div>
  <div class="card"><b>對手</b><p>對戰的對手是其他玩家在同一回合留下的背包快照，不用等人上線。沒有真人時由機器人補位。</p></div></div>`;
}
function settingsHTML() {
  const anon = typeof CLOUD === 'undefined' || CLOUD.anon;
  return `<div class="page"><div class="ptop"><button class="iconbtn" data-act="home" aria-label="返回">‹</button><b>設定</b></div>
  <h3>名字</h3><div class="card row"><input class="inp" id="nameInp" maxlength="10" value="${esc(S.name)}"><button class="btn" data-act="setName">儲存</button></div>
  <h3>頭像</h3><div class="avs">${AVATARS.map(([k, n]) => `<button class="av${S.av === k ? ' on' : ''}" data-act="setAv" data-k="${k}" aria-label="${n}">${sprCv('a_' + k)}<small>${n}</small></button>`).join('')}</div>
  <h3>外觀</h3><div class="seg3">${[
    ['light', '淺色'],
    ['dark', '深色'],
    ['auto', '跟隨系統']
  ]
    .map(
      ([k, n]) =>
        `<button class="btn" data-act="theme" data-k="${k}" aria-pressed="${(S.theme || 'dark') === k}">${n}</button>`
    )
    .join('')}</div>
  <h3>聲音</h3><button class="btn" data-act="tog" data-k="sfx" aria-pressed="${S.sfx}">音效 ${S.sfx ? '開' : '關'}</button>
  <h3>帳號</h3><div class="card"><p class="sub">${typeof CLOUD !== 'undefined' ? esc(CLOUD.status) : ''}${anon ? '・目前是遊客，存檔綁在這台裝置' : '・' + esc(CLOUD.email || '')}</p>${
    anon
      ? `<input class="inp" id="authEmail" type="email" placeholder="信箱" autocomplete="email"><input class="inp" id="authPw" type="password" placeholder="密碼（至少 6 個字）" autocomplete="current-password"><div class="g2"><button class="btn pri" data-act="register">註冊</button><button class="btn" data-act="login">登入</button></div><p class="sub" id="authMsg"></p>`
      : '<button class="btn" data-act="logout">登出</button>'
  }</div>
  <h3>新手教學</h3><button class="btn" data-act="tutReset">重看新手提示</button>
  <p class="sub ver">塞令老師 v${VER}${GHOST.off ? '・快照對戰離線（用機器人對手）' : ''}</p></div>`;
}
/* ================= 動作 ================= */
function audioOn() {
  if (typeof audioInit === 'function') audioInit();
}
const A = {
  go: d => go(d.k),
  home: () => go('home'),
  play: () => {
    audioOn();
    if (S.run) {
      V.scr = 'run';
      render();
    } else startRun();
  },
  again: () => {
    S.run = null;
    startRun();
  },
  menu: () => {
    const run = S.run;
    showDlg('選單', `<p class="sub">${curRound(run).id}・生命 ${run.hp}・${run.gold} 金</p>`, [
      ['回首頁（這局會保留）', () => go('home')],
      ['怎麼玩', () => go('help')],
      [
        '投降',
        () => {
          endRun(run, Math.max(2, 1 + aliveRivals(run).length));
          save();
          render();
        }
      ]
    ]);
  },
  shopSel: d => {
    V.sel = V.sel === 'shop' + d.k ? null : 'shop' + d.k;
    snd('tap');
    render();
  },
  buy: d => {
    const run = S.run,
      res = buyItem(run, +d.k);
    if (typeof res === 'string') return snd('nope'), toast(res);
    snd('coin');
    V.sel = null;
    run.bench.forEach(o => o && (S.seen[o.id] = 1));
    if (res.merged.length) toast(`合成！${res.merged.map(o => ITEMI[o.id].n + tierTxt(o.t)).join('、')}`);
    if (S.tut === 0) S.tut = 1;
    save();
    render();
  },
  stats: () => showDlg('角色數值', statsHTML(S.run), []),
  seen5: d => {
    const o = [...S.run.bag.items, ...S.run.bench].find(q => q && q.u === d.k);
    if (o) {
      if (o.m && !o.mv) o.mv = 1;
      else o.mv2 = 1;
    }
    save();
    render();
  },
  desel: () => {
    V.sel = null;
    render();
  },
  reroll: () => {
    const e = rerollShop(S.run);
    if (e) return toast(e);
    snd('coin');
    V.sel = null;
    save();
    render();
  },
  lock: () => {
    S.run.lock = !S.run.lock;
    snd('tap');
    save();
    render();
  },
  lvup: () => {
    const e = levelUp(S.run);
    if (e) return toast(e);
    snd('level');
    toast(`背包變成 ${S.run.bag.w}×${S.run.bag.h}`);
    save();
    render();
  },
  fight: () => {
    const run = S.run,
      r = curRound(run);
    V.sel = null;
    if (run.hold) return snd('nope'), toast('先領取或賣掉寄放的戰利品');
    if (!run.bag.items.some(o => ITEMI[o.id].dmg)) return toast('背包裡還沒有武器或寵物，打不贏的！');
    beginFight();
  },
  afterRes: () => {
    const run = S.run;
    if (run.after === 'end') run.phase = 'end';
    else if (run.after === 'pick') run.phase = 'pick';
    else nextRound(run);
    save();
    render();
  },
  cls: d => {
    const run = S.run;
    if (run.phase !== 'cls') return;
    run.bag.cls = d.k;
    run.phase = 'prep';
    /* 0.1.8 送一件對應職業的 1★ 起手道具（放進暫存區） */
    const g = giveStarter(run);
    snd('level');
    toast(`職業：${CLSI[d.k].n}${g ? `，送你一件${ITEMI[g].n}` : ''}`);
    save();
    render();
  },
  clsRe: () => {
    const run = S.run;
    if (run.phase !== 'cls' || run.clsRe <= 0) return;
    run.clsRe--;
    const old = run.clsOpts;
    let n = rollClasses(run);
    for (let g = 0; g < 8 && n.some(id => old.includes(id)); g++) n = rollClasses(run);
    run.clsOpts = n;
    snd('tap');
    save();
    render();
  },
  claim: () => {
    const e = claimHold(S.run);
    if (e) return snd('nope'), toast(e);
    snd('select');
    save();
    render();
  },
  sellHold: () => {
    const run = S.run;
    if (!run.hold) return;
    const v = sellOf(run.hold.id, run.hold.t);
    run.gold += v;
    run.hold = null;
    snd('coin');
    toast(`賣了 ${v} 金`);
    save();
    render();
  },
  pick: d => {
    const run = S.run,
      e = takePick(run, d.k, true);
    if (e) return toast(e);
    if (run.hold) toast('暫存區滿了：戰利品先寄放，空出一格再領');
    S.seen[d.k] = 1;
    snd('level');
    nextRound(run);
    save();
    render();
  },
  rot: () => {
    const run = S.run,
      o = run.bag.items.find(q => q.u === V.sel);
    if (!o) return;
    for (let i = 1; i <= 3; i++) {
      const r = (o.r + i) & 3;
      if (canPlace(run.bag, o, o.x, o.y, r)) {
        o.r = r;
        snd('tap');
        save();
        return render();
      }
    }
    toast('旋轉後放不下，先把它挪到空一點的地方');
  },
  toBench: () => {
    const run = S.run,
      o = run.bag.items.find(q => q.u === V.sel),
      fi = benchFree(run);
    if (!o) return;
    if (fi < 0) return toast('暫存區滿了');
    run.bag.items = run.bag.items.filter(q => q !== o);
    run.bench[fi] = o;
    V.sel = null;
    save();
    render();
  },
  autoPlace: () => {
    const run = S.run,
      i = run.bench.findIndex(q => q && q.u === V.sel);
    if (i < 0) return;
    const o = run.bench[i],
      sp = findSpot(run.bag, o);
    if (!sp)
      return toast(
        ITEMI[o.id].core && run.bag.items.some(q => ITEMI[q.id].core)
          ? '一個背包只能放 1 個職業核心'
          : '背包放不下了，升級背包或騰出空間'
      );
    placeFromBench(run, i, sp.x, sp.y, sp.r);
  },
  sell: () => {
    const v = sellItem(S.run, V.sel);
    if (!v) return;
    snd('coin');
    toast(`賣了 ${v} 金`);
    V.sel = null;
    save();
    render();
  },
  spd: () => {
    S.speed = { 1: 2, 2: 4, 4: 1 }[S.speed || 1];
    save();
    const b = document.querySelector('[data-act="spd"]');
    if (b) b.textContent = '×' + S.speed;
  },
  skip: () => {
    if (!B) return;
    B.i = B.fb.res.ev.length;
    B.t = B.fb.res.t + 1;
    B.hp = B.fb.res.end;
    bShow();
    bEnd();
  },
  setName: () => {
    const v = ($('nameInp').value || '').trim().slice(0, 10);
    if (!v) return toast('名字不能是空的');
    S.name = v;
    save();
    toast('已儲存');
    render();
  },
  setAv: d => {
    S.av = d.k;
    save();
    render();
  },
  theme: d => {
    S.theme = d.k;
    S.themeSet = true;
    save();
    render();
  },
  themeTog: () => {
    S.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    S.themeSet = true;
    save();
    render();
  },
  tog: d => {
    S[d.k] = !S[d.k];
    save();
    render();
  },
  tutReset: () => {
    S.tut = 0;
    save();
    toast('下一局會再顯示提示');
  },
  register: () => authDo(authRegister),
  login: () => authDo(authLogin),
  logout: async () => {
    try {
      await authLogout();
      toast('已登出');
    } catch (e) {
      toast(e.message);
    }
    render();
  }
};
async function authDo(f) {
  const em = $('authEmail').value.trim(),
    pw = $('authPw').value;
  if (!em || pw.length < 6) return ($('authMsg').textContent = '請輸入信箱與至少 6 個字的密碼');
  $('authMsg').textContent = '處理中…';
  try {
    const r = await f(em, pw);
    toast(r === 'confirm' ? '確認信已寄出，點信裡的連結完成註冊' : r === 'loaded' ? '已載入這個帳號的存檔' : '完成');
  } catch (e) {
    $('authMsg').textContent = e.message;
    return;
  }
  render();
}
/* 簡單的對話框：buttons [[文字, 動作]] */
function showDlg(title, body, buttons) {
  const m = $('modal');
  m.innerHTML = `<div class="dlg2"><b>${title}</b>${body}<div class="btns col">${buttons.map(([t], i) => `<button class="btn" data-mi="${i}">${t}</button>`).join('')}<button class="btn" data-mi="x">關閉</button></div></div>`;
  m.hidden = false;
  m.onclick = ev => {
    const b = ev.target.closest('[data-mi]');
    if (!b && ev.target !== m) return;
    m.hidden = true;
    if (b && b.dataset.mi !== 'x') buttons[+b.dataset.mi][1]();
  };
}
document.addEventListener('click', ev => {
  if (V.noClick) return;
  const el = ev.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const f = A[el.dataset.act];
  if (f) f(el.dataset);
});
/* ================= 拖曳擺放 ================= */
function placeFromBench(run, i, x, y, r) {
  const o = run.bench[i];
  Object.assign(o, { x, y, r });
  run.bench[i] = null;
  run.bag.items.push(o);
  snd('select');
  if (S.tut === 1) S.tut = 2;
  V.sel = null;
  save();
  render();
}
/* 手指底下是背包的哪一格 */
function cellAt(px, py) {
  const el = $('bag');
  if (!el) return null;
  const rc = el.getBoundingClientRect(),
    cs = parseFloat(el.style.getPropertyValue('--cs')),
    st = cs + GAP;
  if (px < rc.left - st / 2 || py < rc.top - st / 2 || px > rc.right + st / 2 || py > rc.bottom + st / 2) return null;
  return [fl((px - rc.left + GAP / 2) / st), fl((py - rc.top + GAP / 2) / st)];
}
const inside = (el, px, py) => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return px >= r.left && px <= r.right && py >= r.top && py <= r.bottom;
};
document.addEventListener('pointerdown', ev => {
  if (!S || !S.run || S.run.phase !== 'prep' || V.scr !== 'run') return;
  const c = ev.target.closest('.prep .bag:not(.mini) .c, .bench .bs[data-bu], .shop .sc[data-sk]');
  if (!c) return;
  const run = S.run;
  let o, from, grab, sk;
  if (c.dataset.sk != null) {
    /* 0.1.1 商店的道具也能直接拖 */
    from = 'shop';
    sk = +c.dataset.sk;
    o = { u: 'shop' + sk, id: run.shop[sk].id, t: run.shop[sk].t || 1, r: 0, x: 0, y: 0 };
    grab = shapeOf(o.id, 0)[0];
  } else if (c.dataset.bu) {
    from = 'bench';
    o = run.bench[+c.dataset.bi];
    grab = shapeOf(o.id, o.r)[0];
  } else {
    from = 'bag';
    o = run.bag.items.find(q => q.u === c.dataset.u);
    grab = [+c.dataset.cx - o.x, +c.dataset.cy - o.y];
  }
  V.drag = { o, from, grab, sk, sx: ev.clientX, sy: ev.clientY, on: false, el: null };
});
document.addEventListener(
  'pointermove',
  ev => {
    const d = V.drag;
    if (!d) return;
    if (!d.on && Math.hypot(ev.clientX - d.sx, ev.clientY - d.sy) < 8) return;
    ev.preventDefault();
    if (!d.on) {
      d.on = true;
      const bag = $('bag');
      d.cs = bag ? parseFloat(bag.style.getPropertyValue('--cs')) : 44;
      d.el = document.createElement('div');
      d.el.className = 'ghost s' + ITEMI[d.o.id].star;
      document.body.appendChild(d.el);
      document
        .querySelectorAll(`.it[data-u="${d.o.u}"], .bs[data-bu="${d.o.u}"]`)
        .forEach(e => e.classList.add('lift'));
    }
    const c = cellAt(ev.clientX, ev.clientY);
    d.r = d.o.r;
    d.g = d.grab;
    d.tgt = c ? [c[0] - d.grab[0], c[1] - d.grab[1]] : null;
    d.ok = !!d.tgt && canPlace(S.run.bag, d.o, d.tgt[0], d.tgt[1], d.o.r);
    /* 0.1.5 從暫存區或商店拖進來放不下時，自動換個方向（手指底下那格還是道具的一部分），不動背包裡原本的道具 */
    if (!d.ok && c && d.from !== 'bag') {
      const f = autoFit(S.run.bag, d.o, c);
      if (f) {
        d.r = f.r;
        d.g = [c[0] - f.x, c[1] - f.y];
        d.tgt = [f.x, f.y];
        d.ok = true;
      }
    }
    drawGhost(d);
    const st = d.cs + GAP;
    d.el.style.left = ev.clientX - d.g[0] * st - d.cs / 2 + 'px';
    d.el.style.top = ev.clientY - d.g[1] * st - d.cs / 2 + 'px';
    /* 放不下但剛好擋到一件、而且換得過去：可以交換 */
    d.swap = !d.ok && d.tgt ? swapPlan(S.run, d.o, d.tgt[0], d.tgt[1], d.from) : null;
    d.el.classList.toggle('bad', !!d.tgt && !d.ok && !d.swap);
    d.el.classList.toggle('good', !!d.ok);
    d.el.classList.toggle('swap', !!d.swap);
    const sh = $('shop');
    if (sh) sh.classList.toggle('sellhot', d.from !== 'shop' && inside(sh, ev.clientX, ev.clientY));
  },
  { passive: false }
);
/* 拖曳中的影子：方向或抓的位置變了才重畫 */
function drawGhost(d) {
  const key = d.r + '|' + d.g;
  if (d.shown === key) return;
  d.shown = key;
  const cs = d.cs;
  d.el.innerHTML =
    shapeOf(d.o.id, d.r)
      .map(([x, y]) => `<i style="left:${x * (cs + GAP)}px;top:${y * (cs + GAP)}px;width:${cs}px;height:${cs}px"></i>`)
      .join('') +
    `<img src="${itemIcon(d.o.id)}" style="width:${cs * 0.8}px;left:${d.g[0] * (cs + GAP) + cs * 0.1}px;top:${d.g[1] * (cs + GAP) + cs * 0.1}px" alt="">`;
}
/* 找一個放得下的方向：先試原本的方向、再轉 90°／180°／270°；手指底下 c 那格要是道具的一格 */
function autoFit(bag, o, c) {
  for (let i = 0; i < 4; i++) {
    const r = (o.r + i) & 3;
    for (const [gx, gy] of shapeOf(o.id, r))
      if (canPlace(bag, o, c[0] - gx, c[1] - gy, r)) return { r, x: c[0] - gx, y: c[1] - gy };
  }
  return null;
}
function dropEnd(ev) {
  const d = V.drag;
  if (!d) return;
  V.drag = null;
  if (d.el) d.el.remove();
  const run = S.run;
  /* 商店的卡片點一下交給 click（看說明） */
  if (d.from === 'shop' && !d.on) return;
  if (d.from === 'shop') return dropShop(run, d, ev);
  if (!d.on) {
    /* 點一下：選取看說明 */
    V.sel = V.sel === d.o.u ? null : d.o.u;
    snd('tap');
    return render();
  }
  if (d.ok) {
    if (d.from === 'bench') return placeFromBench(run, run.bench.indexOf(d.o), d.tgt[0], d.tgt[1], d.r);
    d.o.x = d.tgt[0];
    d.o.y = d.tgt[1];
    snd('select');
  } else if (d.swap) {
    /* 交換位置：背包裡互換，或暫存區的換進來、背包那件收進暫存區 */
    const { B } = d.swap;
    if (d.from === 'bag') {
      Object.assign(B, { x: d.swap.x, y: d.swap.y, r: d.swap.r });
      Object.assign(d.o, { x: d.tgt[0], y: d.tgt[1] });
    } else {
      const i = run.bench.indexOf(d.o);
      run.bag.items = run.bag.items.filter(q => q !== B);
      run.bench[i] = B;
      Object.assign(d.o, { x: d.tgt[0], y: d.tgt[1] });
      run.bag.items.push(d.o);
    }
    snd('select');
  } else if (inside($('shop'), ev.clientX, ev.clientY)) {
    const v = sellItem(run, d.o.u);
    snd('coin');
    toast(`賣了 ${v} 金`);
  } else if (d.from === 'bag' && inside($('bench'), ev.clientX, ev.clientY) && benchFree(run) >= 0) {
    run.bag.items = run.bag.items.filter(q => q !== d.o);
    run.bench[benchFree(run)] = d.o;
  } else if (d.tgt && !d.ok) {
    snd('nope');
    toast(
      ITEMI[d.o.id].core && run.bag.items.some(q => q !== d.o && ITEMI[q.id].core)
        ? '一個背包只能放 1 個職業核心'
        : '這裡放不下'
    );
  }
  V.sel = null;
  save();
  render();
}
/* 從商店拖出來：放進背包（買下）、放到暫存區（買下），其他地方不算 */
function dropShop(run, d, ev) {
  V.noClick = true;
  setTimeout(() => (V.noClick = false), 50);
  let res = null;
  if (d.ok || (d.swap && d.swap.toBench))
    res = buyToBag(run, d.sk, d.tgt[0], d.tgt[1], d.ok ? d.r : d.o.r, d.swap && d.swap.B);
  else if (
    inside($('bench'), ev.clientX, ev.clientY) ||
    (d.tgt && run.shop[d.sk] && wouldMerge(run, run.shop[d.sk].id, run.shop[d.sk].t || 1))
  )
    res = buyItem(run, d.sk);
  else if (d.tgt) {
    snd('nope');
    toast('這裡放不下');
  }
  if (typeof res === 'string') {
    snd('nope');
    toast(res);
  } else if (res) {
    snd('coin');
    run.bench.forEach(o => o && (S.seen[o.id] = 1));
    run.bag.items.forEach(o => (S.seen[o.id] = 1));
    if (res.merged.length) toast(`合成！${res.merged.map(o => ITEMI[o.id].n + tierTxt(o.t)).join('、')}`);
    if (S.tut < 2) S.tut = 2;
  }
  V.sel = null;
  save();
  render();
}
document.addEventListener('pointerup', dropEnd);
document.addEventListener('pointercancel', () => {
  if (V.drag && V.drag.el) V.drag.el.remove();
  V.drag = null;
  render();
});
/* 手機叫出鍵盤也會觸發 resize：正在打字時不要重畫（不然輸入框會被換掉、鍵盤一直收起來） */
window.addEventListener('resize', () => {
  if (!B && !V.drag && !typing()) render();
});
