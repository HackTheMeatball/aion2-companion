#!/usr/bin/env node
/* Data corrections and additions after the v2 conversion (0.2 step 5b, part 2). Applied once to the v2 data of
   commit "Data format v2: convert all data" (PR 1); kept for provenance. Every change carries its source in the data;
   the list with reasons is in the PR and in v2-corrections/changes.txt (written by this script).

   Usage: node tools/history/v2-corrections/2026-10-14.mjs

   Sources:
   - owner screens, 2026-10-14 (docs/research/2026-10-owner-unlocks.md; cited owner:2026-10-14-unlocks-NN; top authority)
   - Metabot quest / dungeon / stronghold pages, read 2026-10-14 by Data & Research: data/research/locations-metabot-2026-10.csv
     (requests logged in locations-metabot-2026-10.requests.log)
   - Metabot skill pages (specialty choices), read 2026-10-14 by this session: whirlwind-slice, infiltrate, shadow-fall,
     defiance (robots.txt and terms read first; own User-Agent; >= 6 s apart)
   - docs/feedback/2026-10-14-owner.md F3 / F4 (owner-confirmed specialty slots and choices on effective skill level)
   - docs/research/2026-10-prereq-gates.md §5, §10, §11 (aion2.th.gl re-sourcing plan, owner checks) */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const P = p => join(ROOT, 'data', p);
const files = {};
const doc = p => (files[p] = files[p] || JSON.parse(readFileSync(P(p), 'utf8')));
const recs = p => doc(p).records;
const rec = (p, id) => { const r = recs(p).find(x => x.id === id); if (!r) throw new Error(`${p}: no ${id}`); return r; };
const LOG = [];
const log = (...a) => LOG.push(a.join(' '));
const D = '2026-10-14';
const UNRECORDED = { scheme: 'client', value: 'unrecorded' };
const owner = (nn, what) => ({ owner: { ref: `owner:2026-10-14-unlocks-${nn}`, checkedAt: D, build: UNRECORDED, what } });
const isThgl = s => s && s.url && /aion2\.th\.gl/.test(s.url);
const RQ = 'shared/asmodian/regional-quests.json', SQ = 'shared/asmodian/story-quests.json', SD = 'shared/asmodian/sealed-dungeons.json',
  SH = 'shared/asmodian/strongholds.json', UN = 'shared/asmodian/unlocks.json', ZN = 'shared/asmodian/zones.json', CL = 'shared/asmodian/guide/claims.json',
  CF = 'shared/asmodian/guide/confidence.json', TP = 'shared/asmodian/guide/tips.json', MS = 'shared/asmodian/guide/milestones.json',
  SK = 'classes/assassin/skills.json', RU = 'shared/rules.json', RET = 'retired.json';
const latest = r => { const ds = []; const w = v => { if (Array.isArray(v)) v.forEach(w); else if (v && typeof v === 'object') { if ((v.url || v.owner) && v.checkedAt) ds.push(v.checkedAt); if (v.owner && v.owner.checkedAt) ds.push(v.owner.checkedAt); Object.values(v).forEach(w); } }; w(r.sources); if (ds.length) r.verifiedAt = ds.sort().slice(-1)[0]; };

/* ================================================================== 1. aion2.th.gl: re-source or label owner-check */
const atomsOf = c => !c ? [] : c.all ? c.all.flatMap(atomsOf) : c.any ? c.any.flatMap(atomsOf) : [c];
for (const q of recs(RQ)) {
  for (const a of atomsOf(q.requires)) {
    if (!a.sources || !a.sources.some(isThgl)) continue;
    const n = a.sources.filter(isThgl).length;
    a.sources = a.sources.filter(s => !isThgl(s));
    if (!a.sources.length) {
      delete a.sources; a.basis = 'owner-check';
      a.note = [a.note, 'Its only source was aion2.th.gl, withdrawn 2026-10-14 (robots.txt excludes AI agents); kept as in v1 until the owner checks it in game (prereq-gates §11 check 9).'].filter(Boolean).join(' ');
      log('th.gl', q.id, q.name, `atom ${a.done || a.story}: th.gl was the only source -> basis owner-check`);
    } else log('th.gl', q.id, q.name, `atom ${a.done || a.story}: ${n} th.gl ref(s) dropped; still backed by ${a.sources.map(s => s.url).join(', ')}`);
  }
  const before = q.sources.length;
  q.sources = q.sources.filter(s => !isThgl(s));
  if (q.sources.length !== before) log('th.gl', q.id, q.name, `record: ${before - q.sources.length} th.gl "requires" ref(s) dropped (the gate atoms carry their own sources)`);
}
{
  const c36 = rec(CL, 'C36');
  c36.sources = c36.sources.filter(s => !isThgl(s));
  c36.sources.unshift({ url: 'https://metabot.gg/en/aion-2/quests/a-daeva-dreaming-anew', quote: 'Ascend to the next dimension of power as a Daeva — complete The One Who Dreams',
    note: 'The wrapper quest: The One Who Dreams must be open by the time the story reaches it (prereq-gates §5). Re-sourced 2026-10-14 (aion2.th.gl withdrawn).' });
  c36.note = "Re-sourced to Metabot on 2026-10-14 (aion2.th.gl withdrawn): the wrapper quest A Daeva Dreaming Anew shows The One Who Dreams is open by then, so the gate is never early. Whether it opens earlier (th.gl named Last of the Destruction Archons as its prerequisite) is owner check 6 (prereq-gates §11). Gauge at 32: allthings.how + Skycoach. In-game name is 'Dream Crossroad' (Metabot).";
  const c37 = rec(CL, 'C37');
  c37.sources = c37.sources.filter(s => !isThgl(s));
  c37.sources.push({ url: 'https://metabot.gg/en/aion-2/quests/forgotten-commander', note: "Next quest: Daeva Trapped in a Nightmare, whose only objective is The One Who Witnesses the Nightmare, so Witnesses is open by the time Forgotten Commander is turned in (prereq-gates §5). Re-sourced 2026-10-14 (aion2.th.gl withdrawn)." });
  c37.note = c37.note + ' Re-sourced to Metabot on 2026-10-14 (aion2.th.gl withdrawn). Whether Witnesses opens while Forgotten Commander is still open is owner check 5 (prereq-gates §11).';
  c36.verifiedAt = c37.verifiedAt = D;
  log('th.gl', 'C36: 2 th.gl refs replaced by the Metabot wrapper quest (A Daeva Dreaming Anew); "not earlier" -> owner check 6');
  log('th.gl', 'C37: 2 th.gl refs dropped, Metabot Forgotten Commander page added (next quest = the wrapper); "not earlier" -> owner check 5');
}
{
  const t = rec(CF, 'conf:regional');
  t.text = "Regional quests: giver, Kibelisk, rewards, recommended and unlock level from each quest's Metabot page; prerequisites (an earlier regional quest or a story quest) from aion2.gaming.tools, cross-checked with allthings.how ({rqChained} follow-ups, {rqStoryGated} story-gated). Two gates with no permitted source are kept for an in-game check (Hugo Mercenaries: Deep Shadow).";
  const tip = rec(TP, 'tip:regional'); tip.credit = 'Metabot quest pages, aion2.gaming.tools, allthings.how'; tip.verifiedAt = D;
  log('th.gl', 'text: Confidence "Regional quests" and the Regional quests tip credit no longer name aion2.th.gl');
}

/* ================================================================== 2. Ishalgen is the starting map, not a story quest */
{
  const d = doc(SQ), i = d.records.findIndex(r => r.id === 'sq:2100010');
  if (i < 0) throw new Error('Ishalgen record');
  d.records.splice(i, 1);
  const v = rec(SQ, 'sq:2101010');
  v.requires = { all: [] };
  v.notes = [...(v.notes || []), 'First story quest after the tutorial (owner screen owner:2026-10-14-unlocks-21). Ishalgen, listed before it in v1, is the starting map, not a quest (owner:2026-10-14-unlocks-22).'];
  v.sources.push(owner('21', 'Journal after the tutorial: first quest "[Lv. 2] A Village in the Fog" (Meet the Village Chief, talk to Pelleir)'));
  latest(v);
  doc(RET).keys.push({ key: 'Ishalgen', retired: D, note: 'Story quest name key (state.quest / qsteps): Ishalgen is the starting map, not a story quest (owner screen owner:2026-10-14-unlocks-22). A save whose quest is "Ishalgen" reads as "no quest yet"; the key is never reused.' });
  const z = rec(ZN, 'zone:ishalgen');
  z.sources = [owner('22', 'Change Map list: Ishalgen = the starting map'), owner('23', 'Ishalgen map, first Kibelisk Aldelle Village')];
  z.kibelisks = ['Aldelle Village']; z.fieldStatus = { kibelisks: 'verified' };
  z.notes = ['The starting map (owner screens 22, 23, 36–39); Metabot World_D_Starter is assumed to be it. Used as the zone of the Lv 2–9 story quests, whose data has no location yet.'];
  latest(z);
  log('ishalgen', 'sq:2100010 "Ishalgen" removed from the story chain (owner:2026-10-14-unlocks-22); "A Village in the Fog" is the first quest (owner:2026-10-14-unlocks-21); key "Ishalgen" retired');
}

/* ================================================================== 3. feature unlocks from the owner's screens */
{
  const U = recs(UN);
  const add = r => { U.push({ ...r, verifiedAt: D }); log('unlock', r.id, '-', r.what, JSON.stringify(r.at)); };
  const lvAt = lv => ({ level: lv, basis: 'owner' });
  add({ id: 'unlock:journal-customization', what: 'Journal and Customization', detail: 'Journal (J)', at: lvAt(2), credit: 'your game', order: 1,
    sources: [owner('05', 'Journal (J): Reach Level 2'), owner('42', 'Customization: Reach Level 2')], status: 'verified' });
  add({ id: 'unlock:stats-window', what: 'Stats window', detail: 'Stats (P)', at: lvAt(3), credit: 'your game', order: 2, sources: [owner('06', 'Stats (P): Reach Level 3')], status: 'verified' });
  add({ id: 'unlock:skills-window', what: 'Skills window', detail: 'Skills (K)', at: lvAt(4), credit: 'your game', order: 3, sources: [owner('04', 'Skills (K): Reach Level 4')], status: 'verified' });
  add({ id: 'unlock:enhancement-achievements', what: 'Enhancement and Achievements', detail: 'Enhancement (N), Achievements (Y)', at: lvAt(9), credit: 'your game', order: 4,
    sources: [owner('13', 'Enhancement (N): Reach Level 9'), owner('09', 'Achievements (Y): Reach Level 9')], status: 'verified' });
  add({ id: 'unlock:lv10-systems', what: 'Crafting and Extraction', detail: 'Crafting (Alt+G), Essence Extraction (Alt+F), Substance Morph (Alt+H), Navigator, Attendance, Subscribe (G)', at: lvAt(10), credit: 'your game', order: 5,
    sources: [owner('26', 'Crafting (Alt+G): Reach Level 10'), owner('27', 'Essence Extraction (Alt+F): Reach Level 10'), owner('25', 'Substance Morph (Alt+H): Reach Level 10'), owner('28', 'Navigator: Reach Level 10'), owner('40', 'Attendance: Reach Level 10'), owner('01', 'Subscribe (G): Reach Level 10')], status: 'verified' });
  add({ id: 'unlock:lv45-systems', what: 'More systems at the cap', detail: 'Arcana (Alt+V), Season, Transcendence, Nightmare, Arena, Battlefield, Market, Rank', at: lvAt(45), credit: 'your game', order: 175,
    sources: [owner('15', 'Arcana (Alt+V): Reach Level 45'), owner('30', 'Season, Transcendence, Nightmare, Ascension Trial, Abyss, Arena: Reach Level 45 (screens 30–35)'), owner('41', 'Market: Reach Level 45'), owner('43', 'Rank: Reach Level 45'), owner('19', 'Battlefield: Reach Level 45')], status: 'verified' });
  add({ id: 'unlock:open-from-start', what: 'Cube, Mail, Manage Friends, Combat Analysis', at: { level: 1, basis: 'owner' },
    sources: [{ inferred: "The owner's screens of a fresh Lv 1 character (2026-10-14, docs/research/2026-10-owner-unlocks.md): Cube, Mail, Manage Friends and Combat Analysis show no lock; no screen number given." }], status: 'verified', notes: ['Open from the start (no lock), owner screens of 2026-10-14.'] });
  /* quest-gated features (not level rows) */
  const sqAt = (id, nn, what) => ({ at: { story: id, is: 'turnedIn', basis: 'owner', sources: [owner(nn, what)] } });
  for (const [id, what, sq, nn, scr] of [
    ['unlock:shop', 'Shop (H)', 'sq:2101020', '02', 'Shop (H): Complete "Prepare to Escape"'], ['unlock:closet', 'Closet (Alt+O)', 'sq:2101020', '10', 'Closet (Alt+O): Complete "Prepare to Escape"'],
    ['unlock:wings', 'Wings (Alt+C)', 'sq:2101050', '12', 'Wings (Alt+C): Complete "The Being Beneath the Lake"'], ['unlock:pets', 'Pets (Alt+X)', 'sq:2102020', '11', 'Pets (Alt+X): Complete "Gathering Essentials"'],
    ['unlock:title', 'Title (Alt+T)', 'sq:2101060', '08', 'Title (Alt+T): Complete "Spread Your Wings"'], ['unlock:daevanion', 'Daevanion (U)', 'sq:2102065', '03', 'Daevanion (U): Complete "Urgent Pursuit"'],
    ['unlock:shugo-festival', 'Shugo Festival', 'sq:2102065', '18', 'Shugo Festival: Complete "Urgent Pursuit"'], ['unlock:legion', 'Legion (L)', 'sq:2102100', '07', 'Legion (L): Complete "Buried Atrocities"']])
    add({ id, what, ...sqAt(sq, nn, scr), sources: [owner(nn, scr)], status: 'verified' });
  add({ id: 'unlock:pantheon', what: 'Pantheon', at: { done: 'asc:hears-the-voice', basis: 'owner', sources: [owner('14', 'Pantheon: Complete "The One Who Hears the Voice"')] },
    sources: [owner('14', 'Pantheon: Complete "The One Who Hears the Voice"')], status: 'verified' });
  /* existing records the screens confirm or correct */
  const ex = rec(UN, 'unlock:expedition-feature');
  ex.sources = ex.sources.filter(s => !s.inferred); ex.sources.push(owner('16', 'Expedition: Complete "Daeva in a Dream"'));
  ex.at = { story: 'sq:2102185', is: 'turnedIn', basis: 'owner', sources: [owner('16', 'Expedition: Complete "Daeva in a Dream"')] };
  latest(ex); log('unlock', 'unlock:expedition-feature: owner screen 16 replaces the "in-game (user)" note; gate is "Daeva in a Dream" completed (v1: reached)');
  for (const [id, nn, what] of [['unlock:supply-requests', '24', 'Supply Request (Alt+J): Reach Level 25'], ['unlock:daily-dungeon', '17', 'Daily Dungeon: Reach Level 30']]) {
    const r = rec(UN, id); r.sources.push(owner(nn, what)); r.credit += ', your game'; latest(r); log('unlock', id, ': confirmed by owner screen', nn); }
  { const r = rec(UN, 'unlock:level-cap'); r.sources.push(owner('30', 'Ascension Trial, Abyss: Reach Level 45 (screens 30–35)')); r.credit += ', your game'; latest(r); log('unlock', 'unlock:level-cap: Abyss and Ascension Trial confirmed by owner screens 30–35'); }
  { const r = rec(UN, 'unlock:stigma-slot-1'); r.notes = [...(r.notes || []), 'Owner recollection (not a screen), 2026-10-14: stigmas unlock at Lv 22, as Metabot says; aion2hub\'s Lv 23 is treated as wrong (DECISIONS 2026-10-14).']; log('unlock', 'unlock:stigma-slot-1: owner recollection noted'); }
  { /* Nezekan: the owner's screen ties the Daevanion window to "Urgent Pursuit", not to Lv 12 */
    const r = rec(UN, 'unlock:nezekan-board');
    r.at = { story: 'sq:2102065', is: 'turnedIn', basis: 'owner', sources: [owner('03', 'Daevanion (U): Complete "Urgent Pursuit"')] };
    r.conflicts = [...(r.conflicts || []), 'v1 listed it as a Lv 12 level unlock (Metabot needLevel 12 on every Nezekan node; thegameswiki, aion2hub). The owner\'s screen shows the Daevanion window locked until "Urgent Pursuit" (Lv 13) is completed; owner screens win (§5.4). Now a story unlock, not a level row.'];
    r.sources.push(owner('03', 'Daevanion (U): Complete "Urgent Pursuit"')); delete r.credit; delete r.order; latest(r);
    log('unlock', 'unlock:nezekan-board: Lv 12 level row -> story unlock "Urgent Pursuit" (owner:2026-10-14-unlocks-03)');
  }
  /* the story unlocks the Ahead card shows ("unlocks …" on the story quest) */
  for (const [id, text, ms, nn] of [['sq:2101020', 'Shop and Closet', null, '02'], ['sq:2101050', 'Wings', 'g6', '12'], ['sq:2101060', 'Titles', 'g6', '08'],
    ['sq:2102020', 'Pets', 'g10', '11'], ['sq:2102065', 'Daevanion boards and the Shugo Festival', 'g12', '03']]) {
    const s = rec(SQ, id); s.unlocks = { text, ...(ms ? { milestone: ms } : {}) }; s.sources.push(owner(nn, `${text}: complete "${s.name}"`)); latest(s);
    log('story unlock', id, s.name, '->', JSON.stringify(text));
  }
  { const s = rec(SQ, 'sq:2102185'); s.sources.push(owner('16', 'Expedition: Complete "Daeva in a Dream"')); latest(s); }
  { const s = rec(SQ, 'sq:2102100'); s.sources.push(owner('07', 'Legion (L): Complete "Buried Atrocities"')); latest(s); }
  { const m = rec(MS, 'g12'); m.blurb = 'First Daevanion board (Nezekan) opens with "Urgent Pursuit"; first regional quest.'; log('text', 'g12 blurb: "opens at Lv 12" -> "opens with \\"Urgent Pursuit\\"" (owner:2026-10-14-unlocks-03)'); }
  doc(UN).records.sort((a, b) => (a.id < b.id ? -1 : 1));
}

/* ================================================================== 4. locations and Kibelisk distances (Metabot, CSV) */
{
  const csv = readFileSync(join(ROOT, 'data/research/locations-metabot-2026-10.csv'), 'utf8').trim().split('\n');
  const head = csv[0].split(',');
  const parse = l => { const out = []; let cur = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === ',' && !q) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return Object.fromEntries(head.map((h, i) => [h, out[i]])); };
  const rows = csv.slice(1).map(parse);
  const MAP = { World_D_A: 'altgard' };
  const num = v => v === '' || v === undefined ? null : Number(v);
  const coords = (x, y, m, url) => (x !== '' && MAP[m] ? { map: MAP[m], x: num(x), y: num(y), sources: [{ url, checkedAt: D, note: 'marker position in map pixels (≈ 1 m, docs/research/2026-10-location-coverage.md §4)' }] } : null);
  const put = (loc, label, r, kib, m, x, y, map, rid, fields) => {
    const changes = [];
    if (kib !== '' && kib !== undefined) {
      if (loc.kibelisk == null) { loc.kibelisk = kib; changes.push(`kibelisk ${kib}`); }
      else if (loc.kibelisk !== kib) changes.push(`kibelisk ${loc.kibelisk} -> ${kib}`), loc.kibelisk = kib;
      const mm = num(m);
      if (loc.meters == null) { loc.meters = mm; changes.push(`meters ${mm}`); }
      else if (loc.meters !== mm) { changes.push(`meters ${loc.meters} -> ${mm}`); loc.meters = mm; }
    }
    const c = coords(x, y, map, r.page_url); if (c) { loc.coords = c; }
    if (changes.length) log('location', rid, label, changes.join(', '));
    if (changes.length || c) fields.push(...[changes.length ? [`${label}.kibelisk`, `${label}.meters`] : [], c ? [`${label}.coords`] : []].flat());
    return changes;
  };
  const touch = (r, url, fields, changes) => {
    if (!fields.length) return;
    r.sources = r.sources.filter(s => !(s.url === url && s.checkedAt === D && s.fields && s.fields.every(f => /\.(kibelisk|meters|coords)$/.test(f))));
    r.sources.push({ url, fields: [...new Set(fields)], checkedAt: D, note: 'Metabot quest page markers (Data & Research, data/research/locations-metabot-2026-10.csv)' });
    latest(r);
    if (r.fieldStatus) for (const f of fields) if (/\.(kibelisk|meters)$/.test(f)) delete r.fieldStatus[f.split('.')[0]];
  };
  for (const row of rows) {
    if (row.type === 'regional') {
      const q = recs(RQ).find(x => x.name === row.name); if (!q) throw new Error('rq ' + row.name);
      const f = [], ch = [...put(q.giver, 'giver', row, row.giver_kib, row.giver_kib_m, row.giver_x, row.giver_y, row.giver_map, q.id, f), ...put(q.turnin, 'turnin', row, row.turnin_kib, row.turnin_kib_m, row.turnin_x, row.turnin_y, row.turnin_map, q.id, f)];
      touch(q, row.page_url, f, ch);
    } else if (row.type === 'story') {
      const s = recs(SQ).find(x => x.name === row.name); if (!s) throw new Error('sq ' + row.name);
      const f = [], ch = [...put(s.giver, 'giver', row, row.giver_kib, row.giver_kib_m, row.giver_x, row.giver_y, row.giver_map, s.id, f), ...put(s.turnin, 'turnin', row, row.turnin_kib, row.turnin_kib_m, row.turnin_x, row.turnin_y, row.turnin_map, s.id, f)];
      touch(s, row.page_url, f, ch);
      if (s.conflicts) s.conflicts = s.conflicts.filter(c => !(ch.length && /is not in the shipped route data/.test(c) && ch.some(x => c.includes(x.split(' ')[0]))));
    } else if (row.type === 'sealed_dungeon') {
      const d = recs(SD).find(x => x.name === row.name); if (!d) throw new Error('sd ' + row.name);
      const f = [], ch = put(d.entrance, 'entrance', row, row.entrance_kib, row.entrance_kib_m, row.entrance_x, row.entrance_y, 'World_D_A', d.id, f);
      if (ch.some(c => /->/.test(c))) d.conflicts = [...(d.conflicts || []), `Entrance distance: v1 held a rounded figure (${ch.join(', ')}); the dungeon's Exploration-quest page gives the exact one (location-coverage §6).`];
      touch(d, row.page_url, f, ch);
      /* a superseded rounded figure: the older page keeps backing what still agrees (the Kibelisk), not the distance */
      for (const c of ch.filter(c => /->/.test(c))) {
        const fld = 'entrance.' + c.split(' ')[0];
        for (const s of d.sources) if (s.url && s.url !== row.page_url && s.fields && s.fields.includes(fld)) {
          s.fields = s.fields.filter(x => x !== fld);
          s.note = [s.note, `Its ${c.split(' ')[0]} figure (${c.split(' ')[1]}) is rounded; superseded by Metabot's exact one.`].filter(Boolean).join(' ');
        }
        d.sources = d.sources.filter(s => !s.fields || s.fields.length);
      }
      d.sources = d.sources.filter(s => !(s.inferred && /Entrance Kibelisk and distance carried over/.test(s.inferred) && f.length));
    } else if (row.type === 'stronghold') {
      const s = recs(SH).find(x => x.name === row.name); if (!s) throw new Error('sh ' + row.name);
      const old = { kib: s.location.kibelisk, m: s.location.meters };
      const f = [], ch = put(s.location, 'location', row, row.entrance_kib, row.entrance_kib_m, row.entrance_x, row.entrance_y, 'World_D_A', s.id, f);
      if (ch.length) s.conflicts = [...(s.conflicts || []), `Nearest Kibelisk: Metabot's Altgard stronghold list gives ${old.kib} ${old.m} m (v1); the quest step's marker, the entrance point, gives ${s.location.kibelisk} ${s.location.meters} m, which is the one tied to a position (location-coverage §6). The step figure is kept.`];
      touch(s, row.page_url, f, ch);
    }
  }
  /* the owner's location check T1 */
  { const d = rec(SD, 'sd:abandoned-one-s-grave'); d.conflicts = [...(d.conflicts || []), 'Owner check T1 (2026-10-14, main character): teleport to Neglected Crematorium, then 175 m and 180 m to the entrance on two tries vs 189 m on Metabot. Teleport landing spots vary by a few metres, and Metabot measures from the Kibelisk point; 189 m kept (docs/research/2026-10-owner-unlocks.md).']; }
  /* story locations that now have a Kibelisk resolve their zone through the zone records */
  const kz = {}; for (const z of recs(ZN)) for (const k of [...(z.camps || []), ...(z.kibelisks || [])]) kz[k] = z.id;
  for (const s of recs(SQ)) for (const side of ['giver', 'turnin']) {
    const l = s[side]; if (l.zone !== 'zone:altgard-unplaced' || !l.kibelisk || !kz[l.kibelisk]) continue;
    l.zone = kz[l.kibelisk]; s.fieldStatus[`${side}.zone`] = 'inferred';
    s.sources.push({ inferred: `${side} zone from its Kibelisk (${l.kibelisk}) through the zone records.`, fields: [`${side}.zone`] });
    log('zone', s.id, s.name, side, '->', l.zone);
  }
}

/* ================================================================== 5. specialties: 3 slots at 8/12/20, 5 choices at 8/8/8/12/16 (effective level) */
{
  const MB = {   /* Metabot skill pages, "Specialization N · requires skill level L", read 2026-10-14 */
    'Whirlwind Slice': [[8, '+50% Multi-Hit on hit'], [8, 'Changes to AoE damage'], [8, '+16m range'], [12, '+20% Stun Chance'], [16, '25% chance to reset [Whirlwind Slice] cooldown on Evasion']],
    Infiltrate: [[8, 'Restores 300 Stamina on landing [Infiltrate]'], [8, '+10m [Infiltrate] range'], [8, 'Breaks Protective Shields on landing [Infiltrate]'], [12, 'Adds [Dark Strike] Chain Skill'], [16, '+20% [Infiltrate] Blind Chance']],
    'Shadow Fall': [[8, 'Absorbs 1000, 1000% HP'], [8, 'Engraves 3 Insignias for 10s on hit'], [8, '-5s cooldown'], [12, '+1s Knockdown duration'], [16, 'Can be used on targets afflicted with Blind']],
    Defiance: [[8, 'Adds [Wrath Burst] Chain Skill'], [8, 'Restores 1,000 Stamina on using [Defiance]'], [8, 'Restores 20% HP on using [Defiance]'], [12, '+2s Tenacity duration'], [16, '+50% PvE Damage Tolerance and +25% PvP Damage Tolerance for Tenacity duration']],
  };
  for (const [name, cs] of Object.entries(MB)) {
    const s = recs(SK).find(x => x.name === name); if (!s || s.specialtyChoices) throw new Error('skill ' + name);
    const slug = s.id.split(':')[2];
    s.specialtyChoices = cs.map(([lv, text], i) => ({ id: `spec:assassin:${slug}:${i + 1}`, n: i + 1, skillLv: lv, text }));
    s.sources.push({ url: `https://metabot.gg/en/aion-2/skills/${slug}`, fields: ['specialtyChoices'], checkedAt: D, build: { scheme: 'metabot', value: '0.0.4387.0' } });
    latest(s); log('specialty', s.id, ': 5 choices added (Metabot skill page)');
  }
  const r = rec(RU, 'rule:specialty-slots');
  r.sources.push({ inferred: "Owner-confirmed in game (docs/feedback/2026-10-14-owner.md F4: Quick Slice Lv 10 (+3 from board nodes) = 13 shows slots 1 and 2 usable and slot 3 locked; choices at skill Lv 8 (three), 12 and 16). No screen code assigned yet (DATA-FORMAT-V2 §14.2).", fields: ['value'] });
  r.notes = [...r.notes, 'Owner-confirmed (F4, 2026-10-14): 3 slots per active skill at effective skill level 8 / 12 / 20; the 5 choices at effective level 8 / 8 / 8 / 12 / 16 (skills[].specialtyChoices[].skillLv). Effective = bought levels + Daevanion nodes for the skill. The app still gates slot 1 on "learn + 18" (bug F3); the fix is 0.3 behaviour (owner approval).'];
  log('specialty', 'rule:specialty-slots: owner confirmation (F4) recorded');
  const tip = rec(TP, 'tip:specialty');
  tip.body = '<p>Each active skill gets three specialty slots as <b>that skill</b> levels up (not your character): slot 1 at skill level 8, slot 2 at 12, slot 3 at 20. Daevanion board nodes for the skill count toward these levels. Each slot holds one of five bonus effects: three open at skill level 8, the fourth at 12 and the fifth at 16. Unlocking a slot isn\'t enough: open the skill, click the slot and choose an effect, or you get nothing.</p>';
  tip.credit = 'gameplay.tips, Skycoach, MeinMMO, Metabot skill pages, your game'; tip.verifiedAt = D;
  const dv = rec(TP, 'tip:daevanion');
  const from = 'Not documented: whether board levels can push a skill past 10, whether they count toward the skill level 8 specialty unlock, and the reset cost.';
  if (!dv.body.includes(from)) throw new Error('daevanion tip');
  dv.body = dv.body.replace(from, 'Board levels count toward a skill\'s specialty slots (seen in your game). Not documented: whether board levels can push a skill past 10, and the reset cost.');
  dv.verifiedAt = D;
  const cf = rec(CF, 'conf:specialty-slots'); cf.text = 'Specialty slots at skill level 8 / 12 / 20, Daevanion nodes included (seen in your game); choices at 8 / 8 / 8 / 12 / 16 (Metabot skill pages).';
  log('text', 'tip:specialty, tip:daevanion and Confidence "Specialty slots": board nodes count; five choices at 8 / 8 / 8 / 12 / 16 (owner F4, Metabot)');
}

/* -------------------------------------------- review of #38 (2026-10-15) */
{
  /* rq:2202054 cited an aion2.th.gl page in prose; the facts are on aion2.gaming.tools + allthings.how, and Metabot's page now gives the Kibelisk */
  const q = rec(RQ, 'rq:2202054');
  const i = q.conflicts.findIndex(c => c.includes('aion2.th.gl q_2202054')); if (i < 0) throw new Error('rq:2202054 note');
  q.conflicts[i] = "Data from aion2.gaming.tools 2202054 and allthings.how 244384 (an aion2.th.gl page used before is withdrawn and no longer cited). Kibelisk from Metabot's quest page (One Last Thing, 2026-10-14).";
  log('th.gl', 'rq:2202054: prose citation of an aion2.th.gl page replaced by its permitted sources');
  /* "Giver Kibelisk: null" conflicts are stale once the Metabot location pass filled the Kibelisk */
  let n = 0;
  for (const r of recs(RQ)) if (r.giver && r.giver.kibelisk && r.conflicts) {
    const k = r.conflicts.length; r.conflicts = r.conflicts.filter(c => !/^Giver Kibelisk: null/.test(c)); n += k - r.conflicts.length;
    if (!r.conflicts.length) delete r.conflicts;
  }
  log('location', `${n} stale "Giver Kibelisk: null" conflicts dropped (the Kibelisk is now on the record, from Metabot)`);
  /* Nezekan opens with the story quest, not at Lv 12 (owner screen, unlock:daevanion) */
  const dv = rec(TP, 'tip:daevanion');
  const from = 'Nezekan (Lv 12, via the story quest "Urgent Pursuit")';
  if (!dv.body.includes(from)) throw new Error('daevanion tip Nezekan');
  dv.body = dv.body.replace(from, 'Nezekan (when you complete the story quest "Urgent Pursuit", Lv 13)');
  log('text', 'tip:daevanion: Nezekan opens with "Urgent Pursuit", not at Lv 12 (owner screen)');
}

/* ------------------------------------------------------------------ write */
for (const [p, d] of Object.entries(files)) writeFileSync(P(p), JSON.stringify(d, null, 2) + '\n');
writeFileSync(join(ROOT, 'tools/history/v2-corrections/changes.txt'), LOG.join('\n') + '\n');
console.log(`${LOG.length} changes in ${Object.keys(files).length} files (tools/history/v2-corrections/changes.txt)`);
