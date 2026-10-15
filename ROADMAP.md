# Roadmap

**1.0.0 = all eight classes, Asmodian only, Lv 1–45.** Every class meets the bar the Assassin guide sets today:
verified data only (see CLAUDE.md), Next up always correct, saved progress never broken. Elyos is after 1.0.

Classes (per [Metabot](https://metabot.gg/en/aion-2/classes)): Gladiator, Templar, Assassin, Ranger, Sorcerer,
Spiritmaster, Cleric, Chanter.

## Versioning

[Semantic versioning](https://semver.org/); 0.x is beta. Each part is its own counter (0.9 → 0.10 → 0.11), so there is
no running out before 1.0: 1.0 ships when its scope is done.

- **Minor (0.X.0)**: a theme, i.e. one or more related objectives. New ideas join a theme that fits before they start a
  new one.
- **Patch (0.X.Y)**: fixes, data corrections, small polish and upkeep. No new features.
- **Releasing**: bump `version` in `package.json` and add a `## X.Y.Z` section to CHANGELOG.md in the same commit. After
  tests and the deploy pass on `main`, CI tags `vX.Y.Z` and publishes the GitHub Release with that section as its notes.
  CI fails early if the version has no CHANGELOG section.

## How an objective is worked

1. **Problem**: what's wrong or missing, in a sentence or two.
2. **Acceptance**: how we know it's done, as a test where possible.
3. **UX pass**: what the user sees and does, sketched and reviewed *before* building. Visual polish comes after the
   feature works. New UI reuses the existing card patterns (uniform milestone / Next up / Skills / Stigmas cards).
4. **Build → test → release.**
5. **Play with it** in game; what you notice feeds the next objective.

A whole-app UX review every second minor release (first one after 0.2, before 0.3 is built), before 1.0, and after any
large visible change catches drift as features pile up.

Work runs as parallel sessions, one task and one PR each. Who runs what, and what may run alongside what, is in
docs/team/HANDOFF.md ("Now and next").

## Released

- **0.1.0** — repository, standalone site (aion2.ishkabytes.com), offline/PWA, CI. App identical to artifact v291.
- **0.1.1** — CI upkeep, automatic tags and GitHub Releases, this roadmap.
- **0.1.2** — licensing (PolyForm Strict code, original content reserved) and unofficial-guide wording.
- **0.1.3** — Ascension hotfix: story gates for "The One Who Dreams" and the Lv 45 Hero/Ascension step, story steps
  already passed no longer offered, text fixes, `gates` suite and golden master.
- **0.1.4** — version in the footer, *Report a problem* link with prefilled issue form, issue forms and labels.
- **0.1.5** — persistent storage request, save-failure warning, self-hosted fonts.
- **0.1.6** — accessibility fixes with no visible change (screen-reader names, focus, reduced motion, touch), `a11y` suite.
- **0.1.7** — rebrand to Daeva Companion (name, mark, icons; palette unchanged).
- **0.1.8** — new address: daevacompanion.com.
- **0.1.9** — touch, contrast and page-zoom fixes (visible accessibility batch from the mobile audit).
- **0.2.0** — Foundations: pure core, data format v2 with JSON Schemas and a Node generator, owner-verified unlocks and
  Metabot locations, aion2.th.gl withdrawn, per-item change times and `merge()` in the save.

## Plan

Re-sequenced 2026-10-13 after an architecture audit. Principle: fix live bugs now; then build foundations with no
visible change; then correctness; then class plumbing; then the experience for new users; then class content. Work that
depends on the data format (the prerequisite audit, class content, onboarding, patch tracking) waits until the format
exists, so it is done once.

### 0.1.x — fixes and upkeep (patches)

From the mobile & accessibility audit (docs/audits/2026-10-mobile-a11y.md):

- The invisible accessibility batch shipped as 0.1.6. Left for the visible pass: hit areas on bordered pills and the
  Confidence / Sources summaries.
- **0.1.9** (visible, owner approval): no iPhone zoom when tapping fields, contrast fixes, story-line connector fix,
  layouts that survive page zoom, 44 px primary buttons on touch, minimum text sizes, compact cleared steps.
- Save safety (visible, mockup first, built after 0.2 step 4): a "last backup N days ago" line with one export nudge,
  and an "Add to Home Screen" hint in iPhone Safari only (home-screen apps keep their data much longer). Never in the
  claude.ai build.
- Design tokens (invisible: 0 changed pixels): every colour, size and radius from a token, documented in
  docs/design-system.md; a test fails on new raw colours. Groundwork for the colour sprint and the phone layout.
- Release safety (invisible): a post-deploy check that the live site serves this build; faster CI (fast job < 2 min,
  browser suites in parallel, one required check `ci-ok`); the flaky timing check moved to a non-blocking `perf` suite.
  Then branch protection on `main` (owner, in GitHub settings).

Phone layout (Next up near the top, a touch-friendly stack, Build as a bottom sheet; audit P1-1, P1-2, P2-5) needs a
mockup and touches the card code that 0.3 rewires, so it is built after the 0.3 requirement engine, on the design
tokens.

### 0.2 — Foundations (no visible change)

Steps here are the audit's P0–P4 (step 4 = P3, step 5 = P4). Acceptance for every step: the golden-master suite (Next up and milestone output for 2,000 generated saves) is
identical, all suites green, saves untouched.

1. Golden-master harness (tests only).
2. Toolchain: ES modules + esbuild, still one static HTML file for both builds.
3. Data out of code: hand-written data constants move to data modules; the generated block is built, not committed.
4. Pure core: state, migrations, requirements and Next-up ranking as DOM-free modules with fast Node tests; every
   read of character data goes through one `char(state)` accessor (groundwork for characters, 0.5).
5. Data format v2, in three parts:
   - **5a schema** (docs only, can start before step 4 lands): stable ids (not display names), shared vs per-class
     folders, a sources registry with license per source, `verifiedAt` per record, `requires` / `completesWith` on
     every step, `schemaVersion`, `merge()` semantics, draft JSON Schemas. Reviewed by Data & Research and by a fresh
     session with no team context, then by the owner, before anything is built.
   - **5b build**: data moved to the format, Node generator replaces gen.py, schema validation, the generated block no
     longer committed. Compiled data equals today's. No data patches while this runs.
   - **5c saves**: `schemaVersion` added additively behind a flag, and a pure, tested `merge()` for two saves
     (groundwork for sync, 0.6). Keeping un-ticks through a merge needs a per-item change time in the save (owner decision).
   5b and 5c can run in parallel; both wait for step 4 and the approved schema.

**0.2.0 released 2026-10-14** (5b and 5c merged). Steps 1–3 shipped 2026-10-13 with no visible change (golden harness,
toolchain, data out of code). 5b part 2 carried owner-approved visible data corrections (#38).

### 0.2.x — patches on the way to 0.3

Planned 2026-10-15 (owner followed the CEO's recommendation). Patches carry small, low-risk changes (fixes, data
corrections, polish, small display additions); no engine, data-format or save-format work; invisible work (faster CI, design tokens, the 0.3 engine groundwork) lands between them without a
release. The order can change.

- **0.2.1**: a fresh browser starts at Lv 1 on the first story quest ("A Village in the Fog") instead of Lv 5 with no
  quest; saves are never re-defaulted.
- **0.2.2**: Daevanion up arrow starts at 1 (F6); rotation pop-out lists only unlocked skills (F7); missing skill icons
  (F8).
- **0.2.3**: stigma unlock cost (F5); results of the owner's in-game checks (Hugo Mercenaries: Deep Shadow, Ascension
  openings, Zikel Defense Break node).
- **0.2.4**: story quest locations: the 41 story quests on the `zone:altgard-unplaced` placeholder, from Metabot.
- **0.2.5**: save safety (the "last backup" line and the iPhone home-screen hint above; mockup first).
- **0.2.6**: polish: a home for the Route rules card (F11), the remaining phone page-zoom issues, hit areas on the
  Confidence / Sources summaries.
- **0.2.7**: skills marked active / passive (F2; the data exists, display only).
- Between patches, no release: faster CI and `ci-ok`, then branch protection (owner); design tokens; 0.3 engine design
  and the prerequisite gates loaded into the data.

**Renumbered 2026-10-15:** Smart Next up was inserted as 0.4, so every later minor moved up by one (characters
0.4 → 0.5, sync 0.5 → 0.6, new players 0.6 → 0.7, classes 0.7–0.13 → 0.8–0.14). Scope also moved: location-aware
ranking, fastest / completionist, catch-up and the travel model (F1, F9, F10, F15) were "0.3 design" and are now 0.4;
0.3 kept its number and its correctness scope. Older decisions, reports, charters, specs, tests and code comments keep
the old numbers: read "0.3 design" for those items as 0.4, characters "0.4" as 0.5, sync "0.5" as 0.6.

### 0.3 — Next up correctness

Design and build steps: [docs/design/0.3-requirement-engine.md](docs/design/0.3-requirement-engine.md).

- One requirement evaluator for every card, with blocker chains ("unlocks after story X · N quests ahead").
- Completion derived from the story position (never stored as ticks).
- The prerequisite audit, every gate sourced or labelled: researched now as a report (proposed ids, a source per
  gate), loaded into the new format after 5b.
- Ascension progress bar in the Journey card (informational only).
- Daevanion card: the Nezekan board opens with "Urgent Pursuit" (Lv 13), from the story position, not at Lv 12
  (owner screens; 0.2.0 known issue).
- An invariant test over ~10,000 states: Next up never offers a blocked or already-done step.
- Deriving completion changes Next up for some saves on purpose: every golden-master difference is listed with its
  reason and approved by the owner as a product change.
- Specialties: all three slots recommended, opening at effective skill level 8, 12 and 20 (F3).

### 0.4 — Smart Next up

Decided 2026-10-15 (owner followed the CEO's recommendation): its own minor after 0.3, so the ranking is built on a
correct engine and each release stays testable. 0.3 makes Next up correct; 0.4 makes it smart.

- Location-aware "next best thing" (F15, Zygor-like): tie-break by distance from the last confirmed location; teleport
  vs run per the travel rules in DECISIONS (Kibelisk unlocks derived from ticks, "1 scroll", an "I'll walk" override,
  an optional "Prefer running" setting).
- Fastest (default) and completionist modes; Next up grouped by level band with the range shown (F10); the drawbacks of
  "fastest" shown.
- Catch-up: rank by what the player can do now (level, skill points, crystals), not guide order (F1).
- Filler XP ranking once the owner's XP-per-minute measurements exist (F9).

### 0.5 — Characters and class framework

- Several characters per browser (the existing save stays the first character, so older versions still read it; an
  additive, flagged migration for per-character quest steps; a rollback to 0.4 still reads character 1).
- Class picker (Assassin only visible until a second class is ready); class data loaded per character.

### 0.6 — Backup and sync

No accounts and no personal data: an anonymous, end-to-end encrypted **sync code**. Your progress is backed up and
follows you between phone and PC; the server only ever stores encrypted data it can't read. Offline-first (the browser
copy stays the working copy), merged per item so un-ticking survives, existing saves untouched. Accounts (email codes,
passkeys, Discord) stay possible later if a feature ever needs them.

### 0.7 — New and mid-level players

- First-run welcome; Lv 1–10 tuned so it isn't a wall of cards; terms explained where they first appear.
- Joining mid-level: set level and story quest, earlier content counted as done.

### 0.8 – 0.14 — one class per release

Gladiator, Templar, Ranger, Sorcerer, Spiritmaster, Cleric, Chanter (order: owner, D8). Each: a research pack
(report, sourced per field) written ahead, then two sources per claim, data and claims entries, a golden snapshot, an
in-game spot check. Recommended order rule: a class the owner or a tester will level to 45 first, then best data
coverage, then most shared with Assassin.

### 1.0

All eight classes on the requirement engine, Asmodian, Lv 1–45; a whole-app UX review and a docs pass.

### Any time (patches)

- Game patch watch: weekly after Global maintenance (Korean patch notes as early warning), report only; a PR only
  when a claim is affected. Re-verification driven by `verifiedAt` once 5b exists.
- Data corrections from issues.

## Unscheduled ideas

- **Colour sprint** (owner wants its own sprint): game-inspired palette, faction and class colours, quest-type and
  item-grade colours, parchment notes, Quest Complete style; research in docs/research/colors-2026-10. Not before the
  foundations through the class framework (0.2–0.5) are solid; current colours are placeholders until then. When it comes up, the CEO stops and
  goes through the research with the owner first; then the owner answers the open colour questions and does one
  in-game check session (batched with the data checks) using a one-screen checklist. Built on the design tokens.

- **iPhone app** (owner, 2026-10-15: "eventually"). Not scheduled; decide after sync (0.6). Likely path: the same web
  code wrapped as an app (e.g. Capacitor), so the phone layout and offline support carry over; no native rewrite.
  Questions to answer first: App Store review of an unofficial app using NCSoft's game name and icons (permission or
  a name / art rework, legal review), Apple developer account (~$99 / year), Metabot's non-commercial condition if the
  app is ever paid. The desktop app's iOS Simulator only matters once a native build exists.
- Lv 45: weekly/daily reset checklist (Ascension Trial entries, expedition cap) once the reset time is verified.
- Item level as an input (gates Krao Cave 200, Ascension Trial 1,000 / 1,500).
- Post-Altgard: Reshanta / Abyss.
- Preview deploys for pull requests (with the move to Cloudflare Pages).
- Release tooling (release-please / changesets) if other contributors join.
- Elyos (after 1.0).
