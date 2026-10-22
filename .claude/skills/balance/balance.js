/* 塞令老師 平衡檢查：在瀏覽器（本機遊戲頁面，網址加 ?p=2）用 javascript_exec 載入：
     eval(await (await fetch('/.claude/skills/balance/balance.js')).text())
   然後：
     coverage()          靜態檢查（馬上出結果）：各體系星級、輔助、異常來源、職業、核心、圖示、說明文字、怪物
     await sims('class') 機器人模擬（分批跑，避免 45 秒逾時；重複呼叫會累積樣本，sims('reset') 清掉）
       'class'  各職業平均名次（LOBBY_N 個機器人一場，公平是 (LOBBY_N + 1) / 2，6 人是 3.5）
       'pve'    野怪／菁英／首領勝率、每個階段的背包格數
       'fair'   用跟對手同強度的機器人代打：對戰勝率（約 50%）、平均名次（約 (LOBBY_N + 1) / 2）、一局幾回合
     report()            把累積的模擬結果整理成表
     itemPower()         單件道具強度：每件放進標準背包，看帶著它能打贏 ×N 倍強的對手（N 越大越強），同星級同類別比較，標出偏強偏弱的
   每個問題前面標 ❌（一定要修）或 ⚠️（看情況）。 */
(() => {
  const W = window;
  /* 0.1.29 一場 LOBBY_N 人：公平的平均名次與偏強偏弱的範圍（4 人時 2.5 ± 0.35） */
  const FAIR = (LOBBY_N + 1) / 2,
    BAND = (0.35 * (LOBBY_N - 1)) / 3;
  /* 體系：主打標籤（武器類看 dmg；防具、盾、藥水另外算） */
  const GROUPS = {
    劍: ['sword'],
    匕首: ['dagger'],
    弓: ['bow'],
    弩: ['xbow'],
    斧: ['axe'],
    鎚: ['mace'],
    槍: ['spear'],
    法杖: ['staff'],
    雙手: ['twohand'],
    火: ['fire'],
    冰: ['cold'],
    雷: ['light'],
    毒: ['poison'],
    暗: ['dark'],
    聖: ['holy'],
    寵物: ['pet']
  };
  /* 異常：武器 on 的欄位、加成（adj/row/all/核心）的欄位、開戰效果的 key */
  const STATUS = {
    燃燒: ['burn', 'burn', 'burn'],
    中毒: ['poison', 'poison', 'poison'],
    流血: ['bleed', 'bleed', 'bleed'],
    破甲: ['sunder', 'sunder', 'sunder'],
    凍結: ['freeze', 'freezeCh', 'frozen'],
    暈眩: ['stun', 'stunCh', null],
    虛弱: ['weak', 'weakCh', 'weak'],
    致盲: ['blind', 'blindCh', 'blind'],
    吸血: ['ls', 'ls', null]
  };
  const items = () => ITEMS.filter(i => !i.core);
  const isW = i => !!i.dmg;
  const hasTag = (i, t) => i.tags.includes(t);
  const mods = i => [...(i.adj || []), ...(i.row || []), ...(i.all || [])];
  /* 一件道具對某個標籤有沒有幫助：for 指定、或加成指向那個標籤 */
  const helps = (i, tags) => tags.includes(i.for) || mods(i).some(m => tags.includes(m.tag));
  const onHas = (i, k) => i.on && (Array.isArray(i.on[k]) ? i.on[k][0] > 0 : i.on[k] > 0);
  const out = [];
  const bad = s => out.push('❌ ' + s),
    warn = s => out.push('⚠️ ' + s),
    line = s => out.push(s);

  W.coverage = function () {
    out.length = 0;
    const IT = items();
    line(`道具 ${IT.length} 種（不含核心），核心 ${ITEMS.length - IT.length} 個，職業 ${CLASSES.length} 個`);
    /* 1. 各體系每個星級的武器數 */
    line('\n## 各體系武器（1★～5★ 的件數）');
    for (const [g, tags] of Object.entries(GROUPS)) {
      const by = [1, 2, 3, 4, 5].map(s => IT.filter(i => isW(i) && i.star === s && tags.some(t => hasTag(i, t))));
      line(`${g}：${by.map((l, k) => `${k + 1}★${l.length}`).join(' ')}　${by.map(l => l.map(i => i.n).join('/') || '—').join('｜')}`);
      const miss = by.map((l, k) => (l.length ? 0 : k + 1)).filter(Boolean);
      if (g !== '雙手' && miss.length) (miss.some(s => s >= 2 && s <= 4) ? bad : warn)(`${g}系缺 ${miss.join('、')}★ 武器`);
    }
    /* 防具、盾、藥水 */
    for (const [g, t] of [['防具', 'armor'], ['盾', 'shield'], ['藥水', 'potion']]) {
      const by = [1, 2, 3, 4, 5].map(s => IT.filter(i => i.star === s && hasTag(i, t)).length);
      line(`${g}：${by.map((n, k) => `${k + 1}★${n}`).join(' ')}`);
      by.forEach((n, k) => !n && warn(`${g}缺 ${k + 1}★`));
    }
    /* 2. 輔助道具 */
    line('\n## 各體系的輔助道具（for 指定或加成指向這個標籤，不含武器本身）');
    for (const [g, tags] of Object.entries(GROUPS)) {
      const sup = IT.filter(i => !isW(i) && helps(i, tags));
      line(`${g}：${sup.length} 件　${sup.map(i => `${i.n}${i.star}★`).join('、') || '—'}`);
      if (!sup.length) bad(`${g}系沒有專屬輔助道具`);
      else if (sup.length === 1) warn(`${g}系只有 1 件專屬輔助道具`);
    }
    /* 3. 異常來源 */
    line('\n## 異常狀態的來源（武器命中／加成／開戰藥劑）');
    for (const [n, [onK, modK, preK]] of Object.entries(STATUS)) {
      const ws = IT.filter(i => isW(i) && onHas(i, onK)),
        ms = IT.filter(i => !isW(i) && mods(i).some(m => m[modK])),
        ps = preK ? IT.filter(i => i.pre && i.pre[preK]) : [],
        stars = [1, 2, 3, 4, 5].map(s => ws.filter(i => i.star === s).length);
      line(`${n}：武器 ${ws.length}（${stars.map((c, k) => `${k + 1}★${c}`).join(' ')}）、加成 ${ms.length}、藥劑 ${ps.length}`);
      const miss = stars.map((c, k) => (c ? 0 : k + 1)).filter(Boolean);
      if (miss.length >= 2) warn(`${n}的武器缺 ${miss.join('、')}★`);
      if (!ms.length && n !== '吸血') warn(`${n}沒有加成道具（輔助）可以疊`);
    }
    /* 4. 職業 */
    line('\n## 職業（起手道具、主打武器各星級、輔助、核心）');
    for (const C of CLASSES) {
      const P = (typeof CORE_P !== 'undefined' && CORE_P[C.id]) || [C.th].filter(Boolean),
        st = ITEMI[C.st],
        ws = [1, 2, 3, 4, 5].map(s => IT.filter(i => isW(i) && i.star === s && P.some(t => hasTag(i, t))).length),
        sup = IT.filter(i => !isW(i) && helps(i, [...P, C.th])),
        c1 = ITEMS.filter(i => i.core === 1 && i.cls === C.id).length,
        c2 = ITEMS.filter(i => i.core === 2 && i.cls === C.id).length;
      line(`${C.n}：起手 ${st ? st.n : '—'}、主打 ${P.join('/')}、武器 ${ws.map((n, k) => `${k + 1}★${n}`).join(' ')}、輔助 ${sup.length}、核心 ${c1}+${c2}`);
      if (!st) bad(`${C.n}沒有起手道具（st）`);
      else if (st.star !== 1) warn(`${C.n}的起手道具不是 1★（${st.n} ${st.star}★）`);
      if (!P.includes('weapon')) {
        const miss = ws.map((n, k) => (n ? 0 : k + 1)).filter(Boolean);
        if (miss.length) bad(`${C.n}主打的武器缺 ${miss.join('、')}★`);
      }
      if (sup.length < 2) warn(`${C.n}的輔助道具只有 ${sup.length} 件`);
      if (c1 < 10 || c2 < 10) bad(`${C.n}核心太少（專屬 ${c1}、副核心 ${c2}）`);
      if (!C.th) warn(`${C.n}沒有 th（機器人選這個職業時不知道偏好買什麼）`);
    }
    /* 5. 形狀與星級 */
    line('\n## 形狀（每種形狀的件數）');
    const sh = {};
    IT.forEach(i => (sh[i.sh] = (sh[i.sh] || 0) + 1));
    line(Object.entries(sh).map(([k, n]) => `${k}:${n}`).join(' '));
    /* 6. 圖示、說明文字 */
    line('\n## 圖示與說明文字');
    const noIc = ITEMS.filter(i => {
      const ic = i.ic || '';
      if (ic.startsWith('p:')) return false;
      if (ic.startsWith('a:')) return !ART['m_' + ic.slice(4)] && !ART[ic.slice(2)];
      return !ART[ic] && !ART['it_' + i.id];
    });
    noIc.forEach(i => bad(`${i.n}（${i.id}）的圖示 ${i.ic} 不存在`));
    const dup = {};
    IT.forEach(i => (dup[i.ic] = [...(dup[i.ic] || []), i.n]));
    Object.entries(dup)
      .filter(([, l]) => l.length > 1)
      .forEach(([ic, l]) => warn(`圖示 ${ic} 被 ${l.length} 件共用：${l.join('、')}`));
    for (const i of ITEMS)
      for (const t of [1, 2, 3]) {
        const d = itemDesc(i.id, t);
        if (/undefined|NaN|\+-|null/.test(d)) bad(`${i.n}（第 ${t} 階）的說明有問題：${d}`);
      }
    /* 7. 怪物 */
    line('\n## 怪物');
    for (const [k, l] of Object.entries(MOBS)) {
      line(`${k}：${l.length} 隻`);
      l.forEach(m => !ART[m.spr.slice(2)] && bad(`怪物 ${m.n} 的圖 ${m.spr} 不存在`));
    }
    const probs = out.filter(s => /^(❌|⚠️)/.test(s));
    return `${probs.length ? probs.join('\n') : '✅ 沒有發現問題'}\n\n${out.filter(s => !/^(❌|⚠️)/.test(s)).join('\n')}`;
  };

  /* ================= 單件道具強度（0.1.18） ================= */
  /* 每件道具放進一個「標準背包」，看帶著它能打贏多強的對手（對手 = 沒有它的同一個背包放大 ×m 倍，二分搜尋勝率 50% 的 m）；
     同星級、同類別（武器、輔助、防具／盾、藥水、寵物）的放在一起比，偏離中位數太多的標出來。
     標準背包：同星級的兩把搭檔武器（輔助道具指定的標籤優先，例如箭袋配兩把弓、獸王圖騰配兩隻寵物；沒指定的配沒特效的劍／鎚）
     ＋ 一件同星級防具（盾的輔助配盾），4×4。 */
  const CAT = i =>
    i.tags.includes('pet') ? '寵物' : i.dmg ? '武器' : i.tags.includes('potion') ? '藥水' : i.tags.includes('armor') || i.tags.includes('shield') ? '防具' : '輔助';
  function partners(i) {
    const IT = items(),
      tgs = [i.for, ...mods(i).map(m => m.tag)].filter(t => t && t !== 'weapon' && t !== '*');
    const near = (pool, s) => {
      for (const d of [0, -1, 1, -2, 2, -3, 3, -4, 4]) {
        const l = pool.filter(x => x.star === s + d && x.id !== i.id);
        if (l.length) return l;
      }
      return pool.filter(x => x.id !== i.id);
    };
    const petSide = tgs.includes('pet') || i.tags.includes('pet');
    let pool = IT.filter(
      x => x.dmg && (petSide ? x.tags.includes('pet') : !x.tags.includes('pet')) && (tgs.length && !petSide ? tgs.some(t => x.tags.includes(t)) : true)
    );
    if (!pool.length) pool = IT.filter(x => x.dmg && !x.tags.includes('pet'));
    /* 沒指定標籤的武器搭檔用「沒有特殊效果」的劍／鎚，比較公平 */
    if (!tgs.length && !petSide) {
      const plain = pool.filter(x => (x.tags.includes('sword') || x.tags.includes('mace')) && !x.on && !x.pre);
      if (plain.length) pool = plain;
    }
    let ws = near(pool, i.star);
    if (!ws.length) ws = near(IT.filter(x => x.dmg && !x.tags.includes('pet')), i.star);
    const def = near(IT.filter(x => x.tags.includes(tgs.includes('shield') ? 'shield' : 'armor')), i.star);
    return [ws[0], ws[1] || ws[0], def[0]].filter(Boolean);
  }
  function testBag(ids) {
    const bag = { w: 4, h: 4, items: [] };
    ids.forEach((id, k) => {
      const o = { u: 'b' + k, id, t: 1, x: 0, y: 0, r: 0 },
        sp = findSpot(bag, o, true);
      if (sp) bag.items.push({ ...o, ...sp });
    });
    return bag;
  }
  /* 對手放大 m 倍（生命、傷害、格擋各 ×√m，整體戰力約 ×m） */
  function scaled(F, m) {
    const k = Math.sqrt(m),
      G = JSON.parse(JSON.stringify(F));
    G.hp = Math.round(G.hp * k);
    G.weapons.forEach(w => (w.dmg = w.dmg.map(v => Math.max(1, Math.round(v * k)))));
    G.shields.forEach(x => (x.block = Math.round(x.block * k)));
    return G;
  }
  /* 帶著這件道具，能打贏（勝率 50%）多強的對手：二分搜尋 m（1 = 跟沒有它的自己一樣強） */
  function powerOf(FA, FB, n) {
    let lo = 0.5,
      hi = 10;
    for (let it = 0; it < 10; it++) {
      const m = (lo + hi) / 2,
        G = scaled(FB, m);
      let w = 0;
      for (let s = 0; s < n; s++) if (simulate(FA, G, 7000 + s).win) w++;
      if (w / n >= 0.5) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  }
  W.itemPowerOf = (id, n = 16) => {
    const i = ITEMI[id],
      base = partners(i).map(x => x.id);
    return powerOf(compileBag(testBag([...base, id])), compileBag(testBag(base)), n);
  };
  W.itemPower = function (n = 16) {
    const rows = [];
    for (const i of items()) {
      if (i.gold) continue; /* 經濟道具（金幣）不比戰力 */
      const base = partners(i).map(x => x.id),
        A = testBag([...base, i.id]),
        B = testBag(base);
      if (!A.items.some(o => o.id === i.id)) continue;
      rows.push({ i, cat: CAT(i), p: powerOf(compileBag(A), compileBag(B), n), cells: shapeOf(i.id).length, base });
    }
    const out = ['## 單件道具強度：帶著它能打贏 ×N 倍強的對手（同星級、同類別比較；括號是佔幾格）'],
      flags = [];
    const groups = {};
    rows.forEach(r => ((groups[r.cat + r.i.star] = groups[r.cat + r.i.star] || []).push(r)));
    for (const [g, l] of Object.entries(groups).sort()) {
      l.sort((a, b) => b.p - a.p);
      const med = l[fl(l.length / 2)].p;
      out.push(`${g.slice(0, -1)} ${g.slice(-1)}★（中位數 ×${med.toFixed(2)}）：` + l.map(r => `${r.i.n} ×${r.p.toFixed(2)}${r.cells > 1 ? `（${r.cells}）` : ''}`).join('、'));
      if (l.length >= 3)
        l.forEach(r => {
          const q = r.p / med;
          if (q >= 1.3) flags.push(`⚠️ 偏強：${r.i.n}（${g.slice(0, -1)} ${r.i.star}★）×${r.p.toFixed(2)}，同組中位數 ×${med.toFixed(2)}`);
          if (q <= 0.77) flags.push(`⚠️ 偏弱：${r.i.n}（${g.slice(0, -1)} ${r.i.star}★）×${r.p.toFixed(2)}，同組中位數 ×${med.toFixed(2)}`);
        });
    }
    return [flags.join('\n') || '✅ 沒有明顯偏強偏弱的道具', '', ...out].join('\n');
  };

  /* ================= 機器人模擬（分批、累積） ================= */
  const SIM = (W.__bal = W.__bal || { cls: {}, pve: {}, bag: {}, fair: { w: 0, n: 0, pl: [], rd: [] }, lobbies: 0 });
  const avg = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  /* 用機器人代打玩家的一局（跟 CLAUDE.md 說的一樣：newRun + botAct + startFight／finishFight） */
  function playOne(q, cb) {
    const run = newRun(makeBots(LOBBY_N - 1, 1000));
    run.bag.cls = run.clsOpts[0];
    run.phase = 'prep';
    giveStarter(run);
    const th = CLSI[run.bag.cls].th || 'sword';
    for (let k = 0; run.phase !== 'end' && k < 80; k++) {
      botAct(run, th, q);
      const fb = startFight(run);
      if (!fb) {
        endRun(run, 1);
        break;
      }
      cb && cb(run, fb);
      finishFight(run, fb);
      if (run.phase === 'end') break;
      if (run.pend) takePick(run, run.pend.opts[0], true);
      if (run.hold) claimHold(run);
      nextRound(run);
    }
    return run;
  }
  W.sims = async function (what = 'class', batch = 12) {
    if (what === 'reset') return (W.__bal = null), 'cleared';
    const save0 = JSON.stringify(S),
      t0 = performance.now();
    try {
      for (let i = 0; i < batch && performance.now() - t0 < 30000; i++) {
        if (what === 'class') {
          for (const b of simLobby((Math.random() * 2 ** 31) | 0, 1300, { short: 1 })) {
            const c = b.snaps[Object.keys(b.snaps)[0]].bag.cls;
            (SIM.cls[c] = SIM.cls[c] || []).push(b.place);
          }
          SIM.lobbies++;
        } else {
          const run = playOne(0.6, (run, fb) => {
            if (what === 'pve' && fb.opp.kind !== 'pvp') {
              const r = fb.r,
                key = /^1-|^2-2$|^2-5$|^4-4$/.test(r.id) ? r.id : `${r.type === 'elite' ? '菁英' : r.type}${r.st}`;
              const s = (SIM.pve[key] = SIM.pve[key] || [0, 0]);
              s[1]++;
              if (fb.res.win) s[0]++;
            }
            if (what === 'pve' && /^\d-4$/.test(fb.r.id)) (SIM.bag[fb.r.id] = SIM.bag[fb.r.id] || []).push(run.bag.w * run.bag.h);
            if (what === 'fair' && fb.opp.kind === 'pvp') {
              SIM.fair.n++;
              if (fb.res.win) SIM.fair.w++;
            }
          });
          if (what === 'fair') {
            SIM.fair.pl.push(run.place);
            SIM.fair.rd.push(run.ri);
          }
        }
      }
    } finally {
      S = JSON.parse(save0);
      save();
    }
    return W.report();
  };
  W.report = function () {
    const r = [];
    const cls = Object.entries(SIM.cls);
    if (cls.length) {
      const n = cls.reduce((a, [, l]) => a + l.length, 0);
      r.push(`## 職業平均名次（${n} 個機器人樣本；公平 ${FAIR}，每職業樣本 50 左右時 ±${(BAND * 0.7).toFixed(2)} 都算誤差）`);
      cls
        .map(([c, l]) => [CLSI[c] ? CLSI[c].n : c, avg(l), l.length])
        .sort((a, b) => a[1] - b[1])
        .forEach(([c, a, k]) => r.push(`${a < FAIR - BAND ? '⚠️ 偏強 ' : a > FAIR + BAND ? '⚠️ 偏弱 ' : ''}${c} ${a.toFixed(2)}（${k}）`));
    }
    const pve = Object.entries(SIM.pve);
    if (pve.length) {
      r.push('\n## PvE 勝率（目標：野怪 95%+、菁英 80～95%、首領 60～75%）');
      pve.forEach(([k, [w, n]]) => r.push(`${k} ${Math.round((w / n) * 100)}%（${n}）`));
      r.push('背包格數：' + Object.entries(SIM.bag).map(([k, l]) => `${k} ${avg(l).toFixed(1)}`).join(' / '));
    }
    if (SIM.fair.pl.length) {
      const f = SIM.fair;
      r.push(`\n## 公平性（${f.pl.length} 局）：對戰勝率 ${Math.round((f.w / f.n) * 100)}%（約 50%）、平均名次 ${avg(f.pl).toFixed(2)}（約 ${FAIR}）、平均 ${avg(f.rd).toFixed(1)} 回合`);
    }
    return r.join('\n') || '還沒有模擬資料：先跑 await sims("class")';
  };
})();
