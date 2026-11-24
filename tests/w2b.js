// Проверки уровней мира 2 с 2-4 по 2-10. Запуск: node tests/w2b.js [папка для скриншотов]
const { open } = require('./harness');
const T = 40, X = c => c * T + T / 2, Y = r => r * T;
const results = [];
function check(name, ok, info) { results.push(ok); console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${info ? '  ' + info : ''}`); }

(async () => {
  const h = await open({ shots: process.argv[2] || '.' });
  const shot = async n => { if (process.argv[2]) await h.shot(n); };
  const start = async (id, ch) => {
    await h.eval(id => { delete window.__dbg.Save.data.cherries[id]; }, id);
    await h.start(id);
    await h.eval(ch => { const S = window.__dbg.Save.data; S.settings.hints = false; S.settings.notes = false; S.crunch = true; S.wallJump = true; if (ch) { const G = window.__G; G.player.setChar(G, ch); } }, ch);
    await h.step(0.2);
  };
  const calm = () => h.eval(() => { for (const e of window.__G.ents) if ((e.enemy && !e.boss) || e.constructor.name === 'JarKid') e.alive = false; for (const e of window.__G.ents) if (/Spawner/.test(e.constructor.name) && !/Slice/.test(e.constructor.name)) e.alive = false; });
  const keep = () => h.eval(() => { const p = window.__G.player; p.hp = 3; p.air = 1; });
  const st = () => h.state();
  // jump from a ledge to the next one: run toward it, jump, double-jump, steer onto it
  const hopTo = async (fromX, fromY, toC0, toR) => {
    await h.put(fromX, fromY); await h.step(0.12);
    const tx = X(toC0 + 2), key = Math.abs(tx - fromX) < 40 ? null : tx > fromX ? 'ArrowRight' : 'ArrowLeft', K = a => key ? a.concat([key]) : a;
    await h.step(0.25, K(['Space'])); await h.step(0.12, K([])); await h.step(0.25, K(['Space']));
    for (let i = 0; i < 120; i++) {
      const s = await st();
      const k = Math.abs(s.x - tx) < 30 ? [] : s.x < tx ? ['ArrowRight'] : ['ArrowLeft'];
      await h.step(1 / 60, k);
      const s2 = await st(); if (s2.ground) return s2;
    }
    return st();
  };
  const bossFight = async (hitFn, n) => { for (let i = 0; i < n; i++) { await keep(); await hitFn(i); } };

  // ================= 2-4 Mango falls =================
  await start('2-4');
  check('2-4: начинаем за Пикля внизу водопада', (await st()).char === 'pickle');
  await shot('w24');
  {
    const path = await h.eval(() => window.__G.def.path);
    let bad = [];
    for (let i = 0; i + 1 < path.length; i++) {
      await calm(); await keep();
      const [c, r] = path[i], [c2, r2] = path[i + 1];
      const s = await hopTo(X(c + 2), Y(r), c2, r2);
      if (!(s.ground && s.y <= Y(r2))) bad.push(`${c},${r}→${c2},${r2} (x=${s.x} y=${s.y})`);
    }
    check(`2-4: Пикль проходит все ${path.length - 1} прыжков по уступам до верха`, bad.length === 0, bad.slice(0, 4).join('; '));
    // through the hole to the top plateau
    const last = path[path.length - 1];
    await h.put(X(last[0] + 2), Y(last[1])); await h.step(0.1);
    await h.step(0.3, ['Space']); await h.step(0.1); await h.step(0.25, ['Space', 'ArrowRight']); await h.step(0.6, ['ArrowRight']);
    const s = await st();
    check('2-4: с последнего уступа — на вершину', s.y === Y(5), `y=${s.y}`);
  }
  await start('2-4'); await calm(); await h.put(X(21), Y(5)); await h.eval(() => { window.__G.player.face = 1; }); await h.step(0.1); await h.step(0.05, ['KeyC']); await h.step(1);
  for (let i = 0; i < 6; i++) await h.eval(() => { const b = document.querySelector('#d-next'); if (b) b.click(); });
  await h.step(0.3);
  check('2-4: Хруст освобождает дядю Зеленца', await h.eval(() => window.__G.relFree && !!window.__dbg.Save.data.family.zelenets));
  await h.put(X(29), Y(5) - 10); await h.step(1.5, ['ArrowRight']);
  check('2-4: лодка на вершине увозит героев', (await st()).st === 'win');

  // ================= 2-5 Volcano =================
  await start('2-5'); await calm();
  await h.put(X(14), Y(34)); await h.step(0.2); await h.step(0.9, ['ArrowRight']);
  check('2-5: наступить в джем — больно', (await st()).hp < 3);
  {
    await start('2-5'); await calm();
    await h.put(X(66), Y(34)); await h.step(0.2); await h.step(0.3, ['ArrowRight']); await h.step(0.5);
    const jam = await h.eval(() => window.__G.ents.find(e => e.constructor.name === 'RisingJam').st);
    check('2-5: в шахте джем начинает подниматься', jam === 'rise');
    const path = await h.eval(() => window.__G.def.path); let bad = [];
    await h.eval(() => { window.__G.ents.find(e => e.constructor.name === 'RisingJam').speed = 0; });
    for (let i = 0; i + 1 < path.length; i++) { await calm(); await keep(); const [c, r] = path[i], [c2, r2] = path[i + 1]; const s = await hopTo(X(c + 2), Y(r), c2, r2); if (!(s.ground && s.y <= Y(r2))) bad.push(`${c},${r}→${c2},${r2} (x=${s.x} y=${s.y})`); }
    check(`2-5: Пикль проходит шахту (${path.length - 1} прыжков)`, bad.length === 0, bad.slice(0, 4).join('; '));
    const last = path[path.length - 1]; const s = await hopTo(X(last[0] + 2), Y(last[1]), 84, 6);
    check('2-5: из шахты — на край кратера', s.y === Y(6), `x=${s.x} y=${s.y}`);
  }
  {
    await start('2-5', 'banni'); await calm(); await h.put(X(96), Y(6)); await h.step(0.2); await h.step(0.5, ['ArrowRight']); await h.step(0.3);
    check('2-5: бой с Боцманом Хреном начинается', await h.eval(() => window.__G.bossActive));
    for (let hit = 0; hit < 3; hit++) {
      let b; for (let i = 0; i < 900; i++) { await keep(); await h.eval(() => { window.__G.player.inv = 1; }); await h.step(1 / 60); b = await h.eval(() => ({ st: window.__G.boss.st, x: window.__G.boss.fx, y: window.__G.boss.fy })); if (b.st === 'pipe') break; }
      if (hit === 0) await shot('w25-boss');
      await h.put(b.x, b.y - 145); await h.eval(() => { const p = window.__G.player; p.vy = 300; p.inv = 0; }); await h.step(0.5);
    }
    await h.step(3);
    check('2-5: Боцман Хрен побеждён тремя прыжками на голову', await h.eval(() => window.__G.boss.hp === 0 && !window.__G.bossActive));
    await h.put(X(131), Y(6)); await h.step(1.2, ['ArrowRight']); await h.step(0.5);
    check('2-5: лодка в остывшем озере увозит героев', (await st()).st === 'win');
  }

  // ================= 2-6 Lemonade sea =================
  {
    await start('2-6'); await h.put(X(8), Y(11)); await h.step(0.2); await h.step(0.8, ['ArrowRight']);
    let s = await st();
    check('2-6: герои садятся в лодку, начинается морской бой', s.st === 'play' && await h.eval(() => window.__G.player.state === 'balloon' && !!window.__G.autoscroll));
    await h.step(0.6, ['Space']); const hopY = await h.eval(() => window.__G.player.hopY);
    await h.step(1.2);
    const jb = await h.eval(() => { const G = window.__G, e = G.ents.find(q => q.constructor.name === 'JarBoat'); e.x = G.player.x + 260; e.active = true; return e.alive; });
    for (let i = 0; i < 10; i++) { await h.step(0.25, ['KeyX']); await h.step(0.1); await keep(); }
    check('2-6: лодка подпрыгивает, кокосовая пушка сбивает пиратскую банку', hopY < 0 && await h.eval(() => !window.__G.ents.find(q => q.constructor.name === 'JarBoat' && q.x < window.__G.player.x + 400 && q.alive)), `hop=${Math.round(hopY)}`);
    await shot('w26');
    await h.eval(() => { const G = window.__G; G.cam.x = G.def.ride.stopX - 20; G.player.x = G.cam.x + 100; for (const e of G.ents) if (e.enemy && !e.boss) e.alive = false; });
    for (let i = 0; i < 240 && !(await h.eval(() => window.__G.bossActive)); i++) { await keep(); await h.step(1 / 60); }
    check('2-6: появляется фрегат «Кислая Селёдка»', await h.eval(() => window.__G.bossActive));
    // shoot an olive bomb back at it
    let reflected = 0;
    for (let i = 0; i < 1200 && reflected < 1; i++) {
      await keep(); await h.eval(() => { window.__G.player.inv = 1; });
      const bomb = await h.eval(() => { const G = window.__G, b = G.ents.find(e => e.constructor.name === 'OliveBomb' && !e.back && e.alive); if (!b) return null; const p = G.player; return { y: b.cy, x: b.cx, py: p.y + 22, px: p.x + p.w }; });
      if (bomb && bomb.x - bomb.px < 300 && Math.abs(bomb.y - bomb.py) < 30) { await h.step(1 / 60, ['KeyX']); } else await h.step(1 / 60);
      reflected = await h.eval(() => window.__G.boss.maxHp - window.__G.boss.hp);
    }
    check('2-6: отбитая оливка пробивает борт фрегата', reflected >= 1, `попаданий ${reflected}`);
    await shot('w26-boss');
    await h.eval(() => { const G = window.__G; while (G.boss.hp > 0) { G.boss.st = 'fight'; G.boss.bombHit(G); } });
    for (let i = 0; i < 360; i++) { await keep(); await h.step(1 / 60); if ((await st()).st === 'win') break; }
    check('2-6: после фрегата лодка уплывает — уровень пройден', (await st()).st === 'win');
    await h.step(4); check('2-6: уровень засчитан', await h.eval(() => !!window.__dbg.Save.data.done['2-6']));
  }

  // ================= 2-7 Banana homeland =================
  {
    await start('2-7');
    check('2-7: это уровень Банни (без смены героя)', (await st()).char === 'banni' && await h.eval(() => !window.__G.def.swap));
    let grabbed = false;
    for (let tryN = 0; tryN < 4 && !grabbed; tryN++) { await calm(); await h.put(X(7), Y(21)); await h.step(0.2 + tryN * 0.37); for (let i = 0; i < 70 && !grabbed; i++) { await h.step(1 / 60, i < 20 ? ['Space', 'ArrowRight'] : ['ArrowRight']); grabbed = await h.eval(() => window.__G.player.state === 'vine'); } }
    check('2-7: с земли можно допрыгнуть до лианы на пальме', grabbed);
    await start('2-7'); await calm();
    const s = await hopTo(X(62), Y(23), 68, 21);
    check('2-7: через овраг после листа-горки можно перепрыгнуть с края', s.y === Y(21) && s.x > 68 * T, `x=${s.x} y=${s.y}`);
    await start('2-7'); await calm(); await h.put(X(205), Y(21) - 20); await h.step(1, ['ArrowRight']);
    check('2-7: без встречи с семьёй лодка не уплывает', (await st()).st === 'play');
    await h.put(X(170), Y(21)); await h.step(0.6, ['ArrowRight']); await h.step(0.5);
    const dlg = await h.eval(() => !!document.querySelector('#scr-dialog'));
    await shot('w27-family');
    for (let i = 0; i < 8; i++) await h.eval(() => { const b = document.querySelector('#d-next'); if (b) b.click(); });
    await h.step(0.3);
    check('2-7: встреча с мамой и папой Банни, подарен парус', dlg && await h.eval(() => window.__G.familyMet && !!window.__dbg.Save.data.family.sail));
    await h.put(X(200), Y(21)); await h.step(1.5, ['ArrowRight']); await h.step(0.3);
    check('2-7: лодка увозит героев', (await st()).st === 'win');
  }

  // ================= 2-8 Kiwi caves =================
  {
    await start('2-8'); await calm();
    await h.put(X(12), Y(22)); await h.step(0.2); await h.step(0.35, ['Space']); await h.step(1.2); await h.step(0.35, ['Space']); await h.step(0.8);
    check('2-8: из блока выпадает фонарь-киви, вокруг становится светлее', await h.eval(() => window.__G.lightR > 200));
    await shot('w28');
    await start('2-8', 'banni'); await h.put(X(168), Y(22)); await h.step(0.2); await h.step(0.5, ['ArrowRight']); await h.step(0.3);
    check('2-8: бой с Тёмным Пиклем начинается', await h.eval(() => window.__G.bossActive));
    for (let hit = 0; hit < 3; hit++) {
      let b; for (let i = 0; i < 900; i++) { await keep(); await h.eval(() => { window.__G.player.inv = 1; }); await h.step(1 / 60); b = await h.eval(() => ({ st: window.__G.boss.st, x: window.__G.boss.fx, y: window.__G.boss.fy })); if (b.st === 'dizzy') break; }
      if (hit === 0) await shot('w28-boss');
      await h.put(b.x, b.y - 160); await h.eval(() => { const p = window.__G.player; p.vy = 300; p.inv = 0; }); await h.step(0.5);
    }
    await h.step(3);
    check('2-8: Тёмный Пикль побеждён', await h.eval(() => window.__G.boss.hp === 0 && !window.__G.bossActive));
    await h.put(X(197), Y(22)); await h.step(1.2, ['ArrowRight']); await h.step(0.5);
    check('2-8: лодка увозит героев', (await st()).st === 'win');
  }

  // ================= 2-9 Sunken jars =================
  {
    await start('2-9', 'banni'); await calm();
    await h.put(X(78), Y(20)); await h.step(0.2); await h.step(0.05, ['ArrowUp']); await h.step(5);
    const lvl = await h.eval(() => Math.round(window.__G.ents.find(e => e.constructor.name === 'Tap').pool.base));
    check('2-9: кран поднимает воду', lvl <= Y(11) + 25, `уровень ${lvl}`);
    await h.put(X(95), Y(14)); await h.step(1.5);
    await h.step(0.05, ['Space', 'ArrowRight']); await h.step(0.3, ['ArrowRight']); await h.step(0.15, ['ArrowRight', 'Space']); await h.step(1, ['ArrowRight']);
    const s = await st();
    check('2-9: Банни всплывает и выбирается на высокий берег', s.y === Y(11) && s.x > 101 * T, `x=${s.x} y=${s.y}`);
    await shot('w29');
    await start('2-9'); await calm(); await h.put(X(179), Y(20)); await h.eval(() => { window.__G.player.face = 1; }); await h.step(0.1); await h.step(0.05, ['KeyC']); await h.step(1);
    for (let i = 0; i < 6; i++) await h.eval(() => { const b = document.querySelector('#d-next'); if (b) b.click(); });
    await h.step(0.3);
    check('2-9: Хруст разбивает большую банку, кузен Кабачок спасён', await h.eval(() => window.__G.relFree && !!window.__dbg.Save.data.family.kabachok));
    await h.put(X(200), Y(20)); await h.step(1.5, ['ArrowRight']); await h.step(0.3);
    check('2-9: лодка увозит героев', (await st()).st === 'win');
  }

  if (await h.eval(() => !!window.__dbg.LEVELS['2-10'])) await require('./w2c')(h, { start, calm, keep, st, check, shot, hopTo });

  check('нет ошибок в консоли', h.errors.length === 0, h.errors.slice(0, 3).join('\n'));
  await h.close();
  const failed = results.filter(x => !x).length;
  console.log(failed ? `\nПровалено: ${failed}` : '\nВсе проверки пройдены');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
