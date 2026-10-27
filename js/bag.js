/* 塞令老師 · 背包：格子、擺放、相鄰、合成，以及把背包算成戰鬥用的角色（compileBag） */
'use strict';
/* 背包裡的一件：{ u: 編號, id, t: 階, x, y, r: 旋轉, a: 升階詞綴 } */
/* 0.1.42 職業核心不佔背包格子：放在 bag.core（第二個核心照舊融入它的 sc）；算效果時跟背包道具一起算 */
const bagAll = bag => (bag.core ? [...bag.items, bag.core] : bag.items);
const cellsOf = o => shapeO(o).map(([x, y]) => [o.x + x, o.y + y]);
/* 格子上是哪一件（u），沒有回傳 null */
function bagGrid(bag) {
  const g = Array.from({ length: bag.h }, () => Array(bag.w).fill(null));
  for (const o of bag.items) for (const [x, y] of cellsOf(o)) if (g[y] && x >= 0 && x < bag.w) g[y][x] = o.u;
  return g;
}
/* 能不能把 o 放在 (x, y)、旋轉 r（忽略自己） */
function canPlace(bag, o, x, y, r) {
  const g = bagGrid(bag),
    st = stCells(bag, o.u);
  for (const [dx, dy] of shapeO(o, r)) {
    const cx = x + dx,
      cy = y + dy;
    if (cx < 0 || cy < 0 || cx >= bag.w || cy >= bag.h) return false;
    const u = g[cy][cx];
    if ((u != null && u !== o.u) || st.has(cx + ',' + cy)) return false;
  }
  /* 職業核心一個背包最多一個 */
  /* 專屬核心（core 1）、副核心（core 2）各最多 1 個 */
  if (ITEMI[o.id].core && bag.items.some(q => q.u !== o.u && ITEMI[q.id].core === ITEMI[o.id].core)) return false;
  return true;
}
/* 0.1.96 整理區（手機整理背包用）：背包還沒開的格子（畫到最大背包 STG_W×STG_H）可以暫放道具（bag.st），
   放在那裡的（包括一半壓在背包裡的）不算戰力、不在快照裡；有東西在整理區就不能開戰。
   stCells：整理區的道具佔的格子（skip 是正在拖的那件） */
const STG_W = BAGLV[BAG_MAX].w,
  STG_H = BAGLV[BAG_MAX].h;
function stCells(bag, skip) {
  const out = new Set();
  for (const q of bag.st || []) if (q.u !== skip) for (const c of cellsOf(q)) out.add(c + '');
  return out;
}
/* 能不能放進整理區：格子在 STG_W×STG_H 裡、不壓到背包或整理區的道具，而且至少有一格在背包外面（整件都在背包裡就直接放背包） */
function canStage(bag, o, x, y, r) {
  const g = bagGrid(bag),
    st = stCells(bag, o.u);
  let out = false;
  for (const [dx, dy] of shapeO(o, r)) {
    const cx = x + dx,
      cy = y + dy;
    if (cx < 0 || cy < 0 || cx >= STG_W || cy >= STG_H || st.has(cx + ',' + cy)) return false;
    if (cx >= bag.w || cy >= bag.h) out = true;
    else if (g[cy][cx] != null && g[cy][cx] !== o.u) return false;
  }
  return out;
}
/* 背包變大後：整件都進到背包裡、放得下的，從整理區搬進背包 */
function stageSync(bag) {
  for (const q of [...(bag.st || [])]) {
    const rest = { ...bag, st: bag.st.filter(x => x !== q) };
    if (canPlace(rest, q, q.x, q.y, q.r)) (bag.st = rest.st), bag.items.push(q);
  }
}
/* 兩件是不是相鄰（上下左右） */
function adjacent(a, b) {
  const s = new Set(cellsOf(b).map(([x, y]) => x + ',' + y));
  return cellsOf(a).some(
    ([x, y]) => s.has(x + 1 + ',' + y) || s.has(x - 1 + ',' + y) || s.has(x + ',' + (y + 1)) || s.has(x + ',' + (y - 1))
  );
}
const rowsOf = o => new Set(cellsOf(o).map(p => p[1]));
const sameRow = (a, b) => [...rowsOf(a)].some(y => rowsOf(b).has(y));
/* 找一個放得下的位置（先試每個旋轉；score 越高越好：跟有加成關係的道具相鄰） */
/* 0.1.11 變快：格子表只建一次（canPlace 每次都重建，背包大了機器人一場要 0.6 秒，開局會卡），只對有加成關係的道具算分 */
function findSpot(bag, o, prefer = true) {
  const I = ITEMI[o.id];
  if (I.core && bag.items.some(q => q.u !== o.u && ITEMI[q.id].core === I.core)) return null;
  const g = bagGrid(bag),
    /* 0.1.62 背包裡別人的凹口（空著的才算） */
    holes = bag.items
      .filter(q => q.u !== o.u && holeMod(q) && holeFits(holeMod(q), I.tags))
      .flatMap(q => holeOf(q))
      .filter(([x, y]) => g[y] && g[y][x] == null)
      .map(([x, y]) => x + ',' + y),
    rel = prefer
      ? bag.items.map(q => [q, q.u !== o.u ? synergy(o, q) + synergy(q, o) : 0]).filter(([, n]) => n > 0)
      : [];
  let best = null;
  for (let r = 0; r < 4; r++) {
    const sh = shapeO(o, r);
    for (let y = 0; y < bag.h; y++)
      for (let x = 0; x < bag.w; x++) {
        let ok = true;
        for (const [dx, dy] of sh) {
          const cx = x + dx,
            cy = y + dy;
          if (cx >= bag.w || cy >= bag.h || (g[cy][cx] != null && g[cy][cx] !== o.u)) {
            ok = false;
            break;
          }
        }
        if (!ok) continue;
        let sc = 0;
        if (rel.length) {
          const t = { ...o, x, y, r };
          for (const [q, n] of rel) if (adjacent(t, q)) sc += n;
        }
        /* 0.1.62 巨人國的凹口：有凹口的道具想包住吃得到的道具，吃得到的道具想塞進別人的凹口 */
        if (prefer && (holeMod(o) || holes.length)) {
          const t = { ...o, x, y, r };
          if (holeMod(o))
            for (const [hx, hy] of holeOf(t)) {
              const u = g[hy] && g[hy][hx];
              const q = u != null && bag.items.find(z => z.u === u);
              if (q && holeFits(holeMod(o), ITEMI[q.id].tags)) sc += 3;
            }
          {
            const cs = new Set(shapeO(o, r).map(([dx, dy]) => x + dx + ',' + (y + dy)));
            for (const hc of holes) if (cs.has(hc)) sc += 3;
          }
        }
        if (!best || sc > best.sc) best = { x, y, r, sc };
      }
  }
  return best;
}
/* a 給 b 的加成有幾條（相鄰／同排看位置，這裡只看標籤）；質變算 2 條 */
function synergy(a, b) {
  const A = ITEMI[a.id],
    tb = ITEMI[b.id].tags;
  return (
    [...(A.adj || []), ...(A.row || [])].filter(m => m.tag === '*' || tb.includes(m.tag)).length +
    (A.tf && !ITEMI[b.id].tf && tb.includes(A.tf.tag) ? 2 : 0) +
    /* 0.1.43 魔劍正宗：劍擺在旁邊會被吸收（機器人找位置時會貼過去） */
    (A.absorb && [A.absorb].flat().some(t => tb.includes(t)) && !ITEMI[b.id].absorb ? 3 : 0)
  );
}
/* 0.1.28 融合（質變）：質變輔助（tf）放到道具上、或貼在旁邊，就跟它融合成一件新道具「前綴・道具」（輔助消失、空出格子）：
   多了標籤和效果。融合過的道具記著 f（輔助代號）、ft（輔助的階）。一件只能融合一次。
   回傳 Map(道具 u → { id: 輔助代號, t: 階, u: 還在背包裡的輔助 u（已經融合的是 null） })；
   還沒融合、只是貼在旁邊的（機器人評估、擺放的瞬間）也算，每個輔助只算一件（星級最高、再來階數高的） */
const tfRank = o => ITEMI[o.id].star * 10 + o.t;
const canFuse = (s, q, c) => {
  const T = ITEMI[s.id].tf,
    Q = ITEMI[q.id];
  if (ITEMI[s.id].mod) return canMod(s, q, c);
  if (ITEMI[s.id].fk) return !!cookOf(s, q);
  return !!T && q !== s && !Q.tf && !q.f && Q.tags.includes(T.tag);
};
function tfOf(its, adjQ = adjacent) {
  const out = new Map();
  for (const o of its) if (o.f && ITEMI[o.f]) out.set(o.u, { id: o.f, t: o.ft || 1, u: null });
  const cats = its.filter(o => ITEMI[o.id].tf).sort((a, b) => tfRank(b) - tfRank(a));
  for (const s of cats) {
    let best = null;
    for (const q of its)
      if (canFuse(s, q) && !out.has(q.u) && adjQ(s, q) && (!best || tfRank(q) > tfRank(best))) best = q;
    if (best) out.set(best.u, { id: s.id, t: s.t, u: s.u });
  }
  return out;
}
/* 把輔助 s（背包或暫存區）融合進 q；0.1.100 巨人國的工具改用 modInto（c 是鑿子挖的那格） */
function fuseInto(run, s, q, c) {
  if (ITEMI[s.id].mod) return modInto(run, s, q, c);
  if (ITEMI[s.id].fk) return cookInto(run, s, q);
  q.f = s.id;
  q.ft = s.t;
  run.bag.items = run.bag.items.filter(x => x !== s);
  const i = run.bench.indexOf(s);
  if (i >= 0) run.bench[i] = null;
  return q;
}
/* 0.1.103 料理：食物 s 拖到食物 q 上，q 變成合成出來的那道（大料理 2 格：原位放不下就找別的位置，再不行收回暫存區），s 消失 */
function cookInto(run, s, q) {
  q.id = cookOf(s, q);
  run.bag.items = run.bag.items.filter(x => x !== s);
  const i = run.bench.indexOf(s);
  if (i >= 0) run.bench[i] = null;
  return mdSet(run, q, q.md, q.sh);
}
/* 0.1.100 巨人國的改造：工具 s 能不能用在 q（c 是背包座標，鑿子要；暫存區的道具只能縮小、放大） */
function canMod(s, q, c) {
  const M = ITEMI[s.id].mod,
    Q = ITEMI[q.id];
  if (!M || q === s || q.md || Q.core || Q.mod || q.sm) return false;
  if (M === 'shrink') return shapeO(q).length > 1;
  if (M === 'grow') return true;
  return chiselIdx(q, c) >= 0;
}
/* 把改造 md（形狀 sh）套到 q 上；在背包裡的照原位放，放不下找別的位置，再不行收回暫存區（再不行賣掉，跟長柄大師一樣）。
   at：縮小後留在哪一格（沒給就是原本的第一格）、鑿子挖掉的那格 */
function mdSet(run, q, md, sh, at) {
  const inBag = run.bag.items.includes(q),
    c0 = inBag ? cellsOf(q) : null;
  if (md) q.md = md;
  else delete q.md;
  if (sh) q.sh = sh;
  else delete q.sh;
  q.sm = 0;
  if (!inBag) return q;
  if (md === 'shrink') [q.x, q.y] = at || c0[0];
  /* 鑿子：挖掉的那格（合成時沒給，就是原形狀的第幾格），剩下的格子留在原地 */
  const rm = md === 'chisel' && (at || c0[+sh.split(':')[2]]);
  if (rm && c0.length === SH[sh].length + 1) {
    const keep = c0.filter(([x, y]) => x !== rm[0] || y !== rm[1]);
    q.x = Math.min(...keep.map(p => p[0]));
    q.y = Math.min(...keep.map(p => p[1]));
  }
  /* 判斷位置要用不含這件的背包（它的新形狀可能蓋住別人，格子表會把別人那格記成它的） */
  const rest = { ...run.bag, items: run.bag.items.filter(x => x !== q) };
  if (canPlace(rest, q, q.x, q.y, q.r)) return q;
  const sp = findSpot(rest, q, true);
  if (sp) return Object.assign(q, sp);
  run.bag.items = run.bag.items.filter(x => x !== q);
  const fi = run.bench.indexOf(null);
  if (fi >= 0) run.bench[fi] = q;
  else run.gold += sellO(q, run);
  return q;
}
function modInto(run, s, q, c) {
  const M = ITEMI[s.id].mod;
  run.bag.items = run.bag.items.filter(x => x !== s);
  const i = run.bench.indexOf(s);
  if (i >= 0) run.bench[i] = null;
  if (M === 'shrink') return mdSet(run, q, 'shrink', 's1', c);
  if (M === 'grow') return mdSet(run, q, 'grow', growSh(shapeO(q).length));
  const k = 'k:' + (q.sh || ITEMI[q.id].sh) + ':' + chiselIdx(q, c);
  shReg(k);
  return mdSet(run, q, 'chisel', k, c);
}
/* 背包裡貼在一起的輔助與道具自動融合；回傳融合好的道具 */
function fuseAll(run) {
  const out = [];
  for (const [u, c] of tfOf(run.bag.items)) {
    if (!c.u) continue;
    const s = run.bag.items.find(o => o.u === c.u),
      q = run.bag.items.find(o => o.u === u);
    if (s && q) out.push(fuseInto(run, s, q));
  }
  out.push(...absorbAll(run));
  return out;
}
/* 0.1.35 魔劍正宗（absorb）：貼在旁邊的劍被吸收，o.ab 累加那把劍（照它的階）的傷害、暴擊率、命中效果；
   0.1.46 也吸收矛、詞綴（升階詞綴、5★ 詞綴 → ab.am 道具加成、ab.F 角色加成）與融合輔助的加成（照格數的不吸） */
function absorbInto(o, q) {
  const I = ITEMI[q.id],
    on = onT(I, q.t),
    ab = (o.ab = o.ab || { d0: 0, d1: 0, n: 0 }),
    am = (ab.am = ab.am || {}),
    aF = (ab.F = ab.F || {}),
    put = (t, k, v) => v && (t[k] = (t[k] || 0) + v);
  ab.d0 += Math.round(I.dmg[0] * TIERM[q.t]);
  ab.d1 += Math.round(I.dmg[1] * TIERM[q.t]);
  for (const k of AB_K) if (on[k]) ab[k] = (ab[k] || 0) + on[k];
  if (on.freeze) ab.freezeCh = (ab.freezeCh || 0) + on.freeze[0];
  if (on.stun) ab.stunCh = (ab.stunCh || 0) + on.stun[0];
  const a = q.a && AFFX.find(x => x.k === q.a);
  if (a) put(a.k === 'hp' ? aF : am, a.k, a.v);
  for (const mm of [q.m, q.m2]) if (mm && MOD5[mm[0]]) put(MOD5[mm[0]].F ? aF : am, MOD5[mm[0]].k, mm[1]);
  if (q.f && ITEMI[q.f] && ITEMI[q.f].tf) {
    const tm = scaleMod(ITEMI[q.f].tf.m, q.ft || 1);
    for (const k in tm) if (!['tag', 'per', 'cellPct', 'cellHp'].includes(k)) put(am, k, tm[k]);
  }
  ab.n++;
}
const AB_K = ['crit', 'burn', 'poison', 'bleed', 'sunder', 'ls', 'weak', 'blind'];
function absorbAll(run) {
  const out = [];
  for (const o of run.bag.items) {
    const tags = ITEMI[o.id].absorb && [ITEMI[o.id].absorb].flat();
    if (!tags) continue;
    for (const q of run.bag.items.filter(q => q !== o && !ITEMI[q.id].core && ITEMI[q.id].dmg && !ITEMI[q.id].absorb)) {
      if (!tags.some(t => ITEMI[q.id].tags.includes(t)) || !adjacent(o, q)) continue;
      absorbInto(o, q);
      run.bag.items = run.bag.items.filter(x => x !== q);
      out.push(o);
    }
  }
  return out;
}
/* 0.1.34 一件道具的定義＋融入它的第二個核心（sc，4-4 首領選的第二個專屬核心；舊存檔可能是副核心） */
const defsOf = o => (o.sc && ITEMI[o.sc] ? [ITEMI[o.id], ITEMI[o.sc]] : [ITEMI[o.id]]);
/* 背包裡某個核心效果的最大值（例如 freeRoll、bribe、defX），融入的也算 */
const coreProp = (its, k) => Math.max(0, ...its.flatMap(o => defsOf(o).map(d => d[k] || 0)));
/* 賣價：融合過的連輔助一起算；0.1.35 回扣送的（z）賣 0 金 */
/* 0.1.54 狂風市集：這回合買的（o.bt 是買的回合）賣 0 金，不然買了馬上賣掉等於免費刷新商店 */
/* 0.1.59 pp：買的時候付得比賣價少（六合彩打亂成 0 金、1 金的高星）就記下付了多少，賣價最多是那麼多，不然 0 金買、馬上賣掉白賺 */
function sellO(o, run) {
  if (o.z) return 0;
  const v = Math.min(o.pp ?? Infinity, sellOf(o.id, o.t) + (o.f && ITEMI[o.f] ? sellOf(o.f, o.ft || 1) : 0)),
    H = run ? modeH(run) : {};
  return H.sell ? H.sell(run, o, v) : v;
}
/* 融合過的名字 */
/* 0.1.100 巨人國改造過的名字前面多一個字 */
const MD_PRE = { shrink: '小・', grow: '巨・', chisel: '鑿・' };
const fuName = o => (MD_PRE[o.md] || '') + (o.f && ITEMI[o.f] ? ITEMI[o.f].tf.n + '・' : '') + ITEMI[o.id].n;
/* 質變後的標籤（原本的＋質變多的） */
function tagsWith(o, tfm) {
  const s = tfm.get(o.u),
    I = ITEMI[o.id];
  return s && ITEMI[s.id].tf.add ? [...ITEMI[s.id].tf.add, ...I.tags] : I.tags;
}
/* ================= 0.1.96 羈絆（七宗罪） ================= */
/* 每一組幾件（只算背包，核心不算）：道具的宗罪（it.sins，5★ 兩組）各算 1 件；星座本身算它那一組。tg 留著不用（舊介面） */
function synCount(bag, tg) {
  const n = SYN.map(() => 0),
    hitOf = o => SYN.map(x => (ITEMI[o.id].sins || []).includes(x.k));
  for (const o of bag.items) {
    const I = ITEMI[o.id];
    if (!I || I.core) continue;
    hitOf(o).forEach((h, i) => h && n[i]++);
  }
  return n;
}
/* 0.1.69 羈絆的件數、級數、效果倍率（戰鬥和畫面共用）：塔羅的力量（多算 1 件）、世界（多算 2 件）、力量逆位（只有最多的那系、×2） */
function synView(bag, tg) {
  const mx = synMax(bag),
    n = mx ? synCount(bag, tg) : SYN.map(() => 0),
    raw = [...n],
    gi = SYNI.greed,
    gl = synLv(raw[gi], mx),
    wild = [];
  /* 0.1.96 貪婪 2 件・萬能牌：每件貪婪也算件數最多的另一組 1 件；8 件同時算最多的兩組（件數一樣看排在前面的） */
  if (gl) {
    const ord = raw
      .map((c, i) => [c, i])
      .filter(([c, i]) => i !== gi && c > 0)
      .sort((x, y) => y[0] - x[0] || x[1] - y[1]);
    for (const [, i] of ord.slice(0, gl >= 4 ? 2 : 1)) (n[i] += raw[gi]), wild.push(i);
  }
  return { n, lv: n.map(c => synLv(c, mx)), mx, wild };
}
/* 0.1.96 羈絆最多開到幾級：七宗罪賽制（bag.sin）5 級，其他賽制沒有羈絆 */
const synMax = bag => (bag.sin ? SYN_AT.length : 0);
/* 0.1.96 黃道十二宮・星河：同一排或同一行、中間沒有別的星座的一對星座之間是一條河（緊貼的不算）；
   回傳 [{ a, b（兩端的星座）, cells（河經過的格子）, us（河裡的道具 u） }] */
function rivers(bag) {
  const zs = bag.items.filter(o => ITEMI[o.id] && ITEMI[o.id].zod);
  if (zs.length < 2) return [];
  const g = bagGrid(bag),
    at = new Map(zs.map(z => [cellsOf(z)[0] + '', z])),
    out = [];
  for (const z of zs) {
    const [x, y] = cellsOf(z)[0];
    for (const [dx, dy] of [
      [1, 0],
      [0, 1]
    ]) {
      const cells = [];
      for (let k = 1; x + dx * k < bag.w && y + dy * k < bag.h; k++) {
        const c = [x + dx * k, y + dy * k],
          o = at.get(c + '');
        if (o) {
          if (cells.length)
            out.push({
              a: z,
              b: o,
              cells,
              us: [...new Set(cells.map(([px, py]) => g[py][px]).filter(u => u != null))]
            });
          break;
        }
        cells.push(c);
      }
    }
  }
  return out;
}
/* 0.1.69 棋子影響到哪些道具：Map(棋子 u → [道具 u…])。棋子是 1 格（看它的左上角那格）；
   ray 每個方向碰到的第一件（會被擋），jump 跳到的格子上的道具 */
function pcTargets(bag) {
  const out = new Map(),
    ps = bag.items.filter(o => ITEMI[o.id] && ITEMI[o.id].pc);
  if (!ps.length) return out;
  const g = bagGrid(bag),
    at = (x, y) => (x >= 0 && y >= 0 && x < bag.w && y < bag.h ? g[y][x] : undefined);
  for (const p of ps) {
    const D = PC_DIR[ITEMI[p.id].pc.k] || {},
      [px, py] = cellsOf(p)[0],
      us = new Set();
    for (const [dx, dy] of D.ray || [])
      for (let k = 1; k < 9; k++) {
        const u = at(px + dx * k, py + dy * k);
        if (u === undefined) break;
        if (u != null && u !== p.u) {
          us.add(u);
          break;
        }
      }
    for (const [dx, dy] of D.jump || []) {
      const u = at(px + dx, py + dy);
      if (u != null && u !== p.u) us.add(u);
    }
    out.set(p.u, [...us]);
  }
  return out;
}
/* ================= 合成 ================= */
/* 0.1.35 合成要幾件：二天一流（merge2）讓那個標籤的道具 2 件就合成 */
const merge2Of = its => {
  for (const o of its) if (o) for (const d of defsOf(o)) if (d.merge2) return d.merge2;
  return null;
};
/* 0.1.69 塔羅・魔術師：t 是 '*'（全部道具 2 件就合成） */
function mergeNeed(its, id, t = merge2Of(its)) {
  return t && (t === '*' || ITEMI[id].tags.includes(t)) && !ITEMI[id].absorb ? 2 : 3;
}
/* 背包＋暫存區裡，同一種同一階的湊滿 3 件就合成（可能連鎖）；r 是亂數（詞綴） */
function mergeAll(run, r) {
  const done = [],
    early = coreProp(bagAll(run.bag), 'early'),
    /* 0.1.37 再生藥劑：生命藥水 Ⅱ 階就開詞綴 */
    earlyPot = coreProp(bagAll(run.bag), 'earlyPot');
  for (let guard = 0; guard < 20; guard++) {
    const all = [
        ...run.bag.items.map(o => ['bag', o]),
        ...run.bench.filter(Boolean).map(o => ['bench', o]),
        ...(run.bag.st || []).map(o => ['st', o])
      ],
      key = {};
    for (const [w, o] of all) (key[o.id + '|' + o.t] = key[o.id + '|' + o.t] || []).push([w, o]);
    const m2 = run.bag.tar === 'magician' ? '*' : merge2Of([...all.map(([, o]) => o), run.bag.core]),
      need = id => mergeNeed(null, id, m2),
      /* 0.1.103 食物不升階 */
      hit = Object.values(key).find(l => l.length >= need(l[0][1].id) && l[0][1].t < TIER_MAX && !ITEMI[l[0][1].id].fk);
    if (!hit) break;
    const use = hit.slice(0, need(hit[0][1].id)),
      keep = use.find(([w]) => w === 'bag') || use[0],
      o = keep[1],
      /* 0.1.59 材料有便宜買來的（pp）：合成後的賣價最多是材料的賣價加起來 */
      pp = use.some(([, q]) => q.pp != null) ? use.reduce((n, [, q]) => n + sellO(q), 0) : null;
    for (const [w, q] of use) {
      if (q === o) continue;
      if (w === 'bag') run.bag.items = run.bag.items.filter(x => x !== q);
      else if (w === 'st') run.bag.st = run.bag.st.filter(x => x !== q);
      else run.bench[run.bench.indexOf(q)] = null;
      if (run.mdq) run.mdq = run.mdq.filter(x => x.u !== q.u);
    }
    /* 0.1.69 塔羅・女祭司：合成直接升兩階 */
    o.t = Math.min(TIER_MAX, o.t + (run.bag.tar === 'priestess' ? 2 : 1));
    if (pp != null) o.pp = pp;
    o.a = affOf(o.id, r);
    /* 5★ 合成：留三件裡開得最好的那條詞綴 */
    const ms = use.map(([, q]) => q.m).filter(Boolean);
    if (ms.length) o.m = ms.sort((x, y) => mod5Q(y) - mod5Q(x))[0];
    /* 0.1.35 回扣送的（賣價 0）：全部都是送的才保留 */
    o.z = use.every(([, q]) => q.z) ? 1 : 0;
    /* 0.1.8 升到 Ⅲ 階也開一條隨機詞綴（5★ 已經有一條的話就是第二條）；0.1.35 精品：Ⅱ 階就開 */
    /* 0.1.69 塔羅・星星逆位：合成出來的道具開一條隨機詞綴 */
    if (
      o.t === TIER_MAX ||
      run.bag.tar === 'star_r' ||
      ((early || (earlyPot && ITEMI[o.id].pot)) && o.t === 2 && !o.m)
    ) {
      if (!o.m) (o.m = roll5(o.id, r)), (o.mv = 0);
      else if (!o.m2) (o.m2 = roll5(o.id, r)), (o.mv2 = 0);
    }
    /* 0.1.28 三件裡有融合過的：留星級最高的那個融合 */
    const fu = use
      .map(([, q]) => q)
      .filter(q => q.f)
      .sort((x, y) => tfRank({ id: y.f, t: y.ft || 1 }) - tfRank({ id: x.f, t: x.ft || 1 }))[0];
    if (fu) (o.f = fu.f), (o.ft = fu.ft);
    /* 0.1.100 巨人國的改造：三件不一樣時玩家選（run.mdq 排隊，畫面跳出來選，沒改造也是一個選項），機器人直接選戰力最高的 */
    const mds = [
      ...new Map(use.map(([, q]) => [(q.md || '') + '|' + (q.sh || ''), { md: q.md || 0, sh: q.sh || 0 }])).values()
    ];
    if (mds.length > 1) {
      if (run.auto) {
        const P = BOT_P,
          pw = m => {
            const t = {
                ...run,
                bag: { ...run.bag, items: run.bag.items.map(q => (q === o ? { ...q } : q)) },
                bench: [...run.bench]
              },
              c = t.bag.items.find(q => q.u === o.u);
            if (c) mdSet(t, c, m.md, m.sh);
            return botPowerOf(t.bag, P);
          },
          best = mds.map(m => [m, pw(m)]).sort((x, y) => y[1] - x[1])[0][0];
        mdSet(run, o, best.md, best.sh);
      } else (run.mdq = run.mdq || []).push({ u: o.u, o: mds });
    }
    /* 0.1.53 馴獸師的成長：留三件裡最高的 */
    const gw = Math.max(0, ...use.map(([, q]) => q.gw || 0));
    if (gw) o.gw = gw;
    /* 0.1.59 詛咒寶藏：材料裡有幾件被詛咒就疊幾層（最多 CURSE_MAX）；詛咒不一樣時留最多的那種 */
    /* 0.1.60 祝福也一樣疊 */
    for (const f of ['cu', 'bl']) {
      const cus = use.map(([, q]) => q[f]).filter(Boolean);
      if (!cus.length) continue;
      const n = {};
      for (const c of cus) n[c[0]] = (n[c[0]] || 0) + c[1];
      const k = +Object.keys(n).sort((a, b) => n[b] - n[a])[0];
      o[f] = [
        k,
        Math.min(
          CURSE_MAX,
          cus.reduce((a, c) => a + c[1], 0)
        )
      ];
    }
    done.push(o);
  }
  done.fused = fuseAll(run);
  syncShrink(run);
  return done;
}
/* ================= 戰鬥數值 ================= */
/* 把背包算成戰鬥用的角色：hp、護甲、武器（含所有加成）、盾、藥水… */
function compileBag(bag, extra = {}) {
  const its = bagAll(bag),
    F = {
      hp: BASE_HP,
      arm: 0,
      dodge: 0,
      regen: 0,
      ls: 0,
      critMul: 160,
      take: 0,
      potMul: 0,
      potUse: 0,
      weapons: [],
      shields: [],
      pots: [],
      pre: [],
      throwPct: 0,
      /* 0.1.10 核心的新機制 */
      opener: 0,
      execute: 0,
      rage: 0,
      ramp: 0,
      startBlock: 0,
      double: 0,
      thornsF: 0,
      critHeal: 0,
      /* 0.1.18 開戰爆發（rush）：開頭幾秒攻速提升（血祭）；取最高的加成、秒數相加 */
      rushP: 0,
      rushT: 0,
      /* 0.1.28 反制寵物：敵人寵物傷害 -%、敵人每隻寵物你的傷害 +% */
      petDown: 0,
      petHunt: 0,
      /* 0.1.33 核心新機制 */
      openDbl: 0,
      firstStrike: 0,
      armDmg: 0,
      /* 0.1.35 招架（被攻擊時的格擋機率、第一次格擋後的護甲）、連鎖追擊、開戰免異常、背水攻速 */
      parry: 0,
      parryArm: 0,
      triple: 0,
      immT: 0,
      rageSpd: 0,
      /* 0.1.35 開戰時身上的金幣（金錢標每次攻擊花 1 金） */
      gold: bag.gp || 0,
      /* 0.1.29 抗異常（%）、開戰免毒秒數、淨化、減敵人回復、減暴擊 */
      rBurn: 0,
      rPoison: 0,
      rBleed: 0,
      rSunder: 0,
      rFreeze: 0,
      rStun: 0,
      rWeak: 0,
      rBlind: 0,
      poisonImm: 0,
      cleanse: 0,
      healCut: 0,
      critRes: 0,
      /* 0.1.37 異常重製：中毒／劇毒上限、劇毒滿層轉換、以毒為生、每 N 秒腐蝕、毒刺中毒、免疫、碎冰、陷阱、時段加成、萬能藥 */
      poisonCap: 0,
      venomCap: 0,
      p2v: 0,
      poisonLife: 0,
      corrodeRe: 0,
      thornsP: 0,
      immAll: 0,
      immFz: 0,
      shatterF: 0,
      shatterS: 0,
      traps: [],
      phase: [],
      potBuff: null,
      /* 0.1.50 弓箭手（插箭、爆裂箭、箭雨、倒鉤、狙擊、連珠、游擊）、亞馬遜（召喚、復活、連攜、戰舞、反擊、血獵、日月、浴血） */
      arrowPct: 0,
      arrowCap: 0,
      boom: 0,
      rain: 0,
      barb: 0,
      critArrow: 0,
      streak: 0,
      kite: 0,
      summon: 0,
      revive: 0,
      /* 0.1.59 法老王的遺物・安卡：倒下時復活的生命 % */
      ankh: 0,
      link3: 0,
      link: 0,
      counter: 0,
      huntCrit: 0,
      huntHeal: 0,
      sunmoon: 0,
      fury: 0,
      rendX: 0,
      /* 0.1.51 火法師（點燃）、雷法師（電荷、放電、麻痺） */
      igniteAt: 0,
      spark: 0,
      flash: 0,
      meteor: 0,
      burnout: 0,
      selfBurn: 0,
      avatar: 0,
      igniteStart: 0,
      combust: 0,
      burnLeech: 0,
      heat: 0,
      thornsBurn: 0,
      phoenix: 0,
      palsy: 0,
      overload: 0,
      thunderGod: 0,
      cloud: 0,
      zapSpd: 0,
      stunCharge: 0,
      emp: 0,
      zapIgnite: 0,
      static: 0,
      rod: 0,
      zapPct: 0,
      /* 0.1.52 印記的等級（0～3） */
      sgMight: 0,
      sgSwift: 0,
      sgGuard: 0,
      sgLife: 0,
      sgLuck: 0,
      /* 0.1.69 塔羅：反彈受到的傷害 %、複製敵人武器 %、閃開幾次、生命比對手高時減傷 %、低血加傷 % */
      tarRefl: 0,
      tarCopy: 0,
      tarMiss: 0,
      tarHi: 0,
      tarLow: 0,
      /* 0.1.53 馴獸師 */
      petGrow: 0,
      petNoThorns: 0,
      wolves: 0,
      alpha: 0,
      giant: 0,
      pack: 0,
      petGuard: 0,
      pounce: 0,
      frenzy: 0,
      whip: 0,
      symHeal: 0,
      dr: 0,
      /* 0.1.74 狂戰士：狂血、諸神黃昏、不死之怒、血祭（開戰扣血 %）、擲斧（背包幾把斧）、血泉、處刑看撕裂、戰意沸騰、嗜血護甲 */
      blood: 0,
      ragna: 0,
      undying: 0,
      selfCut: 0,
      axeThrow: 0,
      axeN: 0,
      rendLeech: 0,
      execRend: 0,
      bzFury: 0,
      lsShield: 0,
      /* 0.1.101 覺醒／質變：半血化身女武神、第二次涅槃、火鳥、凍結得護盾、黃昏加倍、開戰黃昏扣血、蛻皮、連擊疊異常、
         連鎖傷害與電荷、投擲藥劑、喝藥水帶動相鄰武器（藥水 u → 武器 u）、英靈殿的傷害 */
      valkAt: 0,
      phx2: 0,
      bird: 0,
      fzBlk: 0,
      ragX: 0,
      rag0: 0,
      molt: 0,
      dblDot: 0,
      chainPct: 0,
      chainChg: 0,
      potThrow: 0,
      potAdj: null,
      valhalla: 0,
      /* 0.1.37 格子：每件道具佔哪幾格（敵人的陷阱放在格子上） */
      grid: { w: bag.w, h: bag.h, at: Object.fromEntries(bag.items.map(o => [o.u, cellsOf(o)])) },
      /* 0.1.40 角色加成的來源：{ 加成: [道具 u…] } */
      src: {},
      ...extra
    };
  /* 0.1.53 獸群召喚：先放 N 隻看不見的戰狼（不在格子上，吃寵物的加成；開戰後每 WOLF_T 秒解封一隻），階數跟背包裡最高階的寵物一樣 */
  const WN = Math.max(0, ...its.flatMap(o => defsOf(o).map(d => (d.fx && d.fx.wolves) || 0)));
  if (WN) {
    const wt = Math.max(1, ...bag.items.filter(o => ITEMI[o.id].tags.includes('pet')).map(o => o.t));
    for (let k = 0; k < WN; k++) its.push({ u: 'wv' + k, id: 'wolf', t: wt, x: -1, y: -1, r: 0, vw: k + 1 });
  }
  /* 先收集每件身上的加成 */
  const mods = new Map(its.map(o => [o.u, {}]));
  const add = (o, m, mul = 1) => {
    const t = mods.get(o.u);
    for (const k in m) if (k !== 'tag' && k !== 'per') t[k] = (t[k] || 0) + m[k] * mul;
  };
  /* 0.1.20 相鄰與同一排先用格子表算好（原本每一對都重算一次格子，機器人評估時太慢） */
  const NB = new Map(),
    RW = new Map();
  const NBQ = I =>
    I.adj ||
    I.row ||
    I.tf ||
    I.perAdj ||
    I.perAdjF ||
    I.hole ||
    I.gear ||
    I.chainAdj ||
    I.conduct ||
    I.bladeDrv ||
    I.potAdj;
  if (its.some(o => NBQ(ITEMI[o.id]) || o.cu || o.bl)) {
    const g = bagGrid(bag);
    for (const o of bag.items) {
      const cs = cellsOf(o),
        nb = new Set();
      for (const [x, y] of cs)
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1]
        ]) {
          const u = g[y + dy] && g[y + dy][x + dx];
          if (u != null && u !== o.u) nb.add(u);
        }
      NB.set(o.u, nb);
      RW.set(o.u, new Set(cs.map(p => p[1])));
    }
  }
  /* 0.1.42 核心欄的核心不在格子裡：不算相鄰、同一排 */
  const adjQ = (s, q) => !!NB.get(s.u) && NB.get(s.u).has(q.u),
    rowQ = (s, q) => !!RW.get(s.u) && !!RW.get(q.u) && [...RW.get(s.u)].some(y => RW.get(q.u).has(y));
  /* 0.1.33 鐵甲戰士：防具、盾的效果 ×defX */
  const defX = Math.max(1, coreProp(its, 'defX')),
    isDef = I => I.tags.includes('armor') || I.tags.includes('shield');
  /* 0.1.28 質變：先決定誰被質變（標籤會變，後面的加成都看質變後的標籤） */
  const tfm = tfOf(its, adjQ),
    TG = new Map(its.map(o => [o.u, tagsWith(o, tfm)])),
    has = (o, tag) => TG.get(o.u).includes(tag),
    cnt = tag => its.filter(o => !o.vw && has(o, tag)).length;
  for (const [u, s] of tfm) add({ u }, scaleMod(ITEMI[s.id].tf.m, s.t));
  /* 0.1.35 鈔能力：照開戰時的金幣，所有武器加成、開戰護盾與封鎖 */
  /* 0.1.101 富可敵國：前三級的門檻 +10 金，120 金以上每多 20 金再升一級（傷害、攻速各 +5%，最多 10 級） */
  const GP = bag.gp || 0,
    RX = coreProp(its, 'richX'),
    RB0 = coreProp(its, 'rich') ? richOf(RX && GP < 120 ? GP - 10 : GP) : null,
    RL = RX && GP >= 120 ? Math.min(10, fl((GP - 120) / 20)) : 0,
    RB = RB0 && RL ? { ...RB0, dmgPct: RB0.dmgPct + 5 * RL, spd: RB0.spd + 5 * RL } : RB0;
  if (RB) {
    const ru = its.find(o => defsOf(o).some(d => d.rich)).u;
    for (const q of its) if (has(q, 'weapon')) add(q, { dmgPct: RB.dmgPct || 0, spd: RB.spd || 0, crit: RB.crit || 0 });
    F.startBlock += RB.startBlock || 0;
    if (RB.seal) F.pre.push({ u: ru, k: 'seal', v: RB.seal });
    if (RB.sealAll) F.pre.push({ u: ru, k: 'sealAll', v: RB.sealAll });
    /* 0.1.74 120 金：免疫所有異常 */
    if (RB.immAll) F.immAll += 1;
  }
  for (const s of its) {
    const S0 = ITEMI[s.id];
    const give = (list, test) => {
      for (const b0 of list || []) {
        const b = scaleMod(b0, s.t),
          /* 0.1.100 縮小、放大過的道具，給別人的加成也照倍率 */
          mul = (b.per ? cnt(b.per) : 1) * mdK(s);
        for (const q of its) if (q !== s && test(q) && (b.tag === '*' || has(q, b.tag))) add(q, b, mul);
      }
    };
    if (S0.adj) give(S0.adj, q => adjQ(s, q));
    if (S0.row) give(S0.row, q => rowQ(s, q));
    give(S0.all, () => true);
    if (S0.fx) {
      const f = fxT(S0, s.t);
      for (const k in f) F[k] += f[k];
      /* 0.1.40 這件給了哪些角色加成（戰鬥中照這個記觸發次數） */
      for (const k in f) (F.src[k] = F.src[k] || []).push(s.u);
    }
    if (S0.pre) (F.src.pre = F.src.pre || []).push(s.u);
    /* 0.1.33 方陣：背包裡每有 1 件某標籤，角色加成 */
    for (const b of S0.fxPer || []) for (const k in b) if (k !== 'tag') F[k] += b[k] * cnt(b.tag);
    /* 0.1.33 賄賂：開戰前付過錢（bag.pay）才有效 */
    if (S0.bribe && bag.pay) F.pre.push({ u: s.u, k: 'lockBest', v: MAX_T });
    coreFx(F, S0, s.u);
    /* 0.1.29 融入專屬核心的副核心（sc）：效果跟副核心本身一樣，不佔格子 */
    /* 融入的第二個核心：全背包加成、角色加成、每件某標籤的加成、開戰效果、賄賂都算 */
    const X = s.sc && ITEMI[s.sc];
    if (X) {
      give(X.all, () => true);
      if (X.fx) {
        const f = fxT(X, 1);
        for (const k in f) F[k] += f[k];
      }
      for (const b of X.fxPer || []) for (const k in b) if (k !== 'tag') F[k] += b[k] * cnt(b.tag);
      if (X.pre) F.pre.push({ u: s.u, k: preKey(X.pre), v: preVal(s.sc, 1) });
      if (X.bribe && bag.pay && !S0.bribe) F.pre.push({ u: s.u, k: 'lockBest', v: MAX_T });
      coreFx(F, X, s.u);
    }
    if (s.a) {
      const a = AFFX.find(x => x.k === s.a);
      if (a.k === 'hp') F.hp += a.v;
      else add(s, { [a.k]: a.v });
    }
    /* 0.1.5 5★ 的隨機詞綴 */
    for (const mm of [s.m, s.m2])
      if (mm && MOD5[mm[0]]) {
        const x = MOD5[mm[0]];
        if (x.F) F[x.k] += mm[1];
        else add(s, { [x.k]: mm[1] });
      }
  }
  /* 0.1.50 姊妹盟約：背包裡矛和弓、弩一樣多（至少各 1 件）時，所有武器傷害、攻速提升 */
  const SI = its.map(o => defsOf(o).find(d => d.sisters)).find(Boolean);
  if (SI) {
    const ns = cnt('spear'),
      nb = its.filter(o => has(o, 'bow') || has(o, 'xbow')).length;
    if (ns && ns === nb) {
      for (const q of its) if (has(q, 'weapon')) add(q, { dmgPct: SI.sisters[0], spd: SI.sisters[1] });
      (F.src.sisters = F.src.sisters || []).push(its.find(o => defsOf(o).some(d => d.sisters)).u);
    }
  }
  /* 0.1.101 覺醒／質變（核心）：照背包內容加成 */
  const cv = k => coreProp(its, k),
    blades = its.filter(o => !o.vw && (has(o, 'sword') || has(o, 'spear'))).length;
  if (cv('kitePer')) F.kite += Math.min(60, cv('kitePer') * bag.items.filter(o => ITEMI[o.id].dodge).length);
  if (cv('perBlade')) (F.double += Math.min(40, cv('perBlade') * blades)), (F.triple += Math.min(16, 2 * blades));
  if (cv('revShield')) F.revive += cv('revShield') * cnt('shield');
  if (cv('iceBlk')) F.startBlock += cv('iceBlk') * cnt('cold');
  if (cv('thPer')) F.thornsP += cv('thPer') * cnt('poison');
  if (cv('armPer')) F.arm += cv('armPer') * (cnt('armor') + cnt('shield'));
  if (cv('chainPer')) F.chainPct += cv('chainPer') * cnt('light');
  if (cv('chainChg')) F.chainChg = 1;
  /* 永恆黃昏：一樣會發動諸神黃昏（時間、吸血在 sim 看 ragX） */
  if (F.ragX) F.ragna = Math.max(F.ragna, 1);
  if (cv('potThrow')) F.potThrow = cv('potThrow');
  if (cv('spendUp') && bag.sp)
    for (const q of its) if (has(q, 'weapon')) add(q, { dmgPct: fl(bag.sp / cv('spendUp')) });
  /* 導電：雷系武器旁邊的非雷系武器命中加電荷、傷害提升 */
  if (cv('conduct'))
    for (const s of bag.items)
      if (ITEMI[s.id].dmg && has(s, 'light'))
        for (const q of bag.items)
          if (q !== s && ITEMI[q.id].dmg && !has(q, 'light') && adjQ(s, q))
            add(q, { charge: 1, dmgPct: cv('conduct') });
  /* 藥劑大師：每瓶藥水相鄰的武器 */
  if (cv('potAdj')) {
    F.potAdj = {};
    for (const p of bag.items)
      if (ITEMI[p.id].pot) F.potAdj[p.u] = bag.items.filter(q => ITEMI[q.id].dmg && adjQ(p, q)).map(q => q.u);
  }
  /* 0.1.62 主題道具：self（這件自己）、perAdj／perAdjF（每有 1 件相鄰道具）、hole（巨人國：凹口裡的道具）、
     gear（機關城齒輪：相鄰武器出手時其他相鄰武器充能）、chainAdj（連鎖機關：相鄰武器出手時帶動另一件相鄰武器） */
  const GEAR = new Map(),
    DRV = new Map();
  let GR = null;
  for (const o of bag.items) {
    const I = ITEMI[o.id];
    if (I.self) add(o, scaleMod(I.self, o.t));
    const nn = NB.get(o.u) ? NB.get(o.u).size : 0;
    if (I.perAdj && nn) add(o, scaleMod(I.perAdj, o.t), nn);
    if (I.perAdjF && nn) {
      const f = scaleMod(I.perAdjF, o.t);
      for (const k in f) F[k] = (F[k] || 0) + f[k] * nn;
    }
    /* 0.1.100 凹口照類別：吃得到的才加（放大、鑿子做出來的凹口也算） */
    const hm = holeMod(o);
    if (hm) {
      GR = GR || bagGrid(bag);
      for (const [x, y] of holeOf(o)) {
        const u = GR[y] && GR[y][x];
        const q = u != null && bag.items.find(z => z.u === u);
        if (q && q !== o && holeFits(hm, TG.get(q.u))) add(q, scaleMod(hm, o.t));
      }
    }
    if (I.gear || I.chainAdj) {
      const ws = bag.items.filter(q => q !== o && ITEMI[q.id].dmg && adjQ(o, q)).map(q => q.u);
      for (const u of ws) {
        const others = ws.filter(v => v !== u);
        if (!others.length) continue;
        if (I.gear) {
          const g = GEAR.get(u) || { us: [], p: 0 };
          g.us = [...new Set([...g.us, ...others])];
          g.p += gearV(I, o.t);
          GEAR.set(u, g);
        }
        if (I.chainAdj) DRV.set(u, [...new Set([...(DRV.get(u) || []), ...others])]);
      }
    }
  }
  /* 0.1.101 刀陣輪舞：匕首出手時帶動一把相鄰的匕首（跟連鎖機關一樣，每把每秒一次） */
  if (cv('bladeDrv'))
    for (const o of bag.items) {
      if (!ITEMI[o.id].dmg || !has(o, 'dagger')) continue;
      const nb = bag.items.filter(q => q !== o && ITEMI[q.id].dmg && has(q, 'dagger') && adjQ(o, q)).map(q => q.u);
      if (nb.length) DRV.set(o.u, [...new Set([...(DRV.get(o.u) || []), ...nb])]);
    }
  /* 0.1.69 棋盤王國：棋子照走法加成碰到的道具；被影響的棋盤武器（pcHit）每個棋子再加成 */
  const PCH = pcTargets(bag);
  for (const [pu, us] of PCH) {
    const p = bag.items.find(o => o.u === pu),
      m = scaleMod(ITEMI[p.id].pc.m, p.t);
    for (const u of us) {
      const q = bag.items.find(o => o.u === u);
      add(q, m);
      if (ITEMI[q.id].pcHit) add(q, scaleMod(ITEMI[q.id].pcHit, q.t));
    }
  }
  /* 0.1.62 系別羈絆：湊 2／4／6 件，效果累加；m 給那一系的道具、F 給角色 */
  /* 0.1.69 塔羅（bag.tar）：力量（門檻 -1＝多算 1 件）、世界（多算 2 件）、力量逆位（只有最多的那系、效果 ×2）、世界逆位（每個門檻加成武器） */
  const TK = bag.tar || '',
    SV = synView(bag, o => TG.get(o.u));
  F.syn = SV.lv;
  /* 0.1.74 每一系湊了幾件、最多開到幾級（機器人估「差幾件到下一個門檻」用） */
  F.synN = SV.n.slice(0, SYN.length);
  F.synMx = SV.mx;
  /* 0.1.96 七宗罪：效果多半在戰鬥裡（sim 看 F.sin）；這裡只記每組幾級、背包階數總和（傲慢的王冠）、餵食加的生命在 bag.hpx */
  F.sin = Object.fromEntries(SYN.map((x, i) => [x.k, F.syn[i]]));
  F.tierSum = bag.items.reduce((a, o) => a + (ITEMI[o.id].core ? 0 : o.t || 1), 0);
  /* 0.1.96 星河：河裡的道具拿到兩端星座的效果（數值直接加、特殊效果記在 ZF 給武器）；黃道武器每在一條河裡變強（synPer） */
  const ZF = new Map(),
    RV = rivers(bag);
  for (const R of RV)
    for (const z of [R.a, R.b]) {
      const Z = ZODS[ITEMI[z.id].zod],
        k = zodMul(z.t);
      for (const u of R.us) {
        const q = bag.items.find(o => o.u === u);
        if (Z.m) add(q, Z.m, k);
        if (Z.f === 'zblk') F.startBlock += Z.v * k;
        else if (Z.f) {
          const f = ZF.get(u) || {};
          f[Z.f] = (f[Z.f] || 0) + Z.v * k;
          ZF.set(u, f);
        }
      }
    }
  for (const o of bag.items)
    if (ITEMI[o.id].synPer) {
      const n = RV.filter(R => R.us.includes(o.u)).length;
      if (n) add(o, scaleMod(ITEMI[o.id].synPer, o.t), n);
    }
  /* 0.1.96 塔羅：力量逆位（武器攻速 -25%）、世界（每種道具類別 +5%）、世界逆位（武器只有一種類別時那類 +40%、攻速 +15%） */
  const KIND = o =>
    [
      'sword',
      'axe',
      'mace',
      'bow',
      'xbow',
      'spear',
      'dagger',
      'staff',
      'pet',
      'shield',
      'armor',
      'potion',
      'trinket'
    ].find(t => has(o, t)) || ITEMI[o.id].tags[0];
  if (TK === 'strength') F.tarStr = 1;
  if (TK === 'strength_r') (F.tarStrR = 1), its.forEach(q => has(q, 'weapon') && add(q, { spd: -25 }));
  if (TK === 'world') {
    const n = new Set(bag.items.filter(o => !ITEMI[o.id].core).map(KIND)).size;
    for (const q of its) if (has(q, 'weapon')) add(q, { dmgPct: 5 * n });
  }
  if (TK === 'world_r') {
    const ws = bag.items.filter(o => has(o, 'weapon'));
    if (ws.length && new Set(ws.map(KIND)).size === 1) for (const q of ws) add(q, { dmgPct: 40, spd: 15 });
  }
  /* 隱者（背包 5 件以下）、隱者逆位（每件）、高塔逆位（最強的一把整場不出手，其他武器 +30%） */
  if (TK === 'hermit' && bag.items.length <= 5) for (const q of its) if (has(q, 'weapon')) add(q, { dmgPct: 50 });
  if (TK === 'hermit_r') for (const q of its) if (has(q, 'weapon')) add(q, { dmgPct: 4 * bag.items.length });
  const towerU =
    TK === 'tower_r'
      ? (
          bag.items
            .filter(o => ITEMI[o.id].dmg && !ITEMI[o.id].block)
            .sort((a, b) => ITEMI[b.id].star * 10 + b.t - (ITEMI[a.id].star * 10 + a.t))[0] || {}
        ).u
      : null;
  if (towerU) for (const q of its) if (q.u !== towerU && has(q, 'weapon')) add(q, { dmgPct: 30 });
  /* 0.1.59 詛咒寶藏：背包裡被詛咒的道具（o.cu = [詛咒, 層數]）；吸金在 bonusGold、沉睡在下面的武器 */
  for (const s of bag.items) {
    /* 0.1.60 祝福 */
    const b = s.bl && BLESS[s.bl[0]];
    if (b) {
      const v = blV(s);
      if (b.k === 'sharp') add(s, { dmgPct: v });
      if (b.k === 'quick') add(s, { spd: v });
      if (b.k === 'keen') add(s, { crit: v });
      if (b.k === 'leech') add(s, { ls: v });
      if (b.k === 'stout') F.hp += v;
      if (b.k === 'rally') for (const q of bag.items) if (q !== s && adjQ(s, q)) add(q, { spd: v });
    }
    const c = s.cu && CURSES[s.cu[0]];
    if (!c) continue;
    const v = cuV(s);
    if (c.k === 'rust') for (const q of bag.items) if (q !== s && adjQ(s, q)) add(q, { spd: -v });
    if (c.k === 'frail') F.hp -= v;
    if (c.k === 'envy')
      for (const q of bag.items) if (q !== s && has(q, 'weapon') && rowQ(s, q)) add(q, { dmgPct: -v });
  }
  /* 0.1.59 法老王的遺物（bag.rel）：看位置的（最上／最下排、角落、中間）、武器件數、復活、沙漏（時段加成）；金面具在 bonusGold */
  if (bag.rel && bag.rel.length) {
    const R = new Set(bag.rel),
      cs = o => cellsOf(o),
      ws = bag.items.filter(o => ITEMI[o.id].dmg);
    for (const o of bag.items) {
      const c = cs(o);
      if (R.has('scarab') && c.some(p => p[1] === bag.h - 1)) add(o, { spd: 25 });
      if (R.has('horus') && c.some(p => p[1] === 0)) add(o, { crit: 20 });
      if (R.has('feather') && c.some(([x, y]) => (x === 0 || x === bag.w - 1) && (y === 0 || y === bag.h - 1)))
        add(o, { dmgPct: 35 });
      if (R.has('pyramid') && c.every(([x, y]) => x > 0 && y > 0 && x < bag.w - 1 && y < bag.h - 1))
        add(o, { spd: 20, dmgPct: 20 });
    }
    if (R.has('scepter') && ws.length <= 3) for (const o of ws) add(o, { dmgPct: 40 });
    if (R.has('ankh')) F.ankh = Math.max(F.ankh || 0, 30);
    if (R.has('sand')) F.phase.push({ t: 8, a: {}, b: { spd: 35 } });
  }
  /* 0.1.7 開局職業：對有那個標籤的道具加成、角色加成 */
  const C = CLSI[bag.cls];
  if (C) {
    for (const b of C.m || []) for (const q of its) if (has(q, b.tag)) add(q, b);
    for (const k in C.F || {}) F[k] = (F[k] || 0) + C.F[k];
    /* 0.1.74 商人職業特性：開戰時的金幣越多，所有武器加成（跟鈔能力相加） */
    const RC = C.F && C.F.richC ? richCOf(bag.gp || 0) : null;
    if (RC) for (const q of its) if (has(q, 'weapon')) add(q, { dmgPct: RC.dmgPct || 0, spd: RC.spd || 0 });
  }
  for (const o of its) {
    const I = ITEMI[o.id],
      dx = isDef(I) ? defX : 1,
      m = mods.get(o.u),
      /* 0.1.100 巨人國：縮小、放大的倍率；凹口的所有數值（allPct）、護甲與生命（defPct） */
      k = TIERM[o.t] * dx * mdK(o) * (1 + (m.allPct || 0) / 100),
      kd = k * (1 + (m.defPct || 0) / 100);
    if (I.hp) F.hp += Math.round(I.hp * kd);
    /* 0.1.37 寒冰之心：跨場累積的生命 */
    if (o.hh) F.hp += o.hh;
    if (I.arm) F.arm += Math.round(I.arm * kd);
    if (I.dodge) F.dodge += Math.round(I.dodge * TIERB[o.t] * dx);
    if (I.regen || m.regen) F.regen += Math.round((I.regen || 0) * k) + (m.regen || 0);
    if (I.regen) (F.src.regen = F.src.regen || []).push(o.u);
    if (m.thornsF) F.thornsF += m.thornsF;
    /* 0.1.29 照格數：巨化的生命 */
    if (m.cellHp) F.hp += m.cellHp * shapeO(o).length;
    if (I.rush) {
      F.rushP = Math.max(F.rushP, Math.round(I.rush[0] * TIERB[o.t]));
      F.rushT += I.rush[1];
    }
    if (I.pre) {
      /* 鍊金術士：丟出去的藥劑（藥水標籤）效果加強 */
      const k = preKey(I.pre),
        boost = I.tags.includes('potion') && F.throwPct ? 1 + F.throwPct / 100 : 1;
      const pb = 1 + (m.preBoost || 0) / 100;
      F.pre.push({
        u: o.u,
        k,
        v: k === 'down' || k === 'petLock' ? preVal(o.id, o.t) : Math.round(preVal(o.id, o.t) * boost * pb)
      });
    }
    if (I.pot)
      F.pots.push({
        u: o.u,
        at: I.pot[0],
        v: Math.round(I.pot[1] * k),
        n: I.pot[2] + (o.t === 3 ? 1 : 0),
        bomb: m.potBomb || 0,
        /* 0.1.37 終極藥劑：煉成選的效果 */
        ...(o.ex ? { ex: o.ex, v: (o.ex || []).includes('heal') ? 0 : Math.round(I.pot[1] * k) } : {})
      });
    if (I.block)
      F.shields.push({
        u: o.u,
        cd: Math.max(0.6, cdT(I, o.t) / (1 + (m.spd || 0) / 100)),
        block: Math.round((I.block * kd + (m.block || 0)) * (1 + (m.blockPct || 0) / 100)),
        thorns: Math.round((I.thorns || 0) * kd),
        heal: Math.round((I.heal || 0) * k) + (m.heal || 0),
        bash: m.bash || 0
      });
    else if (I.dmg) {
      /* 0.1.46 魔劍正宗吸收的詞綴、融合加成 */
      if (o.ab) {
        for (const k in o.ab.am || {}) m[k] = (m[k] || 0) + o.ab.am[k];
        for (const k in o.ab.F || {}) F[k] = (F[k] || 0) + o.ab.F[k];
      }
      const on = onT(I, o.t),
        mul = 1 + ((m.dmgPct || 0) + (m.cellPct || 0) * shapeO(o).length) / 100,
        /* 0.1.35 魔劍正宗吸收的數值（o.ab）當成這把的基礎數值 */
        ab = o.ab || {};
      for (const k of AB_K) if (ab[k]) on[k] = (on[k] || 0) + ab[k];
      for (const k of ['freezeCh', 'stunCh']) if (ab[k]) m[k] = (m[k] || 0) + ab[k];
      F.weapons.push({
        u: o.u,
        id: o.id,
        t: o.t,
        star: I.star,
        pet: has(o, 'pet'),
        el: TG.get(o.u).find(t => ['fire', 'cold', 'light', 'poison', 'dark'].includes(t)) || 'phys',
        cd: Math.max(0.4, cdT(I, o.t) / (1 + (m.spd || 0) / 100)),
        dmg: [
          Math.round((I.dmg[0] * k + (ab.d0 || 0) + (m.dmg || 0)) * mul),
          Math.round((I.dmg[1] * k + (ab.d1 || 0) + (m.dmg || 0)) * mul)
        ],
        crit: on.crit + (m.crit || 0),
        burn: (on.burn || 0) + (m.burn || 0),
        poison: (on.poison || 0) + (m.poison || 0),
        freeze: [(on.freeze ? on.freeze[0] : 0) + (m.freezeCh || 0), on.freeze ? on.freeze[1] : 0.8],
        stun: [(on.stun ? on.stun[0] : 0) + (m.stunCh || 0), on.stun ? on.stun[1] : 0.5],
        ls: (on.ls || 0) + (m.ls || 0),
        bleed: (on.bleed || 0) + (m.bleed || 0),
        sunder: (on.sunder || 0) + (m.sunder || 0),
        weak: (on.weak || 0) + (m.weakCh || 0),
        blind: (on.blind || 0) + (m.blindCh || 0),
        pierce: Math.min(PIERCE_MAX, m.pierce || 0),
        chain: m.chain || 0,
        guard: m.guard || 0,
        chainN: Math.min(CHAIN_MAX, (m.chainN || 0) + (I.chainN || 0)),
        /* 0.1.35 雙手大師：每佔 1 格的連擊機率；金錢標：有錢時每次攻擊花 1 金、數值翻倍 */
        dbl: (m.cellDbl || 0) * shapeO(o).length,
        coin: I.coin ? 1 : 0,
        /* 0.1.37 冰緩機率、劇毒層、命中衰老／腐蝕秒數、冰系（碎冰）、免疫異常與封鎖（別西卜） */
        chill: (on.chill || 0) + (m.chillCh || 0),
        venom: (on.venom || 0) + (m.venom || 0),
        age: on.age || 0,
        corr: on.corrode || 0,
        cold: has(o, 'cold'),
        imm: I.imm ? 1 : 0,
        /* 0.1.50 矛／弓（亞馬遜的連攜、戰舞、日月、浴血看這個）、插箭、多重射擊、狙擊、元素箭袋、必中、插矛、撕裂 */
        kind: has(o, 'spear') ? 'spear' : has(o, 'bow') || has(o, 'xbow') ? 'bow' : '',
        stick: (m.stick || 0) + (I.stick || 0),
        shots: m.shots || 0,
        snipe: m.snipe || 0,
        elem: m.elem ? 1 : 0,
        sure: m.sure ? 1 : 0,
        pin: m.pin || 0,
        rend: m.rend || 0,
        /* 0.1.74 狂戰士：斧、鎚（狂血、戰意沸騰看這個）、撕裂猛擊、碎骨（無視護盾 %） */
        bz: has(o, 'axe') || has(o, 'mace') ? 1 : 0,
        rendEv: m.rendEv || 0,
        shPierce: Math.min(100, m.shPierce || 0),
        /* 0.1.51 電荷 */
        charge: m.charge || 0,
        /* 0.1.96 這件的宗罪（戰鬥裡看這組有沒有開）；星河的特殊效果（牡羊開戰充能、雙子再出手、處女回復、天蠍、摩羯免疫、水瓶） */
        sins: I.sins || [],
        ...(ZF.get(o.u) || {}),
        ...(ZF.get(o.u) && ZF.get(o.u).zimm ? { imm: 1 } : {}),
        /* 0.1.53 召喚的戰狼（第幾隻、開戰封住到幾秒）、馴獸師的成長 */
        ...(o.vw ? { vw: o.vw, seal: o.vw * WOLF_T } : {}),
        /* 0.1.59 詛咒・沉睡：開戰後幾秒才開始出手；0.1.62 雷電砲台（wake）也一樣 */
        ...(o.cu && CURSES[o.cu[0]] && CURSES[o.cu[0]].k === 'sleep'
          ? { seal: cuV(o) }
          : I.wake
            ? { seal: I.wake }
            : {}),
        /* 0.1.62 機關城：每第 N 次出手多打幾下、齒輪、連鎖機關 */
        ...(I.nth ? { nth: I.nth } : {}),
        ...(GEAR.get(o.u) ? { gear: GEAR.get(o.u) } : {}),
        ...(DRV.get(o.u) ? { drv: DRV.get(o.u) } : {}),
        gw: o.gw || 0,
        /* 0.1.53 四兇：吞噬（饕餮）、命中封鎖（窮奇）、隨機異常（混沌） */
        gorge: I.gorge || 0,
        sealHit: I.sealHit || null,
        chaos: I.chaos ? 1 : 0
      });
    }
  }
  /* 0.1.53 馴獸師：成長（每層傷害 +petGrow%）、巨獸化（只有 1～2 隻寵物）、頭狼（星級最高的 ×2、其他 +15%） */
  const pets = F.weapons.filter(w => w.pet && !w.vw),
    mulD = (w, k) => (w.dmg = w.dmg.map(v => Math.round(v * k)));
  if (F.petGrow) for (const w of pets) if (w.gw) mulD(w, 1 + (F.petGrow * Math.min(10, w.gw)) / 100);
  /* 0.1.101 適者生存：Ⅲ 階的寵物傷害提升 */
  if (cv('fitPet')) for (const w of pets) if (w.t >= TIER_MAX) mulD(w, 1 + cv('fitPet') / 100);
  /* 0.1.101 居合：劍、矛每第 N 次出手多打幾下 */
  const IAI = its.flatMap(defsOf).find(d => d.iai);
  if (IAI)
    for (const w of F.weapons)
      if (!w.nth && TG.get(w.u) && TG.get(w.u).some(t => t === 'sword' || t === 'spear')) w.nth = IAI.iai;
  /* 0.1.101 英靈殿：復活時對敵人造成所有盾的格擋值總和 */
  if (cv('valhalla')) F.valhalla = F.shields.reduce((n, x) => n + x.block, 0);
  if (F.giant && pets.length && pets.length <= 2) {
    for (const w of pets) mulD(w, 2.5);
    F.hp += 80;
  }
  if (F.alpha && pets.length) {
    const top = [...pets].sort((x, y) => y.star * 10 + y.t - (x.star * 10 + x.t))[0];
    for (const w of pets) mulD(w, w === top ? 2 : 1.15);
    top.alpha = 1;
  }
  if (TK) tarotF(F, bag, TK, towerU);
  /* 0.1.74 擲斧：背包裡幾把斧 */
  if (F.axeThrow) F.axeN = F.weapons.filter(w => !w.vw && TG.get(w.u) && TG.get(w.u).includes('axe')).length;
  /* 0.1.69 塔羅・死神：獻祭換來的永久生命 */
  if (bag.hpx) F.hp += bag.hpx;
  /* 0.1.33 審判：每把武器的傷害 +護甲值 */
  /* 0.1.101 荊棘鐵壁：護甲全部拿掉，armTh% 變成反彈 */
  if (cv('armTh')) (F.thornsF += Math.round((F.arm * cv('armTh')) / 100)), (F.arm = 0);
  if (F.armDmg && F.arm > 0) for (const w of F.weapons) w.dmg = w.dmg.map(v => v + F.arm);
  if (F.potMul || F.potUse) F.pots.forEach(p => ((p.v = Math.round(p.v * (1 + F.potMul / 100))), (p.n += F.potUse)));
  foodF(F, bag.items);
  F.dodge = Math.min(40, F.dodge);
  /* 0.1.59 詛咒・虛弱疊太多：生命至少 1 */
  F.hp = Math.max(1, F.hp);
  return F;
}
/* 0.1.103 料理：開戰時吃下。同一道只算一份；抗性同一類最多 FOOD_RES、淨化最多 FOOD_CLN 次；招牌效果只有大料理才發動 */
const FOOD_RES = 50,
  FOOD_CLN = 4;
function foodF(F, items) {
  const seen = new Set(),
    s = {},
    sg = new Set();
  for (const o of items) {
    const I = ITEMI[o.id];
    if (!I.fk || seen.has(o.id)) continue;
    seen.add(o.id);
    for (const k in I.fd) s[k] = (s[k] || 0) + I.fd[k];
    if (I.fk === 'big') for (const k of I.sg) sg.add(k);
  }
  if (!seen.size) return;
  /* 觸發次數算到食物上（道具詳細的「上一場觸發 N 次」） */
  const us = items.filter(o => ITEMI[o.id].fk).map(o => o.u),
    src = (F.src = F.src || {});
  for (const k of ['food', 'cleanse', 'rBurn', 'rPoison', 'rBleed', 'rFreeze', 'rStun', 'rWeak', 'rBlind', 'rSunder'])
    src[k] = [...(src[k] || []), ...us];
  if (s.hpP) F.hp = Math.round(F.hp * (1 + s.hpP / 100));
  if (s.dr) F.dr = (F.dr || 0) + s.dr;
  if (s.dodge) F.dodge += s.dodge;
  if (s.regP) F.regen += Math.round(F.hp * s.regP) / 100;
  if (s.rDot) for (const k of ['rBurn', 'rPoison', 'rBleed']) F[k] += Math.min(FOOD_RES, s.rDot);
  if (s.rCtl) for (const k of ['rFreeze', 'rStun', 'rWeak', 'rBlind', 'rSunder']) F[k] += Math.min(FOOD_RES, s.rCtl);
  if (s.cln) F.fdCl = Math.min(FOOD_CLN, s.cln);
  /* 招牌：絞肉護盾、麵團前 3 下減半、魚漿前 2 下閃避、蜂巢低血回復加倍、薄荷醬／咖啡豆開場免疫、醃檸檬淨化回血 */
  if (sg.has('meat')) F.startBlock += Math.round(F.hp * 0.1);
  if (sg.has('bread')) F.fdHalf = 3;
  if (sg.has('fish')) F.fdDg = 2;
  if (sg.has('honey')) F.fdLow = 1;
  if (sg.has('mint')) F.fdDotT = 3;
  if (sg.has('coffee')) F.fdCtlT = 3;
  if (sg.has('lemon')) F.fdClH = 5;
}
/* 0.1.69 塔羅牌陣：武器算好之後才套的（倍率、帶動、開戰效果）；只看背包上的 bag.tar（快照對手也算） */
function tarotF(F, bag, TK, towerU) {
  const ws = F.weapons.filter(w => !w.vw),
    dps = w => (w.dmg[0] + w.dmg[1]) / w.cd,
    top2 = [...ws].sort((a, b) => dps(b) - dps(a)).slice(0, 2),
    mulD = (w, k) => (w.dmg = w.dmg.map(v => Math.round(v * k))),
    spdM = (w, k) => (w.cd = Math.max(0.4, w.cd / k));
  if (TK === 'emperor') {
    const cells = w => shapeO(bag.items.find(o => o.u === w.u) || { id: w.id }).length,
      big = [...ws].sort((a, b) => cells(b) - cells(a) || b.star - a.star)[0];
    if (big) mulD(big, 2);
  }
  if (TK === 'lovers' && top2.length === 2)
    top2.forEach((w, i) => {
      const o = top2[1 - i],
        g = w.gear || { us: [], p: 0 };
      w.gear = { us: [...new Set([...g.us, o.u])], p: g.p + 50 };
    });
  if (TK === 'lovers_r') for (const w of top2) mulD(w, 1.6), spdM(w, 0.8);
  if (TK === 'chariot') (F.rushP = Math.max(F.rushP, 60)), (F.rushT += 4);
  if (TK === 'chariot_r') for (const w of ws) (w.seal = Math.max(w.seal || 0, 3)), spdM(w, 1.35);
  if (TK === 'magician_r') F.opener += 50;
  if (TK === 'temperance') F.regen += Math.round(F.hp * 0.02);
  if (TK === 'temperance_r') for (const w of ws) mulD(w, 1.4), spdM(w, 0.8);
  if (TK === 'devil_r') {
    for (const w of ws) w.ls += 10;
    F.regen = 0;
    for (const p of F.pots) p.v = 0;
  }
  if (TK === 'empress') for (const w of ws) if (w.pet) mulD(w, 1 + (10 + 5 * (bag.tarN || 0)) / 100);
  if (TK === 'empress_r') {
    F.regen = Math.round(F.regen * 1.5);
    for (const p of F.pots) p.v = Math.round(p.v * 1.5);
  }
  if (TK === 'tower_r') for (const w of ws) if (w.u === towerU) w.seal = MAX_T;
  if (TK === 'tower') F.pre.push({ u: (bag.items[0] || {}).u || 'tar', k: 'lockBest', v: 4 });
  if (TK === 'justice') F.tarRefl = 15;
  if (TK === 'moon') F.tarCopy = 50;
  if (TK === 'moon_r') F.tarMiss = 1;
  if (TK === 'sun_r') F.tarHi = 20;
  if (TK === 'judgement_r') F.tarLow = 40;
}
/* 0.1.37 核心的開戰效果：多個開戰效果（pres）、陷阱（traps）、時段加成（phase）、萬能藥（potBuff） */
function coreFx(F, D, u) {
  for (const k in D.pres || {}) F.pre.push({ u, k, v: D.pres[k], ...(k === 'selfV' ? { n: D.selfN || 1 } : {}) });
  for (const t of D.traps || []) F.traps.push({ ...t, u });
  if (D.phase) F.phase.push(D.phase);
  if (D.potBuff) F.potBuff = D.potBuff;
}
/* 給畫面用：每件道具目前吃到的加成（說明裡顯示「＋」） */
function bagMods(bag) {
  const its = bagAll(bag),
    out = new Map(its.map(o => [o.u, []]));
  const tfm = tfOf(its),
    has = (o, tag) => tagsWith(o, tfm).includes(tag),
    cnt = tag => its.filter(o => has(o, tag)).length;
  for (const [u, s] of tfm) out.get(u).push({ from: s.u || 'f', w: 'tf', m: scaleMod(ITEMI[s.id].tf.m, s.t) });
  for (const s of its) {
    const S0 = ITEMI[s.id];
    for (const [w, test] of [
      ['adj', q => q !== bag.core && s !== bag.core && adjacent(s, q)],
      ['row', q => q !== bag.core && s !== bag.core && sameRow(s, q)],
      ['all', () => true]
    ])
      for (const b0 of [...(S0[w] || []), ...(w === 'all' && s.sc && ITEMI[s.sc] ? ITEMI[s.sc].all || [] : [])]) {
        const b = scaleMod(b0, s.t),
          /* 0.1.100 縮小、放大過的道具，給別人的加成也照倍率 */
          mul = (b.per ? cnt(b.per) : 1) * mdK(s);
        for (const q of its)
          if (q !== s && test(q) && (b.tag === '*' || has(q, b.tag))) {
            const m = {};
            for (const k in b) if (k !== 'tag' && k !== 'per') m[k] = b[k] * mul;
            out.get(q.u).push({ from: s.u, w, m });
          }
      }
  }
  /* 0.1.69 主題道具的連線：森林（每件相鄰）、凹口、齒輪／連鎖機關（相鄰的武器）、星座帶到的道具；
     m 是空的只畫線（效果在角色或戰鬥中，不是這件的數值） */
  for (const o of bag.items) {
    const I = ITEMI[o.id];
    if (!(I.perAdj || I.perAdjF || I.gear || I.chainAdj)) continue;
    const nb = bag.items.filter(q => q !== o && adjacent(o, q));
    if (I.perAdj) for (const q of nb) out.get(o.u).push({ from: q.u, w: 'adj', m: scaleMod(I.perAdj, o.t) });
    if (I.perAdjF) for (const q of nb) out.get(q.u).push({ from: o.u, w: 'adj', m: {} });
    if (I.gear || I.chainAdj)
      for (const q of nb) if (ITEMI[q.id].dmg) out.get(q.u).push({ from: o.u, w: 'adj', m: {} });
  }
  for (const o of bag.items) {
    const hm = holeMod(o);
    if (!hm) continue;
    const g = bagGrid(bag);
    for (const [x, y] of holeOf(o)) {
      const u = g[y] && g[y][x],
        q = u != null && u !== o.u && out.has(u) && bag.items.find(z => z.u === u);
      if (q && holeFits(hm, ITEMI[q.id].tags)) out.get(u).push({ from: o.u, w: 'adj', m: scaleMod(hm, o.t) });
    }
  }
  /* 0.1.96 星河：河裡的道具跟兩端的星座連起來（選星座時亮起來、角標 ✶） */
  for (const R of rivers(bag))
    for (const u of R.us) for (const z of [R.a, R.b]) if (out.has(u)) out.get(u).push({ from: z.u, w: 'riv', m: {} });
  /* 0.1.69 棋子影響到的道具（選棋子時亮起來、道具詳細列出加成） */
  for (const [pu, us] of pcTargets(bag)) {
    const p = bag.items.find(o => o.u === pu);
    for (const u of us) {
      const q = bag.items.find(o => o.u === u),
        m = { ...scaleMod(ITEMI[p.id].pc.m, p.t) };
      if (ITEMI[q.id].pcHit)
        for (const [k, v] of Object.entries(scaleMod(ITEMI[q.id].pcHit, q.t))) m[k] = (m[k] || 0) + v;
      out.get(u).push({ from: pu, w: 'pc', m });
    }
  }
  const C = CLSI[bag.cls];
  if (C)
    for (const b of C.m || [])
      for (const q of its)
        if (has(q, b.tag)) {
          const m = {};
          for (const k in b) if (k !== 'tag') m[k] = b[k];
          out.get(q.u).push({ from: 'cls', w: 'cls', m });
        }
  return out;
}
/* 快照用的精簡格式：[id, 階, x, y, 旋轉, 詞綴, 5★ 詞綴, 第二條詞綴, 融合的輔助, 輔助的階, 融入的核心, 少 1 格, 魔劍吸收的數值, 終極藥劑的效果, 寒冰之心的生命, 封印過了幾回合]；
   後面是預設值的就不存。gp：0.1.35 開戰時的金幣（鈔能力、金錢標） */
const PACK_DEF = [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const packIt = o => {
  const a = [o.id, o.t, o.x, o.y, o.r, o.a || 0, o.m || 0],
    /* 0.1.52 最後一格是印記（+1，0 是沒有） */
    t = [
      o.m2 || 0,
      o.f || 0,
      o.ft || 1,
      o.sc || 0,
      o.sm ? 1 : 0,
      o.ab || 0,
      o.ex || 0,
      o.hh || 0,
      o.rc || 0,
      o.sg != null ? o.sg + 1 : 0,
      o.gw || 0,
      /* 0.1.59 七十二變的形狀、詛咒 [詛咒, 層數] */
      o.sh || 0,
      o.cu || 0,
      /* 0.1.60 祝福 [祝福, 層數] */
      o.bl || 0,
      /* 0.1.100 巨人國的改造 */
      o.md || 0
    ];
  while (t.length && t[t.length - 1] === PACK_DEF[t.length - 1]) t.pop();
  return [...a, ...t];
};
/* co：0.1.42 職業核心（不在背包格子裡） */
const packBag = bag => ({
  w: bag.w,
  h: bag.h,
  cls: bag.cls || null,
  ...(bag.pay ? { pay: 1 } : {}),
  ...(bag.gp ? { gp: bag.gp } : {}),
  ...(bag.core ? { co: packIt(bag.core) } : {}),
  /* 0.1.59 法老王的遺物 */
  ...(bag.rel && bag.rel.length ? { rel: [...bag.rel] } : {}),
  /* 0.1.69 塔羅牌陣：戰鬥用的牌（tar）、女皇的回合數（tn） */
  ...(bag.tar && tarOf(bag.tar) && TAROT_FIGHT.includes(tarOf(bag.tar).e.c)
    ? { tar: bag.tar, ...(bag.tarN ? { tn: bag.tarN } : {}) }
    : {}),
  ...(bag.hpx ? { hx: bag.hpx } : {}),
  ...(bag.sin ? { sn: 1 } : {}),
  /* 0.1.101 一擲千金：拿到後花掉的金幣 */
  ...(bag.sp ? { sp: bag.sp } : {}),
  it: bag.items.map(packIt)
});
const unpackIt = (a, u) => ({
  u,
  id: a[0],
  t: a[1],
  x: a[2],
  y: a[3],
  r: a[4],
  a: a[5] || null,
  m: a[6] || null,
  m2: a[7] || null,
  f: a[8] || null,
  ft: a[9] || 1,
  sc: a[10] || null,
  sm: a[11] || 0,
  ab: a[12] || null,
  ex: a[13] || null,
  hh: a[14] || 0,
  rc: a[15] || 0,
  ...(a[16] ? { sg: a[16] - 1 } : {}),
  ...(a[17] ? { gw: a[17] } : {}),
  ...(a[18] && shReg(a[18]) ? { sh: a[18] } : {}),
  ...(a[19] && CURSES[a[19][0]] ? { cu: [a[19][0], a[19][1] || 1] } : {}),
  ...(a[20] && BLESS[a[20][0]] ? { bl: [a[20][0], a[20][1] || 1] } : {}),
  ...(MD_K[a[21]] || a[21] === 'chisel' ? { md: a[21] } : {})
});
const unpackBag = p => ({
  w: p.w,
  h: p.h,
  cls: p.cls || null,
  pay: p.pay || 0,
  gp: p.gp || 0,
  core: p.co && ITEMI[p.co[0]] ? unpackIt(p.co, 'gc') : null,
  rel: (p.rel || []).filter(k => RELICI[k]),
  ...(tarOf(p.tar) ? { tar: p.tar, tarN: p.tn || 0 } : {}),
  ...(p.hx ? { hpx: p.hx } : {}),
  ...(p.sn ? { sin: 1 } : {}),
  ...(p.sp ? { sp: p.sp } : {}),
  items: (p.it || []).filter(a => ITEMI[a[0]]).map((a, i) => unpackIt(a, 'g' + i))
});
/* 0.1.33 長柄大師：背包（含暫存區）裡有 shrink 的核心時，那個標籤的道具少佔 1 格（o.sm）；核心拿掉後放不下的收回暫存區 */
function syncShrink(run) {
  const t = (
    bagAll(run.bag)
      .flatMap(defsOf)
      .find(d => d.shrink) || {}
  ).shrink;
  for (const o of [...run.bag.items, ...run.bench]) {
    if (!o) continue;
    const want = t && ITEMI[o.id].tags.includes(t) && !ITEMI[o.id].core && !o.md ? 1 : 0;
    if ((o.sm || 0) === want) continue;
    o.sm = want;
    if (!want && run.bag.items.includes(o) && !canPlace(run.bag, o, o.x, o.y, o.r)) {
      run.bag.items = run.bag.items.filter(q => q !== o);
      const fi = run.bench.indexOf(null);
      if (fi >= 0) run.bench[fi] = o;
      else run.gold += sellO(o, run);
    }
  }
}
