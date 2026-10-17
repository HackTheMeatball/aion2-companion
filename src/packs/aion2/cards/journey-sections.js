/* The AION 2 parts of the Journey card (0.4 P5c, moved verbatim from src/cards/journey.js): what a level change does
   beside the level (crystals, shards, regional quest snoozes, the Areas band), the Level up float's gains, where an
   objective with parts sends you and what a story line opens. The Ascension bar's section (ascension.js) hands them to
   the card from its mount (useJourneyParts; the names: src/cards/journey.js). */
import { char } from "../../../core/state.js";
import { LEVEL_POINTS } from "../data/build.js";
import { AREA_ITEMS, RQ_K, bandOf } from "../catalog.js";
import { dvFromLv, shardsFromLv } from "../requirements.js";

const aion2JourneyParts = {
  reqOpens: "the steps with a story chip and the regional quests below",
  /* "Objective — detail (Place)": the place in brackets at the end of the detail */
  subPlace: t => ((t.split(" — ")[1] || "").match(/\(([^)]*)\)\s*$/) || [])[1],
  onLevel(state, v) {
    if (char(state).dvTotal) char(state).dvTotal = Math.max(0, char(state).dvTotal + dvFromLv(v) - dvFromLv(char(state).level));
    /* Shards on hand follow level changes the same way crystals do (down too, so fixing a mis-click undoes it). */
    { const ds = shardsFromLv(v) - shardsFromLv(char(state).level || 1); if (ds) char(state).stShards = Math.max(0, (char(state).stShards || 0) + ds); }
    /* "Not in game yet" snoozes last until the next Level up; a quest with no prerequisite data keeps it until its recommended level. */
    if (v > (char(state).level || 1) && char(state).rqSnooze) { Object.keys(char(state).rqSnooze).forEach(k => { const it = RQ_K(k); if (!(it && it.q.noPre && v < it.q.rec)) delete char(state).rqSnooze[k]; });
      if (!Object.keys(char(state).rqSnooze).length) delete char(state).rqSnooze; }
    /* Areas follows you: if the band you're viewing is fully cleared, go back to the default (lowest band with open clears). */
    if (state.areaLv && state.areaLv !== "sh" && !AREA_ITEMS.some(x => bandOf(x) === +state.areaLv && !char(state).checks[x.k])) delete state.areaLv;
  },
  levelGains(from, to) {
    const sp = (LEVEL_POINTS[to] || 0) - (LEVEL_POINTS[from] || 0), dv = dvFromLv(to) - dvFromLv(from), sh = shardsFromLv(to) - shardsFromLv(from);
    return ` +${sp} skill pts${dv ? ` · +${dv} crystals` : ""}${sh ? ` · +${sh} shard${sh === 1 ? "" : "s"}` : ""}`;
  },
};

export { aion2JourneyParts };
