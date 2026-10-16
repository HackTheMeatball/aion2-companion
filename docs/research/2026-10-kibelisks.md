# Asmodian Kibelisks: reference table for the 0.4 travel advice

Data & Research, 2026-10-15. Branch `research/kibelisks`. Data: `data/research/kibelisks-2026-10.csv` (73 rows). Script: `data/research/scripts-2026-10/kibelisks.py`. Request log: `data/research/kibelisks-2026-10.requests.log`.

## Summary

1. **Count.** Metabot lists **61 Kibelisks in Altgard** (names, zones, level range; source: [Kibelisks in Altgard](https://metabot.gg/en/aion-2/map/altgard/kibelisks), "AION 2 Global client, build 0.0.4387.0") and **3 on the Ishalgen map** ([Ishalgen map](https://metabot.gg/en/aion-2/map/ishalgen) states "3 Kibelisks" but names none). The three names are not on the page; I matched them to the three Ishalgen-zone Kibelisks our quest data cites (Aldelle Village, Witch's Cabin, Abandoned Barracks Site) *[inferred]*. That makes **64 listed**. Another **9** names appear on Metabot quest pages (our data) but not in the Altgard list (§Gaps), so **73 names** in the CSV. 53 of the 73 are the nearest Kibelisk of at least one story-quest point; 20 are not.
2. **The 25 m rule fails 2 of the 5 owner observations, and a third cannot be judged.** Safe Haven is bound at 32 m (the rule says nudge). Galorik's Inspection Area is bound while running to a step whose endpoint is 50 m away (rule says nudge). Aldelle Village and Abandoned Barracks Site agree. Witch's Cabin is inconclusive. Detail in §Owner evidence.
3. **The 25 m line sits inside the observed binding radius** (owner: about 30–40 m). 8 story Kibelisks have a nearest quest point of 29–34 m (Safe Haven 32, Quai Campsite 30, Minushan Site 34, Faded Stump 29, Graverobber Campsite 30, Steel Hammer Merchants HQ 33, Steel Hammer Workcamp 33, Collapsed Hall of Fame 32). Under 25 m all eight are "nudge"; under the owner's own radius they are bound. A further 4 sit at 46–49 m (Galorik's 49, Uruthumheim Cliff 46, Briskwind Shelter 49, Latesran Eastern Root 49).
4. **Metabot publishes no Kibelisk coordinates.** The listing has name, zone and level range only; the map is client-side. The x,y in the CSV are the repo's own trilateration (`kibelisk-positions-metabot-2026-10.csv`, map pixels, about 1 m): 39 of the 64 listed have one, 9 of those low-confidence (†).

## Method

- **Story order** is the `next` chain of `story-quests.json` (86 quests, identical to file order). Within a quest: giver, steps 1…n, turn-in.
- **Points.** Giver and turn-in distances come from `story-quests.json` (`kibelisk`, `meters`). The repo stores **no step distances**, only "(Kibelisk: X)" markers. For step distances I fetched the Metabot quest pages for **17 of the 86 story quests** (the five owner-evidence quests plus the 12 with the most Kibelisks first seen on a step) and read "Nearest Kibelisk: X · N m" per marker with the repo's `extract.py`. Page "Step n" is step n of ours (equal step counts on 16 of 17 pages; "The Being Beneath the Lake" has one extra leading step in ours, "Bind with the Witch's Cabin Kibelisk", which the page shows as the quest start, so it takes the giver distance). The Kibelisk name matched the data's marker in every case (0 mismatches). Giver and turn-in distances on those pages equal the data's.
- **First story point** of a Kibelisk = the earliest point (story order) whose nearest Kibelisk it is. **Class** of that point: `auto-bound` ≤ 25 m, `nudge` 26–150 m, `none` > 150 m, `unknown` when the point is a step on one of the 69 pages not fetched. The CSV also holds `best_known_m` (smallest known story distance), `ever_class` (class of that), `first_autobound` and `first_known_within_150`, because a first point of 183 m says nothing if the next step is 12 m.
- **Boundaries.** DECISIONS says "within 25 m" and "25–150 m"; I treat 25 as bound and 150 as nudge.
- **Fetching.** Terms and robots.txt read first (Metabot: `Allow: /`, disallows `/api/` and profiles; non-commercial use qualifies per DECISIONS). Own User-Agent, one request at a time, at least 6 s apart, 24 requests, no 403/429/challenge. Pages were cached outside the repo and are not committed. Never th.gl or Game8.
- **Distances are straight-line, truncated to whole metres, to the step's marker.** Not path length and not where the player runs (location-coverage §4).

## Table: Kibelisks cited by story quests (53, story order)

Class = class of the first story point. "?" = step distance not in the repo and page not fetched. † = low-confidence derived position (mirror ambiguity). x,y are map pixels on `World_D_A` (Altgard), derived, not published by Metabot; blank = not recoverable. Ishalgen has no derived positions.

| # | Kibelisk | Zone (Metabot) | First story point (quest, Lv), point | m | Class | Best known (m) | Derived x,y |
|---|---|---|---|---|---|---|---|
| 1 | Aldelle Village | Aldelle Village | A Village in the Fog (Lv 2), giver Andre | 23 | auto-bound | 4 |  |
| 2 | Witch's Cabin | Witch's Cabin | Shadow Forest (Lv 3), step 3: Search Munihelle Forest — investigate it with Maard | 62 | nudge | 12 |  |
| 3 | Abandoned Barracks Site | Abandoned Barracks Site | Signs of a Crash Landing (Lv 6), turn-in Garlond | 9 | auto-bound | 9 |  |
| 4 | Safe Haven | Safe Haven | Finding Nemon (Lv 10), turn-in Hans | 96 | nudge | 32 | 3196,2852 |
| 5 | Galorik's Inspection Area | Galorik's Inspection Area | Crash Site Rendezvous (Lv 11), step 1: Find Hadala at Galorik's Inspection Area — talk to Hadala | 50 | nudge | 49 |  |
| 6 | Temporary Investigation Base | Temporary Investigation Base | Crash Site Rendezvous (Lv 11), step 4: Find the herbalist and gather neutralizer materials — talk to … | 189 | none | 10 | 3485,3270† |
| 7 | Creion Campsite | Creion Campsite | Express Daeva Delivery (Lv 12), step 1: Restore the supply route — retrieve the Lost Supplies, defeat … | 116 | nudge | 116 |  |
| 8 | Quai Campsite | Quai Campsite | Express Daeva Delivery (Lv 12), turn-in Ulgorn | 30 | nudge | 30 |  |
| 9 | Gravekeeper Camp | Gravekeeper Camp | Urgent Pursuit (Lv 13), step 1: Find out where the broker is — talk to Tagar | 12 | auto-bound | 12 | 2572,3320† |
| 10 | Neglected Crematorium | Neglected Crematorium | Back on the Scent (Lv 14), step 1: Clear the path to the crematorium — defeat Lost Specter, Ancie… | 132 | nudge | 11 | 2381,3134 |
| 11 | Fang Hideout | Fang Hideout | A New Lead (Lv 18), turn-in Menrik | 21 | auto-bound | 21 | 2687,3571 |
| 12 | Temporary Retreat | Temporary Retreat | Broken Fang (Lv 19), turn-in Gamilla | 7 | auto-bound | 7 | 2570,3964† |
| 13 | Watcher's Tent | Watcher's Tent | Crossroad (Lv 20), turn-in Nemon | 9 | auto-bound | 9 |  |
| 14 | Collapsed Chasm | Collapsed Chasm | Creeping Shadow (Lv 21), step 5: Search for survivors — examine Nornir Corpse, find Elim & Norn… | 83 | nudge | 11 | 3534,4340 |
| 15 | Odar's Shade | Odar's Shade | Creeping Shadow (Lv 21), step 1: Find out where Urd is — go to Moslan Forest | 183 | none | 12 | 3598,4102 |
| 16 | Elim's Rest | Elim's Rest | Children of the Elim (Lv 21), turn-in Nemon | 9 | auto-bound | 9 |  |
| 17 | Dawn Legion Temporary Outpost |  | Disturbed Balance (Lv 22), step 3: Investigate Krao Cave — finish the investigation | 177 | none | 177 |  |
| 18 | Forest Hideout | Forest Hideout | Disturbed Balance (Lv 22), step 1: Go where Ecco said — Krao Cave Entrance | 199 | none | 198 | 3979,4249 |
| 19 | Victorious Daeva's Statue | Victorious Daeva's Statue | Searching for Survivors (Lv 24), turn-in Nemon | 175 | none | 175 | 4215,3649 |
| 20 | Minushan Site | Minushan Site | Prison Break (Lv 24), turn-in Hadala | 34 | nudge | 34 |  |
| 21 | Uruthumheim Cliff | Uruthumheim | Voice of Rage (Lv 25), turn-in Nemon | 46 | nudge | 46 |  |
| 22 | Nornir Assembly | Nornir Assembly | Tangled Past (Lv 25), turn-in Urd | 164 | none | 133 | 4854,3849 |
| 23 | Guide Rest Stop | Guide Rest Stop | Striving for Coexistence (Lv 26), step 2: Get potion ingredients from the Soft Breeze Spirit — gather an… | ? | unknown | ? | 4776,3451 |
| 24 | Purifying Forest Coastal Cliff | Purifying Forest | Preparations for Restoration (Lv 27), turn-in Hadala | 89 | nudge | 89 | 5060,3501 |
| 25 | Faded Stump | Faded Stump | A Collective Effort (Lv 27), turn-in Darmand | 29 | nudge | 29 | 4714,3204† |
| 26 | Purifying Forest Sunny Hill | Basfelt Ruins | A Collective Effort (Lv 27), step 7: Restore the Fire Altar — purify the Fire Altar | ? | unknown | ? | 5184,3267† |
| 27 | Healing Spring | Healing Spring | Land of Rifts (Lv 29), step 4: Turn in — Nemon, Water Altar | ? | unknown | 20 | 4280,3514 |
| 28 | Battlescar Mound Clifftop | Battlescar Mound | Canyon's Secret (Lv 30), step 1: Hear about the valley that was discovered — talk to Dinoh | 270 | none | 270 |  |
| 29 | Kraka Footpath Wastewater Downstream |  | Canyon's Secret (Lv 30), step 2: Investigate the Urugugu Canyon — complete the Urugugu Canyon i… | 218 | none | 218 |  |
| 30 | Briskwind Shelter | Briskwind Shelter | Bitter Reality (Lv 32), turn-in Menrik | 63 | nudge | 49 | 4555,2913 |
| 31 | Hidden Cave | Hidden Cave | Eye of the Red Tower (Lv 32), turn-in Menrik | 301 | none | 12 | 4712,2106 |
| 32 | Dranactus Shore | Dranactus | Last of the Destruction Archons (Lv 32), step 1: Prepare to infiltrate the underkeep — go to the entrance of th… | ? | unknown | ? | 5068,2269 |
| 33 | Basfelt Waterfall | Basfelt Waterfall | Last Refuge (Lv 33), step 1: Join Nemon at the location she mentioned — go to Basfelt Water… | 21 | auto-bound | 21 | 5469,2767 |
| 34 | Graverobber Campsite | Graverobber Campsite | Last Refuge (Lv 33), step 6: Investigate the Marauder base near the entrance of the ruins —… | 191 | none | 30 | 5509,3146 |
| 35 | Shulak Street Stall | Shulak Street Stall | Blood Monument (Lv 33), step 1: Find the secret document Reuben mentioned — go to the Abandone… | ? | unknown | 25 | 5408,3467 |
| 36 | Fissure Cave | Fissure Cave | Impending Threat (Lv 34), step 1: Reduce the number of watchful eyes — destroy Activated Large B… | ? | unknown | 14 | 6001,3171† |
| 37 | Gribade Highland Crossroad | Mahindel River | Enemy Territory (Lv 35), step 6: Deliver supplies to the Steel Hammer Workcamp — collect mined … | 190 | none | 190 |  |
| 38 | Mahindel Cliff | Mahindel Cliff | Enemy Territory (Lv 35), step 1: Ask expert Sculkhi for information — talk to Sculkhi | 13 | auto-bound | 13 |  |
| 39 | Steel Hammer Merchants HQ | Steel Hammer Merchants HQ | Enemy Territory (Lv 35), step 2: Join Nemon at the Steel Hammer Merchant HQ — talk to Nemon | 57 | nudge | 33 | 5752,4154 |
| 40 | Steel Hammer Workcamp | Steel Hammer Workcamp | Enemy Territory (Lv 35), turn-in Mannikiki | 53 | nudge | 33 | 5347,4576 |
| 41 | Abandoned Campsite | Abandoned Campsite | Powder of Death (Lv 35), step 2: Check the Shuttered Workstation situation — enter the Shuttere… | ? | unknown | 9 | 5158,4865 |
| 42 | Zemurru's Tomb | Zemurru's Tomb | Unveiling the Truth (Lv 37), turn-in Nemon | 210 | none | 24 | 5396,5295 |
| 43 | Idun's Lake | Southern Gribade Highland | Lake of Confrontation (Lv 37), turn-in Nemon | 19 | auto-bound | 19 |  |
| 44 | Steel Hammer Temporary Trading Post | Steel Hammer Temporary Trading Post | An Ill Fate's Resolution (Lv 37), step 2: Go to Idun's Lake — approach Idun's Lake | ? | unknown | ? | 5721,5205 |
| 45 | Amunta's Hideout | Amunta's Hideout | Fafnite's Whereabouts (Lv 40), step 2: Investigate Amunta's Hideout — enter Amunta's Hideout | ? | unknown | 10 | 5840,4724 |
| 46 | Eastern Gribade Highland Cliff | Eastern Gribade Highland | Exiled Ritualist (Lv 40), step 2: Rescue Amunta from the Prisoners Grotto — enter the Prisoners … | ? | unknown | ? | 5858,4944† |
| 47 | Secret Rendezvous Point | Secret Rendezvous Point | Daybreak Society (Lv 41), step 2: Infiltrate the Black Claw Village — talk to Black Claw Scout, … | ? | unknown | 20 |  |
| 48 | Kumrica's Cellar | Kumrica's Cellar | Daybreak Society Rescue Operation (Lv 41), step 1: Distract the Black Claw soldiers — destroy the Balaur Sacred T… | ? | unknown | 23 | 4924,5627 |
| 49 | Collapsed Hall of Fame | Collapsed Hall Of Fame | Lingering Apparitions (Lv 44), step 2: Search the apparition in the Collapsed Hall of Fame — operate … | 36 | nudge | 32 | 5449,5725 |
| 50 | Outskirts Stall | Outskirts Stall | Lingering Apparitions (Lv 44), step 1: Go to the Impetusium — join Nemon at the Outskirts Stall | 21 | auto-bound | 21 | 5352,5867 |
| 51 | Garden of the Illusion God East Observatory |  | Forgotten Commander (Lv 45), step 2: Investigate Draupnir | 303 | none | 303 |  |
| 52 | Impetusium Lower Path | Black Claw Village | Forgotten Commander (Lv 45), step 1: Receive briefing at the Draupnir Entrance — talk to Kiara | 182 | none | 94 | 5195,6021 |
| 53 | Latesran Eastern Root |  | Forgotten Commander (Lv 45), turn-in Koro | 49 | nudge | 49 |  |

## Kibelisks with no story point (20)

Zone is Metabot's. "Regional best" = smallest distance on any regional-quest point in `regional-quests.json`.

| Kibelisk | Zone (Metabot) | In Metabot's Altgard list | Regional best (m) | Derived x,y |
|---|---|---|---|---|
| Abandoned Site | Abandoned Site | yes | 32 | 4085,4047 |
| Alert Observation Post | — | no | — |  |
| Basfelt Ruins Cliff | Basfelt Ruins | yes | 14 |  |
| Basfelt Waterfall Arch Zone | Basfelt Ruins | yes | — |  |
| Beast Hunter Campsite | — | no | 80 |  |
| Beneath the Tranein Highland Bridge | Calderon Canyon | yes | 22 |  |
| Collapsed Pillar | — | no | 106 |  |
| Eastern Gribade Highland Tail Island | Eastern Gribade Highland | yes | — |  |
| Guide's Dwelling | Guide's Dwelling | yes | 55 |  |
| Mire Campsite | Mire Campsite | yes | 90 | 3324,3681 |
| Moslan Forest Cliff | Moslan Forest | yes | 32 | 3171,4204† |
| Moslan Forest Dry Shade | Moslan Forest | yes | 132 | 3695,4408 |
| Pilgrim's Rest | — | no | 201 |  |
| Remote Island | Sanctum Outpost | yes | 1264 |  |
| Safe Haven Cliff | Safe Haven | yes | 215 | 3671,2586† |
| Sanctum Outpost Sky Island | Tranein Highland | yes | — |  |
| Silent Hill Coastal Cliff | Silent Hill | yes | — |  |
| Silent Hill Mushroom Rock | Silent Hill | yes | — |  |
| Verteron Fortress Valley | — | no | 83 |  |
| Wave-Swept Cliff | Moslan Forest | yes | — |  |

## Owner evidence check (alt character, 2026-10-15)

Data from the story points above. "Rule" = DECISIONS "Kibelisk binding (0.4)" (≤ 25 m bound, 26–150 m nudge).

| # | Owner observation | Story points near it | Rule says | Verdict |
|---|---|---|---|---|
| 1 | Aldelle Village bound in quest 1, "A Village in the Fog" | Giver Andre 23 m, step 1 Pelleir 57 m, turn-in Ellin 4 m. Step 2 of the quest text is "Remember Aldelle Village — bind with the Kibelisk" | Bound at quest start (23 m) | **Agrees**, but with a 2 m margin, and the quest has an explicit bind step, so this does not test the distance. |
| 2 | Witch's Cabin bound in the first steps of "The Being Beneath the Lake" | Earlier: Shadow Forest step 3 (Maard) 62 m; Isolated Lake steps at 95, 44, 39, 50, 133, **12 m** (step 6, Elvida's residence) and turn-in 14 m. Being Beneath: giver 14 m, step 1 "Bind with the Witch's Cabin Kibelisk" 14 m (the quest start), journal 13 m, Elvida 14 m, lake cave 108 m | Nudge at Shadow Forest (62 m); auto-bound at Isolated Lake step 6 (12 m), one quest before the owner saw it bound | **Inconclusive.** The owner may simply have seen the explicit bind step. If the Cabin was still unbound after Isolated Lake (12–14 m, and 39–44 m earlier in that quest), proximity binding is wrong for scripted Kibelisks. Needs one owner answer (see Gaps). |
| 3 | Abandoned Barracks Site unlocked on turning in "Signs of a Crash Landing" | No earlier point near it: step 9 (Brigade Camp entrance) is 94 m from Aldelle Village, and the Barracks is farther. Turn-in Garlond **9 m** | Bound at the turn-in | **Agrees.** |
| 4 | Galorik's Inspection Area bound while running to "Crash Site Rendezvous" | Step 1 (Hadala) **50 m**; step 2 166 m; turn-in 49 m. The quest starts at Safe Haven, 89 m from its own Kibelisk | Nudge ("Bind Galorik's") | **Wrong.** The player bound it on the way, before reaching Hadala. A step's marker is where the player ends up, not how close the route passes; a runner approaching from outside crosses the 30–40 m radius before the marker. A "Bind" nudge would be shown for a Kibelisk already bound. |
| 5 | Safe Haven bound during "Survival Supplies: Receive additional supplies" | Step 1 (VeKauf) **32 m** (turn-in also 32 m). Earlier: Finding Nemon turn-in Hans 96 m, Survival Supplies giver Hans 96 m | Nudge at 32 m | **Wrong.** 32 m is inside the owner's 30–40 m radius. The 96 m points did not bind it (consistent: Finding Nemon did not bind, Survival Supplies step 1 did). |

**Finding.** The rule's 25 m is below the radius the owner measured (30–40 m), so it misses cases 4 and 5 and would also mislabel the other 7 story Kibelisks whose nearest known point is 29–34 m. The data fit a bound threshold of about 40 m on step endpoints *[inferred, 5 observations]*: it fixes case 5 and the eight 29–34 m Kibelisks. Case 4 (50 m endpoint, route passes closer) needs either a threshold of at least 50 m or accepting one redundant nudge; 150 m for the nudge band is untested by any observation. Cases 1 and 2 involve scripted "bind with the Kibelisk" steps and say nothing about distance; they should not count toward the 25 m rule. Taking the three cases that do test distance (3, 4, 5) the 25 m rule is right once, wrong twice. I did not change DECISIONS.

## Gaps

- **Step distances for 12 Kibelisks are unknown** (first point is a step on an unfetched page): Guide Rest Stop, Purifying Forest Sunny Hill, Dranactus Shore, Steel Hammer Temporary Trading Post, Eastern Gribade Highland Cliff have no known distance at all (5, `ever_class` unknown); Healing Spring, Shulak Street Stall, Fissure Cave, Abandoned Campsite, Amunta's Hideout, Secret Rendezvous Point and Kumrica's Cellar have a later known point (9–25 m) but their first-step class is unknown. 69 of 86 story quest pages were not fetched (request cap of about 25). A full pass needs about 50 more requests at 6 s spacing.
- **Ishalgen names are inferred.** Metabot says 3, gives none (the map layer is client-side). Names rest on our quest data; no Ishalgen coordinates exist. The Ishalgen map has no `/kibelisks` page in the sitemap.
- **9 names are cited by quest pages but absent from Metabot's Altgard list**: Alert Observation Post, Garden of the Illusion God East Observatory, Kraka Footpath Wastewater Downstream, Dawn Legion Temporary Outpost, Latesran Eastern Root, Beast Hunter Campsite, Collapsed Pillar, Pilgrim's Rest, Verteron Fortress Valley. Not in the Morheim list either. Three are in the repo's derived-position file only because quest markers cite them. Either the listing is incomplete, the names are renamed in the client, or they belong to a map I did not read (Verteron and Eltnen are Elyos; not fetched). The count 73 includes them; 64 is the listed count. Note that 4 listed names (Basfelt Waterfall Arch Zone, Sanctum Outpost Sky Island, Silent Hill Coastal Cliff, Wave-Swept Cliff) are not cited by any quest.
- **No coordinates from Metabot.** Derived positions are not to be shown in the UI (location-coverage §4 recommendation stands); 25 of the 64 listed Kibelisks have none, 9 are low-confidence.
- **Zone column is Metabot's listing**, which does not always match our zone registry (e.g. "Idun's Lake" is listed under Southern Gribade Highland, "Gribade Highland Crossroad" under Mahindel River).
- **Owner question for case 2:** was the Witch's Cabin shown as unbound in the map or teleport list after "Isolated Lake" and before "The Being Beneath the Lake"? Also useful: the distance at which a Kibelisk bound while running past one (a screen with the minimap).
- **Not tested:** whether binding needs line of sight, a cooldown, or the owner's 30–40 m is the same for all Kibelisks (all five observations are single events on one character).
