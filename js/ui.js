/* 塞令老師 · 畫面：首頁、準備（背包、暫存區、商店）、戰鬥播放、結算、三選一、百科、說明、設定；拖曳擺放 */
'use strict';
let S = null, // 存檔（main.js）
  B = null; // 播放中的戰鬥
const V = { scr: 'home', sel: null, drag: null }; // 畫面狀態（不存檔）
/* ================= 小工具 ================= */
/* 0.1.87 提示從上面滑下來、往上收（同一條路，.on） */
function toast(t) {
  const el = $('toast');
  el.textContent = t;
  el.classList.add('on');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('on'), 1800);
}
/* 0.1.96 手機誤按上一頁：網址紀錄多墊一層（要在玩家點過畫面之後墊，不然瀏覽器會略過），上一頁先在遊戲裡處理：
   關掉對話框、說明卡 → 圖鑑、設定這類頁面回首頁 → 對局中問要不要回首頁（對局會保留）→ 首頁 2 秒內再按一次才真的離開 */
const backGuard = () => V.guard || ((V.guard = 1), history.pushState({ g: 1 }, ''));
document.addEventListener('pointerdown', backGuard, true);
addEventListener('popstate', () => {
  V.guard = 0;
  const m = $('modal');
  if (m && !m.hidden) return void (m.hidden = true);
  if (V.sel && V.scr === 'run') return sheetOut();
  if (V.scr !== 'home' && V.scr !== 'run') return go('home');
  if (V.scr === 'run' && S.run)
    return showDlg('回首頁？', '<p class="c-dim">對局會保留，首頁按「繼續對局」就能回來。</p>', [
      ['回首頁', () => go('home')],
      ['繼續玩', () => {}]
    ]);
  if (Date.now() - (V.backT || 0) < 2000) return history.back();
  V.backT = Date.now();
  toast('再按一次上一頁就會離開遊戲');
  history.pushState({ g: 1 }, '');
  V.guard = 1;
});
/* 0.1.95 規則觸發提示：從造成它的元件旁邊冒出一顆小膠囊（不擋點擊），進出走同一條路；
   同一種（k）每局前 2 次才跳（記在 run.hn），之後只剩元件本身的動畫。系統訊息（存檔、錯誤）還是用 toast */
function hint(el, t, k) {
  const run = S.run,
    hn = run && (run.hn = run.hn || {});
  if (!el || !hn || (hn[k] || 0) >= 2) return;
  hn[k] = (hn[k] || 0) + 1;
  const r = el.getBoundingClientRect(),
    z = V.z || 1,
    up = r.top > 80,
    p = document.createElement('div'),
    kf = [
      { transform: `translateY(${up ? 8 : -8}px) scale(.92)`, opacity: 0 },
      { transform: 'none', opacity: 1 }
    ];
  p.className = 'rhint' + (up ? '' : ' dn');
  p.textContent = t;
  Object.assign(p.style, { zoom: 'var(--z,1)', top: (up ? r.top : r.bottom) / z + 'px' });
  document.body.appendChild(p);
  /* 置中在原因上面，但不超出畫面左右 */
  const w = p.offsetWidth / 2 + 8;
  p.style.left = Math.min(Math.max((r.left + r.width / 2) / z, w), innerWidth / z - w) + 'px';
  spr(p, kf);
  setTimeout(() => {
    const a = spr(p, kf.slice().reverse());
    a ? (a.onfinish = () => p.remove()) : p.remove();
  }, 1900);
}
/* 0.1.95 重畫後跟上一次比：規則真的生效了（狂風換新、羈絆過門檻、換階段…）就由賽制的 MODEUI.fx、共用的 ruleFxAll 播提示。
   同一回合的準備畫面才比（換回合、讀檔不算） */
const rfSnap = run => ({
  id: run.seed,
  ri: run.ri,
  st: curRound(run) ? curRound(run).st : 0,
  ph: run.phase,
  shop: run.shop.map(x => (x ? x.id + ':' + (x.t || 1) : '')).join(),
  syn: synView(run.bag).lv,
  wild: synView(run.bag).wild.join(),
  riv: rivers(run.bag).map(R => R.a.u + R.b.u),
  pity: run.shop.map((x, i) => (x && x.pity ? i + x.id : '')).join(''),
  pn: run.pityNote ? run.pityNote.id + run.pityNote.k : '',
  gnt: (petFx(run.bag) || {}).giant,
  fd: run.shop.findIndex(x => x && ITEMI[x.id].fk === 'ing')
});
function ruleFx(run) {
  const was = V.rf,
    now = (V.rf = rfSnap(run));
  if (!was || was.id !== now.id || now.ph !== 'prep') return;
  /* 0.1.99 商店保底：這次商店有保底的那件就在它旁邊提示；想湊的道具被收光或快沒了也提示（換回合也算） */
  if (now.pity && now.pity !== was.pity) {
    const i = run.shop.findIndex(x => x && x.pity);
    hint($q(`.shop .sc[data-sk="${i}"]`), `保底：差 1 件就合成的${ITEMI[run.shop[i].id].n}`, 'pity');
  }
  /* 0.1.103 料理教學：商店出現食材時，在那張卡旁邊提示怎麼煮（每局前 2 次） */
  if (now.fd >= 0 && (now.fd !== was.fd || now.shop !== was.shop))
    hint($q(`.shop .sc[data-sk="${now.fd}"]`), '食材：拖到另一個食材上就能煮成料理', 'food');
  if (now.pn && now.pn !== was.pn) {
    const P = run.pityNote,
      n = ITEMI[P.id].n;
    hint($('shop'), P.k === 'gone' ? `${n}被別人收光了，考慮換別的` : `${n}只剩最後 ${P.n} 件`, 'pool' + P.id + P.k);
  }
  /* 換階段（星象換一條規則）：可能跨過結算畫面，只看階段 */
  if (was.st && was.st !== now.st && modeUI(run).stage) modeUI(run).stage(run);
  if (was.ri !== now.ri || was.ph !== 'prep') return;
  if (modeUI(run).fx) modeUI(run).fx(run, was, now);
  /* 羈絆過門檻（七宗罪）：羈絆列旁邊提示＋音效 */
  const up = now.syn.findIndex((l, i) => l > (was.syn[i] || 0));
  if (up >= 0) {
    snd('select');
    hint($q('.synbar'), `${synName(SYN[up])} ${SYN_AT[now.syn[up] - 1]} 件：羈絆 ${now.syn[up]} 級開啟`, 'syn');
  }
  /* 0.1.96 貪婪的萬能牌換組：金幣從貪婪飛到那一組，那組的件數彈一下 */
  if (now.wild && now.wild !== was.wild) wildFx(now.wild.split(',').map(Number));
  /* 0.1.96 新的星河：流星從一端劃到另一端，河旁邊提示 */
  for (const R of rivers(run.bag)) if (!was.riv.includes(R.a.u + R.b.u)) riverFx(R);
  /* 巨獸化：寵物數量剛好進到 1～2 隻時，寵物和核心彈一下；超過就提示失效 */
  if (now.gnt && !was.gnt) {
    snd('select');
    for (const u of petFx(run.bag).gu) pop(elOf(u));
    pop($q('.fab.core'));
    hint($q('.fab.core'), '巨獸化：寵物傷害 ×2.5、生命 +80', 'giant');
  } else if (now.gnt === false && was.gnt) hint($q('.fab.core'), `寵物超過 2 隻，巨獸化失效`, 'giant0');
}
/* 馴獸師的條件式核心：巨獸化（只有 1～2 隻寵物，跟 bag.js 同一套算法）、獸群首領（最強那隻）；準備畫面標在寵物和核心上 */
function petFx(bag) {
  if (!bag.core) return null;
  const F = compileBag(bag);
  if (!F.giant && !F.alpha) return null;
  const pets = F.weapons.filter(w => w.pet && !w.vw),
    on = F.giant && pets.length >= 1 && pets.length <= 2;
  return {
    n: pets.length,
    giant: F.giant ? on : null,
    gu: on ? pets.map(w => w.u) : [],
    top: (pets.find(w => w.alpha) || {}).u
  };
}
/* 0.1.87 震動跟音效同一格發生（手機支援 navigator.vibrate 才有）：只給放好、買、合成、錯誤這幾個有意義的時刻 */
const HAPT = { select: 8, coin: 12, level: [12, 60, 18], nope: [10, 40, 10] };
const snd = n => {
  if (typeof sfx === 'function') sfx(n);
  if (HAPT[n] && S && S.sfx && navigator.vibrate) navigator.vibrate(HAPT[n]);
};
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
  /* 0.1.51 重製過的核心（icx）用自己指定的圖示，不用舊的 it_c_ 圖 */
  /* 0.1.70 重做的核心圖示（it_核心代號_n）優先 */
  const own = artIconURL('it_' + id + '_n') || (ITEMI[id] && ITEMI[id].icx ? null : artIconURL('it_' + id)),
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
  root.querySelectorAll('canvas[data-anim]').forEach(cv => cv.playing || avFrame(cv, avIdle(cv.dataset.anim)));
}
/* 0.1.62 會動的頭像（AVANIM）：戰鬥中用整格 64×64 的動畫圖，平常停在第 1 格，武器出手時播一次攻擊 */
const avCv = (av, cls = '') =>
  AVANIM[av]
    ? `<canvas class="spr anim ${cls}" data-anim="${av}" width="64" height="64"></canvas>`
    : sprCv('a_' + av, cls);
/* 0.1.68 站姿是哪一格（AVANIM 的 i，沒寫就是第 1 格） */
const avIdle = av => (AVANIM[av] && AVANIM[av].i) || 1;
function avFrame(cv, k) {
  const a = artImg(cv.dataset.anim + '_atk');
  if (!a || !a.im.complete || !a.im.naturalWidth) return;
  const x = cv.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.clearRect(0, 0, 64, 64);
  x.drawImage(a.im, a.r[0] + ((k - 1) % 4) * 64, a.r[1] + fl((k - 1) / 4) * 64, 64, 64, 0, 0, 64, 64);
}
function avPlay(sp) {
  const cv = sp && sp.querySelector('canvas[data-anim]');
  if (!cv || cv.playing) return;
  const A = AVANIM[cv.dataset.anim];
  cv.playing = 1;
  let i = 0;
  const step = () => {
    if (i >= A.f.length) {
      cv.playing = 0;
      return avFrame(cv, avIdle(cv.dataset.anim));
    }
    const k = A.f[i++];
    avFrame(cv, k);
    setTimeout(step, (A.s.includes(k) ? 55 : i <= 3 ? 90 : 75) / (S.speed || 1));
  };
  step();
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
    /* 0.1.62 對話框不會跟著重畫：裡面標了 data-iid 的道具圖重新換一次（打開時大圖還沒載好的是星星） */
    for (const im of document.querySelectorAll('#modal img[data-iid]')) im.src = itemIcon(im.dataset.iid);
  }, 80);
}
const stars = n => '★'.repeat(n);
const tierTxt = t => ['', '', ' Ⅱ', ' Ⅲ'][t];
const tierBadge = t => (t > 1 ? `<b class="tier">${t === 2 ? 'Ⅱ' : 'Ⅲ'}</b>` : '');
/* 0.1.52 印記：格子右下角一個字（顏色是 .sg0～.sg4） */
/* 0.1.96 七宗罪的角標（只有七宗罪賽制顯示）：一個字＋那一組的顏色 */
const sinTag = k => `<i class="sgb" style="--sgc:${SYN[SYNI[k]].c}">${SYN[SYNI[k]].s}</i>`;
const sinBadge = id => (S.run && S.run.bag.sin && ITEMI[id] ? (ITEMI[id].sins || []).map(sinTag).join('') : '');
/* 0.1.59 詛咒寶藏：格子左下角的「咒」 */
const cuBadge = cu => (!cu || !CURSES[cu[0]] ? '' : `<i class="cub" aria-label="詛咒">咒</i>`);
/* 0.1.86 道具格子的四個角統一（背包、暫存、商店都一樣）：左上＝階數、右上＝格數小圖（背包裡看形狀就知道，不放）、
   左下＝融合的道具、右下＝其他（印記、詛咒、加成＋，排成一排）。這是右下那一排 */
const brHTML = (o, x = '') => {
  const s = sinBadge(o.id) + cuBadge(o.cu) + x;
  return s ? `<span class="cbr">${s}</span>` : '';
};
/* 道具詳細的詛咒那一行（層數 × 每層數值） */
/* 0.1.60 祝福（綠）＋詛咒（紫）各一行；數值是這件實際的（層數、星級都算進去） */
const cuLineHTML = o => {
  const b = o.bl && BLESS[o.bl[0]],
    c = o.cu && CURSES[o.cu[0]];
  return (
    (b ? `<p class="bll">✦ 祝福・${b.n}${o.bl[1] > 1 ? ` ×${o.bl[1]}` : ''}：${b.d(blV(o))}</p>` : '') +
    (c ? `<p class="cul">${cuBadge(o.cu)}詛咒・${c.n}${o.cu[1] > 1 ? ` ×${o.cu[1]}` : ''}：${c.d(cuV(o))}</p>` : '')
  );
};
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
/* 0.1.55 音效開關（0.1.88 起只在戰鬥畫面；準備時在選單、平常在設定） */
const sfxBtn = () =>
  `<button class="iconbtn sfxb" data-act="sfxTog" aria-label="${S.sfx ? '關掉音效' : '打開音效'}" aria-pressed="${!!S.sfx}">${S.sfx ? '🔊' : '🔇'}</button>`;
/* ================= 畫面切換 ================= */
function render() {
  if (!S) return;
  applyTheme();
  const run = S.run,
    app = $('app');
  let html = '';
  document.querySelectorAll('.coach').forEach(e => e.remove());
  if (run && run.tutor) tutPrep(run);
  if (V.scr === 'run' && run) {
    if (run.phase === 'battle') return renderBattle();
    if (run.phase === 'end') html = endHTML(run);
    else
      html =
        prepHTML(run) +
        (run.phase === 'result' ? resultHTML(run) : '') +
        (run.phase === 'pick' ? pickHTML(run) : '') +
        (run.phase === 'prep'
          ? revealHTML(run) + mdPickHTML(run) + relicHTML(run) + tarotHTML(run) + legNewHTML(run) + tutDoneHTML(run)
          : '') +
        (run.phase === 'mode' ? modeHTML(run) : '') +
        (run.phase === 'cls' ? clsHTML(run) : '');
  } else if (V.scr === 'codex') html = codexHTML();
  else if (V.scr === 'help') html = helpHTML();
  else if (V.scr === 'mstat') html = mstatHTML();
  else if (V.scr === 'settings') html = settingsHTML();
  else html = homeHTML();
  /* 0.1.32 重畫時保留打開的折疊（details[data-k]）：圖鑑打開時一直在載大圖、每載好一張就重畫，之前一打開馬上被收起來 */
  const open = [...app.querySelectorAll('details[data-k][open]')].map(d => d.dataset.k),
    oldOvl = [...app.querySelectorAll('.ovl')],
    scr = V.scr + (run ? run.phase === 'battle' : '');
  app.innerHTML = html;
  /* 0.1.87 換畫面時淡入（同一個畫面重畫不動） */
  if (V.lastScr !== scr && V.lastScr != null)
    app.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' });
  V.lastScr = scr;
  ovlFx(oldOvl);
  for (const k of open) {
    const d = app.querySelector(`details[data-k="${k}"]`);
    if (d) d.open = true;
  }
  paintSprites(app);
  fitBag();
  sheetIn();
  if (V.scr === 'run' && run && run.phase !== 'end') tick('.top .gold', run.gold, 'g'), tick('.top .hpt', run.hp, 'h');
  /* 教學關的框：說明卡、對話框滑進來後位置才對，晚一點再量一次 */
  if (run && (run.tutor || (V.scr === 'run' && seenK(run).length))) coachFx(), setTimeout(coachFx, 550);
  if (V.scr === 'run' && run) ruleFx(run);
  /* 0.1.59 開場賽制轉盤 */
  if (V.scr === 'run' && run && run.phase === 'mode') wheelGo(run);
  /* 0.1.55 百科：重畫後照搜尋欄再篩一次 */
  if (V.scr === 'codex') cxFilter();
}
const go = scr => {
  V.scr = scr;
  V.sel = null;
  render();
};
/* ================= 首頁 ================= */
/* 0.1.92 玩家等級：Lv＋經驗條＋下一級解鎖什麼（首頁）；結束畫面多「這局 +多少經驗、升級解鎖了什麼」 */
const unlockName = u => (u[1] === 'm' ? '賽制・' + MODEI[u[2]].n : '道具池・' + POOLTHI[u[2]].n);
function lvHTML() {
  const L = lvInfo(S.xp),
    nx = UNLOCK.find(u => u[0] > L.lv);
  return `<div class="lvl"><b>Lv ${L.lv}</b><i class="xpb"><i style="width:${(L.cur / L.need) * 100}%"></i></i><small>${L.cur}／${L.need}</small></div>${nx ? `<small class="c-dim">Lv ${nx[0]} 解鎖${unlockName(nx)}</small>` : ''}`;
}
function xpHTML(run) {
  if (run.xp0 == null || run.tutor) return '';
  const a = lvInfo(run.xp0),
    b = lvInfo(S.xp),
    ups = UNLOCK.filter(u => u[0] > a.lv && u[0] <= b.lv);
  return `<div class="card xpc"><div class="lvl"><b>Lv ${b.lv}</b><i class="xpb"><i style="width:${(b.cur / b.need) * 100}%"></i></i><small class="c-good">+${S.xp - run.xp0} 經驗</small></div>${
    b.lv > a.lv
      ? `<p class="c-gold">升級了！</p>${ups.map(u => `<p>解鎖${unlockName(u)}</p>`).join('')}${ups.length ? '<button class="btn" data-act="go" data-k="settings">到設定打開</button>' : ''}`
      : ''
  }</div>`;
}
function homeHTML() {
  /* 0.1.74 打完的那局（phase end）不算進行中：首頁直接是「開始對戰」 */
  const run = S.run && S.run.phase !== 'end' ? S.run : null;
  return `<div class="home hm">

    <div class="logo"><b>塞令老師</b><small>背包自動對戰</small></div>
    <div class="hcol hc1"><div class="card prof">${sprCv('a_' + S.av, 'big')}<div><b>${esc(S.name)}</b>${lvHTML()}${rankHTML()}<div class="kv3"><span>場數<b>${S.games || 0}</b></span><span>最佳<b>${S.best < 9 ? '第 ' + S.best : '—'}</b></span><span>第 1 名<b>${(S.hist || []).filter(x => x.place === 1).length}</b></span></div></div></div>
    ${
      run || S.tutDone
        ? `<button class="btn pri big" data-act="play">${run ? `${run.tutor ? '繼續教學' : '繼續對局'}（${curRound(run) ? curRound(run).id : ''}）` : '開始對戰'}</button>`
        : '<button class="btn pri big" data-act="tutStart">開始教學</button><p class="sub tutn">第一次玩先打一場教學關（3 回合），打完開放正式對戰</p>'
    }
    <div class="g3"><button class="btn" data-act="go" data-k="help">怎麼玩</button><button class="btn" data-act="go" data-k="codex">百科</button><button class="btn" data-act="go" data-k="settings">設定</button></div>
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
    }</div>
    <div class="hcol hc2">${boardHTML()}</div>
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
              `<div class="lbr${i === me ? ' me' : ''}"><b class="no p${i + 1}">${i + 1}</b>${sprCv('a_' + (AVATARS.some(a => a[0] === x.avatar) ? x.avatar : avFallback(x.name || x.avatar)))}<span><b>${esc(x.name || '無名')}</b><small>${rankName(rankOf(x.rating))}・${x.games} 場・第 1 名 ${x.wins}</small></span><b class="v">${x.rating}</b></div>`
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
  return `<h3>排行榜</h3>${tabs}${body}<button class="btn" data-act="go" data-k="mstat">詳細統計：賽制、道具池的職業勝率與核心</button>`;
}
/* 0.1.77 統計頁：照賽制、道具池（可以兩個都選）篩選，看各職業的勝率、各職業核心的選擇率（雲端的對局；真人少時連電腦對局） */
function mstatHTML() {
  const f = (V.mst = V.mst || { m: '', t: '', tab: 'c', cls: CLASSES[0].id }),
    key = (f.m || '*') + '|' + (f.t || '*'),
    D = STAT[key];
  if (ghostOK() && (!D || (!D.busy && Date.now() - D.at > 60000)))
    ghostStats(f.m, f.t).then(() => V.scr === 'mstat' && render());
  const opt = (k, list, v) =>
      `<select class="inp" data-chg="mst" data-k="${k}">${list.map(([c, n]) => `<option value="${c}"${c === v ? ' selected' : ''}>${n}</option>`).join('')}</select>`,
    filt = `<div class="mstf">${opt('m', [['', '全部賽制'], ...MODES.filter(m => m.w > 0).map(m => [m.k, m.n])], f.m)}${opt(
      't',
      [['', '全部道具池'], ...POOLTH.map(x => [x.k, x.n])],
      f.t
    )}</div>`,
    tabs = `<div class="lbt"><button class="btn sm" data-act="mstTab" data-k="c" aria-pressed="${f.tab === 'c'}">職業勝率</button><button class="btn sm" data-act="mstTab" data-k="k" aria-pressed="${f.tab === 'k'}">核心選擇率</button></div>`;
  let body;
  if (!ghostOK()) body = '<p class="empty">連上雲端後才看得到統計</p>';
  else if (!D || (D.busy && !D.c)) body = '<p class="empty">讀取中…</p>';
  else if (D.err && !D.c) body = '<p class="empty">統計暫時拿不到，等一下再試</p>';
  else if (f.tab === 'c') {
    const rows = (D.c || []).filter(x => CLSI[x.cls]).sort((a, b) => a.avg_place - b.avg_place);
    body = rows.length
      ? `<div class="lb">${rows
          .map(
            (x, i) =>
              `<div class="lbr"><b class="no p${i + 1}">${i + 1}</b><img src="${artIconURL(CLSI[x.cls].ic) || iconURL('star')}" alt=""><span><b>${CLSI[x.cls].n}</b><small>${x.games} 場・平均第 ${(+x.avg_place).toFixed(2)} 名</small></span><b class="v">${Math.round((x.wins / x.games) * 100)}%<small>第 1 名</small></b></div>`
          )
          .join('')}</div>`
      : '<p class="empty">這個組合還沒有對局</p>';
  } else {
    const rows = (D.k || [])
      .filter(x => x.cls === f.cls && ITEMI[x.core])
      .sort((a, b) => b.picked / Math.max(1, b.offered) - a.picked / Math.max(1, a.offered));
    body = `${opt(
      'cls',
      CLASSES.map(c => [c.id, c.n]),
      f.cls
    )}${
      rows.length
        ? `<div class="lb">${rows
            .map(
              x =>
                `<div class="lbr"><img src="${itemIcon(x.core)}" alt=""><span><b>${ITEMI[x.core].cls === f.cls ? ITEMI[x.core].n.split('・').pop() : ITEMI[x.core].n}</b><small>出現 ${x.offered} 次・拿著 ${x.held} 局${x.avg_place != null ? `・平均第 ${(+x.avg_place).toFixed(2)} 名` : ''}</small></span><b class="v">${x.offered ? Math.round((x.picked / x.offered) * 100) + '%' : '—'}<small>選擇率</small></b></div>`
            )
            .join('')}</div>`
        : '<p class="empty">這個組合還沒有這個職業的核心紀錄</p>'
    }`;
  }
  return `<div class="page"><div class="ptop"><button class="iconbtn" data-act="home" aria-label="返回">‹</button><b>詳細統計</b></div>
    ${filt}${tabs}${body}<p class="sub">最近 30 天打完的對局${D && D.seed ? '・真人還不多，含電腦對局' : ''}；局數少的時候差距大多是運氣</p></div>`;
}
async function startRun() {
  audioOn();
  $('app').innerHTML =
    `<div class="home"><div class="logo"><b>配對中…</b><small>尋找牌階相近的對手</small></div></div>`;
  /* 0.1.69 先抽賽制、主題，再配同一個賽制＋主題的快照對手 */
  S.run = newRun();
  joinRivals(S.run, await ghostRivals(S.rating, S.run.mode, S.run.theme));
  S.run.ver = VER;
  V.scr = 'run';
  V.sel = null;
  save();
  render();
  ghostBegin(S.run);
}
/* ================= 準備畫面 ================= */
const GAP = 4;
/* 0.1.58 電腦版（寬 1040 以上）：背包在中間那欄，照那欄的寬和視窗的高放大（跟 CSS 的三欄寬度一致） */
const DESK = () => innerWidth >= 1040;
const deskW = () => Math.min(innerWidth / V.z, 1360) - 32;
/* 0.1.86 手機：背包格子照「螢幕剩下的高度」縮放，背包、暫存、商店、開戰一個螢幕放得下（不用上下捲）；
   V.fitH 是背包可以用的高度（render 後 fitBag 量出來，不一樣就再畫一次） */
const FIT_MIN = 32;
function fitBag() {
  const bag = $('bag'),
    pr = document.querySelector('.prep');
  if (DESK() || !bag || !pr || V.scr !== 'run') return;
  const pad = parseFloat(getComputedStyle($('app')).paddingBottom) || 0,
    over = pr.getBoundingClientRect().bottom + scrollY + pad - innerHeight,
    h = Math.max(0, bag.offsetHeight - over);
  if (Math.abs(h - (V.fitH || 0)) < 2) return;
  V.fitH = h;
  /* 格子大小變了才再畫（已經縮到最小、或本來就放得下時不會一直重畫） */
  if (cellSize(STG_W, STG_H) + 'px' !== bag.style.getPropertyValue('--cs')) render();
}
function cellSize(w, h = w) {
  if (DESK()) {
    const side = innerWidth < 1240 ? 300 + 340 : 340 + 380,
      cw = deskW() - side - 48 - 24,
      ch = innerHeight / V.z - 190;
    return Math.max(30, Math.min(w <= 3 ? 104 : 84, fl((cw - (w - 1) * GAP) / w), fl((ch - (h - 1) * GAP) / h)));
  }
  return Math.max(
    30,
    Math.min(
      w <= 3 ? 64 : 52,
      fl((Math.min(innerWidth, 480) - 32 - (w - 1) * GAP) / w),
      V.fitH ? Math.max(FIT_MIN, fl((V.fitH - (h - 1) * GAP) / h)) : 99
    )
  );
}
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
  return `<div class="rvdet s${I.star}"><div class="dh"><img src="${itemIcon(o.id)}" alt=""><div><b style="color:${I.fk ? 'var(--food)' : STARC[I.star]}">${esc(fuName(o))}${tierTxt(o.t)}</b><small>${I.fk ? FKN[I.fk] : stars(I.star)}・${tags}${I.core ? '' : `・${shapeO(o).length} 格`}</small></div></div><p class="dls">${descLines(itemDesc(o.id, o.t))}</p>${cuLineHTML(o)}${o.m ? mod5HTML(o.m) : ''}${o.m2 ? mod5HTML(o.m2) : ''}${aff ? `<p class="c-gold">升階詞綴：${aff.n}</p>` : ''}${abHTML(o)}${mdLineHTML(o)}${o.ex ? `<p class="c-tf">✦ 煉成：${dsc(brewTxt(o.ex))}</p>` : ''}${o.hh ? `<p class="c-tf">✦ 已經累積生命 +${o.hh}</p>` : ''}${o.sc && ITEMI[o.sc] ? `<p class="c-tf">✦ 融入了${ITEMI[o.sc].n}：${dsc(itemDesc(o.sc))}</p>` : ''}${T ? `<p class="c-tf">✦ 融合了${ITEMI[o.f].n}${tierTxt(o.ft || 1)}：${[T.add && `變成${T.add.map(x => TAGN[x]).join('、')}系`, modTxt(scaleMod(T.m, o.ft || 1))].filter(Boolean).join('、')}</p>` : ''}</div>`;
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
    /* 0.1.74 他的核心（核心欄，含融入的第二個）：點了看詳細；拿掉下方的道具清單（點背包裡的格子看） */
    const co = bag.core && ITEMI[bag.core.id] ? bag.core : null,
      so = [...bag.items, co].find(o => o && o.u === sel);
    body = `<p class="sub">${cls ? cls.n + '・' : ''}${r.id} 的背包・${bag.items.length} 件・點道具看詳細</p>${
      co
        ? `<div class="rvit rvco"><button class="s5${co.u === sel ? ' sel' : ''}" data-rvu="${co.u}"><img src="${itemIcon(co.id)}" alt="">${esc(ITEMI[co.id].n)}${co.sc && ITEMI[co.sc] ? `<small>＋${esc(ITEMI[co.sc].n.split('・').pop())}</small>` : ''}</button></div>`
        : ''
    }<div class="bagwrap">${bagHTML(bag, cs, { mini: 1, id: 'rvbag' })}</div>${so ? rvDetHTML(so) : ''}`;
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
/* ================= 0.1.92 教學關 =================
   標準＋巨人國、沒有對手，打 1-1～1-3 三場野怪：選職業 → 把送的道具拖進背包 → 買一件一樣的 → 開戰 →
   1-2 再買一件（3 件一樣合成 Ⅱ 階）→ 1-3 升級背包 → 到 1-4 就完成。每一步把要按的地方框起來（coachStep／coachFx），
   商店第一格固定放職業送的那件（tutPrep）。不建快照、不算分、不給經驗；隨時可以跳過 */
function tutStart() {
  const keep = S.pick;
  S.pick = { m: ['std'], t: ['g'] };
  const run = newRun([]);
  S.pick = keep;
  Object.assign(run, { tutor: 1, ver: VER, mseen: 1, mstep: 1, phase: 'cls' });
  S.run = run;
  V.scr = 'run';
  V.sel = null;
  audioOn();
  save();
  render();
}
function tutPrep(run) {
  if (!run.tutor || run.phase !== 'prep' || run.tutShop === run.ri) return;
  run.tutShop = run.ri;
  run.tutW = run.tutW || (CLSI[run.bag.cls] || {}).st;
  const id = curRound(run).id;
  if (id === '1-3') run.gold = Math.max(run.gold, lvCost(run) + 2);
  else if (run.tutW && ITEMI[run.tutW]) run.shop[0] = { id: run.tutW, t: 1 };
}
function coachStep(run) {
  /* top：說明固定在畫面最上面（不要蓋到三個選項） */
  if (run.phase === 'cls')
    return { t: '先選一個職業：整局都有效，商店會多出這個職業用的道具', s: '.ovl .picks', top: 1 };
  if (run.phase === 'result') return { t: '戰鬥是全自動的。打完了，按「繼續」', s: '.ovl .btn.pri' };
  if (run.phase !== 'prep') return null;
  const id = curRound(run).id,
    buy = t =>
      V.sel === 'shop0'
        ? { t: '按「買」買下它（也可以直接把商店的道具拖進背包）', s: '.det [data-act="buy"]' }
        : { t, s: '.shop .sc[data-sk="0"]' };
  if (id === '1-4') return null;
  if (run.bench.some(Boolean)) return { t: '道具在暫存區：把它拖進上面的背包格子', s: '.bench .bs[data-bu]' };
  if (id === '1-1' && run.bag.items.length < 2 && run.shop[0]) return buy('點商店的道具，先看說明再買');
  if (id === '1-2' && run.shop[0] && ![...run.bag.items, ...run.bench].some(o => o && o.t > 1))
    return buy('3 件一樣的道具會自動合成 Ⅱ 階：買下這件');
  if (id === '1-3' && run.lv < 2)
    return { t: '背包可以升級：越大放越多，商店也越常出高星道具', s: '[data-act="lvup"]' };
  return { t: '擺好了就按「開戰」', s: '[data-act="fight"]' };
}
/* 框起要按的地方（其他地方變暗，但不擋點擊）、旁邊一句話＋跳過 */
function coachFx() {
  document.querySelectorAll('.coach').forEach(e => e.remove());
  const run = S.run,
    c = V.scr === 'run' && run && !V.drag && (run.tutor ? coachStep(run) : firstStep(run));
  if (!c) return;
  const el = document.querySelector(c.s),
    r = el && el.getBoundingClientRect(),
    w = document.createElement('div');
  w.className = 'coach';
  const up = r && r.top > innerHeight / 2;
  w.innerHTML = `${r ? `<i class="cspot" style="left:${r.left - 4}px;top:${r.top - 4}px;width:${r.width + 8}px;height:${r.height + 8}px"></i>` : ''}<div class="cbub" style="${c.top ? 'top:calc(12px + var(--sat))' : r ? (up ? `bottom:${innerHeight - r.top + 14}px` : `top:${r.bottom + 14}px`) : 'top:40%'}"><p>${c.t}</p>${c.k ? `<button class="btn sm" data-act="seenOk" data-k="${c.k}">知道了</button>` : '<button class="btn sm" data-act="tutEnd" data-k="skip">跳過教學</button>'}</div>`;
  document.body.appendChild(w);
}
/* 0.1.95 第一次遇到的賽制、道具池：開局後框起它生效的地方（沒寫 spot 就框規則標籤）＋一句話規則；按「知道了」記在 S.seen（'r:m:賽制'、'r:t:道具池'） */
const seenK = run =>
  [run.mode !== 'std' && 'r:m:' + run.mode, run.theme && 'r:t:' + run.theme].filter(k => k && !S.seen[k]);
function firstStep(run) {
  if (run.phase !== 'prep' || run.pend || run.relq || run.tarq || run.mdq?.length || run.legNew?.length || V.sel)
    return null;
  const k = seenK(run)[0];
  if (!k) return null;
  const m = k[2] === 'm',
    X = m ? MODEI[run.mode] : POOLTHI[run.theme],
    sp = m && modeUI(run).spot;
  return { t: `「${X.n}」${X.s}`, s: (sp && document.querySelector(sp) && sp) || '.rtag', k };
}
/* 到 1-4：完成 */
function tutDoneHTML(run) {
  if (!run.tutor || curRound(run).id !== '1-4') return '';
  return `<div class="ovl"><div class="dlg2 tutd"><b class="big">教學完成！</b><ul class="mrules"><li>正式對戰 6 人一場（其他玩家的背包快照或電腦），生命 ${START_HP}，輸了扣血、歸零淘汰，活到最後是第 1 名</li><li>第 2 階段起會跟其他玩家的背包對打，每階段有首領掉職業核心</li><li>每場打完拿經驗升級；想玩其他賽制和道具池，到設定打開</li></ul><button class="btn pri big" data-act="tutEnd" data-k="play">開始正式對戰</button><button class="btn" data-act="tutEnd" data-k="home">回首頁</button></div></div>`;
}
function tutHTML() {
  if (S.tut >= 3 || (S.run && S.run.tutor)) return '';
  const t = [
    '點商店的道具看說明，或直接把它拖進背包（也可以先買到暫存區）',
    '把暫存區的道具拖進背包格子（點一下可以旋轉、賣出；拖到別的道具上可以交換位置）',
    '擺好就按右下角的按鈕，戰鬥全自動！'
  ][S.tut];
  return `<div class="tut">💡 ${t}</div>`;
}
/* 0.1.103 食物的框（自己的顏色，大料理加星星邊框） */
const FKN = { ing: '食材', mix: '料理', semi: '半成品', big: '大料理' };
/* 0.1.108 還能往上合的（食材、半成品）青色雙框；不能再合的料理橘色；大料理金框＋星星 */
const fdc = id => {
  const k = ITEMI[id].fk;
  return k ? (k === 'big' ? ' fd fdb' : k === 'ing' || k === 'semi' ? ' fd fdu' : ' fd') : '';
};
function bagHTML(bag, cs, opt = {}) {
  /* 0.1.96 準備畫面（opt.stage）畫到最大背包：還沒開的格子是整理區（虛線），放在那裡的道具紅框 */
  const gw = opt.stage ? STG_W : bag.w,
    gh = opt.stage ? STG_H : bag.h,
    W = gw * cs + (gw - 1) * GAP,
    H = gh * cs + (gh - 1) * GAP,
    mods = opt.mods,
    sel = V.sel && (bag.items.find(o => o.u === V.sel) || (opt.stage && (bag.st || []).find(o => o.u === V.sel))),
    lit = new Set(),
    src = new Set(sel && mods && mods.get(sel.u) ? mods.get(sel.u).map(x => x.from) : []);
  if (sel && mods) for (const [u, l] of mods) if (l.some(x => x.from === sel.u)) lit.add(u);
  let h = `<div class="bag${opt.mini ? ' mini' : ''}${sel ? ' hassel' : ''}${opt.stage ? ' stg' : ''}" id="${opt.id || 'bag'}" data-gw="${gw}" style="width:${W}px;height:${H}px;--cs:${cs}px">`;
  const rng = sel && !opt.mini ? rngOf(bag, sel) : new Map(),
    g = bagGrid(bag),
    /* 0.1.98 空著的凹口一直發光（塞進去才有加成）；遺物生效的格子塗遺物的顏色 */
    hole = new Set(opt.mini ? [] : bag.items.flatMap(o => holeOf(o)).map(p => p + '')),
    rz = (x, y) => !opt.mini && (bag.rel || []).find(k => RZ[k] && RZ[k][0](x, y, bag));
  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++) {
      const z = x < bag.w && y < bag.h && rz(x, y);
      h += `<i class="cell${x >= bag.w || y >= bag.h ? ' lock' : rng.get(x + ',' + y) === 'on' ? ' rng' : hole.has(x + ',' + y) && g[y][x] == null ? ' hole' : z ? ' rz' : ''}" style="left:${x * (cs + GAP)}px;top:${y * (cs + GAP)}px${z ? ';--rz:' + RZ[z][1] : ''}"></i>`;
    }
  /* 0.1.96 星河：兩個星座之間畫一條淡光帶（data-rv 給成形動畫找） */
  if (!opt.mini)
    for (const R of rivers(bag)) {
      const [ax, ay] = cellsOf(R.a)[0],
        [bx, by] = cellsOf(R.b)[0],
        st = cs + GAP,
        hz = ay === by;
      h += `<i class="rvb${hz ? ' h' : ' v'}" data-rv="${R.a.u + R.b.u}" style="left:${ax * st + cs / 2}px;top:${ay * st + cs / 2}px;${hz ? `width:${(bx - ax) * st}px` : `height:${(by - ay) * st}px`}"></i>`;
    }
  const crown = opt.mini ? null : crownOf(bag),
    pf = opt.mini ? null : petFx(bag),
    st = new Set(opt.stage ? (bag.st || []).map(o => o.u) : []);
  for (const o of [...bag.items, ...(opt.stage ? bag.st || [] : [])]) {
    const I = ITEMI[o.id],
      cs0 = cellsOf(o),
      mx = Math.min(...cs0.map(p => p[0])),
      my = Math.min(...cs0.map(p => p[1])),
      Mx = Math.max(...cs0.map(p => p[0])),
      My = Math.max(...cs0.map(p => p[1])),
      bw = (Mx - mx + 1) * (cs + GAP) - GAP,
      bh = (My - my + 1) * (cs + GAP) - GAP,
      buf = mods && mods.get(o.u) && mods.get(o.u).length,
      tfd = buf && mods.get(o.u).some(x => x.w === 'tf'),
      bt = opt.mini ? '' : bufTag(bag, o, mods);
    h += `<div class="it s${I.star}${fdc(o.id)}${st.has(o.u) ? ' out' : ''}${V.sel === o.u ? ' sel' : ''}${lit.has(o.u) ? ' lit' : ''}${src.has(o.u) ? ' src' : ''}${I.core ? ' core' : ''}" data-u="${o.u}" style="left:${mx * (cs + GAP)}px;top:${my * (cs + GAP)}px;width:${bw}px;height:${bh}px">${cs0
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
      )}<img src="${itemIcon(o.id)}" alt="${fuName(o)}"${o.f && ITEMI[o.f] ? ` class="fum" style="--fg:${fuColor(o)}"` : ''}>${cnr(
      cs0,
      mx,
      my,
      cs,
      [1, 1],
      tierBadge(o.t)
    )}${cnr(cs0, mx, my, cs, [1, -1], o.f && ITEMI[o.f] ? `<img class="fui" src="${itemIcon(o.f)}" alt="">` : o.sc && ITEMI[o.sc] ? `<img class="fui" src="${itemIcon(o.sc)}" alt="">` : '')}${cnr(
      cs0,
      mx,
      my,
      cs,
      [-1, -1],
      brHTML(
        o,
        (opt.tar && opt.tar.has(o.u) ? `<b class="buf tr">${TAROTI[tarOf(bag.tar).T.k]}</b>` : '') +
          (crown === o.u ? '<b class="buf cr">♛</b>' : '') +
          (pf && pf.gu.includes(o.u) ? '<b class="buf gt" title="巨獸化">巨</b>' : '') +
          (pf && pf.top === o.u ? '<b class="buf cr" title="獸群首領">王</b>' : '') +
          (bt || (buf && !opt.mini ? (tfd ? '<b class="buf tfm">✦</b>' : '<b class="buf">+</b>') : ''))
      )
    )}</div>`;
  }
  if (mods && !opt.mini) h += linkHTML(bag, mods, cs, sel);
  /* 0.1.4 選中的道具右上角放旋轉鈕，不用到下面說明區按 */
  if (sel && !opt.mini && shapeO(sel).length > 1) {
    const c = cellsOf(sel),
      rx = (Math.max(...c.map(p => p[0])) + 1) * (cs + GAP) - GAP,
      ry = Math.min(...c.map(p => p[1])) * (cs + GAP);
    h += `<button class="rotb" data-act="rot" aria-label="旋轉" style="left:${Math.min(rx - 16, W - 22)}px;top:${Math.max(ry - 12, -10)}px">↻</button>`;
  }
  return h + '</div>';
}
/* 0.1.96 傲慢的王冠戴在哪件（跟 sim.js 同一套挑法：階數最高的傲慢武器，同階看星級） */
function crownOf(bag) {
  if (!bag.sin || !synView(bag).lv[SYNI.pride]) return null;
  const c = bag.items
    .filter(o => ITEMI[o.id].dmg && !ITEMI[o.id].block && (ITEMI[o.id].sins || []).includes('pride'))
    .sort((a, b) => (b.t || 1) - (a.t || 1) || ITEMI[b.id].star - ITEMI[a.id].star)[0];
  return c ? c.u : null;
}
/* 0.1.96 星河成形：流星從一端劃到另一端，光帶亮起來，旁邊提示「星河：牡羊 × 獅子」 */
function riverFx(R) {
  const band = $q(`#bag .rvb[data-rv="${R.a.u + R.b.u}"]`),
    a = elOf(R.a.u),
    b = elOf(R.b.u);
  if (!band || !a || !b) return;
  snd('select');
  hint(band, `星河：${ZODS[ITEMI[R.a.id].zod].n} × ${ZODS[ITEMI[R.b.id].zod].n}`, 'riv');
  if (calm()) return;
  const ra = a.getBoundingClientRect(),
    rb = b.getBoundingClientRect(),
    m = document.createElement('i');
  m.className = 'meteor';
  Object.assign(m.style, { left: ra.left + ra.width / 2 + 'px', top: ra.top + ra.height / 2 + 'px' });
  document.body.appendChild(m);
  const an = m.animate(
    [
      { transform: 'translate(-50%,-50%) scale(1.4)', opacity: 1 },
      {
        transform: `translate(calc(-50% + ${rb.left - ra.left}px),calc(-50% + ${rb.top - ra.top}px)) scale(.6)`,
        opacity: 0.2
      }
    ],
    { duration: 520, easing: 'cubic-bezier(.3,.7,.4,1)' }
  );
  an.onfinish = () => m.remove();
  band.animate(
    [
      { opacity: 0.2, filter: 'brightness(1)' },
      { opacity: 1, filter: 'brightness(1.8)', offset: 0.6 },
      { opacity: 0.45, filter: 'brightness(1)' }
    ],
    {
      duration: 700,
      easing: 'ease-out'
    }
  );
}
/* 0.1.96 貪婪的萬能牌換組：金幣從羈絆列的貪婪飛到那一組，那組的件數彈一下 */
function wildFx(to) {
  const g = $q(`.synbar .syi[data-si="${SYNI.greed}"] img`);
  for (const i of to) {
    const t = $q(`.synbar .syi[data-si="${i}"]`);
    if (!g || !t) continue;
    snd('coin');
    const a = flyImg(g.src, g.getBoundingClientRect(), t.getBoundingClientRect(), 1),
      done = () => pop(t);
    a ? a.finished.then(done, done) : done();
  }
}
/* 0.1.98 法老王的遺物：看位置的遺物生效在哪些格子（判斷、顏色；遺物列的圖示框同色） */
const RZ = {
  scarab: [(x, y, b) => y === b.h - 1, '#5fd3c4'],
  horus: [(x, y) => y === 0, '#7fb8ff'],
  feather: [(x, y, b) => (x === 0 || x === b.w - 1) && (y === 0 || y === b.h - 1), '#ffe27a'],
  pyramid: [(x, y, b) => x > 0 && y > 0 && x < b.w - 1 && y < b.h - 1, '#ffb15a']
};
/* 0.1.98 塔羅牌只作用在特定道具的（皇帝：佔最多格的武器；戀人：每秒傷害最高的兩把；高塔逆位：星級最高、整場不出手的那把）：
   那幾件加塔羅編號角標。跟 bag.js 的 tarotF、compileBag 同一套挑法 */
function tarAff(bag) {
  const TK = bag.tar,
    out = new Set();
  if (!['emperor', 'lovers', 'lovers_r', 'tower_r'].includes(TK)) return out;
  if (TK === 'tower_r') {
    const t = bag.items
      .filter(o => ITEMI[o.id].dmg && !ITEMI[o.id].block)
      .sort((a, b) => ITEMI[b.id].star * 10 + b.t - (ITEMI[a.id].star * 10 + a.t))[0];
    if (t) out.add(t.u);
    return out;
  }
  const ws = compileBag(bag).weapons.filter(w => !w.vw && bag.items.some(o => o.u === w.u)),
    dps = w => (w.dmg[0] + w.dmg[1]) / w.cd,
    cells = w => shapeO(bag.items.find(o => o.u === w.u)).length;
  if (TK === 'emperor')
    ws.sort((a, b) => cells(b) - cells(a) || b.star - a.star)
      .slice(0, 1)
      .forEach(w => out.add(w.u));
  else
    ws.sort((a, b) => dps(b) - dps(a))
      .slice(0, 2)
      .forEach(w => out.add(w.u));
  return out;
}
/* 0.1.96 加成角標寫出是什麼、有多少：被幾個棋子影響（♞2）、森林道具旁邊有幾件（🌿3，0 件也顯示，提醒要擠）、被星座染色（✶） */
function bufTag(bag, o, mods) {
  const I = ITEMI[o.id],
    l = (mods && mods.get(o.u)) || [],
    pc = l.filter(x => x.w === 'pc').length;
  if (l.some(x => x.w === 'tf')) return '';
  if (pc) return `<b class="buf n">♞${pc}</b>`;
  if (I.perAdj) {
    const n = bag.items.filter(q => q !== o && adjacent(o, q)).length;
    return `<b class="buf n${n ? '' : ' z'}">🌿${n}</b>`;
  }
  const z = l.find(x => {
    const q = bag.items.find(i => i.u === x.from);
    return q && ITEMI[q.id].zod;
  });
  return z ? '<b class="buf zd">✶</b>' : '';
}
/* 0.1.96 範圍提示：這件會影響到哪些格子（Map 'x,y' → 'on' 空格／'hit' 被影響的道具）：
   棋子照走法（每個方向碰到第一件就停）、凹口、森林／齒輪／連鎖／星座的相鄰格。o 可以是拖曳中的落點（不在背包裡） */
function rngOf(bag, o) {
  const I = ITEMI[o.id],
    out = new Map(),
    g = bagGrid(bag),
    mine = new Set(cellsOf(o).map(p => p + '')),
    put = (x, y) => {
      if (x < 0 || y < 0 || x >= bag.w || y >= bag.h || mine.has([x, y] + '')) return undefined;
      const u = g[y][x] === o.u ? null : g[y][x];
      out.set(x + ',' + y, u != null ? 'hit' : 'on');
      return u;
    };
  if (I.pc) {
    const D = PC_DIR[I.pc.k] || {},
      [px, py] = cellsOf(o)[0];
    for (const [dx, dy] of D.ray || [])
      for (let k = 1; k < 9; k++) {
        const x = px + dx * k,
          y = py + dy * k;
        if (x < 0 || y < 0 || x >= bag.w || y >= bag.h || put(x, y) != null) break;
      }
    for (const [dx, dy] of D.jump || []) put(px + dx, py + dy);
  } else if (holeMod(o)) for (const [x, y] of holeOf(o)) put(x, y);
  else if (I.zod) {
    /* 0.1.96 星座：它連成的星河經過的格子 */
    for (const R of rivers(bag)) if (R.a.u === o.u || R.b.u === o.u) for (const [x, y] of R.cells) put(x, y);
  } else if (I.perAdj || I.perAdjF || I.gear || I.chainAdj || I.zod)
    for (const [x, y] of cellsOf(o))
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ])
        put(x + dx, y + dy);
  return out;
}
/* 0.1.86 角標放在道具真的有的那一格（不是外框的角）：巨人國的 U 形、轉過的 P 形，外框左上角可能是空的，
   角標會跑到別的空格上、看起來像沒有階數。d＝[x 方向, y 方向]：[1,1] 左上、[1,-1] 左下、[-1,-1] 右下（先比那個角的斜線，再比上下） */
function cnr(cs0, mx, my, cs, d, html) {
  if (!html) return '';
  const k = ([x, y]) => (d[0] * x + d[1] * y) * 100 + d[1] * y,
    [x, y] = cs0.reduce((a, b) => (k(b) < k(a) ? b : a));
  return `<span class="cn" style="left:${(x - mx) * (cs + GAP)}px;top:${(y - my) * (cs + GAP)}px">${html}</span>`;
}
/* 0.1.28 相鄰加成的連接點：有相鄰加成的兩件，在貼著的那條縫上畫一顆亮點（不用選就看得到誰加成誰）；
   跟選中的道具有關的變亮、其他的變淡 */
function linkHTML(bag, mods, cs, sel) {
  const byU = new Map(bag.items.map(o => [o.u, o])),
    seen = new Set(),
    st = cs + GAP;
  let h = '',
    ln = '';
  for (const [u, l] of mods)
    for (const x of l) {
      /* 0.1.96 棋子不相鄰：從棋子中心畫虛線到被影響的那件最近的一格（平常只露出棋子那頭一小段，選中時整條＋箭頭） */
      if (x.w === 'pc' && byU.has(x.from) && byU.has(u)) {
        const [px, py] = cellsOf(byU.get(x.from))[0],
          [tx, ty] = cellsOf(byU.get(u)).reduce((a, b) =>
            Math.hypot(b[0] - px, b[1] - py) < Math.hypot(a[0] - px, a[1] - py) ? b : a
          ),
          on = sel && (sel.u === x.from || sel.u === u),
          c = v => v * st + cs / 2;
        ln += `<line class="pcl${on ? ' on' : ''}" x1="${c(px)}" y1="${c(py)}" x2="${c(tx)}" y2="${c(ty)}"${on ? ' marker-end="url(#pca)"' : ''}/>`;
        continue;
      }
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
  return ln
    ? h +
        `<svg class="lks" width="${bag.w * st}" height="${bag.h * st}" aria-hidden="true"><defs><marker id="pca" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L8 4L0 8z"/></marker></defs>${ln}</svg>`
    : h;
}
/* 0.1.28 拖曳中：放下後會跟它有加成（或能融合）的道具先亮起來 */
function dragLit(d) {
  const run = S.run,
    t = d.tgt && d.ok ? { ...d.o, u: d.o.u || '_d', x: d.tgt[0], y: d.tgt[1], r: d.r } : null,
    key = d.fuse ? 'f' + d.fuse.u + d.fc : t ? [t.x, t.y, t.r] + '' : '';
  if (d.lk === key) return;
  d.lk = key;
  const bag = $('bag');
  if (!bag) return;
  bag.querySelectorAll('.it.pv').forEach(e => e.classList.remove('pv'));
  /* 0.1.103 拖食物：能合成的先標虛線框；停在上面時，那件上方預覽會變成什麼 */
  bag.querySelectorAll('.ckn').forEach(e => e.remove());
  if (ITEMI[d.o.id].fk) {
    const itE = q => bag.querySelector(`.it[data-u="${q.u}"]`);
    if (!d.ck) {
      d.ck = 1;
      for (const q of run.bag.items) if (cookOf(d.o, q) && itE(q)) itE(q).classList.add('ck');
    }
    if (d.fuse && itE(d.fuse))
      itE(d.fuse).insertAdjacentHTML('beforeend', `<b class="ckn">${ITEMI[cookOf(d.o, d.fuse)].n}</b>`);
  }
  const on = q => {
    const e = bag.querySelector(`.it[data-u="${q.u}"]`);
    if (e) e.classList.add('pv');
  };
  const cells = bag.querySelectorAll('.cell');
  cells.forEach(e => e.classList.remove('rng'));
  if (d.fuse) {
    /* 0.1.100 鑿子：要挖的那一格先亮起來 */
    if (ITEMI[d.o.id].mod === 'chisel' && d.fc) {
      const ce = cellEl(d.fc);
      if (ce) ce.classList.add('rng');
    }
    return on(d.fuse);
  }
  if (!t) return;
  /* 0.1.96 放下去之後的背包重算加成：跟它互相有加成的（相鄰、森林、凹口、棋子、齒輪…）都亮起來 */
  const B = { ...run.bag, items: [...run.bag.items.filter(q => q.u !== t.u), t] },
    M = bagMods(B);
  for (const q of B.items)
    if (
      q !== t &&
      (M.get(q.u).some(x => x.from === t.u && x.w !== 'all') || M.get(t.u).some(x => x.from === q.u && x.w !== 'all'))
    )
      on(q);
  /* 範圍提示：拖的是棋子、凹口、森林這類就標它會影響的空格；拖一般道具就標棋子打得到的空格 */
  const rg = rngOf(B, t);
  const B0 = { ...B, items: B.items.filter(q => q !== t) };
  if (!rg.size) for (const p of B0.items) if (ITEMI[p.id].pc) for (const [k, v] of rngOf(B0, p)) rg.set(k, v);
  for (const [k, v] of rg)
    if (v === 'on') {
      const [x, y] = k.split(',').map(Number),
        e = cells[y * +bag.dataset.gw + x];
      if (e) e.classList.add('rng');
    }
}
/* 0.1.4 道具形狀的小圖（商店、說明、三選一）：幾格、怎麼排一眼看得出來 */
/* sh：0.1.59 七十二變換過的形狀（沒給的話照這局的對照表 shmOf） */
function shapeMini(id, r = 0, sm = 0, sh = shmOf(S.run, id)) {
  const c = shapeOf(id, r, sm, sh),
    w = Math.max(...c.map(p => p[0])) + 1,
    h = Math.max(...c.map(p => p[1])) + 1;
  return `<i class="shp" style="--w:${w};--h:${h}" aria-label="${c.length} 格">${c
    .map(([x, y]) => `<i style="grid-area:${y + 1}/${x + 1}"></i>`)
    .join('')}</i>`;
}
/* 0.1.79 階段：一個回合一個圓圈、用線連起來（紅＝對戰、紫＝野怪菁英首領）；打過的顯示勝敗（贏亮、輸暗），
   這回合放大（0.1.81 回合號寫在圓圈裡，不再寫類型文字）；最右邊虛線圈是下一階段。點打過的看那場的戰鬥紀錄 */
function stageHTML(run) {
  const r = curRound(run),
    st = ROUNDS.filter(q => q.st === r.st),
    nx = ROUNDS.find(q => q.st === r.st + 1),
    kind = q => (q.type === 'pvp' ? 'pvp' : 'pve'),
    node = q => {
      const k = ROUNDS.indexOf(q),
        lg = run.log.find(l => l.id === q.id),
        on = k === run.ri;
      /* 0.1.81 還沒打的（含這回合）圓圈裡直接寫回合號，類型只看顏色；打過的寫 ✓／✕ */
      return `<span class="sn ${kind(q)} t-${q.type}${on ? ' on' : ''}${lg ? (lg.win ? ' w' : ' l') : ''}"${lg ? ` data-act="log" data-k="${q.id}"` : ''} aria-label="${q.id} ${RSHORT[q.type]}${lg ? (lg.win ? ' 勝' : ' 敗') : ''}"><i>${lg ? (lg.win ? '✓' : '✕') : q.id}</i></span>`;
    };
  return `<div class="stg" aria-label="這個階段的回合">${st.map((q, i) => (i ? `<i class="sl ${kind(q)}"></i>` : '') + node(q)).join('')}${
    nx ? `<i class="sl nx"></i><span class="sn nx" aria-label="下一階段 ${nx.id}"><i>${nx.id}</i></span>` : ''
  }</div>`;
}
/* 0.1.89 手機：階段圓圈縮成標題列右下的一排小點（綠贏、紅輸、亮的是這回合），省一整列；電腦版還是圓圈 */
function stageDots(run) {
  const r = curRound(run);
  return `<span class="sdots" aria-hidden="true">${ROUNDS.filter(q => q.st === r.st)
    .map(q => {
      const lg = run.log.find(l => l.id === q.id);
      return `<i class="${q === r ? 'on' : lg ? (lg.win ? 'w' : 'l') : ''}"></i>`;
    })
    .join('')}</span>`;
}
/* 0.1.100 改造過的道具：說明多一行（放大、鑿子做出來的凹口照類別，寫出凹口給什麼） */
function mdLineHTML(o) {
  if (!o.md) return '';
  const hm = !ITEMI[o.id].hole && holeMod(o);
  return `<p class="c-tf">✦ ${MD_N[o.md]}過：${MD_D[o.md](o.mt || 1)}${hm ? `；凹口裡的${HOLE_N[hm.tag]}：${modTxt(scaleMod(hm, o.t))}` : ''}</p>`;
}
/* 0.1.100 合成時三件的巨人國改造不一樣：選要保留哪一種 */
const MD_D = {
  shrink: t => `1 格、數值 ×${MD_K.shrink[t - 1]}%`,
  grow: t => `數值 ×${MD_K.grow[t - 1]}%、有凹口`,
  chisel: t => `少 1 格、多 1 個凹口${t > 1 ? `、數值 ×${MD_K.chisel[t - 1]}%` : ''}`
};
function mdPickHTML(run) {
  while (run.mdq && run.mdq.length && !findU(run, run.mdq[0].u)) run.mdq.shift();
  const q = run.mdq && run.mdq[0],
    o = q && findU(run, q.u);
  if (!o) return '';
  return `<div class="ovl"><div class="dlg2"><b>合成：選要保留的改造</b><div class="dh"><img src="${itemIcon(o.id)}" alt=""><div><b style="color:${STARC[ITEMI[o.id].star]}">${esc(ITEMI[o.id].n)}${tierTxt(o.t)}</b><small>三件的改造不一樣</small></div></div><div class="sgopts">${q.o
    .map(
      (m, k) =>
        `<button class="btn sgo" data-act="mdPick" data-k="${k}">${shapeMini(o.id, 0, 0, m.sh || ITEMI[o.id].sh)}<span><b>${m.md ? MD_N[m.md] + tierTxt(m.mt) : '不改造'}</b><small>${m.md ? MD_D[m.md](m.mt) : '原本的形狀'}</small></span></button>`
    )
    .join('')}</div></div></div>`;
}
/* 0.1.80 階段下面一列：下一場對手（小膠囊，點了看他的背包；PvE 是怪物）＋常變的賽制資訊（塔羅、星象、印記件數）；
   本局規則、核心、全部對手改成懸浮按鈕（fabHTML） */
function infoRowHTML(run) {
  const r = curRound(run),
    nr = r.type === 'pvp' ? nextRival(run) : -1,
    rv = nr >= 0 && run.rivals[nr],
    who = rv
      ? `<button class="nxo" data-act="rvBag" data-k="${nr}" aria-label="下一場對手 ${esc(rv.name)}，看他的背包">${sprCv('a_' + rv.av)}<span><small>下一場</small><b>${esc(String(rv.name).split('的').pop())} ♥${rivalHp(rv)}</b></span></button>`
      : `<span class="nxo pve"><span><small>下一場</small><b>${RSHORT[r.type]}</b></span></span>`,
    x = run.mode !== 'std' && modeUI(run).bar && !(run.phase === 'mode' && !run.mseen) ? modeUI(run).bar(run) : '';
  /* 0.1.89 賽制資訊（印記件數、遺物）跟羈絆放同一格 .sinfo：手機排在三顆按鈕左邊同一列，電腦版照舊一列一列 */
  return `<div class="mbar nxr">${who}${rtagHTML(run)}${fabHTML(run)}</div><div class="sinfo">${x ? `<div class="mbar">${x}</div>` : ''}${synHTML(run)}</div>`;
}
/* 0.1.95 規則標籤：賽制・道具池＋一句話規則（星象、塔羅換成現在生效的那條），點了看本局規則（對話框從標籤長出來） */
function rtagHTML(run) {
  const M = MODEI[run.mode],
    T = POOLTHI[run.theme];
  if (!M || (run.phase === 'mode' && !run.mseen)) return '';
  const r = curRound(run),
    a = run.mode === 'astro' && r && ASTROI[astroAt(run, r.st)],
    s = a
      ? `本階段：${a.n}`
      : run.bag.tar
        ? `塔羅：${tarotName(run.bag.tar)}${/^hermit/.test(run.bag.tar) ? `・背包 ${run.bag.items.length} 件` : ''}`
        : run.mode === 'std' && T
          ? T.s
          : M.s;
  return `<button class="rtag" data-act="rulesInfo" aria-label="本局規則：${M.n}${T ? '、' + T.n : ''}。${s}"><img src="${artIconURL(M.ic) || iconURL('star')}" alt="">${T ? `<img class="f2" src="${artIconURL(T.ic) || iconURL('star')}" alt="">` : ''}${modeUI(run).badge ? modeUI(run).badge(run) : ''}<span><b>${M.n}${T ? '・' + T.n : ''}</b><small>${s}</small></span></button>`;
}
/* 0.1.80 小按鈕（下一場那一列的右邊）：核心、全部對手（0.1.95 本局規則改成規則標籤 rtagHTML）。試過懸浮在右側，會蓋到暫存區和 5～6 格寬的背包 */
function fabHTML(run) {
  const c = run.bag.core,
    pf = petFx(run.bag),
    alive = run.rivals.filter(x => rivalAlive(x, curRound(run).id)).length;
  return `<div class="fabs">${
    c
      ? `<button class="fab core${V.sel === 'core' ? ' sel' : ''}" data-act="coreSel" aria-label="職業核心${pf && pf.giant != null ? `，巨獸化${pf.giant ? '達成' : '未達成'}` : ''}">${pf && pf.giant != null ? `<em class="fbg ${pf.giant ? 'ok' : 'no'}">${pf.n}/2</em>` : ''}<img src="${itemIcon(c.id)}" alt="">${c.sc && ITEMI[c.sc] ? `<img class="f2" src="${itemIcon(c.sc)}" alt="">` : ''}<small>核心</small></button>`
      : ''
  }<button class="fab" data-act="rivals" aria-label="全部對手"><b>${alive}</b><small>對手</small></button></div>`;
}
/* 0.1.29 上方資訊欄的「戰報」：點一下直接看上一場的戰鬥紀錄（勝綠、敗紅） */
function lastLogBtn(run) {
  const l = (run.log || [])[run.log.length - 1];
  return l
    ? `<button class="iconbtn lgb ${l.win ? 'w' : 'l'}" data-act="lastLog" aria-label="上一場戰鬥紀錄"><b>戰報</b><small>${l.id}${l.win ? '勝' : '敗'}</small></button>`
    : '';
}
/* 0.1.96 下回合收入的明細（點金幣）：贏、輸各一欄，照現在的金幣算（花掉的話利息會變少） */
function incomeHTML(run) {
  const r = curRound(run);
  if (!r || !ROUNDS[run.ri + 1]) return '<p class="c-dim">這是最後一回合了</p>';
  const w = winGold(r, run),
    x2 = run.bag.tar === 'hanged',
    it = (g, s) => [Math.min(INTEREST_MAX, fl(g / 10)), streakBonus(s)],
    [iW, sW] = it(run.gold + w, run.ws + 1),
    [iL, sL] = it(run.gold, run.lsk + 1),
    bg = bonusGold(run),
    row = (n, a, b, note = '') =>
      `<tr><th>${n}${note ? `<small>${note}</small>` : ''}</th><td>${a}</td><td>${b}</td></tr>`,
    nx = 10 - (run.gold % 10);
  return `<table class="inct"><tr><th></th><td>贏</td><td>輸</td></tr>${row('打贏的獎勵', '+' + w, '—', r.type === 'pve' ? '打怪 +2' : '對戰 +1')}${row('基本收入', '+' + BASE_INCOME, '+' + BASE_INCOME)}${row('利息', '+' + iW, '+' + iL, `每 10 金 +1，最多 +${INTEREST_MAX}`)}${row(
    '連勝／連敗',
    '+' + sW,
    '+' + sL,
    `贏了連勝 ${run.ws + 1} 場、輸了連敗 ${run.lsk + 1} 場（2 場 +1、4 場 +2、6 場 +3）`
  )}${bg ? row('額外收入', (bg > 0 ? '+' : '') + bg, (bg > 0 ? '+' : '') + bg, '職業、道具、遺物、塔羅') : ''}${x2 ? row('倒吊人', '×2', '×2') : ''}<tr class="sum"><th>合計</th><td>+${w + incomeOf(run, run.gold + w, run.ws + 1)}</td><td>+${incomeOf(run, run.gold, run.lsk + 1)}</td></tr></table><p class="c-dim">照你現在的 ${run.gold} 金算${iL < INTEREST_MAX ? `；再存 ${nx} 金利息 +1` : '；利息已經最多'}。花掉的話利息會變少。</p>`;
}
/* 0.1.25 金幣旁的下回合預估收入（輸～贏） */
function incTxt(run) {
  /* 0.1.27 結算／三選一時連勝連敗已經算進去了，再估會重複算：只在準備時顯示 */
  if (run.phase !== 'prep') return '';
  const e = incomeEst(run);
  if (!e) return '';
  return `<small class="inc" title="下回合收入（輸～贏）">+${e[0] === e[1] ? e[0] : e[0] + '～' + e[1]}</small>`;
}
/* 0.1.95 賽制改過的價格（狂風 -1）：價格旁邊標出差多少 */
function priceOff(run, s) {
  const d = slotPrice(run, s) - shopPrice(run, s.id, s.t, s.p);
  return d ? `<em class="poff">${d > 0 ? '+' : '−'}${Math.abs(d)}</em>` : '';
}
function prepHTML(run) {
  const r = curRound(run),
    bag = run.bag,
    cs = cellSize(STG_W, STG_H),
    mods = bagMods(bag),
    lvNext = run.lv < BAG_MAX ? BAGLV[run.lv + 1] : null,
    nr = r.type === 'pvp' ? nextRival(run) : -1,
    oppTxt =
      r.type === 'pvp'
        ? nr >= 0
          ? `對戰 ${esc(String(run.rivals[nr].name).split('的').pop())}`
          : '對戰'
        : RTYPE[r.type];
  return `<div class="prep">
    <div class="top"><button class="iconbtn" data-act="menu" aria-label="選單">☰</button>${lastLogBtn(run)}<button class="me" data-act="stats" aria-label="角色數值">${sprCv('a_' + S.av)}<span><b>${esc(S.name)}</b><small class="hpt">♥ ${run.hp}／${START_HP}<em>${CLSI[run.bag.cls] ? CLSI[run.bag.cls].n : '數值'} ›</em></small></span></button><div class="rinfo"><button class="gold" data-act="incInfo" aria-label="金幣 ${run.gold}，看下回合收入怎麼算">${run.gold} 金${incTxt(run)}</button>${
      nr >= 0
        ? `<button class="rnx" data-act="rvBag" data-k="${nr}" aria-label="下一場對手 ${esc(run.rivals[nr].name)}，看他的背包">${r.id}・${esc(String(run.rivals[nr].name).split('的').pop())} ♥${rivalHp(run.rivals[nr])} ›</button>`
        : `<small>${r.id}・${oppTxt}</small>`
    }${stageDots(run)}</div></div>
    <div class="pcol pa"><div class="srow">${stageHTML(run)}
    ${infoRowHTML(run)}</div>
    <div class="pcrv">${rivalHTML(run)}</div>
    ${tutHTML()}
    ${holdHTML(run)}</div>
    <div class="pcol pb"><div class="bagwrap" id="bagwrap">${bagHTML(bag, cs, { mods, tar: tarAff(bag), stage: 1 })}</div>
    <div class="benchrow"><span class="lbl">暫存</span><div class="bench" id="bench">${run.bench
      .map((o, i) =>
        o
          ? `<div class="bs s${ITEMI[o.id].star}${fdc(o.id)}${V.sel === o.u ? ' sel' : ''}${fuCls(o)}" data-bu="${o.u}" data-bi="${i}"${fuSty(o)}><img src="${itemIcon(o.id)}" alt="${fuName(o)}">${o.f && ITEMI[o.f] ? `<img class="fui" src="${itemIcon(o.f)}" alt="">` : ''}${shapeMini(o.id, o.r || 0, o.sm, o.sh)}${tierBadge(o.t)}${brHTML(o)}</div>`
          : `<div class="bs emp" data-bi="${i}"></div>`
      )
      .join('')}</div></div></div>
    <div class="pcol pc">${modeUI(run).panel ? modeUI(run).panel(run) : ''}<div class="shop" id="shop">${run.shop
      .map((s, k) =>
        s
          ? `<button class="sc s${ITEMI[s.id].star}${fdc(s.id)}${s.pity ? ' pity' : ''}${V.sel === 'shop' + k ? ' sel' : ''}" data-act="shopSel" data-k="${k}" data-sk="${k}" aria-label="${ITEMI[s.id].n}${s.pity ? '（保底）' : ''}"><img src="${itemIcon(s.id)}" alt="">${tierBadge(s.t || 1)}${brHTML(s)}${shapeMini(s.id, 0, 0, s.sh)}<b class="${run.gold < slotPrice(run, s) ? 'c-bad' : s.p != null ? 'c-gold' : ''}">${slotPrice(run, s)} 金${priceOff(run, s)}</b></button>`
          : `<div class="sc sold">已買</div>`
      )
      .join('')}</div>
    <div class="acts">${
      rerollNo(run)
        ? `<button class="btn rr" disabled>不能刷新<small class="bnote">${modeH(run).rerollNote || ''}</small></button>`
        : `<button class="btn" data-act="reroll" ${(run.gold < REROLL && freeRolls(run) <= 0) || rollsLeft(run) <= 0 ? 'disabled' : ''}>刷新<small class="bnote">${rollsLeft(run) <= 0 ? '用完了' : freeRolls(run) > 0 ? '免費' : REROLL + ' 金'}</small></button>`
    }<button class="btn" data-act="lock" aria-pressed="${!!run.lock}">${run.lock ? '已鎖' : '鎖住'}<small class="bnote">商店</small></button><button class="btn" data-act="lvup" ${!lvNext || !lvOpen(run) || run.gold < lvCost(run) ? 'disabled' : ''}>${lvNext ? `背包 ${lvNext.w}×${lvNext.h}` : '背包最大'}<small class="bnote">${lvNext ? (lvOpen(run) ? lvCost(run) + ' 金' : lvNext.from + ' 開放') : ''}</small></button>${
      /* 0.1.99 整理區有東西：主要按鈕變成「處理背包外 N 件」（同一個位置，背包不會被擠動） */
      (bag.st || []).length
        ? `<button class="btn pri" data-act="unstage">處理背包外 ${bag.st.length} 件<small class="bnote">${benchFree(run) >= 0 ? '收回暫存' : '暫存滿了，先賣掉'}</small></button>`
        : `<button class="btn pri" data-act="fight">開戰<small class="bnote">輸了 -${r.loss}</small></button>`
    }</div></div>
    ${detailHTML(run) || '<div class="detph">點道具看說明</div>'}
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
    o = { id: s.id, t: s.t || 1, p: s.p, sg: s.sg, sh: s.sh, cu: s.cu, bl: s.bl };
    where = 'shop';
  } else if (V.sel.startsWith('leg')) {
    /* 0.1.59 遺產攤位：保留階數、詞綴 */
    k = +V.sel.slice(3);
    o = run.leg && run.leg[k];
    if (!o) return '';
    where = 'leg';
  } else {
    o = run.bag.items.find(q => q.u === V.sel);
    where = 'bag';
    if (!o) {
      o = run.bench.find(q => q && q.u === V.sel);
      where = 'bench';
    }
    if (!o) {
      o = (run.bag.st || []).find(q => q.u === V.sel);
      where = 'stage';
    }
    if (!o) return '';
  }
  const I = ITEMI[o.id],
    mods = where === 'bag' ? bagMods(run.bag).get(o.u) || [] : [],
    tot = {};
  /* 0.1.28 目前加成照來源分行（誰給的一看就知道） */
  for (const x of mods) {
    /* 0.1.69 只畫線的（m 是空的）不列 */
    if (x.w === 'tf' || !Object.keys(x.m).length) continue;
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
  return `<div class="det" id="det"><div class="dh${fuCls(o)}"${fuSty(o)}><img src="${itemIcon(o.id)}" alt=""><div><b style="color:${I.fk ? 'var(--food)' : STARC[I.star]}">${T ? T.n + '・' : ''}${I.n}${tierTxt(o.t)}</b><small>${I.fk ? FKN[I.fk] : stars(I.star)}・${tags}・${shapeMini(o.id, o.r || 0, o.sm, o.sh)} ${shapeO(o).length} 格${I.core ? '・一個背包最多 1 個' : ''}</small></div>${oddsHTML(run, o.id)}<button class="iconbtn" data-act="desel" aria-label="關閉">✕</button></div>
    <p class="dls">${descLines(itemDesc(o.id, o.t))}</p>${modeUI(run).det ? modeUI(run).det(run, o) : ''}${sinLineHTML(run, o)}${cuLineHTML(o)}${o.m ? mod5HTML(o.m) : ''}${o.m2 ? mod5HTML(o.m2) : ''}${aff ? `<p class="c-gold">升階詞綴：${aff.n}</p>` : ''}${abHTML(o)}${mdLineHTML(o)}${trigHTML(run, o, where)}${I.sacrifice ? `<p class="c-tf">✦ 已獻祭 ${o.sv || 0}／${VESSEL_N} 星</p>` : ''}${o.gw && CLSI[run.bag.cls] && CLSI[run.bag.cls].F && CLSI[run.bag.cls].F.petGrow ? `<p class="c-tf">✦ 成長 ${o.gw} 層：傷害 +${o.gw * CLSI[run.bag.cls].F.petGrow}%</p>` : ''}${o.ex ? `<p class="c-tf">✦ 煉成：${dsc(brewTxt(o.ex))}</p>` : ''}${o.hh ? `<p class="c-tf">✦ 已經累積生命 +${o.hh}</p>` : ''}${I.hatch ? `<p class="c-tf">✦ 再 ${SEAL_RC - (o.rc || 0)} 回合解開封印</p>` : ''}${o.z ? '<p class="c-dim">回扣送的：賣價 0 金</p>' : ''}${o.sc && ITEMI[o.sc] ? `<p class="c-tf">✦ 融入了${ITEMI[o.sc].n}：${dsc(itemDesc(o.sc))}</p>` : ''}${T ? `<p class="c-tf">✦ ${by.u ? '會跟' : '融合了'}${ITEMI[by.id].n}${tierTxt(by.t)}：${[T.add && `變成${T.add.map(x => TAGN[x]).join('、')}系`, modTxt(scaleMod(T.m, by.t))].filter(Boolean).join('、')}</p>` : ''}${Object.entries(
      tot
    )
      .filter(([, m]) => modTxt(m))
      .map(([n, m]) => `<p class="c-good">＋${esc(n)}：${dsc(modTxt(m))}</p>`)
      .join('')}
    <div class="btns">${
      where === 'shop'
        ? `<button class="btn pri" data-act="buy" data-k="${k}" ${run.gold < slotPrice(run, o) ? 'disabled' : ''}>買 ${slotPrice(run, o)} 金</button>`
        : where === 'leg'
          ? `<button class="btn pri" data-act="legBuy" data-k="${k}" ${run.gold < legPrice(run, o) ? 'disabled' : ''}>買 ${legPrice(run, o)} 金</button><small class="c-dim">${esc(o.from || '')}的遺產・還剩 ${o.lx - run.ri + 1} 回合</small>`
          : `${I.sacrifice ? '<button class="btn buy" data-act="sacr">獻祭寵物</button>' : ''}${run.bag.tar === 'death' && !I.core && !run.tarSac ? `<button class="btn buy" data-act="tarotSac">獻祭 +${tarSacHp(o)} 生命</button>` : ''}${!I.core && run.fedRi !== run.ri && sinLv(run, 'glut') >= 3 ? `<button class="btn buy" data-act="feed">餵食 +${feedHp(o)} 生命</button>` : ''}${where === 'bag' ? '<button class="btn" data-act="rot">旋轉</button><button class="btn" data-act="toBench">收回暫存</button>' : where === 'stage' ? '<button class="btn" data-act="toBench">收回暫存</button>' : '<button class="btn" data-act="autoPlace">放進背包</button>'}<button class="btn" data-act="sell">賣 ${sellO(o, run)} 金${modeUI(run).sellNote ? modeUI(run).sellNote(run, o) : ''}</button>`
    }</div></div>`;
}
/* ================= 0.1.52 賽制 ================= */
/* 開場：本局賽制（看完才選職業） */
/* 0.1.59 轉盤：每個賽制一塊（大小照出現機率），指針在正上方；轉完（run.mseen）才顯示規則、開放選職業 */
const WHEEL_T = 3.6;
function wheelSlices() {
  const ms = MODES.filter(m => m.w > 0),
    tot = ms.reduce((n, m) => n + m.w, 0);
  let a = 0;
  return ms.map(m => {
    const s = { k: m.k, a, b: a + (360 * m.w) / tot };
    a = s.b;
    return s;
  });
}
/* 停下來的角度：目標那塊轉到指針底下，先多轉 5 圈；落點在那塊中間 60% 裡（每局固定，重畫不會跳） */
function wheelEnd(run) {
  const s = wheelSlices().find(x => x.k === run.mode),
    j = ((h(run.seed, 404) % 1000) / 1000 - 0.5) * 0.6;
  return 360 * 5 + 360 - ((s.a + s.b) / 2 + j * (s.b - s.a));
}
/* 0.1.62 內圈：道具池的主題（每塊一樣大），反方向轉，停在這局的主題 */
function wheelEnd2(run) {
  const i = POOLTH.findIndex(x => x.k === run.theme);
  if (i < 0) return 0;
  const j = ((h(run.seed, 405) % 1000) / 1000 - 0.5) * 0.6;
  const A = 360 / POOLTH.length;
  return -(360 * 4 + i * A + A / 2 + j * A);
}
/* 0.1.65 轉盤的底色：相鄰兩塊（含頭尾接起來那塊）不同色，每塊結尾畫一條金色分隔線（g 度；內圈半徑小，線要寬一點） */
function wheelGrad(sl, cols, g) {
  return sl
    .map((s, i) => {
      /* 兩色輪流；塊數是單數時最後一塊用第三色（不然頭尾同色、看不出分界） */
      const c = `var(${cols[sl.length % 2 && i === sl.length - 1 ? 2 : i % 2]})`;
      return `${c} ${s.a}deg ${s.b - g}deg,var(--gold) ${s.b - g}deg ${s.b}deg`;
    })
    .join(',');
}
function wheelHTML(run, step = 0) {
  const sl = wheelSlices(),
    grad = wheelGrad(sl, ['--card2', '--fill', '--fill-hi'], 1.2),
    end = wheelEnd(run),
    grad2 = wheelGrad(
      POOLTH.map((x, i) => ({ a: (i * 360) / POOLTH.length, b: ((i + 1) * 360) / POOLTH.length })),
      ['--accent-soft', '--card2', '--fill-hi'],
      2.5
    );
  return `<div class="wheel${step ? ' s' + step : ''}"><i class="wpin"></i><div class="wdisk" id="wdisk" style="background:conic-gradient(${grad});transform:rotate(${run.mseen ? end : 0}deg)">${sl
    .map(s => {
      const m = (s.a + s.b) / 2;
      return `<img src="${artIconURL(MODEI[s.k].ic) || iconURL('star')}" alt="" style="transform:rotate(${m}deg) translateY(-82px) rotate(${-m}deg)">`;
    })
    .join('')}</div>${
    run.theme
      ? `<div class="wdisk in" id="wdisk2" style="background:conic-gradient(${grad2});transform:rotate(${run.mseen ? wheelEnd2(run) : 0}deg)">${POOLTH.map(
          (x, i) => {
            const m = ((i + 0.5) * 360) / POOLTH.length;
            return `<img src="${artIconURL(x.ic) || iconURL('star')}" alt="" style="transform:rotate(${m}deg) translateY(-30px) rotate(${-m}deg)">`;
          }
        ).join('')}</div>`
      : ''
  }</div>`;
}
/* 轉：照時間算角度（重畫也接得上），每過一塊響一聲；點轉盤直接停 */
function wheelGo(run) {
  if (run.mseen) return;
  if (!V.spin || V.spin.seed !== run.seed) {
    const fast = matchMedia('(prefers-reduced-motion: reduce)').matches;
    V.spin = { seed: run.seed, t0: performance.now(), T: fast ? 0.01 : WHEEL_T, last: -1 };
    snd('select');
    requestAnimationFrame(wheelTick);
  }
}
function wheelTick() {
  const run = S.run,
    sp = V.spin;
  if (!run || !sp || run.mseen || sp.seed !== run.seed) return;
  const t = Math.min(1, (performance.now() - sp.t0) / 1000 / sp.T),
    e = 1 - Math.pow(1 - t, 3.2),
    ang = wheelEnd(run) * e,
    d = $('wdisk'),
    d2 = $('wdisk2');
  if (d) d.style.transform = `rotate(${ang}deg)`;
  if (d2) d2.style.transform = `rotate(${wheelEnd2(run) * e}deg)`;
  /* 指針底下換了一塊：滴答 */
  const at = (((360 - (ang % 360)) % 360) + 360) % 360,
    i = wheelSlices().findIndex(s => at >= s.a && at < s.b);
  if (i !== sp.last && t < 1) (sp.last = i), snd('tap');
  if (t < 1) return requestAnimationFrame(wheelTick);
  wheelDone(run);
}
function wheelDone(run) {
  if (run.mseen) return;
  run.mseen = 1;
  V.spin = null;
  snd('level');
  save();
  render();
}
function modeHTML(run) {
  const M = MODEI[run.mode];
  if (!run.mseen)
    return `<div class="ovl"><div class="dlg2 modeint"><small class="c-dim">外圈賽制・內圈道具池</small><button class="wbtn" data-act="wheelSkip" aria-label="直接看結果">${wheelHTML(run)}</button><b class="c-dim">轉盤轉動中…</b><small class="c-dim">點轉盤直接看結果</small></div></div>`;
  /* 0.1.65 分兩步：先看賽制（內圈變暗），按「看道具池」再看道具池（外圈變暗），一次只講一件事、對話框不會太長 */
  const T = POOLTHI[run.theme];
  if (T && !run.mstep)
    return `<div class="ovl"><div class="dlg2 modeint"><small class="c-dim">本局賽制（外圈）・這局的規則變化</small>${wheelHTML(run, 1)}<b class="big mres">${M.n}</b><ul class="mrules">${M.d.map(x => `<li>${x}</li>`).join('')}</ul>${modeUI(run).intro ? modeUI(run).intro(run) : ''}<button class="btn pri big" data-act="modeOk">看道具池</button></div></div>`;
  return `<div class="ovl"><div class="dlg2 modeint"><small class="c-dim">${T ? `本局道具池（內圈）・商店賣這套道具，圍繞它構築` : '本局賽制'}</small>${wheelHTML(run, T ? 2 : 1)}${
    T
      ? `<b class="big mres">${T.n}</b><ul class="mrules">${T.d.map(x => `<li>${x}</li>`).join('')}</ul>`
      : `<b class="big mres">${M.n}</b><ul class="mrules">${M.d.map(x => `<li>${x}</li>`).join('')}</ul>${modeUI(run).intro ? modeUI(run).intro(run) : ''}`
  }<button class="btn pri big" data-act="modeOk">選職業</button></div></div>`;
}
/* ================= 0.1.59 賽制的畫面 =================
   每個賽制一份（沒寫的就沒有）：intro 開場轉盤停下後規則下面多的、bar 準備畫面上方賽制標籤旁邊的、
   info 點賽制標籤看規則時多的、panel 商店上面的一列（流浪商人、遺產攤位）、0.1.80 badge 規則標籤上的小標（塔羅牌編號、星象）；
   0.1.95 spot 第一次遇到時框哪裡、fx 規則觸發時的提示（ruleFx）、stage 換階段、sellNote 賣鈕的註記、det 道具詳細多的一行。規則文字本身在 data.js 的 MODES（s 是一句話） */
const MODEUI = {
  /* 0.1.95 狂風：第一次框刷新鈕；買了整排換新時，新商品照風向從左邊依序吹進來＋刷新鈕旁的提示；這回合買的賣價註明 */
  gale: {
    spot: '.acts .rr',
    sellNote: (run, o) => (o.bt === run.ri ? '<small class="bnote">狂風：這回合買的</small>' : ''),
    fx: (run, was, now) => {
      if (was.shop === now.shop || !run.shop.some(Boolean)) return;
      document.querySelectorAll('.shop .sc').forEach((e, i) =>
        spr(
          e,
          [
            { transform: 'translateX(-28px)', opacity: 0 },
            { transform: 'none', opacity: 1 }
          ],
          0,
          i * 40
        )
      );
      snd('select');
      hint($q('.acts .rr'), '狂風！買一件，商店整排換新', 'gale');
    }
  },
  /* 0.1.96 七宗罪：第一次框羈絆列；規則多一份七組的效果 */
  sins: { spot: '.synbar', info: run => synInfoHTML(run) },
  caravan: { spot: '.van', panel: run => vanHTML(run) },
  curse: {
    info: () =>
      `<div class="astl"><b class="c-good">祝福（不分星級）</b>${BLESS.map(b => `<p><b>${b.n}</b>：${b.d(b.v)}${b.w ? '（只會在武器上）' : b.a ? '（武器或盾）' : ''}</p>`).join('')}<b class="cul">詛咒（下面是 1 倍，2★ ×1.5、3★ ×2、4★ ×2.5、5★ ×3）</b>${CURSES.map(c => `<p><b>${c.n}</b>：${c.d(c.v)}${c.w ? '（只會在武器上）' : ''}</p>`).join('')}</div>`
  },
  astro: {
    intro: run => astroListHTML(run, 1, 2),
    /* 0.1.98 換階段：規則標籤旁邊大字提示新的星象（每階段一次，不受每局 2 次的限制） */
    stage: run => {
      const r = curRound(run),
        a = r && ASTROI[astroAt(run, r.st)];
      if (a) setTimeout(() => hint($q('.rtag'), `新星象「${a.n}」：${a.d}`, 'astro' + r.st), 400);
    },
    /* 0.1.80 這個階段的星象：規則標籤上的小標（點開看這個和下一個階段） */
    badge: run => {
      const r = curRound(run),
        a = r && ASTROI[astroAt(run, r.st)];
      return a ? `<em class="fbg">${a.n.slice(0, 2)}</em>` : '';
    },
    info: run => {
      const st = curRound(run) ? curRound(run).st : 1;
      return astroListHTML(run, st, Math.min(ROUNDS[ROUNDS.length - 1].st, st + 1));
    }
  },
  relic: {
    /* 拿到的遺物小圖示 */
    bar: run =>
      (run.bag.rel || []).length
        ? `<div class="relrow">${run.bag.rel.map(k => `<button class="relc" data-act="modeInfo" aria-label="${RELICI[k].n}"${RZ[k] ? ` style="--rz:${RZ[k][1]}"` : ''}><img src="${artIconURL(RELICI[k].ic) || iconURL('star')}" alt=""></button>`).join('')}</div>`
        : '',
    info: run =>
      (run.bag.rel || []).length
        ? `<div class="relopts">${run.bag.rel.map(k => relicLine(k)).join('')}</div>`
        : '<p class="c-dim">還沒有遺物</p>'
  },
  legacy: { panel: run => legHTML(run) },
  /* 0.1.98 七十二變：道具詳細多一行原本的形狀（對照這局換過的） */
  shape: {
    det: (run, o) => {
      const sh = o.sh || shmOf(run, o.id);
      return String(shapeOf(o.id, 0, 0, 0)) === String(shapeOf(o.id, 0, 0, sh))
        ? ''
        : `<p class="c-dim">原本的形狀 ${shapeMini(o.id, 0, 0, 0)}・這局 ${shapeMini(o.id, 0, 0, sh)}</p>`;
    }
  },
  tarot: {
    /* 0.1.80 現在生效的牌：規則標籤上的小標（編號，逆位紫色；點開看抽過的牌和效果） */
    badge: run =>
      run.bag.tar ? `<em class="fbg${tarOf(run.bag.tar).r ? ' rvs' : ''}">${TAROTI[tarOf(run.bag.tar).T.k]}</em>` : '',
    info: run =>
      (run.tarot || []).length
        ? `<div class="astl">${run.tarot.map((k, i) => `<p class="${i === run.tarot.length - 1 ? 'on' : 'c-dim'}">第 ${TAROT_AT[i]}～${TAROT_AT[i] + 1} 階段・${tarotLine(k)}</p>`).join('')}</div>`
        : '<p class="c-dim">還沒有抽牌</p>'
  }
};
/* 0.1.69 塔羅牌陣：一張牌的名字（正逆位）、效果 */
/* 0.1.74 塔羅牌的卡圖（art/icons/tarot_牌.png，64×64）：逆位倒過來；還沒有圖（或大圖還沒載好）就顯示牌的編號 */
const tarotArt = (k, sm) => {
  const x = tarOf(k),
    u = x && artIconURL('tarot_' + x.T.k);
  return u
    ? `<img class="tcard${sm ? ' sm' : ''}${x.r ? ' rvs' : ''}" src="${u}" alt="">`
    : `<span class="tno${sm ? ' sm' : ''}${x && x.r ? ' rvs' : ''}">${x ? TAROTI[x.T.k] : ''}</span>`;
};
const tarotName = k => {
  const x = tarOf(k);
  return `${x.T.n}${x.r ? '（逆位）' : ''}`;
};
const tarotLine = k => `<b>${tarotName(k)}</b>：${tarOf(k).e.d}`;
const TAROT_CN = { fight: '戰鬥', syn: '羈絆', life: '生存', pet: '寵物', eco: '經濟', build: '構築' };
/* 四選一：每張一個按鈕（號碼、名字、正逆位、類型、效果） */
function tarotHTML(run) {
  const q = run.tarq;
  if (!q || run.pend || run.relq || run.mdq?.length) return '';
  const st = TAROT_AT[(run.tarot || []).length] || 1;
  return `<div class="ovl"><div class="dlg2"><b>塔羅牌陣：選一張</b><p class="c-dim">生效第 ${st}～${st + 1} 階段；選過的牌不會再出現</p><div class="picks">${q.opts
    .map(k => {
      const x = tarOf(k);
      return `<button class="pk tarot${x.r ? ' rvs' : ''}" data-act="tarotPick" data-k="${k}">${tarotArt(k)}<span><b>${tarotName(k)}・${TAROT_CN[x.e.c]}</b><small>${x.e.d}</small></span></button>`;
    })
    .join('')}</div></div></div>`;
}
const modeUI = run => (run && MODEUI[run.mode]) || {};
/* 0.1.59 星象輪轉：第 a～b 階段的規則（這個階段亮起來）；0.1.84 前面放月亮卡（art/icons/astro_月.png） */
function astroListHTML(run, a, b) {
  const r = curRound(run),
    now = r ? r.st : 0;
  let h = '';
  for (let st = a; st <= b; st++) {
    const x = ASTROI[astroAt(run, st)],
      u = x && artIconURL('astro_' + x.k);
    if (x)
      h += `<p class="${st === now ? 'on' : st < now ? 'c-dim' : ''}">${u ? `<img class="tcard sm" src="${u}" alt="">` : ''}<span>第 ${st} 階段・<b>${x.n}</b>：${x.d}</span></p>`;
  }
  return `<div class="astl">${h}</div>`;
}
/* 0.1.59 法老王的遺物：一件遺物（圖示、名字、效果） */
const relicLine = (k, act) => {
  const x = RELICI[k];
  return `<${act ? `button class="btn relo" data-act="relicPick" data-k="${k}"` : 'div class="relo"'}><img src="${artIconURL(x.ic) || iconURL('star')}" alt=""><span><b>${x.n}</b><small>${x.d}</small></span></${act ? 'button' : 'div'}>`;
};
/* 寶庫打開：生命比你低的已經拿走的、你可以挑的 */
function relicHTML(run) {
  const q = run.relq;
  if (!q || run.pend || run.mdq?.length) return '';
  return `<div class="ovl"><div class="dlg2"><b>法老王的寶庫</b><p class="c-dim">遺物不佔格子、整局有效${q.took.length ? '；生命比你低的先挑了：' + q.took.map(([n, k]) => `${esc(n)}拿走${RELICI[k].n}`).join('、') : ''}</p><div class="relopts">${q.opts.map(k => relicLine(k, 1)).join('')}</div></div></div>`;
}
/* 0.1.60 遺產來囉：有人淘汰時（下一個準備畫面）跳一次：誰淘汰了、你分到幾件 */
function legNewHTML(run) {
  const L = run.legNew;
  if (!L || !L.length || run.pend || run.relq || run.mdq?.length) return '';
  const n = L.reduce((a, x) => a + x.got, 0);
  return `<div class="ovl"><div class="dlg2 legnew"><b class="big">遺產來囉！</b>${L.map(x => `<div class="lgr l">${sprCv('a_' + (x.av || AVATARS[0][0]))}<span><b>${esc(x.n)}</b><small>淘汰了・你分到 ${x.got} 件</small></span></div>`).join('')}<p class="c-dim">${n ? `道具在商店上方的遺產攤位：半價、放 ${LEGACY_RC} 回合` : '這次沒有分到道具'}</p><button class="btn pri big" data-act="legOk">${n ? '去看看' : '知道了'}</button></div></div>`;
}
/* 0.1.59 遺產市集：商店上面的遺產攤位（點了看詳細、在詳細裡買） */
function legHTML(run) {
  if (!run.leg || !run.leg.length) return '';
  return `<div class="leg"><span class="lbl">遺產</span><div class="legs">${run.leg
    .map(
      (e, k) =>
        `<button class="sc s${ITEMI[e.id].star}${V.sel === 'leg' + k ? ' sel' : ''}" data-act="legSel" data-k="${k}" aria-label="${ITEMI[e.id].n}"><img src="${itemIcon(e.id)}" alt="">${tierBadge(e.t || 1)}${brHTML(e)}${shapeMini(e.id, e.r || 0, e.sm, e.sh)}<b class="${run.gold < legPrice(run, e) ? 'c-bad' : 'c-gold'}">${legPrice(run, e)} 金</b></button>`
    )
    .join('')}</div></div>`;
}
/* ================= 0.1.96 羈絆（七宗罪，只有七宗罪賽制） ================= */
const synName = x => x.n;
const synIc = x => `<img src="${artIconURL(x.ic) || iconURL('star')}" alt="${x.n}">`;
/* 準備畫面：一條「羈絆」按鈕，後面只放有件數的組（圖示＋件數，件數多的在前，框色＝級數）；貪婪的萬能牌加到哪一組標「＋貪」；點了看全部 */
function synHTML(run) {
  if (!run.bag.sin) return '';
  const V = synView(run.bag),
    on = SYN.map((x, i) => [x, V.n[i], V.lv[i], i])
      .filter(([, c]) => c > 0)
      .sort((a, b) => b[1] - a[1]);
  return `<button class="synbar" data-act="synInfo" aria-label="羈絆"><b>羈絆</b><span class="syl">${
    on.length
      ? on
          .map(
            ([x, c, l, i]) =>
              `<span class="syi l${Math.min(3, l)}${V.wild.includes(i) ? ' wild' : ''}" data-si="${i}" title="${x.n} ${c} 件">${synIc(x)}<b>${c}</b>${V.wild.includes(i) ? '<em>貪</em>' : ''}</span>`
          )
          .join('')
      : '<small class="c-dim">同一組湊 2 件開羈絆</small>'
  }</span><em>›</em></button>`;
}
/* 羈絆說明：七組都列（有件數的在上），每一級的效果，有到的亮起來 */
function synInfoHTML(run) {
  const V = synView(run.bag),
    l = SYN.map((x, i) => [x, V.n[i], V.lv[i], i]).sort((a, b) => b[1] - a[1] || a[3] - b[3]);
  return `<p class="c-dim">每件道具屬於一組宗罪（5★ 兩組）。背包裡同一組湊 ${SYN_AT.join('／')} 件，效果一級一級加上去。${
    V.wild.length ? `貪婪的萬能牌現在加在：${V.wild.map(i => SYN[i].n).join('、')}。` : ''
  }</p><div class="sginfo">${l
    .map(
      ([x, c, lv]) =>
        `<div class="sgi syn${lv ? ' on' : ''}">${synIc(x)}<div><b>${x.n}<small>${x.d}・背包裡 ${c} 件${lv ? `・${lv} 級` : ''}</small></b>${x.t
          .map((t, k) => `<p class="${k < lv ? 'on' : 'c-dim'}">${SYN_AT[k]} 件：${t}</p>`)
          .join('')}</div></div>`
    )
    .join('')}</div>`;
}
/* 道具詳細的羈絆那一行：屬於哪一組（背包裡幾件、幾級） */
function sinLineHTML(run, o) {
  if (!run.bag.sin || !ITEMI[o.id] || !(ITEMI[o.id].sins || []).length) return '';
  const V = synView(run.bag);
  return `<p class="sgl">${ITEMI[o.id].sins
    .map(k => {
      const i = SYNI[k];
      return `${sinTag(k)}${SYN[i].n}（背包裡 ${V.n[i]} 件${V.lv[i] ? `・${V.lv[i]} 級` : ''}）`;
    })
    .join('　')}</p>`;
}
/* 流浪商隊：商店上面的商人（一行：圖示、名字、做什麼、交易鈕） */
function vanHTML(run) {
  const v = run.van && VANI[run.van.k];
  if (!v) return '';
  const cost = v.k === 'blood' ? `${v.c} 生命` : v.c ? `${v.c} 金` : '免費',
    bad = v.k === 'blood' ? run.hp <= v.c : run.gold < v.c,
    lbl = run.van.done ? (v.k === 'twin' && run.twin ? '生效中' : '已交易') : cost;
  return `<div class="van"><img src="${artIconURL(v.ic) || iconURL('star')}" alt=""><span><b>${v.n}</b><small>${v.d}</small></span><button class="btn sm${run.van.done || bad ? '' : ' buy'}" data-act="van" ${run.van.done || bad ? 'disabled' : ''}>${lbl}</button></div>`;
}
/* 跟商人交易：要選道具的開清單，選完交易 */
function vanGo(arg) {
  const run = S.run,
    r = vanDo(run, arg);
  if (typeof r === 'string') return toast(r);
  snd('coin');
  toast(r.got ? `拿到 ${ITEMI[r.got.id].n}${tierTxt(r.got.t)}` : '雙胞胎：這回合下一件買的道具送一件一樣的');
  save();
  render();
}
function vanPick(sel = []) {
  const run = S.run,
    v = VANI[run.van.k],
    its = [...run.bag.items, ...run.bench].filter(Boolean),
    ok =
      v.k === 'alch'
        ? o =>
            vanOK(o) &&
            o.t === 1 &&
            !o.f &&
            ITEMI[o.id].star < 5 &&
            (!sel.length || ITEMI[o.id].star === ITEMI[findU(run, sel[0]).id].star)
        : v.k === 'smith'
          ? o => !ITEMI[o.id].core && o.t >= 2 && !(o.m && o.m2)
          : o => vanOK(o) && !o.f,
    c = its.filter(ok),
    hint =
      v.k === 'alch'
        ? `選 2 件同星級、Ⅰ 階的道具（已選 ${sel.length}／2）`
        : v.k === 'smith'
          ? '選一件 Ⅱ 階以上的道具（開一條隨機詞綴）'
          : '選一件道具（變成同星級、同類型的另一件）';
  const body = c.length
    ? `<p class="sub">${hint}</p><div class="rvit">${c
        .map(
          o =>
            `<button class="s${ITEMI[o.id].star}${sel.includes(o.u) ? ' sel' : ''}" data-vu="${o.u}"><img src="${itemIcon(o.id)}" alt="">${esc(fuName(o))}${tierTxt(o.t)}${sinBadge(o.id)}</button>`
        )
        .join('')}</div>`
    : '<p class="empty">沒有可以交易的道具</p>';
  showDlg(`${v.n}・${v.k === 'alch' ? '免費' : v.c + ' 金'}`, body, []);
  const m = $('modal'),
    close = m.onclick;
  m.onclick = ev => {
    const b = ev.target.closest('[data-vu]');
    if (!b) return close(ev);
    const u = b.dataset.vu;
    if (v.k !== 'alch') return (m.hidden = true), vanGo(u);
    const nx = sel.includes(u) ? sel.filter(x => x !== u) : [...sel, u];
    if (nx.length === 2) return (m.hidden = true), vanGo(nx);
    vanPick(nx);
  };
}
/* 0.1.53 遠古之器：選要獻祭的寵物（可以多選，顯示合計幾星），按「獻祭」 */
function sacPick(sel = []) {
  const run = S.run,
    v = [...run.bag.items, ...run.bench].find(o => o && ITEMI[o.id].sacrifice),
    c = [...run.bag.items, ...run.bench].filter(sacOK),
    val = o => ITEMI[o.id].star * 3 ** (o.t - 1),
    tot = c.filter(o => sel.includes(o.u)).reduce((n, o) => n + val(o), 0),
    have = (v && v.sv) || 0;
  const body = c.length
    ? `<p class="sub">已累積 ${have}／${VESSEL_N} 星；選了 ${tot} 星${have + tot >= VESSEL_N ? `，可以召喚 ${fl((have + tot) / VESSEL_N)} 隻四兇` : ''}（Ⅱ 階算 3 倍、Ⅲ 階 9 倍）</p><div class="rvit">${c
        .map(
          o =>
            `<button class="s${ITEMI[o.id].star}${sel.includes(o.u) ? ' sel' : ''}" data-su="${o.u}"><img src="${itemIcon(o.id)}" alt="">${esc(fuName(o))}${tierTxt(o.t)}<small>${val(o)} 星</small></button>`
        )
        .join('')}</div>`
    : '<p class="empty">背包和暫存區沒有寵物可以獻祭</p>';
  showDlg(
    '遠古之器：獻祭寵物',
    body,
    sel.length
      ? [
          [
            `獻祭（${tot} 星）`,
            () => {
              const r = sacrifice(run, sel);
              if (typeof r === 'string') return toast(r);
              snd('coin');
              toast(
                r.length
                  ? `召喚了 ${r.map(id => ITEMI[id].n).join('、')}！`
                  : `獻祭完成，累積 ${(v && v.sv) || 0}／${VESSEL_N} 星`
              );
              V.sel = null;
              save();
              render();
            }
          ]
        ]
      : []
  );
  const m = $('modal'),
    close = m.onclick;
  m.onclick = ev => {
    const b = ev.target.closest('[data-su]');
    if (!b) return close(ev);
    const u = b.dataset.su;
    sacPick(sel.includes(u) ? sel.filter(x => x !== u) : [...sel, u]);
  };
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
function giantTxt(bag) {
  const pf = petFx(bag);
  if (!pf || pf.giant == null) return '';
  return pf.giant
    ? `<p class="c-good">巨獸化：已達成（寵物 ${pf.n} 隻）</p>`
    : `<p class="c-warn">巨獸化：未達成，寵物 ${pf.n} 隻（要 1～2 隻）</p>`;
}
function coreDetHTML(run) {
  const c = run.bag.core;
  if (!c) return '';
  const one = (id, sub) =>
    `<div class="cdet"><img src="${itemIcon(id)}" alt=""><div><b style="color:${STARC[5]}">${ITEMI[id].n}</b>${sub ? `<small>${sub}</small>` : ''}<p>${dsc(itemDesc(id))}</p></div></div>`;
  return `<div class="det" id="det"><div class="dh"><img src="${itemIcon(c.id)}" alt=""><div><b style="color:${STARC[5]}">職業核心</b><small>不佔背包格子・整局有效</small></div><button class="iconbtn" data-act="desel" aria-label="關閉">✕</button></div>
    ${one(c.id, '2-5 首領')}${giantTxt(run.bag)}${c.sc && ITEMI[c.sc] ? one(c.sc, '4-4 首領・融入') : '<p class="c-dim">4-4 首領會再給一個核心，融入這裡</p>'}${c.m ? mod5HTML(c.m) : ''}</div>`;
}
/* 0.1.40 上一場這件觸發了幾次（武器以外的道具：飾品、防具、盾、藥水；武器看戰鬥紀錄的傷害） */
function trigHTML(run, o, where) {
  const I = ITEMI[o.id];
  if (where !== 'bag' || I.dmg || !run.trig || !run.log || !run.log.length) return '';
  const n = run.trig[o.u] || 0;
  return `<p class="${n ? 'c-good' : 'c-dim'}">上一場（${run.log[run.log.length - 1].id}）觸發 ${n} 次</p>`;
}
/* 0.1.41 說明文字裡的異常、護盾前面加上對應的小圖示（長的先比，劇毒不會被當成中毒） */
/* 0.1.70 重做的異常圖示：有新圖（ail_n_*）用新的，沒有照舊 */
const icN = (n, old) => (typeof ART !== 'undefined' && ART[n] ? n : old);
/* 0.1.70 賽制、主題、職業的圖示有新圖就換 */
for (const m of MODES) m.ic = icN('mode_' + m.k, m.ic);
for (const T of POOLTH) T.ic = icN('th_' + T.k, T.ic);
/* 0.1.70 職業圖示（cls_代號）；核心的預設圖示在 items.js 載入時就拿了，不受影響 */
for (const c of CLASSES) c.ic = icN('cls_' + c.id, c.ic);
const KW_IC = [
  ['劇毒', 'ail_dmark'],
  ['中毒', 'ail_poison'],
  ['點燃', 'sk_fireburst'],
  ['燃燒', icN('ail_n_burn', 'ail_burn')],
  ['流血', 'ail_bleed'],
  ['破甲', 'ail_vul'],
  ['凍結', 'ail_frozen'],
  ['冰緩', 'sk_frostnova'],
  ['暈眩', 'ail_stun'],
  ['虛弱', icN('ail_n_weak', 'ail_curse')],
  ['致盲', icN('ail_n_blind', 'ail_mark')],
  ['衰老', 'ail_slow'],
  ['腐蝕', icN('ail_n_corrode', 'asc_alchemist_c0')],
  ['混亂', 'ail_shock'],
  ['封鎖', icN('ail_n_seal', 'ail_guard')],
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
  return `<div class="ovl"><div class="dlg2 ${l.win ? 'win' : 'lose'}"><b class="big">${l.win ? '勝利！' : '落敗'}</b><p>${esc(l.opp)}</p>${l.loss ? `<p class="c-bad">生命 -${l.loss}（剩 ${run.hp}）</p>` : ''}${l.hit ? `<p class="c-good">${l.ko ? '對手淘汰！' : `對手生命 -${l.hit}`}</p>` : ''}${l.gold ? `<p class="c-gold">+${l.gold} 金${l.luck ? '（幸運 +2）' : ''}</p>` : ''}${l.capture && ITEMI[l.capture] ? `<p class="c-good">捕獲了${ITEMI[l.capture].n}！（放進暫存區）</p>` : ''}${l.spent ? `<p class="c-dim">金錢標花了 ${l.spent} 金</p>` : ''}<div class="g2"><button class="btn" data-act="log" data-k="${run.log.length ? run.log[run.log.length - 1].id : ''}">詳細</button><button class="btn pri" data-act="afterRes">繼續</button></div></div></div>`;
}
/* 0.1.101 覺醒／質變的戰鬥事件（sim 的 'cv'，x 是哪一種） */
const CVTXT = { valk: '女武神之槍！', valh: '英靈殿', bird: '火鳥', molt: '蛻皮', pthrow: '投擲藥劑', sdbash: '盾擊' },
  CVCOL = { valk: '#ffe9a0', valh: '#ffe9a0', bird: '#ff9a5a', molt: '#9be27a', pthrow: '#9be27a', sdbash: '#cfe0ff' };
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
        `<button class="pk s${ITEMI[id].star}" data-act="pick" data-k="${id}"><img src="${itemIcon(id)}" alt="">${t > 1 ? tierBadge(t) : ''}${ITEMI[id].core ? '' : shapeMini(id)}<span><b style="color:${STARC[ITEMI[id].star]}">${vkTag(run, id)}${ITEMI[id].n}${t > 1 ? tierTxt(t) : ''}</b><small>${dsc(ITEMI[id].vk === 'd' ? vkDesc(id) : itemDesc(id, t))}</small></span></button>`
    )
    .join(
      ''
    )}</div>${p.re != null ? `<button class="btn" data-act="pickRe" ${p.re > 0 ? '' : 'disabled'}>${p.re > 0 ? `刷新<small class="bnote">剩 ${p.re} 次</small>` : '刷新用完了'}</button>` : ''}</div></div>`;
}
/* 0.1.101 4-4 有覺醒、質變時，每個選項前面標「新核心／覺醒／質變」 */
function vkTag(run, id) {
  const I = ITEMI[id],
    mc = I.core && mainCore(run);
  if (!mc || !(run.pend.opts || []).some(k => ITEMI[k].vof)) return '';
  const k = I.vk || 'n';
  return `<em class="vkt vk-${k}">${{ n: '新核心', d: '覺醒', t: '質變' }[k]}</em>`;
}
/* 0.1.101 三選一裡的覺醒只寫多出來的：跟原本核心同一句（只差數字）的算「數值提高」，完整的在圖鑑與詳細說明 */
function vkDesc(id) {
  const seg = d => d.split(/[；、]/),
    key = x => x.replace(/[\d.]+/g, '#'),
    b0 = seg(itemDesc(ITEMI[id].vof)),
    base = new Set(b0.map(key)),
    v = seg(itemDesc(id)).slice(1),
    add = v.filter(x => !base.has(key(x))),
    up = v.some(x => base.has(key(x)) && !b0.includes(x));
  const n = ITEMI[ITEMI[id].vof].n.split('・')[1];
  /* 只有數字變了（永恆黃昏）、或原本的效果被換掉一部分（富可敵國）：照完整說明 */
  const vk = new Set(v.map(key));
  if (!add.length || b0.some(x => !vk.has(key(x)))) return itemDesc(id).split('；').slice(1).join('；');
  return `保留「${n}」的效果${up ? '（數值提高）' : ''}，再加：${add.join('、')}`;
}
/* 0.1.7 開局職業三選一（可以刷新一次） */
function clsHTML(run) {
  return `<div class="ovl"><div class="dlg2"><b>選擇職業</b><p class="c-dim">整局都有效，照職業去買道具${run.mode && run.mode !== 'std' ? `・本局賽制：${MODEI[run.mode].n}` : ''}</p><div class="picks">${run.clsOpts
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
  return `<div class="home endp"><div class="logo"><b class="pl p${run.place}">第 ${run.place} 名</b><small>${run.place === 1 ? '你是第一名！' : run.place === 2 ? '差一點點' : '下次再來'}</small></div>
    <div class="card endrk">${rankHTML(1)}${rankMove(run)}<small class="c-dim">打到 ${curRound(run) ? curRound(run).id : '最後'}</small></div>
    ${xpHTML(run)}<h3>最後的背包</h3><div class="bagwrap">${bagHTML(run.bag, cs, { mini: 1, id: 'endbag' })}</div>
    <button class="btn pri big" data-act="again">再來一局</button><button class="btn" data-act="endHome">結束戰鬥回首頁</button></div>`;
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
    me = fightF(run, compileBag(run.bag), curRound(run).st),
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
/* 0.1.97 手機的戰鬥畫面要一屏放得下（背包變大時「跳過」被擠到下面）：雙方的小背包一定並排、用同一個格子大小，
   照螢幕寬（兩個背包加起來）和高（扣掉上方、角色、按鈕、紀錄最少 56px）算，最小 14px */
function bMiniCs(bags) {
  const w = Math.min(innerWidth, 480) - 32 - 16 * (bags.length - 1) - 18 * bags.length,
    h = innerHeight - 456,
    sw = bags.reduce((n, b) => n + b.w, 0),
    gw = bags.reduce((n, b) => n + (b.w - 1) * GAP, 0),
    mh = Math.max(...bags.map(b => b.h));
  return Math.max(14, Math.min(30, fl((w - gw) / sw), fl((h - (mh - 1) * GAP) / mh)));
}
/* 戰鬥紀錄吃剩下的高度：按鈕一直在螢幕最下面（電腦版另外排） */
function bFit() {
  const lg = $('blog');
  if (!lg || DESK()) return;
  lg.style.height = '';
  const ctl = document.querySelector('.bctl'),
    pad = parseFloat(getComputedStyle($('app')).paddingBottom) || 0,
    free = innerHeight - pad - ctl.getBoundingClientRect().bottom;
  lg.style.height = Math.max(56, lg.offsetHeight + free) + 'px';
}
/* 0.1.35 怪物的圖本來就朝左，不翻；對戰的對手是玩家頭像（朝右）才左右翻 */
function renderBattle() {
  if (!B) resumeFight();
  const { fb } = B,
    run = S.run,
    ob = fb.opp.bag,
    /* 0.1.58 電腦版：兩邊的背包在左右兩欄，格子放大（兩個背包同一個大小） */
    dw =
      DESK() &&
      Math.min(
        64,
        ...[run.bag, ob]
          .filter(Boolean)
          .map(b =>
            Math.min(
              fl(((deskW() - 640) / 2 - 24 - (b.w - 1) * 3) / b.w),
              fl((innerHeight / V.z - 140 - (b.h - 1) * 3) / b.h)
            )
          )
      ),
    cs = dw ? Math.max(24, dw) : bMiniCs([run.bag, ob].filter(Boolean));
  $('app').innerHTML = `<div class="bt${ob ? '' : ' nob'}">
    <div class="btop"><small>${fb.r.id}・${RTYPE[fb.r.type]}</small><b id="btime">0.0 秒</b>${sfxBtn()}</div>
    <div class="arena"><div class="fr"><i class="sp" id="sp0">${avCv(S.av, 'big')}</i><b>${esc(S.name)}</b><i class="hpb big"><i id="hp0"></i><i class="bk" id="bk0"></i><i class="kline" id="kl0" hidden></i><em id="hpt0"></em></i><div class="sts" id="sts0"></div>${supHTML(0)}<div class="trp" id="trp0"></div>${smnHTML(0)}<i class="sunb" id="sun0" hidden></i></div>
    <div class="vs">VS</div>
    <div class="fr"><i class="sp" id="sp1">${fb.opp.kind === 'pvp' ? avCv(fb.opp.spr.slice(2), 'big flip') : sprCv(fb.opp.spr, 'big')}</i><b>${esc(fb.opp.n)}</b><i class="hpb big"><i id="hp1"></i><i class="bk" id="bk1"></i><i class="kline" id="kl1" hidden></i><em id="hpt1"></em></i><div class="sts" id="sts1"></div>${supHTML(1)}<div class="trp" id="trp1"></div>${smnHTML(1)}<i class="sunb" id="sun1" hidden></i></div>
    <div class="fx" id="fx"></div></div>
    <div class="bbags"><div><small>你的背包</small>${bagHTML(run.bag, cs, { mini: 1, id: 'bb0' })}</div>${ob ? `<div><small>對手的背包</small>${bagHTML(ob, cs, { mini: 1, id: 'bb1' })}</div>` : ''}</div>
    <div class="blog" id="blog" aria-live="off"></div>
    <div class="bctl"><button class="btn" data-act="spd">×${S.speed || 1}</button><button class="btn" data-act="skip">跳過</button></div>
  </div>`;
  paintSprites();
  bPots();
  bShow();
  bFit();
  clearInterval(renderBattle.iv);
  renderBattle.iv = setInterval(bTick, 33);
}
/* 0.1.50 協同作戰召喚的亞馬遜戰士：角色兩旁的小人（拿矛的女騎士、拿弓的精靈弓手），頭上浮著繼承的武器（充能條、出手會閃） */
/* 0.1.99 支援單位列（生命條下面一排小圖示）：不在格子上的攻擊者，出手時跟背包裡的道具一樣閃。
   戰狼開戰先半透明、角標是幾秒後加入，加入時彈一下；幻影（嫉妒、塔羅月亮複製的武器）虛線框 */
function supHTML(s) {
  const sup = ((B.fb.res.sup || [])[s] || []).filter(([, id]) => ITEMI[id]);
  return sup.length
    ? `<div class="supr" id="sup${s}">${sup
        .map(
          ([u, id, vw, at]) =>
            `<div class="it smit${vw ? ' wait' : ' ph'}" data-u="${u}" aria-label="${vw ? `戰狼，${at} 秒後加入` : `幻影：${ITEMI[id].n}`}"><img src="${itemIcon(id)}" alt=""><em>${vw ? at + 's' : '影'}</em></div>`
        )
        .join('')}</div>`
    : '';
}
function smnHTML(s) {
  const l = B.fb.res.ev.filter(e => e.k === 'summon' && e.s === s);
  if (!l.length) return '';
  return `<div class="smn${s ? ' op' : ''}" id="smn${s}">${l
    .map(e => {
      const I = ITEMI[e.id],
        bow = I && (I.tags.includes('bow') || I.tags.includes('xbow'));
      return `<div class="smf k${e.v}" data-u="${e.u}"><div class="it smit" data-u="${e.u}"><img src="${itemIcon(e.id)}" alt="${I ? I.n : ''}"></div><i>${sprCv(bow ? 'a_av_elf' : 'a_av_knight', s ? 'flip' : '')}</i></div>`;
    })
    .join('')}</div>`;
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
    /* 0.1.51 焚盡：生命條上的斬殺線（燃燒層數 × N，生命低於這條線直接燒死） */
    const kf = (i ? B.fb.me : B.fb.opp.F).burnout,
      kl = $('kl' + i);
    if (kl) {
      const kv = kf && B.st ? B.st[i][0] * kf : 0;
      kl.hidden = !(kv > 0);
      if (kv > 0) kl.style.left = Math.min(100, (kv / tot) * 100) + '%';
    }
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
    const root = $('bb' + s),
      sm = $('smn' + s);
    /* 0.1.50 召喚的戰士的武器也有充能條 */
    if (sm)
      for (const [u, ts] of Object.entries(B.cdt.t[s])) {
        const el = sm.querySelector(`.it[data-u="${u}"]`);
        if (!el) continue;
        let k = 0;
        while (k < ts.length && ts[k] <= B.t) k++;
        const a = k ? ts[k - 1] : 0,
          b = ts[k];
        el.style.setProperty('--cd', b == null ? 0 : Math.min(1, (B.t - a) / Math.max(0.05, b - a)).toFixed(3));
      }
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
    dmgDown: '傷害降低',
    /* 0.1.50 插箭、撕裂、插矛 */
    arrow: '插箭',
    rend: '撕裂',
    pin: '插矛',
    /* 0.1.51 電荷、麻痺 */
    chg: '電荷',
    para: '麻痺',
    /* 0.1.106 騎士：盾勢、耐力球（自己身上的增益） */
    sd: '盾勢',
    endu: '耐力球',
    /* 0.1.106 刺客：印記（被疊的那一方身上）、爆擊球、潛行 */
    mk: '印記',
    orb: '爆擊球',
    stl: '潛行'
  },
  /* 0.1.37 陷阱的名字 */
  TRAPN = {
    ignite: '點燃',
    bomb: '藥劑炸彈',
    spore: '劇毒孢子',
    icicle: '冰錐',
    snare: '捕獸夾',
    net: '獵網',
    stake: '尖樁',
    shock: '電網',
    heart: '愛心'
  },
  /* 0.1.47 陷阱的圖示與顏色 */
  TRAPI = {
    ignite: ['sk_fireburst', '#ff7a3a'],
    bomb: ['asc_alchemist_b0', '#ffb15a'],
    spore: ['it_c_venom_7', '#5fd38a'],
    icicle: ['it_c_cryo_2', '#8fd8ff'],
    snare: ['sk_trapshot', '#ff8a5a'],
    net: ['it_bugnet', '#ffe27a'],
    stake: ['it_spikestud', '#ff5a7a'],
    shock: ['asc_judge_c0', '#fff27a'],
    heart: ['asc_s_heart', '#ff7ab8']
  },
  STI = [
    ['burn', icN('ail_n_burn', 'ail_burn'), 1],
    ['poison', 'ail_poison', 1],
    ['bleed', 'ail_bleed', 1],
    ['sunder', 'ail_vul', 1],
    ['frozen', 'ail_frozen', 0],
    ['stun', 'ail_stun', 0],
    ['weak', icN('ail_n_weak', 'ail_curse'), 0],
    ['blind', icN('ail_n_blind', 'ail_mark'), 0],
    ['venom', 'ail_dmark', 1],
    ['ignite', 'sk_fireburst', 0],
    ['corrode', icN('ail_n_corrode', 'asc_alchemist_c0'), 0],
    ['age', 'ail_slow', 0],
    ['chill', 'sk_frostnova', 1],
    ['confuse', 'ail_shock', 0],
    ['arrow', icN('ail_n_arrow', 'sk_rainarrow'), 1],
    ['rend', 'asc_valkyrie_c0', 1],
    ['pin', icN('ail_n_pin', 'sk_javelin'), 1],
    ['chg', 'sk_spark', 1],
    ['para', 'asc_storm_b1', 1],
    ['sd', 'sk_shieldwall', 1],
    ['endu', 'msk_harden', 1],
    ['mk', 'sk_backstab', 1],
    ['orb', 'asc_s_spark', 1],
    ['stl', 'sk_smokebomb', 0]
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
      /* 0.1.106 刺客潛行：半透明 */
      sp.classList.toggle('stl', B.st[s][23] > 0);
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
  age: '#c9b89a',
  rend: '#ff3a5a',
  para: '#fff27a'
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
/* 0.1.13 即時戰鬥紀錄：每個事件一行（新的在上面，0.1.54 起留最後 200 行、可以捲）：誰的哪件道具、做了什麼 */
function bNames() {
  const nm = [{}, {}],
    put = (k, its) => {
      for (const o of its) nm[k][o.u] = fuName(o);
    };
  put(0, S.run.bag.items);
  /* 0.1.53 獸群召喚的戰狼 */
  for (const e of B.fb.res.ev) if (e.k === 'wolf') nm[e.s][e.u] = '戰狼';
  /* 0.1.50 召喚的戰士：「戰士（長槍）」 */
  for (const e of B.fb.res.ev)
    if (e.k === 'summon') nm[e.s][e.u] = `亞馬遜戰士（${ITEMI[e.id] ? ITEMI[e.id].n : '武器'}）`;
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
    t = `${by(e.s, e.u)}${e.hv ? ' 重擊' : ''}${e.luck ? ' 幸運一擊' : ''}${e.ch ? ' 彈射' : ''}${e.ctr ? ' 反擊' : ''}${e.lk ? ' 連攜 ×2' : ''}${e.k === 'crit' ? ' 暴擊' : ''} → ${e.v}${e.ab ? `（擋 ${e.ab}）` : ''}`;
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
    t = `${who(1 - e.s)}的${it(1 - e.s, e.tu) || '道具'} 觸發${TRAPN[e.x] || '陷阱'}${e.v ? ` -${e.v}` : ''}${e.x === 'snare' || e.x === 'heart' ? '，這次出手落空' : ''}${e.brk ? `（${TRAPN[e.x]}用完了）` : ''}`;
  else if (e.k === 'weak') t = `${who(tg)} 虛弱 ${e.v} 秒`;
  else if (e.k === 'blind') t = `${who(tg)} 致盲 ${e.v} 秒`;
  else if (e.k === 'thorns') t = `${who(e.s)} ${e.rod ? '避雷針電擊' : e.sg ? '護盾破裂反彈' : '反彈'} ${e.v}`;
  /* 0.1.96 七宗罪 */ else if (e.k === 'sin') t = sinLog(e, who);
  else if (e.k === 'charm') t = `${who(1 - e.s)}的${it(1 - e.s, e.tu) || '武器'} 被魅惑：下一次出手打自己`;
  /* 0.1.53 馴獸師 */ else if (e.k === 'wolf') t = `${who(e.s)} 的戰狼加入戰鬥（第 ${e.v} 隻）`;
  else if (e.k === 'pounce') t = `${who(e.s)} 撲殺！寵物全部出手`;
  else if (e.k === 'whip') t = `${by(e.s, e.u)} 被鞭策出手`;
  else if (e.k === 'petGuard') t = `${by(e.s, e.u)} 護主反咬`;
  else if (e.k === 'fatigue') t = `${who(tg)} 疲勞 -${e.v}`;
  else if (e.k === 'mkx') t = `${who(e.s)} 引爆 ${e.v} 層印記：必定暴擊`;
  else if (e.k === 'cleanse') t = `${who(e.s)} 淨化了 ${e.v} 種異常`;
  else if (e.k === 'sealAll') t = `${by(e.s, e.u)} 封鎖了${who(1 - e.s)}所有武器 ${e.v} 秒`;
  else if (e.k === 'seal')
    t = `${by(e.s, e.u)} ${e.v >= MAX_T ? '關住' : '封鎖'}了${who(1 - e.s)}的${it(1 - e.s, e.tu) || '武器'}${e.v >= MAX_T ? '（整場）' : ` ${e.v} 秒`}`;
  else if (e.k === 'down') t = `${by(e.s, e.u)} 讓${who(1 - e.s)}的${it(1 - e.s, e.tu) || '武器'}降 1 階`;
  else if (e.k === 'throw') t = `${by(e.s, e.u)} 丟出藥劑：${STN[e.x] || ''} ${e.v}`;
  /* 0.1.50 弓箭手、亞馬遜 */ else if (e.k === 'boom') t = `${who(tg)} 身上 ${e.n} 支箭引爆 -${e.v}`;
  else if (e.k === 'rain') t = `${who(e.s)} 射出箭雨：${e.n} 支箭 -${e.v}`;
  else if (e.k === 'revive') t = `${who(e.s)} ${e.ankh ? '安卡' : '女武神降臨'}！復活 ${e.v} 生命`;
  else if (e.k === 'summon') t = `${who(e.s)} 召喚${it(e.s, e.u) || '亞馬遜戰士'}`;
  else if (e.k === 'pinOut') t = `${who(e.s)} 拔出${who(tg)}身上的矛：撕裂`;
  /* 0.1.101 覺醒／質變 */ else if (e.k === 'cv')
    t = `${who(e.s)} ${CVTXT[e.x] || ''}${e.v ? ` → ${who(tg)} -${e.v}` : ''}`;
  /* 0.1.74 狂戰士 */ else if (e.k === 'ragna') t = `${who(e.s)} 諸神黃昏！${e.v} 秒內狂暴`;
  else if (e.k === 'undying') t = `${who(e.s)} 不死之怒！${e.v} 秒內不會倒下`;
  else if (e.k === 'rite') t = `${who(e.s)} 血祭 -${e.v}`;
  else if (e.k === 'axeThrow') t = `${who(e.s)} 擲出 ${e.v} 把斧：${who(tg)}破甲、撕裂`;
  /* 0.1.51 火法師、雷法師 */ else if (e.k === 'zap') t = `${who(tg)} 電荷滿了：放電 -${e.v}${e.ov ? '（超載）' : ''}`;
  else if (e.k === 'meteor') t = `${who(e.s)} 隕石落下 → ${who(tg)} -${e.v}`;
  else if (e.k === 'bolt') t = `${who(e.s)} 落雷 → ${who(tg)} -${e.v}`;
  else if (e.k === 'flash') t = `${who(tg)} 爆燃 -${e.v}`;
  else if (e.k === 'combust') t = `${who(e.s)} 炎爆：引爆 ${e.n} 層燃燒 -${e.v}`;
  else if (e.k === 'burnout') t = `${who(tg)} 被焚盡！`;
  else if (e.k === 'phoenix') t = `${who(e.s)} 鳳凰涅槃：清掉異常`;
  else if (e.k === 'avatar') t = `${who(e.s)} 化身火焰`;
  else if (e.k === 'god') t = `${who(e.s)} 雷神降臨！`;
  else if (e.k === 'palsy') t = `${who(tg)} 麻痺滿了：癱瘓 ${e.v} 秒`;
  else if (e.k === 'static') t = `${who(1 - e.s)}的${it(1 - e.s, e.tu) || '道具'} 觸電，這次出手落空`;
  else if (e.k === 'spark')
    t = e.v > 1 || e.cells ? `${who(tg)}的背包著火（${e.cells ? e.cells.length : ''} 格）` : `${who(tg)} 身上冒出火苗`;
  else if (e.k === 'sun') t = `${who(e.s)} ${e.v ? '白天：矛傷害提升' : '夜晚：弓攻速提升'}`;
  if (!t) return;
  const d = document.createElement('p');
  d.className = e.s ? 'op' : 'me';
  d.innerHTML = `<i>${e.t.toFixed(1)}</i>${t}`;
  box.prepend(d);
  /* 0.1.54 可以往下捲看舊的：留 200 行 */
  while (box.childElementCount > 200) box.lastElementChild.remove();
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
  /* 0.1.50 召喚的戰士出手：那個小人往前衝 */
  const sm = e.u && String(e.u).startsWith('sm') && document.querySelector(`#smn${e.s} .smf[data-u="${e.u}"]`);
  bAnim(sm || $('sp' + e.s), e.s ? 'atkL' : 'atkR');
  if (!sm) avPlay($('sp' + e.s));
  bAnim($('sp' + tg), 'hurt');
  if (e.el && e.el !== 'phys') bBurst(tg, ELC[e.el], e.k === 'crit' ? 10 : 5);
  else bSlash(tg, e.k === 'crit');
  if (e.k === 'crit') bAnim(document.querySelector('.arena'), 'shake');
}
/* 0.1.60 藥水：背包裡的藥水右上角顯示還能喝幾次，喝完整件變暗（重新整理接著播也算對：數已經播過的） */
function bPots() {
  [B.fb.me, B.fb.opp.F].forEach((F, side) => {
    for (const p of (F && F.pots) || []) {
      const el = document.querySelector(`#bb${side} .it[data-u="${p.u}"]`);
      if (!el) continue;
      const used = B.fb.res.ev.slice(0, B.i).filter(e => e.k === 'pot' && e.s === side && e.u === p.u).length,
        left = Math.max(0, p.n - used);
      el.insertAdjacentHTML('beforeend', `<b class="potn">${left}</b>`);
      el.classList.toggle('used', left <= 0);
    }
  });
}
function bPot(e) {
  const el = document.querySelector(`#bb${e.s} .it[data-u="${e.u}"]`),
    n = el && el.querySelector('.potn');
  if (!n) return;
  const left = Math.max(0, +n.textContent - 1);
  n.textContent = left;
  if (left <= 0) el.classList.add('used');
}
function bFlash(side, u) {
  if (!u) return;
  const el = document.querySelector(
    `#bb${side} .it[data-u="${u}"], #smn${side} .it[data-u="${u}"], #sup${side} .it[data-u="${u}"]`
  );
  if (!el) return;
  el.classList.remove('act');
  void el.offsetWidth;
  el.classList.add('act');
}
/* 0.1.97 戰鬥中的連動光線（從來源道具射到目標道具，射到後淡掉；2 倍速以上透明度 45%）：
   齒輪 → 被充能的武器、連鎖機關 → 被帶動的武器、棋子 → 被它加成的武器出手 */
function bBeam(side, a, b, col) {
  const root = $('bb' + side),
    A = root && root.querySelector(`.it[data-u="${a}"]`),
    Z = root && root.querySelector(`.it[data-u="${b}"]`);
  if (!A || !Z || calm()) return;
  const c = el => [el.offsetLeft + el.offsetWidth / 2, el.offsetTop + el.offsetHeight / 2],
    [x1, y1] = c(A),
    [x2, y2] = c(Z),
    r = `rotate(${Math.atan2(y2 - y1, x2 - x1)}rad)`,
    l = document.createElement('i');
  l.className = 'beam';
  l.style.cssText = `left:${x1}px;top:${y1}px;width:${Math.hypot(x2 - x1, y2 - y1)}px;--bc:${col};opacity:${(S.speed || 1) >= 2 ? 0.45 : 1}`;
  root.appendChild(l);
  const an = l.animate(
    [
      { transform: r + ' scaleX(0)' },
      { transform: r + ' scaleX(1)', opacity: 1, offset: 0.45 },
      { transform: r + ' scaleX(1)', opacity: 0 }
    ],
    { duration: 420 / Math.min(2, S.speed || 1), easing: 'ease-out' }
  );
  an.onfinish = () => l.remove();
}
/* 棋子 → 被它加成的武器（開戰時算一次：目標 u → 棋子 u） */
function bPcBeam(side, u) {
  if (!B.pcm) {
    B.pcm = [S.run.bag, B.fb.opp.bag].map(b => {
      const m = new Map();
      if (b) for (const [p, us] of pcTargets(b)) for (const x of us) m.set(x, [...(m.get(x) || []), p]);
      return m;
    });
  }
  for (const p of B.pcm[side].get(u) || []) bBeam(side, p, u, 'var(--gold)');
}
/* 機關城：武器下面的計數點（每第 N 次多打，滿了閃一下＋「連擊！」）、齒輪充能、連鎖帶動 */
function bMech(e) {
  if (e.x !== 'nk') {
    for (const to of e.to) bBeam(e.s, e.u, to, '#7fe0ff'), e.x === 'drv' && bFlash(e.s, to);
    return;
  }
  const el = document.querySelector(`#bb${e.s} .it[data-u="${e.u}"]`);
  if (!el) return;
  let p = el.querySelector('.nkp');
  if (!p) {
    p = document.createElement('span');
    p.className = 'nkp';
    p.innerHTML = '<i></i>'.repeat(e.n);
    el.appendChild(p);
  }
  [...p.children].forEach((d, i) => d.classList.toggle('on', e.v === 0 || i < e.v));
  if (e.v) return;
  bPop(1 - e.s, '連擊！', '#7fe0ff', 1);
  setTimeout(() => [...p.children].forEach(d => d.classList.remove('on')), 300);
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
/* 0.1.50 日月輪轉：角色左上角的小圓圖示（☀ 白天、☾ 夜晚）淡入淡出，換的時候跳一下字；場地背景不變 */
function bSun(e) {
  const el = $('sun' + e.s);
  if (!el) return;
  const first = el.hidden;
  el.hidden = false;
  el.className = 'sunb ' + (e.v ? 'day' : 'night');
  el.textContent = e.v ? '☀' : '☾';
  el.title = e.v ? '白天：矛傷害提升' : '夜晚：弓、弩攻速提升';
  bAnim(el, 'swap');
  if (!first) bPop(e.s, e.v ? '白天' : '夜晚', e.v ? '#ffd76a' : '#a9b8ff');
}
/* 0.1.51 星星之火：對方背包著火的格子（一格一格擴散）；怪物沒有背包，在牠下面排一個火苗 */
function bSpark(e) {
  const side = 1 - e.s,
    root = $('bb' + side);
  if (root && e.cells) {
    const cs = parseFloat(root.style.getPropertyValue('--cs')) || 24;
    for (const [x, y] of e.cells) {
      const m = document.createElement('i');
      m.className = 'firec';
      m.style.cssText = `left:${x * (cs + GAP)}px;top:${y * (cs + GAP)}px;width:${cs}px;height:${cs}px`;
      root.appendChild(m);
    }
  } else if (!e.cells && $('trp' + side) && !$('trp' + side).querySelector('.firem')) {
    const m = document.createElement('i');
    m.className = 'trapm inrow firem';
    m.style.cssText = '--tc:#ff7a3a';
    m.innerHTML = `<img src="${artIconURL('sk_fire') || iconURL('star')}" alt="火苗">`;
    $('trp' + side).appendChild(m);
  }
}
/* 0.1.51 從天上落下的東西（隕石、落雷）：打在被打的那一邊 */
function bFall(side, kind) {
  const fx = $('fx');
  if (!fx || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const f = document.createElement('i');
  f.className = 'fall ' + kind;
  f.style.left = (side ? 75 : 25) + '%';
  fx.appendChild(f);
  setTimeout(() => f.remove(), 450);
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
    if (e.k === 'sun') bSun(e);
    if (e.k === 'spark') bSpark(e);
    if (e.k === 'pot') bPot(e);
    if (e.k === 'mech') bMech(e);
    if (k++ > 6) continue;
    if (e.k === 'hit' || e.k === 'crit') {
      bPop(
        tg,
        (e.ch ? '彈射 ' : '') +
          (e.hv ? '重擊 ' : '') +
          (e.luck ? '幸運 ' : '') +
          (e.ctr ? '反擊 ' : '') +
          (e.lk ? '連攜 ' : '') +
          (e.k === 'crit' ? '暴擊 ' : '') +
          e.v +
          (e.ab ? `（擋 ${e.ab}）` : ''),
        ELC[e.el] || '#fff',
        e.k === 'crit'
      );
      bFlash(e.s, e.u);
      if (k < 3) bPcBeam(e.s, e.u);
      bHit(e, tg);
      if (k < 2) snd(e.k === 'crit' ? 'crit' : 'hit');
    } else if (e.k === 'miss') bPop(tg, e.parry ? '招架' : '閃避', '#b3a9bd');
    else if (e.k === 'dot') {
      bPop(tg, e.ab ? (e.v ? `${e.v}（擋 ${e.ab}）` : `擋 ${e.ab}`) : e.v, ELC[e.el]);
      bBurst(tg, ELC[e.el], 3);
    } else if (e.k === 'fatigue') bPop(tg, '疲勞 ' + e.v + (e.ab ? `（擋 ${e.ab}）` : ''), '#ff6a3a');
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
    } else if (e.k === 'boom') {
      bPop(tg, `引爆 ${e.v}`, '#ff9a5a', 1);
      bBurst(tg, '#ff9a5a', 10);
    } else if (e.k === 'rain') {
      bPop(tg, `箭雨 ${e.v}`, '#fff', 1);
      bBurst(tg, '#d8d2c8', 12);
    } else if (e.k === 'revive') {
      bPop(e.s, e.ankh ? '安卡復活！' : '女武神降臨！', '#ffe9a0', 1);
      bBurst(e.s, '#ffe9a0', 14, 1);
      $('sp' + e.s)?.classList.remove('ko');
      if (!e.ankh) $('sp' + e.s)?.classList.add('valk');
    } else if (e.k === 'pinOut') {
      bPop(tg, '拔矛・撕裂', '#ff3a5a', 1);
      bBurst(tg, '#ff3a5a', 8);
    } else if (e.k === 'mkx') {
      /* 0.1.106 刺客：消耗印記（必定暴擊） */
      bPop(tg, `印記引爆 ×${e.v}`, '#ff5a7a', 1);
      bBurst(tg, '#ff5a7a', 10);
    } else if (e.k === 'cv') {
      /* 0.1.101 覺醒／質變：自己身上的（女武神、蛻皮）跳在自己，打人的跳在對手 */
      const on = e.self ? e.s : tg;
      bPop(on, `${CVTXT[e.x] || ''}${e.v ? ` ${e.v}` : ''}`, CVCOL[e.x] || '#ffe9a0', 1);
      bBurst(on, CVCOL[e.x] || '#ffe9a0', 10, e.self ? 1 : 0);
      if (e.x === 'valk') $('sp' + e.s)?.classList.add('valk');
    } else if (e.k === 'ragna' || e.k === 'undying') {
      /* 0.1.74 狂戰士：諸神黃昏、不死之怒 */
      bPop(e.s, e.k === 'ragna' ? '諸神黃昏！' : '不死之怒！', '#ff3a5a', 1);
      bBurst(e.s, '#ff3a5a', 14, 1);
    } else if (e.k === 'rite') {
      bPop(e.s, `血祭 -${e.v}`, '#ff3a5a');
      bBurst(e.s, '#ff3a5a', 8, 1);
    } else if (e.k === 'axeThrow') {
      bPop(tg, '擲斧！', '#ff8a8a', 1);
      bBurst(tg, '#ff8a8a', 8);
    } else if (e.k === 'summon') bBurst(e.s, '#bfe9ff', 6, 1);
    else if (e.k === 'wolf') {
      bPop(e.s, '戰狼加入', '#ffd27a');
      bBurst(e.s, '#ffd27a', 6, 1);
      /* 0.1.99 支援單位列：戰狼從半透明倒數變成加入（彈一下） */
      const wf = document.querySelector(`#sup${e.s} .it[data-u="${e.u}"]`);
      if (wf) wf.classList.remove('wait'), wf.querySelector('em').remove(), pop(wf);
    } else if (e.k === 'pounce') {
      bPop(e.s, '撲殺！', '#ff8a5a', 1);
      bBurst(1 - e.s, '#ff8a5a', 12);
    } else if (e.k === 'whip') bPop(e.s, '鞭策', '#ffd27a');
    else if (e.k === 'petGuard') {
      bPop(e.s, '護主', '#bfe9ff');
      bFlash(e.s, e.u);
    } else if (e.k === 'sin') {
      const x = SYN[SYNI[e.x]];
      if (x) bPop(e.s, sinPop(e), x.c, 1), bBurst(e.s, x.c, 8, 1);
    } else if (e.k === 'charm') {
      bPop(1 - e.s, '魅惑', '#ff7ab8');
      bFlash(1 - e.s, e.tu);
    } else if (e.k === 'zap') {
      bPop(tg, `${e.ov ? '超載' : '放電'} ${e.v}`, '#fff27a', 1);
      bBurst(tg, '#fff27a', 12);
      bFall(tg, 'bolt');
    } else if (e.k === 'bolt') {
      bPop(tg, `落雷 ${e.v}`, '#fff27a');
      bFall(tg, 'bolt');
    } else if (e.k === 'meteor') {
      bPop(tg, `隕石 ${e.v}`, '#ff9a5a', 1);
      bFall(tg, 'meteor');
      bBurst(tg, '#ff9a5a', 10);
    } else if (e.k === 'flash') {
      bPop(tg, `爆燃 ${e.v}`, '#ff7a3a', 1);
      bBurst(tg, '#ff7a3a', 16);
      bAnim(document.querySelector('.arena'), 'shake');
    } else if (e.k === 'combust') {
      bPop(tg, `炎爆 ${e.v}`, '#ff7a3a', 1);
      bBurst(tg, '#ff7a3a', 12);
    } else if (e.k === 'burnout') {
      bPop(tg, '焚盡！', '#ff5a3a', 1);
      bBurst(tg, '#ff5a3a', 18);
    } else if (e.k === 'phoenix') {
      bPop(e.s, '鳳凰涅槃', '#ffb15a', 1);
      bBurst(e.s, '#ffb15a', 14, 1);
    } else if (e.k === 'avatar') {
      bPop(e.s, '火之化身', '#ff9a5a', 1);
      $('sp' + e.s)?.classList.add('avt');
    } else if (e.k === 'god') {
      bPop(e.s, '雷神降臨！', '#fff27a', 1);
      $('sp' + e.s)?.classList.add('god');
    } else if (e.k === 'palsy') bPop(tg, '癱瘓', '#fff27a', 1);
    else if (e.k === 'static') {
      bPop(1 - e.s, '觸電', '#fff27a');
      bFlash(1 - e.s, e.tu);
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
    luck: out.luck || 0,
    capture: out.capture || null,
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
  ['stat', '屬性'],
  ['mode', '賽制'],
  ['pool', '主題'],
  ['food', '料理']
];
/* 0.1.85 百科改成用到才產生：分頁點到才產生、分組展開才產生內容（CXG）、圖示捲到才產生（cxIcons）。
   之前一打開就把 6 個分頁、1800 張圖示一次做完（2.9 MB），每載好一張大圖又整個重畫，會卡好幾秒 */
const CXG = new Map(); /* 分組的 data-k → 產生內容的函式 */
const cxGroup = (k, sum, body, q) => {
  CXG.set(k, body);
  return `<details class="more cxg" data-k="${k}"${q ? ` data-q="${esc(q.toLowerCase())}"` : ''}><summary>${sum}</summary></details>`;
};
/* 展開時才把內容放進去（搜尋時 cxFilter 全部放） */
function cxFill(g) {
  const f = !g.dataset.f && CXG.get(g.dataset.k);
  if (!f) return;
  g.dataset.f = 1;
  g.insertAdjacentHTML('beforeend', f());
  cxIcons(g);
}
document.addEventListener(
  'toggle',
  ev => ev.target.matches?.('details.cxg') && ev.target.open && cxFill(ev.target),
  true
);
/* 列的圖示先只記名字（道具 data-iid、其他 data-ain），捲到畫面附近才轉成圖片網址 */
const cxIt = id => `data-iid="${id}"`;
const cxAi = n => (typeof ART !== 'undefined' && ART[n] ? `data-ain="${n}"` : '');
const cxSrc = im =>
  (im.src = im.dataset.iid ? itemIcon(im.dataset.iid) : artIconURL(im.dataset.ain) || iconURL('star'));
const cxIO =
  typeof IntersectionObserver !== 'undefined' &&
  new IntersectionObserver(
    es => {
      for (const e of es) if (e.isIntersecting) cxIO.unobserve(e.target), cxSrc(e.target);
    },
    { rootMargin: '300px' }
  );
function cxIcons(root) {
  for (const im of root.querySelectorAll('img[data-iid]:not([src]), img[data-ain]:not([src])'))
    cxIO ? cxIO.observe(im) : cxSrc(im);
}
/* 0.1.96 七宗罪發動時：戰鬥畫面的大字、戰鬥紀錄的一行 */
const sinPop = e =>
  e.x === 'wrath'
    ? e.end
      ? '倒下'
      : e.last
        ? '最後的狂怒！'
        : '暴走！'
    : e.x === 'sloth'
      ? `接力一圈 ×${e.v}`
      : e.x === 'glut'
        ? '吞天！'
        : e.x === 'pride'
          ? '王者決鬥'
          : e.x === 'envy'
            ? `取而代之：${SYN[SYNI[e.g]] ? SYN[SYNI[e.g]].n : ''}`
            : SYN[SYNI[e.x]].n;
const sinLog = (e, who) => `${who(e.s)} ${sinPop(e)}`;
const cxgi = n => (artIconURL(n) ? `<img class="cxgi" src="${artIconURL(n)}" alt="">` : '');
/* 0.1.74 百科的賽制分頁：每個賽制一組（規則＋細項：印記、商人、詛咒與祝福、星象、遺物、塔羅牌）；0.1.75 道具池拆到自己的分頁 */
const CX_MODE_SUB = {
  sins: () =>
    SYN.map(x => cxRow('cxm_sn' + x.k, cxAi(x.ic), x.n, '羈絆', x.t.map((t, l) => `${SYN_AT[l]} 件：${t}`).join('；'))),
  caravan: () => VANS.map(x => cxRow('cxm_v' + x.k, cxAi(x.ic), x.n, '流浪商人', x.d)),
  curse: () => [
    ...CURSES.map(x => cxRow('cxm_c' + x.k, '', x.n, '詛咒', x.d(x.v))),
    ...BLESS.map(x => cxRow('cxm_b' + x.k, '', x.n, '祝福', x.d(x.v)))
  ],
  astro: () => ASTROS.map(x => cxRow('cxm_a' + x.k, cxAi('astro_' + x.k), x.n, '星象', x.d)),
  relic: () => RELICS.map(x => cxRow('cxm_r' + x.k, cxAi(x.ic), x.n, '遺物', x.d)),
  tarot: () =>
    TAROT.map((x, i) =>
      cxRow(
        'cxm_t' + x.k,
        cxAi('tarot_' + x.k),
        `${i} ${x.n}`,
        '塔羅牌',
        `正位（${TAROT_CN[x.u.c]}）：${x.u.d}；逆位（${TAROT_CN[x.v.c]}）：${x.v.d}`
      )
    )
};
const cxModeHTML = () =>
  MODES.filter(m => m.w > 0)
    .map(m =>
      cxGroup(
        'cxm_' + m.k,
        cxgi(m.ic) + m.n,
        () =>
          `<ul class="mrules cxrule">${m.d.map(x => `<li>${x}</li>`).join('')}</ul>${CX_MODE_SUB[m.k] ? `<div class="cxl">${CX_MODE_SUB[m.k]().join('')}</div>` : ''}`,
        m.n + ' ' + m.d.join(' ')
      )
    )
    .join('');
/* 0.1.103 百科的料理分頁：食材、半成品（招牌）、混合料理、大料理各一組 */
const cxFoodHTML = () =>
  [
    ['ing', '食材', '商店每格 15% 出現'],
    ['semi', '半成品', '兩個相同食材'],
    ['mix', '料理', '兩個不同食材'],
    ['big', '大料理', '兩種半成品・2 格']
  ]
    .map(([k, n, sub]) => {
      const its = ITEMS.filter(i => i.fk === k);
      return cxGroup(
        'cxf_' + k,
        `<img class="cxgi" ${cxIt(its[0].id)} alt="">${n}<small>${its.length} 種・${sub}</small>`,
        () => its.map(i => cxRow('cxf_' + i.id, cxIt(i.id), i.n, FKN[k], dsc(itemDesc(i.id)), ' fd')).join(''),
        its.map(i => i.n).join(' ')
      );
    })
    .join('');
/* 0.1.75 百科的道具池分頁：每個主題一組（機制＋專屬的飾品、輔助；武器列名字） */
const cxPoolHTML = () =>
  POOLTH.map(x => {
    const its = ITEMS.filter(i => i.th === x.k && shopOK(i));
    return cxGroup(
      'cxp_' + x.k,
      `${cxgi(x.ic)}${x.n}<small>${its.length} 件專屬道具</small>`,
      () => {
        const ws = its.filter(i => i.dmg);
        return `<ul class="mrules cxrule">${x.d.map(d => `<li>${d}</li>`).join('')}</ul><div class="cxl">${its
          .filter(i => !i.dmg)
          .map(i =>
            cxRow('cxp_' + i.id, cxIt(i.id), i.n, `${stars(i.star)}・${x.n}`, dsc(itemDesc(i.id)), ` s${i.star}`)
          )
          .join('')}${
          ws.length
            ? cxRow(
                'cxp_' + x.k + '_w',
                '',
                `武器 ${ws.length} 把`,
                '道具分頁看詳細',
                [1, 2, 3, 4, 5]
                  .map(st => {
                    const l = ws.filter(i => i.star === st);
                    return l.length ? `${stars(st)}：${l.map(i => i.n).join('、')}` : '';
                  })
                  .filter(Boolean)
                  .join('；')
              )
            : ''
        }</div>`;
      },
      x.n + ' ' + x.d.join(' ')
    );
  }).join('');
/* 異常狀態：[圖示, 名字, 說明] */
const CX_AIL = () => [
  [icN('ail_n_burn', 'ail_burn'), '燃燒', '每秒扣「層數」的血，之後少 1 層（N 層一共約扣 N×(N+1)/2）。'],
  [
    'sk_fireburst',
    '點燃',
    `被點燃後整場有效、只有一層：燃燒不再每秒 -1，改成每秒 +1，而且燃燒傷害 ×${IGNITE_MUL}。火法師讓敵人燃燒到 15 層時自動點燃。`
  ],
  ['ail_poison', '中毒', `每秒扣「層數」的血，層數不會減少。最多 ${POISON_MAX} 層（毒師讓敵人最多 24 層）。`],
  [
    'ail_dmark',
    '劇毒',
    `每秒扣「層數 ×${VENOM_MUL}」的血，層數不會減少。最多 ${VENOM_MAX} 層（毒師核心「劇毒」40 層）。`
  ],
  ['ail_bleed', '流血', '每秒扣「層數」的血，之後層數減半（N 層一共約扣 2N）。'],
  [
    'asc_valkyrie_c0',
    '撕裂',
    `比流血快：每 0.5 秒受「層數」傷害，之後層數剩 ${REND_KEEP * 100}%（N 層一共約 4N）。吃流血抗性。`
  ],
  [
    icN('ail_n_arrow', 'sk_rainarrow'),
    '插箭',
    `弓箭手的弓、弩命中時插在敵人身上，整場不退（最多 ${ARROW_MAX} 支）；每支讓敵人受到弓箭手的攻擊傷害 +1%，爆裂箭、倒鉤箭、鷹眼狙擊也看箭的數量。`
  ],
  [
    'sk_spark',
    '電荷',
    `雷法師的雷命中（含彈射）讓敵人 +1 電荷，滿 ${CHARGE_MAX} 層放電：${ZAP_DMG} 固定傷害、麻痺 ${ZAP_PARA} 層，然後歸零。`
  ],
  ['asc_storm_b1', '麻痺', `每層攻速 -${PARA_SLOW}%（最多 ${PARA_MAX} 層），每秒少 1 層；吃暈眩抗性。`],
  [
    icN('ail_n_pin', 'sk_javelin'),
    '插矛',
    `亞馬遜核心「插矛」：每把讓敵人攻速 -${PIN_SLOW}%（最多 ${PIN_MAX} 把）；插滿後下一次命中全部拔出，撕裂 ${PIN_REND}。`
  ],
  ['ail_vul', '破甲', `扣敵人的護甲，整場不退、會疊加，最多 ${SUNDER_MAX}；護甲最低到 -10（受到的傷害最多 ×1.25）。`],
  ['ail_frozen', '凍結', `凍住敵人一件武器或盾 ${FREEZE_T} 秒，期間完全不能充能；凍結中的道具不能再被凍。`],
  ['sk_frostnova', '冰緩', `敵人一件武器或盾充能速度減半（命中觸發 ${CHILL_T} 秒）。`],
  ['ail_stun', '暈眩', '整個人不能動：武器、盾不能充能，也不能喝藥水。'],
  [icN('ail_n_weak', 'ail_curse'), '虛弱', `造成的傷害 -${WEAK_PCT}%（${WEAK_T} 秒）。`],
  [icN('ail_n_blind', 'ail_mark'), '致盲', `攻擊多 ${BLIND_MISS}% 打不中（${BLIND_T} 秒）。`],
  ['ail_slow', '衰老', '不能暴擊。'],
  [
    icN('ail_n_corrode', 'asc_alchemist_c0'),
    '腐蝕',
    `不能獲得護盾；本來會獲得護盾時（盾格擋、喝藥水的護盾…）改成扣 ${CORRODE_HP} 生命。`
  ],
  ['ail_shock', '混亂', `武器出手時 ${CONFUSE}% 機率打到自己。`],
  [icN('ail_n_seal', 'ail_guard'), '封鎖', '開戰時被封鎖的武器幾秒內不能充能（整場的叫「關住」）。'],
  ['ail_stacks', '降階', '開戰時把敵人一把 Ⅱ 階以上的武器降 1 階（傷害變成三分之一）。', 'flip']
];
/* 屬性與機制：[名字, 說明] */
/* 0.1.44 寫清楚每種防禦對什麼有效（照 sim.js：只有武器、寵物的「攻擊」會被閃避、招架、護甲擋；0.1.105 起護盾什麼傷害都先擋，焚盡除外） */
const CX_STAT = () => [
  [
    '攻擊傷害',
    '武器和寵物每次出手打出的傷害。不分物理或火、冰、雷、毒等元素，算法都一樣（遊戲沒有元素抗性）；元素只決定吃哪些加成、會帶什麼異常。'
  ],
  [
    '持續傷害',
    '燃燒、中毒、劇毒、流血每秒扣血：有護盾時先被護盾擋，不吃護甲、閃避；抗性與淨化會減少它，也不會吸血、反彈。'
  ],
  ['固定傷害', '反彈、藥劑炸彈、腐蝕扣血、疲勞：有護盾時先被護盾擋，不吃護甲、閃避。'],
  ['傷害', '攻擊的傷害區間；「傷害 +%」乘在基礎傷害上。'],
  ['攻速', '充能速度：攻速 +100% 等於冷卻減半。'],
  ['暴擊率／暴擊傷害', '只有攻擊會暴擊：暴擊時傷害 ×暴擊傷害（基礎 160%）；暴擊率超過 100% 沒有用；衰老時不能暴擊。'],
  [
    '護甲',
    '只減少攻擊傷害（含元素武器）：受到 ×50÷(50+護甲)，例如護甲 50 受到一半。持續傷害、固定傷害不受影響；破甲會扣護甲。'
  ],
  [
    '護盾（格擋）',
    '白色護盾條：受到的傷害（攻擊、持續傷害、固定傷害都算）先被它吃掉，吃完才扣生命。盾每隔幾秒給一次，開戰護盾一開始就有；攻擊穿甲的那部分、焚盡（直接燒死）擋不住。'
  ],
  ['閃避', '有機率躲開整次攻擊（那一下的命中效果也不會發生），最多 40%；躲不開持續傷害、固定傷害與開戰效果。'],
  ['招架', '被攻擊時有機率擋下整次攻擊（浪人核心），跟閃避一樣只對攻擊有效。'],
  ['吸血', '照「實際打出去的攻擊傷害」（扣掉對方護甲、護盾後）回血；持續傷害不會吸血。'],
  ['每秒回復', '每秒回復固定生命。'],
  [
    '反彈',
    '被攻擊時反彈固定傷害給攻擊者，被護盾擋下也算；不吃他的護甲，但他有護盾時先被護盾擋。被閃避、招架時不反彈。盾的「格擋時反彈」是護盾吃到傷害時才反彈。'
  ],
  ['受到的攻擊傷害 +%', '缺點類效果：受到的攻擊傷害變多（持續傷害、固定傷害不變）。'],
  [
    '盾勢',
    `騎士的職業特性：護盾每吃掉 ${SD_STEP} 點傷害（攻擊、持續傷害、固定傷害都算），盾勢 +1 層，最多 ${SD_CAP} 層；整場累積、不會消耗。每層所有武器傷害 +${SD_DMG}%，騎士的核心也照層數加強。`
  ],
  [
    '印記',
    `刺客的職業特性：命中時敵人 +1 層印記（最多 ${MK_CAP} 層，淨化清不掉）；疊滿時下一次攻擊消耗全部印記：必定暴擊、每層傷害 +${MK_DMG}%，並得到 1 顆爆擊球。`
  ],
  [
    '爆擊球',
    `刺客每次消耗印記得到 1 顆（整場累積，最多 ${ORB_CAP} 顆）：每顆暴擊率 +${ORB_CRIT}%、暴擊傷害 +${ORB_CM}%。刀陣會在出手時消耗它換背刺。`
  ],
  ['潛行', `刺客閃避成功時潛行 ${STL_T[0]} 秒：閃避 +${STL_DG[0]}%；角色變半透明。`],
  ['耐力球', `騎士核心「聖光」：盾勢到 5、10、15 層時各得到 1 顆，每顆受到的攻擊傷害 -${ENDU_DR}%，最多 3 顆。`],
  ['連擊／連鎖', '連擊：有機率馬上再打一下；連鎖：每次攻擊多打幾下，多打的傷害打折。'],
  ['穿甲', `無視一部分護甲與護盾，最多 ${PIERCE_MAX}%。`],
  ['處決／背水', '處決：敵人生命低於 30% 時傷害提高；背水：自己生命低於 50% 時傷害（或攻速）提高。'],
  [
    '狂血',
    `狂戰士的職業特性：每少 10% 生命，斧、鎚攻速 +${BLOOD_SPD}%、吸血 +${BLOOD_LS}%（最多算到少 90%）。血祭讓開戰就少一截，諸神黃昏、不死之怒在快倒下時爆發。`
  ],
  ['先手', '開戰時武器已經充能幾 %，第一下比較快。'],
  ['越戰越快', '每 5 秒攻速提高，最多 5 次。'],
  ['抗性', `受到某種異常的層數或秒數減少，最多 -${RES_MAX}%；淨化每 ${CLEANSE_T} 秒清掉身上最嚴重的異常。`],
  ['陷阱', '開戰時放進敵人背包的格子（至少一格壓在道具上），那格的道具每次出手都會觸發；打怪時掛在怪物的武器上。'],
  [
    '凹口',
    '巨人國的 U 形、環形、H 形、C 形道具中間空出來的格子，也可以用巨大藥、鑿子做出來；凹口裡吃得到的道具有加成：武器的凹口加武器、防具和盾的凹口加護甲與生命、飾品的凹口所有數值都加（數字比較小）。'
  ],
  [
    '改造',
    `巨人國的工具拖到道具上：縮小藥變成 1 格、數值 ×${MD_K.shrink.join('／')}%；巨大藥變大、數值 ×${MD_K.grow.join('／')}%、長出凹口；鑿子把拖到的那一格挖成凹口、數值 ×${MD_K.chisel.join('／')}%（照工具的階 Ⅰ／Ⅱ／Ⅲ）。每件道具只能改造一次，職業核心不能改造；合成時三件的改造不一樣可以選要留哪一種。`
  ],
  [
    '融合',
    '融合輔助放到道具上或貼在旁邊，就跟它合成一件「前綴・道具」：多了標籤（變成某系、吃那一系的加成）和效果，輔助消失、空出格子。一件道具只能融合一次。'
  ],
  ['疲勞', `開戰 ${FATIGUE_T} 秒後雙方每秒受到越來越高的固定傷害，一定分出勝負。`],
  ['升階', '3 件相同、同階的道具自動合成高一階（最多 Ⅲ 階），數值大幅提升，還會多一條詞綴。'],
  ['池子', '一場裡每件道具大家共用數量（越稀有越少），別人收走的就比較難刷到。'],
  [
    '棋子',
    '棋盤王國的 1 格飾品，照西洋棋的走法加成遠處的道具：兵（正上方）、騎士（日字形 8 格，不會被擋）、主教（4 條斜線）、城堡（上下左右）、皇后（8 個方向）、國王（周圍 8 格）。直線、斜線每個方向只影響碰到的第一件道具。選棋子時，被影響的道具會亮起來。'
  ],
  [
    '星河',
    `黃道十二宮的星座（1 格飾品）：同一排或同一行、中間沒有別的星座的兩個星座之間是一條星河（緊貼的不算），夾在中間的道具同時拿到兩端星座的效果。星座升階時效果放大。${Object.values(
      ZODS
    )
      .map(z => `${z.n}：${z.d}`)
      .join('；')}。`
  ],
  [
    '羈絆',
    '只有七宗罪賽制有：每件道具屬於一組宗罪（5★ 兩組），背包裡同一組湊 2／4／6／8／10 件開效果。暴怒（怒氣、暴走）、怠惰（接力）、暴食（吸血、脂肪、餵食）、傲慢（王冠）、貪婪（萬能牌、多拿）、嫉妒（偷、複製）、色慾（愛心陷阱、魅惑）。'
  ],
  [
    '塔羅牌',
    '塔羅牌陣賽制：第 1、3、5 階段開頭四選一，每張生效兩個階段；正位、逆位效果不同。戰鬥類的牌記在快照裡，快照對手也有效。'
  ]
];
/* 0.1.55 百科改版：上面搜尋欄（名字、標籤、說明都搜，四個分頁一起找），每一項是可以展開的一列；道具照星級分組、可以收合。
   搜尋在畫面上直接篩（cxFilter），不重畫，輸入框不會跳掉 */
const plain = h => String(h).replace(/<[^>]*>/g, '');
/* 0.1.62 道具在哪個道具池（百科的第二行；搜尋也找得到「巨人國」） */
const thName = i => {
  if (!shopOK(i)) return '核心送的';
  const t = thOf(i);
  /* 0.1.85 x：0.1.69 退出商店的舊武器（只當起手道具、舊快照用） */
  return t === 'b'
    ? '基本池'
    : t === 'x'
      ? '不在商店'
      : POOLTH.filter(x => t.includes(x.k))
          .map(x => x.n)
          .join('、');
};
/* ic：圖示的屬性（cxIt／cxAi，捲到才載；固定的圖用 src="…"），空字串是沒有圖示 */
function cxRow(key, ic, name, sub, body, cls = '') {
  const q = (name + ' ' + plain(sub) + ' ' + plain(body)).toLowerCase();
  return `<details class="cxr${cls}" data-k="${key}" data-q="${esc(q)}"><summary>${ic ? `<img ${ic} alt="">` : ''}<span><b>${name}</b>${sub ? `<small>${sub}</small>` : ''}</span></summary><p>${body}</p></details>`;
}
const cxTags = i =>
  i.tags
    .filter(t => t !== 'weapon')
    .map(t => TAGN[t])
    .join('・');
/* 每個分頁：[說明, 產生內容]（點到這個分頁、或搜尋時才產生） */
const CX_SEC = {
  item: [
    '點星級展開，點道具看說明。',
    () =>
      [1, 2, 3, 4, 5]
        .map(st => {
          const l = ITEMS.filter(i => i.star === st && !i.core);
          return cxGroup(
            'cxst' + st,
            `<span style="color:${STARC[st]}">${stars(st)}</span><small>${l.length} 種・拿過 ${l.filter(i => S.seen[i.id]).length}</small>`,
            () =>
              `<div class="cxl">${l
                .map(i =>
                  cxRow(
                    'cxi_' + i.id,
                    cxIt(i.id),
                    i.n,
                    `${cxTags(i)}・${shapeOf(i.id).length} 格・${thName(i)}`,
                    dsc(itemDesc(i.id)),
                    ` s${st}${S.seen[i.id] ? '' : ' unseen'}`
                  )
                )
                .join('')}</div>`
          );
        })
        .join('')
  ],
  cls: [
    '2-5 首領掉專屬核心，4-4 首領再掉一個融入第一個，都從你的職業池三選一。點職業展開。',
    () =>
      CLASSES.map(C =>
        cxGroup(
          'cx_' + C.id,
          `${cxgi(C.ic)}${C.n}<small>${dsc(clsDesc(C.id))}</small>`,
          () =>
            `<div class="cxl">${ITEMS.filter(i => i.cls === C.id && i.core === 1 && !i.vOff)
              .map(i =>
                cxRow(
                  'cxc_' + i.id,
                  cxIt(i.id),
                  i.n.split('・')[1],
                  /* 0.1.101 覺醒、質變排在原本的核心後面 */
                  i.vof ? `${i.vk === 'd' ? '覺醒' : '質變'}「${ITEMI[i.vof].n.split('・')[1]}」` : C.n + '・專屬核心',
                  dsc(itemDesc(i.id)),
                  ' s5'
                )
              )
              .join('')}</div>`
        )
      ).join('')
  ],
  ail: [
    '戰鬥中角色身上和道具上的狀態。抗性可以減少層數或秒數。',
    () =>
      CX_AIL()
        .map(([ic, n, d, f]) => cxRow('cxa_' + n, cxAi(ic) || `src="${iconURL('star')}"`, n, '', d, f ? ' flip' : ''))
        .join('')
  ],
  stat: [
    '道具說明裡常見的數值與機制。',
    () =>
      CX_STAT()
        .map(([n, d]) => cxRow('cxs_' + n, '', n, '', d))
        .join('')
  ],
  mode: ['賽制讓每局不一樣：開場轉盤（外圈）抽一個，整局改變規則。點賽制展開看規則。', cxModeHTML],
  pool: [
    '道具池決定這局商店賣哪一套道具：開場轉盤（內圈）抽一個，圍繞它的機制構築。點主題展開看專屬道具。',
    cxPoolHTML
  ],
  food: [
    '食物放在背包裡就有效（常駐），只加你自己。食材＋食材＝料理，相同的是半成品；半成品＋半成品＝大料理，兩個招牌都會發動。青色框的還能再合。',
    cxFoodHTML
  ]
};
const cxSecHTML = k =>
  `<section class="cxsec" data-tab="${k}"><p class="sub">${CX_SEC[k][0]}</p><div class="cxl">${CX_SEC[k][1]()}</div></section>`;
function codexHTML() {
  const tab = V.cxTab || 'item',
    nav = `<div class="cxtab">${CX_TABS.map(([k, n]) => `<button aria-pressed="${tab === k}" data-act="cxTab" data-k="${k}">${n}</button>`).join('')}</div>`;
  return `<div class="page"><div class="ptop"><button class="iconbtn" data-act="home" aria-label="返回">‹</button><b>百科</b><small>${ITEMS.filter(i => !i.core).length} 種道具・拿過的會亮起來</small></div>
    <div class="cxsearch"><input class="inp" id="cxq" type="search" placeholder="搜尋道具、核心、異常、機制…" value="${esc(V.cxQ || '')}" autocomplete="off"><button class="iconbtn" data-act="cxClear" aria-label="清除搜尋">✕</button></div>
    ${nav}<p class="sub cxcount" id="cxcount" hidden></p>
    ${cxSecHTML(tab)}
    <p class="empty" id="cxnone" hidden>找不到符合的項目，換個關鍵字試試（例如「流血」「盾」「5★」）</p></div>`;
}
/* 百科的篩選：沒有關鍵字只顯示目前分頁；有關鍵字時所有分頁一起找（還沒產生的分頁、分組這時才產生），沒有符合的分組收起來、有的自動展開 */
function cxFilter() {
  const root = $('app'),
    q = (V.cxQ || '').trim().toLowerCase(),
    tab = V.cxTab || 'item';
  if (!root || !root.querySelector('#cxq')) return;
  if (q) {
    for (const [k] of CX_TABS)
      if (!root.querySelector(`.cxsec[data-tab="${k}"]`)) $('cxnone').insertAdjacentHTML('beforebegin', cxSecHTML(k));
    for (const g of root.querySelectorAll('.cxg')) cxFill(g);
  }
  let n = 0;
  for (const sec of root.querySelectorAll('.cxsec')) {
    if (!q) {
      sec.hidden = sec.dataset.tab !== tab;
      for (const r of sec.querySelectorAll('.cxr, .cxg')) r.hidden = false;
      continue;
    }
    let any = 0;
    for (const r of sec.querySelectorAll('.cxr')) {
      const ok = r.dataset.q.includes(q);
      r.hidden = !ok;
      if (ok) any++;
    }
    for (const g of sec.querySelectorAll('.cxg')) {
      const has =
        g.querySelector('.cxr:not([hidden])') ||
        g.querySelector('summary').textContent.toLowerCase().includes(q) ||
        (g.dataset.q || '').includes(q);
      g.hidden = !has;
      if (has) g.open = true;
    }
    sec.hidden = !any && !sec.querySelector('.cxg:not([hidden])');
    n += any;
  }
  const c = $('cxcount'),
    none = $('cxnone');
  c.hidden = !q;
  c.textContent = q ? `搜尋「${V.cxQ.trim()}」：${n} 筆` : '';
  none.hidden = !q || n > 0;
  root.querySelector('.cxtab').classList.toggle('off', !!q);
  cxIcons(root);
}
/* 0.1.88 每段收成「標題＋一句摘要」，點開看細節（之前是一整面文字） */
function helpHTML() {
  return `<div class="page help"><div class="ptop"><button class="iconbtn" data-act="${S.run && S.run.phase !== 'end' ? 'play' : 'home'}" aria-label="返回">‹</button><b>怎麼玩</b></div>
  <details class="more" open><summary>一局<small>4 人一場，生命歸零淘汰，活到最後是第 1 名</small></summary><p>4 位玩家一場，每人 ${START_HP} 點生命。每回合在商店買道具、擺進背包，然後自動戰鬥。輸了扣生命，歸零就淘汰；最後活下來的是第 1 名。戰鬥中角色的生命會跟著階段變多（第 1 階段 ×1.5、第 2 階段 ×2.6、第 3 階段 ×3.6…），後期一場大約打 8～10 秒，持續傷害、回復、慢速重武器才有發揮空間。</p></details>
  <details class="more"><summary>職業<small>開局三選一，整局有效</small></summary><p>每局開打前三選一（可以刷新一次），整局都有效：例如弓箭手讓弓、弩傷害 +20%、攻速 +15%。照職業去買武器和輔助道具（箭袋、劍帶、法術卷軸、火藥地雷、獸牙項鍊…），輔助道具要擺在武器旁邊或同一排才有用，背包空間要取捨。點左上角頭像可以看職業與數值。</p></details>
  <details class="more"><summary>賽制<small>每局隨機一種全場規則</small></summary><ul class="hl">${MODES.filter(
    m => m.w > 0
  )
    .map(m => `<li><b>${m.n}</b>：${m.d[0]}</li>`)
    .join(
      ''
    )}</ul><p class="sub">開場轉盤公開後才選職業；完整規則在百科的「賽制」分頁，準備畫面上方的規則標籤（賽制・道具池）看這局的。</p></details>
  <details class="more"><summary>回合<small>野怪、菁英、對戰、首領的順序</small></summary><p>開局有 ${START_GOLD} 金、商店 5 件 1★，買好擺好就開打：1-1～1-3 野怪 → 1-4 菁英（打完三選一）→ 第 2 階段對戰與野怪穿插：2-1 對戰、2-2 群體野怪、2-3 對戰、2-4 菁英、2-5 首領（打完專屬核心三選一）→ 第 3 階段起以對戰為主，每階段第 4 輪是菁英（戰利品越後面越高星），4-4 是首領（第二個專屬核心三選一）。每一輪開始都能逛商店。畫面上方的回合列看得到這一階段每一輪是什麼。越後面輸一場扣越多。</p></details>
  <details class="more"><summary>金幣<small>每回合收入＋利息＋連勝連敗獎勵</small></summary><p>每回合 ${BASE_INCOME} 金＋利息（每 10 金 +1，最多 +${INTEREST_MAX}）＋連勝或連敗獎勵。刷新商店 ${REROLL} 金，鎖住的商店下回合不換。</p></details>
  <details class="more"><summary>背包<small>花金幣升級；道具有形狀、可以旋轉</small></summary><p>從 3×3 開始，花金幣升級（最大 6×7，越大越貴：3×4 要 14 金，開局只有 ${START_GOLD} 金，要在買道具和存錢之間取捨），背包越大商店越容易出高星道具。道具有形狀，點一下可以旋轉（電腦版拖曳中按 R、空白鍵、滑鼠右鍵或滾輪也能轉）；商店的道具可以直接拖進背包，拖到別的道具上會交換位置（放得下的話），拖回暫存區收起來，拖到商店區直接賣掉。</p></details>
  <details class="more"><summary>合成<small>3 件一樣的自動升一階</small></summary><p>3 件相同、同一階的道具（背包＋暫存區都算）會自動合成高一階，最多 Ⅲ 階，數值大幅提升，還會多一條詞綴。</p></details>
  <details class="more"><summary>相鄰效果<small>飾品加強旁邊、同一排的道具</small></summary><p>飾品會加強「相鄰」（上下左右）、「同一排」或「所有」特定種類的道具。點一下道具，被它加強的道具會亮起來，有吃到加成的道具右上角有「＋」。</p></details>
  <details class="more"><summary>職業核心<small>首領掉落，不佔背包格子</small></summary><p>首領掉落、從你的職業池三選一：2-5 掉專屬核心（每個職業 12 個，各有特色，例如先手、處決、連擊、越戰越快），4-4 再掉一個專屬核心，選了直接融入第一個（兩個效果都有）。核心不佔背包格子，放在背包上方的「核心」按鈕，點了看效果。百科的「職業」分頁可以看全部。</p></details>
  <details class="more"><summary>戰鬥<small>全自動，打久了進入疲勞</small></summary><p>完全自動：每件武器照自己的冷卻出手，盾定時格擋，藥水在生命低的時候喝。${FATIGUE_T} 秒後進入疲勞，雙方受到的傷害越來越高，一定分出勝負。</p></details>
  <details class="more"><summary>異常狀態<small>燃燒、中毒、暈眩…各自的效果</small></summary><p>燃燒、中毒、流血、劇毒每秒扣血（劇毒不會退、×2）；點燃讓燃燒越燒越多；破甲扣護甲；凍結讓一件道具 6 秒不能充能、冰緩讓它充能減半；暈眩不能動；虛弱傷害 -25%；致盲 30% 打不中；衰老不能暴擊；腐蝕不能獲得護盾（改成扣血）；混亂一半打到自己。</p></details>
  <details class="more"><summary>陷阱<small>核心放進敵人背包的陷阱</small></summary><p>有些核心會在開戰時把陷阱放進敵人背包的格子（至少一格壓在道具上），那格的道具每次出手都會觸發。戰鬥時有陷阱的道具右上角有紅點。</p></details>
  <details class="more"><summary>玩家等級<small>每場打完拿經驗</small></summary><p>每場打完照名次拿經驗（第 1 名 ${XP_PLACE[1]}、第 2 名 ${XP_PLACE[2]}…）升級。第一次玩預設「標準」賽制和「巨人國」道具池，其他的到設定打開就會出現在開場轉盤。</p></details>
  <details class="more"><summary>對手<small>其他玩家留下的背包快照</small></summary><p>對戰的對手是其他玩家在同一回合留下的背包快照，不用等人上線。沒有真人時由機器人補位。</p></div></details>`;
}
function settingsHTML() {
  const anon = typeof CLOUD === 'undefined' || CLOUD.anon;
  return `<div class="page set"><div class="ptop"><button class="iconbtn" data-act="home" aria-label="返回">‹</button><b>設定</b></div>
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
  ${pickHTMLs()}
  <h3>帳號</h3><div class="card"><p class="sub">${typeof CLOUD !== 'undefined' ? esc(CLOUD.status) : ''}${anon ? '・目前是遊客，存檔綁在這台裝置' : '・' + esc(CLOUD.email || '')}</p>${
    typeof CLOUD !== 'undefined' && CLOUD.recovery
      ? `<p>請設定新密碼</p><input class="inp" id="authPw" type="password" placeholder="新密碼（至少 6 個字）" autocomplete="new-password" value="${esc(V.authPw || '')}"><button class="btn pri" data-act="newPw" ${V.authBusy ? 'disabled' : ''}>設定新密碼</button><p class="sub${V.authErr ? ' c-bad' : ''}" id="authMsg">${esc(V.authMsg || '')}</p>`
      : anon
        ? `<input class="inp" id="authEmail" type="email" placeholder="信箱" autocomplete="email" value="${esc(V.authEm || '')}"><input class="inp" id="authPw" type="password" placeholder="密碼（至少 6 個字）" autocomplete="current-password" value="${esc(V.authPw || '')}"><div class="g2"><button class="btn pri" data-act="register" ${V.authBusy ? 'disabled' : ''}>註冊</button><button class="btn" data-act="login" ${V.authBusy ? 'disabled' : ''}>登入</button></div><button class="btn sm" data-act="resetPw" ${V.authBusy ? 'disabled' : ''}>忘記密碼</button><p class="sub${V.authErr ? ' c-bad' : ''}" id="authMsg">${esc(V.authMsg || '')}</p>`
        : '<button class="btn" data-act="logout">登出</button>'
  }</div>
  <h3>新手教學</h3><button class="btn" data-act="tutStart">重玩教學關</button>
  <p class="sub ver">塞令老師 v${VER}${GHOST.off ? '・快照對戰離線（用機器人對手）' : ''}</p></div>`;
}
/* 0.1.77 設定：要玩哪些賽制、道具池；0.1.92 沒選過是預設（標準＋巨人國）；0.1.96 先不鎖，全部可以自己打開 */
const PICK_MIN = { m: 1, t: 1 },
  myLv = () => lvInfo(S.xp).lv,
  pickAll = k =>
    (k === 'm' ? MODES.filter(m => m.w > 0).map(m => m.k) : POOLTH.map(x => x.k)).filter(v => unlockLv(k, v) <= myLv()),
  pickNow = k => (S.pick && S.pick[k] && S.pick[k].length ? S.pick[k] : DEF_PICK[k]);
function pickHTMLs() {
  const grp = (k, title, list) => {
    const on = pickNow(k);
    return `<h3>${title}<small class="c-dim">・開了 ${on.length}／${pickAll(k).length}</small></h3><div class="seg3 pkg">${list
      .map(([c, n, ic]) => {
        const L = unlockLv(k, c),
          im = artIconURL(ic) ? `<img src="${artIconURL(ic)}" alt="">` : '';
        return L > myLv()
          ? `<button class="btn pkb lock" disabled>${im}${n}<small>Lv ${L}</small></button>`
          : `<button class="btn pkb" data-act="pickTog" data-k="${k}" data-v="${c}" aria-pressed="${on.includes(c)}">${im}${n}</button>`;
      })
      .join('')}</div>`;
  };
  return `${grp(
    'm',
    '要玩的賽制',
    MODES.filter(m => m.w > 0).map(m => [m.k, m.n, m.ic])
  )}${grp(
    't',
    '要玩的道具池',
    POOLTH.map(x => [x.k, x.n, x.ic])
  )}<p class="sub">開場轉盤只會抽你打開的；配對也照抽到的賽制＋道具池找對手。每類至少選 1 個。${['m', 't'].some(k => pickAll(k).some(v => !pickNow(k).includes(v))) ? '<button class="btn sm" data-act="pickAll">全部打開</button>' : ''}</p>`;
}
/* ================= 動作 ================= */
function audioOn() {
  if (typeof audioInit === 'function') audioInit();
}
const A = {
  go: d => go(d.k),
  home: () => go('home'),
  /* 0.1.74 打完一局回首頁：這局直接結束（不再留著「繼續對局」） */
  endHome: () => {
    S.run = null;
    save();
    go('home');
  },
  play: () => {
    audioOn();
    if (S.run && S.run.phase === 'end') S.run = null;
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
      /* 0.1.88 音效開關從標題列收進選單（外觀在設定） */
      [
        S.sfx ? '音效：開' : '音效：關',
        () => {
          A.sfxTog();
          A.menu();
        }
      ],
      /* 0.1.88 投降不能復原：紅字、再問一次；0.1.92 教學關沒有投降，是跳過教學 */
      run.tutor
        ? ['跳過教學', () => A.tutEnd({ k: 'skip' })]
        : [
            '投降',
            () => {
              const pl = Math.max(2, 1 + aliveRivals(run).length);
              showDlg('確定投降？', `<p class="sub">這局直接結束，算第 ${pl} 名，沒辦法復原。</p>`, [
                [
                  '投降',
                  () => {
                    endRun(run, pl);
                    save();
                    render();
                  },
                  'danger'
                ]
              ]);
            },
            'danger'
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
  cxClear: () => {
    V.cxQ = '';
    const i = $('cxq');
    if (i) (i.value = ''), i.focus();
    cxFilter();
  },
  cxTab: d => {
    V.cxTab = d.k;
    V.cxQ = '';
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
  desel: () => sheetOut(),
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
    if ((run.bag.st || []).length) return snd('nope'), toast('背包外（紅框）還有道具，先放進背包或收回暫存');
    if (run.relq || run.tarq) return snd('nope'), render();
    if (!run.bag.items.some(o => ITEMI[o.id].dmg)) return toast('背包裡還沒有武器或寵物，打不贏的！');
    beginFight();
  },
  sacr: () => sacPick(),
  /* 0.1.69 塔羅牌陣 */
  tarotPick: d => {
    const e = tarotPick(S.run, d.k);
    if (e) return snd('nope'), toast(e);
    snd('level');
    toast(`塔羅牌：${tarotName(d.k)}`);
    save();
    render();
  },
  tarotSac: () => {
    const run = S.run,
      o = [...run.bag.items, ...run.bench].find(q => q && q.u === V.sel),
      e = o ? tarotSac(run, o.u) : '先選一件道具';
    if (e) return snd('nope'), toast(e);
    snd('level');
    toast(`獻祭了${ITEMI[o.id].n}：生命 +${tarSacHp(o)}`);
    V.sel = null;
    save();
    render();
  },
  /* 0.1.52 賽制 */
  wheelSkip: () => wheelDone(S.run),
  modeOk: () => {
    if (!S.run.mseen) return wheelDone(S.run);
    if (POOLTHI[S.run.theme] && !S.run.mstep) {
      S.run.mstep = 1;
      snd('tap');
      save();
      return render();
    }
    S.run.phase = 'cls';
    snd('tap');
    save();
    render();
  },
  modeInfo: () => {
    const run = S.run,
      M = MODEI[run.mode],
      U = modeUI(run);
    showDlg(
      `本局賽制：${M.n}`,
      `<ul class="mrules">${M.d.map(x => `<li>${x}</li>`).join('')}</ul>${U.info ? U.info(run) : ''}`,
      []
    );
  },
  relicPick: d => {
    const e = relicPick(S.run, d.k);
    if (e) return toast(e);
    snd('coin');
    toast(`拿到${RELICI[d.k].n}`);
    save();
    render();
  },
  legOk: () => {
    S.run.legNew = null;
    snd('tap');
    save();
    render();
  },
  legSel: d => {
    V.sel = V.sel === 'leg' + d.k ? null : 'leg' + d.k;
    snd('tap');
    render();
  },
  legBuy: d => {
    const run = S.run,
      res = legacyBuy(run, +d.k);
    if (typeof res === 'string') return snd('nope'), toast(res);
    snd('coin');
    V.sel = null;
    if (res.merged.length) toast(`合成！${res.merged.map(o => ITEMI[o.id].n + tierTxt(o.t)).join('、')}`);
    save();
    render();
  },
  seenOk: d => {
    S.seen[d.k] = 1;
    snd('tap');
    save();
    render();
  },
  synInfo: () => showDlg('羈絆・七宗罪', synInfoHTML(S.run), []),
  incInfo: () => S.run && S.run.phase === 'prep' && (snd('tap'), showDlg('下回合收入', incomeHTML(S.run), [])),
  /* 0.1.96 暴食 6 件：餵食 */
  feed: () => {
    const run = S.run,
      e = sinFeed(run, V.sel);
    if (e) return snd('nope'), toast(e);
    snd('coin');
    V.sel = null;
    save();
    render();
  },
  /* 0.1.62 道具池：規則＋這個主題專屬的道具（點了看說明） */
  /* 0.1.79 本局規則：賽制＋道具池一起看 */
  rulesInfo: () => {
    const run = S.run,
      M = MODEI[run.mode],
      T = POOLTHI[run.theme],
      U = modeUI(run),
      own = T ? ITEMS.filter(i => i.th === T.k && shopOK(i)).sort((a, b) => a.star - b.star) : [];
    showDlg(
      '本局規則',
      `${run.bag.tar ? `<div class="rlh">${tarotArt(run.bag.tar, 1)}<b>${tarotLine(run.bag.tar)}</b></div>` : ''}<div class="rlh"><img src="${artIconURL(M.ic) || iconURL('star')}" alt=""><b>賽制：${M.n}</b><small>${M.s}</small></div><ul class="mrules">${M.d.map(x => `<li>${x}</li>`).join('')}</ul>${U.info ? U.info(run) : ''}${
        T
          ? `<div class="rlh"><img src="${artIconURL(T.ic) || iconURL('star')}" alt=""><b>道具池：${T.n}</b><small>${T.s}</small></div><ul class="mrules">${T.d.map(x => `<li>${x}</li>`).join('')}<li>商店只出基本池（功能、反制道具）和這個主題的道具</li></ul><h4>專屬道具（${own.length} 件）</h4><div class="thlist">${own.map(i => `<span class="s${i.star}" title="${esc(i.n)}"><img src="${itemIcon(i.id)}" data-iid="${i.id}" alt="">${esc(i.n)}</span>`).join('')}</div>`
          : ''
      }`,
      []
    );
    dlgFrom($q('.rtag'));
  },
  /* 0.1.79 全部對手（準備畫面只顯示下一場的）：點了看他的背包 */
  rivals: () => {
    showDlg('對手', `${rivalHTML(S.run)}<p class="sub">點對手看他上一回合的背包</p>`, []);
    paintSprites($('modal'));
  },
  thInfo: () => {
    const T = POOLTHI[S.run.theme];
    if (!T) return;
    const own = ITEMS.filter(i => i.th === T.k).sort((a, b) => a.star - b.star);
    showDlg(
      `道具池：${T.n}`,
      `<ul class="mrules">${T.d.map(x => `<li>${x}</li>`).join('')}<li>商店只出基本池（功能、反制道具）和這個主題的道具</li></ul><h4>專屬道具（${own.length} 件）</h4><div class="thlist">${own.map(i => `<span class="s${i.star}" title="${esc(i.n)}"><img src="${itemIcon(i.id)}" data-iid="${i.id}" alt="">${esc(i.n)}</span>`).join('')}</div>`,
      []
    );
  },
  mdPick: d => {
    const run = S.run,
      q = run.mdq && run.mdq.shift(),
      o = q && findU(run, q.u),
      m = q && q.o[+d.k];
    if (o && m) {
      V.mdFx = { u: o.u, md: m.md === 'grow' ? 'grow' : 'shrink', r: elOf(o.u) && elOf(o.u).getBoundingClientRect() };
      mdSet(run, o, m.md, m.sh, 0, m.mt);
      requestAnimationFrame(modFx);
    }
    snd('tap');
    save();
    render();
  },
  van: () => {
    const run = S.run,
      v = run.van && VANI[run.van.k];
    if (!v) return;
    if (v.k === 'twin' || v.k === 'gamble') return vanGo();
    if (v.k === 'blood')
      return showDlg(`${v.n}・付 ${v.c} 生命`, `<p class="sub">選要哪一類（比商店高一星）</p>`, [
        ['武器', () => vanGo('weapon')],
        ['防具或盾', () => vanGo('def')],
        ['飾品或藥水', () => vanGo('trinket')]
      ]);
    vanPick();
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
    const v = sellO(run.hold, run);
    run.gold += v;
    run.hold = null;
    snd('coin');
    toast(`賣了 ${v} 金`);
    save();
    render();
  },
  pickRe: () => {
    const e = rerollCores(S.run);
    if (e) return snd('nope'), toast(e);
    snd('tap');
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
    const o = S.run.bag.items.find(q => q.u === V.sel) || (S.run.bag.st || []).find(q => q.u === V.sel);
    if (o) rotIt(o);
  },
  /* 0.1.96 整理區的道具全部收回暫存區（放不下的留著） */
  unstage: () => {
    const run = S.run;
    /* 暫存區滿了：選第一件背包外的道具，打開它的說明（裡面有賣掉、收回） */
    if (benchFree(run) < 0 && (run.bag.st || []).length) {
      V.sel = run.bag.st[0].u;
      snd('tap');
      return render();
    }
    for (const o of [...(run.bag.st || [])]) {
      const fi = benchFree(run);
      if (fi < 0) break;
      run.bag.st = run.bag.st.filter(q => q !== o);
      run.bench[fi] = o;
    }
    if ((run.bag.st || []).length) toast('暫存區滿了，剩下的再按一次處理');
    snd('tap');
    V.sel = null;
    save();
    render();
  },
  toBench: () => {
    const run = S.run,
      o = run.bag.items.find(q => q.u === V.sel) || (run.bag.st || []).find(q => q.u === V.sel),
      fi = benchFree(run);
    if (!o) return;
    if (fi < 0) return toast('暫存區滿了');
    run.bag.items = run.bag.items.filter(q => q !== o);
    if (run.bag.st) run.bag.st = run.bag.st.filter(q => q !== o);
    run.bench[fi] = o;
    V.sel = null;
    save();
    render();
  },
  autoPlace: () => {
    const run = S.run,
      i = run.bench.findIndex(q => q && q.u === V.sel);
    if (i < 0) return;
    const o = run.bench[i];
    /* 0.1.100 巨人國的工具：用在最划算的那件（跟機器人一樣評估）；鑿子連格子一起挑 */
    if (ITEMI[o.id].mod) {
      const ev = botModBest(run, o, BOT_P, botPowerOf(run.bag, BOT_P)),
        q = ev.how === 'mod' && run.bag.items.find(x => x.u === ev.q);
      if (!q) return toast('背包裡沒有能改造的道具');
      modDo(run, o, q, ev.c || cellsOf(q)[0]);
      V.sel = q.u;
      save();
      return render();
    }
    const tg = run.bag.items.filter(q => canFuse(o, q)).sort((a, b) => tfRank(b) - tfRank(a))[0];
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
    if (sellNo(S.run)) return snd('nope'), toast(sellNo(S.run));
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
  /* 戰鬥中只換按鈕，不重畫（重畫會清掉陷阱、火苗等特效） */
  sfxTog: () => {
    S.sfx = !S.sfx;
    save();
    if (S.sfx) snd('tap');
    if (V.scr === 'run' && S.run && S.run.phase === 'battle')
      document.querySelectorAll('.sfxb').forEach(b => (b.outerHTML = sfxBtn()));
    else render();
  },
  themeTog: () => {
    S.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    S.themeSet = true;
    save();
    render();
  },
  /* 0.1.77 選要玩的賽制、道具池：少於最低數量不能再取消 */
  pickTog: d => {
    const k = d.k,
      on = [...pickNow(k)],
      i = on.indexOf(d.v);
    if (i >= 0) {
      if (on.length <= PICK_MIN[k]) return toast(`${k === 'm' ? '賽制' : '道具池'}至少要選 ${PICK_MIN[k]} 個`);
      on.splice(i, 1);
    } else on.push(d.v);
    if (unlockLv(k, d.v) > myLv()) return;
    S.pick = { m: pickNow('m'), t: pickNow('t'), [k]: on };
    save();
    render();
  },
  mstTab: d => {
    V.mst.tab = d.k;
    render();
  },
  pickAll: () => {
    S.pick = { m: pickAll('m'), t: pickAll('t') };
    save();
    render();
  },
  tog: d => {
    S[d.k] = !S[d.k];
    save();
    render();
  },
  tutStart: () => tutStart(),
  /* 0.1.92 教學關結束：done 打完（之後的第一局不再顯示舊的提示列）、play 直接開始正式對戰 */
  tutEnd: d => {
    S.tutDone = 1;
    if (d.k !== 'skip') S.tut = 3;
    S.run = null;
    save();
    d.k === 'play' ? startRun() : go('home');
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
  if (ev.target.id === 'cxq') (V.cxQ = ev.target.value), cxFilter();
  if (ev.target.id === 'authEmail') V.authEm = ev.target.value;
  if (ev.target.id === 'authPw') V.authPw = ev.target.value;
});
/* 簡單的對話框：buttons [[文字, 動作]] */
/* 0.1.12 戰鬥紀錄：列表（新的在上面），點一筆看詳細：秒數、傷害、傷害最高的道具、對手的背包 */
/* 0.1.40 sel：戰鬥紀錄裡對手的背包，點道具看詳細 */
/* 0.1.99 戰報改成三個分頁，一屏看完（docs/設計原則.md：玩家點進來只想知道三件事）：
   「我的」這場每件道具的傷害＋占比＋我的背包、「對手」他的背包和傷害、「全部場次」這局每一場（點了切到那一場的「我的」）。
   id 沒給就看最新一場；tab 是 me／op／all；sel 是 'm:道具u' 或 'o:道具u'（背包裡亮起來、下面看詳細） */
/* 戰報裡不是道具的傷害來源（run.js 的 dmgKey）：名字、圖示 */
const LGX = {
  burn: ['燃燒', 'ail_n_burn', 'ail_burn'],
  poison: ['中毒', 'ail_poison'],
  bleed: ['流血', 'ail_bleed'],
  venom: ['劇毒', 'ail_dmark'],
  rend: ['撕裂', 'asc_valkyrie_c0'],
  corrode: ['腐蝕', 'ail_n_corrode', 'asc_alchemist_c0'],
  thorns: ['反傷', 'it_thornshield'],
  trap: ['陷阱', 'sk_trapshot'],
  boom: ['爆炸', 'sin_wrath_bomber'],
  rain: ['箭雨', 'sk_rainarrow'],
  zap: ['放電', 'sk_spark'],
  bolt: ['雷雲', 'asc_storm_c'],
  meteor: ['隕石', 'sk_meteor'],
  bird: ['火鳥', 'sk_phoenix'],
  valh: ['英靈殿', 'asc_s_flame'],
  pthrow: ['投擲藥劑', 'asc_s_potion'],
  sdbash: ['盾擊', 'sk_shieldwall'],
  fatigue: ['疲勞', 'it_hourglass'],
  hit: ['其他攻擊', 'sk_spark']
};
const lgxN = id => (LGX[id.slice(1)] || [id.slice(1)])[0],
  lgxIc = id => {
    const x = LGX[id.slice(1)];
    return (x && artIconURL(icN(x[1], x[2] || x[1]))) || iconURL('star');
  };
function showLog(id, hi, sel, tab) {
  const H = hi != null ? S.hist[hi] : null,
    logs = H ? H.log || [] : S.run && S.run.log,
    m = $('modal');
  if (!logs) return;
  const lg = (id && logs.find(l => l.id === id)) || logs[logs.length - 1];
  tab = tab || (id ? 'me' : 'all');
  const row = l =>
      `<button class="lgr ${l.win ? 'w' : 'l'}${lg && l.id === lg.id ? ' on' : ''}" data-lg="${l.id}">${sprCv(l.spr || 'a_' + S.av)}<span><b>${l.id}・${esc(l.opp)}</b><small>${RTYPE[l.type]}${l.t ? `・${l.t} 秒` : ''}</small></span><em>${l.win ? '勝' : `敗 -${l.loss}`}</em></button>`,
    /* 每件道具的傷害長條：占這邊總傷害的幾 %；點了在背包亮出那件 */
    bars = (k, top, tot, pb) => {
      const l = top || [],
        all = tot || l.reduce((a, x) => a + x[2], 0) || 1,
        mx = Math.max(1, ...l.map(x => x[2])),
        bag = pb && unpackBag(pb);
      return `${
        l.length
          ? `<div class="lgbars">${l
              .map(([iid, t, v]) => {
                const x = iid[0] === '#',
                  o = !x && bag && bag.items.find(q => q.id === iid && q.t === t);
                return `<button class="lgb${x ? ' lgx' : ''}" ${o ? `data-lgu="${k}:${o.u}"` : 'disabled'}><img src="${x ? lgxIc(iid) : itemIcon(iid)}" alt=""><span><b>${x ? lgxN(iid) : (ITEMI[iid] ? ITEMI[iid].n : iid) + tierTxt(t)}</b><i><i style="width:${Math.round((v / mx) * 100)}%"></i></i></span><em>${Math.round((v / all) * 100)}%<small>${v}</small></em></button>`;
              })
              .join('')}</div>`
          : '<p class="c-dim">沒有紀錄</p>'
      }${bag ? lgBagHTML(bag, k, sel) : ''}`;
    },
    tabs = `<div class="lbt lgtab">${[
      ['me', '我的'],
      ['op', '對手'],
      ['all', '全部場次']
    ]
      .map(([k, n]) => `<button class="btn sm" data-lt="${k}" aria-pressed="${tab === k}">${n}</button>`)
      .join('')}</div>`;
  let body = '';
  if (!lg) body = '<p class="c-dim">還沒有打過</p>';
  else if (tab === 'all') body = `<div class="lgl">${[...logs].reverse().map(row).join('')}</div>`;
  else {
    const me = tab === 'me';
    body = `${row(lg)}<div class="kv3"><span>${me ? '造成' : '對手造成'}<b>${(me ? lg.dealt : lg.taken) ?? '—'}</b></span><span>${me ? '受到' : '對手受到'}<b>${(me ? lg.taken : lg.dealt) ?? '—'}</b></span><span>秒數<b>${lg.t ?? '—'}</b></span></div>${
      me
        ? bars('m', lg.top, lg.dealt, lg.mb)
        : lg.ob || lg.otop
          ? bars('o', lg.otop, lg.taken, lg.ob)
          : '<p class="c-dim">這場沒有對手的紀錄</p>'
    }`;
  }
  const box = m.firstElementChild,
    same = !m.hidden && box && box.classList.contains('lgw');
  m.innerHTML = `<div class="dlg2 lgw">${dlgX('data-lgc="1"')}<b>${H ? '那一局的戰報' : '戰報'}</b>${tabs}<div class="lgd">${body}</div>${H ? '<div class="btns col"><button class="btn" data-lgx="1">回到這一局</button></div>' : ''}</div>`;
  m.hidden = false;
  /* 切分頁時對話框不重播進場動畫，內容淡入 */
  if (same)
    m.querySelector('.lgd').animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: calm() ? 0 : 150,
      easing: 'ease-out'
    });
  paintSprites(m);
  if (sel) {
    const [k, u] = sel.split(':'),
      el = m.querySelector(`#lgbag${k} .it[data-u="${u}"]`);
    if (el) el.classList.add('sel');
  }
  m.onclick = ev => {
    const lt = ev.target.closest('[data-lt]');
    if (lt) return snd('tap'), showLog(lg && lg.id, hi, null, lt.dataset.lt);
    const r = ev.target.closest('[data-lg]');
    if (r) return snd('tap'), showLog(r.dataset.lg, hi, null, tab === 'all' ? 'me' : tab);
    const b = ev.target.closest('[data-lgu]');
    if (b) return snd('tap'), showLog(lg.id, hi, b.dataset.lgu === sel ? null : b.dataset.lgu, tab);
    const it = ev.target.closest('.lgbag .it[data-u]');
    if (it) {
      snd('tap');
      const u = it.closest('.lgbag').dataset.k + ':' + it.dataset.u;
      return showLog(lg.id, hi, u === sel ? null : u, tab);
    }
    if (ev.target.closest('[data-lgx]')) return showMatch(hi);
    if (ev.target.closest('[data-lgc]') || ev.target === m) m.hidden = true;
  };
}
/* 戰鬥紀錄的背包（k：m 你、o 對手）：格子，點道具看詳細（跟看對手背包同一套）；0.1.60 拿掉下面那排道具按鈕（點格子就看得到） */
function lgBagHTML(bag, k, sel) {
  const [sk, su] = (sel || '').split(':'),
    so = sk === k && bag.items.find(o => o.u === su);
  return `<div class="bagwrap lgbag" data-k="${k}">${bagHTML(bag, DESK() ? 30 : 24, { mini: 1, id: 'lgbag' + k })}</div><small class="c-dim">點道具看詳細</small>${so ? rvDetHTML(so) : ''}`;
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
</div>`;
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
  m.innerHTML = `<div class="dlg2 newsd">${dlgX('data-nwc="1"')}<b>更新紀錄</b><div class="nwl">${NEWS.map(
    (n, i) =>
      `<details${i < 1 ? ' open' : ''}><summary>v${n.v}${n.v === VER ? '<small>目前版本</small>' : ''}</summary><ul>${n.d.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>`
  ).join('')}</div></div>`;
  m.hidden = false;
  m.onclick = ev => {
    if (ev.target.closest('[data-nwc]') || ev.target === m) m.hidden = true;
  };
}
/* 0.1.88 對話框右上角的 ✕（點旁邊空白也能關）；按鈕第三個值是 class（例：'danger' 紅字，用在不能復原的動作） */
/* 0.1.93 道具說明一個效果一行（itemDesc 用「；」分段）：詳細、對手背包的詳細用 */
const descLines = t =>
  t
    .split('；')
    .map(x => `<span>${dsc(x)}</span>`)
    .join('');
const dlgX = a => `<button class="iconbtn dlgx" ${a} aria-label="關閉">✕</button>`;
function showDlg(title, body, buttons) {
  const m = $('modal');
  m.innerHTML = `<div class="dlg2">${dlgX('data-mi="x"')}<b>${title}</b>${body}${buttons.length ? `<div class="btns col">${buttons.map(([t, , c], i) => `<button class="btn${c ? ' ' + c : ''}" data-mi="${i}">${t}</button>`).join('')}</div>` : ''}</div>`;
  m.hidden = false;
  m.onclick = ev => {
    const b = ev.target.closest('[data-mi]');
    if (!b && ev.target !== m) return;
    m.hidden = true;
    if (b && b.dataset.mi !== 'x') buttons[+b.dataset.mi][1]();
  };
}
/* 0.1.77 下拉選單（data-chg）：統計頁的篩選 */
document.addEventListener('change', ev => {
  const el = ev.target.closest('select[data-chg]');
  if (!el) return;
  if (el.dataset.chg === 'mst') {
    V.mst[el.dataset.k] = el.value;
    render();
  }
});
document.addEventListener('click', ev => {
  if (V.noClick) return;
  const el = ev.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const f = A[el.dataset.act];
  if (!f) return;
  const fx = FXA[el.dataset.act] && S.run && FXA[el.dataset.act](el.dataset, el),
    snap = fx && fxSnap(),
    src = fx && fx[0] && { src: fx[0].src, r: fx[0].getBoundingClientRect(), id: fx[1] };
  f(el.dataset);
  if (fx) itemFx(snap, src);
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
/* ================= 0.1.87 動效（skill apple-design）=================
   彈簧（臨界阻尼 response 0.35；有甩動的才用 damping 0.8 帶一點回彈）、從畫面上現在的位置開始動、進出走同一條路；
   系統設定「減少動態」時只淡入淡出 */
const SPRING =
  'linear(0,0.055,0.173,0.309,0.441,0.558,0.656,0.736,0.8,0.849,0.887,0.916,0.938,0.955,0.967,0.976,0.982,0.987,0.991,0.993,0.995,0.997,0.998,0.998,1)';
const SPRING_B =
  'linear(0,0.079,0.248,0.436,0.608,0.747,0.851,0.922,0.968,0.995,1.009,1.014,1.015,1.013,1.01,1.008,1.005,1.003,1.002,1.001,1,1,1,1,1)';
const EASE_OK = typeof CSS !== 'undefined' && CSS.supports('animation-timing-function', 'linear(0, 1)');
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function spr(el, kf, bounce = 0, delay = 0) {
  if (!el || !el.animate) return null;
  if (calm()) kf = kf.map(k => ({ opacity: k.opacity ?? 1 }));
  return el.animate(kf, {
    delay,
    fill: delay ? 'backwards' : 'auto',
    duration: calm() ? 150 : bounce ? 600 : 500,
    easing: calm() ? 'ease-out' : EASE_OK ? (bounce ? SPRING_B : SPRING) : 'cubic-bezier(.2,.9,.3,1)'
  });
}
/* 拖曳放開後：道具從影子現在的位置彈進它的新位置；放不下就飛回原位；賣掉、融合掉就縮進商店／那件道具 */
const posOf = run => {
  const m = new Map();
  for (const o of run.bag.items) m.set(o.u, 'b' + [o.x, o.y, o.r]);
  run.bench.forEach((o, i) => o && m.set(o.u, 'q' + i));
  return m;
};
const elOf = u => document.querySelector(`#bag .it[data-u="${u}"], #bench .bs[data-bu="${u}"]`);
function land(d, g, before) {
  const gx = parseFloat(g.style.left) * V.z,
    gy = parseFloat(g.style.top) * V.z,
    now = posOf(S.run);
  let u = d.o.u;
  if (d.from === 'shop') u = [...now.keys()].find(k => !before.has(k)) || u;
  const el = now.has(u) && elOf(u),
    gone = () => g.remove();
  if (el && now.get(u) !== before.get(u)) {
    /* 放到新位置：從影子那裡彈過去（甩動放開的，帶一點回彈） */
    g.remove();
    const r = el.getBoundingClientRect();
    el.style.zIndex = 20;
    const a = spr(
      el,
      [{ transform: `translate(${(gx - r.left) / V.z}px,${(gy - r.top) / V.z}px) scale(1.06)` }, { transform: 'none' }],
      1
    );
    if (a) a.onfinish = () => (el.style.zIndex = '');
    return;
  }
  const card = d.from === 'shop' && !before.has(u) && document.querySelector(`.shop .sc[data-sk="${d.sk}"]`),
    to = el || card || (d.fuse && elOf(d.fuse.u)) || (d.sold && goldEl());
  if (!to) return gone();
  /* 回原位（放不下、沒買）或被吃掉（賣掉、融合）：影子飛過去 */
  const r = to.getBoundingClientRect(),
    back = to === el || to === card;
  if (el) el.classList.add('lift');
  g.classList.remove('good', 'bad', 'swap');
  const a = spr(g, [
    { transform: 'scale(1.06)', opacity: 0.9 },
    {
      transform: `translate(${(r.left - gx) / V.z}px,${(r.top - gy) / V.z}px) scale(${back ? 1 : 0.4})`,
      opacity: back ? 0.9 : 0
    }
  ]);
  if (!a) return gone(), el && el.classList.remove('lift');
  a.onfinish = () => {
    gone();
    if (el) el.classList.remove('lift');
  };
}
/* 0.1.90 道具動畫：按鈕操作前記下每件道具在畫面上的位置（fxSnap），畫完再比對（itemFx）：
   新的從來源飛過來、升階的材料飛到一起再彈一下、賣掉的縮進金幣、換位置的從原位滑過去 */
function fxSnap() {
  const run = S.run,
    m = new Map();
  if (!run) return m;
  for (const o of [...run.bag.items, ...run.bench])
    if (o) {
      const el = elOf(o.u),
        img = el && el.querySelector('img');
      if (img) m.set(o.u, { r: img.getBoundingClientRect(), src: img.src, id: o.id, t: o.t, at: posOf(run).get(o.u) });
    }
  return m;
}
function flyImg(src, a, b, fade) {
  const g = document.createElement('img');
  g.src = src;
  g.className = 'fly';
  Object.assign(g.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
  document.body.appendChild(g);
  const an = spr(g, [
    { transform: 'none', opacity: 1 },
    {
      transform: `translate(${b.left - a.left}px,${b.top - a.top}px) scale(${b.width / a.width})`,
      opacity: fade ? 0 : 1
    }
  ]);
  if (!an) return g.remove(), null;
  an.onfinish = () => g.remove();
  return an;
}
const pop = el => el && spr(el, [{ transform: 'scale(1.2)' }, { transform: 'none' }], 1);
const goldEl = () => document.querySelector('.top .gold');
/* from：新道具的來源（商店卡、三選一的卡）；skip：拖曳放開的那件（land 已經處理） */
function itemFx(before, from, skip) {
  const run = S.run;
  if (!run || calm()) return;
  const pos = posOf(run),
    now = new Map([...run.bag.items, ...run.bench].filter(Boolean).map(o => [o.u, o]));
  for (const [u, o] of now) {
    const el = elOf(u),
      img = el && el.querySelector('img');
    if (!img || u === skip || (V.mdFx && V.mdFx.u === u)) continue;
    const r = img.getBoundingClientRect(),
      b = before.get(u);
    if (!b) {
      if (!from) continue;
      img.style.opacity = 0;
      const a = flyImg(from.src, from.r, r),
        show = () => ((img.style.opacity = ''), pop(el));
      a ? a.finished.then(show, show) : show();
    } else if (b.t < o.t) {
      /* 合成：用掉的材料（還有剛買的那件）飛過來，到了這件和階數角標彈一下 */
      for (const [v, q] of before) if (!now.has(v) && q.id === o.id) flyImg(q.src, q.r, r, 1);
      if (from && from.id === o.id) flyImg(from.src, from.r, r, 1);
      setTimeout(() => (pop(el), pop(el.querySelector('.tier'))), 300);
    } else if (b.at !== pos.get(u))
      spr(img, [{ transform: `translate(${b.r.left - r.left}px,${b.r.top - r.top}px)` }, { transform: 'none' }]);
  }
  /* 不見了、也不是被合成掉的：賣掉了，縮進金幣 */
  const g = goldEl();
  for (const [v, q] of before)
    if (!now.has(v) && v !== skip && ![...now.values()].some(o => o.id === q.id && o.t > (before.get(o.u) || o).t) && g)
      flyImg(q.src, q.r, g.getBoundingClientRect(), 1);
}
/* 按鈕操作的來源：[新道具從哪張圖飛出來, 那件道具的 id]（要在操作之前量，畫完那張卡就不在了） */
const $q = s => document.querySelector(s);
const FXA = {
  buy: d => [$q(`.shop .sc[data-sk="${d.k}"] img`), S.run.shop[d.k] && S.run.shop[d.k].id],
  legBuy: d => [$q(`[data-act="legSel"][data-k="${d.k}"] img`), S.run.leg && S.run.leg[d.k] && S.run.leg[d.k].id],
  pick: (d, el) => [el.querySelector('img'), d.k],
  claim: () => [$q('.hold img'), S.run.hold && S.run.hold.id],
  sell: () => [],
  sellHold: () => [],
  autoPlace: () => [],
  toBench: () => []
};
/* 0.1.90 金幣、生命變動時數字滾到新的值（不直接跳） */
function tick(sel, v, k) {
  const el = document.querySelector(sel),
    old = (V.num = V.num || {})[k];
  V.num[k] = v;
  if (!el || old == null || old === v || calm()) return;
  const t = [...el.childNodes].find(n => n.nodeType === 3 && n.nodeValue.includes(String(v)));
  if (!t) return;
  const tpl = t.nodeValue,
    t0 = performance.now(),
    f = now => {
      const p = Math.min(1, (now - t0) / 450);
      t.nodeValue = tpl.replace(String(v), String(Math.round(old + (v - old) * (1 - Math.pow(1 - p, 3)))));
      if (p < 1 && t.isConnected) requestAnimationFrame(f);
    };
  requestAnimationFrame(f);
}
/* 道具說明卡（手機）：一律在底部、從下面滑上來；往下滑可以關（手指拖多少就跟多少，往上拉有阻力，放開看速度決定關或彈回）；
   點卡片外的空白處也會關；關的時候滑回下面。0.1.107 拿掉 0.1.104 的「點下半部的道具就放上方」（位置一下上一下下，不好預期），
   改成前 SWH_N 次打開時提示手勢：小橫槓旁寫「往下滑關閉」，卡片往下輕點一下再彈回（提示手勢的方向；減少動態時只有文字） */
const rubber = (x, dim, c = 0.55) => (x * dim * c) / (dim + c * Math.abs(x));
const sheetOn = () => !DESK() && document.querySelector('.prep>.det');
const SWH_N = 3;
function sheetIn() {
  const det = sheetOn();
  if (!det) V.swh = 0;
  if (det && !V.detOn) {
    spr(det, [{ transform: 'translate(-50%,110%)' }, { transform: 'translate(-50%,0)' }]);
    const n = (S.seen && S.seen.swh) || 0;
    V.swh = n < SWH_N;
    if (V.swh) {
      S.seen = S.seen || {};
      S.seen.swh = n + 1;
      if (!calm())
        det.animate(
          [
            { transform: 'translate(-50%,0)' },
            { transform: 'translate(-50%,14px)' },
            { transform: 'translate(-50%,0)' }
          ],
          { duration: 500, delay: 550, easing: 'cubic-bezier(.23,1,.32,1)' }
        );
    }
  }
  /* 提示文字留到這次說明卡關掉（重畫時卡片會重建） */
  if (det) det.classList.toggle('swh', !!V.swh);
  V.detOn = !!det;
}
function sheetOut(from = 0, bounce = 0) {
  const det = sheetOn(),
    done = () => {
      V.sel = null;
      render();
    };
  if (!det) return done();
  const a = spr(det, [{ transform: `translate(-50%,${from}px)` }, { transform: 'translate(-50%,110%)' }], bounce);
  if (!a) return done();
  det.style.pointerEvents = 'none';
  a.onfinish = done;
}
/* 點卡片外的空白處關掉；點到別的道具、按鈕照常（直接換成那件的說明） */
document.addEventListener('click', ev => {
  if (V.noClick || !V.sel || V.scr !== 'run' || !sheetOn()) return;
  if (ev.target.closest('.det, button, a, input, select, label, details, [data-act], [data-u], [data-bu]')) return;
  sheetOut();
});
document.addEventListener('pointerdown', ev => {
  const det = ev.target.closest('.prep>.det');
  if (!det || DESK() || ev.target.closest('button, a, select, details')) return;
  const sw = { det, y0: ev.clientY, h: [[ev.clientY, performance.now()]], dy: 0 };
  const mv = e => {
    sw.dy = e.clientY - sw.y0;
    sw.h.push([e.clientY, performance.now()]);
    if (sw.h.length > 5) sw.h.shift();
    const y = sw.dy > 0 ? sw.dy : rubber(sw.dy, det.offsetHeight);
    det.style.transform = `translate(-50%,${y}px)`;
  };
  const up = () => {
    removeEventListener('pointermove', mv);
    removeEventListener('pointerup', up);
    removeEventListener('pointercancel', up);
    if (Math.abs(sw.dy) < 6) return (det.style.transform = '');
    V.noClick = true;
    setTimeout(() => (V.noClick = false), 50);
    const [a, b] = [sw.h[0], sw.h[sw.h.length - 1]],
      v = b[1] > a[1] ? ((b[0] - a[0]) / (b[1] - a[1])) * 1000 : 0,
      /* Apple 的動量投影：放開的速度推算會停在哪裡，過一半就關 */
      end = sw.dy + ((v / 1000) * 0.998) / (1 - 0.998),
      y = sw.dy > 0 ? sw.dy : rubber(sw.dy, det.offsetHeight);
    det.style.transform = '';
    if (end > det.offsetHeight / 2) return sheetOut(y, 1);
    spr(det, [{ transform: `translate(-50%,${y}px)` }, { transform: 'translate(-50%,0)' }], 1);
  };
  addEventListener('pointermove', mv);
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);
});
/* 對話框（#modal）：開的時候遮罩淡入、框從 0.96 放大；關的時候走同一條路回去。很多地方直接設 m.hidden，攔 hidden 這個屬性就好；
   內容換掉（已經開著又設 hidden = false）不重播 */
(function () {
  const m = $('modal'),
    P = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'hidden');
  if (!m || !P) return;
  let out = null;
  Object.defineProperty(m, 'hidden', {
    get: () => P.get.call(m),
    set(v) {
      const was = P.get.call(m);
      if (out) (out.onfinish = null), out.cancel(), (out = null), (m.style.pointerEvents = '');
      if (!v) {
        P.set.call(m, false);
        if (was) dlgIn(m);
        return;
      }
      if (was) return;
      const box = m.firstElementChild;
      if (!box || !box.animate) return P.set.call(m, true);
      m.style.pointerEvents = 'none';
      m.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-in' });
      out = box.animate(
        [
          { transform: 'none', opacity: 1 },
          { transform: calm() ? 'none' : 'scale(.96)', opacity: 0 }
        ],
        {
          duration: 180,
          easing: 'ease-in'
        }
      );
      out.onfinish = () => {
        out = null;
        m.style.pointerEvents = '';
        P.set.call(m, true);
      };
    }
  });
})();
/* 0.1.95 對話框從按下的那個東西長出來（規則標籤）：縮放的原點設在它的中心，關的時候也縮回那裡 */
function dlgFrom(el) {
  const b = $('modal').firstElementChild;
  if (!el || !b) return;
  const r = el.getBoundingClientRect(),
    q = b.getBoundingClientRect(),
    z = V.z || 1;
  b.style.transformOrigin = `${(r.left + r.width / 2 - q.left) / z}px ${(r.top + r.height / 2 - q.top) / z}px`;
  spr(b, [
    { transform: 'scale(.6)', opacity: 0 },
    { transform: 'none', opacity: 1 }
  ]);
}
function dlgIn(o) {
  o.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
  const box = o.firstElementChild;
  if (box)
    spr(box, [
      { transform: 'scale(.96)', opacity: 0 },
      { transform: 'none', opacity: 1 }
    ]);
}
/* render 時：新出現的整頁遮罩（.ovl，結算、三選一、賽制…）淡入；消失的那個拿出來淡出再拿掉 */
const ovlSig = o => (o.firstElementChild ? o.firstElementChild.className : '');
function ovlFx(old) {
  const now = [...$('app').querySelectorAll('.ovl')],
    sig = new Set(now.map(ovlSig)),
    was = new Set(old.map(ovlSig));
  for (const o of now) if (!was.has(ovlSig(o))) dlgIn(o);
  for (const o of old) {
    if (sig.has(ovlSig(o)) || !o.animate) continue;
    o.style.zoom = 'var(--z,1)';
    document.body.appendChild(o);
    o.style.pointerEvents = 'none';
    const box = o.firstElementChild;
    if (box)
      box.animate([{ transform: 'none' }, { transform: calm() ? 'none' : 'scale(.96)' }], {
        duration: 180,
        easing: 'ease-in'
      });
    o.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-in' }).onfinish = () => o.remove();
  }
}
/* iOS Safari 要有 touchstart 監聽 :active 才會在按下時就變（按下回饋） */
document.addEventListener('touchstart', () => {}, { passive: true });
/* ================= 拖曳擺放 ================= */
/* 0.1.28 融合好的提示 */
function fuseToast(l) {
  /* 0.1.103 料理：一般料理小彈一下，大料理放大招（cookFx） */
  const fd = (l || []).filter(o => ITEMI[o.id].fk);
  if (fd.length) {
    const big = fd.some(o => ITEMI[o.id].fk === 'big');
    snd(big ? 'level' : 'select');
    toast(`${big ? '大料理' : '料理'}完成！${fd.map(o => ITEMI[o.id].n).join('、')}`);
    requestAnimationFrame(() => fd.forEach(o => cookFx(o.u, ITEMI[o.id].fk === 'big')));
    l = l.filter(o => !ITEMI[o.id].fk);
  }
  if (l && l.length) {
    snd('level');
    toast(`融合！${l.map(fuName).join('、')}`);
  }
}
/* 0.1.103 合成料理的回饋：彈一下；大料理再加一圈金光擴散和星星往外飛（很少發生，給足眼睛回饋）；減少動態時只彈（spr 自己變淡入） */
function cookFx(u, big) {
  const el = elOf(u);
  if (!el) return;
  pop(el.querySelector('img') || el);
  if (!big || calm()) return;
  const r = el.getBoundingClientRect(),
    z = V.z || 1,
    cx = (r.left + r.width / 2) / z,
    cy = (r.top + r.height / 2) / z,
    E = 'cubic-bezier(.23,1,.32,1)',
    add = (cls, css, txt) => {
      const e = document.createElement('div');
      e.className = cls;
      if (txt) e.textContent = txt;
      Object.assign(e.style, { zoom: 'var(--z,1)', ...css });
      document.body.appendChild(e);
      return e;
    },
    ring = add('fdr', {
      left: cx - r.width / z / 2 + 'px',
      top: cy - r.height / z / 2 + 'px',
      width: r.width / z + 'px',
      height: r.height / z + 'px'
    });
  ring.animate(
    [
      { transform: 'scale(.6)', opacity: 1 },
      { transform: 'scale(1.9)', opacity: 0 }
    ],
    { duration: 550, easing: E }
  ).onfinish = () => ring.remove();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2,
      d = 46 + (i % 3) * 14,
      p = add('fdp', { left: cx + 'px', top: cy + 'px' }, '★');
    p.animate(
      [
        { transform: 'translate(0,0) scale(.4)', opacity: 1 },
        { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(1)`, opacity: 0 }
      ],
      { duration: 600 + (i % 3) * 80, easing: E }
    ).onfinish = () => p.remove();
  }
}
/* 輔助 o 拖到哪一格：那格是能融合的道具就回傳它；0.1.100 巨人國的工具也一樣（鑿子看是哪一格） */
function fuseAt(run, o, c) {
  if (!c || !(ITEMI[o.id].tf || ITEMI[o.id].mod || ITEMI[o.id].fk)) return null;
  const g = bagGrid(run.bag),
    u = g[c[1]] && g[c[1]][c[0]],
    q = u != null && run.bag.items.find(x => x.u === u);
  return q && canFuse(o, q, c) ? q : null;
}
/* 0.1.100 巨人國的改造：套用、提示，畫完播動畫（縮小、放大從原本的大小縮放過去；鑿子那格碎掉、道具抖一下） */
const MD_N = { shrink: '縮小', grow: '放大', chisel: '鑿洞' };
function modDo(run, s, q, c) {
  const el = elOf(q.u),
    md = ITEMI[s.id].mod,
    cell = md === 'chisel' && c && cellEl(c);
  V.mdFx = { u: q.u, md, r: el && el.getBoundingClientRect(), hc: cell && cell.getBoundingClientRect() };
  fuseInto(run, s, q, c);
  snd('level');
  toast(`${MD_N[md]}！${fuName(q)}${run.bag.items.includes(q) ? '' : '（放不下，收進暫存區）'}`);
  requestAnimationFrame(modFx);
}
const cellEl = c => {
  const b = $('bag');
  return b && b.querySelectorAll('.cell')[c[1] * +b.dataset.gw + c[0]];
};
function modFx() {
  const f = V.mdFx,
    el = f && elOf(f.u);
  V.mdFx = null;
  if (!el || !f.r) return;
  const r = el.getBoundingClientRect();
  if (f.md !== 'chisel') {
    el.style.transformOrigin = '0 0';
    const a = spr(
      el,
      [
        {
          transform: `translate(${(f.r.left - r.left) / V.z}px,${(f.r.top - r.top) / V.z}px) scale(${f.r.width / r.width},${f.r.height / r.height})`
        },
        { transform: 'none' }
      ],
      f.md === 'grow' ? 1 : 0
    );
    if (a) a.onfinish = () => (el.style.transformOrigin = '');
    return;
  }
  spr(el, [{ transform: 'translateX(-3px)' }, { transform: 'none' }], 1);
  if (!f.hc) return;
  const sh = document.createElement('i');
  sh.className = 'shard';
  Object.assign(sh.style, {
    left: f.hc.left + 'px',
    top: f.hc.top + 'px',
    width: f.hc.width + 'px',
    height: f.hc.height + 'px'
  });
  document.body.appendChild(sh);
  const a = spr(sh, [
    { transform: 'none', opacity: 1 },
    { transform: 'translateY(14px) rotate(20deg) scale(.4)', opacity: 0 }
  ]);
  if (a) a.onfinish = () => sh.remove();
  else sh.remove();
}
/* 拖到道具上：工具改造、輔助融合 */
const fuseDo = (run, s, q, c) => {
  if (ITEMI[s.id].mod) return modDo(run, s, q, c);
  const r = fuseInto(run, s, q);
  /* 0.1.108 大料理放不下：不合成（之前會被賣掉） */
  if (!r) return snd('nope'), toast('背包和暫存區都放不下大料理');
  fuseToast([r]);
};
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
    o = { u: 'shop' + sk, id: run.shop[sk].id, t: run.shop[sk].t || 1, sh: run.shop[sk].sh, r: 0, x: 0, y: 0 };
    grab = shapeO(o, 0)[0];
  } else if (c.dataset.bu) {
    from = 'bench';
    o = run.bench[+c.dataset.bi];
    grab = shapeO(o)[0];
  } else {
    from = 'bag';
    o = run.bag.items.find(q => q.u === c.dataset.u);
    /* 0.1.96 整理區的道具 */
    if (!o) (o = (run.bag.st || []).find(q => q.u === c.dataset.u)), (from = 'stage');
    if (!o) return;
    grab = [+c.dataset.cx - o.x, +c.dataset.cy - o.y];
  }
  /* 0.1.87 按下就有回饋（整件縮一點）；抓在格子的哪裡，拖的時候手指就一直在那裡（不跳到格子中間） */
  const it = c.closest('.it');
  if (it) it.classList.add('press');
  const cr = c.getBoundingClientRect(),
    ox = from === 'bag' ? (ev.clientX - cr.left) / V.z : null,
    oy = from === 'bag' ? (ev.clientY - cr.top) / V.z : null;
  /* 0.1.29 gi：抓的是形狀的第幾格（拖曳中旋轉後，手指還是抓著同一格） */
  const gi = Math.max(
    0,
    shapeO(o).findIndex(p => p[0] === grab[0] && p[1] === grab[1])
  );
  V.drag = { o, from, grab, gi, rot: 0, sk, sx: ev.clientX, sy: ev.clientY, on: false, el: null, ox, oy };
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
      d.el.className = 'ghost s' + ITEMI[d.o.id].star + fdc(d.o.id);
      document.body.appendChild(d.el);
      /* 拿起來：稍微放大、影子變深（.ghost 的 lift 動畫） */
      document.querySelectorAll('.it.press').forEach(e => e.classList.remove('press'));
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
  d.g = shapeO(d.o, rr)[d.gi] || d.grab;
  d.tgt = c ? [c[0] - d.g[0], c[1] - d.g[1]] : null;
  d.ok = !!d.tgt && canPlace(S.run.bag, d.o, d.tgt[0], d.tgt[1], rr);
  /* 0.1.5 放不下時自動換個方向（手指底下那格還是道具的一部分），不動背包裡原本的道具；0.1.96 背包裡拖曳也一樣（之前只有暫存區、商店） */
  if (!d.ok && c) {
    const f = autoFit(S.run.bag, ro, c);
    if (f) {
      d.r = f.r;
      d.g = [c[0] - f.x, c[1] - f.y];
      d.tgt = [f.x, f.y];
      d.ok = true;
    }
  }
  /* 放不下但剛好擋到一件、而且換得過去：可以交換；0.1.28 輔助拖到能融合的道具上：融合 */
  d.fuse = fuseAt(S.run, d.o, c);
  d.fc = c;
  d.swap = !d.ok && !d.fuse && d.tgt && d.from !== 'stage' ? swapPlan(S.run, ro, d.tgt[0], d.tgt[1], d.from) : null;
  /* 0.1.96 交換也自動轉向：這個方向換不了，就試其他方向（手指底下那格還是道具的一部分） */
  if (!d.ok && !d.fuse && !d.swap && c && shapeO(d.o).length > 1 && d.from !== 'stage')
    for (let i = 1; i < 4 && !d.swap; i++) {
      const r = (rr + i) & 3;
      for (const [gx, gy] of shapeO(d.o, r)) {
        const p = swapPlan(S.run, { ...d.o, r }, c[0] - gx, c[1] - gy, d.from);
        if (p) {
          Object.assign(d, { swap: p, r, g: [gx, gy], tgt: [c[0] - gx, c[1] - gy] });
          break;
        }
      }
    }
  drawGhost(d);
  const st = d.cs + GAP,
    ox = d.ox ?? d.cs / 2,
    oy = d.oy ?? d.cs / 2;
  /* 影子也有縮放（.ghost 的 zoom），位置要換回縮放前的單位；放大的中心是手指抓的那一點 */
  d.el.style.left = d.px / V.z - d.g[0] * st - ox + 'px';
  d.el.style.top = d.py / V.z - d.g[1] * st - oy + 'px';
  d.el.style.transformOrigin = `${d.g[0] * st + ox}px ${d.g[1] * st + oy}px`;
  /* 0.1.96 背包放不下也換不了：能放進整理區（背包外）就放那裡（紅框） */
  d.stg = !d.ok && !d.fuse && !d.swap && !!d.tgt && canStage(S.run.bag, { ...d.o, r: d.r }, d.tgt[0], d.tgt[1], d.r);
  d.el.classList.toggle('out', d.stg);
  d.el.classList.toggle('bad', !!d.tgt && !d.ok && !d.swap && !d.fuse && !d.stg);
  d.el.classList.toggle('good', !!d.ok || !!d.fuse);
  d.el.classList.toggle('swap', !!d.swap);
  dragLit(d);
  const sh = $('shop');
  if (sh) sh.classList.toggle('sellhot', d.from !== 'shop' && inside(sh, d.px, d.py));
}
/* 旋轉背包裡的一件（旋轉鈕、右鍵）：照順時針試下一個放得下的方向 */
function rotIt(o) {
  const run = S.run;
  if (shapeO(o).length < 2) return;
  const fit = (run.bag.st || []).includes(o) ? canStage : canPlace;
  for (let i = 1; i <= 3; i++) {
    const r = (o.r + i) & 3;
    if (fit(run.bag, o, o.x, o.y, r)) {
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
  if (!d || !d.on || shapeO(d.o).length < 2) return false;
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
    shapeO(d.o, d.r)
      .map(([x, y]) => `<i style="left:${x * (cs + GAP)}px;top:${y * (cs + GAP)}px;width:${cs}px;height:${cs}px"></i>`)
      .join('') +
    `<img src="${itemIcon(d.o.id)}" style="width:${cs * 0.8}px;left:${d.g[0] * (cs + GAP) + cs * 0.1}px;top:${d.g[1] * (cs + GAP) + cs * 0.1}px" alt="">`;
}
/* 找一個放得下的方向：先試原本的方向、再轉 90°／180°／270°；手指底下 c 那格要是道具的一格 */
function autoFit(bag, o, c) {
  for (let i = 0; i < 4; i++) {
    const r = (o.r + i) & 3;
    for (const [gx, gy] of shapeO(o, r))
      if (canPlace(bag, o, c[0] - gx, c[1] - gy, r)) return { r, x: c[0] - gx, y: c[1] - gy };
  }
  return null;
}
/* 0.1.87 放開：先照原本的規則處理，畫完再讓道具從影子的位置彈過去（land） */
function dropEnd(ev) {
  const d = V.drag;
  if (!d) return;
  V.drag = null;
  document.querySelectorAll('.it.press').forEach(e => e.classList.remove('press'));
  const before = S.run ? posOf(S.run) : null,
    snap = d.on && fxSnap();
  dropDo(ev, d);
  if (d.el) before ? land(d, d.el, before) : d.el.remove();
  /* 拖進去之後合成了：材料飛到一起、升階彈一下（拖的那件 land 已經處理，賣掉的也是） */
  if (snap && !d.sold) itemFx(snap, null, d.o.u);
}
function dropDo(ev, d) {
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
  /* 0.1.96 整理區：拿出來（放進背包、暫存區、賣掉）或放進去 */
  const unSt = () => run.bag.st && (run.bag.st = run.bag.st.filter(q => q !== d.o));
  if (d.from === 'stage' && (d.ok || d.stg)) {
    unSt();
    Object.assign(d.o, { x: d.tgt[0], y: d.tgt[1], r: d.r });
    (d.ok ? run.bag.items : (run.bag.st = run.bag.st || [])).push(d.o);
    snd('select');
  } else if (d.from === 'stage' && inside($('bench'), ev.clientX, ev.clientY) && benchFree(run) >= 0) {
    unSt();
    run.bench[benchFree(run)] = d.o;
  } else if (d.stg) {
    if (d.from === 'bag') run.bag.items = run.bag.items.filter(q => q !== d.o);
    else run.bench[run.bench.indexOf(d.o)] = null;
    Object.assign(d.o, { x: d.tgt[0], y: d.tgt[1], r: d.r });
    (run.bag.st = run.bag.st || []).push(d.o);
    snd('select');
  } else if (d.fuse) fuseDo(run, d.o, d.fuse, d.fc);
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
    if (sellNo(run)) snd('nope'), toast(sellNo(run));
    else {
      const v = sellItem(run, d.o.u);
      d.sold = 1;
      snd('coin');
      toast(`賣了 ${v} 金`);
    }
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
    if (o && ITEMI[o.id].mod && canFuse(o, d.fuse, d.fc)) modDo(run, o, d.fuse, d.fc);
    else if (o && canFuse(o, d.fuse)) res.merged.fused = [fuseInto(run, o, d.fuse)].filter(Boolean);
  } else if (d.ok || (d.swap && d.swap.toBench)) res = buyToBag(run, d.sk, d.tgt[0], d.tgt[1], d.r, d.swap && d.swap.B);
  else if (
    inside($('bench'), ev.clientX, ev.clientY) ||
    d.stg ||
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
  const d = V.drag;
  V.drag = null;
  render();
  /* 被系統打斷（來電、捲動）：影子飛回原位 */
  if (d && d.el) land(d, d.el, posOf(S.run));
});
/* 手機叫出鍵盤也會觸發 resize：正在打字時不要重畫（不然輸入框會被換掉、鍵盤一直收起來） */
window.addEventListener('resize', () => {
  fitZoom();
  if (!B && !V.drag && !typing()) render();
});
/* 0.1.25 電腦版放大：寬 1040 以上（跟 CSS 的兩欄版面同一個寬度）整個介面等比例放大（CSS 變數 --z，給 #app、對話框、影子的 zoom 用），手機維持 1 */
/* 0.1.58 電腦版改成寬版面（三欄），放大的基準改成 1280×780（寬螢幕多出來的空間給版面，不是全部拿去放大）；--vh 是放大後的視窗高度 */
function fitZoom() {
  V.z = innerWidth >= 1040 ? Math.max(1, Math.min(1.5, innerWidth / 1280, innerHeight / 780)) : 1;
  document.documentElement.style.setProperty('--z', V.z);
  document.documentElement.style.setProperty('--vh', innerHeight / V.z + 'px');
}
fitZoom();
