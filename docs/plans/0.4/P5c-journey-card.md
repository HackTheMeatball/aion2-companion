# 0.4 P5c: Journey card without AION 2 terms; the Ascension bar as a pack section

Planned in the 0.4 planning pass (#135, ROADMAP "0.4"). Read CLAUDE.md, docs/ARCHITECTURE.md §2,
`docs/design/0.4-engine-contract.md` (P0: card sections, the term list) first. Needs P4c merged.

## Problem

After P4c the Journey card (`renderQuest`, `renderStoryReqs`, `renderStoryChips`, `renderQuestSubs`) lives in
`src/cards/journey.js`; it still names AION 2 things (Kibelisk objectives, Hero / Ascension quests) and calls the
Ascension bar, which is AION 2 only (`src/packs/aion2/cards/ascension.js` after P4c).

## Result

The engine Journey card draws the story timeline, the current quest, its objectives and the story chips from the
pack's story data; AION 2-only parts (the Ascension bar, Kibelisk objective hints) are pack sections the card mounts
through the registry (P0: a card may have pack sections in named slots). Output identical.

## Appetite

M (100–300 lines).

## No-gos

- No visible or DOM change (P4a's DOM snapshot identical), no restyle, no new text.
- No change to story order, objective indices or `qsteps` / `qsub` keys.
- Don't touch `src/main.js`, other cards, `src/styles/app.css`, `src/core/`.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] P0's term scan over `src/cards/journey.js`: 0 hits (paste).
- [ ] P4a's DOM snapshot: identical for every state (paste).
- [ ] Golden identical (the Journey card is in the snapshots); `journey` (to Lv 45, the Lv 44 edge), `regress`,
      `e1`–`e4`, `a11y` green.
- [ ] `npm test` green.

## Files (owns)

`src/cards/journey.js`, `src/packs/aion2/cards/ascension.js`, `src/packs/aion2/cards/journey-sections.js` (new, if
needed).

## Lanes, model, order

Lanes: none. Model: Opus (story objective keys are save keys). After: P4c. Runs beside P5a and P5b (wave 8).

- [next] #? opus lanes:none
