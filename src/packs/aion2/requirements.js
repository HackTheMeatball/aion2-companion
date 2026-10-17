/* AION 2 requirements and derived facts (0.2 P3, moved out of src/core/requirements.js in 0.4 P2b; pure: no DOM): regional
   quests, the story card's level gate, objectives and Kibelisks, skill points and lines, the Daevanion board, stigmas,
   Sealed Dungeons and strongholds, the Build drawer's keys, and how blocker text and the last location name AION 2 things.
   Functions take the character (c = char(state)) or, where a view setting changes the answer, the whole state. Nothing
   here writes. Every "is it open?" answer comes from the engine's evaluator glue (gatesOf, src/core/requirements.js). */
import { QUEST_LOC, QUEST_STEPS, QUESTS } from "./data/story.js";
import { DV_MIN, E_ORDER, LEVEL_POINTS, RMB_STACK, SP_SLOTS, SP_STEPS, STIGMA_PLAN, ST_COST, ST_TARGETS } from "./data/build.js";
import { GATES } from "./data/milestones.js";
import { RQ } from "./data/generated.js";
import { NO_AREA } from "./data/areas.js";
import { AREA_ITEMS, DV_NODES, RQ_K } from "./catalog.js";
import { itemByK } from "../../core/catalog.js";
import { blockerText, stepName } from "../../core/blockers.js";
import { activePack } from "../../core/pack.js";
import { derivedOf, gateChangeOn, gatesOf, liveGatesOf, objIdxOf, openBut, questIdx } from "../../core/requirements.js";
import { char } from "../../core/state.js";

/* A one-time clear in the Progress tally (its clear reward, CLEAR_REWARD, counted): ticked, or with clearTally a regional
   quest done by derivation (a follow-up proves you turned it in). Computed, never written: the Cube and the stone /
   crystal totals only move on a tick (main.js), so a derived quest's reward is counted here and nowhere twice. */
export const clearDoneOf = (c, k, ev = gatesOf(c)) => !!c.checks[k] || (gateChangeOn("clearTally") && !!derivedOf(c, k, ev));

/* ---------- Story ---------- */
/* Kept rule "story-card-recommended-level": the story card is level-gated when the current quest's recommended level is
   above yours; the first story quest never gates (a new character in Ishalgen isn't told to level up first). */
export const storyRecGate = c => { const qi = questIdx(c), gateLv = qi > 0 ? QUESTS[qi][0] : 0; return { qi, gateLv, gated: gateLv > c.level }; };
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
/* Where the story sends you next: the next open objective's Kibelisk, or the turn-in's. A turn-in also carries the
   record's own zone (zone: "" = still a placeholder); an objective has no zone of its own. Objective notes
   (QUEST_STEP_NOTES) are never read here, so a note never moves a Kibelisk. */
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

/* ---------- Skill points ---------- */
/* Available points = points from character level (table) + Wisdom Stones used − cost of every ticked skill line.
   Off-plan skill purchases aren't tracked. */
export const skillPoints = (c, lv = c.level) => {
  const fromLevels = LEVEL_POINTS[Math.min(45, Math.max(0, lv))] || 0, stones = c.stones || 0;
  const spent = SP_STEPS.filter(x => c.checks[x.k]).reduce((a, x) => a + x.cost, 0);
  return { fromLevels, stones, spent, pts: Math.max(0, fromLevels + stones - spent) };
};
/* Open upgrades in the milestones' order, and the ones open at lv. With specialtySlots (0.3 E7) also specialty slots 2 and 3,
   each right after its skill's slot 1 (src/packs/aion2/catalog.js); slot 3 is never in `now` (out of reach inside Lv 45, never
   offered: Q5). */
export const skillRows = () => gateChangeOn("specialtySlots") ? SP_STEPS.concat(SP_SLOTS) : SP_STEPS;
export const skillOpen = (c, lv = c.level) => { const ev = gatesOf(c, lv), open = skillRows().filter(x => ev.byKey(x.k).done === false).sort((a, b) => a.gi - b.gi || a.gj - b.gj);
  return { open, now: open.filter(x => x.slot !== 3 && ev.byKey(x.k).open) }; };
/* Specialty slot x (a row with x.spec): its skill's effective level (highest line bought + plan nodes owned), and the build's
   pick for the slot when there is one and its choice is open at that level (design §9), else null ("pick a specialty"). With
   specialtySlots off, slot 1's pick as before. */
export const skillLvOf = (c, x, ev = gatesOf(c)) => ev.skillLv(activePack().data.graph.nodes[x.k].skill);
/* The highest effective level the plan reaches for slot x's skill: every line (rule:skill-level-gate, 10) + every plan node
   on it. A slot above it (slot 3 always: 14 at most; slot 2 of a skill with fewer than 2 plan nodes) is listed in the Skills
   card only, never the card's hero (Q5); in game other board nodes or gear can still get there. */
const PLAN_REACH = {};
export const planReachOf = x => { const N = activePack().data.graph.nodes, sid = N[x.k].skill;
  if (!(sid in PLAN_REACH)) { const ns = Object.values(N);
    PLAN_REACH[sid] = Math.max(...ns.filter(n => n.kind === "skill" && n.skill === sid).map(n => n.L)) + ns.filter(n => n.kind === "plan" && n.skill === sid).reduce((t, n) => t + (n.adds ?? 1), 0); }
  return PLAN_REACH[sid]; };
export const specPickOf = (c, x, ev = gatesOf(c)) => { const p = (x.s.specs || [])[x.slot - 1];
  if (!gateChangeOn("specialtySlots")) return x.slot === 1 ? { t: x.s.spec, lv: x.slotLv } : null;
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
   "The One Who Hears the Voice" (g22:0; kept rule "stigma-slot-1-after-g22:0", src/packs/aion2/rules.js). */
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
export const areaLater = (c, x) => !liveGatesOf(c).byKey(x.k).open;

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

/* ---------- Names in blocker text (hook hopName, src/core/blockers.js) ---------- */
/* An Ascension node has no save key: it is named by the guide step that completes it (g22:0 → asc:hears-the-voice). */
let ASC_STEP = null;
const ascStep = id => { if (!ASC_STEP) { ASC_STEP = {}; GATES.forEach(g => g.items.forEach(it => { if (it.ascensionQuest && !ASC_STEP[it.ascensionQuest]) ASC_STEP[it.ascensionQuest] = it; })); } return ASC_STEP[id]; };
/* What a `done` hop is called, and whether it is turned in (a quest) or done (a step): { name, verb } or null (skip it).
   An unlock node (unlock:daevanion) is no thing the player knows by name: its hop is skipped and its root shown. */
export const hopName = r => {
  if (r.kind === "unlock") return null;
  if (r.kind === "rq") { const it = RQ_K(r.key); return { name: it ? it.name : r.id, verb: "is turned in" }; }
  if (r.kind === "ascension") { const it = ascStep(r.id); return { name: it ? stepName(it) : r.id, verb: "is turned in" }; }
  const it = r.key !== undefined ? itemByK(r.key) : null;
  if (it && it.ascensionQuest) return { name: stepName(it), verb: "is turned in" };
  return { name: it ? stepName(it) : r.id, verb: "is done" };
};

/* ---------- Last confirmed location (hooks locate / skipLocation, src/core/sync.js) ---------- */
/* Zone of a ticked item from today's data: Sealed Dungeons and strongholds by their area, regional quests by the zone
   rq.json gives (the quest giver's; v2 adds turn-in zones in 5b, the locator is then swapped). null = not located. */
let ZONE_K = null;
export const zoneOfKey = k => {
  if (!ZONE_K) { ZONE_K = {}; AREA_ITEMS.forEach(x => { if (x.area && x.area !== NO_AREA) ZONE_K[x.k] = x.area; }); RQ.forEach(q => { if (q.zone) ZONE_K["rq:" + q.id] = q.zone; }); }
  return ZONE_K[k] || null;
};
/* Ascension quests have no map location (owner, 2026-10-14): steps that are one never move the last location. */
export const isAscensionKey = k => { const it = itemByK(k); return !!(it && it.ascensionQuest); };
