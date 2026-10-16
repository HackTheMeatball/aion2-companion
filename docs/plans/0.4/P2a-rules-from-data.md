# 0.4 P2a: Game rules read from pack data, not copied in code

Planned in the 0.4 planning pass (#135, ROADMAP "0.4"). Read CLAUDE.md, docs/ARCHITECTURE.md §3–4 and
docs/DATA-FORMAT-V2.md first. Needs P1 (pack folders) merged.

## Problem

AION 2 numbers that are already verified data are written a second time in code, so the data and the app can drift
and a second game can't supply its own:

| Code | Data that already holds it |
|---|---|
| `src/data/build.js:15` `spCost` (1 / 2 / 4 points by skill level) | `rule:skill-point-cost` |
| `src/data/build.js:17` `SPEC_SLOT_LV = [8, 12, 20]` | `rule:specialty-slots` `value.slots` |
| `src/data/build.js:44` `DV_MIN = { p: 2, a: 3, c: 4 }` | `rule:node-costs` (`passive`, `active`, `corner`) |
| `src/data/build.js:45` `ST_COST` (1 / 2 / 4 / 8 shards, none past 20) | `rule:stigma-shard-cost` |
| `src/core/catalog.js:52-57`: milestones `g19` ("Skill tier: level 8") and `g28` ("Heart Gore 10 and Urugugu Canyon", item `g28:exp`) with their guide text | nothing: guide text in code |

## Result

The generator compiles the four rules into constants (for example `RULE_SKILL_POINT_COST`, `RULE_SPEC_SLOTS`,
`RULE_NODE_MIN`, `RULE_SHARD_COST`, or one `RULES` table); `build.js` builds `spCost`, `SPEC_SLOT_LV`, `DV_MIN` and
`ST_COST` from them, with the same names and results. `g19` and `g28` become records in the guide pack's
`guide/milestones.json`, with their text as data (text tokens such as `[[tip:expedition|Expedition]]` in place of
`T(…)`), and `catalog.js` no longer pushes them.

## Appetite

S–M (about 100–200 lines).

## No-gos

- No value changes: every function returns what it returns today for every input it gets (levels 1–20 for shards,
  2–10 for skill points).
- `g28:exp` keeps having **no gate node** (`openSteps` relies on that, `src/core/requirements.js:321-322`). If the
  generator would emit one for a milestone item, mark the item so it doesn't, and document the field.
- Don't touch `src/main.js`, `src/index.html`, `src/data/markup.js` or the map links (they move with their cards in
  P4b), nor `src/core/state.js`, `migrations.js`, `sync.js`, `backup.js` (P3b / P3c own them).
- No new data values, no change to `GATE_GRAPH` for any existing node.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] `grep -rnE "L <= 4 \?|L <= 5 \?|\[8, 12, 20\]|p: 2, a: 3" src/` finds nothing (paste).
- [ ] `catalog.js` has no milestone text; `g19` and `g28` come from `guide/milestones.json`.
- [ ] A new `core` test compares `spCost(L)` for L 2–10, `ST_COST(L)` for L 1–21, `SPEC_SLOT_LV` and `DV_MIN` with the
      values of `main` (pinned in the test).
- [ ] `GATE_GRAPH` from `main` and from this branch have the same nodes (compare `Object.keys` and each node's `req`;
      paste the counts).
- [ ] Golden identical without re-record; `equiv`, `invariant`, `gates` green.
- [ ] `data/DATA_SOURCES.md` regenerated if it changed; `npm test` green.

## Files (owns)

`src/data/build.js`, `src/core/catalog.js`, `data/packs/aion2/asmodian/assassin/guide/milestones.json`, the milestone
schema if a field is added, `tools/gen/**`, the new core test.

## Lanes, model, order

Lanes: gen, gates (milestone records; the generator). Model: Opus (generator, schema, core). After: P1. Runs beside P0
and P7 (wave 2). Shares no file with P3b / P3c (review note 1 on #134).

- [next] #? opus lanes:gen,gates
