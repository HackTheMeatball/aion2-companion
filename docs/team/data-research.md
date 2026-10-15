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
- Per class (0.8+, renumbered 2026-10-15): research plan, data, claims, and a list of items the owner or a tester must confirm in game.

## Fetching policy (owner-approved 2026-10-14)
- Before any content page: read the terms page and robots.txt. Then, within reason, do the minimum the site asks:
  1. **Opts out of AI / automated access entirely** (robots.txt names Claude or AI agents, or terms ban all bots or
     automated access): never fetched by a session. The owner checks it by hand when needed.
  2. **Bans scraping only** (bulk or systematic copying): small spot checks are fine to verify a fact we already have
     from another source: a few pages per task, at least 5 s apart, facts only, nothing stored beyond the session.
  3. **No restriction**: the limits below.
- Always identify honestly: our own User-Agent, never a disguised browser; never get around a challenge, block or
  rate limit. Behaving politely is fine; pretending to be a person is not. A site that opts out is read by the owner in a browser, never by a
  session, until its owner gives permission.
- At most 12 requests/min per host, one request at a time, 24 h cache; identify as Daeva Companion research in the
  User-Agent (no personal email). Stop at the first 403, 429 or challenge page; never work around one.
- aion2.th.gl: not read by sessions (robots.txt excludes AI agents); removed from the "Daeva Companion" environment. Facts that
  came from th.gl are re-verified against a permitted source (Metabot first) and attributed to it; anything unconfirmed
  is labelled for an owner in-game check.
- Metabot terms: personal, non-commercial use with a dofollow link to the specific page. The site qualifies today.
- Agreement between two client-derived databases rules out extraction errors only; record the game build next to
  `verifiedAt`, and the owner's in-game screens stay the source of truth.
- Research sessions run in the "Research (open web)" environment (Full network); code, review and docs sessions in "Daeva Companion" (custom allowed sites). The plain "Default" environment is unused.

## Standing notes
- aion2.gaming.tools and thegameswiki often block scripted reads; aion2.th.gl and metabot.gg usually work via curl.
- Ascension quests (Asmodian, Lv 1–45): Perceives (5), Hears the Voice (22), Dreams (32), Witnesses the Nightmare (45);
  Swears the Oath is 49 (beyond the cap). "Daeva Trapped in a Nightmare" (Lv 45 story) is not yet in our story data.
