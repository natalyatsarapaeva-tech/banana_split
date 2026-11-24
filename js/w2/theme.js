'use strict';
// ================= w2/theme.js : terrain and backgrounds for World 2 =================
// Backgrounds: if the painted strip assets/w2/bgN.jpg exists it is used as a parallax layer
// (like World 1's bg1–bg5); until then a procedural sky-and-sea is drawn.

function w2Background(th, ctx, G, camX, camY) {
  const W = G.viewW, t = G.time;
  if (th.bgKey && ASSETS[th.bgKey] === undefined && !th._bgReq) { th._bgReq = true; loadImage(th.bgKey, th.bgSrc).then(im => { if (!im) ASSETS[th.bgKey] = null; }); }
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H); sky.addColorStop(0, th.sky[0]); sky.addColorStop(1, th.sky[1]);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, VIEW_H);
  const img = th.bgKey && ASSETS[th.bgKey];
  if (img) { parallaxImage(ctx, img, camX, 0.1, -20 - camY * 0.08, VIEW_H * 1.1, W); return; }
  // sun & clouds
  const sx = W * 0.78 - camX * 0.02;
  const sg = ctx.createRadialGradient(sx, 90, 10, sx, 90, 120); sg.addColorStop(0, 'rgba(255,250,210,0.95)'); sg.addColorStop(0.3, 'rgba(255,240,170,0.5)'); sg.addColorStop(1, 'rgba(255,240,170,0)');
  ctx.fillStyle = sg; ctx.fillRect(sx - 130, -40, 260, 260);
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 330 - camX * 0.05 + t * 6) % (W + 400) + W + 400) % (W + 400) - 200, cy = 50 + (i % 3) * 38;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (const [dx, dy, r] of [[0, 0, 26], [28, -10, 30], [58, 0, 24], [26, 8, 26]]) { ctx.beginPath(); ctx.arc(cx + dx, cy + dy, r, 0, TAU); ctx.fill(); }
  }
  // far sea with islands
  const hy = th.horizon - camY * 0.05;
  ctx.fillStyle = th.sea[0]; ctx.fillRect(0, hy, W, VIEW_H - hy);
  const sg2 = ctx.createLinearGradient(0, hy, 0, VIEW_H); sg2.addColorStop(0, th.sea[0]); sg2.addColorStop(1, th.sea[1]); ctx.fillStyle = sg2; ctx.fillRect(0, hy, W, VIEW_H - hy);
  for (let i = 0; i < 4; i++) {
    const ix = ((i * 520 + 180 - camX * 0.08) % (W + 600) + W + 600) % (W + 600) - 300;
    ctx.fillStyle = '#3e9a8a'; ctx.beginPath(); ctx.ellipse(ix, hy + 2, 90 + (i % 2) * 40, 18, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#2e7a6a'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(ix - 30 + k * 30, hy - 14 - (k % 2) * 6, 12, 6, 0, 0, TAU); ctx.fill(); }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2;
  for (let i = 0; i < 18; i++) { const wx = ((i * 137 - camX * 0.15 + t * 10) % (W + 100) + W + 100) % (W + 100) - 50, wy = hy + 14 + (i % 6) * 16; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 10, wy - 4, wx + 20, wy); ctx.stroke(); }
  // a far sailing boat
  const bx = ((W * 0.4 - camX * 0.06 + t * 8) % (W + 200) + W + 200) % (W + 200) - 100;
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(bx, hy - 4); ctx.lineTo(bx, hy - 30); ctx.lineTo(bx + 16, hy - 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5a4a6a'; ctx.fillRect(bx - 10, hy - 4, 26, 4);
}

// ---------- 2-1: Coconut-shavings beach ----------
const THEME_W2_1 = baseTheme({
  id: 'w2-1', world: 2, rim: 'rgba(150,100,40,0.22)', topEdge: '#e8d8b4', drips: false,
  bgKey: 'w2bg1', bgSrc: 'assets/w2/bg1.jpg', horizon: 250, sky: ['#3aa8e8', '#bdeaf8'], sea: ['#38c8d0', '#1e9ab8'],
  waterCol: ['#52d2d8', '#1a7aa8'], waterTint: 'rgba(40,170,200,0.18)',
  breakColors: ['#8a5a2a', '#c8904a', '#f2e6c8'], fallColors: ['#ffffff', '#bff4ff', '#7fd8e8'],
  bodyColor(c, r, d) { return d <= 0 ? '#f2d9a0' : d <= 2 ? '#e8c788' : '#d8b070'; },
  bodyDetail(g, c, r, d, x, y) {
    for (let i = 0; i < 4; i++) { const h = hash2(c * 7 + i, r * 3); g.fillStyle = h < 0.5 ? 'rgba(170,120,60,0.35)' : 'rgba(255,250,230,0.6)'; g.fillRect(x + 4 + hash2(c + i, r) * 30, y + 4 + hash2(c, r + i) * 30, 2.5, 2.5); }
    if (d >= 1 && hash2(c, r * 11) < 0.12) drawShell(g, x + 20, y + 26, 0.7, hash2(c, r) < 0.5 ? '#ffd0c0' : '#fff0d0');
  },
  top() { return '#fffaf0'; },
  surfaceBits(g, c, r, at) { // coconut shavings & tiny shells (the cream ridges from ref-beach.jpg)
    for (let i = 0; i < 6; i++) { const p = at((i + 0.5) / 6); g.save(); g.translate(p.x, p.y + 3 + hash2(c, r * 9 + i) * 6); g.rotate(hash2(c + i, r) * 6); g.fillStyle = i % 2 ? '#f0e4c8' : '#ffffff'; rrect(g, -3.5, -1, 7, 2.2, 1); g.fill(); g.restore(); }
    if (hash2(c, r * 7) < 0.18) { const p = at(0.5); drawShell(g, p.x, p.y + 9, 0.55, '#ffc8b8'); }
  },
  plank(g, x, y, w) { // driftwood plank
    rrect(g, x, y, w, 10, 4); fs(g, '#c8a070', '#7a5a2a', 1.6);
    for (let i = 14; i < w; i += 26) line(g, x + i, y + 2, x + i + 8, y + 8, 'rgba(120,80,30,0.45)', 1.4);
    for (const ex of [x + 6, x + w - 6]) { circ(g, ex, y + 5, 2); fs(g, '#7a5a2a'); }
  },
  special(g, L, c, r, t) { if (t === TL.RIND) { drawRindTile(g, c * T, r * T, c, r); return true; } return false; },
  specialTop(g, L, c, r, t) { return t === TL.RIND; },
  drawBackground(ctx, G, camX, camY) { w2Background(this, ctx, G, camX, camY); },
  decoX(g, d, G) {
    if (d.k === 'palm') { drawPalm(g, d.x, d.y, d.h || 220, d.lean || 0, G ? G.time : 0); return true; }
    if (d.k === 'shell') { drawShell(g, d.x, d.y, d.s || 1, d.c); return true; }
    if (d.k === 'wreck') { // half-buried old boat planks
      g.save(); g.translate(d.x, d.y); g.rotate(-0.15);
      for (let i = 0; i < 4; i++) { rrect(g, -60 + i * 8, -26 + i * 12, 120 - i * 16, 10, 4); fs(g, i % 2 ? '#a8784a' : '#8a5a2a', '#4a2c10', 1.4); }
      g.restore(); return true;
    }
    if (d.k === 'rock') { g.save(); g.translate(d.x, d.y); const s = d.s || 1; g.scale(s, s); g.beginPath(); g.moveTo(-40, 0); g.quadraticCurveTo(-36, -40, 0, -46); g.quadraticCurveTo(40, -38, 44, 0); g.closePath(); fs(g, '#9aa8a8', '#5a6868', 2); ell(g, -10, -30, 12, 6, -0.3); fs(g, 'rgba(255,255,255,0.35)'); g.restore(); return true; }
    return false;
  }
});

// ---------- 2-2: Pineapple jungle ----------
function jungleBackground(th, ctx, G, camX, camY) {
  const W = G.viewW, t = G.time;
  if (th.bgKey && ASSETS[th.bgKey] === undefined && !th._bgReq) { th._bgReq = true; loadImage(th.bgKey, th.bgSrc).then(im => { if (!im) ASSETS[th.bgKey] = null; }); }
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H); sky.addColorStop(0, '#2e6a2a'); sky.addColorStop(1, '#8ac860');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, VIEW_H);
  const img = th.bgKey && ASSETS[th.bgKey];
  if (img) { parallaxImage(ctx, img, camX, 0.1, -20 - camY * 0.08, VIEW_H * 1.1, W); return; }
  const wrap = (x, m) => ((x % m) + m) % m;
  // light rays
  ctx.save(); ctx.globalAlpha = 0.1; ctx.fillStyle = '#fff6c0';
  for (let i = 0; i < 5; i++) { const x = wrap(i * 260 - camX * 0.03, W + 300) - 150; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 60, 0); ctx.lineTo(x + 200, VIEW_H); ctx.lineTo(x + 110, VIEW_H); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  // far giant pineapples
  for (let layer = 0; layer < 2; layer++) {
    const p = layer ? 0.18 : 0.08, sc = layer ? 1 : 0.7, col = layer ? '#5a8a2a' : '#4a7a2a', step = layer ? 420 : 330;
    for (let i = -1; i < W / step + 2; i++) {
      const x = i * step + wrap(-camX * p, step), base = VIEW_H - 40 - camY * p * 0.4 + layer * 30;
      ctx.save(); ctx.translate(x, base); ctx.scale(sc, sc);
      ctx.fillStyle = layer ? '#c8a03a' : '#9a8a3a'; ctx.globalAlpha = layer ? 0.55 : 0.4;
      ctx.beginPath(); ctx.ellipse(0, -110, 70, 100, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = col; for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.35; ctx.beginPath(); ctx.moveTo(-10, -200); ctx.lineTo(Math.cos(a) * 90, -200 + Math.sin(a) * 110); ctx.lineTo(10, -200); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
  // hanging leaves at the top
  for (let i = -1; i < W / 90 + 2; i++) {
    const x = i * 90 + wrap(-camX * 0.3, 90), h = 40 + hash2(i + Math.floor(camX * 0.3 / 90), 7) * 50;
    ctx.fillStyle = i % 2 ? '#2a5a22' : '#356a2a'; ctx.beginPath(); ctx.ellipse(x, h * 0.4 - 20 - camY * 0.05, 34, h, 0, 0, TAU); ctx.fill();
  }
}
const THEME_W2_2 = baseTheme({
  id: 'w2-2', world: 2, rim: 'rgba(30,20,5,0.3)', topEdge: '#2a6a1e', drips: false,
  bgKey: 'w2bg2', bgSrc: 'assets/w2/bg2.jpg',
  waterCol: ['#4ac0a8', '#1a5a5a'], waterTint: 'rgba(40,150,120,0.18)',
  breakColors: ['#f2c040', '#d89a2a', '#6a3a08'], fallColors: ['#9cd47a', '#4a8a2a', '#ffffff'],
  bodyColor(c, r, d) { return d <= 0 ? '#6a5430' : d <= 2 ? '#5a4626' : '#4a3a1e'; },
  bodyDetail(g, c, r, d, x, y) {
    for (let i = 0; i < 3; i++) { const h = hash2(c * 7 + i, r * 3); g.fillStyle = h < 0.5 ? 'rgba(30,20,5,0.35)' : 'rgba(160,130,80,0.35)'; g.fillRect(x + 4 + hash2(c + i, r) * 30, y + 4 + hash2(c, r + i) * 30, 3, 3); }
    if (hash2(c, r * 13) < 0.15) { g.strokeStyle = 'rgba(120,90,40,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 6, y + 8); g.quadraticCurveTo(x + 20, y + 22, x + 34, y + 16); g.stroke(); }
  },
  top(c) { return hash2(c, 3) < 0.5 ? '#4caf3a' : '#45a336'; },
  surfaceBits(g, c, r, at) { // moss with leaves and passion-fruit flowers
    for (let i = 0; i < 4; i++) { const p = at((i + 0.5) / 4); g.save(); g.translate(p.x, p.y - 1); g.rotate(-0.6 + hash2(c + i, r) * 1.2); g.beginPath(); g.ellipse(0, -4, 3.5, 8, 0, 0, TAU); g.fillStyle = i % 2 ? '#3a9a2a' : '#5ac042'; g.fill(); g.restore(); }
    if (hash2(c, r * 5) < 0.12) { const p = at(0.5); g.save(); g.translate(p.x, p.y - 2); for (let k = 0; k < 5; k++) { g.rotate(TAU / 5); g.beginPath(); g.ellipse(0, -5, 2.6, 5, 0, 0, TAU); g.fillStyle = '#b05ac8'; g.fill(); } circ(g, 0, 0, 3); fs(g, '#ffd447'); g.restore(); }
  },
  plank(g, x, y, w) { // mossy branch
    rrect(g, x - 2, y, w + 4, 12, 6); fs(g, '#7a5a2a', '#3a2a10', 1.6);
    g.fillStyle = '#4caf3a'; for (let i = 0; i < w; i += 14) { g.beginPath(); g.ellipse(x + i + 6, y + 1, 7, 3.5, 0, 0, TAU); g.fill(); }
    for (let i = 20; i < w; i += 40) { line(g, x + i, y + 6, x + i + 10, y + 7, 'rgba(40,25,5,0.5)', 1.4); }
  },
  special(g, L, c, r, t) { if (t === TL.RIND) { drawPineRindTile(g, c * T, r * T, c, r); return true; } return false; },
  specialTop(g, L, c, r, t) { return t === TL.RIND; },
  drawBackground(ctx, G, camX, camY) { jungleBackground(this, ctx, G, camX, camY); },
  decoX(g, d, G) {
    if (d.k === 'bigpine') { // giant pineapple (the island landmark)
      g.save(); g.translate(d.x, d.y); const s = d.s || 1; g.scale(s, s);
      ell(g, 0, -90, 62, 90); const gr = g.createLinearGradient(-60, 0, 60, 0); gr.addColorStop(0, '#c88a1a'); gr.addColorStop(0.5, '#ffd84a'); gr.addColorStop(1, '#b8781a'); fs(g, gr, '#6a4a08', 2.5);
      g.save(); ell(g, 0, -90, 62, 90); g.clip(); g.strokeStyle = 'rgba(120,70,5,0.55)'; g.lineWidth = 2;
      for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(i * 22 - 80, -190); g.lineTo(i * 22 + 80, 10); g.moveTo(i * 22 + 80, -190); g.lineTo(i * 22 - 80, 10); g.stroke(); }
      g.restore();
      for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.3; g.beginPath(); g.moveTo(-12, -176); g.lineTo(Math.cos(a) * 80, -176 + Math.sin(a) * 100); g.lineTo(12, -176); g.closePath(); fs(g, k % 2 ? '#3a9a3a' : '#2e8030', '#1a4a1a', 1.5); }
      g.restore(); return true;
    }
    if (d.k === 'fern') { g.save(); g.translate(d.x, d.y); const s = d.s || 1; g.scale(s, s); for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.32; g.save(); g.rotate(a + Math.PI / 2); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-14, -40, 0, -70); g.quadraticCurveTo(14, -40, 0, 0); g.closePath(); fs(g, k % 2 ? '#3a9a2a' : '#4cb83a', '#1a5a1a', 1.2); g.restore(); } g.restore(); return true; }
    if (d.k === 'flower') { g.save(); g.translate(d.x, d.y); for (let k = 0; k < 6; k++) { g.rotate(TAU / 6); g.beginPath(); g.ellipse(0, -10, 5, 10, 0, 0, TAU); fs(g, '#b05ac8', '#6a2a8a', 1); } circ(g, 0, 0, 7); fs(g, '#f2c040', '#8a5a10', 1); g.restore(); return true; }
    if (d.k === 'tent') { // pirate tent in the camp
      g.save(); g.translate(d.x, d.y);
      g.beginPath(); g.moveTo(-70, 0); g.lineTo(0, -110); g.lineTo(70, 0); g.closePath(); fs(g, '#e8dcc0', '#8a7a5a', 2);
      g.save(); g.clip(); for (let i = -4; i <= 4; i++) { g.fillStyle = i % 2 ? '#e2363c' : '#e8dcc0'; g.fillRect(i * 18, -120, 9, 130); } g.restore();
      g.beginPath(); g.moveTo(-14, 0); g.lineTo(0, -50); g.lineTo(14, 0); g.closePath(); fs(g, '#3a2a1a');
      line(g, 0, -110, 0, -150, '#5a3414', 3); g.beginPath(); g.moveTo(0, -150); g.lineTo(30, -142); g.lineTo(0, -132); g.closePath(); fs(g, '#1a1a1a');
      g.restore(); return true;
    }
    if (d.k === 'sign') return false;
    return THEME_W2_1.decoX(g, d, G);
  }
});

// ---------- 2-3: Watermelon reef (fully under water) ----------
const THEME_W2_3 = baseTheme({
  id: 'w2-3', world: 2, rim: 'rgba(120,20,40,0.3)', topEdge: '#2e7a26', drips: false,
  bgKey: 'w2bg3', bgSrc: 'assets/w2/bg3.jpg',
  // the painted reef must show through the water, so the water is only a tint here
  waterCol: ['rgba(40,150,190,0.18)', 'rgba(10,60,110,0.42)'], waterTint: 'rgba(30,130,170,0.12)',
  breakColors: ['#e8a0c8', '#f2b8d8', '#ffffff'], fallColors: ['#ffffff', '#bff4ff'],
  bodyColor(c, r, d) { return d <= 0 ? '#f06a7a' : d <= 2 ? '#e05a6c' : '#c84a5c'; },
  bodyDetail(g, c, r, d, x, y) {
    for (let i = 0; i < 3; i++) { const h = hash2(c * 7 + i, r * 3); if (h < 0.7) { g.save(); g.translate(x + 6 + hash2(c + i, r) * 28, y + 6 + hash2(c, r + i) * 28); g.rotate(h * 3); ell(g, 0, 0, 2.2, 3.6); fs(g, '#2a1a1a'); g.restore(); } }
  },
  top() { return '#f2fff0'; }, // the rind: white band with a green edge
  surfaceBits(g, c, r, at) { const p0 = at(0), p1 = at(1); g.fillStyle = '#5fbf45'; g.fillRect(p0.x, p0.y - 4, p1.x - p0.x, 4); },
  plank(g, x, y, w) { rrect(g, x, y, w, 12, 5); fs(g, '#f06a7a', '#8a2a3a', 1.5); g.fillStyle = '#5fbf45'; g.fillRect(x + 2, y, w - 4, 3); for (let i = 10; i < w; i += 18) { ell(g, x + i, y + 7, 1.6, 2.6); fs(g, '#2a1a1a'); } },
  special(g, L, c, r, t) { // RIND here is a clam shell
    if (t !== TL.RIND) return false;
    const x = c * T, y = r * T;
    rrect(g, x + 1, y + 1, T - 2, T - 2, 10); fs(g, '#f2b8d8', '#8a3a6a', 1.8);
    for (let i = -2; i <= 2; i++) line(g, x + 20, y + 36, x + 20 + i * 8, y + 6, 'rgba(138,58,106,0.5)', 1.3);
    return true;
  },
  specialTop(g, L, c, r, t) { return t === TL.RIND; },
  drawBackground(ctx, G, camX, camY) {
    const W = G.viewW, th = this;
    if (ASSETS[th.bgKey] === undefined && !th._bgReq) { th._bgReq = true; loadImage(th.bgKey, th.bgSrc).then(im => { if (!im) ASSETS[th.bgKey] = null; }); }
    const gr = ctx.createLinearGradient(0, 0, 0, VIEW_H); gr.addColorStop(0, '#1a8aa8'); gr.addColorStop(1, '#0a3a5a'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, VIEW_H);
    if (ASSETS[th.bgKey]) parallaxImage(ctx, ASSETS[th.bgKey], camX, 0.12, -30 - camY * 0.1, VIEW_H * 1.15, W);
  },
  decoX(g, d, G) {
    const t = G ? G.time : 0;
    if (d.k === 'weed') { drawGummyWeed(g, d.x, d.y, d.h || 90, t, d.c || 0); return true; }
    if (d.k === 'coral') { drawCoral(g, d.x, d.y, d.s || 1, d.c); return true; }
    if (d.k === 'clam') { drawClam(g, d.x, d.y, { open: 0.7 }); return true; }
    if (d.k === 'boat') { drawBoat(g, d.x, d.y, { t, sail: true }); return true; }
    if (d.k === 'sign') return false;
    return false;
  }
});
