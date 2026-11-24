'use strict';
// ================= w2/entities2.js : objects, enemies and bosses of World 2 levels 2-4 … 2-9 =================

// ---------- shared: rescue a relative, talk to someone ----------
// a cage (or a big jar) with one of Pickle's relatives; Pickle's crunch, a pound or a flipper dash frees them
class RescueCage extends Ent {
  constructor(x, y, o) { super(x - 44, y - 76, 88, 76); this.fx = x; this.fy = y; this.o = o; this.layer = 0; this.crunchable = true; this.poundable = true; this.broken = false; this.nagT = 0; this.told = false; }
  update(G, dt) {
    this.t += dt; this.nagT -= dt;
    const p = G.player;
    if (!this.broken && !this.told && p.state === 'play' && Math.abs(p.cx - this.fx) < 120 && Math.abs(p.bottom - this.fy) < 80) { this.told = true; G.pickle.speak(this.o.call || 'Там кто-то из наших! Разбей клетку Хрустом!', 4, true); }
  }
  onPound(G, p) { this.onCrunch(G, p); }
  onCrunch(G) {
    if (this.broken) return;
    this.broken = true; this.crunchable = this.poundable = false; Audio2.play('break'); G.shake(0.25);
    G.burst(this.fx, this.fy - 40, 24, ['#8a5a2a', '#c8904a', '#e8f8ff', '#ffffff']);
    const rel = G.add(new FreedRelative(this.fx, this.fy, this.o.who));
    G.later(0.6, () => G.dialog(this.o.lines, () => {
      Save.data.family = Object.assign({}, Save.data.family, { [this.o.who]: true }); Save.save();
      rel.go = true; G.relFree = true; if (this.o.after) this.o.after(G);
    }));
  }
  draw(g) {
    const t = this.t, x = this.fx, y = this.fy;
    if (this.o.jar) { // a giant pickle jar
      if (this.broken) { for (let i = 0; i < 6; i++) { g.save(); g.translate(x - 30 + i * 12, y - 4); g.rotate(i * 1.1); g.beginPath(); g.moveTo(0, 0); g.lineTo(9, -3); g.lineTo(4, 6); g.closePath(); fs(g, 'rgba(220,245,255,0.8)', 'rgba(120,170,190,0.8)', 1); g.restore(); } return; }
      rrect(g, x - 40, y - 86, 80, 86, 16); fs(g, 'rgba(200,235,240,0.35)');
      g.save(); rrect(g, x - 40, y - 86, 80, 86, 16); g.clip(); g.fillStyle = 'rgba(190,220,120,0.4)'; g.fillRect(x - 40, y - 60 + Math.sin(t * 2) * 2, 80, 60); g.restore();
      drawW2Folk(g, this.o.who, x, y - 6, { t, wave: true });
      rrect(g, x - 40, y - 86, 80, 86, 16); g.strokeStyle = 'rgba(120,170,190,0.9)'; g.lineWidth = 2.5; g.stroke();
      rrect(g, x - 36, y - 96, 72, 12, 4); fs(g, '#c8a040', '#6a4a10', 1.5);
      return;
    }
    if (this.broken) { drawWoodCage(g, x, y, { broken: true }); return; }
    drawW2Folk(g, this.o.who, x, y - 6, { t, wave: true });
    drawWoodCage(g, x, y, { t, inside: false });
  }
}
function drawW2Folk(g, who, x, y, o) {
  if (who === 'zelenets') drawZelenets(g, x, y, o); else if (who === 'kabachok') drawKabachok(g, x, y, o); else if (who === 'grandma') drawGrandma(g, x, y, o);
  else if (who === 'banniMom') drawBananaFolk(g, x, y, Object.assign({ kind: 'mom' }, o)); else if (who === 'banniDad') drawBananaFolk(g, x, y, Object.assign({ kind: 'dad' }, o));
  else drawPupyrka(g, x, y, o);
}
class FreedRelative extends Ent {
  constructor(x, y, who) { super(x - 12, y - 50, 24, 50); this.fx = x; this.fy = y; this.who = who; this.layer = 0; this.go = false; }
  update(G, dt) { this.t += dt; if (this.go) { this.fx += 230 * dt; if (this.t > 30 || this.fx > G.level.W * T) this.alive = false; } }
  draw(g) { drawW2Folk(g, this.who, this.fx, this.fy, { t: this.t, happy: true }); }
}
// someone to talk to: a dialog the first time the hero comes close
class NpcTalk extends Ent {
  constructor(x, y, who, lines, after, o) { super(x - 20, y - 70, 40, 70); this.fx = x; this.fy = y; this.who = who; this.lines = lines; this.after = after; this.o = o || {}; this.met = false; this.layer = 0; this.face = -1; }
  update(G, dt) {
    this.t += dt; const p = G.player; this.face = sign(p.cx - this.fx) || this.face;
    if (!this.met && p.state === 'play' && Math.abs(p.cx - this.fx) < 80 && Math.abs(p.bottom - this.fy) < 90) { this.met = true; G.dialog(this.lines, () => { if (this.after) this.after(G, this); }); }
  }
  draw(g) {
    drawW2Folk(g, this.who, this.fx, this.fy, { t: this.t, face: this.face, wave: !this.met, happy: this.met && this.o.happy });
    if (!this.met) { g.save(); g.font = '900 22px Nunito, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#ffe14d'; g.strokeStyle = '#6a3214'; g.lineWidth = 4; const y = this.fy - 96 + Math.sin(this.t * 4) * 4; g.strokeText('!', this.fx, y); g.fillText('!', this.fx, y); g.restore(); }
  }
}
// little cucumbers in jars can also be freed by a stomp from above (Banni's level has no crunch)
(function () {
  const up = JarKid.prototype.update;
  JarKid.prototype.update = function (G, dt) {
    up.call(this, G, dt);
    const p = G.player;
    if (!this.open && p.state === 'play' && p.vy > 0 && overlap(this, p) && p.prevBottom <= this.y + 14) { this.free(G); p.stompBounce(); }
  };
})();

// ---------- 2-4 Mango falls ----------
class HotPepper extends Enemy { // jalapeño: spits fireballs in an arc at the hero
  constructor(x, y) { super(x - 12, y - 46, 24, 46); this.timer = rnd(0.8, 2); this.charge = 0; }
  update(G, dt) {
    if (!this.pre(G, dt)) return;
    const p = G.player; this.face = sign(p.cx - this.cx) || this.face;
    this.vy += PHYS.grav * dt; this.vx = 0; moveBody(this, G, dt);
    this.timer -= dt; this.charge = clamp(1 - this.timer / 0.6, 0, 1);
    if (this.timer <= 0) {
      this.timer = 2.4;
      if (Math.abs(p.cx - this.cx) < 520 && Math.abs(p.cy - this.cy) < 300) { const d = p.cx - this.cx, tt = clamp(Math.abs(d) / 260, 0.6, 1.6); G.add(new Fireball(this.cx + this.face * 12, this.y + 20, d / tt, (p.cy - this.y - 20) / tt - 0.5 * 700 * tt)); Audio2.play('throw'); }
    }
  }
  draw(g) { drawPepper(g, this.cx, this.bottom, { face: this.face, charge: this.charge }); this.drawIce(g); }
}
class Fireball extends Enemy {
  constructor(x, y, vx, vy) { super(x - 8, y - 8, 16, 16); this.vx = vx; this.vy = vy; this.life = 3; this.active = true; this.stompable = false; this.freezable = false; this.bossShot = true; }
  update(G, dt) { this.t += dt; this.life -= dt; this.vy += 700 * dt; this.x += this.vx * dt; this.y += this.vy * dt; if (this.life <= 0 || rectSolid(G, this.cx - 3, this.cy - 3, 6, 6)) { this.alive = false; G.burst(this.cx, this.cy, 5, ['#ffa03a', '#fff6a0']); } }
  kill(G) { this.alive = false; G.burst(this.cx, this.cy, 5, ['#ffa03a']); }
  draw(g) { drawFireball(g, this.cx, this.cy, this.t); }
}
class CabbageGull extends Bat { draw(g) { drawGull(g, this.cx, this.cy, { t: this.t, face: this.face }); this.drawIce(g); } }
class MangoSlice extends Ent { // a slice floating down the waterfall: stand on it, but it carries you down
  constructor(x, y, w, vy, yEnd) { super(x, y, w, 16); this.solid = 'top'; this.vyp = vy; this.yEnd = yEnd; this.dx = 0; this.dy = 0; this.groundT = TL.SOLID; }
  update(G, dt) { this.t += dt; const ny = this.y + this.vyp * dt; this.dy = ny - this.y; this.dx = 0; this.y = ny; if (this.y > this.yEnd) { this.alive = false; this.solid = null; } }
  draw(g) { drawMangoSlice(g, this.x, this.y, this.w); }
}
class SliceSpawner extends Ent {
  constructor(x, y0, y1, period, w, speed) { super(x, y0, 2, 2); this.y0 = y0; this.y1 = y1; this.period = period || 2.2; this.sw = w || 80; this.speed = speed || 70; this.timer = 0; this.started = false; }
  update(G, dt) {
    if (!this.started) { this.started = true; for (let y = this.y0; y < this.y1; y += this.speed * this.period) G.add(new MangoSlice(this.x, y, this.sw, this.speed, this.y1)); }
    this.timer -= dt; if (this.timer <= 0) { this.timer = this.period; G.add(new MangoSlice(this.x, this.y0, this.sw, this.speed, this.y1)); }
  }
}
class FallZone extends Ent { // a waterfall: pushes anyone in the air down
  constructor(x, y, w, h) { super(x, y, w, h); this.layer = 0; }
  update(G, dt) { this.t += dt; const p = G.player; if (p.state === 'play' && !p.onGround && !p.wet && overlap(this, p)) { p.vy = Math.min(p.vy + 1300 * dt, 520); if (Math.random() < 0.3) G.parts.push({ k: 'dust', x: p.cx + rnd(-10, 10), y: p.y, vx: 0, vy: 80, life: 0.4, max: 0.4, c: 'rgba(255,230,160,0.8)', s: 3, g: 0 }); G.hint('fall', 'Водопад сбивает вниз! Проскакивай между струями.'); } }
  draw(g, G) { drawFallStream(g, this.x, this.y, this.w, this.h, G.time); }
}

// ---------- 2-5 Volcano of hot jam ----------
class RisingJam extends Ent { // starts rising when the hero passes trigX; resets when the hero dies
  constructor(x0, x1, y0, yTop, speed, trigX) { super(x0, y0, x1 - x0, 4000); this.zone = 'jam'; this.layer = 4; this.y0 = y0; this.yTop = yTop; this.speed = speed; this.trigX = trigX; this.st = 'wait'; }
  liquid(x, y) { return x > this.x && x < this.x + this.w && y > this.y ? TL.BROTH : 0; }
  update(G, dt) {
    this.t += dt; const p = G.player;
    if (p.state === 'dead' || p.state === 'gone') { this.st = 'wait'; this.y = this.y0; return; }
    if (this.st === 'wait' && p.state === 'play' && p.cx > this.trigX && p.bottom < this.y0 + 60) { this.st = 'rise'; Audio2.play('roar'); G.shake(0.4); G.pickle.speak('Вулкан проснулся! Джем поднимается — бежим наверх!', 4, true); }
    if (this.st === 'rise') { this.y = Math.max(this.yTop, this.y - this.speed * dt); if (Math.random() < 0.3) G.parts.push({ k: 'bit', x: this.x + rnd(0, this.w), y: this.y, vx: rnd(-30, 30), vy: rnd(-260, -120), life: 0.8, max: 0.8, c: '#ff5a5a', s: 3, r: 0, g: 600 }); }
  }
  draw(g, G) {
    const t = G.time, x0 = Math.max(this.x, G.cam.x - 20), x1 = Math.min(this.x + this.w, G.cam.x + G.viewW + 20), bot = G.cam.y + VIEW_H + 40;
    if (this.y > bot) return;
    g.fillStyle = 'rgba(210,30,50,0.95)'; g.beginPath(); g.moveTo(x0, bot);
    for (let x = x0; x <= x1; x += 16) g.lineTo(x, this.y + Math.sin(x * 0.04 + t * 3) * 5); g.lineTo(x1, bot); g.closePath(); g.fill();
    g.strokeStyle = '#ff9a9a'; g.lineWidth = 3; g.beginPath(); for (let x = x0; x <= x1; x += 16) { const y = this.y + Math.sin(x * 0.04 + t * 3) * 5; x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
  }
}
class GarlicArcher extends Celery { draw(g) { drawGarlicArcher(g, this.cx, this.bottom, { face: this.face, draw: this.drawK }); this.drawIce(g); } }
class JamLeaper extends Enemy { // a radish that leaps out of a jam pool
  constructor(x, surf, o) { o = o || {}; super(x - 14, surf, 28, 30); this.home = x; this.surf = surf; this.wait = o.delay !== undefined ? o.delay : rnd(0.5, 2); this.every = o.every || 2.4; this.power = o.power || 820; this.st = 'hide'; this.harmful = false; this.stompable = false; this.freezable = false; }
  update(G, dt) {
    if (!this.pre(G, dt)) return;
    if (this.st === 'hide') { this.x = this.home - 14; this.y = this.surf + 20; this.harmful = this.stompable = false; this.wait -= dt; if (this.wait <= 0 && Math.abs(G.player.cx - this.home) < 600) { this.st = 'leap'; this.vy = -this.power; Audio2.play('splash'); G.burst(this.cx, this.surf, 8, ['#ff5a5a', '#ffb0b0']); } return; }
    this.harmful = this.stompable = true; this.vy += 1500 * dt; this.y += this.vy * dt;
    if (this.vy > 0 && this.y > this.surf + 10) { this.st = 'hide'; this.wait = this.every; G.burst(this.cx, this.surf, 6, ['#ff5a5a']); }
  }
  draw(g) { if (this.st === 'hide') return; drawLavaRadish(g, this.cx, this.cy, { rot: this.vy * 0.0008 }); }
}
class JamDrop extends Enemy { // falling drop of hot jam (the bosun's pipe calls them)
  constructor(x, y) { super(x - 8, y, 16, 20); this.active = true; this.stompable = false; this.freezable = false; this.bossShot = true; }
  update(G, dt) { this.t += dt; this.vy = Math.min(this.vy + 1200 * dt, 700); this.y += this.vy * dt; if (rectSolid(G, this.cx - 3, this.bottom - 2, 6, 4) || this.y > G.level.H * T) { this.alive = false; G.burst(this.cx, this.bottom, 6, ['#ff5a5a', '#ffb0b0']); Audio2.play('drip'); } }
  kill(G) { this.alive = false; }
  draw(g) { g.beginPath(); g.moveTo(this.cx, this.y); g.quadraticCurveTo(this.cx + 9, this.y + 14, this.cx, this.bottom); g.quadraticCurveTo(this.cx - 9, this.y + 14, this.cx, this.y); fs(g, '#e2363c', '#7a1a14', 1.5); }
}
class Horseradish extends Enemy { // boss: Bosun Horseradish
  constructor(ar) { super(0, 0, 70, 130); this.ar = ar; this.boss = true; this.active = true; this.name = 'Боцман Хрен'; this.barColor = '#e8d8b0'; this.freezable = false; this.slideable = false; this.starKill = false; this.reset(); }
  reset() { this.hp = 3; this.maxHp = 3; this.st = 'wait'; this.alive = true; this.fx = this.ar.x1 - 160; this.fy = this.ar.floor - 700; this.vx = 0; this.vy = 0; this.hops = 0; this.flash = 0; this.face = -1; this.sync(); }
  sync() { this.x = this.fx - 35; this.y = this.fy - 130; }
  begin() { this.st = 'enter'; }
  update(G, dt) {
    this.t += dt; this.flash = Math.max(0, this.flash - dt);
    const a = this.ar, p = G.player;
    switch (this.st) {
      case 'wait': break;
      case 'enter': this.vy += 2100 * dt; this.fy += this.vy * dt; if (this.fy >= a.floor) { this.fy = a.floor; this.vy = 0; this.land(G); this.st = 'idle'; this.timer = 1.2; Audio2.play('roar'); } break;
      case 'idle': this.face = sign(p.cx - this.fx) || this.face; this.timer -= dt; if (this.timer <= 0) { if (this.hops >= 2) { this.st = 'pipe'; this.timer = 2.6; this.hops = 0; this.dropT = 0; } else this.hop(G); } break;
      case 'hop':
        this.vy += 2100 * dt; this.fx += this.vx * dt; this.fy += this.vy * dt; this.fx = clamp(this.fx, a.x0 + 40, a.x1 - 40);
        if (this.fy >= a.floor && this.vy > 0) { this.fy = a.floor; this.vy = 0; this.land(G); this.hops++; this.st = 'idle'; this.timer = 0.7; }
        break;
      case 'pipe':
        this.timer -= dt; this.dropT -= dt;
        if (this.dropT <= 0) { this.dropT = this.hp === 1 ? 0.22 : 0.32; const x = rnd(a.x0 + 30, a.x1 - 30); if (Math.abs(x - this.fx) > 60) G.add(new JamDrop(x, a.top + 10)); }
        if (this.timer <= 0) { this.st = 'idle'; this.timer = 0.5; }
        break;
      case 'hurt': this.timer -= dt; if (this.timer <= 0) { if (this.hp <= 0) { this.st = 'dead'; this.timer = 1.6; G.clearBossShots(); Audio2.play('win'); } else { this.st = 'idle'; this.timer = 0.6; } } break;
      case 'dead': this.timer -= dt; if (Math.random() < 0.5) G.burst(this.fx + rnd(-30, 30), this.fy - rnd(0, 120), 3, ['#f2e6cc', '#4cb84a']); if (this.timer <= 0) { this.alive = false; G.burst(this.fx, this.fy - 60, 40, ['#f2e6cc', '#4cb84a', '#ffffff']); G.bossDefeated(this); } break;
    }
    this.harmful = this.st === 'hop' || this.st === 'enter' || this.st === 'idle' || this.st === 'pipe';
    this.sync();
  }
  hop(G) { const p = G.player, tx = clamp(p.cx, this.ar.x0 + 60, this.ar.x1 - 60); this.st = 'hop'; this.vy = -980; this.vx = (tx - this.fx) / 0.93; this.face = sign(this.vx) || this.face; Audio2.play('jump'); }
  land(G) { G.shake(0.35); Audio2.play('thud'); G.dust(this.fx, this.ar.floor, 10); G.add(new Shockwave(this.fx - 40, this.ar.floor, -1)).bossShot = true; G.add(new Shockwave(this.fx + 40, this.ar.floor, 1)).bossShot = true; }
  onStomp(G, p) {
    if (this.st === 'pipe') { this.hp--; this.flash = 0.8; this.st = 'hurt'; this.timer = 0.9; Audio2.play('bossHit'); G.shake(0.3); G.mercy(this.ar); p.vy = -780; p.cutOk = false; p.vx = (p.cx < this.fx ? -1 : 1) * 260; return 'none'; }
    if (this.harmful) { Audio2.play('bump'); G.hint('hren2', 'Пока он скачет, его не возьмёшь! Жди, когда заиграет на дудке.'); return 'bounce'; }
    return 'none';
  }
  onCrunch(G) { if (this.st === 'pipe') { this.hp--; this.flash = 0.8; this.st = 'hurt'; this.timer = 0.9; Audio2.play('bossHit'); G.mercy(this.ar); } }
  onShot(G) { Audio2.play('bump'); return true; }
  onPickle() { Audio2.play('bump'); }
  kill() { }
  draw(g) {
    if (this.st === 'wait') return;
    const k = this.st === 'dead' ? Math.max(0.2, this.timer / 1.6) : 1;
    g.save(); g.translate(this.fx, this.fy); g.scale(k, k);
    drawHorseradish(g, 0, 0, { t: this.t, face: this.face, flash: this.flash > 0 && Math.floor(this.flash * 12) % 2 === 0, playing: this.st === 'pipe', dizzy: this.st === 'hurt', sq: this.st === 'idle' && this.timer < 0.2, angry: this.hp === 1 });
    g.restore();
  }
}

// ---------- 2-6 Lemonade sea: the boat ride ----------
class RideBoat extends Ent { // board it to start the autoscrolling sea battle
  constructor(x, surf) { super(x - 60, surf - 30, 120, 40); this.layer = 3; }
  update(G, dt) { this.t += dt; const p = G.player; if (p.state === 'play' && overlap({ x: this.x - 10, y: this.y - 50, w: this.w + 20, h: this.h + 60 }, p)) { this.alive = false; p.enterBalloon(G, this); G.startRide(); G.pickle.speak(`Полный вперёд! ${Input.label('move')} — рулить, ${Input.label('jump')} — подпрыгнуть на волне, ${Input.label('fire')} — кокосовая пушка.`, 6, true); } }
  draw(g) { drawBoat(g, this.cx, this.bottom, { t: this.t, sail: true }); }
}
Player.prototype.updateBoatRide = function (G, dt) {
  const R = G.def.boatRide, ax = (Input.held('right') ? 1 : 0) - (Input.held('left') ? 1 : 0);
  this.vx = approach(this.vx, ax * 250, 900 * dt); this.x += this.vx * dt;
  const cam = G.cam; this.x = clamp(this.x, cam.x + 24, cam.x + G.viewW * 0.62 - this.w);
  this.hopY = this.hopY || 0; this.hopVy = this.hopVy || 0;
  if (Input.pressed('jump') && this.hopY === 0) { this.hopVy = -640; Audio2.play('jump'); G.burst(this.cx, R.surface, 8, ['#ffffff', '#fff6a0']); }
  if (this.hopY < 0 || this.hopVy < 0) { this.hopVy += 1700 * dt; this.hopY = Math.min(0, this.hopY + this.hopVy * dt); if (this.hopY === 0) { this.hopVy = 0; Audio2.play('splash'); G.burst(this.cx, R.surface, 8, ['#ffffff', '#fff6a0']); } }
  this.prevBottom = this.bottom;
  this.y = R.surface + 10 - this.h + this.hopY + Math.sin(this.t * 2.2) * 3;
  if ((Input.pressed('fire') || Input.pressed('pickle')) && this.fireCd <= 0) { G.add(new CannonPit(this.x + this.w + 18, this.y + 22)); this.fireCd = 0.22; Audio2.play('cannon'); this.shootT = 0.15; }
  this.shootT -= dt;
  if (Math.random() < 0.3) G.parts.push({ k: 'dust', x: this.x + 4, y: R.surface + 4, vx: -80, vy: rnd(-20, 0), life: 0.6, max: 0.6, c: 'rgba(255,255,255,0.8)', s: rnd(3, 6), g: 0 });
};
(function () {
  const ub = Player.prototype.updateBalloon;
  Player.prototype.updateBalloon = function (G, dt) { if (G.def.boatRide) return this.updateBoatRide(G, dt); return ub.call(this, G, dt); };
  const dr = drawRide;
  drawRide = function (g, p, G) { if (G && G.def && G.def.boatRide) return drawBoatRide(g, p, G); return dr(g, p, G); };
})();
class Sprat extends Gummy { draw(g) { drawAnchovy(g, this.cx, this.cy, { t: this.t, face: -1, ang: Math.sin(this.t * 1.6 + this.ph) * 0.4 }); } }
class OliveShot extends Enemy {
  constructor(x, y, vx, vy) { super(x - 9, y - 9, 18, 18); this.vx = vx; this.vy = vy; this.life = 4; this.active = true; this.stompable = false; this.freezable = false; this.bossShot = true; }
  update(G, dt) { this.t += dt; this.life -= dt; this.vy += 300 * dt; this.x += this.vx * dt; this.y += this.vy * dt; if (this.life <= 0) this.alive = false; }
  kill(G) { this.alive = false; G.burst(this.cx, this.cy, 5, ['#7a9a3a', '#e2363c']); Audio2.play('pop'); }
  draw(g) { drawOlive(g, this.cx, this.bottom, { rot: this.t * 6 }); }
}
class JarBoat extends Enemy { // a pirate in a floating jar firing olives
  constructor(x, surf) { super(x - 26, surf - 34, 52, 40); this.surf = surf; this.timer = rnd(1, 2.5); this.stompable = false; this.freezable = false; }
  update(G, dt) {
    if (!this.pre(G, dt)) return;
    this.y = this.surf - 34 + Math.sin(this.t * 2) * 3;
    this.timer -= dt; const p = G.player;
    if (this.timer <= 0 && this.cx > G.cam.x + 120 && this.cx < G.cam.x + G.viewW) { this.timer = 2.4; const d = p.cx - this.cx; G.add(new OliveShot(this.x, this.y - 10, Math.min(-120, d / 1.2), -320)); Audio2.play('pea'); }
  }
  draw(g) { drawJarBoat(g, this.cx, this.bottom, { t: this.t }); }
}
class FloatJar extends Enemy { // a little cucumber in a jar bobbing on the waves: shoot it open
  constructor(x, surf) { super(x - 18, surf - 40, 36, 44); this.surf = surf; this.harmful = false; this.stompable = false; this.freezable = false; }
  update(G, dt) { this.t += dt; this.y = this.surf - 40 + Math.sin(this.t * 2.4) * 4; }
  kill(G) { if (!this.alive) return; this.alive = false; G.stats.sheep++; Audio2.play('sheep'); Audio2.play('break'); G.burst(this.cx, this.cy, 16, ['#e8f8ff', '#9cd47a', '#ffffff']); G.add(new KidFx(this.cx, this.bottom, 1)); G.add(new TextFx(this.cx, this.y - 30, `Огурчик спасён! ${G.stats.sheep}/${G.def.sheep}`, '#d8ffb0')); }
  draw(g) { drawJarKid(g, this.cx, this.bottom, { t: this.t }); }
}
class OliveBomb extends GarlicBomb { draw(g) { drawOlive(g, this.cx, this.bottom, { rot: this.t * 5 }); if (this.back) { g.save(); g.globalAlpha = 0.6; circ(g, this.cx, this.cy, 14); g.strokeStyle = '#fff6a0'; g.lineWidth = 2; g.stroke(); g.restore(); } } }
class Frigate extends GarlicAirship { // «Кислая Селёдка»
  constructor(ar, surf) { super(ar); this.name = 'Фрегат «Кислая Селёдка»'; this.Bomb = OliveBomb; this.noStink = true; this.surf = surf; this.barColor = '#8aa0a8'; }
  update(G, dt) {
    super.update(G, dt);
    if (this.st === 'fight' || this.st === 'enter') { this.gy = this.surf - 30 + Math.sin(this.t * 1.4) * 8; this.sync(); }
    if (this.st === 'fight' && !this.told) { this.told = true; G.hint('frigate', `Фрегат плюётся оливками! Стреляй (${Input.label('fire')}) по летящим оливкам — отбитые полетят обратно и пробьют борт.`); }
  }
  draw(g) {
    if (this.st === 'wait') return;
    g.save(); g.translate(this.gx, this.gy + 40); if (this.st === 'dead') g.rotate((this.tilt || 0) * 0.5);
    drawFrigate(g, 0, 0, { t: this.t, flash: this.flash > 0 && Math.floor(this.flash * 12) % 2 === 0, open: this.bombT < 0.4 });
    g.restore();
  }
}

// ---------- 2-7 Banana homeland ----------
class SaltSpider extends Enemy { // hangs on a thread, goes up and down
  constructor(x, yTop, len, o) { super(x - 14, yTop + len * 0.5, 28, 26); this.ax = x; this.yTop = yTop; this.len = len; this.ph = (o && o.ph) || rnd(0, 6); }
  update(G, dt) { if (!this.pre(G, dt)) return; const k = (Math.sin(this.t * 1.3 + this.ph) + 1) / 2; this.x = this.ax - 14; this.y = this.yTop + 30 + k * this.len; }
  draw(g) { drawSpider(g, this.cx, this.cy, { t: this.t, threadY: this.yTop }); this.drawIce(g); }
}
class PirateGherkin extends Enemy { // a gherkin pirate: patrols, lunges at a hero in front of it
  constructor(x, y, o) { super(x - 11, y - 44, 22, 44); this.speed = (o && o.speed) || 60; this.vx = -this.speed; this.lunge = 0; }
  update(G, dt) {
    if (!this.pre(G, dt)) return;
    const p = G.player; this.lunge -= dt;
    if (this.lunge <= -1 && this.onGround && Math.abs(p.cy - this.cy) < 40 && Math.abs(p.cx - this.cx) < 180 && sign(p.cx - this.cx) === sign(this.vx)) { this.lunge = 0.5; Audio2.play('throw'); }
    this.walkerMove(G, dt, this.lunge > 0 ? 220 : this.speed);
  }
  draw(g) { drawPirateGherkin(g, this.cx, this.bottom, { t: this.t * (this.frozen > 0 ? 0 : 1), face: this.face }); this.drawIce(g); }
}
class PalmVine extends Vine {
  draw(g) {
    const ex = this.ax + Math.sin(this.ang) * this.len, ey = this.ay + Math.cos(this.ang) * this.len, sag = this.holder ? 0 : Math.sin(this.t * 2 + this.ph) * 6;
    g.save(); g.lineCap = 'round'; g.beginPath(); g.moveTo(this.ax, this.ay); g.quadraticCurveTo(this.ax + (ex - this.ax) * 0.5 + sag, this.ay + (ey - this.ay) * 0.5, ex, ey);
    g.strokeStyle = '#1e4a14'; g.lineWidth = 8; g.stroke(); g.strokeStyle = '#4a9a2a'; g.lineWidth = 5; g.stroke();
    for (let k = 1; k < 6; k++) { const u = k / 6, x = this.ax + (ex - this.ax) * u + sag * 2 * u * (1 - u), y = this.ay + (ey - this.ay) * u; ell(g, x + (k % 2 ? 6 : -6), y, 7, 3.5, k % 2 ? 0.5 : -0.5); fs(g, '#6ac04a', '#2e6a1a', 1); }
    circ(g, this.ax, this.ay, 6); fs(g, '#4a9a2a', '#1e4a14', 1.5);
    g.restore();
  }
}

// ---------- 2-8 Kiwi caves ----------
class KiwiLamp extends Ent { constructor(x, y) { super(x - 20, y - 20, 40, 40); this.layer = 0; this.light = 160; } update(G, dt) { this.t += dt; } draw(g, G) { drawKiwiLamp(g, this.cx, this.cy, G.time); } }
class EvilPickle extends Enemy { // the marinated doubles: walk, then charge when they see a hero on their level
  constructor(x, y) { super(x - 11, y - 50, 22, 50); this.vx = -50; this.charge = 0; }
  update(G, dt) {
    if (!this.pre(G, dt)) return;
    const p = G.player; this.charge -= dt;
    if (this.charge <= -1.2 && Math.abs(p.cy - this.cy) < 40 && Math.abs(p.cx - this.cx) < 320) { this.charge = 0.9; this.vx = sign(p.cx - this.cx) * 50; Audio2.play('ghost'); }
    this.walkerMove(G, dt, this.charge > 0 ? 230 : 50);
  }
  draw(g) { drawEvilPickle(g, this.cx, this.bottom, { t: this.t, face: this.face }); this.drawIce(g); }
}
class CaperFly extends Bat { draw(g) { drawCaperFly(g, this.cx, this.cy, { t: this.t, face: this.face }); this.drawIce(g); } }
class DarkPickle extends Enemy { // boss: dashes across the arena; dizzy after hitting a wall
  constructor(ar) { super(0, 0, 44, 98); this.ar = ar; this.boss = true; this.active = true; this.name = 'Тёмный Пикль'; this.barColor = '#3a7a2a'; this.freezable = false; this.slideable = false; this.starKill = false; this.reset(); }
  reset() { this.hp = 3; this.maxHp = 3; this.st = 'wait'; this.alive = true; this.fx = this.ar.x1 - 140; this.fy = this.ar.floor - 600; this.vy = 0; this.flash = 0; this.face = -1; this.light = 110; this.sync(); }
  sync() { this.x = this.fx - 22; this.y = this.fy - 98; }
  begin() { this.st = 'enter'; }
  update(G, dt) {
    this.t += dt; this.flash = Math.max(0, this.flash - dt);
    const a = this.ar, p = G.player, speed = [0, 640, 560, 480][this.hp];
    switch (this.st) {
      case 'wait': break;
      case 'enter': this.vy += 2100 * dt; this.fy += this.vy * dt; if (this.fy >= a.floor) { this.fy = a.floor; this.st = 'taunt'; this.timer = 1.2; G.shake(0.4); Audio2.play('thud'); Audio2.play('roar'); } break;
      case 'taunt': this.face = sign(p.cx - this.fx) || this.face; this.timer -= dt; if (this.timer <= 0) { this.st = 'dash'; this.dir = this.face; Audio2.play('throw'); } break;
      case 'dash':
        this.fx += this.dir * speed * dt; if (Math.random() < 0.5) G.dust(this.fx - this.dir * 20, a.floor, 1);
        if (this.fx < a.x0 + 30 || this.fx > a.x1 - 30) { this.fx = clamp(this.fx, a.x0 + 30, a.x1 - 30); this.st = 'dizzy'; this.timer = [0, 1.9, 2.1, 2.4][this.hp]; G.shake(0.4); Audio2.play('thud'); G.hint('dark2', 'Тёмный Пикль врезался в стену! Прыгай ему на голову!'); }
        break;
      case 'dizzy': this.timer -= dt; if (this.timer <= 0) { this.st = 'taunt'; this.timer = 0.5; } break;
      case 'hit': this.timer -= dt; if (this.timer <= 0) { if (this.hp <= 0) { this.st = 'dead'; this.timer = 1.6; Audio2.play('win'); } else { this.st = 'taunt'; this.timer = 0.7; } } break;
      case 'dead': this.timer -= dt; if (Math.random() < 0.5) G.burst(this.fx + rnd(-20, 20), this.fy - rnd(0, 90), 3, ['#24481a', '#9cd47a']); if (this.timer <= 0) { this.alive = false; G.burst(this.fx, this.fy - 50, 40, ['#24481a', '#9cd47a', '#ffffff']); G.bossDefeated(this); } break;
    }
    this.harmful = this.st === 'dash' || this.st === 'enter' || (this.st === 'taunt' && this.timer < 0.3);
    this.sync();
  }
  hurtBy(G) { this.hp--; this.st = 'hit'; this.timer = 0.9; this.flash = 0.9; Audio2.play('bossHit'); G.shake(0.3); G.mercy(this.ar); }
  onStomp(G, p) { if (this.st === 'dizzy') { this.hurtBy(G); p.vy = -780; p.cutOk = false; p.vx = (p.cx < this.fx ? -1 : 1) * 260; return 'none'; } if (this.harmful) { Audio2.play('bump'); return 'bounce'; } return 'none'; }
  onCrunch(G) { if (this.st === 'dizzy') this.hurtBy(G); }
  onShot(G) { Audio2.play('bump'); return true; }
  onPickle() { Audio2.play('bump'); }
  kill() { }
  draw(g) { if (this.st === 'wait') return; const k = this.st === 'dead' ? Math.max(0.2, this.timer / 1.6) : 1; g.save(); g.translate(this.fx, this.fy); g.scale(k, k); if (this.st === 'hit') g.scale(1.15, 0.85); drawDarkPickle(g, 0, 0, { t: this.t, face: this.face, flash: this.flash > 0 && Math.floor(this.flash * 12) % 2 === 0, dizzy: this.st === 'dizzy' }); g.restore(); }
}

// ---------- 2-9 Sunken jars ----------
class Tap extends Ent { // ↑ next to it turns the water up or down
  constructor(x, y, water, low, high) { super(x - 24, y - 70, 48, 70); this.fx = x; this.fy = y; this.layer = 0; this.pool = water; this.low = low; this.high = high; this.on = false; this.cd = 0; }
  update(G, dt) {
    this.t += dt; this.cd -= dt; const p = G.player, near = p.state === 'play' && overlap(this, p);
    if (near) G.hint('tap', `Кран! Встань рядом и нажми ↑ — вода поднимется или уйдёт.`);
    if (near && this.cd <= 0 && Input.pressed('up')) { this.on = !this.on; this.cd = 0.4; Audio2.play('gate'); G.toast(this.on ? 'Вода прибывает!' : 'Вода уходит!'); }
    const target = this.on ? this.high : this.low; this.pool.base = approach(this.pool.base, target, 90 * dt);
  }
  draw(g, G) { drawTap(g, this.fx, this.fy, { on: this.on, t: G.time }); }
}
class GhostMarinade extends Enemy { // floats through walls towards the hero
  constructor(x, y) { super(x - 16, y - 16, 32, 34); this.hx = x; this.hy = y; this.freezable = false; this.slideable = true; }
  update(G, dt) {
    if (!this.pre(G, dt)) return;
    const p = G.player, dx = p.cx - this.cx, dy = p.cy - this.cy, d = Math.hypot(dx, dy) || 1;
    if (d < 420 && p.state === 'play') { this.x += dx / d * 55 * dt; this.y += dy / d * 55 * dt; this.face = sign(dx) || this.face; }
    else { this.x += (this.hx - this.cx) * 0.5 * dt; this.y += (this.hy + Math.sin(this.t * 2) * 20 - this.cy) * 0.5 * dt; }
  }
  draw(g) { drawGhostMarinade(g, this.cx, this.cy, { t: this.t }); }
}
class LidTrap extends Enemy { // a jar lid with teeth: open (safe to cross) → snaps shut (bites)
  constructor(x, y, o) { super(x - 24, y - 22, 48, 22); this.ph = (o && o.ph) || 0; this.open = 1; this.stompable = false; this.freezable = false; this.slideable = false; this.shootable = false; this.starKill = false; }
  update(G, dt) { this.t += dt; const c = (this.t + this.ph) % 3; this.open = c < 1.8 ? 1 : c < 2.1 ? 1 - (c - 1.8) / 0.3 : c < 2.7 ? 0 : (c - 2.7) / 0.3; const was = this.harmful; this.harmful = this.open < 0.4; if (this.harmful && !was && Math.abs(G.player.cx - this.cx) < 500) Audio2.play('clink'); }
  onHitPlayer(G) { G.hint('lid', 'Крышки-кусаки захлопываются! Проходи, когда они открыты.'); }
  kill() { }
  draw(g) { drawLidTrap(g, this.cx, this.bottom, { open: this.open }); }
}

// ---------- 2-10 The flagship «Кислый Рассол» and Captain Vinegar ----------
class StormTilt extends Ent { // the ship rolls in the storm: a slow sideways push, lightning now and then
  constructor(w, h, force) { super(0, -2000, w, h + 4000); this.zone = 'wind'; this.active = true; this.force = force || 380; this.dir = 0; }
  update(G, dt) {
    this.t += dt; this.dir = Math.sin(this.t * 0.75);
    const p = G.player; // the deck slides under the hero's feet
    if (p.state === 'play' && p.onGround && !p.wet && !G.bossActive) { const dx = this.dir * 40 * dt; if (!rectSolid(G, p.x + dx, p.y, p.w, p.h - 2)) p.x += dx; }
    G.flashT = Math.max(0, (G.flashT || 0) - dt * 1.6);
    if (Math.random() < dt * 0.12) { G.flashT = 0.45; Audio2.play('thud'); }
    if (Math.abs(this.dir) > 0.9) G.hint('storm', 'Корабль качает! Ветер сносит то влево, то вправо — держись ближе к канатам и мачтам.');
  }
}
class RopeVine extends Vine { // ship rigging
  draw(g) {
    const ex = this.ax + Math.sin(this.ang) * this.len, ey = this.ay + Math.cos(this.ang) * this.len, sag = this.holder ? 0 : Math.sin(this.t * 2 + this.ph) * 6;
    g.save(); g.lineCap = 'round'; g.beginPath(); g.moveTo(this.ax, this.ay); g.quadraticCurveTo(this.ax + (ex - this.ax) * 0.5 + sag, this.ay + (ey - this.ay) * 0.5, ex, ey);
    g.strokeStyle = '#5a3a1a'; g.lineWidth = 7; g.stroke(); g.setLineDash([4, 6]); g.strokeStyle = '#c8a070'; g.lineWidth = 3; g.stroke(); g.setLineDash([]);
    circ(g, this.ax, this.ay, 5); fs(g, '#8a8e96', '#3a3e46', 1.5); g.restore();
  }
}
class RollingBarrel extends Olive { // barrels the captain rolls down from the crow's nest
  constructor(x, y, dir) { super(x, y, dir); this.bossShot = true; this.active = true; this.life = 7; }
  splat(G) { this.alive = false; G.burst(this.cx, this.cy, 12, ['#8a5a2a', '#c8904a', '#d8d8d8']); Audio2.play('break'); }
  draw(g) { g.save(); g.translate(this.cx, this.bottom); g.rotate(this.rot); g.translate(0, -16); drawBarrel(g, 0, 22, {}); g.restore(); }
}
class BrineJar extends Enemy { // a jar of brine thrown in an arc; bursts on the deck
  constructor(x, y, vx, vy) { super(x - 11, y - 14, 22, 28); this.vx = vx; this.vy = vy; this.active = true; this.stompable = false; this.freezable = false; this.bossShot = true; this.life = 4; }
  update(G, dt) { this.t += dt; this.life -= dt; this.vy += 900 * dt; this.x += this.vx * dt; this.y += this.vy * dt; if (this.life <= 0 || rectSolid(G, this.cx - 4, this.bottom - 2, 8, 4)) { this.alive = false; Audio2.play('break'); G.burst(this.cx, this.bottom, 12, ['#c8e070', '#e8f8ff', '#ffffff']); } }
  kill(G) { this.alive = false; G.burst(this.cx, this.cy, 8, ['#c8e070', '#ffffff']); }
  draw(g) { g.save(); g.translate(this.cx, this.cy); g.rotate(this.t * 6); g.scale(0.55, 0.55); drawMarinadeJar(g, 0, 0, 0, 1); g.restore(); }
}
class SyrupShot extends Ent { // a syrup bomb thrown by a hero (grandma's gift)
  constructor(x, y, dir) { super(x - 10, y - 10, 20, 20); this.vx = dir * 380; this.vy = -430; this.life = 2.5; }
  update(G, dt) {
    this.t += dt; this.life -= dt; this.vy += 900 * dt; this.x += this.vx * dt; this.y += this.vy * dt;
    for (const e of G.ents) { if (!e.alive || !e.enemy || !overlap(this, e)) continue; if (e.boss && e.syrupHit) { e.syrupHit(G); } else if (!e.boss) e.kill(G, 'shot'); this.pop(G); return; }
    if (this.life <= 0 || rectSolid(G, this.cx - 4, this.cy - 4, 8, 8) || waterAt(G, this.cx, this.cy)) this.pop(G);
  }
  pop(G) { this.alive = false; Audio2.play('pop'); G.burst(this.cx, this.cy, 14, ['#ffe8a0', '#e88a1a', '#ffffff']); }
  draw(g) { drawSyrupBomb(g, this.cx, this.cy, this.t); }
}
(function () { // the syrup power: the fire button throws syrup bombs (for both heroes)
  const sh = Player.prototype.shoot;
  Player.prototype.shoot = function (G) {
    if (this.power === 'syrup') { if (G.countOf(SyrupShot) < 2) { G.add(new SyrupShot(this.cx + this.face * 14, this.y + 10, this.face)); this.fireCd = 0.35; this.shootT = 0.15; Audio2.play('throw'); } return; }
    return sh.call(this, G);
  };
  const up = Player.prototype.update;
  Player.prototype.update = function (G, dt) {
    up.call(this, G, dt);
    if (this.char === 'pickle' && this.power === 'syrup' && this.state === 'play' && !this.swimming && Input.pressed('fire') && this.fireCd <= 0) this.shoot(G);
  };
})();
class GrandmaHelper extends Ent { // Grandma Gherkin in the hold: tosses syrup bombs to the heroes
  constructor(x, y) { super(x - 14, y - 40, 28, 40); this.fx = x; this.fy = y; this.layer = 0; this.on = false; this.timer = 0; }
  update(G, dt) {
    this.t += dt; if (!this.on) return;
    this.timer -= dt;
    const p = G.player;
    if (this.timer <= 0 && p.power !== 'syrup' && !G.ents.some(e => e.alive && e instanceof Pickup && e.kind === 'syrup')) { this.timer = 2.5; const pk = G.add(new Pickup('syrup', clamp(p.cx + rnd(-120, 120), G.def.arena.x0 + 60, G.def.arena.x1 - 60), this.fy - 120)); pk.vy = 0; Audio2.play('throw'); G.npcSay(this, pick(['Держи, внучок!', 'Сироп — в Уксуса!', 'Сладенького ему!'])); }
  }
  draw(g) { if (this.on) drawGrandma(g, this.fx, this.fy, { t: this.t, wave: true, face: -1, s: 1.2 }); }
}
class Vinegar extends Enemy { // final boss: Captain Vinegar
  constructor(ar) { super(0, 0, 60, 100); this.ar = ar; this.boss = true; this.active = true; this.name = 'Капитан Уксус'; this.barColor = '#8a4a7a'; this.freezable = false; this.slideable = false; this.starKill = false; this.reset(); }
  reset() {
    this.hp = 6; this.maxHp = 6; this.st = 'wait'; this.alive = true; this.fx = this.ar.x1 - 160; this.fy = this.ar.floor; this.vx = 0; this.vy = 0; this.flash = 0; this.face = -1; this.jarT = 2; this.thrown = 0;
    if (this.ar.water) { this.ar.water.base = this.ar.waterLow; }
    if (this.ar.grandma) this.ar.grandma.on = false;
    this.sync();
  }
  sync() { this.x = this.fx - 30; this.y = this.fy - 100; }
  get phase() { return this.hp > 4 ? 1 : this.hp > 2 ? 2 : 3; }
  begin(G) { this.st = 'taunt'; this.timer = 1.4; Audio2.play('roar'); }
  update(G, dt) {
    this.t += dt; this.flash = Math.max(0, this.flash - dt);
    const a = this.ar, p = G.player;
    if (this.st !== 'wait' && this.st !== 'dead') this.jarT -= dt;
    switch (this.st) {
      case 'wait': break;
      case 'taunt': this.face = sign(p.cx - this.fx) || this.face; this.timer -= dt; if (this.timer <= 0) this.next(G); break;
      case 'lunge': this.fx += this.dir * 430 * dt; if (this.fx < a.x0 + 40 || this.fx > a.x1 - 40 || Math.abs(this.fx - this.tx) < 10) { this.fx = clamp(this.fx, a.x0 + 40, a.x1 - 40); this.st = 'tired'; this.timer = 1.7; Audio2.play('thud'); G.hint('vin1', 'Уксус выдохся после выпада! Прыгай ему на треуголку или бей Хрустом!'); } break;
      case 'jumpUp': case 'jumpDown': {
        this.vy += 2100 * dt; this.fx += this.vx * dt; this.fy += this.vy * dt;
        const land = this.st === 'jumpUp' ? a.nest : a.floor;
        if (this.vy > 0 && this.fy >= land) { this.fy = land; this.vy = 0; G.shake(0.25); Audio2.play('thud'); if (this.st === 'jumpUp') { this.st = 'nest'; this.timer = 1; this.thrown = 0; } else this.next(G); }
        break;
      }
      case 'nest':
        this.face = sign(p.cx - this.fx) || this.face; this.timer -= dt;
        if (this.timer <= 0) {
          if (this.thrown < 3) { this.thrown++; this.timer = 1.1; G.add(new RollingBarrel(this.fx + this.face * 30, this.fy - 4, this.face)); Audio2.play('throw'); }
          else { this.st = 'pant'; this.timer = 1.8; G.hint('vin2', 'Он запыхался в «вороньем гнезде»! Заберись по канатам и доскам — и прыгай на него!'); }
        }
        break;
      case 'pant': this.timer -= dt; if (this.timer <= 0) { this.st = 'nest'; this.timer = 0.8; this.thrown = 0; } break;
      case 'crate': { // phase 3: hops between two crates while the hold floods
        this.face = sign(p.cx - this.fx) || this.face; this.timer -= dt;
        if (this.timer <= 0) { const other = this.fx < (a.x0 + a.x1) / 2 ? a.crates[1] : a.crates[0]; this.st = 'hop'; this.vy = -900; this.vx = (other - this.fx) / 0.86; this.tx = other; }
        break;
      }
      case 'hop': this.vy += 2100 * dt; this.fx += this.vx * dt; this.fy += this.vy * dt; if (this.vy > 0 && this.fy >= a.crateTop) { this.fy = a.crateTop; this.fx = this.tx; this.vy = 0; this.st = 'crate'; this.timer = 2.2; } break;
      case 'tired': this.timer -= dt; if (this.timer <= 0) this.next(G); break;
      case 'hit': this.timer -= dt; if (this.timer <= 0) { if (this.hp <= 0) { this.st = 'sweet'; this.timer = 1.6; G.clearBossShots(); Audio2.play('win'); } else this.next(G); } break;
      case 'sweet': this.timer -= dt; if (this.timer <= 0) { this.st = 'dead'; G.bossDefeated(this); } break;
    }
    // jars of brine: in the deck and hold phases
    if (this.jarT <= 0 && ['taunt', 'crate', 'tired'].includes(this.st) && this.st !== 'tired') { this.jarT = this.phase === 3 ? 2.2 : 2.6; const d = p.cx - this.fx, tt = clamp(Math.abs(d) / 300, 0.6, 1.4); G.add(new BrineJar(this.fx, this.fy - 70, d / tt, (p.cy - this.fy + 70) / tt - 0.5 * 900 * tt)); Audio2.play('throw'); }
    // the flood in phase 3
    if (a.water) { const flood = this.phase === 3 && this.st !== 'wait', target = flood ? a.floor - 30 : a.waterLow; a.water.base = approach(a.water.base, target, (flood && a.water.base > a.floor + 20 ? 400 : 40) * dt); }
    this.harmful = ['lunge', 'taunt', 'jumpUp', 'jumpDown', 'nest', 'hop', 'crate'].includes(this.st);
    this.sync();
  }
  next(G) {
    const a = this.ar, p = G.player;
    if (this.phase === 1) {
      if (this.st === 'taunt') { this.st = 'lunge'; this.dir = sign(p.cx - this.fx) || this.face; this.face = this.dir; this.tx = clamp(p.cx + this.dir * 120, a.x0 + 40, a.x1 - 40); Audio2.play('throw'); }
      else { this.st = 'taunt'; this.timer = 0.9; }
      return;
    }
    if (this.phase === 2) { this.st = 'jumpUp'; this.vy = -1250; this.vx = (a.nestX - this.fx) / 1.0; this.face = sign(this.vx) || this.face; Audio2.play('jump'); return; }
    if (!a.grandma.on) { a.grandma.on = true; a.grandma.timer = 0.5; G.pickle.speak('Бабушка!!', 3, true); G.npcSay(a.grandma, 'Держитесь, внучки! Трюм заливает, но у меня есть сахарный сироп!'); }
    this.st = 'hop'; this.tx = a.crates[1]; this.vy = -900; this.vx = (this.tx - this.fx) / 0.86;
  }
  hurt(G, p) {
    this.hp--; this.flash = 0.8; this.st = 'hit'; this.timer = 0.9; Audio2.play('bossHit'); G.shake(0.3); G.mercy(this.ar);
    G.burst(this.fx, this.fy - 60, 16, ['#8a4a7a', '#ffffff', '#c8e070']);
    if (this.phase === 2 && this.fy < this.ar.floor - 10) { this.st = 'jumpDown'; this.vy = -300; this.vx = 0; }
    if (p) { p.vy = -760; p.cutOk = false; p.vx = (p.cx < this.fx ? -1 : 1) * 260; }
  }
  onStomp(G, p) {
    if (this.st === 'tired' || this.st === 'pant') { this.hurt(G, p); return 'none'; }
    if (this.phase === 3) { G.hint('vin3', `Сверху его не взять — бросай сироп-бомбы (${Input.label('fire')})!`); }
    if (this.harmful) { Audio2.play('bump'); return 'bounce'; }
    return 'none';
  }
  onCrunch(G) { if (this.st === 'tired' || this.st === 'pant') this.hurt(G, null); }
  syrupHit(G) { if (this.phase === 3 && this.st !== 'hit' && this.st !== 'sweet') this.hurt(G, null); else { Audio2.play('bump'); } }
  onShot(G) { Audio2.play('bump'); return true; }
  onPickle() { Audio2.play('bump'); }
  kill() { }
  draw(g) {
    if (this.st === 'wait') return;
    drawVinegar(g, this.fx, this.fy, { t: this.t, face: this.face, flash: this.flash > 0 && Math.floor(this.flash * 12) % 2 === 0, dizzy: this.st === 'tired' || this.st === 'pant', lunge: this.st === 'lunge', sweet: this.st === 'sweet' || this.st === 'dead' });
  }
}
