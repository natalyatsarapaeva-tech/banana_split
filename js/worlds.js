'use strict';
// ================= worlds.js : registry of worlds and their maps =================
// Each level has a unique id used everywhere (LEVELS, Save.data.done / cherries / sheep, G.levelId).
// World 1 keeps its original numeric ids 1..6 so old saves load unchanged; later worlds use '2-1', '2-2', …
// Level info fields: id, name, thumb, node [x, y] on the 1376×768 map, label [x, y] (pill drawn by code; omit when
// the map art has its own captions), sheep (rescuable NPCs), notes (prefix of NOTES keys), bonus, soon (not built yet).
const WORLDS = [];
function addWorld(w) { WORLDS.push(w); return w; }

addWorld({
  id: 1, name: 'Сплит-мир', map: 'map', mapSrc: 'assets/map.jpg', titlePill: 'Сплит-мир', cursor: 'balloon',
  levels: LEVEL_INFO,
  unlocked: () => true,
  levelUnlocked(info) {
    if (info.id === 6) return worldCherries(this) >= 15 || !!Save.data.done[5];
    return info.id <= Save.data.unlocked;
  },
  nextAfter(info) { return Math.min(5, this.levels.indexOf(info) + 1); },
  defaultSel() { return clamp(Math.min(Save.data.unlocked, 5) - 1, 0, 4); },
  finished: () => !!Save.data.done[5]
});
LEVEL_INFO.forEach((info, i) => { info.num = String(info.id); info.sheep = [2, 3, 2, 2, 2, 0][i]; info.notes = 'l' + info.id; });

// generic rules for worlds after the first: a level opens when the previous one is done
const LINEAR = {
  levelUnlocked(info) {
    if (!this.unlocked() || info.soon) return false;
    const i = this.levels.indexOf(info);
    return i === 0 || !!Save.data.done[this.levels[i - 1].id];
  },
  nextAfter(info) {
    const i = this.levels.indexOf(info);
    return Math.min(this.levels.length - 1, i + 1);
  },
  defaultSel() {
    const i = this.levels.findIndex(l => !Save.data.done[l.id] && this.levelUnlocked(l));
    if (i >= 0) return i;
    let last = 0; this.levels.forEach((l, k) => { if (this.levelUnlocked(l)) last = k; }); return last;
  }
};

function worldCherries(w) { let n = 0; for (const l of w.levels) if (!l.bonus) n += (Save.data.cherries[l.id] || []).reduce((a, b) => a + b, 0); return n; }
function worldOfLevel(id) { return WORLDS.find(w => w.levels.some(l => l.id === id)) || WORLDS[0]; }
function levelInfo(id) { return worldOfLevel(id).levels.find(l => l.id === id); }
function levelIds() { return WORLDS.flatMap(w => w.levels.filter(l => LEVELS[l.id]).map(l => l.id)); }
