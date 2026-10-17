/* JSON Schema validation of every v2 data file (DATA-FORMAT-V2 appendix): ajv 8 Ajv2020 with exactly
   { strict: true, allErrors: true }, nothing relaxed. Used by the generator (a data file that fails stops the build),
   by `npm run validate` and by the `schema` step of `npm test`.
   Usage: node tools/gen/validate.mjs        (also validates data/schema/examples/) */
import Ajv2020 from 'ajv/dist/2020.js';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCHEMA_DIR = join(ROOT, 'data/schema');
const walk = dir => readdirSync(dir).flatMap(n => { const f = join(dir, n); return statSync(f).isDirectory() ? walk(f) : [f]; });

/* collection -> schema file, from the envelope's "collection" */
export const SCHEMA_OF = { sources: 'sources', gameBuilds: 'game-builds', storyQuests: 'story-quests', ascensionQuests: 'ascension-quests',
  regionalQuests: 'regional-quests', sealedDungeons: 'sealed-dungeons', strongholds: 'strongholds', zones: 'zones', unlocks: 'unlocks', items: 'items',
  rules: 'rules', boards: 'boards', milestones: 'milestones', steps: 'steps', tips: 'tips', claims: 'claims', confidence: 'confidence', classes: 'classes',
  builds: 'builds', skills: 'skills', boardNodes: 'board-nodes', stigmas: 'stigmas', kibelisks: 'kibelisks' };

let ajv;
export const compiler = () => {
  if (ajv) return ajv;
  ajv = new Ajv2020({ strict: true, allErrors: true });
  for (const f of readdirSync(SCHEMA_DIR).filter(n => n.endsWith('.schema.json'))) ajv.addSchema(JSON.parse(readFileSync(join(SCHEMA_DIR, f), 'utf8')), f);
  for (const f of readdirSync(SCHEMA_DIR).filter(n => n.endsWith('.schema.json'))) if (!ajv.getSchema(f)) throw new Error('schema does not compile: ' + f);
  return ajv;
};

/* every JSON file under data/packs/: the data files and the pack manifests (pack.json) */
export const dataFiles = () => walk(join(ROOT, 'data/packs')).filter(f => f.endsWith('.json'));

/* returns [{file, errors}] for files that fail; doc is the parsed file */
export const validateDoc = (file, doc) => {
  const a = compiler();
  const name = basename(file) === 'pack.json' ? 'pack.schema.json' : basename(file) === 'retired.json' ? 'retired.schema.json' : SCHEMA_OF[doc.collection] ? SCHEMA_OF[doc.collection] + '.schema.json' : null;
  if (!name) return [`unknown collection "${doc.collection}"`];
  const v = a.getSchema(name);
  if (v(doc)) return [];
  return v.errors.map(e => `${e.instancePath || '/'} ${e.message}${e.params && Object.keys(e.params).length ? ' ' + JSON.stringify(e.params) : ''}`);
};

export const validateAll = ({ examples = true } = {}) => {
  const files = [...dataFiles(), ...(examples ? walk(join(SCHEMA_DIR, 'examples')).filter(f => f.endsWith('.json')) : [])];
  const bad = [];
  for (const f of files) {
    let doc; try { doc = JSON.parse(readFileSync(f, 'utf8')); } catch (e) { bad.push({ file: relative(ROOT, f), errors: ['not JSON: ' + e.message] }); continue; }
    const errors = validateDoc(f, doc);
    if (errors.length) bad.push({ file: relative(ROOT, f), errors });
  }
  return { files: files.length, bad };
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const t0 = Date.now(), { files, bad } = validateAll();
  for (const b of bad) { console.error(`${b.file}: ${b.errors.length} error(s)`); for (const e of b.errors.slice(0, 25)) console.error('  ' + e); if (b.errors.length > 25) console.error(`  … ${b.errors.length - 25} more`); }
  console.log(`schema: ${files} files, ${bad.length} invalid (ajv Ajv2020, strict, allErrors; ${Date.now() - t0} ms)`);
  process.exit(bad.length ? 1 : 0);
}
