/* 0.5 P13 (#205): catch-up (catchUp) and the Later cards by when they open (etaLater). The whole Next up card at 1500 px,
   Advanced: two golden `behind` states (tests/golden/states.js, saves from the generator itself, so each shot is exactly
   the recorded state) and the core test's two-kinds-of-points save (tests/core/nextup.test.mjs behindAt(25, { shards })). */
import { createRequire } from 'node:module';
import { coreBundle } from '../../../tests/support/core-bundle.mjs';
import { catalogOf } from '../../../tests/invariant/states.mjs';

const require = createRequire(import.meta.url);
const { generate } = require('../../../tests/golden/states.js');
const { parseStored } = require('../../../tests/support/save.js');
const M = await coreBundle(), states = new Map(generate(catalogOf(M)).map(s => [s.id, s.raw]));
const save = id => { const raw = states.get(id); if (!raw) throw new Error(`cases: no golden state ${id}`); return parseStored(raw); };
/* Lv 25 on the story, every milestone row below 25 ticked but the skill buys, 99 stigma shards */
const points = (L => ({ checks: Object.fromEntries(M.GATES.filter(g => g.lv < L).flatMap(g => g.items.filter(it => it.k && !/^sp:/.test(it.k))).map(it => [it.k, true])),
  level: L, quest: M.QUESTS.find(([l]) => l >= L)[1], stShards: 99, open: {}, mode: 'advanced' }))(25);
/* the desktop stack scrolls one card at a time (its height set by script): unrolled by a style rule, both builds alike, so
   the shot holds every card */
const unroll = () => { const s = document.createElement('style'); s.textContent = '#nowStar .ns-stack { height: auto !important; overflow: visible !important; mask-image: none !important; -webkit-mask-image: none !important; transition: none !important; }'; document.head.append(s); };
const nu = [{ sel: '#nowStar' }], wide = { width: 1500, height: 1000, act: unroll };

export default [
  /* Lv 15, ticks kept up to Lv 10, the story at Lv 15: four missed steps, all shown (was 2) */
  { name: '1-l15-missed-steps', mode: 'advanced', ...wide, save: save('behind/L15-q20-from10-lagq-A'), shots: nu },
  /* Lv 20, two missed steps: the Later card names the step that opens first (the Ascension quest, after its story quest) */
  { name: '2-l20-later-step', mode: 'advanced', ...wide, save: save('behind/L20-q28-from10-miss2-s0-A'), shots: nu },
  /* Lv 25, skill points and a stigma upgrade to spend: every skill upgrade the points cover (was 4) */
  { name: '3-l25-points', mode: 'advanced', ...wide, save: points, shots: nu },
];
