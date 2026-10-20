/* 漫步勇者 · 今日委託、委託面板（0.3.15 起取代「附近」）、足跡（0.2.13） */
'use strict';
/* ================= 今日委託 ================= */
/* 每天 3 個小目標，完成就自動給獎勵；三個都完成再加碼 */
const QUESTS = [
  { k: 'kill', n: '打倒 20 隻怪物', need: 20 },
  { k: 'rare', n: '打倒 3 隻稀有以上的怪物', need: 3 },
  { k: 'dun', n: '攻略 1 座地城', need: 1 },
  { k: 'walk', n: '走 2 公里', need: 2000, km: 1 },
  { k: 'chest', n: '打開 4 個寶箱', need: 4 },
  { k: 'pray', n: '參拜 2 座廟宇', need: 2 },
  { k: 'vein', n: '採集 2 條靈脈', need: 2 },
  { k: 'blood', n: '累積 150 滴追蹤之血', need: 150 },
  { k: 'beast', n: '打倒 2 隻墮落獸', need: 2 },
  { k: 'ud', n: '在亡靈區打倒 10 隻亡靈', need: 10, lv: 3 },
  { k: 'mist', n: '打碎 1 團魔霧', need: 1, lv: 5 },
  { k: 'obel', n: '替冥府侵蝕柱充能 4 次', need: 4, lv: 5 }
];
const QUESTI = Object.fromEntries(QUESTS.map(q => [q.k, q]));
const DAILY_N = 3;
/* 以手機的當地日期換日 */
const today = () => fl((now() - new Date(now()).getTimezoneOffset() * 60e3) / 864e5);
function daily() {
  const d = today();
  if (!S.daily || S.daily.day !== d) {
    const pool = QUESTS.filter(q => S.lv >= (q.lv || 0)),
      list = [];
    let r = h(d, 557, 91);
    while (list.length < DAILY_N && pool.length) {
      list.push({ k: pool.splice(r % pool.length, 1)[0].k, c: 0 });
      r = h(r, d, 31);
    }
    S.daily = { day: d, q: list, bonus: 0 };
  }
  return S.daily;
}
/* 各處呼叫：quest('kill')、quest('walk', 公尺) */
function quest(k, n = 1) {
  if (!S) return;
  const dl = daily(),
    q = dl.q.find(q => q.k === k);
  if (!q || q.c >= QUESTI[k].need) return;
  q.c = Math.min(QUESTI[k].need, q.c + n);
  if (q.c < QUESTI[k].need) return;
  const got = questReward(1);
  toast(`委託完成：${QUESTI[k].n}`);
  addLog(`委託完成「${QUESTI[k].n}」：${got.join('、')}`);
  if (!dl.bonus && dl.q.every(q => q.c >= QUESTI[q.k].need)) {
    dl.bonus = 1;
    const b = questReward(2);
    setTimeout(() => toast('今日委託全部完成！'), 1600);
    addLog(`今日委託全部完成：${b.join('、')}`);
  }
}
function questReward(m) {
  const g = (50 + S.lv * 15) * m,
    c = rollCur(1 + m),
    got = [`${g} 金幣`, CURI[c].n, `惡魔結晶 ×${m}`];
  S.gold += g;
  giveCur(c);
  giveCur('dcrys', m);
  if (m > 1) {
    giveCur('chaos');
    giveCur('soul', 30);
    got.push('混沌石', '靈魂 ×30');
  }
  /* 0.3.11：每個委託都給祈願石 */
  giveCur('wish', m);
  got.push(`祈願石 ×${m}`);
  return got;
}
function dailyHTML() {
  const dl = daily(),
    done = dl.q.filter(q => q.c >= QUESTI[q.k].need).length,
    left = 864e5 - ((now() - new Date(now()).getTimezoneOffset() * 60e3) % 864e5);
  return `<div class="card"><div class="rowx"><div class="t"><b>今日委託 ${done}/${dl.q.length}</b><small>每項完成給金幣、通貨、惡魔結晶與祈願石；全部完成再加碼。${fl(left / 36e5)} 小時 ${fl((left % 36e5) / 60e3)} 分後換新。</small></div></div>${dl.q
    .map(q => {
      const Q = QUESTI[q.k],
        ok = q.c >= Q.need;
      return `<div class="qrow${ok ? ' ok' : ''}"><span>${ok ? '✔' : '・'} ${Q.n}</span><b>${Q.km ? `${(q.c / 1000).toFixed(1)}/${Q.need / 1000} km` : `${q.c}/${Q.need}`}</b><i style="width:${Math.round((q.c / Q.need) * 100)}%"></i></div>`;
    })
    .join('')}</div>`;
}

/* ================= 委託面板（0.3.15，原本的「附近」） ================= */
/* 地圖上的限時事件、狩獵、亡靈、魔霧都直接看得到，面板只留今日委託、所在區域的機制進度與刷新倒數 */
/* 所在區域的機制進度：[名稱, 數值文字, 進度 0～1 或 null, 顏色, 說明] */
function questProg() {
  const out = [],
    [px, py] = toM(S.lat, S.lng),
    uz = udZoneAt(px, py),
    hu = S.hunt || {},
    mz = mistAt(px, py),
    ob = [...ENT.values()]
      .filter(e => e.kind === 'obelisk')
      .sort((a, b) => Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py))[0],
    fl0 = footLv(px, py);
  if (hu.on || hu.blood)
    out.push([
      '追蹤之血',
      `${hu.blood || 0}/${BLOOD_MAX}`,
      (hu.blood || 0) / BLOOD_MAX,
      '#ff8a9a',
      `惡魔結晶 ${S.cur.dcrys || 0}`
    ]);
  if (uz) out.push(['亡靈區', `${udProg(uz.id)}%`, udProg(uz.id) / 100, '#8fe0a0', '滿了去亡靈祭壇挑戰軍團長']);
  if (mz)
    out.push([
      `魔霧 ${ROMAN[mz.tier]}`,
      `${mistProg(mz.id)}%`,
      mistProg(mz.id) / 100,
      '#d8b8ff',
      '打到 100% 碎裂得到魔霧碎片'
    ]);
  if (ob)
    out.push([
      '侵蝕柱',
      `${(S.obel && S.obel[ob.id]) || 0}/${OB_NEED}`,
      ((S.obel && S.obel[ob.id]) || 0) / OB_NEED,
      '#ff8a9a',
      '最近的一根，充滿可以召喚看門人'
    ]);
  if (fl0) out.push(['足跡', `Lv${fl0}`, null, '#ffd877', '常走的路，怪物比較多、比較容易出稀有']);
  out.push(['T 級', `T${tierNow()}`, null, '#ffd9a0', `地圖怪物 Lv${tierRange().join('～')}`]);
  return out;
}
function questHTML() {
  const pr = questProg(),
    zm = zoneAt(S.lat, S.lng).m;
  return `${dailyHTML()}
    <h3>所在區域</h3><div class="card qzone"><div class="rowx"><div class="t"><b>${esc(zm.n)}</b><small>${esc(zm.d)}</small></div></div>${pr
      .map(
        ([n, v, r, c, d]) =>
          `<div class="qp"><span style="color:${c}">${n}</span><b>${v}</b>${r == null ? '' : `<i><i style="width:${Math.round(Math.min(1, r) * 100)}%;background:${c}"></i></i>`}<small>${d}</small></div>`
      )
      .join('')}</div>
    <h3>刷新</h3><div class="card qref"><div><span>怪物、限時事件</span><b>${mmss(REFRESH - (now() % REFRESH))}</b></div><div><span>地城、寶箱、石碑、商店、廟宇</span><b>${mmss(REFRESH_H - (now() % REFRESH_H))}</b></div></div>
    <p class="sub">限時事件、狩獵、亡靈區、魔霧、侵蝕柱都直接畫在地圖上，點地圖上的東西就能看說明。</p>`;
}

/* ================= 足跡 ================= */
/* 常走的路會亮起來：同一格在不同時段（每 3 小時算一段）走過越多次，等級越高，怪物越多、越容易出稀有 */
const FOOT_CELL = 50,
  FOOT_SLOT = 3 * 3600e3,
  FOOT_MAX = 4000,
  FOOT_LV = [2, 4, 7, 12, 20];
let FOOTA = null;
const footKey = (x, y) => fl(x / FOOT_CELL) + ',' + fl(y / FOOT_CELL);
const footN2Lv = n => FOOT_LV.filter(v => n >= v).length;
const footLv = (x, y) => {
  const f = S.foot && S.foot[footKey(x, y)];
  return f ? footN2Lv(f[0]) : 0;
};
/* trailStep 每記一個點呼叫一次 */
function footStep(x, y) {
  S.foot = S.foot || {};
  const k = footKey(x, y),
    sl = fl(now() / FOOT_SLOT),
    f = S.foot[k];
  if (!f) S.foot[k] = [1, sl, Math.round(x), Math.round(y)];
  else if (f[1] !== sl) {
    const before = footN2Lv(f[0]);
    f[0] = Math.min(99, f[0] + 1);
    f[1] = sl;
    const lv = footN2Lv(f[0]);
    if (lv > before && lv >= 2 && !footStep.t) {
      footStep.t = 1;
      setTimeout(() => (footStep.t = 0), 60e3);
      toast(`這條路你常走，足跡升到 Lv${lv}：怪物更多、更容易出稀有`);
    }
  } else return;
  FOOTA = null;
  const keys = Object.keys(S.foot);
  if (keys.length > FOOT_MAX) {
    keys.sort((a, b) => S.foot[a][0] - S.foot[b][0] || S.foot[a][1] - S.foot[b][1]);
    keys.slice(0, keys.length - FOOT_MAX).forEach(k => delete S.foot[k]);
  }
}
/* 怪物生成用：足跡等級帶來的密度與稀有加成 */
const footDens = lv => lv * 5,
  footRare = lv => 1 + lv * 0.15;
/* 在地圖座標系（公尺）裡畫：等級越高越亮 */
function drawFoot(c, t) {
  if (!S.foot) return;
  if (!FOOTA) FOOTA = Object.values(S.foot).filter(f => footN2Lv(f[0]) >= 1);
  const hw = VW / 2 / cam.z + 60,
    hh = VH / cam.z;
  c.save();
  for (const f of FOOTA) {
    if (Math.abs(f[2] - cam.x) > hw || Math.abs(f[3] - cam.y) > hh) continue;
    const lv = footN2Lv(f[0]);
    c.fillStyle = `rgba(255,${200 - lv * 12},${110 - lv * 15},${0.1 + lv * 0.05 + 0.03 * Math.sin(t / 700 + f[2])})`;
    c.beginPath();
    c.arc(f[2], f[3], 18 + lv * 3, 0, 6.28);
    c.fill();
  }
  c.restore();
}
