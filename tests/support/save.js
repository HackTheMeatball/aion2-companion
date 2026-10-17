/* The one place the tests write and read saves (0.4 P3a). Every suite and support script goes through it, so a change of
   the storage key or the save's shape changes this file, not every suite. CommonJS; the .mjs suites load it with
   createRequire.

   A test describes a save as a "flat" state: character fields (checks, level, quest, …; charFields() in
   src/core/state.js) at the top level beside the view settings. toStored() turns that into what the current build
   stores (save v5, 0.4 P3c: one character slot, TEST_SLOT), fromStored() turns a stored save back into the flat shape
   (the current character's fields beside the view settings), so assertions stay as they are. The conversion lives
   here, in the tests, never in the app (CLAUDE.md "never read an old-shape save into new code").

   A flat state without mt gets every value stamped at time 0 (unknown), as a v5 save is born (src/core/migrations.js):
   mtAtZero() mirrors stamp(c, 0) in src/core/sync.js, which tests/core/save-helper.test.mjs checks. The one-time flags
   of the pre-0.4 saves (RETIRED_FLAGS) are left out: a v5 save has none.

   SAVE_KEY is read from src/core/state.js, not typed again. V4_KEY is the pre-0.4 key: only the `save` suite uses it,
   to prove the app never reads it. */
'use strict';
const fs = require('fs'), path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const STATE_SRC = fs.readFileSync(path.join(ROOT, 'src', 'core', 'state.js'), 'utf8');
/* the AION 2 pack object (0.4 P2b): a new character's guide pack and class, and the pack's character fields */
const PACK_SRC = fs.readFileSync(path.join(ROOT, 'src', 'packs', 'aion2', 'pack.js'), 'utf8');
const strConst = (n, src = STATE_SRC, f = 'src/core/state.js') => { const m = new RegExp(`^export const ${n} = "([^"]+)";`, 'm').exec(src); if (!m) throw new Error(`tests/support/save.js: no \`export const ${n} = "…";\` in ${f}`); return m[1]; };
const listConst = n => { const m = new RegExp(`^export const ${n} = \\[([^\\]]+)\\];`, 'm').exec(STATE_SRC); if (!m) throw new Error(`tests/support/save.js: no \`export const ${n} = [...]\` in src/core/state.js`); return [...m[1].matchAll(/"([^"]+)"/g)].map(x => x[1]); };
const packFields = () => { const m = /^  charFields: \{([^}]+)\},$/m.exec(PACK_SRC); if (!m) throw new Error('tests/support/save.js: no `  charFields: { … },` in src/packs/aion2/pack.js'); return [...m[1].matchAll(/(\w+): "(?:map|register|local)"/g)].map(x => x[1]); };
const SAVE_KEY = strConst('KEY'), PACK = strConst('PACK', PACK_SRC, 'src/packs/aion2/pack.js'), CLASS = strConst('CLASS', PACK_SRC, 'src/packs/aion2/pack.js');
/* the character fields: the engine's (ENGINE_FIELDS) and the pack's (charFields), as charFields() in src/core/state.js */
const CHAR_FIELDS = [...listConst('ENGINE_FIELDS'), ...packFields()], CHAR_META = listConst('CHAR_META');
const V4_KEY = 'aion2-assassin-route-v4';
const BEFORE_IMPORT_KEY = SAVE_KEY + ':before-import';
/* the tests' slot id (the app makes a random one for a new save; a stored id is kept as it is) */
const TEST_SLOT = '00000000-0000-4000-8000-00000000c0de';
const RETIRED_FLAGS = ['seedLv12', 'stTriniel1', 'dvReset1', 'migV5', 'eputSync1', 'g45Split1', 'stampV1', 'schemaVersion', 'backup1', 'seedDv', 'seedDv2', 'seedDv3', 'seedDv4'];

/* stamp(c, 0) of src/core/sync.js for a character without mt: every timed value as [0, value] */
const SYNC_MAPS = ['checks', 'started', 'areaRun', 'rqSnooze', 'stLv', 'stPick', 'dvCost'];
const SYNC_REGS = ['level', 'stones', 'pendSt', 'pendCr', 'stShards', 'dvTotal', 'dvAdj', 'rotSeen', 'buildId', 'customBuild'];
function mtAtZero(c) {
  const mt = {}, set = (p, v) => { if (v == null) return; let o = mt; p.slice(0, -1).forEach(k => { o = o[k] = o[k] || {}; }); o[p[p.length - 1]] = [0, v]; };
  for (const f of SYNC_MAPS) for (const [k, v] of Object.entries(c[f] || {})) set([f, k], v);
  for (const [q, a] of Object.entries(c.qsteps || {})) (Array.isArray(a) ? a : []).forEach(i => set(['qsteps', q, String(i)], true));
  for (const [q, o] of Object.entries(c.qsub || {})) for (const [i, a] of Object.entries(o || {})) (Array.isArray(a) ? a : []).forEach(j => set(['qsub', q, i, String(j)], true));
  for (const f of SYNC_REGS) set([f], c[f]);
  if (c.quest != null || c.storyEnd != null) set(['quest'], [c.quest ?? null, c.storyEnd ?? null]);
  return mt;
}

/* flat test state -> the stored v5 object, and back. The input is never changed. */
function toStored(flat) {
  const top = {}, c = { id: TEST_SLOT, pack: PACK, class: CLASS, name: '', created: 0 };
  for (const [k, v] of Object.entries(flat)) {
    if (v === undefined || RETIRED_FLAGS.includes(k)) continue;
    if (CHAR_FIELDS.includes(k)) c[k] = JSON.parse(JSON.stringify(v)); else top[k] = JSON.parse(JSON.stringify(v));
  }
  if (!('mt' in c)) c.mt = mtAtZero(c);
  return { v: 5, ...top, current: c.id, chars: { [c.id]: c } };
}
function fromStored(stored) {
  const { v, current, chars, ...top } = stored, c = (chars || {})[current] || {}, out = { ...top };
  for (const [k, x] of Object.entries(c)) if (!CHAR_META.includes(k)) out[k] = x;
  return out;
}
/* the exact text written for a flat state (null = no save) */
const storedText = flat => flat == null ? null : JSON.stringify(toStored(flat));
const parseStored = raw => raw == null ? null : fromStored(JSON.parse(raw));

/* Raw text under a key (default SAVE_KEY). writeRaw(page, null) removes the save. { fresh: true } clears the origin's
   localStorage first, in the same step (a fresh browser plus this save). */
async function writeRaw(page, raw, { key = SAVE_KEY, fresh = false } = {}) {
  await page.evaluate(([k, s, fresh]) => { if (fresh) localStorage.clear(); if (s === null) localStorage.removeItem(k); else localStorage.setItem(k, s); }, [key, raw, fresh]);
}
const readRaw = (page, { key = SAVE_KEY } = {}) => page.evaluate(k => localStorage.getItem(k), key);

/* A flat state written as the current build stores it; read back as a flat state (null = no save). */
const writeSave = (page, flat, opts = {}) => writeRaw(page, storedText(flat), opts);
const readSave = async (page, opts = {}) => parseStored(await readRaw(page, opts));
/* A fresh browser: this origin's localStorage emptied (the save, :before-import, everything). */
const clearSave = page => page.evaluate(() => localStorage.clear());
/* The page's in-memory save (the page global `state`) as a flat state */
const liveState = async page => fromStored(JSON.parse(await page.evaluate(() => JSON.stringify(state))));

/* A committed flat fixture (tests/fixtures/*.flat.json: the pre-0.4 saves as the 0.3 build stored them, frozen). */
const flatFixture = name => JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'fixtures', name), 'utf8'));

module.exports = { SAVE_KEY, V4_KEY, BEFORE_IMPORT_KEY, TEST_SLOT, RETIRED_FLAGS, toStored, fromStored, storedText, parseStored, mtAtZero, writeRaw, readRaw, writeSave, readSave, clearSave, liveState, flatFixture };
