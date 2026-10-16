# 0.4 P4a: Card registry, and a DOM check every card move uses

Planned in the 0.4 planning pass (#135, ROADMAP "0.4"). Read CLAUDE.md, docs/ARCHITECTURE.md §2 and §4, and
`docs/design/0.4-engine-contract.md` (P0, "Card registry interface") first. Needs P2b merged.

## Problem

Every card is wired into `src/main.js` by hand: `render()` (line ~321) builds the static DOM, `update()` (~766) calls
`renderQuest`, `renderNow`, `renderNext`, `renderAhead`, `renderAreas`, … in a fixed list, and each card's static
markup sits in `src/index.html` (`spCard`, `dvBox`, `areas`, `routeCard`, `confCard`, `srcCard`, …). Any feature edits
the same file, which is why `main.js` is a serial lane.

## Result

- `src/core/cards.js`: the registry from P0 (`registerCard`, the order rule, `mountAll`, `updateAll`), pure (no DOM:
  it calls the cards' functions with the element the shell gives it).
- `render()` / `update()` call the registry for registered cards and the old list for the rest, in today's order.
- **Two cards through it as the proof:** Sources and Confidence (`renderSources`, the `srcCard` / `confCard` markup)
  move verbatim to `src/cards/sources.js` and register themselves.
- **`tests/support/dom-snapshot.mjs`**: writes `document.body.outerHTML` (and the stored save) for a fixed list of
  states (fresh; Lv 13, 27, 30, 45; Basic and Advanced; 390 and 1500 px) to a folder, and compares two folders. P4b,
  P4c and P5a–d use it: their PRs paste "identical" for the states.

## Appetite

M (100–300 lines; the moved card code counts once).

## No-gos

- No visible change and no DOM change (the snapshot check says identical).
- Don't move any other card (P4b, P4c).
- No change to `src/core/` other than the new `cards.js`; no render logic rewrite (verbatim moves only).

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] `tests/support/dom-snapshot.mjs` exists; the PR pastes the comparison of `main`'s build vs this branch: identical
      for every state.
- [ ] A `core` test for `cards.js`: registration order, mount once, update every time, an unknown slot rejected.
- [ ] Sources and Confidence render through the registry (`grep` shows no `renderSources` call left in `main.js`).
- [ ] Golden identical; `site`, `a11y`, `regress`, `e1`–`e4` green; `dist-artifact` still one file.
- [ ] docs/ARCHITECTURE.md §2 describes the registry.
- [ ] `npm test` green.

## Files (owns)

`src/core/cards.js` (new), `src/cards/sources.js` (new), `src/main.js`, `src/index.html`,
`tests/support/dom-snapshot.mjs` (new), `tests/core/cards.test.mjs` (new), docs/ARCHITECTURE.md §2.

## Lanes, model, order

Lanes: main.js. Model: Opus (src/core, engine interface). After: P2b. Beside P2c (wave 5). Before: P4b. `src/main.js`
belongs to P4a → P4b → P4c until P4c merges (review note 2 on #134).

- [next] #? opus lanes:main.js
