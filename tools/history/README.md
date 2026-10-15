# One-time patch scripts (provenance only)

`e2-patch.py` and `e4-patch.py` are the code/text edits of the E2 (v287 → v288) and E4 (v290 → v291) passes, each an exact
single-match replacement on the single-file app of that time (`assassin-route.html`). They read `assassin-route.html` from the working
directory (the backup from before that pass) and are already applied to `src/index.html`; run against it, they stop at
the first edit because the original text no longer exists. Kept to explain why the code looks
the way it does; see CHANGELOG.md for the summary.

- `v2-convert/convert.mjs` (0.2 step 5b): the one-time v1 → v2 data conversion; `conversion-log.txt` lists every value
  that moved between sources of truth. `v1-data/`: the two v1 files nothing read (`locations.json`,
  `current-areas-quests.json`), kept for the zone task (DATA-FORMAT-V2 §9).
- `v2-corrections/2026-10-14.mjs`: the data corrections and additions applied right after the conversion (aion2.th.gl
  re-sourced, Ishalgen, the owner's unlock screens, Metabot locations, specialty choices); `changes.txt` lists each one.
