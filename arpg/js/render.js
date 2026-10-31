/* ARPG 原型 · 畫面：地板、石頭、預警、怪物、玩家、特效、跳數字、掉落標籤、光照、小地圖 */
'use strict';
const ATLAS = new Image();
ATLAS.src = 'img/atlas.png';
const WHITE = {};
/* 閃白用：把圖塗成純白 */
function whiteOf(n) {
  if (WHITE[n]) return WHITE[n];
  const [x, y, w, h] = ART[n],
    c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.drawImage(ATLAS, x, y, w, h, 0, 0, w, h);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = '#fff';
  g.fillRect(0, 0, w, h);
  return (WHITE[n] = c);
}
/* 畫圖：腳底在 (x, y)，高度 hgt，flip 左右翻 */
function spr(n, x, y, hgt, o = {}) {
  const r = ART[n];
  if (!r || !ATLAS.complete) return;
  const sc = hgt / r[3],
    w = r[2] * sc * (o.sx || 1),
    h = hgt * (o.sy || 1);
  CX.save();
  CX.translate(Math.round(x), Math.round(y));
  if (o.flip) CX.scale(-1, 1);
  if (o.a != null) CX.globalAlpha = o.a;
  if (o.white) CX.drawImage(whiteOf(n), -w / 2, -h, w, h);
  else CX.drawImage(ATLAS, r[0], r[1], r[2], r[3], -w / 2, -h, w, h);
  CX.restore();
}
/* 武士的攻擊動畫（4×4 格，每格 64） */
const ATKF = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13];
function heroFrame(k, x, y, hgt, flip, a) {
  const r = ART.av_musashi_atk,
    sc = hgt / 60;
  CX.save();
  CX.translate(Math.round(x), Math.round(y));
  if (flip) CX.scale(-1, 1);
  if (a != null) CX.globalAlpha = a;
  CX.drawImage(ATLAS, r[0] + ((k - 1) % 4) * 64, r[1] + Math.floor((k - 1) / 4) * 64, 64, 64, -32 * sc, -64 * sc, 64 * sc, 64 * sc);
  CX.restore();
}

/* 地板：一次畫好的石磚花紋 */
let FLOOR;
function floorPat() {
  const c = document.createElement('canvas'),
    N = 256;
  c.width = c.height = N;
  const g = c.getContext('2d');
  g.fillStyle = '#1b1715';
  g.fillRect(0, 0, N, N);
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++) {
      const v = 22 + Math.floor(Math.random() * 10);
      g.fillStyle = `rgb(${v + 6},${v + 2},${v})`;
      g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60);
    }
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,240,220'},${Math.random() * 0.06})`;
    g.fillRect(Math.random() * N, Math.random() * N, 2, 2);
  }
  return CX.createPattern(c, 'repeat');
}
let DARK;
const ZOOM = 1.35;
function draw() {
  const SW = CV.clientWidth,
    SH = CV.clientHeight,
    W = SW / ZOOM,
    H = SH / ZOOM;
  CX.setTransform(DPR * ZOOM, 0, 0, DPR * ZOOM, 0, 0);
  CX.imageSmoothingEnabled = false;
  CX.fillStyle = '#070606';
  CX.fillRect(0, 0, W + 1, H + 1);
  const tr = G.trauma * G.trauma,
    sx = (Math.random() * 2 - 1) * 14 * tr,
    sy = (Math.random() * 2 - 1) * 14 * tr,
    ox = Math.round(W / 2 - G.cam.x + sx),
    oy = Math.round(H / 2 - G.cam.y + sy);
  CX.save();
  CX.translate(ox, oy);
  /* 地板 */
  FLOOR = FLOOR || floorPat();
  CX.fillStyle = FLOOR;
  CX.fillRect(0, 0, G.W, G.H);
  CX.strokeStyle = '#3a2f28';
  CX.lineWidth = 6;
  CX.strokeRect(-3, -3, G.W + 6, G.H + 6);
  /* 王房的地 */
  CX.fillStyle = 'rgba(120,30,20,0.12)';
  CX.beginPath();
  CX.arc(G.W - 340, G.H / 2, 360, 0, TAU);
  CX.fill();
  /* 石頭 */
  for (const k of G.rocks) {
    if (Math.abs(k.x - G.cam.x) > W / 2 + 100 || Math.abs(k.y - G.cam.y) > H / 2 + 100) continue;
    CX.fillStyle = 'rgba(0,0,0,0.35)';
    CX.beginPath();
    CX.ellipse(k.x + 6, k.y + 10, k.r, k.r * 0.75, 0, 0, TAU);
    CX.fill();
    CX.fillStyle = '#2d2622';
    CX.beginPath();
    CX.ellipse(k.x, k.y, k.r, k.r * 0.8, 0, 0, TAU);
    CX.fill();
    CX.fillStyle = '#3d342e';
    CX.beginPath();
    CX.ellipse(k.x - k.r * 0.2, k.y - k.r * 0.25, k.r * 0.65, k.r * 0.45, 0, 0, TAU);
    CX.fill();
  }
  /* 預警：怪物出手前地上的紅色範圍 */
  CX.lineWidth = 2;
  for (const m of G.mobs) {
    if (m.st !== 'wind') continue;
    const D = m.D,
      wind = m.boss ? 0.75 : D.wind,
      f = clamp(1 - m.t / wind, 0, 1);
    if (m.boss && m.pat === 'slam') continue;
    if (D.ai === 'lunge' || (m.boss && m.pat === 'charge')) {
      const len = m.boss ? 520 : D.reach + 20,
        wd = m.r * 1.6;
      CX.save();
      CX.translate(m.x, m.y);
      CX.rotate(m.ang);
      CX.fillStyle = `rgba(229,72,77,${0.12 + 0.18 * f})`;
      CX.fillRect(0, -wd / 2, len, wd);
      CX.fillStyle = 'rgba(229,72,77,0.35)';
      CX.fillRect(0, -wd / 2, len * f, wd);
      CX.restore();
    } else if (D.ai === 'slam') {
      const x = m.x + Math.cos(m.ang) * 55,
        y = m.y + Math.sin(m.ang) * 55;
      teleCircle(x, y, 95, f);
    } else if (D.ai === 'melee' || (m.boss && m.pat === 'swipe')) {
      const R = m.boss ? 150 : D.reach + 10;
      CX.fillStyle = `rgba(229,72,77,${0.1 + 0.25 * f})`;
      CX.beginPath();
      CX.moveTo(m.x, m.y);
      CX.arc(m.x, m.y, R, m.ang - 1.2, m.ang + 1.2);
      CX.closePath();
      CX.fill();
    } else if (D.ai === 'ranged') {
      CX.strokeStyle = `rgba(122,208,255,${0.2 + 0.5 * f})`;
      CX.setLineDash([6, 6]);
      CX.beginPath();
      CX.moveTo(m.x, m.y - m.sz * 0.5);
      CX.lineTo(m.x + Math.cos(m.ang) * 260, m.y - m.sz * 0.5 + Math.sin(m.ang) * 260);
      CX.stroke();
      CX.setLineDash([]);
    }
  }
  for (const t of G.tele) teleCircle(t.x, t.y, t.r, t.t / t.dur);
  /* 通往下一層的傳送門 */
  if (G.portal) {
    const p = G.portal;
    for (let i = 0; i < 3; i++) {
      CX.strokeStyle = `rgba(178,141,255,${0.7 - i * 0.2})`;
      CX.lineWidth = 3;
      CX.beginPath();
      CX.ellipse(p.x, p.y, 34 + i * 8 + Math.sin(G.t * 3 + i) * 3, 14 + i * 3, 0, 0, TAU);
      CX.stroke();
    }
  }
  /* 掉落（地上的光點） */
  for (const d of G.drops) {
    const f = Math.min(1, d.t / 0.35),
      x = d.sx + (d.x - d.sx) * f,
      y = d.sy + (d.y - d.sy) * f - Math.sin(f * Math.PI) * 40;
    if (d.gold) spr('mat_gold', x, y + 8, 22);
    else {
      const col = RCOL[d.it.r];
      if (d.it.r === 2) {
        const g = CX.createLinearGradient(x, y - 120, x, y);
        g.addColorStop(0, 'rgba(255,209,102,0)');
        g.addColorStop(1, 'rgba(255,209,102,0.35)');
        CX.fillStyle = g;
        CX.fillRect(x - 4, y - 120, 8, 120);
      }
      spr(itemIc(d.it), x, y + 10, 26);
      CX.fillStyle = col;
      CX.globalAlpha = 0.25;
      CX.beginPath();
      CX.ellipse(x, y + 8, 16, 6, 0, 0, TAU);
      CX.fill();
      CX.globalAlpha = 1;
    }
  }
  /* 角色們（照 y 排序） */
  const ents = G.mobs.filter(m => m.hp > 0).concat([P]);
  ents.sort((a, b) => a.y - b.y);
  for (const e of ents) e === P ? drawHero() : drawMob(e);
  /* 投射物 */
  for (const s of G.shots) {
    if (s.foe) {
      CX.fillStyle = 'rgba(122,208,255,0.25)';
      CX.beginPath();
      CX.arc(s.x, s.y, s.r * 2.2, 0, TAU);
      CX.fill();
      CX.fillStyle = '#d6f3ff';
      CX.beginPath();
      CX.arc(s.x, s.y, s.r, 0, TAU);
      CX.fill();
    } else {
      CX.save();
      CX.translate(s.x, s.y);
      CX.rotate(s.ang);
      CX.fillStyle = 'rgba(200,230,255,0.25)';
      CX.fillRect(-40, -3, 40, 6);
      CX.fillStyle = '#eef6ff';
      CX.beginPath();
      CX.moveTo(14, 0);
      CX.lineTo(-6, -7);
      CX.lineTo(-2, 0);
      CX.lineTo(-6, 7);
      CX.closePath();
      CX.fill();
      CX.restore();
    }
  }
  drawFx();
  /* 跳數字 */
  CX.textAlign = 'center';
  for (const n of G.nums) {
    const f = n.t / 0.9,
      pop = n.t < 0.08 ? 1 + (0.08 - n.t) * 8 : 1,
      y = n.y - 30 * Math.sqrt(f) - (n.c === 'crit' ? 10 : 0);
    const st = { hit: ['#fff3e0', 15], crit: ['#ffd166', 24], hurt: ['#ff5a5a', 17], gold: ['#ffd166', 14], lv: ['#9df29d', 20], mikiri: ['#8fe0ff', 26] }[n.c];
    CX.globalAlpha = 1 - Math.max(0, f - 0.6) / 0.4;
    CX.font = `700 ${Math.round(st[1] * pop)}px "Noto Serif TC", serif`;
    const txt = n.c === 'gold' ? '+' + n.v + ' 金' : n.c === 'lv' ? '升級！Lv ' + n.v : n.c === 'mikiri' ? '見切' : n.v;
    CX.lineWidth = 4;
    CX.strokeStyle = 'rgba(0,0,0,0.8)';
    CX.strokeText(txt, n.x, y);
    CX.fillStyle = st[0];
    CX.fillText(txt, n.x, y);
  }
  CX.globalAlpha = 1;
  /* 掉落標籤（PoE 式：名字框，可以點） */
  LABELS.length = 0;
  CX.font = '600 13px "Noto Serif TC", serif';
  for (const d of G.drops) {
    if (!d.it || d.t < 0.3) continue;
    const txt = itemName(d.it),
      w = CX.measureText(txt).width + 14,
      x = d.x,
      y = d.y - 22;
    const near = dist(P, d) < 110;
    CX.fillStyle = near ? 'rgba(30,26,24,0.92)' : 'rgba(10,9,8,0.8)';
    CX.fillRect(x - w / 2, y - 11, w, 20);
    CX.strokeStyle = RCOL[d.it.r];
    CX.lineWidth = near ? 2 : 1;
    CX.strokeRect(x - w / 2 + 0.5, y - 10.5, w - 1, 19);
    CX.fillStyle = RCOL[d.it.r];
    CX.fillText(txt, x, y + 4);
    LABELS.push({ d, x: (x - w / 2 + ox) * ZOOM, y: (y - 11 + oy) * ZOOM, w: w * ZOOM, h: 20 * ZOOM });
  }
  CX.restore();
  /* 光照：玩家周圍亮、遠處暗 */
  if (!DARK || DARK.width !== CV.width || DARK.height !== CV.height) {
    DARK = document.createElement('canvas');
    DARK.width = CV.width;
    DARK.height = CV.height;
  }
  const dg = DARK.getContext('2d'),
    px = (P.x + ox) * DPR * ZOOM,
    py = (P.y - 20 + oy) * DPR * ZOOM;
  dg.globalCompositeOperation = 'source-over';
  dg.clearRect(0, 0, DARK.width, DARK.height);
  dg.fillStyle = 'rgba(4,3,3,0.72)';
  dg.fillRect(0, 0, DARK.width, DARK.height);
  dg.globalCompositeOperation = 'destination-out';
  const R = 560 * DPR * ZOOM,
    g = dg.createRadialGradient(px, py, 40 * DPR, px, py, R);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(0.6, 'rgba(0,0,0,0.85)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  dg.fillStyle = g;
  dg.fillRect(0, 0, DARK.width, DARK.height);
  CX.setTransform(1, 0, 0, 1, 0, 0);
  CX.drawImage(DARK, 0, 0);
  CX.setTransform(DPR, 0, 0, DPR, 0, 0);
  {
    const W = SW,
      H = SH;
    /* 受傷：畫面邊緣紅；見切：藍 */
    if (P.hurtT > 0 || P.hp < ST.hp * 0.3 || G.slow > 0) {
      const a = G.slow > 0 ? 0.35 : Math.max(P.hurtT / 0.35, P.hp < ST.hp * 0.3 ? 0.35 + 0.15 * Math.sin(G.t * 6) : 0),
        vg = CX.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.7);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, G.slow > 0 ? `rgba(80,180,255,${a})` : `rgba(200,20,20,${a})`);
      CX.fillStyle = vg;
      CX.fillRect(0, 0, W, H);
    }
    drawMinimap(W);
  }
}
const RCOL = ['#e8e2d6', '#8ab4ff', '#ffd166'];
const LABELS = [];
function teleCircle(x, y, r, f) {
  CX.fillStyle = `rgba(229,72,77,${0.08 + 0.12 * f})`;
  CX.beginPath();
  CX.arc(x, y, r, 0, TAU);
  CX.fill();
  CX.fillStyle = 'rgba(229,72,77,0.3)';
  CX.beginPath();
  CX.arc(x, y, r * clamp(f, 0, 1), 0, TAU);
  CX.fill();
  CX.strokeStyle = 'rgba(255,120,110,0.7)';
  CX.beginPath();
  CX.arc(x, y, r, 0, TAU);
  CX.stroke();
}
function shadow(x, y, r) {
  CX.fillStyle = 'rgba(0,0,0,0.4)';
  CX.beginPath();
  CX.ellipse(x, y, r, r * 0.38, 0, 0, TAU);
  CX.fill();
}
function drawMob(m) {
  const D = m.D,
    fly = D.fly ? 14 + Math.sin(m.ph * 0.5) * 4 : 0;
  shadow(m.x, m.y, m.r * 1.1);
  /* 菁英：腳下光圈；王：大光圈 */
  if (m.elite || m.boss) {
    CX.strokeStyle = m.boss ? 'rgba(255,100,60,0.6)' : 'rgba(138,180,255,0.7)';
    CX.lineWidth = 2;
    CX.beginPath();
    CX.ellipse(m.x, m.y, m.r * 1.4, m.r * 0.55, 0, 0, TAU);
    CX.stroke();
  }
  /* 擠壓：被打扁一下、走路上下彈、蓄力時抖 */
  const bob = m.mv && !D.fly ? Math.abs(Math.sin(m.ph)) * 0.06 : 0,
    sqv = m.sq * 0.18,
    wind = m.st === 'wind' ? Math.sin(G.t * 60) * 2 : 0;
  const o = { flip: P.x > m.x, sx: 1 + sqv, sy: 1 - sqv + bob, white: m.flash > 0 };
  spr(D.sp, m.x + wind, m.y - fly, m.sz, o);
  /* 蓄力：紅光 */
  if (m.st === 'wind') {
    CX.globalAlpha = 0.25 + 0.2 * Math.sin(G.t * 30);
    CX.fillStyle = '#ff3b3b';
    CX.beginPath();
    CX.arc(m.x, m.y - fly - m.sz * 0.5, m.sz * 0.35, 0, TAU);
    CX.fill();
    CX.globalAlpha = 1;
  }
  /* 生命條（受傷或菁英、王才顯示） */
  if (m.hp < m.mhp || m.elite) {
    const w = m.boss ? 0 : Math.max(36, m.r * 2.4),
      y = m.y - fly - m.sz - 8;
    if (w) {
      CX.fillStyle = 'rgba(0,0,0,0.7)';
      CX.fillRect(m.x - w / 2 - 1, y - 1, w + 2, 6);
      CX.fillStyle = m.elite ? '#8ab4ff' : '#e5484d';
      CX.fillRect(m.x - w / 2, y, (w * m.hp) / m.mhp, 4);
    }
  }
}
function drawHero() {
  const flip = Math.cos(P.face) < 0,
    hgt = 62;
  shadow(P.x, P.y, 18);
  let a = G.t < P.iuntil ? 0.75 : 1;
  if (P.roll) {
    /* 翻滾：壓扁、往方向傾斜 */
    const f = P.roll.t / ROLL.t;
    CX.save();
    CX.translate(P.x, P.y - 20);
    CX.rotate((P.roll.dx >= 0 ? 1 : -1) * f * TAU);
    CX.translate(-P.x, -(P.y - 20));
    spr('av_musashi', P.x, P.y, hgt * 0.75, { flip, a: 0.85 });
    CX.restore();
    if (Math.random() < 0.6) fx({ k: 'dust', x: P.x + rnd(-10, 10), y: P.y, dur: 0.35 });
    return;
  }
  if (P.act && P.act.k !== 'iai') {
    const f = P.act.t / P.act.dur,
      k = ATKF[Math.min(ATKF.length - 1, Math.floor(f * ATKF.length))];
    heroFrame(k, P.x, P.y, hgt, Math.cos(P.act.ang) < 0, a);
  } else {
    const bob = P.mv ? Math.abs(Math.sin(G.t * 12)) * 3 : Math.sin(G.t * 2) * 0.8;
    spr('av_musashi', P.x, P.y - bob, hgt, { flip, a });
  }
  if (P.hurtT > 0.25) spr('av_musashi', P.x, P.y, hgt, { flip, white: 1, a: 0.6 });
  /* 見切後的下一擊：刀光 */
  if (P.critNext) {
    CX.strokeStyle = `rgba(143,224,255,${0.5 + 0.3 * Math.sin(G.t * 12)})`;
    CX.lineWidth = 2;
    CX.beginPath();
    CX.ellipse(P.x, P.y, 24, 9, 0, 0, TAU);
    CX.stroke();
  }
}
function drawFx() {
  for (const o of G.fx) {
    const f = o.t / o.dur;
    if (o.k === 'p') {
      CX.globalAlpha = 1 - f;
      CX.fillStyle = o.col;
      CX.fillRect(o.x + o.vx * o.t, o.y + o.vy * o.t + 200 * o.t * o.t, o.sz, o.sz);
    } else if (o.k === 'slash') {
      /* 斬擊：一彎月牙，從細到粗再消失 */
      CX.globalAlpha = 1 - f * f;
      const a0 = o.ang - o.arc / 2 + o.arc * Math.min(1, f * 2.4) * 0;
      const g = CX.createRadialGradient(o.x, o.y - 20, o.r * 0.3, o.x, o.y - 20, o.r);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.7, 'rgba(255,240,210,0.35)');
      g.addColorStop(1, 'rgba(255,255,255,0.95)');
      CX.fillStyle = g;
      CX.beginPath();
      CX.arc(o.x, o.y - 20, o.r, a0, a0 + o.arc * Math.min(1, 0.4 + f * 3));
      CX.arc(o.x, o.y - 20, o.r * (0.55 + 0.25 * f), a0 + o.arc * Math.min(1, 0.4 + f * 3), a0, true);
      CX.closePath();
      CX.fill();
    } else if (o.k === 'claw') {
      CX.globalAlpha = 1 - f;
      CX.strokeStyle = o.big ? '#ff8a5b' : '#ffb3a0';
      CX.lineWidth = o.big ? 6 : 3;
      for (let i = -1; i <= 1; i++) {
        CX.beginPath();
        CX.arc(o.x, o.y - 20, o.r * (0.75 + i * 0.1), o.ang - 0.7 + i * 0.1, o.ang + 0.7 + i * 0.1);
        CX.stroke();
      }
    } else if (o.k === 'ring') {
      CX.globalAlpha = (1 - f) * 0.9;
      CX.strokeStyle = o.col || '#fff3d6';
      CX.lineWidth = 10 * (1 - f) + 2;
      CX.beginPath();
      CX.ellipse(o.x, o.y - 10, o.r * (0.6 + 0.4 * f), o.r * (0.6 + 0.4 * f) * 0.75, 0, 0, TAU);
      CX.stroke();
    } else if (o.k === 'ghost') {
      heroFrame(9, o.x, o.y, 62, o.flip, 0.35 * (1 - f));
    } else if (o.k === 'dust') {
      CX.globalAlpha = 0.35 * (1 - f);
      CX.fillStyle = '#8a7a6a';
      CX.beginPath();
      CX.arc(o.x, o.y - f * 10, 4 + f * 10, 0, TAU);
      CX.fill();
    } else if (o.k === 'die') {
      /* 死掉：閃白、往上散、淡出 */
      spr(o.sp, o.x, o.y, o.sz, { flip: o.flip, white: f < 0.25, a: 1 - f, sx: 1 + f * 0.4, sy: 1 - f * 0.6 });
    } else if (o.k === 'heal' || o.k === 'lvup') {
      CX.globalAlpha = 1 - f;
      CX.strokeStyle = o.k === 'heal' ? '#ff6b6b' : '#9df29d';
      CX.lineWidth = 3;
      CX.beginPath();
      CX.ellipse(o.x, o.y - f * 40, 26 + f * 20, 10 + f * 6, 0, 0, TAU);
      CX.stroke();
    } else if (o.k === 'mikiri') {
      CX.globalAlpha = 1 - f;
      CX.strokeStyle = '#8fe0ff';
      CX.lineWidth = 3;
      CX.beginPath();
      CX.arc(o.x, o.y - 30, 30 + f * 160, 0, TAU);
      CX.stroke();
    }
    CX.globalAlpha = 1;
  }
}
function drawMinimap(W) {
  const mw = 190,
    mh = (mw * G.H) / G.W,
    x0 = W - mw - 16,
    y0 = 16,
    s = mw / G.W;
  CX.fillStyle = 'rgba(10,8,7,0.7)';
  CX.fillRect(x0, y0, mw, mh);
  CX.strokeStyle = 'rgba(232,226,214,0.25)';
  CX.lineWidth = 1;
  CX.strokeRect(x0 + 0.5, y0 + 0.5, mw - 1, mh - 1);
  CX.fillStyle = 'rgba(80,70,62,0.8)';
  for (const k of G.rocks) CX.fillRect(x0 + k.x * s - 1, y0 + k.y * s - 1, Math.max(2, k.r * s), Math.max(2, k.r * s));
  for (const m of G.mobs) {
    CX.fillStyle = m.boss ? '#ff6b3d' : m.elite ? '#8ab4ff' : '#c95050';
    const z = m.boss ? 5 : 2;
    CX.fillRect(x0 + m.x * s - z / 2, y0 + m.y * s - z / 2, z, z);
  }
  CX.fillStyle = '#9df29d';
  CX.fillRect(x0 + P.x * s - 2, y0 + P.y * s - 2, 4, 4);
}
