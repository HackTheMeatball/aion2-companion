/* 0.5 P14 (#206): level band labels on Next up (bandLabels; trackFilter changes no state with today's route labels and
   its toggle stays hidden). Advanced, two golden `behind` states (tests/golden/states.js, saves from the generator
   itself, so each shot is exactly the recorded state): the whole card at 1500 px, and on a phone (390 px) where the
   later cards are compact rows, so a band label sits on a non-first card. */
import { createRequire } from 'node:module';
import { coreBundle } from '../../../tests/support/core-bundle.mjs';
import { catalogOf } from '../../../tests/invariant/states.mjs';

const require = createRequire(import.meta.url);
const { generate } = require('../../../tests/golden/states.js');
const { parseStored } = require('../../../tests/support/save.js');
const M = await coreBundle(), states = new Map(generate(catalogOf(M)).map(s => [s.id, s.raw]));
const save = id => { const raw = states.get(id); if (!raw) throw new Error(`cases: no golden state ${id}`); return parseStored(raw); };
/* the desktop stack scrolls one card at a time (its height set by script): unrolled by a style rule, both builds alike, so
   the shot holds every card */
const unroll = () => { const s = document.createElement('style'); s.textContent = '#nowStar .ns-stack { height: auto !important; overflow: visible !important; mask-image: none !important; -webkit-mask-image: none !important; transition: none !important; }'; document.head.append(s); };
/* the phone's bottom tab bar is fixed, so an element shot taller than the screen would show it over a row: hidden */
const notabs = () => { const s = document.createElement('style'); s.textContent = '#tabBar { display: none !important; }'; document.head.append(s); };
const nu = [{ sel: '#nowStar' }], wide = { width: 1500, height: 1000, act: unroll };

export default [
  /* Lv 15, ticks kept up to Lv 10: the missed steps under "Missed · Lv 10–14", then the current band */
  { name: '1-l15-missed-band', mode: 'advanced', ...wide, save: save('behind/L15-q20-from10-lagq-A'), shots: nu },
  /* Lv 20, two missed steps and a Later card: a label at each band change */
  { name: '2-l20-bands', mode: 'advanced', ...wide, save: save('behind/L20-q28-from10-miss2-s0-A'), shots: nu },
  /* the Lv 15 state on a phone: the compact rows below the featured card carry their band label */
  { name: '3-l15-phone', mode: 'advanced', act: notabs, save: save('behind/L15-q20-from10-lagq-A'), shots: nu },
];
