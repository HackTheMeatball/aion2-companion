# Aion 2 Leveling Guide Builder: Prompt Pack

## How to use this (for you, the player)

1. Open a new chat with Claude (claude.ai or the Claude app). Turn on web search if it's off.
2. Attach the file `aion2-route-template.html` that came with this pack, plus every image in its `icons/` folder.
3. Copy everything below the line **"PROMPT STARTS HERE"** and paste it as your first message.
4. Answer the quiz. Claude then researches your class and faction and builds you a personal web-app guide with checklists, stop points, a skill-point plan and a rotation card.
5. As you play, tell Claude your new level or main quest, or anything that doesn't match the game, and it will update the guide.

---

PROMPT STARTS HERE

You are building me a personal Aion 2 leveling guide as an interactive web-app artifact. Before you build anything, quiz me. Then research, verify and build, following every rule below.

## Step 1: Quiz me first

Ask in short rounds (use multiple-choice question cards if you have them; otherwise ask in plain text, 3–4 questions per message). Don't start researching until rounds 1 and 2 are answered. Rounds 3 and 4 can be skipped if I say so.

**Round 1: Character**
- Faction: Elyos or Asmodian?
- Class: Gladiator, Templar, Assassin, Ranger, Sorcerer, Spiritmaster, Cleric or Chanter?
- Current character level (1–45)?
- Current main (story/Hero) quest name, exactly as it appears in my quest log?

**Round 2: Goals**
- What matters most: fastest leveling, being strong for endgame PvE, PvP/Abyss, or a balance?
- Solo or mostly in a group?
- First character, or an alt where I already know the game?
- How new am I to MMOs / Aion? (This sets how much the tooltips explain.)
- Free-to-play, or do I have (or plan to buy) the subscription or premium Daeva Pass? If F2P, flag anything paid with a "Paid" tag and plan around Kina being scarce: no Marketplace or Kina/Quna exchange without the subscription.

**Round 3: What I've already done** (multi-select)
- Hideouts / Sealed Dungeons cleared, Strongholds cleared, regional (green) quests done, Legion joined
- Specialty slots assigned, Stigmas equipped, Daevanion points spent, skill points spread across many skills
- Resources already spent: Shugo Festival keys used, heavy enhancement on one leveling item, items extracted, none

**Round 4: Format**
- Device I'll mostly view it on: PC second monitor, phone, both?
- Anything I specifically want covered (gathering, crafting, a particular dungeon, PvP)?

## Step 2: Research and verify

Treat the guide as the source of truth: every recommendation must come from a credible source you actually opened, not memory. Rules:

1. **Level-gate everything against the client-data unlock table** before placing it. Use Metabot's content-unlocks page (metabot.gg/en/aion-2/content-unlocks) and Wikily (wikily.gg/aion-2/leveling). Never recommend an action before it unlocks. Known values from build 0.0.4387.0, re-check them:
   - Lv 4 Skill · Lv 9 Enhancement · Lv 10 Item Extraction, Crafting, Gathering · Lv 22/27/32/37 Stigma slots · Lv 25 Supply Request · Lv 30 Daily Dungeon · Lv 45 Abyss, Market, Arcana, Nightmare, Ascension Trial, Conquest (tier 1 at item level 700).
   - Story-quest unlocks differ by faction (e.g. Asmodian Daevanion + Shugo Festival = "Urgent Pursuit", Legion = "Buried Atrocities", Pets = "Gathering Essentials"; Elyos Daevanion = "Visions in Smoke", Legion = "Renewed Resolve", Pets = "All Geared Up"). Use the quest's level from the leveling route, not a guessed level.
2. **Skills are gated by character level.** On Metabot's per-skill pages, a skill gains one level every 3 character levels after it's learned (skill level L needs character level learn + 3×(L−2)), and levels 2–4 cost 1 point, 5–7 cost 2, 8–10 cost 4; skill points stop at 10. Verify on at least 3 of my class's skills before assuming the pattern; flag passives as assumed if their pages don't show it. Specialty slots open at **skill** level 8, 12 and 20, not character level. Pick slot-1 effects only from the options available at skill level 8.
3. **Cross-check** facts with at least two independent sources. Label anything single-sourced, and label your own inferences as inferences. If sources disagree, say which you chose and why.
4. **Known corrections from the first build (don't repeat these mistakes):**
   - Gear can't be sold to vendors; old gear is extracted (Lv 10). There is no "vendor filter"; the only loot filter is the pet's.
   - Legions (guilds) aren't joinable at the start; they unlock through a story quest.
   - Daily dungeons are Lv 30, not early.
   - The first Stigma slot is Lv 22 (most sources), not 23 or 35.
   - Respec is free until character level 31.
   - Don't enhance leveling gear by default. Extraction returns Enhance Stones but not Kina. Enhance the belt and Revelation amulet (kept permanently); anything else only when a boss or dungeon actually blocks progress, weapon first.
   - Early-zone side quests are rare or absent; regional quests start in the second zone.
   - Skill points come from two sources: character levels grant them automatically, and **Wisdom Stone** items add 1 each. The in-game skill window shows "Points Earned" (Character Level, Wisdom Stone) and "Points Used" (Mastery); don't build a separate tracker for this.
   - Wisdom Stones arrive as items and Daevanion points as **Daevanion Crystal** items. Each must be *used* from the Cube (inventory) to become a point. Asmodian Chapter 1 story quests (Lv 2–9) give no Wisdom Stones; the first confirmed ones are Lv 10 hideouts (2 each) and Lv 12+ regional quests (1 each). Check my faction's early quest rewards before placing a "use your Wisdom Stones" step.
   - **Enhance Stones are normal Cube items.** The Lv 7 Asmodian story quest gives 5, but Pelleir's tutorial has you spend them right away (in practice on the starting weapon, which ends up +1). Say "save" them, and note that extracting that weapon once replaced returns the stones.
   - **Extraction returns more stones than were invested:** a +1 Training Dagger extracted for 11 Enhance Stones plus its skin, for 1,000 Kina. Extract every replaced piece.
   - Specialty slots open at skill level 8, not character level 8 (an early KR guide was misread that way).
   - Quest reward data can be outdated or misleading. My in-game observation beats any source: when I report something different, believe it, re-check, and update.
5. **Sources to start from** (open them, don't trust this summary):
   - Leveling routes by faction and level: aion2hub.com/leveling (Elyos: Poeta, Verteron; Asmodian: Ishalgen, Altgard). Its 40–45 pages may not load; say so if they don't.
   - Regional quests with level, location and reward: allthings.how area guides and selphie1999gaming.com (covers Altgard and Verteron).
   - Class skills, learn levels, costs, specialties: metabot.gg/en/aion-2/classes/<class> and its skill pages.
   - Class builds: GamesFuze, GamerBlurb (has Global leveling builds), Metabot build pages. Prefer a leveling-specific build for skill order while leveling.
   - General pitfalls: MeinMMO's "11 mistakes" and "30 beginner tips", KeenGamer's progression guide.
6. **No noise.** Cut generic advice, repeated reminders and anything a source doesn't support. If an item doesn't change what I do at a specific level, leave it out. No headings, notes or tooltips on the skill-point lines inside stop points: the checkboxes speak for themselves, and stop points are read top to bottom anyway.

## Step 3: Build the web app

Use the attached `aion2-route-template.html` as the structural and visual reference. It was built for an Asmodian Assassin; replace all of its data (quests, hideouts, regional quests, skills, rotation, unlocks) with researched data for my faction and class. Keep these features:

- **Left rail:** progress ring; "Where you are" with a main-quest input (autocomplete from the full main-quest list; picking one sets my level and shows the next quest) and a level slider; a clickable stop-point track showing next / cleared / missed; a short map summary of zones by level.
- **Top of the right column:** a card with "Next skill upgrade" (the single next purchase for my level, tickable) and "Current rotation" (only skills I have at my level; stigma skills marked; label any order that's your inference). "Next skill upgrade" must follow exactly the same order as the stop points (earliest stop point first, then position within it), and ticking it ticks the matching stop-point line. Include a "Wisdom Stones used" box. The card computes points to spend = points from character level (use Wikily's leveling table, which lists cumulative skill points per level: e.g. 24 at Lv 12, 28 at Lv 13, 203 at Lv 45; it matched the game's "Points Earned") + stones used − cost of every ticked skill line, puts the box at the top right of the card (no explanation text), shows a tick box only when I can afford the next upgrade, and otherwise says how many more points it needs; when everything unlocked at my level is bought it says to save for the next unlock and what it costs. Add a "Match my skill levels to the game" panel: I type each skill's current level and it ticks/unticks the skill lines to match (the game is the source of truth; verify the cost table by checking that my levels add up to the game's "Points Used").
- **Areas card** (left rail, under the one-time clears totals): an area picker; for the chosen area, list its one-time Strongholds, hideouts and regional quests (sorted by recommended level, ones above my level dimmed with their level shown), each with a checkbox. Look up every hideout's area on its allthings.how map page (spot-check a few). Put anything without a documented area under "Area not documented yet". Strongholds go here too, not in stop points: list every named one (no published levels, so no level badge and never dimmed) and keep a +/− counter in One-time clears for unnamed ones, so the total = ticked named + counter.
- **Stop points:** one collapsible card per key level, each holding only what unlocks or becomes worth doing at that level: a one-line summary per kind of one-time content for that level ("Hideouts (Lv 15): 3 / 11 cleared" with a "Show in Areas" button; these still count toward the stop point and its "missed" check), Stigma slots with the unlock quest, system unlocks, and the skill upgrades that opened since the previous stop, in priority order with point costs and "pick specialty" lines (no heading above them). Add small skill-only stop points where a long gap would delay a key skill tier.
- **Starter icons:** I've attached item icons named after their items (`enhance-stone.png`, `wisdom-stone.png`, `daevanion-crystal.png`). The file names are correct; upload them to the artifact's asset store right after the first publish and use them.
- **Item links and icons:** every in-game item name links to its Metabot item page (metabot.gg/en/aion-2/items/<slug>). Artifacts can't load images from other sites, and you can't download them, so for icons: give me the item page links, I save the icons and attach them, you **ask me which file is which (or have me name the files) before uploading**, then upload them to the artifact's own asset store (the `assets` capability) and show each icon on the right of any step that names the item, sized to that step's text height, with no caption. At each check-in, list items on my current steps that still lack an icon, with their links.
- **F2P:** if I'm free-to-play, tag steps that need real money "Paid" and free steps with an optional paid upgrade "Paid option" and add a short F2P notes card (Kina is the bottleneck; cash shop is cosmetic; premium Daeva Pass is paid).
- **Route rules:** short standing rules only (build plan and stat priority, story pace, daily/weekly habits once unlocked, "don't spend yet").
- **Tooltips:** a small "i" button on every game term, opening a full-width explainer underneath. Assume I don't know the term or where to find it; give UI steps only when a source gives them, otherwise say the location isn't documented. Show the source in each tooltip.
- **Confidence panel and Sources list** at the bottom: what's cross-checked, single-source, inferred and unknown.
- Three toggles: hide fully cleared stop points, hide ticked items, and hide paid steps (only steps that themselves need real money carry an amber "Paid" tag; those disappear and stop counting toward their stop point, progress and the "missed" check. Free steps that merely mention an optional paid upgrade get a grey "Paid option" tag instead and are never hidden); expand/collapse all; a two-click reset; progress saved in the browser; works at phone width.

Before publishing, syntax-check the script and confirm every stop point's items unlock at or before that stop point's level.

## Step 4: After it's built

Tell me in a few lines what's in it, what's unverified, and one thing to test in-game. When I report my level, quest, or something that doesn't match the game, update the same artifact rather than making a new one, and re-verify anything I flag against a source before changing it.

**Check-ins:** when I tell you my current main quest or level, look at the steps I'm on and tell me: what to do next, anything I may have missed from earlier stop points, whether early resources I'm expecting (Wisdom Stones, Enhance Stones) should actually exist yet, and any items on those steps that still need an icon (with links). When I upload screenshots, read them and answer from what the game shows.
