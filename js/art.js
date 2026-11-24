'use strict';
// ================= art.js : procedural vector art =================
function rrect(g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, TAU); }
function ell(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU); }
function fs(g, fill, stroke, lw) {
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 2; g.stroke(); }
}
function line(g, x0, y0, x1, y1, col, lw) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.strokeStyle = col; g.lineWidth = lw || 2; g.lineCap = 'round'; g.stroke(); }
function eye(g, x, y, rx, ry, lx, ly, o) {
  o = o || {};
  ell(g, x, y, rx, ry); fs(g, o.white || '#fff', o.out || '#2a1a10', o.lw || 1.6);
  if (o.closed) { g.fillStyle = o.lid || '#e9b52a'; ell(g, x, y, rx + 0.6, ry + 0.6); g.fill(); line(g, x - rx * 0.8, y + 1, x + rx * 0.8, y + 1, '#2a1a10', 1.6); return; }
  if (o.x) { line(g, x - rx * 0.6, y - ry * 0.5, x + rx * 0.6, y + ry * 0.5, '#2a1a10', 1.8); line(g, x + rx * 0.6, y - ry * 0.5, x - rx * 0.6, y + ry * 0.5, '#2a1a10', 1.8); return; }
  const pr = o.pr || Math.min(rx, ry) * 0.62;
  circ(g, x + lx * rx * 0.35, y + ly * ry * 0.3 + ry * 0.12, pr); fs(g, o.pupil || '#1d1410');
  circ(g, x + lx * rx * 0.35 + pr * 0.35, y + ly * ry * 0.3 - pr * 0.25, pr * 0.38); fs(g, '#fff');
  if (o.lidAmt) { g.save(); ell(g, x, y, rx, ry); g.clip(); g.fillStyle = o.lid || '#d9a23a'; g.fillRect(x - rx - 1, y - ry - 1, rx * 2 + 2, ry * 2 * o.lidAmt + 1); g.restore(); ell(g, x, y, rx, ry); fs(g, null, o.out || '#2a1a10', o.lw || 1.6); }
}
function brow(g, x, y, len, ang, col, lw) { g.save(); g.translate(x, y); g.rotate(ang); line(g, -len / 2, 0, len / 2, 0, col || '#1d1410', lw || 2.4); g.restore(); }
function sparkle(g, x, y, r, col) {
  g.save(); g.translate(x, y); g.fillStyle = col || '#fff';
  g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.3 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.restore();
}
function star5(g, x, y, r, r2) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r2 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }
const SPRINKLES = ['#ff6fa8', '#ffd447', '#6fd3ff', '#8be07a', '#c38bff', '#ff8c5a', '#ffffff'];

// ---------------- Banni ----------------
const BANNI_SPOTS = [[-9, -54, 2.3], [-12, -38, 2.8], [-5, -28, 2.1], [5, -44, 1.9], [-8, -63, 1.6], [3, -31, 2.4], [-14, -47, 1.8], [7, -58, 1.5], [-2, -60, 2], [0, -22, 1.7], [-10, -24, 1.8], [8, -36, 1.6]];
function bananaPath(g, b) {
  g.beginPath();
  g.moveTo(-2, -68);
  g.bezierCurveTo(-18 - b * 3, -58, -19 - b * 5, -30, -6, -16);
  g.quadraticCurveTo(0, -11, 7, -15);
  g.bezierCurveTo(14, -28, 13 - b * 3, -54, 6, -68);
  g.quadraticCurveTo(2, -71, -2, -68);
  g.closePath();
}
function shoe(g, x, y, ang) {
  g.save(); g.translate(x, y); g.rotate(ang || 0);
  ell(g, 2.5, -3.2, 7.2, 4.4); fs(g, '#e8423a', '#7a1a14', 1.5);
  g.fillStyle = '#fff'; rrect(g, -4.5, -1.6, 14, 2.6, 1.2); g.fill();
  circ(g, 7, -3.5, 2.4); fs(g, '#fff');
  line(g, 0, -5.5, 3, -5.8, '#fff', 1.2);
  g.restore();
}
function glove(g, x, y, r) { circ(g, x, y, r || 4.4); fs(g, '#ffffff', '#6d6d6d', 1.3); }
function banniLimbs(o) {
  const t = o.t, p = o.phase || 0;
  let bf = { x: -5, y: 0 }, ff = { x: 5, y: 0 }, bh = { x: -15, y: -24 }, fh = { x: 15, y: -24 };
  switch (o.pose) {
    case 'run': {
      const s = Math.sin(p), c = Math.cos(p);
      bf = { x: -2 - s * 10, y: -Math.max(0, c) * 7 }; ff = { x: 2 + s * 10, y: -Math.max(0, -c) * 7 };
      bh = { x: -12 + s * 9, y: -26 - Math.abs(s) * 3 }; fh = { x: 12 - s * 9, y: -26 - Math.abs(s) * 3 }; break;
    }
    case 'jump': bf = { x: -7, y: -5 }; ff = { x: 6, y: -2 }; bh = { x: -17, y: -52 }; fh = { x: 17, y: -55 }; break;
    case 'fall': bf = { x: -8, y: -2 }; ff = { x: 8, y: -3 }; bh = { x: -21, y: -40 }; fh = { x: 21, y: -42 }; break;
    case 'swing': bf = { x: -3, y: 0 }; ff = { x: 5, y: -2 }; bh = { x: -3, y: -78 }; fh = { x: 3, y: -79 }; break;
    case 'wall': bf = { x: 8, y: -3 }; ff = { x: 10, y: -10 }; bh = { x: 16, y: -48 }; fh = { x: 17, y: -30 }; break;
    case 'glide': bf = { x: -5, y: -2 }; ff = { x: 5, y: -3 }; bh = { x: -12, y: -66 }; fh = { x: 12, y: -66 }; break;
    case 'dead': bf = { x: -9, y: -3 }; ff = { x: 9, y: -3 }; bh = { x: -20, y: -58 }; fh = { x: 20, y: -58 }; break;
    case 'win': bf = { x: -5, y: 0 }; ff = { x: 5, y: 0 }; bh = { x: -18, y: -60 + Math.sin(t * 10) * 4 }; fh = { x: 19, y: -62 - Math.sin(t * 10) * 4 }; break;
    case 'crawl': bf = { x: -12, y: 0 }; ff = { x: 12, y: 0 }; bh = { x: -15, y: -20 }; fh = { x: 15, y: -20 }; break;
    default: { const s = Math.sin(t * 2.5) * 1.2; bh = { x: -15, y: -24 + s }; fh = { x: 15, y: -24 - s }; }
  }
  return { bf, ff, bh, fh };
}
function drawBanni(g, o) {
  g.save();
  g.translate(o.x, o.y);
  if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
  const sc = (o.glaze ? 1.1 : 1) * (o.scale || 1);
  if (o.star > 0) {
    const hue = (o.t * 400) % 360;
    const gr = g.createRadialGradient(0, -38, 5, 0, -38, 52);
    gr.addColorStop(0, `hsla(${hue},100%,70%,0.55)`); gr.addColorStop(1, `hsla(${hue + 60},100%,70%,0)`);
    g.fillStyle = gr; circ(g, 0, -38, 52); g.fill();
  }
  if (o.pose === 'slide') {
    g.scale(o.face * sc, sc);
    // peel sled
    g.beginPath(); g.moveTo(-40, -4); g.quadraticCurveTo(-44, -14, -36, -12); g.lineTo(24, -9);
    g.quadraticCurveTo(36, -9, 40, -21); g.quadraticCurveTo(42, -3, 26, -1); g.lineTo(-34, -1); g.closePath();
    fs(g, '#f6cf43', '#a86e12', 2);
    line(g, -30, -6, 22, -5, '#fff3a8', 1.5);
    g.save(); g.translate(28, -24); g.rotate(-Math.PI / 2 + 0.22);
    drawBanniBody(g, Object.assign({}, o, { pose: 'slidebody', face: 1 }));
    g.restore();
    if (Math.abs(o.vx || 0) > 200) { g.globalAlpha *= 0.5; for (let i = 0; i < 3; i++) line(g, -54 - i * 6, -10 - i * 8, -70 - i * 10, -10 - i * 8, '#fff', 2); }
    g.restore(); return;
  }
  if (o.spin) { g.translate(0, -36 * sc); g.rotate(o.spin); g.translate(0, 36 * sc); }
  g.scale(o.face * o.sx * sc, o.sy * sc);
  if (o.lean) g.rotate(o.lean);
  drawBanniBody(g, o);
  g.restore();
}
function drawBanniBody(g, o) {
  const t = o.t || 0;
  const hp = o.hp === undefined ? 3 : o.hp;
  const ripe = hp <= 1 ? 2 : hp === 2 ? 1 : 0;
  const bend = ripe === 2 ? 1 : 0;
  const L = banniLimbs(o);
  const bob = o.pose === 'run' ? -Math.abs(Math.sin(o.phase || 0)) * 2 : o.pose === 'idle' ? Math.sin(t * 2.5) * 0.8 : 0;
  // parachute
  if (o.power === 'parachute') {
    if (o.pose === 'glide') {
      line(g, -12, -66, -34, -106, '#fff', 1.3); line(g, 12, -66, 34, -106, '#fff', 1.3); line(g, 0, -70, 0, -110, '#fff', 1.2);
      const cols = ['#f9b3d1', '#a9d8f5', '#f9b3d1', '#d2b8f0', '#f9b3d1'];
      for (let i = 0; i < 5; i++) { circ(g, -32 + i * 16, -112 + Math.abs(i - 2) * 3, 15); fs(g, cols[i]); }
      for (let i = 0; i < 4; i++) { circ(g, -24 + i * 16, -124 + Math.abs(i - 1.5) * 2, 13); fs(g, i % 2 ? '#ffd4e6' : '#c9e8fb'); }
      g.globalAlpha *= 0.6; circ(g, -14, -128, 6); fs(g, '#fff'); g.globalAlpha /= 0.6;
    } else {
      circ(g, -17, -44 + bob, 8); fs(g, '#f9b3d1'); circ(g, -21, -50 + bob, 6); fs(g, '#a9d8f5'); circ(g, -13, -51 + bob, 6); fs(g, '#ffd4e6');
    }
  }
  // back arm
  const shB = { x: -11, y: -37 + bob }, shF = { x: 9, y: -37 + bob };
  line(g, shB.x, shB.y, L.bh.x, L.bh.y, '#5b3a12', 2.6);
  glove(g, L.bh.x, L.bh.y);
  // legs
  line(g, -4, -15 + bob, L.bf.x, L.bf.y - 3, '#5b3a12', 3);
  line(g, 4, -15 + bob, L.ff.x, L.ff.y - 3, '#5b3a12', 3);
  shoe(g, L.bf.x, L.bf.y, o.pose === 'run' ? -0.15 : 0);
  shoe(g, L.ff.x, L.ff.y, o.pose === 'run' ? 0.1 : 0);
  // body
  g.save(); g.translate(0, bob);
  bananaPath(g, bend);
  const gr = g.createLinearGradient(-18, 0, 14, 0);
  if (ripe === 2) { gr.addColorStop(0, '#c98b2a'); gr.addColorStop(0.55, '#e8b851'); gr.addColorStop(1, '#d9a23a'); }
  else if (hp > 3) { gr.addColorStop(0, '#e6c22c'); gr.addColorStop(0.55, '#fff06a'); gr.addColorStop(1, '#d8e05a'); }
  else { gr.addColorStop(0, '#f0b52a'); gr.addColorStop(0.55, '#ffe55e'); gr.addColorStop(1, '#ffd84a'); }
  fs(g, gr, ripe === 2 ? '#7a4e14' : '#a86e12', 2.6);
  // highlight
  g.save(); bananaPath(g, bend); g.clip();
  g.globalAlpha *= 0.45; g.beginPath(); g.moveTo(6, -62); g.bezierCurveTo(11, -50, 11, -32, 5, -20); g.strokeStyle = '#fff8c8'; g.lineWidth = 3; g.stroke(); g.globalAlpha /= 0.45;
  // spots
  const ns = ripe === 0 ? (hp > 3 ? 0 : 0) : ripe === 1 ? 4 : BANNI_SPOTS.length;
  for (let i = 0; i < ns; i++) { const s = BANNI_SPOTS[i]; ell(g, s[0], s[1], s[2], s[2] * 0.8); fs(g, ripe === 2 ? '#5e3a12' : '#8a5a1a'); }
  if (hp > 3) { g.globalAlpha *= 0.5; ell(g, 0, -64, 9, 5); fs(g, '#9fd04a'); ell(g, 1, -17, 6, 4); fs(g, '#9fd04a'); g.globalAlpha /= 0.5; }
  // glaze
  if (o.glaze) {
    g.beginPath(); g.moveTo(-30, -90); g.lineTo(30, -90); g.lineTo(30, -46);
    for (let i = 0; i <= 8; i++) { const x = 30 - i * 7.5; const dd = (i % 3 === 1) ? 9 + Math.sin(t * 2 + i) * 1.5 : (i % 2 ? 4 : 0); g.lineTo(x, -46 + dd); }
    g.closePath();
    const cg = g.createLinearGradient(-15, -70, 10, -45); cg.addColorStop(0, '#8a4a22'); cg.addColorStop(1, '#5a2c12');
    fs(g, cg);
    g.globalAlpha *= 0.55; ell(g, 4, -60, 3, 7, 0.2); fs(g, '#fff'); g.globalAlpha /= 0.55;
  }
  // bandana (cherry power)
  if (o.power === 'cherry') {
    g.fillStyle = '#e2363c'; g.fillRect(-30, -63, 60, 7);
    for (let i = 0; i < 6; i++) { circ(g, -16 + i * 6, -59.5, 1.1); fs(g, '#fff'); }
  }
  if (o.star > 0) { g.fillStyle = `hsla(${(t * 500) % 360},100%,60%,0.32)`; g.fillRect(-30, -90, 60, 90); }
  g.restore();
  bananaPath(g, bend); fs(g, null, ripe === 2 ? '#7a4e14' : '#a86e12', 2.6);
  // bandana knot
  if (o.power === 'cherry') {
    const fl = Math.sin(t * 12) * 3;
    g.beginPath(); g.moveTo(-15, -60); g.lineTo(-27, -63 + fl); g.lineTo(-25, -55 + fl); g.closePath(); fs(g, '#e2363c', '#8a1a1a', 1.2);
    g.beginPath(); g.moveTo(-15, -59); g.lineTo(-24, -52 - fl); g.lineTo(-19, -50 - fl); g.closePath(); fs(g, '#c92a30', '#8a1a1a', 1.2);
  }
  g.restore();
  // stem
  g.save(); g.translate(0, bob);
  rrect(g, -2.5, -77, 6, 11, 2.5); fs(g, '#8fae3a', '#4f6a1a', 1.5);
  rrect(g, -2.2, -79, 5.4, 4, 1.8); fs(g, '#5a3b1e');
  ell(g, 0.5, -14.5, 2.4, 1.8); fs(g, '#5a3b1e');
  // scarf (mint)
  if (o.power === 'mint') {
    rrect(g, -17, -36, 30, 7, 3); fs(g, '#7fe0c4', '#2f8a72', 1.3);
    for (let i = 0; i < 4; i++) { g.fillStyle = '#fff'; g.fillRect(-12 + i * 7, -36, 2.5, 7); }
    const fl = Math.sin(t * 10) * 2;
    g.beginPath(); g.moveTo(-14, -32); g.lineTo(-28, -26 + fl); g.lineTo(-24, -20 + fl); g.lineTo(-10, -29); g.closePath(); fs(g, '#7fe0c4', '#2f8a72', 1.3);
  }
  // face
  const dead = o.pose === 'dead';
  const blink = !dead && (t % 3.4) < 0.12;
  const hurt = o.hurt;
  const lid = ripe === 2 ? 0.42 : 0;
  eye(g, -4, -51, 5, 7, 1, hurt ? -0.3 : 0, { closed: blink, x: dead, lidAmt: lid, lid: '#d9a23a' });
  eye(g, 6, -51, 5, 7, 1, hurt ? -0.3 : 0, { closed: blink, x: dead, lidAmt: lid, lid: '#d9a23a' });
  if (o.angry || o.star > 0) { brow(g, -4, -60, 7, 0.25); brow(g, 6, -60, 7, -0.25); }
  g.globalAlpha *= 0.4; circ(g, -11, -42, 3.4); fs(g, '#ff7a7a'); circ(g, 11, -42, 3); fs(g, '#ff7a7a'); g.globalAlpha /= 0.4;
  if (dead || hurt) { ell(g, 1.5, -38, 3, 3.6); fs(g, '#5a1a10'); }
  else {
    g.beginPath(); g.arc(1.5, -42, 6, 0.25, Math.PI - 0.25); g.strokeStyle = '#4a2a0c'; g.lineWidth = 2; g.lineCap = 'round'; g.stroke();
    if (o.pose === 'jump' || o.pose === 'win' || o.star > 0) { g.beginPath(); g.arc(1.5, -41.5, 4.5, 0.2, Math.PI - 0.2); g.closePath(); fs(g, '#7a2a1a'); }
  }
  g.restore();
  // front arm
  line(g, shF.x, shF.y, L.fh.x, L.fh.y, '#5b3a12', 2.6);
  glove(g, L.fh.x, L.fh.y);
}

// ---------------- Pickle ----------------
function drawPickle(g, o) {
  g.save(); g.translate(o.x, o.y);
  if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
  g.scale(o.face * (o.sx || 1), o.sy || 1);
  if (o.rot) { g.translate(0, -24); g.rotate(o.rot); g.translate(0, 24); }
  const t = o.t || 0, p = o.phase || 0;
  const run = o.pose === 'run';
  const s = Math.sin(p);
  const bf = run ? { x: -3 - s * 7, y: -Math.max(0, Math.cos(p)) * 5 } : o.pose === 'jump' ? { x: -5, y: -4 } : { x: -4, y: 0 };
  const ff = run ? { x: 3 + s * 7, y: -Math.max(0, -Math.cos(p)) * 5 } : o.pose === 'jump' ? { x: 5, y: -3 } : { x: 4, y: 0 };
  line(g, -4, -8, bf.x, bf.y - 2, '#2b5a1e', 3); line(g, 4, -8, ff.x, ff.y - 2, '#2b5a1e', 3);
  ell(g, bf.x + 2, bf.y - 2.5, 5.5, 3.4); fs(g, '#3a6ea8', '#1f3a5a', 1.3);
  ell(g, ff.x + 2, ff.y - 2.5, 5.5, 3.4); fs(g, '#3a6ea8', '#1f3a5a', 1.3);
  const bob = run ? -Math.abs(s) * 2 : Math.sin(t * 2.2) * 0.7;
  g.translate(0, bob);
  if (o.wings) {
    const fl = Math.sin(t * 22) * 0.5;
    for (const k of [0, 1]) {
      g.save(); g.translate(-12 + k * 3, -36); g.rotate(-0.5 - fl - k * 0.25);
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-14, -16, -26, -10); g.quadraticCurveTo(-20, -4, -24, 2); g.quadraticCurveTo(-14, 2, -16, 8); g.quadraticCurveTo(-6, 6, 0, 2); g.closePath();
      fs(g, k ? '#eaf6ff' : '#ffffff', '#9ab8d0', 1.4); g.restore();
    }
  }
  // backpack
  rrect(g, -20, -40, 10, 18, 3); fs(g, '#b0743a', '#6a3e16', 1.5);
  rrect(g, -21, -33, 4, 7, 1.5); fs(g, '#8e5a26');
  // body
  rrect(g, -12, -50, 24, 44, 12);
  const gr = g.createLinearGradient(-12, 0, 12, 0); gr.addColorStop(0, '#3d7f2c'); gr.addColorStop(0.6, '#5fa843'); gr.addColorStop(1, '#4a9136');
  fs(g, gr, '#244d18', 2.2);
  const bumps = [[-6, -42], [4, -45], [-8, -30], [7, -22], [-3, -16], [1, -34], [8, -36], [-8, -19]];
  for (const b of bumps) { circ(g, b[0], b[1], 1.6); fs(g, '#9cd47a'); }
  if (o.glaze) { g.save(); rrect(g, -12, -50, 24, 44, 12); g.clip(); g.beginPath(); g.moveTo(-14, -52); g.lineTo(14, -52); g.lineTo(14, -34); for (let i = 0; i <= 6; i++) g.lineTo(14 - i * 4.7, -34 + (i % 2 ? 6 : 0)); g.closePath(); fs(g, '#6a3a1e'); g.restore(); }
  // strap
  line(g, -11, -38, 11, -28, '#8e5a26', 2.4);
  // arms
  const ah = o.pose === 'jump' || o.pose === 'cheer' ? -48 : o.pose === 'talk' ? -30 + Math.sin(t * 8) * 4 : -22;
  line(g, -11, -30, -16, ah + (run ? s * 4 : 0), '#2b5a1e', 2.4); circ(g, -16, ah + (run ? s * 4 : 0), 3); fs(g, '#5fa843', '#244d18', 1.2);
  line(g, 11, -30, 16, ah - (run ? s * 4 : 0), '#2b5a1e', 2.4); circ(g, 16, ah - (run ? s * 4 : 0), 3); fs(g, '#5fa843', '#244d18', 1.2);
  // face
  const blink = (t % 4.1) < 0.12;
  eye(g, -2, -38, 4, 5, 1, 0, { closed: blink, lid: '#4a9136' });
  eye(g, 6, -38, 4, 5, 1, 0, { closed: blink, lid: '#4a9136' });
  brow(g, -2, -45, 6, o.worried ? -0.3 : 0.1, '#1d3a12', 2); brow(g, 6, -45, 6, o.worried ? 0.3 : -0.1, '#1d3a12', 2);
  if (o.pose === 'talk' && Math.sin(t * 16) > 0) { ell(g, 3, -29, 3, 2.5); fs(g, '#1d3a12'); }
  else { g.beginPath(); g.arc(3, -31, 3.6, 0.3, Math.PI - 0.3); g.strokeStyle = '#1d3a12'; g.lineWidth = 1.8; g.stroke(); }
  g.restore();
}

// ---------------- Enemies ----------------
function drawSprout(g, x, y, o) { // Brusselka
  g.save(); g.translate(x, y); g.scale(o.face || 1, 1);
  const t = o.t || 0, sq = o.squash || 0;
  g.scale(1 + sq * 0.5, 1 - sq * 0.6);
  const st = Math.sin(t * 10) * 3;
  ell(g, -5 + st, -2, 5, 3); fs(g, '#3e6e28'); ell(g, 6 - st, -2, 5, 3); fs(g, '#3e6e28');
  const r = 15;
  circ(g, 0, -r - 2, r);
  const gr = g.createRadialGradient(-4, -r - 7, 2, 0, -r - 2, r); gr.addColorStop(0, '#b6e584'); gr.addColorStop(1, '#5c9a3a');
  fs(g, gr, '#2f5a1e', 2);
  g.strokeStyle = '#3e7a2a'; g.lineWidth = 1.5;
  g.beginPath(); g.arc(-r * 0.9, -r - 2, r * 1.0, -0.9, 0.9); g.stroke();
  g.beginPath(); g.arc(r * 0.9, -r - 2, r * 1.0, Math.PI - 0.9, Math.PI + 0.9); g.stroke();
  g.beginPath(); g.moveTo(0, -r * 2 - 2); g.quadraticCurveTo(4, -r * 2 - 9, 7, -r * 2 - 6); g.strokeStyle = '#4e8a32'; g.lineWidth = 2.2; g.stroke();
  if (o.frozen) return g.restore();
  eye(g, -3, -19, 3.6, 4.4, 1, 0.2); eye(g, 6, -19, 3.6, 4.4, 1, 0.2);
  brow(g, -3, -25, 7, 0.45); brow(g, 6, -25, 7, -0.45);
  g.beginPath(); g.arc(2, -9, 4, Math.PI + 0.4, -0.4); g.strokeStyle = '#1d2a10'; g.lineWidth = 1.8; g.stroke();
  g.restore();
}
function drawPea(g, x, y, o) {
  g.save(); g.translate(x, y); g.scale(o.face || 1, 1);
  const sq = o.squash || 0; g.scale(1 + sq * 0.35, 1 - sq * 0.35);
  ell(g, -5, -2, 4, 2.6); fs(g, '#3e7a24'); ell(g, 5, -2, 4, 2.6); fs(g, '#3e7a24');
  circ(g, 0, -15, 14);
  const gr = g.createRadialGradient(-5, -21, 2, 0, -15, 15); gr.addColorStop(0, '#d2ff9a'); gr.addColorStop(1, '#5cb83a');
  fs(g, gr, '#2e6a1a', 2);
  ell(g, -5, -22, 4, 2.4, -0.5); fs(g, 'rgba(255,255,255,0.7)');
  // little leaf hat
  g.beginPath(); g.moveTo(0, -29); g.quadraticCurveTo(-9, -36, -12, -30); g.quadraticCurveTo(-6, -27, 0, -29); fs(g, '#4e9a2e', '#2e6a1a', 1.2);
  if (!o.frozen) {
    eye(g, -2, -16, 3.4, 4, 1, 0); eye(g, 6, -16, 3.4, 4, 1, 0);
    brow(g, -2, -22, 6, 0.4); brow(g, 6, -22, 6, -0.4);
    if (o.shoot) { circ(g, 9, -8, 3.4); fs(g, '#1d3a10'); } else { line(g, 0, -8, 7, -9, '#1d3a10', 1.8); }
  }
  g.restore();
}
function drawBroccoli(g, x, y, o) {
  g.save(); g.translate(x, y);
  const up = o.up || 0; // 0 hidden .. 1 fully out
  // ground bush (hidden state)
  const florets = [[-14, -8, 9], [-4, -12, 10], [8, -10, 9], [15, -6, 7], [0, -5, 8]];
  if (up < 1) {
    for (const f of florets) { circ(g, f[0], f[1] + up * 4, f[2]); fs(g, '#3f7d2c', '#24521a', 1.5); }
    for (const f of florets) { circ(g, f[0] - 2, f[1] - 3 + up * 4, f[2] * 0.45); fs(g, '#5aa340'); }
  }
  if (up > 0) {
    g.save(); g.beginPath(); g.rect(-40, -120, 80, 116); g.clip();
    g.translate(0, (1 - up) * 46);
    rrect(g, -8, -34, 16, 34, 6); fs(g, '#b8d98a', '#5a7a32', 2);
    const fl = [[-14, -40, 11], [0, -46, 13], [14, -40, 11], [-7, -52, 10], [8, -53, 10]];
    for (const f of fl) { circ(g, f[0], f[1], f[2]); fs(g, '#3f8a2c', '#24521a', 1.8); }
    for (const f of fl) { circ(g, f[0] - 3, f[1] - 3, f[2] * 0.45); fs(g, '#6cbf4a'); }
    if (!o.frozen) {
      eye(g, -4, -22, 3.2, 4, 0, 0); eye(g, 4, -22, 3.2, 4, 0, 0);
      brow(g, -4, -28, 6, 0.4); brow(g, 4, -28, 6, -0.4);
      ell(g, 0, -12, 3.5, 2.6); fs(g, '#2a3a10');
    }
    g.restore();
    for (const f of florets.slice(0, 2)) { circ(g, f[0] - 8, f[1] + 2, f[2] * 0.8); fs(g, '#3f7d2c', '#24521a', 1.5); }
  }
  g.restore();
}
function drawScoopBall(g, x, y, o) {
  g.save(); g.translate(x, y - 17);
  const cols = { pink: ['#ffc3d4', '#e98fa6'], mint: ['#c8f0dc', '#86cfa8'], van: ['#fff3d6', '#e9cf98'] }[o.flavor || 'pink'];
  circ(g, 0, 0, 17);
  const gr = g.createRadialGradient(-5, -6, 2, 0, 0, 18); gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]);
  fs(g, gr, '#b0607a', 1.6);
  g.rotate(o.rot || 0);
  for (let i = 0; i < 7; i++) { const a = i * 0.9, r = 4 + (i * 5) % 10; g.save(); g.translate(Math.cos(a) * r, Math.sin(a) * r); g.rotate(a * 2); g.fillStyle = SPRINKLES[i % 6]; g.fillRect(-3, -1, 6, 2); g.restore(); }
  g.restore();
}
function drawBat(g, x, y, o) { // onion bat; x,y center
  g.save(); g.translate(x, y); g.scale(o.face || 1, 1);
  const t = o.t || 0, fl = o.frozen ? 0.3 : Math.sin(t * 16);
  for (const s of [-1, 1]) {
    g.save(); g.scale(s, 1); g.rotate(-fl * 0.5);
    g.beginPath(); g.moveTo(6, -2); g.quadraticCurveTo(18, -16, 30, -10); g.quadraticCurveTo(26, -4, 28, 2); g.quadraticCurveTo(21, -1, 19, 5); g.quadraticCurveTo(13, 0, 6, 4); g.closePath();
    fs(g, '#e8dcf7', '#7a5aa0', 1.6); g.restore();
  }
  g.beginPath(); g.moveTo(0, -20); g.bezierCurveTo(12, -12, 15, 8, 0, 13); g.bezierCurveTo(-15, 8, -12, -12, 0, -20); g.closePath();
  const gr = g.createRadialGradient(-4, -4, 2, 0, 0, 16); gr.addColorStop(0, '#d9a5f0'); gr.addColorStop(1, '#8e4fb8');
  fs(g, gr, '#5a2c80', 2);
  g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(-3, -16); g.quadraticCurveTo(-9, 0, -4, 11); g.stroke(); g.beginPath(); g.moveTo(3, -16); g.quadraticCurveTo(9, 0, 4, 11); g.stroke();
  g.beginPath(); g.moveTo(0, -19); g.quadraticCurveTo(2, -27, 6, -28); g.strokeStyle = '#6aa83a'; g.lineWidth = 2.4; g.stroke();
  if (!o.frozen) {
    eye(g, -4, -3, 3.4, 4, 0.5, 0.3, { white: '#fff6a0' }); eye(g, 4, -3, 3.4, 4, 0.5, 0.3, { white: '#fff6a0' });
    brow(g, -4, -9, 6, 0.5); brow(g, 4, -9, 6, -0.5);
    g.beginPath(); g.moveTo(-4, 5); g.lineTo(-2, 7); g.lineTo(0, 5); g.lineTo(2, 7); g.lineTo(4, 5); g.strokeStyle = '#2a1040'; g.lineWidth = 1.4; g.stroke();
  }
  g.restore();
}
function drawSlug(g, x, y, o) {
  g.save(); g.translate(x, y); g.scale(o.face || 1, 1);
  const t = o.t || 0, w = Math.sin(t * 5) * 2;
  g.beginPath(); g.moveTo(-22, 0); g.quadraticCurveTo(-22 + w, -12, -6, -14); g.quadraticCurveTo(10, -18, 16, -8); g.quadraticCurveTo(22, -2, 20, 0); g.closePath();
  const gr = g.createLinearGradient(0, -18, 0, 0); gr.addColorStop(0, '#7cc95a'); gr.addColorStop(1, '#3f8a2c');
  fs(g, gr, '#245a18', 2);
  g.strokeStyle = 'rgba(30,80,20,0.6)'; g.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-14 + i * 9, -2); g.quadraticCurveTo(-10 + i * 9, -9, -6 + i * 9, -12); g.stroke(); }
  line(g, 10, -14, 12 + w * 0.5, -26, '#3f8a2c', 2.4); line(g, 15, -12, 19 + w * 0.5, -23, '#3f8a2c', 2.4);
  if (!o.frozen) { eye(g, 12 + w * 0.5, -28, 3.2, 3.4, 1, 0); eye(g, 19 + w * 0.5, -25, 3.2, 3.4, 1, 0); brow(g, 12, -33, 5, 0.4, '#1d3a10', 1.6); }
  g.restore();
}
function drawRadish(g, x, y, o) { // x,y bottom center of body
  g.save(); g.translate(x, y); g.scale(o.face || 1, 1);
  const sq = o.squash || 0; g.scale(1 + sq * 0.3, 1 - sq * 0.3);
  // root tip
  g.beginPath(); g.moveTo(-4, -4); g.quadraticCurveTo(0, 8, 3, -4); fs(g, '#fff0f0', '#c0a0a0', 1.2);
  circ(g, 0, -16, 15);
  const gr = g.createRadialGradient(-5, -21, 2, 0, -16, 16); gr.addColorStop(0, '#ff8aa0'); gr.addColorStop(1, '#d4304f');
  fs(g, gr, '#8a1a30', 2);
  ell(g, 0, -4, 11, 4); fs(g, 'rgba(255,240,240,0.7)');
  for (const a of [-0.5, 0, 0.5]) { g.save(); g.translate(0, -30); g.rotate(a); ell(g, 0, -8, 4, 9); fs(g, '#5ab040', '#2e6a1a', 1.3); g.restore(); }
  if (!o.frozen) {
    eye(g, -4, -20, 3, 3.6, 1, 0); eye(g, 5, -20, 3, 3.6, 1, 0);
    ell(g, 3, -13, 4, 3); fs(g, '#ffb0c0', '#8a1a30', 1.2);
    brow(g, -4, -25, 5, 0.4); brow(g, 5, -25, 5, -0.4);
    // claws
    for (const s of [-1, 1]) { g.save(); g.translate(s * 14, -12); for (let i = 0; i < 3; i++) line(g, 0, 0, s * 4, -3 + i * 3, '#f5e6c8', 2); g.restore(); }
  }
  g.restore();
}
function drawMound(g, x, y, theme) {
  g.save(); g.translate(x, y);
  g.beginPath(); g.moveTo(-20, 0); g.quadraticCurveTo(-14, -12, 0, -12); g.quadraticCurveTo(14, -12, 20, 0); g.closePath();
  fs(g, theme === 2 ? '#c7a07a' : '#e8d4b8', '#8a6a4a', 1.5);
  for (let i = 0; i < 4; i++) { circ(g, -10 + i * 7, -5 - (i % 2) * 3, 1.6); fs(g, '#7a5a3a'); }
  for (const a of [-0.4, 0.4]) { g.save(); g.translate(0, -11); g.rotate(a); ell(g, 0, -5, 2.5, 6); fs(g, '#5ab040'); g.restore(); }
  g.restore();
}

// ---- bosses ----
function drawCabbage(g, x, y, o) { // x,y = center
  const r = o.r || 56, t = o.t || 0;
  g.save(); g.translate(x, y);
  if (o.flash) g.globalAlpha *= 0.6 + Math.sin(t * 60) * 0.4;
  g.save(); g.rotate(o.rot || 0);
  circ(g, 0, 0, r);
  const gr = g.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r); gr.addColorStop(0, '#d8f5b8'); gr.addColorStop(0.6, '#9fd27e'); gr.addColorStop(1, '#5e9e45');
  fs(g, gr, '#3a6e2a', 3);
  g.strokeStyle = '#4f8a3a'; g.lineWidth = 2.4;
  for (let i = 0; i < 6; i++) {
    const a = i * TAU / 6;
    g.beginPath(); g.arc(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95, r * 0.75, a + Math.PI - 0.8, a + Math.PI + 0.8); g.stroke();
  }
  g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 1.4;
  for (let i = 0; i < 5; i++) { const a = i * 1.3 + 0.4; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.3, Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85); g.stroke(); }
  g.restore();
  // face (does not rotate unless rolling fast)
  const fr = o.faceRot || 0;
  g.save(); g.rotate(fr);
  const dizzy = o.dizzy;
  if (dizzy) {
    for (const ex of [-18, 18]) { g.save(); g.translate(ex, -6); g.beginPath(); for (let i = 0; i < 20; i++) { const a = i * 0.6 + t * 8, rr = i * 0.5; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.strokeStyle = '#1d2a10'; g.lineWidth = 2; g.stroke(); g.restore(); }
    ell(g, 0, 22, 9, 6); fs(g, '#3a1a10');
  } else {
    eye(g, -18, -6, 10, 11, o.look || 0, 0.2, { lw: 2.2, pr: 5 }); eye(g, 18, -6, 10, 11, o.look || 0, 0.2, { lw: 2.2, pr: 5 });
    brow(g, -18, -20, 20, 0.35, '#2a3a10', 5); brow(g, 18, -20, 20, -0.35, '#2a3a10', 5);
    g.beginPath(); g.moveTo(-14, 26); g.quadraticCurveTo(0, 16, 14, 26); g.strokeStyle = '#1d2a10'; g.lineWidth = 3.4; g.lineCap = 'round'; g.stroke();
  }
  // captain hat
  g.save(); g.translate(0, -r + 6); g.rotate(o.hatTilt || -0.12);
  g.beginPath(); g.moveTo(-34, 2); g.quadraticCurveTo(-36, -22, -10, -26); g.quadraticCurveTo(20, -30, 34, -10); g.quadraticCurveTo(36, 2, 30, 4); g.closePath();
  fs(g, '#6a7288', '#2e3344', 2.4);
  rrect(g, -32, -4, 64, 9, 4); fs(g, '#3c4254', '#22263a', 2);
  g.beginPath(); g.moveTo(-6, 4); g.quadraticCurveTo(14, 16, 36, 8); g.quadraticCurveTo(20, 6, 6, 3); g.closePath(); fs(g, '#2e3344');
  // anchor
  g.strokeStyle = '#f2c94c'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(0, -20); g.lineTo(0, -8); g.stroke();
  g.beginPath(); g.arc(0, -11, 5, 0.2, Math.PI - 0.2); g.stroke(); circ(g, 0, -21, 2); fs(g, '#f2c94c');
  g.restore();
  g.restore();
  if (dizzy) { for (let i = 0; i < 3; i++) { const a = t * 4 + i * TAU / 3; g.save(); star5(g, x + Math.cos(a) * 44, y - r - 14 + Math.sin(a) * 8, 7, 3); fs(g, '#ffe14d', '#b88a00', 1.3); g.restore(); } }
  g.restore();
}
function drawGhost(g, x, y, o) { // center
  const s = o.scale || 1, t = o.t || 0;
  g.save(); g.translate(x, y); g.scale(s, s);
  if (o.flash) g.globalAlpha *= 0.5 + Math.sin(t * 50) * 0.5;
  g.globalAlpha *= 0.94;
  const body = () => {
    g.beginPath(); g.moveTo(0, -78);
    g.bezierCurveTo(10, -62, 46, -48, 46, -6);
    g.lineTo(46, 30);
    for (let i = 0; i <= 6; i++) { const xx = 46 - i * (92 / 6); g.quadraticCurveTo(xx - 7.6, 46 + Math.sin(t * 6 + i) * 6, xx - 15.3, 30); }
    g.lineTo(-46, -6); g.bezierCurveTo(-46, -48, -10, -62, 0, -78); g.closePath();
  };
  body();
  const gr = g.createRadialGradient(-12, -22, 6, 0, -8, 70); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, '#ecdcfb'); gr.addColorStop(1, o.rage ? '#b07ad8' : '#c9a6ee');
  fs(g, gr, '#7a4fa8', 3);
  // layer rings
  g.save(); body(); g.clip();
  for (let i = 0; i < (o.layers || 4); i++) {
    g.beginPath(); g.ellipse(0, 6, 40 - i * 9, 54 - i * 10, 0, Math.PI * 1.05, Math.PI * 1.95); g.strokeStyle = `rgba(150,100,200,${0.35 + i * 0.1})`; g.lineWidth = 2.2; g.stroke();
  }
  g.restore();
  // sprout
  g.beginPath(); g.moveTo(0, -76); g.quadraticCurveTo(6, -94, 16, -96); g.strokeStyle = '#6aa83a'; g.lineWidth = 4; g.lineCap = 'round'; g.stroke();
  g.beginPath(); g.moveTo(0, -76); g.quadraticCurveTo(-8, -90, -14, -90); g.stroke();
  // face
  const glow = o.windup ? '#ff4a4a' : '#ffe14d';
  ell(g, -16, -14, 11, 14); fs(g, '#3a1a5a'); ell(g, 16, -14, 11, 14); fs(g, '#3a1a5a');
  circ(g, -14 + (o.look || 0) * 3, -12, 4.5); fs(g, glow); circ(g, 18 + (o.look || 0) * 3, -12, 4.5); fs(g, glow);
  brow(g, -16, -32, 18, 0.4, '#3a1a5a', 4); brow(g, 16, -32, 18, -0.4, '#3a1a5a', 4);
  g.beginPath(); g.moveTo(-16, 14); for (let i = 0; i <= 8; i++) g.lineTo(-16 + i * 4, 14 + (i % 2 ? 5 : 0)); g.strokeStyle = '#3a1a5a'; g.lineWidth = 2.6; g.stroke();
  // tears
  if (o.tired) { for (const ex of [-16, 16]) { ell(g, ex, 6 + (t * 40) % 12, 3, 5); fs(g, '#8fd8ff'); } }
  g.restore();
}

// ---------------- NPC ----------------
function drawGrandpa(g, x, y, o) { // Dedushka Plombir with flag; x,y feet
  g.save(); g.translate(x, y);
  const t = o.t || 0;
  // flag pole (pretzel stick)
  rrect(g, 22, -108, 6, 108, 3); fs(g, '#c98b4e', '#7a4a1e', 1.5);
  for (let i = 0; i < 8; i++) { circ(g, 25, -100 + i * 13, 1.2); fs(g, '#fff'); }
  const fy = o.active ? -104 : -34;
  const wave = Math.sin(t * 5) * 3;
  g.beginPath(); g.moveTo(28, fy); g.lineTo(62, fy + 4 + wave); g.lineTo(60, fy + 26 + wave); g.lineTo(28, fy + 24); g.closePath();
  fs(g, o.active ? '#f6c46a' : '#d9b07a', '#9a6a2a', 2);
  g.save(); g.clip(); g.strokeStyle = 'rgba(150,100,40,0.6)'; g.lineWidth = 1.2;
  for (let i = -2; i < 8; i++) { line(g, 28 + i * 6, fy, 28 + i * 6 + 20, fy + 30, 'rgba(150,100,40,0.6)', 1.1); line(g, 28 + i * 6 + 20, fy, 28 + i * 6, fy + 30, 'rgba(150,100,40,0.6)', 1.1); }
  g.restore();
  if (o.active) { circ(g, 46, fy + 13 + wave * 0.5, 5); fs(g, '#e2363c', '#8a1a1a', 1.2); }
  // cone body
  g.beginPath(); g.moveTo(-13, -38); g.lineTo(13, -38); g.lineTo(2, -2); g.lineTo(-2, -2); g.closePath();
  fs(g, '#e8b46a', '#9a6a2a', 2);
  g.save(); g.clip(); for (let i = -4; i < 6; i++) { line(g, -14 + i * 6, -40, -14 + i * 6 + 20, 0, 'rgba(150,100,40,0.55)', 1.2); line(g, 6 + i * 6, -40, -14 + i * 6, 0, 'rgba(150,100,40,0.55)', 1.2); } g.restore();
  // feet
  ell(g, -5, -1, 5, 2.6); fs(g, '#7a4a2a'); ell(g, 6, -1, 5, 2.6); fs(g, '#7a4a2a');
  // head scoop
  circ(g, 0, -52, 17); fs(g, '#fffaf0', '#c9b89a', 2);
  g.beginPath(); g.moveTo(-17, -46); g.quadraticCurveTo(-12, -36, -8, -41); g.quadraticCurveTo(-4, -33, 0, -40); g.quadraticCurveTo(5, -34, 9, -41); g.quadraticCurveTo(13, -37, 17, -46); g.closePath(); fs(g, '#fffaf0');
  // face
  line(g, -8, -56, -3, -55, '#3a2a1a', 2); line(g, 4, -55, 9, -56, '#3a2a1a', 2);
  brow(g, -6, -61, 9, -0.2, '#ffffff', 4); brow(g, 7, -61, 9, 0.2, '#ffffff', 4);
  ell(g, 0, -50, 3, 2.4); fs(g, '#f2a0a0');
  g.beginPath(); g.moveTo(0, -48); g.quadraticCurveTo(-10, -50, -14, -42); g.quadraticCurveTo(-6, -44, 0, -45); g.quadraticCurveTo(6, -44, 14, -42); g.quadraticCurveTo(10, -50, 0, -48); fs(g, '#ffffff', '#c9c0b0', 1.2);
  // arm holding pole
  line(g, 10, -32, 23, -40, '#9a6a2a', 2.4); glove(g, 24, -40, 3.6);
  // melting drip
  ell(g, -12, -40 + (t * 6) % 8, 2, 3); fs(g, '#fffaf0');
  g.restore();
}
function drawSheep(g, x, y, o) {
  g.save(); g.translate(x, y); g.scale(o.face || 1, 1);
  const t = o.t || 0;
  line(g, -7, -8, -8, 0, '#2a2a2a', 2.4); line(g, 7, -8, 8, 0, '#2a2a2a', 2.4);
  for (const p of [[-10, -18, 9], [0, -22, 10], [10, -18, 9], [-5, -12, 8], [6, -12, 8]]) { circ(g, p[0], p[1], p[2]); fs(g, '#ffffff', '#d9d0e0', 1.3); }
  ell(g, 15, -20, 7, 8); fs(g, '#ffc9d6', '#c88a9a', 1.4);
  circ(g, 13, -22, 1.6); fs(g, '#2a1a1a'); circ(g, 18, -22, 1.6); fs(g, '#2a1a1a');
  ell(g, 10, -27, 3, 2); fs(g, '#ffc9d6');
  if (o.happy) { g.beginPath(); g.arc(15.5, -18, 2.4, 0.2, Math.PI - 0.2); g.strokeStyle = '#7a3a4a'; g.lineWidth = 1.3; g.stroke(); }
  g.restore();
}
function drawCage(g, x, y, o) {
  g.save(); g.translate(x, y);
  if (!o.open) drawSheep(g, -2, -6, { t: o.t, face: 1 });
  rrect(g, -26, -6, 52, 6, 3); fs(g, '#3a1a2a');
  if (!o.open) {
    for (let i = 0; i < 6; i++) { rrect(g, -24 + i * 9.4, -48, 4, 44, 2); fs(g, '#2a1220'); }
    g.beginPath(); g.moveTo(-26, -46); g.quadraticCurveTo(0, -66, 26, -46); g.strokeStyle = '#2a1220'; g.lineWidth = 6; g.stroke();
    circ(g, 0, -60, 4); fs(g, '#e2363c');
  }
  g.restore();
}
function drawCookieGirl(g, x, y, o) { // Kroshka
  g.save(); g.translate(x, y); const s = o.s || 1; g.scale(s, s);
  const t = o.t || 0;
  line(g, -6, -8, -7, 0, '#5a3a1a', 3); line(g, 6, -8, 7, 0, '#5a3a1a', 3);
  ell(g, -6, -1, 5, 3); fs(g, '#ff8fb8'); ell(g, 8, -1, 5, 3); fs(g, '#ff8fb8');
  circ(g, 0, -36, 30);
  const gr = g.createRadialGradient(-8, -46, 4, 0, -36, 30); gr.addColorStop(0, '#f6d29a'); gr.addColorStop(1, '#d8a058');
  fs(g, gr, '#9a6a2a', 2.6);
  for (const c of [[-18, -48], [14, -54], [-20, -26], [18, -24], [4, -14], [-6, -58]]) { ell(g, c[0], c[1], 4, 3, c[0]); fs(g, '#5a2c12'); }
  eye(g, -9, -38, 5, 6.5, 0.5, 0); eye(g, 9, -38, 5, 6.5, 0.5, 0);
  g.globalAlpha *= 0.45; circ(g, -16, -28, 4); fs(g, '#ff7a9a'); circ(g, 16, -28, 4); fs(g, '#ff7a9a'); g.globalAlpha /= 0.45;
  g.beginPath(); g.arc(0, -28, 6, 0.2, Math.PI - 0.2); g.strokeStyle = '#5a2c12'; g.lineWidth = 2.2; g.stroke();
  // bow
  g.save(); g.translate(14, -64); g.rotate(0.3 + Math.sin(t * 3) * 0.05);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(-13, -9); g.lineTo(-13, 9); g.closePath(); fs(g, '#ff6fa8', '#b03070', 1.5);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(13, -9); g.lineTo(13, 9); g.closePath(); fs(g, '#ff6fa8', '#b03070', 1.5);
  circ(g, 0, 0, 4); fs(g, '#ff9fc8', '#b03070', 1.5);
  g.restore();
  line(g, -27, -30, -38, -40 + Math.sin(t * 5) * 6, '#5a3a1a', 2.6); glove(g, -38, -40 + Math.sin(t * 5) * 6);
  line(g, 27, -30, 36, -20, '#5a3a1a', 2.6); glove(g, 36, -20);
  g.restore();
}
function drawBaron(g, x, y, o) {
  g.save(); g.translate(x, y); const s = o.s || 1; g.scale(s, s);
  const t = o.t || 0;
  // cape
  g.beginPath(); g.moveTo(-26, -40); g.quadraticCurveTo(-46, -10, -40, 0); g.lineTo(40, 0); g.quadraticCurveTo(46, -10, 26, -40); g.closePath();
  fs(g, '#4e8a3a', '#2a5a1e', 2.4);
  g.strokeStyle = '#3a6e2a'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-20 + i * 13, -36); g.quadraticCurveTo(-24 + i * 13, -16, -30 + i * 18, 0); g.stroke(); }
  circ(g, 0, -42, 26);
  const gr = g.createRadialGradient(-8, -50, 3, 0, -42, 26); gr.addColorStop(0, '#b6e584'); gr.addColorStop(1, '#4e8a32');
  fs(g, gr, '#2a5a1e', 2.4);
  g.strokeStyle = '#3e7a2a'; g.lineWidth = 2;
  g.beginPath(); g.arc(-22, -42, 24, -0.8, 0.8); g.stroke(); g.beginPath(); g.arc(22, -42, 24, Math.PI - 0.8, Math.PI + 0.8); g.stroke();
  // crown
  g.beginPath(); g.moveTo(-14, -64); g.lineTo(-14, -76); g.lineTo(-7, -70); g.lineTo(0, -80); g.lineTo(7, -70); g.lineTo(14, -76); g.lineTo(14, -64); g.closePath(); fs(g, '#e8c24a', '#9a7a1a', 1.6);
  eye(g, -9, -46, 5, 6, 0.3, 0); eye(g, 9, -46, 5, 6, 0.3, 0);
  circ(g, 9, -46, 8); fs(g, null, '#7ad04a', 2.4); line(g, 16, -42, 20, -24, '#7ad04a', 1.4);
  brow(g, -9, -55, 10, 0.4, '#1d2a10', 3.4); brow(g, 9, -56, 10, -0.4, '#1d2a10', 3.4);
  g.beginPath(); g.moveTo(-10, -30); g.quadraticCurveTo(0, -26 - Math.sin(t * 6) * 3, 10, -32); g.strokeStyle = '#1d2a10'; g.lineWidth = 2.6; g.stroke();
  g.restore();
}
function drawBalloon(g, x, y, o) { // x,y = basket bottom center
  g.save(); g.translate(x, y);
  const t = o.t || 0;
  // ropes
  line(g, -24, -34, -40, -128, '#8a6a4a', 1.6); line(g, 24, -34, 40, -128, '#8a6a4a', 1.6); line(g, 0, -34, 0, -120, '#8a6a4a', 1.2);
  // meringue balloon
  g.save(); g.translate(0, -178 + Math.sin(t * 2) * 2);
  g.beginPath(); g.moveTo(0, -66); for (let i = 0; i <= 16; i++) { const a = -Math.PI / 2 + i * TAU / 16; const r = 56 + (i % 2 ? 5 : 0); g.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.95 + (Math.sin(a) > 0 ? Math.sin(a) * 6 : 0)); } g.closePath();
  const gr = g.createRadialGradient(-18, -22, 6, 0, 0, 66); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#f1e2cf');
  fs(g, gr, '#c9b08a', 2.4);
  g.strokeStyle = 'rgba(200,170,130,0.6)'; g.lineWidth = 2;
  for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(0, 0, 14 + i * 11, -2.6 + i * 0.4, -0.4 + i * 0.4); g.stroke(); }
  g.beginPath(); g.moveTo(0, -62); g.quadraticCurveTo(6, -78, 0, -86); g.quadraticCurveTo(-4, -76, 0, -62); fs(g, '#fff', '#c9b08a', 1.6);
  g.restore();
  // basket (waffle)
  g.beginPath(); g.moveTo(-26, -34); g.lineTo(26, -34); g.lineTo(20, 0); g.lineTo(-20, 0); g.closePath(); fs(g, '#e8b46a', '#9a6a2a', 2.4);
  g.save(); g.clip(); for (let i = -6; i < 8; i++) { line(g, -30 + i * 8, -36, -30 + i * 8 + 30, 2, 'rgba(150,100,40,0.5)', 1.3); line(g, -30 + i * 8 + 30, -36, -30 + i * 8, 2, 'rgba(150,100,40,0.5)', 1.3); } g.restore();
  rrect(g, -28, -38, 56, 7, 3); fs(g, '#c98b4e', '#7a4a1e', 1.6);
  if (o.captain !== false) {
    // Captain Beze (meringue pilot)
    g.save(); g.translate(10, -40);
    g.beginPath(); g.moveTo(-10, 0); g.quadraticCurveTo(-12, -18, 0, -26); g.quadraticCurveTo(12, -18, 10, 0); g.closePath(); fs(g, '#fffaf2', '#c9b08a', 1.6);
    rrect(g, -9, -18, 18, 7, 3); fs(g, '#7a5a3a');
    circ(g, -4, -14.5, 3.2); fs(g, '#9fd8ff', '#3a2a1a', 1.2); circ(g, 4, -14.5, 3.2); fs(g, '#9fd8ff', '#3a2a1a', 1.2);
    g.beginPath(); g.arc(0, -6, 3, 0.3, Math.PI - 0.3); g.strokeStyle = '#3a2a1a'; g.lineWidth = 1.4; g.stroke();
    line(g, 9, -10, 16, -18 + Math.sin(t * 6) * 4, '#c9b08a', 2); glove(g, 16, -18 + Math.sin(t * 6) * 4, 3);
    g.restore();
  }
  g.restore();
}

// ---------------- Items ----------------
function drawDrop(g, x, y, t, sz) {
  const s = sz || 1, w = Math.cos(t * 3);
  g.save(); g.translate(x, y); g.scale(s * (0.35 + Math.abs(w) * 0.65), s);
  g.beginPath(); g.moveTo(0, -11); g.quadraticCurveTo(3, -4, 8, 2); g.quadraticCurveTo(10, 9, 0, 9); g.quadraticCurveTo(-10, 9, -8, 2); g.quadraticCurveTo(-3, -4, 0, -11); g.closePath();
  const gr = g.createLinearGradient(-8, -10, 8, 9); gr.addColorStop(0, '#8a4a22'); gr.addColorStop(1, '#4a2410');
  fs(g, gr, '#2e140a', 1.4);
  ell(g, -3, 1, 2, 3.5, 0.3); fs(g, 'rgba(255,255,255,0.55)');
  g.restore();
}
function drawGoldCherry(g, x, y, t) {
  g.save(); g.translate(x, y + Math.sin(t * 3) * 2);
  const gl = g.createRadialGradient(0, 0, 2, 0, 0, 26); gl.addColorStop(0, 'rgba(255,230,120,0.6)'); gl.addColorStop(1, 'rgba(255,230,120,0)');
  g.fillStyle = gl; circ(g, 0, 0, 26); g.fill();
  g.beginPath(); g.moveTo(-6, 2); g.quadraticCurveTo(-4, -12, 3, -16); g.moveTo(7, 3); g.quadraticCurveTo(6, -10, 3, -16); g.strokeStyle = '#7a6a1a'; g.lineWidth = 2; g.stroke();
  ell(g, 6, -16, 5, 2.5, -0.4); fs(g, '#9ac040');
  for (const c of [[-6, 5], [7, 6]]) {
    circ(g, c[0], c[1], 7.5);
    const gr = g.createRadialGradient(c[0] - 2, c[1] - 3, 1, c[0], c[1], 8); gr.addColorStop(0, '#fff6b0'); gr.addColorStop(0.5, '#ffd23a'); gr.addColorStop(1, '#c9901a');
    fs(g, gr, '#8a5a0a', 1.5);
    circ(g, c[0] - 2.5, c[1] - 2.5, 2); fs(g, '#fff');
  }
  sparkle(g, 12 * Math.cos(t * 2), -12 + 6 * Math.sin(t * 3), 4 + Math.sin(t * 6) * 2, '#fff8c0');
  g.restore();
}
function drawCherryPair(g, x, y, col) {
  g.save(); g.translate(x, y);
  g.beginPath(); g.moveTo(-5, 2); g.quadraticCurveTo(-3, -10, 3, -13); g.moveTo(6, 3); g.quadraticCurveTo(5, -8, 3, -13); g.strokeStyle = '#4a6a1a'; g.lineWidth = 1.8; g.stroke();
  ell(g, 6, -13, 4.5, 2.2, -0.4); fs(g, '#7ac040');
  for (const c of [[-5, 5], [6, 6]]) { circ(g, c[0], c[1], 6.5); fs(g, col || '#e2363c', '#8a1a1a', 1.4); circ(g, c[0] - 2, c[1] - 2, 1.8); fs(g, '#fff'); }
  g.restore();
}
function drawFortune(g, x, y, t) {
  g.save(); g.translate(x, y + Math.sin(t * 2.5) * 2); g.rotate(Math.sin(t * 1.7) * 0.12);
  const gl = g.createRadialGradient(0, 0, 2, 0, 0, 24); gl.addColorStop(0, 'rgba(255,240,200,0.7)'); gl.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = gl; circ(g, 0, 0, 24); g.fill();
  g.beginPath(); g.moveTo(-14, 4); g.quadraticCurveTo(-12, -12, 0, -10); g.quadraticCurveTo(12, -12, 14, 4); g.quadraticCurveTo(6, 0, 0, 8); g.quadraticCurveTo(-6, 0, -14, 4); g.closePath();
  fs(g, '#f2c06a', '#a8742a', 1.8);
  g.save(); g.translate(2, 2); g.rotate(-0.3); g.fillStyle = '#fff'; g.fillRect(-2, -2, 18, 5); g.strokeStyle = '#c9b08a'; g.lineWidth = 0.8; g.strokeRect(-2, -2, 18, 5);
  line(g, 1, 0.5, 12, 0.5, '#e2363c', 1); g.restore();
  g.restore();
}
function drawIceCube(g, x, y, t) {
  g.save(); g.translate(x, y + Math.sin(t * 3) * 2); g.rotate(Math.sin(t * 2) * 0.1);
  rrect(g, -11, -11, 22, 22, 5);
  const gr = g.createLinearGradient(-11, -11, 11, 11); gr.addColorStop(0, '#f2fcff'); gr.addColorStop(1, '#8fd3f5');
  fs(g, gr, '#4aa0d0', 1.8);
  rrect(g, -7, -8, 6, 10, 2); fs(g, 'rgba(255,255,255,0.8)');
  sparkle(g, 8, -9, 3 + Math.sin(t * 7) * 1.5);
  g.restore();
}
function drawPowerIcon(g, kind, x, y, t, sz) {
  g.save(); g.translate(x, y); const s = sz || 1; g.scale(s, s);
  if (t !== undefined && sz === undefined) g.translate(0, Math.sin(t * 3) * 2.5);
  switch (kind) {
    case 'glaze': {
      g.beginPath(); g.moveTo(-12, 4); g.quadraticCurveTo(-13, -12, 0, -13); g.quadraticCurveTo(13, -12, 12, 4);
      g.quadraticCurveTo(9, 6, 8, 12); g.quadraticCurveTo(6, 6, 3, 6); g.quadraticCurveTo(0, 6, -2, 10); g.quadraticCurveTo(-4, 6, -8, 6); g.quadraticCurveTo(-11, 6, -12, 4); g.closePath();
      const gr = g.createLinearGradient(0, -13, 0, 10); gr.addColorStop(0, '#9a5a2a'); gr.addColorStop(1, '#5a2c12');
      fs(g, gr, '#2e140a', 1.8); ell(g, -4, -6, 3, 5, 0.4); fs(g, 'rgba(255,255,255,0.6)');
      for (let i = 0; i < 4; i++) { g.save(); g.translate(-6 + i * 4, -2 + (i % 2) * 4); g.rotate(i); g.fillStyle = SPRINKLES[i]; g.fillRect(-2, -0.8, 4, 1.6); g.restore(); }
      break;
    }
    case 'cherry': drawCherryPair(g, 0, 0); break;
    case 'mint': {
      circ(g, 0, 0, 12); fs(g, '#fff', '#c03040', 1.6);
      g.save(); circ(g, 0, 0, 12); g.clip();
      for (let i = 0; i < 6; i++) { g.save(); g.rotate(i * TAU / 6 + (t || 0)); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 12, 0, 0.5); g.closePath(); fs(g, i % 2 ? '#e2363c' : '#3ac08a'); g.restore(); }
      g.restore(); circ(g, 0, 0, 3); fs(g, '#fff');
      ell(g, -4, -5, 3, 2, -0.6); fs(g, 'rgba(255,255,255,0.8)');
      break;
    }
    case 'star': {
      star5(g, 0, 0, 14, 6.5);
      fs(g, `hsl(${((t || 0) * 300) % 360},95%,62%)`, '#8a6a00', 1.8);
      star5(g, 0, 0, 9, 4.2); fs(g, '#fff6a0');
      for (let i = 0; i < 5; i++) { const a = (t || 0) * 2 + i * TAU / 5; g.save(); g.translate(Math.cos(a) * 17, Math.sin(a) * 17); g.rotate(a); g.fillStyle = SPRINKLES[i]; g.fillRect(-2.5, -1, 5, 2); g.restore(); }
      break;
    }
    case 'parachute': {
      line(g, 0, 12, 0, -2, '#c98b4e', 2.4);
      for (const p of [[-8, -6, 8, '#f9b3d1'], [8, -6, 8, '#a9d8f5'], [0, -12, 9, '#ffd4e6'], [-3, -3, 7, '#d2b8f0']]) { circ(g, p[0], p[1], p[2]); fs(g, p[3]); }
      break;
    }
    case 'life': {
      g.scale(0.38, 0.38); g.translate(0, 40);
      drawBanniBody(g, { t: 0, hp: 3, pose: 'idle' });
      break;
    }
  }
  g.restore();
}
function drawBlock(g, x, y, o) { // 40x40 waffle bonus block
  g.save(); g.translate(x, y - (o.bump || 0));
  if (o.kind === 'brick') {
    rrect(g, 1, 1, 38, 38, 4); fs(g, '#6a3a1e', '#3a1a0a', 2);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { rrect(g, 4 + i * 17, 4 + j * 17, 15, 15, 3); fs(g, '#8a4e28', '#4a2410', 1.2); ell(g, 8 + i * 17, 8 + j * 17, 3, 2, -0.5); fs(g, 'rgba(255,255,255,0.3)'); }
  } else if (o.used) {
    rrect(g, 1, 1, 38, 38, 5); fs(g, '#c99a62', '#7a5a2a', 2);
    for (let i = 1; i < 4; i++) { line(g, 1 + i * 9.5, 3, 1 + i * 9.5, 37, 'rgba(120,80,30,0.5)', 1.5); line(g, 3, 1 + i * 9.5, 37, 1 + i * 9.5, 'rgba(120,80,30,0.5)', 1.5); }
  } else {
    rrect(g, 1, 1, 38, 38, 5);
    const gr = g.createLinearGradient(0, 0, 0, 40); gr.addColorStop(0, '#ffd88a'); gr.addColorStop(1, '#e8a84e');
    fs(g, gr, '#9a6a2a', 2.2);
    for (let i = 1; i < 4; i++) { line(g, 1 + i * 9.5, 3, 1 + i * 9.5, 37, 'rgba(160,100,40,0.55)', 1.8); line(g, 3, 1 + i * 9.5, 37, 1 + i * 9.5, 'rgba(160,100,40,0.55)', 1.8); }
    // chocolate drizzle "?"
    g.save(); g.translate(20, 20); const p = Math.sin((o.t || 0) * 4) * 0.08 + 1; g.scale(p, p);
    g.font = '900 24px Nunito, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 4; g.strokeStyle = '#fff6e0'; g.strokeText('?', 0, 1); g.fillStyle = '#6a3214'; g.fillText('?', 0, 1);
    g.restore();
    rrect(g, 4, 3, 32, 5, 2.5); fs(g, 'rgba(255,255,255,0.35)');
  }
  g.restore();
}
