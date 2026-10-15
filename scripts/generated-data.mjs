/* The generated data module, shared by scripts/build.mjs and the Node core tests (tests/core.mjs): an esbuild plugin that
   serves "./generated.js" (from src/data) or "./data/generated.js" (from src/) as the module tools/gen/gen.mjs compiles
   from data/** (data format v2, 0.2 step 5b). The module is never stored: not in src/, not in tools/. A schema error or a
   failed data check stops the build. */
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
export const generatedNames = () => Object.keys(genResult().constants);
export const staleGenerated = () => existsSync(P('src/data/generated.js'));
export const generatedData = {
  name: 'generated-data',
  setup(b) {
    b.onResolve({ filter: /^\.\.?\/(data\/)?generated\.js$/ }, a => {
      if (join(a.resolveDir, a.path) !== P('src/data/generated.js')) return undefined;
      return { path: 'data/generated.js', namespace: 'generated' };
    });
    b.onLoad({ filter: /.*/, namespace: 'generated' }, () => ({ contents: genModule(), loader: 'js', resolveDir: P('src/data'), watchFiles: dataFiles() }));
  },
};
