/* What the AION 2 cards read of the page shell (0.4 P4b). The cards moved out of src/main.js verbatim (docs/plans/0.4/
   P4b-pack-cards.md): they still use the shell's state, save(), update(), its other cards' renders and a few shared
   helpers by their old names. A pack may not import main.js (docs/design/0.4-engine-contract.md §1), so the shell hands
   them over once, with aion2UsePage({ state, save, … }) before its first render(), and each card imports what it uses
   under its old name: import { aion2Save as save } from "./page.js". The bindings are live (one bundle scope), so a card
   reads them when it runs, never at import (they are null until the shell has called aion2UsePage).

   The list shrinks as the cards become clean modules (explicit inputs; when a feature touches them, P0 §6) and as P4c
   moves the engine cards it names (Journey, Next up, Undo). */
export const AION2_PAGE_NAMES = [
  "state", "save", "update", "render", "renderNow", "renderQuest", "renderAscension", "renderStoryChips", "renderStoryReqs", "renderUndo",
  "fitSkills", "fadeScroll", "rewardToast", "chime", "SMOOTH", "derivedBox", "isBasic", "spMini", "ini", "specSub", "stIco", "dvShort",
  "mainEl", "layoutEl", "STIGMA_SLOTS", "stPlan", "stLvOf", "rqAvail", "dvGate",
];
export let aion2State = null, aion2Save = null, aion2Update = null, aion2Render = null, aion2RenderNow = null, aion2RenderQuest = null,
  aion2RenderAscension = null, aion2RenderStoryChips = null, aion2RenderStoryReqs = null, aion2RenderUndo = null, aion2FitSkills = null,
  aion2FadeScroll = null, aion2RewardToast = null, aion2Chime = null, aion2SMOOTH = null, aion2DerivedBox = null, aion2IsBasic = null,
  aion2SpMini = null, aion2Ini = null, aion2SpecSub = null, aion2StIco = null, aion2DvShort = null, aion2MainEl = null, aion2LayoutEl = null,
  aion2STIGMA_SLOTS = null, aion2StPlan = null, aion2StLvOf = null, aion2RqAvail = null, aion2DvGate = null;
/* p = { state, save, … }: every name in AION2_PAGE_NAMES, none missing */
export function aion2UsePage(p) {
  for (const n of AION2_PAGE_NAMES) if (p[n] === undefined || p[n] === null) throw new Error(`aion2UsePage: "${n}" is missing`);
  ({ state: aion2State, save: aion2Save, update: aion2Update, render: aion2Render, renderNow: aion2RenderNow, renderQuest: aion2RenderQuest,
    renderAscension: aion2RenderAscension, renderStoryChips: aion2RenderStoryChips, renderStoryReqs: aion2RenderStoryReqs,
    renderUndo: aion2RenderUndo, fitSkills: aion2FitSkills, fadeScroll: aion2FadeScroll, rewardToast: aion2RewardToast, chime: aion2Chime,
    SMOOTH: aion2SMOOTH, derivedBox: aion2DerivedBox, isBasic: aion2IsBasic, spMini: aion2SpMini, ini: aion2Ini, specSub: aion2SpecSub,
    stIco: aion2StIco, dvShort: aion2DvShort, mainEl: aion2MainEl, layoutEl: aion2LayoutEl, STIGMA_SLOTS: aion2STIGMA_SLOTS,
    stPlan: aion2StPlan, stLvOf: aion2StLvOf, rqAvail: aion2RqAvail, dvGate: aion2DvGate } = p);
}
