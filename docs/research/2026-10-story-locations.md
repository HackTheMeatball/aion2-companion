# Story-quest locations from Metabot (research, 2026-10-15)

Question: the 40 story quests on the placeholder zone `zone:altgard-unplaced` (DATA-FORMAT-V2 §9 data task; the brief
said 41, the generator's `report.debt.placeholderZone` lists 40): what does each Metabot quest page give for the giver
and the turn-in, and which zone of our registry (`data/shared/asmodian/zones.json`) does that resolve to?
Per-quest results: `data/research/story-locations-metabot-2026-10.csv` (40 rows). Script:
`data/research/scripts-2026-10/story_locations.py`. Requests: `data/research/story-locations-metabot-2026-10.requests.log`.
Data change: `tools/history/v2-corrections/2026-10-15-story-locations.mjs` (log in `2026-10-15-story-locations.txt`).

## 1. Result

- **71 placeholder sides** (giver or turn-in) on 40 quests. **34 now have a zone**: 6 `verified` (Metabot names the
  zone itself), 28 `inferred` (Metabot names a camp our registry places in a zone). **37 stay on the placeholder**
  (`owner-check`), each with its reason in the record and the CSV. 14 quests leave the placeholder completely (40 → 26).
- Every side also got what the page gives and the data lacked: NPC, place, nearest Kibelisk and metres, and the marker
  position (Altgard map). Nothing we already held disagreed with a page (the script stops on a difference).
- **The 37 that stay, by reason:** 30 are at a Metabot *village* zone our registry doesn't hold (Steel Hammer Workcamp 8,
  Odar's Shade 7, Fang Hideout 6, Minushan Site 4, Shadow Hall 3, Sanctum Dumpsite 2), and their Kibelisk is in no zone
  record either; 4 auto-start givers (no giver on the page: Finding Nemon, Cemetery Cleanup, Daeva in a Dream, A Daeva
  Dreaming Anew); 2 turn-ins to Asahr at the Dream Crossroad (no map point, no Location); 1 turn-in in Reshanta
  (Forgotten Commander: map `Abyss_Reshanta_A`, outside the Altgard registry).

## 2. Method

- **Policy first** (CLAUDE.md, owner 2026-10-14). `https://metabot.gg/robots.txt`: `Allow: /`, disallows only `/api/`,
  `/private/` and profile paths. Terms (`/en/legal/terms-of-service`, effective 04/01/2026, section "Data Usage &
  Attribution (AI Agents & Automated Tools)"): reuse allowed with a dofollow link to the page the data came from, no
  misrepresentation or implied endorsement, "reasonable request rate". No AI opt-out, unchanged since 2026-10-14.
- **Requests:** 53, all HTTP 200 (robots, terms, 40 quest pages, 11 zone pages), 04:44–04:56 UTC, one at a time,
  ≥ 6 s between request starts (log times are completions: shortest logged gap 4 s, at most 10 in one clock minute).
  User-Agent `DaevaCompanionResearch/0.1 (+https://daevacompanion.com)`. No 403, 429 or challenge. One false stop: the
  challenge check matched the quest dialogue line "Just a moment while I read it…" on *Enemy Territory* (a normal 200
  page); the check was narrowed to the page title / Cloudflare markers and the run resumed. Pages were cached in the
  session scratch folder and are not committed.
- **Fields read per page** (all on the server-rendered page): the "Start & turn-in" table (Role · NPC · Map ·
  Location, where Location links to Metabot's zone page), the embedded `spots` markers (`step-start` / `step-end`, map,
  pixel point, `kisk` name and metres), the "To finish: Talk to X at Y" line (place for a turn-in with no Location), and
  the build line ("Data read from the AION 2 global client (build 0.0.4387.0)", on every page). Giver and turn-in on one
  marker (`S·T`): the turn-in takes the giver's marker; the NPC can differ (e.g. *Verdant Melody*: Nemon gives, Ecco
  takes it).
- **Zone rule** (first match wins): (1) Metabot's Location is a registry zone by name → that zone, `verified`;
  (2) the Location is a camp / Kibelisk of a registry zone → that zone, `inferred` (the registry's camp lists are
  themselves inferred); (3) the nearest Kibelisk ≤ 100 m (gen.mjs's camp rule) is in a registry zone → `inferred`
  (used 0 times); (4) otherwise the placeholder stays with the reason.
- **Zone pages (11, spot check).** Metabot's Location is a game zone: *Safe Haven, Odar's Shade, Fang Hideout, Minushan
  Site, Steel Hammer Workcamp, Shadow Hall, Sanctum Dumpsite* are "Village" zones; *Moslan Forest, Sanctum Outpost,
  Uruthumheim, Fafnite Deposit* are "Field" zones. A village page names no parent field, and its "Nearby zones" table is
  the same alphabetical list on every page checked (Battlescar Mound, Calderon Canyon, Corrupted Forester Ruins, …), so
  it is not adjacency. Village → field is therefore not in Metabot's data; only prose hints at it (Odar's Shade: "An Elim
  village at the entrance to Moslan Forest"). The zone pages are not cited in the data.

## 3. What the data change does on screen

Next up prefers the Sealed Dungeon and stronghold "near your story step" and counts regional quests near it. At a
turn-in that area is the story record's own `turnin.zone` (`QUEST_LOC.turninZone` → `storyHereOf` → `storyAreaOf`);
a turn-in still on the placeholder has no area. Only an objective, which has no zone of its own, still uses its
Kibelisk's zone vote (`KIB_AREA`, from the regional / dungeon / stronghold data). Before the PR #47 review fix the
turn-in also used `KIB_AREA`, with no distance limit, so placeholder turn-ins got an area by inference (*Empyrean
Monolith*: Shadow Hall, Kibelisk Safe Haven 245 m → Dredgion Crash Site) and *Dead Men Tell No Tales* (turn-in Crypt,
verified) showed Nameless Cemetery.

23 story quests (Lv 10–22) now have a turn-in Kibelisk and 25 a turn-in NPC, where they had none. The story card shows
the turn-in Kibelisk when the next objective has none. Where the turn-in zone is now a registry zone, Next up picks the
dungeon / stronghold in that zone and labels it "(near your story step)". Golden master: 130 of 2,000 states differ
from origin/main, all in the Next up stack, all on a Lv 10–22 story quest (PR description lists the kinds).

## 4. Open (owner / CEO)

- **Village zones.** Either add Metabot's village zones to the registry as zones of their own (sourced from their zone
  pages; resolves 30 sides as `verified`), or list each village as a camp of a field zone (needs an owner check or
  another source per village). Until then they stay on the placeholder.
- **Auto-start givers (4):** giver = where the previous quest is turned in? Plausible, not on the page.
- **Dream Crossroad (2) and Reshanta (1):** need a zone outside the Altgard registry, or stay unlocated.
- **Proposed owner check (5 min):** in game, open the map at Odar's Shade and at Steel Hammer Workcamp and note the field
  zone name shown around the village; if the game shows one, rule (2) can use it.
