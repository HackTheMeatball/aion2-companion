# Handoff — state as of 2026-10-13

Everything the first CEO session knew that isn't already in DECISIONS, ROADMAP, the charters or CHANGELOG. Update this
file when the state changes; keep it short.

## Live
- **v0.1.7** live (Daeva Companion rebrand, palette unchanged), plus 0.2 steps 1–3 (golden harness, esbuild toolchain,
  data out of code) with identical output. Releases v0.1.0–v0.1.7 exist on GitHub.
- The claude.ai artifact is **frozen** with a "moved" banner (Export still works). The owner tracks progress on the site.
- CI: test → deploy (GitHub Pages) → release, on every push to `main`. PRs run tests only.

## Next up (in order where they touch the same code)
1. **0.2 step 4 — pure core** (Tech Lead): state, migrations, requirements and Next-up ranking as DOM-free modules with
   Node tests; golden identical. Blocks the phone-layout pass and everything in 0.3.
2. **0.2 step 5 — data format v2**: the schema goes to an independent reviewer, then the owner, before it's built.
3. **0.1.8 — visible accessibility fixes** (Design + Engineering; owner approval): see docs/audits/2026-10-mobile-a11y.md.
   Touches `src/styles/*.css` mostly; coordinate with step 4 if it touches `main.js`.
Can run in parallel with the above: research for the first new class once the owner picks it (Data & Research),
colour-sprint prep (Design; research in docs/research/colors-2026-10), support triage (no issues yet).

## Waiting on the owner
- Next class after Assassin (D8). Address/domain (daevacompanion.com was unregistered on 2026-10-13; on hold).
- Colour sprint: which parts to adopt; one in-game check session (grade names on blue/yellow/orange items, class tints,
  stigma name colours, level-up banner) once the direction is chosen.
- Sync (0.5) decisions later: "lose the code = lose the cloud copy", whether view settings sync, retention.

## Known gotchas
- The `update() < 15 ms` timing check flakes on busy machines; rerun that suite alone before calling it a failure.
- Tag pushes and branch deletion are blocked from agent sessions; CI makes tags; the owner deletes merged branches.
- Run logs aren't readable from agent sessions; check-run annotations are (`gh api …/check-runs/<id>/annotations`).
- WebFetch prompts the owner for URLs it hasn't seen; use WebSearch + `curl` for research.
- Cloud sessions with two repositories don't load the repo's `.claude/settings.json` hooks; use one repo per thread.
- Private material (transcripts, owner screenshots, legal/accounts reports with monetization notes, brand work) is in
  the private repo `HackTheMeatball/daevacompanion-private`; never copy it into the public repo.
