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
  constructor(x, surfaceY, need, o) { super(x - 60, surfaceY - 30, 120, 40); this.layer = 3; this.rideable = true; this.need = need || 0; this.o = o || {}; this.st = 'wait'; this.nagT = 0; this.vx = 0; }
  update(G, dt) {
    this.t += dt; this.nagT -= dt;
    const w = G.waters.find(q => this.cx >= q.x && this.cx <= q.x + q.w); if (w) this.y = w.surfaceY(G.time) - 30 + Math.sin(this.t * 2) * 2;
    if (this.st === 'wait') {
      const p = G.player;
      if (p.state === 'play' && overlap({ x: this.x - 24, y: this.y - 40, w: this.w + 48, h: this.h + 50 }, p)) {
        if (this.o.cond && !this.o.cond(G)) { if (this.nagT <= 0) { this.nagT = 4; G.pickle.speak(this.o.wait, 4, true); } }
        else if (G.boatParts >= this.need) { this.st = 'go'; G.levelComplete(this); }
        else if (this.nagT <= 0) { this.nagT = 4; G.pickle.speak(`Лодка ещё не готова: частей ${G.boatParts} из ${this.need}. Они где-то на пляже!`, 4, true); }
      }
    } else if (this.st === 'go' && G.stateT > 0.8) { this.vx = Math.min(240, this.vx + 160 * dt); this.x += this.vx * dt; }
  }
  draw(g, G) { drawBoat(g, this.cx, this.bottom, { t: this.t, parts: Math.min(G.boatParts, this.need), need: this.need, sail: this.st === 'go' || G.boatParts >= this.need }); }
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
    case 'lantern': G.lightR = 260; Audio2.play('power'); G.add(new TextFx(pk.cx, pk.y, 'Фонарь-киви!', '#d8ff9a')); G.hint('lantern', 'Фонарь-киви! Теперь вокруг светлее.'); break;
    case 'syrup': p.power = 'syrup'; Audio2.play('power'); G.add(new TextFx(pk.cx, pk.y, 'Сироп-бомба!', '#ffe8a0')); G.hint('syrup', `Бомбы с сахарным сиропом! Жми ${Input.label('fire')} — бросай их в Уксуса.`); break;
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

// ---------- 2-2 Pineapple jungle ----------
// pineapple on a metal spring: bounces high, higher when jump is held
class PineSpring extends JellyPad {
  constructor(x, groundY) { super(x - 20, groundY - 50, 40, null, 900); }
  bounce(G, p, impact) {
    const v = clamp(Math.max(this.min, impact * 1.05), this.min, 1250) * (Input.held('jump') ? 1.08 : 1);
    p.vy = -v; p.onGround = false; p.standOn = null; p.cutOk = false; p.airJumps = 1; p.sx = 0.75; p.sy = 1.3;
    this.sq = 1; Audio2.play('boing'); G.hint('pinespring', `Ананас на пружине! Держи ${Input.label('jump')} — подбросит ещё выше.`);
  }
  draw(g) { drawPineSpring(g, this.x, this.y, this.w, { sq: Math.sin(this.sq * 10) * this.sq * 0.5 + this.sq * 0.5 }); }
}
// rolling olive: too slippery to stomp — jump over it, slide into it, shoot it or crunch it
class Olive extends ScoopBall {
  constructor(x, y, dir, o) { super(x, y, dir); o = o || {}; this.patrol = !!o.patrol; this.stompable = false; this.speed = o.speed || 120; if (this.patrol) { this.vx = dir * this.speed; this.life = 1e9; } }
  update(G, dt) {
    if (!this.patrol) return super.update(G, dt);
    if (!this.pre(G, dt)) return;
    this.walkerMove(G, dt, this.speed); this.rot += this.vx / 16 * dt;
  }
  onTouch(G, p) { if (p.vy > 0 && p.prevBottom <= this.y + 10) G.hint('olive', 'Оливку не растопчешь — она скользкая! Перепрыгни её, подкатись или сделай Хруст.'); return false; }
  splat(G) { this.alive = false; G.burst(this.cx, this.cy, 10, ['#7a9a3a', '#e2363c', '#ffffff']); Audio2.play('pop'); }
  draw(g) { drawOlive(g, this.cx, this.bottom + 1, { rot: this.rot, dir: sign(this.vx) }); this.drawIce(g); }
}
class OliveSpawner extends BallSpawner {
  update(G, dt) {
    const p = G.player;
    if (Math.abs(p.cx - this.x) > 950 || p.state !== 'play') return;
    this.timer -= dt;
    if (this.timer <= 0) { this.timer = this.period; G.add(new Olive(this.x, this.y, this.dir)); }
  }
}
// pickled honey mushroom: hides in the moss and pops up when the hero comes near
class Shroom extends Broccoli {
  draw(g) { drawShroom(g, this.cx, this.base, { up: this.up }); this.drawIce(g); }
}
class JellyVine extends Vine {
  draw(g) {
    const ex = this.ax + Math.sin(this.ang) * this.len, ey = this.ay + Math.cos(this.ang) * this.len;
    drawJellyVine(g, this.ax, this.ay, ex, ey, this.holder ? 0 : Math.sin(this.t * 2 + this.ph) * 6);
  }
}
class PalisadeGate extends Gate {
  draw(g) { if (this.k <= 0.01) return; const h = this.h * this.k; drawPalisade(g, this.x, this.y + this.h - h, this.w, h); }
}
// pirate camp: gates shut, waves of olives and mushrooms, then the cage can be opened
class CampFight extends Ent {
  constructor(x, o) { super(x, -1000, 4, 4000); this.o = o; this.st = 'wait'; this.wave = -1; this.spawned = []; this.pause = 0; }
  begin(G) {
    this.st = 'fight'; this.wave = -1; this.pause = 0.6;
    for (const gt of this.o.gates) gt.close();
    G.pickle.speak('Пираты охраняют клетку! Прогоним их — тогда я разобью замок.', 4, true);
  }
  reset(G) {
    this.st = 'wait'; for (const e of this.spawned) e.alive = false; this.spawned = [];
    for (const gt of this.o.gates) { gt.closed = false; gt.solid = null; gt.k = 0; }
  }
  update(G, dt) {
    const p = G.player;
    if (this.st === 'wait') { if (p.state === 'play' && p.cx > this.x) this.begin(G); return; }
    if (this.st !== 'fight') return;
    if (p.state === 'dead' || p.state === 'gone') { this.reset(G); return; }
    if (this.spawned.some(e => e.alive)) return;
    this.pause -= dt; if (this.pause > 0) return;
    this.wave++;
    const waves = this.o.waves;
    if (this.wave >= waves.length) {
      this.st = 'done'; for (const gt of this.o.gates) gt.open();
      this.o.cage.unlock(G); return;
    }
    const a = this.o.arena; this.spawned = [];
    waves[this.wave].forEach((kind, i) => {
      if (kind === 'olive') { const left = i % 2 === 0; this.spawned.push(G.add(new Olive(left ? a.x0 + 30 : a.x1 - 30, a.floor - 200, left ? 1 : -1, { patrol: true, speed: 110 + this.wave * 15 }))); }
      else { const x = a.x0 + 80 + (i * 173 + this.wave * 97) % (a.x1 - a.x0 - 160); const s = G.add(new Shroom(x, a.floor)); s.active = true; this.spawned.push(s); }
    });
    for (const e of this.spawned) { e.active = true; G.burst(e.cx, e.cy, 8, ['#ffffff', '#9cd47a']); }
    G.toast(`Волна ${this.wave + 1} из ${waves.length}`);
    this.pause = 1;
  }
}
// the wooden cage with Pickle's sister
class PupyrkaCage extends Ent {
  constructor(x, y, lines) { super(x - 44, y - 76, 88, 76); this.fx = x; this.fy = y; this.layer = 0; this.crunchable = true; this.poundable = true; this.locked = true; this.broken = false; this.lines = lines; this.nagT = 0; }
  unlock(G) { this.locked = false; Audio2.play('gate'); G.pickle.speak(`Пираты разбежались! Теперь Хрустом по клетке — ${Input.label('pickle')}!`, 5, true); }
  update(G, dt) { this.t += dt; this.nagT -= dt; }
  onPound(G, p) { this.onCrunch(G, p); }
  onCrunch(G) {
    if (this.broken) return;
    if (this.locked) { if (this.nagT <= 0) { this.nagT = 3; Audio2.play('bump'); G.pickle.speak('Замок не поддаётся, пока пираты рядом!', 3, true); } return; }
    this.broken = true; this.crunchable = this.poundable = false; Audio2.play('break'); G.shake(0.25);
    G.burst(this.fx, this.fy - 40, 24, ['#8a5a2a', '#c8904a', '#ff6fa8', '#ffffff']);
    const sis = G.add(new FreedSister(this.fx, this.fy));
    G.later(0.6, () => G.dialog(this.lines, () => {
      Save.data.family = Object.assign({}, Save.data.family, { pupyrka: true }); Save.save();
      sis.go = true; G.sisterFree = true; G.pickle.speak('Скорее к лодке! Плывём на Арбузный риф!', 4, true);
    }));
  }
  draw(g) { drawWoodCage(g, this.fx, this.fy, { t: this.t, broken: this.broken, inside: !this.broken, locked: this.locked }); }
}
class FreedSister extends Ent {
  constructor(x, y) { super(x - 10, y - 40, 20, 40); this.fx = x; this.fy = y; this.layer = 0; this.go = false; this.face = 1; }
  update(G, dt) { this.t += dt; if (this.go) { this.fx += 230 * dt; if (this.t > 30 || this.fx > G.level.W * T) this.alive = false; } }
  draw(g) { drawPupyrka(g, this.fx, this.fy, { t: this.t, happy: true, face: this.face }); }
}

// ---------- 2-3 Watermelon reef ----------
// glowing jellyfish: bobs up and down; it stings from above, so stomping it hurts — dash, crunch or shoot it
class Jellyfish extends Enemy {
  constructor(x, y, o) { o = o || {}; super(x - 16, y - 18, 32, 30); this.bx = x; this.by = y; this.amp = o.amp || 40; this.ph = o.ph !== undefined ? o.ph : rnd(0, 6); this.drift = o.drift || 0; this.stompable = false; this.freezable = true; }
  update(G, dt) {
    if (!this.pre(G, dt)) return;
    const cy = this.by + Math.sin(this.t * 1.4 + this.ph) * this.amp, cx = this.bx + Math.sin(this.t * 0.6 + this.ph) * this.drift;
    this.x = cx - 16; this.y = cy - 18;
  }
  onTouch(G, p) { G.hint('jelly', `Медузы жгутся, даже сверху! Бей их рывком ласта (${Input.label('fire')}) или Хрустом.`); return false; }
  draw(g) { drawJelly(g, this.cx, this.y + 18, { t: this.t }); this.drawIce(g); }
}
// a school of herrings: swims slowly; glints, then darts along its line when the hero is level with it
class HerringSchool extends Enemy {
  constructor(x0, x1, y) { super(x0, y - 18, 110, 36); this.x0 = x0; this.x1 = x1; this.vx = 60; this.st = 'swim'; this.timer = 0; this.dir = 1; this.freezable = false; this.slideable = false; }
  update(G, dt) {
    if (!this.pre(G, dt)) return;
    const p = G.player, ahead = (p.cx - this.cx) * this.dir;
    switch (this.st) {
      case 'swim':
        this.x += this.vx * dt; this.dir = sign(this.vx) || this.dir; this.face = this.dir;
        if (this.x < this.x0) this.vx = Math.abs(this.vx); if (this.x + this.w > this.x1) this.vx = -Math.abs(this.vx);
        if (p.state === 'play' && Math.abs(p.cy - this.cy) < 50) {
          const d = p.cx - this.cx;
          if (Math.abs(d) < 460) { this.dir = sign(d); this.face = this.dir; this.st = 'warn'; this.timer = 0.65; Audio2.play('select'); }
        }
        break;
      case 'warn': this.timer -= dt; if (this.timer <= 0) { this.st = 'dash'; this.timer = 1.6; } break;
      case 'dash': {
        this.timer -= dt; const v = this.dir * 520 * dt;
        if (rectSolid(G, this.x + v, this.y + 6, this.w, this.h - 12) || this.timer <= 0) { this.st = 'back'; } else this.x += v;
        break;
      }
      case 'back': {
        const home = clamp(this.cx, this.x0 + 55, this.x1 - 55); this.x = approach(this.x, home - 55, 90 * dt); this.face = sign(home - this.cx) || this.face;
        if (Math.abs(this.cx - home) < 2) { this.st = 'swim'; this.vx = 60 * (this.face || 1); }
        break;
      }
    }
  }
  draw(g) {
    const glint = this.st === 'warn' && Math.floor(this.timer * 12) % 2 === 0;
    for (let i = 0; i < 5; i++) { const ox = [-36, -12, 12, 36, 0][i], oy = [-8, 6, -6, 8, -14][i] + Math.sin(this.t * 3 + i) * 2; drawHerring(g, this.cx + ox * this.face, this.cy + oy, this.face, this.t + i, glint); }
  }
}
// giant clam checkpoint: also refills the air
class ClamCheckpoint extends UmbrellaCheckpoint {
  update(G, dt) { const was = this.activeCP; super.update(G, dt); if (!was && this.activeCP) G.player.air = 1; if (this.activeCP && overlap(this, G.player)) G.player.air = Math.min(1, G.player.air + dt); }
  draw(g) { drawClam(g, this.fx, this.fy, { open: this.activeCP ? 0.85 : 0.15, pearl: this.activeCP }); }
}
// a column of bubbles that lifts both heroes to the surface
class LiftZone extends Ent {
  constructor(x, y, w, h) { super(x, y, w, h); this.zone = 'lift'; }
  draw(g, G) { for (let i = 0; i < 14; i++) { const k = ((G.time * 0.5 + hash2(i, 2)) % 1), bx = this.x + hash2(i, 7) * this.w, by = this.y + this.h - k * this.h; drawAirBubble(g, bx + Math.sin(G.time * 3 + i) * 5, by, 5 + hash2(i, 4) * 6, G.time + i); } }
}
function liftAt(G, x, y) { for (const z of G.zones) if (z.alive && z.zone === 'lift' && x > z.x && x < z.x + z.w && y > z.y && y < z.y + z.h) return z; return null; }

// ---------- boss: Octopus Marinade ----------
class MarinadeBlob extends Enemy {
  constructor(x, y, tx, ty) { super(x - 10, y - 10, 20, 20); const d = Math.hypot(tx - x, ty - y) || 1; this.vx = (tx - x) / d * 150; this.vy = (ty - y) / d * 150; this.life = 4.5; this.bossShot = true; this.active = true; this.stompable = false; this.freezable = false; }
  update(G, dt) { this.t += dt; this.life -= dt; this.x += this.vx * dt; this.y += this.vy * dt + Math.sin(this.t * 5) * 0.6; if (this.life <= 0 || rectSolid(G, this.x + 4, this.y + 4, 12, 12)) { this.alive = false; G.burst(this.cx, this.cy, 5, ['#c8d84a', '#8a9a2a']); } }
  kill(G) { this.alive = false; G.burst(this.cx, this.cy, 5, ['#c8d84a', '#ffffff']); Audio2.play('pop'); }
  draw(g) { circ(g, this.cx, this.cy, 10); fs(g, 'rgba(190,210,70,0.9)', '#5a6a1a', 1.5); circ(g, this.cx - 3, this.cy - 3, 3); fs(g, 'rgba(255,255,255,0.7)'); }
}
class BrineInk extends Ent {
  constructor(x, y) { super(x - 90, y - 70, 180, 140); this.layer = 5; this.bossShot = true; this.life = 6; this.vx = rnd(-20, 20); }
  update(G, dt) { this.t += dt; this.life -= dt; this.x += this.vx * dt; if (this.life <= 0) this.alive = false; }
  draw(g) { drawInkCloud(g, this.cx, this.cy, 95, Math.min(0.85, this.life / 1.5, this.t * 2), this.t); }
}
// the jar in a tentacle: breakable only while it lies on the sea floor
class JarTarget extends Ent {
  constructor(boss, jar) { super(0, 0, 44, 56); this.boss = boss; this.jar = jar; this.bossShot = true; this.layer = 0; }
  get crunchable() { return this.jar.st === 'down'; }
  get poundable() { return this.jar.st === 'down'; }
  update(G, dt) { const p = this.boss.jarPos(this.jar); this.x = p.x - 22; this.y = p.y - 30; if (this.jar.st === 'gone') this.alive = false; }
  onCrunch(G) { if (this.jar.st === 'down') this.boss.breakJar(G, this.jar); }
  onPound(G) { this.onCrunch(G); }
}
class OctopusMarinade extends Enemy {
  constructor(ar) {
    super(0, 0, 140, 130);
    this.ar = ar; this.boss = true; this.active = true; this.name = 'Осьминог Маринад'; this.barColor = '#b05ac8';
    this.freezable = false; this.slideable = false; this.starKill = false; this.harmful = false;
    this.reset();
  }
  reset() {
    this.hp = 6; this.maxHp = 6; this.st = 'wait'; this.timer = 0; this.flash = 0; this.alive = true; this.blobT = 2.5; this.ang = 0;
    this.ccx = (this.ar.x0 + this.ar.x1) / 2; this.ccy = this.ar.top - 220;
    this.jars = [{ side: -1, st: 'held', k: 0 }, { side: 1, st: 'held', k: 0 }]; this.slamJar = null; this.sync();
  }
  sync() { this.x = this.ccx - 70; this.y = this.ccy - 68; }
  get phase() { return this.jars.some(j => j.st !== 'gone') ? 1 : this.hp > 2 ? 2 : 3; }
  begin(G) { this.st = 'enter'; for (const j of this.jars) if (j.st !== 'gone') G.add(new JarTarget(this, j)); }
  jarPos(j) {
    const hx = this.ccx + j.side * 108, hy = this.ccy + 50 + Math.sin(this.t * 2 + j.side) * 6;
    if (j.st === 'held' || j.st === 'gone') return { x: hx, y: hy };
    const e = 1 - Math.pow(1 - clamp(j.k, 0, 1), 3), fy = this.ar.floor - 28;
    return { x: lerp(hx, j.tx, e), y: lerp(hy, fy, e) };
  }
  hit(G) {
    this.hp--; this.flash = 0.8; this.st = 'hit'; this.timer = 0.8; Audio2.play('bossHit'); G.shake(0.3); G.mercy(this.ar);
    G.burst(this.ccx, this.ccy, 18, ['#c060b0', '#ffffff', '#ff9ad0']);
  }
  breakJar(G, j) {
    j.st = 'gone'; Audio2.play('break'); G.burst(j.tx, this.ar.floor - 30, 22, ['#c8d84a', '#e8f0ff', '#ffffff', '#6a8a2a']);
    this.slamJar = null; this.hit(G);
    G.pickle.speak(this.jars.some(q => q.st !== 'gone') ? 'Одна банка разбита! Осталась ещё одна!' : 'Банок больше нет! Когда он устанет и опустится — прыгай ему на голову!', 4, true);
  }
  update(G, dt) {
    this.t += dt; this.flash = Math.max(0, this.flash - dt);
    const p = G.player, a = this.ar, hy = a.top + 130, mid = (a.x0 + a.x1) / 2;
    switch (this.st) {
      case 'wait': break;
      case 'enter': this.ccy = approach(this.ccy, hy, 220 * dt); if (this.ccy >= hy) { this.st = 'hover'; this.timer = 1.4; Audio2.play('roar'); G.shake(0.4); } break;
      case 'hover': {
        const tx = clamp(p.cx, a.x0 + 160, a.x1 - 160);
        this.ccx = approach(this.ccx, tx, 70 * dt); this.ccy = approach(this.ccy, hy + Math.sin(this.t * 1.5) * 12, 160 * dt);
        this.blobT -= dt;
        if (this.blobT <= 0 && this.phase < 3) { this.blobT = this.phase === 1 ? 2.6 : 2; G.add(new MarinadeBlob(this.ccx, this.ccy + 40, p.cx, p.cy)); Audio2.play('pea'); }
        this.timer -= dt;
        if (this.timer > 0) break;
        if (this.phase === 1) {
          const held = this.jars.filter(j => j.st === 'held'), j = held[Math.floor(rnd(0, held.length))] || held[0];
          if (!j) break;
          j.st = 'reach'; j.k = 0; j.tx = clamp(p.cx, a.x0 + 60, a.x1 - 60); this.slamJar = j; this.st = 'slam';
        } else if (this.phase === 2) {
          this.st = 'ink'; this.timer = 1.2; Audio2.play('roar');
          for (let i = 0; i < 2; i++) G.add(new BrineInk(rnd(a.x0 + 120, a.x1 - 120), rnd(a.top + 120, a.floor - 120)));
          if (G.countOf(Jellyfish) < 2) { const jf = G.add(new Jellyfish(rnd(a.x0 + 80, a.x1 - 80), a.top + 200, { amp: 60 })); jf.active = true; jf.bossShot = true; }
          G.hint('ink', 'Рассольные чернила! Сквозь них плохо видно, но они не жгутся. Подожди — скоро он устанет.');
        } else { this.st = 'circle'; this.timer = 4.5; this.ang = Math.atan2(this.ccy - (a.top + a.floor) / 2, this.ccx - mid); Audio2.play('roar'); }
        break;
      }
      case 'slam': {
        const j = this.slamJar;
        if (!j || j.st === 'gone') { this.st = 'hover'; this.timer = 1.8; break; }
        if (j.st === 'reach') {
          j.k += dt / 0.95;
          if (j.k >= 1) {
            j.k = 1; j.st = 'down'; j.downT = 2.6; G.shake(0.35); Audio2.play('thud'); G.burst(j.tx, a.floor - 6, 14, ['#ffffff', '#f06a7a']);
            if (p.state === 'play' && Math.abs(p.cx - j.tx) < 46 && p.bottom > a.floor - 70) p.hurt(G, { cx: j.tx });
            G.hint('jars', `Банка на дне! Разбей её Хрустом (${Input.label('pickle')}), ударом сверху или рывком ласта!`);
          }
        } else if (j.st === 'down') { j.downT -= dt; if (j.downT <= 0) j.st = 'rise'; }
        else if (j.st === 'rise') { j.k -= dt / 0.6; if (j.k <= 0) { j.k = 0; j.st = 'held'; this.slamJar = null; this.st = 'hover'; this.timer = 1.6; } }
        break;
      }
      case 'ink': this.timer -= dt; if (this.timer <= 0) { this.st = 'tired'; this.timer = 2.8; } break;
      case 'tired': this.ccy = approach(this.ccy, a.floor - 90, 300 * dt); this.timer -= dt; if (this.timer <= 0) { this.st = 'hover'; this.timer = 2.4; } break;
      case 'circle': {
        this.ang += dt * 2.3; const rx = (a.x1 - a.x0) / 2 - 120, ry = (a.floor - a.top) / 2 - 100;
        this.ccx = approach(this.ccx, mid + Math.cos(this.ang) * rx, 600 * dt); this.ccy = approach(this.ccy, (a.top + a.floor) / 2 + Math.sin(this.ang) * ry, 600 * dt);
        this.timer -= dt; if (this.timer <= 0) { this.st = 'tired'; this.timer = 2.4; G.hint('tired3', 'Выдохся! Бей, пока он у дна!'); }
        break;
      }
      case 'hit': this.timer -= dt; if (this.timer <= 0) { if (this.hp <= 0) { this.st = 'dead'; this.timer = 2; G.clearBossShots(); Audio2.play('win'); } else { this.st = 'hover'; this.timer = 1.6; } } break;
      case 'dead':
        this.timer -= dt; this.ccy -= 40 * dt;
        if (Math.random() < 0.5) G.burst(this.ccx + rnd(-60, 60), this.ccy + rnd(-50, 50), 3, ['#c060b0', '#ffffff']);
        if (this.timer <= 0) { this.alive = false; G.burst(this.ccx, this.ccy, 40, ['#c060b0', '#ff9ad0', '#ffffff']); G.bossDefeated(this); }
        break;
    }
    this.harmful = ['hover', 'slam', 'ink', 'circle', 'enter'].includes(this.st);
    this.sync();
  }
  onStomp(G, p) {
    if (this.st === 'tired') { this.hit(G); p.vy = -620; p.cutOk = false; return 'none'; }
    if (this.harmful) { Audio2.play('bump'); return 'bounce'; }
    return 'none';
  }
  onDash(G, p) { if (this.st === 'tired') { this.hit(G); p.dashT = 0; p.vx = -sign(p.vx) * 200; } else if (this.st !== 'hit' && this.st !== 'dead') { Audio2.play('bump'); p.dashT = 0; } }
  onCrunch(G, p) { if (this.st === 'tired') this.hit(G); }
  onShot(G) { Audio2.play('bump'); return true; }
  onPickle(G) { Audio2.play('bump'); }
  kill() { }
  draw(g, G) {
    if (this.st === 'wait') return;
    const k = this.st === 'dead' ? Math.max(0.2, this.timer / 2) : 1;
    // tentacle arms with the jars
    for (const j of this.jars) {
      if (j.st === 'gone') continue;
      const jp = this.jarPos(j), sx = this.ccx + j.side * 40, sy = this.ccy + 40;
      g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx + j.side * 60, sy + 10, jp.x, jp.y - 20); g.strokeStyle = '#4a1a4a'; g.lineWidth = 20; g.lineCap = 'round'; g.stroke();
      g.strokeStyle = this.flash > 0 ? '#ff9ad0' : '#a8509a'; g.lineWidth = 15; g.stroke();
      if (j.st === 'reach' && j.k < 1) { g.save(); g.globalAlpha = 0.25 + j.k * 0.4; ell(g, j.tx, this.ar.floor - 2, 26 + j.k * 16, 6); fs(g, '#2a0a2a'); g.restore(); }
      drawMarinadeJar(g, jp.x, jp.y, j.st === 'down' ? 0 : j.side * 0.35, 1);
      if (j.st === 'down' && Math.floor(this.t * 6) % 2 === 0) sparkle(g, jp.x + 18, jp.y - 34, 6, '#ffffff');
    }
    g.save(); g.translate(this.ccx, this.ccy); g.scale(k, k); if (this.st === 'hit') g.scale(1.1, 0.88);
    drawOctopus(g, 0, 0, { t: this.t, flash: this.flash > 0 && Math.floor(this.flash * 12) % 2 === 0, dizzy: this.st === 'tired', angry: this.phase === 3, look: clamp((G.player.cx - this.ccx) / 200, -1, 1) });
    g.restore();
  }
}
