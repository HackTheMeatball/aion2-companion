# One-time patch scripts (provenance only)

`e2-patch.py` and `e4-patch.py` are the code/text edits of the E2 (v287 → v288) and E4 (v290 → v291) passes, each an exact
single-match replacement on the single-file app of that time (`assassin-route.html`). They read `assassin-route.html` from the working
directory (the backup from before that pass) and are already applied to `src/index.html`; run against it, they stop at
the first edit because the original text no longer exists. Kept to explain why the code looks
the way it does; see CHANGELOG.md for the summary.
