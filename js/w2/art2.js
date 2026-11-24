'use strict';
// ================= w2/art2.js : art for World 2 levels 2-4 … 2-10 =================

// ---------- relatives & friends ----------
// a cucumber person: o.h height, o.w width, o.col body colours, o.mustache, o.hat ('straw'|'tricorn'), o.glasses, o.shawl, o.bun, o.stripes
function drawCucumberFolk(g, x, y, o) {
  g.save(); g.translate(x, y); g.scale((o.face || 1) * (o.s || 1), o.s || 1);
  const h = o.h || 44, w = o.w || 22, t = o.t || 0, hop = o.happy ? Math.abs(Math.sin(t * 8)) * 5 : 0;
  g.translate(0, -hop);
  line(g, -w * 0.2, -6, -w * 0.24, 0, '#2b5a1e', 2.8); line(g, w * 0.2, -6, w * 0.24, 0, '#2b5a1e', 2.8);
  rrect(g, -w / 2, -h, w, h - 4, w / 2);
  const c = o.col || ['#3d7f2c', '#5fa843'];
  const gr = g.createLinearGradient(-w / 2, 0, w / 2, 0); gr.addColorStop(0, c[0]); gr.addColorStop(1, c[1]); fs(g, gr, '#244d18', 2);
  if (o.stripes) { g.save(); rrect(g, -w / 2, -h, w, h - 4, w / 2); g.clip(); for (let i = -2; i <= 2; i++) { g.fillStyle = 'rgba(220,240,180,0.35)'; g.fillRect(i * w / 5 - 2, -h, 3, h); } g.restore(); }
  for (let i = 0; i < 5; i++) { circ(g, -w * 0.3 + hash2(i, 3) * w * 0.6, -h + 8 + hash2(i, 9) * (h - 16), 1.3); fs(g, '#a8dc8a'); }
  const ah = o.happy || o.wave ? -h + 6 + Math.sin(t * 10) * 3 : -h * 0.4;
  line(g, -w / 2 + 1, -h * 0.55, -w / 2 - 6, ah, '#2b5a1e', 2.4); line(g, w / 2 - 1, -h * 0.55, w / 2 + 6, ah, '#2b5a1e', 2.4);
  const ey = -h * 0.72;
  for (const s of [-1, 1]) { ell(g, s * w * 0.2, ey, 3.4, 4.2); fs(g, '#fff', '#1d3a12', 1); circ(g, s * w * 0.2 + 0.6, ey + 0.5, 1.7); fs(g, '#111'); }
  if (o.glasses) { for (const s of [-1, 1]) { circ(g, s * w * 0.2, ey, 5); g.strokeStyle = '#3a2a1a'; g.lineWidth = 1.4; g.stroke(); } line(g, -w * 0.2 + 5, ey, w * 0.2 - 5, ey, '#3a2a1a', 1.2); }
  if (o.mustache) { g.beginPath(); g.moveTo(0, ey + 9); g.quadraticCurveTo(-8, ey + 6, -11, ey + 12); g.quadraticCurveTo(-5, ey + 13, 0, ey + 10); g.quadraticCurveTo(5, ey + 13, 11, ey + 12); g.quadraticCurveTo(8, ey + 6, 0, ey + 9); fs(g, '#3a2a1a'); }
  else { g.beginPath(); g.arc(0, ey + 9, 3, 0.2, Math.PI - 0.2); g.strokeStyle = '#1d3a12'; g.lineWidth = 1.5; g.stroke(); }
  if (o.shawl) { g.beginPath(); g.moveTo(-w / 2 - 2, -h * 0.45); g.quadraticCurveTo(0, -h * 0.3, w / 2 + 2, -h * 0.45); g.lineTo(w / 2 - 2, -h * 0.3); g.quadraticCurveTo(0, -h * 0.12, -w / 2 + 2, -h * 0.3); g.closePath(); fs(g, '#c84a7a', '#7a1a4a', 1.2); }
  if (o.bun) { circ(g, 0, -h - 3, 6); fs(g, '#e8e0d0', '#9a9080', 1.2); }
  if (o.hat === 'straw') { ell(g, 0, -h + 2, w * 0.95, 4); fs(g, '#f2d27a', '#a8861a', 1.3); rrect(g, -w * 0.4, -h - 8, w * 0.8, 10, 4); fs(g, '#f2d27a', '#a8861a', 1.3); line(g, -w * 0.4, -h, w * 0.4, -h, '#e2363c', 2); }
  if (o.hat === 'tricorn') { g.beginPath(); g.moveTo(-w * 0.9, -h + 2); g.quadraticCurveTo(0, -h - 22, w * 0.9, -h + 2); g.quadraticCurveTo(0, -h - 6, -w * 0.9, -h + 2); fs(g, '#2a1a1a', '#0a0404', 1.4); circ(g, 0, -h - 9, 3); fs(g, '#fff'); }
  g.restore();
}
function drawZelenets(g, x, y, o) { drawCucumberFolk(g, x, y, Object.assign({ h: 54, w: 26, mustache: true, hat: 'straw' }, o)); }
function drawKabachok(g, x, y, o) { drawCucumberFolk(g, x, y, Object.assign({ h: 58, w: 32, col: ['#5a9a3a', '#9ad06a'], stripes: true }, o)); }
function drawGrandma(g, x, y, o) { drawCucumberFolk(g, x, y, Object.assign({ h: 36, w: 22, glasses: true, shawl: true, bun: true }, o)); }
// banana folk: Banni's family (o.kind 'mom' | 'dad' | 'kid')
function drawBananaFolk(g, x, y, o) {
  const sc = o.kind === 'kid' ? 0.75 : 1.05;
  drawBanni(g, { x, y, face: o.face || 1, sx: 1, sy: 1, pose: o.happy ? 'win' : 'idle', t: o.t || 0, hp: 3, scale: sc });
  g.save(); g.translate(x, y); g.scale((o.face || 1) * sc, sc);
  if (o.kind === 'mom') { g.beginPath(); g.moveTo(-14, -60); g.quadraticCurveTo(0, -74, 14, -60); g.lineTo(10, -54); g.quadraticCurveTo(0, -62, -10, -54); g.closePath(); fs(g, '#ff6fa8', '#a02a5a', 1.4); circ(g, 14, -58, 3); fs(g, '#ff6fa8'); }
  if (o.kind === 'dad') { ell(g, 2, -64, 20, 4); fs(g, '#f2d27a', '#a8861a', 1.3); rrect(g, -9, -76, 22, 12, 5); fs(g, '#f2d27a', '#a8861a', 1.3); g.beginPath(); g.moveTo(4, -38); g.quadraticCurveTo(-4, -40, -8, -35); g.quadraticCurveTo(0, -36, 4, -36); g.quadraticCurveTo(10, -36, 14, -35); g.quadraticCurveTo(10, -40, 4, -38); fs(g, '#7a4a1a'); }
  g.restore();
}

// ---------- 2-4 Mango falls ----------
function drawPepper(g, x, y, o) { // jalapeño turret, x,y bottom center
  g.save(); g.translate(x, y); g.scale(o.face || 1, 1);
  const k = o.charge || 0;
  g.beginPath(); g.moveTo(-10, -2); g.quadraticCurveTo(-14, -30, -4, -44); g.quadraticCurveTo(10, -46, 12, -30); g.quadraticCurveTo(14, -10, 6, -2); g.closePath();
  const gr = g.createLinearGradient(-12, 0, 12, 0); gr.addColorStop(0, k > 0.5 ? '#e2363c' : '#2e7a26'); gr.addColorStop(1, k > 0.5 ? '#ff7a5a' : '#5ab84a'); fs(g, gr, '#1a3a12', 1.8);
  line(g, 0, -44, -4, -52, '#3a6a1a', 3);
  for (const s of [-1, 1]) { ell(g, s * 4 + 2, -30, 2.6, 3.2); fs(g, '#fff', '#111', 0.8); circ(g, s * 4 + 3, -29.5, 1.2); fs(g, '#111'); line(g, s * 4 - 1, -36, s * 4 + 4, -34 + s, '#111', 1.6); }
  ell(g, 8, -20, 3 + k * 2, 2 + k * 2); fs(g, '#1a0a0a');
  g.restore();
}
function drawFireball(g, x, y, t) { const gl = g.createRadialGradient(x, y, 1, x, y, 12); gl.addColorStop(0, '#fff6a0'); gl.addColorStop(0.5, '#ffa03a'); gl.addColorStop(1, 'rgba(226,54,60,0)'); g.fillStyle = gl; circ(g, x, y, 12); g.fill(); circ(g, x, y, 5 + Math.sin(t * 20)); fs(g, '#fff6c0'); }
function drawGull(g, x, y, o) { // cabbage seagull
  g.save(); g.translate(x, y); g.scale(o.face || 1, 1);
  const fl = Math.sin((o.t || 0) * 12) * 0.6;
  for (const s of [-1, 1]) { g.save(); g.rotate(s === -1 ? -0.3 - fl : 0.3 + fl); g.beginPath(); g.moveTo(0, -2); g.quadraticCurveTo(s * -6, -20, s * -26, -12); g.quadraticCurveTo(s * -14, -4, 0, 2); fs(g, '#cfe8b0', '#4a7a2a', 1.3); g.restore(); }
  ell(g, 0, 0, 15, 11); fs(g, '#9ad06a', '#3a6a1a', 1.6);
  for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(-4 + i * 4, -2, 7 - i, Math.PI * 1.1, Math.PI * 1.9); g.strokeStyle = 'rgba(40,90,20,0.5)'; g.lineWidth = 1.2; g.stroke(); }
  g.beginPath(); g.moveTo(12, -2); g.lineTo(22, 1); g.lineTo(12, 4); g.closePath(); fs(g, '#ffb03a', '#a86010', 1);
  circ(g, 8, -4, 2.4); fs(g, '#fff', '#111', 0.8); circ(g, 8.6, -4, 1.1); fs(g, '#111');
  g.restore();
}
function drawMangoSlice(g, x, y, w) { // a slice of mango as a platform (x,y top-left)
  g.beginPath(); g.moveTo(x, y + 4); g.quadraticCurveTo(x + w / 2, y - 6, x + w, y + 4); g.quadraticCurveTo(x + w / 2, y + 22, x, y + 4); g.closePath();
  const gr = g.createLinearGradient(0, y, 0, y + 18); gr.addColorStop(0, '#ffc23a'); gr.addColorStop(1, '#f08a1a'); fs(g, gr, '#a8500a', 1.8);
  g.strokeStyle = 'rgba(255,240,180,0.7)'; g.lineWidth = 1.3; for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(x + i * w / 5, y + 1); g.lineTo(x + i * w / 5 + 3, y + 10); g.stroke(); }
}
function drawFallStream(g, x, y, w, h, t) { // mango-juice waterfall column
  const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, 'rgba(255,170,40,0.55)'); gr.addColorStop(0.5, 'rgba(255,210,90,0.75)'); gr.addColorStop(1, 'rgba(255,170,40,0.55)');
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(255,250,210,0.7)'; g.lineWidth = 2;
  for (let i = 0; i < Math.max(3, w / 12); i++) { const sx = x + 6 + (i * 13) % Math.max(1, w - 12), off = ((t * 260 + i * 97) % 120); for (let yy = y + off - 120; yy < y + h; yy += 120) { g.beginPath(); g.moveTo(sx, Math.max(y, yy)); g.lineTo(sx, Math.min(y + h, yy + 50)); g.stroke(); } }
}

// ---------- 2-5 Volcano of hot jam ----------
function drawGarlicArcher(g, x, y, o) { // garlic crossbowman, x,y bottom
  g.save(); g.translate(x, y); g.scale(o.face || 1, 1);
  g.beginPath(); g.moveTo(0, -50); g.quadraticCurveTo(-18, -34, -14, -10); g.quadraticCurveTo(0, 2, 14, -10); g.quadraticCurveTo(18, -34, 0, -50); g.closePath(); fs(g, '#f6f0e4', '#9a8a70', 1.8);
  for (const s of [-1, 1]) line(g, s * 6, -44, s * 9, -8, 'rgba(160,140,110,0.6)', 1.4);
  line(g, 0, -50, 2, -58, '#9a8a70', 2);
  for (const s of [-1, 1]) { ell(g, s * 5, -28, 2.6, 3); fs(g, '#fff', '#111', 0.8); circ(g, s * 5 + 0.8, -27.5, 1.2); fs(g, '#111'); line(g, s * 2, -33, s * 8, -31, '#111', 1.6); }
  // crossbow
  g.save(); g.translate(10, -20); g.rotate(-0.1 - (o.draw || 0) * 0.15);
  rrect(g, 0, -2, 22, 4, 2); fs(g, '#7a4a1a'); g.beginPath(); g.moveTo(18, -10); g.quadraticCurveTo(24, 0, 18, 10); g.strokeStyle = '#5a3414'; g.lineWidth = 2.5; g.stroke();
  g.restore();
  g.restore();
}
function drawLavaRadish(g, x, y, o) { // radish dripping with jam
  g.save(); g.translate(x, y); g.rotate(o.rot || 0);
  ell(g, 0, 0, 14, 15); fs(g, '#e2363c', '#7a1a14', 1.8);
  g.beginPath(); g.moveTo(-3, 13); g.lineTo(0, 24); g.lineTo(3, 13); fs(g, '#fff0f0');
  for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(0, -13); g.quadraticCurveTo(-10 + i * 10, -26, -8 + i * 8, -30); g.strokeStyle = '#3a8a2a'; g.lineWidth = 3; g.stroke(); }
  for (const s of [-1, 1]) { circ(g, s * 5, -2, 2.4); fs(g, '#fff6a0'); circ(g, s * 5, -2, 1.1); fs(g, '#111'); }
  g.beginPath(); g.arc(0, 5, 4, 0, Math.PI); fs(g, '#5a0a0a');
  g.restore();
}
function drawHorseradish(g, x, y, o) { // Bosun Horseradish, x,y = feet
  g.save(); g.translate(x, y); g.scale((o.face || 1) * (o.sq ? 1.15 : 1), o.sq ? 0.85 : 1);
  const t = o.t || 0, fl = o.flash;
  // body: a gnarly root
  g.beginPath(); g.moveTo(-34, -8); g.quadraticCurveTo(-42, -70, -18, -120); g.quadraticCurveTo(0, -134, 18, -120); g.quadraticCurveTo(42, -70, 34, -8); g.quadraticCurveTo(0, 6, -34, -8); g.closePath();
  const gr = g.createLinearGradient(-40, 0, 40, 0); gr.addColorStop(0, fl ? '#fff' : '#d8c8a8'); gr.addColorStop(0.5, fl ? '#fff6e0' : '#f2e6cc'); gr.addColorStop(1, fl ? '#fff' : '#c8b48a'); fs(g, gr, '#7a6a4a', 3);
  g.strokeStyle = 'rgba(120,100,60,0.5)'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-26 + i * 9, -100 + (i % 2) * 20); g.lineTo(-22 + i * 9, -86 + (i % 2) * 20); g.stroke(); }
  // leaves on top + bosun cap
  for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-4 + i * 3, -124); g.quadraticCurveTo(-30 + i * 20, -160, -18 + i * 14, -170); g.quadraticCurveTo(-10 + i * 14, -150, 2 + i * 3, -124); fs(g, '#4cb84a', '#1a5a1a', 1.4); }
  rrect(g, -24, -132, 48, 12, 5); fs(g, '#1a3a6a', '#0a1a3a', 1.6); rrect(g, -18, -140, 36, 10, 4); fs(g, '#fff', '#8a8a8a', 1.2);
  // face
  if (o.dizzy) { for (const s of [-1, 1]) { g.save(); g.translate(s * 12, -88); g.rotate(t * 8 * s); g.beginPath(); for (let a = 0; a < 10; a += 0.3) g.lineTo(Math.cos(a) * a * 0.7, Math.sin(a) * a * 0.7); g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; g.stroke(); g.restore(); } }
  else for (const s of [-1, 1]) { ell(g, s * 12, -88, 7, 8); fs(g, '#fff', '#3a2a1a', 1.6); circ(g, s * 12 + 2, -86, 3); fs(g, '#111'); line(g, s * 4, -100, s * 20, -96 - (o.angry ? 4 : 0), '#3a2a1a', 4); }
  g.beginPath(); g.moveTo(-12, -66); g.quadraticCurveTo(0, -60, 12, -66); g.strokeStyle = '#3a2a1a'; g.lineWidth = 3; g.stroke();
  // bosun's pipe
  g.save(); g.translate(10, -64); g.rotate(-0.4 + (o.playing ? Math.sin(t * 20) * 0.08 : 0));
  rrect(g, 0, -4, 34, 8, 4); fs(g, '#c8a040', '#6a4a10', 1.5); circ(g, 34, 0, 7); fs(g, '#c8a040', '#6a4a10', 1.5);
  g.restore();
  if (o.playing) for (let i = 0; i < 3; i++) { const k = (t * 1.5 + i / 3) % 1; g.save(); g.globalAlpha = 1 - k; g.font = '900 18px Nunito'; g.fillStyle = '#ffe14d'; g.fillText('♪', 50 + k * 30, -80 - k * 50 + i * 6); g.restore(); }
  g.restore();
}

// ---------- 2-6 Lemonade sea ----------
function drawBoatRide(g, p, G) { // the heroes in the watermelon boat with a coconut cannon
  const x = p.cx, y = p.bottom, t = p.t;
  if (p.inv > 0 && Math.floor(p.inv * 14) % 2 === 0) g.globalAlpha = 0.5;
  g.save(); g.translate(x, y - 8);
  line(g, -4, -36, -4, -120, '#8a5a2a', 4);
  g.save(); g.translate(-4, -116); g.beginPath(); g.moveTo(2, 0); g.quadraticCurveTo(40, 26, 32, 76); g.quadraticCurveTo(14, 72, 2, 78); g.closePath(); fs(g, '#7ad04a', '#2e6a1a', 1.8); line(g, 2, 2, 2, 76, '#2e6a1a', 1.4); g.restore();
  g.restore();
  drawPickle(g, { x: x - 26, y: y - 30, face: 1, pose: 'idle', t, sx: 0.8, sy: 0.8 });
  drawBanni(g, { x: x + 12, y: y - 30, face: 1, sx: 1, sy: 1, pose: p.shootT > 0 ? 'jump' : 'idle', t, hp: Math.max(1, p.hp), scale: 0.8, angry: p.shootT > 0 });
  g.save(); g.translate(x, y - 8); g.beginPath(); g.rect(-70, -26, 140, 40); g.clip(); drawBoatHull(g, { flesh: false }); g.restore();
  g.save(); g.translate(x + 40, y - 30); rrect(g, -4, -7, 30, 14, 6); fs(g, '#7a4a1e', '#3a1e08', 2); circ(g, 26, 0, 7); fs(g, '#3a1e08'); if (p.shootT > 0) { circ(g, 34, 0, 9); fs(g, 'rgba(255,240,200,0.85)'); } g.restore();
  g.globalAlpha = 1;
}
function drawJarBoat(g, x, y, o) { // a pirate rowing in a floating jar
  g.save(); g.translate(x, y);
  rrect(g, -26, -30, 52, 34, 12); fs(g, 'rgba(200,230,180,0.85)', '#4a6a3a', 2);
  drawCucumberFolk(g, 0, -12, { h: 30, w: 16, t: o.t, hat: 'tricorn', face: -1 });
  rrect(g, -26, -34, 52, 8, 3); fs(g, '#c8a040', '#6a4a10', 1.4);
  g.save(); g.translate(-22, -18); g.rotate(-0.4); rrect(g, -18, -3, 20, 6, 3); fs(g, '#5a5a62', '#2a2a32', 1.5); g.restore();
  g.restore();
}
function drawFrigate(g, x, y, o) { // «Кислая Селёдка»: a fish-shaped pirate ship (ref-frigate.jpg), x,y = waterline center
  g.save(); g.translate(x, y); g.scale(-1, 1);
  const t = o.t || 0, fl = o.flash;
  // mast with the skull flag
  line(g, 20, -60, 20, -230, '#e8e0d0', 9); line(g, 20, -60, 20, -230, '#b8b0a0', 3);
  circ(g, 20, -246, 24); fs(g, fl ? '#fff' : '#f2ead8', '#6a6050', 2); for (const s of [-1, 1]) { circ(g, 20 + s * 9, -248, 6); fs(g, '#2a2020'); } rrect(g, 10, -234, 20, 8, 2); fs(g, '#f2ead8', '#6a6050', 1);
  // deck
  g.beginPath(); g.moveTo(-60, -60); g.lineTo(150, -70); g.lineTo(130, -40); g.lineTo(-50, -36); g.closePath(); fs(g, '#8a5a2a', '#4a2c10', 2);
  for (let i = 0; i < 6; i++) { rrect(g, -30 + i * 28, -84, 10, 18, 3); fs(g, '#6a4a2a'); }
  // the fish body
  g.beginPath(); g.moveTo(-120, 0); g.quadraticCurveTo(-110, -60, -20, -50); g.lineTo(150, -56); g.quadraticCurveTo(200, -40, 210, 0); g.quadraticCurveTo(190, 40, 120, 44); g.lineTo(-40, 40); g.quadraticCurveTo(-110, 40, -120, 0); g.closePath();
  const gr = g.createLinearGradient(0, -56, 0, 44); gr.addColorStop(0, fl ? '#fff' : '#8aa0a8'); gr.addColorStop(1, fl ? '#fff' : '#4a6068'); fs(g, gr, '#2a3a40', 3);
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { g.beginPath(); g.arc(-10 + i * 26, -20 + j * 26, 10, Math.PI * 0.2, Math.PI * 0.8); g.strokeStyle = 'rgba(30,50,60,0.4)'; g.lineWidth = 1.6; g.stroke(); }
  // tail
  g.beginPath(); g.moveTo(200, -10); g.lineTo(250, -50); g.lineTo(240, 0); g.lineTo(250, 46); g.lineTo(200, 14); g.closePath(); fs(g, '#6a8088', '#2a3a40', 2);
  // cannons
  for (let i = 0; i < 3; i++) { rrect(g, 20 + i * 50, -10, 26, 14, 4); fs(g, '#3a3a42', '#1a1a22', 1.4); circ(g, 20 + i * 50, -3, 5); fs(g, '#111'); }
  // mouth & eye
  g.beginPath(); g.moveTo(-120, 0); g.quadraticCurveTo(-90, o.open ? 40 : 14, -50, 12); g.quadraticCurveTo(-90, -4, -120, 0); fs(g, '#e87a8a', '#5a1a2a', 2);
  for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-112 + i * 12, 2); g.lineTo(-108 + i * 12, 10); g.lineTo(-104 + i * 12, 2); fs(g, '#fff'); }
  circ(g, -70, -26, 11); fs(g, '#fff6e0', '#2a3a40', 2); circ(g, -73, -24, 5); fs(g, '#111'); line(g, -86, -40, -56, -32, '#2a3a40', 4);
  g.restore();
}

// ---------- 2-7 Banana homeland ----------
function drawSpider(g, x, y, o) { // salted spider hanging on its thread; x,y = body center
  if (o.threadY !== undefined) line(g, x, o.threadY, x, y - 12, 'rgba(240,240,240,0.7)', 1.2);
  g.save(); g.translate(x, y);
  const k = Math.sin((o.t || 0) * 10) * 0.2;
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const a = (i - 1.5) * 0.45 + k * (i % 2 ? 1 : -1); g.beginPath(); g.moveTo(s * 6, 0); g.quadraticCurveTo(s * 16, -10 + i * 4, s * (20 + i * 2), 6 + Math.sin(a) * 8); g.strokeStyle = '#2a2a2a'; g.lineWidth = 2.2; g.stroke(); }
  ell(g, 0, 0, 12, 11); fs(g, '#4a4a52', '#1a1a1a', 1.8);
  for (let i = 0; i < 6; i++) { circ(g, -6 + hash2(i, 2) * 12, -6 + hash2(i, 5) * 10, 1.4); fs(g, '#ffffff'); }
  for (const s of [-1, 1]) { circ(g, s * 4, 2, 2.4); fs(g, '#e2363c'); }
  g.restore();
}
function drawPirateGherkin(g, x, y, o) { // a gherkin pirate with an eye patch and a sabre, x,y = bottom
  drawCucumberFolk(g, x, y, { h: 42, w: 22, t: o.t, face: o.face, col: ['#2e6a22', '#4a8a36'] });
  g.save(); g.translate(x, y); g.scale(o.face || 1, 1);
  line(g, -10, -36, 10, -26, '#111', 2); ell(g, 5, -30, 4.5, 4); fs(g, '#111');
  rrect(g, -12, -46, 24, 6, 3); fs(g, '#e2363c', '#8a1a1a', 1);
  g.save(); g.translate(14, -18); g.rotate(-0.8 + Math.sin((o.t || 0) * 6) * 0.3); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(10, -14, 6, -30); g.lineTo(3, -30); g.quadraticCurveTo(6, -14, -2, 0); g.closePath(); fs(g, '#e8ecf4', '#6a6e76', 1.2); rrect(g, -4, -1, 8, 4, 2); fs(g, '#c8a040'); g.restore();
  g.restore();
}
function drawLeafSlide(g, x0, y0, x1, y1) { // a big banana leaf used as a slide
  g.beginPath(); g.moveTo(x0, y0 - 6); g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - 30, x1, y1 - 6); g.lineTo(x1, y1 + 8); g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - 8, x0, y0 + 8); g.closePath();
  fs(g, '#5ab83a', '#2e6a1a', 2);
}
function drawBananaHut(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s || 1, s || 1);
  rrect(g, -50, -70, 100, 70, 4); fs(g, '#c8a060', '#6a4a1a', 2);
  for (let i = -4; i <= 4; i++) line(g, i * 11, -68, i * 11, -2, 'rgba(90,60,20,0.5)', 2);
  rrect(g, -12, -44, 24, 44, 3); fs(g, '#5a3a1a');
  for (let i = 0; i < 6; i++) { g.save(); g.translate(-56 + i * 22, -66); g.rotate(-0.5 + i * 0.2); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(14, -40, 6, -62); g.quadraticCurveTo(-4, -40, -8, 0); g.closePath(); fs(g, '#ffd84a', '#a8861a', 1.5); g.restore(); }
  g.restore();
}

// ---------- 2-8 Kiwi caves ----------
function drawKiwiLamp(g, x, y, t) {
  g.save(); g.translate(x, y);
  circ(g, 0, 0, 20); fs(g, '#7a5a2a', '#3a2a10', 2); circ(g, 0, 0, 16); fs(g, '#a8e040'); circ(g, 0, 0, 6); fs(g, '#fffbd0');
  for (let i = 0; i < 10; i++) { const a = i * TAU / 10; ell(g, Math.cos(a) * 10, Math.sin(a) * 10, 1.2, 2.2, a); fs(g, '#1a1a1a'); }
  g.restore();
}
function drawEvilPickle(g, x, y, o) {
  drawCucumberFolk(g, x, y, { h: 50, w: 22, t: o.t, face: o.face, col: ['#1e4a14', '#3a6a22'] });
  g.save(); g.translate(x, y); g.scale(o.face || 1, 1); for (const s of [-1, 1]) { circ(g, s * 4.4, -36, 3.2); fs(g, '#ff3a3a'); circ(g, s * 4.4, -36, 1.3); fs(g, '#fff'); } g.beginPath(); g.moveTo(-6, -28); g.lineTo(-2, -26); g.lineTo(2, -28); g.lineTo(6, -26); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); g.restore();
}
function drawCaperFly(g, x, y, o) { // flying caper
  g.save(); g.translate(x, y); g.scale(o.face || 1, 1);
  const fl = Math.sin((o.t || 0) * 30) * 0.5;
  for (const s of [-1, 1]) { g.save(); g.rotate(s * (0.6 + fl)); ell(g, 0, -12, 4, 9); fs(g, 'rgba(220,240,255,0.7)', '#6a8aa0', 1); g.restore(); }
  ell(g, 0, 0, 10, 8); fs(g, '#4a6a2a', '#1a2a0a', 1.5);
  for (const s of [-1, 1]) { circ(g, s * 3 + 3, -2, 2); fs(g, '#ff3a3a'); }
  g.restore();
}
function drawDarkPickle(g, x, y, o) { // the boss: Pickle's marinated shadow
  g.save(); g.globalAlpha = 0.92;
  drawCucumberFolk(g, x, y, { h: 70, w: 32, t: o.t, face: o.face, s: 1.4, col: o.flash ? ['#fff', '#ccc'] : ['#0e2a0a', '#24481a'] });
  g.restore();
  g.save(); g.translate(x, y); g.scale((o.face || 1) * 1.4, 1.4);
  if (o.dizzy) { for (const s of [-1, 1]) { g.save(); g.translate(s * 7, -52); g.rotate(G_T() * 8 * s); g.beginPath(); for (let a = 0; a < 9; a += 0.3) g.lineTo(Math.cos(a) * a * 0.6, Math.sin(a) * a * 0.6); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); g.restore(); } }
  else for (const s of [-1, 1]) { circ(g, s * 7, -52, 4); fs(g, '#ff2a2a'); circ(g, s * 7, -52, 1.6); fs(g, '#fff'); line(g, s * 2, -58, s * 12, -55, '#ff2a2a', 2); }
  rrect(g, -16, -66, 32, 7, 3); fs(g, '#5a0a0a');
  g.restore();
}
// darkness with holes of light (2-8)
function drawDarkness(ctx, G, lights) {
  const W = G.viewW, cam = G.cam;
  let cv = G._darkCv; if (!cv) cv = G._darkCv = document.createElement('canvas');
  const S = G.S; if (cv.width !== Math.ceil(W * S) || cv.height !== Math.ceil(VIEW_H * S)) { cv.width = Math.ceil(W * S); cv.height = Math.ceil(VIEW_H * S); }
  const d = cv.getContext('2d'); d.setTransform(S, 0, 0, S, 0, 0); d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, W, VIEW_H);
  d.fillStyle = 'rgba(4,12,8,0.9)'; d.fillRect(0, 0, W, VIEW_H);
  d.globalCompositeOperation = 'destination-out';
  for (const l of lights) {
    const x = l.x - cam.x, y = l.y - cam.y; if (x < -l.r || x > W + l.r || y < -l.r || y > VIEW_H + l.r) continue;
    const gr = d.createRadialGradient(x, y, l.r * 0.25, x, y, l.r); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    d.fillStyle = gr; d.beginPath(); d.arc(x, y, l.r, 0, TAU); d.fill();
  }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(cv, 0, 0); ctx.restore();
}

// ---------- 2-9 Sunken jars ----------
function drawGhostMarinade(g, x, y, o) {
  g.save(); g.translate(x, y); g.globalAlpha = 0.75;
  g.beginPath(); g.moveTo(-16, 10); g.quadraticCurveTo(-18, -22, 0, -24); g.quadraticCurveTo(18, -22, 16, 10);
  for (let i = 0; i < 4; i++) g.quadraticCurveTo(12 - i * 8, 16 + (i % 2) * 6 + Math.sin((o.t || 0) * 6 + i) * 3, 8 - i * 8, 10);
  g.closePath(); fs(g, '#7ae0c8', '#2a8a7a', 1.6);
  for (const s of [-1, 1]) { circ(g, s * 6, -8, 3); fs(g, '#0a3a3a'); }
  g.beginPath(); g.arc(0, 0, 4, 0.2, Math.PI - 0.2); g.strokeStyle = '#0a3a3a'; g.lineWidth = 1.6; g.stroke();
  g.restore();
}
function drawLidTrap(g, x, y, o) { // a jar lid with teeth that snaps shut
  g.save(); g.translate(x, y);
  const open = o.open === undefined ? 1 : o.open;
  ell(g, 0, -4, 24, 8); fs(g, '#9aa0a8', '#3a3e46', 2);
  g.save(); g.translate(-22, -8); g.rotate(-open * 1.1);
  g.beginPath(); g.ellipse(22, 0, 24, 8, 0, 0, TAU); fs(g, '#b8bec6', '#3a3e46', 2);
  for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(4 + i * 7, 5); g.lineTo(7 + i * 7, 12); g.lineTo(10 + i * 7, 5); fs(g, '#fff', '#888', 0.8); }
  g.restore();
  if (open > 0.3) for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-18 + i * 7, -8); g.lineTo(-15 + i * 7, -15); g.lineTo(-12 + i * 7, -8); fs(g, '#fff', '#888', 0.8); }
  g.restore();
}
function drawTap(g, x, y, o) { // a brass tap / lever that raises or lowers the water
  g.save(); g.translate(x, y);
  rrect(g, -6, -40, 12, 40, 4); fs(g, '#8a6a3a', '#4a3410', 1.5);
  rrect(g, -4, -52, 30, 10, 4); fs(g, '#c8a040', '#6a4a10', 1.5); rrect(g, 20, -48, 8, 14, 3); fs(g, '#c8a040', '#6a4a10', 1.5);
  g.save(); g.translate(0, -56); g.rotate(o.on ? 1.2 : -0.3); rrect(g, -3, -16, 6, 18, 3); fs(g, '#e2363c', '#7a1a14', 1.3); circ(g, 0, -16, 5); fs(g, '#e2363c', '#7a1a14', 1.3); g.restore();
  if (o.on) for (let i = 0; i < 3; i++) { const k = ((o.t || 0) * 2 + i / 3) % 1; circ(g, 24, -30 + k * 40, 3 - k * 2); fs(g, 'rgba(160,220,200,0.8)'); }
  g.restore();
}

// ---------- 2-10 Flagship and Captain Vinegar ----------
function drawVinegar(g, x, y, o) { // Captain Vinegar: a wrinkled raisin in a tricorn with a cork leg; x,y = feet
  g.save(); g.translate(x, y); g.scale((o.face || 1) * 1.3, 1.3);
  const t = o.t || 0, sweet = o.sweet;
  rrect(g, 4, -16, 8, 16, 3); fs(g, '#c8a070', '#6a4a20', 1.4); // cork leg
  line(g, -8, -16, -8, 0, '#3a1a2a', 4);
  ell(g, 0, -40, 26, 28); const gr = g.createRadialGradient(-8, -50, 4, 0, -40, 30); gr.addColorStop(0, o.flash ? '#fff' : sweet ? '#c88ae8' : '#6a3a5a'); gr.addColorStop(1, o.flash ? '#fdd' : sweet ? '#8a4ac0' : '#3a1a2e'); fs(g, gr, '#1a0a14', 2);
  g.strokeStyle = 'rgba(20,5,15,0.45)'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(-14 + i * 6, -40 + (i % 2) * 8, 8, Math.PI * 0.1, Math.PI * 0.9); g.stroke(); }
  // tricorn
  g.beginPath(); g.moveTo(-30, -62); g.quadraticCurveTo(0, -96, 30, -62); g.quadraticCurveTo(0, -74, -30, -62); fs(g, '#1a1010', '#000', 1.5); circ(g, 0, -78, 4); fs(g, '#fff');
  // face
  if (o.dizzy) { for (const s of [-1, 1]) { g.save(); g.translate(s * 9, -48); g.rotate(t * 8 * s); g.beginPath(); for (let a = 0; a < 9; a += 0.3) g.lineTo(Math.cos(a) * a * 0.6, Math.sin(a) * a * 0.6); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); g.restore(); } }
  else { circ(g, -9, -48, 4); fs(g, '#fff', '#111', 1); circ(g, -8, -48, 1.8); fs(g, '#111'); line(g, 2, -55, 16, -44, '#111', 2); ell(g, 9, -48, 5, 4.5); fs(g, '#111'); line(g, -15, -56, -4, -53, '#111', 2); }
  if (sweet) { g.beginPath(); g.arc(0, -32, 7, 0.1, Math.PI - 0.1); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
  else { g.beginPath(); g.moveTo(-8, -28); g.quadraticCurveTo(0, -34, 8, -28); g.strokeStyle = '#111'; g.lineWidth = 2; g.stroke(); }
  // sabre-fork
  if (!sweet) { g.save(); g.translate(22, -40); g.rotate(o.lunge ? -1.4 : -0.5 + Math.sin(t * 4) * 0.2); rrect(g, -2, -36, 4, 36, 2); fs(g, '#d8dce4', '#6a6e76', 1); for (let i = -1; i <= 1; i++) line(g, i * 4, -36, i * 4, -46, '#d8dce4', 2.5); rrect(g, -6, -2, 12, 5, 2); fs(g, '#c8a040'); g.restore(); }
  g.restore();
}
function drawSyrupBomb(g, x, y, t) { circ(g, x, y, 10); const gr = g.createRadialGradient(x - 3, y - 3, 1, x, y, 11); gr.addColorStop(0, '#ffe8a0'); gr.addColorStop(1, '#e88a1a'); fs(g, gr, '#8a4a0a', 1.5); rrect(g, x - 4, y - 15, 8, 6, 2); fs(g, '#c8a070'); }
function drawRain(ctx, G) {
  const W = G.viewW, t = G.time;
  ctx.save(); ctx.strokeStyle = 'rgba(200,220,255,0.35)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 90; i++) { const x = (i * 97 + t * 420) % (W + 100) - 50, y = (i * 53 + t * 900) % (VIEW_H + 60) - 30; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 8, y + 22); ctx.stroke(); }
  const fl = G.flashT || 0; if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(0.6, fl)})`; ctx.fillRect(0, 0, W, VIEW_H); }
  ctx.restore();
}
function drawW2Portrait2(g, who) {
  const m = { zelenets: () => drawZelenets(g, 75, 150, { s: 2.2 }), kabachok: () => drawKabachok(g, 75, 152, { s: 2 }), grandma: () => drawGrandma(g, 75, 146, { s: 2.8 }),
    vinegar: () => drawVinegar(g, 75, 150, { t: 0 }), vinegarSweet: () => drawVinegar(g, 75, 150, { t: 0, sweet: true }),
    banniMom: () => drawBananaFolk(g, 75, 170, { kind: 'mom' }), banniDad: () => drawBananaFolk(g, 75, 170, { kind: 'dad' }), baron: () => drawBaron(g, 75, 150, { t: 0, s: 1.4 }) };
  if (m[who]) { m[who](); return true; }
  return false;
}

// ---------- World 2 finale screens (the painting of the harvest feast) ----------
function drawWorldFinale(g, G, world, k) {
  const W = G.viewW, t = G.stateT, img = ASSETS.w2finale;
  g.fillStyle = '#2a1a10'; g.fillRect(0, 0, W, VIEW_H);
  if (img) { const sc = Math.max(W / img.width, VIEW_H / img.height) * (1.04 + k * 0.02), w = img.width * sc, h = img.height * sc; g.drawImage(img, (W - w) / 2 - Math.sin(t * 0.2) * 10, (VIEW_H - h) / 2, w, h); }
  for (let i = 0; i < 60; i++) { const x = (i * 97 + Math.sin(i) * 40) % W, y = ((t * (60 + (i % 5) * 20) + i * 53) % (VIEW_H + 40)) - 20; g.save(); g.translate(x, y); g.rotate(t * 3 + i); g.fillStyle = SPRINKLES[i % 6]; g.fillRect(-5, -2, 10, 4); g.restore(); }
  const gr = g.createLinearGradient(0, VIEW_H * 0.55, 0, VIEW_H); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(20,10,5,0.6)'); g.fillStyle = gr; g.fillRect(0, 0, W, VIEW_H);
}
