'use strict';
// ================= theme2.js : themes for levels 3-5 and bonus =================
function baseTheme(o) {
  return Object.assign({
    rim: 'rgba(90,50,30,0.25)', topEdge: 'rgba(200,160,130,0.9)', iceTop: '#d6f3ff', iceEdge: '#7cc4e8', drips: true,
    iceShine: THEME1.iceShine, crown() { }, cloud() { }, thorns() { },
    drawChunk(g, G, x0, y0, CS) { drawTerrainChunk(g, G, x0, y0, CS, this); },
    deco(g, d, G) { (this.decoX && this.decoX(g, d, G)) || THEME1.deco(g, d, G); },
    drawLiquid() { }, liquidCol: ['#5a2e14', '#8a4e28'], fallColors: ['#ffffff', '#f0d0b0']
  }, o);
}
// dynamic tiles: liquids & conveyors (drawn each frame over entities)
function drawDynamicTiles(ctx, G, cx, cy, front) {
  const L = G.level, th = G.theme, t = G.time;
  const c0 = Math.max(0, Math.floor(cx / T) - 1), c1 = Math.min(L.W - 1, Math.floor((cx + G.viewW) / T) + 1);
  const r0 = Math.max(0, Math.floor(cy / T) - 1), r1 = Math.min(L.H - 1, Math.floor((cy + VIEW_H) / T) + 1);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    const tt = L.get(c, r);
    if (isLiquidT(tt)) {
      const col = tt === TL.BROTH ? ['rgba(222,150,40,0.93)', '#ffd06a', 'rgba(222,150,40,0.55)'] : ['rgba(84,42,18,0.92)', '#a0623a', 'rgba(96,50,22,0.55)'];
      const x = c * T, y = r * T;
      const top = !isLiquidT(L.get(c, r - 1));
      if (front) {
        if (!top) continue;
        ctx.fillStyle = col[2]; ctx.beginPath(); ctx.moveTo(x - 0.5, y + 16);
        for (let k = 0; k <= 4; k++) { const px = x + k * T / 4; ctx.lineTo(px, y + 5 + Math.sin(px * 0.05 + t * 3) * 3); }
        ctx.lineTo(x + T + 0.5, y + 16); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = col[1]; ctx.lineWidth = 2.5; ctx.beginPath();
        for (let k = 0; k <= 4; k++) { const px = x + k * T / 4, py = y + 5 + Math.sin(px * 0.05 + t * 3) * 3; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
        ctx.stroke();
        if (tt === TL.BROTH && hash2(c, Math.floor(t * 2)) < 0.15) { ctx.fillStyle = 'rgba(255,240,200,0.8)'; ctx.beginPath(); ctx.arc(x + 20, y + 8 - (t * 30) % 10, 3, 0, TAU); ctx.fill(); }
        continue;
      }
      ctx.fillStyle = col[0];
      if (top) {
        ctx.beginPath(); ctx.moveTo(x - 0.5, y + T + 0.5);
        for (let k = 0; k <= 4; k++) { const px = x + k * T / 4; ctx.lineTo(px, y + 5 + Math.sin(px * 0.05 + t * 3) * 3); }
        ctx.lineTo(x + T + 0.5, y + T + 0.5); ctx.closePath(); ctx.fill();
      } else ctx.fillRect(x - 0.5, y - 0.5, T + 1, T + 1);
    } else if (!front && (tt === TL.CONVL || tt === TL.CONVR)) {
      const x = c * T, y = r * T, d = tt === TL.CONVR ? 1 : -1;
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, T, 12); ctx.clip();
      ctx.fillStyle = '#3a3a42'; ctx.fillRect(x, y, T, 12);
      const off = ((t * 100 * d) % 20 + 20) % 20;
      ctx.strokeStyle = '#ffcf4a'; ctx.lineWidth = 2.5;
      for (let k = -1; k < 3; k++) { const px = x + k * 20 + off; ctx.beginPath(); ctx.moveTo(px - 4 * d, y + 2); ctx.lineTo(px + 3 * d, y + 6); ctx.lineTo(px - 4 * d, y + 10); ctx.stroke(); }
      ctx.restore();
    }
  }
}

// ---------- Level 3: Caramel Skies ----------
const THEME3 = baseTheme({
  id: 3, topEdge: '#e8b8c8', fallColors: ['#fff8ec', '#ffe0b0', '#ffffff'],
  bodyColor(c, r, d) { return d <= 1 ? '#efcb92' : '#e2b678'; },
  bodyDetail(g, c, r, d, x, y) {
    if (d >= 1 && r % 2 === 0) { g.fillStyle = '#fbd6e0'; g.fillRect(x, y + 14, T + 0.5, 6); g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(x, y + 14, T + 0.5, 2); }
    for (let i = 0; i < 4; i++) { const h = hash2(c * 5 + i, r * 3); g.fillStyle = h < 0.5 ? 'rgba(160,100,40,0.35)' : 'rgba(255,240,200,0.5)'; g.fillRect(x + 4 + hash2(c + i, r) * 30, y + 4 + hash2(c, r + i) * 30, 2.5, 2.5); }
  },
  top() { return '#fff3f5'; },
  surfaceBits(g, c, r, at) {
    for (let i = 0; i < 5; i++) { const p = at((i + 0.5) / 5); g.save(); g.translate(p.x, p.y + 2 + hash2(c, r * 9 + i) * 5); g.rotate(hash2(c + i, r) * 6); g.fillStyle = ['#ff8ab0', '#ffb0c8', '#e86a98'][i % 3]; rrect(g, -3, -1, 6, 2.2, 1); g.fill(); g.restore(); }
  },
  plank(g, x, y, w, a) {
    for (let k = 0; k < 3; k++) {
      g.beginPath(); g.moveTo(x - 4, y + 3 + k * 2); g.quadraticCurveTo(x + w / 2, y + 12 + k * 4, x + w + 4, y + 3 + k * 2);
      g.strokeStyle = k === 1 ? '#ffd27a' : '#e8a030'; g.lineWidth = k === 1 ? 3 : 2.2; g.stroke();
    }
    for (const ex of [x, x + w]) { circ(g, ex, y + 4, 4); fs(g, '#e8a030', '#a8621a', 1.2); }
    for (let i = 1; i < w / 30; i++) { const px = x + i * 30; g.beginPath(); g.moveTo(px, y + 9); g.quadraticCurveTo(px + 2, y + 18, px, y + 24); g.strokeStyle = 'rgba(232,160,48,0.8)'; g.lineWidth = 1.5; g.stroke(); }
  },
  drawBackground(ctx, G, camX, camY, S) {
    const W = G.viewW;
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H); sky.addColorStop(0, '#c98a3a'); sky.addColorStop(1, '#f2c87a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, VIEW_H);
    parallaxImage(ctx, ASSETS.bg3, camX, 0.08, -20 - camY * 0.06, VIEW_H * 1.12, W);
    ctx.fillStyle = 'rgba(255,230,180,0.18)'; ctx.fillRect(0, 0, W, VIEW_H);
  },
  drawLiquid(ctx, G, camX, camY) {
    const L = G.level, bot = L.H * T, t = G.time;
    for (let layer = 0; layer < 2; layer++) {
      const y0 = bot - 70 + layer * 30, sp = layer ? 26 : 14;
      ctx.fillStyle = layer ? '#fff6e8' : '#f6e2c4';
      ctx.beginPath(); ctx.moveTo(camX - 40, bot + 20);
      for (let x = Math.floor(camX / 60) * 60 - 60; x <= camX + G.viewW + 60; x += 30) { const k = x + t * sp; ctx.lineTo(x, y0 - Math.abs(Math.sin(k * 0.025)) * 30 - Math.abs(Math.sin(k * 0.061)) * 12); }
      ctx.lineTo(camX + G.viewW + 40, bot + 20); ctx.closePath(); ctx.fill();
    }
  },
  decoX(g, d) {
    if (d.k === 'bowl') {
      g.save(); g.translate(d.x, d.y); g.globalAlpha = 0.5;
      ell(g, 0, 0, 130, 40); fs(g, '#fff6e8'); ell(g, 0, -10, 110, 30); fs(g, '#ffe8b0');
      for (let i = 0; i < 3; i++) { circ(g, -50 + i * 50, -40, 30); fs(g, ['#ffc8d8', '#fff8ec', '#c8f0dc'][i]); }
      g.restore(); return true;
    }
    return false;
  }
});

// ---------- Level 4: Chocolate River ----------
const THEME4 = baseTheme({
  id: 4, topEdge: '#c8a070', fallColors: ['#6a3a1e', '#8a4e28', '#ffffff'],
  bodyColor(c, r, d) { return d <= 0 ? '#f0cf98' : (r % 3 === 1 ? '#fff0d8' : '#e8bf80'); },
  bodyDetail(g, c, r, d, x, y) {
    if (d >= 1 && hash2(c, r) < 0.3) { const cx = x + 8 + hash2(c + 3, r) * 24, cy = y + 8 + hash2(c, r + 5) * 24; g.fillStyle = '#5a2c12'; g.beginPath(); g.ellipse(cx, cy, 4, 3, hash2(c, r) * 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(160,100,40,0.3)'; g.fillRect(x + 5 + hash2(c * 3 + i, r) * 28, y + 5 + hash2(c, r * 3 + i) * 28, 2, 2); }
  },
  special(g, L, c, r, t) {
    const x = c * T, y = r * T;
    if (t === TL.FUDGE) {
      g.fillStyle = '#4a2410'; g.fillRect(x - 0.5, y - 0.5, T + 1, T + 1);
      for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(140,80,40,0.6)'; g.beginPath(); g.arc(x + 8 + hash2(c * 3 + i, r) * 24, y + 10 + hash2(c, r * 3 + i) * 24, 2 + hash2(c, i) * 3, 0, TAU); g.fill(); }
      return true;
    }
    if (t === TL.CRACK) {
      g.fillStyle = '#d8a058'; g.fillRect(x - 0.5, y - 0.5, T + 1, T + 1);
      g.strokeStyle = '#6a3a14'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 6, y + 4); g.lineTo(x + 18, y + 18); g.lineTo(x + 12, y + 30); g.moveTo(x + 18, y + 18); g.lineTo(x + 34, y + 12); g.moveTo(x + 24, y + 26); g.lineTo(x + 36, y + 36); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.4)'; g.strokeRect(x + 1.5, y + 1.5, T - 3, T - 3);
      return true;
    }
    return false;
  },
  specialTop(g, L, c, r, t) {
    if (t === TL.FUDGE) {
      if (isSolidT(L.get(c, r - 1))) return true;
      const x = c * T, y = r * T;
      g.fillStyle = '#6a3a1e'; g.beginPath(); g.moveTo(x - 0.5, y + 10); for (let k = 0; k <= 4; k++) g.lineTo(x + k * 10, y - 2 + (k % 2) * 3); g.lineTo(x + T + 0.5, y + 10); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x + 6, y + 1, 12, 2);
      return true;
    }
    if (t === TL.CRACK) return isSolidT(L.get(c, r - 1));
    return false;
  },
  top() { return '#fff6e4'; },
  surfaceBits(g, c, r, at) {
    for (let i = 0; i < 4; i++) { const p = at((i + 0.5) / 4); g.fillStyle = i % 2 ? '#c98a4a' : '#8a5a2a'; g.beginPath(); g.arc(p.x, p.y + 3 + hash2(c + i, r) * 4, 1.8 + hash2(c, r + i) * 1.5, 0, TAU); g.fill(); }
  },
  plank(g, x, y, w) {
    for (let k = 0; k < 2; k++) { rrect(g, x + 1, y + k * 7, w - 2, 7, 3.5); fs(g, k ? '#c98a40' : '#e8b060', '#7a4a1a', 1.4); }
    for (let i = 8; i < w; i += 16) { circ(g, x + i, y + 3.5, 1.4); fs(g, '#7a4a1a'); }
  },
  drawBackground(ctx, G, camX, camY, S) {
    const W = G.viewW;
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H); sky.addColorStop(0, '#5a3418'); sky.addColorStop(1, '#c08850');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, VIEW_H);
    parallaxImage(ctx, ASSETS.bg4, camX, 0.1, -16 - camY * 0.1, VIEW_H * 1.12, W);
  },
  drawLiquid(ctx, G, camX, camY) {
    const L = G.level, bot = L.H * T, t = G.time;
    ctx.fillStyle = '#4a2410'; ctx.beginPath(); ctx.moveTo(camX - 10, bot + 10);
    for (let x = Math.floor(camX / 20) * 20 - 20; x <= camX + G.viewW + 20; x += 20) ctx.lineTo(x, bot - 34 + Math.sin(x * 0.03 + t * 2) * 4);
    ctx.lineTo(camX + G.viewW + 20, bot + 10); ctx.closePath(); ctx.fill();
  },
  decoX(g, d) {
    if (d.k === 'jello') {
      g.save(); g.translate(d.x, d.y); const s = d.s || 1; g.scale(s, s); g.globalAlpha = 0.92;
      g.beginPath(); g.moveTo(-30, 0); g.lineTo(-24, -40); for (let i = 0; i <= 4; i++) g.lineTo(-24 + i * 12, -46 - (i % 2) * 6); g.lineTo(30, 0); g.closePath();
      const gr = g.createLinearGradient(0, -50, 0, 0); gr.addColorStop(0, d.c[0]); gr.addColorStop(1, d.c[1]); fs(g, gr, 'rgba(0,0,0,0.2)', 2);
      g.globalAlpha = 0.6; ell(g, -12, -30, 5, 9); fs(g, '#fff'); g.restore(); return true;
    }
    if (d.k === 'oreo') {
      g.save(); g.translate(d.x, d.y); const s = d.s || 1; g.scale(s, s);
      ell(g, 0, -24, 26, 26); fs(g, '#2a1a14', '#0a0604', 2); ell(g, 0, -24, 18, 18); fs(g, '#3a2a20');
      for (let i = 0; i < 8; i++) { const a = i * TAU / 8; circ(g, Math.cos(a) * 12, -24 + Math.sin(a) * 12, 2); fs(g, '#1a0e0a'); }
      g.restore(); return true;
    }
    if (d.k === 'lever') {
      g.save(); g.translate(d.x, d.y); rrect(g, -10, -14, 20, 14, 4); fs(g, '#8a8e96', '#3a3e46', 2);
      g.rotate(d.on ? 0.7 : -0.7); line(g, 0, -10, 0, -38, '#5a3a2a', 4); circ(g, 0, -40, 6); fs(g, '#e2363c'); g.restore(); return true;
    }
    return false;
  }
});

// ---------- Level 5: Kitchen citadel ----------
const THEME5 = baseTheme({
  id: 5, rim: 'rgba(0,0,0,0.35)', topEdge: '#3a3e46', drips: false, fallColors: ['#f2b33d', '#e08a2a', '#ffffff'],
  bodyColor(c, r, d) { return d <= 0 ? '#5a4040' : '#4a3434'; },
  bodyDetail(g, c, r, d, x, y) {
    g.strokeStyle = 'rgba(20,10,10,0.55)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x, y + 13); g.lineTo(x + T, y + 13); g.moveTo(x, y + 27); g.lineTo(x + T, y + 27);
    const o = (r % 2) * 20; g.moveTo(x + 10 + o % 40, y); g.lineTo(x + 10 + o % 40, y + 13); g.moveTo(x + 30 - o % 20, y + 13); g.lineTo(x + 30 - o % 20, y + 27); g.moveTo(x + 10 + o % 40, y + 27); g.lineTo(x + 10 + o % 40, y + 40);
    g.stroke();
  },
  special(g, L, c, r, t) {
    const x = c * T, y = r * T;
    if (t === TL.GRATER) {
      const gr = g.createLinearGradient(x, 0, x + T, 0); gr.addColorStop(0, '#8a8e96'); gr.addColorStop(0.5, '#c8ccd4'); gr.addColorStop(1, '#7a7e86');
      g.fillStyle = gr; g.fillRect(x - 0.5, y - 0.5, T + 1, T + 1);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { g.fillStyle = '#2a2e36'; g.beginPath(); g.ellipse(x + 8 + i * 12, y + 8 + j * 12, 3.5, 2.2, 0, 0, TAU); g.fill(); g.fillStyle = '#e8ecf4'; g.fillRect(x + 5 + i * 12, y + 5 + j * 12, 6, 1.2); }
      return true;
    }
    if (t === TL.CONVL || t === TL.CONVR) {
      g.fillStyle = '#2a2e36'; g.fillRect(x - 0.5, y - 0.5, T + 1, T + 1);
      for (let i = 0; i < 2; i++) { circ(g, x + 10 + i * 20, y + 24, 8); fs(g, '#5a5e66', '#1a1e26', 2); circ(g, x + 10 + i * 20, y + 24, 2); fs(g, '#1a1e26'); }
      return true;
    }
    if (t === TL.CRACK) {
      g.fillStyle = '#6a4a40'; g.fillRect(x - 0.5, y - 0.5, T + 1, T + 1);
      g.strokeStyle = '#1a0a08'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x + 4, y + 6); g.lineTo(x + 20, y + 20); g.lineTo(x + 14, y + 36); g.moveTo(x + 20, y + 20); g.lineTo(x + 36, y + 10); g.stroke();
      return true;
    }
    return false;
  },
  specialTop(g, L, c, r, t) {
    if (t === TL.CONVL || t === TL.CONVR) return true;
    if (t === TL.GRATER) return true;
    return false;
  },
  top() { return '#8a8e96'; },
  surfaceBits(g, c, r, at) {
    const p0 = at(0), p1 = at(1);
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(p0.x, p0.y - 3, p1.x - p0.x, 2);
    for (let i = 0; i < 2; i++) { const p = at(0.25 + i * 0.5); circ(g, p.x, p.y + 5, 1.8); fs(g, '#3a3e46'); }
  },
  plank(g, x, y, w) {
    rrect(g, x, y, w, 8, 2); fs(g, '#3a3e46', '#1a1e26', 1.5);
    for (let i = 6; i < w; i += 10) line(g, x + i, y + 1, x + i, y + 7, '#6a6e76', 2);
  },
  drawBackground(ctx, G, camX, camY, S) {
    const W = G.viewW;
    ctx.fillStyle = '#1e1a18'; ctx.fillRect(0, 0, W, VIEW_H);
    parallaxImage(ctx, ASSETS.bg5, camX, 0.12, -40 - camY * 0.12, VIEW_H * 1.2, W);
    const gl = ctx.createLinearGradient(0, VIEW_H * 0.5, 0, VIEW_H); gl.addColorStop(0, 'rgba(255,120,40,0)'); gl.addColorStop(1, 'rgba(255,120,40,0.18)');
    ctx.fillStyle = gl; ctx.fillRect(0, 0, W, VIEW_H);
    if (G.def && G.def.finalGlow && G.player) {
      const k = clamp((G.player.cx - G.def.finalGlow) / 1600, 0, 1);
      if (k > 0) { ctx.fillStyle = `rgba(255,210,120,${0.22 * k})`; ctx.fillRect(0, 0, W, VIEW_H); }
    }
  },
  drawLiquid(ctx, G, camX, camY) {
    const L = G.level, bot = L.H * T;
    const gr = ctx.createLinearGradient(0, bot - 120, 0, bot); gr.addColorStop(0, 'rgba(20,10,8,0)'); gr.addColorStop(1, '#140a08');
    ctx.fillStyle = gr; ctx.fillRect(camX - 10, bot - 120, G.viewW + 20, 130);
  },
  decoX(g, d) {
    if (d.k === 'pot') {
      g.save(); g.translate(d.x, d.y); const s = d.s || 1; g.scale(s, s);
      rrect(g, -34, -56, 68, 56, 8); fs(g, '#5a5e66', '#2a2e36', 2); rrect(g, -40, -62, 80, 10, 4); fs(g, '#7a7e86', '#2a2e36', 2);
      for (const sx of [-44, 44]) { rrect(g, sx - 6, -48, 12, 6, 3); fs(g, '#3a3e46'); }
      g.globalAlpha = 0.5; for (let i = 0; i < 3; i++) { circ(g, -14 + i * 14, -74 - ((G_T() * 30 + i * 12) % 30), 9); fs(g, '#c8c0b8'); }
      g.restore(); return true;
    }
    if (d.k === 'crackglow') {
      g.save(); g.translate(d.x, d.y);
      const gl = g.createRadialGradient(0, 0, 4, 0, 0, 90); gl.addColorStop(0, 'rgba(255,230,150,0.95)'); gl.addColorStop(1, 'rgba(255,180,60,0)');
      g.fillStyle = gl; circ(g, 0, 0, 90); g.fill();
      g.strokeStyle = '#1a0a08'; g.lineWidth = 3;
      for (let i = 0; i < 7; i++) { const a = i * TAU / 7; g.beginPath(); g.moveTo(Math.cos(a) * 20, Math.sin(a) * 20); g.lineTo(Math.cos(a + 0.2) * 70, Math.sin(a + 0.2) * 70); g.stroke(); }
      g.save(); g.scale(0.22, 0.22); Scenes.house(g, 0, 120, 0); g.restore();
      g.restore(); return true;
    }
    if (d.k === 'lever') return THEME4.decoX(g, d);
    return false;
  }
});
function G_T() { return window.__G ? window.__G.time : 0; }

// ---------- Bonus: Rainbow topping ----------
const RAINBOW = ['#ff5a7a', '#ffa03a', '#ffe14d', '#6ae07a', '#4ab0ff', '#a07aff'];
const THEME6 = baseTheme({
  id: 6, topEdge: '#e8a0c0', fallColors: RAINBOW,
  bodyColor() { return '#f7c0dc'; },
  bodyDetail(g, c, r, d, x, y) {
    for (let i = 0; i < 14; i++) { g.save(); g.translate(x + 3 + hash2(c * 7 + i, r) * 34, y + 3 + hash2(c, r * 7 + i) * 34); g.rotate(hash2(c + i, r + i) * 6); g.fillStyle = RAINBOW[Math.floor(hash2(i, c * r + 3) * 6)]; g.fillRect(-3, -1, 6, 2.2); g.restore(); }
  },
  special(g, L, c, r, t) {
    if (!isSlopeT(t)) return false;
    const x = c * T, y = r * T, rise = slopeRises(t);
    g.beginPath(); if (rise) { g.moveTo(x - 0.5, y + T + 0.5); g.lineTo(x + T + 0.5, y - 0.5); g.lineTo(x + T + 0.5, y + T + 0.5); } else { g.moveTo(x - 0.5, y - 0.5); g.lineTo(x + T + 0.5, y + T + 0.5); g.lineTo(x - 0.5, y + T + 0.5); } g.closePath();
    g.fillStyle = '#f7c0dc'; g.fill();
    return true;
  },
  specialTop(g, L, c, r, t) {
    if (!isSlopeT(t)) return false;
    const x = c * T, y = r * T, rise = slopeRises(t);
    const ya = rise ? y + T : y, yb = rise ? y : y + T;
    for (let i = 0; i < 6; i++) {
      g.beginPath(); g.moveTo(x - 0.5, ya - 2 + i * 4.5); g.lineTo(x + T + 0.5, yb - 2 + i * 4.5); g.lineTo(x + T + 0.5, yb + 2.6 + i * 4.5); g.lineTo(x - 0.5, ya + 2.6 + i * 4.5); g.closePath();
      g.fillStyle = RAINBOW[i]; g.fill();
    }
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, ya - 2); g.lineTo(x + T, yb - 2); g.stroke();
    return true;
  },
  top() { return '#ffffff'; },
  surfaceBits(g, c, r, at) { for (let i = 0; i < 4; i++) { const p = at((i + 0.5) / 4); g.save(); g.translate(p.x, p.y + 3); g.rotate(i * 1.3 + c); g.fillStyle = RAINBOW[(c + i) % 6]; g.fillRect(-3, -1, 6, 2); g.restore(); } },
  plank(g, x, y, w) { for (let i = 0; i < 6; i++) { g.fillStyle = RAINBOW[i]; g.fillRect(x, y + i * 2.4, w, 2.6); } g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1.5; g.strokeRect(x, y, w, 14.4); },
  drawBackground(ctx, G, camX, camY, S) {
    const W = G.viewW, t = G.time;
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H); sky.addColorStop(0, '#3a2a7a'); sky.addColorStop(0.55, '#a86ac8'); sky.addColorStop(1, '#ffb0d0');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, VIEW_H);
    for (let i = 0; i < 40; i++) { const x = ((i * 137 - camX * 0.05) % W + W) % W, y = (i * 53) % 220; ctx.globalAlpha = 0.5 + Math.sin(t * 3 + i) * 0.4; sparkle(ctx, x, y, 1.5 + (i % 3), '#fff'); }
    ctx.globalAlpha = 1;
    for (let k = 0; k < 2; k++) {
      const cx = ((600 + k * 900 - camX * 0.08) % 1800 + 1800) % 1800 - 300;
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(cx, 420, 260 - i * 14, Math.PI, 0); ctx.strokeStyle = RAINBOW[i]; ctx.globalAlpha = 0.45; ctx.lineWidth = 14; ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
    for (let k = -1; k < 6; k++) {
      const x = k * 300 - ((camX * 0.25) % 300), h = 150 + (Math.abs(k) * 53) % 90;
      ctx.beginPath(); ctx.moveTo(x - 160, VIEW_H); ctx.lineTo(x, VIEW_H - h - 120 + camY * 0); ctx.lineTo(x + 160, VIEW_H); ctx.closePath();
      ctx.fillStyle = ['#e890c0', '#c890e0', '#f0a0b8'][(k + 3) % 3]; ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - 40, VIEW_H - h - 120 + 30); ctx.lineTo(x, VIEW_H - h - 120); ctx.lineTo(x + 40, VIEW_H - h - 120 + 30); ctx.quadraticCurveTo(x, VIEW_H - h - 70, x - 40, VIEW_H - h - 90); ctx.fillStyle = '#fff'; ctx.fill();
    }
  },
  drawLiquid(ctx, G, camX, camY) {
    const L = G.level, bot = L.H * T, t = G.time;
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = RAINBOW[i]; ctx.beginPath(); ctx.moveTo(camX - 20, bot + 10);
      for (let x = Math.floor(camX / 30) * 30 - 30; x <= camX + G.viewW + 30; x += 30) ctx.lineTo(x, bot - 60 + i * 9 + Math.sin(x * 0.02 + t * 2 + i * 0.4) * 8);
      ctx.lineTo(camX + G.viewW + 20, bot + 10); ctx.closePath(); ctx.fill();
    }
  },
  decoX(g, d) {
    if (d.k === 'lolly') return (THEME2.deco(g, d), true);
    if (d.k === 'cane') { g.save(); g.translate(d.x, d.y); g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -60); g.arc(14, -60, 14, Math.PI, 0); g.strokeStyle = '#fff'; g.lineWidth = 10; g.stroke(); g.setLineDash([7, 7]); g.strokeStyle = '#e2363c'; g.stroke(); g.setLineDash([]); g.restore(); return true; }
    return false;
  }
});
THEMES[3] = THEME3; THEMES[4] = THEME4; THEMES[5] = THEME5; THEMES[6] = THEME6;
