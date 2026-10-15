# Prerequisite gates for 0.3 (research report)

Data & Research, 2026-10-14. Research only: no app code or data changed. Input for ROADMAP 0.2 step 5a (schema:
`requires` / `completesWith` on every step) and 0.3 (requirement evaluator, the prerequisite audit). The gates are
loaded into the v2 format after 5b. They are not hand-patched into `data/*.json` now, because `data/` and `tools/gen/`
freeze while 5b runs.

**Source rule for this report (owner, 2026-10-14):** aion2.th.gl is no longer fetched or cited, because its robots.txt
excludes AI agents. A first draft used it. Every fact taken from it has been re-checked on Metabot, whose robots.txt
allows us (`Allow: /`; only `/api/`, `/private/` and profile pages are excluded), and attributed to Metabot. Facts no
permitted source confirms are labelled **owner to check in game**. The cached th.gl pages were deleted. Existing repo
records that still cite th.gl are listed in §10.

## 1. Summary

1. **Story chain verified on Metabot.** I walked Metabot's *Previous quest* links from "Daeva Trapped in a Nightmare"
   back to "Ishalgen": 88 Asmodian story quests. The order matches `QUESTS` exactly, with the game id, recommended
   level and unlock level for each.
2. **`noPre`: 2 of the 10 quests get a confirmed story gate** from Metabot "Required first": Traveling Merchant's
   Conundrum (Blood Monument) and Lest We Forget (Zikel's Core). **6 have a candidate gate** that no permitted
   source confirms, so they are owner to check in game. The 2 Spacetime Rift quests unlock at Lv 45 (Metabot); that
   they have *no* prerequisite is owner to check in game.
3. **Gate semantics (D9, ISSUES "Story gate semantics"): "turned in" vs "reached" is unverified. It is owner check 1
   and blocks the change.** Today the app opens its **43 story-gated regional quests** (`RQ_STATS.story`) on "story
   has reached X". If a database prerequisite means "X turned in", all 43 open **one story quest early**. Adding the
   2 confirmed new gates makes 45 story-gated quests, and 51 if all 6 candidates are confirmed. My estimate that
   "turned in" is right for regional quests is **~70%**. The evidence behind it came from Ascension quests on th.gl,
   which can no longer be cited (§3), so nothing should be built on it before check 1.
4. **Each in-cap Ascension quest is the objective of a "wrapper" story quest** (Metabot step text). These are Spread
   Your Wings → Perceives, Daeva in a Dream → Hears the Voice, A Daeva Dreaming Anew → Dreams, and Daeva Trapped in a
   Nightmare → Witnesses the Nightmare. Ascension *completion* can therefore be derived from the story position, with
   no new state. This is verified on Metabot.
5. **"Daeva Trapped in a Nightmare"** (Metabot id 2102810) is the last story quest inside the Lv 45 cap. The next one,
   "Waiting for the Next Journey", is Lv 46 and unlocks at 46. Adding 2102810 lets `g45:0` derive its completion
   (§7).
6. **Five inconsistencies in today's app** (§9). The main ones: the `g12:0` Daevanion-board claim, the Lv 9 / Lv 10
   "unlock" milestones that `VERIFIED_UNLOCKS` itself rejects as single-source, and `g45:0` bundling the Lv 49 quest.

## 2. Method and source reachability

- **Metabot** quest pages, `https://metabot.gg/en/aion-2/quests/<slug>`, fetched with `curl` at about one request per
  second. Used fields: the page's own quest id (its map link, `focus=quest:<id>`); *Previous quest* / *Next quest*
  (story); *Unlocks at*, *Rec. level*; step text; rewards; and the "Required first" row, which renders on only 4 of
  the 58 regional pages. For some quests the bare slug is the **Elyos** page. The Asmodian page is `…-asmodian`
  (Empyrean Monolith, Daeva in a Dream, Preparations for Restoration, the Ascension quests, Waiting for the Next
  Journey); the chain walk follows Metabot's own links, so it lands on the Asmodian pages. Metabot's Ascension pages
  show **no** prerequisite fields.
- **Existing repo citations** to aion2.gaming.tools (`rq.json` `requiresSrc`, `rq-chains.json`) and allthings.how
  were fetched in earlier sessions and are kept as the record for the existing edges. Neither site, nor wikily.gg,
  shugo.gg, aion2hub.com or playnews.gg, can be reached from this session (proxy `CONNECT 403`). So **their
  robots.txt could not be checked**. That needs settling before they are cited in new work (§10).
- Not used: aion2.th.gl (owner rule), Game8 (policy), WebFetch (team note). No packet, memory or screenshot data.

### Proposed ids

| Kind | Id | Example | Note |
|---|---|---|---|
| Story quest | `sq:<game id>` | `sq:2102240` A Collective Effort | game id from Metabot (map link); the name stays display only |
| Ascension quest | `asc:<slug or id>` | `asc:hears-the-voice` | Metabot's Ascension pages show no game id; use a stable slug until an id is confirmed (owner screen or a permitted database) |
| Regional quest | `rq:<game id>` | `rq:2202062` | existing save key, unchanged |
| Milestone / route step | existing `k` | `g22:0`, `daily:1` | unchanged, permanent |
| Sealed Dungeon / stronghold | existing `sd:` / `g10h:` / `sh:` | | unchanged |

### Proposed predicates (for the 5a schema)

`requires` is all-of. `completesWith` is any-of, and a manual tick always counts as well.

| Predicate | True when | Notes |
|---|---|---|
| `lv N` | `state.level >= N` | |
| `reached sq:X` | current story quest is X or later | D9 default meaning |
| `done sq:X` | X turned in: current quest after X, or X is the last covered quest and `storyEnd = X` | today's `turnedIn` |
| `done rq:X` / `done <k>` | that item is ticked, or derived complete | |
| `done asc:X` | derived from the wrapper story quest (§5), or ticked | |
| `info "<text>"` | never evaluated; shown as "check in game" | item level, Ascension Gauge 100%, things we can't track |

In a linear chain `done sq:X` ≡ `reached sq:next(X)`. Store the predicate the source states, so a later story
insertion (as with quest 2102810) can't silently shift a gate.

## 3. Gate semantics: "turned in" or "reached"?

The question (ISSUES, E4 #9): does a story prerequisite X mean "X accepted / reached" or "X turned in"?

**What permitted sources show:**

- Metabot labels the regional field **"Required first"** (4 pages). That reads as "finish this first", but it is a UI
  label, not a definition.
- Wrapper quests (Metabot step text, `QUEST_STEPS`) show that each Ascension quest is available *by the time* its
  wrapper is the current story quest. That puts an upper bound on when it opens, not a lower one, so it can't tell
  "reached" from "turned in".
- Regional → regional edges (e.g. Fallout → Fallout Calmed) mean "turned in" in the app already, and nobody has
  reported them wrong.

**What can no longer be cited:** the first draft had four checks that only fit "turned in", comparing database
prerequisite fields for the Hears / Dreams / Witnesses quests with PlayNews and the wrapper quests. Those fields were
th.gl's. Metabot doesn't show them, and PlayNews' robots.txt couldn't be checked. The two Ascension gates the app
already has (claims C36, C37, 0.1.3) rest on the same th.gl fields; see §10.

**Verdict: owner to check in game.** My estimate stays at **~70%** that "turned in" is right for regional quests. All
the supporting evidence was about Ascension quests, and it now rests on sources this report can't cite. It is an
estimate, not a sourced finding. The app is internally inconsistent either way: the Ascension steps use "turned in"
(`story: "A Daeva Dreaming Anew"`, `turnedIn: "Forgotten Commander"`), while the 43 story-gated regional quests
(`RQ_STATS.story`) use "reached" (`rqAvail`: `cur >= storyIdx(q.story)`).

**Consequence (only if check 1 confirms "turned in"):** the 43 quests gated today move one story quest later; for
example, Fight Poison with Poison would open on Land of Rifts, not on A Collective Effort. The 2 new Metabot-confirmed
gates and any of the 6 candidates confirmed in game also get a "turned in" gate: 45 to 51 regional quests in all.
This is an intended golden-master change; list it per ROADMAP 0.3 for owner approval. If check 1 shows "reached",
the 43 stay as they are and only the Ascension steps' convention needs a comment.

**D9 fit:** D9 keeps "story has reached X" as the default and adds "turned in" as a separate gate. Either answer fits
D9; only the predicate stored per gate changes.

**Unconfirmed counter-signal:** ISSUES gives "Fight Poison with Poison at Preparations for Restoration" as an
example. If that was an in-game sighting, the quest was offered *two* quests before A Collective Effort was turned
in, which fits neither meaning. No record says where it came from. Owner check 1 (§11) settles it.

## 4. Story quests (88, Lv 1–45)

A linear chain with one predecessor each, from Metabot *Previous quest* / *Next quest*. Ids, recommended levels and
unlock levels are Metabot's: unlock 1 for quests 1–11, 10 from Finding Nemon, and 45 for Forgotten Commander and
Daeva Trapped. The order is identical to `QUESTS` + `QUESTS_X`, a second, independent list (AION2HUB 1–40, Metabot
41–45). A story quest's `completesWith` is reaching the next quest. The story position already stores this, so story
completion is derived, never ticked (ROADMAP 0.3).

| # | id | Quest (Metabot page) | rec / unlock | requires | completesWith |
|---|---|---|---|---|---|
| 1 | 2100010 | [Ishalgen](https://metabot.gg/en/aion-2/quests/ishalgen) | 1 / 1 | — | `reached sq:2101010` |
| 2 | 2101010 | [A Village in the Fog](https://metabot.gg/en/aion-2/quests/a-village-in-the-fog) | 2 / 1 | `done sq:2100010` | `reached sq:2101020` |
| 3 | 2101020 | [Prepare to Escape](https://metabot.gg/en/aion-2/quests/prepare-to-escape) | 2 / 1 | `done sq:2101010` | `reached sq:2101030` |
| 4 | 2101030 | [Shadow Forest](https://metabot.gg/en/aion-2/quests/shadow-forest) | 3 / 1 | `done sq:2101020` | `reached sq:2101040` |
| 5 | 2101040 | [Isolated Lake](https://metabot.gg/en/aion-2/quests/isolated-lake) | 4 / 1 | `done sq:2101030` | `reached sq:2101050` |
| 6 | 2101050 | [The Being Beneath the Lake](https://metabot.gg/en/aion-2/quests/the-being-beneath-the-lake) | 5 / 1 | `done sq:2101040` | `reached sq:2101060` |
| 7 | 2101060 | [Spread Your Wings](https://metabot.gg/en/aion-2/quests/spread-your-wings) | 6 / 1 | `done sq:2101050` | `reached sq:2101070` |
| 8 | 2101070 | [Signs of a Crash Landing](https://metabot.gg/en/aion-2/quests/signs-of-a-crash-landing) | 6 / 1 | `done sq:2101060` | `reached sq:2101080` |
| 9 | 2101080 | [Prison Compound Infiltration Plan](https://metabot.gg/en/aion-2/quests/prison-compound-infiltration-plan) | 7 / 1 | `done sq:2101070` | `reached sq:2101090` |
| 10 | 2101090 | [Brigade Prison Compound Infiltration Operation](https://metabot.gg/en/aion-2/quests/brigade-prison-compound-infiltration-operation) | 7 / 1 | `done sq:2101080` | `reached sq:2101100` |
| 11 | 2101100 | [The Longest Night](https://metabot.gg/en/aion-2/quests/the-longest-night) | 9 / 1 | `done sq:2101090` | `reached sq:2102010` |
| 12 | 2102010 | [Finding Nemon](https://metabot.gg/en/aion-2/quests/finding-nemon) | 10 / 10 | `done sq:2101100` | `reached sq:2102015` |
| 13 | 2102015 | [Survival Supplies](https://metabot.gg/en/aion-2/quests/survival-supplies) | 10 / 10 | `done sq:2102010` | `reached sq:2102020` |
| 14 | 2102020 | [Gathering Essentials](https://metabot.gg/en/aion-2/quests/gathering-essentials) | 10 / 10 | `done sq:2102015` | `reached sq:2102030` |
| 15 | 2102030 | [Crash Site Rendezvous](https://metabot.gg/en/aion-2/quests/crash-site-rendezvous) | 11 / 10 | `done sq:2102020` | `reached sq:2102040` |
| 16 | 2102040 | [Contaminated Area](https://metabot.gg/en/aion-2/quests/contaminated-area) | 11 / 10 | `done sq:2102030` | `reached sq:2102050` |
| 17 | 2102050 | [Express Daeva Delivery](https://metabot.gg/en/aion-2/quests/express-daeva-delivery) | 12 / 10 | `done sq:2102040` | `reached sq:2102060` |
| 18 | 2102060 | [Veiled Truth](https://metabot.gg/en/aion-2/quests/veiled-truth) | 12 / 10 | `done sq:2102050` | `reached sq:2102065` |
| 19 | 2102065 | [Urgent Pursuit](https://metabot.gg/en/aion-2/quests/urgent-pursuit) | 13 / 10 | `done sq:2102060` | `reached sq:2102070` |
| 20 | 2102070 | [Cemetery Cleanup](https://metabot.gg/en/aion-2/quests/cemetery-cleanup) | 13 / 10 | `done sq:2102065` | `reached sq:2102080` |
| 21 | 2102080 | [Back on the Scent](https://metabot.gg/en/aion-2/quests/back-on-the-scent) | 14 / 10 | `done sq:2102070` | `reached sq:2102090` |
| 22 | 2102090 | [Dead Men Tell No Tales](https://metabot.gg/en/aion-2/quests/dead-men-tell-no-tales) | 15 / 10 | `done sq:2102080` | `reached sq:2102100` |
| 23 | 2102100 | [Buried Atrocities](https://metabot.gg/en/aion-2/quests/buried-atrocities) | 16 / 10 | `done sq:2102090` | `reached sq:2102105` |
| 24 | 2102105 | [Empyrean Monolith](https://metabot.gg/en/aion-2/quests/empyrean-monolith-asmodian) | 16 / 10 | `done sq:2102100` | `reached sq:2102110` |
| 25 | 2102110 | [A New Lead](https://metabot.gg/en/aion-2/quests/a-new-lead) | 18 / 10 | `done sq:2102105` | `reached sq:2102115` |
| 26 | 2102115 | [Malice Laid Bare](https://metabot.gg/en/aion-2/quests/malice-laid-bare) | 18 / 10 | `done sq:2102110` | `reached sq:2102120` |
| 27 | 2102120 | [Broken Fang](https://metabot.gg/en/aion-2/quests/broken-fang) | 19 / 10 | `done sq:2102115` | `reached sq:2102130` |
| 28 | 2102130 | [Watchful Eyes](https://metabot.gg/en/aion-2/quests/watchful-eyes) | 19 / 10 | `done sq:2102120` | `reached sq:2102140` |
| 29 | 2102140 | [Imminent Threat](https://metabot.gg/en/aion-2/quests/imminent-threat) | 20 / 10 | `done sq:2102130` | `reached sq:2102150` |
| 30 | 2102150 | [Crossroad](https://metabot.gg/en/aion-2/quests/crossroad) | 20 / 10 | `done sq:2102140` | `reached sq:2102160` |
| 31 | 2102160 | [Creeping Shadow](https://metabot.gg/en/aion-2/quests/creeping-shadow) | 21 / 10 | `done sq:2102150` | `reached sq:2102170` |
| 32 | 2102170 | [Children of the Elim](https://metabot.gg/en/aion-2/quests/children-of-the-elim) | 21 / 10 | `done sq:2102160` | `reached sq:2102175` |
| 33 | 2102175 | [In the Elims' Name](https://metabot.gg/en/aion-2/quests/in-the-elims-name) | 21 / 10 | `done sq:2102170` | `reached sq:2102180` |
| 34 | 2102180 | [Verdant Melody](https://metabot.gg/en/aion-2/quests/verdant-melody) | 22 / 10 | `done sq:2102175` | `reached sq:2102185` |
| 35 | 2102185 | [Daeva in a Dream](https://metabot.gg/en/aion-2/quests/daeva-in-a-dream-asmodian) | 22 / 10 | `done sq:2102180` | `reached sq:2102190` |
| 36 | 2102190 | [Disturbed Balance](https://metabot.gg/en/aion-2/quests/disturbed-balance) | 22 / 10 | `done sq:2102185` | `reached sq:2102200` |
| 37 | 2102200 | [Searching for Survivors](https://metabot.gg/en/aion-2/quests/searching-for-survivors) | 24 / 10 | `done sq:2102190` | `reached sq:2102201` |
| 38 | 2102201 | [Prison Break](https://metabot.gg/en/aion-2/quests/prison-break) | 24 / 10 | `done sq:2102200` | `reached sq:2102202` |
| 39 | 2102202 | [Finding Stolen Relics](https://metabot.gg/en/aion-2/quests/finding-stolen-relics) | 24 / 10 | `done sq:2102201` | `reached sq:2102210` |
| 40 | 2102210 | [Voice of Rage](https://metabot.gg/en/aion-2/quests/voice-of-rage) | 25 / 10 | `done sq:2102202` | `reached sq:2102220` |
| 41 | 2102220 | [Tangled Past](https://metabot.gg/en/aion-2/quests/tangled-past) | 25 / 10 | `done sq:2102210` | `reached sq:2102225` |
| 42 | 2102225 | [The High Priest Slumbers](https://metabot.gg/en/aion-2/quests/the-high-priest-slumbers) | 26 / 10 | `done sq:2102220` | `reached sq:2102230` |
| 43 | 2102230 | [Striving for Coexistence](https://metabot.gg/en/aion-2/quests/striving-for-coexistence) | 26 / 10 | `done sq:2102225` | `reached sq:2102235` |
| 44 | 2102235 | [Preparations for Restoration](https://metabot.gg/en/aion-2/quests/preparations-for-restoration-asmodian) | 27 / 10 | `done sq:2102230` | `reached sq:2102240` |
| 45 | 2102240 | [A Collective Effort](https://metabot.gg/en/aion-2/quests/a-collective-effort) | 27 / 10 | `done sq:2102235` | `reached sq:2102250` |
| 46 | 2102250 | [Land of Rifts](https://metabot.gg/en/aion-2/quests/land-of-rifts) | 29 / 10 | `done sq:2102240` | `reached sq:2102255` |
| 47 | 2102255 | [Dying Light](https://metabot.gg/en/aion-2/quests/dying-light) | 30 / 10 | `done sq:2102250` | `reached sq:2102260` |
| 48 | 2102260 | [Contaminated Sacred Tree](https://metabot.gg/en/aion-2/quests/contaminated-sacred-tree) | 30 / 10 | `done sq:2102255` | `reached sq:2102270` |
| 49 | 2102270 | [The Past Revealed](https://metabot.gg/en/aion-2/quests/the-past-revealed) | 30 / 10 | `done sq:2102260` | `reached sq:2102280` |
| 50 | 2102280 | [Canyon's Secret](https://metabot.gg/en/aion-2/quests/canyons-secret) | 30 / 10 | `done sq:2102270` | `reached sq:2102300` |
| 51 | 2102300 | [Bitter Reality](https://metabot.gg/en/aion-2/quests/bitter-reality) | 32 / 10 | `done sq:2102280` | `reached sq:2102310` |
| 52 | 2102310 | [Eye of the Red Tower](https://metabot.gg/en/aion-2/quests/eye-of-the-red-tower) | 32 / 10 | `done sq:2102300` | `reached sq:2102320` |
| 53 | 2102320 | [The Survivors](https://metabot.gg/en/aion-2/quests/the-survivors) | 32 / 10 | `done sq:2102310` | `reached sq:2102330` |
| 54 | 2102330 | [Rescue Operation](https://metabot.gg/en/aion-2/quests/rescue-operation) | 32 / 10 | `done sq:2102320` | `reached sq:2102340` |
| 55 | 2102340 | [Last of the Destruction Archons](https://metabot.gg/en/aion-2/quests/last-of-the-destruction-archons) | 32 / 10 | `done sq:2102330` | `reached sq:2102345` |
| 56 | 2102345 | [A Daeva Dreaming Anew](https://metabot.gg/en/aion-2/quests/a-daeva-dreaming-anew) | 32 / 10 | `done sq:2102340` | `reached sq:2102350` |
| 57 | 2102350 | [Last Refuge](https://metabot.gg/en/aion-2/quests/last-refuge) | 33 / 10 | `done sq:2102345` | `reached sq:2102360` |
| 58 | 2102360 | [Scripture in the Ruins](https://metabot.gg/en/aion-2/quests/scripture-in-the-ruins) | 33 / 10 | `done sq:2102350` | `reached sq:2102370` |
| 59 | 2102370 | [Blood Monument](https://metabot.gg/en/aion-2/quests/blood-monument) | 33 / 10 | `done sq:2102360` | `reached sq:2102380` |
| 60 | 2102380 | [Impending Threat](https://metabot.gg/en/aion-2/quests/impending-threat) | 34 / 10 | `done sq:2102370` | `reached sq:2102390` |
| 61 | 2102390 | [Visible Trap](https://metabot.gg/en/aion-2/quests/visible-trap) | 34 / 10 | `done sq:2102380` | `reached sq:2102400` |
| 62 | 2102400 | [Destruction Archon Underground Fortress](https://metabot.gg/en/aion-2/quests/destruction-archon-underground-fortress) | 34 / 10 | `done sq:2102390` | `reached sq:2102450` |
| 63 | 2102450 | [Enemy Territory](https://metabot.gg/en/aion-2/quests/enemy-territory) | 35 / 10 | `done sq:2102400` | `reached sq:2102460` |
| 64 | 2102460 | [Powder of Death](https://metabot.gg/en/aion-2/quests/powder-of-death) | 35 / 10 | `done sq:2102450` | `reached sq:2102470` |
| 65 | 2102470 | [Creion of Gribade](https://metabot.gg/en/aion-2/quests/creion-of-gribade) | 36 / 10 | `done sq:2102460` | `reached sq:2102480` |
| 66 | 2102480 | [Frozen Fafnite](https://metabot.gg/en/aion-2/quests/frozen-fafnite) | 36 / 10 | `done sq:2102470` | `reached sq:2102550` |
| 67 | 2102550 | [Inevitable Encounter](https://metabot.gg/en/aion-2/quests/inevitable-encounter) | 37 / 10 | `done sq:2102480` | `reached sq:2102565` |
| 68 | 2102565 | [Unveiling the Truth](https://metabot.gg/en/aion-2/quests/unveiling-the-truth) | 37 / 10 | `done sq:2102550` | `reached sq:2102575` |
| 69 | 2102575 | [Lake of Confrontation](https://metabot.gg/en/aion-2/quests/lake-of-confrontation) | 37 / 10 | `done sq:2102565` | `reached sq:2102585` |
| 70 | 2102585 | [An Ill Fate's Resolution](https://metabot.gg/en/aion-2/quests/an-ill-fates-resolution) | 37 / 10 | `done sq:2102575` | `reached sq:2102590` |
| 71 | 2102590 | [Mirror of Greed](https://metabot.gg/en/aion-2/quests/mirror-of-greed) | 37 / 10 | `done sq:2102585` | `reached sq:2102600` |
| 72 | 2102600 | [Fafnite's Whereabouts](https://metabot.gg/en/aion-2/quests/fafnites-whereabouts) | 40 / 10 | `done sq:2102590` | `reached sq:2102610` |
| 73 | 2102610 | [Exiled Ritualist](https://metabot.gg/en/aion-2/quests/exiled-ritualist) | 40 / 10 | `done sq:2102600` | `reached sq:2102612` |
| 74 | 2102612 | [Healing Herbs](https://metabot.gg/en/aion-2/quests/healing-herbs) | 40 / 10 | `done sq:2102610` | `reached sq:2102615` |
| 75 | 2102615 | [Treatment](https://metabot.gg/en/aion-2/quests/treatment) | 40 / 10 | `done sq:2102612` | `reached sq:2102620` |
| 76 | 2102620 | [Symbol of Liberation](https://metabot.gg/en/aion-2/quests/symbol-of-liberation) | 40 / 10 | `done sq:2102615` | `reached sq:2102650` |
| 77 | 2102650 | [Daybreak Society](https://metabot.gg/en/aion-2/quests/daybreak-society) | 41 / 10 | `done sq:2102620` | `reached sq:2102660` |
| 78 | 2102660 | [Daybreak Society Rescue Operation](https://metabot.gg/en/aion-2/quests/daybreak-society-rescue-operation) | 41 / 10 | `done sq:2102650` | `reached sq:2102670` |
| 79 | 2102670 | [The Breaking of the Day](https://metabot.gg/en/aion-2/quests/the-breaking-of-the-day) | 42 / 10 | `done sq:2102660` | `reached sq:2102680` |
| 80 | 2102680 | [Chief of the Black Claw](https://metabot.gg/en/aion-2/quests/chief-of-the-black-claw) | 42 / 10 | `done sq:2102670` | `reached sq:2102690` |
| 81 | 2102690 | [High Priest's Fafnite](https://metabot.gg/en/aion-2/quests/high-priests-fafnite) | 43 / 10 | `done sq:2102680` | `reached sq:2102750` |
| 82 | 2102750 | [The High Priest Awakens](https://metabot.gg/en/aion-2/quests/the-high-priest-awakens) | 44 / 10 | `done sq:2102690` | `reached sq:2102760` |
| 83 | 2102760 | [Lingering Apparitions](https://metabot.gg/en/aion-2/quests/lingering-apparitions) | 44 / 10 | `done sq:2102750` | `reached sq:2102770` |
| 84 | 2102770 | [Blood Barrier](https://metabot.gg/en/aion-2/quests/blood-barrier) | 44 / 10 | `done sq:2102760` | `reached sq:2102780` |
| 85 | 2102780 | [Zikel's Core](https://metabot.gg/en/aion-2/quests/zikels-core) | 45 / 10 | `done sq:2102770` | `reached sq:2102781` |
| 86 | 2102781 | [Farewells](https://metabot.gg/en/aion-2/quests/farewells) | 45 / 10 | `done sq:2102780` | `reached sq:2102800` |
| 87 | 2102800 | [Forgotten Commander](https://metabot.gg/en/aion-2/quests/forgotten-commander) | 45 / 45 | `done sq:2102781`, `lv 45` | `reached sq:2102810` |
| 88 | 2102810 | [Daeva Trapped in a Nightmare](https://metabot.gg/en/aion-2/quests/daeva-trapped-in-a-nightmare) **(not in app)** | 45 / 45 | `done sq:2102800`, `lv 45` | tick *Turned in* (sets `storyEnd`) |

## 5. Ascension quests

Metabot gives level, unlock level, steps and chapter ("Path of Ascension I–V") for each Ascension quest, but **no
prerequisite field**. Completion comes from the wrapper quests, which is verified. The story gate, previous-Ascension
gate and gauge gate are not sourced here.

| id | Quest | rec / unlock (Metabot) | proposed `requires` | proposed `completesWith` | sources / status |
|---|---|---|---|---|---|
| `asc:perceives` | The One Who Perceives | 5 / 5 | `lv 5`; story gate `done sq:2101050` The Being Beneath the Lake, **verified by the owner 2026-10-15** (check 6a) | `done sq:2101060` (Spread Your Wings: objective 1 is "The One Who Perceives Complete") | [Metabot](https://metabot.gg/en/aion-2/quests/the-one-who-perceives-asmodian) intro "After passing the Lake Guardian's test…" (hint only); [Spread Your Wings](https://metabot.gg/en/aion-2/quests/spread-your-wings) steps. Completion verified, gate owner-verified (check 6a) |
| `asc:hears-the-voice` | The One Who Hears the Voice | 22 / 10 | `reached sq:2102185` (today's app gate); `done asc:perceives`: **inferred** (chapter order II after I); `info "Ascension Gauge 100%"` (existing app text) | `done sq:2102185` (Daeva in a Dream: its objective is completing this quest) | [Metabot](https://metabot.gg/en/aion-2/quests/the-one-who-hears-the-voice-asmodian); [Daeva in a Dream](https://metabot.gg/en/aion-2/quests/daeva-in-a-dream-asmodian) steps / `QUEST_STEPS`. Completion verified. The wrapper proves the quest is open **by** Daeva in a Dream; whether it opens a quest earlier is owner to check in game |
| `asc:dreams` | The One Who Dreams | 32 / 10 | `reached sq:2102345` (today's 0.1.3 gate, claim C36); `done asc:hears-the-voice`: inferred (chapter order); `info gauge 100%` (C36 notes: allthings.how + Skycoach) | `done sq:2102345` (A Daeva Dreaming Anew: its only objective is completing Dreams) | [Metabot](https://metabot.gg/en/aion-2/quests/the-one-who-dreams-asmodian); [A Daeva Dreaming Anew](https://metabot.gg/en/aion-2/quests/a-daeva-dreaming-anew) steps. Completion verified; gate "open by the wrapper" verified, earlier opening owner to check |
| `asc:witnesses` | The One Who Witnesses the Nightmare | 45 / 10 | `done sq:2102800` (today's `g45:0` gate, claim C37); `done asc:dreams`: inferred (chapter order) | `done sq:2102810` (Daeva Trapped in a Nightmare: its only objective is completing Witnesses) | [Metabot](https://metabot.gg/en/aion-2/quests/the-one-who-witnesses-the-nightmare-asmodian) (intro: "Upon obtaining Zikel's Core, Asahr called to you"); [Daeva Trapped](https://metabot.gg/en/aion-2/quests/daeva-trapped-in-a-nightmare) steps. Completion verified; available by the time Forgotten Commander is turned in (its wrapper's previous quest), so "FC turned in" is at worst late, never early. Whether it opens while FC is open: owner to check (check 5) |
| `asc:oath` | The One Who Swears the Oath | 49 / 10 | `done asc:witnesses`: inferred (chapter V after IV) | tick only (beyond the cap) | [Metabot](https://metabot.gg/en/aion-2/quests/the-one-who-swears-the-oath-asmodian); C05 (thegameswiki + Metabot: Lv 49). **Outside Lv 1–45 scope** |
| `gauge` | Asmodian Ascension Gauge | 22 / 1 (Metabot type "Daeva gauge") | – | – | [Metabot](https://metabot.gg/en/aion-2/quests/asmodian-ascension-gauge); info only, the app can't read the gauge |

**Today's gates are safe in one direction.** Every Ascension gate in the app sits on or after its wrapper, the point
by which Metabot shows the quest must be open. So none is too early. The worst case is that one is shown a quest late.
`g22:0` and `g32:dreams` are completed by a manual tick only, and nothing derives them today.

**Wrapper rule (new, Metabot):** story progress past the wrapper implies the Ascension is done. For saves this means
`g22:0` and `g32:dreams` can be shown done from the story position alone (ROADMAP 0.3 "completion derived from the
story position"). `g6:0` already ticks with its story quest.

## 6. Regional quests (58)

Proposed `requires` takes each edge as the repo records it, and the `lv 10` floor is Metabot's unlock level (it
matches `rq.json` for every quest). The recommended level stays display only and is not a gate. *Today* is what
`rqAvail` does now. Each edge's sources come from `rq-chains.json` / `rq.json` with th.gl entries removed, plus
Metabot "Required first" where it renders. Whether `done` means "turned in" or "reached" for story edges is §3,
check 1.

| key | Quest | rec / unlock | proposed `requires` | today (app) | sources (no th.gl) | status |
|---|---|---|---|---|---|---|
| `rq:2202044` | Shugo-of-All-Trades: Asmodian | 12 / 10 | `lv 10`, candidate `done sq:2102040` (Contaminated Area) | `noPre`: opens at rec Lv 12 | [Metabot](https://metabot.gg/en/aion-2/quests/shugo-of-all-trades-asmodian) unlock 10 | **candidate gate: owner to check in game** |
| `rq:2202051` | Spooky Specters | 14 / 10 | `lv 10`, candidate `done sq:2102070` (Cemetery Cleanup) | `noPre`: opens at rec Lv 14 | [Metabot](https://metabot.gg/en/aion-2/quests/spooky-specters) unlock 10 | **candidate gate: owner to check in game** |
| `rq:2202010` | Hugo Mercenaries: Past and Present | 16 / 10 | `lv 10`, `done sq:2102105` (Empyrean Monolith) | reached Empyrean Monolith | [Metabot](https://metabot.gg/en/aion-2/quests/hugo-mercenaries-past-and-present) unlock 10; Empyrean Monolith: gaming.tools 2202010 | existing edge; semantics change pending check 1 |
| `rq:2202012` | Missing Mount | 16 / 10 | `lv 10`, `done sq:2102105` (Empyrean Monolith) | reached Empyrean Monolith | [Metabot](https://metabot.gg/en/aion-2/quests/missing-mount) unlock 10; Empyrean Monolith: gaming.tools 2202012 | existing edge; semantics change pending check 1 |
| `rq:2202013` | Creion Research Assistant | 16 / 10 | `lv 10`, `done sq:2102105` (Empyrean Monolith) | reached Empyrean Monolith | [Metabot](https://metabot.gg/en/aion-2/quests/creion-research-assistant) unlock 10; Empyrean Monolith: gaming.tools 2202013 | existing edge; semantics change pending check 1 |
| `rq:2202014` | Odyle Jelly Misappropriation Investigation | 16 / 10 | `lv 10`, `done sq:2102105` (Empyrean Monolith) | reached Empyrean Monolith | [Metabot](https://metabot.gg/en/aion-2/quests/odyle-jelly-misappropriation-investigation) unlock 10; Empyrean Monolith: gaming.tools 2202014 | existing edge; semantics change pending check 1 |
| `rq:2202015` | The Great Curse-Breaking Caper | 16 / 10 | `lv 10`, candidate `done sq:2102105` (Empyrean Monolith) | `noPre`: opens at rec Lv 16 | [Metabot](https://metabot.gg/en/aion-2/quests/the-great-curse-breaking-caper) unlock 10 | **candidate gate: owner to check in game** |
| `rq:2202023` | Practice Makes Perfect, Nyerk! | 16 / 10 | `lv 10`, `done sq:2102105` (Empyrean Monolith) | reached Empyrean Monolith | [Metabot](https://metabot.gg/en/aion-2/quests/practice-makes-perfect-nyerk) unlock 10; Empyrean Monolith: gaming.tools 2202023 | existing edge; semantics change pending check 1 |
| `rq:2202016` | Blade of Vengeance | 22 / 10 | `lv 10`, `done sq:2102180` (Verdant Melody) | reached Verdant Melody | [Metabot](https://metabot.gg/en/aion-2/quests/blade-of-vengeance) unlock 10; Verdant Melody: gaming.tools 2202016 | existing edge; semantics change pending check 1 |
| `rq:2202017` | In the Fang Legion's Name | 22 / 10 | `lv 10`, `done sq:2102180` (Verdant Melody), `done rq:2202016` (Blade of Vengeance), `done rq:2202014` (Odyle Jelly Misappropriation Investigation) | reached Verdant Melody + Blade of Vengeance, Odyle Jelly Misappropriation Investigation ticked | [Metabot](https://metabot.gg/en/aion-2/quests/in-the-fang-legions-name) unlock 10; Verdant Melody: gaming.tools 2202017; Blade of Vengeance: allthings.how 244377, gaming.tools 2202016, gaming.tools 2202017; Odyle Jelly Misappropriation Investigation: gaming.tools 2202017 | existing edge; semantics change pending check 1 |
| `rq:2202019` | Young Elim's Story | 22 / 10 | `lv 10`, `done sq:2102190` (Disturbed Balance) | reached Disturbed Balance | [Metabot](https://metabot.gg/en/aion-2/quests/young-elims-story) unlock 10; Disturbed Balance: gaming.tools 2202019 | existing edge; semantics change pending check 1 |
| `rq:2202036` | A Guardian's Sacrifice | 22 / 10 | `lv 10`, `done sq:2102190` (Disturbed Balance), `done rq:2202019` (Young Elim's Story) | reached Disturbed Balance + Young Elim's Story ticked | [Metabot](https://metabot.gg/en/aion-2/quests/a-guardians-sacrifice) unlock 10; Disturbed Balance: gaming.tools 2202036; Young Elim's Story: allthings.how 244366, gaming.tools 2202036 | existing edge; semantics change pending check 1 |
| `rq:2202053` | Nine Wonders of Altgard: 1st Leg | 22 / 10 | `lv 10`, `done sq:2102180` (Verdant Melody) | reached Verdant Melody | [Metabot](https://metabot.gg/en/aion-2/quests/nine-wonders-of-altgard-1st-leg) unlock 10; Verdant Melody: gaming.tools 2202053 | existing edge; semantics change pending check 1 |
| `rq:2202062` | Fight Poison with Poison | 27 / 10 | `lv 10`, `done sq:2102240` (A Collective Effort) | reached A Collective Effort | [Metabot](https://metabot.gg/en/aion-2/quests/fight-poison-with-poison) unlock 10; A Collective Effort: gaming.tools 2202062, Metabot "Required first" | existing edge; semantics change pending check 1 |
| `rq:2202011` | Hugo Mercenaries: Deep Shadow | 30 / 10 | `lv 10`, `done sq:2102280` (Canyon's Secret), `done rq:2202010` (Hugo Mercenaries: Past and Present) | reached Canyon's Secret + Hugo Mercenaries: Past and Present ticked | [Metabot](https://metabot.gg/en/aion-2/quests/hugo-mercenaries-deep-shadow) unlock 10; Canyon's Secret: **owner to check in game** (only th.gl); Hugo Mercenaries: Past and Present: **owner to check in game** (only th.gl) | edge needs owner check; edge needs owner check |
| `rq:2202018` | Her Last Favor | 30 / 10 | `lv 10`, candidate `done sq:2102280` (Canyon's Secret) | `noPre`: opens at rec Lv 30 | [Metabot](https://metabot.gg/en/aion-2/quests/her-last-favor) unlock 10 | **candidate gate: owner to check in game** |
| `rq:2202021` | An Invitation to the Past: Part 1 | 30 / 10 | `lv 10`, `done sq:2102280` (Canyon's Secret) | reached Canyon's Secret | [Metabot](https://metabot.gg/en/aion-2/quests/an-invitation-to-the-past-part-1) unlock 10; Canyon's Secret: gaming.tools 2202021 | existing edge; semantics change pending check 1 |
| `rq:2202022` | An Invitation to the Past: Part 2 | 30 / 10 | `lv 10`, `done sq:2102280` (Canyon's Secret), `done rq:2202021` (An Invitation to the Past: Part 1) | reached Canyon's Secret + An Invitation to the Past: Part 1 ticked | [Metabot](https://metabot.gg/en/aion-2/quests/an-invitation-to-the-past-part-2) unlock 10; Canyon's Secret: gaming.tools 2202022; An Invitation to the Past: Part 1: allthings.how 244363, gaming.tools 2202021, gaming.tools 2202022, https://metabot.gg/en/aion-2/quests/an-invitation-to-the-past-part-1 | existing edge; semantics change pending check 1 |
| `rq:2202037` | The Future Within the Past | 30 / 10 | `lv 10`, `done sq:2102280` (Canyon's Secret) | reached Canyon's Secret | [Metabot](https://metabot.gg/en/aion-2/quests/the-future-within-the-past) unlock 10; Canyon's Secret: gaming.tools 2202037 | existing edge; semantics change pending check 1 |
| `rq:2202020` | Hugo Mercenaries: An Old Promise | 32 / 10 | `lv 10`, `done sq:2102340` (Last of the Destruction Archons), `done rq:2202011` (Hugo Mercenaries: Deep Shadow) | reached Last of the Destruction Archons + Hugo Mercenaries: Deep Shadow ticked | [Metabot](https://metabot.gg/en/aion-2/quests/hugo-mercenaries-an-old-promise) unlock 10; Last of the Destruction Archons: gaming.tools 2202020; Hugo Mercenaries: Deep Shadow: gaming.tools 2202020 | existing edge; semantics change pending check 1 |
| `rq:2202040` | Pain Unending | 32 / 10 | `lv 10`, candidate `done sq:2102340` (Last of the Destruction Archons) | `noPre`: opens at rec Lv 32 | [Metabot](https://metabot.gg/en/aion-2/quests/pain-unending) unlock 10 | **candidate gate: owner to check in game** |
| `rq:2202070` | Nine Wonders of Altgard: 2nd Leg | 32 / 10 | `lv 10`, `done sq:2102340` (Last of the Destruction Archons), `done rq:2202053` (Nine Wonders of Altgard: 1st Leg) | reached Last of the Destruction Archons + Nine Wonders of Altgard: 1st Leg ticked | [Metabot](https://metabot.gg/en/aion-2/quests/nine-wonders-of-altgard-2nd-leg) unlock 10; Last of the Destruction Archons: gaming.tools 2202070; Nine Wonders of Altgard: 1st Leg: allthings.how 244384, allthings.how https://allthings.how/aion-2-every-impetusium-square-regional-quest-and-reward-asmodian/, gaming.tools 2202070 | existing edge; semantics change pending check 1 |
| `rq:2202029` | Traveling Merchant's Conundrum | 33 / 10 | `lv 10`, `done sq:2102370` (Blood Monument) | `noPre`: opens at rec Lv 33 | [Metabot](https://metabot.gg/en/aion-2/quests/traveling-merchants-conundrum) unlock 10; [Metabot](https://metabot.gg/en/aion-2/quests/traveling-merchants-conundrum) "Required first: Blood Monument" | **new gate, Metabot** |
| `rq:2202063` | Finders Keepers | 33 / 10 | `lv 10`, `done sq:2102360` (Scripture in the Ruins) | reached Scripture in the Ruins | [Metabot](https://metabot.gg/en/aion-2/quests/finders-keepers) unlock 10; Scripture in the Ruins: gaming.tools 2202063, Metabot "Required first" | existing edge; semantics change pending check 1 |
| `rq:2202039` | A Friend's Legacy | 37 / 10 | `lv 10`, `done sq:2102590` (Mirror of Greed), `done rq:2202012` (Missing Mount) | reached Mirror of Greed + Missing Mount ticked | [Metabot](https://metabot.gg/en/aion-2/quests/a-friends-legacy) unlock 10; Mirror of Greed: gaming.tools 2202039; Missing Mount: gaming.tools 2202039 | existing edge; semantics change pending check 1 |
| `rq:2202038` | Bloodstained Rose | 37 / 10 | `lv 10`, `done sq:2102590` (Mirror of Greed) | reached Mirror of Greed | [Metabot](https://metabot.gg/en/aion-2/quests/bloodstained-rose) unlock 10; Mirror of Greed: gaming.tools 2202038 | existing edge; semantics change pending check 1 |
| `rq:2202066` | Herb Pouch Heist | 44 / 10 | `lv 10`, candidate `done sq:2102660` (Daybreak Society Rescue Operation) | `noPre`: opens at rec Lv 44 | [Metabot](https://metabot.gg/en/aion-2/quests/herb-pouch-heist) unlock 10 | **candidate gate: owner to check in game** |
| `rq:2202067` | A Comrade's Fate | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [Metabot](https://metabot.gg/en/aion-2/quests/a-comrades-fate) unlock 10; Forgotten Commander: gaming.tools 2102800, gaming.tools 2202067 | existing edge; semantics change pending check 1 |
| `rq:2202046` | Lest We Forget | 45 / 10 | `lv 10`, `done sq:2102780` (Zikel's Core) | `noPre`: opens at rec Lv 45 | [Metabot](https://metabot.gg/en/aion-2/quests/lest-we-forget) unlock 10; [Metabot](https://metabot.gg/en/aion-2/quests/lest-we-forget) "Required first: Zikel's Core" | **new gate, Metabot** |
| `rq:2202041` | A Perfect Wedding | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [Metabot](https://metabot.gg/en/aion-2/quests/a-perfect-wedding) unlock 10; Forgotten Commander: gaming.tools 2102800, gaming.tools 2202041 | existing edge; semantics change pending check 1 |
| `rq:2202058` | Restoration Materials | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [Metabot](https://metabot.gg/en/aion-2/quests/restoration-materials) unlock 10; Forgotten Commander: gaming.tools 2102800 | existing edge; semantics change pending check 1 |
| `rq:2202056` | Lost Memories | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [Metabot](https://metabot.gg/en/aion-2/quests/lost-memories) unlock 10; Forgotten Commander: gaming.tools 2102800, gaming.tools 2202056 | existing edge; semantics change pending check 1 |
| `rq:2202050` | I'm a Believer! | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [Metabot](https://metabot.gg/en/aion-2/quests/im-a-believer) unlock 10; Forgotten Commander: gaming.tools 2102800, gaming.tools 2202050 | existing edge; semantics change pending check 1 |
| `rq:2202043` | Fallout Calmed | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander), `done rq:2202042` (Fallout) | reached Forgotten Commander + Fallout ticked | [Metabot](https://metabot.gg/en/aion-2/quests/fallout-calmed) unlock 10; Forgotten Commander: gaming.tools 2102800, gaming.tools 2202042, gaming.tools 2202043; Fallout: gaming.tools 2202042, gaming.tools 2202043 | existing edge; semantics change pending check 1 |
| `rq:2202068` | Putting a Friend to Rest | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [Metabot](https://metabot.gg/en/aion-2/quests/putting-a-friend-to-rest) unlock 10; Forgotten Commander: gaming.tools 2102800, gaming.tools 2202068 | existing edge; semantics change pending check 1 |
| `rq:2202057` | Sapling Hide-and-Seek | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander), `done rq:2202036` (A Guardian's Sacrifice), `done rq:2202019` (Young Elim's Story) | reached Forgotten Commander + A Guardian's Sacrifice, Young Elim's Story ticked | [Metabot](https://metabot.gg/en/aion-2/quests/sapling-hide-and-seek) unlock 10; Forgotten Commander: gaming.tools 2102800, gaming.tools 2202057; A Guardian's Sacrifice: gaming.tools 2202057; Young Elim's Story: gaming.tools 2202057 | existing edge; semantics change pending check 1 |
| `rq:2202054` | One Last Thing | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [Metabot](https://metabot.gg/en/aion-2/quests/one-last-thing) unlock 10; Forgotten Commander: gaming.tools 2102800, gaming.tools 2202054 | existing edge; semantics change pending check 1 |
| `rq:2202060` | Another Survivor | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander), `done rq:2202022` (An Invitation to the Past: Part 2) | reached Forgotten Commander + An Invitation to the Past: Part 2 ticked | [Metabot](https://metabot.gg/en/aion-2/quests/another-survivor) unlock 10; Forgotten Commander: gaming.tools 2102800, gaming.tools 2202060; An Invitation to the Past: Part 2: gaming.tools 2202022, gaming.tools 2202060 | existing edge; semantics change pending check 1 |
| `rq:2202042` | Fallout | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [Metabot](https://metabot.gg/en/aion-2/quests/fallout) unlock 10; Forgotten Commander: gaming.tools 2102800, gaming.tools 2202042 | existing edge; semantics change pending check 1 |
| `rq:2202052` | A Traitor Within | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander), `done rq:2202010` (Hugo Mercenaries: Past and Present), `done rq:2202023` (Practice Makes Perfect, Nyerk!) | reached Forgotten Commander + Hugo Mercenaries: Past and Present, Practice Makes Perfect, Nyerk! ticked | [Metabot](https://metabot.gg/en/aion-2/quests/a-traitor-within) unlock 10; Forgotten Commander: gaming.tools 2102800, gaming.tools 2202052; Hugo Mercenaries: Past and Present: gaming.tools 2202052; Practice Makes Perfect, Nyerk!: gaming.tools 2202052 | existing edge; semantics change pending check 1 |
| `rq:2202061` | Regular Altar Maintenance | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [Metabot](https://metabot.gg/en/aion-2/quests/regular-altar-maintenance) unlock 10; Forgotten Commander: gaming.tools 2102800, gaming.tools 2202061 | existing edge; semantics change pending check 1 |
| `rq:2202059` | Restless Spirits | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [Metabot](https://metabot.gg/en/aion-2/quests/restless-spirits) unlock 10; Forgotten Commander: gaming.tools 2102800, gaming.tools 2202059 | existing edge; semantics change pending check 1 |
| `rq:2202071` | Nine Wonders of Altgard: Final Stretch | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander), `done rq:2202070` (Nine Wonders of Altgard: 2nd Leg) | reached Forgotten Commander + Nine Wonders of Altgard: 2nd Leg ticked | [Metabot](https://metabot.gg/en/aion-2/quests/nine-wonders-of-altgard-final-stretch) unlock 10; Forgotten Commander: gaming.tools 2102800, gaming.tools 2202071; Nine Wonders of Altgard: 2nd Leg: allthings.how https://allthings.how/aion-2-every-impetusium-square-regional-quest-and-reward-asmodian/, gaming.tools 2202070, gaming.tools 2202071 | existing edge; semantics change pending check 1 |
| `rq:2202027` | Immortal Isle's Distinct Ecology | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [Metabot](https://metabot.gg/en/aion-2/quests/immortal-isles-distinct-ecology) unlock 10; Forgotten Commander: gaming.tools 2102800, gaming.tools 2202027 | existing edge; semantics change pending check 1 |
| `rq:2202069` | Spirit Isle, Where Time Has Stopped | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [Metabot](https://metabot.gg/en/aion-2/quests/spirit-isle-where-time-has-stopped) unlock 10; Forgotten Commander: gaming.tools 2102800, gaming.tools 2202069 | existing edge; semantics change pending check 1 |
| `rq:2202045` | Farewell, My Instructor | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander), `done rq:2202023` (Practice Makes Perfect, Nyerk!) | reached Forgotten Commander + Practice Makes Perfect, Nyerk! ticked | [Metabot](https://metabot.gg/en/aion-2/quests/farewell-my-instructor) unlock 10; Forgotten Commander: gaming.tools 2102800, gaming.tools 2202045; Practice Makes Perfect, Nyerk!: gaming.tools 2202045 | existing edge; semantics change pending check 1 |
| `rq:2202055` | Mind Your Own Business | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [Metabot](https://metabot.gg/en/aion-2/quests/mind-your-own-business) unlock 10; Forgotten Commander: gaming.tools 2102800, gaming.tools 2202055 | existing edge; semantics change pending check 1 |
| `rq:2202028` | Reality Bites | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [Metabot](https://metabot.gg/en/aion-2/quests/reality-bites) unlock 10; Forgotten Commander: gaming.tools 2102800, gaming.tools 2202028 | existing edge; semantics change pending check 1 |
| `rq:2202064` | Workplace Misunderstanding | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [Metabot](https://metabot.gg/en/aion-2/quests/workplace-misunderstanding) unlock 10; Forgotten Commander: gaming.tools 2102800, gaming.tools 2202064 | existing edge; semantics change pending check 1 |
| `rq:2202065` | Ravenous Recluse | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [Metabot](https://metabot.gg/en/aion-2/quests/ravenous-recluse) unlock 10; Forgotten Commander: gaming.tools 2102800, gaming.tools 2202065 | existing edge; semantics change pending check 1 |
| `rq:2202047` | Another Crisis! | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander), `done rq:2202013` (Creion Research Assistant) | reached Forgotten Commander + Creion Research Assistant ticked | [Metabot](https://metabot.gg/en/aion-2/quests/another-crisis) unlock 10; Forgotten Commander: gaming.tools 2102800, gaming.tools 2202047; Creion Research Assistant: gaming.tools 2202047 | existing edge; semantics change pending check 1 |
| `rq:2202026` | Spacetime Rift: Asmodian | 45 / 45 | `lv 45` | lv 45 | [Metabot](https://metabot.gg/en/aion-2/quests/spacetime-rift-asmodian) unlock 45 | unchanged |
| `rq:2202030` | Spacetime Rift: Unknown Species | 45 / 45 | `lv 45` | `noPre`: opens at rec Lv 45 | [Metabot](https://metabot.gg/en/aion-2/quests/spacetime-rift-unknown-species) unlock 45 | no prerequisite on Metabot; Lv 45 confirmed. "No prerequisite": owner to check in game |
| `rq:2202031` | Spacetime Rift: Unfamiliar Material | 45 / 45 | `lv 45` | lv 45 | [Metabot](https://metabot.gg/en/aion-2/quests/spacetime-rift-unfamiliar-material-asmodian) unlock 45 | unchanged |
| `rq:2202033` | Spacetime Rift: Developing Travel Goods | 45 / 45 | `lv 45` | lv 45 | [Metabot](https://metabot.gg/en/aion-2/quests/spacetime-rift-developing-travel-goods) unlock 45 | unchanged |
| `rq:2202032` | Spacetime Rift: Difference Between Here and There | 45 / 45 | `lv 45` | lv 45 | [Metabot](https://metabot.gg/en/aion-2/quests/spacetime-rift-difference-between-here-and-there) unlock 45 | unchanged |
| `rq:2202034` | Spacetime Rift: An Honest Shugo | 45 / 45 | `lv 45` | lv 45 | [Metabot](https://metabot.gg/en/aion-2/quests/spacetime-rift-an-honest-shugo) unlock 45 | unchanged |
| `rq:2202035` | Spacetime Rift: Proof | 45 / 45 | `lv 45` | `noPre`: opens at rec Lv 45 | [Metabot](https://metabot.gg/en/aion-2/quests/spacetime-rift-proof) unlock 45 | no prerequisite on Metabot; Lv 45 confirmed. "No prerequisite": owner to check in game |

`completesWith` for every regional quest is its tick (`rq:<id>`); the game has no story-side signal for it. Two
derived signals exist and are worth using, because a follow-up quest you've picked up proves its prerequisite is
turned in (edges from `rq-chains.json`):
`rq:2202016` ⇐ `started/done rq:2202017`; `rq:2202019` ⇐ `rq:2202036`; `rq:2202053` ⇐ `rq:2202070` ⇐ `rq:2202071`;
`rq:2202010` ⇐ `rq:2202011` ⇐ `rq:2202020`; `rq:2202021` ⇐ `rq:2202022` ⇐ `rq:2202060`; `rq:2202042` ⇐
`rq:2202043`. That is display-only derivation. Whether it writes ticks is an engineering / owner call.

### `noPre` quests (ISSUES "Regional quests without prerequisite data")

| Quest | Result | Opens (proposed) | Opens today | Source |
|---|---|---|---|---|
| Traveling Merchant's Conundrum | **story gate confirmed** | after Blood Monument (Lv 33) | Lv 33 | [Metabot](https://metabot.gg/en/aion-2/quests/traveling-merchants-conundrum) "Required first" |
| Lest We Forget | **story gate confirmed** | after Zikel's Core (Lv 45) | Lv 45 | [Metabot](https://metabot.gg/en/aion-2/quests/lest-we-forget) "Required first" (rq.json cites shugo.gg for this quest) |
| Shugo-of-All-Trades: Asmodian | candidate: after Contaminated Area (Lv 11) | **owner to check in game** | Lv 12 | none permitted |
| Spooky Specters | candidate: after Cemetery Cleanup (Lv 13) | **owner to check in game** | Lv 14 | none permitted |
| The Great Curse-Breaking Caper | candidate: after Empyrean Monolith (Lv 16), the same gate as its 5 Lv 16 neighbours | **owner to check in game** | Lv 16 | none permitted |
| Her Last Favor | candidate: after Canyon's Secret (Lv 30) | **owner to check in game** | Lv 30 | none permitted |
| Pain Unending | candidate: after Last of the Destruction Archons (Lv 32) | **owner to check in game** | Lv 32 | none permitted |
| Herb Pouch Heist | candidate: after Daybreak Society Rescue Operation (Lv 41) | **owner to check in game** | Lv 44 | none permitted |
| Spacetime Rift: Unknown Species | Lv 45 confirmed; no prerequisite shown | Lv 45 | Lv 45 | [Metabot](https://metabot.gg/en/aion-2/quests/spacetime-rift-unknown-species) unlocks at 45; "no prerequisite" owner to check |
| Spacetime Rift: Proof | as above | Lv 45 | Lv 45 | [Metabot](https://metabot.gg/en/aion-2/quests/spacetime-rift-proof) |

Until a candidate is confirmed, keep today's `noPre` behaviour for it (open at the recommended level). A wrong story
gate would hide a quest the game offers. The cost of the fallback is small: 3 of the 6 open today at the candidate
gate's own level. The others are Herb Pouch Heist (Lv 44 vs the Lv 41 candidate) and Shugo / Spooky (one level
late). "No prerequisite" on Metabot means none is rendered, and most regional pages render no chain block at all. It
is weak evidence, hence the owner check. allthings.how (rq.json note) says Uru sends you through the Spacetime Rift
quests "across three quests", which hints at an order. It is labelled **single source** and no gate is proposed.

## 7. "Daeva Trapped in a Nightmare"

| Field | Value | Source |
|---|---|---|
| id | 2102810 (`sq:2102810`) | Metabot (map link) |
| type / chapter | Episode · "Encountering Zikel's Core"; story quest 88 in the Metabot chain walk | Metabot |
| level | rec 45, unlocks at 45 | Metabot |
| previous / next | Forgotten Commander / "Waiting for the Next Journey" (rec 46, **unlocks at 46**) | Metabot, both pages |
| objective | "Ascend to the next dimension of power as a Daeva" → complete The One Who Witnesses the Nightmare | Metabot steps |
| giver | **owner to check in game**. Candidate: Koro at the Abyss Base, who is Forgotten Commander's turn-in on Metabot. The first draft cited th.gl's description text for this, and Metabot's page names no giver | Metabot (FC turn-in) |
| turn-in | Nemon, Outskirts Stall (nearest Kibelisk Outskirts Stall, 21 m) | Metabot |
| rewards | none listed | Metabot |

Proposed record: `requires [done sq:2102800, lv 45]`, `completesWith [reached-next]`. There is no next quest inside
the cap, so the *Turned in* tick sets `storyEnd = "Daeva Trapped in a Nightmare"`.

What adding it changes (for the 0.3 engine, not for data alone):
- `STORY_END` moves from Forgotten Commander to Daeva Trapped. A save with `storyEnd = "Forgotten Commander"` must
  read as "on Daeva Trapped". The evaluator can do that (`done sq:2102800` is true either way), so no migration is
  needed, and old builds keep reading the save. mig1's pinned diffs will change, so re-pin and review.
- `g45:0` gets `completesWith done sq:2102810`, but only if Swears the Oath is split out (§9.3).
- The 23 regional quests gated on Forgotten Commander (gaming.tools 2102800 "Dependent quests", rq-chains) and
  Witnesses all depend on Forgotten Commander. Whether they need it reached or turned in is check 1.
- MeinMMO (claims-notes, C06) says the "Lv 45 story finale needs item level 1,000". **Single source**, and it doesn't
  say which quest. If it's true it most likely applies to Witnesses' instances (Kaisinel's Collapsed Sanctum, Dream
  of Torment). Leave it out, or mark it `info`, until owner check 4.

## 8. Milestone steps (`GATES`) and route rules (`STEPS`)

"Today" is the gate `stepsOf` applies, in addition to the milestone's level, which is always a floor. In the proposed
column a predicate in **bold** is a change.

| k | Step | Today | proposed `requires` | proposed `completesWith` | source / label |
|---|---|---|---|---|---|
| `g6:0` | Complete The Being Beneath the Lake | byStory, reached `sq:2101050` | `lv 5`, `reached sq:2101050` | `done sq:2101050` | Metabot chain; wings reward: Metabot DB (C38) |
| `g9:0` | Save your Enhance Stones | lv 9 | `lv 9` | tick | advice. Milestone title "Enhancement unlocks" at Lv 9: **single source** (`VERIFIED_UNLOCKS` drops it) → §9.2 |
| `g10:0` | Extract replaced gear | lv 10 | `lv 10` | tick | advice. "Extraction at 10": **single source** (`VERIFIED_UNLOCKS` drops it) → §9.2 |
| `g10:1` | Complete Gathering Essentials (pets) | byStory | `reached sq:2102020` | `done sq:2102020` | Metabot chain; pet choice is its reward: Metabot DB |
| `g10:wisdom` | Use Wisdom Stones | lv 10 | `lv 10` | tick | advice |
| `g10:5` | Daeva Pass free track | lv 10 | `lv 10` | tick | no unlock-level source; **unlabelled today** → label or drop the level |
| `g10h:*` (13) | Lv 10 Sealed Dungeons | lv 10 | `lv 10` | tick | band from Metabot dungeon pages / allthings.how (dungeons.json); no story gate found on any source |
| `g12:0` | Complete Urgent Pursuit | byStory | `reached sq:2102065` | `done sq:2102065` | Metabot chain; reward Noble Belt (Metabot DB). **Text claims it unlocks the Daevanion board; `STORY_UNLOCKS` dropped that as unconfirmed** → §9.1 |
| `dv:*` Nezekan (8) | board nodes | blv 12 / 20 | `lv 12` (`lv 20` for `dv:ie`, `dv:ss`) | tick | board level: thegameswiki, Metabot, aion2hub (`VERIFIED_UNLOCKS`) |
| `g12:belt` | Enhance the Noble Belt | lv 13 | **`done sq:2102065`** | tick (repeatable advice) | Noble Belt is Urgent Pursuit's reward (Metabot DB); the text's "around Lv 13" agrees |
| `sd:*` g15 (11) | Lv 15 Sealed Dungeons | lv 15 | `lv 15` | tick | band (dungeons.json) |
| `g16:0` | Complete Buried Atrocities (Legions) | byStory | `reached sq:2102100` | `done sq:2102100` | Metabot chain; Legions: `STORY_UNLOCKS` (2 sources) |
| `g16:monolith` | Complete Empyrean Monolith | byStory | `reached sq:2102105` | `done sq:2102105` (quest part only; Resonate stays a tick) | Metabot chain |
| `g16:amulet` | Enhance the Revelation Amulet | lv 16 | **`done sq:2102100`** | tick | Revelation Amulet is Buried Atrocities' reward (Metabot DB); text agrees |
| `g20:0` | Zikel board opens | lv 20 | `lv 20` | tick (or `bo` logic as today) | `VERIFIED_UNLOCKS` |
| `sd:*` g20 (7), `dv:z:*` (6) | | lv 20 / 21 | `lv 20` (`lv 21` for Defense Break) | tick | band; board level; skill level (SP data) |
| `g22:0` | Complete The One Who Hears the Voice | reached `sq:2102185` | `reached sq:2102185` (unchanged; earlier opening owner to check), `done asc:perceives` (inferred), `info gauge 100%` | **`done sq:2102185`** (wrapper) | §5: completion verified (Metabot); gate owner check |
| `g22:1` | Equip stigma slot 1 | lv 22, reached `sq:2102185` | `lv 22`, **`done g22:0`** | stigma equipped (today's `stig` logic) | slot at 22: Metabot, PlayNews, KeenGamer; "Stigmas via Asahr": `STORY_UNLOCKS`. Needing Hears the Voice *done* rather than the story position: PlayNews stigmas guide (read via search summary; its robots.txt could not be checked) → **owner to check in game** (check 3) |
| `g20:exp` | Krao Cave opens | reached `sq:2102185` | `lv 20`, `reached sq:2102185`, `info "item level 200"` | tick | `STORY_UNLOCKS` "Daeva in a Dream: … Expeditions". Reached vs turned in is unknown for this one → owner check 2 |
| `g25:0` | Supply Requests | lv 25 | `lv 25` | tick | `VERIFIED_UNLOCKS` (Metabot, allthings.how) |
| `sd:*` g25 (5) | | lv 25 | `lv 25` | tick | band |
| `g27:0`, `g27:1` | Stigma slot 2, put on E | lv 27 | `lv 27`, `done g22:0` | equipped / eput (today's logic) | `VERIFIED_UNLOCKS` |
| `g30:0` | Vaizel board | lv 30 | `lv 30` | tick | `VERIFIED_UNLOCKS` |
| `g30:1` | Daily dungeon | lv 30 | `lv 30` | tick | `VERIFIED_UNLOCKS` (Metabot, thegameswiki) |
| `sd:*` g30 (7), `dv:v:*` | | lv 30 | `lv 30` | tick | band; board |
| `g32:0`, `g32:1` | Stigma slot 3, put on E | lv 32 | `lv 32`, `done g22:0` | equipped / eput | `VERIFIED_UNLOCKS` |
| `g32:dreams` | Complete The One Who Dreams | reached `sq:2102345` | `reached sq:2102345` (unchanged), `done asc:hears-the-voice` (inferred), `info gauge 100%` | **`done sq:2102345`** (wrapper) | §5: completion verified (Metabot); gate owner check |
| `sd:*` g35 (10) | | lv 35 | `lv 35` | tick | band |
| `g35:exp` | Fire Temple opens | lv 35 | `lv 35`, `info "item level 500"` | tick | `VERIFIED_UNLOCKS`; the text's "Mirror of Greed sends you in" is C10 (Metabot DB) |
| `g37:0`, `g37:1` | Stigma slot 4, rotation | lv 37 | `lv 37`, `done g22:0` | equipped / eput | `VERIFIED_UNLOCKS` |
| `g37:2` | Mirror of Greed | byStory | `reached sq:2102590` | `done sq:2102590` | Metabot chain; C10 |
| `g40:0`, `sd:*` g40 (7), `dv:t:*` | | lv 40 | `lv 40` | tick | `VERIFIED_UNLOCKS`; band |
| `g45:0` | Finish the Hero and Ascension quests | reached + turnedIn `sq:2102800` | `lv 45`, `done sq:2102800` (unchanged; see §5), `done asc:dreams` (inferred) | **`done sq:2102810`** once Swears the Oath is split out | §5, §7 (Metabot). Oath (Lv 49) can't be derived inside the cap → §9.3 |
| `g45:2` | Azphel board | lv 45 | `lv 45` | tick | `VERIFIED_UNLOCKS` |
| `g45:3` | Ascension Trial | lv 45 | `lv 45`, `info "item level 1,000 / 1,500"` | tick | C06 (gamesfuze, thegameswiki) |
| `g45:4` | AP: Stigma Shards first | lv 45 | `lv 45` | tick | C07, labelled single source in text |
| `g45:5` | Conquest | lv 45 | `lv 45`, `info "item level 700"` | tick | C08 |
| `build:*`, `story:*`, `f2p:*`, `hold:*` | route rules | always | none | tick | advice, no gate |
| `daily:0` | Supply Requests habit | text Lv 25 | `lv 25` | tick | as `g25:0` |
| `daily:1` | Duty Quests | text Lv 45 | `lv 45` | tick | C15 (thegameswiki, neonsect) |
| `daily:2` | Daily dungeon | text Lv 30 | `lv 30` | tick | as `g30:1` |
| `daily:3` | Command missions | none | none | tick | C19: no unlock level on any source (already labelled in app) |

Other key families, by rule rather than per row:

- `sp:<skill>:<lv>`: `requires lv` = the skill level's required character level (SP data; build.json sources).
  `completesWith` tick.
- Strongholds `sh:<slug>`: `requires lv lo` from Metabot's Altgard strongholds map list. Already labelled **inferred**
  ("stronghold level bands", ISSUES); quest pages say "Lv 1 / unlocks at 1" for all of them. No story gates found.
- Stigma upgrades: no gate beyond the slot being equipped and shards (today's logic).

## 9. Inconsistencies found in today's app

1. **`g12:0` text vs `STORY_UNLOCKS`.** The step says "Complete Urgent Pursuit to unlock the Daevanion board". The
   comment above `STORY_UNLOCKS` says "Dropped as unconfirmed … Daevanion via 'Urgent Pursuit' (the first board opens
   at Lv 12 by level)". Metabot lists no board unlock for Urgent Pursuit; its reward is the Noble Belt
   (Metabot). Proposal: reword to "Complete Urgent Pursuit (gives the Noble Belt)" and keep the board on level
   (`g12` already opens at Lv 12). Text change → owner approval.
2. **Lv 9 / Lv 10 milestone headings.** `g9` is titled "Enhancement unlocks" and the `g10` blurb says "Extraction and
   pets unlock". `VERIFIED_UNLOCKS` leaves out "enhancement at 9, extraction at 10" as one source. Pets are verified
   (Gathering Essentials reward). Either find a second source or soften the headings. This sits in the claims audit's
   lane; logged here because it is a gate.
3. **`g45:0` bundles a Lv 49 quest.** "The One Who Swears the Oath" (rec 49) can't be done or derived inside the
   Lv 45 scope, so `g45:0` can never be derived complete. Proposal: `g45:0` means "Witnesses the Nightmare / Daeva
   Trapped" (derivable), and Oath becomes an optional informational line, either in the same card's text or as a new
   key (`g45:oath`). Narrowing `g45:0`'s meaning doesn't reuse a retired key, and old ticks stay true, but engineering
   should confirm against the key rules (ARCHITECTURE §1).
4. `rq.json` carries `inAppQUESTS: false` for Forgotten Commander. FC has been in `QUESTS_X` since story-40-45, so the
   field is stale. Harmless; drop it in 5b.
5. Metabot's bare slugs `empyrean-monolith`, `daeva-in-a-dream` and the Ascension slugs resolve to the **Elyos**
   quest. `story.json` / `QUESTS_X` sources should be checked for this in 5b; the v2 sources registry should store the
   game id, not the slug.

## 10. Fields v2 needs

From the findings above; for the 5a schema doc (Tech Lead) and its review.

1. **`id`** per story, Ascension and regional quest = game quest id where a permitted source gives one (`sq:` /
   `rq:` from Metabot); a stable slug for Ascension quests until an id is confirmed. Names are display only. Gates
   reference ids, never names (today `q.story`, `QUEST_STEPS` and `qsteps` are keyed by name; saves keep their name
   keys, and the evaluator maps them).
2. **`requires`**: an all-of list of predicates from §2 (`lv`, `reached`, `done`, `info`). `done` must work for
   `sq`, `rq`, `asc` and step keys. **`any`** is needed for nothing found so far. Keep the schema open for it, but
   don't build it.
3. **`completesWith`**: any-of list. A tick always counts. Story quests: `reached next`. Wrapped Ascensions:
   `done <wrapper>`. Regional prerequisites: optional `startedOrDone <follow-up>` (display only, owner call).
4. **Story ordering**: `prev` per story quest (Metabot *Previous quest*), not array position. The evaluator builds the
   order and can check it (one predecessor each, no gaps). `storyEnd` keeps its meaning: the last in-scope quest
   turned in.
5. **`wraps`** on a story quest: the Ascension id its objective completes (4 records). This is the basis for derived
   Ascension completion.
6. **`unlockLv`** and **`recLv`** as separate fields (Metabot has both). Only `unlockLv` gates; `recLv` places the item
   in a milestone.
7. **Per-gate provenance**: each `requires` entry carries `src` (list of source ids from the registry, with the field
   name, e.g. `metabot:traveling-merchants-conundrum#required-first`) and `label` (`verified` / `single-source` /
   `inferred` / `disputed` / **`owner-check`**). `verifiedAt` per record (ROADMAP 5a). Today `requiresSrc` is per
   quest, not per edge, which is why the `noPre` holes and the th.gl-only edges went unnoticed.
8. **The sources registry needs a `crawlPolicy` per source** (`allowed` / `excluded` / `unchecked`, plus the date
   checked). The validator then refuses an `excluded` source, as th.gl now is, and flags `unchecked` ones.
9. **`info` predicates** for what the app can't track (item level, Ascension Gauge). They are shown, never block
   Next up, and never count as unmet in the invariant test.
10. **`scope`** (`inCap: false`) for records beyond Lv 45 (Swears the Oath, Waiting for the Next Journey), so the
    chain stays complete without leaking into Next up.
11. **No new save fields.** Everything here derives from `level`, `quest`, `storyEnd` and `checks`.

Golden-master impact to list for owner approval (ROADMAP 0.3): (a) the 43 regional quests that are story-gated today
(`RQ_STATS.story`) open one story quest later, **only if** owner check 1 confirms "turned in" (estimate ~70%, §3); (b)
2 former `noPre` quests (Traveling Merchant's Conundrum, Lest We Forget) open on a story gate instead of their
recommended level, giving 45 story-gated quests, or up to 51 if the 6 candidates are confirmed in game (Herb Pouch
Heist would move *earlier*, from Lv 44 to Lv 41); (c) `g22:0` / `g32:dreams` show done from the story position; (d)
the story end moves to Daeva Trapped.

### Repo records that still cite aion2.th.gl (owner rule follow-up; not changed here)

This report changes no data. These records cite th.gl today and need re-sourcing or a label. That can happen in 5b,
or in a data patch before the freeze.

| Where | What | Other source on record | Proposal |
|---|---|---|---|
| `CLAUDE.md` (source policy), `docs/team/data-research.md` | th.gl listed as a game-database source | – | remove th.gl; add the robots.txt rule (owner edits CLAUDE.md) |
| `data/claims.json` C36, C37 (+ `claims-notes.md`) | Ascension gates for Dreams / Witnesses (th.gl Prerequisites / Unlocks) | wrapper quests on Metabot show each is open **by** its wrapper | re-source to Metabot step text ("open by the wrapper": verified); "not earlier" → owner check |
| `data/rq-chains.json`, 24 entries | th.gl listed alongside gaming.tools (23 Forgotten Commander edges, One Last Thing) | gaming.tools 2102800 "Dependent quests" / 2202054 | drop the th.gl URL; the gaming.tools citation remains |
| `data/rq-chains.json`: Hugo Mercenaries: Deep Shadow ← Canyon's Secret, ← Past and Present | **th.gl only** | none (Metabot renders no chain block for it) | owner to check in game (check 9) |
| `data/rq.json` `requiresSrc` | Hugo Mercenaries: Deep Shadow, Restoration Materials, One Last Thing | Restoration Materials: gaming.tools 2102800 via rq-chains; One Last Thing: gaming.tools 2202054 | drop th.gl; Deep Shadow as above |
| `data/DATA_SOURCES.md`, Sources card (`tools/gen/gen-block.js`, built pages) | 7 th.gl links | – | removed by `npm run gen` once the data above is changed |
| `src/data/tips.js` (Regional quests tip) | **user-facing** source line "Metabot quest pages, aion2.gaming.tools, aion2.th.gl, allthings.how" | the other three | drop "aion2.th.gl" (text change → owner approval) |
| `CHANGELOG.md` 0.1.3, `docs/ISSUES.md`, `tools/research/`, `tools/history/` | historical mentions / research scripts | – | history stays as written |

Open question for the owner: aion2.gaming.tools, allthings.how, playnews.gg, wikily.gg, shugo.gg and aion2hub.com
couldn't be reached from this session, so their robots.txt wasn't checked. The existing edges lean on gaming.tools.
Whether that is acceptable should be checked from a machine that can reach it.

## 11. Owner in-game checks

To batch with the colour-sprint session (HANDOFF). Each check is a concrete observation; screenshots go to the private
repo.

1. **Gate semantics (blocks §3; estimate for regional quests ~70%, no permitted source).** On a character whose
   current story quest is A Collective Effort: is "Fight Poison with Poison" offered at Viron (Guide Rest Stop)? Then
   turn in A Collective Effort and look again. "Turned in" predicts not offered → offered. Any regional pair works,
   e.g. Lest We Forget around Zikel's Core (gate confirmed on Metabot). This is the only test of the meaning on a
   regional quest.
2. **Krao Cave.** Does the Krao Cave Expedition open while "Daeva in a Dream" is open, or only after it is turned in?
3. **Stigma slot 1.** Does slot 1 open on reaching Lv 22, or only after "The One Who Hears the Voice" is complete?
4. **Lv 45 finale item level.** Does "The One Who Witnesses the Nightmare" or "Daeva Trapped in a Nightmare" ask for
   an item level (MeinMMO: 1,000)? Note the number if one is shown.
5. **Daeva Trapped in a Nightmare and Witnesses.** Is Witnesses offered while Forgotten Commander is still open, or
   only after it is turned in? After turning in FC, who starts Daeva Trapped (candidate: Koro at the Abyss Base)? Does
   it complete as soon as Witnesses is done? (Its turn-in is Nemon at Outskirts Stall.)
6. **Ascension gates.** (6a) Is "The One Who Perceives" offered before "The Being Beneath the Lake" is turned in?
   **Answered 2026-10-15 (owner, `owner:2026-10-15-alt-26`): no. It starts automatically when The Being Beneath the Lake
   is turned in (`done sq:2101050`), and is not offered before.** (6b) Is "The One Who Hears the Voice" offered on
   Verdant Melody, or only on Daeva in a Dream? Still open (§5). The owner's Ascension Gauge Level 1 tooltip needs
   Verdant Melody Complete, "The One Who Hears the Voice" (text cut off) and 100% gauge progress; gauge points come from
   Episode, Regional and Ascension quests, Sealed Dungeons and Strongholds.
7. **Six `noPre` candidates.** Does each open right after its candidate story quest? Shugo-of-All-Trades after
   Contaminated Area, Spooky Specters after Cemetery Cleanup, The Great Curse-Breaking Caper after Empyrean
   Monolith, Her Last Favor after Canyon's Secret, Pain Unending after Last of the Destruction Archons, Herb Pouch
   Heist after Daybreak Society Rescue Operation. Herb Pouch Heist is the most informative (Lv 41 vs 44). Note the
   giver or the map marker as each one appears.
8. **Spacetime Rift.** At Lv 45, are all seven offered at once with nothing else needed, or one after another?
9. **Hugo Mercenaries: Deep Shadow.** Does it need Canyon's Secret (and Past and Present) done? It is the one
   existing edge with only th.gl behind it.

Already on the HANDOFF list and unchanged by this report: Kibelisk / Command unlock levels, Daevanion points at 16/17,
respec cost after 31, expedition cap, reset time.

## Sources

- Metabot quest pages, `https://metabot.gg/en/aion-2/quests/<slug>`, fetched 2026-10-14 (robots.txt: `Allow: /`).
  These are: the 88 story pages, reached by walking *Previous quest* links from "Daeva Trapped in a Nightmare" (each
  linked in §4); the 58 regional pages (linked in §6); the Asmodian Ascension pages (`…-asmodian`); the Asmodian
  Ascension Gauge; Waiting for the Next Journey; Spread Your Wings, The Being Beneath the Lake, Gathering Essentials,
  Urgent Pursuit, Buried Atrocities and Forgotten Commander (rewards, steps).
- Existing repo evidence, not re-fetched: `data/rq.json` (`requiresSrc`, aion2.gaming.tools), `data/rq-chains.json`
  (gaming.tools, allthings.how; th.gl entries ignored), `data/claims-notes.md` (C05, C06, C10, C36–C38),
  `src/data/story.js` (`QUEST_STEPS`, `STORY_UNLOCKS`, `VERIFIED_UNLOCKS`).
- Not cited: aion2.th.gl (owner rule, robots.txt). A first draft of this report used it; nothing here depends on it.

New URLs that 5b will need in the sources registry and `data/DATA_SOURCES.md`: the Metabot pages for every story and
Ascension quest (the chain walk above), replacing the 7 th.gl links.
