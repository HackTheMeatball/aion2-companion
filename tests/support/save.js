/* The one place the tests write and read saves (0.4 P3a). Every suite and support script goes through it, so a change of
   the storage key or the save's shape (P3c) changes this file, not every suite. CommonJS; the .mjs suites load it with
   createRequire.

   A test describes a save as a "flat" state: today's shape, character fields (checks, level, quest, …; CHAR_FIELDS in
   src/core/state.js) at the top level beside the view settings and one-time flags. toStored() turns that into what the
   current build stores, fromStored() turns a stored save back into the flat shape, so assertions stay as they are.
   The conversion lives here, in the tests, never in the app (CLAUDE.md "never read an old-shape save into new code").

   SAVE_KEY is read from src/core/state.js, not typed again. V4_KEY is the old builds' key: only mig1 / mig2 use it, for
   the baselines (tests/baselines/v285.html, v287.html) and the v4-era saves they carry into the current page. */
'use strict';
const fs = require('fs'), path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const STATE_SRC = path.join(ROOT, 'src', 'core', 'state.js');
const m = /^export const KEY = "([^"]+)";/m.exec(fs.readFileSync(STATE_SRC, 'utf8'));
if (!m) throw new Error('tests/support/save.js: no `export const KEY = "…";` in src/core/state.js');
const SAVE_KEY = m[1];
const V4_KEY = 'aion2-assassin-route-v4';
const BEFORE_IMPORT_KEY = SAVE_KEY + ':before-import';

/* flat test state -> the stored object, and back. Today the stored save is the flat state itself. */
const toStored = flat => flat;
const fromStored = stored => stored;
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

/* A committed flat fixture (tests/fixtures/*.flat.json, made by tests/support/make-flat-fixtures.js). */
const flatFixture = name => JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'fixtures', name), 'utf8'));

module.exports = { SAVE_KEY, V4_KEY, BEFORE_IMPORT_KEY, toStored, fromStored, storedText, parseStored, writeRaw, readRaw, writeSave, readSave, clearSave, flatFixture };
