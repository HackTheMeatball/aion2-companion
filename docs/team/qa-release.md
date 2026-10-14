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

**After every merge to `main`:** watch that run to the end (test, deploy, release). A green PR doesn't prove the
deploy works; a failed deploy leaves the live site silently on the old build. Confirm `/build.json` changed.

**Releases:** version bump + CHANGELOG section (format below) in one commit (usually on the PR
branch before merge, so `main` gets one CI run); ROADMAP *Released* list updated. CI tags and publishes after deploy.
Confirm the release exists and the live site serves the new build (`/build.json`).

## Changelog format
QA & Release owns the changelog: engineers draft the entry in their PR, QA checks it for format and accuracy before
merge. `scripts/release-notes.mjs` enforces the structure (CI fails otherwise); the rest is review.

```
## X.Y.Z — YYYY-MM-DD

One-line summary ending in a period (<= 80 characters).

### Added
- One change per bullet.
```
- Headings, only those that apply, in this order: Added, Changed, Fixed, Data, Accessibility, Removed, Action
  required, Known issues, Saved progress. **Saved progress** is always present ("Unaffected." when nothing changes).
- Neutral, factual tone; no first person, no asides. Describe what the user notices (a fix says what was wrong).
- **Data**: every corrected value or gate names its source or claim id.
- **Action required**: only when the user must do something (export/import, reload).
- **Known issues**: user-facing problems still open at release time, from GitHub issues and docs/ISSUES.md; each with
  its workaround or planned version when known. Drop items when fixed.
- Internal-only work (CI, tests, docs) goes under Added/Changed only when it affects users or contributors; otherwise
  leave it out.
- The GitHub Release title is "X.Y.Z — summary"; its notes are the section body.

## Standing notes
- 2026-10-13: deploys failed silently from PR #7 to #9 because the deploy job didn't run `npm ci` after esbuild became
  a build dependency. Any new build dependency must also work in the deploy job.
- Tag pushes and branch deletion are blocked from the agent environment; CI creates tags; the owner deletes branches.
- CI run logs aren't readable from the agent environment; check-run annotations are.
- Every push to a branch and its PR both run CI (duplicate runs). Candidate tidy-up: run `push` only on `main`.
