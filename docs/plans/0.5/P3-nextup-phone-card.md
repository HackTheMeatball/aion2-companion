# 0.5 P3: Next up card on phones (first card full width, "1 of N", compact later cards)

Planned in the 0.5 planning pass (#191, ROADMAP "0.5", lane B). Read CLAUDE.md, docs/ARCHITECTURE.md §2,
docs/design/phone-layout.md §2.5, §3.4 and patch G, and the owner's answers to its §5 questions first. Needs P2.

## Problem

On a phone the Next up card wraps badly (phone-layout §2.5: the title wraps, the "i" button sits on its own line, the
action button is small and 20 px below the text) and the later cards sit in a nested scroll stack (audit P1-2). Lane A
adds rows to this card in 0.5 (P14–P16), so its phone layout is settled first.

## Result

At ≤ 600 px (`pointer: coarse` for the 44 px sizes): the first card is full width with its action(s) directly under
the text, full width, 44 px, primary style (`--accent-fill`); the later cards are compact (number tile, title, one
line); a "1 of N" pager replaces the nested scroll stack. Basic shows "1 of N" only if the owner said so (recommended:
no; Basic hides `.ns-head` today). Desktop unchanged.

## Appetite

M (100–300 lines).

## No-gos

- No ranking change (`src/core/nextup.js`, the pack's producers), no new card kind, no new action.
- No change above 600 px; no change to other cards; no `src/main.js` change.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] At 390 px, Lv 27 fixture: the first card's action buttons are ≥ 44 px tall and as wide as the card; the title
      doesn't share a line with the "i" button (paste measurements).
- [ ] "1 of N" moves through every card Next up shows, by button and by keyboard; its buttons have spoken names; the
      pop-out (`regress`) still works (paste).
- [ ] At 1500 and 1100 px the style and DOM snapshots compare equal to `main` (paste).
- [ ] Golden: only the `nu` text the pager adds changes, re-recorded with `--record --card nu`; the diff summary is in
      the PR (paste).
- [ ] Before / after shots at 390 px, Basic and Advanced, in `docs/reviews/0.5-p3-shots/`.
- [ ] `a11y`, `regress`, `e1` green; `npm test` green.

## Files (owns)

`src/cards/nextup.js`, `src/cards/ahead.js`, `src/styles/cards/nextup.css`, `src/styles/cards/ahead.css`,
`tests/golden/snapshots/nextup/`, Next up expectations in `tests/e1test.js` / `tests/regress.js`,
`docs/reviews/0.5-p3-shots/`.

Ownership check: every acceptance line passes with these files.

## Lanes, model, order

Lanes: golden. Model: Opus (golden re-record). Shares `src/cards/nextup.js` with lane A's UI items: P14, P15 and P16
wait for it (B first, ROADMAP 0.5 lane map).

After: P2.

- [next] #? opus lanes:golden
