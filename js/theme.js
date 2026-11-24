'use strict';
// ================= theme.js : terrain + backgrounds per level =================
const ASSETS = {};
function loadImage(key, src) {
  return new Promise(res => { const im = new Image(); im.onload = () => { ASSETS[key] = im; res(im); }; im.onerror = () => res(null); im.src = src; });
}
const artGround = t => isSolidT(t) || isSlopeT(t) || t === TL.FAKE;

function parallaxImage(ctx, img, camX, p, y, h, viewW) {
  if (!img) return;
  const w = img.width * h / img.height;
  const off = camX * p;
  const k0 = Math.floor(off / w);
  for (let k = k0; k * w - off < viewW; k++) {
    const x = Math.floor(k * w - off);
    if (((k % 2) + 2) % 2 === 0) ctx.drawImage(img, x, y, Math.ceil(w) + 1, h);
    else { ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, Math.ceil(w) + 1, h); ctx.restore(); }
  }
}
function stripCanvas(S, w, h, painter) {
  const cv = document.createElement('canvas'); cv.width = Math.round(w * S); cv.height = Math.round(h * S);
  const g = cv.getContext('2d'); g.scale(S, S);
  painter(g, w, h);
  return cv;
}
function drawStrip(ctx, cv, logicalW, logicalH, camX, p, bottomY, viewW) {
  const off = (camX * p) % logicalW;
  for (let x = -off; x < viewW; x += logicalW) ctx.drawImage(cv, Math.floor(x), bottomY - logicalH, logicalW + 1, logicalH);
}

// ---------- generic terrain renderer ----------
function cornerPath(g, x, y, w, h, rTL, rTR, rBR, rBL) {
  g.beginPath();
  g.moveTo(x + rTL, y);
  g.lineTo(x + w - rTR, y); if (rTR) g.quadraticCurveTo(x + w, y, x + w, y + rTR);
  g.lineTo(x + w, y + h - rBR); if (rBR) g.quadraticCurveTo(x + w, y + h, x + w - rBR, y + h);
  g.lineTo(x + rBL, y + h); if (rBL) g.quadraticCurveTo(x, y + h, x, y + h - rBL);
  g.lineTo(x, y + rTL); if (rTL) g.quadraticCurveTo(x, y, x + rTL, y);
  g.closePath();
}
function depthOf(L, c, r) { let d = 0; while (d < 6 && artGround(L.get(c, r - d - 1))) d++; return d; }

function drawTileBody(g, L, th, c, r, t) {
  if (th.special && th.special(g, L, c, r, t)) return;
  const x = c * T, y = r * T;
  const d = depthOf(L, c, r);
  const col = th.bodyColor(c, r, d);
  if (isSlopeT(t)) {
    g.beginPath();
    if (slopeRises(t)) { g.moveTo(x - 0.5, y + T + 0.5); g.lineTo(x + T + 0.5, y - 0.5); g.lineTo(x + T + 0.5, y + T + 0.5); }
    else { g.moveTo(x - 0.5, y - 0.5); g.lineTo(x + T + 0.5, y + T + 0.5); g.lineTo(x - 0.5, y + T + 0.5); }
    g.closePath(); g.fillStyle = col; g.fill();
    return;
  }
  const up = artGround(L.get(c, r - 1)), dn = artGround(L.get(c, r + 1)) || r + 1 >= L.H;
  const lf = artGround(L.get(c - 1, r)) || c - 1 < 0, rt = artGround(L.get(c + 1, r)) || c + 1 >= L.W;
  const R = 12;
  cornerPath(g, x - 0.5, y - 0.5, T + 1, T + 1, (!up && !lf) ? R : 0, (!up && !rt) ? R : 0, (!dn && !rt) ? R : 0, (!dn && !lf) ? R : 0);
  g.fillStyle = col; g.fill();
  th.bodyDetail(g, c, r, d, x, y);
  // rims on exposed sides
  if (!lf) { const gr = g.createLinearGradient(x, 0, x + 8, 0); gr.addColorStop(0, th.rim); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x, y + (up ? 0 : 8), 8, T - (up ? 0 : 8) - (dn ? 0 : 8)); }
  if (!rt) { const gr = g.createLinearGradient(x + T, 0, x + T - 8, 0); gr.addColorStop(0, th.rim); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x + T - 8, y + (up ? 0 : 8), 8, T - (up ? 0 : 8) - (dn ? 0 : 8)); }
  if (!dn) { g.fillStyle = th.rim; g.fillRect(x + (lf ? 0 : 8), y + T - 4, T - (lf ? 0 : 8) - (rt ? 0 : 8), 4); }
}
function drawTileSurface(g, L, th, c, r, t) {
  if (th.specialTop && th.specialTop(g, L, c, r, t)) return;
  if (artGround(L.get(c, r - 1))) return;
  const x = c * T, y = r * T;
  const ice = isIceT(t);
  const lf = artGround(L.get(c - 1, r)) || artGround(L.get(c - 1, r + 1)) || artGround(L.get(c - 1, r - 1)) || c === 0;
  const rt = artGround(L.get(c + 1, r)) || artGround(L.get(c + 1, r - 1)) || artGround(L.get(c + 1, r + 1)) || c === L.W - 1;
  if (isSlopeT(t)) {
    const rise = slopeRises(t);
    const ya = rise ? y + T : y, yb = rise ? y : y + T;
    g.beginPath(); g.moveTo(x - 0.5, ya - 3); g.lineTo(x + T + 0.5, yb - 3); g.lineTo(x + T + 0.5, yb + 13); g.lineTo(x - 0.5, ya + 13); g.closePath();
    g.fillStyle = ice ? th.iceTop : th.top(c, r); g.fill();
    g.beginPath(); g.moveTo(x - 0.5, ya + 13); g.lineTo(x + T + 0.5, yb + 13); g.strokeStyle = ice ? th.iceEdge : th.topEdge; g.lineWidth = 2; g.stroke();
    if (ice) { th.iceShine(g, x, ya, x + T, yb); }
    else th.surfaceBits(g, c, r, (k) => ({ x: x + k * T, y: lerp(ya, yb, k) + 3 }));
    return;
  }
  // flat top band with drips
  const top = th.top(c, r);
  const xs = x - (lf ? 0.5 : -2), xe = x + T + (rt ? 0.5 : -2);
  g.beginPath();
  g.moveTo(xs, y + 6);
  if (!lf) g.quadraticCurveTo(xs, y - 3, xs + 8, y - 3); else g.lineTo(xs, y - 3);
  const n = 4;
  for (let i = 1; i < n; i++) g.lineTo(x + i * T / n, y - 3 - hash2(c * 7 + i, r) * 2);
  if (!rt) { g.lineTo(xe - 8, y - 3); g.quadraticCurveTo(xe, y - 3, xe, y + 6); } else g.lineTo(xe, y - 3);
  g.lineTo(xe, y + 12);
  // drips
  const dr = th.drips && !ice;
  for (let i = n; i >= 0; i--) {
    const px = x + i * T / n;
    if (dr && i > 0 && i < n && hash2(c * 13 + i, r * 3) < 0.38) {
      const dl = 6 + hash2(c, r * 7 + i) * 12;
      g.lineTo(px + 4, y + 12); g.lineTo(px + 4, y + 12 + dl - 4); g.arc(px, y + 12 + dl - 4, 4, 0, Math.PI); g.lineTo(px - 4, y + 12);
    } else g.lineTo(px, y + 12 + (i % 2 ? 1.5 : 0));
  }
  g.closePath();
  g.fillStyle = ice ? th.iceTop : top; g.fill();
  g.strokeStyle = ice ? th.iceEdge : th.topEdge; g.lineWidth = 1.5; g.stroke();
  if (ice) th.iceShine(g, x, y, x + T, y);
  else th.surfaceBits(g, c, r, k => ({ x: x + k * T, y: y + 3 }));
}
function runsInRow(L, r, type, c0, c1) {
  const out = [];
  let c = Math.max(0, c0);
  while (c > 0 && L.get(c - 1, r) === type && L.get(c, r) === type) c--;
  for (; c <= Math.min(L.W - 1, c1); c++) {
    if (L.get(c, r) === type) { let e = c; while (e + 1 < L.W && L.get(e + 1, r) === type) e++; out.push([c, e]); c = e; }
  }
  return out;
}
function drawTerrainChunk(g, G, x0, y0, CS, th) {
  const L = G.level;
  const c0 = Math.max(0, Math.floor(x0 / T) - 1), c1 = Math.min(L.W - 1, Math.floor((x0 + CS) / T) + 1);
  const r0 = Math.max(0, Math.floor(y0 / T) - 1), r1 = Math.min(L.H - 1, Math.floor((y0 + CS) / T) + 1);
  g.save(); g.beginPath(); g.rect(x0, y0, CS, CS); g.clip();
  const inChunk = d => d.x + (d.w || 0) + 140 > x0 && d.x - 140 < x0 + CS && (d.y + 60) > y0 && (d.y - (d.h || 400)) < y0 + CS;
  for (const d of G.decoBack) if (inChunk(d)) th.deco(g, d, G);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) { const t = L.get(c, r); if (isSolidT(t) || isSlopeT(t)) drawTileBody(g, L, th, c, r, t); }
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) { const t = L.get(c, r); if (isSolidT(t) || isSlopeT(t)) drawTileSurface(g, L, th, c, r, t); }
  for (let r = r0; r <= r1; r++) {
    for (const [a, b] of runsInRow(L, r, TL.ONEWAY, c0, c1)) th.plank(g, a * T, r * T, (b - a + 1) * T, a);
    for (const [a, b] of runsInRow(L, r, TL.CROWN, c0, c1)) th.crown(g, a * T, r * T, (b - a + 1) * T, a);
    for (const [a, b] of runsInRow(L, r, TL.CLOUD, c0, c1)) th.cloud(g, a * T, r * T, (b - a + 1) * T, a);
    for (const [a, b] of runsInRow(L, r, TL.THORN, c0, c1)) th.thorns(g, a * T, r * T, (b - a + 1) * T, a);
  }
  for (const d of G.decoFront) if (inChunk(d)) th.deco(g, d, G);
  g.restore();
}
function drawFakeTiles(ctx, G, alpha) {
  if (!G.fakeTiles.length) return;
  if (alpha < 0.995) {
    const S = G.S, key = G.levelId + ':' + S;
    if (!G.fakeCache || G.fakeCache.key !== key) {
      let c0 = 1e9, c1 = -1, r0 = 1e9, r1 = -1;
      for (const [c, r] of G.fakeTiles) { c0 = Math.min(c0, c); c1 = Math.max(c1, c); r0 = Math.min(r0, r); r1 = Math.max(r1, r); }
      const x0 = (c0 - 1) * T, y0 = (r0 - 1) * T, w = (c1 - c0 + 3) * T, h = (r1 - r0 + 3) * T;
      const cv = document.createElement('canvas'); cv.width = Math.ceil(w * S); cv.height = Math.ceil(h * S);
      const g = cv.getContext('2d'); g.setTransform(S, 0, 0, S, -x0 * S, -y0 * S);
      drawFakeTiles(g, G, 1);
      G.fakeCache = { key, cv, x0, y0, w, h };
    }
    const fc = G.fakeCache;
    ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(fc.cv, fc.x0, fc.y0, fc.w, fc.h); ctx.restore();
    return;
  }
  ctx.save(); ctx.globalAlpha = alpha;
  const L = G.level, th = G.theme;
  for (const [c, r] of G.fakeTiles) {
    if (alpha >= 0.995 && ((c + 1) * T < G.cam.x - 10 || c * T > G.cam.x + G.viewW + 10)) continue;
    drawTileBody(ctx, L, th, c, r, TL.SOLID);
  }
  for (const [c, r] of G.fakeTiles) { if (alpha >= 0.995 && ((c + 1) * T < G.cam.x - 10 || c * T > G.cam.x + G.viewW + 10)) continue; drawTileSurface(ctx, L, th, c, r, TL.SOLID); }
  ctx.restore();
}

// ---------- Level 1: Ice cream mountains ----------
const FLAV = {
  van: ['#fbe9c6', '#efd5a2', '#e2c08a'],
  pink: ['#f9c4d1', '#efa6b9', '#e391a7'],
  mint: ['#cdeccb', '#acdbae', '#93c997']
};
function flavorAt(c) { const k = Math.floor((c + 3) / 15); return ['van', 'pink', 'mint'][Math.floor(hash2(k, 7) * 3)]; }
const THEME1 = {
  id: 1, rim: 'rgba(120,60,60,0.22)', topEdge: 'rgba(205,170,140,0.9)', iceTop: '#d6f3ff', iceEdge: '#7cc4e8', drips: true,
  bodyColor(c, r, d) { const band = Math.floor((r + 1) / 2) % 3; return ['#fbe6c2', '#f9c4d1', '#cdeccb'][band]; },
  bodyDetail(g, c, r, d, x, y) {
    if ((r + 1) % 2 === 0 && d >= 1) {
      g.fillStyle = ['#fbe6c2', '#f9c4d1', '#cdeccb'][(Math.floor((r + 1) / 2) + 2) % 3];
      g.beginPath(); g.moveTo(x - 0.5, y - 0.5); g.lineTo(x + T + 0.5, y - 0.5);
      for (let k = 4; k >= 0; k--) { const px = x + k * 10; g.lineTo(px, y + 5 + (hash2(c * 5 + k, r) * 7)); }
      g.closePath(); g.fill();
      for (let k = 0; k < 4; k++) { if (hash2(c * 3 + k, r * 11) < 0.35) { const px = x + 5 + k * 10; g.beginPath(); g.ellipse(px, y + 10, 3, 6, 0, 0, TAU); g.fill(); } }
    }
    if (hash2(c * 7, r * 3) < 0.3) { g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.ellipse(x + 10 + hash2(c, r) * 20, y + 12 + hash2(r, c) * 16, 8, 4, 0.3, 0, TAU); g.fill(); }
    if (d >= 1 && hash2(c, r) < 0.24) {
      const cx = x + 8 + hash2(c + 3, r) * 24, cy = y + 8 + hash2(c, r + 5) * 24, s = 4 + hash2(c * 3, r) * 4;
      g.beginPath(); g.moveTo(cx - s, cy + s * 0.6); g.lineTo(cx - s * 0.2, cy - s); g.lineTo(cx + s, cy - s * 0.3); g.lineTo(cx + s * 0.7, cy + s * 0.8); g.closePath();
      g.fillStyle = '#5a2c12'; g.fill(); g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(cx - s * 0.3, cy - s * 0.6, s * 0.5, 1.5);
    }
    if (d >= 2 && (r % 3 === 0)) { g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y + 20 + Math.sin(c) * 3); g.quadraticCurveTo(x + 20, y + 14, x + T, y + 20 + Math.sin(c + 1) * 3); g.stroke(); }
  },
  top(c, r) { return '#fffaf0'; },
  surfaceBits(g, c, r, at) {
    for (let i = 0; i < 4; i++) {
      const k = (i + 0.5) / 4 + (hash2(c * 5 + i, r) - 0.5) * 0.15;
      const p = at(k);
      g.save(); g.translate(p.x, p.y + hash2(c, r * 9 + i) * 5); g.rotate(hash2(c + i, r) * 6);
      g.fillStyle = SPRINKLES[Math.floor(hash2(c * 3 + i, r * 5) * 6)]; rrect(g, -3.5, -1.2, 7, 2.4, 1.2); g.fill(); g.restore();
    }
  },
  iceShine(g, xa, ya, xb, yb) {
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(xa + 6, ya + 2 + (yb - ya) * 0.15); g.lineTo(xa + 16, ya + 2 + (yb - ya) * 0.4); g.stroke();
    g.beginPath(); g.moveTo(xa + 24, ya + 5 + (yb - ya) * 0.6); g.lineTo(xa + 30, ya + 5 + (yb - ya) * 0.75); g.stroke();
  },
  plank(g, x, y, w) {
    rrect(g, x + 1, y, w - 2, 13, 6); fs(g, '#efc27f', '#a8742a', 1.8);
    g.save(); rrect(g, x + 1, y, w - 2, 13, 6); g.clip();
    for (let i = 0; i < w; i += 9) { line(g, x + i, y, x + i + 8, y + 13, 'rgba(160,100,40,0.5)', 1.2); line(g, x + i + 8, y, x + i, y + 13, 'rgba(160,100,40,0.5)', 1.2); }
    g.fillStyle = '#7a4a2a'; g.fillRect(x, y + 5, w, 3);
    g.restore();
  },
  crown() { }, cloud() { }, thorns() { },
  deco(g, d, G) {
    switch (d.k) {
      case 'scoop': {
        const f = FLAV[d.f || 'pink'];
        g.save(); g.translate(d.x, d.y);
        g.beginPath(); g.arc(0, 0, d.r, Math.PI, 0); g.closePath();
        const gr = g.createRadialGradient(-d.r * 0.3, -d.r * 0.5, d.r * 0.1, 0, -d.r * 0.2, d.r * 1.1); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, f[0]); gr.addColorStop(1, f[1]);
        fs(g, gr, 'rgba(160,100,100,0.4)', 2);
        for (let i = 0; i < 9; i++) { const a = Math.PI + 0.2 + i * 0.32, rr = d.r * (0.45 + (i % 3) * 0.17); g.save(); g.translate(Math.cos(a) * rr, Math.sin(a) * rr); g.rotate(i); g.fillStyle = SPRINKLES[i % 7]; rrect(g, -4, -1.3, 8, 2.6, 1.3); g.fill(); g.restore(); }
        if (d.cherry) { drawCherryPair(g, 0, -d.r - 4); }
        g.restore(); break;
      }
      case 'ball': {
        const f = FLAV[d.f || 'pink'];
        g.save(); g.translate(d.x, d.y);
        circ(g, 0, 0, d.r);
        const gr = g.createRadialGradient(-d.r * 0.35, -d.r * 0.4, d.r * 0.1, 0, 0, d.r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, f[0]); gr.addColorStop(1, f[1]);
        fs(g, gr, 'rgba(160,100,100,0.45)', 2);
        g.beginPath(); for (let i = 0; i <= 8; i++) { const a = 0.15 + i * (Math.PI - 0.3) / 8; g.lineTo(Math.cos(a) * d.r * 1.02, Math.sin(a) * d.r * 0.55 + (i % 2) * 7); } g.closePath(); fs(g, f[1]);
        for (let i = 0; i < 5; i++) { g.save(); g.translate(Math.cos(i * 1.7) * d.r * 0.5, Math.sin(i * 1.3) * d.r * 0.4 - d.r * 0.2); g.rotate(i); g.fillStyle = SPRINKLES[i]; g.fillRect(-4, -1.2, 8, 2.4); g.restore(); }
        g.restore(); break;
      }
      case 'cone': {
        g.save(); g.translate(d.x, d.y); g.rotate(d.rot || 0); const s = d.s || 1; g.scale(s, s);
        g.beginPath(); g.moveTo(-22, 0); g.lineTo(22, 0); g.lineTo(0, -70); g.closePath(); fs(g, '#e8b46a', '#9a6a2a', 2.2);
        g.save(); g.clip(); for (let i = -8; i < 8; i++) { line(g, i * 8, 0, i * 8 + 40, -80, 'rgba(150,100,40,0.5)', 1.4); line(g, i * 8, 0, i * 8 - 40, -80, 'rgba(150,100,40,0.5)', 1.4); } g.restore();
        g.restore(); break;
      }
      case 'wafers': {
        g.save(); g.translate(d.x, d.y);
        for (let i = 0; i < 3; i++) { g.save(); g.translate(i * 26, 0); g.rotate(-0.5 + i * 0.12); rrect(g, -5, -60, 10, 62, 5); fs(g, '#d9a35a', '#8a5a1e', 1.6); for (let j = 0; j < 6; j++) line(g, -5, -55 + j * 10, 5, -50 + j * 10, '#7a4a1e', 2); g.restore(); }
        g.restore(); break;
      }
      case 'chiprock': {
        g.save(); g.translate(d.x, d.y); const s = d.s || 1; g.scale(s, s);
        g.beginPath(); g.moveTo(-18, 0); g.lineTo(-14, -16); g.lineTo(-2, -26); g.lineTo(12, -20); g.lineTo(18, 0); g.closePath();
        const gr = g.createLinearGradient(-10, -26, 10, 0); gr.addColorStop(0, '#8a4a22'); gr.addColorStop(1, '#4a2410'); fs(g, gr, '#2e140a', 2);
        line(g, -8, -16, 0, -22, 'rgba(255,255,255,0.4)', 2);
        g.restore(); break;
      }
      case 'sign': {
        g.save(); g.translate(d.x, d.y);
        rrect(g, -3, -56, 6, 56, 3); fs(g, '#c98b4e', '#7a4a1e', 1.5);
        rrect(g, -34, -78, 68, 30, 7); fs(g, '#f2c98a', '#9a6a2a', 2);
        g.font = '900 15px Nunito, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#6a3214';
        g.fillText(d.text || '→', 0, -62);
        g.restore(); break;
      }
      case 'hint': break;
      default: if (THEME2.decoExtra) THEME2.decoExtra(g, d, G);
    }
  },
  mid: null, midKey: 0,
  buildMid(S) {
    this.mid = stripCanvas(S, 1800, 260, (g, w, h) => {
      const fl = ['pink', 'van', 'mint', 'pink', 'mint', 'van', 'pink', 'van', 'mint'];
      for (let pass = -1; pass <= 1; pass++) {
        for (let i = 0; i < 9; i++) {
          const x = i * 200 + 60 + pass * 1800 + (i % 2) * 40, r = 90 + (i * 37) % 60;
          const f = FLAV[fl[i]];
          g.beginPath(); g.arc(x, h, r, Math.PI, 0); g.closePath();
          const gr = g.createLinearGradient(0, h - r, 0, h); gr.addColorStop(0, f[0]); gr.addColorStop(1, f[1]); g.fillStyle = gr; g.fill();
          g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(x - r * 0.3, h - r * 0.55, r * 0.2, 0, TAU); g.fill();
          if (i % 3 === 0) drawCherryPair(g, x, h - r - 4);
          for (let j = 0; j < 6; j++) { g.save(); g.translate(x - r * 0.6 + j * r * 0.25, h - r * 0.4 - (j % 2) * r * 0.25); g.rotate(j * 1.7); g.fillStyle = SPRINKLES[(i + j) % 7]; g.fillRect(-4, -1.2, 8, 2.4); g.restore(); }
        }
      }
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(214,240,236,0.32)'; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over';
    });
  },
  drawBackground(ctx, G, camX, camY, S) {
    const W = G.viewW;
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H); sky.addColorStop(0, '#8ccbc4'); sky.addColorStop(1, '#f6e2e6');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, VIEW_H);
    const h = VIEW_H * 1.08;
    parallaxImage(ctx, ASSETS.bg1, camX, 0.1, -20 - camY * 0.08, h, W);
    if (!this.mid || this.midKey !== S) { this.buildMid(S); this.midKey = S; }
    drawStrip(ctx, this.mid, 1800, 260, camX, 0.32, VIEW_H + 30 - camY * 0.35, W);
  },
  drawLiquid(ctx, G, camX, camY) {
    const L = G.level, base = L.H * T - 30, t = G.time;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(camX - 10, L.H * T + 10);
    for (let x = Math.floor(camX / 20) * 20 - 20; x <= camX + G.viewW + 20; x += 20) ctx.lineTo(x, base + Math.sin(x * 0.03 + t * 2) * 4);
    ctx.lineTo(camX + G.viewW + 20, L.H * T + 10); ctx.closePath();
    const gr = ctx.createLinearGradient(0, base - 6, 0, L.H * T); gr.addColorStop(0, '#fde3ec'); gr.addColorStop(0.3, '#f6b8cc'); gr.addColorStop(1, '#e98fac');
    ctx.fillStyle = gr; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 12; i++) { const bx = Math.floor(camX / 300) * 300 + i * 97 % 1400, by = base + 8 + ((t * 20 + i * 13) % 20); ctx.beginPath(); ctx.arc(bx, by, 2 + i % 3, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  particleColors: ['#fffaf0', '#f9c4d1', '#cdeccb']
};

// ---------- Level 2: Cotton candy forest ----------
const CAKE = ['#f9d2e4', '#e6d2f6', '#fde6c8'];
const CROWNC = [['#f9b3d1', '#ffd6e8', '#e58ab4'], ['#a9d8f5', '#d6efff', '#7cb8e0'], ['#d2b8f0', '#ebdcff', '#a98ad6']];
const THEME2 = {
  id: 2, rim: 'rgba(110,60,120,0.22)', topEdge: '#d97aa6', iceTop: '#d6f3ff', iceEdge: '#7cc4e8', drips: true,
  bodyColor(c, r, d) { const b = CAKE[((r % 3) + 3) % 3]; return d >= 4 ? '#e4c9ec' : b; },
  bodyDetail(g, c, r, d, x, y) {
    if (d >= 1) { for (let i = 0; i < 3; i++) { const h = hash2(c * 3 + i, r * 7); if (h < 0.5) { g.fillStyle = SPRINKLES[Math.floor(h * 12) % 6]; g.fillRect(x + 6 + hash2(c + i, r) * 26, y + 6 + hash2(c, r + i) * 26, 3, 3); } } }
    if (d >= 1 && (r % 3 === 0)) { g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(x, y, T + 0.5, 3); }
  },
  top(c, r) { return '#f7a9c9'; },
  surfaceBits(g, c, r, at) {
    for (let i = 0; i < 3; i++) {
      const p = at((i + 0.5) / 3);
      if (hash2(c * 5 + i, r) < 0.5) { g.fillStyle = '#f2b53a'; g.beginPath(); g.ellipse(p.x, p.y + 6, 3, 5, 0, 0, TAU); g.fill(); }
      else { g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.arc(p.x, p.y + 1, 2, 0, TAU); g.fill(); }
    }
  },
  iceShine: THEME1.iceShine,
  plank(g, x, y, w) {
    rrect(g, x + 1, y, w - 2, 14, 7); fs(g, '#c98b4e', '#7a4a1e', 1.8);
    g.beginPath(); g.moveTo(x + 3, y + 5);
    for (let i = 0; i <= w - 6; i += 10) g.quadraticCurveTo(x + 3 + i + 5, y + 12, x + 3 + i + 10, y + 5);
    g.lineTo(x + w - 3, y); g.lineTo(x + 3, y); g.closePath(); fs(g, '#f7a9c9');
  },
  crown(g, x, y, w, a) {
    const C = CROWNC[Math.floor(hash2(a, 3) * 3)];
    const n = Math.max(2, Math.round(w / 26));
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i <= n; i++) {
        const px = x + 10 + i * (w - 20) / n, rr = (pass ? 11 : 17) + hash2(a + i, 9) * 6;
        const py = y + (pass ? 2 : 12) + Math.sin(i * 1.7) * 3;
        circ(g, px, py, rr); g.fillStyle = pass ? C[1] : C[0]; g.fill();
      }
    }
    g.globalAlpha *= 0.6; circ(g, x + 16, y + 1, 5); fs(g, '#fff'); g.globalAlpha /= 0.6;
    g.strokeStyle = C[2]; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 6, y + 26); g.quadraticCurveTo(x + w / 2, y + 36, x + w - 6, y + 26); g.stroke();
  },
  cloud(g, x, y, w, a) {
    const n = Math.max(2, Math.round(w / 22));
    for (let i = 0; i < n; i++) { const px = x + 8 + i * (w - 16) / (n - 1 || 1); line(g, px, y + 10, px + Math.sin(i) * 3, y + 24 + (i % 3) * 6, 'rgba(255,220,240,0.9)', 2.4); }
    for (let i = 0; i <= n; i++) { const px = x + 8 + i * (w - 16) / n; circ(g, px, y + 6 + (i % 2) * 2, 13); g.fillStyle = '#fff1f8'; g.fill(); }
    for (let i = 0; i < n; i++) { const px = x + 14 + i * (w - 16) / n; circ(g, px, y + 1, 7); g.fillStyle = '#ffffff'; g.fill(); }
    g.strokeStyle = 'rgba(230,160,200,0.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + 4, y + 16); g.lineTo(x + w - 4, y + 16); g.stroke();
  },
  thorns(g, x, y, w, a) {
    const n = Math.max(1, Math.round(w / 20));
    for (let i = 0; i <= n; i++) { const px = x + 6 + i * (w - 12) / n; const py = y + 22 + (i % 2) * 4; circ(g, px, py, 14); g.fillStyle = '#5b2a6e'; g.fill(); }
    for (let i = 0; i <= n * 2; i++) {
      const px = x + 4 + i * (w - 8) / (n * 2), py = y + 14 + (i % 3) * 6;
      g.beginPath(); g.moveTo(px - 3, py); g.lineTo(px, py - 11); g.lineTo(px + 3, py); g.closePath(); fs(g, '#f0d6f7');
    }
    for (let i = 0; i < n * 2; i++) { const px = x + 10 + hash2(a + i, 1) * (w - 20), py = y + 20 + hash2(a, i) * 14; for (const o of [[0, 0], [3, 2], [-3, 2], [0, 4]]) { circ(g, px + o[0], py + o[1], 2.6); fs(g, '#2a0a3a'); } circ(g, px - 1, py - 1, 1); fs(g, '#fff'); }
  },
  deco(g, d, G) {
    switch (d.k) {
      case 'trunk': {
        const w = d.w || 24, x = d.x - w / 2;
        g.save(); rrect(g, x, d.y - d.h, w, d.h + 6, 6); g.clip();
        g.fillStyle = '#fbe0d0'; g.fillRect(x, d.y - d.h, w, d.h + 6);
        g.fillStyle = '#ea94a8';
        for (let yy = d.y - d.h - w; yy < d.y + 10; yy += 26) { g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy - 14); g.lineTo(x + w, yy - 2); g.lineTo(x, yy + 12); g.closePath(); g.fill(); }
        const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, 'rgba(120,40,80,0.25)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.2)'); gr.addColorStop(1, 'rgba(120,40,80,0.3)');
        g.fillStyle = gr; g.fillRect(x, d.y - d.h, w, d.h + 6);
        g.restore();
        if (d.bx !== undefined) {
          g.beginPath(); g.moveTo(d.x, d.by + 14); g.quadraticCurveTo((d.x + d.bx) / 2, d.by - 14, d.bx - 6, d.by - 4);
          g.strokeStyle = '#7a3a5a'; g.lineWidth = 11; g.lineCap = 'round'; g.stroke(); g.strokeStyle = '#c96a9a'; g.lineWidth = 6; g.stroke();
          for (let i = 0; i < 4; i++) { circ(g, d.x - 10 + i * 9, d.by - 30 - (i % 2) * 8, 18); g.fillStyle = ['#f9b3d1', '#d2b8f0', '#a9d8f5', '#f9b3d1'][i]; g.fill(); }
        }
        break;
      }
      case 'mush': {
        g.save(); g.translate(d.x, d.y); const s = d.s || 1; g.scale(s, s);
        rrect(g, -5, -18, 10, 18, 4); fs(g, '#fff6ee', '#c9a9b8', 1.4);
        g.beginPath(); g.moveTo(-16, -16); g.quadraticCurveTo(-16, -34, 0, -34); g.quadraticCurveTo(16, -34, 16, -16); g.closePath(); fs(g, '#ffffff', '#d9b8c8', 1.6);
        for (const p of [[-7, -24], [5, -27], [9, -20]]) { circ(g, p[0], p[1], 2.6); fs(g, '#ffb0cc'); }
        g.restore(); break;
      }
      case 'lolly': {
        g.save(); g.translate(d.x, d.y); const s = d.s || 1; g.scale(s, s);
        rrect(g, -2.5, -60, 5, 60, 2); fs(g, '#fff', '#c9b8c8', 1);
        circ(g, 0, -72, 18); fs(g, '#ffd6e8', '#c86a9a', 2);
        g.beginPath(); for (let i = 0; i < 40; i++) { const a = i * 0.45, r = i * 0.42; g.lineTo(Math.cos(a) * r, -72 + Math.sin(a) * r); } g.strokeStyle = '#e8508a'; g.lineWidth = 3; g.stroke();
        g.restore(); break;
      }
      case 'sign': THEME1.deco(g, d, G); break;
      case 'scoop': case 'ball': case 'cone': case 'chiprock': case 'wafers': THEME1.deco(g, d, G); break;
    }
  },
  mid: null, midKey: 0,
  buildMid(S) {
    this.mid = stripCanvas(S, 1600, 520, (g, w, h) => {
      for (let pass = -1; pass <= 1; pass++) {
        for (let i = 0; i < 7; i++) {
          const x = pass * 1600 + 80 + i * 230 + (i % 2) * 50, th = 300 + (i * 71) % 160;
          g.fillStyle = 'rgba(216,190,235,0.75)'; g.fillRect(x - 10, h - th, 20, th);
          const C = ['#e6c4ec', '#c9d8f2', '#f0c9de'][i % 3];
          for (let k = 0; k < 7; k++) { const a = k / 7 * TAU; g.beginPath(); g.arc(x + Math.cos(a) * 42, h - th + Math.sin(a) * 26, 36, 0, TAU); g.fillStyle = C; g.fill(); }
          g.beginPath(); g.arc(x, h - th, 44, 0, TAU); g.fillStyle = C; g.fill();
        }
      }
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(240,220,245,0.35)'; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over';
    });
  },
  sparks: null,
  drawBackground(ctx, G, camX, camY, S) {
    const W = G.viewW;
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H); sky.addColorStop(0, '#c4d4f0'); sky.addColorStop(1, '#f4d6e8');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, VIEW_H);
    parallaxImage(ctx, ASSETS.bg2, camX, 0.12, -14 - camY * 0.12, VIEW_H * 1.1, W);
    const haze = ctx.createLinearGradient(0, VIEW_H * 0.45, 0, VIEW_H); haze.addColorStop(0, 'rgba(250,225,240,0)'); haze.addColorStop(1, 'rgba(250,225,240,0.35)');
    ctx.fillStyle = haze; ctx.fillRect(0, 0, W, VIEW_H);
    if (!this.sparks) { this.sparks = []; for (let i = 0; i < 46; i++) this.sparks.push({ x: Math.random() * 2000, y: Math.random() * VIEW_H, s: rnd(1.5, 3.5), p: rnd(0.2, 0.6), ph: Math.random() * 6 }); }
    const t = G.time;
    for (const s of this.sparks) {
      const x = ((s.x - camX * s.p) % 2000 + 2000) % 2000 - 100, y = (s.y + Math.sin(t * 0.7 + s.ph) * 14 - camY * s.p * 0.3 + VIEW_H) % VIEW_H;
      if (x > W + 10) continue;
      ctx.globalAlpha = 0.5 + Math.sin(t * 3 + s.ph) * 0.4; sparkle(ctx, x, y, s.s, '#fffbe8');
    }
    ctx.globalAlpha = 1;
  },
  drawLiquid(ctx, G, camX, camY) {
    const L = G.level, bot = L.H * T, t = G.time;
    const gr = ctx.createLinearGradient(0, bot - 170, 0, bot); gr.addColorStop(0, 'rgba(60,30,80,0)'); gr.addColorStop(0.6, 'rgba(50,24,70,0.8)'); gr.addColorStop(1, '#1e1030');
    ctx.fillStyle = gr; ctx.fillRect(camX - 10, bot - 170, G.viewW + 20, 180);
    for (let i = 0; i < 6; i++) {
      const ex = Math.floor(camX / 600) * 600 + i * 233 % 1300, ey = bot - 40 - (i % 3) * 18;
      if ((t + i * 1.3) % 5 < 0.2) continue;
      ctx.fillStyle = 'rgba(255,230,120,0.7)'; ctx.beginPath(); ctx.ellipse(ex, ey, 3, 2, 0, 0, TAU); ctx.ellipse(ex + 10, ey, 3, 2, 0, 0, TAU); ctx.fill();
    }
  },
  particleColors: ['#f7a9c9', '#d2b8f0', '#a9d8f5']
};
THEME1.drawChunk = function (g, G, x0, y0, CS) { drawTerrainChunk(g, G, x0, y0, CS, this); };
THEME2.drawChunk = function (g, G, x0, y0, CS) { drawTerrainChunk(g, G, x0, y0, CS, this); };
const THEMES = { 1: THEME1, 2: THEME2 };
