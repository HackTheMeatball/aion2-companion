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
        any difference in the stored state after load (`store`, `keys`: never approvable, design §6) or in the input,
        except one class: view flags (viewFlag below), listed with their cause in their own section of the table.
   Writes tests/out/golden/explain.md (the table for the PR: change · records · what the data / design says changes ·
   states by group and level band · kinds of change · one before / after sample) and explain.json (state → set).
   Returns the exit code: 0 when every difference is attributed and nothing else is wrong. Never records. */
'use strict';
const fs = require('fs'), path = require('path');

/* the records each change touches, from the raw data (for the table; the app reads the compiled graph) */
function recordsOf(root, meta) {
  const read = f => JSON.parse(fs.readFileSync(path.join(root, 'data', f), 'utf8')).records;
  const steps = read('packs/aion2/asmodian/assassin/guide/steps.json'), rqs = read('packs/aion2/asmodian/regional-quests.json'), story = read('packs/aion2/asmodian/story-quests.json');
  const shs = read('packs/aion2/asmodian/strongholds.json');
  const leaves = a => !a ? [] : a.all ? a.all.flatMap(leaves) : a.any ? a.any.flatMap(leaves) : [a];
  const byStep = r => (r.completesWith || []).some(e => e && e.storyStep);
  const rqName = new Map(rqs.map(q => [q.id, q.name]));
  const out = {};
  for (const [n, m] of Object.entries(meta)) {
    if (m.apply) { const r = steps.find(s => s.id === m.apply) || rqs.find(q => q.id === m.apply);
      out[n] = { records: [m.apply], change: r && r.proposed ? r.proposed.change : m.what }; continue; }
    if (m.records) { out[n] = { records: m.records.map(id => `${id}${rqName.has(id) ? ' ' + rqName.get(id) : ''}`), change: m.what }; continue; }   /* E5: proposals moved live, the switch names its records */
    if (n === 'regionalTurnedIn') out[n] = { records: rqs.filter(q => leaves(q.requires).some(a => a.story && a.is === 'turnedIn')).map(q => `${q.id} ${q.name}`), change: m.what };
    else if (n === 'storyStepDerived') out[n] = { records: [...shs, ...steps].filter(byStep).map(r => r.id), change: m.what };
    else if (n === 'stepNotes') out[n] = { records: story.flatMap(s => s.steps.filter(x => x.note).map(x => `${s.id} #${x.i} ${s.name}`)), change: m.what };
    else if (n === 'derived') out[n] = { records: steps.filter(s => !byStep(s) && s.completesWith.includes('tick') && s.completesWith.some(e => e !== 'tick')).map(s => s.id), change: m.what };
    else if (n === 'followUps' || n === 'clearTally') out[n] = { records: [...new Set(rqs.flatMap(q => leaves(q.requires).filter(a => a.done && rqName.has(a.done) && ['sourced', 'owner'].includes(a.basis)).map(a => a.done)))].sort()
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

/* View flags: state.open.<milestone> is whether its card is unfolded, not progress. main.js update() unfolds a milestone
   that is next or Missed when nothing is stored for it, and the card's toggle handler saves that, so a change that moves
   a milestone in or out of next / Missed adds or drops one `open.<id>: absent → true` after load. Allowed (and attributed
   to that cause) only when all of these hold; else the difference stays never approvable:
     - the path is open.<id> and <id> is a milestone the page shows (a row in `ms` on both sides);
     - one side stored [absent, true] for it and the other stored nothing (absent ↔ true: never a false, never a value
       the save already had);
     - the side that stored it shows the milestone next or Missed (upnext / overdue) and the other side shows it neither.
   Returns the cause, or null. */
const AUTO = ['upnext', 'overdue'];
function viewFlag(p, A, B, a, b, canon) {
  const m = /^open\.([^.]+)$/.exec(p); if (!m) return null;
  const row = r => (r.ms || []).map(x => x.split(' | ')).find(x => x[0] === m[1]);
  const ra = row(a), rb = row(b); if (!ra || !rb) return null;
  const st = r => (r[3] || '').split(',').filter(c => AUTO.includes(c)), set = v => canon(v) === canon(['(absent)', true]);
  const sa = st(ra), sb = st(rb), tag = (r, x) => `${r[1]}${x.length ? ` (${x.join(',')})` : ''}`;
  if (set(A[p]) && B[p] === undefined && sa.length && !sb.length) return `${m[1]} ${tag(ra, sa)} → ${tag(rb, sb)}: no longer auto-opened, absent → true no longer written`;
  if (A[p] === undefined && set(B[p]) && !sa.length && sb.length) return `${m[1]} ${tag(ra, sa)} → ${tag(rb, sb)}: now auto-opened, absent → true now written`;
  return null;
}

async function explain({ states, shipped, before, meta, run, canon, describe, out, root }) {
  const all = Object.keys(meta), base = all.filter(n => meta[n].baseline);   /* baseline = already approved and in the snapshots: on in every run, never explained */
  const names = all.filter(n => !meta[n].baseline);
  const eff = set => { const on = new Set(base); for (const n of set) { on.add(n); (meta[n].needs || []).forEach(d => on.add(d)); } return all.filter(n => on.has(n)); };
  const errors = [], flags = []; /* flags: view flags, { id, path, cause } */
  const changed = states.filter(s => before[s.id] && canon(before[s.id]) !== canon(shipped[s.id]));
  const noSnap = states.filter(s => !before[s.id]);
  console.log(`explain: ${changed.length} of ${states.length} states differ from the snapshots with every change on (${names.join(', ')}; already in the snapshots: ${base.join(', ') || 'none'})`);
  if (noSnap.length) errors.push(`${noSnap.length} states have no snapshot (e.g. ${noSnap[0].id}): explain compares against the snapshots of the base build`);
  for (const s of changed) {
    const a = before[s.id], b = shipped[s.id];
    if (a.in !== b.in) errors.push(`${s.id}: the generated save changed (input), not a behaviour change`);
    if (canon(a.keys) !== canon(b.keys)) errors.push(`${s.id}: other localStorage keys after load differ (never approvable, design §6): ${JSON.stringify(a.keys)} → ${JSON.stringify(b.keys)}`);
    if (canon(a.store) !== canon(b.store)) {
      const A = a.store || {}, B = b.store || {}, paths = [...new Set([...Object.keys(A), ...Object.keys(B)])].filter(k => canon(A[k]) !== canon(B[k]));
      const bad = paths.filter(k => { const cause = viewFlag(k, A, B, a, b, canon); if (cause) flags.push({ id: s.id, path: k, cause }); return !cause; });
      if (bad.length || !paths.length) errors.push(`${s.id}: stored state after load differs (never approvable, design §6): ${bad.map(k => `${k} ${JSON.stringify(A[k] || null)} → ${JSON.stringify(B[k] || null)}`).join('; ') || 'the whole save'}`);
    }
  }

  /* 1. every change off: each changed state must be its snapshot again */
  const off = changed.length ? await run(changed, base) : {};
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
    '(a proposal row includes the rule it needs). Store / save differences: ' + (errors.some(e => /stored state|localStorage keys/.test(e)) ? '**some (see errors)**' : 'none') +
    ` (view flags \`open.<milestone>\` apart: ${flags.length}, listed below with their cause).`, '',
    '| # | Change | Record(s) | What changes (data `change` / design) | States (group, level band) | Kinds of change (states) | Sample: state, before → after |', '|---|---|---|---|---|---|---|',
    ...rows.map((r, i) => {
      const rc = r.set.map(n => recs[n] || { records: [], change: '' });
      const records = rc.flatMap(x => x.records), change = rc.map(x => x.change).filter(Boolean).join(' / ');
      return `| ${i + 1} | ${names2(r.set)}${r.set.length > 2 ? ' **(triple)**' : ''}${r.eff.filter(n => !r.set.includes(n) && !base.includes(n)).length ? ` (with ${names2(r.eff.filter(n => !r.set.includes(n) && !base.includes(n)))})` : ''} | ${cell(records.slice(0, 12).join(', ') + (records.length > 12 ? `, … (${records.length})` : ''))} | ${cell(change)} | ${r.ids.length}: ${cell(byGroup(r.ids))} | ${cell(r.top.join('<br>') + (r.more > 0 ? `<br>… ${r.more} more kinds` : ''))} | \`${r.sample}\`<br>${cell(r.sd.join('<br>').slice(0, 700))} |`;
    }),
    ...(flags.length ? ['', '## View flags (`open.<milestone>`, attributed to auto-open)', '',
      'A milestone card unfolds by itself while it is next or Missed and nothing is stored for it, and its toggle handler saves ' +
      '`open.<id>: true`. Each difference below is only that: absent ↔ true on a milestone whose next / Missed status the change in its row moved ' +
      '(checked per state from the recorded milestone classes). A UI flag, not progress; any other stored difference is an error.', '',
      '| State | Flag | Cause: milestone tag (status) before → after | Row |', '|---|---|---|---|',
      ...flags.map(f => { const i = rows.findIndex(r => r.ids.includes(f.id));
        return `| \`${f.id}\` | \`${f.path}\` | ${cell(f.cause)} | ${i >= 0 ? `${i + 1} (${names2(rows[i].set)})` : '**unattributed**'} |`; })] : []),
    '', '## Approval', '', 'Comment "approved rows: …" with the row numbers; only approved rows are applied, then the snapshots are re-recorded.', '',
    ...rows.map((r, i) => `- [ ] row ${i + 1}: ${names2(r.set)} (${r.ids.length} states)`),
    ...(errors.length ? ['', '## Errors', '', ...errors.slice(0, 200).map(e => `- ${e}`)] : []), ''];
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'explain.md'), md.join('\n'));
  fs.writeFileSync(path.join(out, 'explain.json'), JSON.stringify({ changed: changed.length, attributed: Object.fromEntries([...attr].map(([id, c]) => [id, c.eff])), viewFlags: flags, errors }, null, 1));
  rows.forEach((r, i) => console.log(`  row ${i + 1}: ${r.set.join(' + ')} · ${r.ids.length} states · ${byGroup(r.ids)}`));
  if (flags.length) console.log(`  view flags: ${flags.length} (open.<milestone> absent ↔ true from auto-open; in the table)`);
  console.log('  table: tests/out/golden/explain.md');
  if (errors.length) { console.log(`GOLDEN EXPLAIN FAILED: ${errors.length} error(s), e.g.\n  ${errors.slice(0, 8).join('\n  ')}`); return 1; }
  console.log('GOLDEN EXPLAIN PASSED (every difference attributed)');
  return 0;
}
module.exports = { explain };
