/* Shared paths and URLs for the test suites. tests/run.mjs starts scripts/serve.mjs and sets AION_BASE.
   The page under test is dist/ served over http (same origin as the baselines, so they share localStorage the
   way file:// pages did when these suites were written against single files). */
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BASE = (process.env.AION_BASE || 'http://127.0.0.1:8080').replace(/\/$/, '');
module.exports = {
  ROOT, BASE,
  CUR: BASE + '/',                                /* dist/index.html */
  V285: BASE + '/__baselines/v285.html',          /* tests/baselines/v285.html: migration baseline (v285, before the polish passes) */
  V287: BASE + '/__baselines/v287.html',          /* tests/baselines/v287.html: pre-E2 baseline for e2-migtest */
  PAGE: path.join(ROOT, 'dist', 'index.html'),    /* built page source, for static text checks */
  GEN_BLOCK: path.join(ROOT, 'tools', 'gen', 'gen-block.js'),
  GEN_MODULE: path.join(ROOT, 'src', 'data', 'generated.js'), /* the block as an ES module (tools/gen/apply.py) */
  FIX: path.join(ROOT, 'tests', 'fixtures'),
  OUT: path.join(ROOT, 'tests', 'out'),           /* results, logs, screenshots (git-ignored) */
};
