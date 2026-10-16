/* The Ascension bar (0.3 E8, docs/design/0.3-requirement-engine.md §11; src/core/ascension.js): 0–4 / 4 from the wrapper
   quests (derived, §5) and from the guide step ticks, the label (next chapter and its blocker, the 4 / 4 line), the owner's
   Ascension Gauge Level 1 tooltip (2026-10-15: "Verdant Melody" complete + 100% gauge before "The One Who Hears the
   Voice"), and nothing written. */
import assert from 'node:assert/strict';

const FLAGS = { seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true };
const S = (o = {}) => ({ checks: {}, level: 45, hide: false, open: {}, quest: '', mode: 'advanced', ...FLAGS, ...o });
const deepFreeze = o => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); } return o; };

export default (test, M) => {
  const Q = n => { const i = M.QUESTS.findIndex(q => q[1] === n); assert.ok(i >= 0, n); return i; };
  const at = (n, d = 0) => M.QUESTS[Q(n) + d][1];
  const asc = s => M.ascensionOf(M.char(s));
  const ALL = Object.keys(M.GATE_CHANGES);
  const withChanges = (names, fn) => { const on = ALL.filter(M.gateChangeOn); M.setGateChanges(names); try { return fn(); } finally { M.setGateChanges(on); } };
  const OATH = 'Ascension 4 / 4 in Altgard · The One Who Swears the Oath is at Lv 49';

  test('E8: 4 in-cap chapters in order; Swears the Oath (Lv 49) is not a segment', () => {
    const a = asc(S());
    assert.deepEqual(a.chapters.map(x => x.name), ['The One Who Perceives', 'The One Who Hears the Voice', 'The One Who Dreams', 'The One Who Witnesses the Nightmare']);
    assert.equal(a.total, 4);
    assert.deepEqual([a.oath.name, a.oath.lv], ['The One Who Swears the Oath', 49]);
  });
  test('E8 from wrappers: 0 / 4 → 3 / 4 as Spread Your Wings, Daeva in a Dream, A Daeva Dreaming Anew are turned in (derived); Witnesses has no wrapper yet', () => {
    const cases = [
      ['', 0, 'Ascension 0 / 4 · next: The One Who Perceives · set your quest'],
      [at('Spread Your Wings'), 0, 'Ascension 0 / 4 · next: The One Who Perceives · open now'],
      [at('Spread Your Wings', 1), 1, null],
      [at('Daeva in a Dream'), 1, 'Ascension 1 / 4 · next: The One Who Hears the Voice · needs Ascension Gauge at 100%'],
      [at('Daeva in a Dream', 1), 2, null],
      [at('A Daeva Dreaming Anew', 1), 3, null],
    ];
    for (const [quest, n, label] of cases) {
      const a = asc(S({ quest }));
      assert.equal(a.n, n, quest || '(unset)');
      assert.ok(a.chapters.slice(0, n).every(x => x.done === 'derived') && a.chapters.slice(n).every(x => !x.done), quest);
      if (label) assert.equal(a.label, label, quest);
    }
    const end = asc(S({ quest: 'Forgotten Commander', storyEnd: 'Forgotten Commander' }));
    assert.equal(end.n, 3, 'Witnesses is done by its tick only (its wrapper is not in the data, Q7)');
    assert.equal(end.label, 'Ascension 3 / 4 · next: The One Who Witnesses the Nightmare · open now');
    assert.equal(asc(S({ quest: 'Forgotten Commander', storyEnd: 'Forgotten Commander', checks: { 'g45:0': true } })).label, OATH);
  });
  test('E8 from ticks (story unset): g6:0, g22:0, g32:dreams, g45:0 fill one chapter each; 4 / 4 reads the Oath line', () => {
    const keys = ['g6:0', 'g22:0', 'g32:dreams', 'g45:0'], checks = {};
    keys.forEach((k, i) => {
      checks[k] = true;
      const a = asc(S({ checks: { ...checks } }));
      assert.equal(a.n, i + 1, k);
      assert.ok(a.chapters.slice(0, i + 1).every(x => x.done === 'tick'), k);
      if (i < 3) assert.equal(a.next.name, a.chapters[i + 1].name, k);
    });
    assert.equal(asc(S({ checks })).label, OATH);
    assert.equal(asc(S({ checks: { 'g45:0': true } })).n, 1, 'a chapter is filled by its own tick or wrapper, never inferred from a later one');
    assert.equal(asc(S({ checks: { 'g6:0': false } })).n, 0, 'a stored false is no tick');
  });
  test('E8: g6:0 done by the story ("The Being Beneath the Lake" turned in) is not Perceives done; Spread Your Wings turned in is', () => {
    const s = S({ quest: at('Spread Your Wings') });
    assert.equal(M.doneOf(M.char(s), 'g6:0'), true, 'g6:0 is derived done here');
    assert.equal(asc(s).n, 0);
  });
  test('E8 label: the next chapter\'s blocker (§4 words, the game\'s quest name) and the gauge from its player atom', () => {
    assert.equal(asc(S({ quest: M.QUESTS[0][1], level: 1 })).label, `Ascension 0 / 4 · next: The One Who Perceives · unlocks after "The Being Beneath the Lake" · ${Q('The Being Beneath the Lake')} quests ahead`);
    /* owner, 2026-10-15 (Ascension Gauge Level 1 tooltip): "Verdant Melody" complete and 100% gauge, for The One Who Hears the Voice */
    const vm = S({ quest: 'Verdant Melody', checks: { 'g6:0': true } });
    assert.equal(asc(vm).label, 'Ascension 1 / 4 · next: The One Who Hears the Voice · unlocks after "Verdant Melody" · your current quest · needs Ascension Gauge at 100%');
    assert.equal(asc(S({ quest: at('Verdant Melody', -2), checks: { 'g6:0': true } })).next.text, 'unlocks after "Verdant Melody" · 2 quests ahead · needs Ascension Gauge at 100%');
    assert.equal(asc(S({ quest: at('A Daeva Dreaming Anew', -1), checks: { 'g6:0': true, 'g22:0': true } })).next.text,
      `unlocks after "${at('A Daeva Dreaming Anew', -1)}" · your current quest · needs Ascension Gauge at 100%`, 'Dreams: reached "A Daeva Dreaming Anew" = the quest before it turned in');
    assert.equal(asc(S({ quest: 'Farewells', checks: { 'g6:0': true, 'g22:0': true, 'g32:dreams': true } })).next.text, 'unlocks after "Forgotten Commander" · 1 quest ahead', 'no gauge claim at 45 (no source)');
    assert.equal(asc(S({ quest: 'Forgotten Commander', checks: { 'g6:0': true, 'g22:0': true, 'g32:dreams': true } })).next.text, 'unlocks after "Forgotten Commander" · your current quest');
  });
  test('E8: blockerText (E8\'s copy of the §4 wording until E6\'s formatter replaces it)', () => {
    assert.equal(M.blockerText({ kind: 'level', need: 27, have: 20 }), 'needs Lv 27');
    assert.equal(M.blockerText({ kind: 'story', name: 'X', ahead: null }), 'set your quest');
    assert.equal(M.blockerText({ kind: 'story', name: 'X', ahead: 3 }), 'opens on "X" · 3 quests ahead');
    assert.equal(M.blockerText({ kind: 'story', name: 'X', ahead: 1, turnIn: true }), 'unlocks after "X" · your current quest');
    assert.equal(M.blockerText({ kind: 'story', name: 'X', ahead: 2, turnIn: true }), 'unlocks after "X" · 1 quest ahead');
  });
  test('E8: with "derived" off the wrappers fill nothing (the bar follows the page\'s switches); ticks still do', () => {
    withChanges(['regionalTurnedIn'], () => {
      assert.equal(asc(S({ quest: at('A Daeva Dreaming Anew', 1) })).n, 0);
      assert.equal(asc(S({ checks: { 'g6:0': true, 'g22:0': true } })).n, 2);
    });
  });
  test('E8: informational only, nothing written (deep-frozen save)', () => {
    const s = deepFreeze(S({ quest: at('Daeva in a Dream', 1), checks: { 'g45:0': false } }));
    assert.doesNotThrow(() => asc(s));
    assert.deepEqual(s.checks, { 'g45:0': false });
  });
};
