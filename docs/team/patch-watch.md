# Patch watch

A routine for when AION 2 patches. Owner: Data & Research ([data-research.md](data-research.md)). The fetching policy
there and in CLAUDE.md is authoritative; this file only applies it.

## 1. Trigger

Start when any of these happens: Metabot's game build changes (`data/game-builds.json` records `0.0.4387.0`, first seen
2026-10-14), a patch note is published, or a player report says the game changed. Record the new build next to the
re-check date.

## 2. Where to look

Use only sources in `data/sources.json` (`records[]`). Read the record's `access` and `use` first.

| Source | Use |
|---|---|
| Metabot (metabot.gg) | First choice. Quest, skill and Daevanion pages. Terms allow scripted reads with a dofollow link to the page; robots.txt excludes `/api/` and player profiles. |
| aion2.gaming.tools | Game database. Cloudflare challenge: the owner reads it by hand in a browser. |
| Wikily | `bans-automation`: the owner reads it by hand. |
| The owner's in-game screens | Source of truth. Outranks every other source. |
| Sites marked `human-only` | Owner by hand only. |

Never read: **aion2.th.gl** (robots.txt excludes AI agents; `withdrawn`) and **Game8** (`banned`). Facts that came from
th.gl are re-verified against a permitted source and attributed to it.

Fetch rules: read terms and robots.txt before any content page. Our own honest User-Agent. At most 12 requests a minute
per host, one at a time, 24 h cache. Stop at the first 403, 429 or challenge page and tell the owner; never work around
one. A site that only bans scraping gets a few spot checks, 5 s apart, facts only.

## 3. What to re-verify

Work from `verifiedAt` (oldest first) and the build. Check in this order:

1. **Level gates**: story and regional quest levels, `noPre` quests, unlock levels, Sealed Dungeon entry levels, the four
   Ascension quests (Lv 5, 22, 32, 45).
2. **Quest givers and locations**: giver, zone, turn-in NPC, prerequisite and unlock links (confirm from both ends).
3. **Skill and stigma values**: skill levels, unlock levels, costs, stigma slots, Daevanion board nodes and costs.
4. **Rewards and items** that the guide text names.
5. **Guide text** (`tips.json`, `steps.json`, `milestones.json`) that depends on any record above.

Do not change ids or keys. A removed record is retired in `data/retired.json`, never reused (CLAUDE.md). Check that no
change can touch saved progress; if one can, flag it for Engineering and run `mig1`, `mig2` and `journey`.

## 4. Labelling changed facts (`claims.json`)

In `data/shared/asmodian/guide/claims.json`, set per claim:

| Case | `verdict` | `action` |
|---|---|---|
| Two independent sources, or a game-database field, agree on the new value | `verified` | `rewrite` (with `newText`) or `keep` |
| One permitted source shows the change | `single-source` | `rewrite` or `keep`, with a `note` |
| Sources disagree | `disputed` | `keep` the old text with a `note`, until resolved |
| Value inferred, not seen | `inferred` | `keep` with a `note` |
| Source unreachable | `unverifiable` | `keep`, note what failed to load |
| Old text is now false | `wrong` | `rewrite` or `drop` |

Set `verifiedAt` to the check date. Quotes stay short and credited; thegameswiki facts only. Anything no permitted source
confirms goes on a list for an owner in-game check. Then run `npm run gen`; it validates and rewrites
`data/DATA_SOURCES.md`.

## 5. Sign-off

- Data & Research prepares the change and the list of what changed, with sources and the build.
- QA & Release runs `npm test` and the save suites ([qa-release.md](qa-release.md)).
- The **owner** signs off anything that changes what a player sees at a level gate, anything labelled `disputed`, and
  every in-game check. Per HANDOFF.md, the CEO may merge data-only patches within the limits the owner has set.
- Add a CHANGELOG line that says what changed and the game build.

## 6. Output

A short note for the owner: build checked, records re-verified (count), records changed, labels set, items for an
in-game check, sources that could not be reached.
