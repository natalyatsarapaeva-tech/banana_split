// Проверки механик мира 2 на уровне 2-1 «Пляж Кокосовой Стружки».
// Запуск: node tests/w2.js [папка для скриншотов]
const { open } = require('./harness');
const T = 40, G = 13, X = c => c * T + T / 2, Y = r => r * T;

const results = [];
function check(name, ok, info) { results.push(ok); console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${info ? '  ' + info : ''}`); }

(async () => {
  const h = await open({ shots: process.argv[2] || '.' });
  const shot = async n => { if (process.argv[2]) await h.shot(n); };
  const fresh = async () => { await h.start('2-1'); await h.eval(() => { window.__dbg.Save.data.settings.hints = false; }); await h.step(0.2); };
  // jump from (x, y) to the right: run, jump, double-jump; returns where the hero lands
  const hop = async (x, y, { dbl = 0.3, hold = 0.25 } = {}) => {
    await h.put(x, y); await h.step(0.15);
    await h.step(hold, ['ArrowRight', 'Space']);
    await h.step(Math.max(0, dbl - hold), ['ArrowRight']);
    await h.step(0.25, ['ArrowRight', 'Space']);
    for (let i = 0; i < 120; i++) { await h.step(1 / 60, ['ArrowRight']); const s = await h.state(); if (s.ground && !s.wet) return s; if (s.wet) return s; }
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
  await h.step(0.3, ['ArrowRight', 'Space']); await h.step(0.25, ['ArrowRight']); await h.step(0.15, ['ArrowRight', 'Space']); await h.step(0.8, ['ArrowRight']);
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

  check('нет ошибок в консоли', h.errors.length === 0, h.errors.join('\n'));
  await h.close();
  const failed = results.filter(x => !x).length;
  console.log(failed ? `\nПровалено: ${failed}` : '\nВсе проверки пройдены');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
