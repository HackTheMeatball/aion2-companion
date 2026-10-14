# Polish plan: Assassin route, Lv 25 → 45

Lead review of `assassin-route.html` (v285, 4,092 lines, 414 KB; identical to `backup-v285-before-polish.html`).
Method: read all of the CSS, HTML and JS. Ran Playwright with a "clean player" state (everything below the current level done) at Lv 25, 27, 28, 30, 32, 33, 35, 37, 38, 40, 42 and 45, in both Basic and Advanced. Checked 390 px and 1100 px widths. Dumped all runtime data and cross-checked its internal consistency.
Lead artifacts: `polish/lead/` contains `lv.js`, `lv.out`, `mob.js`, `dump.js`, `app-data.json` (runtime GATES, quests, areas, SP and DV) and `shot-*.png`.
No page errors at any level. All findings below are reproducible with `polish/lead/lv.js`.

---

## 1. Executive summary

The app is stable, but it is **not yet correct or complete for Lv 25 → 45**. Six things will bite him in order:

1. **Lv 27 / 32 / 37 (stigma levels).** Next up shows **two cards for the same action** ("Equip Illusive Clone" from the Stigma card and "Equip Illusive Clone." from the milestone). Which stigma goes in which slot is hard-coded and unverified (Metabot's order differs).
2. **Lv 28 / 35.** Both expedition milestones and the "Ahead · verified" rows say Urugugu Canyon opens at 28 and Fire Temple at 35. The story data shows each is entered through a story quest: "Canyon's Secret" (Lv 30) and "Mirror of Greed" (Lv 37). This is probably wrong info carrying a "verified" badge.
3. **Regional quests.**
   - Chain data is thin and partly contradictory. Metabot says In the Fang Legion's Name turns in to Menrik at Fang Hideout, and Blade of Vengeance is "Meet Menrik near the Fang Hideout". That suggests the opposite order to `QUEST_AFTER`.
   - 7 quests show a different zone in the milestone row than in Next up.
   - 41/58 have no Kibelisk.
   - 32 quests are parked at "Lv 45", so at 45 Next up says "32 to pick up". Metabot says they "unlock at 10" with a *recommended* level.
4. **Lv ~38–40.** The skill plan only covers 8 skills (168 pts). From ~Lv 38–40 the Skills card says "Every planned skill upgrade is spent" while 35–105 points sit unspent. In **Basic** the card body goes blank, because `.sphint` is hidden.
5. **Lv 40.** The covered story ends at "Symbol of Liberation". Its "Turned in" button then does nothing. Metabot's `next` is "Daybreak Society", so Lv 40–45 story (objectives, Kibelisks) is missing.
   - The Vaizel and Triniel board plans are generic placeholders ("Corner").
   - "Five boards" (tip) contradicts "Ariel and Azphel boards" (Ahead).
6. **Text debt.**
   - About 20 claims are unsourced or single-source but presented as fact: respec free until 31, "Hero quests are ~99% of XP", all the Lv 45 advice lines, item-level numbers, and stigma shard costs.
   - 3 instructions point to UI that no longer exists ("Current rotation", "rotation card at the top", "Next skill upgrade card").
   - One describes a behaviour that doesn't exist ("turns amber so you catch it later").
   - The "Paid tasks" filter filters nothing: no item has `paid`.

There is also notable dead weight: about 105 unused CSS classes touching about 267 of 1,480 rules, many stacked `body.basic` overrides, and 10+ dead JS paths. This makes every edit riskier.

**Scope decision.** Ship correctness and completeness to 45 first (P0 + P1), then polish (P2).

**Workload:**
- 3 researchers working in parallel, writing JSON to `data/`.
- 1 content verifier working in parallel, writing `data/claims.json`.
- 1 engineer in three sequential phases. E1 can start **now**: it is bug fixes and refactors that don't need research.
- 1 QA after E1 and after E2.

Expected fetch budget is about 130 WebFetches, mostly Metabot; the per-workstream budgets are in section 3. I confirmed WebFetch works for metabot.gg quest pages; curl via Bash is blocked by the proxy (403).

**Hard constraint for everyone: progress keys.**
- Milestone item keys are `gate.id + ":" + index` unless an item has an explicit `k`.
- Moving a quest to another gate, or inserting an item before existing ones, **silently drops his ticks**.
- E1 must introduce stable keys plus a one-time migration *before* any re-banding (section 3, E1-1).

---

## 2. Findings

Line numbers refer to `assassin-route.html` v285.

### P0: wrong info or broken

| # | Finding | Location | Fix |
|---|---|---|---|
| P0-1 | Duplicate Next up cards at Lv 27/32/37. The Stigma card's "Equip X" (`act:"stequip"`) and the milestone line "Equip X." (`tick:g27:0` etc.) are the same key. The "Put/Add X on E" line is a third card. | `renderNow` 2665–2668 plus `stepsOf` 2671; GATES g27/g32/g37 items 2044–2045, 2068–2069, 2088–2089 | `stepsOf` skips items whose key is a stigma slot key and the E-placement lines. The Stigma card's subline already says "then put it on E, row N". The milestone keeps the lines; Next up shows one card. |
| P0-2 | Expedition unlocks are probably wrong and labelled verified: Urugugu 28, Fire Temple 35. The story's "Canyon's Secret" (Lv 30) contains "complete the Urugugu Canyon investigation" and "Mirror of Greed" (Lv 37) contains "complete the Fire Temple investigation". The expedition tip itself says "not yet checked against the story". Krao Cave already proved story-gated (moved to g22). | `VERIFIED_UNLOCKS` 3209, 3214; g28 3096–3097 (title "Heart Gore 10 and Urugugu Canyon"); g35 2081–2085 (title "Fire Temple"); TIPS.expedition 1852 | R3 verifies the unlock condition. Gate the items with `story: "Canyon's Secret"` / `story: "Mirror of Greed"` (the existing story-chip mechanism). Retitle g28 and g35 or move the items; remove them from VERIFIED_UNLOCKS unless 2 sources give a level. |
| P0-3 | Regional chain order and givers contradict Metabot. Metabot (fetched 12 Oct): "In the Fang Legion's Name" giver is Gamilla at Watcher's Tent (Kibelisk 6 m), turn-in Menrik at Fang Hideout; "Blade of Vengeance" has one step, "Meet Menrik near the Fang Hideout". The guide says Fang Legion appears *after* Blade, and Blade's giver is "Nemon · Forest Hideout". The two "inferred from names" chains (Invitation Part 2, Nine Wonders 2nd Leg) are unconfirmed. | `QUEST_AFTER` 1959–1961; `QUEST_POI` 1899 | R1 gathers giver and turn-in for all 58. The engineer applies chains only with a stated basis and shows inferred chains as "likely after X". The E1-6 "Not in game yet" control makes any remaining error self-correcting. |
| P0-4 | Zone contradictions for 7 quests: the milestone row uses `where`, while Next up and "near your story step" use `QUEST_AREA`. The quests are Odyle Jelly, Practice Makes Perfect, I'm a Believer!, A Traitor Within, Reality Bites, Workplace Misunderstanding, Ravenous Recluse, and Another Crisis! (camp names used as zones; Reality Bites gives Battlescar Mound vs Briskwind Shelter in Dranactus). Spacetime Rift: An Honest Shugo has a POI/RQ_LOC mismatch. | `quests()` where-strings 2003–2152 vs `QUEST_AREA` 2303–2325, `QUEST_POI` 1899, `RQ_LOC` 2329 | E1-2 single regional-quest table, with zone = Altgard sub-region and place = camp. R1 supplies the values. |
| P0-5 | Daevanion board list contradicts itself: the tip says "Five talent boards … Azphel (45)"; Ahead says "Ariel and Azphel boards" at 45. | TIPS.daevanion 1835; VERIFIED_UNLOCKS 3217; g45 2110 | R3 verifies; V1 rewrites both. |
| P0-6 | Instructions point to UI that no longer exists. | g32 2069 "The key grid in Current rotation"; STEPS.build 2163 "in the rotation card at the top" (it's the Build drawer); 2160 "the Next skill upgrade card" | Rewrite: "Build tab (right edge) → Key setup", "Skills card". |
| P0-7 | Text describes non-existent behaviour: "A regional quest you can't solo … turns amber so you catch it later". Amber means *in progress*. | STEPS.story 2171 | Drop it, or replace with the E1-6 "Not in game yet / later" control. |
| P0-8 | Certainty mismatch on respec. "How points work" says "Respec is free until Lv 31" as fact and STEPS says "lock in the build by 31", but TIPS.respec says sources disagree. | 1668, 2162, 1834 | V1: one hedged wording everywhere ("free at least to 31; check the button's cost at 31"). |
| P0-9 | Unsourced or likely-wrong claims shown as instructions (V1 list in section 3): "~99% of Asmodian XP", the Lv 45 block (recommended 49, Ascension Trial 1,500/1,000, Abyss Point advice, Conquest 700) duplicated in the map card, "Story dungeon around Lv 37", and Pet choice. | 2166, 2108–2113, 1641, 2090, 1973 | V1 verdicts; the engineer applies keep, rewrite or drop. |
| P0-10 | Stigma names are hard-wired per slot: Triniel 22, Illusive Clone 27, Savage Fang 32, Swift Contract 37. Metabot's build uses a different order, and whether Illusive Clone is learnable at 27 is unverified. If wrong, the Stigma card, E-stack, rotation and Next up all give wrong instructions. Equip also auto-deducts 1 shard ("learning = level 1"), which is single-source. | GATES 2027, 2044, 2068, 2088; `STIGMA_SLOTS` 3788; `stTickClick` 3857; `E_ORDER` 3387 | R3 verifies availability and costs. E1-7: Stigma card lets him pick which stigma he equipped in each slot (default = plan suggestion), so the rest derives from what he actually did. |

### P1: gaps that will bite during Lv 25–45

| # | Finding | Location | Fix |
|---|---|---|---|
| P1-1 | The skill plan runs out. 8 skills cost 168 pts in total; Lv 45 gives 203 plus stones. At Lv 40/42/45 (clean state) the Skills card says "Every planned skill upgrade is spent" with 63/79/105 pts. **Basic shows an empty card** because `body.basic #spCard .sphint{display:none}` also hides the overspend warning. Assault Stance and Defense Break are in the DV plan but not the SP plan. | `SP_SKILLS` 3069–3078; `renderNext` 3529; CSS 1229 | R3: the full Assassin skill list (learn level, costs, specialties) and a sourced order for the rest. E2 extends `SP_SKILLS`. E1: never render an empty Skills card. Show "N points unplanned" in both modes. |
| P1-2 | The story ends at Lv 40. "Symbol of Liberation" → "Turned in" calls `stepQuest(1)`, which returns silently. The status reads "End of the covered story (Lv 40)", and the input says "Levels 40–45 aren't covered yet". | `QUESTS` 3115–3130; `stepQuest` 3355–3357; 3192, 3372 | R2: the chain from "Daybreak Society" to the last Altgard story quest, or Lv 45. E2 appends it to QUESTS, QUEST_STEPS and QUEST_LOC. E1: an end-of-data state ("Story continues in game past X") instead of a dead button. |
| P1-3 | 32 regional quests sit in g45 by *recommended* level; Metabot pages show "Unlocks at: 10". At 45 Next up says "32 to pick up"; between 40 and 45, when the story is uncovered and XP is needed, they are invisible. Quests labelled Lv 33 and Lv 44 sit in g32 and g45 but availability uses the gate level. | g45 2114–2153; `rqAll` 2710 uses `g.lv`; `quests()` 1962 | R1 records `rec` and `unlocksAt`. Re-band by `rec` into the gate ≤ rec, and use the item's own `rec` for availability (requires E1-1 keys first). |
| P1-4 | Kibelisk coverage: 17/58 regional quests, 0/15 strongholds, 54/60 Sealed Dungeons. Missing dungeons: Abandoned One's Grave, Lost Ruins, Fafnite Storage Room, Dratona Assembly Area, Odylium Marauder Den, Ascetic's Cave. XP is shown for only 7/60 dungeons, so the info line is inconsistent. | `RQ_LOC` 2329; `AREA_LOC` 2330; `STRONGHOLDS` 2359 | R1, R2. If dungeon XP can't be had from ≤3 list-page fetches, remove XP from the UI rather than show it for 7. |
| P1-5 | Stronghold data is thin. Nine of the 15 use the range "1–45" ("any level"); Barahta is "40–40"; zones "Crypt" and "Silent Hill" fall outside the zone list; band placement is inferred by a heuristic. | 2359–2375, 2387–2396 | R2: per-stronghold page (quest ids 2820001–2820015). |
| P1-6 | The Daevanion plan is generic past Zikel. Vaizel has HG, IE, QS, AS and a "Crit Damage corner"; Triniel has the same plus a plain "Corner". The node existence, names and paths on those boards are unverified, and Ariel is not handled. | GATES g30 2061–2065, g40 2101–2105 | R3 from Metaroad boards plus the Metabot Daevanion guide. E2 replaces the nodes, using **new keys** (`dv:v:*`, `dv:t:*`); the old ones are never ticked yet because the user is below 30. |
| P1-7 | Reward auto-credit is applied uniformly: every regional quest gets +1 stone and +1 crystal, every dungeon +2 and +2 (`CLEAR_REWARD`). It is unverified for Spacetime Rift quests (AP rewards) and for higher dungeon bands. A wrong credit pollutes his stone and crystal totals. | 2584–2588; TIPS.hideout 1840; TIPS.regional 1844 | R1 rewards per quest; R2 samples one dungeon per band. E2 uses per-item rewards from data. |
| P1-8 | Next up card titles are cut from the first `<b>`: "Start the daily dungeon:", "Finish the remaining Hero and Ascension quests:", "Ascension Trial timing.", "Abyss Points", "Equip Illusive Clone.", "Vaizel Daevanion board opens." | `stepsOf` 2678–2680 | Add an explicit `ns:` short title to every milestone item. Fallback: strip trailing `:.`. |
| P1-9 | The "Paid tasks" filter is a dead control: no item has `paid`. | HTML 1709; `isPaid` 2230 | Remove the control (keep `upsell` rendering). |
| P1-10 | Regional quest availability can't be corrected by the user. If data says a quest is available and it isn't (as with Fang Legion and Guardian's Sacrifice), it sits in Next up forever. | `rqCard` 2710–2738 | E1-6: a "Not in game yet" action on each open quest row snoozes it until the next Level up, or until its prerequisite is ticked. It is stored as `state.rqSnooze[k] = level`. No reporting needed. |
| P1-11 | Expedition, daily and Lv 45 details: daily dungeon names ("Daeva Bio-Research Base … not the Kinah or pet-fragment dungeons"), "rewards 7 times per week", and item levels 200/300/500/700. All are single-source or unknown. | 2050, 2178, 1852, 2035, 3097, 2085, 2113, 1641 | V1 and R3. |

### P2: polish

| # | Finding | Location | Fix |
|---|---|---|---|
| P2-1 | Dead JS paths:<br>• `renderSummaries` (never called) and `[data-sum]`<br>• `data-region` handler<br>• `#trkLater` handler<br>• `qStartBtn`, `Q_LABEL` and the `[data-qs]` handler<br>• empty `renderTips`<br>• two `if (false)` blocks<br>• unreachable tail of `renderAhead`<br>• `nowKeys`, `nowGate` and `nsGate` (never populated, so the first loop of `dedupeNow` is a no-op)<br>• `useSp`<br>• the `"rotopen"`, `"quests"` and `"areas"` actions | 2527–2543, 2490–2495, 4014–4017, 1943–1945, 4005–4013, 2871, 2747, 3238–3259, 2957–2964, 2765–2769, 2846, 2851–2852 | Delete. **Keep** the `{hidden:true}` placeholders: they hold key indices until E1-1 lands. |
| P2-2 | Unused CSS: about 105 classes / ~267 rules (list in `polish/lead`; e.g. `.nsqueue .ns-scroll .nsq-* .nu-* .now-card .dvb-* .coll-* .region-h .togs .verdict`). There are also duplicated and conflicting `body.basic #nowStar` rules: `animation` is set and unset 4×, at 1229–1246 and 1432. `s1` and `s2` are generated dynamically, so check before deleting. | `<style>` 4–1563 | Delete in one commit after the QA screenshot baseline. Collapse the duplicate basic rules. |
| P2-3 | Confidence card is one long, partly stale paragraph (e.g. the Nezekan IE/Shadowstrike remark; "enhancement 9 … extraction 10" while the VERIFIED_UNLOCKS comment says those were left out). The Sources card is missing sources the tips cite: thegameswiki, games.gg, Inven, shugo.gg, couga54, ExpCarry, Elite Grind Lab, neonsect, and Metabot quest/dungeon pages. | 1722–1768 | Generate both from `data/claims.json` (grouped: Verified / Single source / Inferred / Disputed) and a `SOURCES` array. |
| P2-4 | Basic mode's Next up is identical to Advanced: a 12-card stack including "Later" and "After the one above" cards. | `renderNow` 2792 | Basic: drop `later` cards and follow-on skill cards. |
| P2-5 | Cleared milestones Lv 6–25 always render above the current one, about 10 cards of scrolling at Lv 30. | `update` 3047 | Default `hideCards` on for new installs, or fold cleared ones into a single "N cleared milestones" row. Don't change his existing setting silently. |
| P2-6 | At Lv 45 the Ahead box is empty and "Level up" silently no-ops. | 3219–3236, 3963 | Show "Level cap"; disable the button at 45. |
| P2-7 | At 390 px the "Build" edge tab overlaps the Next up card's right edge (`mob-390-ns.png`). | `.statdrawer` CSS | Below 600 px, move the tab into the header or shrink it. |
| P2-8 | Performance: `update()` takes about 28 ms; `renderNow` runs 2–3× per update (`update` → `renderNow`, `renderQuest` → `renderQuestSubs` → `renderNow`); `stepsOf` reads DOM. | 3058, 3321 | Make `renderQuestSubs` not call `renderNow` when called from `update`. Target < 15 ms. |
| P2-9 | One-time player seeds (`seedLv12`, `stTriniel1`, `dvReset1`) would corrupt a fresh browser: they force level 12, set old skill levels and mark Triniel equipped. | 2200–2215 | Run them only when a saved state exists without the flag. Add Export/Import progress (JSON download/upload) to the Sources/Confidence footer: localStorage is the only copy of 20 levels of ticks. |
| P2-10 | Accessibility basics:<br>• `.q-cb` buttons have no state (`aria-pressed` or text).<br>• Many targets are < 24 px (± steppers, "i" buttons).<br>• The drawer doesn't move focus on open. | 2731, CSS | Small fixes; no redesign. |
| P2-11 | The Dungeons & Strongholds default band is "Lv 10–14 · 2 open" at Lv 32, because two old strongholds are still open. | `defaultBand` 2398 | Prefer the band containing the current level; keep the backlog count in the dropdown. |

---

## 3. Workstreams

Order and parallelism:

```
t0 ──► R1 Regional quests ───────┐
   ──► R2 Story 40–45 + SH + SD ──┼──► E2 Integrate data ──► QA2 ──► E3 fix round ──► QA3 (final)
   ──► R3 Build data ─────────────┤
   ──► V1 Claims verifier ────────┘
   ──► E1 Engineer (no data needed) ──► QA1
```

- Only one engineer touches the HTML at a time; E1 → E2 → E3 is the same seat.
- Researchers and the verifier never edit the HTML. Each writes only its own JSON file(s) in `data/`.
- Before each engineer phase, copy the file to `backup-v2xx-<phase>.html`.
- **Source policy** (assumption, consistent with past decisions):
  - Metabot *database* fields extracted from client data (quest steps, giver, turn-in, Kibelisk, rewards, XP, unlock level) are accepted from one source and labelled "Metabot".
  - *Advice* and *rules* (orders, priorities, "unlocks via", costs not shown in a game tooltip) need 2 independent sources or an in-game screen. Otherwise they are dropped, or shown labelled as inferred.
  - Metabot and Wikily count as **one** source.
  - Cite Metabot with a plain (dofollow) link.

### R1: Data researcher A, regional quests (all 58)

**Inputs:**
- `polish/lead/app-data.json` (`quests[]`: name, current gate, `QUEST_ID`, `where`, POI, `RQ_LOC`)
- `data/locations.json`
- `data/current-areas-quests.json`

**Method:**
1. Try one list fetch first: `https://metabot.gg/en/aion-2/quests` (or its regional filter). If it lists recommended or unlock levels for all quests, use it for levels.
2. Then one WebFetch per quest page `https://metabot.gg/en/aion-2/quests/<slug>`. The slug is `metaSlug(name)`: lowercase, apostrophes dropped, non-alphanumerics → `-`. Shugo-of-All-Trades is `shugo-of-all-trades-asmodian`. Ask the fetch prompt for everything verbatim: type, recommended level, unlocks-at, giver NPC and place, giver's nearest Kibelisk and metres, every step (with Kibelisk/m), turn-in NPC/place/Kibelisk/m, rewards (EXP, Kina, Wisdom Stone, Daevanion Crystal, items), and any prev/next text.
3. Then the 4 allthings.how area pages already in the Sources card. Use them for zone (Altgard sub-region) and any "picks up after / follows" text.
4. Mandatory: the 45 quests with rec ≥ 22. Optional: the 13 lower ones, only if budget allows. Budget about 50–62 fetches.

**Output:** `data/rq.json`, an array of 58 objects:

```json
{ "name": "In the Fang Legion's Name", "id": "2202017", "slug": "in-the-fang-legions-name", "src": "https://metabot.gg/…", "fetched": "2026-10-12",
  "rec": 22, "unlocksAt": 10, "zone": "Sanctum Outpost", "zoneSrc": "allthings.how …",
  "giver": { "npc": "Gamilla", "place": "Watcher's Tent", "kib": "Watcher's Tent", "m": 6 },
  "steps": [ { "text": "Talk to the Fang legionnaire", "kib": "Fang Hideout", "m": 130 } ],
  "turnin": { "npc": "Menrik", "place": "Fang Hideout", "kib": "Fang Hideout", "m": 143 },
  "rewards": { "xp": 213118, "kina": 21000, "wisdom": 1, "crystal": 1, "items": ["Outsider Bracelet", "Statue: Selvis", "Title: Watch My Back"] },
  "prev": null, "prevBasis": null,
  "conflicts": ["Metabot turn-in table says Sanctum Outpost; steps say Fang Hideout"] }
```

Also write `data/rq-chains.json`: `[{ "quest", "after", "basis": "source-text|turnin-npc=next-giver+same-place|name-pattern|in-game", "sources": [] }]`. Mark every edge `confirmed` (explicit text in ≥ 1 source, or seen in game) or `inferred`.

**Acceptance:**
- 58 entries.
- `giver.kib` non-null for ≥ 50, with every gap explained in `conflicts`.
- `rec` and `unlocksAt` present for all fetched entries.
- Rewards present.
- Every QUEST_AFTER edge in the app is re-classified, including Fang Legion ↔ Blade of Vengeance (P0-3).
- No HTML edits.

### R2: Data researcher B, story Lv 40–45, strongholds and dungeon gaps

**Inputs:** `data/story.json` (schema to copy), `STRONGHOLDS`/`SH_QID` (lines 1882–1885, 2359–2375), `AREA_LOC` (2330).

**Method:**
1. Follow `next` from `https://metabot.gg/en/aion-2/quests/daybreak-society` one page at a time until the chain leaves Altgard or passes Lv 45 (expect about 10–20 pages). If a slug 404s, use WebSearch for the name plus "metabot".
2. Strongholds: 15 pages. Find the URL pattern from one stronghold's map focus (`…/map/altgard/strongholds?focus=quest:2820001`) or a search; quest-page slugs are likely the stronghold names.
3. Dungeons: one fetch of `https://metabot.gg/en/aion-2/guides/dungeon-guide` (and any dungeon list page) for XP and rewards per dungeon. Individual pages only for the 6 missing Kibelisks, plus one dungeon per band (10/15/20/25/30/35/40) to check that the first-clear reward is still 2 crystals + 2 Wisdom Stones.
4. Budget about 45 fetches.

**Outputs:**
- `data/story-40-45.json`: same schema as `story.json`, keyed by quest name, with `lv`, `steps[]` (in the existing "Objective — detail (Kibelisk: X)" string format), `giver/giverPlace/giverKib/giverKibM/turnin/turninPlace/turninKib/turninKibM/next/src`.
- `data/strongholds.json`: `[{ name, qid, src, zone, recLv | lo/hi, kib, m, steps[], rewards{xp,kina,items[]}, notes }]`
- `data/dungeons.json`: `[{ name, band, kib, m, xp, rewards{wisdom,crystal,kina,enhance}, src }]`. Only fields actually found; never estimates.

**Acceptance:**
- Story chain continuous (each `next` resolves to the next entry, or is explicitly marked "end/leaves Altgard").
- 15 strongholds, each with zone and level.
- 6 dungeon Kibelisk gaps filled or explained.
- A per-band reward table, with a yes/no answer to "2+2 at every band".

### R3: Build researcher, skills, boards, stigmas and unlocks

**Inputs:**
- `SP_SKILLS` 3069
- `LEVEL_POINTS` 3080
- DV nodes in `polish/lead/app-data.json`
- `STIGMA_SLOTS`, `E_ORDER`, `ST_COST`
- The Confidence card's source list

**Method and questions:**
1. **Full Assassin skill list.** Metabot class page plus skill pages: name, active/passive, learn level, per-level cost, and specialty slot levels and options for skills *not* in SP_SKILLS (incl. Assault Stance and Defense Break). Find ≥ 2 sources for what to level after the current 8 (GamerBlurb, GamesFuze, Metabot class build, Skycoach). Verify LEVEL_POINTS 40–45 (Wikily table) against a second source.
2. **Boards.** Metaroad Assassin boards (Vaizel, Triniel, plus Ariel if it exists) and the Metabot Daevanion guide: node names, colours/costs, and path costs for the nodes that match the plan's skills. Find out whether Ariel is a crystal board at 45; the tip says five boards, the Ahead row says Ariel + Azphel.
3. **Stigmas.** Learn level or availability for Triniel's Dagger, Illusive Clone, Savage Fang and Swift Contract. Shard cost per level from a second source (PlayNews, games.gg, thegameswiki, KR wiki). Does learning cost 1 shard? Shards per level from 23 and from 40?
4. **Expeditions and daily dungeon.** Unlock condition for Urugugu Canyon and Fire Temple (level vs story quest "Canyon's Secret" / "Mirror of Greed"), plus min item level and party size. Names of the Lv 30 daily dungeons.
5. Budget about 30 fetches.

**Output:** `data/build.json`:

```json
{ "skills": [{ "name", "type": "active|passive", "learnLv", "costs": {"2-4":1,"5-7":2,"8-10":4}, "gate": "…", "specialties": [{"skillLv":8,"options":["…"]}], "src": [] }],
  "spOrderAfterCore": { "order": ["…"], "sources": [], "verdict": "2-source|single|inferred" },
  "levelPoints": { "40": 171, "…": 0, "45": 203, "sources": [] },
  "boards": { "Vaizel": [{ "node", "ty": "a|p|c", "cost", "pathNote", "src" }], "Triniel": [], "Ariel": null },
  "stigmas": [{ "name", "availableLv", "src": [] }], "stigmaCost": { "table": "…", "learnCostsShard": true, "sources": [] },
  "unlocks": [{ "what": "Urugugu Canyon", "level": null, "quest": "Canyon's Secret", "minItemLevel": 300, "party": "2–5", "sources": [] }],
  "dailyDungeon": { "lv": 30, "names": [], "src": [] } }
```

**Acceptance:**
- Every field either has sources or is `null` with a note.
- P0-2, P0-5, P0-10 and P1-1 are answerable from this file.

### V1: Content verifier, text claims

**Input:** this list of claims (line in v285 → claim). Claims answered by R1–R3 are excluded.

| ID | Line(s) | Claim |
|---|---|---|
| C01 | 1668, 2162, 1834 | Respec free until 31, Kina after |
| C02 | 1668 | "Each skill gains one level every 3 character levels after you learn it" |
| C03 | 1726 | Specialty slots at 8 / 12 / 20 |
| C04 | 2166 | "Hero quests are ~99% of Asmodian XP to 45" |
| C05 | 2108 | "The One Who Witnesses the Nightmare" recommended 45; "The One Who Swears the Oath" recommended 49 |
| C06 | 2111 | Ascension Trial item level 1,500 / 1,000 |
| C07 | 2112 | Abyss Points priority advice |
| C08 | 2113, 1641 | Conquest / Krao Cave Normal gear score 700 |
| C09 | 2109, 1845 | Shugo Festival keys "worth far more at 45" |
| C10 | 2090 | "Story dungeon around Lv 37" (map it to the actual quest: likely "Mirror of Greed"'s Fire Temple investigation) |
| C11 | 1852 | Expeditions pay rewards 7×/week; Conquest at 45 |
| C12 | 1840 | Sealed Dungeon first-clear reward list (15,000 Kina, 1,250 Enhance Stones, 2+2, title) — coordinate with R2's per-band check |
| C13 | 1842 | Stronghold reward: 2 belt scrolls + 15,000 Kina, "belt scrolls come from nowhere else" |
| C14 | 1844 | "Most unlock at Lv 10" — R1 resolves |
| C15 | 1846, 2177 | Duty Quests: 5/day per server, Lv 45 |
| C16 | 1847, 2176 | Supply Requests details, incl. the "Unconfirmed" line |
| C17 | 2183 | F2P: no Market or exchange without subscription; $15/month |
| C18 | 2184 | "Cash shop is cosmetic" |
| C19 | 2179 | Weekly Command scrolls ("No source gives an unlock level") — keep or drop |
| C20 | 1806–1808, 1777 | Stat tiers and B/G letters (3 sources, differing order) |
| C21 | 1790–1797, 3383–3390 | Rotation, key setup (macro path, 10 ms delay, row order, "Quick Slice would block everything"), E order (marked inference) |
| C22 | 1836–1837, 2110 | Board node colours/costs (1/2/3/4), Azphel paid with PvP points |
| C23 | 2010 | Belt/amulet +10 cost (232,000 Kina, 9,280 stones); Substance Morph |
| C24 | 1991 | Belt enhance success 100% |
| C25 | 1825–1826 | Empyrean Traces: 560 in Altgard; Resonance 30; Monolith locations |
| C26 | 2405–2408 | ZONE_TRACES per zone |
| C27 | 3663 | Board +4 crystals per level past 11 (in-game at 16/17; does it hold to 45?) |
| C28 | 1724–1729 | Entire Confidence card: every sentence becomes a claim with a verdict |

**Method:**
- WebSearch first; fetch only pages that state the fact.
- Prefer games.gg, thegameswiki, PlayNews, GamesFuze, KeenGamer, allthings.how, wikily and Inven. No game8.
- Budget about 25 fetches.

**Output:** `data/claims.json`:

```json
[{ "id": "C01", "lines": [1668, 2162, 1834], "claim": "…",
   "verdict": "verified|single-source|disputed|unverifiable|wrong",
   "sources": [{ "url", "quote" }],
   "action": "keep|rewrite|drop|mark-inferred", "newText": "exact replacement HTML/text (≤ 1 sentence where possible)" }]
```

**Acceptance:**
- Every claim C01–C28 has a verdict and an action.
- Every `rewrite` has `newText` in the guide's voice: short, second person, no hedging beyond one clause.
- Nothing kept as fact with fewer than 2 independent sources, except Metabot DB fields per the source policy.

### E1: Engineer phase 1 (start now; no research dependency)

**Input:** `assassin-route.html`, this plan. Work on a copy; QA1 checks before replacing.

**Tasks, in order:**
1. **Stable keys and migration (E1-1).**
   - Give every regional quest `k: "rq:" + QUEST_ID[name]`.
   - Give every SD/SH area item its existing `k` (already explicit).
   - Give every other new or movable item an explicit `k`.
   - Add a one-time `state.migV5` migration that copies `checks`, `started`, `areaRun` and `qsub` from the old `gid:index` keys to the new keys and leaves the old ones in place.
   - Write a Node unit check that loads a v285-shaped state and asserts tick counts are identical before and after.
2. **Single regional-quest table (E1-2).**
   - Replace `QUEST_ID`, `QUEST_POI`, `QUEST_AREA`, `RQ_LOC`, `QUEST_AFTER` and the `where` strings with one `RQ = [{name,id,rec,unlocksAt,zone,place,npc,kib,m,after,afterBasis,reward,rw:{st,cr}}]`.
   - Seed it from current values; for the 7 zone conflicts, use `QUEST_AREA` for the zone and the camp for the place.
   - `quests()` and `rqCard` read only from `RQ`.
   - Availability uses `rec` (item level), not `g.lv`.
3. Fix **P0-1** (dedupe stigma cards) and **P1-8** (`ns` short titles plus punctuation fallback).
4. **P0-6** and **P0-7** text fixes, which are not claim changes.
5. Remove the **P1-9** Paid filter.
6. **Not in game yet** snooze (P1-10) on rqCard rows and milestone quest rows. One click; it clears on Level up or when its `after` is ticked.
7. **Stigma pick (P0-10).** Each slot's "Mark equipped" offers the 4 stigma names (default = plan). E-stack, rotation and Coming up use the picked names. Make the shard deduction on equip a visible "−1 shard" with undo, not silent.
8. **P1-1 (UI part).** The Skills card is never empty in either mode. Past the plan it shows "N points unplanned · see Build plan".
9. **P1-2 (UI part).** At the end of the story data: Next up shows a story card "Continue the story in game (guide covers to X)" with no dead "Turned in"; the input message no longer says 40–45 isn't covered once E2 lands.
10. P2 tasks: P2-1, P2-2 (dead JS/CSS; QA screenshot baseline before and after), P2-6, P2-8, P2-9 (seed guard and Export/Import), P2-4, P2-5, P2-7, P2-10, P2-11.

**Output:** `assassin-route.html` (E1), `backup-v286-E1.html`, `polish/E1-CHANGES.txt` (one line per change with the line refs).

**Acceptance:** QA1 passes; no behaviour change besides the listed items; migration check passes; file size drops by at least 40 KB (dead CSS).

### E2: Engineer phase 2, data integration (after R1, R2, R3 and V1 have delivered)

1. `data/rq.json` and `rq-chains.json` → `RQ`:
   - Kibelisks.
   - Chains: confirmed chains lock; inferred chains show "likely after X" but don't lock.
   - Re-band by `rec` into the gate with the highest `lv ≤ rec`, using the E1 stable keys.
   - Per-quest `rw` for CLEAR_REWARD.
   - Optional "XP" in the row tooltip.
2. `data/story-40-45.json` → append to `QUESTS`, `QUEST_STEPS` and `QUEST_LOC`; update the story texts (3192, 3372).
3. `data/strongholds.json` → `STRONGHOLDS`: real levels and zones, band = rec level; Kibelisk shown like dungeons.
4. `data/dungeons.json` → fill `AREA_LOC`; either all XP or no XP in the UI; per-band rewards for CLEAR_REWARD.
5. `data/build.json`:
   - Extend `SP_SKILLS` (append ranks; keys `sp:<name>:<L>` are name-based, so they're safe).
   - Replace Vaizel and Triniel nodes (new keys; add Ariel only if confirmed).
   - Stigma availability: hide stigmas the data says aren't available yet.
   - Expedition items get `story:`.
   - Fix VERIFIED_UNLOCKS.
6. `data/claims.json` → apply every action. Rebuild the Confidence card and Sources card from data (P2-3).

**Acceptance:** QA2 passes; every JSON field the UI uses is traceable to a source URL in the Sources card.

### E3: Engineer phase 3

Fix everything QA2 reports. No new features.

### QA (QA1 after E1, QA2 after E2, QA3 final)

**Input:** `polish/lead/lv.js` and `mob.js` as starting points, plus `bash icons/map.sh`.

**Build `polish/qa/regress.js`. Matrix:**
- Lv 25–45 (every level)
- Basic and Advanced
- Widths 1500, 1100 and 390
- Two state fixtures:
  - (a) "clean": everything below the level done.
  - (b) "messy": some missed steps, in-progress quests, a dungeon in progress, the story gated above the level, stones and crystals pending.

**Assertions:**
- No `pageerror`.
- No two Next up cards with the same `data-now` action or the same tick key.
- No card title ends in `:` or `.`.
- The Skills, Daevanion and Stigmas cards are never empty.
- A story card exists at every level, and "Turned in" always changes state.
- At 45 Ahead shows the cap and Level up is disabled.
- `scrollWidth == innerWidth`.
- Every open regional quest row has a zone, and its zone matches between the milestone row and Next up.
- Every chain lock refers to a quest that exists.
- Migration: a v285 fixture's tick counts are preserved.
- `update()` takes under 15 ms (median of 10).

**Additional checks:**
- Screenshot diff for the CSS cleanup (E1): same screenshots before and after, with any pixel difference > 0.5% flagged for review.
- Text lint: every TIPS/GATES/STEPS sentence that appears as a `claims.json` claim with action `drop` must be gone.

**Output:**
- `polish/qa/results.json`: `[{ level, mode, width, fixture, check, pass, detail }]`
- Screenshots in `polish/qa/shots/`
- A short pass/fail list in the QA agent's final message to the coordinator.

**Acceptance:** zero failing checks at QA3.

---

## 4. Notes for the coordinator

- **Hire order:** start R1, R2, R3, V1 and E1 together now. QA1 is ready when E1 delivers. E2 starts only when all four data files exist; partial data is fine if each file is complete for its own scope.
- **Fetch approvals:** R1 is the bulk (about 50–62 Metabot pages). If approvals are per-URL, run R1 first so the user approves one burst.
- **Assumptions to state to the user:**
  - The source policy above, including that Metabot DB fields count as data.
  - Inferred quest chains will show "likely after", plus a one-click "Not in game yet". This means wrong availability fixes itself without him reporting anything.
- **Out of scope:** anything past 45 beyond the existing g45 card (no endgame guide), screenshot parsing and automation.
