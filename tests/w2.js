// Проверки механик мира 2 на уровне 2-1 «Пляж Кокосовой Стружки».
// Запуск: node tests/w2.js [папка для скриншотов]
const { open } = require('./harness');
const T = 40, G = 13, X = c => c * T + T / 2, Y = r => r * T;

const results = [];
function check(name, ok, info) { results.push(ok); console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${info ? '  ' + info : ''}`); }

(async () => {
  const h = await open({ shots: process.argv[2] || '.' });
  const shot = async n => { if (process.argv[2]) await h.shot(n); };
  const fresh = async () => { await h.eval(() => { delete window.__dbg.Save.data.cherries['2-1']; }); await h.start('2-1'); await h.eval(() => { window.__dbg.Save.data.settings.hints = false; }); await h.step(0.2); };
  // jump from (x, y) to the right: run, jump, double-jump; returns where the hero lands
  const hop = async (x, y, { dbl = 0.3, hold = 0.25, stopAt = Infinity } = {}) => {
    await h.put(x, y); await h.step(0.15);
    await h.step(hold, ['ArrowRight', 'Space']);
    await h.step(Math.max(0, (dbl || 0) - hold), ['ArrowRight']);
    if (dbl !== false) await h.step(0.25, ['ArrowRight', 'Space']);
    for (let i = 0; i < 120; i++) {
      const s0 = await h.state();
      await h.step(1 / 60, s0.x < stopAt ? ['ArrowRight'] : s0.x > stopAt + 20 ? ['ArrowLeft'] : []);
      const s = await h.state(); if (s.ground && !s.wet) return s; if (s.wet) return s;
    }
    return h.state();
  };

  // 1. the level starts with Pickle
  await fresh();
  let s = await h.state();
  check('мир 2 начинается за Пикля', s.char === 'pickle');
  await shot('w21-start');

  // 2. Pickle walks on the sea floor in the shallows and can leave the water
  await h.put(X(40), Y(G + 3)); await h.step(0.5);
  s = await h.state();
  check('Пикль стоит на дне под водой', s.wet && s.ground && s.under, JSON.stringify({ y: s.y }));
  await h.put(X(45), Y(G + 3)); await h.step(0.2);
  // a player taps jump: one push off the floor, then the kick when the head reaches the surface
  const dir = async () => ((await h.state()).x < X(48) ? ['ArrowRight'] : (await h.state()).x > X(49) ? ['ArrowLeft'] : []);
  for (let i = 0; i < 8; i++) { await h.step(0.1, (await dir()).concat(['Space'])); await h.step(0.08, await dir()); }
  for (let i = 0; i < 6; i++) await h.step(0.1, await dir());
  s = await h.state();
  check('Пикль выпрыгивает из воды на скалу', !s.wet && s.y <= Y(G - 1) + 2, JSON.stringify({ x: s.x, y: s.y }));

  // 3. Banni floats, and the tide lets him leap up to the plank with the gold cherry
  await fresh(); await h.eval(() => { const G = window.__G; G.player.setChar(G, 'banni'); });
  await h.put(X(54), Y(G) + 60); await h.step(1.2);
  s = await h.state();
  check('Банни всплывает к поверхности', s.swim && !s.under, JSON.stringify({ y: s.y }));
  // wait for the high tide, then leap and double-jump
  await h.eval(() => { const G = window.__G, w = G.waters.find(q => q.contains(G.player.cx, G.player.cy + 40, G.time)); window.__tide = w; });
  for (let i = 0; i < 400; i++) { const hi = await h.eval(() => { const G = window.__G, w = window.__tide; return Math.sin(G.time * Math.PI * 2 / w.period + w.phase) < -0.9; }); if (hi) break; await h.step(1 / 60); }
  await h.step(0.3, ['Space']); await h.step(0.2); await h.step(0.3, ['Space']); await h.step(1.2);
  s = await h.state();
  check('в прилив Банни достаёт до доски с золотой вишенкой', s.gold[0] === '1', JSON.stringify({ y: s.y, gold: s.gold }));
  await shot('w21-tide');

  // 4. the crunch: barrel with a boat part, rind in the tunnel
  await fresh(); await h.eval(() => { window.__dbg.Save.data.crunch = true; });
  await h.put(X(84), Y(G)); await h.step(0.2); await h.step(0.05, ['KeyC']); await h.step(0.6);
  s = await h.state();
  check('Хруст разбивает бочку, часть лодки собрана', s.parts === 1, `частей ${s.parts}`);
  await h.put(X(88), Y(G)); await h.step(0.2); await h.step(0.05, ['KeyC']); await h.step(0.5);
  const rind = await h.eval(() => [window.__G.level.get(90, 11), window.__G.level.get(90, 12)]);
  check('Хруст пробивает корку в туннеле', rind[0] === 0 && rind[1] === 0, JSON.stringify(rind));
  await h.put(X(93), Y(G)); await h.step(0.2); await h.step(0.05, ['KeyC']); await h.step(0.5);
  await h.step(1.2, ['ArrowRight']);
  s = await h.state();
  check('через туннель можно пройти', s.x > X(96), `x=${s.x}`);
  await shot('w21-tunnel');

  // 5. lagoon: crunch under water opens the pocket with the second gold cherry
  await h.put(X(116), Y(G + 6)); await h.step(0.6); await h.step(0.05, ['KeyC']); await h.step(0.5); await h.step(0.8, ['ArrowRight']);
  s = await h.state();
  check('Хруст под водой открывает тайник с вишенкой', s.gold[1] === '1', JSON.stringify({ x: s.x, gold: s.gold }));
  await shot('w21-lagoon');

  // 6. Pickle climbs out of the lagoon by the steps
  await h.put(X(139), Y(G + 6)); await h.step(0.3);
  for (let i = 0; i < 6; i++) { await h.step(0.3, ['ArrowRight', 'Space']); await h.step(0.4, ['ArrowRight']); }
  s = await h.state();
  check('Пикль выбирается из лагуны по ступеням', !s.wet && s.x >= X(149), JSON.stringify({ x: s.x, y: s.y }));

  // 7. air runs out under water: −1 ripeness and back to a safe spot
  await fresh(); await h.put(X(125), Y(G + 6)); await h.step(0.3);
  await h.eval(() => { window.__G.player.air = 0.02; window.__G.player.lastSafe = { x: 4020, y: 520 }; });
  await h.step(0.3);
  s = await h.state();
  check('без воздуха: −1 спелость и возврат на берег', s.hp === 2 && !s.wet, JSON.stringify({ hp: s.hp, x: s.x }));

  // 8. cliffs: every hop between the rocks works for Pickle (the heavier hero)
  const hops = [[158, G, 162], [165, G - 2, 169], [171, G - 4, 176], [179, G - 3, 184], [187, G - 4, 193]];
  for (const [from, top, to] of hops) {
    await fresh(); await h.eval(() => { const G = window.__G; for (const e of G.ents) if (e.enemy) e.alive = false; });
    const r = await hop(X(from) + 12, Y(top));
    check(`Пикль перепрыгивает со скалы ${from} на ${to}`, !r.wet && r.x >= to * T - 4, `x=${r.x} y=${r.y}${r.wet ? ' (упал в воду)' : ''}`);
  }

  // 9. the boat waits for all three parts
  await fresh(); await h.put(X(213), Y(G)); await h.step(0.2); await h.step(1.0, ['ArrowRight']); await h.step(0.5);
  s = await h.state();
  check('без частей лодка не уплывает', s.st === 'play');
  await h.eval(() => { window.__G.boatParts = 3; });
  await h.put(X(213), Y(G)); await h.step(0.2); await h.step(1.0, ['ArrowRight']); await h.step(0.3);
  s = await h.state();
  check('с тремя частями лодка увозит героев', s.st === 'win');
  await h.step(1.5); await shot('w21-boat');
  await h.step(3);
  s = await h.state();
  const saved = await h.eval(() => !!window.__dbg.Save.data.done['2-1']);
  check('уровень засчитан пройденным', s.st === 'results' && saved);

  // ================= 2-2 Pineapple jungle =================
  {
    const G2 = 24, Gc = 12, X2 = X, Y2 = Y;
    const fresh2 = async () => { await h.eval(() => { delete window.__dbg.Save.data.cherries['2-2']; }); await h.start('2-2'); await h.eval(() => { window.__dbg.Save.data.settings.hints = false; window.__dbg.Save.data.crunch = true; }); await h.step(0.2); };
    const noEnemies = () => h.eval(() => { for (const e of window.__G.ents) if (e.enemy) e.alive = false; for (const e of window.__G.ents) if (e.constructor.name === 'OliveSpawner') e.alive = false; });
    await fresh2();
    s = await h.state();
    check('2-2: начинаем за Пикля', s.char === 'pickle');
    await shot('w22-start');

    // olives can't be stomped
    await h.eval(() => { const G = window.__G; for (const e of G.ents) if (e.enemy) e.alive = false; });
    await h.eval(() => { const G = window.__G; const o = new Olive(6 * 40 + 20, 24 * 40, 1, { patrol: true, speed: 0.001 }); o.active = true; G.add(o); });
    await h.step(0.3);
    await h.put(X2(6), Y2(G2) - 160); await h.step(1.2);
    s = await h.state();
    check('2-2: оливку нельзя растоптать (прыжок на неё ранит)', s.hp === 2, `hp=${s.hp}`);

    // jelly-bean vines can be grabbed; the first cherry is reached from a vine branch
    await fresh2(); await noEnemies(); await h.eval(() => { const G = window.__G; G.player.setChar(G, 'banni'); });
    await h.eval(() => { const v = window.__G.ents.find(e => e.constructor.name === 'JellyVine' && Math.abs(e.ax - (55 * 40 + 20)) < 2); v.ph = 0; v.t = 0; v.ang = 0; });
    await h.put(X2(55), Y2(G2 - 9) + 210); await h.eval(() => { window.__G.player.vy = -150; window.__G.player.onGround = false; });
    let grabbed = false; for (let i = 0; i < 40 && !grabbed; i++) { await h.step(1 / 60); grabbed = await h.eval(() => window.__G.player.state === 'vine'); }
    check('2-2: за лиану из мармеладок можно схватиться', grabbed);
    await shot('w22-vine');
    await fresh2(); await noEnemies(); await h.eval(() => { const G = window.__G; G.player.setChar(G, 'banni'); });
    const br = await hop(X2(62) + 12, Y2(G2 - 10), { dbl: false, stopAt: X2(65) });
    check('2-2: с ветки у лианы — на доску с первой вишенкой', br.gold[0] === '1', `y=${br.y} gold=${br.gold}`);

    // the climb to the camp works for Pickle: ground → plank → spring → planks → plateau
    await fresh2(); await noEnemies();
    const climb = [[122, G2, 124, G2 - 4], [127, G2 - 4, 132, G2 - 8], [135, G2 - 8, 138, G2 - 10], [140, G2 - 10, 145, Gc]];
    for (const [from, top, to, toTop] of climb) {
      const r = await hop(X2(from) + 12, Y2(top), { dbl: 0.45, stopAt: X2(to + 1) });
      check(`2-2: Пикль поднимается к лагерю (${from} → ${to})`, !r.wet && r.x >= to * T - 4 && r.y === Y2(toTop), `x=${r.x} y=${r.y}, нужно y=${Y2(toTop)}`);
    }

    // rind pocket with a cherry in the pineapple wall
    await fresh2(); await noEnemies();
    await h.put(X2(142), Y2(G2)); await h.step(0.2); await h.step(0.05, ['KeyC']); await h.step(0.4); await h.step(0.6, ['ArrowRight']);
    s = await h.state();
    check('2-2: Хруст открывает тайник в ананасовой стене', s.gold[1] === '1', s.gold);

    // the third cherry above the plateau spring: only with the jump held
    let top = 1e9;
    const springTry = async held => {
      top = 1e9;
      await fresh2(); await noEnemies(); await h.eval(() => { const G = window.__G; G.player.setChar(G, 'banni'); });
      await h.put(X2(152) + 10, Y2(Gc)); await h.step(0.2);
      // jump from the ground onto the pineapple; keep the button held (or let go) through the bounce
      await h.step(0.2, ['Space', 'ArrowRight']);
      let bounced = false, prevVy = 0;
      for (let i = 0; i < 180; i++) {
        const st = await h.eval(() => [window.__G.player.vy, window.__G.player.cx, window.__G.player.y]); top = Math.min(top, st[2]);
        if (prevVy > 0 && st[0] < -500) bounced = true;
        prevVy = st[0];
        if (bounced && st[0] > -40) { // double jump at the apex, steering under the cherry like a player would
          await h.step(0.05, []);
          for (let k = 0; k < 25; k++) { const [cx, y] = await h.eval(() => [window.__G.player.cx, window.__G.player.y]); top = Math.min(top, y); await h.step(1 / 60, ['Space'].concat(cx < X2(154) - 3 ? ['ArrowRight'] : cx > X2(154) + 3 ? ['ArrowLeft'] : [])); }
          break;
        }
        await h.step(1 / 60, (held ? ['Space'] : []).concat(st[1] < X2(154) - 4 ? ['ArrowRight'] : st[1] > X2(154) + 4 ? ['ArrowLeft'] : []));
      }
      await h.step(0.5);
      if (process.env.DBG) console.log('  spring', held, 'top', Math.round(top));
      return (await h.state()).gold[2] === '1';
    };
    const heldOk = await springTry(true), freeOk = await springTry(false);
    check('2-2: вишенка над пружиной достаётся с зажатым прыжком и не достаётся без него', heldOk && !freeOk, `зажат: ${heldOk}, без: ${freeOk}`);

    // the camp: gates close, waves, cage, dialog, boat
    await fresh2(); await noEnemies();
    await h.put(X2(160), Y2(Gc)); await h.step(0.2);
    await h.step(0.3, ['ArrowRight']);
    await h.step(1.0, ['ArrowRight']);
    let camp = await h.eval(() => { const c = window.__G.ents.find(e => e.constructor.name === 'CampFight'); return { st: c.st, gates: c.o.gates.map(g => g.closed) }; });
    check('2-2: в лагере закрываются ворота и начинается бой', camp.st === 'fight' && camp.gates.every(Boolean), JSON.stringify(camp));
    // the boat refuses to leave without Pupyrka
    for (let wave = 0; wave < 4; wave++) {
      await h.eval(() => { const c = window.__G.ents.find(e => e.constructor.name === 'CampFight'); for (const e of c.spawned) if (e.alive) e.kill(window.__G, 'test'); });
      await h.step(1.3);
    }
    camp = await h.eval(() => { const c = window.__G.ents.find(e => e.constructor.name === 'CampFight'); const cg = window.__G.ents.find(e => e.constructor.name === 'PupyrkaCage'); return { st: c.st, wave: c.wave, gates: c.o.gates.map(g => g.closed), locked: cg.locked }; });
    check('2-2: после трёх волн ворота открыты, клетка отперта', camp.st === 'done' && !camp.locked && camp.gates.every(g => !g), JSON.stringify(camp));
    await shot('w22-camp');
    await h.put(X2(186), Y2(Gc)); await h.eval(() => { window.__G.player.face = 1; }); await h.step(0.2); await h.step(0.05, ['KeyC']); await h.step(1.0);
    const dlg = await h.eval(() => !!document.querySelector('#scr-dialog'));
    await shot('w22-dialog');
    for (let i = 0; i < 8; i++) await h.eval(() => { const b = document.querySelector('#d-next'); if (b) b.click(); });
    await h.step(0.3);
    const free = await h.eval(() => !!window.__G.sisterFree && !!window.__dbg.Save.data.family.pupyrka);
    check('2-2: Хруст ломает клетку, диалог с Пупыркой, она спасена', dlg && free, `диалог: ${dlg}, спасена: ${free}`);
    await h.put(X2(200), Y2(Gc)); await h.step(0.2); await h.step(1.0, ['ArrowRight']); await h.step(0.5);
    s = await h.state();
    check('2-2: лодка увозит героев дальше', s.st === 'win');
    await h.step(4.5);
    check('2-2: уровень засчитан', await h.eval(() => !!window.__dbg.Save.data.done['2-2']));
    // a fresh run: the boat waits for Pupyrka
    await fresh2(); await noEnemies(); await h.put(X2(200), Y2(Gc)); await h.step(0.2); await h.step(1.0, ['ArrowRight']); await h.step(0.3);
    check('2-2: без спасения Пупырки лодка не уплывает', (await h.state()).st === 'play');
  }

  // ================= 2-3 Watermelon reef =================
  {
    const F = 22;
    const fresh3 = async () => { await h.eval(() => { delete window.__dbg.Save.data.cherries['2-3']; }); await h.start('2-3'); await h.eval(() => { window.__dbg.Save.data.settings.hints = false; window.__dbg.Save.data.crunch = true; }); await h.step(0.2); };
    const asBanni = () => h.eval(() => { const G = window.__G; G.player.setChar(G, 'banni'); });
    const calm = () => h.eval(() => { for (const e of window.__G.ents) if (e.enemy && !e.boss) e.alive = false; });
    const breathe = () => h.eval(() => { window.__G.player.air = 1; });
    await fresh3();
    s = await h.state();
    check('2-3: начинаем за Пикля на скале над водой', s.char === 'pickle' && !s.wet);
    await shot('w23-start');

    // the lime flipper in the clam
    await asBanni(); await h.put(X(12), Y(F - 4)); await h.step(1.0, ['ArrowDown']);
    check('2-3: Банни ныряет за Лаймонным ластом', await h.eval(() => window.__G.player.power === 'flipper'));

    // the current: Banni can't swim through the tunnel, Pickle walks it
    await fresh3(); await calm(); await asBanni(); await h.put(X(73), Y(F)); await h.step(3, ['ArrowRight']);
    s = await h.state();
    check('2-3: течение не пускает Банни в туннель', s.x < 76 * T, `x=${s.x}`);
    await fresh3(); await calm(); await h.put(X(73), Y(F)); await h.step(9, ['ArrowRight']);
    s = await h.state();
    check('2-3: Пикль проходит туннель по дну против течения', s.x > 96 * T && s.hp === 3, `x=${s.x} hp=${s.hp} air=${s.air}`);
    await shot('w23-tunnel');
    // the cherry in the tunnel pocket
    await fresh3(); await calm(); await h.put(X(85), Y(F)); await h.step(0.3);
    await h.step(0.3, ['Space']); await h.step(0.15); await h.step(0.3, ['Space']); await h.step(0.6);
    check('2-3: вишенка в пещерке над туннелем', (await h.state()).gold[0] === '1');

    // the cherry behind the fake coral
    await fresh3(); await calm(); await h.put(X(54), Y(F)); await h.step(0.3); await h.step(1.2, ['ArrowRight']);
    check('2-3: вишенка за ложным кораллом', (await h.state()).gold[1] === '1', (await h.state()).gold);

    // the helmet block and the clam in the ceiling
    await fresh3(); await calm(); await asBanni();
    await h.put(X(100), Y(17)); await h.step(1.2, ['ArrowUp']); await breathe(); await h.step(1.0, ['ArrowUp']);
    const helm = await h.eval(() => window.__G.player.helmet);
    await h.put(X(105), Y(15)); await breathe(); await h.step(1.2, ['ArrowUp']); await h.step(0.5, ['ArrowUp']);
    s = await h.state();
    check('2-3: шлем из блока, головой разбита ракушка, третья вишенка', helm && s.gold[2] === '1', `шлем ${helm}, вишенки ${s.gold}`);
    await shot('w23-helmet');

    // herrings glint and dart when level with the hero
    await fresh3(); await asBanni();
    const hs = await h.eval(() => { const G = window.__G, f = G.ents.find(e => e.constructor.name === 'HerringSchool'); f.active = true; return [Math.round(f.cx), Math.round(f.cy)]; });
    await h.put(hs[0] + 300, hs[1] + 25); await h.eval(() => { window.__G.player.inv = 5; });
    let seen = new Set(); for (let i = 0; i < 90; i++) { await h.step(1 / 60); seen.add(await h.eval(() => window.__G.ents.find(e => e.constructor.name === 'HerringSchool').st)); await breathe(); }
    check('2-3: косяк селёдок сверкает и бросается', seen.has('warn') && seen.has('dash'), [...seen].join(','));

    // the boss: two jars broken with the crunch, then the tired octopus is stomped four times
    await fresh3(); await h.put(X(177), Y(F)); await h.step(0.2); await h.step(0.6, ['ArrowRight']);
    const boss = () => h.eval(() => { const b = window.__G.boss; return { st: b.st, hp: b.hp, x: b.ccx, y: b.ccy, jar: (b.jars.find(q => q.st === 'down') || {}).tx }; });
    check('2-3: бой начинается, ворота закрыты', await h.eval(() => window.__G.bossActive && window.__G.def.gates.every(g => g.closed)));
    for (let round = 0; round < 2; round++) {
      let b = await boss();
      for (let i = 0; i < 600 && !b.jar; i++) { await h.eval(() => { const p = window.__G.player; p.hp = 3; p.air = 1; }); await h.step(1 / 60); b = await boss(); }
      if (round === 0) await shot('w23-boss');
      await h.put(b.jar - 70, Y(F)); await h.eval(() => { window.__G.player.face = 1; }); await h.step(0.05); await h.step(0.05, ['KeyC']); await h.step(0.5);
    }
    let b = await boss();
    check('2-3: обе банки разбиты Хрустом (−2 здоровья)', b.hp === 4, `hp=${b.hp}`);
    await asBanni();
    for (let hit = 0; hit < 4; hit++) {
      for (let i = 0; i < 900; i++) { await h.eval(() => { const p = window.__G.player; p.hp = 3; p.air = 1; p.inv = 1; }); await h.step(1 / 60); b = await boss(); if (b.st === 'tired' && Math.abs(b.y - (Y(F) - 90)) < 5) break; }
      if (hit === 0) await shot('w23-tired');
      await h.put(b.x, b.y - 110); await h.eval(() => { const p = window.__G.player; p.vy = 200; p.inv = 0; }); await h.step(0.4, ['ArrowDown']);
      if (process.env.DBG) console.log('  stomp', hit, JSON.stringify(await boss()), JSON.stringify(await h.state()));
    }
    await h.step(3.5);
    b = await boss();
    check('2-3: осьминог побеждён, ворота открыты', b.hp === 0 && await h.eval(() => !window.__G.bossActive && window.__G.def.gates.every(g => !g.closed)));
    // the bubble column lifts Pickle to the boat
    await h.eval(() => { const G = window.__G; G.player.setChar(G, 'pickle'); });
    await h.put(X(213), Y(F)); await h.step(0.2);
    for (let i = 0; i < 300; i++) { await h.step(1 / 60); if ((await h.state()).st !== 'play') break; await breathe(); }
    s = await h.state();
    check('2-3: пузырьковый столб поднимает Пикля к лодке, уровень пройден', s.st === 'win', `st=${s.st} x=${s.x} y=${s.y}`);
    await h.step(4.5);
    check('2-3: уровень засчитан', await h.eval(() => !!window.__dbg.Save.data.done['2-3']));

    // dying in the boss fight resets the fight (jars come back)
    await fresh3(); await h.put(X(177), Y(F)); await h.step(0.2); await h.step(0.6, ['ArrowRight']); await h.step(2);
    await h.eval(() => { window.__G.boss.jars[0].st = 'gone'; window.__G.boss.hp = 5; const G = window.__G; G.lives = 3; G.player.die(G); });
    await h.step(3);
    b = await h.eval(() => { const b = window.__G.boss; return { st: b.st, hp: b.hp, jars: b.jars.map(j => j.st), active: window.__G.bossActive, gates: window.__G.def.gates.map(g => g.closed) }; });
    check('2-3: после гибели бой начинается заново с полным здоровьем', b.hp === 6 && b.st === 'wait' && b.jars.every(j => j === 'held') && !b.active, JSON.stringify(b));
  }

  check('нет ошибок в консоли', h.errors.length === 0, h.errors.join('\n'));
  await h.close();
  const failed = results.filter(x => !x).length;
  console.log(failed ? `\nПровалено: ${failed}` : '\nВсе проверки пройдены');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
