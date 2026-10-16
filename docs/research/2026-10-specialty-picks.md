# Specialty picks for slots 2 and 3 (research for 0.3 E7)

Research session, 2026-10-16 (UTC). **Docs only: no file in `data/` or `src/` was changed.** Feeds step E7 of 0.3
(recommended picks for specialty slots 2 and 3). Follows the data and fetching policy in `CLAUDE.md` and
`docs/team/data-research.md`.

**Evidence labels.** *2+ sources* = at least two different publishers name the pick as a main pick for that skill.
*single-source* = one publisher. *disputed* = sources name different picks for the same slot and neither side has more
support. *gap* = no source names a pick. The guides are editorial, not game data: agreement between them shows what
players run, not what is strongest, and the owner's in-game screens stay the source of truth. Sources that read the same
upstream (a creator's video, the same client data) are noted where I could tell.

## Findings in brief

- **Metabot has no specialty picks.** Its class, build and skill pages list the five choices per skill (identical to our
  `skills.json`) and an editorial/top-player skill build, but no per-specialty pick rate and no recommended specialty.
  Its "top players" build (150 players) gives skill levels and stigmas only. Its pick-rate figure is per skill (for
  example Quick Slice 149 of 150), not per specialty. So every pick below comes from other guides.
- **Five guides were read:** GamesFuze, Skycoach, Corpus, aion2-meta.com and aion2turkiye.com. Five more were refused or
  skipped by policy (section 2). gameplay.tips and Pixelnitro were read and carry no usable picks.
- **Skills with a 2+ source pick for both slot 2 and slot 3: 4** (Heart Gore, Insignia Explosion, Quick Slice, Storm
  Rampage). 7 skills have a 2+ source slot 2 (those four plus Flash Slice, Ambush, Whirlwind Slice), and 4 have a 2+
  source slot 3. Savage Roar is disputed in both slots. Shadowstrike, Infiltrate, Shadow Fall and Defiance are gaps
  or single-source.
- **Slot 3 and every skill-16 choice sit beyond the Lv 1-45 guide.** Points take a skill to 10 and each Daevanion
  board adds up to 4; aion2turkiye's endgame table has the top 25 players at 13 to 15. Skycoach says level 16 needs
  Soulstones or gear. The picks are endgame information for the 1-45 guide; E7 should show them as "after Lv 45 / needs
  +N levels", not as plan items.
- **The sources swap a pick in at skill 16.** Between 16 and 19 a skill has only two slots, and the guides put the new
  skill-16 choice over the slot-1 pick (Heart Gore, Quick Slice, Storm Rampage, Insignia Explosion). E7 has to decide
  how the picks array maps to that (section 4).
- **Slot-1 conflict, not in scope but worth a look:** Ambush pick 1 (Engraves 2 Insignias) is supported only by
  aion2turkiye; Skycoach, Corpus and aion2-meta open with Absorb (2). Leveling sources also open Heart Gore and Quick
  Slice with Absorb, where `builds.json` has crit (3) and Multi-Hit (3).
- **Metabot's skill page adds one fact worth checking in game:** "Each [specialization] needs its stigma item and a
  minimum skill level" (Quick Slice page, specializations paragraph). Our data does not model the stigma item.

## 1. Summary table

Slot 1 is the pick already in `builds.json` where one exists (kept, not re-researched; contested ones are flagged). Numbers are choice numbers `n` from `skills.json` (`spec:assassin:<skill>:<n>`). "Active from" is the effective skill level at which the pick works: the larger of the slot level (8 / 12 / 20) and the choice level (8 / 8 / 8 / 12 / 16).

| Skill | In guide build | Slot 1 | Slot 2 | Slot 3 | Slots 2 + 3 agreement |
|---|---|---|---|---|---|
| Heart Gore | yes | **3** (2+ sources) | **4** (2+ sources) | **5** (2+ sources) | 2+ sources / 2+ sources |
| Insignia Explosion | yes | **2** (2+ sources) | **5** (2+ sources) | **3** (2+ sources) | 2+ sources / 2+ sources |
| Quick Slice | yes | **3** (2+ sources) | **4** (2+ sources) | **5** (2+ sources) | 2+ sources / 2+ sources |
| Savage Roar | yes | **2** (2+ sources) | **4** (disputed) | **1** (disputed) | disputed / disputed |
| Storm Rampage | yes | **1** (2+ sources) | **4** (2+ sources) | **5** (2+ sources) | 2+ sources / 2+ sources |
| Flash Slice | yes | **2** (2+ sources) | **4** (2+ sources) | (none) | 2+ sources / gap |
| Shadowstrike | yes | **2** (2+ sources) | (none) | (none) | gap / gap |
| Ambush | yes | **1** (single-source) | **2** (2+ sources) | **4** (single-source) | 2+ sources / single-source |
| Infiltrate | no | **2** (2+ sources) | (none) | (none) | gap / gap |
| Whirlwind Slice | no | **1** (2+ sources) | **2** (2+ sources) | (none) | 2+ sources / gap |
| Shadow Fall | no | **1** (single-source) | (none) | (none) | gap / gap |
| Defiance | no | **3** (2+ sources) | **4** (single-source) | **5** (single-source) | single-source / single-source |

## 2. Sources, access and what each gave

All pages were read on **2026-10-16 (UTC)**, with User-Agent `DaevaCompanionResearch/0.1 (+https://daevacompanion.com)`,
one request at a time, at least 6 s apart. **34 requests in total** (robots.txt, terms/home lookups and content pages;
section 7). Cached pages are only in the session scratchpad, not in the repo.

| Key | Source | URL read | Access check | Notes |
|---|---|---|---|---|
| MB | Metabot | https://metabot.gg/en/aion-2/classes/assassin, https://metabot.gg/en/aion-2/classes/assassin/build, https://metabot.gg/en/aion-2/skills/quick-slice | Approved in earlier vetting; robots.txt `Allow: /`, `/api/` and profile pages disallowed (not touched). Game build shown: `0.0.4387.0`. | Choice lists only; no picks. |
| GF | GamesFuze | https://gamesfuze.com/guides/aion-2-assassin-build-best-skills-stigmas-and-rotation/ | robots.txt allows; no terms page found (only a privacy policy). Tier 3, facts only. | "Updated Oct 5, 2026". Two picks for 7 skills, ordered by skill priority. Not slot-specific. |
| SC | Skycoach | https://skycoach.gg/blog/aion-2/articles/assassin-guide | robots.txt allows (Crawl-delay 1); customer agreement `/agreement/customer` has no bot or scraping clause. Tier 3. | No date visible. Skill table plus leveling order for Heart Gore (Absorb at 8, Multi-Hit at 12, reset at 16). |
| CP | Corpus | https://corpus.gg/blog/aion-2/assassin-pve-build | robots.txt allows (`/data/` disallowed, not touched); `/terms` has no automation clause. Tier 3. | Published Oct 4, updated Oct 10, 2026. Built from two creators, Grobs and aLuckyRO; "Grobs" and "aLuckyRO" are named where they differ. |
| AM | aion2-meta.com | https://aion2-meta.com/guides/assassin/ | robots.txt `Allow: /`; only a privacy page found, no terms. Tier 3, facts only. | Changelog entry 9 October 2026 (new Specialties section). "Korean meta picks, with the text of the global client", separate PvE and PvP columns, slot-by-slot with the level each pick goes in. Choice numbers read from the page's own icon labels. Only 8 skills listed. |
| TR | aion2turkiye.com | https://aion2turkiye.com/en/class/assassin/ | robots.txt `Allow: /`; no terms page found. Tier 3, facts only. | No date visible. Three panels: TR-L (Leveling), TR-D (Dungeon, single-target PvE), TR-P (PvP). |

**Read, no usable picks:** gameplay.tips skills guide (https://gameplay.tips/guides/aion-2-skills-guide-active-passive-and-stigma.html,
explains slots and levels only); Pixelnitro (https://pixelnitro.com/aion-2-assassin-build-guide-best-skills-and-specs-for-pvp-pve-2026-global-launch-meta/,
one vague line: "lean toward the multi-hit potential of Heart Gore and Whirlwind Slice", not counted).

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
| 1 | 8 | **3** Up to +20% Critical Hit when less targets hit | 8 | 2+ sources | GF, SC (table), CP (Grobs), TR-D, TR-P, AM-PvP | Existing pick, kept. A crit bonus makes the skill crit more often, and every crit is a cooldown reset once slot 3 holds pick 5. Leveling sources (SC, CP, TR-L) open with Absorb (1) instead. |
| 2 | 12 | **4** Multi-Hit on hit | 12 | 2+ sources | SC, CP, AM-PvE, TR-L, TR-D, TR-P | Multi-Hit is the first damage pick that opens at skill 12 and is named by four of the five guides. |
| 3 | 20 | **5** Resets [Heart Gore] cooldown on landing a Critical Hit | 20 | 2+ sources | GF, SC, CP, AM-PvE, AM-PvP, TR-L, TR-D, TR-P | The crit cooldown reset is the skill's main payoff. It needs skill 16 and slot 3 opens at 20, so the guides that describe an order swap it in over an earlier pick at 16 (section 4.1). |

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
| 1 | 8 | **2** +50% Multi-Hit on hit | 8 | 2+ sources | GF, SC, CP, AM-PvE, TR-L, TR-D | Existing pick, kept. Named by every PvE source (TR-D takes it second, behind pick 3). |
| 2 | 12 | **5** -3s cooldown | 16 | 2+ sources | GF, SC, CP (Grobs), AM-PvE, TR-L, TR-D, TR-P | -3s cooldown, the late damage pick. Needs skill 16; until then the slot can hold pick 3 as a stopgap (AM, TR). |
| 3 | 20 | **3** Keeps 2 Insignia stacks after Insignia Explosion | 20 | 2+ sources | SC, AM-PvE, TR-L, TR-D | Keeping 2 Insignia stacks makes the next cast full sooner. Listed as the third pick by SC ("eventually all three") and AM; CP (Grobs) only uses it before skill 16. |

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
| 1 | 8 | **3** +50% Multi-Hit on hit | 8 | 2+ sources | CP (leveling), AM-PvE, AM-PvP, TR-D | Existing pick, kept: +50% Multi-Hit as the opener. SC, CP and TR-L open with Absorb (2) while leveling. |
| 2 | 12 | **4** -1s Insignia Explosion cooldown on hit | 12 | 2+ sources | GF, SC, CP, AM-PvE, TR-L, TR-D, TR-P | -1s Insignia Explosion cooldown on every hit; Quick Slice is the skill you hit all fight. |
| 3 | 20 | **5** Ignores Block and Evasion and lands as a Critical Hit | 20 | 2+ sources | GF, SC, CP, AM-PvE, AM-PvP, TR-L, TR-D | Guaranteed crit that ignores Block and Evasion, which also lights Heart Gore. Needs skill 16; sources that describe an order swap it in over the slot-1 pick at 16 (section 4.1). |

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
| 1 | 8 | **2** +20% Skill Speed | 8 | 2+ sources | GF, SC, CP, TR-L, TR-D | Existing pick, kept. Skill Speed is the one pick every guide agrees on. |
| 2 | 12 | **4** -1s [Shadowstrike] cooldown on hit | 12 | disputed | GF, TR-L, TR-D (for 4); SC, CP-Grobs name 1 instead | -1s Shadowstrike cooldown on hit keeps you behind the target. GF and TR pick it second; SC and CP pick -20% MP (1) second. Both open at skill 12. |
| 3 | 20 | **1** -20% MP consumed | 20 | disputed | SC, CP-Grobs (for 1); CP-aLuckyRO, TR-D, AM-PvP name 3 instead | -20% MP consumed, or the fewer-targets damage bonus (3) for single bosses. No source picks a clear third; low stakes because slot 3 needs skill 20. |

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
| 1 | 8 | **1** Absorbs 500, 500% HP | 8 | 2+ sources | SC, CP (both creators); TR-D takes 2, GF takes 3 | Not in builds.json yet. Absorb while leveling is the SC and CP pick; GF and TR-D name other first picks, so slot 1 is a leveling stopgap. |
| 2 | 12 | **4** Multi-Hit on hit | 12 | 2+ sources | AM-PvE, TR-D | Multi-Hit on hit at skill 12; the pair AM and TR give before the skill-16 pick. |
| 3 | 20 | **5** -1s all skill cooldowns on hit | 20 | 2+ sources | GF, SC, CP, AM-PvE, TR-D | -1s all cooldowns on hit, stigmas included. Needs skill 16; in AM and TR it replaces the slot-1 pick at 16 (section 4.1). |

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
| 1 | 8 | **2** Range +6m | 8 | 2+ sources | GF, SC, CP, TR-D, TR-P | Not in builds.json yet. +6m range keeps the reposition useful on moving bosses. |
| 2 | 12 | **4** +1 consecutive use | 12 | 2+ sources | GF, SC, CP, TR-D | +1 consecutive use, available at skill 12; named second by all four. |
| 3 | 20 | (none) | | gap | none (TR-L names 3 for pack farming, TR-P names 1 for PvP; one source each, different goals) | No source gives a third pick. |

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
| 1 | 8 | **2** +20% caster Critical Damage Boost for 10s on hit | 8 | 2+ sources | GF, SC, CP, AM-PvP, TR-L, TR-D | Existing pick, kept. TR: "the only pick that matters in PvE". |
| 2 | 12 | (none) | | gap | none for PvE (PvP only: AM-PvP names 3, TR-P names 3 then 4) | No PvE source names a second pick (TR-D: "the only pick that matters in PvE"). Seal (3) is a PvP pick named by AM and TR. |
| 3 | 20 | (none) | | gap | none for PvE (PvP only: AM-PvP names 5) | No PvE source. AM-PvP puts AoE (5) third. |

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
| 1 | 8 | **1** Engraves 2 Insignias for 10s on landing as a Back attack | 8 | single-source | TR-L, TR-D (for 1); SC, CP, AM-PvE open with 2 instead | Existing pick, kept for now. Only TR opens with 1; SC, CP and AM-PvE open with Absorb (2). Flagged for the owner, slot 1 is outside this task. |
| 2 | 12 | **2** Absorbs 300, 300% HP | 12 | 2+ sources | SC, CP (Grobs, aLuckyRO), AM-PvE, TR-L, TR-D | Absorb is the one pick every source gives Ambush: it is a heal button, not a damage skill. TR puts it second behind pick 1. |
| 3 | 20 | **4** 50% chance to trigger [Whirlwind Slice] on hit | 20 | single-source | AM-PvE (L12); AM-PvP names 3 instead | 50% chance to trigger Whirlwind Slice. Only AM names it for PvE. CP (Grobs) calls Ambush and Whirlwind Slice a damage loss, so treat as optional. |

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
| 1 | 8 | **2** +10m [Infiltrate] range | 8 | 2+ sources | SC, CP (both creators), TR-P | +10m range puts it on par with Shadowstrike. Not in the guide skill order (Skycoach "Lv 8 fairly early"). |
| 2 | 12 | (none) | | gap | none for PvE (TR-P names 3, single-source, PvP) | No PvE source. |
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
| 1 | 8 | **1** +50% Multi-Hit on hit | 8 | 2+ sources | AM-PvE, CP-aLuckyRO | Multi-Hit for single bosses. TR-L and CP-aLuckyRO take AoE (2) for pack farming. Not in the guide skill order; CP (Grobs) skips the skill. |
| 2 | 12 | **2** Changes to AoE damage | 12 | 2+ sources | AM-PvE, TR-L, CP-aLuckyRO | AoE damage is the pack-clearing pick; second behind Multi-Hit in AM. |
| 3 | 20 | (none) | | gap | none | No source (TR-P names 3 and 4 for PvP). |

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
| 2 | 12 | (none) | | gap | none for PvE (TR-P names 4: single-source, PvP) | No PvE source. |
| 3 | 20 | (none) | | gap | none for PvE (TR-P names 5: single-source, PvP) | No PvE source. |

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
| 1 | 8 | **3** Restores 20% HP on using [Defiance] | 8 | 2+ sources | SC, CP, TR-L, TR-D, TR-P | Restores 20% HP on use. The pick every source takes; the skill is a safety button. |
| 2 | 12 | **4** +2s Tenacity duration | 12 | single-source | TR-D, TR-P | +2s Tenacity duration. Only TR names a second pick. |
| 3 | 20 | **5** +50% PvE Damage Tolerance and +25% PvP Damage Tolerance for Tenacity duration | 20 | single-source | TR-P | PvE and PvP Damage Tolerance during Tenacity. TR PvP only. |

## 4. Notes for E7

**4.1 Picks order versus activation.** The sources describe picks as a growing set, not as "slot 2 is X": Heart Gore
in aion2-meta is Multi-Hit at 12, Reset at 16, then a third at 20; aion2turkiye says "Lv16 reset replaces the crit pick
if you only have 2 slots". So the useful runtime rule is: the player's active set at effective skill level L is the
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
  "skill:assassin:insignia-explosion":  ["spec:assassin:insignia-explosion:2", "spec:assassin:insignia-explosion:5", "spec:assassin:insignia-explosion:3"],
  "skill:assassin:quick-slice":         ["spec:assassin:quick-slice:3", "spec:assassin:quick-slice:4", "spec:assassin:quick-slice:5"],
  "skill:assassin:savage-roar":         ["spec:assassin:savage-roar:2", "spec:assassin:savage-roar:4", "spec:assassin:savage-roar:1"],
  "skill:assassin:ambush":              ["spec:assassin:ambush:1", "spec:assassin:ambush:2", "spec:assassin:ambush:4"],
  "skill:assassin:shadowstrike":        ["spec:assassin:shadowstrike:2"],
  "skill:assassin:storm-rampage":       ["spec:assassin:storm-rampage:1", "spec:assassin:storm-rampage:4", "spec:assassin:storm-rampage:5"],
  "skill:assassin:flash-slice":         ["spec:assassin:flash-slice:2", "spec:assassin:flash-slice:4"]
}
```

`storm-rampage` and `flash-slice` are new keys (both are in `skillOrder`). Infiltrate, Whirlwind Slice, Shadow Fall
and Defiance are not in `skillOrder`, so they would only be added if the owner wants them tracked; their researched picks
are in section 3 (Infiltrate `[2]`, Whirlwind Slice `[1, 2]`, Shadow Fall `[1]` single-source, Defiance `[3, 4, 5]`
with 4 and 5 single-source).

`tools/gen/gen.mjs` line 178 checks at most 3 picks and line 177 that each id is a choice of its skill; line 169 and 460
read only `[0]` of core skills, so the extra entries do not change the compiled tables today. E7's UI change is the
consumer of slots 2 and 3.

**5.2 Evidence and labels.** The builds schema has no place for per-pick status. Two options, both owner decisions:

1. One claim per skill and slot in `data/shared/asmodian/guide/claims.json` (next free ids after `C28c`), each with the
   shape already used there: `claim` ("Heart Gore slot 2: Multi-Hit on hit"), `verdict`, `sources` (the URLs in section 2,
   with short `quote`s only where needed; never copied wording), `verifiedAt: "2026-10-16"`, and a `note` naming the
   status (`2+ sources`, `single-source`, `disputed`). `npm run gen` then adds the URLs to the Sources card and
   `data/DATA_SOURCES.md`.
2. Add an optional `specialtyPickStatus` object to `builds.schema.json` and the guide build, keyed by choice id:
   `{ "spec:assassin:savage-roar:4": { "status": "disputed", "sources": [{ "url": "…" }], "note": "…" } }`.

New URLs for the Sources card (all read 2026-10-16): the five in section 2 (GF, SC, CP, AM, TR). GF and SC are
already cited elsewhere; CP, AM and TR are new.

**5.3 Labels in the UI.** `single-source` and `disputed` picks should carry the label (CLAUDE.md data policy). In this
set: single-source: Ambush slots 1 and 3, Defiance slots 2 and 3, Shadow Fall slot 1;
disputed: Savage Roar slots 2 and 3.

**5.4 Tests.** Extend the build checks in `tests/` for "every pick is a choice of its skill, picks are distinct and at
most 3", and run `mig1`, `mig2` and `journey` after the change (CLAUDE.md "Never break saved progress"). Save keys
`sp:<key>:spec2` and `sp:<key>:spec3` are already reserved; this research changes none.

## 6. Gaps and open questions

- **No PvE pick for slots 2 and 3:** Shadowstrike (no source names a second PvE pick; PvP sources name 3 then 4 or 5),
  Infiltrate, Shadow Fall. Defiance slots 2 and 3 are single-source (aion2turkiye).
- **Disputed:** Savage Roar slot 2 (4 vs 1) and slot 3 (1 vs 3). Both options are available at skill 12, so this is
  a taste call; an owner decision or an in-game test settles it.
- **Single-source:** Ambush slot 3 (pick 4, aion2-meta), Ambush slot 1 (pick 1, aion2turkiye only).
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
| after 02:23:32 | 200 | https://pixelnitro.com/aion-2-assassin-build-guide-best-skills-and-specs-for-pvp-pve-2026-global-launch-meta/ |
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
