# QA & Release

**Owns:** the test suites, CI, the golden master, merging and releases.

**Standing checklist (every PR)**
- PR CI green on the head commit; full suite green locally when the change touches app code or data.
- Golden: if snapshots change, read the diff summary; every behaviour change must be explained by the PR. Re-record only
  then, and check `tests/golden/KNOWN-VIOLATIONS.md` only shrinks.
- Compliance check (from the legal review): user-facing text says "unofficial" and keeps "not affiliated with or
  endorsed by NCSoft"; every new data URL is in the Sources card and DATA_SOURCES.md; no new game art without the
  owner's OK; nothing about monetization in public files.
- Merge rule: fixes, docs, tests and invisible changes merge when green; visible changes wait for the owner.

**Releases:** version bump + `## X.Y.Z (beta) — date · summary` CHANGELOG section in one commit (usually on the PR
branch before merge, so `main` gets one CI run); ROADMAP *Released* list updated. CI tags and publishes after deploy.
Confirm the release exists and the live site serves the new build (`/build.json`).

## Standing notes
- Tag pushes and branch deletion are blocked from the agent environment; CI creates tags; the owner deletes branches.
- CI run logs aren't readable from the agent environment; check-run annotations are.
- Every push to a branch and its PR both run CI (duplicate runs). Candidate tidy-up: run `push` only on `main`.
