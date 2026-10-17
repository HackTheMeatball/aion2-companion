/* The AION 2 Next up producers (0.4 P2c, pure: no DOM; docs/design/0.4-engine-contract.md §2 "Next up phases"). The
   engine's rankNext (src/core/nextup.js) calls each once per ranking, in list order, and sorts the entries by phase; the
   card objects are the ones src/main.js (nowCard) has always drawn. Here: spend what you already have (dungeon in
   progress, Cube items, skill points, board crystals, stigma), regional quests, Sealed Dungeons, Strongholds, the
   Later skill cards; plus the story card's Kibelisk and "Meanwhile" (pack story hooks).

   Story vs side content was checked against MeinMMO, GamesFuze, KeenGamer, ExitLag, aion2hub: the main story is the
   leveling path; Sealed Dungeons (one-time, fixed: 2 crystals + 2 Wisdom Stones + Enhance Stones + Kina, ~5 min) and
   Strongholds are for power, done on your route, or first when the story is level-gated above you (phase beforeStory).
   A crystal shortage alone doesn't move them above the story. */
import { VERIFIED_UNLOCKS } from "./data/story.js";
import { E_ORDER, LEVEL_POINTS, SP_STEPS } from "./data/build.js";
import { GATES } from "./data/milestones.js";
import { AREA_LOC } from "./data/generated.js";
import { AREA_ITEMS, KIB_AREA, bandOf } from "./catalog.js";
import { areaOpen, dvNeed, dvNext, dvSpent, rqStatus, rqWaitsOnStory, shardsFromLv, skillBuy, skillOpen, stigmaEquipOpen, stigmaPlan, stigmaSlots, storyAreaOf,
  storyHereOf } from "./requirements.js";
import { blockerText } from "../../core/blockers.js";
import { doneOf, gatesOf, openBut, qProgOf } from "../../core/requirements.js";

/* What several producers (and the story card's "Meanwhile") read, worked out once per ranking (ctx is one per call):
   the story step's zone, the open Sealed Dungeons (lowest band first) and Strongholds. */
const AREAS = new WeakMap();
const areasOf = (state, ctx) => {
  let a = AREAS.get(ctx); if (a) return a;
  const { c, ev } = ctx;
  a = { hereArea: storyAreaOf(storyHereOf(state), KIB_AREA),
    sdOpen: AREA_ITEMS.filter(x => x.it.kind === "hideout" && areaOpen(c, x, ev) && !doneOf(c, x.k, ev)).sort((a, b) => bandOf(a) - bandOf(b)),
    shOpen: AREA_ITEMS.filter(x => x.it.kind === "stronghold" && areaOpen(c, x, ev) && !doneOf(c, x.k, ev)) };
  AREAS.set(ctx, a);
  return a;
};

/* Dungeon or stronghold you went into (finish it first), Cube items, skill buys, the board node. */
function spend(state, { c, lv, ev }) {
  const out = [], add = card => out.push({ phase: "spend", card });
  const sp = skillBuy(c, lv);
  Object.keys(c.areaRun || {}).filter(k => !doneOf(c, k, ev)).forEach(k => { const x = AREA_ITEMS.find(y => y.k === k); if (!x) return;
    add({ kind: "run", x, act: "tick:" + k }); });
  if ((c.pendSt || 0) + (c.pendCr || 0) > 0) add({ kind: "cube", st: c.pendSt, cr: c.pendCr, act: "usecube" });
  if (sp) { out.push({ phase: "spend", queue: "skill", card: { kind: "skill", x: sp, first: true, act: "skill" } });
    /* The upgrades right after it that your current points also cover (queue previews; each becomes the top card in turn). */
    const pts = (LEVEL_POINTS[Math.min(45, Math.max(0, lv))] || 0) + (c.stones || 0) - SP_STEPS.filter(x => c.checks[x.k]).reduce((t, x) => t + x.cost, 0);
    let left = pts - (sp.spec ? 0 : sp.cost);
    skillOpen(c, lv).now.filter(x => x !== sp).some(x => {
      const cost = x.spec ? 0 : x.cost; if (cost > left) return true; left -= cost;
      out.push({ phase: "spend", queue: "skill", card: { kind: "skill", x, act: "skill" } });
      return out.length >= 4; }); }
  const dn = dvNext(c, lv), dLeft = (c.dvTotal || 0) - dvSpent(c), dc = dn && (c.dvCost || {})[dn.k];
  /* "<Board> board opens" (a milestone step) still open: that card comes first, the board's buy card after it (one, not both). */
  const boOpen = dn && GATES.some(g => g.lv <= lv && g.items.some(it => it.bo === dn.board && !c.checks[it.k]));
  if (boOpen) { /* the milestone card covers it */ }
  else if (dn && dLeft < dvNeed(c, dn) && dc !== 0) { /* can't afford even the cheapest version of the next node: nothing to do on the board yet */ }
  else if (dn && dc != null && dc <= dLeft) add({ kind: "board", dn, dc, dLeft, act: "board" });
  else if (dn && dc == null && dLeft > 0) add({ kind: "boardcost", dn, dLeft, act: "boardcost" });
  return out;
}

/* Regional quests as one card, and the Sealed Dungeon pick: above the story when it is level-gated (XP), else after it. */
function regional(state, ctx) {
  const { c, lv, ev, story: { gated, gateLv } } = ctx, { hereArea, sdOpen } = areasOf(state, ctx), out = [];
  /* Sealed Dungeon pick: one in the story step's zone (highest band first); else one from the highest open band. */
  const byHigh = [...sdOpen].sort((a, b) => bandOf(b) - bandOf(a));
  const sdPick = byHigh.find(x => x.area === hereArea) || byHigh[0];
  const bandCount = (kind, bd) => { const xs = AREA_ITEMS.filter(x => x.it.kind === kind && bandOf(x) === bd); return { bd, d: xs.filter(x => doneOf(c, x.k, ev)).length, n: xs.length }; };
  const sdCard = sdOpen.length ? { kind: "sd", pick: sdPick, loc: AREA_LOC[sdPick.it.name] || {}, open: sdOpen.length, gated, gateLv, hereArea, band: bandCount("hideout", bandOf(sdPick)), act: "areas:" + bandOf(sdPick) } : null;
  /* Take them all, finish them in any order. Available = the quest's own recommended level (RQ rec), not its milestone's
     level. "Not in game yet" (rqSnooze) hides a quest until your next Level up or until the quest before it is turned in. */
  const snz = c.rqSnooze || {};
  const rqAll = []; GATES.forEach(g => g.items.forEach(it => { if (it.kind !== "quest" || it.hidden) return;
    const k = it.k, done = doneOf(c, k, ev), run = !done && qProgOf(c, k) > 0, av = rqStatus(c, it.q, lv, ev);
    if (!done && !run && !av.open) return; /* below its unlock level, or the story isn't there yet */
    rqAll.push({ k, g, it, done, run, pre: done || run ? [] : av.pre }); }));
  /* Waiting on the story: at or above its recommended level and unlock level, but the main story isn't at its story quest yet. */
  const rqWait = []; GATES.forEach(g => g.items.forEach(it => { if (it.kind !== "quest" || it.hidden) return; const k = it.k;
    if (doneOf(c, k, ev) || qProgOf(c, k) > 0 || !rqWaitsOnStory(c, it.q, lv, ev)) return; rqWait.push({ k, it }); }));
  /* A follow-up isn't available until the quests before it are turned in. */
  rqAll.forEach(x => { x.lock = x.pre.length > 0; x.snz = !x.done && !x.run && x.k in snz; });
  const rqOpen0 = rqAll.filter(x => !x.done && !x.snz);
  /* A locked follow-up shows only under a prerequisite that is itself shown (open, not snoozed): x.parent. */
  rqOpen0.forEach(x => { x.parent = x.pre.find(n => rqOpen0.some(y => !y.lock && y.it.name === n)); });
  const rqOpen = rqOpen0.filter(x => !x.lock || x.parent), rqSnzK = rqAll.filter(x => x.snz).map(x => x.k);
  const rqRun = rqOpen.filter(x => x.run).length, rqLock = rqOpen.filter(x => x.lock).length;
  /* Bar covers only milestones that still have open regional quests (finished milestones don't pad it). */
  const rqGs = [...new Set(rqOpen.map(x => x.g))], rqScope = rqAll.filter(x => rqGs.includes(x.g));
  const rqFirst = rqOpen.length ? (rqOpen.find(x => !x.run && !x.lock) || rqOpen.find(x => !x.lock) || rqOpen[0]) : null;
  const rqCard = rqOpen.length || rqSnzK.length || rqWait.length ? { kind: "rq", all: rqAll, open: rqOpen, wait: rqWait, snz: rqAll.filter(x => x.snz),
    run: rqRun, lock: rqLock, fresh: rqOpen.length - rqRun - rqLock, scope: rqScope.length, done: rqScope.filter(x => x.done).length,
    near: hereArea ? rqOpen.filter(x => !x.lock && x.it.q.zone === hereArea).length : 0, hereArea,
    act: "rqgo:" + (rqFirst ? rqFirst.k : rqSnzK.length ? rqSnzK[0] : rqWait[0].k) } : null;
  if (rqCard) out.push({ phase: gated && rqOpen.length ? "beforeStory" : "side", keep: true, card: rqCard });
  if (sdCard) out.push({ phase: gated ? "beforeStory" : "side", keep: true, card: sdCard });
  return out;
}

/* Stigma: equip the next slot or upgrade one. An equip that needs a shard first ranks after the story, no button. */
function stigma(state, { c, lv, ev }) {
  const sl = stigmaSlots(c), nx = sl.find(x => !c.checks[x.k]), up = stigmaPlan(c)[0];
  if (nx && stigmaEquipOpen(c, nx, ev)) { const r = E_ORDER.filter(n => n === nx.name || sl.some(x => x.name === n && c.checks[x.k])).indexOf(nx.name);
    if (!(c.stLv || {})[nx.name] && !(c.stShards || 0)) { let at = null; for (let L = lv + 1; L <= 45 && at == null; L++) if (shardsFromLv(L) > shardsFromLv(lv)) at = L;
      return [{ phase: "side", keep: true, card: { kind: "stwait", nx, at, act: "" } }]; }
    return [{ phase: "spend", card: { kind: "stequip", nx, r, act: "stequip" } }]; }
  if (up && (c.stShards || 0) >= up.cost) return [{ phase: "spend", card: { kind: "stup", up, shards: c.stShards, act: "stup" } }];
  /* Key placement for new skills/stigmas is already a milestone step ("Put … in row 0 of E"); the Build tab shows a "new" badge. */
  return [];
}

/* Strongholds: one pick (in the story step's zone, else the highest band), after the advice cards. */
function stronghold(state, ctx) {
  const { c, ev } = ctx, { hereArea, shOpen } = areasOf(state, ctx);
  if (!shOpen.length) return [];
  const shPick = shOpen.find(x => x.area === hereArea) || [...shOpen].sort((a, b) => (b.it.lo || 0) - (a.it.lo || 0) || (a.it.hi || 45) - (b.it.hi || 45))[0];
  const shAll = AREA_ITEMS.filter(x => x.it.kind === "stronghold");
  return [{ phase: "late", keep: true, card: { kind: "sh", pick: shPick, open: shOpen.length, done: shAll.filter(x => doneOf(c, x.k, ev)).length, total: shAll.length, hereArea, act: "areas:sh" } }];
}

/* Later: each skill's own next upgrade only (no jumps past a level you haven't bought), one card per skill, at most 3;
   why = the skill line's root blocker (design §4, E6). */
function laterSkills(state, { c, lv, ev }) {
  const nextOf = {}; SP_STEPS.filter(x => !c.checks[x.k]).forEach(x => { const n = nextOf[x.s.n]; if (!n || x.L < n.L) nextOf[x.s.n] = x; });
  const sp2s = Object.values(nextOf).filter(x => !ev.byKey(x.k).open && !x.spec).sort((a, b) => a.req - b.req || a.rank - b.rank);
  return sp2s.slice(0, 3).map(x => ({ phase: "later", L: x.req, card: { kind: "laterSkill", x, lv, later: true, act: "", why: blockerText(ev.byKey(x.k), ev) } }));
}

export const aion2NextUp = [
  { id: "spend", produce: spend },
  { id: "regional", produce: regional },
  { id: "stigma", produce: stigma },
  { id: "stronghold", produce: stronghold },
  { id: "laterSkills", produce: laterSkills },
];

/* The story card's "Meanwhile" line when it is level-gated: what gives XP at your level (verified unlocks only): Sealed
   Dungeons and Strongholds still to clear, the highest Expedition you've unlocked (Krao Cave also needs its step's story
   gate, g20:exp: "Daeva in a Dream" reached), the daily dungeon. */
export function aion2Meanwhile(state, ctx) {
  const { c, lv } = ctx, { sdOpen, shOpen } = areasOf(state, ctx);
  const krao = openBut(gatesOf(c).byKey("g20:exp"), "level");
  const ex = VERIFIED_UNLOCKS.filter(x => x[0] <= lv && /^Expedition/.test(x[2]) && (x[1] !== "Krao Cave" || krao)).pop();
  const dd = VERIFIED_UNLOCKS.find(x => x[1] === "Daily dungeon");
  return { sd: sdOpen.length > 0, sh: shOpen.length > 0, ex: ex ? { lv: ex[0], name: ex[1], il: (ex[2].match(/item level (\d+)/) || [])[1] || null } : null, dd: dd && dd[0] <= lv ? dd[0] : null };
}

/* Where to go next on the story card (not level-gated): the story's Kibelisk, unless the open objective already names
   its Kibelisk. */
export const aion2StoryFields = (state, { story: { gated }, open }) => {
  const sh = gated ? null : storyHereOf(state);
  return { kib: sh && !/\(Kibelisk:/.test(open || "") ? sh : null };
};
