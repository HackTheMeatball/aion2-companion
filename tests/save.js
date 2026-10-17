/* Save v5 (0.4 P3c), in the browser: the clean break and the save's round trips. Suite `save` in tests/run.mjs (golden
   shard, in place of the removed mig1 / mig2). node tests/save.js  (page at AION_BASE; see tests/config.js)
     1. fresh browser: Lv 1 on the first quest; only the v5 key written; a random slot id
     2. a v4 save present: the app starts fresh, no page error, the v4 entry byte-identical, getItem never called with
        the v4 key (Storage.prototype.getItem spied from before the page's script runs)
     3. v5 round trip: save, reload, identical text
     4. import of a v4 export: refused with the message, nothing changes
     5. import of a v5 export: replaces the save, the old one kept under :before-import
     6. Level up changes the label (labelOf), never the slot id or the key
     7. the player name and the label never leave the save: not in a storage key, the report link or the export file name
     8. two slots: the page shows the current one and leaves the other as it is */
const { chromium } = require('playwright'); const fs = require('fs'); const { isDeepStrictEqual } = require('util');
const CFG = require('./config');
const { SAVE_KEY, V4_KEY, BEFORE_IMPORT_KEY, TEST_SLOT, toStored, writeRaw, readRaw, writeSave, clearSave } = require('./support/save');
let fail = 0; const ok = (name, cond, detail) => { console.log((cond ? 'ok   ' : 'FAIL ') + name + (!cond && detail !== undefined ? '  · ' + JSON.stringify(detail).slice(0, 700) : '')); if (!cond) fail++; };
const UUID4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const OLD_MSG = "This file is from a version before 0.4 and can't be loaded.";
/* a pre-0.4 save and export, as the 0.3 build stored and exported it (flat, under the v4 key) */
const V4_SAVE = JSON.stringify({ checks: { 'g6:0': true, 'g9:0': true, 'rq:2202010': true }, level: 30, quest: 'Dying Light', open: {}, mode: 'advanced', seedLv12: true, stTriniel1: true, dvReset1: true, migV5: true, eputSync1: true, stampV1: true, schemaVersion: 1, backup1: true, backup: { since: 1759000000000 }, mt: { level: [0, 30] } });

(async () => {
  const b = await chromium.launch();
  /* a new browser context (empty storage); getItem calls are recorded from the first script on */
  const page = async () => {
    const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 }, acceptDownloads: true, serviceWorkers: 'block' });
    await ctx.addInitScript(() => { const g = Storage.prototype.getItem; window.__gets = []; Storage.prototype.getItem = function (k) { window.__gets.push(String(k)); return g.call(this, k); }; });
    const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(CFG.CUR); await p.waitForTimeout(300);
    return { ctx, p, errs };
  };
  const keys = p => p.evaluate(() => Object.keys(localStorage).sort());
  const live = p => p.evaluate(() => JSON.stringify(state));
  const importFile = async (p, text) => { await p.setInputFiles('#impIn', { name: 'file.json', mimeType: 'application/json', buffer: Buffer.from(text) }); await p.waitForTimeout(250); };

  /* 1. fresh browser */
  {
    const { ctx, p, errs } = await page();
    await clearSave(p); await p.reload(); await p.waitForTimeout(400);
    const s = await p.evaluate(() => ({ lv: char(state).level, q: char(state).quest, q0: QUESTS[0][1], v: state.v, cur: state.current, ids: Object.keys(state.chars), c: char(state) }));
    ok('fresh: Lv 1 on the first story quest', s.lv === 1 && s.q === s.q0, s);
    ok('fresh: one slot, current, a random v4 UUID; pack, class and an empty name', s.v === 5 && s.ids.length === 1 && s.ids[0] === s.cur && UUID4.test(s.cur) && s.c.id === s.cur && s.c.pack === 'aion2/asmodian/assassin' && s.c.class === 'assassin' && s.c.name === '', s);
    await p.click('#lvlUp'); await p.waitForTimeout(150);
    ok('fresh: only the v5 key is written', JSON.stringify(await keys(p)) === JSON.stringify([SAVE_KEY]), await keys(p));
    const stored = JSON.parse(await readRaw(p));
    ok('fresh: the stored save is v5 with the same slot and Lv 2 after Level up', stored.v === 5 && stored.current === s.cur && stored.chars[s.cur].level === 2, stored);
    const other = await page(); await clearSave(other.p); await other.p.reload(); await other.p.waitForTimeout(300);
    const id2 = await other.p.evaluate(() => state.current); await other.ctx.close();
    ok('fresh: another browser gets another slot id', UUID4.test(id2) && id2 !== s.cur, [s.cur, id2]);
    ok('fresh: no page errors', !errs.length, errs);
    await ctx.close();
  }
  /* 2. a v4 save in this browser: never read, never changed */
  {
    const { ctx, p, errs } = await page();
    await writeRaw(p, V4_SAVE, { key: V4_KEY, fresh: true }); await p.reload(); await p.waitForTimeout(400);
    const s = await p.evaluate(() => ({ lv: char(state).level, q: char(state).quest, q0: QUESTS[0][1], ticks: Object.values(char(state).checks).filter(Boolean).length, gets: window.__gets }));
    ok('v4 save present: the app starts fresh (Lv 1, first quest, no ticks)', s.lv === 1 && s.q === s.q0 && s.ticks === 0, s);
    ok('v4 save present: getItem is never called with the v4 key', s.gets.length > 0 && !s.gets.includes(V4_KEY) && s.gets.includes(SAVE_KEY), s.gets);
    await p.click('#lvlUp'); await p.waitForTimeout(150); await p.reload(); await p.waitForTimeout(300);
    /* read before this suite's own getItem calls below (readRaw) are recorded */
    const gets2 = await p.evaluate(() => window.__gets);
    ok('v4 save present: getItem never called with the v4 key after the reload either', gets2.length > 0 && !gets2.includes(V4_KEY), gets2);
    ok('v4 save present: its entry is byte-identical after a load, a save and a reload', await readRaw(p, { key: V4_KEY }) === V4_SAVE);
    ok('v4 save present: the progress is saved under the v5 key only', JSON.stringify(await keys(p)) === JSON.stringify([V4_KEY, SAVE_KEY].sort()) && JSON.parse(await readRaw(p)).v === 5, await keys(p));
    ok('v4 save present: no page error', !errs.length, errs);
    await ctx.close();
  }
  /* 3. v5 round trip */
  const SAVED = { checks: { 'g6:0': true, 'g9:0': true, 'rq:2202010': true }, started: { 'rq:2202017': 1 }, level: 22, quest: 'Daeva in a Dream', open: {}, mode: 'advanced', stones: 3 };
  {
    const { ctx, p, errs } = await page();
    await writeSave(p, SAVED, { fresh: true }); await p.reload(); await p.waitForTimeout(400);
    const a = await readRaw(p); await p.reload(); await p.waitForTimeout(400); const b2 = await readRaw(p);
    ok('round trip: save, reload, identical text', a !== null && a === b2, [a && a.slice(0, 200), b2 && b2.slice(0, 200)]);
    ok('round trip: the in-memory save equals the stored text', (await live(p)) === b2);
    const c = JSON.parse(b2).chars[TEST_SLOT], want = toStored(SAVED).chars[TEST_SLOT];
    ok('round trip: the character comes back with its progress and slot id', b2 && JSON.parse(b2).current === TEST_SLOT && ['checks', 'started', 'level', 'quest', 'stones', 'id', 'pack', 'class', 'name', 'created'].every(f => JSON.stringify(c[f]) === JSON.stringify(want[f])), c);
    ok('round trip: no page errors', !errs.length, errs);
    await ctx.close();
  }
  /* 4. import of a v4 (pre-0.4) export: refused, nothing changes */
  {
    const { ctx, p, errs } = await page();
    await writeSave(p, SAVED, { fresh: true }); await p.reload(); await p.waitForTimeout(400);
    const raw0 = await readRaw(p), mem0 = await live(p), keys0 = await keys(p);
    for (const [label, text] of [['a v4 export', V4_SAVE], ['not JSON', 'not a save'], ['other JSON', '{"hello":1}']]) {
      await importFile(p, text);
      const msg = await p.innerText('#xferMsg');
      ok(`import ${label}: refused with "${OLD_MSG}"`, msg === OLD_MSG && !(await p.$('#impGo')), msg);
      ok(`import ${label}: the save, the in-memory state and the keys are unchanged`, (await readRaw(p)) === raw0 && (await live(p)) === mem0 && JSON.stringify(await keys(p)) === JSON.stringify(keys0) && (await readRaw(p, { key: BEFORE_IMPORT_KEY })) === null);
    }
    ok('import refused: no page errors', !errs.length, errs);
    await ctx.close();
  }
  /* 5. import of a v5 export: replaces the save, keeps the old one under :before-import */
  {
    const { ctx, p, errs } = await page();
    await writeSave(p, SAVED, { fresh: true }); await p.reload(); await p.waitForTimeout(400);
    const mem0 = await live(p);
    const file = { ...toStored({ checks: { 'g6:0': true, 'g12:0': true }, level: 33, quest: 'Last Refuge', open: {}, mode: 'basic' }) };
    file.chars = { 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee': { ...file.chars[TEST_SLOT], id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' } }; file.current = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
    await importFile(p, JSON.stringify(file));
    ok('import v5: asks before replacing (Lv 33, 2 ticks)', /Replace your progress with this file \(Lv 33, 2 ticks\)/.test(await p.innerText('#xferMsg')), await p.innerText('#xferMsg'));
    await Promise.all([p.waitForEvent('load'), p.click('#impGo')]); await p.waitForTimeout(400);
    const s = await p.evaluate(() => ({ lv: char(state).level, q: char(state).quest, cur: state.current, mode: state.mode }));
    ok('import v5: the save is replaced (level, quest, slot id, view settings from the file)', s.lv === 33 && s.q === 'Last Refuge' && s.cur === file.current && s.mode === 'basic', s);
    ok('import v5: the replaced save is kept under :before-import, as it was', (await readRaw(p, { key: BEFORE_IMPORT_KEY })) === mem0);
    ok('import v5: only the v5 keys exist', JSON.stringify(await keys(p)) === JSON.stringify([SAVE_KEY, BEFORE_IMPORT_KEY].sort()), await keys(p));
    ok('import v5: no page errors', !errs.length, errs);
    await ctx.close();
  }
  /* 6. Level up: the label changes, the slot id and the key don't */
  {
    const { ctx, p, errs } = await page();
    await writeSave(p, SAVED, { fresh: true }); await p.reload(); await p.waitForTimeout(400);
    const at = () => p.evaluate(() => ({ label: labelOf(char(state)), id: char(state).id, cur: state.current, slots: Object.keys(state.chars), keys: Object.keys(localStorage).sort() }));
    const a = await at(); await p.click('#lvlUp'); await p.waitForTimeout(200); const z = await at();
    ok('Level up: the label goes from assassin-lvl22 to assassin-lvl23', a.label === 'assassin-lvl22' && z.label === 'assassin-lvl23', [a.label, z.label]);
    ok('Level up: the slot id, the slots and the storage key stay the same', a.id === TEST_SLOT && z.id === a.id && z.cur === a.cur && JSON.stringify(z.slots) === JSON.stringify(a.slots) && JSON.stringify(z.keys) === JSON.stringify(a.keys) && JSON.stringify(z.keys) === JSON.stringify([SAVE_KEY]), [a, z]);
    ok('Level up: the label is not stored', !(await readRaw(p)).includes('lvl23'));
    ok('Level up: no page errors', !errs.length, errs);
    await ctx.close();
  }
  /* 7. a named character: the name and the label stay inside the save */
  {
    const { ctx, p, errs } = await page();
    const NAME = 'Zedonia', named = toStored(SAVED); named.chars[TEST_SLOT].name = NAME;
    await writeRaw(p, JSON.stringify(named), { fresh: true }); await p.reload(); await p.waitForTimeout(400);
    await p.click('#lvlUp'); await p.waitForTimeout(150);
    const label = await p.evaluate(() => labelOf(char(state)));
    const where = await p.evaluate(() => { document.getElementById('reportLink').dispatchEvent(new Event('focus'));
      return { ls: Object.keys(localStorage), ss: Object.keys(sessionStorage), report: document.getElementById('reportLink').href, url: location.href, title: document.title }; });
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#expBtn')]);
    const fname = dl.suggestedFilename(), file = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
    const leaks = [...where.ls, ...where.ss, where.report, decodeURIComponent(where.report), where.url, where.title, fname].filter(x => x.includes(NAME) || x.includes(label) || x.includes(TEST_SLOT));
    ok('name / label: the label is Zedonia-assassin-lvl23', label === NAME + '-assassin-lvl23', label);
    ok('name / label: not in a storage key, the report link, the URL, the title or the export file name', !leaks.length, leaks);
    ok('name / label: the export file name is companion-save-<date>.json', /^companion-save-\d{4}-\d\d-\d\d\.json$/.test(fname), fname);
    ok('name / label: the name is kept inside the save (and the export)', file.chars[TEST_SLOT].name === NAME && JSON.parse(await readRaw(p)).chars[TEST_SLOT].name === NAME);
    ok('name / label: no page errors', !errs.length, errs);
    await ctx.close();
  }
  /* 8. two slots: the current one is shown, the other is left as it is */
  {
    const { ctx, p, errs } = await page();
    const two = toStored(SAVED), B = '00000000-0000-4000-8000-0000000000b2';
    two.chars[B] = { ...JSON.parse(JSON.stringify(two.chars[TEST_SLOT])), id: B, level: 40, quest: 'Forgotten Commander' }; two.current = B;
    await writeRaw(p, JSON.stringify(two), { fresh: true }); await p.reload(); await p.waitForTimeout(400);
    await p.click('#lvlUp'); await p.waitForTimeout(150);
    const st = JSON.parse(await readRaw(p)), shown = await p.evaluate(() => document.getElementById('questIn').value);
    ok('two slots: the page shows the current slot (Lv 40 → 41, its quest)', st.chars[B].level === 41 && shown === 'Forgotten Commander', { lv: st.chars[B].level, shown });
    ok('two slots: the other slot is left exactly as it was', isDeepStrictEqual(st.chars[TEST_SLOT], two.chars[TEST_SLOT]), st.chars[TEST_SLOT]);
    ok('two slots: no page errors', !errs.length, errs);
    await ctx.close();
  }
  await b.close();
  console.log(fail ? `SAVE CHECKS FAILED: ${fail}` : 'SAVE CHECKS PASSED');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); console.log('SAVE CHECKS FAILED: exception'); process.exit(1); });
