/* The requirement evaluator (0.3 E1, pure: no DOM, no storage, no clock; docs/design/0.3-requirement-engine.md §3–§5).
   One pass answers, for every trackable thing in GATE_GRAPH (compiled by tools/gen/gen.mjs from the live `requires` /
   `completesWith` of the data), "done?", "open now?" and, if not, what blocks it. Not wired in yet: the page does not
   import this module until E2, and tests/core/evaluator-equivalence.test.mjs holds it to today's gate code.

   evaluate(c, opts) → Ev, for the character c = char(state); memoised per node, nothing written.
     Ev.node(id) → { id, kind, key, done, via?, open, blockers, root, info, basis, eta } (null for an unknown id)
       done: false | "tick" | "derived" (via: the completesWith entry that held);  open: requires met
       blockers: the unmet atoms, story first, then level, then done ({kind: "done", of, chain: that node's blockers})
       root: the first leaf of the chain (what to do first);  info: playerChecked atoms (shown, never enforced)
       basis: the weakest atom basis of the gate (null when it has no atom);  eta: {level?, quest?, turnIn?}, null when open
     Ev.byKey(k) → Ev.node of the node with save key k;  Ev.list(filter) → every node in catalog order;  Ev.evals → nodes evaluated
   opts: graph (default GATE_GRAPH; tests pass their own), derived (default false: a node that can be ticked is done by
   its tick only, as today; true adds its other completesWith entries, §5, E4). A node with no tick (story quests,
   unlocks) is always done by its completesWith (the story position). Proposals are not in the graph (E5 / E9). */
import { GATE_GRAPH } from "../data/gate-graph.js";

/* strongest first; an atom without a basis counts as legacy (carried over, no recorded source) */
const EV_BASES = ["sourced", "owner", "rule", "inferred", "owner-check", "legacy"];
const EV_KIND_ORDER = { story: 0, level: 1, done: 2 };
/* per graph: story name → chain index (the save stores the name), story id → index, save key → node id */
const evIndex = new WeakMap();
const evIndexOf = g => {
  let x = evIndex.get(g);
  if (!x) { x = { byName: new Map(g.story.map(([, n], i) => [n, i])), byId: new Map(g.story.map(([id], i) => [id, i])), byKey: new Map() };
    for (const [id, n] of Object.entries(g.nodes)) if (n.key !== undefined && !x.byKey.has(n.key)) x.byKey.set(n.key, id);
    evIndex.set(g, x); }
  return x;
};
const evVia = e => e.story ? `${e.is} ${e.story}` : e.done ? `done ${e.done}` : e.level !== undefined ? `level ${e.level}` : JSON.stringify(e);

export function evaluate(c, { graph = GATE_GRAPH, derived = false } = {}) {
  const N = graph.nodes, ix = evIndexOf(graph), checks = c.checks || {}, lv = c.level || 0;
  /* pos: index of the current quest in the story chain, -1 if unset or unknown */
  const pos = c.quest && ix.byName.has(c.quest) ? ix.byName.get(c.quest) : -1;
  const memo = new Map(), busy = new Set();
  let evals = 0;

  /* one gate → { ok, blockers }; playerChecked atoms go to info, atom bases to bases */
  const test = (g, info, bases) => {
    if (g.all) { const r = g.all.map(x => test(x, info, bases)); return { ok: r.every(x => x.ok), blockers: r.flatMap(x => x.blockers) }; }
    if (g.any) { const r = g.any.map(x => test(x, info, bases)); if (r.some(x => x.ok)) return { ok: true, blockers: [] };
      return { ok: false, blockers: r.reduce((a, b) => b.blockers.length < a.blockers.length ? b : a).blockers }; }   /* the cheapest branch */
    if (g.playerChecked) { info.push(g); return { ok: true, blockers: [] }; }
    bases.push(g.basis || "legacy");
    if (g.level !== undefined) return lv >= g.level ? { ok: true, blockers: [] } : { ok: false, blockers: [{ kind: "level", need: g.level, have: lv }] };
    if (g.story) {
      const i = ix.byId.get(g.story), name = graph.story[i][1], turnIn = g.is === "turnedIn";
      const ok = pos >= 0 && (turnIn ? pos > i || (pos === i && c.storyEnd === name) : pos >= i);
      return ok ? { ok, blockers: [] } : { ok, blockers: [{ kind: "story", quest: g.story, name, ahead: pos < 0 ? null : i - pos + (turnIn ? 1 : 0), ...(turnIn ? { turnIn } : {}) }] };
    }
    if (g.done) { const y = node(g.done); if (!y) throw new Error(`evaluate: unknown node ${g.done}`);
      return y.done !== false ? { ok: true, blockers: [] } : { ok: false, blockers: [{ kind: "done", of: g.done, chain: y.blockers }] }; }
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
    if (memo.has(id)) return memo.get(id);
    const n = N[id];
    if (!n) return null;
    if (busy.has(id)) throw new Error(`evaluate: cycle at ${id}`);   /* the generator rejects cycles; a test graph might not */
    busy.add(id); evals++;
    const info = [], bases = [];
    /* a plan node inherits its board's gate (§10) */
    const req = test(n.board ? { all: [n.req, N[n.board].req] } : n.req, info, bases);
    const blockers = req.blockers.map((b, j) => [b, j]).sort((a, b) => EV_KIND_ORDER[a[0].kind] - EV_KIND_ORDER[b[0].kind] || a[1] - b[1]).map(([b]) => b);
    let done = false, via = null;
    const tickable = n.done.includes("tick");
    if (tickable && n.key !== undefined && checks[n.key]) done = "tick";
    else if (!tickable || derived) for (const e of n.done) if (e !== "tick" && test(e, [], []).ok) { done = "derived"; via = evVia(e); break; }
    const worst = bases.reduce((w, b) => Math.max(w, EV_BASES.indexOf(b)), -1);
    const r = { id, kind: n.kind, key: n.key, done, ...(via ? { via } : {}), open: req.ok, blockers, root: rootOf(blockers), info,
      basis: worst < 0 ? null : EV_BASES[worst], eta: req.ok ? null : etaOf(blockers) };
    busy.delete(id); memo.set(id, r);
    return r;
  }

  return {
    node,
    byKey: k => ix.byKey.has(k) ? node(ix.byKey.get(k)) : null,
    list: (filter = () => true) => Object.keys(N).map(node).filter(filter),
    get evals() { return evals; },
  };
}
