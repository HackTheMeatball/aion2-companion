/* Golden --explain (0.3 E4, docs/design/0.3-requirement-engine.md §13): which change makes which golden difference.

   The page's 0.3 changes are named switches (src/core/requirements.js GATE_CHANGES, read from the page as `meta`; a
   proposal names the rule it needs). tests/golden.js runs every state with the page as it ships (every change on) and
   hands the result here. Then:
     1. the states that differ from the snapshots run again with every change off: each must equal its snapshot (else
        something changed that no switch covers: an error);
     2. they run with each change alone (with the rules it needs), then each pair, then (for what is left) each triple; a state goes to
        the first set that reproduces its shipped result exactly (the smallest set; ties in GATE_CHANGES order), and
        only states still unexplained run against the next set;
     3. a state no single change, pair or triple reproduces is unattributed (an error: a bug, not a product change), and so is
        any difference in the stored state after load (`store`, `keys`: never approvable, design §6) or in the input.
   Writes tests/out/golden/explain.md (the table for the PR: change · records · what the data / design says changes ·
   states by group and level band · kinds of change · one before / after sample) and explain.json (state → set).
   Returns the exit code: 0 when every difference is attributed and nothing else is wrong. Never records. */
'use strict';
const fs = require('fs'), path = require('path');

/* the records each change touches, from the raw data (for the table; the app reads the compiled graph) */
function recordsOf(root, meta) {
  const read = f => JSON.parse(fs.readFileSync(path.join(root, 'data', f), 'utf8')).records;
  const steps = read('shared/asmodian/guide/steps.json'), rqs = read('shared/asmodian/regional-quests.json'), story = read('shared/asmodian/story-quests.json');
  const leaves = a => !a ? [] : a.all ? a.all.flatMap(leaves) : a.any ? a.any.flatMap(leaves) : [a];
  const rqName = new Map(rqs.map(q => [q.id, q.name]));
  const out = {};
  for (const [n, m] of Object.entries(meta)) {
    if (m.apply) { const r = steps.find(s => s.id === m.apply) || rqs.find(q => q.id === m.apply);
      out[n] = { records: [m.apply], change: r && r.proposed ? r.proposed.change : m.what }; continue; }
    if (n === 'derived') out[n] = { records: steps.filter(s => s.completesWith.includes('tick') && s.completesWith.some(e => e !== 'tick')).map(s => s.id), change: m.what };
    else if (n === 'followUps') out[n] = { records: [...new Set(rqs.flatMap(q => leaves(q.requires).filter(a => a.done && rqName.has(a.done) && ['sourced', 'owner'].includes(a.basis)).map(a => a.done)))].sort()
      .map(id => `${id} ${rqName.get(id)}`), change: m.what };
    else if (n === 'turnInLevel') out[n] = { records: story.filter(s => leaves(s.requires).some(a => a.level !== undefined)).map(s => `${s.id} ${s.key}`), change: m.what };
    else out[n] = { records: [], change: m.what };
  }
  return out;
}

const bandOf = id => { const m = /\/L(\d+)/.exec(id); return m ? +m[1] : null; };
/* "story 12 (Lv 22–45) · level 30 (Lv 16–45) · fixture 1" */
const byGroup = ids => {
  const g = new Map();
  for (const id of ids) { const k = id.split('/')[0], lv = bandOf(id), x = g.get(k) || { n: 0, lo: 99, hi: 0 }; x.n++; if (lv) { x.lo = Math.min(x.lo, lv); x.hi = Math.max(x.hi, lv); } g.set(k, x); }
  return [...g].sort((a, b) => b[1].n - a[1].n).map(([k, x]) => `${k} ${x.n}${x.hi ? ` (Lv ${x.lo === x.hi ? x.lo : x.lo + '–' + x.hi})` : ''}`).join(' · ');
};
const cell = s => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

async function explain({ states, shipped, before, meta, run, canon, describe, out, root }) {
  const names = Object.keys(meta);
  const eff = set => { const on = new Set(); for (const n of set) { on.add(n); (meta[n].needs || []).forEach(d => on.add(d)); } return names.filter(n => on.has(n)); };
  const errors = [];
  const changed = states.filter(s => before[s.id] && canon(before[s.id]) !== canon(shipped[s.id]));
  const noSnap = states.filter(s => !before[s.id]);
  console.log(`explain: ${changed.length} of ${states.length} states differ from the snapshots with every change on (${names.join(', ')})`);
  if (noSnap.length) errors.push(`${noSnap.length} states have no snapshot (e.g. ${noSnap[0].id}): explain compares against the snapshots of the base build`);
  for (const s of changed) {
    const a = before[s.id], b = shipped[s.id];
    if (a.in !== b.in) errors.push(`${s.id}: the generated save changed (input), not a behaviour change`);
    if (canon(a.store) !== canon(b.store) || canon(a.keys) !== canon(b.keys)) {
      const A = a.store || {}, B = b.store || {}, paths = [...new Set([...Object.keys(A), ...Object.keys(B)])].filter(k => canon(A[k]) !== canon(B[k]));
      errors.push(`${s.id}: stored state after load differs (never approvable, design §6): ${paths.map(k => `${k} ${JSON.stringify(A[k] || null)} → ${JSON.stringify(B[k] || null)}`).join('; ') || 'other localStorage keys'}`);
    }
  }

  /* 1. every change off: each changed state must be its snapshot again */
  const off = changed.length ? await run(changed, []) : {};
  const notUndone = new Set(changed.filter(s => canon(off[s.id]) !== canon(before[s.id])).map(s => s.id));
  for (const id of notUndone) errors.push(`${id}: still differs with every change off (a change no switch covers)`);
  console.log(`explain: every change off: ${changed.length - notUndone.size} of ${changed.length} back to their snapshot`);

  /* 2. singles, then pairs; fewest effective changes first; each state to the first set that reproduces it */
  const sets = [], seen = new Set();
  const addSet = set => { const e = eff(set); const k = e.join('+'); if (!seen.has(k)) { seen.add(k); sets.push({ set, eff: e, tier: set.length }); } };
  names.forEach(n => addSet([n]));
  names.forEach((a, i) => names.slice(i + 1).forEach(b => addSet([a, b])));
  /* triples: only for what singles and pairs leave (a state three changes shape together); marked in the table */
  names.forEach((a, i) => names.slice(i + 1).forEach((b, j) => names.slice(i + j + 2).forEach(c => addSet([a, b, c]))));
  sets.sort((x, y) => x.tier - y.tier || x.eff.length - y.eff.length);
  const attr = new Map();
  let todo = changed.filter(s => !notUndone.has(s.id));
  for (const c of sets) {
    if (!todo.length) break;
    const r = await run(todo, c.eff), hit = todo.filter(s => canon(r[s.id]) === canon(shipped[s.id]));
    hit.forEach(s => attr.set(s.id, c));
    todo = todo.filter(s => !attr.has(s.id));
    console.log(`explain: ${c.eff.join(' + ')}${c.tier > 1 ? (c.tier > 2 ? ' (triple)' : ' (pair)') : ''}: ${hit.length} states · ${todo.length} left`);
  }
  for (const s of todo) errors.push(`${s.id}: unattributed (no single change, pair or triple reproduces it)`);

  /* 3. the table */
  const recs = recordsOf(root, meta), rows = [];
  for (const c of sets) {
    const ids = changed.filter(s => attr.get(s.id) === c).map(s => s.id);
    if (!ids.length) continue;
    const kinds = new Map();
    for (const id of ids) for (const [d] of describe(before[id], shipped[id])) kinds.set(d, (kinds.get(d) || 0) + 1);
    const top = [...kinds].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([d, n]) => `${n}× ${d}`);
    const sample = ids[0], sd = describe(before[sample], shipped[sample]).slice(0, 3).map(([d, x]) => x ? `${d}: ${x}` : d);
    rows.push({ set: c.set, eff: c.eff, ids, top, more: kinds.size - top.length, sample, sd });
  }
  const names2 = set => set.map(n => `\`${n}\``).join(' + ');
  const md = ['# Golden --explain (0.3 changes → golden differences)', '',
    `Generated by \`node tests/golden.js --explain\` (tests/golden/explain.js). ${states.length} states; ${changed.length} differ from the snapshots with every change on; ` +
    `${attr.size} attributed, ${todo.length} unattributed, ${notUndone.size} not undone with every change off. Every attributed state is reproduced exactly by the change(s) in its row ` +
    '(a proposal row includes the rule it needs). Store / save differences: ' + (errors.some(e => /stored state/.test(e)) ? '**some (see errors)**' : 'none') + '.', '',
    '| # | Change | Record(s) | What changes (data `change` / design) | States (group, level band) | Kinds of change (states) | Sample: state, before → after |', '|---|---|---|---|---|---|---|',
    ...rows.map((r, i) => {
      const rc = r.set.map(n => recs[n] || { records: [], change: '' });
      const records = rc.flatMap(x => x.records), change = rc.map(x => x.change).filter(Boolean).join(' / ');
      return `| ${i + 1} | ${names2(r.set)}${r.set.length > 2 ? ' **(triple)**' : ''}${r.eff.length > r.set.length ? ` (with ${names2(r.eff.filter(n => !r.set.includes(n)))})` : ''} | ${cell(records.slice(0, 12).join(', ') + (records.length > 12 ? `, … (${records.length})` : ''))} | ${cell(change)} | ${r.ids.length}: ${cell(byGroup(r.ids))} | ${cell(r.top.join('<br>') + (r.more > 0 ? `<br>… ${r.more} more kinds` : ''))} | \`${r.sample}\`<br>${cell(r.sd.join('<br>').slice(0, 700))} |`;
    }),
    '', '## Approval', '', 'Comment "approved rows: …" with the row numbers; only approved rows are applied, then the snapshots are re-recorded.', '',
    ...rows.map((r, i) => `- [ ] row ${i + 1}: ${names2(r.set)} (${r.ids.length} states)`),
    ...(errors.length ? ['', '## Errors', '', ...errors.slice(0, 200).map(e => `- ${e}`)] : []), ''];
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'explain.md'), md.join('\n'));
  fs.writeFileSync(path.join(out, 'explain.json'), JSON.stringify({ changed: changed.length, attributed: Object.fromEntries([...attr].map(([id, c]) => [id, c.eff])), errors }, null, 1));
  rows.forEach((r, i) => console.log(`  row ${i + 1}: ${r.set.join(' + ')} · ${r.ids.length} states · ${byGroup(r.ids)}`));
  console.log('  table: tests/out/golden/explain.md');
  if (errors.length) { console.log(`GOLDEN EXPLAIN FAILED: ${errors.length} error(s), e.g.\n  ${errors.slice(0, 8).join('\n  ')}`); return 1; }
  console.log('GOLDEN EXPLAIN PASSED (every difference attributed)');
  return 0;
}
module.exports = { explain };
