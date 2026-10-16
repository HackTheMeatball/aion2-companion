# 0.4 P3c: Save v5: neutral key, one slot per character, clean break

Planned in the 0.4 planning pass (#135, ROADMAP "0.4"). Read CLAUDE.md ("Saved progress (pre-1.0: clean breaks
allowed)"), docs/ARCHITECTURE.md §1 and §5, and `src/core/{state,migrations,sync,backup}.js` first. Needs P1, P3a and
P3b merged.

## Problem

The save is shaped for one Assassin: the key names the game and the class (`aion2-assassin-route-v4`), the character's
fields sit at the top level (`char(state)` returns the save itself, `src/core/state.js:18`), and `src/core/migrations.js`
carries ten load-time steps for saves from before 0.3, including one player's skill levels (`:30`). The owner decided
(2026-10-16, ROADMAP "Plan", decision #2) on one clean break now, before characters arrive in 0.5.

## Result

- **Key** `companion-save-v5` (and `companion-save-v5:before-import`). No game, class or player name in it.
- **Shape** (top level): `v: 5`, `savedAt`, `current` (a slot id), `chars` (slot id → character), the view settings as
  today (`mode`, `open`, `hide`, `hideCards`, `hideOpt`, `areaLv`, …), `backup` (per device, not synced, as today).
- **Character** (`chars[id]`): `id` (random, stable: `crypto.randomUUID()`, injectable for tests), `pack`
  (`aion2/asmodian/assassin`, P1's manifest id), `class` (the class pack's id, `assassin`), `name` (`""` until 0.5 lane
  C adds an input), `created`, then today's `CHAR_FIELDS` (`checks`, `level`, `quest`, …, `mt`).
- **`char(state)`** returns `state.chars[state.current]`; every caller already goes through it.
- **Label** `labelOf(char)` = `<name>-<class>-lvl<level>` (owner, 2026-10-16), with the name part left out while the
  name is empty: `assassin-lvl30`. Derived on read, **never stored**. A level-up changes the label, never the id.
- **`merge(local, remote)`** works per slot id: a slot on one side only is kept; a slot on both sides merges as today
  (per-item change times); view settings stay local; `backup` is never merged.
- **Load:** no v5 save → a fresh one: one slot, Lv 1, the first story quest, cleared milestones folded (today's fresh
  start). The v4 key is **never read**: not to migrate, not to detect, not to warn. Its data stays in storage untouched.
- **Import** accepts a v5 export only. Any other file (a pre-0.4 export included) gets "This file is from a version
  before 0.4 and can't be loaded." and nothing changes. The export file name is `companion-save-<date>.json`.
- **Load-time steps kept:** the fresh start; the story-end move-on (data growth, not a save shape); the stigma pick
  pinning (P2b moves it to the pack). **Removed** (obsolete with no old saves): `migV5` and `src/data/migrations.js`
  (`MIG_V5`), the player seeds `seedLv12` / `stTriniel1` / `dvReset1`, `eputSync1`, `g45Split1`, `stampV1` (a v5
  save is born with `mt`; `stampSave` on every write stays), `backup1` (a new save gets `backup.since` when created).
  `ONE_TIME_FLAGS` in `sync.js` follows. `data/**/retired.json` keeps every retired key (keys are never reused).

## Tests (CLAUDE.md: remove obsolete checks, say why, keep a fresh-start test)

- **Removed, because no pre-0.4 save is ever read again:** `mig1` (`tests/e1-migtest.js`, its pinned
  `tests/fixtures/e1-migtest-expected.json`), `mig2` (`tests/e2-migtest.js`), the baselines `tests/baselines/v285.html`
  and `v287.html` if nothing else uses them, the migration cases in `tests/core/migrations.test.mjs` for the removed
  steps. Say so in the commit.
- **New `save` suite** (browser, in the `golden` shard in place of `mig1` + `mig2`; `ci.yml` unchanged because the
  shard names don't change): fresh browser → Lv 1, first quest, only the v5 key written; a v4 save present → the app
  starts fresh, no page error, the v4 entry byte-identical afterwards and `getItem` never called with the v4 key (spy on
  `Storage.prototype.getItem`); v5 round trip (save, reload, identical text); import of a v4 export refused with the
  message and the state unchanged; import of a v5 export replaces the save and keeps `:before-import`; Level up changes
  `labelOf` and not the slot id or the key.
- **`core`:** `char()` on v5, `labelOf` (with and without a name), `merge()` per slot (one-sided slots, both sides,
  view settings local), the fresh-start shape, `newId` injected.
- **Fixtures:** P3a's `toStored(flat)` wraps a flat test state into v5; `journey`, `regress`, `e1`–`e4`, `gates`,
  `a11y`, `golden` run on it (P3a already moved the user's-save suites off the v285 baseline onto flat fixtures). That's fixture conversion in the tests; the app never sees an old shape.
- **Golden:** the stored-state part of every snapshot changes once (new shape). Run `node tests/golden.js --explain`
  first: Next up, milestone headers, Journey and the Dungeons card must show **no** difference; then
  `--record` and commit the snapshots with the reason.

## Appetite

L (300–1,000 hand-written lines; deleted files and re-recorded snapshots don't count).

## No-gos

- **The player name and the label never leave the save unencrypted** (review note 5 on #134): no name or label in a
  storage key, the export file name, a URL, the *Report a problem* link or a log, and the slot id is random, never
  derived from the name, class or level. Sync (S0) carries them only inside the encrypted payload.
- No UI: no name field, no character switcher, no class picker (0.5 lane C). Nothing new on screen except the import
  message for old files.
- No migration from v4 of any kind, no "your old progress" notice (CLAUDE.md: a clean break).
- Don't touch render code, `src/core/requirements.js`, `catalog.js`, `nextup.js` (P2a / P2b / P2c's).
- No change to the service worker cache names.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] `grep -rn "aion2-assassin" src/` finds nothing (paste).
- [ ] The `save` suite exists, runs in the `golden` shard, and covers each case listed under Tests (name each check).
- [ ] `tests/run.mjs --check-shards` passes.
- [ ] `core` covers `char()`, `labelOf`, per-slot `merge()`, fresh start.
- [ ] `golden --explain` output shows only stored-state differences (paste its summary), then the re-recorded
      snapshots are committed with the reason.
- [ ] `journey` reaches Lv 45 on the v5 fixture.
- [ ] No name or label in a key, file name, URL or the report link (a `core` or `site` check, not only a review).
- [ ] docs/ARCHITECTURE.md §1 (key, fields, load steps, Import), PRIVACY.md (key, what is stored) and CLAUDE.md's
      "Saved progress" key example describe v5.
- [ ] The PR body says "Saves reset in this version" for the 0.4.0 CHANGELOG (item R writes it).
- [ ] `npm test` green.

## Files (owns)

`src/core/{state,migrations,sync,backup}.js`, `src/data/migrations.js` (deleted), the save and import area of
`src/main.js`, `tests/support/save.js` (`toStored`), `tests/save.js` (new), `tests/run.mjs` (suite list, shards),
`tests/core/{state,migrations,sync,backup}.test.mjs`, the removed mig files and baselines, `tests/golden/snapshots/`,
docs/ARCHITECTURE.md §1, PRIVACY.md, CLAUDE.md (one example line).

## Lanes, model, order

Lanes: main.js, mig, golden. Model: Opus (save, storage, migrations, golden re-record). After: P1, P3a, P3b. Before:
P2b, P6, R. Wave 3, beside S0. Shares no file with P2a (review note 1 on #134).

- [next] #? opus lanes:main.js,mig,golden
