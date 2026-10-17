/* Dungeons & Strongholds (0.4 P4b: moved verbatim from src/main.js; markup areas.html): pick a level band; Sealed
   Dungeons and Strongholds with two-click clears, zones that fold when cleared, "Hide cleared". */
import { char } from "../../../core/state.js";
import { derivedOf, doneOf, gatesOf } from "../../../core/requirements.js";
import { NO_AREA, SD_REWARD, SH_REWARD, ZONE_TRACES } from "../data/areas.js";
import { T } from "../data/markup.js";
import { AREA_BANDS, AREA_ITEMS, bandOf } from "../catalog.js";
import { areaLater, areaOpen } from "../requirements.js";
import { mapFocus } from "./maps.js";
import { aion2State as state, aion2Save as save, aion2Update as update, aion2SMOOTH as SMOOTH, aion2DerivedBox as derivedBox } from "./page.js";

let areaSel = null; /* the band dropdown (#areaSel), looked up at mount */
/* Areas: pick a level band; Sealed Dungeons (at their recommended level) and Strongholds are listed together, flat
   (bands: src/packs/aion2/catalog.js). */
/* The band that holds your level; older bands with open clears show their count in the dropdown. */
function defaultBand() {
  return String(AREA_BANDS.filter(b => b <= char(state).level).pop() || AREA_BANDS[0]);
}
const SH_LV = it => it.lo === 1 && it.hi === 45 ? "any level" : it.lo === it.hi ? `Lv ${it.lo}` : `Lv ${it.lo}–${it.hi}`;
/* One entry point for every "show in Areas" link on the page: open the card, pick the band, scroll to it. */
function goAreas(band) {
  state.areasCollapsed = false; areaKeep = new Set();
  if (band != null) state.areaLv = String(band);
  save(); update();
  document.getElementById("areas").scrollIntoView({ behavior: SMOOTH(), block: "start" });
}
function renderAreas() {
  const lv = char(state).level, shOn = state.areaSh !== false, doneOn = state.areaDone !== false;
  /* done = ticked or derived (a stronghold a story quest clears, E9); derived rows show a disabled tick like the milestones' */
  const evA = gatesOf(char(state)), ad = x => doneOf(char(state), x.k, evA);
  const derive = () => document.querySelectorAll("#areaList input[data-k]").forEach(i => derivedBox(i, derivedOf(char(state), i.dataset.k, evA)));
  document.getElementById("areaShTog").checked = shOn;
  document.getElementById("areaDoneTog").checked = !doneOn;
  const vis = x => doneOn || !ad(x) || areaKeep.has(x.k);
  const opts = [...AREA_BANDS.map(String), "sh"];
  if (!opts.includes(state.areaLv)) state.areaLv = defaultBand();
  const allSh = state.areaLv === "sh";
  const inBand = v => v === "sh" ? AREA_ITEMS.filter(x => x.it.kind === "stronghold")
    : AREA_ITEMS.filter(x => bandOf(x) === +v && (shOn || x.it.kind !== "stronghold"));
  /* Open at or below your level: the same "behind" rule as the Progress card. */
  const behind = x => !ad(x) && areaOpen(char(state), x);
  areaSel.innerHTML = opts.map(v => {
    const xs = inBand(v), left = xs.filter(x => !ad(x)).length, bh = xs.filter(behind).length;
    const label = v === "sh" ? "All strongholds" : `Lv ${v}–${+v + 4}${+v > lv ? " (later)" : ""}`;
    return `${v === "sh" ? '<option disabled>──────────</option>' : ""}<option value="${v}"${v === state.areaLv ? " selected" : ""}>${label} · ${xs.length - left}/${xs.length}${left ? (bh && +v <= lv ? ` · ${bh} open` : "") : " ✓"}</option>`;
  }).join("");
  const cur = inBand(state.areaLv), curD = cur.filter(x => ad(x)).length, curB = cur.filter(behind).length;

  /* Sorted by zone so neighbours sit together. */
  const xs = cur.sort((a, b) => (allSh ? bandOf(a) - bandOf(b) : 0) || (a.area === NO_AREA) - (b.area === NO_AREA) || a.area.localeCompare(b.area) || a.it.name.localeCompare(b.it.name));
  const shs = xs.filter(x => x.it.kind === "stronghold"), sds = xs.filter(x => x.it.kind !== "stronghold");
  const mapIco = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s-6-5.6-6-11a6 6 0 1 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg>`;
  const row = x => {
    if (!vis(x)) return "";
    const it = x.it, done = !!ad(x), sh = it.kind === "stronghold", run = !done && !!(char(state).areaRun || {})[x.k];
    const later = areaLater(char(state), x);
    const sub = sh ? `${x.area} · ${SH_LV(it)}` : "";
    const href = mapFocus(it);
    /* Name is plain text (ticks on click); the pin on the right opens its map page. */
    return `<li class="item arow${done ? " rdone" : ""}${run ? " running" : ""}${later ? " locked" : ""}${sh ? "" : " grouped"}" data-showall="1"><label><input type="checkbox" data-k="${x.k}" ${done ? "checked" : ""} title="${done ? "Cleared · click to undo" : run ? "In progress · click when cleared" : "Click when you go in; click again when cleared"}"><span class="txt"><b>${it.name}</b>${run ? `<span class="run-tag">In progress</span>` : ""}${sub ? `<small title="${sub}">${sub}</small>` : ""}</span></label><a class="amap" href="${href}" target="_blank" rel="noopener" title="Show on the Altgard interactive map (Metabot)">${mapIco}</a></li>`;
  };
  /* Region header: bigger than the rows; a finished region folds shut (after a short beat, so the row you just
     ticked doesn't vanish under the cursor). Click the header to open or close any region. */
  const zoneOpen = (z, g) => {
    const rk = state.areaLv + "|" + z, ov = (state.zoneOpen || {})[rk], done = g.every(x => ad(x));
    return ov !== undefined ? !!ov : !done || !!(zoneJustDone[rk] && Date.now() - zoneJustDone[rk] < 700);
  };
  const zoneHead = (z, g, open) => {
    const gd = g.filter(x => ad(x)).length, tr = ZONE_TRACES[z], rk = state.areaLv + "|" + z;
    return `<li class="zone-h${gd === g.length ? " done" : ""}"><button type="button" class="zone-btn" data-zone="${rk}" aria-expanded="${open}"><span class="zchev" aria-hidden="true">${open ? "▾" : "▸"}</span>${z}</button>` +
      `${tr ? `<a class="ztr" href="https://metabot.gg/en/aion-2/map/altgard/empyrean-traces" target="_blank" rel="noopener" title="${tr} Empyrean Traces (feathers) in this zone: grab them while you're here">${tr} traces</a>` : ""}<span class="zn">${gd === g.length ? "✓ " : ""}${gd}/${g.length}</span></li>`;
  };
  const sec = (cls, title, tip, note, list, grouped) => {
    if (!list.length) return "";
    const d = list.filter(x => ad(x)).length;
    const body = grouped ? [...new Set(list.map(x => x.area))].map(z => { const g = list.filter(x => x.area === z), open = zoneOpen(z, g); return g.some(vis) ? zoneHead(z, g, open) + (open ? g.map(row).join("") : "") : ""; }).join("") : list.map(row).join("");
    return `<li class="asec ${cls}"><span class="asec-t">${title} ${T("", tip, `What are ${title}?`)}</span><span class="asec-n${d === list.length ? " done" : ""}">${d}/${list.length}</span></li><li class="sh-note">${note}</li>` +
      (body || `<li class="sh-note ok">All cleared${doneOn ? "" : " (hidden)"}.</li>`);
  };
  if (allSh) {
    const bands = [...new Set(shs.map(bandOf))];
    document.getElementById("areaList").innerHTML =
      `<li class="asec sh"><span class="asec-t">Strongholds ${T("", "stronghold", "What are Strongholds?")}</span><span class="asec-n${shs.every(x => ad(x)) ? " done" : ""}">${shs.filter(x => ad(x)).length}/${shs.length}</span></li><li class="sh-note">${SH_REWARD} each</li>` +
      bands.map(bd => { const g = shs.filter(x => bandOf(x) === bd), d = g.filter(x => ad(x)).length;
        if (!g.some(vis)) return "";
        return `<li class="shband${d === g.length ? " done" : ""}"><span>Lv ${bd}${bd > lv ? " (later)" : ""}</span><span>${d}/${g.length}</span></li>` + g.map(row).join(""); }).join("");
    derive();
    return;
  }
  document.getElementById("areaList").innerHTML =
    sec("sh", "Strongholds", "stronghold", SH_REWARD + " each", shs, false) +
    sec("sd" + (shs.length ? " split" : ""), "Sealed Dungeons", "hideout", SD_REWARD + " each", sds, true);
  document.querySelectorAll("#areaList li.running input[data-k]").forEach(i => { i.indeterminate = true; });
  derive();
}
/* Zones finished this moment stay open ~0.7s, then fold. */
const zoneJustDone = {};
/* Rows ticked while cleared rows are hidden stay until you change band or the toggle (no jumping). */
let areaKeep = new Set();
/* the card's handlers (from render(), once) */
function aion2AreasMount() {
  areaSel = document.getElementById("areaSel");
  /* Two clicks per clear: the first marks it "in progress" (you went in), the second marks it cleared. Clicking a
     cleared one undoes it. In-progress runs show at the top of Next up so you finish what you started. */
  document.getElementById("areaList").addEventListener("click", e => {
    const i = e.target.closest && e.target.closest("input[data-k]"); if (!i) return;
    const k = i.dataset.k; char(state).areaRun = char(state).areaRun || {};
    if (!char(state).checks[k] && !char(state).areaRun[k]) { e.preventDefault(); char(state).areaRun[k] = Date.now(); save(); update(); return; }
    if (char(state).areaRun[k]) delete char(state).areaRun[k];
  }, true);
  document.getElementById("areaList").addEventListener("change", e => {
    const k = e.target.dataset && e.target.dataset.k; if (!k || !e.target.checked) return;
    const x = AREA_ITEMS.find(y => y.k === k); if (!x || x.it.kind === "stronghold") return;
    const rk = state.areaLv + "|" + x.area;
    if (AREA_ITEMS.filter(y => y.area === x.area && bandOf(y) === bandOf(x) && y.it.kind !== "stronghold").every(y => y.k === k || char(state).checks[y.k])) {
      zoneJustDone[rk] = Date.now(); if (state.zoneOpen) delete state.zoneOpen[rk];
      setTimeout(() => { delete zoneJustDone[rk]; renderAreas(); }, 750);
    }
  }, true);
  document.getElementById("areaList").addEventListener("click", e => {
    const b = e.target.closest("[data-zone]"); if (!b) return;
    state.zoneOpen = state.zoneOpen || {}; state.zoneOpen[b.dataset.zone] = b.getAttribute("aria-expanded") !== "true";
    save(); renderAreas();
  });
  /* With "Hide cleared" on, a row you tick turns green, fades and folds away (~0.7s), then the list re-renders. */
  document.getElementById("areaList").addEventListener("change", e => {
    const k = e.target.dataset && e.target.dataset.k; if (!k || state.areaDone !== false) return;
    if (!e.target.checked) { areaKeep.delete(k); return; }
    areaKeep.add(k);
    setTimeout(() => { const li = document.querySelector(`#areaList input[data-k="${CSS.escape(k)}"]`); const row = li && li.closest("li"); if (row) row.classList.add("fading"); }, 30);
    setTimeout(() => { areaKeep.delete(k); renderAreas(); }, 750);
  }, true);
  document.getElementById("areaDoneTog").addEventListener("change", e => { areaKeep = new Set(); state.areaDone = !e.target.checked; save(); update(); });

  document.getElementById("areaShTog").addEventListener("change", e => { state.areaSh = e.target.checked; save(); update(); });
  areaSel.addEventListener("change", () => { areaKeep = new Set(); state.areaLv = areaSel.value; save(); update(); });
}

const aion2AreasCard = { id: "areas", slot: "rail", order: 300, root: "areas", mount: aion2AreasMount, update: () => renderAreas() };
export { renderAreas, goAreas, defaultBand, aion2AreasCard };
