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
/* Offline support (standalone site only; never in the claude.ai build). Secure contexts only: https or localhost. */
if ("serviceWorker" in navigator && (location.protocol === "https:" || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname))) {
  addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
}
