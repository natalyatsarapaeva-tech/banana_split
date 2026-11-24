'use strict';
// ================= w2/water.js : sea water, air, currents, crunch, flipper dash =================
// World 2 water is not stored in tiles (unlike World 1 chocolate): a WaterBody is a rectangle whose surface
// can rise and fall (waves, tides). G.liquidAt() reports TL.WATER inside one.
// In water the heroes differ (docs/WORLD2_PLAN.md, 2.1):
//   Banni is light: he swims, floats up to the surface and leaps out; currents carry him.
//   Pickle is heavy: he sinks and walks on the sea floor with slow, floaty jumps; currents don't move him.
// Both need air below the surface; it refills at the surface and from soda bubbles.

const WATER = {
  swim: 230,          // Banni's top swimming speed
  leap: 760,          // jump out of the water at the surface
  airTime: 14,        // seconds of air (22 in easy mode)
  crunch: { time: 0.24, speed: 620, cd: 0.55 },
  dash: { time: 0.3, speed: 560, cd: 0.6 }
};

class WaterBody extends Ent {
  // x0..x1 in px, surface y (resting), bottom y; o: { amp, period, phase } for waves / tides
  constructor(x0, x1, surface, bottom, o) {
    super(x0, surface, x1 - x0, bottom - surface); o = o || {};
    this.water = true; this.base = surface; this.amp = o.amp || 0; this.period = o.period || 6; this.phase = o.phase || 0;
  }
  surfaceY(t) { return this.base + (this.amp ? Math.sin(t * TAU / this.period + this.phase) * this.amp : 0); }
  contains(x, y, t) { return x >= this.x && x <= this.x + this.w && y > this.surfaceY(t) && y < this.y + this.h; }
}
function waterAt(G, x, y) { for (const w of G.waters) if (w.alive && w.contains(x, y, G.time)) return w; return null; }

class CurrentZone extends Ent {
  constructor(x, y, w, h, vx, vy) { super(x, y, w, h); this.zone = 'current'; this.cvx = vx || 0; this.cvy = vy || 0; }
  draw(g, G) {
    const t = G.time, n = Math.max(4, Math.round(this.w * this.h / 7000)), sp = Math.hypot(this.cvx, this.cvy) || 1, ux = this.cvx / sp, uy = this.cvy / sp;
    const mod = (v, m) => ((v % m) + m) % m;
    g.save(); g.beginPath(); g.rect(this.x, this.y, this.w, this.h); g.clip();
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2; g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const off = t * sp * 0.7 + hash2(i, 1) * 400;
      const px = this.x + mod(hash2(i, 3) * this.w + ux * off, this.w), py = this.y + mod(hash2(i, 5) * this.h + uy * off, this.h);
      g.beginPath(); g.moveTo(px, py); g.lineTo(px - ux * 24, py - uy * 24); g.stroke();
    }
    g.restore();
  }
}
function currentAt(G, x, y) { for (const z of G.zones) if (z.alive && z.zone === 'current' && x > z.x && x < z.x + z.w && y > z.y && y < z.y + z.h) return z; return null; }

// soda vent on the sea floor: lets out air bubbles
class SodaVent extends Ent {
  constructor(x, y, every) { super(x - 16, y - 12, 32, 12); this.every = every || 1.1; this.k = rnd(0, 1); }
  update(G, dt) { this.t += dt; this.k -= dt; if (this.k <= 0) { this.k = this.every; G.add(new AirBubble(this.cx + rnd(-6, 6), this.y)); } }
  draw(g) { drawSodaVent(g, this.cx, this.bottom, this.t); }
}
class AirBubble extends Ent {
  constructor(x, y) { super(x - 11, y - 22, 22, 22); this.vy = -75; this.wob = rnd(0, 6); }
  update(G, dt) {
    this.t += dt; this.y += this.vy * dt; this.x += Math.sin(this.t * 3 + this.wob) * 18 * dt;
    if (!waterAt(G, this.cx, this.cy) || this.t > 12) { this.alive = false; return; }
    const p = G.player;
    if ((p.state === 'play') && overlap(this, p)) {
      this.alive = false; p.air = Math.min(1, p.air + 0.45); Audio2.play('bubble');
      G.burst(this.cx, this.cy, 6, ['#ffffff', '#c8f4ff']);
    }
  }
  draw(g) { drawAirBubble(g, this.cx, this.cy, 10, this.t); }
}

// ---------- Player: water ----------
Object.assign(Player.prototype, {
  // returns true when the frame is fully handled (Banni swimming)
  updateWater(G, dt, mx) {
    const w = waterAt(G, this.cx, this.y + this.h * 0.62), surf = w ? w.surfaceY(G.time) : this.y;
    if (!this.wet) {
      this.wet = true; this.pounding = false; this.glide = false;
      if (this.vy > 0) this.vy *= this.char === 'pickle' ? 0.45 : 0.3;
      if (this.sliding) this.stopSlide(G);
      Audio2.play('splash'); G.burst(this.cx, surf, 10, ['#ffffff', '#bff4ff', '#7fd8e8']);
      G.hint('sea-' + this.char, this.char === 'pickle'
        ? `Я тяжёлый — иду по дну, и течение меня не сносит. ${Input.label('jump')} у самой поверхности — выпрыгну на берег.`
        : `Морская вода лёгкая — тут Банни плавает! ↑ ↓ — нырять и всплывать, ${Input.label('jump')} у поверхности — выпрыгнуть.`);
    }
    this.underwater = this.y + 10 > surf;
    this.updateAir(G, dt);
    if (this.state !== 'play') return true;
    if (this.char === 'pickle') {
      this.swimming = false;
      // a strong kick out of the water when the head is at the surface
      if (!this.onGround && this.y < surf + 14 && this.jumpBuf > 0) { this.vy = -WATER.leap * 0.85; this.jumpBuf = 0; this.cutOk = true; Audio2.play('splash'); G.burst(this.cx, surf, 8, ['#ffffff', '#bff4ff']); }
      return false;
    }
    if (this.leapT > 0) { this.leapT -= dt; this.wet = false; return false; }
    this.swimBanni(G, dt, mx, surf);
    return true;
  },
  swimBanni(G, dt, mx, surf) {
    this.swimming = true; this.airJumps = 1; this.onGround = false; this.standOn = null;
    this.vx = approach(this.vx, mx * WATER.swim, 900 * dt); if (mx) this.face = mx;
    const rest = surf - 16; // top of the body when floating with the head out
    let ay;
    if (Input.held('down')) ay = 560;
    else if (Input.held('up') && this.y > rest + 4) ay = -560;
    else ay = this.y < rest ? 900 : -320;
    this.vy = clamp(this.vy + ay * dt, -330, 280);
    if (!Input.held('down') && Math.abs(this.y - rest) < 12) this.vy *= Math.pow(0.03, dt);
    if (this.jumpBuf > 0) {
      this.jumpBuf = 0;
      if (this.y < rest + 16) { this.vy = -WATER.leap; this.cutOk = true; this.leapT = 0.3; this.swimming = false; this.wet = false; Audio2.play('splash'); G.burst(this.cx, surf, 8, ['#ffffff', '#bff4ff']); }
      else { this.vy = Math.min(this.vy, -300); Audio2.play('bubble'); }
    }
    const cur = currentAt(G, this.cx, this.cy), vx0 = this.vx, vy0 = this.vy;
    if (cur) { this.vx += cur.cvx; this.vy += cur.cvy; }
    this.prevBottom = this.bottom;
    moveBody(this, G, dt);
    if (cur) { if (!this.hitL && !this.hitR) this.vx = vx0; this.vy = vy0; }
    this.phase += dt * 9;
    if (this.underwater && Math.random() < 0.05) G.parts.push({ k: 'dust', x: this.cx + this.face * 10, y: this.y + 6, vx: rnd(-10, 10), vy: -60, life: 0.9, max: 0.9, c: 'rgba(255,255,255,0.75)', s: rnd(2, 4), g: 0 });
    if (this.bottom > G.level.H * T - 4) { this.y = G.level.H * T - 4 - this.h; this.vy = Math.min(0, this.vy); }
    if (G.thornAt(this.x + 5, this.y + 8, this.w - 10, this.h - 10)) this.hurt(G, null);
    if (Input.pressed('fire') && this.power === 'flipper') this.tryDash(G);
    else if (Input.pressed('fire') && this.fireCd <= 0) this.shoot(G);
    if (Input.pressed('pickle')) G.pickle.throwIt(G);
  },
  updateAir(G, dt) {
    if (!this.underwater) { this.breathe(G, dt); return; }
    this.air -= dt / (Save.data.settings.easy ? 22 : WATER.airTime);
    if (this.air < 0.35) G.hint('air', 'Воздух кончается! Всплывай к поверхности или лови пузырьки газировки.');
    if (this.air <= 0) this.airOut(G);
  },
  breathe(G, dt) { if (this.air < 1) this.air = Math.min(1, this.air + dt * 0.9); },
  airOut(G) {
    this.air = 1; G.burst(this.cx, this.y, 16, ['#ffffff', '#bff4ff']); Audio2.play('splash');
    this.hp--; if (this.hp <= 0) { this.die(G); this.vy = -950; return; }
    Audio2.play('hurt'); this.respawnAt(this.lastSafe.x, this.lastSafe.y); this.inv = 1.6; G.toast('Буль! Не хватило воздуха: −1 спелость');
  },
  leaveWater(G) {
    if (this.vy < -100 && !this.leapT) G.burst(this.cx, this.bottom, 6, ['#ffffff', '#bff4ff']);
    this.wet = false; this.swimming = false; this.underwater = false;
  },
  // ---------- Pickle's crunch: a short shoulder charge that breaks jars, barrels and fruit rind ----------
  tryCrunch(G) {
    if (!(Save.data.crunch || G.def.crunch)) return;
    if (this.crunchCd > 0 || this.state !== 'play') return;
    this.crunchT = WATER.crunch.time; this.crunchCd = WATER.crunch.cd; this.pounding = false;
    this.vx = this.face * WATER.crunch.speed; Audio2.play('throw'); this.sx = 1.2; this.sy = 0.86;
  },
  updateCrunch(G, dt) {
    this.crunchT -= dt;
    this.vx = this.face * WATER.crunch.speed; this.vy = this.wet ? 0 : Math.min(this.vy + PHYS.grav * dt * 0.25, 120);
    this.prevBottom = this.bottom;
    moveBody(this, G, dt);
    const hb = { x: this.face > 0 ? this.x + this.w - 4 : this.x - 16, y: this.y + 4, w: 20, h: this.h - 10 };
    let hit = false;
    const c0 = Math.floor(hb.x / T), c1 = Math.floor((hb.x + hb.w) / T), r0 = Math.floor(hb.y / T), r1 = Math.floor((hb.y + hb.h) / T);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) { const t = G.level.get(c, r); if (t === TL.RIND || t === TL.CRACK) { G.breakTile(c, r); hit = true; } }
    for (const e of G.ents) {
      if (!e.alive || e === this) continue;
      if (e.crunchable && overlap(hb, e)) { e.onCrunch(G, this); hit = true; continue; }
      if (e.enemy && e.frozen <= 0 && !e.boss && (overlap(hb, e) || overlap(this, e))) { if (e.onCrunch) e.onCrunch(G, this); else e.kill(G, 'crunch'); hit = true; }
      else if (e.enemy && e.boss && e.onCrunch && overlap(hb, e)) { e.onCrunch(G, this); this.crunchT = 0; }
    }
    if (hit) { Audio2.play('crunch'); G.shake(0.12); }
    if (Math.random() < 0.7) G.parts.push({ k: 'dust', x: this.cx - this.face * 12, y: this.y + rnd(8, this.h - 6), vx: -this.face * 60, vy: rnd(-20, 20), life: 0.35, max: 0.35, c: 'rgba(255,255,255,0.8)', s: rnd(2, 4), g: 0 });
    if ((this.hitL || this.hitR) && !hit) { this.crunchT = 0; Audio2.play('bump'); this.vx = -this.face * 120; }
    if (this.crunchT <= 0) this.vx *= 0.35;
    if (this.bottom > G.level.H * T - 14) this.fall(G);
  },
  // ---------- lime flipper: a fast dash under water ----------
  tryDash(G) {
    if (this.dashCd > 0 || this.state !== 'play') return;
    if (!this.wet && !this.swimming) { G.hint('flipper-dry', 'Лаймонный ласт работает только в воде!'); return; }
    const mx = (Input.held('right') ? 1 : 0) - (Input.held('left') ? 1 : 0), my = (Input.held('down') ? 1 : 0) - (Input.held('up') ? 1 : 0);
    let dx = mx, dy = my; if (!dx && !dy) dx = this.face;
    const d = Math.hypot(dx, dy); this.dashV = { x: dx / d * WATER.dash.speed, y: dy / d * WATER.dash.speed };
    this.dashT = WATER.dash.time; this.dashCd = WATER.dash.cd; if (dx) this.face = sign(dx);
    Audio2.play('slide'); G.burst(this.cx, this.cy, 8, ['#c8ff6a', '#ffffff']);
  },
  updateDash(G, dt) {
    this.dashT -= dt; this.vx = this.dashV.x; this.vy = this.dashV.y;
    this.prevBottom = this.bottom; moveBody(this, G, dt);
    for (const e of G.ents) {
      if (!e.alive || !overlap(this, e)) continue;
      if (e.enemy && !e.boss && e.frozen <= 0) { if (e.onDash) e.onDash(G, this); else e.kill(G, 'dash'); }
      else if (e.enemy && e.boss && e.onDash) e.onDash(G, this);
      else if (e.crunchable) e.onCrunch(G, this);
    }
    if (Math.random() < 0.8) G.parts.push({ k: 'dust', x: this.cx, y: this.cy, vx: -this.vx * 0.1, vy: -this.vy * 0.1, life: 0.4, max: 0.4, c: 'rgba(200,255,140,0.8)', s: rnd(2, 4), g: 0 });
    if (this.dashT <= 0) { this.vx *= 0.4; this.vy *= 0.4; }
    if (!waterAt(G, this.cx, this.cy)) this.dashT = Math.min(this.dashT, 0.05);
  },
  // coconut helmet: a head-bump breaks fruit rind above
  headBreak(G) {
    const r = Math.floor((this.y - 4) / T), c0 = Math.floor((this.x + 2) / T), c1 = Math.floor((this.x + this.w - 2) / T);
    let broke = false;
    for (let c = c0; c <= c1; c++) if (G.level.get(c, r) === TL.RIND) { G.breakTile(c, r); broke = true; }
    return broke;
  }
});

// ---------- drawing ----------
function drawWaters(ctx, G, front) {
  const t = G.time, th = G.theme, cx = G.cam.x, x0v = cx - 20, x1v = cx + G.viewW + 20;
  const col = th.waterCol || ['rgba(70,205,215,0.55)', 'rgba(20,110,150,0.85)'];
  for (const w of G.waters) {
    const xa = Math.max(w.x, x0v), xb = Math.min(w.x + w.w, x1v); if (xa >= xb) continue;
    const s = w.surfaceY(t), bot = w.y + w.h;
    const wave = x => s + Math.sin(x * 0.045 + t * 2.4) * 3 + Math.sin(x * 0.017 - t * 1.3) * 2;
    if (!front) {
      const gr = ctx.createLinearGradient(0, s, 0, Math.max(s + 40, bot)); gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(xa, bot);
      for (let x = xa; x <= xb; x += 16) ctx.lineTo(x, wave(x)); ctx.lineTo(xb, wave(xb)); ctx.lineTo(xb, bot); ctx.closePath(); ctx.fill();
      // light rays
      ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = '#ffffff';
      for (let i = Math.floor(xa / 160); i * 160 < xb; i++) { const x = i * 160 + Math.sin(t * 0.6 + i) * 30; ctx.beginPath(); ctx.moveTo(x, s); ctx.lineTo(x + 40, s); ctx.lineTo(x + 110, Math.min(bot, s + 320)); ctx.lineTo(x + 50, Math.min(bot, s + 320)); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      continue;
    }
    // front: tint over what is under water, then the surface line with foam
    ctx.fillStyle = th.waterTint || 'rgba(60,190,210,0.22)'; ctx.beginPath(); ctx.moveTo(xa, bot);
    for (let x = xa; x <= xb; x += 16) ctx.lineTo(x, wave(x) + 4); ctx.lineTo(xb, wave(xb) + 4); ctx.lineTo(xb, bot); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3; ctx.beginPath();
    for (let x = xa; x <= xb; x += 8) { const y = wave(x); x === xa ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let x = Math.ceil(xa / 26) * 26; x < xb; x += 26) if (hash2(Math.floor(x / 26), Math.floor(t * 1.5)) < 0.45) { ctx.beginPath(); ctx.arc(x + 6, wave(x + 6) - 1, 2.2 + hash2(x, 3) * 2, 0, TAU); ctx.fill(); }
  }
}
