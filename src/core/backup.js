/* Save safety (0.2.5, pure: no DOM, no storage, no clock; docs/design/0.2.5-save-safety.md). The save's optional
   `backup` object holds this browser's backup times, epoch ms: lastExportAt (an export was handed to the browser),
   since (the baseline for a player who never exported: set by the backup1 step or by import), nudgeAt ("Not now" on the
   export nudge), a2hsAt ("Got it" on the Home Screen hint). Absent or not a finite positive number = never. It is a
   top-level field like the view settings, not a character field and not synced (src/core/sync.js). The site's own
   script (src/site.js) shows the "Last backup" line, the nudge and the hint from these helpers; the claude.ai build has
   none of that UI, only the shared storage side (markExport, importBackup, the backup1 step). */
import { char } from "./state.js";

export const NUDGE_DAYS = 14;
const okBackupTime = v => typeof v === "number" && Number.isFinite(v) && v > 0;

/* The save's backup object (null when absent or malformed), and one of its times (0 = never). */
export const backupOf = save => save.backup && typeof save.backup === "object" && !Array.isArray(save.backup) ? save.backup : null;
export const backupTime = (save, f) => { const b = backupOf(save); return b && okBackupTime(b[f]) ? b[f] : 0; };

/* Whole calendar days from ms to now in the browser's time zone (local midnight to local midnight). The only day count:
   the line, its stale class, the nudge test, the nudgeAt test and the nudge's N all use it. A future time gives 0.
   Math.round absorbs the 23 h / 25 h days around a clock change. */
export function daysSince(ms, now) {
  const a = new Date(ms), b = new Date(now);
  const d = Math.round((new Date(b.getFullYear(), b.getMonth(), b.getDate()) - new Date(a.getFullYear(), a.getMonth(), a.getDate())) / 864e5);
  return d > 0 ? d : 0;
}

/* The footer line: { text, stale }. */
export function backupLine(save, now) {
  const t = backupTime(save, "lastExportAt");
  if (!t) return { text: "No backup yet.", stale: false };
  const n = daysSince(t, now);
  return { text: n === 0 ? "Last backup: today." : n === 1 ? "Last backup: yesterday." : `Last backup: ${n} days ago.`, stale: n >= NUDGE_DAYS };
}

/* Progress worth saving: a tick, or past Lv 1 (a fresh browser starts at Lv 1 on the first quest). */
export const hasProgress = save => { const c = char(save); return Object.values(c.checks || {}).some(Boolean) || (+c.level || 1) > 1; };

/* The export nudge: the save-failed banner isn't up, there is progress, 14 days since the last export (else since the
   baseline), and no "Not now" in the last 14 days. */
export function shouldNudge(save, now, saveFailed) {
  if (saveFailed || !hasProgress(save)) return false;
  const base = backupTime(save, "lastExportAt") || backupTime(save, "since");
  if (!base || daysSince(base, now) < NUDGE_DAYS) return false;
  const at = backupTime(save, "nudgeAt");
  return !at || daysSince(at, now) >= NUDGE_DAYS;
}
export function nudgeText(save, now) {
  const t = backupTime(save, "lastExportAt");
  return (t ? `You haven't exported a backup in ${daysSince(t, now)} days.` : "You haven't exported a backup yet.") + " Progress lives in this browser only.";
}

/* iPhone / iPod Safari, not opened from the Home Screen: the Safari/ token rules out in-app WebViews (no Add to Home
   Screen there); CriOS / FxiOS / EdgiOS are Chrome / Firefox / Edge on iOS. iPad is out of scope. */
export const isIPhoneSafari = ({ ua = "", standalone = false } = {}) =>
  /iPhone|iPod/.test(ua) && /Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua) && standalone !== true;
/* The Home Screen hint: iPhone Safari, progress, never dismissed. */
export const shouldHint = (save, now, env) => isIPhoneSafari(env) && hasProgress(save) && !backupTime(save, "a2hsAt");

/* Which card a visit shows: the nudge wins; the hint waits for a later visit. */
export const pickNote = (save, now, env, saveFailed) => shouldNudge(save, now, saveFailed) ? "nudge" : shouldHint(save, now, env) ? "hint" : null;

/* Storage side, shared by both builds: set one time in the save's backup object (made an object if malformed). */
export function setBackupTime(save, f, nowMs) {
  if (!backupOf(save)) save.backup = {};
  save.backup[f] = nowMs;
}
/* Export handed to the browser (main.js stores this before it builds the file, so the file equals the save). */
export const markExport = (save, nowMs) => setBackupTime(save, "lastExportAt", nowMs);
/* Import: the file's own backup is ignored (another device's nudgeAt / a2hsAt don't apply here); the import counts as a
   backup, and backup1 is marked done so the step doesn't run again on the imported save. */
export function importBackup(data, nowMs) { data.backup = { since: nowMs, lastExportAt: nowMs }; data.backup1 = true; }
