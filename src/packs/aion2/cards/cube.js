/* The Cube (0.4 P4b: moved verbatim from src/main.js): the "waiting in your Cube" bars of the Skills and Daevanion
   cards (#spCube, #dvCube) and their "Used" buttons. No markup of its own. */
import { char } from "../../../core/state.js";
import { aion2State as state, aion2Save as save, aion2Update as update, aion2RewardToast as rewardToast } from "./page.js";

/* One-time clear rewards (CLEAR_REWARD, src/packs/aion2/catalog.js) wait in "the Cube" until you say you've used them. */
/* "Waiting in your Cube" bars on Skills / Daevanion: one click once you've used them in game adds them to the totals. */
function renderCube() {
  const sp = document.getElementById("spCube"), dv = document.getElementById("dvCube"), ps = char(state).pendSt || 0, pc = char(state).pendCr || 0;
  const bar = (n, what, id) => `<span class="cube-ico" aria-hidden="true">🎒</span><span class="cube-t"><b>${n} ${what}${n === 1 ? "" : "s"}</b> in Cube</span><button type="button" class="cube-btn" id="${id}">Used ✓</button>`;
  if (sp) { sp.hidden = !ps; sp.innerHTML = ps ? bar(ps, "stone", "spCubeBtn") : ""; }
  if (dv) { dv.hidden = !pc; dv.innerHTML = pc ? bar(pc, "crystal", "dvCubeBtn") : ""; }
}
function cubeClick(e) {
  if (e.target.closest("#spCubeBtn")) { char(state).stones = (char(state).stones || 0) + (char(state).pendSt || 0); char(state).pendSt = 0; save(); update(); rewardToast("Wisdom Stones added to your skill points"); }
  if (e.target.closest("#dvCubeBtn")) { char(state).dvTotal = (char(state).dvTotal || 0) + (char(state).pendCr || 0); char(state).pendCr = 0; save(); update(); rewardToast("Crystals added to your board total"); }
}
/* the Used buttons (from render(), once; the Next up pop-out adds cubeClick to its own document) */
function aion2CubeMount() {
  document.addEventListener("click", cubeClick);
}

const aion2CubeCard = { id: "cube", slot: "top", order: 300, root: null, mount: aion2CubeMount, update: () => renderCube() };
export { renderCube, cubeClick, aion2CubeCard };
