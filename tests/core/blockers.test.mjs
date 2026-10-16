/* Blocker-chain text (0.3 E6, docs/design/0.3-requirement-engine.md §4; src/core/blockers.js and its callers in
   src/core/requirements.js / nextup.js): the wording of every leaf, the hop rules (root plus the first named hop, unlock
   nodes skipped), and what the cards ask for: the milestone line and step chips that wait for a turn-in (#73 / E5
   follow-up), the regional row text, the Later cards, the Daevanion card, and the switch that turns it all off. */
import assert from 'node:assert/strict';

const FLAGS = { seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true };
const S = (o = {}) => ({ checks: {}, level: 45, hide: false, open: {}, quest: '', mode: 'advanced', ...FLAGS, ...o });

export default (test, M) => {
  const Q = n => { const i = M.QUESTS.findIndex(q => q[1] === n); assert.ok(i >= 0, n); return i; };
  const at = (n, d = 0) => M.QUESTS[Q(n) + d][1];
  const ALL = Object.keys(M.GATE_CHANGES);
  const withChanges = (names, fn) => { const on = ALL.filter(M.gateChangeOn); M.setGateChanges(names); try { return fn(); } finally { M.setGateChanges(on); } };
  const C = o => M.char(S(o)), txt = (o, k, opts) => { const c = C(o), ev = M.gatesOf(c); return M.blockerText(ev.byKey(k), ev, opts); };

  test('leaf wording: turnedIn / reached story leaf, N = 0, story unset, level', () => {
    const s = (ahead, turnIn) => M.leafText({ kind: 'story', name: 'X', ahead, ...(turnIn ? { turnIn } : {}) });
    assert.equal(s(4, true), 'unlocks after "X" · 3 quests ahead', 'turnedIn: ahead counts the turn-in, the text the quests to X');
    assert.equal(s(2, true), 'unlocks after "X" · 1 quest ahead');
    assert.equal(s(1, true), 'unlocks after "X" · your current quest — turn it in');
    assert.equal(s(3), 'opens on "X" · 3 quests ahead');
    assert.equal(s(null, true), 'unlocks after "X" · set your quest');
    assert.equal(M.leafText({ kind: 'level', need: 27, have: 20 }), 'needs Lv 27');
    assert.equal(M.blockerChain({ blockers: [] }, null), null, 'open: no text');
  });

  test('chains: a story leaf, a named done hop with its root, an unlock hop skipped, omit', () => {
    /* the Noble Belt waits for "Urgent Pursuit" turned in (E5) */
    assert.equal(txt({ quest: 'Urgent Pursuit', level: 13 }, 'g12:belt'), 'unlocks after "Urgent Pursuit" · your current quest — turn it in');
    assert.equal(txt({ quest: at('Urgent Pursuit', -2), level: 13 }, 'g12:belt'), 'unlocks after "Urgent Pursuit" · 2 quests ahead');
    assert.equal(txt({ quest: at('Urgent Pursuit', 1), level: 13 }, 'g12:belt'), '');
    /* stigma slot 1 waits for "The One Who Hears the Voice" (kept rule), itself on "Daeva in a Dream": hop plus root */
    const c = { quest: at('Daeva in a Dream', -3), level: 22 }, ev = M.gatesOf(C(c)), ch = M.blockerChain(ev.byKey('g22:1'), ev);
    assert.equal(ch.text, 'after "The One Who Hears the Voice" (opens on "Daeva in a Dream" · 3 quests ahead)');
    assert.deepEqual(ch.names, ['g22:0', M.GATE_GRAPH.story[Q('Daeva in a Dream')][0]]);
    assert.equal(txt({ quest: 'Daeva in a Dream', level: 22 }, 'g22:1'), 'after "The One Who Hears the Voice" is turned in', 'the hop is open: named alone');
    assert.equal(txt({ quest: 'Daeva in a Dream', level: 20 }, 'g22:1'), 'needs Lv 22', 'display order: level before done');
    assert.equal(txt({ quest: 'Daeva in a Dream', level: 20 }, 'g22:1', { omit: ['level'] }), 'after "The One Who Hears the Voice" (needs Lv 22)', 'the hop\'s own root');
    /* a plan node: the board's window gate (unlock:daevanion) is no name the player knows: its root is shown */
    const dv = M.DV_NODES()[0].k;
    assert.equal(txt({ quest: at('Urgent Pursuit', -1), level: 15 }, dv), 'unlocks after "Urgent Pursuit" · 1 quest ahead');
    assert.equal(txt({ quest: at('Urgent Pursuit', -1), level: 5 }, dv), 'needs Lv 12');
    /* a regional follow-up waits for the quest before it */
    const last = M.QUESTS[M.QUESTS.length - 1][1], end = { quest: last, storyEnd: last, level: 45 }, fus = M.RQ.filter(q => q.after.length);
    assert.ok(fus.length > 5, 'regional follow-ups');
    for (const fu of fus) assert.match(txt(end, 'rq:' + fu.id), new RegExp(`^after "(${fu.after.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})" is turned in$`), fu.name);
  });

  test('milestone line and step chips agree: "Turn in" where a row under it waits for the turn-in (#73, E5)', () => {
    /* g12's furthest story quest is "Cemetery Cleanup" (Spooky Specters under it waits for its turn-in, #73) */
    const g12 = M.GATES.find(g => g.id === 'g12'), up = 'Urgent Pursuit', cc = 'Cemetery Cleanup';
    const L = o => M.storyLineOf(C(o), g12);
    assert.deepEqual(L({ quest: cc, level: 13 }), { q: cc, turnIn: true, ok: false, ahead: 1, chip: 'your current quest — turn it in' });
    assert.deepEqual(L({ quest: at(cc, -2), level: 13 }), { q: cc, turnIn: true, ok: false, ahead: 3, chip: '2 quests ahead' });
    assert.deepEqual(L({ quest: at(cc, 1), level: 13 }), { q: cc, turnIn: true, ok: true, ahead: 0, chip: 'turned in' });
    assert.equal(L({ quest: '', level: 13 }).chip, '', 'story unset: the page says "set your quest"');
    /* the belt's chip says the same as the line (it used to read "your current quest" on Urgent Pursuit: reached) */
    const chip = o => M.stepChipOf(C(o), 'g12:belt', up);
    assert.deepEqual(chip({ quest: up, level: 13 }), { text: 'your current quest — turn it in', title: 'unlocks after "Urgent Pursuit" · your current quest — turn it in', cls: 'now' });
    assert.deepEqual(chip({ quest: at(up, -2), level: 13 }), { text: '2 quests ahead', title: 'unlocks after "Urgent Pursuit" · 2 quests ahead', cls: 'ahead' });
    /* a chain with a hop keeps its whole text (it names the step before) */
    assert.equal(M.stepChipOf(C({ quest: at('Daeva in a Dream', -3), level: 22 }), 'g22:1', 'Daeva in a Dream').text, 'after "The One Who Hears the Voice" (opens on "Daeva in a Dream" · 3 quests ahead)');
    assert.deepEqual(chip({ quest: at(up, 1), level: 13 }), { text: 'story: passed', cls: '' });
    assert.equal(chip({ quest: '', level: 13 }), null, 'story unset: empty chip, as before');
    /* a step gated on "reached": the line reads "Reach" where no row waits for a turn-in */
    const reach = M.GATES.map(g => [g, M.storyLineOf(C({ quest: '', level: 45 }), g)]).filter(([, x]) => x && !x.turnIn);
    for (const [g, x] of reach) assert.equal(M.storyLineOf(C({ quest: x.q, level: 45 }), g).chip, 'reached', g.id);
    /* switch off: the 0.2 / E5 line (reached) */
    withChanges(ALL.filter(n => n !== 'blockerText'), () => assert.deepEqual(L({ quest: cc, level: 13 }), { q: cc, turnIn: false, ok: true, ahead: 0, chip: 'reached' }));
  });

  test('regional row, Later cards, Daevanion: the same words; nothing once open', () => {
    const q = M.RQ.find(x => x.name === "Traveling Merchant's Conundrum");
    assert.equal(M.rqReqOf(C({ quest: at('Blood Monument', -3), level: 33 }), 'rq:' + q.id), 'unlocks after "Blood Monument" · 3 quests ahead');
    assert.equal(M.rqReqOf(C({ quest: at('Blood Monument', 1), level: 33 }), 'rq:' + q.id), '');
    const lv4 = { quest: M.QUESTS.find(x => x[0] >= 4)[1], level: 4 }, later = M.rankNext(S(lv4)).filter(a => a.kind === 'laterSkill');
    assert.ok(later.length, 'a Later skill card at Lv 4');
    for (const a of later) assert.equal(a.why, `needs Lv ${a.x.req}`);
    assert.ok(!M.rankNext(S({ ...lv4, mode: 'basic' }), { basic: true }).some(a => a.later), 'Basic: no Later cards');
    assert.equal(M.dvWaitOf(C({ quest: at('Urgent Pursuit', -2), level: 15 }), M.DV_NODES()[0].board).text, 'unlocks after "Urgent Pursuit" · 2 quests ahead');
  });

  test('wording shared with the Ascension bar (E8): one blocker reads the same through leafText', () => {
    const b = { kind: 'story', name: 'Verdant Melody', ahead: 1, turnIn: true };
    assert.equal(M.leafText(b), 'unlocks after "Verdant Melody" · your current quest — turn it in');
    assert.equal(M.questsAhead(b), 0);
  });
};
