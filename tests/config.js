/* Shared paths and URLs for the test suites. tests/run.mjs starts scripts/serve.mjs and sets AION_BASE.
   The page under test is dist/ served over http. */
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BASE = (process.env.AION_BASE || 'http://127.0.0.1:8080').replace(/\/$/, '');
module.exports = {
  ROOT, BASE,
  CUR: BASE + '/',                                /* dist/index.html */
  PAGE: path.join(ROOT, 'dist', 'index.html'),    /* built page source, for static text checks */
  FIX: path.join(ROOT, 'tests', 'fixtures'),
  OUT: path.join(ROOT, 'tests', 'out'),           /* results, logs, screenshots (git-ignored) */
};
