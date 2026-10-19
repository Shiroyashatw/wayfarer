/* 漫步勇者 · 新手引導：依序把畫面上的按鈕框起來說明。選完起點自動開始，設定頁可以重看 */
'use strict';
/* ================= tutorial ================= */
/* t：要框起來的元素（CSS 選擇器，沒有就置中顯示） */
const TUT = [
  {
    h: '歡迎來到漫步勇者',
    p: '真實世界就是你的冒險地圖：道路跟著真實街道走，知名地點會變成城鎮。走過的地方才會揭開迷霧。接下來用一分鐘帶你認識畫面。'
  },
  {
    h: '移動',
    p: '點地圖上的道路，角色就會走過去。到「設定」打開 GPS，就能用手機定位實際走路。右下角的按鈕可以把畫面拉回你身上。',
    t: '#fabMe'
  },
  {
    h: '右上角資訊',
    p: '晝夜與視野（晚上看得比較近）、怪物刷新（每 15 分鐘）與地城刷新（每小時整點）的倒數、探索面積，以及你所在區域的特性（例如「豐收」掉寶比較多）。',
    t: '#expl'
  },
  {
    h: '打怪與互動',
    p: '點地圖上的怪物、寶箱、廟宇、地城就能看說明，走到 80 公尺內就能互動。發光的是菁英，名字紅色的是危險怪。戰鬥是回合制，用技能和藥水。'
  },
  {
    h: '生命不會自動回滿',
    p: '打贏戰鬥不會回血。戰鬥外每走 100 公尺回 5%、靜止每分鐘回 2%；回據點、住旅店、到廟宇參拜會回滿。設定頁可以開「自動喝水」。'
  },
  {
    h: '冒險',
    p: '「附近」列出周圍的東西；「據點」可以建立主據點、插冒險營旗；「石碑」用路上封印的卷軸組成單人石碑、4 人魔法陣與冥府傳送門。',
    t: '#nav [data-g="adv"]'
  },
  {
    h: '據點：在家也能玩',
    p: '在城鎮外免費建立主據點。據點半徑內的怪物、寶箱、石碑、靈脈不用走過去就能直接互動，升級會變大（最大 300 公尺）。出門到熱門地點還能插營旗，1 小時內遠端也能打。'
  },
  {
    h: '角色',
    p: '中間的頭像是角色選單：角色數值、技能石、天賦樹。紅點代表有天賦點還沒分配。',
    t: '#nav .meb'
  },
  {
    h: '技能石',
    p: '技能全部來自技能石，技能欄有 4 格。用靈魂粉塵升級（最高 Lv30），每 5 級開一個刻印槽，用刻印石點下去會抽出隨機詞綴。重複的技能石可以一鍵分解成粉塵。'
  },
  {
    h: '祈願',
    p: '打怪、開寶箱會得到靈魂碎片，在這裡抽技能石（每抽 10 個、十連 100 個）。5★ 有保底，60 抽內必出。',
    t: '.lfab'
  },
  {
    h: '天賦樹',
    p: '每升一級得 1 點，從你的起點往外點。外圈有武器專精（拿著對應武器才生效）和組隊專精（嘲諷減傷、群體治癒、隊友加成），路線盡頭的基石會改變戰鬥規則。'
  },
  {
    h: '背包與製作',
    p: '裝備有隨機詞綴，用蛻變石、富豪石、混沌石等通貨一步步改造。換上的武器和防具也會改變角色外觀。',
    t: '#nav [data-act="sheet"][data-s="bag"]'
  },
  {
    h: '社交',
    p: '加好友、組隊打地城（好友不在身邊也能用隊伍代碼加入），和好友建立絲綢之路就能打對方家門口的怪、每天收商隊的特產。',
    t: '#nav [data-g="soc"]'
  },
  {
    h: '設定',
    p: 'GPS 開關、自動喝水、名字與帳號。註冊帳號後換手機也能登入，這份教學也可以在這裡重看。',
    t: '#nav [data-act="sheet"][data-s="settings"]'
  },
  {
    h: '出發吧！',
    p: '先在附近打幾隻怪、存一點靈魂碎片去祈願，等級高一點再挑戰地城和石碑。祝冒險愉快！'
  }
];
let tutI = -1;
function tutorStart() {
  closeSheet();
  navClose();
  tutI = 0;
  $('tut').hidden = false;
  tutorShow();
}
function tutorEnd() {
  tutI = -1;
  $('tut').hidden = true;
  S.tut = 1;
  save();
}
function tutorShow() {
  const s = TUT[tutI],
    el = s.t && document.querySelector(s.t),
    hole = $('tutHole'),
    box = $('tutBox');
  $('tutBox').innerHTML =
    `<small class="sub">${tutI + 1} / ${TUT.length}</small><h3>${s.h}</h3><p>${s.p}</p><div class="btns"><button class="btn sm" data-act="tutSkip">${tutI === TUT.length - 1 ? '關閉' : '跳過教學'}</button>${tutI ? '<button class="btn sm" data-act="tutPrev">上一步</button>' : ''}<button class="btn sm pri" data-act="tutNext">${tutI === TUT.length - 1 ? '開始冒險' : '下一步'}</button></div>`;
  if (el) {
    const r = el.getBoundingClientRect(),
      pad = 6;
    Object.assign(hole.style, {
      left: r.left - pad + 'px',
      top: r.top - pad + 'px',
      width: r.width + pad * 2 + 'px',
      height: r.height + pad * 2 + 'px',
      borderRadius: '14px'
    });
    hole.hidden = false;
    /* 目標在上半部就把說明放下面，反之放上面 */
    const below = r.top + r.height / 2 < innerHeight / 2;
    box.style.top = below ? r.bottom + 16 + 'px' : '';
    box.style.bottom = below ? '' : innerHeight - r.top + 16 + 'px';
  } else {
    hole.hidden = true;
    box.style.top = '';
    box.style.bottom = '';
  }
  $('tut').classList.toggle('center', !el);
}
Object.assign(A, {
  tutNext: () => {
    if (tutI >= TUT.length - 1) return tutorEnd();
    tutI++;
    sfx('tap');
    tutorShow();
  },
  tutPrev: () => {
    if (tutI > 0) tutI--;
    tutorShow();
  },
  tutSkip: () => tutorEnd(),
  tutor: () => tutorStart()
});
window.addEventListener('resize', () => tutI >= 0 && tutorShow());
