# Source vetting: approval checklist, dbaion2 / aion2hub verdicts, and the location data (2026-10)

Data & Research, 14 Oct 2026. **Research only: no app code, data file or `claims.json` entry was changed.** Follows the
Fetching policy in `docs/team/data-research.md` and builds on `2026-10-data-sources.md` (the "survey"). Where this
file and the survey disagree about dbaion2.ru or aion2hub.com, this file wins.

**Evidence labels.** *[fetched]* = I requested the page in this session. *[survey]* = stated in the earlier survey and
not re-read. *[inferred]* = my reading, with the test that would settle it. Nothing is a lawyer's opinion.

## 1. Summary

| Source | Verdict | One-line reason |
|---|---|---|
| **dbaion2.ru** (+ dbaion2.online mirror) | **Reject for sessions. Owner hand checks only.** | Its Terms of use (rev. 27 Sep 2026, §5) ban collecting data "by automated means — scrapers, crawlers, bots, automated or headless browsers, scripts", and ban "systematically extract[ing] small parts to assemble a third-party data set". robots.txt allows it; the terms do not. The agreement test was therefore **not run**. |
| **aion2hub.com** | **Approve for spot checks, as a weak corroborating source only.** | No terms exist and robots.txt allows everything, so the 12 req/min tier applies. 15 requests were enough. Agrees with our data and Metabot wherever it can be compared (§4), but it is a hand-written guide on a **pre-launch (2026-09-19) client snapshot**, has no quest/skill-level/specialty/location data, and the operator is unnamed. |
| **Metabot** (reference, not re-vetted) | **Approve (unchanged).** | Re-read in full for §4 and §5: build `0.0.4387.0` still shown, 23 requests, no problems. Only source with usable location data (§5). |

**Domains to add to the "Daeva Companion" code environment, if the owner approves this report:**

- `aion2hub.com` (spot checks only; see §3.2).
- Nothing else. `metabot.gg` is already there. **Do not add** `dbaion2.ru`, `dbaion2.online`, `aion2.th.gl`,
  `gamers4.life`, `interactivemap.app`, `aion2.app`. Metabot's map tiles live on `metabot.gg` too, so no extra domain is needed
  for the location work, and we do not use tile images (no new game art without the owner's OK).

## 2. Source-approval checklist

Run it top to bottom. Items 1 and 2 are gates: a "no" stops the session for that host and the rest is done by the owner
in a browser or not at all. Items 3 to 7 decide how much weight the source gets. Record the answers, with the date,
in the future `sources` registry (DATA-FORMAT-V2) and in the research note.

| # | Check | How | Outcome |
|---|---|---|---|
| 1 | **Terms / robots tier** | Find and read the terms page **before any content page**, then robots.txt. The terms page is often only discoverable from a footer; fetch the home page for the link, nothing else. | **Tier 1, never fetched by a session:** robots.txt names Claude or AI agents, **or the terms ban automated access or data collection by bots, scripts or tools** (even if robots.txt allows). **Tier 2, spot checks:** only bans scraping or bulk/systematic copying and says nothing against a few polite reads: a few pages per task, 5 s apart, facts only, nothing stored. **Tier 3, no restriction:** 12 req/min per host, one at a time, 24 h cache. If no terms page exists, that is tier 3 but the reuse rights are unknown: facts only, credit link, no tables. |
| 2 | **Honest access** | Our User-Agent only; no challenge solving. | A 403, 429 or challenge page ends the session for that host. |
| 3 | **Stated data origin** | Quote the sentence where the site says where the data comes from. | Client files of the *global* build > client files, region unstated > community/hand-entered > unstated. KR/TW data is a preview, never verification of a global fact. |
| 4 | **Game build shown** | Is there a build/patch/date on the page, and what region is it labelled? | Record it next to `verifiedAt`. Build schemes differ per site, so "same build" is never claimed without a mapping test. |
| 5 | **Agreement test** | 15 facts we already hold (below), compared field by field; count matches, mismatches, and not-available separately. | Pass = no unexplained mismatch on the comparable facts. A site that cannot supply a fact type scores "n/a", not a pass. Facts that came from the reference site are a regression test of our data, not independent evidence; say so. |
| 6 | **Update speed after patches** | Stated rule, plus any "last updated" date vs the latest patch/launch. Measure at the next patch (survey T2). | Fast (days), slow (weeks), unknown. A pre-launch snapshot on a live game counts as slow. |
| 7 | **Rate limits** | Any stated limit, `Crawl-delay`, API terms; our cap is 12 req/min regardless. | Record the number or "none stated". |
| 8 | **Independence** | Same operator, copied from another site, or the same client? | Shared upstream = agreement rules out extraction errors only (survey R1, R7). |

The 15-fact agreement set used in §4: five story-quest prerequisite pairs with their levels, five skill unlock levels,
two specialty-choice ladders (8/8/8/12/16), three Sealed Dungeon zones.

## 3. Checklist applied

### 3.1 dbaion2.ru and dbaion2.online

| # | Check | Result |
|---|---|---|
| 1 | Terms / robots | robots.txt *[fetched]*: `Allow` everything except `/napi/`, `/api/`, `/admin/`; no AI agent named. **Terms of use at `/en/rules/`** (revision of 27 September 2026) *[fetched]*, §5 "Using the material": "Without written permission from the administration, and whether or not it loads the server, you may not: collect data by automated means — scrapers, crawlers, bots, automated or headless browsers, scripts or other software (except search engines indexing the site under robots.txt); extract and re-use the whole database or a substantial part of it, or **systematically extract small parts to assemble a third-party data set**; make bulk requests to the site's internal data files (JSON and other service files), APIs and service addresses; build on the site's material mirrors, copies, derived databases … or data sets for training or running AI systems". Allowed: playing, and "quote individual data and pages in guides, videos, discussions and communities. When using a noticeable amount of material, link back". Written permission can be asked at info@dbaion2.online. **Tier 1.** The ban covers any script, so it covers a "few spot checks" by curl or a session too. |
| 2 | Honest access | No challenge seen. Moot: stopped at check 1. |
| 3 | Data origin | "Names, descriptions, stats, drop tables, rewards and prices are read straight from the game client files" *[survey]*; the Terms say "taken from the game client files and public sources" and that data "may differ from the live game: patches, server-side changes and regional differences are not always reflected at once". The mix of "client files" and "public sources" is not broken down per field. |
| 4 | Build shown | None on the pages read *[survey]*; the Terms footer says nothing either. |
| 5 | Agreement test | **Not run** (terms). The owner can run it by hand in about 10 minutes: §4.4 is the sheet. |
| 6 | Update speed | Claims "rebuilt after every patch" *[survey]*. Unmeasured. News dated up to 14 Oct *[survey]*. |
| 7 | Rate limits | None stated; the terms ban "bulk requests", with no number. |
| 8 | Independence | One-person project, so a second reading of the client at best (survey R1). |

**Mirror dbaion2.online.** Its footer says "If the site does not open, use the mirror" and the terms contact is
`info@dbaion2.online`, so it is the same operator and content *[fetched on .ru]*. I did **not** request `.online`
(robots.txt or terms), to avoid touching a site that bans automation. *[inferred]* the same terms and verdict apply; the
owner can confirm with one look at `dbaion2.online/en/rules/`.

**Verdict: reject for sessions (tier 1).** The owner may open single pages by hand to confirm one fact at a time and link
to the page; the owner must not copy tables or build a data set from it (§5 forbids it even by small parts). Written
permission would change this; the survey's earlier T4/T5/Decision 6 ("use as a scripted third source if the terms allow")
are answered: **they do not allow it.**

### 3.2 aion2hub.com

| # | Check | Result |
|---|---|---|
| 1 | Terms / robots | robots.txt *[fetched]*: `Allow: /`, plus `Allow: /api/icon/`, `/api/skill-icon/`, `Disallow: /api/`, `/_next/static/media/`. No AI agent named. **No terms page found**: the home page footer has none (only "unofficial fan-made companion. Not affiliated with NCSOFT. AION is a trademark of NCSOFT."), and `/terms`, `/privacy`, `/privacy-policy`, `/legal`, `/about` all return 404 *[fetched]*. **Tier 3** (no restriction), with unknown reuse rights: facts only, credit link, no tables, no images. The site runs Google Analytics but publishes no privacy page; that is its problem, but one more sign of an informal operator. |
| 2 | Honest access | No challenge; every request returned 200 (or a plain 404 for guessed paths). I never touched `/api/`. |
| 3 | Data origin | Class page: "Core skill list — 26 active and 10 passive skills — from **Global data (Launch Scale Test client, 2026-09-19)**", plus 11 more active skills from "Korea/Taiwan data (client v110, 2026-09-09) … Not yet verified against the Global client". Leveling guides: hand-written, with "Levels are the game's recommended level for each step". Maps page: Eltnen, Morheim, Chaotic Middle Reshanta "are Korea/Taiwan maps … not in the Global client as of 2026-09-19". Labels its regions better than most sites. |
| 4 | Build shown | No build number; dates only: **2026-09-19, "Launch Scale Test client"**. Global launch was 5 Oct 2026 *[survey]*, so this snapshot **predates launch**. Metabot shows `0.0.4387.0`; no mapping between the two. |
| 5 | Agreement test | §4. **No contradiction on the comparable facts**; most of our fact types (skill levels, specialties, zones) are not on the site. |
| 6 | Update speed | All four Asmodian leveling guides say "Last updated September 19, 2026", 25 days before this check and before launch. The Item DB shows "Global 9,450 / Korea/Taiwan 3,689" counts. **Slow or stale** *[inferred]*; measure at the next patch (T2). |
| 7 | Rate limits | None stated, none in robots.txt. We use 12 req/min. |
| 8 | Independence | Unknown operator ("AION2 Hub", DPS meter linked to aionflex.gg). Same client family as Metabot, so agreement proves little (R1). Coverage is a **guide**, not a quest database: no quest pages, no prerequisites, no coordinates. |

**Verdict: approve for spot checks, weak corroboration only.** Use it for: story-quest *order and recommended level*
(the per-band checklists), Sealed Dungeon ("hideout") level bands, and the Global vs KR/TW label on skills. Never use it
for: prerequisites, unlock levels (§4.3 shows it is off by one on Stigmas), specialties or locations. Facts from it carry
the label "single source, pre-launch client" unless a second source confirms.

## 4. Agreement test (14 Oct 2026)

Reference reads: Metabot pages fetched today, build `0.0.4387.0` on every page. **Caution for 4.1 to 4.3:** our values
were extracted from Metabot (their `src` fields), so a Metabot match is a regression check on our data (no drift since 12 Oct,
no transcription error), not independent evidence. The independent signal is aion2hub's column; dbaion2 is not run.

### 4.1 The 15 facts

| # | Fact (ours) | Metabot today | aion2hub | dbaion2 |
|---|---|---|---|---|
| 1 | Preparations for Restoration (Lv 27) → A Collective Effort | Match: "Rec. level 27 … follows Striving for Coexistence and leads into A Collective Effort" | Match: both listed in order, Lv 27 / 27 | not run |
| 2 | Land of Rifts (29) → Dying Light | Match: follows A Collective Effort, leads into Dying Light, Lv 29 | Match: Lv 29, then Dying Light Lv 30 | not run |
| 3 | Canyon's Secret (30) → Bitter Reality (32) | Match: follows The Past Revealed, leads into Bitter Reality, Lv 30 | Match: Lv 30, then Bitter Reality Lv 32 | not run |
| 4 | Mirror of Greed (37) → Fafnite's Whereabouts (40) | Match: follows An Ill Fate's Resolution, leads into Fafnite's Whereabouts, Lv 37 | Match: Lv 37, then Fafnite's Whereabouts Lv 40 | not run |
| 5 | Daybreak Society (41) → Daybreak Society Rescue Operation (41) | Match: follows Symbol of Liberation, leads into Rescue Operation, Lv 41 | Match: Lv 41 / 41 | not run |
| 6 | Quick Slice learned Lv 1 | Match ("unlocks at level 1") | n/a (names only) | not run |
| 7 | Heart Gore Lv 4 | Match | n/a | not run |
| 8 | Flash Slice Lv 8 | Match | n/a | not run |
| 9 | Insignia Explosion Lv 14 | Match | n/a | not run |
| 10 | Determination (passive) Lv 25 | Match | n/a | not run |
| 11 | Heart Gore specialty choices at skill Lv 8/8/8/12/16 | Match: five variants "requires skill level" 8, 8, 8, 12, 16 | n/a | not run |
| 12 | Flash Slice specialty choices 8/8/8/12/16 | Match (same ladder on Quick Slice and Insignia Explosion too) | n/a | not run |
| 13 | Abandoned One's Grave: Sealed Dungeon Lv 10, zone Nameless Cemetery | Match: "Lv. 10 · Altgard", entrance "Nameless Cemetery on the Altgard map" | Level match (listed among the Lv 10 hideouts); no zone given | not run |
| 14 | Closed Hideout: Lv 20, zone Uruthumheim | Match: "Lv. 20", entrance "Uruthumheim" | Level match (Lv 20 list); no zone | not run |
| 15 | Place of Rest: Lv 35, zone Black Claw Village | Match: "Lv. 35", entrance "Black Claw Village" | Level match (Lv 35 list); no zone | not run |

**Result.** Metabot 15/15 match (regression only). aion2hub: **8 of 15 comparable, 8 of 8 match (facts 1 to 5 and the levels in 13 to 15); 7
not available (skill levels, specialties, zones).** Mismatches: **none in the 15.** dbaion2: 0 of 15 run.

### 4.2 Wider comparisons that cost no extra requests

All from pages already fetched:

- **Whole story chain.** Our `story.json` + `story-40-45.json` have 51 entries; 43 carry a level. All 51 exist in the hub's Asmodian checklists (checked by name). **0 level mismatches
  on the 43, and 42 of 42 `next` links are adjacent in the hub's list order** (the hub's list is an order, not a
  prerequisite graph, so this supports "linear chain" and nothing more).
- **Sealed Dungeon bands.** All 11 entries in `dungeons.json` sit in the same level band as the hub's hideout lists (10: Abandoned One's
  Grave, Lost Ruins; 15: Fafnite Storage Room; 20: Closed Hideout; 25: Twisted Pit; 30: Library of Wisdom, Dratona
  Assembly Area; 35: Place of Rest, Odylium Marauder Den; 40: Ascetic's Cave, Den of Exiles). 11/11. The hub lists 13 at Lv 10, so
  our file is a subset by design (my reading; not checked against the guide's selection rule).
- **Skill names and order.** The hub's core Assassin list (12 actives through Defiance, 10 passives through Determination)
  has the same names in the same order as our unlock-ordered `fullSkillList`. Order agreement is consistent with our
  levels but is not a level check.
- **Hub-only quests.** Beyond our data it lists "A Collective Effort" (Lv 27, we hold it without a level), **"Daeva
  Trapped in a Nightmare" (Lv 45)** and "Waiting for the Next Journey" (Lv 46). Metabot confirms both: "Daeva Trapped in a Nightmare
  … Episode · Asmodian · Lv. 45 … follows Forgotten Commander and leads into Waiting for the Next Journey". This is
  the known gap in `data-research.md`; the hub is a second pointer to it, not new information. (Also checked: the hub's "Spread
  Your Wings, Lv 6" matches Metabot, Episode Lv 6; it is the story quest, a different thing from our Ascension-gauge
  quests.)

### 4.3 Mismatches found, and which side looks right

| Item | Ours / Metabot | aion2hub | Which looks right |
|---|---|---|---|
| **Stigmas unlock** | Lv 22 (slot 1), then 27 / 32 / 37. Metabot content-unlocks today: "Lv. 22 Stigma slot 1, Lv. 27 slot 2, Lv. 32 slot 3, Lv. 37 slot 4"; our `stigmaRules` cites four more sources | "Stigmas open up at level 23 … for both factions" (10–25 guide, FAQ) | **Ours.** The hub is a single source on a pre-launch snapshot and off by one *[inferred]*. Settles in game: owner screen at Lv 22 vs 23. |
| **Daevanion board unlock** | Metabot content-unlocks: opens when you finish "Urgent Pursuit" (Asmodian), not at a level | "Daevanion board … Lv 12" (10–25 guide, FAQ); the hub's own list puts Urgent Pursuit at Lv 13 | **Metabot.** The hub's Lv 12 is a rounding of the quest's neighbourhood; our data gates on the quest. |

Neither is in the 15 and neither changes our data. Both show what the hub is: good at order, loose at unlock rules.

### 4.4 Hand-check sheet for the owner (dbaion2 and the rest)

Open the page for each, in a browser, one fact at a time; do not copy tables. If you want it graded, tell me which of
these disagree. dbaion2's menu has Quests, Dungeons and Skill calculator sections.

1. The five quest pairs in rows 1–5 above: prerequisite and level.
2. Quick Slice 1, Heart Gore 4, Flash Slice 8, Insignia Explosion 14, Determination 25.
3. Specialty choices Lv 8/8/8/12/16 on one skill.
4. Entrances of Abandoned One's Grave (Nameless Cemetery), Closed Hideout (Uruthumheim), Place of Rest (Black Claw Village).
5. Stigma unlock: Lv 22 or 23 (also the in-game question in 4.3).

## 5. Locations (owner F15)

Question: which permitted sources give **zone and map coordinates** for quest givers and turn-ins, Sealed Dungeons and
strongholds, and can we derive zone adjacency and distances? All of this is from Metabot pages already allowed; the
tests below used only the HTML those pages return, not `/api/` (robots.txt disallows it) and not tile images.

### 5.1 Coverage by source

| Source | Quest giver / turn-in | Sealed Dungeons | Strongholds | Notes |
|---|---|---|---|---|
| **Metabot** *[fetched]* | **Yes.** Each quest page lists "region · Nearest Kibelisk: name · N m" for the giver (S), each step and the turn-in (T), and embeds **map coordinates** for them (§5.2) | **Yes.** Dungeon page: type, level, region and the entrance zone, with a link to the zone page; entrance coordinates (§5.2) | **Yes.** The `map/altgard/strongholds` table gives, for all 15: type, zone, level range, nearest Kibelisk and distance; quest page gives coordinates | Interactive map (`/map/altgard?focus=…`) is client-side and shows the same data; its marker API is disallowed. Zone pages (333 zones) give region, type, level range, monster/NPC/POI lists |
| **aion2hub.com** *[fetched]* | No quest layer. Leveling guides give the giver NPC and a place name in words ("Talk to Nemon at the Collapsed Chasm"); no coordinates | Names and level bands only, no entrance | None | Interactive map layers are Locations, Collectibles, Gathering (cubes, monoliths, teleports, kisks, rifts); loads client-side from its `/api/` |
| **dbaion2.ru / .online** | Has maps *[survey]* | Has dungeons *[survey]* | n/a | **Tier 1: not read.** Owner hand check only |
| **aion2.th.gl** | Yes, 25,590 locations on 73 maps *[survey]* | Probably | Probably | **Excluded** (robots.txt excludes AI agents). Not fetched; owner hand check only |
| **interactivemap.app**, **gamers4.life**, **aion2.app**, **aion2.gaming.tools** | Map data *[survey]* | n/a | n/a | interactivemap.app names AI agents (closed); gamers4.life and aion2.app terms ban bots; gaming.tools serves a Cloudflare challenge to scripts. Owner hand check only |

Coverage on the quest pages I sampled (9): giver and turn-in coordinates exist on every Episode quest with a giver
(Preparations for Restoration, Land of Rifts, Canyon's Secret, Mirror of Greed, Daybreak Society). The exceptions are
explained by the quests: "Daeva Trapped in a Nightmare" and "Spread Your Wings" have **no giver point** (they start
automatically), and Exploration quests (the Sealed Dungeon and stronghold quests) have one step point and no giver or
turn-in. On Preparations for Restoration and Daybreak Society, **6 of 8 steps are placed on the map**; the other two
are text only ("via Selvis" calls). 41 of the 58 quests in our `locations.json` have `kib: null` today; I did not test
whether Metabot has points for them (proposed test L1 below).

### 5.2 Coordinate format (Metabot)

- The page's embedded data lists each marker as `{"id":"step-start"|"step-N"|"step-end", "kind":"start"|"step"|"end", "map":"World_D_A", "goals":[{"pts":[[x,y]]}], "kisk":{"d":133,"name":"Nornir Assembly"}}`.
  Example, Preparations for Restoration: giver (4982, 3811), step 2 (4997, 3852), turn-in (4975, 3476), all on map
  `World_D_A`, `kisk` Nornir Assembly at 133 m for the giver.
- Coordinates are **integer pixels on an 8192 × 8192 world image** (`"size":8192`, `"maxZoom":5`) for the map named
  by `map`. Altgard uses `World_D_A`; the starter area ("Spread Your Wings") uses **`World_D_Starter`**, a separate pixel space, so
  distances across maps are undefined.
- The rendered map on quest, dungeon and zone pages also carries percentages inside a cropped tile view. I decoded them
  back to pixels with `X = tileX·S − left%·W` (S = 8192 / 2^zoom, tile = 40 % of view width, 71.1 % of view height) and
  **spot-verified it**: on Preparations for Restoration two step markers decode to within 0.3 and 3.4 px of the embedded
  integer points (the page draws only some markers as dots; the giver, turn-in and steps 2–5 are not among them, so
  only those two could be compared), and the Abandoned One's Grave entrance decodes to exactly (2374, 3324), the same
  point as its Exploration quest step. The scale fit in §5.3 also depends on the decoded zone-page dots, which supports it.
- So: Sealed Dungeon entrance = the dungeon page's POI dot = the Exploration quest step (2374, 3324 for Abandoned One's Grave;
  nearest Kibelisk Neglected Crematorium 189 m, matching our `dungeons.json`). Stronghold example: Blades Temporary
  Outpost (3161, 4364), Moslan Forest Cliff 160 m, the same 160 m we hold as the step distance.

### 5.3 Can we derive adjacency and distances?

- **Distances: yes, straight-line only, within one map.** The "N m" is, by my fit, the plain pixel distance: using the Nornir
  Assembly Kibelisk position (the one POI dot on the zone page whose distances to the five Preparations for Restoration
  points are all consistent) the ratio metres per pixel is **0.996 ± 0.3 %** across five points (the next-best dot is
  five times worse). *[inferred]* **1 px ≈ 1 m**, from one Kibelisk in one region. Not path length: no roads, cliffs or
  flight.
- **Travel model: feasible.** Every placed point already has its nearest Kibelisk and distance, and Kibelisk positions are
  recoverable as POI dots on zone pages. A "fastest route" is therefore "teleport to a Kibelisk, then run N m".
- **Zone adjacency: not given, derivable only roughly.** No page states neighbours, and the zone outlines drawn on the
  interactive map come from the client-side layer. The SSR zone page does give hundreds of spawn/POI points per zone
  (Nameless Cemetery: 380 monster, 156 gathering, 51 POI; monster extent x 2399–2773, y 2857–3404), so a hull per zone and an
  adjacency by hull gap is possible, but it would be an approximation: gaps and overlaps are only as good as the spawn spread.
  The Altgard page also lists 52 field + 48 village zones with level ranges, which gives a level-based sanity check.
- **Zone for a placed point:** from the quest page's region and the zone link on the dungeon page; the quest page does not name a zone for
  a step, only the region and the nearest Kibelisk. Zone for a coordinate would have to come from the hulls.

### 5.4 Proposed tests

- **L1. Coverage.** Take the 41 quests in `locations.json` with `kib: null`; fetch each Metabot quest page (≤12/min, about 8
  minutes) and count those with a giver and turn-in point. Pass: ≥ 80 % have points; the rest are auto-start quests.
- **L2. Scale.** Repeat the Kibelisk fit in a second region (Black Claw Village or Idun's Lake) on any quest with 4+
  points on one Kibelisk. Pass: ratio within 2 % of 1.0.
- **L3. Adjacency.** Build the hull for the 10 zones around Nornir Assembly from their zone pages and compare the
  neighbour list with the owner's in-game map. Pass: the owner agrees with ≥ 8 of 10.
- **L4. Owner hand check (th.gl, gaming.tools).** Three points: Preparations for Restoration giver (4982, 3811) =
  Varron, Nornir Assembly; Abandoned One's Grave entrance (2374, 3324); Blades Temporary Outpost (3161, 4364). Compare the
  position by eye on those sites' maps. Tells us whether a second map source is worth the owner's time.
- **L5. Metabot terms for coordinates.** The "Data Usage & Attribution" clause covers "any use of MetaBot.GG data": credit
  with a dofollow link to the specific page. Coordinates are facts, and we would take them per quest with that link. Ask the
  owner whether to ask Metabot for explicit permission, since this is the first time we would use their map compilation
  rather than single facts (survey R2).

## 6. Requests made, deviations, and what I did not do

- **Requests (42, all one at a time, ≥ 6 s apart per host, honest User-Agent `DaevaCompanionResearch/0.1 (+https://daevacompanion.com; research)`, cached, no 403/429/challenge):**
  Metabot 23 (robots.txt, 5 skill, 9 quest, 3 dungeon, 2 zone, 2 map, content-unlocks), aion2hub.com 15 (robots.txt, home, a guess at
  `/terms`, `/privacy`, `/legal`, `/about`, `/privacy-policy` (all 404), class page, 4 leveling guides, database class view, maps,
  world-objects), dbaion2.ru 4 (robots.txt, `/en/` for the footer link, `/en/terms/` (404, a guess), `/en/rules/`).
- **One order slip, reported as in the survey's §10.3.** For dbaion2.ru I fetched the **home page before reading its terms**, because the
  terms URL is only linked from the footer. After the terms showed a ban on automation, I stopped: no content page, no
  quest or item page, no `.online` request. The four requests were one page each, nothing was kept except what is quoted
  here from the terms. The checklist (§2, item 1) now says to fetch only the home page to find the link, and the
  survey's §7 item 3 should say the same.
- **Not done:** no aion2.th.gl request (robots.txt excludes AI agents); no gaming.tools, interactivemap.app, gamers4.life
  or aion2.app request; no `/api/` request anywhere; no tile or image download; nothing from thegameswiki, Wikily or Game8.
- **Not measured:** update speed at a patch (needs a patch day, survey T2); the Metabot-to-hub build mapping (T1).
- **Cache** lived in the session scratchpad and is not committed.

## 7. Decisions for the owner

1. **dbaion2.ru / .online: reject for sessions.** Accept, or write to `info@dbaion2.online` for permission? My recommendation:
   accept the rejection; permission for a third-party data set is unlikely and its data adds nothing we have not got from Metabot.
2. **aion2hub.com: approve for spot checks and add `aion2hub.com` to the "Daeva Companion" environment?** Recommendation: yes,
   low weight, every fact from it labelled "single source, pre-launch client" unless confirmed. If you would rather not, the
   loss is small: its only unique value is a second pointer to the Lv 45 story quests.
3. **Metabot coordinates.** OK to use coordinates (with the page link) from Metabot's quest pages for the 0.3 location work, and do you want me to ask
   Metabot first (L5)?
4. **Run L1 to L3** (about an hour of fetching, all on Metabot) so F15 has numbers before the 0.3 design?
5. **Owner in-game check:** Stigma unlock at Lv 22 or 23 (§4.3).
6. **Policy line to adopt:** "Terms that ban bots, scripts or automated data collection = tier 1, owner hand reads only, even when robots.txt allows" (the survey's Decision 5). This report shows the case again (dbaion2); with it, gamers4.life, aion2.app and dbaion2.ru are all excluded for the same reason.
