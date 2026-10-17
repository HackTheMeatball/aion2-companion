/* The generated data modules, shared by scripts/build.mjs and the Node core tests (tests/core.mjs): an esbuild plugin that
   serves src/packs/aion2/data/generated.js (by any relative path that resolves there: "./generated.js" from the pack's
   data folder, "./data/generated.js" from the pack) as the module tools/gen/gen.mjs compiles from data/** (data format
   v2, 0.2 step 5b), src/packs/aion2/data/gate-graph.js as GATE_GRAPH (the live gates, 0.3 E1) and
   src/packs/aion2/data/gate-proposed.js as GATE_PROPOSED (the 0.3 proposals compiled, 0.3 E4). They are pack data (0.4
   P2b): the pack object (src/packs/aion2/pack.js) hands GATE_GRAPH and GATE_PROPOSED to the engine, which never imports
   them. The modules are never stored: not in src/, not in tools/. A schema error or a failed data check stops the build. */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate } from '../tools/gen/gen.mjs';
import { dataFiles } from '../tools/gen/validate.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const P = (...p) => join(ROOT, ...p);

/* the module text (generated once per process); throws on a schema error or a failed check */
let cached = null;
export const genResult = () => {
  if (cached) return cached;
  const g = generate();
  if (g.failed.length) throw new Error(`data checks failed (${g.failed.length}): ` + g.failed.slice(0, 5).map(c => c.check).join('; ') + ' (run npm run gen)');
  return (cached = g);
};
export const genModule = () => genResult().module;
export const generatedNames = () => [...Object.keys(genResult().constants), 'GATE_GRAPH', 'GATE_PROPOSED'];
/* where the modules resolve (the AION 2 pack's data folder), and file name -> module text */
const DATA_DIR = 'src/packs/aion2/data';
const MODULES = { 'generated.js': () => genResult().module, 'gate-graph.js': () => genResult().gateModule, 'gate-proposed.js': () => genResult().proposedModule };
/* a stored copy of a generated module (in the pack's data folder, or the pre-0.4 src/data), else null */
export const staleGenerated = () => [DATA_DIR, 'src/data'].flatMap(d => Object.keys(MODULES).map(f => d + '/' + f)).find(f => existsSync(P(f))) || null;
export const generatedData = {
  name: 'generated-data',
  setup(b) {
    b.onResolve({ filter: /^(\.\.?\/)+([\w-]+\/)*(generated|gate-graph|gate-proposed)\.js$/ }, a => {
      const f = Object.keys(MODULES).find(f => join(a.resolveDir, a.path) === P(DATA_DIR, f));
      return f ? { path: 'data/' + f, namespace: 'generated' } : undefined;
    });
    b.onLoad({ filter: /.*/, namespace: 'generated' }, a => ({ contents: MODULES[a.path.slice('data/'.length)](), loader: 'js', resolveDir: P(DATA_DIR), watchFiles: dataFiles() }));
  },
};
