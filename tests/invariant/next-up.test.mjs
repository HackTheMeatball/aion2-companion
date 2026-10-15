/* Invariants (0.3 E3, docs/design/0.3-requirement-engine.md §12), suite `invariant`. Over the 10,000 states of
   tests/invariant/states.mjs, loaded and migrated as the page does, with an independent oracle (tests/support/oracle.mjs:
   the raw v2 data, not GATE_GRAPH and not the evaluator) as the judge:

   1. Next up never offers (a card with an action) a node the oracle says is blocked (its live `requires`, derived off,
      as the app runs since E2). Rows the player has already started (a regional quest picked up, a dungeon entered)
      are judged on 2 only: the player's own record says the game let them in.
   2. Next up never offers a node that is done, ticked or derived (the oracle with every completesWith entry on).
   4. Monotonic: raising the level by one or moving the story on by one never closes a node the app's evaluator has
      open, except by making it done (the odd-numbered half of the states, for time).
   5. The evaluator (GATE_GRAPH, derived off and on) agrees with the oracle on every node: open, done, and the blockers
      (level needed, story quest and `ahead`, the `done` atom); a level blocker never shows with the level met (the
      even-numbered half; and the oracle must catch three bugs seeded into a copy of the graph).
   6. Nothing is written: rankNext and evaluate run on a deep-frozen save and character.
   (Invariant 3 of §12, "a met Ascension step is the first step card", is 0.3 ranking behaviour that isn't built yet
   (DATA-FORMAT-V2 §10; E2 keeps 0.2's order): not checked here, counted for information only.)

   A disagreement between the app and the oracle is never fixed by changing the app or weakening the oracle: it is
   pinned in KNOWN with its cause. The test fails on a disagreement not in KNOWN and on a KNOWN one that no longer
   occurs. Table of every disagreement: tests/out/invariant.md. */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/* disagreement key → cause. Key: "<invariant> <card> <node id> [<what blocks it, or how it is done>]". */
export const KNOWN = {
  'blocked story sq:2102800 [level]': 'Forgotten Commander\'s live gate has its unlock level {level: 45} (sourced, design §7). ' +
    'The story card is level-gated by the recommended level (kept rule "story-card-recommended-level", storyRecGate) and ' +
    'still offers "Turned in" once every objective is ticked (rankNext storyCard: act = gated ? (allDone ? "story" : "") : ' +
    '"story"), so at Lv 44 with all 5 objectives ticked it offers to turn in a quest the game opens at 45. Finding Nemon ' +
    '(unlock Lv 10) has no objective list, so its gated card has no action. Owner decision (Q10), not changed in E3',
};

const deepFreeze = o => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); } return o; };
const sig = bs => bs.map(b => b.kind === 'level' ? `level ${b.need}` : b.kind === 'story' ? `story ${b.quest} ahead ${b.ahead}` : `done ${b.of}`).sort().join(' · ');
const kinds = bs => [...new Set(bs.map(b => b.kind === 'done' ? 'done ' + b.of : b.kind))].sort().join(', ');
/* the cards rankNext can return; the ones that carry no node (Cube items, stigma upgrade, "set your quest") or no action */
const NO_NODE = new Set(['cube', 'stup']), NO_ACT = new Set(['stwait', 'laterSkill', 'laterStep']);

export default (test, M, X) => {
  const { states, O, root } = X;
  const N = M.GATE_GRAPH.nodes, storyId = new Map(O.chain.map(([id, n]) => [n, id]));
  const loaded = [];
  const found = new Map();   /* disagreement key → { n, ex } */
  const note = (key, id, detail) => { const x = found.get(key) || { n: 0, ex: `${id}${detail ? ' (' + detail + ')' : ''}` }; x.n++; found.set(key, x); };
  let ascFirst = { met: 0, notFirst: 0 };

  test('oracle: the same nodes and story chain as GATE_GRAPH (built independently from data/**)', () => {
    assert.deepEqual(O.ids.slice().sort(), Object.keys(N).sort());
    assert.deepEqual(O.chain, M.GATE_GRAPH.story);
  });

  test(`${states.length} states loaded, migrated and deep-frozen`, () => {
    assert.equal(states.length, X.TOTAL);
    for (const { id, raw } of states) {
      const { state, hadSave } = M.loadState(raw); M.migrate(state, hadSave, () => {}, 0);
      loaded.push({ id, s: deepFreeze(state), c: M.char(state) });
    }
  });

  /* which nodes a card offers: [{ card, id, started }] (id null: a save key the oracle doesn't know) */
  const offersOf = (cards, c) => {
    const out = [], k2 = (card, k, started = false) => out.push({ card, k, id: O.idOfKey(k), started });
    for (const a of cards) {
      if (!a.act || NO_NODE.has(a.kind)) continue;
      switch (a.kind) {
        case 'run': k2('run', a.x.k, true); break;
        case 'skill': k2('skill', a.x.k); break;
        case 'board': case 'boardcost': k2(a.kind, a.dn.k); break;
        case 'stequip': k2('stequip', a.nx.k); break;
        case 'step': case 'missed': case 'adv': k2(a.kind, a.x.k); break;
        case 'sd': case 'sh': k2(a.kind, a.pick.k); break;
        /* the rows you can pick up or turn in (a locked follow-up's box is disabled; "waiting on the story" rows only
           offer "In my game", the player's override) */
        case 'rq': a.open.filter(x => !x.lock).forEach(x => k2('rq', x.k, x.run)); break;
        case 'story': if (a.act === 'story') out.push({ card: 'story', k: a.quest, id: storyId.get(a.quest) ?? null, started: false }); break;
        default: if (!NO_ACT.has(a.kind)) out.push({ card: a.kind, k: '?', id: null, unmapped: true });
      }
    }
    return out;
  };

  test('1, 2, 6. Next up never offers a blocked or a done node (rankNext on the frozen save)', () => {
    found.clear();
    const errors = [];
    for (const { id, s, c } of loaded) {
      let cards;
      try { cards = M.rankNext(s, { basic: s.mode === 'basic' }); }
      catch (e) { errors.push(`${id}: rankNext threw on a frozen save: ${e.message}`); continue; }
      const o0 = O.at(c), o1 = O.at(c, { derived: true });
      for (const x of offersOf(cards, c)) {
        if (x.unmapped) { errors.push(`${id}: card kind "${x.card}" has an action but no node mapping in this test`); continue; }
        if (!x.id) { errors.push(`${id}: ${x.card} offers ${x.k}, a key the data doesn't have`); continue; }
        const a = o0.node(x.id), b = o1.node(x.id);
        if (!x.started && !a.open) note(`blocked ${x.card} ${x.id} [${kinds(a.blockers)}]`, id, sig(a.blockers));
        if (b.done) note(`done ${x.card} ${x.id} [${b.done}]`, id, b.done === 'tick' ? 'ticked' : 'derived from the story or another node');
      }
      /* invariant 3 (for information): a met, unfinished Ascension step and the first step card */
      const asc = [...O.ids].filter(n => N[n].kind === 'step' && /^(g22:0|g32:dreams|g45:0)$/.test(n)).filter(n => o0.node(n).open && !o1.node(n).done);
      if (asc.length) { ascFirst.met++; const f = cards.find(a => ['step', 'missed'].includes(a.kind)); if (!f || !asc.includes(f.x.k)) ascFirst.notFirst++; }
    }
    assert.deepEqual(errors.slice(0, 10), [], `${errors.length} errors`);
    report('Next up offers', found);
  });

  /* The 30 s budget (with a browser suite beside it in the CI shard) doesn't fit 10,000 × (Next up + evaluator vs oracle +
     two more evaluations): Next up runs on every state, the evaluator vs oracle on the even ones (derived on for every
     DERIVED_EVERY-th of those: derived completion is E4 and the live data has few derivable rows), monotonic on the odd ones. */
  const even = loaded.filter((_, i) => i % 2 === 0), odd = loaded.filter((_, i) => i % 2 === 1);
  const DERIVED_EVERY = 4;
  const compare = (graph, list) => {
    const diffs = new Map(), bad = (k, id, d) => { const x = diffs.get(k) || { n: 0, ex: `${id} (${d})` }; x.n++; diffs.set(k, x); };
    const ids = O.ids;
    list.forEach(({ id, c }, i) => { for (const derived of i % DERIVED_EVERY ? [false] : [false, true]) {
      const ev = M.evaluate(c, { derived, ...(graph ? { graph } : {}) }), o = O.at(c, { derived });
      for (const n of ids) {
        const e = ev.node(n), r = o.node(n);
        if (e.open !== r.open) bad(`${n} open (derived ${derived}): oracle ${r.open} / evaluator ${e.open}`, id, sig(r.blockers));
        if (e.done !== r.done) bad(`${n} done (derived ${derived}): oracle ${r.done} / evaluator ${e.done}`, id, '');
        if ((e.blockers.length || r.blockers.length) && sig(e.blockers) !== sig(r.blockers)) bad(`${n} blockers (derived ${derived})`, id, `oracle ${sig(r.blockers)} / evaluator ${sig(e.blockers)}`);
        if (e.blockers.some(b => b.kind === 'level' && b.need <= c.level)) bad(`${n} level blocker with the level met`, id, sig(e.blockers));
      }
    } });
    return diffs;
  };

  test(`5. evaluator = oracle on every node (open, done, blockers) of ${even.length} states (derived off; on for every ${DERIVED_EVERY}th)`, () => {
    const diffs = compare(null, even);
    assert.deepEqual([...diffs].slice(0, 12).map(([k, x]) => `${k} · ${x.n}×, e.g. ${x.ex}`), [], `${diffs.size} differences`);
  });

  /* the oracle can fail: three seeded evaluator bugs (a compiled gate changed behind the oracle's back) must each show up */
  test('5. the oracle catches seeded evaluator bugs (story "reached" → "turnedIn", level + 1, a dropped done atom)', () => {
    if (X.only) return;   /* --state: too few states to hit every seeded bug */
    const g = JSON.parse(JSON.stringify(M.GATE_GRAPH)), atoms = r => r.all ? r.all.flatMap(atoms) : r.any ? r.any.flatMap(atoms) : [r];
    const pickNode = (kind, f) => Object.keys(g.nodes).find(n => g.nodes[n].kind === kind && atoms(g.nodes[n].req).some(f));
    const rqStory = pickNode('rq', a => a.story && a.is === 'reached'), stepLv = pickNode('step', a => a.level !== undefined), rqDone = pickNode('rq', a => a.done);
    atoms(g.nodes[rqStory].req).find(a => a.story).is = 'turnedIn';
    atoms(g.nodes[stepLv].req).find(a => a.level !== undefined).level++;
    g.nodes[rqDone].req = { all: g.nodes[rqDone].req.all.filter(a => !a.done) };
    const hit = new Set([...compare(g, loaded.filter((_, i) => i % 20 === 1)).keys()].map(k => k.split(' ')[0]));
    assert.deepEqual([...hit].sort(), [rqStory, stepLv, rqDone].sort());
  });

  /* one step per state (level and story in turn; the other when that one can't move) */
  test(`4. monotonic: one level up or one story quest on never closes an open node (the app's gates; ${odd.length} states)`, () => {
    const diffs = new Map(), bad = (k, id) => { const x = diffs.get(k) || { n: 0, ex: id }; x.n++; diffs.set(k, x); };
    const NQ = O.chain.length, moved = { 'level +1': 0, 'story +1': 0 };
    odd.forEach(({ id, c }, i) => {
      const ev = M.gatesOf(c), open = ev.list(r => r.open).map(r => r.id), pos = c.quest ? O.chain.findIndex(([, n]) => n === c.quest) : -1;
      const can = [];
      if (c.level < 45) can.push(['level +1', { ...c, level: c.level + 1 }]);
      if (pos >= 0 && pos + 1 < NQ) { const { storyEnd, ...rest } = c; can.push(['story +1', { ...rest, quest: O.chain[pos + 1][1] }]); }
      const next = can.length < 2 ? can : [can[i % 2]];
      next.forEach(([what]) => moved[what]++);
      for (const [what, c2] of next) { const ev2 = M.gatesOf(c2);
        for (const n of open) { const r = ev2.node(n); if (!r.open && r.done === false) bad(`${what} closes ${n}`, id); } }
    });
    if (!X.only) assert.ok(moved['level +1'] > odd.length / 3 && moved['story +1'] > odd.length / 3, JSON.stringify(moved));
    assert.deepEqual([...diffs].slice(0, 12).map(([k, x]) => `${k} · ${x.n}×, e.g. ${x.ex}`), [], `${diffs.size} differences`);
  });

  test('6. evaluate() leaves a deep-frozen character as it was', () => {
    for (const { c } of loaded.filter((_, i) => i % 50 === 0)) { const before = JSON.stringify(c); M.evaluate(c, { derived: true }).list(); M.gatesOf(c).list(); assert.equal(JSON.stringify(c), before); }
  });

  /* the disagreements, against KNOWN */
  function report(what, m) {
    const rows = [...m].sort(([a], [b]) => a < b ? -1 : 1);
    const md = [`# Invariant suite: ${what} vs the oracle`, '', `Generated by tests/invariant.mjs (seed ${X.seedHex}, ${states.length} states). Not committed.`, '',
      `Invariant 3 (for information, not built in E2): ${ascFirst.met} states with a met, unfinished Ascension step; in ${ascFirst.notFirst} it is not the first step card.`, '',
      '| Disagreement | States | Example | Cause (KNOWN) |', '|---|---|---|---|',
      ...rows.map(([k, x]) => `| ${k} | ${x.n} | ${x.ex.replace(/\|/g, '/')} | ${KNOWN[k] || '**not in KNOWN**'} |`)].join('\n');
    mkdirSync(join(root, 'tests/out'), { recursive: true });
    writeFileSync(join(root, 'tests/out/invariant.md'), md + '\n');
    console.log(`     ${rows.length} disagreement kinds (tests/out/invariant.md); invariant 3, information only: ${ascFirst.notFirst} of ${ascFirst.met} states`);
    const unknown = rows.filter(([k]) => !KNOWN[k]).map(([k, x]) => `${k} · ${x.n} states, e.g. ${x.ex}`);
    const stale = X.only ? [] : Object.keys(KNOWN).filter(k => !m.has(k));
    assert.deepEqual(unknown, [], 'disagreements not in KNOWN');
    assert.deepEqual(stale, [], 'KNOWN entries that no longer occur');
  }
};
