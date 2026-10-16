/* 0.2.5 golden proof (design §6.12): every differing state differs only by store.backup (absent -> { since }) and
   store.backup1 (absent -> true); no view field, no other store path, nothing removed or changed.
   Usage: npm run build; node tests/golden.js; node tests/support/e025-golden-proof.js [tests/out/golden/diff.json] */
'use strict';
const d = require(require('path').resolve(process.argv[2] || 'tests/out/golden/diff.json'));
const canon = v => JSON.stringify(v, (k, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(k => [k, x[k]])) : x);
const c = { states: d.length, storeOnlyBackup: 0, fresh: 0, viewDiff: 0, otherField: 0, otherStore: 0, removedOrChanged: 0, sinceVals: new Set() };
const bad = [];
for (const { id, before, after } of d) {
  for (const f of new Set([...Object.keys(before || {}), ...Object.keys(after || {})])) {
    if (f === 'store') continue;
    if (canon(before[f]) !== canon(after[f])) { (['nu', 'ms', 'rt', 'jr', 'reg'].includes(f) ? c.viewDiff++ : c.otherField++); bad.push(`${id}: field ${f}`); }
  }
  const A = before.store || {}, B = after.store || {};
  if (A[''] !== undefined || B[''] !== undefined) {
    /* no save: the whole state is written (path ''); equal once backup / backup1 are taken out */
    c.fresh++;
    const a = A[''][1], b = B[''][1];
    const strip = o => { const x = { ...o }; delete x.backup; delete x.backup1; return x; };
    const extra = Object.keys(b).filter(k => !(k in a)), missing = Object.keys(a).filter(k => !(k in b));
    if (canon(strip(a)) !== canon(strip(b)) || extra.sort().join() !== 'backup,backup1' || missing.length || b.backup1 !== true || !b.backup || Object.keys(b.backup).join() !== 'since')
      { c.otherStore++; bad.push(`${id}: written state differs beyond backup / backup1 (extra ${extra}, missing ${missing})`); }
    else c.sinceVals.add(b.backup.since);
    for (const p of new Set([...Object.keys(A), ...Object.keys(B)])) if (p !== '' && canon(A[p]) !== canon(B[p])) { c.otherStore++; bad.push(`${id}: store ${p}`); }
    continue;
  }
  let ok = true;
  for (const p of new Set([...Object.keys(A), ...Object.keys(B)])) {
    if (canon(A[p]) === canon(B[p])) continue;
    if (p in A) { c.removedOrChanged++; ok = false; bad.push(`${id}: store path ${p} removed / changed`); continue; }
    if (p === 'backup1' && canon(B[p]) === canon(['(absent)', true])) continue;
    if (p === 'backup' && B[p][0] === '(absent)' && B[p][1] && Object.keys(B[p][1]).join() === 'since' && typeof B[p][1].since === 'number') { c.sinceVals.add(B[p][1].since); continue; }
    c.otherStore++; ok = false; bad.push(`${id}: store ${p} ${JSON.stringify(B[p])}`);
  }
  const added = Object.keys(B).filter(p => !(p in A)).sort().join();
  if (ok && added === 'backup,backup1') c.storeOnlyBackup++; else if (ok) { c.otherStore++; bad.push(`${id}: added ${added}`); }
}
c.sinceVals = [...c.sinceVals].map(t => new Date(t).toISOString());
console.log(JSON.stringify(c, null, 1));
console.log(bad.length ? bad.slice(0, 30).join('\n') : 'no other differences');
process.exitCode = bad.length ? 1 : 0;
