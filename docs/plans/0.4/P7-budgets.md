# 0.4 P7: Page size and element budgets that block

Planned in the 0.4 planning pass (#135, ROADMAP "0.4"; audit practice 5). Read CLAUDE.md, docs/ARCHITECTURE.md §4–5
and docs/DEPLOY.md ("CI jobs") first.

## Problem

Nothing stops the page growing. The only speed check (`tests/perf.js`, `update()` < 15 ms) is timing-based and
advisory. The page grew 34% during 0.2 (`dist/index.html` 498,891 B at 0.2.0 → 669,290 B at 0.3.0), and each class
pack will add more.

## Result

Limits at about 1.3× the 0.3.0 numbers (so today is ~77% of each, outside the 20% planning band; ROADMAP 0.4 "Budget
trend"):

| Budget | 0.3.0 | Limit | Where it is checked |
|---|---|---|---|
| `dist/index.html` bytes | 669,290 | 870,000 | `scripts/build.mjs`, fails the build |
| `dist/index.html` gzip -9 bytes | 153,871 | 200,000 | `scripts/build.mjs`, fails the build |
| `dist-artifact/index.html` bytes | 790,763 | 1,030,000 | `scripts/build.mjs`, fails the build |
| Elements, fresh browser, 390 px | 4,741 | 6,200 | `site` suite, fails the suite |

The build prints each number with its limit and the percentage used (beside the existing `FONT_INLINE_MAX` check). The
`site` check counts `document.querySelectorAll('*').length` after load at 390 px with no save. Timing stays advisory.

## Appetite

S (under 100 lines).

## No-gos

- No per-pack loading (moved to 0.6 lane B), no optimisation, no change to what the page contains.
- No `.github/workflows/` change (the build and the `site` suite already run in CI), no `package.json` change.
- No change to `FONT_INLINE_MAX` or the font files.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] `npm run build` prints the four numbers with limit and % (paste the lines).
- [ ] Negative control: with a limit set below today's value the build fails with a message naming the budget (paste;
      not committed).
- [ ] The `site` suite has the element check and passes; negative control with a lower limit fails (paste; not
      committed).
- [ ] docs/ARCHITECTURE.md §4 and §5 name the budgets and say how to raise one (a PR that raises a limit says why).
- [ ] `npm test` green.

## Files (owns)

`scripts/build.mjs` (budget block only), `tests/site.js` (one check), docs/ARCHITECTURE.md §4–5.

## Lanes, model, order

Lanes: none. Model: Sonnet (small; no core, save, gate, golden or generator code). After: nothing. Beside P0 and P2a
(wave 2). P2b later edits `scripts/build.mjs` module paths only, after this has merged.

- [next] #? sonnet lanes:none
