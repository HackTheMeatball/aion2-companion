/* 0.5 P7 (#199): page zoom. At 195 px (a 390 px phone at 200 % zoom) the card headers, the milestone step summary and the
   Milestones tools used to run past their cards or wrap badly; below 300 px they now wrap inside the card. Lv 27 user
   fixture, Basic and Advanced: the Milestones header and a step summary, Dungeons & Strongholds, the Daevanion card. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { flatFixture } = require('../../../tests/support/save.js');
const save = flatFixture('fixture-user-v285.flat.json');
const narrow = { width: 195, height: 844, save };
const shots = [
  { sel: '.sec', text: 'Milestones', suffix: '-milestones-header' },
  { sel: 'details.step', suffix: '-milestones-step' },
  { sel: '#areas', suffix: '-areas' },
  { sel: '#dvBox', suffix: '-daevanion' },
];

export default [
  { name: 'zoom195-basic', mode: 'basic', ...narrow, shots },
  { name: 'zoom195-advanced', mode: 'advanced', ...narrow, shots },
];
