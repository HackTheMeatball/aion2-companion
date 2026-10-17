/* Metabot's Altgard interactive map links (0.4 P4b: out of src/main.js): the area rows and Next up's dungeon and
   stronghold picks (mapFocus), a milestone row's dungeon entrance and a regional quest's pin. */
import { SH_DATA } from "../data/generated.js";
import { metaSlug } from "../data/markup.js";

/* Each hideout name links to its allthings.how map page (location and nearest teleport). */
/* Metabot slugs drop apostrophes ("Valka's Nest" → valkas-nest); allthings.how keeps them as hyphens. */
/* Pin target: Metabot's Altgard interactive map, centred on the marker (the same links its own pages use).
   Dungeons focus by slug; strongholds by their quest id (2820001–2820015, read from each stronghold's page). */
const SH_QID = Object.fromEntries(SH_DATA.map(s => [s.name, s.qid]));
/* Category pages open the map preset to that one layer (dungeons / strongholds), so other markers stay off. */
const mapFocus = it => it.kind === "stronghold"
  ? `https://metabot.gg/en/aion-2/map/altgard/strongholds?focus=quest:${SH_QID[it.name]}`
  : `https://metabot.gg/en/aion-2/map/altgard/dungeons?focus=dungeon:${metaSlug(it.name)}`;
/* a milestone row's "map" slug → its dungeon entrance on the map */
const aion2DungeonMap = slug => `https://metabot.gg/en/aion-2/map/altgard/dungeons?focus=dungeon:${slug}`;
/* a regional quest id → its pin on the map */
const aion2QuestMap = id => `https://metabot.gg/en/aion-2/map/altgard?focus=quest:${id}`;

export { mapFocus, aion2DungeonMap, aion2QuestMap };
