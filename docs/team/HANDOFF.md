# Handoff — state as of 2026-10-15

Everything the CEO session knows that isn't already in DECISIONS, ROADMAP, the charters or CHANGELOG. Update this file
when the state changes; keep it short.

## Live
- **v0.2.3** live at https://daevacompanion.com/ (see the CEO handover below; rebrand in 0.1.7, new address in 0.1.8). Releases v0.1.0–v0.1.8 exist on GitHub. daevapath.com and aion2.ishkabytes.com redirect (301,
  Cloudflare, paths kept).
- Repository renamed to `HackTheMeatball/daeva-companion` (the old name redirects).
- The claude.ai artifact is **frozen** with a "moved" banner (Export still works). The owner tracks progress on the site.
- CI: test → deploy (GitHub Pages) → release, on every push to `main`. PRs run tests only. `main` is not protected yet.

## How work runs
Parallel Claude Code cloud sessions, one task each, own branch, one PR, never merged by the session. The CEO session
reviews PRs. Merging: until the owner confirms otherwise, **nothing merges without the owner's OK** (the charter rule
"invisible changes merge on green" returns once branch protection with `ci-ok` is on, if the owner agrees). Visible
changes always need the owner's approval, mockup first. Session prompts live in the CEO's plan, one per task.
**Exception for the 0.2 → 0.3 cycle** (owner, 2026-10-15; DECISIONS): the CEO merges and releases 0.2.x patches itself,
visible ones included, under the limits in that row; 0.3's Next up behaviour changes and the 0.3.0 release still wait
for the owner. The rule above returns after 0.3.0 unless the owner says otherwise.

## CEO handover (2026-10-15, 09:10 ET) — read this first in a new CEO chat

**Live:** v0.2.3 on daevacompanion.com. Autonomous-merge grant for the 0.2 → 0.3 cycle: DECISIONS 2026-10-15.

**0.3 status:** E0 design (#42), E1 evaluator (#57), E2 wiring (#59) and E3 invariant suite (#61) are merged; all invisible
(golden master unchanged). E4–E8 change what Next up shows: build only with the owner's go, one `@claude` issue per step,
then HOLD the PR with a plain list of who is affected plus before/after screenshots. E9 data PRs and E10 follow. The 0.3.0
release waits for the owner. Follow-ups noted: Q10 edge case (Lv 44 all ticked is offered "Turned in" on a Lv 45 quest,
fix in E4); optional Daevanion blv / stigma g.lv getter for E4; design §15 has no row for the Ascension-first ranking
(invariant 3 is a visible PENDING test until it exists); the invariant suite prints a 30 s warning in CI (~32 s in the
shard), harmless.

**Standing approval (owner, 2026-10-15 20:26 ET, DECISIONS):** until 0.3 is ready for the owner's final review, the CEO
merges remaining 0.3 steps itself (green `ci-ok`, separate reviewer APPROVE, save tests) and keeps going without
waiting. The 0.3.0 release, money/accounts/legal and new art still wait for the owner.

**Routing rule (owner, 2026-10-15, after #69 went to Sonnet by mistake):** `@claude` (Opus) for anything touching
`src/core/`, saves/sync/migrations, a gate's `requires`/`completesWith`, golden re-records or the mig1 pin, or a change
over about 300 lines. `@sonnet` only for reviews, docs, research and small data fixes. Before posting a trigger, the CEO
checks the issue against this list. The Sonnet job's prompt refuses such work and replies "Needs @claude (Opus)"
(`.github/workflows/claude.yml`). When in doubt, use Opus.

**How work runs:** `@claude` (Opus) or `@sonnet` in an issue/PR comment starts a Claude Code run on GitHub
(`.github/workflows/claude.yml`, owner-only). Reviews: ask for "VERDICT: APPROVE / REQUEST CHANGES", tell it not to run
journey or the full npm test, verify findings yourself; reviewers don't run the browser suites, so never trust APPROVE
alone. **Bot pushes made with GITHUB_TOKEN don't trigger CI**: start it with
`gh api -X POST repos/HackTheMeatball/daeva-companion/actions/workflows/ci.yml/dispatches -f ref=<branch>` and wait for
`ci-ok` on the head SHA. Bots often leave only a "Create PR" link: open the PR via REST. GitHub GraphQL is blocked from
sessions: use `gh api` REST (comment: `issues/N/comments`; merge: `-X PUT pulls/N/merge -f merge_method=squash`).
Releases: version bump + CHANGELOG PR (qa-release.md), reviewed by `@sonnet`. Branch protection on `main` is still for the
owner to turn on (docs/DEPLOY.md).

**Open PRs:** none from this cycle. 0.2.4 is planned (ROADMAP): owner in-game checks (Hugo Mercenaries: Deep Shadow,
Ascension openings, Zikel Defense Break node) and villages as their own zones if the owner agrees.

**Owner questions:** villages as zones of their own (recommend yes, from Metabot); alt check: does a new character reach
Lv 2 before "Prepare to Escape"; go-ahead for E4–E8.

**Owner tracker:** https://claude.ai/artifact/61L3ghB3E5rR7bfRzENJrC (Dashboard type; non-technical, mobile-first).
Update datasets versions / today / snapshot / gallery: upload the JSON as an asset (Artifact publish `asset: true`), then
ArtifactData `update` of the dataset `source` and `updated`; "today" items carry ISO `at` times.

**Usage:** owner near the weekly limit (resets Tue 03:00 ET). Keep chats short; prefer `@sonnet`; no polling loops.
Morning report daily at 9:00 AM ET (scheduled task "Daeva: 9 AM report").

## Now and next
Wave 1 (start now, no shared files):
| Lane | Task | Files |
|---|---|---|
| Tech Lead | 0.2 step 4, pure core (+ `char(state)`) | `src/main.js`, `src/core/`, `tests/` |
| Design | 0.1.9 visible accessibility | `src/styles/*.css` (little `main.js`) |
| Data & Research | classes-and-gaps report | `docs/research/` |
| Data & Research | prerequisite gate list for 0.3 (report) | `docs/research/` |
| Tech Lead | 0.2 step 5a, data format v2 schema doc | `docs/`, `data/schema/` (new) |
| QA & Release | post-deploy smoke check | `.github/workflows/ci.yml`, `scripts/` |

Wave 2 (each starts when what it names has merged):
- QA: CI speed (`fast` job, sharded browser suites, `ci-ok`) ← smoke check. Then owner turns on branch protection.
- QA: timing check → non-blocking `perf` suite ← step 4.
- Design: tokens + docs/design-system.md (0 changed pixels) ← 0.1.9.
- Design: save-safety line + iPhone hint, build ← step 4 and an approved mockup.
- Schema review (Data & Research + a fresh, context-free session), then owner ← 5a and the gate list.
- 5b data build ∥ 5c schemaVersion + `merge()` ← step 4 and the approved schema. **0.2.0** when both merge.
- Docs-only, any time: colour-sprint checklist + decision sheet; UX review checklist; support triage + weekly status
  templates; patch-watch routine; icon provenance table.

Then: 0.3 requirement engine (sole owner of `src/main.js` while it runs) → blocker-chain UI + Ascension bar (mockup) →
0.3.0 → 0.4 smart Next up → 0.5 characters → phone layout (mockup; on the tokens) → 0.6 sync (renumbered 2026-10-15,
ROADMAP).

Serial-only files (never two sessions at once): `.github/workflows/ci.yml`; `tests/` while step 4 runs;
`src/styles/app.css` (0.1.9 → tokens → phone layout); `src/main.js` (step 4 → save safety / 5c → 0.3 engine → 0.4 smart Next up → 0.5 →
phone layout); `data/*.json` and `tools/gen/` are frozen while 5b runs.

## Cloud environments (owner manages; CEO tells the owner when a domain must be added or removed)
- **Daeva Companion** (code, reviews, docs): defaults + metabot.gg, daevacompanion.com, daevapath.com (+ subdomains).
  Recommended 2026-10-14 to remove aion2.th.gl, aion2.gaming.tools (challenge page), aion2.ishkabytes.com (redirect only).
- **Research (open web)**: full network; the fetching policy in CLAUDE.md still applies.
- aion2hub.com: approved for spot checks (2026-10-14), to be added to "Daeva Companion". dbaion2: rejected (terms).

## Owner feedback
- 2026-10-14: docs/feedback/2026-10-14-owner.md (F1–F4, F12 feed the v2 schema review; F6–F7 next patch).

## Waiting on the owner
- Merge rule (above); PR #15; branch protection settings after CI speed lands (require PR + `ci-ok`, "up to date" off,
  no force push/deletion, 0 approvals, owner bypass); auto-delete merged branches; labels `needs-info`, `triaged`.
- Next class after Assassin (D8). Recommended rule: one the owner or a tester will level to 45, then best coverage in
  the classes-and-gaps report, then most shared with Assassin (default Gladiator).
- Schema: approve 5a after review; whether saves get a per-item change time (needed for un-ticks to survive sync).
- 0.3: accept the intended golden-master differences from derived completion, case by case.
- Save safety: timestamp as an optional field in the existing save; one nudge after 14 days; hint once on iPhone.
- Colour sprint: answer the open questions (research report §10, 8a–f); one in-game session batched with data checks
  (gate semantics, `noPre` quest levels, Kibelisk / Command unlocks, "Daeva Trapped in a Nightmare", Daevanion points
  at 16/17, respec cost after 31, expedition cap, reset time). Screens go to the private repo.
- Sync (0.6) decisions later: "lose the code = lose the cloud copy", whether view settings sync, retention.

## Known gotchas
- The `update() < 15 ms` timing check lives in the non-blocking `perf` suite (`npm run test:perf`; CI job `perf`,
  not in `ci-ok`): a slow run on a busy machine warns, it doesn't fail the build.
- `build.json` is a content hash: a docs-only merge keeps the same id, so check a deploy against that run's build.
- Tag pushes and branch deletion are blocked from agent sessions; CI makes tags; the owner deletes merged branches.
- Run logs aren't readable from agent sessions; check-run annotations are (`gh api …/check-runs/<id>/annotations`).
- WebFetch prompts the owner for URLs it hasn't seen; use WebSearch + `curl` for research.
- Cloud sessions with two repositories don't load the repo's `.claude/settings.json` hooks; use one repo per thread.
- Private material (transcripts, owner screenshots, legal/accounts reports with monetization notes, brand work) is in
  the private repo `HackTheMeatball/daevacompanion-private`; never copy it into the public repo.
