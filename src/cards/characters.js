/* The character switcher (0.5 P18; design docs/design/0.5-characters-mockup.md, S2): one button in the header shows the
   current character's label (labelOf: <name>-<class>-lvl<level>) and opens the list of the characters, current one marked,
   with "New character" (a name, optional, and a class from the pack's playable classes, packClasses). Each row has
   Rename (a field in place of the row) and Remove (a confirmation that names the character; not offered for the last
   one) (0.5 P19). Markup in src/cards/characters.html, put in the header by the build's @card line.

   The card changes no save itself: picking another character calls the shell's onSwitch(id), the form calls
   onAdd({ class, name }), Save name onRename(id, name), the confirmed Remove onRemove(id); the shell builds the new save
   with src/core/chars.js, stores it and reloads, so every card is drawn for the character from the start. The name and the label are shown here and kept in the save only: never in a
   key, a file name, a URL, a log or the page title (docs/ARCHITECTURE.md §1). */
import { labelOf } from "../core/state.js";
import { NAME_MAX, cleanName } from "../core/chars.js";
import { packClasses } from "../core/pack.js";

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* the card spec; the shell hands over what a pick does (onSwitch(id), onAdd({ class, name })) */
export function charactersCard({ onSwitch, onAdd, onRename, onRemove }) {
  let el = null, btn = null, pop = null, list = null, form = null, dlg = null, last = null;
  /* the slot whose name is being edited in the list, and the slot the confirmation asks about (null: none) */
  let editing = null, removing = null;
  const $ = id => el.querySelector("#" + id);
  const isOpen = () => !pop.hidden;
  /* the button: the label, and the whole label in its spoken name (the visible text may be cut with an ellipsis) */
  const drawButton = state => {
    const l = labelOf(state.chars[state.current]);
    $("charLbl").textContent = l;
    btn.setAttribute("aria-label", `Character: ${l}. Switch character`);
  };
  /* one row per character, in save order; the current one is marked (✓, aria-current). Rename and Remove carry the label
     in their spoken names; Remove is left out while there is one character (the last one is never removed). The row
     being renamed is the rename field instead. */
  const drawRows = state => {
    const all = Object.values(state.chars), many = all.length > 1;
    $("charRows").innerHTML = all.map(c => {
      const cur = c.id === state.current, l = esc(labelOf(c)), id = esc(c.id);
      if (c.id === editing) return `<li class="chedit"><form class="chform" id="charRenForm"><div class="chfld"><label for="charRen">Rename <b>${l}</b></label><input type="text" id="charRen" autocomplete="off" spellcheck="false" value="${esc(c.name || "")}" aria-describedby="charRenHint"><span class="chhint" id="charRenHint">Leave empty to show no name. Up to ${NAME_MAX} characters.</span></div><div class="chbtns"><button type="button" id="charRenCancel">Cancel</button><button type="submit" class="primary" id="charRenSave">Save name</button></div></form></li>`;
      return `<li${cur ? ' class="cur"' : ""}><button type="button" class="chrow${cur ? " cur" : ""}" data-char="${id}"${cur ? ' aria-current="true"' : ""}><span class="tick" aria-hidden="true">${cur ? "✓" : ""}</span><span class="lbl">${l}</span></button>`
        + `<button type="button" class="chact" data-rename="${id}" aria-label="Rename ${l}">Rename</button>`
        + (many ? `<button type="button" class="chact warn" data-remove="${id}" aria-label="Remove ${l}">Remove</button>` : "") + `</li>`;
    }).join("");
  };
  const rowBtn = (attr, id) => [...el.querySelectorAll(`[${attr}]`)].find(b => b.getAttribute(attr) === id);
  /* rename: the row becomes the field (focus in it, text selected); Cancel / Escape go back to the row's Rename */
  const editRow = id => {
    editing = id; drawRows(last.state);
    if (id) { const i = $("charRen"); i.focus(); i.select(); }
  };
  const endEdit = () => { const id = editing; editRow(null); const b = rowBtn("data-rename", id); if (b) b.focus(); };
  /* the confirmation (a modal dialog) names the character; "Keep it" comes first and has the focus */
  const askRemove = id => {
    removing = id;
    $("charDlgHead").textContent = `Remove ${labelOf(last.state.chars[id])}?`;
    dlg.showModal(); $("charKeep").focus();
  };
  const endRemove = () => {
    if (!dlg.open) return;
    const id = removing; removing = null; dlg.close();
    const b = rowBtn("data-remove", id); if (b) b.focus();
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
    editing = null; drawRows(last.state); showForm(false);
    pop.hidden = false; btn.setAttribute("aria-expanded", "true"); el.classList.add("open");
  };
  /* close the list (and the form); focus goes back to the button when it was inside the card */
  const close = (focus = false) => {
    if (!isOpen()) return;
    endRemove(); editing = null;
    pop.hidden = true; btn.setAttribute("aria-expanded", "false"); el.classList.remove("open"); showForm(false);
    if (focus) btn.focus();
  };
  return {
    id: "characters", slot: "main", order: 50, root: "charCard",
    mount(root, ctx) {
      el = root; last = ctx; btn = $("charBtn"); pop = $("charPop"); list = $("charList"); form = $("charForm"); dlg = $("charDlg");
      $("charNameHint").textContent = `Shown on screen and kept in your save only. Up to ${NAME_MAX} characters.`;
      btn.addEventListener("click", () => { if (isOpen()) close(); else open(); });
      $("charRows").addEventListener("click", e => {
        const r = e.target.closest("[data-rename]"); if (r) { editRow(r.dataset.rename); return; }
        const x = e.target.closest("[data-remove]"); if (x) { askRemove(x.dataset.remove); return; }
        if (e.target.closest("#charRenCancel")) { endEdit(); return; }
        const b = e.target.closest("[data-char]"); if (!b) return;
        if (b.dataset.char === last.state.current) { close(true); return; }
        onSwitch(b.dataset.char);
      });
      $("charNew").addEventListener("click", () => showForm(true));
      $("charCancel").addEventListener("click", () => { showForm(false); $("charNew").focus(); });
      $("charName").addEventListener("input", preview);
      form.addEventListener("change", preview);
      form.addEventListener("submit", e => { e.preventDefault(); onAdd({ class: picked(), name: $("charName").value }); });
      $("charRows").addEventListener("submit", e => { e.preventDefault(); if (editing) onRename(editing, $("charRen").value); });
      $("charKeep").addEventListener("click", endRemove);
      $("charRemove").addEventListener("click", () => { if (removing) onRemove(removing); });
      /* Escape steps back one level from anywhere in the card: the confirmation closes (focus on that row's Remove), the
         rename field goes back to its row (focus on its Rename), else the list closes (focus on the button); a click
         outside the card closes the list */
      dlg.addEventListener("cancel", e => { e.preventDefault(); endRemove(); });
      el.addEventListener("keydown", e => {
        if (e.key !== "Escape" || !isOpen()) return;
        e.preventDefault(); e.stopPropagation();
        if (dlg.open) endRemove(); else if (editing) endEdit(); else close(true);
      });
      /* (the path, not el.contains: a click on Rename or Cancel redraws the rows, so its target is no longer in the page) */
      document.addEventListener("click", e => { if (isOpen() && !e.composedPath().includes(el)) close(); });
      drawButton(ctx.state);
    },
    update(ctx) {
      last = ctx; if (!el) return;
      drawButton(ctx.state);
      if (isOpen() && !list.hidden && !editing) drawRows(ctx.state);
    },
  };
}
