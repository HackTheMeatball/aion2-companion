# Dispatch plan: model routing and parallel waves (0.2.x → 0.8)

> **Superseded after 0.3 (2026-10-16):** the step tables and waves for 0.4 and later are replaced by the redrawn
> ROADMAP ("Plan", engine release first, lanes by module) and each minor's planning pass. The routing rule, limits and
> CEO checklist below still apply; the live routing rule is in #114.

Written 2026-10-16 for the CEO (owner request, #84). Every upcoming step, planned ahead: which model builds it, which
reviews it, what it waits for, what it collides with, and which steps can run at the same time. Update it when a step
merges, a design changes the step list (0.4 design #79, 0.5 framework), or the owner moves something. HANDOFF "Now and
next" stays the short live view; this file is the full plan.

Inputs: ROADMAP.md; docs/design/0.3-requirement-engine.md §15 / §16; HANDOFF (serial-only files, routing rule);
DECISIONS 2026-10-14 / 15; docs/research/2026-10-next-class.md (PR #82, branch `research/next-class`, §4.2 F1–F6 and
G1–G4); `.github/workflows/claude.yml` and `ci.yml`.

**Assumptions, called out:**

- Steps after 0.3 have no design yet. 0.4 rows follow ROADMAP 0.4 and design §14 and get replaced by the 0.4 design's
  step list when #79 merges. 0.6 and 0.7 rows are placeholders until their designs exist.
- Issue numbers for E6, E7 and E8 were not readable from this run (GitHub issue listing isn't allowed here). They are
  marked "running"; the CEO fills in the numbers.
- The GitHub plan is assumed to be Free (20 concurrent jobs on GitHub-hosted runners). On Pro (40) the Actions limit
  stops mattering and the serial files are the only limit.
- ROADMAP (0.2.6 section) says the phone layout is built after the 0.3 engine, on the design tokens; HANDOFF orders it
  after 0.5. This plan follows HANDOFF (W9) because it rewrites every card render; the owner can move it earlier.
- Added to the routing rule, conservatively: `tools/gen/**` and `data/schema/**` (the data format) count as Opus work.
  The owner's rule doesn't name them; "when in doubt, Opus" covers it.

## Routing rule (applied to every row)

From HANDOFF and the Sonnet guard in claude.yml:

- **Opus (`@claude`)**: `src/core/**`; save, sync, migration or storage code; a gate's `requires` / `completesWith`;
  `tests/golden` re-records or the mig1 pin; more than about 300 changed lines; plus the generator and schemas (see
  assumptions).
- **Sonnet (`@sonnet`)**: reviews, docs, research reports, small data fixes, small render or CSS changes under 300 lines
  that touch none of the above. If a Sonnet build turns out to need any of those, the guard stops it ("Needs @claude
  (Opus)"). Then the CEO re-posts the trigger as `@claude`.
- **Haiku**: has no trigger in claude.yml, so it can't be dispatched on GitHub. It fits only inside a cloud session, as a
  sub-agent for mechanical work: link checks, label lists, filling templates, icon provenance rows. No row below depends
  on it.
- **Reviewer**: always a separate run from the builder. Opus build → `@sonnet` review; **plus an `@claude` review**
  where risk is high (engine, saves, gates, golden re-record, migrations, sync/crypto). Sonnet build → `@sonnet` review
  in a new run, or `@claude` if the data states a gate or the review finds something structural. Reviewers don't run
  journey or the full `npm test`; the CEO checks `ci-ok` and verifies findings itself.

## Legend

- **Size**: S < 100 changed lines · M 100–300 · L 300–1,000 · XL > 1,000 or several PRs.
- **Group**: the wave the step runs in (see Wave plan). Steps in the same wave run at the same time; steps in later
  waves wait for what "Depends on" names.
- **Serial files** (never two open branches editing them at once, unless the row says how they split):
  `src/main.js` render areas (by card), `src/main.js` save/storage area, `tests/golden/snapshots`, `data/**` gate fields
  (`requires` / `completesWith` / `is`), `tools/gen/`, `src/styles/app.css`, `.github/workflows/ci.yml`, `tests/a11y.js`,
  `package.json` + `CHANGELOG.md` (releases). Each has a lane name for the #114 queue (`lanes:` on a `- [next]` line,
  kickoff.yml): `main.js`, `golden`, `mig` (mig1 pin / `tests/e2-migtest.js`), `gates`, `gen`, `app.css`, `ci`, `a11y`,
  `release`; `lanes:none` for an item that touches none.
- Builder "O" = `@claude` (Opus), "S" = `@sonnet` (Sonnet). Reviewer "S" / "O" the same; "S+O" = both.

## Step table

### Running now (wave 0)

| Step | Issue / PR | Touches | Builder (why) | Reviewer | Depends on | Conflicts with | Group | Owner input | Size |
|---|---|---|---|---|---|---|---|---|---|
| E6 blocker-chain text | #74 (running) | `src/main.js` Later cards, milestone chips, regional rows, Daevanion "opens …"; core chain formatting; invariant 5 | O: engine output + likely golden | S+O | E5 (#78) | E7 / E8 in `main.js`; golden | W0 | none: the standing approval covers merging; the owner sees the before/after screenshots in the final 0.3 review | L |
| E7 specialty slots (F3) | #75 (running) | `src/core` effective skill level, `SP_STEPS` rule node, Skills card | O: core + Next up change + golden | S+O | E5 | E6 / E8 in `main.js`; golden; 0.2.7 (Skills card) | W0 | Q5 / Q6 answered by recommendation; picks may ship empty | L |
| E8 Ascension progress bar | #76 (running) | Journey card render, core count 0–4 / 4 | O: core cases | S | E5 | E6 / E7 in `main.js` | W0 | none: as E6 | M |
| 0.4 design | #79 / PR #85 | `docs/design/` | S was used (docs) | O (it sets the engine plan) | none | none | W0 | approve the step list | M |
| 0.2.5 save-safety spec + mockup | #80 / PR #86 | `docs/` | S (docs) | S | none | none | W0 | mockup OK (CEO under the 0.2 → 0.3 grant) | S |
| Phone layout audit + mockup | #81 / PR #87 | `docs/` | S (docs) | S | none | none | W0 | mockup OK (owner: visible, after 0.3) | M |
| Next-class research | #82 (merged) | `docs/research/` | done | S | none | none | W0 | D8 | — |
| This plan | #84 / PR #88 | `docs/team/DISPATCH.md` | O (planning: it sets the routing for every later step) | S | none | none | W0 | none | M |

### 0.2.x patches and the end of 0.3

| Step | Issue / PR | Touches | Builder (why) | Reviewer | Depends on | Conflicts with | Group | Owner input | Size |
|---|---|---|---|---|---|---|---|---|---|
| E9 part 2 + 0.2.4 owner checks (checks 7, 8; Hugo Mercenaries: Deep Shadow; Ascension openings; Zikel Defense Break node) | — | `data/shared/asmodian/*` gate fields, board plan, `claims.json`; golden | O: gate fields + golden | S+O | owner's in-game checks; W0 merged (golden) | golden; any `data/` gate PR | W1 | **in-game checks** | M |
| 0.2.4 villages as zones | — | `data/shared/asmodian/zones*` + `location.zone` on records; `DATA_SOURCES.md` | S: data, no gate fields (the guard escalates if golden moves) | S | W0 merged; merge after E9 part 2 | E9 part 2 (same JSON files, different fields: merge E9 first) | W1 | none (approved 2026-10-15) | M |
| 0.2.5 save safety build | — | `src/main.js` save/storage area, export, `site.js` checks | O: saves | S+O | #80 mockup approved; E6–E8 merged | `main.js` save area (0.5 C1 later); `app.css` (absorb design tokens first) | W1 | mockup OK | M |
| 0.2.7 skills active / passive (F2) | — | Skills card render | S: display only, data exists | S | E7 merged (same card) | Skills card; E7 | W1 | none | S |
| Design tokens (0 changed pixels) | — | `src/styles/*.css`, `docs/design-system.md`, a raw-colour test | O: > 300 lines | S | none (CSS only) | `app.css` (0.2.6, phone layout) | W1 | none | L |
| E10 "Daeva Trapped" record, `g45:0` split, `STORY_END` | — | `data/` story records + gates, key retire (`g45:witness`), mig1 re-pin (`E1MIG_WRITE_EXPECTED=1`) | O: gates + keys + mig pin | S+O | **owner Q7**; E9 part 2 merged (golden) | golden; mig1 pin; story data | W1–W2, when Q7 lands | **Q7 (giver confirmed in game)** | M |
| 0.2.6 polish (Route rules card home F11, phone page-zoom leftovers, hit areas) | — | `app.css`, Route rules render | S: small render + CSS | S | tokens merged; #81 patch plan | `app.css`; the card it moves | W2 | screenshots (CEO under grant) | M |
| Releases 0.2.4 / 0.2.5 / 0.2.6 / 0.2.7 | — | `package.json`, `CHANGELOG.md` | S: version + notes | S (separate run) | the patch's steps merged | every release (serial) | after each patch | none (CEO under grant) | S |
| 0.3.0 release + owner review pack | — | `package.json`, `CHANGELOG.md`; before/after screenshots E4–E10 | S | S | E6–E10 merged | releases | W2 | **owner final review** | S |
| Pending docs-only items (HANDOFF list: colour-sprint checklist, UX review checklist, support templates, patch-watch routine, icon provenance) — only those not done yet | — | `docs/` | S (Haiku sub-agent fits inside a cloud session) | S | none | none | any wave | none | S each |

### 0.4 Smart Next up (provisional until #79 merges)

| Step | Issue / PR | Touches | Builder (why) | Reviewer | Depends on | Conflicts with | Group | Owner input | Size |
|---|---|---|---|---|---|---|---|---|---|
| N1 travel data: Kibelisks, coordinates, distances (Metabot) | — | new `data/shared/asmodian/kibelisks.json`, schema, generator | O: schema + generator. Research in a **cloud session** (web) | S | #79 | `tools/gen/` (F1) | W3 | none | M |
| N2 location tie-break + derived Kibelisk binds (25 m / 150 m) | — | `src/core/nextup.js` `rankNext`, evaluator rule, `lastConfirmedLocation` | O: engine + golden | S+O | N1, 0.3.0 | golden; `rankNext` | W3 | none (rules decided) | L |
| N3 fastest / completionist + level bands (F10) | — | core ranking, Next up render, a view setting in the save | O: engine + save field + golden | S+O | N2 | golden; Next up card | W4 | **mockup**; fastest drawbacks list | L |
| N4 travel UI: teleport vs run, "1 scroll", "I'll walk", "Bind X" nudge, "Prefer running" | — | Next up card render, setting in the save | O: save field, > 300 lines | S+O | N2 | Next up card (N3) | W5 | **mockup** | L |
| N5 catch-up ranking (F1) | — | core ranking | O: engine + golden | S+O | N3 | golden; `rankNext` | W5 | none | M |
| N6 filler XP ranking (F9) | — | core ranking, data | O: engine + golden | S+O | N5; **owner XP/min measurements** | golden | when data exists | **in-game measurements** | M |
| 0.4.0 release | — | `package.json`, `CHANGELOG.md` | S | S | N1–N5 | releases | W5 | owner approval (visible) | S |
| Whole-app UX review after 0.4 | — | `docs/reviews/` | S (review only) | O | 0.4.0 | none | W6 | read the report | M |

### 0.5 Characters and class framework

| Step | Issue / PR | Touches | Builder (why) | Reviewer | Depends on | Conflicts with | Group | Owner input | Size |
|---|---|---|---|---|---|---|---|---|---|
| F1 generator per class (Assassin byte-identical) | — | `tools/gen/`, `scripts/build.mjs` | O: generator, > 300 lines | S+O | N1 merged (gen) | `tools/gen/`; every `data/` PR rebuilds | W4 | none | L |
| F2 class scope for claims / confidence | — | `data/schema`, `guide/claims.json`, `confidence.json` | O: schema | S | F1 | `claims.json` (any data PR) | W5 | none | M |
| F3 class descriptor in data; hard-codes out of `catalog.js`, `requirements.js`, `main.js`, `index.html` | — | `src/core`, rotation card, `index.html` | O: core, > 300 lines | S+O | F1 | rotation card; `index.html` | W6 | none | L |
| C1 several characters per save (existing save = character 1; additive flagged migration; key unchanged) | — | `src/core/state.js`, `migrations.js`, storage; new mig test in `tests/e2-migtest.js` | O: saves + migration | S+O (two Opus runs: build, review) | 0.4.0; 0.2.5 merged | save area; mig tests | W6 | rollback rule confirmed (0.4 reads character 1) | L |
| F4 runtime class per character (`char(state).class`, `catalog.js` factory) | — | `src/core`, saves | O: core + saves | S+O | C1, F3 | save area; catalog | W7 | none | L |
| C2 character switcher + class picker (Assassin only visible) | — | header render, `app.css` | O: > 300 lines with UI + save calls | S | C1 | header; `app.css` | W7 | **mockup** | M |
| F5 tests parametrized by class; second-class golden | — | `tests/**`, golden | O: golden | S+O | F4 | golden; all tests | W8 | none | L |
| F6 build size: shared board grid, per-class lazy load (artifact stays one file) | — | `scripts/build.mjs`, `tools/gen/`, loader | O: build + artifact rules | S+O | F4 | `tools/gen/`; build | W8 | **ship all classes in one page or load per class** | M |
| 0.5.0 release | — | release files | S | S | all of 0.5 | releases | W8 | owner approval | S |
| Phone layout build (Next up near the top, stack, Build bottom sheet) | — | `main.js` layout, `app.css` | O: > 300 lines | S | tokens, #81 mockup, 0.5.0 (HANDOFF order) | every card render; `app.css` | W9 | **mockup** | XL |

### 0.6 Backup and sync, 0.7 New players

| Step | Issue / PR | Touches | Builder (why) | Reviewer | Depends on | Conflicts with | Group | Owner input | Size |
|---|---|---|---|---|---|---|---|---|---|
| Y0 sync design (crypto, server, retention) | — | `docs/design/` | O: security + saves | S+O | none (docs, written early) | none | W8 (docs, early) | **hosting / cost (money)**; "lose the code = lose the cloud copy"; retention | M |
| Y1 encryption + sync client on `merge()` | — | `src/core/sync.js`, storage | O: saves + crypto | S+O | Y0 approved | save area | W10 | none | L |
| Y2 server (no accounts, stores ciphertext only) | — | new service + deploy config; maybe `ci.yml` | O: infra + security | S+O | Y0; **owner creates the account** | `ci.yml` | W10 | **account, cost** | L |
| Y3 sync UI (code create / enter, status) | — | settings render | O: save calls | S | Y1, Y2 | settings card | W11 | **mockup** | M |
| 0.6.0 release + UX review after 0.6 | — | release files, `docs/reviews/` | S | S / O | Y1–Y3 | releases | W11 | owner approval | S + M |
| P1 first run welcome (shown once, flag in the save) | — | welcome render, save flag | O: save field | S | 0.6.0 | top-of-page render | W12 | **mockup** | M |
| P2 Lv 1–10 tuning + terms explained where they first appear | — | `data/shared/asmodian/guide/*` text, tips | S: guide text, no gates | S | P1 | `guide/*.json` | W12 | none | M |
| P3 join mid-level (set level and story quest; earlier content derived done) | — | core derivation, save writes | O: engine + saves | S+O | 0.6.0 | save area; golden | W12 | **mockup** | L |
| 0.7.0 release | — | release files | S | S | P1–P3 | releases | W12 | owner approval | S |

### 0.8 First new class (Gladiator by default)

| Step | Issue / PR | Touches | Builder (why) | Reviewer | Depends on | Conflicts with | Group | Owner input | Size |
|---|---|---|---|---|---|---|---|---|---|
| D8 pick the class and a tester | — | DECISIONS | owner | — | PR #82 | none | now | **D8 + a named tester** | — |
| R1 research pack (29 skill pages, stigma picks, two advice sources) | — | `docs/research/` | S in a **cloud session** (web; fetching rules, 7 s apart) | O | D8 | none | any wave after D8 (W3+) | **GamesFuze / thegameswiki by hand** | M |
| G1 class data: board nodes, skills, stigmas, `class.json` | — | `data/classes/<class>/` | O: > 300 lines (537 nodes) | S | F1–F6, R1 | `data/` | W13 | none | L |
| G2 guide build: skill order, stigmas, board plan, key stacks ("single source" labels) | — | `builds.json`, `claims.json` | S: advice data, no gates | O (claims labels) | G1 | `claims.json` | W13 | second source or "single source" OK | M |
| G3 icons (22 skills, 4 stigmas, Metabot) | — | `assets`, `docs/ISSUES.md` provenance | S (Haiku sub-agent fits in a cloud session) | S | G1 | none | W13 | none (standing icon OK) | S |
| G4 class golden snapshot + spot check + 0.8.0 release | — | `tests/golden`, release files | O: golden | S+O | G1–G3 | golden; releases | W14 | **in-game spot check (Lv 7 Skills window, stigma max level)** | M |

### Any time

| Step | Touches | Builder | Reviewer | Notes |
|---|---|---|---|---|
| Game patch watch (weekly, after Global maintenance) | report in `docs/research/` | S in a cloud session (web) | none unless a PR follows | a PR only when a claim is affected; that PR is routed by its own row type |
| Data corrections from issues | `data/` | S; O if it touches a gate field or golden | S / S+O | the Sonnet guard catches gate fields |
| Colour sprint | — | not dispatched | — | not before 0.5 is solid; starts with the CEO and the owner going through the research |

## Wave plan

A wave starts when what it depends on has merged. Inside a wave every row runs at the same time; the merge order
says who merges first.

| Wave | Runs at once | Max concurrent runs | Merge order inside the wave |
|---|---|---|---|
| **W0** (now) | E6, E7, E8, #79, #80, #81, #82, #84 | 3 Opus builders + docs/review runs (≈ 8) | docs first (#82 merged; #80, #81, #84, then #79 after its review); then **E8 → E6 → E7** (smallest `main.js` footprint and no expected golden change first; E7 last because it changes Next up and the Skills card) |
| **W1** | E9 part 2 (when the checks are in), villages, 0.2.5 build, 0.2.7, design tokens; E10 if Q7 is in | 3 Opus (E9p2, 0.2.5, tokens) + 1 Sonnet (villages or 0.2.7) + reviews | tokens (CSS only) → 0.2.7 → **0.2.4 release** (E9p2 + villages, in that order) → 0.2.5 build → **0.2.5 release** → E10 |
| **W2** | 0.2.6 polish, 0.3.0 release pack, pending docs items; R1 can start once D8 is in | 1 Sonnet build + docs + 1 cloud research session | 0.2.6 → **0.2.6 / 0.2.7 release** → **0.3.0** (owner review) |
| **W3** | N1 travel data → N2 tie-break (N2 starts on N1's branch or after it merges), R1 | 2 Opus + 1 cloud research | N1 → N2 |
| **W4** | N3 modes / bands, F1 generator per class | 2 Opus | F1 first (no golden; Assassin byte-identical) → N3 (re-records golden) |
| **W5** | N4 travel UI, N5 catch-up, F2 claims scope | 3 Opus | F2 → N5 (golden) → N4 (render) → **0.4.0** |
| **W6** | UX review, F3 descriptor, C1 characters | 2 Opus + 1 Sonnet review | UX review (docs) → F3 → C1 |
| **W7** | F4 class per character, C2 switcher | 2 Opus | F4 → C2 |
| **W8** | F5 tests, F6 build size, Y0 sync design | 3 Opus | Y0 (docs) → F6 → F5 (golden) → **0.5.0** |

Later waves follow the same rule: W9 phone layout (alone on `main.js` render and `app.css`); W10 Y1 ∥ Y2; W11 Y3,
0.6.0, UX review; W12 P1 ∥ P2 ∥ P3, then 0.7.0; W13 G1 → G2 ∥ G3; W14 G4 and 0.8.0.

**How later branches absorb earlier ones** (every branch still open when a wave-mate merges):

1. `git merge origin/main` on the branch (bots can't rebase; a merge commit is fine). Resolve conflicts on the
   branch, never on `main`.
2. `npm run build`, then `node tests/golden.js --explain` for any branch that changes Next up: the list must show only
   this branch's own changes. If an earlier merge already moved some states, they drop out of this list.
3. Re-record golden only for this branch's own differences (`node tests/golden.js --record`), with the reason in the
   commit. If mig1's pinned diffs moved, `E1MIG_WRITE_EXPECTED=1` and review the diff.
4. `npm test` green, including `mig1`, `mig2`, `journey`. Then dispatch CI on the branch (bot pushes don't start it)
   and wait for `ci-ok` on the new head SHA.
5. If the merge touched more than the conflict lines, ask the same reviewer model for a delta review of the merge
   commit only.

## Limits

- **Concurrency groups are per thread** (claude.yml): `claude-<issue/PR number>` and `sonnet-<issue/PR number>`, with
  `cancel-in-progress: false`. One running Opus run and one running Sonnet run per thread. GitHub keeps **at most one
  pending run per group**: a third trigger on a busy thread replaces the second, so the second is silently dropped. The
  Opus and Sonnet groups are separate, so `@claude` and `@sonnet` on the same PR run **at the same time** and can both
  push to the branch. Never do that. Each step gets its own issue, so builders never queue behind each other. A review
  runs on the PR (a different thread from the issue), so it can run while the issue thread is idle.
- **CI concurrency**: `ci-<ref>`. A newer run on a PR branch cancels the older one; on `main` runs queue, and deploys
  queue on `pages`. Every merge deploys, so merges inside a wave are spaced until the previous deploy and smoke check
  finish.
- **GitHub Actions concurrent jobs** (assumed Free plan: 20 on GitHub-hosted runners, account-wide). One Claude run =
  1 job for up to 240 min. One PR CI run = 6 parallel jobs (data, 4 browser shards, perf), then `ci-ok`. A main push
  adds deploy, smoke and release one after another. Budget: Claude runs + 6 × CI runs in flight ≤ 20. That means 8
  Claude runs + 2 CI runs (20), or 6 + 2 with headroom. Over the limit, jobs queue rather than fail, so going over costs
  time, not correctness.
- **Session git proxy: 2 concurrent clones per repo.** This applies to Claude Code cloud sessions (CEO chat, research
  sessions), not to GitHub Actions runs (they use `actions/checkout`). Start at most two cloud sessions at once, and wait
  for one to finish cloning before starting a third.
- **Bots can't fetch the web.** Treat GitHub Actions runs as having no web access, even though claude.yml's
  `--allowedTools` still lists WebFetch and WebSearch. (Follow-up for the owner: remove them so the file matches the
  rule; sessions can't edit workflows.) Anything that needs a web page (N1 coordinates, R1, patch watch, re-verifying a
  fact) runs as a cloud session in the "Research (open web)" environment, under the CLAUDE.md fetching rules. The bot
  run then builds from the session's report.
- **Usage.** The owner's weekly limit is the real cap on Opus (resets Tue 03:00 ET). Keep at most **3 Opus builders**
  at once; reviews and docs go to Sonnet unless the row says S+O.
- **Serial files**: these set the cap inside a wave more than any of the limits above (see Legend).

## CEO checklist before posting any trigger

1. **Row exists.** The step is in this table, or you add its row first. Its "Depends on" have merged into `main`.
2. **Route.** Check the issue text against the routing rule. Engine, saves, gates, golden, mig pin, generator/schema,
   or > 300 lines → `@claude`. Otherwise `@sonnet`. When in doubt, `@claude`. Never name both.
3. **Serial files.** No other open branch is editing the same serial file or card. If one is, wait, or split the card
   areas in both prompts.
4. **One thread, one run.** Nothing is running or pending on this thread in either group. Never `@sonnet` a PR while
   `@claude` is fixing it (or the reverse).
5. **Capacity.** Opus builders running < 3. Actions jobs in flight + 1 (+ 6 if this run will push and you'll dispatch
   CI) ≤ 20. Cloud sessions cloning < 2.
6. **Owner input in hand.** The mockup, in-game check or decision the row names is recorded (DECISIONS or the issue).
   If not, don't trigger. Ask the owner.
7. **No web in a bot prompt.** If the step needs a web page, the research runs first in a cloud session.
8. **Prompt carries the guard rails.** Not touching (files), acceptance (from the design), "`npm test` green incl.
   `mig1` / `mig2` / `journey`", "don't merge". For visible steps: before/after screenshots. For reviews:
   "VERDICT: APPROVE / REQUEST CHANGES; don't run journey or the full `npm test`".
9. **After the run.** Open the PR via REST if the bot left only a link. Dispatch CI on the branch, wait for `ci-ok` on
   the head SHA, then post the review trigger (the reviewer model from the row).

## For the owner, in plain words

**How many at once:** about **8 sessions**. That is up to 6 GitHub runs (no more than 3 of them big Opus builds, the
rest Sonnet reviews and docs) plus up to 2 cloud sessions for research or the CEO. Going higher isn't safe. The limits
are a few files only one session may edit at a time (the main page script, the test snapshots, the gate data), your
weekly Opus usage, and GitHub's 20-job limit once CI runs alongside.

**Next three waves:**

1. **Wave 0 (running now):** the last three 0.3 screens (blocker-chain text, specialty slots, Ascension bar) plus four
   documents (the 0.4 design, the save-safety mockup, the phone-layout audit, this plan). They merge one at a time,
   smallest first.
2. **Wave 1:** your in-game check results and villages as their own zones (**0.2.4**), the backup reminder
   (**0.2.5**), active/passive labels on skills (**0.2.7**), and the invisible design tokens. The "Daeva Trapped in a
   Nightmare" fix joins once you've confirmed who gives that quest. **Needs you:** the in-game checks.
3. **Wave 2:** small polish (**0.2.6**), then the **0.3.0** release, which waits for your final review of everything
   0.3 changed. Research on the next class can start here once you pick it (D8) and name who will level it.
