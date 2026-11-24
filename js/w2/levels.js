'use strict';
// ================= w2/levels.js : World 2 «Фруктовый Архипелаг» =================
// Order follows the concept (docs/CONCEPT.md, 6B). Node coordinates match the captioned archipelago map
// (assets/w2/map.jpg, 1376×768), whose captions are part of the art, so no label pills are drawn.
// Levels marked `soon` are not built yet.
const W2_LEVELS = [
  { id: '2-1', num: '2-1', name: 'Пляж Кокосовой Стружки', node: [235, 250], sheep: 3, notes: 'w2-1:', thumb: 'assets/w2/thumb1.jpg' },
  { id: '2-2', num: '2-2', name: 'Ананасовые Джунгли', node: [545, 215], sheep: 3, notes: 'w2-2:', thumb: 'assets/w2/thumb2.jpg' },
  { id: '2-3', num: '2-3', name: 'Арбузный Риф', node: [520, 395], sheep: 2, notes: 'w2-3:', soon: true },
  { id: '2-4', num: '2-4', name: 'Манговые Водопады', node: [830, 250], soon: true },
  { id: '2-5', num: '2-5', name: 'Вулкан Горячего Джема', node: [1110, 230], soon: true },
  { id: '2-6', num: '2-6', name: 'Лимонадное Море', node: [655, 400], soon: true },
  { id: '2-7', num: '2-7', name: 'Банановая Родина', node: [270, 540], soon: true },
  { id: '2-8', num: '2-8', name: 'Пещеры Киви', node: [620, 560], soon: true },
  { id: '2-9', num: '2-9', name: 'Остров Затонувших Банок', node: [930, 570], soon: true },
  { id: '2-10', num: '2-10', name: 'Флагман «Кислый Рассол»', node: [1240, 560], soon: true }
];

addWorld(Object.assign({
  id: 2, name: 'Фруктовый Архипелаг', map: 'map2', mapSrc: 'assets/w2/map.jpg', mapSize: [1376, 768], mapBg: ['#2fb5c4', '#7fe0d0'], cursor: 'boat',
  music: false, // по решению автора в мире 2 музыки нет, только звуки
  sheepName: 'Огурчики',
  assets: [['w2bg1', 'assets/w2/bg1.jpg'], ['w2bg2', 'assets/w2/bg2.jpg'], ['w2bg3', 'assets/w2/bg3.jpg']], // level backgrounds, loaded when the map opens
  levels: W2_LEVELS,
  unlocked: () => !!Save.data.done[5],
  finished: () => !!Save.data.done['2-10'],
  intro: [
    'Лето! Банни, Пикль и Крошка приплыли отдохнуть на фруктовые острова Тутти-Фрутти: пляжи из кокосовой стружки, море из газировки, пальмы с бананами.',
    'Но волна вынесла на берег бутылку с письмом от бабушки Пикля: «Капитан Уксус напал на Огуречный остров и увёз всю нашу семью — мариновать в банках!»',
    'Пикль побледнел. В детстве он сам едва сбежал с корабля Уксуса — вот почему он так боится банок с маринадом.',
    '«Теперь моя очередь вести, — сказал Пикль. — Починим лодку и поплывём за ними!» Крошка осталась на пляже встречать спасённых, а Банни, конечно, поплыл с другом.'
  ]
}, LINEAR));

Object.assign(NOTES, {
  'w2-1:a': 'Пикль, внучок! Если письмо дойдёт — знай: мы держимся. В банке тесно, но мы поём песни про укроп. Уксус плывёт к Ананасовым Джунглям. — Бабушка Корнишон',
  'w2-1:b': 'Помнишь, как ты в детстве разбивал плечом бочки с огурцами? Этот Хруст у тебя от дедушки. Пригодится! Целую в пупырышки. — Бабушка',
  'w2-2:a': 'Пикль! Нас везут мимо Ананасовых Джунглей. Пупырку Уксус оставил в лагере — сторожить кладовую с банками. Найди её! — Бабушка Корнишон',
  'w2-2:b': 'Пиратские оливки скользкие — сверху их не возьмёшь. Твой дедушка говорил: «Не можешь перепрыгнуть — пробей!» — Бабушка'
});

// ---------- helpers ----------
const W2_DEF = { arena: null, gates: [], boss: null, musicRate: 1, tone: 20000, swap: true, startChar: 'pickle', sheepName: 'Спасённые огурчики' };
// water from column c0 to c1 (inclusive): surface `surf` px, down to the bottom of the map
function sea(b, c0, c1, surf, o) { return b.add(new WaterBody(c0 * T, (c1 + 1) * T, surf, b.L.H * T, o)); }
// sea floor: solid from row `floor` down, empty above it (down to the ground row `top`, if given)
function seabed(b, c0, c1, floor) { b.fill(c0, 0, c1, floor - 1, TL.EMPTY); b.fill(c0, floor, c1, b.L.H - 1, TL.SOLID); }
function pillar(b, c0, c1, top) { b.fill(c0, top, c1, b.L.H - 1, TL.SOLID); }

// ---------- test ground for World 2 systems (not on the map: G.startLevel('2-dev')) ----------
function buildW2Dev() {
  const b = new LB(110, 20), G = 12;
  b.ground(0, 16, G);
  b.add(new AbilityTrigger(X(1), 'crunch'));
  b.block(6, G - 4, 'helmet'); b.block(8, G - 4, 'flipper'); b.block(10, G - 4, 'armor'); b.bricks(12, 13, G - 4);
  b.add(new CrabCaper(X(14), Y(G)));
  seabed(b, 17, 44, G + 5); sea(b, 17, 44, Y(G) + 18, { amp: 16, period: 5 });
  b.fill(17, G + 3, 20, G + 4, TL.SOLID); b.fill(41, G + 3, 44, G + 4, TL.SOLID);
  b.add(new SodaVent(X(27), Y(G + 5))); b.add(new CurrentZone(33 * T, Y(G + 1), 6 * T, 4 * T, -170, 0));
  b.add(new Anchovy(X(23), Y(G), { dir: 1 }));
  b.item('gold', 37, G + 4, { i: 0 });
  b.ground(45, 109, G);
  b.add(new Barrel(48, G - 1, 'part', { i: 0 })); b.add(new Barrel(50, G - 1, 'drops'));
  b.fill(54, 0, 55, G - 4, TL.SOLID); b.fill(54, G - 3, 55, G - 1, TL.RIND);
  b.add(new JarKid(X(58), Y(G), 0));
  b.fill(61, G - 5, 63, G - 5, TL.RIND); b.item('gold', 62, G - 7, { i: 1 });
  b.add(new UmbrellaCheckpoint(X(66), Y(G), 0));
  b.fill(70, 0, 109, b.L.H - 1, TL.EMPTY); seabed(b, 70, 109, G + 4); sea(b, 70, 109, Y(G) + 16);
  b.fill(109, 0, 109, b.L.H - 1, TL.SOLID);
  b.add(new Boat(X(73), Y(G) + 16, 1));
  return Object.assign({}, W2_DEF, {
    id: '2-dev', name: 'Полигон мира 2', theme: THEME_W2_1, level: b.L, ents: b.ents, decoBack: b.decoBack, decoFront: b.decoFront, fake: b.fake,
    start: { x: X(3), y: Y(G) }, sheep: 1, boatParts: 1, crunch: true
  });
}

// ---------- 2-1 Coconut-shavings beach (teaches water, swapping in water and the crunch) ----------
function buildW2L1() {
  const b = new LB(234, 22), G = 13, H = 22;
  const palm = (c, h, lean) => b.decoBack.push({ k: 'palm', x: X(c), y: Y(G) + 6, h, lean: lean || 0 });
  // A: beach
  b.ground(0, 34, G);
  b.hint(1, 'w21-start', () => `Острова Тутти-Фрутти! В этом мире веду я, Пикль. ${Input.label('move')} — бег, ${Input.label('jump')} — прыжок. Банни рядом: поменяться можно кнопкой ${Input.label('swap')}.`);
  palm(1, 230, 0.1); palm(14, 260, -0.12); palm(27, 210, 0.15);
  b.decoBack.push({ k: 'wreck', x: X(31), y: Y(G) + 10 }, { k: 'shell', x: X(7), y: Y(G) + 4, s: 1.2 }, { k: 'shell', x: X(22), y: Y(G) + 4, s: 0.9, c: '#fff0d0' });
  b.decoFront.push({ k: 'sign', x: X(5), y: Y(G) + 2, text: 'Верфь →' });
  b.drops(5, G - 2, 4, 30);
  b.block(10, G - 4, 'drops'); b.block(11, G - 4, 'helmet'); b.block(12, G - 4, null, { kind: 'brick' });
  b.add(new CrabCaper(X(17), Y(G))); b.add(new CrabCaper(X(25), Y(G), { speed: 72 }));
  b.item('note', 20, G - 1, { id: 'w2-1:a' });
  b.drops(23, G - 5, 5, 20);
  // B: shallows with waves (tide): the higher the water, the higher you leap
  b.hint(31, 'w21-sea', () => `Море! В воде Банни плавает поверху и быстро, а я иду по дну. Поменяться (${Input.label('swap')}) можно даже в воде.`);
  seabed(b, 35, 75, G + 3);
  const shallows = sea(b, 35, 75, Y(G) + 22, { amp: 18, period: 5.5 });
  pillar(b, 47, 50, G - 1); pillar(b, 60, 62, G - 2);
  b.drops(38, G + 2, 6, 0); b.drops(52, G + 2, 5, 0);
  b.plat(53, 56, G - 6); b.item('gold', 54, G - 7, { i: 0 });
  b.hint(46, 'w21-tide', 'Видишь, вода то поднимается, то опускается? Это прилив. Чем выше вода, тем выше можно выпрыгнуть — вон к той доске!');
  b.add(new Anchovy(X(43), Y(G), { dir: 1, delay: 1 })); b.add(new Anchovy(X(67), Y(G), { dir: -1, delay: 2.2 }));
  b.drops(64, G - 5, 4, 0);
  // C: checkpoint, the crunch, barrels and a rind wall
  b.ground(76, 100, G);
  b.add(new UmbrellaCheckpoint(X(78), Y(G), 0));
  palm(80, 240, -0.1); palm(97, 220, 0.12);
  b.add(new AbilityTrigger(X(82), 'crunch'));
  b.add(new Barrel(86, G - 1, 'part', { i: 0 })); b.add(new Barrel(88, G - 1, 'drops'));
  b.hint(85, 'w21-rind', () => `Бочки и корку разбивает только мой Хруст: играя за меня, жми ${Input.label('pickle')}. В одной бочке — часть лодки!`);
  // a sand arch: the tunnel under it is shut with coconut rind
  b.fill(90, G - 8, 95, G - 3, TL.SOLID); b.fill(90, G - 2, 90, G - 1, TL.RIND); b.fill(95, G - 2, 95, G - 1, TL.RIND);
  b.add(new JarKid(X(96), Y(G), 0));
  b.add(new CrabCaper(X(98), Y(G)));
  // D: deep lagoon: diving, air, soda bubbles, a rind pocket under water
  b.hint(99, 'w21-lagoon', 'Лагуна глубокая. Под водой над головой видно, сколько осталось воздуха. Пополнить его можно у поверхности или в пузырьках газировки.');
  seabed(b, 101, 148, G + 6);
  sea(b, 101, 148, Y(G) + 20, { amp: 4, period: 4 });
  b.fill(140, G + 5, 142, G + 5, TL.SOLID); b.fill(143, G + 3, 145, G + 5, TL.SOLID); b.fill(146, G + 1, 148, G + 5, TL.SOLID);
  b.fill(101, G + 1, 102, G + 5, TL.SOLID);
  b.add(new CurrentZone(104 * T, Y(G) + 20, 6 * T, 3 * T, -120, 0));
  for (const c of [110, 128, 138]) b.add(new SodaVent(X(c), Y(G + 6)));
  b.fill(118, G + 3, 123, G + 3, TL.SOLID); b.fill(118, G + 4, 118, G + 5, TL.RIND); b.fill(123, G + 4, 123, G + 5, TL.SOLID);
  b.item('gold', 121, G + 5, { i: 1 }); b.drops(119, G + 5, 2, 0);
  b.item('part', 127, G + 5, { i: 1 });
  b.add(new JarKid(X(133), Y(G + 6), 1));
  b.drops(105, G + 4, 4, 0); b.drops(130, G + 4, 6, 20);
  b.plat(111, 114, G); b.plat(124, 127, G); b.plat(134, 137, G);
  b.add(new Anchovy(X(108), Y(G), { dir: 1, delay: 0.5 })); b.add(new Anchovy(X(131), Y(G), { dir: -1, delay: 1.6 }));
  // E: cliffs over the sea
  b.ground(149, 158, G);
  b.add(new UmbrellaCheckpoint(X(152), Y(G), 1));
  b.item('note', 156, G - 1, { id: 'w2-1:b' });
  b.hint(157, 'w21-cliff', 'Скалы над морем! Анчоусы выпрыгивают из волн — прыгай им на спину или пережди.');
  seabed(b, 159, 192, G + 4); sea(b, 159, 192, Y(G) + 40, { amp: 10, period: 6 });
  pillar(b, 162, 165, G - 2); pillar(b, 169, 171, G - 4); pillar(b, 176, 179, G - 3); pillar(b, 184, 187, G - 4);
  b.add(new CrabCaper(X(178), Y(G - 3), { speed: 45 }));
  b.add(new JarKid(X(177), Y(G - 3), 2));
  b.add(new Barrel(186, G - 5, 'part', { i: 2 }));
  for (const [c, d] of [[167, 1], [174, -1], [182, 1], [190, -1]]) b.add(new Anchovy(X(c), Y(G), { dir: d, power: 760, delay: rnd(0.3, 2) }));
  b.drops(166, G - 7, 3, 20); b.drops(180, G - 7, 4, 20);
  b.block(170, G - 8, 'ice');
  // wall-jump chimney with the third gold cherry
  b.ground(193, 214, G);
  b.fill(196, G - 12, 196, G - 4, TL.SOLID); b.fill(200, G - 12, 200, G - 4, TL.SOLID);
  b.item('gold', 198, G - 13, { i: 2 });
  palm(194, 250, 0.08); palm(210, 230, -0.1);
  // F: shipyard
  b.hint(203, 'w21-dock', 'Верфь! Если все три части лодки у нас — запрыгивай в лодку.');
  b.decoBack.push({ k: 'wreck', x: X(206), y: Y(G) + 10 });
  b.add(new CrabCaper(X(205), Y(G)));
  seabed(b, 215, 232, G + 5); sea(b, 215, 232, Y(G) + 16, { amp: 3, period: 4 });
  b.fill(233, 0, 233, H - 1, TL.SOLID);
  b.add(new Boat(X(217), Y(G) + 16, 3));
  return Object.assign({}, W2_DEF, {
    id: '2-1', name: 'Пляж Кокосовой Стружки', theme: THEME_W2_1, level: b.L, ents: b.ents, decoBack: b.decoBack, decoFront: b.decoFront, fake: b.fake,
    start: { x: X(3), y: Y(G) }, sheep: 3, boatParts: 3
  });
}
// ---------- 2-2 Pineapple jungle (springs, jelly-bean vines, olives, mushrooms, the pirate camp with Pupyrka) ----------
function buildW2L2() {
  const b = new LB(221, 30), G = 24, H = 30, Gc = G - 12; // forest floor and the plateau with the pirate camp
  const deco = (k, c, r, o) => b.decoBack.push(Object.assign({ k, x: X(c), y: Y(r) + 6 }, o || {}));
  // A: the edge of the forest and a hill with rolling olives
  b.ground(0, 23, G);
  b.hint(1, 'w22-start', () => `Ананасовые Джунгли! Где-то здесь пираты держат Пупырку. Ананасы на пружинах подбрасывают высоко — держи ${Input.label('jump')}!`);
  deco('bigpine', 13, G, { s: 0.9 }); deco('fern', 3, G); deco('fern', 21, G, { s: 1.2 }); deco('flower', 6, G - 0.2);
  b.add(new PineSpring(X(9), Y(G))); b.plat(11, 15, G - 7); b.drops(11, G - 8, 5, 0);
  b.add(new Shroom(X(18), Y(G)));
  let top = b.slopeUp(24, G, 4); b.ground(28, 31, top); b.slopeDown(32, top, 4); b.ground(36, 44, G);
  b.add(new OliveSpawner(X(30), Y(top), -1, 3.2));
  b.drops(25, G - 7, 6, 30);
  b.item('note', 38, G - 1, { id: 'w2-2:a' });
  b.block(40, G - 4, 'drops'); b.block(41, G - 4, 'cherry'); b.block(42, G - 4, null, { kind: 'brick' });
  // B: a stream under jelly-bean vines (or along its bottom as Pickle)
  b.hint(43, 'w22-vines', () => `Лианы из мармеладок! Прыгни и хватайся, раскачивайся ${Input.label('move')}, ${Input.label('jump')} — отпустить. А по дну ручья могу пройти я.`);
  seabed(b, 45, 80, G + 3); sea(b, 45, 80, Y(G) + 24, { amp: 3, period: 3 });
  for (const c of [48, 55, 62, 69, 76]) { b.add(new JellyVine(X(c), Y(G - 9), 220)); b.plat(c - 1, c + 1, G - 10); }
  pillar(b, 58, 59, G - 1); b.add(new JarKid(X(58) + 20, Y(G - 1), 0));
  b.plat(64, 66, G - 13); b.item('gold', 65, G - 14, { i: 0 });
  b.drops(50, G + 2, 4, 0); b.drops(70, G + 2, 4, 0); b.drops(51, G - 4, 3, 0); b.drops(72, G - 4, 3, 0);
  // C: the thicket
  b.ground(81, 144, G);
  b.add(new UmbrellaCheckpoint(X(82), Y(G), 0));
  deco('fern', 86, G, { s: 1.3 }); deco('bigpine', 95, G, { s: 1.1 }); deco('flower', 104, G - 0.2); deco('fern', 118, G);
  for (const c of [90, 97, 106]) b.add(new Shroom(X(c), Y(G)));
  b.add(new Olive(X(93), Y(G), -1, { patrol: true })); b.add(new Olive(X(113), Y(G), 1, { patrol: true }));
  b.bricks(99, 99, G - 4); b.block(100, G - 4, 'armor'); b.bricks(101, 101, G - 4);
  b.add(new JarKid(X(103), Y(G), 1));
  b.plat(108, 111, G - 5); b.item('note', 110, G - 6, { id: 'w2-2:b' });
  b.add(new PineSpring(X(115), Y(G))); b.plat(116, 119, G - 8); b.drops(116, G - 9, 4, 0);
  // D: the climb to the camp; a pineapple wall hides a pocket with a cherry
  b.hint(121, 'w22-climb', 'Наверх, к лагерю пиратов! А в ананасовой стене внизу что-то блестит — корку разобью только я.');
  b.plat(124, 127, G - 4); b.add(new PineSpring(X(130), Y(G))); b.plat(132, 135, G - 8); b.plat(138, 140, G - 10);
  b.ground(145, 220, Gc);
  b.fill(146, G - 2, 148, G - 1, TL.EMPTY); b.fill(145, G - 2, 145, G - 1, TL.RIND); b.item('gold', 147, G - 1, { i: 1 });
  b.add(new Olive(X(136), Y(G), -1, { patrol: true, speed: 90 }));
  // E: the plateau: a spring to the sky (third cherry only with the jump held), the camp
  b.add(new JarKid(X(150), Y(Gc), 2));
  b.add(new PineSpring(X(154), Y(Gc)));
  b.item('gold', 154, (Y(Gc) - 437 - 20) / T, { i: 2 }); // reachable only if the jump is held through the bounce (tests/w2.js)
  b.add(new UmbrellaCheckpoint(X(158), Y(Gc), 1));
  b.hint(159, 'w22-camp', 'Это лагерь Уксуса. Вон клетка — там Пупырка!');
  deco('tent', 172, Gc); deco('tent', 182, Gc, { }); deco('fern', 167, Gc);
  const gL = b.add(new PalisadeGate(163, Gc - 8, Gc - 1)), gR = b.add(new PalisadeGate(192, Gc - 8, Gc - 1));
  const cage = b.add(new PupyrkaCage(X(188), Y(Gc), [
    { who: 'pupyrka', text: 'Братик! Пикль! Я знала, что ты придёшь!' },
    { who: 'pickle', text: 'Пупырка! Ты цела? А где остальные?' },
    { who: 'pupyrka', text: 'Уксус увёз их дальше, к Арбузному рифу. А бабушку держит у себя на флагмане…' },
    { who: 'banni', text: 'Тогда в лодку! Пупырка, ты с нами?' },
    { who: 'pupyrka', text: 'Конечно! Я буду смотреть в подзорную трубу!' }
  ]));
  b.add(new CampFight(X(166), { gates: [gL, gR], cage, arena: { x0: 164 * T, x1: 192 * T, floor: Y(Gc) }, waves: [['olive', 'olive'], ['shroom', 'shroom', 'olive'], ['olive', 'shroom', 'olive', 'shroom']] }));
  // F: the cove with the boat
  seabed(b, 201, 219, Gc + 4); sea(b, 201, 219, Y(Gc) + 20, { amp: 3, period: 4 });
  b.fill(220, 0, 220, H - 1, TL.SOLID);
  b.add(new Boat(X(204), Y(Gc) + 20, 0, { cond: G => G.sisterFree, wait: 'Сначала спасём Пупырку из клетки!' }));
  return Object.assign({}, W2_DEF, {
    id: '2-2', name: 'Ананасовые Джунгли', theme: THEME_W2_2, level: b.L, ents: b.ents, decoBack: b.decoBack, decoFront: b.decoFront, fake: b.fake,
    start: { x: X(3), y: Y(G) }, sheep: 3
  });
}
LEVELS['2-dev'] = buildW2Dev;
LEVELS['2-2'] = buildW2L2;
LEVELS['2-1'] = buildW2L1;
