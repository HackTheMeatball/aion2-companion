/* 0.5 P4: sticky level bar on phones. 390 px, Lv 27, scrolled down so the bar shows it stays in reach (format: tests/support/shots.mjs). */
const save = { level: 27, open: {}, hideCards: false };
const scroll = () => window.scrollTo(0, 1400);
export default [
  { name: 'top-basic', mode: 'basic', save, shots: [{}] },
  { name: 'scrolled-basic', mode: 'basic', save, act: scroll, shots: [{}] },
  { name: 'scrolled-advanced', mode: 'advanced', save, act: scroll, shots: [{}] },
];
