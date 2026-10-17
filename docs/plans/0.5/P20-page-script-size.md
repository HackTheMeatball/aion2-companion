# 0.5 P20: Smaller page script (budget headroom)

Planned in the 0.5 planning pass (#191, ROADMAP "0.5" audit, budget trend). Read CLAUDE.md, docs/ARCHITECTURE.md §4
("Page budgets") and §6, and `scripts/build.mjs` first.

## Problem

At 0.4.0 the three byte budgets are inside the 20 % planning band: `dist/index.html` 705,008 / 870,000 B (81 %), gzip
164,936 / 200,000 B (82 %), `dist-artifact/index.html` 826,481 / 1,030,000 B (80 %). 0.4 added 5.3 % with no
visible feature, and 0.5 adds the place data (P8, P9) and new UI. The inlined page script is 525,825 B of the page
and isn't minified (a 0.2 setting: "no minification in 0.2", DECISIONS 2026-10-13).

## Result

The build runs esbuild's whitespace and syntax minification on the page script, **without renaming identifiers**
(tests and the build's duplicate-name check rely on the page's top-level names). Measured on 0.4.0 in this planning
pass (`esbuild.transformSync` with `minifyWhitespace` and `minifySyntax` over the inlined script): 525,825 → 441,962 B
(−84 KB raw), gzip 124,089 → 115,486 B (−8.6 KB). The build prints the budgets as before; ARCHITECTURE §4 records the
setting and why.

## Appetite

S (under 100 lines).

## No-gos

- No identifier renaming, no tree-shaking change, no CSS or HTML minification, no change to the budgets' limits.
- No change to what the page does: golden, DOM and style snapshots identical.
- No `.github/workflows/` or `package.json` change; both builds stay single files as today (artifact: one file,
  `/_blob/` icons, no service worker).

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] `npm run build` prints the three byte budgets lower than on `main` (paste both).
- [ ] DOM and style snapshots (`tests/support/dom-snapshot.mjs`, `style-snapshot.mjs`) equal to `main` (paste).
- [ ] Golden identical; `site` (artifact build, service worker, offline), `e1`, `regress`, `journey` green; `npm test`
      green.
- [ ] A page error's stack still names the function (top-level names kept): paste one from a forced error in the
      browser console (not committed).
- [ ] ARCHITECTURE §4 says the script is minified (whitespace and syntax only) and why.

## Files (owns)

`scripts/build.mjs` (the esbuild options only), docs/ARCHITECTURE.md §4.

Ownership check: every acceptance line passes with these files.

## Lanes, model, order

Lanes: none. Model: Sonnet (build options, small; no core, save, golden or generator code).

After: nothing.

- [next] #? sonnet lanes:none
