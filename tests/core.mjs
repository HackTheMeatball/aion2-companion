#!/usr/bin/env node
/* Core suite (0.2 P3): the pure core (src/core/) in Node, no browser. Bundles src/core/*.js with the data modules the way
   the page build does (esbuild + the generated-data plugin), imports the bundle, and runs tests/core/*.test.mjs against
   it. Each test file exports default (test, M): M is the bundle's namespace (core exports plus the data tables listed
   in ENTRY). Also suite `core` in tests/run.mjs; it needs no build and no server.
   Usage: node tests/core.mjs [--only <file substring>] */
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { generatedData } from '../scripts/generated-data.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const t0 = performance.now();
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;

const CORE = readdirSync(join(ROOT, 'src/core')).filter(f => f.endsWith('.js')).sort();
const ENTRY = [
  ...CORE.map(f => `export * from "./core/${f}";`),
  'export { GATES, STEPS } from "./data/milestones.js";',
  'export { QUESTS, QUEST_STEPS, QUEST_LOC } from "./data/story.js";',
  'export { SP_STEPS, STIGMA_PLAN, E_ORDER, LEVEL_POINTS } from "./data/build.js";',
  'export { MIG_V5 } from "./data/migrations.js";',
  'export { RQ, SH_DATA } from "./data/generated.js";',
].join('\n');
const r = await build({ stdin: { contents: ENTRY, resolveDir: join(ROOT, 'src'), loader: 'js', sourcefile: 'core-entry.js' },
  bundle: true, write: false, format: 'esm', platform: 'neutral', treeShaking: false, logLevel: 'silent', plugins: [generatedData] });
/* platform "neutral": a core module that reached for a browser or Node API would fail here or in the checks below */
const M = await import('data:text/javascript;base64,' + Buffer.from(r.outputFiles[0].text).toString('base64'));
const tBuild = performance.now() - t0;

let n = 0, fail = 0;
const test = (name, fn) => {
  n++;
  try { fn(); console.log('ok   ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + '  · ' + String(e && e.message || e).split('\n').slice(0, 6).join(' | ').slice(0, 600)); }
};
for (const f of readdirSync(join(ROOT, 'tests/core')).filter(f => f.endsWith('.test.mjs')).sort()) {
  if (only && !f.includes(only)) continue;
  console.log(`-- ${f}`);
  (await import(pathToFileURL(join(ROOT, 'tests/core', f)).href)).default(test, M);
}
const ms = performance.now() - t0;
console.log(`\n${n - fail}/${n} core checks passed in ${(ms / 1000).toFixed(2)} s (bundle ${tBuild.toFixed(0)} ms)`);
if (ms > 5000) { console.log('FAIL core suite took longer than 5 s'); fail++; }
console.log(fail ? `CORE CHECKS FAILED: ${fail}` : 'CORE CHECKS PASSED');
process.exit(fail ? 1 : 0);
