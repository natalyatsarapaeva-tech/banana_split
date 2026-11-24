'use strict';
// ================= w2/art.js : procedural art for World 2 (palette from assets/w2/ref-*.jpg) =================

// ---------- enemies ----------
function drawCrab(g, x, y, o) { // Crab-Caper: dark green caper body, x,y = bottom center
  g.save(); g.translate(x, y);
  const t = o.t || 0, k = Math.sin(t * 14);
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { // legs
    const lx = s * (8 + i * 5), kk = (i % 2 ? k : -k) * 2;
    g.beginPath(); g.moveTo(lx * 0.7, -9); g.lineTo(lx + s * 5, -12 + kk); g.lineTo(lx + s * 8, -1); g.strokeStyle = '#1e3a1a'; g.lineWidth = 2.4; g.lineCap = 'round'; g.stroke();
  }
  const sn = o.snap ? Math.abs(Math.sin(t * 18)) * 0.6 : 0.15;
  for (const s of [-1, 1]) { // claws
    g.save(); g.translate(s * 15, -16); g.rotate(s * -0.4);
    line(g, 0, 4, s * 4, -2, '#1e3a1a', 3);
    g.translate(s * 5, -5);
    g.beginPath(); g.ellipse(0, 0, 6.5, 5, 0, 0, TAU); fs(g, '#3f6e2c', '#14280f', 1.6);
    g.save(); g.rotate(s * sn); g.beginPath(); g.moveTo(0, -1); g.lineTo(s * 9, -6); g.lineTo(s * 8, -1); g.closePath(); fs(g, '#4c8236', '#14280f', 1.3); g.restore();
    g.restore();
  }
  ell(g, 0, -11, 15, 10); // body
  const gr = g.createRadialGradient(-4, -15, 2, 0, -11, 16); gr.addColorStop(0, '#6aa04a'); gr.addColorStop(1, '#2e5a22'); fs(g, gr, '#14280f', 2);
  for (const [bx, by] of [[-7, -14], [5, -16], [0, -8], [8, -9]]) { circ(g, bx, by, 1.4); fs(g, '#8cc06a'); }
  for (const s of [-1, 1]) { line(g, s * 4, -19, s * 5, -25, '#14280f', 2); circ(g, s * 5, -26, 3.4); fs(g, '#ffffff', '#14280f', 1.3); circ(g, s * 5 + (o.snap ? 0 : 0.8), -26, 1.5); fs(g, '#111'); }
  g.beginPath(); g.arc(0, -10, 4, 0.3, Math.PI - 0.3); g.strokeStyle = '#14280f'; g.lineWidth = 1.6; g.stroke();
  g.restore();
}
function drawAnchovy(g, x, y, o) { // silver leaping fish, x,y = center
  g.save(); g.translate(x, y); g.scale(o.face || 1, 1); g.rotate(clamp(o.ang || 0, -1.2, 1.2) * (o.face || 1));
  const w = Math.sin((o.t || 0) * 20) * 0.25;
  g.save(); g.translate(-15, 0); g.rotate(w); g.beginPath(); g.moveTo(0, 0); g.lineTo(-11, -8); g.lineTo(-8, 0); g.lineTo(-11, 8); g.closePath(); fs(g, '#9ab0c4', '#3a4e64', 1.4); g.restore();
  g.beginPath(); g.moveTo(-16, 0); g.quadraticCurveTo(-4, -10, 12, -4); g.quadraticCurveTo(19, 0, 12, 4); g.quadraticCurveTo(-4, 9, -16, 0); g.closePath();
  const gr = g.createLinearGradient(0, -9, 0, 8); gr.addColorStop(0, '#5a7890'); gr.addColorStop(0.45, '#dfe8f0'); gr.addColorStop(1, '#ffffff'); fs(g, gr, '#3a4e64', 1.6);
  line(g, -12, 0, 10, -1, 'rgba(120,150,180,0.7)', 1.4);
  g.beginPath(); g.moveTo(-2, -7); g.lineTo(3, -12); g.lineTo(6, -6); g.closePath(); fs(g, '#7a92a8');
  circ(g, 9, -2, 2.6); fs(g, '#ffffff', '#3a4e64', 1); circ(g, 9.6, -2, 1.2); fs(g, '#111');
  g.restore();
}

// ---------- objects ----------
function drawBarrel(g, x, y, o) { // x,y = bottom center, 40x46
  g.save(); g.translate(x, y);
  g.beginPath(); g.moveTo(-17, 0); g.quadraticCurveTo(-23, -23, -17, -46); g.lineTo(17, -46); g.quadraticCurveTo(23, -23, 17, 0); g.closePath();
  const gr = g.createLinearGradient(-20, 0, 20, 0); gr.addColorStop(0, '#6a3e18'); gr.addColorStop(0.45, '#b77a3c'); gr.addColorStop(1, '#5a3414'); fs(g, gr, '#3a200a', 2);
  for (const bx of [-9, 0, 9]) line(g, bx, -44, bx * 1.05, -2, 'rgba(58,32,10,0.45)', 1.4);
  for (const by of [-8, -38]) { g.beginPath(); g.moveTo(-19, by); g.quadraticCurveTo(0, by + 3, 19, by); g.strokeStyle = '#8a8e96'; g.lineWidth = 4; g.stroke(); g.strokeStyle = '#c8ccd4'; g.lineWidth = 1.2; g.stroke(); }
  // a little cucumber stamp: "pickles"
  ell(g, 0, -23, 5, 8, 0.3); fs(g, '#5fa843', '#244d18', 1.2);
  g.restore();
}
function drawPickleKid(g, x, y, o) { // tiny cucumber; x,y = feet
  g.save(); g.translate(x, y);
  const b = o.happy ? Math.abs(Math.sin((o.t || 0) * 10)) * 3 : 0;
  g.translate(0, -b);
  rrect(g, -7, -24, 14, 24, 7); fs(g, '#5fa843', '#244d18', 1.6);
  for (const [bx, by] of [[-3, -19], [3, -14], [-2, -7], [4, -5]]) { circ(g, bx, by, 1); fs(g, '#9cd47a'); }
  circ(g, -2.5, -17, 2.2); fs(g, '#fff', '#1d3a12', 0.8); circ(g, 2.5, -17, 2.2); fs(g, '#fff', '#1d3a12', 0.8);
  circ(g, -2.2, -16.6, 1); fs(g, '#111'); circ(g, 2.8, -16.6, 1); fs(g, '#111');
  g.beginPath(); g.arc(0, -12, 2.4, 0.2, Math.PI - 0.2); g.strokeStyle = '#1d3a12'; g.lineWidth = 1.2; g.stroke();
  if (o.happy) { line(g, -7, -14, -12, -22, '#2b5a1e', 1.8); line(g, 7, -14, 12, -22, '#2b5a1e', 1.8); }
  g.restore();
}
function drawJarKid(g, x, y, o) { // glass jar with brine and a little cucumber; x,y = bottom center
  g.save(); g.translate(x, y);
  if (o.open) { // shards
    for (let i = 0; i < 5; i++) { g.save(); g.translate(-14 + i * 7, -3); g.rotate(i * 1.3); g.beginPath(); g.moveTo(0, 0); g.lineTo(6, -2); g.lineTo(3, 4); g.closePath(); fs(g, 'rgba(220,245,255,0.8)', 'rgba(120,170,190,0.8)', 1); g.restore(); }
    g.restore(); return;
  }
  rrect(g, -17, -40, 34, 40, 8); fs(g, 'rgba(210,240,250,0.35)');
  g.save(); rrect(g, -17, -40, 34, 40, 8); g.clip(); g.fillStyle = 'rgba(190,220,120,0.45)'; g.fillRect(-17, -26 + Math.sin((o.t || 0) * 2) * 1.5, 34, 30); g.restore();
  drawPickleKid(g, 0, -4, { t: o.t });
  for (const [dx, dy] of [[-8, -30], [9, -12], [-10, -14]]) { ell(g, dx, dy, 3, 1.5, 0.6); fs(g, '#4a8a2a'); }
  rrect(g, -17, -40, 34, 40, 8); g.strokeStyle = 'rgba(120,170,190,0.9)'; g.lineWidth = 2; g.stroke();
  line(g, -11, -34, -11, -10, 'rgba(255,255,255,0.7)', 2.5);
  rrect(g, -15, -47, 30, 9, 3); fs(g, '#c8a040', '#7a5a14', 1.5);
  g.restore();
}
function drawUmbrellaFlag(g, x, y, o) { // cocktail umbrella checkpoint stuck in the sand
  g.save(); g.translate(x, y);
  ell(g, 0, 0, 16, 4); fs(g, 'rgba(120,90,40,0.25)');
  line(g, 0, 0, 0, -96, '#c89a5a', 4); line(g, 0, -2, 0, -96, '#f2d6a0', 1.4);
  const open = o.active ? 1 : 0.35, w = 22 + 30 * open, t = o.t || 0;
  g.save(); g.translate(0, -96); g.rotate(Math.sin(t * 1.6) * 0.06);
  const cols = ['#ff6fa8', '#ffd447', '#6fd3ff', '#8be07a', '#ff8c5a'];
  for (let i = 0; i < 5; i++) {
    const a0 = Math.PI + (i / 5) * Math.PI, a1 = Math.PI + ((i + 1) / 5) * Math.PI;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a0) * w, Math.sin(a0) * w * 0.55); g.lineTo(Math.cos(a1) * w, Math.sin(a1) * w * 0.55); g.closePath(); fs(g, cols[i], 'rgba(90,40,30,0.5)', 1.2);
  }
  circ(g, 0, -w * 0.55 + 2, 3); fs(g, '#fff', '#8a5a2a', 1);
  g.restore();
  if (o.active) { circ(g, 7, -60, 6); fs(g, '#e2363c', '#8a1a1a', 1.2); line(g, 7, -66, 10, -74, '#3a7a2a', 1.6); }
  g.restore();
}
function drawBoatHull(g, opts) {
  g.beginPath(); g.moveTo(-62, -34); g.quadraticCurveTo(-58, 8, 0, 8); g.quadraticCurveTo(58, 8, 62, -34); g.closePath();
  const gr = g.createLinearGradient(0, -34, 0, 8); gr.addColorStop(0, '#5fbf45'); gr.addColorStop(1, '#2e7a26'); fs(g, gr, '#1d4a16', 2.4);
  g.save(); g.clip(); for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(i * 11, -36); g.quadraticCurveTo(i * 12, -10, i * 9, 10); g.strokeStyle = 'rgba(20,70,20,0.45)'; g.lineWidth = 3; g.stroke(); } g.restore();
  rrect(g, -62, -38, 124, 8, 4); fs(g, '#f2fff0', '#9ac08a', 1.4);
  if (opts.flesh) { rrect(g, -58, -42, 116, 6, 3); fs(g, '#ff5a7a'); for (let i = 0; i < 9; i++) { ell(g, -48 + i * 12, -39, 1.6, 2.6); fs(g, '#2a1a1a'); } }
}
function drawBoat(g, x, y, o) { // watermelon-half boat; x,y = hull bottom center
  g.save(); g.translate(x, y - 8);
  if (o.sail) {
    line(g, 6, -38, 6, -150, '#8a5a2a', 5);
    g.save(); g.translate(6, -146); g.rotate(Math.sin((o.t || 0) * 1.5) * 0.04);
    g.beginPath(); g.moveTo(2, 0); g.quadraticCurveTo(58, 30, 46, 100); g.quadraticCurveTo(20, 96, 2, 104); g.closePath(); fs(g, '#ffd84a', '#a8861a', 2);
    for (let i = 1; i < 5; i++) line(g, 2, i * 20, 30 + i * 4, 12 + i * 22, 'rgba(160,120,20,0.55)', 1.4);
    g.restore();
  }
  drawBoatHull(g, { flesh: true });
  if (!o.sail && o.need) { // missing parts shown as dashed outlines
    g.setLineDash([5, 5]); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(6, -40); g.lineTo(6, -140); g.stroke(); g.setLineDash([]);
    g.font = '900 15px Nunito, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.strokeStyle = '#2e5a22'; g.lineWidth = 4;
    const s = `${o.parts}/${o.need}`; g.strokeText(s, 6, -150); g.fillText(s, 6, -150);
  }
  g.restore();
}
function drawBoatFront(g, x, y) { g.save(); g.translate(x, y - 8); g.beginPath(); g.rect(-70, -26, 140, 40); g.clip(); drawBoatHull(g, { flesh: false }); g.restore(); }
function drawBoatPart(g, x, y, o) { // 0: banana-leaf sail, 1: mast, 2: oar
  g.save(); g.translate(x, y);
  const gl = g.createRadialGradient(0, 0, 2, 0, 0, 24); gl.addColorStop(0, 'rgba(255,255,220,0.8)'); gl.addColorStop(1, 'rgba(255,255,220,0)'); g.fillStyle = gl; circ(g, 0, 0, 24); g.fill();
  g.rotate(Math.sin((o.t || 0) * 2) * 0.15);
  if (o.i === 0) { g.beginPath(); g.moveTo(-3, 12); g.quadraticCurveTo(-14, -2, 0, -15); g.quadraticCurveTo(14, -2, 3, 12); g.closePath(); fs(g, '#7ad04a', '#2e6a1a', 1.6); line(g, 0, 12, 0, -13, '#2e6a1a', 1.4); }
  else if (o.i === 1) { rrect(g, -3, -16, 6, 32, 3); fs(g, '#b77a3c', '#5a3414', 1.6); g.beginPath(); g.moveTo(3, -14); g.lineTo(13, -10); g.lineTo(3, -6); fs(g, '#e2363c'); }
  else { g.rotate(0.6); rrect(g, -2.5, -16, 5, 22, 2); fs(g, '#c8904a', '#5a3414', 1.4); ell(g, 0, 10, 6, 9); fs(g, '#d8a05a', '#5a3414', 1.4); }
  g.restore();
}
function drawBottle(g, x, y, t) { // message in a bottle (letters from Grandma Gherkin)
  g.save(); g.translate(x, y + Math.sin(t * 2.5) * 2.5); g.rotate(-0.5 + Math.sin(t * 1.7) * 0.1);
  const gl = g.createRadialGradient(0, 0, 2, 0, 0, 24); gl.addColorStop(0, 'rgba(255,255,255,0.6)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gl; circ(g, 0, 0, 24); g.fill();
  rrect(g, -7, -8, 14, 22, 5); fs(g, 'rgba(190,235,240,0.75)', '#5a9aa8', 1.6);
  rrect(g, -3.5, -15, 7, 8, 2); fs(g, 'rgba(190,235,240,0.75)', '#5a9aa8', 1.4);
  rrect(g, -3.5, -19, 7, 5, 1.5); fs(g, '#b77a3c', '#5a3414', 1.2);
  g.save(); g.rotate(0.15); rrect(g, -4, -4, 8, 13, 2); fs(g, '#fff6dc', '#c8a060', 1); line(g, -2, 0, 2, 0, '#c8a060', 1); line(g, -2, 3, 2, 3, '#c8a060', 1); g.restore();
  line(g, -4, -5, -4, 9, 'rgba(255,255,255,0.8)', 1.6);
  g.restore();
}
function drawSodaVent(g, x, y, t) {
  g.save(); g.translate(x, y);
  ell(g, 0, -4, 16, 7); fs(g, '#e8d8b8', '#a89070', 1.5); ell(g, 0, -6, 8, 3.5); fs(g, '#5a4a3a');
  for (let i = 0; i < 3; i++) { const k = (t * 1.4 + i / 3) % 1; circ(g, Math.sin(i * 2 + t * 3) * 3, -8 - k * 22, 2 + k * 2); g.globalAlpha = 1 - k; fs(g, 'rgba(255,255,255,0.8)'); g.globalAlpha = 1; }
  g.restore();
}
function drawAirBubble(g, x, y, r, t) {
  g.save(); g.translate(x, y); const s = 1 + Math.sin(t * 6) * 0.06; g.scale(s, 1 / s);
  circ(g, 0, 0, r); fs(g, 'rgba(220,250,255,0.25)', 'rgba(255,255,255,0.95)', 2);
  ell(g, -r * 0.35, -r * 0.4, r * 0.28, r * 0.18, -0.6); fs(g, 'rgba(255,255,255,0.95)');
  g.restore();
}
function drawRindTile(g, x, y, c, r) { // coconut-shell / fruit-rind wall that the crunch breaks
  rrect(g, x + 1, y + 1, T - 2, T - 2, 6);
  const gr = g.createLinearGradient(x, y, x + T, y + T); gr.addColorStop(0, '#9a6a3a'); gr.addColorStop(1, '#5a3618'); fs(g, gr, '#3a200a', 1.6);
  g.strokeStyle = 'rgba(240,220,180,0.45)'; g.lineWidth = 1.2;
  for (let i = 0; i < 5; i++) { const a = hash2(c * 3 + i, r) * TAU, px = x + 8 + hash2(c, r * 5 + i) * 24, py = y + 8 + hash2(c + i, r * 2) * 24; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a) * 6, py + Math.sin(a) * 6); g.stroke(); }
  g.beginPath(); g.moveTo(x + 10, y + 6); g.lineTo(x + 18, y + 18); g.lineTo(x + 14, y + 30); g.strokeStyle = 'rgba(40,20,5,0.6)'; g.lineWidth = 1.8; g.stroke();
}

// ---------- power-up icons ----------
function drawPowerIconW2(g, kind, t) {
  if (kind === 'helmet') {
    g.beginPath(); g.arc(0, 3, 13, Math.PI, 0); g.closePath();
    const gr = g.createLinearGradient(0, -10, 0, 4); gr.addColorStop(0, '#9a6a3a'); gr.addColorStop(1, '#5a3618'); fs(g, gr, '#3a200a', 1.8);
    for (let i = 0; i < 4; i++) line(g, -9 + i * 6, -5 + (i % 2) * 3, -6 + i * 6, -1 + (i % 2) * 3, 'rgba(240,220,180,0.6)', 1.2);
    rrect(g, -14, 2, 28, 4, 2); fs(g, '#f2ead8', '#a89070', 1);
  } else if (kind === 'armor') {
    for (let i = 0; i < 10; i++) { const a = i * TAU / 10 + (t || 0) * 0.5; g.beginPath(); g.moveTo(Math.cos(a) * 9, Math.sin(a) * 9); g.lineTo(Math.cos(a + 0.15) * 15, Math.sin(a + 0.15) * 15); g.lineTo(Math.cos(a + 0.35) * 9, Math.sin(a + 0.35) * 9); fs(g, '#7ab83a', '#2e5a1a', 1); }
    circ(g, 0, 0, 10); fs(g, '#f2c230', '#9a6a10', 1.6);
    g.strokeStyle = 'rgba(150,100,10,0.7)'; g.lineWidth = 1.2; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(-8, i * 5 - 4); g.lineTo(8, i * 5 + 4); g.moveTo(-8, i * 5 + 4); g.lineTo(8, i * 5 - 4); g.stroke(); }
  } else if (kind === 'flipper') {
    g.rotate(-0.4);
    g.beginPath(); g.moveTo(-4, -12); g.quadraticCurveTo(-14, 6, -8, 13); g.quadraticCurveTo(0, 9, 8, 13); g.quadraticCurveTo(14, 6, 4, -12); g.closePath(); fs(g, '#a8e040', '#4a7a10', 1.8);
    for (let i = -1; i <= 1; i++) line(g, i * 3, -8, i * 6, 10, 'rgba(60,100,10,0.6)', 1.2);
    circ(g, 0, -10, 4); fs(g, '#e8ff90', '#4a7a10', 1.2);
  }
}

// ---------- hero overlays: helmet, armour, flipper, air ----------
function drawHeroExtras(g, p, G) {
  if (p.state === 'gone' || p.state === 'balloon' || (p.inv > 0 && p.state === 'play' && Math.floor(p.inv * 14) % 2 === 0)) return;
  const pk = p.char === 'pickle', headY = p.y + (pk ? 4 : (p.sliding ? 2 : 8));
  if (p.armor) {
    g.save(); g.globalAlpha = 0.9;
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12 + G.time * 2, rx = p.w / 2 + 12, ry = p.h / 2 + 8; g.save(); g.translate(p.cx + Math.cos(a) * rx, p.cy + Math.sin(a) * ry); g.rotate(a); g.beginPath(); g.moveTo(-3, -3); g.lineTo(6, 0); g.lineTo(-3, 3); g.closePath(); fs(g, '#f2c230', '#9a6a10', 1); g.restore(); }
    g.restore();
  }
  if (p.helmet) { g.save(); g.translate(p.cx + (pk ? 0 : p.face * 2), headY); g.scale(0.85, 0.85); drawPowerIconW2(g, 'helmet', G.time); g.restore(); }
  if (p.power === 'flipper' && (p.wet || p.swimming)) { g.save(); g.translate(p.cx - p.face * 10, p.bottom - 6); g.scale(0.55 * -p.face, 0.55); g.rotate(1.2); drawPowerIconW2(g, 'flipper', G.time); g.restore(); }
  if (p.air < 0.999 && p.state === 'play') { // air ring above the head
    const x = p.cx, y = p.y - 18, low = p.air < 0.35;
    g.save(); circ(g, x, y, 9); fs(g, 'rgba(255,255,255,0.75)', low ? '#e2363c' : '#3aa8c8', 2);
    g.beginPath(); g.moveTo(x, y); g.arc(x, y, 7, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(p.air, 0, 1)); g.closePath(); fs(g, low && Math.floor(G.time * 6) % 2 ? '#ff8a8a' : '#6fd3ff');
    g.restore();
  }
  if (p.crunchT > 0) { g.save(); g.globalAlpha = 0.7; for (let i = 0; i < 3; i++) line(g, p.cx - p.face * (14 + i * 8), p.y + 10 + i * 12, p.cx - p.face * (34 + i * 8), p.y + 10 + i * 12, '#ffffff', 2.5); g.restore(); }
}

// ---------- map cursor: the watermelon boat ----------
function drawMapBoat(g, x, y, s, t) {
  g.save(); g.translate(x, y + Math.sin(t * 2) * 3); const k = Math.max(0.32, s * 0.5); g.scale(k, k);
  drawBoat(g, 0, 0, { t, sail: true });
  g.restore();
}

// ---------- beach decoration ----------
function drawPalm(g, x, y, h, lean, t) {
  g.save(); g.translate(x, y);
  const tx = lean * h, segs = Math.max(5, Math.round(h / 22));
  for (let i = 0; i < segs; i++) {
    const k0 = i / segs, k1 = (i + 1) / segs, x0 = tx * k0 * k0, x1 = tx * k1 * k1, w = 13 - k0 * 5;
    g.beginPath(); g.moveTo(x0 - w, -h * k0); g.lineTo(x1 - w + 1, -h * k1); g.lineTo(x1 + w - 1, -h * k1); g.lineTo(x0 + w, -h * k0); g.closePath(); fs(g, i % 2 ? '#a8743c' : '#8a5a2a', '#5a3414', 1.3);
  }
  g.translate(tx, -h);
  for (let i = 0; i < 3; i++) { ell(g, -6 + i * 6, 8, 6, 9); fs(g, '#ffd84a', '#a8861a', 1.2); }
  const sw = Math.sin((t || 0) * 1.3) * 0.05;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI + i * Math.PI / 6 + sw, len = 66 + (i % 2) * 14;
    g.save(); g.rotate(a);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.5, -18, len, 14); g.quadraticCurveTo(len * 0.5, 4, 0, 6); g.closePath(); fs(g, i % 2 ? '#3a9a3a' : '#2e8030', '#1a4a1a', 1.4);
    g.strokeStyle = 'rgba(20,70,20,0.6)'; g.lineWidth = 1.2; for (let k = 1; k < 6; k++) { const px = len * k / 6; g.beginPath(); g.moveTo(px, -4 + k); g.lineTo(px + 6, 10); g.stroke(); }
    g.restore();
  }
  circ(g, 0, 0, 7); fs(g, '#6a4a1a');
  g.restore();
}
function drawShell(g, x, y, s, c) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.beginPath(); g.moveTo(0, 0); for (let i = 0; i <= 6; i++) { const a = Math.PI + i * Math.PI / 6; g.lineTo(Math.cos(a) * 10, Math.sin(a) * 10); } g.closePath(); fs(g, c || '#ffd0c0', '#c88a7a', 1.2);
  for (let i = 1; i < 6; i++) { const a = Math.PI + i * Math.PI / 6; line(g, 0, 0, Math.cos(a) * 9, Math.sin(a) * 9, 'rgba(180,110,100,0.6)', 1); }
  g.restore();
}

// ---------- World 2 intro scenes (shown behind the story captions) ----------
function drawWorldIntro(g, G, world, sc, S) {
  const t = G.stateT, W = G.viewW;
  const beach = (sky0, sky1, sea0) => {
    const gr = g.createLinearGradient(0, 0, 0, VIEW_H); gr.addColorStop(0, sky0); gr.addColorStop(1, sky1); g.fillStyle = gr; g.fillRect(0, 0, W, VIEW_H);
    g.fillStyle = sea0; g.fillRect(0, 250, W, 200);
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2;
    for (let i = 0; i < 14; i++) { const x = ((i * 157 + t * 20) % (W + 60)) - 30, y = 270 + (i % 5) * 26; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 12, y - 5, x + 24, y); g.stroke(); }
    g.beginPath(); g.moveTo(0, 410); g.quadraticCurveTo(W * 0.5, 380, W, 410); g.lineTo(W, VIEW_H); g.lineTo(0, VIEW_H); g.closePath(); fs(g, '#f2d9a0');
    g.beginPath(); g.moveTo(0, 412); g.quadraticCurveTo(W * 0.5, 382, W, 412); g.strokeStyle = '#fffaf0'; g.lineWidth = 8; g.stroke();
  };
  switch (sc) {
    case 0: { // sunny beach, the three friends
      beach('#3aa8e8', '#bdeaf8', '#38c8d0');
      const sx = W - 160; const sg = g.createRadialGradient(sx, 90, 10, sx, 90, 110); sg.addColorStop(0, 'rgba(255,250,210,1)'); sg.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = sg; g.fillRect(sx - 120, -30, 240, 240);
      drawPalm(g, 110, 420, 260, 0.12, t); drawPalm(g, W - 110, 420, 240, -0.1, t + 1);
      drawBanni(g, { x: W / 2 - 110, y: 408, face: 1, sx: 1, sy: 1, pose: 'win', t, hp: 3, scale: 1.4 });
      drawPickle(g, { x: W / 2, y: 404, face: 1, pose: 'idle', t, sx: 1.4, sy: 1.4, bandana: false });
      drawCookieGirl(g, W / 2 + 110, 406, { t, s: 1.25 });
      break;
    }
    case 1: { // the bottle from the waves
      beach('#5ab8ea', '#d8f2fa', '#38c8d0');
      drawPalm(g, W - 120, 420, 250, -0.1, t);
      drawBottle(g, W / 2 - 40, 380 + Math.sin(t * 2) * 6, t);
      drawPickle(g, { x: W / 2 + 80, y: 404, face: -1, pose: 'talk', t, sx: 1.5, sy: 1.5, worried: true, bandana: false });
      drawBanni(g, { x: W / 2 + 190, y: 408, face: -1, sx: 1, sy: 1, pose: 'idle', t, hp: 3, scale: 1.3 });
      break;
    }
    case 2: { // night sea, the pirate ship of Captain Vinegar
      const gr = g.createLinearGradient(0, 0, 0, VIEW_H); gr.addColorStop(0, '#1d2a4a'); gr.addColorStop(1, '#3a4a6a'); g.fillStyle = gr; g.fillRect(0, 0, W, VIEW_H);
      for (let i = 0; i < 30; i++) sparkle(g, (i * 137) % W, (i * 71) % 220, 1.5 + (i % 3), 'rgba(255,255,255,0.8)');
      circ(g, 140, 100, 40); fs(g, '#fff6d0');
      g.fillStyle = '#1a3a5a'; g.fillRect(0, 300, W, VIEW_H - 300);
      const sx = W * 0.62 + Math.sin(t * 0.8) * 10, sy = 310 + Math.sin(t * 1.6) * 4;
      g.save(); g.translate(sx, sy);
      g.beginPath(); g.moveTo(-120, -20); g.quadraticCurveTo(-110, 30, 0, 30); g.quadraticCurveTo(110, 30, 130, -30); g.closePath(); fs(g, '#3a2a1a', '#1a0a04', 2);
      for (let i = -2; i <= 2; i++) { rrect(g, i * 40 - 14, -16, 28, 26, 10); fs(g, 'rgba(200,230,160,0.55)', '#2a3a1a', 1.5); }
      line(g, 0, -20, 0, -180, '#2a1a0a', 6);
      g.beginPath(); g.moveTo(4, -176); g.lineTo(90, -150); g.lineTo(4, -100); g.closePath(); fs(g, '#1a1a1a');
      circ(g, 40, -142, 9); fs(g, '#ffffff'); line(g, 32, -128, 48, -120, '#fff', 3); line(g, 48, -128, 32, -120, '#fff', 3);
      g.restore();
      drawPickle(g, { x: W * 0.2, y: 470, face: 1, pose: 'idle', t, sx: 1.5, sy: 1.5, worried: true, bandana: false });
      break;
    }
    default: { // repairing the watermelon boat
      beach('#f2a85a', '#ffe0b0', '#2ea8b8');
      drawBoat(g, W / 2 + 60, 430, { t, sail: true });
      drawPickle(g, { x: W / 2 - 120, y: 406, face: 1, pose: 'cheer', t, sx: 1.5, sy: 1.5, bandana: true });
      drawBanni(g, { x: W / 2 - 220, y: 408, face: 1, sx: 1, sy: 1, pose: 'win', t, hp: 3, scale: 1.35 });
      drawCookieGirl(g, W - 110, 406, { t, s: 1.15 });
    }
  }
}

// ---------- 2-2 Pineapple jungle (ref-jungle.jpg) ----------
function drawPineSpring(g, x, y, w, o) { // pineapple on a metal coil; x,y = top-left of the pad, w = width
  g.save(); g.translate(x + w / 2, y);
  const sq = o.sq || 0, h = 26 - sq * 8;
  for (let i = 0; i < 5; i++) { const yy = 22 + i * (h / 5) + sq * 4; ell(g, 0, yy, 13, 3.4); g.strokeStyle = i % 2 ? '#c8ccd4' : '#7a7e86'; g.lineWidth = 3; g.stroke(); }
  rrect(g, -14, 46, 28, 5, 2); fs(g, '#5a5e66', '#2a2e36', 1.2);
  g.translate(0, sq * 6);
  ell(g, 0, 6, 17, 15); const gr = g.createLinearGradient(0, -8, 0, 20); gr.addColorStop(0, '#ffd84a'); gr.addColorStop(1, '#d89a1a'); fs(g, gr, '#8a5a10', 1.8);
  g.save(); ell(g, 0, 6, 17, 15); g.clip(); g.strokeStyle = 'rgba(140,90,10,0.6)'; g.lineWidth = 1.3;
  for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 8 - 12, -10); g.lineTo(i * 8 + 12, 22); g.moveTo(i * 8 + 12, -10); g.lineTo(i * 8 - 12, 22); g.stroke(); }
  g.restore();
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.38; g.beginPath(); g.moveTo(-3, -6); g.lineTo(Math.cos(a) * 20, -6 + Math.sin(a) * 18); g.lineTo(3, -6); g.closePath(); fs(g, i % 2 ? '#3a9a3a' : '#4cb84a', '#1a5a1a', 1); }
  g.restore();
}
function drawOlive(g, x, y, o) { // rolling olive with a red pimento; x,y = bottom center
  g.save(); g.translate(x, y - 15);
  g.save(); g.rotate(o.rot || 0);
  ell(g, 0, 0, 16, 15); const gr = g.createRadialGradient(-5, -6, 2, 0, 0, 18); gr.addColorStop(0, '#9ac04a'); gr.addColorStop(1, '#4a6a1a'); fs(g, gr, '#26380a', 2);
  circ(g, 9, -3, 4.5); fs(g, '#e2363c', '#8a1a1a', 1.2);
  g.restore();
  // eyes stay upright
  for (const s of [-1, 1]) { ell(g, s * 5 - 2, -4, 3.6, 4.4); fs(g, '#fff', '#26380a', 1); circ(g, s * 5 - 1 + (o.dir || 0), -3.5, 1.7); fs(g, '#111'); }
  line(g, -9, -10, -3, -8, '#26380a', 2); line(g, 1, -8, 7, -10, '#26380a', 2);
  g.restore();
}
function drawShroom(g, x, y, o) { // pickled honey mushroom (опёнок): x,y = ground, up 0..1
  const up = o.up === undefined ? 1 : o.up;
  if (up <= 0.02) { ell(g, x, y - 2, 14, 4); fs(g, 'rgba(90,60,30,0.5)'); return; }
  g.save(); g.translate(x, y); g.beginPath(); g.rect(-30, -70, 60, 70); g.clip(); g.translate(0, (1 - up) * 48);
  rrect(g, -8, -26, 16, 26, 6); fs(g, '#f4ead8', '#8a7a60', 1.6);
  for (const s of [-1, 1]) { ell(g, s * 4, -16, 2.6, 3.4); fs(g, '#fff', '#3a2a1a', 0.8); circ(g, s * 4, -15.5, 1.3); fs(g, '#111'); line(g, s * 1.5, -21, s * 7, -19, '#3a2a1a', 1.6); }
  g.beginPath(); g.arc(0, -9, 3, Math.PI + 0.3, -0.3); g.strokeStyle = '#3a2a1a'; g.lineWidth = 1.5; g.stroke();
  g.beginPath(); g.moveTo(-20, -24); g.quadraticCurveTo(-18, -46, 0, -46); g.quadraticCurveTo(18, -46, 20, -24); g.quadraticCurveTo(0, -30, -20, -24); g.closePath();
  const gr = g.createLinearGradient(0, -46, 0, -24); gr.addColorStop(0, '#b05ac8'); gr.addColorStop(1, '#6a2a8a'); fs(g, gr, '#3a0a4a', 1.8);
  for (const [sx, sy, r] of [[-9, -36, 3], [4, -40, 2.4], [10, -31, 2.2], [-2, -31, 1.8]]) { circ(g, sx, sy, r); fs(g, '#f0d8ff'); }
  g.restore();
}
function drawJellyVine(g, ax, ay, ex, ey, sag) { // vine made of jelly beans
  const cols = ['#e2363c', '#ffd447', '#6ad04a', '#4ab0ff', '#c38bff', '#ff8c5a'];
  const n = Math.max(4, Math.round(Math.hypot(ex - ax, ey - ay) / 13));
  const mx = ax + (ex - ax) * 0.5 + sag, my = ay + (ey - ay) * 0.5;
  for (let i = 0; i <= n; i++) {
    const k = i / n, x = (1 - k) * (1 - k) * ax + 2 * (1 - k) * k * mx + k * k * ex, y = (1 - k) * (1 - k) * ay + 2 * (1 - k) * k * my + k * k * ey;
    const k2 = Math.min(1, k + 0.02), x2 = (1 - k2) * (1 - k2) * ax + 2 * (1 - k2) * k2 * mx + k2 * k2 * ex, y2 = (1 - k2) * (1 - k2) * ay + 2 * (1 - k2) * k2 * my + k2 * k2 * ey;
    g.save(); g.translate(x, y); g.rotate(Math.atan2(y2 - y, x2 - x) + Math.PI / 2);
    ell(g, 0, 0, 5, 8); fs(g, cols[i % cols.length], 'rgba(40,20,20,0.5)', 1.2); ell(g, -1.5, -3, 1.4, 2.4); fs(g, 'rgba(255,255,255,0.55)');
    g.restore();
  }
  circ(g, ax, ay, 6); fs(g, '#3a7a2a', '#1a4a1a', 1.5);
}
function drawPupyrka(g, x, y, o) { // Pickle's little sister: pink bow, x,y = feet
  g.save(); g.translate(x, y); g.scale((o.face || 1) * (o.s || 1), o.s || 1);
  const t = o.t || 0, hop = o.happy ? Math.abs(Math.sin(t * 9)) * 6 : 0;
  g.translate(0, -hop);
  line(g, -4, -6, -5, 0, '#2b5a1e', 2.6); line(g, 4, -6, 5, 0, '#2b5a1e', 2.6);
  rrect(g, -10, -40, 20, 36, 10); const gr = g.createLinearGradient(-10, 0, 10, 0); gr.addColorStop(0, '#4a9136'); gr.addColorStop(1, '#6ab84a'); fs(g, gr, '#244d18', 2);
  for (const [bx, by] of [[-5, -32], [4, -26], [-6, -18], [5, -12]]) { circ(g, bx, by, 1.4); fs(g, '#a8dc8a'); }
  const ah = o.happy || o.wave ? -38 + Math.sin(t * 10) * 3 : -18;
  line(g, -9, -24, -14, ah, '#2b5a1e', 2.2); line(g, 9, -24, 14, ah, '#2b5a1e', 2.2);
  for (const s of [-1, 1]) { ell(g, s * 4, -30, 3.4, 4.2); fs(g, '#fff', '#1d3a12', 1); circ(g, s * 4 + 0.6, -29.5, 1.7); fs(g, '#111'); line(g, s * 6.5, -34, s * 8, -36, '#1d3a12', 1.2); }
  g.beginPath(); g.arc(0, -23, 3, 0.2, Math.PI - 0.2); g.strokeStyle = '#1d3a12'; g.lineWidth = 1.5; g.stroke();
  ell(g, -6, -25, 2.4, 1.4); fs(g, 'rgba(255,140,170,0.6)'); ell(g, 6, -25, 2.4, 1.4); fs(g, 'rgba(255,140,170,0.6)');
  g.save(); g.translate(4, -41); for (const s of [-1, 1]) { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(s * 10, -9, s * 11, 2); g.closePath(); fs(g, '#ff6fa8', '#b0306a', 1.3); } circ(g, 0, 0, 3); fs(g, '#ff8ac0', '#b0306a', 1); g.restore();
  g.restore();
}
function drawWoodCage(g, x, y, o) { // wooden pirate cage on a leafy log; x,y = bottom center
  g.save(); g.translate(x, y);
  if (o.broken) {
    for (let i = 0; i < 6; i++) { g.save(); g.translate(-30 + i * 12, -4); g.rotate(i * 0.9); rrect(g, -12, -3, 24, 6, 2); fs(g, '#8a5a2a', '#4a2c10', 1.2); g.restore(); }
    g.restore(); return;
  }
  if (o.inside) drawPupyrka(g, 0, -6, { t: o.t, wave: true });
  for (let i = 0; i < 7; i++) { rrect(g, -38 + i * 12, -70, 6, 66, 2); fs(g, '#9a6a3a', '#4a2c10', 1.3); }
  for (const yy of [-74, -8]) { rrect(g, -44, yy, 88, 9, 3); fs(g, '#7a4a1e', '#3a1e08', 1.6); }
  for (const xx of [-42, 42]) { circ(g, xx, -70, 4); fs(g, '#5a3414'); circ(g, xx, -4, 4); fs(g, '#5a3414'); }
  if (o.locked) { rrect(g, -8, -44, 16, 14, 3); fs(g, '#c8a040', '#6a4a10', 1.5); g.beginPath(); g.arc(0, -44, 5, Math.PI, 0); g.strokeStyle = '#6a4a10'; g.lineWidth = 2.5; g.stroke(); }
  g.restore();
}
function drawPalisade(g, x, y, w, h) { // wooden stakes gate
  for (let i = 0; i < 3; i++) {
    const sx = x + 2 + i * 12;
    g.beginPath(); g.moveTo(sx, y + h); g.lineTo(sx, y + 10); g.lineTo(sx + 5, y); g.lineTo(sx + 10, y + 10); g.lineTo(sx + 10, y + h); g.closePath(); fs(g, i % 2 ? '#a8743c' : '#8a5a2a', '#4a2c10', 1.4);
  }
  for (let j = 30; j < h; j += 70) { rrect(g, x - 2, y + j, w + 4, 7, 3); fs(g, '#5a3414'); }
}
function drawPineRindTile(g, x, y, c, r) { // pineapple-skin wall
  g.fillStyle = '#d89a2a'; g.fillRect(x - 0.5, y - 0.5, T + 1, T + 1);
  g.save(); g.beginPath(); g.rect(x, y, T, T); g.clip();
  for (let i = -1; i <= 2; i++) for (let j = -1; j <= 2; j++) {
    const cx = x + i * 20 + (j % 2 ? 10 : 0), cy = y + j * 14;
    g.beginPath(); g.moveTo(cx, cy - 8); g.lineTo(cx + 10, cy); g.lineTo(cx, cy + 8); g.lineTo(cx - 10, cy); g.closePath(); fs(g, '#f2c040', '#8a5a10', 1.2);
    circ(g, cx, cy, 1.6); fs(g, '#6a3a08');
  }
  g.restore();
  g.strokeStyle = 'rgba(80,40,5,0.7)'; g.lineWidth = 1.6; g.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1);
}
function drawW2Portrait(g, who) {
  if (who === 'pupyrka') { drawPupyrka(g, 75, 150, { t: 0, s: 2.6, happy: false }); return true; }
  return false;
}
