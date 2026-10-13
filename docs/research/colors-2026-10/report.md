# Daeva Companion: AION 2 colour proposal

Product Design with Data & Research, 13 Oct 2026. **Research and proposal only. Nothing in the repo was changed.**
The mocks use a temporary CSS override injected into a scratch copy of the repo (`colors/repo`, built with `npm ci && npm run build`, Lv 27 fixture `tests/fixtures/fixture-user-v285.json`).

Files in this folder:
- `swatches.png`: the token sheet (1170 px wide).
- `mock-390.png` (3 phone screens at 2x) and `mock-1500.png`: the real app with the override.
- `override-mock.css` (tokens plus how they're applied, without the inlined Fraunces font), `mock-toast.js` and `mock-place.js`: the mock-only DOM tweaks.
- `tokens.json`, `classes.json`, `samples.json`: machine-readable values. `img/proof/proof-*.png` shows every sampling box drawn on its screenshot.
- `work/`: the scripts (`sample.py`, `cvd.py` for contrast, Machado-2009 CVD simulation and ΔE2000, `palette.py`, `swatches.py`, `shot2.cjs`, `compose.py`).

## 1. Verdicts

**Class list: 8 in AION 2 global.** These are Gladiator, Templar, Assassin, Ranger, Sorcerer, Spiritmaster, Cleric and Chanter.
- **Brawler exists, but only in Korea and Taiwan.** It is the gauntlet/fist class (KR 권성), added on 2026-07-01 in "Chapter 1: Land of Sand and Frost".
- **Sources that agree on the status:**
  - Inven Global news confirms the KR addition.
  - Metabot ("All 8 Classes", global client database) lists 8.
  - timesaver.gg, powerupgaming.co.uk and guildorder.com each state that Brawler is not in the global launch.
- **Global client data (single source).** aion2hub.com says the global client already carries Brawler skill data, but it is redacted.
- **Why daevacompass shows 9.** It lists "Brawler" among its class guides (the page renders via JS). This is the KR roster. daevacompass also calls Spiritmaster "Élémentaliste".
- **Data rule:** treat Brawler as *not in global*. Keep a provisional colour only so that adding it later doesn't force a remap.

**No official class colours exist.** These places were checked:
- The official site (aion2.plaync.com) has no class pages. Its CSS only has the site palette.
- Metabot's eight class emblems are all the same platinum-gold (median #e3c4a0, hue 33–35° on all eight; `img/classref/sheet.png`).
- The owner's screenshots show no per-class tint anywhere.

So classes use the WoW mapping (section 4).

**Item grade colours do exist, and they are verifiable.**
- Metabot ships a client-derived `GRADE_COLORS` table.
- The owner's reward window matches it pixel-exact. Epic/"Legend" item names are #379aff in both. The quest-window pet names are #c3c3c3, the same as Metabot's Common.

## 2. Sources

Owner screenshots (source of truth; kept privately per DECISIONS D10, not in this repo):
- 705a2e0c (faction select)
- fb851f18 (quest tracker)
- ede9e833 (Trade Ledger)
- c515792c (Quest Complete)
- 581243ec (Empyrean Trace)
- 2f3d3a11 (Recon Report)
- 3ae79746 (reward chest)
- From the archive set:
  - a4eaf6ea (Journal)
  - 8f1b656c (Item Extraction)
  - 74a4b024 (Gathering Essentials quest window)
  - 737f15cc (title cards)
  - aabcdf3e (Daevanion board)
  - e1f7bda1 (Cube)

Web:
- AION 2 official site and stylesheet: https://aion2.plaync.com/en-us/index, https://assets.playnccdn.com/static-nc-home/2.8.5/css/nc-home-aion2global.css
  - Site palette: navy #0f1f3c, blue rgba(61,130,191) = #3d82bf, #1566b3, #70d2ff, #90e1ff, pale gold #ebe487.
  - The OG key art (fizz-download …1a0efb88d12…, 1200×630) has Asmodian violet hair #5736b3, Elyos blue #4a83c1 and a logo glow #10b9f6.
- Metabot:
  - Classes: https://metabot.gg/en/aion-2/classes
  - Item database: https://metabot.gg/en/aion-2/items. The grade filter reads Common, Rare, Epic (value `Legend`), Unique, Heroic (value `Epic`), Mythic, Special. `GRADE_COLORS` is in `/_next/static/chunks/13rxhnc__z8wc.js`.
  - Class emblems: https://metabot.gg/web/aion2/classes/{class}.webp (downloaded for hue measurement only, not for use).
- GameWith: https://gamewith.ai/aion2/en/items/210740006. Grade "Epic" carries the CSS class `items-grade-text--Legend`, confirming the Legend → "Epic" label. GameWith's own colours (Rare blue, Legend purple) are site styling and contradict the in-game Rare green, so they are not used.
- Brawler:
  - https://www.invenglobal.com/articles/23338/nc-launches-major-aion-2-update-chapter-1-land-of-sand-and-frost
  - https://timesaver.gg/blog/aion-2-classes
  - https://powerupgaming.co.uk/2026/10/04/aion-2-all-classes-ranked/
  - https://guildorder.com/de/games/aion2/classes/brawler
  - https://aion2hub.com/classes/brawler
  - https://www.daevacompass.com/classes/brawler
- WoW class colours:
  - Blizzard UI source, 3.3.5 `RAID_CLASS_COLORS`: https://raw.githubusercontent.com/Gethe/wow-ui-source/3.3.5/FrameXML/Constants.lua. This gives Warrior, Paladin, Hunter, Rogue, Priest, Shaman, Druid and DK, matching the brief. Mage and Warlock there are the pre-Shadowlands #69ccf0 and #9482c9.
  - Wowhead Evoker announcement (#33937F): https://www.wowhead.com/news/a-new-class-means-a-new-class-color-evoker-class-color-announced-326784
  - Mage #3FC7EB, Warlock #8788EE, Monk and DH are taken from https://warcraft.wiki.gg/wiki/Class_colors as given in the brief. That wiki returns a bot block to scripted reads, so these four are **single source here**.
- Not reachable:
  - thegameswiki item-grades: Vercel checkpoint.
  - aion2.gaming.tools: Cloudflare 403.
  - aion2.th.gl: reachable, but no grade colours found in its bundles.

## 3. Sampled values (measured → clean token)

Method:
- `text` boxes take the 12% of pixels farthest from the box's median, which isolates glyphs from the background.
- `sat` takes the most saturated 12%; `bright` the brightest; `flat` the median of the whole box.
- Ranges are the 10th–90th percentile.
- Compression and glows skew the extremes, so each token uses a clean value at the core of the range.

| Game element (screenshot, box) | Measured | Range | Token |
|---|---|---|---|
| Faction select field (705a2e0c, 256,384–512,640) | #0a141a | #081118..#0c161e | `--bg` #0a1318 |
| Elyos rune glow / label halo / description (705a2e0c) | #71d4c9 / #2f9385 / #b0fffd | #59bcb8..#b5f6d9 | `--elyos` #6fd6ca, `--elyos-glow`, `--elyos-tint` |
| Asmodian rune glow / label halo / description | #d794e4 / #8534aa / #e2d8ff | #b378d2..#fbb9fe | `--asmo` #c793ee, `--asmo-glow`, `--asmo-tint` |
| Gold primary button (8f1b656c Extract; the faction-select one is disabled and dimmed) | #c99417 body, edge to #ffe23d | #b4800d..#e6b633 | `--btn-gold` #e6ac1f, `-hi` #ffe23d, `-lo` #b4800d |
| Story diamond / story title (fb851f18) | #dac35c / #ffd35f | #d6bc54..#e3cc6a | `--story-badge`, `--story` |
| Regional diamond / regional title | #38a281 / #56d8b3 | #319773..#40b192 | `--regional-badge`, `--regional` |
| Objective / sub-objective / completed + strike | #ffffff / #ffe8b9 / #91866f | #8b8169..#c2b18f | `--fg` #eceff1, `--hint`, `--done` #938c7f |
| Reward window panel / header / item names / hint | #1d2029 / #2e3442 / #379aff / #ffe8b9 | exact | `--panel` (cooled toward brand teal), `--grade-epic` |
| Upgrade arrow / item frame (3ae79746) | #7ef800 / #30b0d1 | #4eeb00..#c0ff01 / #2c9db7..#36c7f1 | `--upgrade` #74ee15, `--item-frame` #33bde0 |
| Quest Complete title / line / smoke (c515792c) | #ceeaf4 / #92b9dc (core #fcffff) / #183652 | #6a96b6..#fcffff | `--ice`, `--glow-line` #90e1ff (= official CSS), `--glow` #3d82bf (= official CSS) |
| Note header / title / glyphs / rule / star (ede9e833) | #010202 / #f3e3c6 / #f0d6a1 / #8c815e / #ffffe0 | #eedab7..#f9ecd5 | `--note-head` #06090b, `--title` #f2e3c4, `--rule-gold` |
| Parchment lit centre / edge / ink | #ede2ca / #bead8d / #000000 | #d8c9ad..#f4ead4 | `--parchment`, `--parchment-edge` #c9b896, `--ink` #1f1a14 |
| Place name "Idun's Lake" (2f3d3a11) | #ff2607 | #f61e05..#ff2a0b | `--place` (game), `--ink-place` #a3200c (app, AA on parchment) |
| Empyrean feather glow / core / label (581243ec) | #d4533d / #6f1314 / #55d1ac | #b4231f..#e6846b | `--accent` #e0675a (brand Quill red), `--feather-core`, label = `--regional` |
| Journal region diamond / quest diamond / "Lv. 22" | #7e95d2 / #3aa785 / #e4d39f | | `--lv-gold` |
| Extraction "Rare Dagger" / "Common" (8f1b656c, under a modal dim) | #072914 / #202526 | flat | consistent with #19e048 / #c3c3c3 × ~0.17; needs an undimmed check |
| Keyword "Extract" / warning text | #ecb145 / #ff3737 | exact | `--keyword` (= Missed), `--danger` #ff4d4d |
| Title-card stat value / "Basic Rewards" | #40fdff / #b7f7ff | exact | `--value-cyan`, `--section-cyan` (reserved) |
| Daevanion board node fills: orange / green / blue / grey; blue node glow | #9c4709 / #2a4532 / #27435d / #464744; #50f0ff | | the app's `.dv-a/.dv-p/.dv-c` (blue/green/orange) already mirror these; keep |

## 4. Proposed token set

The app is dark-only. The *light* column is the value to use on parchment (the notes card) and, later, in a parchment light theme. It was computed to reach ≥ 4.5:1 on #ede2ca, and the ratio is in brackets.

Contrast is shown on `--panel` #121a21, then on `--panel-2` #19232c. A dash means the token isn't text: a surface, rule or glow.

| Token | Dark | Light / on parchment | Contrast panel / panel-2 | Source |
|---|---|---|---|---|
| `--bg` | #0a1318 | #efe4cc (1.02) | — | faction-select field #0a141a [#081118..#0c161e]; brand deep teal #0b1b1e |
| `--panel` | #121a21 | #ede2ca (1.00) | — | reward window #1d2029, extraction #212530 (blue-slate), pulled toward the brand teal |
| `--panel-2` | #19232c | #e4d6b8 (1.12) | — | reward header band #2e3442 [#242934..#343c4c], darkened |
| `--line` | #29343e | #cdbd9c (1.44) | — | reward header rule #2b313e [#21252f..#5e666f] |
| `--note-head` | #06090b | — | — | note/scroll header #010202 (Trade Ledger), lifted a step so it reads as a band |
| `--fg` | #eceff1 | #1f1a14 (13.43) | 15.21 / 13.79 | game body text #ffffff (tracker, reward window); toned 7% for long reading |
| `--title` | #f2e3c4 | #6b6455 (4.56) | 13.85 / 12.56 | note/quest titles: Trade Ledger #f3e3c6 [#eedab7..#f9ecd5], Recon #f1e0c2, journal title #f2edda |
| `--muted` | #98a2ab | #5b5140 (6.06) | 6.77 / 6.14 | footer #9ea2a5, journal quest name #b3b6bc |
| `--done` | #938c7f | #6b6356 (4.61) | 5.27 / 4.78 | completed objective (strikethrough) #91866f [#8b8169..#c2b18f] |
| `--brass` | #cfa650 | #7a5b16 (4.90) | — | brand brass; game story badge #dac35c, note rule #8c815e, emblem metal #c2b0a4 |
| `--rule-gold` | #8c815e | — | — | note header hairline #8c815e [#837857..#968b67] |
| `--story` | #ffd35f | #786228 (4.57) | 12.33 / 11.18 | tracker story title #ffd35f [#f9ce5d..#ffd35f] |
| `--story-badge` | #dac35c | — | — | tracker story diamond #dac35c [#d6bc54..#e3cc6a] |
| `--hint` | #ffe8b9 | #6f644e (4.53) | 14.63 / 13.27 | sub-objective + reward hint, identical in two screens #ffe8b9 |
| `--lv-gold` | #e4d39f | #6d654a (4.52) | 11.81 / 10.71 | journal "Lv. 22" #e4d39f |
| `--btn-gold` | #e6ac1f | — | — | Extract button body #c99417 [#b4800d..#e6b633], top highlight #d69812..#ffe23d |
| `--btn-gold-hi` | #ffe23d | — | — | Extract button bright edge |
| `--btn-gold-lo` | #b4800d | — | — | Extract button shade |
| `--btn-ink` | #1a1206 | — | 9.08 / 1.16 | dark label on the gold button (app already uses #1a1206 on warn) |
| `--keyword` | #ecb145 | #805f21 (4.57) | 9.15 / 8.30 | emphasised keyword "Extract" #ecb145 |
| `--regional` | #56d8b3 | #29715c (4.52) | 9.93 / 9.00 | tracker regional title #56d8b3 [#53cfac..#56d8b3]; Empyrean label #55d1ac |
| `--regional-badge` | #38a281 | — | — | tracker regional diamond #38a281 [#319773..#40b192]; journal #3aa785 |
| `--glow` | #3d82bf | — | — | official site CSS rgba(61,130,191); Quest Complete smoke #183652..#294567 |
| `--glow-line` | #90e1ff | — | — | official site CSS #90e1ff/#70d2ff; Quest Complete light line #92b9dc core #fcffff; journal selection #c9fdfe |
| `--ice` | #ceeaf4 | #5a676c (4.55) | 13.97 / 12.67 | Quest Complete title #ceeaf4 |
| `--value-cyan` | #40fdff | #177071 (4.55) | 13.98 / 12.68 | title-card stat values #40fdff |
| `--section-cyan` | #b7f7ff | #4d6a6e (4.53) | 14.86 / 13.48 | quest window "Basic Rewards" #b7f7ff |
| `--elyos` | #6fd6ca | #366e68 (4.55) | 10.16 / 9.22 | faction select: rune glow #71d4c9 [#59bcb8..#b5f6d9], label halo #2f9385, text #b0fffd |
| `--elyos-glow` | #2f9385 | — | — | Elyos label halo #2f9385 [#208a7b..#5aae9e] |
| `--elyos-tint` | #b0fffd | #476b6a (4.56) | 15.53 / 14.09 | Elyos description text #b0fffd |
| `--asmo` | #c793ee | #795892 (4.51) | 7.39 / 6.70 | faction select: rune glow #d794e4 [#b378d2..#fbb9fe], label halo #8534aa, text #e2d8ff |
| `--asmo-glow` | #8534aa | — | — | Asmodian label halo #8534aa [#7e2ca2..#954cb6] |
| `--asmo-tint` | #e2d8ff | #676276 (4.56) | 12.97 / 11.76 | Asmodian description text #e2d8ff |
| `--grade-common` | #c3c3c3 | #656565 (4.53) | 9.97 / 9.04 | Metabot GRADE_COLORS Common; pet names in quest window #c3c3c3 (exact) |
| `--grade-rare` | #19e048 | #087622 (4.51) | 9.87 / 8.95 | Metabot Rare; in game green under a modal dim (#072914 after ~83% dim) |
| `--grade-epic` | #379aff | #2267ad (4.52) | 6.05 / 5.48 | Metabot "Legend" (shown as Epic); reward window item names #379aff (exact) |
| `--grade-unique` | #ffd02b | #7a620f (4.56) | 11.97 / 10.86 | Metabot Unique |
| `--grade-heroic` | #ff6c00 | #aa4600 (4.56) | 6.19 / 5.61 | Metabot key "Epic" (shown as Heroic) |
| `--grade-mythic` | #ff3245 | #c32432 (4.51) | 4.85 / 4.40 | Metabot Mythic |
| `--grade-special` | #00ffd8 | #007361 (4.51) | 13.63 / 12.36 | Metabot Special |
| `--upgrade` | #74ee15 | — | — | reward window upgrade arrow #7ef800 [#4eeb00..#c0ff01] |
| `--item-frame` | #33bde0 | — | — | reward window icon frame #30b0d1 [#2c9db7..#36c7f1] |
| `--accent` | #e0675a | #a8382f (4.99) | 5.23 / 4.75 | brand Quill red; Empyrean feather glow #d4533d [#b4231f..#e6846b] |
| `--feather-core` | #6f1314 | — | — | Empyrean feather core #6f1314 |
| `--place` | #ff2607 | #c81b04 (4.52) | 4.63 / 4.20 | scroll place name "Idun's Lake" #ff2607 [#f61e05..#ff2a0b] |
| `--danger` | #ff4d4d | #b93535 (4.51) | 5.37 / 4.87 | warning text "Includes enhanced gear." #ff3737, +lightness for AA on panel |
| `--good` | #5fbf8a | #1a6b40 (5.07) | 7.78 / 7.06 | kept from the app (ticks); game has no tick green except the upgrade arrow |
| `--parchment` | #ede2ca | — | — | Trade Ledger lit centre #ede2ca [#d8c9ad..#f4ead4] |
| `--parchment-edge` | #c9b896 | — | — | ledger edges #bead8d, scroll #d1c3a4..#88775a |
| `--ink` | #1f1a14 | — | 13.43 | note ink #000000 [#000..#2d2a25]; softened to a brown-black |
| `--ink-place` | #a3200c | — | 5.90 | place-name red darkened to pass AA on parchment (game #ff2607 is 2.9:1 there) |

AA notes:
- Every text token passes 4.5:1 on `--panel`.
- Two fall just under it on `--panel-2`, so neither may be used for small text on `--panel-2`:
  - `--grade-mythic` (4.40)
  - `--place` (4.20; game-only reference)
- `--done` was lifted from the game's #91866f to #938c7f to stay ≥ 4.5 on `--panel-2` (4.78).
- The light `--title`, `--story`, `--hint` and `--lv-gold` values come out greyish. That's expected: these game colours are pale glows, which don't translate to ink. On parchment, use `--ink` with a brass rule instead.
- `--ink-place` drops to 3.9:1 where it sits on `--parchment-edge`. The card's padding keeps text in the lit centre, which is 5.9:1.
- Extra checks:
  - `--ink-2` #4a3f31 body on parchment: 7.98.
  - `--btn-ink` on the button gradient: 14.3 at the top, 5.33 at the darkest edge.
  - `--regional` on an in-progress row: 9.2.
  - `--accent` and `--asmo` on `--bg`: 5.59 and 7.9.

## 5. Class colours (WoW mapping)

AION has no official class colours (section 1), so each class takes the WoW colour of its archetype.

Two changes were needed for colour-vision safety:
- **Chanter takes Druid orange, not Shaman blue.** Shaman is the closer archetype (mantras ≈ totems, melee hybrid). But it must be lightened to #4f83e0 to pass AA, and then Spiritmaster vs Chanter falls to ΔE00 3.4 under protanopia and 6.1 under deuteranopia: the two blues become one.
  - Druid is the staff-wielding hybrid healer/fighter.
  - Keeping Spiritmaster as Warlock purple keeps the stronger match (pet summoner, DoTs, fear).
- **Gladiator is darkened from #C69B6D to #b5875a.** Warrior tan and Hunter green read as one under deuteranopia (ΔE00 8.9 → 12.7 after the change).

Every app value passes AA on `--panel`, with the lowest at 4.70.

| Class | WoW source | App value | Contrast on panel | deutan / protan sim | Rationale |
|---|---|---|---|---|---|
| Gladiator | Warrior #C69B6D | **#b5875a** | 5.50 | #a1945b / #968a56 | Two-handed melee bruiser (greatsword/polearm), the plate front-liner: the Warrior archetype. |
| Templar | Paladin #F48CBA | **#F48CBA** | 7.79 | #b2b3b7 / #98a1bc | Sword-and-shield holy knight and main tank: the Paladin archetype. |
| Assassin | Rogue #FFF468 | **#FFF468** | 15.39 | #fff370 / #ffec58 | Dual daggers, stealth, back attacks and poisons: the Rogue archetype. |
| Ranger | Hunter #AAD372 | **#AAD372** | 10.26 | #d6c578 / #dcc86a | Bow, traps and range: the Hunter archetype. |
| Sorcerer | Mage #3FC7EB | **#3FC7EB** | 8.85 | #99b1eb / #b1c2ed | Spellbook elemental nuker (frost/fire), crowd control: the Mage archetype. |
| Spiritmaster | Warlock #8788EE | **#8788EE** | 5.68 | #5c8fec / #6296f2 | Summons spirits, damage over time, fear and debuffs: the Warlock archetype. |
| Cleric | Priest #FFFFFF | **#FFFFFF** | 17.57 | #ffffff / #ffffff | Main healer with holy damage: the Priest archetype. |
| Chanter | Druid #FF7C0A | **#FF7C0A** | 6.81 | #c2ad00 / #a38f00 | Staff-fighting hybrid: buffs (mantras), heals and melee. Shaman (#0070DD) is the closer archetype but fails CVD against Spiritmaster (see below), Druid is the staff-wielding hybrid healer/fighter. |
| Brawler (KR/TW only) | Evoker (provisional) #33937F | **#33937F** | 4.70 | #808081 / #8e8a7e | Archetype match is Demon Hunter #A330C9 (Fury resource, leaps) but it collides with Spiritmaster under deuteranopia (dE 5.2); Monk (fists) collides with Ranger (6.2), Death Knight with Gladiator (6.7). Evoker teal-green is the only WoW colour that stays >= 12 from all eight. Not in global: decide when it ships. |

**CVD report** (Machado 2009, full severity; ΔE2000; 10 = clearly distinct side by side, < 10 = clash).

No pair clashes in normal vision, deuteranopia or protanopia. Every pair in the eight-class global set is ≥ 10.0 under all three, and ≥ 10.8 under tritanopia. The weakest pairs, all ≥ 10.0:
- Protanopia:
  - Assassin/Ranger 10.0
  - Templar/Sorcerer 10.2
  - Gladiator/Chanter 11.2
- Deuteranopia:
  - Ranger/Chanter 11.2
  - Sorcerer/Spiritmaster 11.9
  - Assassin/Ranger 12.3
- Tritanopia:
  - Templar/Chanter 10.8
  - Assassin/Cleric 11.7
  - Gladiator/Chanter 12.1

Rejected alternatives:
- Pure WoW colours with Shaman for Chanter: protan Spiritmaster/Chanter 3.4 and deutan 6.1 (after the lightening AA needs; unlightened, Shaman is only 3.6:1 on the panel). Gladiator/Ranger: deutan 8.9.
- Brawler as Demon Hunter: deutan 5.2 vs Spiritmaster.
- Brawler as Monk: 6.2 vs Ranger.
- Brawler as Death Knight: 6.7 vs Gladiator.

Rules of use:
- A class colour is always paired with the class name or icon; never colour alone.
- Use it only on class chips, the class switcher and per-class accents, never on body text.
- Cleric white equals `--fg`, so a Cleric chip needs its swatch or left border, not just white text.
- Assassin yellow sits near `--story` and `--grade-unique`, but in a different context (class chips vs quest/item names). For the current Assassin-only app, the class colour appears nowhere today.

## 6. Faction pair

| | Text-safe | Glow (halo, borders) | Tint (long text) | Hue |
|---|---|---|---|---|
| Elyos | `--elyos` #6fd6ca (10.2:1) | #2f9385 | #b0fffd | 172–176° |
| Asmodian | `--asmo` #c793ee (7.4:1) | #8534aa | #e2d8ff | 274–281° |

**While the app is Asmodian-only, `--faction` = `--asmo`.** Use it only as identity:
- the eyebrow line (AION 2 · ASMODIAN · ASSASSIN);
- the faint top-right background glow, which replaces the current plum (as the halo behind the emblem on faction select).

It is not an interactive colour. Reasons:
- Violet vs `--grade-epic` blue is only ΔE 3.7 under protanopia, so violet must not mark anything an item name could also mean.
- The interactive accent stays the brand Quill red.

## 7. Semantic map: game element → our UI

The principle is low noise: one meaning per colour, colour on a small mark (badge, tag, frame) rather than whole cards.

| Game element | Game colour | Where in Daeva Companion | Mocked? |
|---|---|---|---|
| Main story quest: gold diamond, gold title | `--story-badge`, `--story` | Journey "Main story" dots become diamonds: passed = gold, current = accent. The `story: passed` / `reached` chips get gold text and a ◆. Story Next up cards get a gold ◆ on the number tile (`.ns-card:has([data-now=story])`). Titles stay `--fg`, so not every row is gold. | yes (Journey, chips) |
| Regional quest: teal diamond, teal title | `--regional-badge`, `--regional` | The "Regional quests · Lv N" header turns teal with a ◆ (was accent red); open regional quest titles are teal. Regional Next up cards get a teal ◆. | yes |
| Objective white / sub-objective amber | `--fg` / `--hint` | Journey objectives stay `--fg`; the `.item .note` tips and sub-steps move from warning amber to pale `--hint` with a brass ✦. They are advice, not alarms, and this lowers the noise. | yes |
| Completed: grey + strikethrough | `--done` | Ticked rows, the "Cleared" tag and Lv box, and cleared rail dots go grey (green is kept only for the tick box itself). | yes |
| Gold primary button | `--btn-gold*` | Every primary CTA turns gold with a dark label: Level up, Mark spent, Spent / Turned in, Next objective, Cube add. Green leaves buttons. | yes |
| Green upgrade arrow + cyan item frame | `--upgrade`, `--item-frame` | "You can upgrade this now": the Skills/Daevanion/Stigmas hero icon gets a cyan frame and ▲ arrow when affordable (`.sphero.ok`); "now" in Coming up lists becomes green ▲ now. | yes |
| Item and reward names in their grade colour | `--grade-*` | Reward and item names (`Reward: <em>…</em>`, cube items, Stigma items) take their grade colour **only when the grade is in the data**; otherwise `--fg`. The measured blue *is* the Epic grade, not a generic "reward blue", so painting every reward blue would mislabel Rare/Common items. Needs a `grade` field per reward (Metabot quest pages show the reward item; Data & Research can add it). Skill and Daevanion names are not items: `.dv-a/.dv-p/.dv-c` keep their board-node colours. | swatch only |
| Quest Complete banner | `--glow`, `--glow-line`, `--ice` | `#rwToast` and the level-up float: blue-glow panel, spaced caps label ("LEVEL UP", "REWARD"), Fraunces message in `--ice`, light line with a ✦. Needs the toast to take a label plus message (today it takes `textContent` only). | yes (static) |
| Note / scroll (parchment, dark header, gold title, ✦ rule, red place names) | `--note-head`, `--title`, `--rule-gold`, `--parchment`, `--ink`, `--ink-place` | **Only** the lore-like "The map" card (`section.card.notes:not(.foldcard)`). Place names need markup (`<span class="place">`, or a data field). The mock wraps them with JS. Tips stay dark (see `--hint`); Confidence and Sources stay plain. | yes |
| Empyrean Trace: crimson feather, teal label | `--accent`, `--feather-core`; label `--regional` | The brand needle *is* this feather. Quill red stays the interactive/"now" accent (current milestone, Now tag, focus ring, progress ring, slider). Empyrean Trace mentions in text may use a crimson ✦ icon. | yes (accent) |
| Warning text (red) / emphasised keyword (orange) | `--danger` / `--keyword` | "Missed": the amber `--keyword` tag and Lv box only. The whole-card amber border is dropped, because the game greys finished things and doesn't frame them. `--danger` is kept for errors (bad import, save warning). Under deutan/protan it is only ΔE 3–6 from `--accent`, so it always needs an icon or word. | yes (Missed) |
| Faction-select glows | `--asmo-glow` | Header background glow and eyebrow (section 6). | yes |
| Title-card cyan values, "Basic Rewards" cyan | `--value-cyan`, `--section-cyan` | Reserved. A candidate for numeric stat deltas (+5 Accuracy) if stat tooltips are added. Not used now. | no |
| Sources and Confidence cards | — | Unchanged neutral. Confidence keeps the existing "verified" green chip. Reference material shouldn't compete. | — |

**Basic mode.** Same colours; Basic hides the same elements it does today. No colour is the only carrier of meaning in either mode: diamonds have shapes, tags have words, frames have arrows.

## 8. Fit with Compass Quill

The brand and the game already agree:
- **Brass:** brand #cfa650 vs the game's story badge #dac35c and note rule #8c815e.
- **Parchment:** brand light #f3ead7 vs the game's lit parchment #ede2ca.
- **Red feather:** brand Quill red #e0675a vs the Empyrean feather glow #d4533d, ΔE00 6.7, the same hue family. The brand needle reads as an Empyrean feather.
- **Deep teal:** brand #0b1b1e vs the faction-select field #0a141a.

The proposed surfaces (`--bg` #0a1318, `--panel` #121a21) sit between the brand teal and the game's blue-slate reward window.

**Should brand teal become the Elyos teal? No; keep them separate.**
1. **Different roles.** Brand teal is a dark *surface* (L* ≈ 9). Elyos teal is a light *glow/text* colour (L* ≈ 79). They aren't the same token at different lightness, and nothing in the brand needs a bright teal.
2. **Regional teal is taken.** The game's regional-quest teal (#56d8b3, H 163°) is ΔE00 7.9 from Elyos teal (H 172–176°) in normal vision, and closer under CVD. Regional teal also labels Empyrean Traces, so the game itself uses this teal to mean "interactable / regional", not "Elyos". A bright brand teal would read as "regional quest" or "Elyos" in an Asmodian app.
3. **Faction neutrality.** The brand should stay faction-neutral for when Elyos support arrives. A deep, near-black teal surface carries no faction meaning; a bright teal accent would.

Recommendation:
- Brand teal stays the background family.
- Quill red stays the interactive accent.
- Violet is the faction accent today (identity only).
- Elyos teal is reserved for a future Elyos mode, where `--faction` switches to `--elyos`. In that mode, regional teal and faction teal should never sit in the same row.

The mock also uses Fraunces headings (brand C). That isn't part of this colour proposal, only consistency with the chosen direction.

## 9. Not verified / caveats

- **Grade display names in global** come from Metabot and GameWith labels: internal Legend → "Epic", internal Epic → "Heroic". Their order (…Unique, Heroic, Mythic) is unusual, so it needs an in-game check.
- **Rare green #19e048** is verified only as Metabot's value. The owner's Rare text sits under a modal dim. Common and Epic are verified pixel-exact.
- **Grade colours are not CVD-safe in the game itself:** Rare/Unique is ΔE 2.3 under protanopia. Always show the grade word (tooltip, or "(Rare)") when grade colour is used.
- **WoW values:** Mage, Warlock, Monk and DH modern values are single source (warcraft.wiki.gg blocked scripted reads; Blizzard's 3.3.5 source predates them).
- **Brawler colour is provisional:** Evoker #33937F, the only WoW colour ≥ 12 ΔE from all eight.
- **Glows:** screenshot glows are blended with game backgrounds, so the glow tokens are interpretations of the measured core, not exact UI constants.
- **The mock is only a sketch.** It doesn't restyle the Dungeons & Strongholds list (done rows still green) or several hard-coded `#e6b450` ambers (in-progress rows, count badges). A real change would move those to tokens: `--keyword` for in-progress, `--done` for done areas.

## 10. Questions for the owner (check in game)

1. **Grade names.** Hover an item with a **blue** name, e.g. Silent Necklace from the Fire Temple chest. Which word is on the grade line ("Epic"? "Legendary"?)? If you have them, do the same for a yellow, orange and red item. Screenshot the tooltip header.
2. **Rare green undimmed.** Open the tooltip of a Rare (green) item *without* the Item Extraction dialog dimming it, and screenshot the name line. This confirms #19e048.
3. **Class tints.** On character select, the party/raid frames, the legion roster and chat, are class names or icons ever tinted per class? Metabot's emblems are all identical gold. If any tint exists, screenshot it; it would replace the WoW mapping.
4. **Stigma names.** Is a stigma (e.g. Triniel's Dagger) graded, and what colour is its name in the tooltip? This decides whether Stigma names get grade colours.
5. **Other quest types.** In the Journal, are there quest categories besides gold (story) and teal (regional), e.g. daily, weekly or hero/campaign quests? Which diamond colours do they use? The region headers use a **blue** diamond (#7e95d2).
6. **Level-up banner.** On your next level-up, screenshot the game's own level-up message (colour, glow), so the toast can match it instead of borrowing Quest Complete.
7. **Brawler in global.** Does character creation in the global client show a ninth, greyed-out slot?
8. **Approvals** (product calls, per D6 anything visible needs your OK):
   - (a) primary buttons gold instead of green;
   - (b) Asmodian violet as the identity accent while the app is Asmodian-only;
   - (c) parchment for "The map" card only, or also for other lore-like cards;
   - (d) completed and Cleared turn grey (game style) instead of green;
   - (e) Chanter as Druid orange rather than Shaman blue, for colour-blind safety;
   - (f) adding a `grade` field to quest rewards (a Data & Research task) so reward names can be graded.
