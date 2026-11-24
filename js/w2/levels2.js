'use strict';
// ================= w2/levels2.js : World 2 levels 2-4 … 2-10 =================
// Backgrounds are the reference paintings for now (assets/w2/bg4.jpg … bg10.jpg, HUD band cropped off);
// uploading clean paintings under the same names replaces them.

Object.assign(NOTES, {
  'w2-4:a': 'Пикль, дядя Зеленец опять полез на самый верх водопада — проверять, хорошо ли сохнет манговая пастила. Его там и схватили. — Бабушка',
  'w2-4:b': 'Перцы-халапеньо плюются огнём, но после выстрела им нужно отдышаться. Тогда и прыгай! — Бабушка Корнишон',
  'w2-5:a': 'Вулкан Горячего Джема просыпается, когда по нему топают. Так что топай тихо, а беги быстро! — Бабушка',
  'w2-5:b': 'Боцман Хрен свистит в дудку и зовёт джемовый дождь. Пока он дудит — он не смотрит под ноги. — Б. К.',
  'w2-6:a': 'Внучок, лимонадное море шипучее и сладкое, но пираты сторожат его на своём фрегате «Кислая Селёдка». Береги лодку! — Бабушка',
  'w2-6:b': 'Огурчики в банках плывут по волнам — выстрели по банке, и она откроется. — Бабушка Корнишон',
  'w2-7:a': 'Банни, твоя мама просила передать: «Мы ждём вас на Банановой Родине, пирог уже в печке!» Но туда приплыли пираты… — Бабушка',
  'w2-7:b': 'Банановые листья скользкие — по ним можно съехать, как с горки. Жми вниз на бегу! — Б. К.',
  'w2-8:a': 'В Пещерах Киви темно, внучок. Найди фонарь-киви — со светом не так страшно. — Бабушка',
  'w2-8:b': 'Там, внизу, живёт твоя тень, замаринованная Уксусом. Она сильная, но врезается в стены. — Бабушка Корнишон',
  'w2-9:a': 'На острове Затонувших Банок туман и привидения. Краны поднимают и опускают воду — пользуйся этим! — Бабушка',
  'w2-9:b': 'Кузен Кабачок сидит в самой большой банке. У него карта к флагману Уксуса! — Бабушка Корнишон',
  'w2-10:a': 'Пикль, мы в трюме флагмана, в банках. Не бойся шторма — держись за канаты! — Бабушка',
  'w2-10:b': 'Уксус когда-то был сладким виноградом. Может, ему просто нужно немного сиропа? — Твоя бабушка'
});

// ---------- 2-4 Mango falls: a vertical climb ----------
function buildW2L4() {
  const b = new LB(40, 96), Gb = 92, H = 96;
  b.fill(0, 0, 1, H - 1, TL.SOLID); b.fill(38, 0, 39, H - 1, TL.SOLID);
  b.ground(2, 37, Gb);
  b.hint(3, 'w24-start', 'Манговые Водопады! Дядю Зеленца держат на самом верху. Карабкаемся по уступам — и осторожно со струями водопада!');
  const ledges = [];
  const A = [8, 15, 22, 29, 22, 15, 8], B = [15, 22, 29, 24, 31, 24, 31, 24, 31], C = [22, 15, 8, 15, 22, 29, 22];
  let i = 0;
  for (let r = 89; r >= 68; r -= 3) ledges.push([A[i++ % A.length], r]);
  i = 0; for (let r = 65; r >= 41; r -= 3) ledges.push([B[i++], r]);
  i = 0; for (let r = 38; r >= 8; r -= 3) ledges.push([C[i++ % C.length], r]);
  for (const [c, r] of ledges) b.plat(c, c + 4, r, TL.ONEWAY);
  // waterfalls and floating mango slices (an optional, faster route with a cherry at the top)
  b.add(new FallZone(12 * T, Y(40), 3 * T, Y(66) - Y(40)));
  b.add(new FallZone(35 * T, Y(9), 3 * T, Y(36) - Y(9)));
  b.add(new SliceSpawner(16 * T, Y(41), Y(66), 2.2, 120, 70));
  b.plat(16, 19, 39); b.item('gold', 17, 38, { i: 0 });
  // enemies
  for (const [c, r] of [[22, 83], [15, 74], [29, 59], [24, 50], [8, 32], [22, 17]]) b.add(new HotPepper(X(c + 2), Y(r)));
  for (const [c, r] of [[20, 78], [12, 56], [26, 44], [20, 26], [12, 14]]) b.add(new CabbageGull(X(c), Y(r)));
  // checkpoints, jars, notes, blocks
  b.add(new UmbrellaCheckpoint(X(10), Y(68), 0)); b.plat(6, 12, 68, TL.ONEWAY);
  b.add(new UmbrellaCheckpoint(X(31), Y(38), 1)); b.plat(28, 34, 38, TL.ONEWAY);
  b.add(new JarKid(X(31), Y(80), 0)); b.add(new JarKid(X(33), Y(53), 1)); b.add(new JarKid(X(11), Y(32), 2));
  b.item('note', 17, 85, { id: 'w2-4:a' }); b.item('note', 32, 46, { id: 'w2-4:b' });
  b.fill(2, 76, 4, 76, TL.SOLID); b.item('gold', 3, 75, { i: 1 });
  b.fill(2, 18, 6, 18, TL.SOLID); b.fill(2, 15, 6, 15, TL.SOLID); b.fill(6, 16, 6, 17, TL.RIND); b.item('gold', 4, 17, { i: 2 }); b.plat(7, 10, 18);
  b.block(26, 85, 'helmet'); b.block(10, 59, 'ice'); b.block(26, 26, 'cherry');
  for (const [c, r] of ledges) if (hash2(c, r) < 0.35) b.drops(c + 1, r - 2, 3, 0);
  // the top: uncle Zelenets, a pool with the boat
  b.fill(2, 5, 37, 6, TL.SOLID); b.fill(8, 5, 19, 6, TL.EMPTY);
  b.add(new RescueCage(X(24), Y(5), { who: 'zelenets', call: 'Это дядя Зеленец! Разбей клетку Хрустом!', lines: [
    { who: 'zelenets', text: 'Племянник! Ну и силища у тебя — прямо как у деда!' },
    { who: 'pickle', text: 'Дядя Зеленец, где остальные? Где бабушка?' },
    { who: 'zelenets', text: 'Уксус увёз их дальше, к Вулкану Горячего Джема. А в лодке я покажу, как ставить парус по ветру.' }
  ] }));
  b.fill(28, 5, 36, 6, TL.EMPTY); b.fill(28, 7, 36, 7, TL.SOLID); sea(b, 28, 36, Y(5) + 20);
  b.add(new Boat(X(32), Y(5) + 20, 0, { cond: G => G.relFree, wait: 'Сначала освободим дядю Зеленца!' }));
  return Object.assign({}, W2_DEF, {
    id: '2-4', name: 'Манговые Водопады', theme: THEME_W2_4, level: b.L, ents: b.ents, decoBack: b.decoBack, decoFront: b.decoFront, fake: b.fake,
    start: { x: X(5), y: Y(Gb) }, sheep: 3, path: ledges // the climb, for tests/w2b.js
  });
}

// ---------- 2-5 Volcano of hot jam: pools, a shaft with rising jam, Bosun Horseradish ----------
function buildW2L5() {
  const b = new LB(150, 40), G = 34, H = 40;
  // A: the slopes of the volcano with jam pools
  b.ground(0, 14, G);
  b.hint(1, 'w25-start', 'Вулкан Горячего Джема! В джем не наступай — горячо. Из луж выпрыгивает редиска!');
  b.ground(15, 60, G); b.fill(16, G, 21, G, TL.BROTH); b.fill(30, G, 36, G, TL.BROTH); b.fill(45, G, 50, G, TL.BROTH);
  b.plat(16, 17, G - 3); b.plat(19, 21, G - 4); b.plat(31, 33, G - 3); b.plat(34, 36, G - 5); b.plat(46, 48, G - 4);
  for (const c of [18, 33, 48]) b.add(new JamLeaper(X(c), Y(G)));
  b.add(new GarlicArcher(X(26), Y(G))); b.add(new GarlicArcher(X(41), Y(G))); b.add(new GarlicArcher(X(56), Y(G)));
  b.block(9, G - 4, 'drops'); b.block(10, G - 4, 'cherry'); b.block(39, G - 4, 'ice');
  b.add(new JarKid(X(24), Y(G), 0)); b.item('note', 12, G - 1, { id: 'w2-5:a' });
  b.plat(52, 55, G - 7); b.item('gold', 53, G - 8, { i: 0 }); b.plat(49, 50, G - 4);
  // B: the shaft — jam rises once you step in
  b.add(new UmbrellaCheckpoint(X(62), Y(G), 0));
  b.fill(64, 0, 64, G - 4, TL.SOLID); b.fill(89, 7, 89, H - 1, TL.SOLID); b.ground(61, 88, G);
  b.add(new RisingJam(64 * T, 89 * T, Y(G + 2), Y(8), 36, X(67)));
  const S = [66, 72, 78, 83, 78, 72, 66, 71, 77, 83, 77];
  const shaft = []; let k = 0; for (let r = G - 3; r >= 7; r -= 3) { const c = S[k++ % S.length]; b.plat(c, c + 4, r); shaft.push([c, r]); if (k % 3 === 0) b.drops(c + 1, r - 2, 3, 0); }
  b.add(new GarlicArcher(X(85), Y(G - 9))); b.plat(84, 86, G - 9); b.add(new GarlicArcher(X(67), Y(G - 21))); b.plat(66, 68, G - 21);
  b.add(new JarKid(X(85), Y(G - 12), 1)); b.item('gold', 86, G - 18, { i: 1 }); b.plat(85, 88, G - 17);
  b.item('note', 74, G - 25, { id: 'w2-5:b' });
  // C: the crater rim and Bosun Horseradish
  b.ground(89, 149, 6); b.fill(64, 6, 88, 6, TL.EMPTY);
  b.plat(84, 88, 6);
  b.add(new UmbrellaCheckpoint(X(91), Y(6), 1)); b.add(new JarKid(X(93), Y(6), 2));
  b.hint(92, 'w25-boss', 'Впереди Боцман Хрен. Перепрыгивай ударные волны, а когда он заиграет на дудке — прыгай ему на голову!');
  const gL = b.add(new Gate(95, 0, 5)), gR = b.add(new Gate(124, 0, 5));
  const arena = { x0: 96 * T, x1: 124 * T, floor: Y(6), top: -200, camMin: 95 * T, camMax: 125 * T, lowView: true };
  const boss = b.add(new Horseradish(arena)); b.add(new BossTrigger(98 * T));
  b.plat(103, 106, 2); b.item('gold', 104, 1, { i: 2 });
  // D: a cooled jelly lake with the boat
  b.fill(130, 6, 146, 9, TL.EMPTY); b.fill(130, 10, 146, H - 1, TL.SOLID); sea(b, 130, 146, Y(6) + 20); b.fill(149, 0, 149, H - 1, TL.SOLID);
  b.add(new Boat(X(134), Y(6) + 20, 0));
  return Object.assign({}, W2_DEF, {
    id: '2-5', name: 'Вулкан Горячего Джема', theme: THEME_W2_5, level: b.L, ents: b.ents, decoBack: b.decoBack, decoFront: b.decoFront, fake: b.fake,
    start: { x: X(3), y: Y(G) }, sheep: 3, path: shaft, arena, gates: [gL, gR], boss, bossHint: 'Боцман Хрен! Перепрыгивай ударные волны. Когда он дудит в дудку — топчи его!',
    onBossDefeated(G) { G.pickle.speak('Боцман Хрен сдулся! Лодка ждёт нас в остывшем джемовом озере справа.', 5, true); }
  });
}

// ---------- 2-6 Lemonade sea: a sea battle on the boat ----------
function buildW2L6() {
  const b = new LB(262, 16), SURF = Y(12);
  b.fill(0, 15, 261, 15, TL.SOLID); sea(b, 0, 261, SURF, { amp: 4, period: 3 });
  b.ground(0, 6, 11);
  b.hint(1, 'w26-start', 'Лимонадное море! Садимся в лодку — дальше пираты и фрегат «Кислая Селёдка».');
  b.add(new RideBoat(X(10), SURF));
  const air = y => Math.round(y / T);
  for (const c of [36, 60, 86, 108, 132, 156, 180, 204, 226]) b.add(new JarBoat(X(c), SURF));
  const sprats = [[44, 300], [52, 380], [70, 260], [78, 420], [96, 330], [100, 250], [118, 400], [126, 300], [146, 280], [152, 420], [170, 330], [188, 260], [196, 400], [214, 300], [220, 380]];
  for (const [c, y] of sprats) b.add(new Sprat(X(c), y, { amp: 50, drift: -40 }));
  for (let c = 20; c < 230; c += 14) b.drops(c, air(SURF - 70 - (c % 3) * 40), 3, 0);
  b.add(new FloatJar(X(74), SURF)); b.add(new FloatJar(X(164), SURF));
  b.item('gold', 58, air(SURF - 150), { i: 0 }); b.item('gold', 140, air(SURF - 160), { i: 1 }); b.item('gold', 200, air(SURF - 150), { i: 2 });
  b.item('note', 30, air(SURF - 120), { id: 'w2-6:a' }); b.item('note', 120, air(SURF - 120), { id: 'w2-6:b' });
  b.item('ice', 100, air(SURF - 90)); b.item('ice', 190, air(SURF - 90));
  const boss = b.add(new Frigate({ x0: 238 * T, x1: 262 * T, floor: SURF, top: 0 }, SURF));
  return Object.assign({}, W2_DEF, {
    id: '2-6', name: 'Лимонадное Море', theme: THEME_W2_6, level: b.L, ents: b.ents, decoBack: b.decoBack, decoFront: b.decoFront, fake: b.fake,
    start: { x: X(3), y: Y(11) }, sheep: 2, boss, arena: boss.ar, airBoss: true, bossRate: 1,
    ride: { camY: SURF - VIEW_H + 150, speed: 130, stopX: 236 * T, startCam: 0 }, boatRide: { surface: SURF },
    onBossDefeated(G) {
      G.pickle.speak('«Кислая Селёдка» пошла ко дну! Полный вперёд — к Банановой Родине!', 4, true);
      G.later(2.2, () => { if (G.player.state === 'balloon') { G.setState('win'); G.winRide = true; Audio2.play('win'); } });
    }
  });
}

// ---------- 2-7 Banana homeland: Banni's level ----------
function buildW2L7() {
  const b = new LB(222, 26), G = 21, H = 26;
  const deco = (k, c, r, o) => b.decoBack.push(Object.assign({ k, x: X(c), y: Y(r) + 6 }, o || {}));
  // A: the plantation: palms with vines, salted spiders
  b.ground(0, 40, G);
  b.hint(1, 'w27-start', () => `Банановая Родина! Тут веду я, Банни. ${Input.label('down')} на бегу — съехать по листу, а по лианам можно залезть на пальмы.`);
  for (const c of [3, 14, 27, 38]) deco('palm', c, G, { h: 260 });
  b.add(new PalmVine(X(10), Y(G - 11), 300)); b.add(new PalmVine(X(20), Y(G - 11), 300)); b.plat(22, 25, G - 9); b.item('gold', 23, G - 10, { i: 0 });
  b.add(new SaltSpider(X(16), Y(G - 10), 170)); b.add(new SaltSpider(X(31), Y(G - 10), 200, { ph: 2 }));
  b.add(new PirateGherkin(X(25), Y(G))); b.add(new PirateGherkin(X(36), Y(G)));
  b.block(29, G - 4, 'drops'); b.block(30, G - 4, 'cherry');
  b.add(new JarKid(X(33), Y(G), 0)); b.item('note', 12, G - 1, { id: 'w2-7:a' });
  // B: leaf slides (slippery banana leaves) over a ravine
  let top = b.slopeUp(41, G, 5, true); b.ground(46, 50, top); let low = b.slopeDown(51, top, 7, true);
  b.ground(58, 62, low); b.pit(63, 67); b.ground(68, 80, G);
  b.hint(45, 'w27-slide', () => `Лист скользкий — съезжай (${Input.label('down')}) и прыгай через овраг на скорости!`);
  b.add(new PirateGherkin(X(74), Y(G))); b.add(new SaltSpider(X(66), Y(G - 12), 260));
  b.drops(63, G - 3, 6, 30); b.add(new JarKid(X(78), Y(G), 1));
  // C: checkpoint, a tall palm with the second cherry
  b.add(new UmbrellaCheckpoint(X(82), Y(G), 0)); b.ground(81, 130, G);
  deco('palm', 92, G, { h: 300 }); deco('palm', 104, G, { h: 280 });
  b.add(new PalmVine(X(90), Y(G - 12), 330)); b.plat(93, 96, G - 10); b.add(new PalmVine(X(98), Y(G - 19), 200)); b.plat(100, 103, G - 16); b.item('gold', 101, G - 17, { i: 1 });
  b.add(new SaltSpider(X(96), Y(G - 12), 200)); b.add(new PirateGherkin(X(110), Y(G))); b.add(new PirateGherkin(X(118), Y(G), { speed: 80 }));
  b.item('note', 114, G - 1, { id: 'w2-7:b' }); b.block(106, G - 4, 'ice');
  // D: the village under a pirate raid; Banni's family
  for (const c of [138, 150, 166]) deco('hut', c, G);
  b.ground(131, 200, G);
  for (const c of [140, 146, 153, 159]) b.add(new PirateGherkin(X(c), Y(G), { speed: 70 }));
  b.add(new SaltSpider(X(144), Y(G - 10), 180)); b.add(new JarKid(X(156), Y(G), 2));
  b.plat(160, 163, G - 6); b.item('gold', 161, G - 7, { i: 2 }); b.add(new PalmVine(X(158), Y(G - 12), 170));
  b.add(new NpcTalk(X(172), Y(G), 'banniMom', [
    { who: 'banniMom', text: 'Банни! Сыночек! Ты вернулся — и пиратов прогнал!' },
    { who: 'banni', text: 'Мама! Мы с Пиклем спасаем его семью от Капитана Уксуса.' },
    { who: 'banniDad', text: 'Тогда вот вам подарок: парус из нашего лучшего бананового листа. С ним лодка полетит, как ветер!' },
    { who: 'pickle', text: 'Спасибо! Теперь мы точно догоним флагман!' }
  ], G => { G.familyMet = true; Save.data.family = Object.assign({}, Save.data.family, { banni: true, sail: true }); Save.save(); G.toast('Парус из бананового листа!'); G.pickle.speak('Скорее к лодке — на берег!', 4, true); }, { happy: true }));
  b.decoBack.push({ k: 'banniDad', x: X(176), y: Y(G) });
  // E: the shore
  b.fill(201, G, 218, H - 1, TL.EMPTY); b.fill(201, G + 3, 218, H - 1, TL.SOLID); sea(b, 201, 218, Y(G) + 16); b.fill(219, 0, 221, H - 1, TL.SOLID);
  b.add(new Boat(X(205), Y(G) + 16, 0, { cond: G => G.familyMet, wait: 'Сначала зайдём к моим маме с папой — они в деревне!' }));
  return Object.assign({}, W2_DEF, {
    id: '2-7', name: 'Банановая Родина', theme: THEME_W2_7, level: b.L, ents: b.ents, decoBack: b.decoBack, decoFront: b.decoFront, fake: b.fake,
    start: { x: X(3), y: Y(G) }, sheep: 3, startChar: 'banni', swap: false
  });
}

// ---------- 2-8 Kiwi caves: darkness, tide, the Dark Pickle ----------
function buildW2L8() {
  const b = new LB(204, 30), G = 22, H = 30;
  b.fill(0, 0, 203, 3, TL.SOLID); // cave ceiling
  b.ground(0, 30, G);
  b.hint(1, 'w28-start', 'Пещеры Киви. Темно — держимся у светящихся киви. Где-то здесь лежит фонарь!');
  for (const c of [6, 22, 40, 58, 76, 96, 114, 132, 150, 168, 178, 190]) b.add(new KiwiLamp(X(c), Y(G - 7)));
  b.block(12, G - 4, 'lantern'); b.block(13, G - 4, 'drops');
  b.add(new EvilPickle(X(24), Y(G))); b.add(new CaperFly(X(18), Y(G - 6)));
  b.item('note', 28, G - 1, { id: 'w2-8:a' });
  // B: a tidal lake: the water rises and falls
  seabed(b, 31, 70, G + 4); b.fill(31, 0, 70, 3, TL.SOLID); sea(b, 31, 70, Y(G) + 30, { amp: 60, period: 10 });
  b.plat(36, 39, G - 1); b.plat(44, 47, G - 2); b.plat(52, 55, G - 1); b.plat(60, 63, G - 2); b.plat(66, 68, G - 1);
  b.hint(31, 'w28-tide', 'Прилив и отлив! Когда вода уходит, на дне видно тайник. Когда приходит — уступы ближе.');
  b.fill(48, G + 4, 50, G + 5, TL.EMPTY); b.item('gold', 49, G + 5, { i: 0 }); b.add(new SodaVent(X(40), Y(G + 4))); b.add(new SodaVent(X(58), Y(G + 4)));
  b.add(new CaperFly(X(48), Y(G - 7))); b.add(new CaperFly(X(62), Y(G - 6))); b.add(new JarKid(X(53), Y(G + 4), 0));
  // C: tunnels with evil doubles, a rind wall with a cherry
  b.ground(71, 120, G); b.add(new UmbrellaCheckpoint(X(73), Y(G), 0));
  b.fill(80, 4, 90, G - 4, TL.SOLID);
  b.add(new EvilPickle(X(86), Y(G))); b.add(new EvilPickle(X(100), Y(G))); b.add(new CaperFly(X(95), Y(G - 8)));
  b.fill(104, G - 5, 110, G - 5, TL.SOLID); b.fill(104, G - 4, 104, G - 1, TL.RIND); b.fill(110, G - 4, 110, G - 1, TL.SOLID); b.item('gold', 107, G - 1, { i: 1 });
  b.add(new JarKid(X(115), Y(G), 1)); b.item('note', 118, G - 1, { id: 'w2-8:b' });
  b.plat(112, 115, G - 6); b.plat(117, 120, G - 10); b.item('drop', 118, G - 11);
  // D: high ledges with the third cherry
  b.ground(121, 165, G); b.plat(126, 129, G - 4); b.plat(132, 135, G - 8); b.plat(138, 141, G - 12); b.item('gold', 139, G - 13, { i: 2 });
  b.add(new EvilPickle(X(146), Y(G))); b.add(new CaperFly(X(140), Y(G - 6))); b.add(new CaperFly(X(152), Y(G - 7)));
  b.add(new UmbrellaCheckpoint(X(160), Y(G), 1)); b.add(new JarKid(X(157), Y(G), 2)); b.block(150, G - 4, 'ice');
  // E: the Dark Pickle's den
  b.ground(166, 203, G);
  const gL = b.add(new Gate(166, 4, G - 1)), gR = b.add(new Gate(194, 4, G - 1));
  const arena = { x0: 167 * T, x1: 194 * T, floor: Y(G), top: Y(4), camMin: 166 * T, camMax: 195 * T };
  const boss = b.add(new DarkPickle(arena)); b.add(new BossTrigger(169 * T));
  b.fill(196, G, 202, H - 1, TL.EMPTY); b.fill(196, G + 3, 202, H - 1, TL.SOLID); sea(b, 196, 202, Y(G) + 16); b.fill(203, 0, 203, H - 1, TL.SOLID);
  b.add(new Boat(X(199), Y(G) + 16, 0));
  return Object.assign({}, W2_DEF, {
    id: '2-8', name: 'Пещеры Киви', theme: THEME_W2_8, level: b.L, ents: b.ents, decoBack: b.decoBack, decoFront: b.decoFront, fake: b.fake,
    start: { x: X(3), y: Y(G) }, sheep: 3, arena, gates: [gL, gR], boss, bossHint: 'Это моя тень, Тёмный Пикль! Он бросается вперёд — уворачивайся. Врежется в стену — прыгай ему на голову!',
    onBossDefeated(G) { G.pickle.speak('Моя тень растаяла! Уксус больше меня не напугает. Лодка — справа!', 5, true); }
  });
}

// ---------- 2-9 Island of sunken jars: taps, ghosts, biting lids, cousin Kabachok ----------
function buildW2L9() {
  const b = new LB(212, 26), G = 20, H = 26;
  b.ground(0, 18, G);
  b.hint(1, 'w29-start', 'Остров Затонувших Банок. Туман и привидения… Краны поднимают и опускают воду — это пригодится.');
  b.add(new GhostMarinade(X(14), Y(G - 5)));
  b.item('note', 10, G - 1, { id: 'w2-9:a' }); b.block(6, G - 4, 'drops');
  // A: the jar-lid bridges over the water
  seabed(b, 19, 70, G + 4); const w1 = sea(b, 19, 70, Y(G) + 30);
  for (const [c, r] of [[22, G - 1], [28, G - 2], [34, G - 1], [40, G - 2], [46, G - 1], [52, G - 2], [58, G - 1], [64, G - 2]]) b.plat(c, c + 2, r);
  for (const c of [28, 46, 64]) b.add(new LidTrap(X(c + 1), Y(G - 2), { ph: c * 0.1 }));
  b.add(new GhostMarinade(X(40), Y(G - 6))); b.add(new JarKid(X(35), Y(G + 4), 0)); b.add(new SodaVent(X(50), Y(G + 4)));
  // B: a tap raises the water — float up to the high ledge (the path goes on up there)
  b.ground(71, 80, G); b.add(new UmbrellaCheckpoint(X(73), Y(G), 0));
  seabed(b, 81, 100, G + 4);
  const w2 = sea(b, 81, 100, Y(G) + 30);
  b.add(new Tap(X(78), Y(G), w2, Y(G) + 30, Y(G - 9) + 20));
  b.hint(77, 'w29-tap', 'Стена высокая. Поверни кран (встань рядом и нажми ↑) — вода поднимется, и Банни всплывёт наверх. Мне там слишком глубоко — меняемся!');
  b.fill(101, G - 9, 140, H - 1, TL.SOLID);
  b.item('gold', 92, G + 3, { i: 0 }); b.add(new GhostMarinade(X(92), Y(G - 3)));
  // C: the high part of the island
  const Gh = G - 9;
  b.add(new UmbrellaCheckpoint(X(104), Y(Gh), 1)); b.add(new LidTrap(X(112), Y(Gh))); b.add(new LidTrap(X(120), Y(Gh), { ph: 1.5 }));
  b.add(new GhostMarinade(X(118), Y(Gh - 5))); b.add(new JarKid(X(126), Y(Gh), 1)); b.item('note', 130, Gh - 1, { id: 'w2-9:b' });
  b.plat(132, 135, Gh - 5); b.item('gold', 133, Gh - 6, { i: 1 });
  // D: down to cousin Kabachok in the biggest jar
  b.ground(141, 200, G);
  b.add(new GhostMarinade(X(150), Y(G - 4))); b.add(new GhostMarinade(X(165), Y(G - 6)));
  b.add(new LidTrap(X(158), Y(G))); b.add(new JarKid(X(170), Y(G), 2));
  b.fill(146, G - 4, 150, G - 4, TL.SOLID); b.fill(146, G - 3, 146, G - 1, TL.RIND); b.fill(150, G - 3, 150, G - 1, TL.SOLID); b.item('gold', 148, G - 1, { i: 2 });
  b.add(new RescueCage(X(182), Y(G), { who: 'kabachok', jar: true, call: 'Кузен Кабачок — в самой большой банке! Хрустом её!', lines: [
    { who: 'kabachok', text: 'Пикль! Я знал, что ты меня найдёшь! Смотри, что я стащил у Уксуса — карту!' },
    { who: 'pickle', text: 'Карта к флагману! Там бабушка?' },
    { who: 'kabachok', text: 'И бабушка, и все наши. «Кислый Рассол» стоит в шторме за островом. Плывём!' }
  ] }));
  b.fill(201, G, 210, H - 1, TL.EMPTY); b.fill(201, G + 3, 210, H - 1, TL.SOLID); sea(b, 201, 210, Y(G) + 16); b.fill(211, 0, 211, H - 1, TL.SOLID);
  b.add(new Boat(X(205), Y(G) + 16, 0, { cond: G => G.relFree, wait: 'Сначала освободим кузена Кабачка!' }));
  return Object.assign({}, W2_DEF, {
    id: '2-9', name: 'Остров Затонувших Банок', theme: THEME_W2_9, level: b.L, ents: b.ents, decoBack: b.decoBack, decoFront: b.decoFront, fake: b.fake,
    start: { x: X(3), y: Y(G) }, sheep: 3
  });
}

Object.assign(LEVELS, { '2-4': buildW2L4, '2-5': buildW2L5, '2-6': buildW2L6, '2-7': buildW2L7, '2-8': buildW2L8, '2-9': buildW2L9 });
(function () { // open the built levels on the map, with their thumbnails
  const w = WORLDS.find(q => q.id === 2);
  for (const l of w.levels) if (LEVELS[l.id]) { l.soon = false; const n = l.id.split('-')[1]; if (!l.thumb) l.thumb = `assets/w2/thumb${n}.jpg`; if (!l.notes) l.notes = `w2-${n}:`; if (!l.sheep) l.sheep = 3; }
  w.levels.find(l => l.id === '2-6').sheep = 2;
  for (let n = 4; n <= 10; n++) w.assets.push([`w2bg${n}`, `assets/w2/bg${n}.jpg`]);
  w.assets.push(['w2bg6b', 'assets/w2/bg6b.jpg']);
})();

// ---------- 2-10 The flagship «Кислый Рассол»: storm, the hold, the rigging, Captain Vinegar ----------
function buildW2L10() {
  const b = new LB(204, 26), G = 19, H = 26;
  b.add(new StormTilt(204 * T, H * T, 360));
  // A: the stern deck
  b.ground(0, 50, G);
  b.hint(1, 'w210-start', 'Флагман «Кислый Рассол»! Шторм, пираты — а где-то в трюме бабушка и вся наша семья. Вперёд!');
  for (const c of [14, 27, 40]) b.add(new PirateGherkin(X(c), Y(G), { speed: 70 }));
  b.add(new Barrel(20, G - 1, 'drops')); b.add(new Barrel(21, G - 1, 'ice'));
  b.add(new JarKid(X(31), Y(G), 0)); b.item('note', 45, G - 1, { id: 'w2-10:a' });
  b.add(new RopeVine(X(24), Y(G - 13), 330)); b.plat(21, 27, G - 11); b.item('gold', 24, G - 12, { i: 0 });
  b.block(9, G - 4, 'helmet'); b.block(10, G - 4, 'drops');
  // B: down into the sloshing hold
  b.add(new UmbrellaCheckpoint(X(48), Y(G), 0));
  b.ground(51, 99, G + 4); sea(b, 51, 99, Y(G + 4) - 30, { amp: 22, period: 4.5 });
  for (const [c, r] of [[56, G + 1], [64, G], [72, G + 1], [80, G], [88, G + 1]]) b.plat(c, c + 3, r);
  b.add(new JarKid(X(65), Y(G), 1)); b.add(new JarKid(X(81), Y(G), 2));
  b.add(new PirateGherkin(X(70), Y(G + 4))); b.add(new PirateGherkin(X(90), Y(G + 4))); b.add(new GhostMarinade(X(76), Y(G - 3)));
  b.drops(57, G - 1, 3, 0); b.drops(73, G - 1, 3, 0); b.add(new SodaVent(X(60), Y(G + 4)));
  let top = b.slopeUp(95, G + 4, 4); b.ground(99, 99, top);
  // C: the rigging between the masts
  b.ground(100, 150, G);
  for (const c of [108, 120, 132, 144]) b.add(new RopeVine(X(c), Y(G - 14), 280));
  b.plat(112, 116, G - 7); b.plat(124, 129, G - 12); b.plat(136, 140, G - 8); b.item('gold', 126, G - 13, { i: 1 });
  b.add(new JarKid(X(114), Y(G - 7), 3)); b.item('gold', 138, G - 9, { i: 2 }); b.item('note', 128, G - 13, { id: 'w2-10:b' });
  b.add(new PirateGherkin(X(118), Y(G))); b.add(new PirateGherkin(X(138), Y(G), { speed: 80 })); b.add(new CrabCaper(X(128), Y(G)));
  b.add(new Barrel(146, G - 1, 'drops'));
  // D: the main deck — Captain Vinegar
  b.add(new UmbrellaCheckpoint(X(151), Y(G), 1));
  b.ground(151, 203, G);
  const gL = b.add(new Gate(155, G - 12, G - 1)), gR = b.add(new Gate(197, G - 12, G - 1));
  b.plat(173, 179, G - 8); b.plat(160, 163, G - 4); b.plat(189, 192, G - 4);
  b.add(new RopeVine(X(166), Y(G - 13), 220)); b.add(new RopeVine(X(186), Y(G - 13), 220));
  b.fill(162, G - 3, 163, G - 1, TL.SOLID); b.fill(189, G - 3, 190, G - 1, TL.SOLID);
  b.plat(193, 195, G - 6);
  const water = sea(b, 156, 196, H * T + 200);
  const grandma = b.add(new GrandmaHelper(X(194), Y(G - 6)));
  const arena = { x0: 156 * T, x1: 197 * T, floor: Y(G), top: Y(G - 12), camMin: 155 * T, camMax: 198 * T,
    nest: Y(G - 8), nestX: X(176), crates: [163 * T, 190 * T], crateTop: Y(G - 3), water, waterLow: H * T + 200, grandma };
  const boss = b.add(new Vinegar(arena)); b.add(new BossTrigger(158 * T));
  b.fill(203, 0, 203, H - 1, TL.SOLID);
  return Object.assign({}, W2_DEF, {
    id: '2-10', name: 'Флагман «Кислый Рассол»', theme: THEME_W2_10, level: b.L, ents: b.ents, decoBack: b.decoBack, decoFront: b.decoFront, fake: b.fake,
    start: { x: X(3), y: Y(G) }, sheep: 4, arena, gates: [gL, gR], boss,
    bossHint: 'Капитан Уксус! После выпада он выдыхается — тогда прыгай ему на треуголку или бей Хрустом.',
    onBossDefeated(G) {
      G.pickle.speak('Он… улыбается?', 3, true); G.player.inv = 99;
      G.later(1.6, () => G.dialog([
        { who: 'vinegarSweet', text: 'Сироп?.. Сладко… Я сто лет не пробовал сладкого… Когда-то я был виноградом, а потом меня забыли в бочке.' },
        { who: 'grandma', text: 'Вот и славно, капитан. Пойдёмте-ка с нами на Праздник Урожая — угощу виноградным сорбетом.' },
        { who: 'vinegarSweet', text: 'Эй, команда! Открыть все банки! Огурцы — на свободу!' },
        { who: 'pickle', text: 'Бабушка! Мы всех нашли!' }
      ], () => { Save.data.family = Object.assign({}, Save.data.family, { grandma: true }); Save.save(); worldFinale(WORLDS.find(w => w.id === 2), true); }));
    }
  });
}
LEVELS['2-10'] = buildW2L10;
(function () { const w = WORLDS.find(q => q.id === 2), l = w.levels.find(q => q.id === '2-10'); l.soon = false; l.thumb = 'assets/w2/thumb10.jpg'; l.notes = 'w2-10:'; l.sheep = 4; w.assets.push(['w2finale', 'assets/w2/finale.jpg']); })();

// the story screens at the end of a world (World 2 for now)
function worldFinale(w, fromGame) {
  const texts = {
    2: [
      'Сахарный сироп растопил кислое сердце Капитана Уксуса. «Я сто лет не пробовал сладкого…» — прошептал он и впервые за сто лет улыбнулся.',
      'Все банки открыты! Бабушка Корнишон, дядя Зеленец, сестричка Пупырка, кузен Кабачок и вся огуречная родня снова вместе.',
      'На Огуречном острове устроили Праздник Урожая. Бабушка угощала всех сорбетом, Уксус травил морские байки, а Банни и Пикль танцевали до утра.',
      'Конец второго мира! Спасибо, что прошли Фруктовый Архипелаг. Впереди — Зимняя Пекарня…'
    ]
  }[w.id] || ['Конец!'];
  UI.finWorld = w.id; UI.finIdx = 0; G.setState('finale'); canvas.style.filter = ''; Audio2.muffle(false); Audio2.play('win');
  if (!ASSETS.w2finale) loadImage('w2finale', 'assets/w2/finale.jpg');
  if (!fromGame) G.level = null;
  const render = () => {
    const last = UI.finIdx >= texts.length - 1;
    UI.html('finale', `<div class="caption"><p>${texts[UI.finIdx]}</p><div class="menu row"><button id="f-next">${!last ? 'Дальше ▸' : (fromGame ? 'Итоги ▸' : 'На карту ▸')}</button></div></div>`);
    UI.el.querySelector('#f-next').onclick = () => { if (!last) { UI.finIdx++; G.stateT = 0; render(); } else done(); };
    UI.onBack = done;
  };
  const done = () => { if (fromGame && G.level) G.showResults(); else UI.map(w.levels.length - 1, WORLDS.indexOf(w)); };
  render();
}
