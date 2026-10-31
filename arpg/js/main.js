/* ARPG 原型 · 啟動 */
'use strict';
let DPR = 1;
function resize() {
  DPR = Math.min(2, devicePixelRatio || 1);
  CV.width = Math.round(innerWidth * DPR);
  CV.height = Math.round(innerHeight * DPR);
}
function start() {
  CV = $('#cv');
  CX = CV.getContext('2d');
  resize();
  addEventListener('resize', resize);
  loadSave();
  newArea();
  hudInit();
  inputInit();
  setInterval(save, 10000);
  requestAnimationFrame(frame);
}
start();
