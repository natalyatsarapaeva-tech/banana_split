'use strict';
// ================= world.js : tiles, level, physics, camera, terrain cache =================
const TL = { EMPTY: 0, SOLID: 1, SR: 2, SL: 3, ICE: 4, ONEWAY: 5, CROWN: 6, CLOUD: 7, THORN: 8, FAKE: 9, SRI: 10, SLI: 11,
  CHOC: 12, BROTH: 13, CRACK: 14, FUDGE: 16, CONVL: 17, CONVR: 18, GRATER: 19 };
const SOLID_T = new Uint8Array(32); [1, 4, 14, 16, 17, 18, 19].forEach(t => SOLID_T[t] = 1);
const isSolidT = t => SOLID_T[t] === 1;
const isLiquidT = t => t === 12 || t === 13;
const isSlopeT = t => t === 2 || t === 3 || t === 10 || t === 11;
const isOneWayT = t => t === 5 || t === 6 || t === 7;
const isIceT = t => t === 4 || t === 10 || t === 11;
const isGroundish = t => isSolidT(t) || isSlopeT(t);
function slopeRises(t) { return t === 2 || t === 10; } // '/' rises to the right
function slopeSurf(t, col, row, px) {
  const lx = clamp(px - col * T, 0, T);
  return slopeRises(t) ? (row + 1) * T - lx : row * T + lx;
}

class Level {
  constructor(W, H) {
    this.W = W; this.H = H; this.grid = new Uint8Array(W * H);
  }
  get(c, r) {
    if (c < 0 || c >= this.W) return r < 0 ? TL.EMPTY : TL.SOLID;
    if (r < 0 || r >= this.H) return TL.EMPTY;
    return this.grid[r * this.W + c];
  }
  set(c, r, t) { if (c >= 0 && c < this.W && r >= 0 && r < this.H) this.grid[r * this.W + c] = t; }
  tileAt(px, py) { return this.get(Math.floor(px / T), Math.floor(py / T)); }
}

// --------- physics ---------
// body: x,y,w,h,vx,vy ; flags set: onGround, wasOnGround, hitL, hitR, hitCeil, onSlope, groundT, standOn
function moveBody(b, G, dt) {
  const L = G.level;
  b.wasOnGround = b.onGround;
  if (b.standOn && b.standOn.alive !== false && b.standOn.dx !== undefined) { b.x += b.standOn.dx; b.y += b.standOn.dy; }
  b.onGround = false; b.hitL = b.hitR = false; b.hitCeil = false; b.standOn = null; b.onSlope = 0; b.groundT = 0;
  b.ceilCol = -1; b.ceilRow = -1; b.ceilEnt = null;
  const STEP = Math.max(16, b.w / 2 + 4);
  // ---- horizontal
  const dx = b.vx * dt;
  const hs = Math.max(1, Math.ceil(Math.abs(dx) / 14));
  for (let i = 0; i < hs; i++) {
    b.x += dx / hs;
    if (resolveX(b, G, dx, STEP)) break;
  }
  // ---- vertical
  const dy = b.vy * dt;
  const vs = Math.max(1, Math.ceil(Math.abs(dy) / 14));
  for (let i = 0; i < vs; i++) {
    const prevBottom = b.y + b.h;
    b.y += dy / vs;
    if (resolveY(b, G, dy, prevBottom, i === vs - 1)) break;
  }
  if (!b.onGround && b.wasOnGround && b.vy >= 0 && !b.noSnap) snapDown(b, G);
}
function resolveX(b, G, dx, STEP) {
  const L = G.level;
  const top = b.y + 1;
  const bottom = b.y + b.h - (b.wasOnGround ? STEP : 2);
  if (bottom > top) {
    const r0 = Math.floor(top / T), r1 = Math.floor((bottom - 0.01) / T);
    if (dx > 0) {
      const c = Math.floor((b.x + b.w - 0.01) / T);
      for (let r = r0; r <= r1; r++) {
        if (isSolidT(L.get(c, r))) { b.x = c * T - b.w; b.vx = Math.min(0, b.vx); b.hitR = true; return true; }
      }
    } else if (dx < 0) {
      const c = Math.floor(b.x / T);
      for (let r = r0; r <= r1; r++) {
        if (isSolidT(L.get(c, r))) { b.x = (c + 1) * T; b.vx = Math.max(0, b.vx); b.hitL = true; return true; }
      }
    }
  }
  if (b.noEnts) return false;
  for (const e of G.solids) {
    if (e.solid !== 'full' || e === b) continue;
    if (b.x < e.x + e.w && b.x + b.w > e.x && b.y + 1 < e.y + e.h && b.y + b.h - (b.wasOnGround ? Math.min(STEP, 10) : 2) > e.y) {
      if (dx > 0 && b.x + b.w - dx * 1.5 <= e.x + 4) { b.x = e.x - b.w; b.vx = Math.min(0, b.vx); b.hitR = true; return true; }
      if (dx < 0 && b.x - dx * 1.5 >= e.x + e.w - 4) { b.x = e.x + e.w; b.vx = Math.max(0, b.vx); b.hitL = true; return true; }
    }
  }
  return false;
}
function slopeUnder(b, L, allowBelow) {
  const cx = b.x + b.w / 2, col = Math.floor(cx / T), fb = b.y + b.h;
  const rf = Math.floor(fb / T);
  const tf = L.get(col, rf);
  if (isSlopeT(tf)) return { t: tf, s: slopeSurf(tf, col, rf, cx) };
  if (isSolidT(tf)) {
    const ta = L.get(col, rf - 1);
    if (isSlopeT(ta)) return { t: ta, s: slopeSurf(ta, col, rf - 1, cx) };
    return null;
  }
  if (allowBelow && tf === TL.EMPTY) {
    const tb = L.get(col, rf + 1);
    if (isSlopeT(tb)) return { t: tb, s: slopeSurf(tb, col, rf + 1, cx) };
  }
  // feet exactly on boundary above a slope tile
  return null;
}
function resolveY(b, G, dy, prevBottom, last) {
  const L = G.level;
  if (dy < 0) {
    const r = Math.floor(b.y / T);
    const c0 = Math.floor((b.x + 3) / T), c1 = Math.floor((b.x + b.w - 3) / T);
    let hit = false, bestC = -1, bestD = 1e9;
    for (let c = c0; c <= c1; c++) {
      if (isSolidT(L.get(c, r))) {
        hit = true; const d = Math.abs((c + 0.5) * T - (b.x + b.w / 2)); if (d < bestD) { bestD = d; bestC = c; }
      }
    }
    if (hit) { b.y = (r + 1) * T; b.vy = 0; b.hitCeil = true; b.ceilCol = bestC; b.ceilRow = r; return true; }
    if (!b.noEnts) {
      for (const e of G.solids) {
        if (e === b || (e.solid !== 'full' && e.solid !== 'hidden')) continue;
        if (b.x + 3 < e.x + e.w && b.x + b.w - 3 > e.x && b.y < e.y + e.h && b.y - dy * 1.5 >= e.y + e.h - 6) {
          b.y = e.y + e.h; b.vy = 0; b.hitCeil = true; b.ceilEnt = e; return true;
        }
      }
    }
    return false;
  }
  // moving down (or zero)
  const fb = b.y + b.h;
  const sl = slopeUnder(b, L, false);
  if (sl) {
    if (fb >= sl.s - 0.01) { b.y = sl.s - b.h; b.vy = 0; b.onGround = true; b.onSlope = sl.t; b.groundT = sl.t; return true; }
  } else {
    const r = Math.floor(fb / T);
    const c0 = Math.floor((b.x + 1) / T), c1 = Math.floor((b.x + b.w - 1) / T);
    for (let c = c0; c <= c1; c++) {
      const t = L.get(c, r);
      if (isSolidT(t)) {
        // ignore the corner of a solid tile that sits beside a slope column under our center
        const top = r * T;
        if (fb > top) { b.y = top - b.h; b.vy = 0; b.onGround = true; b.groundT = t; return true; }
      } else if (isOneWayT(t) && !b.dropping && !b.noOneWay) {
        const top = r * T;
        if (prevBottom <= top + 1 && fb >= top) { b.y = top - b.h; b.vy = 0; b.onGround = true; b.groundT = t; return true; }
      }
    }
  }
  if (!b.noEnts) {
    for (const e of G.solids) {
      if (e === b || e.solid === 'hidden' || !e.solid) continue;
      if (b.x + 1 < e.x + e.w && b.x + b.w - 1 > e.x) {
        const top = e.y;
        const tol = 2 + Math.max(0, e.dy || 0);
        if (prevBottom <= top + tol && fb >= top) { b.y = top - b.h; b.vy = 0; b.onGround = true; b.standOn = e; b.groundT = e.groundT || TL.SOLID; return true; }
      }
    }
  }
  return false;
}
function snapDown(b, G) {
  // keep bodies glued to slopes when walking down them
  const L = G.level;
  const sl = slopeUnder(b, L, true);
  const fb = b.y + b.h;
  if (sl && sl.s >= fb - 0.01 && sl.s - fb <= T * 0.6) {
    b.y = sl.s - b.h; b.onGround = true; b.onSlope = sl.t; b.groundT = sl.t; b.vy = 0; return;
  }
}
// does a rect hit solid tiles?
function rectSolid(G, x, y, w, h) {
  const L = G.level;
  const c0 = Math.floor(x / T), c1 = Math.floor((x + w - 0.01) / T), r0 = Math.floor(y / T), r1 = Math.floor((y + h - 0.01) / T);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (isSolidT(L.get(c, r))) return true;
  for (const e of G.solids) if (e.solid === 'full' && x < e.x + e.w && x + w > e.x && y < e.y + e.h && y + h > e.y) return true;
  return false;
}
function groundBelow(G, x, y) { // is there something to stand on at point
  const t = G.level.tileAt(x, y);
  return isSolidT(t) || isSlopeT(t) || isOneWayT(t);
}

// --------- camera ---------
class Camera {
  constructor() { this.x = 0; this.y = 0; this.look = 0; this.minX = 0; this.maxX = 1e9; this.shake = 0; this.sx = 0; this.sy = 0; this.lockY = null; }
  reset(G, p) {
    this.minX = 0; this.maxX = G.level.W * T - G.viewW; this.look = 0;
    this.x = clamp(p.x + p.w / 2 - G.viewW * 0.4, this.minX, this.maxX);
    this.y = clamp(p.y - VIEW_H * 0.55, 0, G.level.H * T - VIEW_H);
  }
  update(G, p, dt) {
    const tl = p.face * 70;
    this.look = approach(this.look, p.state === 'vine' ? 0 : tl, 160 * dt);
    let tx = p.x + p.w / 2 - G.viewW * 0.45 + this.look;
    tx = clamp(tx, this.minX, Math.max(this.minX, this.maxX));
    this.x = lerp(this.x, tx, 1 - Math.pow(0.0005, dt));
    // vertical: follow with deadzone, favouring ground position
    const levelH = G.level.H * T;
    let ty;
    if (this.lockY !== null) ty = this.lockY;
    else {
      const py = p.y + p.h;
      const want = py - VIEW_H * 0.62;
      ty = this.y;
      if (want < this.y - 10) ty = want + 10;
      if (want > this.y + 50) ty = want - 50;
      if (p.onGround || p.state === 'vine') ty = lerp(ty, want, 0.08);
    }
    ty = clamp(ty, 0, Math.max(0, levelH - VIEW_H));
    this.y = lerp(this.y, ty, 1 - Math.pow(0.002, dt));
    if (this.shake > 0) { this.shake = Math.max(0, this.shake - dt); const m = this.shake * 18; this.sx = rnd(-m, m); this.sy = rnd(-m, m); }
    else { this.sx = this.sy = 0; }
  }
}

// --------- chunked terrain cache ---------
const CH = 8; // tiles per chunk side
class TerrainCache {
  constructor(G) { this.G = G; this.S = 0; this.map = new Map(); this.order = []; }
  setScale(S) { if (Math.abs(S - this.S) > 0.001) { this.S = S; this.map.clear(); this.order = []; } }
  invalidateTile(c, r) {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const k = this.key(Math.floor((c + dc) / CH), Math.floor((r + dr) / CH));
      if (this.map.has(k)) { this.map.delete(k); this.order = this.order.filter(o => o !== k); }
    }
  }
  key(cx, cy) { return cx + ',' + cy; }
  get(cx, cy) {
    const k = this.key(cx, cy);
    let c = this.map.get(k);
    if (!c) { c = this.render(cx, cy); this.map.set(k, c); this.order.push(k); if (this.order.length > 48) { const old = this.order.shift(); this.map.delete(old); } }
    return c;
  }
  render(cx, cy) {
    const G = this.G, S = this.S, CS = CH * T;
    const px = Math.max(1, Math.round(CS * S));
    const cv = document.createElement('canvas'); cv.width = px; cv.height = px;
    const g = cv.getContext('2d');
    g.setTransform(px / CS, 0, 0, px / CS, -cx * CS * px / CS, -cy * CS * px / CS);
    const x0 = cx * CS, y0 = cy * CS;
    G.theme.drawChunk(g, G, x0, y0, CS);
    return cv;
  }
  draw(ctx, camX, camY, viewW, viewH) {
    const S = this.S, CS = CH * T;
    const c0 = Math.floor(camX / CS), c1 = Math.floor((camX + viewW) / CS);
    const r0 = Math.max(0, Math.floor(camY / CS)), r1 = Math.min(Math.ceil(this.G.level.H / CH) - 1, Math.floor((camY + viewH) / CS));
    const maxC = Math.ceil(this.G.level.W / CH) - 1;
    let fresh = 0;
    for (let cy = r0; cy <= r1; cy++) for (let cx = Math.max(0, c0); cx <= Math.min(maxC, c1); cx++) {
      const k = this.key(cx, cy); if (!this.map.has(k)) fresh++;
      const cv = this.get(cx, cy);
      const dx0 = Math.round((cx * CS - camX) * S), dy0 = Math.round((cy * CS - camY) * S);
      const dx1 = Math.round(((cx + 1) * CS - camX) * S), dy1 = Math.round(((cy + 1) * CS - camY) * S);
      ctx.drawImage(cv, dx0, dy0, dx1 - dx0, dy1 - dy0);
    }
    // prefetch one chunk ahead when idle this frame
    if (fresh === 0) {
      for (let cy = r0; cy <= r1; cy++) {
        const ax = c1 + 1; if (ax <= maxC && !this.map.has(this.key(ax, cy))) { this.get(ax, cy); break; }
        const bx = c0 - 1; if (bx >= 0 && !this.map.has(this.key(bx, cy))) { this.get(bx, cy); break; }
      }
    }
  }
}
