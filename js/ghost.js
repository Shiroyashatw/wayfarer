/* 塞令老師 · 快照對戰：每回合開戰前把背包存成快照（Supabase 的 runs／snaps），開局配 3 位分數相近的對手；
   沒有連線、資料表還沒建、或真人快照不夠時，用機器人補位（run.js 的 makeBots）。只用 anon key，RLS 限制只能寫自己的 */
'use strict';
const GHOST = { off: false, why: '' };
const ghostOK = () => !GHOST.off && typeof CLOUD !== 'undefined' && CLOUD.sb && CLOUD.uid;
function ghostFail(e) {
  GHOST.off = true;
  GHOST.why = (e && e.message) || String(e);
  console.warn('快照對戰停用：', GHOST.why);
}
/* 開局：配對手（最多等 4 秒，不行就全部機器人） */
async function ghostRivals(rating) {
  let got = [];
  if (ghostOK())
    try {
      const job = (async () => {
        const { data: runs, error } = await CLOUD.sb.rpc('pick_rivals', {
          p_ver: GVER,
          p_rating: rating,
          p_n: GHOST_MAX
        });
        if (error) throw error;
        if (!runs || !runs.length) return [];
        const { data: sn, error: e2 } = await CLOUD.sb
          .from('snaps')
          .select('run_id,round,hp,bag')
          .in(
            'run_id',
            runs.map(r => r.id)
          );
        if (e2) throw e2;
        return runs.map(r => ({
          name: r.name || randName(),
          /* 0.1.63 舊頭像（拿掉的靜態頭像）照名字平均換成現在的頭像，不要全部變成第一個 */
          av: AVATARS.some(a => a[0] === r.avatar) ? r.avatar : avFallback(r.name || r.avatar),
          snaps: Object.fromEntries(sn.filter(s => s.run_id === r.id).map(s => [s.round, { hp: s.hp, bag: s.bag }]))
        }));
      })();
      got = await Promise.race([job, new Promise(res => setTimeout(() => res([]), 4000))]);
    } catch (e) {
      ghostFail(e);
    }
  /* 0.1.29 6 人一場：真人快照最多 GHOST_MAX 位，其他機器人補滿 5 位 */
  got = got.slice(0, GHOST_MAX);
  /* 0.1.30 機器人改成即時的（跟你一起每回合推進，會看你的背包反制），不用開局先跑完一整局 */
  return [...got, ...liveBots(LOBBY_N - 1 - got.length, rating)].slice(0, LOBBY_N - 1);
}
/* 開局：在 runs 建一筆（失敗就只是不存快照） */
async function ghostBegin(run) {
  if (!ghostOK()) return;
  try {
    const { data, error } = await CLOUD.sb
      .from('runs')
      .insert({ user_id: CLOUD.uid, ver: GVER, name: S.name, avatar: S.av, rating: S.rating })
      .select('id')
      .single();
    if (error) throw error;
    run.rid = data.id;
    run.sn = 0;
    save();
  } catch (e) {
    ghostFail(e);
  }
}
/* 開戰前的快照 */
function ghostSnap(run, round) {
  if (!ghostOK() || !run.rid) return;
  run.sn = (run.sn || 0) + 1;
  CLOUD.sb
    .from('snaps')
    .upsert({ run_id: run.rid, round, hp: run.hp, bag: packBag(run.bag) })
    .then(({ error }) => {
      if (error) return ghostFail(error);
      CLOUD.sb
        .from('runs')
        .update({ rounds: run.sn })
        .eq('id', run.rid)
        .then(() => {});
    });
}
/* 結束：記名次 */
function ghostEnd(run) {
  if (!ghostOK() || !run.rid) return;
  CLOUD.sb
    .from('runs')
    .update({ place: run.place, finished_at: new Date().toISOString() })
    .eq('id', run.rid)
    .then(({ error }) => error && ghostFail(error));
  /* 0.1.29 排行榜用：職業、打完後的分數（另外更新；資料表還沒加欄位時失敗也不影響快照對戰） */
  CLOUD.sb
    .from('runs')
    .update({ cls: run.bag.cls || null, rating_end: S.rating })
    .eq('id', run.rid)
    .then(() => {});
  /* 0.1.45 核心統計：最後的兩個核心、三選一紀錄（要先跑 20261024000000_serling_core_stats.sql；沒跑時失敗也不影響） */
  CLOUD.sb
    .from('runs')
    .update(coreCols(run.bag.core, run.coreLog))
    .eq('id', run.rid)
    .then(() => {});
  BOARD.at = 0;
}
/* runs 的核心欄位：core 是核心欄的道具（{ id, sc }），log 是三選一紀錄 */
const coreCols = (core, log) => ({
  core1: (core && core.id) || null,
  core2: (core && core.sc) || null,
  core_log: log && log.length ? log : null
});
/* 0.1.45 真人（或 seed 也算）的核心統計：每個核心出現、被選、拿著的名次，以及組合；在主控台 await coreStatsCloud() 看 */
async function coreStatsCloud(seed = false, days = 30) {
  if (!ghostOK()) throw new Error('雲端還沒連線');
  const [a, b] = await Promise.all([
    CLOUD.sb.rpc('core_stats', { p_seed: seed, p_days: days }),
    CLOUD.sb.rpc('core_combo_stats', { p_seed: seed, p_days: days })
  ]);
  if (a.error || b.error) throw a.error || b.error;
  const nm = id => (ITEMI[id] ? ITEMI[id].n : id);
  console.table(
    (a.data || []).map(x => ({
      職業: (CLSI[x.cls] || {}).n || x.cls,
      核心: nm(x.core),
      出現: x.offered,
      被選: x.picked,
      選擇率: x.offered ? Math.round((x.picked / x.offered) * 100) + '%' : '—',
      拿著: x.held,
      平均名次: x.avg_place
    }))
  );
  console.table(
    (b.data || []).slice(0, 30).map(x => ({
      職業: (CLSI[x.cls] || {}).n || x.cls,
      組合: nm(x.core1) + '＋' + nm(x.core2),
      局數: x.games,
      平均名次: x.avg_place
    }))
  );
  return { cores: a.data, combos: b.data };
}
/* ================= 排行榜（0.1.29） ================= */
/* p：玩家排行（leaderboard）；c：各職業的局數、第 1 名、平均名次（class_stats，真人不到 40 局就連種子一起算，seed 標記）；
   拿不到（離線、還沒跑 20261023000000_serling_leaderboard.sql）時 err 有值，首頁改顯示自己的職業戰績 */
const BOARD = { at: 0, p: null, c: null, seed: false, err: '', busy: false };
async function ghostBoard(force = false) {
  if (!ghostOK() || BOARD.busy || (!force && Date.now() - BOARD.at < 60000)) return false;
  BOARD.busy = true;
  try {
    const [a, b] = await Promise.all([
      CLOUD.sb.rpc('leaderboard', { p_n: 20 }),
      CLOUD.sb.rpc('class_stats', { p_seed: false, p_days: 30 })
    ]);
    if (a.error || b.error) throw a.error || b.error;
    let c = b.data || [],
      seed = false;
    if (c.reduce((n, x) => n + x.games, 0) < 40) {
      const s2 = await CLOUD.sb.rpc('class_stats', { p_seed: true, p_days: 30 });
      if (!s2.error) (c = s2.data || []), (seed = true);
    }
    Object.assign(BOARD, { p: a.data || [], c, seed, err: '' });
  } catch (e) {
    BOARD.err = (e && e.message) || String(e);
  }
  BOARD.at = Date.now();
  BOARD.busy = false;
  return true;
}
/* ================= 開服種子資料（開發用） ================= */
/* 在瀏覽器主控台執行 seedGhosts(160)：分數 700～2100 平均分布（每個牌階都有對手，越高越強），用目前的帳號產生 n 局機器人對局（4 個一場、真的互打），上傳成種子快照（runs.seed = true）。
   真人對局夠多以後可以在 SQL Editor 刪掉：delete from public.runs where seed; */
/* 0.1.52 預設 300 局（對手變化多一點）；機器人的職業 13 個輪流（之前隨機，有的職業只有 2 局） */
async function seedGhosts(n = 300, lo = 700, hi = 2100) {
  if (!CLOUD.sb || !CLOUD.uid) throw new Error('雲端還沒連線');
  let ok = 0;
  for (let k = 0; ok < n; k++) {
    const rating = lo + fl(Math.random() * (hi - lo)),
      bots = simLobby((Math.random() * 2 ** 31) | 0, rating, {
        cls: [...Array(LOBBY_N).keys()].map(i => CLASSES[(k * LOBBY_N + i) % CLASSES.length].id)
      });
    for (const b of bots) {
      if (ok >= n) break;
      const ids = Object.keys(b.snaps);
      const { data, error } = await CLOUD.sb
        .from('runs')
        .insert({
          user_id: CLOUD.uid,
          ver: GVER,
          name: b.name,
          avatar: b.av,
          rating: b.rating,
          rounds: ids.length,
          place: b.place,
          /* 0.1.29 職業（各職業勝率用；要先跑 20261023000000_serling_leaderboard.sql） */
          cls: (b.snaps[ids[ids.length - 1]].bag || {}).cls || null,
          seed: true,
          finished_at: new Date().toISOString()
        })
        .select('id')
        .single();
      if (error) throw error;
      const { error: e2 } = await CLOUD.sb
        .from('snaps')
        .insert(ids.map(id => ({ run_id: data.id, round: id, hp: b.snaps[id].hp, bag: b.snaps[id].bag })));
      if (e2) throw e2;
      /* 0.1.45 核心統計（欄位還沒加時失敗也沒關係） */
      if (b.stat)
        await CLOUD.sb
          .from('runs')
          .update(coreCols({ id: b.stat.core[0], sc: b.stat.core[1] }, b.stat.log))
          .eq('id', data.id);
      ok++;
    }
    console.log(`種子對局 ${ok}/${n}`);
  }
  return ok;
}
