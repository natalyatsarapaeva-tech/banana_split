'use strict';
// ================= levels2.js : levels 3-5 and bonus =================
function islandB(b, c0, c1, top, depth) { b.fill(c0, top, c1, top + (depth || 3) - 1, TL.SOLID); }
function liquid(b, c0, c1, r0, r1, t) { b.fill(c0, r0, c1, r1, t || TL.CHOC); }

// ---------------- Level 3 : Caramel Skies ----------------
function buildLevel3() {
  const b = new LB(285, 20);
  // A: start islands
  islandB(b, 0, 12, 14, 6);
  b.hint(2, 'start3', 'Карамельные Небеса! Под ногами только облака — не падай. Не забывай: в воздухе можно подпрыгнуть ещё раз!');
  b.decoBack.push({ k: 'bowl', x: X(8), y: Y(14) + 40 });
  b.drops(5, 12, 4, 20);
  b.plat(13, 17, 14);
  islandB(b, 18, 24, 13);
  b.block(20, 9, 'cherry'); b.block(21, 9, 'drops'); b.block(22, 9, 'ice');
  b.add(new MeringueCloud(X(26) - 40, Y(12), 90));
  b.add(new MeringueCloud(X(30) - 40, Y(11), 90));
  b.hint(25, 'meringue', 'Облака из безе рассыпаются, если на них стоять! Прыгай дальше не задерживаясь.');
  islandB(b, 33, 40, 12);
  b.add(new FlyRadish(X(37), Y(5)));
  b.hint(34, 'fradish', 'Летучие редиски пикируют сверху! Отойди в сторону — и прыгни на неё, пока она внизу.');
  b.drops(26, 9, 6, 30);
  // B: updrafts
  islandB(b, 41, 46, 13);
  b.block(44, 9, 'parachute');
  b.hint(43, 'updraft', 'Впереди тёплые потоки воздуха! Шагни в светящийся столб — он поднимет вверх. С парашютом поднимешься ещё выше.');
  b.add(new Updraft(47 * T, Y(4), 2 * T, Y(20) - Y(4), 2800));
  islandB(b, 50, 53, 7, 2);
  b.item('gold', 52, 5, { i: 0 }); b.item('note', 51, 6, { id: 'l3a' });
  b.add(new Updraft(54 * T, Y(9), 2 * T, Y(20) - Y(9), 2600));
  islandB(b, 57, 66, 11);
  b.add(new GarlicDrone(X(61), Y(7), 70));
  b.hint(57, 'drone', 'Чесночный дрон! Его можно сбить только выстрелом — или просто обойти.');
  b.plat(67, 69, 11);
  islandB(b, 70, 76, 12);
  b.add(new Celery(X(74), Y(12)));
  b.hint(68, 'celery', 'Сельдерей-лучник стреляет стеблями! Подберись ближе и прыгни сверху.');
  b.add(new Cage(X(72), Y(12), 0));
  islandB(b, 78, 85, 13);
  b.add(new Checkpoint(X(80), Y(13), 0));
  // C: wind bridge, lollipop icicles, meringue chain
  b.plat(86, 101, 13);
  b.add(new WindZone(86 * T, 0, 16 * T, Y(20), -1, 2.0, 2.6, 1500));
  b.drops(88, 11, 10, 20);
  b.add(new FlyRadish(X(96), Y(5)));
  islandB(b, 102, 110, 12);
  islandB(b, 102, 110, 5, 2);
  b.add(new LolliIcicle(X(104), Y(7))); b.add(new LolliIcicle(X(107), Y(7)));
  b.hint(101, 'lolli', 'Леденцовые сосульки! Они срываются, когда проходишь под ними — проскакивай быстро.');
  b.add(new MeringueCloud(X(112) - 40, Y(12), 90));
  b.add(new MeringueCloud(X(116) - 40, Y(11), 90));
  b.add(new MeringueCloud(X(120) - 40, Y(12), 90));
  islandB(b, 112, 115, 17, 2);
  b.item('gold', 113, 16, { i: 1 }); b.drops(112, 15, 3, 0);
  b.add(new Updraft(116 * T, Y(8), 2 * T, Y(17) - Y(8), 2600));
  islandB(b, 123, 134, 13);
  b.add(new Cage(X(125), Y(13), 1));
  b.add(new Barrier(135 * T - 6, Y(13)));
  const misha = b.add(new Misha(X(129), Y(13), [
    { who: 'misha', text: 'Стойте! Не бейте! Я Миша. Я ушла из армии Барона — насовсем!' },
    { who: 'pickle', text: 'Морковка из Горьких Земель? Ты правда больше не с ними?' },
    { who: 'misha', text: 'Правда. Знаете, Барон не злой… Его просто никогда-никогда не выбирали на тарелку. Вот он и решил, что раз его не любят — пусть никто не ест сладкого.' },
    { who: 'banni', text: 'Бедный Барон… Но Котёл Горечи мы всё равно остановим!' },
    { who: 'misha', text: 'Я знаю обходные пути в его владениях — встретимся у Шоколадной реки! А вот и Капитан Безе — летите на шаре!' }
  ], (G, m) => { m.leave = 2.5; G.add(new RideBalloon(X(132), Y(13))); G.pickle.speak('Запрыгивай в корзину! В полёте шар слушается стрелок, а пушка стреляет косточками.', 6, true); }));
  // D: ride through the sky (autoscroll)
  const rideY0 = 160;
  const ry = r => rideY0 + 120 + r;
  const gummies = [[142, 80], [148, 260], [153, 140], [160, 320], [166, 60], [170, 220], [176, 300], [182, 120], [188, 260], [194, 40], [198, 200], [204, 320], [210, 140], [216, 260], [222, 80], [228, 300], [234, 180]];
  for (const [c, y] of gummies) b.add(new Gummy(X(c), ry(y), { amp: 30 + (c % 4) * 12, drift: -20 }));
  for (const c of [158, 186, 214]) b.add(new GarlicDrone(X(c), ry(170), 50));
  for (const c of [172, 200, 226]) b.add(new FlyRadish(X(c), ry(20)));
  for (let k = 0; k < 9; k++) b.drops(140 + k * 11, Math.round((ry(60 + (k % 3) * 110)) / T), 4, 0);
  b.item('ice', 180, Math.round(ry(180) / T)); b.item('ice', 220, Math.round(ry(60) / T));
  b.item('gold', 207, Math.round(ry(330) / T), { i: 2 });
  b.item('note', 192, Math.round(ry(170) / T), { id: 'l3b' });
  const boss = b.add(new GarlicAirship({ x0: 248 * T, x1: 270 * T, floor: Y(18), top: Y(3) }));
  return {
    id: 3, name: 'Карамельные Небеса', theme: THEME3, level: b.L, ents: b.ents, decoBack: b.decoBack, decoFront: b.decoFront, fake: b.fake,
    start: { x: X(3), y: Y(14) }, arena: boss.ar, gates: [], boss, sheep: 2, musicRate: 1.03, bossRate: 1.12, tone: 20000,
    ride: { camY: rideY0, speed: 125, stopX: 250 * T, startCam: 128 * T }, airBoss: true
  };
}

// ---------------- Level 4 : Chocolate river ----------------
function buildLevel4() {
  const b = new LB(214, 24), G = 15;
  // A: rafts
  b.ground(0, 14, G);
  b.hint(2, 'start4', 'Шоколадная река! Банни в шоколаде не выплывет — переправляйся на печеньях-плотах.');
  b.decoBack.push({ k: 'jello', x: X(4), y: Y(G) + 4, s: 1.2, c: ['#9af06a', '#3a9a2a'] }, { k: 'oreo', x: X(9), y: Y(G) + 6, s: 1 });
  b.add(new Toad(X(10), Y(G)));
  b.block(7, G - 4, 'glaze');
  liquid(b, 15, 34, G, 19); b.fill(15, 20, 34, 23, TL.SOLID);
  b.add(new RaftSpawner(15 * T, Y(G), 35 * T, 3.0, 72));
  b.hint(13, 'raft', 'Печенье-плот! Запрыгивай и плыви по течению. В конце пути плот тонет — прыгай на берег.');
  b.drops(18, G - 3, 14, 30);
  b.ground(35, 50, G);
  b.add(new Geyser(X(41), Y(G), 3.4));
  b.fill(43, 7, 48, 8, TL.SOLID);
  b.item('gold', 46, 6, { i: 0 }); b.drops(43, 6, 3, 0);
  b.block(38, G - 4, 'cherry');
  b.add(new Kholodets(X(48), Y(G)));
  b.decoBack.push({ k: 'jello', x: X(37), y: Y(G) + 4, s: 0.9, c: ['#ffb03a', '#d8661a'] });
  // B: wide river, swap to Pickle, underwater cave, Misha
  b.hint(48, 'swap', () => `Дальше плотов нет — только вплавь! Поменяйтесь со мной: жми ${Input.label('swap')}, и поплыву я. Я ещё и под шоколадом могу!`);
  liquid(b, 51, 78, G, 19); b.fill(51, 20, 78, 23, TL.SOLID);
  liquid(b, 58, 72, 20, 22); b.fill(58, 23, 72, 23, TL.SOLID); b.fill(60, 20, 69, 20, TL.SOLID);
  b.item('gold', 64, 22, { i: 1 }); b.drops(61, 21, 7, 0); b.item('note', 66, 22, { id: 'l4a' });
  b.add(new Whirlpool(X(67), Y(17)));
  b.ground(79, 96, G);
  const bridge = []; for (let c = 51; c <= 78; c++) bridge.push(b.add(new BridgePiece(c * T, Y(G) - 6, (c - 51) * 0.05)));
  b.add(new Misha(X(82), Y(G), [
    { who: 'misha', text: 'Пикль, ты плаваешь как настоящий огурец-подводник!' },
    { who: 'pickle', text: 'Это всё рассол. Привычка с детства.' },
    { who: 'misha', text: 'Сейчас опущу печенье-мост, чтобы Банни тоже мог пройти. А дальше желейные болота — держитесь!' }
  ], (G, m) => { for (const p of bridge) p.activate(); G.pickle.speak(`Мост готов! Можешь снова играть за Банни (${Input.label('swap')}) — он умеет стрелять и кататься.`, 6, true); m.leave = 3; }));
  b.decoFront.push({ k: 'lever', x: X(84), y: Y(G) + 2, on: false });
  // C: jelly swamp
  b.ground(97, 104, G); b.fill(98, G, 104, G, TL.FUDGE);
  b.add(new LeechE(X(101), Y(G)));
  b.hint(96, 'swamp', 'Зыбучая помадка затягивает, если стоять! А перловые пиявки липнут — стряхивай их прыжками.');
  liquid(b, 105, 118, G, 19); b.fill(105, 20, 118, 23, TL.SOLID);
  for (const x of [105.5, 109, 112.5, 116]) b.add(new JellyPad(x * T, Y(G) - 22, 110));
  b.drops(106, G - 6, 12, 40);
  b.ground(119, 140, G);
  b.add(new Geyser(X(121), Y(G), 3.6, 1));
  b.add(new Kholodets(X(125), Y(G))); b.add(new Kholodets(X(129), Y(G), { speed: 40 }));
  b.add(new Toad(X(132), Y(G)));
  b.add(new Cage(X(127), Y(G), 0));
  b.add(new Checkpoint(X(134), Y(G), 0));
  b.decoBack.push({ k: 'jello', x: X(123), y: Y(G) + 4, s: 1.3, c: ['#6ac8ff', '#2a7ac8'] }, { k: 'oreo', x: X(130), y: Y(G) + 6, s: 1.2 });
  // D: wall with a cracked floor (Pickle ground-pound)
  b.ground(141, 165, G);
  b.fill(140, 0, 141, G + 1, TL.SOLID);
  b.fill(136, G, 139, G + 1, TL.CRACK);
  b.fill(132, G + 2, 147, G + 3, TL.EMPTY);
  b.fill(144, G, 146, G + 1, TL.EMPTY);
  b.fill(144, G + 4, 146, G + 4, TL.EMPTY); b.add(new JellyPad(144 * T, Y(G + 4), 120, null, 1180));
  b.item('gold', 135, G + 3, { i: 2 }); b.drops(136, G + 3, 4, 0);
  b.hint(135, 'crack', () => `Стена до неба! Но пол перед ней треснутый. Играй за меня (${Input.label('swap')}), прыгни и жми ${Input.label('down')} — пробью пол ударом сверху!`);
  b.add(new LeechE(X(150), Y(G))); b.add(new Toad(X(154), Y(G))); b.add(new Kholodets(X(159), Y(G)));
  b.block(152, G - 4, 'ice'); b.block(153, G - 4, 'cherry');
  b.item('note', 156, G - 5, { id: 'l4b' });
  b.add(new Cage(X(162), Y(G), 1));
  // E: last raft run
  liquid(b, 166, 178, G, 19); b.fill(166, 20, 178, 23, TL.SOLID);
  b.add(new RaftSpawner(166 * T, Y(G), 179 * T, 2.6, 80));
  b.ground(179, 213, G);
  b.hint(181, 'bosstip4', 'Это Королева Холодец! Пока она прыгает — уворачивайся. Когда шлёпнется и затрясётся — прыгай на корону! А удар Пикля сверху бьёт её всегда.');
  b.block(183, G - 4, 'glaze');
  // arena
  const gate = b.add(new Gate(186, 0, G - 1));
  b.add(new BossTrigger(189 * T));
  b.fill(211, 0, 213, 23, TL.SOLID);
  b.add(new JellyPad(188 * T, Y(G) - 22, 80)); b.add(new JellyPad(207 * T, Y(G) - 22, 80));
  for (let i = 0; i < 4; i++) b.decoBack.push({ k: 'jello', x: X(190 + i * 6), y: Y(G) + 4, s: 0.7, c: [['#9af06a', '#3a9a2a'], ['#ffb03a', '#d8661a'], ['#ff6a8a', '#c82a4a'], ['#6ac8ff', '#2a7ac8']][i] });
  const arena = { x0: 187 * T, x1: 211 * T, floor: Y(G), top: Y(G) - 420, camMin: 186 * T, camMax: 212 * T };
  const boss = b.add(new QueenKholodets(arena));
  return {
    id: 4, name: 'Шоколадная Река', theme: THEME4, level: b.L, ents: b.ents, decoBack: b.decoBack, decoFront: b.decoFront, fake: b.fake,
    start: { x: X(3), y: Y(G) }, arena, gates: [gate], boss, sheep: 2, musicRate: 0.94, bossRate: 1.06, tone: 5000, swap: true,
    exit: { x: (arena.x0 + arena.x1) / 2, y: Y(G) }
  };
}

// ---------------- Level 5 : Kitchen citadel ----------------
function buildLevel5() {
  const b = new LB(216, 22), G = 16;
  // A: entrance
  b.ground(0, 40, G);
  b.hint(2, 'start5', 'Цитадель Жаркого — кухня Барона! Тут всё шипит, жарится и рубит. Будь осторожен!');
  b.decoBack.push({ k: 'pot', x: X(6), y: Y(G) + 4, s: 1.3 }, { k: 'pot', x: X(27), y: Y(G) + 4, s: 1 });
  b.add(new Cutlet(X(12), Y(G)));
  b.hint(10, 'cutlet0', 'Подгорелая котлета в корочке! Первый прыжок собьёт корочку, второй — победит.');
  b.block(15, G - 4, 'cherry'); b.block(16, G - 4, 'drops');
  b.ground(19, 22, G - 1);
  b.add(new Rusk(X(21), Y(G - 1)));
  b.fill(25, G, 33, G, TL.CONVR);
  b.add(new Cutlet(X(30), Y(G)));
  b.hint(24, 'conv', 'Конвейер! Он сам везёт вперёд — смотри, куда приедешь.');
  b.block(31, G - 4, 'ice');
  b.drops(25, G - 2, 8, 0);
  // B: cleaver gauntlet + Misha shortcut below
  b.ground(41, 80, G);
  b.fill(41, G + 2, 70, G + 3, TL.EMPTY); b.fill(41, G + 4, 70, 21, TL.SOLID);
  b.fill(42, G, 43, G + 1, TL.CRACK);
  b.hint(39, 'cleave', () => `Тесаки рубят по очереди — проскакивай, когда тесак поднят. Или… пол тут треснутый! Удар сверху за Пикля (${Input.label('swap')}) откроет тайный ход.`);
  for (const [c, ph] of [[46, 0], [51, 0.8], [56, 1.6], [61, 0.4], [66, 1.2]]) b.add(new Cleaver(X(c), Y(G) - 420, Y(G), 2.4, ph));
  b.add(new SteamVent(X(48.5), Y(G), 170, 3.4, 0)); b.add(new SteamVent(X(63.5), Y(G), 170, 3.4, 1.5));
  b.drops(45, G - 2, 22, 0);
  b.drops(46, G + 3, 18, 0);
  const shortGate = b.add(new Gate(69, G + 2, G + 3));
  shortGate.closed = true; shortGate.solid = 'full'; shortGate.k = 1;
  b.fill(70, G, 71, G + 1, TL.EMPTY);
  b.add(new Updraft(70 * T, Y(G) - 120, 2 * T, 240, 3000));
  b.add(new Misha(X(58), Y(G + 4), [
    { who: 'misha', text: 'Тсс! Это служебный ход — прямо под тесаками. Барон сам велел его построить, а потом забыл.' },
    { who: 'banni', text: 'Миша, ты лучшая!' },
    { who: 'misha', text: 'Сейчас открою решётку. А в конце Кухни — сам Барон в котле-роботе Пережарке. Говорят, котёл боится перегрева!' }
  ], (G, m) => { shortGate.open(); m.leave = 2; G.pickle.speak('Решётка открыта! Тёплый пар в конце хода поднимет нас наверх.', 5, true); }));
  b.add(new Kraut(X(76), Y(G)));
  b.hint(72, 'kraut0', 'Квашеный страж со щитом! Спереди его не пробить — прыгай сверху.');
  b.add(new Cage(X(79), Y(G), 0));
  // C: flipping pans over broth
  b.pit(81, 104); liquid(b, 81, 104, 19, 20, TL.BROTH); b.fill(81, 21, 104, 21, TL.SOLID);
  b.hint(80, 'pans', 'Сковородки переворачиваются! Прыгай, пока они ровные. А бульон внизу очень горячий.');
  b.add(new FlipPan(82 * T, Y(G - 1), 100, 4, 0)); b.add(new FlipPan(87 * T, Y(G - 2), 100, 4, 1.3)); b.add(new FlipPan(92 * T, Y(G - 1), 100, 4, 2.6));
  b.add(new FlipPan(97 * T, Y(G - 2), 100, 4, 0.6));
  b.add(new PotLid(X(89), Y(G - 9))); b.add(new PotLid(X(98), Y(G - 9)));
  b.drops(83, G - 4, 18, 30);
  b.item('gold', 93, G - 7, { i: 0 });
  b.ground(105, 128, G);
  b.add(new Golem(X(113), Y(G)));
  b.hint(108, 'golem', 'Тушёнка-голем! Три прыжка на голову. Когда он бьёт по земле — перепрыгивай ударную волну.');
  b.ground(119, 121, G - 2);
  b.add(new Rusk(X(120), Y(G - 2)));
  b.item('note', 117, G - 5, { id: 'l5a' });
  b.add(new Checkpoint(X(125), Y(G), 0));
  // D: conveyors, mashers, graters
  b.fill(129, G, 139, G, TL.CONVL); b.ground(129, 139, G + 1); b.fill(129, G, 139, G, TL.CONVL);
  b.add(new Masher(X(133), Y(G) - 300, Y(G), 3, 0)); b.add(new Masher(X(137), Y(G) - 300, Y(G), 3, 1.5));
  b.hint(128, 'masher', 'Конвейер едет назад, а сверху давилка для пюре! Беги, когда она поднимается.');
  b.ground(140, 175, G);
  b.fill(144, G - 3, 144, G - 1, TL.GRATER); b.fill(150, G - 4, 150, G - 1, TL.GRATER);
  b.hint(141, 'grater', 'Тёрки! Не касайся их — перепрыгивай, двойной прыжок поможет.');
  b.add(new Kraut(X(155), Y(G))); b.add(new Cutlet(X(159), Y(G)));
  b.fill(160, G - 6, 164, G - 5, TL.SOLID);
  b.item('gold', 162, G - 7, { i: 1 });
  b.add(new SteamVent(X(166.5), Y(G), 160, 3, 0.5));
  b.add(new Golem(X(170), Y(G)));
  b.add(new Cage(X(173), Y(G), 1));
  // secret: cracked floor pocket with the last cherry
  b.fill(147, G, 147, G + 1, TL.CRACK); b.fill(146, G + 2, 149, G + 3, TL.EMPTY); b.fill(146, G + 4, 149, 21, TL.SOLID);
  b.item('gold', 148, G + 3, { i: 2 });
  b.add(new Updraft(148 * T, Y(G) - 40, T, 200, 3000)); b.fill(148, G, 148, G + 1, TL.EMPTY);
  // E: before the boss
  b.ground(176, 215, G);
  b.decoBack.push({ k: 'crackglow', x: X(179), y: Y(G - 6) });
  b.item('note', 178, G - 3, { id: 'l5b' });
  b.block(181, G - 4, 'ice'); b.block(182, G - 4, 'glaze'); b.block(183, G - 4, 'cherry');
  b.hint(180, 'bosstip5', 'Сквозь трещину светится Вафельный Домик! Осталось победить Барона. Сначала прыгай на золотые вентили его котла.');
  const gate = b.add(new Gate(185, 0, G - 1));
  b.add(new BossTrigger(188 * T));
  b.fill(214, 0, 215, 21, TL.SOLID);
  const arena = { x0: 186 * T, x1: 214 * T, floor: Y(G), top: Y(G) - 440, camMin: 185 * T, camMax: 215 * T };
  const boss = b.add(new BaronBoss(arena));
  return {
    id: 5, name: 'Цитадель Жаркого', theme: THEME5, level: b.L, ents: b.ents, decoBack: b.decoBack, decoFront: b.decoFront, fake: b.fake,
    start: { x: X(3), y: Y(G) }, arena, gates: [gate], boss, sheep: 2, musicRate: 0.88, bossRate: 1.0, tone: 3200, swap: true, finalGlow: 150 * T, final: true
  };
}

// ---------------- Bonus : Rainbow topping ----------------
function buildBonus() {
  const b = new LB(250, 16);
  const cher = []; let ci = 0;
  const rc = (c, r) => { b.item('rcherry', c, r, { i: ci++ }); };
  b.ground(0, 9, 6);
  b.hint(1, 'bonus0', () => `Радужный Топпинг! Беги до финиша как можно быстрее и собери 10 радужных вишенок. На радужных горках жми ${Input.label('down')} — разгонишься!`);
  b.add(new Spectator(X(3), Y(6), 'cookie')); b.add(new Spectator(X(5), Y(6), 'gummy'));
  let top = b.slopeDown(10, 6, 6);
  b.ground(16, 30, top);
  b.add(new Booster(18 * T, Y(top), 80, 1));
  rc(13, 7); rc(24, 9);
  b.decoBack.push({ k: 'lolly', x: X(20), y: Y(top) + 4, s: 1.2 }, { k: 'cane', x: X(27), y: Y(top) + 2 });
  b.pit(31, 34);
  b.ground(35, 44, 11);
  b.add(new ScoopBall(X(42), Y(11), -1)).flavor = 'mint';
  b.plat(45, 49, 9, TL.ONEWAY); b.plat(51, 55, 7, TL.ONEWAY);
  rc(47, 7); rc(53, 5);
  top = b.slopeDown(56, 7, 5);
  b.ground(61, 78, top);
  b.add(new Booster(62 * T, Y(top), 80, 1));
  b.add(new Spectator(X(70), Y(top), 'gummy')); b.add(new Spectator(X(72), Y(top), 'cookie'));
  b.pit(79, 83);
  rc(81, 8);
  b.ground(84, 92, 11);
  top = b.slopeUp(93, 11, 4);
  b.ground(97, 104, top);
  b.add(new BallSpawner(X(104), Y(top), -1, 2.2));
  rc(100, top - 3);
  top = b.slopeDown(105, top, 6);
  b.ground(111, 132, top);
  b.add(new Booster(112 * T, Y(top), 120, 1));
  b.pit(122, 126); b.plat(122, 126, top, TL.ONEWAY);
  rc(124, top - 4);
  b.ground(133, 140, 9);
  b.plat(141, 146, 9, TL.ONEWAY);
  b.pit(147, 149); b.ground(147, 149, 13); b.add(new JellyPad(147 * T, Y(13) - 22, 120));
  b.ground(150, 160, 8);
  rc(155, 5);
  top = b.slopeDown(161, 8, 6);
  b.ground(167, 190, top);
  b.add(new Booster(168 * T, Y(top), 120, 1));
  for (const c of [176, 184]) { const s = b.add(new ScoopBall(X(c), Y(top), -1)); s.flavor = 'mint'; s.life = 99; }
  b.pit(191, 195);
  rc(193, 8);
  b.ground(196, 249, 11);
  b.add(new Booster(198 * T, Y(11), 120, 1));
  rc(210, 9);
  for (let i = 0; i < 6; i++) b.add(new Spectator(X(222 + i * 3), Y(11), i % 2 ? 'gummy' : 'cookie'));
  b.add(new Finish(X(236), Y(11)));
  b.fill(248, 0, 249, 15, TL.SOLID);
  return {
    id: 6, name: 'Радужный Топпинг', theme: THEME6, level: b.L, ents: b.ents, decoBack: b.decoBack, decoFront: b.decoFront, fake: b.fake,
    start: { x: X(3), y: Y(6) }, arena: null, gates: [], boss: null, sheep: 0, musicRate: 1.16, tone: 20000, bonus: true, rcherries: ci
  };
}
LEVELS[3] = buildLevel3; LEVELS[4] = buildLevel4; LEVELS[5] = buildLevel5; LEVELS[6] = buildBonus;
LEVEL_INFO.length = 0;
LEVEL_INFO.push(
  { id: 1, name: 'Мороженые Горы', thumb: 'assets/thumb1.jpg', node: [690, 655], label: [400, 602] },
  { id: 2, name: 'Лес Сахарной Ваты', thumb: 'assets/thumb2.jpg', node: [935, 520], label: [690, 515] },
  { id: 3, name: 'Карамельные Небеса', thumb: 'assets/thumb3.jpg', node: [785, 315], label: [505, 293] },
  { id: 4, name: 'Шоколадная Река', thumb: 'assets/thumb4.jpg', node: [520, 432], label: [690, 425] },
  { id: 5, name: 'Цитадель Жаркого', thumb: 'assets/thumb5.jpg', node: [690, 182], label: [330, 66] },
  { id: 6, name: 'Радужный Топпинг', thumb: 'assets/thumb6.jpg', node: [1120, 505], label: [1120, 560], bonus: true }
);
Object.assign(NOTES, {
  l3a: 'Ты уже в Карамельных Небесах! Если встретишь Капитана Безе — передай ему привет. Он обожает печенье с изюмом. — Крошка',
  l3b: 'Я слышала, у Барона есть летучий дирижабль из чеснока. Фу! Зато вишнёвые косточки отлично отбивают его чесночные бомбы. — К.',
  l4a: 'Шоколадная река тёплая и сладкая, но Банни в ней не выплывет. Хорошо, что Пикль у нас отличный пловец! — Крошка',
  l4b: 'Говорят, холодец мечтал стать настоящим желе, а стал… холодцом. Не обижайте его слишком сильно. — К.',
  l5a: 'Из щелей Кухни-Цитадели уже виден свет моего Домика! Вы совсем близко. Я ставлю чайник! — Крошка',
  l5b: 'Котёл Горечи боится только одного — перегрева. Пусть Барон сам перегреет свой котёл! — К.'
});
