# 0.5 P17: Characters in the engine: add, switch, rename, remove (not wired)

Planned in the 0.5 planning pass (#191, ROADMAP "0.5", lane C). Read CLAUDE.md, docs/ARCHITECTURE.md §1 (save v5),
`src/core/state.js`, docs/design/0.4-engine-contract.md §2 and §9 (a pack without `character`), and
docs/design/sync.md (slots and merge) first.

## Problem

Save v5 (0.4 P3c) holds one slot per character (`chars`, `current`, random slot ids, `labelOf`), but nothing can add,
switch, rename or remove a character, and a new character always gets the pack's one `character` (`newChar`). The
class picker needs to know which classes have a guide.

## Result

- Pure functions in the engine (`src/core/chars.js`, new): `addChar(state, { class, name, now, id })` (the new slot
  becomes current), `switchChar(state, id)`, `renameChar(state, id, name)` (trimmed, length-capped),
  `removeChar(state, id)` (never the last one; `current` moves to another slot). Each returns the changed state and
  never touches another slot.
- The pack lists its playable classes: `definePack` gets an optional `classes: [{ class, pack, name }]`; the AION 2 pack
  lists the Assassin only (the one class with a guide pack; no new game data). A pack without it falls back to
  `character`.
- `newChar` takes the class and guide pack from the chosen entry.

## Appetite

M (100–300 lines with core cases).

## No-gos

- No UI (P18, P19); no save break (key `companion-save-v5`, same shape); no class without a guide pack.
- The name never goes into a storage key, file name, URL, the Report a problem link or a log (0.4 no-go, ROADMAP 0.4
  review note 5); slot ids stay random, never derived from the name, class or level.
- No change to `merge()` (sync is 0.6): the PR states what merge does with a removed slot today (a slot on one side
  only is kept, so a removed character can come back from another device's save) as a finding for 0.6.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] Core cases: add / switch / rename / remove, remove of the last refused, other slots byte-identical after each
      call, deep-frozen input not written (paste test names).
- [ ] A slot id never contains the name, class or level (property test over 1,000 random names; paste).
- [ ] The fake game pack (0.4 P6) with no `classes` still passes conformance (paste).
- [ ] `core`, `save`, `sync` suites green; golden identical; term scan green; `npm test` green.

## Files (owns)

`src/core/chars.js` (new), `src/core/state.js` (`newChar`'s inputs), `src/core/pack.js` (`classes`),
`src/packs/aion2/pack.js` (its `classes`), `tests/core/chars.test.mjs` (new), `tests/support/core-bundle.mjs` (exports).

Ownership check: every acceptance line passes with these files.

## Lanes, model, order

Lanes: none. Model: Opus (save code, `src/core/`). First in lane C.

After: nothing.

- [next] #? opus lanes:none
