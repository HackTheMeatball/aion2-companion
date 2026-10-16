/* The invariant suite's oracle (0.3 E3, docs/design/0.3-requirement-engine.md §12): a second, deliberately naive
   evaluator, written straight from the DATA-FORMAT-V2 §6 atom table over the raw v2 JSON in data/**. It reads neither
   the compiled GATE_GRAPH nor src/core/evaluator.js nor the generator, so the invariant suite does not grade the engine
   with itself: the story chain comes from the quests' own `next` links, skill lines from rule:skill-level-gate and the
   skills' learn levels, plan nodes from the build's boardPlan and their boards. No memo across calls, no shortcuts.

   loadOracle({ root, apply }) → O
     O.ids                          every node id, in no particular order (the generator's ids: data ids; plan nodes and
                                    skill lines by save key, as GATE_GRAPH names them)
     O.idOfKey(k)                   the node id of save key k, or null (the oracle doesn't know it)
     O.at(c, { derived, followUps }) → S   one character c (char(state)); derived as in the evaluator: false = a node that
                                    can be ticked is done by its tick only; true = also by its other completesWith entries;
                                    followUps: a regional quest ticked or picked up makes the regional quests its sourced /
                                    owner `done` atoms name done, transitively (design §5.3, Q3)
       S.node(id) → { open, done, blockers } | null
         open      requires holds (playerChecked atoms ignored)
         done      false | "tick" | "derived"
         blockers  the unmet leaf atoms: { kind: "level", need } | { kind: "story", quest, ahead } | { kind: "done", of }
                   (ahead = idx − pos, + 1 for turnedIn; null with the story unset)
       S.pos                        index of c.quest in the chain, −1 if unset or unknown
     O.chain                        [[id, name]…] in story order
   apply: Set of record ids whose `proposed` gate is read instead of the live one (§13; tests/invariant.mjs loads a
   second oracle with the app's set, empty since the approved g22:0 / g32:dreams proposals moved to the live data). */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (root, f) => JSON.parse(readFileSync(join(root, 'data', f), 'utf8'));

export function loadOracle({ root, apply = new Set() }) {
  const recs = f => read(root, f).records;
  const story = recs('shared/asmodian/story-quests.json'), steps = recs('shared/asmodian/guide/steps.json');
  const rqs = recs('shared/asmodian/regional-quests.json'), sds = recs('shared/asmodian/sealed-dungeons.json');
  const shs = recs('shared/asmodian/strongholds.json'), unlocks = recs('shared/asmodian/unlocks.json');
  const ascs = recs('shared/asmodian/ascension-quests.json'), boards = recs('shared/boards.json');
  const skills = recs('classes/assassin/skills.json'), bnodes = recs('classes/assassin/board-nodes.json');
  const build = recs('classes/assassin/builds.json')[0], rules = Object.fromEntries(recs('shared/rules.json').map(r => [r.id, r]));

  /* the story chain: start at the quest no other quest names as `next`, follow `next` */
  const sById = new Map(story.map(s => [s.id, s])), named = new Set(story.map(s => s.next).filter(Boolean));
  const heads = story.filter(s => !named.has(s.id));
  if (heads.length !== 1) throw new Error(`oracle: story chain has ${heads.length} heads`);
  const chain = [];
  for (let s = heads[0]; s; s = s.next ? sById.get(s.next) : null) { if (chain.length > story.length) throw new Error('oracle: story chain loops'); chain.push([s.id, s.key]); }
  if (chain.length !== story.length) throw new Error(`oracle: story chain covers ${chain.length} of ${story.length} quests`);
  const sIdx = new Map(chain.map(([id], i) => [id, i])), sName = new Map(chain.map(([, n], i) => [n, i]));

  /* nodes: id → { key?, requires, completesWith }; a record in `apply` reads its proposal */
  const nodes = new Map(), byKey = new Map();
  const add = (id, n) => { if (nodes.has(id)) throw new Error('oracle: duplicate node ' + id); nodes.set(id, n); if (n.key !== undefined && !byKey.has(n.key)) byKey.set(n.key, id); };
  const gateOf = r => {
    const p = apply.has(r.id) && r.proposed ? r.proposed : null;
    const requires = p && 'requires' in p ? p.requires : r.requires;
    const rb = p ? p.requiresBasis : r.requiresBasis;
    const completesWith = p && p.completesWith ? p.completesWith : r.completesWith;
    /* requiresBasis "unresearched" (today's noPre): opens at max(unlocksAt, rec) (DATA-FORMAT-V2 §6) */
    const req = rb === 'unresearched' ? { all: [requires || { all: [] }, { level: Math.max(r.unlocksAt || 0, r.rec || 0) }] } : requires || { all: [] };
    return { requires: req, completesWith: completesWith || [] };
  };
  for (const s of story) add(s.id, { key: s.key, ...gateOf(s), tickable: false });
  for (const a of ascs) add(a.id, { ...gateOf(a) });
  for (const s of steps) add(s.id, { key: s.key, ...gateOf(s) });
  for (const q of rqs) add(q.id, { key: q.key, ...gateOf(q) });
  for (const d of sds) add(d.id, { key: d.key, ...gateOf(d) });
  for (const s of shs) add(s.id, { key: s.key, ...gateOf(s) });
  /* an unlock is done when its `at` holds */
  for (const u of unlocks) add(u.id, { requires: u.at, completesWith: [u.at] });
  for (const b of boards) add(b.id, { ...gateOf(b) });
  /* plan nodes: their own gate and their board's requires (every plan node inherits the board's window gate, §10) */
  const nodeById = new Map(bnodes.map(n => [n.id, n]));
  for (const e of build.boardPlan) {
    const n = nodeById.get(e.node || e.anyNode[0]), k = e.node ? n.key : e.key;
    const own = gateOf({ ...e, id: k });
    add(k, { key: k, requires: { all: [own.requires, nodes.get(n.board).requires] }, completesWith: own.completesWith });
  }
  /* skill lines (rule:skill-level-gate): line L of a skill opens at character level learnLv + perLevel × (L − 2), or at
     learnLv for a flat gate; lines 2 … maxFromPoints. Specialty slot 1 (rule:specialty-slots, today: the level of skill
     line 8) for a non-passive skill the build picks a specialty for. Every skill in the build's skill order. */
  const slg = rules['rule:skill-level-gate'].value, slot1 = rules['rule:specialty-slots'].value.slots[0];
  const skById = new Map(skills.map(s => [s.id, s]));
  const lineLv = (s, L) => s.levelGate === 'flat' ? s.learnLv : s.learnLv + slg.stepped.perLevel * (L - 2);
  for (const { skill } of build.skillOrder) {
    const s = skById.get(skill);
    for (let L = 2; L <= slg.maxFromPoints; L++) add(`sp:${s.key}:${L}`, { key: `sp:${s.key}:${L}`, requires: { level: lineLv(s, L) }, completesWith: ['tick'] });
    if ((build.specialtyPicks[skill] || []).length && s.type !== 'passive')
      add(`sp:${s.key}:spec`, { key: `sp:${s.key}:spec`, requires: { level: lineLv(s, slot1) }, completesWith: ['tick'] });
  }
  for (const n of nodes.values()) if (n.tickable === undefined) n.tickable = n.completesWith.includes('tick');

  /* regional quest records by id, for the follow-up rule */
  const rqById = new Map(rqs.map(q => [q.id, q]));
  const leaves = a => a.all ? a.all.flatMap(leaves) : a.any ? a.any.flatMap(leaves) : [a];

  function at(c, { derived = false, followUps = false } = {}) {
    const lv = c.level || 0, checks = c.checks || {}, pos = c.quest && sName.has(c.quest) ? sName.get(c.quest) : -1;
    const memo = new Map();
    /* follow-up rule (design §5.3, Q3): every regional quest the player has ticked or picked up (c.started) was let in by
       the game, so each regional quest its gate names in a `done` atom backed by a source or the owner was turned in;
       and so on back along those edges (a breadth-first walk from the ticked and picked-up ones) */
    const proven = new Set();
    if (followUps) {
      const started = c.started || {}, queue = rqs.filter(q => checks[q.key] || started[q.key]).map(q => q.id);
      for (let i = 0; i < queue.length; i++) for (const a of leaves(nodes.get(queue[i]).requires))
        if (a.done && rqById.has(a.done) && (a.basis === 'sourced' || a.basis === 'owner') && !proven.has(a.done)) { proven.add(a.done); queue.push(a.done); }
    }
    /* one atom → the unmet leaves ([] = holds) */
    const unmet = a => {
      if (a.all) return a.all.flatMap(unmet);
      if (a.any) { const bs = a.any.map(unmet); return bs.some(b => !b.length) ? [] : bs.reduce((x, y) => y.length < x.length ? y : x); }
      if (a.playerChecked) return [];
      if (a.level !== undefined) return lv >= a.level ? [] : [{ kind: 'level', need: a.level }];
      if (a.story) {
        const i = sIdx.get(a.story); if (i === undefined) throw new Error('oracle: story atom off the chain: ' + a.story);
        const ok = a.is === 'reached' ? pos >= 0 && pos >= i : a.is === 'turnedIn' ? pos >= 0 && (pos > i || (pos === i && c.storyEnd === chain[i][1])) : null;
        if (ok === null) throw new Error('oracle: story atom without is: ' + JSON.stringify(a));
        return ok ? [] : [{ kind: 'story', quest: a.story, ahead: pos < 0 ? null : i - pos + (a.is === 'turnedIn' ? 1 : 0) }];
      }
      if (a.storyStep) {
        const i = sIdx.get(a.storyStep); if (i === undefined) throw new Error('oracle: storyStep atom off the chain: ' + a.storyStep);
        return ((c.qsteps || {})[chain[i][1]] || []).includes(a.i) ? [] : [{ kind: 'step', quest: a.storyStep, i: a.i }];
      }
      if (a.done) { const y = node(a.done); if (!y) throw new Error('oracle: done atom on an unknown node: ' + a.done);
        return y.done ? [] : [{ kind: 'done', of: a.done }]; }
      throw new Error('oracle: unknown atom ' + JSON.stringify(a));
    };
    function node(id) {
      if (memo.has(id)) { const m = memo.get(id); if (!m) throw new Error('oracle: cycle at ' + id); return m; }
      const n = nodes.get(id); if (!n) return null;
      memo.set(id, null);
      const blockers = unmet(n.requires);
      let done = false;
      if (n.tickable && n.key !== undefined && checks[n.key]) done = 'tick';
      else if (!n.tickable || derived) { if (n.completesWith.some(e => e !== 'tick' && !unmet(e).length)) done = 'derived'; }
      if (!done && proven.has(id)) done = 'derived';
      const r = { open: !blockers.length, done, blockers };
      memo.set(id, r);
      return r;
    }
    return { node, pos };
  }

  return { ids: [...nodes.keys()], idOfKey: k => byKey.get(k) ?? null, at, chain };
}
