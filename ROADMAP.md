# Roadmap

**1.0.0 = all eight classes, Asmodian only, Lv 1–45.** Every class meets the bar the Assassin guide sets today:
verified data only (see CLAUDE.md), Next up always correct, saved progress never broken. Elyos is after 1.0.

Classes (per [Metabot](https://metabot.gg/en/aion-2/classes)): Gladiator, Templar, Assassin, Ranger, Sorcerer,
Spiritmaster, Cleric, Chanter.

**Direction (owner, 2026-10-16):** Daeva Companion is an engine that AION 2 happens to be the first game for. The engine
knows no game; AION 2 is a game pack, each class a content pack, each feature a module. Modules are what make parallel
work real: two items run at the same time only when they touch different modules. The audit behind this plan, with
evidence: [Daeva Companion: audit and plan to 1.0](https://claude.ai/code/artifact/37732d7b-6100-47ba-b191-fb3fe9d69f96).

## Versioning

[Semantic versioning](https://semver.org/); 0.x is beta. Each part is its own counter (0.9 → 0.10 → 0.11), so there is
no running out before 1.0: 1.0 ships when its scope is done.

- **Minor (0.X.0)**: a theme, i.e. one or more related objectives. New ideas join a theme that fits before they start a
  new one.
- **Patch (0.X.Y)**: fixes, data corrections, small polish and upkeep. No new features.
- **Releasing**: bump `version` in `package.json` and add a `## X.Y.Z` section to CHANGELOG.md in the same commit. After
  tests and the deploy pass on `main`, CI tags `vX.Y.Z` and publishes the GitHub Release with that section as its notes.
  CI fails early if the version has no CHANGELOG section.

## How a minor is planned (every 0.X.0)

Every minor opens with a planning and audit pass. Nothing in the minor is queued in #114 until the pass is written down
and reviewed. Patches (0.X.Y) skip it.

1. **Look back.** One page on the minor just shipped: items shipped, failed or redone bot runs (with causes), fixes
   needed after release, what was slow. One process rule changes if a cause repeated.
2. **Audit.** Re-read this roadmap against the code: is anything here stale, cut-able or now in the wrong order? Read
   the budget trend (page size, element count, `update()` time); schedule a performance item only when a budget is
   within 20% of its limit. Before 1.0 and before any store app, this step is a full architecture and performance audit.
3. **Shape each item:** problem; appetite (S < 100 changed lines, M 100–300, L 300–1,000; bigger = split it); no-gos
   (what it will not do); the module(s) it touches; the test that proves it done; builder model (routing rule in #114).
   An item with an unknown is a research item first, not a build.
4. **Lane map.** Items in the same module run one after another; items in different modules may run at the same time,
   at most three builds. Shared files (until the engine split, `docs/team/DISPATCH.md` "Serial files") count as one
   module.
5. **Owner input.** List what needs the owner (in-game checks, mockups, money, legal). Only a true blocker becomes a
   tracker To-do; everything else follows the recommendation.
6. **Write and review.** The plan goes into this file and the #114 queue in one PR, written by one session and
   reviewed by a separate one that didn't write it. Then the planner queues the items, top of the lane map first.

## How an objective is worked

1. **Problem**: what's wrong or missing, in a sentence or two.
2. **Acceptance**: how we know it's done, as a test where possible.
3. **UX pass**: what the user sees and does, sketched and reviewed *before* building. Visual polish comes after the
   feature works. New UI reuses the existing card patterns (uniform milestone / Next up / Skills / Stigmas cards).
4. **Build → test → release.**
5. **Play with it** in game; what you notice feeds the next objective.

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
- **0.2.1** — a fresh browser starts at Lv 1 on the first story quest instead of Lv 5 with no quest.
- **0.2.2** — Daevanion up arrow starts at 1, rotation pop-out lists only unlocked skills, missing skill icons.
- **0.2.3** — story-quest zones for 34 more quest sides (Metabot), stigma unlock cost check.
- **0.2.4** — Active / Passive skill labels, specialty slots, villages as zones, clearer lock text (most of the 0.3
  engine steps went live here).
- **0.2.5** — backup line, 14-day backup reminder, iPhone home-screen tip.
- **0.2.6** — phone layout fixes, Route rules card moved, one gate evaluation per update.
- **0.3.0** — Next up correctness: one requirement check per card, completion derived from the story, blocker
  chains, the story's last quest (Lv 45).

## Plan (redrawn 2026-10-16)

Redrawn after the engine audit, with the owner's go-ahead to re-plan the path to 1.0. Before: eleven minors after 0.3
(0.4–0.14), one class per release, the class framework late. After: six minors (0.4–0.9), the engine split first, then
three lanes per minor. The minor numbers below replace the ones in older decisions, reports, specs and DISPATCH; read an
old "0.4 Smart Next up" as 0.5 here, an old "0.5 characters" as 0.4 (save shape) plus 0.6 (picker).

**Decided (owner, 2026-10-16, 4:30 PM ET):** the Engine split comes right after 0.3.0. Engine code carries no AION 2 or
Assassin reference; all game data lives outside the engine, in packs. 0.3.0 ships first and nothing here competes with
it (owner, 4:34 PM ET); 0.3.0 went live 2026-10-16, 5:11 PM ET.

**Risk, called out:** two classes per minor assumes a tester (the owner or another player) can do each class's in-game
spot check. If only one class can be checked per minor, 0.7–0.9 become one class each and 1.0 moves out by three
minors. Research packs for every class start early (below) so data is never the bottleneck.

### 0.3.x — patches while 0.4 is planned (0.3.0 released 2026-10-16)

- Bug #105: `fitRail()` race at load (Basic rail width differs between loads).
- Data corrections from issues; owner checks as they arrive (C41 Koro at Lv 45; the Home Screen storage check).

### 0.4 — Engine and packs (invisible)

Goal: the engine holds no AION 2 term, the Assassin guide is byte-identical in the golden master, and a second game
could be added as a pack. One clean save break (CLAUDE.md pre-1.0 rule), so the save is shaped for several characters
once and no migration is carried.

| Step | What | Module / files | After | Size |
|---|---|---|---|---|
| P1 | Pack folders with a manifest: engine, `aion2` game pack, `aion2/asmodian/assassin` content pack; the generator builds per pack (old 0.5 F1, F2) | `data/**` layout, `tools/gen/`, `data/schema/` | — | L |
| P2 | AION 2 rules out of code into the game pack: cost formulas, specialty slot levels, named gates (`KEPT_RULES`), the two milestones written in `catalog.js`, map links (old 0.5 F3) | `src/core/`, `src/data/`, game pack data | P1 | L |
| P3 | Storage adapter + save v5: a neutral storage key (no game or class name), one save slot per character with a stable internal id as its key; the slot's display label is generated from its data as `<playername>-<class>-lvl<currentlevel>` (owner, 2026-10-16), so a level-up renames the label, never the key; class per character; old `-v4` saves ignored, never read, and the break noted in CHANGELOG (old 0.5 C1, F4) | `src/core/state.js`, `sync.js`, `migrations.js`, mig tests | P1 | L |
| P4 | Card registry: one entry point per card, the page script only mounts cards | `src/main.js` shell, `src/index.html` | P2 | M |
| P5 | One module per card (Next up, Journey, milestones, Skills, Stigmas, Daevanion, regional, areas, sources, …): three at a time, one card per PR | each card's module | P4 | L total |
| P6 | Fake test game pack (about 20 lines of data) + a conformance suite every pack passes (old 0.5 F5) | `tests/` | P2 | M |
| P7 | Budgets that block CI: page bytes and element count (stable numbers); timing stays advisory. Per-pack loading so one class's page doesn't carry eight (old 0.5 F6) | `scripts/build.mjs`, CI | P1 | M |

Lanes: P1 alone → P2 ∥ P3 ∥ P7 → P4 ∥ P6 → P5 (three cards at a time). Done when the golden master is identical for the
Assassin, the fake game passes conformance, and `src/main.js` holds no AION 2 term.

Alongside 0.4 (docs only, no code, any time): **class research packs** for all seven classes, two at a time, in cloud
research sessions under the fetching rules (old R1). **Sync design** (old Y0), so the owner's hosting and money decision
is ready before it's needed.

### 0.5 — Smart Next up and the phone layout

| Lane | What | Module |
|---|---|---|
| A | Smart Next up (old 0.4 N1–N5): travel data, location tie-break, derived Kibelisk binds, fastest / completionist with level bands, travel UI, catch-up ranking | ranking module, Next up card |
| B | Phone layout (audit #81 / PR #87 mockup): Next up near the top, a touch-friendly stack, Build as a bottom sheet | shell layout, styles |
| C | Character switcher and class picker (old 0.5 C2), Assassin the only visible class | header, character module |

Lane A's travel UI and lane B both touch the Next up card's layout: B lands first, A's UI step builds on it.

### 0.6 — New players and the first new class

| Lane | What | Module |
|---|---|---|
| A | First-run welcome, Lv 1–10 tuning, terms explained, join mid-level (old 0.7 P1–P3) | onboarding module, guide text |
| B | Gladiator pack (D8 default; owner can change), from its research pack: data, guide build, icons, golden snapshot, in-game spot check | `data/classes/gladiator/` only |
| C | Sync client on `merge()` (old 0.6 Y1), if the owner approved the sync design and hosting | sync module |

### 0.7, 0.8, 0.9 — two classes each

Each minor: two class packs side by side (lanes A and B; order by the D8 rule: a class someone will level to 45, then
data coverage, then overlap with Assassin), plus one other module in lane C: sync server and UI (old Y2, Y3) in 0.7, the
1.0 audit's fixes in 0.8–0.9 as found.

### 1.0

Full architecture, performance and UX audit (the planning pass in its full form), docs pass, all eight classes on the
engine, Asmodian, Lv 1–45. The strict save rule returns (CLAUDE.md).

### 1.1 — End-game tracker (owner, 2026-10-16)

A new module for max-level play: daily and weekly checklists with their resets, world boss timers. Built on the engine
with no page-script edits. Scope, reset times and boss schedules need verified data first; that research can run any
time before. From 1.0 saves are strict, so its saved data is additive.

### Any time (patches)

- Game patch watch: weekly after Global maintenance (Korean patch notes as early warning), report only; a PR only
  when a claim is affected. Re-verification driven by `verifiedAt`.
- Data corrections from issues.

## Moved out of the path to 1.0

Kept as ideas; each comes back through a planning pass when its time comes.

- **Filler XP ranking** (old 0.4 N6): needs the owner's XP-per-minute measurements; after 1.0 unless they arrive early.
- **Whole-app UX review every second minor**: replaced by the planning pass (step 2) and the full audit at 1.0.
- **Colour sprint** (owner wants its own sprint): CSS-only on the design tokens, so it can run as a lane in any minor
  after 0.5 once the owner has time for the research walk-through and one in-game check session; research in
  docs/research/colors-2026-10.
- **Store app (iPhone / Android)** (owner, 2026-10-15: "eventually"): after sync and 1.0. Likely the same web code
  wrapped (e.g. Capacitor) on the storage adapter from 0.4. Questions first: App Store review of an unofficial app
  using NCSoft's game name and icons, Apple developer account (~$99 / year), Metabot's non-commercial condition if the
  app is ever paid.
- **Lv 45 weekly/daily reset checklist**: folded into 1.1.
- **Item level as an input** (gates Krao Cave 200, Ascension Trial 1,000 / 1,500), **post-Altgard (Reshanta / Abyss)**,
  **Elyos** (a faction pack after 1.0).
- **Preview deploys** with a move to Cloudflare Pages; **release tooling** (release-please / changesets) if other
  contributors join.
