# AION 2 game-database sites: survey, ranking and fetching policy (2026-10)

Data & Research, 14 Oct 2026. **Research only: no app code or data file was changed.** Feeds the Sources card, the
cross-check step of every research pack, and the `sources` registry planned in DATA-FORMAT-V2 (PR 20).

> **Update, 14 Oct 2026 (later the same day):** most hosts that failed in §3 connected on a second pass. §10 records
> the direct checks and **supersedes the search-snippet rows in §2.2 for the hosts it covers**; §1, §3 and §5 were
> not rewritten, so where they disagree, §10 wins.

**Evidence labels used below.** *[curl]* = I requested it from this session. *[search]* = only a WebSearch result
snippet, not verified on the site. *[repo]* = already in our docs. Anything unlabelled is an inference and says so.

**Method.** One page request per reachable site plus its `robots.txt` (the `robots.txt` read is the only extra request),
no crawling, User-Agent `DaevaCompanionResearch/0.1 (+https://daevacompanion.com; research probe)`. Beyond that, a few
single reads of pages the site itself publishes about its data and terms: Metabot methodology, terms of service and
AI-agent page; one th.gl quest page that we already cite; the Metabot sitemap headers. Requests were spaced 3 s or more
apart. No bot check was circumvented. No client files were downloaded or extracted. Game8 was not used.

## 1. Summary

- **Only 2 of 21 tested hosts are fetchable from this environment** (metabot.gg, aion2.th.gl). aion2.gaming.tools
  answers but serves a Cloudflare challenge to scripts. The other 18 never completed a connection (§3). This is the
  same finding as PR 22 §5, now covering more hosts. It is an environment-plus-site constraint, not a verdict on the
  sites.
- **Global client first.** Only Metabot states its method and build on a page I read. dbaion2.ru claims client data
  *[search]*, aion2.gaming.tools labels itself a global database without a method *[search]*, and aion2.th.gl states neither. KR/TW coverage is thin: I found no Taiwanese item/quest database at all, and one Korean
  item list (sagye.kr, which says it copies from Inven's DB).
- **Agreement between Metabot and th.gl is weaker evidence than it looks.** Both say or imply they read the same
  global client. When they agree they have probably extracted the same upstream data, so agreement rules out
  extraction and transcription errors, not a client-side error or a stale build. Our current policy counts them as
  independent only for "game-database fields". I'd keep that, but label it as such (§6, risk R1).
- **Build numbers are not comparable across sites.** Metabot shows `0.0.4387.0` on its pages *[curl]*; a search snippet
  shows aion2.gaming.tools as "global 2.0.6.0" *[search]*. These look like different schemes (client file version vs
  game/patch version). I could not map one to the other. Do not write "same build" in claims without a test (§8, T1).
- **Recommended primaries:** Metabot, aion2.th.gl, aion2.gaming.tools, with the third usable only through a human in a
  browser (§5).
- **Policy proposal (§7):** 1 request per 5 s per host (12/min), concurrency 1, 24 h cache with conditional requests,
  honest User-Agent, stop on 403/429/challenge, obey `robots.txt` including the `/api/` and `/archive` rules.
- **One policy problem found in our own practice:** PR 22 fetched th.gl with 4 parallel requests and retries. That
  breaks the proposed policy, and aion2.th.gl's `robots.txt` blocks AI crawlers by name (§4.2). The owner should decide
  whether we keep reading it at all.

## 2. Site survey

Column notes: *Data claim* is what the site says about itself; "client datamining" means it says it reads client files.
*Update speed* is the stated policy; I did not measure it (one request each, so no time series).

### 2.1 Global-client databases

| | Metabot (metabot.gg) | aion2.th.gl | aion2.gaming.tools |
|---|---|---|---|
| Operator | MetaBot.GG, multi-game stats site with an Overwolf desktop app; contact metabotgg@gmail.com on its terms page *[curl]* | The Hidden Gaming Lair (th.gl), multi-game map/DB network; GitHub org The-Hidden-Gaming-Lair, repo `thgl-web-components` mentions a `data-forge` pipeline *[search]* | Not found; no About page reachable |
| Data claim | Reads "the data tables shipped inside the AION 2 global client… the same files the game itself loads"; nothing from KR/TW; nothing copied from fan sites *[curl: /en/aion-2/methodology]* | None found on the pages I read. A Companion App (Windows overlay) exists *[search]*. Method unstated. | Unstated on the pages reachable by search. Listed as "global version database": items, crafting, NPCs, quests, skills, dungeons, maps *[search]* |
| Build shown | **0.0.4387.0** (global), repeated across pages and in the methodology FAQ *[curl]* | No build or patch number found in the pages I fetched; homepage said "Last Updated" with a date, search snippet reads Oct 11 2026 *[search]* | "Global 2.0.6.0" *[search]*. Scheme differs from Metabot's. |
| Update speed | "Whenever a patch changes the global client… we re-read it" *[curl]*. Sitemap served with 24 h CDN cache *[curl]*. | Unstated; date field suggests periodic rebuilds | Unknown |
| Coverage | Items 6,671, class skills 280, monsters 3,670, bosses 48, dungeons 219, **quests 1,043**, crafting 512, zones 333, Hidden Cubes 206 (counts as fetched today) *[curl]*. Quest/item pages, maps, content unlocks, level tables. Not in the client, so absent: monster HP, combat stats, market prices *[curl]* | Items, bestiary, quests, recipes, gathering, skills, titles, achievements, Daevanion, pets, wings, maps with 25,590 locations on 73 maps *[curl: nav; search: counts]* | Items, crafting, NPCs, quests, skills, dungeons, maps. Monster count listed as ~7,545 versus Metabot 3,670 *[search]*. Differences unexplained (R3). |
| `robots.txt` | `Allow: /`; **`Disallow: /api/`, `/private/`, and `/*/aion-2/profile/`**; sitemap given *[curl]* | `*`: `Disallow: /nodes/`, `/archive`. **Blocks by name: ClaudeBot, GPTBot, meta-externalagent, Amazonbot, cohere-ai, GoogleOther, AhrefsBot, SemrushBot** and others *[curl]* | `Allow: /` for all, `Disallow: /*.webp`; sitemaps given *[curl]* |
| Reachable here | Yes, ~0.5 s *[curl]* | Yes, ~1.2 s; about 1 in 3 connections resets *[curl, repo PR 22]* | **No: HTTP 403, Cloudflare "Just a moment…" managed challenge** *[curl]* |
| Terms | See §4.1 | Legal notice at www.th.gl/legal-notice, **not read** (www.th.gl is blocked here) | Not found, not read |
| Stated rate limit | None for pages. Public MCP server at `/api/mcp`: "about 60 requests/minute per IP", 429 + `Retry-After` *[curl]*. But the MCP is advertised for LoL/TFT/Valorant etc., not AION 2, and `/api/` is disallowed in robots, so we do not use it. | None found | None found |
| Reuse of facts | Dofollow link to the specific page required; see §4.1 | Unknown (legal notice unread) | Unknown |

### 2.2 Other global-client or global-oriented sites, search-only

All were unreachable here, so every cell is *[search]* and unverified.

| Site | What it is | Data claim | Notes |
|---|---|---|---|
| dbaion2.ru | "AION 2 Global database": items, NPCs/monsters, skills/stigmas, quests, crafting, dungeons, world map, character builder | "Data from the game client, updated each patch" | Russian operator by TLD; best unexplored cross-check candidate |
| aion2.online/database | Database + maps | Unstated | Search returns no page content |
| aion2.app/db | Database: items, skills, NPCs | Unstated | |
| gamers4.life/aion-2/database | Database: items, builds, maps (multi-language) | Unstated | |
| aion2hub.com | Item DB, world objects, drop rates, maps; KR patch-note translations | KR patch notes "flow into our database" (so KR-oriented) | Strong for upcoming KR changes; not a global-client source |
| aion2kina.com (AION2 KINA) | Toolkit: map (3,792 points), item DB, 894 crafting recipes | Unstated; says it is unofficial | EN/zh-TW/KO UI |
| interactivemap.app/aion2 | Map, ~4,279 markers | Unstated | Map only |
| gamewith.ai/aion2 | Simulators + character search for KR, TW and global | "Official character data" | Not a game-data DB |

### 2.3 Korean and Taiwanese coverage

- **KR:** sagye.kr offers item/skill/pet/appearance lists. It says its items are collected from Inven's AION 2 DB and
  covers Asmodian-side items only *[search]*. I could not find Inven's DB page in search, and inven.co.kr is blocked
  here. aion2hub.com carries translated KR patch notes *[search]*.
- **TW:** I found no Traditional-Chinese item/monster/quest database. Taiwan's coverage is the official site
  (tw.ncsoft.com/aion2/), Bahamut forum posts and community maps (e.g. a 1,120-trace Empyrean map) *[search]*.
- **Use for us:** Metabot says KR and TW "are months ahead and use different numbers" *[curl]*. Treat KR/TW data as a
  preview of upcoming global changes, never as verification of a global fact.

## 3. Reachability test

Method: `curl -m 25` per URL, once. "000" means no HTTP response (connection not established); where I looked at the
message it was `CONNECT tunnel failed, response 403`, i.e. refused by this session's outbound proxy, as in PR 22.

| Host | Page | robots.txt | Result |
|---|---|---|---|
| metabot.gg | `/en/aion-2` 200, 725 KB | 200 | OK |
| aion2.th.gl | `/db` 200, 1.4 MB | 200 | OK (large pages; slow resets) |
| aion2.gaming.tools | `/` **403** | 200 | Cloudflare challenge; **not bypassed** |
| aion2hub.com, aion2.online, gamewith.ai, thegameswiki.com, wikily.gg, aion2.plaync.com, tw.ncsoft.com | 000 | 000 | Blocked at proxy |
| dbaion2.ru, aion2.app, gamers4.life, sagye.kr, interactivemap.app, aion2kina.com, aion2.inven.co.kr, www.inven.co.kr, forum.gamer.com.tw | 000 | 000 | Blocked at proxy |
| www.th.gl, cdn.th.gl | 000 | n/a | Blocked at proxy |

Caveat: a proxy refusal says nothing about whether the sites would serve a script, and a Cloudflare challenge is
the site's choice. Do not read "unreachable" as "unreliable". Hosts the owner might allow are in §8.

## 4. Terms, robots and licence for reuse of facts

I am not a lawyer; this is a reading of what the sites publish, for the owner to confirm.

### 4.1 Metabot (read in full: terms effective 04/01/2026)

- Browsing is for "personal, non-commercial use". "All content… including text, graphics, **data compilations**, and
  design, is owned by us or our licensors." Game data is the publishers'. No scraping clause found.
- A "Data Usage & Attribution" clause lets anyone reuse its data "in generated, published, or displayed content" if
  they (1) credit MetaBot.GG with a **dofollow link to the specific metabot.gg page the data came from**,
  (2) do not present it as their own or imply endorsement, and (3) "access the public endpoints at a reasonable
  request rate". The clause is written for its MCP/AI-agent data, but its wording is "any use of MetaBot.GG data".
- This matches what CLAUDE.md already requires (plain dofollow links to the source page; Sources card). It is the
  best-documented permission of the three.
- **Open risk R2:** the "non-commercial" wording. Whether daevacompanion.com is non-commercial depends on ads or
  sales. Facts alone are generally not copyrightable, but the terms claim the compilation, so we should keep taking
  individual facts with a link and never bulk-copy tables.

### 4.2 aion2.th.gl

- `robots.txt` blocks named AI crawlers (ClaudeBot, GPTBot, …) from everything and everyone from `/nodes/` and
  `/archive`. Our probe used a custom User-Agent, so by the letter `/db` is allowed to it. But a Claude Code session
  acting for the owner is an AI agent, and the site has said it doesn't want AI crawlers. **I recommend the owner
  decides explicitly**, and that tooling never spoof or reuse a blocked agent name.
- Legal notice not read. No reuse licence known. Treat as "facts only, link back, licence unchecked" (this is
  DATA-FORMAT-V2 Q3).

### 4.3 aion2.gaming.tools

- `robots.txt` permits everything except `.webp` files, but Cloudflare blocks scripted access. Terms not found. No
  licence known. We cite 47 of its pages [repo], so those were read by a person in a browser or earlier tooling;
  future reads should follow the same route.

### 4.4 Everything else

Unread. None may be used as a primary source until its terms are read.

## 5. Ranking for cross-checking

Criteria: states how data is obtained; shows a build; reachable; robots/terms permit our use; coverage of what the
guide needs (quests, skills, boards, dungeons, level tables); independence from the others.

| Rank | Site | Role | Why | Main weakness |
|---|---|---|---|---|
| 1 | **Metabot** | Primary | Only site that states method, build and update rule; robots and attribution terms known; full coverage; fast and polite to scripts | Single operator; "non-commercial" wording (R2); count drift between snapshots (§6 R4) |
| 2 | **aion2.th.gl** | Primary | Reachable; node-level data matched Metabot on all 280 skills and 40 boards (PR 22) | Method and build unstated; blocks AI crawlers; legal notice unread; flaky connections |
| 3 | **aion2.gaming.tools** | Primary, **manual only** | States a global build (via search); robots permissive; different counts mean it may be a different extraction | Cloudflare challenge: needs a human in a browser; terms unknown |
| 4 | dbaion2.ru | Candidate | Claims client data per patch, quests included | Unreached; operator and terms unknown |
| 5 | aion2.online / aion2.app / gamers4.life | Candidates | More cross-check points if reachable | Unreached; methods unstated |
| 6 | aion2hub.com | KR preview only | Translated KR patch notes; shows what is coming | Not global data |
| 7 | sagye.kr, Inven DB | KR preview only | Korean names and item lists | Not global; copies from Inven; blocked |
| – | gamewith.ai, interactivemap.app, AION2 KINA | Not data sources | Simulators, maps or toolkits; method unstated | – |

The third primary is a judgement call: gaming.tools gives the third look we already rely on for 47 pages, but it can't
be automated. If the owner would rather have a fully scriptable trio, dbaion2.ru is the stand-in once reachable and its
terms are read.

## 6. Risks and what the evidence does not show

- **R1. Independence.** Metabot and th.gl probably share an upstream (the global client). Their agreement means the
  extractions agree. It does not show the client is right, or that both are on the same build. I could not confirm
  th.gl's build.
- **R2. Terms.** Metabot's "personal, non-commercial" clause and th.gl's unread legal notice (§4).
- **R3. Count differences.** Monsters 3,670 (Metabot) vs ~7,545 (gaming.tools, *[search]*). Probably a definition
  difference (e.g. variants or spawn entries), not an error, but unverified.
- **R4. Snapshot drift.** A search snippet of Metabot's methodology listed 6,672 items and **1,312 quests**; the page I
  fetched listed 6,671 items and **1,043 quests** at the same build 0.0.4387.0. Either the
  snippet is from a different crawl date or the counts changed without a build change. Either way, `verifiedAt` should
  record the date and the build, not only the date.
- **R5. Search snippets are unverified.** Every *[search]* row above may be wrong or stale. None of them should
  go into `claims.json` without a direct read.
- **R6. Reachability depends on the allow-list.** Eighteen hosts failed, so the survey of their data practices is
  second-hand.

## 7. Proposed polite-fetching policy

For any script or session that reads these sites for us. Ranked by how firm: MUST / SHOULD.

1. **Identify ourselves.** MUST send `User-Agent: DaevaCompanionResearch/<version> (+https://daevacompanion.com)`.
   No contact email (the owner's address stays private; the site URL is enough for an operator to find us). MUST NOT
   use a browser or blocked-bot User-Agent.
2. **Rate.** MUST keep to **at most 12 requests/min per host (one every 5 s, plus 0–2 s jitter) and concurrency 1**.
   That is a fifth of Metabot's published 60/min (that figure is for its MCP endpoint, which we don't use), so it
   leaves room for other users. A research pack of ~100 pages takes ~10 minutes. MUST NOT run parallel fetches (this reverses the 4-parallel
   th.gl pattern used for PR 22).
3. **Robots.** MUST fetch and obey `robots.txt` at the start of each session; never request `/api/`, `/private/`,
   `*/profile/` (Metabot), `/nodes/`, `/archive` (th.gl). MUST honour per-agent blocks: if a site blocks an AI agent we
   could be classed as, stop and ask the owner.
4. **Stop signals.** MUST stop that host for the session on 403, a challenge page, 429 or repeated resets; honour
   `Retry-After`; retry at most twice with 30 s then 120 s backoff. MUST NOT solve challenges, rotate IPs or use a
   headless browser to get past a bot check. Record "not reachable" in the notes instead (existing standing rule).
5. **Cache.** SHOULD cache each response on disk under `tools/research/cache/` (not committed) keyed by URL and keep it
   24 h for pages, 7 d for `robots.txt`. SHOULD send `If-None-Match` / `If-Modified-Since` after that. Never re-fetch
   the same page twice in one session.
6. **Target only what we cite.** MUST NOT crawl or enumerate; MUST read only URLs that either are already in
   `DATA_SOURCES.md` or were chosen for a specific claim. No sitemap walks. One page per record.
7. **Record the build.** SHOULD store, with every fact, the site, URL, fetch date and the build/patch shown on the page
   (Metabot: the build at the foot of each page). A change of build invalidates cached pages for that site.
8. **Attribution and reuse.** MUST link the specific page each fact came from (Sources card; already the rule). Facts
   only, no page text, no images or icons from these sites without the owner's OK (CLAUDE.md).
9. **No client files.** MUST NOT download, unpack or parse game client files, and MUST NOT use packet capture or
   memory reading (CLAUDE.md).
10. **Review.** SHOULD re-read each site's `robots.txt` and terms at the start of each patch re-check and record
    changes in this file.

## 8. Tests and decisions for the owner

**Proposed experiments (nothing here was run, because they need access this session lacks):**

- **T1. Build mapping.** In a browser, open one Metabot page and the same record on aion2.gaming.tools and note
  the build/patch text on each. If gaming.tools' "2.0.6.0" is a game-patch number, record the pair here. Until then,
  do not claim "same build".
- **T2. Patch-day lag.** At the next global patch, load the Metabot methodology page, th.gl home ("Last Updated")
  and one gaming.tools page on patch day, +1 d and +3 d; record the build and date each shows. Gives measured update
  speed to replace the stated rule.
- **T3. Count reconciliation.** Take 10 monster names with different counts on Metabot and gaming.tools and see
  whether the 3,670 vs ~7,545 difference is variants.
- **T4. Terms read.** Read th.gl's legal notice and any gaming.tools/dbaion2.ru terms, then add their licence line to the
  sources registry.

**Decisions needed from the owner:**

1. Keep reading aion2.th.gl given its AI-crawler robots rules? My recommendation: yes for single pages at ≤12/min with the
   identified User-Agent, until its legal notice is read; no bulk pulls. If the owner prefers a stricter line, drop it
   to "human browser reads only" like gaming.tools.
2. Is daevacompanion.com "non-commercial" for Metabot's terms (ads, donations)? If not, ask Metabot for permission.
3. Approve the §7 policy as written, or change the rate.
4. Allow-list hosts for the next research session (Allowed domains in the environment's network settings):
   aion2.gaming.tools (if the challenge allows scripts, otherwise skip), dbaion2.ru, aion2.online, aion2.app,
   gamers4.life, aion2hub.com, www.th.gl (for the legal notice). Optional: sagye.kr and inven.co.kr for Korean names.

## 9. Sources used

Read in this session *[curl]*: https://metabot.gg/en/aion-2, /en/aion-2/methodology, /en/legal/terms-of-service,
/en/ai, /robots.txt, /sitemap.xml (headers only); https://aion2.th.gl/db, /, /db/quests/q_2102345, /robots.txt;
https://aion2.gaming.tools/ and /robots.txt.

Search results only: https://aion2.gaming.tools/ (title and snippet), https://dbaion2.ru/en/, https://aion2.online/database/,
https://aion2.app/db, https://gamers4.life/aion-2/database/ja/, https://sagye.kr/db, https://aion2hub.com/updates/…,
https://gamewith.ai/aion2/en, https://interactivemap.app/aion2/, https://www.th.gl/apps/aion2,
https://tw.ncsoft.com/aion2/, https://forum.gamer.com.tw/C.php?bsn=82913&snA=1022, Product Hunt/AlternativeTo
listings for AION2 KINA.

## 10. Addendum: direct checks of the search-only sites (14 Oct 2026, second pass)

Research only; nothing in `src/`, `data/` or `claims.json` changed. Follows the Fetching policy in
`docs/team/data-research.md` and §7: `robots.txt` first, one request at a time, at least 5 s apart (12/min cap),
User-Agent `DaevaCompanionResearch/0.1 (+https://daevacompanion.com)`, no crawling, nothing bypassed. 44 requests in
about 7 minutes. **aion2.th.gl was not requested** (as instructed). Labels as in the header: *[curl]* = read in this
pass; anything unlabelled is my inference and says so.

### 10.1 Outcome per host

| Host | Result | Used? |
|---|---|---|
| aion2.gaming.tools | robots.txt 200 (`Allow: /`, `Disallow: /*.webp`, sitemaps `sitemap.txt`, `sitemap-builds.txt`). Home page **403 `cf-mitigated: challenge`** (Cloudflare "Just a moment…"). Stopped for the session. | No page read. **T1 not run** (§10.4). |
| thegameswiki.com | robots.txt **429**, body is a "Vercel Security Checkpoint". Stopped, no second request. | No |
| interactivemap.app | robots.txt only. It names GPTBot, ClaudeBot, Claude-Web, anthropic-ai and others and allows them only landing pages (`/aion2/$`); the map itself is closed to AI agents. Skipped under the opt-out rule. | No |
| www.th.gl | robots.txt only (blocks ClaudeBot, GPTBot etc. by name, as in §4.2). Legal notice **not** fetched, so T4 stays open for th.gl. | No |
| aion2kina.com | Proxy `CONNECT tunnel failed, 502` on 3 attempts. The third came ~10 s after the second, not after the 120 s the policy asks for; not tried again. | No |
| tw.ncsoft.com | robots.txt 301 to `www.nc.com`. Not followed (different host, not a database). | No |
| aion2.plaync.com | robots.txt `Allow: /`. `/` answers 303 to `/en-us/index`; official site, not a database. Not followed. | No |
| www.inven.co.kr, forum.gamer.com.tw | robots.txt only (nothing AI-specific; `Wget` is blocked on Inven). Not a game database; no page fetched. | No |
| aion2hub.com, aion2.online, dbaion2.ru, aion2.app, gamers4.life, wikily.gg, gamewith.ai, sagye.kr, aion2.inven.co.kr | Reachable, 200. Details below. | See 10.2, 10.3 |

The change from §3 (18 hosts unreachable, now 15 reachable) is on the environment side. I can't tell whether the
allow-list changed or the proxy was flaky that day.

### 10.2 What each reachable site says about itself [curl]

Build: **none of the nine pages states a game build in a form comparable to Metabot's `0.0.4387.0`.** The only
identifiers seen are aion2.app's "Client Build 120" (a news post dated 30 Sep 2026) and aion2hub's "Launch Scale Test
(playtest) client" for season dates.

| Site | Operator | How it says it gets data | Build / date shown | Coverage (as shown on page) |
|---|---|---|---|---|
| **dbaion2.ru** (mirror dbaion2.online) | "Run by one person" (About); independent fan project, RU/EN/DE; contact by form and Telegram | "Names, descriptions, stats, drop tables, rewards and prices are read straight from the game client files"; texts from the game's own localisation; "rebuilt after every patch". Where the client has nothing (server-side drop rates, Korea-only content) "the source is marked separately" | No build number. News dated up to 14 Oct 2026; privacy policy revision 23 Sep 2026 | 9,450 items, 13,494 NPCs and monsters, 1,429 quests, 315 skills, 737 recipes, 35 dungeons, 734 titles, 208 pets. Also map, calculators, Daevanion, player profiles |
| **aion2hub.com** | "AION2 Hub", unofficial fan-made; owner not named on the page; DPS meter is linked to aionflex.gg | "Read straight from the game client"; season dates "read from the game client (as of 2026-09-19)… from the Launch Scale Test (playtest) client; may change at launch" | Dates only (above) | Item DB, sets, achievements, awakening, monoliths, titles, cosmetics, world objects, drop rates, maps, build planner, leveling guides 1–50 per race, news/patch notes. Page gives no counts |
| **aion2.app** | Pseudonymous team of four named on /about; contact@aion2.app | Character data, leaderboards and statistics "sourced directly from the Official Aion 2 Open API provided by NCSoft… no manual input". Database method not stated. News posts analyse client builds (e.g. "Inside Client Build 120", ~18 GB client); I infer from this that it also inspects client files, but it does not say so | "Client Build 120", 30 Sep 2026; launch patch of 5 Oct 2026 in its news | Items, monsters, titles, skills, wings, quests, NPCs, map, ranking, builders, guides |
| **gamers4.life** | "Gamers4Life", fan site; same operator as interactivemap.app (its terms mention "every map at interactivemap.app"); ads (Nitro Ads) plus Ko-fi donations | "Item stats, skill scaling, and drop rates sourced directly from the official client files" | None | 13,408 Item DB entries, 35,763 generated records; 9 languages (EN, KO, 繁, DE, ES, FR, JA, PT, RU); builder, map, drops, hidden cubes, timers |
| **wikily.gg/aion-2** | NX Software SAS, Paris (legal notice, dated 12 Aug 2024); multi-game wiki platform with a creator community | Method not stated on the pages read | None; "Season 1: 30 Sep 2026 to 16 Dec 2026" | 8 classes, 288 skills, 4,634 items, 135 dungeons, 56 field bosses, 1,792 monsters, 713 quests, 66 quest dungeons, 423 achievements, 497 supply requests |
| **aion2.online** | WordPress fan site, "© 2025", no operator named | Publishes no data of its own: links out to interactivemap.app, gamers4.life tools and the official site | None | Landing and guides only; not a database |
| **gamewith.ai/aion2** | Not named on the page | Probabilities and costs "taken from NCSOFT's official probability disclosure for the Korean service (published 2026-09-30)"; links to `probability.plaync.com/aion2`. The page says Global and Taiwan "have not published" (text cut off in my read) | None | Simulators and DBs (enhancement odds, crafting, extraction, wings, pets, dungeon drops), character search for KR/TW/global |
| **sagye.kr** (A2M) | Personal fan site run with a legion; Discord for contact | Items "collected from Inven's AION 2 DB" (Asmodian side only); cosmetics and pets read from a Google Sheet the legion maintains (5 min cache); stigma specialisations 5–25 "from game tooltips" because Inven's simulator lags | None. Says stigma max level went 20 to 25 in the **Korean** patch of 1 Jul 2026 | Items, skills of 8 classes, pets, cosmetics. Korean server data: preview only |
| **aion2.inven.co.kr** | Inven (Korean media company) community portal | Not a database page; forum, news and tip boards | None | Community and guides; I did not locate its DB pages |

### 10.3 Terms, robots and licence for reuse of facts

I am not a lawyer. Quotes are short, from the terms pages I read [curl].

| Site | `robots.txt` | Terms found | What it means for us |
|---|---|---|---|
| dbaion2.ru | Allows all except `/napi/`, `/api/`, `/admin/` | Footer lists "Terms of use", "Privacy policy", "Advertising"; **I did not fetch Terms of use** (privacy and About only). No licence statement seen | Only candidate that is scriptable, states its method and has no known ban. Terms unread, so **not usable until T4 is done** |
| aion2hub.com | Allows all except `/api/` | No terms or privacy link on the home page. Footer: "unofficial fan-made companion. Not affiliated with NCSOFT" | No licence either way. Treat as facts-only candidate |
| aion2.app | Allows all except `/api/`, `/admin`, `/account`, `/login` | Terms (26 Apr 2026): "personal, non-commercial purposes only"; no "scrape, copy, or redistribute Site content without permission"; original content © Aion2.app | **Bans our kind of use.** Human browser reads only, and only with the owner's decision. Its data is partly NCSoft API data (characters), not game-database fields |
| gamers4.life | Allows all except `/api/`, `/studio/`, `/admin/`, `/_next/` | Terms: "personal, non-commercial use"; not allowed: "republishing our content without written authorization" and "using bots, scrapers, or automated tools" | robots permit it but the terms ban bots, so **no scripted reads**. Same for interactivemap.app, which is the same operator |
| wikily.gg | Allows all (named AI agents including ClaudeBot get the same rules); disallows `/api/`, `/admin/`, `*/edit`, etc. | Terms (16 Aug 2024): bars reproducing or providing access to the website or its contents by "spidering, scraping or any other technological means"; user content is licensed to Wikily | Terms are written for a platform with accounts and a marketplace, so how they apply to reading public wiki pages is unclear. Treat as bots-unwelcome until the owner decides |
| sagye.kr | Allows all except `/api/` | Terms (Korean): unofficial fan site, NCSOFT owns the copyright, info "for reference", accuracy not guaranteed. No reuse licence | Korean preview only; collects from Inven |
| aion2.online, gamewith.ai | aion2.online allows all; gamewith.ai has no robots.txt (404 page) | None found | Not data sources |

**My own slip to report:** I fetched the terms pages after robots.txt but after some page reads. For **gamers4.life**
(4 requests) and **aion2.app** (6 requests) the terms turned out to ban bots or scraping. All requests followed
robots.txt and the rate limit, were single pages, and nothing was stored beyond this session's scratch space, but the
read-terms-first order in §7 should be explicit. Proposed fix: add "read the terms page before the first content page"
to §7 item 3.

### 10.4 T1: build mapping Metabot to gaming.tools

**Not run.** The precondition was "gaming.tools readable without a challenge". It returned 403 `cf-mitigated: challenge`
on the first request, so I stopped, as the policy requires. I did not fetch its `sitemap-builds.txt` either: the host
is challenged, and the policy says stop. That file is listed in its robots.txt and may carry build identifiers; a person
in a browser could open it as part of T1.

What the pass adds to T1: there are now at least **three build schemes** for what looks like one game client:
Metabot `0.0.4387.0` [curl, earlier pass], gaming.tools "2.0.6.0" [search], aion2.app "Client Build 120" [curl].
Global launched on 5 Oct 2026 per aion2.app's news and dbaion2's "Global Launch Known Issues (Updated 10/9)", and
aion2hub's season dates came from a "Launch Scale Test" client. I did not re-fetch Metabot, so **I don't know whether
0.0.4387.0 is before or after the launch patch**. Re-reading its footer on a person-approved visit is cheap and would
settle it.

### 10.5 Effects on §5 (ranking) and §6 (risks)

- **Third primary.** dbaion2.ru is now a real stand-in for gaming.tools (reachable, robots allow, method stated). It
  is one person's project, and its client-data claim has the same shared-upstream caveat as R1. Its terms are unread.
- **Counts differ widely for the same game**, which refines R3: quests 713 (Wikily), 1,043 (Metabot), 1,429 (dbaion2);
  skills 280 / 288 / 315; items 6,671 / 4,634 / 9,450; dungeons 219 / 135 / 35. These are different definitions or
  different builds, I can't tell which. **Do not compare counts across sites** as a verification step.
- **Demote** aion2.app, gamers4.life, interactivemap.app and Wikily from "candidates" to "human read only, owner
  decision" because of their terms. **Keep** aion2hub as a candidate with unknown terms.
- **Korea preview:** sagye.kr shows the Korean stigma cap at 25 since 1 Jul 2026. Whether Global has it or when is
  unknown. Do not use for the Lv 1–45 guide.
- New risk **R7**: sites that share one operator (gamers4.life / interactivemap.app) or copy from each other (sagye.kr
  from Inven) look like more sources than they are.

### 10.6 Experiments and decisions added

- **T4 (extended).** One request each for dbaion2.ru Terms of use and aion2hub.com (look for a terms page). Needs the
  owner's OK for dbaion2 as a source.
- **T5. Quest spot-check on dbaion2.** Take the 20 Asmodian Lv 1–45 quests our data holds with `rq:` ids that have two
  independent sources already. Open each quest on dbaion2 (one page each, ≤12/min, about 2 minutes) and compare level,
  prerequisite and rewards. Pass: 20 of 20 match on level and prerequisite. A mismatch is a candidate for T3 or a build
  difference, not an error in our data. Run only after T4 clears the terms.
- **T1 stays open** for a person with a browser: the pair (Metabot footer build, gaming.tools build) on one quest page,
  plus `sitemap-builds.txt`.
- **Decision 5 (owner).** Adopt "terms that ban bots or scraping = human reads only, even if robots.txt allows" as a
  rule in §7? I recommend yes; it excludes gamers4.life, aion2.app and probably Wikily.
- **Decision 6 (owner).** OK to read dbaion2.ru's Terms of use and use it as a scripted third source if the terms allow?
- **Decision 7 (owner).** Is the th.gl legal notice worth a human read (T4) given its robots rules, or do we drop th.gl
  from scripted use? Unchanged from decision 1.

### 10.7 Pages read in this pass [curl]

robots.txt of gaming.tools, aion2hub.com, aion2.online, gamewith.ai, thegameswiki.com, wikily.gg, aion2.plaync.com,
tw.ncsoft.com, dbaion2.ru, aion2.app, gamers4.life, sagye.kr, interactivemap.app, aion2kina.com (failed),
aion2.inven.co.kr, www.inven.co.kr, forum.gamer.com.tw, www.th.gl. Pages: gaming.tools `/` (403);
aion2hub.com `/`; aion2.online `/`; dbaion2.ru `/en/`, `/en/about/`, `/en/privacy/`; aion2.app `/`, `/terms`, `/about`,
`/news/50` (307 to aion2t.com, not followed); gamers4.life `/aion-2/database/`, `/aion-2/database/en/`, `/terms`;
wikily.gg `/aion-2/`, `/terms-of-service`, `/legal-notice`; gamewith.ai `/aion2/en`; aion2.plaync.com `/` (303, not
followed); aion2.inven.co.kr `/`; sagye.kr `/db`, `/terms`.
