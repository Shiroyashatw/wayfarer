/* 漫步勇者 · 存讀檔與啟動（最後載入） */
'use strict';
/* ================= boot ================= */
function load() {
  try {
    const r = localStorage.getItem(KEY);
    return r ? JSON.parse(r) : null;
  } catch (e) {
    return null;
  }
}
function save() {
  CLOUD.dirty = true;
  S.savedAt = Date.now();
  try {
    const ep = epoch(),
      hp = hepoch();
    for (const k in S.defeated)
      if (
        (k[0] === 'm' && k[1] !== 's' && !k.endsWith('_' + ep)) ||
        ((k.startsWith('ms') || 'csov'.includes(k[0])) && !k.endsWith('_' + hp)) ||
        (k[0] === 'q' && !k.endsWith('_' + mistEp())) ||
        (k[0] === 'z' && !(S.summons || []).some(z => z.id === k))
      )
        delete S.defeated[k];
    if (S.trail.length > 4000) S.trail = S.trail.slice(-4000);
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {}
}
function rebuildWorld() {
  FOOTA = null;
  fogReset();
  S.trail.forEach(([x, y]) => reveal(x, y));
  trailStep(true);
  [cam.x, cam.y] = toM(S.lat, S.lng);
  refreshEntities(true);
  renderHud();
  if (sheetName) renderSheet();
}
function migrate(s) {
  // 0.1.8：天賦樹大改版，舊的節點全部作廢，點數返還
  if ((s.treeV || 0) < 3) {
    const had = s.tree && s.tree.length > 1;
    s.tree = [startOf(s.cls)];
    s.treeV = 3;
    delete s.treeV2;
    if (had && s.log) s.log.unshift('天賦樹大改版：已點的天賦全部返還，可以重新分配');
  }
  if ((s.v || 0) < 6) {
    // 0.1.5：改造石換成蛻變石、提燈欄改為副手、新增腰帶欄
    if (s.cur.alt) {
      s.cur.trans = (s.cur.trans || 0) + s.cur.alt;
    }
    delete s.cur.alt;
    s.cur.regal = s.cur.regal || 1;
    const fix = it => {
      if (it && it.slot === 'lantern') it.slot = 'offhand';
    };
    s.inv.forEach(fix);
    Object.values(s.eq).forEach(fix);
    if (!s.eq.offhand) s.eq.offhand = s.eq.lantern || null;
    delete s.eq.lantern;
    if (!s.eq.belt) s.eq.belt = null;
    s.v = 6;
  }
  if (s.v < 7) {
    // 0.1.6：洗淨石移除，換成增幅石
    if (s.cur.scour) {
      s.cur.aug = (s.cur.aug || 0) + s.cur.scour;
    }
    delete s.cur.scour;
    s.v = 7;
  }
  if (s.v < 8) {
    // 0.2.0：技能改為技能石，職業只剩天賦盤起點；舊存檔補開局技能石
    const g = k => ({ id: uid(), k, lv: 1, dust: 0, en: [] });
    s.gems = [g(clsOf(s.cls).gem), g('heal')];
    s.sk = [s.gems[0].id, s.gems[1].id, null, null];
    Object.assign(s.cur, { soul: 0, dust: 0, eng: 1 });
    s.autoHp = s.autoHp || 0;
    s.autoMp = s.autoMp || 0;
    delete s.classOffered;
    s.v = 8;
  }
  if (s.v < 9) {
    // 0.2.2：分支據點改為冒險營旗，舊的分支據點移除並退還建造與升級金幣；遠征移除
    let back = 0;
    s.bases = (s.bases || []).filter(b => {
      if (b.type !== 'branch') return true;
      back += 150;
      for (let l = 1; l < b.lv; l++) back += 120 * l;
      return false;
    });
    if (back) {
      s.gold += back;
      s.log && s.log.unshift(`分支據點改為冒險營旗，退還 ${back} 金幣`);
    }
    Object.assign(s, {
      flags: [],
      scrolls: { stele: 0, circle: 0 },
      insc: [],
      tabs: [],
      frags: [],
      obel: {},
      caravan: {}
    });
    s.cur.vaal = s.cur.vaal || 0;
    s.v = 9;
  }
  if (s.v < 10) {
    // 0.2.6：亡靈精華與亡靈區進度
    s.ess = s.ess || {};
    s.und = s.und || {};
    s.v = 10;
  }
  if (s.v < 11) {
    // 0.2.7～0.2.11：魔霧、七宗罪殘魂、惡魔珠寶與珠寶槽
    Object.assign(s, { mist: null, sins: s.sins || {}, jewels: s.jewels || [], jsock: s.jsock || {} });
    s.v = 11;
  }
  if (s.v < 12) {
    // 0.2.12：狩獵墮落十二生肖（追蹤之血、召喚）
    s.hunt = s.hunt || { on: false, blood: 0, acc: 0, marks: {} };
    s.summons = s.summons || [];
    s.v = 12;
  }
  if (s.v < 13) {
    // 0.2.13：今日委託、足跡
    s.daily = s.daily || null;
    s.foot = s.foot || {};
    // 印記可以兌換後會被用掉，另外記錄討伐過哪些生肖（稱號用）
    if (s.hunt) s.hunt.slain = s.hunt.slain || Object.fromEntries(Object.keys(s.hunt.marks || {}).map(k => [k, 1]));
    s.v = 13;
  }
  if (s.v < 14) {
    // 0.3.0：昇華、多隻敵人（疊層存在 S.stacks）
    s.asc = s.asc || { cls: null, br: null, trials: 0, nodes: [] };
    s.stacks = 0;
    s.v = 14;
  }
  if (s.v < 15) {
    // 0.3.1.6：魔霧改成地圖上的魔霧區（各區進度在 S.mistp），舊的單一魔霧作廢；狩獵加獵殺熱度
    delete s.mist;
    s.mistp = {};
    if (s.hunt) Object.assign(s.hunt, { heat: 0, tAt: 0 });
    s.v = 15;
  }
  if (s.v < 16) {
    // 0.3.10：T 級；舊存檔依目前等級直接給到對應的 T
    s.tmax = s.tier = tierOfLv(s.lv || 1);
    s.v = 16;
  }
  if (s.v < 17) {
    // 0.3.11：技能石改成商店購買、靈魂（打怪）升級；粉塵併進靈魂，舊的靈魂碎片每 10 個換 1 個祈願石（另送 10 個），祈願改抽契靈
    const c = (s.cur = s.cur || {});
    c.wish = (c.wish || 0) + fl((c.soul || 0) / 10) + 10;
    c.soul = c.dust || 0;
    delete c.dust;
    s.pity = {};
    s.pact = { have: {}, eq: [], follow: null };
    s.v = 17;
  }
  if (s.v < 18) {
    // 0.3.12：契靈重做（R／SR／SSR、每隻是獨立個體、6 條隨機戰鬥詞綴、吃同名的突破）；0.3.11 抽到的契靈各變成一隻，重新骰詞綴、保留突破次數
    const old = (s.pact && s.pact.have) || {},
      list = [];
    for (const k in old)
      if (PACTI[k]) {
        const o = rollPact(k);
        o.brk = Math.min(PBRK_MAX, typeof old[k] === 'number' ? old[k] : 0);
        list.push(o);
      }
    /* 先幫忙裝上稀有度最高的幾隻（欄位 2 + 通過的昇華試煉） */
    const eq = [...list]
        .sort((a, b) => PACTI[b.k].r - PACTI[a.k].r || b.brk - a.brk)
        .slice(0, Math.min(PSLOT_MAX, PSLOT0 + ((s.asc && s.asc.trials) || 0)))
        .map(o => o.u),
      fo = s.pact && list.find(o => o.k === s.pact.follow);
    s.pact = { list, eq, follow: fo ? fo.u : null };
    s.pity = {};
    s.v = 18;
  }
  if (s.v < 19) {
    // 0.3.13：天賦樹中間改成契靈圓盤、沒有出發點（從圓盤往外點）；已點的天賦全部退回、珠寶回到背包；昇華拿掉終極點（點數退回）
    const was = s.tree && s.tree.length > 1;
    s.cls = CLASSES[s.cls] ? s.cls : s.asc && CLASSES[s.asc.cls] ? s.asc.cls : OLDCLS[s.cls] || 'destiny';
    s.tree = ['start'];
    s.jsock = {};
    if (s.asc && s.asc.nodes) s.asc.nodes = s.asc.nodes.filter(id => ASCN[id]);
    if (was && s.log) s.log.unshift('天賦樹改版：中間改成契靈圓盤、沒有出發點，已點的天賦全部退回');
    s.v = 19;
  }
  if (s.v < 20) {
    // 0.3.14：天賦樹各路線的節點群換成不同形狀、整張拉開；已點的節點保留還存在、而且連得回圓盤的，其餘退回
    const adj = {};
    for (const [a, b] of TREE.E) {
      (adj[a] = adj[a] || []).push(b);
      (adj[b] = adj[b] || []).push(a);
    }
    const have = new Set((s.tree || []).filter(id => TREE.byId[id])),
      keep = new Set(['start']),
      q = ['start'];
    while (q.length)
      for (const y of adj[q.shift()] || [])
        if (have.has(y) && !keep.has(y)) {
          keep.add(y);
          q.push(y);
        }
    const lost = (s.tree || []).length - keep.size;
    s.tree = [...keep];
    for (const k in s.jsock || {}) if (!keep.has(k)) delete s.jsock[k];
    if (lost > 0 && s.log) s.log.unshift(`天賦樹改版：${lost} 個節點的位置變了，點數已退回`);
    s.v = 20;
  }
  if (s.v < 21) {
    // 0.3.16：昇華分支改成 24 種 PoE2 式的造型（短路線、岔路、三選一），已點的昇華節點全部退回
    if (s.asc) {
      if ((s.asc.nodes || []).length && s.log)
        s.log.unshift('昇華改版：分支的節點排法換了，昇華點數已退回，可以重新點');
      s.asc.nodes = [];
    }
    s.v = 21;
  }
  if (s.v < 22) {
    // 0.3.17：一小一大改成硬上限（小點、大點各 4 個），0.3.16 點超過的退回重點
    const ns = (s.asc && s.asc.nodes) || [],
      sm = ns.filter(id => ASCN[id] && ascSmall(ASCN[id])).length;
    if (sm > ASC_MAX / 2 || ns.length - sm > ASC_MAX / 2) {
      if (s.log) s.log.unshift('昇華修正：一小一大最後一定是 4 小 4 大，原本點超過的昇華點數已退回，可以重新點');
      s.asc.nodes = [];
    }
    s.v = 22;
  }
  if (s.v < 23) {
    // 0.3.20：刻印拿掉，改成輔助插槽（2 格起）；每條刻印詞綴退回 1 個刻印石，腐化擴槽的多 1 格；新增輔助寶石背包與品質
    let n = 0;
    for (const g of s.gems || []) {
      n += (g.en || []).length;
      g.sock = 2 + (g.xs ? 1 : 0);
      g.sp = g.sp || [];
      g.q = g.q || 0;
      delete g.en;
      delete g.xs;
    }
    s.sups = s.sups || [];
    if (n) {
      s.cur = s.cur || {};
      s.cur.eng = (s.cur.eng || 0) + n;
      if (s.log) s.log.unshift(`技能石改版：刻印改成輔助插槽，原本的 ${n} 條刻印詞綴退回 ${n} 個刻印石`);
    }
    s.v = 23;
  }
  return s;
}
function start() {
  const local = load();
  S = migrate(local || newGame());
  cloudInit().then(remote => {
    if (remote && (!local || (remote.savedAt || 0) > (local.savedAt || 0))) {
      S = migrate(remote);
      delete S.intro;
      try {
        localStorage.setItem(KEY, JSON.stringify(S));
      } catch (e) {}
      rebuildWorld();
      toast('已從雲端載入存檔');
    } else cloudPush();
  });
  document.querySelectorAll('canvas[data-icon]').forEach(c => paintIcon(c, c.dataset.icon));
  sizeWorld();
  if (S.gps) gpsStart();
  fogReset();
  S.trail.forEach(([x, y]) => reveal(x, y));
  trailStep(true);
  [cam.x, cam.y] = toM(S.lat, S.lng);
  refreshEntities(true);
  renderHud();
  if (S.intro) {
    delete S.intro;
    addLog('冒險開始！');
    showModal(
      `漫步勇者 v${VER}`,
      `<p>真實世界就是你的冒險地圖。道路跟著真實街道走，知名地點會變成城鎮。</p><p class="sub">接下來會有簡短的新手教學帶你認識畫面。</p>`,
      [
        {
          label: '開始冒險',
          pri: 1,
          fn: () => {
            hideModal();
            /* 0.3.13 起沒有出發路線：開局送強力一擊與治癒，其他技能石到城鎮的技能石商店買 */
            if (!S.gems.length) {
              giveGem('power');
              giveGem('heal');
            }
            fullHeal();
            checkArrive();
            save();
            tutorStart();
          }
        }
      ]
    );
  } else {
    checkArrive();
    /* 0.2.5 前的存檔也看一次新手教學（可以跳過） */
    if (!S.tut) setTimeout(tutorStart, 600);
  }
  requestAnimationFrame(tick);
}
start();
