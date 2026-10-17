/* Invariants of smart Next up (0.5 P11, docs/design/0.4-smart-next-up.md §11), suite `invariant`, over the states of
   tests/invariant/states.mjs (the golden loc / behind / bind families among them) and a dated copy of a hashed share of
   them (every change time moved to 1 … 40 s, so ties happen), with the place oracle (tests/support/oracle.mjs
   loadPlaceOracle: the raw JSON, not NODE_PLACE / KIBELISKS, src/core/place.js or src/packs/aion2/travel.js) as the judge:

   oracle   whereNow and the bound Kibelisks are the oracle's on every state checked.
   7.  No location, no change: with every change time set to 0, rankNext with the ranking switches on (all but
       ascensionFirst, catchUp and etaLater, which reorder without a location) equals rankNext with every one off.
   8.  Location only reorders inside a phase (0.5 P12, placeRank): the same save placed three ways gives the same card
       kinds in the same order; only the regional list's order and the rq / sd / sh picks differ.
   11. Binding is monotonic in progress: more ticks, a pick-up, a dungeon entered, one more objective or the story one
       quest on never unbinds a Kibelisk (the app's boundSet and the oracle's).
   12. Nudge: the "Bind X" row is the oracle's on every story position × {no ticks, every objective, everything done} and
       on every state checked: only for R < m ≤ the nudge radius (both from rules.json), never for a Kibelisk the data
       binds, at most one story position per Kibelisk.
   13. Teleport line (0.5 P16, travelAdvice): the story card's travel line is the oracle's; never with preferRun, never
       for an unbound Kibelisk, never a distance claim across maps, only on the story card; its metres are the data's.
   14. Deterministic after merge: whereNow(merge(a, b)) = whereNow(merge(b, a)) per slot on the sync suite's pairs.
   15. Nothing written: whereNow, boundSet, nudgeOf, teleportOf and rankNext (every ranking switch off, and on) run on
       deep-frozen saves and leave them as they were.
   9 (Ascension first) is next-up.test.mjs's invariant 3, enforced since 0.5 P12. (10 comes with the step that builds
   what it checks: trackFilter.) */
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
  /* the switches that change the ranking without a location (design §11 7 names the first two; etaLater, 0.5 P13, orders
     the Later cards by when they open; trackFilter and bandLabels, 0.5 P14, read the route labels and the milestone
     levels, never a place; bindDerived and bindNudge, 0.5 P15, read the ticks and the story position, never a change time) */
  const NO_LOC = ['ascensionFirst', 'catchUp', 'etaLater', 'trackFilter', 'bandLabels', 'bindDerived', 'bindNudge'];
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

  test('7. no location, no change: change times at 0, rankNext with the ranking switches on (but ascensionFirst, catchUp, etaLater, trackFilter, bandLabels, bindDerived, bindNudge) = every one off', () => {
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

  /* 8 (0.5 P12, placeRank): the same save placed three ways (as recorded, every change time at 0 so whereNow is null, and
     re-dated by a hash so another stamp is the newest), ranked as the page ships. The card kinds in order are the same;
     a card other than rq / sd / sh is the same; rq differs only in its list order and its "go" target, sd only in its
     pick (with the pick's entrance, band bar and button: placed, the pick is the highest band's nearest, unplaced the
     story step's zone first, design §5), sh only in its pick. */
  test('8. location only reorders inside a phase: three places of the same save, the same card kinds in order; only the rq order and the rq / sd / sh picks differ', () => {
    const cases = loaded.filter(x => x.c.mt && share('in8', x, x.fam === 'loc' || x.fam === 'bind' ? 1 : x.fam ? 0.3 : 0.02)), bad = [];
    let moved = 0, picks = 0;
    /* the story card's travel line (0.5 P16, travelAdvice) reads the place by design (invariant 13 checks it); it adds a
       line, never moves a card */
    const norm = a => a.kind === 'story' ? { ...a, tele: null } : a.kind === 'rq' ? { ...a, act: null, open: [...a.open].sort((x, y) => x.k < y.k ? -1 : 1) }
      : a.kind === 'sd' ? { ...a, pick: null, loc: null, band: null, act: null } : a.kind === 'sh' ? { ...a, pick: null } : a;
    for (const { id, s } of cases) {
      const c0 = M.char(s), at = mt => ({ ...s, chars: { ...s.chars, [s.current]: deepFreeze({ ...c0, mt }) } });
      const three = [s, at(retime(c0.mt, () => 0)), at(retime(c0.mt, p => 1 + Math.floor(fnv(id + '|in8|' + p.join('.')) * 40)))];
      const heres = three.map(st => JSON.stringify(M.whereNow(M.char(st))));
      if (new Set(heres).size > 1) moved++;
      const runs = three.map(st => M.rankNext(st, { basic: st.mode === 'basic' }));
      const kinds = runs.map(r => r.map(a => a.kind).join(' '));
      if (new Set(kinds).size > 1) { bad.push(`${id}: card kinds ${kinds.join(' / ')}`); continue; }
      const same = runs.map(r => JSON.stringify(r.map(norm)));
      if (new Set(same).size > 1) bad.push(`${id}: a card differs beyond the rq order and the picks (places ${heres.join(' / ')})`);
      if (new Set(runs.map(r => JSON.stringify(r))).size > 1) picks++;
    }
    assert.deepEqual(bad.slice(0, 5), [], `${bad.length} of ${cases.length} states`);
    console.log(`     ${cases.length} states, ${moved} placed differently, ${picks} with a different order or pick`);
    assert.ok(X.only || (cases.length > 500 && picks > 50), `${cases.length} states, ${picks} with a different order or pick: the check must see location matter`);
  });

  test('11. binding is monotonic in progress: more ticks, pick-ups, a dungeon entered, one more objective or the story on never unbind (app and oracle)', () => {
    const keys = Object.values(M.GATE_GRAPH.nodes).filter(n => ['rq', 'sd', 'sh'].includes(n.kind)).map(n => n.key);
    const qi = new Map(S.map(([, n], i) => [n, i])), bad = [];
    let n = 0, grew = 0;
    const steps = (id, c, more) => {
      const a0 = M.boundSet(c), o0 = P.boundSet(c);
      for (const [what, c2] of more) { n++;
        const a1 = M.boundSet(c2), o1 = P.boundSet(c2), lostA = [...a0].filter(k => !a1.has(k)), lostO = [...o0].filter(k => !o1.has(k));
        if (a1.size > a0.size) grew++;
        if (lostA.length || lostO.length) bad.push(`${id} ${what}: app lost ${lostA.join(' ')} · oracle lost ${lostO.join(' ')}`); }
    };
    /* one step at a time from an empty save: each regional quest picked up, then turned in; each dungeon or stronghold
       entered, then done; each story quest current, turned in, the next one current, every objective ticked */
    const blank = o => ({ level: 45, checks: {}, quest: '', qsteps: {}, started: {}, areaRun: {}, ...o });
    for (const k of keys) {
      if (k.startsWith('rq:')) steps(k, blank({ started: { [k]: 1 } }), [['turned in', blank({ started: { [k]: 1 }, checks: { [k]: true } })], ['turned in, pick-up gone', blank({ checks: { [k]: true } })]]);
      else steps(k, blank({ areaRun: { [k]: 1760000000000 } }), [['done', blank({ areaRun: { [k]: 1760000000000 }, checks: { [k]: true } })]]);
    }
    S.forEach(([, q], i) => { const all = Array.from({ length: (M.QUEST_STEPS[q] || []).length }, (_, j) => j);
      steps(q, blank({ quest: q }), [['turned in', blank({ quest: q, storyEnd: q })], ['every objective', blank({ quest: q, qsteps: { [q]: all } })],
        ...(i + 1 < S.length ? [['story on', blank({ quest: S[i + 1][1] })]] : [])]); });
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
      steps(id, c, more);
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

  /* 12 on the page (0.5 P15, bindNudge on): the story card's bind is nudgeOf's on every family state and a hashed share
     of the rest, and nothing with bindNudge (or the bindDerived it needs) off; a card with a row is the current quest's */
  test('12. the story card: its "Bind X" row is nudgeOf\'s exactly (bindDerived and bindNudge on), none with either off', () => {
    const bad = []; let rows = 0, n = 0;
    try {
      for (const { id, s, c } of loaded.filter(x => x.s && share('nucard', x, x.fam === 'bind' ? 1 : x.fam ? 0.2 : 0.02))) { n++;
        const card = r => r.find(a => a.kind === 'story') || {};
        M.setRankChanges(null); const st = card(M.rankNext(s, { basic: s.mode === 'basic' })), want = M.nudgeOf(c);
        if (st.v === 'obj' && JSON.stringify(st.bind || null) !== JSON.stringify(want)) bad.push(`${id}: card ${JSON.stringify(st.bind)} / nudgeOf ${JSON.stringify(want)}`);
        if (st.bind) { rows++; if (st.quest !== c.quest || st.bind.key !== 'bind:' + st.bind.kib) bad.push(`${id}: row ${JSON.stringify(st.bind)} on ${st.quest}`); }
        if (!st.bind && !share('nucard-off', { id }, 0.2)) continue;
        for (const off of [ALL_RANK.filter(k => k !== 'bindNudge'), ALL_RANK.filter(k => k !== 'bindDerived')]) {
          M.setRankChanges(off); if (card(M.rankNext(s, { basic: s.mode === 'basic' })).bind) bad.push(`${id}: a row with ${ALL_RANK.find(k => !off.includes(k))} off`); }
      }
    } finally { M.setRankChanges(null); }
    assert.deepEqual(bad.slice(0, 5), [], `${bad.length} of ${n} states`);
    console.log(`     ${n} states, ${rows} with the row`);
    assert.ok(X.only || rows > 0, 'the row shows on some state');
  });

  /* 13 (0.5 P16, travelAdvice on): the story card's travel line is the oracle's on every family state, a hashed share of
     the rest and every dated copy we can rank (as recorded, and with preferRun on); never with preferRun, never for a
     Kibelisk the data doesn't bind, never a distance claim across maps, never on a card other than the story card (so
     never on an Ascension step), the metres are the turn-in's data metres; none with travelAdvice off */
  test('13. teleport line: the oracle\'s; never with preferRun, never unbound, never cross-map on distance, never on an Ascension step; metres = the data', () => {
    const bad = []; let n = 0, lines = 0, dist = 0, zone = 0;
    const rank = s => M.rankNext(s, { basic: s.mode === 'basic' });
    try {
      M.setRankChanges(null);
      for (const { id, s, c } of loaded.filter(x => x.s && share('tele', x, x.fam ? 1 : 0.1))) { n++;
        const r = rank(s), st = r.find(a => a.kind === 'story') || {}, t = st.tele || null, here = P.whereNow(c);
        r.filter(a => a.kind !== 'story' && a.tele).forEach(a => bad.push(`${id}: a travel line on a ${a.kind} card`));
        const o = P.teleport(c, here, { preferRun: s.preferRun === true });
        const a2 = t && { kib: t.kib, m: t.m, walk: t.walk };
        if (st.v === 'obj' && JSON.stringify(a2) !== JSON.stringify(o)) bad.push(`${id}: app ${JSON.stringify(a2)} / oracle ${JSON.stringify(o)}`);
        if (!t) continue;
        lines++; if (t.walk === null) zone++; else dist++;
        if (!P.boundSet(c).has(t.kib)) bad.push(`${id}: a line for ${t.kib}, which the data doesn't bind`);
        const T = P.turnin(c.quest);
        if (!T || T.anchor !== t.kib || T.m !== t.m) bad.push(`${id}: ${t.m} m to ${t.kib}, the data's turn-in says ${JSON.stringify(T)}`);
        if (t.walk !== null && !(here && here.pt && T.map && here.pt.map === T.map)) bad.push(`${id}: a distance claim across maps (${JSON.stringify(here)} → ${JSON.stringify(T)})`);
        if (t.to !== S[S.findIndex(([, q]) => q === c.quest)][0]) bad.push(`${id}: "I'll walk" target ${t.to} is not ${c.quest}'s node`);
        if (rank({ ...s, preferRun: true }).some(a => a.tele)) bad.push(`${id}: a line with preferRun`);
        M.setRankChanges(ALL_RANK.filter(k => k !== 'travelAdvice')); if (rank(s).some(a => a.tele)) bad.push(`${id}: a line with travelAdvice off`);
        M.setRankChanges(null);
      }
    } finally { M.setRankChanges(null); }
    assert.deepEqual(bad.slice(0, 5), [], `${bad.length} of ${n} states`);
    console.log(`     ${n} states, ${lines} with the line (${dist} by distance, ${zone} by zone)`);
    assert.ok(X.only || lines > 0, 'the line shows on some state');
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
