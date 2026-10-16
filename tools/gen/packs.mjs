/* Pack chain (0.4 P1, DATA-FORMAT-V2 §2.1): a pack is a folder below the packs root with a pack.json (pack.schema.json)
   whose id is that folder. resolvePacks() starts at one pack, visits its parent, then its `uses`, then the pack itself
   (so a pack loads after everything it reads), and returns the listed files in that order. It throws on a manifest that
   fails its schema or names another folder, an unknown parent / uses, a cycle, a listed file that is missing and a JSON
   file in a pack folder that no manifest lists (a nested pack's folder belongs to that pack). */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { ROOT, validateDoc } from './validate.mjs';

export const DEFAULT_ROOT = join(ROOT, 'data/packs');
export const DEFAULT_PACK = 'aion2/asmodian/assassin';

const rel = f => relative(ROOT, f).split(sep).join('/');
/* the JSON files of one pack folder: not pack.json, not inside a nested pack */
const ownJson = (dir, base = dir) => readdirSync(dir).sort().flatMap(n => {
  const f = join(dir, n);
  if (statSync(f).isDirectory()) return existsSync(join(f, 'pack.json')) ? [] : ownJson(f, base);
  return n.endsWith('.json') && f !== join(base, 'pack.json') ? [relative(base, f).split(sep).join('/')] : [];
});

export function resolvePacks({ root = DEFAULT_ROOT, pack = DEFAULT_PACK } = {}) {
  const manifests = new Map(), state = new Map(), stack = [], chain = [];
  const load = id => {
    if (manifests.has(id)) return manifests.get(id);
    const f = join(root, ...id.split('/'), 'pack.json');
    let m = null;
    if (/^[a-z0-9][a-z0-9-]*(\/[a-z0-9][a-z0-9-]*)*$/.test(id) && existsSync(f)) {
      try { m = JSON.parse(readFileSync(f, 'utf8')); } catch (e) { throw new Error(`${rel(f)}: not JSON: ${e.message}`); }
      const errs = validateDoc(f, m);
      if (errs.length) throw new Error(`${rel(f)}: pack manifest fails pack.schema.json: ${errs.slice(0, 5).join('; ')}`);
      if (m.id !== id) throw new Error(`${rel(f)}: id "${m.id}" is not its folder "${id}"`);
    }
    manifests.set(id, m); return m;
  };
  const visit = (id, via) => {
    if (state.get(id) === 'done') return;
    if (state.get(id) === 'open') throw new Error(`pack cycle: ${[...stack.slice(stack.indexOf(id)), id].join(' -> ')}`);
    const m = load(id);
    if (!m) throw new Error(via ? `${via}: unknown pack "${id}"` : `unknown pack "${id}" (no pack.json in ${rel(join(root, id))})`);
    state.set(id, 'open'); stack.push(id);
    if (m.parent) visit(m.parent, `${id} parent`);
    for (const u of m.uses || []) visit(u, `${id} uses`);
    stack.pop(); state.set(id, 'done'); chain.push(m);
  };
  visit(pack, null);
  const files = [];
  for (const m of chain) {
    const dir = join(root, ...m.id.split('/'));
    for (const f of m.files) if (!existsSync(join(dir, f))) throw new Error(`pack ${m.id}: listed file ${f} does not exist`);
    const unlisted = ownJson(dir).filter(f => !m.files.includes(f));
    if (unlisted.length) throw new Error(`pack ${m.id}: JSON file(s) in the pack folder not listed in pack.json: ${unlisted.join(', ')}`);
    for (const f of m.files) files.push({ pack: m.id, abs: join(dir, f), rel: rel(join(dir, f)) });
  }
  return { chain, files };
}
