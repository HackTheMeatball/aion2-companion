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

A whole-app UX review every 2–3 minor releases catches drift as features pile up.

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
- Save safety (visible, design pass first): a "last backup N days ago" line with an export nudge, and an "Add to Home
  Screen" hint on iPhone (home-screen apps keep their data much longer).

Phone layout (Next up near the top, a swipeable stack, Build as a bottom sheet) needs a design pass and touches code
that 0.2 restructures, so it follows 0.2 step 4.

### 0.2 — Foundations (no visible change)

Acceptance for every step: the golden-master suite (Next up and milestone output for 2,000 generated saves) is
identical, all suites green, saves untouched.

1. Golden-master harness (tests only).
2. Toolchain: ES modules + esbuild, still one static HTML file for both builds.
3. Data out of code: hand-written data constants move to data modules; the generated block is built, not committed.
4. Pure core: state, migrations, requirements and Next-up ranking as DOM-free modules with fast Node tests.
5. Data format v2: stable ids (not display names), shared vs per-class folders, a sources registry with license per
   source, `verifiedAt` per record, `requires` / `completesWith` on every step, JSON Schema validation, Node generator,
   a fast CI job (< 2 min). The schema gets an independent review, then the owner's, before it is built. A
   `schemaVersion` field and a pure, tested `merge()` for two saves (groundwork for 0.5) are part of this step.

Steps 1–3 shipped 2026-10-13 with no visible change (golden harness, toolchain, data out of code).

### 0.3 — Next up correctness

- One requirement evaluator for every card, with blocker chains ("unlocks after story X · N quests ahead").
- Completion derived from the story position (never stored as ticks).
- The prerequisite audit, written straight into the new format, every gate sourced or labelled.
- Ascension progress bar in the Journey card (informational only).
- An invariant test over ~10,000 states: Next up never offers a blocked or already-done step.

### 0.4 — Characters and class framework

- Several characters per browser (the existing save stays the first character, so older versions still read it).
- Class picker (Assassin only visible until a second class is ready); class data loaded per character.

### 0.5 — Backup and sync

No accounts and no personal data: an anonymous, end-to-end encrypted **sync code**. Your progress is backed up and
follows you between phone and PC; the server only ever stores encrypted data it can't read. Offline-first (the browser
copy stays the working copy), merged per item so un-ticking survives, existing saves untouched. Accounts (email codes,
passkeys, Discord) stay possible later if a feature ever needs them.

### 0.6 — New and mid-level players

- First-run welcome; Lv 1–10 tuned so it isn't a wall of cards; terms explained where they first appear.
- Joining mid-level: set level and story quest, earlier content counted as done.

### 0.7 – 0.13 — one class per release

Gladiator, Templar, Ranger, Sorcerer, Spiritmaster, Cleric, Chanter (order: owner). Each: two sources per claim, data and
claims entries, a golden snapshot, an in-game spot check.

### 1.0

All eight classes on the requirement engine, Asmodian, Lv 1–45; a whole-app UX review and a docs pass.

### Any time (patches)

- Game patch re-verification, driven by `verifiedAt`.
- Data corrections from issues.

## Unscheduled ideas

- **Colour sprint** (owner wants its own sprint): game-inspired palette, faction and class colours, quest-type and
  item-grade colours, parchment notes, Quest Complete style; research in docs/research/colors-2026-10. One in-game check
  session first.

- Lv 45: weekly/daily reset checklist (Ascension Trial entries, expedition cap) once the reset time is verified.
- Item level as an input (gates Krao Cave 200, Ascension Trial 1,000 / 1,500).
- Post-Altgard: Reshanta / Abyss.
- Preview deploys for pull requests (with the move to Cloudflare Pages).
- Phone layout pass (see 0.1.x note).
- Release tooling (release-please / changesets) if other contributors join.
- Elyos (after 1.0).
