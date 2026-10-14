F='assassin-route.html'
s=open(F,encoding='utf-8').read()
def once(old,new):
    global s
    c=s.count(old); assert c==1,(c,old[:90]); s=s.replace(old,new)
css='''/* ---- E1 (Oct 2026) ---- */
/* "Not in game yet" on regional quests: milestone rows (text pill) and Next up rows (shows on hover/focus; always on touch). */
.q-snz { flex: none; margin: 10px 10px 0 0; font: 600 10.5px var(--mono); padding: 3px 8px; border-radius: 999px; border: 1px solid var(--line); background: transparent; color: var(--muted); cursor: pointer; white-space: nowrap; }
.q-snz:hover { color: var(--fg); border-color: var(--muted); }
.q-snz[aria-pressed="true"] { color: #e6b450; border-color: color-mix(in srgb, #e6b450 50%, transparent); }
.q-snz[hidden] { display: none; }
#gates li.qrow.snoozed .txt { color: var(--muted); }
body.basic #gates .q-snz { display: none; }
#nowStar .ql .q-snz { margin: 0 0 0 2px; padding: 0 5px; font-size: 9.5px; line-height: 15px; opacity: 0; }
#nowStar .ql:hover .q-snz, #nowStar .ql:focus-within .q-snz { opacity: 1; }
@media (hover: none) { #nowStar .ql .q-snz { opacity: .8; } }
/* Stigma pick: the hero name is a select that reads like the name. */
#stCard .st-pick { appearance: none; -webkit-appearance: none; max-width: 100%; margin: 0; padding: 0 16px 0 0; border: 0; border-radius: 0; background: transparent; color: var(--fg); font: inherit; line-height: inherit; cursor: pointer;
  background-image: linear-gradient(45deg, transparent 50%, var(--muted) 50%), linear-gradient(135deg, var(--muted) 50%, transparent 50%); background-position: right 5px top 8px, right 1px top 8px; background-size: 4px 4px; background-repeat: no-repeat;
  text-decoration: underline dotted color-mix(in srgb, var(--muted) 70%, transparent); text-underline-offset: 3px; }
#stCard .st-pick:hover { color: var(--accent); }
#stCard .st-pick:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 3px; }
#stCard .st-pick option { color: var(--fg); background: var(--panel); font-weight: 600; }
/* Toast with an Undo button. */
#rwToast.has-undo { pointer-events: auto; display: flex; align-items: center; gap: 10px; }
#rwToast.has-undo.show { animation-duration: 6s; }
#rwToast .tu { font: 600 12px var(--mono); padding: 2px 9px; border-radius: 6px; border: 1px solid var(--line); background: var(--panel-2); color: var(--accent); cursor: pointer; }
/* Skills card past the plan, in both modes. */
#spCard .spdone small a { color: inherit; text-underline-offset: 2px; }
body.basic #spCard .spdone small a { pointer-events: none; text-decoration: none; }
body.basic #spCard .sphint.warn { display: block !important; }
.lvlup-btn:disabled { filter: grayscale(.85); opacity: .5; cursor: default; box-shadow: none; transform: none; }
/* Export / import progress (footer). */
.xfer { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; font-size: 13px; color: var(--muted); padding: 0 4px; }
.xfer .xfer-btn { font: 600 12px var(--mono); padding: 5px 11px; border-radius: 8px; border: 1px solid var(--line); background: var(--panel); color: var(--fg); cursor: pointer; text-decoration: none; }
.xfer .xfer-btn:hover { border-color: var(--accent); }
.xfer .xfer-btn:focus-within { outline: 2px solid var(--accent); outline-offset: 2px; }
.xfer-msg:empty { display: none; }
.xfer-msg button { margin-left: 8px; font: 600 12px var(--mono); padding: 3px 9px; border-radius: 6px; border: 1px solid var(--line); background: var(--panel-2); color: var(--fg); cursor: pointer; }
.xfer-msg button.go { border-color: var(--warn); color: var(--warn); }
/* Pointer targets of at least 24 px around the small round controls, without changing how they look. */
.tip, .tipbtn, #nowStar .q-cb, #stCard .st-lvctl button { position: relative; }
.tip::before, .tipbtn::before, #nowStar .q-cb::before, #stCard .st-lvctl button::before { content: ""; position: absolute; inset: -5px; }
/* Phones: a slimmer Build tab so it clears the cards' right edge. */
@media (max-width: 600px) { .sd-tab { padding: 8px 3px; gap: 4px; font-size: 8.5px; letter-spacing: .1em; } .sd-tab .sd-chev { font-size: 11px; } }
</style>'''
once('</style>', css)
# Footer export/import
once('''  </footer>''','''    <div class="xfer" id="xfer"><span>Progress is saved in this browser only.</span>
      <a class="xfer-btn" id="expBtn" href="#" download="aion2-assassin-progress.json">Export progress</a>
      <label class="xfer-btn">Import progress<input type="file" id="impIn" accept=".json,application/json" hidden></label>
      <span class="xfer-msg" id="xferMsg" role="status"></span></div>
  </footer>''')
once('''      <p class="muted" style="margin:12px 0 0">Progress is saved in this browser only.</p>
''','')
# JS for export/import + drawer focus
once('''const btnReset = document.getElementById("btnReset");''','''/* Export / import progress: localStorage is the only copy, so offer a JSON file download and upload (P2-9). */
document.getElementById("expBtn").addEventListener("click", e => {
  const a = e.currentTarget; if (a.href.startsWith("blob:")) URL.revokeObjectURL(a.href);
  a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 1)], { type: "application/json" }));
  a.download = `aion2-assassin-progress-${new Date().toISOString().slice(0, 10)}.json`;
});
document.getElementById("impIn").addEventListener("change", async e => {
  const f = e.target.files && e.target.files[0], msg = document.getElementById("xferMsg"); e.target.value = ""; if (!f) return;
  let data = null; try { data = JSON.parse(await f.text()); } catch (err) { /* not JSON */ }
  if (!data || typeof data !== "object" || typeof data.checks !== "object" || !data.checks) { msg.textContent = "That file isn't a progress export."; return; }
  const n = Object.values(data.checks).filter(Boolean).length;
  msg.innerHTML = `Replace your progress with this file (Lv ${+data.level || "?"}, ${n} ticks)? <button type="button" class="go" id="impGo">Replace</button><button type="button" id="impNo">Cancel</button>`;
  document.getElementById("impNo").onclick = () => { msg.textContent = ""; };
  document.getElementById("impGo").onclick = () => {
    /* The progress being replaced is kept one step back under a separate key. Imported files never re-run the one-time seeds. */
    try { localStorage.setItem(KEY + ":before-import", JSON.stringify(state)); } catch (err) {}
    Object.assign(data, { seedLv12: true, stTriniel1: true, dvReset1: true });
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (err) { msg.textContent = "Couldn't save in this browser."; return; }
    location.reload();
  };
});
const btnReset = document.getElementById("btnReset");''')
once('''  const set = o => { const was = d.classList.contains("open"); d.classList.toggle("open", o); tab.setAttribute("aria-expanded", String(o)); state.statOpen = o;''','''  const set = o => { const was = d.classList.contains("open"); d.classList.toggle("open", o); tab.setAttribute("aria-expanded", String(o)); state.statOpen = o;
    /* Focus moves into the panel when it opens and back to the tab when it closes. */
    if (o && !was) requestAnimationFrame(() => document.getElementById("sdClose").focus({ preventScroll: true }));
    if (!o && was && d.contains(document.activeElement)) tab.focus({ preventScroll: true });''')
open(F,'w',encoding='utf-8').write(s); print('ok')
