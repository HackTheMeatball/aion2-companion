# 0.4 P4c: Engine cards move out of the page script; `main.js` is the shell

Planned in the 0.4 planning pass (#135, ROADMAP "0.4"). Read CLAUDE.md, docs/ARCHITECTURE.md §2 and §4,
`docs/design/0.4-engine-contract.md` (P0) and P4a's registry first. Needs P4b merged.

## Problem

After P4b, `src/main.js` still holds the engine's cards: Next up (`renderNow`, `nowCard`), the milestone cards and
Route rules (`render`, `cardHTML`, counts and tags), Journey (`renderQuest`, `renderStoryReqs`, `renderStoryChips`,
`renderQuestSubs`, `renderAscension`), Later (`renderAhead`) and Undo (`renderUndo`). Until they are files of their own,
the P5 items would all edit `main.js` and run one at a time.

## Result

Each moves **verbatim** into `src/cards/<card>.js` (`nextup.js`, `milestones.js`, `route.js`, `journey.js`, `ahead.js`,
`undo.js`) and registers through the registry. `renderAscension` goes to `src/packs/aion2/cards/ascension.js` (an AION 2
section of the Journey card; P5c makes it a pack section). `src/main.js` keeps the shell only: load and save, the
pack wiring, `update()` calling the registry, layout fitting (`fitRail`), the header, export / import, *Report a
problem*.

## Appetite

L (300–1,000 lines, moved blocks counted once). Over 1,000: stop after a whole card, push green, name the rest.

## No-gos

- Verbatim, as P4b (no renamed globals, no logic change, no restyle). AION 2 terms may remain inside `src/cards/`;
  P5a–d remove them.
- No change to `src/core/` (the registry is P4a's), `src/packs/aion2/cards/` (P4b's) or `src/styles/app.css`.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] P4a's DOM snapshot: identical for every state (paste).
- [ ] `src/main.js` defines no `render*` card function (paste `grep -n "^function render" src/main.js`: only the
      registry calls or nothing).
- [ ] The PR pastes `wc -l src/main.js` and lists what is left in it by area (each area shell, not a card).
- [ ] Golden identical; `site`, `a11y`, `regress`, `journey`, `gates`, `e1`–`e4` green; the Next up pop-out
      (Document Picture-in-Picture) still works (`regress`' pop-out check).
- [ ] docs/ARCHITECTURE.md §2 and the source table describe the shell and `src/cards/`.
- [ ] `npm test` green.

## Files (owns)

`src/main.js`, `src/index.html`, `src/cards/**` (new files), `src/packs/aion2/cards/ascension.js` (new),
docs/ARCHITECTURE.md.

## Lanes, model, order

Lanes: main.js. Model: Opus (> 300 lines). After: P4b. Runs alone in wave 7. Before: P5a–d. When it merges, `main.js`
stops being every card's file (review note 2 on #134).

- [next] #? opus lanes:main.js
