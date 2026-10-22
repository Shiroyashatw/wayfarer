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
        const { data: runs, error } = await CLOUD.sb.rpc('pick_rivals', { p_ver: GVER, p_rating: rating, p_n: 3 });
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
          av: AVATARS.some(a => a[0] === r.avatar) ? r.avatar : AVATARS[0][0],
          snaps: Object.fromEntries(sn.filter(s => s.run_id === r.id).map(s => [s.round, { hp: s.hp, bag: s.bag }]))
        }));
      })();
      got = await Promise.race([job, new Promise(res => setTimeout(() => res([]), 4000))]);
    } catch (e) {
      ghostFail(e);
    }
  return [...got, ...makeBots(3 - got.length, rating)].slice(0, 3);
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
}
/* ================= 開服種子資料（開發用） ================= */
/* 在瀏覽器主控台執行 seedGhosts(160)：分數 700～2100 平均分布（每個牌階都有對手，越高越強），用目前的帳號產生 n 局機器人對局（4 個一場、真的互打），上傳成種子快照（runs.seed = true）。
   真人對局夠多以後可以在 SQL Editor 刪掉：delete from public.runs where seed; */
async function seedGhosts(n = 160, lo = 700, hi = 2100) {
  if (!CLOUD.sb || !CLOUD.uid) throw new Error('雲端還沒連線');
  let ok = 0;
  for (let k = 0; ok < n; k++) {
    const rating = lo + fl(Math.random() * (hi - lo)),
      bots = simLobby((Math.random() * 2 ** 31) | 0, rating);
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
      ok++;
    }
    console.log(`種子對局 ${ok}/${n}`);
  }
  return ok;
}
