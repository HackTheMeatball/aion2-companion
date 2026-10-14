/* Milestones (GATES) and route rules (STEPS): text and item keys. Keys are permanent (docs/ARCHITECTURE.md §1).
   Since 0.2 step 5b they are compiled from data/shared/asmodian/guide/ (milestones.json, steps.json), the Sealed Dungeons
   (sealed-dungeons.json) and the guide build's board plan (data/classes/assassin/builds.json) by tools/gen/gen.mjs, in
   their v1 item shape with the text tokens left in; this module turns the tokens into HTML (markup.js) and the Sealed
   Dungeon blocks into their rows. Every export is still a page global (scripts/build.mjs). */
import { GUIDE_GATES, GUIDE_STEPS } from "./generated.js";
import { expandTokens, hideouts } from "./markup.js";
const TEXT_FIELDS = ["t", "ns", "note", "upsell"];
const guideItems = items => items.flatMap(it => it.hideouts ? hideouts(it.hideouts, it.keyPrefix)
  : [Object.fromEntries(Object.entries(it).map(([k, v]) => [k, TEXT_FIELDS.includes(k) ? expandTokens(v) : v]))]);
export const GATES = GUIDE_GATES.map(g => ({ ...g, items: guideItems(g.items) }));
export const STEPS = GUIDE_STEPS.map(s => ({ ...s, items: guideItems(s.items) }));
