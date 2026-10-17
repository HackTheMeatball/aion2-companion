/* 0.5 P6: long cards folded by default on phones. 390 px, Lv 27, a save with no fold_* key: Progress folded in Basic,
   Dungeons & Strongholds folded in both modes (format: tests/support/shots.mjs). */
const save = { level: 27, open: {}, hideCards: false };
export default [
  { name: 'progress-basic', mode: 'basic', save, shots: [{ sel: '.card:has(.progress-row)' }] },
  { name: 'areas-basic', mode: 'basic', save, shots: [{ sel: '#areas' }] },
  { name: 'areas-advanced', mode: 'advanced', save, shots: [{ sel: '#areas' }] },
];
