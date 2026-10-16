/* Next up ranking (0.2 P3, pure: no DOM). rankNext(state, { basic }) decides which cards Next up shows and in which
   order; src/main.js turns each card into HTML (nowCard). A card is { kind, act, ... }: act is the action its button
   runs ("tick:<key>", "skill", "board", "story", …, "" for none), the other fields are what the view needs.

   Order: spend what you already have (dungeon in progress, Cube items, skill points, board crystals, stigma) → steps the
   milestone you're standing on opens (the route pauses at milestones) → the story → side content and missed steps →
   advice → what opens later. When the story is level-gated above you, regional quests and Sealed Dungeons (XP) move
   above it. Story vs side content was checked against MeinMMO, GamesFuze, KeenGamer, ExitLag, aion2hub: the main story
   is the leveling path; Sealed Dungeons (one-time, fixed: 2 crystals + 2 Wisdom Stones + Enhance Stones + Kina, ~5 min)
   and Strongholds are for power, done on your route, or first when the story is level-gated above you. A crystal
   shortage alone doesn't move them above the story. */
import { QUESTS, QUEST_STEPS, VERIFIED_UNLOCKS } from "../data/story.js";
import { E_ORDER, LEVEL_POINTS, SP_STEPS } from "../data/build.js";
import { GATES } from "../data/milestones.js";
import { AREA_LOC } from "../data/generated.js";
import { AREA_ITEMS, KIB_AREA, bandOf } from "./catalog.js";
import { char } from "./state.js";
import { areaOpen, checkableOf, countsOf, doneOf, dvNeed, dvNext, dvSpent, gatesOf, isOpen, objIdxOf, openBut, openSteps, qProgOf, rqStatus, rqWaitsOnStory, shardsFromLv,
  skillBuy, skillOpen, stigmaEquipOpen, stigmaPlan, stigmaSlots, storyAreaOf, storyHereOf, storyRecGate, turnInNeedsLv } from "./requirements.js";

export function rankNext(state, { basic = false } = {}) {
  /* every "is it open?" below is the evaluator's (gatesOf, src/core/requirements.js); the ranking is 0.2's */
  const c = char(state), lv = c.level, acts = [], ev = gatesOf(c);
  const sp = skillBuy(c, lv);
  /* Dungeon or stronghold you went into: finish it first. */
  Object.keys(c.areaRun || {}).filter(k => !doneOf(c, k, ev)).forEach(k => { const x = AREA_ITEMS.find(y => y.k === k); if (!x) return;
    acts.push({ kind: "run", x, act: "tick:" + k }); });
  if ((c.pendSt || 0) + (c.pendCr || 0) > 0) acts.push({ kind: "cube", st: c.pendSt, cr: c.pendCr, act: "usecube" });
  if (sp) { acts.push({ kind: "skill", x: sp, first: true, act: "skill" });
    /* The upgrades right after it that your current points also cover (queue previews; each becomes the top card in turn). */
    const pts = (LEVEL_POINTS[Math.min(45, Math.max(0, lv))] || 0) + (c.stones || 0) - SP_STEPS.filter(x => c.checks[x.k]).reduce((t, x) => t + x.cost, 0);
    let left = pts - (sp.spec ? 0 : sp.cost);
    skillOpen(c, lv).now.filter(x => x !== sp).some(x => {
      const cost = x.spec ? 0 : x.cost; if (cost > left) return true; left -= cost;
      acts.push({ kind: "skill", x, act: "skill" });
      return acts.length >= 4; }); }
  const dn = dvNext(c, lv), dLeft = (c.dvTotal || 0) - dvSpent(c), dc = dn && (c.dvCost || {})[dn.k];
  /* "<Board> board opens" (a milestone step) still open: that card comes first, the board's buy card after it (one, not both). */
  const boOpen = dn && GATES.some(g => g.lv <= lv && g.items.some(it => it.bo === dn.board && !c.checks[it.k]));
  if (boOpen) { /* the milestone card covers it */ }
  else if (dn && dLeft < dvNeed(c, dn) && dc !== 0) { /* can't afford even the cheapest version of the next node: nothing to do on the board yet */ }
  else if (dn && dc != null && dc <= dLeft) acts.push({ kind: "board", dn, dc, dLeft, act: "board" });
  else if (dn && dc == null && dLeft > 0) acts.push({ kind: "boardcost", dn, dLeft, act: "boardcost" });
  let stWait = null; /* equip card that needs a shard first: ranked after the story, no button */
  { const sl = stigmaSlots(c), nx = sl.find(x => !c.checks[x.k]), up = stigmaPlan(c)[0];
    if (nx && stigmaEquipOpen(c, nx, ev)) { const r = E_ORDER.filter(n => n === nx.name || sl.some(x => x.name === n && c.checks[x.k])).indexOf(nx.name);
      if (!(c.stLv || {})[nx.name] && !(c.stShards || 0)) { let at = null; for (let L = lv + 1; L <= 45 && at == null; L++) if (shardsFromLv(L) > shardsFromLv(lv)) at = L;
        stWait = { kind: "stwait", nx, at, act: "" }; }
      else acts.push({ kind: "stequip", nx, r, act: "stequip" }); }
    else if (up && (c.stShards || 0) >= up.cost) acts.push({ kind: "stup", up, shards: c.stShards, act: "stup" }); }
  /* Key placement for new skills/stigmas is already a milestone step ("Put … in row 0 of E"); the Build tab shows a "new" badge. */
  const here = GATES.find(g => g.lv === lv && isOpen(countsOf(state, g)));
  const hs = here ? openSteps(state, here) : [];
  /* Unlock-type steps at your milestone come before the story; its regional quests (optional side quests) come after it. */
  hs.filter(x => !x.rq && !x.adv).forEach(x => acts.push({ kind: "step", x, g: here, act: "tick:" + x.k }));
  const sdOpen = AREA_ITEMS.filter(x => x.it.kind === "hideout" && areaOpen(c, x, ev) && !doneOf(c, x.k, ev)).sort((a, b) => bandOf(a) - bandOf(b));
  const shOpen = AREA_ITEMS.filter(x => x.it.kind === "stronghold" && areaOpen(c, x, ev) && !doneOf(c, x.k, ev));
  /* Story levels are recommended levels, not hard requirements (owner, 2026-10-15): the story card's level gate is the
     kept rule "story-card-recommended-level" (storyRecGate; the first story quest never gates). */
  const { qi, gateLv, gated } = storyRecGate(c);
  const hereArea = storyAreaOf(storyHereOf(state), KIB_AREA);
  /* Sealed Dungeon pick: one in the story step's zone (highest band first); else one from the highest open band. */
  const byHigh = [...sdOpen].sort((a, b) => bandOf(b) - bandOf(a));
  const sdPick = byHigh.find(x => x.area === hereArea) || byHigh[0];
  const bandCount = (kind, bd) => { const xs = AREA_ITEMS.filter(x => x.it.kind === kind && bandOf(x) === bd); return { bd, d: xs.filter(x => doneOf(c, x.k, ev)).length, n: xs.length }; };
  const sdCard = sdOpen.length ? { kind: "sd", pick: sdPick, loc: AREA_LOC[sdPick.it.name] || {}, open: sdOpen.length, gated, gateLv, hereArea, band: bandCount("hideout", bandOf(sdPick)), act: "areas:" + bandOf(sdPick) } : null;
  /* Regional quests as one card: take them all, finish them in any order. Available = the quest's own recommended level
     (RQ rec), not its milestone's level. "Not in game yet" (rqSnooze) hides a quest until your next Level up or until
     the quest before it is turned in. */
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
  if (rqCard && gated && rqOpen.length) acts.push(rqCard);
  if (sdCard && gated) acts.push(sdCard);
  /* Leftovers from milestones below your level. Unlock-type steps (equip, ascension quests) stay above the story;
     regional quests keep the rank they had at their own level: after the story. */
  const missed = GATES.filter(g => g.lv < lv && isOpen(countsOf(state, g)));
  const msAll = missed.flatMap(g => openSteps(state, g).map(m => ({ ...m, g })));
  msAll.filter(m => !m.rq && !m.adv).slice(0, 2).forEach(m => acts.push({ kind: "missed", x: m, g: m.g, act: "tick:" + m.k }));
  /* Nothing else to do right now: the story is the default (its steps live in the Journey card). */
  acts.push(storyCard(state, { qi, gated, gateLv, sdOpen, shOpen }));
  if (rqCard && !(gated && rqOpen.length)) acts.push(rqCard);
  if (sdCard && !gated) acts.push(sdCard);
  if (stWait) acts.push(stWait);
  /* Advice steps (optional; e.g. the Lv 45 Ascension Trial / Abyss Points notes) rank after the story. Advanced only. */
  [...hs.filter(x => x.adv).map(x => ({ x, g: here })), ...msAll.filter(m => m.adv).map(m => ({ x: m, g: m.g }))].slice(0, 3).forEach(({ x, g }) =>
    acts.push({ kind: "adv", adv: true, x, g, act: "tick:" + x.k }));
  const shPick = shOpen.find(x => x.area === hereArea) || [...shOpen].sort((a, b) => (b.it.lo || 0) - (a.it.lo || 0) || (a.it.hi || 45) - (b.it.hi || 45))[0];
  const shAll = AREA_ITEMS.filter(x => x.it.kind === "stronghold");
  const shCard = shOpen.length ? { kind: "sh", pick: shPick, open: shOpen.length, done: shAll.filter(x => doneOf(c, x.k, ev)).length, total: shAll.length, hereArea, act: "areas:sh" } : null;
  if (shCard) acts.push(shCard);
  /* The queue's tail: the next actions that open with a level (skill upgrade, milestone step). */
  {
    /* Each skill's own next upgrade only (no jumps past a level you haven't bought), one card per skill. */
    const nextOf = {}; SP_STEPS.filter(x => !c.checks[x.k]).forEach(x => { const n = nextOf[x.s.n]; if (!n || x.L < n.L) nextOf[x.s.n] = x; });
    const sp2s = Object.values(nextOf).filter(x => !ev.byKey(x.k).open && !x.spec).sort((a, b) => a.req - b.req || a.rank - b.rank);
    /* Only a milestone with a required step still open: not regional quests, optional steps, or skill lines (those have
       their own "Buy" cards above), so a card never promises something that won't show up at that level. Its first step
       that isn't a regional quest; stigma-only milestones show their title ("Stigma slot 2"). */
    const g2 = GATES.find(g => g.lv > lv && checkableOf(state, g).some(x => x.it.kind !== "quest" && !/^(sp|dv):/.test(x.k) && !doneOf(c, x.k, ev))), st2 = g2 ? openSteps(state, g2).find(x => !x.rq && !x.adv) : null;
    const later = sp2s.slice(0, 3).map(x => ({ L: x.req, a: { kind: "laterSkill", x, lv, later: true, act: "" } }));
    if (g2) later.push({ L: g2.lv, a: { kind: "laterStep", g: g2, x: st2 || null, lv, later: true, act: "" } });
    later.sort((x, y) => x.L - y.L).forEach(x => acts.push(x.a));
  }
  /* Basic: only what you can act on now (no "Later" cards, no queued skill buys after the first). */
  const fs0 = acts.findIndex(a => a.act === "skill");
  const shown0 = basic ? acts.filter((a, i) => !a.later && !a.adv && !(a.act === "skill" && i !== fs0)) : acts;
  /* At most 8 cards, plus the story card and the side-content cards (regional quests, dungeon, stronghold), which always stay. */
  const keep = [rqCard, sdCard, shCard, stWait].filter(Boolean);
  return shown0.filter((a, i) => i < 8 || a.story || keep.includes(a));
}

/* The story card: set your quest / story complete / the quest with its objectives. Level-gated (the quest's level is
   above yours): no "Turned in" until its objectives are all ticked, never below the quest's unlock level (turnInNeedsLv,
   0.3 E4: Forgotten Commander at Lv 44), and a "Meanwhile" line of what gives XP at your
   level (verified unlocks only): Sealed Dungeons and Strongholds still to clear, the highest Expedition you've unlocked
   (Krao Cave also needs its step's story gate, g20:exp: "Daeva in a Dream" reached), the daily dungeon. */
function storyCard(state, { qi, gated, gateLv, sdOpen, shOpen }) {
  const c = char(state), lv = c.level;
  if (qi < 0) return { kind: "story", story: true, v: "unset", act: "setquest" };
  const list = QUEST_STEPS[c.quest], done = (c.qsteps || {})[c.quest] || [], nq = QUESTS[qi + 1] || null;
  /* Past the end of the guide's story data: no dead "Turned in"; the story goes on in game. */
  if (!nq && c.storyEnd === c.quest) return { kind: "story", story: true, v: "end", quest: c.quest, act: "" };
  const meanwhile = !gated ? null : (() => {
    const krao = openBut(gatesOf(c).byKey("g20:exp"), "level");
    const ex = VERIFIED_UNLOCKS.filter(x => x[0] <= lv && /^Expedition/.test(x[2]) && (x[1] !== "Krao Cave" || krao)).pop();
    const dd = VERIFIED_UNLOCKS.find(x => x[1] === "Daily dungeon");
    return { sd: sdOpen.length > 0, sh: shOpen.length > 0, ex: ex ? { lv: ex[0], name: ex[1], il: (ex[2].match(/item level (\d+)/) || [])[1] || null } : null, dd: dd && dd[0] <= lv ? dd[0] : null }; })();
  const base = { kind: "story", story: true, quest: c.quest, nq, gated, gateLv, lv, meanwhile };
  const turnInLv = turnInNeedsLv(c), shut = turnInLv > 0;
  if (shut) base.turnInLv = turnInLv;
  if (!list) return { ...base, v: "nolist", act: gated || shut ? "" : "story" };
  const vis = objIdxOf(state, list), allDone = vis.every(i => done.includes(i));
  /* Where to go next, unless the open objective already names its Kibelisk. */
  const sh = gated ? null : storyHereOf(state), kib = sh && !(list && /\(Kibelisk:/.test(list[vis.find(i => !done.includes(i))] || "")) ? sh : null;
  return { ...base, v: "obj", done: vis.filter(i => done.includes(i)).length, total: vis.length, kib, objectives: !gated, act: shut ? "" : gated ? (allDone ? "story" : "") : "story" };
}
