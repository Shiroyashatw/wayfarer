/* 漫步勇者 · 0.1.0 肉鴿：主選單與一局的流程（三章節點地圖、節點、獎勵、結算） */
'use strict';
/* ================= 一局的規則 =================
   一局三章，每章是一張 10 層的節點地圖（第 0～8 層 2～4 個節點、第 9 層是首領），從下往上走，只能走連線連到的節點。
   節點：戰鬥、菁英、事件、商店、休息、寶箱、首領。打完首領進下一章；第三章首領打完就通關。死了這局結束。
   一局結束（死或通關）結算魂晶（局外貨幣）與祈願石，S.run 清掉回主選單。
   角色欄位（等級、裝備、技能石…）放在 S 最上層，開新局時用 newChar() 蓋掉（祈願石保留）。 */
const RUN_FLOORS = 10,
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
/* 怪物等級：章的起點＋層數（首領再 +2） */
const runLv = (f = curFloor()) => CH[R().ch].lv + f + (f >= RUN_FLOORS - 1 ? 1 : 0);
const curFloor = () => (R().at ? nodeOf(R().at).f : -1);
/* 每場戰鬥的經驗與金幣（照節點，不照怪物）：一般戰鬥約 1.3 級、菁英 2 級、首領 2.5 級；
   一章約 5 場戰鬥＋菁英＋首領 ≈ 10 級，跟上怪物每章 +11 級。多打戰鬥等級高、走事件商店等級低，選路線有取捨 */
function runGain() {
  const t = nodeOf(R().at) ? nodeOf(R().at).t : 'fight',
    k = t === 'boss' ? 2.5 : t === 'elite' ? 2 : 1.3,
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
  /* 種類：第 0 層都是戰鬥、第 4 層寶箱、第 8 層（首領前）休息；其他照權重，菁英從第 2 層、休息從第 5 層才有 */
  for (const n of Object.values(nodes)) {
    if (n.t) continue;
    if (n.f === 0) n.t = 'fight';
    else if (n.f === 4) n.t = 'chest';
    else if (n.f === RUN_FLOORS - 2) n.t = 'rest';
    else {
      const w = [
        ['fight', 50],
        ['event', 18],
        ['elite', n.f >= 2 ? 14 : 0],
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
    t0: Date.now()
  };
  S.run.map = genMap(S.run.seed, 0);
  giveGem('power');
  giveGem('heal');
  fullHeal();
  S.meta.runs++;
  addLog('新的一局開始了');
  save();
  closeSheet();
  playSong('field');
  viewRender();
}
/* 一局結束：結算魂晶與祈願石，回主選單 */
function endRun(won) {
  const r = R(),
    prog = r.ch * RUN_FLOORS + Math.max(0, curFloor() + 1),
    soul = prog * 3 + r.elites * 8 + r.bosses * 25 + (won ? 60 : 0),
    wish = r.bosses * 2 + (won ? 4 : 0) + fl(prog / 6);
  S.meta.soul += soul;
  S.cur.wish = (S.cur.wish || 0) + wish;
  if (won) S.meta.wins++;
  S.meta.best = Math.max(S.meta.best || 0, prog);
  const html = `<p>${won ? '三章都打通了！' : `倒在第 ${r.ch + 1} 章・${CH[r.ch].n}，第 ${Math.max(1, curFloor() + 1)} 層。`}</p>
    <div class="kv"><div><span>等級</span><b>Lv${S.lv}</b></div><div><span>擊倒</span><b>${r.kills}</b></div><div><span>菁英</span><b>${r.elites}</b></div><div><span>首領</span><b>${r.bosses}</b></div></div>
    <p>得到 <b style="color:#9fe7ff">◆ ${soul} 魂晶</b>、<b style="color:var(--gold)">${wish} 祈願石</b></p>`;
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
    const pool = [...UNDEAD, ...MISTMON];
    return pool[rr % pool.length];
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
/* 一般戰鬥：帶頭的一隻（25% 是魔法怪）＋0～2 隻小怪；第 0 層只有 1～2 隻 */
function fightGroup(n) {
  const r = rng(nodeSeed(n)),
    lv = runLv(n.f),
    lead = chMob(fl(r() * 1e6), lv),
    rar = r() < 0.25 && n.f > 0 ? 1 : 0,
    e = makeEnemy(lead, lv, rar, rar ? rollMods(fl(r() * 1e9), 1) : []),
    k = n.f === 0 ? fl(r() * 2) : 1 + fl(r() * 2);
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
/* 菁英：第一章墮落獸、第二章七罪信徒、第三章冥府守衛；稀有（2）帶 2 條詞綴＋1 隻小怪 */
function eliteGroup(n) {
  const r = rng(nodeSeed(n) + 5),
    lv = runLv(n.f) + 1,
    ch = R().ch,
    mods = rollMods(fl(r() * 1e9), 2);
  let e,
    es,
    bg = 'cave';
  if (ch === 0) {
    const ms = MONS.filter(m => HUNT_SPR[m.name]),
      b = ms[fl(r() * ms.length)];
    e = makeEnemy(beastBase(b), lv, 2, mods);
    bg = b.bg;
    es = [e, ...fightGroup(n).es.slice(1, 2)];
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
    e = makeEnemy(b, lv, 2, [...w.mods.slice(0, 1), mods[0]]);
    e.name = `冥府看門人・${w.n}`;
    es = [e, ...fightGroup(n).es.slice(1, 2)];
  }
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
    e.atk = Math.round(e.atk * 1.2);
    e.xp *= 4;
    e.rar = 3;
    e.big = 1;
    return e;
  };
  let e;
  if (ch === 0) e = ghost(GHOSTS[fl(r() * GHOSTS.length)], 2.6);
  else if (ch === 1)
    e = r() < 0.6 ? makeZodiac(ZODIAC[fl(r() * ZODIAC.length)].k, lv) : makeXiong(XIONG[fl(r() * XIONG.length)], lv);
  else {
    const k = fl(r() * 4);
    if (k === 0) e = makeSinKing(lv);
    else if (k === 1) e = udBoss('亡靈王', 'a_lichking', BOSSPAL.b_lichking, lv, 5);
    else if (k === 2) e = makeZhulong(lv);
    else {
      e = ghost({ n: '閻羅王', spr: 'a_yanluo', el: 'fire' }, 3.4, true);
      e.yama = 1;
    }
  }
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
function pickModal(title, head, picks, done) {
  let got = null;
  const render = () =>
    showModal(
      title,
      head +
        (got
          ? `<div class="loot">${got.map(t => `<span>${t}</span>`).join('')}</div>`
          : `<h3>選一個</h3><div class="bpick">${picks.map((p, i) => `<button class="bpk" data-act="mbtn" data-i="${i + 1}"><img src="${p.ic}" alt=""><b>${p.n}</b><small>${p.d}</small></button>`).join('')}</div>`),
      [
        {
          label: got ? '繼續' : '跳過',
          pri: !!got,
          fn: () => {
            hideModal();
            done();
          }
        },
        ...picks.map(p => ({
          label: '',
          hide: 1,
          fn: () => {
            if (got) return;
            got = p.give();
            sfx('coin');
            save();
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
  const head = `<p>獲得 <span style="color:var(--good)">${w.xp} 經驗</span>、<span style="color:var(--gold)">${w.gold} 金幣</span>${w.up ? `・<b class="c-gold">升級到 Lv${S.lv}！</b>` : ''}</p>${
    w.drops.length
      ? `<div class="loot">${lootList(w.drops)
          .map(d => `<span>${d}</span>`)
          .join('')}</div>`
      : ''
  }${w.bonus}`;
  const lv = es[0].lv,
    picks = n.t === 'boss' ? bossPicks(lv) : rewardPicks(lv, n.t === 'elite');
  pickModal(n.t === 'boss' ? '首領倒下了！' : '勝利！', head, picks, () => {
    endBattle();
    nodeDone();
  });
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

/* ================= 非戰鬥節點（第 3 階段擴充） ================= */
function restNode() {
  const st = stats(),
    heal = Math.round(st.maxhp * 0.35),
    gs = S.gems.filter(g => g.lv < GEM_MAX);
  showModal('營火', `<p>在營火旁休息一下。</p><p class="sub">生命 ${S.hp}/${st.maxhp}</p>`, [
    {
      label: `休息：回復 ${heal} 生命`,
      pri: 1,
      fn: () => {
        S.hp = Math.min(st.maxhp, S.hp + heal);
        S.mp = st.maxmp;
        hideModal();
        nodeDone();
      }
    },
    {
      label: '修練：技能石 +1 級',
      dis: !gs.length,
      fn: () => {
        const g = gs.sort((a, b) => S.sk.includes(b.id) - S.sk.includes(a.id))[0];
        g.lv++;
        toast(`${SKILLS[g.k].name} 升到 Lv${g.lv}`);
        hideModal();
        nodeDone();
      }
    }
  ]);
}
function chestNode(n) {
  const lv = runLv(n.f),
    it = makeItem(DROPS[fl(Math.random() * DROPS.length)], lv, Math.random() < 0.5 ? 2 : 1),
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
function shopNode() {
  SEL.gshop = 'run';
  showModal('商店', '<p>旅行商人攤開了貨品。</p>', [
    {
      label: '技能石與輔助寶石',
      fn: () => {
        hideModal();
        A.gemShop();
      }
    },
    {
      label: '生命藥水（30 金）',
      dis: S.gold < 30,
      fn: () => {
        S.gold -= 30;
        S.potions++;
        sfx('coin');
        renderHud();
        shopNode();
      }
    },
    {
      label: '離開',
      pri: 1,
      fn: () => {
        SEL.gshop = null;
        hideModal();
        nodeDone();
      }
    }
  ]);
}
function eventNode(n) {
  const r = rng(nodeSeed(n) + 9),
    st = stats();
  if (r() < 0.5) {
    const g = 15 + runLv(n.f) * 5;
    S.gold += g;
    showModal('土地公廟', `<p>路邊的小廟前有人留下香油錢。你拜了拜，土地公保佑你。</p><p>得到 ${g} 金幣。</p>`, [
      {
        label: '繼續',
        pri: 1,
        fn: () => {
          hideModal();
          nodeDone();
        }
      }
    ]);
  } else {
    const heal = Math.round(st.maxhp * 0.2);
    S.hp = Math.min(st.maxhp, S.hp + heal);
    showModal('山泉', `<p>清涼的山泉讓你恢復了精神。</p><p>回復 ${heal} 生命。</p>`, [
      {
        label: '繼續',
        pri: 1,
        fn: () => {
          hideModal();
          nodeDone();
        }
      }
    ]);
  }
}

/* ================= 畫面：主選單、章節地圖 ================= */
function homeRender() {
  const el = $('home');
  if (!el || !S) return;
  el.hidden = !!S.run;
  if (S.run) return;
  const m = S.meta;
  el.innerHTML = `<div class="hm"><h1 class="hm-t">漫步勇者</h1><p class="sub">v${VER}</p>
    <div class="hm-b"><button class="btn pri" data-act="runStart">開始新局</button><button class="btn" data-act="gacha">契靈祈願</button></div>
    <div class="kv"><div><span>魂晶</span><b>${m.soul}</b></div><div><span>局數</span><b>${m.runs}</b></div><div><span>通關</span><b>${m.wins}</b></div></div></div>`;
}
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
  el.innerHTML = `<div class="rm-hd"><b>第 ${r.ch + 1} 章・${CH[r.ch].n}</b><small class="sub">第 ${Math.max(0, curFloor()) + 1}/${RUN_FLOORS} 層</small></div>
    <div class="rm-map" style="height:${H}px"><svg class="rm-ln" viewBox="0 0 100 ${H}" preserveAspectRatio="none">${lines}</svg>${dots}</div>`;
}
/* 戰鬥結束、換存檔後重畫目前的畫面（主選單或章節地圖） */
function viewRender() {
  homeRender();
  runmapRender();
  renderHud();
}

/* ================= actions ================= */
Object.assign(A, {
  runStart: () => {
    if (S.run) return;
    startRun();
  },
  runGo: d => enterNode(d.id)
});
