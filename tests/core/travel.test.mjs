/* AION 2 travel (0.5 P10, src/packs/aion2/travel.js; docs/design/0.4-smart-next-up.md §8): which Kibelisks are bound
   (radius, binds fact, bind tick), the one-time "Bind X" nudge, and teleport vs walk, on the pack's data and rules. */
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const { toStored, TEST_SLOT } = createRequire(import.meta.url)('../support/save.js');
const deepFreeze = o => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); } return o; };
const charOf = flat => toStored({ checks: {}, level: 20, quest: '', ...flat }).chars[TEST_SLOT];
/* deterministic PRNG (mulberry32) */
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

export default (test, M) => {
  const Q = M.GATE_GRAPH.story.map(([, n]) => n), NP = M.NODE_PLACE, N = M.GATE_GRAPH.nodes, KIBS = Object.keys(M.KIBELISKS);
  const idOf = q => M.GATE_GRAPH.story.find(([, n]) => n === q)[0], next = q => Q[Q.indexOf(q) + 1];
  const SS = 'Survival Supplies', SIGNS = 'Signs of a Crash Landing', R = M.TRAVEL_RULES;
  const boundSet = c => { const ev = M.gatesOf(c); return KIBS.filter(k => M.aion2Bound(c, k, { ev })); };

  test('travel rules come from rules.json: bind radius 25 m (working value), nudge radius 150 m, teleport gain 400 m', () => {
    assert.deepEqual(R, { bindRadius: 25, nudgeRadius: 150, teleportGain: 400 });
  });
  test('bound: Safe Haven by its binds fact at R = 25 m, not by distance (VeKauf is 32 m from it)', () => {
    assert.equal(NP[idOf(SS)].pts.turnin.m, 32);
    assert.equal(M.aion2BoundBy(charOf({ quest: SS }), 'kib:safe-haven'), null, 'on the quest, objective 0 not ticked');
    assert.equal(M.aion2BoundBy(charOf({ quest: SS, qsteps: { [SS]: [0] } }), 'kib:safe-haven'), 'fact', 'objective 0 ticked');
    assert.equal(M.aion2BoundBy(charOf({ quest: next(SS) }), 'kib:safe-haven'), 'fact', 'the quest turned in');
    assert.equal(M.aion2BoundBy(charOf({ quest: SS, storyEnd: SS }), 'kib:safe-haven'), 'fact', 'turned in on the last quest (storyEnd)');
    /* at 32 m the turned-in quest's turn-in point binds it by distance */
    assert.equal(M.aion2BoundBy(charOf({ quest: next(SS) }), 'kib:safe-haven', { rules: { ...R, bindRadius: 32 } }), 'radius');
  });
  test('bound: Abandoned Barracks Site at 9 m (the turn-in of "Signs of a Crash Landing"), once that quest is turned in', () => {
    assert.equal(NP[idOf(SIGNS)].pts.turnin.anchor, 'kib:abandoned-barracks-site'); assert.equal(NP[idOf(SIGNS)].pts.turnin.m, 9);
    assert.equal(M.aion2BoundBy(charOf({ quest: SIGNS }), 'kib:abandoned-barracks-site'), null);
    assert.equal(M.aion2BoundBy(charOf({ quest: next(SIGNS) }), 'kib:abandoned-barracks-site'), 'radius');
    assert.equal(M.aion2BoundBy(charOf({ quest: SIGNS, storyEnd: SIGNS }), 'kib:abandoned-barracks-site'), 'radius');
  });
  test('bound: a bind:<Kibelisk id> tick binds it; regional pick-ups and Sealed Dungeon runs visit their points', () => {
    assert.equal(M.aion2BoundBy(charOf({ checks: { 'bind:kib:galoriks-inspection-area': true } }), 'kib:galoriks-inspection-area'), 'tick');
    assert.equal(M.aion2BoundBy(charOf({ checks: { 'bind:kib:galoriks-inspection-area': false } }), 'kib:galoriks-inspection-area'), null);
    /* the nearest regional giver and dungeon entrance; R set to their metres (an empty save visits nothing else) */
    const nearest = (kind, side) => Object.keys(NP).filter(id => N[id].kind === kind && NP[id].pts[side] && NP[id].pts[side].anchor && NP[id].pts[side].m != null)
      .sort((a, b) => NP[a].pts[side].m - NP[b].pts[side].m)[0];
    const rq = nearest('rq', 'giver'), sd = nearest('sd', 'entrance');
    const kr = NP[rq].pts.giver.anchor, ks = NP[sd].pts.entrance.anchor;
    const at = m => ({ rules: { ...R, bindRadius: Math.max(m, 1) } }), Rr = at(NP[rq].pts.giver.m), Rs = at(NP[sd].pts.entrance.m);
    assert.equal(M.aion2BoundBy(charOf({}), kr, Rr), null);
    assert.equal(M.aion2BoundBy(charOf({ started: { [N[rq].key]: 1 } }), kr, Rr), 'radius', 'picked up');
    assert.equal(M.aion2BoundBy(charOf({ checks: { [N[rq].key]: true } }), kr, Rr), 'radius', 'done');
    assert.equal(M.aion2BoundBy(charOf({}), ks, Rs), null);
    assert.equal(M.aion2BoundBy(charOf({ areaRun: { [N[sd].key]: 1760000000000 } }), ks, Rs), 'radius', 'run started');
    assert.equal(M.aion2BoundBy(charOf({ checks: { [N[sd].key]: true } }), ks, Rs), 'radius', 'cleared');
  });
  test('bound: ticking more, picking up or moving the story on never unbinds a Kibelisk (random progress, 40 saves)', () => {
    const r = rng(202), pick = a => a[Math.floor(r() * a.length)];
    const keys = Object.keys(NP).filter(id => N[id].kind !== 'story').map(id => N[id].key);
    let grew = 0;
    for (let s = 0; s < 40; s++) {
      const qi = Math.floor(r() * (Q.length - 5)), flat = { quest: Q[qi], checks: {}, started: {}, qsteps: {}, areaRun: {} };
      for (let e = 0; e < 6; e++) flat.checks[pick(keys)] = true;
      const c0 = charOf(flat), b0 = boundSet(c0);
      flat.quest = Q[qi + 1 + Math.floor(r() * 4)];
      for (let e = 0; e < 8; e++) { const x = r(), k = pick(keys);
        if (x < 0.4) flat.checks[k] = true; else if (x < 0.6) flat.started[k] = 1; else if (x < 0.75) flat.areaRun[k] = 1;
        else if (x < 0.9) flat.qsteps[flat.quest] = [0]; else flat.checks['bind:' + pick(KIBS)] = true; }
      const b1 = boundSet(charOf(flat));
      assert.deepEqual(b0.filter(k => !b1.includes(k)), [], `save ${s}: unbound by more progress`);
      if (b1.length > b0.length) grew++;
    }
    assert.ok(grew > 20, 'progress binds more: ' + grew);
  });

  /* ---------- the nudge (§8.2) ---------- */
  test('nudge: on the first story target in R < m ≤ 150 m of an unbound Kibelisk, once per Kibelisk; key bind:<Kibelisk id>', () => {
    const shown = Q.map(q => [q, M.aion2NudgeOf(charOf({ quest: q }))]).filter(([, n]) => n);
    assert.ok(shown.length > 5, 'some story positions nudge: ' + shown.length);
    const per = {}; for (const [q, n] of shown) (per[n.kib] = per[n.kib] || []).push(q);
    assert.deepEqual(Object.entries(per).filter(([, qs]) => qs.length > 1), [], 'at most one per Kibelisk');
    for (const [q, n] of shown) {
      const T = NP[idOf(q)].pts.turnin;
      assert.ok(T.anchor === n.kib && T.m === n.m && n.m > R.bindRadius && n.m <= R.nudgeRadius, q);
      assert.equal(n.key, 'bind:' + n.kib); assert.equal(n.name, M.KIBELISKS[n.kib].name);
      assert.ok(Q.slice(0, Q.indexOf(q)).every(p => { const t = NP[idOf(p)].pts.turnin; return !(t && t.anchor === n.kib && t.m > R.bindRadius && t.m <= R.nudgeRadius); }), q + ': the first target in the band');
    }
    /* Galorik's Inspection Area (49 m, design §8.4): nudged on "Crash Site Rendezvous"; gone once ticked */
    const crash = charOf({ quest: 'Crash Site Rendezvous' });
    assert.deepEqual(M.aion2NudgeOf(crash), { kib: 'kib:galoriks-inspection-area', name: "Galorik's Inspection Area", m: 49, key: 'bind:kib:galoriks-inspection-area' });
    assert.equal(M.aion2NudgeOf(charOf({ quest: 'Crash Site Rendezvous', checks: { 'bind:kib:galoriks-inspection-area': true } })), null);
  });
  test('nudge: never for a bound Kibelisk, never at or under R, never beyond 150 m, none once the last quest is turned in', () => {
    assert.equal(M.aion2NudgeOf(charOf({ quest: SIGNS })), null, '9 m: bound when reached, no row');
    const far = Q.find(q => { const t = NP[idOf(q)].pts.turnin; return t && t.anchor && t.m > R.nudgeRadius; });
    assert.ok(far); assert.equal(M.aion2NudgeOf(charOf({ quest: far })), null, far);
    assert.equal(M.aion2NudgeOf(charOf({ quest: 'Crash Site Rendezvous', storyEnd: 'Crash Site Rendezvous' })), null);
    assert.equal(M.aion2NudgeOf(charOf({ quest: '' })), null);
    /* the rule radius decides: with R = 50 m, Galorik's (49 m) is no longer a nudge */
    assert.equal(M.aion2NudgeOf(charOf({ quest: 'Crash Site Rendezvous' }), { rules: { ...R, bindRadius: 50 } }), null);
  });

  /* ---------- teleport vs walk (§8.3) ---------- */
  test('teleport: only to a bound Kibelisk, never with preferRun or "I\'ll walk"; walk − m ≥ the gain on one map; the metres are the data\'s', () => {
    const c = charOf({ quest: next(SS) });
    const target = { zone: NP[idOf(SS)].zone, pt: NP[idOf(SS)].pts.turnin };
    const farHere = { zone: 'zone:elsewhere', pt: { map: target.pt.map, x: target.pt.x + 1000, y: target.pt.y } };
    assert.deepEqual(M.aion2TeleportOf(c, target, { here: farHere }), { kib: 'kib:safe-haven', name: 'Safe Haven', m: 32, scrolls: 1 });
    assert.equal(M.aion2TeleportOf(c, target, { here: farHere, preferRun: true }), null);
    assert.equal(M.aion2TeleportOf(c, target, { here: farHere, walked: true }), null);
    assert.equal(M.aion2TeleportOf(charOf({ quest: SS }), target, { here: farHere }), null, 'Safe Haven not bound yet');
    const near = { zone: 'zone:elsewhere', pt: { map: target.pt.map, x: target.pt.x + 32 + R.teleportGain - 1, y: target.pt.y } };
    assert.equal(M.aion2TeleportOf(c, target, { here: near }), null, 'the gain is one metre short');
    assert.ok(M.aion2TeleportOf(c, target, { here: { ...near, pt: { ...near.pt, x: near.pt.x + 1 } } }), 'the gain met');
    assert.equal(M.aion2TeleportOf(c, target, { here: null }), null, 'no known start');
  });
  test('teleport: a cross-map pair is an unknown distance: teleport only when the zones differ', () => {
    const c = charOf({ quest: next(SS) });
    const target = { zone: NP[idOf(SS)].zone, pt: NP[idOf(SS)].pts.turnin };
    const other = { map: 'reshanta', x: target.pt.x, y: target.pt.y };
    assert.equal(M.placeDistance(other, target.pt), null);
    assert.ok(M.aion2TeleportOf(c, target, { here: { zone: 'zone:elsewhere', pt: other } }), 'another zone');
    assert.equal(M.aion2TeleportOf(c, target, { here: { zone: target.zone, pt: other } }), null, 'the same zone: no distance claim');
    assert.equal(M.aion2TeleportOf(c, { zone: target.zone, pt: null }, { here: { zone: 'zone:elsewhere', pt: other } }), null, 'no point');
  });
  test('travel on deep-frozen input: bound, nudge, teleport and the place hooks write nothing', () => {
    const c = deepFreeze(charOf({ quest: 'Crash Site Rendezvous', qsteps: { [SS]: [0] }, started: {}, areaRun: {}, checks: { 'bind:kib:safe-haven': true } }));
    assert.ok(boundSet(c).length > 0);
    assert.ok(M.aion2NudgeOf(c));
    const t = { zone: NP[idOf(SS)].zone, pt: NP[idOf(SS)].pts.turnin };
    assert.ok(M.aion2TeleportOf(c, t, { here: { zone: 'zone:elsewhere', pt: { map: 'altgard', x: 0, y: 0 } } }));
    assert.deepEqual(M.aion2ObjectivePlace(idOf(SS), 0), { zone: M.KIBELISKS['kib:safe-haven'].zone, pt: null });
  });
};
