'use strict';
// ================= entities2.js : levels 3-5 and bonus =================
// ---------- zones ----------
class Updraft extends Ent {
  constructor(x, y, w, h, force) { super(x, y, w, h); this.force = force || 2700; this.zone = 'up'; }
  update(G, dt) { this.t += dt; }
  draw(g) { drawUpdraftCol(g, this.x, this.y, this.w, this.h, this.t); }
}
class WindZone extends Ent {
  constructor(x, y, w, h, dir, on, off, force) { super(x, y, w, h); this.dir = dir || -1; this.on = on || 2.2; this.off = off || 2.4; this.force = force || 1500; this.zone = 'wind'; this.phase = 0; this.active = false; }
  update(G, dt) {
    this.t += dt; const cyc = (this.t % (this.on + this.off));
    const was = this.active; this.active = cyc < this.on; this.warn = !this.active && cyc > this.on + this.off - 0.7;
    const p = G.player;
    if (this.active && !was && p.cx > this.x - 200 && p.cx < this.x + this.w + 200) { Audio2.play('wind'); G.hint('wind', 'Горький Ветер дует порывами! Пережди за укрытием или прыгай, когда стихнет.'); }
  }
  draw(g) {
    if (!this.active && !this.warn) return;
    g.save(); g.globalAlpha = this.active ? 0.55 : 0.2;
    for (let i = 0; i < 14; i++) {
      const y = this.y + ((i * 53) % this.h), sp = 600, len = 60 + (i % 3) * 30;
      const x = this.x + (((this.dir > 0 ? 1 : -1) * this.t * sp + i * 131) % this.w + this.w) % this.w;
      line(g, x, y, x - this.dir * len, y + Math.sin(this.t * 4 + i) * 4, i % 2 ? '#e8f0c8' : '#c8d8a0', 2.4);
    }
    g.restore();
  }
}
// ---------- L3 ----------
class MeringueCloud extends Ent {
  constructor(x, y, w) { super(x, y, w || 80, 20); this.solid = 'top'; this.home = y; this.st = 'ok'; this.timer = 0; this.dx = 0; this.dy = 0; this.groundT = TL.SOLID; this.alpha = 1; }
  update(G, dt) {
    this.t += dt; const p = G.player; this.dy = 0; this.dx = 0;
    if (this.st === 'ok') { if (p.standOn === this && p.onGround) { this.st = 'shake'; this.timer = 0.6; Audio2.play('crack'); } }
    else if (this.st === 'shake') { this.timer -= dt; if (this.timer <= 0) { this.st = 'gone'; this.solid = null; this.timer = 3; G.burst(this.cx, this.cy, 14, ['#ffffff', '#f2e6d0']); } }
    else if (this.st === 'gone') { this.timer -= dt; if (this.timer <= 0) { this.st = 'ok'; this.solid = 'top'; this.alpha = 0; } }
    this.alpha = Math.min(1, this.alpha + dt * 2);
  }
  draw(g) { if (this.st === 'gone') return; drawMeringue(g, this.x, this.y - 4, this.w, { t: this.t, shake: this.st === 'shake', crack: this.st === 'shake', alpha: this.alpha }); }
}
class LolliIcicle extends Enemy {
  constructor(x, y) { super(x - 10, y, 20, 62); this.hx = x; this.hy = y; this.st = 'hang'; this.timer = 0; this.harmful = false; this.stompable = false; this.slideable = false; this.freezable = false; this.active = true; }
  update(G, dt) {
    this.t += dt; const p = G.player;
    if (this.st === 'hang') { this.harmful = false; if (Math.abs(p.cx - this.hx) < 70 && p.y > this.hy && p.y - this.hy < 520 && p.state === 'play') { this.st = 'shake'; this.timer = 0.45; Audio2.play('clink'); } }
    else if (this.st === 'shake') { this.timer -= dt; if (this.timer <= 0) { this.st = 'fall'; this.vy = 0; } }
    else if (this.st === 'fall') {
      this.harmful = true; this.vy = Math.min(this.vy + 1500 * dt, 900); this.y += this.vy * dt;
      if (rectSolid(G, this.x + 4, this.bottom - 6, this.w - 8, 6) || groundBelow(G, this.cx, this.bottom) || this.y > G.level.H * T) { this.st = 'gone'; this.timer = 3.5; this.harmful = false; G.burst(this.cx, this.bottom, 10, ['#ff7aa8', '#7ad0ff', '#ffffff']); Audio2.play('break'); }
    } else if (this.st === 'gone') { this.timer -= dt; if (this.timer <= 0) { this.st = 'hang'; this.y = this.hy; } }
  }
  kill(G) { this.st = 'gone'; this.timer = 3.5; this.harmful = false; this.y = this.hy; G.burst(this.cx, this.cy, 8, ['#ff7aa8', '#ffffff']); }
  draw(g) { if (this.st === 'gone') return; drawLolli(g, this.cx, this.y, { t: this.t, shake: this.st === 'shake' }); }
}
class FlyRadish extends Enemy {
  constructor(x, y) { super(x - 15, y - 16, 30, 32); this.hx = x; this.hy = y; this.st = 'hover'; this.cool = 0; }
  update(G, dt) {
    if (!this.pre(G, dt)) return;
    const p = G.player; this.cool -= dt; let cx = this.cx, cy = this.cy;
    this.face = sign(p.cx - cx) || this.face;
    if (this.st === 'hover') {
      cx = lerp(cx, this.hx + Math.sin(this.t * 1.5) * 26, 0.08); cy = lerp(cy, this.hy + Math.sin(this.t * 3) * 6, 0.1);
      if (this.cool <= 0 && Math.abs(p.cx - cx) < 90 && p.cy > cy && p.cy - cy < 420 && p.state === 'play') { this.st = 'dive'; this.vy = 120; Audio2.play('ghost'); }
    } else if (this.st === 'dive') {
      this.vy = Math.min(this.vy + 1400 * dt, 620); cy += this.vy * dt; cx = lerp(cx, p.cx, 0.02);
      if (groundBelow(G, cx, cy + 16) || cy > this.hy + 460) { this.st = 'rise'; G.dust(cx, cy + 16, 4); }
    } else { const d = Math.hypot(this.hx - cx, this.hy - cy); if (d < 4) { this.st = 'hover'; this.cool = 1.4; } else { cx += (this.hx - cx) / d * 140 * dt; cy += (this.hy - cy) / d * 140 * dt; } }
    this.x = cx - this.w / 2; this.y = cy - this.h / 2;
  }
  draw(g) { drawFlyRadish(g, this.cx, this.cy, { t: this.t, face: this.face, dive: this.st === 'dive', frozen: this.frozen > 0 }); this.drawIce(g); }
}
class GarlicDrone extends Enemy {
  constructor(x, y, r) { super(x - 16, y - 16, 32, 34); this.ox = x; this.oy = y; this.r = r === undefined ? 60 : r; this.stinkT = rnd(0.5, 2); this.stompable = false; this.ph = rnd(0, 6); }
  update(G, dt) {
    if (!this.pre(G, dt)) return;
    const a = this.t * 1.4 + this.ph; this.x = this.ox + Math.cos(a) * this.r - 16; this.y = this.oy + Math.sin(a) * this.r * 0.5 - 16;
    this.stinkT -= dt;
    if (this.stinkT <= 0) { this.stinkT = 2.2; G.add(new StinkCloud(this.cx, this.bottom + 4)); }
  }
  draw(g) { drawGarlicDrone(g, this.cx, this.cy + 4, { t: this.t, frozen: this.frozen > 0 }); this.drawIce(g); }
}
class StinkCloud extends Enemy {
  constructor(x, y) { super(x - 14, y - 12, 28, 24); this.life = 2.8; this.stompable = false; this.shootable = false; this.freezable = false; this.slideable = false; this.active = true; this.starKill = true; }
  update(G, dt) { this.t += dt; this.life -= dt; this.y += 14 * dt; this.x += Math.sin(this.t * 2) * 10 * dt; if (this.life <= 0) this.alive = false; }
  kill(G) { this.alive = false; }
  onHitPlayer(G) { G.hint('stink', 'Фу, чесночное облако! Чесночных дронов бьют только выстрелом — ищи вишнемёт.'); }
  draw(g) { drawStink(g, this.cx, this.cy, { t: this.t, a: Math.min(1, this.life) }); }
}
class Celery extends Enemy {
  constructor(x, y) { super(x - 10, y - 58, 20, 58); this.timer = rnd(0.8, 2); this.drawK = 0; }
  update(G, dt) {
    if (!this.pre(G, dt)) return;
    const p = G.player; this.face = sign(p.cx - this.cx) || this.face;
    this.vy += PHYS.grav * dt; this.vx = 0; moveBody(this, G, dt);
    this.timer -= dt;
    if (this.timer < 0.6) this.drawK = clamp(1 - this.timer / 0.6, 0, 1); else this.drawK = 0;
    if (this.timer <= 0) {
      this.timer = 2.4;
      if (Math.abs(p.cx - this.cx) < 520 && Math.abs(p.cy - this.cy) < 260) { G.add(new CeleryArrow(this.cx + this.face * 20, this.y + 28, this.face, p)); Audio2.play('throw'); }
    }
  }
  draw(g) { drawCelery(g, this.cx, this.bottom, { t: this.t, face: this.face, draw: this.drawK, frozen: this.frozen > 0 }); this.drawIce(g); }
}
class CeleryArrow extends Enemy {
  constructor(x, y, dir, p) { super(x - 14, y - 4, 28, 8); this.vx = dir * 330; const d = Math.abs(p.cx - x); this.vy = clamp((p.cy - y) / Math.max(0.3, d / 330) - 0.5 * 300 * Math.max(0.3, d / 330), -400, 200); this.life = 3; this.freezable = false; this.active = true; }
  update(G, dt) { this.t += dt; this.life -= dt; this.vy += 300 * dt; this.x += this.vx * dt; this.y += this.vy * dt; if (this.life <= 0 || rectSolid(G, this.cx - 3, this.cy - 3, 6, 6)) { this.alive = false; G.burst(this.cx, this.cy, 4, ['#a8d878']); } }
  kill(G) { this.alive = false; G.burst(this.cx, this.cy, 4, ['#a8d878']); Audio2.play('pop'); }
  draw(g) { g.save(); g.translate(this.cx, this.cy); g.rotate(Math.atan2(this.vy, this.vx)); rrect(g, -14, -2.5, 28, 5, 2.5); fs(g, '#a8d878', '#4e8a32', 1.2); g.beginPath(); g.moveTo(14, -4); g.lineTo(20, 0); g.lineTo(14, 4); g.closePath(); fs(g, '#5ab040'); g.restore(); }
}
class Misha extends Ent {
  constructor(x, y, lines, action) { super(x - 16, y - 70, 32, 70); this.fx = x; this.fy = y; this.lines = lines; this.action = action; this.met = false; this.face = -1; this.leave = 0; }
  update(G, dt) {
    this.t += dt; const p = G.player;
    this.face = sign(p.cx - this.fx) || this.face;
    if (!this.met && (p.state === 'play') && Math.abs(p.cx - this.fx) < 70 && Math.abs(p.bottom - this.fy) < 90) {
      this.met = true;
      G.dialog(this.lines, () => { if (this.action) this.action(G, this); });
    }
    if (this.leave > 0) { this.leave -= dt; this.fy -= 0; this.fx += 140 * dt * this.face * -1; if (this.leave <= 0) this.alive = false; }
  }
  draw(g) { drawMisha(g, this.fx, this.fy, { t: this.t, face: this.face, wave: !this.met || this.leave > 0 }); if (!this.met) { g.save(); g.font = '900 22px Nunito, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#ffe14d'; g.strokeStyle = '#6a3214'; g.lineWidth = 4; const y = this.fy - 92 + Math.sin(this.t * 4) * 4; g.strokeText('!', this.fx, y); g.fillText('!', this.fx, y); g.restore(); } }
}
class RideBalloon extends Ent { // waits for the heroes in L3
  constructor(x, y) { super(x - 34, y - 40, 68, 40); this.ty = y; this.y = y - 420; this.st = 'down'; this.fx = x; }
  update(G, dt) {
    this.t += dt;
    if (this.st === 'down') { this.y = approach(this.y, this.ty - 40, 330 * dt); if (this.y >= this.ty - 40) this.st = 'wait'; }
    else if (this.st === 'wait') { const p = G.player; if (Math.abs(p.cx - this.cx) < 400) this.x = approach(this.x, clamp(p.cx - this.w / 2, this.fx - 260, this.fx + 30), 110 * dt); if (p.state === 'play' && overlap({ x: this.x - 10, y: this.y - 30, w: this.w + 20, h: this.h + 30 }, p)) { this.alive = false; p.enterBalloon(G, this); G.startRide(); } }
  }
  draw(g) { drawBalloon(g, this.cx, this.bottom, { t: this.t }); }
}
class Barrier extends Ent { // keeps the heroes on Misha's island until the balloon arrives
  constructor(x, y) { super(x - 6, y - 900, 12, 900); this.solid = 'full'; this.by = y; }
  draw(g) {
    const x = this.cx, y = this.by;
    for (let i = 0; i < 2; i++) { rrect(g, x - 6, y - 70, 12, 70, 6); fs(g, '#fff6f0', '#c8405a', 2); }
    g.save(); g.beginPath(); rrect(g, x - 6, y - 70, 12, 70, 6); g.clip(); g.strokeStyle = '#e2363c'; g.lineWidth = 5; for (let k = -2; k < 8; k++) { g.beginPath(); g.moveTo(x - 8, y - 70 + k * 12); g.lineTo(x + 8, y - 60 + k * 12); g.stroke(); } g.restore();
    circ(g, x, y - 74, 9); fs(g, '#ff6fa8', '#a02a5a', 2);
  }
}
class Gummy extends Enemy {
  constructor(x, y, o) { super(x - 16, y - 22, 32, 46); this.hx = x; this.hy = y; this.col = pick(['#ff5a5a', '#6ad04a', '#ffb03a', '#5ab0ff', '#c87aff']); this.ph = rnd(0, 6); this.amp = (o && o.amp) || 40; this.drift = (o && o.drift) || -30; this.freezable = false; this.stompable = false; }
  update(G, dt) { if (!this.pre(G, dt)) return; this.hx += this.drift * dt; this.x = this.hx - 16; this.y = this.hy - 22 + Math.sin(this.t * 1.6 + this.ph) * this.amp; }
  draw(g) { drawGummy(g, this.cx, this.cy, { col: this.col, t: this.t, ph: this.ph }); }
}
class CannonPit extends Ent {
  constructor(x, y) { super(x - 7, y - 7, 14, 14); this.vx = 580; this.life = 1.6; }
  update(G, dt) {
    this.t += dt; this.life -= dt; this.x += this.vx * dt;
    if (this.life <= 0 || this.x > G.cam.x + G.viewW + 40) { this.alive = false; return; }
    for (const e of G.ents) {
      if (!e.alive || !overlap(this, e)) continue;
      if (e instanceof GarlicBomb && !e.back) { e.reflect(G); this.alive = false; return; }
      if (!e.enemy) continue;
      if (e.boss) { if (e.onShot) e.onShot(G, this); this.alive = false; return; }
      if (e.shootable || e instanceof Gummy) { e.kill(G, 'shot'); this.alive = false; G.collectDrop(1); return; }
    }
  }
  draw(g) { g.save(); g.translate(this.cx, this.cy); g.rotate(this.t * 14); ell(g, 0, 0, 7, 5.5); fs(g, '#e2363c', '#7a1a14', 1.5); circ(g, -2, -2, 1.8); fs(g, '#fff'); g.restore(); }
}
class GarlicBomb extends Enemy {
  constructor(x, y, vx, vy) { super(x - 10, y - 12, 20, 24); this.vx = vx; this.vy = vy; this.back = false; this.freezable = false; this.stompable = false; this.shootable = false; this.slideable = false; this.active = true; this.life = 6; }
  reflect(G) { this.back = true; this.harmful = false; this.enemy = false; Audio2.play('clink'); G.spark(this.cx, this.cy, '#fff6a0'); G.hint('bomb', 'Отлично! Отбитый зубчик летит прямо в дирижабль!'); }
  update(G, dt) {
    this.t += dt; this.life -= dt;
    if (this.back && G.boss && G.boss.alive) {
      const b = G.boss, dx = b.cx - this.cx, dy = b.cy - this.cy, d = Math.hypot(dx, dy);
      this.vx = dx / d * 520; this.vy = dy / d * 520;
      if (d < 70) { this.alive = false; b.bombHit(G); }
    } else this.vy += 240 * dt;
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (this.life <= 0 || this.y > G.cam.y + VIEW_H + 60 || this.x < G.cam.x - 80) this.alive = false;
  }
  kill(G) { this.alive = false; G.burst(this.cx, this.cy, 6, ['#f4ecdc', '#ffffff']); }
  draw(g) { drawClove(g, this.cx, this.cy, { rot: this.t * 5, back: this.back }); }
}
class GarlicAirship extends Enemy {
  constructor(ar) {
    super(0, 0, 150, 120); this.ar = ar; this.hp = 5; this.maxHp = 5; this.st = 'wait'; this.boss = true; this.active = true; this.name = 'Чесночный Дирижабль';
    this.freezable = false; this.slideable = false; this.stompable = false; this.starKill = false; this.harmful = false; this.flash = 0; this.bombT = 1.2; this.gx = 0; this.gy = 0;
  }
  reset() { this.hp = 5; this.st = 'wait'; this.alive = true; }
  begin(G) { this.st = 'enter'; this.gx = G.cam.x + G.viewW + 160; this.gy = G.cam.y + VIEW_H * 0.42; Audio2.play('roar'); }
  sync() { this.x = this.gx - 75; this.y = this.gy - 70; }
  update(G, dt) {
    this.t += dt; this.flash = Math.max(0, this.flash - dt);
    const cam = G.cam, homeX = cam.x + G.viewW - 170, p = G.player;
    if (this.st === 'wait') return;
    if (this.st === 'enter') { this.gx = approach(this.gx, homeX, 180 * dt); if (this.gx <= homeX + 1) { this.st = 'fight'; G.hint('air1', `Чесночный Дирижабль! Стреляй (${Input.label('fire')}) по его зубчикам-бомбам — отбитые полетят обратно!`); } }
    else if (this.st === 'fight') {
      this.gx = homeX + Math.sin(this.t * 0.7) * 30;
      this.gy = lerp(this.gy, cam.y + VIEW_H * 0.45 + Math.sin(this.t * 0.9) * 140, 0.02);
      this.bombT -= dt;
      if (this.bombT <= 0) {
        const n = this.hp <= 2 ? 3 : this.hp <= 3 ? 2 : 1;
        for (let i = 0; i < n; i++) { const tx = p.cx - this.gx, tt = 1.6 + i * 0.25; G.add(new GarlicBomb(this.gx - 30, this.gy + 50, tx / tt, -140 - i * 60)); }
        this.bombT = this.hp <= 2 ? 1.7 : 2.1; Audio2.play('pop');
        if (this.hp <= 3 && Math.random() < 0.5) G.add(new StinkCloud(this.gx - 60, this.gy + 20));
      }
    } else if (this.st === 'dead') {
      this.timer -= dt; this.gy += 60 * dt; this.tilt = (this.tilt || 0) + dt * 0.4;
      if (Math.random() < 0.5) G.burst(this.gx + rnd(-60, 60), this.gy + rnd(-40, 40), 3, ['#f4ecdc', '#c8c0b0', '#7a6a58']);
      if (this.timer <= 0) { this.alive = false; G.burst(this.gx, this.gy, 40, ['#f4ecdc', '#ffffff', '#c8c0b0']); G.bossDefeated(this); }
    }
    this.sync();
  }
  bombHit(G) {
    if (this.st !== 'fight') return;
    this.hp--; this.flash = 0.6; Audio2.play('bossHit'); G.shake(0.3); G.burst(this.gx, this.gy, 18, ['#f4ecdc', '#ffe14d', '#ffffff']);
    G.add(new TextFx(this.gx, this.gy - 90, ['Бах!', 'Ещё!', 'Так его!', 'Почти!', 'Ура!'][4 - Math.max(0, this.hp)] || 'Бах!', '#fff6a0'));
    if (this.hp <= 0) { this.st = 'dead'; this.timer = 2; Audio2.play('win'); G.clearBossShots(); }
  }
  onShot(G) { Audio2.play('clink'); this.flash = 0.08; G.spark(this.gx - 60 + rnd(-10, 10), this.gy + rnd(-30, 30), '#fff'); G.hint('air2', 'Броня толстая! Отбивай зубчики-бомбы — только они пробьют дирижабль.'); }
  kill() { }
  draw(g) { if (this.st === 'wait') return; drawAirship(g, this.gx, this.gy, { t: this.t, flash: this.flash > 0, dmg: 5 - this.hp, tilt: this.tilt, open: this.bombT < 0.5 }); }
}
// ---------- L4 ----------
class Raft extends Ent {
  constructor(x, y, x1, speed) { super(x, y - 10, 100, 18); this.solid = 'top'; this.x1 = x1; this.speed = speed || 70; this.dx = 0; this.dy = 0; this.baseY = y - 10; this.groundT = TL.SOLID; this.sinkK = 0; this.alpha = 0; }
  update(G, dt) {
    this.t += dt; this.alpha = Math.min(1, this.alpha + dt * 2);
    let nx = this.x, ny = this.baseY + Math.sin(this.t * 2.2) * 3;
    if (this.x + this.w < this.x1) nx += this.speed * dt;
    else { this.sinkK += dt * 0.7; ny += this.sinkK * 40; if (this.sinkK > 1.2) { this.alive = false; this.solid = null; G.burst(this.cx, this.y, 8, ['#d8a058', '#6a3a1e']); } }
    this.dx = nx - this.x; this.dy = ny - this.y; this.x = nx; this.y = ny;
  }
  draw(g) { drawRaft(g, this.x, this.y, this.w, { t: this.t, alpha: this.alpha * (1 - Math.max(0, this.sinkK - 0.5)) }); }
}
class RaftSpawner extends Ent {
  constructor(x, y, x1, period, speed) { super(x, y, 2, 2); this.x1 = x1; this.period = period || 3.2; this.speed = speed || 70; this.timer = 0; this.started = false; }
  update(G, dt) {
    if (!this.started) { this.started = true; for (let k = 0; k < 4; k++) { const r = new Raft(this.x + k * this.period * this.speed, this.y, this.x1, this.speed); if (r.x + r.w < this.x1) { r.alpha = 1; G.add(r); } } }
    this.timer -= dt; if (this.timer <= 0) { this.timer = this.period; G.add(new Raft(this.x, this.y, this.x1, this.speed)); }
  }
}
class JellyPad extends Ent {
  constructor(x, y, w, col, min) { super(x, y, w || 80, 22); this.min = min || 780; this.solid = 'top'; this.bouncy = true; this.col = col || pick([['#7ae04a', '#3a9a2a'], ['#ffb03a', '#d8661a'], ['#ff6a8a', '#c82a4a'], ['#6ac8ff', '#2a7ac8']]); this.sq = 0; this.dx = 0; this.dy = 0; this.groundT = TL.SOLID; }
  bounce(G, p, impact) {
    const v = clamp(Math.max(this.min, impact * 1.08), this.min, 1320) * (Input.held('jump') ? 1.08 : 1);
    p.vy = -v; p.onGround = false; p.standOn = null; p.cutOk = false; p.airJumps = 1; p.sx = 0.75; p.sy = 1.3;
    this.sq = 1; Audio2.play('boing'); G.hint('jelly', 'Желейный батут! Чем выше падаешь — тем выше подбросит.');
  }
  update(G, dt) { this.t += dt; this.sq = Math.max(0, this.sq - dt * 4); this.dx = 0; this.dy = 0; }
  draw(g) { drawJellyPad(g, this.x, this.y, this.w, { col: this.col, sq: Math.sin(this.sq * 10) * this.sq }); }
}
class Geyser extends Ent {
  constructor(x, y, period, phase) { super(x - 16, y - 230, 32, 230); this.bx = x; this.by = y; this.period = period || 3.2; this.t = phase || 0; this.h = 0; }
  update(G, dt) {
    this.t += dt; const cyc = this.t % this.period, erupt = cyc > this.period - 1.2;
    this.warn = !erupt && cyc > this.period - 1.9;
    this.h = erupt ? approach(this.h, 220, 900 * dt) : approach(this.h, 0, 500 * dt);
    if (erupt && !this.was) Audio2.play('geyser');
    this.was = erupt;
    const p = G.player;
    if (this.h > 40 && p.state === 'play' && p.cx > this.bx - 22 && p.cx < this.bx + 22 && p.bottom > this.by - this.h - 10 && p.y < this.by) {
      p.vy = -1060; p.onGround = false; p.standOn = null; p.airJumps = 1; p.cutOk = false; p.pounding = false;
      G.hint('geyser', 'Шоколадный гейзер подбрасывает высоко! Используй его, чтобы взлететь.');
    }
  }
  draw(g) { drawGeyser(g, this.bx, this.by, { h: this.h, t: this.t, warn: this.warn }); }
}
class Whirlpool extends Ent {
  constructor(x, y) { super(x - 70, y - 70, 140, 140); this.wx = x; this.wy = y; }
  update(G, dt) {
    this.t += dt; const p = G.player;
    if (p.swimming) {
      const dx = this.wx - p.cx, dy = this.wy - p.cy, d = Math.hypot(dx, dy);
      if (d < 90) { p.vx += dx / d * 600 * dt; p.vy += dy / d * 600 * dt; G.hint('whirl', 'Водоворот! Греби изо всех сил в сторону!'); }
      if (d < 22) { p.hurt(G, this); p.vy = -500; p.vx = (p.face || 1) * 260; }
    }
  }
  draw(g) {
    g.save(); g.translate(this.wx, this.wy); g.globalAlpha = 0.6;
    for (let i = 0; i < 3; i++) { g.beginPath(); for (let k = 0; k < 40; k++) { const a = k * 0.3 + this.t * 4 + i * 2.1, r = k * 1.6; g.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.7); } g.strokeStyle = '#c08050'; g.lineWidth = 2.5; g.stroke(); }
    g.restore();
  }
}
class Toad extends Enemy {
  constructor(x, y) { super(x - 16, y - 32, 32, 32); this.timer = rnd(0.6, 1.6); this.sq = 0; }
  update(G, dt) {
    if (!this.pre(G, dt)) return;
    const p = G.player; this.vy += PHYS.grav * dt;
    if (this.onGround) {
      this.vx = 0; this.face = sign(p.cx - this.cx) || this.face; this.timer -= dt; this.sq = this.timer < 0.3 ? (0.3 - this.timer) * 2 : 0;
      if (this.timer <= 0 && Math.abs(p.cx - this.cx) < 500) { this.vy = -560; this.vx = this.face * 170; this.timer = 1.6; this.sq = 0; }
    }
    const v = this.vx; moveBody(this, G, dt); if (!this.onGround) this.vx = v;
    if (this.y > G.level.H * T) this.alive = false;
  }
  draw(g) { drawToad(g, this.cx, this.bottom, { t: this.t, face: this.face, squash: this.sq, frozen: this.frozen > 0 }); this.drawIce(g); }
}
class LeechE extends Enemy {
  constructor(x, y) { super(x - 16, y - 14, 32, 14); this.vx = -24; this.attached = false; }
  update(G, dt) {
    if (!this.pre(G, dt)) return;
    if (this.attached) { const p = G.player; this.x = p.cx - 16; this.y = p.cy; return; }
    this.walkerMove(G, dt, 24);
  }
  onTouch(G, p) {
    if (this.attached || p.leech || p.state !== 'play') return true;
    this.attached = true; this.harmful = false; this.stompable = false; p.leech = this; p.leechT = 0; p.leechShake = 0;
    G.hint('leech', `Перловая пиявка прилипла! Быстро жми ${Input.label('jump')} несколько раз — стряхнёшь.`); Audio2.play('grab');
    return true;
  }
  detach(G, good) { const p = G.player; p.leech = null; this.alive = false; G.burst(this.cx, this.cy, 8, ['#e8d8a8', '#c8b478']); if (good) { Audio2.play('pop'); G.add(new TextFx(p.cx, p.y - 10, 'Стряхнул!', '#fff6a0')); } }
  draw(g) { if (this.attached) return; drawLeech(g, this.cx, this.bottom - 6, { t: this.t, face: this.face }); this.drawIce(g); }
}
class Kholodets extends Enemy {
  constructor(x, y, o) { super(x - 18, y - 34, 36, 34); this.speed = (o && o.speed) || 30; this.vx = -this.speed; this.s = (o && o.s) || 1; if (this.s !== 1) { this.w = 36 * this.s; this.h = 34 * this.s; this.x = x - this.w / 2; this.y = y - this.h; } }
  update(G, dt) { if (!this.pre(G, dt)) return; this.walkerMove(G, dt, this.speed); }
  onStomp(G, p) { p.vy = -900; p.cutOk = false; p.airJumps = 1; Audio2.play('boing'); G.hint('khol', 'Холодец пружинит — его не растоптать! Бей вишнемётом, подкатом или брось Пикля.'); return 'none'; }
  onPound(G, p) { this.kill(G, 'stomp'); }
  draw(g) { drawKholodets(g, this.cx, this.bottom, { t: this.t, s: this.s, frozen: this.frozen > 0 }); this.drawIce(g); }
}
class QueenKholodets extends Enemy {
  constructor(ar) { super(0, 0, 96, 90); this.ar = ar; this.hp = 4; this.maxHp = 4; this.st = 'wait'; this.boss = true; this.active = true; this.name = 'Королева Холодец'; this.freezable = false; this.slideable = false; this.starKill = false; this.flash = 0; this.timer = 0; this.harmful = false; }
  get sc() { return [0.6, 0.7, 0.8, 0.9, 1][this.hp] || 1; }
  reset() { this.hp = 4; this.st = 'wait'; this.alive = true; }
  begin(G) { this.st = 'enter'; this.x = (this.ar.x0 + this.ar.x1) / 2 - this.w / 2; this.y = this.ar.floor - 600; this.vy = 0; }
  update(G, dt) {
    this.t += dt; this.flash = Math.max(0, this.flash - dt);
    const p = G.player, s = this.sc; this.w = 96 * s; this.h = 90 * s;
    if (this.st === 'wait') return;
    this.vy += PHYS.grav * dt;
    const v = this.vx; moveBody(this, G, dt); if (!this.onGround) this.vx = v;
    if (this.onGround && (this.st === 'enter' || this.st === 'air')) {
      G.shake(0.25); Audio2.play('thud'); G.dust(this.cx, this.bottom, 10); this.vx = 0;
      this.st = 'wobble'; this.timer = [0, 1.3, 1.5, 1.7, 1.9][this.hp];
      G.hint('queen2', 'Королева трясётся после прыжка — сейчас прыгай ей на корону!');
    }
    if (this.st === 'wobble') { this.timer -= dt; if (this.timer <= 0) { this.st = 'air'; const dir = sign(p.cx - this.cx) || 1; const dist = clamp(Math.abs(p.cx - this.cx), 120, 420); this.vy = -820; this.vx = dir * dist / 0.8; this.face = dir; Audio2.play('boing'); } }
    if (this.st === 'hit') { this.timer -= dt; if (this.timer <= 0) { if (this.hp <= 0) { this.st = 'dead'; this.timer = 1.4; Audio2.play('win'); G.clearBossShots(); } else { this.st = 'air'; this.vy = -900; this.vx = (sign(this.cx - p.cx) || 1) * 220; } } }
    if (this.st === 'dead') { this.timer -= dt; if (Math.random() < 0.5) G.burst(this.cx + rnd(-30, 30), this.cy, 3, ['#f8e6b8', '#ff8a3a']); if (this.timer <= 0) { this.alive = false; G.burst(this.cx, this.cy, 36, ['#f8e6b8', '#d8b878', '#ff8a3a', '#ffffff']); G.bossDefeated(this); } }
    this.harmful = this.st === 'air' || this.st === 'enter';
    if (this.x < this.ar.x0) { this.x = this.ar.x0; this.vx = Math.abs(this.vx); } if (this.x + this.w > this.ar.x1) { this.x = this.ar.x1 - this.w; this.vx = -Math.abs(this.vx); }
  }
  hitQueen(G, p, big) {
    if (this.st !== 'wobble' && !big) return false;
    if (this.st === 'hit' || this.st === 'dead' || this.st === 'wait') return false;
    this.hp--; this.st = 'hit'; this.timer = 0.8; this.flash = 0.8; Audio2.play('bossHit'); G.shake(0.3);
    G.burst(this.cx, this.y, 16, ['#f8e6b8', '#ff8a3a']);
    if (this.hp > 0) { for (const d of [-1, 1]) { const k = G.add(new Kholodets(this.cx + d * 40, this.bottom, { s: 0.7, speed: 50 })); k.active = true; k.vx = d * 50; } G.mercy(this.ar); }
    return true;
  }
  onStomp(G, p) { if (this.hitQueen(G, p, false)) { p.vy = -820; p.cutOk = false; p.airJumps = 1; return 'none'; } p.vy = -900; p.airJumps = 1; Audio2.play('boing'); return 'none'; }
  onPound(G, p) { this.hitQueen(G, p, true); }
  onShot(G) { this.flash = 0.1; Audio2.play('bump'); return true; }
  onPickle(G) { Audio2.play('boing'); }
  kill() { }
  draw(g) { if (this.st === 'wait') return; g.save(); if (this.flash > 0) g.globalAlpha = 0.6 + Math.sin(this.t * 50) * 0.4; const sq = this.st === 'wobble' ? Math.sin(this.t * 18) * 0.08 : 0; g.translate(this.cx, this.bottom); g.scale(1 + sq, 1 - sq); drawKholodets(g, 0, 0, { t: this.t, s: 2.6 * this.sc, crown: true, mouth: this.st === 'wobble' ? 'o' : 'frown' }); g.restore(); }
}
class BridgePiece extends Ent {
  constructor(x, y, delay) { super(x, y, T, 16); this.solid = null; this.k = 0; this.delay = delay || 0; this.on = false; this.dx = 0; this.dy = 0; this.groundT = TL.SOLID; }
  activate() { this.on = true; }
  update(G, dt) { this.dx = 0; this.dy = 0; if (this.on) { this.delay -= dt; if (this.delay <= 0) { if (this.k === 0) Audio2.play('pop'); this.k = Math.min(1, this.k + dt * 4); this.solid = this.k > 0.6 ? 'top' : null; } } }
  draw(g) { if (this.k <= 0) return; g.save(); g.globalAlpha = this.k; g.translate(0, (1 - this.k) * -30); THEME4.plank(g, this.x, this.y, this.w); g.restore(); }
}
// ---------- L5 ----------
class Cleaver extends Enemy {
  constructor(x, top, bottom, period, phase) { super(x - 22, bottom - 56, 44, 56); this.top = top; this.low = bottom; this.period = period || 2.4; this.t = phase || 0; this.stompable = false; this.shootable = false; this.freezable = false; this.slideable = false; this.starKill = false; this.active = true; this.by = top + 60; }
  update(G, dt) {
    this.t += dt; const c = this.t % this.period, p = this.period;
    let k; if (c < p * 0.45) k = 0; else if (c < p * 0.52) k = (c - p * 0.45) / (p * 0.07); else if (c < p * 0.7) k = 1; else k = 1 - (c - p * 0.7) / (p * 0.3);
    const prev = this.by; this.by = lerp(this.top + 70, this.low, k);
    if (k === 1 && prev < this.low - 2) { Audio2.play('chop'); G.shake(0.08); G.dust(this.cx, this.low, 4); }
    this.y = this.by - 56; this.harmful = this.by > this.top + 90;
    this.warn = c > p * 0.3 && c < p * 0.45;
  }
  kill() { }
  draw(g) { drawCleaver(g, this.cx + (this.warn ? Math.sin(this.t * 60) * 1.5 : 0), this.by, { top: this.top }); }
}
class SteamVent extends Enemy {
  constructor(x, y, h, period, phase) { super(x - 18, y - (h || 170), 36, h || 170); this.bx = x; this.by = y; this.period = period || 3.4; this.t = phase || 0; this.stompable = false; this.shootable = false; this.freezable = false; this.slideable = false; this.starKill = false; this.active = true; }
  update(G, dt) {
    this.t += dt; const c = this.t % this.period; const on = c > this.period - 1.3;
    this.warn = !on && c > this.period - 2;
    if (on && !this.was && Math.abs(G.player.cx - this.bx) < 600) Audio2.play('steam');
    this.was = on; this.harmful = on;
    if (on && Math.random() < 0.9) G.parts.push({ k: 'dust', x: this.bx + rnd(-12, 12), y: this.by - 4, vx: rnd(-20, 20), vy: rnd(-420, -300), life: 0.45, max: 0.45, c: 'rgba(240,240,240,0.75)', s: rnd(6, 11), g: 0 });
    if (this.warn && Math.random() < 0.2) G.parts.push({ k: 'dust', x: this.bx + rnd(-8, 8), y: this.by - 4, vx: 0, vy: -60, life: 0.4, max: 0.4, c: 'rgba(240,240,240,0.5)', s: 4, g: 0 });
  }
  onHitPlayer(G) { G.hint('steam', 'Пар обжигает! Следи, когда клапан начинает шипеть.'); }
  kill() { }
  draw(g) { rrect(g, this.bx - 20, this.by - 10, 40, 10, 3); fs(g, '#4a4e56', '#1a1e26', 2); for (let i = 0; i < 4; i++) line(g, this.bx - 14 + i * 9, this.by - 9, this.bx - 14 + i * 9, this.by - 1, '#1a1e26', 2); }
}
class FlipPan extends Ent {
  constructor(x, y, w, period, phase) { super(x, y, w || 100, 14); this.solid = 'top'; this.period = period || 4; this.t = phase || 0; this.rot = 0; this.dx = 0; this.dy = 0; this.groundT = TL.SOLID; }
  update(G, dt) {
    this.t += dt; this.dx = 0; this.dy = 0; const c = this.t % this.period, p = this.period;
    let target = 0; this.shake = false;
    if (c > p - 2.0 && c < p - 1.5) this.shake = true;
    if (c >= p - 1.5) target = 1.45;
    const prevSolid = this.solid;
    this.rot = approach(this.rot, target, dt * 5);
    this.solid = this.rot < 0.3 ? 'top' : null;
    if (prevSolid && !this.solid) Audio2.play('clink');
  }
  draw(g) { drawPan(g, this.x + (this.shake ? Math.sin(this.t * 60) * 2 : 0), this.y, this.w, { rot: this.rot }); }
}
class PotLid extends Enemy {
  constructor(x, y) { super(x - 30, y, 60, 18); this.hx = x; this.hy = y; this.st = 'hang'; this.harmful = false; this.stompable = true; this.slideable = false; this.freezable = false; this.active = true; this.timer = 0; }
  update(G, dt) {
    this.t += dt; const p = G.player;
    if (this.st === 'hang') { this.harmful = false; if (Math.abs(p.cx - this.hx) < 60 && p.y > this.hy && p.state === 'play') { this.st = 'shake'; this.timer = 0.4; Audio2.play('clink'); } }
    else if (this.st === 'shake') { this.timer -= dt; if (this.timer <= 0) { this.st = 'fall'; this.vy = 0; } }
    else if (this.st === 'fall') { this.harmful = true; this.vy = Math.min(this.vy + 1600 * dt, 900); this.y += this.vy * dt; if (groundBelow(G, this.cx, this.bottom) || this.y > G.level.H * T) { this.st = 'gone'; this.timer = 3; this.harmful = false; Audio2.play('clink'); G.burst(this.cx, this.bottom, 6, ['#a8a8b0', '#ffffff']); } }
    else if (this.st === 'gone') { this.timer -= dt; if (this.timer <= 0) { this.st = 'hang'; this.y = this.hy; } }
  }
  onStomp(G) { this.st = 'gone'; this.timer = 3; this.harmful = false; this.y = this.hy; Audio2.play('clink'); return 'bounce'; }
  kill(G) { this.st = 'gone'; this.timer = 3; this.y = this.hy; }
  draw(g) { if (this.st === 'gone') return; drawLid(g, this.cx, this.y + 10, { t: this.t, shake: this.st === 'shake' }); }
}
class Masher extends Enemy {
  constructor(x, top, bottom, period, phase) { super(x - 36, top, 72, 18); this.top = top; this.low = bottom; this.period = period || 3; this.t = phase || 0; this.stompable = false; this.shootable = false; this.freezable = false; this.slideable = false; this.starKill = false; this.active = true; this.hy = top + 40; }
  update(G, dt) {
    this.t += dt; const c = this.t % this.period, p = this.period;
    let k; if (c < p * 0.5) k = 0; else if (c < p * 0.58) k = (c - p * 0.5) / (p * 0.08); else if (c < p * 0.7) k = 1; else k = 1 - (c - p * 0.7) / (p * 0.3);
    const prev = this.hy; this.hy = lerp(this.top + 40, this.low, k);
    if (k === 1 && prev < this.low - 2) { Audio2.play('thud'); G.shake(0.15); G.dust(this.cx, this.low, 6); }
    this.y = this.hy - 18; this.harmful = this.hy > this.top + 60;
  }
  kill() { }
  draw(g) { drawMasher(g, this.cx, this.hy, { top: this.top }); }
}
class Cutlet extends Enemy {
  constructor(x, y) { super(x - 20, y - 30, 40, 30); this.armor = true; this.vx = -40; }
  update(G, dt) { if (!this.pre(G, dt)) return; this.walkerMove(G, dt, this.armor ? 40 : 70); }
  crack(G) { this.armor = false; Audio2.play('crack'); G.burst(this.cx, this.y + 6, 12, ['#3a1a08', '#5a2e14', '#8a8a8a']); G.hint('cutlet', 'У котлеты слетела подгорелая корочка — теперь её можно растоптать!'); }
  onStomp(G, p) { if (this.armor) { this.crack(G); return 'bounce'; } this.kill(G, 'stomp'); return 'bounce'; }
  onShot(G) { if (this.armor) { this.crack(G); return true; } this.kill(G, 'shot'); return true; }
  draw(g) { drawCutlet(g, this.cx, this.bottom, { t: this.t, face: this.face, armor: this.armor, frozen: this.frozen > 0 }); this.drawIce(g); }
}
class Kraut extends Enemy {
  constructor(x, y) { super(x - 16, y - 52, 32, 52); this.vx = -36; }
  update(G, dt) { if (!this.pre(G, dt)) return; this.walkerMove(G, dt, 36); }
  onShot(G, s) { if (sign(s.vx) === -this.face) { Audio2.play('clink'); G.spark(this.cx + this.face * 18, this.cy, '#fff'); G.hint('kraut', 'Квашеный страж прикрывается щитом спереди! Бей сверху или зайди со спины.'); return true; } this.kill(G, 'shot'); return true; }
  onPickle(G, pk) { if (sign(pk.vx) === -this.face) { Audio2.play('clink'); return; } this.kill(G, 'pickle'); }
  draw(g) { drawKraut(g, this.cx, this.bottom, { t: this.t, face: this.face, frozen: this.frozen > 0 }); this.drawIce(g); }
}
class Golem extends Enemy {
  constructor(x, y) { super(x - 28, y - 68, 56, 68); this.hp = 3; this.vx = -28; this.slamT = rnd(2, 3.5); this.slam = 0; this.flash = 0; this.freezable = false; }
  update(G, dt) {
    if (!this.pre(G, dt)) return; this.flash = Math.max(0, this.flash - dt);
    this.slamT -= dt;
    if (this.slamT < 0.7 && this.slamT > 0) { this.slam = Math.min(1, this.slam + dt * 2.5); this.vy += PHYS.grav * dt; this.vx = 0; moveBody(this, G, dt); }
    else if (this.slamT <= 0) {
      this.slamT = 3.6; this.slam = 0; G.shake(0.3); Audio2.play('thud');
      if (Math.abs(G.player.cx - this.cx) < 700) for (const d of [-1, 1]) G.add(new Shockwave(this.cx + d * 30, this.bottom, d));
      this.vx = this.face * 28;
    } else this.walkerMove(G, dt, 28);
  }
  onStomp(G, p) { this.hp--; this.flash = 0.4; Audio2.play('bossHit'); if (this.hp <= 0) this.kill(G, 'stomp'); else G.add(new TextFx(this.cx, this.y - 10, `${this.hp}`, '#ffd06a')); return 'bounce'; }
  onShot(G) { this.flash = 0.15; Audio2.play('bump'); return true; }
  onPickle(G) { Audio2.play('bump'); }
  onPound(G) { this.hp -= 2; this.flash = 0.4; if (this.hp <= 0) this.kill(G, 'stomp'); }
  draw(g) { drawGolem(g, this.cx, this.bottom, { t: this.t, face: this.face, slam: this.slam, flash: this.flash > 0, frozen: this.frozen > 0 }); }
}
class Shockwave extends Enemy {
  constructor(x, y, dir) { super(x - 14, y - 18, 28, 18); this.vx = dir * 280; this.life = 1.8; this.stompable = false; this.shootable = false; this.freezable = false; this.slideable = false; this.active = true; this.starKill = true; }
  update(G, dt) { this.t += dt; this.life -= dt; this.x += this.vx * dt; if (this.life <= 0 || rectSolid(G, this.cx + sign(this.vx) * 14, this.y, 2, this.h - 2) || !groundBelow(G, this.cx, this.bottom + 4)) this.alive = false; }
  kill() { this.alive = false; }
  onHitPlayer(G) { G.hint('shock', 'Ударная волна! Перепрыгивай её.'); }
  draw(g) { g.save(); g.globalAlpha = Math.min(1, this.life * 2); for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(this.cx - sign(this.vx) * i * 8, this.bottom, 16 - i * 4, Math.PI, 0); g.strokeStyle = i ? 'rgba(200,150,100,0.6)' : '#e8c070'; g.lineWidth = 4; g.stroke(); } g.restore(); }
}
class Rusk extends Enemy {
  constructor(x, y) { super(x - 18, y - 30, 36, 30); this.timer = rnd(0.5, 2); }
  update(G, dt) {
    if (!this.pre(G, dt)) return; const p = G.player; this.face = sign(p.cx - this.cx) || this.face;
    this.vy += PHYS.grav * dt; this.vx = 0; moveBody(this, G, dt);
    this.timer -= dt;
    if (this.timer <= 0) { this.timer = 2.4; const d = p.cx - this.cx; if (Math.abs(d) < 520) { const tt = 0.9; G.add(new SaltShot(this.cx + this.face * 18, this.y + 10, d / tt, -420)); Audio2.play('pea'); } }
  }
  draw(g) { drawRusk(g, this.cx, this.bottom, { face: this.face, frozen: this.frozen > 0 }); this.drawIce(g); }
}
class SaltShot extends Enemy {
  constructor(x, y, vx, vy) { super(x - 5, y - 5, 10, 10); this.vx = clamp(vx, -380, 380); this.vy = vy; this.freezable = false; this.active = true; this.life = 3; }
  update(G, dt) { this.t += dt; this.life -= dt; this.vy += 900 * dt; this.x += this.vx * dt; this.y += this.vy * dt; if (this.life <= 0 || rectSolid(G, this.x + 2, this.y + 2, 6, 6)) { this.alive = false; G.burst(this.cx, this.cy, 4, ['#ffffff']); } }
  kill(G) { this.alive = false; G.burst(this.cx, this.cy, 4, ['#ffffff']); }
  draw(g) { drawSalt(g, this.cx, this.cy, this.t); }
}
class ToastPlat extends Ent {
  constructor(x, y, w, ph) { super(x, y, w || 90, 16); this.solid = 'top'; this.baseY = y; this.ph = ph || 0; this.dx = 0; this.dy = 0; this.groundT = TL.SOLID; this.k = 0; }
  update(G, dt) { this.t += dt; this.k = Math.min(1, this.k + dt); const ny = this.baseY + Math.sin(this.t * 1.6 + this.ph) * 10 + (1 - this.k) * 60; this.dy = ny - this.y; this.y = ny; this.dx = 0; }
  draw(g) { drawToast(g, this.x, this.y, this.w, { tilt: Math.sin(this.t * 1.6 + this.ph) * 0.04 }); }
}
class BrothBlob extends Enemy {
  constructor(x, y, vx, vy) { super(x - 10, y - 10, 20, 20); this.vx = vx; this.vy = vy; this.freezable = false; this.stompable = false; this.shootable = false; this.slideable = false; this.active = true; this.life = 4; }
  update(G, dt) { this.t += dt; this.life -= dt; this.vy += 800 * dt; this.x += this.vx * dt; this.y += this.vy * dt; if (this.life <= 0 || this.y > (G.flood ? G.flood.y : G.level.H * T) || rectSolid(G, this.cx, this.cy, 2, 2)) { this.alive = false; G.burst(this.cx, this.cy, 6, ['#f2b33d', '#ffd06a']); } }
  kill() { this.alive = false; }
  draw(g) { circ(g, this.cx, this.cy, 10); fs(g, '#f2b33d', '#a8621a', 2); circ(g, this.cx - 3, this.cy - 3, 3); fs(g, '#ffe0a0'); }
}
class BaronBoss extends Enemy {
  constructor(ar) {
    super(0, 0, 200, 260); this.ar = ar; this.boss = true; this.active = true; this.name = 'Барон Брюссель'; this.freezable = false; this.slideable = false; this.starKill = false; this.stompable = false;
    this.maxHp = 9; this.st = 'wait'; this.phase = 1; this.flash = 0; this.timer = 0; this.dir = -1; this.step = 0; this.swing = 0;
    this.valves = [{ dx: -134, dy: -22 }, { dx: 134, dy: -22 }, { dx: 0, dy: -86 }]; this.lidOpen = false; this.coreHits = 0; this.baronHp = 3;
    this.bx = (ar.x0 + ar.x1) / 2; this.by = ar.floor; this.harmful = false;
  }
  get hp() { return this.phase === 1 ? 6 + this.valves.filter(v => !v.broken).length : this.phase === 2 ? 3 + (3 - this.coreHits) : this.phase === 3 ? this.baronHp : 0; }
  reset() { this.phase = 1; this.st = 'wait'; this.alive = true; this.valves.forEach(v => v.broken = false); this.coreHits = 0; this.baronHp = 3; this.bx = (this.ar.x0 + this.ar.x1) / 2; this.by = this.ar.floor; this.lidOpen = false; }
  begin(G) { this.st = 'walk'; this.timer = 2; Audio2.play('roar'); G.hint('fin1', 'Барон в котле-роботе Пережарке! Прыгай на золотые вентили — их три.'); }
  valvePos(v) { return { x: this.bx + v.dx, y: this.by - 180 + v.dy }; }
  update(G, dt) {
    this.t += dt; this.flash = Math.max(0, this.flash - dt);
    const p = G.player, ar = this.ar;
    if (this.st === 'wait') return;
    if (this.phase === 1) {
      if (this.st === 'walk') {
        this.bx += this.dir * 55 * dt; this.step += dt * 4;
        if (this.bx < ar.x0 + 170) this.dir = 1; if (this.bx > ar.x1 - 170) this.dir = -1;
        this.timer -= dt;
        if (this.timer <= 0) { this.st = 'swingWind'; this.timer = 0.8; Audio2.play('roar'); }
      } else if (this.st === 'swingWind') { this.timer -= dt; this.swing = approach(this.swing, -0.9, dt * 2); if (this.timer <= 0) { this.st = 'swing'; this.timer = 0.7; } }
      else if (this.st === 'swing') {
        this.timer -= dt; this.swing = approach(this.swing, 1.6, dt * 7);
        if (this.timer <= 0) { this.st = 'walk'; this.timer = 2.4; this.swing = 0; for (let i = 0; i < 3; i++) G.add(new BrothBlob(this.bx - 150, this.by - 100, -120 - i * 90, -420 - i * 60)); Audio2.play('splash'); }
      }
      // ladle sweep hitbox (low sweep across the left)
      this.sweep = this.st === 'swing' ? { x: this.bx - 300, y: this.by - 120, w: 200, h: 120 } : null;
      if (this.sweep && p.state === 'play' && overlap(this.sweep, p)) p.hurt(G, this);
      // valves
      for (const v of this.valves) {
        if (v.broken) continue;
        const vp = this.valvePos(v), r = { x: vp.x - 20, y: vp.y - 20, w: 40, h: 40 };
        if (p.state === 'play' && overlap(r, p) && p.vy > 0 && p.prevBottom <= vp.y - 4) { this.breakValve(G, v, p); }
      }
      // body contact
      const body = { x: this.bx - 95, y: this.by - 240, w: 190, h: 150 };
      if (p.state === 'play' && overlap(body, p) && !(p.vy > 0 && p.prevBottom <= body.y + 10)) p.hurt(G, this);
      if (p.state === 'play' && overlap({ x: body.x, y: body.y - 4, w: body.w, h: 10 }, p) && p.vy > 0) { p.vy = -700; p.airJumps = 1; }
      // legs
      const legs = { x: this.bx - 70, y: this.by - 110, w: 140, h: 110 };
      if (p.state === 'play' && overlap(legs, p)) p.hurt(G, this);
    } else if (this.phase === 2) {
      this.timer -= dt; this.step += dt;
      if (this.st === 'closed') {
        if (this.timer <= 0) { this.st = 'open'; this.timer = 2.4; this.lidOpen = true; Audio2.play('steam'); G.hint('fin3', 'Крышка открылась! Прыгай с тостов прямо в котёл!'); }
        if (Math.random() < 0.025) { const a = rnd(-1, 1); G.add(new BrothBlob(this.bx, this.by - 260, a * 260 + (p.cx - this.bx) * 0.6, -520)); }
      } else if (this.st === 'open') {
        const lid = { x: this.bx - 80, y: this.by - 262, w: 160, h: 30 };
        if (p.state === 'play' && overlap(lid, p) && p.vy > 0) {
          this.coreHits++; this.flash = 0.6; Audio2.play('bossHit'); G.shake(0.35); p.vy = -900; p.airJumps = 1; p.cutOk = false;
          G.burst(this.bx, this.by - 250, 20, ['#ffb03a', '#ffe14d', '#9fd27e']); this.st = 'closed'; this.timer = 3.4; this.lidOpen = false; G.mercy(ar);
          if (this.coreHits >= 3) this.toPhase3(G);
        }
        if (this.timer <= 0) { this.st = 'closed'; this.timer = 3.6; this.lidOpen = false; }
      }
      const body = { x: this.bx - 95, y: this.by - 240, w: 190, h: 150 };
      if (p.state === 'play' && overlap(body, p) && !(p.vy > 0 && p.prevBottom <= body.y + 10)) { p.hurt(G, this); p.vx = sign(p.cx - this.bx) * 300; }
      if (p.state === 'play' && overlap({ x: body.x, y: body.y - 30, w: body.w, h: 34 }, p) && p.vy > 0 && !this.lidOpen) { p.vy = -760; p.airJumps = 1; }
    } else if (this.phase === 3) {
      // Baron hopping
      this.vy += PHYS.grav * dt;
      const v = this.vx; moveBody(this, G, dt); if (!this.onGround) this.vx = v;
      if (this.st === 'hop' && this.onGround) { this.vx = 0; this.st = 'rest'; this.timer = 1.0; G.dust(this.cx, this.bottom, 6); }
      else if (this.st === 'rest') { this.timer -= dt; if (this.timer <= 0) { this.st = 'hop'; const d = sign(p.cx - this.cx) || 1; this.vy = -720; this.vx = d * rnd(160, 300); this.face = d; if (Math.random() < 0.6) for (const s of [-1, 1]) G.add(new PeaShot(this.cx, this.cy, s)); } }
      else if (this.st === 'stun') { this.timer -= dt; if (this.timer <= 0) { this.st = 'hop'; this.vy = -600; this.vx = (sign(this.cx - p.cx) || 1) * 250; } }
      else if (this.st === 'dead') { this.timer -= dt; if (Math.random() < 0.6) G.burst(this.cx + rnd(-30, 30), this.cy, 3, SPRINKLES); if (this.timer <= 0) { this.alive = false; G.burst(this.cx, this.cy, 60, SPRINKLES); G.bossDefeated(this); } }
      if (this.x < ar.x0) { this.x = ar.x0; this.vx = Math.abs(this.vx); } if (this.x + this.w > ar.x1) { this.x = ar.x1 - this.w; this.vx = -Math.abs(this.vx); }
      this.harmful = this.st === 'hop'; this.stompable = this.st !== 'dead' && this.st !== 'stun';
    }
    if (this.phase !== 3) { this.x = this.bx - 95; this.y = this.by - 260; this.w = 190; this.h = 260; this.harmful = false; }
  }
  breakValve(G, v, p) {
    v.broken = true; this.flash = 0.5; Audio2.play('bossHit'); Audio2.play('steam'); G.shake(0.3);
    const vp = this.valvePos(v); G.burst(vp.x, vp.y, 18, ['#e8c040', '#ffffff', '#c8c8d0']);
    p.vy = -820; p.airJumps = 1; p.cutOk = false; G.mercy(this.ar);
    const left = this.valves.filter(x => !x.broken).length;
    G.add(new TextFx(vp.x, vp.y - 30, left ? `Осталось вентилей: ${left}` : 'Котёл перегрелся!', '#ffe14d'));
    if (!left) this.toPhase2(G);
  }
  onShot(G, s) {
    if (this.phase === 1) { for (const v of this.valves) { if (v.broken) continue; const vp = this.valvePos(v); if (Math.hypot(vp.x - s.cx, vp.y - s.cy) < 30) { v.hits = (v.hits || 0) + 1; this.flash = 0.1; if (v.hits >= 3) this.breakValve(G, v, G.player); else Audio2.play('clink'); return true; } } }
    Audio2.play('clink'); return true;
  }
  toPhase2(G) {
    this.phase = 2; this.st = 'closed'; this.timer = 2.5; this.bx = (this.ar.x0 + this.ar.x1) / 2; this.swing = 0;
    G.startFlood(this.ar); G.toast('Котёл перегрелся! Бульон заливает кухню!');
    G.hint('fin2', 'Бульон поднимается! Прыгай по тостам и жди, когда откроется крышка котла.');
  }
  toPhase3(G) {
    this.phase = 3; this.st = 'rest'; this.timer = 1.2; G.endFlood(); Audio2.play('thud'); G.shake(0.6);
    this.w = 56; this.h = 70; this.x = this.bx - 28; this.y = this.by - 300; this.vx = 0; this.vy = -200;
    G.burst(this.bx, this.by - 200, 40, ['#ffb03a', '#9a4a22', '#ffffff']);
    G.toast('Барон выскочил из котла!'); G.hint('fin4', 'Последний рывок! Три раза прыгни Барону на макушку!');
  }
  onStomp(G, p) {
    if (this.phase !== 3 || this.st === 'stun' || this.st === 'dead') return 'none';
    this.baronHp--; this.flash = 0.6; Audio2.play('bossHit'); G.shake(0.25); p.vy = -780; p.cutOk = false; p.airJumps = 1;
    if (this.baronHp <= 0) { this.st = 'dead'; this.timer = 2; this.harmful = false; Audio2.play('win'); G.clearBossShots(); }
    else { this.st = 'stun'; this.timer = 0.9; }
    return 'none';
  }
  onPickle(G) { Audio2.play('bump'); }
  kill() { }
  draw(g) {
    if (this.st === 'wait') return;
    g.save(); if (this.flash > 0) g.globalAlpha = 0.6 + Math.sin(this.t * 50) * 0.4;
    if (this.phase < 3) drawCauldronBot(g, this.bx, this.by, { t: this.t, step: this.step, swing: this.swing, valves: this.phase === 1 ? this.valves : [], lidOpen: this.lidOpen, baron: true });
    else {
      if (this.st !== 'dead' || this.timer > 1) { drawCauldronBot(g, (this.ar.x0 + this.ar.x1) / 2, this.ar.floor + 40, { t: 0, valves: [], baron: false }); }
      const sq = this.st === 'rest' ? 0.1 : this.st === 'stun' ? -0.15 : 0;
      g.save(); g.translate(this.cx, this.bottom); g.scale((this.face || 1) * (1 + sq), 1 - sq); drawBaron(g, 0, 0, { t: this.t, s: 0.9 }); g.restore();
      if (this.st === 'stun') for (let i = 0; i < 3; i++) { const a = this.t * 5 + i * 2.1; star5(g, this.cx + Math.cos(a) * 26, this.y - 6 + Math.sin(a) * 5, 6, 2.6); fs(g, '#ffe14d', '#b88a00', 1); }
    }
    g.restore();
  }
}
// ---------- bonus ----------
class Booster extends Ent {
  constructor(x, y, w, dir) { super(x, y - 10, w || 80, 12); this.dir = dir || 1; }
  update(G, dt) {
    this.t += dt; const p = G.player;
    if (p.state === 'play' && overlap(this, p) && p.onGround) {
      if (!(p.boostT > 0.9)) Audio2.play('boost');
      p.boostT = 1.3; p.vx = this.dir * 660; p.face = this.dir;
      G.hint('boost', 'Радужный ускоритель! Держись дорожки!');
    }
  }
  draw(g) { drawBooster(g, this.x, this.y + 10, this.w, { t: this.t, dir: this.dir }); }
}
class Spectator extends Ent {
  constructor(x, y, kind) { super(x - 16, y - 50, 32, 50); this.kind = kind; this.fx = x; this.fy = y; this.ph = rnd(0, 6); this.col = pick(['#ff5a5a', '#6ad04a', '#ffb03a', '#5ab0ff']); }
  update(G, dt) { this.t += dt; this.cheer = Math.abs(G.player.cx - this.fx) < 260; }
  draw(g) { if (this.kind === 'gummy') drawGummy(g, this.fx, this.fy - 26 - (this.cheer ? Math.abs(Math.sin(this.t * 7 + this.ph)) * 10 : 0), { col: this.col, t: this.t, ph: this.ph, s: 1.1 }); else drawCookieMan(g, this.fx, this.fy, { t: this.t, cheer: this.cheer, ph: this.ph }); }
}
class Finish extends Ent {
  constructor(x, y) { super(x - 30, y - 140, 60, 140); this.fx = x; this.fy = y; this.done = false; }
  update(G, dt) { this.t += dt; const p = G.player; if (!this.done && p.state === 'play' && p.cx > this.fx - 10) { this.done = true; G.bonusFinish(this); } }
  draw(g) {
    rrect(g, this.fx - 4, this.fy - 140, 8, 140, 4); fs(g, '#fff', '#c0a0b0', 1.5);
    g.save(); g.translate(this.fx + 4, this.fy - 138);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { g.fillStyle = (i + j) % 2 ? '#2a1a2a' : '#ffffff'; g.fillRect(i * 14, j * 12 + Math.sin(this.t * 5 + i) * 2, 14, 12); }
    g.restore();
    drawCookieGirl(g, this.fx + 60, this.fy, { t: this.t, s: 0.9 });
  }
}
