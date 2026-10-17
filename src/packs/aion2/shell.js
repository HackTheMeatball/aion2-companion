/* What the page shell takes from the AION 2 pack: the pack object, its cards' hand-over (aion2UsePage) and the tables and
   helpers the shell still passes on to the cards by their old names (useCardPage, src/cards/page.js). src/main.js
   imports this one module as "pack" (scripts/build.mjs maps the name to this file), so the shell names no game; another
   pack offers the same names here. Re-exports only: every name keeps its module (one global scope, P0 §1). */
export { CONF, SD_RW, SOURCES, SRC_SITE, STORY_END } from "./data/generated.js";
export { ITEMS } from "./data/items.js";
export { E_ORDER, LEVEL_POINTS, RMB_STACK } from "./data/build.js";
export { seq } from "./data/markup.js";
export { TIPS } from "./data/tips.js";
export { GATES, STEPS } from "./data/milestones.js";
export { QUESTS, QUEST_STEPS, STORY_UNLOCKS, UNLOCK_GATE, VERIFIED_UNLOCKS } from "./data/story.js";
export { NO_AREA, SH_REWARD } from "./data/areas.js";
export { aion2Pack } from "./pack.js";
export { aion2UsePage } from "./cards/page.js";
export { aion2DungeonMap, aion2QuestMap, mapFocus } from "./cards/maps.js";
export { aion2TipId, ini, spMini, stIco, dvShort } from "./cards/shared.js";
export { goAreas } from "./cards/areas.js";
export { cubeClick } from "./cards/cube.js";
export { stLvClick, stTickClick, stUpClick } from "./cards/stigmas.js";
export { AREA_ITEMS, CLEAR_REWARD, DV_NODES, RQ_BY, RQ_K, bandOf, eputK, spCostTxt } from "./catalog.js";
export { dvFromLv, dvGateOf, dvLeft, objSubs, rqStatus, shardsFromLv, slotNames, specPickOf, stLvOfC, stigmaPlan, stigmaSlots, rqReqOf } from "./requirements.js";
export { ascensionOf } from "./ascension.js";
export { aion2AscensionCard, renderAscension } from "./cards/ascension.js";
