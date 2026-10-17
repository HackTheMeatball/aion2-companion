/* The AION 2 load step (hook onLoad, 0.4 P2b; pure: no DOM, no storage). The engine calls it from migrate()
   (src/core/migrations.js) after the fresh start and before the story-end move-on; it changes the character in memory
   only, never storage. */
import { STIGMA_PLAN } from "./data/build.js";
import { GATES } from "./data/milestones.js";

/* An equipped slot keeps the stigma it was equipped with, even if the plan's order changes later. */
export const aion2OnLoad = (save, c) => {
  GATES.forEach(g => g.items.forEach(it => { if (it.stig && c.checks[it.k] && !(c.stPick || {})[it.stig]) { c.stPick = c.stPick || {}; c.stPick[it.stig] = STIGMA_PLAN[it.stig - 1]; } }));
};
