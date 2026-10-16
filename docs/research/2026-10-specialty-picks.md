# Specialty picks for slots 2 and 3 (research for 0.3 E7)

Research session, 2026-10-16 (UTC). **Docs only: no file in `data/` or `src/` was changed.** Feeds step E7 of 0.3
(recommended picks for specialty slots 2 and 3). Follows the data and fetching policy in `CLAUDE.md` and
`docs/team/data-research.md`.

**Evidence labels.** *2+ sources* = at least two different publishers name the pick as a main pick for that skill.
*single-source* = one publisher. *disputed* = sources name different picks for the same slot and neither side has more
support. *contested* = a minority or plurality pick with named opposition (the sources that put a different pick in the slot are listed in the row).
*gap* = no source names a pick. **Labels are slot-specific:** a source counts for "slot N = pick X" only if it puts X in
slot N, or names it as the Nth pick in its order (a pick that enters at skill 12 counts for slot 2, at 20 for slot 3).
Merely naming X somewhere in a set does not count, and PvP-only panels (AM-PvP, TR-P) are not counted for these PvE
labels. The guides are editorial, not game data: agreement between them shows what
players run, not what is strongest, and the owner's in-game screens stay the source of truth. Sources that read the same
upstream (a creator's video, the same client data) are noted where I could tell.

## Findings in brief

- **Metabot has no specialty picks.** Its class, build and skill pages list the five choices per skill (identical to our
  `skills.json`) and an editorial/top-player skill build, but no per-specialty pick rate and no recommended specialty.
  Its "top players" build (150 players) gives skill levels and stigmas only. Its pick-rate figure is per skill (for
  example Quick Slice 149 of 150), not per specialty. So every pick below comes from other guides.
- **Five guides were read:** GamesFuze, Skycoach, Corpus, aion2-meta.com and aion2turkiye.com. Seven sources were not
  read (section 2): two never used by rule, five refused or skipped by policy or access. gameplay.tips and Pixelnitro were read and carry no usable picks.
- **Slot-specific counts (12 skills):** a 2+ source slot 2 for **4** skills (Heart Gore 4, Quick Slice 4, Storm
  Rampage 4, Flash Slice 4); a 2+ source slot 3 for **2** (Heart Gore 5, Quick Slice 5);
  both slots for **2** (Heart Gore, Quick Slice). Single-source: Storm Rampage slot 3 (5), Whirlwind Slice slot 2 (2),
  Defiance slot 2 (4), Savage Roar slot 3 (3). Disputed: Savage Roar slot 2, Insignia Explosion slot 2, Ambush slot 2.
  Insignia Explosion slot 3 is contested. GamesFuze lists picks per skill but not per slot, so it is not counted as a slot
  witness anywhere. Shadowstrike, Infiltrate, Shadow Fall and most third slots are gaps. Many picks are named by several
  guides but as a different step (for example pick 5 on Storm Rampage), which is why the slot counts are lower than the
  "named by N guides" counts.
- **Slot 3 and every skill-16 choice sit beyond the Lv 1-45 guide.** Points take a skill to 10 and each Daevanion
  board adds up to 4; aion2turkiye's endgame table has the top 25 players at 13 to 15. Skycoach says level 16 needs
  Soulstones or gear. The picks are endgame information for the 1-45 guide; E7 should show them as "after Lv 45 / needs
  +N levels", not as plan items.
- **The sources swap a pick in at skill 16.** Between 16 and 19 a skill has only two slots, and the guides put the new
  skill-16 choice over the slot-1 pick (Heart Gore, Quick Slice, Storm Rampage, Insignia Explosion). E7 has to decide
  how the picks array maps to that (section 4).
- **Slot-1 conflicts, not in scope but worth a look (labelled contested):** Storm Rampage pick 1 (SC, CP against TR-D), Savage Roar pick 2 (TR against SC, CP), Ambush pick 1 (Engraves 2 Insignias) is
  put first only by aion2turkiye; Skycoach, Corpus and aion2-meta open with Absorb (2). Heart Gore pick 3 (crit) is put
  first only by aion2turkiye's Dungeon panel; the leveling guides open with Absorb (1). Quick Slice pick 3 has two
  publishers (aion2-meta, aion2turkiye Dungeon) against Absorb in the leveling guides.
- **Metabot's skill page adds one fact worth checking in game:** "Each [specialization] needs its stigma item and a
  minimum skill level" (Quick Slice page, specializations paragraph). Our data does not model the stigma item.

## 1. Summary table

Slot 1 is the pick already in `builds.json` where one exists (kept, not re-researched; contested ones are flagged). Numbers are choice numbers `n` from `skills.json` (`spec:assassin:<skill>:<n>`). "Active from" is the effective skill level at which the pick works: the larger of the slot level (8 / 12 / 20) and the choice level (8 / 8 / 8 / 12 / 16).

| Skill | In guide build | Slot 1 | Slot 2 | Slot 3 | Slots 2 + 3 agreement |
|---|---|---|---|---|---|
| Heart Gore | yes | **3** (contested) | **4** (2+ sources) | **5** (2+ sources) | 2+ sources / 2+ sources |
| Insignia Explosion | yes | **2** (2+ sources) | **5** (disputed) | **3** (contested) | disputed / contested |
| Quick Slice | yes | **3** (contested) | **4** (2+ sources) | **5** (2+ sources) | 2+ sources / 2+ sources |
| Savage Roar | yes | **2** (contested) | **4** (disputed) | (none; single-source) | disputed / single-source |
| Storm Rampage | yes | **1** (contested) | **4** (2+ sources) | **5** (single-source) | 2+ sources / single-source |
| Flash Slice | yes | **2** (2+ sources) | **4** (2+ sources) | (none; gap) | 2+ sources / gap |
| Shadowstrike | yes | **2** (2+ sources) | (none; gap) | (none; gap) | gap / gap |
| Ambush | yes | **1** (contested) | **2** (disputed) | (none; gap) | disputed / gap |
| Infiltrate | no | **2** (2+ sources) | (none; gap) | (none; gap) | gap / gap |
| Whirlwind Slice | no | **1** (disputed) | **2** (single-source) | (none; gap) | single-source / gap |
| Shadow Fall | no | **1** (single-source) | (none; gap) | (none; gap) | gap / gap |
| Defiance | no | **3** (2+ sources) | **4** (single-source) | (none; gap) | single-source / gap |

## 2. Sources, access and what each gave

All pages were read on **2026-10-16 (UTC)**, with User-Agent `DaevaCompanionResearch/0.1 (+https://daevacompanion.com)`,
one request at a time, at least 6 s apart. **34 requests in total** (robots.txt, terms/home lookups and content pages;
section 7). Cached pages are only in the session scratchpad, not in the repo.

| Key | Source | URL read | Access check | Notes |
|---|---|---|---|---|
| MB | Metabot | https://metabot.gg/en/aion-2/classes/assassin, https://metabot.gg/en/aion-2/classes/assassin/build, https://metabot.gg/en/aion-2/skills/quick-slice | Approved in earlier vetting; robots.txt `Allow: /`, `/api/` and profile pages disallowed (not touched). Game build shown: `0.0.4387.0`. | Choice lists only; no picks. |
| GF | GamesFuze | https://gamesfuze.com/guides/aion-2-assassin-build-best-skills-stigmas-and-rotation/ | robots.txt allows; no terms page found (only a privacy policy). Tier 3, facts only. | "Updated Oct 5, 2026". Two picks for 7 skills, ordered by skill priority. Not slot-ordered, so never counted as a slot witness (only as "named by"). |
| SC | Skycoach | https://skycoach.gg/blog/aion-2/articles/assassin-guide | robots.txt allows (Crawl-delay 1); customer agreement `/agreement/customer` has no bot or scraping clause. Tier 3. | No date visible. Skill table plus leveling order for Heart Gore (Absorb at 8, Multi-Hit at 12, reset at 16). |
| CP | Corpus | https://corpus.gg/blog/aion-2/assassin-pve-build | robots.txt allows (`/data/` disallowed, not touched); `/terms` has no automation clause. Tier 3. | Published Oct 4, updated Oct 10, 2026. Built from two creators, Grobs and aLuckyRO; "Grobs" and "aLuckyRO" are named where they differ. |
| AM | aion2-meta.com | https://aion2-meta.com/guides/assassin/ | robots.txt `Allow: /`; only a privacy page found, no terms. Tier 3, facts only. | Changelog entry 9 October 2026 (new Specialties section). Picks taken from Korean top players, shown with the global client's effect text; separate PvE and PvP columns, slot-by-slot with the level each pick goes in. Choice numbers read from the page's own icon labels. Only 8 skills listed. |
| TR | aion2turkiye.com | https://aion2turkiye.com/en/class/assassin/ | robots.txt `Allow: /`; no terms page found. Tier 3, facts only. | No date visible. Three panels: TR-L (Leveling), TR-D (Dungeon, single-target PvE), TR-P (PvP). |

**Read, no usable picks:** gameplay.tips skills guide (https://gameplay.tips/guides/aion-2-skills-guide-active-passive-and-stigma.html,
explains slots and levels only); Pixelnitro (https://pixelnitro.com/aion-2-assassin-build-guide-best-skills-and-specs-for-pvp-pve-2026-global-launch-meta/,
one vague sentence about favouring Multi-Hit on Heart Gore and Whirlwind Slice, not counted). Terms status: gameplay.tips and Pixelnitro each show only a privacy-policy link on the home page and no terms page, so tier 3, facts only.

**Not read, by policy or access:**

| Site | Reason |
|---|---|
| aion2.th.gl | Never fetched (CLAUDE.md). |
| Game8 | Never used (CLAUDE.md). |
| games.gg (our existing source) | Guide page returned **403** on the first request; stopped, no retry. robots.txt itself allows AI input. Owner hand-check if wanted: https://games.gg/aion-2/guides/aion-2-assassin-build-guide/ |
| thegameswiki.com | robots.txt returned **429** (Vercel Security Checkpoint); stopped, no second request. |
| aion2maps.com | robots.txt disallows ClaudeBot and anthropic-ai (`Disallow: /`): opted out. |
| GamerBlurb, expcarry.com | robots.txt names ClaudeBot (inside a shared group with `*`). CLAUDE.md says a site that names Claude is not fetched, so I did not read them; owner hand-check if wanted. |
| allthings.how, others from search (mmoexp, aoeah, keengamer) | Not needed once five guides had picks; not requested. |

**Independence.** The five guides are different publishers. CP quotes two creators' videos; AM uses Korean top-player
data. TR and AM both carry a "Lv 8 / 12 / 16" style table, but their picks differ, so I treat them as separate. If two
guides copied the same video I could not tell from the pages.

## 3. Per-skill detail

Source keys are defined in section 2; every source was read on 2026-10-16 (UTC). "Active from" is the effective skill level at which the pick starts to work.

### Heart Gore

Learned at character Lv 4. In the guide build: yes. Current `specialtyPicks`: 3.

Choices (from `data/classes/assassin/skills.json`):

| n | Skill Lv | Effect |
|---|---|---|
| 1 | 8 | Absorbs 70, 70% HP |
| 2 | 8 | Engraves 1 Insignia for 10s on hit |
| 3 | 8 | Up to +20% Critical Hit when less targets hit |
| 4 | 12 | Multi-Hit on hit |
| 5 | 16 | Resets [Heart Gore] cooldown on landing a Critical Hit |

| Slot | Opens at | Pick | Active from | Agreement | Sources | Reason |
|---|---|---|---|---|---|---|
| 1 | 8 | **3** Up to +20% Critical Hit when less targets hit | 8 | contested | TR-D (1st pick). Not counted: GF names it but gives no slot order; AM-PvP and TR-P are PvP. | Existing pick, kept, but contested: SC, CP and TR-L open with Absorb (1) while leveling, and only TR-D puts the crit bonus first. More crits mean more cooldown resets once pick 5 is in. |
| 2 | 12 | **4** Multi-Hit on hit | 12 | 2+ sources | SC (2nd step), CP (2nd step), AM-PvE (enters at 12), TR-L, TR-D (2nd) | Multi-Hit is the first damage pick that opens at skill 12 and sits second in four guides. |
| 3 | 20 | **5** Resets [Heart Gore] cooldown on landing a Critical Hit | 20 | 2+ sources | SC (3rd step), TR-L (3rd), TR-D (3rd). Also named by CP and AM-PvE, but as a second pick. GF is not slot-ordered and is not counted. | The crit cooldown reset is the skill's main payoff. It needs skill 16 and slot 3 opens at 20, so guides that describe an order swap it in over an earlier pick at 16 (section 4.1). |

### Insignia Explosion

Learned at character Lv 14. In the guide build: yes. Current `specialtyPicks`: 2.

Choices (from `data/classes/assassin/skills.json`):

| n | Skill Lv | Effect |
|---|---|---|
| 1 | 8 | Rotate effect |
| 2 | 8 | +50% Multi-Hit on hit |
| 3 | 8 | Keeps 2 Insignia stacks after Insignia Explosion |
| 4 | 12 | +1s Stun duration |
| 5 | 16 | -3s cooldown |

| Slot | Opens at | Pick | Active from | Agreement | Sources | Reason |
|---|---|---|---|---|---|---|
| 1 | 8 | **2** +50% Multi-Hit on hit | 8 | 2+ sources | SC, CP, AM-PvE, TR-L (each first) | Existing pick, kept. First pick in every PvE guide except TR-D. |
| 2 | 12 | **5** -3s cooldown | 16 | disputed | CP-Grobs (replaces its 2nd pick from 16), AM-PvE (2nd). Against: SC and TR-L put pick 3 second (CP-Grobs does too before 16). GF is not slot-ordered and is not counted. | -3s cooldown, the late damage pick (needs skill 16). Two publishers for 5 and two for 3 in this slot, so disputed and not proposed. |
| 3 | 20 | **3** Keeps 2 Insignia stacks after Insignia Explosion | 20 | contested | AM-PvE (3rd). Against: SC and TR-L put pick 5 third. | Keeping 2 Insignia stacks makes the next cast full sooner. One publisher (AM) for 3 here against two (SC, TR-L) for 5; the order 5, 2, 3 in section 4.1 is a design choice, not evidence. |

### Quick Slice

Learned at character Lv 1. In the guide build: yes. Current `specialtyPicks`: 3.

Choices (from `data/classes/assassin/skills.json`):

| n | Skill Lv | Effect |
|---|---|---|
| 1 | 8 | +20% MP restored |
| 2 | 8 | Absorbs 70, 70% HP |
| 3 | 8 | +50% Multi-Hit on hit |
| 4 | 12 | -1s Insignia Explosion cooldown on hit |
| 5 | 16 | Ignores Block and Evasion and lands as a Critical Hit |

| Slot | Opens at | Pick | Active from | Agreement | Sources | Reason |
|---|---|---|---|---|---|---|
| 1 | 8 | **3** +50% Multi-Hit on hit | 8 | contested | AM-PvE (1st), TR-D (1st). Against: SC, CP and TR-L open with Absorb (2). | Existing pick, kept, but contested: two publishers for Multi-Hit first, three for Absorb first while leveling. |
| 2 | 12 | **4** -1s Insignia Explosion cooldown on hit | 12 | 2+ sources | AM-PvE (enters at 12), TR-L (2nd), TR-D (2nd) | -1s Insignia Explosion cooldown on every hit; Quick Slice is the skill you hit all fight. GF, SC and CP name it but without a slot order. |
| 3 | 20 | **5** Ignores Block and Evasion and lands as a Critical Hit | 20 | 2+ sources | AM-PvE (enters at 20), TR-L (3rd), TR-D (3rd) | Guaranteed crit that ignores Block and Evasion, which also lights Heart Gore. Needs skill 16; guides swap it in over the slot-1 pick at 16 (section 4.1). |

### Savage Roar

Learned at character Lv 1. In the guide build: yes. Current `specialtyPicks`: 2.

Choices (from `data/classes/assassin/skills.json`):

| n | Skill Lv | Effect |
|---|---|---|
| 1 | 8 | -20% MP consumed |
| 2 | 8 | +20% Skill Speed |
| 3 | 8 | Deals up to 12% more damage when less targets are hit |
| 4 | 12 | -1s [Shadowstrike] cooldown on hit |
| 5 | 16 | Pulls nearby targets on using [Savage Smash] |

| Slot | Opens at | Pick | Active from | Agreement | Sources | Reason |
|---|---|---|---|---|---|---|
| 1 | 8 | **2** +20% Skill Speed | 8 | contested | TR-L, TR-D (1st). Against: SC and CP list -20% MP (pick 1) first. GF is not slot-ordered and is not counted. | Existing pick, kept, but contested: one publisher puts Skill Speed first, two put -20% MP first. Every guide names Skill Speed somewhere. |
| 2 | 12 | **4** -1s [Shadowstrike] cooldown on hit | 12 | disputed | TR-L, TR-D (2nd) for 4. Against: SC and CP put pick 2 second. GF is not slot-ordered and is not counted. | -1s Shadowstrike cooldown on hit keeps you behind the target. One publisher for 4 here, two for pick 2 (the Skill Speed that is our slot 1); disputed and not proposed. |
| 3 | 20 | (none) | | single-source | 3 (TR-L, TR-D third; CP-aLuckyRO suggests it without an order). No guide puts 1 third. | Pick 3 (fewer-targets bonus) is single-source (TR); not proposed, since SC and CP want pick 1 in the set. AM-PvP names 3 but is PvP and not counted. |

### Storm Rampage

Learned at character Lv 5. In the guide build: yes. Current `specialtyPicks`: none.

Choices (from `data/classes/assassin/skills.json`):

| n | Skill Lv | Effect |
|---|---|---|
| 1 | 8 | Absorbs 500, 500% HP |
| 2 | 8 | Restores 120 MP on hit |
| 3 | 8 | Changes to mobile skill |
| 4 | 12 | Multi-Hit on hit |
| 5 | 16 | -1s all skill cooldowns on hit |

| Slot | Opens at | Pick | Active from | Agreement | Sources | Reason |
|---|---|---|---|---|---|---|
| 1 | 8 | **1** Absorbs 500, 500% HP | 8 | contested | SC (1st), CP (1st). Against: TR-D puts 2 first. GF names 3 but is not slot-ordered and is not counted. | Not in builds.json yet. Absorb while leveling is the SC and CP pick; GF and TR-D name other first picks, so slot 1 is a leveling stopgap and contested. |
| 2 | 12 | **4** Multi-Hit on hit | 12 | 2+ sources | AM-PvE (enters at 12), TR-D (2nd) | Multi-Hit on hit at skill 12; AM and TR give it before the skill-16 pick. |
| 3 | 20 | **5** -1s all skill cooldowns on hit | 20 | single-source | TR-D (3rd). SC, CP and AM-PvE name 5 but as a second pick; GF is not slot-ordered. | -1s all cooldowns on hit, stigmas included. Needs skill 16; in AM and TR it replaces the slot-1 pick at 16 (section 4.1). Widely named, but only TR places it third. |

### Flash Slice

Learned at character Lv 8. In the guide build: yes. Current `specialtyPicks`: none.

Choices (from `data/classes/assassin/skills.json`):

| n | Skill Lv | Effect |
|---|---|---|
| 1 | 8 | Blind lasts 2s longer |
| 2 | 8 | Range +6m |
| 3 | 8 | Up to 20% more damage when hitting more targets |
| 4 | 12 | +1 consecutive use |
| 5 | 16 | 50% chance to rotate and Stun 3s when hitting a Blind target |

| Slot | Opens at | Pick | Active from | Agreement | Sources | Reason |
|---|---|---|---|---|---|---|
| 1 | 8 | **2** Range +6m | 8 | 2+ sources | SC, CP, TR-D (each first) | Not in builds.json yet. +6m range keeps the reposition useful on moving bosses. |
| 2 | 12 | **4** +1 consecutive use | 12 | 2+ sources | SC (level-12 extra use), CP (second step), TR-D (2nd) | +1 consecutive use, available at skill 12. |
| 3 | 20 | (none) | | gap | none (TR-L names 3 and TR-P names 1 in slot 1, different goals) | No source gives a third pick. |

### Shadowstrike

Learned at character Lv 1. In the guide build: yes. Current `specialtyPicks`: 2.

Choices (from `data/classes/assassin/skills.json`):

| n | Skill Lv | Effect |
|---|---|---|
| 1 | 8 | +1s Stun duration |
| 2 | 8 | +20% caster Critical Damage Boost for 10s on hit |
| 3 | 8 | 50% chance to inflict Seal for 5s on hit |
| 4 | 12 | 50% chance to inflict Root for 5s on hit |
| 5 | 16 | Changes to AoE Skill |

| Slot | Opens at | Pick | Active from | Agreement | Sources | Reason |
|---|---|---|---|---|---|---|
| 1 | 8 | **2** +20% caster Critical Damage Boost for 10s on hit | 8 | 2+ sources | SC, CP, TR-L, TR-D (each only or first pick) | Existing pick, kept. TR-D calls it the one pick that matters in PvE. |
| 2 | 12 | (none) | | gap | none for PvE (PvP only, not counted: AM-PvP and TR-P name 3) | No PvE source names a second pick. |
| 3 | 20 | (none) | | gap | none for PvE (PvP only, not counted: AM-PvP names 5) | No PvE source names a third pick. |

### Ambush

Learned at character Lv 3. In the guide build: yes. Current `specialtyPicks`: 1.

Choices (from `data/classes/assassin/skills.json`):

| n | Skill Lv | Effect |
|---|---|---|
| 1 | 8 | Engraves 2 Insignias for 10s on landing as a Back attack |
| 2 | 8 | Absorbs 300, 300% HP |
| 3 | 8 | Breaks Protective Shields on hit |
| 4 | 12 | 50% chance to trigger [Whirlwind Slice] on hit |
| 5 | 16 | +2 consecutive uses |

| Slot | Opens at | Pick | Active from | Agreement | Sources | Reason |
|---|---|---|---|---|---|---|
| 1 | 8 | **1** Engraves 2 Insignias for 10s on landing as a Back attack | 8 | contested | TR-L, TR-D (1st). SC, CP and AM-PvE put 2 first. | Existing pick, kept, but contested: one publisher for 1, three for Absorb (2) first. Flagged for the owner; slot 1 is outside this task. |
| 2 | 12 | **2** Absorbs 300, 300% HP | 12 | disputed | TR-L, TR-D (2nd) for 2. AM-PvE puts 4 second (enters at 12). SC, CP and AM-PvE put 2 in slot 1. | Absorb is a heal button; every guide gives Ambush this pick, but only TR places it second while AM puts 4 there: one publisher each, so disputed and not proposed. |
| 3 | 20 | (none) | | gap | none (AM-PvE names 4 as its 2nd pick, not 3rd; AM-PvP names 3, not counted) | No source places a pick third. 4 (50% chance to trigger Whirlwind Slice) is AM-PvE's second pick; CP-Grobs calls Ambush and Whirlwind Slice a damage loss. |

### Infiltrate

Learned at character Lv 10. In the guide build: no (not in skillOrder). Current `specialtyPicks`: none.

Choices (from `data/classes/assassin/skills.json`):

| n | Skill Lv | Effect |
|---|---|---|
| 1 | 8 | Restores 300 Stamina on landing [Infiltrate] |
| 2 | 8 | +10m [Infiltrate] range |
| 3 | 8 | Breaks Protective Shields on landing [Infiltrate] |
| 4 | 12 | Adds [Dark Strike] Chain Skill |
| 5 | 16 | +20% [Infiltrate] Blind Chance |

| Slot | Opens at | Pick | Active from | Agreement | Sources | Reason |
|---|---|---|---|---|---|---|
| 1 | 8 | **2** +10m [Infiltrate] range | 8 | 2+ sources | SC, CP (first). TR-P also, not counted (PvP). | +10m range puts it on par with Shadowstrike. Not in the guide skill order. |
| 2 | 12 | (none) | | gap | none for PvE (TR-P names 3, PvP, not counted) | No PvE source. |
| 3 | 20 | (none) | | gap | none | No source. |

### Whirlwind Slice

Learned at character Lv 7. In the guide build: no (not in skillOrder). Current `specialtyPicks`: none.

Choices (from `data/classes/assassin/skills.json`):

| n | Skill Lv | Effect |
|---|---|---|
| 1 | 8 | +50% Multi-Hit on hit |
| 2 | 8 | Changes to AoE damage |
| 3 | 8 | +16m range |
| 4 | 12 | +20% Stun Chance |
| 5 | 16 | 25% chance to reset [Whirlwind Slice] cooldown on Evasion |

| Slot | Opens at | Pick | Active from | Agreement | Sources | Reason |
|---|---|---|---|---|---|---|
| 1 | 8 | **1** +50% Multi-Hit on hit | 8 | disputed | AM-PvE (1st) for 1; TR-L (1st) for 2; CP-aLuckyRO names both without an order | Multi-Hit (single bosses) vs AoE (pack farming): one source each, so disputed. Not in the guide skill order; CP-Grobs skips the skill. |
| 2 | 12 | **2** Changes to AoE damage | 12 | single-source | AM-PvE (2nd) | AoE damage as the second pick, AM only. Not proposed for builds.json. |
| 3 | 20 | (none) | | gap | none (TR-P names 3 and 4, PvP, not counted) | No source. |

### Shadow Fall

Learned at character Lv 12. In the guide build: no (not in skillOrder). Current `specialtyPicks`: none.

Choices (from `data/classes/assassin/skills.json`):

| n | Skill Lv | Effect |
|---|---|---|
| 1 | 8 | Absorbs 1000, 1000% HP |
| 2 | 8 | Engraves 3 Insignias for 10s on hit |
| 3 | 8 | -5s cooldown |
| 4 | 12 | +1s Knockdown duration |
| 5 | 16 | Can be used on targets afflicted with Blind |

| Slot | Opens at | Pick | Active from | Agreement | Sources | Reason |
|---|---|---|---|---|---|---|
| 1 | 8 | **1** Absorbs 1000, 1000% HP | 8 | single-source | CP-aLuckyRO (leveling only) | Absorb while leveling. Not in the guide skill order (builds.json already notes games.gg calling it useless in PvE). |
| 2 | 12 | (none) | | gap | none for PvE (TR-P names 4, PvP, not counted) | No PvE source. |
| 3 | 20 | (none) | | gap | none for PvE (TR-P names 5, PvP, not counted) | No PvE source. |

### Defiance

Learned at character Lv 16. In the guide build: no (not in skillOrder). Current `specialtyPicks`: none.

Choices (from `data/classes/assassin/skills.json`):

| n | Skill Lv | Effect |
|---|---|---|
| 1 | 8 | Adds [Wrath Burst] Chain Skill |
| 2 | 8 | Restores 1,000 Stamina on using [Defiance] |
| 3 | 8 | Restores 20% HP on using [Defiance] |
| 4 | 12 | +2s Tenacity duration |
| 5 | 16 | +50% PvE Damage Tolerance and +25% PvP Damage Tolerance for Tenacity duration |

| Slot | Opens at | Pick | Active from | Agreement | Sources | Reason |
|---|---|---|---|---|---|---|
| 1 | 8 | **3** Restores 20% HP on using [Defiance] | 8 | 2+ sources | SC, CP, TR-L, TR-D (first) | Restores 20% HP on use. The pick every source takes; the skill is a safety button. |
| 2 | 12 | **4** +2s Tenacity duration | 12 | single-source | TR-D (2nd). TR-P also, not counted (PvP). | +2s Tenacity duration. Only TR names a second pick. |
| 3 | 20 | (none) | | gap | none for PvE (TR-P names 5, PvP, not counted) | Only TR's PvP panel names a third pick. |

## 4. Notes for E7

**4.1 Picks order versus activation.** The sources describe picks as a growing set, not as "slot 2 is X": Heart Gore
in aion2-meta is Multi-Hit at 12, Reset at 16, then a third at 20; aion2turkiye notes that the skill-16 reset takes the place of the crit pick when only
two slots are open. So the useful runtime rule is: the player's active set at effective skill level L is the
first *k* picks, in priority order, whose choice level is at most L, where *k* is 1 at 8, 2 at 12 and 3 at 20. A
positional array `[slot1, slot2, slot3]` (as in 5.1) lists today's pick first, so it is not the priority order. The
priority lists for the four skills that have a skill-16 pick in their set are:

| Skill | Priority list | Active set at 8 / 12 / 16 / 20 |
|---|---|---|
| Heart Gore | 5, 4, 3 | {3} / {4, 3} / {5, 4} / {5, 4, 3} |
| Quick Slice | 5, 4, 3 | {3} / {4, 3} / {5, 4} / {5, 4, 3} |
| Insignia Explosion | 5, 2, 3 | {2} / {2, 3} / {5, 2} / {5, 2, 3} |
| Storm Rampage | 5, 4, 1 | {1} / {4, 1} / {5, 4} / {5, 4, 1} |

The positional arrays in section 5 keep slot 1 as today's pick, so they show the end state at skill 20 but not the
swap at 16. If E7 stores a plain positional array, the swap needs either this priority rule or a per-pick
"active from" level (the table in section 3 already has it). This is a design question for E7, not something the
data decides.

**4.2 Reach within Lv 1-45.** Slot 2 needs skill 12 (10 from points plus 2 from Daevanion). Slot 3 and every
skill-16 choice need levels that Daevanion alone cannot give by 45. The recommendations for slot 3 and for choice 5 are
therefore endgame picks: label them so in the UI.

**4.3 Choices vs slots.** The same choice never fills two slots, so a skill's picks must be distinct. All picks below
are distinct.

## 5. How to apply (proposal only, not applied)

Nothing here is written to `data/`. If the owner agrees:

**5.1 `data/classes/assassin/builds.json`, `build:assassin:guide`.** Replace/extend `specialtyPicks` (schema:
arrays of at most 3 ids, `^spec:[a-z]+:[a-z0-9-]+:[1-9]$`; no nulls, so a gap is a shorter array). Existing slot-1 entries
are unchanged; the first id of each array is today's pick.

```json
"specialtyPicks": {
  "skill:assassin:heart-gore":          ["spec:assassin:heart-gore:3", "spec:assassin:heart-gore:4", "spec:assassin:heart-gore:5"],
  "skill:assassin:insignia-explosion":  ["spec:assassin:insignia-explosion:2"],
  "skill:assassin:quick-slice":         ["spec:assassin:quick-slice:3", "spec:assassin:quick-slice:4", "spec:assassin:quick-slice:5"],
  "skill:assassin:savage-roar":         ["spec:assassin:savage-roar:2"],
  "skill:assassin:ambush":              ["spec:assassin:ambush:1"],
  "skill:assassin:shadowstrike":        ["spec:assassin:shadowstrike:2"],
  "skill:assassin:flash-slice":         ["spec:assassin:flash-slice:2", "spec:assassin:flash-slice:4"]
}
```

**Rule used:** a new pick is proposed only if it is labelled "2+ sources" (Heart Gore 4 and 5, Quick Slice 4 and 5,
Flash Slice 2 and 4). Slot 1 entries are the picks already in `builds.json`, left unchanged. Four of them are contested
(Heart Gore 3, Quick Slice 3, Savage Roar 2, Ambush 1), so they stay only if the owner accepts the existing pick.
`flash-slice` is a new key.

Not proposed: Storm Rampage. Its slot 2 (4) is 2+ sources, but slot 1 (1) is contested and the array cannot skip a
slot, so the owner should pick slot 1 first (then `[1, 4]` or `[2, 4]`); its slot 3 (5) is single-source. Also not proposed:
Insignia Explosion slots 2 (disputed) and 3 (contested), Savage Roar slots 2 (disputed) and 3 (single-source), Ambush
slots 2 (disputed) and 3 (gap), and every gap. Infiltrate, Whirlwind Slice, Shadow Fall and Defiance are not in
`skillOrder`; their researched picks are in section 3 only.

`tools/gen/gen.mjs` line 178 checks at most 3 picks and line 177 that each id is a choice of its skill; line 169 and 460
read only `[0]` of core skills, so the extra entries do not change the compiled tables today. E7's UI change is the
consumer of slots 2 and 3.

**5.2 Evidence and labels.** The builds schema has no place for per-pick status. Two options, both owner decisions:

1. One claim per skill and slot in `data/shared/asmodian/guide/claims.json` (next free ids), each with the
   shape already used there: `claim` ("Heart Gore slot 2: Multi-Hit on hit"), `verdict`, `sources` (the URLs in section 2,
   with short `quote`s only where needed; never copied wording), `verifiedAt: "2026-10-16"`, and a `note` naming the
   status (`2+ sources`, `single-source`, `disputed`). `npm run gen` then adds the URLs to the Sources card and
   `data/DATA_SOURCES.md`.
2. Add an optional `specialtyPickStatus` object to `builds.schema.json` and the guide build, keyed by choice id:
   `{ "spec:assassin:savage-roar:4": { "status": "disputed", "sources": [{ "url": "…" }], "note": "…" } }`.

New URLs for the Sources card (all read 2026-10-16): the five in section 2 (GF, SC, CP, AM, TR). GF and SC are
already cited elsewhere; CP, AM and TR are new.

**5.3 Labels in the UI.** `single-source` and `disputed` picks should carry the label (CLAUDE.md data policy). In this
set: single-source: Storm Rampage slot 3, Savage Roar slot 3, Whirlwind Slice slot 2, Defiance slot 2, Shadow Fall
slot 1; contested: Heart Gore slot 1, Quick Slice slot 1, Storm Rampage slot 1, Savage Roar slot 1, Insignia Explosion
slot 3, Ambush slot 1; disputed: Savage Roar slot 2, Insignia Explosion slot 2, Ambush slot 2, Whirlwind Slice slot 1.

**5.4 Tests.** Extend the build checks in `tests/` for "every pick is a choice of its skill, picks are distinct and at
most 3", and run `mig1`, `mig2` and `journey` after the change (CLAUDE.md "Never break saved progress"). Save keys
`sp:<key>:spec2` and `sp:<key>:spec3` are already reserved; this research changes none.

## 6. Gaps and open questions

- **No PvE pick for slots 2 and 3:** Shadowstrike (PvP panels name 3 then 4 or 5), Infiltrate, Shadow Fall, Flash Slice
  slot 3, Ambush slot 3, Defiance slot 3.
- **Disputed:** Ambush slot 2 (2 in aion2turkiye, 4 in aion2-meta); Whirlwind Slice slot 1 (1 in aion2-meta, 2 in
  aion2turkiye); Savage Roar slot 2 (4 in aion2turkiye, 2 in Skycoach and Corpus); Insignia Explosion slot 2 (5 in
  Corpus and aion2-meta, 3 in Skycoach and aion2turkiye). An owner decision or an in-game test settles
  these.
- **Contested (slot 1 is outside this task):** Heart Gore 3, Quick Slice 3, Storm Rampage 1, Savage Roar 2, Ambush 1; Insignia Explosion slot 3.
- **Single-source:** see 5.3.
- **Unread sources worth an owner glance:** games.gg (403 for scripts) and thegameswiki (429) are already in our source
  list; GamerBlurb and expcarry name Claude in robots.txt.
- **Re-check after a patch:** all five guides date from Oct 4-10 2026 or are undated; specialty text can change.
  Metabot build `0.0.4387.0` was current on 2026-10-16.
- **Stigma item per specialization** (Metabot, Quick Slice page): not in our data model; confirm in game whether a
  specialization needs an item, and whether that changes "recommended pick" advice for new characters.

## 7. Request log

34 requests, all with the research User-Agent, at least 6 s apart. Status 200 unless shown.

| UTC time (2026-10-16) | Status | URL |
|---|---|---|
| 02:19:18 | 200 | https://metabot.gg/robots.txt |
| 02:19:30 | 200 | https://metabot.gg/en/aion-2/classes/assassin |
| 02:19:53 | 200 | https://metabot.gg/en/aion-2/classes/assassin/build |
| 02:20:16 | 200 | https://metabot.gg/en/aion-2/skills/quick-slice |
| 02:20:29 | 200 | https://gamesfuze.com/robots.txt |
| 02:20:36 | 200 | https://games.gg/robots.txt |
| 02:20:49 | 200 | https://gamesfuze.com/ |
| 02:21:03 | 200 | https://gamesfuze.com/guides/aion-2-assassin-build-best-skills-stigmas-and-rotation/ |
| 02:21:18 | **403** | https://games.gg/aion-2/guides/aion-2-assassin-build-guide/ (stopped for this host) |
| 02:21:33 | 200 | https://skycoach.gg/robots.txt |
| 02:21:39 | 200 | https://gamerblurb.com/robots.txt (names ClaudeBot; page not requested) |
| 02:21:56 | 404 | https://skycoach.gg/terms-of-service (guessed path) |
| 02:22:09 | 200 | https://skycoach.gg/agreement/customer |
| 02:22:21 | 200 | https://skycoach.gg/blog/aion-2/articles/assassin-guide |
| 02:22:53 | **429** | https://thegameswiki.com/robots.txt (stopped for this host) |
| 02:22:59 | 200 | https://expcarry.com/robots.txt (names ClaudeBot; page not requested) |
| 02:23:07 | 200 | https://pixelnitro.com/robots.txt |
| 02:23:20 | 200 | https://pixelnitro.com/ |
| 02:23:32 | 301 | https://pixelnitro.com/?p=20588 |
| ~02:23:40 (not logged; between 02:23:32 and 02:23:58) | 200 | https://pixelnitro.com/aion-2-assassin-build-guide-best-skills-and-specs-for-pvp-pve-2026-global-launch-meta/ |
| 02:23:58 | 200 | https://gameplay.tips/robots.txt |
| 02:24:11 | 200 | https://gameplay.tips/ |
| 02:24:18 | 200 | https://gameplay.tips/guides/aion-2-skills-guide-active-passive-and-stigma.html |
| 02:24:32 | 200 | https://corpus.gg/robots.txt |
| 02:24:39 | 200 | https://aion2maps.com/robots.txt (opted out; page not requested) |
| 02:24:45 | 200 | https://aion2-meta.com/robots.txt |
| 02:24:51 | 200 | https://aion2turkiye.com/robots.txt |
| 02:25:05 | 200 | https://corpus.gg/ |
| 02:25:11 | 200 | https://aion2-meta.com/ |
| 02:25:17 | 200 | https://aion2turkiye.com/ |
| 02:25:27 | 200 | https://corpus.gg/terms |
| 02:25:38 | 200 | https://corpus.gg/blog/aion-2/assassin-pve-build |
| 02:26:38 | 200 | https://aion2-meta.com/guides/assassin/ |
| 02:26:45 | 200 | https://aion2turkiye.com/en/class/assassin/ |
