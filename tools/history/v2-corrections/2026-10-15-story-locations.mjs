#!/usr/bin/env node
/* Story-quest locations for the records on the placeholder zone `zone:altgard-unplaced` (DATA-FORMAT-V2 §9 data task).
   Applied once to data/shared/asmodian/story-quests.json; kept for provenance, like 2026-10-14.mjs. Reads
   data/research/story-locations-metabot-2026-10.csv (built by data/research/scripts-2026-10/story_locations.py from
   Metabot quest pages read 2026-10-15, build 0.0.4387.0; requests in story-locations-metabot-2026-10.requests.log) and
   writes the list of changes to 2026-10-15-story-locations.txt.

   Per side (giver / turn-in) that is on the placeholder:
   - fills what is missing from the page: npc, place (Metabot's Location, else the "To finish" place), Kibelisk, metres,
     marker coords (Altgard map only). A value we already hold is kept; a different one stops the script.
   - zone by the CSV rule: metabot-location -> verified (the quest page names that zone); registry-camp /
     registry-kibelisk -> inferred (through zones[].camps / kibelisks); otherwise the placeholder stays (owner-check)
     with the reason in an `inferred` ref.
   Sides already off the placeholder, steps, `requires` and `completesWith` are not touched.

   Usage: node tools/history/v2-corrections/2026-10-15-story-locations.mjs */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SQF = join(ROOT, 'data/shared/asmodian/story-quests.json'), ZNF = join(ROOT, 'data/shared/asmodian/zones.json');
const CSV = join(ROOT, 'data/research/story-locations-metabot-2026-10.csv');
const D = '2026-10-15', BUILD = { scheme: 'metabot', value: '0.0.4387.0' }, PH = 'zone:altgard-unplaced';
const doc = JSON.parse(readFileSync(SQF, 'utf8')), zones = JSON.parse(readFileSync(ZNF, 'utf8')).records;
const zName = Object.fromEntries(zones.map(z => [z.id, z.name]));

/* RFC 4180 reader (fields may be quoted) */
const parse = t => { const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) { const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else f += c; }
  if (f || row.length) { row.push(f); rows.push(row); }
  const [h, ...rs] = rows; return rs.map(r => Object.fromEntries(h.map((k, i) => [k, r[i]]))); };
const rows = parse(readFileSync(CSV, 'utf8'));

const LOG = [], log = (...a) => LOG.push(a.join(' '));
const latest = r => { const ds = []; const w = v => { if (Array.isArray(v)) v.forEach(w); else if (v && typeof v === 'object') { if ((v.url || v.owner) && v.checkedAt) ds.push(v.checkedAt); if (v.owner && v.owner.checkedAt) ds.push(v.owner.checkedAt); Object.values(v).forEach(w); } }; w(r.sources); if (ds.length) r.verifiedAt = ds.sort().slice(-1)[0]; };
const num = v => v === '' || v == null ? null : Number(v);
const reasons = Object.fromEntries(rows.map(r => [r.id, Object.fromEntries((r.notes || '').split(' | ').filter(Boolean).map(n => [n.split(':')[0], n.slice(n.indexOf(':') + 2)]))]));
let resolved = 0, kept = 0;
for (const row of rows) {
  const s = doc.records.find(x => x.id === row.id); if (!s) throw new Error('no record ' + row.id);
  if (s.name !== row.name) throw new Error(`${row.id}: name ${s.name} vs ${row.name}`);
  const url = row.page_url, fields = [], changes = [];
  for (const side of ['giver', 'turnin']) {
    const l = s[side]; if (l.zone !== PH) continue;
    const p = k => row[`${side}_${k}`];
    const set = (k, v, f) => { if (v === '' || v == null) return;
      if (l[k] == null) { l[k] = v; fields.push(`${side}.${f || k}`); changes.push(`${side}.${k} = ${v}`); }
      else if (l[k] !== v) throw new Error(`${row.id} ${side}.${k}: data ${l[k]} vs page ${v}`); };
    set('npc', p('npc'));
    if (l.place == null) set('place', p('location') || (side === 'turnin' ? row.turnin_finish_place : ''));
    set('kibelisk', p('kib')); set('meters', num(p('kib_m')));
    if (!l.coords && p('map') === 'World_D_A' && p('x') !== '') {
      const st = side === 'turnin' && row.turnin_marker === 'S·T';
      l.coords = { map: 'altgard', x: num(p('x')), y: num(p('y')), sources: [{ url, checkedAt: D, build: BUILD,
        note: `marker position in map pixels (≈ 1 m, docs/research/2026-10-location-coverage.md §4)${st ? '; giver and turn-in share one marker (S·T)' : ''}` }] };
      fields.push(`${side}.coords`); changes.push(`${side}.coords = ${p('x')},${p('y')}${st ? ' (S·T)' : ''}`);
    }
    /* the zone */
    const z = p('zone'), basis = p('zone_basis'), fz = `${side}.zone`;
    s.sources = s.sources.map(x => x.inferred && /placeholder zone/.test(x.inferred) && x.fields ? { ...x, fields: x.fields.filter(f => f !== fz) } : x).filter(x => !x.fields || x.fields.length);
    if (basis === 'placeholder') {
      s.sources.push({ inferred: `${side === 'giver' ? 'Giver' : 'Turn-in'} zone not found (Metabot quest page read ${D}): ${reasons[row.id][side]}. Placeholder zone kept for an owner check (data/research/story-locations-metabot-2026-10.csv).`, fields: [fz] });
      s.fieldStatus[fz] = 'owner-check'; kept++; changes.push(`${fz} stays ${PH}`);
    } else {
      l.zone = z; resolved++;
      if (basis === 'metabot-location') { fields.push(fz); s.fieldStatus[fz] = 'verified'; }
      else {
        s.sources.push({ inferred: basis === 'registry-camp'
          ? `${side === 'giver' ? 'Giver' : 'Turn-in'} zone from Metabot's Location (${p('location')}), a camp / Kibelisk of ${zName[z]} in the zone records.`
          : `${side === 'giver' ? 'Giver' : 'Turn-in'} zone from its Kibelisk (${p('kib')}, ${p('kib_m')} m) through the zone records.`, fields: [fz] });
        s.fieldStatus[fz] = 'inferred';
      }
      changes.push(`${fz} = ${z} (${basis})`);
    }
  }
  if (fields.length) s.sources.push({ url, fields: [...new Set(fields)], checkedAt: D, build: BUILD,
    note: "Metabot quest page: Start & turn-in table and map markers (Data & Research, data/research/story-locations-metabot-2026-10.csv)" });
  latest(s);
  log(s.id, s.name + ':', changes.join('; '));
}
writeFileSync(SQF, JSON.stringify(doc, null, 2) + '\n');
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), '2026-10-15-story-locations.txt'), LOG.join('\n') + `\n\n${rows.length} records; ${resolved} sides get a zone, ${kept} stay on ${PH}.\n`);
console.log(`${rows.length} records; ${resolved} sides get a zone, ${kept} stay on ${PH}`);
