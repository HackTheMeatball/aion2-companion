# Changelog

Versions before 0.1.0 are the internal build numbers of the single-file claude.ai artifact (`vNNN`). Saved progress has
used the same `localStorage` key, `aion2-assassin-route-v4`, throughout; every version below loads every earlier save.

## 0.1.3 (beta) — 2026-10-13 · ascension hotfix

- Next up no longer offers "The One Who Dreams" before the story reaches "A Daeva Dreaming Anew", or the Lv 45 Hero and
  Ascension step before "Forgotten Commander" is turned in (game-database prerequisites, aion2.th.gl; claims C36, C37).
- Story steps you're already past (e.g. "The Being Beneath the Lake", "Urgent Pursuit") are no longer offered in Next
  up; "The Being Beneath the Lake" now ticks with its story quest.
- Ascension text: The One Who Dreams needs a full Ascension Gauge; "Dream Crossroad"; "The One Who Hears the Voice";
  removed the disputed claim that "The One Who Perceives" gives your first wings (C38). Sources card: 291 → 300 links.
- Tests: new `gates` suite (story-gate sweep over every story position) and the golden master (`golden`, 2,000 generated
  saves); golden re-recorded for this fix, known Next up gate violations 801 → 0.
- No change to saved progress: same storage key and item keys, no migration; nothing is ticked automatically.

## 0.1.2 (beta) — 2026-10-13 · licensing and wording

- License: code is now PolyForm Strict 1.0.0 (source-available: noncommercial use, no redistribution or modified
  versions); guide text, data selection, the project's name and branding, and its artwork are all rights reserved.
  Versions up to 0.1.1 were MIT and keep that license. See LICENSE. Contributions: issues welcome; code only with a
  written grant.
- Wording: the guide is described as unofficial everywhere (README, share cards, installed-app name); footer adds the
  NC disclaimer, a "check in game" note, copyright and a Privacy link; the Sources card says "every sourced value"; the
  "verified" badge explains itself.
- PRIVACY.md: claude.ai build note, a Changes section. CLAUDE.md: licensing and source rules. ISSUES.md: icon
  provenance to record.
- ROADMAP.md re-sequenced: foundations (0.2) before correctness (0.3), characters (0.4), new players (0.5), then classes.
- No change to saved progress.

## 0.1.1 (beta) — 2026-10-13 · release automation and CI upkeep

- Releases are automatic: after tests and the deploy pass on `main`, CI tags each new version and publishes its GitHub
  Release from this changelog (`scripts/release-notes.mjs`); CI fails early if a version has no changelog section.
- CI: GitHub Actions moved to their current major versions (Node 24 runtime); runners pinned to Ubuntu 24.04 ahead of
  the `ubuntu-latest` image change.
- ROADMAP.md: 1.0 scope (all classes, Asmodian), versioning, how objectives are worked, the 0.1.x and 0.2 plans.
- No change to the app.

## 0.1.0 (beta) — 2026-10-12 · repository and standalone site

- Moved into this repository; published at <https://aion2.ishkabytes.com/> (GitHub Pages) besides the claude.ai artifact.
  The visible app is unchanged from v291.
- Proper document head: charset, viewport, description, canonical URL, Open Graph, theme color, favicon, web app manifest.
- Installable and offline: service worker (network-first for the page, cached icons; cache versioned per build). Only on
  the standalone site, never in the claude.ai build.
- Export progress: a plain file download outside claude.ai; inside claude.ai it still uses the artifact's downloads
  permission. Import unchanged.
- Footer line: fan-made / not affiliated with NCSoft, data credits (→ Sources card), Metabot credit link.
- Build (`scripts/build.mjs`) produces both the site (`dist/`) and the claude.ai single file (`dist-artifact/`, icons as
  `/_blob/<id>`). The data generator and all test suites run from the repo; CI tests every push and deploys `main`.

## v291 — E4 (QA3 findings) + head fix

- "Put <stigma> on E" ticks itself when the slot is marked equipped (one-time `eputSync1` migration for saves that
  already had equipped slots).
- Optional steps count only once ticked: milestones with only optional steps left show *Cleared*, not *Missed*.
- Skills past the plan: "N points spare · no sourced plan past this". Hint shows how many following upgrades your points
  cover.
- Level-gated story card suggests what to do meanwhile (Sealed Dungeons, strongholds, highest open expedition, daily
  dungeon).
- Stigma "x of y spent" total is stable (92 = all four planned stigmas to their targets).
- Last Altgard quest: Journey button marks it turned in; end state "Altgard story complete · continue in Reshanta".
- Regional card: stays while quests are snoozed ("Show again"); "+N waiting on the story" row with an *In my game*
  override. "single source" tag on single-source skill buys.
- Data: one zone fix (Nine Wonders of Altgard: 2nd Leg → Battlescar Mound); Sources card wording.
- Head fix (v291b): empty "Regional quests · Lv N" sub-headings are hidden; Export uses the claude.ai downloads
  permission.

## v290

Fixes between E3 and E4 (QA3 pass), not separately logged.

## v289 — E3

- Regional quests without any prerequisite data open at their recommended level, not Lv 10; snoozes on them survive
  Level up until then.
- Milestone quest rows: *In my game* pill on locked quests; one snooze label ("Not in game yet").
- Next up: story card always in the stack; stack height follows the visible card; byStory steps tick with the story;
  board "opens" steps replace the buy card until done; Lv 45 extras are optional and Advanced only.
- Stigma pick: plain name with "change ▾", "Other…" for any stigma; "needs 1 shard" state.
- Zones: one zone per giver camp (10 quests moved; e.g. Quai Campsite → Calderon Canyon). Unverified group in Confidence.
- Layout fixes at 390 / 1100 px; Sources card grouped per site.

## v288 — E2 (data integration)

- All 58 regional quests from verified data: giver, Kibelisk, zone, rewards, recommended and unlock level; 17 regional
  prerequisites and 43 story gates; quests placed in milestones by level.
- Main story Lv 41–45 (Daybreak Society … Forgotten Commander) and the end-of-Altgard state.
- Strongholds (zone, level range, Kibelisk); Sealed Dungeon Kibelisks; dungeon XP removed (mostly unknown).
- Build: stigma plan Triniel's Dagger, Illusive Clone, Swift Contract, Savage Fang; upgrade plan Triniel's Dagger to 10,
  then Illusive Clone toward 20; seven skills appended after the core eight; Vaizel / Triniel board nodes; Ariel removed.
- Every claim re-checked (claims.json): rewritten, dropped or labelled. Confidence and Sources cards generated from data
  (291 links).

## v287

Fixes after E1, not separately logged (the pre-E2 baseline used by the migration tests).

## v286 — E1 (stable keys, fixes, clean-up)

- Stable keys: regional quests `rq:<id>`, Sealed Dungeons `sd:<slug>`, every other item an explicit key. One-time
  migration (`migV5`) copies ticks from the old position keys; old keys are left in place.
- One Next up card per stigma equip; short titles; skills card when the plan is spent; story end handled.
- Snooze ("not yet") for regional quests; stigma pick per slot with an undo toast.
- Removed: Paid tasks filter, dead JS, ~450 unused or overridden CSS rules (CSS 136 → 107 KB). `update()` ~3× faster.
- Export / import progress; new installs start with cleared milestones folded; accessibility fixes.

## v285

Baseline before the polish passes (the migration-test baseline in `tests/baselines/v285.html`).
