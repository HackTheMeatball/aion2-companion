# Review: data format v2 (PR #20)

Independent review, 14 Oct 2026, by a session with no earlier part in the project. **Docs only.** It doesn't change
PR #20, `data/`, `src/` or the build.

**What I reviewed:** `docs/DATA-FORMAT-V2.md` and `data/schema/` (19 schemas plus `examples/`) on branch
`claude/vibrant-feynman-bt0cxz`, at commit `9671dab`.

**What I read for context:** CLAUDE.md and docs/ARCHITECTURE.md. These arrived after the draft was written:
docs/feedback/2026-10-14-owner.md (F1–F14), docs/research/2026-10-prereq-gates.md,
docs/research/2026-10-classes-and-gaps.md, docs/research/2026-10-data-sources.md (including the §10 addendum) and
docs/DECISIONS.md (2026-10-14).

**How I checked:** I read the schemas and examples directly, and compared the examples with `data/build.json` and
`src/data/build.js`. I didn't re-run the PR's ajv validation. Every finding below names the file it comes from, and
I label anything I'm inferring as an inference.

## Verdict: **approve with changes**

The core of the design is sound and should stay as it is:

- The save-key strategy: `key` is separate from `id`, every existing key is written out unchanged, and position and
  name keys are frozen rather than migrated.
- The three separate version numbers.
- The `requires` / `completesWith` grammar, with "derived, never written as ticks".
- Provenance on every record.
- No overrides between shared and class data.
- "The generator compiles, it does not research."

On saved progress I found nothing that breaks an existing save.

The problems are about what the draft **leaves out**, because it was written before the owner feedback and the three
research reports. As drafted:

- it can't represent more than one build per class, or a custom build;
- it encodes bug F3 as a game rule;
- it can't compute the "effective skill level" that the specialty slots need;
- it has no field for the game build or for a site's crawl/terms status;
- it doesn't make the owner's screens outrank everything else.

Most of the fixes add new fields or collections. One is structural: the class "plan" has to leave the game-fact
records. All of them must land **before 5b**. 5b freezes the format, compiles today's data into it and becomes the
base for 0.3, so a field added later means every record gets touched twice.

This is not a redesign. The envelope, ids, keys, provenance, conditions and merge sections all stand.

---

## 1. Saved progress: safe, with three gaps to close

**What holds:**

- The storage key stays `aion2-assassin-route-v4`. Its "v4" is explicitly not a version number (§4).
- Every existing key family is listed (§3, 69 milestone keys, 60 dungeon slugs, the `dv:` keys and the MIG_V5
  targets), and each has a written-out `key` field.
- Name-based keys (`quest`, `qsteps`, `sp:<name>:<L>`, `stLv`) and position-based keys (`qsteps` `i`, `qsub` `j`)
  are frozen as explicit fields. They are not migrated.
- `data/retired.json`, with a build failure if a retired key comes back, turns a prose rule into a check. Good.
- The 5c additions (`schemaVersion`, `savedAt`, `mt`) are additive, sit behind a flag and are ignored by older builds.
  Re-stamping values that an older build changed keeps the rollback guarantee.

**Gaps:**

1. **The new features need save fields, and the draft doesn't define them.** It says "v2 changes the data files, not
   the save", but a build picker, a custom build and two more specialty slots all have to store something per
   character. Those fields need names, defaults and merge rules now, so 5c doesn't design them in a hurry
   (must-fix M3, M4).
2. **A narrowed meaning is a reused key in disguise.** prereq-gates §9.3 proposes narrowing `g45:0` from "Hero and
   Ascension quests" to "Witnesses the Nightmare". Old ticks then claim something different. A narrower meaning is
   safe for a `true` tick, but nothing in the format records that a key changed meaning. Nice-to-have N6 records it.
3. **Importing an old export after 0.5 sync.** §10.3 re-stamps every entry whose value differs from its stamp to
   "now". An Import of an old backup that has no `mt` would therefore carry today's time on every changed entry. The
   next sync would then push that old backup over newer progress on every other device. That is 5c's problem, not
   the schema's, but the rule should be fixed before 5c builds it (N1).

## 2. Eight classes, build picker, catch-up, specialties

### 2.1 Eight classes: the layout works, but steps would be copied 8 times

classes-and-gaps answers R1 and R2: all 8 classes share one skeleton (the same learn levels, stigma slots and boards,
§1, §2.2), and there are no class quests. So the shared / per-class layout is the right shape.

The exceptions the draft assumed away:

- **Stigma max level is 40 for Assassin and Ranger and 25 for the other six** (Metabot; owner check pending). The
  stigma schema has no `maxLevel`.
- **7 Asmodian Episode quests have class-specific reward weapons** (§2.4). `rewards.items` is one list with no
  per-class variant.
- **Elyos Sealed Dungeon rewards differ** (§4.3). `rules` has `appliesTo` (classes) but no faction scope, and
  `rule:sd-first-clear` is a rule shared across factions.

**The real problem:** §2 says "a step whose text names a class's skills, stigmas or board nodes is a class step",
and the example `assassin:g22:1` puts the build choice into the text: "Plan: Triniel's Dagger, raised to level 10
first". With 8 classes and several builds each, every stigma, board and skill step (g12:0, g22:1, g27:0/1, g32:0/1,
g37:0/1 and more) would be written once per class, and still couldn't follow the build the player picked. That is
the copy-paste goal 1 of the draft sets out to avoid. Fix in M2: the steps stay shared, keep their keys, and get the
build-specific parts from tokens.

### 2.2 Build picker (F12): not supported

Today the format joins game facts and build choices:

| Build choice | Where the draft puts it |
|---|---|
| Recommended specialty | `skills[].specPick`, on the game-fact skill record |
| Whether a skill is in the plan | `skills[].tracked`, on the game-fact skill record |
| Stat tiers, skill order, stigma per slot, upgrade targets, key stacks | `classes[].plan`, one plan per class |
| Which board nodes to buy | `classBoards`, which holds only "plan nodes the guide tracks", so the board facts are limited to one build's picks |
| Each source's order | `stigmaPlan.bySource`, research notes inside the plan |

There is one plan per class and nowhere to put a second one or a player's own. Fix in M1 and M3.

**Concrete integrity bug the split also fixes.** `specPick` is free text that only looks like a reference:

| Where | Text |
|---|---|
| `skills.json` example, `specPick` | "Up to +20% Critical Hit when **fewer targets are** hit" (`src/data/build.js:23`) |
| Matching option in the same record (`data/build.json:69`) | "Up to +20% Critical Hit when **less targets** hit" |

No validator can catch that, because the pick doesn't point at an id.

### 2.3 Catch-up ranking for mid-level players (F1): partly supported

What's there:

- the skill-point table (`rule:level-points`);
- cost rules for skills, nodes and stigmas;
- `rewards` on quests and dungeons;
- derived completion from the story position, so a Lv 30 newcomer isn't asked to tick 60 old steps.

What's missing:

- **Resource income by level.** Ranking "what can I do with my points and crystals now" needs Daevanion Crystals and
  stigma points per level as well as skill points. classes-and-gaps §4 #10 has both from Metabot's client level
  table (crystals 4 per level from 12; stigma points 1 per level 23–39 and 2 per level 40–45). There's no rule kind
  for either.
- **The fastest / completionist split (F10, owner-decided default: fastest).** Nothing in a record says whether it's
  on the fast path, filler or completionist. `optional` is a display filter, not a route.
- **Effort.** F9 (XP per minute) needs somewhere to store measured minutes. That can wait for the measurement (N4),
  but the route tag can't, because 0.3 designs on it.

### 2.4 Specialties (F3, F4): modelled wrongly

| Issue | Where | What's wrong |
|---|---|---|
| F3 encoded as a rule | `rule:skill-level-gate.value.specialtyAt = {skillLevel: 8, charLevelOffset: 18}` | This is the "learn + 18" heuristic the owner reported as bug F3. Putting it in `rules` with `status: verified` makes the bug a sourced game fact. |
| Slot levels | `rule:specialty-slots` is `integer[]` | No way to say the levels are **effective** skill levels (bought + board nodes), and the example `rules.json` has no record for it. |
| Slots and choices mixed | `specialties[{skillLv, options[]}]` | Slots (3, at 8/12/20) and choices (5, at 8/8/8/12/16) are different things. Choices have no ids, so a build can't point at one (see 2.2). |
| Effective level | `classBoards` keys only plan nodes | Effective level = skill level + **every** owned skill node for that skill, including nodes outside the plan. Nodes outside the plan have no key, so the app can't count them. Path costs (classes-and-gaps §4.4, Steiner tree on Metabot's grid) also need every node's row and column. |
| Save keys | only `sp:<key>:spec` exists | Slots 2 and 3 need new keys. Reserve them now. |
| Stigmas | no specialty field | Stigma specialties unlock at stigma Lv 5/10/15/20 (classes-and-gaps §1). |

## 3. Sources model: the right idea, missing three things

The good parts:

- one record per site;
- `hosts` resolution, so "a new site can't slip in unreviewed";
- `independenceGroup`;
- `use.facts` / `wording` / `quotes` / `link`;
- `banned`;
- per-field `sources[].fields`;
- owner screens cited privately.

Measured against the 2026-10-14 decisions:

| Requirement | Draft | Gap |
|---|---|---|
| aion2.th.gl dropped | Not in the registry. The build rule "every URL must resolve to a site" would therefore fail on the 33 th.gl URLs still in the data (prereq-gates §10) with no way to say "withdrawn". | Needs a withdrawn state that differs from `banned` (Game8 was never used; th.gl was used and has to be re-sourced). M8. |
| Crawl / terms status per source | Only `licence` (reuse) and free-text `reach`. | Reading and reuse are different questions. data-sources §10.3: gamers4.life and aion2.app allow scraping in robots.txt but **ban it in their terms**; Wikily's terms bar scraping; interactivemap.app opts out of AI. The policy (DECISIONS, CLAUDE.md "Fetching") can't be checked without these fields. prereq-gates §10 #8 asked for the same thing. M8. |
| Per-source licence | `licence.id` plus a note. The Metabot example says `unknown`. | Metabot's terms **were** read (data-sources §4.1): attribution with a dofollow link to the page, non-commercial, no endorsement. An id can't express conditions. M8. |
| Game build with `verifiedAt` | `verifiedAt` is a date only. `sourceRef.date` is optional. There is no build field anywhere. | data-sources R4: Metabot's quest count changed at the **same** build. §10.4: three incompatible build schemes (`0.0.4387.0`, "2.0.6.0", "Client Build 120"). KR already changed stigma caps and slots. Without a build per check, "re-check after a patch" is a guess. M9. |
| Owner's screens as top authority | `kind: owner`. `status` lists "the owner's in-game screen" alongside "a game-database field" as equal ways to be `verified`. The owner ref is free text ("skill window at Lv 12 and 13 (Oct 2026)"). | Nothing says owner beats a database when they disagree, and nothing checks it. M10. |
| Independence | Wikily is in group `metabot`. | data-sources §10.2: Wikily is NX Software SAS, a different operator. The real dependency is the shared upstream (all client-extracting databases read the same client, R1), and some sites share an operator (gamers4.life and interactivemap.app, R7). Group membership needs to state its reason (N3). |

## 4. Simpler or more complex than needed?

**Too complex in one place: confidence is said in four layers.** A gate's trust lives in the atom's `basis` and
`sources`, then the record's `requiresBasis`, then the record's `status`, then `fieldStatus`. They can contradict
each other, for example `requiresBasis: sourced` while one atom says `basis: legacy`. The `g22:1` example has
`requiresBasis: legacy` while its level atom says `basis: sourced`. Keep `requiresBasis` only for what atoms can't
say (`unresearched`, `verified-none`, `legacy`), and have the build derive the rest (N2).

**Too simple where it matters:** one plan per class, specialties as strings, plan-only board nodes, a date with no
build, a licence with no conditions, no crawl state. That's sections 2 and 3.

**About right:**

- one file per collection, sorted by id;
- text tokens;
- `any` kept, with no `not`;
- the 19 collections. They map one-to-one onto today's tables (§9 is thorough, and the most useful part of the draft).

## 5. What breaks first in a year

Most likely first:

1. **Adding the second class** (D8, probably Gladiator). Without M1 and M2, it means copying about 15 Assassin steps,
   inventing a second `plan`, and finding out that `specPick` and `tracked` sit on fact records. That's the first
   thing on the roadmap that touches this format.
2. **A game patch.** Global will get KR's changes: 5 stigma slots, stigma max 25 (data-sources §10.5), Lv 50 content
   (Conquest tier 6 is already in the client). `rules` hold one value each, with no build stamp and no history.
   Without M9 nobody can say which records predate the patch. Changing `rule:stigma-slots` from 4 to 5 values
   changes `stigmaSlot` maximums and adds steps; the keys survive, because they're written out.
3. **The Metabot single point.** It's the only scriptable primary source, and its terms are "non-commercial". Any ads
   or donations on daevacompanion.com put most of the data's licence in question (data-sources R2). The registry
   should hold that condition, so the build can list every record it affects (M8).
4. **`verifiedAt` going stale at scale.** About 400 records today and roughly 3,000 with eight classes, each with a
   hand-set date. Re-checks will update some and not others. A build stamp per source, plus "re-checked against
   build X", scales. Dates alone don't.
5. **Specialty text drift.** Metabot rewords tooltips ("less" vs "fewer" already differ between our two files).
   Anything keyed or matched on option text breaks. M4 gives choices ids.
6. **The `order` numbers that interleave shared and class steps** across 8 classes. They're fragile, but cheap to
   fix later. Not a must-fix.

What won't break: save keys. Name keys are frozen, a rename changes `name` and not `key`, and retired keys are
checked. That part of the design is solid.

---

## Must-fix (before 5b starts)

Each item gives the exact change. Ids and keys are examples in the draft's own style.

**M1. Split build choices out of game facts: a new `builds` collection.**

- Add `data/schema/builds.schema.json` and the file `data/classes/<class>/builds.json`. One record per build:

  ```json
  { "id": "build:assassin:guide-default", "class": "assassin", "name": "Guide default", "origin": "guide",
    "statPriority": {…}, "skillOrder": [{ "skill": "skill:assassin:heart-gore", "core": true, … }],
    "specialtyPicks": { "skill:assassin:heart-gore": ["spec:assassin:heart-gore:3", "spec:assassin:heart-gore:4", "spec:assassin:heart-gore:5"] },
    "stigmaSlots": ["stigma:assassin:triniels-dagger", …], "stigmaTargets": [ … ],
    "boardNodes": ["node:assassin:nezekan:r5c8", …], "keyStacks": { … },
    "sources": [ … ], "verifiedAt": "…", "status": "…" }
  ```

  `origin` is `guide` · `community` · `template`. Every reference is a record id, and the build checks that each one
  resolves.
- Remove these from the fact records and put them in the build: `classes[].plan`, `skills[].specPick` and
  `skills[].tracked`. `tracked` becomes "the skill appears in the build's `skillOrder`".
- `classes` keeps id, name, release and role, plus `defaultBuild: "build:assassin:guide-default"`.
- `stigmaPlan.bySource` moves to the claim that backs the disputed order.
- 5b compiles the default build into today's `SP_SKILLS` / `STIGMA_PLAN` / `STAT_TIERS` / `RMB_STACK`, so the golden
  tests stay identical.

**M2. Shared steps follow the build through tokens, not per-class copies.**

- Add build tokens to `inlineText`: `[[build:stigma:N]]`, `[[build:stigmaTarget:N]]`, `[[build:node:<board>:N]]`
  and `[[build:skillOrder:N]]`. The token list in the `inlineText` / `richText` patterns grows by `build`.
- Change the §2 rule from "shared steps must be class-neutral" to "shared steps name build choices only through
  `build:` tokens. A class step is only for text that's true for one class whatever the build."
- `g22:1` and the others stay shared, with the same key and the same position. Keys don't change, so saves aren't
  affected. 5b's compiler expands the tokens with the default build and emits today's HTML exactly.

**M3. Define the save fields for build choice and custom builds now (spec in §10; written in 5c or 0.3).**

- Add these per-character fields to §10.2 and to `CHAR_FIELDS`:
  - `buildId`: a string. Absent means `classes.defaultBuild`, so every existing save behaves as today.
  - `customBuild`: `{ "basedOn": "<build id>", "picks": { "specialtyPicks": {…}, "stigmaSlots": […], "boardNodes": […] } }`.
    Only the fields the player changed, keyed by record ids.
- Merge rule: each field is a register, and the latest change wins (it gets an `mt` entry when Q1 is yes). An
  unknown id in `customBuild`, for example after a game patch renames a stigma, is ignored with a visible notice and
  never deleted. That keeps the "never break saves" rule.
- `stPick{slot: name}` keeps meaning what's equipped in the game. The build only says what the guide recommends.

**M4. Specialties: slots, choices, effective level, keys.**

- Replace `skills[].specialties` with
  `specialtyChoices: [{ "id": "spec:assassin:heart-gore:1", "n": 1, "skillLv": 8, "text": "…" }, …]`, numbered 1–5,
  with the levels 8/8/8/12/16 written per choice. Choice ids are permanent.
- Change `rule:specialty-slots` to `{ "slots": [8, 12, 20], "levelBasis": "effective" }`. Source it from the owner
  screen (F4) plus Metabot for the choice levels, and add the record to the examples.
- Delete `specialtyAt` from the `skillLevelGate` schema and from `rule:skill-level-gate`. It's bug F3.
- Define "effective skill level = highest ticked `sp:<key>:<L>` (or learn level 1) + the number of owned board
  nodes whose `skill` is this skill, each worth the node's `adds` (default 1)". Write it in §6 and in the rule's
  description.
- Reserve the save keys `sp:<key>:spec` (slot 1, as today), `sp:<key>:spec2` and `sp:<key>:spec3`, and list them in
  the §3 key table.
- `stigmas`: add `maxLevel` (25 or 40 per class, Metabot, owner check pending) and `specialtyChoices` at stigma
  Lv 5/10/15/20, in the same shape.

**M5. Board nodes as game facts, every node.**

- Add `data/classes/<class>/board-nodes.json` (collection `boardNodes`). One record per node on every board:
  `id` `node:<class>:<board>:r<row>c<col>`, `board`, `row`, `col`,
  `type` (`start` · `stat` · `skill` · `unique`), `cost`, `label`, `skill` (for skill nodes), `adds` (skill levels)
  and `sources` (Metabot `daevanion/<class>`).
- `key`: the existing `dv:` key for every node that has one today (Nezekan, Zikel, Vaizel, Triniel plan nodes), by written-out mapping. Any other node
  gets `key = "dv:<board>:r<row>c<col>"`. Widen the node `key` pattern to `^dv:(([zvt]:)?[a-z0-9]+|[a-z]+:r[0-9]+c[0-9]+)$`.
  Full board names (`zikel`) can't collide with the one-letter prefixes (`z:`).
- `classBoards` either becomes the board-plan part of a build (M1) or is removed.

**M6. Story quest ids from game ids, plus Ascension quests.**

- `storyQuests[].id = "sq:<gameId>"`. All 88 Asmodian story quests now have Metabot ids (prereq-gates §1, §4).
  Ids aren't in any save yet, so changing them is free now and costly after 5b. `key` stays the English name (Q5).
  Make `gameId` required on story quests.
- Reason: the draft's slugs are ambiguous. Metabot's bare slug `daeva-in-a-dream`, used in the `g22:1` example, is
  the **Elyos** page (prereq-gates §2, §9.5).
- Add the id kind `asc:` (Ascension quests, a slug until a game id is confirmed), a `wraps: "asc:…"` field on story
  quests, and `inCap: false` for records past Lv 45 (prereq-gates §10 #5 and #10). That way "Daeva Trapped in a
  Nightmare" and "Waiting for the Next Journey" fit without leaking into Next up.
- Update R3's default to match.

**M7. Gate semantics stated per gate, and an "owner to check" label.**

- In `cond`, make `is` **required** on `story` atoms and remove `"default": "reached"`. Owner check 1 (reached vs
  turned in, prereq-gates §3, an estimate of about 70%) will then change specific atoms that are labelled, not a
  default that's applied silently.
- Add `owner-check` to `status` and to `atomMeta.basis`. The research reports label 6 `noPre` candidates, the Daeva
  Trapped giver, the stigma caps and more as "owner to check in game", and the draft has no value for that.
- Forbid `{done: "sq:…"}` (story completion is `{story, is: turnedIn}`), so there's one way to say it.

**M8. Sources registry: access, withdrawal and licence conditions.**

- Add a required `access` object to `site`:

  ```json
  "access": { "robots": "allows|ai-excluded|unchecked", "terms": "allows|bans-automation|unread",
              "termsUrl": "https://…", "mode": "scripted|human-only|none", "checkedAt": "YYYY-MM-DD" }
  ```

  Build rules:
  - no source ref may be added or changed on a site with `mode: none`;
  - `terms: bans-automation` forces `mode: human-only` or `none`;
  - `unchecked` / `unread` give a warning (DECISIONS 2026-10-14; data-sources §7 and §10.6 decision 5).
- Add `withdrawn: { "date": "2026-10-14", "reason": "robots.txt excludes AI agents (owner rule)" }`, separate from
  `banned`.
- Add an `src:aion2-th-gl` record with `use.facts: false`, `access.mode: none` and `withdrawn`. The 5b build fails on
  any th.gl URL still in the data, so the 33 citations (prereq-gates §10) are re-sourced to Metabot or relabelled
  `owner-check` as part of 5b, and none is dropped silently.
- Add `licence.conditions[]` with the values `attribution-link-to-page` · `dofollow` · `non-commercial` ·
  `no-endorsement` · `share-alike` · `no-redistribution`, and allow `licence.id: "custom"`. Fill them in for:
  - Metabot: `custom`, conditions `[attribution-link-to-page, dofollow, non-commercial, no-endorsement]`,
    `checkedAt 2026-10-14`;
  - thegameswiki: `CC-BY-NC-SA-4.0`;
  - Wikily: its own group, `access.terms: bans-automation`.
- Add `operator` (free text) so sites run by the same operator are visible (R7).

**M9. Record the game build and region with every check.**

- In `sourceRef`, rename `date` to `checkedAt` and add `build` (`{ "scheme": "metabot|gaming-tools|client|patch",
  "value": "0.0.4387.0" }`) and `region` (`global` · `kr` · `tw`, default `global`).
- Make `checkedAt` required on `url` and `owner` refs that are created or changed after v2 ships. Legacy refs may
  omit it, and the build lists them as debt.
- `verifiedAt` stays the record-level date and must equal the latest `checkedAt` among its refs when any ref has one.
- Add a small `data/game-builds.json`: observed build strings per scheme, with the date first seen and the patch they
  belong to when known (T1 is still open). Patch-watch then becomes "refs with a build older than X".

**M10. The owner's screens are the top authority, and the build checks it.**

- Make the owner ref structured:

  ```json
  { "owner": { "ref": "<opaque id or private-repo path>", "checkedAt": "…", "build": {…}, "what": "skill window, Quick Slice" } }
  ```

  The build rejects a `ref` that looks like a URL.
- In §5, add the precedence: owner screen > game-database field > guide or wiki > inferred.
- Validator: for every field an owner ref backs, the record's value must be the owner's value, that field's status
  is `verified`, and any source that differs goes into `conflicts`. A newer database value after a patch is the one
  exception: it needs an explicit `conflicts` entry and the label `owner-check`, never a silent overwrite.

**M11. Catch-up inputs.**

- Add the rule kinds `crystalsPerLevel` and `stigmaPointsPerLevel`, with tables indexed by level like `levelPoints`.
  Source: Metabot's leveling page, classes-and-gaps §4 #10.
- Add an optional `route` to steps, regional quests, Sealed Dungeons and strongholds, with the values `core` ·
  `filler` · `completionist` (F10).
- 5b fills `route` from today's behaviour (`optional` gives `completionist`, everything else `core`), so nothing
  visible changes. 0.3 tunes the values with the owner.

## Nice-to-have

- **N1 (5c, before it's built). Import vs sync stamps.** Stamp entries from an Import without `mt` with the export's
  `savedAt` when it has one, otherwise with 0, so a stale backup never outranks newer synced progress. Keep "now"
  only for the rollback case: the same device, and a value differs from its stamp. Add a test: export at T0, tick on
  device B at T1, import the T0 export on A, sync. B's tick has to survive.
- **N2. One confidence layer for gates.** `requiresBasis` only takes `unresearched` / `verified-none` / `legacy`. The
  build derives `sourced` / `inferred` / `rule` from the atoms and fails on a contradiction like the `g22:1` example
  (`requiresBasis: legacy` with a `sourced` atom).
- **N3. Independence by upstream.** Add `upstream: "global-client"` to client-extracting databases, and in §5 say that
  game-database fields from one upstream count once (data-sources R1). This matches today's policy (one game-database
  field is enough) but makes the two-source count honest for anything else.
- **N4. Effort.** Add an optional `effort: { "minutes": n, "basis": "owner-log" }` on repeatable activities once F9's
  measurements exist.
- **N5. Class and faction variants.** `rewards.byClass: { "<class>": "item" }` for the 7 Episode quests, and
  `appliesTo.faction` on `rules` (Elyos dungeon rewards).
- **N6. Key meaning log.** Allow `retired.json` entries of the form
  `{ "key": "g45:0", "narrowed": "2026-…", "from": "…", "to": "…" }`, or better, give the narrowed step a new key
  (`g45:witness`) and retire `g45:0`. That costs one new key and removes the question entirely.
- **N7. Opaque owner refs.** Use ids like `owner:2026-10-14-03`, with the path to the private file kept in the
  private repo. File names can carry character names, and `data/` is public.
- **N8. Validator check now.** Until M1 lands, have 5b fail when `specPick` isn't one of the skill's option texts.
  Today it would fail on Heart Gore.

## Answers to the draft's reviewer questions (R1–R9)

| # | Answer |
|---|---|
| R1 | **Mostly yes, with two exceptions.** Learn levels, stigma slots, shard costs and boards are the same for every class (classes-and-gaps §1, §2.2). Stigma max level differs (25 vs 40), so put it on stigma records, not in a rule (M4). |
| R2 | **Yes.** No class quests, and skills and stigmas are the same for both factions. Class reward weapons are the only class-specific quest data (N5). |
| R3 | **Game ids, not slugs** (M6). All 88 are known now. |
| R4 | Yes. |
| R5 | Yes. Ship QUEST_STEPS and file the difference. |
| R6 | Yes, and also record the build where git history shows which pass read which build (M9). Leave it empty where unknown, never guessed. |
| R7 | Yes, required for `keep` / `rewrite`. |
| R8 | One file per collection. |
| R9 | Tokens, with their text in code. A `snippets` list isn't needed. |

---

## For the owner: decisions in plain language

The design is a good base. Your saved progress is safe under it, and nothing in it renames or drops what's already
stored. It needs a set of additions before the team builds on it, mostly so it can handle several builds per class,
the specialty fix, and the new rules about which websites we use. These are the questions only you can answer. Each
has my recommendation.

1. **If you un-tick something on your phone, should it stay un-ticked on your PC after syncing?** (the draft's Q1)
   That needs a small time stamp per item, which makes the save a bit larger (about 25 KB at most, well within
   limits). **Recommend: yes.** Otherwise un-ticks come back after a sync.
2. **Should display settings (Basic/Advanced, folded cards) sync between devices?** (Q2) **Recommend: no.** A phone
   and a PC usually want different layouts.
3. **May we keep using a site whose terms we haven't read yet, for facts only, with a link?** (Q3) **Recommend: yes,
   but only for sites whose robots.txt and terms don't forbid automated reading.** Sites that forbid it (Wikily,
   gamers4.life, aion2.app) are read by a person in a browser or not at all. aion2.th.gl stays dropped, and its 33
   remaining citations are replaced or marked "check in game" during the data rebuild.
4. **Metabot's terms say "non-commercial".** Most of our data comes from Metabot. Ads, donations or paid features on
   daevacompanion.com could break that condition. **Recommend: keep the site free of ads and donations until we've
   asked Metabot. If you want either, ask them first** (DECISIONS already says permission comes before any change).
5. **Your in-game screens as the top source.** When your screen and a database disagree, your screen wins, and the
   database's value is kept as a recorded disagreement. **Recommend: yes, and cite each screen by a short code (for
   example "owner:2026-10-14-03"), not by file name.** It also helps if each screenshot shows, or you note, the date
   and the game version shown in the launcher or settings, so we know which patch it belongs to.
6. **Builds: how many per class, and where do they come from?** You asked for the top 3 builds from the most-used
   sites plus a custom build. **Recommend: one guide default plus up to two alternatives per class, each credited to
   the sites it came from.** We take the choices (which skills, stigmas, nodes), never the sites' wording. A build
   needs two sources that agree, or it's shown as "single source".
7. **Custom builds.** **Recommend: you start from one of the listed builds and change any pick. Your choices are
   saved with your character, included in Export, and synced later.** If a game patch removes something you picked,
   the app tells you and never silently deletes your choice.
8. **"Fastest" vs "completionist".** You already chose "fastest" as the default. Someone has to decide which quests
   and dungeons are "fastest" and which are "filler" or "completionist". **Recommend: the team proposes a label for
   every item based on today's guide, and you approve it milestone by milestone in 0.3.** Nothing changes on screen
   before then.
9. **Quest and skill names as permanent save labels.** (Q5) Your progress is stored under the English names, for
   example "Land of Rifts". **Recommend: keep it that way.** If the game renames something, we keep the old name as
   the hidden label and only change what's displayed.
10. **"Checked on" dates in the app?** (Q6) **Recommend: no per-item dates.** They'd be clutter. The Sources card keeps
    one line, and the team uses the dates and game versions to know what to re-check after each patch.
11. **The last Lv 45 story quest ("Daeva Trapped in a Nightmare").** (Q7) **Recommend: add it like any other story
    quest once your in-game check confirms who gives it.** No format change is needed.

## Follow-ups this review doesn't do

- Update PR #20 with M1–M11 (owner: Tech Lead, after the owner answers 3–8 above).
- Owner in-game checks that bear on the schema: stigma max level on a non-Assassin character (M4), and the gate
  semantics, check 1 (M7). Both are listed in the research reports already.
