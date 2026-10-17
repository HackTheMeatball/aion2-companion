/* 0.5 P5: bottom tab bar and the Build sheet on phones. 390 px, Lv 27 (format: tests/support/shots.mjs). Before: the narrow side tab. */
const save = { level: 27, open: {}, hideCards: false };
const openBuild = () => new Promise(r => { (document.getElementById('tabBuild') || document.getElementById('sdTab')).click(); setTimeout(r, 600); });
export default [
  { name: 'top-basic', mode: 'basic', save, shots: [{}] },
  { name: 'build-sheet', mode: 'basic', save, act: openBuild, shots: [{}] },
];
