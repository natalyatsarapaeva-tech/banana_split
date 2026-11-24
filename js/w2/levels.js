'use strict';
// ================= w2/levels.js : World 2 «Фруктовый Архипелаг» =================
// Order follows the concept (docs/CONCEPT.md, 6B). Node coordinates match assets/w2/map.jpg (1376×768),
// whose captions are part of the art, so no label pills are drawn. Levels marked `soon` are not built yet.
const W2_LEVELS = [
  { id: '2-1', num: '2-1', name: 'Пляж Кокосовой Стружки', node: [235, 250], sheep: 3, notes: 'w2-1:', soon: true },
  { id: '2-2', num: '2-2', name: 'Ананасовые Джунгли', node: [545, 215], sheep: 3, notes: 'w2-2:', soon: true },
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
  id: 2, name: 'Фруктовый Архипелаг', map: 'map2', mapSrc: 'assets/w2/map.jpg', mapBg: ['#2fb5c4', '#7fe0d0'], cursor: 'boat',
  levels: W2_LEVELS,
  unlocked: () => !!Save.data.done[5],
  finished: () => !!Save.data.done['2-10']
}, LINEAR));
