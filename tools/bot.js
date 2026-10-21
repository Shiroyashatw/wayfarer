/* 測試用：加速時間＋自動玩一局（tools/bot.js，不是遊戲程式，不會被 index.html 載入）。
   用法：本機開遊戲（手機尺寸、瀏覽器窗格要顯示著），在 console 執行：
     window.__K = 10; window.__RUNS = 3; eval(await (await fetch("tools/bot.js")).text()); A.runStart();
   之後看 __bot.fights（每場的對手、角色等級、血量變化、花幾秒）與 __bot.log（結算）。__K 是時間倍率，__RUNS 是連跑幾局 */
(() => {
  if (window.__bot) return;
  const K = window.__K || 10,
    pn = performance.now.bind(performance),
    T0 = pn();
  performance.now = () => T0 + (pn() - T0) * K;
  const st = window.setTimeout.bind(window);
  window.setTimeout = (f, ms, ...a) => st(f, (ms || 0) / K, ...a);
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = cb => raf(t => cb(T0 + (t - T0) * K));
  const bot = (window.__bot = { log: [], fights: [], on: true, busy: false, hp0: 0 });
  const hpP = () => Math.round((S.hp / stats().maxhp) * 100);
  /* 換上比較好的裝備：稀有度與物品等級都不比穿的差 */
  function gear() {
    for (let i = S.inv.length - 1; i >= 0; i--) {
      const it = S.inv[i];
      const slot = it.slot === 'ring' ? (S.eq.ring1 ? (S.eq.ring2 ? 'ring1' : 'ring2') : 'ring1') : it.slot;
      const cur = S.eq[slot];
      if (cur && (cur.r > it.r || (cur.r === it.r && cur.ilvl >= it.ilvl))) continue;
      if (slot === 'offhand' && typeof twoHand === 'function' && twoHand()) continue;
      if (slot === 'weapon' && S.eq.offhand && twoHand(it)) continue;
      if (slot === 'offhand' && isQuiver(it)) continue;
      S.inv.splice(i, 1);
      S.eq[slot] = it;
      if (cur) S.inv.push(cur);
    }
    /* 用靈魂升級技能欄的技能石（跟真人一樣） */
    for (const g of S.gems)
      while (S.sk.includes(g.id) && !gemLvBlock(g)) {
        const n = soulNeed(g.lv);
        S.cur.soul -= n;
        g.dust += n;
        g.lv++;
      }
    /* 技能石塞進空的技能欄 */
    for (const g of S.gems) {
      if (SKILLS[g.k].kind === 'aura' || S.sk.includes(g.id)) continue;
      const j = S.sk.indexOf(null);
      if (j >= 0) S.sk[j] = g.id;
    }
  }
  function decide() {
    const me = B.me,
      sts = (me.st = stats()),
      sks = mySkills(),
      hp = S.hp / sts.maxhp;
    if (hp < 0.35 && S.potions > 0 && !potLeft(me, 'potions')) bItem('potions');
    if (S.mp < 8 && S.ethers > 0 && !potLeft(me, 'ethers')) bItem('ethers');
    const ok = i => sks[i] && skReady(S, me, skSt(sts, sks[i]), sks[i]);
    if (hp < 0.5) {
      const hi = sks.findIndex((q, i) => q && q.heal && ok(i));
      if (hi >= 0) return 's' + hi;
    }
    const di = sks.findIndex((q, i) => q && !q.heal && !q.pet && (q.kind === 'attack' || q.kind === 'spell') && ok(i));
    if (di >= 0) return 's' + di;
    const pi = sks.findIndex((q, i) => q && q.pet && ok(i));
    if (pi >= 0) return 's' + pi;
    return 'attack';
  }
  async function modal() {
    const t = $('dlg').querySelector('h2').textContent;
    const bp = [...$('dlg').querySelectorAll('.bpk')];
    if (bp.length) {
      /* 技能欄還有空位就拿技能石，否則隨便 */
      const want = bp.find(b => b.querySelector('small').textContent === '技能石' && S.sk.includes(null)) || bp[0];
      want.click();
      return;
    }
    if (t === '旅行商人') {
      const leave = [...$('dlg').querySelectorAll('.btn')].find(b => b.textContent === '離開');
      return leave.click();
    }
    const b = $('dlg').querySelector('.btn.pri:not([disabled])') || $('dlg').querySelector('.btn:not([disabled])');
    if (b) {
      if (t === '這一局結束了' || t === '通關！') bot.log.push(`== ${t}：${$('dlg').innerText.split('\n').slice(1, 3).join(' ')}`);
      b.click();
    }
  }
  bot.tick = () => {
    if (!bot.on || !S) return;
    try {
      if (!$('modal').hidden) return modal();
      if (B) {
        if (!bot.inB) {
          bot.inB = true;
          bot.hp0 = hpP();
          bot.foe = B.es.map(e => `${e.name}Lv${e.lv}`).join('、');
          bot.lvAt = S.lv;
          bot.t = pn();
        }
        if (B.ready && !B.anim && !B.over) useSkill(decide());
        return;
      }
      if (bot.inB) {
        bot.inB = false;
        bot.fights.push(`ch${S.run ? S.run.ch + 1 : '-'} ${bot.foe} | 角色Lv${bot.lvAt} 血 ${bot.hp0}%→${S.run ? hpP() : 0}% ${Math.round((pn() - bot.t) / 1000)}s`);
      }
      if (!S.run) {
        if ((bot.n = (bot.n || 1) + 1) > (window.__RUNS || 1)) bot.on = false;
        else {
          bot.fights.push('---- 新的一局');
          A.runStart();
        }
        return;
      }
      gear();
      const nx = nextNodes();
      const n = nx[fl(Math.random() * nx.length)];
      enterNode(n.id);
    } catch (e) {
      bot.log.push('ERR ' + e.message);
      bot.on = false;
    }
  };
  setInterval(bot.tick, 60);
})();
