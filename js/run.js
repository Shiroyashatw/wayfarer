/* 漫步勇者 · 0.1.0 肉鴿：主選單與一局的流程（三章節點地圖、節點、獎勵、結算） */
'use strict';
/* ================= 一局的規則 =================
   一局三章，每章是一張 10 層的節點地圖（第 0～8 層 2～4 個節點、第 9 層是首領），從下往上走，只能走連線連到的節點。
   節點：戰鬥、菁英、事件、商店、休息、寶箱、首領。打完首領進下一章；第三章首領打完就通關。死了這局結束。
   一局結束（死或通關）結算魂晶（局外貨幣）與祈願石，S.run 清掉回主選單。
   角色欄位（等級、裝備、技能石…）放在 S 最上層，開新局時用 newChar() 蓋掉（祈願石保留）。 */
const RUN_FLOORS = 10,
  RUN_REST = 0.25,
  RUN_COLS = 5;
/* 三章：主題、戰鬥背景、怪物等級起點（每層 +1，首領 +2） */
const CH = [
  { n: '山林', d: '森林、草原與高山的野怪，墮落獸出沒', bg: ['forest', 'meadow', 'mountain'], lv: 1 },
  { n: '城市・夜市', d: '城市裡的妖怪與七罪信徒', bg: ['city'], lv: 12 },
  { n: '冥府・魔霧', d: '亡靈、魔霧異獸與冥府守衛', bg: ['cave'], lv: 23 }
];
/* 節點種類：n 名稱、ic 圖示、d 說明 */
const NODE = {
  fight: { n: '戰鬥', ic: 'swords', d: '一群怪物' },
  elite: { n: '菁英', ic: 'skull', d: '強敵，獎勵比較好' },
  event: { n: '事件', ic: 'mask', d: '不知道會遇到什麼' },
  shop: { n: '商店', ic: 'bag', d: '買技能石、裝備、藥水，賣掉不要的' },
  rest: { n: '休息', ic: 'flame', d: '回血，或升級一顆技能石' },
  chest: { n: '寶箱', ic: 'gift', d: '裝備與通貨' },
  boss: { n: '首領', ic: 'crown', d: '這一章的首領' }
};
const R = () => S.run;
const nodeOf = id => R().map.nodes[id];
/* 怪物等級：章的起點＋每層 0.8；首領是首領前一層 +1。角色大約跟上（runGain） */
const runLv = (f = curFloor()) =>
  f >= RUN_FLOORS - 1 ? runLv(RUN_FLOORS - 2) + 1 : CH[R().ch].lv + fl(Math.max(0, f) * 0.8);
const curFloor = () => (R().at ? nodeOf(R().at).f : -1);
/* 每場戰鬥的經驗與金幣（照節點，不照怪物）：一般戰鬥約 1.1 級、菁英 2 級、首領 2.5 級；非戰鬥節點也給 0.5 級（nodeDone）。
   一章約 5 場戰鬥＋菁英＋首領＋3 個其他節點 ≈ 11 級，跟上怪物每章 +11 級；多打戰鬥還是比較快升級 */
function runGain() {
  const t = nodeOf(R().at) ? nodeOf(R().at).t : 'fight',
    k = t === 'boss' ? 2.5 : t === 'elite' ? 2 : 1.1,
    g = t === 'boss' ? 4 : t === 'elite' ? 2 : 1;
  return { xp: Math.round(xpNeed(S.lv) * k), gold: Math.round((15 + runLv() * 3) * g * rnd(0.85, 1.15)) };
}
/* 掉寶數量與稀有度加成（%）：每章 +15 */
const runLootQ = () => (S.run ? S.run.ch * 15 : 0);

/* ================= 地圖產生 ================= */
/* 像《殺戮尖塔》：從底下 3～4 個起點各走一條路往上（每層左右最多偏一格、不交叉），路線的聯集就是地圖 */
function genMap(seed, ch) {
  const r = rng(h(seed, ch, 401)),
    nodes = {},
    edges = {},
    id = (f, c) => `${f}_${c}`,
    add = (f, c) => (nodes[id(f, c)] = nodes[id(f, c)] || { id: id(f, c), f, c, t: '' }),
    link = (a, b) => {
      edges[a] = edges[a] || [];
      if (!edges[a].includes(b)) edges[a].push(b);
    },
    /* 同一層兩條線不能交叉：a→b 與 c→d 交叉 = (a<c 且 b>d) 或 (a>c 且 b<d) */
    cross = (f, a, b) =>
      Object.entries(edges).some(([k, ts]) => {
        const [ff, c] = k.split('_').map(Number);
        return (
          ff === f &&
          ts.some(t => {
            const d = +t.split('_')[1];
            return (a < c && b > d) || (a > c && b < d);
          })
        );
      });
  const starts = [];
  while (starts.length < 3) {
    const c = fl(r() * RUN_COLS);
    if (!starts.includes(c)) starts.push(c);
  }
  starts.push(starts[fl(r() * 3)]);
  for (const s of starts) {
    let c = s;
    add(0, c);
    for (let f = 0; f < RUN_FLOORS - 2; f++) {
      let n = Math.max(0, Math.min(RUN_COLS - 1, c + fl(r() * 3) - 1));
      if (cross(f, c, n)) n = c;
      add(f + 1, n);
      link(id(f, c), id(f + 1, n));
      c = n;
    }
  }
  const boss = { id: id(RUN_FLOORS - 1, 2), f: RUN_FLOORS - 1, c: 2, t: 'boss' };
  nodes[boss.id] = boss;
  for (const n of Object.values(nodes)) if (n.f === RUN_FLOORS - 2) link(n.id, boss.id);
  /* 種類：第 0 層都是戰鬥、第 4 層寶箱、第 8 層（首領前）休息；其他照權重，菁英從第 3 層、休息從第 5 層才有 */
  for (const n of Object.values(nodes)) {
    if (n.t) continue;
    if (n.f === 0) n.t = 'fight';
    else if (n.f === 4) n.t = 'chest';
    else if (n.f === RUN_FLOORS - 2) n.t = 'rest';
    else {
      const w = [
        ['fight', 50],
        ['event', 18],
        ['elite', n.f >= 3 ? 14 : 0],
        ['shop', 10],
        ['rest', n.f >= 5 ? 6 : 0]
      ];
      let x = r() * w.reduce((a, q) => a + q[1], 0);
      n.t = w.find(q => (x -= q[1]) < 0)[0];
    }
  }
  return { nodes, edges };
}
/* 現在能走的節點：還沒出發是第 0 層，否則是目前節點連到的下一層 */
function nextNodes() {
  const r = R();
  if (!r.at) return Object.values(r.map.nodes).filter(n => n.f === 0);
  if (!r.cleared.includes(r.at)) return [nodeOf(r.at)];
  return (r.map.edges[r.at] || []).map(nodeOf);
}

/* ================= 開始與結束 ================= */
function startRun(opts = {}) {
  const wish = S.cur.wish || 0;
  Object.assign(S, newChar());
  S.cur.wish = wish;
  S.run = {
    seed: opts.seed ?? fl(Math.random() * 1e9),
    daily: !!opts.daily,
    ch: 0,
    map: null,
    at: null,
    cleared: [],
    kills: 0,
    elites: 0,
    bosses: 0,
    floors: 0,
    lvSeen: 1,
    extraPicks: 0,
    bless: [],
    seenEv: [],
    t0: Date.now()
  };
  S.run.map = genMap(S.run.seed, 0);
  S.run.cls = opts.cls || 'warlord';
  applyKit(S.run.cls);
  applyMeta();
  fullHeal();
  S.meta.runs++;
  addLog('新的一局開始了');
  save();
  closeSheet();
  playSong('field');
  viewRender();
  if (S.meta.runs === 1 && !opts.daily) howTo();
}
/* 第一局的玩法說明 */
function howTo() {
  showModal(
    '怎麼玩',
    `<p>① 從地圖最下面往上走，點金框的節點前進。</p><p>② 打贏給經驗和獎勵三選一；升級時天賦三選一。</p><p>③ 打倒第三章首領就通關；倒下這一局就結束，結算魂晶解鎖新角色。</p>${more(
      '節點與規則',
      `<p>${Object.values(NODE)
        .map(q => `<b>${q.n}</b>：${q.d}`)
        .join(
          '<br>'
        )}</p><p>每場勝利回 25% 生命、魔力全滿。血量不會自己回，營火、藥水、事件可以補。</p><p>商店可以賣掉不要的裝備；背包裡的裝備可以用通貨製作。</p>`
    )}`,
    [{ label: '出發', pri: 1, fn: hideModal }]
  );
}
/* 一局結束：結算魂晶與祈願石，回主選單 */
function endRun(won) {
  const r = R(),
    prog = r.ch * RUN_FLOORS + Math.max(0, curFloor() + 1),
    soul = Math.round((prog * 3 + r.elites * 8 + r.bosses * 25 + (won ? 60 : 0)) * (r.daily ? 1.5 : 1)),
    wish = r.bosses * 2 + (won ? 4 : 0) + fl(prog / 6);
  S.meta.soul += soul;
  S.cur.wish = (S.cur.wish || 0) + wish;
  if (won) S.meta.wins++;
  S.meta.best = Math.max(S.meta.best || 0, prog);
  if (r.daily && S.meta.daily) S.meta.daily.prog = prog;
  const html = `<p>${won ? '三章都打通了！' : `倒在第 ${r.ch + 1} 章・${CH[r.ch].n}，第 ${Math.max(1, curFloor() + 1)} 層。`}</p>
    <div class="kv"><div><span>等級</span><b>Lv${S.lv}</b></div><div><span>擊倒</span><b>${r.kills}</b></div><div><span>菁英</span><b>${r.elites}</b></div><div><span>首領</span><b>${r.bosses}</b></div></div>
    <p>得到 <b style="color:#9fe7ff">◆ ${soul} 魂晶</b>、<b style="color:var(--gold)">${wish} 祈願石</b>${r.daily ? '（每日挑戰 ×1.5）' : ''}</p>`;
  addLog(won ? '通關了！' : `這一局結束：第 ${r.ch + 1} 章第 ${Math.max(1, curFloor() + 1)} 層`);
  S.run = null;
  save();
  showModal(won ? '通關！' : '這一局結束了', html, [
    {
      label: '回到主選單',
      pri: 1,
      fn: () => {
        hideModal();
        if (B) endBattle();
        else viewRender();
      }
    }
  ]);
}

/* ================= 節點 ================= */
function enterNode(id) {
  const n = nodeOf(id);
  if (!n || !nextNodes().includes(n) || B) return;
  R().at = id;
  save();
  sfx('select');
  const f = NODE_GO[n.t];
  f && f(n);
}
/* 這個節點完成：記下來、回到地圖 */
function nodeDone() {
  const r = R(),
    n = nodeOf(r.at);
  if (!r.cleared.includes(r.at)) {
    r.cleared.push(r.at);
    r.floors++;
    /* 旅途經驗：非戰鬥節點給 0.5 級（不然走事件、商店的路線等級跟不上） */
    if (!['fight', 'elite', 'boss'].includes(n.t) && gainXP(Math.round(xpNeed(S.lv) * 0.5))) sfx('level');
  }
  if (n.t === 'boss') return chapterClear();
  save();
  viewRender();
}
/* 每個節點的種子（同一局同一個節點每次都一樣，重新整理再打一次也是同一群怪） */
const nodeSeed = n => h(R().seed, R().ch * 100 + n.f * 10 + n.c, 7);
/* 一般怪：這一章的怪物池（照怪物的 min 等級） */
function chMob(rr, lv) {
  const ch = R().ch;
  if (ch === 2) {
    const pool = [...UNDEAD.map(u => ({ ...u, w: u.w || 20 })), ...MISTMON.map(m => ({ ...m, w: 15 })), ...HELLMON];
    let x = rr % pool.reduce((a, q) => a + q.w, 0);
    return pool.find(q => (x -= q.w) < 0) || pool[0];
  }
  const bgs = CH[ch].bg,
    pool = MONS.filter(q => bgs.includes(q.bg) && (!q.min || q.min <= lv + 1));
  let x = rr % pool.reduce((a, q) => a + q.w, 0);
  return pool.find(q => (x -= q.w) < 0) || pool[0];
}
const chBg = rr => {
  const b = CH[R().ch].bg;
  return b[rr % b.length];
};
/* 一般戰鬥：帶頭的一隻（25% 是魔法怪）＋小怪：第 0 層沒有、第 1～3 層 0～1 隻、第 4 層起 1～2 隻 */
function fightGroup(n) {
  const r = rng(nodeSeed(n)),
    lv = runLv(n.f),
    lead = chMob(fl(r() * 1e6), lv),
    rar = r() < 0.25 && n.f > 0 ? 1 : 0,
    e = makeEnemy(lead, lv, rar, rar ? rollMods(fl(r() * 1e9), 1) : []),
    k = n.f === 0 ? 0 : n.f < 4 ? fl(r() * 2) : 1 + fl(r() * 2);
  const es = [e];
  for (let i = 0; i < k; i++) {
    const m = makeEnemy(chMob(fl(r() * 1e6), lv), Math.max(1, lv - (r() < 0.5 ? 1 : 0)), 0, []);
    m.maxhp = m.hp = Math.round(m.maxhp * 0.6);
    m.atk = Math.round(m.atk * 0.7);
    m.xp = Math.round(m.xp * 0.6);
    m.gold = Math.round(m.gold * 0.6);
    m.minion = 1;
    es.push(m);
  }
  return { es, bg: R().ch === 2 ? 'cave' : chBg(fl(r() * 99)) };
}
/* 菁英：第一章墮落獸、第二章七罪信徒、第三章冥府守衛；稀有（2），詞綴數＝章數（1～3），第二章起多帶 1 隻小怪 */
function eliteGroup(n) {
  const r = rng(nodeSeed(n) + 5),
    lv = runLv(n.f),
    ch = R().ch,
    mods = rollMods(fl(r() * 1e9), ch + 1);
  let e,
    es,
    bg = 'cave';
  if (ch === 0) {
    const ms = [...MONS.filter(m => HUNT_SPR[m.name]).map(beastBase), ...BEAST_X],
      b = ms[fl(r() * ms.length)];
    e = makeEnemy(b, lv, 2, mods);
    bg = b.bg;
    es = [e];
  } else if (ch === 1) {
    const sk = SINS[fl(r() * SINS.length)].k,
      fs = SINF[sk];
    e = makeFollower(sk, fs[fl(r() * fs.length)], lv, 2, mods);
    es = [e, makeFollower(sk, fs[fl(r() * fs.length)], lv - 1, 0)];
    bg = 'city';
  } else {
    const w = WATCHERS[fl(r() * WATCHERS.length)],
      b = {
        name: w.n,
        bg: 'cave',
        spr: w.spr,
        pal: w.pal,
        hp: 80,
        atk: 14,
        arm: 30,
        el: w.el,
        res: [30, 30, 30],
        xp: 40,
        gold: 40
      };
    e = makeEnemy(b, lv, 2, [...w.mods.slice(0, 1), ...mods.slice(0, 2)]);
    e.name = `冥府看門人・${w.n}`;
    es = [e, ...fightGroup(n).es.slice(1, 2)];
  }
  /* 稀有怪的倍率是照走路版（可以避開）設計的；肉鴿的菁英是路線上的關卡，再調弱一點 */
  e.maxhp = e.hp = Math.round(e.maxhp * 0.75);
  e.atk = Math.round(e.atk * 0.85);
  return { es, bg };
}
/* 首領：第一章台灣鬼怪、第二章十二生肖或四凶、第三章七宗罪之王／亡靈王／燭龍／閻羅王 */
function bossGroup() {
  const r = rng(h(R().seed, R().ch, 811)),
    lv = runLv(RUN_FLOORS - 1),
    ch = R().ch;
  const ghost = (g, mult, hell) => {
    const e = makeEnemy(
      {
        name: g.n,
        bg: 'cave',
        hp: 70,
        atk: 12,
        arm: 30,
        el: g.el,
        res: [25, 25, 25],
        xp: 30,
        gold: 30,
        spr: g.spr,
        pal: BOSSPAL[g.spr]
      },
      lv,
      0,
      hell ? rollMods(fl(r() * 1e9), 2) : []
    );
    e.maxhp = e.hp = Math.round(e.maxhp * mult);
    e.xp *= 4;
    e.rar = 3;
    e.big = 1;
    return e;
  };
  let e;
  if (ch === 0) e = ghost(GHOSTS[fl(r() * GHOSTS.length)], 2.2);
  else if (ch === 1) {
    const k = r();
    e =
      k < 0.5
        ? makeZodiac(ZODIAC[fl(r() * ZODIAC.length)].k, lv)
        : k < 0.8
          ? makeXiong(XIONG[fl(r() * XIONG.length)], lv)
          : ghost(PIRATE_KING, 3, true);
  } else {
    const k = fl(r() * 4);
    if (k === 0) e = makeSinKing(lv);
    else if (k === 1) e = udBoss('亡靈王', 'a_lichking', BOSSPAL.b_lichking, lv, 5);
    else if (k === 2) e = makeZhulong(lv);
    else {
      e = ghost({ n: '閻羅王', spr: 'a_yanluo', el: 'fire' }, 3.4, true);
      e.yama = 1;
    }
  }
  /* 首領保留各自的機制與詞綴，但生命、攻擊統一換算成這一章的目標值（十二生肖、四凶、七宗罪之王、亡靈王原本是終局難度） */
  const B0 = { hp: 70, atk: 12 },
    hm = [2.2, 2.8, 3.4][ch],
    am = [1, 1.05, 1.1][ch];
  e.maxhp = e.hp = Math.round(B0.hp * (1 + 0.38 * (lv - 1)) * hm);
  e.atk = Math.round(B0.atk * 0.8 * (1 + 0.2 * (lv - 1)) * am);
  e.speed = Math.min(e.speed || 10, 14);
  e.minion = 0;
  return { es: [e], bg: 'cave' };
}
const NODE_GO = {
  fight: n => {
    const g = fightGroup(n);
    startBattle(g.es, { bg: g.bg });
  },
  elite: n => {
    const g = eliteGroup(n);
    startBattle(g.es, { bg: g.bg, elite: true });
  },
  boss: () => {
    const g = bossGroup();
    startBattle(g.es, { bg: g.bg, boss: true });
  },
  rest: () => restNode(),
  chest: n => chestNode(n),
  shop: n => shopNode(n),
  event: n => eventNode(n)
};

/* ================= 戰鬥勝利：獎勵三選一 ================= */
/* 三選一的候選：技能石（還沒有的）、輔助寶石、裝備、金幣；首領用 bossPicks */
function rewardPicks(lv, elite) {
  const pick = a => a[fl(Math.random() * a.length)],
    have = new Set(S.gems.map(g => g.k)),
    gems = GEMK().filter(k => !have.has(k) && gemReq(k) <= S.lv + 4 && SKILLS[k].kind !== 'aura'),
    sups = SUPG.filter(sp => !sp.lin && sp.t <= 1 + R().ch * 2),
    pool = [];
  if (gems.length) {
    const k = pick(gems);
    pool.push({
      n: SKILLS[k].name,
      d: '技能石',
      ic: skIcon(k, SKILLS[k].icon),
      give: () => (giveGem(k), [SKILLS[k].name])
    });
  }
  if (sups.length) {
    const sp = pick(sups);
    pool.push({
      n: sp.n,
      d: `輔助寶石・${sp.d}`,
      ic: artIconURL('sup_' + sp.k) || iconURL('gem'),
      give: () => (giveSup(sp.k), [sp.n])
    });
  }
  {
    const it = makeItem(DROPS[fl(Math.random() * DROPS.length)], lv, elite ? 2 : Math.random() < 0.4 ? 2 : 1);
    pool.push({ n: itemName(it), d: itemType(it), ic: slotIcon(it), give: () => (giveItem(it), [itemName(it)]) });
  }
  {
    const g = 20 + lv * 6;
    pool.push({ n: `${g} 金幣`, d: '在商店用', ic: iconURL('bag'), give: () => ((S.gold += g), [`${g} 金幣`]) });
  }
  while (pool.length > 3) pool.splice(fl(Math.random() * pool.length), 1);
  return pool;
}
/* 三選一的彈窗：選完才能繼續 */
function pickModal(title, head, picks, done, auto, regen) {
  let got = null;
  const rr = () => (S.run && S.run.rerolls) || 0;
  const render = () =>
    showModal(
      title,
      head +
        (got
          ? `<div class="loot">${got.map(t => `<span>${t}</span>`).join('')}</div>`
          : `<h3>選一個</h3><div class="bpick">${picks.map((p, i) => `<button class="bpk" data-act="mbtn" data-i="${i + 1 + (regen && rr() ? 1 : 0)}"><img src="${p.ic}" alt=""><b>${p.n}</b><small>${p.d}</small></button>`).join('')}</div>`),
      [
        {
          label: got ? '繼續' : '跳過',
          pri: !!got,
          fn: () => {
            hideModal();
            done(!!got);
          }
        },
        ...(regen && !got && rr()
          ? [
              {
                label: `重抽（剩 ${rr()} 次）`,
                fn: () => {
                  S.run.rerolls--;
                  picks = regen();
                  sfx('select');
                  render();
                }
              }
            ]
          : []),
        ...picks.map(p => ({
          label: '',
          hide: 1,
          fn: () => {
            if (got) return;
            got = p.give();
            sfx('coin');
            save();
            if (auto) {
              hideModal();
              return done(true);
            }
            render();
          }
        }))
      ]
    );
  render();
}
function runWin(w) {
  const r = R(),
    n = nodeOf(r.at),
    es = B.es;
  r.kills += es.length;
  if (n.t === 'elite') r.elites++;
  if (n.t === 'boss') r.bosses++;
  /* 打贏喘口氣：回復 25% 生命、魔力全滿（沒有走路回血，不然血只會一路往下掉；魔力像每場重置的能量） */
  {
    const st = stats();
    S.hp = Math.min(st.maxhp, S.hp + Math.round(st.maxhp * RUN_REST));
    S.mp = st.maxmp;
  }
  const head = `<p>獲得 <span style="color:var(--good)">${w.xp} 經驗</span>、<span style="color:var(--gold)">${w.gold} 金幣</span>${w.up ? `・<b class="c-gold">升級到 Lv${S.lv}！</b>` : ''}</p>${
    w.drops.length
      ? `<div class="loot">${lootList(w.drops)
          .map(d => `<span>${d}</span>`)
          .join('')}</div>`
      : ''
  }${w.bonus}`;
  const lv = es[0].lv,
    regen = () => (n.t === 'boss' ? bossPicks(lv) : rewardPicks(lv, n.t === 'elite'));
  pickModal(
    n.t === 'boss' ? '首領倒下了！' : '勝利！',
    head,
    regen(),
    () =>
      (n.t === 'boss' ? ascModal : f => f())(() =>
        passModal(() => {
          endBattle();
          nodeDone();
        })
      ),
    false,
    regen
  );
}
function runLose() {
  endRun(false);
}
/* 打完首領：下一章（回一半血），第三章打完通關 */
function chapterClear() {
  const r = R();
  if (r.ch >= CH.length - 1) return endRun(true);
  r.ch++;
  r.map = genMap(r.seed, r.ch);
  r.at = null;
  r.cleared = [];
  const st = stats();
  S.hp = Math.min(st.maxhp, S.hp + Math.round(st.maxhp * 0.5));
  S.mp = st.maxmp;
  save();
  showModal(`第 ${r.ch + 1} 章・${CH[r.ch].n}`, `<p>${CH[r.ch].d}。</p><p class="sub">回復一半生命、魔力全滿。</p>`, [
    {
      label: '出發',
      pri: 1,
      fn: () => {
        hideModal();
        viewRender();
      }
    }
  ]);
}

/* ================= 首領之後：昇華三選一 =================
   第一章首領：選這個角色的分支（3 條）；第二章首領：從分支的大點（含三選一的終極選項）抽 3 個。每打倒一個首領多一個契靈欄位 */
function ascModal(done) {
  const r = R(),
    a = ASCD(),
    c = ASCI_[a.cls];
  a.trials = r.bosses;
  if (!c) return done();
  const txt = n => [...ascTxt(n), ...ascCostTxt(n).map(s => `代價：${s}`)].join('、');
  let picks;
  if (!a.br)
    picks = c.br.map(b => ({
      n: b.n,
      d: b.d,
      ic: ascIcon(ASCN[b.k + '_e'], true),
      give: () => {
        a.br = b.k;
        addLog(`昇華分支：${b.n}`);
        return [b.n];
      }
    }));
  else {
    const pool = Object.values(ASCN).filter(
      n => n.br === a.br && (n.kind === 'b' || n.kind === 'o') && !a.nodes.includes(n.id)
    );
    picks = [];
    while (picks.length < 3 && pool.length) {
      const n = pool.splice(fl(Math.random() * pool.length), 1)[0];
      picks.push({
        n: n.n,
        d: txt(n),
        ic: ascIcon(n, true),
        give: () => {
          a.nodes.push(n.id);
          clampHP();
          addLog(`昇華：${n.n}`);
          return [n.n];
        }
      });
    }
  }
  if (!picks.length) return done();
  pickModal(
    a.br ? '昇華三選一' : `昇華：${c.n}的分支`,
    `<p class="sub">${a.br ? '昇華的大點會強化這個分支的技能。' : '選一條分支，之後的昇華都會從這條分支出。'}</p>`,
    picks,
    () => done(),
    true
  );
}

/* ================= 升級：天賦三選一 =================
   每升一級（S.lv 超過 lvSeen）＋事件給的（extraPicks）各一次；從天賦樹的重要節點抽（名字不重複、沒拿過），每 10 級改成基石 */
const pendPicks = () => (S.run ? Math.max(0, S.lv - (S.run.lvSeen || 1)) + (S.run.extraPicks || 0) : 0);
/* 組隊、地圖才有用的屬性（嘲諷、替隊友回血、隊友加成、視線、吸引怪物）：帶這些的節點不放進三選一 */
const PASS_NO = new Set(['vision', 'lure', 'taunt', 'healAll', 'allyDmg']);
function passPool(key) {
  const taken = new Set(S.tree.map(id => TREE.byId[id] && TREE.byId[id].n)),
    seen = new Set();
  return Object.values(TREE.byId).filter(
    n =>
      n.type === (key ? 'key' : 'notable') &&
      !taken.has(n.n) &&
      !Object.keys(n.st).some(k => PASS_NO.has(k)) &&
      !seen.has(n.n) &&
      seen.add(n.n)
  );
}
const passTxt = n =>
  Object.entries(n.st)
    .map(([k, v]) => (STATN[k] ? STATN[k](v) : k))
    .join('、');
/* 天賦節點的圖示：有 PNG（TREE_IC）就用，沒有用 8×8 */
const treeIcURL = n =>
  (typeof TREE_IC !== 'undefined' && TREE_IC[n.n] && artIconURL('tree_' + TREE_IC[n.n])) || pixURL('ic_' + n.ic);
function passModal(done) {
  if (!pendPicks()) return done();
  const r = R(),
    lv = (r.lvSeen || 1) + 1,
    key = S.lv > (r.lvSeen || 1) && lv % 10 === 0 && passPool(true).length >= 3,
    pool = passPool(key),
    picks = [];
  while (picks.length < 3 && pool.length) picks.push(pool.splice(fl(Math.random() * pool.length), 1)[0]);
  const use = () => {
    if (S.lv > (r.lvSeen || 1)) r.lvSeen = (r.lvSeen || 1) + 1;
    else r.extraPicks = Math.max(0, (r.extraPicks || 0) - 1);
  };
  pickModal(
    key ? '基石三選一' : '天賦三選一',
    `<p class="sub">${key ? '基石會大幅改變玩法，有好處也有代價。' : '選一個天賦，這一局都有效。'}${pendPicks() > 1 ? `（還有 ${pendPicks()} 次）` : ''}</p>`,
    picks.map(n => ({
      n: n.n + (n.type === 'key' ? '・基石' : ''),
      d: passTxt(n),
      ic: treeIcURL(n),
      give: () => {
        S.tree.push(n.id);
        clampHP();
        addLog(`天賦：${n.n}`);
        return [n.n];
      }
    })),
    () => {
      use();
      save();
      renderHud();
      passModal(done);
    },
    true
  );
}

/* ================= 非戰鬥節點 ================= */
/* 營火：回血，或修練一顆技能欄的技能石 */
function restNode() {
  const st = stats(),
    heal = Math.round(st.maxhp * 0.35),
    gs = S.gems.filter(g => g.lv < GEM_MAX && S.sk.includes(g.id));
  showModal('營火', `<p>在營火旁休息一下。</p><p class="sub">生命 ${S.hp}/${st.maxhp}</p>`, [
    {
      label: `休息：回復 ${heal} 生命、魔力全滿`,
      pri: 1,
      fn: () => {
        S.hp = Math.min(st.maxhp, S.hp + heal);
        S.mp = st.maxmp;
        hideModal();
        nodeDone();
      }
    },
    {
      label: '修練：技能欄的技能石 +1 級',
      dis: !gs.length,
      fn: () => {
        hideModal();
        pickModal(
          '修練哪一顆？',
          '',
          gs.slice(0, 6).map(g => ({
            n: `${SKILLS[g.k].name} Lv${g.lv}→${g.lv + 1}`,
            d: '技能石',
            ic: skIcon(g.k, SKILLS[g.k].icon),
            give: () => (g.lv++, [`${SKILLS[g.k].name} Lv${g.lv}`])
          })),
          () => nodeDone(),
          true
        );
      }
    }
  ]);
}
/* 寶箱：裝備與通貨；第二章起 20% 是寶箱怪（打贏照一般戰鬥給獎勵） */
function chestNode(n) {
  const r = rng(nodeSeed(n) + 3),
    lv = runLv(n.f);
  if (R().ch >= 1 && r() < 0.2) {
    showModal('寶箱', '<p>寶箱自己動了起來，露出一排尖牙！</p>', [
      {
        label: '應戰',
        pri: 1,
        fn: () => {
          hideModal();
          startBattle([makeEnemy(MIMIC, lv + 1, 1, ['leech'])], { bg: 'city' });
        }
      }
    ]);
    return;
  }
  const it = makeItem(DROPS[fl(r() * DROPS.length)], lv, r() < 0.5 ? 2 : 1, undefined, r),
    out = [itemName(it)];
  giveItem(it);
  for (let i = 0; i < 2; i++) {
    const c = rollCur(2 + R().ch);
    giveCur(c);
    out.push(curDot(c) + CURI[c].n);
  }
  sfx('coin');
  showModal(
    '寶箱',
    `<div class="loot">${lootList(out)
      .map(d => `<span>${d}</span>`)
      .join('')}</div>`,
    [
      {
        label: '繼續',
        pri: 1,
        fn: () => {
          hideModal();
          nodeDone();
        }
      }
    ]
  );
}
function shopNode(n) {
  openShop('旅行商人', nodeSeed(n) + 11, runLv(n.f) + 1, { leave: () => nodeDone() });
}
/* 事件：照種子從這一章能出現、這一局還沒遇過的事件抽一個（events.js） */
function eventNode(n) {
  const r = rng(nodeSeed(n) + 9),
    run = R(),
    pool = EVENTS.filter(e => e.ch.includes(run.ch) && !(run.seenEv || []).includes(e.k)),
    ev = pool.length ? pool[fl(r() * pool.length)] : EVENTS[0];
  run.seenEv = [...(run.seenEv || []), ev.k];
  const c = { lv: runLv(n.f), st: stats(), r },
    opts = ev.opts(c),
    after = res => {
      if (res && res.fight) {
        showModal(ev.n, `<p>${res.msg}</p>`, [
          {
            label: '應戰',
            pri: 1,
            fn: () => {
              hideModal();
              startBattle(res.fight.es, { bg: res.fight.bg });
            }
          }
        ]);
        return;
      }
      save();
      renderHud();
      showModal(ev.n, res || '', [
        {
          label: '繼續',
          pri: 1,
          fn: () => {
            hideModal();
            passModal(() => nodeDone());
          }
        }
      ]);
    };
  sfx('door');
  showModal(
    ev.n,
    `<p>${ev.t}</p>`,
    opts.map((o, i) => ({
      label: o.label,
      pri: i === 0,
      dis: !!o.dis,
      fn: () => {
        hideModal();
        after(o.go());
      }
    }))
  );
}

/* ================= 畫面：主選單、章節地圖 ================= */
function runmapRender() {
  const el = $('runmap');
  if (!el) return;
  el.hidden = !S.run;
  if (!S.run) return;
  const r = R(),
    nx = new Set(nextNodes().map(n => n.id)),
    ns = Object.values(r.map.nodes),
    rowH = 64,
    H = RUN_FLOORS * rowH,
    X = c => ((c + 0.5) / RUN_COLS) * 100,
    Y = f => H - (f + 0.5) * rowH;
  const lines = Object.entries(r.map.edges)
    .flatMap(([a, ts]) =>
      ts.map(b => {
        const p = nodeOf(a),
          q = nodeOf(b),
          on = r.cleared.includes(a) && (r.cleared.includes(b) || nx.has(b));
        return `<line x1="${X(p.c)}" y1="${Y(p.f)}" x2="${X(q.c)}" y2="${Y(q.f)}" class="${on ? 'on' : ''}"/>`;
      })
    )
    .join('');
  const dots = ns
    .map(n => {
      const st = r.cleared.includes(n.id) ? 'done' : nx.has(n.id) ? 'next' : n.id === r.at ? 'cur' : '';
      return `<button class="rn ${n.t} ${st}" style="left:${X(n.c)}%;top:${Y(n.f)}px" data-act="runGo" data-id="${n.id}" ${st === 'next' ? '' : 'disabled'} aria-label="${NODE[n.t].n}"><img src="${iconURL(NODE[n.t].ic)}" alt=""></button>`;
    })
    .join('');
  el.innerHTML = `<div class="rm-hd"><b>第 ${r.ch + 1} 章・${CH[r.ch].n}</b><small class="sub">第 ${Math.max(0, curFloor()) + 1}/${RUN_FLOORS} 層</small></div>${pendPicks() ? `<button class="btn pri rm-pick" data-act="runPick">天賦三選一 ×${pendPicks()}</button>` : ''}
    <div class="rm-map" style="height:${H}px"><svg class="rm-ln" viewBox="0 0 100 ${H}" preserveAspectRatio="none">${lines}</svg>${dots}</div>
    <div class="rm-lg">${more(
      '圖例',
      `<div class="chips">${Object.values(NODE)
        .map(q => `<span class="chip"><img src="${iconURL(q.ic)}" alt=""><span>${q.n}</span></span>`)
        .join('')}</div>`
    )}</div>`;
  /* 捲到能走的節點（放在畫面約一半的高度，不要被底部導覽蓋住） */
  const nb = el.querySelector('.rn.next');
  if (nb) el.scrollTop = Math.max(0, nb.offsetTop + el.querySelector('.rm-map').offsetTop - innerHeight * 0.5);
}
/* 戰鬥結束、換存檔後重畫目前的畫面（主選單或章節地圖） */
function viewRender() {
  homeRender();
  runmapRender();
  /* 底部導覽只在一局裡顯示（主選單沒有角色可看） */
  $('nav').hidden = !S.run;
  renderHud();
}

/* ================= actions ================= */
Object.assign(A, {
  /* 測試用：直接用鬥神開一局 */
  runStart: () => {
    if (S.run) return;
    startRun({ cls: 'warlord' });
  },
  runGo: d => enterNode(d.id),
  runPick: () => passModal(() => viewRender())
});
