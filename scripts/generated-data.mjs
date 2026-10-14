/* The generated data module (0.2 P2), shared by scripts/build.mjs and the Node core tests (tests/core.mjs): an esbuild
   plugin that serves "./generated.js" (from src/data) or "./data/generated.js" (from src/) as a module built from
   tools/gen/gen-block.js, with an export list of its constants. The module is never stored in src/. */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const P = (...p) => join(ROOT, ...p);
export const GEN_BLOCK = P('tools/gen/gen-block.js');

/* the module text; throws on a malformed block (the build turns that into its own error) */
export const genModule = () => {
  const block = readFileSync(GEN_BLOCK, 'utf8').replace(/\n+$/, '');
  if (!block.startsWith('/* E2-GEN START') || !block.endsWith('/* E2-GEN END */')) throw new Error('tools/gen/gen-block.js lacks the E2-GEN markers');
  const names = [...block.matchAll(/^const (\w+) =/gm)].map(m => m[1]);
  if (!names.length) throw new Error('tools/gen/gen-block.js defines no constants');
  return `${block}\nexport { ${names.join(', ')} };\n`;
};
export const staleGenerated = () => existsSync(P('src/data/generated.js'));
export const generatedData = {
  name: 'generated-data',
  setup(b) {
    b.onResolve({ filter: /^\.\.?\/(data\/)?generated\.js$/ }, a => {
      if (join(a.resolveDir, a.path) !== P('src/data/generated.js')) return undefined;
      return { path: 'tools/gen/gen-block.js', namespace: 'generated' };
    });
    b.onLoad({ filter: /.*/, namespace: 'generated' }, () => ({ contents: genModule(), loader: 'js', resolveDir: P('src/data'), watchFiles: [GEN_BLOCK] }));
  },
};
