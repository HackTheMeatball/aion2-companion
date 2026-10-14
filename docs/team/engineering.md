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

**Hand-off:** a PR with summary, tests, screenshots (if visible), golden diff summary, proposed CHANGELOG entry in the house format (qa-release.md, "Changelog format").

## Standing notes
- `story:` and `after:` both mean "story has reached X"; `turnedIn:` means "X turned in" (added in 0.1.3).
- The `update() < 15 ms` timing check trips when the shared machine is busy; rerun that suite alone before calling it a
  failure. Planned fix in 0.2 (move timing to a non-blocking benchmark).
- Accessibility (0.1.6): run `node tests/run.mjs --only a11y` after touching markup, focus, motion or controls. Its axe
  allowlist (`ALLOW` in `tests/a11y.js`) only shrinks. Headings hold text only (Milestones / Next up are a `div.sec`
  row with a text-only `h2.sec-h` in `display: contents`); "i" buttons get a spoken name (`T(label, key, name)`).
- Reduced motion: add an override next to each new animation (stop it, or make it a step / an in-place fade); never a
  blanket `animation-duration` override (`#rwToast` clears on `animationend`). Script scrolls use `SMOOTH()`.
- Invisible hit areas (`::before { inset: -Npx }`) need `position: relative` on the control. On bordered rounded pills
  and on summaries with a rotated arrow that changes antialiasing (screenshots differ by 1 level), so those get bigger
  targets only in a visible pass. Check new ones against neighbours with the a11y suite (`HIT` list).
- Pixel-exact old-vs-new screenshots: launch Chromium with `--disable-partial-raster --disable-gpu --disable-lcd-text`
  (removes raster noise), block web fonts, fix the clock, and pin the icon sizer (`iconSizer.disconnect()`, then one
  fixed size on `.icos img`; it settles on 47 or 56 px by decode timing). With that, old-vs-old is identical in every
  state, so any difference is real.
