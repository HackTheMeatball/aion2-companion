# Data format v2

**Status:** approved; built in 0.2 step 5b (see [§16](#16-5b-as-built) for what the build added or deviated). The independent review
([docs/reviews/2026-10-data-format-v2-review.md](reviews/2026-10-data-format-v2-review.md)) approved it with changes.
This revision applies all of its must-fix items (M1–M11), the owner's answers of 2026-10-14, the owner's new
requirement F15 (location-aware Next up) and the specialty rule from F3/F4. Nothing is built on it until the owner
approves this revision; then 5b (data build) and 5c (saves) start.

**In plain words, for the owner.** Your saved progress is untouched: every tick, level and story position keeps the
label it has today. What this document sets up for the team:

- Game facts (quests, skills, board nodes, dungeons) are kept apart from **build choices** (which skills, specialties,
  stigmas and nodes to take). Each class gets one guide build plus up to two credited alternatives, and later your own
  custom build, saved with your character.
- **Specialties** follow your rule: 3 slots per skill at effective skill level 8, 12 and 20, where effective level =
  levels you bought + Daevanion board nodes for that skill. The 5 choices unlock at 8, 8, 8, 12 and 16.
- **Your in-game screens outrank every website.** When a site disagrees, its value is kept as a recorded disagreement.
  Screens are cited by a short code plus the game version, never by file name.
- **Sync keeps un-ticks** (a small time stamp per item); display settings stay per device.
- **Next up can know where you are:** every quest giver, turn-in, dungeon and stronghold gets a zone, and "where you
  last were" is worked out from the last thing you ticked. Nothing new is stored for it. Ascension quests have no map
  location (you teleport in), so they never count as "where you are"; instead, an Ascension quest you can do goes to
  the top of Next up.
- Every fact records which website and which game version it was checked against, so a patch tells us exactly what to
  re-check. aion2.th.gl is withdrawn and the sites whose terms forbid bots are read by a person only.

What this step contains: this document, draft JSON Schemas in [`data/schema/`](../data/schema/), and sample records
that validate against them in [`data/schema/examples/`](../data/schema/examples/). Nothing in `src/`, `data/*.json`,
`tools/` or the build changes.

Contents: 0 What changed in this revision · 1 Goals · 2 Layout · 3 Ids and save keys · 4 Files and `schemaVersion` ·
5 Provenance · 6 Steps: `requires` / `completesWith` · 7 Text · 8 Builds and specialties · 9 Locations (F15) ·
10 Catch-up inputs · 11 Collections · 12 Field mapping · 13 Saves and `merge()` · 14 Decisions and open items ·
15 What 5b and 5c must prove · Appendix: validation

---

## 0. What changed in this revision

| Item | Change | Where |
|---|---|---|
| M1 | New `builds` collection. `classes[].plan`, `skills[].specPick` and `skills[].tracked` removed from fact records; `classes` keeps `defaultBuild`. | §8, `builds.schema.json`, `classes.schema.json` |
| M2 | Build tokens `[[build:stigma:N]]`, `[[build:stigmaTarget:N]]`, `[[build:node:<board>:N]]`, `[[build:skillOrder:N]]`, plus `[[build:text:<name>]]` for build-specific prose. `g12:0`, `g22:1`, `g27:1` etc. stay shared with their keys. | §2, §7 |
| M3 | Per-character save fields `buildId` and `customBuild`, with merge rules. | §8.4, §13 |
| M4 | `specialtyChoices` with permanent ids; `rule:specialty-slots` on effective level; `specialtyAt` (bug F3) deleted; save keys `sp:<key>:spec2/spec3` reserved; stigmas get `maxLevel` and `specialtyChoices`. | §8.2, §3 |
| M5 | New `boardNodes` collection: every node on every board, with row/col. `classBoards` removed; the build's `boardPlan` says which nodes to buy. | §8.3 |
| M6 | Story ids `sq:<game id>`, `gameId` required; new `ascensionQuests` (`asc:`), `wraps`, `inCap`. | §3, §11 |
| M7 | `is` required on `story` atoms (no default); `owner-check` in `status` and atom `basis`; `{done: "sq:…"}` forbidden. | §6 |
| M8 | Sources: `access` (robots, terms, mode), `withdrawn` (aion2.th.gl), `licence.conditions`, `licence.id: custom`, `operator`. | §5.1 |
| M9 | Refs: `checkedAt` (was `date`), `build`, `region`; new `game-builds.json`; `verifiedAt` = latest `checkedAt`. | §5.2, §5.5 |
| M10 | Owner ref is a structured short code + game version; precedence owner > game database > guide/wiki > inferred, checked by the build. | §5.4 |
| M11 | Rule kinds `crystalsPerLevel`, `stigmaPointsPerLevel`; optional `route` (`core` / `filler` / `completionist`). | §10 |
| N1, N2, N3, N5, N6, N7 | Applied: import stamps (§13.3), one confidence layer for gates (§6), `upstream` (§5.1), `rewards.byClass` and faction-scoped rules, narrowed keys get a new key (§3), opaque owner codes (§5.4). N4 (effort minutes) waits for F9's measurements; N8 is moot after M1/M4. | |
| F15 | `location` with required `zone` on every located record, optional sourced `coords`; zone adjacency in `zones`; last confirmed location derived, never stored. | §9, §10, §13 |
| F3/F4 | 3 slots at effective skill Lv 8/12/20; 5 choices at 8/8/8/12/16; effective level = bought + board nodes. | §8.2 |
| Owner answers | Recorded in §14.1. | |
| Re-check (CEO) | Specialty choices on effective level; `milestones[].drawbacks` for the fastest track, and the two-track question re-evaluated in 0.3; schemas compile under ajv's full `strict: true` (exact options in the appendix). Also: `skill` required on skill nodes only, at most 5 specialty choices per skill. | §8.2, §6, §14.1, §15, appendix |
| Owner correction (2026-10-14) | Ascension quests have **no map location**: `access: "teleport"`, no `giver` / `turnin` (this reverts the re-check's location requirement). They take no part in location tie-breaks, and ticking one never updates the last confirmed location. New Next up priority rule: an Ascension step whose prerequisites are met ranks first, ahead of location and track. | §9, §10, §11, §13.3, §14.1 |

What the review said stands, and stays: the save-key strategy (`key` separate from `id`, frozen name and position
keys), the three version numbers, the condition grammar with "derived, never written as ticks", provenance on every
record, no overrides between shared and class data, "the generator compiles, it does not research", one file per
collection, the text tokens, `any` without `not`, and the field mapping.

## 1. Goals and constraints

1. **Classes without copy-paste.** All 8 classes share one skeleton (classes-and-gaps §1). Shared data is written once;
   classes differ in skills, stigmas, boards and builds.
2. **Game facts apart from build choices.** A fact is true for every player of a class; a build choice is advice. Only
   the second can differ between builds.
3. **Ids, not display names**, written out in the data. Nothing derives an id or a save key from a name or a position
   at runtime.
4. **Every fact carries its provenance:** sources (per field where it matters), a verdict, the date and the game build
   it was checked on. The owner's screen outranks everything.
5. **Every step says when it opens and when it is done** (`requires` / `completesWith`).
6. **Every located record says where it is** (zone at minimum), so Next up can rank by where the player is (F15).
7. **Saves never break.** Every save key that exists today stays valid and means the same thing. The save gains fields
   only additively (5c).
8. **No visible change in 0.2.** 5b compiles v2 into the constants the app uses today; acceptance is "golden
   identical".
9. **The generator compiles, it does not research.** Corrected values are stored in the data (the source's differing
   value goes to `conflicts`); the generator validates, joins and reshapes. Presentation stays in code.

Non-goals for 0.2: localisation, Elyos content, new data, new UI, changing any save key, fixing F3 (0.3).

## 2. Layout: shared vs per class

```
data/
  schema/                          JSON Schemas (draft 2020-12), one per collection, + common.schema.json
  sources.json                     sources registry (sites, access, licence, use) + pages cited only by guide text
  game-builds.json                 observed game build strings per numbering scheme
  shared/                          class-independent
    rules.json  boards.json  items.json
    asmodian/                      faction-specific, class-independent
      story-quests.json  ascension-quests.json  regional-quests.json  sealed-dungeons.json
      strongholds.json  zones.json  unlocks.json
      guide/                       the guide's own content (rights reserved, LICENSE)
        milestones.json  steps.json  tips.json  claims.json  confidence.json
  classes/
    assassin/
      class.json                   the class and its default build id
      skills.json  stigmas.json  board-nodes.json      game facts
      builds.json                  the guide build + up to two credited alternatives
      steps-asmodian.json          (rare) steps true for this class whatever the build
      claims.json  tips.json       (optional)
```

**The bundle.** One character loads `sources.json` + `game-builds.json` + `shared/*.json` + `shared/<faction>/**` +
`classes/<class>/**`, and one build: `char.buildId`, else the class's `defaultBuild` (§8.4).

- **No overrides.** A class file adds records; it never replaces or patches a shared record.
- **Shared steps name build choices only through `[[build:…]]` tokens** (M2). A class step exists only for text that is
  true for one class whatever the build. So `g12:0`, `g22:1`, `g27:0/1`, `g32:0/1`, `g37:0/1` stay shared, with the
  same keys and positions, and follow the player's build.
- **Ids are unique across the repository; save keys are unique within a bundle.** Class records have class-qualified
  ids (`skill:assassin:heart-gore`); their keys stay as today (`sp:Heart Gore:3`, `dv:hg`).
- **Faction:** a folder for content and a field on records. Skills, stigmas and boards are the same for both factions
  (classes-and-gaps, review R2), so class folders are not split by faction except for the rare class steps. Class
  reward weapons go to `rewards.byClass`; faction differences in rules go to `appliesTo.faction` (N5).
- One file per collection, records sorted by id.

## 3. Ids and save keys

Every record has an **`id`**; every record a save refers to has a **`key`**. Both are written out, never derived.

| Rule | Why |
|---|---|
| `id` = `<kind>:<local>[:<local>…]`, lowercase, never derived at runtime, never reused, never changed once released. | Stable references. |
| `key` = the save key; **equal to today's key for every existing record**. | Saves stay valid. |
| New ids: the game id when one is known (`rq:2202044`, `sq:2102235`), else a slug (`asc:hears-the-voice`). Story quests always use the game id (M6: all 88 Asmodian ids are known; a bare Metabot slug like `daeva-in-a-dream` is the **Elyos** page). | |
| A renamed thing keeps id and key; `name` changes. A removed thing's id and key are retired in `data/retired.json` (5b adds it; the build fails if one reappears). | |
| **A narrowed meaning gets a new key** (N6): if a step's meaning narrows (prereq-gates §9.3 proposes `g45:0` → "Witnesses the Nightmare" only), it gets a new key (`g45:witness`) and the old key is retired. Old ticks never claim something different. | A narrowed key is a reused key in disguise. |

Id kinds: `sq:<game id>` story · `asc:<slug>` Ascension · `rq:` regional · `sd:` Sealed Dungeon · `sh:` stronghold ·
`zone:` · `unlock:` · `item:` · `rule:` · `board:` · `tip:` · `conf:` · `src:` · `gb:` game build · `class:` ·
`build:<class>:<slug>` · `skill:<class>:<slug>` · `spec:<class>:<skill-or-stigma>:<n>` · `stigma:<class>:<slug>` ·
`node:<class>:<board>:r<row>c<col>`; milestone ids are today's (`g6`…`g45`, `build`, …); claims keep `C01`…; steps keep
today's key as id.

**Save keys and their v2 home** (every existing key checked against the schema patterns: 69 milestone keys, 60 Sealed
Dungeon slugs, every `dv:` key, every MIG_V5 target):

| Save field / key family | v2 home of the key |
|---|---|
| `checks` / `started` / `rqSnooze` `rq:<game id>` | `regionalQuests[].key` |
| `checks` / `areaRun` `sd:<slug>`, `g10h:<slug>` | `sealedDungeons[].key` |
| `checks` `sh:<slug>` | `strongholds[].key` |
| `checks` `g<lv>:<n>`, `g<lv>:<word>`, `build:<n>`, `story:<n>`, `daily:<n>`, `f2p:<n>`, `hold:<n>` | `steps[].key` |
| `checks` `sp:<skill name>:<L>` | `skills[].key` (the name segment); per-level keys generated |
| `checks` `sp:<skill name>:spec` (slot 1, today) and **reserved** `sp:<skill name>:spec2`, `sp:<skill name>:spec3` (M4) | `skills[].key`; slots from `rule:specialty-slots` |
| `checks` `dv:<n>`, `dv:z:` / `dv:v:` / `dv:t:<n>`; new `dv:<board>:r<row>c<col>` for nodes with no key today (M5) | `boardNodes[].key`; legacy "any one of these" keys (`dv:corner`) on `builds[].boardPlan[].key` |
| `quest`, `storyEnd`, `qsteps{name}`, `qsub{name}` | `storyQuests[].key` = the English name (owner decision: names stay as save labels) |
| `qsteps{name: [i]}`, `qsub{name: {i: [j]}}` | `steps[].i`, `steps[].subs[].j`, written out, never renumbered |
| `stLv{name}`, `stPick{slot: name}` | `stigmas[].key` = the name |
| `dvCost{key}` | node `key` |
| `open{id}`, links `#g22` | `milestones[].id` |
| new (5c/0.3): `buildId`, `customBuild` | §8.4 |

## 4. Files and `schemaVersion`

Every data file is an envelope: `{ "$schema", "schemaVersion": 2, "collection", "faction"?, "class"?, "records" }`.

| Number | Where | Meaning | Rule |
|---|---|---|---|
| Data `schemaVersion` | every data file (`2`), the compiled bundle | Major version of this format (today's files are "v1") | Additive optional fields don't bump it; anything else does; the generator refuses an unknown major. |
| Save `schemaVersion` | the save (5c) | Shape of stored state. **Absent = 0**; 5c writes `1`. | Only increases, only through an additive, flagged migration. |
| App `version` | `package.json` | Release | Unrelated. |

The localStorage key stays `aion2-assassin-route-v4`; its `v4` is not a version.

## 5. Provenance

### 5.1 Sources registry (`data/sources.json`)

One record per site:

| Field | Meaning |
|---|---|
| `id`, `name`, `hosts[]` | Every URL in the data must resolve to exactly one site by host. |
| `kind` | `game-database` · `guide` · `news` · `wiki` · `official` · `community` · `owner` |
| `independenceGroup`, `groupReason` | Sites in one group count as one source. Wikily is its own group (NX Software SAS, data-sources §10.2). |
| `upstream` (N3) | Shared upstream of client-extracting databases (`global-client`). Game-database fields from one upstream count once toward "two sources"; one game-database field is still enough on its own (policy). |
| `operator` | Who runs the site (gamers4.life and interactivemap.app share one, R7). |
| `licence` | `id` (SPDX, `custom`, `all-rights-reserved`, `unknown`), `conditions[]` (`attribution-link-to-page`, `dofollow`, `non-commercial`, `no-endorsement`, `share-alike`, `no-redistribution`), `url`, `checkedAt`, `note`. Metabot: `custom` with attribution link, dofollow, non-commercial, no endorsement (terms read 2026-10-14). The build can list every record a condition touches (e.g. non-commercial). |
| `access` (M8) | `robots` (`allows` · `ai-excluded` · `unchecked`), `terms` (`allows` · `bans-automation` · `unread`), `termsUrl`, `mode` (`scripted` · `human-only` · `none`), `checkedAt`. Rules: no ref may be added or changed on a `mode: none` site; `bans-automation` forces `human-only` or `none` (schema-enforced); `unchecked` / `unread` warn. Owner decision: sites whose robots or terms forbid automated reading (Wikily, gamers4.life, aion2.app) are read by a person in a browser or not at all. |
| `withdrawn` (M8) | `{date, reason}`: used before, unusable now (aion2.th.gl, robots excludes AI agents). The build fails on any withdrawn site's URL still in the data, so its 33 citations are re-sourced (Metabot first) or relabelled `owner-check` in 5b, never dropped silently. Differs from `use.banned` (Game8: never used). |
| `use` | `facts`, `wording` (false everywhere), `quotes` (`none` / `short-credited`, claims only), `link` (`dofollow` / `nofollow` / `none`), `banned` |
| `reach`, `verifiedAt`, `notes` | |

`pages[]` holds pages that back only hand-written guide text (today `tools/gen/snapshots/sources-v287.json`).

### 5.2 Source references

```json
"sources": [
  { "url": "https://metabot.gg/en/aion-2/daevanion/assassin", "checkedAt": "2026-10-14",
    "build": { "scheme": "metabot", "value": "0.0.4387.0" }, "region": "global", "fields": ["row", "col", "cost"] },
  { "owner": { "ref": "owner:2026-10-14-01", "checkedAt": "2026-10-14",
               "build": { "scheme": "client", "value": "unrecorded" }, "what": "skill window, Quick Slice" } },
  { "inferred": "Corner stat from the board's stat totals.", "fields": ["label"] }
]
```

Exactly one of `url` / `owner` / `inferred`. `fields` replaces today's `zoneSrc`, `requiresSrc`, `kibSrc`, `xpSrc`,
`mapSrc`, `place_src`, `xp_src`, `src2`. Optional `section`, `label`, `quote` (claims only), `note`.

- `checkedAt` (renamed from `date`), `build` (`scheme`: `metabot` · `gaming-tools` · `client` · `patch`, plus the
  `value` as shown) and `region` (`global` default · `kr` · `tw`). **Required on refs added or changed after v2
  ships** (build check against the 5b baseline); legacy refs may omit them and the build lists them as debt.
  Leave them empty when unknown, never guessed (review R6).

### 5.3 Verdicts and `verifiedAt`

- `status`: `verified` · `single-source` · `inferred` · `disputed` · **`owner-check`** (waiting on an in-game look).
  Claims keep their longer list (`unverifiable`, `wrong`). `fieldStatus` overrides it per field.
- `verifiedAt` per record = the latest `checkedAt` among its refs whenever any ref has one (build check). It replaces
  `fetched`. Records with no date today get the date of the research pass that produced them (git history), never the
  migration date.
- `claims[]` on a record and `appliesTo` on the claim must agree.
- No per-item "checked on" dates in the app (owner decision); `verifiedAt` and builds drive the patch-watch report.

### 5.4 The owner's screens outrank everything (M10)

Precedence: **owner screen > game-database field > guide or wiki > inferred.**

- An owner ref is `{ref, checkedAt, build, what}`. `ref` is an opaque short code `owner:YYYY-MM-DD-NN` (N7); the map
  from code to file lives only in the private repo. The build rejects a ref that looks like a URL or a path. `build`
  records the game version shown in the launcher or settings; screens from before this rule carry
  `{scheme: "client", value: "unrecorded"}`. (Owner codes in the samples are placeholders until the private repo
  assigns them.)
- Build check: for every field an owner ref backs, the record's value is the owner's value, that field's status is
  `verified`, and any source that differs is kept in `conflicts`. One exception: a newer database value after a patch
  needs an explicit `conflicts` entry and the label `owner-check`, never a silent overwrite.

### 5.5 Game builds (`data/game-builds.json`, M9)

Observed build strings per scheme (`gb:metabot-0-0-4387-0`, first seen 2026-10-14), with the patch when known and
`sameAs` links across schemes once T1 maps them. Patch-watch becomes "refs whose build is older than X".

## 6. Steps: `requires` and `completesWith`

Every trackable record (guide steps, story and Ascension quests, regional quests, Sealed Dungeons, strongholds, a
build's plan nodes; skill levels by rule) carries `requires` and `completesWith`, always written out.

| Form | True when |
|---|---|
| `{ "all": [c…] }` / `{ "any": [c, c…] }` | every / at least one (≥ 2 branches) |
| `{ "level": n }` | character level ≥ n |
| `{ "story": "sq:<id>", "is": "reached" }` | current quest is X or later (D9) |
| `{ "story": "sq:<id>", "is": "turnedIn" }` | current quest is past X, or X is the last covered quest and `storyEnd` is X |
| `{ "done": "<id>" }` | that step/record is done (ticked or derived). **Never `sq:`** (M7): story completion is `{story, is: turnedIn}`. |
| `{ "storyStep": "sq:…", "i": n }` | objective `i` of that story quest is ticked in `state.qsteps` (E9, 2026-10-15). `completesWith` only: it derives a stronghold or an "Expedition opens" row from a story step, never written |
| `{ "itemLevel": n, "playerChecked": true }`, `{ "player": "…", "playerChecked": true }` | shown, never enforced |

- **`is` is required** on every story atom (M7). Owner check 1 (reached vs turned in, prereq-gates §3) was answered "turned in"
  for regional quests on 2026-10-15 (issue #69): their atoms say `turnedIn`; no silent default.
- Every atom may carry `basis` (`sourced` · `inferred` · `owner` · `owner-check` · `rule` · `legacy`), `sources`,
  `note`. No `not`.
- **One confidence layer (N2).** `requiresBasis` is optional and only says what atoms can't: `unresearched` (today's
  `noPre`: opens at `max(unlocksAt, rec)`), `verified-none` (sources checked, no prerequisite), `legacy` (carried over,
  no recorded source; the 0.3 audit sources or relabels it). Otherwise the build derives the record's gate basis from
  its atoms (the weakest wins) and fails on a contradiction.
- **`completesWith`** is any-of; `"tick"` is the player's tick, anything else is derived and never written as a tick.
- **Story step notes (E9).** A story `steps[]` entry may carry `note` (one line, ≤ 120 characters, shown after the step text),
  `noteBasis` (`owner` · `inferred`; required with `note`, and an inferred note says "probably", checked by gen) and
  `noteSources`. The step `text` stays what the source says; gen compiles notes into `QUEST_STEP_NOTES`, never into
  `QUEST_STEPS` (whose text the page parses).
- **`route`** (M11, optional on steps, regional quests, Sealed Dungeons, strongholds): `core` · `filler` ·
  `completionist`. 5b fills it from today (`optional` → `completionist`, else `core`), so nothing changes on screen;
  the owner approves labels milestone by milestone in 0.3 (decision), with "fastest" as the default view.
- **Confirmed drawbacks of the fastest track** live on the milestone: `milestones[].drawbacks[] {text, status, sources,
  about}`. Only `verified` or `owner-check` entries with at least one source (the schema rejects `inferred`); `about`
  names the filler / completionist records whose skipping causes it (e.g. "Skipping Shugo-of-All-Trades: Asmodian
  loses its Cube Expansion Voucher", from its Metabot rewards). Shown next to the track toggle in 0.3; none exist in
  the data yet. Whether two tracks make sense at all is re-evaluated in the 0.3 design (§14.1).

Today's special cases:

| Today | v2 |
|---|---|
| `byStory: true, story: X` | `storyQuest: "sq:…"` + `completesWith: ["tick", {story, is: turnedIn}]` |
| `story: X` / `after: X` | atom `{story, is: reached}` |
| `turnedIn: X` | atom `{story, is: turnedIn}` |
| milestone `lv`, node `blv` | atom `{level: n, basis: rule}` |
| `eput: n` | `stigmaKeySlot: n` + `completesWith: ["tick", {done: <slot n step>}]` |
| `stig: n`, `bo: Board` | `stigmaSlot: n`, `opensBoard: "board:x"` |
| rq `after[]` / `story` / `unlocksAt` / `noPre` | atoms + `requiresBasis: unresearched` for `noPre` |
| Ascension steps (`g22:0`, `g32:dreams`, `g45:0`) | `ascensionQuest: "asc:…"`; the Ascension record carries the wrapper completion (`completesWith {story: <wrapper>, is: turnedIn}`), used from 0.3 |

Behaviour that changes on purpose (derived completion, the wrapper rule, gate semantics) belongs to 0.3, case by case
with the owner. In 0.2 the compiler emits today's flags, so behaviour is unchanged.

**`proposed` (0.3 prerequisite audit; added after 5b).** A gate that would change behaviour once the 0.3 evaluator
reads it is stored next to the live one, never in it: `proposed {requires?, requiresBasis?, completesWith?, status,
check?, change, basis}` on any record with `stepFields` (and a build's plan nodes), and on boards (the Daevanion window gate `{done: "unlock:daevanion"}`, which every plan node on the board inherits; `done` on an unlock is true when its `at` holds). `status: ready` = sourced or owner-decided,
applied in its 0.3 build step once the owner approves the golden-master difference; `owner-check` = waits for the
numbered in-game check (prereq-gates §11). Applying one replaces `requires`, `requiresBasis` (absent = removed) and
`completesWith`. The generator checks proposals like live gates and never compiles them (`tests/schema.mjs`: the
module is identical without them); `npm run gen` lists them. Design: docs/design/0.3-requirement-engine.md §7.

## 7. Text

Guide text has no code in it. Tokens expand to exactly today's HTML:

| Today | v2 token |
|---|---|
| `${I("enhance")}`, `${I("crystal", "crystals")}` | `[[item:enhance]]`, `[[item:crystal\|crystals]]` |
| `${T("Respec is free", "respec")}` | `[[tip:respec\|Respec is free]]` |
| `${stn(1)}`, `${eRow(2)}` | `[[stigma:1]]` (the stigma in slot 1: the player's pick, else the build's), `[[erow:2]]` |
| `${mapQ(2102100, "Ulgorn")}` | `[[mapq:2102100\|Ulgorn]]` |
| `${ASC}`, `${DAEVA}`, `<span class="rotseq"></span>` | `[[asc]]`, `[[daeva]]`, `[[rotseq]]` (their text stays in code, review R9) |
| `<span class="loc">…</span>` | its own field `loc` |
| "Plan: Triniel's Dagger", "raised to level 10" (M2) | `[[build:stigma:1]]`, `[[build:stigmaTarget:1]]` |
| node and skill-order mentions (M2) | `[[build:node:<board>:N]]`, `[[build:skillOrder:N]]` |
| build-specific prose (the Nezekan node narrative in `g12:0`, "then Q (Shadowstrike)" in `g27:1`) | `[[build:text:<name>]]` → `builds[].texts.<name>` |

Allowed markup: `<b>`, `<i>`, `<br>`, entities; tips also `<p>`, `<p class="muted">`, `<ol>`, `<ul>`, `<li>`.
Anything else, an unknown token or an unknown `build:` kind fails validation.

## 8. Builds and specialties

### 8.1 Builds (M1; owner decisions)

`classes/<class>/builds.json`, one record per build:

- `origin`: `guide` (the class's `defaultBuild`) or `community`. **At most three per class: one guide build plus up to
  two credited alternatives** (schema `maxItems: 3`; the build checks exactly one `guide`). Alternatives are credited
  to the sites they came from; we take the choices, never the wording. A build needs two agreeing sources or its
  status is `single-source`.
- Choices, all as record ids (the build checks each resolves): `statPriority {tiers, from}`, `skillOrder[]` (a skill
  is "in the plan", today's `tracked`, iff it appears here), `specialtyPicks {skill: [choice ids for slots 1..3]}`,
  `stigmaSlots[]`, `stigmaTargets[]`, `stigmaSpecialtyPicks`, `boardPlan[]` (which nodes to buy, placed in milestones
  like today's `dv` items, each a step with `requires`/`completesWith`), `keyStacks {rightClick, eOrder}`, `texts{}`.
- Each source's own order (today `stigmaRules.equipOrder`) moves to a claim that backs the disputed choice.
- 5b compiles the guide build into today's `SP_SKILLS`, `SP_EXTRA`, `STIGMA_PLAN`, `ST_TARGETS`, `STAT_TIERS`,
  `STAT_SRC`, `RMB_STACK`, `E_ORDER` and the `dv` plan items, so the golden tests stay identical.

### 8.2 Specialties (M4, F3/F4)

- **Slots:** 3 per skill, opening at **effective** skill level 8, 12 and 20 (`rule:specialty-slots`, owner screen F4).
- **Choices:** 5 per active skill, available at **effective** skill level 8, 8, 8, 12 and 16, the same effective level
  as the slots (`skills[].specialtyChoices[]`, at most 5, numbered 1–5, permanent ids `spec:<class>:<skill>:<n>`, Metabot text plus an optional display `label` where the
  guide words it differently today). Stigma choices at stigma level 5/10/15/20, same shape.
- **Effective skill level** (used by both the slots and the choices) = highest ticked `sp:<key>:<L>` (1 if none) + the `adds` (default 1) of every owned board
  node whose `skill` is this skill, including nodes outside any build's plan (that is why M5 lists every node).
- **Save keys:** `sp:<key>:spec` = slot 1 (as today), `sp:<key>:spec2` and `sp:<key>:spec3` reserved for slots 2–3.
- The old "learn + 18" gate is bug F3 and is **not** a rule in the data. 5b keeps it inside the compiler only, so
  0.2's output stays identical; 0.3 replaces it (a visible fix the owner approves).
- Stigmas carry `maxLevel` (40 for Assassin and Ranger, 25 for the other six: Metabot, owner check pending).

### 8.3 Board nodes (M5)

`classes/<class>/board-nodes.json`: every node of every board (Assassin: 89 + 89 + 89 + 117 + 153 from Metabot's
planner, build 0.0.4387.0), with `row`, `col`, `type` (`start` · `stat` · `skill` · `unique`), `grade`, `cost`,
`label`, `skill` and `adds` for skill nodes (`skill` is required on `type: skill` and forbidden on every other
type, so effective level can't miss or miscount a node), `gameId`. Keys: the existing `dv:` key where the node has one (a
written-out mapping in 5b), otherwise `dv:<board>:r<row>c<col>`. Two mapping cases need care in 5b:

- **Plan keys for one of several identical nodes** (`dv:as` / `dv:as2`, `dv:ew` / `dv:ew2`, `dv:z:db` / `dv:z:db2`:
  Nezekan has two Assault Stance and two Exploit Weakness nodes, Zikel two Defense Break nodes). Which physical node each key means comes from the owner's board (path costs
  in `g12:0` fit only one assignment; classes-and-gaps §4.4 computes them) or an owner check.
- **"Any one of these" plan keys** (`dv:corner`: any Nezekan corner). These stay build-level: `boardPlan` entry with
  `anyNode[]` and the legacy `key`, so the save key keeps its meaning.

Path costs are computed from the grid (4-neighbour Steiner tree from Start), never stored.

### 8.4 Build choice and custom builds in the save (M3; owner decisions)

Per character (added to `CHAR_FIELDS` when built, 5c or 0.3):

| Field | Meaning | Default when absent |
|---|---|---|
| `buildId` | the build the character follows | the class's `defaultBuild`, so every existing save behaves as today |
| `customBuild` | `{ "basedOn": "<build id>", "picks": { "specialtyPicks": {…}, "stigmaSlots": […], "boardNodes": […] } }`: only what the player changed, keyed by record ids | none |

- A custom build always **starts from a listed build** (`basedOn`) and overrides picks. It is saved with the
  character, included in Export, and synced in 0.5.
- **Never silently dropped:** an unknown id in `customBuild` (a patch removed or renamed something) is ignored with a
  visible notice and kept in the save.
- `stPick{slot: name}` keeps meaning "what's equipped in the game"; the build only says what the guide recommends.

## 9. Locations (F15)

**Every located record has a `location`** with `zone` required: story quest `giver` / `turnin`, regional quest
`giver` / `turnin`, Sealed Dungeon `entrance`, stronghold `location`. Quest objectives may carry a `zone` too.

**Ascension quests are not located** (owner, 2026-10-14). They unlock when their prerequisites are met and the player
teleports in (Journal → Ascension → Teleport), so an `ascensionQuests` record has `access: "teleport"` and no `giver`,
`turnin` or zone (the schema rejects them). Consequences:

- they take no part in location tie-breaks (no zone, no distance);
- ticking one, or a step with `ascensionQuest` set (`g22:0`, `g32:dreams`, `g45:0`), **never** updates the last
  confirmed location: the derivation below skips them;
- their place in Next up comes from the priority rule in §10 instead.

```json
"giver": { "npc": "Dari", "place": "Temporary Investigation Base", "zone": "zone:dredgion-crash-site",
           "kibelisk": "Temporary Investigation Base", "meters": 18,
           "coords": { "map": "altgard", "x": 1234, "y": 567, "sources": [ { "url": "https://metabot.gg/…" } ] } }
```

- `coords` is optional and always carries its own source.
- **Zone adjacency** is shared data: `zones[].neighbours[] {zone, via: walk|flight|portal, sources}`, symmetric (build
  check). Distances are hop counts derived from it, never stored. Kibelisk teleports make most trips cheap, so adjacency
  is a tie-breaker for Next up, not a route planner.
- **Last confirmed location is derived, never stored:** the zone of the located item (or objective) with the most
  recent change time, ignoring Ascension records and steps with `ascensionQuest`, in the save's per-item change times (`mt`, §13). A tick of a regional quest says the player was
  at its turn-in zone; a Sealed Dungeon tick, at its entrance's zone. Because it comes from `mt`, it survives sync and
  needs no field of its own; with no `mt` (old saves) Next up falls back to today's order.
- Zones referred to by camp or Kibelisk names resolve through `zones[].camps` / `zones[].kibelisks`.

**Data task before 5b (Data & Research, not a 5b data patch).** Today's data has no zone for many locations:

- 36 of the 87 story quests in the app have no giver or turn-in data at all (story.json starts at Lv 24);
- many Kibelisks and places in story.json, story-40-45.json and rq.json turn-ins (e.g. Wind Altar / Purifying Forest
  Coastal Cliff, Latesran Eastern Root) have no zone in the data.

They are filled from permitted sources (Metabot quest pages and maps, scripted; others by a person) or labelled
`inferred` / `owner-check` per field, before 5b freezes the format. Adjacency has no source in the repo yet: Metabot's
region maps or owner screens, each neighbour with a source. The samples mark every zone that rests on an inference.

## 10. Catch-up inputs (F1, F10, F15)

What 0.3's "what can I do now" ranking reads, all from data or derived:

| Input | Where |
|---|---|
| Skill points by level | `rule:level-points` (now verified: Metabot's client level table matches every level 4–45) |
| Daevanion Crystals by level (4 per level from 12; 136 at 45) | `rule:crystals-per-level` (M11) |
| Stigma points by level (1 per level 23–39, 2 per level 40–45; 29 at 45) | `rule:stigma-points-per-level` (M11) |
| Costs | `rule:skill-point-cost`, `rule:stigma-shard-cost`, board node `cost` + grid paths |
| Rewards | `rewards` on quests and dungeons |
| Done without ticks | derived from the story position (0.3) |
| Fast path vs filler vs completionist | `route` (M11) |
| Where the player is | last confirmed location (§9), zone adjacency |
| Effort | N4 (`effort.minutes`) once F9's measurements exist |

**Next up priority (owner, 2026-10-14).** Ranking keys, in order:

1. **Ascension first:** an Ascension step (an `ascensionQuests` record, or a step with `ascensionQuest` set) whose
   `requires` is met ranks ahead of everything else, regardless of location or track. "Met" means every evaluable atom
   holds. Atoms the app can't see (`playerChecked`, e.g. "Ascension Gauge at 100%") don't block it; they are shown on
   the card as "check in game", as today.
2. Track (`route`, fastest by default) and location (last confirmed zone, then adjacency) as tie-breakers for
   everything else, in the order the 0.3 design settles.

This is 0.3 engine behaviour (0.2 keeps today's order); it needs no new data beyond what this format already holds.

## 11. Collections

| Collection (schema) | Scope | Notes |
|---|---|---|
| `sources` | repo | §5.1 |
| `gameBuilds` (`game-builds`) | repo | §5.5 |
| `storyQuests` | faction | `sq:<game id>`, `gameId` required; order via `next` (one path, one `end`); `wraps` (4 records); `inCap: false` past Lv 45; `unlocks`; giver/turn-in with zone. |
| `ascensionQuests` | faction | `asc:<slug>`; chapter I–V; `access: "teleport"`, no location (owner); completion from the wrapper; ranks first in Next up once its prerequisites are met (§10). `guideStep` (0.3 E8): the guide step key whose stored tick also fills the chapter's segment on the Journey card's Ascension bar (`g6:0`, `g22:0`, `g32:dreams`, `g45:0`; none for the Oath, past the cap); the generator checks it is a real step and, where a step names this record in `ascensionQuest`, that it is that step. |
| `regionalQuests` | faction | prerequisites as atoms with their own sources; `zone` = `giver.zone`; `route`. |
| `sealedDungeons` | faction | `band` places it; `entrance` with zone; `mapSlug`; `route`. |
| `strongholds` | faction | `levelRange` (inferred); `location`; `route`. |
| `zones` | faction | `traces`, `camps`, `kibelisks`, `neighbours`. |
| `unlocks` | faction | informational; `at` is a condition. |
| `items`, `boards` | repo | |
| `rules` | repo | `kind` + typed `value` + `appliesTo` (`all-classes`, class list, or `{classes, faction}`). |
| `milestones`, `steps`, `tips`, `claims`, `confidence` | faction (shared) or class | guide content |
| `classes` | class | id, name, role, release, `defaultBuild` |
| `builds` | class | §8.1 |
| `skills` | class | facts; `type` active/passive (F2); `specialtyChoices` |
| `boardNodes` (`board-nodes`) | class | §8.3 |
| `stigmas` | class | `maxLevel`, `specialtyChoices` |

## 12. Field mapping: every current field

"→" names the v2 field. **Derived** = computed, not stored. **Code** = presentation or behaviour. **Retired** =
dropped from the data, kept in git history. Changes from the first draft are in **bold**.

### 12.1 `data/rq.json` (58)

| Field | → v2 (`regionalQuests`) |
|---|---|
| `name`; `id`; `slug` | `name`; `gameId`, and `id` = `key` = `rq:<id>`; `metabotSlug` |
| `src`, `fetched` | `sources[] {url, fields, checkedAt}`; `verifiedAt` |
| `rec`, `unlocksAt` | `rec`, `unlocksAt` (+ `{level}` atom) |
| `requiresStory[]` (`name`, `id`, `storyLv`, `inAppQUESTS`) | atom `{story: "sq:<id>", is: …}` (**`is` written per atom**); `storyLv`, `inAppQUESTS` derived |
| `requiresRegional[]`, `requiresSrc[]` | atoms `{done: rq:…}` with their `sources` |
| both `null` | `requiresBasis: "unresearched"` (`noPre`) |
| `zone`, `zoneSrc` | resolved `zone` (= `giver.zone`), source value in `conflicts`; `sources {fields: [zone]}` |
| `giver`, `turnin` {`npc`, `place`, `kib`, `m`} | `giver`, `turnin` `location` (**`zone` required**, F15) |
| `steps[]` {`text`, `kib`, `m`} | `steps[] {i, text, kibelisk, meters, zone?}` |
| `rewards` {`xp`, `kina`, `wisdom`, `crystal`, `items`, `ap`} | `rewards` |
| `prev`, `prevBasis` | atoms with `basis` / `sources` |
| `notes[]`, `conflicts[]` | `notes`, `conflicts` |
| `app` {`gate`, `lv`, `where`, `area`, `reward`, `after`, `poi`} | **Retired** (pre-E1 snapshot); `where`/`area`/`reward` derived; 5b lists any `poi` term not derivable |
| (new) | **`route`** |

### 12.2 `data/rq-chains.json` (61)

| Field | → v2 |
|---|---|
| `quest`, `after`, `kind: regional` | atom `{done: rq:<after>}` |
| `kind: story`, `storyId`, `storyLv` | atom `{story: "sq:<storyId>", is: …}`; `storyLv` derived |
| `kind: none`, `status: confirmed-no-prereq` | `requiresBasis: "verified-none"` on each quest covered |
| `basis`, `status: confirmed` | atom `basis: "sourced"` |
| `sources[]` (URL + parenthetical) | atom `sources[] {url, section, quote, note}`; **aion2.th.gl URLs re-sourced or `owner-check`** |
| `note` | atom `note` |

### 12.3 `data/story.json` (40) and `data/story-40-45.json` (11)

| Field | → v2 (`storyQuests`) |
|---|---|
| object key (name) | `name`, `key`; **`id` = `sq:<gameId>`**, **`gameId` required** (prereq-gates §4) |
| `lv`, `unlocksAt`, `type`, `chapter` | `lv`, `unlocksAt`, `questType`, `chapter` |
| `steps[]` | `steps[] {i, text, zone?}` |
| `giver*`, `turnin*` | `giver`, `turnin` `location` (**zone required**; §9 data task) |
| `rewards` | `rewards` (+ **`byClass`** for the 7 class weapons) |
| `next`, `prev`, `end` | `next`; `prev` derived; `end {region, regionFull, note}` |
| `notes`, `src`, `fetched` | `notes`, `sources`, `verifiedAt` |
| (new) | **`wraps`**, **`inCap`** |

### 12.4 `data/strongholds.json` (15)

| Field | → v2 (`strongholds`) |
|---|---|
| `name`, `qid`, `type`, `questType`, `faction` | `name`, `gameId`, `type`, `questType`, `gameFaction` |
| `zone`, `lo`, `hi`, `recLv`, `unlocksAt` | `zone`, `levelRange {lo, hi}`, `recLv`, `unlocksAt`; `requires {level: lo}` |
| `kib`, `m`, `kibSrc` | `location {zone, kibelisk, meters}` + `sources {fields: [location]}` |
| `steps[]`, `stepKibM[]` | `steps[] {i, text, meters}` |
| `rewards`, `src`, `mapSrc`, `fetched` | `rewards`, `sources`, `verifiedAt` |
| `notes[]`, `levelBasis` | `notes`; `fieldStatus.levelRange: inferred` |
| (new) | **`route`** |

### 12.5 `data/dungeons.json` (11) and `data/dungeon-bands.json`

| Field | → v2 |
|---|---|
| `name`, `band`, `type`, `zone` | `sealedDungeons` `name`, `band`, (collection), `zone` |
| `kib`, `m`, `kibSrc`; `xp`, `xpSrc` | `entrance {zone, kibelisk, meters}`; `xp`; `sources {fields}` |
| `rewards` {…, `other`, `abyssPoints`} | `rewards` (`other` → `items`; Elyos-only AP in `notes`) |
| `rewardBasis`, `bosses`, `notes`, `exploreQid` | same names (`exploreQuestId`) |
| `src`, `src2`, `fetched` | `sources`, `verifiedAt` |
| dungeon-bands `answer`, `caveats`, `bands[]` | `rules` **`rule:sd-first-clear-asmodian`** (`appliesTo.faction: asmodian`, N5); SD_RW / SD_REWARD derived |
| (new) | **`route`** |

### 12.6 `data/build.json`

| Field | → v2 |
|---|---|
| `_meta.by`, `_meta.fetched`, `_meta.policy` | retired; `fetched` → `verifiedAt`; policy = CLAUDE.md + registry |
| `_meta.skillRules` | `rule:skill-point-cost`, `rule:skill-level-gate` (**no `specialtyAt`**), **`rule:specialty-slots {slots: [8, 12, 20], levelBasis: effective}`**; prose → `notes` |
| `_meta.fullSkillList` | one `skills` record per skill; **"tracked" = appears in a build's `skillOrder`** |
| `skills[]` `name`, `type`, `learnLv`, `costs`, `gate` | `skills` `name`/`key`, `type`, `learnLv`; `costs` checked against the rule; `levelGate` |
| `skills[].specialties[]` | **`skills[].specialtyChoices[] {id, n, skillLv, text, label?}`** |
| `skills[].src`, `dvNodes`, `note` | `sources`, `boardNodes {perBoard, cost}`, `note` |
| `spOrderAfterCore` `order`, `perItem`, `skip`, `interleave`, `budget`, `notFetched`, `sources`, `verdict` | **`builds[guide].skillOrder[]` (`core: false`) and `skillOrderNotes`** |
| `levelPoints` | `rule:level-points` (**verified**, Metabot client table) |
| `boards.list[]`, `listSources`, `listVerdict` | `boards` |
| `boards.nodeCosts` | `rule:node-costs` |
| `boards.Vaizel[]`, `boards.Triniel[]` | **`boardNodes` (facts) + `builds[guide].boardPlan` (which to buy, `label`, `via`)** |
| `boards.cornerTotalsByBoard` | **derived from `boardNodes`** (sum of `unique` labels); kept as a check |
| `boards.pathCosts`, `pathCostsNote`, `skillLevelNote` | **path costs derived from the grid**; notes → build `notes` |
| `boards.Ariel`, `ArielNote` | no board record; note → claim C22 |
| `stigmas[]` | `stigmas` (+ **`maxLevel`**, **`specialtyChoices`**) |
| `stigmaRules.availability`, `.slots` | `stigmas[].availableLv`; `rule:stigma-slots` |
| `stigmaRules.equipOrder` | **`builds[guide].stigmaSlots` / `stigmaTargets`; each source's order → a claim** |
| `stigmaCost` | `rule:stigma-shard-cost`; `shardIncome` → **`rule:stigma-points-per-level`** + notes |
| `unlocks[]`, `unlocksRecommendation`, `dailyDungeon` | `unlocks` |
| (new) | **`rule:crystals-per-level`** |

### 12.7 `data/claims.json` (38)

| Field | → v2 |
|---|---|
| `id`, `claim`, `verdict`, `action`, `newText`, `note`, `sources[]` | same |
| `lines[]`, `edits[]` | retired; replaced by `appliesTo` (required for `keep` / `rewrite`) |
| (new) | `verifiedAt`; **a claim for each disputed build choice (stigma order)** |

### 12.8 `data/locations.json`, `data/current-areas-quests.json`

Not read by `gen.py`. Move to `tools/history/` in 5b after listing every value that differs from the v2 records
(`locations.json` may hold zones/places the §9 task can use, each re-checked against a permitted source).

### 12.9 Generator snapshots

| File | → v2 |
|---|---|
| `area-loc-v287.json` | `sealedDungeons[].entrance` + `xp` |
| `sources-v287.json` | `sources.json` `pages[]` |
| `hideout-area-v288.json` | `sealedDungeons[].zone` |

### 12.10 Hand-written tables in `src/data/*.js`

| Constant | → v2 |
|---|---|
| `GATES` `id`, `lv`, `title`, `blurb` / `STEPS` `id`, `title`, `blurb`, `tag` | `milestones` |
| items `k`, `t`, `ns`, `note`, `upsell`, `opt`, `adv`, `map` | `steps` `key`, `text` + `loc`, `short`, `note`, `upsell`, `optional` (+ `route`), `advancedOnly`, `mapSlug` |
| `story`, `after`, `turnedIn`, `byStory`, `stig`, `eput`, `bo` | §6 |
| plan text naming stigmas, nodes, skills | **`[[build:…]]` tokens; prose in `builds[].texts`** |
| `dv`, `board`, `blv`, `ty`, `via`; `...dvNodes()` | **`builds[guide].boardPlan[]`** (node from `boardNodes`, `requires {level: blv}`, `label`, `via`, `milestone`, `order`) |
| `...hideouts()` | `milestones[].includes`; keys from `sealedDungeons` |
| runtime-only `sub`, `subNote`, `group`, `cell`, `kind`, `name`, `hidden`, `req`, `q` | derived |
| `QUESTS`, `QUEST_STEPS`, `QUEST_LOC`, `STORY_UNLOCKS`, `UNLOCK_GATE` | `storyQuests` (shipped QUEST_STEPS text wins over story.json; the "Land of Rifts" difference is reported) |
| `VERIFIED_UNLOCKS` | `unlocks` (site names resolved to page URLs or flagged) |
| `TIPS`, `ITEMS` | `tips`, `items` |
| `HIDEOUT_AREA`, `ZONE_TRACES`, `SD_REWARD`, `SH_REWARD` | `sealedDungeons[].zone`, `zones[].traces`, `rules` `firstClearReward` |
| `NO_AREA`, `DV_TYPE`, `DV_TYPE_ICONS`, `MIG_V5`, `markup.js` helpers | code |
| `STAT_TIERS`, `STAT_SRC` | **`builds[guide].statPriority`** |
| `STIGMA_PLAN`, `ST_TARGETS`, `E_ORDER` | **`builds[guide].stigmaSlots`, `stigmaTargets`, `keyStacks.eOrder`** |
| `SP_SKILLS` `{n, learn, spec, passive}` + order; `SP_EXTRA` | `skills` (`key`, `learnLv`, `type`); **`spec` → `specialtyChoices[].label` + `builds[guide].specialtyPicks`**; order → **`builds[guide].skillOrder`** |
| `LEVEL_POINTS` | `rule:level-points` |
| `spCost`, `ST_COST`, `DV_MIN`, `SP_STEPS` | derived |
| `RMB_STACK` | **`builds[guide].keyStacks.rightClick`** |
| `SP_ICONS`, `STIGMA_ICON` | `skills[].icon`, `stigmas[].icon` |

### 12.11 `tools/gen/gen.py` and the generated block

| Today | → v2 |
|---|---|
| `CAMP_ZONE`, zone votes, `rq_zone()`, `ZONE_FIX` | `zones[].camps` / `kibelisks`; resolved zones in the data; votes stay as checks |
| `short_item()`, `label()` heuristics | code (`sourceRef.label` overrides) |
| `KEYS` (skill → `dv:` key) | written-out node keys |
| `SITE` list | `sources.json` |
| `CONF` | `confidence` records |
| generated `RQ` … `CONF` | derived by 5b's Node generator, same values |
| `gen-report.json` (417 checks) | schema + cross-record checks (§15) |
| `data/DATA_SOURCES.md` | still generated, from `sources` refs |

## 13. Saves and `merge()`

### 13.1 What a save holds

One JSON object under `aion2-assassin-route-v4`: view settings, one-time flags and one character (`CHAR_FIELDS` in
`src/core/state.js`: `checks`, `started`, `areaRun`, `level`, `quest`, `storyEnd`, `qsteps`, `qsub`, `rqSnooze`,
`stLv`, `stShards`, `stPick`, `stones`, `pendSt`, `pendCr`, `dvTotal`, `dvCost`, `dvAdj`, `dvLast`, `dvLastAt`,
`dvPts`, `crystals`, `rotSeen`). Un-ticking writes `checks[k] = false`; un-starting, un-snoozing and removing an
objective tick delete the entry.

### 13.2 `merge(a, b)` (5c)

Pure, commutative, associative, idempotent. Per character (characters, 0.5 since the 2026-10-15 renumber: matched by id; character 1 = today's save).

| Field(s) | Rule (with per-item change times, owner decision) |
|---|---|
| `checks{k}` | latest change per key wins |
| `started{k}`, `rqSnooze{k}`, `areaRun{k}` | latest change per key; a removal is a dated tombstone |
| `qsteps{quest}[i]`, `qsub{quest}{i}[j]` | latest change per element |
| `level`; `quest` + `storyEnd` (one register) | latest change wins |
| `stLv{name}`, `stPick{slot}`, `dvCost{k}` | latest change per key |
| `stones`, `pendSt`, `pendCr`, `stShards`, `dvTotal`, `dvAdj` | latest change wins (two concurrent edits: one is lost; the player re-syncs from the game screen) |
| `rotSeen` | latest change wins |
| **`buildId`, `customBuild`** (M3) | each a register, latest change wins; unknown ids inside are kept, never dropped |
| `dvLast`, `dvLastAt` | not merged (10-second undo, local) |
| `dvPts`, `crystals` | ignored (retired by `dvReset1`) |
| one-time flags (`seedLv12`, `stTriniel1`, `dvReset1`, `migV5`, `eputSync1`, …) | OR |
| view settings (`mode`, `open`, `hide`, `hideCards`, `hideOpt`, `areaLv`, `zoneOpen`, `showObj`, `showTalk`, `qsShowDone`, `trackOpen`, `trackLater`, `sound`, `dvAllOpen`, `areaDone`, `statOpen`, `areaSh`, `areasCollapsed`) | **not merged: per device** (owner decision) |
| last confirmed location (F15) | **not a field**: derived after the merge from the merged `mt` (§9), skipping Ascension ticks, so both devices agree |

Derived completions are never in the save, so there is nothing to merge for them.

### 13.3 Per-item change times (owner decision: yes, un-ticks survive sync)

5c adds, additively and behind a new flag: `schemaVersion: 1`, `savedAt` (ms), and `mt`:

```json
"mt": { "checks": { "rq:2202044": [1760439000, true], "g22:1": [1760439500, false] },
        "started": { "rq:2202017": [1760439600, null] },
        "qsteps": { "Land of Rifts": { "2": [1760439700, true] } },
        "level": [1760439800, 27], "buildId": [1760439900, "build:assassin:guide"] }
```

- Seconds since the epoch; ties break on the value (`true` > number > string > `false` > `null`). `null` is a
  tombstone. About 35 bytes per tracked entry, ~25 KB for a fully played Lv 45 character.
- **Rollback re-stamp:** on load, an entry whose value differs from its stamped value was changed by a build without
  times on **this device**; it is re-stamped "now".
- **Import stamps (N1):** entries from an Import that has no `mt` get the export's `savedAt` when it has one, else 0,
  so a stale backup never outranks newer synced progress. Test: export at T0, tick on device B at T1, import the T0
  export on A, sync; B's tick survives.
- **As built (5c):** `mt` sits in the character (a `CHAR_FIELDS` entry; today the save's top level). The quest register
  is `mt.quest = [t, [quest, storyEnd]]`. The one-time step (`stampV1`) stamps what a save already holds with 0 (its
  `savedAt` when it has one), so pre-existing progress never outranks a dated change; a fresh browser's defaults are
  stamped 0 too (since 0.2.1 a fresh browser starts at Lv 1 on the first story quest). **Story position tie-break:** for
  the quest register, equal times break on story position before value: the untouched first quest (a fresh browser's
  default) lowest, then an unset or unknown quest, then later quests by `QUESTS` order, and "turned in" over not; so a
  fresh browser never resets or clears another device's position. It reads the build's `QUESTS` order, so sync must
  merge with the same data. `savedAt` is the time of the last saved *progress* change (view-only writes leave it). Stamps are
  taken by diffing at each write, so every mutation site stays as it was.
- **Clock skew (per-item Lamport bump):** a new stamp is `max(now, previous stamp + 1)` for that item (time-0 stamps stay
  0), so an edit always beats the value it replaced, even on a device whose clock went back or runs behind. Limit: a
  stamp from a device whose clock ran far ahead wins against concurrent edits of that item until the next edit of the
  same item (which then bumps past it). A `savedAt` that isn't a positive number (a broken import) counts as absent (0).
- `mt` is also what location-aware Next up reads (§9): the newest stamp on a located item gives the last confirmed
  location; stamps on Ascension records and steps are skipped (they have no location). No separate location field,
  nothing extra to sync.

## 14. Decisions and open items

### 14.1 Owner decisions (2026-10-14)

| # | Question | Decision | In this format |
|---|---|---|---|
| Q1 | Un-ticks survive sync? | Yes: per-item change time | §13.3 |
| Q2 | Display settings sync? | No, per device | §13.2 |
| Q3 | Sites with unread terms | Facts with links, only where robots and terms don't forbid automated reading; Wikily, gamers4.life, aion2.app by a person or not at all; aion2.th.gl stays dropped | §5.1 `access`, `withdrawn` |
| — | Metabot "non-commercial" | Site stays free of ads and donations; ask Metabot before any change (DECISIONS) | `licence.conditions` lets the build list affected records |
| Q4 | Owner screens | Top authority; disagreements kept; cited by short code + game version | §5.4 |
| — | Builds per class | One guide build + up to two credited alternatives | §8.1 |
| — | Custom builds | Start from a listed build; saved per character and in Export; never silently dropped | §8.4 |
| — | Fastest / completionist | Team proposes labels from today's guide; owner approves per milestone in 0.3. Confirmed drawbacks of the fastest track are recorded per milestone. **Whether two tracks make sense is re-evaluated in the 0.3 design.** | §6 `route`, `milestones[].drawbacks` |
| Q5 | English names as save labels | Kept | §3 |
| Q6 | "Checked on" dates in the app | No per-item dates | §5.3 |
| Q7 | Daeva Trapped in a Nightmare | Added like any story quest once the owner's check confirms the giver | `storyQuests`, no format change |
| F15 | Location-aware Next up | Zone on every located record; adjacency; last location derived | §9 |
| — | Ascension quests (correction) | No map location: unlock when prerequisites are met, the player teleports in. Excluded from location tie-breaks and from the last confirmed location; an Ascension step whose prerequisites are met ranks first in Next up, ahead of location and track. | §9, §10 |
| F3/F4 | Specialties | 3 slots at effective Lv 8/12/20; 5 choices at 8/8/8/12/16 | §8.2 |

### 14.2 Still open (none blocks approving the format)

| Item | Owner of it | Needed by |
|---|---|---|
| Zones for the 36 story quests with no location data and for unzoned Kibelisks/places (§9) | Data & Research | before 5b |
| Zone adjacency with a source per neighbour | Data & Research (Metabot maps or owner screens) | 0.3 |
| Which physical node `dv:as`/`dv:as2`, `dv:ew`/`dv:ew2`, `dv:z:db`/`dv:z:db2` mean (§8.3) | 5b from the owner's path costs, else owner check | 5b |
| Re-sourcing the 33 aion2.th.gl citations | Data & Research | 5b (build fails otherwise) |
| Licence and access fields for every site in the registry | Data & Research | 5b |
| Stigma `maxLevel` on a non-Assassin character; gate semantics (owner check 1) | owner, in game | 0.3 |
| Owner screen codes (`owner:YYYY-MM-DD-NN`) for screens the data already relies on | owner / private repo | 5b |

## 15. What 5b and 5c must prove

**5b.** Golden identical, all suites green, saves untouched, single-file output for both builds, plus:

1. Schema validation of every data file in `npm test` and CI with ajv 8 `Ajv2020` and exactly
   `{ strict: true, allErrors: true }` (no relaxed options). Every schema here compiles under that: each `required` in a
   `oneOf` / `if` branch declares its properties in the same branch (ajv's `strictRequired`), and conditionals sit
   inside `allOf` next to `unevaluatedProperties` (ajv loses evaluated-property annotations from a top-level failing
   `if`).
2. Cross-record checks (today's 417 plus): ids unique repo-wide, keys unique per bundle; every reference resolves
   (`requires`, `done`, `story`, `wraps`, `milestone`, `board`, `skill`, `stigma`, `spec`, `node`, build ids, zones);
   story `next` chain is one path; every URL's host is in `sources.json`, not banned, not withdrawn, and not on a
   `mode: none` site; independence counted by group and upstream; owner precedence (§5.4); `verifiedAt` = latest
   `checkedAt`; refs added after the baseline have `checkedAt`; `claims` ↔ `appliesTo`; retired ids/keys never
   reappear; `i` / `j` / choice `n` never renumbered; exactly one `guide` build per class and ≤ 2 `community`; shared
   steps contain no class content outside `[[build:…]]` tokens; zone adjacency symmetric; every located record has a
   zone; gate-basis contradictions fail (N2).
3. The Node generator emits today's constants with the same values (the guide build expands into the plan
   constants and the token text); page markup byte-identical.
4. Every value that moved between sources of truth is listed in the PR (QUEST_STEPS vs story.json, QUEST_LOC,
   HIDEOUT_AREA vs v288, VERIFIED_UNLOCKS vs build.json unlocks, SP_SKILLS `spec` vs Metabot choice text).
5. No data patches during 5b; the §9 zone task and the th.gl re-sourcing land before it.

**5c.** `schemaVersion`, `savedAt`, `mt` added behind a new flag, idempotent and additive; a pure `merge()` in
`src/core/` with Node tests: the three algebraic properties over generated saves, "newer un-tick beats older tick",
flags OR, view settings untouched, the rollback re-stamp, the N1 import test, `buildId` / `customBuild` registers with
an unknown id kept, and a rollback test (5c save → 0.2 build → back). `mig1`, `mig2`, `journey` green;
`tests/e2-migtest.js` extended.

## Appendix: validation

JSON Schema draft 2020-12. Until 5b adds a validator to the repo (no new dependency in this step), check from a scratch
directory outside the repo:

```js
// npm i ajv@8.20.0 (scratch dir); node validate.mjs <repo>
const Ajv2020 = require("ajv/dist/2020").default;
const ajv = new Ajv2020({ strict: true, allErrors: true });   // full strict mode, nothing relaxed
for (const f of schemaFiles) ajv.addSchema(JSON.parse(read(f)), basename(f));   // all 23 schemas
// each data file: ajv.getSchema(<schema for its "collection">)(doc)
```

All 23 schemas also compile on their own under `strict: true` (each one fetched with `ajv.getSchema`).

Result for this revision: **22 sample files, 75 records**, all valid under ajv 8.20.0 with `{ strict: true, allErrors: true }` and,
independently, Python `jsonschema` 4.26 (`Draft202012Validator`). The samples cover story quests with game ids (one with `wraps`, one at the end of the chain), an
Ascension quest, regional quests (`noPre`, story-gated, two regional prerequisites, zone corrections), a `g10h:` Sealed
Dungeon, a stronghold, zones, unlocks, rules (incl. specialty slots, crystals and stigma points per level), boards,
items, game builds, milestones, shared steps with build tokens (`g12:0`, `g22:1`, `g27:1`), the Assassin class, its
guide build, skills with specialty choices, stigmas with `maxLevel`, and 7 real Nezekan board nodes (Metabot planner,
read 2026-10-14, build 0.0.4387.0: Start r8c8, Heart Gore r4c5 = `dv:hg`, two corners, a stat node, Insignia
Explosion r13c7 = `dv:ie`).

**56 broken copies are all rejected for the intended reason**, one or more per must-fix: missing `verifiedAt` /
`requires` / `completesWith`; unknown field; story id as a slug or without `gameId` (M6); story atom without `is`,
`done` on a story quest (M7); bad status; source with both `url` and `owner`; owner ref as a URL or without a game
version (M10); bad build scheme, the old `date` field (M9); `http://` URL; `<script>`, `<span class="loc">`, unknown
token, unknown `build:` token kind (M2); unknown atom; `any` with one branch; empty `completesWith`; `requiresBasis:
sourced` (N2); bad `route` (M11); location without zone, coords without a source (F15); `schemaVersion` 3; Sealed
Dungeon key prefix; objective without `i`; milestone without `lv`; rule value of the wrong shape; `specialtyAt` back,
specialty slots not on effective level, specialties as free text, `specPick` on a skill (M4); `plan` on a class, four
builds, origin `template`, a specialty pick that isn't a choice id (M1); stigma without `maxLevel` (M4); node key
outside `dv:`, node without row/col (M5); site without `access`, terms that ban automation with `mode: scripted`, an
unknown licence condition, a licence id with spaces (M8); confidence `when` on a non-claim; an Ascension quest
with a giver or a turn-in location, without `access`, or with an access other than `teleport` (owner correction); a
skill node without `skill`, a stat node with one; six specialty
choices; a drawback that is only inferred or has no source. Two positive controls check that `status: owner-check` and
a sourced drawback are accepted.

## 16. 5b as built

The data moved to this format in 0.2 step 5b (conversion script and log: `tools/history/v2-convert/`). The Node
generator (`tools/gen/gen.mjs`) compiles it into the same constants the app used before; the build runs it in memory.

**Schema changes (additive or bug fixes; the examples still validate):**

| Schema | Change | Why |
|---|---|---|
| `story-quests` | `unlocks.milestone` pattern `^g[0-9]+$` | it referenced `recordId`, which needs a colon; milestone ids are `g6` … `g45` (§3) |
| `unlocks` | optional `credit`, `order` | `VERIFIED_UNLOCKS` shows the credited site names and has a display order; records are stored sorted by id |
| `regional-quests` | optional `order` | the v1 list order (allthings.how's) is not derivable from `rec` + id and decides Next up and milestone order |
| `retired` (new) | `data/retired.json`: `{key, retired, note}` | §3: 5b adds it; the generator fails if a retired key reappears |
| `common` (data corrections) | owner ref `owner:YYYY-MM-DD-<set>-NN` also allowed | the owner's numbered screen sets are cited that way (`owner:2026-10-14-unlocks-05`, docs/research/2026-10-owner-unlocks.md) |
| `story-quests` (data corrections) | `unlocks.milestone` optional | an unlock before the first milestone (Prepare to Escape: Shop and Closet) has no milestone to link to |
| `common`, `boards` (0.3 audit) | optional `stepFields.proposed` (`$defs/proposedGate`), and `proposed` on boards | the prerequisite gates of docs/research/2026-10-prereq-gates.md that change behaviour wait there, unread by the app, until their 0.3 build step (§6) |

**Compiler rules with no field of their own:** a story atom on a stigma-slot step compiles to v1's `after` (no story
chip), every other `reached` atom to `story`; a `turnedIn` atom to `story` + `turnedIn`. `DV_BOARDS` (a v1 constant
nothing reads any more) lists the boards whose plan nodes all open with the board. `QUESTS_X` / `QUEST_STEPS_X` /
`QUEST_LOC_X` are the quests above Lv 40. The "learn + 18" specialty gate (F3) stays in `src/data/build.js` (`SP_STEPS`).

**Placeholders and debt the generator reports** (`npm run gen`, `report.debt`):

- `zone:altgard-unplaced`: story quests whose location the v1 data never held (the §9 data task); `zone:ishalgen`
  for the Lv 1–9 quests on the starting map. Both are labelled (`fieldStatus` owner-check / inferred). Givers and
  turn-ins whose Metabot place is Aldelle Village are in `zone:aldelle-village` since 0.2.4 (verified, not a placeholder).
- aion2.th.gl citations (withdrawn site): re-sourced to Metabot or labelled `owner-check` in the data corrections that followed the conversion; since then any citation of a withdrawn site fails the generator.
- No owner screen codes exist yet (§14.2), so v1 facts "seen in game" carry an `inferred` ref that says so.
- `VERIFIED_UNLOCKS` credits sites by name only; each such unlock carries a ref saying the pages were not recorded.

**Facts the format needed that the v1 data did not hold** (read from Metabot on 2026-10-14, build 0.0.4387.0, under its
terms): every node of the five Assassin boards (537, `https://metabot.gg/en/aion-2/daevanion/assassin`); the specialty
choices of Savage Roar, Ambush and Shadowstrike (their skill pages). Story game ids and the Ascension records come from
`docs/research/2026-10-prereq-gates.md` §4–§5. The legacy plan keys map to nodes by the `g12:0` path costs on that grid
(`dv:ew` r3c7, `dv:ew2` r11c13; `dv:as2` r11c3 is the Assault Stance whose path gives Rear Smite); `dv:z:db` r6c7 /
`dv:z:db2` r12c11, confirmed by the owner on 2026-10-16 (Zikel's Defense Break nodes at row 4 column 5 and row 10
column 9 of the 11×11 board; ids use Metabot's 15×15 frame, so an 11×11 board's row / column + 2 gives r / c).

