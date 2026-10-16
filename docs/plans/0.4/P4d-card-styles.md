# 0.4 P4d: One stylesheet per card, with a computed-style check

Added after the planning pass (owner idea, 2026-10-16 6:29 PM ET: "each card or section can have its own object so
each card or area can be worked on in parallel"). Read CLAUDE.md, docs/ARCHITECTURE.md §2 and §4 and P4a's DOM
snapshot tool first. Needs P4c merged.

## Problem

After P4c every card is its own script file, but all card styles still live in one 1,587-line `src/styles/app.css`,
written in passes ("Polish pass", "Daevanion review round", "Next up v3"), so one card's rules are spread through the
file. Any two visual changes to different cards edit the same file, which keeps `app.css` a serial lane.

## Result

- `src/styles/cards/<card>.css`, one per card file in `src/cards/` and `src/packs/aion2/cards/` (`nextup.css`,
  `journey.css`, `milestones.css`, … and `src/styles/packs/aion2/<card>.css`), holding that card's rules **verbatim**,
  in their original relative order.
- `src/styles/app.css` keeps only the page frame: tokens, layout, the header, the rail, shared controls.
- The build inlines the files in one fixed order (listed in one place, e.g. `src/styles/index.css` with `@import`s or
  the build's list), so both builds still carry one inlined stylesheet; `dist-artifact` stays a single file.
- **`tests/support/style-snapshot.mjs`**: for P4a's fixed states (fresh; Lv 13, 27, 30, 45; Basic and Advanced; 390
  and 1500 px) writes `getComputedStyle` of every element (a fixed property list: box, font, colour, display,
  position, grid/flex) and compares two builds.

## Appetite

L (300–1,000 lines, moved rules counted once). Over 1,000: stop after a whole card, push green, name the rest.

## No-gos

- Verbatim: no selector, value or rule change; no new rules. Where two cards' rules hit the same element and the move
  would change which wins, keep both rules in `app.css` and list them in the PR (a later feature splits them).
- No change to `src/main.js`, `src/cards/**` script files or `src/core/`.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] `style-snapshot.mjs` comparison of `main`'s build vs this branch: identical for every state (paste).
- [ ] P4a's DOM snapshot identical; golden identical; `site`, `a11y` (contrast), `regress`, `e1`–`e4` green.
- [ ] Negative control: change one colour in a card file, the style snapshot reports that element (paste; not committed).
- [ ] `wc -l src/styles/app.css` and each card file pasted; `app.css` holds no rule whose selector is only one card's.
- [ ] `dist-artifact` still one file, no service worker; docs/ARCHITECTURE.md source table lists the style files.
- [ ] `npm test` green.

## Files (owns)

`src/styles/**`, the `<link>` lines of `src/index.html`, the build's CSS list if it has one,
`tests/support/style-snapshot.mjs` (new), docs/ARCHITECTURE.md source table.

## Lanes, model, order

Lanes: app.css. Model: Opus (> 300 lines; cascade order is easy to break silently). After: P4c. Runs beside P5a–P5c
and P4e (wave 8) when a slot frees. Before: R. When it merges, card style work stops sharing `app.css`.

- [next] #? opus lanes:app.css
