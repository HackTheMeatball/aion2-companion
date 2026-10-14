# Prerequisite gates for 0.3 (research report)

Data & Research, 2026-10-14. Research only: no app code or data changed. Input for ROADMAP 0.2 step 5a (schema:
`requires` / `completesWith` on every step) and 0.3 (requirement evaluator, the prerequisite audit). The gates are
loaded into the v2 format after 5b. They are not hand-patched into `data/*.json` now, because `data/` and `tools/gen/`
freeze while 5b runs.

## 1. Summary

1. **Every story and regional prerequisite the app has is confirmed by game-database fields from both ends.** I walked
   the whole Asmodian story chain on aion2.th.gl via its *Previous Quest* fields: 88 quests from "Ishalgen" to
   "Daeva Trapped in a Nightmare". Its order matches `QUESTS` exactly. Each of the 58 regional quests'
   *Prerequisites* matches the story quest's *Unlocks* list on the same database. All 43 story edges and 17 regional
   edges in `rq-chains.json` are reproduced; none contradicts.
2. **8 of the 10 `noPre` quests now have a sourced story gate** (th.gl *Prerequisites* + *Unlocks*; Metabot "Required
   first" also confirms 2 of them). The other 2, Spacetime Rift: Unknown Species and Proof, have no prerequisite on
   either database and unlock at Lv 45, the same as the other five Spacetime Rift quests. `noPre` can be retired.
3. **Gate semantics (D9, ISSUES "Story gate semantics"): a database prerequisite most likely means the quest is turned
   in, not reached.** For regional quests the confidence is **~70%**: all four checks that agree (§3) are Ascension
   quests, and no regional quest has been checked. If it holds, the app opens its **43 story-gated regional quests**
   **one story quest early** today (`RQ_STATS.story`), because it reads `requiresStory: X` as "story has reached X".
   With the 8 new `noPre` gates (point 2), the proposal gates **51** regional quests on a story quest turned in. The
   Ascension steps already use "turned in" (0.1.3). This is the largest correctness finding. It changes Next up for
   many saves, so it needs owner approval as a product change (ROADMAP 0.3). It also needs owner in-game check 1
   (§11) before it is built.
4. **Each in-cap Ascension quest is the only objective of a "wrapper" story quest.** These are Spread Your Wings →
   Perceives, Daeva in a Dream → Hears the Voice, A Daeva Dreaming Anew → Dreams, and Daeva Trapped in a Nightmare →
   Witnesses the Nightmare. So Ascension completion can be **derived from the story position**, with no new state.
5. **"Daeva Trapped in a Nightmare"** (q 2102810) is story quest 88 of 89 and the last one inside the Lv 45 cap.
   Quest 89, "Waiting for the Next Journey", unlocks at Lv 46. Adding quest 88 lets `g45:0` derive its completion
   (§7).
6. **Five inconsistencies in today's app**, found on the way (§9). The main ones: the `g12:0` Daevanion-board claim, the
   Lv 9 / Lv 10 "unlock" milestones that `VERIFIED_UNLOCKS` itself rejects as single-source, and `g45:0` bundling the
   Lv 49 quest.

## 2. Method and source reachability

- **aion2.th.gl** (game database, counts as a source on its own per CLAUDE.md), `https://aion2.th.gl/db/quests/q_<id>`.
  The rendered HTML has labelled sections. I used *Previous Quest* / *Next Quest* (story), *Prerequisites* (the quest
  needs these), *Unlocks* (the reverse direction), *Unlock Level* and *Recommended Level*. 148 pages were fetched with
  `curl`, at most about one request per second: 88 story, 58 regional, 6 Ascension / gauge pages and 2 others.
- **Metabot** quest pages give step text, rewards, "Unlocks at", and a "Required first" row in the quest-chain block
  when it is rendered (only 4 of 58 regional pages render it). For Ascension and some story quests the bare slug is the
  **Elyos** page; the Asmodian page is `…-asmodian`. `empyrean-monolith` and `daeva-in-a-dream` without a suffix show
  the Elyos version.
- **Not reachable from this session** (proxy `CONNECT 403`): aion2.gaming.tools, allthings.how, playnews.gg. Search
  result summaries were used for PlayNews' wording only (§3). rq.json's earlier gaming.tools citations
  (`requiresSrc`) still stand as the second database for the 43 old edges.
- Not used: Game8 (policy), WebFetch (team note). No packet, memory or screenshot data.

### Proposed ids

| Kind | Id | Example | Note |
|---|---|---|---|
| Story quest | `sq:<game id>` | `sq:2102240` A Collective Effort | game id from th.gl / Metabot; the name stays display only |
| Ascension quest | `asc:<game id>` | `asc:2602010` The One Who Hears the Voice | new records (today only text inside milestone steps) |
| Ascension Gauge | `gauge:2702010` | Asmodian Ascension Gauge | th.gl type "Daevagauge", prerequisite Perceives; not trackable in the app |
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

In a linear chain `done sq:X` ≡ `reached sq:next(X)`. I still recommend storing `done sq:X` exactly as the database
states it. The record then reads like its source, and a later story insertion (as with quest 88) can't silently
shift a gate.

## 3. Gate semantics: "turned in", not "reached"

The question (ISSUES, E4 #9): does a story prerequisite X mean "X accepted / reached" or "X turned in"?

Four checks. Each only works if a prerequisite means **turned in**:

| # | Prerequisite (th.gl field) | Independent evidence | Result if "turned in" | Result if "reached" |
|---|---|---|---|---|
| 1 | Hears the Voice needs **Verdant Melody** | PlayNews: open once the main story has "progressed up to the Lv 22 quest" Daeva in a Dream (+ gauge 100%) | Verdant Melody turned in = on Daeva in a Dream ✔ | one quest early ✘ |
| 2 | Hears the Voice needs **Verdant Melody** | Daeva in a Dream's first objective is "complete The One Who Hears the Voice" (Metabot steps, `QUEST_STEPS`) | the quest is offered while you're on its wrapper ✔ | it would be offered a quest before its wrapper (possible, but no source shows it) |
| 3 | Dreams needs **Last of the Destruction Archons** | A Daeva Dreaming Anew's only objective is completing Dreams (claims C36) | ✔ (the 0.1.3 gate) | ✘ |
| 4 | Witnesses needs **Forgotten Commander** | Daeva Trapped in a Nightmare (Previous Quest: Forgotten Commander) has one objective, completing Witnesses (Metabot) | ✔ | ✘ |

Metabot labels the field **"Required first"**, which also reads as "finish this first". Regional → regional edges
(e.g. Fallout → Fallout Calmed) are "turned in" in the app already.

**Verdict: inferred.** For Ascension quests it is strong: 4 consistent checks on 2 sites. For **regional quests
it is ~70%**, because all four checks are Ascension quests. The step from there to regional quests assumes the database
uses one meaning for every *Prerequisites* field. That is plausible, since it is the same field on the same site, but
no regional quest confirms it. Metabot's "Required first" wording is the only regional-side hint. It is not yet seen
in game, so it stays on the owner's list as check 1 (§11), which is the deciding test. The app is internally
inconsistent today. Ascension steps use "turned in" (`story: "A Daeva Dreaming Anew"`, `turnedIn: "Forgotten
Commander"`), while the 43 story-gated regional quests (`RQ_STATS.story`) use "reached" (`rqAvail`:
`cur >= storyIdx(q.story)`).

**Consequence (if check 1 confirms it):** the 43 quests gated today move one story quest later. The 8 former `noPre`
quests get a "turned in" gate for the first time (§6), so 51 regional quests in total end up on a story-turned-in
gate. Examples: Fight Poison with Poison
opens on Land of Rifts, not on A Collective Effort. The 23 Forgotten-Commander quests open after FC is **turned in**,
not while it is open. This is an intended golden-master change; list it per ROADMAP 0.3 for owner approval.

**D9 fit:** D9 keeps "story has reached X" as the default and adds "turned in" as a separate gate. The proposal uses
both and changes neither meaning. Regional gates move from `reached` to `done` because their source says "turned
in". The data changes (which predicate), not the semantics.

**Unconfirmed counter-signal:** ISSUES gives "Fight Poison with Poison at Preparations for Restoration" as an
example. If that was an in-game sighting, the quest was offered *two* quests before A Collective Effort was turned
in, which fits neither meaning. No record says where it came from. Owner check 1 (§11) settles it.

## 4. Story quests (88, Lv 1–45)

Linear chain, one predecessor each (th.gl *Previous Quest*; order identical to `QUESTS` + `QUESTS_X`). Unlock levels
are 10 from Finding Nemon onwards, none shown for 1–9, and 45 for Forgotten Commander and Daeva Trapped (th.gl,
matching Metabot "Unlocks at"). A story quest's `completesWith` is the next quest being reached. The story position
already stores this, so story completion is derived, never ticked (ROADMAP 0.3). Source for every row: th.gl page
(linked id) *Previous Quest* / *Next Quest*. Second source: `QUESTS` (AION2HUB 1–40, Metabot 41–45) gives the same
order.

| # | id | Quest | Lv (rec / unlock) | requires | completesWith |
|---|---|---|---|---|---|
| 1 | [2100010](https://aion2.th.gl/db/quests/q_2100010) | Ishalgen | 1 / — | — | `reached sq:2101010` |
| 2 | [2101010](https://aion2.th.gl/db/quests/q_2101010) | A Village in the Fog | 2 / — | `done sq:2100010` | `reached sq:2101020` |
| 3 | [2101020](https://aion2.th.gl/db/quests/q_2101020) | Prepare to Escape | 2 / — | `done sq:2101010` | `reached sq:2101030` |
| 4 | [2101030](https://aion2.th.gl/db/quests/q_2101030) | Shadow Forest | 3 / — | `done sq:2101020` | `reached sq:2101040` |
| 5 | [2101040](https://aion2.th.gl/db/quests/q_2101040) | Isolated Lake | 4 / — | `done sq:2101030` | `reached sq:2101050` |
| 6 | [2101050](https://aion2.th.gl/db/quests/q_2101050) | The Being Beneath the Lake | 5 / — | `done sq:2101040` | `reached sq:2101060` |
| 7 | [2101060](https://aion2.th.gl/db/quests/q_2101060) | Spread Your Wings | 6 / — | `done sq:2101050` | `reached sq:2101070` |
| 8 | [2101070](https://aion2.th.gl/db/quests/q_2101070) | Signs of a Crash Landing | 6 / — | `done sq:2101060` | `reached sq:2101080` |
| 9 | [2101080](https://aion2.th.gl/db/quests/q_2101080) | Prison Compound Infiltration Plan | 7 / — | `done sq:2101070` | `reached sq:2101090` |
| 10 | [2101090](https://aion2.th.gl/db/quests/q_2101090) | Brigade Prison Compound Infiltration Operation | 7 / — | `done sq:2101080` | `reached sq:2101100` |
| 11 | [2101100](https://aion2.th.gl/db/quests/q_2101100) | The Longest Night | 9 / — | `done sq:2101090` | `reached sq:2102010` |
| 12 | [2102010](https://aion2.th.gl/db/quests/q_2102010) | Finding Nemon | 10 / 10 | `done sq:2101100` | `reached sq:2102015` |
| 13 | [2102015](https://aion2.th.gl/db/quests/q_2102015) | Survival Supplies | 10 / 10 | `done sq:2102010` | `reached sq:2102020` |
| 14 | [2102020](https://aion2.th.gl/db/quests/q_2102020) | Gathering Essentials | 10 / 10 | `done sq:2102015` | `reached sq:2102030` |
| 15 | [2102030](https://aion2.th.gl/db/quests/q_2102030) | Crash Site Rendezvous | 11 / 10 | `done sq:2102020` | `reached sq:2102040` |
| 16 | [2102040](https://aion2.th.gl/db/quests/q_2102040) | Contaminated Area | 11 / 10 | `done sq:2102030` | `reached sq:2102050` |
| 17 | [2102050](https://aion2.th.gl/db/quests/q_2102050) | Express Daeva Delivery | 12 / 10 | `done sq:2102040` | `reached sq:2102060` |
| 18 | [2102060](https://aion2.th.gl/db/quests/q_2102060) | Veiled Truth | 12 / 10 | `done sq:2102050` | `reached sq:2102065` |
| 19 | [2102065](https://aion2.th.gl/db/quests/q_2102065) | Urgent Pursuit | 13 / 10 | `done sq:2102060` | `reached sq:2102070` |
| 20 | [2102070](https://aion2.th.gl/db/quests/q_2102070) | Cemetery Cleanup | 13 / 10 | `done sq:2102065` | `reached sq:2102080` |
| 21 | [2102080](https://aion2.th.gl/db/quests/q_2102080) | Back on the Scent | 14 / 10 | `done sq:2102070` | `reached sq:2102090` |
| 22 | [2102090](https://aion2.th.gl/db/quests/q_2102090) | Dead Men Tell No Tales | 15 / 10 | `done sq:2102080` | `reached sq:2102100` |
| 23 | [2102100](https://aion2.th.gl/db/quests/q_2102100) | Buried Atrocities | 16 / 10 | `done sq:2102090` | `reached sq:2102105` |
| 24 | [2102105](https://aion2.th.gl/db/quests/q_2102105) | Empyrean Monolith | 16 / 10 | `done sq:2102100` | `reached sq:2102110` |
| 25 | [2102110](https://aion2.th.gl/db/quests/q_2102110) | A New Lead | 18 / 10 | `done sq:2102105` | `reached sq:2102115` |
| 26 | [2102115](https://aion2.th.gl/db/quests/q_2102115) | Malice Laid Bare | 18 / 10 | `done sq:2102110` | `reached sq:2102120` |
| 27 | [2102120](https://aion2.th.gl/db/quests/q_2102120) | Broken Fang | 19 / 10 | `done sq:2102115` | `reached sq:2102130` |
| 28 | [2102130](https://aion2.th.gl/db/quests/q_2102130) | Watchful Eyes | 19 / 10 | `done sq:2102120` | `reached sq:2102140` |
| 29 | [2102140](https://aion2.th.gl/db/quests/q_2102140) | Imminent Threat | 20 / 10 | `done sq:2102130` | `reached sq:2102150` |
| 30 | [2102150](https://aion2.th.gl/db/quests/q_2102150) | Crossroad | 20 / 10 | `done sq:2102140` | `reached sq:2102160` |
| 31 | [2102160](https://aion2.th.gl/db/quests/q_2102160) | Creeping Shadow | 21 / 10 | `done sq:2102150` | `reached sq:2102170` |
| 32 | [2102170](https://aion2.th.gl/db/quests/q_2102170) | Children of the Elim | 21 / 10 | `done sq:2102160` | `reached sq:2102175` |
| 33 | [2102175](https://aion2.th.gl/db/quests/q_2102175) | In the Elims' Name | 21 / 10 | `done sq:2102170` | `reached sq:2102180` |
| 34 | [2102180](https://aion2.th.gl/db/quests/q_2102180) | Verdant Melody | 22 / 10 | `done sq:2102175` | `reached sq:2102185` |
| 35 | [2102185](https://aion2.th.gl/db/quests/q_2102185) | Daeva in a Dream | 22 / 10 | `done sq:2102180` | `reached sq:2102190` |
| 36 | [2102190](https://aion2.th.gl/db/quests/q_2102190) | Disturbed Balance | 22 / 10 | `done sq:2102185` | `reached sq:2102200` |
| 37 | [2102200](https://aion2.th.gl/db/quests/q_2102200) | Searching for Survivors | 24 / 10 | `done sq:2102190` | `reached sq:2102201` |
| 38 | [2102201](https://aion2.th.gl/db/quests/q_2102201) | Prison Break | 24 / 10 | `done sq:2102200` | `reached sq:2102202` |
| 39 | [2102202](https://aion2.th.gl/db/quests/q_2102202) | Finding Stolen Relics | 24 / 10 | `done sq:2102201` | `reached sq:2102210` |
| 40 | [2102210](https://aion2.th.gl/db/quests/q_2102210) | Voice of Rage | 25 / 10 | `done sq:2102202` | `reached sq:2102220` |
| 41 | [2102220](https://aion2.th.gl/db/quests/q_2102220) | Tangled Past | 25 / 10 | `done sq:2102210` | `reached sq:2102225` |
| 42 | [2102225](https://aion2.th.gl/db/quests/q_2102225) | The High Priest Slumbers | 26 / 10 | `done sq:2102220` | `reached sq:2102230` |
| 43 | [2102230](https://aion2.th.gl/db/quests/q_2102230) | Striving for Coexistence | 26 / 10 | `done sq:2102225` | `reached sq:2102235` |
| 44 | [2102235](https://aion2.th.gl/db/quests/q_2102235) | Preparations for Restoration | 27 / 10 | `done sq:2102230` | `reached sq:2102240` |
| 45 | [2102240](https://aion2.th.gl/db/quests/q_2102240) | A Collective Effort | 27 / 10 | `done sq:2102235` | `reached sq:2102250` |
| 46 | [2102250](https://aion2.th.gl/db/quests/q_2102250) | Land of Rifts | 29 / 10 | `done sq:2102240` | `reached sq:2102255` |
| 47 | [2102255](https://aion2.th.gl/db/quests/q_2102255) | Dying Light | 30 / 10 | `done sq:2102250` | `reached sq:2102260` |
| 48 | [2102260](https://aion2.th.gl/db/quests/q_2102260) | Contaminated Sacred Tree | 30 / 10 | `done sq:2102255` | `reached sq:2102270` |
| 49 | [2102270](https://aion2.th.gl/db/quests/q_2102270) | The Past Revealed | 30 / 10 | `done sq:2102260` | `reached sq:2102280` |
| 50 | [2102280](https://aion2.th.gl/db/quests/q_2102280) | Canyon's Secret | 30 / 10 | `done sq:2102270` | `reached sq:2102300` |
| 51 | [2102300](https://aion2.th.gl/db/quests/q_2102300) | Bitter Reality | 32 / 10 | `done sq:2102280` | `reached sq:2102310` |
| 52 | [2102310](https://aion2.th.gl/db/quests/q_2102310) | Eye of the Red Tower | 32 / 10 | `done sq:2102300` | `reached sq:2102320` |
| 53 | [2102320](https://aion2.th.gl/db/quests/q_2102320) | The Survivors | 32 / 10 | `done sq:2102310` | `reached sq:2102330` |
| 54 | [2102330](https://aion2.th.gl/db/quests/q_2102330) | Rescue Operation | 32 / 10 | `done sq:2102320` | `reached sq:2102340` |
| 55 | [2102340](https://aion2.th.gl/db/quests/q_2102340) | Last of the Destruction Archons | 32 / 10 | `done sq:2102330` | `reached sq:2102345` |
| 56 | [2102345](https://aion2.th.gl/db/quests/q_2102345) | A Daeva Dreaming Anew | 32 / 10 | `done sq:2102340` | `reached sq:2102350` |
| 57 | [2102350](https://aion2.th.gl/db/quests/q_2102350) | Last Refuge | 33 / 10 | `done sq:2102345` | `reached sq:2102360` |
| 58 | [2102360](https://aion2.th.gl/db/quests/q_2102360) | Scripture in the Ruins | 33 / 10 | `done sq:2102350` | `reached sq:2102370` |
| 59 | [2102370](https://aion2.th.gl/db/quests/q_2102370) | Blood Monument | 33 / 10 | `done sq:2102360` | `reached sq:2102380` |
| 60 | [2102380](https://aion2.th.gl/db/quests/q_2102380) | Impending Threat | 34 / 10 | `done sq:2102370` | `reached sq:2102390` |
| 61 | [2102390](https://aion2.th.gl/db/quests/q_2102390) | Visible Trap | 34 / 10 | `done sq:2102380` | `reached sq:2102400` |
| 62 | [2102400](https://aion2.th.gl/db/quests/q_2102400) | Destruction Archon Underground Fortress | 34 / 10 | `done sq:2102390` | `reached sq:2102450` |
| 63 | [2102450](https://aion2.th.gl/db/quests/q_2102450) | Enemy Territory | 35 / 10 | `done sq:2102400` | `reached sq:2102460` |
| 64 | [2102460](https://aion2.th.gl/db/quests/q_2102460) | Powder of Death | 35 / 10 | `done sq:2102450` | `reached sq:2102470` |
| 65 | [2102470](https://aion2.th.gl/db/quests/q_2102470) | Creion of Gribade | 36 / 10 | `done sq:2102460` | `reached sq:2102480` |
| 66 | [2102480](https://aion2.th.gl/db/quests/q_2102480) | Frozen Fafnite | 36 / 10 | `done sq:2102470` | `reached sq:2102550` |
| 67 | [2102550](https://aion2.th.gl/db/quests/q_2102550) | Inevitable Encounter | 37 / 10 | `done sq:2102480` | `reached sq:2102565` |
| 68 | [2102565](https://aion2.th.gl/db/quests/q_2102565) | Unveiling the Truth | 37 / 10 | `done sq:2102550` | `reached sq:2102575` |
| 69 | [2102575](https://aion2.th.gl/db/quests/q_2102575) | Lake of Confrontation | 37 / 10 | `done sq:2102565` | `reached sq:2102585` |
| 70 | [2102585](https://aion2.th.gl/db/quests/q_2102585) | An Ill Fate's Resolution | 37 / 10 | `done sq:2102575` | `reached sq:2102590` |
| 71 | [2102590](https://aion2.th.gl/db/quests/q_2102590) | Mirror of Greed | 37 / 10 | `done sq:2102585` | `reached sq:2102600` |
| 72 | [2102600](https://aion2.th.gl/db/quests/q_2102600) | Fafnite's Whereabouts | 40 / 10 | `done sq:2102590` | `reached sq:2102610` |
| 73 | [2102610](https://aion2.th.gl/db/quests/q_2102610) | Exiled Ritualist | 40 / 10 | `done sq:2102600` | `reached sq:2102612` |
| 74 | [2102612](https://aion2.th.gl/db/quests/q_2102612) | Healing Herbs | 40 / 10 | `done sq:2102610` | `reached sq:2102615` |
| 75 | [2102615](https://aion2.th.gl/db/quests/q_2102615) | Treatment | 40 / 10 | `done sq:2102612` | `reached sq:2102620` |
| 76 | [2102620](https://aion2.th.gl/db/quests/q_2102620) | Symbol of Liberation | 40 / 10 | `done sq:2102615` | `reached sq:2102650` |
| 77 | [2102650](https://aion2.th.gl/db/quests/q_2102650) | Daybreak Society | 41 / 10 | `done sq:2102620` | `reached sq:2102660` |
| 78 | [2102660](https://aion2.th.gl/db/quests/q_2102660) | Daybreak Society Rescue Operation | 41 / 10 | `done sq:2102650` | `reached sq:2102670` |
| 79 | [2102670](https://aion2.th.gl/db/quests/q_2102670) | The Breaking of the Day | 42 / 10 | `done sq:2102660` | `reached sq:2102680` |
| 80 | [2102680](https://aion2.th.gl/db/quests/q_2102680) | Chief of the Black Claw | 42 / 10 | `done sq:2102670` | `reached sq:2102690` |
| 81 | [2102690](https://aion2.th.gl/db/quests/q_2102690) | High Priest's Fafnite | 43 / 10 | `done sq:2102680` | `reached sq:2102750` |
| 82 | [2102750](https://aion2.th.gl/db/quests/q_2102750) | The High Priest Awakens | 44 / 10 | `done sq:2102690` | `reached sq:2102760` |
| 83 | [2102760](https://aion2.th.gl/db/quests/q_2102760) | Lingering Apparitions | 44 / 10 | `done sq:2102750` | `reached sq:2102770` |
| 84 | [2102770](https://aion2.th.gl/db/quests/q_2102770) | Blood Barrier | 44 / 10 | `done sq:2102760` | `reached sq:2102780` |
| 85 | [2102780](https://aion2.th.gl/db/quests/q_2102780) | Zikel's Core | 45 / 10 | `done sq:2102770` | `reached sq:2102781` |
| 86 | [2102781](https://aion2.th.gl/db/quests/q_2102781) | Farewells | 45 / 10 | `done sq:2102780` | `reached sq:2102800` |
| 87 | [2102800](https://aion2.th.gl/db/quests/q_2102800) | Forgotten Commander | 45 / 45 | `done sq:2102781`, `lv 45` | `reached sq:2102810` |
| 88 | [2102810](https://aion2.th.gl/db/quests/q_2102810) | **Daeva Trapped in a Nightmare** (not in app) | 45 / 45 | `done sq:2102800`, `lv 45` | tick *Turned in* (sets `storyEnd`) |

## 5. Ascension quests

| id | Quest | rec / unlock | proposed `requires` | proposed `completesWith` | sources | verdict |
|---|---|---|---|---|---|---|
| `asc:2602000` | The One Who Perceives | 5 / 5 | `lv 5`, `done sq:2101050` (The Being Beneath the Lake) | `done sq:2101060` (Spread Your Wings: its objective 1 is "The One Who Perceives Complete") | th.gl [2602000](https://aion2.th.gl/db/quests/q_2602000) (unlock 5, **no prerequisite listed**); Metabot [asmodian page](https://metabot.gg/en/aion-2/quests/the-one-who-perceives-asmodian) ("After passing the Lake Guardian's test…"); Metabot [Spread Your Wings](https://metabot.gg/en/aion-2/quests/spread-your-wings) steps | gate: **inferred** (intro text + story order); completion: DB step text |
| `asc:2602010` | The One Who Hears the Voice | 22 / 10 | `done sq:2102180` (Verdant Melody), `done asc:2602000`, `info "Ascension Gauge 100%"` | `done sq:2102185` (Daeva in a Dream) | th.gl [2602010](https://aion2.th.gl/db/quests/q_2602010) Prerequisites + [2102180](https://aion2.th.gl/db/quests/q_2102180) Unlocks; PlayNews walkthrough; Daeva in a Dream steps (`QUEST_STEPS`, Metabot) | **verified** |
| `asc:2602030` | The One Who Dreams | 32 / 10 | `done sq:2102340` (Last of the Destruction Archons), `done asc:2602010`, `info "Ascension Gauge 100%"` | `done sq:2102345` (A Daeva Dreaming Anew) | th.gl [2602030](https://aion2.th.gl/db/quests/q_2602030) + [2102340](https://aion2.th.gl/db/quests/q_2102340) Unlocks; C36; gauge: C36 notes (allthings.how + Skycoach) | **verified** |
| `asc:2602020` | The One Who Witnesses the Nightmare | 45 / 10 | `done sq:2102800` (Forgotten Commander), `done asc:2602030` | `done sq:2102810` (Daeva Trapped in a Nightmare) | th.gl [2602020](https://aion2.th.gl/db/quests/q_2602020) + [2102800](https://aion2.th.gl/db/quests/q_2102800) Unlocks; Metabot [Daeva Trapped](https://metabot.gg/en/aion-2/quests/daeva-trapped-in-a-nightmare) steps; C37 | **verified**; gauge for this one: **no source** (C37 notes) → not claimed |
| `asc:2602040` | The One Who Swears the Oath | 49 / 10 | `done asc:2602020` | tick only (beyond the cap; no wrapper inside the data) | th.gl [2602040](https://aion2.th.gl/db/quests/q_2602040); C05 (thegameswiki + Metabot: Lv 49) | verified; **outside Lv 1–45 scope** |
| `gauge:2702010` | Asmodian Ascension Gauge | 22 / – | `done asc:2602000` | – | th.gl [2702010](https://aion2.th.gl/db/quests/q_2702010) | info only; the app can't read the gauge |

Unlock level 10 on Hears / Dreams / Witnesses is the database value. The real gate is the story prerequisite plus the
gauge. Today the app shows Hears the Voice in `g22:0` gated on `story: "Daeva in a Dream"`. That equals
`done sq:2102180`, so it is already correct. Its completion is a manual tick only, and nothing derives it today.

**Wrapper rule (new, sourced):** story progress past the wrapper implies the Ascension is done. For saves this means
`g22:0` and `g32:dreams` can be shown done from the story position alone (ROADMAP 0.3 "completion derived from the
story position"). `g6:0` already ticks with its story quest.

## 6. Regional quests (58)

Proposed `requires` uses the database fields literally. "Today" is what `rqAvail` does now. The `lv 10` floor is the
database unlock level (th.gl and Metabot agree on every quest). Recommended level stays display only and is not a
gate.

| key | Quest | rec / unlock | proposed `requires` | today (app) | sources | verdict |
|---|---|---|---|---|---|---|
| `rq:2202044` | Shugo-of-All-Trades: Asmodian | 12 / 10 | `lv 10`, `done sq:2102040` (Contaminated Area) | `noPre`: opens at rec Lv 12 | [th.gl 2202044](https://aion2.th.gl/db/quests/q_2202044) Prerequisites; [th.gl 2102040](https://aion2.th.gl/db/quests/q_2102040) Unlocks | **new gate** (was `noPre`) |
| `rq:2202051` | Spooky Specters | 14 / 10 | `lv 10`, `done sq:2102070` (Cemetery Cleanup) | `noPre`: opens at rec Lv 14 | [th.gl 2202051](https://aion2.th.gl/db/quests/q_2202051) Prerequisites; [th.gl 2102070](https://aion2.th.gl/db/quests/q_2102070) Unlocks | **new gate** (was `noPre`) |
| `rq:2202010` | Hugo Mercenaries: Past and Present | 16 / 10 | `lv 10`, `done sq:2102105` (Empyrean Monolith) | reached Empyrean Monolith | [th.gl 2202010](https://aion2.th.gl/db/quests/q_2202010) Prerequisites; [th.gl 2102105](https://aion2.th.gl/db/quests/q_2102105) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202012` | Missing Mount | 16 / 10 | `lv 10`, `done sq:2102105` (Empyrean Monolith) | reached Empyrean Monolith | [th.gl 2202012](https://aion2.th.gl/db/quests/q_2202012) Prerequisites; [th.gl 2102105](https://aion2.th.gl/db/quests/q_2102105) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202013` | Creion Research Assistant | 16 / 10 | `lv 10`, `done sq:2102105` (Empyrean Monolith) | reached Empyrean Monolith | [th.gl 2202013](https://aion2.th.gl/db/quests/q_2202013) Prerequisites; [th.gl 2102105](https://aion2.th.gl/db/quests/q_2102105) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202014` | Odyle Jelly Misappropriation Investigation | 16 / 10 | `lv 10`, `done sq:2102105` (Empyrean Monolith) | reached Empyrean Monolith | [th.gl 2202014](https://aion2.th.gl/db/quests/q_2202014) Prerequisites; [th.gl 2102105](https://aion2.th.gl/db/quests/q_2102105) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202015` | The Great Curse-Breaking Caper | 16 / 10 | `lv 10`, `done sq:2102105` (Empyrean Monolith) | `noPre`: opens at rec Lv 16 | [th.gl 2202015](https://aion2.th.gl/db/quests/q_2202015) Prerequisites; [th.gl 2102105](https://aion2.th.gl/db/quests/q_2102105) Unlocks | **new gate** (was `noPre`) |
| `rq:2202023` | Practice Makes Perfect, Nyerk! | 16 / 10 | `lv 10`, `done sq:2102105` (Empyrean Monolith) | reached Empyrean Monolith | [th.gl 2202023](https://aion2.th.gl/db/quests/q_2202023) Prerequisites; [th.gl 2102105](https://aion2.th.gl/db/quests/q_2102105) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202016` | Blade of Vengeance | 22 / 10 | `lv 10`, `done sq:2102180` (Verdant Melody) | reached Verdant Melody | [th.gl 2202016](https://aion2.th.gl/db/quests/q_2202016) Prerequisites; [th.gl 2102180](https://aion2.th.gl/db/quests/q_2102180) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202017` | In the Fang Legion's Name | 22 / 10 | `lv 10`, `done sq:2102180` (Verdant Melody), `done rq:2202016` (Blade of Vengeance), `done rq:2202014` (Odyle Jelly Misappropriation Investigation) | reached Verdant Melody + Blade of Vengeance, Odyle Jelly Misappropriation Investigation ticked | [th.gl 2202017](https://aion2.th.gl/db/quests/q_2202017) Prerequisites; [th.gl 2102180](https://aion2.th.gl/db/quests/q_2102180) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202019` | Young Elim's Story | 22 / 10 | `lv 10`, `done sq:2102190` (Disturbed Balance) | reached Disturbed Balance | [th.gl 2202019](https://aion2.th.gl/db/quests/q_2202019) Prerequisites; [th.gl 2102190](https://aion2.th.gl/db/quests/q_2102190) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202036` | A Guardian's Sacrifice | 22 / 10 | `lv 10`, `done sq:2102190` (Disturbed Balance), `done rq:2202019` (Young Elim's Story) | reached Disturbed Balance + Young Elim's Story ticked | [th.gl 2202036](https://aion2.th.gl/db/quests/q_2202036) Prerequisites; [th.gl 2102190](https://aion2.th.gl/db/quests/q_2102190) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202053` | Nine Wonders of Altgard: 1st Leg | 22 / 10 | `lv 10`, `done sq:2102180` (Verdant Melody) | reached Verdant Melody | [th.gl 2202053](https://aion2.th.gl/db/quests/q_2202053) Prerequisites; [th.gl 2102180](https://aion2.th.gl/db/quests/q_2102180) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202062` | Fight Poison with Poison | 27 / 10 | `lv 10`, `done sq:2102240` (A Collective Effort) | reached A Collective Effort | [th.gl 2202062](https://aion2.th.gl/db/quests/q_2202062) Prerequisites; [th.gl 2102240](https://aion2.th.gl/db/quests/q_2102240) Unlocks; gaming.tools (rq.json `requiresSrc`); [Metabot](https://metabot.gg/en/aion-2/quests/fight-poison-with-poison) "Required first" | same edge; semantics change |
| `rq:2202011` | Hugo Mercenaries: Deep Shadow | 30 / 10 | `lv 10`, `done sq:2102280` (Canyon's Secret), `done rq:2202010` (Hugo Mercenaries: Past and Present) | reached Canyon's Secret + Hugo Mercenaries: Past and Present ticked | [th.gl 2202011](https://aion2.th.gl/db/quests/q_2202011) Prerequisites; [th.gl 2102280](https://aion2.th.gl/db/quests/q_2102280) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202018` | Her Last Favor | 30 / 10 | `lv 10`, `done sq:2102280` (Canyon's Secret) | `noPre`: opens at rec Lv 30 | [th.gl 2202018](https://aion2.th.gl/db/quests/q_2202018) Prerequisites; [th.gl 2102280](https://aion2.th.gl/db/quests/q_2102280) Unlocks | **new gate** (was `noPre`) |
| `rq:2202021` | An Invitation to the Past: Part 1 | 30 / 10 | `lv 10`, `done sq:2102280` (Canyon's Secret) | reached Canyon's Secret | [th.gl 2202021](https://aion2.th.gl/db/quests/q_2202021) Prerequisites; [th.gl 2102280](https://aion2.th.gl/db/quests/q_2102280) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202022` | An Invitation to the Past: Part 2 | 30 / 10 | `lv 10`, `done sq:2102280` (Canyon's Secret), `done rq:2202021` (An Invitation to the Past: Part 1) | reached Canyon's Secret + An Invitation to the Past: Part 1 ticked | [th.gl 2202022](https://aion2.th.gl/db/quests/q_2202022) Prerequisites; [th.gl 2102280](https://aion2.th.gl/db/quests/q_2102280) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202037` | The Future Within the Past | 30 / 10 | `lv 10`, `done sq:2102280` (Canyon's Secret) | reached Canyon's Secret | [th.gl 2202037](https://aion2.th.gl/db/quests/q_2202037) Prerequisites; [th.gl 2102280](https://aion2.th.gl/db/quests/q_2102280) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202020` | Hugo Mercenaries: An Old Promise | 32 / 10 | `lv 10`, `done sq:2102340` (Last of the Destruction Archons), `done rq:2202011` (Hugo Mercenaries: Deep Shadow) | reached Last of the Destruction Archons + Hugo Mercenaries: Deep Shadow ticked | [th.gl 2202020](https://aion2.th.gl/db/quests/q_2202020) Prerequisites; [th.gl 2102340](https://aion2.th.gl/db/quests/q_2102340) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202040` | Pain Unending | 32 / 10 | `lv 10`, `done sq:2102340` (Last of the Destruction Archons) | `noPre`: opens at rec Lv 32 | [th.gl 2202040](https://aion2.th.gl/db/quests/q_2202040) Prerequisites; [th.gl 2102340](https://aion2.th.gl/db/quests/q_2102340) Unlocks | **new gate** (was `noPre`) |
| `rq:2202070` | Nine Wonders of Altgard: 2nd Leg | 32 / 10 | `lv 10`, `done sq:2102340` (Last of the Destruction Archons), `done rq:2202053` (Nine Wonders of Altgard: 1st Leg) | reached Last of the Destruction Archons + Nine Wonders of Altgard: 1st Leg ticked | [th.gl 2202070](https://aion2.th.gl/db/quests/q_2202070) Prerequisites; [th.gl 2102340](https://aion2.th.gl/db/quests/q_2102340) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202029` | Traveling Merchant's Conundrum | 33 / 10 | `lv 10`, `done sq:2102370` (Blood Monument) | `noPre`: opens at rec Lv 33 | [th.gl 2202029](https://aion2.th.gl/db/quests/q_2202029) Prerequisites; [th.gl 2102370](https://aion2.th.gl/db/quests/q_2102370) Unlocks; [Metabot](https://metabot.gg/en/aion-2/quests/traveling-merchants-conundrum) "Required first" | **new gate** (was `noPre`) |
| `rq:2202063` | Finders Keepers | 33 / 10 | `lv 10`, `done sq:2102360` (Scripture in the Ruins) | reached Scripture in the Ruins | [th.gl 2202063](https://aion2.th.gl/db/quests/q_2202063) Prerequisites; [th.gl 2102360](https://aion2.th.gl/db/quests/q_2102360) Unlocks; gaming.tools (rq.json `requiresSrc`); [Metabot](https://metabot.gg/en/aion-2/quests/finders-keepers) "Required first" | same edge; semantics change |
| `rq:2202039` | A Friend's Legacy | 37 / 10 | `lv 10`, `done sq:2102590` (Mirror of Greed), `done rq:2202012` (Missing Mount) | reached Mirror of Greed + Missing Mount ticked | [th.gl 2202039](https://aion2.th.gl/db/quests/q_2202039) Prerequisites; [th.gl 2102590](https://aion2.th.gl/db/quests/q_2102590) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202038` | Bloodstained Rose | 37 / 10 | `lv 10`, `done sq:2102590` (Mirror of Greed) | reached Mirror of Greed | [th.gl 2202038](https://aion2.th.gl/db/quests/q_2202038) Prerequisites; [th.gl 2102590](https://aion2.th.gl/db/quests/q_2102590) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202066` | Herb Pouch Heist | 44 / 10 | `lv 10`, `done sq:2102660` (Daybreak Society Rescue Operation) | `noPre`: opens at rec Lv 44 | [th.gl 2202066](https://aion2.th.gl/db/quests/q_2202066) Prerequisites; [th.gl 2102660](https://aion2.th.gl/db/quests/q_2102660) Unlocks | **new gate** (was `noPre`) |
| `rq:2202067` | A Comrade's Fate | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [th.gl 2202067](https://aion2.th.gl/db/quests/q_2202067) Prerequisites; [th.gl 2102800](https://aion2.th.gl/db/quests/q_2102800) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202046` | Lest We Forget | 45 / 10 | `lv 10`, `done sq:2102780` (Zikel's Core) | `noPre`: opens at rec Lv 45 | [th.gl 2202046](https://aion2.th.gl/db/quests/q_2202046) Prerequisites; [th.gl 2102780](https://aion2.th.gl/db/quests/q_2102780) Unlocks; [Metabot](https://metabot.gg/en/aion-2/quests/lest-we-forget) "Required first" | **new gate** (was `noPre`) |
| `rq:2202041` | A Perfect Wedding | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [th.gl 2202041](https://aion2.th.gl/db/quests/q_2202041) Prerequisites; [th.gl 2102800](https://aion2.th.gl/db/quests/q_2102800) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202058` | Restoration Materials | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [th.gl 2202058](https://aion2.th.gl/db/quests/q_2202058) Prerequisites; [th.gl 2102800](https://aion2.th.gl/db/quests/q_2102800) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202056` | Lost Memories | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [th.gl 2202056](https://aion2.th.gl/db/quests/q_2202056) Prerequisites; [th.gl 2102800](https://aion2.th.gl/db/quests/q_2102800) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202050` | I'm a Believer! | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [th.gl 2202050](https://aion2.th.gl/db/quests/q_2202050) Prerequisites; [th.gl 2102800](https://aion2.th.gl/db/quests/q_2102800) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202043` | Fallout Calmed | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander), `done rq:2202042` (Fallout) | reached Forgotten Commander + Fallout ticked | [th.gl 2202043](https://aion2.th.gl/db/quests/q_2202043) Prerequisites; [th.gl 2102800](https://aion2.th.gl/db/quests/q_2102800) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202068` | Putting a Friend to Rest | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [th.gl 2202068](https://aion2.th.gl/db/quests/q_2202068) Prerequisites; [th.gl 2102800](https://aion2.th.gl/db/quests/q_2102800) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202057` | Sapling Hide-and-Seek | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander), `done rq:2202019` (Young Elim's Story), `done rq:2202036` (A Guardian's Sacrifice) | reached Forgotten Commander + A Guardian's Sacrifice, Young Elim's Story ticked | [th.gl 2202057](https://aion2.th.gl/db/quests/q_2202057) Prerequisites; [th.gl 2102800](https://aion2.th.gl/db/quests/q_2102800) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202054` | One Last Thing | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [th.gl 2202054](https://aion2.th.gl/db/quests/q_2202054) Prerequisites; [th.gl 2102800](https://aion2.th.gl/db/quests/q_2102800) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202060` | Another Survivor | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander), `done rq:2202022` (An Invitation to the Past: Part 2) | reached Forgotten Commander + An Invitation to the Past: Part 2 ticked | [th.gl 2202060](https://aion2.th.gl/db/quests/q_2202060) Prerequisites; [th.gl 2102800](https://aion2.th.gl/db/quests/q_2102800) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202042` | Fallout | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [th.gl 2202042](https://aion2.th.gl/db/quests/q_2202042) Prerequisites; [th.gl 2102800](https://aion2.th.gl/db/quests/q_2102800) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202052` | A Traitor Within | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander), `done rq:2202023` (Practice Makes Perfect, Nyerk!), `done rq:2202010` (Hugo Mercenaries: Past and Present) | reached Forgotten Commander + Hugo Mercenaries: Past and Present, Practice Makes Perfect, Nyerk! ticked | [th.gl 2202052](https://aion2.th.gl/db/quests/q_2202052) Prerequisites; [th.gl 2102800](https://aion2.th.gl/db/quests/q_2102800) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202061` | Regular Altar Maintenance | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [th.gl 2202061](https://aion2.th.gl/db/quests/q_2202061) Prerequisites; [th.gl 2102800](https://aion2.th.gl/db/quests/q_2102800) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202059` | Restless Spirits | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [th.gl 2202059](https://aion2.th.gl/db/quests/q_2202059) Prerequisites; [th.gl 2102800](https://aion2.th.gl/db/quests/q_2102800) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202071` | Nine Wonders of Altgard: Final Stretch | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander), `done rq:2202070` (Nine Wonders of Altgard: 2nd Leg) | reached Forgotten Commander + Nine Wonders of Altgard: 2nd Leg ticked | [th.gl 2202071](https://aion2.th.gl/db/quests/q_2202071) Prerequisites; [th.gl 2102800](https://aion2.th.gl/db/quests/q_2102800) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202027` | Immortal Isle's Distinct Ecology | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [th.gl 2202027](https://aion2.th.gl/db/quests/q_2202027) Prerequisites; [th.gl 2102800](https://aion2.th.gl/db/quests/q_2102800) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202069` | Spirit Isle, Where Time Has Stopped | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [th.gl 2202069](https://aion2.th.gl/db/quests/q_2202069) Prerequisites; [th.gl 2102800](https://aion2.th.gl/db/quests/q_2102800) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202045` | Farewell, My Instructor | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander), `done rq:2202023` (Practice Makes Perfect, Nyerk!) | reached Forgotten Commander + Practice Makes Perfect, Nyerk! ticked | [th.gl 2202045](https://aion2.th.gl/db/quests/q_2202045) Prerequisites; [th.gl 2102800](https://aion2.th.gl/db/quests/q_2102800) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202055` | Mind Your Own Business | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [th.gl 2202055](https://aion2.th.gl/db/quests/q_2202055) Prerequisites; [th.gl 2102800](https://aion2.th.gl/db/quests/q_2102800) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202028` | Reality Bites | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [th.gl 2202028](https://aion2.th.gl/db/quests/q_2202028) Prerequisites; [th.gl 2102800](https://aion2.th.gl/db/quests/q_2102800) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202064` | Workplace Misunderstanding | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [th.gl 2202064](https://aion2.th.gl/db/quests/q_2202064) Prerequisites; [th.gl 2102800](https://aion2.th.gl/db/quests/q_2102800) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202065` | Ravenous Recluse | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander) | reached Forgotten Commander | [th.gl 2202065](https://aion2.th.gl/db/quests/q_2202065) Prerequisites; [th.gl 2102800](https://aion2.th.gl/db/quests/q_2102800) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202047` | Another Crisis! | 45 / 10 | `lv 10`, `done sq:2102800` (Forgotten Commander), `done rq:2202013` (Creion Research Assistant) | reached Forgotten Commander + Creion Research Assistant ticked | [th.gl 2202047](https://aion2.th.gl/db/quests/q_2202047) Prerequisites; [th.gl 2102800](https://aion2.th.gl/db/quests/q_2102800) Unlocks; gaming.tools (rq.json `requiresSrc`) | same edge; semantics change |
| `rq:2202026` | Spacetime Rift: Asmodian | 45 / 45 | `lv 45` | lv 45 | [th.gl 2202026](https://aion2.th.gl/db/quests/q_2202026) (no Prerequisites, unlock 45); [Metabot](https://metabot.gg/en/aion-2/quests/spacetime-rift-asmodian) (unlocks at 45) | unchanged |
| `rq:2202030` | Spacetime Rift: Unknown Species | 45 / 45 | `lv 45` | `noPre`: opens at rec Lv 45 | [th.gl 2202030](https://aion2.th.gl/db/quests/q_2202030) (no Prerequisites, unlock 45); [Metabot](https://metabot.gg/en/aion-2/quests/spacetime-rift-unknown-species) (unlocks at 45) | **resolved**: level 45 only |
| `rq:2202031` | Spacetime Rift: Unfamiliar Material | 45 / 45 | `lv 45` | lv 45 | [th.gl 2202031](https://aion2.th.gl/db/quests/q_2202031) (no Prerequisites, unlock 45); [Metabot](https://metabot.gg/en/aion-2/quests/spacetime-rift-unfamiliar-material-asmodian) (unlocks at 45) | unchanged |
| `rq:2202033` | Spacetime Rift: Developing Travel Goods | 45 / 45 | `lv 45` | lv 45 | [th.gl 2202033](https://aion2.th.gl/db/quests/q_2202033) (no Prerequisites, unlock 45); [Metabot](https://metabot.gg/en/aion-2/quests/spacetime-rift-developing-travel-goods) (unlocks at 45) | unchanged |
| `rq:2202032` | Spacetime Rift: Difference Between Here and There | 45 / 45 | `lv 45` | lv 45 | [th.gl 2202032](https://aion2.th.gl/db/quests/q_2202032) (no Prerequisites, unlock 45); [Metabot](https://metabot.gg/en/aion-2/quests/spacetime-rift-difference-between-here-and-there) (unlocks at 45) | unchanged |
| `rq:2202034` | Spacetime Rift: An Honest Shugo | 45 / 45 | `lv 45` | lv 45 | [th.gl 2202034](https://aion2.th.gl/db/quests/q_2202034) (no Prerequisites, unlock 45); [Metabot](https://metabot.gg/en/aion-2/quests/spacetime-rift-an-honest-shugo) (unlocks at 45) | unchanged |
| `rq:2202035` | Spacetime Rift: Proof | 45 / 45 | `lv 45` | `noPre`: opens at rec Lv 45 | [th.gl 2202035](https://aion2.th.gl/db/quests/q_2202035) (no Prerequisites, unlock 45); [Metabot](https://metabot.gg/en/aion-2/quests/spacetime-rift-proof) (unlocks at 45) | **resolved**: level 45 only |

`completesWith` for every regional quest is its tick (`rq:<id>`); the game has no story-side signal for it. Two
derived signals exist and are worth using, because a follow-up quest you've picked up proves its prerequisite is
turned in:
`rq:2202016` ⇐ `started/done rq:2202017`; `rq:2202019` ⇐ `rq:2202036`; `rq:2202053` ⇐ `rq:2202070` ⇐ `rq:2202071`;
`rq:2202010` ⇐ `rq:2202011` ⇐ `rq:2202020`; `rq:2202021` ⇐ `rq:2202022` ⇐ `rq:2202060`; `rq:2202042` ⇐
`rq:2202043`. That is display-only derivation. Whether it writes ticks is an engineering / owner call (§10).

### `noPre` quests (ISSUES "Regional quests without prerequisite data")

| Quest | Result | Opens (proposed) | Opens today | Sources |
|---|---|---|---|---|
| Shugo-of-All-Trades: Asmodian | story gate found | after Contaminated Area (Lv 11) | Lv 12 | th.gl both ends |
| Spooky Specters | story gate found | after Cemetery Cleanup (Lv 13) | Lv 14 | th.gl both ends |
| The Great Curse-Breaking Caper | story gate found | after Empyrean Monolith (Lv 16) | Lv 16 | th.gl both ends (same gate as its 5 Lv 16 neighbours) |
| Her Last Favor | story gate found | after Canyon's Secret (Lv 30) | Lv 30 | th.gl both ends |
| Pain Unending | story gate found | after Last of the Destruction Archons (Lv 32) | Lv 32 | th.gl both ends |
| Traveling Merchant's Conundrum | story gate found | after Blood Monument (Lv 33) | Lv 33 | th.gl both ends + Metabot "Required first" |
| Herb Pouch Heist | story gate found | after Daybreak Society Rescue Operation (Lv 41) | Lv 44 | th.gl both ends |
| Lest We Forget | story gate found | after Zikel's Core (Lv 45) | Lv 45 | th.gl both ends + Metabot "Required first" ([page](https://metabot.gg/en/aion-2/quests/lest-we-forget); rq.json cites shugo.gg for it) |
| Spacetime Rift: Unknown Species | no prerequisite | Lv 45 | Lv 45 | th.gl (none listed, unlock 45) + Metabot (unlocks at 45) |
| Spacetime Rift: Proof | no prerequisite | Lv 45 | Lv 45 | as above |

"No prerequisite" means none is listed on two databases, not that one was seen to be absent in game. allthings.how
(rq.json note) says Uru sends you through "across three quests", which hints at an order inside the Spacetime Rift
series. Neither database shows one, so the label is **single source** and no gate is proposed.

After this, `noPre` and `rqOpenLv`'s recommended-level fallback are unused. The `regress` soft check "no prerequisite
data" has nothing left to report.

## 7. "Daeva Trapped in a Nightmare"

| Field | Value | Source |
|---|---|---|
| id | 2102810 (`sq:2102810`) | th.gl, Metabot |
| type / chapter | Episode · "Encountering Zikel's Core" (Episode 6, quest 17 of 17; story quest 88 of 89) | th.gl, Metabot |
| level | rec 45, unlocks at 45 | th.gl + Metabot |
| previous / next | Forgotten Commander / "Waiting for the Next Journey" (q 2103010: rec 46, **unlocks at 46**) | th.gl both pages, Metabot |
| objective | "Ascend to the next dimension of power as a Daeva" → complete The One Who Witnesses the Nightmare | Metabot steps (th.gl: 1 step) |
| giver | Koro, Abyss Base | th.gl [2102810](https://aion2.th.gl/db/quests/q_2102810) quest **description text** ("Objective: Talk to Koro at the Abyss Base"), not a structured field. Consistent with Metabot: Koro at the Abyss Base is Forgotten Commander's turn-in. Metabot's page shows no giver |
| turn-in | Nemon, Outskirts Stall (nearest Kibelisk Outskirts Stall, 21 m) | Metabot; th.gl description step 2 ("Talk to Nemon at the Outskirts Stall") |
| rewards | none listed | Metabot |

Proposed record: `requires [done sq:2102800, lv 45]`, `completesWith [reached-next]`. There is no next quest inside
the cap, so the *Turned in* tick sets `storyEnd = "Daeva Trapped in a Nightmare"`.

What adding it changes (for the 0.3 engine, not for data alone):
- `STORY_END` moves from Forgotten Commander to Daeva Trapped. A save with `storyEnd = "Forgotten Commander"` must
  read as "on Daeva Trapped". The evaluator can do that (`done sq:2102800` is true either way), so no migration is
  needed, and old builds keep reading the save. mig1's pinned diffs will change, so re-pin and review.
- `g45:0` gets `completesWith done sq:2102810`, but only if Swears the Oath is split out (§9.3).
- The 23 Forgotten-Commander regional quests and Witnesses all open on `done sq:2102800`. That is the same as today's
  `g45:0` `turnedIn` gate, and one quest later than today's regional gate (§3).
- MeinMMO (claims-notes, C06) says the "Lv 45 story finale needs item level 1,000". **Single source**, and it doesn't
  say which quest. If it's true it most likely applies to Witnesses' instances (Kaisinel's Collapsed Sanctum, Dream
  of Torment). Leave it out, or mark it `info`, until the owner check (§11, check 4).


## 8. Milestone steps (`GATES`) and route rules (`STEPS`)

"Today" is the gate `stepsOf` applies, in addition to the milestone's level, which is always a floor. In the proposed
column a predicate in **bold** is a change.

| k | Step | Today | proposed `requires` | proposed `completesWith` | source / label |
|---|---|---|---|---|---|
| `g6:0` | Complete The Being Beneath the Lake | byStory, reached `sq:2101050` | `lv 5`, `reached sq:2101050` | `done sq:2101050` | th.gl chain; wings reward: Metabot DB (C38) |
| `g9:0` | Save your Enhance Stones | lv 9 | `lv 9` | tick | advice. Milestone title "Enhancement unlocks" at Lv 9: **single source** (`VERIFIED_UNLOCKS` drops it) → §9.2 |
| `g10:0` | Extract replaced gear | lv 10 | `lv 10` | tick | advice. "Extraction at 10": **single source** (`VERIFIED_UNLOCKS` drops it) → §9.2 |
| `g10:1` | Complete Gathering Essentials (pets) | byStory | `reached sq:2102020` | `done sq:2102020` | th.gl chain; pet choice is its reward: Metabot DB |
| `g10:wisdom` | Use Wisdom Stones | lv 10 | `lv 10` | tick | advice |
| `g10:5` | Daeva Pass free track | lv 10 | `lv 10` | tick | no unlock-level source; **unlabelled today** → label or drop the level |
| `g10h:*` (13) | Lv 10 Sealed Dungeons | lv 10 | `lv 10` | tick | band from Metabot dungeon pages / allthings.how (dungeons.json); no story gate found on any source |
| `g12:0` | Complete Urgent Pursuit | byStory | `reached sq:2102065` | `done sq:2102065` | th.gl chain; reward Noble Belt (Metabot DB). **Text claims it unlocks the Daevanion board; `STORY_UNLOCKS` dropped that as unconfirmed** → §9.1 |
| `dv:*` Nezekan (8) | board nodes | blv 12 / 20 | `lv 12` (`lv 20` for `dv:ie`, `dv:ss`) | tick | board level: thegameswiki, Metabot, aion2hub (`VERIFIED_UNLOCKS`) |
| `g12:belt` | Enhance the Noble Belt | lv 13 | **`done sq:2102065`** | tick (repeatable advice) | Noble Belt is Urgent Pursuit's reward (Metabot DB); the text's "around Lv 13" agrees |
| `sd:*` g15 (11) | Lv 15 Sealed Dungeons | lv 15 | `lv 15` | tick | band (dungeons.json) |
| `g16:0` | Complete Buried Atrocities (Legions) | byStory | `reached sq:2102100` | `done sq:2102100` | th.gl chain; Legions: `STORY_UNLOCKS` (2 sources) |
| `g16:monolith` | Complete Empyrean Monolith | byStory | `reached sq:2102105` | `done sq:2102105` (quest part only; Resonate stays a tick) | th.gl chain |
| `g16:amulet` | Enhance the Revelation Amulet | lv 16 | **`done sq:2102100`** | tick | Revelation Amulet is Buried Atrocities' reward (Metabot DB); text agrees |
| `g20:0` | Zikel board opens | lv 20 | `lv 20` | tick (or `bo` logic as today) | `VERIFIED_UNLOCKS` |
| `sd:*` g20 (7), `dv:z:*` (6) | | lv 20 / 21 | `lv 20` (`lv 21` for Defense Break) | tick | band; board level; skill level (SP data) |
| `g22:0` | Complete The One Who Hears the Voice | reached `sq:2102185` | **`done sq:2102180`** (same position), **`done asc:2602000`**, `info gauge 100%` | **`done sq:2102185`** (wrapper) | §5, **verified** |
| `g22:1` | Equip stigma slot 1 | lv 22, reached `sq:2102185` | `lv 22`, **`done g22:0`** | stigma equipped (today's `stig` logic) | slot at 22: Metabot, PlayNews, KeenGamer; "Stigmas via Asahr": `STORY_UNLOCKS`. Needing Hears the Voice *done* rather than the story position: PlayNews (stigmas guide, via search summary) → **single source until owner check 3** |
| `g20:exp` | Krao Cave opens | reached `sq:2102185` | `lv 20`, `reached sq:2102185`, `info "item level 200"` | tick | `STORY_UNLOCKS` "Daeva in a Dream: … Expeditions". Reached vs turned in is unknown for this one → owner check 2 |
| `g25:0` | Supply Requests | lv 25 | `lv 25` | tick | `VERIFIED_UNLOCKS` (Metabot, allthings.how) |
| `sd:*` g25 (5) | | lv 25 | `lv 25` | tick | band |
| `g27:0`, `g27:1` | Stigma slot 2, put on E | lv 27 | `lv 27`, `done g22:0` | equipped / eput (today's logic) | `VERIFIED_UNLOCKS` |
| `g30:0` | Vaizel board | lv 30 | `lv 30` | tick | `VERIFIED_UNLOCKS` |
| `g30:1` | Daily dungeon | lv 30 | `lv 30` | tick | `VERIFIED_UNLOCKS` (Metabot, thegameswiki) |
| `sd:*` g30 (7), `dv:v:*` | | lv 30 | `lv 30` | tick | band; board |
| `g32:0`, `g32:1` | Stigma slot 3, put on E | lv 32 | `lv 32`, `done g22:0` | equipped / eput | `VERIFIED_UNLOCKS` |
| `g32:dreams` | Complete The One Who Dreams | reached `sq:2102345` | **`done sq:2102340`** (same position), **`done asc:2602010`**, `info gauge 100%` | **`done sq:2102345`** (wrapper) | §5, **verified** |
| `sd:*` g35 (10) | | lv 35 | `lv 35` | tick | band |
| `g35:exp` | Fire Temple opens | lv 35 | `lv 35`, `info "item level 500"` | tick | `VERIFIED_UNLOCKS`; the text's "Mirror of Greed sends you in" is C10 (Metabot DB) |
| `g37:0`, `g37:1` | Stigma slot 4, rotation | lv 37 | `lv 37`, `done g22:0` | equipped / eput | `VERIFIED_UNLOCKS` |
| `g37:2` | Mirror of Greed | byStory | `reached sq:2102590` | `done sq:2102590` | th.gl chain; C10 |
| `g40:0`, `sd:*` g40 (7), `dv:t:*` | | lv 40 | `lv 40` | tick | `VERIFIED_UNLOCKS`; band |
| `g45:0` | Finish the Hero and Ascension quests | reached + turnedIn `sq:2102800` | `lv 45`, `done sq:2102800`, `done asc:2602030` | **`done sq:2102810`** once Swears the Oath is split out | §5, §7. Oath (Lv 49) can't be derived inside the cap → §9.3 |
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
   at Lv 12 by level)". Neither database lists a board unlock for Urgent Pursuit; its reward is the Noble Belt
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

1. **`id`** per story, Ascension and regional quest = game quest id (`sq:` / `asc:` / `rq:`); names display only.
   Gates reference ids, never names (today `q.story`, `QUEST_STEPS` and `qsteps` are keyed by name; saves keep their
   name keys, and the evaluator maps them).
2. **`requires`**: an all-of list of predicates from §2 (`lv`, `reached`, `done`, `info`). `done` must work for
   `sq`, `rq`, `asc` and step keys. **`any`** is needed for nothing found so far: no database lists alternative
   prerequisites. Keep the schema open for it, but don't build it.
3. **`completesWith`**: any-of list. A tick always counts. Story quests: `reached next`. Wrapped Ascensions:
   `done <wrapper>`. Regional prerequisites: optional `startedOrDone <follow-up>` (display only, owner call).
4. **Story ordering**: `prev` per story quest (th.gl *Previous Quest*), not array position. The evaluator builds the
   order and can check it (one predecessor each, no gaps). `storyEnd` keeps its meaning: the last in-scope quest
   turned in.
5. **`wraps`** on a story quest: the Ascension id its objective completes (4 records). This is the basis for derived
   Ascension completion.
6. **`unlockLv`** and **`recLv`** as separate fields (both databases have both). Only `unlockLv` gates; `recLv` places
   the item in a milestone.
7. **Per-gate provenance**: each `requires` entry carries `src` (list of source ids from the registry, with the field
   name, e.g. `thgl:q_2202062#Prerequisites`) and `label` (`verified` / `single-source` / `inferred` / `disputed`).
   `verifiedAt` per record (ROADMAP 5a). Today `requiresSrc` is per quest, not per edge, which is why the `noPre`
   holes went unnoticed.
8. **`info` predicates** for what the app can't track (item level, Ascension Gauge). They are shown, never block
   Next up, and never count as unmet in the invariant test.
9. **`scope`** (`inCap: false`) for records beyond Lv 45 (Swears the Oath, Waiting for the Next Journey), so the
   chain stays complete without leaking into Next up.
10. **No new save fields.** Everything here derives from `level`, `quest`, `storyEnd` and `checks`.

Golden-master impact to list for owner approval (ROADMAP 0.3): (a) the 43 regional quests that are story-gated today
(`RQ_STATS.story`) open one story quest later, only if owner check 1 confirms the semantics (~70%, §3); (b) 8 former
`noPre` quests open on a story gate instead of their recommended level, which makes 51 story-gated quests in total
(Herb Pouch Heist moves *earlier*, from Lv 44 to Daybreak Society Rescue Operation at Lv 41; Shugo and Spooky one
level earlier); (c) `g22:0` / `g32:dreams` show done from the story position; (d) the story end moves to Daeva
Trapped.

## 11. Owner in-game checks

To batch with the colour-sprint session (HANDOFF). Each check is a concrete observation; screenshots go to the private
repo.

1. **Gate semantics (blocks §3; confidence for regional quests ~70%).** On a character whose current story quest is A Collective Effort (or any open story
   quest that gates a regional quest): is "Fight Poison with Poison" offered at Viron (Guide Rest Stop)? Then turn in
   A Collective Effort and look again. Expected (this report): not offered → offered. Any regional pair works, e.g.
   Lest We Forget around Zikel's Core. This is the only check that tests the meaning on a regional quest; all the
   evidence so far comes from Ascension quests.
2. **Krao Cave.** Does the Krao Cave Expedition open while "Daeva in a Dream" is open, or only after it is turned in?
3. **Stigma slot 1.** Does slot 1 open on reaching Lv 22, or only after "The One Who Hears the Voice" is complete?
4. **Lv 45 finale item level.** Does "The One Who Witnesses the Nightmare" or "Daeva Trapped in a Nightmare" ask for
   an item level (MeinMMO: 1,000)? Note the number if one is shown.
5. **Daeva Trapped in a Nightmare.** After turning in Forgotten Commander, does Koro at the Abyss Base start it
   (th.gl description text, §7), and does it complete as soon as Witnesses is done? (Its turn-in is Nemon at
   Outskirts Stall.)
6. **Perceives gate.** Is "The One Who Perceives" offered before "The Being Beneath the Lake" is turned in? (§5:
   inferred.)
7. **A `noPre` spot check.** Herb Pouch Heist offered right after Daybreak Society Rescue Operation (Lv 41–44), not
   only at 44.
8. **Spacetime Rift order.** At Lv 45, are all seven Spacetime Rift quests offered at once, or one after another?

Already on the HANDOFF list and unchanged by this report: Kibelisk / Command unlock levels, Daevanion points at 16/17,
respec cost after 31, expedition cap, reset time.

## Sources

- aion2.th.gl quest database, `https://aion2.th.gl/db/quests/q_<id>`. Every id linked above, fetched 2026-10-14.
  Story chain 2100010 → 2102810, regional 2202010–2202071, Ascension 2602000–2602040, gauge 2702010, next-journey
  2103010.
- Metabot quest pages, `https://metabot.gg/en/aion-2/quests/<slug>`, fetched 2026-10-14: the 58 regional pages; the
  Asmodian Ascension pages (`…-asmodian`); Daeva Trapped in a Nightmare, Forgotten Commander, Spread Your Wings, The
  Being Beneath the Lake, Gathering Essentials, Urgent Pursuit, Buried Atrocities.
- PlayNews, "The One Who Hears the Voice" walkthrough
  (https://www.playnews.gg/en/guides/the-one-who-hears-the-voice-in-aion-2-how-to-unlock-the-quest-and-step-by-step-walkthrough),
  read through search-result summaries (direct fetch blocked).
- Existing repo evidence: `data/rq.json` (`requiresSrc`, aion2.gaming.tools), `data/rq-chains.json`,
  `data/claims-notes.md` (C05, C06, C10, C36–C38), `src/data/story.js` (`QUEST_STEPS`, `STORY_UNLOCKS`,
  `VERIFIED_UNLOCKS`).

New URLs that 5b will need in the sources registry and `data/DATA_SOURCES.md`: the th.gl pages for every story and
Ascension quest (today only 7 th.gl pages are listed), plus the Metabot Asmodian Ascension pages.
