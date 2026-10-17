# 0.5 P8: Place data: Kibelisk registry, travel rules, place table

Planned in the 0.5 planning pass (#191, ROADMAP "0.5", lane A). Read CLAUDE.md (data and source policy),
docs/DATA-FORMAT-V2.md, docs/design/0.4-smart-next-up.md §3, §8.1, §8.4, §9 and §13 S1 (written before the engine split:
read its paths through ROADMAP 0.5 audit 2), docs/design/0.4-engine-contract.md §1, §5 and §8, and
docs/research/2026-10-kibelisks.md (with `data/research/kibelisks-2026-10.csv`) first.

## Problem

Smart Next up needs to know where each card sends the player and which Kibelisk is near it. Today Kibelisks are only
names: 53 distinct in story quests, 69 with regional quests, Sealed Dungeons and strongholds, and `zones[].kibelisks` is
`inferred` and disagrees with the quest data ("Safe Haven Cliff" vs "Safe Haven"). The travel numbers (bind radius,
nudge radius, teleport gain) exist only in DECISIONS.

## Result

- **Kibelisk registry** in the AION 2 game pack (`data/packs/aion2/asmodian/kibelisks.json`, new schema): one record per
  Kibelisk, id `kib:<slug>` frozen at creation (a rename changes `name`, never `id`), name, zone, map, sources (Metabot
  listing, per the research). Every `kibelisk` name any record uses resolves to one id (generator check in the pack's
  `checks.mjs`). `zones[].kibelisks` follows the registry or is dropped where they disagree (the PR lists each).
- **Rules:** `rule:kibelisk-bind-radius` 25 (the owner's working value, DECISIONS 2026-10-15; design §8.4),
  `rule:kibelisk-nudge-radius` 150, `rule:teleport-gain` 400.
- **`binds` facts** on two story objectives: Survival Supplies objective 0 → Safe Haven (`basis: owner`), A Village in
  the Fog objective 1 → Aldelle Village (step text).
- **Generator output** (in the AION 2 pack's compiled modules, `src/packs/aion2/data/`, nothing imports them yet): a
  place table keyed by GATE_GRAPH node id `{ route, zone, pts }` with neutral names (a point is `{ map, x, y, anchor,
  m }`; `anchor` is the Kibelisk id), and the Kibelisk table. GATE_GRAPH and its equivalence checks unchanged.
- **Report** (in `data/DATA_SOURCES.md` or a generated section the generator owns): the design §8.1 split (bound /
  nudge / none) for R = 25, 32, 35, 40 m from giver and turn-in points, and the owner check list: every story Kibelisk
  the rules can't bind from the data.

## Appetite

M–L (300–600 hand-written lines; the registry's records count).

## No-gos

- No story objective points (P9, after the research); no new fetch: the registry comes from the research already in
  the repo, and a Kibelisk no permitted source names is left out and listed.
- No engine or page code reads the new modules (P10 does); both builds byte-identical.
- No change to `requires` / `completesWith` / `is`, GATE_GRAPH, or any existing record's meaning; no aion2.th.gl data.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] `npm run gen` passes; `schema` suite rejects broken copies: an unknown Kibelisk name, a duplicate id, a `binds`
      without basis, a rule out of range (paste).
- [ ] Every Kibelisk name in story, regional, Sealed Dungeon and stronghold records resolves (count in the PR: 69 or
      the explained number).
- [ ] `dist/index.html` and `dist-artifact/index.html` sha256 equal before and after (paste).
- [ ] The R = 25 / 32 / 35 / 40 m table and the owner check list are generated (paste the table).
- [ ] Every new URL is in the Sources card and `data/DATA_SOURCES.md`; golden identical; `npm test` green.

## Files (owns)

`data/packs/aion2/asmodian/kibelisks.json` (new), `data/packs/aion2/asmodian/zones.json` (`kibelisks` fields),
`data/packs/aion2/asmodian/story-quests.json` (two `binds`), `data/packs/aion2/rules.json`, `data/packs/aion2/pack.json`,
`data/packs/aion2/checks.mjs`, `data/schema/kibelisks.schema.json` (new), `data/schema/story-quests.schema.json`
(`binds`), `data/schema/rules.schema.json`, their examples, `tools/gen/` (emit the two tables), `tests/schema.mjs`,
`data/DATA_SOURCES.md` (regenerated).

Ownership check: every acceptance line passes with these files.

## Lanes, model, order

Lanes: gen. Model: Opus (generator and schemas). First in lane A.

After: nothing.

- [next] #? opus lanes:gen
