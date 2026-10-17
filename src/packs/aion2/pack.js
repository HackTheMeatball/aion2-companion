/* The AION 2 pack object (0.4 P2b, docs/design/0.4-engine-contract.md §2): everything the engine reads of AION 2, handed
   over in one place. The shell imports it and calls usePack(aion2Pack) before it loads the save (src/main.js); the Node
   test bundle does the same (tests/support/core-bundle.mjs). The compiled data modules (gate-graph.js, gate-proposed.js;
   scripts/generated-data.mjs) are imported here and nowhere in the engine. */
import { definePack } from "../../core/pack.js";
import { GATE_GRAPH } from "./data/gate-graph.js";
import { GATE_PROPOSED } from "./data/gate-proposed.js";
import { QUESTS, QUEST_STEPS, QUEST_STEP_NOTES } from "./data/story.js";
import { GATES, STEPS } from "./data/milestones.js";
import { GATE_CHANGES, KEPT_RULES, aion2Transforms } from "./rules.js";
import { hopName, isAscensionKey, objLow, objSubs, storyHereOf, storyRecGate, zoneOfKey } from "./requirements.js";
import { aion2OnLoad } from "./load.js";
import { aion2Meanwhile, aion2NextUp, aion2StoryFields } from "./nextup.js";
import { aion2Cards } from "./cards/index.js";
import { aion2Text } from "./text.js";
import { aion2NowRenderers } from "./cards/nextup-kinds.js";
import { aion2RowHooks, aion2RowRenderers } from "./cards/rows.js";

/* The guide pack (data/packs/aion2/asmodian/assassin/pack.json) and its class (data/packs/aion2/classes/assassin), the only
   ones a character can have until 0.5 adds a class picker; tests/core/state.test.mjs checks both against data/. */
export const PACK = "aion2/asmodian/assassin";
export const CLASS = "assassin";

export const aion2Pack = definePack({
  id: "aion2",
  data: { graph: GATE_GRAPH, proposed: GATE_PROPOSED, story: { quests: QUESTS, steps: QUEST_STEPS, notes: QUEST_STEP_NOTES } },
  catalog: {
    milestones: GATES, routes: STEPS,
    /* Sealed Dungeons (and their heading) and board nodes are tracked in their own cards, not as milestone rows; regional
       quests (and their headings) are side content: listed last, not in the main counts */
    rowKind: it => { const k = it.kind || it.group; return k === "hideout" || it.dv ? "none" : k === "quest" ? "side" : "main"; },
    /* skill and board lines have their own cards, the Stigmas card covers stigma equips and "Put … on E" */
    offered: (it, k) => !/^(sp|dv):/.test(k) && !(it && (it.stig || it.eput)),
    /* skill and board lines have their own Buy / Later cards; a stigma-only milestone's Later card shows its title */
    promised: (it, k) => !/^(sp|dv):/.test(k),
  },
  /* the character's fields beside the engine's, in the order sync stamps them (src/core/sync.js) */
  charFields: {
    areaRun: "map", rqSnooze: "map", stLv: "map", stPick: "map",
    stones: "register", pendSt: "register", pendCr: "register", stShards: "register", dvTotal: "register", dvCost: "map", dvAdj: "register",
    /* the 10-second undo of a board node (local), and two retired fields */
    dvLast: "local", dvLastAt: "local", dvPts: "local", crystals: "local",
    rotSeen: "register",
  },
  character: { pack: PACK, class: CLASS },
  keptRules: KEPT_RULES,
  gateChanges: GATE_CHANGES,
  graphTransforms: aion2Transforms,
  story: { levelGate: storyRecGate, isTalkOnly: objLow, subs: objSubs, here: storyHereOf, meanwhile: aion2Meanwhile, cardFields: aion2StoryFields },
  hopName,
  locate: zoneOfKey,
  skipLocation: isAscensionKey,
  onLoad: aion2OnLoad,
  nextUpProducers: aion2NextUp,
  /* its cards (0.4 P4b): the shell registers each (src/main.js) */
  cards: aion2Cards,
  /* its Next up and Later kinds and their hooks (0.4 P5a): the engine cards call them (src/cards/nextup.js, ahead.js) */
  nowRenderers: aion2NowRenderers,
  /* its rows in the milestone and Route rules cards, and what they do (0.4 P5b) */
  rowRenderers: aion2RowRenderers,
  rowHooks: aion2RowHooks,
  /* the words the engine cards may not hold (0.4 P5d) */
  text: aion2Text,
});
