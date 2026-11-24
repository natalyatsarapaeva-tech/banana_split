'use strict';
// ================= entities.js =================
const PHYS = { grav: 2100, maxFall: 900, run: 290, acc: 1500, dec: 1900, airAcc: 1150, airDec: 420, jump: 800, jumpCut: 330, coyote: 0.1, buffer: 0.14 };

class Ent {
  constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; this.vx = 0; this.vy = 0; this.alive = true; this.t = 0; this.face = -1; }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get bottom() { return this.y + this.h; }
  update(G, dt) { }
  draw(g, G) { }
}

// ---------------- Player (Banni) ----------------
class Player extends Ent {
  constructor(x, y) {
    super(x - 13, y - 50, 26, 50);
    this.face = 1; this.state = 'play';
    this.hp = Save.data.settings.easy ? 5 : 3; this.glaze = false; this.power = null; this.star = 0; this.inv = 0;
    this.sliding = false; this.coyote = 0; this.jumpBuf = 0; this.cutOk = false; this.wallLock = 0; this.wallSlide = 0;
    this.sx = 1; this.sy = 1; this.phase = 0; this.deadT = 0; this.vine = null; this.vineCd = 0;
    this.lastSafe = { x: x, y: y }; this.fireCd = 0; this.hurtT = 0; this.glide = false; this.shootT = 0;
    this.onGround = false; this.prevBottom = this.bottom; this.dustT = 0; this.safeT = 0;
    this.char = 'banni'; this.airJumps = 1; this.flipT = 0; this.pounding = false; this.swimming = false; this.sink = 0; this.leech = null;
    this.air = 1; this.wet = false; this.underwater = false; this.crunchT = 0; this.crunchCd = 0; this.dashT = 0; this.dashCd = 0; this.helmet = false; this.armor = false;
  }
  // switch the playable hero without the swap effects (level start, respawn)
  setChar(G, to) {
    const b = this.bottom, cx = this.cx;
    this.char = to; this.w = to === 'pickle' ? 22 : 26; this.h = to === 'pickle' ? 46 : 50; this.x = cx - this.w / 2; this.y = b - this.h;
    if (G.pickle) G.pickle.asBanni = to === 'pickle';
  }
  get maxHp() { return Save.data.settings.easy ? 5 : 3; }
  startSlide() {
    if (this.sliding) return;
    this.sliding = true; this.y += 24; this.h = 26;
    const dir = sign(this.vx) || this.face;
    this.vx = dir * Math.max(Math.abs(this.vx) + 70, Math.abs(this.vx) > 90 ? 330 : 240);
    Audio2.play('slide');
  }
  stopSlide(G) {
    if (!this.sliding) return true;
    if (rectSolid(G, this.x + 1, this.y - 24, this.w - 2, 50)) return false;
    this.sliding = false; this.y -= 24; this.h = 50; return true;
  }
  touchingWall(G, side) {
    return side > 0 ? rectSolid(G, this.x + this.w, this.y + 6, 3, this.h - 18) : rectSolid(G, this.x - 3, this.y + 6, 3, this.h - 18);
  }
  update(G, dt) {
    this.t += dt;
    this.sx = lerp(this.sx, 1, 1 - Math.pow(0.0001, dt)); this.sy = lerp(this.sy, 1, 1 - Math.pow(0.0001, dt));
    if (this.state === 'dead') {
      this.vy += 1700 * dt; this.y += this.vy * dt; this.deadT -= dt;
      if (this.deadT <= 0) { this.state = 'gone'; G.afterDeath(); }
      return;
    }
    if (this.inv > 0) this.inv -= dt;
    if (this.hurtT > 0) this.hurtT -= dt;
    this.fireCd -= dt;
    if (this.state === 'balloon') { this.updateBalloon(G, dt); return; }
    if (this.state !== 'play' && this.state !== 'vine') return;
    if (this.star > 0) {
      this.star -= dt;
      if (Math.random() < 0.5) G.spark(this.cx + rnd(-16, 16), this.y + rnd(0, this.h), `hsl(${rndi(0, 360)},100%,70%)`);
      if (this.star <= 0) Audio2.setRate(G.musicRate);
    }
    this.wallLock -= dt; this.vineCd -= dt; this.shootT -= dt; this.flipT = Math.max(0, this.flipT - dt);
    let mx = (Input.held('right') ? 1 : 0) - (Input.held('left') ? 1 : 0);
    if (this.wallLock > 0) mx = 0;
    if (Input.pressed('jump')) this.jumpBuf = PHYS.buffer; else this.jumpBuf -= dt;
    if (this.leech) {
      this.leechT += dt;
      if (Input.pressed('jump')) { this.leechShake++; this.sx = 1.2; this.sy = 0.85; }
      if (this.leechShake >= 4 || !this.leech.alive) { if (this.leech.alive) this.leech.detach(G, true); }
      else if (this.leechT > 3.2) { this.leech.detach(G, false); this.hurt(G, null); }
    }
    if (this.state === 'vine') { this.updateVine(G, dt, mx); return; }
    if (Input.pressed('swap') && G.def.swap) this.trySwap(G);
    // liquids
    const liq = G.liquidAt(this.cx, this.y + this.h * 0.62);
    this.crunchCd -= dt; this.dashCd -= dt;
    if (this.crunchT > 0) { this.updateCrunch(G, dt); return; }
    if (this.dashT > 0) { this.updateDash(G, dt); return; }
    if (liq === TL.WATER) { if (this.updateWater(G, dt, mx)) return; }
    else { if (this.wet) this.leaveWater(G); this.leapT = 0; this.breathe(G, dt); }
    if (Input.pressed('pickle') && this.char === 'pickle') this.tryCrunch(G);
    if (liq === TL.CHOC) {
      if (this.char === 'pickle') { this.updateSwim(G, dt, mx); return; }
      this.drown(G); return;
    }
    if (this.swimming) { this.swimming = false; }
    if (liq === TL.BROTH || G.liquidAt(this.cx, this.bottom - 4) === TL.BROTH) { this.brothHit(G); }
    const gt = this.onGround ? this.groundT : 0;
    const ice = this.onGround && isIceT(gt);
    const sticky = this.onGround && gt === TL.CLOUD;
    const slime = this.onGround && G.slimeAt(this.cx, this.bottom);
    const fudge = this.onGround && gt === TL.FUDGE;
    if (fudge && Math.abs(this.vx) < 70) this.sink = Math.min(34, this.sink + 26 * dt); else this.sink = Math.max(0, this.sink - (fudge ? 8 : 80) * dt);
    if (this.sink >= 34) { this.sink = 0; this.hurt(G, null); this.vy = -620; G.hint('fudge', 'Зыбучая помадка затягивает, если стоять на месте! Беги или прыгай!'); }
    if (this.sliding) this.updateSlide(G, dt, mx, ice || slime);
    else {
      let maxV = PHYS.run, acc = PHYS.acc, dec = PHYS.dec;
      if (!this.onGround) { acc = PHYS.airAcc; dec = PHYS.airDec; }
      else if (ice) { acc = 520; dec = 150; maxV = 340; }
      else if (slime) { acc = 560; dec = 110; maxV = 330; }
      else if (sticky) { maxV = 105; acc = 900; dec = 2400; }
      else if (fudge) { maxV = 150 - this.sink * 2; acc = 800; }
      if (this.leech) maxV *= 0.5;
      if (this.char === 'pickle') maxV *= 0.93;
      if (this.wet) maxV *= 0.6;
      if (this.boostT > 0) {
        this.boostT -= dt; if (mx) this.face = mx;
        if (mx && this.vx * mx < 0) { this.vx += mx * 900 * dt; }
        if (Math.random() < 0.8) this.G_parts(G);
      } else if (mx) {
        if (this.vx * mx < 0) this.vx += mx * (acc + dec) * dt * (ice || slime ? 0.4 : 1);
        else if (Math.abs(this.vx) < maxV) this.vx = Math.min(Math.abs(this.vx) + acc * dt, maxV) * mx;
        else this.vx = approach(this.vx, maxV * mx, dec * 0.6 * dt);
        this.face = mx;
      } else this.vx = approach(this.vx, 0, dec * dt);
      if (this.onSlope && isIceT(this.onSlope)) { const down = slopeRises(this.onSlope) ? -1 : 1; this.vx += down * 650 * dt; }
      if (this.char === 'banni') {
        if (Input.pressed('down') && this.onGround && !this.onSlope) this.startSlide();
        else if (Input.held('down') && this.onGround && Math.abs(this.vx) > 90) this.startSlide();
      }
    }
    // jumping
    if (this.onGround) { this.coyote = PHYS.coyote; this.airJumps = 1; this.pounding = false; } else this.coyote -= dt;
    if (this.jumpBuf > 0 && this.coyote > 0) {
      if (!this.sliding || this.stopSlide(G)) {
        let v = PHYS.jump + Math.abs(this.vx) * 0.1;
        if (this.char === 'pickle') v *= 0.92;
        if (sticky) v *= 0.74;
        if (this.sink) v *= 1 - this.sink / 80;
        if (this.leech) v *= 0.78;
        if (this.wet) v *= 0.66;
        this.vy = -v; this.jumpBuf = 0; this.coyote = 0; this.cutOk = true; this.onGround = false; this.standOn = null; this.sink = 0;
        this.sx = 0.82; this.sy = 1.2; Audio2.play('jump');
        G.dust(this.cx, this.bottom, 5);
      }
    }
    // wall jump / double jump
    this.wallSlide = 0;
    if (!this.onGround && !this.sliding) {
      const wj = Save.data.wallJump;
      const tr = wj && this.touchingWall(G, 1), tl = wj && this.touchingWall(G, -1);
      if (this.jumpBuf > 0 && this.coyote <= 0) {
        if (tr || tl) {
          const dir = tr ? -1 : 1;
          this.vy = -770; this.vx = dir * 330; this.face = dir; this.wallLock = 0.17; this.jumpBuf = 0; this.cutOk = true; this.airJumps = 1;
          Audio2.play('jump'); G.dust(tr ? this.x + this.w : this.x, this.cy, 5);
        } else if (this.airJumps > 0 && !this.pounding) {
          this.airJumps--; this.jumpBuf = 0; this.cutOk = true;
          this.vy = -(this.char === 'pickle' ? 690 : 740) * (this.leech ? 0.8 : 1);
          this.flipT = 0.42; this.sx = 0.8; this.sy = 1.2; Audio2.play('jump2');
          for (let i = 0; i < 8; i++) { const a = Math.PI * (0.15 + 0.7 * i / 7); this.G_ = G; G.parts.push({ k: 'bit', x: this.cx, y: this.bottom, vx: Math.cos(a) * 160, vy: Math.sin(a) * 120, life: 0.45, max: 0.45, c: pick(SPRINKLES), s: 3, r: i, g: 300 }); }
          G.hint('dbl', 'Двойной прыжок! В воздухе можно подпрыгнуть ещё раз.');
        }
      } else if (this.vy > 0 && ((tr && mx > 0) || (tl && mx < 0))) { this.wallSlide = tr ? 1 : -1; }
    }
    // ground pound (Pickle)
    if (this.char === 'pickle' && !this.onGround && Input.pressed('down') && !this.pounding) { this.pounding = true; this.vy = 980; this.vx = 0; this.flipT = 0; Audio2.play('throw'); }
    // gravity & forces
    this.glide = false;
    if (this.cutOk && !Input.held('jump') && this.vy < -PHYS.jumpCut) this.vy = -PHYS.jumpCut;
    this.vy += PHYS.grav * dt * (this.wet ? 0.38 : 1);
    if (this.vy >= 0) this.cutOk = false;
    const para = this.power === 'parachute' && this.char === 'banni' && Input.held('jump') && !this.sliding;
    const up = G.updraftAt(this.cx, this.cy);
    if (up && !this.pounding) { this.vy = Math.max(para ? -430 : -270, this.vy - up * dt); if (this.airJumps < 1 && this.vy < -150) this.airJumps = 1; }
    if (!this.onGround && para && this.vy > 0) { this.vy = Math.min(this.vy, 115); this.glide = true; }
    const wind = G.windAt(this.cx, this.cy);
    if (wind) { this.vx = clamp(this.vx + wind * dt * (this.onGround ? 0.6 : 1), -440, 440); }
    if (this.wallSlide) { this.vy = Math.min(this.vy, 130); if (Math.random() < 0.3) G.dust(this.wallSlide > 0 ? this.x + this.w : this.x, this.y + 10, 1); }
    if (this.pounding) this.vy = Math.max(this.vy, 980);
    if (this.vy > (this.pounding ? 1000 : PHYS.maxFall)) this.vy = this.pounding ? 1000 : PHYS.maxFall;
    if (this.wet && this.vy > 190 && !this.pounding) this.vy = 190;
    // move
    this.prevBottom = this.bottom;
    const impact = this.vy;
    moveBody(this, G, dt);
    if (this.hitCeil && this.ceilEnt && this.ceilEnt.hit) this.ceilEnt.hit(G, this);
    else if (this.hitCeil && !(this.helmet && this.headBreak(G))) Audio2.play('bump');
    if (this.onGround) {
      if (this.groundT === TL.CONVL || this.groundT === TL.CONVR) {
        const d = (this.groundT === TL.CONVR ? 1 : -1) * 100 * dt;
        if (!rectSolid(G, this.x + d, this.y, this.w, this.h - 2)) this.x += d;
      }
      if (!this.wasOnGround) {
        const k = clamp(impact / 900, 0.1, 1);
        this.sx = 1 + 0.3 * k; this.sy = 1 - 0.3 * k;
        if (impact > 500) G.dust(this.cx, this.bottom, 6);
        if (this.pounding) this.poundLand(G);
      }
      if (this.standOn && this.standOn.bouncy) this.standOn.bounce(G, this, impact);
      else if (this.groundT === TL.CROWN) {
        this.vy = Input.held('jump') ? -1210 : -1030; this.onGround = false; this.cutOk = false; this.standOn = null;
        this.sx = 0.75; this.sy = 1.3; Audio2.play('boing'); G.crownBounce(this.cx, this.bottom);
      }
      if (this.groundT === TL.GRATER) this.hurt(G, null);
      if (!this.standOn && isGroundish(this.groundT) && !this.sliding && this.groundT !== TL.FUDGE && this.groundT !== TL.GRATER && this.groundT !== TL.CRACK) {
        this.safeT -= dt;
        if (this.safeT <= 0 && !this.wet && groundBelow(G, this.x + 2, this.bottom + 4) && groundBelow(G, this.x + this.w - 2, this.bottom + 4) && !G.hazardNear(this)) {
          this.lastSafe = { x: this.cx, y: this.bottom }; this.safeT = 0.3;
        }
      }
    }
    if ((this.hitL || this.hitR) && G.graterBeside(this, this.hitL ? -1 : 1)) this.hurt(G, null);
    // run anim
    if (this.onGround) this.phase += Math.abs(this.vx) * dt * 0.045;
    if (this.onGround && Math.abs(this.vx) > 200 && !this.sliding) { this.dustT -= dt; if (this.dustT <= 0) { this.dustT = 0.12; G.dust(this.cx - this.face * 8, this.bottom, 1); } }
    if (this.sliding && this.onGround && Math.random() < 0.6) G.spark(this.cx - this.face * 20, this.bottom - 2, '#ffffff');
    if (G.thornAt(this.x + 5, this.y + 8, this.w - 10, this.h - 10)) this.hurt(G, null);
    if (this.bottom > G.level.H * T - 14) this.fall(G);
    if (Input.pressed('fire') && this.power === 'flipper') this.tryDash(G);
    else if (Input.pressed('fire') && this.fireCd <= 0 && this.char === 'banni') this.shoot(G);
    if (Input.pressed('pickle') && this.char === 'banni') G.pickle.throwIt(G);
  }
  G_parts(G) { G.parts.push({ k: 'bit', x: this.cx - this.face * 14, y: this.y + rnd(10, this.h - 6), vx: -this.face * rnd(60, 160), vy: rnd(-30, 30), life: 0.4, max: 0.4, c: pick(RAINBOW), s: 3.5, r: 0, g: 0 }); }
  trySwap(G) {
    const sea = this.wet || G.liquidAt(this.cx, this.cy) === TL.WATER;
    if (this.state !== 'play' || this.sliding || (this.swimming && !sea) || (!this.onGround && !sea)) { if (!this.onGround) G.toast('Меняться можно на земле'); return; }
    const to = this.char === 'banni' ? 'pickle' : 'banni';
    const nw = to === 'pickle' ? 22 : 26, nh = to === 'pickle' ? 46 : 50;
    const cx = this.cx, b = this.bottom;
    if (rectSolid(G, cx - nw / 2, b - nh, nw, nh - 1)) return;
    this.char = to; this.w = nw; this.h = nh; this.x = cx - nw / 2; this.y = b - nh; this.pounding = false;
    G.pickle.asBanni = to === 'pickle'; G.pickle.reset(cx - this.face * 40, b);
    G.burst(cx, b - 25, 12, ['#ffffff', '#9cd47a', '#ffe14d']); Audio2.play('swap');
    G.add(new TextFx(cx, b - 70, to === 'pickle' ? 'Играет Пикль!' : 'Играет Банни!', to === 'pickle' ? '#c8ff8a' : '#fff6a0'));
    if (to === 'pickle') G.hint('pk1', `Теперь иду я! В шоколаде я плаваю (${Input.label('jump')} — гребок, ↑ ↓ — нырять), а ${Input.label('down')} в прыжке — удар сверху, он пробивает треснутый пол.`);
  }
  updateSwim(G, dt, mx) {
    if (!this.swimming) { this.swimming = true; this.vy *= 0.25; this.pounding = false; Audio2.play('splash'); G.burst(this.cx, this.y + 10, 10, ['#6a3a1e', '#8a4e28', '#ffffff']); }
    this.airJumps = 1; this.glide = false; this.onGround = false;
    this.vx = approach(this.vx, mx * 175, 650 * dt); if (mx) this.face = mx;
    let ay = 140;
    if (Input.held('up')) ay = -420; else if (Input.held('down')) ay = 420;
    if (Input.pressed('jump')) { this.vy = Math.min(this.vy, -250); Audio2.play('bubble'); }
    this.vy = clamp(this.vy + ay * dt, -280, 220);
    const surf = G.liquidSurface(this.cx, this.cy);
    if (surf !== null && this.y < surf + 10 && Input.held('jump')) { this.vy = -700; this.cutOk = true; this.swimming = false; Audio2.play('splash'); G.burst(this.cx, surf, 8, ['#6a3a1e', '#ffffff']); }
    this.prevBottom = this.bottom;
    moveBody(this, G, dt);
    if (Math.random() < 0.08) G.parts.push({ k: 'dust', x: this.cx + this.face * 10, y: this.y + 6, vx: rnd(-10, 10), vy: -60, life: 0.8, max: 0.8, c: 'rgba(255,240,220,0.7)', s: rnd(2, 4), g: 0 });
    this.phase += dt * 8;
    if (this.bottom > G.level.H * T - 4) { this.y = G.level.H * T - 4 - this.h; this.vy = Math.min(0, this.vy); }
    if (Input.pressed('swap')) G.toast('Сначала выплыви на берег!');
  }
  drown(G) {
    const surf = G.liquidSurface(this.cx, this.cy);
    G.burst(this.cx, surf !== null ? surf : this.y, 16, ['#6a3a1e', '#8a4e28', '#ffffff']); Audio2.play('splash');
    if (G.def.swap) G.hint('drown', 'Банни не умеет плавать в шоколаде! Тут нужен я — поменяйтесь (' + Input.label('swap') + ').');
    if (G.def.bonus || this.state !== 'play') return this.fall(G, true);
    if (this.leech) this.leech.detach(G, false);
    this.hp--; if (this.hp <= 0) { this.die(G); this.vy = -950; return; }
    Audio2.play('hurt'); this.respawnAt(this.lastSafe.x, this.lastSafe.y); this.inv = 1.6; G.toast('Буль! −1 спелость');
  }
  brothHit(G) {
    if (this.inv <= 0) this.hurt(G, null);
    this.vy = -900; this.onGround = false; this.cutOk = false; this.pounding = false; this.airJumps = 1;
    G.burst(this.cx, this.bottom, 10, ['#f2b33d', '#e08a2a', '#ffffff']); Audio2.play('splash');
    G.hint('broth', 'Ай, горячо! В бульон лучше не наступать.');
  }
  poundLand(G) {
    this.pounding = false; G.shake(0.25); Audio2.play('pound'); G.dust(this.cx, this.bottom, 10);
    const r = Math.floor((this.bottom + 2) / T), c0 = Math.floor((this.x + 1) / T), c1 = Math.floor((this.x + this.w - 1) / T);
    let broke = false;
    for (let c = c0 - 1; c <= c1 + 1; c++) if (G.level.get(c, r) === TL.CRACK && (c >= c0 && c <= c1 || G.level.get(c0, r) === TL.CRACK || G.level.get(c1, r) === TL.CRACK)) { G.breakTile(c, r); broke = true; }
    if (broke) { this.pounding = true; this.onGround = false; this.vy = 600; }
    for (const e of G.ents) {
      if (!e.alive || !e.enemy || e.frozen > 0) continue;
      if (Math.abs(e.cx - this.cx) < 80 && Math.abs(e.bottom - this.bottom) < 30) { if (e.onPound) e.onPound(G, this); else if (!e.boss) e.kill(G, 'stomp'); }
    }
    for (const e of G.ents) if (e.alive && e.poundable && Math.abs(e.cx - this.cx) < 60 && Math.abs(e.bottom - this.bottom) < 40) e.onPound(G, this);
  }
  enterBalloon(G, ride) {
    if (this.sliding) { this.sliding = false; }
    this.state = 'balloon'; this.ride = ride; this.char = 'banni'; G.pickle.asBanni = false;
    this.w = 64; this.h = 54; this.x = ride.cx - 32; this.y = ride.bottom - 54; this.vx = this.vy = 0; this.glide = false;
  }
  updateBalloon(G, dt) {
    const ax = (Input.held('right') ? 1 : 0) - (Input.held('left') ? 1 : 0), ay = (Input.held('down') ? 1 : 0) - (Input.held('up') ? 1 : 0);
    this.vx = approach(this.vx, ax * 240, 800 * dt); this.vy = approach(this.vy, ay * 210, 800 * dt);
    this.x += this.vx * dt; this.y += this.vy * dt;
    const cam = G.cam;
    this.x = clamp(this.x, cam.x + 24, cam.x + G.viewW * 0.6 - this.w);
    this.y = clamp(this.y, cam.y + 196, cam.y + VIEW_H - this.h - 12);
    this.prevBottom = this.bottom;
    if ((Input.pressed('fire') || Input.pressed('jumpBtn') || Input.pressed('pickle')) && this.fireCd <= 0) {
      G.add(new CannonPit(this.x + this.w + 14, this.y + 18)); this.fireCd = 0.2; Audio2.play('cannon'); this.shootT = 0.15;
    }
    this.shootT -= dt;
    if (Math.random() < 0.25) G.parts.push({ k: 'dust', x: this.x + 6, y: this.y + this.h - 8, vx: -60, vy: rnd(-10, 10), life: 0.6, max: 0.6, c: 'rgba(255,255,255,0.7)', s: rnd(3, 6), g: 0 });
  }
  updateSlide(G, dt, mx, slick) {
    const fr = slick ? 80 : 300;
    this.vx = approach(this.vx, 0, fr * dt);
    if (this.onSlope) { const down = slopeRises(this.onSlope) ? -1 : 1; this.vx += down * 1250 * dt; }
    this.vx = clamp(this.vx, -620, 620);
    if (Math.abs(this.vx) > 5) this.face = sign(this.vx);
    const blocked = rectSolid(G, this.x + 1, this.y - 24, this.w - 2, 24);
    if (blocked && Math.abs(this.vx) < 120) { if (mx) this.vx = mx * 120; else if (Math.abs(this.vx) < 60) this.vx = this.face * 60; }
    if (!blocked && (Math.abs(this.vx) < 60 || (!this.onGround && this.vy > 250))) this.stopSlide(G);
  }
  shoot(G) {
    if (this.power === 'cherry' && G.countOf(CherryPit) < 3) {
      G.add(new CherryPit(this.cx + this.face * 14, this.y + (this.sliding ? 6 : 22), this.face));
      this.fireCd = 0.2; this.shootT = 0.15; Audio2.play('shoot');
    } else if (this.power === 'mint' && G.countOf(MintShot) < 2) {
      G.add(new MintShot(this.cx + this.face * 14, this.y + (this.sliding ? 6 : 22), this.face));
      this.fireCd = 0.3; this.shootT = 0.15; Audio2.play('shoot');
    }
  }
  stompBounce() {
    this.vy = -700; this.cutOk = true; this.onGround = false; this.sx = 0.8; this.sy = 1.2; this.coyote = 0;
  }
  hurt(G, src) {
    if (this.inv > 0 || this.star > 0 || (this.state !== 'play' && this.state !== 'vine' && this.state !== 'balloon') || G.state !== 'play') return;
    if (G.def.bonus) {
      this.inv = 1.2; this.hurtT = 0.4; G.bonusPenalty += 2; Audio2.play('hurt'); G.toast('+2 сек');
      const d = src ? (sign(this.cx - src.cx) || -this.face) : -this.face; this.vy = -380; this.vx = d * 240; this.onGround = false; this.boostT = 0;
      return;
    }
    if (this.helmet || this.armor) {
      if (this.armor) this.armor = false; else this.helmet = false;
      this.inv = 1.3; Audio2.play('crack');
      G.burst(this.cx, this.y + 10, 14, ['#8a5a2a', '#c8a070', '#f2e6c8', '#f2c230']);
      return;
    }
    if (this.glaze) {
      this.glaze = false; this.inv = 1.3; Audio2.play('crack');
      G.burst(this.cx, this.y + 15, 16, ['#6a3a1e', '#8a4a22', '#4a2410', '#ffffff']);
      return;
    }
    this.hp--; this.lastHurtSrc = src ? src.constructor.name : 'hazard';
    if (this.hp <= 0) { this.die(G); return; }
    this.inv = 1.6; this.hurtT = 0.45; Audio2.play('hurt');
    if (this.state === 'balloon') { G.shake(0.2); return; }
    if (this.state === 'vine') this.leaveVine(G, 0, -200);
    const d = src ? (sign(this.cx - src.cx) || -this.face) : -this.face;
    this.vy = -380; this.vx = d * 240; this.onGround = false;
    if (this.hp === 1) G.hint('lowhp', this.char === 'pickle' ? 'Ой, я совсем раскис! Нужен кубик льда.' : 'Банни, ты совсем перезрел! Ищи кубик льда — он освежит.');
  }
  heal() {
    if (this.hp < this.maxHp) { this.hp++; return true; }
    return false;
  }
  die(G) {
    if (this.state === 'dead' || this.state === 'gone') return;
    if (this.sliding) { this.sliding = false; this.y -= 24; this.h = 50; }
    if (this.vine) { this.vine.holder = null; this.vine = null; }
    this.state = 'dead'; this.deadT = 1.9; this.vy = -720; this.vx = 0; this.hp = 0;
    Audio2.play('die'); G.onPlayerDie();
  }
  fall(G, drowned) {
    if (this.state === 'dead') return;
    if (this.leech) this.leech.detach(G, false);
    if (!drowned) G.burst(this.cx, G.level.H * T - 30, 14, G.theme.fallColors || ['#fde3ec', '#f6b8cc', '#ffffff']);
    if (G.def.bonus) { G.bonusPenalty += 3; Audio2.play('hurt'); G.toast('+3 сек'); this.respawnAt(this.lastSafe.x, this.lastSafe.y); this.inv = 1.2; this.boostT = 0; return; }
    if (Save.data.settings.easy) {
      this.hp--;
      if (this.hp <= 0) { this.die(G); this.y = G.level.H * T; this.vy = -900; return; }
      Audio2.play('hurt');
      this.respawnAt(this.lastSafe.x, this.lastSafe.y); this.inv = 1.6;
      G.toast('Ой! −1 спелость');
      return;
    }
    this.die(G); this.vy = -950;
  }
  respawnAt(x, y) {
    if (this.sliding) { this.sliding = false; this.h = this.char === 'pickle' ? 46 : 50; }
    this.pounding = false; this.swimming = false; this.sink = 0; this.airJumps = 1; this.flipT = 0;
    this.wet = false; this.underwater = false; this.air = 1; this.crunchT = 0; this.dashT = 0;
    this.x = x - this.w / 2; this.y = y - this.h; this.vx = 0; this.vy = 0; this.onGround = false; this.standOn = null;
    this.state = 'play'; this.vine = null;
  }
  grabVine(G, v) {
    if (this.sliding) { if (!this.stopSlide(G)) return; }
    this.state = 'vine'; this.vine = v; this.glide = false; this.cutOk = false;
    Audio2.play('grab');
  }
  leaveVine(G, vx, vy) {
    const v = this.vine; if (v) v.holder = null;
    this.vine = null; this.state = 'play'; this.vx = vx; this.vy = vy; this.vineCd = 0.35; this.onGround = false;
  }
  updateVine(G, dt, mx) {
    const v = this.vine;
    if (!v) { this.state = 'play'; return; }
    if (mx) { v.omega += mx * 3.2 * dt * Math.cos(v.ang); this.face = mx; }
    if (Input.held('up')) v.len = Math.max(v.minLen, v.len - 100 * dt);
    if (Input.held('down')) v.len = Math.min(v.maxLen, v.len + 100 * dt);
    const hx = v.ax + Math.sin(v.ang) * v.len, hy = v.ay + Math.cos(v.ang) * v.len;
    this.x = hx - this.w / 2; this.y = hy + 26;
    this.prevBottom = this.bottom;
    if (Input.pressed('jumpBtn')) {
      const vt = v.omega * v.len;
      let vx = Math.cos(v.ang) * vt + mx * 80, vy = -Math.sin(v.ang) * vt - 560;
      if (Math.abs(vx) < 120) vx = (mx || this.face) * 160;
      this.leaveVine(G, clamp(vx, -520, 520), Math.max(-1000, vy));
      this.face = sign(this.vx) || this.face; Audio2.play('jump'); this.sx = 0.85; this.sy = 1.15;
    }
    if (this.bottom > G.level.H * T - 14) this.fall(G);
  }
  draw(g, G) {
    if (this.state === 'gone') return;
    if (this.state === 'balloon') { drawRide(g, this, G); return; }
    if (this.inv > 0 && this.state === 'play' && Math.floor(this.inv * 14) % 2 === 0) return;
    let pose = 'idle';
    if (this.state === 'dead') pose = 'dead';
    else if (this.state === 'win') pose = 'win';
    else if (this.state === 'vine') pose = 'swing';
    else if (this.sliding) pose = 'slide';
    else if (this.glide) pose = 'glide';
    else if (this.wallSlide) pose = 'wall';
    else if (!this.onGround) pose = this.vy < 0 ? 'jump' : 'fall';
    else if (Math.abs(this.vx) > 20) pose = 'run';
    const face = this.wallSlide ? this.wallSlide : this.face;
    const spin = this.flipT > 0 ? (1 - this.flipT / 0.42) * TAU * face : (this.swimming && this.underwater && this.char === 'banni' ? clamp(this.vx / 230, -1, 1) * 1.1 : 0);
    const sunk = this.sink > 0;
    if (sunk) { g.save(); g.beginPath(); g.rect(this.cx - 80, this.bottom - 300, 160, 300); g.clip(); g.translate(0, this.sink); }
    if (this.char === 'pickle') {
      let pp = pose === 'run' ? 'run' : (pose === 'jump' || pose === 'fall' || pose === 'wall' || pose === 'dead') ? 'jump' : pose === 'win' ? 'cheer' : 'idle';
      let rot = spin;
      if (this.swimming) { pp = 'run'; rot = 1.3 + Math.sin(this.t * 6) * 0.08; }
      if (this.pounding) { pp = 'jump'; rot = 0; }
      drawPickle(g, { x: this.cx, y: this.bottom, face, pose: pp, phase: this.swimming ? this.t * 14 : this.phase * 1.3, t: this.t, sx: this.sx * (this.pounding ? 0.9 : 1), sy: this.sy * (this.pounding ? 1.15 : 1), rot, wings: G.theme.id === 3 && !this.onGround, worried: this.hurtT > 0 || pose === 'dead', glaze: this.glaze });
      if (this.pounding) { g.save(); g.globalAlpha = 0.5; for (let i = 0; i < 3; i++) line(g, this.cx - 8 + i * 8, this.y - 10 - i * 4, this.cx - 8 + i * 8, this.y - 30 - i * 4, '#fff', 2); g.restore(); }
    } else {
      drawBanni(g, {
        x: this.cx, y: this.bottom, face, sx: this.sx, sy: this.sy, pose, phase: this.phase, t: this.t, hp: Math.max(1, this.hp), vx: this.vx,
        glaze: this.glaze, power: this.power, star: this.star, hurt: this.hurtT > 0, angry: this.shootT > 0, spin,
        lean: pose === 'run' ? clamp(this.vx / 2400, -0.12, 0.12) * face : (this.state === 'vine' && this.vine ? -this.vine.ang * face * 0.6 : 0)
      });
    }
    if (this.leech && this.leech.alive) drawLeech(g, this.cx - this.face * 8, this.y + this.h * 0.55, { t: this.t, face: -this.face, attached: true });
    if (sunk) g.restore();
    if (typeof drawHeroExtras === 'function') drawHeroExtras(g, this, G);
  }
}

// ---------------- Pickle (companion) ----------------
class Pickle extends Ent {
  constructor(x, y) {
    super(x - 10, y - 46, 20, 46);
    this.mode = 'follow'; this.trail = []; this.cd = 0; this.face = 1; this.phase = 0; this.t = 0; this.rot = 0;
    this.say = null; this.sayT = 0; this.queue = []; this.onGround = true; this.pose = 'idle'; this.bounces = 0;
  }
  reset(x, y) { this.x = x - 10; this.y = y - 46; this.trail = []; this.mode = 'follow'; this.vx = this.vy = 0; this.rot = 0; }
  speak(text, dur, force) {
    if (force) { this.queue = []; this.say = text; this.sayT = dur || Math.max(4.5, text.length * 0.065); return; }
    if (this.say === text) { this.sayT = Math.max(this.sayT, dur || 5); return; }
    if (this.sayT > 0.6) { if (this.queue.length < 3 && !this.queue.includes(text)) this.queue.push(text); return; }
    this.say = text; this.sayT = dur || Math.max(4.5, text.length * 0.065);
  }
  // close the current bubble; the next queued line, if any, shows right away
  dismiss() {
    if (!this.say || this.sayT <= 0) return false;
    const n = this.queue.shift();
    if (n) { this.say = n; this.sayT = Math.max(4.5, n.length * 0.065); } else { this.say = null; this.sayT = 0; }
    return true;
  }
  hitBubble(px, py) { const r = this.bubbleRect; return !!(r && this.say && this.sayT > 0 && px >= r.x - 16 && px <= r.x + r.w + 16 && py >= r.y - 16 && py <= r.y + r.h + 16); }
  throwIt(G) {
    const p = G.player;
    if (this.asBanni || this.mode !== 'follow' || this.cd > 0 || p.state !== 'play') return;
    this.mode = 'thrown'; this.x = p.cx - 10; this.y = p.y - 6; this.vx = p.face * 560 + p.vx * 0.3; this.vy = -430; this.face = p.face;
    this.cd = 1.4; this.bounces = 0; this.flyT = 0; Audio2.play('throw');
    G.stats.throws++;
  }
  update(G, dt) {
    this.t += dt; this.cd -= dt;
    if (this.sayT > 0) { this.sayT -= dt; if (this.sayT <= 0) { this.say = null; if (this.queue.length) { const n = this.queue.shift(); this.say = n; this.sayT = Math.max(4.5, n.length * 0.065); } } }
    const p = G.player;
    if (this.mode === 'follow') {
      if (p.state === 'play' || p.state === 'vine') this.trail.push({ x: p.cx, y: p.state === 'vine' ? null : p.bottom, g: p.onGround });
      if (this.trail.length > 40) this.trail.shift();
      // find a trail point at least 46px behind
      let tx = this.cx, ty = this.bottom, ground = true;
      for (let i = this.trail.length - 1; i >= 0; i--) {
        const q = this.trail[i];
        if (q.y === null) continue;
        if (Math.abs(q.x - p.cx) >= 42 || i <= this.trail.length - 22) { tx = q.x; ty = q.y; ground = q.g; break; }
      }
      if (this.trail.length && Math.hypot(tx - this.cx, ty - this.bottom) > 600) { this.x = tx - 10; this.y = ty - 46; }
      const nx = lerp(this.cx, tx, 0.25), ny = lerp(this.bottom, ty, 0.3);
      this.vx = (nx - this.cx) / dt; this.vy = (ny - this.bottom) / dt;
      this.x = nx - 10; this.y = ny - 46;
      if (Math.abs(this.vx) > 15) this.face = sign(this.vx);
      else if (p.state === 'play') this.face = sign(p.cx - this.cx) || this.face;
      this.onGround = ground;
      this.pose = !ground ? 'jump' : Math.abs(this.vx) > 30 ? 'run' : (this.sayT > 0 ? 'talk' : 'idle');
      this.phase += Math.abs(this.vx) * dt * 0.06;
      this.rot = 0;
    } else if (this.mode === 'thrown') {
      this.flyT += dt;
      this.vy += 1500 * dt; this.rot += this.face * 14 * dt;
      this.noOneWay = true;
      moveBody(this, G, dt);
      if (this.hitL || this.hitR) { this.vx = -this.vx * 0.5; }
      if (this.onGround) { this.bounces++; this.vy = -280; this.vx *= 0.6; Audio2.play('crunch'); if (this.bounces >= 2) this.mode = 'return'; }
      for (const e of G.ents) {
        if (!e.alive || !e.enemy || e.frozen > 0 || !overlap(this, e)) continue;
        if (e.boss) { if (e.onPickle) e.onPickle(G, this); this.mode = 'return'; break; }
        e.kill(G, 'pickle'); Audio2.play('crunch');
      }
      if (this.flyT > 1.6 || this.bottom > G.level.H * T) this.mode = 'return';
      this.pose = 'jump';
    } else if (this.mode === 'return') {
      const tx = p.cx - p.face * 40, ty = p.bottom - 10;
      const dx = tx - this.cx, dy = ty - this.bottom, d = Math.hypot(dx, dy);
      const sp = 520;
      this.rot = approach(this.rot, 0, 10 * dt);
      if (d < 24) { this.mode = 'follow'; this.trail = []; this.rot = 0; }
      else { this.x += dx / d * sp * dt; this.y += dy / d * sp * dt - Math.sin(this.t * 10) * 1.2; this.face = sign(dx) || this.face; }
      this.pose = 'jump';
    }
  }
  draw(g, G) {
    const p = G.player;
    if (p.state === 'gone' && this.mode === 'follow') return;
    if (p.state === 'balloon') return;
    if (this.asBanni) {
      const pose = this.pose === 'jump' ? 'jump' : this.pose === 'run' ? 'run' : 'idle';
      drawBanni(g, { x: this.cx, y: this.bottom + 4, face: this.face, sx: 1, sy: 1, pose, phase: this.phase * 0.8, t: this.t, hp: Math.max(1, p.hp), glaze: p.glaze, power: p.power, scale: 0.92 });
      return;
    }
    drawPickle(g, { x: this.cx, y: this.bottom, face: this.face, pose: this.pose, phase: this.phase, t: this.t, rot: this.mode === 'follow' ? 0 : this.rot, worried: G.boss && G.boss.alive, wings: G.theme.id === 3 && (this.pose === 'jump' || this.mode !== 'follow') });
  }
  drawBubble(g, G) {
    if (!this.say || this.sayT <= 0) { this.bubbleRect = null; return; }
    const a = Math.min(1, this.sayT * 3, (this.say ? 1 : 0));
    g.save(); g.globalAlpha = a;
    g.font = '800 15px Nunito, sans-serif';
    const lines = wrapText(g, this.say, 250);
    const skip = Input.label('skip');
    const lh = 19, w = Math.min(270, Math.max(...lines.map(l => g.measureText(l).width), 150) + 22), h = lines.length * lh + 14 + 15;
    const an = (G.player && G.player.char === 'pickle') ? G.player : (G.player && G.player.state === 'balloon') ? G.player : this;
    let bx = clamp(an.cx - w / 2, G.cam.x + 6, G.cam.x + G.viewW - w - 6);
    let by = an.y - h - 22;
    if (by < G.cam.y + 56) by = G.cam.y + 56;
    rrect(g, bx, by, w, h, 12); fs(g, 'rgba(255,255,255,0.96)', '#3d7f2c', 2.5);
    const tx = clamp(an.cx, bx + 14, bx + w - 14);
    g.beginPath(); g.moveTo(tx - 7, by + h - 1); g.lineTo(tx + 1, by + h + 11); g.lineTo(tx + 7, by + h - 1); g.closePath(); fs(g, '#fff');
    g.beginPath(); g.moveTo(tx - 7, by + h); g.lineTo(tx + 1, by + h + 11); g.lineTo(tx + 7, by + h); g.strokeStyle = '#3d7f2c'; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = '#244d18'; g.textAlign = 'left'; g.textBaseline = 'top';
    lines.forEach((l, i) => g.fillText(l, bx + 11, by + 8 + i * lh));
    g.font = '800 11px Nunito, sans-serif'; g.fillStyle = 'rgba(36,77,24,0.55)'; g.textAlign = 'right';
    g.fillText(skip + '  ✕', bx + w - 10, by + h - 17);
    const m = g.getTransform(); this.bubbleRect = { x: m.a * bx + m.e, y: m.d * by + m.f, w: m.a * w, h: m.d * h };
    g.restore();
  }
}
function wrapText(g, text, maxW) {
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const test = cur ? cur + ' ' + w : w; if (g.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test; }
  if (cur) lines.push(cur);
  return lines;
}

// ---------------- Enemies ----------------
class Enemy extends Ent {
  constructor(x, y, w, h) {
    super(x, y, w, h);
    this.enemy = true; this.harmful = true; this.stompable = true; this.slideable = true; this.freezable = true; this.shootable = true;
    this.frozen = 0; this.solid = null; this.active = false; this.groundT = TL.ICE;
  }
  freeze(G) {
    if (!this.freezable || this.frozen > 0) return false;
    this.frozen = 6; this.solid = 'full'; this.vx = 0; this.vy = 0; Audio2.play('freeze');
    G.burst(this.cx, this.cy, 8, ['#d6f3ff', '#ffffff', '#8fd3f5']);
    return true;
  }
  pre(G, dt) {
    this.t += dt;
    if (this.frozen > 0) {
      this.frozen -= dt;
      if (this.frozen <= 0) { this.solid = null; G.burst(this.cx, this.cy, 6, ['#d6f3ff', '#ffffff']); }
      return false;
    }
    return true;
  }
  kill(G, how) {
    if (!this.alive) return;
    this.alive = false; this.solid = null;
    G.stats.enemies++;
    if (this.frozen > 0) { G.burst(this.cx, this.cy, 14, ['#d6f3ff', '#ffffff', '#8fd3f5']); Audio2.play('break'); }
    else G.burst(this.cx, this.cy, 10, SPRINKLES);
    if (how === 'stomp') Audio2.play('stomp'); else if (how !== 'pickle') Audio2.play('pop');
    G.add(new Poof(this.cx, this.cy, this));
  }
  onStomp(G, p) { this.kill(G, 'stomp'); return 'bounce'; }
  onShot(G, s) { this.kill(G, 'shot'); return true; }
  drawIce(g) {
    if (this.frozen <= 0) return;
    const blink = this.frozen < 1.2 && Math.floor(this.frozen * 10) % 2 === 0;
    g.save(); g.globalAlpha = blink ? 0.35 : 0.62;
    rrect(g, this.x - 3, this.y - 3, this.w + 6, this.h + 6, 6); fs(g, '#bfe9ff', '#5ab0e0', 2);
    g.globalAlpha = 0.9; line(g, this.x + 3, this.y + 4, this.x + 9, this.y + 14, '#fff', 2.5);
    g.restore();
  }
  walkerMove(G, dt, speed) {
    this.vy += PHYS.grav * dt;
    if (this.onGround) {
      const ahead = this.vx > 0 ? this.x + this.w + 3 : this.x - 3;
      if (!groundBelow(G, ahead, this.bottom + 8) && !groundBelow(G, ahead, this.bottom + T)) this.vx = -this.vx;
    }
    const v = this.vx;
    moveBody(this, G, dt);
    if (this.hitL) this.vx = speed; else if (this.hitR) this.vx = -speed; else this.vx = v;
    if (this.vx) this.face = sign(this.vx);
    if (this.y > G.level.H * T + 40) this.alive = false;
  }
}
class Sprout extends Enemy {
  constructor(x, y, o) { super(x - 13, y - 30, 26, 30); this.speed = (o && o.speed) || 52; this.vx = -this.speed; }
  update(G, dt) { if (!this.pre(G, dt)) return; this.walkerMove(G, dt, this.speed); }
  draw(g) { drawSprout(g, this.cx, this.bottom, { t: this.t * (this.frozen > 0 ? 0 : 1), face: this.face, frozen: this.frozen > 0 }); this.drawIce(g); }
}
class PeaJumper extends Enemy {
  constructor(x, y) { super(x - 13, y - 30, 26, 30); this.timer = rnd(0.6, 1.6); this.shot = false; this.sq = 0; }
  update(G, dt) {
    if (!this.pre(G, dt)) return;
    const p = G.player; this.face = sign(p.cx - this.cx) || this.face;
    this.vy += PHYS.grav * 0.75 * dt;
    if (this.onGround) {
      this.timer -= dt; this.sq = this.timer < 0.3 ? (0.3 - this.timer) * 2 : Math.max(0, this.sq - dt * 4);
      if (this.timer <= 0) { this.vy = -560; this.timer = 1.9; this.shot = false; this.sq = 0; }
    } else if (this.vy > -80 && !this.shot) {
      this.shot = true;
      if (Math.abs(p.cx - this.cx) < 460 && Math.abs(p.cy - this.cy) < 200) { G.add(new PeaShot(this.cx + this.face * 12, this.y + 12, this.face)); Audio2.play('pea'); this.shootT = 0.25; }
    }
    this.shootT = (this.shootT || 0) - dt;
    this.vx = 0; moveBody(this, G, dt);
  }
  draw(g) { drawPea(g, this.cx, this.bottom, { face: this.face, squash: this.sq, frozen: this.frozen > 0, shoot: this.shootT > 0 }); this.drawIce(g); }
}
class PeaShot extends Enemy {
  constructor(x, y, dir) { super(x - 6, y - 6, 12, 12); this.vx = dir * 230; this.life = 3; this.freezable = false; this.slideable = true; this.active = true; }
  update(G, dt) {
    this.t += dt; this.life -= dt; this.x += this.vx * dt;
    if (this.life <= 0 || rectSolid(G, this.x + 2, this.y + 2, this.w - 4, this.h - 4)) { this.alive = false; G.burst(this.cx, this.cy, 4, ['#8edb5a']); }
  }
  kill(G) { this.alive = false; G.burst(this.cx, this.cy, 4, ['#8edb5a']); Audio2.play('pop'); }
  draw(g) { circ(g, this.cx, this.cy, 6); fs(g, '#8edb5a', '#2e6a1a', 1.5); circ(g, this.cx - 2, this.cy - 2, 1.8); fs(g, '#fff'); }
}
class Broccoli extends Enemy {
  constructor(x, y) { super(x - 16, y - 20, 32, 20); this.base = y; this.up = 0; this.st = 'hide'; this.timer = 0; this.cool = 0; this.harmful = false; this.stompable = false; this.slideable = false; }
  update(G, dt) {
    if (!this.pre(G, dt)) return;
    const p = G.player, d = Math.abs(p.cx - this.cx);
    this.cool -= dt;
    switch (this.st) {
      case 'hide': this.up = Math.max(0, this.up - dt * 3); if (d < 130 && this.cool <= 0 && p.state === 'play') { this.st = 'rise'; Audio2.play('pop'); } break;
      case 'rise': this.up = Math.min(1, this.up + dt * 5); if (this.up >= 1) { this.st = 'out'; this.timer = 1.7; } break;
      case 'out': this.timer -= dt; if (this.timer <= 0) this.st = 'sink'; break;
      case 'sink': this.up = Math.max(0, this.up - dt * 2.5); if (this.up <= 0) { this.st = 'hide'; this.cool = 1.3; } break;
    }
    const out = this.up > 0.45;
    this.harmful = out; this.stompable = out; this.slideable = out;
    this.h = 20 + 42 * this.up; this.y = this.base - this.h;
  }
  freeze(G) { if (this.up < 0.45) return false; return super.freeze(G); }
  draw(g) { drawBroccoli(g, this.cx, this.base, { up: this.up, frozen: this.frozen > 0 }); this.drawIce(g); }
}
class ScoopBall extends Enemy {
  constructor(x, y, dir) { super(x - 16, y - 34, 32, 32); this.vx = dir * 140; this.rot = 0; this.flavor = pick(['pink', 'mint', 'van']); this.life = 9; this.freezable = true; this.active = true; }
  update(G, dt) {
    if (!this.pre(G, dt)) return;
    this.life -= dt;
    this.vy += PHYS.grav * dt;
    if (this.onSlope) { const down = slopeRises(this.onSlope) ? -1 : 1; this.vx += down * 520 * dt; }
    else if (this.onGround) this.vx = approach(this.vx, sign(this.vx) * 210, 200 * dt);
    this.vx = clamp(this.vx, -430, 430);
    const v = this.vx;
    moveBody(this, G, dt);
    if (this.hitL || this.hitR || this.life <= 0) { this.splat(G); return; }
    this.vx = v;
    this.rot += this.vx / 17 * dt;
    if (this.y > G.level.H * T) this.alive = false;
  }
  splat(G) { this.alive = false; G.burst(this.cx, this.cy, 10, [this.flavor === 'pink' ? '#ffc3d4' : this.flavor === 'mint' ? '#c8f0dc' : '#fff3d6', '#ffffff', ...SPRINKLES.slice(0, 3)]); Audio2.play('pop'); }
  draw(g) { drawScoopBall(g, this.cx, this.bottom + 1, { rot: this.rot, flavor: this.flavor }); this.drawIce(g); }
}
class BallSpawner extends Ent {
  constructor(x, y, dir, period) { super(x, y, 2, 2); this.dir = dir; this.period = period || 2.6; this.timer = 0.4; }
  update(G, dt) {
    const p = G.player;
    if (Math.abs(p.cx - this.x) > 950 || p.state !== 'play') return;
    this.timer -= dt;
    if (this.timer <= 0) { this.timer = this.period; G.add(new ScoopBall(this.x, this.y, this.dir)); }
  }
}
class Bat extends Enemy {
  constructor(x, y) { super(x - 16, y - 14, 32, 28); this.hx = x; this.hy = y; this.st = 'idle'; this.timer = rnd(0, 1); this.cool = 0.5; this.s = 0; }
  update(G, dt) {
    if (!this.pre(G, dt)) return;
    const p = G.player; this.cool -= dt;
    let cx = this.cx, cy = this.cy;
    if (this.st === 'idle') {
      cx = lerp(cx, this.hx + Math.sin(this.t * 1.3) * 20, 0.1); cy = lerp(cy, this.hy + Math.sin(this.t * 2.6) * 8, 0.1);
      this.face = sign(p.cx - cx) || this.face;
      if (this.cool <= 0 && p.state === 'play' && Math.abs(p.cx - cx) < 300 && p.cy > cy - 40 && p.cy - cy < 380) {
        this.st = 'swoop'; this.s = 0; this.sx0 = cx; this.sy0 = cy; this.tx = p.cx; this.ty = p.cy; Audio2.play('ghost');
      }
    } else if (this.st === 'swoop') {
      this.s += dt / 1.25;
      const s = Math.min(1, this.s);
      cx = this.sx0 + (this.tx - this.sx0) * 2 * s; cy = this.sy0 + (this.ty - this.sy0) * Math.sin(Math.PI * s);
      this.face = sign(this.tx - this.sx0) || this.face;
      if (rectSolid(G, cx - 10, cy - 10, 20, 20) && s > 0.5) this.s = 1;
      if (this.s >= 1) { this.st = 'back'; }
    } else if (this.st === 'back') {
      const dx = this.hx - cx, dy = this.hy - cy, d = Math.hypot(dx, dy);
      if (d < 6) { this.st = 'idle'; this.cool = 1.6; } else { cx += dx / d * 150 * dt; cy += dy / d * 150 * dt; this.face = sign(dx) || this.face; }
    }
    this.x = cx - this.w / 2; this.y = cy - this.h / 2;
  }
  onHitPlayer(G) { G.tears(2.2); }
  draw(g) { drawBat(g, this.cx, this.cy, { t: this.t, face: this.face, frozen: this.frozen > 0 }); this.drawIce(g); }
}
class Slug extends Enemy {
  constructor(x, y) { super(x - 20, y - 20, 40, 20); this.vx = -36; this.slimeT = 0; }
  update(G, dt) {
    if (!this.pre(G, dt)) return;
    this.walkerMove(G, dt, 36);
    if (this.onGround) { this.slimeT -= dt; if (this.slimeT <= 0) { this.slimeT = 0.22; G.addSlime(this.cx - this.face * 12, this.bottom); } }
  }
  draw(g) { drawSlug(g, this.cx, this.bottom, { t: this.t, face: this.face, frozen: this.frozen > 0 }); this.drawIce(g); }
}
class Mole extends Enemy {
  constructor(x, y) { super(x - 15, y - 34, 30, 34); this.bx = x; this.by = y; this.oy = 0; this.voy = 0; this.st = 'under'; this.cool = rnd(0.3, 1); this.sq = 0; }
  update(G, dt) {
    if (!this.pre(G, dt)) return;
    const p = G.player; this.cool -= dt;
    this.face = sign(p.cx - this.bx) || this.face;
    if (this.st === 'under') {
      this.oy = 0;
      if (this.cool <= 0 && p.state === 'play' && Math.abs(p.cx - this.bx) < 175) { this.st = 'up'; this.voy = -660; Audio2.play('pop'); G.dust(this.bx, this.by, 6); }
    } else {
      this.voy += 1700 * dt; this.oy += this.voy * dt;
      if (this.oy >= 0 && this.voy > 0) { this.oy = 0; this.st = 'under'; this.cool = 1.5; G.dust(this.bx, this.by, 5); }
    }
    const out = this.oy < -14;
    this.harmful = out; this.stompable = out; this.slideable = out;
    this.x = this.bx - 15; this.y = this.by + this.oy - 34;
    this.h = 34;
  }
  freeze(G) { if (this.oy > -14) return false; return super.freeze(G); }
  draw(g, G) {
    if (this.frozen <= 0) drawMound(g, this.bx, this.by, G.theme.id);
    if (this.oy < -2 || this.frozen > 0) {
      g.save(); g.beginPath(); g.rect(this.bx - 60, this.by - 400, 120, 400 - 6 + (this.frozen > 0 ? 6 : 0)); g.clip();
      drawRadish(g, this.bx, this.by + this.oy, { face: this.face, frozen: this.frozen > 0, squash: this.voy > 0 ? 0.1 : -0.1 });
      g.restore();
    }
    this.drawIce(g);
  }
}
class Leaf extends Enemy {
  constructor(x, y) { super(x - 12, y - 8, 24, 16); this.x0 = x; this.ph = rnd(0, 6); this.vy = 85; this.freezable = false; this.stompable = true; this.slideable = false; this.active = true; this.fade = 1; }
  onStomp(G) { this.kill(G); Audio2.play('pop'); return 'bounce'; }
  update(G, dt) {
    this.t += dt;
    if (this.landed) { this.fade -= dt * 1.5; this.harmful = false; if (this.fade <= 0) this.alive = false; return; }
    this.y += this.vy * dt; this.x = this.x0 + Math.sin(this.t * 3 + this.ph) * 34 - this.w / 2;
    if (groundBelow(G, this.cx, this.bottom)) this.landed = true;
    if (this.y > G.level.H * T) this.alive = false;
  }
  kill(G) { this.alive = false; G.burst(this.cx, this.cy, 5, ['#9fd27e', '#5e9e45']); }
  draw(g) {
    g.save(); g.globalAlpha = this.fade; g.translate(this.cx, this.cy); g.rotate(Math.sin(this.t * 3 + this.ph) * 0.6);
    g.beginPath(); g.moveTo(-13, 0); g.quadraticCurveTo(0, -12, 13, 0); g.quadraticCurveTo(0, 12, -13, 0); fs(g, '#9fd27e', '#3a6e2a', 1.8);
    line(g, -11, 0, 11, 0, '#5e9e45', 1.4); g.restore();
  }
}
class Tear extends Enemy {
  constructor(x, y) { super(x - 7, y - 9, 14, 18); this.vy = 60; this.freezable = false; this.stompable = false; this.slideable = false; this.active = true; }
  update(G, dt) { this.t += dt; this.vy += 900 * dt; this.y += this.vy * dt; if (groundBelow(G, this.cx, this.bottom) || this.y > G.level.H * T) { this.alive = false; G.burst(this.cx, this.bottom, 5, ['#8fd8ff', '#ffffff']); Audio2.play('drip'); } }
  onHitPlayer(G) { G.tears(1.8); this.alive = false; }
  kill(G) { this.alive = false; G.burst(this.cx, this.cy, 4, ['#8fd8ff']); }
  draw(g) { g.beginPath(); g.moveTo(this.cx, this.y); g.quadraticCurveTo(this.cx + 8, this.y + 12, this.cx, this.bottom); g.quadraticCurveTo(this.cx - 8, this.y + 12, this.cx, this.y); fs(g, '#8fd8ff', '#3a8ac0', 1.5); }
}
class OnionRing extends Enemy {
  constructor(x, y, vx, vy) { super(x - 13, y - 13, 26, 26); this.vx = vx; this.vy = vy; this.life = 5; this.freezable = false; this.stompable = true; this.active = true; }
  update(G, dt) { this.t += dt; this.life -= dt; this.x += this.vx * dt; this.y += this.vy * dt; if (this.life <= 0 || rectSolid(G, this.x + 6, this.y + 6, this.w - 12, this.h - 12)) this.alive = false; }
  onHitPlayer(G) { G.tears(1.6); }
  kill(G) { this.alive = false; G.burst(this.cx, this.cy, 5, ['#e8dcf7', '#b27ad6']); Audio2.play('pop'); }
  draw(g) { g.save(); g.translate(this.cx, this.cy); g.rotate(this.t * 6); ell(g, 0, 0, 12, 9); fs(g, null, '#b27ad6', 5); ell(g, 0, 0, 12, 9); fs(g, null, '#f3e8ff', 2); g.restore(); }
}
class CaramelDrop extends Enemy {
  constructor(x, y) { super(x - 7, y, 14, 18); this.freezable = false; this.stompable = false; this.slideable = false; this.active = true; this.noOneWay = false; }
  update(G, dt) {
    this.t += dt; this.vy = Math.min(this.vy + 1400 * dt, 800);
    const v = this.vy; moveBody(this, G, dt);
    if (this.onGround) { this.alive = false; G.addCaramel(this.cx, this.bottom, this.standOn); Audio2.play('drip'); }
    if (this.y > G.level.H * T) this.alive = false;
  }
  kill(G) { this.alive = false; G.burst(this.cx, this.cy, 5, ['#f2b33d', '#c97a1a']); }
  draw(g) { g.beginPath(); g.moveTo(this.cx, this.y); g.quadraticCurveTo(this.cx + 9, this.y + 13, this.cx, this.bottom); g.quadraticCurveTo(this.cx - 9, this.y + 13, this.cx, this.y); fs(g, '#f2b33d', '#a8621a', 1.6); circ(g, this.cx - 2, this.y + 10, 2); fs(g, 'rgba(255,255,255,0.7)'); }
}

// ---------------- Projectiles ----------------
class CherryPit extends Ent {
  constructor(x, y, dir) { super(x - 6, y - 6, 12, 12); this.vx = dir * 400; this.vy = -120; this.bounces = 0; this.life = 1.6; this.noOneWay = false; this.noEnts = false; }
  update(G, dt) {
    this.t += dt; this.life -= dt;
    this.vy += 1500 * dt;
    moveBody(this, G, dt);
    if (this.onGround) { this.vy = -400; this.bounces++; }
    if (this.hitL || this.hitR || this.hitCeil || this.bounces > 3 || this.life <= 0 || this.y > G.level.H * T) { this.alive = false; G.burst(this.cx, this.cy, 4, ['#e2363c', '#ffffff']); return; }
    for (const e of G.ents) {
      if (!e.alive || !e.enemy || !e.shootable || !overlap(this, e)) continue;
      if (e.frozen > 0) { e.kill(G, 'shot'); this.alive = false; return; }
      if (e.onShot(G, this)) { this.alive = false; return; }
    }
  }
  draw(g) { g.save(); g.translate(this.cx, this.cy); g.rotate(this.t * 14); ell(g, 0, 0, 6, 4.5); fs(g, '#e2363c', '#7a1a14', 1.4); circ(g, -2, -1.5, 1.5); fs(g, '#fff'); g.restore(); }
}
class MintShot extends Ent {
  constructor(x, y, dir) { super(x - 8, y - 8, 16, 16); this.vx = dir * 430; this.life = 1.1; }
  update(G, dt) {
    this.t += dt; this.life -= dt; this.x += this.vx * dt;
    if (this.life <= 0 || rectSolid(G, this.x + 2, this.y + 2, this.w - 4, this.h - 4)) { this.alive = false; G.burst(this.cx, this.cy, 6, ['#ffffff', '#7fe0c4']); return; }
    if (Math.random() < 0.5) G.spark(this.cx, this.cy, '#d6fff2');
    for (const e of G.ents) {
      if (!e.alive || !e.enemy || !overlap(this, e) || e.frozen > 0) continue;
      if (e.boss) { if (e.onShot) e.onShot(G, this); this.alive = false; return; }
      if (e.freezable && e.freeze(G)) { this.alive = false; return; }
      if (e.shootable) { e.kill(G, 'shot'); this.alive = false; return; }
    }
  }
  draw(g) { drawPowerIcon(g, 'mint', this.cx, this.cy, this.t * 8, 0.7); }
}

// ---------------- FX ----------------
class Poof extends Ent {
  constructor(x, y, src) { super(x, y, 1, 1); this.life = 0.45; this.src = src; this.fx = true; }
  update(G, dt) { this.life -= dt; if (this.life <= 0) this.alive = false; }
  draw(g) {
    const k = 1 - this.life / 0.45;
    g.save(); g.globalAlpha = 1 - k;
    if (this.src) { const bx = this.src.cx, by = this.src.bottom; g.save(); g.translate(bx, by); g.scale(1 + k * 0.5, Math.max(0.05, 1 - k * 1.1)); g.translate(-bx, -by); this.src.frozen = 0; try { this.src.draw(g, window.__G); } catch (e) { } g.restore(); }
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6; circ(g, this.x + Math.cos(a) * k * 26, this.y + Math.sin(a) * k * 26, 7 * (1 - k) + 2); fs(g, 'rgba(255,255,255,0.9)'); }
    g.restore();
  }
}
class DropFx extends Ent {
  constructor(x, y) { super(x, y, 1, 1); this.vy = -520; this.life = 0.55; this.fx = true; }
  update(G, dt) { this.t += dt; this.vy += 1600 * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) { this.alive = false; G.spark(this.x, this.y, '#ffe9b0'); } }
  draw(g) { drawDrop(g, this.x, this.y, this.t * 6, 1.1); }
}
class TextFx extends Ent {
  constructor(x, y, text, col) { super(x, y, 1, 1); this.text = text; this.col = col || '#fff'; this.life = 1.1; this.fx = true; }
  update(G, dt) { this.life -= dt; this.y -= 40 * dt; if (this.life <= 0) this.alive = false; }
  draw(g) { g.save(); g.globalAlpha = Math.min(1, this.life * 2); g.font = '900 18px Nunito, sans-serif'; g.textAlign = 'center'; g.lineWidth = 4; g.strokeStyle = '#4a2410'; g.strokeText(this.text, this.x, this.y); g.fillStyle = this.col; g.fillText(this.text, this.x, this.y); g.restore(); }
}
class SheepFx extends Ent {
  constructor(x, y, dir) { super(x, y, 1, 1); this.vx = dir * 160; this.vy = -420; this.life = 2.4; this.fx = true; this.face = dir; }
  update(G, dt) { this.t += dt; this.life -= dt; this.vy += 1200 * dt; this.x += this.vx * dt; this.y += this.vy * dt; if (this.vy > 0 && groundBelow(G, this.x, this.y)) { this.vy = -380; this.y = Math.floor(this.y / T) * T; } if (this.life <= 0) this.alive = false; }
  draw(g) { g.save(); g.globalAlpha = Math.min(1, this.life); drawSheep(g, this.x, this.y, { t: this.t, face: this.face, happy: true }); if (this.t < 1.2) { g.font = '900 15px Nunito, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.strokeStyle = '#7a3a4a'; g.lineWidth = 3; g.strokeText('Мее!', this.x, this.y - 40); g.fillText('Мее!', this.x, this.y - 40); } g.restore(); }
}

// ---------------- Pickups ----------------
class Pickup extends Ent {
  constructor(kind, x, y, o) {
    super(x - 14, y - 14, 28, 28); this.kind = kind; this.o = o || {}; this.rise = 0; this.baseY = this.y; this.t = rnd(0, 6);
    if (this.o.fromBlock) { this.rise = 1; this.top = this.o.top; this.baseY = this.top - 34; this.startY = this.top + 4; this.y = this.startY; }
  }
  update(G, dt) {
    this.t += dt;
    if (this.rise > 0) { this.rise = Math.max(0, this.rise - dt * 2.2); this.y = lerp(this.baseY, this.startY, this.rise); return; }
    if (overlap(this, G.player) && (G.player.state === 'play' || G.player.state === 'vine')) this.collect(G);
  }
  collect(G) {
    const p = G.player; this.alive = false;
    switch (this.kind) {
      case 'drop': G.collectDrop(1); Audio2.play('drop'); G.spark(this.cx, this.cy, '#ffe9b0'); break;
      case 'gold': G.collectGold(this.o.i, this); break;
      case 'rcherry': G.rcherries++; Audio2.play('cherry'); G.burst(this.cx, this.cy, 14, RAINBOW); G.add(new TextFx(this.cx, this.y - 6, `${G.rcherries}/${G.def.rcherries}`, '#fff6a0')); break;
      case 'note': G.openNote(this.o.id); break;
      case 'ice': if (p.heal()) { Audio2.play('ice'); G.add(new TextFx(this.cx, this.y, 'Свежесть!', '#bff0ff')); } else { G.collectDrop(5); Audio2.play('ice'); G.add(new TextFx(this.cx, this.y, '+5', '#ffe9b0')); } break;
      case 'life': G.lives++; Audio2.play('oneup'); G.add(new TextFx(this.cx, this.y, '+1 жизнь', '#c8ff8a')); break;
      case 'glaze': p.glaze = true; Audio2.play('power'); G.add(new TextFx(this.cx, this.y, 'Глазурь!', '#ffd9a8')); G.hint('glaze', 'Шоколадная глазурь! Она выдержит один удар. А ещё в глазури ты сможешь разбивать шоколадные блоки головой.'); break;
      case 'cherry': p.power = 'cherry'; Audio2.play('power'); G.add(new TextFx(this.cx, this.y, 'Вишнемёт!', '#ffb0b0')); G.hint('cherry', `Вишнемёт! Жми ${Input.label('fire')} — стреляй вишнёвыми косточками.`); break;
      case 'mint': p.power = 'mint'; Audio2.play('power'); G.add(new TextFx(this.cx, this.y, 'Мятный леденец!', '#c8fff0')); G.hint('mint', `Мятный леденец! Жми ${Input.label('fire')} — замораживай врагов. На замёрзших можно стоять!`); break;
      case 'parachute': p.power = 'parachute'; Audio2.play('power'); G.add(new TextFx(this.cx, this.y, 'Парашют!', '#ffd6e8')); G.hint('para', `Парашют из сахарной ваты! В прыжке держи ${Input.label('jump')} — будешь медленно парить.`); break;
      default: if (typeof collectW2 === 'function') collectW2(G, this, p); break;
      case 'star': p.star = 10; Audio2.play('power'); Audio2.setRate(G.musicRate * 1.15); G.add(new TextFx(this.cx, this.y, 'Звёздная посыпка!', '#fff6a0')); break;
    }
  }
  draw(g, G) {
    const x = this.cx, y = this.cy;
    if (this.drawW2 && this.drawW2(g, G)) return;
    if (this.rise > 0) { g.save(); g.beginPath(); g.rect(x - 40, this.top - 200, 80, 200); g.clip(); }
    switch (this.kind) {
      case 'drop': drawDrop(g, x, y, this.t * 2.5); break;
      case 'gold': drawGoldCherry(g, x, y, this.t); break;
      case 'rcherry': { g.save(); const hue = (this.t * 120) % 360; const gl = g.createRadialGradient(x, y, 2, x, y, 26); gl.addColorStop(0, `hsla(${hue},100%,75%,0.7)`); gl.addColorStop(1, `hsla(${hue + 60},100%,70%,0)`); g.fillStyle = gl; circ(g, x, y, 26); g.fill(); g.restore(); drawGoldCherry(g, x, y, this.t); break; }
      case 'note': if (G.theme.world === 2) drawBottle(g, x, y, this.t); else drawFortune(g, x, y, this.t); break;
      case 'ice': drawIceCube(g, x, y, this.t); break;
      default: {
        const gl = g.createRadialGradient(x, y, 2, x, y, 24); gl.addColorStop(0, 'rgba(255,255,255,0.7)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gl; circ(g, x, y, 24); g.fill();
        drawPowerIcon(g, this.kind, x, y, this.t);
      }
    }
    if (this.rise > 0) g.restore();
  }
}

// ---------------- Blocks & platforms ----------------
class Block extends Ent {
  constructor(c, r, content, o) {
    super(c * T, r * T, T, T); o = o || {};
    this.content = content; this.count = content === 'drops' ? 8 : 1; this.used = !content && o.kind !== 'brick';
    this.kind = o.kind || 'bonus'; this.hidden = !!o.hidden; this.solid = this.hidden ? 'hidden' : 'full'; this.bump = 0; this.groundT = TL.SOLID;
  }
  update(G, dt) { this.t += dt; if (this.bump > 0) this.bump = Math.max(0, this.bump - dt * 60); if (this.hidden && Math.random() < 0.02) G.spark(this.x + rnd(5, 35), this.y + rnd(5, 35), 'rgba(255,255,255,0.7)'); }
  hit(G, p) {
    this.bump = 8;
    for (const e of G.ents) if (e.alive && e instanceof Pickup && !(e.rise > 0) && Math.abs(e.cx - this.cx) < 30 && e.bottom <= this.y + 6 && e.bottom >= this.y - 48) e.collect(G);
    for (const e of G.ents) if (e.alive && e.enemy && !e.boss && e.frozen <= 0 && e.x < this.x + this.w && e.x + e.w > this.x && Math.abs(e.bottom - this.y) < 6) e.kill(G, 'bump');
    if (this.kind === 'brick') {
      if (p.glaze || p.helmet) { this.alive = false; this.solid = null; Audio2.play('break'); G.burst(this.cx, this.cy, 16, ['#6a3a1e', '#8a4e28', '#4a2410']); G.collectDrop(1); }
      else Audio2.play('bump');
      return;
    }
    if (this.hidden) { this.hidden = false; this.solid = 'full'; }
    if (this.used) { Audio2.play('bump'); return; }
    const c = this.content;
    if (c === 'drop' || c === 'drops') { G.collectDrop(1); Audio2.play('drop'); G.add(new DropFx(this.cx, this.y - 10)); }
    else { G.add(new Pickup(c, this.cx, this.y - 16, { fromBlock: true, top: this.y, i: this.idx, id: this.idx })); Audio2.play('pop'); }
    this.count--; if (this.count <= 0) this.used = true;
  }
  draw(g) { if (this.hidden) return; drawBlock(g, this.x, this.y, { used: this.used, kind: this.kind, bump: this.bump, t: this.t }); }
}
class MeltPlat extends Ent {
  constructor(x, y, w) { super(x, y, w, 20); this.solid = 'top'; this.home = y; this.dx = 0; this.dy = 0; this.melt = 0; this.stoodT = 0; this.groundT = TL.SOLID; this.dripT = 0; }
  update(G, dt) {
    this.t += dt;
    const p = G.player, stood = p.standOn === this && p.onGround;
    let ny = this.y;
    if (stood) { ny += 46 * dt; this.stoodT = 0.45; this.melt = Math.min(1, this.melt + dt * 0.9); this.dripT -= dt; if (this.dripT <= 0) { this.dripT = 0.25; G.drip(this.x + rnd(6, this.w - 6), this.y + 18, '#fff3f6'); } }
    else {
      this.stoodT -= dt;
      if (this.stoodT <= 0) { if (this.y > this.home) ny = Math.max(this.home, this.y - 34 * dt); else this.melt = Math.max(0, this.melt - dt * 0.7); if (this.y > this.home && Math.random() < 0.15) G.spark(this.x + rnd(0, this.w), this.y + rnd(0, 18), '#e8fbff'); }
    }
    ny = Math.min(ny, G.level.H * T + 40);
    this.dy = ny - this.y; this.dx = 0; this.y = ny;
  }
  draw(g) {
    const x = this.x, y = this.y, w = this.w, m = this.melt;
    g.save();
    g.beginPath(); g.moveTo(x + 4, y + 2); g.quadraticCurveTo(x + w / 2, y - 6, x + w - 4, y + 2);
    g.lineTo(x + w - 2, y + 14);
    for (let i = 4; i >= 0; i--) { const px = x + 2 + i * (w - 4) / 4; g.lineTo(px, y + 16 + (i % 2) * (4 + m * 10)); }
    g.closePath();
    const gr = g.createLinearGradient(0, y - 6, 0, y + 22); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, m > 0.3 ? '#ffd6e2' : '#f9c4d1');
    fs(g, gr, '#d58ea4', 2);
    g.fillStyle = 'rgba(255,255,255,0.8)'; ell(g, x + 12, y + 2, 6, 2.5); g.fill();
    for (let i = 0; i < 3; i++) { g.save(); g.translate(x + 10 + i * (w - 20) / 2, y + 7); g.rotate(i * 2); g.fillStyle = SPRINKLES[i + 1]; g.fillRect(-3, -1, 6, 2); g.restore(); }
    if (this.y < this.home + 1 && m < 0.05) { g.globalAlpha = 0.5; line(g, x + 6, y + 10, x + 14, y + 4, '#bfefff', 2); }
    g.restore();
  }
}
class WaferPiece extends Ent {
  constructor(x, y) { super(x, y, T, 14); this.solid = 'top'; this.home = y; this.st = 'ok'; this.timer = 0; this.dx = 0; this.dy = 0; this.groundT = TL.SOLID; this.alpha = 1; }
  update(G, dt) {
    this.t += dt; const p = G.player; let ny = this.y;
    if (this.st === 'ok') { if (p.standOn === this && p.onGround) { this.st = 'shake'; this.timer = 0.38; Audio2.play('crack'); } }
    else if (this.st === 'shake') { this.timer -= dt; if (this.timer <= 0) { this.st = 'fall'; this.vy = 60; } }
    else if (this.st === 'fall') { this.vy += 1500 * dt; ny += this.vy * dt; if (ny > G.level.H * T + 80) { this.st = 'gone'; this.solid = null; this.timer = 3.2; } }
    else if (this.st === 'gone') { this.timer -= dt; if (this.timer <= 0 && !(Math.abs(p.cx - this.cx) < 60 && Math.abs(p.bottom - this.home) < 70)) { this.st = 'ok'; ny = this.home; this.solid = 'top'; this.alpha = 0; } }
    this.alpha = Math.min(1, this.alpha + dt * 3);
    this.dy = ny - this.y; this.dx = 0; this.y = ny;
  }
  draw(g) {
    if (this.st === 'gone') return;
    const sh = this.st === 'shake' ? Math.sin(this.t * 80) * 2 : 0;
    g.save(); g.globalAlpha = this.alpha; g.translate(sh, 0);
    rrect(g, this.x + 1, this.y, this.w - 2, 14, 5); fs(g, '#e8b46a', '#9a6a2a', 1.8);
    for (let i = 0; i < 4; i++) line(g, this.x + 5 + i * 9, this.y + 2, this.x + 9 + i * 9, this.y + 12, '#9a6a2a', 1.6);
    if (this.st !== 'ok') { line(g, this.x + 18, this.y, this.x + 22, this.y + 14, '#5a3a1a', 1.5); }
    g.restore();
  }
}
class Vine extends Ent {
  constructor(x, y, len) { super(x - 4, y, 8, len); this.ax = x; this.ay = y; this.len = len; this.maxLen = len; this.minLen = Math.max(60, len * 0.45); this.ang = 0; this.omega = 0; this.holder = null; this.ph = rnd(0, 6); }
  update(G, dt) {
    this.t += dt;
    const p = G.player;
    if (this.holder) {
      const acc = -(1900 / this.len) * Math.sin(this.ang) - this.omega * 0.18;
      this.omega += acc * dt; this.ang += this.omega * dt;
      if (this.ang > 1.25) { this.ang = 1.25; this.omega = Math.min(0, this.omega); }
      if (this.ang < -1.25) { this.ang = -1.25; this.omega = Math.max(0, this.omega); }
      // swinging into walls stops the swing
      const hx = this.ax + Math.sin(this.ang) * this.len, hy = this.ay + Math.cos(this.ang) * this.len;
      if (rectSolid(G, hx - 12, hy + 10, 24, 46)) { this.omega *= -0.3; this.ang -= this.omega * dt * 2; }
    } else {
      this.len = approach(this.len, this.maxLen, 60 * dt);
      const target = Math.sin(this.t * 1.4 + this.ph) * 0.12;
      this.ang = lerp(this.ang, target, 0.04); this.omega = 0;
      if (p.state === 'play' && p.vineCd <= 0 && !p.onGround) {
        // distance from hands point to rope
        const hx = p.cx, hy = p.y - 4;
        const ex = this.ax + Math.sin(this.ang) * this.len, ey = this.ay + Math.cos(this.ang) * this.len;
        const vx = ex - this.ax, vy = ey - this.ay, l2 = vx * vx + vy * vy;
        let k = ((hx - this.ax) * vx + (hy - this.ay) * vy) / l2; k = clamp(k, 0, 1);
        const qx = this.ax + vx * k, qy = this.ay + vy * k;
        if (Math.hypot(hx - qx, hy - qy) < 24 && k > 0.35) {
          this.holder = p;
          this.len = clamp(Math.hypot(hx - this.ax, hy - this.ay), this.minLen, this.maxLen);
          this.ang = Math.atan2(hx - this.ax, hy - this.ay);
          this.omega = clamp((p.vx * Math.cos(this.ang) - p.vy * Math.sin(this.ang)) / this.len, -3, 3);
          p.grabVine(G, this);
          G.hint('vine', `Раскачивайся ${Input.label('move')}, лезь ↑ ↓, а ${Input.label('jump')} — прыжок с лианы!`);
        }
      }
    }
  }
  draw(g) {
    const ex = this.ax + Math.sin(this.ang) * this.len, ey = this.ay + Math.cos(this.ang) * this.len;
    const tipLen = this.holder ? Math.max(0, this.maxLen - this.len) : 0;
    const sag = this.holder ? 0 : Math.sin(this.t * 2 + this.ph) * 6;
    g.save(); g.lineCap = 'round';
    g.beginPath(); g.moveTo(this.ax, this.ay);
    g.quadraticCurveTo(this.ax + (ex - this.ax) * 0.5 + sag, this.ay + (ey - this.ay) * 0.5, ex, ey);
    if (tipLen > 4) g.lineTo(ex + Math.sin(this.ang * 0.5) * tipLen * 0.3, ey + tipLen);
    g.strokeStyle = '#2a1424'; g.lineWidth = 9; g.stroke();
    g.strokeStyle = '#5a2a4a'; g.lineWidth = 5; g.stroke();
    g.setLineDash([3, 9]); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; g.stroke(); g.setLineDash([]);
    circ(g, this.ax, this.ay, 7); fs(g, '#5a2a4a', '#2a1424', 2);
    if (!this.holder) { circ(g, ex, ey + 2, 6); fs(g, '#5a2a4a', '#2a1424', 2); }
    g.restore();
  }
}
class Dripper extends Ent {
  constructor(x, y, period, phase) { super(x - 10, y, 20, 10); this.period = period || 2.6; this.timer = phase !== undefined ? phase : rnd(0, this.period); }
  update(G, dt) {
    this.t += dt;
    if (Math.abs(G.player.cx - this.cx) > 900) return;
    this.timer -= dt;
    if (this.timer <= 0) { this.timer = this.period; G.add(new CaramelDrop(this.cx, this.y + 6)); }
  }
  draw(g) {
    const k = clamp(1 - this.timer / 0.8, 0, 1);
    g.beginPath(); g.moveTo(this.cx - 12, this.y); g.quadraticCurveTo(this.cx, this.y + 10, this.cx + 12, this.y); g.closePath(); fs(g, '#f2b33d', '#a8621a', 1.5);
    g.beginPath(); g.moveTo(this.cx - 4, this.y + 3); g.quadraticCurveTo(this.cx - 6 * k - 2, this.y + 6 + 12 * k, this.cx, this.y + 8 + 14 * k); g.quadraticCurveTo(this.cx + 6 * k + 2, this.y + 6 + 12 * k, this.cx + 4, this.y + 3); fs(g, '#f2b33d', '#a8621a', 1.4);
    circ(g, this.cx - 4, this.y + 3, 1.6); fs(g, 'rgba(255,255,255,0.7)');
  }
}
class CaramelPlat extends Ent {
  constructor(x, y) { super(x - 22, y - 14, 44, 14); this.solid = 'top'; this.life = 6.5; this.stack = 1; this.dx = 0; this.dy = 0; this.groundT = TL.SOLID; this.wob = 0; }
  grow() { if (this.stack < 3) { this.stack++; this.y -= 14; this.h += 14; this.dy = -14; } this.life = 6.5; this.wob = 0.3; }
  update(G, dt) {
    this.t += dt; this.life -= dt; this.wob = Math.max(0, this.wob - dt);
    this.dy = 0; this.dx = 0;
    if (this.life <= 0) { this.alive = false; this.solid = null; G.burst(this.cx, this.cy, 8, ['#f2b33d', '#c97a1a']); }
  }
  draw(g) {
    const melting = this.life < 1.6, a = melting ? 0.5 + Math.sin(this.t * 20) * 0.3 : 1;
    g.save(); g.globalAlpha = a;
    const sq = this.wob > 0 ? Math.sin(this.wob * 40) * 2 : 0;
    rrect(g, this.x - sq, this.y + sq, this.w + sq * 2, this.h - sq, 7);
    const gr = g.createLinearGradient(0, this.y, 0, this.bottom); gr.addColorStop(0, '#ffd27a'); gr.addColorStop(1, '#d9862a');
    fs(g, gr, '#9a5a1a', 2);
    for (let i = 1; i < this.stack; i++) line(g, this.x + 4, this.y + i * 14, this.x + this.w - 4, this.y + i * 14, 'rgba(150,80,20,0.5)', 1.5);
    ell(g, this.x + 12, this.y + 4, 7, 2.5); fs(g, 'rgba(255,255,255,0.7)');
    g.restore();
  }
}

// ---------------- NPC & triggers ----------------
class Checkpoint extends Ent {
  constructor(x, y, id) { super(x - 20, y - 110, 70, 110); this.fx = x; this.fy = y; this.activeCP = false; this.id = id; }
  update(G, dt) {
    this.t += dt;
    if (!this.activeCP && G.player.state === 'play' && overlap(this, G.player)) {
      this.activeCP = true; G.checkpoint = { x: this.fx + 30, y: this.fy, id: this.id };
      Audio2.play('check'); G.burst(this.fx + 45, this.fy - 100, 12, ['#ffe14d', '#ffffff', '#f6c46a']);
      G.add(new TextFx(this.fx + 10, this.fy - 130, 'Чекпоинт!', '#fff6a0'));
      const lines = ['Эх, всё тает… Беги, внучок, я тут посторожу!', 'Флажок поднят! Если что — начнёшь отсюда.', 'В мои годы мороженое было холоднее… Удачи!'];
      G.npcSay(this, lines[this.id % lines.length]);
      if (G.player.hp < G.player.maxHp) { G.player.hp = G.player.maxHp; G.add(new TextFx(this.fx, this.fy - 70, 'Свежесть!', '#bff0ff')); }
    }
  }
  draw(g) { drawGrandpa(g, this.fx, this.fy, { t: this.t, active: this.activeCP }); }
}
class Cage extends Ent {
  constructor(x, y, id) { super(x - 26, y - 60, 52, 60); this.fx = x; this.fy = y; this.open = false; this.id = id; }
  update(G, dt) {
    this.t += dt;
    if (!this.open && G.player.state === 'play' && overlap(this, G.player)) {
      this.open = true; G.stats.sheep++; Audio2.play('sheep');
      G.add(new SheepFx(this.fx, this.fy, G.player.face)); G.burst(this.fx, this.fy - 30, 10, ['#ffffff', '#ffc9d6']);
      G.add(new TextFx(this.fx, this.fy - 70, `Овечка спасена! ${G.stats.sheep}/${G.def.sheep}`, '#ffffff'));
    }
  }
  draw(g) { drawCage(g, this.fx, this.fy, { t: this.t, open: this.open }); }
}
class Hint extends Ent {
  constructor(x, id, text, o) { super(x, -1000, 4, 4000); this.id = id; this.text = text; this.o = o || {}; }
  update(G) {
    const p = G.player;
    if (p.state !== 'play' && p.state !== 'vine') return;
    if (p.cx > this.x && p.cx < this.x + 400 && (this.o.maxY === undefined || p.bottom <= this.o.maxY + 2)) {
      this.alive = false; G.hint(this.id, typeof this.text === 'function' ? this.text() : this.text);
    }
  }
}
class Gate extends Ent {
  constructor(c, r0, r1) { super(c * T, r0 * T, T, (r1 - r0 + 1) * T); this.closed = false; this.solid = null; this.k = 0; }
  close() { this.closed = true; this.solid = 'full'; Audio2.play('gate'); }
  open() { this.closed = false; this.solid = null; Audio2.play('gate'); }
  update(G, dt) { this.t += dt; this.k = approach(this.k, this.closed ? 1 : 0, dt * 3); }
  draw(g, G) {
    if (this.k <= 0.01) return;
    const h = this.h * this.k, y = this.y + this.h - h;
    if (G.theme.id === 1) {
      rrect(g, this.x + 2, y, this.w - 4, h, 8);
      const gr = g.createLinearGradient(this.x, 0, this.x + this.w, 0); gr.addColorStop(0, '#bfe9ff'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(1, '#8fd3f5');
      fs(g, gr, '#5ab0e0', 2.5);
      for (let i = 0; i < h; i += 34) line(g, this.x + 8, y + i + 6, this.x + 16, y + i + 20, 'rgba(255,255,255,0.9)', 2);
    } else {
      for (let i = 0; i < 3; i++) { rrect(g, this.x + 3 + i * 12, y, 9, h, 4); fs(g, '#3a1a2a', '#1a0a14', 1.5); }
      for (let j = 20; j < h; j += 60) { rrect(g, this.x, y + j, this.w, 8, 4); fs(g, '#5a2a4a'); }
    }
  }
}
class BossTrigger extends Ent {
  constructor(x) { super(x, -1000, 4, 4000); }
  update(G) { const p = G.player; if (p.state === 'play' && p.cx > this.x) { this.alive = false; G.startBoss(); } }
}
class Balloon extends Ent {
  constructor(x, y) { super(x - 30, y - 40, 60, 40); this.ty = y; this.y = y - 520; this.st = 'down'; this.fx = x; }
  update(G, dt) {
    this.t += dt;
    if (this.st === 'down') { this.y = approach(this.y, this.ty - 40, 220 * dt); if (this.y >= this.ty - 40) this.st = 'wait'; }
    else if (this.st === 'wait') {
      const p = G.player;
      if (p.state === 'play' && overlap({ x: this.x - 6, y: this.y - 20, w: this.w + 12, h: this.h + 20 }, p)) { this.st = 'up'; G.levelComplete(this); }
    } else if (this.st === 'up') { this.vy = Math.max(-260, (this.vy || 0) - 300 * dt); this.y += this.vy * dt; }
  }
  draw(g) { drawBalloon(g, this.cx, this.bottom, { t: this.t }); }
}

// ---------------- Bosses ----------------
class CaptainCabbage extends Enemy {
  constructor(ar) {
    super(0, 0, 90, 90);
    this.ar = ar; this.r = 56; this.hp = 3; this.maxHp = 3; this.st = 'wait'; this.timer = 0; this.dir = -1; this.rot = 0;
    this.boss = true; this.active = true; this.name = 'Капитан Кочан'; this.freezable = false; this.slideable = false; this.starKill = false;
    this.ccx = ar.x0 + (ar.x1 - ar.x0) * 0.72; this.ccy = -200; this.vy = 0; this.leafT = 0; this.harmful = false; this.flash = 0; this.hat = 0;
    this.sync();
  }
  sync() { this.x = this.ccx - 46; this.y = this.ccy - 44; this.w = 92; this.h = 98; }
  reset() { this.hp = 3; this.st = 'wait'; this.ccx = this.ar.x0 + (this.ar.x1 - this.ar.x0) * 0.72; this.ccy = -200; this.vy = 0; this.alive = true; this.sync(); }
  begin() { this.st = 'enter'; this.ccy = this.ar.floor - 600; this.vy = 0; }
  update(G, dt) {
    this.t += dt; this.flash = Math.max(0, this.flash - dt);
    const p = G.player, floorY = this.ar.floor - this.r;
    const speed = [0, 470, 390, 320][this.hp];
    switch (this.st) {
      case 'wait': break;
      case 'enter':
        this.vy += 1800 * dt; this.ccy += this.vy * dt;
        if (this.ccy >= floorY) { this.ccy = floorY; this.vy = 0; this.st = 'taunt'; this.timer = 1.3; G.shake(0.5); Audio2.play('thud'); Audio2.play('roar'); G.burst(this.ccx, this.ar.floor, 14, ['#9fd27e', '#ffffff']); }
        break;
      case 'taunt':
        this.timer -= dt; this.hat = Math.sin(this.t * 12) * 0.15;
        if (this.timer <= 0) { this.dir = sign(p.cx - this.ccx) || -this.dir; this.st = 'roll'; this.leafT = 0.3; }
        break;
      case 'roll':
        this.ccx += this.dir * speed * dt; this.rot += this.dir * speed / this.r * dt;
        this.leafT -= dt;
        if (this.leafT <= 0) { this.leafT = [0, 0.8, 1.05, 1.35][this.hp]; G.add(new Leaf(this.leafX(G), this.ar.top + 10)); }
        if (Math.random() < 0.3) G.dust(this.ccx - this.dir * 30, this.ar.floor, 1);
        if (this.dir < 0 && this.ccx - this.r <= this.ar.x0) { this.ccx = this.ar.x0 + this.r; this.bonk(G); }
        if (this.dir > 0 && this.ccx + this.r >= this.ar.x1) { this.ccx = this.ar.x1 - this.r; this.bonk(G); }
        break;
      case 'dizzy':
        this.timer -= dt; this.rot = approach(this.rot % TAU, 0, 6 * dt);
        if (this.timer <= 0) { this.st = 'taunt'; this.timer = 0.55; }
        break;
      case 'hit':
        this.timer -= dt;
        if (this.timer <= 0) { if (this.hp <= 0) { this.st = 'dead'; this.timer = 1.6; Audio2.play('win'); G.clearBossShots(); } else { this.st = 'taunt'; this.timer = 0.8; Audio2.play('roar'); } }
        break;
      case 'dead':
        this.timer -= dt; this.rot += dt * 10;
        if (Math.random() < 0.5) G.burst(this.ccx + rnd(-40, 40), this.ccy + rnd(-40, 40), 3, ['#9fd27e', '#5e9e45', '#ffffff']);
        if (this.timer <= 0) { this.alive = false; G.burst(this.ccx, this.ccy, 40, ['#9fd27e', '#5e9e45', '#ffffff', '#6a7288']); for (let i = 0; i < 8; i++) G.add(new Leaf(this.ccx + rnd(-50, 50), this.ccy + rnd(-40, 20))); G.bossDefeated(this); }
        break;
    }
    this.harmful = this.st === 'roll' || this.st === 'enter' || (this.st === 'taunt' && this.timer < 0.25);
    this.sync();
  }
  leafX(G) {
    const px = G.player.cx;
    for (let k = 0; k < 8; k++) { const x = rnd(this.ar.x0 + 40, this.ar.x1 - 40); if (Math.abs(x - px) > 90) return x; }
    return this.ar.x0 + 60;
  }
  bonk(G) {
    this.st = 'dizzy'; this.timer = [0, 2.4, 2.6, 2.8][this.hp]; G.shake(0.45); Audio2.play('thud');
    for (let i = 0; i < 2; i++) G.add(new Leaf(this.leafX(G), this.ar.top + 10 - i * 90));
    G.hint('cabbage2', 'Он закружился! Скорее — прыгай ему на макушку!');
  }
  onStomp(G, p) {
    if (this.st === 'dizzy') {
      this.hp--; this.st = 'hit'; this.timer = 0.9; this.flash = 0.9; Audio2.play('bossHit'); G.shake(0.3); G.mercy(this.ar);
      G.burst(this.ccx, this.ccy - 30, 14, ['#9fd27e', '#ffffff']);
      p.vy = -780; p.cutOk = false; p.vx = (p.cx < this.ccx ? -1 : 1) * 260;
      return 'none';
    }
    if (this.st === 'roll' || this.st === 'taunt') { G.hint('cabbage3', 'Пока он крутится, его не возьмёшь! Жди, пока врежется в стену.'); Audio2.play('bump'); return 'bounce'; }
    return 'none';
  }
  onShot(G, s) { Audio2.play('bump'); return true; }
  onPickle(G) { Audio2.play('bump'); G.pickle.speak('Ой! Он слишком твёрдый для огурца!', 3); }
  kill() { }
  draw(g) {
    if (this.st === 'wait') return;
    const k = this.st === 'dead' ? Math.max(0.2, this.timer / 1.6) : 1;
    g.save(); g.translate(this.ccx, this.ccy + this.r * (1 - k)); g.scale(k, k);
    if (this.st === 'hit') g.scale(1.15, 0.8);
    drawCabbage(g, 0, 0, { r: this.r, rot: this.rot, t: this.t, dizzy: this.st === 'dizzy', flash: this.flash > 0, look: clamp((window.__G ? window.__G.player.cx - this.ccx : 0) / 200, -1, 1), hatTilt: -0.12 + this.hat, faceRot: this.st === 'roll' ? this.rot * 0.15 : 0 });
    g.restore();
  }
}
class OnionGhost extends Enemy {
  constructor(ar) {
    super(0, 0, 80, 100);
    this.ar = ar; this.layers = 4; this.maxHp = 4; this.st = 'wait'; this.timer = 0; this.boss = true; this.active = true; this.name = 'Луковый Дух';
    this.freezable = false; this.slideable = false; this.starKill = false; this.dmg = 0; this.flash = 0; this.t2 = 0;
    this.gx = (ar.x0 + ar.x1) / 2; this.gy = -300; this.tx = 0; this.ty = 0; this.tearT = 1;
    this.sync();
  }
  get hp() { return this.layers; }
  get sc() { return [0.55, 0.6, 0.72, 0.86, 1][this.layers]; }
  get spd() { return [1.7, 1.65, 1.4, 1.2, 1][this.layers]; }
  sync() { const s = this.sc; this.w = 76 * s; this.h = 96 * s; this.x = this.gx - this.w / 2; this.y = this.gy - 62 * s; }
  reset() { this.layers = 4; this.st = 'wait'; this.gy = -300; this.gx = (this.ar.x0 + this.ar.x1) / 2; this.alive = true; this.dmg = 0; this.sync(); }
  begin() { this.st = 'enter'; this.gy = this.ar.top - 120; Audio2.play('ghost'); }
  get floatY() { return this.ar.floor - 275; }
  update(G, dt) {
    this.t += dt; this.flash = Math.max(0, this.flash - dt);
    const p = G.player, mid = (this.ar.x0 + this.ar.x1) / 2, half = (this.ar.x1 - this.ar.x0) / 2 - 90;
    switch (this.st) {
      case 'wait': break;
      case 'enter':
        this.gy = approach(this.gy, this.floatY, 160 * dt);
        if (this.gy >= this.floatY) { this.st = 'float'; this.timer = 2.4; Audio2.play('roar'); }
        break;
      case 'float': {
        this.t2 += dt * this.spd;
        const tx = mid + Math.sin(this.t2 * 0.9) * half, ty = this.floatY + Math.sin(this.t2 * 1.8) * 26;
        this.gx = lerp(this.gx, tx, 0.06); this.gy = lerp(this.gy, ty, 0.06);
        this.tearT -= dt;
        if (this.tearT <= 0) { this.tearT = 2.1 / this.spd; G.add(new Tear(this.gx, this.gy + 40 * this.sc)); Audio2.play('tears'); }
        this.timer -= dt;
        if (this.timer <= 0) {
          if (this.layers <= 2 && Math.random() < 0.45) { this.st = 'rings'; this.timer = 1.0; this.fired = false; }
          else { this.st = 'windup'; this.timer = 0.8; }
        }
        break;
      }
      case 'windup':
        this.timer -= dt; this.gx += Math.sin(this.t * 60) * 1.5;
        if (this.timer <= 0) { this.st = 'swoop'; this.tx = clamp(p.cx, this.ar.x0 + 50, this.ar.x1 - 50); this.ty = this.ar.floor - 50 * this.sc; Audio2.play('ghost'); }
        break;
      case 'swoop': {
        const dx = this.tx - this.gx, dy = this.ty - this.gy, d = Math.hypot(dx, dy), sp = 470 * this.spd;
        if (d < sp * dt + 2) { this.gx = this.tx; this.gy = this.ty; this.st = 'tired'; this.timer = 2.0 / Math.sqrt(this.spd); G.shake(0.2); G.dust(this.gx, this.ar.floor, 8); G.hint('ghost2', 'Он выдохся! Прыгай ему на макушку!'); }
        else { this.gx += dx / d * sp * dt; this.gy += dy / d * sp * dt; }
        break;
      }
      case 'tired': this.timer -= dt; this.gy = this.ty + Math.sin(this.t * 4) * 3; if (this.timer <= 0) { this.st = 'rise'; } break;
      case 'rise': this.gy = approach(this.gy, this.floatY, 190 * dt); if (this.gy <= this.floatY + 1) { this.st = 'float'; this.timer = 2.2; } break;
      case 'rings':
        this.timer -= dt;
        if (!this.fired && this.timer < 0.5) {
          this.fired = true; Audio2.play('shoot');
          const a0 = Math.atan2(p.cy - this.gy, p.cx - this.gx);
          for (const da of [-0.34, 0, 0.34]) G.add(new OnionRing(this.gx, this.gy, Math.cos(a0 + da) * 175, Math.sin(a0 + da) * 175));
        }
        if (this.timer <= 0) { this.st = 'float'; this.timer = 2.2; }
        break;
      case 'hit':
        this.timer -= dt; this.gy = approach(this.gy, this.floatY - 30, 260 * dt);
        this.gx = approach(this.gx, this.fleeX, 330 * dt);
        if (this.timer <= 0) { if (this.layers <= 0) { this.st = 'dead'; this.timer = 1.8; Audio2.play('win'); G.clearBossShots(); } else { this.st = 'float'; this.timer = 1.8; Audio2.play('roar'); } }
        break;
      case 'dead':
        this.timer -= dt; this.gy -= 30 * dt;
        if (Math.random() < 0.6) G.spark(this.gx + rnd(-40, 40), this.gy + rnd(-50, 40), '#f3e8ff');
        if (this.timer <= 0) { this.alive = false; G.burst(this.gx, this.gy, 40, ['#f3e8ff', '#c9a6ee', '#ffffff', '#ffe14d']); G.bossDefeated(this); }
        break;
    }
    this.harmful = ['float', 'windup', 'swoop', 'rings', 'rise', 'enter'].includes(this.st);
    this.sync();
  }
  loseLayer(G, p) {
    this.layers--; this.dmg = 0; this.st = 'hit'; this.timer = 1.1; if (this.layers > 0) G.mercy(this.ar);
    const mid = (this.ar.x0 + this.ar.x1) / 2; this.fleeX = G.player.cx < mid ? this.ar.x1 - 120 : this.ar.x0 + 120; this.t2 = G.player.cx < mid ? Math.PI / 2 / 0.9 : -Math.PI / 2 / 0.9; this.flash = 1.0; Audio2.play('bossHit'); G.shake(0.3);
    G.burst(this.gx, this.gy, 16, ['#f3e8ff', '#c9a6ee', '#ffffff']);
    G.add(new TextFx(this.gx, this.gy - 70, ['Слой!', 'Ещё слой!', 'Почти!', 'Всё!'][3 - this.layers] || 'Слой!', '#f3e8ff'));
  }
  onStomp(G, p) {
    if (['hit', 'dead', 'enter', 'wait'].includes(this.st)) return 'bounce';
    this.loseLayer(G, p); p.vy = -800; p.cutOk = false;
    return 'none';
  }
  onShot(G, s) {
    if (['hit', 'dead', 'enter', 'wait'].includes(this.st)) return true;
    this.dmg++; this.flash = 0.15; Audio2.play('bump');
    if (this.dmg >= 3) this.loseLayer(G);
    return true;
  }
  onPickle(G) { if (!['hit', 'dead', 'enter', 'wait'].includes(this.st)) { this.dmg++; this.flash = 0.2; if (this.dmg >= 3) this.loseLayer(G); } }
  onHitPlayer(G) { G.tears(2); }
  kill() { }
  draw(g) {
    if (this.st === 'wait') return;
    g.save();
    if (this.st === 'dead') g.globalAlpha = Math.max(0, this.timer / 1.8);
    drawGhost(g, this.gx, this.gy, { scale: this.sc, t: this.t, layers: this.layers, flash: this.flash > 0, windup: this.st === 'windup', tired: this.st === 'tired', rage: this.layers <= 2, look: clamp((window.__G ? window.__G.player.cx - this.gx : 0) / 200, -1, 1) });
    g.restore();
  }
}
