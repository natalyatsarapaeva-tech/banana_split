// Проверки уровня 2-10 (вызывается из tests/w2b.js).
const T = 40, X = c => c * T + T / 2, Y = r => r * T;
module.exports = async function (h, { start, calm, keep, st, check, shot }) {
  const G0 = 19;
  await start('2-10'); await calm(); await h.put(X(6), Y(G0)); await h.step(0.2);
  const x0 = (await st()).x; let maxDrift = 0;
  for (let i = 0; i < 40; i++) { await h.step(0.1); maxDrift = Math.max(maxDrift, Math.abs((await st()).x - x0)); }
  check('2-10: шторм качает корабль и сносит героя', maxDrift > 15, `снос ${maxDrift}px`);
  await shot('w210');

  await start('2-10', 'banni'); await calm(); await h.put(X(157), Y(G0)); await h.step(0.2); await h.step(0.4, ['ArrowRight']); await h.step(0.3);
  check('2-10: бой с Капитаном Уксусом начинается', await h.eval(() => window.__G.bossActive));
  const boss = () => h.eval(() => { const b = window.__G.boss; return { st: b.st, hp: b.hp, x: b.fx, y: b.fy, ph: b.phase }; });
  const waitFor = async sts => { let b; for (let i = 0; i < 1500; i++) { await keep(); await h.eval(() => { window.__G.player.inv = 1; }); await h.step(1 / 60); b = await boss(); if (sts.includes(b.st)) break; } return b; };
  for (let i = 0; i < 2; i++) { const b = await waitFor(['tired']); if (i === 0) await shot('w210-p1'); await h.put(b.x, b.y - 140); await h.eval(() => { const p = window.__G.player; p.vy = 300; p.inv = 0; }); await h.step(0.5); }
  let b = await boss();
  check('2-10: фаза «палуба» — два удара после выпадов', b.hp === 4, `hp=${b.hp}`);
  for (let i = 0; i < 2; i++) { const q = await waitFor(['pant']); if (i === 0) await shot('w210-p2'); await h.put(q.x, q.y - 140); await h.eval(() => { const p = window.__G.player; p.vy = 300; p.inv = 0; }); await h.step(0.5); }
  b = await boss();
  check('2-10: фаза «мачта» — два удара в «вороньем гнезде»', b.hp === 2, `hp=${b.hp}`);
  for (let i = 0; i < 240; i++) { await keep(); await h.step(1 / 60); }
  const hold = await h.eval(() => { const G = window.__G, a = G.def.arena; return { grandma: a.grandma.on, water: Math.round(a.water.base), floor: a.floor, syrup: G.ents.some(e => e.alive && e.kind === 'syrup') || G.player.power === 'syrup' }; });
  check('2-10: фаза «трюм» — вода прибывает, Бабушка бросает сироп', hold.grandma && hold.water < hold.floor && hold.syrup, JSON.stringify(hold));
  await shot('w210-p3');
  for (let i = 0; i < 2; i++) {
    await h.eval(() => { const G = window.__G; G.player.power = 'syrup'; });
    let q = await waitFor(['crate']);
    for (let k = 0; k < 40; k++) {
      await keep(); await h.eval(() => { const G = window.__G, p = G.player, bb = G.boss; p.power = 'syrup'; p.x = bb.fx - (bb.fx > (G.def.arena.x0 + G.def.arena.x1) / 2 ? 250 : -250) - p.w / 2; p.face = Math.sign(bb.fx - p.cx); p.inv = 1; });
      await h.step(0.05, ['KeyX']); await h.step(0.6);
      if ((await boss()).hp < 2 - i) break;
    }
  }
  b = await boss();
  check('2-10: сироп-бомбы растапливают Уксуса', b.hp === 0, `hp=${b.hp}`);
  for (let i = 0; i < 300 && !(await h.eval(() => !!document.querySelector('#scr-dialog'))); i++) await h.step(1 / 60);
  const dlg = await h.eval(() => !!document.querySelector('#scr-dialog'));
  await shot('w210-dialog');
  for (let i = 0; i < 8; i++) await h.eval(() => { const x = document.querySelector('#d-next'); if (x) x.click(); });
  await h.step(0.3);
  const fin = await h.eval(() => window.__G.state === 'finale' && window.__dbg.UI.finWorld === 2);
  await h.page.waitForFunction(() => ASSETS.w2finale, null, { timeout: 8000 }).catch(() => { });
  await h.step(0.5); await shot('w210-finale');
  check('2-10: диалог с подобревшим Уксусом и финал мира 2', dlg && fin);
  for (let i = 0; i < 6; i++) await h.eval(() => { const x = document.querySelector('#f-next'); if (x) x.click(); });
  await h.step(0.3);
  check('2-10: итоги и уровень засчитан, мир 2 пройден', await h.eval(() => window.__G.state === 'results' && !!window.__dbg.Save.data.done['2-10'] && window.__dbg.WORLDS[1].finished()));
  await h.eval(() => window.__dbg.UI.map(undefined, 1));
  check('2-10: на карте мира 2 появилась кнопка «Финал»', await h.eval(() => !!document.querySelector('#m-end')));
};
