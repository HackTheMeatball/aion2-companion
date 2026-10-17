/* 0.5 P7 (#199): page zoom. At 195 px (a 390 px phone at 200 % zoom) the card headers, the milestone step summary, the
   Milestones tools and the Dungeons region headers / rows used to run past their cards (the region names spilled out to
   the left, map pins sat on long dungeon names, sub-lines were cut off); below 300 px they now wrap inside the card.
   Lv 27 user fixture, Advanced only (Basic gave byte-identical shots of these cards; the Route card step is Advanced-only).
   For the capture only, act hides the sticky level bar and keeps the Dungeons card to its header and first eight rows,
   so the element fits the viewport and nothing is pasted over it. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { flatFixture } = require('../../../tests/support/save.js');
const save = flatFixture('fixture-user-v285.flat.json');
const act = () => {
  document.querySelectorAll('.lvlbar').forEach(x => { x.style.visibility = 'hidden'; });
  document.querySelectorAll('#areaList > li').forEach((x, i) => { if (i >= 8) x.style.display = 'none'; });
};

export default [
  { name: 'zoom195-advanced', mode: 'advanced', width: 195, height: 844, save, act, shots: [
    { sel: '.sec', text: 'Milestones', suffix: '-milestones-header' },
    { sel: 'details.step', suffix: '-milestones-step' },
    { sel: '#routeCard details.step', suffix: '-route-step' },
    { sel: '#areas', suffix: '-areas' },
    { sel: '#dvBox', suffix: '-daevanion' },
  ] },
];
