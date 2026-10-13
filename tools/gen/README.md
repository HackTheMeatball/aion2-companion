# Data generator

`gen.py` turns `data/*.json` into the page's generated data block; `apply.py` puts it into `src/index.html` between
`/* E2-GEN START */` and `/* E2-GEN END */`.

```sh
npm run gen    # python3 -I tools/gen/gen.py && python3 -I tools/gen/apply.py   (from the repo root)
```

- `gen-block.js` — the generated block (committed; `tests/e4test.js` checks the page carries it).
- `gen-report.json` — every consistency check (405, all must pass; `gen.py` exits 1 otherwise) and warnings.
- `../../data/DATA_SOURCES.md` — every source URL, the data records that cite it, and its Sources-card group.
- `snapshots/` — data from earlier page versions the generator still reads (AREA_LOC and Sources before E2, Sealed
  Dungeon zones before E3).

After regenerating: review `git diff src/index.html data/`, then `npm test`.
