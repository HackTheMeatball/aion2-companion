/* 0.2.5 save safety helpers (src/core/backup.js; docs/design/0.2.5-save-safety.md §2–§4): one day count for the line,
   the nudge and the hint; the storage side of export and import. */
import assert from 'node:assert/strict';

/* Local times are built in a fixed time zone (TZ is read by Node's Date at each call), restored after each test. */
const inTZ = (tz, fn) => { const old = process.env.TZ; process.env.TZ = tz; try { fn(); } finally { if (old === undefined) delete process.env.TZ; else process.env.TZ = old; } };
const at = (d, h = 12, m = 0) => new Date(2026, 9, d, h, m).getTime();   /* 2026-10-<d> local time */
const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  ipod: 'Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  chromeIOS: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1',
  firefoxIOS: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/131.0 Mobile/15E148 Safari/605.1.15',
  edgeIOS: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 EdgiOS/130.0.0.0 Mobile/15E148 Safari/605.1.15',
  inApp: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.0',
  gsa: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/340.0.0 Mobile/15E148',
  ipad: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
};
const save = (backup, extra = {}) => ({ checks: { 'g6:0': true }, level: 20, quest: '', backup1: true, ...(backup === undefined ? {} : { backup }), ...extra });

export default (test, M) => {
  test('daysSince: whole local calendar days; a future time gives 0', () => inTZ('America/New_York', () => {
    for (const n of [0, 1, 2, 13, 14, 15]) assert.equal(M.daysSince(at(1, 12), at(1 + n, 12)), n, `${n} days`);
    assert.equal(M.daysSince(at(1, 23, 59), at(2, 0, 1)), 1, 'two minutes across midnight = 1 day');
    assert.equal(M.daysSince(at(2, 0, 1), at(2, 23, 59)), 0, 'same local day');
    assert.equal(M.daysSince(at(10), at(3)), 0, 'future');
  }));
  test('daysSince: local midnight, not UTC (time-zone fixture)', () => {
    const exp = Date.UTC(2026, 9, 2, 3, 30), now = Date.UTC(2026, 9, 2, 20, 0);   /* NY: Oct 1 23:30 → Oct 2 16:00; Auckland: Oct 2 16:30 → Oct 3 09:00 */
    inTZ('America/New_York', () => assert.equal(M.daysSince(exp, now), 1));
    inTZ('UTC', () => assert.equal(M.daysSince(exp, now), 0));
    inTZ('Pacific/Auckland', () => assert.equal(M.daysSince(exp, now), 1));
    /* across the US clock change (Nov 1 2026): a 25-hour day still counts as one */
    inTZ('America/New_York', () => assert.equal(M.daysSince(new Date(2026, 9, 31, 12).getTime(), new Date(2026, 10, 1, 12).getTime()), 1));
  });
  test('line: never / today / yesterday / N days; stale from 14 days', () => inTZ('America/New_York', () => {
    assert.deepEqual(M.backupLine(save(undefined), at(20)), { text: 'No backup yet.', stale: false });
    assert.deepEqual(M.backupLine(save({ since: at(1) }), at(20)), { text: 'No backup yet.', stale: false });
    const L = n => M.backupLine(save({ lastExportAt: at(1) }), at(1 + n));
    assert.deepEqual(L(0), { text: 'Last backup: today.', stale: false });
    assert.deepEqual(L(1), { text: 'Last backup: yesterday.', stale: false });
    assert.deepEqual(L(2), { text: 'Last backup: 2 days ago.', stale: false });
    assert.deepEqual(L(13), { text: 'Last backup: 13 days ago.', stale: false });
    assert.deepEqual(L(14), { text: 'Last backup: 14 days ago.', stale: true });
    assert.deepEqual(L(15), { text: 'Last backup: 15 days ago.', stale: true });
    assert.deepEqual(M.backupLine(save({ lastExportAt: at(9) }), at(3)), { text: 'Last backup: today.', stale: false }, 'future');
    for (const bad of [-5, 'x', 0, NaN, Infinity]) assert.equal(M.backupLine(save({ lastExportAt: bad }), at(20)).text, 'No backup yet.', String(bad));
    for (const bad of ['x', [1], null, 7]) assert.equal(M.backupLine(save(bad), at(20)).text, 'No backup yet.', JSON.stringify(bad));
  }));
  test('nudge: 13 days no, 14 and 15 days yes; N matches the line', () => inTZ('America/New_York', () => {
    const s = save({ since: at(1), lastExportAt: at(1) });
    assert.equal(M.shouldNudge(s, at(14), false), false);
    assert.equal(M.shouldNudge(s, at(15), false), true); assert.equal(M.shouldNudge(s, at(16), false), true);
    assert.equal(M.nudgeText(s, at(16)), "You haven't exported a backup in 15 days. Progress lives in this browser only.");
  }));
  test('nudge: export at 23:00, 08:00 on day 14: line amber and nudge shown on the same day with the same N', () => inTZ('America/New_York', () => {
    const s = save({ lastExportAt: at(1, 23) }), now = at(15, 8);   /* 13 days and 9 hours later */
    assert.deepEqual(M.backupLine(s, now), { text: 'Last backup: 14 days ago.', stale: true });
    assert.equal(M.shouldNudge(s, now, false), true);
    assert.match(M.nudgeText(s, now), /in 14 days\./);
    assert.equal(M.shouldNudge(s, at(14, 23, 59), false), false); assert.equal(M.backupLine(s, at(14, 23, 59)).stale, false);
  }));
  test('nudge: never exported uses since; the "yet" text; neither time valid = no nudge', () => inTZ('America/New_York', () => {
    assert.equal(M.shouldNudge(save({ since: at(1) }), at(14), false), false);
    assert.equal(M.shouldNudge(save({ since: at(1) }), at(15), false), true);
    assert.equal(M.nudgeText(save({ since: at(1) }), at(15)), "You haven't exported a backup yet. Progress lives in this browser only.");
    assert.equal(M.shouldNudge(save({ since: at(1), lastExportAt: at(10) }), at(15), false), false, 'lastExportAt wins over since');
    for (const b of [undefined, {}, { since: -1, lastExportAt: 'x' }, 'x', null]) assert.equal(M.shouldNudge(save(b), at(30), false), false, JSON.stringify(b));
  }));
  test('nudge: "Not now" holds it back 14 days; the save-failed banner hides it', () => inTZ('America/New_York', () => {
    const b = { since: at(1) };
    assert.equal(M.shouldNudge(save({ ...b, nudgeAt: at(20) }), at(30), false), false, '10 days after Not now');
    assert.equal(M.shouldNudge(save({ ...b, nudgeAt: at(20) }), at(34), false), true, '14 days after Not now');
    assert.equal(M.shouldNudge(save({ ...b, nudgeAt: 'x' }), at(20), false), true, 'malformed nudgeAt = never');
    assert.equal(M.shouldNudge(save(b), at(20), true), false);
  }));
  test('progress: a tick or Lv 2+; Lv 1 with no ticks is not progress', () => inTZ('America/New_York', () => {
    const b = { since: at(1) };
    assert.equal(M.shouldNudge(save(b, { checks: {}, level: 1 }), at(20), false), false);
    assert.equal(M.shouldNudge(save(b, { checks: { 'g6:0': false }, level: 1 }), at(20), false), false);
    assert.equal(M.shouldNudge(save(b, { checks: {}, level: 2 }), at(20), false), true);
    assert.equal(M.shouldNudge(save(b, { checks: { 'g6:0': true }, level: 1 }), at(20), false), true);
    assert.equal(M.hasProgress({ checks: {} }), false);
  }));
  test('hint: iPhone / iPod Safari only, not from the Home Screen, with progress, until Got it', () => {
    const s = save({ since: 1 });
    for (const k of ['iphone', 'ipod']) assert.equal(M.shouldHint(s, 0, { ua: UA[k], standalone: false }), true, k);
    for (const k of ['chromeIOS', 'firefoxIOS', 'edgeIOS', 'inApp', 'gsa', 'ipad', 'desktop']) assert.equal(M.shouldHint(s, 0, { ua: UA[k], standalone: false }), false, k);
    assert.equal(M.shouldHint(s, 0, { ua: UA.iphone, standalone: true }), false, 'standalone');
    assert.equal(M.shouldHint(s, 0, { ua: UA.iphone }), true, 'navigator.standalone undefined');
    assert.equal(M.shouldHint(save({ since: 1, a2hsAt: 5 }), 0, { ua: UA.iphone }), false, 'Got it');
    assert.equal(M.shouldHint(save({ since: 1 }, { checks: {}, level: 1 }), 0, { ua: UA.iphone }), false, 'no progress');
  });
  test('one card at a time: the nudge wins over the hint', () => inTZ('America/New_York', () => {
    const env = { ua: UA.iphone };
    assert.equal(M.pickNote(save({ since: at(1) }), at(20), env, false), 'nudge');
    assert.equal(M.pickNote(save({ since: at(1) }), at(5), env, false), 'hint');
    assert.equal(M.pickNote(save({ since: at(1) }), at(20), { ua: UA.desktop }, false), 'nudge');
    assert.equal(M.pickNote(save({ since: at(1), a2hsAt: 1 }), at(5), env, false), null);
  }));
  test('storage: markExport sets lastExportAt only; a malformed backup becomes an object', () => {
    const s = save({ since: 10, nudgeAt: 20 }); M.markExport(s, 99); assert.deepEqual(s.backup, { since: 10, nudgeAt: 20, lastExportAt: 99 });
    for (const bad of [undefined, 'x', [1], null]) { const t = save(bad); M.markExport(t, 99); assert.deepEqual(t.backup, { lastExportAt: 99 }, JSON.stringify(bad)); }
  });
  test('storage: import ignores the file\'s backup, counts as a backup and marks backup1 done', () => {
    const d = { checks: {}, backup: { since: 1, lastExportAt: 2, nudgeAt: 3, a2hsAt: 4 } }; M.importBackup(d, 500);
    assert.deepEqual(d, { checks: {}, backup: { since: 500, lastExportAt: 500 }, backup1: true });
  });
};
