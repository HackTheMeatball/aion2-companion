/* Main story: quests by level, objectives, routes, unlocks.
   Since 0.2 step 5b the tables are compiled from data/shared/asmodian/story-quests.json and unlocks.json
   (tools/gen/gen.mjs); this module re-exports them under their page names. Every export is still a page global. */
export { QUESTS, QUEST_STEPS, QUEST_STEP_NOTES, QUEST_LOC, STORY_UNLOCKS, UNLOCK_GATE, VERIFIED_UNLOCKS } from "./generated.js";
