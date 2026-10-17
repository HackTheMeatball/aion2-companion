/* Invariants of smart Next up (0.5 P11, docs/design/0.4-smart-next-up.md §11), suite `invariant`, over the states of
   tests/invariant/states.mjs (the golden loc / behind / bind families among them) and a dated copy of a hashed share of
   them (every change time moved to 1 … 40 s, so ties happen), with the place oracle (tests/support/oracle.mjs
   loadPlaceOracle: the raw JSON, not NODE_PLACE / KIBELISKS, src/core/place.js or src/packs/aion2/travel.js) as the judge:

   oracle   whereNow and the bound Kibelisks are the oracle's on every state checked.
   7.  No location, no change: with every change time set to 0, rankNext with the ranking switches on (all but
       ascensionFirst and catchUp, which don't read location) equals rankNext with every one off.
   11. Binding is monotonic in progress: more ticks, a pick-up, a dungeon entered, one more objective or the story one
       quest on never unbinds a Kibelisk (the app's boundSet and the oracle's).
   12. Nudge: the "Bind X" row is the oracle's on every story position × {no ticks, every objective, everything done} and
       on every state checked: only for R < m ≤ the nudge radius (both from rules.json), never for a Kibelisk the data
       binds, at most one story position per Kibelisk.
   14. Deterministic after merge: whereNow(merge(a, b)) = whereNow(merge(b, a)) per slot on the sync suite's pairs.
   15. Nothing written: whereNow, boundSet, nudgeOf, teleportOf and rankNext (every ranking switch off, and on) run on
       deep-frozen saves and leave them as they were.
   (8, 9, 10 and 13 come with the steps that build what they check: placeRank, ascensionFirst, trackFilter, travelAdvice.) */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { loadPlaceOracle } from '../support/oracle.mjs';
import { genSave } from '../core/sync.test.mjs';

const { fnv, SMART_FAMILIES } = createRequire(import.meta.url)('../golden/states.js');
const deepFreeze = o => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); } return o; };
const clone = o => JSON.parse(JSON.stringify(o));
/* every change time in mt through f(path, t) (a copy) */
const retime = (mt, f, p = []) => Array.isArray(mt) && mt.length === 2 && typeof mt[0] === 'number' ? [f(p, mt[0]), mt[1]]
  : mt && typeof mt === 'object' ? Object.fromEntries(Object.entries(mt).map(([k, v]) => [k, retime(v, f, [...p, k])])) : mt;
const famOf = id => SMART_FAMILIES.find(f => id.startsWith(`golden/${f}/`)) || null;
const sortSet = s => [...s].sort();

export default (test, M, X) => {
  const { states, OA, root } = X;
  const P = loadPlaceOracle({ root, O: OA });
  const S = M.GATE_GRAPH.story, ALL_RANK = [...Object.keys(M.RANK_CHANGES), ...Object.keys(M.AION2_RANK_CHANGES)];
  const NO_LOC = ['ascensionFirst', 'catchUp'];
  /* loaded as the page does, deep-frozen (X.loaded, shared with the other files); dated: a copy of a hashed tenth with its
     change times spread over 1 … 40 s. Samples below are hashed by state id (the suite's 30 s budget). */
  const loaded = [], dated = [], share = (tag, x, p) => fnv(tag + '|' + x.id) < p;
  test(`place: ${states.length} states (deep-frozen), a dated copy of a hashed tenth`, () => {
    for (const x of X.loaded()) {
      loaded.push({ ...x, fam: famOf(x.id) });
      if (share('dated', x, 0.1) && x.c.mt) dated.push({ id: x.id + ' (dated)', c: deepFreeze({ ...clone(x.c), mt: retime(x.c.mt, p => 1 + Math.floor(fnv(x.id + '|' + p.join('.')) * 40)) }) });
    }
    if (X.only) return;
    assert.deepEqual(SMART_FAMILIES.filter(f => !loaded.some(x => x.fam === f)), [], 'every smart Next up family is in the states');
    assert.ok(dated.length > 800, `${dated.length} dated copies`);
  });

  test('oracle: the rules and the Kibelisk registry are the app\'s (TRAVEL_RULES, KIBELISKS ids)', () => {
    assert.deepEqual({ bindRadius: P.R, nudgeRadius: P.nudgeR, teleportGain: P.gain }, M.TRAVEL_RULES);
    assert.deepEqual(sortSet(P.kibs.keys()), Object.keys(M.KIBELISKS).sort());
  });

  test('oracle: whereNow = the app\'s on every family state, a hashed share of the rest and every dated copy; every kind of stamp places the player somewhere', () => {
    const bad = [], via = new Map();
    for (const { id, c } of [...loaded.filter(x => x.fam || share('where', x, 0.3)), ...dated]) {
      const a = M.whereNow(c), o = P.whereNow(c);
      if (JSON.stringify(a) !== JSON.stringify(o)) bad.push(`${id}: app ${JSON.stringify(a)} / oracle ${JSON.stringify(o)}`);
      if (a) { const k = a.via.split(':')[0]; via.set(k, (via.get(k) || 0) + 1); }   /* rq / sd / sh / bind (a tick), started, areaRun, qsteps, quest */
    }
    assert.deepEqual(bad.slice(0, 5), [], `${bad.length} states differ`);
    console.log(`     placed by: ${[...via].sort().map(([k, n]) => `${k} ${n}`).join(' · ')}`);
    if (!X.only) assert.deepEqual(['rq', 'sd', 'sh', 'bind', 'started', 'areaRun', 'qsteps', 'quest'].filter(k => !via.get(k)), [], 'a kind of stamp never places the player');
  });

  /* the bound sets: the bind family, and hashed shares of the other families, the targeted states, the rest and the dated copies */
  const boundCases = () => [...loaded, ...dated].filter(x => x.fam === 'bind' || share('bound', x, x.fam ? 0.3 : x.id.startsWith('target/') ? 0.1 : 0.03));
  test('oracle: the bound Kibelisks (boundSet) are the oracle\'s on the bind family and hashed shares of the rest', () => {
    const bad = []; let n = 0, some = 0;
    for (const { id, c } of boundCases()) { n++; const a = sortSet(M.boundSet(c)), o = sortSet(P.boundSet(c)); if (a.length) some++;
      if (a.join() !== o.join()) bad.push(`${id}: app ${a.join(' ')} / oracle ${o.join(' ')}`); }
    assert.deepEqual(bad.slice(0, 5), [], `${bad.length} of ${n} states differ`);
    assert.ok(X.only || some > n / 4, `only ${some} of ${n} states bind anything`);
  });

  test('7. no location, no change: change times at 0, rankNext with the ranking switches on (but ascensionFirst, catchUp) = every one off', () => {
    const on = ALL_RANK.filter(n => !NO_LOC.includes(n)), bad = [];
    const cases = loaded.filter(x => share('nl', x, x.fam === 'loc' || x.fam === 'bind' ? 0.3 : x.fam ? 0.1 : 0.003));
    try {
      for (const { id, s } of cases) {
        const c0 = M.char(s), st = { ...s, chars: { ...s.chars, [s.current]: deepFreeze({ ...c0, mt: retime(c0.mt || {}, () => 0) }) } };
        assert.equal(M.whereNow(M.char(st)), null, `${id}: a dated stamp is left`);
        M.setRankChanges([]); const off = JSON.stringify(M.rankNext(st, { basic: st.mode === 'basic' }));
        M.setRankChanges(on); const onR = JSON.stringify(M.rankNext(st, { basic: st.mode === 'basic' }));
        if (off !== onR) bad.push(id);
      }
    } finally { M.setRankChanges(null); }
    assert.deepEqual(bad.slice(0, 5), [], `${bad.length} of ${cases.length} states differ`);
    assert.ok(X.only || cases.length > 150, `${cases.length} states`);
  });

  test('11. binding is monotonic in progress: more ticks, pick-ups, a dungeon entered, one more objective or the story on never unbind (app and oracle)', () => {
    const keys = Object.values(M.GATE_GRAPH.nodes).filter(n => ['rq', 'sd', 'sh'].includes(n.kind)).map(n => n.key);
    const qi = new Map(S.map(([, n], i) => [n, i])), bad = [];
    let n = 0, grew = 0;
    for (const { id, c } of boundCases().filter(x => share('mono', x, 0.3))) {
      const salt = id + '|', more = [];
      more.push(['ticks', { ...c, checks: { ...c.checks, ...Object.fromEntries(keys.filter(k => fnv(salt + k) < 0.3).map(k => [k, true])), ['bind:' + Object.keys(M.KIBELISKS)[Math.floor(fnv(salt + 'b') * 50)]]: true } }]);
      more.push(['pick-up', { ...c, started: { ...(c.started || {}), ...Object.fromEntries(keys.filter(k => k.startsWith('rq:') && fnv(salt + 's' + k) < 0.3).map(k => [k, 1])) } }]);
      more.push(['entered', { ...c, areaRun: { ...(c.areaRun || {}), [keys.filter(k => !k.startsWith('rq:'))[Math.floor(fnv(salt + 'r') * 70)]]: 1760000000000 } }]);
      const i = qi.get(c.quest);
      if (i !== undefined) {
        const list = M.QUEST_STEPS[c.quest] || [], have = (c.qsteps || {})[c.quest] || [], j = list.findIndex((_, k) => !have.includes(k));
        if (j >= 0) more.push(['objective', { ...c, qsteps: { ...(c.qsteps || {}), [c.quest]: [...have, j] } }]);
        if (c.storyEnd !== c.quest) more.push(['turned in', { ...c, storyEnd: c.quest }]);
        if (i + 1 < S.length) more.push(['story on', { ...c, quest: S[i + 1][1], storyEnd: undefined }]);
      }
      const a0 = M.boundSet(c), o0 = P.boundSet(c);
      for (const [what, c2] of more) { n++;
        const a1 = M.boundSet(c2), o1 = P.boundSet(c2), lostA = [...a0].filter(k => !a1.has(k)), lostO = [...o0].filter(k => !o1.has(k));
        if (a1.size > a0.size) grew++;
        if (lostA.length || lostO.length) bad.push(`${id} ${what}: app lost ${lostA.join(' ')} · oracle lost ${lostO.join(' ')}`); }
    }
    assert.deepEqual(bad.slice(0, 5), [], `${bad.length} of ${n} steps unbind`);
    assert.ok(X.only || grew > n / 10, `only ${grew} of ${n} steps bind anything new`);
  });

  test('12. nudge: the oracle\'s on every story position (no ticks, every objective, everything done) and every state checked; R < m ≤ nudge radius, never bound, once per Kibelisk', () => {
    const done = Object.fromEntries(Object.values(M.GATE_GRAPH.nodes).filter(n => ['rq', 'sd', 'sh'].includes(n.kind)).map(n => [n.key, true]));
    const bad = [], perKib = new Map();
    const check = (id, c) => {
      const a = M.nudgeOf(c), o = P.nudge(c), a2 = a && { kib: a.kib, m: a.m };
      if (JSON.stringify(a2) !== JSON.stringify(o)) bad.push(`${id}: app ${JSON.stringify(a2)} / oracle ${JSON.stringify(o)}`);
      if (!a) return null;
      if (!(a.m > P.R && a.m <= P.nudgeR)) bad.push(`${id}: nudge at ${a.m} m, outside (${P.R}, ${P.nudgeR}]`);
      if (P.boundSet(c).has(a.kib)) bad.push(`${id}: nudge for ${a.kib}, which the data binds`);
      if (a.key !== 'bind:' + a.kib || (P.turnin(c.quest) || {}).anchor !== a.kib) bad.push(`${id}: nudge ${JSON.stringify(a)} is not the turn-in's Kibelisk`);
      return a;
    };
    for (let i = 0; i < S.length; i++) {
      const q = S[i][1], n = (M.QUEST_STEPS[q] || []).length, ch = o => ({ level: 45, checks: {}, quest: q, qsteps: {}, started: {}, areaRun: {}, ...o });
      const a = check(`${q} (no ticks)`, ch({}));
      if (a) perKib.set(a.kib, [...(perKib.get(a.kib) || []), q]);
      check(`${q} (every objective)`, ch({ qsteps: { [q]: Array.from({ length: n }, (_, j) => j) } }));
      check(`${q} (everything done)`, ch({ checks: done }));
    }
    for (const { id, c } of [...loaded, ...dated].filter(x => x.fam || share('nudge', x, 0.2))) check(id, c);
    const twice = [...perKib].filter(([, qs]) => qs.length > 1).map(([k, qs]) => `${k}: ${qs.join(', ')}`);
    assert.deepEqual([...bad.slice(0, 5), ...twice], [], `${bad.length} nudge differences, ${twice.length} Kibelisks nudged twice`);
    console.log(`     nudge on ${perKib.size} story positions: ${[...perKib.keys()].join(', ')}`);
    assert.ok(perKib.size > 0, 'the nudge shows somewhere');
  });

  test('14. deterministic after merge: whereNow(merge(a, b)) = whereNow(merge(b, a)) per slot, and the oracle\'s, on the sync suite\'s pairs', () => {
    const saves = Array.from({ length: 36 }, (_, i) => genSave(M, 1000 + i)), bad = [];
    let n = 0, placed = 0;
    for (let i = 0; i < saves.length; i++) for (let j = i + 1; j < saves.length; j++) {
      const ab = M.merge(saves[i], saves[j]), ba = M.merge(saves[j], saves[i]);
      for (const slot of Object.keys(ab.chars)) { n++;
        const x = M.whereNow(ab.chars[slot]), y = M.whereNow((ba.chars || {})[slot]), o = P.whereNow(ab.chars[slot]);
        if (x) placed++;
        if (JSON.stringify(x) !== JSON.stringify(y) || JSON.stringify(x) !== JSON.stringify(o)) bad.push(`${i} × ${j} ${slot}: ${JSON.stringify(x)} / ${JSON.stringify(y)} / oracle ${JSON.stringify(o)}`); }
    }
    assert.deepEqual(bad.slice(0, 5), [], `${bad.length} of ${n} slots differ`);
    assert.ok(placed > n / 4, `only ${placed} of ${n} merged slots place the player`);
  });

  test('15. nothing written: whereNow, boundSet, nudgeOf, teleportOf and rankNext (ranking switches off and on) leave a deep-frozen save as it was', () => {
    const cases = [...loaded.filter(x => share('fz', x, x.fam ? 0.15 : 0.003)), ...dated.filter(x => share('fz', x, 0.05))];
    try {
      for (const x of cases) {
        const c = x.c, before = JSON.stringify(x.s || c), here = M.whereNow(c);
        M.boundSet(c); M.nudgeOf(c);
        const T = c.quest && P.turnin(c.quest); if (T) M.teleportOf(c, { zone: null, pt: M.NODE_PLACE[S[S.findIndex(([, n]) => n === c.quest)][0]].pts.turnin }, here);
        if (x.s) for (const on of [[], ALL_RANK]) { M.setRankChanges(on); M.rankNext(x.s, { basic: x.s.mode === 'basic' }); }
        assert.equal(JSON.stringify(x.s || c), before, x.id);
      }
    } finally { M.setRankChanges(null); }
    assert.ok(X.only || cases.length > 120, `${cases.length} states`);
  });
};
