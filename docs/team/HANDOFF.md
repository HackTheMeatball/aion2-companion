# Handoff — state as of 2026-10-14

Everything the CEO session knows that isn't already in DECISIONS, ROADMAP, the charters or CHANGELOG. Update this file
when the state changes; keep it short.

## Live
- **v0.1.8** live at https://daevacompanion.com/ (rebrand in 0.1.7, new address in 0.1.8), plus 0.2 steps 1–3 with
  identical output. Releases v0.1.0–v0.1.8 exist on GitHub. daevapath.com and aion2.ishkabytes.com redirect (301,
  Cloudflare, paths kept).
- Repository renamed to `HackTheMeatball/daeva-companion` (the old name redirects). PR #15 updates the links.
- The claude.ai artifact is **frozen** with a "moved" banner (Export still works). The owner tracks progress on the site.
- CI: test → deploy (GitHub Pages) → release, on every push to `main`. PRs run tests only. `main` is not protected yet.

## How work runs
Parallel Claude Code cloud sessions, one task each, own branch, one PR, never merged by the session. The CEO session
reviews PRs. Merging: until the owner confirms otherwise, **nothing merges without the owner's OK** (the charter rule
"invisible changes merge on green" returns once branch protection with `ci-ok` is on, if the owner agrees). Visible
changes always need the owner's approval, mockup first. Session prompts live in the CEO's plan, one per task.

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
0.3.0 → 0.4 characters → phone layout (mockup; on the tokens) → 0.5 sync.

Serial-only files (never two sessions at once): `.github/workflows/ci.yml`; `tests/` while step 4 runs;
`src/styles/app.css` (0.1.9 → tokens → phone layout); `src/main.js` (step 4 → save safety / 5c → 0.3 engine → 0.4 →
phone layout); `data/*.json` and `tools/gen/` are frozen while 5b runs.

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
- Sync (0.5) decisions later: "lose the code = lose the cloud copy", whether view settings sync, retention.

## Known gotchas
- The `update() < 15 ms` timing check flakes on busy machines; rerun that suite alone before calling it a failure
  (moves to a non-blocking `perf` suite in wave 2).
- `build.json` is a content hash: a docs-only merge keeps the same id, so check a deploy against that run's build.
- Tag pushes and branch deletion are blocked from agent sessions; CI makes tags; the owner deletes merged branches.
- Run logs aren't readable from agent sessions; check-run annotations are (`gh api …/check-runs/<id>/annotations`).
- WebFetch prompts the owner for URLs it hasn't seen; use WebSearch + `curl` for research.
- Cloud sessions with two repositories don't load the repo's `.claude/settings.json` hooks; use one repo per thread.
- Private material (transcripts, owner screenshots, legal/accounts reports with monetization notes, brand work) is in
  the private repo `HackTheMeatball/daevacompanion-private`; never copy it into the public repo.
