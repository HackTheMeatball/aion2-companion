#!/usr/bin/env node
/* Story objective points (0.5 P9, issue #201): an `at { map, x, y, kibelisk, meters, sources }` on every story objective the
   step-points research bound to a Metabot step marker. Applied once to data/packs/aion2/asmodian/story-quests.json; kept
   for provenance, like 2026-10-15-story-locations.mjs. Reads data/research/story-step-points-metabot-2026-10.csv (built by
   data/research/scripts-2026-10/story_step_points.py from Metabot quest pages read 2026-10-17, build 0.0.4387.0; requests
   in story-step-points-metabot-2026-10.requests.log; docs/research/2026-10-story-step-points.md) and writes the list of
   changes to 2026-10-17-step-points.txt.

   Only rows with status confirmed / confirmed-reworded; unbound rows (Finding Nemon: no objective lines) are listed, not
   applied. Per row: the objective `i` exists, its text before " — " is the CSV's objective_title, and its
   "(Kibelisk: X)" marker, when it has one, is the page's nearest Kibelisk; any difference stops the script. Metabot's
   map ids become the data's map slugs (World_D_A → altgard, World_D_Starter → ishalgen, as in kibelisks.json). Objective
   text, order and count are not touched (save keys `qsteps` index objectives).

   Usage: node tools/history/v2-corrections/2026-10-17-step-points.mjs */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SQF = join(ROOT, 'data/packs/aion2/asmodian/story-quests.json');
const CSV = join(ROOT, 'data/research/story-step-points-metabot-2026-10.csv');
const D = '2026-10-17', BUILD = { scheme: 'metabot', value: '0.0.4387.0' }, MAP = { World_D_A: 'altgard', World_D_Starter: 'ishalgen' };
const doc = JSON.parse(readFileSync(SQF, 'utf8'));

/* RFC 4180 reader (fields may be quoted) */
const parse = t => { const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) { const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else f += c; }
  if (f || row.length) { row.push(f); rows.push(row); }
  const [h, ...rs] = rows; return rs.map(r => Object.fromEntries(h.map((k, i) => [k, r[i]]))); };
const rows = parse(readFileSync(CSV, 'utf8'));

const LOG = [], log = (...a) => LOG.push(a.join(' '));
const int = (v, what) => { if (!/^\d+$/.test(v)) throw new Error(`${what}: not a whole number: ${v}`); return Number(v); };
let set = 0; const quests = new Set(), left = [];
for (const row of rows) {
  const tag = `${row.quest_id} ${row.quest} step ${row.step_no}`;
  if (!row.status.startsWith('confirmed')) { left.push(`${tag}: ${row.status}${row.notes ? ' (' + row.notes + ')' : ''}`); continue; }
  const s = doc.records.find(x => x.id === row.quest_id); if (!s) throw new Error('no record ' + tag);
  if (s.name !== row.quest) throw new Error(`${tag}: name ${s.name}`);
  const x = s.steps.find(y => y.i === int(row.objective_i, tag)); if (!x) throw new Error(`${tag}: no objective ${row.objective_i}`);
  const title = x.text.split(' — ')[0].replace(/\s*\(Kibelisk: [^)]+\)/, '');
  if (title !== row.objective_title) throw new Error(`${tag}: title "${title}" vs "${row.objective_title}"`);
  const mark = (x.text.match(/\(Kibelisk: ([^)]+)\)/) || [])[1];
  if (mark && mark !== row.kibelisk) throw new Error(`${tag}: marker ${mark} vs page ${row.kibelisk}`);
  if (x.at) throw new Error(`${tag}: objective ${x.i} already has a point`);
  if (!MAP[row.map]) throw new Error(`${tag}: unknown map ${row.map}`);
  const n = int(row.points, tag), offset = int(row.step_no, tag) !== x.i + 1;
  const note = [`Metabot step marker ${row.step_no}${n > 1 ? `, centre of its ${n} points` : ''} (map ${row.map}, pixels ≈ 1 m) and its nearest Kibelisk`,
    row.status === 'confirmed-reworded' ? 'our objective title is a reworded copy of the page\'s' : '',
    offset ? `bound by title, page row ${row.step_no} = our objective ${x.i}` : '',
    'docs/research/2026-10-story-step-points.md'].filter(Boolean).join('; ');
  x.at = { map: MAP[row.map], x: int(row.x, tag), y: int(row.y, tag), kibelisk: row.kibelisk, meters: int(row.meters, tag),
    sources: [{ url: row.page_url, checkedAt: D, build: BUILD, note }] };
  set++; quests.add(s.id);
  log(`${s.id} ${s.name} #${x.i}: ${x.at.map} ${x.at.x},${x.at.y} · ${x.at.kibelisk} ${x.at.meters} m${mark ? '' : ' (no marker in our text)'}${row.status === 'confirmed-reworded' ? ' (reworded title)' : ''}${offset ? ` (page row ${row.step_no})` : ''}`);
}
writeFileSync(SQF, JSON.stringify(doc, null, 2) + '\n');
const sum = `${rows.length} markers; ${set} objective points on ${quests.size} story quests; ${left.length} left out:`;
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), '2026-10-17-step-points.txt'), LOG.join('\n') + `\n\n${sum}\n${left.map(l => '- ' + l).join('\n')}\n`);
console.log(sum); left.forEach(l => console.log('- ' + l));
