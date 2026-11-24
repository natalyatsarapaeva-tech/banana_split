'use strict';
// ================= main.js : game state, render, UI =================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const G = window.__G = {
  state: 'boot', viewW: 960, S: 1, displayScale: 1, time: 0, stateT: 0,
  ents: [], solids: [], parts: [], slime: [], toasts: [], hintsShown: new Set(),
  cam: new Camera(), terrain: null, level: null, def: null, theme: THEME1, decoBack: [], decoFront: [], fakeTiles: [], fakeAlpha: 1,
  lives: 3, drops: 0, gold: [0, 0, 0], stats: { drops: 0, enemies: 0, sheep: 0, throws: 0, notes: 0 },
  checkpoint: null, boss: null, bossActive: false, musicRate: 1, tearsT: 0, npcBubble: null, levelId: 1, mapSel: 0,
  // ---------------- level lifecycle ----------------
  startLevel(id) {
    this.levelId = id;
    const def = LEVELS[id]();
    this.def = def; this.level = def.level; this.theme = def.theme;
    this.ents = def.ents.slice(); this.decoBack = def.decoBack; this.decoFront = def.decoFront; this.fakeTiles = def.fake;
    this.parts = []; this.slime = []; this.toasts = []; this.hintsShown = new Set(); this.npcBubble = null; this.tearsT = 0;
    this.boss = def.boss; this.bossActive = false; this.musicRate = def.musicRate; this.fakeCache = null;
    this.lives = Save.data.settings.easy ? 5 : 3; this.drops = 0; this.gold = (Save.data.cherries[id] || [0, 0, 0]).slice();
    this.stats = { drops: 0, enemies: 0, sheep: 0, throws: 0, notes: 0, goldNew: 0 };
    this.checkpoint = null;
    this.player = new Player(def.start.x, def.start.y);
    this.pickle = new Pickle(def.start.x - 40, def.start.y);
    if (def.startChar) this.player.setChar(this, def.startChar);
    this.boatParts = 0;
    this.terrain = new TerrainCache(this); this.terrain.setScale(this.S);
    this.cam = new Camera(); this.cam.reset(this, this.player);
    this.solids = this.ents.filter(e => e.solid);
    this.zones = this.ents.filter(e => e.zone);
    this.waters = this.ents.filter(e => e.water);
    this.timers = []; this.autoscroll = null; this.flood = null; this.rideStarted = false; this.winBalloon = null; this.winRide = false;
    this.rcherries = 0; this.bonusTime = 0; this.bonusPenalty = 0; this.bonusDone = false;
    if (worldOfLevel(id).music === false) Audio2.silence(); else Audio2.music(def.musicRate);
    Audio2.muffle(false); Audio2.setTone(def.tone || 20000);
    UI.hide(); Touch.update();
    this.setState('levelIntro');
  },
  setState(s) { this.state = s; this.stateT = 0; Touch.update(); },
  add(e) { this.ents.push(e); return e; },
  countOf(cls) { let n = 0; for (const e of this.ents) if (e.alive && e instanceof cls) n++; return n; },
  // ---------------- helpers for entities ----------------
  burst(x, y, n, cols, o) { for (let i = 0; i < n; i++) { const a = rnd(0, TAU), sp = rnd(80, 320); this.parts.push({ k: 'bit', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 160, life: rnd(0.4, 0.9), max: 0.9, c: pick(cols), s: rnd(2.5, 5), r: rnd(0, 6), g: 900 }); } },
  spark(x, y, c) { this.parts.push({ k: 'spark', x, y, vx: rnd(-20, 20), vy: rnd(-40, -10), life: 0.5, max: 0.5, c: c || '#fff', s: rnd(2, 4), g: 0 }); },
  dust(x, y, n) { for (let i = 0; i < n; i++) this.parts.push({ k: 'dust', x: x + rnd(-8, 8), y: y - 3, vx: rnd(-60, 60), vy: rnd(-50, -10), life: rnd(0.3, 0.55), max: 0.55, c: 'rgba(255,255,255,0.8)', s: rnd(3, 6), g: 0 }); },
  drip(x, y, c) { this.parts.push({ k: 'bit', x, y, vx: 0, vy: 40, life: 0.6, max: 0.6, c, s: 3, r: 0, g: 900 }); },
  crownBounce(x, y) { for (let i = 0; i < 6; i++) this.parts.push({ k: 'dust', x: x + rnd(-16, 16), y: y + 4, vx: rnd(-90, 90), vy: rnd(-90, -20), life: 0.5, max: 0.5, c: pick(['#ffd6e8', '#d6efff', '#ebdcff']), s: rnd(4, 8), g: 0 }); },
  shake(t) { this.cam.shake = Math.max(this.cam.shake, t); },
  clearBossShots() { for (const e of this.ents) if (e.alive && (e instanceof Leaf || e instanceof Tear || e instanceof OnionRing)) { e.alive = false; this.burst(e.cx, e.cy, 3, ['#ffffff']); } },
  mercy(ar) {
    const p = this.player; if (p.hp >= p.maxHp) return;
    if (this.ents.some(e => e.alive && e instanceof Pickup && e.kind === 'ice')) return;
    let x = p.cx < (ar.x0 + ar.x1) / 2 ? ar.x1 - 140 : ar.x0 + 140, y = ar.floor - 26;
    if (this.flood) { const t = this.ents.find(e => e.alive && e instanceof ToastPlat && Math.abs(e.cx - p.cx) > 150 && e.baseY > ar.floor - 200); if (!t) return; x = t.cx; y = t.baseY - 30; }
    this.add(new Pickup('ice', x, y)); this.burst(x, y, 10, ['#d6f3ff', '#ffffff']);
  },
  liquidAt(x, y) { if (this.waters.length && waterAt(this, x, y)) return TL.WATER; const t = this.level.tileAt(x, y); if (isLiquidT(t)) return t; if (this.flood && y > this.flood.y && x > this.flood.x0 && x < this.flood.x1) return TL.BROTH; return 0; },
  liquidSurface(x, y) {
    if (this.waters.length) { const w = waterAt(this, x, y) || waterAt(this, x, y + T); if (w) return w.surfaceY(this.time); }
    if (this.flood && y > this.flood.y - 4 && x > this.flood.x0 && x < this.flood.x1) return this.flood.y;
    const c = Math.floor(x / T); let r = Math.floor(y / T);
    if (!isLiquidT(this.level.get(c, r))) { if (isLiquidT(this.level.get(c, r + 1))) r++; else return null; }
    while (r > 0 && isLiquidT(this.level.get(c, r - 1))) r--; return r * T + 5;
  },
  updraftAt(x, y) { for (const z of this.zones) if (z.alive && z.zone === 'up' && x > z.x && x < z.x + z.w && y > z.y && y < z.y + z.h) return z.force; return 0; },
  windAt(x, y) { for (const z of this.zones) if (z.alive && z.zone === 'wind' && z.active && x > z.x && x < z.x + z.w && y > z.y && y < z.y + z.h) return z.dir * z.force; return 0; },
  graterBeside(p, dir) { const x = dir > 0 ? p.x + p.w + 2 : p.x - 2; for (let y = p.y + 4; y < p.bottom - 4; y += 12) if (this.level.tileAt(x, y) === TL.GRATER) return true; return false; },
  breakTile(c, r) {
    this.level.set(c, r, TL.EMPTY); this.terrain.invalidateTile(c, r);
    this.burst(c * T + 20, r * T + 20, 14, this.theme.breakColors || (this.theme.id === 5 ? ['#6a4a40', '#3a2a2a', '#c8a080'] : ['#d8a058', '#8a5a1e', '#fff0d0'])); Audio2.play('break');
  },
  dialog(lines, done) {
    this.setState('dialog'); Audio2.muffle(true);
    UI.dialog(lines, () => { Audio2.muffle(false); this.setState('play'); Input.clear(); if (done) done(this); });
  },
  later(t, fn) { this.timers.push({ t, fn }); },
  startRide() {
    const d = this.def.ride;
    this.autoscroll = { speed: d.speed, stopX: d.stopX, camY: d.camY }; this.rideStarted = true; this.rideStartX = this.cam.x;
    this.cam.lockY = d.camY; Audio2.setRate(1.07); this.checkpoint = { ride: true, x: 0, y: 0 };
    for (const e of this.ents) if (e instanceof Barrier) e.alive = false;
    this.toast('В полёт!');
    this.pickle.speak(`Шар слушается стрелок, пушка — ${Input.label('fire')} или ${Input.label('jump')}. Сбивай мармеладных мишек и собирай капли!`, 6, true);
  },
  startFlood(ar) {
    this.flood = { y: ar.floor + 30, target: ar.floor - 46, x0: ar.x0 - 40, x1: ar.x1 + 40 };
    [[0.07, 80], [0.23, 150], [0.36, 300], [0.64, 300], [0.77, 150], [0.93, 80]].forEach(([k, h], i) => this.add(new ToastPlat(ar.x0 + (ar.x1 - ar.x0) * k - 45, ar.floor - h, 90, i)));
  },
  endFlood() {
    if (this.flood) this.flood.target = this.def.arena.floor + 70;
    for (const e of this.ents) if (e instanceof ToastPlat) { e.alive = false; e.solid = null; this.burst(e.cx, e.cy, 8, ['#f2c070', '#c98a40']); }
  },
  bonusFinish(f) {
    this.bonusDone = true; const t = this.bonusTime + this.bonusPenalty;
    const best = Save.data.best.bonus; const rec = !best || t < best;
    if (rec) Save.data.best.bonus = t; Save.data.done[6] = 1; Save.save();
    Audio2.play('win'); this.burst(f.fx, f.fy - 80, 40, RAINBOW);
    this.setState('win'); this.winBonus = { t, rec };
    const p = this.player; p.state = 'win'; p.vx = 0;
  },
  tears(t) { if (this.tearsT <= 0) Audio2.play('tears'); this.tearsT = Math.max(this.tearsT, t); },
  toast(text) { this.toasts.push({ text, t: 2.4 }); },
  hint(id, text) { if (!Save.data.settings.hints || this.hintsShown.has(id)) return; this.hintsShown.add(id); this.pickle.speak(text); },
  npcSay(ent, text) { this.npcBubble = { ent, text, t: 4.5 }; },
  addSlime(x, y) { this.slime.push({ x, y, life: 6 }); if (this.slime.length > 120) this.slime.shift(); },
  slimeAt(x, y) { for (const s of this.slime) if (Math.abs(s.x - x) < 15 && Math.abs(s.y - y) < 6) return true; return false; },
  addCaramel(x, y, on) {
    const p = this.player;
    let plat = on instanceof CaramelPlat ? on : null;
    if (!plat) for (const e of this.ents) if (e.alive && e instanceof CaramelPlat && Math.abs(e.cx - x) < 26 && Math.abs(e.y - y) < 4) { plat = e; break; }
    if (plat) { const wasOn = p.standOn === plat || (p.onGround && Math.abs(p.bottom - plat.y) < 2 && p.x < plat.x + plat.w && p.x + p.w > plat.x); plat.grow(); if (wasOn && plat.stack > 1) p.y -= 14; }
    else this.add(new CaramelPlat(x, y));
  },
  thornAt(x, y, w, h) {
    const L = this.level;
    const c0 = Math.floor(x / T), c1 = Math.floor((x + w) / T), r0 = Math.floor(y / T), r1 = Math.floor((y + h) / T);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (L.get(c, r) === TL.THORN) {
      if (x < c * T + T - 4 && x + w > c * T + 4 && y < r * T + T && y + h > r * T + 14) return true;
    }
    return false;
  },
  hazardNear(p) { return this.thornAt(p.x - 50, p.y, p.w + 100, p.h + 4); },
  collectDrop(n) {
    this.drops += n; this.stats.drops += n;
    if (this.drops >= 100) { this.drops -= 100; this.lives++; Audio2.play('oneup'); this.toast('100 капель — +1 жизнь!'); }
  },
  collectGold(i, src) {
    if (!this.gold[i]) this.stats.goldNew++;
    this.gold[i] = 1; Audio2.play('cherry');
    this.burst(src.cx, src.cy, 18, ['#ffd23a', '#fff6b0', '#ffffff']);
    const n = this.gold.reduce((a, b) => a + b, 0);
    this.add(new TextFx(src.cx, src.y - 10, `Золотая вишенка ${n}/3!`, '#ffe14d'));
    Save.data.cherries[this.levelId] = this.gold.slice(); Save.save();
  },
  openNote(id) {
    Audio2.play('note'); this.stats.notes++;
    Save.data.notes[id] = 1; Save.save();
    if (!Save.data.settings.notes) { this.toast('Записка сохранена'); return; }
    this.setState('note'); Audio2.muffle(true);
    UI.note(NOTES[id], () => { Audio2.muffle(false); this.setState('play'); });
  },
  startBoss() {
    const d = this.def;
    this.bossActive = true; this.boss.begin(this);
    if (!d.airBoss) {
      for (const g of d.gates) g.close();
      for (const e of this.ents) if (e.alive && e.enemy && !e.boss && e.cx > d.arena.x0 - 260) { e.alive = false; this.add(new Poof(e.cx, e.cy, null)); }
      this.cam.minX = d.arena.camMin; this.cam.maxX = d.arena.camMax - this.viewW;
      if (this.cam.maxX < this.cam.minX) { const c = (d.arena.camMin + d.arena.camMax) / 2 - this.viewW / 2; this.cam.minX = this.cam.maxX = c; }
      this.cam.lockY = clamp(d.arena.floor - VIEW_H + 90, 0, this.level.H * T - VIEW_H);
    } else for (const e of this.ents) if (e.alive && e instanceof Gummy && e.cx > this.cam.x + this.viewW * 0.5) e.alive = false;
    Audio2.setRate(d.bossRate);
    this.toast(this.boss.name + '!');
    const H = { 1: 'Капитан Кочан! Не попадайся под него, перепрыгивай. Жди, пока врежется в стену!', 2: 'Луковый Дух! Прыгай ему на голову, когда он выдохнется после рывка, или подлетай с крон.', 4: 'Королева Холодец! Уворачивайся от прыжков, а когда она затрясётся — на корону!' };
    if (H[this.levelId]) this.hint('boss' + this.levelId, H[this.levelId]);
  },
  bossDefeated(boss) {
    this.bossActive = false; Audio2.setRate(this.musicRate);
    for (const g of this.def.gates) g.open();
    this.cam.minX = 0; this.cam.maxX = this.level.W * T - this.viewW; this.cam.lockY = null;
    this.toast(boss.name + ' повержен!');
    const arB = this.def.arena; if (arB) for (const e of this.ents) if (e.alive && e.enemy && !e.boss && e.cx > arB.x0 - 40 && e.cx < arB.x1 + 40) { e.alive = false; this.add(new Poof(e.cx, e.cy, null)); }
    this.shake(0.4);
    this.clearBossShots();
    if (this.def.wallJumpAfter) {
      Save.data.wallJump = true; Save.save();
      if (this.def.exitGate) this.def.exitGate.open();
      this.later(1.3, () => {
        if (this.state !== 'play') return;
        if (!Save.data.settings.hints) { Audio2.play('power'); this.toast('Новое умение: прыжок от стены'); return; }
        this.setState('modal'); Audio2.play('power');
        UI.modal('Новое умение!', 'Прыжок от стены', `Прыгни к стене и в воздухе снова нажми ${Input.label('jump')} — Банни оттолкнётся и подпрыгнет выше. Так можно забраться даже в узкую шахту!`, () => { this.setState('play'); this.pickle.speak('Шар Капитана Безе ждёт наверху — в шахте справа! Прыгай от стены к стене!', 6, true); });
      });
    } else if (this.def.airBoss) {
      this.pickle.speak('Ура! Дирижабль сдулся! Летим дальше — к Шоколадной реке!', 4, true);
      this.later(2.2, () => { if (this.player.state === 'balloon') { this.setState('win'); this.winRide = true; Audio2.play('win'); } });
      return;
    } else if (this.def.final) {
      this.pickle.speak('Мы победили! Котёл Горечи разлетелся конфетти!', 4, true);
      this.player.inv = 99;
      this.later(3, () => { { Save.data.unlocked = Math.max(Save.data.unlocked, 6); Save.data.done[5] = 1; Save.data.cherries[5] = this.gold.slice(); Save.data.sheep[5] = Math.max(Save.data.sheep[5] || 0, this.stats.sheep); Save.save(); UI.finale(true); } });
      return;
    } else this.pickle.speak('Ура! Вон летит шар Капитана Безе — забирайся в корзину!', 5, true);
    if (this.def.wallJumpAfter) this.pickle.speak('Ура! Луковый Дух растаял!', 2, true);
    this.add(new Balloon(this.def.exit.x, this.def.exit.y));
  },
  levelComplete(balloon) {
    this.setState('win'); this.winBalloon = balloon;
    const p = this.player; p.state = 'win'; p.vx = p.vy = 0; if (p.sliding) { p.sliding = false; p.h = 50; }
    Audio2.play('win');
  },
  onPlayerDie() { this.lives--; this.tearsT = 0; },
  afterDeath() {
    if (this.lives <= 0) { this.setState('gameover'); Audio2.muffle(true); UI.gameover(); return; }
    this.respawn();
  },
  respawn() {
    const cp = this.checkpoint || { x: this.def.start.x, y: this.def.start.y };
    const d = this.def;
    if (this.boss && this.boss.hp > 0 && (this.bossActive || (this.boss.alive && this.boss.st !== 'wait'))) {
      this.bossActive = false; this.boss.reset();
      for (const g of d.gates) { g.closed = false; g.solid = null; g.k = 0; }
      if (!d.airBoss) this.add(new BossTrigger(d.arena.x0 + 2 * T));
      for (const e of this.ents) if (e instanceof Leaf || e instanceof Tear || e instanceof OnionRing || e instanceof GarlicBomb || e instanceof BrothBlob || e instanceof StinkCloud || e instanceof ToastPlat) e.alive = false;
      Audio2.setRate(this.musicRate);
    }
    this.flood = null;
    const p = this.player;
    if (p.leech) { p.leech.alive = false; p.leech = null; }
    p.setChar(this, d.startChar || 'banni');
    if (cp.ride) {
      p.hp = p.maxHp; p.glaze = false; p.star = 0; p.inv = 2;
      this.cam.x = this.rideStartX; this.cam.y = d.ride.camY;
      p.enterBalloon(this, { cx: this.cam.x + 220, bottom: d.ride.camY + 360 });
      this.autoscroll = { speed: d.ride.speed, stopX: d.ride.stopX, camY: d.ride.camY }; this.cam.lockY = d.ride.camY;
      Audio2.setRate(1.07); Audio2.muffle(false);
      return;
    }
    p.respawnAt(cp.x, cp.y); p.hp = p.maxHp; p.glaze = false; p.power = null; p.star = 0; p.inv = 2; p.state = 'play';
    this.pickle.reset(cp.x - 40, cp.y);
    this.cam.minX = 0; this.cam.maxX = this.level.W * T - this.viewW; this.cam.lockY = null; this.cam.reset(this, p);
    Audio2.muffle(false);
  },
  // ---------------- update ----------------
  worldUpdate(dt) {
    this.time += dt;
    if (this.timers.length && this.state === 'play') { for (const tm of this.timers) tm.t -= dt; const due = this.timers.filter(tm => tm.t <= 0); this.timers = this.timers.filter(tm => tm.t > 0); for (const tm of due) tm.fn(); }
    const p = this.player;
    this.solids = this.ents.filter(e => e.alive && e.solid);
    for (const e of this.ents) if (e.alive && e.dy !== undefined && !e.enemy) e.update(this, dt);
    p.update(this, dt);
    const cx = this.cam.x + this.viewW / 2, cy = this.cam.y + VIEW_H / 2;
    for (let i = 0; i < this.ents.length; i++) {
      const e = this.ents[i];
      if (!e.alive || (e.dy !== undefined && !e.enemy)) continue;
      if (e.enemy && !e.active) {
        if (Math.abs(e.cx - cx) < this.viewW / 2 + 160 && Math.abs(e.cy - cy) < VIEW_H / 2 + 200) e.active = true; else continue;
      }
      e.update(this, dt);
    }
    this.pickle.update(this, dt);
    // player vs enemies
    if (p.state === 'play' || p.state === 'vine' || p.state === 'balloon') {
      for (const e of this.ents) {
        if (!e.alive || !e.enemy || !e.active || e.frozen > 0) continue;
        if (!overlap(p, e)) continue;
        if (p.star > 0 && e.starKill !== false) { e.kill(this, 'star'); continue; }
        if (p.state === 'play') {
          const above = p.vy > 0 && p.prevBottom <= e.y + Math.min(e.h * 0.5, 18) + 6;
          if (p.pounding && above && (e.stompable || e.onPound)) { if (e.onPound) e.onPound(this, p); else e.kill(this, 'stomp'); continue; }
          if (e.stompable && above) {
            const r = e.onStomp(this, p);
            if (r === 'bounce') { p.stompBounce(); p.airJumps = 1; if (!e.boss) this.collectDrop(1); }
            continue;
          }
          if (e.onTouch && e.onTouch(this, p)) continue;
          if (p.sliding && e.slideable) { e.kill(this, 'slide'); continue; }
        }
        if (e.harmful) { const before = p.inv; p.hurt(this, e); if (e.onHitPlayer && p.inv > before) e.onHitPlayer(this, p); }
      }
    }
    if (this.flood) { this.flood.y = approach(this.flood.y, this.flood.target, 34 * dt); if (this.flood.target > this.def.arena.floor && this.flood.y >= this.flood.target - 1) this.flood = null; }
    if (this.def.bonus && !this.bonusDone && this.state === 'play') this.bonusTime += dt;
    this.ents = this.ents.filter(e => e.alive);
    // fake tiles alpha
    let inside = false;
    for (const [c, r] of this.fakeTiles) if (p.x < (c + 1) * T && p.x + p.w > c * T && p.y < (r + 1) * T && p.y + p.h > r * T) { inside = true; break; }
    this.fakeAlpha = approach(this.fakeAlpha, inside ? 0.28 : 1, dt * 3);
    // particles
    for (const q of this.parts) { q.life -= dt; q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.k === 'dust') { q.vx *= 0.92; q.vy *= 0.92; } }
    this.parts = this.parts.filter(q => q.life > 0);
    if (this.parts.length > 500) this.parts.splice(0, this.parts.length - 500);
    for (const s of this.slime) s.life -= dt;
    this.slime = this.slime.filter(s => s.life > 0);
    for (const t of this.toasts) t.t -= dt;
    this.toasts = this.toasts.filter(t => t.t > 0);
    if (this.npcBubble) { this.npcBubble.t -= dt; if (this.npcBubble.t <= 0) this.npcBubble = null; }
    if (this.tearsT > 0) this.tearsT -= dt;
    if (this.autoscroll) {
      const a = this.autoscroll;
      if (this.cam.x < a.stopX) this.cam.x = Math.min(a.stopX, this.cam.x + a.speed * dt);
      else if (!this.bossActive && this.boss && this.boss.alive && this.boss.st === 'wait' && this.state === 'play') this.startBoss();
      this.cam.y = lerp(this.cam.y, a.camY, 0.1);
      if (this.cam.shake > 0) { this.cam.shake = Math.max(0, this.cam.shake - dt); const m = this.cam.shake * 18; this.cam.sx = rnd(-m, m); this.cam.sy = rnd(-m, m); } else { this.cam.sx = this.cam.sy = 0; }
    } else if (p.state !== 'win') this.cam.update(this, p, dt);
  },
  step(dt) {
    this.stateT += dt;
    switch (this.state) {
      case 'levelIntro':
        this.time += dt; this.pickle.update(this, dt);
        if (this.stateT > 1.8 || (this.stateT > 0.4 && (Input.pressed('confirm') || Input.pressed('jump')))) { this.setState('play'); Input.clear(); }
        break;
      case 'play':
        if (Input.pressed('pause')) { this.pause(); break; }
        if (Input.pressed('skip') && this.pickle) this.pickle.dismiss();
        this.worldUpdate(dt);
        break;
      case 'win': {
        this.worldUpdate(dt);
        if (this.winRide) { const p = this.player; p.x += 220 * dt; p.y -= 90 * dt; if (this.stateT > 3) this.showResults(); break; }
        if (this.winBonus) { if (this.stateT > 2.6) this.showBonusResults(); break; }
        const b = this.winBalloon, p = this.player;
        if (b) { p.x = b.cx - p.w / 2 - 10; p.y = b.bottom - 30 - p.h; p.t += 0; this.pickle.x = b.cx + 4; this.pickle.y = b.bottom - 30 - 46; this.pickle.mode = 'win'; this.pickle.face = -1; this.pickle.rot = 0; this.pickle.pose = 'cheer'; }
        if (this.stateT > 3.2) this.showResults();
        break;
      }
      case 'title': case 'map': case 'pause': case 'note': case 'results': case 'gameover': case 'ending': case 'modal': case 'settings': case 'intro': case 'dialog': case 'finale':
        this.time += dt;
        UI.step(dt);
        break;
    }
  },
  pause() {
    if (this.state !== 'play') return;
    this.setState('pause'); Audio2.muffle(true); UI.pause();
  },
  resume() { Audio2.muffle(false); UI.hide(); this.setState('play'); Input.clear(); },
  showBonusResults() {
    const w = this.winBonus; this.winBonus = null;
    this.setState('results');
    UI.bonusResults({ t: w.t, rec: w.rec, best: Save.data.best.bonus, cherries: this.rcherries, total: this.def.rcherries, pen: this.bonusPenalty });
  },
  showResults() {
    const id = this.levelId, d = this.def;
    const bonus = this.stats.sheep * 10;
    if (typeof id === 'number') Save.data.unlocked = Math.max(Save.data.unlocked, id + 1);
    Save.data.done[id] = 1;
    Save.data.cherries[id] = this.gold.slice();
    const sh = Save.data.sheep[id] || 0; Save.data.sheep[id] = Math.max(sh, this.stats.sheep);
    Save.save();
    this.setState('results'); Audio2.muffle(false);
    UI.results({ name: d.name, sheepName: d.sheepName, drops: this.stats.drops, bonus, gold: this.gold, sheep: this.stats.sheep, sheepMax: d.sheep, enemies: this.stats.enemies, id });
  },
  // ---------------- render ----------------
  render() {
    const S = this.S;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (!this.level || ['title', 'map', 'intro', 'ending', 'boot', 'finale'].includes(this.state) || (this.state === 'settings' && UI.under === 'map')) {
      ctx.setTransform(S, 0, 0, S, 0, 0);
      Scenes.render(ctx, this);
      return;
    }
    this.renderWorld();
  },
  renderWorld() {
    const S = this.S, cam = this.cam;
    const cx = Math.round((cam.x + cam.sx) * S) / S, cy = Math.round((cam.y + cam.sy) * S) / S;
    ctx.setTransform(S, 0, 0, S, 0, 0);
    this.theme.drawBackground(ctx, this, cx, cy, S);
    ctx.setTransform(S, 0, 0, S, -cx * S, -cy * S);
    this.theme.drawLiquid(ctx, this, cx, cy);
    if (this.waters.length) drawWaters(ctx, this, false);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.terrain.draw(ctx, cx, cy, this.viewW, VIEW_H);
    ctx.setTransform(S, 0, 0, S, -cx * S, -cy * S);
    // cave backs
    if (this.fakeTiles.length && this.fakeAlpha < 0.999) {
      ctx.fillStyle = this.theme.id === 1 ? '#b98a98' : '#8a6a9a';
      for (const [c, r] of this.fakeTiles) ctx.fillRect(c * T - 0.5, r * T - 0.5, T + 1, T + 1);
      ctx.fillStyle = 'rgba(60,20,40,0.25)';
      for (const [c, r] of this.fakeTiles) if (hash2(c, r) < 0.3) { ctx.beginPath(); ctx.arc(c * T + 20, r * T + 20, 6, 0, TAU); ctx.fill(); }
    }
    drawDynamicTiles(ctx, this, cx, cy, false);
    if (this.flood) {
      const f = this.flood, t = this.time;
      ctx.fillStyle = 'rgba(222,150,40,0.92)'; ctx.beginPath(); ctx.moveTo(f.x0, f.y + 200);
      for (let x = f.x0; x <= f.x1; x += 20) ctx.lineTo(x, f.y + Math.sin(x * 0.04 + t * 3) * 4);
      ctx.lineTo(f.x1, f.y + 200); ctx.closePath(); ctx.fill();
    }
    // slime
    for (const s of this.slime) { ctx.globalAlpha = Math.min(1, s.life) * 0.75; ell(ctx, s.x, s.y - 1, 15, 3.4); fs(ctx, '#7cd65a'); ctx.globalAlpha *= 0.6; ell(ctx, s.x - 4, s.y - 2, 5, 1.2); fs(ctx, '#e8ffd8'); }
    ctx.globalAlpha = 1;
    // entities by layer
    const vx0 = cx - 160, vx1 = cx + this.viewW + 160, vy0 = cy - 400, vy1 = cy + VIEW_H + 200;
    const vis = this.ents.filter(e => e.alive && e.x + e.w > vx0 && e.x < vx1 && e.y + e.h > vy0 && e.y < vy1 || e.boss);
    const layer = e => e.layer !== undefined ? e.layer : (e instanceof Vine || e instanceof Checkpoint || e instanceof Cage || e instanceof Dripper || e instanceof Gate || e.zone || e instanceof Geyser || e instanceof Whirlpool || e instanceof Misha || e instanceof Spectator || e instanceof Finish) ? 0 : (e.solid && !e.enemy) ? 1 : e instanceof Pickup ? 2 : e.fx ? 5 : (e instanceof CherryPit || e instanceof MintShot) ? 4 : 3;
    const layers = [[], [], [], [], [], []];
    for (const e of vis) layers[layer(e)].push(e);
    for (let i = 0; i <= 2; i++) for (const e of layers[i]) e.draw(ctx, this);
    if (this.winBalloon) { /* balloon drawn in layer 3 */ }
    for (const e of layers[3]) if (!(e instanceof Balloon || e.rideable)) e.draw(ctx, this);
    for (const e of layers[3]) if (e instanceof Balloon || e.rideable) e.draw(ctx, this);
    if (this.state !== 'win') { this.pickle.draw(ctx, this); this.player.draw(ctx, this); }
    else { this.player.draw(ctx, this); this.pickle.draw(ctx, this); for (const e of layers[3]) if (e instanceof Balloon || e.rideable) drawBalloonFront(ctx, e); }
    for (const e of layers[4]) e.draw(ctx, this);
    for (const e of layers[5]) e.draw(ctx, this);
    // particles
    for (const q of this.parts) {
      const a = clamp(q.life / q.max, 0, 1);
      ctx.globalAlpha = a;
      if (q.k === 'spark') sparkle(ctx, q.x, q.y, q.s * (0.5 + a), q.c);
      else if (q.k === 'dust') { circ(ctx, q.x, q.y, q.s * (1.4 - a * 0.4)); fs(ctx, q.c); }
      else { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.r + q.life * 8); ctx.fillStyle = q.c; ctx.fillRect(-q.s, -q.s * 0.45, q.s * 2, q.s * 0.9); ctx.restore(); }
    }
    ctx.globalAlpha = 1;
    drawDynamicTiles(ctx, this, cx, cy, true);
    if (this.waters.length) drawWaters(ctx, this, true);
    if (this.flood) {
      const f = this.flood, t = this.time;
      ctx.fillStyle = 'rgba(222,150,40,0.5)'; ctx.beginPath(); ctx.moveTo(f.x0, f.y + 14);
      for (let x = f.x0; x <= f.x1; x += 20) ctx.lineTo(x, f.y + Math.sin(x * 0.04 + t * 3) * 4);
      ctx.lineTo(f.x1, f.y + 14); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ffd06a'; ctx.lineWidth = 2.5; ctx.beginPath(); for (let x = f.x0; x <= f.x1; x += 20) { const y = f.y + Math.sin(x * 0.04 + t * 3) * 4; x === f.x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
      for (let i = 0; i < 8; i++) { const bx = f.x0 + ((i * 173 + t * 40) % (f.x1 - f.x0)); ctx.fillStyle = 'rgba(255,240,200,0.7)'; ctx.beginPath(); ctx.arc(bx, f.y + 10 + (i % 3) * 8, 3, 0, TAU); ctx.fill(); }
    }
    // fake (secret) tiles in front
    if (this.fakeTiles.length) drawFakeTiles(ctx, this, this.fakeAlpha);
    // bubbles
    this.pickle.drawBubble(ctx, this);
    if (this.npcBubble) drawWorldBubble(ctx, this, this.npcBubble.ent.fx + 4, this.npcBubble.ent.fy - 120, this.npcBubble.text, Math.min(1, this.npcBubble.t * 3), '#9a6a2a');
    // screen space
    ctx.setTransform(S, 0, 0, S, 0, 0);
    HUD.draw(ctx, this);
    if (this.state === 'levelIntro') HUD.levelCard(ctx, this);
    canvas.style.filter = this.tearsT > 0 ? `blur(${(Math.min(1, this.tearsT) * 2.6 * this.displayScale).toFixed(2)}px)` : '';
  }
};
function drawBalloonFront(g, b) {
  if (b.drawFront) return b.drawFront(g);
  // redraw basket over the riders
  g.save(); g.translate(b.cx, b.bottom);
  g.beginPath(); g.moveTo(-26, -34); g.lineTo(26, -34); g.lineTo(20, 0); g.lineTo(-20, 0); g.closePath(); fs(g, '#e8b46a', '#9a6a2a', 2.4);
  g.save(); g.clip(); for (let i = -6; i < 8; i++) { line(g, -30 + i * 8, -36, -30 + i * 8 + 30, 2, 'rgba(150,100,40,0.5)', 1.3); line(g, -30 + i * 8 + 30, -36, -30 + i * 8, 2, 'rgba(150,100,40,0.5)', 1.3); } g.restore();
  rrect(g, -28, -38, 56, 7, 3); fs(g, '#c98b4e', '#7a4a1e', 1.6);
  g.restore();
}
function drawWorldBubble(g, G, x, y, text, a, col) {
  g.save(); g.globalAlpha = a; g.font = '800 14px Nunito, sans-serif';
  const lines = wrapText(g, text, 220), lh = 18;
  const w = Math.max(...lines.map(l => g.measureText(l).width)) + 20, h = lines.length * lh + 12;
  const bx = clamp(x - w / 2, G.cam.x + 6, G.cam.x + G.viewW - w - 6), by = Math.max(G.cam.y + 56, y - h);
  rrect(g, bx, by, w, h, 10); fs(g, 'rgba(255,250,240,0.97)', col, 2.2);
  g.fillStyle = '#5a3a1a'; g.textAlign = 'left'; g.textBaseline = 'top';
  lines.forEach((l, i) => g.fillText(l, bx + 10, by + 7 + i * lh));
  g.restore();
}

// ---------------- HUD ----------------
const HUD = {
  panel(g, x, y, w, h) { rrect(g, x, y, w, h, 14); fs(g, 'rgba(255,248,236,0.88)', 'rgba(122,74,30,0.55)', 2); },
  text(g, s, x, y, size, col, align) {
    g.font = `900 ${size}px Nunito, sans-serif`; g.textAlign = align || 'left'; g.textBaseline = 'middle';
    g.lineWidth = Math.max(3, size / 5); g.strokeStyle = '#fff8ec'; g.lineJoin = 'round'; g.strokeText(s, x, y); g.fillStyle = col || '#6a3214'; g.fillText(s, x, y);
  },
  drawBonus(g, G) {
    const p = G.player, W = G.viewW, t = G.bonusTime + G.bonusPenalty;
    this.panel(g, 10, 10, 190, 46); this.text(g, '⏱ ' + fmtTime(t), 24, 33, 22, '#6a3214');
    const kmh = Math.round(Math.abs(p.vx) * 0.62);
    this.panel(g, W / 2 - 80, 10, 160, 46); this.text(g, kmh + ' км/ч', W / 2, 33, 22, p.boostT > 0 ? '#e2363c' : '#6a3214', 'center');
    const px0 = W - 160 - (Touch.visible ? 56 : 0);
    this.panel(g, px0, 10, 150, 46); drawGoldCherry(g, px0 + 28, 35, G.time); this.text(g, `${G.rcherries}/${G.def.rcherries}`, px0 + 52, 33, 22, '#6a3214');
    if (Save.data.best.bonus) this.text(g, 'Рекорд ' + fmtTime(Save.data.best.bonus), 14, 74, 14, '#fff6e0');
  },
  draw(g, G) {
    const p = G.player, W = G.viewW;
    if (G.def.bonus) return this.drawBonus(g, G);
    // lives + ripeness
    this.panel(g, 10, 10, 214, 46);
    g.save(); g.translate(28, 52); g.scale(0.42, 0.42); if (p.char === 'pickle') drawPickle(g, { x: 0, y: 0, face: 1, t: G.time, sx: 1.2, sy: 1.2 }); else drawBanniBody(g, { t: G.time, hp: Math.max(1, p.hp), pose: 'idle', glaze: p.glaze, power: p.power }); g.restore();
    this.text(g, '×' + Math.max(0, G.lives), 46, 33, 20);
    const mh = p.maxHp;
    for (let i = 0; i < mh; i++) {
      const on = i < p.hp, x = 92 + i * (mh > 3 ? 14 : 20), y = 33;
      const col = p.hp <= 1 ? '#c98b2a' : p.hp === 2 ? '#e8c040' : '#ffe14d';
      ell(g, x, y, mh > 3 ? 5 : 7, 9, 0.35); fs(g, on ? col : 'rgba(150,120,90,0.25)', on ? '#a86e12' : 'rgba(150,120,90,0.4)', 1.6);
    }
    drawDrop(g, 172, 33, 0, 1); this.text(g, String(G.drops).padStart(2, '0'), 184, 33, 19);
    // cherries
    const cw = 120, cx0 = W / 2 - cw / 2;
    this.panel(g, cx0, 10, cw, 46);
    for (let i = 0; i < 3; i++) {
      if (G.gold[i]) drawGoldCherry(g, cx0 + 24 + i * 36, 35, G.time * 0.3);
      else { g.globalAlpha = 0.28; drawCherryPair(g, cx0 + 24 + i * 36, 33, '#9a8a7a'); g.globalAlpha = 1; }
    }
    // boat parts (World 2)
    if (G.def.boatParts) {
      this.panel(g, cx0 + 10, 60, cw - 20, 30);
      for (let i = 0; i < G.def.boatParts; i++) { g.globalAlpha = i < G.boatParts ? 1 : 0.3; drawBoatPart(g, cx0 + 34 + i * 26, 75, { i, t: 0 }); }
      g.globalAlpha = 1;
    }
    // power-ups
    const icons = [];
    if (p.glaze) icons.push('glaze');
    if (p.helmet) icons.push('helmet');
    if (p.armor) icons.push('armor');
    if (p.power) icons.push(p.power);
    if (p.star > 0) icons.push('star');
    const pw = 60 + icons.length * 40, px0 = W - pw - 10 - (Touch.visible ? 56 : 0);
    this.panel(g, px0, 10, pw, 46);
    // pickle icon with cooldown
    const pk = G.pickle, ready = pk.mode === 'follow' && pk.cd <= 0;
    g.save(); g.globalAlpha = ready || pk.asBanni ? 1 : 0.35;
    if (pk.asBanni) { g.translate(px0 + 28, 52); g.scale(0.4, 0.4); drawBanniBody(g, { t: G.time, hp: Math.max(1, p.hp), pose: 'idle' }); }
    else drawPickle(g, { x: px0 + 28, y: 52, face: 1, t: G.time, sx: 0.62, sy: 0.62 });
    g.restore();
    if (G.def.swap) { g.font = '900 11px Nunito'; g.textAlign = 'center'; g.fillStyle = '#6a3214'; g.fillText('⇄ ' + Input.label('swap'), px0 + 28, 66); }
    if (!ready && pk.cd > 0) { g.beginPath(); g.moveTo(px0 + 28, 33); g.arc(px0 + 28, 33, 15, -Math.PI / 2, -Math.PI / 2 + TAU * (pk.cd / 1.4)); g.closePath(); fs(g, 'rgba(255,255,255,0.5)'); }
    icons.forEach((k, i) => drawPowerIcon(g, k, px0 + 70 + i * 40, 33, G.time, 1));
    if (p.star > 0) { g.fillStyle = '#6a3214'; g.font = '900 11px Nunito'; g.textAlign = 'center'; g.fillText(Math.ceil(p.star), px0 + 70 + (icons.length - 1) * 40, 52); }
    // boss bar
    if (G.bossActive && G.boss && G.boss.st !== 'wait') {
      const b = G.boss, bw = Math.min(360, W - 60), bx = W / 2 - bw / 2, by = VIEW_H - 46;
      this.panel(g, bx - 8, by - 22, bw + 16, 50);
      this.text(g, b.name, W / 2, by - 6, 16, '#5a2c12', 'center');
      rrect(g, bx, by + 6, bw, 12, 6); fs(g, 'rgba(90,40,20,0.25)');
      const k = Math.max(0, b.hp) / b.maxHp;
      if (k > 0) { rrect(g, bx, by + 6, bw * k, 12, 6); fs(g, b instanceof OnionGhost ? '#b27ad6' : '#7ac04a'); }
      for (let i = 1; i < b.maxHp; i++) line(g, bx + bw * i / b.maxHp, by + 6, bx + bw * i / b.maxHp, by + 18, 'rgba(255,255,255,0.8)', 2);
    }
    // toasts
    let ty = 86;
    for (const t of G.toasts) {
      g.globalAlpha = Math.min(1, t.t * 2, (2.4 - t.t) * 6);
      this.text(g, t.text, W / 2, ty, 24, '#e2363c', 'center'); ty += 32;
    }
    g.globalAlpha = 1;
    // tears overlay
    if (G.tearsT > 0) {
      const a = Math.min(1, G.tearsT);
      g.fillStyle = `rgba(120,180,255,${0.16 * a})`; g.fillRect(0, 0, W, VIEW_H);
      for (let i = 0; i < 10; i++) { const x = (i * 97 + 30) % W, y = ((G.time * 160 + i * 71) % (VIEW_H + 40)) - 20; g.globalAlpha = 0.6 * a; ell(g, x, y, 5, 9); fs(g, '#bfe6ff'); }
      g.globalAlpha = 1;
    }
  },
  levelCard(g, G) {
    const k = clamp(G.stateT * 3, 0, 1) * clamp((1.8 - G.stateT) * 3, 0, 1);
    g.save(); g.globalAlpha = k;
    const W = G.viewW;
    rrect(g, W / 2 - 230, VIEW_H / 2 - 70, 460, 120, 26); fs(g, 'rgba(255,248,236,0.95)', '#c98b4e', 4);
    this.text(g, 'Уровень ' + levelInfo(G.levelId).num, W / 2, VIEW_H / 2 - 36, 22, '#c97a3a', 'center');
    this.text(g, G.def.name, W / 2, VIEW_H / 2 + 6, 40, '#6a3214', 'center');
    g.restore();
  }
};

function fmtTime(t) { const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2); }
// ---------------- Scenes (title, map, cutscenes) ----------------
const Scenes = {
  t: 0,
  render(g, G) {
    const W = G.viewW;
    this.t = G.time;
    if (G.state === 'map' || (UI.under === 'map' && (G.state === 'settings' || G.state === 'modal'))) return this.map(g, G);
    if (G.state === 'intro') return this.intro(g, G);
    if (G.state === 'finale') return this.finale(g, G);
    if (G.state === 'ending') return this.ending(g, G);
    this.title(g, G);
  },
  groundStrip(g, W, y, t, th) {
    const off = (t * 220) % 80;
    g.beginPath(); g.moveTo(0, VIEW_H); g.lineTo(0, y);
    for (let x = -off; x <= W + 80; x += 40) g.lineTo(x, y + Math.sin((x + t * 220) * 0.03) * 3);
    g.lineTo(W, VIEW_H); g.closePath(); fs(g, th === 2 ? '#fde6f0' : '#f9c4d1');
    g.beginPath(); g.moveTo(0, y - 2);
    for (let x = -off; x <= W + 80; x += 40) g.lineTo(x, y - 2 + Math.sin((x + t * 220) * 0.03) * 3);
    g.lineTo(W, y + 14); g.lineTo(0, y + 14); g.closePath(); fs(g, th === 2 ? '#f7a9c9' : '#fffaf0');
    for (let i = 0; i < 30; i++) { const x = ((i * 53 - t * 220) % (W + 60) + W + 60) % (W + 60) - 30; g.save(); g.translate(x, y + 6); g.rotate(i); g.fillStyle = SPRINKLES[i % 6]; g.fillRect(-4, -1.2, 8, 2.4); g.restore(); }
  },
  title(g, G) {
    const W = G.viewW, t = this.t;
    THEME1.drawBackground(g, { viewW: W, time: t }, t * 90, 40, G.S);
    this.groundStrip(g, W, 440, t, 1);
    drawBanni(g, { x: W / 2 - 40, y: 442, face: 1, sx: 1, sy: 1, pose: 'run', phase: t * 13, t, hp: 3, scale: 1.4 });
    drawPickle(g, { x: W / 2 - 150, y: 442, face: 1, pose: 'run', phase: t * 13 + 1, t, sx: 1.3, sy: 1.3 });
    drawSprout(g, W / 2 + 180 + Math.sin(t) * 10, 442, { t, face: -1 });
    drawDrop(g, W / 2 + 90, 360 + Math.sin(t * 3) * 6, t * 3, 1.3);
    // logo
    g.save(); g.translate(W / 2, 112 + Math.sin(t * 1.5) * 4);
    const ttl = 'Банни и Крошка';
    g.font = '900 68px Nunito, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineJoin = 'round'; g.lineWidth = 16; g.strokeStyle = '#6a3214'; g.strokeText(ttl, 0, 0);
    g.lineWidth = 8; g.strokeStyle = '#fff6e0'; g.strokeText(ttl, 0, 0);
    const gr = g.createLinearGradient(0, -34, 0, 34); gr.addColorStop(0, '#ffe766'); gr.addColorStop(1, '#f5a623'); g.fillStyle = gr; g.fillText(ttl, 0, 0);
    g.font = '900 30px Nunito, sans-serif'; g.lineWidth = 8; g.strokeStyle = '#6a3214'; g.strokeText('Путь через Сплит', 0, 58);
    g.fillStyle = '#ffb3cf'; g.fillText('Путь через Сплит', 0, 58);
    g.restore();
  },
  intro(g, G) {
    if (UI.introWorld > 1 && typeof drawWorldIntro === 'function') return drawWorldIntro(g, G, UI.introWorld, UI.introIdx, this);
    const sc = UI.introIdx, t = G.stateT, W = G.viewW;
    const drawSky = (a, b) => { const gr = g.createLinearGradient(0, 0, 0, VIEW_H); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, W, VIEW_H); };
    switch (sc) {
      case 0: {
        THEME1.drawBackground(g, { viewW: W, time: t }, t * 15, 40, G.S);
        this.groundStrip(g, W, 400, 0, 1);
        for (let i = 0; i < 3; i++) this.palm(g, 120 + i * (W - 240) / 2, 400, t + i);
        drawBanni(g, { x: W / 2 - 50, y: 402, face: 1, sx: 1, sy: 1, pose: 'win', t, hp: 3, scale: 1.5 });
        drawPickle(g, { x: W / 2 + 60, y: 402, face: -1, pose: 'talk', t, sx: 1.4, sy: 1.4 });
        break;
      }
      case 1: {
        drawSky('#ffe0ec', '#ffd2a8');
        this.groundStrip(g, W, 410, 0, 2);
        this.house(g, W / 2 + 60, 410, t);
        drawCookieGirl(g, W / 2 - 150, 412, { t, s: 1.3 });
        for (let i = 0; i < 3; i++) { const x = W / 2 - 260 + i * 40, y = 180 + Math.sin(t * 2 + i) * 8; line(g, x, y + 20, x + 4, y + 90, '#fff', 1.2); circ(g, x, y, 20); fs(g, FLAV[['pink', 'mint', 'van'][i]][0], 'rgba(150,90,90,0.5)', 2); }
        break;
      }
      case 2: {
        drawSky('#1d2a4a', '#4a3a6a');
        circ(g, W - 140, 110, 44); fs(g, '#fff6d0'); circ(g, W - 124, 100, 40); fs(g, '#2a3256');
        for (let i = 0; i < 30; i++) sparkle(g, (i * 137) % W, (i * 71) % 260, 1.5 + (i % 3), 'rgba(255,255,255,0.8)');
        g.beginPath(); g.moveTo(0, VIEW_H); g.quadraticCurveTo(W * 0.3, 360, W * 0.55, 400); g.quadraticCurveTo(W * 0.8, 440, W, 380); g.lineTo(W, VIEW_H); g.closePath(); fs(g, '#2a3a2a');
        drawBaron(g, W * 0.32, 392, { t, s: 1.6 });
        for (let i = 0; i < 6; i++) this.wind(g, W * 0.4 + ((t * 300 + i * 160) % (W * 0.8)), 160 + i * 40, t + i, '#9fd27e');
        break;
      }
      case 3: {
        drawSky('#5a6a8a', '#a8b8c8');
        for (let i = 0; i < 9; i++) this.wind(g, ((t * 420 + i * 140) % (W + 200)) - 100, 80 + (i * 53) % 380, t * 2 + i, 'rgba(220,240,210,0.8)');
        g.save(); const bx = W + 80 - ((t * 260) % (W + 200)); g.translate(bx, 230 + Math.sin(t * 3) * 40); g.rotate(-t * 5);
        drawBanni(g, { x: 0, y: 40, face: -1, sx: 1, sy: 1, pose: 'fall', t, hp: 3, scale: 1.3, hurt: true }); g.restore();
        break;
      }
      case 4: {
        THEME1.drawBackground(g, { viewW: W, time: t }, 300 + t * 10, 40, G.S);
        this.groundStrip(g, W, 410, 0, 1);
        drawBanni(g, { x: W / 2 - 30, y: 412, face: -1, sx: 1, sy: 1, pose: 'idle', t, hp: 3, scale: 1.5 });
        drawPickle(g, { x: W / 2 - 130, y: 412, face: 1, pose: 'talk', t, sx: 1.45, sy: 1.45 });
        g.save(); g.translate(W - 190, 260); g.scale(0.6, 0.6); this.bowl(g, 0, 0, t, -1); g.restore();
        break;
      }
    }
  },
  ending(g, G) {
    const W = G.viewW, t = G.stateT;
    const gr = g.createLinearGradient(0, 0, 0, VIEW_H); gr.addColorStop(0, '#ffb86a'); gr.addColorStop(0.6, '#ffd9a0'); gr.addColorStop(1, '#ffeccc');
    g.fillStyle = gr; g.fillRect(0, 0, W, VIEW_H);
    for (let i = 0; i < 7; i++) { const x = ((i * 220 - t * 30) % (W + 300) + W + 300) % (W + 300) - 150, y = 330 + (i % 3) * 50; for (let k = 0; k < 4; k++) { circ(g, x + k * 34, y - (k % 2) * 12, 30); fs(g, 'rgba(255,255,255,0.9)'); } }
    const bx = W * 0.27, by = 400 + Math.sin(t * 1.5) * 10;
    drawBalloon(g, bx, by, { t });
    drawBanni(g, { x: bx - 12, y: by - 30, face: 1, sx: 1, sy: 1, pose: 'win', t, hp: 3 });
    drawPickle(g, { x: bx + 4, y: by - 30, face: -1, pose: 'cheer', t });
    drawBalloonFront(g, { cx: bx, bottom: by });
  },
  palm(g, x, y, t) {
    g.save(); g.translate(x, y);
    g.beginPath(); g.moveTo(-8, 0); g.quadraticCurveTo(-4, -80, 6, -160); g.lineTo(14, -160); g.quadraticCurveTo(6, -80, 8, 0); g.closePath(); fs(g, '#c98b4e', '#7a4a1e', 2);
    for (let i = 0; i < 5; i++) { g.save(); g.translate(10, -160); g.rotate(-2.6 + i * 0.6 + Math.sin(t + i) * 0.05); ell(g, 40, 0, 44, 11); fs(g, '#7ac04a', '#3a7a2a', 2); g.restore(); }
    for (let i = 0; i < 4; i++) { g.save(); g.translate(4 + i * 5, -146 + (i % 2) * 6); g.rotate(0.4 - i * 0.2); ell(g, 0, 8, 4, 12); fs(g, '#ffe14d', '#a86e12', 1.2); g.restore(); }
    g.restore();
  },
  house(g, x, y, t) {
    g.save(); g.translate(x, y);
    rrect(g, -110, -150, 220, 150, 10); fs(g, '#e8b46a', '#9a6a2a', 3);
    g.save(); rrect(g, -110, -150, 220, 150, 10); g.clip();
    for (let i = -12; i < 14; i++) { line(g, -120 + i * 18, -160, -120 + i * 18 + 160, 10, 'rgba(150,100,40,0.45)', 2); line(g, -120 + i * 18 + 160, -160, -120 + i * 18, 10, 'rgba(150,100,40,0.45)', 2); }
    g.restore();
    g.beginPath(); g.moveTo(-136, -146); g.lineTo(0, -240); g.lineTo(136, -146); g.closePath(); fs(g, '#6a3a1e', '#3a1a0a', 3);
    g.beginPath(); g.moveTo(-136, -146); for (let i = 0; i <= 12; i++) { const xx = -136 + i * 272 / 12; g.lineTo(xx, -146 + (i % 2 ? 16 + Math.sin(t * 2 + i) * 2 : 0)); } g.lineTo(0, -200); g.closePath(); fs(g, '#8a4a22');
    rrect(g, -24, -80, 48, 80, 20); fs(g, '#ff9fc8', '#b03070', 2.4);
    for (const wx of [-74, 74]) { rrect(g, wx - 20, -120, 40, 36, 8); fs(g, '#fff6c8', '#9a6a2a', 2); }
    drawCherryPair(g, 60, -226);
    g.restore();
  },
  wind(g, x, y, t, col) {
    g.save(); g.translate(x, y); g.strokeStyle = col; g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-60, 0); g.bezierCurveTo(-20, -20 * Math.sin(t), 20, 20, 50, 0); g.arc(50, -14, 14, Math.PI / 2, Math.PI * 2.2); g.stroke();
    g.restore();
  },
  bowl(g, x, y, t, sel) {
    // tall sundae glass with five layers + waffle house on top
    g.save(); g.translate(x, y);
    const layers = [['#f9c4d1', '#ffe5ee'], ['#d9c2f5', '#f9d6ea'], ['#f2b33d', '#ffd88a'], ['#6a3a1e', '#a0603a'], ['#6a6a7a', '#9a8a7a']];
    const H = 340, Wt = 230, Wb = 150;
    // glass body
    g.beginPath(); g.moveTo(-Wt / 2, -H); g.lineTo(Wt / 2, -H); g.quadraticCurveTo(Wb / 2 + 20, -40, 20, 0); g.lineTo(-20, 0); g.quadraticCurveTo(-Wb / 2 - 20, -40, -Wt / 2, -H); g.closePath();
    g.save(); g.clip();
    for (let i = 0; i < 5; i++) {
      const y0 = -i * (H / 5) - H / 5, h = H / 5;
      const gr = g.createLinearGradient(0, y0, 0, y0 + h); gr.addColorStop(0, layers[i][1]); gr.addColorStop(1, layers[i][0]);
      g.fillStyle = gr; g.fillRect(-Wt, y0, Wt * 2, h + 1);
      g.beginPath(); g.moveTo(-Wt, y0 + 4); for (let k = 0; k <= 12; k++) g.lineTo(-Wt + k * Wt / 6, y0 + 4 + Math.sin(k * 1.7 + t + i) * 4); g.lineTo(Wt, y0 - 6); g.lineTo(-Wt, y0 - 6); g.closePath(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fill();
    }
    g.restore();
    g.beginPath(); g.moveTo(-Wt / 2, -H); g.quadraticCurveTo(-Wb / 2 - 20, -40, -20, 0); g.moveTo(Wt / 2, -H); g.quadraticCurveTo(Wb / 2 + 20, -40, 20, 0);
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 5; g.stroke(); g.strokeStyle = 'rgba(120,150,180,0.6)'; g.lineWidth = 2; g.stroke();
    rrect(g, -16, 0, 32, 40, 6); fs(g, 'rgba(220,240,255,0.8)', 'rgba(120,150,180,0.6)', 2);
    ell(g, 0, 44, 70, 12); fs(g, 'rgba(220,240,255,0.9)', 'rgba(120,150,180,0.6)', 2);
    // whipped cream & house
    for (let i = 0; i < 7; i++) { circ(g, -Wt / 2 + 18 + i * (Wt - 36) / 6, -H - 6, 22); fs(g, '#fffaf2'); }
    g.save(); g.translate(30, -H - 20); g.scale(0.32, 0.32); this.house(g, 0, 0, t); g.restore();
    drawCherryPair(g, -50, -H - 30);
    g.restore();
  },
  mapRect(W) { const [mw, mh] = UI.world().mapSize || [1376, 768], areaH = VIEW_H - 112; const sc = Math.min(W / mw, areaH / mh); return { s: sc, x: (W - mw * sc) / 2, y: 4, w: mw * sc, h: mh * sc }; },
  mapNodes(W) { const r = this.mapRect(W); return UI.world().levels.map(i => ({ x: r.x + i.node[0] * r.s, y: r.y + i.node[1] * r.s })); },
  pill(g, x, y, text, size, col, bg) {
    g.font = `900 ${size}px Nunito, sans-serif`; const w = g.measureText(text).width + size * 1.1, h = size * 1.6;
    rrect(g, x - w / 2, y - h / 2, w, h, h / 2); fs(g, bg || 'rgba(255,248,236,0.92)', 'rgba(106,50,20,0.7)', 1.6);
    g.fillStyle = col || '#6a3214'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x, y + 1);
  },
  map(g, G) {
    const W = G.viewW, t = this.t, r = this.mapRect(W);
    g.fillStyle = '#17110f'; g.fillRect(0, 0, W, VIEW_H);
    for (let i = 0; i < 30; i++) { g.globalAlpha = 0.4 + Math.sin(t * 2 + i) * 0.3; sparkle(g, (i * 97) % W, (i * 61) % (VIEW_H - 110), 1.5 + (i % 3), '#fff6d0'); }
    g.globalAlpha = 1;
    const w = UI.world(), img = ASSETS[w.map];
    if (img) g.drawImage(img, r.x, r.y, r.w, r.h);
    else if (w.mapBg) {
      const gr = g.createLinearGradient(0, r.y, 0, r.y + r.h); gr.addColorStop(0, w.mapBg[0]); gr.addColorStop(1, w.mapBg[1]);
      rrect(g, r.x, r.y, r.w, r.h, 24 * r.s); fs(g, gr, 'rgba(74,36,16,0.6)', 3);
    }
    const fsz = Math.max(10, Math.round(22 * r.s));
    // map art may carry its own captions; without art, captions are drawn under the nodes
    w.levels.forEach((info) => { const lb = info.label || (img ? null : [info.node[0], info.node[1] + 44]); if (lb) this.pill(g, r.x + lb[0] * r.s, r.y + lb[1] * r.s, info.name, fsz, info.bonus ? '#a03a7a' : '#6a3214'); });
    if (w.titlePill) this.pill(g, r.x + r.w / 2, r.y + r.h - 26 * r.s, w.titlePill, Math.round(fsz * 1.3), '#b03070', 'rgba(255,240,250,0.95)');
    const nodes = this.mapNodes(W);
    nodes.forEach((n, i) => {
      const info = w.levels[i], un = UI.levelUnlocked(info), sel = UI.mapSel === i, done = Save.data.done[info.id];
      const rr = (sel ? 17 : 14) * Math.max(0.8, r.s * 1.6);
      if (sel) { circ(g, n.x, n.y, rr + 7 + Math.sin(t * 5) * 2); fs(g, 'rgba(255,255,255,0.75)'); }
      circ(g, n.x, n.y, rr); fs(g, !un ? '#9a8f88' : info.bonus ? '#ff7ac0' : done ? '#7ac04a' : '#ffcf4a', '#4a2410', 2.6);
      g.font = `900 ${Math.round(rr * 1.05)}px Nunito`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = un ? '#4a2410' : '#5a5250';
      g.fillText(!un ? '🔒' : info.bonus ? '★' : String(i + 1), n.x, n.y + 1);
    });
    const sn = nodes[UI.mapSel];
    if (w.cursor === 'boat' && typeof drawMapBoat === 'function') drawMapBoat(g, sn.x - 36, sn.y + 30, r.s, t);
    else { g.save(); g.translate(sn.x - 40, sn.y + 34); g.scale(0.34, 0.34); drawBalloon(g, 0, Math.sin(t * 2) * 6, { t, captain: true }); g.restore(); }
  },
  finale(g, G) {
    const W = G.viewW, t = G.stateT, k = UI.finIdx;
    const confetti = (n) => { for (let i = 0; i < n; i++) { const x = (i * 97 + Math.sin(i) * 40) % W, y = ((t * (60 + (i % 5) * 20) + i * 53) % (VIEW_H + 40)) - 20; g.save(); g.translate(x, y); g.rotate(t * 3 + i); g.fillStyle = SPRINKLES[i % 6]; g.fillRect(-5, -2, 10, 4); g.restore(); } };
    if (k <= 1) {
      g.fillStyle = '#1e1a18'; g.fillRect(0, 0, W, VIEW_H);
      parallaxImage(g, ASSETS.bg5, 400, 0.12, -40, VIEW_H * 1.2, W);
      g.fillStyle = 'rgba(255,200,120,0.15)'; g.fillRect(0, 0, W, VIEW_H);
      g.fillStyle = '#3a2a2a'; g.fillRect(0, 440, W, 100); g.fillStyle = '#8a8e96'; g.fillRect(0, 436, W, 8);
      g.save(); g.translate(W * 0.72, 470); g.scale(0.7, 0.7); g.rotate(0.12); drawCauldronBot(g, 0, 0, { t: 0, valves: [], lidOpen: true, baron: false }); g.restore();
      drawBaron(g, W * 0.5, 448, { t, s: 1.4 });
      if (k === 1) {
        drawBanni(g, { x: W * 0.32, y: 448, face: 1, sx: 1, sy: 1, pose: 'idle', t, hp: 3, scale: 1.5 });
        drawPickle(g, { x: W * 0.2, y: 448, face: 1, pose: 'idle', t, sx: 1.4, sy: 1.4 });
        drawMisha(g, W * 0.1, 448, { t, face: 1, s: 1.3, wave: true });
      }
      confetti(k === 0 ? 70 : 40);
    } else {
      const img = ASSETS.party;
      if (img) {
        const sc = Math.max(W / img.width, VIEW_H / img.height), ox = (W - img.width * sc) / 2, oy = (VIEW_H - img.height * sc) / 2;
        g.drawImage(img, ox, oy, img.width * sc, img.height * sc);
        g.save(); g.translate(ox, oy); g.scale(sc, sc);
        g.beginPath(); g.moveTo(760, 260); g.lineTo(1090, 275); g.lineTo(1090, 350); g.quadraticCurveTo(925, 400, 760, 358); g.closePath();
        const gr = g.createLinearGradient(0, 260, 0, 390); gr.addColorStop(0, '#fffaf0'); gr.addColorStop(1, '#f4dfb8'); fs(g, gr, '#b07a3a', 3);
        g.save(); g.translate(925, 312); g.rotate(0.035); g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = '900 38px Nunito, sans-serif'; g.lineJoin = 'round'; g.lineWidth = 7; g.strokeStyle = '#6a3214'; g.strokeText('Банана-сплит', 0, -18); g.fillStyle = '#ffb02a'; g.fillText('Банана-сплит', 0, -18);
        g.font = '900 32px Nunito, sans-serif'; g.strokeText('вечеринка!', 0, 22); g.fillStyle = '#ff6fa8'; g.fillText('вечеринка!', 0, 22);
        g.restore(); g.restore();
      }
      confetti(50);
      if (k === 3) { g.save(); g.globalAlpha = Math.min(1, t); HUD.text(g, 'Конец!', W / 2, VIEW_H - 70, 64, '#ff6fa8', 'center'); g.restore(); }
    }
  }
};
// ---------------- UI (HTML overlays) ----------------
const UI = {
  root: document.getElementById('ui'), el: null, cur: null, focus: 0, under: null, introIdx: 0, mapSel: 0, worldIdx: 0, onBack: null,
  html(id, inner, cls) {
    this.root.innerHTML = `<div class="scr ${cls || ''}" id="scr-${id}">${inner}</div>`;
    this.el = this.root.firstChild; this.cur = id; this.focus = 0; this.onBack = null;
    this.el.querySelectorAll('button').forEach((b, i) => {
      b.addEventListener('click', ev => { ev.stopPropagation(); Audio2.unlock(); Audio2.play('select'); });
      b.addEventListener('pointerenter', () => { const bs = this.btns(); const k = bs.indexOf(b); if (k >= 0) { this.focus = k; this.paint(); } });
    });
    this.paint();
  },
  hide() { this.root.innerHTML = ''; this.el = null; this.cur = null; },
  btns() { return this.el ? [...this.el.querySelectorAll('button:not([disabled])')] : []; },
  paint() { const bs = this.btns(); bs.forEach((b, i) => b.classList.toggle('foc', i === this.focus)); },
  step(dt) {
    if (!this.el) return;
    const bs = this.btns();
    if (this.cur === 'map') {
      if (Input.pressed('swap')) { this.switchWorld(); return; }
      if (Input.pressed('right') || Input.pressed('up')) this.setMap(Math.min(this.world().levels.length - 1, this.mapSel + 1));
      if (Input.pressed('left') || Input.pressed('down')) this.setMap(Math.max(0, this.mapSel - 1));
      if (Input.pressed('confirm') && !this.el.querySelector('#m-play')) { Input.clear(); Audio2.play('bump'); return; }
    } else if (bs.length) {
      if (Input.pressed('down') || Input.pressed('right')) { this.focus = (this.focus + 1) % bs.length; this.paint(); Audio2.play('select'); }
      if (Input.pressed('up') || Input.pressed('left')) { this.focus = (this.focus - 1 + bs.length) % bs.length; this.paint(); Audio2.play('select'); }
    }
    if (Input.pressed('confirm') && bs[this.focus]) { const b = bs[this.focus]; Input.clear(); b.click(); return; }
    if (Input.pressed('back') && this.onBack) { Input.clear(); this.onBack(); }
  },
  // ---- screens ----
  title() {
    G.setState('title'); this.under = 'title'; Audio2.music(1);
    const has = Save.data.unlocked > 1 || Save.data.introSeen;
    this.html('title', `
      <div class="menu bottom">
        <button id="b-play">${has ? 'Продолжить' : 'Играть'}</button>
        ${has ? '<button id="b-new">Новая игра</button>' : ''}
        <button id="b-set">Настройки</button>
      </div>
      <div class="foot">Музыка: «Morning Adventure» · ${IS_TOUCH ? 'Сенсорное управление' : 'Клавиатура или геймпад'}</div>`);
    this.el.querySelector('#b-play').onclick = () => { if (!Save.data.introSeen) this.intro(); else this.map(undefined, Save.data.world); };
    const bn = this.el.querySelector('#b-new');
    if (bn) bn.onclick = () => this.confirm('Начать заново?', 'Прогресс (открытые уровни и вишенки) будет стёрт.', () => { Save.reset(); Audio2.music(1); this.intro(); }, () => this.title());
    this.el.querySelector('#b-set').onclick = () => this.settings(() => this.title());
  },
  settings(back) {
    const prevState = G.state; G.setState('settings');
    const s = Save.data.settings;
    const render = () => {
      this.html('settings', `
        <div class="card wide"><h2>Настройки</h2>
        <div class="menu grid">
          <button id="s-mus">Музыка: ${Math.round(s.music * 100)}%</button>
          <button id="s-sfx">Звуки: ${Math.round(s.sfx * 100)}%</button>
          <button id="s-easy">Лёгкий режим: ${s.easy ? 'вкл' : 'выкл'}</button>
          <button id="s-touch">Сенсорные кнопки: ${{ auto: 'авто', on: 'вкл', off: 'выкл' }[s.touch]}</button>
          <button id="s-hints">Подсказки: ${s.hints ? 'вкл' : 'выкл'}</button>
          <button id="s-notes">Записки: ${s.notes ? 'вкл' : 'выкл'}</button>
          <button id="s-full">Во весь экран</button>
          <button id="s-back">Назад</button>
        </div>
        <p class="small">Лёгкий режим: больше спелости и жизней, а падение в пропасть не отнимает жизнь.</p>
        <p class="small">Подсказки и записки можно выключить при повторном прохождении: записки всё равно собираются, просто не открываются.</p>
        <p class="small">Клавиши: ← → бег · ПРОБЕЛ/Z прыжок · ↓ подкат · X выстрел · C бросить Пикля (за Пикля — Хруст) · V смена героя · Esc пауза</p></div>`, 'dim');
      const f = this.focus;
      const step = v => { v = Math.round((v + 0.2) * 10) / 10; return v > 1.001 ? 0 : v; };
      this.el.querySelector('#s-mus').onclick = () => { s.music = step(s.music); Save.save(); Audio2.applyVolumes(); keep(0); };
      this.el.querySelector('#s-sfx').onclick = () => { s.sfx = step(s.sfx); Save.save(); Audio2.applyVolumes(); keep(1); };
      this.el.querySelector('#s-easy').onclick = () => { s.easy = !s.easy; Save.save(); if (G.player) { G.player.hp = Math.min(G.player.hp, G.player.maxHp); } keep(2); };
      this.el.querySelector('#s-touch').onclick = () => { s.touch = { auto: 'on', on: 'off', off: 'auto' }[s.touch]; Save.save(); Touch.update(); keep(3); };
      this.el.querySelector('#s-hints').onclick = () => { s.hints = !s.hints; Save.save(); if (!s.hints && G.pickle) G.pickle.dismiss(); keep(4); };
      this.el.querySelector('#s-notes').onclick = () => { s.notes = !s.notes; Save.save(); keep(5); };
      this.el.querySelector('#s-full').onclick = () => { try { const d = document.documentElement; if (!document.fullscreenElement) { const p = d.requestFullscreen ? d.requestFullscreen() : (d.webkitRequestFullscreen && d.webkitRequestFullscreen()); if (p && p.catch) p.catch(() => { }); } else if (document.exitFullscreen) document.exitFullscreen(); } catch (e) { } };
      this.el.querySelector('#s-back').onclick = () => { G.setState(prevState); back(); };
      this.onBack = () => { G.setState(prevState); back(); };
    };
    const keep = i => { render(); this.focus = i; this.paint(); };
    render();
  },
  confirm(title, text, yes, no) {
    this.html('confirm', `<div class="card"><h2>${title}</h2><p>${text}</p><div class="menu row"><button id="c-no">Нет</button><button id="c-yes">Да</button></div></div>`, 'dim');
    this.el.querySelector('#c-yes').onclick = yes; this.el.querySelector('#c-no').onclick = no; this.onBack = no;
  },
  intro() {
    this.introIdx = 0; this.introWorld = 1; G.setState('intro'); this.under = null;
    const texts = [
      'Сплит-мир — огромный десерт банана-сплит. На одном его краю, в Бананьей Роще, живут весёлый банан Банни и его лучший друг — огурец Пикль.',
      'На другом краю, в Вафельном Домике, живёт печенька Крошка. Друзья собирались к ней на ежегодный Праздник Трёх Шариков.',
      'Но ночью Барон Брюссель, правитель Горьких Земель, запустил Горький Ветер. Он хочет «пересолить» весь мир, чтобы никто больше не ел сладкого!',
      'Ветер подхватил Банни и унёс далеко-далеко, а по Сплит-миру расползлась армия невкусной еды…',
      '«Ничего, — сказал Пикль, догнав друга. — Пойдём к Крошке пешком!» Путь лежит через пять регионов. Вперёд!'
    ];
    const render = () => {
      this.html('intro', `<div class="caption"><p>${texts[this.introIdx]}</p><div class="menu row"><button id="i-skip" class="ghost">Пропустить</button><button id="i-next">${this.introIdx < 4 ? 'Дальше ▸' : 'В путь! ▸'}</button></div></div>`);
      this.focus = 1; this.paint();
      this.el.querySelector('#i-next').onclick = () => { if (this.introIdx < 4) { this.introIdx++; G.stateT = 0; render(); } else done(); };
      this.el.querySelector('#i-skip').onclick = done;
      this.onBack = done;
    };
    const done = () => { Save.data.introSeen = true; Save.save(); this.map(undefined, 0); };
    render();
  },
  // story screens shown the first time a world's map opens
  worldIntro(w, done) {
    let k = 0; this.introIdx = 0; this.introWorld = w.id; G.setState('intro'); this.under = null;
    const finish = () => { Save.data.worldIntro = Object.assign({}, Save.data.worldIntro, { [w.id]: true }); Save.save(); done(); };
    const render = () => {
      const last = k >= w.intro.length - 1;
      this.html('intro', `<div class="caption"><div class="lvl">${w.name}</div><p>${w.intro[k]}</p><div class="menu row"><button id="i-skip" class="ghost">Пропустить</button><button id="i-next">${last ? 'В путь! ▸' : 'Дальше ▸'}</button></div></div>`);
      this.focus = 1; this.paint();
      this.el.querySelector('#i-next').onclick = () => { if (!last) { k++; this.introIdx = k; G.stateT = 0; render(); } else finish(); };
      this.el.querySelector('#i-skip').onclick = finish; this.onBack = finish;
    };
    render();
  },
  setMap(i) {
    if (i === this.mapSel) return;
    this.mapSel = i; Audio2.play('select'); this.mapPanel();
  },
  world() { return WORLDS[this.worldIdx] || WORLDS[0]; },
  worldsOpen() { return WORLDS.filter(w => w.unlocked()); },
  levelUnlocked(info) { return this.world().levelUnlocked(info); },
  // show the map of the world that holds level `id`, with that level (or the one after it) selected
  mapAt(id, next) {
    const wi = WORLDS.indexOf(worldOfLevel(id)), w = WORLDS[wi], info = w.levels.find(l => l.id === id);
    if (!info) return this.map(undefined, wi);
    this.map(next ? w.nextAfter(info) : w.levels.indexOf(info), wi);
  },
  switchWorld() {
    const open = this.worldsOpen(); if (open.length < 2) return;
    const k = open.indexOf(this.world()), nw = open[(k + 1) % open.length];
    Audio2.play('select'); this.map(undefined, WORLDS.indexOf(nw));
  },
  map(sel, wi) {
    G.setState('map'); this.under = 'map'; G.level = null; canvas.style.filter = '';
    Audio2.muffle(false); Audio2.setRate(1); Audio2.setTone(20000);
    if (wi !== undefined && WORLDS[wi] && WORLDS[wi].unlocked()) this.worldIdx = wi;
    if (!this.world().unlocked()) this.worldIdx = 0;
    if (Save.data.world !== this.worldIdx) { Save.data.world = this.worldIdx; Save.save(); }
    const w = this.world();
    if (w.music === false) Audio2.silence(); else Audio2.music(1);
    if (w.intro && !(Save.data.worldIntro || {})[w.id]) return this.worldIntro(w, () => this.map(sel, this.worldIdx));
    if (!ASSETS[w.map] && w.mapSrc) loadImage(w.map, w.mapSrc);
    this.mapSel = sel !== undefined ? clamp(sel, 0, w.levels.length - 1) : w.defaultSel();
    this.mapPanel();
  },
  mapPanel() {
    const w = this.world(), i = this.mapSel, info = w.levels[i], id = info.id, unlocked = this.levelUnlocked(info);
    const nodes = Scenes.mapNodes(G.viewW);
    let stats = '';
    if (info.bonus) {
      const n = worldCherries(w);
      stats = unlocked ? (Save.data.best.bonus ? `Рекорд: ${fmtTime(Save.data.best.bonus)}` : 'Забег на время по радуге!') : `🔒 Открывается за 15 золотых вишенок (у тебя ${n}) или после финала`;
    } else if (unlocked) {
      const ch = Save.data.cherries[id] || [0, 0, 0];
      const notes = Object.keys(NOTES).filter(k => k.startsWith(info.notes));
      const nn = notes.filter(n => Save.data.notes[n]).length;
      stats = `Вишенки ${ch.map(c => c ? '🍒' : '◌').join('')} · Записки ${nn}/${notes.length}` + (info.sheep ? ` · ${w.sheepName || 'Овечки'} ${Save.data.sheep[id] || 0}/${info.sheep}` : '');
    } else if (info.soon) stats = '🔒 Скоро! Этот остров ещё строится';
    else stats = `🔒 Сначала пройди «${w.levels[i - 1].name}»`;
    const others = this.worldsOpen().filter(o => o !== w);
    const thumb = unlocked && info.thumb ? `<img class="mthumb" src="${info.thumb}" alt="">` : `<div class="mthumb lockedthumb">${unlocked ? '🏝️' : '🔒'}</div>`;
    this.html('map', `
      <div class="mapnodes">${nodes.map((n, k) => `<div class="node" data-k="${k}" style="left:calc(var(--u)*${n.x - 24}px);top:calc(var(--u)*${n.y - 24}px)"></div>`).join('')}</div>
      <div class="mapbar">
        ${thumb}
        <div class="minfo"><div class="lvl">${info.bonus ? 'Бонус' : 'Уровень ' + info.num}</div><div class="mname">${info.name}</div><div class="mstats">${stats}</div></div>
        <div class="mbtns">${unlocked ? `<button id="m-play">${Save.data.done[id] ? 'Ещё раз' : 'Играть'} ▸</button>` : ''}
          <div class="mrow"><button id="m-back" class="ghost">Меню</button>${others.length ? `<button id="m-world" class="ghost" title="${others[0].name}">⇄ Мир ${others[0].id}</button>` : ''}${w.id === 1 && Save.data.done[5] ? '<button id="m-end" class="ghost">Финал</button>' : ''}</div></div>
      </div>`);
    this.el.querySelectorAll('.node').forEach(n => n.onclick = () => { const k = +n.dataset.k; if (k === this.mapSel && this.levelUnlocked(w.levels[k])) G.startLevel(w.levels[k].id); else this.setMap(k); });
    const pb = this.el.querySelector('#m-play'); if (pb) pb.onclick = () => G.startLevel(id);
    this.el.querySelector('#m-back').onclick = () => this.title();
    const wb = this.el.querySelector('#m-world'); if (wb) wb.onclick = () => this.switchWorld();
    const eb = this.el.querySelector('#m-end'); if (eb) eb.onclick = () => this.finale(false);
    this.onBack = () => this.title();
    this.focus = 0; this.paint();
  },
  dialog(lines, done) {
    const names = { misha: 'Морковка Миша', pickle: 'Пикль', banni: 'Банни', kroshka: 'Крошка', baron: 'Барон Брюссель' };
    let k = 0;
    const show = () => {
      const L = lines[k];
      this.html('dialog', `<div class="dlg"><canvas class="portrait" width="150" height="150"></canvas><div class="dtext"><div class="dname">${names[L.who] || ''}</div><p>${L.text}</p><div class="menu row"><button id="d-next">${k < lines.length - 1 ? 'Дальше ▸' : 'Вперёд! ▸'}</button></div></div></div>`, 'dimlight');
      const cv = this.el.querySelector('.portrait'), g = cv.getContext('2d');
      const grd = g.createRadialGradient(75, 70, 10, 75, 75, 75); grd.addColorStop(0, '#fff8ec'); grd.addColorStop(1, '#f2d6b0'); g.fillStyle = grd; g.beginPath(); g.arc(75, 75, 72, 0, TAU); g.fill();
      g.save(); g.beginPath(); g.arc(75, 75, 72, 0, TAU); g.clip();
      if (L.who === 'misha') drawMisha(g, 75, 150, { t: 0, face: 1, s: 1.9 });
      else if (L.who === 'pickle') drawPickle(g, { x: 75, y: 158, face: 1, pose: 'talk', t: 0.3, sx: 2.6, sy: 2.6 });
      else if (L.who === 'banni') drawBanni(g, { x: 75, y: 172, face: 1, sx: 1, sy: 1, pose: 'idle', t: 0.5, hp: 3, scale: 2.1 });
      else if (L.who === 'kroshka') drawCookieGirl(g, 75, 150, { t: 0, s: 1.8 });
      else if (L.who === 'baron') drawBaron(g, 75, 150, { t: 0, s: 1.4 });
      g.restore();
      this.el.querySelector('#d-next').onclick = () => { k++; if (k < lines.length) show(); else { this.hide(); done(); } };
      this.focus = 0; this.paint();
    };
    show();
  },
  finale(fromGame) {
    this.finIdx = 0; G.setState('finale'); canvas.style.filter = ''; Audio2.setRate(1); Audio2.setTone(20000); Audio2.muffle(false); Audio2.play('win');
    if (!fromGame) G.level = null;
    const texts = [
      'Котёл Горечи лопнул и разлетелся разноцветным конфетти! А Барон Брюссель сел на пол и тихо сказал: «Меня никто никогда не выбирал на тарелку…»',
      'Банни протянул ему руку: «Пойдём с нами на Праздник Трёх Шариков! Там найдётся место для всех — даже для брюссельской капусты». Миша и Пикль закивали.',
      'В Вафельном Домике Крошка обняла Банни так крепко, что с неё посыпались крошки. Все спасённые друзья пустились в пляс, а Барон попробовал брюссельскую капусту в карамели — и удивился: «Ммм… да это же вкусно!»',
      'Конец! Спасибо, что прошли весь путь через Сплит. Открыт бонусный уровень «Радужный Топпинг» и новый мир — Фруктовый Архипелаг! Переключиться можно кнопкой «⇄ Мир 2» на карте.'
    ];
    const render = () => {
      this.html('finale', `<div class="caption"><p>${texts[this.finIdx]}</p><div class="menu row"><button id="f-next">${this.finIdx < 3 ? 'Дальше ▸' : (fromGame ? 'Итоги ▸' : 'На карту ▸')}</button></div></div>`);
      this.el.querySelector('#f-next').onclick = () => { if (this.finIdx < 3) { this.finIdx++; G.stateT = 0; render(); } else done(); };
      this.onBack = done;
    };
    const done = () => { if (fromGame && G.level) G.showResults(); else this.map(5, 0); };
    render();
  },
  pause() {
    this.html('pause', `<div class="card"><h2>Пауза</h2><div class="menu">
      <button id="p-go">Продолжить</button><button id="p-re">Начать уровень заново</button><button id="p-set">Настройки</button><button id="p-map">На карту</button></div></div>`, 'dim');
    this.el.querySelector('#p-go').onclick = () => G.resume();
    this.el.querySelector('#p-re').onclick = () => G.startLevel(G.levelId);
    this.el.querySelector('#p-set').onclick = () => this.settings(() => { G.setState('pause'); this.pause(); });
    this.el.querySelector('#p-map').onclick = () => this.mapAt(G.levelId);
    this.onBack = () => G.resume();
  },
  note(text, done) {
    this.html('note', `<div class="paper"><div class="ptitle">${G.theme && G.theme.world === 2 ? 'Письмо в бутылке' : 'Записка в печеньке'}</div><p>${text}</p><div class="menu row"><button id="n-ok">Дальше ▸</button></div></div>`, 'dim');
    const f = () => { this.hide(); done(); Input.clear(); };
    this.el.querySelector('#n-ok').onclick = f; this.onBack = f;
  },
  modal(title, sub, text, done) {
    this.html('modal', `<div class="card glow"><div class="lvl">${title}</div><h2>${sub}</h2><p>${text}</p><div class="menu row"><button id="o-ok">Понятно!</button></div></div>`, 'dim');
    const f = () => { this.hide(); done(); Input.clear(); };
    this.el.querySelector('#o-ok').onclick = f; this.onBack = f;
  },
  gameover() {
    this.html('gameover', `<div class="card"><h2>Ой! Банни перезрел…</h2><p>Жизни закончились, но Пикль верит в друга. Попробуем ещё раз?</p><div class="menu">
      <button id="g-cont">Продолжить с флажка</button><button id="g-map">На карту</button></div></div>`, 'dim');
    this.el.querySelector('#g-cont').onclick = () => { G.lives = Save.data.settings.easy ? 5 : 3; this.hide(); G.setState('play'); G.respawn(); Input.clear(); };
    this.el.querySelector('#g-map').onclick = () => this.mapAt(G.levelId);
  },
  results(r) {
    const nG = r.gold.reduce((a, b) => a + b, 0);
    this.html('results', `<div class="card"><div class="lvl">Уровень пройден!</div><h2>${r.name}</h2>
      <div class="tally">
        <div><span>Шоколадные капли</span><b>${r.drops + r.bonus}</b></div>
        <div><span>${r.sheepName || 'Спасённые овечки'}</span><b>${r.sheep}/${r.sheepMax}${r.bonus ? ` <small>(+${r.bonus} к каплям)</small>` : ''}</b></div>
        <div><span>Золотые вишенки</span><b>${r.gold.map(c => c ? '🍒' : '◌').join(' ')}</b></div>
        <div><span>Побеждено врагов</span><b>${r.enemies}</b></div>
      </div>
      ${nG < 3 ? '<p class="small">Вишенки прячутся в секретных местах — Пикль иногда на них намекает!</p>' : '<p class="small">Все вишенки собраны — ты настоящий исследователь!</p>'}
      <div class="menu row"><button id="r-map" class="ghost">На карту</button><button id="r-next">Дальше ▸</button></div></div>`, 'dim');
    this.focus = 1; this.paint();
    this.el.querySelector('#r-map').onclick = () => this.mapAt(r.id);
    this.el.querySelector('#r-next').onclick = () => this.mapAt(r.id, true);
  },
  bonusResults(r) {
    this.html('results', `<div class="card"><div class="lvl">Финиш!</div><h2>Радужный Топпинг</h2>
      <div class="tally">
        <div><span>Время</span><b>${fmtTime(r.t)}${r.rec ? ' <small>НОВЫЙ РЕКОРД!</small>' : ''}</b></div>
        <div><span>Штрафные секунды</span><b>+${r.pen}</b></div>
        <div><span>Радужные вишенки</span><b>${r.cherries}/${r.total}</b></div>
        <div><span>Лучшее время</span><b>${fmtTime(r.best)}</b></div>
      </div>
      <div class="menu row"><button id="r-map" class="ghost">На карту</button><button id="r-again">Ещё забег ▸</button></div></div>`, 'dim');
    this.focus = 1; this.paint();
    this.el.querySelector('#r-map').onclick = () => this.map(5, 0);
    this.el.querySelector('#r-again').onclick = () => G.startLevel(6);
  },
  ending() { this.finale(false); }
};

// is there something for the fire button to do right now?
function fireAvailable(p) { return !!p && (((p.power === 'cherry' || p.power === 'mint') && p.char === 'banni') || p.power === 'flipper' || p.state === 'balloon'); }
// ---------------- Touch controls ----------------
const Touch = {
  el: document.getElementById('touch'), visible: false,
  init() {
    const dpad = this.el.querySelector('.dpad');
    const btns = [...this.el.querySelectorAll('[data-act]')];
    // Who is pressing what. Keys are 't<id>' for fingers (Touch Events) and 'p<id>' for mouse/pen.
    // Fingers are re-checked against the list of touches that are really on the screen on every
    // touch event, so a lost 'touchend' (iOS, system gestures, several fingers) can't leave a button stuck.
    const zones = new Map(), presses = new Map();
    const zoneOf = (e) => { const b = dpad.getBoundingClientRect(); const x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height; if (x < 0.34) return y > 0.78 ? 'ld' : 'l'; if (x > 0.66) return y > 0.78 ? 'rd' : 'r'; return y < 0.5 ? 'u' : 'd'; };
    const apply = () => {
      let l = false, r = false, d = false, u = false;
      for (const z of zones.values()) { if (z === 'l' || z === 'ld') l = true; if (z === 'r' || z === 'rd') r = true; if (z === 'd' || z === 'ld' || z === 'rd') d = true; if (z === 'u') u = true; }
      Input.touch.left = l; Input.touch.right = r; Input.touch.down = d; Input.touch.up = u;
      dpad.dataset.l = l; dpad.dataset.r = r; dpad.dataset.d = d; dpad.dataset.u = u;
      const on = new Set(presses.values());
      for (const b of btns) { const a = b.dataset.act, v = on.has(a); Input.touch[a] = v; b.classList.toggle('on', v); }
    };
    this.release = () => { zones.clear(); presses.clear(); apply(); };
    const sync = (e) => {
      const live = new Set(); for (const t of e.touches) live.add('t' + t.identifier);
      for (const k of [...zones.keys()]) if (k[0] === 't' && !live.has(k)) zones.delete(k);
      for (const k of [...presses.keys()]) if (k[0] === 't' && !live.has(k)) presses.delete(k);
      for (const t of e.touches) { const k = 't' + t.identifier; if (zones.has(k)) zones.set(k, zoneOf(t)); }
      apply();
    };
    const begin = () => { Audio2.unlock(); Input.lastDevice = 'touch'; };
    dpad.addEventListener('touchstart', e => { e.preventDefault(); begin(); for (const t of e.changedTouches) zones.set('t' + t.identifier, zoneOf(t)); sync(e); }, { passive: false });
    for (const b of btns) b.addEventListener('touchstart', e => {
      e.preventDefault(); begin(); const a = b.dataset.act;
      for (const t of e.changedTouches) presses.set('t' + t.identifier, a);
      Input.latch['touch:' + a] = true; sync(e);
    }, { passive: false });
    for (const ev of ['touchmove', 'touchend', 'touchcancel']) document.addEventListener(ev, sync, { passive: true });
    // mouse / pen (e.g. "Сенсорные кнопки: вкл" on a computer)
    const pDown = (el, f) => el.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') return; e.preventDefault(); begin();
      try { el.setPointerCapture(e.pointerId); } catch (_) { } f('p' + e.pointerId, e); apply();
    });
    pDown(dpad, (k, e) => zones.set(k, zoneOf(e)));
    dpad.addEventListener('pointermove', e => { const k = 'p' + e.pointerId; if (zones.has(k)) { zones.set(k, zoneOf(e)); apply(); } });
    for (const b of btns) pDown(b, k => { presses.set(k, b.dataset.act); Input.latch['touch:' + b.dataset.act] = true; });
    const pUp = e => { const k = 'p' + e.pointerId; zones.delete(k); presses.delete(k); apply(); };
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) { dpad.addEventListener(ev, pUp); for (const b of btns) b.addEventListener(ev, pUp); }
    window.addEventListener('blur', () => this.release());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.release(); });
    this.el.querySelector('.tpause').addEventListener('pointerdown', e => { e.preventDefault(); G.pause(); });
    this.el.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('pointerdown', e => {
      if (G.state !== 'play' || !G.pickle) return;
      const r = canvas.getBoundingClientRect();
      const px = (e.clientX - r.left) * canvas.width / r.width, py = (e.clientY - r.top) * canvas.height / r.height;
      if (G.pickle.hitBubble(px, py)) { e.preventDefault(); G.pickle.dismiss(); }
    });
  },
  update() {
    const s = Save.data.settings.touch;
    const want = (s === 'on' || (s === 'auto' && IS_TOUCH)) && (G.state === 'play' || G.state === 'levelIntro');
    this.visible = want;
    this.el.classList.toggle('on', want);
    if (!want) { if (this.release) this.release(); for (const k in Input.touch) Input.touch[k] = false; }
    const fire = this.el.querySelector('[data-act="fire"]');
    if (fire) fire.style.visibility = fireAvailable(G.player) ? 'visible' : 'hidden';
    const sw = this.el.querySelector('[data-act="swap"]');
    if (sw) sw.style.display = (G.def && G.def.swap && G.level) ? 'flex' : 'none';
  }
};

// ---------------- layout ----------------
function resize() {
  const ww = window.innerWidth, wh = window.innerHeight;
  const aspect = clamp(ww / wh, 4 / 3, 2.1);
  G.viewW = Math.round(VIEW_H * aspect);
  const scale = Math.min(ww / G.viewW, wh / VIEW_H);
  G.displayScale = scale;
  const cw = G.viewW * scale, ch = VIEW_H * scale;
  const dpr = window.devicePixelRatio || 1;
  G.S = clamp(Math.round(scale * dpr * 4) / 4, 0.75, 2);
  canvas.width = Math.round(G.viewW * G.S); canvas.height = Math.round(VIEW_H * G.S);
  const stage = document.getElementById('stage');
  stage.style.width = cw + 'px'; stage.style.height = ch + 'px';
  stage.style.left = ((ww - cw) / 2) + 'px'; stage.style.top = ((wh - ch) / 2) + 'px';
  stage.style.setProperty('--u', scale.toFixed(4));
  if (G.terrain) G.terrain.setScale(G.S);
  if (G.level && G.cam) { G.cam.maxX = G.bossActive ? G.cam.maxX : G.level.W * T - G.viewW; }
  document.getElementById('rotate').classList.toggle('on', IS_TOUCH && wh > ww * 1.1);
  if (UI.cur === 'map') UI.mapPanel();
}

// ---------------- boot ----------------
let lastT = performance.now(), accT = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - lastT) / 1000; lastT = now;
  if (dt > 0.25) dt = 0.25;
  accT += dt;
  let n = 0;
  while (!G.manual && accT >= DT && n < 5) { Input.update(); try { G.step(DT); } catch (e) { reportError(e); } accT -= DT; n++; }
  if (n >= 5) accT = 0;
  try { G.render(); } catch (e) { reportError(e); }
  if (G.state === 'play') {
    const f = fireAvailable(G.player); if (f !== Touch.fireVis) { Touch.fireVis = f; Touch.update(); }
    // the 🥒 button throws Pickle; while playing as Pickle it is his crunch
    const crunch = G.player && G.player.char === 'pickle' && (Save.data.crunch || (G.def && G.def.crunch)), ic = crunch ? '💥' : '🥒';
    if (ic !== Touch.pkIcon) { Touch.pkIcon = ic; const b = Touch.el.querySelector('[data-act="pickle"]'); if (b) b.textContent = ic; }
  }
}
let errShown = 0;
function reportError(e) { console.error(e); if (errShown++ < 1) { const d = document.getElementById('err'); d.textContent = 'Ошибка: ' + (e && e.message); d.style.display = 'block'; setTimeout(() => d.style.display = 'none', 6000); } }
async function boot() {
  Save.load(); Input.init(); Touch.init();
  window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  resize();
  document.addEventListener('visibilitychange', () => { if (document.hidden) { G.pause(); try { Audio2.ctx && Audio2.ctx.suspend(); } catch (e) { } } else { try { Audio2.ctx && Audio2.ctx.resume(); } catch (e) { } } });
  window.addEventListener('blur', () => G.pause());
  for (const ev of ['pointerdown', 'touchend', 'click']) document.addEventListener(ev, () => Audio2.unlock(), { passive: true });
  const fontP = (document.fonts && document.fonts.load) ? Promise.race([Promise.all([document.fonts.load('900 20px Nunito'), document.fonts.load('800 20px Nunito')]), new Promise(r => setTimeout(r, 1500))]) : Promise.resolve();
  await Promise.all([loadImage('bg1', 'assets/bg1.jpg'), loadImage('bg2', 'assets/bg2.jpg'), loadImage('map', 'assets/map.jpg'), fontP]);
  ['bg3', 'bg4', 'bg5', 'party'].forEach(k => loadImage(k, 'assets/' + k + '.jpg'));
  document.getElementById('loading').style.display = 'none';
  UI.title();
  requestAnimationFrame(frame);
}
boot();
window.__dbg = { Input, Save, Audio2, UI, Scenes, TL, LEVELS, Touch, HUD, WORLDS, levelIds };
