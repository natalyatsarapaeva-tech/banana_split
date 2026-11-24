'use strict';
// ================= w2/entities.js : World 2 enemies, objects and pickups =================

// ---------- enemies ----------
// Crab-Caper: walks sideways, pauses to snap its claws. Stomp, slide, crunch or shoot it.
class CrabCaper extends Enemy {
  constructor(x, y, o) { super(x - 17, y - 24, 34, 24); this.speed = (o && o.speed) || 62; this.vx = -this.speed; this.pause = rnd(1.5, 3); this.snap = 0; }
  update(G, dt) {
    if (!this.pre(G, dt)) return;
    this.pause -= dt;
    if (this.pause <= 0 && this.snap <= 0) { this.snap = 0.7; this.pause = rnd(2, 3.5); }
    if (this.snap > 0) { this.snap -= dt; this.vy += PHYS.grav * dt; const v = this.vx; this.vx = 0; moveBody(this, G, dt); this.vx = v || this.speed; return; }
    this.walkerMove(G, dt, this.speed);
  }
  draw(g) { drawCrab(g, this.cx, this.bottom, { t: this.t * (this.frozen > 0 ? 0 : 1), snap: this.snap > 0, frozen: this.frozen > 0 }); this.drawIce(g); }
}
// Anchovy: hides in the water and leaps out in an arc. Harmless while under water.
class Anchovy extends Enemy {
  constructor(x, y, o) {
    o = o || {}; super(x - 16, y, 32, 14); this.home = x; this.dir = o.dir || -1; this.wait = o.delay !== undefined ? o.delay : rnd(0.5, 2);
    this.every = o.every || 2.6; this.power = o.power || 720; this.reach = o.reach || 150; this.st = 'hide'; this.harmful = false; this.stompable = false; this.freezable = false;
  }
  update(G, dt) {
    if (!this.pre(G, dt)) return;
    const w = waterAt(G, this.home, this.y + 40) || G.waters.find(q => this.home >= q.x && this.home <= q.x + q.w);
    const surf = w ? w.surfaceY(G.time) : this.y;
    if (this.st === 'hide') {
      this.x = this.home - this.w / 2; this.y = surf + 16; this.harmful = this.stompable = false;
      this.wait -= dt;
      if (this.wait <= 0 && Math.abs(G.player.cx - this.home) < 560) { this.st = 'leap'; this.vy = -this.power; this.vx = this.dir * this.reach; Audio2.play('splash'); G.burst(this.cx, surf, 8, ['#ffffff', '#bff4ff']); }
      return;
    }
    this.harmful = this.stompable = true;
    this.vy += 1500 * dt; this.x += this.vx * dt; this.y += this.vy * dt; this.face = sign(this.vx) || this.face;
    if (this.vy > 0 && this.y > surf + 4) { this.st = 'hide'; this.wait = this.every; this.dir = -this.dir; G.burst(this.cx, surf, 6, ['#ffffff', '#bff4ff']); }
  }
  draw(g, G) { if (this.st === 'hide') return; drawAnchovy(g, this.cx, this.cy, { t: this.t, face: this.face, ang: Math.atan2(this.vy, Math.abs(this.vx) || 1) * this.face }); }
}

// ---------- breakable things ----------
// Barrel: solid; Pickle's crunch (or a flipper dash) breaks it and frees what is inside.
class Barrel extends Ent {
  constructor(c, r, content, o) { super(c * T, r * T - 6, T, T + 6); this.solid = 'full'; this.groundT = TL.SOLID; this.crunchable = true; this.content = content; this.o = o || {}; this.shake = 0; }
  update(G, dt) { this.t += dt; this.shake = Math.max(0, this.shake - dt); }
  onCrunch(G) {
    if (!this.alive) return;
    this.alive = false; this.solid = null; Audio2.play('break'); G.shake(0.15);
    G.burst(this.cx, this.cy, 18, ['#8a5a2a', '#c8904a', '#5a3414', '#d8d8d8']);
    if (this.content === 'drops') { for (let i = 0; i < 5; i++) G.add(new Pickup('drop', this.cx - 30 + i * 15, this.y - 6)); }
    else if (this.content) G.add(new Pickup(this.content, this.cx, this.y + 4, this.o));
  }
  draw(g) { drawBarrel(g, this.cx, this.bottom, { t: this.t }); }
}
// Jar with a little cucumber inside: rescued by a crunch, a ground pound or a flipper dash.
class JarKid extends Ent {
  constructor(x, y, id) { super(x - 18, y - 44, 36, 44); this.fx = x; this.fy = y; this.layer = 0; this.id = id; this.open = false; this.crunchable = true; this.poundable = true; this.told = false; }
  update(G, dt) {
    this.t += dt;
    if (!this.open && !this.told && G.player.state === 'play' && overlap(this, G.player)) {
      this.told = true;
      G.hint('jar', G.player.char === 'pickle' ? `Огурчик в банке! Разбей её Хрустом — ${Input.label('pickle')}.` : `Огурчик в банке! Банки разбивает Хруст Пикля — поменяйтесь (${Input.label('swap')}).`);
    }
  }
  onCrunch(G) { this.free(G); }
  onPound(G) { this.free(G); }
  free(G) {
    if (this.open) return;
    this.open = true; this.crunchable = this.poundable = false; G.stats.sheep++; Audio2.play('sheep'); Audio2.play('break');
    G.burst(this.fx, this.fy - 24, 16, ['#e8f8ff', '#bfe6f0', '#9cd47a', '#ffffff']);
    G.add(new KidFx(this.fx, this.fy, G.player.face));
    G.add(new TextFx(this.fx, this.fy - 70, `Огурчик спасён! ${G.stats.sheep}/${G.def.sheep}`, '#d8ffb0'));
  }
  draw(g) { drawJarKid(g, this.fx, this.fy, { t: this.t, open: this.open }); }
}
class KidFx extends Ent {
  constructor(x, y, dir) { super(x, y, 1, 1); this.fx = x; this.fy = y; this.dir = dir || 1; this.vy = -420; this.life = 1.6; }
  update(G, dt) { this.t += dt; this.life -= dt; this.vy += 900 * dt; this.fy += this.vy * dt; this.fx += this.dir * 90 * dt; if (this.life <= 0) this.alive = false; }
  draw(g) { g.save(); g.globalAlpha = Math.min(1, this.life * 2); drawPickleKid(g, this.fx, this.fy, { t: this.t, happy: true }); g.restore(); }
}

// ---------- triggers & NPC ----------
// grants a saved ability when the hero passes; explains it unless hints are off
class AbilityTrigger extends Ent {
  constructor(x, ability) { super(x, -1000, 4, 4000); this.ability = ability; }
  update(G) {
    const p = G.player; if (p.state !== 'play' || p.cx < this.x) return;
    this.alive = false;
    if (this.ability !== 'crunch' || Save.data.crunch) return;
    Save.data.crunch = true; Save.save(); Audio2.play('power');
    G.burst(p.cx, p.cy, 20, ['#c8ff8a', '#ffffff', '#9cd47a']);
    const text = `Пикль вспомнил приём из детства! Играя за Пикля, жми ${Input.label('pickle')} — он бросается вперёд плечом и разбивает банки, бочки и фруктовую корку.`;
    if (!Save.data.settings.hints) { G.toast('Новое умение: Хруст'); return; }
    G.setState('modal'); UI.modal('Новое умение!', 'Хруст', text, () => G.setState('play'));
  }
}
// cocktail umbrella checkpoint
class UmbrellaCheckpoint extends Checkpoint {
  update(G, dt) {
    this.t += dt;
    if (!this.activeCP && G.player.state === 'play' && overlap(this, G.player)) {
      this.activeCP = true; G.checkpoint = { x: this.fx + 30, y: this.fy, id: this.id };
      Audio2.play('check'); G.burst(this.fx + 10, this.fy - 100, 12, ['#ff6fa8', '#ffffff', '#ffd447']);
      G.add(new TextFx(this.fx + 10, this.fy - 130, 'Чекпоинт!', '#fff6a0'));
      if (G.player.hp < G.player.maxHp) { G.player.hp = G.player.maxHp; G.add(new TextFx(this.fx, this.fy - 70, 'Свежесть!', '#bff0ff')); }
    }
  }
  draw(g) { drawUmbrellaFlag(g, this.fx, this.fy, { t: this.t, active: this.activeCP }); }
}
// the watermelon boat at the end of a level: leaves once all boat parts are found
class Boat extends Ent {
  constructor(x, surfaceY, need) { super(x - 60, surfaceY - 30, 120, 40); this.layer = 3; this.rideable = true; this.need = need || 0; this.st = 'wait'; this.nagT = 0; this.vx = 0; }
  update(G, dt) {
    this.t += dt; this.nagT -= dt;
    const w = G.waters.find(q => this.cx >= q.x && this.cx <= q.x + q.w); if (w) this.y = w.surfaceY(G.time) - 30 + Math.sin(this.t * 2) * 2;
    if (this.st === 'wait') {
      const p = G.player;
      if (p.state === 'play' && overlap({ x: this.x, y: this.y - 40, w: this.w, h: this.h + 40 }, p)) {
        if (G.boatParts >= this.need) { this.st = 'go'; G.levelComplete(this); }
        else if (this.nagT <= 0) { this.nagT = 4; G.pickle.speak(`Лодка ещё не готова: частей ${G.boatParts} из ${this.need}. Они где-то на пляже!`, 4, true); }
      }
    } else if (this.st === 'go' && G.stateT > 0.8) { this.vx = Math.min(240, this.vx + 160 * dt); this.x += this.vx * dt; }
  }
  draw(g, G) { drawBoat(g, this.cx, this.bottom, { t: this.t, parts: Math.min(G.boatParts, this.need), need: this.need, sail: this.st === 'go' || (this.need && G.boatParts >= this.need) }); }
  drawFront(g) { drawBoatFront(g, this.cx, this.bottom); }
}

// ---------- pickups ----------
function collectW2(G, pk, p) {
  switch (pk.kind) {
    case 'part': G.boatParts++; Audio2.play('power'); G.burst(pk.cx, pk.cy, 16, ['#ff5a7a', '#6ad04a', '#ffffff']);
      G.add(new TextFx(pk.cx, pk.y - 10, `Часть лодки ${G.boatParts}/${G.def.boatParts}`, '#ffe9b0'));
      if (G.boatParts >= G.def.boatParts) G.pickle.speak('Все части лодки собраны! Теперь — к причалу!', 4, true);
      break;
    case 'helmet': p.helmet = true; Audio2.play('power'); G.add(new TextFx(pk.cx, pk.y, 'Кокосовый шлем!', '#ffe0b0')); G.hint('helmet', 'Кокосовый шлем! Он выдержит один удар, а головой в нём можно разбивать корку и кирпичи.'); break;
    case 'armor': p.armor = true; Audio2.play('power'); G.add(new TextFx(pk.cx, pk.y, 'Ананасовая броня!', '#fff0a0')); G.hint('armor', 'Ананасовая броня! Враги, которые тебя коснутся, сами уколются. Держится до первого удара.'); break;
    case 'flipper': p.power = 'flipper'; Audio2.play('power'); G.add(new TextFx(pk.cx, pk.y, 'Лаймонный ласт!', '#d8ff9a')); G.hint('flipper', `Лаймонный ласт! В воде жми ${Input.label('fire')} — рывок, он пробивает медуз и бочки.`); break;
  }
}
Pickup.prototype.drawW2 = function (g) {
  if (this.kind !== 'part') return false;
  drawBoatPart(g, this.cx, this.cy + Math.sin(this.t * 3) * 2.5, { i: this.o.i || 0, t: this.t });
  return true;
};

// pineapple armour: enemies that touch the hero get hurt instead
(function () {
  const base = Player.prototype.update;
  Player.prototype.update = function (G, dt) {
    base.call(this, G, dt);
    if (!this.armor || this.state !== 'play') return;
    for (const e of G.ents) if (e.alive && e.enemy && !e.boss && e.harmful && e.frozen <= 0 && e.shootable !== false && overlap(this, e)) { e.kill(G, 'armor'); Audio2.play('crunch'); }
  };
})();
