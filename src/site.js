/* Ask the browser to keep this site's storage, so the progress in localStorage isn't evicted (Safari / iOS can clear it
   after 7 days without a visit). Standalone site only. Chrome, Edge and Safari decide without asking; Firefox may show a
   prompt (it remembers Allow / Don't allow), so this runs only when the page loaded saved progress (not on a first
   visit) and at most once per browser session (a sessionStorage flag; nothing is added to localStorage). */
(async () => {
  const st = navigator.storage;
  if (!st || typeof st.persist !== "function" || typeof st.persisted !== "function") return;
  try {
    if (!hadSave || sessionStorage.getItem(KEY + ":persist-asked") || await st.persisted()) return; /* hadSave: progress existed at load */
    sessionStorage.setItem(KEY + ":persist-asked", "1");
    await st.persist();
  } catch (e) { /* storage unavailable: nothing to protect */ }
})();
/* Save safety (0.2.5, docs/design/0.2.5-save-safety.md): the "Last backup" line in the export row, and one card per
   visit under the header: the export nudge (14 days without an export) or, failing that, the one-time Add to Home
   Screen hint in iPhone Safari. The markup is web-only; the rules are src/core/backup.js, whose helpers are page globals
   from main.js's bundle (like state, storeState, hadSave and KEY here). main.js records the export itself (markExport). */
(() => {
  if (window.claude) return;
  const $ = id => document.getElementById(id);
  const line = $("backupLine"), nudge = $("nudge"), hint = $("a2hs"), warn = $("saveWarn"), exp = $("expBtn");
  if (!line || !nudge || !hint || !exp) return;
  const failed = () => !!warn && !warn.hidden;
  /* the card is picked once, at load: the nudge wins and the hint waits for a later visit */
  const which = pickNote(state, Date.now(), { ua: navigator.userAgent, standalone: navigator.standalone === true }, false);
  const refresh = () => {
    const now = Date.now(), l = backupLine(state, now);
    line.textContent = l.text; line.classList.toggle("stale", l.stale);
    if (which !== "nudge") return;
    /* hidden while the save-failed banner shows (it already says "Export a backup"), gone after an export or Not now */
    const on = !failed() && shouldNudge(state, now, false);
    if (on) $("nudgeTxt").textContent = nudgeText(state, now);
    nudge.hidden = !on;
  };
  /* main.js's Export handler runs first (registered earlier) and records the time, so the line and the card follow it */
  exp.addEventListener("click", refresh);
  $("nudgeExp").addEventListener("click", () => exp.click());
  $("nudgeNo").addEventListener("click", () => { setBackupTime(state, "nudgeAt", Date.now()); storeState(); refresh(); });
  /* the hint stays after Export (Share and Add to Home Screen come next) until Got it, which retires it for good */
  $("a2hsExp").addEventListener("click", () => exp.click());
  $("a2hsOk").addEventListener("click", () => { setBackupTime(state, "a2hsAt", Date.now()); storeState(); hint.hidden = true; });
  if (warn) new MutationObserver(refresh).observe(warn, { attributes: true, attributeFilter: ["hidden"] });
  hint.hidden = which !== "hint";
  refresh();
})();
/* Offline support (standalone site only; never in the claude.ai build). Secure contexts only: https or localhost. */
if ("serviceWorker" in navigator && (location.protocol === "https:" || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname))) {
  addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
}
