#!/usr/bin/env node
/* Equiv suite (0.3 E2): the requirement evaluator and the gate functions the page calls, against the frozen 0.2 gate rules
   (tests/support/gates-0.2.mjs), over the 2,000 golden-master states, in Node (no browser, no build, no server). Runs
   tests/equiv/*.test.mjs with the same core bundle and (test, M) interface as the core suite; its own suite because it
   walks every state (the core suite stays under its 5 s). Also suite `equiv` in tests/run.mjs (CI: the `checks` shard).
   Usage: node tests/equiv.mjs [--only <file substring>] */
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { coreBundle, runner } from './support/core-bundle.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIMIT_S = 30;
const t0 = performance.now();
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;

const M = await coreBundle();
const R = runner();
const test = (name, fn) => { const t = performance.now(); R.test(name, fn); console.log(`     ${((performance.now() - t) / 1000).toFixed(2)} s`); };
for (const f of readdirSync(join(ROOT, 'tests/equiv')).filter(f => f.endsWith('.test.mjs')).sort()) {
  if (only && !f.includes(only)) continue;
  console.log(`-- ${f}`);
  (await import(pathToFileURL(join(ROOT, 'tests/equiv', f)).href)).default(test, M);
}
const s = (performance.now() - t0) / 1000;
console.log(`\n${R.n - R.fail}/${R.n} equiv checks passed in ${s.toFixed(2)} s`);
if (s > LIMIT_S) { console.log(`FAIL equiv suite took longer than ${LIMIT_S} s`); R.failed(); }
console.log(R.fail ? `EQUIV CHECKS FAILED: ${R.fail}` : 'EQUIV CHECKS PASSED');
process.exit(R.fail ? 1 : 0);
