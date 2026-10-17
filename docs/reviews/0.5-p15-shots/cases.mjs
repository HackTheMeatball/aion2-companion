/* 0.5 P15 (#207): the one-time "Bind X" row on the story card (bindDerived, bindNudge). Golden states (tests/golden/
   states.js; the saves from the generator itself, so each shot is exactly the recorded state) at Lv 11 on "Crash Site
   Rendezvous", kept up, where the story card is the first card: its turn-in (Ulgorn) is 49 m from Galorik's Inspection
   Area, inside (25, 150] m, and nothing in the save binds it (design §8.4's Galorik's case). Basic (-B) and Advanced (-A)
   at 1500 px (S1 D1, D3) and 390 px (S1 M2). */
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
const card = [{ sel: '#nowStar .ns-card.first' }], wide = { width: 1500, height: 1000, act: unroll };
const A = 'story/L11-q13-before-A', B = 'story/L11-q13-before-B';

export default [
  { name: '1-d1500-basic', mode: 'basic', ...wide, save: save(B), shots: card },
  { name: '2-d1500-advanced', mode: 'advanced', ...wide, save: save(A), shots: card },
  { name: '3-m390-basic', mode: 'basic', act: notabs, save: save(B), shots: card },
  { name: '4-m390-advanced', mode: 'advanced', act: notabs, save: save(A), shots: card },
];
