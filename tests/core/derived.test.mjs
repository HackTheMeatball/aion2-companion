/* Derived completion and the other 0.3 E4 changes (docs/design/0.3-requirement-engine.md §5, §13, §16 Q3 / Q4 / Q10),
   on the live data through the page's gate functions (src/core/requirements.js gatesOf, doneOf, derivedOf, countsOf,
   turnInNeedsLv) and Next up: one case per derivation kind (story quest, byStory step, wrapper quest, "Put … on E",
   regional follow-up), the switches tests/golden.js --explain uses, A3 (a stored false shows again once the story moves
   back), nothing written, and the Lv 44 "Turned in" on Forgotten Commander. */
import assert from 'node:assert/strict';

const FLAGS = { seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true };
const S = (o = {}) => ({ checks: {}, level: 45, hide: false, open: {}, quest: '', mode: 'advanced', ...FLAGS, ...o });
const deepFreeze = o => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); } return o; };

export default (test, M) => {
  const Q = n => { const i = M.QUESTS.findIndex(q => q[1] === n); assert.ok(i >= 0, n); return i; };
  const at = (n, d = 0) => M.QUESTS[Q(n) + d][1];
  const ALL = Object.keys(M.GATE_CHANGES);
  /* run fn with exactly these changes on, then restore the page's set */
  const withChanges = (names, fn) => { const on = ALL.filter(M.gateChangeOn); M.setGateChanges(names); try { return fn(); } finally { M.setGateChanges(on); } };
  const der = (s, k) => M.derivedOf(M.char(s), k);

  test('E4 switches: the page runs with every change on; a change turns on the rule it needs; an unknown name throws', () => {
    assert.deepEqual(ALL, ['derived', 'followUps', 'turnInLevel', 'clearTally']);
    assert.ok(ALL.every(M.gateChangeOn), 'all on by default');
    withChanges(['clearTally'], () => assert.deepEqual(ALL.filter(M.gateChangeOn), ['followUps', 'clearTally']));
    withChanges([], () => assert.deepEqual(ALL.filter(M.gateChangeOn), []));
    assert.throws(() => M.setGateChanges(['nope']), /unknown change/);
    assert.ok(ALL.every(M.gateChangeOn), 'restored');
  });

  test('story quests: done once the story is past them (or on the last one with storyEnd), never ticked', () => {
    const ev = s => M.gatesOf(M.char(s)), id = M.GATE_GRAPH.story[Q('Buried Atrocities')][0];
    assert.equal(ev(S({ quest: at('Buried Atrocities', 1) })).node(id).done, 'derived');
    assert.equal(ev(S({ quest: 'Buried Atrocities' })).node(id).done, false);
    const last = M.GATE_GRAPH.story[M.QUESTS.length - 1];
    assert.equal(ev(S({ quest: last[1] })).node(last[0]).done, false);
    assert.equal(ev(S({ quest: last[1], storyEnd: last[1] })).node(last[0]).done, 'derived');
  });

  test('byStory step (g16:0 "Buried Atrocities"): derived once the story is past it, not on it; off without "derived"', () => {
    const past = S({ level: 16, quest: at('Buried Atrocities', 1) });
    assert.equal(der(past, 'g16:0').via, 'turnedIn sq:2102100');
    assert.equal(M.doneOf(M.char(past), 'g16:0'), true);
    assert.equal(der(S({ level: 16, quest: 'Buried Atrocities' }), 'g16:0'), null);
    withChanges([], () => { assert.equal(der(past, 'g16:0'), null); assert.equal(M.doneOf(M.char(past), 'g16:0'), false); });
  });

  test('A3: a stored false is ignored while the derivation holds and counts again once the story moves back; never rewritten', () => {
    const s = deepFreeze(S({ level: 16, quest: at('Buried Atrocities', 3), checks: { 'g16:0': false } })), g = M.GATES.find(g => g.id === 'g16');
    assert.equal(M.doneOf(M.char(s), 'g16:0'), true);
    const back = S({ level: 16, quest: 'Buried Atrocities', checks: { 'g16:0': false } });
    assert.equal(M.doneOf(M.char(back), 'g16:0'), false);
    assert.equal(back.checks['g16:0'], false, 'the stored false is still there');
    /* counts: the derived row counts as done (milestone counts and tags) */
    const [d1] = M.countsOf(s, g), [d0] = withChanges([], () => M.countsOf(s, g));
    const dv = M.checkableOf(s, g).filter(x => der(s, x.k)).map(x => x.k);
    assert.deepEqual(dv, ['g16:0', 'g16:monolith'], 'both byStory steps are past');
    assert.equal(d1, d0 + 2, `derived rows count (${d0} → ${d1})`);
  });

  test('wrapper rule, g22:0 (live since owner approval): "The One Who Hears the Voice" done once "Daeva in a Dream" is turned in; stigmas follow', () => {
    const past = S({ level: 22, quest: at('Daeva in a Dream', 1) }), on = S({ level: 22, quest: 'Daeva in a Dream' });
    assert.equal(der(past, 'g22:0').via, 'turnedIn sq:2102185');
    assert.equal(der(on, 'g22:0'), null);
    assert.equal(M.stigmaUnlocked(M.char(past)), true, 'the stigma slots that wait for g22:0 open');
    withChanges(['derived'], () => assert.ok(der(past, 'g22:0'), 'the live completesWith holds with derived'));
    withChanges([], () => assert.equal(der(past, 'g22:0'), null, 'without derived: the tick only, as in 0.2'));
  });

  test('wrapper rule, g32:dreams (live since owner approval): done once "A Daeva Dreaming Anew" is turned in; g45:0 is never derived (Q9 / E10)', () => {
    assert.equal(der(S({ level: 32, quest: at('A Daeva Dreaming Anew', 1) }), 'g32:dreams').via, 'turnedIn sq:2102345');
    assert.equal(der(S({ level: 32, quest: 'A Daeva Dreaming Anew' }), 'g32:dreams'), null);
    const last = M.QUESTS[M.QUESTS.length - 1][1];
    assert.equal(der(S({ quest: last, storyEnd: last }), 'g45:0'), null);
  });

  test('"Put … on E" (g27:1): derived once stigma slot 2 (g27:0) is marked equipped', () => {
    assert.equal(der(S({ level: 27, quest: at('Daeva in a Dream', 5), checks: { 'g27:0': true } }), 'g27:1').via, 'done g27:0');
    assert.equal(der(S({ level: 27, quest: at('Daeva in a Dream', 5) }), 'g27:1'), null);
  });

  test('regional follow-up (Q3): picking up or ticking a follow-up makes its sourced prerequisites done, transitively; not owner-check edges', () => {
    const lv = 30, quest = at('Daeva in a Dream', 10);
    /* In the Fang Legion's Name (2202017) needs Blade of Vengeance (2202016) and Odyle Jelly (2202014), both sourced */
    const picked = S({ level: lv, quest, started: { 'rq:2202017': 1 } });
    assert.equal(der(picked, 'rq:2202016').via, 'followUp rq:2202017');
    assert.equal(der(picked, 'rq:2202014').via, 'followUp rq:2202017');
    assert.ok(der(S({ level: lv, quest, checks: { 'rq:2202017': true } }), 'rq:2202016'), 'ticked works too');
    assert.equal(der(S({ level: lv, quest, started: { 'rq:2202017': 0 } }), 'rq:2202016'), null, 'started 0 is not picked up');
    /* transitive: Nine Wonders: Final Stretch (2202071) → 2nd Leg (2202070) → its own prerequisite (2202053) */
    const fs = S({ level: 45, quest: M.QUESTS[M.QUESTS.length - 1][1], started: { 'rq:2202071': 1 } });
    assert.equal(der(fs, 'rq:2202070').via, 'followUp rq:2202071');
    assert.equal(der(fs, 'rq:2202053').via, 'followUp rq:2202070');
    /* Deep Shadow (2202011) → Past and Present (2202010) is an owner-check edge (its only source was withdrawn): no proof */
    assert.equal(der(S({ level: lv, quest, started: { 'rq:2202011': 1 } }), 'rq:2202010'), null);
    /* the follow-up's own lock lifts: rqStatus has no "pre" left for the proven quest */
    const c = M.char(S({ level: lv, quest, checks: { 'rq:2202014': true }, started: { 'rq:2202017': 1 } })), q = M.RQ.find(q => q.id === 2202017 || q.id === '2202017');
    assert.deepEqual(M.rqStatus(c, q).pre, []);
    withChanges([], () => assert.deepEqual(M.rqStatus(c, q).pre, ['Blade of Vengeance']));
  });

  test('clear reward tally (clearTally): a regional quest derived as done counts like a ticked one; computed, never written', () => {
    const s = deepFreeze(S({ level: 30, quest: at('Daeva in a Dream', 10), checks: { 'rq:2202016': false }, started: { 'rq:2202017': 1 } })), c = M.char(s);
    assert.equal(M.clearDoneOf(c, 'rq:2202016'), true, 'derived (its follow-up is picked up), the stored false ignored');
    assert.equal(M.clearDoneOf(c, 'rq:2202017'), false, 'the follow-up itself is only picked up');
    assert.ok(M.CLEAR_REWARD('rq:2202016').st > 0, 'the quest has a clear reward');
    assert.equal(M.clearDoneOf(M.char(S({ checks: { 'rq:2202017': true } })), 'rq:2202017'), true, 'ticked');
    withChanges(ALL.filter(n => n !== 'clearTally'), () => assert.equal(M.clearDoneOf(c, 'rq:2202016'), false, 'off: the tick only'));
    assert.equal(c.checks['rq:2202016'], false, 'nothing written');
  });

  test('nothing is written: rankNext, countsOf and the evaluator on deep-frozen saves with derived rows', () => {
    const s = deepFreeze(S({ level: 32, quest: at('A Daeva Dreaming Anew', 2), checks: { 'g16:0': false, 'g22:0': false }, started: { 'rq:2202017': 1 } }));
    const before = JSON.stringify(s);
    M.rankNext(s); M.rankNext(s, { basic: true }); M.GATES.forEach(g => M.countsOf(s, g)); M.gatesOf(M.char(s)).list();
    assert.equal(JSON.stringify(s), before);
  });

  test('Next up never offers a derived-done step or regional quest', () => {
    const s = S({ level: 22, quest: at('Daeva in a Dream', 1), started: { 'rq:2202017': 1 } });
    const ks = M.rankNext(s).flatMap(a => a.kind === 'rq' ? a.open.map(x => x.k) : a.x && a.x.k ? [a.x.k] : []);
    assert.ok(!ks.includes('g22:0') && !ks.includes('rq:2202016'), ks.join(' '));
    assert.ok(withChanges([], () => M.rankNext(s)).some(a => a.x && a.x.k === 'g22:0'), 'with the changes off, 0.2 offers g22:0');
  });

  /* Lv 44 edge case (Q10 follow-up): Forgotten Commander's unlock level is 45; Farewells before it is also rec 45 but has
     no unlock-level atom, so a Lv 44 player can turn it in (level-gated card, all objectives ticked) and stand on
     Forgotten Commander at Lv 44; Level − after ticking at 45 and an imported save get there too (journey suite). */
  test('Lv 44 "Forgotten Commander": every objective ticked, no "Turned in" below its unlock level (45); at 45 it is offered', () => {
    const n = M.QUEST_STEPS['Forgotten Commander'].length, qs = { 'Forgotten Commander': Array.from({ length: n }, (_, i) => i) };
    const card = s => M.rankNext(S(s)).find(a => a.story);
    const s44 = { level: 44, quest: 'Forgotten Commander', qsteps: qs, showTalk: true };
    assert.equal(M.turnInNeedsLv(M.char(S(s44))), 45);
    assert.equal(card(s44).act, '', 'no Turned in at Lv 44');
    assert.equal(card(s44).turnInLv, 45, 'the card says when (main.js storyView: "Turn in at Lv 45")');
    assert.equal(card({ ...s44, level: 45 }).act, 'story');
    assert.equal(card({ ...s44, level: 45 }).turnInLv, undefined);
    assert.equal(M.turnInNeedsLv(M.char(S({ ...s44, level: 45 }))), 0);
    withChanges(ALL.filter(n => n !== 'turnInLevel'), () => assert.equal(card(s44).act, 'story', 'without the fix: the E3 bug'));
    /* the quest before it (Farewells, rec 45, no unlock atom) can be turned in at Lv 44: that is how normal play gets here */
    const fw = M.QUEST_STEPS['Farewells'] || [];
    assert.equal(card({ level: 44, quest: 'Farewells', qsteps: { Farewells: fw.map((_, i) => i) }, showTalk: true }).act, fw.length ? 'story' : '');
    /* Finding Nemon (unlock Lv 10) has no objective list: below 10 its card never had an action */
    assert.equal(M.turnInNeedsLv(M.char(S({ level: 9, quest: 'Finding Nemon' }))), 10);
  });
};
