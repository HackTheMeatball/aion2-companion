/* 0.5 P3: Next up on phones. The Next up card at 390 px, Lv 27 (the owner's save, tests/fixtures/fixture-user-v285.flat.json),
   Basic and Advanced; Advanced also after one tap on the pager's "Next card" (format: tests/support/shots.mjs). */
import { createRequire } from 'node:module';
const { flatFixture } = createRequire(import.meta.url)('../../../tests/support/save.js');
const user = flatFixture('fixture-user-v285.flat.json'), save = mode => ({ ...user, open: {}, hideCards: false, mode });
const next = () => { const b = document.querySelector('#nowStar [data-nspg="1"]'); if (b) b.click(); };
export default [
  { name: 'nextup-basic', mode: 'basic', save: save('basic'), shots: [{ sel: '#nowStar' }] },
  { name: 'nextup-advanced', mode: 'advanced', save: save('advanced'), shots: [{ sel: '#nowStar' }] },
  { name: 'nextup-advanced-card2', mode: 'advanced', save: save('advanced'), act: next, afterOnly: true, shots: [{ sel: '#nowStar' }] },
  /* the pager on the dungeon card (its "i" ends the subline) and on the story card (its objectives) */
  { name: 'nextup-advanced-dungeon', mode: 'advanced', save: save('advanced'), afterOnly: true, shots: [{ sel: '#nowStar' }],
    act: () => { for (let i = 0; i < 9 && !/Clear /.test(document.querySelector('#nowStar .ns-card.first h3').textContent); i++) document.querySelector('#nowStar [data-nspg="1"]').click(); } },
  { name: 'nextup-advanced-regional', mode: 'advanced', save: save('advanced'), afterOnly: true, shots: [{ sel: '#nowStar' }],
    act: () => { for (let i = 0; i < 9 && !/^Regional/.test(document.querySelector('#nowStar .ns-card.first h3').textContent); i++) document.querySelector('#nowStar [data-nspg="1"]').click(); } },
  { name: 'nextup-advanced-story', mode: 'advanced', save: save('advanced'), afterOnly: true, shots: [{ sel: '#nowStar' }],
    act: () => { for (let i = 0; i < 9 && !/^Story/.test(document.querySelector('#nowStar .ns-card.first h3').textContent); i++) document.querySelector('#nowStar [data-nspg="1"]').click(); } },
];
