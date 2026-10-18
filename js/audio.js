/* 漫步勇者 · Web Audio 合成音樂與音效 */
'use strict';
/* ================= audio ================= */
const AU = { ctx: null, music: null, sfx: null, song: null, step: 0, next: 0, noiseBuf: null };
function audioInit() {
  if (!S) return;
  if (AU.ctx) {
    if (AU.ctx.state === 'suspended') AU.ctx.resume();
    return;
  }
  const C = window.AudioContext || window.webkitAudioContext;
  if (!C) return;
  AU.ctx = new C();
  const master = AU.ctx.createGain();
  master.gain.value = 0.6;
  master.connect(AU.ctx.destination);
  AU.music = AU.ctx.createGain();
  AU.music.gain.value = S.music ? 0.5 : 0;
  AU.music.connect(master);
  AU.sfx = AU.ctx.createGain();
  AU.sfx.gain.value = S.sfx ? 0.8 : 0;
  AU.sfx.connect(master);
  const len = AU.ctx.sampleRate;
  AU.noiseBuf = AU.ctx.createBuffer(1, len, len);
  const d = AU.noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  setInterval(schedule, 25);
  playSong(B ? (B.boss ? 'boss' : 'battle') : 'field');
}
function tone(f, d, type = 'square', v = 0.15, delay = 0, slide = 0, bus) {
  const c = AU.ctx;
  if (!c) return;
  const t = c.currentTime + Math.max(0, delay),
    o = c.createOscillator(),
    g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g);
  g.connect(bus || AU.sfx);
  o.start(t);
  o.stop(t + d + 0.05);
}
function noise(d, v = 0.2, delay = 0, freq = 1200, ft = 'bandpass', bus) {
  const c = AU.ctx;
  if (!c) return;
  const t = c.currentTime + Math.max(0, delay),
    s = c.createBufferSource(),
    f = c.createBiquadFilter(),
    g = c.createGain();
  s.buffer = AU.noiseBuf;
  f.type = ft;
  f.frequency.value = freq;
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  s.connect(f);
  f.connect(g);
  g.connect(bus || AU.sfx);
  s.start(t, Math.random() * 0.5);
  s.stop(t + d + 0.05);
}
const NS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const nf = n => {
  const r = /^([A-G])(#?)(\d)$/.exec(n);
  if (!r) return 0;
  return 440 * Math.pow(2, ((+r[3] + 1) * 12 + NS[r[1]] + (r[2] ? 1 : 0) - 69) / 12);
};
const SONGS = {
  field: {
    bpm: 92,
    ch: [
      {
        w: 'square',
        v: 0.045,
        s: 'E5 . G5 . A5 . G5 E5 D5 . E5 . C5 . . . D5 . E5 . G5 . A5 C6 A5 . G5 . E5 . . . G5 . A5 . C6 . A5 G5 E5 . G5 . A5 . . . G5 E5 D5 . C5 . D5 E5 C5 . . . - - - -'
      },
      { w: 'triangle', v: 0.13, s: 'C3 . . . G3 . . . A2 . . . E3 . . . F2 . . . C3 . . . G2 . . . G3 . . .' },
      {
        w: 'square',
        v: 0.022,
        s: 'C4 E4 G4 E4 C4 E4 G4 E4 A3 C4 E4 C4 A3 C4 E4 C4 F3 A3 C4 A3 F3 A3 C4 A3 G3 B3 D4 B3 G3 B3 D4 B3'
      },
      { w: 'hat', v: 0.025, s: '- - x - - - x - - - x - - - x x' }
    ]
  },
  battle: {
    bpm: 156,
    ch: [
      {
        w: 'square',
        v: 0.055,
        s: 'A4 C5 E5 . D5 C5 B4 C5 A4 . . . E4 . A4 . G4 B4 D5 . C5 B4 A4 B4 G4 . . . D4 . G4 . F4 A4 C5 . B4 A4 G4 A4 E5 . . . D5 . C5 . B4 . G#4 . B4 . E5 . . . . . - -'
      },
      {
        w: 'sawtooth',
        v: 0.045,
        s: 'A2 A2 A3 A2 A2 A2 A3 A2 G2 G2 G3 G2 G2 G2 G3 G2 F2 F2 F3 F2 F2 F2 F3 F2 E2 E2 E3 E2 E2 E2 G#2 B2'
      },
      { w: 'kick', v: 0.3, s: 'x - - - x - - - x - - - x - x -' },
      { w: 'snare', v: 0.12, s: '- - - - x - - - - - - - x - - x' },
      { w: 'hat', v: 0.025, s: 'x x x x x x x x x x x x x x x x' }
    ]
  }
};
SONGS.boss = { bpm: 174, ch: SONGS.battle.ch };
const PARSED = new Map();
function parse(s) {
  if (PARSED.has(s)) return PARSED.get(s);
  const tk = s.trim().split(/\s+/),
    out = tk.map((t, i) => {
      if (t === '.' || t === '-') return null;
      let len = 1;
      while (tk[i + len] === '.') len++;
      return { n: t, len };
    });
  PARSED.set(s, out);
  return out;
}
function playSong(name) {
  if (!AU.ctx || AU.song === name) return;
  AU.song = name;
  AU.step = 0;
  AU.next = AU.ctx.currentTime + 0.08;
}
function schedule() {
  if (!AU.ctx || !AU.song) return;
  const song = SONGS[AU.song],
    dur = 60 / song.bpm / 2;
  while (AU.next < AU.ctx.currentTime + 0.12) {
    for (const ch of song.ch) {
      const seq = parse(ch.s),
        ev = seq[AU.step % seq.length];
      if (!ev) continue;
      const t = AU.next - AU.ctx.currentTime;
      if (ch.w === 'hat') noise(0.03, ch.v, t, 7000, 'highpass', AU.music);
      else if (ch.w === 'kick') tone(130, 0.16, 'sine', ch.v, t, 40, AU.music);
      else if (ch.w === 'snare') noise(0.12, ch.v, t, 1800, 'bandpass', AU.music);
      else tone(nf(ev.n), dur * ev.len * 0.92, ch.w, ch.v, t, 0, AU.music);
    }
    AU.next += dur;
    AU.step++;
  }
}
const SFX = {
  step: () => noise(0.035, 0.03, 0, 900, 'lowpass'),
  tap: () => tone(880, 0.04, 'square', 0.05),
  select: () => {
    tone(660, 0.05, 'square', 0.07);
    tone(990, 0.07, 'square', 0.07, 0.05);
  },
  slash: () => {
    noise(0.14, 0.25, 0, 2500, 'highpass');
    tone(300, 0.08, 'sawtooth', 0.06, 0, 120);
  },
  hit: () => {
    noise(0.1, 0.3, 0, 900);
    tone(160, 0.1, 'square', 0.12, 0, 60);
  },
  crit: () => {
    noise(0.18, 0.4, 0, 1400);
    tone(520, 0.12, 'square', 0.1, 0, 180);
    tone(1040, 0.08, 'square', 0.06, 0.04);
  },
  fire: () => {
    noise(0.5, 0.3, 0, 500, 'lowpass');
    tone(200, 0.4, 'sawtooth', 0.06, 0, 60);
  },
  ice: () => [1568, 1319, 1175, 1568, 2093].forEach((f, i) => tone(f, 0.12, 'triangle', 0.08, i * 0.05)),
  heal: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.09, i * 0.07)),
  hurt: () => {
    tone(150, 0.2, 'sawtooth', 0.14, 0, 60);
    noise(0.12, 0.2, 0, 600);
  },
  arrow: () => {
    noise(0.08, 0.15, 0, 4000, 'highpass');
    tone(1200, 0.08, 'triangle', 0.05, 0, 500);
  },
  encounter: () => {
    tone(220, 0.35, 'sawtooth', 0.08, 0, 880);
    tone(330, 0.35, 'square', 0.05, 0.05, 1320);
    noise(0.4, 0.15, 0, 3000, 'highpass');
  },
  win: () =>
    [
      [523, 0.1],
      [659, 0.1],
      [784, 0.1],
      [1047, 0.45]
    ].forEach(([f, d], i) => {
      tone(f, d, 'square', 0.08, i * 0.11);
      tone(f / 2, d, 'triangle', 0.1, i * 0.11);
    }),
  lose: () => [392, 349, 311, 262].forEach((f, i) => tone(f, 0.3, 'triangle', 0.12, i * 0.25)),
  level: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.14, 'square', 0.06, i * 0.06)),
  coin: () => {
    tone(988, 0.06, 'square', 0.07);
    tone(1319, 0.14, 'square', 0.07, 0.06);
  },
  bless: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.3, 'sine', 0.08, i * 0.09)),
  door: () => {
    tone(110, 0.4, 'sawtooth', 0.08, 0, 55);
    noise(0.4, 0.12, 0, 300, 'lowpass');
  },
  nope: () => tone(180, 0.12, 'square', 0.06)
};
function sfx(n) {
  if (AU.ctx && S.sfx) SFX[n]();
}
function buzz(ms) {
  try {
    if (S.sfx && navigator.vibrate) navigator.vibrate(ms);
  } catch (e) {}
}
