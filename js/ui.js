/* 塞令老師 · 畫面：首頁、準備（背包、暫存區、商店）、戰鬥播放、結算、三選一、百科、說明、設定；拖曳擺放 */
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
  const own = artIconURL('it_' + id),
    u = own || borrowIcon(id);
  if (!u) return iconURL('star');
  /* 0.1.29 有專屬圖示但大圖還沒載好：先借舊圖，不要記住（不然載好之後一直是舊圖） */
  if (own || typeof ART === 'undefined' || !ART['it_' + id]) ICU.set(id, u);
  return u;
}
/* 頭像：PNG 怪物圖畫到 canvas（render 後統一畫） */
const sprCv = (name, cls = '') => `<canvas class="spr ${cls}" data-spr="${name}" width="18" height="18"></canvas>`;
function paintSprites(root = document) {
  root.querySelectorAll('canvas[data-spr]').forEach(cv => {
    const sp = artSprite(cv.dataset.spr);
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
    if (!V.drag && !B && !typing() && !V.authBusy) render();
    else paintSprites();
  }, 80);
}
const stars = n => '★'.repeat(n);
const tierTxt = t => ['', '', ' Ⅱ', ' Ⅲ'][t];
const tierBadge = t => (t > 1 ? `<b class="tier">${t === 2 ? 'Ⅱ' : 'Ⅲ'}</b>` : '');
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
  /* 0.1.32 重畫時保留打開的折疊（details[data-k]）：圖鑑打開時一直在載大圖、每載好一張就重畫，之前一打開馬上被收起來 */
  const open = [...app.querySelectorAll('details[data-k][open]')].map(d => d.dataset.k);
  app.innerHTML = html;
  for (const k of open) {
    const d = app.querySelector(`details[data-k="${k}"]`);
    if (d) d.open = true;
  }
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
    <div class="g3"><button class="btn" data-act="go" data-k="help">怎麼玩</button><button class="btn" data-act="go" data-k="codex">百科</button><button class="btn" data-act="go" data-k="settings">設定</button></div>
    ${boardHTML()}
    ${
      (S.hist || []).length
        ? `<h3>最近的對局</h3><div class="hist">${S.hist
            .slice(0, 6)
            .map(
              x =>
                `<${x.log ? `button data-act="match" data-k="${S.hist.indexOf(x)}"` : 'div'} class="hr"><b class="pl p${x.place}">第 ${x.place} 名</b><span>${x.cls && CLSI[x.cls] ? CLSI[x.cls].n + '・' : ''}${x.r}</span><span class="${x.d >= 0 ? 'c-good' : 'c-bad'}">${x.d >= 0 ? '▲' : '▼'}${x.log ? ' ›' : ''}</span></${x.log ? 'button' : 'div'}>`
            )
            .join('')}</div>`
        : ''
    }
    <div class="hfoot"><button class="btn news" data-act="news">更新紀錄${S.newsSeen !== NEWS[0].v ? '<i class="dot" aria-label="有新的更新"></i>' : ''}</button><p class="sub">塞令老師 v${VER}・${esc(typeof CLOUD !== 'undefined' ? CLOUD.status : '')}</p></div>
  </div>`;
}
/* 0.1.29 首頁的排行榜：玩家（前 10 名＋你的位置）／職業（第 1 名率、平均名次、局數）；
   雲端拿不到時職業那頁改用自己的對局紀錄 */
function boardHTML() {
  if (ghostOK() && Date.now() - BOARD.at > 60000) ghostBoard().then(ch => ch && V.scr === 'home' && render());
  const tab = V.lb || 'p',
    tabs = `<div class="lbt"><button class="btn sm" data-act="lb" data-k="p" aria-pressed="${tab === 'p'}">玩家排行</button><button class="btn sm" data-act="lb" data-k="c" aria-pressed="${tab === 'c'}">職業勝率</button></div>`;
  let body;
  if (tab === 'p') {
    if (!BOARD.p)
      body = `<p class="empty">${BOARD.busy || (ghostOK() && !BOARD.at) ? '讀取中…' : BOARD.err && ghostOK() ? '排行榜暫時拿不到，可以先看「職業勝率」裡你自己的戰績' : '連上雲端後才看得到排行'}</p>`;
    else if (!BOARD.p.length) body = `<p class="empty">還沒有人打完一局，打完就會上榜</p>`;
    else {
      const me = BOARD.p.findIndex(x => x.name === S.name && x.avatar === S.av);
      body =
        `<div class="lb">${BOARD.p
          .slice(0, 10)
          .map(
            (x, i) =>
              `<div class="lbr${i === me ? ' me' : ''}"><b class="no p${i + 1}">${i + 1}</b>${sprCv('a_' + (AVATARS.some(a => a[0] === x.avatar) ? x.avatar : AVATARS[0][0]))}<span><b>${esc(x.name || '無名')}</b><small>${rankName(rankOf(x.rating))}・${x.games} 場・第 1 名 ${x.wins}</small></span><b class="v">${x.rating}</b></div>`
          )
          .join('')}</div>` +
        (me < 0 || me >= 10
          ? `<p class="sub">你：${S.rating} 分${me >= 10 ? `・第 ${me + 1} 名` : '（打完一局就會上榜）'}</p>`
          : '');
    }
  } else {
    const cloud = BOARD.c && BOARD.c.length,
      rows = cloud
        ? BOARD.c.map(x => ({ cls: x.cls, g: x.games, w: x.wins, avg: +x.avg_place }))
        : Object.values(
            (S.hist || [])
              .filter(x => x.cls)
              .reduce((m, x) => {
                const o = (m[x.cls] = m[x.cls] || { cls: x.cls, g: 0, w: 0, sum: 0 });
                o.g++;
                o.w += x.place === 1;
                o.sum += x.place;
                return m;
              }, {})
          ).map(o => ({ ...o, avg: o.sum / o.g }));
    rows.sort((a, b) => a.avg - b.avg);
    body = rows.length
      ? `<div class="lb">${rows
          .filter(x => CLSI[x.cls])
          .map(
            x =>
              `<div class="lbr"><img src="${artIconURL(CLSI[x.cls].ic) || iconURL('star')}" alt=""><span><b>${CLSI[x.cls].n}</b><small>${x.g} 場・平均第 ${x.avg.toFixed(2)} 名</small></span><b class="v">${Math.round((x.w / x.g) * 100)}%<small>第 1 名</small></b></div>`
          )
          .join(
            ''
          )}</div><p class="sub">${cloud ? `最近 30 天${BOARD.seed ? '（真人還不多，含電腦對局）' : ''}` : '你自己的對局（連上雲端後顯示全部玩家）'}</p>`
      : `<p class="empty">還沒有對局紀錄，打完一局就會出現</p>`;
  }
  return `<h3>排行榜</h3>${tabs}${body}`;
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
/* 0.1.36 對手的職業小圖示（右上角）：你選完職業後才顯示 */
function rvClsIc(run, rv) {
  const C = run.bag.cls && CLSI[rivalCls(rv)];
  return C ? `<img class="rvc" src="${artIconURL(C.ic) || iconURL('star')}" alt="${C.n}" title="${C.n}">` : '';
}
function rivalHTML(run) {
  const nx = curRound(run) && curRound(run).type === 'pvp' ? nextRival(run) : -1,
    /* 0.1.29 5 位對手一排放不下全名：「憂鬱的咕咕鳥」只顯示「咕咕鳥」（全名在 title） */
    nm = rv => esc(run.rivals.length > 3 ? String(rv.name).split('的').pop() : rv.name);
  return `<div class="rivals n${run.rivals.length}">${run.rivals
    .map((rv, i) => {
      /* 0.1.26 生命在這局裡算（rv.hp） */
      const hp = rivalAlive(rv, (curRound(run) || ROUNDS[ROUNDS.length - 1]).id) ? rivalHp(rv) : 0;
      if (hp <= 0)
        return `<button class="rv out" title="${esc(rv.name)}" data-act="rvBag" data-k="${i}">${rvClsIc(run, rv)}${sprCv('a_' + rv.av)}<span><b>${nm(rv)}</b><i class="hpb"><i style="width:0"></i></i><small>淘汰</small></span></button>`;
      return `<button class="rv${i === nx ? ' nx' : ''}" title="${esc(rv.name)}" data-act="rvBag" data-k="${i}">${rvClsIc(run, rv)}${sprCv('a_' + rv.av)}<span><b>${nm(rv)}</b><i class="hpb"><i style="width:${(hp / START_HP) * 100}%"></i></i><small>♥ ${hp}</small></span></button>`;
    })
    .join('')}</div>`;
}
/* 0.1.38 對手背包裡一件道具的詳細（點清單或背包格子）：說明、詞綴、融合、吸收、煉成… */
function rvDetHTML(o) {
  const I = ITEMI[o.id],
    aff = o.a && AFFX.find(a => a.k === o.a),
    T = o.f && ITEMI[o.f] && ITEMI[o.f].tf,
    tags =
      I.tags
        .filter(t => t !== 'weapon')
        .map(t => TAGN[t])
        .join('・') || (I.dmg ? '武器' : '道具');
  return `<div class="rvdet s${I.star}"><div class="dh"><img src="${itemIcon(o.id)}" alt=""><div><b style="color:${STARC[I.star]}">${esc(fuName(o))}${tierTxt(o.t)}</b><small>${stars(I.star)}・${tags}・${shapeOf(o.id).length} 格</small></div></div><p>${dsc(itemDesc(o.id, o.t))}</p>${o.m ? mod5HTML(o.m) : ''}${o.m2 ? mod5HTML(o.m2) : ''}${aff ? `<p class="c-gold">升階詞綴：${aff.n}</p>` : ''}${abHTML(o)}${o.ex ? `<p class="c-tf">✦ 煉成：${dsc(brewTxt(o.ex))}</p>` : ''}${o.hh ? `<p class="c-tf">✦ 已經累積生命 +${o.hh}</p>` : ''}${o.sc && ITEMI[o.sc] ? `<p class="c-tf">✦ 融入了${ITEMI[o.sc].n}：${dsc(itemDesc(o.sc))}</p>` : ''}${T ? `<p class="c-tf">✦ 融合了${ITEMI[o.f].n}${tierTxt(o.ft || 1)}：${[T.add && `變成${T.add.map(x => TAGN[x]).join('、')}系`, modTxt(scaleMod(T.m, o.ft || 1))].filter(Boolean).join('、')}</p>` : ''}</div>`;
}
/* 0.1.32 點對手：看他上一回合的背包（準備時看上一回合；打完結算時看剛打完的這回合，你已經看過了）。不給看這回合的，跟機器人一樣；
   0.1.38 點清單或背包裡的道具看詳細（sel 是選中的道具） */
function showRivalBag(i, sel) {
  const run = S.run,
    rv = run && run.rivals[i];
  if (!rv) return;
  const idx = run.phase === 'prep' || run.phase === 'cls' ? run.ri - 1 : run.ri,
    r = ROUNDS[idx],
    sn = r && rivalSnap(rv, r.id),
    cls = sn && sn.bag && CLSI[sn.bag.cls];
  let body;
  if (!sn) body = `<p class="empty">還沒有上一回合的背包（打完第一回合就看得到）</p>`;
  else {
    const bag = unpackBag(sn.bag),
      cs = Math.min(36, fl(260 / bag.w));
    const so = bag.items.find(o => o.u === sel);
    body = `<p class="sub">${cls ? cls.n + '・' : ''}${r.id} 的背包・${bag.items.length} 件・點道具看詳細</p><div class="bagwrap">${bagHTML(bag, cs, { mini: 1, id: 'rvbag' })}</div>${so ? rvDetHTML(so) : ''}<div class="rvit">${bag.items
      .map(
        o =>
          `<button class="s${ITEMI[o.id].star}${o.u === sel ? ' sel' : ''}" data-rvu="${o.u}"><img src="${itemIcon(o.id)}" alt="">${esc(fuName(o))}${tierTxt(o.t)}</button>`
      )
      .join('')}</div>`;
  }
  showDlg(`${esc(rv.name)}・♥ ${Math.max(0, rivalHp(rv))}`, body, []);
  paintSprites($('modal'));
  const m = $('modal'),
    close = m.onclick;
  if (sel) {
    const el = m.querySelector(`#rvbag .it[data-u="${sel}"]`);
    if (el) el.classList.add('sel');
  }
  m.onclick = ev => {
    const b = ev.target.closest('[data-rvu], #rvbag .it[data-u]');
    if (!b) return close(ev);
    snd('tap');
    const u = b.dataset.rvu || b.dataset.u;
    showRivalBag(i, u === sel ? null : u);
  };
}
/* 下一場 PvP 會打誰（跟 opponentOf 一樣的規則，只看不改）；
   0.1.27 結算／三選一時 run.rp 已經換下一位，改回傳剛剛打的那位 */
function nextRival(run) {
  if (run.phase !== 'prep' && run.last) return run.last.rv ?? -1;
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
    lit = new Set(),
    src = new Set(sel && mods && mods.get(sel.u) ? mods.get(sel.u).map(x => x.from) : []);
  if (sel && mods) for (const [u, l] of mods) if (l.some(x => x.from === sel.u)) lit.add(u);
  let h = `<div class="bag${opt.mini ? ' mini' : ''}${sel ? ' hassel' : ''}" id="${opt.id || 'bag'}" style="width:${W}px;height:${H}px;--cs:${cs}px">`;
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
      buf = mods && mods.get(o.u) && mods.get(o.u).length,
      tfd = buf && mods.get(o.u).some(x => x.w === 'tf');
    h += `<div class="it s${I.star}${V.sel === o.u ? ' sel' : ''}${lit.has(o.u) ? ' lit' : ''}${src.has(o.u) ? ' src' : ''}${I.core ? ' core' : ''}" data-u="${o.u}" style="left:${mx * (cs + GAP)}px;top:${my * (cs + GAP)}px;width:${bw}px;height:${bh}px">${cs0
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
      )}<img src="${itemIcon(o.id)}" alt="${fuName(o)}"${o.f && ITEMI[o.f] ? ` class="fum" style="--fg:${fuColor(o)}"` : ''}>${o.f && ITEMI[o.f] ? `<img class="fui" src="${itemIcon(o.f)}" alt="">` : o.sc && ITEMI[o.sc] ? `<img class="fui" src="${itemIcon(o.sc)}" alt="">` : ''}${tierBadge(o.t)}${buf && !opt.mini ? (tfd ? '<b class="buf tfm">✦</b>' : '<b class="buf">+</b>') : ''}</div>`;
  }
  if (mods && !opt.mini) h += linkHTML(bag, mods, cs, sel);
  /* 0.1.4 選中的道具右上角放旋轉鈕，不用到下面說明區按 */
  if (sel && !opt.mini && shapeOf(sel.id).length > 1) {
    const c = cellsOf(sel),
      rx = (Math.max(...c.map(p => p[0])) + 1) * (cs + GAP) - GAP,
      ry = Math.min(...c.map(p => p[1])) * (cs + GAP);
    h += `<button class="rotb" data-act="rot" aria-label="旋轉" style="left:${Math.min(rx - 16, W - 22)}px;top:${Math.max(ry - 12, -10)}px">↻</button>`;
  }
  return h + '</div>';
}
/* 0.1.28 相鄰加成的連接點：有相鄰加成的兩件，在貼著的那條縫上畫一顆亮點（不用選就看得到誰加成誰）；
   跟選中的道具有關的變亮、其他的變淡 */
function linkHTML(bag, mods, cs, sel) {
  const byU = new Map(bag.items.map(o => [o.u, o])),
    seen = new Set(),
    st = cs + GAP;
  let h = '';
  for (const [u, l] of mods)
    for (const x of l) {
      if ((x.w !== 'adj' && x.w !== 'tf') || !byU.has(x.from) || !byU.has(u)) continue;
      const key = [x.from, u].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      const a = byU.get(x.from),
        b = byU.get(u),
        bc = new Set(cellsOf(b).map(p => p + '')),
        touch = [];
      for (const [cx, cy] of cellsOf(a))
        for (const [dx, dy] of [
          [1, 0],
          [0, 1],
          [-1, 0],
          [0, -1]
        ])
          if (bc.has([cx + dx, cy + dy] + '')) touch.push([cx, cy, dx, dy]);
      if (!touch.length) continue;
      const [cx, cy, dx, dy] = touch[fl(touch.length / 2)],
        on = sel && (sel.u === a.u || sel.u === b.u);
      h += `<i class="lk ${dx ? 'h' : 'v'}${on ? ' on' : ''}${x.w === 'tf' ? ' tf' : ''}" style="left:${cx * st + cs / 2 + (dx * st) / 2}px;top:${cy * st + cs / 2 + (dy * st) / 2}px"></i>`;
    }
  return h;
}
/* 0.1.28 拖曳中：放下後會跟它有加成（或能融合）的道具先亮起來 */
function dragLit(d) {
  const run = S.run,
    t = d.tgt && d.ok ? { ...d.o, x: d.tgt[0], y: d.tgt[1], r: d.r } : null,
    key = d.fuse ? 'f' + d.fuse.u : t ? [t.x, t.y, t.r] + '' : '';
  if (d.lk === key) return;
  d.lk = key;
  const bag = $('bag');
  if (!bag) return;
  bag.querySelectorAll('.it.pv').forEach(e => e.classList.remove('pv'));
  const on = q => {
    const e = bag.querySelector(`.it[data-u="${q.u}"]`);
    if (e) e.classList.add('pv');
  };
  if (d.fuse) return on(d.fuse);
  if (!t) return;
  for (const q of run.bag.items) if (q.u !== d.o.u && adjacent(t, q) && synergy(t, q) + synergy(q, t) > 0) on(q);
}
/* 0.1.4 道具形狀的小圖（商店、說明、三選一）：幾格、怎麼排一眼看得出來 */
function shapeMini(id, r = 0, sm = 0) {
  const c = shapeOf(id, r, sm),
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
      return `<span class="rb t-${q.type}${k === run.ri ? ' on' : k < run.ri ? ' past' : ''}${lg ? (lg.win ? ' w' : ' l') : ''}"${lg ? ` data-act="log" data-k="${q.id}"` : ''}><b>${q.id}</b><small>${RSHORT[q.type]}</small></span>`;
    })
    .join('')}${nx ? `<span class="rb nx"><b>${nx.id}</b><small>下一階段</small></span>` : ''}</div>`;
}
/* 0.1.29 上方資訊欄的「戰報」：點一下直接看上一場的戰鬥紀錄（勝綠、敗紅） */
function lastLogBtn(run) {
  const l = (run.log || [])[run.log.length - 1];
  return l
    ? `<button class="iconbtn lgb ${l.win ? 'w' : 'l'}" data-act="lastLog" aria-label="上一場戰鬥紀錄"><b>戰報</b><small>${l.id}${l.win ? '勝' : '敗'}</small></button>`
    : '';
}
/* 0.1.25 金幣旁的下回合預估收入（輸～贏） */
function incTxt(run) {
  /* 0.1.27 結算／三選一時連勝連敗已經算進去了，再估會重複算：只在準備時顯示 */
  if (run.phase !== 'prep') return '';
  const e = incomeEst(run);
  if (!e) return '';
  return `<small class="inc" title="下回合收入（輸～贏）">+${e[0] === e[1] ? e[0] : e[0] + '～' + e[1]}</small>`;
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
    <div class="pcol pa"><div class="top"><button class="iconbtn" data-act="menu" aria-label="選單">☰</button>${lastLogBtn(run)}<button class="me" data-act="stats" aria-label="角色數值">${sprCv('a_' + S.av)}<span><b>${esc(S.name)}</b><small class="hpt">♥ ${run.hp}／${START_HP}<em>${CLSI[run.bag.cls] ? CLSI[run.bag.cls].n : '數值'} ›</em></small></span></button><div class="rinfo"><b class="gold">${run.gold} 金${incTxt(run)}</b><small>${r.id}・${oppTxt}</small></div>${themeBtn()}</div>
    ${roundBarHTML(run)}
    ${rivalHTML(run)}
    ${tutHTML()}
    ${holdHTML(run)}</div>
    <div class="pcol pb">${coreFabHTML(run)}<div class="bagwrap" id="bagwrap">${bagHTML(bag, cs, { mods })}</div>
    <div class="benchrow"><span class="lbl">暫存</span><div class="bench" id="bench">${run.bench
      .map((o, i) =>
        o
          ? `<div class="bs s${ITEMI[o.id].star}${V.sel === o.u ? ' sel' : ''}${fuCls(o)}" data-bu="${o.u}" data-bi="${i}"${fuSty(o)}><img src="${itemIcon(o.id)}" alt="${fuName(o)}">${o.f && ITEMI[o.f] ? `<img class="fui" src="${itemIcon(o.f)}" alt="">` : ''}${shapeMini(o.id, o.r || 0)}${tierBadge(o.t)}</div>`
          : `<div class="bs emp" data-bi="${i}"></div>`
      )
      .join('')}</div></div></div>
    <div class="pcol pc"><div class="shop" id="shop">${run.shop
      .map((s, k) =>
        s
          ? `<button class="sc s${ITEMI[s.id].star}${V.sel === 'shop' + k ? ' sel' : ''}" data-act="shopSel" data-k="${k}" data-sk="${k}"><img src="${itemIcon(s.id)}" alt="">${tierBadge(s.t || 1)}${shapeMini(s.id)}<span>${ITEMI[s.id].n}</span><b class="${run.gold < slotPrice(run, s) ? 'c-bad' : s.p != null ? 'c-gold' : ''}">${slotPrice(run, s)} 金</b></button>`
          : `<div class="sc sold">已買</div>`
      )
      .join('')}</div>
    <div class="acts"><button class="btn" data-act="reroll" ${(run.gold < REROLL && freeRolls(run) <= 0) || rollsLeft(run) <= 0 ? 'disabled' : ''}>刷新<small class="bnote">${rollsLeft(run) <= 0 ? '用完了' : freeRolls(run) > 0 ? '免費' : REROLL + ' 金'}</small></button><button class="btn" data-act="lock" aria-pressed="${!!run.lock}">${run.lock ? '已鎖' : '鎖住'}<small class="bnote">商店</small></button><button class="btn" data-act="lvup" ${!lvNext || !lvOpen(run) || run.gold < lvCost(run) ? 'disabled' : ''}>${lvNext ? `背包 ${lvNext.w}×${lvNext.h}` : '背包最大'}<small class="bnote">${lvNext ? (lvOpen(run) ? lvCost(run) + ' 金' : lvNext.from + ' 開放') : ''}</small></button><button class="btn pri" data-act="fight">開戰<small class="bnote">輸了 -${r.loss}</small></button></div></div>
    ${detailHTML(run)}
  </div>`;
}
/* 點道具：說明、加成、操作 */
function detailHTML(run) {
  if (!V.sel) return '';
  if (V.sel === 'core') return coreDetHTML(run);
  let o,
    where,
    k = -1;
  if (V.sel.startsWith('shop')) {
    k = +V.sel.slice(4);
    const s = run.shop[k];
    if (!s) return '';
    o = { id: s.id, t: s.t || 1, p: s.p };
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
  /* 0.1.28 目前加成照來源分行（誰給的一看就知道） */
  for (const x of mods) {
    if (x.w === 'tf') continue;
    const n =
      x.from === 'cls'
        ? (CLSI[run.bag.cls] || {}).n || '職業'
        : x.from === 'f'
          ? ITEMI[o.f].n
          : fuName(bagAll(run.bag).find(q => q.u === x.from) || { id: o.id });
    const t = (tot[n] = tot[n] || {});
    for (const k2 in x.m) t[k2] = (t[k2] || 0) + x.m[k2];
  }
  /* 0.1.28 被質變：名字加前綴、多的標籤 */
  const tfm = tfOf(where === 'bag' ? run.bag.items : [o]),
    by = tfm.get(o.u),
    T = by && ITEMI[by.id].tf;
  const aff = o.a && AFFX.find(a => a.k === o.a),
    tags =
      tagsWith(o, tfm)
        .filter(t => t !== 'weapon')
        .map(t => TAGN[t])
        .join('・') || (I.dmg ? '武器' : '道具');
  return `<div class="det" id="det"><div class="dh${fuCls(o)}"${fuSty(o)}><img src="${itemIcon(o.id)}" alt=""><div><b style="color:${STARC[I.star]}">${T ? T.n + '・' : ''}${I.n}${tierTxt(o.t)}</b><small>${stars(I.star)}・${tags}・${shapeMini(o.id, o.r || 0)} ${shapeOf(o.id).length} 格${I.core ? '・一個背包最多 1 個' : ''}</small></div>${oddsHTML(run, o.id)}<button class="iconbtn" data-act="desel" aria-label="關閉">✕</button></div>
    <p>${dsc(itemDesc(o.id, o.t))}</p>${o.m ? mod5HTML(o.m) : ''}${o.m2 ? mod5HTML(o.m2) : ''}${aff ? `<p class="c-gold">升階詞綴：${aff.n}</p>` : ''}${abHTML(o)}${trigHTML(run, o, where)}${o.ex ? `<p class="c-tf">✦ 煉成：${dsc(brewTxt(o.ex))}</p>` : ''}${o.hh ? `<p class="c-tf">✦ 已經累積生命 +${o.hh}</p>` : ''}${I.hatch ? `<p class="c-tf">✦ 再 ${SEAL_RC - (o.rc || 0)} 回合解開封印</p>` : ''}${o.z ? '<p class="c-dim">回扣送的：賣價 0 金</p>' : ''}${o.sc && ITEMI[o.sc] ? `<p class="c-tf">✦ 融入了${ITEMI[o.sc].n}：${dsc(itemDesc(o.sc))}</p>` : ''}${T ? `<p class="c-tf">✦ ${by.u ? '會跟' : '融合了'}${ITEMI[by.id].n}${tierTxt(by.t)}：${[T.add && `變成${T.add.map(x => TAGN[x]).join('、')}系`, modTxt(scaleMod(T.m, by.t))].filter(Boolean).join('、')}</p>` : ''}${Object.entries(
      tot
    )
      .filter(([, m]) => modTxt(m))
      .map(([n, m]) => `<p class="c-good">＋${esc(n)}：${dsc(modTxt(m))}</p>`)
      .join('')}
    <div class="btns">${
      where === 'shop'
        ? `<button class="btn pri" data-act="buy" data-k="${k}" ${run.gold < slotPrice(run, o) ? 'disabled' : ''}>買 ${slotPrice(run, o)} 金</button>`
        : `${where === 'bag' ? '<button class="btn" data-act="rot">旋轉</button><button class="btn" data-act="toBench">收回暫存</button>' : '<button class="btn" data-act="autoPlace">放進背包</button>'}<button class="btn" data-act="sell">賣 ${sellO(o)} 金</button>`
    }</div></div>`;
}
/* 0.1.42 詳細的右上角：下次刷新商店出現這件的機率 */
function oddsHTML(run, id) {
  const p = shopChance(run, id);
  if (p == null) return '';
  const v = p * 100;
  return `<span class="odds" title="下次刷新商店出現的機率"><small>刷新出現</small><b>${v >= 10 ? Math.round(v) : v >= 1 ? v.toFixed(1) : v > 0 ? '<1' : 0}%</b></span>`;
}
/* 0.1.42 核心欄：背包正上方靠右的膠囊按鈕（核心不佔格子、不蓋住背包），點了看核心效果 */
function coreFabHTML(run) {
  const c = run.bag.core;
  if (!c) return '';
  const nm = id => ITEMI[id].n.split('・').pop();
  return `<button class="corefab${V.sel === 'core' ? ' sel' : ''}" data-act="coreSel" aria-label="職業核心"><img src="${itemIcon(c.id)}" alt="">${c.sc && ITEMI[c.sc] ? `<img src="${itemIcon(c.sc)}" alt="">` : ''}<span>核心：${nm(c.id)}${c.sc && ITEMI[c.sc] ? '＋' + nm(c.sc) : ''}</span><b>›</b></button>`;
}
function coreDetHTML(run) {
  const c = run.bag.core;
  if (!c) return '';
  const one = (id, sub) =>
    `<div class="cdet"><img src="${itemIcon(id)}" alt=""><div><b style="color:${STARC[5]}">${ITEMI[id].n}</b>${sub ? `<small>${sub}</small>` : ''}<p>${dsc(itemDesc(id))}</p></div></div>`;
  return `<div class="det" id="det"><div class="dh"><img src="${itemIcon(c.id)}" alt=""><div><b style="color:${STARC[5]}">職業核心</b><small>不佔背包格子・整局有效</small></div><button class="iconbtn" data-act="desel" aria-label="關閉">✕</button></div>
    ${one(c.id, '2-5 首領')}${c.sc && ITEMI[c.sc] ? one(c.sc, '4-4 首領・融入') : '<p class="c-dim">4-4 首領會再給一個核心，融入這裡</p>'}${c.m ? mod5HTML(c.m) : ''}</div>`;
}
/* 0.1.40 上一場這件觸發了幾次（武器以外的道具：飾品、防具、盾、藥水；武器看戰鬥紀錄的傷害） */
function trigHTML(run, o, where) {
  const I = ITEMI[o.id];
  if (where !== 'bag' || I.dmg || !run.trig || !run.log || !run.log.length) return '';
  const n = run.trig[o.u] || 0;
  return `<p class="${n ? 'c-good' : 'c-dim'}">上一場（${run.log[run.log.length - 1].id}）觸發 ${n} 次</p>`;
}
/* 0.1.41 說明文字裡的異常、護盾前面加上對應的小圖示（長的先比，劇毒不會被當成中毒） */
const KW_IC = [
  ['劇毒', 'ail_dmark'],
  ['中毒', 'ail_poison'],
  ['點燃', 'sk_fireburst'],
  ['燃燒', 'ail_burn'],
  ['流血', 'ail_bleed'],
  ['破甲', 'ail_vul'],
  ['凍結', 'ail_frozen'],
  ['冰緩', 'sk_frostnova'],
  ['暈眩', 'ail_stun'],
  ['虛弱', 'ail_curse'],
  ['致盲', 'ail_mark'],
  ['衰老', 'ail_slow'],
  ['腐蝕', 'asc_alchemist_c0'],
  ['混亂', 'ail_shock'],
  ['封鎖', 'ail_guard'],
  ['護盾', 'ail_shield']
];
const KW_RE = new RegExp(KW_IC.map(k => k[0]).join('|'), 'g');
/* 0.1.44 常用屬性：暴擊率、暴擊傷害、攻速每次都加；「傷害」只在數值變化（傷害 +10%、傷害 ×1.5）和「造成 3～6 傷害」加，其他句子裡的傷害不加 */
const ST_IC = { 暴擊率: 'asc_s_spark', 暴擊傷害: 'asc_s_spark', 攻速: 'sk_haste', 傷害: 'sk_power' };
const ST_RE = /暴擊率|暴擊傷害|攻速|傷害(?= ?[+\-×])|(造成 \d+～\d+ )傷害/g;
const kwImg = (ic, w) => {
  const u = artIconURL(ic);
  return u ? `<img class="kw" src="${u}" alt="">${w}` : w;
};
function dsc(t) {
  return String(t || '')
    .replace(KW_RE, w => kwImg(KW_IC.find(k => k[0] === w)[1], w))
    .replace(ST_RE, (w, pre) => (pre ? pre + kwImg(ST_IC.傷害, '傷害') : kwImg(ST_IC[w], w)));
}
/* 0.1.35 魔劍正宗吸收的數值 */
function abHTML(o) {
  const ab = o.ab;
  if (!ab || !ab.n) return '';
  const on = [
    ab.crit && `暴擊率 +${ab.crit}%`,
    ab.burn && `燃燒 +${ab.burn}`,
    ab.poison && `中毒 +${ab.poison}`,
    ab.bleed && `流血 +${ab.bleed}`,
    ab.sunder && `破甲 +${ab.sunder}`,
    ab.ls && `吸血 ${ab.ls}%`,
    ab.freezeCh && `凍結 +${ab.freezeCh}%`,
    ab.stunCh && `暈眩 +${ab.stunCh}%`,
    ab.weak && `虛弱 +${ab.weak}%`,
    ab.blind && `致盲 +${ab.blind}%`
  ].filter(Boolean);
  const ex = [ab.am && modTxt(ab.am), ab.F && modTxt(ab.F)].filter(Boolean).join('、');
  return `<p class="c-tf">✦ 吸收了 ${ab.n} 把：傷害 +${ab.d0}～${ab.d1}${on.length ? '、' + on.join('、') : ''}${ex ? '、' + dsc(ex) : ''}</p>`;
}
/* 0.1.5 5★ 詞綴：數值越接近上限顏色越好，括號是這條詞綴的範圍 */
function mod5HTML(m) {
  const x = MOD5[m[0]],
    q = mod5Q(m);
  return `<p class="mod5 ${q >= 0.8 ? 'q3' : q >= 0.4 ? 'q2' : 'q1'}">✦ ${dsc(mod5Txt(m))}<small>（${x.lo}～${x.hi}）</small></p>`;
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
  return `<div class="stt">${C ? `<div class="sw"><img src="${artIconURL(C.ic) || iconURL('star')}" alt=""><span><b>職業：${C.n}</b><small>${dsc(clsDesc(C.id))}</small></span></div>` : ''}
    <div class="kv3">${kv('生命', `${Math.round(F.hp * hpMul(curRound(run) ? curRound(run).st : 1))}<small>這階段 ×${hpMul(curRound(run) ? curRound(run).st : 1)}</small>`)}${kv('護甲', `${F.arm}<small>減傷 ${red}%</small>`)}${kv('閃避', F.dodge + '%')}${kv('每秒回復', F.regen)}${kv('吸血', F.ls + '%')}${kv('暴擊傷害', F.critMul + '%')}</div>
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
  return `<div class="ovl"><div class="dlg2 ${l.win ? 'win' : 'lose'}"><b class="big">${l.win ? '勝利！' : '落敗'}</b><p>${esc(l.opp)}</p>${l.loss ? `<p class="c-bad">生命 -${l.loss}（剩 ${run.hp}）</p>` : ''}${l.hit ? `<p class="c-good">${l.ko ? '對手淘汰！' : `對手生命 -${l.hit}`}</p>` : ''}${l.gold ? `<p class="c-gold">+${l.gold} 金</p>` : ''}${l.spent ? `<p class="c-dim">金錢標花了 ${l.spent} 金</p>` : ''}<div class="g2"><button class="btn" data-act="log" data-k="${run.log.length ? run.log[run.log.length - 1].id : ''}">詳細</button><button class="btn pri" data-act="afterRes">繼續</button></div></div></div>`;
}
function pickHTML(run) {
  const p = run.pend;
  const t = p.tier || 1;
  /* 0.1.37 煉成：選的是藥劑效果（已經選的列在上面） */
  if (p.brew)
    return `<div class="ovl"><div class="dlg2"><b>${p.t}</b>${p.ex.length ? `<p class="c-dim">已經煉進去：${dsc(brewTxt(p.ex))}</p>` : ''}<div class="picks">${p.opts
      .map(
        k =>
          `<button class="pk s5" data-act="pick" data-k="${k}"><img src="${itemIcon('ultelixir')}" alt=""><span><b style="color:${STARC[5]}">${dsc(BREW[k].n)}</b><small>終極藥劑喝下時的效果</small></span></button>`
      )
      .join('')}</div></div></div>`;
  return `<div class="ovl"><div class="dlg2"><b>${p.t}</b><div class="picks">${p.opts
    .map(
      id =>
        `<button class="pk s${ITEMI[id].star}" data-act="pick" data-k="${id}"><img src="${itemIcon(id)}" alt="">${t > 1 ? tierBadge(t) : ''}${shapeMini(id)}<span><b style="color:${STARC[ITEMI[id].star]}">${ITEMI[id].n}${t > 1 ? tierTxt(t) : ''}</b><small>${dsc(itemDesc(id, t))}</small></span></button>`
    )
    .join('')}</div></div></div>`;
}
/* 0.1.7 開局職業三選一（可以刷新一次） */
function clsHTML(run) {
  return `<div class="ovl"><div class="dlg2"><b>選擇職業</b><p class="c-dim">整局都有效，照職業去買道具</p><div class="picks">${run.clsOpts
    .map(
      id =>
        `<button class="pk cls" data-act="cls" data-k="${id}"><img src="${artIconURL(CLSI[id].ic) || iconURL('star')}" alt=""><span><b>${CLSI[id].n}</b><small>${dsc(clsDesc(id))}</small></span></button>`
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
    t: leadIn(fb.res),
    i: 0,
    hp: [fb.me.hp, fb.opp.F.hp],
    max: fb.res.max,
    block: [fb.me.startBlock || 0, fb.opp.F.startBlock || 0],
    done: false,
    last: performance.now()
  };
  audioOn();
  snd('encounter');
  renderBattle();
}
/* 0.1.10 開戰時武器從 25% 充能開始，第一下要等快 1 秒，看起來像卡住：播放直接從第一個動作前 0.3 秒開始（結果不變） */
const leadIn = res => {
  const f = res.ev.find(e => e.t > 0);
  return f ? Math.max(0, f.t - 0.3) : 0;
};
/* 重新整理後回到戰鬥：用存下的對手與種子重算（結果一樣） */
function resumeFight() {
  const run = S.run,
    f = run.fight,
    me = stageHp(compileBag(run.bag), curRound(run).st),
    res = simulate(me, f.opp.F, f.seed);
  B = {
    fb: { r: curRound(run), opp: f.opp, me, res },
    t: leadIn(res),
    i: 0,
    hp: [me.hp, f.opp.F.hp],
    max: res.max,
    block: [me.startBlock || 0, f.opp.F.startBlock || 0],
    done: false,
    last: performance.now()
  };
}
/* 0.1.35 怪物的圖本來就朝左，不翻；對戰的對手是玩家頭像（朝右）才左右翻 */
function renderBattle() {
  if (!B) resumeFight();
  const { fb } = B,
    run = S.run,
    cs = Math.min(30, fl(cellSize(run.bag.w) * 0.6)),
    ob = fb.opp.bag;
  $('app').innerHTML = `<div class="bt">
    <div class="btop"><small>${fb.r.id}・${RTYPE[fb.r.type]}</small><b id="btime">0.0 秒</b></div>
    <div class="arena"><div class="fr"><i class="sp" id="sp0">${sprCv('a_' + S.av, 'big')}</i><b>${esc(S.name)}</b><i class="hpb big"><i id="hp0"></i><i class="bk" id="bk0"></i><em id="hpt0"></em></i><div class="sts" id="sts0"></div><div class="trp" id="trp0"></div></div>
    <div class="vs">VS</div>
    <div class="fr"><i class="sp" id="sp1">${sprCv(fb.opp.spr, fb.opp.kind === 'pvp' ? 'big flip' : 'big')}</i><b>${esc(fb.opp.n)}</b><i class="hpb big"><i id="hp1"></i><i class="bk" id="bk1"></i><em id="hpt1"></em></i><div class="sts" id="sts1"></div><div class="trp" id="trp1"></div></div>
    <div class="fx" id="fx"></div></div>
    <div class="bbags"><div><small>你的背包</small>${bagHTML(run.bag, cs, { mini: 1, id: 'bb0' })}</div>${ob ? `<div><small>對手的背包</small>${bagHTML(ob, Math.min(cs, 26), { mini: 1, id: 'bb1' })}</div>` : ''}</div>
    <div class="blog" id="blog" aria-live="off"></div>
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
    /* 0.1.35 紅色生命＋緊接著的白色護盾；加起來超過上限就照總量縮放 */
    const hp = Math.max(0, B.hp[i]),
      bk = Math.max(0, B.block[i]),
      tot = Math.max(B.max[i], hp + bk);
    el.style.width = (hp / tot) * 100 + '%';
    $('bk' + i).style.width = (bk / tot) * 100 + '%';
    $('hpt' + i).innerHTML = `${hp}${bk > 0 ? `<b class="bkt">+${bk}</b>` : ''}`;
  }
  $('btime').textContent = B.t.toFixed(1) + ' 秒' + (B.t >= FATIGUE_T ? '・疲勞' : '');
}
/* 0.1.6 冷卻條：照時間軸，每件武器／盾在兩次出手之間格子由下往上填滿；被封鎖的變暗。
   B.cdt[邊][u] = 出手時間；B.seal[邊][u] = 封鎖到幾秒；0.1.37 ice[邊][u] = [[開始, 結束, 凍結?]…]、trap[邊][u] = 蓋著幾個陷阱 */
function cdTimeline(ev) {
  const t = [{}, {}],
    seal = [{}, {}],
    ice = [{}, {}],
    trap = [{}, {}];
  for (const e of ev) {
    if (e.u && (e.k === 'hit' || e.k === 'crit' || e.k === 'miss' || e.k === 'block'))
      (t[e.s][e.u] = t[e.s][e.u] || []).push(e.t);
    if (e.k === 'seal') seal[1 - e.s][e.tu] = e.v;
    if ((e.k === 'freeze' || e.k === 'chill') && e.tu)
      (ice[1 - e.s][e.tu] = ice[1 - e.s][e.tu] || []).push([e.t, e.t + e.v, e.k === 'freeze']);
    if (e.k === 'trapSet') for (const u of e.tus || []) trap[1 - e.s][u] = (trap[1 - e.s][u] || 0) + 1;
  }
  return { t, seal, ice, trap };
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
    /* 0.1.37 凍結（深藍、「凍」）、冰緩（淡藍）、蓋著陷阱（右上角紅點） */
    for (const [u, l] of Object.entries(B.cdt.ice[s])) {
      const el = root.querySelector(`.it[data-u="${u}"]`);
      if (!el) continue;
      const on = l.filter(([a, b]) => B.t >= a && B.t < b);
      el.classList.toggle(
        'frzI',
        on.some(x => x[2])
      );
      el.classList.toggle(
        'chlI',
        on.some(x => !x[2])
      );
    }
    for (const u of Object.keys(B.cdt.trap[s])) {
      const el = root.querySelector(`.it[data-u="${u}"]`);
      if (el) el.classList.add('trapped');
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
    blind: '致盲',
    /* 0.1.37 新異常與開戰效果 */
    venom: '劇毒',
    ignite: '點燃',
    corrode: '腐蝕',
    age: '衰老',
    chill: '冰緩',
    confuse: '混亂',
    selfV: '自殘',
    dmgDown: '傷害降低'
  },
  /* 0.1.37 陷阱的名字 */
  TRAPN = { ignite: '點燃', bomb: '藥劑炸彈', spore: '劇毒孢子', icicle: '冰錐' },
  /* 0.1.47 陷阱的圖示與顏色 */
  TRAPI = {
    ignite: ['sk_fireburst', '#ff7a3a'],
    bomb: ['asc_alchemist_b0', '#ffb15a'],
    spore: ['it_c_venom_7', '#5fd38a'],
    icicle: ['it_c_cryo_2', '#8fd8ff']
  },
  STI = [
    ['burn', 'ail_burn', 1],
    ['poison', 'ail_poison', 1],
    ['bleed', 'ail_bleed', 1],
    ['sunder', 'ail_vul', 1],
    ['frozen', 'ail_frozen', 0],
    ['stun', 'ail_stun', 0],
    ['weak', 'ail_curse', 0],
    ['blind', 'ail_mark', 0],
    ['venom', 'ail_dmark', 1],
    ['ignite', 'sk_fireburst', 0],
    ['corrode', 'asc_alchemist_c0', 0],
    ['age', 'ail_slow', 0],
    ['chill', 'sk_frostnova', 1],
    ['confuse', 'ail_shock', 0]
  ];
function bSts() {
  if (!B.st) return;
  for (let s = 0; s < 2; s++) {
    const el = $('sts' + s),
      key = B.st[s].join(',');
    if (!el || el.dataset.k === key) continue;
    el.dataset.k = key;
    /* 身上的異常也染色角色：凍結藍、中毒綠、燃燒紅 */
    const sp = $('sp' + s);
    if (sp) {
      sp.classList.toggle('frz', B.st[s][4] > 0);
      sp.classList.toggle('psn', B.st[s][1] > 0 && !(B.st[s][4] > 0));
      sp.classList.toggle('brn', B.st[s][0] > 0 && !(B.st[s][4] > 0) && !(B.st[s][1] > 0));
    }
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
  blind: '#fff27a',
  venom: '#5fd38a',
  chill: '#bfe9ff',
  corrode: '#d6e36b',
  age: '#c9b89a'
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
/* 0.1.13 即時戰鬥紀錄：每個事件一行（新的在上面，留最後 30 行）：誰的哪件道具、做了什麼 */
function bNames() {
  const nm = [{}, {}],
    put = (k, its) => {
      for (const o of its) nm[k][o.u] = fuName(o);
    };
  put(0, S.run.bag.items);
  const ob = B.fb.opp.bag;
  if (ob)
    put(
      1,
      ob.items.filter(o => ITEMI[o.id])
    );
  return nm;
}
function bLog(e, tg) {
  const box = $('blog');
  if (!box) return;
  if (!B.nm) B.nm = bNames();
  const who = s => (s ? esc(B.fb.opp.n) : '你'),
    it = (s, u) => (u && B.nm[s][u]) || (s ? '' : ''),
    by = (s, u) => `${who(s)}${it(s, u) ? '的' + it(s, u) : ''}`;
  let t = '';
  if (e.k === 'hit' || e.k === 'crit')
    t = `${by(e.s, e.u)}${e.k === 'crit' ? ' 暴擊' : ''} → ${e.v}${e.ab ? `（擋 ${e.ab}）` : ''}`;
  else if (e.k === 'miss') t = `${by(e.s, e.u)} ${e.parry ? '被招架' : '被閃開'}`;
  else if (e.k === 'block') t = `${by(e.s, e.u)} 格擋 +${e.v}`;
  else if (e.k === 'dot') t = `${who(tg)} ${STN[e.el === 'fire' ? 'burn' : e.el] || ''} -${e.v}`;
  else if (e.k === 'pot') t = `${by(e.s, e.u)} 回復 ${e.v}`;
  else if (e.k === 'heal' && !e.regen) t = `${who(e.s)} 回復 ${e.v}`;
  else if (e.k === 'stun') t = `${who(tg)} 被暈眩 ${e.v} 秒`;
  else if (e.k === 'freeze') t = `${who(1 - e.s)}的${it(1 - e.s, e.tu) || '道具'} 被凍結 ${e.v} 秒`;
  else if (e.k === 'chill') t = `${who(1 - e.s)}的${it(1 - e.s, e.tu) || '道具'} 冰緩 ${e.v} 秒`;
  else if (e.k === 'ignite') t = `${who(1 - e.s)} 被點燃`;
  else if (e.k === 'age') t = `${who(tg)} 衰老 ${e.v} 秒`;
  else if (e.k === 'corrode') t = e.u ? `${who(tg)} 腐蝕中：護盾變成 -${e.v} 生命` : `${who(tg)} 腐蝕 ${e.v} 秒`;
  else if (e.k === 'trapSet') t = `${who(e.s)} 在${who(1 - e.s)}的背包放了${TRAPN[e.x] || '陷阱'}`;
  else if (e.k === 'trap')
    t = `${who(1 - e.s)}的${it(1 - e.s, e.tu) || '道具'} 觸發${TRAPN[e.x] || '陷阱'}${e.v ? ` -${e.v}` : ''}`;
  else if (e.k === 'weak') t = `${who(tg)} 虛弱 ${e.v} 秒`;
  else if (e.k === 'blind') t = `${who(tg)} 致盲 ${e.v} 秒`;
  else if (e.k === 'thorns') t = `${who(e.s)} 反彈 ${e.v}`;
  else if (e.k === 'fatigue') t = `${who(tg)} 疲勞 -${e.v}`;
  else if (e.k === 'cleanse') t = `${who(e.s)} 淨化了 ${e.v} 種異常`;
  else if (e.k === 'sealAll') t = `${by(e.s, e.u)} 封鎖了${who(1 - e.s)}所有武器 ${e.v} 秒`;
  else if (e.k === 'seal')
    t = `${by(e.s, e.u)} ${e.v >= MAX_T ? '關住' : '封鎖'}了${who(1 - e.s)}的${it(1 - e.s, e.tu) || '武器'}${e.v >= MAX_T ? '（整場）' : ` ${e.v} 秒`}`;
  else if (e.k === 'down') t = `${by(e.s, e.u)} 讓${who(1 - e.s)}的${it(1 - e.s, e.tu) || '武器'}降 1 階`;
  else if (e.k === 'throw') t = `${by(e.s, e.u)} 丟出藥劑：${STN[e.x] || ''} ${e.v}`;
  if (!t) return;
  const d = document.createElement('p');
  d.className = e.s ? 'op' : 'me';
  d.innerHTML = `<i>${e.t.toFixed(1)}</i>${t}`;
  box.prepend(d);
  while (box.childElementCount > 30) box.lastElementChild.remove();
}
/* 0.1.12 戰鬥特效：攻擊方往前衝、被打的閃白抖動、暴擊整個場地震、元素粒子、補血往上飄、格擋光圈、倒下 */
function bAnim(el, cls) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}
function bBurst(side, col, n = 6, up) {
  const fx = $('fx');
  if (!fx) return;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.className = 'pt' + (up ? ' up' : '');
    const a = Math.random() * Math.PI * 2,
      d = 20 + Math.random() * 26;
    p.style.cssText = `left:${side ? 75 : 25}%;top:${up ? 70 : 45}%;background:${col};--dx:${Math.cos(a) * d}px;--dy:${up ? -30 - Math.random() * 30 : Math.sin(a) * d}px`;
    fx.appendChild(p);
    setTimeout(() => p.remove(), 650);
  }
}
function bSlash(side, crit) {
  const fx = $('fx');
  if (!fx) return;
  const s = document.createElement('i');
  s.className = 'slash' + (crit ? ' crit' : '');
  s.style.left = (side ? 75 : 25) + '%';
  s.style.setProperty('--r', (Math.random() * 60 - 30).toFixed(0) + 'deg');
  fx.appendChild(s);
  setTimeout(() => s.remove(), 300);
}
function bHit(e, tg) {
  bAnim($('sp' + e.s), e.s ? 'atkL' : 'atkR');
  bAnim($('sp' + tg), 'hurt');
  if (e.el && e.el !== 'phys') bBurst(tg, ELC[e.el], e.k === 'crit' ? 10 : 5);
  else bSlash(tg, e.k === 'crit');
  if (e.k === 'crit') bAnim(document.querySelector('.arena'), 'shake');
}
function bFlash(side, u) {
  if (!u) return;
  const el = document.querySelector(`#bb${side} .it[data-u="${u}"]`);
  if (!el) return;
  el.classList.remove('act');
  void el.offsetWidth;
  el.classList.add('act');
}
/* 0.1.47 陷阱放置：從丟的人飛到對方背包的那幾格，落地後留一個圖示（空格也看得到）；
   對方沒有背包（怪物）就在牠下面排一個圖示。n 是第幾個（錯開時間） */
function bTrapSet(e, n) {
  const side = 1 - e.s,
    [ic, col] = TRAPI[e.x] || ['ail_mark', '#fff'],
    url = artIconURL(ic) || iconURL('star'),
    root = $('bb' + side),
    delay = n * 140,
    marks = [];
  if (root && e.cells && e.cells.length) {
    const cs = parseFloat(root.style.getPropertyValue('--cs')) || 24;
    for (const [x, y] of e.cells) {
      const m = document.createElement('i');
      m.className = 'trapm';
      m.dataset.ti = e.ti;
      m.style.cssText = `left:${x * (cs + GAP)}px;top:${y * (cs + GAP)}px;width:${cs}px;height:${cs}px;--tc:${col};animation-delay:${delay + 380}ms`;
      m.innerHTML = `<img src="${url}" alt="${TRAPN[e.x] || ''}">`;
      root.appendChild(m);
      marks.push(m);
    }
  } else {
    const row = $('trp' + side);
    if (!row) return;
    const m = document.createElement('i');
    m.className = 'trapm inrow';
    m.dataset.ti = e.ti;
    m.style.cssText = `--tc:${col};animation-delay:${delay + 380}ms`;
    m.innerHTML = `<img src="${url}" alt="${TRAPN[e.x] || ''}">`;
    row.appendChild(m);
    marks.push(m);
  }
  /* 飛過去：從丟的人的頭像中心，畫一條弧線到每一格 */
  const from = $('sp' + e.s);
  if (!from || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const fr = from.getBoundingClientRect();
  for (const m of marks) {
    const to = m.getBoundingClientRect(),
      f = document.createElement('img');
    f.className = 'trapfly';
    f.src = url;
    document.body.appendChild(f);
    const x0 = fr.left + fr.width / 2 - 10,
      y0 = fr.top + fr.height / 2 - 10,
      x1 = to.left + to.width / 2 - 10,
      y1 = to.top + to.height / 2 - 10,
      mx = (x0 + x1) / 2,
      my = Math.min(y0, y1) - 60;
    f.animate(
      [
        { transform: `translate(${x0}px,${y0}px) scale(.8)`, opacity: 0 },
        { transform: `translate(${mx}px,${my}px) scale(1.2) rotate(180deg)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${x1}px,${y1}px) scale(1) rotate(360deg)`, opacity: 1 }
      ],
      { duration: 420, delay, easing: 'ease-in-out', fill: 'both' }
    ).onfinish = () => f.remove();
  }
}
/* 0.1.47 陷阱觸發：那個陷阱的圖示閃一下、冒出一圈光 */
function bTrapHit(e) {
  const side = 1 - e.s;
  for (const m of document.querySelectorAll(
    `#bb${side} .trapm[data-ti="${e.ti}"], #trp${side} .trapm[data-ti="${e.ti}"]`
  )) {
    m.classList.remove('hit');
    void m.offsetWidth;
    m.classList.add('hit');
  }
  bFlash(side, e.tu);
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
    if (e.bk) B.block = e.bk;
    else {
      if ((e.k === 'hit' || e.k === 'crit') && e.ab) B.block[tg] = Math.max(0, B.block[tg] - e.ab);
      if (e.k === 'block') B.block[e.s] += e.v;
    }
    bLog(e, tg);
    /* 0.1.47 陷阱的放置與觸發每一筆都要畫（不受一次最多 6 個特效的限制） */
    if (e.k === 'trapSet') bTrapSet(e, (B.trapN = (B.trapN || 0) + 1) - 1);
    if (e.k === 'trapHit') bTrapHit(e);
    if (k++ > 6) continue;
    if (e.k === 'hit' || e.k === 'crit') {
      bPop(
        tg,
        (e.k === 'crit' ? '暴擊 ' : '') + e.v + (e.ab ? `（擋 ${e.ab}）` : ''),
        ELC[e.el] || '#fff',
        e.k === 'crit'
      );
      bFlash(e.s, e.u);
      bHit(e, tg);
      if (k < 2) snd(e.k === 'crit' ? 'crit' : 'hit');
    } else if (e.k === 'miss') bPop(tg, e.parry ? '招架' : '閃避', '#b3a9bd');
    else if (e.k === 'dot') {
      bPop(tg, e.v, ELC[e.el]);
      bBurst(tg, ELC[e.el], 3);
    } else if (e.k === 'fatigue') bPop(tg, '疲勞 ' + e.v, '#ff6a3a');
    else if (e.k === 'heal' && !e.regen) {
      bPop(e.s, '+' + e.v, '#7bd36b');
      bBurst(e.s, '#7bd36b', 5, 1);
    } else if (e.k === 'pot') {
      bPop(e.s, '藥水 +' + e.v, '#7bd36b', 1);
      bFlash(e.s, e.u);
    } else if (e.k === 'block') {
      bFlash(e.s, e.u);
      bAnim($('sp' + e.s), 'guard');
    } else if (e.k === 'stun') {
      bPop(tg, '暈眩', '#ffe27a');
      bBurst(tg, '#ffe27a', 6);
    } else if (e.k === 'freeze') {
      bPop(1 - e.s, '凍結', '#8fd8ff');
      bBurst(1 - e.s, '#8fd8ff', 8);
      bFlash(1 - e.s, e.tu);
    } else if (e.k === 'chill') {
      bPop(1 - e.s, '冰緩', '#bfe9ff');
      bFlash(1 - e.s, e.tu);
    } else if (e.k === 'ignite') {
      bPop(1 - e.s, '點燃！', '#ff7a3a', 1);
      bBurst(1 - e.s, '#ff7a3a', 8);
    } else if (e.k === 'trap') {
      bPop(1 - e.s, (TRAPN[e.x] || '陷阱') + (e.v ? ' ' + e.v : ''), e.x === 'bomb' ? '#ff9a5a' : '#5fd38a', 1);
      bFlash(1 - e.s, e.tu);
    } else if (e.k === 'corrode') {
      bPop(tg, e.u ? '腐蝕 -' + e.v : '腐蝕', '#d6e36b');
    } else if (e.k === 'age') {
      bPop(tg, '衰老', '#c9b89a');
    } else if (e.k === 'thorns') bPop(tg, '反彈 ' + e.v, '#ffb15a');
    else if (e.k === 'cleanse') bPop(tg, '淨化', '#ffe9a0');
    else if (e.k === 'sealAll') bPop(tg, `全封鎖 ${e.v} 秒`, '#c58cff', 1);
    else if (e.k === 'weak') bPop(tg, '虛弱', '#c58cff');
    else if (e.k === 'blind') bPop(tg, '致盲', '#fff27a');
    else if (e.k === 'throw') {
      bPop(tg, e.v ? `${STN[e.x] || ''} ${e.v}` : `${STN[e.x] || ''} 免疫`, ELC[e.x] || '#ffd27a', 1);
      bFlash(e.s, e.u);
    } else if (e.k === 'seal') {
      bPop(tg, e.v >= MAX_T ? '關住！' : `封鎖 ${e.v} 秒`, '#c58cff', 1);
      bFlash(e.s, e.u);
    } else if (e.k === 'down') {
      bPop(tg, '降階！', '#ff8a8a', 1);
      bFlash(e.s, e.u);
    }
  }
  bShow();
  bSts();
  bCd();
  for (let s = 0; s < 2; s++) {
    const sp = $('sp' + s);
    if (sp && B.hp[s] <= 0 && !sp.classList.contains('ko')) sp.classList.add('ko');
  }
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
    spent: out.spent || 0,
    hit: out.hit,
    ko: out.ko,
    rv: B.fb.opp.kind === 'pvp' ? B.fb.opp.rv : -1,
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
/* 0.1.38 圖鑑 → 百科：道具、職業、異常狀態、屬性四個分頁（V.cxTab） */
const CX_TABS = [
  ['item', '道具'],
  ['cls', '職業'],
  ['ail', '異常'],
  ['stat', '屬性']
];
/* 異常狀態：[圖示, 名字, 說明] */
const CX_AIL = () => [
  ['ail_burn', '燃燒', '每秒受「層數」傷害，之後少 1 層（N 層一共約 N×(N+1)/2）。'],
  ['sk_fireburst', '點燃', `被點燃後整場有效、只有一層：燃燒不再每秒 -1，改成每秒 +1，而且燃燒傷害 ×${IGNITE_MUL}。`],
  ['ail_poison', '中毒', `每秒受「層數」傷害，層數不會退。最多 ${POISON_MAX} 層（毒師讓敵人最多 24 層）。`],
  [
    'ail_dmark',
    '劇毒',
    `每秒受「層數 ×${VENOM_MUL}」傷害，層數不會退。最多 ${VENOM_MAX} 層（毒師核心「劇毒」40 層）。`
  ],
  ['ail_bleed', '流血', '每秒受「層數」傷害，之後層數減半（N 層一共約 2N）。'],
  ['ail_vul', '破甲', `扣敵人的護甲，整場不退、會疊加，最多 ${SUNDER_MAX}；護甲最低到 -10（受到的傷害最多 ×1.25）。`],
  ['ail_frozen', '凍結', `凍住敵人一件武器或盾 ${FREEZE_T} 秒，期間完全不能充能；凍結中的道具不能再被凍。`],
  ['sk_frostnova', '冰緩', `敵人一件武器或盾充能速度減半（命中觸發 ${CHILL_T} 秒）。`],
  ['ail_stun', '暈眩', '整個人不能動：武器、盾不能充能，也不能喝藥水。'],
  ['ail_curse', '虛弱', `造成的傷害 -${WEAK_PCT}%（${WEAK_T} 秒）。`],
  ['ail_mark', '致盲', `攻擊多 ${BLIND_MISS}% 打不中（${BLIND_T} 秒）。`],
  ['ail_slow', '衰老', '不能暴擊。'],
  ['asc_alchemist_c0', '腐蝕', `不能獲得護盾；本來會獲得護盾時（盾格擋、喝藥水的護盾…）改成扣 ${CORRODE_HP} 生命。`],
  ['ail_shock', '混亂', `武器出手時 ${CONFUSE}% 機率打到自己。`],
  ['ail_guard', '封鎖', '開戰時被封鎖的武器幾秒內不能充能（整場的叫「關住」）。'],
  ['ail_stacks', '降階', '開戰時把敵人一把 Ⅱ 階以上的武器降 1 階（傷害變成三分之一）。', 'flip']
];
/* 屬性與機制：[名字, 說明] */
/* 0.1.44 寫清楚每種防禦對什麼有效（照 sim.js：只有武器、寵物的「攻擊」會被閃避、招架、護甲、護盾擋；持續傷害與固定傷害直接扣生命） */
const CX_STAT = () => [
  [
    '攻擊傷害',
    '武器和寵物每次出手打出的傷害。不分物理或火、冰、雷、毒等元素，算法都一樣（遊戲沒有元素抗性）；元素只決定吃哪些加成、會帶什麼異常。'
  ],
  [
    '持續傷害',
    '燃燒、中毒、劇毒、流血每秒扣血：直接扣生命，不吃護甲、護盾、閃避，只會被抗性與淨化減少，也不會吸血、反彈。'
  ],
  ['固定傷害', '反彈、藥劑炸彈、腐蝕扣血、疲勞：直接扣生命，不吃護甲、護盾、閃避。'],
  ['傷害', '攻擊的傷害區間；「傷害 +%」乘在基礎傷害上。'],
  ['攻速', '充能速度：攻速 +100% 等於冷卻減半。'],
  ['暴擊率／暴擊傷害', '只有攻擊會暴擊：暴擊時傷害 ×暴擊傷害（基礎 160%）；暴擊率超過 100% 沒有用；衰老時不能暴擊。'],
  [
    '護甲',
    '只減少攻擊傷害（含元素武器）：受到 ×50÷(50+護甲)，例如護甲 50 受到一半。持續傷害、固定傷害不受影響；破甲會扣護甲。'
  ],
  [
    '護盾（格擋）',
    '白色護盾條：先吃掉攻擊傷害，吃完才扣生命；持續傷害、固定傷害不會被擋。盾每隔幾秒給一次，開戰護盾一開始就有；穿甲的那部分擋不住。'
  ],
  ['閃避', '有機率躲開整次攻擊（那一下的命中效果也不會發生），最多 40%；躲不開持續傷害、固定傷害與開戰效果。'],
  ['招架', '被攻擊時有機率擋下整次攻擊（浪人核心），跟閃避一樣只對攻擊有效。'],
  ['吸血', '照「實際打出去的攻擊傷害」（扣掉對方護甲、護盾後）回血；持續傷害不會吸血。'],
  ['每秒回復', '每秒回復固定生命。'],
  [
    '反彈',
    '被攻擊打中、真的扣到血時，反彈固定傷害給攻擊者（無視他的護甲與護盾）；被閃避、招架或整下被護盾吃掉時不反彈。盾的「格擋時反彈」是護盾吃到傷害時才反彈。'
  ],
  ['受到的傷害 +%', '缺點類效果：受到的攻擊傷害變多（持續傷害、固定傷害不變）。'],
  ['連擊／連鎖', '連擊：有機率馬上再打一下；連鎖：每次攻擊多打幾下，多打的傷害打折。'],
  ['穿甲', `無視一部分護甲與護盾，最多 ${PIERCE_MAX}%。`],
  ['處決／背水', '處決：敵人生命低於 30% 時傷害提高；背水：自己生命低於 50% 時傷害（或攻速）提高。'],
  ['先手', '開戰時武器已經充能幾 %，第一下比較快。'],
  ['越戰越快', '每 5 秒攻速提高，最多 5 次。'],
  ['抗性', `受到某種異常的層數或秒數減少，最多 -${RES_MAX}%；淨化每 ${CLEANSE_T} 秒清掉身上最嚴重的異常。`],
  ['陷阱', '開戰時放進敵人背包的格子（含空格），那格的道具每次出手都會觸發；打怪時掛在怪物的武器上。'],
  ['疲勞', `開戰 ${FATIGUE_T} 秒後雙方每秒受到越來越高的固定傷害，一定分出勝負。`],
  ['升階', '3 件相同、同階的道具自動合成高一階（最多 Ⅲ 階），數值大幅提升，還會多一條詞綴。'],
  ['池子', '一場裡每件道具大家共用數量（越稀有越少），別人收走的就比較難刷到。']
];
function codexHTML() {
  const tab = V.cxTab || 'item',
    nav = `<div class="cxtab">${CX_TABS.map(([k, n]) => `<button aria-pressed="${tab === k}" data-act="cxTab" data-k="${k}">${n}</button>`).join('')}</div>`,
    top = `<div class="page"><div class="ptop"><button class="iconbtn" data-act="home" aria-label="返回">‹</button><b>百科</b><small>${tab === 'item' ? `${ITEMS.filter(i => !i.core).length} 種道具・拿過的會亮起來` : ''}</small></div>${nav}`;
  if (tab === 'ail')
    return `${top}<p class="sub">戰鬥中角色身上和道具上的狀態。抗性可以減少層數或秒數。</p><div class="codex">${CX_AIL()
      .map(
        ([ic, n, d, f]) =>
          `<div class="cx"><img${f ? ' class="flip"' : ''} src="${artIconURL(ic) || iconURL('star')}" alt=""><div><b>${n}</b><p>${d}</p></div></div>`
      )
      .join('')}</div></div>`;
  if (tab === 'stat')
    return `${top}<p class="sub">道具說明裡常見的數值與機制。</p><div class="codex">${CX_STAT()
      .map(([n, d]) => `<div class="cx"><div><b>${n}</b><p>${d}</p></div></div>`)
      .join('')}</div></div>`;
  if (tab === 'cls')
    return `${top}<h3>職業核心（2-5 首領掉專屬核心，4-4 首領再掉一個專屬核心融入第一個，都從你的職業池三選一）</h3>${CLASSES.map(
      C =>
        `<details class="more" data-k="cx_${C.id}"><summary>${C.n}<small>${dsc(clsDesc(C.id))}</small></summary><div class="cores">${ITEMS.filter(
          i => i.cls === C.id && i.core === 1
        )
          .map(i => `<p><b>${i.n.split('・')[1]}</b>　${dsc(itemDesc(i.id))}</p>`)
          .join('')}</div></details>`
    ).join('')}</div>`;
  return `${top}${[1, 2, 3, 4, 5]
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
                .join('・')}・${shapeOf(i.id).length} 格</small><p>${dsc(itemDesc(i.id))}</p></div></div>`
          )
          .join('')}</div>`
    )
    .join('')}</div>`;
}
function helpHTML() {
  return `<div class="page"><div class="ptop"><button class="iconbtn" data-act="${S.run && S.run.phase !== 'end' ? 'play' : 'home'}" aria-label="返回">‹</button><b>怎麼玩</b></div>
  <div class="card"><b>一局</b><p>4 位玩家一場，每人 ${START_HP} 點生命。每回合在商店買道具、擺進背包，然後自動戰鬥。輸了扣生命，歸零就淘汰；最後活下來的是第 1 名。戰鬥中角色的生命會跟著階段變多（第 1 階段 ×1.5、第 2 階段 ×2.6、第 3 階段 ×3.6…），後期一場大約打 8～10 秒，持續傷害、回復、慢速重武器才有發揮空間。</p></div>
  <div class="card"><b>職業</b><p>每局開打前三選一（可以刷新一次），整局都有效：例如弓箭手讓弓、弩傷害 +20%、攻速 +15%。照職業去買武器和輔助道具（箭袋、劍帶、法術卷軸、火藥地雷、獸牙項鍊…），輔助道具要擺在武器旁邊或同一排才有用，背包空間要取捨。點左上角頭像可以看職業與數值。</p></div>
  <div class="card"><b>回合</b><p>開局有 ${START_GOLD} 金、商店 5 件 1★，買好擺好就開打：1-1～1-3 野怪 → 1-4 菁英（打完三選一）→ 第 2 階段對戰與野怪穿插：2-1 對戰、2-2 群體野怪、2-3 對戰、2-4 菁英、2-5 首領（打完專屬核心三選一）→ 第 3 階段起以對戰為主，每階段第 4 輪是菁英（戰利品越後面越高星），4-4 是首領（第二個專屬核心三選一）。每一輪開始都能逛商店。畫面上方的回合列看得到這一階段每一輪是什麼。越後面輸一場扣越多。</p></div>
  <div class="card"><b>金幣</b><p>每回合 ${BASE_INCOME} 金＋利息（每 10 金 +1，最多 +${INTEREST_MAX}）＋連勝或連敗獎勵。刷新商店 ${REROLL} 金，鎖住的商店下回合不換。</p></div>
  <div class="card"><b>背包</b><p>從 3×3 開始，花金幣升級（最大 6×7，越大越貴：3×4 要 14 金，開局只有 ${START_GOLD} 金，要在買道具和存錢之間取捨），背包越大商店越容易出高星道具。道具有形狀，點一下可以旋轉（電腦版拖曳中按 R、空白鍵、滑鼠右鍵或滾輪也能轉）；商店的道具可以直接拖進背包，拖到別的道具上會交換位置（放得下的話），拖回暫存區收起來，拖到商店區直接賣掉。</p></div>
  <div class="card"><b>合成</b><p>3 件相同、同一階的道具（背包＋暫存區都算）會自動合成高一階，最多 Ⅲ 階，數值大幅提升，還會多一條詞綴。</p></div>
  <div class="card"><b>相鄰效果</b><p>飾品會加強「相鄰」（上下左右）、「同一排」或「所有」特定種類的道具。點一下道具，被它加強的道具會亮起來，有吃到加成的道具右上角有「＋」。</p></div>
  <div class="card"><b>職業核心</b><p>首領掉落、從你的職業池三選一：2-5 掉專屬核心（每個職業 12 個，各有特色，例如先手、處決、連擊、越戰越快），4-4 再掉一個專屬核心，選了直接融入第一個（兩個效果都有）。核心不佔背包格子，放在背包上方的「核心」按鈕，點了看效果。百科的「職業」分頁可以看全部。</p></div>
  <div class="card"><b>戰鬥</b><p>完全自動：每件武器照自己的冷卻出手，盾定時格擋，藥水在生命低的時候喝。${FATIGUE_T} 秒後進入疲勞，雙方受到的傷害越來越高，一定分出勝負。</p></div>
  <div class="card"><b>異常狀態</b><p>燃燒、中毒、流血、劇毒每秒扣血（劇毒不會退、×2）；點燃讓燃燒越燒越多；破甲扣護甲；凍結讓一件道具 6 秒不能充能、冰緩讓它充能減半；暈眩不能動；虛弱傷害 -25%；致盲 30% 打不中；衰老不能暴擊；腐蝕不能獲得護盾（改成扣血）；混亂一半打到自己。</p></div>
  <div class="card"><b>陷阱</b><p>有些核心會在開戰時把陷阱放進敵人背包的格子（含空格），那格的道具每次出手都會觸發。戰鬥時有陷阱的道具右上角有紅點。</p></div>
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
    typeof CLOUD !== 'undefined' && CLOUD.recovery
      ? `<p>請設定新密碼</p><input class="inp" id="authPw" type="password" placeholder="新密碼（至少 6 個字）" autocomplete="new-password" value="${esc(V.authPw || '')}"><button class="btn pri" data-act="newPw" ${V.authBusy ? 'disabled' : ''}>設定新密碼</button><p class="sub${V.authErr ? ' c-bad' : ''}" id="authMsg">${esc(V.authMsg || '')}</p>`
      : anon
        ? `<input class="inp" id="authEmail" type="email" placeholder="信箱" autocomplete="email" value="${esc(V.authEm || '')}"><input class="inp" id="authPw" type="password" placeholder="密碼（至少 6 個字）" autocomplete="current-password" value="${esc(V.authPw || '')}"><div class="g2"><button class="btn pri" data-act="register" ${V.authBusy ? 'disabled' : ''}>註冊</button><button class="btn" data-act="login" ${V.authBusy ? 'disabled' : ''}>登入</button></div><button class="btn sm" data-act="resetPw" ${V.authBusy ? 'disabled' : ''}>忘記密碼</button><p class="sub${V.authErr ? ' c-bad' : ''}" id="authMsg">${esc(V.authMsg || '')}</p>`
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
      ['戰鬥紀錄', () => showLog()],
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
  log: d => showLog(d.k),
  coreSel: () => {
    V.sel = V.sel === 'core' ? null : 'core';
    snd('tap');
    render();
  },
  cxTab: d => {
    V.cxTab = d.k;
    snd('tap');
    render();
    scrollTo(0, 0);
  },
  rvBag: d => {
    snd('tap');
    showRivalBag(+d.k);
  },
  lastLog: () => {
    const l = S.run && (S.run.log || [])[S.run.log.length - 1];
    if (l) showLog(l.id);
  },
  match: d => showMatch(+d.k),
  lb: d => {
    V.lb = d.k;
    snd('tap');
    render();
  },
  news: () => {
    S.newsSeen = NEWS[0].v;
    save();
    render();
    showNews();
  },
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
    const run = S.run;
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
      mid = run.pend && run.pend.mid,
      e = takePick(run, d.k, true);
    if (e) return toast(e);
    if (run.hold) toast('暫存區滿了：戰利品先寄放，空出一格再領');
    if (ITEMI[d.k]) S.seen[d.k] = 1;
    snd('level');
    /* 0.1.37 選完還有下一步（煉成）：留在三選一 */
    if (run.pend) run.phase = 'pick';
    /* 0.1.35 回扣送的三選一在準備中途：選完回到準備 */ else if (mid) run.phase = 'prep';
    else nextRound(run);
    save();
    render();
  },
  rot: () => {
    const o = S.run.bag.items.find(q => q.u === V.sel);
    if (o) rotIt(o);
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
      tg = run.bag.items.filter(q => canFuse(o, q)).sort((a, b) => tfRank(b) - tfRank(a))[0];
    if (tg) {
      fuseToast([fuseInto(run, o, tg)]);
      V.sel = tg.u;
      save();
      return render();
    }
    const sp = findSpot(run.bag, o);
    if (!sp)
      return toast(
        ITEMI[o.id].core && run.bag.items.some(q => ITEMI[q.id].core)
          ? '專屬核心只能放 1 個（第二個會融入它）'
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
  /* 0.1.49 忘記密碼（只要信箱）、設定新密碼（只要密碼） */
  resetPw: () => authDo(authReset, 'email'),
  newPw: () => authDo(authNewPw, 'pw'),
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
/* 0.1.48 登入、註冊：信箱、密碼、訊息記在 V（畫面重畫時不會被清掉；之前按下按鈕後圖示載好一重畫，
   輸入的帳密和錯誤訊息就不見了，看起來像「無事發生」）；等待中不重畫、按鈕停用 */
async function authDo(f, only) {
  const em = ($('authEmail') ? $('authEmail').value : V.authEm || '').trim(),
    pw = $('authPw') ? $('authPw').value : V.authPw || '';
  V.authEm = em;
  V.authPw = pw;
  const show = (msg, err) => {
    V.authMsg = msg;
    V.authErr = !!err;
    render();
  };
  if (only === 'email' ? !em : only === 'pw' ? pw.length < 6 : !em || pw.length < 6)
    return show(
      only === 'email'
        ? '先在上面輸入註冊用的信箱'
        : only === 'pw'
          ? '新密碼至少 6 個字'
          : '請輸入信箱與至少 6 個字的密碼',
      1
    );
  V.authBusy = true;
  show('處理中…');
  try {
    const r = await (only === 'pw' ? f(pw) : only === 'email' ? f(em) : f(em, pw));
    V.authBusy = false;
    V.authPw = '';
    if (r === 'confirm') return show('確認信已寄出：點信裡的連結完成註冊，再回來按「登入」');
    if (r === 'reset') return show('重設密碼信已寄出：點信裡的連結回到遊戲，再設定新密碼（沒收到請看垃圾郵件）');
    if (r === 'newpw') {
      V.authEm = '';
      V.authMsg = '';
      toast('新密碼設定好了，已經登入');
      return render();
    }
    V.authEm = '';
    V.authMsg = '';
    toast(r === 'loaded' ? '登入成功，已載入這個帳號的存檔' : '登入成功');
    render();
  } catch (e) {
    V.authBusy = false;
    show(e.message || '登入失敗', 1);
  }
}
/* 帳密輸入時記下來（重畫後還在） */
document.addEventListener('input', ev => {
  if (ev.target.id === 'authEmail') V.authEm = ev.target.value;
  if (ev.target.id === 'authPw') V.authPw = ev.target.value;
});
/* 簡單的對話框：buttons [[文字, 動作]] */
/* 0.1.12 戰鬥紀錄：列表（新的在上面），點一筆看詳細：秒數、傷害、傷害最高的道具、對手的背包 */
/* 0.1.40 sel：戰鬥紀錄裡對手的背包，點道具看詳細 */
function showLog(id, hi, sel) {
  const H = hi != null ? S.hist[hi] : null,
    logs = H ? H.log || [] : S.run && S.run.log,
    m = $('modal');
  if (!logs) return;
  const lg = id && logs.find(l => l.id === id),
    row = l =>
      `<button class="lgr ${l.win ? 'w' : 'l'}" data-lg="${l.id}">${sprCv(l.spr || 'a_' + S.av)}<span><b>${l.id}・${esc(l.opp)}</b><small>${RTYPE[l.type]}${l.t ? `・${l.t} 秒` : ''}</small></span><em>${l.win ? '勝' : `敗 -${l.loss}`}</em></button>`;
  let body;
  if (lg) {
    const mx = Math.max(1, ...(lg.top || []).map(x => x[2]));
    body = `<div class="lgd">${row(lg)}<div class="kv3"><span>造成<b>${lg.dealt ?? '—'}</b></span><span>受到<b>${lg.taken ?? '—'}</b></span><span>秒數<b>${lg.t ?? '—'}</b></span></div>${
      (lg.top || []).length
        ? `<h4>傷害最高</h4>${lg.top
            .map(
              ([iid, t, v]) =>
                `<div class="lgb"><img src="${itemIcon(iid)}" alt=""><span><b>${ITEMI[iid] ? ITEMI[iid].n : iid}${tierTxt(t)}</b><i><i style="width:${Math.round((v / mx) * 100)}%"></i></i></span><em>${v}</em></div>`
            )
            .join('')}`
        : ''
    }${lg.ob ? lgBagHTML(unpackBag(lg.ob), sel) : ''}</div>`;
  } else
    body = logs.length
      ? `<div class="lgl">${[...logs].reverse().map(row).join('')}</div>`
      : '<p class="c-dim">還沒有打過</p>';
  m.innerHTML = `<div class="dlg2"><b>${lg ? '這場的紀錄' : '戰鬥紀錄'}</b>${body}<div class="btns col">${lg ? `<button class="btn" data-lgx="1">${H ? '回到這一局' : '所有紀錄'}</button>` : ''}<button class="btn" data-lgc="1">關閉</button></div></div>`;
  m.hidden = false;
  paintSprites(m);
  if (sel) {
    const el = m.querySelector(`#lgbag .it[data-u="${sel}"]`);
    if (el) el.classList.add('sel');
  }
  m.onclick = ev => {
    const r = ev.target.closest('[data-lg]');
    if (r && !lg) return showLog(r.dataset.lg, hi);
    const it = lg && ev.target.closest('[data-rvu], #lgbag .it[data-u]');
    if (it) {
      snd('tap');
      const u = it.dataset.rvu || it.dataset.u;
      return showLog(id, hi, u === sel ? null : u);
    }
    if (ev.target.closest('[data-lgx]')) return H ? showMatch(hi) : showLog();
    if (ev.target.closest('[data-lgc]') || ev.target === m) m.hidden = true;
  };
}
/* 戰鬥紀錄的對手背包：格子＋清單，點了看詳細（跟看對手背包同一套） */
function lgBagHTML(bag, sel) {
  const so = bag.items.find(o => o.u === sel);
  return `<h4>對手的背包<small class="c-dim">・點道具看詳細</small></h4><div class="bagwrap">${bagHTML(bag, 24, { mini: 1, id: 'lgbag' })}</div>${so ? rvDetHTML(so) : ''}<div class="rvit">${bag.items
    .map(
      o =>
        `<button class="s${ITEMI[o.id].star}${o.u === sel ? ' sel' : ''}" data-rvu="${o.u}"><img src="${itemIcon(o.id)}" alt="">${esc(fuName(o))}${tierTxt(o.t)}</button>`
    )
    .join('')}</div>`;
}
/* 0.1.21 過去的對局（首頁「最近的對局」點進來）：名次、職業、最後的背包、整局每件道具的傷害、每一場（點了看詳細） */
function showMatch(hi) {
  const H = S.hist[hi],
    m = $('modal');
  if (!H || !H.log) return;
  const mx = Math.max(1, ...(H.dmg || []).map(x => x[2])),
    tot = (H.dmg || []).reduce((a, x) => a + x[2], 0),
    row = l =>
      `<button class="lgr ${l.win ? 'w' : 'l'}" data-lg="${l.id}">${sprCv(l.spr || 'a_' + S.av)}<span><b>${l.id}・${esc(l.opp)}</b><small>${RTYPE[l.type]}${l.t ? `・${l.t} 秒` : ''}${l.dealt != null ? `・造成 ${l.dealt}` : ''}</small></span><em>${l.win ? '勝' : `敗 -${l.loss}`}</em></button>`;
  const C = CLSI[H.cls];
  m.innerHTML = `<div class="dlg2 matchd"><b>第 ${H.place} 名・打到 ${H.r}</b><p class="c-dim">${C ? C.n + '・' : ''}${new Date(H.at).toLocaleDateString()}</p>
    <h4>最後的背包</h4><div class="bagwrap">${bagHTML(unpackBag(H.bag), 26, { mini: 1, id: 'hbag' })}</div>
    ${
      (H.dmg || []).length
        ? `<h4>整局傷害（共 ${tot}）</h4>${H.dmg
            .map(
              ([iid, t, v]) =>
                `<div class="lgb"><img src="${itemIcon(iid)}" alt=""><span><b>${ITEMI[iid] ? ITEMI[iid].n : iid}${tierTxt(t)}</b><i><i style="width:${Math.round((v / mx) * 100)}%"></i></i></span><em>${v}</em></div>`
            )
            .join('')}`
        : ''
    }
    <h4>每一場（點了看詳細）</h4><div class="lgl">${[...H.log].reverse().map(row).join('')}</div>
    <div class="btns col"><button class="btn" data-lgc="1">關閉</button></div></div>`;
  m.hidden = false;
  paintSprites(m);
  m.onclick = ev => {
    const r = ev.target.closest('[data-lg]');
    if (r) return showLog(r.dataset.lg, hi);
    if (ev.target.closest('[data-lgc]') || ev.target === m) m.hidden = true;
  };
}
/* 0.1.15 更新紀錄（首頁左下）：照版本列出遊戲功能的變化（資料在 news.js），最新的展開、舊的收起來 */
function showNews() {
  const m = $('modal');
  m.innerHTML = `<div class="dlg2 newsd"><b>更新紀錄</b><div class="nwl">${NEWS.map(
    (n, i) =>
      `<details${i < 1 ? ' open' : ''}><summary>v${n.v}${n.v === VER ? '<small>目前版本</small>' : ''}</summary><ul>${n.d.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>`
  ).join('')}</div><div class="btns col"><button class="btn" data-nwc="1">關閉</button></div></div>`;
  m.hidden = false;
  m.onclick = ev => {
    if (ev.target.closest('[data-nwc]') || ev.target === m) m.hidden = true;
  };
}
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
/* 0.1.28 融合過的道具：圖示加元素顏色的光暈（變成哪一系就哪個顏色；沒換系的照效果）＋左下角小輔助圖示 */
const FUC = {
  holy: '#ffe9a0',
  dagger: '#c58cff',
  staff: '#8fb8ff',
  pet: '#ffcf8a',
  bleed: '#ff5a5a',
  pierce: '#e6ecf5',
  chain: '#7fe0ff',
  bash: '#ffb15a',
  thornsF: '#9be36b',
  potBomb: '#ff9a5a'
};
function fuColor(o) {
  const T = o.f && ITEMI[o.f] && ITEMI[o.f].tf;
  if (!T) return '';
  for (const k of T.add || []) if (ELC[k] || FUC[k]) return ELC[k] || FUC[k];
  for (const k in T.m) if (FUC[k]) return FUC[k];
  return '#c58cff';
}
const fuCls = o => (o.f && ITEMI[o.f] ? ' fu' : '');
const fuSty = o => (o.f && ITEMI[o.f] ? ` style="--fg:${fuColor(o)}"` : '');
/* ================= 拖曳擺放 ================= */
/* 0.1.28 融合好的提示 */
function fuseToast(l) {
  if (l && l.length) {
    snd('level');
    toast(`融合！${l.map(fuName).join('、')}`);
  }
}
/* 輔助 o 拖到哪一格：那格是能融合的道具就回傳它 */
function fuseAt(run, o, c) {
  if (!c || !ITEMI[o.id].tf) return null;
  const g = bagGrid(run.bag),
    u = g[c[1]] && g[c[1]][c[0]],
    q = u != null && run.bag.items.find(x => x.u === u);
  return q && canFuse(o, q) ? q : null;
}
function placeFromBench(run, i, x, y, r) {
  const o = run.bench[i];
  Object.assign(o, { x, y, r });
  run.bench[i] = null;
  run.bag.items.push(o);
  snd('select');
  fuseToast(fuseAll(run));
  syncShrink(run);
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
    st = (cs + GAP) * V.z;
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
  /* 滑鼠拖曳：不要開始選取文字或拖出圖片（點一下的 click 照常觸發） */
  if (ev.pointerType === 'mouse') ev.preventDefault();
  const run = S.run;
  /* 0.1.38 右鍵（沒在拖曳時）：直接旋轉背包裡的那件，不開始拖曳 */
  if (ev.button === 2) {
    const o = c.dataset.u && run.bag.items.find(q => q.u === c.dataset.u);
    if (o) rotIt(o);
    return;
  }
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
    grab = shapeOf(o.id, o.r, o.sm)[0];
  } else {
    from = 'bag';
    o = run.bag.items.find(q => q.u === c.dataset.u);
    grab = [+c.dataset.cx - o.x, +c.dataset.cy - o.y];
  }
  /* 0.1.29 gi：抓的是形狀的第幾格（拖曳中旋轉後，手指還是抓著同一格） */
  const gi = Math.max(
    0,
    shapeOf(o.id, o.r || 0, o.sm).findIndex(p => p[0] === grab[0] && p[1] === grab[1])
  );
  V.drag = { o, from, grab, gi, rot: 0, sk, sx: ev.clientX, sy: ev.clientY, on: false, el: null };
});
document.addEventListener(
  'pointermove',
  ev => {
    const d = V.drag;
    if (!d) return;
    /* 0.1.38 拖曳中按右鍵旋轉：按下左鍵時取消了預設動作，瀏覽器不會再送右鍵的 mousedown，改看 pointermove 的 buttons */
    const b2 = (ev.buttons & 2) > 0;
    if (b2 && !d.b2 && d.on) dragRot();
    d.b2 = b2;
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
    d.px = ev.clientX;
    d.py = ev.clientY;
    dragMove(d);
  },
  { passive: false }
);
/* 拖曳中：照手指位置算放得下、交換、融合（d.px／d.py 是最後的指標位置；旋轉後重算也呼叫這個） */
function dragMove(d) {
  const c = cellAt(d.px, d.py);
  /* 0.1.29 拖曳中可以旋轉（d.rot）：抓的那格跟著轉 */
  const rr = ((d.o.r || 0) + d.rot) & 3,
    ro = { ...d.o, r: rr };
  d.r = rr;
  d.g = shapeOf(d.o.id, rr, d.o.sm)[d.gi] || d.grab;
  d.tgt = c ? [c[0] - d.g[0], c[1] - d.g[1]] : null;
  d.ok = !!d.tgt && canPlace(S.run.bag, d.o, d.tgt[0], d.tgt[1], rr);
  /* 0.1.5 從暫存區或商店拖進來放不下時，自動換個方向（手指底下那格還是道具的一部分），不動背包裡原本的道具 */
  if (!d.ok && c && d.from !== 'bag') {
    const f = autoFit(S.run.bag, ro, c);
    if (f) {
      d.r = f.r;
      d.g = [c[0] - f.x, c[1] - f.y];
      d.tgt = [f.x, f.y];
      d.ok = true;
    }
  }
  drawGhost(d);
  const st = d.cs + GAP;
  /* 影子也有縮放（.ghost 的 zoom），位置要換回縮放前的單位 */
  d.el.style.left = d.px / V.z - d.g[0] * st - d.cs / 2 + 'px';
  d.el.style.top = d.py / V.z - d.g[1] * st - d.cs / 2 + 'px';
  /* 放不下但剛好擋到一件、而且換得過去：可以交換 */
  /* 0.1.28 輔助拖到能融合的道具上：融合 */
  d.fuse = fuseAt(S.run, d.o, c);
  d.swap = !d.ok && !d.fuse && d.tgt ? swapPlan(S.run, ro, d.tgt[0], d.tgt[1], d.from) : null;
  d.el.classList.toggle('bad', !!d.tgt && !d.ok && !d.swap && !d.fuse);
  d.el.classList.toggle('good', !!d.ok || !!d.fuse);
  d.el.classList.toggle('swap', !!d.swap);
  dragLit(d);
  const sh = $('shop');
  if (sh) sh.classList.toggle('sellhot', d.from !== 'shop' && inside(sh, d.px, d.py));
}
/* 旋轉背包裡的一件（旋轉鈕、右鍵）：照順時針試下一個放得下的方向 */
function rotIt(o) {
  const run = S.run;
  if (shapeOf(o.id).length < 2) return;
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
}
/* 0.1.29 拖曳中旋轉：R 鍵、空白鍵、滑鼠右鍵、滾輪（電腦版不用放下再按旋轉） */
function dragRot(k = 1) {
  const d = V.drag;
  if (!d || !d.on || shapeOf(d.o.id).length < 2) return false;
  d.rot = (d.rot + k + 4) & 3;
  snd('tap');
  dragMove(d);
  return true;
}
document.addEventListener('keydown', ev => {
  if ((ev.key === 'r' || ev.key === 'R' || ev.key === ' ') && dragRot()) ev.preventDefault();
});
/* 拖曳中、或在準備畫面的背包／暫存區／商店上按右鍵：不要跳出瀏覽器選單（右鍵是旋轉） */
document.addEventListener('contextmenu', ev => {
  if ((V.drag && V.drag.on) || (V.scr === 'run' && ev.target.closest('.prep .bag:not(.mini), .bench, .shop')))
    ev.preventDefault();
});
let wheelAt = 0;
document.addEventListener(
  'wheel',
  ev => {
    if (!V.drag || !V.drag.on) return;
    ev.preventDefault();
    if (Date.now() - wheelAt < 150) return;
    wheelAt = Date.now();
    dragRot(ev.deltaY > 0 ? 1 : -1);
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
    shapeOf(d.o.id, d.r, d.o.sm)
      .map(([x, y]) => `<i style="left:${x * (cs + GAP)}px;top:${y * (cs + GAP)}px;width:${cs}px;height:${cs}px"></i>`)
      .join('') +
    `<img src="${itemIcon(d.o.id)}" style="width:${cs * 0.8}px;left:${d.g[0] * (cs + GAP) + cs * 0.1}px;top:${d.g[1] * (cs + GAP) + cs * 0.1}px" alt="">`;
}
/* 找一個放得下的方向：先試原本的方向、再轉 90°／180°／270°；手指底下 c 那格要是道具的一格 */
function autoFit(bag, o, c) {
  for (let i = 0; i < 4; i++) {
    const r = (o.r + i) & 3;
    for (const [gx, gy] of shapeOf(o.id, r, o.sm))
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
  if (d.fuse) fuseToast([fuseInto(run, d.o, d.fuse)]);
  else if (d.ok) {
    if (d.from === 'bench') return placeFromBench(run, run.bench.indexOf(d.o), d.tgt[0], d.tgt[1], d.r);
    d.o.x = d.tgt[0];
    d.o.y = d.tgt[1];
    d.o.r = d.r;
    snd('select');
  } else if (d.swap) {
    /* 交換位置：背包裡互換，或暫存區的換進來、背包那件收進暫存區 */
    const { B } = d.swap;
    if (d.from === 'bag') {
      Object.assign(B, { x: d.swap.x, y: d.swap.y, r: d.swap.r });
      Object.assign(d.o, { x: d.tgt[0], y: d.tgt[1], r: d.r });
    } else {
      const i = run.bench.indexOf(d.o);
      run.bag.items = run.bag.items.filter(q => q !== B);
      run.bench[i] = B;
      Object.assign(d.o, { x: d.tgt[0], y: d.tgt[1], r: d.r });
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
  fuseToast(fuseAll(run));
  syncShrink(run);
  V.sel = null;
  save();
  render();
}
/* 從商店拖出來：放進背包（買下）、放到暫存區（買下），其他地方不算 */
function dropShop(run, d, ev) {
  V.noClick = true;
  setTimeout(() => (V.noClick = false), 50);
  let res = null;
  if (d.fuse) {
    /* 0.1.28 從商店直接拖到道具上：買下就融合 */
    const before = new Set(run.bench.filter(Boolean).map(o => o.u));
    res = buyItem(run, d.sk);
    const o = typeof res === 'object' && run.bench.find(q => q && !before.has(q.u) && q.id === d.o.id);
    if (o && canFuse(o, d.fuse)) res.merged.fused = [fuseInto(run, o, d.fuse)];
  } else if (d.ok || (d.swap && d.swap.toBench)) res = buyToBag(run, d.sk, d.tgt[0], d.tgt[1], d.r, d.swap && d.swap.B);
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
    fuseToast(res.merged.fused);
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
  fitZoom();
  if (!B && !V.drag && !typing()) render();
});
/* 0.1.25 電腦版放大：寬 1040 以上（跟 CSS 的兩欄版面同一個寬度）整個介面等比例放大（CSS 變數 --z，給 #app、對話框、影子的 zoom 用），手機維持 1 */
function fitZoom() {
  V.z = innerWidth >= 1040 ? Math.max(1, Math.min(1.6, innerWidth / 1040, innerHeight / 660)) : 1;
  document.documentElement.style.setProperty('--z', V.z);
}
fitZoom();
