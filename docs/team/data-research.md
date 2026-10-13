# Data & Research

**Owns:** every game fact in the guide: sources, verification, `data/*.json`, `data/claims.json`, the Sources and
Confidence cards, and re-checks after game patches.

**Source policy** (CLAUDE.md is authoritative): two independent sources, or game-database fields (Metabot quest/skill
pages, aion2.gaming.tools, aion2.th.gl; Metabot and Wikily count as one), or the owner's in-game screens. Otherwise
leave it out or label it *single source* / *inferred* / *disputed*. thegameswiki: facts only, never wording. No Game8.

**Standing checklist**
- Every claim: source URLs per field, confidence, date checked. New URLs go through `npm run gen`.
- Prefer database fields that confirm a link from both ends (e.g. a quest's prerequisite and the other quest's unlocks).
- Record what could not be reached (bot checks) instead of guessing.
- After a game patch: list affected records and re-verify them (driven by `verifiedAt` once data v2 exists).
- Per class (0.6+): research plan, data, claims, and a list of items the owner or a tester must confirm in game.

## Standing notes
- aion2.gaming.tools and thegameswiki often block scripted reads; aion2.th.gl and metabot.gg usually work via curl.
- Ascension quests (Asmodian, Lv 1–45): Perceives (5), Hears the Voice (22), Dreams (32), Witnesses the Nightmare (45);
  Swears the Oath is 49 (beyond the cap). "Daeva Trapped in a Nightmare" (Lv 45 story) is not yet in our story data.
