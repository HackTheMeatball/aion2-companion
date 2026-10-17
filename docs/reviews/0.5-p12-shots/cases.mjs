/* 0.5 P12 (#204): Next up's side-content picks by where the player last ticked something (placeRank). Three golden `loc`
   states (tests/golden/states.js, dated change times), Advanced, at 1500 px: the cards the change moves (the Sealed
   Dungeon pick, the stronghold pick, the regional quest list). The saves come from the golden generator itself, so each
   shot is exactly the recorded state. */
import { createRequire } from 'node:module';
import { coreBundle } from '../../../tests/support/core-bundle.mjs';
import { catalogOf } from '../../../tests/invariant/states.mjs';

const require = createRequire(import.meta.url);
const { generate } = require('../../../tests/golden/states.js');
const { parseStored } = require('../../../tests/support/save.js');
const M = await coreBundle(), states = new Map(generate(catalogOf(M)).map(s => [s.id, s.raw]));
const save = id => { const raw = states.get(id); if (!raw) throw new Error(`cases: no golden state ${id}`); return parseStored(raw); };
const sd = { sel: '.ns-card', text: 'Wisdom Stones each', suffix: '-dungeon' }, sh = { sel: '.ns-card', text: 'strongholds', suffix: '-stronghold' };
const rq = { sel: '.ns-card', text: 'Regional quests', suffix: '-regional' }, wide = { width: 1500, height: 1000 };

export default [
  /* Lv 15, a regional quest just turned in at Dredgion Crash Site: the Sealed Dungeon pick is the nearest of the band */
  { name: '1-l15-rq-dredgion-crash-site', mode: 'advanced', ...wide, save: save('loc/L15-q20-before-A-rq-dredgion-crash-site'), shots: [sd] },
  /* Lv 30, a regional quest just picked up in Uruthumheim: the regional list nearest first, and the Sealed Dungeon pick */
  { name: '2-l30-pick-uruthumheim', mode: 'advanced', ...wide, save: save('loc/L30-q48-before-A-pick-uruthumheim'), shots: [rq, sd] },
  /* Lv 40, a regional quest just turned in at Western Gribade Highland: the Sealed Dungeon and stronghold picks */
  { name: '3-l40-rq-western-gribade-highland', mode: 'advanced', ...wide, save: save('loc/L40-q74-before-A-rq-western-gribade-highland'), shots: [sd, sh] },
];
