# 0.4 P8: The done check: no AION 2 term in the engine, engine cards or shell

Planned in the 0.4 planning pass (#135, ROADMAP "0.4"). Read CLAUDE.md and `docs/design/0.4-engine-contract.md` (P0,
the term list) first. Needs P5a, P5b, P5c, P5d and P6 merged.

## Problem

0.4's goal ("the engine holds no AION 2 term", "`src/main.js` holds no AION 2 term") is a claim until a test holds it,
and without a test the terms come back with the next feature.

## Result

`tests/core/purity.test.mjs` gains a term scan: P0's term list (case-insensitive, word-bounded) over `src/core/**`,
`src/cards/**`, `src/shell/**` and `src/main.js`, with P0's false-positive list as the only exceptions. A hit fails
`core` with file:line and the term.

## Appetite

S (under 100 lines).

## No-gos

- **Test only.** If the scan finds a term, don't fix it here: stop, list the hits in the PR and in the issue, and the
  planner queues an Opus fix item first. Never widen the exception list to make it pass; an exception needs P0's
  reason (a word that isn't a game term).
- Don't scan `src/packs/**`, `data/**`, `src/styles/**` or `src/index.html` text outside the shell (packs are meant to
  name their game).

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] The scan runs in `core` and passes on this branch (paste the line with files and terms counted).
- [ ] Negative control: planting "stigma" in `src/core/state.js` fails it with file:line (paste; not committed).
- [ ] The exception list equals P0's (diff it in the PR body).
- [ ] ROADMAP 0.4's "Done when" items each name their passing check (golden, conformance, this scan) in the PR body.
- [ ] `npm test` green.

## Files (owns)

`tests/core/purity.test.mjs`.

## Lanes, model, order

Lanes: none. Model: Sonnet (a test, small; no app code: it stops instead of fixing). After: P5a–P5d, P6. Before: R.

- [next] #? sonnet lanes:none
