# Story objective points from Metabot (research, 2026-10-17)

Question (ROADMAP 0.5 "Alongside", token `research-step-points`; gates P9, `docs/plans/0.5/P9-step-points.md`): for the
51 story quests whose Metabot pages carry step markers (location research §3, about 185 points), which of our objective
lines (`story-quests.json` `steps[]`) does each marker belong to, and what point, map and nearest Kibelisk does it give?
Research only: no app code or app data changed.

- Per-marker results: `data/research/story-step-points-metabot-2026-10.csv` (305 rows, every row with its page URL).
- Script: `data/research/scripts-2026-10/story_step_points.py` (uses `extract.py`; pages fetched with `fetch.sh`).
- Requests: `data/research/story-step-points-metabot-2026-10.requests.log` (89 lines, completion times).

## 1. Result

1. **The brief's 51 quests: 185 markers, all 185 bound to an objective line** (178 by an identical title at the same
   position, 7 where our title is a reworded version of the page's, same position, list lengths equal; §4). One of the
   51 (*A Daeva Dreaming Anew*) has no step marker, so the points sit on 50 quests. All on map `World_D_A`.
2. **Beyond the brief, the other 36 story quests** (added to our data after the location research picked its 51) also
   have markers: **120 markers, 115 bound** (84 identical title, 31 reworded), 35 of them on the Ishalgen starter map
   `World_D_Starter`. The 5 unbound are all *Finding Nemon*, which has **no objective lines** in our data (§5).
3. **Totals: 305 markers on 84 of our 87 story quests; 300 bound** (265 `World_D_A`, 35 `World_D_Starter`). Every bound
   row has its page URL, Metabot's point, map, nearest Kibelisk and metres.
4. **No conflict with our data:** of the 300 bound objective lines, 237 carry a `(Kibelisk: X)` marker and all 237 equal
   Metabot's nearest Kibelisk for that step; 63 have no marker today (the page gives one). The 3 marker lines with no
   point are two turn-in lines (*The High Priest Slumbers*, *Land of Rifts*: their point is the turn-in, not a step)
   and one objective the page doesn't list (*The Being Beneath the Lake*, §5).
5. **Objective lines without a point are exactly the page's unnumbered rows:** 348 objective lines (turn-ins excluded),
   48 without a point. For the 84 quests where our list and the page list have the same length, every unbound line is an
   unnumbered page row (Metabot puts no marker on it: 26 "talk via Selvis" lines in the 51 alone, plus "read the
   manual", "use Protection Serum", "complete The One Who Dreams" and similar). P9's "via Selvis lines have none" holds.

| Set | Quests | With markers | Markers | Bound: same title | Bound: reworded title | Unbound | Maps |
|---|--:|--:|--:|--:|--:|--:|---|
| Brief (location research's 51) | 51 | 50 | 185 | 178 | 7 | 0 | World_D_A 185 |
| Other story quests | 36 | 34 | 120 | 84 | 31 | 5 | World_D_A 85, World_D_Starter 35 |
| **All** | **87** | **84** | **305** | **262** | **38** | **5** | |

Point spread: 108 markers have several points (kill or collect areas, up to 48 points); the CSV's `x,y` is Metabot's
`center`, as in the location research, and `all_points` keeps every point. Nearest-Kibelisk distance: median 110 m,
p90 246 m, max 1056 m.

## 2. Method

- **Policy first** (CLAUDE.md, owner 2026-10-14). `https://metabot.gg/robots.txt` re-read today: `Allow: /`, disallows
  only `/api/`, `/private/` and profile paths. Terms (`/en/legal/terms-of-service`, effective 04/01/2026, section "Data
  Usage & Attribution (AI Agents & Automated Tools)"): reuse allowed with a dofollow link to the specific page the data
  came from, no misrepresentation or implied endorsement, "reasonable request rate". No AI opt-out and unchanged since
  the 2026-10-14 and 2026-10-15 checks, so the plain tier applies (≤ 12 requests/min per host, one at a time).
- **Requests: 89, all HTTP 200**, 12:24–12:36 UTC (8:24–8:36 AM ET): robots.txt, Terms, 51 quest pages, then the 36
  other story quest pages. One at a time; `fetch.sh` enforces ≥ 6 s between request starts and stops on 403 / 429 / a
  challenge (none seen). Peak 10 completions in one clock minute. User-Agent
  `DaevaCompanionResearch/0.1 (+https://daevacompanion.com)`. Each page fetched once into a session cache (scratch,
  not committed). Not fetched: `/api/`, images, tiles, zone pages, aion2.th.gl, Game8, any other site.
- **The pages' quest list:** the 51 URLs are the `type=story` rows of `data/research/locations-metabot-2026-10.csv`;
  the 36 are the Metabot quest URL in the `sources` of every other `story-quests.json` record (all 36 had one). Every
  page's `<title>` equals our record name, and every page states game build 0.0.4387.0.
- **Extraction.** The marker data is the page's embedded `"spots"` array (as in the location research): each step
  marker has `id` `step-N`, `map`, `goals[].pts` (x, y px on the 8192 × 8192 map), `center`, and `kisk` (nearest
  Kibelisk `name`, `d` metres). The visible walkthrough is an `<ol>` of `<li id="step-N">` rows; N is the row's
  **position**, numbered on the page or not (unnumbered rows have no marker). So marker N is page row N.
- **Binding to our objectives.** Our objective lines were filled from the same walkthrough (issue #65), so page row N
  is our `steps[N-1]` when the two lists have the same length (84 of 87 quests). In the other 3 (*Empyrean Monolith*,
  *Finding Nemon*, *The Being Beneath the Lake*, §5) a marker binds by best title match (`difflib` ratio ≥ 0.6 on letters and digits), never by position. Checks on every bound row: title equal
  (`title_agrees` yes / reworded, with `title_ratio`), our `(Kibelisk: X)` marker equal to Metabot's (`kibelisk_agrees`
  yes / no marker; a NO would have left the row unbound — there were none).
- **Status:** `confirmed` = same title, same position; `confirmed-reworded` = our title is a reworded copy of the page's
  (all 38 read by hand, §4); `unbound` = no objective line to attach it to.

## 3. CSV columns

`quest_id, quest, level` (ours) · `step_no` (Metabot's N) · `objective_i` (our `steps[].i`), `objective_title` (ours,
before " — ") · `title_agrees, title_ratio` · `map, x, y` (Metabot `center`, px ≈ m, location research §4) · `points,
all_points` · `kibelisk, meters` (Metabot's nearest Kibelisk and distance, truncated metres) · `our_kibelisk,
kibelisk_agrees` · `status` · `build` (0.0.4387.0 on every page) · `page_url` (credit link for every value) · `notes`.

For P9's `at { map, x, y, kibelisk, meters, sources }`: `map, x, y, kibelisk, meters` as in the row, `sources` =
`page_url` (checked 2026-10-17, build 0.0.4387.0). Only rows with a `confirmed*` status. Note the two maps: P9's
schema and place table need `map`, and `World_D_Starter` (35 points, Ishalgen) has its own pixel space; distances
across maps are undefined (location research §3).

## 4. Reworded titles (38, all same objective)

Our text shortens or rephrases the page's step title (e.g. ours *Go where Hallina said*, page *Go to the location
Hallina mentioned*; ours *Collect Selvis repair parts*, page *Collect materials to repair the Selvis*). Each pair is in
the CSV `notes`. I read all 38: each is the same objective, at the same position in a list of the same length (or, in
the two offset quests of §5, the only plausible match). Lowest ratio 0.46 (*Collect Selvis repair parts*). The 7 in the
brief's set: *Searching for Survivors* 2; *Tangled Past* 3, 4; *Striving for Coexistence* 1, 2; *A Collective Effort*
3, 8. Not changed here (no data change in a research PR); they are a wording question, not a location one.

## 5. Data findings for the owner of `story-quests.json` (not fixed here)

- ***Finding Nemon* (sq:2102010) has no objective lines;** the page has 5 rows, all with markers (Safe Haven area). P9
  cannot attach them (its no-go: no change to objective count; `qsteps` index objectives). A data item to add the 5
  lines (a save-shape question for `qsteps`, pre-1.0 rule applies) would let a later pass add their points; the 5
  markers are in the CSV as `unbound`.
- ***Empyrean Monolith*:** the page has 6 rows, row 4 an unnumbered repeat of row 3's title (*Obtain the Empyrean
  Trace: Altgard*); ours has 5. Rows 5 and 6 bind to our objectives 3 and 4 by title (offset noted per row).
- ***The Being Beneath the Lake*:** ours starts with *Bind with the Witch's Cabin Kibelisk*, which the page doesn't list
  (4 rows); page rows 1–3 bind to our objectives 1–3 by title. Our extra line has no Metabot point.
- **Kibelisk *Alert Observation Post*** (nearest Kibelisk of *Mirror of Greed* step 2, 1 marker) is named in no pack
  file except story quests, and `story-quests.json` doesn't name it either: it is new to our data.
- The 63 bound objective lines with no `(Kibelisk: X)` marker get one from the page if P9 or a later data item wants it.

## 6. What this does not show

- Metabot's step point is where Metabot places the objective, with Metabot's `center` for multi-point steps; it is a
  game-database field (CLAUDE.md counts these as verified) but not an in-game measurement. Kill / collect areas can be
  large (up to 48 points); `center` is a mid-point, not the best place to stand.
- Whether the player binds at each named Kibelisk (design §8.1) is not on these pages; that stays P9's owner check list.
- Step order in game may not be strictly the list order (location research §5 caveat).
