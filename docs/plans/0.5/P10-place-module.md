# 0.5 P10: Where the player is, and which Kibelisks are bound (not wired)

Planned in the 0.5 planning pass (#191, ROADMAP "0.5", lane A). Read CLAUDE.md, docs/ARCHITECTURE.md §1 ("Change times
and `merge()`"), docs/design/0.4-smart-next-up.md §4, §5 and §8.1, and docs/design/0.4-engine-contract.md §1, §2 and §5
first. Needs P8.

## Problem

`lastConfirmedLocation(c, locate)` (`src/core/sync.js`) reads only `mt.checks` stamps of Sealed Dungeons, strongholds
and regional quests (the pack's `locate`), and nothing on the page calls it. Story ticks, the story position and
pick-ups never move it. Nothing derives a bound Kibelisk.

## Result

- **Engine, `src/core/place.js`** (new, no game term): `whereNow(c)` scans every dated stamp that means "I was here"
  (design §4 table: `checks`, `started`, `qsteps`, `quest` / `storyEnd`, and the pack's own keys through a hook), the
  newest wins, a time tie breaks on the key as `lastConfirmedLocation` does; returns `{ via, t, zone, pt }` or `null`.
  `byPlace(here)` is the design §5 comparator (same zone, then straight-line distance on the same map, then catalog
  order). Place data comes from the pack (`definePack` gets an optional `place` field; a pack without it gets `null`
  everywhere).
- **AION 2 pack, `src/packs/aion2/travel.js`** (new): `bound(c, kib)` per design §8.1 (a visited point within
  `rule:kibelisk-bind-radius`, a `bind:<kib>` tick, or a `binds` fact), `nudgeOf` and `teleportOf` as pure functions of
  the save and the rules (§8.2, §8.3).
- Nothing on the page calls them yet.

## Appetite

M (100–300 lines plus core cases).

## No-gos

- Not wired into Next up or any card; no visible change; both builds' golden identical.
- `lastConfirmedLocation` and its tests unchanged. No stored location, no new save field.
- `src/core/place.js` holds no AION 2 term (P8 term scan of 0.4).

## Acceptance (review checklist: each line pass / fail with evidence)

- [ ] Core cases: each row of design §4's table moves `whereNow`; a time tie gives the same answer in both orders;
      no dated stamp gives `null`; deep-frozen input (paste test names).
- [ ] Core cases: Safe Haven bound by its `binds` fact at R = 25 m, not by distance; Abandoned Barracks Site bound at
      9 m; a cross-map pair gives "unknown" distance; ticking more never unbinds (paste).
- [ ] `whereNow(merge(a, b))` equals `whereNow(merge(b, a))` on the sync suite's pairs (paste).
- [ ] The fake game pack (0.4 P6) runs with no `place` (conformance green); term scan green; `npm test` green.

## Files (owns)

`src/core/place.js` (new), `src/core/pack.js` (the optional `place` field), `src/packs/aion2/travel.js` (new),
`src/packs/aion2/pack.js` (hands over the place data), `tests/core/place.test.mjs` (new),
`tests/core/travel.test.mjs` (new), `tests/support/core-bundle.mjs` (exports).

Ownership check: every acceptance line passes with these files.

## Lanes, model, order

Lanes: none. Model: Opus (`src/core/`).

After: P8.

- [next] #? opus lanes:none
