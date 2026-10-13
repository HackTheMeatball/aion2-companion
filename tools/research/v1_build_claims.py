import json, sys

S = {
 "atp_skills": "https://allthings.how/?p=215236",
 "tgw_skills": "https://thegameswiki.com/aion-2/wiki/skills-and-specialties",
 "gpt_skills": "https://gameplay.tips/guides/aion-2-skills-guide-active-passive-and-stigma.html",
 "exitlag": "https://www.exitlag.com/blog/aion-2-complete-character-progression/",
 "tgw_duty": "https://thegameswiki.com/aion-2/wiki/duty-quests",
 "neon_duty": "https://neonsect.com/aion-2/aion-2-level-45-duties/",
 "gg_check": "https://games.gg/aion-2/guides/aion-2-daily-weekly-checklist/",
 "keen_check": "https://www.keengamer.com/articles/guides/aion-2-daily-and-weekly-checklist-what-to-do-before-each-reset/",
 "keen_lvl": "https://www.keengamer.com/articles/guides/aion-2-leveling-progression-guide-level-1-to-endgame/",
 "mein_check": "https://mein-mmo.de/en/aion-2-daily-weekly-checklist-perfect-start,1589979/",
 "mein_mist": "https://mein-mmo.de/en/aion-2-11-mistakes-you-must-definitely-avoid-at-launch,1586538/",
 "mein_lvl": "https://mein-mmo.de/en/leveling-up-quickly-in-aion-2-how-to-gather-as-much-xp-as-possible-for-the-maximum-level-45,1585756/",
 "mein_macro": "https://mein-mmo.de/en/aion-2-macro-this-trick-instantly-increases-your-damage-while-you-only-hold-down-2-keys,1590032/",
 "mein_dv": "https://mein-mmo.de/en/aion-2-arkana-daevanion-pet-you-need-to-understand-and-master-these-3-systems,1589883/2/",
 "atp_sh": "https://allthings.how/?p=234622",
 "atp_supply": "https://allthings.how/?p=234744",
 "atp_sealed": "https://allthings.how/?p=244925",
 "atp_sealedmap": "https://allthings.how/aion-2/map/library-of-wisdom/",
 "hub_1025": "https://aion2hub.com/leveling/elyos-levels-10-25",
 "fandom_belt": "https://fandomwire.com/aion-2-noble-belt-enhance-scroll-how-to-upgrade/",
 "pn_belt": "https://www.playnews.gg/en/guides/aion-2-belt-of-nobility-how-to-get-it-and-upgrade-it",
 "atp_traces": "https://allthings.how/aion-2/map/empyrean-traces/",
 "mb_traces": "https://metabot.gg/en/aion-2/map/altgard/empyrean-traces",
 "pn_traces": "https://www.playnews.gg/en/guides/empyrean-traces-feathers-in-aion-2-how-to-find-use-and-hide-them-from-the-map",
 "selphie_traces": "https://selphie1999gaming.com/game-guides/aion-2/aion-2-empyrean-traces-how-to-use-empyrean-feathers/",
 "gf_asc": "https://gamesfuze.com/guides/aion-2-ascension-trial-guide/",
 "tgw_asc": "https://thegameswiki.com/aion-2/wiki/ascension-trial",
 "gg_krao": "https://games.gg/aion-2/guides/aion-2-krao-cave-expedition/",
 "tgw_krao": "https://thegameswiki.com/aion-2/wiki/krao-cave",
 "mb_shugo": "https://metabot.gg/en/aion-2/events/shugo-festival",
 "gf_shugo": "https://gamesfuze.com/guides/aion-2-shugo-festival-guide-how-keys-work-best-rewards-and-when-to-spend-them/",
 "pn_econ": "https://www.playnews.gg/en/guides/aion-2-how-the-economy-works-kina-quna-marketplace-and-15-subscription",
 "gg_money": "https://games.gg/aion-2/guides/aion-2-monetization-explained/",
 "mop_money": "https://massivelyop.com/2026/07/08/aion-2-releases-monetization-plan-with-optional-15-sub-battle-pass-cash-shop-and-founder-packs/",
 "gf_cur": "https://gamesfuze.com/?p=91059",
 "tgw_hero": "https://thegameswiki.com/aion-2/wiki/hero-quests",
 "story_json": "data/story.json (Metabot quest DB: mirror-of-greed)",
 "mb_class": "https://metabot.gg/en/aion-2/classes/assassin",
 "gg_asn": "https://games.gg/aion-2/guides/aion-2-assassin-build-guide/",
 "gf_asn": "https://gamesfuze.com/guides/aion-2-assassin-build-best-skills-stigmas-and-rotation/",
 "mb_stats": "https://metabot.gg/en/aion-2/stats",
 "pn_macro": "https://www.playnews.gg/en/guides/aion-2-macros-how-to-set-them-up-and-optimize-their-use",
 "tgw_dv": "https://thegameswiki.com/aion-2/wiki/daeva-system-and-daevanion-board",
 "gw_dv": "https://gamewith.ai/aion2/en/daevanion-planner/assassin",
 "mb_dv": "https://metabot.gg/en/aion-2/daevanion",
 "mb_dvguide": "https://metabot.gg/en/aion-2/guides/daevanion-guide (via R3 data/build.partial.notes.txt)",
 "mb_dunguide": "https://metabot.gg/en/aion-2/guides/dungeon-guide (via R3 data/build.partial.notes.txt)",
 "mb_fang": "https://metabot.gg/en/aion-2/quests/in-the-fang-legions-name",
}
def src(k, q): return {"url": S[k], "quote": q}

C = []
def add(id, lines, claim, verdict, sources, action, newText=None, note=None, edits=None):
    o = {"id": id, "lines": lines, "claim": claim, "verdict": verdict, "sources": sources, "action": action}
    if newText is not None: o["newText"] = newText
    if edits: o["edits"] = edits
    if note: o["note"] = note
    C.append(o)

add("C01", [1668, 2162, 1834], "Respec is free until Lv 31, Kina after.", "disputed",
 [src("atp_skills", "Resets are free and unlimited"), src("exitlag", "You can reset all skills for free anytime during leveling"),
  src("tgw_skills", "points already spent can be refunded for a fee")],
 "rewrite", "Respec is free while you level; check the reset button's cost at 31.",
 note="No source found that names Lv 31 as a cutoff (MeinMMO, the guide's original source, was not re-found). Line 1834 tooltip already states the dispute correctly and can stay.",
 edits=[{"line": 1668, "old": "Respec is free until Lv 31.", "new": "Respec is free while you level; check the reset button's cost at 31."},
        {"line": 2162, "old": "<b>Experiment freely until 31.</b> ${T(\"Respec is free\", \"respec\")} until then; lock in the build by 31.",
         "new": "<b>Experiment freely.</b> ${T(\"Respec is free\", \"respec\")} while you level; check its cost at 31 before you rely on it."},
        {"line": 1834, "old": "(tooltip body)", "new": "keep as is"}])

add("C02", [1668], "Each skill gains one level every 3 character levels after you learn it.", "unverifiable",
 [src("atp_skills", "Skill points arrive automatically as your character levels"),
  src("tgw_skills", "mastery skills are learned automatically when the character reaches the required level; levels beyond 10 come from items, Arcana and Daevanion boards")],
 "drop", "",
 note="No source describes automatic skill levels per N character levels. Not marked as seen in game. Delete the sentence.",
 edits=[{"line": 1668, "old": "Each skill gains one level every 3 character levels after you learn it. ", "new": ""}])

add("C03", [1726], "Specialty slots open at skill level 8 / 12 / 20.", "verified",
 [src("tgw_skills", "one specialty slot at level 8 ... a second slot at level 12 ... a third slot at level 20"),
  src("gpt_skills", "Level 8: one slot is unlocked; Level 12 unlocks the fourth perk and a second slot; Level 20 unlocks the third slot"),
  src("atp_skills", "The first arrives at level 8, the second at level 12, and the third at level 16, with further slots ... at level 20")],
 "keep", note="allthings.how alone puts the third slot at 16; thegameswiki and gameplay.tips (plus Metabot per the guide) agree on 20.")

add("C04", [2166], "Hero quests are ~99% of Asmodian XP to 45.", "unverifiable",
 [src("keen_lvl", "Episode quests provide most of the experience required to reach the Global launch cap"),
  src("mein_lvl", "alternatives ... yield significantly less reward than the main quest line"),
  src("tgw_hero", "Hero Quests are the AION 2 main story line")],
 "rewrite", "Hero quests give most of your XP to 45.", note="'Most' has 2 sources; no source gives a percentage.")

add("C05", [2108], "'The One Who Witnesses the Nightmare' recommended 45; 'The One Who Swears the Oath' recommended 49; both from Asahr.", "verified",
 [src("tgw_hero", "The One Who Witnesses the Nightmare: Path of Ascension IV, Level 45; The One Who Swears the Oath: Path of Ascension V, Level 49; every step given by Asahr at the Dream Crossroad")],
 "keep", note="Second source is Metabot's quest DB (the guide's original source). '(so expect it to need gear)' is inference but reads as such; keep.")

add("C06", [2111], "Ascension Trial: reach item level 1,500 before reset; at reset run it at 1,000.", "verified",
 [src("gf_asc", "Easy: 1,000; Normal: 1,500 ... leave your Ascension Trial runs until later in the week when possible"),
  src("tgw_asc", "Easy requires 1,000 and Normal requires 1,500"),
  src("mein_mist", "Reaching item level 1,500 gives access to normal difficulty with better rewards")],
 "rewrite", "<b>Ascension Trial timing.</b> Easy needs item level 1,000, Normal 1,500. Run your 3 weekly entries late in the week, after you've raised your item level.",
 note="Numbers verified (3 sources). Rewrite states them as entry levels and uses GamesFuze's timing advice; 3 entries/week per thegameswiki, games.gg, KeenGamer.")

add("C07", [2112], "Abyss Points on Potential Stones, Stigma Shards and Daevanion resources, not a shop gear set.", "single-source",
 [src("keen_lvl", "spend them on Potential Stones, Stigma Shards, Daevanion resources, and amulet-related upgrades ... Do not follow old advice telling you to immediately purchase an entire Abyss equipment set"),
  src("keen_check", "Spend your Abyss Points on Stigma Shards first"),
  src("gf_cur", "Its main use is to purchase items from the Battlefield Trade Shop ... Stigma Shards ... powerful gear that's exclusive to that shop")],
 "rewrite", "<b>Abyss Points:</b> Stigma Shards first, not a full Abyss gear set (KeenGamer's advice; one source).",
 note="Both KeenGamer articles are one outlet. GamesFuze confirms Stigma Shards are sold for AP but gives no priority.")

add("C08", [2113, 1641], "Conquest / Krao Cave Normal needs gear score 700.", "verified",
 [src("gg_krao", "Conquest: Level 45. Item level: 700. Party: 1-5 players"),
  src("tgw_krao", "Conquest Normal: level 45, item level 700 in the game data. A June 2026 player-compiled table lists 1,000")],
 "rewrite", "<b>At 45:</b> Krao Cave Conquest needs item level 700.",
 note="Sources call it item level, not gear score. Also replace 'gear score' in line 2113.",
 edits=[{"line": 1641, "new": "<p><b>At 45:</b> Krao Cave Conquest needs item level 700.</p>"},
        {"line": 2113, "new": "<b>Start Conquest</b> (Krao Cave tier, item level 700). Weapon first, then your weakest slots."}])

add("C09", [2109, 1845], "Shugo Festival keys are worth far more at 45, so skip it while leveling.", "wrong",
 [src("mb_shugo", "Maximum stored: 12, or 21 with a membership. Refill: +3 per day ... the reward-key package rises from 2 to 3 Soul Codex and from 600 to 800 Abyss Points [at 45]; holding out would leave you at the cap"),
  src("gf_shugo", "a maximum of 12 keys (21 if you have a subscription) ... the rewards you get will improve as your character progresses ... keys are wasted if you sit at the cap"),
  src("gg_check", "New ones stop accumulating once you hit the cap"),
  src("mein_mist", "The more keys you have available when reaching maximum level 45, the better")],
 "rewrite", "<p>An hourly set of minigames. Claiming a reward costs a key, and rewards grow with your level. Keys refill daily but stop at a cap, so spend them before you hit it.</p>",
 note="Only MeinMMO says to save; the cap (Metabot, GamesFuze, games.gg, KeenGamer) means saving wastes refills, and Metabot shows the Lv 45 gain is small. Cap/refill numbers differ (12 and +3/day vs 14 and +2/day), so leave numbers out. Drop line 2109 'Spend your banked Shugo Festival keys.'",
 edits=[{"line": 1845, "new": "<p>An hourly set of minigames. Claiming a reward costs a key, and rewards grow with your level. Keys refill daily but stop at a cap, so spend them before you hit it.</p>", "src": "Metabot, GamesFuze, games.gg"},
        {"line": 2109, "action": "drop"}])

add("C10", [2090], "Story dungeon around Lv 37.", "verified",
 [src("story_json", "Mirror of Greed (Lv 37): Go to the Fire Temple Entrance — talk to Trekhi || Investigate the Fire Temple — complete the Fire Temple investigation || Turn in — Crobakhi, Steel Hammer Merchants HQ")],
 "rewrite", "<b>Lv 37 story instance:</b> \"Mirror of Greed\" sends you into the Fire Temple. If it stops you, enhance your weapon first; otherwise keep saving.",
 note="Metabot quest DB field (accepted). The weapon advice is the guide's own; it is kept because it only says what to do if blocked.")

add("C11", [1852], "Expeditions pay rewards 7x per dungeon each week; Conquest opens at 45.", "disputed",
 [src("keen_check", "Exploration: 7 reward counts per Expedition dungeon each week"),
  src("mb_dunguide", "7/week exploration"),
  src("gg_krao", "weekly final boss kill limits have since been removed"),
  src("tgw_krao", "weekly reward and kill limits were removed on July 1, 2026 (KR/TW)"),
  src("gg_krao", "Conquest: Level 45")],
 "rewrite", "Rewards have a weekly cap per dungeon (7 on Metabot and KeenGamer); check the count in game.",
 note="Conquest at 45 verified (games.gg, thegameswiki). The 7/week cap is from two sources but KR/TW removed it in July 2026 and games.gg says it's gone. Replace the clause 'and pays rewards 7 times per dungeon each week' with the newText sentence. Urugugu/Fire Temple levels are R3's.")

add("C12", [1840], "Sealed Dungeon first clear: 15,000 Kina, 1,250 Enhance Stones, 2 Daevanion Crystals, 2 Wisdom Stones, wing materials, statue scraps, title; one-time.", "verified",
 [src("hub_1025", "every first clear pays the same on Global: 15,000 Kina, 1,250 Enhance Stones, 2 Daevanion Crystals ... Each hideout is still a one-time clear (no reset)"),
  src("atp_sealed", "Every single clear hands you: 15,000 Kina, 1,250 Enhance Stone, 2 Daevanion Crystal (Bound), 2 Wisdom Stone (Bound), 1 unique title ... a solo instance you enter, clear once"),
  src("atp_sealedmap", "Clearing the dungeon pays 15,000 Kina and 1,250 Enhance Stone, plus 2 each of Sealed Wing Featherdown (Bound), Statue Scrap ... Daevanion Crystal (Bound) and Wisdom Stone (Bound)")],
 "keep", note="R2 data/dungeons.json shows the same 2+2/15,000/1,250 on Metabot pages per band.")

add("C13", [1842], "Stronghold pays 2 Noble Belt Enhance Scrolls + 15,000 Kina (some a title); belt scrolls come from nowhere else.", "disputed",
 [src("hub_1025", "Each fort is a one-time clear (no reset) and pays out 15,000 Kina and 2 Noble Belt Enhance Scrolls"),
  src("atp_sh", "rewards two Noble Belt Enhance Scrolls plus 15,000 Kina on completion ... Many players also pick up extra scrolls from green quests and map question marks"),
  src("fandom_belt", "two Noble Belt Enhance Scrolls upon completion ... only the 15 Strongholds in your character's home region will give you Noble Belt Enhance Scrolls"),
  src("pn_belt", "obtained only by clearing the world's Garrisons")],
 "rewrite", "That pays 2 Noble Belt Enhance Scrolls and 15,000 Kina (some add a title). Strongholds are the main source of belt scrolls, and the belt is permanent, so clear every one.",
 note="Rewards verified (3 sources). 'Nowhere else': AION2HUB and PlayNews say only Strongholds; allthings.how reports extras from green quests and '?' markers. Replace the two sentences starting 'That pays'.")

add("C14", [1844], "Most regional quests unlock at Lv 10.", "single-source",
 [src("mb_fang", "Rec. level 22; Unlocks at 10")],
 "keep", note="Metabot DB field (accepted). R1's data/rq.json unlocksAt for all 58 settles the 'most'; E2 should recount from it.")

add("C15", [1846, 2177], "Duty Quests: Lv 45, 5 a day per server, reroll; rewards AP, Kina, Enhancement Stones, Hidden Cube keys, gear parts.", "verified",
 [src("tgw_duty", "On the global service Duties open at level 45 ... 5 a day, reset daily"),
  src("neon_duty", "Duties open at Level 45"),
  src("gg_check", "You get five per day, and that limit is server-wide"),
  src("keen_check", "Duty Missions: 5 paid completions a day (Shared Server-Wide Limits)"),
  src("mein_check", "you can complete 5 Duty Quests per day (only with one character per server)"),
  src("atp_supply", "A Duty mission's base payout is 2,000 Abyss Points, along with Kina, plus one to five random bonus items")],
 "rewrite", "<b>${T(\"Duty Quests\", \"duty\")}</b> (Lv 45): 5 rewarded a day, shared by every character on the server, from the Journal's Duty tab (J).",
 note="Lv 45, 5/day and server-wide are verified. Reroll appears only in thegameswiki (KR/TW section); 'gear parts' has no source. Tooltip newText below drops both.",
 edits=[{"line": 2177, "new": "<b>${T(\"Duty Quests\", \"duty\")}</b> (Lv 45): 5 rewarded a day, shared by every character on the server, from the Journal's Duty tab (J)."},
        {"line": 1846, "new": "<p>Daily missions in the Journal's Duty tab (J). They open at <b>Lv 45</b> on the global servers, not before. 5 rewarded completions a day, shared by every character on the server.</p><p>Rewards include Abyss Points, Kina, Enhancement Stones and Hidden Cube keys. Not the same system as Supply Requests (Lv 25).</p>",
         "src": "thegameswiki, neonsect, games.gg, KeenGamer, MeinMMO, allthings.how"}])

add("C16", [1847, 2176], "Supply Requests: Lv 25; Emergency daily, weekly and season requests; buy only under ~100 Kina/AP on the Market (Inven); 380-6,000 AP per hand-in and not counting toward AP caps (unconfirmed).", "single-source",
 [src("atp_supply", "four tabs: Emergency, Weekly, Regular: Craft, and Regular: Boss ... each delivery pays between 380 and 6,000 Abyss Points"),
  src("keen_check", "a daily board with a 24-hour delivery deadline and a weekly board with a Wednesday delivery deadline"),
  src("gg_check", "There are daily, weekly, and longer-term request categories"),
  src("mein_check", "Emergency Supply Requests ... Weekly Supply Requests are the weekly variant")],
 "rewrite", "<p>Opens at <b>Lv 25</b>. You hand in requested materials or gear for <b>Abyss Points</b>. Emergency requests have a daily deadline, Weekly ones run to the weekly reset, and longer-running requests cover crafting and bosses.</p><p>Abyss Points matter mostly at 45, so while leveling hand in only spares you already have.</p>",
 note="Request types verified (4 sources). Drop the Market/Inven paragraph: the Market needs the subscription (C17), so it doesn't apply to an F2P player. Drop the 'Unconfirmed' line: 380-6,000 AP is allthings.how only and the AP-cap claim has no source. Lv 25 is the Metabot unlock table. Line 2176 keeps as is. Tooltip src: \"Metabot, allthings.how, KeenGamer, games.gg, MeinMMO\".")

add("C17", [2183], "F2P: no Marketplace or Kina/Quna exchange without the $15/month subscription.", "verified",
 [src("pn_econ", "the $15 membership opens access to the Marketplace and to the exchange between the two currencies"),
  src("gg_money", "Access to the player market ... The currency exchange (Quna to Kina and back) ... The optional membership costs $15 per month"),
  src("mop_money", "optional $15 monthly subscription ... access to the market, the Kina/Quna exchange, a subscriber-only cash shop")],
 "keep")

add("C18", [2184], "Cash shop is cosmetic; NCSoft says no stats.", "disputed",
 [src("pn_econ", "focuses on cosmetics ... no effect on stats"),
  src("gg_money", "None of these provide combat power or gear advantages ... The premium track ... delivers upgrade materials"),
  src("mop_money", "will focus on cosmetics and consumables ... do not affect gear progression or long-term power")],
 "rewrite", "<b>Cash shop is mostly cosmetic</b> (outfits, wings, pets, weapon skins); NCSoft says nothing in it affects stats. Nothing in this guide needs it.",
 note="MassivelyOP lists consumables, and the premium Daeva Pass gives upgrade materials, so 'cosmetic' alone is too strong.")

add("C19", [2179], "Weekly Command scrolls from the capital's Command vendor; no source gives an unlock level.", "verified",
 [src("gg_check", "The Command Merchant in your faction's main area sells weekly Command Missions. The server-wide limit is 12 per week"),
  src("mein_check", "you can buy up to 12 of these quests per server, sold by the command merchant in the capital")],
 "rewrite", "<b>Weekly Command missions</b> from the Command Merchant in the capital: up to 12 a week per server.",
 note="Vendor and cap verified. 'Reroll if rewards lack keys or fragments' has no source; dropped. Keep the existing note 'No source gives an unlock level.' (still true).")

add("C20", [1806, 1807, 1808, 1777], "Stat tiers: [Attack, Critical Hit, Back Attack Damage Boost] > [Accuracy, Critical Damage Boost] > [Double Chance, Combat Speed]; B/G letters.", "disputed",
 [src("mb_class", "Attack; Critical Hit; Back Attack Damage Boost; Accuracy Bonus; Evasion Bonus"),
  src("gg_asn", "Critical Hit: Highest; Multi-Hit Rate: Very High; Combat Speed: High; Mighty Hit: High; Crit Damage Boost and Back Damage Boost: High"),
  src("gf_asn", "1. Critical Hit 2. Damage Boost 3. Attack Power 4. Double Chance ... 6. Combat Speed"),
  src("mb_stats", "Double Chance and Multi-hit Chance are listed as separate stats")],
 "rewrite", "const STAT_TIERS = [[\"Critical Hit\"], [\"Attack\", \"Back Attack Damage Boost\", \"Combat Speed\"]];",
 note="Critical Hit is top in all 3. Attack (Metabot, GamesFuze), Back Attack Damage Boost (Metabot, games.gg) and Combat Speed (games.gg, GamesFuze) each have 2. Accuracy (Metabot only), Critical Damage Boost (games.gg only) and Double Chance (GamesFuze only; games.gg's Multi-Hit is a different stat per Metabot) have one each, so drop them. The guide's earlier Skycoach/Odealo rankings were not rechecked. Line 1777 newText: 'B board · G gear. Only stats two or more sources rank high; order inside a tier varies.' STAT_SRC: drop the removed keys; B/G letters come from the guide's own board data, not a web claim.",
 edits=[{"line": 1777, "new": "<p class=\"fine tline\">B board · G gear. Only stats two or more sources rank high; order inside a tier varies.</p>"},
        {"line": 1806, "new": "const STAT_TIERS = [[\"Critical Hit\"], [\"Attack\", \"Back Attack Damage Boost\", \"Combat Speed\"]];"},
        {"line": 1808, "new": "const STAT_SRC = { \"Critical Hit\": \"BG\", \"Back Attack Damage Boost\": \"G\", \"Attack\": \"BG\", \"Combat Speed\": \"BG\" };"}])

add("C21", [1790, 1791, 1792, 1793, 1794, 1795, 1796, 1797, 3383, 3384, 3385, 3386, 3387, 3388, 3389, 3390], "Rotation and key setup: macro path, 10 ms delay, bottom row fires first, skipped if not ready, Quick Slice alone (would block a stack), hold both clicks, row/E order marked inference.", "verified",
 [src("pn_macro", "Esc > Settings > Key Settings, General tab, then the Gameplay section ... Macro; K ... click the Macro button at the top right, click Add Macro ... tries to use the lowest skill in the stack, in a loop ... keep your basic skill key held down"),
  src("mein_macro", "Key Settings / General / Gameplay ... The skill with the highest priority goes at the very bottom ... any skill above would never be used [if a no-cooldown skill sits below] ... holding down both keys at the same time")],
 "rewrite", "<li><b>Make the macro:</b> K → Macro (top right) → Add Macro. Step 1 = Quick Use 2 (the right-click stack). If ready skills get skipped, add a short delay.</li>",
 note="Key path, Add Macro, bottom-first priority (the grid draws row 0 at the bottom), no-cooldown blocking and holding both buttons all have 2 sources. Only the '10 ms' / '30-50 ms' delay values have no source; the rewrite drops them. 'Quick Use 2' is not in either source; keep it only if it came from his game. Row order and E order are already labelled as inference; keep.",
 edits=[{"line": 1792, "new": "<li><b>Make the macro:</b> K → Macro (top right) → Add Macro. Step 1 = Quick Use 2 (the right-click stack). If ready skills get skipped, add a short delay.</li>"}])

add("C22", [1836, 1837, 2110], "Board node costs: grey stat 1, green passive 2, blue active 3, orange corner 4 (+1.5%); Azphel paid with Azphel points from PvP shops.", "verified",
 [src("gw_dv", "1 for common, 2 for rare, 3 for epic and 4 for unique nodes"),
  src("mb_dvguide", "stat 1 (rare 2), active 3, passive 2, corner 4 (+1.5%); Azphel: Azphel currency, 0 skill nodes"),
  src("tgw_dv", "Azphel crystal is made by Material Conversion from 10 Fragment: Azphel's Trace and 5 Odyle ... also sold in the Abyss shop for Abyss Points"),
  src("mein_dv", "Fragments are earned through victorious participation in the weekly battleground ... Some crystals can also be bought with Abyss Points")],
 "rewrite", "<b>Azphel ${T(\"Daevanion board\", \"daevanion\")} opens.</b> Stat nodes only, paid with Azphel crystals (from battleground fragments or Abyss Points), not Daevanion Crystals.",
 note="Node costs verified (Metabot guide, gamewith, plus Metaroad); the gamewith grade-to-colour match (common grey, rare green, epic blue, unique orange) is an assumption. Azphel is paid with its own Azphel crystals, not 'Azphel points'; 'arena' has no source. Also change tooltip line 1836's last sentence.",
 edits=[{"line": 2110, "new": "<b>Azphel ${T(\"Daevanion board\", \"daevanion\")} opens.</b> Stat nodes only, paid with Azphel crystals (from battleground fragments or Abyss Points), not Daevanion Crystals."},
        {"line": 1836, "old": "Azphel has no skill nodes and uses Azphel points from PvP shops instead.", "new": "Azphel has no skill nodes and uses its own Azphel crystals (from battleground fragments or Abyss Points) instead."}])

add("C23", [2010], "Belt and amulet to +10 (Rare) cost about 232,000 Kina and 9,280 stones each; Substance Morph moves one up a tier, resets to +0; Lv 45 Kina sink.", "single-source",
 [src("fandom_belt", "Rare: 9,280 Enhance Stones and 232,000 Kina ... use Substance Morph to transform it into the next rarity tier"),
  src("atp_sh", "Rare: 232,000 Kina and 9,280 Enhance Stones ... A successful morph resets the belt to +0 with higher base stats")],
 "rewrite", "The belt to +10 (Rare) costs 232,000 Kina and 9,280 Enhance Stones. Substance Morph then moves it up a rarity tier.",
 note="Belt costs verified (2 sources). No source gives the amulet's cost, so 'each' is dropped. '+0 reset' is allthings.how only; 'Lv 45 Kina sink' is inference. Both dropped.")

add("C24", [1991], "Noble Belt enhance success is 100%.", "verified",
 [src("fandom_belt", "Enhancement attempts have a 100% success rate"),
  src("atp_sh", "Each enhancement attempt has a 100% success rate")],
 "keep", note="Belt only. Line 2010 also says 100% for the amulet, and no source checked here says that; check it in game.")

add("C25", [1825, 1826], "Empyrean Traces: 560 in Altgard; usable after Lv 16 'Empyrean Monolith'; Monolith at Safe Haven or Nornir Assembly; Resonance up to 30; extras become Power Shards.", "disputed",
 [src("mb_traces", "Total: 560 Empyrean Traces in Altgard, across 58 zones"),
  src("atp_traces", "Empyrean Traces also appears on the Altgard map, at 560 spots"),
  src("pn_traces", "The Monolith unlocks during the main quest 'Monolith of the Empyrean Lord' at level 16 ... Surplus feathers can be converted into Power Shards"),
  src("selphie_traces", "Once you reach level 16 and complete the Empyrean Monolith main quest ... Faction Monoliths go to max level 30 ... Extra Feathers can be converted into Power Shards")],
 "rewrite", "<p>You can carry them from the start, but you can only use them after the Lv 16 story quest \"Empyrean Monolith.\" Then go to your faction's Monolith, interact and press <b>Resonate</b>. That raises the Monolith's Resonance level (up to 30) for Amulet Enhance Scrolls, Amplify Stone fragments, titles and Soul Codex resets. Past Resonance 30, extra feathers convert to Power Shards.</p>",
 note="560, Lv 16 unlock, max 30, rewards and Power Shards all verified. No source names the Monolith locations (allthings.how lists 2, unnamed), so '(Safe Haven or Nornir Assembly)' is dropped. Line 1825 keeps as is.")

add("C26", [2405, 2406, 2407, 2408], "ZONE_TRACES per-zone counts.", "verified",
 [src("mb_traces", "Impetusium Square 54; Immortal Isle 40; Black Claw Village 35; Moslan Forest 32; Basfelt Ruins 30; Purifying Forest 29; Nameless Cemetery 28; Dranactus 25; Lagta Fortress 22; Sanctum Outpost 21; Spirit Isle 19; Dredgion Crash Site 19; Battlescar Mound 18; Uruthumheim 16; Western Gribade Highland 14; Fafnite Deposit 12; Eastern Gribade Highland 12; Idun's Lake 11; Silent Hill 11; Calderon Canyon 8; Tranein Highland 6")],
 "keep", note="Matches Metabot's map DB exactly (accepted). allthings.how differs by 1 on two zones (Black Claw 34, Moslan 31). Metabot also lists Safe Haven 25, Nornir Assembly 18 and Southern Gribade Highland 6; add them only if those zones appear as quest zones.")

add("C27", [3663], "Board total = 4 crystals per level past 11 + 1 per Daevanion Crystal (confirmed in game at 16/17).", "single-source",
 [{"url": "in-game (user, Lv 16 and 17)", "quote": "formula confirmed in game at Lv 16 and 17"},
  src("mb_dv", "Filling every node on all 5 boards costs 802 points (no per-level rate given)")],
 "keep", note="No web source gives a per-level rate (thegameswiki, Metabot planner and gamewith don't either). In-game evidence counts. The card already flags 'total less than levels alone', which catches a break. E2 could add a one-line prompt to re-check at 20/30/40. Line 1728 still calls the per-level reading Metabot's 'interpretation'; see C28h.")

# C28: Confidence card, sentence by sentence
add("C28a", [1724], "Unlock levels (client-data table, Metabot/Wikily): enhancement 9; extraction, crafting, gathering 10; Supply Request 25; daily dungeon 30; Abyss, Market, Ascension Trial, Conquest 45. Treat as one strong source.", "verified",
 [src("gf_asc", "difficulty table lists Character Level 45 for every difficulty"),
  src("gg_krao", "Conquest: Level 45"),
  src("mb_dunguide", "Daily: Daeva Bio-Research Base L30")],
 "keep", note="Metabot DB fields (accepted); Ascension Trial and Conquest 45 independently confirmed.")
add("C28b", [1725], "Stigma slots 22/27/32/37 (five sources); regional quest names and levels (allthings.how, Selphie1999).", "verified", [],
 "keep", note="Stigma slots are R3's scope; regional names and levels are R1's. Not re-fetched here.")
add("C28c", [1726], "Specialty slots at 8/12/20 (Metabot, gameplay.tips, Skycoach); leveling order from GamerBlurb; GamesFuze ranks Heart Gore first; respec free until 31.", "disputed",
 [src("tgw_skills", "slot at level 8 ... level 12 ... level 20"), src("gf_asn", "Skill level priority: 1. Heart Gore 2. Insignia Explosion ...")],
 "rewrite", "<p><b>Skill points:</b> learn levels, per-level costs and character gates from Metabot's skill pages; specialty slots at skill level 8 / 12 / 20 (Metabot, gameplay.tips, thegameswiki). Leveling order from GamerBlurb's Global build. GamesFuze's build ranks Heart Gore first instead; respec is free while you level if you want to switch.</p>",
 note="Only the respec clause changes (C01); thegameswiki added as a checked source.")
add("C28d", [1727], "From your game: 16 points to reach Heart Gore + Ambush on Nezekan.", "verified",
 [{"url": "in-game (user)", "quote": "16 points to reach Heart Gore + Ambush on Nezekan"}], "keep")
add("C28e", [1728], "Inferred skill-point order; single-source Daevanion node priority; Sealed Dungeons solo (Wikily, Metabot); disputed first nodes, core skill, passives, stigma order, stat order.", "verified",
 [src("atp_sealed", "a solo instance you enter, clear once")],
 "rewrite", "<b>Cross-checked:</b> Sealed Dungeons are solo (Metabot/Wikily: 1 player; allthings.how: solo instance).",
 note="Metabot and Wikily count as one source; allthings.how is the needed second. Stat order sentence: replace with 'Stat order (Metabot, games.gg, GamesFuze rank differently; the guide shows only stats two of them rank high).' (C20). Stigma order is R3's. Other labels are already accurate.")
add("C28f", [1728], "Daevanion points per level (Metabot calls its reading an interpretation).", "single-source",
 [{"url": "in-game (user, Lv 16 and 17)", "quote": "4 per level past 11, confirmed in game"}],
 "rewrite", "Daevanion points per level: 4 per level past 11, confirmed in your game at 16 and 17.",
 note="Matches the code comment at 3663 (C27). Move it from the 'Disputed' list to 'From your game'.")
add("C28g", [1729], "Settled: Supply Request (Lv 25) and Duty Quests (Lv 45) are separate (Inven, games.gg, GamesFuze, thegameswiki).", "verified",
 [src("tgw_duty", "On the global service Duties open at level 45"), src("neon_duty", "Duties open at Level 45"),
  src("atp_supply", "Supply ... tabs: Emergency, Weekly, Regular: Craft, Regular: Boss (separate from Duty missions)")],
 "keep")
add("C28h", [1729], "Unverified: Kibelisk and Command scroll unlock timing; exact unlock level for most regional quests.", "verified",
 [src("gg_check", "Command Merchant ... no unlock level given"), src("mb_fang", "Unlocks at 10")],
 "rewrite", "<p><b>Unverified:</b> Kibelisk and Command mission unlock timing.</p>",
 note="Regional unlock levels come from R1's Metabot pages ('Unlocks at'); drop that clause once E2 merges data/rq.json. Command vendor is now verified, but its unlock level still isn't.")

json.dump(C, open(sys.argv[1], "w"), indent=1, ensure_ascii=False)
from collections import Counter
print(len(C), Counter(c["verdict"] for c in C), Counter(c["action"] for c in C))
