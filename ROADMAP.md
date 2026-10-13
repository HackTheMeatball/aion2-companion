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

## 0.1.x — upkeep and housekeeping (patches)

- **0.1.1** — CI upkeep (current Actions versions, runner pinned to Ubuntu 24.04 ahead of the 2026-10-19
  `ubuntu-latest` change), automatic tags and GitHub Releases, this roadmap.
- **0.1.2** — Ascension hotfix: story gates for "The One Who Dreams" and the Lv 45 Hero/Ascension step, with sources,
  so Next up stops offering them before the story opens them. Open question first: which story quest opens
  "The One Who Dreams" (story data ties it to "A Daeva Dreaming Anew"; inferred until a second source confirms).
- **0.1.3** — Version in the footer, linked to the changelog; "Report a problem" link to a GitHub issue form prefilled
  with level, story quest and version; issue labels (`bug`, `data`, `feature`, `ux`) and templates.
- **0.1.4** — Self-hosted fonts (removes the last third-party request); Wisdom Stone / Daevanion Crystal icon names
  confirmed in game (needs the user; docs/ISSUES.md).

## 0.2 — Next up correctness

The guide's core promise: it never points at something you can't do yet, and when something is locked it says what
unlocks it.

- One requirement model on every step: level, story quest, other quest, item level where verified.
- Full prerequisite audit of milestone steps, regional quests and unlocks against sources; gaps stay labelled.
- Blocked steps never shown as actionable; Next up shows the blocker chain ("unlocks after story X · N quests ahead").
- Ascension progress bar in the Journey card, under the level slider. **Informational only**: stages done / total, the
  current stage, what the next one unlocks and what gates it. No new inputs; derived from existing ticks and story.
- Acceptance: a test that walks Lv 1→45 across many save states and asserts Next up never ranks a blocked step first.

## Later themes (order to be decided)

- **New player experience (fresh character, Lv 1)**: first-run welcome (what the guide does, Basic vs Advanced, ticking
  and Level up), Lv 1–10 tuned so it isn't a wall of cards, terms explained where they first appear.
- **Class framework (Assassin unchanged)**: class-specific data (skills, stigmas, Daevanion boards, rotation, stat
  priority) split from shared data (story, zones, quests, strongholds, dungeons); class picker; additive, flagged state
  migration (key stays `aion2-assassin-route-v4`). Acceptance: Assassin saves load unchanged and render identically.
- **Classes, one per release**: two sources per claim, data + claims entries, class tests, a real character if possible.
- **Game patch tracking**: "data verified as of game patch X" in the app, and a re-verification pass after major patches.

## Unscheduled ideas

- Onboarding for players joining mid-level: set level + story quest, mark earlier content done, review.
- Lv 45: weekly/daily reset checklist (Ascension Trial entries, expedition cap) once the reset time is verified.
- Item level as an input (gates Krao Cave 200, Ascension Trial 1,000 / 1,500).
- Post-Altgard: Reshanta / Abyss.
- Release tooling (release-please / changesets) once there are other contributors.
- Elyos (after 1.0).
