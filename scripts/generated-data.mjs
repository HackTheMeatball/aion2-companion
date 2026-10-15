/* The generated data modules, shared by scripts/build.mjs and the Node core tests (tests/core.mjs): an esbuild plugin that
   serves "./generated.js" (from src/data) or "./data/generated.js" (from src/) as the module tools/gen/gen.mjs compiles
   from data/** (data format v2, 0.2 step 5b), and "./gate-graph.js" / "../data/gate-graph.js" as GATE_GRAPH (the live
   gates, 0.3 E1; imported by src/core/evaluator.js and requirements.js, which wires it into the page since E2). The
   modules are never stored: not in src/, not in tools/. A schema error or a failed data check stops the build. */
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
export const generatedNames = () => [...Object.keys(genResult().constants), 'GATE_GRAPH'];
/* file name in src/data -> module text */
const MODULES = { 'generated.js': () => genResult().module, 'gate-graph.js': () => genResult().gateModule };
/* a stored copy of a generated module (src/data/generated.js or gate-graph.js), else null */
export const staleGenerated = () => Object.keys(MODULES).map(f => 'src/data/' + f).find(f => existsSync(P(f))) || null;
export const generatedData = {
  name: 'generated-data',
  setup(b) {
    b.onResolve({ filter: /^\.\.?\/(data\/)?(generated|gate-graph)\.js$/ }, a => {
      const f = Object.keys(MODULES).find(f => join(a.resolveDir, a.path) === P('src/data', f));
      return f ? { path: 'data/' + f, namespace: 'generated' } : undefined;
    });
    b.onLoad({ filter: /.*/, namespace: 'generated' }, a => ({ contents: MODULES[a.path.slice('data/'.length)](), loader: 'js', resolveDir: P('src/data'), watchFiles: dataFiles() }));
  },
};
