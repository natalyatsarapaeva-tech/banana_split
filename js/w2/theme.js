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
