/* Route rules (0.4 P4c: moved verbatim from src/main.js; markup route.html): the STEPS cards, drawn with the milestone
   cards' cardHTML (rows of a kind the pack lists by its row renderers, 0.4 P5b), and their counts. */
import { cardHTML } from "./milestones.js";
import { pageState as state, pageUpdate as update, pageSTEPS as STEPS, pageCounts as counts } from "./page.js";

/* the cards: render() draws them on every call, after the milestone cards */
function renderRoute() {
  const stepsEl = document.getElementById("steps");
  stepsEl.innerHTML = STEPS.map((s, i) => cardHTML(s, i + 1, "")).join("");
}
function updateRoute() {
  let total = 0, done = 0; /* kept from update(), where they summed the milestones too (unused) */
  STEPS.forEach(s => {
    const d = document.getElementById(s.id), [c, n] = counts(s);
    total += n; done += c;
    d.querySelector(".count").textContent = `${c}/${n}`;
    d.querySelector(".bar span").style.width = (n ? c / n * 100 : 100) + "%";
    d.classList.toggle("done", c === n);
    if (state.open[s.id] !== undefined) d.open = state.open[s.id];
  });
}

const routeRulesCard = { id: "route", slot: "foot", order: 100, root: "routeCard", mount: null, update: () => updateRoute() };
export { renderRoute, routeRulesCard };
