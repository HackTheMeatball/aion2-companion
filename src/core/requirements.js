/* Requirements and derived facts (0.2 P3, pure: no DOM). What is open, done, affordable or next for a character, from
   the save and the catalog. Functions take the character (c = char(state)) or, where a view setting changes the answer
   (the Optional tasks filter, the talk-only objectives filter), the whole state. Nothing here writes.
   Every "is it open?" answer comes from the evaluator (gatesOf below, 0.3 E2); this file only asks it. */
import { QUESTS, QUEST_LOC, QUEST_STEPS, QUEST_STEP_NOTES } from "../data/story.js";
import { DV_MIN, E_ORDER, LEVEL_POINTS, RMB_STACK, SP_SLOTS, SP_STEPS, STIGMA_PLAN, ST_COST, ST_TARGETS } from "../data/build.js";
import { GATES } from "../data/milestones.js";
import { RQ } from "../data/generated.js";
import { GATE_GRAPH } from "../data/gate-graph.js";
import { AREA_ITEMS, DV_NODES, cardRows, itemByK } from "./catalog.js";
import { evaluate } from "./evaluator.js";
import { aheadText, blockerChain, blockerText, leafText, questsAhead } from "./blockers.js";
import { char } from "./state.js";

/* ---------- Gates (0.3 E2, docs/design/0.3-requirement-engine.md §8) ---------- */
/* The 0.2 rules the live data doesn't hold yet, kept exactly as they were so E2 changes nothing on screen. Each is applied
   in one place below and held to the frozen 0.2 code by tests/equiv; tests/core/gate-sources.test.mjs pins this list.
   They leave when the data takes them over (E5 / E9) or the owner decides otherwise. */
export const KEPT_RULES = {
  "stronghold-band": "a stronghold opens at its Sealed Dungeon band (src/core/catalog.js AREA_BANDS, inferred) as well as at " +
    "its lowest level (the live gate); the Areas list's \"later\" tag reads the lowest level only (areaLater)",
  "stigma-slot-1-after-g22:0": "slot 1 (g22:1) opens at its level once \"g22:0\" is done, not on the live gate's legacy " +
    "story atom (\"Daeva in a Dream\" reached); data: owner-check proposal, check 3",
  "stigma-equip-after-g22:0": "the equip offer (Next up, the Stigmas card's hero) waits for \"g22:0\" on every slot, " +
    "not only slot 1 (stigmaEquipOpen)",
  "stigma-rotation-slot-level": "the Build drawer's E keys count a slot from its level alone (slotLevelMet)",
  "story-card-recommended-level": "the story card's \"level up first\" reads the current quest's recommended level, " +
    "never on the first quest (storyRecGate; design Q10)",
};
/* GATE_GRAPH with the kept rules applied to the nodes they concern. Built once (the catalog is final by now). */
const levelAtoms = g => g.level !== undefined ? [g] : (g.all || []).flatMap(levelAtoms);
const APP_GRAPH = (() => {
  const nodes = { ...GATE_GRAPH.nodes }, idOf = {};
  for (const [id, n] of Object.entries(nodes)) if (n.key !== undefined && !(n.key in idOf)) idOf[n.key] = id;
  /* stronghold-band */
  AREA_ITEMS.filter(x => x.it.kind === "stronghold").forEach(x => { const id = idOf[x.k], n = nodes[id];
    nodes[id] = { ...n, req: { all: [n.req, { level: x.band, basis: "inferred" }] } }; });
  /* stigma-slot-1-after-g22:0 */
  { const id = idOf[GATES.flatMap(g => g.items).find(it => it.stig === 1).k], n = nodes[id];
    nodes[id] = { ...n, req: { all: [...levelAtoms(n.req), { done: idOf["g22:0"], basis: "legacy" }] } }; }
  /* Skill lines open at the level the Skills card shows (SP_STEPS req, the same formula as the graph's), read when asked:
     the card, its "Lv" text and the Build drawer share one number (0.2.2 F7, tests/e4test.js #15). Not the specialty slots:
     they open on effective skill level (0.3 E7; with the switch specialtySlots off, slot 1 at its line's level, appGraph). */
  SP_STEPS.filter(x => !x.spec).forEach(x => { const id = idOf[x.k], n = nodes[id], { basis } = n.req;
    nodes[id] = { ...n, get req() { return { level: x.req, basis }; } }; });
  return { story: GATE_GRAPH.story, nodes };
})();
/* The behaviour changes of 0.3 E4 (design §5, §13), each a named switch so tests/golden.js --explain can attribute every
   changed state to the smallest set of them that reproduces it. The page runs with every one on; setGateChanges (the
   golden runner, the equiv suite) picks a set. A proposal names the rule switch it needs ("needs"), and turning it on
   turns that on too. Derived values are computed on every evaluation and never written. */
export const GATE_CHANGES = {
  regionalTurnedIn: { what: "regional quests open when their story quest is turned in, not when it is reached (owner check 1, 2026-10-15: " +
    "Shugo-of-All-Trades and Spooky Specters are not offered while the quest before them is current; Empyrean Monolith check, 20:12 ET: all 6 of its " +
    "regional quests appear only once it is turned in); those two and The Great Curse-Breaking Caper also gain the story gate they lacked", baseline: true },
  derived: { what: "derived completion: a step that can be ticked is also done by its other completesWith (byStory steps " +
    "once their story quest is turned in, \"Put … on E\" once its slot is equipped, the wrapper quests g22:0 / g32:dreams once " +
    "\"Daeva in a Dream\" / \"A Daeva Dreaming Anew\" is turned in: owner-approved proposals, live data since 2026-10-15; g45:witness once " +
    "\"Daeva Trapped in a Nightmare\" is turned in: 0.3 E10)", baseline: true },
  storyStepDerived: { needs: ["derived"], what: "derived completion from a story step (owner, 2026-10-15): the Graverobber Den stronghold once Cemetery Cleanup's " +
    "step 4 is ticked or the quest turned in; the Krao Cave and Fire Temple \"Expedition opens\" rows once their story step is ticked or the quest turned in", baseline: true },
  followUps: { what: "a regional quest picked up or turned in proves the regional quests before it were turned in (Q3)", baseline: true },
  turnInLevel: { what: "\"Turned in\" on the current story quest waits for its unlock level (Q10 follow-up)", baseline: true },
  clearTally: { needs: ["followUps"], baseline: true, what: "Progress (one-time clears): a regional quest done by derivation (a follow-up proves it " +
    "turned in), or the Graverobber Den stronghold done by Cemetery Cleanup, counts with its clear reward (Wisdom Stone + crystal; belt scrolls) like a ticked one" },
  /* not a gate: guide text only, a switch so --explain attributes the states that show it */
  stepNotes: { what: "story objectives show our one-line note after their text (E9, owner 2026-10-15): the first Krao Cave, Urugugu Canyon and " +
    "Fire Temple Expedition runs (owner) and, \"probably\", Draupnir (inferred)", baseline: true },
  /* E5: the `ready` proposals of design §7, live data since 2026-10-16; with the switch off a record has its gate from before (GATE_OFF).
     baseline since E8: recorded in the snapshots by #78, so --explain keeps them on (else every E5 state reads "still differs with every change off") */
  merchantGate: { baseline: true, records: ["rq:2202029"], what: "Traveling Merchant's Conundrum opens once \"Blood Monument\" is turned in (Metabot \"Required first\") " +
    "instead of at its recommended Lv 33 (no prerequisite data before)" },
  lestWeForgetGate: { baseline: true, records: ["rq:2202046"], what: "Lest We Forget opens once \"Zikel's Core\" is turned in (Metabot \"Required first\") " +
    "instead of at its recommended Lv 45 (no prerequisite data before)" },
  beltGate: { baseline: true, records: ["g12:belt"], what: "the Noble Belt step is offered once \"Urgent Pursuit\" is turned in (it gives the belt; Metabot, owner screen " +
    "2026-10-15), not from Lv 13 alone" },
  amuletGate: { baseline: true, records: ["g16:amulet"], what: "the Revelation Amulet step is offered once \"Buried Atrocities\" is turned in (it gives the amulet; " +
    "Metabot, owner screen 2026-10-15), not from Lv 16 alone" },
  daevanionGate: { baseline: true, records: ["board:nezekan", "board:vaizel", "board:triniel", "board:zikel", "board:azphel"], what: "the Daevanion gate (the whole board screen): every " +
    "plan node is offered once \"Urgent Pursuit\" is turned in (unlock:daevanion, owner screen 2026-10-14) as well as at its board level" },
  /* E8: not a gate, display only (src/core/ascension.js); a switch so --explain attributes the Journey card's new line (recorded with E8: baseline) */
  ascensionBar: { baseline: true, records: ["asc:perceives", "asc:hears-the-voice", "asc:dreams", "asc:witnesses"], what: "the Journey card shows the Ascension bar under " +
    "the story timeline (design §11, both modes): 4 in-cap chapters, each filled once its wrapper quest is turned in or its guide step ticked, and a one-line label " +
    "naming the next chapter and, where sourced, the gauge (II: owner tooltip 2026-10-15; III: claim C36)" },
  /* E6: not a gate, the words for one (design §4, src/core/blockers.js); a switch so --explain attributes the states that show them.
     baseline since E7: recorded in the snapshots by #95 */
  blockerText: { baseline: true, what: "blocker-chain text (E6, design §4): Next up's Later cards, the milestone chips and \"Reach / Turn in\" line, the regional rows " +
    "and the Daevanion card say what opens a thing from the evaluator (\"needs Lv N\", \"unlocks after \\\"X\\\" · N quests ahead\", \"after \\\"Y\\\" " +
    "is turned in\"); the milestone line and its chips wait for a turn-in where the rows under them do (Basic: on milestone rows only)" },
  /* E7 (design §9, bug F3): off = slot 1 at the level of its skill's line 8 (learn + 18) and no slots 2 / 3 */
  specialtySlots: { what: "specialty slots 1-3 open at effective skill level 8 / 12 / 20 (highest skill line bought + the skill's plan board " +
    "nodes owned; rule:specialty-slots, owner F4) instead of slot 1 at the character level of the skill's line 8; slot 2 is offered once open, " +
    "slot 3 is listed in the Skills card only (Q5)" },
};
let CHANGES_ON = new Set(Object.keys(GATE_CHANGES)), EV_OPTS = null;
/* Turn on exactly these changes (and what they need); returns the set now on. */
export const setGateChanges = names => {
  const on = new Set();
  for (const n of names) { if (!GATE_CHANGES[n]) throw new Error("setGateChanges: unknown change " + n); on.add(n); (GATE_CHANGES[n].needs || []).forEach(d => on.add(d)); }
  CHANGES_ON = on; EV_OPTS = null;
  return [...on];
};
export const gateChangeOn = n => CHANGES_ON.has(n);
/* The 0.2 form of the regional gates, for the page with regionalTurnedIn off: every story atom of a regional quest "reached", and the three
   quests that had no story gate (Shugo-of-All-Trades, Spooky Specters, The Great Curse-Breaking Caper: "noPre", they opened at their
   recommended level) back on that rule. Same list in tests/support/gates-0.2.mjs and tests/golden/states.js. */
const RQ_NO_STORY_GATE = new Set(["rq:2202044", "rq:2202051", "rq:2202015"]);
const APP_GRAPH_0_2 = (() => {
  const down = (g, noPre) => g.all ? { all: g.all.map(x => down(x, noPre)) } : g.any ? { any: g.any.map(x => down(x, noPre)) }
    : g.story ? (noPre ? { level: Math.max(noPre.unlocksAt, noPre.rec), basis: "rule" } : { ...g, is: "reached" }) : g;
  const nodes = { ...APP_GRAPH.nodes };
  for (const [id, n] of Object.entries(nodes)) if (n.kind === "rq") nodes[id] = { ...n, req: down(n.req, RQ_NO_STORY_GATE.has(id) && RQ.find(q => "rq:" + q.id === id)) };
  return { story: APP_GRAPH.story, nodes };
})();
/* ...and without storyStepDerived: the three rows E9 gave a story completion (Graverobber Den, the Krao Cave and Fire Temple Expedition rows) are tick-only again. */
const STORY_STEP_ROWS = ["sh:graverobber-den", "g20:exp", "g35:exp"];
const withoutStoryStep = g => { const nodes = { ...g.nodes }; for (const id of STORY_STEP_ROWS) nodes[id] = { ...nodes[id], done: ["tick"] }; return { story: g.story, nodes }; };
/* ...and without an E5 switch: its records' gates as they were before E5 (the regional quests had no prerequisite data, so they open
   at max(unlocksAt, rec) as "noPre" did; the two steps at their milestone level; the boards with no window gate). Same in
   tests/support/gates-0.2.mjs and tests/golden/states.js. */
const noStory = g => g.all ? { all: g.all.filter(x => !x.story).map(noStory) } : g;
const GATE_OFF = {
  rq: (n, id) => { const q = RQ_BY_ID[id], lv = { level: Math.max(q.unlocksAt, q.rec), basis: "rule" }, f = g => g.all ? { all: g.all.map(f) } : g.story ? lv : g;
    return { ...n, req: f(n.req) }; },
  step: n => ({ ...n, req: noStory(n.req) }),
  board: n => ({ ...n, req: { all: [] } }),
};
const RQ_BY_ID = Object.fromEntries(RQ.map(q => ["rq:" + q.id, q]));
const withoutE5 = (g, names) => { const nodes = { ...g.nodes };
  for (const id of names.flatMap(n => GATE_CHANGES[n].records)) nodes[id] = GATE_OFF[nodes[id].kind](nodes[id], id);
  return { story: g.story, nodes }; };
const E5_SWITCHES = ["merchantGate", "lestWeForgetGate", "beltGate", "amuletGate", "daevanionGate"];
/* ...and without specialtySlots: slot 1 opens at the level of its skill's line 8 (SP_STEPS req, read when asked like the lines); slots 2 / 3
   are never offered (skillOpen leaves them out) */
const withoutSlots = g => { const nodes = { ...g.nodes };
  SP_STEPS.filter(x => x.spec).forEach(x => { const n = nodes[x.k]; nodes[x.k] = { ...n, get req() { return { level: x.req, basis: "rule" }; } }; });
  return { story: g.story, nodes }; };
const APP_GRAPHS = {};
const appGraph = () => { const a = CHANGES_ON.has("regionalTurnedIn"), b = CHANGES_ON.has("storyStepDerived"), off = E5_SWITCHES.filter(n => !CHANGES_ON.has(n)), f3 = CHANGES_ON.has("specialtySlots");
  const k = (a ? "t" : "r") + (b ? "s" : "n") + (f3 ? "f" : "o") + off.join(",");
  if (!APP_GRAPHS[k]) { const g = b ? (a ? APP_GRAPH : APP_GRAPH_0_2) : withoutStoryStep(a ? APP_GRAPH : APP_GRAPH_0_2), g5 = off.length ? withoutE5(g, off) : g;
    APP_GRAPHS[k] = f3 ? g5 : withoutSlots(g5); }
  return APP_GRAPHS[k]; };
const evOpts = () => EV_OPTS || (EV_OPTS = { graph: appGraph(), derived: CHANGES_ON.has("derived"), followUps: CHANGES_ON.has("followUps"),
  apply: Object.keys(GATE_CHANGES).filter(n => CHANGES_ON.has(n) && GATE_CHANGES[n].apply).map(n => GATE_CHANGES[n].apply) });
/* The evaluator for this character (at level lv, default its own), with the E4 changes that are on (all of them on the
   page). Evaluated lazily and memoised per call: ask it once per pass and pass it along where a function takes `ev`.
   Inside gatesPass(fn) the same character object, level and options give the same evaluator: update() asks ~500
   times per render, and a fresh one each time was 60% of its cost. The character must not change while fn runs
   (update() only reads it; every write is in a handler that calls update() afterwards). */
let PASS = null, RUNS = 0;
/* how many evaluators gatesOf has built (tests/e1test.js: one update() builds only a few) */
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
/* Done: ticked, or derived (from the story, a wrapper quest, a follow-up). A key with no gate node: its tick. */
export const doneOf = (c, k, ev = gatesOf(c)) => { const r = ev.byKey(k); return r ? r.done !== false : !!c.checks[k]; };
/* Done by derivation only (not ticked): the row shows a ticked, disabled box ("done in the story"); its stored tick,
   true, false or absent, is left alone and counts again once the derivation stops holding (A3). The node's result, or null. */
export const derivedOf = (c, k, ev = gatesOf(c)) => { const r = ev.byKey(k); return r && r.done === "derived" ? r : null; };
/* A one-time clear in the Progress tally (its clear reward, CLEAR_REWARD, counted): ticked, or with clearTally a regional
   quest done by derivation (a follow-up proves you turned it in). Computed, never written: the Cube and the stone /
   crystal totals only move on a tick (main.js), so a derived quest's reward is counted here and nowhere twice. */
export const clearDoneOf = (c, k, ev = gatesOf(c)) => !!c.checks[k] || (CHANGES_ON.has("clearTally") && !!derivedOf(c, k, ev));
/* A node's gate holds apart from its atoms of these kinds ("level", "story", "done"): e.g. a milestone step without its
   milestone's own level, which the callers already pick milestones by. */
export const openBut = (r, ...kinds) => r.open || r.blockers.every(b => kinds.includes(b.kind));
/* Open now: the item with save key k (a skill line, a plan node, a stigma slot, …). */
export const openOf = (c, k, lv) => gatesOf(c, lv).byKey(k).open;

/* ---------- Story ---------- */
/* Position in the story chain (display: timeline, quest navigation); gates read storyGate. */
export const storyIdx = n => QUESTS.findIndex(([, q]) => q === n);
/* Index of the current story quest, -1 when none is set (or the name is unknown). */
export const questIdx = c => c.quest ? storyIdx(c.quest) : -1;
const SQ_ID = new Map(GATE_GRAPH.story.map(([id, n]) => [n, id]));
/* One story atom for c, by quest name (is: "reached" or "turnedIn"): { ok, ahead } (ahead = quests to go, 0 when ok,
   null with the story unset), or null for a name that isn't on the chain. */
export const storyGate = (c, name, is = "reached") => {
  const id = SQ_ID.get(name); if (!id) return null;
  const r = gatesOf(c).atom({ story: id, is });
  return { ok: r.ok, ahead: r.ok ? 0 : r.blockers[0].ahead };
};
/* Kept rule "story-card-recommended-level": the story card is level-gated when the current quest's recommended level is
   above yours; the first story quest never gates (a new character in Ishalgen isn't told to level up first). */
export const storyRecGate = c => { const qi = questIdx(c), gateLv = qi > 0 ? QUESTS[qi][0] : 0; return { qi, gateLv, gated: gateLv > c.level }; };
/* "Turned in" on the current quest waits for the quest's unlock level, a level atom of its live gate (0.3 E4, Q10
   follow-up: the game won't open it below that level, so it can't be turned in either). The level it still needs, else 0. */
export const turnInNeedsLv = (c, ev = gatesOf(c)) => {
  const id = CHANGES_ON.has("turnInLevel") && SQ_ID.get(c.quest); if (!id) return 0;
  const b = ev.node(id).blockers.find(b => b.kind === "level"); return b ? b.need : 0;
};

/* ---------- Blocker text (0.3 E6, design §4; the words are src/core/blockers.js) ---------- */
/* With the switch off (the golden runner, --explain) the cards keep their 0.2 / E5 text. */
export const chainsOn = () => CHANGES_ON.has("blockerText");
/* The story atoms of a node's gate as the page evaluates it: [{ name, turnIn }]. */
const storyAtomsOf = (ev, k) => { const r = ev.byKey(k), n = r && evOpts().graph.nodes[r.id]; if (!n) return [];
  const story = evOpts().graph.story, walk = g => g.all ? g.all.flatMap(walk) : g.any ? g.any.flatMap(walk) : g.story ? [{ name: story[g.i][1], turnIn: g.is === "turnedIn" }] : [];
  return walk(n.req); };
/* A milestone's automatic first line: the furthest story quest its rows name (it.story / it.after), turned in when a row
   under it waits for the turn-in (a turnedIn atom on that quest in its gate: the regional quests since #73, the Noble Belt
   since E5), else reached. { q, turnIn, ok, ahead, chip } (ahead / chip: the distance, null / "" with the story unset;
   the line itself names the quest), or null when no row names a story quest. Without the switch: reached, as before. */
export const storyLineOf = (c, g, ev = gatesOf(c)) => {
  const its = g.items.map((it, j) => ({ it, k: it.k || g.id + ":" + j })).filter(x => x.it.story || x.it.after);
  const qi = Math.max(-1, ...its.map(x => storyIdx(x.it.story || x.it.after)));
  if (qi < 0) return null;
  const q = QUESTS[qi][1], turnIn = chainsOn() && its.some(x => storyAtomsOf(ev, x.k).some(a => a.name === q && a.turnIn));
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
/* What still opens a regional quest, for its row (one line, design §4), or "" when it is open. */
export const rqReqOf = (c, k, ev = gatesOf(c)) => blockerText(ev.byKey(k), ev);
/* Talk-only steps ("talk to …" with no trip, item or fight; turn-ins are the exception and always show) are hidden by
   default and count as done, so the list is only objectives where you travel, examine, collect, fight or deliver. */
export const objLow = t => { const [a, b = ""] = t.split(" — "); if (/^Turn in\b/i.test(a)) return false; /* turn-ins always show: they finish the quest */ return /^talk (to|via)\b/i.test(b) && !/^(Deliver|Find|Rendezvous|Go)\b/i.test(a); };
/* Multi-part objectives ("collect A, B, C", "inspect X; talk to Y", "search the A and B") get their own sub-checklist.
   Ticking every part ticks the objective; ticking the objective ticks every part. */
export function objSubs(t) {
  if (objLow(t) || /^Turn in\b/i.test(t)) return [];
  const b = (t.split(" — ")[1] || "").trim(), m = b.match(/\s*\(([^)]*)\)\s*$/), d = m ? b.slice(0, m.index) : b;
  let parts = d.split(/;\s*/).flatMap(x => x.split(/,\s*/)).map(x => x.trim()).filter(Boolean);
  if (parts.length === 1 && /^search the /i.test(d)) parts = d.replace(/^search the /i, "").split(/\s+and\s+/).map(x => "search the " + x);
  /* "talk to A, B" → "talk to A", "talk to B" */
  let verb = ""; parts = parts.map(x => { const v = x.match(/^([a-z]+(?: to| the)?)\s/); if (v && /^[a-z]/.test(x)) { verb = v[1]; return x; } return verb && /^[A-Z]/.test(x) && !/^(Lv|Balaur|Draconute|Outpost|Dratona|Broken)/.test(x) ? verb + " " + x : x; });
  return parts.length > 1 ? parts : [];
}
/* An objective as shown: its text, then our note on it if it has one (QUEST_STEP_NOTES, switch stepNotes). Display only:
   objLow / objSubs / storyHereOf read QUEST_STEPS, so a note never adds sub-steps or moves a Kibelisk. */
export const objTextOf = (quest, i) => { const t = QUEST_STEPS[quest][i], n = CHANGES_ON.has("stepNotes") && (QUEST_STEP_NOTES[quest] || {})[i];
  return n ? `${t.replace(/\.$/, "")}. ${n}` : t; };
/* ...split for the checklists: [what to do (bold), the rest (small)]. The note always goes with the small part, also on an
   objective with no " — " (Draupnir: the whole text is the bold part, the note alone the small one). */
export const objPartsOf = (quest, i) => { const t = QUEST_STEPS[quest][i], n = CHANGES_ON.has("stepNotes") && (QUEST_STEP_NOTES[quest] || {})[i];
  const [a, b] = t.split(" — "); return !n ? [a, b] : [b ? a : a.replace(/\.$/, ""), b ? `${b.replace(/\.$/, "")}. ${n}` : n]; };
/* The objectives shown (and counted): all of them with "talk-only steps" on (state.showTalk), else the non-talk ones. */
export const objIdxOf = (state, list) => list.map((t, i) => i).filter(i => state.showTalk || !objLow(list[i]));
/* Where the story sends you next: the next open objective's Kibelisk, or the turn-in's. A turn-in also carries the
   record's own zone (zone: "" = still a placeholder); an objective has no zone of its own. */
export function storyHereOf(state) {
  const c = char(state);
  if (!c.quest) return null;
  const list = QUEST_STEPS[c.quest], done = (c.qsteps || {})[c.quest] || [], L = QUEST_LOC[c.quest] || {};
  const turnin = () => L.turninKib ? { kib: L.turninKib, m: L.turninKibM, zone: L.turninZone } : null;
  if (list) { const i = objIdxOf(state, list).find(i => !done.includes(i));
    if (i != null) { const t = list[i], m = t.match(/\(Kibelisk: ([^)]+)\)/);
      if (/^Turn in\b/.test(t)) return turnin();
      return m ? { kib: m[1] } : null; } } /* no Kibelisk on that objective: say nothing rather than point elsewhere */
  return turnin();
}
/* The zone of the story step, for "near your story step": the record's own zone wins over the Kibelisk's zone vote
   (KIB_AREA, from regional / dungeon / stronghold data); a placeholder zone means no area, never a guess. */
export const storyAreaOf = (sHere, kibArea) => !sHere ? null : sHere.zone !== undefined ? sHere.zone || null : kibArea[sHere.kib] || null;

/* ---------- Regional quests ---------- */
/* Quest progress: 0 = not picked up, 1 = in progress (old true values count as 1). */
export const qProgOf = (c, k) => { const v = (c.started || {})[k]; return v === true ? 1 : (v || 0); };
const RQ_BY_KEY = Object.fromEntries(RQ.map(q => ["rq:" + q.id, q]));
/* Open in game? Its unlock level (with no prerequisite data, q.noPre: from its recommended level), the main story at or
   past its story quest, and (pre = names still to turn in) the regional quests before it: open = all but those, ok = all.
   Quests you've already picked up or turned in count as open whatever the data says (callers decide). */
export const rqStatus = (c, q, lv = c.level, ev = gatesOf(c, lv)) => {
  const r = ev.byKey("rq:" + q.id);
  if (!openBut(r, "done")) return { open: false, ok: false, pre: [] };
  return { open: true, ok: r.open, pre: r.blockers.map(b => RQ_BY_KEY[ev.node(b.of).key].name) };
};
/* Waiting on the story: at or above its recommended level and its gate's level part met, but the main story isn't at its
   story quest yet (Next up's "waiting" list; callers leave out the ones ticked or picked up). */
export const rqWaitsOnStory = (c, q, lv = c.level, ev = gatesOf(c, lv)) => {
  const bs = ev.byKey("rq:" + q.id).blockers;
  return q.rec <= lv && !bs.some(b => b.kind === "level") && bs.some(b => b.kind === "story");
};

/* ---------- Milestones ---------- */
/* Sealed Dungeons and Strongholds are tracked in the Areas card, not in milestone counts. Optional tasks count toward
   their milestone only once ticked (an untouched one never makes a milestone "Missed"); the Optional tasks filter
   (state.hideOpt) hides them entirely. Done = ticked or derived (doneOf; 0.3 E4: counts and tags count derived as done). */
const isAreaKind = it => it.kind === "hideout";
export const checkableOf = (state, s, ev = gatesOf(char(state))) => { const c = char(state); return s.items.map((it, j) => ({ it, k: it.k || s.id + ":" + j })).filter(x => !x.it.sub && !x.it.hidden && !x.it.dv && !isAreaKind(x.it) && !(x.it.opt && (state.hideOpt || !doneOf(c, x.k, ev)))); };
export const countsOf = (state, s, ev = gatesOf(char(state))) => { const c = checkableOf(state, s, ev); return [c.filter(x => doneOf(char(state), x.k, ev)).length, c.length]; };
/* Main tasks only (regional quests are side content, tracked in Next up), and how many regional quests are still open. */
export const mainCountsOf = (state, s, ev = gatesOf(char(state))) => { const c = checkableOf(state, s, ev).filter(x => x.it.kind !== "quest"); return [c.filter(x => doneOf(char(state), x.k, ev)).length, c.length]; };
export const sideOpenOf = (state, s, ev = gatesOf(char(state))) => checkableOf(state, s, ev).filter(x => x.it.kind === "quest" && !doneOf(char(state), x.k, ev)).length;
export const isOpen = ([c, n]) => c < n;

/* Open steps of a milestone that Next up may offer, in card order: not done, not a skill or board line (those have
   their own cards), not optional (unless it's advice, it.adv), not a stigma equip / "put on E" line (the Stigmas card
   covers them), not a regional quest the guide shows as locked, and with its gate met apart from the milestone's own
   level (callers pick the milestone: the one you're on, missed ones, the next one):
   - story / after: X = the story has reached X; turnedIn: X = X is turned in (story past it, or on it with storyEnd);
   - byStory = the step is story quest X: left to the story card while you're on X, done in game once you're past it
     (its completesWith; display only, the tick stays what counts until derived completion, E4);
   - a regional quest: its whole gate, or once picked up only its story gate.
   it = the item registered under the step's key (itemByK), as the page has always looked it up. A row without a gate
   node (only "g28:exp", optional, never offered) has no gate. */
export function openSteps(state, g) {
  const c = char(state), ev = gatesOf(c), out = [];
  cardRows(g).forEach(({ it: row, k }) => {
    const r = ev.byKey(k);
    if (r ? r.done !== false : c.checks[k]) return;
    const rq = row.kind === "quest";
    const it = itemByK(k);
    if (/^(sp|dv):/.test(k) || (row.opt && !(it && it.adv))) return;
    if (it && (it.stig || it.eput)) return;
    if (it && it.byStory && (it.story === c.quest || (r && ev.completes(r.id)))) return;
    if (r && !(rq ? (qProgOf(c, k) > 0 ? openBut(r, "level", "done") : r.open) : openBut(r, "level"))) return;
    out.push({ k, it, row, rq, adv: !!(it && it.adv) });
  });
  return out;
}

/* ---------- Skill points ---------- */
/* Available points = points from character level (table) + Wisdom Stones used − cost of every ticked skill line.
   Off-plan skill purchases aren't tracked. */
export const skillPoints = (c, lv = c.level) => {
  const fromLevels = LEVEL_POINTS[Math.min(45, Math.max(0, lv))] || 0, stones = c.stones || 0;
  const spent = SP_STEPS.filter(x => c.checks[x.k]).reduce((a, x) => a + x.cost, 0);
  return { fromLevels, stones, spent, pts: Math.max(0, fromLevels + stones - spent) };
};
/* Open upgrades in the milestones' order, and the ones open at lv. With specialtySlots (0.3 E7) also specialty slots 2 and 3,
   each right after its skill's slot 1 (src/core/catalog.js); slot 3 is never in `now` (out of reach inside Lv 45, never
   offered: Q5). */
export const skillRows = () => CHANGES_ON.has("specialtySlots") ? SP_STEPS.concat(SP_SLOTS) : SP_STEPS;
export const skillOpen = (c, lv = c.level) => { const ev = gatesOf(c, lv), open = skillRows().filter(x => ev.byKey(x.k).done === false).sort((a, b) => a.gi - b.gi || a.gj - b.gj);
  return { open, now: open.filter(x => x.slot !== 3 && ev.byKey(x.k).open) }; };
/* Specialty slot x (a row with x.spec): its skill's effective level (highest line bought + plan nodes owned), and the build's
   pick for the slot when there is one and its choice is open at that level (design §9), else null ("pick a specialty"). With
   specialtySlots off, slot 1's pick as before. */
export const skillLvOf = (c, x, ev = gatesOf(c)) => ev.skillLv(GATE_GRAPH.nodes[x.k].skill);
/* The highest effective level the plan reaches for slot x's skill: every line (rule:skill-level-gate, 10) + every plan node
   on it. A slot above it (slot 3 always: 14 at most; slot 2 of a skill with fewer than 2 plan nodes) is listed in the Skills
   card only, never the card's hero (Q5); in game other board nodes or gear can still get there. */
const PLAN_REACH = {};
export const planReachOf = x => { const sid = GATE_GRAPH.nodes[x.k].skill;
  if (!(sid in PLAN_REACH)) { const ns = Object.values(GATE_GRAPH.nodes);
    PLAN_REACH[sid] = Math.max(...ns.filter(n => n.kind === "skill" && n.skill === sid).map(n => n.L)) + ns.filter(n => n.kind === "plan" && n.skill === sid).reduce((t, n) => t + (n.adds ?? 1), 0); }
  return PLAN_REACH[sid]; };
export const specPickOf = (c, x, ev = gatesOf(c)) => { const p = (x.s.specs || [])[x.slot - 1];
  if (!CHANGES_ON.has("specialtySlots")) return x.slot === 1 ? { t: x.s.spec, lv: x.slotLv } : null;
  return p && skillLvOf(c, x, ev) >= p.lv ? p : null; };
/* The upgrade to buy now: the first open one, if you have the points (a specialty is free); else null. */
export const skillBuy = (c, lv = c.level) => { const next = skillOpen(c, lv).now[0], { pts } = skillPoints(c, lv); return next && (next.spec || pts >= next.cost) ? next : null; };

/* ---------- Daevanion board ---------- */
/* Logged costs of the ticked nodes plus the correction (dvAdj). */
export const dvSpent = c => DV_NODES().filter(it => c.checks[it.k]).reduce((a, it) => a + ((c.dvCost || {})[it.k] || 0), 0) + (c.dvAdj || 0);
/* The next unbought node on an open board, in the milestones' order. */
export const dvNext = (c, lv = c.level) => { const ev = gatesOf(c, lv); return DV_NODES().find(it => { const r = ev.byKey(it.k); return r.done === false && r.open; }); };
/* A board is open when any of its plan nodes is (board given), the Daevanion window when any plan node is (no board). */
export const dvOpen = (c, board) => { const ev = gatesOf(c); return DV_NODES().some(it => (!board || it.board === board) && ev.byKey(it.k).open); };
/* What a shut board waits for (design §10): { lv } while its level is above yours (as before E5), else { lv, story, text } with
   the Daevanion gate's story quest (the root of its first node's blockers: "Urgent Pursuit", to turn in) and its blocker
   text (E6: "unlocks after "Urgent Pursuit" · N quests ahead"). null when it is open. */
export const dvWaitOf = (c, board) => {
  const ev = gatesOf(c), its = DV_NODES().filter(it => it.board === board);
  if (!its.length || its.some(it => ev.byKey(it.k).open)) return null;
  const lv = Math.min(...its.map(it => it.blv)), n = ev.byKey(its.find(it => it.blv === lv).k), r = n.root;
  return lv <= c.level && r && r.kind === "story" ? { lv, story: r.name, text: blockerText(n, ev, { omit: ["level"] }) } : { lv };
};
/* Its logged cost, else the cheapest it can be (the node itself; its path only adds). */
export const dvNeed = (c, it) => (c.dvCost || {})[it.k] ?? (DV_MIN[it.ty] || 1);
/* Points left for ticking (without the correction): a node can be ticked only when its cost is logged and you have that
   many left (ticked nodes can always be unticked). */
export const dvLeft = c => (c.dvTotal || 0) - DV_NODES().filter(it => c.checks[it.k]).reduce((a, it) => a + ((c.dvCost || {})[it.k] || 0), 0);
export const dvGateOf = (c, k) => {
  const cost = (c.dvCost || {})[k], on = !!c.checks[k], left = dvLeft(c);
  if (on) return { off: false, warn: "" };
  if (cost == null) return { off: true, warn: "" };
  return cost > left ? { off: true, warn: `needs ${cost}, ${left} left` } : { off: false, warn: "" };
};
/* Board total follows the level: 4 points per level past 11 (crystals stay as they were). */
export const dvFromLv = lv => Math.max(0, 4 * (lv - 11));

/* ---------- Stigmas ---------- */
/* Stigma Shards from levels (Metabot): 1 per level reached from 23 to 39, 2 per level from 40 to 45. */
export const shardsFromLv = L => { let t = 0; for (let x = 23; x <= Math.min(L, 45); x++) t += x >= 40 ? 2 : 1; return t; };
/* Effective name per slot 1–4: your pick, else the plan; a name already used by an earlier slot falls to the first free one. */
export const slotNames = c => { const used = []; for (let n = 1; n <= 4; n++) { let nm = (c.stPick || {})[n]; if (!nm || used.includes(nm)) nm = STIGMA_PLAN[n - 1]; if (used.includes(nm)) nm = STIGMA_PLAN.find(x => !used.includes(x)); used.push(nm); } return used; };
/* The four slots from the milestones (22 / 27 / 32 / 37). A slot is open (openOf its key) at its level; slot 1 also needs
   "The One Who Hears the Voice" (g22:0; kept rule "stigma-slot-1-after-g22:0"). */
export const stigmaSlots = c => { const names = slotNames(c);
  return GATES.flatMap(g => g.items.filter(it => it.stig).map(it => ({ n: it.stig, lv: g.lv, gid: g.id, k: it.k, name: names[it.stig - 1], plan: STIGMA_PLAN[it.stig - 1],
    note: it.t.replace(/<b>.*?<\/b>\s*/, "").replace(/<[^>]+>/g, "") }))).sort((a, b) => a.n - b.n); };
export const stLvOfC = (c, n) => (c.stLv || {})[n] || 1;
/* Stigmas unlocked: "The One Who Hears the Voice" (g22:0) done. */
export const stigmaUnlocked = (c, ev = gatesOf(c)) => ev.byKey("g22:0").done !== false;
/* Kept rule "stigma-equip-after-g22:0": a slot can be equipped (Next up, the Stigmas card) once it is open and stigmas
   are unlocked, whichever slot it is. */
export const stigmaEquipOpen = (c, sl, ev = gatesOf(c)) => ev.byKey(sl.k).open && stigmaUnlocked(c, ev);
/* Kept rule "stigma-rotation-slot-level": the slot's level reached (its other atoms aside). */
export const slotLevelMet = (ev, sl) => openBut(ev.byKey(sl.k), "story", "done");

/* ---------- Dungeons & Strongholds ---------- */
/* Open at your level (kept rule "stronghold-band" for strongholds). */
export const areaOpen = (c, x, ev = gatesOf(c)) => ev.byKey(x.k).open;
/* The Areas list's "later" tag: the live gate alone (a stronghold's lowest level, without the band; 0.2). */
export const areaLater = (c, x) => !evaluate(c).byKey(x.k).open;

/* ---------- Rotation (Build drawer) ---------- */
/* A skill is yours at lv by the Skills card's rule: its first upgrade (Lv 1 → 2) unlocks at the skill's learn level
   (SP_STEPS req), and the card offers the skill from then on. A skill outside the plan is unknown to the guide: never yours. */
export const skillLearned = (name, lv, ev = gatesOf({ level: lv, checks: {} })) => SP_STEPS.some(x => x.s.n === name && x.L === 2 && ev.byKey(x.k).open);
/* The hold-to-run keys at lv, holding only what the guide says you have there (F7): right click = the build's stack for
   lv without any skill not learned yet; Q = Shadowstrike once learned; E = the equipped stigmas whose slot is open at lv,
   else the stigmas of the slots open at lv, in E_ORDER. Row 0 first. */
export const rotKeys = (c, lv) => {
  const ev = gatesOf(c, lv), open = stigmaSlots(c).filter(x => slotLevelMet(ev, x)), eq = open.filter(x => c.checks[x.k]).map(x => x.name), e = eq.length ? eq : open.map(x => x.name);
  return { rmb: RMB_STACK(lv).filter(n => skillLearned(n, lv, ev)), q: ["Shadowstrike"].filter(n => skillLearned(n, lv, ev)), e: E_ORDER.filter(n => e.includes(n)) };
};
/* Upgrade order: ST_TARGETS in turn, for the stigmas you have equipped. Other stigmas stay at level 1 (the plan's sources). */
export const stigmaPlan = c => {
  const eq = stigmaSlots(c).filter(x => c.checks[x.k]), steps = [];
  ST_TARGETS.forEach(([n, T]) => { const x = eq.find(y => y.name === n); if (!x) return; for (let L = stLvOfC(c, n) + 1; L <= T; L++) steps.push({ x, L, cost: ST_COST(L) }); });
  return steps;
};
