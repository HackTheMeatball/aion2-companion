# Next class: groundwork for Gladiator (2026-10)

Research, 15 Oct 2026. **Docs only: no file under `data/` or `src/` was changed.** Input for D8 (next class after
Assassin), the 0.5 class framework and the 0.8 release. It builds on
[`2026-10-classes-and-gaps.md`](2026-10-classes-and-gaps.md) (read first: it has the cross-class skill and stigma
tables) and adds what that report did not have: the exact record shapes, a field-by-field Gladiator source check, and
a code audit of what assumes Assassin.

## 1. Summary

- **Gladiator's game-database layer is complete on Metabot, and its Daevanion boards are structurally the Assassin
  boards.** All 537 board nodes sit at the same rows and columns, with the same node type, cost and grade as the Assassin
  file; the 66 + 22 / 66 + 22 / 66 + 22 / 94 + 22 / 152 stat and skill node split and the 134 / 134 / 134 / 168 / 232
  totals are identical. Only two things differ per class: which skill each of the 88 skill nodes carries (80 of 88 differ)
  and the node `gameId`. All 444 stat-node labels and grades matched (checked against our `board-nodes.json`). So the Gladiator node
  file is mostly mechanical.
- **No Gladiator-specific blocker in the data.** Real cost is the advice layer (skill order, four stigmas, first nodes,
  rotation): Metabot is a single editorial voice, and the permitted second sources were unreachable or name-only
  (§3.3). Those fields ship labelled "single source" unless the owner or a tester supplies a second.
- **The engineering cost is larger than the data cost.** The generator throws on more than one class, `catalog.js` and
  `main.js` run once at load against one global Assassin build, and about 25 UI and test strings name Assassin skills
  (§4). Estimate: **about 10 build steps for the framework (belongs in 0.5), 4 for Gladiator content (0.8)**.
- **Pitfall:** `loadBundle` reads every JSON file under `data/`. Dropping `data/classes/gladiator/` in before the
  generator is multi-class makes `npm run gen` and the build fail ("one class per bundle in 0.2, got 2"). Stage the
  Gladiator files outside `data/` (or on a branch) until step F1 in §4 lands.
- **Recommendation (§5):** keep Gladiator as the default; ask the owner (D8) which class they or a tester will actually
  level to 45 before any 0.8 data work. Do the 0.5 framework first; it is the same for every class.

## 2. Shared versus per-class data

### 2.1 What is class-independent today

| Area | Files | Records | Notes |
|---|---|---|---|
| Story chain | `data/shared/asmodian/story-quests.json` | 86 quests (`sq:<gameId>`) | Faction-scoped, not class-scoped. One class-specific string: Liberator and Spiritforged weapon rewards name the Assassin variant (Dagger). Metabot has a "Class rewards" table on 7 Episode quests (classes-and-gaps §2.4), so the weapon family per class is a DB field. |
| Regional quests | `asmodian/regional-quests.json` | 58 (`rq:<gameId>`) | No class restriction on any quest (verified earlier on all 737 Metabot quest pages). |
| Ascension quests, Sealed Dungeons, Strongholds, zones, unlocks | `asmodian/*.json` | — | Class-independent. |
| Guide text | `asmodian/guide/{milestones,steps,tips,claims,confidence}.json` | 21 / 53 / — | Class-neutral where steps use build tokens (`[[build:stigma:N]]`, `[[build:text:…]]`, `[[build:node:…]]`), which `gen.mjs` expands from the class's guide build. **Not neutral:** `claims.json` and `confidence.json` hold Assassin-scoped claims (stat tiers C20, skill order, "16 points to reach Heart Gore + Ambush"); these need a class scope or a split by class. |
| Rules | `data/shared/rules.json` | 11 (`appliesTo: all-classes`) | Crystals per level, stigma slots 22/27/32/37, skill point costs, level gate, specialty slots. The leveling skeleton is the same for all eight classes (classes-and-gaps §1), so these are already shared. Several `sources` entries cite Assassin owner screens as evidence; that is fine as evidence, but Gladiator should add its own spot check (§3.4). |
| Boards | `data/shared/boards.json` | 5 (`board:nezekan` … `board:azphel`) | Names, unlock levels 12 / 20 / 30 / 40 / 45, points. Class-independent. Sources point at the Assassin planner; add the Gladiator URL when the class lands. |
| Items | `data/shared/items.json` | 4 | Crystal, Wisdom Stone, etc. |

### 2.2 What is per class

Everything in `data/classes/<class>/`; Assassin sizes shown, and what Gladiator would hold:

| File | Assassin | Gladiator would need | Source for the Gladiator values |
|---|---|---|---|
| `class.json` | 1 record | 1 | Metabot class page |
| `skills.json` | 22 (12 active, 10 passive) | 22: same learn levels as the shared skeleton (1,1,1,3,4,5,7,8,10,12,14,16 and 1,6,9,11,13,15,17,21,23,25); names differ | Metabot class and skill pages |
| `stigmas.json` | 4 (only the guide's four, not all 13) | 4 chosen (the full list of 13 is on the class page) | Metabot, plus a second source for the picks |
| `builds.json` | 1 (`build:assassin:guide`) | 1 | Advice: see §3.3 |
| `board-nodes.json` | 537 | 537 | Metabot `daevanion/gladiator` |

### 2.3 Record shapes a new class needs

From `data/schema/*.schema.json` (JSON Schema 2020-12, validated by ajv with `strict: true`; every file is an
envelope `{ $schema, schemaVersion: 2, collection, class, records }`). Every record also carries the provenance block
from `common.schema.json` (`sources`, `verifiedAt`, `status`, optional `fieldStatus`, `claims`, `notes`, `conflicts`).
Required fields:

| Collection | File | Required per record | Other fields worth filling |
|---|---|---|---|
| `classes` | `class.json` | `id` (`class:gladiator`), `class`, `name`, `release`, `defaultBuild` (`build:gladiator:guide`) | `role` |
| `skills` | `skills.json` | `id` (`skill:gladiator:<slug>`), `key`, `name`, `type` (`active` / `passive`), `learnLv`, `levelGate` (`stepped` or `flat`) | `icon`, `specialtyChoices[]` (`id` `spec:<class>:<slug>:<n>`, `n`, `skillLv`, `text`, optional `label`), `note` |
| `stigmas` | `stigmas.json` | `id` (`stigma:gladiator:<slug>`), `key`, `name`, `availableLv` (22), `maxLevel` | `icon`, `specialtyChoices[]` (stigma Lv 5/10/15/20), `note` |
| `boardNodes` | `board-nodes.json` | `id` (`node:gladiator:<board>:r<row>c<col>`), `key` (`dv:<board>:r<row>c<col>`), `board`, `row`, `col`, `type` (`stat` / `skill` / `unique` / `start`), `cost` | `grade`, `label`, `skill` + `adds` (skill nodes), `gameId` |
| `builds` | `builds.json` | `id`, `class`, `name`, `origin`, `skillOrder[]`, `stigmaSlots[]` | `statPriority` (tiers + `from` B/G letters), `specialtyPicks`, `stigmaTargets`, `boardPlan[]` (plan nodes with `milestone`, `order`, `node` or `anyNode`), `keyStacks` (`rightClick[]` by `minLv`, `eOrder[]`), `texts` (`opener`, `nezekan-plan` …) |

Invariants the generator enforces on top of the schema (so a new class fails loudly): one story chain, board point
totals, every plan node resolves, every URL ends up in `data/DATA_SOURCES.md`, "shared steps name no stigma outside a
build token". Keys are permanent and unique within one compiled class bundle; skill progress keys are
`sp:<display name>:<L>` today, so shared display names across classes (`Defiance`, `Impact Hit`, `Attack Preparation`,
`Survival Willpower`) are fine only while each character holds one class (0.5).

## 3. Gladiator source check

### 3.1 Fetching record

Policy followed: robots.txt first, the terms page for Metabot, User-Agent
`DaevaCompanionResearch/0.1 (+https://daevacompanion.com)`, one request at a time, 7 s apart, stop on a block.
**19 requests** (12 + 1 + 3 + 3), cached under the session scratchpad only (nothing copied into the repo beyond facts below).

| Host | Requests | Outcome |
|---|---|---|
| metabot.gg | 12: robots.txt, terms of service, class page, 6 skill pages, Daevanion page, class-builds guide, builds page | All 200. robots.txt allows `/en/aion-2/` (only `/api/`, `/private/` and profile pages are disallowed). Terms allow reuse with a dofollow link to the specific page the data came from, "reasonable request rate". |
| thegameswiki.com | 1 (robots.txt) | **Deviation, same slip as GamesFuze:** `data/sources.json` marks it `human-only` (robots unchecked, terms unread) and I did not read that entry first. The 429 with a Vercel security checkpoint came from this robots.txt request (no content page was requested); the registry already notes the same 429 on 2026-10-14. Stopped, not retried, nothing bypassed. No thegameswiki data for Gladiator. Owner to read by hand if a second source is wanted. |
| aion2hub.com | 3: robots.txt, home, `/classes/gladiator` | 200. robots.txt allows all (this host is approved for spot checks, weak corroboration only). |
| gamesfuze.com | 3: robots.txt (200), a guessed terms URL (404), the guessed Gladiator guide URL (404) | **Deviation (my mistake):** `data/sources.json` records GamesFuze as `mode: human-only` with robots and terms unchecked. I should have read that entry before touching the host. No page content was read (both content requests were 404 pages), nothing was kept, and I stopped. Needs the owner's by-hand read of the Gladiator guide and the site terms before it can count as a second source. |

Not touched: aion2.th.gl, Game8, aion2.gaming.tools, any other blocked host.

### 3.2 Metabot coverage for Gladiator (game-database fields, rated B, build 0.0.4387.0, except the editorial builds row, rated C)

| Area | URL | Result |
|---|---|---|
| Class page | [`/classes/gladiator`](https://metabot.gg/en/aion-2/classes/gladiator) | 35 skills: 12 active, 10 passive, 13 stigma. Learn levels for all 22 non-stigma skills read and equal to the shared skeleton and to the table in classes-and-gaps §2.5. Role Tank / Damage, Greatsword, stigmas unlock Lv 22, HP at Lv 100 11,000. Active and passive max Lv 40, **stigma max Lv 25 (unverified: Metabot FAQ only; Assassin is 40; in-game check pending, §3.4)**. |
| Skill pages | [`/skills/<slug>`](https://metabot.gg/en/aion-2/skills/keen-strike) | 6 of 35 read in full (keen-strike, leaping-slam, ruinous-blow, defiance, identify-weakness, rage-burst). Each gives: "Learned at Lv.", type, max level, 5 specializations with the required skill level (8 / 8 / 8 / 12 / 16 for actives, 5 / 10 / 15 / 20 for stigmas), the full 40-level table with the **required character level and point cost per skill level**, and the Daevanion nodes that boost it. The remaining 29 are the same template; the specialization texts live on those pages. |
| Skill-point costs and gates | same pages | Matches our rules exactly: skill level 2-4 cost 1, 5-7 cost 2, 8-10 cost 4; required character level = learn level + 3 × (L − 2) (checked on 5 skills: learn Lv 1 / 11 / 14 / 16; Identify Weakness, a passive at learn Lv 11, is **stepped**, not flat, so `levelGate` is per skill: Assassin's note says two passives are flat, so check each Gladiator passive). Rage Burst stigma points: 1 / 2 / 4 / 8 per level in bands of 5, the same as `ST_COST`; costs for levels 21-25 were not extracted. |
| Daevanion boards | [`/daevanion/gladiator`](https://metabot.gg/en/aion-2/daevanion/gladiator) | The page embeds every board and node: 5 boards (Nezekan 12, Zikel 20, Vaizel 30, Triniel 40, Azphel 45), 537 nodes, with row, column, type, grade, cost, label and for skill nodes the skill name. Totals 134 / 134 / 134 / 168 / 232. 22 skills with 4 nodes each (Identify Weakness has two on Nezekan and none on Zikel, like Assassin's Exploit Weakness). Compared to `data/classes/assassin/board-nodes.json`: same positions, types and costs in 537 / 537, identical stat labels and grades; 80 of 88 skill nodes carry a different skill; `gameId` prefix differs (Gladiator 11xxxx-15xxxx, Assassin 41xxxx-45xxxx). |
| Stigmas | class page, skill pages | All 13 listed with learn Lv 22 (Armor of Balance, Assault Strike, Blade Toss, Focused Block, Forced Restraint, Fracturing Rush, Lifestealing Blade, Lunge Stance, Rage Burst, Tenaciousness, Wave Armor, Wrath Wave, Zikel's Blessing). Specialty levels 5 / 10 / 15 / 20 confirmed on Rage Burst. |
| Builds | [`/builds/gladiator`](https://metabot.gg/en/aion-2/builds/gladiator) | 0 community builds. [Class-builds guide](https://metabot.gg/en/aion-2/guides/class-builds-guide) has an editorial Gladiator build (C: advice, one voice). |

**Metabot disagrees with itself on stigma order** (a flag for the research pack, not data): the class page lists pick
rates by slot as Lunge Stance 91% (22), Zikel's Blessing 91% (27), Rage Burst 73% (32), Focused Block 62% (37), while the
class-builds guide prints "Zikel's Blessing / Lunge Stance / Lifestealing Blade / Rage Burst" in unlock order. The core
skills also differ (class page: Keen Strike, Ruinous Blow, Rending Blow, Leaping Slam, Rush Strike; guide: Ruinous Blow,
Leaping Slam, Overhead Slam, Rending Blow, Keen Strike). Editorial stat priority: Attack, Critical Hit, Accuracy Bonus, HP,
Block. Daevanion start: Nezekan Attack Preparation and Survival Stance pairs, then Zikel Murderous Burst.

### 3.3 Other sources

| Source | Gladiator coverage | Usable? |
|---|---|---|
| aion2hub.com `/classes/gladiator` | The 22 skill names and 13 stigma names in the same order and spelling as Metabot, tagged "Global data (Launch Scale Test client, 2026-09-19)". **No learn levels, costs, specializations or nodes.** Also lists 17 KR/TW-only skills (not in Global). Lists a ninth class, Brawler (KR/TW only). | Names only: a weak second voice for the skill and stigma lists. Not for numbers. |
| thegameswiki.com | Blocked (429 checkpoint). | No. |
| GamesFuze, ExitLag, Destructoid, PowerUp Gaming, OSLink, KeenGamer (candidate URLs in classes-and-gaps §2.3) | Not read. GamesFuze is `human-only` in the source registry. | Not until the owner reads them or confirms they may be fetched. |

So for Gladiator: skill table, specialties, level gates, costs, boards, nodes, stigma list are B (one game database).
These count as verified because CLAUDE.md accepts game-database fields (Metabot quest and skill pages) as a source, not because of the Assassin precedent. The advice fields (skill-point order, the four stigmas and when,
first nodes per board, stat tiers, rotation / E row) have **one voice** and must be labelled "single source" or
"inferred" unless two sources are read.

**For the owner (registry mismatch, `data/sources.json` not edited):** `src:aion2hub` has `access.terms: "allows"`, but its own licence note says no terms page exists, and I found none. The `terms` value is unsupported by a page; consider `none-found`. `src:gamesfuze` and `src:thegameswiki` are `human-only` with robots unchecked and terms unread; this report's robots.txt requests (and the GamesFuze 404s) are not recorded there.

### 3.4 What needs the game, not a website

1. Stigma max level on a Gladiator (25 per Metabot, versus 40 for Assassin).
2. One stigma tooltip per slot with its shard cost beyond Lv 20.
3. The Gladiator rotation and key stack on a dummy (the Assassin E row and right-click rows are the guide's inference).
4. The usual per-release spot check: the Skills window at Lv 7 (stepped gate and cost bands) as was done for Assassin.

## 4. Engineering gaps: what in the code assumes Assassin

Build steps below are rough: one step is one reviewable PR with `npm test` green (the 0.2 rhythm).

### 4.1 Findings

| # | Where | Assumption | Effect |
|---|---|---|---|
| E1 | `tools/gen/gen.mjs:63` | `if (classes.length !== 1) throw` ("one class per bundle in 0.2"); `loadBundle` merges every file in `data/`; `build = builds.find(defaultBuild)`; all class-derived tables (`SP_SKILLS_CORE`, `SP_EXTRA`, `RMB_ROWS`, `E_ORDER`, `STAT_*`, `STIGMA_PLAN`, `ST_TARGETS`, `SP_ICONS`, `STIGMA_ICON`, board-plan milestone items, `DV_BOARDS`) are single exports of one `generated.js`. | Must become one bundle per class. |
| E2 | `src/data/build.js`, `src/data/milestones.js`, `src/core/catalog.js` | Static imports of the one generated module. `catalog.js` mutates `GATES`/`SP_STEPS` at module load (sorts, adds regional quests, folds skill steps), "evaluated once". | Class cannot change after load without a reload or a factory per class. |
| E3 | `src/core/state.js` | `KEY = "aion2-assassin-route-v4"` (must stay, CLAUDE.md); `char(state)` returns `state`, there is no `class` field and no characters yet. | Class per character is the 0.5 work. `tests/core/char.test.mjs` enforces access through `char()`. |
| E4 | `src/core/catalog.js:53-54` | Two hard-coded milestones: "Quick Slice, Savage Roar and Shadowstrike reach skill level 8" and "Heart Gore 10 and Urugugu Canyon". | Move into milestones data with a build token; the Expedition item is class-neutral and stays. |
| E5 | `src/core/requirements.js:298`, `src/main.js:1077,1089,1431-1432` | `q: ["Shadowstrike"]`, left click "Quick Slice", `n === "Illusive Clone" \|\| n === "Swift Contract"` as the "before" stigmas, "Q: Shadowstrike". | The key-stack model is class data (`keyStacks`); Q and left click need fields (`keyStacks.q`, `.leftClick`, an `eBefore` split) or the rotation card is Assassin-only. |
| E6 | `src/index.html` | `<title>`, description, og tags, eyebrow, `<h1>`, the rotation card (lines 222-235: Quick Slice icon, "Heart Gore jumps in whenever a crit opens it", Insignia Explosion order), the Sync levels example ("Heart Gore Lv. 6"). | Static HTML must come from the class bundle or be neutral. |
| E7 | `src/main.js:1746` | Export filename `aion2-assassin-progress-<date>.json`; `tests/site.js`, `e1test.js` assert it. | Keep for Assassin; decide the Gladiator name (additive, no key change). |
| E8 | `src/core/migrations.js:30-38`, `src/core/sync.js:24` | One-time migrations write Assassin skill names (`"Quick Slice": 4 …`, `Triniel's Dagger`) and flags. | Legacy, behind flags, leave as is (they must stay idempotent and run only on the Assassin character). |
| E9 | `data/shared/asmodian/guide/{claims,confidence}.json`, `story-quests.json` | Assassin-scoped claims and one Assassin weapon string in shared files. | Add a class scope to claims, or move the Assassin ones under `data/classes/assassin/`. The shared-step check ("no stigma name outside a build token") already guards steps. |
| E10 | Tests | `tests/golden/*`, `journey.js`, `gates.js`, `e1/e2/e3/e4 tests`, `schema.mjs` "broken" cases (`classes/assassin/...`, `skill:assassin:heart-gore`), the `mig1/mig2` pins, `regress.js` fixtures, `site.js` (title, filename, KEY). | Parametrize by class; keep Assassin pinned exactly as today. |
| E11 | `scripts/build.mjs`, `tools/gen/gen.mjs` outputs | Build emits one `generated.js` plus `gate-graph.js`/`gate-proposed.js` (story gates are class-independent and can stay single). Bundle size: all classes in one inlined HTML would grow roughly by the board nodes (about 320 KB of JSON per class); `dist-artifact` must stay one file. | Lazy-load per class on the site; the artifact build may ship Assassin plus one class, or compress node tables (positions are identical across classes, so one shared grid plus per-class skill and `gameId` tables is much smaller (not measured)). |

What does **not** assume Assassin: the story, regional-quest, dungeon, stronghold and unlock engine
(`requirements.js`, `evaluator.js`, `nextup.js`), the milestone compiler, the sealed-dungeon and crystal rules, the
Daevanion cost model and the board grid. Skill steps are keyed by display name and learn level, so a Gladiator list
flows through `SP_STEPS` unchanged.

### 4.2 Plan in build steps

Framework (0.5, same for every class):

| Step | Work | Size |
|---|---|---|
| F1 | Generator: partition records by `class`, `generate({class})` returns one class bundle (`classes[].length` check becomes "one per `class` folder"); shared records stay shared; per-class check set. Emit `generated.<class>.js` or a keyed map. Assassin output byte-identical (golden compare). | 1-2 PRs |
| F2 | Move Assassin-scoped claims and confidence rows to the class; add class scope to claims schema. | 1 |
| F3 | Class descriptor in data (`class.json` + `keyStacks.q`, `leftClick`, `eBefore`; title and rotation texts); replace E4-E7 hard-codes with data. Assassin renders identically. | 2 |
| F4 | Runtime class selection: `catalog.js` as a factory (or reload on class change); `char(state).class` (additive field, default `assassin`, one-time flag, no key change). With 0.5's per-character save. | 2 |
| F5 | Tests parametrized by class; golden snapshot for a second class; mig tests unchanged. | 1-2 |
| F6 | Build size: shared grid for board nodes, lazy load per class on the site. | 1 |

Gladiator content (0.8):

| Step | Work | Size |
|---|---|---|
| G1 | Script `board-nodes.json` from Metabot (grid is identical; skill nodes, `gameId`), `skills.json` for 22 skills from the 22 skill pages with specializations, `stigmas.json`, `class.json`. Mostly mechanical, `npm run gen` validates, `DATA_SOURCES.md` regenerated. | 1 |
| G2 | Guide build `builds.json` (advice fields labelled "single source" until two sources); board plan; key stacks. | 1 |
| G3 | Icons from Metabot (standing OK in CLAUDE.md; source page, file URL and date in `docs/ISSUES.md`): 22 skill and 4 stigma icons. | 1 |
| G4 | Golden snapshot, Gladiator spot check from the owner or tester, CHANGELOG and release. | 1 |

## 5. Recommendation: ordered plan for 0.8

0.8 is Gladiator by default, the first of 0.8 to 0.14 "one class per release" (ROADMAP renumbered 2026-10-15: 0.5
characters and class framework, 0.6 sync, 0.7 new players, 0.8 first class). The framework belongs in 0.5, not 0.8,
so the ordering below puts what is class-independent first.

1. **Now, owner:** answer D8. Which class will you, or a tester you can name, level to 45? That tester is also the
   in-game spot check (§3.4) and decides the order; data coverage does not separate the classes (classes-and-gaps §1).
   Gladiator stays the default (easy class, Greatsword, 91% and 73% stigma pick rates, melee like Assassin; every class shares the same skeleton).
2. **In 0.5:** F1-F6 above, with Assassin output proven byte-identical. Keep the "Class picker (Assassin only visible
   until a second class is ready)" wording from the ROADMAP.
3. **Before 0.8, research pack** (the roadmap's "written ahead" step): read the 29 remaining Gladiator skill pages
   (about 29 requests, 7 s apart, so about 4 minutes), the stigma pages for the four picks, and two advice sources.
   Owner action needed for sources: confirm whether GamesFuze may be fetched or read its Gladiator guide by hand, and read
   thegameswiki's Gladiator page by hand (Vercel checkpoint). Without them the advice stays single-source.
4. **0.8:** G1-G4. Ship Gladiator with explicit "single source" / "inferred" labels on build advice, stepped gates from
   the DB, and the Skills window check at Lv 7 by the tester.
5. **Owner decisions needed:** the class (D8); a named tester or the owner's own Gladiator for the spot check; whether
   the site may ship every class's data in one page or loads per class (F6); whether GamesFuze and thegameswiki may be
   read automatically.

Not recommended: adding `data/classes/gladiator/` before F1 (the build fails, §1), or copying Assassin's advice
(stigma picks, rotation, node order) into a Gladiator build: those are the only per-class values the app cannot derive.
