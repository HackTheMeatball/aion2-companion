# 0.4 P4b: AION 2 cards move into the game pack, unchanged

Planned in the 0.4 planning pass (#135, ROADMAP "0.4"). Read CLAUDE.md, docs/ARCHITECTURE.md §2 and §4,
`docs/design/0.4-engine-contract.md` (P0) and P4a's registry first. Needs P4a merged.

## Problem

The AION 2 cards are the bulk of `src/main.js`: Skills, Daevanion and Stigmas (`renderNext`, `renderDaevanion`,
`renderStigma`), the Build drawer (`renderStacks`, `renderRotation`, `renderCollection`), the Cube (`renderCube`) and
Dungeons & Strongholds (`renderAreas`), with their markup in `src/index.html` (`spCard`, `dvBox`, `areas`, …), their
event handlers and the Metabot map links (`main.js:61-62`, `:257`, `:494`; `index.html:106`). They are the game pack's
own cards.

## Result

Each of those cards moves **verbatim** (code, markup, handlers, helpers only it uses) into
`src/packs/aion2/cards/<card>.js` and registers through P4a's registry. Shared helpers stay where they are or move to
`src/packs/aion2/` if only pack cards use them. `src/main.js` keeps no code of these cards.

## Appetite

L (300–1,000 lines, counting each moved block once). If it heads over 1,000, stop after a whole card, push green, and
the PR names the cards left for a follow-up item.

## No-gos

- Verbatim: no rename of a global the page or tests call (`counts`, `STIGMA_SLOTS`, `rqAvail`, `stNames`, `stPlan`, inline
  `onclick` names: ARCHITECTURE §4), no logic change, no restyle.
- Don't make these cards "clean modules" (explicit inputs, no globals); that waits until a feature touches them.
- Don't move engine cards (Next up, Journey, milestones, Route rules, Undo: P4c).
- No `src/styles/app.css` change.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] P4a's DOM snapshot: identical for every state (paste).
- [ ] `grep -n "function render\(Next\|Daevanion\|Stigma\|Stacks\|Rotation\|Collection\|Cube\|Areas\)" src/main.js`
      finds nothing; each is in `src/packs/aion2/cards/`.
- [ ] `grep -n "metabot.gg" src/main.js src/index.html` finds nothing.
- [ ] Golden identical; `site`, `a11y`, `regress`, `journey`, `e1`–`e4` green; `dist-artifact` still one file.
- [ ] `npm test` green.

## Files (owns)

`src/main.js`, `src/index.html`, `src/packs/aion2/cards/**` (new), docs/ARCHITECTURE.md source table.

## Lanes, model, order

Lanes: main.js. Model: Opus (> 300 lines). After: P4a. Beside P6 (wave 6). Before: P4c.

- [next] #? opus lanes:main.js
