/* 塞令老師 · 一局的流程：回合、商店、經濟、野怪與首領、對手（快照或機器人）、名次 */
'use strict';
/* ================= 野怪、菁英、首領（也是一組道具，直接寫成戰鬥用的角色） ================= */
const mkW = (cd, a, b, on = {}) => ({
  u: 'm',
  id: 'm',
  pet: false,
  el: on.el || 'phys',
  cd,
  dmg: [Math.max(1, Math.round(a)), Math.max(1, Math.round(b))],
  crit: on.crit || 0,
  burn: on.burn || 0,
  poison: on.poison || 0,
  freeze: on.freeze || [0, 0],
  stun: on.stun || [0, 0],
  ls: on.ls || 0,
  bleed: on.bleed || 0,
  sunder: on.sunder || 0,
  weak: on.weak || 0,
  blind: on.blind || 0
});
/* o.x：0.1.12 怪物也能用核心的機制（反彈、越戰越快、背水、連擊、開戰護盾…）；o.pre：開戰效果 [{k, v}] */
const mkF = (hp, o = {}) => ({
  hp: Math.round(hp),
  arm: o.arm || 0,
  dodge: o.dodge || 0,
  regen: o.regen || 0,
  ls: 0,
  critMul: 160,
  take: 0,
  weapons: o.w || [],
  shields: (o.s || []).map(([cd, block]) => ({ u: 'm', cd, block: Math.round(block), thorns: 0, heal: 0 })),
  pots: [],
  pre: o.pre || [],
  ...(o.x || {})
});
/* 0.1.12 怪物模板：給生命 hp、一下的基準傷害 d，照模板做成有特色的怪（各系的異常、坦、快、群體…） */
const ARCH = {
  basic: (hp, d) => mkF(hp, { w: [mkW(1.6, d * 0.8, d * 1.4)] }),
  brute: (hp, d) => mkF(hp * 1.1, { arm: 2 + fl(hp / 50), w: [mkW(2.3, d * 1.7, d * 2.5, { sunder: 1 })] }),
  swift: (hp, d) => mkF(hp * 0.85, { dodge: 15, w: [mkW(0.9, d * 0.5, d * 0.9), mkW(1.1, d * 0.5, d * 0.8)] }),
  fire: (hp, d) => mkF(hp, { w: [mkW(1.7, d, d * 1.5, { burn: 1 + fl(d / 4), el: 'fire' })] }),
  cold: (hp, d) => mkF(hp * 1.05, { w: [mkW(1.7, d, d * 1.5, { freeze: [25, 1], el: 'cold' })] }),
  storm: (hp, d) => mkF(hp, { dodge: 8, w: [mkW(1.4, d * 0.8, d * 1.3, { stun: [18, 0.5], el: 'light' })] }),
  venom: (hp, d) => mkF(hp, { w: [mkW(1.3, d * 0.5, d * 0.8, { poison: 1 + fl(d / 5), el: 'poison' })] }),
  bleed: (hp, d) => mkF(hp, { w: [mkW(1.2, d * 0.7, d * 1.1, { bleed: 1 + fl(d / 4) })] }),
  breaker: (hp, d) => mkF(hp * 1.05, { arm: 2, w: [mkW(1.9, d * 1.2, d * 1.8, { sunder: 2 })] }),
  hexer: (hp, d) => mkF(hp, { w: [mkW(1.6, d * 0.9, d * 1.4, { weak: 30, el: 'dark' })], pre: [{ k: 'weak', v: 3 }] }),
  blinder: (hp, d) => mkF(hp, { w: [mkW(1.4, d * 0.8, d * 1.2, { blind: 30 })], pre: [{ k: 'blind', v: 3 }] }),
  tank: (hp, d) =>
    mkF(hp * 1.3, {
      arm: 3 + fl(hp / 40),
      regen: 1 + fl(hp / 80),
      w: [mkW(2, d, d * 1.6)],
      s: [[3.5, d * 2.5]],
      x: { thornsF: 1 + fl(d / 4) }
    }),
  swarm: (hp, d) =>
    mkF(hp, {
      w: [mkW(1.4, d * 0.4, d * 0.8), mkW(1.6, d * 0.4, d * 0.8), mkW(1.8, d * 0.4, d * 0.8), mkW(2, d * 0.4, d * 0.8)]
    }),
  vamp: (hp, d) => mkF(hp, { w: [mkW(1.5, d * 0.9, d * 1.4, { ls: 35 })] }),
  berserk: (hp, d) => mkF(hp, { w: [mkW(1.6, d * 0.9, d * 1.4)], x: { ramp: 10, rage: 40 } })
};
/* 兩個模板合在一起（首領）：生命取平均，武器都帶上（傷害打 6 折），特性合併 */
function archMix(a, b, hp, d) {
  const A = ARCH[a](hp, d),
    B = ARCH[b](hp, d);
  const w = [...A.weapons, ...B.weapons].map(x => ({ ...x, dmg: x.dmg.map(v => Math.max(1, Math.round(v * 0.6))) }));
  return {
    ...A,
    ...B,
    hp: Math.round((A.hp + B.hp) / 2),
    arm: Math.max(A.arm, B.arm),
    dodge: Math.max(A.dodge, B.dodge),
    regen: Math.max(A.regen, B.regen),
    weapons: w,
    shields: [...A.shields, ...B.shields],
    pre: [...A.pre, ...B.pre]
  };
}
/* 一隻怪：[名字, 圖, 模板（或兩個模板）]，L 是這一組的基準 [生命, 傷害] */
const mob =
  L =>
  ([n, spr, a]) => ({
    n,
    spr: 'a_' + spr,
    arch: a,
    F: () => (Array.isArray(a) ? archMix(a[0], a[1], L[0], L[1]) : ARCH[a](L[0], L[1]))
  });
const pool = (L, list) => list.map(mob(L));
/* 野怪、菁英、首領。1-1～1-3、2-2、2-5 固定強度；其他菁英與 4-4 首領照階段放大（mobOf） */
const MOBS = {
  '1-1': pool(
    [26, 2],
    [
      ['綠史萊姆', 'm_slime_green', 'basic'],
      ['蝙蝠', 'm_bat', 'swift'],
      ['香菇', 'm_mushroom', 'venom'],
      ['樹蛙', 'm_treefrog', 'basic'],
      ['海鷗', 'm_seagull', 'swift'],
      ['山羌', 'm_muntjac', 'basic']
    ]
  ),
  '1-2': pool(
    [44, 3],
    [
      ['稻草人', 'm_scarecrow', 'breaker'],
      ['流浪狗', 'm_straydog', 'bleed'],
      ['垃圾史萊姆', 'm_slime_trash', 'venom'],
      ['山豬', 'm_boar', 'brute'],
      ['獼猴', 'm_macaque', 'swift'],
      ['椰子蟹', 'm_coconutcrab', 'tank']
    ]
  ),
  '1-3': pool(
    [62, 3.6],
    [
      ['火史萊姆', 'm_slime_fire', 'fire'],
      ['夜鷺', 'm_nightheron', 'swift'],
      ['火蟻', 'm_fireant', 'breaker'],
      ['眼鏡蛇', 'm_cobra', 'venom'],
      ['冰史萊姆', 'm_slime_ice', 'cold'],
      ['獨角仙', 'm_beetle', 'brute']
    ]
  ),
  /* 1-4（第 1 階段菁英，第 2 階段的菁英放大 1.3 倍用另一組）：各地的精怪王 */
  '1-4': pool(
    [110, 5],
    [
      ['雷蝠王', 'm_thunderbat', 'storm'],
      ['殭屍', 'jiangshi', 'tank'],
      ['菇菇王', 'm_mushking', 'venom'],
      ['鼠王', 'm_ratking', 'bleed'],
      ['水鹿王', 'm_sambarking', 'brute'],
      ['猴王', 'm_monkeyking', 'swift'],
      ['石魔像', 'm_golem', 'tank'],
      ['熔岩魔像', 'm_lavagolem', 'fire']
    ]
  ),
  /* 2-2 群體小怪：很多隻一起打（很多把弱武器），考驗範圍傷害與清怪效率 */
  '2-2': pool(
    [105, 2.4],
    [
      ['史萊姆群', 'm_slime_green', 'swarm'],
      ['蝙蝠群', 'm_bat', 'swarm'],
      ['骷髏兵團', 'skeleton', 'swarm'],
      ['火蟻群', 'm_fireant', 'swarm'],
      ['獼猴群', 'm_macaque', 'swarm'],
      ['鬼火群', 'm_ghostfire', 'swarm']
    ]
  ),
  /* 2-5 首領：地府（兩個模板合在一起，各有機制要破） */
  '2-5': pool(
    [190, 6.4],
    [
      ['牛頭', 'oxhead', ['brute', 'tank']],
      ['馬面', 'horseface', ['swift', 'storm']],
      ['水鬼', 'shuigui', ['cold', 'tank']],
      ['孟婆', 'mengpo', ['hexer', 'venom']],
      ['虎姑婆', 'hugupo', ['bleed', 'berserk']],
      ['陳守娘', 'chenshouniang', ['blinder', 'vamp']]
    ]
  ),
  /* 第 2 階段菁英（2-4）：七宗罪的爪牙 */
  sins: pool(
    [132, 6],
    [
      ['傲慢聖騎', 'sin_pride_paladin', 'tank'],
      ['傲慢之鏡', 'sin_pride_mirror', 'blinder'],
      ['貪婪地精', 'sin_greed_goblin', 'swift'],
      ['貪婪傭兵', 'sin_greed_merc', 'bleed'],
      ['色慾魅魔', 'sin_lust_succubus', 'hexer'],
      ['色慾藤蔓', 'sin_lust_vine', 'venom'],
      ['憤怒狂戰士', 'sin_wrath_berserker', 'berserk'],
      ['憤怒炸彈魔', 'sin_wrath_bomber', 'fire'],
      ['暴食大嘴', 'sin_glut_maw', 'vamp'],
      ['暴食鬣狗', 'sin_glut_hyena', 'bleed'],
      ['嫉妒巨蛇', 'sin_envy_serpent', 'venom'],
      ['嫉妒魚人', 'sin_envy_fishman', 'cold'],
      ['怠惰巨人', 'sin_sloth_giant', 'brute'],
      ['怠惰蝸牛', 'sin_sloth_snail', 'tank']
    ]
  ),
  /* 第 3 階段菁英（3-4）：墮落十二生肖 */
  zodiac: pool(
    [100, 4.7],
    [
      ['墮落・子鼠', 'z_rat', 'swift'],
      ['墮落・丑牛', 'z_ox', 'brute'],
      ['墮落・寅虎', 'z_tiger', 'bleed'],
      ['墮落・卯兔', 'z_rabbit', 'swift'],
      ['墮落・辰龍', 'z_dragon', 'fire'],
      ['墮落・巳蛇', 'z_snake', 'venom'],
      ['墮落・午馬', 'z_horse', 'berserk'],
      ['墮落・未羊', 'z_goat', 'hexer'],
      ['墮落・申猴', 'z_monkey', 'blinder'],
      ['墮落・酉雞', 'z_rooster', 'storm'],
      ['墮落・戌狗', 'z_dog', 'bleed'],
      ['墮落・亥豬', 'z_pig', 'tank']
    ]
  ),
  /* 4-4 首領：七宗罪之王 */
  kings: pool(
    [105, 3.4],
    [
      ['傲慢之王・路西法', 'lucifer', ['tank', 'blinder']],
      ['貪婪之王・瑪門', 'mammon', ['swift', 'bleed']],
      ['色慾之王・阿斯莫德', 'asmodeus', ['hexer', 'vamp']],
      ['憤怒之王・撒旦', 'satan', ['berserk', 'fire']],
      ['暴食之王・別西卜', 'beelzebub', ['vamp', 'venom']],
      ['嫉妒之王・利維坦', 'leviathan', ['cold', 'storm']],
      ['怠惰之王・貝爾芬格', 'belphegor', ['tank', 'breaker']]
    ]
  ),
  /* 第 5 階段以後的菁英：四凶與冥府 */
  fiends: pool(
    [90, 4.3],
    [
      ['四凶・混沌', 'hundun', ['hexer', 'tank']],
      ['四凶・窮奇', 'qiongqi', ['bleed', 'swift']],
      ['四凶・饕餮', 'taotie', ['vamp', 'brute']],
      ['四凶・檮杌', 'taowu', ['berserk', 'breaker']],
      ['燭龍', 'zhulong', 'fire'],
      ['巫妖王', 'lichking', 'cold'],
      ['骨王', 'bonelord', 'breaker'],
      ['死神', 'reaper', 'bleed'],
      ['冥將', 'wraith_general', 'tank'],
      ['骨巨人', 'bone_colossus', 'brute'],
      ['閻羅王', 'yanluo', ['storm', 'hexer']]
    ]
  )
};
/* ================= 一局 ================= */
/* 這局專用的亂數（存在存檔裡，重新整理也一樣） */
const runR = run => rng(h(run.seed, run.rc++, 77));
const r01 = run => runR(run)();
const pick = (run, a) => a[fl(r01(run) * a.length)];
function newRunState(seed, mode = 'std') {
  return {
    seed,
    /* 0.1.52 賽制 */
    mode,
    rc: 0,
    ri: -1,
    hp: START_HP,
    gold: 0,
    lv: 1,
    bag: { w: BAGLV[1].w, h: BAGLV[1].h, items: [] },
    bench: Array(BENCH_N).fill(null),
    shop: [],
    lock: false,
    sale: false,
    ws: 0,
    lsk: 0,
    un: 0
  };
}
/* 0.1.7 每回合多拿的金幣：商人職業、背包裡的錢袋（每升一階 +1）；0.1.35 融入的核心也算、財源滾滾照階段 */
const bonusGold = run => {
  const st = (curRound(run) || { st: 1 }).st;
  let n = (CLSI[run.bag.cls] || {}).gold || 0;
  for (const o of bagAll(run.bag))
    for (const d of defsOf(o)) {
      if (d.gold) n += d.gold + (d === ITEMI[o.id] ? o.t - 1 : 0);
      if (d.goldSt) n += goldStOf(d.goldSt, st);
    }
  /* 0.1.59 詛咒・吸金、遺物・黃金面具 */
  for (const o of run.bag.items) if (o.cu && CURSES[o.cu[0]] && CURSES[o.cu[0]].k === 'drain') n -= cuV(o);
  if ((run.bag.rel || []).includes('mask')) n += 2;
  return n;
};
/* 0.1.8 選完職業送的起手道具：放進暫存區，回傳道具代號 */
function giveStarter(run) {
  const id = (CLSI[run.bag.cls] || {}).st,
    fi = benchFree(run);
  if (!id || !ITEMI[id] || fi < 0) return null;
  run.bench[fi] = newItem(run, id);
  mergeAll(run, runR(run));
  return id;
}
/* 開局職業三選一：隨機 3 個不重複 */
function rollClasses(run) {
  const ids = CLASSES.map(c => c.id),
    out = [];
  while (out.length < 3) {
    const id = ids.splice(fl(r01(run) * ids.length), 1)[0];
    out.push(id);
  }
  return out;
}
/* 0.1.52 抽賽制（照權重） */
function rollMode(rand) {
  const tot = MODES.reduce((n, m) => n + m.w, 0);
  let x = rand() * tot;
  for (const m of MODES) if ((x -= m.w) < 0) return m.k;
  return 'std';
}
/* ================= 0.1.59 七十二變、星象輪轉 ================= */
/* 七十二變：這局每件道具換成哪個形狀（run.shm：道具 → SH 的鍵）。同一場大家一樣（即時機器人、機器人對局共用一份）；
   形狀是道具本身的總表打亂後重新發：1★ 只拿 3 格以內、放得進 3×3 的。核心、核心送的、魔劍正宗這種看形狀的不換 */
function rollShm(rand) {
  const ids = ITEMS.filter(it => shopOK(it) && !it.absorb && !it.hatch).map(it => it.id),
    bag = ids.map(id => ITEMI[id].sh),
    small = k => SH[k].length <= 3 && Math.max(...SH[k].flat()) < 3,
    out = {},
    take = f => {
      const c = bag.map((k, i) => [k, i]).filter(([k]) => f(k));
      if (!c.length) return null;
      const [k, i] = c[fl(rand() * c.length)];
      bag.splice(i, 1);
      return k;
    };
  /* 1★ 先拿（不然可能剩下的都是大形狀） */
  for (const id of ids.filter(id => ITEMI[id].star === 1)) out[id] = take(small) || 's1';
  for (const id of ids.filter(id => ITEMI[id].star > 1)) out[id] = take(() => true) || ITEMI[id].sh;
  return out;
}
/* 這局某件道具的形狀（沒換過回傳 undefined） */
const shmOf = (run, id) => (run && run.shm && run.shm[id]) || undefined;
/* 星象輪轉：每個階段一條規則（run.astro[階段]，不跟上一個階段一樣） */
function rollAstro(rand) {
  const out = [null];
  for (let st = 1; st <= ROUNDS[ROUNDS.length - 1].st; st++) {
    const c = ASTROS.filter(a => a.k !== out[st - 1]);
    out.push(c[fl(rand() * c.length)].k);
  }
  return out;
}
const astroAt = (run, st) => (run && run.mode === 'astro' && run.astro && run.astro[st]) || null;
/* 把這個階段的規則套在一邊的戰鬥數值上（複本，不改原本的；雙方、怪物都套） */
function astroF(F, k) {
  if (!k || k === 'harvest') return F;
  /* 怪物的數值不一定每個欄位都有：沒有的當 0，不要乘出 NaN */
  const w = F.weapons.map(x => ({ ...x, ...(x.freeze ? { freeze: [...x.freeze] } : {}) })),
    s = F.shields.map(x => ({ ...x })),
    G = { ...F, weapons: w, shields: s },
    mul = (o, key, v) => o[key] && (o[key] = o[key] * v);
  if (k === 'fire') for (const x of w) mul(x, 'burn', 2);
  if (k === 'toxin') for (const x of w) mul(x, 'poison', 2), mul(x, 'venom', 2);
  if (k === 'frost') for (const x of w) mul(x, 'chill', 1.5), x.freeze && mul(x.freeze, 0, 1.5);
  if (k === 'blood') {
    for (const x of w) mul(x, 'ls', 2);
    mul(G, 'ls', 2);
  }
  if (k === 'mirror') {
    for (const x of s) mul(x, 'thorns', 2);
    mul(G, 'thornsF', 2);
  }
  if (k === 'wind') for (const x of [...w, ...s]) x.cd = Math.max(0.4, x.cd * 0.8);
  if (k === 'iron') {
    mul(G, 'arm', 2);
    for (const x of s) x.block = Math.round((x.block || 0) * 1.5);
  }
  if (k === 'fury') for (const x of w) x.crit = (x.crit || 0) + 15;
  return G;
}
/* 戰鬥用的數值：階段生命倍率＋星象（run 是這場用哪一局的規則；機器人對局大家共用同一份） */
const fightF = (run, F, st, mob) => {
  const G = stageHp(F, st, mob),
    H = modeH(run);
  return H.fight ? H.fight(run, G, st) : G;
};
/* 設定這局的賽制（玩家那局）：一場共用的資料（形狀表、星象）也給即時機器人；測試可以直接指定賽制 */
function setMode(run, m) {
  run.mode = m;
  modeShare(
    run,
    modeShareOf(m, () => r01(run))
  );
  for (const rv of run.rivals || [])
    if (rv.live) {
      rv.live.run.mode = m;
      modeShare(rv.live.run, run.share);
      modeFix(rv.live.run);
    }
}
/* ================= 0.1.62 道具池的主題 ================= */
/* 這局商店、戰利品、商人會出的：商店道具（shopOK）而且在這局的主題池或基本池（thOK） */
const poolOK = (run, it) => shopOK(it) && thOK(run && run.theme, it);
/* 抽主題（機率一樣；跟賽制衝突的不抽，MODE_TH_BAN） */
function rollTheme(rand, mode) {
  const c = POOLTH.filter(x => !(MODE_TH_BAN[mode] || []).includes(x.k));
  return c[fl(rand() * c.length)].k;
}
/* 設定這局的主題（玩家那局）；即時機器人跟你同一個主題 */
function setTheme(run, th) {
  run.theme = th;
  for (const rv of run.rivals || []) if (rv.live) rv.live.run.theme = th;
}
/* 一場共用的資料（MODEH 的 share）：放進 run（欄位照掛勾回傳的名字，例如 shm、astro），換賽制時清掉舊的 */
const modeShareOf = (m, rand) => ((MODEH[m] || {}).share ? MODEH[m].share(rand) : {});
function modeShare(run, sh) {
  for (const k of Object.keys(run.share || {})) delete run[k];
  run.share = sh;
  Object.assign(run, sh);
}
/* 賽制開場後補上：已經拿到的道具（起手道具、換賽制前拿到的）補上印記、七十二變的形狀 */
function modeFix(run) {
  const f = modeH(run).fix;
  if (f) for (const o of [...run.bag.items, ...run.bench, run.hold]) if (o && !ITEMI[o.id].core) f(run, o);
}
/* ================= 0.1.59 賽制的掛勾 =================
   每個賽制一份（沒寫的掛勾就是不影響），程式其他地方只透過 modeH(run) 問，不要再寫 run.mode === '…'。
   新增賽制照 skill new-mode：data.js 的 MODES 加規則文字，這裡加掛勾，ui.js 的 MODEUI 加畫面，跑 node tools/check.js。
     share(rand)            一場共用的資料（玩家那局抽一次，即時機器人、機器人對局共用），回傳 { 欄位: 值 }；salt 是機器人對局的亂數種子
     fix(run, o)            開場後已經拿到的道具（起手道具）補上這個賽制的標記
     slot(run, s, used)     商店的一格抽完後（可以換道具、加標記；used 是池子）
     item(run, o, from)     新的一件道具（商店買的 from 是那一格，其他是 null）
     price(run, s, p)       商店那一格的價格
     sell(run, o, v)        賣價（v 是原本的賣價）
     bought(run, s, o)      買完一件
     reroll                 不能刷新：寫原因
     round(run)             每回合開始（nextRound：收入、商店之前）
     fought(run, r)         玩家那局打完一回合（對手也打完、淘汰也算完）
     lobby(bots, r, rr)     機器人對局（simLobby）打完一回合；bots 是還在場上和這回合淘汰的
     luck(run)              打贏時多拿 2 金的機率判定（會用掉亂數）
     winBonus(run, r)       打贏多拿的金幣（固定的，收入預估也算）
     fight(run, F, st)      戰鬥數值（雙方、怪物都套，回傳複本）
   排除的核心寫在 MODES 的 ban（data.js） */
const MODEH = {
  gale: {
    price: (run, s, p) => (p > 0 ? Math.max(1, p - 1) : p),
    /* 0.1.54 這回合買的賣 0 金，不然買了馬上賣掉等於免費刷新商店 */
    sell: (run, o, v) => (o.bt === run.ri ? 0 : v),
    bought: run => rollShop(run),
    reroll: '狂風市集不能刷新：買一件，商店就會整排換新'
  },
  sigil: {
    fix: (run, o) => o.sg == null && (o.sg = fl(r01(run) * SIGILS.length)),
    slot: (run, s) => (s.sg = fl(r01(run) * SIGILS.length)),
    item: (run, o, from) => (o.sg = from && from.sg != null ? from.sg : fl(r01(run) * SIGILS.length)),
    /* 幸運 2 級：打贏 30% 多拿 2 金 */
    luck: run => sgLv(sgCount(run.bag)[4]) >= 2 && r01(run) < 0.3
  },
  caravan: {
    /* 每回合換一位商人（不跟上回合同一位）；雙胞胎只在那一回合有效 */
    round: run => {
      const c = VANS.filter(v => !run.van || v.k !== run.van.k);
      run.van = { k: c[fl(r01(run) * c.length)].k, done: 0 };
    }
  },
  curse: {
    /* CURSE_P% 換成高一星的同一格（池子照樣算），帶一個祝福＋一個詛咒 */
    slot: (run, s, used) => {
      if (run.ri <= 0 || ITEMI[s.id].star >= 5 || r01(run) * 100 >= CURSE_P) return;
      const up = rollItem(run, false, used, it => it.star === ITEMI[s.id].star + 1);
      if (up && ITEMI[up].star === ITEMI[s.id].star + 1) {
        s.id = up;
        s.cu = curseRoll(run, up);
        s.bl = blessRoll(run, up);
      }
    },
    item: (run, o, from) => {
      if (from && from.cu) o.cu = [...from.cu];
      if (from && from.bl) o.bl = [...from.bl];
    },
    /* 價格照星級固定（Ⅱ 階 ×3）；買得比賣價便宜的，賣價最多是付的錢（shopItem 的 pp） */
    price: (run, s, p) => (s.cu ? CURSE_PRICE[ITEMI[s.id].star] * 3 ** ((s.t || 1) - 1) : p)
  },
  shape: {
    share: rand => ({ shm: rollShm(rand) }),
    salt: 8,
    /* 形狀表還沒抽（機器人對局先建好每一局才抽）就先不換，之後 modeFix 補 */
    fix: (run, o) => shmOf(run, o.id) && (o.sh = run.shm[o.id]),
    slot: (run, s) => shmOf(run, s.id) && (s.sh = run.shm[s.id]),
    item: (run, o) => shmOf(run, o.id) && (o.sh = run.shm[o.id])
  },
  astro: {
    share: rand => ({ astro: rollAstro(rand) }),
    salt: 9,
    winBonus: (run, r) => (astroAt(run, r.st) === 'harvest' ? 1 : 0),
    fight: (run, F, st) => astroF(F, astroAt(run, st))
  },
  relic: {
    /* 剛打完的是開寶庫的回合就開（只有玩家那局，機器人在 relicOpen 裡一起挑） */
    round: run => {
      if (run.rivals && ROUNDS[run.ri - 1] && RELIC_AT.includes(ROUNDS[run.ri - 1].id)) relicOpen(run);
    },
    lobby: (bots, r, rr) => {
      const live = bots.filter(b => !b.out);
      if (!RELIC_AT.includes(r.id) || !live.length) return;
      const opts = relicOpts(rr, live.length + 1);
      for (const b of [...live].sort((a, c) => a.run.hp - c.run.hp)) relicTake(b.run, opts, b.q, b.P);
    }
  },
  legacy: {
    round: run => run.leg && (run.leg = run.leg.filter(e => e.lx >= run.ri)),
    /* 這回合淘汰的對手：背包分給還活著的人 */
    fought: (run, r) => {
      for (const rv of run.rivals)
        if (rivalHp(rv) <= 0 && !rv.gone) {
          rv.gone = 1;
          const bag = rv.live ? rv.live.run.bag : unpackBag((rivalSnap(rv, r.id) || { bag: {} }).bag),
            got = legacyDrop(
              run,
              bag,
              [run, ...run.rivals.filter(x => x.live && rivalHp(x) > 0).map(x => x.live.run)].filter(x => x.hp > 0),
              rv.name
            );
          /* 0.1.60 下一個準備畫面跳「遺產來囉」：誰淘汰了、你分到幾件 */
          if (run.hp > 0) (run.legNew = run.legNew || []).push({ n: rv.name, av: rv.av, got });
        }
    },
    lobby: (bots, r) => {
      const live = bots.filter(b => !b.out);
      for (const b of bots)
        if (b.out && !b.gone) {
          b.gone = 1;
          legacyDrop(
            b.run,
            b.run.bag,
            live.map(x => x.run),
            b.info.name
          );
        }
    }
  }
};
const modeH = run => (run && MODEH[run.mode]) || {};
/* 0.1.52 背包裡每個印記幾件（只算背包，暫存區、核心不算） */
const sgCount = bag => {
  const n = SIGILS.map(() => 0);
  for (const o of bag.items) if (o.sg != null && !ITEMI[o.id].core) n[o.sg]++;
  return n;
};
/* 開新的一局；rivals 是 3 位對手（ghost.js 配好，或機器人） */
function newRun(rivals) {
  const run = newRunState((Math.random() * 2 ** 31) | 0);
  /* 0.1.52 賽制：開場公開（phase 'mode'）後才選職業；即時機器人跟你同一個賽制 */
  run.rivals = rivals;
  setMode(
    run,
    rollMode(() => r01(run))
  );
  /* 0.1.62 內圈：道具池的主題 */
  setTheme(
    run,
    rollTheme(() => r01(run), run.mode)
  );
  /* 0.1.26 對手的生命在這局裡算（rv.hp），快照只提供每回合的背包 */
  for (const rv of rivals) rv.hp = START_HP;
  Object.assign(run, {
    rivals,
    rp: 0,
    log: [],
    phase: 'prep',
    pend: null,
    place: null
  });
  nextRound(run);
  /* 1-1 開打前先看賽制、再選職業；0.1.59 標準也轉轉盤（每局開場都有一次揭曉） */
  run.phase = 'mode';
  run.clsOpts = rollClasses(run);
  run.clsRe = 1;
  return run;
}
const curRound = run => ROUNDS[run.ri];
/* 商店的一格：照背包等級的機率抽星級；lotto：0.1.35 六合彩的那一輪更常出高星 */
/* ================= 0.1.36 池子 ================= */
/* 一場裡每件道具大家共用一個池子（越稀有越少）：別人背包、暫存區、商店裡的都算拿走了，一件 Ⅱ 階算 3 件、Ⅲ 階 9 件。
   商店照「池子剩幾件」加權抽，別人在收的道具你就比較難刷到（要轉陣）；淘汰的人拿的會回到池子。
   一起算的人：玩家那局是自己＋對手（即時機器人的那局、快照的這回合背包）；機器人那局用 run.lob() 給（不會存進存檔） */
/* 0.1.36 合成變難、PvE 勝率掉太多，放大一點（21／18／15／12／9 → 27／24／20／15／10）；道具可以用 pool 欄位自己指定。
   被魔劍正宗吸收、融合掉、賣掉的會回到池子（已經不在誰身上） */
const POOL = [0, 27, 24, 20, 15, 10];
const poolOf = id => ITEMI[id].pool || POOL[ITEMI[id].star] || 0;
function poolAdd(m, id, t = 1) {
  if (!ITEMI[id] || !shopOK(ITEMI[id])) return;
  m.set(id, (m.get(id) || 0) + 3 ** ((t || 1) - 1));
}
/* 一個人拿著的：一局（背包、暫存區、寄放、商店）或快照的背包（packBag 格式） */
function poolHeld(m, x, shop = true) {
  if (!x) return;
  if (x.it) {
    for (const a of x.it) poolAdd(m, a[0], a[1]), a[8] && poolAdd(m, a[8], a[9] || 1);
    return;
  }
  for (const o of [...x.bag.items, ...x.bench, x.hold]) if (o) poolAdd(m, o.id, o.t), o.f && poolAdd(m, o.f, o.ft || 1);
  if (shop) for (const o of x.shop || []) if (o) poolAdd(m, o.id, o.t);
}
/* 玩家那局的其他人：還活著的對手（即時機器人的那局、其他人這回合的快照） */
function poolOthers(run) {
  if (run.lob) return run.lob();
  const r = curRound(run);
  if (!r || !run.rivals) return [];
  return run.rivals
    .filter(rv => rivalHp(rv) > 0)
    .map(rv => (rv.live ? rv.live.run : (rivalSnap(rv, r.id) || {}).bag))
    .filter(Boolean);
}
/* 大家拿走了多少：selfShop 為 false 時不算自己的商店（重抽商店時舊的會放回去） */
function poolUsed(run, selfShop = false) {
  const m = new Map();
  poolHeld(m, run, selfShop);
  for (const x of poolOthers(run)) poolHeld(m, x);
  return m;
}
/* 池子還剩幾件（不顯示給玩家，跟戰棋遊戲一樣是隱藏的；測試與除錯用） */
const poolLeft = (run, id, used = poolUsed(run, true)) => Math.max(0, poolOf(id) - (used.get(id) || 0));
/* 0.1.36 職業偏好：職業加成的標籤、主題（騎士的盾、鍊金術士的藥水…）的道具，背包越大越常出（等級 1 ×1，每升一級 +CLS_W） */
const CLS_W = 0.3;
function clsShopTags(cls) {
  const C = CLSI[cls];
  if (!C) return [];
  return [...new Set([...(C.m || []).map(b => b.tag), C.th].filter(t => t && t !== 'weapon'))];
}
const clsBoost = run => 1 + CLS_W * ((run.lv || 1) - 1);
/* 0.1.42 下次刷新商店時這件至少出現一次的機率（0～1）：星級機率 × 這件在同星級的權重（池子剩幾件 × 職業偏好），5 格都算；
   舊的商店會放回池子，所以不算自己的商店。不會出現在商店的（核心、送的道具）回傳 null */
function shopChance(run, id) {
  const I = ITEMI[id];
  if (!I || !poolOK(run, I) || run.ri <= 0) return null;
  const od = shopOdds(run),
    used = poolUsed(run),
    tags = clsShopTags(run.bag.cls),
    cb = clsBoost(run),
    w = it => Math.max(0, poolOf(it.id) - (used.get(it.id) || 0)) * (tags.some(t => it.tags.includes(t)) ? cb : 1),
    tot = ITEMS.filter(it => it.star === I.star && poolOK(run, it)).reduce((n, it) => n + w(it), 0),
    p = tot > 0 ? ((od[I.star - 1] || 0) / 100) * (w(I) / tot) : 0;
  return 1 - (1 - p) ** SHOP_N;
}
/* 照權重抽：w(道具) ≤ 0 的不會抽到；全部是 0 回傳 null */
function wpick(run, arr, w) {
  const ws = arr.map(w),
    tot = ws.reduce((a, b) => a + b, 0);
  if (tot <= 0) return null;
  let x = r01(run) * tot;
  for (let i = 0; i < arr.length; i++) if ((x -= ws[i]) < 0) return arr[i];
  return arr[arr.length - 1];
}
/* 商店的一格：照背包等級的機率抽星級，同星級照「池子剩幾件 × 職業偏好」加權；那個星級抽光了就往下找 */
function rollItem(run, lotto, used = poolUsed(run), filt = () => true) {
  const od = lotto ? lottoOdds(shopOdds(run)) : shopOdds(run);
  let x = r01(run) * 100,
    st = 1;
  for (let i = 0; i < 5; i++) {
    if (x < od[i]) {
      st = i + 1;
      break;
    }
    x -= od[i];
  }
  const tags = clsShopTags(run.bag.cls),
    cb = clsBoost(run),
    w = it => Math.max(0, poolOf(it.id) - (used.get(it.id) || 0)) * (tags.some(t => it.tags.includes(t)) ? cb : 1);
  /* 商店不出職業核心（核心只從首領三選一拿） */
  for (const s of [st, ...[5, 4, 3, 2, 1].filter(v => v !== st)]) {
    const it = wpick(
      run,
      ITEMS.filter(it => it.star === s && poolOK(run, it) && filt(it)),
      w
    );
    if (it) return it.id;
  }
  const c = ITEMS.filter(it => it.star === 1 && poolOK(run, it) && filt(it));
  return c.length ? pick(run, c).id : null;
}
/* 0.1.35 六合彩：1～2★ 的機率挪六成給 3～5★（2：4：4） */
function lottoOdds(od) {
  const o = [...od],
    mv = (o[0] + o[1]) * 0.6;
  o[0] *= 0.4;
  o[1] *= 0.4;
  o[2] += mv * 0.2;
  o[3] += mv * 0.4;
  o[4] += mv * 0.4;
  return o;
}
function rollShop(run, lotto) {
  /* 0.1.36 舊的商店放回池子，每抽一格就從池子拿走（同一輪不會抽超過池子剩的） */
  const used = poolUsed(run);
  /* 1-1 開打前的商店全是 1★，前 2 格保證是武器或寵物（不然第一場就打不了） */
  run.shop = Array.from({ length: SHOP_N }, (_, k) => {
    const id =
        run.ri === 0
          ? wpick(
              run,
              ITEMS.filter(i => i.star === 1 && poolOK(run, i) && (k >= 2 || i.dmg)),
              i => Math.max(0.01, poolOf(i.id) - (used.get(i.id) || 0))
            ).id
          : rollItem(run, lotto, used),
      /* Ⅱ 階要池子還有 3 件 */
      t2 = run.ri > 0 && r01(run) * 100 < (BAGLV[run.lv].t2 || 0) && poolOf(id) - (used.get(id) || 0) >= 3;
    /* 賽制：詛咒寶藏換成高一星、印記、七十二變的形狀 */
    const s = { id, t: t2 ? 2 : 1 },
      H = modeH(run);
    if (H.slot) H.slot(run, s, used);
    poolAdd(used, s.id, s.t);
    return s;
  });
  /* 0.1.35 六合彩：價格打亂成 0 金～5★ 的價格（p） */
  if (lotto) for (const s of run.shop) s.p = fl(r01(run) * (5 * 3 ** (s.t - 1) + 1));
}
/* 0.1.59 詛咒寶藏：隨機一個詛咒（沉睡只給武器） */
function curseRoll(run, id) {
  const I = ITEMI[id],
    c = CURSES.map((c, i) => [c, i]).filter(([c]) => !c.w || (I.dmg && !I.block));
  return [c[fl(r01(run) * c.length)][1], 1];
}
/* 0.1.60 祝福：武器才有的（傷害、暴擊、吸血）、有冷卻的才有的（攻速） */
function blessRoll(run, id) {
  const I = ITEMI[id],
    c = BLESS.map((b, i) => [b, i]).filter(([b]) => (!b.w || (I.dmg && !I.block)) && (!b.a || I.dmg || I.block));
  return [c[fl(r01(run) * c.length)][1], 1];
}
/* t：商店也可能直接賣 Ⅱ 階（後期才有），價錢 ×3；p：0.1.35 六合彩打亂過的價格 */
const shopPrice = (run, id, t = 1, p) => (p != null ? p : priceOf(id) * 3 ** ((t || 1) - 1));
/* 0.1.52 狂風市集：價格 -1（最低 1 金；六合彩打亂成 0 金的不變） */
const slotPrice = (run, s) => {
  const p = shopPrice(run, s.id, s.t, s.p),
    H = modeH(run);
  return H.price ? H.price(run, s, p) : p;
};
/* from：商店的那一格（印記、詛咒跟著道具走；賽制的 item 掛勾處理，核心不套） */
function newItem(run, id, t = 1, from = null) {
  const o = {
      u: 'i' + run.un++,
      id,
      t,
      x: 0,
      y: 0,
      r: 0,
      a: null,
      m: ITEMI[id].star === 5 ? roll5(id, runR(run)) : null
    },
    H = modeH(run);
  if (H.item && !ITEMI[id].core) H.item(run, o, from);
  return o;
}
/* 0.1.52 買完：雙胞胎（送一件一樣的）、狂風市集（商店整排換新） */
function afterBuy(run, s, o) {
  /* 0.1.54 記下這件是哪一回合買的（bt）：狂風市集這回合賣 0 金、回扣這回合買了又賣掉的不算 */
  if (o) o.bt = run.ri;
  if (run.twin) {
    run.twin = 0;
    putItem(run, newItem(run, s.id, s.t || 1, s));
  }
  if (modeH(run).bought) modeH(run).bought(run, s, o);
}
const benchFree = run => run.bench.indexOf(null);
/* 從商店買到的一件（付了 p 金）：拖進背包、點了買都走這裡。
   0.1.59 之前拖進背包的另外寫一份，詛咒寶藏的詛咒、六合彩的賣價上限都沒帶到（拖的就能買到沒詛咒的半價高星） */
function shopItem(run, s, p) {
  const o = newItem(run, s.id, s.t || 1, s);
  /* 付得比賣價少（六合彩打亂成 0 金…）：記下來，賣價最多這麼多 */
  if (p < sellO(o, run)) o.pp = p;
  return o;
}
/* 買：放進暫存區，湊滿 3 件就合成 */
function buyItem(run, k) {
  const s = run.shop[k];
  if (!s) return '這格已經買了';
  const p = slotPrice(run, s);
  if (run.gold < p) return '金幣不夠';
  const fi = benchFree(run);
  if (fi < 0 && !wouldMerge(run, s.id, s.t || 1)) return '暫存區滿了，先把道具放進背包或賣掉';
  run.gold -= p;
  /* 0.1.5 暫存區滿了但買了就湊滿 3 件：先放在多出來的一格，合成後收回 */
  const it = shopItem(run, s, p);
  if (fi < 0) run.bench.push(it);
  else run.bench[fi] = it;
  run.shop[k] = null;
  afterBuy(run, s, fi < 0 ? run.bench[run.bench.length - 1] : run.bench[fi]);
  const merged = mergeAll(run, runR(run));
  benchTrim(run);
  kickback(run);
  return { merged };
}
/* 0.1.54 暫存區多出來的格子（滿了還買來合成）收回：放回空格，沒空格就寄放（再不行換成金幣） */
function benchTrim(run) {
  for (const o of run.bench.splice(BENCH_N)) if (o) putItem(run, o);
}
/* 0.1.35 回扣：每買 N 次送一次菁英三選一（mid：準備中途的三選一，選完回到準備；z：送的道具賣價 0） */
function kickback(run) {
  const n = coreProp(bagAll(run.bag), 'kick');
  if (!n || run.pend) return;
  run.kb = (run.kb || 0) + 1;
  if (run.kb % n) return;
  const [a, b] = eliteStars(curRound(run).st);
  run.pend = {
    kind: 'pick',
    t: `回扣：買滿 ${n} 次，送你一次菁英三選一（賣價 0 金）`,
    opts: eliteOpts(run, a, b, false),
    z: 1,
    mid: 1
  };
  if (run.phase === 'prep') run.phase = 'pick';
}
/* 買這件會不會馬上湊滿合成（3 件，二天一流 2 件；暫存區滿了也能買） */
const wouldMerge = (run, id, t = 1) =>
  [...run.bag.items, ...run.bench].filter(o => o && o.id === id && o.t === t).length >=
    mergeNeed([...run.bag.items, ...run.bench, run.bag.core], id) - 1 && t < TIER_MAX;
/* 0.1.1 從商店直接拖進背包：買下並放在 (x, y)（放得下才會叫到這裡）；swap 是被擠出來要收進暫存區的道具 */
function buyToBag(run, k, x, y, r, swap) {
  const s = run.shop[k];
  if (!s) return '這格已經買了';
  const p = slotPrice(run, s);
  if (run.gold < p) return '金幣不夠';
  if (swap && benchFree(run) < 0) return '暫存區滿了，換不下來';
  run.gold -= p;
  if (swap) {
    run.bag.items = run.bag.items.filter(q => q !== swap);
    run.bench[benchFree(run)] = swap;
  }
  run.bag.items.push(Object.assign(shopItem(run, s, p), { x, y, r }));
  run.shop[k] = null;
  afterBuy(run, s, run.bag.items[run.bag.items.length - 1]);
  const merged = mergeAll(run, runR(run));
  benchTrim(run);
  kickback(run);
  return { merged };
}
/* 0.1.1 交換：o 要放到 (tx, ty)，那裡剛好擋著一件 B；B 換到 o 原本的位置（試每個旋轉）。
   o 從暫存區或商店來的話，B 收進暫存區。回傳交換方式，不能換回傳 null */
function swapPlan(run, o, tx, ty, from) {
  const bag = run.bag,
    g = bagGrid(bag),
    hit = new Set();
  for (const [dx, dy] of shapeO(o)) {
    const cx = tx + dx,
      cy = ty + dy;
    if (cx < 0 || cy < 0 || cx >= bag.w || cy >= bag.h) return null;
    const u = g[cy][cx];
    if (u != null && u !== o.u) hit.add(u);
  }
  if (hit.size !== 1) return null;
  const B = bag.items.find(q => q.u === [...hit][0]),
    /* 0.1.29 用 u 比對：拖曳中旋轉時傳進來的 o 是複本（之前用物件比對，自己沒被排除，背包內交換都失敗） */
    rest = bag.items.filter(q => q !== B && q.u !== o.u),
    tmp = { w: bag.w, h: bag.h, items: [...rest, { ...o, x: tx, y: ty }] };
  if (!canPlace({ w: bag.w, h: bag.h, items: rest }, o, tx, ty, o.r)) return null;
  if (from !== 'bag') return B ? { B, toBench: true } : null;
  for (const r of [B.r, (B.r + 1) & 3, (B.r + 2) & 3, (B.r + 3) & 3])
    if (canPlace(tmp, B, o.x, o.y, r)) return { B, x: o.x, y: o.y, r };
  return null;
}
function sellItem(run, u) {
  let o = run.bag.items.find(q => q.u === u);
  if (o) run.bag.items = run.bag.items.filter(q => q !== o);
  else {
    const i = run.bench.findIndex(q => q && q.u === u);
    if (i < 0) return 0;
    o = run.bench[i];
    run.bench[i] = null;
  }
  const v = sellO(o, run);
  run.gold += v;
  if (o.bt === run.ri && run.kb > 0) run.kb--;
  syncShrink(run);
  return v;
}
/* 0.1.33 投機商人：每回合免費刷新次數（run.fr 是這回合用掉的） */
const freeRolls = run => coreProp(bagAll(run.bag), 'freeRoll') - (run.fr || 0);
/* 0.1.35 豪賭：這回合還能刷新幾次（沒有上限回傳 Infinity；run.nr 是這回合刷新過的次數） */
const rollsLeft = run => {
  /* 0.1.52 狂風市集：不能刷新 */
  if (modeH(run).reroll) return 0;
  const c = coreProp(bagAll(run.bag), 'rollCap');
  return c ? Math.max(0, c - (run.nr || 0)) : Infinity;
};
function rerollShop(run) {
  if (modeH(run).reroll) return modeH(run).reroll;
  if (rollsLeft(run) <= 0) return '這回合不能再刷新了';
  if (freeRolls(run) > 0) {
    run.fr = (run.fr || 0) + 1;
    run.nr = (run.nr || 0) + 1;
    rollShop(run);
    return '';
  }
  if (run.gold < REROLL) return '金幣不夠';
  run.gold -= REROLL;
  run.nr = (run.nr || 0) + 1;
  rollShop(run);
  return '';
}
/* 背包升級：變大、商店機率變好；放不下的不會發生（只會變大） */
/* 下一級背包（0.1.9 曾經有開放回合，0.1.12 改回只看金幣） */
const lvOpen = run => !!BAGLV[run.lv + 1];
/* 0.1.35 折價卷：背包升級打折 */
const lvCost = run =>
  BAGLV[run.lv + 1] ? Math.ceil(BAGLV[run.lv + 1].cost * (1 - coreProp(bagAll(run.bag), 'lvOff') / 100)) : 0;
function levelUp(run) {
  if (run.lv >= BAG_MAX) return '背包已經最大了';
  const c = lvCost(run);
  if (run.gold < c) return '金幣不夠';
  run.gold -= c;
  run.lv++;
  run.bag.w = BAGLV[run.lv].w;
  run.bag.h = BAGLV[run.lv].h;
  return '';
}
/* 0.1.25 每回合收入：基礎＋利息＋連勝連敗＋額外金幣（nextRound 與準備畫面的預估共用） */
const incomeOf = (run, gold = run.gold, streak = Math.max(run.ws, run.lsk)) =>
  Math.max(0, BASE_INCOME + Math.min(INTEREST_MAX, fl(gold / 10)) + streakBonus(streak) + bonusGold(run));
/* 打贏的金幣：PvE +2、其他 +1；0.1.59 星象・豐收月 +1 */
const winGold = (r, run) => (r.type === 'pve' ? 2 : 1) + (modeH(run).winBonus ? modeH(run).winBonus(run, r) : 0);
/* 下回合預估拿到的金幣 [輸, 贏]（贏的含打贏獎勵，獎勵也算進利息）；沒有下一回合回傳 null */
function incomeEst(run) {
  const r = curRound(run);
  if (!r || !ROUNDS[run.ri + 1]) return null;
  const w = winGold(r, run);
  return [incomeOf(run, run.gold, run.lsk + 1), w + incomeOf(run, run.gold + w, run.ws + 1)];
}
/* 下一回合：收入、商店 */
function nextRound(run) {
  run.ri++;
  const r = curRound(run);
  run.pend = null;
  run.fr = 0;
  run.nr = 0;
  /* 0.1.52 流浪商隊：每回合換一位商人（不跟上回合同一位）；雙胞胎只在那一回合有效 */
  run.twin = 0;
  if (!r) return endRun(run, finalPlace(run));
  /* 賽制：流浪商隊換商人、遺產過期、法老王開寶庫 */
  if (modeH(run).round) modeH(run).round(run);
  coreSync(run);
  sealTick(run);
  petEvolve(run);
  if (run.ri === 0) {
    run.gold = START_GOLD;
    rollShop(run);
  } else {
    run.gold += incomeOf(run);
    /* 0.1.35 六合彩：每回合第一輪的商店價格打亂、更常出高星 */
    if (!run.lock) rollShop(run, !!coreProp(bagAll(run.bag), 'lotto'));
  }
  run.lock = false;
  run.phase = 'prep';
}
/* ================= 對手 ================= */
/* 0.1.26 本局算血：對手的生命、扣血、淘汰都照這局的勝負（rv.hp）；快照只提供他每回合的背包。
   之前（0.1.10～0.1.25）生命照他自己那局的快照，會出現他剛打贏你、下回合就淘汰，或你一直贏他卻不扣血 */
/* 這回合的快照；他那局在這回合之前就結束了（淘汰或第 1 名）就沿用最後一筆；
   0.1.27 開頭幾回合沒上傳到（例如 1-1 那筆沒存成）就先用他最早的一筆，不要當成淘汰 */
function rivalSnap(rv, rid) {
  const s = rv.snaps || {};
  if (s[rid]) return s[rid];
  const ri = ROUNDS.findIndex(r => r.id === rid);
  for (let k = ri - 1; k >= 0; k--) if (s[ROUNDS[k].id]) return s[ROUNDS[k].id];
  for (let k = ri + 1; k < ROUNDS.length; k++) if (s[ROUNDS[k].id]) return s[ROUNDS[k].id];
  return undefined;
}
/* 加時：他那局已經結束後又過了幾回合；0 = 還有這回合的快照 */
function rivalOT(rv, rid) {
  const s = rv.snaps || {};
  if (s[rid]) return 0;
  const ri = ROUNDS.findIndex(r => r.id === rid);
  for (let k = ri - 1; k >= 0; k--) if (s[ROUNDS[k].id]) return ri - k;
  return 0;
}
/* 加時的快照每多一回合變強一點（他那局結束就沒有之後的快照，用這個代替成長；機器人種子的第 1 名會繼續買，不用這個） */
let OT_DMG = 0.1,
  OT_HP = 0.05;
function otGrow(F, ot) {
  if (!ot) return F;
  const d = 1 + OT_DMG * ot;
  return {
    ...F,
    hp: Math.round(F.hp * (1 + OT_HP * ot)),
    weapons: F.weapons.map(w => ({ ...w, dmg: w.dmg.map(v => Math.max(1, Math.round(v * d))) }))
  };
}
const rivalHp = rv => Math.max(0, rv.hp ?? START_HP);
/* 0.1.36 對手的職業：即時機器人看他那局，快照看任何一筆背包 */
const rivalCls = rv =>
  rv.live
    ? rv.live.run.bag.cls
    : (Object.values(rv.snaps || {}).find(s => s && s.bag && s.bag.cls) || { bag: {} }).bag.cls;
/* 0.1.30 即時機器人還沒推進到這回合也算活著（開戰前才存快照） */
const rivalAlive = (rv, rid) => rivalHp(rv) > 0 && (!!rv.live || !!rivalSnap(rv, rid));
const aliveRivals = run => run.rivals.filter(rv => rivalAlive(rv, curRound(run).id));
/* 他這回合的背包與戰鬥數值（加時的照 otGrow 變強） */
function rivalBag(rv, rid) {
  const sn = rivalSnap(rv, rid),
    bag = unpackBag(sn.bag);
  return { bag, F: otGrow(compileBag(bag), rivalOT(rv, rid)) };
}
/* 對戰輸了多扣的：贏的那邊背包裡的寵物（最多 2） */
const petLoss = bag => Math.min(2, bag.items.filter(o => ITEMI[o.id].tags.includes('pet')).length);
/* 這回合的對手：PvP 輪流打還活著的；其他是野怪 */
function opponentOf(run) {
  const r = curRound(run);
  if (r.type === 'pvp') {
    const al = run.rivals.map((rv, i) => [rv, i]).filter(([rv]) => rivalAlive(rv, r.id));
    if (!al.length) return null;
    const [rv, i] = al.find(([, i]) => i >= run.rp % run.rivals.length) || al[0];
    run.rp = i + 1;
    const { bag, F } = rivalBag(rv, r.id);
    return { kind: 'pvp', n: rv.name, spr: 'a_' + rv.av, F, bag, rv: i };
  }
  const m = mobOf(run, r);
  return { kind: r.type, n: m.n, spr: m.spr, F: m.F };
}
/* 這回合的野怪／菁英／首領：有指定回合的用那一組；其他菁英照階段換一組（照階段放大生命與傷害） */
/* 0.1.12：第 2 階段七宗罪爪牙、第 3 階段墮落十二生肖、第 5 階段起四凶與冥府；4-4 首領是七宗罪之王 */
/* 0.1.29 第 7 階段起菁英換成七宗罪之王等級（kings），再放大一點（ELITE_KING） */
const ELITE_POOL = st =>
  st <= 1 ? MOBS['1-4'] : st === 2 ? MOBS.sins : st <= 4 ? MOBS.zodiac : st <= 6 ? MOBS.fiends : MOBS.kings;
let ELITE_KING = 1.15;
function mobOf(run, r) {
  if (MOBS[r.id]) {
    const m = pick(run, MOBS[r.id]);
    return { n: m.n, spr: m.spr, F: m.F() };
  }
  const m = pick(run, r.type === 'boss' ? MOBS.kings : r.type === 'elite' ? ELITE_POOL(r.st) : MOBS['1-3']),
    k = (r.st <= 2 ? 1.3 : 0.9 + 0.55 * (r.st - 1)) * (r.type === 'elite' && r.st >= 7 ? ELITE_KING : 1),
    F = m.F();
  F.hp = Math.round(F.hp * k);
  F.weapons.forEach(w => (w.dmg = w.dmg.map(v => Math.round(v * k))));
  F.shields.forEach(s => (s.block = Math.round(s.block * k)));
  return { n: (r.type === 'elite' ? (r.st >= 7 ? '魔王・' : '菁英・') : '') + m.n, spr: m.spr, F };
}
/* 菁英戰利品的星級：越後面越高（不含職業核心） */
const eliteStars = st => (st <= 2 ? [2, 3] : st <= 4 ? [3, 4] : st <= 6 ? [4, 5] : [5, 5]);
/* 0.1.29 第 7 階段起商店更常出高星：每過一階段把 1～2★ 的機率挪 8% 給 4～5★（最多 32%） */
function shopOdds(run) {
  const od = [...BAGLV[run.lv].odds],
    r = curRound(run),
    sh = Math.min(32, Math.max(0, ((r ? r.st : 1) - 6) * 8));
  if (!sh) return od;
  let left = sh;
  for (const i of [0, 1]) {
    const m = Math.min(od[i], left);
    od[i] -= m;
    left -= m;
  }
  const got = sh - left;
  od[3] += got / 2;
  od[4] += got / 2;
  return od;
}
/* ================= 戰鬥 ================= */
/* 0.1.19 戰鬥用的生命照階段放大（data.js 的 HP_ST）；回傳複本，不改原本的 */
/* 怪物：生命跟著階段放大（MOB_HP）、傷害放大更多（MOB_DMG；玩家生命變多，怪也要打得痛）。0.1.20 機器人變聰明後重調 */
function stageHp(F, st, mob) {
  const m = hpMul(st);
  if (!mob) return { ...F, hp: Math.round(F.hp * m) };
  const d = 1 + (m - 1) * MOB_DMG;
  return {
    ...F,
    hp: Math.round(F.hp * (1 + (m - 1) * MOB_HP)),
    weapons: F.weapons.map(w => ({ ...w, dmg: w.dmg.map(v => Math.max(1, Math.round(v * d))) }))
  };
}
/* 0.1.62 系別羈絆讓大家變強（首領 2-5 勝率 87% → 100%），怪物生命 ×1.25、傷害倍率 1.5 → 1.7 拉回原本的難度 */
let MOB_HP = 1.25,
  MOB_DMG = 1.7;
/* 開戰：存快照（給別人當對手）、算好整場（固定亂數） */
/* 0.1.33 賄賂：背包有這個核心、金幣超過 N 就付 N，這場（快照也一樣）整場封鎖敵人星級最高的武器 */
/* 0.1.35 也記下開戰時的金幣（bag.gp：鈔能力的加成、金錢標能花的錢） */
function payBribe(run) {
  const b = coreProp(bagAll(run.bag), 'bribe');
  run.bag.pay = b && run.gold > b ? 1 : 0;
  if (run.bag.pay) run.gold -= b;
  run.bag.gp = run.gold;
}
function startFight(run) {
  const r = curRound(run);
  /* 0.1.59 寶庫還沒挑（機器人代打、測試）：拿第一個 */
  if (run.relq) relicPick(run, run.relq.opts[0]);
  payBribe(run);
  if (typeof ghostSnap === 'function') ghostSnap(run, r.id);
  /* 0.1.30 即時機器人先推進到這回合（看的是你上一回合的背包），再記下你這回合的背包給下回合用 */
  liveStep(run, r);
  run.myPrev = packBag(run.bag);
  const opp = opponentOf(run);
  if (!opp) return null;
  opp.F = fightF(run, opp.F, r.st, opp.kind !== 'pvp');
  const me = fightF(run, compileBag(run.bag), r.st),
    res = simulate(me, opp.F, h(run.seed, run.ri, 991));
  return { r, opp, me, res };
}
/* 0.1.12 戰鬥紀錄：秒數、造成與受到的傷害、傷害最高的 5 件、對手的背包（對戰才有）、圖 */
function fightSum(run, fb) {
  const { res, opp } = fb,
    by = {};
  let dealt = 0,
    taken = 0;
  for (const e of res.ev) {
    if (!['hit', 'crit', 'dot', 'thorns', 'fatigue', 'trap', 'corrode', 'boom', 'rain'].includes(e.k)) continue;
    if (e.s === 0) {
      dealt += e.v;
      if (e.u && (e.k === 'hit' || e.k === 'crit')) by[e.u] = (by[e.u] || 0) + e.v;
    } else taken += e.v;
  }
  /* 0.1.21 整局累計：每件道具（照種類）造成的傷害，一局結束存進對局紀錄 */
  run.dmg = run.dmg || {};
  for (const [u, v] of Object.entries(by)) {
    const o = run.bag.items.find(q => q.u === u);
    if (!o) continue;
    const d = (run.dmg[o.id] = run.dmg[o.id] || [o.id, o.t, 0]);
    d[1] = Math.max(d[1], o.t);
    d[2] += v;
  }
  /* 0.1.60 對手那邊每件道具的傷害（對手有背包才有；怪物沒有）、你這場的背包（戰鬥紀錄左右對照） */
  const ob = {};
  if (opp.bag)
    for (const e of res.ev) if (e.s === 1 && e.u && (e.k === 'hit' || e.k === 'crit')) ob[e.u] = (ob[e.u] || 0) + e.v;
  const otop = opp.bag
    ? Object.entries(ob)
        .map(([u, v]) => {
          const o = opp.bag.items.find(q => q.u === u);
          return o ? [o.id, o.t, v] : null;
        })
        .filter(Boolean)
        .sort((a, b) => b[2] - a[2])
        .slice(0, 5)
    : null;
  const top = Object.entries(by)
    .map(([u, v]) => {
      const o = run.bag.items.find(q => q.u === u);
      return o ? [o.id, o.t, v] : null;
    })
    .filter(Boolean)
    .sort((a, b) => b[2] - a[2])
    .slice(0, 5);
  return {
    t: Math.round(res.t * 10) / 10,
    dealt,
    taken,
    top,
    otop,
    spr: opp.spr,
    ob: opp.bag ? packBag(opp.bag) : null,
    mb: packBag(run.bag)
  };
}
/* 0.1.35／0.1.37 打完一場對那一局的影響（side 是那一局在這場的哪一邊）：金錢標花掉的金幣、寒冰之心長的生命；回傳花掉的金幣 */
function afterSim(run, res, side) {
  const sp = (res.spent || [])[side] || 0,
    ice = (res.ice || [])[side] || 0;
  if (sp) run.gold = Math.max(0, run.gold - sp);
  if (ice) for (const o of run.bag.items) if (ITEMI[o.id].iceHp) o.hh = (o.hh || 0) + ITEMI[o.id].iceHp * ice;
  return sp;
}
/* 打完：扣血、連勝連敗、獎勵；回傳這場的結算 */
function finishFight(run, fb) {
  const { r, opp, res } = fb,
    out = { win: res.win, loss: 0, gold: 0 },
    pre = run.rivals.filter(rv => rivalAlive(rv, r.id));
  /* 0.1.35 金錢標花掉的金幣 */
  out.spent = afterSim(run, res, 0);
  /* 0.1.40 這場每件道具觸發了幾次（道具詳細顯示「上一回合觸發 N 次」） */
  run.trig = (res.trig || [])[0] || null;
  if (opp.kind === 'pvp' && run.rivals[opp.rv].live) afterSim(run.rivals[opp.rv].live.run, res, 1);
  if (res.win) {
    run.ws++;
    run.lsk = 0;
    out.gold = winGold(r, run);
    /* 0.1.52 印記：幸運 2 級，打贏 30% 多拿 2 金 */
    if (luckWin(run)) (out.gold += 2), (out.luck = 1);
    /* 0.1.53 馴獸師：寵物成長、捕獲 */
    out.capture = petWin(run, r);
    /* 打贏對手：他扣跟你輸了會扣的一樣多（加上你背包的寵物）；結果視窗顯示他扣多少、是否淘汰 */
    if (opp.kind === 'pvp') {
      const rv = run.rivals[opp.rv];
      rv.lw = [r.id, false];
      out.hit = r.loss + petLoss(run.bag);
      rv.hp = rivalHp(rv) - out.hit;
      out.ko = rivalHp(rv) <= 0;
    }
  } else {
    run.lsk++;
    run.ws = 0;
    out.loss = r.loss + (opp.kind === 'pvp' ? petLoss(opp.bag) : 0);
    run.hp -= out.loss;
    if (opp.kind === 'pvp') run.rivals[opp.rv].lw = [r.id, true];
  }
  run.gold += out.gold;
  run.log.push({ id: r.id, type: r.type, win: res.win, opp: opp.n, loss: out.loss, ...fightSum(run, fb) });
  /* 菁英：三選一道具（星級照階段）；首領：三選一職業核心 */
  if (r.type === 'elite') {
    const [a, b] = eliteStars(r.st);
    run.pend = {
      kind: 'pick',
      t: '菁英的戰利品：選一件',
      opts: eliteOpts(run, a, b, res.win),
      tier: eliteTier(run, res.win)
    };
    /* 0.1.33 商人：打完菁英多拿金幣 */
    const eg = (CLSI[run.bag.cls] || {}).eliteGold || 0;
    if (eg) (run.gold += eg), (out.gold += eg);
  }
  if (r.type === 'boss') {
    /* 0.1.10 2-5 抽自己職業的專屬核心；0.1.34 4-4 不再是副核心，改成第二個專屬核心（融入第一個，不佔格子） */
    const mc = mainCore(run),
      o = bossCores(run);
    run.pend = {
      kind: 'pick',
      t: r.st > 2 && mc ? '首領掉落了第二個專屬核心：選一個融入你的核心' : '首領掉落了專屬核心：選一個',
      opts: o
    };
  }
  rivalFights(run, fb);
  liveAfter(run, r);
  /* 賽制：遺產市集分淘汰者的背包 */
  if (modeH(run).fought) modeH(run).fought(run, r);
  if (run.hp <= 0) {
    /* 0.1.27 同回合倒下的對手：扣完剩得比你多（負得少）的排你前面；大家一起倒下時你最多第 2 */
    const al = aliveRivals(run).length,
      ahead = pre.filter(rv => rivalHp(rv) <= 0 && rv.hp > run.hp).length;
    run.hp = 0;
    endRun(run, Math.max(2, 1 + al + ahead));
  } else if (!aliveRivals(run).length) endRun(run, 1);
  return out;
}
/* 0.1.26 沒打你的對手這回合也要打：對戰回合剩下的兩個用快照背包互打，
   野怪／菁英／首領回合每個對手都打同一隻怪；輸的照這局的規則扣血。
   0.1.27 只剩一個（存活 3 人）時不輪空：他打你這回合的背包，只有他會扣血（不然只有你每回合都要冒險） */
function rivalFights(run, fb) {
  const { r, opp } = fb,
    al = run.rivals.filter((rv, i) => rivalAlive(rv, r.id) && !(opp.kind === 'pvp' && i === opp.rv));
  if (opp.kind === 'pvp') {
    /* 0.1.29 6 人：沒打你的對手兩兩互打（每回合換組合）；落單的那位打你這回合的背包，只有他會扣血 */
    const n = al.length,
      rot = n ? run.ri % n : 0,
      q = [...al.slice(rot), ...al.slice(0, rot)];
    for (let k = 0; k + 1 < n; k += 2) {
      const [a, b] = [q[k], q[k + 1]].map(rv => rivalBag(rv, r.id)),
        res = simulate(fightF(run, a.F, r.st), fightF(run, b.F, r.st), h(run.seed, run.ri, 992 + k));
      const lr = q[res.win ? k + 1 : k];
      if (q[k].live) afterSim(q[k].live.run, res, 0);
      if (q[k + 1].live) afterSim(q[k + 1].live.run, res, 1);
      q[k].lw = [r.id, res.win];
      q[k + 1].lw = [r.id, !res.win];
      lr.hp = rivalHp(lr) - r.loss - petLoss((res.win ? a : b).bag);
    }
    if (n % 2) {
      const lone = q[n - 1],
        a = rivalBag(lone, r.id),
        res = simulate(fightF(run, a.F, r.st), fb.me, h(run.seed, run.ri, 994));
      if (lone.live) afterSim(lone.live.run, res, 0);
      lone.lw = [r.id, res.win];
      if (!res.win) lone.hp = rivalHp(lone) - r.loss - petLoss(run.bag);
    }
    return;
  }
  al.forEach((rv, j) => {
    const res = simulate(fightF(run, rivalBag(rv, r.id).F, r.st), opp.F, h(run.seed, run.ri, 993 + j));
    if (rv.live) afterSim(rv.live.run, res, 0);
    rv.lw = [r.id, res.win];
    if (!res.win) rv.hp = rivalHp(rv) - r.loss;
  });
}
/* 打到最後一回合：比剩下的生命 */
function finalPlace(run) {
  const last = ROUNDS[ROUNDS.length - 1].id;
  return 1 + run.rivals.filter(rv => rivalAlive(rv, last) && rivalHp(rv) > run.hp).length;
}
const HIST_FULL = 10;
function endRun(run, place) {
  if (run.place) return;
  run.place = place;
  run.phase = 'end';
  const d = (PLACE_PTS[place] || 0) * ((S.games || 0) < PLACE_N ? 2 : 1);
  run.delta = d;
  run.rk0 = (S.games || 0) >= PLACE_N ? rankOf(S.rating) : -1;
  S.rating = Math.max(0, S.rating + d);
  S.games = (S.games || 0) + 1;
  S.best = Math.min(S.best || 9, place);
  /* 0.1.21 對局紀錄多存：職業、最後的背包、整局每件道具的傷害、每一場的摘要（不存對手背包，省空間）；只有最近 HIST_FULL 局留詳細 */
  const full = {
    cls: run.bag.cls || null,
    bag: packBag(run.bag),
    dmg: Object.values(run.dmg || {})
      .sort((a, b) => b[2] - a[2])
      .slice(0, 12),
    log: (run.log || []).map(({ ob, mb, ...l }) => l),
    /* 0.1.44 核心三選一紀錄 */
    cl: run.coreLog || []
  };
  S.hist = [{ at: Date.now(), place, d, r: curRound(run) ? curRound(run).id : 'end', ...full }, ...(S.hist || [])]
    .slice(0, 30)
    .map((x, i) => (i < HIST_FULL ? x : { at: x.at, place: x.place, d: x.d, r: x.r }));
  if (typeof ghostEnd === 'function') ghostEnd(run);
}
/* 0.1.29 菁英的三選一（星級 a～b）：保底一件職業主打的武器（照職業加成的標籤，沒有就任何武器），位置隨機 */
function clsWeaponTags(cls) {
  const C = CLSI[cls];
  if (!C) return ['weapon'];
  const t = [...new Set([...(C.m || []).map(b => b.tag), C.th].filter(Boolean))].filter(tag =>
    ITEMS.some(i => i.dmg && shopOK(i) && i.tags.includes(tag))
  );
  return t.length ? t : ['weapon'];
}
/* 0.1.35 劍修大師：打贏菁英時三選一必定是 Ⅱ 階（沒有就 1） */
const eliteTier = (run, win = true) => {
  const mc = mainCore(run);
  return (win && mc && (defsOf(mc).find(d => d.eliteT) || {}).eliteT) || 1;
};
function eliteOpts(run, a, b, win = true) {
  /* 0.1.33 劍修大師：打贏菁英時三件都是那個標籤的武器（0.1.35 可以是幾個標籤） */
  const mc = mainCore(run),
    all = win && mc && (defsOf(mc).find(d => d.eliteAll) || {}).eliteAll;
  if (all) {
    const ts = [all].flat(),
      isA = i => poolOK(run, i) && i.dmg && ts.some(t => i.tags.includes(t));
    let wp = ITEMS.filter(i => isA(i) && i.star >= a && i.star <= b);
    if (wp.length < 3) wp = ITEMS.filter(i => isA(i) && i.star <= b);
    const o = [];
    for (let k = 0; o.length < 3 && k < 30; k++) {
      const id = pick(run, wp).id;
      if (!o.includes(id) || wp.length < 3) o.push(id);
    }
    return o;
  }
  const pool = ITEMS.filter(i => poolOK(run, i) && i.star >= a && i.star <= b),
    tags = clsWeaponTags(run.bag.cls),
    isW = i => i.dmg && tags.some(t => i.tags.includes(t));
  let wp = pool.filter(isW);
  if (!wp.length) wp = ITEMS.filter(i => poolOK(run, i) && i.star <= b && isW(i));
  const o = [0, 1].map(() => pick(run, pool).id);
  if (wp.length) o.splice(fl(runR(run)() * 3), 0, pick(run, wp).id);
  else o.push(pick(run, pool).id);
  return o;
}
/* 三選一的獎勵放進暫存區 */
/* 0.1.6 暫存區滿了：剛好湊滿 3 件就先放多出來的一格合成；不然玩家的話先寄放在 run.hold（下回合空出位置再領），不會卡住 */
/* 0.1.29 專屬核心（背包或暫存區）；第二個核心（0.1.34 起是專屬核心，以前是副核心）直接融入它 */
const mainCore = run => run.bag.core || [...run.bag.items, ...run.bench].find(o => o && ITEMI[o.id].core === 1);
/* 0.1.42 核心不佔格子：背包、暫存區、寄放裡的核心（舊存檔、舊快照）搬到 bag.core；多的第二個融入它 */
function coreSync(run) {
  const bag = run.bag;
  for (const o of [...bag.items, ...run.bench, run.hold]) {
    if (!o || !ITEMI[o.id].core) continue;
    bag.items = bag.items.filter(q => q !== o);
    const i = run.bench.indexOf(o);
    if (i >= 0) run.bench[i] = null;
    if (run.hold === o) run.hold = null;
    if (!bag.core) bag.core = o;
    else if (!bag.core.sc && o.id !== bag.core.id) bag.core.sc = o.id;
  }
}
/* 0.1.33 保鏢：拿到時送 N 隻隨機 X★ 寵物（暫存區滿了就換成賣價）；0.1.35 第一桶金送錢（gain）、魔劍正宗送一件道具（give，暫存區滿了先寄放） */
function giveGift(run, id) {
  const I = ITEMI[id],
    G = I.gift;
  if (I.gain) run.gold += I.gain;
  if (I.give && ITEMI[I.give]) putItem(run, newItem(run, I.give));
  /* 0.1.37 煉成：接著三次三選一藥劑效果 */
  if (I.brew) run.pend = brewPend(run, [], I.brew, run.pend && run.pend.mid);
  if (!G) return;
  const pool = ITEMS.filter(i => poolOK(run, i) && i.star === G[0] && i.tags.includes(G[1]));
  for (let k = 0; k < G[2] && pool.length; k++) {
    const o = newItem(run, pick(run, pool).id),
      f2 = benchFree(run);
    if (f2 >= 0) run.bench[f2] = o;
    else run.gold += sellOf(o.id, o.t);
  }
}
/* 送的道具放進暫存區；滿了先寄放，寄放也有了就換成賣價 */
function putItem(run, o) {
  const f2 = benchFree(run);
  if (f2 >= 0) run.bench[f2] = o;
  else if (!run.hold) run.hold = o;
  else run.gold += sellOf(o.id, o.t);
}
/* 0.1.53 馴獸師打贏一場：背包裡的寵物成長 +1 層（最多 10）；捕獲（野怪、菁英，機率拿一隻寵物）。回傳捕獲到的道具代號 */
function petWin(run, r) {
  if ((CLSI[run.bag.cls] || {}).F && CLSI[run.bag.cls].F.petGrow)
    for (const o of run.bag.items) if (ITEMI[o.id].tags.includes('pet')) o.gw = Math.min(10, (o.gw || 0) + 1);
  const cap = coreProp(bagAll(run.bag), 'capture');
  if (!cap || (r.type !== 'pve' && r.type !== 'elite') || r01(run) * 100 >= cap) return null;
  const id = vanRoll(run, shopTop(run), it => it.tags.includes('pet'));
  if (!id) return null;
  putItem(run, newItem(run, id));
  mergeAll(run, runR(run));
  return id;
}
/* 0.1.53 遠古之器：獻祭寵物（us 是道具 u），累積星數（vessel 的 sv），每 VESSEL_N 星召喚一隻四兇（先給還沒有的）。
   回傳召喚到的四兇代號；失敗回傳原因 */
const sacOK = o => o && ITEMI[o.id].tags.includes('pet') && !PERILS.includes(o.id);
function sacrifice(run, us) {
  const v = [...run.bag.items, ...run.bench, run.hold].find(o => o && ITEMI[o.id].sacrifice);
  if (!v) return '沒有遠古之器';
  const ps = us.map(u => findU(run, u)).filter(sacOK);
  if (!ps.length) return '要選寵物';
  /* 0.1.54 湊滿要召喚四兇時要有地方放（選的寵物有在暫存區就會空出來） */
  const gain = ps.reduce((n, o) => n + ITEMI[o.id].star * 3 ** (o.t - 1), 0);
  if ((v.sv || 0) + gain >= VESSEL_N && benchFree(run) < 0 && run.hold && !ps.some(o => run.bench.includes(o)))
    return '暫存區和寄放都滿了，先騰出一格再召喚';
  for (const o of ps) {
    takeOut(run, o.u);
    v.sv = (v.sv || 0) + ITEMI[o.id].star * 3 ** (o.t - 1);
  }
  const got = [];
  while (v.sv >= VESSEL_N) {
    v.sv -= VESSEL_N;
    const own = new Set([...run.bag.items, ...run.bench, run.hold].filter(Boolean).map(o => o.id)),
      c = PERILS.filter(id => !own.has(id)),
      id = (c.length ? c : PERILS)[fl(r01(run) * (c.length || PERILS.length))];
    putItem(run, newItem(run, id));
    got.push(id);
  }
  syncShrink(run);
  return got;
}
/* 0.1.53 進化：寵物在背包裡每待滿 N 回合升一階（Ⅲ 階開詞綴） */
function petEvolve(run) {
  const n = coreProp(bagAll(run.bag), 'evolve');
  if (!n) return;
  for (const o of run.bag.items) {
    if (!ITEMI[o.id].tags.includes('pet') || o.t >= TIER_MAX) continue;
    o.ev = (o.ev || 0) + 1;
    if (o.ev < n) continue;
    o.ev = 0;
    o.t++;
    o.a = affOf(o.id, runR(run));
    if (o.t === TIER_MAX) {
      if (!o.m) (o.m = roll5(o.id, runR(run))), (o.mv = 0);
      else if (!o.m2) (o.m2 = roll5(o.id, runR(run))), (o.mv2 = 0);
    }
  }
  mergeAll(run, runR(run));
}
/* 0.1.52 印記：幸運 2 級（4 件）以上，打贏 30% 多拿 2 金 */
const luckWin = run => !!modeH(run).luck && modeH(run).luck(run);
/* ================= 0.1.52 流浪商隊 ================= */
/* 能被商人換掉的道具：商店買得到的（不是核心、不是核心送的） */
const vanOK = o => o && ITEMI[o.id] && shopOK(ITEMI[o.id]);
/* 道具的類型（變形師、血契用）：寵物、武器、盾、防具、藥水、飾品 */
const itemCat = I =>
  I.tags.includes('pet')
    ? 'pet'
    : I.dmg
      ? 'weapon'
      : I.block
        ? 'shield'
        : I.tags.includes('armor')
          ? 'armor'
          : I.tags.includes('potion')
            ? 'potion'
            : 'trinket';
/* 一件道具在背包或暫存區：拿出來 */
function takeOut(run, u) {
  const o = run.bag.items.find(q => q.u === u);
  if (o) {
    run.bag.items = run.bag.items.filter(q => q !== o);
    return o;
  }
  const i = run.bench.findIndex(q => q && q.u === u);
  if (i < 0) return null;
  const b = run.bench[i];
  run.bench[i] = null;
  return b;
}
const findU = (run, u) => run.bag.items.find(q => q.u === u) || run.bench.find(q => q && q.u === u);
/* 商店現在最高能出到幾星 */
const shopTop = run => {
  const od = shopOdds(run);
  for (let i = 4; i >= 0; i--) if (od[i] > 0) return i + 1;
  return 1;
};
/* 隨機一件 star 星、符合 f 的商店道具（照池子） */
const vanRoll = (run, star, f = () => true) => rollItem(run, false, poolUsed(run), it => it.star === star && f(it));
/* 跟商人交易：a 是參數（煉金：[u, u]；鐵匠、變形：u；血契：'weapon'／'def'／'trinket'）；成功回傳 { got: 拿到的道具 }，失敗回傳原因 */
function vanDo(run, a) {
  const v = run.van && VANI[run.van.k];
  if (!v) return '這回合沒有商人';
  if (run.van.done) return '這位商人這回合已經交易過了';
  if (v.k !== 'blood' && run.gold < v.c) return '金幣不夠';
  /* 0.1.54 拿到的道具要有地方放（暫存區或寄放），不然會被默默換成金幣 */
  const full = () => benchFree(run) < 0 && !!run.hold;
  let got = null;
  if (v.k === 'alch') {
    const [x, y] = (a || []).map(u => findU(run, u));
    if (!vanOK(x) || !vanOK(y) || x === y) return '要選 2 件商店買得到的道具';
    if (x.t > 1 || y.t > 1 || x.f || y.f) return '只能用 Ⅰ 階、沒融合過的道具';
    const st = ITEMI[x.id].star;
    if (st !== ITEMI[y.id].star) return '2 件要同星級';
    if (st >= 5) return '5★ 已經最高了';
    if (full() && !run.bench.includes(x) && !run.bench.includes(y)) return '暫存區和寄放都滿了，先騰出一格';
    const id = vanRoll(run, st + 1);
    if (!id) return '商店已經沒有高一星的道具了';
    takeOut(run, x.u);
    takeOut(run, y.u);
    got = newItem(run, id);
    putItem(run, got);
  } else if (v.k === 'smith') {
    const o = findU(run, a);
    if (!o || ITEMI[o.id].core) return '要選背包或暫存區的道具';
    if (o.t < 2) return '要 Ⅱ 階以上';
    if (o.m && o.m2) return '已經有兩條詞綴了';
    const m = roll5(o.id, runR(run));
    if (!o.m) (o.m = m), (o.mv = 0);
    else (o.m2 = m), (o.mv2 = 0);
    got = o;
  } else if (v.k === 'gamble') {
    if (full()) return '暫存區和寄放都滿了，先騰出一格';
    const id = vanRoll(run, 1 + fl(r01(run) * 4));
    if (!id) return '商店已經沒有道具了';
    got = newItem(run, id);
    putItem(run, got);
  } else if (v.k === 'morph') {
    const o = findU(run, a);
    if (!vanOK(o)) return '這件不能變形（核心送的道具不行）';
    if (o.f) return '融合過的道具不能變形';
    const I = ITEMI[o.id],
      c = ITEMS.filter(it => it.star === I.star && poolOK(run, it) && it.id !== I.id && itemCat(it) === itemCat(I));
    if (!c.length) return '沒有同類型的道具可以變';
    const id = pick(run, c).id,
      inBag = run.bag.items.includes(o);
    if (inBag && full()) {
      const t = { ...o, id };
      if (!canPlace({ ...run.bag, items: run.bag.items.filter(q => q !== o) }, t, o.x, o.y, o.r))
        return '變形後的形狀放不下，暫存區和寄放也滿了';
    }
    o.id = id;
    o.a = o.t > 1 ? affOf(id, runR(run)) : null;
    /* 0.1.54 詞綴數量保留（Ⅲ 階、鐵匠開的、5★ 的），照新道具重抽 */
    if (o.m || ITEMI[id].star === 5) (o.m = roll5(id, runR(run))), (o.mv = 0);
    if (o.m2) (o.m2 = roll5(id, runR(run))), (o.mv2 = 0);
    o.sm = 0;
    /* 0.1.59 七十二變：換成新道具這局的形狀 */
    if (shmOf(run, id)) o.sh = shmOf(run, id);
    else delete o.sh;
    /* 形狀可能不一樣：原地放不下就收進暫存區 */
    if (inBag && !canPlace({ ...run.bag, items: run.bag.items.filter(q => q !== o) }, o, o.x, o.y, o.r)) {
      run.bag.items = run.bag.items.filter(q => q !== o);
      putItem(run, o);
    }
    got = o;
  } else if (v.k === 'twin') run.twin = 1;
  else if (v.k === 'blood') {
    if (run.hp <= v.c) return `生命要超過 ${v.c}`;
    if (full()) return '暫存區和寄放都滿了，先騰出一格';
    /* 0.1.54 照道具類型篩（武器不含寵物；防具含盾；飾品含藥水） */
    const f =
      a === 'weapon'
        ? it => itemCat(it) === 'weapon'
        : a === 'def'
          ? it => itemCat(it) === 'shield' || itemCat(it) === 'armor'
          : it => itemCat(it) === 'trinket' || itemCat(it) === 'potion';
    const st = Math.min(5, shopTop(run) + 1),
      id = vanRoll(run, st, f) || vanRoll(run, Math.max(1, st - 1), f);
    if (!id) return '商店已經沒有這一類的道具了';
    run.hp -= v.c;
    got = newItem(run, id);
    putItem(run, got);
  }
  if (v.k !== 'blood') run.gold -= v.c;
  run.van.done = 1;
  mergeAll(run, runR(run));
  return { got };
}
/* ================= 0.1.59 法老王的遺物 ================= */
/* 從還沒人有的遺物抽 n 個 */
function relicOpts(rand, n, own = []) {
  const c = RELICS.map(x => x.k).filter(k => !own.includes(k)),
    out = [];
  while (out.length < n && c.length) out.push(c.splice(fl(rand() * c.length), 1)[0]);
  return out;
}
/* 機器人那局挑一個（照戰力評估，q 以外隨機）：從 opts 拿走、放進 bag.rel */
function relicTake(run, opts, q = 0.7, P) {
  const c = opts.filter(k => !(run.bag.rel || []).includes(k));
  if (!c.length) return null;
  const k =
    typeof botRelic === 'function' && r01(run) < q
      ? c.map(k => [k, botRelic(run, k, P)]).sort((a, b) => b[1] - a[1])[0][0]
      : c[fl(r01(run) * c.length)];
  opts.splice(opts.indexOf(k), 1);
  run.bag.rel = [...(run.bag.rel || []), k];
  return k;
}
/* 玩家那局開寶庫：還活著的人一人一件、多一件備選；生命比你低的先挑（即時機器人照評估拿到真的遺物，快照隨機拿走一個選項），
   你從剩下的挑（relq），比你高的等你挑完再挑（relicPick） */
function relicOpen(run) {
  const al = run.rivals.filter(rv => rivalHp(rv) > 0),
    opts = relicOpts(() => r01(run), al.length + 2, run.bag.rel || []),
    took = [];
  if (opts.length < 2) return;
  for (const rv of al.filter(rv => rivalHp(rv) < run.hp).sort((a, b) => rivalHp(a) - rivalHp(b))) {
    if (opts.length <= 1) break;
    const k = rv.live ? relicTake(rv.live.run, opts, rv.live.q) : opts.splice(fl(r01(run) * opts.length), 1)[0];
    if (k) took.push([rv.name, k]);
  }
  run.relq = { opts, took };
}
/* 玩家挑一件；比你生命高的即時機器人接著挑 */
function relicPick(run, k) {
  const q = run.relq;
  if (!q || !q.opts.includes(k)) return '這件不能挑';
  run.bag.rel = [...(run.bag.rel || []), k];
  q.opts.splice(q.opts.indexOf(k), 1);
  for (const rv of run.rivals.filter(rv => rv.live && rivalHp(rv) > 0 && rivalHp(rv) >= run.hp))
    if (q.opts.length) relicTake(rv.live.run, q.opts, rv.live.q);
  run.relq = null;
  return '';
}
/* ================= 0.1.59 遺產市集 ================= */
/* 淘汰的人的背包（核心以外）一件一件隨機分給 to（還活著的那幾局），放在遺產攤位 run.leg，LEGACY_RC 回合後消失（lx 是最後一回合；ex 是終極藥劑的效果，不要撞名） */
/* 回傳 run 自己分到幾件 */
function legacyDrop(run, bag, to, from) {
  let got = 0;
  if (!to.length) return got;
  for (const o of bag.items || []) {
    /* 只分商店買得到的（核心送的魔劍正宗、封印、遠古之器這種不分給別的職業） */
    if (!vanOK(o)) continue;
    const who = to[fl(r01(run) * to.length)],
      { u, x, y, r, ...e } = o;
    (who.leg = who.leg || []).push({ ...e, lx: who.ri + LEGACY_RC, from });
    if (who === run) got++;
  }
  return got;
}
/* 遺產的價格：半價＝它的賣價（Ⅱ 階、Ⅲ 階照階數算，融合的輔助也算）。
   0.1.59 跟賣價一樣，買了馬上賣掉不會賺（之前融合過的照本體半價賣，賣掉多拿輔助那份） */
const legPrice = (run, e) => Math.max(1, sellO({ ...e, z: 0 }));
/* 買遺產：放進暫存區（保留階數、詞綴、印記、詛咒、形狀），湊滿就合成 */
function legacyBuy(run, k) {
  const e = run.leg && run.leg[k];
  if (!e) return '這件已經沒了';
  const p = legPrice(run, e);
  if (run.gold < p) return '金幣不夠';
  const fi = benchFree(run);
  if (fi < 0 && !wouldMerge(run, e.id, e.t || 1)) return '暫存區滿了，先把道具放進背包或賣掉';
  run.gold -= p;
  const { lx, from, ...rest } = e,
    o = { ...rest, u: 'i' + run.un++, x: 0, y: 0, r: 0, bt: run.ri };
  if (fi < 0) run.bench.push(o);
  else run.bench[fi] = o;
  run.leg.splice(k, 1);
  const merged = mergeAll(run, runR(run));
  benchTrim(run);
  return { merged };
}
/* 0.1.37 煉成的一步：從還沒選過的效果抽 3 個（ex 是已經選的，n 是總共幾步） */
function brewPend(run, ex, n = 3, mid) {
  const ks = Object.keys(BREW).filter(k => !ex.includes(k)),
    opts = [];
  while (opts.length < 3 && ks.length) opts.push(ks.splice(fl(r01(run) * ks.length), 1)[0]);
  return {
    kind: 'pick',
    brew: n,
    ex,
    opts,
    t: `煉成（${ex.length + 1}／${n}）：選一個藥劑效果`,
    ...(mid ? { mid: 1 } : {})
  };
}
/* 0.1.37 別西卜的封印：每回合 +1，到 SEAL_RC 回合變成別西卜（形狀變大，背包放不下就收進暫存區） */
function sealTick(run) {
  for (const o of [...run.bag.items, ...run.bench, run.hold]) {
    const I = o && ITEMI[o.id];
    if (!I || !I.hatch) continue;
    o.rc = (o.rc || 0) + 1;
    if (o.rc < SEAL_RC) continue;
    const old = o.id,
      osh = o.sh;
    o.id = I.hatch;
    o.rc = 0;
    /* 0.1.59 孵化後是它自己的形狀（不跟七十二變） */
    delete o.sh;
    if (!run.bag.items.includes(o) || canPlace(run.bag, o, o.x, o.y, o.r)) continue;
    const sp = findSpot({ ...run.bag, items: run.bag.items.filter(q => q !== o) }, o);
    if (sp) Object.assign(o, sp);
    else if (benchFree(run) >= 0) {
      run.bag.items = run.bag.items.filter(q => q !== o);
      run.bench[benchFree(run)] = o;
    } else (o.id = old), (o.rc = SEAL_RC - 1), osh && (o.sh = osh);
  }
}
/* 首領的核心三選一：自己職業的專屬核心，排除已經有的（第一個和融入的） */
function bossCores(run) {
  const mc = mainCore(run),
    own = mc ? [mc.id, mc.sc] : [],
    ban = (MODEI[run.mode] || {}).ban || [],
    cs = ITEMS.filter(
      i => i.core === 1 && (!run.bag.cls || i.cls === run.bag.cls) && !own.includes(i.id) && !ban.some(k => i[k])
    ).map(i => i.id),
    o = [];
  while (o.length < Math.min(3, cs.length)) {
    const c = pick(run, cs);
    if (!o.includes(c)) o.push(c);
  }
  return o;
}
/* 0.1.35 三選一的階（pend.tier，劍修大師 Ⅱ 階）、回扣送的賣價 0（pend.z） */
function takePick(run, id, hold) {
  /* 0.1.44 核心統計：記下首領三選一給了哪些、選了哪個（run.coreLog，對局紀錄與 tools/core_stats.js 用） */
  if (ITEMI[id] && ITEMI[id].core && run.pend && run.pend.opts)
    (run.coreLog = run.coreLog || []).push({ o: [...run.pend.opts], p: id, r: (curRound(run) || {}).id || '' });
  /* 0.1.37 煉成的三選一：記下效果，選滿就送終極藥劑 */
  if (run.pend && run.pend.brew) {
    const P = run.pend,
      ex = [...P.ex, id];
    if (ex.length < P.brew) run.pend = brewPend(run, ex, P.brew, P.mid);
    else {
      run.pend = null;
      putItem(run, Object.assign(newItem(run, 'ultelixir'), { ex }));
    }
    return '';
  }
  const mc = ITEMI[id].core && mainCore(run),
    P = run.pend || {},
    t = P.tier || 1,
    mk = () => Object.assign(newItem(run, id, t), P.z ? { z: 1 } : {});
  if (mc && mc.id !== id) {
    mc.sc = id;
    run.pend = null;
    giveGift(run, id);
    syncShrink(run);
    return '';
  }
  /* 0.1.42 第一個核心：直接放進核心欄，不佔背包、暫存區 */
  if (ITEMI[id].core) {
    run.bag.core = newItem(run, id);
    run.pend = null;
    giveGift(run, id);
    syncShrink(run);
    return '';
  }
  const fi = benchFree(run);
  if (fi < 0 && !wouldMerge(run, id, t)) {
    if (!hold) return '暫存區滿了，先騰出一格';
    /* 0.1.54 寄放已經有東西：玩家要先處理；機器人把舊的賣掉（之前會直接蓋掉、道具消失） */
    if (run.hold) {
      if (!run.auto) return '暫存區和寄放都滿了，先領取或賣掉寄放的道具';
      run.gold += sellO(run.hold, run);
    }
    run.hold = mk();
    run.pend = null;
    giveGift(run, id);
    return '';
  }
  if (fi < 0) run.bench.push(mk());
  else run.bench[fi] = mk();
  run.pend = null;
  giveGift(run, id);
  mergeAll(run, runR(run));
  for (const o of run.bench.splice(BENCH_N)) if (o) run.bench[benchFree(run)] = o;
  return '';
}
/* 領取寄放的戰利品：暫存區有空位就放進去，不然找背包的空位 */
function claimHold(run) {
  const o = run.hold;
  if (!o) return '';
  const fi = benchFree(run);
  if (fi >= 0) run.bench[fi] = o;
  else {
    const sp = findSpot(run.bag, o);
    if (!sp) return '還是放不下：先賣掉或擺好一件道具';
    Object.assign(o, sp);
    run.bag.items.push(o);
  }
  run.hold = null;
  mergeAll(run, runR(run));
  return '';
}
/* ================= 機器人對手（沒有真人快照時補位；跟玩家用同一套規則跑一整局） ================= */
const THEMES = ['sword', 'bow', 'dagger', 'fire', 'pet', 'shield', 'mace', 'cold', 'poison'];
/* 機器人一場（0.1.0）：4 個機器人用跟玩家一樣的規則跑一整局，每回合真的用背包互打（同一套戰鬥模擬），
   生命與淘汰照實際勝負；強的背包活得久。回傳每個機器人的快照（開戰前的生命與背包）、名次。
   rating 越高的機器人買法越聰明（q：照戰力評估做決定的機率，見 bot.js）。 */
/* 一個機器人（第 i 個；rr 是這一場共用的亂數）：自己的一局、職業、主題、聰明程度 q、每回合多拿的金幣 gb */
function mkBot(seed, i, rr, rating, opt = {}) {
  const s = h(seed, i, 31),
    rt = Math.max(600, (rating || 1000) + fl((rr() - 0.5) * 150));
  const run = newRunState(s, opt.mode || 'std'),
    opts = rollClasses(run),
    /* 0.1.52 opt.cls：指定每個機器人的職業（種子輪流用） */
    cls = (opt.cls && opt.cls[i]) || opts[fl(rr() * 3)];
  run.bag.cls = cls;
  /* 0.1.52 機器人合成時的印記自動選（auto） */
  run.auto = 1;
  giveStarter(run);
  return {
    run,
    theme: CLSI[cls].th || THEMES[fl(rr() * THEMES.length)],
    q: Math.max(0.3, Math.min(0.95, 0.6 + (rt - 1000) / 800)),
    /* 0.1.20 機器人的腦（bot.js）：opt.P[i] 給訓練用（第 i 個機器人用哪組參數），opt.old[i] 用舊的買法比較 */
    P: (opt.P && opt.P[i]) || BOT_P,
    old: !!(opt.old && opt.old[i]),
    /* 0.1.6 牌階越高的機器人每回合多拿一點金幣（越往上越強）；鐵牌、銅牌少拿 */
    gb: Math.max(-2, Math.min(5, fl((rt - 1000) / 200))),
    info: {
      name: randName(rng(h(s, 9))),
      av: AVATARS[(s >>> 3) % AVATARS.length][0],
      rating: rt,
      snaps: {}
    },
    out: null
  };
}
/* 打完一回合：經濟（打贏拿金幣、連勝連敗）、菁英三選一（照評估挑）、首領核心（隨機）。simLobby 和即時機器人共用 */
function botAfter(run, r, win, q, P) {
  if (win) {
    run.ws++;
    run.lsk = 0;
    run.gold += winGold(r, run) + (luckWin(run) ? 2 : 0);
    petWin(run, r);
  } else {
    run.lsk++;
    run.ws = 0;
  }
  if (r.type !== 'elite' && r.type !== 'boss') return;
  const [a, c] = eliteStars(r.st);
  /* 打完馬上拿（nextRound 會清掉 pend，留到下回合就拿不到了）；暫存區滿了先寄放，下回合 botAct 處理。
     0.1.29 菁英跟玩家一樣三選一（保底職業武器），照評估挑 */
  if (r.type === 'elite') {
    run.gold += (CLSI[run.bag.cls] || {}).eliteGold || 0;
    const opts = eliteOpts(run, a, c, win),
      tier = eliteTier(run, win),
      best =
        r01(run) < q
          ? opts.map(id => [id, botValue(run, id, tier, P, {}).gain]).sort((x, y) => y[1] - x[1])[0][0]
          : opts[0];
    run.pend = { kind: 'pick', opts, tier };
    takePick(run, best, true);
  } else {
    /* 0.1.34 首領核心：跟玩家一樣三選一（4-4 是第二個專屬核心），照評估挑 */
    const opts = bossCores(run);
    if (!opts.length) return;
    const best =
      r01(run) < q ? opts.map(id => [id, botValue(run, id, 1, P, {}).gain]).sort((x, y) => y[1] - x[1])[0][0] : opts[0];
    run.pend = { kind: 'pick', opts };
    takePick(run, best, true);
    /* 0.1.37 煉成：馬上選完三步 */
    for (let g = 0; g < 5 && run.pend && run.pend.brew; g++) botPend(run, q, P);
  }
}
function simLobby(seed, rating, opt = {}) {
  const rr = rng(h(seed, 5)),
    /* 0.1.52 一場的機器人同一個賽制（opt.mode 指定，不然照權重抽） */
    mode = opt.mode || rollMode(rng(h(seed, 6))),
    bots = [...Array(LOBBY_N).keys()].map(i => mkBot(seed, i, rr, rating, { ...opt, mode }));
  /* 0.1.62 一場同一個主題（opt.theme 指定，不然照種子抽） */
  const theme = opt.theme || rollTheme(rng(h(seed, 10)), mode);
  for (const b of bots) b.run.theme = theme;
  /* 0.1.59 一場共用的資料（七十二變的形狀表、星象的順序） */
  const H = MODEH[mode] || {},
    share = modeShareOf(mode, rng(h(seed, H.salt || 8)));
  for (const b of bots) {
    modeShare(b.run, share);
    modeFix(b.run);
  }
  /* 0.1.36 池子：同一場的機器人共用（淘汰的不算） */
  for (const b of bots) b.run.lob = () => bots.filter(x => x !== b && !x.out).map(x => x.run);
  let order = 0;
  for (let k = 0; k < ROUNDS.length; k++) {
    const alive = bots.filter(b => !b.out);
    /* 0.1.23 加時：只剩第 1 名時，他照回合表繼續逛商店、打野怪菁英首領，每回合存快照（ot: 1），一直到最後一回合，
       玩家打到後面遇到的是真的在換裝備的背包。對戰回合沒人可打，勝負各半；加時不扣他自己的血（改由玩家打贏時扣）。
       opt.short：只要名次（訓練、平衡統計）就不跑加時 */
    if (!alive.length || (alive.length === 1 && (opt.short || bots.length === 1))) break;
    const solo = alive.length === 1;
    /* 0.1.28 其他人平均幾隻寵物（機器人照這個決定要不要買反制寵物的道具） */
    const pets = b => b.run.bag.items.filter(o => ITEMI[o.id].tags.includes('pet')).length,
      tot = alive.reduce((n, b) => n + pets(b), 0);
    for (const b of alive) b.run.epet = alive.length > 1 ? (tot - pets(b)) / (alive.length - 1) : 1;
    /* 0.1.29 其他人的威脅（每種異常、回復、暴擊的比例），抗異常道具照這個估價 */
    const thr = new Map(alive.map(b => [b, botThreat(compileBag(b.run.bag))]));
    for (const b of alive) {
      const os = alive.filter(x => x !== b);
      if (!os.length) continue;
      b.run.eres = {};
      for (const k in BOT_ERES0) b.run.eres[k] = os.reduce((n, x) => n + thr.get(x)[k], 0) / os.length;
    }
    for (const b of alive) {
      nextRound(b.run);
      if (b.run.ri > 0) b.run.gold = Math.max(0, b.run.gold + b.gb);
      if (b.old) botActOld(b.run, b.theme, b.q);
      else botAct(b.run, b.theme, b.q, b.P);
      payBribe(b.run);
    }
    const r = ROUNDS[k];
    for (const b of alive)
      b.info.snaps[r.id] = { hp: b.run.hp, bag: solo ? { ...packBag(b.run.bag), ot: 1 } : packBag(b.run.bag) };
    alive.forEach((b, i) => {
      const run = b.run;
      let F;
      if (solo && r.type === 'pvp') {
        if (rng(h(seed, k, 77))() < 0.5) {
          run.ws++;
          run.lsk = 0;
          run.gold += 1;
        } else {
          run.lsk++;
          run.ws = 0;
        }
        return;
      }
      if (r.type === 'pvp') {
        /* 輪流打其他還活著的機器人（打的是對方這回合的快照，只影響自己） */
        const o = alive[(i + 1 + (k % (alive.length - 1))) % alive.length];
        F = compileBag(o.run.bag);
      } else F = mobOf(run, r).F;
      const res = simulate(
        fightF(run, compileBag(run.bag), r.st),
        fightF(run, F, r.st, r.type !== 'pvp'),
        h(seed, k, i)
      );
      afterSim(run, res, 0);
      /* 0.1.10 跟玩家一樣的經濟：打贏拿金幣、連勝連敗（之前沒算，機器人的背包比玩家窮、快照偏弱） */
      if (!res.win && !solo) run.hp -= r.loss;
      botAfter(run, r, res.win, b.q, b.P);
    });
    for (const b of alive) if (b.run.hp <= 0) b.out = ++order;
    /* 賽制：遺產市集分淘汰者的背包、法老王的遺物（生命低的先挑） */
    if (H.lobby) H.lobby(bots, r, rr);
  }
  /* 名次：越晚淘汰越前面；活到最後的照剩下生命 */
  const rk = [...bots].sort((a, b) => (b.out || 99) - (a.out || 99) || b.run.hp - a.run.hp);
  rk.forEach((b, i) => (b.info.place = i + 1));
  /* 0.1.44 核心統計用：職業、三選一紀錄、最後的核心（不會上傳到快照） */
  for (const b of bots) {
    const c = b.run.bag.core;
    b.info.stat = { cls: b.run.bag.cls, log: b.run.coreLog || [], core: c ? [c.id, c.sc || null] : [] };
  }
  return bots.map(b => b.info);
}
/* ================= 即時機器人（0.1.30） ================= */
/* 跟玩家一起一回合一回合推進的機器人對手：每回合開戰前才逛商店、擺背包（liveStep），打完照這局的勝負拿金幣、三選一（liveAfter）。
   買東西時看得到「大家上一回合的背包」（跟玩家看得到對手背包一樣，不偷看這回合），你的背包權重 LIVE_ME 倍，會針對你的陣容買反制。
   rv.live = { run: 他自己的一局, theme, q, gb }；快照照樣存進 rv.snaps，其他流程（對手互打、戰鬥紀錄）不用改 */
const LIVE_ME = 2;
function liveBots(n, rating, seed = (Math.random() * 2 ** 31) | 0) {
  if (n <= 0) return [];
  const rr = rng(h(seed, 5));
  return [...Array(n).keys()].map(i => {
    const b = mkBot(seed, i, rr, rating);
    return { ...b.info, live: { run: b.run, theme: b.theme, q: b.q, gb: b.gb } };
  });
}
/* 這回合開戰前：還活著的即時機器人推進到這回合（逛商店、擺背包），存這回合的快照。已經存過就不重算（重新整理不會變） */
function liveStep(run, r) {
  const al = run.rivals.filter(rv => rv.live && rivalHp(rv) > 0 && !(rv.snaps || {})[r.id]);
  if (!al.length) return;
  /* 大家上一回合的背包：你的（myPrev）＋每位對手上一筆快照 */
  const prev = [];
  if (run.myPrev) prev.push({ rv: null, w: LIVE_ME, bag: run.myPrev });
  const pr = ROUNDS[run.ri - 1];
  if (pr)
    for (const rv of run.rivals) {
      const sn = rivalHp(rv) > 0 && rivalSnap(rv, pr.id);
      if (sn) prev.push({ rv, w: 1, bag: sn.bag });
    }
  for (const p of prev) {
    const b = unpackBag(p.bag);
    p.pets = b.items.filter(o => ITEMI[o.id].tags.includes('pet')).length;
    p.thr = botThreat(compileBag(b));
  }
  for (const rv of al) {
    const L = rv.live,
      br = L.run,
      os = prev.filter(p => p.rv !== rv),
      W = os.reduce((n, p) => n + p.w, 0);
    /* 0.1.36 池子：這個機器人以外的人（你這局、其他即時機器人的那局、快照的這回合背包） */
    br.lob = () => [
      run,
      ...run.rivals
        .filter(x => x !== rv && rivalHp(x) > 0)
        .map(x => (x.live ? x.live.run : (rivalSnap(x, r.id) || {}).bag))
        .filter(Boolean)
    ];
    while (br.ri < run.ri) {
      nextRound(br);
      if (br.ri > 0) br.gold = Math.max(0, br.gold + L.gb);
    }
    if (W) {
      br.epet = os.reduce((n, p) => n + p.pets * p.w, 0) / W;
      br.eres = {};
      for (const k in BOT_ERES0) br.eres[k] = os.reduce((n, p) => n + p.thr[k] * p.w, 0) / W;
    }
    botAct(br, L.theme, L.q, BOT_P);
    payBribe(br);
    delete br.lob;
    rv.snaps = rv.snaps || {};
    rv.snaps[r.id] = { hp: rivalHp(rv), bag: packBag(br.bag) };
    /* 存檔不要越來越大：即時機器人只留這回合和上一回合的快照（下回合看的就是這兩筆） */
    for (const k of Object.keys(rv.snaps)) if (k !== r.id && (!pr || k !== pr.id)) delete rv.snaps[k];
  }
}
/* 這回合打完：即時機器人照這局的勝負（rv.lw = [回合, 贏了沒]）拿金幣、連勝連敗、菁英／首領三選一 */
function liveAfter(run, r) {
  for (const rv of run.rivals)
    if (rv.live && rv.lw && rv.lw[0] === r.id && rivalHp(rv) > 0) botAfter(rv.live.run, r, rv.lw[1], rv.live.q, BOT_P);
}
/* 補位用的 n 位機器人對手（從一場機器人對局裡取） */
function makeBots(n, rating) {
  /* 0.1.11 真人快照夠了就不用跑機器人（一場機器人對局要算好一陣子） */
  if (n <= 0) return [];
  return simLobby((Math.random() * 2 ** 31) | 0, rating).slice(0, n);
}
