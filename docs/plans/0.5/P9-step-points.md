# 0.5 P9: Story objective points

Planned in the 0.5 planning pass (#191, ROADMAP "0.5", lane A). Read CLAUDE.md (data and source policy),
docs/design/0.4-smart-next-up.md §3, §8.1 and §9, docs/research/2026-10-location-coverage.md §3, and the step-points
research (ROADMAP 0.5 "Alongside": `docs/research/2026-10-story-step-points.md`) first. Needs P8.

## Problem

0 of the 432 story objective lines carry a point; 240 carry only a `(Kibelisk: X)` marker. Without them, "where is
the player" after an objective tick is a zone at best, and 15 story Kibelisks that appear only in objective markers
can't be judged bound or not.

## Result

Each story objective the research found a Metabot step marker for gets an optional `at { map, x, y, kibelisk, meters,
sources }` (about 185 markers on 51 quests; "via Selvis" lines have none). The place table (P8) gains the objective
points; the design §8.1 split and the owner check list are regenerated with them.

## Appetite

M–L (the `at` blocks count; the generator part is under 100 lines).

## No-gos

- No fetching in this build: the values come from the research file, each with the source page it names. A marker the
  research didn't confirm is left out (listed in the PR).
- No change to objective text, order or count (save keys `qsteps` index objectives); no engine or page code.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] Every `(Kibelisk: X)` marker on an objective with `at` equals its `at.kibelisk` (generator check; a broken copy
      fails; paste).
- [ ] `at` without a source is rejected by the schema (paste); every new URL in the Sources card and
      `data/DATA_SOURCES.md`.
- [ ] The regenerated §8.1 table and owner check list (paste; the number of marker-only Kibelisks drops from 15).
- [ ] Both builds byte-identical if P10 hasn't wired the table yet, else golden identical; `npm test` green.

## Files (owns)

`data/packs/aion2/asmodian/story-quests.json` (`steps[].at`), `data/schema/story-quests.schema.json`, its example,
`data/packs/aion2/checks.mjs` (the marker check), `tools/gen/` (points into the place table), `tests/schema.mjs`,
`data/DATA_SOURCES.md` (regenerated).

Ownership check: every acceptance line passes with these files and the research file.

## Lanes, model, order

Lanes: gen. Model: Opus (generator and schema). Waits for the research, which runs in a cloud research session (it
needs the web; a bot build has none). The planner queues this item when the research PR has merged.

After: P8, research-step-points.

- [next] #? opus lanes:gen
