/* What the engine cards read of the page shell (0.4 P4c). Next up, Journey, Later, the milestone cards, Route rules and
   Undo moved out of src/main.js verbatim (docs/plans/0.4/P4c-engine-cards.md): they still use the shell's state, save(),
   update(), a few shared helpers and the game pack's tables and helpers by their old names. src/cards/ may import only
   src/core/ and src/cards/ (docs/design/0.4-engine-contract.md §1), so the shell hands them over once, with
   useCardPage({ state, save, … }) before its first render(), and each card imports what it uses under its old name:
   import { pageState as state } from "./page.js". The bindings are live (one bundle scope), so a card reads them when it
   runs, never at import (they are null until the shell has called useCardPage).

   The list shrinks as P5a–d make these cards read the pack through the pack object (and the pack's names leave src/cards/). */
export const CARD_PAGE_NAMES = [
  "state", "save", "update", "mainEl", "layoutEl", "SMOOTH", "RMQ", "rewardToast", "chime", "tipClick",
  "tipGoClick", "tipEsc", "GATES", "STEPS", "QUESTS", "QUEST_STEPS", "STORY_UNLOCKS", "UNLOCK_GATE",
  "VERIFIED_UNLOCKS", "STORY_END", "SD_RW", "SH_REWARD", "NO_AREA", "ITEMS", "E_ORDER", "LEVEL_POINTS", "seq",
  "AREA_ITEMS", "CLEAR_REWARD", "DV_NODES", "RQ_K", "bandOf", "eputK", "spCostTxt", "dvFromLv", "shardsFromLv",
  "objSubs", "rqReqOf", "specPickOf", "mapFocus", "aion2QuestMap", "aion2DungeonMap", "goAreas", "cubeClick",
  "stTickClick", "stUpClick", "stLvClick", "spMini", "stIco", "dvShort", "STIGMA_SLOTS", "stNames", "rqAvail",
  "qProg", "counts", "mainCounts", "sideOpen", "objIdx"
];
export let pageState = null, pageSave = null, pageUpdate = null, pageMainEl = null, pageLayoutEl = null,
  pageSMOOTH = null, pageRMQ = null, pageRewardToast = null, pageChime = null, pageTipClick = null,
  pageTipGoClick = null, pageTipEsc = null, pageGATES = null, pageSTEPS = null, pageQUESTS = null,
  pageQUEST_STEPS = null, pageSTORY_UNLOCKS = null, pageUNLOCK_GATE = null, pageVERIFIED_UNLOCKS = null,
  pageSTORY_END = null, pageSD_RW = null, pageSH_REWARD = null, pageNO_AREA = null, pageITEMS = null,
  pageE_ORDER = null, pageLEVEL_POINTS = null, pageSeq = null, pageAREA_ITEMS = null, pageCLEAR_REWARD = null,
  pageDV_NODES = null, pageRQ_K = null, pageBandOf = null, pageEputK = null, pageSpCostTxt = null,
  pageDvFromLv = null, pageShardsFromLv = null, pageObjSubs = null, pageRqReqOf = null, pageSpecPickOf = null,
  pageMapFocus = null, pageAion2QuestMap = null, pageAion2DungeonMap = null, pageGoAreas = null,
  pageCubeClick = null, pageStTickClick = null, pageStUpClick = null, pageStLvClick = null, pageSpMini = null,
  pageStIco = null, pageDvShort = null, pageSTIGMA_SLOTS = null, pageStNames = null, pageRqAvail = null,
  pageQProg = null, pageCounts = null, pageMainCounts = null, pageSideOpen = null, pageObjIdx = null;
/* p = { state, save, … }: every name in CARD_PAGE_NAMES, none missing */
export function useCardPage(p) {
  for (const n of CARD_PAGE_NAMES) if (p[n] === undefined || p[n] === null) throw new Error(`useCardPage: "${n}" is missing`);
  ({ state: pageState, save: pageSave, update: pageUpdate, mainEl: pageMainEl, layoutEl: pageLayoutEl,
    SMOOTH: pageSMOOTH, RMQ: pageRMQ, rewardToast: pageRewardToast, chime: pageChime, tipClick: pageTipClick,
    tipGoClick: pageTipGoClick, tipEsc: pageTipEsc, GATES: pageGATES, STEPS: pageSTEPS, QUESTS: pageQUESTS,
    QUEST_STEPS: pageQUEST_STEPS, STORY_UNLOCKS: pageSTORY_UNLOCKS, UNLOCK_GATE: pageUNLOCK_GATE,
    VERIFIED_UNLOCKS: pageVERIFIED_UNLOCKS, STORY_END: pageSTORY_END, SD_RW: pageSD_RW, SH_REWARD: pageSH_REWARD,
    NO_AREA: pageNO_AREA, ITEMS: pageITEMS, E_ORDER: pageE_ORDER, LEVEL_POINTS: pageLEVEL_POINTS, seq: pageSeq,
    AREA_ITEMS: pageAREA_ITEMS, CLEAR_REWARD: pageCLEAR_REWARD, DV_NODES: pageDV_NODES, RQ_K: pageRQ_K,
    bandOf: pageBandOf, eputK: pageEputK, spCostTxt: pageSpCostTxt, dvFromLv: pageDvFromLv,
    shardsFromLv: pageShardsFromLv, objSubs: pageObjSubs, rqReqOf: pageRqReqOf, specPickOf: pageSpecPickOf,
    mapFocus: pageMapFocus, aion2QuestMap: pageAion2QuestMap, aion2DungeonMap: pageAion2DungeonMap,
    goAreas: pageGoAreas, cubeClick: pageCubeClick, stTickClick: pageStTickClick, stUpClick: pageStUpClick,
    stLvClick: pageStLvClick, spMini: pageSpMini, stIco: pageStIco, dvShort: pageDvShort,
    STIGMA_SLOTS: pageSTIGMA_SLOTS, stNames: pageStNames, rqAvail: pageRqAvail, qProg: pageQProg,
    counts: pageCounts, mainCounts: pageMainCounts, sideOpen: pageSideOpen, objIdx: pageObjIdx } = p);
}
