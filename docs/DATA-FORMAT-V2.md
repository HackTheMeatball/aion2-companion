# Data format v2 (draft)

**Status:** draft for review (0.2 step 5a). Not built on yet. Review order (ROADMAP 0.2 step 5): Data & Research, then a
fresh session with no team context, then the owner. 5b (data build) and 5c (saves) start only after the owner approves.

**What this is:** the format the game data moves to in 5b, the rules for ids and saved progress, and the `merge()`
semantics 5c builds. Draft JSON Schemas are in [`data/schema/`](../data/schema/); sample Assassin records that validate
against them are in [`data/schema/examples/`](../data/schema/examples/). Nothing in `src/`, `data/*.json`, `tools/` or
the build changes in this step.

**Inputs read:** CLAUDE.md, ROADMAP.md, docs/team/tech-lead.md, docs/ARCHITECTURE.md, docs/DECISIONS.md, every file in
`data/`, `src/data/*.js`, `tools/gen/gen.py`, and how `src/main.js` reads data and writes the save.
`docs/research/2026-10-classes-and-gaps.md` does not exist yet (Data & Research is writing it in wave 1). Everything
below that depends on what other classes look like is marked **assumption** and is listed in §11 for that report to
confirm or correct.

Contents: 1 Goals · 2 Layout · 3 Ids and save keys · 4 Files and `schemaVersion` · 5 Provenance (sources registry,
licence, `verifiedAt`) · 6 Steps: `requires` / `completesWith` · 7 Text · 8 Collections · 9 Field mapping (every current
field) · 10 Saves and `merge()` · 11 Open questions · 12 What 5b and 5c must prove · Appendix: validating the drafts

---

## 1. Goals and constraints

1. **Classes without copy-paste.** Eight classes share story, regional quests, dungeons, strongholds, zones and rules;
   only skills, boards, stigmas, the plan and some milestone steps differ. Shared data is written once.
2. **Ids, not display names.** Every record has a stable id written out in the data. Nothing derives an id or a save key
   from a name or an array position at runtime.
3. **Every fact carries its provenance:** sources (per field where it matters), a verdict, and the date it was checked
   (`verifiedAt`), so a game patch can be answered with "these records need a re-check".
4. **Every step says when it opens and when it is done** (`requires` / `completesWith`), so 0.3's single requirement
   evaluator reads data instead of special cases (`story`, `after`, `turnedIn`, `byStory`, `bo`, `stig`, `eput`,
   `noPre`, `blv`).
5. **Saves never break.** v2 changes the data files, not the save. Every save key that exists today stays valid and
   means the same thing (§3). The save gains fields only additively (5c, §10).
6. **No visible change in 0.2.** 5b compiles v2 into the same constants the app uses today; acceptance is "golden
   identical" plus the generated values equal (§12).
7. **The generator compiles, it does not research.** Today `gen.py` also *corrects* data (camp → zone, reward text
   shortening). In v2 corrected values are stored in the data (the source's differing value goes to `conflicts`), and
   the generator only validates, joins and reshapes. Presentation (short reward text, HTML) stays in code.

Non-goals for 0.2: localisation, Elyos content, new data, new UI, changing any save key.

## 2. Layout: shared vs per class

```
data/
  schema/                        JSON Schemas (draft 2020-12), one per collection, + common.schema.json
  sources.json                   sources registry (sites, licence, use) + pages cited only by guide text
  shared/                        class-independent
    rules.json                   game rules and tables (level points, cost tables, slots, node costs, first-clear rewards)
    boards.json                  the Daevanion boards themselves
    items.json                   items the guide names
    asmodian/                    faction-specific, class-independent
      story-quests.json  regional-quests.json  sealed-dungeons.json  strongholds.json  zones.json  unlocks.json
      guide/                     the guide's own content (rights reserved, LICENSE)
        milestones.json  steps.json  tips.json  claims.json  confidence.json
  classes/
    assassin/
      class.json                 the class and its plan (stat tiers, skill order, stigma plan, key stacks)
      skills.json  stigmas.json  boards.json (plan nodes per board)
      steps-asmodian.json        milestone steps whose text is about this class
      claims.json  tips.json     (optional) class-specific claims and explainers
```

**Composition (the "bundle").** The app for one character loads one bundle: `sources.json` + `shared/*.json` +
`shared/<faction>/**` + `classes/<class>/**` (class steps for that faction only). Rules:

- **No overrides.** A class file adds records; it never replaces or patches a shared record. A step whose text names a
  class's skills, stigmas or board nodes is a class step, even if every class has "a step like it" (today `g12:0`,
  `g22:1`, `g27:0/1`, `g32:0/1`, `g37:0/1` are Assassin text in shared milestones).
- **Ids are unique across the whole repository** (so claims, sources and reviews can name any record unambiguously).
  **Save keys are unique within a bundle.** Two classes may each have a step with key `g22:1` (their own "equip stigma
  slot 1"), because a character has one class (0.4) and its save only ever sees one bundle. Their ids differ:
  `assassin:g22:1`, `gladiator:g22:1`.
- **Faction is a folder for content and a field on records.** Only `asmodian/` exists until Elyos (after 1.0). Classes
  are the same for both factions (**assumption**), so class folders are not split by faction except for steps, whose
  milestones are faction content.
- **Shared steps must be class-neutral.** The build can check this mechanically: a shared step may not contain a
  `[[stigma:…]]` token, a skill name or a node label from any class.

**Why one file per collection, not one file per record:** 400-odd records today; one file per collection keeps
`git diff` reviewable and the generator simple. Parallel class work is isolated by the class folder. Records inside a
file are sorted by id (checked), so concurrent edits rarely conflict.

## 3. Ids and save keys

Every record has an **`id`**. Every record a save can refer to also has a **`key`**, written out, never derived.

| Rule | Why |
|---|---|
| `id` = `<kind>:<local>[:<local>…]`, lowercase `[a-z0-9-]`, written in the data. Never derived at runtime, never reused, never changed once released. | Stable references between records (requires, claims, plan). |
| `key` = the save key, written in the data. **Equal to today's key for every existing record**, whatever its shape. | Saves stay valid (CLAUDE.md "Never break saved progress"). |
| Minting a new id: the game id when one is known at creation (`rq:2202044`), otherwise a slug of the English name (`sq:forgotten-commander`). Learning the game id later adds `gameId`; it never changes the id. | An id must not change when research improves. |
| A renamed thing keeps its id and key; `name` changes. A removed thing's id and key are retired (listed in `data/retired.json`, which 5b adds; the build fails if a retired id or key reappears). | Today's retired keys (`g45:1`, `hold:0`, the E1 position keys) are kept only in prose. |
| New records get `key` = `id` unless they extend an existing key family (`sp:`, `dv:`). | One namespace to reason about. |

Id kinds: `sq:` story quest, `rq:` regional quest, `sd:` Sealed Dungeon, `sh:` stronghold, `zone:`, `unlock:`, `item:`,
`rule:`, `board:`, `tip:`, `conf:`, `src:`, `class:`, `skill:<class>:`, `stigma:<class>:`, `node:<class>:<board>:`,
`classboard:<class>:`; milestone ids are today's (`g6`…`g45`, `build`, `story`, `daily`, `f2p`, `hold`); claims keep
`C01`…; shared steps keep today's key as id (`g16:0`), class steps are `<class>:<key>` (`assassin:g22:1`).

**Existing save keys, and where v2 writes them** (all checked against the patterns in the schemas: 69 milestone keys,
60 Sealed Dungeon slugs, every `dv:` key and every MIG_V5 target fit):

| Save field / key family | Today | v2 home of the key |
|---|---|---|
| `checks` / `started` / `rqSnooze` `rq:<game id>` | regional quests (E1) | `regionalQuests[].key` |
| `checks` / `areaRun` `sd:<slug>`, `g10h:<slug>` (Lv 10 batch) | Sealed Dungeons | `sealedDungeons[].key` (the `g10h:` prefix stays for the Lv 10 batch) |
| `checks` `sh:<slug>` | strongholds | `strongholds[].key` |
| `checks` `g<lv>:<n>`, `g<lv>:<word>`, `build:<n>`, `story:<n>`, `daily:<n>`, `f2p:<n>`, `hold:<n>` | milestone and route-rule items, written out since E1 | `steps[].key` (shared or class) |
| `checks` `sp:<skill name>:<L>`, `sp:<skill name>:spec` | skill levels; the **English skill name** is part of the key | `skills[].key` = the name segment; the compiler generates the per-level keys |
| `checks` `dv:<n>`, `dv:z:`/`dv:v:`/`dv:t:<n>` | board plan nodes | `classBoards[].nodes[].key` |
| `quest`, `storyEnd`, `qsteps{name}`, `qsub{name}` | story position and objective ticks, keyed by the **English quest name** | `storyQuests[].key` = the name |
| `qsteps{name: [i]}` | objective ticks by **array position** | `steps[].i`, written out per objective (§8) |
| `qsub{name: {i: [j]}}` | sub-objective ticks by position **inside text split at runtime** | `steps[].subs[].j`, written out (§8) |
| `stLv{name}`, `stPick{slot: name}` | stigma levels and picks by **stigma name** | `stigmas[].key` = the name |
| `dvCost{key}` | node costs typed by the player | node `key` |
| `open{id}`, links `#g22` | card fold state by milestone id | `milestones[].id` |

Three of today's key families violate the "no position-derived keys" rule (`qsteps` indices, `qsub` text-split
indices) or depend on English display names (`quest`/`qsteps`/`qsub`, `sp:`, `stLv`/`stPick`). v2 does **not** change
them (that would need a migration and gains nothing visible). It freezes them instead: indices become explicit fields
the data must keep (`i`, `j` never renumbered; a new objective gets the next unused number), and name-based keys become
`key` fields that stay when a display `name` changes. See Q5 for whether 0.4's per-character migration should move them
to ids.

## 4. Files and `schemaVersion`

Every data file is an envelope:

```json
{ "$schema": "../../schema/regional-quests.schema.json", "schemaVersion": 2, "collection": "regionalQuests",
  "faction": "asmodian", "records": [ … ] }
```

Three different version numbers, never mixed:

| Number | Where | Meaning | Rule |
|---|---|---|---|
| Data `schemaVersion` | every data file (`2`); the compiled bundle | Major version of this format (today's ad-hoc files are "v1") | Adding an optional field does not bump it. Removing or renaming a field, or changing a meaning, bumps it; the generator refuses a major it does not know. |
| Save `schemaVersion` | the save (5c) | Shape of the stored state. **Absent = 0** (every save written so far). 5c writes `1`. | Only ever increases, only through an additive, flagged migration (CLAUDE.md). An older build ignores it. |
| App `version` | `package.json` | Release (semver) | Unrelated to the two above. |

The localStorage key stays `aion2-assassin-route-v4`; its `v4` is historical and is not a version anyone bumps.

## 5. Provenance

### 5.1 Sources registry (`data/sources.json`)

One record per **site**, replacing the `SITE` list in `gen.py` and the implicit policy in CLAUDE.md:

| Field | Meaning |
|---|---|
| `id`, `name`, `hosts[]` | `src:metabot`, "Metabot", `["metabot.gg"]`. Every URL in the data must resolve to exactly one site by host; the build fails otherwise (so a typo'd or new site cannot slip in unreviewed). |
| `kind` | `game-database` · `guide` · `news` · `wiki` · `official` · `community` · `owner`. Game-database fields count as verified on one source (policy). |
| `independenceGroup` | Sites in one group count as **one** source (Metabot and Wikily). The "two independent sources" check counts groups, not URLs. |
| `licence.id` | SPDX id (`CC-BY-NC-SA-4.0` for thegameswiki), `all-rights-reserved`, or `unknown` until Data & Research has read the site's terms. `licence.url`, `checkedAt`, `note`. |
| `use` | `facts` (may we take facts), `wording` (false for every site: no page text in the app), `quotes` (`none` / `short-credited`, claims only), `link` (`dofollow` / `nofollow` / `none`; Metabot = plain dofollow to the page the data came from), `banned` (Game8). |
| `reach` | How scripted reads fare (bot checks), for research planning. |
| `verifiedAt`, `notes` | When the record was checked. |

`pages[]` holds pages that back only hand-written guide text (today `tools/gen/snapshots/sources-v287.json`), with their
Sources-card label and group, so the snapshot file can go.

The owner's in-game screens are a site (`src:owner`, kind `owner`). Records cite them as `{ "owner": "<private-repo
reference>" }`, never as a URL (private material stays private; DECISIONS D3, D10).

### 5.2 Source references on records

```json
"sources": [
  { "url": "https://metabot.gg/en/aion-2/quests/hugo-mercenaries-past-and-present", "fields": ["rec", "unlocksAt", "giver", "rewards"] },
  { "url": "https://allthings.how/?p=244374", "fields": ["zone"] },
  { "owner": "skill window at Lv 12 and 13 (Oct 2026)", "fields": ["value[12]"] },
  { "inferred": "Corner stat from the board's stat totals.", "fields": ["label"] }
]
```

Exactly one of `url` / `owner` / `inferred`. `fields` replaces today's per-field `zoneSrc`, `requiresSrc`, `kibSrc`,
`xpSrc`, `mapSrc`, `place_src`, `xp_src` and `src2`. Optional `section` ("Required Quests"), `label`, `quote` (short,
claims only), `note`.

### 5.3 Verdicts and `verifiedAt`

- `status` per record: `verified` · `single-source` · `inferred` · `disputed` (claims keep their longer list, which also
  has `unverifiable` and `wrong`). `fieldStatus` overrides it per field (e.g. a stronghold's `levelRange` is inferred
  while the rest is verified).
- `verifiedAt` (`YYYY-MM-DD`) per record: the date the record was last checked against its sources. It replaces
  `fetched` (rq, story 40–45, strongholds, dungeons) and `_meta.fetched`; records with no date today get the date of
  the research pass that produced them (from git history), never the migration date.
- After a game patch, Data & Research lists records whose `verifiedAt` is older than the patch and whose fields the
  patch notes touch; re-checking a record updates `verifiedAt` even when nothing changed (ROADMAP "Any time").
- `claims[]` on a record names the claims whose verdicts its text follows; `claims.json` `appliesTo` points back. The
  build checks both directions agree.

## 6. Steps: `requires` and `completesWith`

Every trackable record (guide steps, story quests, regional quests, Sealed Dungeons, strongholds, board nodes; skill
levels by rule, §8) carries three fields, always written out:

```json
"requires": { "all": [ { "level": 10 },
                       { "story": "sq:verdant-melody", "is": "reached", "basis": "sourced",
                         "sources": [{ "url": "https://aion2.gaming.tools/quests/2202017", "section": "Required Quests" }] },
                       { "done": "rq:2202016" } ] },
"requiresBasis": "sourced",
"completesWith": ["tick"]
```

**Condition grammar** (`common.schema.json#/$defs/cond`):

| Form | True when |
|---|---|
| `{ "all": [c…] }` | every `c` holds (empty = always) |
| `{ "any": [c, c…] }` | at least one holds (≥ 2 branches) |
| `{ "level": n }` | character level ≥ n |
| `{ "story": "sq:x", "is": "reached" }` | current quest is X or later (default; DECISIONS D9) |
| `{ "story": "sq:x", "is": "turnedIn" }` | current quest is past X, or X is the last covered quest and `storyEnd` is X (today's `turnedIn`) |
| `{ "done": "<id>" }` | that step/record is done (ticked or derived) |
| `{ "itemLevel": n, "playerChecked": true }` | shown, never enforced (the app has no item level) |
| `{ "player": "Ascension Gauge at 100%", "playerChecked": true }` | shown, never enforced |

Every atom may carry `basis` (`sourced` · `inferred` · `owner` · `rule` · `legacy`), `sources` and `note`, so 0.3's
"every gate sourced or labelled" lives on the gate itself. No `not`: nothing needs it, and it makes "why is this
blocked?" explanations (blocker chains) ambiguous.

**`requiresBasis`** says how complete the gate list is:

| Value | Meaning | Evaluator |
|---|---|---|
| `sourced` | every gate has a source | as written |
| `verified-none` | sources checked, no prerequisite (rq-chains "confirmed-no-prereq") | as written |
| `unresearched` | nothing checked (today's `noPre`) | opens at `max(unlocksAt, rec)`, exactly today's `rqOpenLv` |
| `inferred` | the guide's reasoning | as written, labelled |
| `rule` | follows from a game rule (milestone level, story order, board level) | as written |
| `legacy` | carried over unchanged from today's hand-written data, no recorded source | as written; the 0.3 prerequisite audit sources or relabels it |

**`completesWith`** is an any-of list. `"tick"` = the player's tick on the step's key. Anything else is a condition
and is **derived**: evaluated on read, never written to the save as a tick (0.3 rule "completion derived from the story
position, never stored as ticks"). Today's special cases map as:

| Today | v2 |
|---|---|
| `byStory: true, story: X` | `storyQuest: "sq:x"` (display: hidden from Next up while X is current) + `completesWith: ["tick", {story: X, is: turnedIn}]` |
| `story: X` / `after: X` (not byStory) | `requires` atom `{story: X, is: reached}` |
| `turnedIn: X` | `requires` atom `{story: X, is: turnedIn}` |
| milestone level `lv`, node `blv` | `requires` atom `{level: n, basis: rule}` |
| `eput: n` (E4: done once slot n is equipped) | `stigmaKeySlot: n` + `completesWith: ["tick", {done: <slot n step>}]` |
| `stig: n` | `stigmaSlot: n` + `completesWith: ["tick"]` |
| `bo: Board` | `opensBoard: "board:x"` |
| rq `after[]` / `story` / `unlocksAt` / `noPre` | `requires` atoms + `requiresBasis` (`unresearched` = `noPre`) |
| skill level `req = learn + 3*(L-2)` / `flat` | generated from `rule:skill-level-gate` and `skills[].levelGate` |

Two behaviours that change on purpose are **not** part of 0.2: what a derived completion does to a tick the player
removed, and the golden differences that come from deriving completion. Both are 0.3's, case by case with the owner
(ROADMAP 0.3). In 0.2 the compiler emits today's flags from these fields, so behaviour is unchanged.

## 7. Text

Guide text has no code in it. Today's template helpers become tokens the compiler expands to exactly today's HTML:

| Today | v2 token |
|---|---|
| `${I("enhance")}`, `${I("crystal", "crystals")}` | `[[item:enhance]]`, `[[item:crystal\|crystals]]` |
| `${T("Respec is free", "respec")}` | `[[tip:respec\|Respec is free]]` |
| `${stn(1)}`, `${eRow(2)}` | `[[stigma:1]]`, `[[erow:2]]` |
| `${mapQ(2102100, "Ulgorn")}` | `[[mapq:2102100\|Ulgorn]]` |
| `${ASC}`, `${DAEVA}`, `<span class="rotseq"></span>` | `[[asc]]`, `[[daeva]]`, `[[rotseq]]` |
| `<span class="loc">…</span>` inside `t` | its own field `loc` |

Allowed markup in step text: `<b>`, `<i>`, `<br>`, entities. Tips bodies also allow `<p>`, `<p class="muted">`, `<ol>`,
`<ul>`, `<li>`. Anything else, or an unknown `[[token]]`, fails validation (the schemas enforce this; see the negative
tests in the appendix). The token expanders stay in code (`markup.js` today), since they are presentation.

## 8. Collections

One schema per collection; all share `common.schema.json`. Short descriptions; the schemas have field-level
descriptions.

| Collection (schema) | Scope | Record | Notes |
|---|---|---|---|
| `sources` | repo | site | §5.1 |
| `storyQuests` | faction | quest | Order is the `next` chain (one start, one `end`, no cycles, every quest reachable). `end` holds today's STORY_END region. `unlocks` holds STORY_UNLOCKS + UNLOCK_GATE. `steps[].i` is the `qsteps` index. |
| `regionalQuests` | faction | quest | rq.json + rq-chains.json in one record; prerequisites are `requires` atoms with their own sources. `zone` is the resolved zone id. |
| `sealedDungeons` | faction | dungeon | `band` places it (milestone `includes.sealedDungeonBand`); `mapSlug` replaces runtime `metaSlug(name)`. |
| `strongholds` | faction | stronghold | `levelRange` (lo/hi) + `fieldStatus.levelRange: inferred`. |
| `zones` | faction | zone | `traces` (ZONE_TRACES) and `camps` (gen.py CAMP_ZONE, kept as data and checked against map votes). |
| `unlocks` | faction | unlock | Informational; `at` is a condition. VERIFIED_UNLOCKS, build.json unlocks / dailyDungeon. The 2-source filter becomes `status`. |
| `items` | repo | item | ITEMS (label, Metabot slug, icon, game name). |
| `rules` | repo | rule | `kind` + typed `value` + `appliesTo` (`all-classes` or a class list). LEVEL_POINTS, cost tables, slots, node costs, first-clear rewards. |
| `boards` | repo | board | The boards (level, currency, point and node counts). |
| `milestones` | faction | card | GATES / STEPS headers; `kind` milestone or routeRule; `order`. |
| `steps` | faction (shared) or class | step | GATES / STEPS items except board nodes and hideouts. `order` interleaves shared and class steps in a card. |
| `tips` | faction or class | explainer | TIPS; `credit` is the verbatim source line shown today. |
| `claims` | faction or class | claim | claims.json minus `lines`/`edits`, plus `appliesTo` and `verifiedAt`. |
| `confidence` | faction or class | card line | CONF (moved out of gen.py); `when` = claim verdicts; `{placeholders}` filled from compiled data. |
| `classes` | class | class + plan | Stat tiers, skill order (per-entry verdict), stigma plan, upgrade targets, key stacks; each part with its own status and sources. |
| `skills` | class | skill | Per-level steps are generated (`sp:<key>:<L>`, `sp:<key>:spec`) with `requires {level: …}` and `completesWith ["tick"]`. |
| `classBoards` | class | board plan | Plan nodes per board (`key` `dv:…`, `type`, `milestone`, `order`, `requires`). |
| `stigmas` | class | stigma | Name is the save key (`stLv`, `stPick`). |

## 9. Field mapping: every current field

"→" names the v2 field. **Derived** = computed by the compiler or app, not stored. **Code** = presentation or
behaviour, stays in code. **Retired** = dropped from the data, kept in git history.

### 9.1 `data/rq.json` (58 records)

| Field | → v2 (`regionalQuests`) |
|---|---|
| `name` | `name` |
| `id` | `gameId`; `id` and `key` = `rq:<id>` |
| `slug` | `metabotSlug` |
| `src` | `sources[] {url, fields: [gameId, rec, unlocksAt, giver, turnin, steps, rewards]}` |
| `fetched` | `verifiedAt` |
| `rec`, `unlocksAt` | `rec`, `unlocksAt`; `unlocksAt` also becomes the `{level}` atom in `requires` |
| `requiresStory[]` (`name`, `id`, `storyLv`, `inAppQUESTS`) | `requires` atom `{story: sq:…, is: reached}`; `storyLv` and `inAppQUESTS` **derived** (from the story record) |
| `requiresRegional[]` | `requires` atoms `{done: rq:…}` |
| `requiresSrc[]` | `sources` on those atoms |
| `requiresStory` / `requiresRegional` both `null` | `requiresBasis: "unresearched"` (today's `noPre`) |
| `zone` (allthings.how's) | `zone` = the **resolved** zone id (E3/E4); the source's value goes to `conflicts` when it differs |
| `zoneSrc` | `sources[] {url, fields: [zone]}` |
| `giver` {`npc`, `place`, `kib`, `m`} | `giver` {`npc`, `place`, `zone`, `kibelisk`, `meters`} |
| `turnin` {…} | `turnin` {…} |
| `steps[]` {`text`, `kib`, `m`} | `steps[]` {`i`, `text`, `kibelisk`, `meters`} |
| `rewards` {`xp`, `kina`, `wisdom`, `crystal`, `items`, `ap`} | `rewards` (same names) |
| `prev`, `prevBasis` | `requires` atoms and their `basis` / `sources` (same facts as rq-chains) |
| `notes[]`, `conflicts[]` | `notes`, `conflicts` |
| `app` {`gate`, `lv`, `where`, `area`, `reward`, `after`, `poi`} | **Retired**: a snapshot of the pre-E1 page. Placement is runtime by `rec`; `where`/`area`/`reward` are **derived** (compiler); `poi` was search terms from the old page. 5b lists any `poi` term not derivable from giver/place/zone. |

### 9.2 `data/rq-chains.json` (61 edges)

| Field | → v2 |
|---|---|
| `quest`, `after`, `kind: regional` | atom `{done: rq:<after>}` on quest's `requires` |
| `kind: story`, `storyId`, `storyLv` | atom `{story: sq:<after>}`; `storyLv` **derived** |
| `kind: none`, `status: confirmed-no-prereq` | `requiresBasis: "verified-none"` on each quest it covers (the "Spacetime Rift series" entry covers 7 quests) |
| `basis: source-text`, `status: confirmed` | atom `basis: "sourced"` (only `confirmed` edges are allowed, as `gen.py` checks today) |
| `sources[]` (URL + parenthetical) | atom `sources[] {url, section, note}` (the parenthetical splits into `section` / `quote` / `note`) |
| `note` | atom `note` |

### 9.3 `data/story.json` (Lv 24–40, 40 records) and `data/story-40-45.json` (Lv 41–45, 11 records)

| Field | → v2 (`storyQuests`) |
|---|---|
| object key (quest name) | `name` and `key` (save key); `id` = `sq:<slug>` |
| `lv` | `lv` (8 story.json records have none; QUESTS has every level) |
| `unlocksAt` | `unlocksAt` and a `{level}` atom |
| `type`, `chapter` | `questType`, `chapter` |
| `steps[]` (strings) | `steps[] {i, text}` |
| `giver`, `giverPlace`, `giverKib`, `giverKibM` | `giver {npc, place, kibelisk, meters}` |
| `turnin`, `turninPlace`, `turninKib`, `turninKibM` | `turnin {…}` |
| `rewards` | `rewards` |
| `next`, `prev` | `next` (id); `prev` **derived** and checked |
| `end` (prose) | `end {region, regionFull, note}` |
| `notes` | `notes[]` |
| `src`, `fetched` | `sources[]`, `verifiedAt` |

### 9.4 `data/strongholds.json` (15)

| Field | → v2 (`strongholds`) |
|---|---|
| `name`, `qid`, `type`, `questType`, `faction` | `name`, `gameId`, `type`, `questType`, `gameFaction` (the page's "Both"; `faction` = folder faction) |
| `zone`, `lo`, `hi`, `recLv`, `unlocksAt` | `zone` (id), `levelRange {lo, hi}`, `recLv`, `unlocksAt`; `requires {level: lo}` |
| `kib`, `m`, `kibSrc` | `location {kibelisk, meters}`; `kibSrc` ("map list") becomes `sources {url: mapSrc, fields: [location]}` |
| `steps[]`, `stepKibM[]` | `steps[] {i, text, meters}` |
| `rewards` | `rewards` |
| `src`, `mapSrc`, `fetched` | `sources[]` (with `fields`), `verifiedAt` |
| `notes[]`, `levelBasis` | `notes[]`; `fieldStatus.levelRange: inferred` |

### 9.5 `data/dungeons.json` (11) and `data/dungeon-bands.json`

| Field | → v2 |
|---|---|
| `name`, `band`, `type`, `zone` | `sealedDungeons` `name`, `band`, (type implied by collection), `zone` (id) |
| `kib`, `m`, `kibSrc` | `entrance {kibelisk, meters}` + `sources {url: kibSrc, fields: [entrance…]}` |
| `xp`, `xpSrc` | `xp` + `sources {fields: [xp]}` |
| `rewards` {`wisdom`, `crystal`, `kina`, `enhance`, `featherdown`, `other`, `abyssPoints`} | `rewards` (`other` → `items`; `abyssPoints` null → omitted; the Elyos-only value stays in `notes`) |
| `rewardBasis`, `bosses`, `notes` | `rewardBasis`, `bosses`, `notes[]` |
| `exploreQid` | `exploreQuestId` |
| `src`, `src2`, `fetched` | `sources[]`, `verifiedAt` |
| dungeon-bands `answer`, `caveats`, `bands[]` {`band`, `samples`, `wisdom`, `crystal`, `kina`, `enhance`, `src`} | `rules` `rule:sd-first-clear` (`value.rewards`, `value.evidence` = bands, `notes` = answer + caveats); SD_RW / SD_REWARD **derived** from it |

### 9.6 `data/build.json`

| Field | → v2 |
|---|---|
| `_meta.by`, `_meta.fetched`, `_meta.policy` | **Retired** (`by` = research pass id, in git history); `fetched` → `verifiedAt` on each record; `policy` is CLAUDE.md + the sources registry |
| `_meta.skillRules` (`costsPerLevel`, `maxFromPoints`, `maxLevel`, `above10`, `specialtyOptions`, `sources`) | `rules` `rule:skill-point-cost`, `rule:skill-level-gate`, `rule:specialty-slots` (prose fields → `notes`) |
| `_meta.fullSkillList` (`actives`, `passives`, `sources`, `verdict`) | one `skills` record per skill (`tracked: false` for those outside the plan); verdict → status |
| `skills[]` `name`, `type`, `learnLv`, `costs`, `gate` | `skills` `name`/`key`, `type`, `learnLv`; `costs` checked equal to `rule:skill-point-cost` (as gen.py checks today); `gate` → `levelGate` (`stepped` / `flat`) |
| `skills[].specialties[]`, `src`, `dvNodes`, `note` | `specialties[]`, `sources`, `boardNodes {perBoard, cost}`, `note` |
| `spOrderAfterCore` `order`, `perItem{verdict, basis}` | `classes.plan.skillOrder[]` entries (`core: false`, `status`, `basis`) |
| `spOrderAfterCore` `skip`, `interleave`, `budget`, `notFetched`, `sources`, `verdict` | `classes.plan.skillOrderNotes`, entry `sources` |
| `levelPoints` {30…45, `sources`, `verdict`} | `rules` `rule:level-points` (full table from LEVEL_POINTS; per-field status) |
| `boards.list[]` | `boards` records |
| `boards.listSources`, `listVerdict` | `boards[].sources`, `status` |
| `boards.nodeCosts` | `rules` `rule:node-costs` |
| `boards.Vaizel[]`, `boards.Triniel[]` {`node`, `ty`, `cost`, `pathNote`, `src`} | `classBoards` nodes (`label`, `type`, `cost`, `via`, `sources`); the "one per skill" aggregate row → `classBoards.pathNote` |
| `boards.cornerTotalsByBoard` | `classBoards[].cornerTotals` |
| `boards.pathCosts` (null), `pathCostsNote`, `skillLevelNote` | `classBoards[].notes` |
| `boards.Ariel` (null), `ArielNote` | no board record; note → claim C22's note |
| `stigmas[]` {`name`, `availableLv`, `src`, `note`} | `stigmas` records |
| `stigmaRules.availability` | `stigmas[].availableLv` + `notes` |
| `stigmaRules.slots` | `rules` `rule:stigma-slots` |
| `stigmaRules.equipOrder` {per source, `verdict`, `upgradePriority`} | `classes.plan.stigmaPlan.bySource`, `status`, `note`, `targets` |
| `stigmaCost` {`table`, `learnCostsShard`, `shardIncome`, `sources`, `verdict`, `implication`} | `rules` `rule:stigma-shard-cost` (`value`; the prose in `notes`) |
| `unlocks[]` {`what`, `level`, `quest`, `minItemLevel`, `party`, `conquest`, `storyStep`, `timeLimit`, `note`, `sources`, `verdict`} | `unlocks` records (`at` = level/story/itemLevel atoms) |
| `unlocksRecommendation` | `unlocks` notes |
| `dailyDungeon` {`lv`, `names`, `otherNamesKRTW`, `entries`, `src`, `verdict`} | `unlocks` `unlock:daily-dungeon` (`otherNames`, `entries`) |

### 9.7 `data/claims.json` (38)

| Field | → v2 (`claims`) |
|---|---|
| `id`, `claim`, `verdict`, `action`, `newText`, `note` | same |
| `sources[]` {`url`, `quote`, `label`} | `sources[]` (same names) |
| `lines[]`, `edits[]` {`line`, `old`, `new`, `src`, `action`} | **Retired**: line numbers in the pre-0.2 single file; they no longer point anywhere. Replaced by `appliesTo` (record ids) |
| (none) | new `verifiedAt` |

### 9.8 `data/locations.json` and `data/current-areas-quests.json`

Neither is read by `gen.py` (only listed in DATA_SOURCES.md). `locations.json` (`quests{name: kib, m, giver, place,
src, note, place_src}`, `areas{name: kib, m, xp, mins, src, note, xp_src}`) is earlier research that rq.json,
story.json and dungeons.json superseded; `current-areas-quests.json` (`areas[] {k, kind, name, area, lv, map}`,
`quests[] {k, name, lv, where, id, poi}`) is a snapshot of the pre-E1 page keys. 5b: move both to
`tools/history/` (provenance only) after listing every value that differs from the v2 records; differences go to
Data & Research, not into the data silently.

### 9.9 Generator snapshots (`tools/gen/snapshots/`)

| File | → v2 |
|---|---|
| `area-loc-v287.json` (`name: {kib, m, xp}`) | `sealedDungeons[].entrance` + `xp` (source: allthings.how map pages); strongholds come from strongholds.json as today |
| `sources-v287.json` (`url`, `label`) | `sources.json` `pages[]` (group `old`) |
| `hideout-area-v288.json` (`name: zone`) | `sealedDungeons[].zone` |

### 9.10 Hand-written tables in `src/data/*.js`

| Constant (file) | → v2 |
|---|---|
| `GATES` (milestones.js): `id`, `lv`, `title`, `blurb` | `milestones` |
| `GATES[].items[]`: `k` | `steps[].key` (+ `id`) |
| `t` | `text` + `loc` (the `<span class="loc">` part) with tokens (§7) |
| `ns`, `note`, `upsell`, `opt`, `adv`, `map` | `short`, `note`, `upsell`, `optional`, `advancedOnly`, `mapSlug` |
| `story`, `after`, `turnedIn`, `byStory` | §6 table |
| `stig`, `eput`, `bo` | `stigmaSlot`, `stigmaKeySlot` + `completesWith`, `opensBoard` |
| `dv`, `board`, `blv`, `ty`, `via` (board nodes) | `classBoards` nodes: `board` (record), `requires {level: blv}`, `type`, `via`; `dv` implied |
| `...hideouts([...], prefix)` | `milestones[].includes {sealedDungeonBand, order}`; key prefix from `sealedDungeons[].key` |
| `...dvNodes("Vaizel")` | `classBoards` nodes with `milestone` + `order` |
| runtime-only `sub`, `subNote`, `group`, `cell`, `kind`, `name`, `hidden`, `req`, `q` | **Derived** (made by `hideouts()`, `rqItem()` and the renderer) |
| `STEPS` (milestones.js): `id`, `title`, `blurb`, `tag`, `items[]` | `milestones` `kind: routeRule` + `steps` |
| `QUESTS` (story.js) `[lv, name]` | `storyQuests` `lv`, `name`, order via `next` |
| `QUEST_STEPS` (story.js) | `storyQuests[].steps` (**shipped text wins**: story.json and QUEST_STEPS disagree on "Land of Rifts"; 5b keeps QUEST_STEPS and reports the difference) |
| `QUEST_LOC` (story.js) | `storyQuests[].giver` / `turnin` (it is an exact copy of story.json's fields today; checked) |
| `STORY_UNLOCKS`, `UNLOCK_GATE` (story.js) | `storyQuests[].unlocks {text, milestone}` |
| `VERIFIED_UNLOCKS` (story.js) `[lv, what, detail, sources text]` + its 2-source filter | `unlocks` (`at`, `what`, `detail`, `sources` as URLs; the sources text is **derived** from site names). Today it credits by site name only; 5b must resolve each name to a page or flag it. |
| `TIPS` (tips.js) `{h, b, src}` | `tips` `title`, `body`, `credit` |
| `ITEMS` (items.js) `[label, slug, icon, gameName]` | `items` |
| `HIDEOUT_AREA` (areas.js) | `sealedDungeons[].zone` |
| `ZONE_TRACES` (areas.js) | `zones[].traces` |
| `SD_REWARD`, `SH_REWARD` (areas.js) | `rules` `firstClearReward` (`value.text`) |
| `NO_AREA` (areas.js) | **Code** (UI string) |
| `STAT_TIERS`, `STAT_SRC` (build.js) | `classes.plan.statPriority` `tiers`, `from` |
| `STIGMA_PLAN`, `ST_TARGETS`, `E_ORDER` (build.js) | `classes.plan.stigmaPlan.slots`, `.targets`, `keyStacks.eOrder` |
| `SP_SKILLS` (build.js) `{n, learn, spec, passive}` + order | `skills` (`name`/`key`, `learnLv`, `specPick`, `type`) + `classes.plan.skillOrder` (`core: true`) |
| `SP_EXTRA` push into `SP_SKILLS` | `classes.plan.skillOrder` (`core: false`) |
| `LEVEL_POINTS` | `rules` `rule:level-points` |
| `spCost`, `ST_COST`, `DV_MIN` | **Derived** from `rule:skill-point-cost`, `rule:stigma-shard-cost`, `rule:node-costs` |
| `SP_STEPS` | **Derived** (skills × `rule:skill-level-gate`) |
| `RMB_STACK` (a function of level) | `classes.plan.keyStacks.rightClick[] {minLv, skills}` |
| `SP_ICONS`, `STIGMA_ICON` | `skills[].icon`, `stigmas[].icon` |
| `DV_TYPE` (CSS class + label per node type), `DV_TYPE_ICONS` | **Code** (presentation; the art is the same for every class) |
| `MIG_V5` (migrations.js) | **Code**: a frozen migration table, never data; moves with the migrations to `src/core/` in step 4 |
| `markup.js` helpers (`I`, `T`, `stn`, `eRow`, `seq`, `EYE`, `DAEVA`, `ASC`, `sub`, `dvNodes`, `metaSlug`, `mapSlug`, `hideouts`, `mapQ`) | **Code**: token expanders (§7). `DAEVA` and `ASC` text → tokens whose text stays in code (they are guide sentences; Q8) |

### 9.11 `tools/gen/gen.py` internals and the generated block

| Today | → v2 |
|---|---|
| `CAMP_ZONE` (camp → zone) and the zone votes | `zones[].camps`; the vote stays as a **check** (a camp's zone must be the map-data majority), not a transform |
| `rq_zone()` / E4 giver-zone rule, `ZONE_FIX` | resolved `zone` stored in the data, source value in `conflicts`; the rule stays as a check |
| `short_item()` (reward short text) | **Code** (compiler presentation) |
| `KEYS` (skill → `dv:` short key) | written-out node `key`s |
| `SITE` list | `sources.json` |
| `CONF` prose + `V()` conditions | `confidence` records (`when`, `placeholders`) |
| `label()` heuristics for Sources-card labels | kept as code; `sourceRef.label` overrides |
| Generated `RQ`, `RQ_STATS`, `QUESTS_X`, `QUEST_STEPS_X`, `QUEST_LOC_X`, `STORY_END`, `SH_DATA`, `AREA_LOC`, `SD_RW`, `SP_EXTRA`, `DV_BOARDS`, `SOURCES`, `SRC_SITE`, `CONF` | **Derived**: 5b's Node generator emits the same constants with the same values from v2 (§12) |
| `gen-report.json` checks (417 today) | 5b's validation: schema + the cross-record checks (§12) |
| `data/DATA_SOURCES.md` | still generated, now from `sources` refs (with `fields`) instead of a URL walk |

## 10. Saves and `merge()`

### 10.1 What a save holds today

One JSON object under `aion2-assassin-route-v4`, loaded as `Object.assign(DEFAULT(), saved)`. Un-ticking a box writes
`checks[k] = false` (so "never touched" and "un-ticked" are distinguishable, but not *when*); un-starting a quest or a
dungeon run, un-snoozing, and removing an objective tick **delete** the entry, so nothing is left to compare. A
realistic Lv 27 save (`tests/fixtures/fixture-user-v285.json`) is 3.3 KB with 117 `checks` (8 of them `false`).

### 10.2 `merge(a, b)` — what 5c builds

`merge` combines two saves of the same character (two devices in 0.5; Import in 0.4/0.5). It is pure, and must be
**commutative, associative and idempotent** (`merge(a, b) = merge(b, a)`, `merge(a, a) = a`), so sync order never
matters. It never touches view settings and never writes derived completions (there are none in the save after 0.3).

Per field:

| Field(s) | Kind | With change times (recommended, Q1) | Without change times |
|---|---|---|---|
| `checks{k}` | per-key value | latest change wins per key | `true` wins (union of ticks): **an un-tick on one device is undone by the other** |
| `started{k}`, `rqSnooze{k}` | per-key presence | latest change wins; a removal is a dated tombstone | union (a removal is lost) |
| `areaRun{k}` (value is a ms time) | per-key presence | latest change wins | union, keep the later run start |
| `qsteps{quest}[i]`, `qsub{quest}{i}[j]` | per-element set | latest change per element | union (an un-tick is lost) |
| `level` | register | latest change wins | max |
| `quest` + `storyEnd` | one register (they change together) | latest change wins | the one further along the story chain |
| `stLv{name}`, `stPick{slot}`, `dvCost{k}` | per-key value | latest change wins | `stLv`: max; others: from the save with the later `savedAt` |
| `stones`, `pendSt`, `pendCr`, `stShards`, `dvTotal`, `dvAdj` | counters typed from the game screen | latest change wins (two concurrent edits: one is lost; the player re-syncs from the game) | from the save with the later `savedAt` |
| `seedLv12`, `stTriniel1`, `dvReset1`, `migV5`, `eputSync1`, future flags | one-time flags | OR | OR |
| `mode`, `open`, `hide`, `hideCards`, `hideOpt`, `areaLv`, `zoneOpen`, `showObj`, `showTalk`, `qsShowDone`, `trackOpen`, `trackLater`, `rotSeen`, `sound`, `dvAllOpen`, `areaDone`, `statOpen`, `areaSh`, `areasCollapsed` | view settings | not merged: each device keeps its own (Q2) | same |
| `dvLast`, `dvLastAt` | the 10-second undo of the last node bought | not merged (transient, local) | same |
| `dvPts`, `crystals` | retired by `dvReset1` | ignored | ignored |

### 10.3 Do saves need per-item change times? (owner decision, Q1)

**Yes, if un-ticks must survive a merge.** Without a time per item, `merge` cannot tell "B un-ticked it after A ticked
it" from "A ticked it after B un-ticked it", so the only safe rule is "a tick wins", and every un-tick (and every
removed start, snooze or objective tick) comes back after a sync. The roadmap's 0.5 promise "merged per item so
un-ticking survives" requires the times.

Proposed shape (5c, additive, behind a new flag, older builds ignore it):

```json
"schemaVersion": 1,
"savedAt": 1760440000000,
"mt": { "checks": { "rq:2202044": [1760439000, true], "g22:1": [1760439500, false] },
        "started": { "rq:2202017": [1760439600, null] },
        "qsteps": { "Land of Rifts": { "2": [1760439700, true] } },
        "level": [1760439800, 27] }
```

- Times are seconds since the epoch from the device clock. Ties (same second) break deterministically on the value
  (`true` > number > string > `false` > `null`), so every device computes the same result.
- **Each entry stores the value it stamped.** On load, an entry whose current value differs from its stamped value was
  changed by a build that does not keep times (a rollback to 0.2, an Import of an old export); it is re-stamped "now".
  This keeps the rollback guarantee (CLAUDE.md) without trusting stale times. Cost: an edit made in an older build wins
  as if made at the next load of a newer build.
- `null` is a tombstone (a removed entry).
- Size: about 35 bytes per tracked entry; a Lv 45 save with every item touched (~700 entries) grows by ~25 KB. Fine for
  localStorage (5 MB) and for an encrypted sync blob.
- Clock skew between devices: a device whose clock is hours off can win a race it should lose. Acceptable for one
  player's two devices; a hybrid logical clock would remove it but adds a counter per device and is not worth it now.
- Tombstones are kept (not garbage-collected) in 0.5: a few hundred bytes at most.

**If the owner says no:** 5c still adds `schemaVersion` and `savedAt`, `merge` uses the right-hand column of §10.2,
and the 0.5 copy must not promise that un-ticks survive.

### 10.4 Characters (0.4)

Each character gets a random id at creation; character 1 is today's save (D7), so older builds keep reading it.
`merge` runs per character id; characters present on one side only are kept. A character's `class` and `faction`
choose its bundle (§2).

## 11. Open questions

### For the owner (each with a recommendation)

| # | Question | Recommendation |
|---|---|---|
| Q1 | Should saves keep a change time per item (§10.3)? Without it, un-ticks come back after a sync. | **Yes**, in 5c, additive, ~25 KB at most. |
| Q2 | Do view settings (Basic/Advanced, folded cards, filters) sync between devices? | **No**: per device. A phone and a PC want different folds and modes; syncing them would fight. Revisit if testers ask. |
| Q3 | Sites whose licence is still "unknown": keep using them for facts (with links) until Data & Research has read their terms? | **Yes**: facts are not copyrightable and we copy no wording; quotes in claims stay short and credited. Data & Research fills every `licence` within 0.2; a site whose terms forbid use gets `use.facts: false` and its records lose that source. |
| Q4 | Your in-game screens as sources: cite them by a private-repo reference (path and date), shown publicly as "seen in game (owner), Oct 2026"? | **Yes**. No image or private path ever appears in the public app; the public data only says the reference exists. |
| Q5 | Story progress and skill levels are saved under English names (quest names, skill names). Keep that forever, or move them to ids in 0.4's per-character migration? | **Keep names** as permanent keys. A rename keeps the old name as `key`. Moving to ids needs a copy migration for no visible gain; the 0.4 migration is risky enough already. |
| Q6 | Should the app ever show per-item "checked on" dates from `verifiedAt`? | **No** (minimal distraction). The Sources card keeps its one date line; `verifiedAt` drives the patch-watch report only. |
| Q7 | Where does "Daeva Trapped in a Nightmare" (Lv 45, not in the data) and the story past Altgard go? | Nowhere new: it is one more `storyQuests` record when sourced; `end` moves to it. No format change needed. (Listed because the handoff names it.) |

### For the reviewers (Data & Research, fresh session)

| # | Question | Tech Lead's default |
|---|---|---|
| R1 | Are skill-point tables, stigma slots, shard costs, node costs and the board list the same for every class? (`rules.appliesTo` assumes `all-classes`.) | Assume yes until the classes-and-gaps report; a rule that differs gets `appliesTo: [classes]` and a class-specific copy. |
| R2 | Are class skills and stigmas identical for both factions? (no faction split under `classes/`) | Assume yes. |
| R3 | Story quest ids are slugs of English names (`sq:forgotten-commander`) because game ids are known for only a few. OK, or mint from game ids where known? | Slugs for all story quests (one rule, no mixed shapes); `gameId` where known. |
| R4 | `locations.json` / `current-areas-quests.json`: move to `tools/history/` after listing differences (§9.8)? | Yes. |
| R5 | story.json and the shipped QUEST_STEPS differ on one quest, "Land of Rifts" (objective counts in step 1, the Kibelisks of steps 2 and 4). | Ship QUEST_STEPS text (today's), file the difference for re-check. |
| R6 | `verifiedAt` for records with no `fetched` date today (all story quests to Lv 40, TIPS, unlocks, claims, hand-written tables): use the research pass date from git history? | Yes; never the migration date, which would hide how old the check is. |
| R7 | Should `claims` `appliesTo` be required (every claim names what it backs)? | Required in 5b for claims with `action: keep` or `rewrite`. |
| R8 | One file per collection (diff-friendly) vs one file per record (merge-friendly). | One file per collection, sorted by id. |
| R9 | `DAEVA` / `ASC` sentences: data (tokens with text in `steps`) or code? | Tokens; their text moves to a small `snippets` list in `guide/` in 5b if the reviewers prefer data. |

## 12. What 5b and 5c must prove

**5b (data build).** Acceptance (ROADMAP): compiled data equals today's, golden identical, all suites green, saves
untouched, single-file output for both builds. Concretely:

1. Schema validation of every data file (ajv, draft 2020-12, strict) runs in `npm test` and CI.
2. Cross-record checks (today's 417 plus): ids unique repo-wide; keys unique per bundle; every `requires` / `done` /
   `story` / `milestone` / `board` / `skill` / `stigma` reference resolves; story `next` chain is one path from start to
   `end`; every URL's host is in `sources.json` and not banned; `independenceGroup` count ≥ 2 for every `verified`
   record that has no game-database or owner source; `claims` ↔ `appliesTo` agree; retired ids/keys never reappear;
   step `i` / `j` unique and never removed from a shipped record; shared steps contain no class content.
3. The Node generator emits the constants of §9.11 and the hand-written tables of §9.10 with **the same values**
   (compare as JSON, then the bundle's top-level statements as in P2), and the page markup byte-identical.
4. The diff of every value that moved between sources of truth (QUEST_STEPS vs story.json, QUEST_LOC vs story.json,
   HIDEOUT_AREA vs the v288 snapshot, VERIFIED_UNLOCKS vs build.json unlocks) is listed in the PR; no silent choice.
5. No data patches during 5b (ROADMAP).

**5c (saves).** `schemaVersion` + `savedAt` (+ `mt` if Q1 is yes) added behind a new flag, idempotent, additive; a
pure `merge()` in `src/core/` with Node tests for the three algebraic properties (generated saves), "un-tick newer than
tick wins" (if Q1), "flag OR", "view settings untouched", the legacy-write re-stamp, and a rollback test (5c save →
0.2 build → back). `mig1`, `mig2`, `journey` green; `tests/e2-migtest.js` extended.

## Appendix: validating the drafts

The schemas are JSON Schema draft 2020-12. Until 5b adds a validator to the repo (no new dependency in this step),
check them from a scratch directory outside the repo:

```sh
mkdir /tmp/v && cd /tmp/v && npm init -y >/dev/null && npm i ajv@8
# validate every file under data/schema/examples/ with Ajv2020 (strict), choosing the schema by its "collection"
```

Result for this draft: 20 sample files, 58 records (story, regional quests incl. a `noPre` one and one with two
regional prerequisites and a zone correction, a Lv 10 `g10h:` Sealed Dungeon, a stronghold, zones, unlocks, rules,
boards, items, milestones, shared and Assassin steps incl. `byStory`, `turnedIn`, `stig`, `eput` and an optional
expedition step, a tip, a claim, confidence lines, the Assassin class plan, skills, stigmas and board nodes) all valid
under ajv 8 (strict) and, independently, Python `jsonschema` 4.26. 22 deliberately broken copies are all rejected for
the intended reason: missing `verifiedAt` / `requires` / `completesWith`, an unknown field, an id made from a display
name, a bad verdict, a source with both `url` and `owner`, an `http://` URL, `<script>` or `<span class="loc">` in step
text, an unknown `[[token]]`, an unknown condition atom, an `any` with one branch, an empty `completesWith`,
`schemaVersion` 3, a Sealed Dungeon key outside `sd:`/`g10h:`, an objective without `i`, a milestone without `lv`, a
rule value of the wrong shape, a licence id with spaces, a node key outside `dv:`, and a confidence `when` on a
non-claim.
