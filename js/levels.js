'use strict';
// ================= levels.js : level builders =================
class LB {
  constructor(W, H) { this.L = new Level(W, H); this.ents = []; this.decoBack = []; this.decoFront = []; this.fake = []; }
  fill(c0, r0, c1, r1, t) { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) this.L.set(c, r, t); }
  ground(c0, c1, top, t) { this.fill(c0, top, c1, this.L.H - 1, t || TL.SOLID); }
  pit(c0, c1) { this.fill(c0, 0, c1, this.L.H - 1, TL.EMPTY); }
  slopeUp(c0, top, len, ice) { for (let i = 0; i < len; i++) { this.L.set(c0 + i, top - 1 - i, ice ? TL.SRI : TL.SR); this.fill(c0 + i, top - i, c0 + i, this.L.H - 1, TL.SOLID); } return top - len; }
  slopeDown(c0, top, len, ice) { for (let i = 0; i < len; i++) { this.L.set(c0 + i, top + i, ice ? TL.SLI : TL.SL); this.fill(c0 + i, top + i + 1, c0 + i, this.L.H - 1, TL.SOLID); } return top + len; }
  plat(c0, c1, r, t) { this.fill(c0, r, c1, r, t || TL.ONEWAY); }
  fakeRect(c0, r0, c1, r1) { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) { this.L.set(c, r, TL.FAKE); this.fake.push([c, r]); } }
  add(e) { this.ents.push(e); return e; }
  block(c, r, content, o) { const b = new Block(c, r, content, o); return this.add(b); }
  bricks(c0, c1, r) { for (let c = c0; c <= c1; c++) this.block(c, r, null, { kind: 'brick' }); }
  drop(c, r) { return this.add(new Pickup('drop', c * T + T / 2, r * T + T / 2)); }
  drops(c0, r, n, arc) { for (let i = 0; i < n; i++) { const k = n > 1 ? i / (n - 1) : 0.5; const lift = arc ? Math.sin(k * Math.PI) * arc : 0; this.add(new Pickup('drop', (c0 + i) * T + T / 2, r * T + T / 2 - lift)); } }
  item(kind, c, r, o) { return this.add(new Pickup(kind, c * T + T / 2, r * T + T / 2, o)); }
  hint(c, id, text, o) { this.add(new Hint(c * T, id, text, o)); }
}
const X = c => c * T + T / 2;   // tile column center
const Y = r => r * T;           // top of row

// ---------------- Level 1 : Ice cream mountains ----------------
function buildLevel1() {
  const b = new LB(233, 16), G = 12;
  // A: start
  b.ground(0, 26, G);
  b.hint(2, 'start', () => `Банни, бежим к Крошке! ${Input.label('move')} — бег, ${Input.label('jump')} — прыжок. Держи прыжок дольше — прыгнешь выше!`);
  b.decoBack.push({ k: 'scoop', x: 300, y: Y(G) + 16, r: 110, f: 'pink', cherry: true }, { k: 'wafers', x: 560, y: Y(G) + 4 });
  b.decoFront.push({ k: 'sign', x: X(6), y: Y(G) + 2, text: 'Домик →' });
  b.drops(8, G - 2, 4, 30);
  b.hint(9, 'blocks2', () => `Вафельные блоки с вопросом! Ударь снизу головой — там сюрприз. Не достаёшь до вишенки сверху? Нажми ${Input.label('jump')} ещё раз прямо в воздухе — двойной прыжок! А можно просто стукнуть блок ещё раз.`);
  b.block(12, G - 4, 'drop'); b.block(13, G - 4, null, { kind: 'brick' }); b.block(14, G - 4, 'glaze'); b.block(15, G - 4, null, { kind: 'brick' }); b.block(16, G - 4, 'drops');
  b.ground(18, 21, G - 1);
  b.decoFront.push({ k: 'chiprock', x: X(19), y: Y(G - 1) + 6, s: 1.2 });
  b.hint(19, 'sprout', 'Брюссельки! Прыгай им прямо на макушку — «чпок»!');
  b.add(new Sprout(X(24), Y(G)));
  b.pit(27, 29);
  b.ground(30, 44, G);
  b.drops(27, G - 3, 3, 20);
  b.add(new Sprout(X(36), Y(G))); b.add(new Sprout(X(41), Y(G)));
  b.block(33, G - 4, 'gold', { hidden: true }).idx = 0;
  b.hint(31, 'secret0', 'Хм, над нами что-то блестит… Как бы туда забраться?', {});
  b.decoBack.push({ k: 'scoop', x: X(38), y: Y(G) + 20, r: 80, f: 'mint' }, { k: 'scoop', x: X(43), y: Y(G) + 30, r: 60, f: 'van', cherry: true });
  b.decoFront.push({ k: 'cone', x: X(31), y: Y(G) + 26, rot: Math.PI, s: 0.8 });
  b.hint(37, 'pickle', () => `Кстати, жми ${Input.label('pickle')} — я полечу во врагов, как хрустящий снаряд!`);
  // B: slopes, ice slope, low passage
  let top = b.slopeUp(45, G, 3);
  b.ground(48, 50, top);
  b.add(new PeaJumper(X(49), Y(top)));
  b.drops(46, top - 3, 5, 20);
  b.hint(47, 'slide', () => `Впереди ледяной склон! На бегу жми ${Input.label('down')} — прокатишься на кожуре и собьёшь врагов.`);
  b.slopeDown(51, top, 3, true);
  b.ground(54, 82, G);
  b.fill(57, 2, 62, G - 2, TL.SOLID);
  b.hint(53, 'low', () => `Тут стоя не пролезть — разгонись и жми ${Input.label('down')}!`);
  b.drops(57, G - 1, 6, 0);
  b.add(new Cage(X(66), Y(G), 0));
  b.add(new Sprout(X(69), Y(G)));
  b.add(new Broccoli(X(72), Y(G)));
  b.hint(70, 'brocc', 'Осторожно, брокколи прячется в кустах! Жди, пока выскочит, — и на макушку.');
  b.ground(75, 77, G - 1);
  b.add(new PeaJumper(X(76), Y(G - 1)));
  b.add(new Checkpoint(X(80), Y(G), 0));
  b.decoBack.push({ k: 'scoop', x: X(64), y: Y(G) + 20, r: 95, f: 'van', cherry: true }, { k: 'wafers', x: X(73), y: Y(G) + 4 });
  // C: melting platforms over the milkshake lake
  b.pit(83, 99);
  b.hint(81, 'melt', 'Платформы из пломбира тают, если на них стоять! Прыгай с одной на другую, не задерживайся.');
  const mp = [[3413, G - 2], [3706, G - 3]];
  for (const [x, r] of mp) { b.add(new MeltPlat(x, Y(r), 200)); for (let i = 0; i < 4; i++) b.add(new Pickup('drop', x + 25 + i * 50, Y(r - 2) + 20)); }
  b.block(88, G - 7, 'ice');
  // D: wafer bridge
  b.ground(100, 104, G);
  b.hint(101, 'bridge', 'Вафельный мостик хрупкий — беги и не останавливайся!');
  b.pit(105, 114);
  for (let c = 105; c <= 114; c++) b.add(new WaferPiece(c * T, Y(G)));
  b.drops(106, G - 2, 8, 30);
  b.ground(115, 125, G);
  b.block(116, G - 4, null, { kind: 'brick' }); b.block(117, G - 4, 'cherry'); b.block(118, G - 4, null, { kind: 'brick' });
  b.add(new Sprout(X(120), Y(G))); b.add(new Sprout(X(122), Y(G), { speed: 60 })); b.add(new PeaJumper(X(124), Y(G)));
  b.decoFront.push({ k: 'cone', x: X(119), y: Y(G) + 28, rot: Math.PI, s: 0.9 });
  // E: avalanche hill
  b.hint(125, 'aval', 'Лавина из шариков мороженого! Перепрыгивай их — или сбивай подкатом.');
  top = b.slopeUp(126, G, 5);
  b.ground(131, 136, top);
  b.add(new BallSpawner(X(136), Y(top), -1, 2.4));
  b.item('note', 133, top - 1, { id: 'l1b' });
  b.block(134, top - 4, 'star');
  b.slopeDown(137, top, 5);
  b.decoBack.push({ k: 'scoop', x: X(133), y: Y(top) + 30, r: 120, f: 'pink', cherry: true });
  // F: the iceberg with a secret cave
  b.ground(142, 170, G);
  b.fill(148, G - 6, 156, G - 1, TL.SOLID);
  b.fill(148, G - 6, 156, G - 6, TL.ICE);
  b.fakeRect(149, G - 3, 155, G - 1);
  b.fakeRect(148, G - 2, 148, G - 1);
  b.plat(145, 146, G - 3);
  b.hint(143, 'iceberg', 'Брр, чувствуешь холодок? Кажется, этот айсберг пустой внутри…');
  b.item('ice', 150, G - 1); b.item('note', 153, G - 2, { id: 'l1a' }); b.item('gold', 155, G - 2, { i: 1 });
  b.drops(150, G - 8, 5, 10);
  b.add(new Sprout(X(153), Y(G - 6)));
  b.block(160, G - 4, 'mint');
  b.add(new Sprout(X(163), Y(G)));
  // G: planks to the sky + checkpoint
  b.pit(166, 168);
  b.ground(169, 230, G);
  b.add(new Broccoli(X(173), Y(G)));
  b.add(new Sprout(X(177), Y(G))); b.add(new Sprout(X(180), Y(G)));
  b.plat(170, 171, G - 3); b.plat(173, 174, G - 6); b.plat(176, 177, G - 9);
  b.drops(173, G - 7, 2, 0); b.drops(176, G - 10, 2, 0);
  b.item('gold', 177, G - 11, { i: 2 });
  b.add(new Cage(X(183), Y(G), 1));
  b.add(new Checkpoint(X(187), Y(G), 1));
  b.decoBack.push({ k: 'scoop', x: X(175), y: Y(G) + 20, r: 100, f: 'mint', cherry: true }, { k: 'scoop', x: X(186), y: Y(G) + 30, r: 70, f: 'pink' });
  // H: before the boss
  b.hint(192, 'bosstip', 'Впереди Капитан Кочан! Жди, пока он врежется в стену и закружится, — тогда прыгай ему на макушку.');
  b.block(195, G - 4, 'ice'); b.block(197, G - 4, 'glaze');
  b.drops(199, G - 2, 4, 20);
  b.decoFront.push({ k: 'sign', x: X(202), y: Y(G) + 2, text: 'Кочан!' });
  // arena
  b.fill(231, 0, 232, 15, TL.SOLID);
  const gate = b.add(new Gate(206, 0, G - 1));
  b.add(new BossTrigger(209 * T));
  for (let i = 0; i < 7; i++) { b.decoBack.push({ k: 'ball', x: X(207) + 4, y: Y(G) - 30 - i * 62, r: 38, f: ['pink', 'mint', 'van'][i % 3] }); b.decoBack.push({ k: 'ball', x: X(230) - 4, y: Y(G) - 30 - i * 62, r: 38, f: ['van', 'pink', 'mint'][i % 3] }); }
  const arena = { x0: 207 * T, x1: 231 * T, floor: Y(G), top: Y(G) - 400, camMin: 206 * T, camMax: 232 * T };
  const boss = new CaptainCabbage(arena);
  b.add(boss);
  return {
    id: 1, name: 'Мороженые Горы', theme: THEME1, level: b.L, ents: b.ents, decoBack: b.decoBack, decoFront: b.decoFront, fake: b.fake,
    start: { x: X(3), y: Y(G) }, arena, gates: [gate], boss, sheep: 2, musicRate: 1.0, bossRate: 1.1,
    exit: { x: (arena.x0 + arena.x1) / 2, y: Y(G) }
  };
}

// ---------------- Level 2 : Cotton candy forest ----------------
function buildLevel2() {
  const b = new LB(218, 20), G = 16;
  const crown = (c0, c1, r, trunk) => { b.plat(c0, c1, r, TL.CROWN); if (trunk !== false) b.decoBack.push({ k: 'trunk', x: (c0 + c1 + 1) * T / 2, y: Y(G) + 4, h: Y(G) - Y(r) - 6, w: 26 }); };
  // A: start
  b.ground(0, 30, G);
  b.hint(2, 'start2', 'Лес Сахарной Ваты! Кроны деревьев пружинят — прыгай на них, а если держать прыжок, подлетишь выше.');
  crown(9, 11, G - 3);
  b.drops(9, G - 7, 3, 0);
  b.block(14, G - 4, 'parachute');
  crown(16, 18, G - 5);
  b.plat(20, 23, G - 9);
  b.decoBack.push({ k: 'trunk', x: X(21.5), y: Y(G) + 4, h: Y(G) - Y(G - 9) + 2, w: 30 });
  b.item('note', 22, G - 10, { id: 'l2a' });
  b.drops(19, G - 12, 4, 20);
  b.add(new Bat(X(25), Y(G - 4)));
  b.hint(22, 'bat', 'Луковые мыши! Если заденут — будут слёзы, всё поплывёт. Прыгай им на макушку.');
  b.add(new Cage(X(27), Y(G), 0));
  b.add(new Slug(X(29), Y(G)));
  b.decoFront.push({ k: 'mush', x: X(5), y: Y(G) + 2, s: 1.2 }, { k: 'lolly', x: X(13), y: Y(G) + 4, s: 0.9 }, { k: 'mush', x: X(24), y: Y(G) + 2 });
  // B: licorice vines over the dark hollow
  b.pit(31, 52);
  b.hint(28, 'vines', () => `Лакричные лианы! Запрыгни на лиану, раскачивайся ${Input.label('move')}, а ${Input.label('jump')} — прыжок дальше.`);
  const vine = (c, ay, len) => { b.add(new Vine(X(c), ay, len)); b.decoBack.push({ k: 'trunk', x: X(c) + 70, y: Y(G) + 200, h: Y(G) + 200 - ay + 40, w: 30, bx: X(c), by: ay }); };
  vine(34, Y(G - 9), 170); vine(40, Y(G - 9) - 20, 185); vine(46, Y(G - 9) - 20, 185);
  b.plat(38, 39, G + 2, TL.CROWN); b.plat(43, 44, G + 2, TL.CROWN); b.plat(49, 50, G + 2, TL.CROWN);
  b.drops(36, G - 5, 3, 20); b.drops(42, G - 5, 3, 20); b.drops(48, G - 5, 3, 20);
  // C: thorns, moles
  b.ground(53, 95, G);
  b.fill(58, G - 1, 63, G - 1, TL.THORN);
  crown(56, 57, G - 3); crown(62, 64, G - 4);
  b.hint(54, 'thorns', 'Колючие ежевичные кусты! Не наступай — обходи поверху, по кронам.');
  b.drops(59, G - 8, 4, 30);
  b.add(new Mole(X(68), Y(G))); b.add(new Mole(X(73), Y(G)));
  b.hint(66, 'mole', 'Кроты-редиски! Подожди, пока выпрыгнет, — и прыгай сверху.');
  b.block(70, G - 4, 'ice');
  b.add(new Checkpoint(X(77), Y(G), 0));
  // D: caramel and sticky clouds
  crown(81, 83, G - 8, false);
  b.add(new Dripper(X(82), Y(G - 8) + 30, 2.4));
  b.fill(84, G - 4, 88, G - 3, TL.SOLID);
  b.item('gold', 87, G - 5, { i: 0 }); b.drops(84, G - 5, 3, 0); b.drops(85, G - 1, 3, 0);
  b.hint(79, 'caramel', 'Горячая карамель капает! Не стой под каплями. Зато застывшая капля станет ступенькой — на уступ без неё не залезть.');
  b.pit(92, 104);
  b.plat(93, 97, G - 1, TL.CLOUD); b.plat(100, 103, G - 2, TL.CLOUD);
  b.hint(90, 'sticky', 'Липкая вата! На ней бег медленный, а прыжок ниже — не зевай.');
  b.drops(94, G - 3, 3, 0); b.drops(100, G - 4, 4, 0);
  b.add(new Bat(X(102), Y(G - 7)));
  // E: hill, canopy route, hollow cake stump
  b.ground(105, 150, G);
  b.add(new Slug(X(110), Y(G)));
  let top = b.slopeUp(114, G, 3);
  b.ground(117, 121, top);
  b.add(new Slug(X(119), Y(top)));
  b.slopeDown(122, top, 3);
  b.hint(108, 'slug', 'Шпинатный слизень оставляет скользкий след — на нём легко укатиться!');
  crown(128, 130, G - 3); crown(133, 135, G - 7); crown(138, 141, G - 11);
  b.add(new Cage(X(140), Y(G - 11), 1));
  b.item('gold', 139, G - 14, { i: 2 }); b.item('note', 141, G - 13, { id: 'l2b' });
  b.drops(133, G - 9, 3, 0);
  b.add(new Mole(X(132), Y(G))); b.add(new Mole(X(137), Y(G)));
  b.fill(143, G - 8, 147, G - 1, TL.SOLID);
  b.fakeRect(144, G - 4, 146, G - 1); b.fakeRect(143, G - 2, 143, G - 1);
  b.item('gold', 146, G - 2, { i: 1 }); b.item('ice', 145, G - 1);
  b.hint(141, 'stump', 'Этот огромный кекс-пень как-то пусто звучит… Может, внутри что-то есть?');
  crown(141, 142, G - 3, false);
  b.drops(144, G - 10, 3, 10);
  b.add(new Checkpoint(X(151), Y(G), 1));
  // F: final gauntlet
  b.ground(150, 159, G);
  b.block(154, G - 4, 'glaze'); b.block(156, G - 4, 'ice');
  b.add(new Cage(X(158), Y(G), 2));
  b.pit(160, 170);
  vine(162, Y(G - 9), 175); vine(167, Y(G - 9), 175);
  b.plat(164, 165, G + 2, TL.CROWN);
  b.ground(171, 212, G);
  b.add(new Bat(X(175), Y(G - 5))); b.add(new Bat(X(181), Y(G - 6)));
  crown(177, 179, G - 9, false);
  b.add(new Dripper(X(178), Y(G - 9) + 30, 2.0, 1.0));
  b.add(new Mole(X(183), Y(G)));
  b.hint(184, 'bosstip2', 'Там Луковый Дух! Прыгай ему на голову — с каждым ударом он теряет слой. Кроны помогут подлететь повыше.');
  b.decoFront.push({ k: 'mush', x: X(173), y: Y(G) + 2, s: 1.1 }, { k: 'lolly', x: X(185), y: Y(G) + 4 });
  // arena
  const g1 = b.add(new Gate(187, 0, G - 1));
  b.add(new BossTrigger(190 * T));
  crown(191, 193, G - 3); crown(206, 208, G - 3);
  b.plat(198, 201, G - 6);
  b.decoBack.push({ k: 'trunk', x: X(199.5), y: Y(G) + 4, h: Y(G) - Y(G - 6) + 2, w: 30 });
  const g2 = b.add(new Gate(212, 0, G - 1)); g2.closed = true; g2.solid = 'full'; g2.k = 1;
  // wall-jump shaft
  b.fill(213, 0, 213, G - 3, TL.SOLID);
  b.fill(216, 0, 217, G + 3, TL.SOLID);
  b.ground(212, 215, G);
  b.plat(214, 215, 4);
  const arena = { x0: 188 * T, x1: 212 * T, floor: Y(G), top: Y(G) - 420, camMin: 187 * T, camMax: 213 * T };
  const boss = new OnionGhost(arena);
  b.add(boss);
  return {
    id: 2, name: 'Лес Сахарной Ваты', theme: THEME2, level: b.L, ents: b.ents, decoBack: b.decoBack, decoFront: b.decoFront, fake: b.fake,
    start: { x: X(3), y: Y(G) }, arena, gates: [g1], exitGate: g2, boss, sheep: 3, musicRate: 0.96, bossRate: 1.08,
    exit: { x: 215 * T, y: Y(4) }, wallJumpAfter: true
  };
}
const LEVELS = { 1: buildLevel1, 2: buildLevel2 };
const LEVEL_INFO = [
  { id: 1, name: 'Мороженые Горы', thumb: 'assets/thumb1.jpg' },
  { id: 2, name: 'Лес Сахарной Ваты', thumb: 'assets/thumb2.jpg' },
  { id: 3, name: 'Карамельные Небеса' },
  { id: 4, name: 'Шоколадная Река' },
  { id: 5, name: 'Цитадель Жаркого' }
];
const NOTES = {
  l1a: 'Банни! Если ты читаешь это, значит, Горький Ветер унёс тебя далеко-далеко. Не грусти: я жду вас с Пиклем в Вафельном Домике. Шарики для праздника держу в морозилке. Только не тай! — Крошка',
  l1b: 'Говорят, Барон Брюссель сидит в своей Кухне-Цитадели и варит Котёл Горечи. Он хочет «пересолить» весь мир, чтобы никто больше не ел сладкого. Но пока у нас есть друзья — сладкое не кончится! — К.',
  l2a: 'Лес Сахарной Ваты! В детстве я каталась тут на лакричных лианах. Держись крепче — и слушай Пикля, он всегда знает, куда прыгать. — Крошка',
  l2b: 'Знаешь, луковые мыши совсем не злые. Им просто очень грустно, вот они и заставляют всех плакать. Может, их просто никто никогда не звал на праздник? — К.',
  end: 'Вы прошли Лес! Капитан Безе обещал довезти вас на своём шаре до самых Карамельных Небес. А я уже испекла печенье с вашими именами. До встречи! — Крошка'
};
