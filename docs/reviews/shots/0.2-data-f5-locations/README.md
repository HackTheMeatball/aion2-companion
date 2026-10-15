# Shots: F5 + story locations (branch data/f5-story-locations)

Next up stack (`#nsqWrap`, expanded to its full height for the shot) at 1500 px and 390 px, before (origin/main) and
after this branch. Saves (raw localStorage, as in tests/golden `special/pre-seeds-*`):

| Shot | Save | Change |
|---|---|---|
| `lv12-veiled-truth-*` | Lv 12, quest Veiled Truth | Sealed Dungeon pick: Abandoned One's Grave → Dusk Pit, "Calderon Canyon (near your story step)" (turn-in Quai Campsite) |
| `lv16-empyrean-monolith-*` | Lv 16, quest Empyrean Monolith | None: the turn-in zone (Shadow Hall) is still the placeholder, so no "near your story step" area |
| `lv22-verdant-melody-*` | Lv 22, quest Verdant Melody, objective 0 ticked (`qsteps`), talk-only steps hidden | Story card "Kibelisk: Odar's Shade (17 m)" only; no "near" area (turn-in zone Odar's Shade is the placeholder) |

The F5 part has no visible change (the unlock cost was already counted).

The `after` shots were re-taken after the PR #47 review fix (finding 1: "near your story step" follows the story
record's turn-in zone, never the Kibelisk's zone vote). The first round showed Empyrean Monolith as "Dredgion Crash
Site (near your story step)" and Verdant Melody as "Moslan Forest (near your story step)", both inferred from the
Kibelisk. Shot script: Playwright, the save as raw localStorage, `#nsqWrap` forced to its full height with an injected
stylesheet (`height: auto !important`).
