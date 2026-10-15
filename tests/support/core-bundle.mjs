/* The pure core (src/core/*.js) bundled for Node the way the page build does it (esbuild + the generated-data plugin),
   imported once: the namespace M the core and equiv suites test (core exports plus the data tables listed in ENTRY). */
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { generatedData } from '../../scripts/generated-data.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

export async function coreBundle() {
  const CORE = readdirSync(join(ROOT, 'src/core')).filter(f => f.endsWith('.js')).sort();
  const ENTRY = [
    ...CORE.map(f => `export * from "./core/${f}";`),
    'export { GATES, STEPS } from "./data/milestones.js";',
    'export { QUESTS, QUEST_STEPS, QUEST_LOC } from "./data/story.js";',
    'export { SP_STEPS, STIGMA_PLAN, ST_COST, ST_TARGETS, E_ORDER, LEVEL_POINTS, RMB_STACK } from "./data/build.js";',
    'export { MIG_V5 } from "./data/migrations.js";',
    'export { RQ, SH_DATA } from "./data/generated.js";',
    'export { GATE_GRAPH } from "./data/gate-graph.js";',
  ].join('\n');
  const r = await build({ stdin: { contents: ENTRY, resolveDir: join(ROOT, 'src'), loader: 'js', sourcefile: 'core-entry.js' },
    bundle: true, write: false, format: 'esm', platform: 'neutral', treeShaking: false, logLevel: 'silent', plugins: [generatedData] });
  /* platform "neutral": a core module that reached for a browser or Node API would fail here or in the checks */
  return import('data:text/javascript;base64,' + Buffer.from(r.outputFiles[0].text).toString('base64'));
}

/* A suite runner: test(name, fn) prints ok / FAIL lines (tests/run.mjs counts them) and counts failures. */
export function runner() {
  let n = 0, fail = 0;
  const test = (name, fn) => {
    n++;
    try { fn(); console.log('ok   ' + name); }
    catch (e) { fail++; console.log('FAIL ' + name + '  · ' + String(e && e.message || e).split('\n').slice(0, 6).join(' | ').slice(0, 600)); }
  };
  return { test, get n() { return n; }, get fail() { return fail; }, failed() { fail++; } };
}
