#!/usr/bin/env node
/* Core suite (0.2 P3): the pure core (src/core/) in Node, no browser. Bundles src/core/*.js with the data modules the way
   the page build does (tests/support/core-bundle.mjs), imports the bundle, and runs tests/core/*.test.mjs against it.
   Each test file exports default (test, M): M is the bundle's namespace (core exports plus the data tables listed in
   the bundle's ENTRY). Also suite `core` in tests/run.mjs; it needs no build and no server. The evaluator equivalence
   over the golden states has its own suite (`equiv`, tests/equiv.mjs).
   Usage: node tests/core.mjs [--only <file substring>] */
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { coreBundle, runner } from './support/core-bundle.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const t0 = performance.now();
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;

const M = await coreBundle();
const tBuild = performance.now() - t0;

const R = runner(), { test } = R;
for (const f of readdirSync(join(ROOT, 'tests/core')).filter(f => f.endsWith('.test.mjs')).sort()) {
  if (only && !f.includes(only)) continue;
  console.log(`-- ${f}`);
  (await import(pathToFileURL(join(ROOT, 'tests/core', f)).href)).default(test, M);
}
const ms = performance.now() - t0;
console.log(`\n${R.n - R.fail}/${R.n} core checks passed in ${(ms / 1000).toFixed(2)} s (bundle ${tBuild.toFixed(0)} ms)`);
if (ms > 5000) { console.log('FAIL core suite took longer than 5 s'); R.failed(); }
console.log(R.fail ? `CORE CHECKS FAILED: ${R.fail}` : 'CORE CHECKS PASSED');
process.exit(R.fail ? 1 : 0);
