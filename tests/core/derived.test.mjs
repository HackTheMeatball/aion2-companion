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
    assert.deepEqual(ALL, ['regionalTurnedIn', 'derived', 'storyStepDerived', 'followUps', 'turnInLevel', 'clearTally', 'stepNotes',
      'merchantGate', 'lestWeForgetGate', 'beltGate', 'amuletGate', 'daevanionGate', 'ascensionBar', 'blockerText', 'specialtySlots']);
    assert.ok(ALL.every(M.gateChangeOn), 'all on by default');
    withChanges(['clearTally'], () => assert.deepEqual(ALL.filter(M.gateChangeOn), ['followUps', 'clearTally']));
    withChanges([], () => assert.deepEqual(ALL.filter(M.gateChangeOn), []));
    assert.throws(() => M.setGateChanges(['nope']), /unknown change/);
    assert.ok(ALL.every(M.gateChangeOn), 'restored');
  });

  /* E9 (owner, 2026-10-15): story steps that clear a stronghold or run an Expedition, and the regional story gates */
  test('Graverobber Den: done by Cemetery Cleanup step 4 ticked or the quest turned in; derived, never written; off without "storyStepDerived"', () => {
    const k = 'sh:graverobber-den', key = M.AREA_ITEMS.find(x => x.it.name === 'Graverobber Den').k, cc = 'Cemetery Cleanup';
    const done = s => M.doneOf(M.char(s), key), step4 = { [cc]: [4] };
    assert.equal(done(S({ quest: cc })), false);
    assert.equal(done(S({ quest: cc, qsteps: { [cc]: [3] } })), false, 'another step does not clear it');
    assert.equal(done(S({ quest: cc, qsteps: step4 })), true);
    assert.equal(done(S({ quest: at(cc, 1) })), true, 'turned in (the next quest is current)');
    assert.equal(done(S({ quest: at(cc, -1), qsteps: step4 })), true, 'a stored objective tick counts wherever the story is now (it is only written on that quest)');
    const s = S({ quest: cc, qsteps: step4 });
    assert.equal(M.derivedOf(M.char(s), key).via.startsWith('step '), true);
    assert.equal(s.checks[key], undefined, 'nothing is written');
    assert.equal(M.clearDoneOf(M.char(s), key), true, 'Progress counts it like a ticked clear (clearTally)');
    withChanges(['regionalTurnedIn', 'derived', 'followUps', 'turnInLevel'], () => { assert.equal(done(s), false); assert.equal(M.clearDoneOf(M.char(s), key), false); });
    assert.equal(k, 'sh:graverobber-den');
  });
  test('Expedition rows (g20:exp Krao Cave, g35:exp Fire Temple): done by the story step ticked or the quest turned in', () => {
    for (const [row, quest, i] of [['g20:exp', 'Disturbed Balance', 2], ['g35:exp', 'Mirror of Greed', 1]]) {
      const done = s => M.doneOf(M.char(s), row);
      assert.match(M.objTextOf(quest, i), /This is your first run of the .* Expedition\.$/, quest + ' step note');
      assert.equal(done(S({ quest })), false);
      assert.equal(done(S({ quest, qsteps: { [quest]: [i] } })), true);
      assert.equal(done(S({ quest: at(quest, 1) })), true);
      withChanges(['regionalTurnedIn', 'derived'], () => assert.equal(done(S({ quest, qsteps: { [quest]: [i] } })), false, 'off without storyStepDerived'));
    }
    assert.match(M.objTextOf("Canyon's Secret", 1), /first run of the Urugugu Canyon Expedition\.$/);
    assert.match(M.objTextOf('Forgotten Commander', 1), /This is probably your first run of the Draupnir Expedition\.$/, 'inferred until the owner confirms');
  });
  test('story step notes: shown after the objective (switch stepNotes), never part of the text the page parses', () => {
    const noted = Object.entries(M.QUEST_STEP_NOTES).flatMap(([q, o]) => Object.keys(o).map(i => [q, +i]));
    assert.deepEqual(noted.map(([q, i]) => `${q} #${i}`).sort(), ["Canyon's Secret #1", 'Disturbed Balance #2', 'Forgotten Commander #1', 'Mirror of Greed #1']);
    for (const [q, i] of noted) {
      const t = M.QUEST_STEPS[q][i];
      assert.doesNotMatch(t, /first run/, q + ': the objective text stays what the source says');
      assert.ok(M.objTextOf(q, i).startsWith(t.replace(/\.$/, '')) && M.objTextOf(q, i).endsWith(M.QUEST_STEP_NOTES[q][i]), q + ': note after the text');
      withChanges(ALL.filter(n => n !== 'stepNotes'), () => assert.equal(M.objTextOf(q, i), t, q + ': off without stepNotes'));
    }
    assert.equal(M.objTextOf('Disturbed Balance', 0), M.QUEST_STEPS['Disturbed Balance'][0], 'an objective without a note is its text');
    /* the checklists' split (bold part, small part): the note is always in the small part (#73 review: Draupnir has no " — ") */
    for (const [q, i] of noted) { const [a, b] = M.objPartsOf(q, i), [ta] = M.QUEST_STEPS[q][i].split(' — ');
      assert.equal(a, ta.replace(/\.$/, ''), q + ': bold part is the objective only'); assert.ok(b.endsWith(M.QUEST_STEP_NOTES[q][i]), q + ': note in the small part'); }
    assert.deepEqual(M.objPartsOf('Forgotten Commander', 1), [M.QUEST_STEPS['Forgotten Commander'][1], M.QUEST_STEP_NOTES['Forgotten Commander'][1]]);
    assert.deepEqual(M.objPartsOf('Disturbed Balance', 0), M.QUEST_STEPS['Disturbed Balance'][0].split(' — '), 'no note: as before');
    withChanges(ALL.filter(n => n !== 'stepNotes'), () => assert.deepEqual(M.objPartsOf('Forgotten Commander', 1), [M.QUEST_STEPS['Forgotten Commander'][1], undefined]));
  });
  test('regional quests open when the story quest is turned in (switch regionalTurnedIn); Shugo-of-All-Trades and Spooky Specters gained that gate', () => {
    const rq = n => M.RQ.find(q => q.name === n), st = (n, quest, level = 45) => M.rqStatus(M.char(S({ quest, level })), rq(n)).open;
    const f = rq('Fight Poison with Poison');
    assert.equal(f.turnedIn, true);
    assert.equal(st(f.name, f.story), false, 'on the story quest: not yet');
    assert.equal(st(f.name, at(f.story, 1)), true, 'turned in');
    withChanges(['derived'], () => { assert.equal(st(f.name, f.story), true, '0.2: reached is enough'); });
    for (const [n, gate] of [['Shugo-of-All-Trades: Asmodian', 'Contaminated Area'], ['Spooky Specters', 'Cemetery Cleanup']]) {
      assert.equal(rq(n).story, gate);
      assert.equal(st(n, gate), false, n + ': not offered while ' + gate + ' is current');
      assert.equal(st(n, at(gate, 1)), true, n + ': appears once ' + gate + ' is turned in');
      withChanges([], () => { assert.equal(st(n, at(gate, 1), 11), false, '0.2: from its recommended level'); });
    }
  });

  /* E5 (2026-10-16): the ready proposals of design §7, live; each switch off gives the gate from before */
  test('E5 gates: Traveling Merchant\'s Conundrum, Lest We Forget, Noble Belt, Revelation Amulet, Daevanion boards (switches off: as before)', () => {
    const rq = n => M.RQ.find(q => q.name === n), st = (n, quest, level = 45) => M.rqStatus(M.char(S({ quest, level })), rq(n)).open;
    for (const [n, gate, sw] of [["Traveling Merchant's Conundrum", 'Blood Monument', 'merchantGate'], ['Lest We Forget', "Zikel's Core", 'lestWeForgetGate']]) {
      const q = rq(n);
      assert.equal(q.story, gate); assert.equal(q.turnedIn, true); assert.ok(!q.noPre, n + ': prerequisite data now');
      assert.equal(st(n, gate), false, n + ': not while ' + gate + ' is current');
      assert.equal(st(n, at(gate, 1)), true, n + ': once ' + gate + ' is turned in');
      withChanges(ALL.filter(x => x !== sw), () => { assert.equal(st(n, gate), true, n + ': switch off, open from its recommended level');
        assert.equal(st(n, at(gate, 1), q.rec - 1), false, n + ': switch off, not below its recommended level'); });
    }
    const open = (k, quest, level) => M.openOf(M.char(S({ quest, level })), k);
    for (const [k, gate, lv, sw] of [['g12:belt', 'Urgent Pursuit', 13, 'beltGate'], ['g16:amulet', 'Buried Atrocities', 16, 'amuletGate']]) {
      assert.equal(open(k, gate, lv), false, k + ': not while ' + gate + ' is current');
      assert.equal(open(k, at(gate, 1), lv), true, k + ': once ' + gate + ' is turned in');
      assert.equal(open(k, at(gate, 1), lv - 1), false, k + ': still needs its level');
      withChanges(ALL.filter(x => x !== sw), () => assert.equal(open(k, '', lv), true, k + ': switch off, level only'));
    }
    const n = M.DV_NODES()[0];
    assert.equal(M.dvNext(M.char(S({ quest: 'Urgent Pursuit', level: 20 }))), undefined, 'boards wait for "Urgent Pursuit" turned in');
    assert.equal(M.dvOpen(M.char(S({ quest: '', level: 45 }))), false, 'story unset: the Daevanion card stays shut');
    assert.equal(M.dvNext(M.char(S({ quest: at('Urgent Pursuit', 1), level: 20 }))), n);
    assert.deepEqual(M.DV_NODES().filter(it => M.openOf(M.char(S({ quest: at('Urgent Pursuit', 1), level: 45 })), it.k)).length, M.DV_NODES().length, 'every plan node inherits it, nothing else');
    withChanges(ALL.filter(x => x !== 'daevanionGate'), () => assert.equal(M.dvNext(M.char(S({ quest: '', level: 20 }))), n, 'switch off: board level only'));
    /* the Daevanion card's "opens …" text: the level while it is above yours, then the story quest; nothing once open */
    const wait = (quest, level, b = n.board) => M.dvWaitOf(M.char(S({ quest, level })), b);
    assert.deepEqual(wait('Urgent Pursuit', 11), { lv: 12 });
    /* E6: with its blocker text (src/core/blockers.js) */
    assert.deepEqual(wait('Urgent Pursuit', 15), { lv: 12, story: 'Urgent Pursuit', text: 'unlocks after "Urgent Pursuit" · your current quest — turn it in' });
    assert.deepEqual(wait(at('Urgent Pursuit', -2), 15), { lv: 12, story: 'Urgent Pursuit', text: 'unlocks after "Urgent Pursuit" · 2 quests ahead' });
    assert.deepEqual(wait('', 15), { lv: 12, story: 'Urgent Pursuit', text: 'unlocks after "Urgent Pursuit" · set your quest' }, 'story unset');
    assert.equal(wait(at('Urgent Pursuit', 1), 15), null);
    assert.deepEqual(wait(at('Urgent Pursuit', 1), 15, 'Zikel'), { lv: 20 });
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
    assert.equal(last, 'Daeva Trapped in a Nightmare', 'E10: the story data ends at the wrapper of Witnesses');
    assert.equal(der(S({ quest: last, storyEnd: last }), 'g45:0'), null);
  });

  test('"Put … on E" (g27:1): derived once stigma slot 2 (g27:0) is marked equipped', () => {
    assert.equal(der(S({ level: 27, quest: at('Daeva in a Dream', 5), checks: { 'g27:0': true } }), 'g27:1').via, 'done g27:0');
    assert.equal(der(S({ level: 27, quest: at('Daeva in a Dream', 5) }), 'g27:1'), null);
  });

  test('regional follow-up (Q3): picking up or ticking a follow-up makes its sourced / owner prerequisites done, transitively', () => {
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
    /* Deep Shadow (2202011) → Past and Present (2202010): owner-confirmed 2026-10-16 (check 9), so it proves too
       (an owner-check edge never does: tests/core/evaluator.test.mjs, followUps) */
    assert.equal(der(S({ level: lv, quest, started: { 'rq:2202011': 1 } }), 'rq:2202010').via, 'followUp rq:2202011');
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
