/* The Ascension bar (0.3 E8, docs/design/0.3-requirement-engine.md §11; src/core/ascension.js): 0–4 / 4 from the wrapper
   quests (derived, §5) and from the guide step ticks, the label (owner, 2026-10-16: "Ascension n / 4 · next: <name>", the
   gauge note only where sourced: II owner tooltip 2026-10-15, III claim C36; no story position, the timeline shows it;
   the Oath line at 4 / 4), and nothing written. */
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
  const OATH = 'Ascension 4 / 4 · next: Swears the Oath (Lv 49)';

  test('E8: 4 in-cap chapters in order; Swears the Oath (Lv 49) is not a segment', () => {
    const a = asc(S());
    assert.deepEqual(a.chapters.map(x => x.name), ['The One Who Perceives', 'The One Who Hears the Voice', 'The One Who Dreams', 'The One Who Witnesses the Nightmare']);
    assert.equal(a.total, 4);
    assert.deepEqual([a.oath.name, a.oath.lv], ['The One Who Swears the Oath', 49]);
  });
  test('E8 from wrappers: 0 / 4 → 3 / 4 as Spread Your Wings, Daeva in a Dream, A Daeva Dreaming Anew are turned in (derived); Witnesses has no wrapper yet', () => {
    const cases = [
      ['', 0, 'Ascension 0 / 4 · next: Perceives'],
      [at('Spread Your Wings'), 0, 'Ascension 0 / 4 · next: Perceives'],
      [at('Spread Your Wings', 1), 1, 'Ascension 1 / 4 · next: Hears the Voice · gauge 100%'],
      [at('Daeva in a Dream'), 1, 'Ascension 1 / 4 · next: Hears the Voice · gauge 100%'],
      [at('Daeva in a Dream', 1), 2, 'Ascension 2 / 4 · next: Dreams · gauge 100%'],
      [at('A Daeva Dreaming Anew', 1), 3, 'Ascension 3 / 4 · next: Witnesses the Nightmare'],
    ];
    for (const [quest, n, label] of cases) {
      const a = asc(S({ quest }));
      assert.equal(a.n, n, quest || '(unset)');
      assert.ok(a.chapters.slice(0, n).every(x => x.done === 'derived') && a.chapters.slice(n).every(x => !x.done), quest);
      if (label) assert.equal(a.label, label, quest);
    }
    const end = asc(S({ quest: 'Forgotten Commander', storyEnd: 'Forgotten Commander' }));
    assert.equal(end.n, 3, 'Witnesses is done by its tick only (its wrapper is not in the data, Q7)');
    assert.equal(end.label, 'Ascension 3 / 4 · next: Witnesses the Nightmare');
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
  test('E8 label: no story position (the timeline shows it), the gauge note only for II and III (sourced), never for I or IV', () => {
    /* the same chapter at different story positions reads the same */
    for (const quest of [M.QUESTS[0][1], at('Verdant Melody', -2), 'Verdant Melody'])
      assert.equal(asc(S({ quest, checks: { 'g6:0': true } })).label, 'Ascension 1 / 4 · next: Hears the Voice · gauge 100%', quest);
    for (const quest of ['', M.QUESTS[0][1], at('Spread Your Wings')]) assert.equal(asc(S({ quest, level: 1 })).next.gauge, '', 'I: no gauge (none in its gate)');
    /* II: owner tooltip 2026-10-15 (Gauge Lv 1: "Verdant Melody" complete + 100%); III: claim C36 (allthings.how + Skycoach) */
    assert.equal(asc(S({ checks: { 'g6:0': true } })).next.gauge, 'gauge 100%');
    assert.equal(asc(S({ checks: { 'g6:0': true, 'g22:0': true } })).next.gauge, 'gauge 100%');
    assert.equal(asc(S({ quest: 'Farewells', checks: { 'g6:0': true, 'g22:0': true, 'g32:dreams': true } })).label, 'Ascension 3 / 4 · next: Witnesses the Nightmare', 'IV: no gauge claim (no source)');
    const all = M.QUESTS.map(q => asc(S({ quest: q[1] })).label);
    assert.ok(all.every(l => !/unlocks after|opens on|quests? ahead|current quest|set your quest/.test(l)), 'no story-position words');
    assert.equal(M.shortName('The One Who Dreams'), 'Dreams');
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
