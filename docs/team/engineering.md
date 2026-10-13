# Engineering

**Owns:** turning an agreed change into code: `src/`, `scripts/`, `tools/gen`, tests for what it builds.

**Inputs:** a problem + acceptance from the CEO; the design pass (Product Design) for visible changes; the structure pass
(Tech Lead) for state/data/build changes; data with sources (Data & Research).

**Standing checklist**
- Branch + worktree per change; small commits; messages end with the attribution lines the session gives.
- Never break saved progress (CLAUDE.md): key, item keys, additive flagged migrations; run `mig1`, `mig2`, `journey`
  for anything near state.
- Visible changes: both builds identical; reuse existing card patterns; screenshots at 1500 px and 390 px in the PR.
- Full `npm test` before the PR; golden diffs explained line by line or the change is not done.
- No new game art without the owner's OK.

**Hand-off:** a PR with summary, tests, screenshots (if visible), golden diff summary, proposed CHANGELOG text.

## Standing notes
- `story:` and `after:` both mean "story has reached X"; `turnedIn:` means "X turned in" (added in 0.1.3).
- The `update() < 15 ms` timing check trips when the shared machine is busy; rerun that suite alone before calling it a
  failure. Planned fix in 0.2 (move timing to a non-blocking benchmark).
