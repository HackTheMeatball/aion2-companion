/* Ascension (0.4 P4c: moved verbatim from src/main.js): the bar under the Journey card's story timeline (#asc). An
   AION 2 section of the Journey card (P5c makes it a pack section); drawn by the Skills card (renderNext), so it
   registers with update: null. */
import { char } from "../../../core/state.js";
import { gateChangeOn } from "../../../core/requirements.js";
import { ascensionOf } from "../ascension.js";
import { aion2State as state } from "./page.js";

/* Ascension bar (0.3 E8, design §11): under the story timeline, one segment per in-cap chapter, filled when it is done
   (ticked or derived from its wrapper quest); the label (the bar's aria-describedby) names the next chapter and, where
   sourced, the gauge. Informational only. */
function renderAscension() {
  const el = document.getElementById("asc");
  el.hidden = !gateChangeOn("ascensionBar"); if (el.hidden) { el.innerHTML = ""; return; }
  const a = ascensionOf(char(state));
  el.innerHTML = `<div class="asc-bar" role="progressbar" aria-label="Ascension" aria-valuemin="0" aria-valuemax="${a.total}" aria-valuenow="${a.n}" aria-valuetext="${a.n} of ${a.total} chapters done" aria-describedby="ascTxt">${a.chapters.map(x => `<span${x.done ? ' class="on"' : ""} title="${x.name}${x.done ? " · done" : ""}"></span>`).join("")}</div><small class="asc-txt" id="ascTxt">${a.label}</small>`;
}

const aion2AscensionCard = { id: "ascension", slot: "rail", order: 400, root: "asc", mount: null, update: null };
export { renderAscension, aion2AscensionCard };
