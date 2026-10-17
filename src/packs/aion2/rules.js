/* The AION 2 gate rules (0.3 E2 / E4, moved out of src/core/requirements.js in 0.4 P2b; pure: no DOM). The engine owns
   the switch mechanism and the evaluator glue (src/core/requirements.js); the pack object hands it these as keptRules,
   gateChanges and graphTransforms (docs/design/0.4-engine-contract.md §2). */
import { RQ } from "./data/generated.js";
import { SP_STEPS } from "./data/build.js";
import { GATES } from "./data/milestones.js";
import { AREA_ITEMS } from "./catalog.js";

/* ---------- Gates (0.3 E2, docs/design/0.3-requirement-engine.md §8) ---------- */
/* The 0.2 rules the live data doesn't hold yet, kept exactly as they were so E2 changes nothing on screen. Each is applied
   in one place (below, or in src/packs/aion2/requirements.js) and held to the frozen 0.2 code by tests/equiv;
   tests/core/gate-sources.test.mjs pins this list. They leave when the data takes them over (E5 / E9) or the owner
   decides otherwise. */
export const KEPT_RULES = {
  "stronghold-band": "a stronghold opens at its Sealed Dungeon band (src/packs/aion2/catalog.js AREA_BANDS, inferred) as well as at " +
    "its lowest level (the live gate); the Areas list's \"later\" tag reads the lowest level only (areaLater)",
  "stigma-slot-1-after-g22:0": "slot 1 (g22:1) opens at its level once \"g22:0\" is done, not on the live gate's legacy " +
    "story atom (\"Daeva in a Dream\" reached); data: owner-check proposal, check 3",
  "stigma-equip-after-g22:0": "the equip offer (Next up, the Stigmas card's hero) waits for \"g22:0\" on every slot, " +
    "not only slot 1 (stigmaEquipOpen)",
  "stigma-rotation-slot-level": "the Build drawer's E keys count a slot from its level alone (slotLevelMet)",
  "story-card-recommended-level": "the story card's \"level up first\" reads the current quest's recommended level, " +
    "never on the first quest (storyRecGate; design Q10)",
};
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
  /* E8: not a gate, display only (src/packs/aion2/ascension.js); a switch so --explain attributes the Journey card's new line (recorded with E8: baseline) */
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

/* ---------- The app graph: GATE_GRAPH with these rules, as graph transforms ---------- */
/* The engine applies the transforms whose `when` holds, in list order, memoised per set of switches on (src/core/
   requirements.js appGraph). The first three are always on (the kept rules and the Skills card's line levels); each
   other one is the "off" form of a switch. Same results as the 0.3 chain APP_GRAPH → APP_GRAPH_0_2 → withoutStoryStep →
   withoutE5 → withoutSlots (tests/equiv, golden). */
const levelAtoms = g => g.level !== undefined ? [g] : (g.all || []).flatMap(levelAtoms);
/* save key → node id (the first node with that key) */
const aion2KeyIds = g => { const idOf = {}; for (const [id, n] of Object.entries(g.nodes)) if (n.key !== undefined && !(n.key in idOf)) idOf[n.key] = id; return idOf; };
/* kept rule "stronghold-band" */
const aion2StrongholdBand = g => { const nodes = { ...g.nodes }, idOf = aion2KeyIds(g);
  AREA_ITEMS.filter(x => x.it.kind === "stronghold").forEach(x => { const id = idOf[x.k], n = nodes[id];
    nodes[id] = { ...n, req: { all: [n.req, { level: x.band, basis: "inferred" }] } }; });
  return { story: g.story, nodes }; };
/* kept rule "stigma-slot-1-after-g22:0" */
const aion2Slot1AfterG22 = g => { const nodes = { ...g.nodes }, idOf = aion2KeyIds(g);
  const id = idOf[GATES.flatMap(x => x.items).find(it => it.stig === 1).k], n = nodes[id];
  nodes[id] = { ...n, req: { all: [...levelAtoms(n.req), { done: idOf["g22:0"], basis: "legacy" }] } };
  return { story: g.story, nodes }; };
/* Skill lines open at the level the Skills card shows (SP_STEPS req, the same formula as the graph's), read when asked:
   the card, its "Lv" text and the Build drawer share one number (0.2.2 F7, tests/e4test.js #15). Not the specialty slots:
   they open on effective skill level (0.3 E7; with the switch specialtySlots off, slot 1 at its line's level, withoutSlots). */
const aion2SkillLineLevels = g => { const nodes = { ...g.nodes }, idOf = aion2KeyIds(g);
  SP_STEPS.filter(x => !x.spec).forEach(x => { const id = idOf[x.k], n = nodes[id], { basis } = n.req;
    nodes[id] = { ...n, get req() { return { level: x.req, basis }; } }; });
  return { story: g.story, nodes }; };
/* The 0.2 form of the regional gates, for the page with regionalTurnedIn off: every story atom of a regional quest "reached", and the three
   quests that had no story gate (Shugo-of-All-Trades, Spooky Specters, The Great Curse-Breaking Caper: "noPre", they opened at their
   recommended level) back on that rule. Same list in tests/support/gates-0.2.mjs and tests/golden/states.js. */
const RQ_NO_STORY_GATE = new Set(["rq:2202044", "rq:2202051", "rq:2202015"]);
const aion2Regional02 = g => {
  const down = (r, noPre) => r.all ? { all: r.all.map(x => down(x, noPre)) } : r.any ? { any: r.any.map(x => down(x, noPre)) }
    : r.story ? (noPre ? { level: Math.max(noPre.unlocksAt, noPre.rec), basis: "rule" } : { ...r, is: "reached" }) : r;
  const nodes = { ...g.nodes };
  for (const [id, n] of Object.entries(nodes)) if (n.kind === "rq") nodes[id] = { ...n, req: down(n.req, RQ_NO_STORY_GATE.has(id) && RQ.find(q => "rq:" + q.id === id)) };
  return { story: g.story, nodes };
};
/* ...and without storyStepDerived: the three rows E9 gave a story completion (Graverobber Den, the Krao Cave and Fire Temple Expedition rows) are tick-only again. */
const STORY_STEP_ROWS = ["sh:graverobber-den", "g20:exp", "g35:exp"];
const withoutStoryStep = g => { const nodes = { ...g.nodes }; for (const id of STORY_STEP_ROWS) nodes[id] = { ...nodes[id], done: ["tick"] }; return { story: g.story, nodes }; };
/* ...and without an E5 switch: its records' gates as they were before E5 (the regional quests had no prerequisite data, so they open
   at max(unlocksAt, rec) as "noPre" did; the two steps at their milestone level; the boards with no window gate). Same in
   tests/support/gates-0.2.mjs and tests/golden/states.js. The switches' record sets don't overlap, so one transform per switch
   gives what removing them together gave. */
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
export const aion2Transforms = [
  { id: "stronghold-band", when: "always", apply: aion2StrongholdBand },
  { id: "stigma-slot-1-after-g22:0", when: "always", apply: aion2Slot1AfterG22 },
  { id: "skill-line-level", when: "always", apply: aion2SkillLineLevels },
  { id: "regional-0.2", when: { off: "regionalTurnedIn" }, apply: aion2Regional02 },
  { id: "story-step", when: { off: "storyStepDerived" }, apply: withoutStoryStep },
  ...E5_SWITCHES.map(n => ({ id: "e5-" + n, when: { off: n }, apply: g => withoutE5(g, [n]) })),
  { id: "specialty-slots", when: { off: "specialtySlots" }, apply: withoutSlots },
];
