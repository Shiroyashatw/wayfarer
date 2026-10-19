/* 漫步勇者 · 祈願（抽卡）：卡池、保底、單抽／十連、結果動畫。主畫面左上角的圖示可以直接打開 */
'use strict';
/* ================= banners ================= */
/* 機率：5★ 3%、4★ 17%、3★ 80%；第 45 抽起 5★ 機率每抽 +6%，第 60 抽必出；十連保證至少一個 4★ 以上 */
const GACHA_RATE = { 5: 3, 4: 17 },
  GACHA_SOFT = 45,
  GACHA_HARD = 60;
const BANNERS = [
  {
    id: 'gem',
    n: '技能石祈願',
    sub: '常駐',
    cost: 'soul',
    per: GEM_DRAW,
    on: true,
    feat: ['inferno', 'deadeye', 'summongod', 'battlecry'],
    bg: ['#2a1f4a', '#5a2f6a', '#c9a45c'],
    d: '用靈魂碎片祈願，抽到 Lv1 技能石。重複的技能石可以分解成粉塵，替喜歡的技能石升級。'
  },
  {
    id: 'pet',
    n: '寵物召喚',
    sub: '即將開放',
    on: false,
    bg: ['#1f3a2a', '#2f6a4a', '#7bd36b'],
    d: '寵物會陪你戰鬥、在地圖上幫你撿東西。之後的版本開放。'
  }
];
const gpool = r => Object.keys(SKILLS).filter(k => k !== 'attack' && (SKILLS[k].r || 3) === r);
const GA = { b: 'gem', res: null, shown: 0, skip: false };
function gachaRoll(bn, guar4) {
  S.pity = S.pity || {};
  const n = (S.pity[bn.id] || 0) + 1,
    p5 = n >= GACHA_HARD ? 100 : GACHA_RATE[5] + Math.max(0, n - GACHA_SOFT + 1) * 6,
    x = Math.random() * 100;
  let r = x < p5 ? 5 : x < p5 + GACHA_RATE[4] ? 4 : 3;
  if (guar4 && r < 4) r = 4;
  S.pity[bn.id] = r === 5 ? 0 : n;
  const pool = gpool(r),
    k = pool[fl(Math.random() * pool.length)],
    isNew = !S.gems.some(g => g.k === k);
  giveGem(k);
  return { k, r, isNew };
}
function gachaPull(times) {
  const bn = BANNERS.find(b => b.id === GA.b);
  if (!bn || !bn.on) return;
  const cost = bn.per * times;
  if ((S.cur[bn.cost] || 0) < cost) {
    toast(`${GCURI[bn.cost].n}不足（需要 ${cost}）`);
    sfx('nope');
    return;
  }
  S.cur[bn.cost] -= cost;
  const res = [];
  for (let i = 0; i < times; i++) res.push(gachaRoll(bn, times === 10 && i === 9 && !res.some(q => q.r >= 4)));
  addLog(`祈願 ×${times}：${res.map(q => `${SKILLS[q.k].name}${'★'.repeat(q.r - 2)}`).join('、')}`);
  save();
  GA.res = res;
  GA.shown = 0;
  GA.skip = false;
  renderGacha();
  const top = Math.max(...res.map(q => q.r));
  sfx(top === 5 ? 'level' : top === 4 ? 'bless' : 'coin');
  buzz(top === 5 ? 200 : 60);
  revealNext();
}
function revealNext() {
  if (!GA.res) return;
  if (GA.skip) GA.shown = GA.res.length;
  else GA.shown++;
  document.querySelectorAll('#gaRes .gcard').forEach((el, i) => el.classList.toggle('on', i < GA.shown));
  const done = GA.shown >= GA.res.length;
  $('gaResBtns').hidden = !done;
  if (!done) setTimeout(revealNext, GA.res.length > 1 ? 160 : 300);
  else if (GA.res.some(q => q.r === 5)) sfx('win');
}

/* ================= ui ================= */
const gemTile = (k, extra = '') => {
  const s = SKILLS[k],
    r = s.r || 3;
  return `<span class="gtile r${r}" ${extra}><img src="${iconURL(s.icon)}" alt=""><i class="gst">${'★'.repeat(r)}</i></span>`;
};
function openGacha() {
  closeSheet();
  navClose();
  GA.res = null;
  $('gacha').hidden = false;
  sfx('door');
  renderGacha();
}
function closeGacha() {
  $('gacha').hidden = true;
  GA.res = null;
  renderHud();
}
function renderGacha() {
  const bn = BANNERS.find(b => b.id === GA.b),
    have = bn.cost ? S.cur[bn.cost] || 0 : 0,
    pity = (S.pity && S.pity[bn.id]) || 0;
  let html = `<div class="gaTop"><b>祈願</b><span class="gaCur">${bn.cost ? `${curDot(bn.cost)}${GCURI[bn.cost].n} <b>${have}</b>` : ''}</span><button class="x" data-act="gaClose" aria-label="關閉">✕</button></div>
  <div class="gaTabs">${BANNERS.map(b => `<button class="gaTab${b.id === GA.b ? ' on' : ''}" data-act="gaTab" data-id="${b.id}" style="--c:${b.bg[2]}"><b>${b.n}</b><small>${b.sub}</small></button>`).join('')}</div>
  <div class="gaBanner" style="background:radial-gradient(120% 90% at 70% 30%,${bn.bg[1]},${bn.bg[0]} 70%);--c:${bn.bg[2]}">
    <div class="gaFeat">${(bn.feat || []).map(k => `<div>${gemTile(k)}<small>${SKILLS[k].name}</small></div>`).join('') || '<div class="gaSoon">敬請期待</div>'}</div>
    <div class="gaInfo"><h3>${bn.n}</h3><p>${bn.d}</p>${bn.on ? `<p class="sub">5★ ${GACHA_RATE[5]}%・4★ ${GACHA_RATE[4]}%・十連保證 4★ 以上・${GACHA_HARD} 抽內必出 5★（目前 ${pity}/${GACHA_HARD}）</p>` : ''}</div>
  </div>
  ${
    bn.on
      ? `<div class="gaBtns"><button class="btn gaPull" data-act="gaPull" data-n="1" ${have >= bn.per ? '' : 'disabled'}>祈願 ×1<small>${curDot(bn.cost)} ${bn.per}</small></button><button class="btn pri gaPull" data-act="gaPull" data-n="10" ${have >= bn.per * 10 ? '' : 'disabled'}>祈願 ×10<small>${curDot(bn.cost)} ${bn.per * 10}</small></button></div>
  <details class="gaRates"><summary>卡池內容與機率</summary>${[3]
    .map(
      r =>
        `<div><b style="color:${RSTAR[r]}">${'★'.repeat(r)}</b> ${gpool(r)
          .map(k => SKILLS[k].name)
          .join('、')}</div>`
    )
    .join('')}<p class="sub">靈魂碎片：打怪、開寶箱、採集靈脈、絲綢之路商隊。</p></details>`
      : '<div class="gaBtns"><button class="btn" disabled>即將開放</button></div>'
  }`;
  if (GA.res) {
    const top = Math.max(...GA.res.map(q => q.r));
    html += `<div class="gaRes r${top}" data-act="gaSkip"><div class="gaGrid${GA.res.length > 1 ? ' ten' : ''}" id="gaRes">${GA.res
      .map(
        (q, i) =>
          `<div class="gcard r${q.r}${i < GA.shown ? ' on' : ''}" style="--d:${i}"><div class="gback"></div><div class="gface">${q.isNew ? '<i class="gnew">NEW</i>' : ''}${gemTile(q.k)}<b>${SKILLS[q.k].name}</b><small>${SKKIND[SKILLS[q.k].kind]}</small></div></div>`
      )
      .join(
        ''
      )}</div><div class="btns" id="gaResBtns" ${GA.shown >= GA.res.length ? '' : 'hidden'}><button class="btn" data-act="gaAgain" data-n="${GA.res.length}">再抽 ${GA.res.length} 次</button><button class="btn pri" data-act="gaDone">確定</button></div></div>`;
  }
  $('gacha').innerHTML = html;
}
Object.assign(A, {
  gacha: () => {
    audioInit();
    openGacha();
  },
  gaClose: () => closeGacha(),
  gaTab: d => {
    GA.b = d.id;
    sfx('tap');
    renderGacha();
  },
  gaPull: d => gachaPull(+d.n),
  gaAgain: d => gachaPull(+d.n),
  gaSkip: () => {
    if (GA.res && GA.shown < GA.res.length) GA.skip = true;
  },
  gaDone: () => {
    GA.res = null;
    renderGacha();
  }
});
