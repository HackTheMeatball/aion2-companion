# Release 0.5.0 (Smart Next up and the phone layout)

Planned in the 0.5 planning pass (#191, ROADMAP "0.5"). Read CLAUDE.md, docs/team/qa-release.md ("Changelog format"),
docs/DEPLOY.md and ROADMAP "Versioning" first. Runs alone, after every other 0.5 item has merged.

## Problem

0.5's items go live as they merge; the version, CHANGELOG section, tag and GitHub Release come last.

## Result

`package.json` / `package-lock.json` at 0.5.0 and a `## 0.5.0 — <date>` CHANGELOG section in the fixed order (Added,
Changed, Fixed, Data, Accessibility, Removed, Action required, Known issues, Saved progress), written from the merged
items: Next up order and travel help, tracks and band labels as shipped, the phone layout, characters, the `fitRail()`
fix (#105), the Kibelisk and step-point data with its sources. The 195 px known issue is dropped if P7 fixed it.
Saved progress: no reset expected (0.5 adds keys only inside `companion-save-v5`: `bind:<kib>` checks, `track`,
`preferRun`, `fold_<id>`, more character slots); if any merged item broke saves, the section says "Saves reset in this
version" (CLAUDE.md).

## Appetite

S.

## No-gos

- No code or data change; no item's scope finished here; nothing not merged is listed.

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] `scripts/release-notes.mjs` passes on the new section (paste).
- [ ] Every 0.5 item issue is closed and named under the right heading; nothing listed that didn't merge (paste the
      list with PR numbers).
- [ ] The Saved progress section matches the save code at the head (key, any reset) (paste).
- [ ] `npm test` green.

## Files (owns)

`package.json`, `package-lock.json`, `CHANGELOG.md`.

Ownership check: every acceptance line passes with these files.

## Lanes, model, order

Lanes: release, alone. Model: Sonnet.

After: everything.

- [next] #? sonnet lanes:release alone
