# 0.4 P3b: Storage adapter (same key, same bytes)

Planned in the 0.4 planning pass (#135, ROADMAP "0.4"). Read CLAUDE.md ("Saved progress"), docs/ARCHITECTURE.md §1
(State, Import) and §4 first.

## Problem

The page calls `localStorage` directly (`src/main.js:125` load, `:132` `storeState`, `:1826` / `:1830` import). A store
app (ROADMAP "Moved out") needs native storage, because iPhone Safari can clear site data after weeks unused, and
tests can't swap storage without a browser. P3c also needs one place where the key lives.

## Result

- `src/core/storage.js`: the interface `{ get(key) → string | null, set(key, text) → true | false, remove(key) }`
  (synchronous) and `memoryStorage()` for Node tests. Pure: no browser access (the purity test covers it).
- `src/shell/storage-web.js`: the `localStorage` adapter. `set` returns false where `setItem` throws today, so the
  "couldn't be saved" banner works as before.
- `src/main.js` loads, stores and imports through the adapter. The key and the stored text stay exactly as they are.

## Appetite

S–M (about 80–150 lines).

## No-gos

- No key, shape or byte change in what is stored: golden identical, `mig1` / `mig2` green with no pin change.
- No async storage. A store app later reads the save into memory before start-up; that's its own item.
- `src/site.js`'s `sessionStorage` "persist asked" flag stays as it is (it's not the save).
- Don't touch `src/core/state.js`, `migrations.js`, `sync.js` (P3c's), nor render code.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] `grep -rn "localStorage" src/` finds only `src/shell/storage-web.js` and comments (paste).
- [ ] `core` tests for `memoryStorage` (get / set / remove, `set` false when full) and the purity test covering
      `src/core/storage.js`.
- [ ] The `site` suite's save-failure banner check passes unchanged.
- [ ] Golden identical; `mig1`, `mig2`, `journey`, `e1` green; `dist-artifact` still one file.
- [ ] docs/ARCHITECTURE.md §1 names the adapter.
- [ ] `npm test` green.

## Files (owns)

`src/core/storage.js` (new), `src/shell/storage-web.js` (new), the save area of `src/main.js` (load, `storeState`,
import), `tests/core/storage.test.mjs` (new), docs/ARCHITECTURE.md §1.

## Lanes, model, order

Lanes: main.js. Model: Opus (storage). After: nothing. Before: P3c. Wave 1, beside P1 and P3a.

- [next] #? opus lanes:main.js
