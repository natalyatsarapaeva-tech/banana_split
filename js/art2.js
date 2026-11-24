'use strict';
// ================= art2.js : art for levels 3-5 and bonus =================
function face2(g, x, y, s, o) { // generic cute/angry face
  o = o || {};
  const ex = 4.5 * s, er = 3.4 * s;
  eye(g, x - ex, y, er, er * 1.2, o.lx || 0.5, o.ly || 0, { white: o.white, pupil: o.pupil });
  eye(g, x + ex, y, er, er * 1.2, o.lx || 0.5, o.ly || 0, { white: o.white, pupil: o.pupil });
  if (o.angry) { brow(g, x - ex, y - er * 1.8, er * 2, 0.45, o.browCol || '#1d1410', 1.8 * s); brow(g, x + ex, y - er * 1.8, er * 2, -0.45, o.browCol || '#1d1410', 1.8 * s); }
  if (o.mouth === 'o') { ell(g, x, y + 6 * s, 2.4 * s, 2.8 * s); fs(g, '#3a1a10'); }
  else if (o.mouth === 'frown') { g.beginPath(); g.arc(x, y + 9 * s, 3.5 * s, Math.PI + 0.4, -0.4); g.strokeStyle = '#2a1a10'; g.lineWidth = 1.8 * s; g.stroke(); }
  else { g.beginPath(); g.arc(x, y + 3 * s, 3.6 * s, 0.3, Math.PI - 0.3); g.strokeStyle = '#2a1a10'; g.lineWidth = 1.8 * s; g.stroke(); }
}
// ---------- Misha the carrot ----------
function drawMisha(g, x, y, o) {
  o = o || {}; const t = o.t || 0;
  g.save(); g.translate(x, y); g.scale((o.face || 1) * (o.s || 1), o.s || 1);
  line(g, -4, -10, -6, 0, '#7a3a10', 3); line(g, 4, -10, 6, 0, '#7a3a10', 3);
  ell(g, -6, -1, 5, 3); fs(g, '#5a6a3a'); ell(g, 7, -1, 5, 3); fs(g, '#5a6a3a');
  // leaf ponytail
  const sw = Math.sin(t * 3) * 0.15;
  for (const a of [-0.5, -0.1, 0.3]) { g.save(); g.translate(0, -58); g.rotate(a + sw); ell(g, 0, -12, 4, 13); fs(g, '#5ab040', '#2e6a1a', 1.3); g.restore(); }
  // body (carrot)
  g.beginPath(); g.moveTo(-15, -56); g.quadraticCurveTo(-17, -30, -3, -8); g.quadraticCurveTo(0, -5, 3, -8); g.quadraticCurveTo(17, -30, 15, -56); g.quadraticCurveTo(0, -64, -15, -56); g.closePath();
  const gr = g.createLinearGradient(-15, 0, 15, 0); gr.addColorStop(0, '#e86a1a'); gr.addColorStop(0.55, '#ff9a3a'); gr.addColorStop(1, '#f07a22');
  fs(g, gr, '#9a3a0a', 2.2);
  for (const yy of [-44, -33, -22]) line(g, -9 + (yy + 44) * 0.15, yy, -3, yy + 1, 'rgba(150,60,10,0.55)', 1.4);
  // beret
  g.beginPath(); g.ellipse(2, -58, 15, 6, -0.15, 0, TAU); fs(g, '#6b7a3a', '#3a4a1a', 1.6);
  circ(g, 10, -62, 3); fs(g, '#e8c24a');
  eye(g, -4, -44, 3.6, 4.4, 0.6, 0); eye(g, 5, -44, 3.6, 4.4, 0.6, 0);
  for (const f of [[-8, -37], [-6, -35], [9, -37], [7, -35]]) { circ(g, f[0], f[1], 0.9); fs(g, '#b04a10'); }
  g.beginPath(); g.arc(1, -36, 3.4, 0.3, Math.PI - 0.3); g.strokeStyle = '#6a2a08'; g.lineWidth = 1.8; g.stroke();
  const wave = o.wave ? Math.sin(t * 9) * 8 : 0;
  line(g, -13, -38, -21, -30 - wave, '#9a3a0a', 2.4); glove(g, -21, -30 - wave, 3.4);
  line(g, 13, -38, 20, -28, '#9a3a0a', 2.4); glove(g, 20, -28, 3.4);
  g.restore();
}
// ---------- L3 enemies ----------
function drawFlyRadish(g, x, y, o) {
  const t = o.t || 0;
  g.save(); g.translate(x, y); g.scale(o.face || 1, 1);
  for (const a of [-0.6, 0, 0.6]) { g.save(); g.translate(0, -14); g.rotate(a + Math.sin(t * 18 + a) * 0.25); ell(g, 0, -9, 4.5, 10); fs(g, '#5ab040', '#2e6a1a', 1.3); g.restore(); }
  g.beginPath(); g.moveTo(0, -16); g.bezierCurveTo(16, -14, 16, 8, 0, 16); g.bezierCurveTo(-16, 8, -16, -14, 0, -16); g.closePath();
  const gr = g.createRadialGradient(-5, -6, 2, 0, 0, 16); gr.addColorStop(0, '#ff8aa0'); gr.addColorStop(1, '#d4304f');
  fs(g, gr, '#8a1a30', 2);
  g.beginPath(); g.moveTo(-2, 15); g.quadraticCurveTo(0, 24, 2, 15); fs(g, '#fff0f0');
  ell(g, 0, 8, 9, 4); fs(g, 'rgba(255,240,240,0.5)');
  if (!o.frozen) face2(g, 1, -3, 1, { angry: true, mouth: o.dive ? 'o' : 'frown' });
  g.restore();
}
function drawGarlicDrone(g, x, y, o) {
  const t = o.t || 0;
  g.save(); g.translate(x, y);
  line(g, 0, -18, 0, -26, '#7a7a7a', 2.4);
  g.save(); g.translate(0, -27); g.scale(Math.cos(t * 40), 1); ell(g, 0, 0, 18, 3); fs(g, '#c9c0b0', '#7a6a5a', 1.2); g.restore();
  g.beginPath(); g.moveTo(0, -20); g.bezierCurveTo(14, -12, 18, 8, 6, 14); g.quadraticCurveTo(0, 16, -6, 14); g.bezierCurveTo(-18, 8, -14, -12, 0, -20); g.closePath();
  const gr = g.createRadialGradient(-5, -6, 2, 0, 0, 18); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#d8cfc0');
  fs(g, gr, '#8a7a6a', 2);
  g.strokeStyle = 'rgba(150,130,110,0.6)'; g.lineWidth = 1.2;
  for (const k of [-6, 0, 6]) { g.beginPath(); g.moveTo(k * 0.4, -18); g.quadraticCurveTo(k * 1.6, 0, k, 14); g.stroke(); }
  if (!o.frozen) face2(g, 0, 0, 0.9, { angry: true, mouth: 'frown' });
  ell(g, 0, 16, 7, 2); fs(g, 'rgba(0,0,0,0.12)');
  g.restore();
}
function drawCelery(g, x, y, o) {
  const t = o.t || 0;
  g.save(); g.translate(x, y); g.scale(o.face || 1, 1);
  line(g, -4, -8, -5, 0, '#3e7a24', 3); line(g, 4, -8, 5, 0, '#3e7a24', 3);
  rrect(g, -9, -56, 18, 50, 8);
  const gr = g.createLinearGradient(-9, 0, 9, 0); gr.addColorStop(0, '#a8d878'); gr.addColorStop(0.5, '#d4f0a8'); gr.addColorStop(1, '#98c868');
  fs(g, gr, '#4e8a32', 2);
  for (const k of [-4, 0, 4]) line(g, k, -52, k, -10, 'rgba(90,150,60,0.6)', 1.2);
  for (const a of [-0.7, -0.2, 0.3, 0.8]) { g.save(); g.translate(0, -56); g.rotate(a + Math.sin(t * 3 + a) * 0.1); ell(g, 0, -9, 5, 10); fs(g, '#5ab040', '#2e6a1a', 1.2); g.restore(); }
  if (!o.frozen) face2(g, 1, -40, 0.85, { angry: true, mouth: 'frown' });
  // bow
  const dr = o.draw || 0;
  g.save(); g.translate(14, -28);
  g.beginPath(); g.arc(0, 0, 16, -1.2, 1.2); g.strokeStyle = '#8a5a2a'; g.lineWidth = 3; g.stroke();
  line(g, Math.cos(-1.2) * 16, Math.sin(-1.2) * 16, -dr * 8, 0, '#eee', 1); line(g, -dr * 8, 0, Math.cos(1.2) * 16, Math.sin(1.2) * 16, '#eee', 1);
  if (dr > 0) line(g, -dr * 8, 0, 18, 0, '#7ab04a', 3);
  g.restore();
  line(g, 7, -32, 12, -28, '#4e8a32', 2.4);
  g.restore();
}
function drawLolli(g, x, y, o) { // falling lollipop icicle, pointing down; x,y = top center
  const t = o.t || 0, sh = o.shake ? Math.sin(t * 60) * 2 : 0;
  g.save(); g.translate(x + sh, y);
  g.beginPath(); g.moveTo(-5, 22); g.lineTo(5, 22); g.lineTo(0, 62); g.closePath(); fs(g, '#ffffff', '#c0a0b0', 1.2);
  g.save(); g.clip(); for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#ff7aa8' : '#7ad0ff'; g.fillRect(-6, 24 + i * 7, 12, 3.5); } g.restore();
  circ(g, 0, 12, 13); fs(g, '#fff6fb', '#c86a9a', 2);
  g.beginPath(); for (let i = 0; i < 30; i++) { const a = i * 0.5, r = i * 0.4; g.lineTo(Math.cos(a) * r, 12 + Math.sin(a) * r); } g.strokeStyle = '#ff5a9a'; g.lineWidth = 2.4; g.stroke();
  g.restore();
}
function drawMeringue(g, x, y, w, o) {
  const a = o.alpha === undefined ? 1 : o.alpha, sh = o.shake ? Math.sin((o.t || 0) * 70) * 2 : 0;
  g.save(); g.globalAlpha *= a; g.translate(sh, 0);
  const n = Math.max(2, Math.round(w / 26));
  for (let i = 0; i < n; i++) {
    const px = x + 13 + i * (w - 26) / (n - 1 || 1), py = y + 8;
    g.beginPath(); g.moveTo(px - 15, py + 10); g.quadraticCurveTo(px - 15, py - 6, px - 4, py - 8); g.quadraticCurveTo(px, py - 22, px + 4, py - 8); g.quadraticCurveTo(px + 15, py - 6, px + 15, py + 10); g.closePath();
    fs(g, '#fffdf6', '#d8c8b0', 1.6);
    line(g, px - 6, py - 2, px - 2, py - 10, 'rgba(220,200,170,0.7)', 1.4);
  }
  rrect(g, x + 2, y + 10, w - 4, 10, 5); fs(g, '#fff8ec', '#d8c8b0', 1.4);
  if (o.crack) { line(g, x + w * 0.3, y + 4, x + w * 0.4, y + 18, '#b8a080', 1.5); line(g, x + w * 0.65, y + 2, x + w * 0.6, y + 16, '#b8a080', 1.5); }
  g.restore();
}
function drawGummy(g, x, y, o) { // x,y center
  const c = o.col || '#ff5a5a', t = o.t || 0;
  g.save(); g.translate(x, y); g.rotate(Math.sin(t * 2 + (o.ph || 0)) * 0.3); g.scale(o.s || 1, o.s || 1);
  g.globalAlpha *= 0.92;
  circ(g, -9, -18, 6); fs(g, c); circ(g, 9, -18, 6); fs(g, c);
  circ(g, 0, -10, 12); fs(g, c);
  ell(g, 0, 8, 13, 14); fs(g, c);
  ell(g, -12, 4, 5, 8, 0.6); fs(g, c); ell(g, 12, 4, 5, 8, -0.6); fs(g, c);
  ell(g, -7, 21, 5, 4); fs(g, c); ell(g, 7, 21, 5, 4); fs(g, c);
  g.globalAlpha = 0.45; ell(g, -4, -14, 4, 3); fs(g, '#fff'); ell(g, -5, 4, 3, 6); fs(g, '#fff'); g.globalAlpha = 1;
  if (o.face !== false) { circ(g, -4, -11, 1.6); fs(g, '#2a1010'); circ(g, 4, -11, 1.6); fs(g, '#2a1010'); g.beginPath(); g.arc(0, -8, 2.4, 0.3, Math.PI - 0.3); g.strokeStyle = '#2a1010'; g.lineWidth = 1.3; g.stroke(); }
  g.restore();
}
function drawAirship(g, x, y, o) {
  const t = o.t || 0, s = o.s || 1;
  g.save(); g.translate(x, y + Math.sin(t * 2) * 4); g.scale(s, s);
  if (o.tilt) g.rotate(o.tilt);
  if (o.flash) g.globalAlpha *= 0.55 + Math.sin(t * 50) * 0.45;
  // propellers
  for (const side of [-1, 1]) {
    g.save(); g.translate(side * 88, -4);
    rrect(g, -8, -8, 16, 16, 4); fs(g, '#8a6a4a', '#4a3a2a', 2);
    g.rotate(t * 25 * side);
    for (let i = 0; i < 4; i++) { g.save(); g.rotate(i * Math.PI / 2); ell(g, 0, -22, 6, 20); fs(g, '#b8864a', '#6a4a2a', 1.5); g.restore(); }
    g.restore();
  }
  // bulb
  g.beginPath(); g.moveTo(0, -92); g.bezierCurveTo(20, -70, 82, -60, 80, 0); g.bezierCurveTo(78, 46, 40, 64, 0, 64); g.bezierCurveTo(-40, 64, -78, 46, -80, 0); g.bezierCurveTo(-82, -60, -20, -70, 0, -92); g.closePath();
  const gr = g.createRadialGradient(-22, -24, 8, 0, 0, 90); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.6, '#e8dccc'); gr.addColorStop(1, '#bfae98');
  fs(g, gr, '#7a6a58', 3);
  g.strokeStyle = 'rgba(140,120,100,0.6)'; g.lineWidth = 2;
  for (const k of [-46, -16, 16, 46]) { g.beginPath(); g.moveTo(k * 0.15, -86); g.quadraticCurveTo(k * 1.35, -10, k * 0.7, 60); g.stroke(); }
  // flag
  line(g, 0, -92, 0, -128, '#6a5a4a', 3);
  g.beginPath(); g.moveTo(0, -128); g.lineTo(34, -122 + Math.sin(t * 6) * 3); g.lineTo(26, -112); g.lineTo(34, -102 + Math.sin(t * 6 + 1) * 3); g.lineTo(0, -106); g.closePath(); fs(g, '#e8e0d0', '#7a6a58', 1.5);
  circ(g, 14, -114, 5); fs(g, '#d8cfc0', '#7a6a58', 1);
  // face
  const dmg = o.dmg || 0;
  eye(g, -26, -8, 13, 11, -0.6, 0.2, { lw: 2.4, pr: 6 }); eye(g, 26, -8, 13, 11, -0.6, 0.2, { lw: 2.4, pr: 6 });
  brow(g, -26, -24, 28, 0.35, '#3a2a1a', 6); brow(g, 26, -24, 28, -0.35, '#3a2a1a', 6);
  g.beginPath(); g.moveTo(-22, 26); g.quadraticCurveTo(0, 12, 22, 26); g.strokeStyle = '#3a2a1a'; g.lineWidth = 4; g.lineCap = 'round'; g.stroke();
  // gondola / hatch
  rrect(g, -34, 50, 68, 26, 8); fs(g, '#8a8a92', '#4a4a52', 2.4);
  for (let i = 0; i < 4; i++) { circ(g, -24 + i * 16, 63, 3); fs(g, o.open ? '#ffcf4a' : '#5a5a62'); }
  for (const gx of [-50, 50]) { g.save(); g.translate(gx, 40); g.rotate(t * 2); for (let i = 0; i < 8; i++) { g.save(); g.rotate(i * Math.PI / 4); g.fillStyle = '#b8863a'; g.fillRect(-3, -14, 6, 6); g.restore(); } circ(g, 0, 0, 9); fs(g, '#c9963a', '#6a4a1a', 2); g.restore(); }
  if (dmg > 0) { for (let i = 0; i < dmg; i++) { line(g, -40 + i * 22, -40 + (i % 2) * 30, -30 + i * 22, -20 + (i % 2) * 30, '#5a4a3a', 2.4); } }
  g.restore();
}
function drawClove(g, x, y, o) {
  g.save(); g.translate(x, y); g.rotate(o.rot || 0);
  g.beginPath(); g.moveTo(0, -12); g.quadraticCurveTo(10, -4, 6, 10); g.quadraticCurveTo(0, 13, -6, 10); g.quadraticCurveTo(-10, -4, 0, -12); g.closePath();
  fs(g, o.back ? '#fff6c8' : '#f4ecdc', o.back ? '#e8a020' : '#8a7a68', 2);
  line(g, 0, -12, 0, -16, '#8a7a68', 2);
  if (o.back) { circ(g, 0, 0, 16); fs(g, 'rgba(255,220,80,0.25)'); }
  g.restore();
}
function drawStink(g, x, y, o) {
  const a = o.a === undefined ? 1 : o.a, t = o.t || 0;
  g.save(); g.globalAlpha *= 0.75 * a;
  for (let i = 0; i < 5; i++) { const ang = i * 1.3 + t; circ(g, x + Math.cos(ang) * 10, y + Math.sin(ang) * 7, 11 + (i % 2) * 3); fs(g, i % 2 ? '#9fd27e' : '#7ab85a'); }
  g.globalAlpha *= 0.8; for (const d of [[-6, -3], [5, 2]]) { line(g, x + d[0], y + d[1], x + d[0] + 4, y + d[1] - 6, '#4a7a2a', 1.6); }
  g.restore();
}
function drawUpdraftCol(g, x, y, w, h, t) {
  g.save();
  const gr = g.createLinearGradient(x, 0, x + w, 0);
  gr.addColorStop(0, 'rgba(255,240,190,0)'); gr.addColorStop(0.5, 'rgba(255,245,210,0.42)'); gr.addColorStop(1, 'rgba(255,240,190,0)');
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  for (let i = 0; i < 12; i++) {
    const px = x + w * ((i * 0.37 + 0.1) % 1), py = y + h - ((t * 120 + i * 97) % h);
    g.globalAlpha = 0.8; sparkle(g, px, py, 2 + (i % 3), '#fffbe0');
  }
  g.restore();
}
function drawRide(g, p, G) { // player in balloon basket
  const x = p.cx, y = p.bottom, t = p.t;
  if (p.inv > 0 && Math.floor(p.inv * 14) % 2 === 0) g.globalAlpha = 0.5;
  drawBalloon(g, x, y, { t, captain: false });
  // riders
  drawBanni(g, { x: x - 8, y: y - 30, face: 1, sx: 1, sy: 1, pose: p.shootT > 0 ? 'jump' : 'idle', t, hp: Math.max(1, p.hp), glaze: p.glaze, power: p.power, scale: 0.8, angry: p.shootT > 0 });
  drawPickle(g, { x: x - 22, y: y - 30, face: 1, pose: 'idle', t, sx: 0.75, sy: 0.75 });
  // Captain Beze
  g.save(); g.translate(x + 12, y - 36); g.scale(0.85, 0.85);
  g.beginPath(); g.moveTo(-10, 0); g.quadraticCurveTo(-12, -18, 0, -26); g.quadraticCurveTo(12, -18, 10, 0); g.closePath(); fs(g, '#fffaf2', '#c9b08a', 1.6);
  rrect(g, -9, -18, 18, 7, 3); fs(g, '#7a5a3a');
  circ(g, -4, -14.5, 3.2); fs(g, '#9fd8ff', '#3a2a1a', 1.2); circ(g, 4, -14.5, 3.2); fs(g, '#9fd8ff', '#3a2a1a', 1.2);
  g.restore();
  drawBalloonFront(g, { cx: x, bottom: y });
  // cannon
  g.save(); g.translate(x + 26, y - 24); g.rotate(-0.08);
  rrect(g, -4, -7, 30, 14, 5); fs(g, '#5a5a62', '#2a2a32', 2); circ(g, 26, 0, 7); fs(g, '#3a3a42');
  if (p.shootT > 0) { circ(g, 34, 0, 9); fs(g, 'rgba(255,220,120,0.8)'); }
  g.restore();
  g.globalAlpha = 1;
}
// ---------- L4 ----------
function drawToad(g, x, y, o) {
  const t = o.t || 0, sq = o.squash || 0;
  g.save(); g.translate(x, y); g.scale((o.face || 1) * (1 + sq * 0.3), 1 - sq * 0.3);
  ell(g, -12, -4, 8, 5); fs(g, '#7a2a5a'); ell(g, 12, -4, 8, 5); fs(g, '#7a2a5a');
  g.beginPath(); g.ellipse(0, -16, 17, 15, 0, 0, TAU);
  const gr = g.createRadialGradient(-5, -22, 2, 0, -16, 18); gr.addColorStop(0, '#d86aa8'); gr.addColorStop(1, '#8a2a6a');
  fs(g, gr, '#5a1a4a', 2);
  for (const a of [-0.4, 0.1, 0.5]) { g.save(); g.translate(2, -30); g.rotate(a); ell(g, 0, -7, 3.5, 8); fs(g, '#5ab040', '#2e6a1a', 1.2); g.restore(); }
  circ(g, -7, -28, 6); fs(g, '#e8a0c8', '#5a1a4a', 1.5); circ(g, 7, -28, 6); fs(g, '#e8a0c8', '#5a1a4a', 1.5);
  if (!o.frozen) { circ(g, -6, -28, 2.8); fs(g, '#1a0a14'); circ(g, 8, -28, 2.8); fs(g, '#1a0a14'); brow(g, -7, -35, 8, 0.4, '#3a0a2a', 2); brow(g, 7, -35, 8, -0.4, '#3a0a2a', 2); }
  g.beginPath(); g.moveTo(-9, -12); g.quadraticCurveTo(0, -7, 9, -12); g.strokeStyle = '#3a0a2a'; g.lineWidth = 1.8; g.stroke();
  g.restore();
}
function drawLeech(g, x, y, o) {
  const t = o.t || 0;
  g.save(); g.translate(x, y); g.scale(o.face || 1, 1);
  const n = 5;
  for (let i = n - 1; i >= 0; i--) { const px = -12 + i * 6, py = Math.sin(t * 8 + i) * 2; ell(g, px, py, 6, 5.5); fs(g, i === n - 1 ? '#e8d8a8' : '#d8c48a', '#8a7a4a', 1.2); circ(g, px - 1, py - 1, 1.2); fs(g, '#fff8d8'); }
  circ(g, 14, -1, 2); fs(g, '#2a1a10');
  if (o.attached) { g.globalAlpha = 0.6; ell(g, 18, 1, 3, 2); fs(g, '#c04a4a'); }
  g.restore();
}
function drawKholodets(g, x, y, o) { // x,y bottom center
  const t = o.t || 0, s = o.s || 1, w = Math.sin(t * 7) * 0.06;
  g.save(); g.translate(x, y); g.scale(s * (1 + w), s * (1 - w));
  g.beginPath(); g.moveTo(-20, 0); g.quadraticCurveTo(-23, -30, -14, -34); g.lineTo(14, -34); g.quadraticCurveTo(23, -30, 20, 0); g.closePath();
  g.globalAlpha *= 0.88;
  const gr = g.createLinearGradient(0, -34, 0, 0); gr.addColorStop(0, '#f8e6b8'); gr.addColorStop(1, '#d8b878');
  fs(g, gr, '#9a7a3a', 2);
  g.globalAlpha = 1;
  for (const c of [[-9, -10, '#ff8a3a'], [8, -22, '#ff8a3a'], [10, -8, '#c97a6a'], [-6, -24, '#7ac04a']]) { circ(g, c[0], c[1], 3.4); fs(g, c[2]); }
  ell(g, -8, -28, 5, 2); fs(g, 'rgba(255,255,255,0.7)');
  if (o.crown) {
    g.save(); g.translate(0, -36);
    for (let i = 0; i < 3; i++) { g.save(); g.rotate(-0.5 + i * 0.5); g.beginPath(); g.moveTo(-4, 0); g.lineTo(0, -18); g.lineTo(4, 0); g.closePath(); fs(g, '#ff8a2a', '#a8420a', 1.4); for (let k = 0; k < 3; k++) line(g, -2, -4 - k * 4, 2, -5 - k * 4, '#c85a1a', 1); g.restore(); }
    for (const a of [-0.3, 0.3]) { g.save(); g.rotate(a); ell(g, 0, -22, 3, 7); fs(g, '#5ab040'); g.restore(); }
    g.restore();
  }
  if (!o.frozen) face2(g, 0, -20, 0.9, { angry: true, mouth: o.mouth || 'frown' });
  g.restore();
}
function drawRaft(g, x, y, w, o) {
  const t = o.t || 0;
  g.save(); g.globalAlpha *= o.alpha === undefined ? 1 : o.alpha;
  ell(g, x + w / 2, y + 8, w / 2, 11); fs(g, '#d8a058', '#8a5a1e', 2);
  ell(g, x + w / 2, y + 5, w / 2 - 4, 8); fs(g, '#eab870');
  for (let i = 0; i < 6; i++) { circ(g, x + 12 + i * (w - 24) / 5, y + 5 + (i % 2 ? 2 : -1), 1.8); fs(g, '#8a5a1e'); }
  g.restore();
}
function drawJellyPad(g, x, y, w, o) {
  const c = o.col || ['#7ae04a', '#3a9a2a'], sq = o.sq || 0;
  g.save(); g.translate(x + w / 2, y + 22); g.scale(1 + sq * 0.25, 1 - sq * 0.35);
  g.globalAlpha *= 0.9;
  g.beginPath(); g.moveTo(-w / 2, 0); g.quadraticCurveTo(-w / 2, -24, -w / 2 + 8, -24);
  for (let i = 0; i <= 4; i++) { const px = -w / 2 + 8 + i * (w - 16) / 4; g.lineTo(px, -24 - (i % 2 ? 4 : 0)); }
  g.quadraticCurveTo(w / 2, -24, w / 2, 0); g.closePath();
  const gr = g.createLinearGradient(0, -26, 0, 0); gr.addColorStop(0, c[0]); gr.addColorStop(1, c[1]);
  fs(g, gr, 'rgba(0,0,0,0.25)', 2);
  g.globalAlpha = 0.7; ell(g, -w / 4, -16, 6, 3); fs(g, '#ffffff');
  g.restore();
}
function drawGeyser(g, x, y, o) { // x,y = base center
  const h = o.h || 0, t = o.t || 0;
  g.save();
  ell(g, x, y, 26, 7); fs(g, '#4a2410', '#2a140a', 2);
  if (o.warn) { for (let i = 0; i < 3; i++) { circ(g, x - 12 + i * 12, y - 4 - ((t * 60 + i * 20) % 18), 3); fs(g, '#7a4a2a'); } }
  if (h > 4) {
    g.beginPath(); g.moveTo(x - 14, y); g.quadraticCurveTo(x - 10 + Math.sin(t * 20) * 3, y - h * 0.5, x - 8, y - h); g.quadraticCurveTo(x, y - h - 18, x + 8, y - h); g.quadraticCurveTo(x + 10 + Math.sin(t * 20 + 1) * 3, y - h * 0.5, x + 14, y); g.closePath();
    const gr = g.createLinearGradient(x - 14, 0, x + 14, 0); gr.addColorStop(0, '#4a2410'); gr.addColorStop(0.5, '#8a4e28'); gr.addColorStop(1, '#4a2410');
    fs(g, gr);
    for (let i = 0; i < 6; i++) { circ(g, x + Math.sin(t * 9 + i) * 16, y - h - 6 + ((t * 80 + i * 13) % 26), 4); fs(g, '#6a3a1e'); }
  }
  g.restore();
}
// ---------- L5 ----------
function drawCutlet(g, x, y, o) {
  const t = o.t || 0;
  g.save(); g.translate(x, y); g.scale(o.face || 1, 1);
  const st = Math.sin(t * 10) * 3;
  ell(g, -8 + st, -2, 6, 3); fs(g, '#3a1a0a'); ell(g, 8 - st, -2, 6, 3); fs(g, '#3a1a0a');
  ell(g, 0, -16, 21, 15);
  fs(g, o.armor ? '#5a2e14' : '#b8704a', '#2a1006', 2.2);
  if (o.armor) { for (const c of [[-10, -22], [6, -26], [12, -12], [-12, -10], [0, -16]]) { ell(g, c[0], c[1], 6, 4, c[0] * 0.05); fs(g, '#3a1a08', '#1a0804', 1); } }
  else { for (const c of [[-10, -20], [8, -22], [2, -10]]) { circ(g, c[0], c[1], 1.6); fs(g, '#7a3a1a'); } }
  if (!o.frozen) face2(g, 2, -18, 0.95, { angry: true, mouth: 'frown', white: '#fff0d0' });
  if (o.armor) { g.globalAlpha = 0.6; for (let i = 0; i < 3; i++) { circ(g, -8 + i * 8, -34 - ((t * 30 + i * 10) % 16), 3); fs(g, '#8a8a8a'); } }
  g.restore();
}
function drawKraut(g, x, y, o) {
  const t = o.t || 0;
  g.save(); g.translate(x, y); g.scale(o.face || 1, 1);
  const st = Math.sin(t * 8) * 3;
  line(g, -5, -10, -6 + st, 0, '#8a8a4a', 3); line(g, 5, -10, 6 - st, 0, '#8a8a4a', 3);
  ell(g, 0, -26, 16, 19); fs(g, '#e8e2a0', '#8a8a4a', 2);
  g.strokeStyle = '#b8b46a'; g.lineWidth = 1.5;
  for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(-12 + i * 4, -42 + (i % 2) * 4); g.quadraticCurveTo(-8 + i * 4, -26, -12 + i * 4, -10); g.stroke(); }
  // helmet (small pot)
  rrect(g, -14, -50, 28, 10, 4); fs(g, '#8a8a92', '#4a4a52', 1.8); line(g, -18, -44, 18, -44, '#4a4a52', 2.4);
  if (!o.frozen) face2(g, 2, -28, 0.85, { angry: true, mouth: 'frown' });
  // shield (pot lid)
  g.save(); g.translate(16, -22);
  ell(g, 0, 0, 7, 17); fs(g, '#a8a8b0', '#4a4a52', 2); circ(g, -2, 0, 3); fs(g, '#5a5a62');
  g.restore();
  g.restore();
}
function drawGolem(g, x, y, o) {
  const t = o.t || 0, sl = o.slam || 0;
  g.save(); g.translate(x, y); g.scale(o.face || 1, 1);
  if (o.flash) g.globalAlpha *= 0.6;
  rrect(g, -20, -12, 14, 12, 4); fs(g, '#5a3a2a'); rrect(g, 6, -12, 14, 12, 4); fs(g, '#5a3a2a');
  rrect(g, -28, -64, 56, 54, 12);
  const gr = g.createLinearGradient(0, -64, 0, -10); gr.addColorStop(0, '#9a6a4a'); gr.addColorStop(1, '#6a4028');
  fs(g, gr, '#3a2010', 2.4);
  for (const c of [[-14, -48, '#c97a5a'], [10, -54, '#ff8a3a'], [16, -30, '#c97a5a'], [-16, -24, '#e8c070']]) { rrect(g, c[0] - 5, c[1] - 4, 10, 8, 3); fs(g, c[2], '#3a2010', 1); }
  // tin rim
  rrect(g, -30, -68, 60, 8, 3); fs(g, '#a8a8b0', '#4a4a52', 1.8);
  if (!o.frozen) face2(g, 2, -42, 1.2, { angry: true, mouth: 'frown' });
  const ay = sl > 0 ? -70 + sl * 50 : -40;
  for (const s of [-1, 1]) { line(g, s * 26, -44, s * 36, ay, '#6a4028', 7); circ(g, s * 36, ay, 8); fs(g, '#7a4a30', '#3a2010', 2); }
  g.restore();
}
function drawRusk(g, x, y, o) {
  g.save(); g.translate(x, y); g.scale(o.face || 1, 1);
  rrect(g, -18, -30, 36, 30, 6); fs(g, '#d89a50', '#7a4a1a', 2);
  rrect(g, -14, -26, 28, 22, 4); fs(g, '#f0c070');
  for (let i = 0; i < 8; i++) { g.save(); g.translate(-12 + (i * 7) % 24, -24 + (i * 5) % 18); g.rotate(i); g.fillStyle = '#ffffff'; g.fillRect(-1.5, -1.5, 3, 3); g.restore(); }
  if (!o.frozen) face2(g, -2, -18, 0.85, { angry: true, mouth: 'o' });
  rrect(g, 14, -18, 10, 8, 3); fs(g, '#7a4a1a');
  g.restore();
}
function drawSalt(g, x, y, t) { g.save(); g.translate(x, y); g.rotate(t * 8); g.fillStyle = '#ffffff'; g.strokeStyle = '#9ab'; g.lineWidth = 1; g.fillRect(-4, -4, 8, 8); g.strokeRect(-4, -4, 8, 8); g.restore(); }
function drawCleaver(g, x, y, o) { // x = center, y = blade bottom
  g.save();
  line(g, x, o.top, x, y - 56, '#5a5a62', 4);
  g.translate(x, y);
  rrect(g, -22, -56, 44, 56, 4);
  const gr = g.createLinearGradient(-22, 0, 22, 0); gr.addColorStop(0, '#cfd4da'); gr.addColorStop(0.5, '#f4f6f8'); gr.addColorStop(1, '#a8adb4');
  fs(g, gr, '#5a5e66', 2);
  circ(g, 10, -46, 4); fs(g, '#5a5e66');
  g.fillStyle = 'rgba(160,60,40,0.5)'; g.fillRect(-20, -12, 18, 4);
  line(g, -20, -2, 20, -2, '#ffffff', 1.5);
  g.restore();
}
function drawPan(g, x, y, w, o) { // frying pan platform, rot around center
  g.save(); g.translate(x + w / 2, y + 6); g.rotate(o.rot || 0);
  ell(g, 0, 0, w / 2, 9); fs(g, '#3a3a42', '#1a1a22', 2);
  ell(g, 0, -2, w / 2 - 6, 6); fs(g, '#5a5a62');
  rrect(g, w / 2 - 4, -4, 34, 8, 4); fs(g, '#5a3a2a', '#2a1a10', 1.5);
  g.restore();
}
function drawLid(g, x, y, o) {
  g.save(); g.translate(x, y); if (o.shake) g.translate(Math.sin((o.t || 0) * 60) * 2, 0);
  ell(g, 0, 0, 30, 10); fs(g, '#a8a8b0', '#4a4a52', 2);
  ell(g, 0, -2, 24, 6); fs(g, '#c8c8d0');
  rrect(g, -8, -14, 16, 8, 4); fs(g, '#3a3a42');
  g.restore();
}
function drawMasher(g, x, y, o) { // y = bottom of head
  g.save();
  line(g, x, o.top, x, y - 18, '#7a5a3a', 8);
  rrect(g, x - 36, y - 18, 72, 18, 5); fs(g, '#a8a8b0', '#4a4a52', 2);
  for (let i = 0; i < 6; i++) { circ(g, x - 26 + i * 10.5, y - 9, 2.6); fs(g, '#4a4a52'); }
  g.restore();
}
function drawToast(g, x, y, w, o) {
  g.save(); g.translate(x + w / 2, y + 8); g.rotate(o.tilt || 0);
  ell(g, 0, 2, w / 2, 12); fs(g, '#c98a40', '#7a4a1a', 2);
  ell(g, 0, -1, w / 2 - 5, 8); fs(g, '#f2c070');
  for (let i = 0; i < 5; i++) { circ(g, -w / 3 + i * w / 6, -1 + (i % 2) * 2, 1.4); fs(g, '#c98a40'); }
  g.restore();
}
function drawCauldronBot(g, x, y, o) { // x = center, y = feet
  const t = o.t || 0, step = o.step || 0;
  g.save(); g.translate(x, y);
  if (o.flash) g.globalAlpha *= 0.6 + Math.sin(t * 50) * 0.4;
  // legs
  for (const s of [-1, 1]) {
    const lift = Math.max(0, Math.sin(step + (s > 0 ? Math.PI : 0))) * 16;
    g.save(); g.translate(s * 46, -110);
    line(g, 0, 0, s * 8, 50 - lift * 0.5, '#6a6e76', 14); line(g, s * 8, 50 - lift * 0.5, 0, 104 - lift, '#7a7e86', 14);
    circ(g, s * 8, 50 - lift * 0.5, 11); fs(g, '#8a8e96', '#3a3e46', 2);
    rrect(g, -24, 98 - lift, 48, 14, 6); fs(g, '#7a4a2a', '#3a2010', 2);
    g.restore();
  }
  // body cauldron
  g.save(); g.translate(0, -180);
  g.beginPath(); g.moveTo(-96, -60); g.quadraticCurveTo(-112, 40, -60, 84); g.lineTo(60, 84); g.quadraticCurveTo(112, 40, 96, -60); g.closePath();
  const gr = g.createRadialGradient(-30, -10, 10, 0, 10, 130); gr.addColorStop(0, '#d8844a'); gr.addColorStop(0.7, '#9a4a22'); gr.addColorStop(1, '#6a2a10');
  fs(g, gr, '#3a1406', 3);
  for (let i = 0; i < 6; i++) { circ(g, -80 + i * 32, -44, 3); fs(g, '#5a2a10'); }
  line(g, -40, 0, -20, 30, '#4a1a08', 3); line(g, -20, 30, -30, 54, '#4a1a08', 3);
  // rim + lid
  rrect(g, -104, -70, 208, 16, 8); fs(g, '#7a7e86', '#3a3e46', 2.4);
  if (o.lidOpen) {
    ell(g, 0, -64, 90, 14); fs(g, '#ffb03a');
    const gl = g.createRadialGradient(0, -64, 4, 0, -64, 90); gl.addColorStop(0, 'rgba(255,240,150,0.9)'); gl.addColorStop(1, 'rgba(255,140,40,0)');
    g.fillStyle = gl; circ(g, 0, -64, 90); g.fill();
    for (let i = 0; i < 4; i++) { circ(g, -40 + i * 26, -72 - ((t * 40 + i * 15) % 30), 6); fs(g, 'rgba(120,200,90,0.8)'); }
  } else {
    ell(g, 0, -70, 96, 14); fs(g, '#5a5e66', '#2a2e36', 2);
  }
  // valves
  const vs = o.valves || [];
  vs.forEach((v, i) => {
    if (v.dx) { line(g, Math.sign(v.dx) * 92, v.dy, v.dx, v.dy, '#3a3e46', 13); line(g, Math.sign(v.dx) * 92, v.dy, v.dx, v.dy, '#8a8e96', 8); }
    else { line(g, 0, -72, 0, v.dy, '#3a3e46', 12); line(g, 0, -72, 0, v.dy, '#8a8e96', 7); }
    if (v.broken) { for (let k = 0; k < 3; k++) { circ(g, v.dx + Math.sin(t * 3 + k) * 6, v.dy - 14 - ((t * 50 + k * 14) % 40), 6 + k); fs(g, 'rgba(255,255,255,0.45)'); } }
    if (v.broken) { circ(g, v.dx, v.dy, 10); fs(g, '#3a3a3a'); return; }
    g.save(); g.translate(v.dx, v.dy); g.rotate(t * 2);
    circ(g, 0, 0, 15); fs(g, '#e8c040', '#7a5a10', 2.4);
    for (let k = 0; k < 4; k++) { g.save(); g.rotate(k * Math.PI / 2); g.fillStyle = '#7a5a10'; g.fillRect(-2, -15, 4, 30); g.restore(); }
    circ(g, 0, 0, 5); fs(g, '#ff5a3a');
    g.restore();
    circ(g, v.dx, v.dy, 22 + Math.sin(t * 6) * 3); fs(g, 'rgba(255,220,80,0.18)');
  });
  // face cracks/eyes
  ell(g, -34, 10, 14, 10); fs(g, '#2a0a04'); ell(g, 34, 10, 14, 10); fs(g, '#2a0a04');
  circ(g, -32, 12, 5); fs(g, '#ffb03a'); circ(g, 36, 12, 5); fs(g, '#ffb03a');
  g.restore();
  // arms + ladle
  const sw = o.swing || 0;
  g.save(); g.translate(-100, -200); g.rotate(-0.6 + sw);
  line(g, 0, 0, -10, 70, '#7a7e86', 14); circ(g, 0, 0, 12); fs(g, '#8a8e96', '#3a3e46', 2);
  g.translate(-10, 70); line(g, 0, 0, 0, 90, '#9aa0a8', 8);
  ell(g, 0, 104, 30, 18); fs(g, '#b8bcc4', '#4a4e56', 2.4); ell(g, 0, 100, 24, 10); fs(g, '#d89a3a');
  g.restore();
  g.save(); g.translate(100, -200); g.rotate(0.4);
  line(g, 0, 0, 14, 70, '#7a7e86', 14); circ(g, 0, 0, 12); fs(g, '#8a8e96', '#3a3e46', 2);
  rrect(g, 0, 64, 34, 30, 8); fs(g, '#8a8e96', '#3a3e46', 2);
  g.restore();
  // Baron on console
  if (o.baron !== false) {
    g.save(); g.translate(0, -262);
    rrect(g, -40, 0, 80, 20, 6); fs(g, '#8a8e96', '#3a3e46', 2);
    for (let i = 0; i < 4; i++) { circ(g, -26 + i * 17, 10, 3.4); fs(g, ['#ff4a4a', '#4aff6a', '#ffd24a', '#4ab0ff'][i]); }
    drawBaron(g, 0, 4, { t, s: 0.9 });
    g.restore();
  }
  g.restore();
}
// ---------- bonus ----------
function drawBooster(g, x, y, w, o) {
  const t = o.t || 0, dir = o.dir || 1;
  g.save(); g.translate(x, y);
  rrect(g, 0, -8, w, 10, 5);
  const gr = g.createLinearGradient(0, 0, w, 0); ['#ff5a7a', '#ffb03a', '#ffe14d', '#6ae07a', '#5ab0ff', '#b07aff'].forEach((c, i) => gr.addColorStop(i / 5, c));
  fs(g, gr, 'rgba(255,255,255,0.9)', 2);
  for (let i = 0; i < 3; i++) {
    const px = ((t * 120 * dir + i * w / 3) % w + w) % w;
    g.save(); g.translate(px, -3); g.scale(dir, 1); g.beginPath(); g.moveTo(-5, -4); g.lineTo(2, 0); g.lineTo(-5, 4); g.strokeStyle = '#fff'; g.lineWidth = 2.2; g.stroke(); g.restore();
  }
  g.restore();
}
function drawCookieMan(g, x, y, o) {
  const t = o.t || 0, j = Math.abs(Math.sin(t * 6 + (o.ph || 0))) * (o.cheer ? 8 : 2);
  g.save(); g.translate(x, y - j);
  g.beginPath(); g.moveTo(-6, -10); g.lineTo(-12, 0); g.lineTo(-4, 0); g.lineTo(0, -6); g.lineTo(4, 0); g.lineTo(12, 0); g.lineTo(6, -10);
  g.lineTo(16, -22 - (o.cheer ? 8 : 0)); g.lineTo(10, -28 - (o.cheer ? 8 : 0)); g.lineTo(5, -26); g.lineTo(-5, -26); g.lineTo(-10, -28 - (o.cheer ? 8 : 0)); g.lineTo(-16, -22 - (o.cheer ? 8 : 0)); g.closePath();
  fs(g, '#d89048', '#8a5018', 2);
  circ(g, 0, -34, 10); fs(g, '#d89048', '#8a5018', 2);
  circ(g, -3, -36, 1.6); fs(g, '#3a1a08'); circ(g, 3, -36, 1.6); fs(g, '#3a1a08');
  g.beginPath(); g.arc(0, -33, 3, 0.3, Math.PI - 0.3); g.strokeStyle = '#fff'; g.lineWidth = 1.4; g.stroke();
  for (const b of [-18, -12]) { circ(g, 0, b, 1.6); fs(g, '#ff5a7a'); }
  g.restore();
}
