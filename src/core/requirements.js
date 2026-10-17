/* Requirements and derived facts (0.2 P3; the engine's part since 0.4 P2b, pure: no DOM). What is open, done or next for a
   character, from the save and the pack's catalog. Functions take the character (c = char(state)) or, where a view
   setting changes the answer (the Optional tasks filter, the talk-only objectives filter), the whole state. Nothing here
   writes. Every "is it open?" answer comes from the evaluator (gatesOf below, 0.3 E2); this file only asks it.
   The game's own rules and helpers are the pack's (keptRules, gateChanges, graphTransforms, story hooks; for AION 2
   src/packs/aion2/rules.js and requirements.js); this file reaches them through the pack object only. */
import { evaluate } from "./evaluator.js";
import { aheadText, blockerChain, leafText, questsAhead } from "./blockers.js";
import { cardRows, itemByK } from "./catalog.js";
import { activePack, perPack } from "./pack.js";
import { char } from "./state.js";

/* ---------- Gates (0.3 E2, docs/design/0.3-requirement-engine.md §8) ---------- */
/* The switches (0.3 E4, design §5, §13): the pack's table (gateChanges) names them, each on by default; setGateChanges (the
   golden runner, the equiv suite) picks a set. A proposal names the rule switch it needs ("needs"), and turning it on
   turns that on too. The engine itself reads five: derived, followUps (evaluator options), turnInLevel, blockerText,
   stepNotes; a name the pack doesn't declare reads as on. Derived values are computed on every evaluation and never written. */
let SWITCHES = null;
const switchesOf = () => { const p = activePack(); if (!SWITCHES || SWITCHES.pack !== p) SWITCHES = { pack: p, on: new Set(Object.keys(p.gateChanges)), opts: null }; return SWITCHES; };
/* Turn on exactly these changes (and what they need); returns the set now on. */
export const setGateChanges = names => {
  const p = activePack(), table = p.gateChanges, on = new Set();
  for (const n of names) { if (!table[n]) throw new Error("setGateChanges: unknown change " + n); on.add(n); (table[n].needs || []).forEach(d => on.add(d)); }
  SWITCHES = { pack: p, on, opts: null };
  return [...on];
};
export const gateChangeOn = n => !(n in activePack().gateChanges) || switchesOf().on.has(n);
/* The app graph: the pack's GATE_GRAPH with its graph transforms whose `when` holds ("always", or { off: switch } while
   that switch is off), in list order. Memoised per pack and per prefix of transforms applied, so every set of switches
   builds each graph once and the page's set (all on) shares one graph. */
const appGraph = () => {
  const p = activePack(), memo = perPack("appGraphs", () => new Map());
  let g = p.data.graph, key = "";
  for (const t of p.graphTransforms) { if (t.when !== "always" && gateChangeOn(t.when.off)) continue;
    key += "|" + t.id; if (!memo.has(key)) memo.set(key, t.apply(g)); g = memo.get(key); }
  return g;
};
const evOpts = () => { const s = switchesOf();
  return s.opts || (s.opts = { graph: appGraph(), derived: gateChangeOn("derived"), followUps: gateChangeOn("followUps"),
    apply: Object.keys(s.pack.gateChanges).filter(n => s.on.has(n) && s.pack.gateChanges[n].apply).map(n => s.pack.gateChanges[n].apply) }); };
/* The evaluator for this character (at level lv, default its own), with the E4 changes that are on (all of them on the
   page). Evaluated lazily and memoised per call: ask it once per pass and pass it along where a function takes `ev`.
   Inside gatesPass(fn) the same character object, level and options give the same evaluator: update() asks ~500
   times per render, and a fresh one each time was over a third of its cost. The character must not change while fn runs
   (update() only reads it; every write is in a handler that calls update() afterwards). */
let PASS = null, RUNS = 0;
/* how many evaluators gatesOf has built (tests/regress.js: one update() builds at most a few) */
export const gatesRuns = () => RUNS;
export function gatesPass(fn) {
  if (PASS) return fn();
  PASS = { opts: evOpts(), chars: new WeakMap() };
  try { return fn(); } finally { PASS = null; }
}
export const gatesOf = (c, lv = c.level) => {
  const o = evOpts(), run = () => (RUNS++, evaluate)(lv === c.level ? c : { ...c, level: lv }, o);
  if (!PASS || PASS.opts !== o) return run();
  let m = PASS.chars.get(c); if (!m) PASS.chars.set(c, m = new Map());
  let ev = m.get(lv); if (!ev) m.set(lv, ev = run());
  return ev;
};
/* The pack's live gates alone: its GATE_GRAPH with no transform and no switch (a pack's display that reads the data's
   gate as it is, e.g. a "later" tag). */
export const liveGatesOf = c => evaluate(c);
/* Done: ticked, or derived (from the story, a wrapper quest, a follow-up). A key with no gate node: its tick. */
export const doneOf = (c, k, ev = gatesOf(c)) => { const r = ev.byKey(k); return r ? r.done !== false : !!c.checks[k]; };
/* Done by derivation only (not ticked): the row shows a ticked, disabled box ("done in the story"); its stored tick,
   true, false or absent, is left alone and counts again once the derivation stops holding (A3). The node's result, or null. */
export const derivedOf = (c, k, ev = gatesOf(c)) => { const r = ev.byKey(k); return r && r.done === "derived" ? r : null; };
/* A node's gate holds apart from its atoms of these kinds ("level", "story", "done"): e.g. a milestone step without its
   milestone's own level, which the callers already pick milestones by. */
export const openBut = (r, ...kinds) => r.open || r.blockers.every(b => kinds.includes(b.kind));
/* Open now: the item with save key k. */
export const openOf = (c, k, lv) => gatesOf(c, lv).byKey(k).open;

/* ---------- Story (the pack's data.story) ---------- */
/* Position in the story chain (display: timeline, quest navigation); gates read storyGate. */
export const storyIdx = n => activePack().data.story.quests.findIndex(([, q]) => q === n);
/* Index of the current story quest, -1 when none is set (or the name is unknown). */
export const questIdx = c => c.quest ? storyIdx(c.quest) : -1;
const storyIdOf = name => perPack("storyIds", p => new Map(p.data.graph.story.map(([id, n]) => [n, id]))).get(name);
/* One story atom for c, by quest name (is: "reached" or "turnedIn"): { ok, ahead } (ahead = quests to go, 0 when ok,
   null with the story unset), or null for a name that isn't on the chain. */
export const storyGate = (c, name, is = "reached") => {
  const id = storyIdOf(name); if (!id) return null;
  const r = gatesOf(c).atom({ story: id, is });
  return { ok: r.ok, ahead: r.ok ? 0 : r.blockers[0].ahead };
};
/* "Turned in" on the current quest waits for the quest's unlock level, a level atom of its live gate (0.3 E4, Q10
   follow-up: the game won't open it below that level, so it can't be turned in either). The level it still needs, else 0. */
export const turnInNeedsLv = (c, ev = gatesOf(c)) => {
  const id = gateChangeOn("turnInLevel") && storyIdOf(c.quest); if (!id) return 0;
  const b = ev.node(id).blockers.find(b => b.kind === "level"); return b ? b.need : 0;
};

/* ---------- Blocker text (0.3 E6, design §4; the words are src/core/blockers.js) ---------- */
/* With the switch off (the golden runner, --explain) the cards keep their 0.2 / E5 text. */
export const chainsOn = () => gateChangeOn("blockerText");
/* The story atoms of a node's gate as the page evaluates it: [{ name, turnIn }]. */
const storyAtomsOf = (ev, k) => { const r = ev.byKey(k), n = r && evOpts().graph.nodes[r.id]; if (!n) return [];
  const story = evOpts().graph.story, walk = g => g.all ? g.all.flatMap(walk) : g.any ? g.any.flatMap(walk) : g.story ? [{ name: story[g.i][1], turnIn: g.is === "turnedIn" }] : [];
  return walk(n.req); };
/* A milestone's automatic first line: the furthest story quest its rows name (it.story / it.after), turned in when a row
   under it waits for the turn-in (a turnedIn atom on that quest in its gate), else reached. { q, turnIn, ok, ahead, chip }
   (ahead / chip: the distance, null / "" with the story unset; the line itself names the quest), or null when no row
   names a story quest. Without the switch: reached, as before. */
export const storyLineOf = (c, g, ev = gatesOf(c)) => {
  const its = g.items.map((it, j) => ({ it, k: it.k || g.id + ":" + j })).filter(x => x.it.story || x.it.after);
  const qi = Math.max(-1, ...its.map(x => storyIdx(x.it.story || x.it.after)));
  if (qi < 0) return null;
  const q = activePack().data.story.quests[qi][1], turnIn = chainsOn() && its.some(x => storyAtomsOf(ev, x.k).some(a => a.name === q && a.turnIn));
  const sg = storyGate(c, q, turnIn ? "turnedIn" : "reached");
  return { q, turnIn, ok: sg.ok, ahead: sg.ok ? 0 : sg.ahead, chip: sg.ok ? (turnIn ? "turned in" : "reached") : sg.ahead == null ? "" : aheadText({ ahead: sg.ahead, turnIn }) };
};
/* The chip on a story-gated milestone step (data-story), from the step's own gate (its story atom, reached or turned in,
   or a step before it; the milestone's level is the card's own): { text, cls } with cls "now" / "ahead" / "" (passed),
   or null to leave it empty (story unset, or no gate node). */
export const stepChipOf = (c, k, story, ev = gatesOf(c)) => {
  const r = ev.byKey(k); if (!r) return null;
  const ch = r.done === false ? blockerChain(r, ev, { omit: ["level"] }) : null;
  if (ch) { const lf = ch.leaf;
    if (lf && lf.kind === "story" && lf.ahead == null) return null;
    /* a plain story leaf: the chip keeps to its distance ("your current quest — turn it in", "2 quests ahead"), the full
       line goes in its title, so the chip stays one line at 390 px */
    const plainStory = !ch.hop && lf && lf.kind === "story";
    return { text: plainStory ? aheadText(lf) : ch.text, title: ch.text, cls: plainStory && questsAhead(lf) === 0 ? "now" : "ahead" }; }
  const sg = storyGate(c, story); if (!sg || (!sg.ok && sg.ahead == null)) return null;
  return sg.ok ? (story === c.quest ? { text: "your current quest", cls: "now" } : { text: "story: passed", cls: "" })
    : { text: leafText({ kind: "story", name: story, ahead: sg.ahead }), cls: "ahead" };
};
/* An objective as shown: its text, then our note on it if it has one (data.story.notes, switch stepNotes). Display only:
   the pack's objective grammar (story.isTalkOnly, story.subs, story.here) reads the text alone, so a note never adds
   sub-steps or moves a location. */
export const objTextOf = (quest, i) => { const { steps, notes } = activePack().data.story, t = steps[quest][i], n = gateChangeOn("stepNotes") && (notes[quest] || {})[i];
  return n ? `${t.replace(/\.$/, "")}. ${n}` : t; };
/* ...split for the checklists: [what to do (bold), the rest (small)]. The note always goes with the small part, also on an
   objective with no " — " (the whole text is the bold part, the note alone the small one). */
export const objPartsOf = (quest, i) => { const { steps, notes } = activePack().data.story, t = steps[quest][i], n = gateChangeOn("stepNotes") && (notes[quest] || {})[i];
  const [a, b] = t.split(" — "); return !n ? [a, b] : [b ? a : a.replace(/\.$/, ""), b ? `${b.replace(/\.$/, "")}. ${n}` : n]; };
/* The objectives shown (and counted): all of them with "talk-only steps" on (state.showTalk), else the ones the pack
   doesn't call talk-only (story.isTalkOnly). */
export const objIdxOf = (state, list) => { const { isTalkOnly } = activePack().story; return list.map((t, i) => i).filter(i => state.showTalk || !isTalkOnly(list[i])); };

/* Quest progress: 0 = not picked up, 1 = in progress (old true values count as 1). */
export const qProgOf = (c, k) => { const v = (c.started || {})[k]; return v === true ? 1 : (v || 0); };

/* ---------- Milestones ---------- */
/* Rows of kind "none" (catalog.rowKind) are tracked elsewhere, not in milestone counts; "side" rows are counted apart
   (mainCountsOf, sideOpenOf). Optional tasks count toward their milestone only once ticked (an untouched one never makes a
   milestone "Missed"); the Optional tasks filter (state.hideOpt) hides them entirely. Done = ticked or derived (doneOf;
   0.3 E4: counts and tags count derived as done). */
export const checkableOf = (state, s, ev = gatesOf(char(state))) => { const c = char(state), { rowKind } = activePack().catalog;
  return s.items.map((it, j) => ({ it, k: it.k || s.id + ":" + j })).filter(x => !x.it.sub && !x.it.hidden && rowKind(x.it) !== "none" && !(x.it.opt && (state.hideOpt || !doneOf(c, x.k, ev)))); };
export const countsOf = (state, s, ev = gatesOf(char(state))) => { const c = checkableOf(state, s, ev); return [c.filter(x => doneOf(char(state), x.k, ev)).length, c.length]; };
/* Main tasks only (side rows are tracked in Next up), and how many side rows are still open. */
export const mainCountsOf = (state, s, ev = gatesOf(char(state))) => { const { rowKind } = activePack().catalog, c = checkableOf(state, s, ev).filter(x => rowKind(x.it) !== "side"); return [c.filter(x => doneOf(char(state), x.k, ev)).length, c.length]; };
export const sideOpenOf = (state, s, ev = gatesOf(char(state))) => { const { rowKind } = activePack().catalog; return checkableOf(state, s, ev).filter(x => rowKind(x.it) === "side" && !doneOf(char(state), x.k, ev)).length; };
export const isOpen = ([c, n]) => c < n;

/* Open steps of a milestone that Next up may offer, in card order: not done, one the pack offers (catalog.offered: rows
   with cards of their own are not), not optional (unless it's advice, it.adv), and with its gate met apart from the
   milestone's own level (callers pick the milestone: the one you're on, missed ones, the next one):
   - story / after: X = the story has reached X; turnedIn: X = X is turned in (story past it, or on it with storyEnd);
   - byStory = the step is story quest X: left to the story card while you're on X, done in game once you're past it
     (its completesWith; display only, the tick stays what counts until derived completion, E4);
   - a quest row (kind "quest"): its whole gate, or once picked up only its story gate.
   it = the item registered under the step's key (itemByK), as the page has always looked it up. A row without a gate
   node has no gate. */
export function openSteps(state, g) {
  const c = char(state), ev = gatesOf(c), out = [], { offered } = activePack().catalog;
  cardRows(g).forEach(({ it: row, k }) => {
    const r = ev.byKey(k);
    if (r ? r.done !== false : c.checks[k]) return;
    const rq = row.kind === "quest";
    const it = itemByK(k);
    if (!offered(it, k) || (row.opt && !(it && it.adv))) return;
    if (it && it.byStory && (it.story === c.quest || (r && ev.completes(r.id)))) return;
    if (r && !(rq ? (qProgOf(c, k) > 0 ? openBut(r, "level", "done") : r.open) : openBut(r, "level"))) return;
    out.push({ k, it, row, rq, adv: !!(it && it.adv) });
  });
  return out;
}
