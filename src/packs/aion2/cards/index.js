/* The AION 2 pack's cards (0.4 P4b): the pack object lists them (aion2Pack.cards) and the shell registers each with
   the card registry (src/core/cards.js; slots and orders: docs/ARCHITECTURE.md §2). */
import { aion2ProgressCard } from "./progress.js";
import { aion2AreasCard } from "./areas.js";
import { aion2SkillsCard } from "./skills.js";
import { aion2DaevanionCard } from "./daevanion.js";
import { aion2CubeCard } from "./cube.js";
import { aion2StigmasCard } from "./stigmas.js";
import { aion2BuildCard } from "./build.js";

export const aion2Cards = [aion2ProgressCard, aion2AreasCard, aion2SkillsCard, aion2DaevanionCard, aion2CubeCard, aion2StigmasCard, aion2BuildCard];
