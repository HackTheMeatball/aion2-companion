/* Sealed Dungeon zones, Empyrean Traces and clear rewards for the Dungeons & Strongholds card.
   Moved out of src/main.js unchanged (0.2 P2). Every export is still a page global (scripts/build.mjs). */
/* Hideout areas: allthings.how map pages (spot-checked). Quest areas: allthings.how regional quest list. */
export const HIDEOUT_AREA = {
  /* zones from Metabot's Altgard dungeon table */
  "Lost Ruins": "Nameless Cemetery", "Fafnite Storage Room": "Sanctum Outpost",
  "Abandoned One's Grave": "Nameless Cemetery", "Dratona Cave": "Dredgion Crash Site", "Dusk Pit": "Calderon Canyon",
  "Hidden Vein Cave": "Nameless Cemetery", "Old Graveyard": "Nameless Cemetery", "Ossuary of the Noble": "Nameless Cemetery",
  "Poisonous Plant Habitat": "Nameless Cemetery", "Smuggler's Cave": "Calderon Canyon", "Treasure Hunter's Residence": "Dredgion Crash Site",
  "Trickster's Den": "Dredgion Crash Site", "Valka's Nest": "Dredgion Crash Site", "Watcher's Temporary Outpost": "Calderon Canyon",
  "Abandoned Archon Jail": "Moslan Forest", "Bloodsoaked Confessional": "Moslan Forest", "Blue Dragon's Trap": "Sanctum Outpost",
  "Fanatics' Den": "Sanctum Outpost", "Fortuneteller's Grave": "Moslan Forest", "Homish's Prison Compound": "Sanctum Outpost",
  "Howling Den": "Moslan Forest", "Library of Foresight": "Moslan Forest", "Prison of Oblivion": "Moslan Forest", "Victims' Cave": "Moslan Forest",
  "Abandoned Memorial Room": "Uruthumheim", "Closed Hideout": "Uruthumheim", "Destroyed Scriptorium": "Purifying Forest",
  "Lamnah Base": "Purifying Forest", "Predator's Lair": "Purifying Forest", "Unstable Cave": "Purifying Forest", "Worshiper's Underground Cave": "Uruthumheim",
  "Dark Root Cave": "Dranactus", "Drana Depository": "Dranactus", "High Priest's Ruins": "Dranactus", "Skurv Laborer Den": "Dranactus", "Twisted Pit": "Dranactus",
  "All-Curing Cave": "Battlescar Mound", "Dratona Assembly Area": "Basfelt Ruins", "Final Haven": "Battlescar Mound", "Insectoid Tunnel": "Basfelt Ruins",
  "Library of Patience": "Basfelt Ruins", "Library of Wisdom": "Basfelt Ruins", "Rift Fissure": "Battlescar Mound",
  "Destruction Archons Armory": "Eastern Gribade Highland", "Empty Cave": "Western Gribade Highland", "Fungie Habitat": "Eastern Gribade Highland",
  "Lonely Rock Chasm": "Western Gribade Highland", "Odylium Marauder Den": "Eastern Gribade Highland", "Pirate's Treasure Storage": "Idun's Lake",
  "Place of Rest": "Black Claw Village", "Rock Cave": "Eastern Gribade Highland", "Scale Altar": "Western Gribade Highland", "Shulak Cave": "Western Gribade Highland",
  "Ascetic's Cave": "Impetusium Square", "Den of Exiles": "Black Claw Village", "Kumbahum's Cave": "Black Claw Village", "Lagta Fafnite Storage": "Lagta Fortress",
  "Spider Cave": "Fafnite Deposit", "Tayga Breeding Ground": "Black Claw Village", "Warriors' Rest": "Impetusium Square",
};
export const NO_AREA = "Area not documented yet";
/* Empyrean Traces per zone (Metabot's Altgard trace map). Shown as a route hint on each zone header, not tracked:
   there are 560 and the game's own collection log already counts them. */
export const ZONE_TRACES = { "Impetusium Square": 54, "Immortal Isle": 40, "Black Claw Village": 35, "Moslan Forest": 32, "Basfelt Ruins": 30,
  "Purifying Forest": 29, "Nameless Cemetery": 28, "Dranactus": 25, "Lagta Fortress": 22, "Sanctum Outpost": 21, "Spirit Isle": 19,
  "Dredgion Crash Site": 19, "Battlescar Mound": 18, "Uruthumheim": 16, "Western Gribade Highland": 14, "Fafnite Deposit": 12,
  "Eastern Gribade Highland": 12, "Idun's Lake": 11, "Silent Hill": 11, "Calderon Canyon": 8, "Tranein Highland": 6 };
export const SD_REWARD = "2 Crystals · 2 Wisdom Stones";
export const SH_REWARD = "2 Noble Belt Enhance Scrolls";
