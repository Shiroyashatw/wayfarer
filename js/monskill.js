/* 漫步勇者 · 0.3.38 怪物招式（battle.js 之後載入；單人與組隊共用，enemyResolve 呼叫） */
'use strict';
/* 怪物每次行動先看招式：冷卻（自己的行動次數）好了的招式有機率放出來，否則普通攻擊。
   招式依怪物本名、稀有度、元素、種族固定（同一種怪每次一樣），越強的怪越多招：
   一般／魔法 1、稀有 2、菁英與紅名 3、地城首領 4、大王（地獄領主、閻羅王、七罪的王、四凶、燭龍、生肖、亡靈王…）5、七宗罪之王 6。
   m 傷害倍率、t 'one' 打一人／'all' 打全隊、el 元素（沒寫用怪物自己的）、dot 對人的持續傷害、stun／frz 機率讓人跳過下一次行動、
   debuff 給人的負面增益（3 跳＝9 秒）、self 對自己（rage 狂暴、shield 護盾、heal 回血、summon 召喚爪牙）、hits 連打幾下、drain 吸血比例 */
const MSK = {
  heavy: { n: '重擊', cd: 3, t: 'one', m: 1.9 },
  multi: { n: '連擊', cd: 3, t: 'one', m: 0.6, hits: 3 },
  sweep: { n: '橫掃', cd: 3, t: 'all', m: 0.85 },
  rend: { n: '撕咬', cd: 3, t: 'one', m: 1.1, dot: 'bleed' },
  bash: { n: '震擊', cd: 4, t: 'one', m: 1.2, stun: 0.5 },
  venom: { n: '毒牙', cd: 3, t: 'one', m: 1, el: 'chaos', dot: 'poison' },
  firebr: { n: '烈焰吐息', cd: 4, t: 'all', m: 0.9, el: 'fire', dot: 'burn' },
  frostbr: { n: '冰霜吐息', cd: 4, t: 'all', m: 0.8, el: 'cold', frz: 0.35 },
  thunder: { n: '落雷', cd: 4, t: 'all', m: 0.85, el: 'light', stun: 0.25 },
  chaosb: { n: '混沌彈', cd: 3, t: 'one', m: 1.4, el: 'chaos', dot: 'poison' },
  drain: { n: '吸取生命', cd: 4, t: 'one', m: 1.2, drain: 0.6 },
  sunder: { n: '碎甲', cd: 4, t: 'one', m: 1, debuff: { n: '碎甲', arm: -40 } },
  weaken: { n: '虛弱詛咒', cd: 5, t: 'all', m: 0, debuff: { n: '虛弱', more: -25 } },
  roar: { n: '怒吼', cd: 5, self: 'rage' },
  harden: { n: '硬化', cd: 5, self: 'shield' },
  heal: { n: '再生', cd: 5, self: 'heal' },
  summon: { n: '召喚爪牙', cd: 6, self: 'summon' },
  meteor: { n: '天降隕石', cd: 6, t: 'all', m: 1.5, el: 'fire', dot: 'burn' },
  doom: { n: '終焉', cd: 7, t: 'all', m: 2, el: 'chaos' }
};
/* 元素招式（第一招）、種族招式、各階級加上的招式池 */
const MSK_EL = {
  phys: ['rend', 'bash'],
  fire: ['firebr'],
  cold: ['frostbr'],
  light: ['thunder'],
  chaos: ['chaosb', 'venom']
};
const MSK_T2 = ['heavy', 'multi'],
  MSK_T3 = ['sweep', 'roar', 'sunder'],
  MSK_T4 = ['heal', 'harden', 'summon'],
  MSK_T5 = ['meteor', 'weaken'];
const strHash = s => [...String(s)].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) >>> 0, 7);
/* 這隻怪物的階級（招式數）：boss 是地城或戰鬥的首領 */
function monTier(e, boss) {
  if (e.sin === 'king') return 6;
  const big = boss && (e.big || e.sin || e.yama || e.xiong || e.zhulong || e.zod || (e.rar || 0) >= 4);
  if (big) return 5;
  if (boss) return 4;
  return [1, 1, 2, 3, 3][e.rar || 0] || 1;
}
/* 招式清單（固定）：e 可以是戰鬥中的敵人或地圖上的怪物（{bn, rar, el, ud, …}） */
function monSkills(e, boss) {
  const n = monTier(e, boss),
    r = strHash((e.bn || e.name) + '|' + (e.rar || 0)),
    pick = (a, k) => a[(r >>> k) % a.length],
    out = [];
  const add = k => k && !out.includes(k) && out.push(k);
  add(pick(MSK_EL[e.el] || MSK_EL.phys, 2));
  if (e.ud) add('drain');
  if (n >= 2) add(pick(MSK_T2, 5));
  if (n >= 3) add(pick(MSK_T3, 7));
  if (n >= 4) add(pick(MSK_T4, 9));
  if (n >= 5) add(pick(MSK_T5, 11));
  if (n >= 6) add('doom');
  /* 補到該有的數量 */
  for (const k of [...MSK_T2, ...MSK_T3, ...MSK_T4, ...MSK_T5, 'doom']) if (out.length < n) add(k);
  return out.slice(0, Math.max(n, e.ud ? 2 : 1));
}
const monSkillNames = (e, boss) => monSkills(e, boss).map(k => MSK[k].n);
/* 隊員的抗性陣列（火冰雷混沌；元素弱化扣元素） */
const resArr = (st, ew = 0) =>
  (Array.isArray(st.res) ? st.res : [st.res.fire, st.res.cold, st.res.light, st.res.chaos || 0]).map((v, k) =>
    k < 3 ? v - ew : v
  );
const dmgCol = pk =>
  pk.chaos > pk.phys
    ? '#c86aff'
    : pk.fire > pk.phys
      ? '#ffb15a'
      : pk.cold > pk.phys
        ? '#9fe7ff'
        : pk.light > pk.phys
          ? '#fff27a'
          : '#ff8a8a';
/* 招式打一個隊員：閃避、護甲與抗性、受傷降低、格擋、生死簿、心靈凌駕；回傳實際傷害 */
function mHit(e, p, m, el, ev, at, ext) {
  const st = p.st;
  if (Math.random() * 100 < Math.min(75, (st.dodge || 0) + bsum(p, 'dodge'))) {
    ev.push({ t: 'dodge', who: p.uid, at });
    return 0;
  }
  const pk = { phys: 0, fire: 0, cold: 0, light: 0, chaos: 0 },
    atk = e.atk * m * rnd(0.9, 1.1) * (e.rage > 0 ? 1.35 : 1) * (e.curse > 0 && e.curseW ? 1 - e.curseW / 100 : 1);
  pk[el || e.el || 'phys'] += atk;
  let d = Math.round(
    mitigate(pk, st.armor * (p.guard > 0 ? 2 : 1) * (1 + bsum(p, 'arm') / 100), resArr(st, ext.ew || 0), false) *
      (1 - Math.min(75, (st.dmgRed || 0) + bsum(p, 'dmgRed')) / 100)
  );
  if (st.block && Math.random() * 100 < st.block) {
    d = Math.round(d * 0.3);
    ev.push({ t: 'st', who: p.uid, s: '格擋', col: '#9fd4ef', at });
  }
  if (p.doom) {
    d *= 2;
    p.doom = 0;
    ev.push({ t: 'st', who: p.uid, s: '生死簿應驗', col: '#c86aff', at });
  }
  const toMp = takeDmg(p, st, d);
  ev.push({ t: 'dmg', who: p.uid, d: d - toMp, mp: toMp, strong: m >= 1.5, col: dmgCol(pk), at });
  if (p.hp <= 0 && p.alive !== false) {
    p.alive = false;
    ev.push({ t: 'down', who: p.uid, at: at + 200 });
  }
  return d;
}
/* 敵人這次行動要不要放招：回傳招式代號或 null（冷卻在 e.mcd，單位是自己的行動次數） */
function monPick(e, boss, es) {
  const sks = (e.msk = e.msk || monSkills(e, boss)),
    cd = (e.mcd = e.mcd || {});
  for (const k in cd) if (cd[k] > 0) cd[k]--;
  const ok = sks.filter(k => {
    if (cd[k] > 0) return false;
    const q = MSK[k];
    if (q.self === 'heal') return e.hp < e.maxhp * 0.6;
    if (q.self === 'summon') return aliveIdx(es).length < 4 && es.length < 5;
    if (q.self === 'rage') return !(e.rage > 0);
    if (q.self === 'shield') return !(e.eshield > 0);
    return true;
  });
  if (!ok.length || Math.random() > (monTier(e, boss) >= 4 ? 0.55 : 0.4)) return null;
  const k = ok[fl(Math.random() * ok.length)];
  cd[k] = MSK[k].cd;
  return k;
}
/* 放招：回傳 {ev, at}（接在 enemyResolve 的開頭行動之後） */
function monCast(k, e, i, es, party, at, ext) {
  const q = MSK[k],
    ev = [];
  ev.push({ t: 'msg', s: `${e.name} 使出「${q.n}」！`, at });
  ev.push({ t: 'lunge', i, at });
  at += 260;
  if (q.self) {
    if (q.self === 'rage') {
      e.rage = 3;
      ev.push({ t: 'st', i, s: '狂暴', col: '#ff8a6a', at });
    } else if (q.self === 'shield') {
      e.eshield = Math.round(e.maxhp * 0.2);
      ev.push({ t: 'st', i, s: `護盾 ${e.eshield}`, col: '#9fd4ef', at });
    } else if (q.self === 'heal') {
      const v = Math.round(e.maxhp * 0.18);
      e.hp = Math.min(e.maxhp, e.hp + v);
      ev.push({ t: 'st', i, s: `+${v}`, col: '#7bd36b', at });
    } else if (q.self === 'summon') {
      const b = pickMon(fl(Math.random() * 1e6), e.lv),
        mn = eInit(makeEnemy(b, Math.max(1, e.lv - 2), 0));
      mn.minion = 1;
      es.push(mn);
      if (ext.av) ext.av['e' + (es.length - 1)] = 0;
      if (typeof B !== 'undefined' && B && B.es === es) BFX.en.push({ a: null, flash: 0 });
      ev.push({ t: 'st', i: es.length - 1, s: '召喚', col: '#c86aff', at });
    }
    ev.push({ t: 'end', at: at + 500 });
    return { ev, at: at + 500 };
  }
  const alive = party.filter(p => p.alive !== false && p.hp > 0);
  if (!alive.length) return { ev, at };
  const tgs = q.t === 'all' ? alive : [alive[fl(Math.random() * alive.length)]];
  for (let h2 = 0; h2 < (q.hits || 1); h2++)
    for (const p of tgs) {
      if (p.alive === false) continue;
      const d = q.m ? mHit(e, p, q.m, q.el, ev, at, ext) : 0;
      if (q.drain && d > 0) {
        const v = Math.round(d * q.drain);
        e.hp = Math.min(e.maxhp, e.hp + v);
        ev.push({ t: 'st', i, s: `吸血 +${v}`, col: '#7bd36b', at: at + 60 });
      }
      if (p.alive === false) continue;
      if (q.dot && (d > 0 || !q.m)) {
        p.pdot = { n: Math.max(1, Math.round(e.atk * 0.3)), turns: 3, k: q.dot };
        ev.push({
          t: 'st',
          who: p.uid,
          s: { burn: '燃燒', poison: '中毒', bleed: '流血' }[q.dot],
          col: '#ff9a6a',
          at: at + 80
        });
      }
      if ((q.stun && Math.random() < q.stun) || (q.frz && Math.random() < q.frz && !p.st.noFreeze)) {
        p.frozen = 1;
        ev.push({ t: 'st', who: p.uid, s: q.frz ? '凍結' : '暈眩', col: '#9fe7ff', at: at + 100 });
      }
      if (q.debuff) {
        const { n: dn, ...v } = q.debuff;
        p.buffs = (p.buffs || []).filter(b => b.id !== 'm_' + k);
        p.buffs.push({ id: 'm_' + k, n: dn, turns: 3, bad: 1, ...v });
        ev.push({ t: 'st', who: p.uid, s: dn, col: '#c86aff', at: at + 120 });
      }
    }
  at += 300 + 120 * ((q.hits || 1) - 1);
  if (e.hp <= 0) ev.push({ t: 'kill', i, at });
  ev.push({ t: 'end', at: at + 300 });
  return { ev, at: at + 300 };
}
