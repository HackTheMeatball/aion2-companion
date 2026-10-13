# Data generator

`gen.py` turns `data/*.json` into the page's generated data block, `gen-block.js` (between `/* E2-GEN START */` and
`/* E2-GEN END */`). Nothing is written into `src/`: `npm run build` makes the module `src/data/generated.js` from the
block (adding an `export { … }` list of its constants) and bundles it with the code that imports it.

```sh
npm run gen         # python3 -I tools/gen/gen.py   (from the repo root)
npm run gen:check   # the same, then fails if gen-block.js, gen-report.json or DATA_SOURCES.md changed (CI runs it)
```

- `gen-block.js` — the generated block (committed; `tests/e4test.js` checks the built page has its values).
- `gen-report.json` — every consistency check (405, all must pass; `gen.py` exits 1 otherwise) and warnings.
- `../../data/DATA_SOURCES.md` — every source URL, the data records that cite it, and its Sources-card group.
- `snapshots/` — data from earlier page versions the generator still reads (AREA_LOC and Sources before E2, Sealed
  Dungeon zones before E3).

After regenerating: review `git diff tools/gen/gen-block.js data/`, then `npm test`.
