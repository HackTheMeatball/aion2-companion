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
                   | { kind: "skill", skill, need, have } (effective skill level, the specialty slots)
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
  const story = recs('packs/aion2/asmodian/story-quests.json'), steps = recs('packs/aion2/asmodian/assassin/guide/steps.json');
  const rqs = recs('packs/aion2/asmodian/regional-quests.json'), sds = recs('packs/aion2/asmodian/sealed-dungeons.json');
  const shs = recs('packs/aion2/asmodian/strongholds.json'), unlocks = recs('packs/aion2/asmodian/unlocks.json');
  const ascs = recs('packs/aion2/asmodian/ascension-quests.json'), boards = recs('packs/aion2/boards.json');
  const skills = recs('packs/aion2/classes/assassin/skills.json'), bnodes = recs('packs/aion2/classes/assassin/board-nodes.json');
  const build = recs('packs/aion2/asmodian/assassin/builds.json')[0], rules = Object.fromEntries(recs('packs/aion2/rules.json').map(r => [r.id, r]));

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
     learnLv for a flat gate; lines 2 … maxFromPoints. Specialty slots 1 / 2 / 3 (rule:specialty-slots, 0.3 E7: effective
     skill level 8 / 12 / 20, the atom { skillLv, skill } below) for a non-passive skill the build picks a specialty for.
     Every skill in the build's skill order. */
  const slg = rules['rule:skill-level-gate'].value, slots = rules['rule:specialty-slots'].value.slots;
  const skById = new Map(skills.map(s => [s.id, s]));
  const lineLv = (s, L) => s.levelGate === 'flat' ? s.learnLv : s.learnLv + slg.stepped.perLevel * (L - 2);
  const lineKeys = new Map();   /* skill id → [[L, save key]] */
  for (const { skill } of build.skillOrder) {
    const s = skById.get(skill); lineKeys.set(skill, []);
    for (let L = 2; L <= slg.maxFromPoints; L++) { add(`sp:${s.key}:${L}`, { key: `sp:${s.key}:${L}`, requires: { level: lineLv(s, L) }, completesWith: ['tick'] }); lineKeys.get(skill).push([L, `sp:${s.key}:${L}`]); }
    if ((build.specialtyPicks[skill] || []).length && s.type !== 'passive') slots.forEach((lv, i) => {
      const k = `sp:${s.key}:spec${i ? i + 1 : ''}`;
      add(k, { key: k, requires: { skillLv: lv, skill }, completesWith: ['tick'] });
    });
  }
  /* the board nodes of the build's plan on each skill: [save key, adds] (rule:specialty-slots: a node adds its `adds`) */
  const planOn = new Map();
  for (const e of build.boardPlan) if (e.node) { const n = nodeById.get(e.node); if (n.skill) { if (!planOn.has(n.skill)) planOn.set(n.skill, []); planOn.get(n.skill).push([n.key, n.adds ?? 1]); } }
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
      if (a.skillLv !== undefined) {   /* effective skill level: the highest ticked line (1 if none) + the adds of the ticked plan nodes on it */
        const L = Math.max(1, ...(lineKeys.get(a.skill) || []).filter(([, k]) => checks[k]).map(([l]) => l));
        const have = L + (planOn.get(a.skill) || []).filter(([k]) => checks[k]).reduce((t, [, n]) => t + n, 0);
        return have >= a.skillLv ? [] : [{ kind: 'skill', skill: a.skill, need: a.skillLv, have }];
      }
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

/* The place oracle (0.5 P11, docs/design/0.4-smart-next-up.md §4, §8.1, §8.2, §11): where the player is, the bound
   Kibelisks and the "Bind X" row, written from that design over the raw JSON (the records' giver / turnin / entrance /
   location blocks, kibelisks.json, zones.json, the step texts' "(Kibelisk: X)" markers and `binds` facts, the rules'
   values). It reads neither NODE_PLACE / KIBELISKS nor src/core/place.js nor src/packs/aion2/travel.js; "done" is the
   oracle's own (O.at with derived completion and the follow-up rule, as the app runs).

   loadPlaceOracle({ root, O }) → P
     P.R, P.nudgeR, P.gain           rule:kibelisk-bind-radius, rule:kibelisk-nudge-radius, rule:teleport-gain
     P.kibs                          Map Kibelisk id → { name, zone, map }
     P.whereNow(c) → { via, t, zone, pt } | null   §4: the newest dated stamp that places the player (a tie: the larger key)
     P.boundSet(c, { R }) → Set of Kibelisk ids    §8.1: a visited point within R, a "bind:" tick, a visited `binds` objective
     P.nudge(c, { R }) → { kib, m } | null         §8.2: the current quest's turn-in at R < m ≤ nudge radius from its
                                                   Kibelisk, not bound, the first in-band point of that Kibelisk in story order
     P.turnin(quest) → { anchor, m, map } | null   the quest's turn-in point (the nudge's target) */
export function loadPlaceOracle({ root, O }) {
  const recs = f => read(root, f).records;
  const story = recs('packs/aion2/asmodian/story-quests.json'), rqs = recs('packs/aion2/asmodian/regional-quests.json');
  const sds = recs('packs/aion2/asmodian/sealed-dungeons.json'), shs = recs('packs/aion2/asmodian/strongholds.json');
  const zones = new Map(recs('packs/aion2/asmodian/zones.json').map(z => [z.id, z]));
  const rule = id => { const r = recs('packs/aion2/rules.json').find(x => x.id === id); if (!r) throw new Error('place oracle: no ' + id); return r.value; };
  const R0 = rule('rule:kibelisk-bind-radius'), nudgeR = rule('rule:kibelisk-nudge-radius'), gain = rule('rule:teleport-gain');
  const kibRecs = recs('packs/aion2/asmodian/kibelisks.json'), kibs = new Map(kibRecs.map(k => [k.id, { name: k.name, zone: k.zone, map: k.map }]));
  const kibOfName = new Map(kibRecs.map(k => [k.name, k.id]));
  /* a zone the data has a place for (not one waiting for an owner check) */
  const zoneOk = z => z && zones.has(z) && zones.get(z).status !== 'owner-check' ? z : null;
  /* a location block → { anchor, m, map, x, y } (no anchor: null; m only with an anchor), or null when it names neither */
  const pointOf = l => { if (!l) return null; const anchor = l.kibelisk ? kibOfName.get(l.kibelisk) ?? null : null, xy = l.coords || null;
    if (!anchor && !xy) return null;
    return { anchor, m: anchor && l.meters != null ? l.meters : null, map: xy && xy.map, x: xy && xy.x, y: xy && xy.y }; };
  const ptOf = p => p && typeof p.map === 'string' && p.map && Number.isFinite(p.x) && Number.isFinite(p.y) ? { map: p.map, x: p.x, y: p.y } : null;
  const spot = (zone, p) => zone || ptOf(p) ? { zone: zone || null, pt: ptOf(p) } : null;
  /* the story chain in order (O.chain), its records, and save key → record for the other kinds */
  const sById = new Map(story.map(s => [s.id, s])), chain = O.chain.map(([id]) => sById.get(id)), sIdx = new Map(chain.map((s, i) => [s.key, i]));
  const rqByKey = new Map(rqs.map(q => [q.key, q])), areaByKey = new Map([...sds.map(d => [d.key, { r: d, at: d.entrance }]), ...shs.map(s => [s.key, { r: s, at: s.location }])]);
  const storyZone = s => zoneOk(s.turnin.zone || s.giver.zone);
  const MARK = /\(Kibelisk: ([^)]+)\)/;

  /* what one dated stamp says (null: nothing about where the player was) */
  const placeOf = (f, k, i, v) => {
    if (f === 'checks') {
      if (v !== true) return null;
      if (k.startsWith('bind:')) { const K = kibs.get(k.slice(5)); return K ? spot(K.zone, null) : null; }
      /* a regional quest turned in: its turn-in (the zone of its Kibelisk, else the quest's); a dungeon or stronghold done: its entrance.
         Guide steps (the Ascension steps among them) have no place. */
      const q = rqByKey.get(k);
      if (q) { const p = pointOf(q.turnin), K = p && p.anchor ? kibs.get(p.anchor) : null; return spot((K && K.zone) || zoneOk(q.zone), p); }
      const a = areaByKey.get(k); return a ? spot(zoneOk(a.r.zone), pointOf(a.at)) : null;
    }
    if (f === 'started') { if (!v) return null; const q = rqByKey.get(k); return q ? spot(zoneOk(q.zone), pointOf(q.giver)) : null; }
    if (f === 'areaRun') { const a = areaByKey.get(k); return a ? spot(zoneOk(a.r.zone), pointOf(a.at)) : null; }
    if (f === 'qsteps') {
      if (v !== true) return null;
      const si = sIdx.get(k), s = si === undefined ? null : chain[si], step = s && s.steps.find(x => x.i === +i);
      const m = step && MARK.exec(step.text), K = m && kibOfName.has(m[1]) ? kibs.get(kibOfName.get(m[1])) : null;
      return spot(K ? K.zone : s ? storyZone(s) : null, null);
    }
    if (f === 'quest') {
      const [q, end] = Array.isArray(v) ? v : [], si = sIdx.get(q); if (si === undefined) return null;
      const s = chain[si];
      if (end === q) return spot(storyZone(s), pointOf(s.turnin));
      /* the giver; on a hop on the same map it stands at the previous quest's turn-in, so the zone is the previous quest's */
      const g = pointOf(s.giver), prev = si > 0 ? chain[si - 1] : null, pt = prev && pointOf(prev.turnin);
      const mapOf = p => p ? p.map || (p.anchor && kibs.get(p.anchor) ? kibs.get(p.anchor).map : null) : null;
      return spot(prev && mapOf(pt) && mapOf(pt) === mapOf(g) ? storyZone(prev) : storyZone(s), g);
    }
    return null;
  };
  /* §4: every dated stamp [t, value] (t > 0, value not null) in checks / started / areaRun / qsteps / quest */
  function whereNow(c) {
    const mt = c && c.mt; if (!mt || typeof mt !== 'object') return null;
    const all = [], st = (key, f, k, i, s) => { if (Array.isArray(s) && s.length === 2 && typeof s[0] === 'number' && s[0] > 0 && s[1] != null) all.push({ key, t: s[0], at: placeOf(f, k, i, s[1]) }); };
    for (const f of ['checks', 'started', 'areaRun']) for (const [k, s] of Object.entries(mt[f] || {})) st(f === 'checks' ? k : `${f}:${k}`, f, k, null, s);
    for (const [q, o] of Object.entries(mt.qsteps || {})) for (const [i, s] of Object.entries(o || {})) st(`qsteps:${q}:${i}`, 'qsteps', q, i, s);
    st('quest', 'quest', null, null, mt.quest);
    const best = all.filter(x => x.at).sort((a, b) => b.t - a.t || (a.key < b.key ? 1 : a.key > b.key ? -1 : 0))[0];
    return best ? { via: best.key, t: best.t, zone: best.at.zone, pt: best.at.pt } : null;
  }

  /* §8.1: the points the player has visited */
  const turnedIn = c => { const i = sIdx.get(c.quest); return i === undefined ? 0 : i + (c.storyEnd === c.quest ? 1 : 0); };
  function visited(c) {
    const out = [], ti = turnedIn(c), qs = c.qsteps || {}, checks = c.checks || {}, run = c.areaRun || {}, started = c.started || {};
    chain.forEach((s, i) => { if (i < ti || (qs[s.key] || []).length) out.push(pointOf(s.giver)); if (i < ti) out.push(pointOf(s.turnin)); });
    const S = O.at(c, { derived: true, followUps: true });
    const done = r => !!checks[r.key] || !!(S.node(r.id) || {}).done;
    for (const q of rqs) { const prog = started[q.key] === true ? 1 : started[q.key] || 0;
      if (done(q) || prog > 0) out.push(pointOf(q.giver)); if (done(q)) out.push(pointOf(q.turnin)); }
    for (const [k, a] of areaByKey) if (done(a.r) || run[k]) out.push(pointOf(a.at));
    return out.filter(Boolean);
  }
  function boundSet(c, { R = R0 } = {}) {
    const out = new Set(), ti = turnedIn(c), qs = c.qsteps || {};
    for (const p of visited(c)) if (p.anchor && p.m != null && p.m <= R) out.add(p.anchor);
    for (const [k, v] of Object.entries(c.checks || {})) if (v === true && k.startsWith('bind:') && kibs.has(k.slice(5))) out.add(k.slice(5));
    chain.forEach((s, i) => s.steps.forEach(x => { if (x.binds && kibs.has(x.binds.kibelisk) && (i < ti || (qs[s.key] || []).includes(x.i))) out.add(x.binds.kibelisk); }));
    return out;
  }
  /* §8.2 */
  const turnin = q => { const i = sIdx.get(q); return i === undefined ? null : pointOf(chain[i].turnin); };
  function nudge(c, { R = R0 } = {}) {
    if (!c.quest || c.storyEnd === c.quest || !sIdx.has(c.quest)) return null;
    const T = turnin(c.quest), band = p => !!p && !!p.anchor && p.m != null && p.m > R && p.m <= nudgeR;
    if (!band(T)) return null;
    /* the first point in story order (giver, then turn-in, quest by quest) with T's Kibelisk in the band */
    let first = null;
    for (let i = 0; i < chain.length && !first; i++) for (const [w, l] of [['giver', chain[i].giver], ['turnin', chain[i].turnin]]) {
      const p = pointOf(l); if (band(p) && p.anchor === T.anchor) { first = { i, w }; break; } }
    if (!first || first.i !== sIdx.get(c.quest) || first.w !== 'turnin' || boundSet(c, { R }).has(T.anchor)) return null;
    return { kib: T.anchor, m: T.m };
  }
  return { R: R0, nudgeR, gain, kibs, whereNow, boundSet, nudge, turnin };
}
