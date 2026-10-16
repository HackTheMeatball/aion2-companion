# Roadmap

**1.0.0 = all eight classes, Asmodian only, Lv 1–45.** Every class meets the bar the Assassin guide sets today:
verified data only (see CLAUDE.md), Next up always correct, saved progress never broken. Elyos is after 1.0.

Classes (per [Metabot](https://metabot.gg/en/aion-2/classes)): Gladiator, Templar, Assassin, Ranger, Sorcerer,
Spiritmaster, Cleric, Chanter.

**Direction (owner, 2026-10-16):** Daeva Companion is an engine that AION 2 happens to be the first game for. The engine
knows no game; AION 2 is a game pack, each class a content pack, each feature a module. Modules are what make parallel
work real: two items run at the same time only when they touch different modules. The audit behind this plan, with
evidence: [Daeva Companion: audit and plan to 1.0](https://claude.ai/code/artifact/37732d7b-6100-47ba-b191-fb3fe9d69f96)
(repo copy for sessions that can't open it: [docs/audits/2026-10-16-audit-and-plan-to-1.0.md](docs/audits/2026-10-16-audit-and-plan-to-1.0.md)).

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

Goal: the engine holds no AION 2 term, the Assassin guide shows the same in the golden master, and a second game
could be added as a pack. One clean save break (CLAUDE.md pre-1.0 rule), so the save is shaped for several characters
once and no migration is carried.

Planning pass written 2026-10-16 (#135): look back in [docs/reviews/0.3-lookback.md](docs/reviews/0.3-lookback.md),
one spec per item in [docs/plans/0.4/](docs/plans/0.4/) (the issue body the planner creates, verbatim), audit evidence
in [docs/audits/2026-10-16-audit-and-plan-to-1.0.md](docs/audits/2026-10-16-audit-and-plan-to-1.0.md) (the repo copy
of the audit, PR #137).

**Process rule from the look back (0.4 on):** an issue's *Acceptance* list is the review checklist. The reviewer
answers every line with pass / fail and its evidence; one missing line is `VERDICT: CHANGES`.

#### Audit (step 2), against `main` at `acf4c8e`

Stale, cut-able or in the wrong order in the plan as #134 drew it:

1. **P2's named gates are stale.** "Lest We Forget" and the Daevanion gate are data since E5 (#78). What is still
   AION 2 in `src/core/requirements.js` is the five `KEPT_RULES` (lines 19–29) and the record ids in the
   `GATE_CHANGES` switches (71–80, 107, 116). The other hard-coded spots moved a little: `catalog.js:52-57` (two
   milestones), `build.js:15,17,44,45` (costs, slot levels, node minimum). The values themselves are already data
   (`rule:skill-point-cost`, `rule:stigma-shard-cost`, `rule:specialty-slots`, `rule:node-costs`); only the code copies
   are left. The one-player seed in `migrations.js:30` goes with the save break (P3c), not P2.
2. **P2 has an unknown.** Nothing says where pack *code* lives (AION 2 card templates, Next up producers, the kept rules
   can't be data) or how the engine calls it. That's a design question, so it becomes **P0**, a docs item, first.
3. **P2 is over 1,000 lines as one item.** About half of `src/core/` names AION 2 (requirements 106 of 442 lines,
   nextup 59 of 158, catalog 37 of 118). Split: P2a (code copies of data rules), P2b (pack code out of the core),
   P2c (Next up producers).
4. **P3 is over 1,000 lines as one item.** The v4 key is written in 43 files, 32 of them under `tests/`. The `e1`, `mig1`, `mig2`,
   `regress` and `journey` fixtures are v4-shaped saves. Split: P3a (tests write saves through one helper), P3b
   (storage adapter, no save change), P3c (save v5).
5. **P3 misses one case:** a pre-0.4 *export file* has the v4 shape. Import must refuse it with a message, never read it.
6. **"`src/main.js` holds no AION 2 term" doesn't need twelve card PRs.** The AION 2 cards (Skills, Stigmas, Daevanion,
   Cube, areas, rotation) are the game pack's own cards: P4 moves them into the pack unchanged. Only the engine's cards
   (Next up, milestones and Route rules, Journey, Sources and Confidence) are made neutral, so **P5 shrinks to four
   items**. A pack card is rewritten when a later feature touches it, not as a batch now.
7. **P7's per-pack loading is in the wrong minor.** With one class there's nothing to leave out. It moves to 0.6 lane B,
   before the Gladiator pack lands. The blocking budgets stay in 0.4.
8. **The done check needs an owner:** **P8** adds the term scan that proves "no AION 2 term" (P6 proves the fake game).
9. **"Byte-identical golden" can't hold through P3c.** The snapshots record the stored save, and its shape changes
   once, on purpose. What must not change, in every 0.4 item, is Next up, milestones, Journey and the Dungeons card.
10. **The kickoff lanes have no `core` lane.** Two `src/core/` items would start together, so each item below names the
    files it owns (review note 1 on #134).
11. **No input for the player name exists.** The save label is `<playername>-<class>-lvl<level>` (owner); until 0.5 lane
    C adds the name, the label leaves the name part out.

**Budget trend** (`npm run build`; elements at 390 px in a fresh browser; `tests/perf.js`, 45 states):

| | 0.2.0 | 0.2.3 | 0.2.5 | 0.2.6 / 0.3.0 | Limit | Use |
|---|---|---|---|---|---|---|
| `dist/index.html` | 498,891 B | 507,536 B | 665,735 B | 669,290 B (153,871 gz) | none yet (P7) | — |
| Page elements | — | 4,658 | — | 4,741 | none yet (P7) | — |
| `update()` median / worst | — | — | — | 6.8 / 8.5 ms | 15 ms, advisory | 57% |
| Inlined fonts (artifact) | — | — | — | 126.2 KB | 150 KB, blocking | **84%** |

The fonts are the only budget within 20% of a limit. They don't grow with packs or features, and no 0.4 item adds a
font, so there's no performance item. A new font needs the cap raised in the same PR, with a reason. `update()` time is
at 57% of its limit. The page grew 34% in 0.2 (0.2.4 villages and 0.2.5); P7 sets the first byte and element limits.

#### Items (step 3)

Appetite counts hand-written changed lines: a verbatim move counts once, deleted files and regenerated
fixtures or snapshots don't count. Models follow the routing rule in #114. The full spec of each item, with its
acceptance tests, is its plan file.

| Item | Problem → result | Size | Owns (files) | Model | Lanes |
|---|---|---|---|---|---|
| [P0](docs/plans/0.4/P0-engine-contract.md) | No written contract for packs → design doc: code layout, pack hooks, card registry interface, AION 2 term list | M (docs) | `docs/design/0.4-engine-contract.md` | Opus | none |
| [P1](docs/plans/0.4/P1-pack-folders.md) | Data has no pack boundaries → `data/packs/…` with manifests; the generator builds a pack chain; compiled output byte-identical | M | `data/**` (moves), `data/schema/pack.schema.json`, `tools/gen/`, `tests/schema.mjs`, `tests/support/oracle.mjs` paths | Opus | gen, gates |
| [P2a](docs/plans/0.4/P2a-rules-from-data.md) | Code copies of data rules → costs and slot levels read from `rule:*`; two milestones into the guide data | S–M | `src/data/build.js`, `src/core/catalog.js`, the pack's `guide/milestones.json`, `tools/gen/` | Opus | gen, gates |
| [P2b](docs/plans/0.4/P2b-pack-code.md) | AION 2 code inside the engine → moved to `src/packs/aion2/` behind P0's hooks | L | `src/core/{catalog,requirements,ascension,blockers}.js`, `src/data/*.js`, `src/packs/aion2/**`, `src/main.js` imports, `tests/core/` | Opus | main.js |
| [P2c](docs/plans/0.4/P2c-nextup-producers.md) | Next up ranks AION 2 kinds in the engine → engine ranks, pack produces cards | M | `src/core/nextup.js`, `src/packs/aion2/nextup.js`, `tests/core/nextup*` | Opus | none |
| [P3a](docs/plans/0.4/P3a-test-save-helper.md) | Save key and v4 shape spread over 30 test files → one helper writes and reads every test save | M | `tests/**` except snapshots | Opus | golden, mig |
| [P3b](docs/plans/0.4/P3b-storage-adapter.md) | `localStorage` called from the page → storage adapter; same key, same bytes | S–M | `src/core/storage.js`, `src/shell/storage-web.js`, `src/main.js` save area, `src/site.js` | Opus | main.js |
| [P3c](docs/plans/0.4/P3c-save-v5.md) | Save shaped for one Assassin → save v5: neutral key, character slots, clean break | L | `src/core/{state,migrations,sync,backup}.js`, `src/data/migrations.js` (deleted), `src/main.js` save area, save tests, golden snapshots, `PRIVACY.md`, `docs/ARCHITECTURE.md` §1 | Opus | main.js, mig, golden |
| [P4a](docs/plans/0.4/P4a-card-registry.md) | Every card hard-wired in the page script → registry; first two cards mounted through it | M | `src/core/cards.js`, `src/main.js`, `src/index.html`, `src/cards/` | Opus | main.js |
| [P4b](docs/plans/0.4/P4b-pack-cards.md) | AION 2 cards in the page script → moved verbatim to `src/packs/aion2/cards/` | L | `src/main.js`, `src/index.html`, `src/packs/aion2/cards/**` | Opus | main.js |
| [P4c](docs/plans/0.4/P4c-engine-cards.md) | Engine cards in the page script → moved verbatim to `src/cards/`; `main.js` is the shell | L | `src/main.js`, `src/index.html`, `src/cards/**` | Opus | main.js |
| [P5a](docs/plans/0.4/P5a-nextup-card.md) | Next up card neutral | M | `src/cards/nextup.js`, pack renderers | Opus | none |
| [P5b](docs/plans/0.4/P5b-milestone-cards.md) | Milestone and Route rules cards neutral | M | `src/cards/milestones.js`, `src/cards/route.js`, pack row renderers | Opus | none |
| [P5c](docs/plans/0.4/P5c-journey-card.md) | Journey card neutral (Ascension bar becomes a pack section) | M | `src/cards/journey.js`, `src/packs/aion2/cards/ascension.js` | Opus | none |
| [P5d](docs/plans/0.4/P5d-sources-cards.md) | Sources and Confidence cards neutral | S | `src/cards/sources.js` | Sonnet | none |
| [P6](docs/plans/0.4/P6-fake-pack.md) | Nothing proves the engine is game-neutral → a fake game pack + conformance suite in Node | M | `tests/fixtures/packs/fakegame/`, `tests/conformance.mjs`, `tests/run.mjs` | Opus | none |
| [P7](docs/plans/0.4/P7-budgets.md) | Nothing stops the page growing → blocking byte and element budgets | S | `scripts/build.mjs`, `tests/site.js` | Sonnet | none |
| [P8](docs/plans/0.4/P8-done-check.md) | "No AION 2 term" is a claim, not a test → term scan over engine, engine cards and shell | S | `tests/core/purity.test.mjs` | Sonnet | none |
| [S0](docs/plans/0.4/S0-sync-design.md) | Sync needs a design and an owner hosting decision before 0.6 → design doc (old Y0) | M (docs) | `docs/design/sync.md` | Opus | none |
| [R](docs/plans/0.4/R-release-0.4.0.md) | Release 0.4.0 (CHANGELOG: saves reset) | S | `package.json`, `package-lock.json`, `CHANGELOG.md` | Sonnet | release, alone |

No-gos for the whole minor: no visible change except the save reset (no new UI, no new text on screen, no restyle);
no new game data; no `.github/workflows/` edits (bots can't push them); no change to the artifact rules (one file,
`/_blob/` icons, no service worker).

#### Lane map (step 4)

At most three builds at a time. Kickoff checks lanes, not order, so **the planner queues an item only once everything
in its "After" has merged**.

| Wave | Builds | After |
|---|---|---|
| 1 | P1 (gen, gates) ∥ P3a (golden, mig) ∥ P3b (main.js) | — |
| 2 | P0 (none) ∥ P2a (gen, gates) ∥ P7 (none) | P2a: P1 |
| 3 | P3c (main.js, mig, golden) ∥ S0 (none) | P3c: P1, P3a, P3b |
| 4 | P2b (main.js) | P0, P2a, P3c |
| 5 | P2c (none) ∥ P4a (main.js) | P2b |
| 6 | P6 (none) ∥ P4b (main.js) | P6: P2c, P3c · P4b: P4a |
| 7 | P4c (main.js) | P4b |
| 8 | P5a ∥ P5b ∥ P5c, then P5d | P4c; P5a also P2c |
| 9 | P8 (none) | P5a–P5d, P6 |
| 10 | R, alone | everything above |

How the review notes on #134 are settled:

1. **P2 and P3 both touch `src/core/`:** split by file. P3b and P3c own `state.js`, `migrations.js`, `sync.js`,
   `backup.js`, the new `storage.js` and the save area of `main.js`; P2a owns `catalog.js` and `src/data/build.js`. The
   two P2 items that move core code (P2b, P2c) run after P3c, in sequence.
2. **P4 owns `src/main.js` until the registry and the moves merge** (P4a → P4b → P4c, one at a time). The P5 card
   items wait for P4c; after it, each card is its own file, so three run at once.
3. **Gladiator follows the P1 pack layout:** see 0.6 lane B.
4. **The audit copy** is `docs/audits/2026-10-16-audit-and-plan-to-1.0.md` (PR #137), linked above and in Direction.
5. **The player name never reaches a server unencrypted.** No-go on P3c: no name or label in a storage key, file name,
   URL, the *Report a problem* link or a log, and the slot id is random, never derived from the name. Requirement on S0:
   the name and label travel only inside the encrypted payload; the server sees opaque ids, sizes and times.

Done when: golden shows no change in Next up, milestones, Journey or the Dungeons card for the Assassin (the stored save
changes once, in P3c); P6's fake game passes conformance; P8's term scan finds no AION 2 term in `src/core/`,
`src/cards/` or `src/main.js`.

#### Owner input (step 5)

Nothing in 0.4 needs an in-game check, a mockup, money or a legal answer, so **no To-do**. For the owner's
information (the recommendation applies unless the owner says otherwise):

- **Your own progress resets at 0.4.0** (decision #2). Export a backup before 0.4.0 if you want a record; 0.4 can't
  import it (P3c refuses old files rather than reading them).
- **Storage key `companion-save-v5`**: neutral, no game or class name.
- **The save label shows no player name until 0.5** (the name field comes with the character switcher).
- **S0 ends in a hosting and cost decision** for the owner; that decision blocks 0.6 lane C, not 0.4.

Alongside 0.4 (docs only, no code, any time): **class research packs** for all seven classes, two at a time, in cloud
research sessions under the fetching rules (old R1). They need the web, so they are not bot items in the #114 queue; the
coordinator starts them. **Sync design** is S0 above.

### 0.5 — Smart Next up and the phone layout

| Lane | What | Module |
|---|---|---|
| A | Smart Next up (old 0.4 N1–N5): travel data, location tie-break, derived Kibelisk binds, fastest / completionist with level bands, travel UI, catch-up ranking | ranking module, Next up card |
| B | Phone layout (audit #81 / PR #87 mockup): Next up near the top, a touch-friendly stack, Build as a bottom sheet | shell layout, styles |
| C | Character switcher and class picker (old 0.5 C2), Assassin the only visible class; the player-name field that completes the save label (0.4 P3c) | header, character module |

Lane A's travel UI and lane B both touch the Next up card's layout: B lands first, A's UI step builds on it.

### 0.6 — New players and the first new class

| Lane | What | Module |
|---|---|---|
| A | First-run welcome, Lv 1–10 tuning, terms explained, join mid-level (old 0.7 P1–P3) | onboarding module, guide text |
| B | Gladiator pack (D8 default; owner can change), from its research pack: data, guide build, icons, golden snapshot, in-game spot check. It follows the 0.4 P1 pack layout: class data in `data/packs/aion2/classes/gladiator/`, its Asmodian guide in `data/packs/aion2/asmodian/gladiator/`, each with a manifest. First step: per-pack loading (moved from 0.4 P7), so the page carries only the chosen class; then the guide text both classes share is split out of the Assassin pack | its two pack folders only, after the loading step |
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
