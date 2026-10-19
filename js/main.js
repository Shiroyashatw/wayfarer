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
      if ((k[0] === 'm' && !k.endsWith('_' + ep)) || ('csov'.includes(k[0]) && !k.endsWith('_' + hp)))
        delete S.defeated[k];
    if (S.trail.length > 4000) S.trail = S.trail.slice(-4000);
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {}
}
function rebuildWorld() {
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
    s.gems = [g(CLASSES[s.cls] ? CLASSES[s.cls].gem : 'power'), g('heal')];
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
      `<p>真實世界就是你的冒險地圖。道路跟著真實街道走，知名地點會變成城鎮。</p><p class="sub">先選擇天賦盤的起點，接著會有簡短的新手教學帶你認識畫面。</p>`,
      [
        {
          label: '選擇起點',
          pri: 1,
          fn: () => {
            hideModal();
            classPicker(() => {
              checkArrive();
              save();
              tutorStart();
            });
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
