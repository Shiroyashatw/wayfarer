/* 漫步勇者 · 共用工具：$、數學、繪圖輔助 */
'use strict';
const $ = id => document.getElementById(id),
  fl = Math.floor,
  m = (a, n) => ((a % n) + n) % n;
/* ================= utils ================= */
function h(x, y, s = 0) {
  let n = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((s | 0) + 1, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  n ^= n >>> 16;
  return n >>> 0;
}
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = (a, b) => a + Math.random() * (b - a);
const now = () => Date.now() + (S ? S.timeOffset : 0);
/* 地圖刷新週期：怪物與限時事件每 15 分鐘換一輪；地城、城鎮試煉、寶箱、商店、廟宇祝福每 1 小時 */
const REFRESH = 15 * 60e3,
  REFRESH_H = 60 * 60e3;
const epoch = () => fl(now() / REFRESH),
  hepoch = () => fl(now() / REFRESH_H);
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function hex2rgb(c) {
  c = c.replace('#', '');
  if (c.length === 3)
    c = c
      .split('')
      .map(x => x + x)
      .join('');
  const n = parseInt(c, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function shade(c, f) {
  const [r, g, b] = hex2rgb(c),
    t = f > 0 ? 255 : 0,
    a = Math.abs(f),
    hx = v =>
      Math.round(v + (t - v) * a)
        .toString(16)
        .padStart(2, '0');
  return '#' + hx(r) + hx(g) + hx(b);
}
function dist(a, b, c, d) {
  const R = 6371e3,
    p1 = (a * Math.PI) / 180,
    p2 = (c * Math.PI) / 180,
    dp = ((c - a) * Math.PI) / 180,
    dl = ((d - b) * Math.PI) / 180,
    x = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
const fmtD = d => (d < 1000 ? Math.round(d) + ' 公尺' : (d / 1000).toFixed(1) + ' 公里');
function dirName(lat1, lng1, lat2, lng2) {
  const a = (Math.atan2(lat2 - lat1, (lng2 - lng1) * Math.cos((lat1 * Math.PI) / 180)) * 180) / Math.PI;
  return ['東', '東北', '北', '西北', '西', '西南', '南', '東南'][m(Math.round(a / 45), 8)];
}
const RANGE = 80; // interaction radius (m)
