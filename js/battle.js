/* 漫步勇者 · 戰鬥：背景、邏輯、繪製 */
'use strict';
/* ================= battle: painted backgrounds ================= */
const bbg = $('bbg'),
  bfx = $('bfx'),
  bctx = bfx.getContext('2d');
let BW = 360,
  BH = 480,
  DPR = 1;
function sizeBattle() {
  const r = $('bview').getBoundingClientRect();
  DPR = Math.min(2, window.devicePixelRatio || 1);
  BW = r.width;
  BH = r.height;
  for (const c of [bbg, bfx]) {
    c.width = Math.round(BW * DPR);
    c.height = Math.round(BH * DPR);
  }
}
function blob(x, cx, cy, r, col) {
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, col);
  g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
  x.fillStyle = g;
  x.fillRect(cx - r, cy - r, r * 2, r * 2);
}
function paintBG(kind) {
  const x = bbg.getContext('2d'),
    W = bbg.width,
    H = bbg.height,
    r = rng(h(fl(S.lat * 1e3), fl(S.lng * 1e3), kind.length)),
    HZ = H * 0.6;
  x.save();
  const hr = new Date(now()).getHours(),
    night = hr < 6 || hr >= 19,
    dusk = !night && hr >= 16;
  const soft = (px, fn) => {
    x.save();
    if ('filter' in x) x.filter = `blur(${px * DPR}px)`;
    fn();
    x.restore();
  };
  const pal = {
    forest: {
      sky: ['#e9f0c8', '#9cc27a'],
      far: '#6f9a5c',
      mid: '#3f6e36',
      near: '#264a22',
      ground: ['#9a9a3a', '#6d7a28'],
      fog: 'rgba(240,245,200,.55)'
    },
    meadow: {
      sky: ['#bfe3f2', '#e8f2d0'],
      far: '#8fb7a0',
      mid: '#6fa155',
      near: '#4f8a3c',
      ground: ['#a7c766', '#7aa548'],
      fog: 'rgba(255,255,240,.45)'
    },
    city: {
      sky: ['#3a3f7a', '#d99a7a'],
      far: '#5b5f8e',
      mid: '#3c3f66',
      near: '#25263f',
      ground: ['#5a5560', '#3e3a44'],
      fog: 'rgba(255,200,170,.3)'
    },
    mountain: {
      sky: ['#a9c3e0', '#eef2f6'],
      far: '#9aa9c0',
      mid: '#7a8a8f',
      near: '#5c6a60',
      ground: ['#8e9c70', '#6c7a52'],
      fog: 'rgba(255,255,255,.55)'
    },
    cave: {
      sky: ['#140f1a', '#2a2030'],
      far: '#2a2232',
      mid: '#1f1926',
      near: '#120e17',
      ground: ['#3a3242', '#241e2a'],
      fog: 'rgba(255,150,80,.18)'
    }
  }[kind];
  if (night && kind !== 'cave') {
    pal.sky = ['#0b1030', '#2e3570'];
    pal.fog = 'rgba(150,180,255,.2)';
  } else if (dusk && kind !== 'cave' && kind !== 'city') {
    pal.sky = ['#f2b77a', '#f6e1b0'];
  }
  let g = x.createLinearGradient(0, 0, 0, HZ);
  g.addColorStop(0, pal.sky[0]);
  g.addColorStop(1, pal.sky[1]);
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  blob(x, W * 0.6, H * 0.22, W * 0.6, night ? 'rgba(160,180,255,.25)' : 'rgba(255,250,220,.7)');
  const trees = (col, base, n, size, blur) =>
    soft(blur, () => {
      x.fillStyle = col;
      for (let i = 0; i < n; i++) {
        const cx = r() * W,
          cy = base - r() * size * 0.6,
          rr = size * (0.5 + r() * 0.6);
        x.beginPath();
        x.ellipse(cx, cy, rr * 1.1, rr, 0, 0, 6.28);
        x.fill();
        x.fillRect(cx - rr * 0.08, cy, rr * 0.16, base - cy + size * 0.5);
      }
      x.fillRect(0, base, W, H - base);
    });
  const ridge = (col, base, amp, blur, snow) =>
    soft(blur, () => {
      x.fillStyle = col;
      x.beginPath();
      x.moveTo(0, H);
      let y = base;
      for (let i = 0; i <= W; i += W / 14) {
        y = base - amp * (0.4 + r() * 0.6);
        x.lineTo(i, y);
      }
      x.lineTo(W, H);
      x.fill();
      if (snow) {
        x.fillStyle = 'rgba(255,255,255,.8)';
        for (let i = 0; i < 6; i++) {
          const cx = r() * W,
            cy = base - amp * 0.9;
          x.beginPath();
          x.moveTo(cx - 20 * DPR, cy + 16 * DPR);
          x.lineTo(cx, cy - 4 * DPR);
          x.lineTo(cx + 20 * DPR, cy + 16 * DPR);
          x.fill();
        }
      }
    });
  const skyline = (col, base, lit, blur) =>
    soft(blur, () => {
      for (let i = 0; i < W; ) {
        const w = (16 + r() * 30) * DPR,
          hh = (40 + r() * 140) * DPR;
        x.fillStyle = col;
        x.fillRect(i, base - hh, w, hh + H);
        if (lit) {
          x.fillStyle = 'rgba(255,215,130,.85)';
          for (let wy = base - hh + 6 * DPR; wy < base - 4 * DPR; wy += 8 * DPR)
            for (let wx = i + 4 * DPR; wx < i + w - 4 * DPR; wx += 7 * DPR)
              if (r() < 0.4) x.fillRect(wx, wy, 3 * DPR, 4 * DPR);
        }
        i += w + r() * 6 * DPR;
      }
    });
  if (kind === 'forest') {
    trees(pal.far, HZ * 0.72, 26, W * 0.09, 6);
    blob(x, W * 0.5, HZ * 0.6, W * 0.5, pal.fog);
    trees(pal.mid, HZ * 0.88, 16, W * 0.13, 2.5);
  } else if (kind === 'meadow') {
    ridge(pal.far, HZ * 0.8, H * 0.12, 5);
    blob(x, W * 0.5, HZ * 0.75, W * 0.6, pal.fog);
    trees(pal.mid, HZ * 0.95, 9, W * 0.08, 2);
  } else if (kind === 'city') {
    skyline(pal.far, HZ * 0.9, true, 4);
    blob(x, W * 0.5, HZ * 0.8, W * 0.7, pal.fog);
    skyline(pal.mid, HZ, night || dusk, 1.5);
  } else if (kind === 'mountain') {
    ridge(pal.far, HZ * 0.62, H * 0.22, 4, true);
    blob(x, W * 0.5, HZ * 0.7, W * 0.7, pal.fog);
    ridge(pal.mid, HZ * 0.9, H * 0.1, 2);
  } else {
    soft(3, () => {
      x.fillStyle = pal.far;
      for (let i = 0; i < W; i += 18 * DPR) {
        x.beginPath();
        x.moveTo(i, 0);
        x.lineTo(i + 9 * DPR, (40 + r() * 90) * DPR);
        x.lineTo(i + 18 * DPR, 0);
        x.fill();
      }
    });
  }
  g = x.createLinearGradient(0, HZ, 0, H);
  g.addColorStop(0, pal.ground[0]);
  g.addColorStop(1, pal.ground[1]);
  x.fillStyle = g;
  x.beginPath();
  x.moveTo(0, HZ);
  for (let i = 0; i <= W; i += W / 10) x.lineTo(i, HZ + (r() - 0.5) * 14 * DPR);
  x.lineTo(W, H);
  x.lineTo(0, H);
  x.fill();
  soft(1.5, () => {
    for (let i = 0; i < 140; i++) {
      const yy = HZ + Math.pow(r(), 1.4) * (H - HZ),
        s = (yy - HZ) / (H - HZ);
      x.fillStyle = `rgba(${kind === 'cave' ? '90,80,100' : kind === 'city' ? '120,115,125' : '60,90,30'},${0.25 + r() * 0.3})`;
      x.beginPath();
      x.ellipse(r() * W, yy, (8 + r() * 30) * DPR * s + 2, (2 + r() * 5) * DPR * s + 1, 0, 0, 6.28);
      x.fill();
    }
  });
  blob(x, W * 0.5, HZ + (H - HZ) * 0.45, W * 0.55, kind === 'cave' ? 'rgba(255,170,90,.15)' : 'rgba(255,250,210,.22)');
  if (kind === 'forest' || kind === 'meadow') {
    soft(5, () => {
      x.fillStyle = pal.near;
      x.beginPath();
      x.ellipse(-W * 0.05, H * 0.05, W * 0.3, H * 0.3, 0, 0, 6.28);
      x.fill();
      x.beginPath();
      x.ellipse(W * 1.05, H * 0.08, W * 0.28, H * 0.28, 0, 0, 6.28);
      x.fill();
      x.beginPath();
      x.ellipse(W * 0.1, H * 1.02, W * 0.35, H * 0.1, 0, 0, 6.28);
      x.fill();
      x.beginPath();
      x.ellipse(W * 0.95, H * 1.02, W * 0.35, H * 0.1, 0, 0, 6.28);
      x.fill();
    });
  }
  if (kind === 'cave') {
    [
      [0.12, 0.35],
      [0.88, 0.35]
    ].forEach(([a, b]) => {
      blob(x, W * a, H * b, W * 0.3, 'rgba(255,150,60,.45)');
      x.fillStyle = '#5a3a20';
      x.fillRect(W * a - 3 * DPR, H * b, 6 * DPR, 24 * DPR);
      x.fillStyle = '#ffc46a';
      x.fillRect(W * a - 5 * DPR, H * b - 10 * DPR, 10 * DPR, 11 * DPR);
    });
  }
  const vg = x.createRadialGradient(W / 2, H * 0.55, H * 0.3, W / 2, H * 0.55, H * 0.95);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,.45)');
  x.fillStyle = vg;
  x.fillRect(0, 0, W, H);
  x.restore();
}

/* ================= battle: logic ================= */
const BFX = { pops: [], fx: [], shake: 0, hero: { a: null }, en: [], t0: 0, motes: [] };
/* 戰鬥站位：y 是怪物腳下，hy 是玩家腳下（比怪物低一點） */
const POS = () => {
  const y = Math.min(BH * 0.6, BH - 118);
  return { hx: BW * 0.27, ex: BW * 0.7, y, hy: Math.min(y + 22, BH - 128) };
};
/* 敵人站位（0.3）：依數量排成前後兩排，[x 比例, 往下的位移]；首領固定第 0 格、放大 */
const ESLOT = {
  1: [[0.7, 0]],
  2: [
    [0.6, 26],
    [0.84, -24]
  ],
  3: [
    [0.72, -10],
    [0.56, 42],
    [0.88, 40]
  ],
  4: [
    [0.6, -44],
    [0.85, -46],
    [0.57, 40],
    [0.84, 44]
  ],
  5: [
    [0.72, -2],
    [0.58, -54],
    [0.87, -56],
    [0.56, 48],
    [0.87, 50]
  ]
};
const battleSc = () => Math.max(3, Math.min(6, Math.round(BW / 90)));
/* 第 i 隻敵人的位置與大小（es 是敵人陣列，boss 時第 0 隻放大） */
function epos(i, es, boss) {
  const n = es.length,
    s = (ESLOT[n] || ESLOT[5])[i] || [0.7, 0],
    p = POS(),
    sc = battleSc(),
    solo = boss && i === 0 && n === 1;
  return {
    /* 首領單獨一隻時：右半邊、垂直置中（頂部血條約 85px 到行動順序約 BH-55 的中間，腳底再往下半個身高） */
    x: BW * (solo ? 0.72 : s[0]),
    y: solo ? (BH + 30) / 2 + 10 * (sc + 2) : p.y + s[1] * Math.min(1, BH / 560),
    s: boss && i === 0 ? sc + 2 : n <= 2 ? sc + 1 : n === 3 ? sc : Math.max(2, sc - 1)
  };
}
/* 怪物頭頂（名字放在這裡） */
const etop = q => q.y - 16 * q.s - 8;
function placeBName(q) {
  const el = $('bname');
  el.style.left = q.x + 'px';
  el.style.top = etop(q) + 'px';
}
/* 異常狀態圖示：o 是有狀態回合數的物件（敵人或隊員），keys 選要顯示哪些 */
const AIL_E = [
    ['burn', 'flame', '燃燒'],
    ['frozen', 'ice', '凍結'],
    ['shock', 'bolt', '感電'],
    ['poison', 'leaf', '中毒'],
    ['bleed', 'heart', '流血'],
    ['stun', 'star', '暈眩'],
    ['curse', 'eye', '詛咒'],
    ['mark', 'arrow', '標記']
  ],
  AIL_H = [
    ['frozen', 'ice', '凍結'],
    ['guard', 'shield', '防禦'],
    ['stacks', 'star', '疊層'],
    ['shield', 'heart', '護盾']
  ];
const ailHTML = (o, keys) =>
  keys
    .filter(([k]) => o && o[k] > 0)
    .map(
      ([k, ic, n]) =>
        `<span class="ail ail-${ic}" title="${n}"><img src="${iconURL(ic)}" alt="${n}">${o[k] > 1 && k !== 'shield' ? `<b>${o[k]}</b>` : ''}</span>`
    )
    .join('');
function placeAil(id, x, y, html) {
  const el = $(id);
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.innerHTML = html;
}
/* 頭目（地城首領、看門人、紅名危險怪）：名字與血條放到畫面最上方 */
function bossBar(e, boss) {
  const on = !!e && (boss || (e.rar || 0) >= 3),
    el = $('bboss');
  el.hidden = !on;
  $('bview').classList.toggle('bossmode', on);
  if (!on) return false;
  el.innerHTML = `<div class="bbname" style="color:${RCOL[e.rar || 3]}">${esc(e.name)} <small>Lv${e.lv}${e.mods && e.mods.length ? '・' + modNames(e) : ''}</small></div><div class="bbar"><i style="width:${Math.max(0, (e.hp / e.maxhp) * 100)}%"></i><span>${Math.max(0, Math.ceil(e.hp)).toLocaleString()} / ${e.maxhp.toLocaleString()}</span></div>`;
  return true;
}
/* 每隻敵人腳下的小血條與異常狀態；目前目標加框 */
function enemyBars(es, ti, boss) {
  return es
    .map((e, i) => {
      if (e.hp <= 0 || (boss && i === 0)) return '';
      const q = epos(i, es, boss);
      return `<div class="ebar${i === ti ? ' tg' : ''}" style="left:${q.x}px;top:${q.y + 6}px"><i class="hb hhp"><i style="width:${Math.max(0, (e.hp / e.maxhp) * 100)}%"></i><em>${Math.max(0, Math.ceil(e.hp)).toLocaleString()}</em></i><span class="eails">${ailHTML(e, AIL_E)}</span></div>`;
    })
    .join('');
}
/* 左上角層數（不在地城就隱藏） */
function setFloor(t) {
  $('bfloor').textContent = t;
  $('bfloor').hidden = !t;
}
/* 小頭像：用像素圖轉成圖片，快取起來 */
const PORT = new Map();
function portrait(spr, pal) {
  const k = spr + JSON.stringify(pal);
  if (!PORT.has(k)) {
    const sp = sprite(spr, pal);
    if (sp.pending) return sp.toDataURL();
    PORT.set(k, sp.toDataURL());
  }
  return PORT.get(k);
}
/* 行動順序（戰鬥畫面底部橫列）：list 是 [{n, c, on, dead, img}]，c 是 'me'／'e'／''；{h} 是分隔（下一輪） */
function renderOrder(list) {
  $('border').innerHTML = list
    .map(q =>
      q.h
        ? `<span class="bo-sep">${q.h}</span>`
        : `<div class="bo${q.c ? ' bo-' + q.c : ''}${q.on ? ' on' : ''}${q.dead ? ' dead' : ''}"><img src="${q.img}" alt=""><span>${esc(q.n)}</span></div>`
    )
    .join('');
}
function bmsg(t) {
  const el = $('bmsg');
  el.textContent = t;
  el.style.opacity = 1;
  clearTimeout(bmsg.t);
  bmsg.t = setTimeout(() => (el.style.opacity = 0), 1300);
}
function pop(text, x, y, col) {
  BFX.pops.push({ text, x, y, col, t: performance.now() });
}
/* o 是 BFX.hero 或 BFX.en[i]；sign 是衝刺方向（玩家往右 1、敵人往左 -1） */
function anim(o, type, dur = 360) {
  if (o) o.a = { type, t: performance.now(), dur };
}
function animOff(o, sign) {
  const a = o && o.a;
  if (!a) return [0, 0];
  const p = (performance.now() - a.t) / a.dur;
  if (p >= 1) {
    o.a = null;
    return [0, 0];
  }
  const s = Math.sin(Math.PI * p);
  if (a.type === 'lunge') return [sign * BW * 0.2 * s, -6 * s];
  if (a.type === 'cast') return [0, -8 * s];
  if (a.type === 'hurt') return [-sign * 8 * Math.sin(p * 20) * (1 - p), 0];
  return [0, 0];
}
function later(ms, fn) {
  setTimeout(() => {
    if (B) fn();
  }, ms);
}

/* ================= battle: rules（單人與組隊共用） ================= */
/* 敵人身上的戰鬥狀態 */
function eInit(e) {
  Object.assign(e, { poison: 0, pMul: 1, burn: 0, burnDmg: 0, shock: 0, frozen: 0, bleed: 0, bleedDmg: 0, stun: 0 });
  Object.assign(e, { curse: 0, curseP: 0, mark: 0, markP: 0 });
  return e;
}
/* 怪物群：地圖上的一隻怪代表一群，依稀有度帶 0～3 隻小怪（最多 5 隻）；小怪跟著帶頭的種族（亡靈、魔霧） */
function packOf(lead, extra = 0) {
  const r = lead.rar || 0,
    q = Math.random(),
    n =
      S.lv < 3
        ? 0
        : r === 0
          ? q < 0.45
            ? 0
            : q < 0.8
              ? 1
              : 2
          : r === 1
            ? 1 + (q < 0.5 ? 0 : 1)
            : r === 2
              ? 2 + (q < 0.5 ? 0 : 1)
              : r === 4
                ? q < 0.4
                  ? 0
                  : q < 0.8
                    ? 1
                    : 2
                : 0,
    out = [];
  for (let k = 0; k < Math.min(4, n + extra); k++) {
    const lv = Math.max(1, (lead.lv || S.lv) - (Math.random() < 0.5 ? 1 : 0)),
      b = lead.ud
        ? UNDEAD[fl(Math.random() * UNDEAD.length)]
        : lead.mist && Math.random() < 0.5
          ? MISTMON[fl(Math.random() * MISTMON.length)]
          : pickMon(fl(Math.random() * 1e6), lv),
      m = makeEnemy(b, lv, 0, []);
    m.maxhp = m.hp = Math.round(m.maxhp * 0.6);
    m.atk = Math.round(m.atk * 0.7);
    m.xp = Math.round(m.xp * 0.6);
    m.gold = Math.round(m.gold * 0.6);
    m.minion = 1;
    for (const k2 of ['ud', 'mist', 'uw']) if (lead[k2]) m[k2] = lead[k2];
    if (lead.mist) m.name = (lead.ud ? '霧中亡靈・' : '魔霧・') + m.name;
    out.push(m);
  }
  return out;
}
/* 技能的標籤：法術看元素，攻擊看武器類別（劍、斧鎚、矛、弓弩、匕首爪、法杖），昇華的輔助型大點依標籤套用 */
const skTag = (sk, st) => (sk.kind === 'spell' ? sk.el : sk.w || (st && st.wtag) || 'sword');
/* 昇華輔助：把符合這個技能的效果加總（tag 可以是武器類別、元素、'attack'／'spell'、'all'） */
function supOf(st, sk) {
  const tag = skTag(sk, st),
    o = {};
  for (const s of (st && st.sup) || [])
    if (s.tag === 'all' || s.tag === tag || s.tag === sk.kind || (s.tag === 'summon' && sk.pet))
      for (const k in s) if (k !== 'tag') o[k] = (o[k] || 0) + s[k];
  return o;
}
/* 增益（戰旗、冰甲、附身…）：me.buffs 是 [{k: 值, turns}]，取同一個欄位的總和 */
const bsum = (me, k) => ((me && me.buffs) || []).reduce((a, b) => a + (b[k] || 0), 0);
/* damage packets: {phys,fire,cold,light} */
function mitigate(pk, arm, res, shock) {
  const pr = pk.phys > 0 ? arm / (arm + 10 * pk.phys) : 0;
  let d =
    pk.phys * (1 - pr) + pk.fire * (1 - res[0] / 100) + pk.cold * (1 - res[1] / 100) + pk.light * (1 - res[2] / 100);
  if (shock) d *= 1.2;
  return Math.max(1, d);
}
/* ---- 天賦規則（單人與多人共用）：o 是有 hp/mp 的對象（S 或隊員），st 是它的屬性 ---- */
const skCost = (st, sk) => Math.round(sk.mp * (1 - Math.min(80, (st.mpCost || 0) + (supOf(st, sk).cost || 0)) / 100));
const lifeCost = (st, sk) => (sk.lifeCost ? Math.round(st.maxhp * sk.lifeCost) : 0);
const canPay = (o, st, sk) =>
  st.blood ? o.hp > skCost(st, sk) + lifeCost(st, sk) : o.mp >= skCost(st, sk) && o.hp > lifeCost(st, sk);
function payCost(o, st, sk) {
  const n = skCost(st, sk);
  if (st.blood) o.hp = Math.max(1, o.hp - n);
  else o.mp -= n;
  if (sk.lifeCost) o.hp = Math.max(1, o.hp - lifeCost(st, sk));
}
const costTxt = (st, sk) =>
  [sk.mp ? skCost(st, sk) + (st.blood ? ' 生命' : ' 魔力') : '', sk.lifeCost ? lifeCost(st, sk) + ' 生命' : '']
    .filter(Boolean)
    .join('＋');
/* 技能石的刻印詞綴只在用那個技能時生效 */
const skSt = (st, sk) =>
  sk.gid
    ? {
        ...st,
        crit: st.crit ? Math.min(75, st.crit + sk.crit) : 0,
        ail: (st.ail || 1) * (1 + sk.ail / 100),
        leech: (st.leech || 0) + sk.leech,
        dbl: Math.min(60, (st.dbl || 0) + sk.dbl),
        brk: sk.brk,
        skMul: 1 + ((st.engPct || 0) * (sk.nEn || 0)) / 100
      }
    : st;
/* 依代號取技能：'attack' 是固定的普通攻擊，'s0'～'s3' 是技能欄（list 是 mySkills() 或隊員快照的 sks） */
const skByKey = (k, list) => (k === 'attack' ? SKILLS.attack : (k && k[0] === 's' && list[+k.slice(1)]) || null);
const extraHit = (st, sk) => (sk.kind === 'attack' && st.dbl && Math.random() * 100 < st.dbl ? 1 : 0);
function heroPacket(st, sk, mult) {
  if (sk.kind === 'spell') {
    const pk = { phys: 0, fire: 0, cold: 0, light: 0 };
    pk[sk.el] =
      (sk.sb || 9) * (st.spellMul || 1) * ((st.elm && st.elm[sk.el]) || 1) * mult * (st.skMul || 1) * rnd(0.85, 1.15);
    return pk;
  }
  mult *= st.skMul || 1;
  return {
    phys: rnd(st.physLo, st.physHi) * mult,
    fire: st.fire * mult * rnd(0.8, 1.2),
    cold: st.cold * mult * rnd(0.8, 1.2),
    light: st.light * mult * rnd(0.3, 1.7)
  };
}
function heroDmg(st, pk, e, shock, o) {
  const pen = st.penRes || 0;
  let d = mitigate(pk, e.arm * (1 - Math.min(90, st.brk || 0) / 100), pen ? e.res.map(v => v - pen) : e.res, shock);
  const crit = Math.random() * 100 < st.crit;
  if (crit) d *= st.critMulti / 100;
  if (st.lowLife && o.hp < st.maxhp / 2) d *= 1 + st.lowLife / 100;
  if (st.legPride && o.hp >= st.maxhp) d *= 1.3;
  if (st.legEnvy && e.hp > o.hp) d *= 1.25;
  if (st.exec && e.hp < e.maxhp * 0.35) d *= 1 + st.exec / 100;
  if (e.mark > 0) d *= 1 + (e.markP || 20) / 100;
  if (e.curse > 0) d *= 1 + (e.curseP || 15) / 100;
  return { d: Math.round(d), crit };
}
/* 命中後的異常狀態，es 是那隻敵人，回傳要跳出的文字 */
function heroAil(st, sk, pk, es) {
  const out = [],
    m = st.ail || 1,
    dur = 3 + (st.ailDur || 0);
  if (pk.fire > 0 && Math.random() < (sk.el === 'fire' ? 0.4 : 0.2) * m) {
    es.burn = dur;
    es.burnDmg = Math.max(1, Math.round(pk.fire * 0.3 * (st.dotMul || 1)));
    out.push(['燃燒', '#ffb15a']);
  }
  if (pk.cold > 0 && Math.random() < (sk.freeze || 0.12) * m) {
    es.frozen = 1;
    out.push(['凍結', '#9fe7ff']);
  }
  if (pk.light > 0 && Math.random() < 0.25 * m) {
    es.shock = 2 + (st.ailDur || 0);
    out.push(['感電', '#fff27a']);
  }
  if (st.legLust && Math.random() < 0.15) {
    es.frozen = 1;
    out.push(['魅惑', '#ff8ad8']);
  }
  if (sk.kind === 'attack' && !sk.poison && st.poisonCh && Math.random() * 100 < st.poisonCh) {
    es.poison = Math.max(es.poison || 0, dur);
    es.pMul = (st.poisonMul || 1) * (st.dotMul || 1);
    out.push(['中毒', '#9be36b']);
  }
  if (st.bleedCh && Math.random() * 100 < st.bleedCh) {
    es.bleed = dur;
    es.bleedDmg = Math.max(1, Math.round((pk.phys || pk.fire + pk.cold + pk.light) * 0.25 * (st.dotMul || 1)));
    out.push(['流血', '#ff5a5a']);
  }
  if (st.stunCh && Math.random() * 100 < st.stunCh) {
    es.stun = 1;
    out.push(['暈眩', '#ffe27a']);
  }
  if (st.curseCh && Math.random() * 100 < st.curseCh) {
    es.curse = 3;
    es.curseP = Math.max(es.curseP || 0, st.curseP || 15);
    out.push(['詛咒', '#c86aff']);
  }
  return out;
}
const poisonTick = (e, es) => Math.max(1, Math.round(e.maxhp * 0.08 * (es.pMul || 1)));
/* 受到傷害：心靈凌駕讓一部分改扣魔力，護盾先吸收 */
function takeDmg(o, st, d) {
  if (o.shield > 0) {
    const a = Math.min(o.shield, d);
    o.shield -= a;
    d -= a;
  }
  const m = st.mom ? Math.max(0, Math.min(o.mp, Math.round((d * st.mom) / 100))) : 0;
  o.mp -= m;
  o.hp = Math.max(0, o.hp - (d - m));
  return m;
}
const hitCol = pk =>
  pk.fire > pk.cold && pk.fire > pk.light && pk.fire > pk.phys * 0.5
    ? '#ffb15a'
    : pk.cold > pk.phys * 0.5 && pk.cold > pk.light
      ? '#9fe7ff'
      : pk.light > pk.phys * 0.5
        ? '#fff27a'
        : '#ffffff';
const aliveIdx = es => es.map((e, i) => (e.hp > 0 ? i : -1)).filter(i => i >= 0);
/* 一次行動的結算（單人與組隊共用）：me 是施放者（hp、mp、戰鬥狀態，uid），es 是敵人，ti 是目標，party 是隊員
   回傳事件陣列，at 是相對時間（毫秒）；畫面由單人的 playEv 或組隊的 mpApply 播 */
function actResolve(me, st0, sk, es, ti, party, ext = {}) {
  const ev = [],
    sup = supOf(st0, sk),
    st = skSt(st0, sk),
    S2 = {
      ...st,
      crit: st.crit ? Math.min(90, st.crit + (sup.crit || 0) + bsum(me, 'crit')) : 0,
      critMulti: st.critMulti + (sup.cm || 0),
      ail: (st.ail || 1) * (1 + (sup.ail || 0) / 100),
      leech: (st.leech || 0) + (sup.leech || 0),
      brk: Math.max(st.brk || 0, sup.pen || 0),
      penRes: (st.penRes || 0) + (sup.penRes || 0),
      bleedCh: (st.bleedCh || 0) + (sup.bleed || 0) + (sk.bleed || 0),
      stunCh: (st.stunCh || 0) + (sup.stun || 0),
      poisonCh: Math.min(100, (st.poisonCh || 0) + (sup.poison || 0)),
      exec: (st.exec || 0) + (sup.exec || 0) + (sk.exec || 0),
      dotMul: (st.dotMul || 1) * (1 + (sup.dot || 0) / 100)
    },
    more =
      (1 + (sup.more || 0) / 100) *
      (1 + bsum(me, 'more') / 100) *
      (1 + ((me.stacks || 0) * (st.killStack || 0)) / 100) *
      (ext.allyMul || 1) *
      /* 技能要求的武器不符：傷害 -40% */
      (sk.w && st.wtag && sk.w !== st.wtag && !st.anyWep ? 0.6 : 1),
    who = me.uid;
  if (me.dc) {
    S2.crit = 100;
    me.dc = 0;
  }
  if (sk.kind === 'heal') {
    const tg = party.filter(q => q.alive !== false).sort((a, b) => a.hp / a.st.maxhp - b.hp / b.st.maxhp)[0] || me,
      v = Math.round(tg.st.maxhp * (sk.heal || 0.35) * (st.healMul || 1));
    tg.hp = Math.min(tg.st.maxhp, tg.hp + v);
    ev.push({ t: 'heal', who: tg.uid, from: who, v, at: 250 });
    const ha = (st.healAll || 0) + (sk.healAll || 0);
    if (ha)
      party
        .filter(q => q.alive !== false && q !== tg)
        .forEach(q => {
          const w = Math.round((v * ha) / 100);
          q.hp = Math.min(q.st.maxhp, q.hp + w);
          ev.push({ t: 'heal', who: q.uid, from: who, v: w, at: 300 });
        });
    if (sk.buff) addBuff(me, sk, ev);
    return ev;
  }
  if (sk.kind === 'buff') {
    addBuff(me, sk, ev);
    return ev;
  }
  if (sk.pet) {
    const max = (sk.pet.max || 3) + (sup.petMax || 0);
    me.pets = (me.pets || []).filter(p => p.turns > 0);
    for (let k = 0; k < (sk.pet.n || 1) && me.pets.length < max; k++)
      me.pets.push({ ...sk.pet, turns: (sk.pet.turns || 4) + (sup.petTurns || 0), pct: sup.petPct || 0 });
    ev.push({ t: 'msg', s: `召喚${sk.pet.name}（${me.pets.length}/${max}）`, at: 0 });
    ev.push({ t: 'fx', type: 'summon', who, at: 200 });
    if (!sk.mult) return ev;
  }
  if (sk.guard) {
    me.guard = sk.guard;
    ev.push({ t: 'st', who, s: '護甲↑', col: '#9fd4ef', at: 100 });
  }
  const spell = sk.kind === 'spell',
    gap = spell ? 260 : 330,
    fx = spell ? sk.fx : sk.fx === 'whirl' ? 'whirl' : sk.fx === 'arrow' || st.ranged ? 'pierce' : 'slash';
  let at = spell ? 600 : 200;
  const live = () => aliveIdx(es);
  const one = (i, mult, t, kind) => {
    const e = es[i];
    if (!e || e.hp <= 0) return;
    const pk = heroPacket(S2, sk, mult * more);
    if (sk.addEl) pk[sk.addEl[0]] += pk.phys * sk.addEl[1] * ((st.elm && st.elm[sk.addEl[0]]) || 1);
    const r = heroDmg(S2, pk, e, e.shock > 0, me);
    let d = r.d;
    if (e.sin && ext.sinHit) d = ext.sinHit(e, d, i);
    e.hp = Math.max(0, e.hp - d);
    ev.push({ t: 'hit', i, d, crit: r.crit, col: r.crit ? '#ffd166' : hitCol(pk), fx: kind || fx, from: who, at: t });
    if (S2.leech && d > 0) me.hp = Math.min(st.maxhp, me.hp + Math.max(1, Math.round((d * S2.leech) / 100)));
    if (e.hp > 0) {
      heroAil(S2, sk, pk, e).forEach(([s, col]) => ev.push({ t: 'st', i, s, col, at: t + 60 }));
      if (sk.poison) {
        e.poison = Math.max(e.poison, sk.poison);
        e.pMul = st.poisonMul || 1;
        ev.push({ t: 'st', i, s: '中毒', col: '#9be36b', at: t + 80 });
      }
      if ((sk.mark || st.markFirst) && !e.mark) {
        e.mark = 99;
        e.markP = Math.max(sk.mark || 0, st.markFirst || 0);
        ev.push({ t: 'st', i, s: '標記', col: '#ffd166', at: t + 90 });
      }
      if (sk.curse) {
        e.curse = 3;
        e.curseP = Math.max(e.curseP || 0, sk.curse);
        e.curseW = Math.max(e.curseW || 0, sk.curseW || 0);
        ev.push({ t: 'st', i, s: '詛咒', col: '#c86aff', at: t + 75 });
      }
      if (sk.stun && Math.random() < sk.stun) {
        e.stun = 1;
        ev.push({ t: 'st', i, s: '暈眩', col: '#ffe27a', at: t + 70 });
      }
    } else {
      ev.push({ t: 'kill', i, at: t + 100 });
      if (st.killStack) me.stacks = Math.min(st.killMax || 10, (me.stacks || 0) + 1);
      if (st.killHeal) me.hp = Math.min(st.maxhp, me.hp + Math.round((st.maxhp * st.killHeal) / 100));
      if (st.killMana) me.mp = Math.min(st.maxmp, me.mp + Math.round((st.maxmp * st.killMana) / 100));
      /* 異常擴散：死掉的敵人身上的燃燒、中毒、流血傳給其他敵人 */
      if (st.spread || sup.spread)
        for (const j of live()) {
          const o = es[j];
          if (e.burn) Object.assign(o, { burn: Math.max(o.burn, 2), burnDmg: Math.max(o.burnDmg, e.burnDmg) });
          if (e.poison) Object.assign(o, { poison: Math.max(o.poison, 2), pMul: e.pMul });
          if (e.bleed) Object.assign(o, { bleed: Math.max(o.bleed, 2), bleedDmg: Math.max(o.bleedDmg, e.bleedDmg) });
        }
    }
    if (e.mods && e.mods.includes('reflect')) {
      const rf = Math.max(1, Math.round(d * 0.15));
      me.hp = Math.max(1, me.hp - rf);
      ev.push({ t: 'dmg', who, d: rf, col: '#ff8a8a', at: t + 50 });
    }
  };
  const target = () => (es[ti] && es[ti].hp > 0 ? ti : live()[0]);
  const wave = () => {
    const tg = sup.aoe ? 'all' : sk.tg || 'one',
      hits = Math.max(
        1,
        (sk.hits || 1) + (sup.hits || 0) + extraHit(st, sk) + (st.legWrath && me.hp < st.maxhp / 2 ? 1 : 0)
      ),
      chain = (sk.chain || 0) + (sup.chain || 0),
      proj = (sk.proj || 0) + (sup.proj || 0);
    for (let h = 0; h < hits; h++) {
      if (!live().length) break;
      if (tg === 'all') live().forEach(i => one(i, sk.mult * (sup.aoe && sk.tg !== 'all' ? 0.65 : 1), at, fx));
      else if (tg === 'rand') {
        const L = live();
        one(L[fl(Math.random() * L.length)], sk.mult, at, fx);
      } else {
        const i0 = target();
        if (i0 == null) break;
        one(i0, sk.mult, at, fx);
        const seen = new Set([i0]);
        for (let c = 0; c < chain; c++) {
          const L = live().filter(j => !seen.has(j));
          if (!L.length) break;
          const j = L[fl(Math.random() * L.length)];
          seen.add(j);
          one(j, sk.mult * Math.pow(0.8, c + 1), at + 120 * (c + 1), 'chain');
        }
      }
      for (let p = 0; p < proj; p++) {
        const L = live(),
          o = L.filter(j => j !== ti);
        const j = (o.length ? o : L)[fl(Math.random() * (o.length ? o : L).length)];
        if (j != null) one(j, sk.mult * 0.7, at + 60 * (p + 1), fx);
      }
      at += gap;
    }
  };
  wave();
  /* 法術迴響／連珠：有機率整個技能再放一次 */
  if (live().length && Math.random() * 100 < (sup.echo || 0) + (st.echo || 0)) {
    ev.push({ t: 'msg', s: `${sk.name}・迴響！`, at });
    at += 200;
    wave();
  }
  if (sk.buff) addBuff(me, sk, ev);
  ev.push({ t: 'end', at: at + 200 });
  return ev;
}
function addBuff(me, sk, ev) {
  me.buffs = (me.buffs || []).filter(b => b.id !== sk.buff.id);
  me.buffs.push({ ...sk.buff, id: sk.buff.id || sk.name, turns: sk.buff.turns || 3 });
  if (sk.buff.shield) me.shield = Math.round((me.st ? me.st.maxhp : 100) * sk.buff.shield);
  ev.push({ t: 'st', who: me.uid, s: sk.buff.n || sk.name, col: '#9fd4ef', at: 200 });
  ev.push({ t: 'fx', type: 'heal', who: me.uid, at: 150 });
}
/* 召喚物在施放者行動後攻擊隨機敵人 */
function petsAct(me, st, es) {
  const ev = [];
  let at = 0;
  me.pets = (me.pets || []).filter(p => p.turns > 0);
  for (const p of me.pets) {
    const L = aliveIdx(es);
    if (!L.length) break;
    const i = L[fl(Math.random() * L.length)],
      e = es[i],
      base = (8 + (me.lv || S.lv) * 1.8) * (p.mult || 1) * (1 + ((st.petPct || 0) + (p.pct || 0)) / 100),
      pk = { phys: 0, fire: 0, cold: 0, light: 0 };
    pk[p.el || 'phys'] = base * rnd(0.85, 1.15) * (p.el && p.el !== 'phys' ? st.spellMul || 1 : 1);
    const d = Math.round(mitigate(pk, e.arm, e.res, e.shock > 0));
    e.hp = Math.max(0, e.hp - d);
    ev.push({ t: 'hit', i, d, col: '#d8c8ff', fx: 'slash', pet: 1, at });
    if (e.hp <= 0) ev.push({ t: 'kill', i, at: at + 100 });
    p.turns--;
    at += 260;
  }
  if (ev.length) ev.push({ t: 'end', at: at + 150 });
  return ev;
}
/* 敵人 i 的行動（單人與組隊共用）：先結算持續傷害，再攻擊隊員；party 是 [{uid, hp, mp, st, guard, …}] */
function enemyResolve(es, i, party, ext = {}) {
  const e = es[i],
    ev = [];
  let at = 0;
  const dot = (n, col) => {
    e.hp = Math.max(0, e.hp - n);
    ev.push({ t: 'hit', i, d: n, col, dot: 1, at });
    at += 180;
  };
  if (e.poison > 0) {
    dot(poisonTick(e, e), '#9be36b');
    e.poison--;
  }
  if (e.burn > 0) {
    dot(e.burnDmg, '#ffb15a');
    e.burn--;
  }
  if (e.bleed > 0) {
    dot(e.bleedDmg, '#ff5a5a');
    e.bleed--;
  }
  if (e.shock > 0) e.shock--;
  if (e.curse > 0) e.curse--;
  if (e.hp <= 0) {
    ev.push({ t: 'kill', i, at }, { t: 'end', at: at + 300 });
    return ev;
  }
  if (e.frozen || e.stun) {
    ev.push({ t: 'msg', s: `${e.name} ${e.frozen ? '被凍住' : '暈眩中'}，無法行動`, at });
    e.frozen = e.stun = 0;
    ev.push({ t: 'end', at: at + 700 });
    return ev;
  }
  if (e.sin && ext.sinTurn) ext.sinTurn(e, i);
  const acts = e.mods && e.mods.includes('swift') && Math.random() < 0.35 ? 2 : 1,
    ew = ext.ew || 0;
  for (let n = 0; n < acts; n++) {
    const alive = party.filter(p => p.alive !== false && p.hp > 0);
    if (!alive.length) break;
    /* 嘲諷：每 1% 嘲諷讓自己被選中的權重 +1% */
    const wt = alive.map(q => 1 + ((q.st.taunt || 0) + bsum(q, 'taunt')) / 100);
    let x = Math.random() * wt.reduce((a, b) => a + b, 0),
      pi = 0;
    while (pi < alive.length - 1 && (x -= wt[pi]) >= 0) pi++;
    const p = alive[pi],
      st = p.st,
      strong = Math.random() < 0.15;
    ev.push({
      t: 'msg',
      s: strong ? `${e.name} 的猛力一擊！` : `${e.name} 攻擊${party.length > 1 ? ' ' + p.name : ''}`,
      at
    });
    ev.push({ t: 'lunge', i, at });
    at += 210;
    if (Math.random() * 100 < Math.min(75, (st.dodge || 0) + bsum(p, 'dodge'))) {
      ev.push({ t: 'dodge', who: p.uid, at });
      if (st.dodgeCrit) p.dc = 1;
      /* 閃避反擊：用普通攻擊的一部分傷害打回去 */
      if (st.counter) {
        const pk = heroPacket(st, SKILLS.attack, st.counter / 100),
          r = heroDmg(st, pk, e, e.shock > 0, p);
        e.hp = Math.max(0, e.hp - r.d);
        ev.push({ t: 'hit', i, d: r.d, crit: r.crit, col: '#ffd166', fx: 'pierce', from: p.uid, at: at + 120 });
        if (e.hp <= 0) {
          ev.push({ t: 'kill', i, at: at + 220 });
          break;
        }
      }
      at += 480;
      continue;
    }
    let atk = e.atk * (strong ? 1.5 : 1) * rnd(0.9, 1.1);
    if (e.mods && e.mods.includes('fury') && e.hp < e.maxhp / 2) atk *= 1.5;
    if (e.curse > 0 && e.curseW) atk *= 1 - e.curseW / 100;
    const pk = { phys: 0, fire: 0, cold: 0, light: 0 };
    pk[e.el] += atk;
    if (e.mods) {
      if (e.mods.includes('fire')) pk.fire += atk * 0.4;
      if (e.mods.includes('cold')) pk.cold += atk * 0.4;
      if (e.mods.includes('shock')) pk.light += atk * 0.4;
    }
    let d = Math.round(
      mitigate(
        pk,
        st.armor * (p.guard > 0 ? 2 : 1) * (1 + bsum(p, 'arm') / 100),
        (Array.isArray(st.res) ? st.res : [st.res.fire, st.res.cold, st.res.light]).map(v => v - ew),
        false
      ) *
        (1 - Math.min(75, (st.dmgRed || 0) + bsum(p, 'dmgRed')) / 100)
    );
    if (st.block && Math.random() * 100 < st.block) {
      d = Math.round(d * 0.3);
      ev.push({ t: 'st', who: p.uid, s: '格擋', col: '#9fd4ef', at });
    }
    const toMp = takeDmg(p, st, d);
    ev.push({
      t: 'dmg',
      who: p.uid,
      d: d - toMp,
      mp: toMp,
      strong,
      col: pk.fire > pk.phys ? '#ffb15a' : pk.cold > pk.phys ? '#9fe7ff' : pk.light > pk.phys ? '#fff27a' : '#ff8a8a',
      at
    });
    if (st.reflectPct) {
      const rf = Math.max(1, Math.round((d * st.reflectPct) / 100));
      e.hp = Math.max(0, e.hp - rf);
      ev.push({ t: 'hit', i, d: rf, col: '#9fd4ef', at: at + 120 });
    }
    if (e.mods && e.mods.includes('leech')) {
      const hl = Math.round(d * 0.15);
      if (hl > 0) e.hp = Math.min(e.maxhp, e.hp + hl);
    }
    if (pk.cold > 0 && !st.noFreeze && Math.random() < 0.12 && p.hp > 0) {
      p.frozen = 1;
      ev.push({ t: 'st', who: p.uid, s: '凍結', col: '#9fe7ff', at: at + 100 });
    }
    if (p.hp <= 0) {
      p.alive = false;
      ev.push({ t: 'down', who: p.uid, at: at + 200 });
    }
    if (e.hp <= 0) {
      ev.push({ t: 'kill', i, at: at + 220 });
      break;
    }
    at += 520;
  }
  ev.push({ t: 'end', at: at + 200 });
  return ev;
}
/* 每輪結束：回復、防禦與增益倒數、昇華的扣血代價 */
function roundEnd(p) {
  const st = p.st;
  if (p.alive === false || p.hp <= 0) return;
  if (st.regen) p.hp = Math.min(st.maxhp, p.hp + st.regen);
  if (st.manaRegen) p.mp = Math.min(st.maxmp, p.mp + st.manaRegen);
  if (st.hpDrain) p.hp = Math.max(1, p.hp - Math.round((st.maxhp * st.hpDrain) / 100));
  if (p.guard > 0) p.guard--;
  p.buffs = (p.buffs || []).filter(b => --b.turns > 0);
}
/* 開場：昇華的護盾、先制增益 */
function battleOpen(p) {
  const st = p.st;
  if (st.shieldPct) p.shield = Math.round((st.maxhp * st.shieldPct) / 100);
  /* 馴獸師：戰鬥開始就帶著野狼 */
  if (st.petStart) {
    const w = MONS.find(m => m.spr === 'wolf');
    p.pets = (p.pets || []).concat(
      Array.from({ length: st.petStart }, () => ({ name: '野狼', spr: 'wolf', pal: w && w.pal, mult: 0.9, turns: 99 }))
    );
  }
  if (!st.keepStacks) p.stacks = 0;
}

/* ================= battle: solo ================= */
/* 單人的自己：hp、mp 直接讀寫 S，其他是這場戰鬥的狀態 */
function heroMe() {
  return {
    uid: 'me',
    get name() {
      return S.name || '你';
    },
    get hp() {
      return S.hp;
    },
    set hp(v) {
      S.hp = v;
    },
    get mp() {
      return S.mp;
    },
    set mp(v) {
      S.mp = v;
    },
    lv: S.lv,
    st: stats(),
    guard: 0,
    frozen: 0,
    shield: 0,
    dc: 0,
    stacks: S.stacks || 0,
    pets: [],
    buffs: []
  };
}
/* e 可以是一隻敵人或陣列；opts.pack 會依稀有度帶小怪 */
function startBattle(e, opts = {}) {
  if (B) return;
  closeSheet();
  if (!Array.isArray(e)) for (const k of ['ud', 'mist', 'uw']) if (opts[k]) e[k] = opts[k];
  const es = (Array.isArray(e) ? e : [e, ...(opts.pack ? packOf(e, opts.extra || 0) : [])]).map(eInit);
  B = { ...opts, e: es[0], es, ti: 0, me: heroMe(), busy: true, sub: null, act: -1 };
  battleOpen(B.me);
  simTarget = null;
  BFX.pops = [];
  BFX.fx = [];
  BFX.en = es.map(() => ({ a: null, flash: 0 }));
  BFX.hero = { a: null };
  BFX.motes = Array.from({ length: 30 }, () => ({
    x: Math.random(),
    y: Math.random(),
    v: rnd(0.0005, 0.0015),
    p: Math.random() * 6.28
  }));
  sfx('encounter');
  buzz(60);
  $('battle').hidden = false;
  renderBHud();
  sizeBattle();
  paintBG(opts.bg || es[0].bg || 'meadow');
  BFX.t0 = performance.now();
  playSong(B.boss || es.some(q => q.rar >= 2) ? 'boss' : 'battle');
  renderBHud();
  bmsg(
    es.length > 1
      ? `${es[0].name} 帶著 ${es.length - 1} 隻同伴出現了！`
      : es[0].rar
        ? `${RNAME[es[0].rar]}怪物：${es[0].name}`
        : `${es[0].name} 出現了！`
  );
  setTimeout(() => {
    if (B) {
      B.busy = false;
      renderBHud();
    }
  }, 700);
}
/* 點畫面上的敵人換目標（單人與組隊共用） */
function pickTarget(x, y) {
  const es = B ? B.es : MB ? MB.es : null,
    boss = B ? B.boss : MB && MB.boss;
  if (!es) return;
  let best = -1,
    bd = 1e9;
  es.forEach((e, i) => {
    if (e.hp <= 0) return;
    const q = epos(i, es, boss),
      d = Math.hypot(q.x - x, q.y - 8 * q.s - y);
    if (d < bd && d < 14 * q.s + 30) {
      bd = d;
      best = i;
    }
  });
  if (best < 0) return;
  sfx('tap');
  if (B) {
    B.ti = best;
    renderBHud();
  } else {
    MB.tg = best;
    renderMBHud();
  }
}
$('bview').addEventListener('pointerdown', ev => {
  if (ev.target.closest('button')) return;
  const r = $('bview').getBoundingClientRect();
  pickTarget(ev.clientX - r.left, ev.clientY - r.top);
});
function renderBHud() {
  if (!B) return;
  const st = stats(),
    es = B.es;
  if (!es[B.ti] || es[B.ti].hp <= 0) B.ti = Math.max(0, aliveIdx(es)[0] ?? 0);
  const e = es[B.ti],
    q = epos(B.ti, es, B.boss),
    p = POS();
  $('bname').innerHTML =
    `<span style="color:${RCOL[e.rar || 0]}">${esc(e.name)}</span><small>Lv${e.lv}${B.boss && B.ti === 0 ? '・首領' : ''}${e.mods && e.mods.length ? '・' + modNames(e) : ''}</small>`;
  placeBName(q);
  {
    /* 單人：你先，再來是每隻還活著的敵人 */
    const me = { n: S.name || '你', c: 'me', img: portrait(heroSpr('F'), heroPal()) },
      ens = es
        .map((o, i) => (o.hp > 0 ? { n: o.name, c: 'e', img: portrait(o.spr, o.pal), on: B.act === i } : null))
        .filter(Boolean);
    renderOrder([{ ...me, on: B.act < 0 && !B.busy }, ...ens, { h: '下一輪' }, me]);
  }
  setFloor(
    D ? `${D.kind === 'rift' ? '裂隙' : ''}第 ${D.room + 1}/${D.spec.floors} ${D.kind === 'rift' ? '波' : '層'}` : ''
  );
  $('bstat').hidden = true;
  const sc = battleSc(),
    big = bossBar(B.boss ? es[0] : es.find(o => (o.rar || 0) >= 3 && o.hp > 0), B.boss && es[0].hp > 0);
  $('bname').hidden = big && (B.ti === 0 || !B.boss);
  $('eail').innerHTML = '';
  placeAil('hail', p.hx + 6 * sc, p.hy - 16 * sc, ailHTML(B.me, AIL_H));
  const hp = $('hpills');
  hp.style.left = p.hx + 'px';
  hp.style.top = p.hy + 14 + 'px';
  /* 單人的玩家面板：名字與等級、生命（數值）、魔力（數值）、經驗細條 */
  const bar = (cls, v, max, txt) =>
    `<i class="hb ${cls}"><i style="width:${Math.max(0, Math.min(100, (v / max) * 100))}%"></i>${txt ? `<em>${txt}</em>` : ''}</i>`;
  hp.innerHTML = `<div class="hpanel${S.hp < st.maxhp * 0.3 ? ' low' : ''}"><div class="hrow"><b>${esc(S.name || '你')}</b><span>Lv${S.lv}</span></div>${bar('hhp', S.hp, st.maxhp, `${Math.max(0, Math.ceil(S.hp))} / ${st.maxhp}`)}${bar('hmp', S.mp, st.maxmp, `${Math.max(0, Math.round(S.mp))} / ${st.maxmp}`)}${bar('hxp', S.xp, xpNeed(S.lv))}</div>`;
  $('epills').innerHTML = enemyBars(es, es.length > 1 ? B.ti : -1, B.boss);
  const sks = mySkills(),
    sk = sks.map((q, i) => q && 's' + i).filter(Boolean),
    dis = B.busy ? 'disabled' : '';
  const cb = (label, icon, sub, act, data, disabled, extra = '') =>
    `<button class="cb ${extra}" data-act="${act}" ${data} ${disabled || dis}><img src="${iconURL(icon)}" alt="">${label}${sub ? `<small>${sub}</small>` : ''}</button>`;
  const noPot = st.noPotion;
  const slot = k => {
    const q = k && sks[+k.slice(1)];
    return q
      ? cb(q.name, q.icon, costTxt(st, q), 'skill', `data-k="${k}"`, canPay(S, st, q) ? '' : 'disabled')
      : cb(
          '生命藥水',
          'heart',
          noPot ? '無法使用' : '×' + S.potions,
          'bitem',
          'data-k="potions"',
          S.potions && !noPot ? '' : 'disabled'
        );
  };
  let html =
    slot(sk[0]) +
    cb('攻擊', 'axe', '', 'skill', 'data-k="attack"', '') +
    slot(sk[1]) +
    cb('技能', 'book', '', 'bsub', 'data-k="skills"', '') +
    cb('逃跑', 'run', D ? '無法逃跑' : '', 'flee', '', D ? 'disabled' : '', 'run') +
    cb('物品', 'bag', '', 'bsub', 'data-k="items"', '');
  if (B.sub === 'skills')
    html += `<div class="bsub">${sk.length ? sk.map(slot).join('') : '<p class="sub">技能欄是空的，到「角色 → 技能」裝上技能石</p>'}${cb('返回', 'run', '', 'bsub', 'data-k=""', '')}</div>`;
  if (B.sub === 'items')
    html += `<div class="bsub">${cb('生命藥水', 'heart', noPot ? '昇華代價：無法使用' : '×' + S.potions + '・恢復 40%', 'bitem', 'data-k="potions"', S.potions && !noPot ? '' : 'disabled')}${cb('魔力藥水', 'ice', '×' + S.ethers + '・恢復 50%', 'bitem', 'data-k="ethers"', S.ethers ? '' : 'disabled')}${cb('返回', 'run', '', 'bsub', 'data-k=""', '')}</div>`;
  $('bcmd').innerHTML = html;
}
/* 把結算事件排進畫面：跳數字、特效、動畫；回傳這段要播多久 */
function playEv(ev) {
  let end = 0;
  const p = POS();
  for (const f of ev) {
    end = Math.max(end, f.at || 0);
    later(f.at || 0, () => {
      const es = B.es,
        q = f.i != null ? epos(f.i, es, B.boss) : null;
      if (f.t === 'hit') {
        const fe = BFX.en[f.i] || (BFX.en[f.i] = {});
        fe.flash = performance.now();
        anim(fe, 'hurt', 300);
        if (f.from === 'me' && !f.dot && !f.pet) {
          if (f.fx === 'slash' || f.fx === 'whirl') anim(BFX.hero, 'lunge', 380);
          else anim(BFX.hero, 'cast', 300);
          BFX.fx.push({ type: f.fx, t: performance.now(), dur: f.fx === 'fire' || f.fx === 'ice' ? 600 : 300, i: f.i });
          if (f.fx === 'pierce') BFX.fx.push({ type: 'arrow', t: performance.now() - 200, dur: 260, i: f.i });
        }
        if (f.pet) BFX.fx.push({ type: 'slash', t: performance.now(), dur: 260, i: f.i });
        pop(f.crit ? f.d + '!' : String(f.d), q.x + rnd(-12, 12), etop(q) + 24, f.col);
        if (f.crit) {
          BFX.shake = performance.now();
          sfx('crit');
          buzz(40);
        } else
          sfx(f.fx === 'fire' ? 'fire' : f.fx === 'ice' ? 'ice' : f.fx === 'bolt' ? 'bolt' : f.dot ? 'tap' : 'hit');
      } else if (f.t === 'kill') {
        (BFX.en[f.i] || (BFX.en[f.i] = {})).dying = performance.now();
        sfx('win');
      } else if (f.t === 'st') {
        if (f.i != null) pop(f.s, q.x, etop(q) + 4, f.col);
        else pop(f.s, p.hx, p.hy - 110, f.col);
      } else if (f.t === 'dmg') {
        anim(BFX.hero, 'hurt', 320);
        BFX.shake = performance.now();
        sfx('hurt');
        buzz(f.strong ? 120 : 50);
        if (f.mp) pop(f.mp + ' MP', p.hx + 30, p.hy - 70, '#6ab8ff');
        pop(String(f.d), p.hx, p.hy - 90, f.col);
      } else if (f.t === 'heal') {
        BFX.fx.push({ type: 'heal', t: performance.now(), dur: 700 });
        sfx('heal');
        pop('+' + f.v, p.hx, p.hy - 90, '#7bd36b');
      } else if (f.t === 'dodge') {
        pop('閃避', p.hx, p.hy - 90, '#d8d2c4');
        sfx('tap');
      } else if (f.t === 'lunge') anim(BFX.en[f.i], 'lunge', 420);
      else if (f.t === 'msg') bmsg(f.s);
      else if (f.t === 'fx') BFX.fx.push({ type: f.type, t: performance.now(), dur: 700 });
      renderBHud();
    });
  }
  return end;
}
const soloExt = () => ({
  sinHit: (e, d, i) => {
    const q = epos(i, B.es, B.boss),
      p = POS();
    return sinHit(e, d, { hx: p.hx, hy: p.hy, ex: q.x, y: q.y });
  },
  sinTurn: (e, i) => {
    const q = epos(i, B.es, B.boss),
      p = POS();
    sinTurn(e, { hx: p.hx, hy: p.hy, ex: q.x, y: q.y });
  },
  ew: curSpec() && curSpec().eleweak ? 20 : 0
});
function useSkill(k) {
  const sk = skByKey(k, mySkills()),
    st0 = sk && skSt(stats(), sk);
  if (!B || B.busy || !sk || !canPay(S, st0, sk)) return;
  B.busy = true;
  B.sub = null;
  payCost(S, stats(), sk);
  sfx('select');
  bmsg(sk.name);
  B.me.st = stats();
  B.me.lv = S.lv;
  const ev = actResolve(B.me, B.me.st, sk, B.es, B.ti, [B.me], {
    ...soloExt(),
    allyMul: 1
  });
  if (sk.kind === 'spell') {
    anim(BFX.hero, 'cast', 500);
    BFX.fx.push({ type: 'charge', t: performance.now(), dur: 450 });
  }
  renderBHud();
  const t = playEv(ev);
  later(t + 150, () => {
    const pe = petsAct(B.me, B.me.st, B.es);
    later(playEv(pe) + 100, afterPlayer);
  });
}
function bItem(k) {
  if (!B || B.busy || !S[k]) return;
  const st = stats();
  if (k === 'potions' && st.noPotion) return;
  B.busy = true;
  B.sub = null;
  sfx('heal');
  const p = POS(),
    hm = st.healMul * (curSpec() && curSpec().noregen ? 0.5 : 1) * (1 + (st.potPct || 0) / 100);
  S[k]--;
  if (k === 'potions') {
    const v = Math.round(st.maxhp * 0.4 * hm);
    S.hp = Math.min(st.maxhp, S.hp + v);
    pop('+' + v, p.hx, p.hy - 90, '#7bd36b');
    if (st.legGlut) S.mp = Math.min(st.maxmp, S.mp + v);
  } else {
    const v = Math.round(st.maxmp * 0.5 * hm);
    S.mp = Math.min(st.maxmp, S.mp + v);
    pop('+' + v + ' MP', p.hx, p.hy - 90, '#6ab8ff');
  }
  BFX.fx.push({ type: 'heal', t: performance.now(), dur: 700 });
  bmsg(k === 'potions' ? '生命藥水' : '魔力藥水');
  /* 鍊金術士：喝藥水時順便丟藥瓶炸所有敵人 */
  let t = 0;
  if (st.potBomb) {
    const ev = [];
    aliveIdx(B.es).forEach(i => {
      const e = B.es[i],
        d = Math.round(
          mitigate(
            { phys: 0, fire: (st.physLo + st.physHi) * 0.5 * (st.potBomb / 100), cold: 0, light: 0 },
            e.arm,
            e.res,
            false
          )
        );
      e.hp = Math.max(0, e.hp - d);
      ev.push({ t: 'hit', i, d, col: '#ffb15a', fx: 'fire', from: 'me', at: 300 });
      if (e.hp <= 0) ev.push({ t: 'kill', i, at: 400 });
    });
    t = playEv(ev);
  }
  renderBHud();
  later(Math.max(800, t + 300), afterPlayer);
}
function flee() {
  if (!B || B.busy || D) return;
  B.busy = true;
  B.sub = null;
  sfx('select');
  renderBHud();
  if (Math.random() < 0.7) {
    bmsg('成功逃跑！');
    addLog(`從 ${B.e.name} 身邊逃走了`);
    later(700, () => endBattle());
  } else {
    bmsg('逃跑失敗！');
    later(700, afterPlayer);
  }
}
const allDead = es => es.every(e => e.hp <= 0);
function afterPlayer() {
  if (allDead(B.es)) return later(700, winBattle);
  /* 昇華：有機率再行動一次 */
  if (B.me.st.extraTurn && Math.random() * 100 < B.me.st.extraTurn) {
    bmsg('再行動一次！');
    B.busy = false;
    renderBHud();
    return;
  }
  later(250, () => enemyPhase(0));
}
/* 敵人依序行動 */
function enemyPhase(i) {
  const es = B.es;
  while (i < es.length && es[i].hp <= 0) i++;
  if (i >= es.length) return endRound();
  B.act = i;
  renderBHud();
  B.me.st = stats();
  const ev = enemyResolve(es, i, [B.me], soloExt()),
    t = playEv(ev);
  later(t + 150, () => {
    B.act = -1;
    if (S.hp <= 0) return later(400, loseBattle);
    if (allDead(es)) return later(500, winBattle);
    enemyPhase(i + 1);
  });
}
function endRound() {
  if (!B) return;
  B.act = -1;
  roundEnd(B.me);
  if (B.me.frozen) {
    B.me.frozen = 0;
    bmsg('你被凍住了，跳過這回合');
    renderBHud();
    later(900, () => enemyPhase(0));
    return;
  }
  B.busy = false;
  renderBHud();
}

/* ================= dungeons (shared by solo and party) ================= */
/* 把地圖上的地城／裂隙／試煉整理成一份規格：層數、怪物倍率、附加詞綴、掉寶加成 */
function dunSpec(t) {
  const dt = DTYPES[t.dt || 'normal'],
    mods = (t.mods || []).map(id => DMODI[id]).filter(Boolean),
    dm = { hp: dt.hp, atk: 1, arm: 1 };
  let q = dt.q,
    r = dt.r;
  q += (t.xk || 0) * 15;
  r += (t.xk || 0) * 15;
  for (const m of mods) {
    q += m.q;
    r += m.r;
    if (m.dm) for (const k in m.dm) dm[k] *= m.dm[k];
  }
  const has = id => mods.some(m => m.id === id);
  return {
    dt: t.dt || 'normal',
    floors: t.floors || (t.kind === 'rift' || t.kind === 'landmark' ? 3 : dt.floors),
    mods: mods.map(m => m.id),
    q,
    r,
    dm,
    em: [...new Set([...mods.filter(m => m.em).map(m => m.em), ...(t.umods || [])])],
    norevive: !!dt.norevive,
    sin: t.sin,
    xk: t.xk || 0,
    noregen: has('noregen'),
    eleweak: has('eleweak'),
    elite: has('elite')
  };
}
const dunName = t =>
  t.kind === 'rift'
    ? '魔物裂隙'
    : t.kind === 'landmark'
      ? t.dn
      : t.kind === 'asc'
        ? '昇華試煉'
        : DTYPES[t.dt || 'normal'].n;
const BIGBOSS = { hell: '地獄領主', circle: '魔法陣主宰', portal: '冥府之主', stele: '石碑守衛' },
  BOSSSPR = { hell: 'b_hellord', circle: 'b_arcane', portal: 'b_hades', stele: 'b_stelekeeper' };
/* 第 room 層的敵人群（0.3 起一層是一群，最多 5 隻）。boss 在最後一層；extra 是組隊多出來的隻數 */
function dunEnemy(D, room, extra = 0) {
  const sp = D.spec,
    boss = room === sp.floors - 1,
    r = h(D.seed, room, 9),
    addEm = e => {
      for (const m of sp.em)
        if (!e.mods.includes(m)) {
          e.mods.push(m);
          uwApply(e, m);
        }
      if (sp.em.some(m => EMODI[m] && EMODI[m].uw) && !e.name.startsWith('冥府')) e.name = '冥府・' + e.name;
      return e;
    },
    /* 一般小怪（菁英詞綴的地城比較常出魔法、稀有） */
    mob = (k, lv = D.lv) => {
      const q = h(r, k, 3) % 100,
        el = sp.elite ? 55 : 25,
        rar = sp.elite && q < 12 ? 2 : q < el ? 1 : 0,
        rr = h(r, k, 5);
      return makeEnemy(pickMon(rr, lv), lv, rar, rar ? rollMods(rr, rar === 2 ? 3 : 1) : [], sp.dm);
    },
    group = (lead, n) => {
      const out = [lead];
      for (let k = 0; k < Math.min(4, n + extra); k++) {
        const m = mob(k + 1, Math.max(1, D.lv - (k % 2)));
        /* 同一群的其他怪稍微弱一點，避免一層的總傷害爆掉 */
        m.maxhp = m.hp = Math.round(m.maxhp * 0.7);
        m.atk = Math.round(m.atk * 0.7);
        m.minion = 1;
        out.push(m);
      }
      return out.map(addEm);
    };
  /* 七宗罪：雕像挑戰的最後一層是該宗罪的王；七宗罪之王 7 層依序是 7 個王，第 8 層是七宗罪之王 */
  if (sp.dt === 'sinking' || (boss && sp.sin)) {
    const e =
      sp.dt === 'sinking'
        ? room < 7
          ? makeSinLord(SINS[room].k, D.lv)
          : makeSinKing(D.lv + 2)
        : makeSinLord(sp.sin, D.lv + 1);
    const es = group(e, 0);
    return { e: es[0], es, bg: 'cave', boss: true };
  }
  let e, bg, n;
  if (D.kind === 'rift') {
    const b = pickMon(r, D.lv);
    e = boss
      ? makeEnemy(b, D.lv + 1, 2, rollMods(r, 3), sp.dm)
      : makeEnemy(b, D.lv, 1, rollMods(r, 1 + (r % 2)), sp.dm);
    bg = b.bg;
    n = boss ? 1 : 1 + (r % 2);
  } else if (boss) {
    const hell = (!!BIGBOSS[sp.dt] && sp.dt !== 'stele') || D.kind === 'asc',
      bn = D.lm
        ? `${D.lm.dn}守護者`
        : D.kind === 'asc'
          ? '昇華試煉守衛'
          : BIGBOSS[sp.dt] || (sp.dt === 'party' ? '深淵看守' : '洞窟守護者'),
      /* 首領專屬圖：地標是石獅、組隊是深淵之眼、地獄／魔法陣／冥府／石碑各自一張 */
      bspr = D.lm
        ? 'b_lion'
        : D.kind === 'asc'
          ? 'b_arcane'
          : BOSSSPR[sp.dt] || (sp.dt === 'party' ? 'b_abyss' : 'b_golem');
    e = makeEnemy(
      {
        name: bn,
        bg: 'cave',
        hp: 70,
        atk: 12,
        arm: 30,
        el: D.lm ? 'cold' : hell ? 'fire' : 'phys',
        res: [25, 25, 25],
        xp: 30,
        gold: 30,
        spr: bspr,
        pal: BOSSPAL[bspr]
      },
      D.lv + 1,
      0,
      hell ? rollMods(r, 2) : [],
      sp.dm
    );
    e.maxhp = Math.round(e.maxhp * (hell ? 2.8 : 2));
    e.hp = e.maxhp;
    e.atk = Math.round(e.atk * (hell ? 1.4 : 1.15));
    e.xp *= hell ? 4 : 2;
    e.rar = hell ? 4 : 3;
    e.minion = 0;
    bg = 'cave';
    n = hell ? 2 : 1 + (sp.dt === 'party' ? 1 : 0);
  } else {
    e = mob(0);
    bg = D.lm ? 'forest' : 'cave';
    n = (sp.dt === 'hell' ? 2 : 1) + (r % 2) + (sp.elite ? 1 : 0);
  }
  if (S.lv < 3) n = Math.min(n, 1);
  const es = group(e, n);
  return { e: es[0], es, bg, boss: boss && D.kind !== 'rift' };
}
function dropLoot(e, boss, sp, remote, minion) {
  const buf = buffOn() ? 1.2 : 1,
    rem = remote ? 0.8 : 1,
    out = [],
    r = e.rar || 0,
    zm = zoneAt(S.lat, S.lng).m,
    os = onsiteNow() ? ONSITE_BONUS : 0,
    Q = 1 + ((sp ? sp.q : 0) + (zm.q || 0) + os) / 100,
    R = 1 + ((sp ? sp.r : 0) + (zm.r || 0) + os) / 100;
  const mm = minion ? 0.5 : 1,
    itemCh = ([0.22, 0.5, 1, 1, 1][r] || 0.22) * buf * rem * Q * mm,
    curN =
      (boss
        ? 3 + fl(Math.random() * 2)
        : r === 4
          ? 4 + fl(Math.random() * 3)
          : r === 2
            ? 2 + fl(Math.random() * 2)
            : r === 1
              ? (Math.random() < 0.6 ? 1 : 0) + (Math.random() < 0.3 ? 1 : 0)
              : Math.random() < 0.25 * buf
                ? 1
                : 0) *
      Q *
      mm;
  const mk = minR => {
    const p = 1 - (1 - Math.random()) / R;
    let rar = p < 0.55 ? 0 : p < 0.9 ? 1 : 2;
    rar = Math.max(rar, minR);
    const it = makeItem(DROPS[fl(Math.random() * DROPS.length)], e.lv, rar);
    giveItem(it);
    out.push(itemName(it));
  };
  if (boss) mk(2);
  else if (Math.random() < itemCh) mk(r >= 2 ? 1 : 0);
  if (r === 2 && Math.random() < 0.5 * Q) mk(0);
  if (r === 4) {
    mk(2);
    mk(2);
    if (Math.random() < 0.5) mk(1);
  }
  if (itemCh > 1 && Math.random() < itemCh - 1) mk(0);
  for (let i = 0; i < Math.round(curN * rem); i++) {
    const c = rollCur(boss || r >= 2 ? 3 : 1);
    giveCur(c);
    out.push(curDot(c) + CURI[c].n);
  }
  if (stats().legGreed) {
    const c = rollCur(2);
    giveCur(c);
    out.push(curDot(c) + CURI[c].n);
  }
  gemLoot(e, boss, sp && sp.dt !== 'normal' && sp.dt !== 'party' && sp.dt !== 'stele', rem, out);
  if (boss && sp && sp.dt === 'circle') {
    giveCur('engX', 1 + (Math.random() < 0.5 ? 1 : 0));
    out.push(curDot('engX') + '崇高刻印石');
  }
  if (boss && sp && sp.dt === 'portal') {
    giveCur('vaal');
    out.push(curDot('vaal') + '冥府之血');
    for (const id of ['prism', 'engD'])
      if (Math.random() < 0.5) {
        giveCur(id);
        out.push(curDot(id) + GCURI[id].n);
      }
  }
  if (r >= 1 || boss) {
    const ins = rollInsc(r, boss);
    if (ins) out.push(ins);
  }
  if (Math.random() < 0.12) {
    S.potions++;
    out.push('生命藥水');
  }
  return out;
}
/* 技能石材料：靈魂碎片與刻印石系列（昇華稜鏡、神聖刻印石在冥府內容出來前先由紅名怪掉落） */
/* 靈魂碎片隨怪物強度增加：稀有度底數 + 每條詞綴 2（冥府詞綴 3）+ 每 4 級 1，首領再加 */
function gemLoot(e, boss, hell, rem, out) {
  const r = e.rar || 0,
    mods = e.mods || [],
    soul =
      [2, 4, 7, 8, 15][r] +
      mods.reduce((a, m) => a + (EMODI[m] && EMODI[m].uw ? 3 : 2), 0) +
      fl((e.lv || 1) / 4) +
      (boss ? 6 + (hell ? 6 : 0) : 0),
    z = zoneAt(S.lat, S.lng).m,
    ch = p => Math.random() < p * rem * (z.eng || 1),
    add = (id, n = 1) => {
      if (n <= 0) return;
      giveCur(id, n);
      out.push(curDot(id) + GCURI[id].n + (n > 1 ? ' ×' + n : ''));
    };
  add('soul', Math.round(soul * rem * (z.soul || 1)));
  if (boss || ch([0, 0.25, 0.6, 0.6, 1][r])) add('eng');
  if (ch(boss ? (hell ? 0.6 : 0.3) : [0, 0, 0.2, 0.2, 0.5][r])) add('engC');
  if (ch(boss && hell ? 0.25 : r === 4 ? 0.05 : 0)) add('engX');
  if (r === 4 && ch(0.08)) add('prism');
  if (r === 4 && ch(0.08)) add('engD');
}
/* 現場加成：人實際走到 80 公尺內打（不是靠據點、營旗、絲綢之路遠端），掉寶數量與稀有度 +20% */
const ONSITE_BONUS = 20;
const onsiteNow = () => (D ? !!D.onsite : B ? !!B.onsite : MB ? !!(MB.d && MB.d.onsite && amLeader()) : false);
/* 地城通關獎勵 */
function dunReward(D) {
  const sp = D.spec,
    mult = D.remote ? 0.8 : 1,
    Q = 1 + (sp.q + (D.onsite ? ONSITE_BONUS : 0)) / 100,
    bonus = (D.lm ? 1.6 : 1) * Q,
    gold = Math.round((40 + D.lv * 25) * mult * bonus),
    cry = D.kind === 'rift' ? 0 : Math.max(1, Math.round((2 + fl(D.lv / 2)) * mult * bonus));
  const items = [
    makeItem(DROPS[fl(Math.random() * DROPS.length)], D.lv + 1, D.lm || D.kind === 'rift' || sp.dt !== 'normal' ? 2 : 1)
  ];
  if (sp.dt === 'hell') items.push(makeItem(DROPS[fl(Math.random() * DROPS.length)], D.lv + 2, 2));
  S.gold += gold;
  S.crystal += cry;
  items.forEach(giveItem);
  const curs = [];
  for (let i = 0; i < Math.round((D.kind === 'rift' ? 4 : 2) * Q); i++) {
    const c = rollCur(sp.dt === 'hell' ? 5 : 3);
    giveCur(c);
    curs.push(curDot(c) + CURI[c].n);
  }
  if (sp.dt === 'stele') curs.push(makeTablet(D.lv, sp.mods));
  if (sp.dt === 'sin' || sp.dt === 'sinking') curs.push(...sinReward(sp));
  return { gold, cry, items, curs };
}
function dunModsHTML(sp) {
  return sp.mods.length
    ? `<div class="dmods">${sp.mods.map(id => `<div><b>${DMODI[id].n}</b><small>${DMODI[id].d}</small></div>`).join('')}</div>`
    : '<p class="sub">沒有地城詞綴。</p>';
}
/* 戰利品清單：同樣的東西合併成「×n」 */
function lootList(a) {
  const m = new Map();
  for (const s of a) {
    const mt = /^(.*) ×(\d+)$/.exec(s),
      k = mt ? mt[1] : s;
    m.set(k, (m.get(k) || 0) + (mt ? +mt[2] : 1));
  }
  return [...m].map(([s, n]) => (n > 1 ? `${s} ×${n}` : s));
}
function winBattle() {
  const es = B.es,
    e = es[0],
    zm = zoneAt(S.lat, S.lng).m,
    st = stats(),
    mult = (D && D.remote ? 0.8 : 1) * (buffOn() ? 1.2 : 1);
  let xp = 0,
    gold = 0;
  const drops = [];
  es.forEach((o, i) => {
    xp += Math.round(o.xp * mult * (zm.xp || 1));
    gold += Math.round(o.gold * rnd(0.8, 1.2) * mult * st.goldMul * (zm.gold || 1));
    drops.push(...dropLoot(o, B.boss && i === 0, D && D.spec, D && D.remote, o.minion));
  });
  S.gold += gold;
  const up = gainXP(xp);
  if (B.entId) {
    S.defeated[B.entId] = 1;
    ENT.delete(B.entId);
  }
  S.stacks = st.keepStacks ? B.me.stacks || 0 : 0;
  let bonus = autoPot();
  if (B.bounty) {
    const g = 100 + S.lv * 30;
    S.gold += g;
    giveCur('chaos');
    bonus += `<p style="color:var(--gold)">懸賞完成！額外 ${g} 金幣與 1 個混沌石</p>`;
    S.cleared[B.bounty] = evEp();
  }
  if (onsiteNow()) bonus += `<p class="sub" style="color:var(--gold)">✦ 現場加成：掉寶 +${ONSITE_BONUS}%</p>`;
  /* 每隻敵人各自算：侵蝕柱充能、亡靈區與魔霧進度（同一種只顯示最後一行） */
  let ob = '',
    ud = '',
    mi = '';
  for (const o of es) {
    if (o.uw) ob = obeliskCharge(o.uw);
    if (o.ud) ud = undeadWin({ e: o, ud: o.ud, udBase: o.bn, mist: o.mist }) || ud;
    if (o.mist) mi = mistWin({ e: o, ud: o.ud, mist: o.mist, mistBase: o.bn }) || mi;
    if (o.sin) bonus += sinBattleWin(o);
    quest('kill');
    if (o.rar >= 2) quest('rare');
    if (o.ud) quest('ud');
  }
  bonus += ob + ud + mi;
  if (B.commander) bonus += commanderWin(B.commander);
  if (B.king) bonus += kingWin();
  if (B.watcher) bonus += watcherWin(B.watcher);
  if (B.hunt) bonus += huntWin(B);
  if (B.hunt === 'beast') quest('beast');
  addLog(`擊敗 ${e.name}${es.length > 1 ? ` 等 ${es.length} 隻` : ''} Lv${e.lv}，獲得 ${xp} 經驗、${gold} 金幣`);
  if (up) setTimeout(() => sfx('level'), 500);
  renderBHud();
  save();
  const inD = !!D;
  const next = () => {
    if (inD) {
      D.room++;
      const F = D.spec.floors;
      if (D.room >= F) return dungeonClear();
      const st = stats();
      showModal(
        D.kind === 'rift' ? `裂隙第 ${D.room + 1}/${F} 波` : `第 ${D.room + 1}/${F} 層`,
        `<p>${D.room === F - 1 ? (D.kind === 'rift' ? '裂隙深處湧出一隻稀有怪物。' : '更深處傳來強大的氣息，首領就在前方。') : '下一波敵人正在逼近。'}</p><p class="sub">生命 ${S.hp}/${st.maxhp}・魔力 ${S.mp}/${st.maxmp}</p>`,
        [
          {
            label: '撤退',
            fn: () => {
              hideModal();
              addLog('撤退了');
              D = null;
              endBattle();
            }
          },
          {
            label: '繼續',
            pri: 1,
            fn: () => {
              hideModal();
              nextRoom();
            }
          }
        ]
      );
    } else {
      hideModal();
      endBattle();
    }
  };
  showModal(
    '勝利！',
    `<p>獲得 <span style="color:var(--good)">${xp} 經驗</span>、<span style="color:var(--gold)">${gold} 金幣</span></p>${
      drops.length
        ? `<div class="loot">${lootList(drops)
            .map(d => `<span>${d}</span>`)
            .join('')}</div>`
        : ''
    }${bonus}${up ? `<p style="color:var(--gold)">升級到 Lv${S.lv}！獲得 1 天賦點</p>` : ''}`,
    [{ label: '繼續', pri: 1, fn: next }]
  );
}
function loseBattle() {
  sfx('lose');
  buzz(300);
  const lost = fl(S.gold * 0.1);
  S.gold -= lost;
  fullHeal();
  D = null;
  const main = S.bases.find(b => b.type === 'main');
  addLog(`戰敗，損失 ${lost} 金幣`);
  showModal(
    '你倒下了……',
    `<p>損失 ${lost} 金幣，狀態已恢復。${main ? '你被送回主據點。' : ''}</p><p class="sub">提示：看看角色頁的抗性，元素怪物對低抗性很痛。</p>`,
    [
      {
        label: '重新出發',
        pri: 1,
        fn: () => {
          hideModal();
          if (main) {
            S.lat = main.lat;
            S.lng = main.lng;
            refreshEntities(true);
          }
          endBattle();
        }
      }
    ]
  );
}
function endBattle() {
  $('battle').hidden = true;
  $('eail').innerHTML = $('hail').innerHTML = $('epills').innerHTML = '';
  bossBar(null);
  B = null;
  playSong('field');
  renderHud();
  save();
}
function enterDungeon(t, remote) {
  D = {
    id: t.id,
    kind: t.kind,
    lat: t.lat,
    lng: t.lng,
    lv: t.lv,
    room: 0,
    remote,
    onsite: !!t.onsite,
    lm: t.kind === 'landmark' ? t : null,
    seed: h(fl(t.lat * 1e4), fl(t.lng * 1e4), hepoch()),
    spec: dunSpec(t)
  };
  sfx('door');
  addLog(`${remote ? '從據點遠征' : '進入'}${dunName(t)}（Lv${t.lv}）`);
  nextRoom();
}
function nextRoom() {
  const { es, bg, boss } = dunEnemy(D, D.room);
  if (B) {
    es.forEach(eInit);
    Object.assign(B, { e: es[0], es, ti: 0, boss, busy: true, act: -1 });
    Object.assign(B.me, { guard: 0, frozen: 0 });
    BFX.en = es.map(() => ({ a: null, flash: 0 }));
    BFX.pops = [];
    paintBG(bg);
    BFX.t0 = performance.now();
    playSong(boss ? 'boss' : 'battle');
    renderBHud();
    bmsg(es.length > 1 ? `${es[0].name} 等 ${es.length} 隻出現了！` : `${es[0].name} 出現了！`);
    sfx('encounter');
    setTimeout(() => {
      if (B) {
        B.busy = false;
        renderBHud();
      }
    }, 800);
  } else startBattle(es, { boss, bg });
}
function dungeonClear() {
  const kind = D.kind,
    rw = dunReward(D);
  S.cleared[D.id] = kind === 'rift' ? evEp() : hepoch();
  const ascMsg = kind === 'asc' ? ascTrialDone() : '';
  quest('dun');
  const nm = kind === 'rift' ? '魔物裂隙' : D.lm ? D.lm.dn : kind === 'asc' ? '昇華試煉' : DTYPES[D.spec.dt].n,
    rem = D.remote;
  addLog(`攻略${nm}（Lv${D.lv}）`);
  sfx('level');
  D = null;
  showModal(
    '攻略完成！',
    `<p><span style="color:var(--gold)">${rw.gold} 金幣</span>${rw.cry ? `・<span style="color:#9fe7ff">${rw.cry} 魔晶</span>` : ''}</p>${rw.items.map(it => itemCard(it, '首領寶箱')).join('')}<div class="loot">${rw.curs.map(c => `<span>${c}</span>`).join('')}</div>${ascMsg}${rem ? '<p class="sub">遠征獎勵為實地攻略的 80%。</p>' : ''}`,
    [
      {
        label: '返回地圖',
        pri: 1,
        fn: () => {
          hideModal();
          endBattle();
        }
      }
    ]
  );
}
/* ================= battle: drawing ================= */
/* 畫一群敵人（單人與組隊共用）：fx 是 BFX.en／MBFX.en，ti 是目前目標（-1 不畫箭頭） */
function drawEnemies(c, t, es, boss, fx, ti) {
  selTrack(fx, ti, es.length + ':' + (es[0] ? es[0].name : ''));
  const now_ = performance.now(),
    order = es.map((e, i) => i).sort((a, b) => epos(a, es, boss).y - epos(b, es, boss).y);
  for (const i of order) {
    const e = es[i],
      f = fx[i] || (fx[i] = {}),
      q = epos(i, es, boss),
      es_ = q.s;
    /* 血量已歸零但擊倒動畫還沒播（結算比動畫早）：照常畫，等 kill 事件；太久沒等到就自己開始倒下 */
    if (e.hp <= 0 && !f.dying) {
      f.pend = f.pend || now_;
      if (now_ - f.pend > 1500) f.dying = now_;
    }
    if (e.hp <= 0 && f.dying && now_ - f.dying > 850) continue;
    const [ox, oy] = animOff(f, -1),
      alpha = f.dying ? 1 - (now_ - f.dying) / 850 : 1;
    if (e.rar)
      glow(c, q.x + ox, q.y - 8 * es_, (e.rar >= 2 ? 16 : 12) * es_, RGLOW[e.rar], 0.35 + 0.12 * Math.sin(t / 300));
    c.fillStyle = 'rgba(0,0,0,.3)';
    c.beginPath();
    c.ellipse(q.x + ox, q.y + 2, es_ * 6.5, es_ * 1.5, 0, 0, 6.28);
    c.fill();
    c.globalAlpha = Math.max(0, alpha);
    const flash = now_ - (f.flash || 0) < 120 || (f.dying && fl((now_ - f.dying) / 80) % 2 === 0);
    drawSpr(
      c,
      e.spr,
      e.pal,
      q.x + ox,
      q.y + oy + Math.sin(t / 260 + i) * 2,
      es_,
      e.spr === 'boar' || e.spr === 'wolf',
      flash
    );
    c.globalAlpha = 1;
    /* 選取特效：腳下光圈＋四角框，剛選到時框從外面收進來 */
    if (i === ti && e.hp > 0) drawSel(c, t, q, es_, now_ - (fx._ts || 0), es.length > 1);
  }
}
/* 目標選取：ti 換了就記下時間，名字顯示一下再淡出（ti 是 -1 表示動畫中，不算換目標） */
function selTrack(fx, ti, key) {
  if (ti < 0) return;
  if (fx._ti === ti && fx._key === key) return;
  fx._ti = ti;
  fx._key = key;
  fx._ts = performance.now();
  const el = $('bname');
  el.classList.add('on');
  clearTimeout(selTrack.t);
  selTrack.t = setTimeout(() => el.classList.remove('on'), 1800);
}
function drawSel(c, t, q, s, age, multi) {
  const k = Math.max(0, 1 - age / 260),
    pulse = 0.55 + 0.25 * Math.sin(t / 160);
  c.save();
  c.strokeStyle = `rgba(255,209,102,${pulse})`;
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(q.x, q.y + 2, s * 8 + k * 14, s * 2.2 + k * 4, 0, 0, 6.28);
  c.stroke();
  if (multi || k > 0) {
    const w = s * 9 + 6 + k * 18,
      top = q.y - 16 * s - 4 - k * 14,
      bot = q.y + 6 + k * 6,
      L = Math.max(5, s * 3);
    c.strokeStyle = `rgba(255,209,102,${multi ? 0.95 : k})`;
    c.lineWidth = 2.5;
    c.shadowColor = '#ffd166';
    c.shadowBlur = 6;
    [
      [-1, top, 1],
      [1, top, 1],
      [-1, bot, -1],
      [1, bot, -1]
    ].forEach(([sx, y, sy]) => {
      const x = q.x + sx * w;
      c.beginPath();
      c.moveTo(x - sx * L, y);
      c.lineTo(x, y);
      c.lineTo(x, y + sy * L);
      c.stroke();
    });
  }
  c.restore();
}
/* 召喚物：站在施放者後面的小隻像素圖 */
function drawPets(c, t, pets, x, y, s) {
  (pets || []).forEach((p, k) => {
    if (p.turns <= 0) return;
    const px = x - 26 - k * 20,
      py = y + 10 - (k % 2) * 16;
    glow(c, px, py - 6 * s * 0.6, 10 * s * 0.6, '200,170,255', 0.25);
    drawSpr(c, p.spr || 'skeleton', p.pal || {}, px, py + Math.sin(t / 240 + k) * 2, Math.max(2, s - 1), true);
  });
}
function renderBattle(t) {
  const c = bctx,
    now_ = performance.now(),
    p = POS();
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  c.clearRect(0, 0, BW, BH);
  c.imageSmoothingEnabled = false;
  let sx = 0,
    sy = 0;
  if (now_ - BFX.shake < 260) {
    const k = 1 - (now_ - BFX.shake) / 260;
    sx = rnd(-5, 5) * k;
    sy = rnd(-4, 4) * k;
  }
  c.save();
  c.translate(sx, sy);
  const sc = battleSc();
  drawEnemies(c, t, B.es, B.boss, BFX.en, B.busy ? -1 : B.ti);
  const [hox, hoy] = animOff(BFX.hero, 1),
    hx = p.hx + hox,
    hy = p.hy + hoy + Math.sin(t / 320) * 1.5,
    hs = sc;
  c.fillStyle = 'rgba(0,0,0,.3)';
  c.beginPath();
  c.ellipse(p.hx + hox, p.hy + 2, hs * 6.5, hs * 1.5, 0, 0, 6.28);
  c.fill();
  drawPets(c, t, B.me.pets, p.hx, p.hy, hs);
  const hpal = heroPal();
  drawWeapon(c, wepKind(), hx, hy, hs, hpal.W);
  drawSpr(c, heroSpr('S'), hpal, hx, hy, hs, true);
  for (let i = BFX.fx.length - 1; i >= 0; i--) {
    const f = BFX.fx[i],
      q = (now_ - f.t) / f.dur;
    if (q >= 1) {
      BFX.fx.splice(i, 1);
      continue;
    }
    if (q < 0) continue;
    const tq = f.i != null ? epos(f.i, B.es, B.boss) : null;
    drawFx(c, f, q, tq ? { ...p, ex: tq.x, y: tq.y } : p, hs);
  }
  c.globalCompositeOperation = 'lighter';
  for (const q of BFX.motes) {
    q.y -= q.v;
    q.x += Math.sin(t / 900 + q.p) * 0.0006;
    if (q.y < 0) q.y = 1;
    c.fillStyle = `rgba(255,240,180,${0.35 + 0.3 * Math.sin(t / 400 + q.p)})`;
    c.fillRect(q.x * BW, q.y * BH * 0.9, 2, 2);
  }
  c.globalCompositeOperation = 'source-over';
  c.font = 'bold 22px DotGothic16, sans-serif';
  c.textAlign = 'center';
  for (let i = BFX.pops.length - 1; i >= 0; i--) {
    const q = BFX.pops[i],
      k = (now_ - q.t) / 1000;
    if (k >= 1) {
      BFX.pops.splice(i, 1);
      continue;
    }
    const y = q.y - k * 30 - (k < 0.15 ? Math.sin((k / 0.15) * Math.PI) * 10 : 0);
    c.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
    c.lineWidth = 4;
    c.strokeStyle = '#000';
    c.strokeText(q.text, q.x, y);
    c.fillStyle = q.col;
    c.fillText(q.text, q.x, y);
    c.globalAlpha = 1;
  }
  c.restore();
  const intro = (now_ - BFX.t0) / 450;
  if (intro < 1) {
    c.fillStyle = `rgba(255,255,255,${1 - intro})`;
    c.fillRect(0, 0, BW, BH);
  }
}
/* 手上的武器（kind 是 wepKind；玩家面向右邊，hx/hy 是腳下，u 是像素大小） */
function drawWeapon(c, wep, hx, hy, u, mc) {
  /* mc 是刃的顏色（材質階級），沒給就用原本的鐵色 */
  const M1 = mc || '#d8dde6',
    M2 = mc ? shade(mc, -0.18) : '#aab2bc',
    M3 = mc ? shade(mc, -0.32) : '#8a929c';
  const R = (col, x, y, w, h) => {
    c.fillStyle = col;
    c.fillRect(hx + x * u, hy + y * u, w * u, h * u);
  };
  const bowArc = (r, x) => {
    c.strokeStyle = '#8a5a2f';
    c.lineWidth = u;
    c.beginPath();
    c.arc(hx + x * u, hy - 9 * u, r * u, -Math.PI * 0.42, Math.PI * 0.42);
    c.stroke();
    c.strokeStyle = '#eee';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(hx + (x + r * 0.3) * u, hy - (9 + r * 0.92) * u);
    c.lineTo(hx + (x + r * 0.3) * u, hy - (9 - r * 0.92) * u);
    c.stroke();
  };
  if (wep === 'sword' || wep === 'gsword' || wep === 'peach') {
    const g = wep === 'gsword',
      wood = wep === 'peach';
    R(wood ? '#b8743a' : M1, 5, g ? -20 : -15, g ? 1.6 : 1, g ? 14 : 9);
    if (!wood) R('#f6f8fb', 5, g ? -20 : -15, 0.4, g ? 14 : 9);
    R(wood ? '#c0392b' : '#b8862e', g ? 3 : 3.5, -6, g ? 5.6 : 4, 1);
    if (wood) R('#e5484d', 4.5, -5, 1, 3);
  } else if (wep === 'axe' || wep === 'gaxe') {
    const g = wep === 'gaxe';
    R('#7a5230', 5, g ? -19 : -15, 1, g ? 17 : 11);
    R(M2, 6, g ? -19 : -15, g ? 4 : 3, g ? 5 : 3.5);
    if (g) R(M2, 2, -19, 3, 5);
    R('#e8edf2', g ? 9.4 : 8.4, g ? -19 : -15, 0.6, g ? 5 : 3.5);
  } else if (wep === 'mace' || wep === 'gmace') {
    const g = wep === 'gmace';
    R('#7a5230', 5, g ? -17 : -13, 1, g ? 15 : 9);
    R(M3, g ? 3.5 : 4, g ? -21 : -16, g ? 4 : 3, g ? 4 : 3);
    if (g) {
      R('#c8ced6', 5, -22, 1, 1);
      R('#c8ced6', 2.5, -20, 1, 1);
      R('#c8ced6', 7.5, -20, 1, 1);
    }
  } else if (wep === 'spear' || wep === 'halberd') {
    R('#7a5230', 5, -21, 0.8, 21);
    R(M1, 4.5, -25, 1.8, 4);
    R('#f6f8fb', 5.1, -26, 0.6, 1);
    if (wep === 'halberd') {
      R(M2, 5.8, -21, 3, 3);
      R(M2, 2.5, -20.5, 2.5, 1.2);
    }
  } else if (wep === 'bow' || wep === 'lbow') bowArc(wep === 'lbow' ? 8 : 6, 3);
  else if (wep === 'xbow') {
    R('#7a5230', 2, -9, 8, 1.2);
    R('#5a3a26', 9, -12, 1, 7);
    c.strokeStyle = '#eee';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(hx + 9.5 * u, hy - 12 * u);
    c.lineTo(hx + 4 * u, hy - 8.6 * u);
    c.lineTo(hx + 9.5 * u, hy - 5 * u);
    c.stroke();
  } else if (wep === 'dagger') {
    R(M1, 6, -11, 0.8, 4.5);
    R('#b8862e', 5.2, -6.5, 2.4, 0.8);
  } else if (wep === 'claw') {
    for (let k = 0; k < 3; k++) R('#e8edf2', 6 + k * 0.2, -10 + k * 1.6, 3, 0.6);
    R('#5a3a26', 5, -9, 1.2, 4);
  } else if (wep === 'scepter') {
    R('#d8a838', 5, -14, 0.9, 10);
    R('#c86aff', 4.2, -16.5, 2.5, 2.5);
    R('#ffd166', 4.6, -17.5, 1.7, 0.8);
  } else {
    R('#7a5230', 5, -17, 1, 16);
    R('#7fe0ff', 4, -19, 3, 3);
  }
}
function drawFx(c, f, q, p, u) {
  const ex = p.ex,
    ey = p.y - 8 * u;
  c.save();
  c.globalCompositeOperation = 'lighter';
  if (f.type === 'slash' || f.type === 'whirl') {
    const n = f.type === 'whirl' ? 3 : 1;
    for (let k = 0; k < n; k++) {
      c.strokeStyle = `rgba(255,255,255,${1 - q})`;
      c.lineWidth = 5 * (1 - q) + 1;
      c.beginPath();
      c.arc(ex, ey, 7 * u + k * 10, -2.2 + q * 2 + k, -0.6 + q * 2 + k);
      c.stroke();
    }
  } else if (f.type === 'arrow') {
    const x = p.hx + 6 * u + (ex - p.hx - 6 * u) * q;
    c.fillStyle = '#fff';
    c.fillRect(x - 8, ey, 16, 2);
  } else if (f.type === 'pierce') {
    c.fillStyle = `rgba(255,255,220,${1 - q})`;
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * 6.28;
      c.fillRect(ex + Math.cos(a) * q * 34, ey + Math.sin(a) * q * 34, 3, 3);
    }
  } else if (f.type === 'charge') blob(c, p.hx + 5 * u, p.hy - 18 * u, 10 + 40 * q, 'rgba(170,200,255,.6)');
  else if (f.type === 'fire') {
    for (let k = 0; k < 26; k++) {
      const a = k * 2.39,
        r = q * 56 * (0.4 + (k % 5) / 5),
        y = ey - q * 22 * (k % 3);
      c.fillStyle = k % 2 ? `rgba(255,140,40,${1 - q})` : `rgba(255,220,90,${1 - q})`;
      const s = 7 * (1 - q) + 2;
      c.fillRect(ex + Math.cos(a) * r - s / 2, y + Math.sin(a) * r * 0.6 - s / 2, s, s);
    }
    blob(c, ex, ey, 80, `rgba(255,120,40,${0.55 * (1 - q)})`);
  } else if (f.type === 'ice') {
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * 6.28,
        r = 44 * (1 - q) + 8;
      c.fillStyle = `rgba(170,235,255,${1 - q * 0.7})`;
      c.save();
      c.translate(ex + Math.cos(a) * r, ey + Math.sin(a) * r * 0.7);
      c.rotate(a);
      c.fillRect(-11, -2, 22, 4);
      c.restore();
    }
    blob(c, ex, ey, 70, `rgba(140,220,255,${0.5 * (1 - q)})`);
  } else if (f.type === 'bolt') {
    c.strokeStyle = `rgba(255,240,120,${1 - q})`;
    c.lineWidth = 4 * (1 - q) + 1;
    for (let k = 0; k < 2; k++) {
      c.beginPath();
      let x = ex + (k ? 10 : -6),
        y = ey - 120;
      c.moveTo(x, y);
      for (let s = 0; s < 6; s++) {
        x += (s % 2 ? 1 : -1) * (8 + ((s * 7 + k * 5) % 9));
        y += 20;
        c.lineTo(x, y);
      }
      c.stroke();
    }
    blob(c, ex, ey, 70, `rgba(255,240,120,${0.55 * (1 - q)})`);
  } else if (f.type === 'chain') {
    c.strokeStyle = `rgba(200,220,255,${1 - q})`;
    c.lineWidth = 3 * (1 - q) + 1;
    c.beginPath();
    let x = ex - 30,
      y = ey - 30;
    c.moveTo(x, y);
    for (let s = 0; s < 4; s++) c.lineTo((x += 15), (y += s % 2 ? -12 : 20));
    c.stroke();
    blob(c, ex, ey, 40, `rgba(200,220,255,${0.5 * (1 - q)})`);
  } else if (f.type === 'summon') {
    for (let k = 0; k < 16; k++) {
      const a = k * 0.39 + q * 4,
        r = 30 * (1 - q) + 8;
      c.fillStyle = `rgba(200,160,255,${1 - q})`;
      c.fillRect(p.hx - 30 + Math.cos(a) * r, (p.hy ?? p.y) - 20 + Math.sin(a) * r * 0.5, 3, 3);
    }
  } else if (f.type === 'heal') {
    for (let k = 0; k < 14; k++) {
      const x = p.hx - 26 + ((k * 37) % 52),
        y = (p.hy ?? p.y) - 10 - q * 80 - (k % 4) * 8;
      c.fillStyle = `rgba(140,255,150,${1 - q})`;
      c.fillRect(x, y, 3, 3);
    }
  }
  c.restore();
}
window.addEventListener('resize', () => {
  if (B && !$('battle').hidden) {
    sizeBattle();
    paintBG(B.boss || D ? 'cave' : B.e.bg || 'meadow');
    renderBHud();
  }
});
