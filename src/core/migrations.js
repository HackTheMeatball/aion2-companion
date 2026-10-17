/* Load-time steps (0.2 P3, pure: no DOM, no storage), in load order (docs/ARCHITECTURE.md §1). Save v5 (0.4 P3c) is a
   clean break, so no step reads an old shape: what is left is the fresh start, the story-end move-on (data growth) and
   the stigma pick pinning. store() is the page's storeState(), called where a step changed saved progress. */
import { GATES } from "../data/milestones.js";
import { QUESTS } from "../data/story.js";
import { STIGMA_PLAN } from "../data/build.js";
import { char } from "./state.js";
import { stamp } from "./sync.js";

export function migrate(s, hadSave, store, now = 0) {
  const c = char(s);
  /* A fresh browser starts where a new character does (owner, 2026-10-15): Lv 1, on the first story quest; cleared
     milestones start folded (Filters → Cleared milestones). Its values are stamped at time 0 (unknown), so the default
     first quest never outranks another device's progress in merge(); backup.since (ms; now is in seconds) is the
     baseline of the export nudge (src/core/backup.js). Only here, not in loadState: a save is never re-defaulted. */
  if (!hadSave) {
    c.level = 1; if (QUESTS.length) c.quest = QUESTS[0][1];
    s.hideCards = true; s.backup = { since: now * 1000 };
    if (!c.created) c.created = now * 1000;
    stamp(c, 0);
  }
  /* An equipped slot keeps the stigma it was equipped with, even if the plan's order changes later. */
  GATES.forEach(g => g.items.forEach(it => { if (it.stig && c.checks[it.k] && !(c.stPick || {})[it.stig]) { c.stPick = c.stPick || {}; c.stPick[it.stig] = STIGMA_PLAN[it.stig - 1]; } }));
  /* "Turned in" on the last covered quest is remembered (storyEnd); once later quests are added, move on to the next. */
  if (c.storyEnd && c.storyEnd === c.quest) { const i = QUESTS.findIndex(([, n]) => n === c.quest); if (i >= 0 && i < QUESTS.length - 1) { c.quest = QUESTS[i + 1][1]; delete c.storyEnd; store(); } }
}
