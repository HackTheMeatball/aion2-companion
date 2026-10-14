# Classes and data gaps (2026-10)

Data & Research, 14 Oct 2026. **Research only: no app code or data file was changed.** Inputs for D8 (next class),
the 0.7–0.13 research packs, and the data patches that can close ISSUES.md gaps.

Method: `curl` against metabot.gg and aion2.th.gl (the only two source hosts this environment can reach, see §5), parsed
from page HTML; WebSearch to find guide URLs on blocked sites. Every Metabot field below was checked against our
Assassin data first (all 22 skill learn levels matched `data/build.json` exactly) before being trusted for the other
classes. "DB field" means a field both sites say is read from the global client (Metabot: build 0.0.4387.0).

## 1. Summary

- **Game-database coverage is the same for all seven classes, and it is complete.** Skills by level, stigma lists and
  Daevanion boards come from two independent databases (Metabot, th.gl) that agree on every one of 280 skills and
  every skill node on all 40 boards. Nothing class-specific in the DB layer blocks any class.
- **All 8 classes share one skeleton.** 12 actives learned at 1, 1, 1, 3, 4, 5, 7, 8, 10, 12, 14, 16; 10 passives at
  1, 6, 9, 11, 13, 15, 17, 21, 23, 25; 13 stigmas at 22; specialization choices at skill Lv 8/8/8/12/16 (actives; slots at effective
  Lv 8/12/20, §2.2 note) and 5/10/15/20 (stigmas); 4 Daevanion skill nodes per non-stigma skill; the same five boards (12/20/30/40/45, 134/134/134/168/232
  points). The Assassin milestone *structure* (skill unlocks, stigma slots, board openings) carries over unchanged;
  only names and advice differ.
- **The difference between classes is advice, not data**: which skills to raise, which four stigmas, which nodes,
  stats, rotation. For Assassin that came from Metabot + GamesFuze + Skycoach + games.gg. For the other classes the
  guide sites are blocked here (§5), so advice coverage is "Metabot read + candidate URLs found, not read".
- **There are no class quests** in the global client. Class-specific quest content is limited to class-variant
  rewards in 4 Episode quests (§2.4).
- **Several ISSUES.md gaps can now be closed cheaply from DB fields** (§4): prerequisites for 8 of the 10 `noPre`
  quests (th.gl, confirmed from both ends), all 32 missing quest-giver Kibelisks plus the Blood Barrier turn-in
  (Metabot), Vaizel/Triniel corner stats and Daevanion path costs (th.gl node grid; the path model reproduces the
  owner's Nezekan numbers exactly), and Daevanion Crystals per level (Metabot client level table).
- **Recommendation (§6): Gladiator**, unless the owner names a class they or a tester will actually level to 45; that
  answer decides it, because data coverage doesn't separate the classes.

## 2. Class coverage

### 2.1 Coverage levels

| Level | Meaning |
|---|---|
| **A** | Two independent game databases agree field by field (or one DB field confirmed from both ends). Usable as data. |
| **B** | One game database field, not contradicted. Usable as data under CLAUDE.md (game-DB fields count). |
| **C** | Advice from one source that was read (Metabot editorial or pick rates). Needs a second source, else label *single source*. |
| **D** | Candidate sources found by search but not read (site blocked here). Not usable until read. |
| **—** | Nothing found. |

### 2.2 Ratings per class and area

Same rating in every row unless noted; the per-class differences are in the last three columns.

| Area | Gladiator | Templar | Ranger | Sorcerer | Spiritmaster | Cleric | Chanter |
|---|---|---|---|---|---|---|---|
| Skills by level (names, type, learn Lv, max Lv) | A | A | A | A | A | A | A |
| Specialization unlock levels (choices; slots see note) | B | B | B | B | B | B | B |
| Specialization option texts | B | B | B | B | B | B | B |
| Stigma list, learn Lv 22, max Lv | A | A | A | A | A | A | A |
| Stigma slots 22/27/32/37, shard costs | A (class-agnostic, already verified for Assassin) | A | A | A | A | A | A |
| Stigma picks (which 4) | C + D | C + D | C + D | C + D | C + D | C + D | C + D |
| Daevanion boards, nodes, costs, corners | A | A | A* | A* | A | A | A* |
| Daevanion path costs | B (computed, §4.4) | B | B | B | B | B | B |
| Daevanion node priority (advice) | C | C | C | C | C | C | C |
| Skill-point order (advice) | D | D | D | D | D | D | D |
| Stat priority (advice) | C | C | C | C | C | C | C |
| Class quests | n/a (none exist) | n/a | n/a | n/a | n/a | n/a | n/a |
| Class-variant quest rewards (4 quests) | B | B | B | B | B | B | B |
| Metabot tracked Lv 45 sample shown | 50 chars | 50 chars | 50 chars | not shown | 50 chars | not shown | not shown |
| Candidate guide URLs (unread; MMOexp / AOEAH excluded) | 8 | 5 | 8 | 6 | 5 | 7 | 7 |
| Metabot community builds | 0 | 1 | 2 | 3 | 2 | 3 | 0 |

Specialties (owner correction, recorded 2026-10-14; owner screen is the source of truth): every skill has **3
specialty slots**, unlocking at **effective** skill Lv 8, 12 and 20, where effective level = skill level from points
plus Daevanion board skill nodes (owner screen). The **5 specialty choices** unlock at effective Lv 8 (3 choices),
12 (4th) and 16 (5th); this matches Metabot's "Specialization 1–5 · requires skill level 8/8/8/12/16" and the owner
recalls seeing only 3 at first. So the B rating covers the choice levels; the slot levels and "board nodes count"
are owner-confirmed for Assassin and assumed class-agnostic (same skeleton, §1). This settles the open question in
the Daevanion tip (`tips.js`: "whether they count toward the skill level 8 specialty unlock").

\* Same nodes and costs, but th.gl's board labels use a different name for some skills than both sites' skill pages:
Ranger *Melee Shot* (skill page: Melee Fire); Sorcerer *Earth Robe* / *Flame Robe* / *Flame Explosion* (Robe of Earth /
Robe of Flame / Blaze); Chanter *Charging Smash* (Rushing Smash). Positions and costs match, so these are the same
nodes; the in-game label needs one look at the board (owner or tester).

Max level: every non-stigma skill is max 40 for all classes. Stigmas are max **40 for Assassin and Ranger, 25 for the
other six**; both databases agree, so this is client data, not a scrape error. It doesn't touch the Lv 1–45 plan
(stigma Lv 20 is the practical cap; past 20 needs Superior Stigma Shards, `build.json` stigmaCost), but no code should
hard-code 40.

### 2.3 Sources per area (URL patterns)

| Area | Source A | Source B |
|---|---|---|
| Class overview, stigma pick rates, editorial stat priority, Daevanion path text | `https://metabot.gg/en/aion-2/classes/<class>` | — |
| Skill learn Lv, type, max Lv, specializations, Daevanion nodes per skill | `https://metabot.gg/en/aion-2/skills/<skill-slug>` (35 per class) | `https://aion2.th.gl/db/skills/s_<id>` (Learn Level, Category, Max Level; list at `https://aion2.th.gl/db/skills`, 280 entries) |
| Daevanion boards | `https://metabot.gg/en/aion-2/daevanion/<class>` | `https://aion2.th.gl/db/daevanion/dv_<c><b>` (c = 1 Gladiator, 2 Templar, 3 Ranger, 4 Assassin, 5 Spiritmaster, 6 Sorcerer, 7 Cleric, 8 Chanter; b = 1 Nezekan, 2 Zikel, 3 Vaizel, 4 Triniel, 6 Azphel): Required Level, Nodes, Total Cost, and every node's grid position, grade, effect and cost |
| Community builds | `https://metabot.gg/en/aion-2/builds/<class>` (0–3 builds per class; not useful yet) | — |
| Class-variant rewards | Metabot quest pages, "Reward" table per class | — |
| Level table (skill points, stigma points, crystals, slots) | `https://metabot.gg/en/aion-2/leveling` | Wikily (blocked here; already cited for 30–44) |

Candidate advice sources found by WebSearch (pages **not read**: hosts blocked, §5). Listed so the research pack for
the chosen class knows where to start; KeenGamer's all-classes page covers every class:
[KeenGamer: best PvE builds for every class](https://www.keengamer.com/articles/guides/aion-2-best-pve-builds-for-every-class/).

- **Gladiator**: [GamesFuze](https://gamesfuze.com/guides/aion-2-gladiator-build-best-skills-stigmas-stats-and-macro/),
  [ExitLag](https://www.exitlag.com/news/aion-2-gladiator-build/),
  [Destructoid](https://www.destructoid.com/best-gladiator-build-in-aion-2/),
  [PowerUp Gaming (Daevanion)](https://powerupgaming.co.uk/2026/10/01/aion-2-best-gladiator-daevanion-builds-pve-pvp/),
  [allthings.how ?p=266078](https://allthings.how/?p=266078),
  [OSLink](https://www.oslink.io/blog/news/aion-2-gladiator-build-guide.html), KeenGamer, Metabot.
- **Templar**: [GamesFuze](https://gamesfuze.com/guides/aion-2-templar-build-best-tank-skills-stigmas-and-gear/),
  [ExitLag](https://www.exitlag.com/news/aion-2-templar-build/), KeenGamer, Metabot,
  [guildorder (general stigmas)](https://guildorder.com/games/aion2/guides/stigmas-and-arcana).
- **Ranger**: [GamesFuze](https://gamesfuze.com/guides/aion-2-ranger-build-best-skills-stigmas-gear-pvp-pve-solo/),
  [games.gg](https://games.gg/aion-2/guides/aion-2-ranger-build-guide/),
  [ExitLag](https://www.exitlag.com/news/aion-2-ranger-build/),
  [Mobalytics](https://mobalytics.gg/gamebase/guides/aion-2-ranger-pve-build),
  [allthings.how ?p=233584](https://allthings.how/?p=233584),
  [OSLink](https://www.oslink.io/blog/guide/aion-2-ranger-build-guide.html), KeenGamer, Metabot.
- **Sorcerer**: [GamesFuze](https://gamesfuze.com/guides/aion-2-sorcerer-build-best-skills-stigmas-and-gear-for-pve-and-pvp/),
  [Mobalytics](https://mobalytics.gg/gamebase/guides/aion-2-sorcerer-hellfire-pve-build),
  [ExitLag](https://www.exitlag.com/news/aion-2-sorcerer-build/),
  ~~MMOexp~~ (do not use, gold seller),
  [vortexgaming](https://vortexgaming.io/en/postdetail/724101), KeenGamer, Metabot.
- **Spiritmaster**: [GamesFuze](https://gamesfuze.com/guides/aion-2-spiritmaster-build-best-skills-stigmas-and-pet-setup/),
  [allthings.how ?p=232924](https://allthings.how/?p=232924),
  ~~AOEAH~~, ~~MMOexp~~ (do not use, gold sellers),
  [vortexgaming](https://vortexgaming.io/en/postdetail/726048), KeenGamer, Metabot.
- **Cleric**: [GamesFuze](https://gamesfuze.com/guides/aion-2-cleric-build-best-healer-skills-stigmas-and-gear-dungeons-pvp/),
  [games.gg](https://games.gg/aion-2/guides/aion-2-cleric-guide/),
  [Mobalytics](https://mobalytics.gg/gamebase/guides/aion-2-cleric-condemnation-pve-build),
  [ExitLag (Daevanion)](https://www.exitlag.com/blog/aion-2-cleric-daevanion-build/),
  [OSLink](https://www.oslink.io/blog/guide/aion-2-cleric-build-guide.html),
  [pixelnitro](https://pixelnitro.com/?p=20616), Metabot.
- **Chanter**: [ExitLag](https://www.exitlag.com/news/aion-2-chanter-build/),
  [pixelnitro](https://pixelnitro.com/aion-2-chanter-pve-build-guide-2026-best-skills-stigmas-and-macros-for-end-game-raids/),
  [roonby](https://roonby.com/2026/10/07/aion-2-chanter-pve-guide-best-build-skills-macro-and-rotation/amp/),
  [GamerBlurb](https://gamerblurb.com/guides/aion-2-chanter-build-guide-pve-pvp-leveling-global),
  [vortexgaming](https://vortexgaming.io/en/postdetail/728603), KeenGamer, Metabot.
- **Skycoach** (an Assassin source) lists only an Assassin class guide on its
  [class-guides index](https://skycoach.gg/blog/aion-2/class-guides) per search; no other class found.

Quality note: search summaries of these pages disagree on skill names for some classes (e.g. Cleric "Quake",
"Divine Punishment" do not exist in either database), so any guide must be checked against the DB names in §2.5 before
it counts as a source. ExitLag was rated "low quality" in our earlier notes (C27). **Do not use MMOexp (mmoexp.com) or AOEAH (aoeah.com):
both sell in-game gold/items (RMT), so they are excluded as sources and not linked.** Mobalytics, vortexgaming,
pixelnitro, roonby and GamerBlurb have not been assessed.

### 2.4 Class quests

- th.gl lists 1,206 quests. Their ID ranges split into Episode (21xxxxx Asmodian), Regional (22xxxxx), Wanted/hunt
  (23xxxxx), Ascension (26xxxxx), Ascension Gauge (27xxxxx), dungeon/exploration and Sealed Dungeons (280–281xxxxx),
  Strongholds (282xxxxx) and crafting upgrades (29xxxxx). **No class category exists**; the same split holds for Elyos
  (1xxxxxx). Inferred from the ID taxonomy, not from opening all 1,206 pages.
- Of the 123 Metabot quest pages our data cites (story + regional), **4 have a per-class reward table**, and none is
  restricted to a class:

  | Quest | Reward (Gladiator / Templar / Assassin / Ranger / Sorcerer / Spiritmaster / Cleric / Chanter) |
  |---|---|
  | [Contaminated Sacred Tree](https://metabot.gg/en/aion-2/quests/contaminated-sacred-tree) | Chaser Greatsword / Longsword / Dagger / Bow / Spellbook / Orb / Mace / Staff |
  | [Enemy Territory](https://metabot.gg/en/aion-2/quests/enemy-territory) | Avenger … (same weapon types) |
  | [The Breaking of the Day](https://metabot.gg/en/aion-2/quests/the-breaking-of-the-day) | Liberator … |
  | [Farewells](https://metabot.gg/en/aion-2/quests/farewells) | Spiritforged … |

  Data patch candidate: `story-40-45.json` Farewells says "class-specific Spiritforged weapon (Assassin variant not
  named on page)"; Metabot now names it: **Spiritforged Dagger** (DB field, B).

### 2.5 Skills by learn level (all classes; A)

Names from th.gl (they match Metabot's skill pages). Assassin is in `data/build.json` (`fullSkillList`).

| Learn Lv | Gladiator | Templar | Ranger | Sorcerer | Spiritmaster | Cleric | Chanter |
|---|---|---|---|---|---|---|---|
| A 1 | Keen Strike | Poach | Snare Shot | Firestorm | Cold Shock | Debilitating Mark | Incandescent Blow |
| A 1 | Leaping Slam | Pummel | Snipe | Flame Arrow | Combustion | Earth's Retribution | Onslaught |
| A 1 | Rending Blow | Vicious Strike | Tempest Shot | Ice Chain | Summon: Fire Spirit | Judgment Thunder | Rushing Smash |
| A 3 | Mocking Blade | Shield Smite | Marking Shot | Bittercold Wind | Summon: Water Spirit | Divine Aura | Impactful Crush |
| A 4 | Overhead Slam | Judgment | Drill Dart | Blaze | Jointstrike: Curse | Chain of Torment | Dark Crush |
| A 5 | Sword Aura Rampage | Flash Rampage | Arrow Scattershot | Flame Scattershot | Rapid Scattershot | Lightning Strike Scattershot | Gust Rampage |
| A 7 | Ankle Slice | Debilitating Smash | Gale Arrow | Frost | Summon: Earth Spirit | Light of Regeneration | Heat Wave Blow |
| A 8 | Crushing Wave | Warding Strike | Explosion Trap | Winter's Shackles | Dimensional Control | Condemnation | Recuperation |
| A 10 | Rush Strike | Shield Rush | Burst Arrow | Frost Burst | Summon: Wind Spirit | Healing Light | Tremor Crush |
| A 12 | Aerial Snare | Annihilate | Suppressing Arrow | Wish of Concentration | Soul's Cry | Radiant Recovery | Wave Blow |
| A 14 | Ruinous Blow | Punishment | Deadshot | Hellfire | Elemental Fusion | Bolt | Spinning Strike |
| A 16 | Defiance | Defiance | Defiance | Defiance | Defiance | Defiance | Defiance |
| P 1 | Survival Stance | Enhance Health | Vigilant Eye | Fire Mark | Spirit Strike | Warm Benediction | Blessing of Life |
| P 6 | Protection Armor | Warding Shield | Concentrated Fire | Robe of Earth | Spirit Protection | Empyrean Lords' Benediction | Crossguard |
| P 9 | Blood Absorption | Punishing Benediction | Wind Vigor | Cold Snap | Spirit's Descent | Empyrean Lord's Grace | Protection Circle |
| P 11 | Identify Weakness | Ironclad Defense | Focused Eye | Robe of Flame | Corrode | Healing Enhancement | Inspiring Spell |
| P 13 | Attack Preparation | Guarding Seal | Hunter's Resolve | Absorb Essence | Spirit Revitalization | Immortal Veil | Attack Preparation |
| P 15 | Impact Hit | Impact Hit | Unyielding Resolve | Grace of Resistance | Mental Focus | Heal Block | Impact Hit |
| P 17 | Destructive Impulse | Insulting Roar | Rooting Eye | Robe of Cold | Consecutive Countercurrent | Prayer of Concentration | Raging Spell |
| P 21 | Experienced Counterstrike | Fury | Melee Fire | Grace of Enhancement | Spirit Communion | Earth's Grace | Earth's Promise |
| P 23 | Survival Willpower | Survival Willpower | Revitalization Contract | Revitalization Contract | Revitalization Contract | Survival Willpower | Survival Willpower |
| P 25 | Murderous Burst | Block Pain | Hunter's Soul | Vitality Evaporation | Element Unification | Radiant Benediction | Wind's Promise |

Shared skill names are separate per-class skills (own pages, own effects): Metabot slugs `defiance-templar`,
`impact-hit-chanter` etc. Never key data by display name alone.

### 2.6 Stigmas (list A; picks C)

Pick rates are Metabot's "of top players run this" (Metabot flags its samples "Low sample"). These are popularity at
Lv 45, not an equip order by level, and need a second read source before the app recommends them.

| Class | 13 stigmas (all learnable at Lv 22) | Metabot top 4 by slot (pick rate) |
|---|---|---|
| Gladiator | Armor of Balance, Assault Strike, Blade Toss, Focused Block, Forced Restraint, Fracturing Rush, Lifestealing Blade, Lunge Stance, Rage Burst, Tenaciousness, Wave Armor, Wrath Wave, Zikel's Blessing | Lunge Stance (91%) · Zikel's Blessing (91%) · Rage Burst (73%) · Focused Block (62%) |
| Templar | Armor of Balance, Assault Fury, Battlefield Banner, Comrade in Arms, Doom Shield, Empyrean Lord's Punishment, Executing Blade, Grapple, Nezekan's Shield, Noble Armor, Second Skin, Shield of Protection, Taunt | Taunt (76%) · Empyrean Lord's Punishment (67%) · Battlefield Banner (65%) · Doom Shield (61%) |
| Ranger | Ambush Kick, Arrow Storm, Assault Smite, Bow of Blessing, Ensnaring Trap, Explosive Arrow, Griffon Arrow, Illusory Arrow, Mother Nature's Breath, Sealing Arrow, Stealth, Supporting Fire, Vaizel's Authority | Vaizel's Authority (93%) · Bow of Blessing (87%) · Supporting Fire (75%) · Griffon Arrow (60%) |
| Sorcerer | Arctic Armor, Assault Bombardment, Cold Storm, Curse: Tree, Delayed Explosion, Divine Burst, Element Enhancement, Fire Wall, Glacial Smite, Hibernation, Lumiel's Space, Soul Freeze, Steel Barrier | Element Enhancement (93%) · Delayed Explosion (83%) · Fire Wall (76%) · Cold Storm (43%) |
| Spiritmaster | Assault Terror, Command: Proxy, Cry of Terror, Cursed Cloud, Enhance: Spirit's Benediction, Flame Blessing, Jointstrike: Corrode, Jointstrike: Destructive Attack, Kaisinel's Power, Magic Block, Seize Magic, Siphon, Summon: Ancient Spirit | Summon: Ancient Spirit (96%) · Enhance: Spirit's Benediction (95%) · Jointstrike: Corrode (83%) · Flame Blessing (74%) |
| Cleric | Absolution, Assault Mark, Benevolence, Earth Punishment, Light of Protection, Noble Aura, Power Burst, Prayer of Amplification, Root, Salvation, Summon Resurrection, Voice of Doom, Yustiel's Power | Light of Protection (87%) · Noble Aura (79%) · Earth Punishment (65%) · Summon Resurrection (64%) |
| Chanter | Assault Shock, Barrier Spell, Ensnaring Mark, Focused Defense, Fracturing Blow, Guardian Blessing, Healing Touch, Impeding Authority, Marchutan's Wrath, Obliterate, Power of the Storm, Sprint Mantra, Undefeated Mantra | Undefeated Mantra (99%) · Sprint Mantra (95%) · Power of the Storm (65%) · Marchutan's Wrath (47%) |

Metabot's editorial stat priority (C): Gladiator Attack › Critical Hit › Accuracy › HP › Block; Templar Block › Defense
› HP › Critical Hit Resist › Attack; Ranger Attack › Critical Hit › Accuracy › Evasion › HP; Sorcerer Attack › Critical
Hit › MP › Accuracy › HP; Spiritmaster Attack › Critical Hit › Accuracy › HP › MP; Cleric HP › Defense › MP › Critical
Hit Resist › Attack; Chanter HP › Attack › Defense › Critical Hit › Accuracy.

## 3. What a class pack still needs (same for every class)

From DB (cheap): skill table, specializations,
stigma list, board node tables, computed path costs (§4.4), class-variant rewards. All scriptable.
From advice sources (the real cost): skill-point order, four stigmas with equip timing and upgrade priority, first
Daevanion nodes per board, stat tiers, rotation / E row. Each needs two read sources or a label. The guide sites are
blocked here (§5), so either the environment allows them or a session with WebFetch reads them.
In game (owner or tester): the 5 board labels above (Ranger, Sorcerer, Chanter only), one stigma tooltip, the rotation
on a dummy, and the usual per-release spot check.

## 4. Data gaps from ISSUES.md

| # | Gap | Status now | Sources | Cheapest way to close |
|---|---|---|---|---|
| 1 | 10 regional quests without prerequisites (`noPre`) | **8 closable**: th.gl "Prerequisites" field, each confirmed from the other end by the story quest's "Unlocks" field (A). 2 (Spacetime Rift: Unknown Species / Proof) have no prerequisite in the DB: Unlock Level 45, spawned by the rift; current `noPre` at 45 is right. Metabot still has no prerequisite field (only "Unlocks at 10"). | see table §4.1 | Data patch: set `requiresStory` + `requiresSrc` (th.gl both URLs) for the 8. No in-game check needed. |
| 2 | Kibelisks missing: 32 regional givers, Fafnite Storage Room, Blood Barrier turn-in | **33 of 34 closable** (B): Metabot quest pages now print "Nearest Kibelisk: X · N m" for every giver; Blood Barrier giver *and* turn-in are Nemon, Collapsed Hall of Fame (32 m). **Fafnite Storage Room still open**: Metabot gives only the entrance zone (Sanctum Outpost). | `https://metabot.gg/en/aion-2/quests/<slug>`; full list in §4.2 | Data patch from Metabot (same field the existing `kib` values use). Flag the far ones (Pain Unending 309 m, Immortal Isle's Distinct Ecology 197 m, Hugo Mercenaries: Past and Present 185 m, Farewell, My Instructor 168 m): "nearest" can be the wrong side of a cliff. Fafnite: owner screen of the map at the entrance. |
| 3 | Story gate semantics (accepted vs reached) | **Answered in PR #19** (`docs/research/2026-10-prereq-gates.md` §3): a database prerequisite means **turned in**. Four checks on 2 sites agree, but all four are Ascension gates; for regional quests it is inferred, about 70% confidence. If it holds, the app opens the 51 story-gated regional quests one story quest early. Not built until owner check 1 (PR #19 §11) confirms it. This report adds nothing new: Fight Poison with Poison ← A Collective Effort re-checked on th.gl (agrees with our data). | [PR #19](https://github.com/HackTheMeatball/daeva-companion/pull/19), [th.gl q_2202062](https://aion2.th.gl/db/quests/q_2202062) | Owner check 1 in PR #19: with A Collective Effort open, is Fight Poison with Poison offered at Viron? Then turn it in and look again (expected: not offered → offered). |
| 4 | Kibelisk and Command mission unlock levels | Open. Metabot content-unlocks lists 9 level thresholds, 6 Conquest tiers and 18 quest unlocks; neither mission type is there. One search hit (allthings.how ?p=260416, blocked) ties "Duty" missions to Lv 45 + the Abyss (already C15). | [Metabot content unlocks](https://metabot.gg/en/aion-2/content-unlocks) | In game: note the level when the menu entry appears. |
| 5 | Dungeon XP | Open; no source. Metabot dungeon pages list clear rewards (Asmodian Library of Wisdom still 15,000 Kina, 1,250 Enhance Stones, 2 crystals, 2 Wisdom Stones: matches our data) but no EXP; loot and XP are server-side. | [Metabot Library of Wisdom](https://metabot.gg/en/aion-2/dungeons/library-of-wisdom) | Not worth closing (removed from the UI). Owner can note EXP gained on one clear if ever needed. |
| 6a | Inferred: Vaizel / Triniel corner stats | **Closable (A)**: th.gl board tables give each Unique node's effect: Vaizel 2× Critical Damage Boost +150 and 2× Critical Damage Tolerance +150; Triniel 3× Multi-hit Chance +150 and 3× Multi-hit Resist +150. Matches `build.json cornerTotalsByBoard` (3% / 4.5%, reading +150 as 1.5%, the same scale Metabot uses). | [th.gl dv_43](https://aion2.th.gl/db/daevanion/dv_43), [dv_44](https://aion2.th.gl/db/daevanion/dv_44) | Claims patch: drop the "inferred" label. |
| 6b | Inferred: Daevanion path costs | **Closable (B, model-validated)**: th.gl gives every node's grid position. Shortest paths over the 4-neighbour grid from the board centre reproduce the owner-confirmed Nezekan numbers exactly (§4.4). | th.gl dv_41 … dv_44 | Script the path costs per board from th.gl (no in-game check); spot-check one Zikel path in game. |
| 6c | Inferred: core skill-point order, right-click row order and E stack | Open (advice). No new source; guide sites blocked. | — | Read GamesFuze/Skycoach/games.gg Assassin pages from an environment that allows them; otherwise keep the label. |
| 6d | Inferred: stronghold level bands | Open. Neither th.gl (strongholds are "Exploration" quests with no level fields) nor Metabot quest pages give a level. | th.gl q_2820001 … q_2820015 | In game: note the monster level at each stronghold when passing (one tap per stronghold). |
| 7a | Disputed: respec cost after 31 | Open; no new source (allthings.how, MeinMMO, thegameswiki blocked). | — | In game: open the skill reset dialog on a Lv 31+ character (already on the owner's list). |
| 7b | Disputed: expedition weekly cap | **New DB evidence**: Metabot's weekly-reset page, read from the client's ticket table, lists "[Exploration] <dungeon> Reward Count: 7, Weekly · Wednesday" per dungeon. Supports KeenGamer (7 per dungeon) against games.gg / thegameswiki ("removed", the latter KR/TW). Metabot itself says "not yet confirmed in game". | [Metabot weekly reset](https://metabot.gg/en/aion-2/weekly-reset) | Re-label C11 as client field + KeenGamer (2 sources) if the owner sees a reward counter on one Exploration entry. |
| 7c | Disputed: stigma slot 3/4 order | Unchanged. Metabot's Assassin pick rates by slot: Illusive Clone 95%, Swift Contract 90%, Savage Fang 77%, Triniel's Dagger 71% (popularity, not timing). | [Metabot Assassin](https://metabot.gg/en/aion-2/classes/assassin) | Keep both sides shown. |
| 7d | Disputed: first Daevanion nodes | Unchanged, one more voice: Metabot now says Nezekan's Assault Stance and Exploit Weakness node pairs first, then Zikel's Defense Break (the app starts with Heart Gore and Ambush). | same page | Keep disputed; path costs (6b) at least make each option's price exact. |
| 7e | Disputed: cash-shop scope | Unchanged; not researched (out of scope). | — | — |
| 8 | Zone assumption Safe Haven → Dredgion Crash Site (Odyle Jelly Misappropriation Investigation) | Open. Neither DB has a zone field. Metabot step Kibelisks: Safe Haven (giver, 32 m), Galorik's Inspection Area, Mire Campsite; turn-in Galorik. | [Metabot](https://metabot.gg/en/aion-2/quests/odyle-jelly-misappropriation-investigation), [th.gl q_2202014](https://aion2.th.gl/db/quests/q_2202014) | Leave; it only affects grouping. |
| 9 | "Daeva Trapped in a Nightmare" not in story data | Data ready (A): th.gl q_2102810: Episode 6, Rec/Unlock 45, Previous "Forgotten Commander", Next "Waiting for the Next Journey", objective "Complete The One Who Witnesses the Nightmare", giver Koro (Abyss Base) and turn-in Nemon (Outskirts Stall). Koro as giver comes only from th.gl's description text ("Objective: Talk to Koro at the Abyss Base"), not from a giver field; Nemon is the last step ("Talk to Nemon at the Outskirts Stall"). Metabot's Farewells page lists it as a related Lv 45 quest. Blocked only by the planned 0.3 change. | [th.gl q_2102810](https://aion2.th.gl/db/quests/q_2102810) | Add in the 0.3 requirement audit as planned. |
| 10 | C27 board re-check prompt / Daevanion points per level (C28f single source) | **Closable (B)**: Metabot's leveling page is the client level table: Daevanion Crystals 4 per level from 12 (136 at 45); skill points match `LEVEL_POINTS` at every level 4–45 (so `levelPoints` 30–44 is no longer single source); stigma points 1 per level 23–39, 2 per level 40–45 (29 at 45), matching `stigmaCost.shardIncome`. | [Metabot leveling](https://metabot.gg/en/aion-2/leveling) | Claims patch for C28f and `levelPoints`. The board-card formula check can then cite a DB field. |

### 4.1 Prerequisites found (th.gl, both ends)

| Quest (rq.json) | Prerequisite | Confirmed by the prerequisite's "Unlocks" |
|---|---|---|
| [The Great Curse-Breaking Caper](https://aion2.th.gl/db/quests/q_2202015) (rec 16) | Empyrean Monolith | [q_2102105](https://aion2.th.gl/db/quests/q_2102105) yes |
| [Her Last Favor](https://aion2.th.gl/db/quests/q_2202018) (30) | Canyon's Secret | [q_2102280](https://aion2.th.gl/db/quests/q_2102280) yes |
| [Pain Unending](https://aion2.th.gl/db/quests/q_2202040) (32) | Last of the Destruction Archons | [q_2102340](https://aion2.th.gl/db/quests/q_2102340) yes |
| [Traveling Merchant's Conundrum](https://aion2.th.gl/db/quests/q_2202029) (33) | Blood Monument | [q_2102370](https://aion2.th.gl/db/quests/q_2102370) yes |
| [Herb Pouch Heist](https://aion2.th.gl/db/quests/q_2202066) (44) | Daybreak Society Rescue Operation | [q_2102660](https://aion2.th.gl/db/quests/q_2102660) yes |
| [Lest We Forget](https://aion2.th.gl/db/quests/q_2202046) (45) | Zikel's Core | [q_2102780](https://aion2.th.gl/db/quests/q_2102780) yes |
| [Shugo-of-All-Trades](https://aion2.th.gl/db/quests/q_2202044) (12) | Contaminated Area | [q_2102040](https://aion2.th.gl/db/quests/q_2102040) yes |
| [Spooky Specters](https://aion2.th.gl/db/quests/q_2202051) (14) | Cemetery Cleanup | [q_2102070](https://aion2.th.gl/db/quests/q_2102070) yes |
| [Spacetime Rift: Unknown Species](https://aion2.th.gl/db/quests/q_2202030) (45) | none (Unlock Level 45, rift) | — |
| [Spacetime Rift: Proof](https://aion2.th.gl/db/quests/q_2202035) (45) | none (Unlock Level 45, rift) | — |

All eight prerequisites are story quests already in `story.json`. Effect on Next up: these quests stop appearing before
their story quest is done (e.g. Lest We Forget waits for Zikel's Core). Save keys are unaffected.

### 4.2 Kibelisks found (Metabot "Nearest Kibelisk", giver)

Hugo Mercenaries: Past and Present: Safe Haven 185 m · Missing Mount: Safe Haven 74 m · Creion Research Assistant:
Creion Campsite 11 m · Odyle Jelly Misappropriation Investigation: Safe Haven 32 m · The Great Curse-Breaking Caper:
Gravekeeper Camp 12 m · Practice Makes Perfect, Nyerk!: Quai Campsite 78 m · Blade of Vengeance: Forest Hideout 5 m ·
Young Elim's Story: Elim's Rest 19 m · Nine Wonders of Altgard: 1st Leg: Beneath the Tranein Highland Bridge 22 m · Her
Last Favor: Healing Spring 35 m · The Future Within the Past: Abandoned Site 32 m · Pain Unending: Basfelt Waterfall
309 m · Nine Wonders of Altgard: 2nd Leg: Battlescar Mound Clifftop 54 m · Traveling Merchant's Conundrum: Graverobber
Campsite 34 m · Lest We Forget: Outskirts Stall 37 m · A Perfect Wedding: Steel Hammer Temporary Trading Post 35 m ·
Lost Memories: Odar's Shade 41 m · I'm a Believer!: Temporary Investigation Base 6 m · Fallout Calmed: Amunta's Hideout
57 m · Sapling Hide-and-Seek: Odar's Shade 24 m · One Last Thing: Watcher's Tent 11 m · A Traitor Within: Quai Campsite
78 m · Regular Altar Maintenance: Faded Stump 19 m · Restless Spirits: Healing Spring 22 m · Nine Wonders of Altgard:
Final Stretch: Basfelt Ruins Cliff 14 m · Immortal Isle's Distinct Ecology: Temporary Retreat 197 m · Spirit Isle, Where
Time Has Stopped: Basfelt Waterfall 39 m · Farewell, My Instructor: Nornir Assembly 168 m · Ravenous Recluse: Abandoned
Campsite 79 m · Spacetime Rift: Unfamiliar Material: Collapsed Chasm 4 m · Spacetime Rift: Developing Travel Goods:
Guide Rest Stop 23 m · Spacetime Rift: Difference Between Here and There: Guide Rest Stop 23 m.
Blood Barrier: giver and turn-in Nemon, Collapsed Hall of Fame 32 m.

Eleven of these quests cite non-Metabot pages today (`lest-we-forget` shugo.gg; `lost-memories`, `spirit-isle-…` wikily;
`sapling-hide-and-seek`, `one-last-thing`, `regular-altar-maintenance`, `restless-spirits`, `nine-wonders-…-final-stretch`,
`farewell-my-instructor`, `ravenous-recluse` aion2.gaming.tools). Metabot pages exist for all of them at the same slug;
the patch adds those URLs (they go to the Sources card via `npm run gen`).

### 4.3 Other findings for the data owner

- **Daily dungeon name**: Metabot content-unlocks and weekly-reset (client tables) both name the Lv 30 daily dungeon
  "Unknown Fissure" (14 entries/week, Wednesday). Our `build.json dailyDungeon` names "Daeva Bio-Research Base" (citing
  the same Metabot page). Likely "Unknown Fissure" is the content and Bio-Research Base one dungeon in it; check the
  in-game name before changing anything.
- **Reset times** (for the Lv 45 checklist idea): daily 16:00 and weekly Wednesday 16:00 server time, from the
  client's ticket table; Metabot says "not yet confirmed in game" (B, needs one in-game look).
- **Conquest tiers** (Metabot content-unlocks): Tier 1 item level 700 (Draupnir, Krao Cave) … Tier 5 3,000, all at
  Lv 45; Tier 6 3,800 at Lv 50. Consistent with C08.
- **Elyos sealed-dungeon rewards differ** (Library of Wisdom: Elyos 15,000 Kina, 1,000 AP, 2,500 Enhance Stones;
  Asmodian 15,000 Kina, 2 Featherdown, 2 Statue Scrap, title, 2 crystals, 2 Wisdom Stones, 1,250 Enhance Stones).
  Note for Elyos after 1.0.

### 4.4 Path-cost model check (6b)

Assassin Nezekan from th.gl dv_41: 88 nodes on an 11×11 grid (rows/cols 3–13), centre (8,8) empty = start. Cost of
a set of targets = cheapest connected set of nodes from the centre (node-weighted Steiner tree), 4-neighbour moves.

| Target(s) | 4-neighbour model | 8-neighbour model | Owner's board (milestone `g12:0`) |
|---|---|---|---|
| Heart Gore + Exploit Weakness 1 | 11 | 9 | 11 |
| Ambush | 7 | 5 | 7 |
| Quick Slice | 6 | 5 | 6 |
| Ambush + Quick Slice | 11 | 9 | 11 |
| + Exploit Weakness 2 | 16 (5 more) | 12 | 5 past Quick Slice |
| All five | 27 | 21 | 27 |

The 4-neighbour model matches all six owner numbers; the 8-neighbour one matches none. Board totals check out too:
every board's node costs sum to its "Total Cost" (134/134/134/168/232) for all 40 boards.

## 5. Blocked sites (this environment)

The environment's network policy allows **metabot.gg** and **aion2.th.gl** only. Every other source host fails at the
proxy (`CONNECT tunnel failed, response 403`), so this is an environment setting, not the sites' bot checks:

aion2.gaming.tools, thegameswiki.com, wikily.gg, games.gg, gamesfuze.com, skycoach.gg, gamewith.ai, keengamer.com,
allthings.how, playnews.gg, mein-mmo.de, aion2hub.com, exitlag.com, destructoid.com, powerupgaming.co.uk,
gameplay.tips, inven.co.kr, aion2.plaync.com, metaroad.gg, daevacompass.com, oslink.io, timesaver.gg, neonsect.com,
fandomwire.com.

aion2.th.gl works but resets about one connection in three after ~12 s; 4 parallel requests with retries fetched all
320 skill and board pages without a failure. Metabot answered every request.

To read the advice sources for a class pack, the owner can add the needed hosts under the environment's network
settings (Allowed domains; https://code.claude.com/docs/en/cloud-environments#network-access) — at least gamesfuze.com,
games.gg, skycoach.gg, keengamer.com, allthings.how, wikily.gg, aion2.gaming.tools, thegameswiki.com.

## 6. Recommendation: next class

Rule (ROADMAP 0.7–0.13): (1) a class the owner or a tester will level to 45, then (2) best data coverage, then
(3) most shared with Assassin.

1. **Owner / tester: unknown.** Nothing in the repo says who plays what. This criterion matters most in practice: each
   release needs an in-game spot check, and the advice fields (§3) are where the guide can be wrong. **Owner question:
   will you or a tester level one of the seven to 45 in the next weeks? If yes, that class goes next.**
2. **Coverage does not separate the classes in the DB layer** (all A/B, §2.2). In the advice layer Gladiator and Ranger
   lead: 8 candidate guides each, a Metabot tracked sample (Sorcerer, Cleric and Chanter show none), and no board-label
   mismatch for Gladiator (Ranger has one).
3. **Shared with Assassin**: every class has the same skeleton. Gladiator shares Defiance and Impact Hit names and a
   melee, Attack › Critical Hit stat profile (Metabot); Ranger shares Defiance and Revitalization Contract and the pure
   "Damage" role. Templar and Chanter also share Impact Hit; Cleric and Chanter are healers (new UI needs: party
   healing has no Assassin equivalent).

**Recommendation: Gladiator** (ties Ranger on coverage, wins on board labels and on melee/greatsword AoE being the
closest to the Assassin plan's "rotation on a dummy" checks (a judgment call, not data); it is also HANDOFF's default). **Ranger** is the
alternative if the owner prefers a pure damage class. Either way the order should flip to whichever class the owner or
a tester will actually play (criterion 1).

Not recommended first: **Templar** (fewest candidate guides, tank role needs advice the Assassin plan never had),
**Cleric / Chanter** (healer support advice, no Metabot sample, Chanter board label mismatch).

Before starting the Gladiator pack: allow the guide hosts (§5), then read GamesFuze, KeenGamer, Destructoid and
allthings.how for skill-point order and stigma timing; Metabot's pick rates (Lunge Stance, Zikel's Blessing, Rage
Burst, Focused Block) are the first source to confirm or dispute.
