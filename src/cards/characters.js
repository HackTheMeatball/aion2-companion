/* The character switcher (0.5 P18; design docs/design/0.5-characters-mockup.md, S2): one button in the header shows the
   current character's label (labelOf: <name>-<class>-lvl<level>) and opens the list of the characters, current one marked,
   with "New character" (a name, optional, and a class from the pack's playable classes, packClasses). Markup in
   src/cards/characters.html, put in the header by the build's @card line.

   The card changes no save itself: picking another character calls the shell's onSwitch(id), the form calls
   onAdd({ class, name }); the shell builds the new save with src/core/chars.js, stores it and reloads, so every card is
   drawn for the character from the start. The name and the label are shown here and kept in the save only: never in a
   key, a file name, a URL, a log or the page title (docs/ARCHITECTURE.md §1). */
import { labelOf } from "../core/state.js";
import { NAME_MAX, cleanName } from "../core/chars.js";
import { packClasses } from "../core/pack.js";

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* the card spec; the shell hands over what a pick does (onSwitch(id), onAdd({ class, name })) */
export function charactersCard({ onSwitch, onAdd }) {
  let el = null, btn = null, pop = null, list = null, form = null, last = null;
  const $ = id => el.querySelector("#" + id);
  const isOpen = () => !pop.hidden;
  /* the button: the label, and the whole label in its spoken name (the visible text may be cut with an ellipsis) */
  const drawButton = state => {
    const l = labelOf(state.chars[state.current]);
    $("charLbl").textContent = l;
    btn.setAttribute("aria-label", `Character: ${l}. Switch character`);
  };
  /* one row per character, in save order; the current one is marked (✓, aria-current) */
  const drawRows = state => {
    $("charRows").innerHTML = Object.values(state.chars).map(c => {
      const cur = c.id === state.current;
      return `<li><button type="button" class="chrow${cur ? " cur" : ""}" data-char="${esc(c.id)}"${cur ? ' aria-current="true"' : ""}><span class="tick" aria-hidden="true">${cur ? "✓" : ""}</span><span class="lbl">${esc(labelOf(c))}</span></button></li>`;
    }).join("");
  };
  /* the class picker: one radio per playable class, the first one picked */
  const drawPick = () => {
    $("charPick").innerHTML = packClasses().map((x, i) => `<label class="chopt"><input type="radio" name="charClass" value="${esc(x.class)}"${i ? "" : " checked"}><span>${esc(x.name)}</span></label>`).join("");
  };
  const picked = () => { const r = form.querySelector('input[name="charClass"]:checked'); return r ? r.value : packClasses()[0].class; };
  /* the label the new character will have (Lv 1, the name as it will be kept) */
  const preview = () => { $("charPrev").textContent = labelOf({ name: cleanName($("charName").value), class: picked(), level: 1 }); };
  const showForm = on => {
    list.hidden = on; form.hidden = !on;
    if (on) { form.reset(); drawPick(); preview(); $("charName").focus(); }
  };
  const open = () => {
    drawRows(last.state); showForm(false);
    pop.hidden = false; btn.setAttribute("aria-expanded", "true"); el.classList.add("open");
  };
  /* close the list (and the form); focus goes back to the button when it was inside the card */
  const close = (focus = false) => {
    if (!isOpen()) return;
    pop.hidden = true; btn.setAttribute("aria-expanded", "false"); el.classList.remove("open"); showForm(false);
    if (focus) btn.focus();
  };
  return {
    id: "characters", slot: "main", order: 50, root: "charCard",
    mount(root, ctx) {
      el = root; last = ctx; btn = $("charBtn"); pop = $("charPop"); list = $("charList"); form = $("charForm");
      $("charNameHint").textContent = `Shown on screen and kept in your save only. Up to ${NAME_MAX} characters.`;
      btn.addEventListener("click", () => { if (isOpen()) close(); else open(); });
      $("charRows").addEventListener("click", e => {
        const b = e.target.closest("[data-char]"); if (!b) return;
        if (b.dataset.char === last.state.current) { close(true); return; }
        onSwitch(b.dataset.char);
      });
      $("charNew").addEventListener("click", () => showForm(true));
      $("charCancel").addEventListener("click", () => { showForm(false); $("charNew").focus(); });
      $("charName").addEventListener("input", preview);
      form.addEventListener("change", preview);
      form.addEventListener("submit", e => { e.preventDefault(); onAdd({ class: picked(), name: $("charName").value }); });
      /* Escape closes from anywhere in the card and returns focus to the button; a click outside it closes it */
      el.addEventListener("keydown", e => { if (e.key === "Escape" && isOpen()) { e.preventDefault(); e.stopPropagation(); close(true); } });
      document.addEventListener("click", e => { if (isOpen() && !el.contains(e.target)) close(); });
      drawButton(ctx.state);
    },
    update(ctx) {
      last = ctx; if (!el) return;
      drawButton(ctx.state);
      if (isOpen() && !list.hidden) drawRows(ctx.state);
    },
  };
}
