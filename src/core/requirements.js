/* Requirements and derived facts (0.2 P3, pure: no DOM). What is open, done, affordable or next for a character, from
   the save and the catalog. Functions take the character (c = char(state)) or, where a view setting changes the answer
   (the Optional tasks filter, the talk-only objectives filter), the whole state. Nothing here writes.
   Every "is it open?" answer comes from the evaluator (gatesOf below, 0.3 E2); this file only asks it. */
import { QUESTS, QUEST_LOC, QUEST_STEPS } from "../data/story.js";
import { DV_MIN, E_ORDER, LEVEL_POINTS, RMB_STACK, SP_STEPS, STIGMA_PLAN, ST_COST, ST_TARGETS } from "../data/build.js";
import { GATES } from "../data/milestones.js";
import { RQ } from "../data/generated.js";
import { GATE_GRAPH } from "../data/gate-graph.js";
import { AREA_ITEMS, DV_NODES, cardRows, itemByK } from "./catalog.js";
import { evaluate } from "./evaluator.js";
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
     the card, its "Lv" text and the Build drawer share one number (0.2.2 F7, tests/e4test.js #15). */
  SP_STEPS.forEach(x => { const id = idOf[x.k], n = nodes[id], { basis } = n.req;
    nodes[id] = { ...n, get req() { return { level: x.req, basis }; } }; });
  return { story: GATE_GRAPH.story, nodes };
})();
/* The behaviour changes of 0.3 E4 (design §5, §13), each a named switch so tests/golden.js --explain can attribute every
   changed state to the smallest set of them that reproduces it. The page runs with every one on; setGateChanges (the
   golden runner, the equiv suite) picks a set. A proposal names the rule switch it needs ("needs"), and turning it on
   turns that on too. Derived values are computed on every evaluation and never written. */
export const GATE_CHANGES = {
  derived: { what: "derived completion: a step that can be ticked is also done by its other completesWith (byStory steps " +
    "once their story quest is turned in, \"Put … on E\" once its slot is equipped)" },
  "g22:0": { apply: "g22:0", needs: ["derived"], what: "wrapper rule: \"The One Who Hears the Voice\" done once \"Daeva in a Dream\" is turned in (proposal)" },
  "g32:dreams": { apply: "g32:dreams", needs: ["derived"], what: "wrapper rule: \"The One Who Dreams\" done once \"A Daeva Dreaming Anew\" is turned in (proposal)" },
  followUps: { what: "a regional quest picked up or turned in proves the regional quests before it were turned in (Q3)" },
  turnInLevel: { what: "\"Turned in\" on the current story quest waits for its unlock level (Q10 follow-up)" },
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
const evOpts = () => EV_OPTS || (EV_OPTS = { graph: APP_GRAPH, derived: CHANGES_ON.has("derived"), followUps: CHANGES_ON.has("followUps"),
  apply: Object.keys(GATE_CHANGES).filter(n => CHANGES_ON.has(n) && GATE_CHANGES[n].apply).map(n => GATE_CHANGES[n].apply) });
/* The evaluator for this character (at level lv, default its own), with the E4 changes that are on (all of them on the
   page). Evaluated lazily and memoised per call: ask it once per pass and pass it along where a function takes `ev`. */
export const gatesOf = (c, lv = c.level) => evaluate(lv === c.level ? c : { ...c, level: lv }, evOpts());
/* Done: ticked, or derived (from the story, a wrapper quest, a follow-up). A key with no gate node: its tick. */
export const doneOf = (c, k, ev = gatesOf(c)) => { const r = ev.byKey(k); return r ? r.done !== false : !!c.checks[k]; };
/* Done by derivation only (not ticked): the row shows a ticked, disabled box ("done in the story"); its stored tick,
   true, false or absent, is left alone and counts again once the derivation stops holding (A3). The node's result, or null. */
export const derivedOf = (c, k, ev = gatesOf(c)) => { const r = ev.byKey(k); return r && r.done === "derived" ? r : null; };
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
/* Open upgrades in the milestones' order, and the ones open at lv. */
export const skillOpen = (c, lv = c.level) => { const ev = gatesOf(c, lv), open = SP_STEPS.filter(x => ev.byKey(x.k).done === false).sort((a, b) => a.gi - b.gi || a.gj - b.gj);
  return { open, now: open.filter(x => ev.byKey(x.k).open) }; };
/* The upgrade to buy now: the first open one, if you have the points (a specialty is free); else null. */
export const skillBuy = (c, lv = c.level) => { const next = skillOpen(c, lv).now[0], { pts } = skillPoints(c, lv); return next && (next.spec || pts >= next.cost) ? next : null; };

/* ---------- Daevanion board ---------- */
/* Logged costs of the ticked nodes plus the correction (dvAdj). */
export const dvSpent = c => DV_NODES().filter(it => c.checks[it.k]).reduce((a, it) => a + ((c.dvCost || {})[it.k] || 0), 0) + (c.dvAdj || 0);
/* The next unbought node on an open board, in the milestones' order. */
export const dvNext = (c, lv = c.level) => { const ev = gatesOf(c, lv); return DV_NODES().find(it => { const r = ev.byKey(it.k); return r.done === false && r.open; }); };
/* A board is open when any of its plan nodes is (board given), the Daevanion window when any plan node is (no board). */
export const dvOpen = (c, board) => { const ev = gatesOf(c); return DV_NODES().some(it => (!board || it.board === board) && ev.byKey(it.k).open); };
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
