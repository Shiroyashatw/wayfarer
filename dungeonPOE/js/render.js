/* dungeonPOE · 畫面：藏身處、地板、石頭、預警、怪物、玩家、特效、跳數字、掉落標籤、光照、小地圖 */
'use strict';
/* 畫圖：腳底在 (x, y)，高度 hgt，flip 左右翻；圖用 sprites.js 的大圖（用到才載） */
function spr(n, x, y, hgt, o = {}) {
  const a = artImg(n);
  if (!a || !a.im.complete || !a.im.naturalWidth) return;
  const r = a.r,
    sc = hgt / r[3],
    w = r[2] * sc * (o.sx || 1),
    h = hgt * (o.sy || 1);
  CX.save();
  CX.translate(Math.round(x), Math.round(y));
  if (o.flip) CX.scale(-1, 1);
  if (o.a != null) CX.globalAlpha = o.a;
  if (o.white) {
    /* 閃白：artSprite 的白色版（留 1 格邊、貼底） */
    const c = artSprite('a_' + n, 1),
      k = hgt / (c.height - 2);
    CX.drawImage(
      c,
      (-c.width * k * (o.sx || 1)) / 2,
      -c.height * k * (o.sy || 1) + k,
      c.width * k * (o.sx || 1),
      c.height * k * (o.sy || 1)
    );
  } else CX.drawImage(a.im, r[0], r[1], r[2], r[3], -w / 2, -h, w, h);
  CX.restore();
}
/* 主角：PixelLab 的角色表（img/hero.png，720×720、每格 80×80、腳底在 y=63；art/hero/hero.json）
   0 八個方向（南、東南、東、東北、北、西北、西、西南）、1 待機、2 滑步（翻滾，原圖朝左）、3 揮砍、4 跳起砸地、5 施法、
   6 跑步（朝右，往左鏡像）、7 往上跑（背面）、8 旋轉揮擊；出手動畫都朝右下，往左就鏡像 */
const ACT_ROW = {
  slash: 3,
  swallow: 3,
  iai: 3,
  quake: 4,
  whirl: 8,
  storm: 8,
  thrust: 3,
  combo: 8,
  split: 5,
  frostbolt: 5,
  arc: 5,
  nova: 5,
  blade: 5,
  fireball: 5,
  venom: 5,
  meteor: 5,
  wolf: 5
};
const HERO_IMG = new Image();
let HERO_W;
HERO_IMG.onload = () => {
  /* 受傷閃白用的白色版 */
  const c = (HERO_W = document.createElement('canvas'));
  c.width = HERO_IMG.width;
  c.height = HERO_IMG.height;
  const g = c.getContext('2d');
  g.drawImage(HERO_IMG, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = '#fff';
  g.fillRect(0, 0, c.width, c.height);
};
HERO_IMG.src = 'img/hero.png?v=' + VER;
const HSC = 1.35;
function heroCell(row, col, x, y, flip, al, o = {}) {
  const im = o.white ? HERO_W : HERO_IMG;
  if (!im || !HERO_IMG.complete || !HERO_IMG.naturalWidth) return;
  CX.save();
  CX.translate(Math.round(x), Math.round(y));
  if (flip) CX.scale(-1, 1);
  if (al != null) CX.globalAlpha = al;
  CX.scale(o.sx || 1, o.sy || 1);
  CX.drawImage(im, col * 80, row * 80, 80, 80, -40 * HSC, -63 * HSC, 80 * HSC, 80 * HSC);
  CX.restore();
}
/* 角度 → 第 0 列的方向格 */
const dirCol = a => (2 - (((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8) + 8) % 8;

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
let ZOOM = 1.35; /* 手機照螢幕高度調（main.js 的 resize） */
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
  if (G.scene === 'hide') drawHideout();
  else drawWalls(W, H);
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
  /* 毒刃雨：紫色範圍＋落下的刀光 */
  for (const p of G.pools || []) {
    const a = Math.min(1, (p.dur - p.t) * 2);
    CX.fillStyle = `rgba(150,80,220,${0.16 * a})`;
    CX.beginPath();
    CX.ellipse(p.x, p.y, p.r, p.r * 0.7, 0, 0, TAU);
    CX.fill();
    CX.strokeStyle = `rgba(195,139,255,${0.5 * a})`;
    CX.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const k = (G.t * 3 + i * 0.37) % 1,
        x = p.x + Math.cos(i * 2.1 + p.x) * p.r * 0.6,
        y = p.y + Math.sin(i * 1.7 + p.y) * p.r * 0.4;
      CX.beginPath();
      CX.moveTo(x, y - 60 + k * 50);
      CX.lineTo(x, y - 48 + k * 50);
      CX.stroke();
    }
  }
  /* 陷阱、地雷、砲台、圖騰 */
  for (const u of G.units || []) drawUnit(u);
  /* 隕石：落點的橘圈越來越滿，球從上面掉下來 */
  for (const o of G.meteors || []) {
    const f = Math.min(1, o.t / o.dur);
    CX.strokeStyle = 'rgba(255,138,76,0.7)';
    CX.lineWidth = 2;
    CX.beginPath();
    CX.ellipse(o.x, o.y, o.r, o.r * 0.7, 0, 0, TAU);
    CX.stroke();
    CX.fillStyle = `rgba(255,107,61,${0.1 + 0.2 * f})`;
    CX.beginPath();
    CX.ellipse(o.x, o.y, o.r * f, o.r * 0.7 * f, 0, 0, TAU);
    CX.fill();
    CX.fillStyle = '#ffb36b';
    CX.beginPath();
    CX.arc(o.x + (1 - f) * 120, o.y - (1 - f) * 360, 14, 0, TAU);
    CX.fill();
  }
  /* 傳送門：藏身處的＝進地圖（紫），地圖裡的＝回家（藍） */
  if (G.portal) {
    const p = G.portal;
    CX.fillStyle = p.home ? 'rgba(90,160,255,0.18)' : 'rgba(178,141,255,0.18)';
    CX.beginPath();
    CX.ellipse(p.x, p.y, 46, 20, 0, 0, TAU);
    CX.fill();
    for (let i = 0; i < 3; i++) {
      CX.strokeStyle = p.home ? `rgba(120,190,255,${0.7 - i * 0.2})` : `rgba(178,141,255,${0.7 - i * 0.2})`;
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
    else if (d.frag) spr('mat_frag', x, y + 8, 24);
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
  const ents = G.mobs.filter(m => m.hp > 0).concat([P], G.allies || []);
  ents.sort((a, b) => a.y - b.y);
  for (const e of ents) e === P ? drawHero() : e.src ? drawWolf(e) : drawMob(e);
  /* 投射物 */
  for (const s of G.shots) {
    if (s.wave || s.bolt) {
      CX.save();
      CX.translate(s.x, s.y);
      CX.rotate(s.ang);
      CX.fillStyle = s.bolt ? '#d9c7a3' : ELC[s.wave];
      CX.fillRect(-16, -2, 26, 4);
      CX.globalAlpha = 0.35;
      CX.fillRect(-34, -4, 22, 8);
      CX.restore();
      CX.globalAlpha = 1;
      continue;
    }
    if (s.cold) {
      CX.fillStyle = 'rgba(143,214,255,0.3)';
      CX.beginPath();
      CX.arc(s.x, s.y, 16, 0, TAU);
      CX.fill();
      CX.fillStyle = '#e6f7ff';
      CX.beginPath();
      CX.arc(s.x, s.y, 7, 0, TAU);
      CX.fill();
      continue;
    }
    if (s.fire) {
      CX.fillStyle = 'rgba(255,138,76,0.3)';
      CX.beginPath();
      CX.arc(s.x, s.y, 20, 0, TAU);
      CX.fill();
      CX.fillStyle = '#ffd08a';
      CX.beginPath();
      CX.arc(s.x, s.y, 9, 0, TAU);
      CX.fill();
    } else if (s.foe) {
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
      CX.fillStyle = s.pink ? '#ffc4d6' : '#eef6ff';
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
    const st = {
      phys: ['#fff3e0', 15],
      fire: [ELC.fire, 15],
      cold: [ELC.cold, 15],
      light: [ELC.light, 15],
      chaos: [ELC.chaos, 15],
      frag: ['#c9b8ff', 14],
      block: ['#cfd8e3', 16],
      hit: ['#fff3e0', 15],
      crit: ['#ffd166', 24],
      hurt: ['#ff5a5a', 17],
      gold: ['#ffd166', 14],
      lv: ['#9df29d', 20],
      mikiri: ['#8fe0ff', 26],
      ev: ['#b8f0c8', 18]
    }[n.c];
    CX.globalAlpha = 1 - Math.max(0, f - 0.6) / 0.4;
    CX.font = `700 ${Math.round(st[1] * pop)}px "Noto Sans TC", sans-serif`;
    const txt =
      n.c === 'gold'
        ? '+' + n.v + ' 金'
        : n.c === 'frag'
          ? '+' + n.v + ' 碎片'
          : n.c === 'block'
            ? '格擋'
            : n.c === 'lv'
              ? '升級！Lv ' + n.v
              : n.c === 'mikiri'
                ? '見切'
                : n.c === 'ev'
                  ? '閃避'
                  : n.v;
    CX.lineWidth = 4;
    CX.strokeStyle = 'rgba(0,0,0,0.8)';
    CX.strokeText(txt, n.x, y);
    CX.fillStyle = st[0];
    CX.fillText(txt, n.x, y);
  }
  CX.globalAlpha = 1;
  drawAim();
  drawPrompts();
  /* 掉落標籤（PoE 式：名字框，可以點） */
  LABELS.length = 0;
  CX.font = '600 13px "Noto Sans TC", sans-serif';
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
  dg.fillStyle = G.scene === 'hide' ? 'rgba(4,3,3,0.3)' : 'rgba(4,3,3,0.72)';
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
    if (G.scene === 'map') drawMinimap(W);
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
  /* 刺客的印記（紫點）、燃燒（橘色的火） */
  if (m.mark) {
    CX.fillStyle = '#c38bff';
    for (let i = 0; i < Math.min(10, m.mark); i++) CX.fillRect(m.x - 18 + i * 4, m.y - fly - m.sz - 16, 3, 3);
  }
  if (m.burn) {
    CX.fillStyle = `rgba(255,120,50,${0.25 + 0.03 * m.burn.n})`;
    CX.beginPath();
    CX.ellipse(m.x, m.y - fly - m.sz * 0.4, m.r * 0.9, m.sz * 0.45, 0, 0, TAU);
    CX.fill();
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
  shadow(P.x, P.y, 18);
  const a = G.t < P.iuntil ? 0.8 : 1,
    flipF = Math.cos(P.face) < -0.05;
  if (P.roll) {
    /* 翻滾：滑步動畫，往左就鏡像 */
    const f = Math.min(5, Math.floor((P.roll.t / ROLL.t) * 6));
    heroCell(2, f, P.x, P.y, P.roll.dx > 0, 0.9);
    if (Math.random() < 0.6) fx({ k: 'dust', x: P.x + rnd(-10, 10), y: P.y, dur: 0.35 });
    return;
  }
  if (P.act && P.act.k !== 'iai') {
    /* 出手：照技能播 9 格動畫，往左就鏡像 */
    const f = Math.min(8, Math.floor((P.act.t / P.act.dur) * 9));
    heroCell(P.act.place ? 5 : ACT_ROW[P.act.k] || 3, f, P.x, P.y, Math.cos(P.act.ang) < -0.05, a);
  } else if (P.mv || (P.act && P.act.k === 'iai')) {
    const dx = P.act ? Math.cos(P.act.ang) : P.mdx,
      dy = P.act ? Math.sin(P.act.ang) : P.mdy,
      fr = Math.floor(G.t * 12) % 8;
    /* 往上跑用背面，其他用側面（往左鏡像） */
    if (dy < -0.6 && Math.abs(dx) < 0.8) heroCell(7, fr, P.x, P.y, false, a);
    else heroCell(6, fr, P.x, P.y, dx < -0.05 || (Math.abs(dx) <= 0.05 && flipF), a);
  } else {
    const col = dirCol(P.face);
    if (col === 0) heroCell(1, Math.floor(G.t * 8) % 8, P.x, P.y, false, a);
    else heroCell(0, col, P.x, P.y, false, a);
  }
  if (P.hurtT > 0.25) heroCell(0, dirCol(P.face), P.x, P.y, false, 0.6, { white: 1 });
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
    } else if (o.k === 'quake') {
      CX.globalAlpha = 0.6 * (1 - f);
      CX.fillStyle = '#c9a27a';
      CX.beginPath();
      CX.moveTo(o.x, o.y);
      CX.arc(o.x, o.y, o.r * (0.5 + 0.5 * f), o.ang - o.arc / 2, o.ang + o.arc / 2);
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
    } else if (o.k === 'zap') {
      /* 電弧：兩點之間鋸齒狀的閃電 */
      CX.globalAlpha = 1 - f;
      CX.strokeStyle = '#ffe066';
      CX.lineWidth = 3;
      CX.beginPath();
      CX.moveTo(o.x, o.y);
      for (let i = 1; i < 6; i++) {
        const t = i / 6;
        CX.lineTo(
          o.x + (o.x2 - o.x) * t + (Math.random() - 0.5) * 22,
          o.y + (o.y2 - o.y) * t + (Math.random() - 0.5) * 22
        );
      }
      CX.lineTo(o.x2, o.y2);
      CX.stroke();
      CX.globalAlpha = 1;
    } else if (o.k === 'ring') {
      CX.globalAlpha = (1 - f) * 0.9;
      CX.strokeStyle = o.col || '#fff3d6';
      CX.lineWidth = 10 * (1 - f) + 2;
      CX.beginPath();
      CX.ellipse(o.x, o.y - 10, o.r * (0.6 + 0.4 * f), o.r * (0.6 + 0.4 * f) * 0.75, 0, 0, TAU);
      CX.stroke();
    } else if (o.k === 'ghost') {
      heroCell(6, 2, o.x, o.y, o.flip, 0.35 * (1 - f));
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
  /* 手機：小一點，放在右上選單下面 */
  const mw = TOUCH.on ? Math.min(104, (68 * G.W) / G.H) / ZOOM : 190,
    mh = (mw * G.H) / G.W,
    x0 = W - mw - (TOUCH.on ? 10 / ZOOM : 16),
    y0 = TOUCH.on ? 60 / ZOOM : 16,
    s = mw / G.W;
  CX.fillStyle = 'rgba(10,8,7,0.7)';
  CX.fillRect(x0, y0, mw, mh);
  CX.strokeStyle = 'rgba(232,226,214,0.25)';
  CX.lineWidth = 1;
  CX.strokeRect(x0 + 0.5, y0 + 0.5, mw - 1, mh - 1);
  if (!G.mini) {
    /* 地圖縮圖：一格一點，進地圖時畫一次 */
    const c = (G.mini = document.createElement('canvas'));
    c.width = G.cols;
    c.height = G.rows;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(120,105,92,0.9)';
    for (let y = 0; y < G.rows; y++)
      for (let x = 0; x < G.cols; x++) if (!G.tiles[y * G.cols + x]) g.fillRect(x, y, 1, 1);
  }
  CX.imageSmoothingEnabled = false;
  CX.drawImage(G.mini, x0, y0, mw, mh);
  for (const m of G.mobs) {
    CX.fillStyle = m.boss ? '#ff6b3d' : m.elite ? '#8ab4ff' : '#c95050';
    const z = m.boss ? 5 : 2;
    CX.fillRect(x0 + m.x * s - z / 2, y0 + m.y * s - z / 2, z, z);
  }
  CX.fillStyle = '#9df29d';
  CX.fillRect(x0 + P.x * s - 2, y0 + P.y * s - 2, 4, 4);
}

/* 藏身處：木地板、牆、地圖台、倉庫箱、市集攤；走近時顯示「F 名字」 */
function drawHideout() {
  CX.fillStyle = '#2a211b';
  CX.fillRect(0, 0, G.W, 100);
  CX.fillStyle = '#3a2d23';
  for (let x = 0; x < G.W; x += 48) CX.fillRect(x + 2, 60, 44, 36);
  CX.fillStyle = 'rgba(0,0,0,0.35)';
  CX.fillRect(0, 96, G.W, 14);
  for (const p of G.props) {
    shadow(p.x, p.y + 6, p.r * 1.1);
    if (p.k === 'device') {
      /* 地圖台：石台＋發光的盤面 */
      CX.fillStyle = '#3d342e';
      CX.beginPath();
      CX.ellipse(p.x, p.y, p.r, p.r * 0.55, 0, 0, TAU);
      CX.fill();
      CX.fillStyle = '#5a4d43';
      CX.fillRect(p.x - p.r * 0.7, p.y - 46, p.r * 1.4, 40);
      const g = 0.5 + 0.3 * Math.sin(G.t * 2);
      CX.fillStyle = `rgba(178,141,255,${g})`;
      CX.beginPath();
      CX.ellipse(p.x, p.y - 46, p.r * 0.7, p.r * 0.3, 0, 0, TAU);
      CX.fill();
      spr('mat_frag', p.x, p.y - 44, 28);
    } else if (p.k === 'stash') {
      CX.fillStyle = '#6b4a2b';
      CX.fillRect(p.x - 34, p.y - 44, 68, 44);
      CX.fillStyle = '#8a6239';
      CX.fillRect(p.x - 34, p.y - 52, 68, 14);
      CX.fillStyle = '#d9b45a';
      CX.fillRect(p.x - 5, p.y - 36, 10, 12);
    } else if (p.k === 'asc') {
      /* 昇華石碑：發金光的石碑 */
      CX.fillStyle = '#3d342e';
      CX.fillRect(p.x - 22, p.y - 70, 44, 70);
      CX.fillStyle = '#5a4d43';
      CX.fillRect(p.x - 26, p.y - 76, 52, 10);
      const g = 0.45 + 0.3 * Math.sin(G.t * 2.4);
      CX.fillStyle = `rgba(255,209,102,${g})`;
      CX.fillRect(p.x - 8, p.y - 58, 16, 30);
      spr('cls_swordsman', p.x, p.y - 26, 30);
    } else {
      CX.fillStyle = '#4a3a2e';
      CX.fillRect(p.x - 36, p.y - 40, 72, 40);
      CX.fillStyle = '#7a2e2a';
      CX.fillRect(p.x - 44, p.y - 70, 88, 16);
      spr('mat_gold', p.x, p.y - 40, 24);
    }
  }
}
/* 互動提示：走近的東西頭上「F 名字」 */
function drawPrompts() {
  const p = G.scene === 'hide' && nearProp(),
    port = G.portal && dist(P, G.portal) < 90;
  const lab =
    port && G.scene === 'hide'
      ? [(TOUCH.on ? '' : 'F ') + '進入階級 ' + G.portal.to, G.portal.x, G.portal.y - 40]
      : p
        ? [(TOUCH.on ? '' : 'F ') + p.n, p.x, p.y - (p.k === 'device' ? 92 : 80)]
        : null;
  if (!lab) return;
  CX.font = '700 14px "Noto Sans TC", sans-serif';
  CX.textAlign = 'center';
  const w = CX.measureText(lab[0]).width + 18;
  CX.fillStyle = 'rgba(10,8,7,0.85)';
  CX.fillRect(lab[1] - w / 2, lab[2] - 15, w, 24);
  CX.strokeStyle = 'rgba(255,209,102,0.7)';
  CX.strokeRect(lab[1] - w / 2 + 0.5, lab[2] - 14.5, w - 1, 23);
  CX.fillStyle = '#ffd166';
  CX.fillText(lab[0], lab[1], lab[2] + 2);
}

/* 地圖的牆：只畫鄰接地板的牆；下面是地板的牆畫出正面（有厚度） */
function drawWalls(W, H) {
  const x0 = Math.max(0, Math.floor((G.cam.x - W / 2) / TS) - 1),
    x1 = Math.min(G.cols - 1, Math.ceil((G.cam.x + W / 2) / TS) + 1),
    y0 = Math.max(0, Math.floor((G.cam.y - H / 2) / TS) - 1),
    y1 = Math.min(G.rows - 1, Math.ceil((G.cam.y + H / 2) / TS) + 1),
    T = G.tiles,
    C = G.cols,
    wall = (x, y) => x < 0 || y < 0 || x >= C || y >= G.rows || T[y * C + x] === 1;
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      if (!wall(x, y)) continue;
      const px = x * TS,
        py = y * TS;
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) if (!wall(x + dx, y + dy)) near = true;
      CX.fillStyle = near ? '#1c1714' : '#070606';
      CX.fillRect(px, py, TS, TS);
      if (!near) continue;
      CX.fillStyle = '#2b231e';
      CX.fillRect(px + 2, py + 2, TS - 4, TS - 4);
      if (!wall(x, y + 1)) {
        /* 正面 */
        CX.fillStyle = '#3a2f28';
        CX.fillRect(px, py + TS * 0.45, TS, TS * 0.55);
        CX.fillStyle = '#4a3d33';
        CX.fillRect(px, py + TS * 0.45, TS, 3);
        CX.fillStyle = 'rgba(0,0,0,0.35)';
        CX.fillRect(px + TS / 2 - 1, py + TS * 0.45 + 3, 2, TS * 0.55 - 3);
      }
    }
}

/* 戰狼：跟著你的狼（腳下綠圈） */
function drawWolf(w) {
  shadow(w.x, w.y, 13);
  CX.strokeStyle = 'rgba(157,242,157,0.6)';
  CX.lineWidth = 1.5;
  CX.beginPath();
  CX.ellipse(w.x, w.y, 16, 6, 0, 0, TAU);
  CX.stroke();
  const bob = w.mv ? Math.abs(Math.sin(w.ph)) * 0.08 : 0;
  spr('m_snowwolf', w.x, w.y, 36, { flip: (w.face || 0) > 0, sy: 1 + bob });
}

/* 場上單位：陷阱（地上的齒輪）、地雷（閃紅點）、砲台（弩）、圖騰（柱子）；砲台、圖騰下面的小條是剩下的時間 */
function drawUnit(u) {
  const D = u.c.D;
  shadow(u.x, u.y, 12);
  if (u.type === 'trap') {
    CX.strokeStyle = u.t > 0.4 ? '#8fd6ff' : 'rgba(143,214,255,0.4)';
    CX.lineWidth = 3;
    CX.beginPath();
    CX.arc(u.x, u.y - 4, 11, 0, TAU);
    CX.stroke();
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU + G.t;
      CX.fillStyle = '#cfe9ff';
      CX.fillRect(u.x + Math.cos(a) * 14 - 2, u.y - 4 + Math.sin(a) * 14 - 2, 4, 4);
    }
  } else if (u.type === 'mine') {
    CX.fillStyle = '#4a3d33';
    CX.beginPath();
    CX.arc(u.x, u.y - 4, 9, 0, TAU);
    CX.fill();
    CX.fillStyle = Math.sin(G.t * 14) > 0 ? '#ff5a5a' : '#7a1c1c';
    CX.fillRect(u.x - 2, u.y - 7, 4, 4);
  } else if (u.type === 'turret') {
    CX.fillStyle = '#6b4a2b';
    CX.fillRect(u.x - 10, u.y - 20, 20, 20);
    CX.fillStyle = '#c9a46b';
    CX.fillRect(u.x - 16, u.y - 26, 32, 6);
  } else {
    CX.fillStyle = '#5a4d43';
    CX.fillRect(u.x - 9, u.y - 46, 18, 46);
    CX.fillStyle = D.el === 'fire' ? '#ff8a4c' : '#c9a46b';
    CX.fillRect(u.x - 12, u.y - 52, 24, 10);
    spr(D.ic, u.x, u.y - 22, 18);
  }
  if (u.type === 'turret' || u.type === 'totem') {
    CX.fillStyle = 'rgba(0,0,0,0.6)';
    CX.fillRect(u.x - 14, u.y + 6, 28, 3);
    CX.fillStyle = '#cfd8e3';
    CX.fillRect(u.x - 14, u.y + 6, 28 * Math.max(0, 1 - u.t / u.dur), 3);
  }
}
