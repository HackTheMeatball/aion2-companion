/* The requirement evaluator (0.3 E1, pure: no DOM, no storage, no clock; docs/design/0.3-requirement-engine.md §3–§5).
   One pass answers, for every trackable thing in GATE_GRAPH (compiled by tools/gen/gen.mjs from the live `requires` /
   `completesWith` of the data), "done?", "open now?" and, if not, what blocks it. Since E2 every gate decision of the
   page goes through it (src/core/requirements.js gatesOf, with the 0.2 rules the data doesn't hold yet as named
   KEPT_RULES); tests/equiv/evaluator-equivalence.test.mjs holds both to the frozen 0.2 gate code.

   evaluate(c, opts) → Ev, for the character c = char(state); memoised per node, nothing written.
     Ev.node(id) → { id, kind, key, done, via?, open, blockers, root, info, basis, eta } (null for an unknown id)
       done: false | "tick" | "derived" (via: the completesWith entry that held);  open: requires met
       blockers: the unmet atoms, story first, then level, then done ({kind: "done", of, chain: that node's blockers})
       root: the first leaf of the chain (what to do first);  info: playerChecked atoms (shown, never enforced)
       basis: the weakest atom basis of the gate (null when it has no atom);  eta: {level?, quest?, turnIn?}, null when open
     Ev.byKey(k) → Ev.node of the node with save key k;  Ev.list(filter) → every node in catalog order;  Ev.evals → nodes evaluated
     Ev.atom(gate) → { ok, blockers } of an ad-hoc gate;  Ev.completes(id) → the non-tick completesWith entry that holds, or null
   opts: graph (default GATE_GRAPH; tests pass their own), derived (default false: a node that can be ticked is done by
   its tick only, as in 0.2; true adds its other completesWith entries, §5, E4). A node with no tick (story quests,
   unlocks) is always done by its completesWith (the story position).
     apply: ids whose proposal (GATE_PROPOSED: the data's `proposed`, compiled) replaces the live requires / completesWith
       (§13; default none). A proposed completesWith beyond "tick" on a node that can be ticked holds only with derived.
     followUps (default false; §5.3, owner Q3): a regional quest picked up or ticked proves that the regional quests its
       gate names (a `done` atom with basis sourced or owner) were turned in, and theirs in turn: done "derived", via
       "followUp <the quest that proves it>". Read from ticks and pick-ups only, never from other derived values.
   Derived values are computed on every call and never written: the character is only read. */
import { GATE_GRAPH } from "../data/gate-graph.js";
import { GATE_PROPOSED } from "../data/gate-proposed.js";

/* strongest first; an atom without a basis counts as legacy (carried over, no recorded source) */
const EV_BASES = ["sourced", "owner", "rule", "inferred", "owner-check", "legacy"];
const EV_RANK = Object.fromEntries(EV_BASES.map((b, i) => [b, i]));
/* a met gate (shared: nothing writes to a result) */
const EV_MET = Object.freeze({ ok: true, blockers: Object.freeze([]) });
const EV_KIND_ORDER = { story: 0, level: 1, done: 2 };
/* the follow-up rule reads only edges a source or the owner backs (an owner-check edge may be wrong: never derive from it) */
const EV_FOLLOW_BASES = new Set(["sourced", "owner"]);
const evAtoms = g => g.all ? g.all.flatMap(evAtoms) : g.any ? g.any.flatMap(evAtoms) : [g];
/* per graph: story name → chain index (the save stores the name), story id → index, save key → node id, regional quest ids */
const evIndex = new WeakMap();
const evIndexOf = g => {
  let x = evIndex.get(g);
  if (!x) { x = { byName: new Map(g.story.map(([, n], i) => [n, i])), byId: new Map(g.story.map(([id], i) => [id, i])), byKey: new Map(), rq: Object.keys(g.nodes).filter(id => g.nodes[id].kind === "rq") };
    for (const [id, n] of Object.entries(g.nodes)) if (n.key !== undefined && !x.byKey.has(n.key)) x.byKey.set(n.key, id);
    evIndex.set(g, x); }
  return x;
};
const evVia = e => e.story ? `${e.is} ${e.story}` : e.done ? `done ${e.done}` : e.level !== undefined ? `level ${e.level}` : JSON.stringify(e);

export function evaluate(c, { graph = GATE_GRAPH, derived = false, apply = null, proposed = GATE_PROPOSED, followUps = false } = {}) {
  const N = graph.nodes, ix = evIndexOf(graph), checks = c.checks || {}, lv = c.level || 0;
  /* the node definitions of this call: the live ones, with a proposal's req / done over them for an id in apply */
  const A = apply ? new Set(apply) : null, defs = new Map();
  const def = id => {
    if (!A || !A.has(id)) return N[id];
    if (!defs.has(id)) { const n = N[id], p = proposed[id];
      defs.set(id, n && p ? { ...n, ...(p.req ? { req: p.req } : {}), ...(p.done ? { done: p.done } : {}) } : n); }
    return defs.get(id);
  };
  /* pos: index of the current quest in the story chain, -1 if unset or unknown */
  const pos = c.quest && ix.byName.has(c.quest) ? ix.byName.get(c.quest) : -1;
  const memo = new Map(), BUSY = {};
  let evals = 0;
  /* followUps: regional quest id → the picked-up or ticked quest that proves it was turned in (built once, on first use) */
  let proven = null;
  const provenOf = () => {
    if (proven) return proven;
    proven = new Map();
    const started = c.started || {}, todo = ix.rq.filter(id => N[id].key !== undefined && (checks[N[id].key] || started[N[id].key]));
    while (todo.length) { const id = todo.pop();
      for (const a of evAtoms(def(id).req)) if (a.done && N[a.done] && N[a.done].kind === "rq" && EV_FOLLOW_BASES.has(a.basis) && !proven.has(a.done)) { proven.set(a.done, id); todo.push(a.done); } }
    return proven;
  };

  /* one gate → { ok, blockers }; playerChecked atoms go to acc.info, the weakest atom basis to acc.worst */
  const test = (g, acc) => {
    if (g.all) { let bs = null; for (const x of g.all) { const r = test(x, acc); if (!r.ok) bs = bs ? bs.concat(r.blockers) : r.blockers; }
      return bs ? { ok: false, blockers: bs } : EV_MET; }
    if (g.any) { let best = null; for (const x of g.any) { const r = test(x, acc); if (r.ok) best = EV_MET; else if (!best || (!best.ok && r.blockers.length < best.blockers.length)) best = r; }
      return best || { ok: false, blockers: [] }; }   /* none holds: the cheapest branch (fewest blockers) */
    if (g.playerChecked) { acc.info.push(g); return EV_MET; }
    acc.worst = Math.max(acc.worst, EV_RANK[g.basis] ?? EV_RANK.legacy);
    if (g.level !== undefined) return lv >= g.level ? EV_MET : { ok: false, blockers: [{ kind: "level", need: g.level, have: lv }] };
    if (g.story) {
      const i = ix.byId.get(g.story), name = graph.story[i][1], turnIn = g.is === "turnedIn";
      const ok = pos >= 0 && (turnIn ? pos > i || (pos === i && c.storyEnd === name) : pos >= i);
      return ok ? EV_MET : { ok, blockers: [{ kind: "story", quest: g.story, name, ahead: pos < 0 ? null : i - pos + (turnIn ? 1 : 0), ...(turnIn ? { turnIn } : {}) }] };
    }
    if (g.done) { const y = node(g.done); if (!y) throw new Error(`evaluate: unknown node ${g.done}`);
      return y.done !== false ? EV_MET : { ok: false, blockers: [{ kind: "done", of: g.done, chain: y.blockers }] }; }
    throw new Error("evaluate: unknown atom " + JSON.stringify(g));
  };
  const rootOf = bs => { const b = bs[0]; return !b ? null : b.kind === "done" && b.chain.length ? rootOf(b.chain) : b; };
  /* the earliest level and story position at which the gate can hold: the highest level and the furthest story leaf */
  const etaOf = bs => {
    const e = {}; let at = -1;
    const walk = xs => xs.forEach(b => {
      if (b.kind === "level") e.level = Math.max(e.level || 0, b.need);
      else if (b.kind === "story") { const a = ix.byId.get(b.quest) + (b.turnIn ? 1 : 0); if (a > at) { at = a; e.quest = b.quest; if (b.turnIn) e.turnIn = true; else delete e.turnIn; } }
      else walk(b.chain);
    });
    walk(bs); return e;
  };

  function node(id) {
    const m = memo.get(id);
    if (m === BUSY) throw new Error(`evaluate: cycle at ${id}`);   /* the generator rejects cycles; a test graph might not */
    if (m) return m;
    const n = def(id);
    if (!n) return null;
    memo.set(id, BUSY); evals++;
    const acc = { info: [], worst: -1 };
    /* a plan node inherits its board's gate (§10) */
    const req = test(n.board ? { all: [n.req, def(n.board).req] } : n.req, acc);
    const blockers = req.blockers.length < 2 ? req.blockers
      : req.blockers.map((b, j) => [b, j]).sort((a, b) => EV_KIND_ORDER[a[0].kind] - EV_KIND_ORDER[b[0].kind] || a[1] - b[1]).map(([b]) => b);
    let done = false, via = null;
    const tickable = n.done.includes("tick");
    if (tickable && n.key !== undefined && checks[n.key]) done = "tick";
    else if (!tickable || derived) for (const e of n.done) if (e !== "tick" && test(e, { info: [], worst: -1 }).ok) { done = "derived"; via = evVia(e); break; }
    if (!done && followUps && n.kind === "rq" && provenOf().has(id)) { done = "derived"; via = "followUp " + provenOf().get(id); }
    const r = { id, kind: n.kind, key: n.key, done, open: req.ok, blockers, root: rootOf(blockers), info: acc.info,
      basis: acc.worst < 0 ? null : EV_BASES[acc.worst], eta: req.ok ? null : etaOf(blockers) };
    if (via) r.via = via;
    memo.set(id, r);
    return r;
  }

  return {
    node,
    byKey: k => ix.byKey.has(k) ? node(ix.byKey.get(k)) : null,
    list: (filter = () => true) => Object.keys(N).map(node).filter(filter),
    /* an ad-hoc gate (e.g. one story atom, with the chain id) for this character: { ok, blockers }; nothing memoised */
    atom: g => test(g, { info: [], worst: -1 }),
    /* the completesWith entry other than "tick" that holds now, whatever opts.derived says ("turnedIn sq:…"), else null:
       the display rule that hides a byStory step once the story is past it (§5.4) */
    completes: id => { const n = def(id); if (!n) return null;
      for (const e of n.done) if (e !== "tick" && test(e, { info: [], worst: -1 }).ok) return evVia(e);
      return null; },
    get evals() { return evals; },
  };
}
