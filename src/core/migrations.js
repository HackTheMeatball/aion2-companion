/* Load-time steps (0.2 P3, pure: no DOM, no storage), in load order (docs/ARCHITECTURE.md §1). Each one-time step runs
   behind its own flag, only adds (copies or ticks), and leaves old data in place, so older builds still read the save.
   store() is called exactly where the page wrote the save before this moved here (the page passes its storeState). */
import { MIG_V5 } from "../data/migrations.js";
import { GATES } from "../data/milestones.js";
import { QUESTS } from "../data/story.js";
import { STIGMA_PLAN } from "../data/build.js";
import { char } from "./state.js";
import { SAVE_SCHEMA, stamp } from "./sync.js";

/* E1: copy checks / started / areaRun from the old position keys to rq: / sd: keys (old keys stay). */
export function migrateV5(s) {
  if (s.migV5) return false;
  const c = char(s);
  ["checks", "started", "areaRun"].forEach(f => { const o = c[f]; if (!o) return; Object.entries(MIG_V5).forEach(([a, b]) => { if (a in o && !(b in o)) o[b] = o[a]; }); });
  s.migV5 = true; return true;
}

export function migrate(s, hadSave, store, now = 0) {
  const c = char(s);
  /* A fresh browser: the one-time player seeds below are for the saved progress that predates them, so they're marked
     done without running; cleared milestones start folded (Filters → Cleared milestones). Existing saves keep their settings. */
  if (!hadSave) { s.seedLv12 = s.stTriniel1 = s.dvReset1 = true; s.hideCards = true; }
  if (migrateV5(s) && hadSave) { store(); }
  /* PLAYER-SEED-START: one-time sync to skill levels reported in game (Oct 10, Lv 12). Runs once per saved progress. */
  if (!s.seedLv12) {
    const lv = { "Quick Slice": 4, "Savage Roar": 5, "Shadowstrike": 5, "Ambush": 5, "Heart Gore": 3, "Exploit Weakness": 4, "Rear Smite": 2, "Insignia Explosion": 1 };
    Object.entries(lv).forEach(([n, v]) => { for (let L = 2; L <= 10; L++) c.checks[`sp:${n}:${L}`] = L <= v; });
    c.stones = 2; c.level = Math.max(c.level || 1, 12); s.seedLv12 = true;
    store();
  }
  /* One-time: the player reported Triniel's Dagger learned and equipped (Oct 12, Lv 23), so Stigmas are unlocked too. */
  if (!s.stTriniel1) {
    GATES.forEach(g => g.items.forEach(it => { if (it.stig === 1) c.checks[it.k] = true; }));
    c.checks["g22:0"] = true; c.stLv = Object.assign({ "Triniel's Dagger": 1 }, c.stLv || {}); s.stTriniel1 = true;
    store();
  }
  /* One-time board reset: the player re-enters board data from scratch. */
  if (!s.dvReset1) { delete c.dvTotal; delete c.dvCost; delete c.dvPts; delete c.crystals; Object.keys(c.checks).forEach(k => { if (k.startsWith("dv:")) delete c.checks[k]; }); s.dvReset1 = true; store(); }
  /* PLAYER-SEED-END */
  /* An equipped slot keeps the stigma it was equipped with, even if the plan's order changes later. */
  GATES.forEach(g => g.items.forEach(it => { if (it.stig && c.checks[it.k] && !(c.stPick || {})[it.stig]) { c.stPick = c.stPick || {}; c.stPick[it.stig] = STIGMA_PLAN[it.stig - 1]; } }));
  /* E4 one-time (eputSync1): slots already marked equipped get their "Put X on E" step ticked; before E4 nothing ticked
     it, so Lv 27/32/37 stayed "Missed". Only adds ticks; nothing is renamed or removed. */
  if (!s.eputSync1) {
    const all = GATES.flatMap(g => g.items);
    all.forEach(it => { if (!it.stig || !c.checks[it.k]) return; const e = all.find(x => x.eput === it.stig); if (e) c.checks[e.k] = true; });
    s.eputSync1 = true; if (hadSave) { store(); }
  }
  /* "Turned in" on the last covered quest is remembered (storyEnd); once later quests are added, move on to the next. */
  if (c.storyEnd && c.storyEnd === c.quest) { const i = QUESTS.findIndex(([, n]) => n === c.quest); if (i >= 0 && i < QUESTS.length - 1) { c.quest = QUESTS[i + 1][1]; delete c.storyEnd; store(); } }
  /* 5c one-time (stampV1): save schemaVersion 1 and per-item change times (mt). What the save already holds is stamped
     with time 0 (unknown; an imported export's savedAt when it has one, N1), so it never outranks a dated change. Writes
     nothing: the stamps go out with the next save (the stored save, and so golden's record, stay as they were).
     Later loads re-stamp, with the page's time, whatever a build without times changed (rollback re-stamp). */
  if (!s.stampV1) { s.stampV1 = true; s.schemaVersion = Math.max(+s.schemaVersion || 0, SAVE_SCHEMA); stamp(c, s.savedAt ? Math.floor(s.savedAt / 1000) : 0); }
  else stamp(c, now);
}
