/* dungeonPOE · 資料表：版本、主角、技能、地圖階級、裝備欄與底材、詞綴（T12～T1）、怪物、王 */
'use strict';
const VER = '0.2.3';
const KEY = 'dungeonpoe_v1';
const SLOT = new URLSearchParams(location.search).get('p') || '';

/* ---------- 主角（等級每升一級：生命 +12、魔力 +3、物理傷害 +4%） ---------- */
const HERO = { hp: 120, mp: 60, mpReg: 5, spd: 230, dmg: [6, 10], crit: 5, critX: 1.5 };
const LVMAX = 60;
const xpNeed = lv => Math.round(40 * Math.pow(lv, 1.7));

/* ---------- 技能寶石（0.2.2）：技能欄固定 5 格（左鍵、右鍵、Q、E、R），每格 1 顆技能＋2 顆輔助 ----------
   t 出手時間（吃攻速）、mp 魔力、cd 冷卻、m 傷害倍率、tags 標籤（輔助看標籤）、el 傷害全部轉成這個屬性、cls 主題（0.1 的職業） */
const SKILLS = {
  slash: {
    n: '斬擊',
    ic: 'sk_slash2',
    cls: 'ronin',
    t: 0.36,
    mp: 0,
    m: 1,
    r: 100,
    arc: 2.1,
    gain: 2,
    tags: ['attack', 'melee'],
    d: '向前揮出扇形斬擊，打中每隻回 2 魔力'
  },
  swallow: {
    n: '燕返',
    ic: 'sk_crosscut',
    cls: 'ronin',
    t: 0.5,
    mp: 6,
    m: 0.85,
    r: 110,
    arc: 2.4,
    tags: ['attack', 'melee'],
    d: '連砍兩刀：先往前、再反手一刀'
  },
  whirl: {
    n: '旋風斬',
    ic: 'sk_whirl',
    cls: 'ronin',
    t: 0.4,
    mp: 18,
    cd: 3,
    m: 1.8,
    r: 150,
    tags: ['attack', 'melee', 'aoe', 'cd'],
    d: '原地迴旋，打周圍所有敵人並擊退'
  },
  iai: {
    n: '居合突進',
    ic: 'sk_iai',
    cls: 'ronin',
    t: 0.22,
    mp: 12,
    cd: 4,
    m: 1.5,
    dist: 300,
    tags: ['attack', 'melee', 'move', 'cd'],
    d: '衝向滑鼠位置，斬過路上的敵人；衝刺中無敵'
  },
  quake: {
    n: '震地',
    ic: 'sk_groundslam',
    cls: 'knight',
    t: 0.55,
    mp: 14,
    m: 2,
    r: 170,
    arc: 1.4,
    stun: 0.6,
    tags: ['attack', 'melee', 'aoe'],
    d: '往前重擊地面，扇形範圍的敵人暈眩 0.6 秒'
  },
  blade: {
    n: '飛刃',
    ic: 'sk_fanblade',
    cls: 'assassin',
    t: 0.42,
    mp: 6,
    m: 0.8,
    spd: 760,
    pierce: 2,
    cnt: 1,
    tags: ['attack', 'proj'],
    d: '射出飛刃，穿透 2 隻'
  },
  storm: {
    n: '千本櫻',
    ic: 'sk_bladestorm',
    cls: 'assassin',
    t: 0.45,
    mp: 24,
    cd: 6,
    m: 0.9,
    cnt: 10,
    spd: 620,
    pierce: 3,
    tags: ['attack', 'proj', 'cd'],
    d: '向四面八方射出 10 把飛刃，各穿透 3 隻'
  },
  venom: {
    n: '毒刃雨',
    ic: 'sk_poisoncloud',
    cls: 'assassin',
    t: 0.4,
    mp: 16,
    m: 0.35,
    r: 110,
    dur: 3,
    el: 'chaos',
    tags: ['spell', 'aoe', 'dot'],
    d: '在滑鼠位置下 3 秒毒刃雨：範圍裡的敵人每秒受混沌傷害'
  },
  fireball: {
    n: '火球',
    ic: 'sk_fire',
    cls: 'pyro',
    t: 0.45,
    mp: 9,
    m: 1.1,
    spd: 560,
    r: 70,
    cnt: 1,
    pierce: 0,
    el: 'fire',
    tags: ['spell', 'proj', 'aoe'],
    d: '射出火球，打中爆炸（範圍火焰傷害）'
  },
  nova: {
    n: '火焰新星',
    ic: 'sk_fireburst',
    cls: 'pyro',
    t: 0.4,
    mp: 15,
    m: 1.3,
    r: 165,
    el: 'fire',
    tags: ['spell', 'aoe'],
    d: '以自己為中心爆出一圈火焰'
  },
  meteor: {
    n: '隕石',
    ic: 'sk_meteor',
    cls: 'pyro',
    t: 0.5,
    mp: 28,
    cd: 5,
    m: 3.2,
    r: 125,
    delay: 0.7,
    el: 'fire',
    tags: ['spell', 'aoe', 'cd'],
    d: '0.7 秒後隕石砸在滑鼠位置，大範圍火焰傷害'
  },
  wolf: {
    n: '召喚戰狼',
    ic: 'sk_bloodhowl',
    cls: 'tamer',
    t: 0.5,
    mp: 20,
    cd: 2,
    m: 0.5,
    cnt: 2,
    tags: ['minion', 'cd'],
    d: '叫出 2 隻戰狼（這張地圖一直跟著你）；再放一次會補滿'
  }
};
/* 輔助寶石：need 要有其中一個標籤才生效 */
const SUPPORTS = {
  multi: { n: '多重投射', ic: 'sup_sp_multi', need: ['proj'], d: '投射物 +2，傷害 ×0.8' },
  pierce: { n: '穿透', ic: 'sup_sp_pen', need: ['proj'], d: '投射物多穿透 3 隻' },
  area: { n: '範圍擴大', ic: 'sup_sp_aoe', need: ['aoe', 'melee'], d: '範圍 ×1.4' },
  fury: { n: '狂暴', ic: 'sup_sp_dmg', need: [], d: '傷害 ×1.35，魔力消耗 ×1.4' },
  haste: { n: '連擊', ic: 'sup_sp_fastatk', need: ['attack', 'spell'], d: '出手速度 ×1.25' },
  crit: { n: '致命', ic: 'sup_sp_crit', need: [], d: '暴擊率 +10%、暴擊傷害 +40%' },
  leech: { n: '吸血', ic: 'sup_sp_leech', need: [], d: '造成傷害的 3% 回復生命' },
  cdr: { n: '冷卻縮減', ic: 'sup_sp_cd', need: ['cd'], d: '冷卻 ×0.65' },
  fireadd: { n: '附加火焰', ic: 'sup_sp_gfire', need: [], d: '多造成傷害 25% 的火焰傷害' },
  heavy: { n: '重擊', ic: 'sup_sp_heavy', need: ['melee'], d: '擊退 ×2、傷害 ×1.15' },
  pack: { n: '群狼', ic: 'sup_sp_pet', need: ['minion'], d: '多 1 隻狼、狼的傷害 ×1.3' }
};
/* 寶石等級：上限 20、不能超過角色等級；每級傷害 +6%（輔助每級 +1%） */
const GEM_MAX = 20;
const gemNeed = lv => Math.round(30 * lv * lv);

/* ---------- 天賦樹（0.2.3，照 PoE）：一千多個點，中間挖空放昇華；6 個方向，每升一級 1 點 ----------
   起點是中間的一圈（6 個門，免費），往外三條主幹＋一團一團的「星團」（中間是大點），最外面是基石（強但有代價） */
const STATN = {
  hpP: ['生命', '%'],
  armorP: ['護甲', '%'],
  as: ['攻速', '%'],
  crit: ['暴擊率', '%'],
  critX: ['暴擊傷害', '%'],
  aoe: ['範圍', '%'],
  mpP: ['魔力', '%'],
  mpReg: ['魔力回復', '%'],
  cdr: ['冷卻縮減', '%'],
  dmgA: ['傷害', '%'],
  meleeP: ['近戰傷害', '%'],
  projP: ['投射物傷害', '%'],
  spellP: ['法術傷害', '%'],
  minionP: ['召喚物傷害', '%'],
  eleP: ['元素傷害', '%'],
  resA: ['全部抗性', '%'],
  regen: ['每秒回復生命', ''],
  flask: ['藥水回復', '%'],
  block: ['格擋', '%'],
  ms: ['移動速度', '%'],
  blood: ['技能改用生命施放（不耗魔力）', '']
};
const PT_SECT = [
  {
    n: '體魄',
    c: '#d9534f',
    ic: 'asc_s_heart',
    sm: [{ hpP: 3 }, { armorP: 6 }, { hpP: 2, regen: 1 }],
    nt: [
      { hpP: 10, regen: 3 },
      { armorP: 25, block: 3 },
      { hpP: 8, resA: 6 }
    ],
    names: [
      '強健',
      '鐵骨',
      '不屈',
      '磐石',
      '厚皮',
      '頑強',
      '堅韌',
      '不倒',
      '血氣',
      '鋼筋',
      '泰山',
      '金剛',
      '古樹',
      '巨像'
    ],
    ks: { n: '鐵壁', ic: 'asc_s_anvil', s: { armorP: 100, block: 8, ms: -10 } }
  },
  {
    n: '劍技',
    c: '#e8a33d',
    ic: 'asc_s_sword',
    sm: [{ meleeP: 5 }, { meleeP: 3, as: 2 }, { dmgA: 4 }],
    nt: [
      { meleeP: 20, as: 4 },
      { meleeP: 15, critX: 15 },
      { aoe: 10, meleeP: 12 }
    ],
    names: [
      '斬鐵',
      '劍意',
      '刃風',
      '一刀',
      '劍心',
      '鋒芒',
      '劍氣',
      '十字',
      '迴刃',
      '居合',
      '劍魂',
      '破甲',
      '連斬',
      '斷空'
    ],
    ks: { n: '劍聖', ic: 'asc_s_sword', s: { meleeP: 50, projP: -40, spellP: -40 } }
  },
  {
    n: '身法',
    c: '#7bd36b',
    ic: 'asc_s_wind',
    sm: [{ as: 2 }, { ms: 2 }, { as: 1, crit: 1 }],
    nt: [
      { as: 8, ms: 4 },
      { as: 6, critX: 10 },
      { ms: 6, block: 3 }
    ],
    names: [
      '疾風',
      '燕身',
      '輕功',
      '流水',
      '殘影',
      '迅雷',
      '飛燕',
      '踏雪',
      '無影',
      '風行',
      '游龍',
      '靈猴',
      '電光',
      '追風'
    ],
    ks: { n: '疾風之道', ic: 'asc_s_feather', s: { as: 20, ms: 10, hpP: -20 } }
  },
  {
    n: '必殺',
    c: '#ffd166',
    ic: 'asc_s_eye',
    sm: [{ crit: 1.5 }, { critX: 6 }, { crit: 1, critX: 3 }],
    nt: [{ crit: 4, critX: 20 }, { critX: 30 }, { crit: 5, projP: 10 }],
    names: [
      '精準',
      '致命',
      '心眼',
      '弱點',
      '穿心',
      '要害',
      '鷹眼',
      '狙擊',
      '冷血',
      '斬首',
      '一擊',
      '洞察',
      '破綻',
      '無情'
    ],
    ks: { n: '必殺之心', ic: 'asc_s_stars', s: { critX: 100, crit: -4 } }
  },
  {
    n: '元素',
    c: '#8fd6ff',
    ic: 'asc_s_spark',
    sm: [{ eleP: 5 }, { spellP: 5 }, { aoe: 3 }],
    nt: [
      { eleP: 18, aoe: 6 },
      { spellP: 20, cdr: 4 },
      { eleP: 12, resA: 8 }
    ],
    names: [
      '烈焰',
      '寒霜',
      '雷鳴',
      '擴散',
      '共鳴',
      '燎原',
      '冰封',
      '電網',
      '焚天',
      '極光',
      '星火',
      '暴風',
      '熔岩',
      '天雷'
    ],
    ks: { n: '元素過載', ic: 'asc_s_flame', s: { eleP: 50, spellP: 20, hpP: -10 } }
  },
  {
    n: '靈識',
    c: '#c38bff',
    ic: 'asc_s_drop',
    sm: [{ mpP: 4 }, { mpReg: 8 }, { cdr: 1.5 }, { minionP: 6 }],
    nt: [
      { mpP: 12, mpReg: 20 },
      { cdr: 6, mpP: 6 },
      { minionP: 25, cdr: 3 }
    ],
    names: [
      '冥想',
      '靈泉',
      '專注',
      '御獸',
      '天啟',
      '心流',
      '靈犀',
      '魂契',
      '清明',
      '咒印',
      '召喚',
      '靜心',
      '神識',
      '萬象'
    ],
    ks: { n: '血之代價', ic: 'asc_s_heartx', s: { blood: 1, hpP: 15 } }
  }
];
const PT_R0 = 470; /* 中間挖空（放昇華）的半徑 */
const PTREE = (() => {
  const N = [],
    E = [],
    I = {},
    add = o => ((I[o.id] = o), N.push(o), o),
    link = (a, b) => E.push([a.id, b.id]),
    deg = Math.PI / 180,
    pol = (a, r) => [Math.cos(a) * r, Math.sin(a) * r];
  /* 起點環：6 個門（免費）＋門之間 4 個小點 */
  const ring = [];
  for (let s = 0; s < 6; s++) {
    const a = (s * 60 - 90) * deg,
      T = PT_SECT[s],
      [x, y] = pol(a, PT_R0);
    ring.push(add({ id: 'g' + s, x, y, n: T.n + '之門', ic: T.ic, s: {}, big: 1, gate: 1, sec: s }));
    for (let k = 1; k <= 4; k++) {
      const [x2, y2] = pol(a + k * 12 * deg, PT_R0),
        T2 = k <= 2 ? T : PT_SECT[(s + 1) % 6];
      ring.push(
        add({
          id: `r${s}_${k}`,
          x: x2,
          y: y2,
          n: T2.n,
          s: T2.sm[k % T2.sm.length],
          big: 0,
          sec: k <= 2 ? s : (s + 1) % 6
        })
      );
    }
  }
  ring.forEach((n, i) => link(n, ring[(i + 1) % ring.length]));
  for (let s = 0; s < 6; s++) {
    const T = PT_SECT[s],
      a0 = (s * 60 - 90) * deg;
    let nm = 0;
    /* 三條主幹：-18°、0°、+18° */
    const lanes = [-18, 0, 18].map((o, li) => {
      const out = [];
      for (let r = 560, k = 0; r <= 2360; r += 90, k++) {
        const [x, y] = pol(a0 + o * deg, r);
        const n = add({ id: `l${s}_${li}_${k}`, x, y, n: T.n, s: T.sm[(k + li) % T.sm.length], big: 0, sec: s });
        if (k) link(out[k - 1], n);
        out.push(n);
      }
      return out;
    });
    link(I['g' + s], lanes[1][0]);
    link(I[`r${(s + 5) % 6}_4`], lanes[0][0]);
    link(I[`r${s}_1`], lanes[2][0]);
    const near = (lane, x, y) =>
      lane.reduce((b, n) => (Math.hypot(n.x - x, n.y - y) < Math.hypot(b.x - x, b.y - y) ? n : b));
    /* 星團：中間大點＋一圈 6 個小點，接到兩邊的主幹 */
    const cluster = (id, a, r, L, R) => {
      const [cx, cy] = pol(a, r),
        nt = T.nt[nm % T.nt.length],
        mid = add({ id: id + 'n', x: cx, y: cy, n: T.names[nm++ % T.names.length], ic: T.ic, s: nt, big: 1, sec: s });
      const ringN = [];
      for (let k = 0; k < 6; k++) {
        const [dx, dy] = pol(a + (k * 60 + 30) * deg, 72);
        ringN.push(
          add({
            id: `${id}_${k}`,
            x: cx + dx,
            y: cy + dy,
            n: T.n,
            s: k === 3 ? { resA: 4 } : T.sm[k % T.sm.length],
            big: 0,
            sec: s
          })
        );
      }
      ringN.forEach((n, k) => link(n, ringN[(k + 1) % 6]));
      link(
        mid,
        ringN.reduce((b, n) => (Math.hypot(n.x, n.y) < Math.hypot(b.x, b.y) ? n : b))
      );
      for (const lane of [L, R].filter(Boolean)) {
        const e = ringN.reduce((b, n) => {
          const t = near(lane, n.x, n.y),
            u = near(lane, b.x, b.y);
          return Math.hypot(n.x - t.x, n.y - t.y) < Math.hypot(b.x - u.x, b.y - u.y) ? n : b;
        });
        link(e, near(lane, e.x, e.y));
      }
    };
    [800, 1150, 1500, 1850, 2200].forEach((r, i) => {
      cluster(`c${s}_${i}a`, a0 - 9 * deg, r, lanes[0], lanes[1]);
      cluster(`c${s}_${i}b`, a0 + 9 * deg, r + 60, lanes[1], lanes[2]);
    });
    /* 主幹外側的星團 */
    [1325, 2025].forEach((r, i) => {
      cluster(`o${s}_${i}a`, a0 - 26 * deg, r, lanes[0], null);
      cluster(`o${s}_${i}b`, a0 + 22 * deg, r - 175, lanes[2], null);
    });
    /* 邊界的星團：接到隔壁方向的主幹（左右兩個方向互通） */
    [980, 1680].forEach((r, i) => {
      cluster(`e${s}_${i}`, a0 + 30 * deg, r, lanes[2], null);
    });
    /* 基石：中間主幹的盡頭 */
    const [kx, ky] = pol(a0, 2480);
    link(
      lanes[1][lanes[1].length - 1],
      add({ id: 'k' + s, x: kx, y: ky, n: T.ks.n, ic: T.ks.ic, s: T.ks.s, big: 2, sec: s })
    );
  }
  /* 邊界星團接到下一個方向的左主幹 */
  for (let s = 0; s < 6; s++)
    for (const i of [0, 1]) {
      const e = N.filter(n => n.id.startsWith(`e${s}_${i}_`)),
        lane = N.filter(n => n.id.startsWith(`l${(s + 1) % 6}_0_`)),
        best = e
          .flatMap(a => lane.map(b => [a, b]))
          .reduce((p, q) =>
            Math.hypot(q[0].x - q[1].x, q[0].y - q[1].y) < Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) ? q : p
          );
      link(best[0], best[1]);
    }
  const ADJ = {};
  for (const [a, b] of E) (ADJ[a] = ADJ[a] || []).push(b), (ADJ[b] = ADJ[b] || []).push(a);
  return { N, E, I, ADJ };
})();
const PT_START = ['g0', 'g1', 'g2', 'g3', 'g4', 'g5'];
const ptPoints = lv => lv - 1;

/* ---------- 昇華（0.2.3，照 PoE）：藏身處的昇華石碑選，點在天賦樹中間挖空的地方 ----------
   一開始 2 點，第一次打倒階級 6、12、16 的王各 +2，共 8 點；嚴格 4 小 4 大（一小一大交錯，路線起點與中間都有分岔） */
const ascPoints = s => 2 + (s.maxT > 6 ? 2 : 0) + (s.maxT > 12 ? 2 : 0) + (s.t16 ? 2 : 0);
/* 每個分支同一個骨架（st 是入口，免費）；x, y 是在天賦樹中心的位置 */
const ASC_SHAPE = {
  st: [0, 250],
  s1: [-110, 170],
  s2: [110, 170],
  b1: [-190, 60],
  b2: [190, 60],
  s3: [-250, -60],
  s4: [0, -20],
  s5: [250, -60],
  b3: [-200, -180],
  b4: [0, -130],
  b5: [200, -180],
  s6: [0, -250],
  b6: [0, -350]
};
const ASC_EDGES = [
  ['st', 's1'],
  ['st', 's2'],
  ['s1', 'b1'],
  ['s2', 'b2'],
  ['b1', 's3'],
  ['b1', 's4'],
  ['b2', 's4'],
  ['b2', 's5'],
  ['s3', 'b3'],
  ['s4', 'b4'],
  ['s5', 'b5'],
  ['b3', 's6'],
  ['b5', 's6'],
  ['s6', 'b6']
];
/* 大點：fx 效果（程式裡用 ascV('效果') 讀），d 說明；小點：s 數值 */
const ASC = {
  sword: {
    n: '劍士',
    ic: 'cls_swordsman',
    d: '用劍的近戰職業：三條分支各走不同的打法。',
    br: {
      ronin: {
        n: '浪人',
        ic: 'it_c_swordsman_0',
        d: '居合：累積架勢，一刀定勝負',
        small: {
          s1: { as: 6 },
          s2: { meleeP: 12 },
          s3: { crit: 3 },
          s4: { as: 4, meleeP: 6 },
          s5: { ms: 5 },
          s6: { critX: 20 }
        },
        big: {
          b1: {
            n: '架勢',
            fx: { 'ronin.mech': 1 },
            d: '出手打中 +1 層架勢，滿 5 層的下一次出手是「居合」：傷害 ×3、必定暴擊'
          },
          b2: { n: '刀氣', fx: { 'ronin.aura': 30 }, d: '近戰技能範圍 +30%、近戰傷害 +15%' },
          b3: { n: '斬鐵', fx: { 'ronin.iron': 5 }, d: '居合的傷害 ×3 → ×5' },
          b4: { n: '燕返', fx: { 'ronin.swallow': 1 }, d: '居合之後馬上再砍一次（同樣的傷害）' },
          b5: { n: '一閃', fx: { 'ronin.flash': 30 }, d: '見切（出手瞬間翻滾）後架勢直接滿，2 秒內移動速度 +30%' },
          b6: { n: '明鏡止水', fx: { 'ronin.mirror': 8, 'ronin.gale': 3 }, d: '架勢只要 3 層；居合命中回 8% 生命' }
        }
      },
      rapier: {
        n: '刺劍姬',
        ic: 'it_c_swordsman_3',
        d: '細劍：見切反擊、破綻、步法，越靈活越痛',
        small: {
          s1: { crit: 3 },
          s2: { as: 6 },
          s3: { block: 4 },
          s4: { critX: 15 },
          s5: { ms: 6 },
          s6: { crit: 2, as: 4 }
        },
        big: {
          b1: { n: '反擊', fx: { 'rapier.riposte': 2 }, d: '見切時立刻反擊周圍的敵人（左鍵技能 ×2 傷害，必定暴擊）' },
          b2: { n: '致命節奏', fx: { 'rapier.rhythm': 4 }, d: '每第 4 次出手必定暴擊' },
          b3: { n: '步法', fx: { 'rapier.step': 30 }, d: '翻滾冷卻 -40%；翻滾後 2 秒攻速 +30%' },
          b4: { n: '破綻', fx: { 'rapier.expose': 20 }, d: '暴擊的敵人 4 秒內受到的傷害 +20%' },
          b5: { n: '格擋大師', fx: { 'rapier.parry': 1.5 }, d: '格擋 +15%；格擋時反擊周圍（×1.5 傷害）' },
          b6: { n: '千刺', fx: { 'rapier.flurry': 3 }, d: '近戰技能出手時多刺出 3 道劍氣（投射物，傷害 ×0.5）' }
        }
      },
      berserk: {
        n: '狂魔',
        ic: 'it_c_berserker_0',
        d: '怒氣與鮮血：越殺越快、越痛越強',
        small: {
          s1: { hpP: 6 },
          s2: { meleeP: 12 },
          s3: { as: 5 },
          s4: { regen: 5 },
          s5: { hpP: 5, meleeP: 6 },
          s6: { as: 4, critX: 15 }
        },
        big: {
          b1: {
            n: '怒氣',
            fx: { 'berserk.rage': 30 },
            d: '打中 +1 怒氣（最多 30，3 秒沒打中開始掉）；每點怒氣傷害 +1%、攻速 +0.5%'
          },
          b2: { n: '嗜血', fx: { 'berserk.leech': 2 }, d: '造成傷害的 2% 回復生命' },
          b3: { n: '背水', fx: { 'berserk.last': 80 }, d: '生命越少傷害越高：生命見底時傷害 +80%' },
          b4: { n: '血祭', fx: { 'berserk.blood': 25 }, d: '技能改用生命施放（不耗魔力），傷害 +25%' },
          b5: { n: '狂亂', fx: { 'berserk.frenzy': 8 }, d: '殺怪後 3 秒攻速、移動速度 +8%（最多疊 3 層）' },
          b6: { n: '不死', fx: { 'berserk.undying': 2 }, d: '每張地圖一次：受到致命傷害時留 1 點生命、無敵 2 秒' }
        }
      }
    }
  }
};
/* 選好的分支的節點（放在天賦樹中間） */
function ascNodes(br) {
  if (!br) return null;
  const B = ASC.sword.br[br],
    N = Object.entries(ASC_SHAPE).map(([k, [x, y]]) => {
      const big = B.big[k];
      return {
        id: 'a_' + k,
        k,
        x,
        y,
        asc: 1,
        big: k === 'st' ? 3 : big ? 1 : 0,
        n: k === 'st' ? B.n : big ? big.n : B.n,
        ic: k === 'st' ? B.ic : big ? B.ic : null,
        s: B.small[k] || {},
        fx: big ? big.fx : null,
        d: big ? big.d : ''
      };
    });
  return { N, E: ASC_EDGES.map(([a, b]) => ['a_' + a, 'a_' + b]), I: Object.fromEntries(N.map(n => [n.id, n])) };
}

const ROLL = { t: 0.32, dist: 175, iframe: 0.26, cd: 0.55, perfect: 0.16, slow: 0.55, slowScale: 0.3 };
const FLASK = { n: 3, heal: 0.5, t: 1.4, perKill: 0.12 };

/* ---------- 地圖：階級 1～16，打倒王開放下一階；階級 t 花 t-1 個碎片 ---------- */
const TMAX = 16;
const mapCost = t => t - 1;
/* 怪物等級：生命、傷害跟著階級長 */
const tierMul = t => ({ hp: Math.pow(1.32, t - 1), dmg: Math.pow(1.2, t - 1) });
const tierIlvl = t => t;

/* ---------- 抗性 ---------- */
const RESK = ['fire', 'cold', 'light', 'chaos'];
const ELN = { phys: '物理', fire: '火焰', cold: '冰冷', light: '閃電', chaos: '混沌' };
const ELC = { phys: '#fff3e0', fire: '#ff8a4c', cold: '#8fd6ff', light: '#ffe066', chaos: '#c38bff' };
const RES_CAP = 75;

/* ---------- 裝備 ---------- */
/* 裝備欄：k 欄位、t 能放的種類、n 名稱 */
const EQS = [
  { k: 'weapon', t: 'weapon', n: '武器' },
  { k: 'off', t: 'shield', n: '副手' },
  { k: 'helm', t: 'helm', n: '頭盔' },
  { k: 'chest', t: 'chest', n: '胸甲' },
  { k: 'gloves', t: 'gloves', n: '手套' },
  { k: 'boots', t: 'boots', n: '鞋子' },
  { k: 'belt', t: 'belt', n: '腰帶' },
  { k: 'amulet', t: 'amulet', n: '護身符' },
  { k: 'ring1', t: 'ring', n: '戒指' },
  { k: 'ring2', t: 'ring', n: '戒指' }
];
/* 種類：大小（格）、圖示前綴、可以出現的詞綴 */
const KINDS = {
  weapon: {
    n: '武器',
    sz: [1, 3],
    aff: ['dmgP', 'flat', 'fire', 'cold', 'light', 'chaos', 'as', 'crit', 'critX', 'loh']
  },
  shield: { n: '盾', sz: [2, 2], aff: ['life', 'armor', 'block', 'resF', 'resC', 'resL', 'resX', 'resA'] },
  helm: { n: '頭盔', sz: [2, 2], aff: ['life', 'armor', 'mp', 'crit', 'aoe', 'resF', 'resC', 'resL', 'resX'] },
  chest: { n: '胸甲', sz: [2, 3], aff: ['life', 'armor', 'regen', 'resF', 'resC', 'resL', 'resX'] },
  gloves: {
    n: '手套',
    sz: [2, 2],
    aff: ['life', 'armor', 'flat', 'fire', 'cold', 'light', 'as', 'loh', 'resF', 'resC', 'resL']
  },
  boots: { n: '鞋子', sz: [2, 2], aff: ['life', 'armor', 'ms', 'resF', 'resC', 'resL', 'resX'] },
  belt: { n: '腰帶', sz: [2, 1], aff: ['life', 'armor', 'mp', 'regen', 'flask', 'resF', 'resC', 'resL', 'resX'] },
  ring: {
    n: '戒指',
    sz: [1, 1],
    aff: ['life', 'mp', 'flat', 'fire', 'cold', 'light', 'as', 'crit', 'regen', 'resF', 'resC', 'resL', 'resX', 'resA']
  },
  amulet: { n: '護身符', sz: [1, 1], aff: ['life', 'mp', 'dmgP', 'crit', 'critX', 'aoe', 'regen', 'resA'] }
};
/* 底材：lv 從幾階開始掉、ic 圖示、b 固定數值（武器：物理傷害、攻速；防具：護甲；飾品：固定詞綴） */
const BASES = [
  { id: 'w_short', k: 'weapon', n: '短刀', lv: 1, ic: 'gear_weapon_0', b: { dmg: [4, 9], as: 1.3 } },
  { id: 'w_katana', k: 'weapon', n: '打刀', lv: 1, ic: 'gear_weapon_18', b: { dmg: [6, 13], as: 1.15 } },
  { id: 'w_nodachi', k: 'weapon', n: '野太刀', lv: 4, ic: 'gear_weapon_5', b: { dmg: [14, 26], as: 0.95 } },
  { id: 'w_kris', k: 'weapon', n: '蛇紋刃', lv: 7, ic: 'gear_weapon_28', b: { dmg: [12, 22], as: 1.35 } },
  { id: 'w_moon', k: 'weapon', n: '月影刀', lv: 10, ic: 'gear_weapon_17', b: { dmg: [24, 42], as: 1.15 } },
  { id: 'w_demon', k: 'weapon', n: '妖刀', lv: 14, ic: 'gear_weapon_20', b: { dmg: [34, 62], as: 1.1 } },
  { id: 's_wood', k: 'shield', n: '木盾', lv: 1, ic: 'gear_offhand_2', b: { armor: 12, block: 10 } },
  { id: 's_iron', k: 'shield', n: '鐵盾', lv: 6, ic: 'gear_offhand_8', b: { armor: 40, block: 14 } },
  { id: 's_tower', k: 'shield', n: '塔盾', lv: 12, ic: 'gear_offhand_3', b: { armor: 95, block: 18 } },
  { id: 'h_cloth', k: 'helm', n: '頭巾', lv: 1, ic: 'gear_helm_5', b: { armor: 6 } },
  { id: 'h_iron', k: 'helm', n: '鐵盔', lv: 6, ic: 'gear_helm_1', b: { armor: 22 } },
  { id: 'h_oni', k: 'helm', n: '鬼面盔', lv: 12, ic: 'gear_helm_9', b: { armor: 55 } },
  { id: 'c_leather', k: 'chest', n: '皮甲', lv: 1, ic: 'gear_chest_0', b: { armor: 14 } },
  { id: 'c_chain', k: 'chest', n: '鎖子甲', lv: 5, ic: 'gear_chest_1', b: { armor: 45 } },
  { id: 'c_plate', k: 'chest', n: '大鎧', lv: 11, ic: 'gear_chest_3', b: { armor: 110 } },
  { id: 'g_cloth', k: 'gloves', n: '布手套', lv: 1, ic: 'gear_gloves_0', b: { armor: 4 } },
  { id: 'g_iron', k: 'gloves', n: '鐵手甲', lv: 7, ic: 'gear_gloves_1', b: { armor: 18 } },
  { id: 'b_straw', k: 'boots', n: '草鞋', lv: 1, ic: 'gear_boots_4', b: { armor: 4 } },
  { id: 'b_iron', k: 'boots', n: '鐵脛靴', lv: 7, ic: 'gear_boots_1', b: { armor: 18 } },
  { id: 'bt_rope', k: 'belt', n: '繩帶', lv: 1, ic: 'gear_belt_0', b: { life: 10 } },
  { id: 'bt_leather', k: 'belt', n: '皮帶', lv: 6, ic: 'gear_belt_5', b: { life: 25 } },
  { id: 'r_iron', k: 'ring', n: '鐵戒', lv: 1, ic: 'gear_ring_5', b: { life: 6 } },
  { id: 'r_ruby', k: 'ring', n: '紅玉戒', lv: 3, ic: 'gear_ring_0', b: { resF: 12 } },
  { id: 'r_sapph', k: 'ring', n: '藍玉戒', lv: 3, ic: 'gear_ring_1', b: { resC: 12 } },
  { id: 'r_topaz', k: 'ring', n: '黃玉戒', lv: 3, ic: 'gear_ring_2', b: { resL: 12 } },
  { id: 'a_jade', k: 'amulet', n: '玉珮', lv: 1, ic: 'gear_amulet_1', b: { life: 12 } },
  { id: 'a_coral', k: 'amulet', n: '珊瑚墜', lv: 5, ic: 'gear_amulet_2', b: { regen: 2 } },
  { id: 'a_gold', k: 'amulet', n: '金鎖片', lv: 9, ic: 'gear_amulet_4', b: { crit: 8 } }
];
const BASEI = Object.fromEntries(BASES.map(b => [b.id, b]));

/* 詞綴：p 前綴（1）／後綴（0）、r：[T12 的最小, T1 的最大]、add 是「附加 a～b」兩個數 */
const AFF = {
  dmgP: { p: 1, n: '物理傷害 +{}%', r: [10, 170] },
  flat: { p: 1, n: '附加 {} 物理傷害', r: [1, 28], add: 1 },
  fire: { p: 1, n: '附加 {} 火焰傷害', r: [2, 40], add: 1 },
  cold: { p: 1, n: '附加 {} 冰冷傷害', r: [2, 36], add: 1 },
  light: { p: 1, n: '附加 {} 閃電傷害', r: [1, 48], add: 1 },
  chaos: { p: 1, n: '附加 {} 混沌傷害', r: [1, 30], add: 1 },
  life: { p: 1, n: '最大生命 +{}', r: [8, 120] },
  armor: { p: 1, n: '護甲 +{}', r: [6, 260] },
  mp: { p: 1, n: '最大魔力 +{}', r: [6, 70] },
  block: { p: 1, n: '格擋 +{}%', r: [2, 12] },
  as: { p: 0, n: '攻擊速度 +{}%', r: [4, 28] },
  crit: { p: 0, n: '暴擊率 +{}%', r: [2, 30] },
  critX: { p: 0, n: '暴擊傷害 +{}%', r: [8, 70] },
  regen: { p: 0, n: '每秒回復 {} 生命', r: [1, 30] },
  loh: { p: 0, n: '擊中回復 {} 生命', r: [1, 20] },
  ms: { p: 0, n: '移動速度 +{}%', r: [6, 32] },
  aoe: { p: 0, n: '範圍 +{}%', r: [5, 30] },
  flask: { p: 0, n: '藥水回復 +{}%', r: [10, 60] },
  resF: { p: 0, n: '火焰抗性 +{}%', r: [6, 48] },
  resC: { p: 0, n: '冰冷抗性 +{}%', r: [6, 48] },
  resL: { p: 0, n: '閃電抗性 +{}%', r: [6, 48] },
  resX: { p: 0, n: '混沌抗性 +{}%', r: [5, 35] },
  resA: { p: 0, n: '全部抗性 +{}%', r: [3, 18] }
};
/* T12（最低）～T1（最高）各一段；物品等級越高，能出現的最高階越高 */
function tierRange(k, T) {
  const [lo, hi] = AFF[k].r,
    step = (hi - lo) / 12,
    a = lo + step * (12 - T),
    b = a + step;
  return [Math.max(1, Math.round(a)), Math.max(1, Math.round(b))];
}
const bestTier = ilvl => Math.max(1, 12 - Math.floor(((ilvl - 1) * 11) / (TMAX - 1)));
const RARN = ['普通', '魔法', '稀有'];
const NAME_A = ['血', '鴉', '霜', '雷', '屍', '魂', '龍', '狼', '影', '骨', '焰', '夜', '鬼', '蛇', '鐵', '星'];
const NAME_B = ['之牙', '之爪', '之握', '之心', '之怒', '之歌', '之嚎', '之印', '之刃', '之殼', '之眼', '之息'];

/* ---------- 怪物：hp／dmg 是階級 1 的值，r 碰撞半徑、sz 畫的高度、ai 行為、el 屬性（抗自己的屬性） ---------- */
const MOBS = {
  slime: {
    n: '綠史萊姆',
    sp: 'm_slime_green',
    hp: 34,
    dmg: 9,
    spd: 95,
    r: 18,
    sz: 40,
    ai: 'melee',
    wind: 0.5,
    reach: 46,
    cd: 1.3,
    xp: 6
  },
  dog: {
    n: '流浪狗',
    sp: 'm_straydog',
    hp: 26,
    dmg: 8,
    spd: 200,
    r: 16,
    sz: 42,
    ai: 'lunge',
    wind: 0.38,
    reach: 230,
    cd: 1.6,
    xp: 6
  },
  bat: {
    n: '蝙蝠',
    sp: 'm_bat',
    hp: 14,
    dmg: 5,
    spd: 230,
    r: 13,
    sz: 34,
    ai: 'melee',
    wind: 0.28,
    reach: 36,
    cd: 0.9,
    xp: 3,
    fly: 1
  },
  fire: {
    n: '鬼火',
    sp: 'm_ghostfire',
    hp: 22,
    dmg: 10,
    spd: 120,
    r: 15,
    sz: 40,
    ai: 'ranged',
    wind: 0.55,
    reach: 330,
    cd: 2.0,
    xp: 7,
    fly: 1,
    el: 'fire'
  },
  wolf: {
    n: '雪原狼',
    sp: 'm_snowwolf',
    hp: 30,
    dmg: 9,
    spd: 210,
    r: 17,
    sz: 44,
    ai: 'lunge',
    wind: 0.36,
    reach: 220,
    cd: 1.5,
    xp: 7,
    el: 'cold'
  },
  tbat: {
    n: '雷蝠',
    sp: 'm_thunderbat',
    hp: 16,
    dmg: 6,
    spd: 240,
    r: 13,
    sz: 34,
    ai: 'melee',
    wind: 0.28,
    reach: 36,
    cd: 0.9,
    xp: 4,
    fly: 1,
    el: 'light'
  },
  shroom: {
    n: '毒菇',
    sp: 'm_mushroom',
    hp: 40,
    dmg: 9,
    spd: 70,
    r: 18,
    sz: 40,
    ai: 'ranged',
    wind: 0.6,
    reach: 300,
    cd: 2.2,
    xp: 7,
    el: 'chaos'
  },
  bear: {
    n: '黑熊',
    sp: 'm_blackbear',
    hp: 95,
    dmg: 24,
    spd: 80,
    r: 26,
    sz: 64,
    ai: 'slam',
    wind: 0.85,
    reach: 100,
    cd: 2.4,
    xp: 18
  }
};
/* 一群的組成 */
const PACKS = [
  ['slime', 'slime', 'slime', 'slime'],
  ['dog', 'dog', 'dog'],
  ['bat', 'bat', 'bat', 'bat', 'bat', 'bat'],
  ['fire', 'fire', 'slime', 'slime'],
  ['bear', 'slime', 'slime'],
  ['wolf', 'wolf', 'wolf'],
  ['tbat', 'tbat', 'tbat', 'tbat', 'bat', 'bat'],
  ['shroom', 'shroom', 'slime', 'slime'],
  ['bear', 'tbat', 'tbat', 'fire']
];
const ELITE = { hp: 3.2, dmg: 1.5, sz: 1.3 };
/* 王：照階級輪替；sk 叫小怪的種類、el 屬性 */
const BOSSES = [
  { n: '虎姑婆', sp: 'hugupo', hp: 480, dmg: 22, spd: 135, r: 40, sz: 120, xp: 200, call: 'bat' },
  { n: '魔神仔', sp: 'mosina', hp: 450, dmg: 21, spd: 150, r: 38, sz: 116, xp: 200, call: 'shroom', el: 'chaos' },
  { n: '林投姐', sp: 'lintoujie', hp: 470, dmg: 22, spd: 140, r: 38, sz: 118, xp: 200, call: 'wolf', el: 'cold' }
];
const bossOf = t => BOSSES[(t - 1) % BOSSES.length];
