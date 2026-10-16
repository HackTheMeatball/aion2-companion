# Release 0.4.0 (Engine and packs)

Planned in the 0.4 planning pass (#135, ROADMAP "0.4"). Read CLAUDE.md ("Saved progress", releases), ROADMAP
"Versioning", docs/DEPLOY.md and the CHANGELOG format note at the top of CHANGELOG.md first. Starts only when every
0.4 item (P0–P8; S0 is docs and doesn't gate it) has merged.

## Problem

0.4 is invisible except for one thing: saved progress resets (P3c). Players must read that in the release notes.

## Result

One commit: `version` 0.4.0 in `package.json` and both entries of `package-lock.json`, and a `## 0.4.0 — <date>`
CHANGELOG section with a one-line summary (release-notes check: 80 characters at most) and, in the order the format
note gives:

- **Changed:** the app is split into an engine and AION 2 packs; nothing on screen changes (one line, no internals
  beyond that).
- **Saved progress:** "Saves reset in this version." Progress saved by 0.3.0 or earlier isn't loaded; it stays in the
  browser untouched. Backup files exported before 0.4.0 can't be imported. The storage key is now
  `companion-save-v5`.

Also update the CHANGELOG header paragraph, which still says every version loads every earlier save under
`aion2-assassin-route-v4`: from 0.4.0 the key is `companion-save-v5`, and 0.4.0 reset saves (pre-1.0 rule, CLAUDE.md).

## Appetite

S.

## No-gos

- No code, data or test change; no other CHANGELOG section edited.
- Don't describe internals beyond one line; don't promise when saves become strict (ROADMAP says 1.0).

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] `package.json` and `package-lock.json` say 0.4.0 (paste the `grep`).
- [ ] The 0.4.0 section has "Saves reset in this version." under Saved progress, the old-export line and the new key.
- [ ] Every claim in the section matches merged code: the key in `src/core/state.js`, the import message in the
      import code, the untouched v4 entry in the `save` suite (cite file:line for each).
- [ ] The CHANGELOG header paragraph no longer says every version loads every earlier save.
- [ ] `npm test` green (it runs the release-notes check).

## Files (owns)

`package.json`, `package-lock.json`, `CHANGELOG.md`.

## Lanes, model, order

Lanes: release, alone. Model: Sonnet (version and notes). After: everything in 0.4. Runs alone.

- [next] #? sonnet lanes:release alone
