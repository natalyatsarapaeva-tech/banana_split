'use strict';
// ================= core.js : utils, save, input, audio =================
const T = 40;            // tile size (logical px)
const VIEW_H = 540;      // logical view height
const DT = 1 / 60;       // fixed physics step
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const sign = v => (v < 0 ? -1 : v > 0 ? 1 : 0);
const rnd = (a, b) => a + Math.random() * (b - a);
const rndi = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function hash2(x, y) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function approach(v, target, d) { return v < target ? Math.min(v + d, target) : Math.max(v - d, target); }
const IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

// ---------------- Save ----------------
const Save = {
  key: 'banni-split-v1',
  data: null,
  defaults() {
    return {
      unlocked: 1, done: {}, cherries: { 1: [0, 0, 0], 2: [0, 0, 0], 3: [0, 0, 0], 4: [0, 0, 0], 5: [0, 0, 0] }, notes: {}, sheep: {}, best: {},
      wallJump: false, introSeen: false, world: 0, crunch: false, worldIntro: {},
      settings: { music: 0.6, sfx: 0.8, easy: false, touch: 'auto', hints: true, notes: true }
    };
  },
  load() {
    const d = this.defaults();
    try {
      const s = localStorage.getItem(this.key);
      const p = s ? JSON.parse(s) : {};
      this.data = Object.assign(d, p);
      this.data.settings = Object.assign(this.defaults().settings, p.settings || {});
      this.data.cherries = Object.assign(this.defaults().cherries, p.cherries || {});
    } catch (e) { this.data = d; }
  },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* storage unavailable */ } },
  reset() { const s = this.data.settings; this.data = this.defaults(); this.data.settings = s; this.save(); }
};

// ---------------- Input ----------------
const KEYMAP = {
  left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
  jump: ['Space', 'KeyZ', 'ArrowUp', 'KeyW'], jumpBtn: ['Space', 'KeyZ'],
  fire: ['KeyX', 'KeyJ', 'ShiftLeft', 'ShiftRight'], pickle: ['KeyC', 'KeyK'], swap: ['KeyV', 'KeyQ'],
  pause: ['Escape', 'KeyP'], confirm: ['Enter', 'Space', 'KeyZ', 'NumpadEnter'], back: ['Escape', 'Backspace'],
  skip: ['Enter', 'NumpadEnter']
};
const ACTIONS = Object.keys(KEYMAP);
const Input = {
  keys: Object.create(null), latch: Object.create(null),
  touch: Object.create(null), padState: Object.create(null),
  cur: Object.create(null), prev: Object.create(null),
  lastDevice: IS_TOUCH ? 'touch' : 'kbd',
  init() {
    window.addEventListener('keydown', e => {
      if (e.code === 'Tab') return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (!this.keys[e.code]) this.latch[e.code] = true;
      this.keys[e.code] = true; this.lastDevice = 'kbd';
      Audio2.unlock();
    }, { passive: false });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => { this.keys = Object.create(null); for (const k in this.touch) this.touch[k] = false; });
  },
  rawHeld(a) {
    for (const c of KEYMAP[a]) if (this.keys[c] || this.latch[c]) return true;
    if (this.touch[a] || this.padState[a] || this.latch['touch:' + a]) return true;
    if (a === 'jumpBtn' && (this.touch.jump || this.padState.jump || this.latch['touch:jump'])) return true;
    if (a === 'confirm' && (this.padState.jump)) return true;
    return false;
  },
  pollPad() {
    const ps = this.padState; for (const k in ps) ps[k] = false;
    let pads = [];
    try { pads = navigator.getGamepads ? navigator.getGamepads() : []; } catch (e) { pads = []; }
    for (const p of pads) {
      if (!p || !p.connected) continue;
      const b = i => p.buttons[i] && p.buttons[i].pressed;
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      const any = b(0) || b(1) || b(2) || b(3) || b(9) || b(12) || b(13) || b(14) || b(15) || Math.abs(ax) > 0.5 || Math.abs(ay) > 0.5;
      if (any) this.lastDevice = 'pad';
      ps.left = ps.left || b(14) || ax < -0.4; ps.right = ps.right || b(15) || ax > 0.4;
      ps.up = ps.up || b(12) || ay < -0.6; ps.down = ps.down || b(13) || ay > 0.6;
      ps.jump = ps.jump || b(0); ps.fire = ps.fire || b(2) || b(1); ps.pickle = ps.pickle || b(3);
      ps.pause = ps.pause || b(9); ps.skip = ps.skip || b(8); ps.back = ps.back || b(1); ps.swap = ps.swap || b(5) || b(4);
    }
  },
  // call once per fixed step
  update() {
    this.pollPad();
    for (const a of ACTIONS) { this.prev[a] = this.cur[a]; this.cur[a] = this.rawHeld(a); }
    this.latch = Object.create(null);
  },
  held(a) { return !!this.cur[a]; },
  pressed(a) { return !!this.cur[a] && !this.prev[a]; },
  clear() { for (const a of ACTIONS) { this.prev[a] = true; } this.latch = Object.create(null); },
  label(kind) {
    const d = this.lastDevice;
    const L = {
      move: d === 'touch' ? '◀ ▶' : d === 'pad' ? 'крестовина' : '← →',
      jump: d === 'touch' ? '⤒' : d === 'pad' ? 'A' : 'ПРОБЕЛ',
      down: d === 'touch' ? '▼' : d === 'pad' ? '↓' : '↓',
      fire: d === 'touch' ? '🍒' : d === 'pad' ? 'X' : 'X',
      pickle: d === 'touch' ? '🥒' : d === 'pad' ? 'Y' : 'C',
      swap: d === 'touch' ? '⇄' : d === 'pad' ? 'RB' : 'V',
      skip: d === 'touch' ? 'Коснись, чтобы закрыть' : d === 'pad' ? 'Select — закрыть' : 'Enter — закрыть'
    };
    return L[kind] || kind;
  }
};

// ---------------- Audio ----------------
const Audio2 = {
  ctx: null, master: null, musicGain: null, sfxGain: null, lp: null,
  buffer: null, src: null, el: null, rate: 1, started: false, loadState: 'none', noise: null,
  init() {
    if (this.ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
      this.lp = this.ctx.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 20000;
      this.musicGain = this.ctx.createGain(); this.musicGain.connect(this.lp); this.lp.connect(this.master);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.connect(this.master);
      const len = this.ctx.sampleRate * 1;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.applyVolumes();
      return true;
    } catch (e) { this.ctx = null; return false; }
  },
  unlock() {
    if (!this.init()) { this.fallbackMusic(); return; }
    if (this.ctx.state === 'suspended') { try { this.ctx.resume(); } catch (e) { } }
    if (this.loadState === 'none') this.loadMusic();
  },
  applyVolumes() {
    const s = Save.data.settings;
    if (this.musicGain) this.musicGain.gain.value = s.music * 0.75;
    if (this.sfxGain) this.sfxGain.gain.value = s.sfx * 0.6;
    if (this.el) this.el.volume = clamp(s.music * 0.75, 0, 1);
  },
  loadMusic() {
    this.loadState = 'loading';
    fetch('assets/music.mp3').then(r => { if (!r.ok) throw new Error('http ' + r.status); return r.arrayBuffer(); })
      .then(ab => new Promise((res, rej) => { const p = this.ctx.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); }))
      .then(buf => { this.buffer = buf; this.loadState = 'ready'; if (this.wantMusic) this.startMusic(); })
      .catch(() => { this.loadState = 'failed'; this.fallbackMusic(); });
  },
  fallbackMusic() {
    if (this.el) return;
    try {
      this.el = new Audio('assets/music.mp3'); this.el.loop = true; this.applyVolumes();
      if (this.wantMusic) { const p = this.el.play(); if (p && p.catch) p.catch(() => { }); }
    } catch (e) { this.el = null; }
  },
  wantMusic: false,
  // stop the theme (worlds without music)
  silence() {
    this.wantMusic = false;
    if (this.src) { try { this.src.stop(); } catch (e) { } this.src = null; }
    if (this.el) { try { this.el.pause(); } catch (e) { } }
  },
  music(rate) {
    this.wantMusic = true;
    if (rate) this.setRate(rate);
    if (this.buffer && !this.src) this.startMusic();
    if (this.el && this.el.paused) { const p = this.el.play(); if (p && p.catch) p.catch(() => { }); }
  },
  startMusic() {
    if (!this.ctx || !this.buffer || this.src) return;
    const s = this.ctx.createBufferSource(); s.buffer = this.buffer; s.loop = true;
    s.playbackRate.value = this.rate; s.connect(this.musicGain); s.start(0); this.src = s;
  },
  setRate(r) {
    this.rate = r;
    if (this.src) { try { this.src.playbackRate.setTargetAtTime(r, this.ctx.currentTime, 0.4); } catch (e) { this.src.playbackRate.value = r; } }
    if (this.el) { try { this.el.playbackRate = r; } catch (e) { } }
  },
  toneF: 20000,
  setTone(f) { this.toneF = f || 20000; if (this.lp && !this.muffled) { try { this.lp.frequency.setTargetAtTime(this.toneF, this.ctx.currentTime, 0.3); } catch (e) { } } },
  muffle(on) {
    this.muffled = on;
    if (this.lp) { try { this.lp.frequency.setTargetAtTime(on ? 700 : this.toneF, this.ctx.currentTime, 0.08); } catch (e) { } }
    if (this.el) this.el.volume = clamp(Save.data.settings.music * (on ? 0.3 : 0.75), 0, 1);
  },
  muffleOld(on) {
    if (this.lp) { try { this.lp.frequency.setTargetAtTime(on ? 700 : 20000, this.ctx.currentTime, 0.08); } catch (e) { } }
    if (this.el) this.el.volume = clamp(Save.data.settings.music * (on ? 0.3 : 0.75), 0, 1);
  },
  // ---- synth helpers ----
  tone(o) {
    const c = this.ctx; if (!c || c.state !== 'running') return;
    const t0 = c.currentTime + (o.delay || 0), dur = o.dur || 0.15;
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.f0, t0);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t0 + dur);
    if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vib; lg.gain.value = o.vibAmt || 30; l.connect(lg); lg.connect(osc.frequency); l.start(t0); l.stop(t0 + dur + 0.05); }
    const v = (o.vol || 0.2);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + (o.att || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(this.sfxGain); osc.start(t0); osc.stop(t0 + dur + 0.05);
  },
  noiseHit(o) {
    const c = this.ctx; if (!c || c.state !== 'running') return;
    const t0 = c.currentTime + (o.delay || 0), dur = o.dur || 0.1;
    const s = c.createBufferSource(); s.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = o.ft || 'bandpass'; f.frequency.setValueAtTime(o.f0 || 1500, t0);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t0 + dur);
    f.Q.value = o.q || 1;
    const g = c.createGain(); g.gain.setValueAtTime(o.vol || 0.3, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(this.sfxGain); s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.02);
  },
  notes(list, o) { list.forEach((f, i) => this.tone(Object.assign({ f0: f, dur: 0.12, delay: i * (o.step || 0.07) }, o))); },
  play(name) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const S = this;
    switch (name) {
      case 'jump': S.tone({ type: 'square', f0: 330, f1: 720, dur: 0.13, vol: 0.09 }); break;
      case 'stomp': S.tone({ type: 'sine', f0: 700, f1: 110, dur: 0.12, vol: 0.35 }); S.noiseHit({ f0: 2200, dur: 0.05, vol: 0.25 }); break;
      case 'drop': S.tone({ type: 'triangle', f0: 1320, dur: 0.06, vol: 0.18 }); S.tone({ type: 'triangle', f0: 1760, dur: 0.12, vol: 0.18, delay: 0.05 }); break;
      case 'cherry': S.notes([784, 988, 1175, 1568, 1976], { type: 'triangle', vol: 0.2, step: 0.06, dur: 0.18 }); break;
      case 'power': S.notes([523, 659, 784, 1046, 1318, 1568], { type: 'square', vol: 0.07, step: 0.05, dur: 0.12 }); break;
      case 'hurt': S.tone({ type: 'sawtooth', f0: 520, f1: 130, dur: 0.32, vol: 0.12 }); break;
      case 'crack': S.noiseHit({ f0: 3000, dur: 0.15, vol: 0.3, ft: 'highpass' }); S.tone({ type: 'triangle', f0: 900, f1: 300, dur: 0.15, vol: 0.12 }); break;
      case 'die': S.notes([660, 520, 440, 330, 262], { type: 'square', vol: 0.08, step: 0.12, dur: 0.16 }); break;
      case 'shoot': S.tone({ type: 'square', f0: 900, f1: 260, dur: 0.09, vol: 0.08 }); break;
      case 'freeze': S.notes([1568, 2093, 2637], { type: 'sine', vol: 0.12, step: 0.04, dur: 0.2 }); S.noiseHit({ f0: 6000, dur: 0.2, vol: 0.12, ft: 'highpass' }); break;
      case 'boing': S.tone({ type: 'sine', f0: 180, f1: 620, dur: 0.28, vol: 0.28, vib: 18, vibAmt: 40 }); break;
      case 'break': S.noiseHit({ f0: 900, f1: 200, dur: 0.22, vol: 0.4, ft: 'lowpass' }); break;
      case 'check': S.notes([1046, 1318, 1568, 2093], { type: 'sine', vol: 0.18, step: 0.08, dur: 0.3 }); break;
      case 'oneup': S.notes([659, 784, 1318, 1046, 1175, 1568], { type: 'square', vol: 0.07, step: 0.08, dur: 0.12 }); break;
      case 'bossHit': S.tone({ type: 'square', f0: 260, f1: 60, dur: 0.3, vol: 0.18 }); S.noiseHit({ f0: 500, dur: 0.25, vol: 0.4, ft: 'lowpass' }); break;
      case 'thud': S.tone({ type: 'sine', f0: 120, f1: 40, dur: 0.35, vol: 0.5 }); S.noiseHit({ f0: 300, dur: 0.2, vol: 0.4, ft: 'lowpass' }); break;
      case 'slide': S.noiseHit({ f0: 800, f1: 3000, dur: 0.25, vol: 0.15 }); break;
      case 'crunch': for (let i = 0; i < 3; i++) S.noiseHit({ f0: 2500 + i * 600, dur: 0.04, vol: 0.35, delay: i * 0.045, ft: 'highpass' }); break;
      case 'throw': S.tone({ type: 'triangle', f0: 300, f1: 900, dur: 0.18, vol: 0.12 }); break;
      case 'note': S.notes([880, 1109, 1319, 1760], { type: 'sine', vol: 0.15, step: 0.1, dur: 0.4 }); break;
      case 'grab': S.tone({ type: 'triangle', f0: 400, f1: 250, dur: 0.08, vol: 0.15 }); break;
      case 'bump': S.tone({ type: 'square', f0: 160, f1: 90, dur: 0.08, vol: 0.12 }); break;
      case 'pop': S.tone({ type: 'sine', f0: 400, f1: 900, dur: 0.1, vol: 0.15 }); break;
      case 'pea': S.tone({ type: 'square', f0: 600, f1: 300, dur: 0.06, vol: 0.06 }); break;
      case 'tears': S.tone({ type: 'triangle', f0: 500, f1: 300, dur: 0.4, vol: 0.12, vib: 9, vibAmt: 60 }); break;
      case 'melt': S.tone({ type: 'sine', f0: 300, f1: 200, dur: 0.2, vol: 0.06, vib: 12, vibAmt: 20 }); break;
      case 'gate': S.tone({ type: 'square', f0: 90, f1: 70, dur: 0.5, vol: 0.12 }); S.noiseHit({ f0: 200, dur: 0.4, vol: 0.3, ft: 'lowpass' }); break;
      case 'sheep': S.tone({ type: 'sawtooth', f0: 520, f1: 470, dur: 0.35, vol: 0.06, vib: 28, vibAmt: 40 }); break;
      case 'ice': S.notes([1760, 2349], { type: 'sine', vol: 0.14, step: 0.05, dur: 0.15 }); break;
      case 'select': S.tone({ type: 'triangle', f0: 880, dur: 0.06, vol: 0.12 }); break;
      case 'win': S.notes([523, 659, 784, 1046, 784, 1046, 1318], { type: 'square', vol: 0.08, step: 0.11, dur: 0.18 }); break;
      case 'drip': S.tone({ type: 'sine', f0: 1200, f1: 500, dur: 0.08, vol: 0.06 }); break;
      case 'roar': S.tone({ type: 'sawtooth', f0: 110, f1: 70, dur: 0.6, vol: 0.12, vib: 14, vibAmt: 25 }); break;
      case 'jump2': S.tone({ type: 'square', f0: 520, f1: 1180, dur: 0.14, vol: 0.08 }); S.noiseHit({ f0: 5000, dur: 0.08, vol: 0.08, ft: 'highpass' }); break;
      case 'splash': S.noiseHit({ f0: 700, f1: 200, dur: 0.3, vol: 0.35, ft: 'lowpass' }); S.tone({ type: 'sine', f0: 300, f1: 120, dur: 0.2, vol: 0.12 }); break;
      case 'bubble': S.tone({ type: 'sine', f0: 500 + Math.random() * 400, f1: 1200, dur: 0.07, vol: 0.06 }); break;
      case 'pound': S.tone({ type: 'sine', f0: 160, f1: 40, dur: 0.4, vol: 0.5 }); S.noiseHit({ f0: 400, dur: 0.3, vol: 0.45, ft: 'lowpass' }); break;
      case 'swap': S.notes([660, 990, 1320], { type: 'triangle', vol: 0.14, step: 0.05, dur: 0.12 }); break;
      case 'cannon': S.tone({ type: 'sine', f0: 220, f1: 60, dur: 0.18, vol: 0.3 }); S.noiseHit({ f0: 1200, f1: 300, dur: 0.12, vol: 0.25 }); break;
      case 'clink': S.tone({ type: 'triangle', f0: 1800, f1: 1400, dur: 0.1, vol: 0.12 }); break;
      case 'steam': S.noiseHit({ f0: 4000, f1: 2000, dur: 0.5, vol: 0.18, ft: 'highpass' }); break;
      case 'geyser': S.noiseHit({ f0: 300, f1: 900, dur: 0.6, vol: 0.3, ft: 'lowpass' }); break;
      case 'chop': S.tone({ type: 'square', f0: 140, f1: 70, dur: 0.12, vol: 0.18 }); S.noiseHit({ f0: 2500, dur: 0.06, vol: 0.2, ft: 'highpass' }); break;
      case 'wind': S.noiseHit({ f0: 500, f1: 1400, dur: 1.2, vol: 0.12, q: 0.7 }); break;
      case 'boost': S.tone({ type: 'sawtooth', f0: 300, f1: 1400, dur: 0.3, vol: 0.08 }); S.notes([1320, 1760], { type: 'triangle', vol: 0.1, step: 0.05, dur: 0.1 }); break;
      case 'ghost': S.tone({ type: 'sine', f0: 300, f1: 600, dur: 0.6, vol: 0.12, vib: 6, vibAmt: 80 }); break;
    }
  }
};
