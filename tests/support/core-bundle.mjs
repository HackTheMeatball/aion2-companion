/* The engine (src/core/*.js) and the AION 2 pack's code (src/packs/aion2/*.js) bundled for Node the way the page build
   does it (esbuild + the generated-data plugin), imported once, with the pack set as the page sets it (usePack, 0.4 P2b):
   the namespace M the core, equiv and invariant suites test (engine and pack exports plus the data tables listed in ENTRY). */
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { generatedData } from '../../scripts/generated-data.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

export async function coreBundle() {
  const CORE = readdirSync(join(ROOT, 'src/core')).filter(f => f.endsWith('.js')).sort();
  const PACK = readdirSync(join(ROOT, 'src/packs/aion2')).filter(f => f.endsWith('.js')).sort();
  const ENTRY = [
    ...CORE.map(f => `export * from "./core/${f}";`),
    ...PACK.map(f => `export * from "./packs/aion2/${f}";`),
    'export { GATES, STEPS } from "./packs/aion2/data/milestones.js";',
    'export { QUESTS, QUEST_STEPS, QUEST_STEP_NOTES, QUEST_LOC } from "./packs/aion2/data/story.js";',
    'export { SP_SLOTS, SP_STEPS, STIGMA_PLAN, ST_COST, ST_TARGETS, E_ORDER, LEVEL_POINTS, RMB_STACK, spCost, SPEC_SLOT_LV, DV_MIN } from "./packs/aion2/data/build.js";',
    'export { RQ, SH_DATA } from "./packs/aion2/data/generated.js";',
    'export { GATE_GRAPH } from "./packs/aion2/data/gate-graph.js";',
    'export { GATE_PROPOSED } from "./packs/aion2/data/gate-proposed.js";',
    'import { usePack as __usePack } from "./core/pack.js";',
    'import { aion2Pack as __aion2Pack } from "./packs/aion2/pack.js";',
    '__usePack(__aion2Pack);',
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
