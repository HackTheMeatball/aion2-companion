# Location coverage on Metabot (research, 2026-10-14)

Question: for every regional quest, story quest, Sealed Dungeon and stronghold in our data, does Metabot give a map
point, how close is the nearest Kibelisk, is 1 px ≈ 1 m, and what does this mean for "teleport vs run" in 0.3?
Research only: no app code or app data changed. Per-item results: `data/research/locations-metabot-2026-10.csv`
(135 rows, every row cites its Metabot page). Recovered Kibelisk positions:
`data/research/kibelisk-positions-metabot-2026-10.csv` (60 rows). Scripts: `data/research/scripts-2026-10/`.
Request log: `data/research/locations-metabot-2026-10.requests.log`.

## 1. Result in five lines

1. **Coverage is near-complete: 134 of 135 items have a map point** (134 with a giver or entrance point). The one without is the auto-start story quest *A Daeva Dreaming Anew* (no giver point; it has a turn-in point).
2. **Scale: 1 px ≈ 1 m holds** on 13 zone groups / 20 well-conditioned Kibelisk fits: 0.9927–1.0010 m/px, median 0.9966, RMS residual 0.2–0.4 m. The 0.3 % offset from 1.000 is explained by Metabot **truncating** distances to whole metres (fit with +0.5 m: median 0.9995; §4) *[inferred]*.
3. **Kibelisk positions are recoverable, not published.** Metabot's quest pages give only "name · N m" for a Kibelisk, never its coordinates. By trilateration from markers I recovered **39 of 60** Kibelisks that have at least one single-point marker (20 high, 10 medium, 9 low confidence); 21 have fewer than 3 single-point markers.
4. **Most hops are short; the exceptions are entrances.** Quest givers are a median 32 m from a Kibelisk, turn-ins 48 m, steps 127 m. Sealed Dungeon and stronghold entrances are a median **185 m** (34–471 m), so they are run, not teleported.
5. **Our `locations.json` can fill its gaps from these pages**: 32 of 58 regional-quest givers, 18 turn-ins, 5 story givers and 6 story turn-ins have no Kibelisk in our data today and have both name and distance on Metabot.

## 2. Method and what was fetched

- **Policy check first.** robots.txt (`Allow: /`, `Disallow: /api/`, `/private/`, profile paths) and the Terms of Service
  (`/en/legal/terms-of-service`, section "Data Usage & Attribution (AI Agents & Automated Tools)": reuse allowed with a dofollow credit link to
  MetaBot.GG, no misrepresentation or implied endorsement, "reasonable request rate"). No AI opt-out, so the plain 12 requests/min tier applies. Not fetched: `/api/`, tile images, th.gl, any other site.
- **User-Agent** `DaevaCompanionResearch/0.1 (+https://daevacompanion.com)`; one request at a time; every page cached in the scratch folder and fetched once.
- **148 requests in 16.5 minutes (20:18–20:35 UTC): 147 × HTTP 200, 1 × timeout (no response; retried once after 20 s, then 200).** No 403, 429 or challenge. The throttle script enforced ≥ 6 s between request *starts* and ran strictly serially. The log timestamps are completion times, so some gaps read as 0–3 s when a response was slow; peak was 11 completions in one clock minute.
- **Pages:** home (to find the Terms link), Terms, 128 pages from our own `src`/`kibSrc` fields, and 17 extra Metabot quest pages where our data cites a non-Metabot source or has no Exploration-quest link: 10 regional quests (data cites shugo.gg, wikily.gg, aion2.gaming.tools) and 7 Sealed Dungeon Exploration quests (slug guessed = dungeon slug; Ascetic's Cave `ascetics-cave`). All 17 slugs resolved and the page titles match.
- **Extraction.** Pages are server-rendered Next.js; the point list is in the embedded `"spots"` array (Metabot's own marker data, §5.2 of the vetting note): `id` (step-start / step-N / step-end), `map`, `goals[].pts` (x,y in px on an 8192 × 8192 map) and `kisk` (`d` m, `name`). For a step with several points I use Metabot's `center`; for giver/turn-in the single point. Giver marked **S·T** means the page puts giver and turn-in on the same marker. The Sealed Dungeon pages themselves carry **no** coordinates; the entrance is the dungeon's Exploration-quest step (as the vetting note found for Abandoned One's Grave).
- **Not done:** no zone-page POI decoding (extra fetches, and the percentage decoding is the weakest part of the vetting method) and no tile or image use.

## 3. Totals by type

| Type | Items | Giver / entrance point | Turn-in point | Giver = turn-in (S·T) | Step points | Notes |
|---|--:|--:|--:|--:|--:|---|
| Regional quest | 58 | 58 | 58 | 29 | 204 | 7 Spacetime Rift quests have some steps on `World_L_A`; 10 pages found by slug, not by our link |
| Story quest | 51 | 50 | 51 | 8 | 185 | *A Daeva Dreaming Anew*: no giver point. *Forgotten Commander*: turn-in is on map `Abyss_Reshanta_A` (different pixel space) |
| Sealed Dungeon | 11 | 11 | n/a | n/a | 11 | entrance = Exploration-quest step; dungeon page has no point |
| Stronghold | 15 | 15 | n/a | n/a | 15 | entrance = Exploration-quest step |
| **Total** | **135** | **134** | | | | |

Maps: 127 items only on `World_D_A` (Altgard). Cross-map distances are undefined; the starter map `World_D_Starter` did not appear.

## 4. Scale check (1 px ≈ 1 m)

**Method.** Metabot gives only the distance to a Kibelisk, not its position. For each Kibelisk I took every *single-point* `World_D_A` marker that cites it (deduplicated by position), then fitted the Kibelisk position K and a scale s by least squares to `s · |p − K| = d`. With ≥ 5 markers at varied distances and non-collinear geometry, s is determined by the data alone (no assumed K); the vetting note's version needed one independent dot. **Well-conditioned** = ≥ 5 markers and minor/major axis ratio of the marker cloud ≥ 0.2. 20 Kibelisks qualify.

Ratio = stated metres ÷ pixel distance. Zone = majority `zone` of the quests in our data that cite the Kibelisk (approximate; it is not Metabot's zone for the Kibelisk).

| Zone | Kibelisks fitted | Markers | Ratio m/px (per Kibelisk) | Median | RMS residual (m) |
|---|--:|--:|---|--:|---|
| Basfelt Ruins | 1 | 12 | Graverobber Campsite 0.9936 | 0.9936 | 0.4 |
| Battlescar Mound | 2 | 19 | Briskwind Shelter 0.9987, Hidden Cave 0.9978 | 0.9983 | 0.27, 0.42 |
| Dredgion Crash Site | 1 | 6 | Mire Campsite 0.9942 | 0.9942 | 0.41 |
| Eastern Gribade Highland | 2 | 17 | Amunta's Hideout 1.0007, Kumrica's Cellar 0.9960 | 0.9983 | 0.32, 0.22 |
| Fafnite Deposit | 1 | 15 | Steel Hammer Merchants HQ 0.9968 | 0.9968 | 0.37 |
| Impetusium Square | 2 | 16 | Collapsed Hall of Fame 0.9955, Outskirts Stall 0.9980 | 0.9968 | 0.4, 0.2 |
| Moslan Forest | 3 | 28 | Collapsed Chasm 0.9977, Forest Hideout 0.9970, Odar's Shade 0.9948 | 0.9970 | 0.36, 0.44, 0.43 |
| Nornir Assembly | 2 | 32 | Impetusium Lower Path 0.9959, Nornir Assembly 0.9962 | 0.9960 | 0.18, 0.37 |
| Safe Haven | 1 | 12 | Safe Haven 0.9952 | 0.9952 | 0.25 |
| Sanctum Outpost | 1 | 6 | Fang Hideout 1.0010 | 1.0010 | 0.19 |
| Southern Gribade Highland | 2 | 17 | Steel Hammer Temporary Trading Post 0.9958, Zemurru's Tomb 0.9927 | 0.9943 | 0.21, 0.25 |
| Uruthumheim | 1 | 9 | Victorious Daeva's Statue 0.9978 | 0.9978 | 0.33 |
| Western Gribade Highland | 1 | 13 | Abandoned Campsite 0.9969 | 0.9969 | 0.36 |

- **All 20 fits: mean 0.9966, median 0.9965, range 0.9927–1.0010; residuals ≤ 1.0 m.** 13 zone groups, well over the 3 required. Largest single fit: Nornir Assembly, 24 markers, s = 0.9962 (the vetting note's 0.996 for the same Kibelisk, now confirmed by an independent fit on more points).
- **Why 0.9966 and not 1.000** *[inferred, tested]*: if Metabot truncates `d` to whole metres, the true mean is `d + 0.5`. Refitting with `d + 0.5`: median s = 0.9995 and the fixed-s=1 RMS drops from 0.474 to 0.404 m. With `d + 1.0` it is worse (0.572). So truncation fits better than rounding; the difference is ≤ 0.5 m per hop and irrelevant for routing.
- **Not independent of the fit.** Residuals ≤ 1 m over 5–24 markers at 10–1000 m (Kumrica's Cellar reaches 1002 m, s = 0.996) show the distances *are* Euclidean pixel distances on this map, with no visible altitude or path-length component. It does not show that the pixel grid equals game metres in an absolute sense; the stated "m" is Metabot's unit and that is the only one we need.
- **Ill-conditioned fits are excluded** (e.g. Faded Stump: 5 markers on an almost straight line, free-s fit gives 1.088, meaningless; its position has a mirror ambiguity).

## 5. Kibelisk positions recovered (World_D_A pixels)

Derived, not published by Metabot, and **not an in-game fact**. Confidence: *high* = ≥ 5 markers and well spread (position error ≲ 1 px); *medium* = 3–4 markers or spread 0.1–0.2 (determined, wider error); *low* = near-collinear markers (the position can be mirrored across the line of markers; do not use without a check). Zone as in §4.

| Zone (our data) | Kibelisk | x | y | Markers | RMS (m) | Confidence |
|---|---|--:|--:|--:|--:|---|
| (story only) | Alert Observation Post |  |  | 1 |  | not recoverable (<3 single-point markers) |
| (story only) | Garden of the Illusion God East Observatory |  |  | 1 |  | not recoverable (<3 single-point markers) |
| (story only) | Gribade Highland Crossroad |  |  | 2 |  | not recoverable (<3 single-point markers) |
| (story only) | Idun's Lake |  |  | 2 |  | not recoverable (<3 single-point markers) |
| (story only) | Kraka Footpath Wastewater Downstream |  |  | 1 |  | not recoverable (<3 single-point markers) |
| (story only) | Secret Rendezvous Point |  |  | 2 |  | not recoverable (<3 single-point markers) |
| (story only) | Uruthumheim Cliff |  |  | 2 |  | not recoverable (<3 single-point markers) |
| Basfelt Ruins | Basfelt Ruins Cliff |  |  | 2 |  | not recoverable (<3 single-point markers) |
| Basfelt Ruins | Fissure Cave | 6001 | 3171 | 4 | 0.2 | low (near-collinear: mirror ambiguity) |
| Basfelt Ruins | Graverobber Campsite | 5509 | 3146 | 12 | 0.4 | high |
| Basfelt Ruins | Guide's Dwelling |  |  | 2 |  | not recoverable (<3 single-point markers) |
| Basfelt Ruins | Shulak Street Stall | 5408 | 3467 | 4 | 0.28 | medium |
| Battlescar Mound | Basfelt Waterfall | 5469 | 2767 | 6 | 0.1 | medium |
| Battlescar Mound | Briskwind Shelter | 4555 | 2913 | 9 | 0.27 | high |
| Battlescar Mound | Dranactus Shore | 5068 | 2269 | 4 | 0.16 | medium |
| Battlescar Mound | Hidden Cave | 4712 | 2106 | 10 | 0.42 | high |
| Dranactus | Safe Haven Cliff | 3671 | 2586 | 8 | 0.27 | low (near-collinear: mirror ambiguity) |
| Dredgion Crash Site | Galorik's Inspection Area |  |  | 1 |  | not recoverable (<3 single-point markers) |
| Dredgion Crash Site | Mire Campsite | 3324 | 3681 | 6 | 0.41 | high |
| Eastern Gribade Highland | Amunta's Hideout | 5840 | 4724 | 9 | 0.32 | high |
| Eastern Gribade Highland | Eastern Gribade Highland Tail Island |  |  | 2 |  | not recoverable (<3 single-point markers) |
| Eastern Gribade Highland | Kumrica's Cellar | 4924 | 5627 | 8 | 0.22 | high |
| Fafnite Deposit | Steel Hammer Merchants HQ | 5752 | 4154 | 15 | 0.37 | high |
| Fafnite Deposit | Steel Hammer Workcamp | 5347 | 4576 | 5 | 0.22 | medium |
| Impetusium Square | Battlescar Mound Clifftop |  |  | 2 |  | not recoverable (<3 single-point markers) |
| Impetusium Square | Collapsed Hall of Fame | 5449 | 5725 | 10 | 0.4 | high |
| Impetusium Square | Minushan Site |  |  | 2 |  | not recoverable (<3 single-point markers) |
| Impetusium Square | Outskirts Stall | 5352 | 5867 | 6 | 0.2 | high |
| Mahindel River | Mahindel Cliff |  |  | 2 |  | not recoverable (<3 single-point markers) |
| Mahindel River | Moslan Forest Cliff | 3171 | 4204 | 4 | 0.1 | low (near-collinear: mirror ambiguity) |
| Moslan Forest | Collapsed Chasm | 3534 | 4340 | 6 | 0.36 | high |
| Moslan Forest | Elim's Rest |  |  | 2 |  | not recoverable (<3 single-point markers) |
| Moslan Forest | Forest Hideout | 3979 | 4249 | 5 | 0.44 | high |
| Moslan Forest | Moslan Forest Dry Shade | 3695 | 4408 | 3 | 0.03 | medium |
| Moslan Forest | Odar's Shade | 3598 | 4102 | 17 | 0.43 | high |
| Nameless Cemetery | Gravekeeper Camp | 2572 | 3320 | 3 | 0.18 | low (near-collinear: mirror ambiguity) |
| Nameless Cemetery | Neglected Crematorium | 2381 | 3134 | 4 | 0.76 | medium |
| Nornir Assembly | Impetusium Lower Path | 5195 | 6021 | 8 | 0.18 | high |
| Nornir Assembly | Nornir Assembly | 4854 | 3849 | 24 | 0.37 | high |
| Purifying Forest | Faded Stump | 4714 | 3204 | 5 | 0.32 | low (near-collinear: mirror ambiguity) |
| Purifying Forest | Guide Rest Stop | 4776 | 3451 | 4 | 0.21 | medium |
| Purifying Forest | Healing Spring | 4280 | 3514 | 13 | 0.38 | medium |
| Purifying Forest | Purifying Forest Coastal Cliff | 5060 | 3501 | 3 | 0.49 | medium |
| Purifying Forest | Purifying Forest Sunny Hill | 5184 | 3267 | 4 | 0.14 | low (near-collinear: mirror ambiguity) |
| Quai Campsite | Quai Campsite |  |  | 2 |  | not recoverable (<3 single-point markers) |
| Safe Haven | Creion Campsite |  |  | 2 |  | not recoverable (<3 single-point markers) |
| Safe Haven | Safe Haven | 3196 | 2852 | 12 | 0.25 | high |
| Safe Haven | Temporary Investigation Base | 3485 | 3270 | 3 | 0.28 | low (near-collinear: mirror ambiguity) |
| Sanctum Outpost | Fang Hideout | 2687 | 3571 | 6 | 0.19 | high |
| Sanctum Outpost | Remote Island |  |  | 1 |  | not recoverable (<3 single-point markers) |
| Sanctum Outpost | Temporary Retreat | 2570 | 3964 | 4 | 0.28 | low (near-collinear: mirror ambiguity) |
| Silent Hill | Silent Hill Mushroom Rock |  |  | 1 |  | not recoverable (<3 single-point markers) |
| Southern Gribade Highland | Steel Hammer Temporary Trading Post | 5721 | 5205 | 10 | 0.21 | high |
| Southern Gribade Highland | Zemurru's Tomb | 5396 | 5295 | 7 | 0.25 | high |
| Tranein Highland | Beneath the Tranein Highland Bridge |  |  | 1 |  | not recoverable (<3 single-point markers) |
| Tranein Highland | Watcher's Tent |  |  | 2 |  | not recoverable (<3 single-point markers) |
| Uruthumheim | Abandoned Site | 4085 | 4047 | 4 | 0.29 | medium |
| Uruthumheim | Victorious Daeva's Statue | 4215 | 3649 | 9 | 0.33 | high |
| Western Gribade Highland | Abandoned Campsite | 5158 | 4865 | 13 | 0.36 | high |
| Western Gribade Highland | Eastern Gribade Highland Cliff | 5858 | 4944 | 3 | 0.06 | low (near-collinear: mirror ambiguity) |

Self-consistency only: Nornir Assembly (4854, 3849) is 133.8 px from the Preparations for Restoration giver (4982, 3811), stated 133 m, but that point went into the fit. An independent check needs either the zone-page POI dot (vetting §5.2 method) or the owner's map.

## 6. Gaps and disagreements with our data

**Gaps in Metabot**
- 1 item with no giver point: *A Daeva Dreaming Anew* (auto-start). Turn-in (4520, 2878), Briskwind Shelter 49 m.
- Giver and turn-in on the same marker (S·T): 29 regional and 8 story quests. Expected, not a gap.
- Story steps written as "via Selvis" (23 of the 232 step lines in our story data) carry no Kibelisk in our data and, per the vetting note, no marker on the page; I did not count markers per step line, only 185 step markers over the 51 story quests.
- 21 of 60 Kibelisks have < 3 single-point markers, so no position can be recovered from these pages (list in §5).
- Several quests list steps with many points (e.g. 7 for *Shugo-of-All-Trades* step 1); only Metabot's `center` is used.

**Where our current data differs from the Metabot pages**
- **Sealed Dungeons: 6 of 11 distances are rounded in `dungeons.json`** (Ascetic's Cave 160 vs 165, Closed Hideout 100 vs 95, Twisted Pit 240 vs 236, Library of Wisdom 140 vs 137, Place of Rest 100 vs 99, Den of Exiles 220 vs 215). The names agree. The Exploration-quest pages give the exact values. Fafnite Storage Room has no Kibelisk in our data; the page gives Fang Hideout 226 m.
- **Strongholds: the Altgard list distance differs from the quest-step distance for 15 of 15, by 1–55 m** (as `strongholds.json` notes already say, e.g. Blades 137 vs 160; Andsha excepted below). Both are Metabot figures. **Andsha Forward Base names a different Kibelisk:** list says Collapsed Hall of Fame 450 m, the quest step says Steel Hammer Temporary Trading Post 466 m. The step marker is the entrance point, so the step figure is the one tied to a position.
- No Kibelisk name or distance for a quest giver or turn-in that we already hold disagreed with its page (0 of 58 regional and 0 of 51 story).

## 7. What this means for "teleport vs run" in 0.3

Model used (a rough one, listed so it can be challenged): consecutive markers on a quest page, in step order, `run = |a − b|` px ≈ m; `teleport = d` of the *target's* nearest Kibelisk (the "teleport to a Kibelisk, then run N m" route of vetting §5.3). Teleport time, cost and cooldown are **not in Metabot's data** and are not modelled. Steps may not be strictly ordered in game.

- **Feasible, with data we can already hold.** 134 of 135 items have a point and a nearest-Kibelisk distance. A per-hop rule needs nothing beyond the CSV.
- **Hops (434 with distinct positions; 18 same-spot repeats excluded):** median run 141 m, p90 736 m, max 3,657 m. In **200 (46 %)** the run is no longer than the target's Kibelisk distance, so teleporting does not help. In **175 (40 %)** teleporting saves more than 50 m, in **111 (26 %)** more than 200 m.
- **Whole quests:** across 101 multi-point quests the sum of "always run" is 122,136 m, and "best of run or teleport per hop" is 36,149 m (≈ 70 % less, an upper bound: it ignores teleport time and cost).
- **Story chains:** all 41 turn-in → next-quest-giver hops (same map) are ≤ 4 m. Within a chain nothing needs travel between quests; only the first giver and the steps need it.
- **Nearest-Kibelisk distance by marker type:** giver median 32 m (72 of 108 ≤ 50 m), turn-in 48 m (39 of 72 ≤ 50 m), step 127 m (p90 270 m, 32 of 415 > 300 m).
- **Entrances break the pattern:** Sealed Dungeons median 165 m (34–394), strongholds 200 m (121–471), 11 of 26 over 200 m. A route should say "teleport to X, run N m", not "teleport".
- **Recommendation for 0.3** *[opinion]*: store per point `{map, x, y, kib, m}` from the CSV, keep the Metabot-stated `m` as the displayed figure (do not display derived positions), and use positions only to decide order (nearest-neighbour hops within a zone). Do not show derived Kibelisk coordinates in the UI before the owner confirms a few in game.

## 8. Assumptions, uncertainty, proposed tests

- **Inferred, not stated:** truncation of `d`; Kibelisk positions; "zone" labels in §4–5 (from our data, not Metabot).
- **Untested:** path length vs straight line (the figure is straight-line only); whether a Kibelisk's displayed "nearest" is nearest by this metric (it fits, since distances are consistent per Kibelisk, but a nearer Kibelisk on another quest could exist; the fits would show it as an outlier and none did).
- **Test T1 (owner, 2 min):** teleport to Neglected Crematorium, run to the Abandoned One's Grave entrance, and compare with 189 m (2374, 3324 vs recovered K 2381, 3134).
- **Test T2:** fetch the Neglected Crematorium and Nornir Assembly zone pages (2 requests) and compare the POI dot to the recovered positions; pass: within 3 px.
- **Test T3:** for the 9 low-confidence Kibelisks, one extra marker off the existing line from another quest resolves the mirror ambiguity.
- **Licensing (open, vetting L5):** coordinates are facts, taken per quest with a dofollow link to that page; derived Kibelisk positions are our computation from many pages. The question of asking Metabot for explicit permission before using their map compilation stands.
- The scratch cache of fetched pages is not committed (page copies are not kept in the repo); everything is reproducible from the logged URLs with `scripts-2026-10/`.
