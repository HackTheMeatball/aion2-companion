/* The requirement evaluator (src/core/evaluator.js, 0.3 E1): one case per atom row of docs/design/0.3-requirement-engine.md
   §3 (true / false / unset story / storyEnd), chain composition, memoisation, no input mutation. Most cases run on a small
   hand-made graph (the shape tools/gen/gen.mjs compiles), so each row is checked in isolation; the last ones on GATE_GRAPH.
   Equivalence with today's gate code over the golden states: evaluator-equivalence.test.mjs. */
import assert from 'node:assert/strict';

const S = (id, i, is) => ({ story: id, i, is });
const step = (req, done = ['tick'], extra = {}) => ({ kind: 'step', req, done, ...extra });
/* story Q0 → Q1 → Q2 → Q3 */
const G = {
  story: [['sq:0', 'Q0'], ['sq:1', 'Q1'], ['sq:2', 'Q2'], ['sq:3', 'Q3']],
  nodes: {
    'sq:0': { kind: 'story', key: 'Q0', req: { all: [] }, done: [S('sq:0', 0, 'turnedIn')] },
    'sq:1': { kind: 'story', key: 'Q1', req: S('sq:0', 0, 'turnedIn'), done: [S('sq:1', 1, 'turnedIn')] },
    lvl: step({ level: 10, basis: 'rule' }, ['tick'], { key: 'lvl' }),
    rch: step({ ...S('sq:2', 2, 'reached'), basis: 'sourced' }, ['tick'], { key: 'rch' }),
    tin: step({ ...S('sq:2', 2, 'turnedIn'), basis: 'sourced' }, ['tick'], { key: 'tin' }),
    dn: step({ done: 'lvl', basis: 'inferred' }, ['tick'], { key: 'dn' }),
    inf: step({ all: [{ level: 1, basis: 'rule' }, { itemLevel: 200, playerChecked: true }, { player: 'Gauge 100%', playerChecked: true, basis: 'legacy' }] }, ['tick'], { key: 'inf' }),
    all: step({ all: [{ done: 'lvl' }, { level: 20, basis: 'rule' }, S('sq:3', 3, 'reached')] }, ['tick'], { key: 'all' }),
    any: step({ any: [{ all: [{ level: 30 }, { level: 31 }] }, { level: 25 }] }, ['tick'], { key: 'any' }),
    /* chain: A needs B done, B needs C done and Lv 12, C needs Q3 turned in */
    C: step(S('sq:3', 3, 'turnedIn'), ['tick'], { key: 'C' }),
    B: step({ all: [{ done: 'C' }, { level: 12, basis: 'rule' }] }, ['tick'], { key: 'B' }),
    A: step({ done: 'B' }, ['tick'], { key: 'A' }),
    A2: step({ all: [{ done: 'B' }, { done: 'C' }] }, ['tick'], { key: 'A2' }),
    der: step({ all: [] }, ['tick', S('sq:1', 1, 'turnedIn')], { key: 'der' }),
    'unlock:x': { kind: 'unlock', req: S('sq:1', 1, 'turnedIn'), done: [S('sq:1', 1, 'turnedIn')] },
    'board:b': { kind: 'board', req: { done: 'unlock:x' }, done: [] },
    'dv:n': { kind: 'plan', key: 'dv:n', board: 'board:b', req: { level: 12, basis: 'rule' }, done: ['tick'] },
    'g10h:x': { kind: 'sd', key: 'g10h:x', req: { level: 10 }, done: ['tick'] },
  },
};
const C = (o = {}) => ({ checks: {}, level: 45, quest: 'Q3', ...o });

export default (test, M) => {
  const ev = (c, o) => M.evaluate(c, { graph: G, ...o });
  const n = (c, id, o) => ev(c, o).node(id);

  test('evaluator, level atom: true at the level, false below it with {kind: level, need, have}', () => {
    assert.equal(n(C({ level: 10 }), 'lvl').open, true);
    assert.equal(n(C({ level: 45 }), 'lvl').open, true);
    const r = n(C({ level: 9 }), 'lvl');
    assert.equal(r.open, false); assert.deepEqual(r.blockers, [{ kind: 'level', need: 10, have: 9 }]);
    assert.deepEqual(r.root, r.blockers[0]); assert.deepEqual(r.eta, { level: 10 });
    assert.equal(n(C({ level: 10 }), 'lvl').eta, null);
  });
  test('evaluator, story reached: true on the quest and after it, false before it (ahead = quests to go)', () => {
    assert.equal(n(C({ quest: 'Q2' }), 'rch').open, true);
    assert.equal(n(C({ quest: 'Q3' }), 'rch').open, true);
    const r = n(C({ quest: 'Q0' }), 'rch');
    assert.equal(r.open, false); assert.deepEqual(r.blockers, [{ kind: 'story', quest: 'sq:2', name: 'Q2', ahead: 2 }]);
    assert.deepEqual(r.eta, { quest: 'sq:2' });
  });
  test('evaluator, story turnedIn: true past the quest, false on it (ahead counts the turn-in), true on it with storyEnd = it', () => {
    assert.equal(n(C({ quest: 'Q3' }), 'tin').open, true);
    const on = n(C({ quest: 'Q2' }), 'tin');
    assert.equal(on.open, false); assert.deepEqual(on.blockers, [{ kind: 'story', quest: 'sq:2', name: 'Q2', ahead: 1, turnIn: true }]);
    assert.deepEqual(n(C({ quest: 'Q0' }), 'tin').blockers[0].ahead, 3);
    assert.equal(n(C({ quest: 'Q2', storyEnd: 'Q2' }), 'tin').open, true, 'storyEnd = X: the last covered quest is turned in');
    assert.equal(n(C({ quest: 'Q2', storyEnd: 'Q3' }), 'tin').open, false, 'storyEnd names another quest');
    assert.equal(n(C({ quest: 'Q1', storyEnd: 'Q2' }), 'tin').open, false, 'storyEnd = X but the story is before X');
    assert.deepEqual(on.eta, { quest: 'sq:2', turnIn: true });
  });
  test('evaluator, unset story: every story atom is unmet with ahead null ("set your quest"); an unknown quest name is unset', () => {
    for (const quest of ['', undefined, 'A quest renamed in a patch']) {
      for (const id of ['rch', 'tin']) { const r = n(C({ quest }), id); assert.equal(r.open, false, `${id} ${quest}`); assert.equal(r.blockers[0].ahead, null); }
      assert.equal(n(C({ quest, storyEnd: 'Q2' }), 'tin').open, false, 'storyEnd alone never turns a quest in');
      assert.equal(n(C({ quest }), 'sq:1').done, false);
    }
    assert.equal(n(C({ quest: '' }), 'lvl').open, true, 'a level atom does not need the story');
  });
  test('evaluator, done atom: true when the node is ticked, false with the node\'s own blockers as its chain', () => {
    assert.equal(n(C({ checks: { lvl: true } }), 'dn').open, true);
    assert.equal(n(C({ checks: { lvl: false } }), 'dn').open, false, 'a stored false is not a tick');
    const r = n(C({ level: 5 }), 'dn');
    assert.deepEqual(r.blockers, [{ kind: 'done', of: 'lvl', chain: [{ kind: 'level', need: 10, have: 5 }] }]);
    assert.deepEqual(r.root, { kind: 'level', need: 10, have: 5 });
    const open = n(C({ level: 45 }), 'dn');   /* lvl is open but not ticked: the chain is empty, the root is the done hop itself */
    assert.deepEqual(open.blockers, [{ kind: 'done', of: 'lvl', chain: [] }]); assert.equal(open.root, open.blockers[0]); assert.deepEqual(open.eta, {});
  });
  test('evaluator, playerChecked atoms (itemLevel, player): never block, returned in info, not in the basis', () => {
    const r = n(C({ level: 1 }), 'inf');
    assert.equal(r.open, true); assert.deepEqual(r.blockers, []);
    assert.deepEqual(r.info.map(a => a.itemLevel || a.player), [200, 'Gauge 100%']); assert.equal(r.basis, 'rule');
  });
  test('evaluator, all: every child; blockers in display order story, level, done', () => {
    assert.equal(n(C({ level: 20, checks: { lvl: true } }), 'all').open, true);
    const r = n(C({ level: 5, quest: 'Q1' }), 'all');
    assert.deepEqual(r.blockers.map(b => b.kind), ['story', 'level', 'done']);
    assert.deepEqual(r.eta, { level: 20, quest: 'sq:3' }, 'eta: the highest level and furthest quest of every leaf, through the chain too');
  });
  test('evaluator, any: one branch is enough; when none holds, the cheapest branch (fewest blockers) is the blocker list', () => {
    assert.equal(n(C({ level: 25 }), 'any').open, true);
    assert.equal(n(C({ level: 31 }), 'any').open, true);
    assert.deepEqual(n(C({ level: 20 }), 'any').blockers, [{ kind: 'level', need: 25, have: 20 }]);
  });
  test('evaluator, chain composition: a done blocker carries its node\'s blockers, recursively; root is the first leaf', () => {
    const r = n(C({ level: 5, quest: 'Q1' }), 'A');
    assert.equal(r.open, false);
    assert.equal(r.blockers.length, 1); const b = r.blockers[0];
    assert.equal(b.of, 'B'); assert.deepEqual(b.chain.map(x => x.kind), ['level', 'done']);
    assert.equal(b.chain[1].of, 'C'); assert.deepEqual(b.chain[1].chain, [{ kind: 'story', quest: 'sq:3', name: 'Q3', ahead: 3, turnIn: true }]);
    assert.deepEqual(r.root, { kind: 'level', need: 12, have: 5 }, 'B\'s own first blocker in display order (level before done)');
    assert.deepEqual(r.eta, { level: 12, quest: 'sq:3', turnIn: true });
    /* ticking the middle of the chain cuts it; ticking the end leaves only what B itself needs */
    assert.equal(n(C({ level: 5, quest: 'Q1', checks: { B: true } }), 'A').open, true);
    assert.deepEqual(n(C({ level: 5, quest: 'Q1', checks: { C: true } }), 'A').blockers[0].chain, [{ kind: 'level', need: 12, have: 5 }]);
    /* fully met chain, nothing ticked: A waits for B's tick only */
    assert.deepEqual(n(C({ level: 12, quest: 'Q3', storyEnd: 'Q3', checks: { C: true } }), 'A').blockers, [{ kind: 'done', of: 'B', chain: [] }]);
  });
  test('evaluator, completion: a tick; other completesWith entries only with derived on; a node with no tick by its gate', () => {
    assert.equal(n(C({ quest: 'Q2' }), 'der').done, false, 'derived off (E1 default): today\'s ticks only');
    assert.deepEqual([n(C({ quest: 'Q2' }), 'der', { derived: true }).done, n(C({ quest: 'Q2' }), 'der', { derived: true }).via], ['derived', 'turnedIn sq:1']);
    assert.equal(n(C({ quest: 'Q1' }), 'der', { derived: true }).done, false);
    assert.equal(n(C({ quest: 'Q2', checks: { der: true } }), 'der', { derived: true }).done, 'tick', 'a tick wins');
    assert.equal(n(C({ quest: 'Q1' }), 'der', { derived: true }).via, undefined);
    /* story quests and unlocks have no tick: done by the position, whatever `derived` says */
    for (const derived of [false, true]) {
      assert.equal(n(C({ quest: 'Q1' }), 'sq:1', { derived }).done, false);
      assert.equal(n(C({ quest: 'Q1', storyEnd: 'Q1' }), 'sq:1', { derived }).done, 'derived');
      assert.equal(n(C({ quest: 'Q2' }), 'unlock:x', { derived }).done, 'derived');
    }
  });
  test('evaluator, plan node: its own gate and its board\'s (inherited), with the board\'s blockers', () => {
    assert.equal(n(C({ level: 12, quest: 'Q2' }), 'dv:n').open, true);
    const r = n(C({ level: 12, quest: 'Q1' }), 'dv:n');
    assert.equal(r.open, false); assert.deepEqual(r.blockers, [{ kind: 'done', of: 'unlock:x', chain: [{ kind: 'story', quest: 'sq:1', name: 'Q1', ahead: 1, turnIn: true }] }]);
    assert.deepEqual(n(C({ level: 11, quest: 'Q1' }), 'dv:n').blockers.map(b => b.kind), ['level', 'done']);
  });
  test('evaluator, basis: the weakest atom basis of the gate (an atom without one counts as legacy); null with no atom', () => {
    assert.equal(n(C(), 'lvl').basis, 'rule'); assert.equal(n(C(), 'rch').basis, 'sourced'); assert.equal(n(C(), 'dn').basis, 'inferred');
    assert.equal(n(C(), 'any').basis, 'legacy'); assert.equal(n(C(), 'der').basis, null);
  });
  test('evaluator, lookups: byKey (a save key that differs from the id), unknown ids, list in catalog order', () => {
    const e = ev(C());
    assert.equal(e.byKey('g10h:x').id, 'g10h:x'); assert.equal(e.byKey('Q1').id, 'sq:1'); assert.equal(e.byKey('nope'), null); assert.equal(e.node('nope'), null);
    assert.deepEqual(e.list().map(r => r.id), Object.keys(G.nodes));
    assert.deepEqual(e.list(r => r.kind === 'story').map(r => r.id), ['sq:0', 'sq:1']);
  });
  test('evaluator, memoised: each node is evaluated once per evaluate(), shared dependencies too; same record object', () => {
    const e = ev(C({ level: 5, quest: 'Q1' }));
    const a = e.node('A'); assert.equal(e.evals, 3, 'A, B, C');
    e.node('A2'); assert.equal(e.evals, 4, 'A2 reuses B and C');
    assert.equal(e.node('A'), a); assert.equal(a.blockers[0].chain, e.node('B').blockers, 'the chain is B\'s own blocker list, not a recomputed copy');
    e.list(); assert.equal(e.evals, Object.keys(G.nodes).length);
    assert.notEqual(ev(C()).node('A'), a, 'a new evaluate() starts afresh (no stale result across updates)');
  });
  test('evaluator, cycle in a hand-made graph: throws instead of looping (the generator rejects cycles in the data)', () => {
    const cyc = { story: [], nodes: { x: step({ done: 'y' }), y: step({ done: 'x' }) } };
    assert.throws(() => M.evaluate(C(), { graph: cyc }).node('x'), /cycle/);
  });
  const freeze = o => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(freeze); } return o; };
  test('evaluator, no input mutation: deep-frozen character and graph, every node, derived off and on', () => {
    const graph = freeze(structuredClone(M.GATE_GRAPH)), gs = JSON.stringify(graph);
    for (const quest of ['', M.QUESTS[0][1], M.QUESTS[40][1], M.QUESTS[M.QUESTS.length - 1][1]]) for (const level of [1, 22, 45]) {
      const c = freeze({ checks: { 'g22:0': true, 'rq:2202017': true, 'g27:0': false }, level, quest, storyEnd: quest, started: {}, stLv: {} }), cs = JSON.stringify(c);
      for (const derived of [false, true]) { const e = M.evaluate(c, { graph, derived }); assert.equal(e.list().length, Object.keys(graph.nodes).length); }
      assert.equal(JSON.stringify(c), cs);
    }
    assert.equal(JSON.stringify(graph), gs);
    /* the hand-made graph too (chains, inheritance, derived) */
    const g2 = freeze(structuredClone(G)); M.evaluate(freeze(C({ level: 5, quest: 'Q1' })), { graph: g2, derived: true }).list();
  });
  test('GATE_GRAPH: live gates only, every kind present, story chain = QUESTS, skill lines = SP_STEPS, specialty slots = SP_STEPS + SP_SLOTS (keys and levels)', () => {
    const N = M.GATE_GRAPH.nodes, kinds = {}; for (const x of Object.values(N)) kinds[x.kind] = (kinds[x.kind] || 0) + 1;
    assert.deepEqual(M.GATE_GRAPH.story.map(([, name]) => name), M.QUESTS.map(([, name]) => name));
    for (const k of ['story', 'ascension', 'step', 'rq', 'sd', 'sh', 'unlock', 'board', 'plan', 'skill', 'spec']) assert.ok(kinds[k] > 0, k);
    assert.equal(kinds.story, 87); /* 0.3 E10: + Daeva Trapped in a Nightmare */ assert.equal(kinds.rq, 58); assert.equal(kinds.sd, 60); assert.equal(kinds.sh, 15); assert.equal(kinds.board, 5);
    assert.equal(kinds.plan, M.DV_NODES().length);
    assert.deepEqual(Object.values(N).filter(x => x.kind === 'skill').map(x => [x.key, x.req.level]).sort(), M.SP_STEPS.filter(x => !x.spec).map(x => [x.k, x.req]).sort());
    /* 0.3 E7: a specialty slot opens on effective skill level 8 / 12 / 20 (the slot rows' slotLv), keys :spec, :spec2, :spec3 */
    assert.deepEqual(Object.values(N).filter(x => x.kind === 'spec').map(x => [x.key, x.req.skillLv, x.slot]).sort(),
      [...M.SP_STEPS.filter(x => x.spec), ...M.SP_SLOTS].map(x => [x.k, x.slotLv, x.slot]).sort());
    assert.deepEqual(M.SP_SLOTS.map(x => x.k.replace(/^sp:[^:]+:/, '')), M.SP_STEPS.filter(x => x.spec).flatMap(() => ['spec2', 'spec3']));
    assert.ok(!JSON.stringify(M.GATE_GRAPH).includes('"proposed"'));
  });
  test('evaluator on GATE_GRAPH: story quests done by the position; "Urgent Pursuit" opens unlock:daevanion once turned in', () => {
    const qi = M.storyIdx('Urgent Pursuit'), e = M.evaluate({ checks: {}, level: 12, quest: 'Urgent Pursuit' });
    assert.equal(e.node('unlock:daevanion').done, false);
    assert.equal(e.node(M.GATE_GRAPH.story[qi - 1][0]).done, 'derived'); assert.equal(e.node(M.GATE_GRAPH.story[qi][0]).done, false);
    assert.equal(M.evaluate({ checks: {}, level: 12, quest: M.QUESTS[qi + 1][1] }).node('unlock:daevanion').done, 'derived');
    assert.equal(M.evaluate({ checks: {}, level: 45, quest: '' }).list().length, Object.keys(M.GATE_GRAPH.nodes).length);
  });
  test('evaluator, apply (E4): a proposal replaces req / done only for the ids asked for; a proposed completesWith needs derived', () => {
    const P = { lvl: { status: 'ready', req: { level: 20, basis: 'rule' } }, rch: { status: 'ready', done: ['tick', S('sq:1', 1, 'turnedIn')] } };
    const c = C({ level: 15, quest: 'Q3' });
    assert.equal(n(c, 'lvl', { proposed: P }).open, true, 'not applied: the live gate');
    assert.equal(n(c, 'lvl', { proposed: P, apply: ['lvl'] }).open, false);
    assert.equal(n(c, 'rch', { proposed: P, apply: ['rch'] }).done, false, 'derived off: the tick only');
    assert.equal(n(c, 'rch', { proposed: P, apply: ['rch'], derived: true }).via, 'turnedIn sq:1');
    assert.equal(n(C({ level: 15, checks: { lvl: true } }), 'dn', { proposed: P, apply: ['lvl'] }).open, true, 'a done atom reads the applied node');
  });
  test('evaluator, followUps (E4): a ticked or picked-up regional quest proves its sourced / owner done atoms, transitively', () => {
    const rq = (req, key) => ({ kind: 'rq', key, req, done: ['tick'] });
    const g = { story: G.story, nodes: { a: rq({ level: 1 }, 'a'), b: rq({ done: 'a', basis: 'sourced' }, 'b'), c: rq({ all: [{ done: 'b', basis: 'owner' }] }, 'c'),
      x: rq({ level: 1 }, 'x'), y: rq({ done: 'x', basis: 'owner-check' }, 'y') } };
    const e = (c, o) => M.evaluate({ level: 1, ...c }, { graph: g, followUps: true, ...o });
    const r = e({ checks: {}, started: { c: 1, y: 1 } });
    assert.deepEqual(['a', 'b', 'c', 'x', 'y'].map(id => [r.node(id).done, r.node(id).via || null]),
      [['derived', 'followUp b'], ['derived', 'followUp c'], [false, null], [false, null], [false, null]]);
    assert.equal(e({ checks: { b: true } }).node('a').done, 'derived');
    assert.equal(e({ checks: {}, started: { c: 1 } }, { followUps: false }).node('b').done, false);
  });
};
