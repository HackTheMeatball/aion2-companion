/* The card registry (0.4 P4a, pure: no DOM; docs/design/0.4-engine-contract.md §4). A card is a spec the shell registers
   once: where it sits (slot), when it is called (order), the DOM id of its outer element (root, which the shell looks up
   and hands back to mount), the sections other cards may fill, and its mount (once, from render()) and update (every
   update(); null = mount only). Card modules export specs and never register at import time; the shell registers them.

   Order rule: mountAll and updateAll walk the slots in CARD_SLOTS order and the cards of a slot in ascending order; the
   cards of a section ("<cardId>.<section>") run right after their card. order decides the call order only, never the
   DOM position (the markup's place in src/index.html does). An unknown slot, a duplicate id, a duplicate order in a
   slot or a section its card doesn't declare throws at registration. */

export const CARD_SLOTS = ["rail", "top", "main", "foot", "drawer"];
const cardFnOk = f => f === undefined || f === null || typeof f === "function";

/* A registry of its own (the page uses the one below; the core suite makes fresh ones). */
export function cardRegistry() {
  const specs = new Map(), mounted = new Set();
  /* the cards of a slot (a page slot or a section slot), in call order */
  const inSlot = slot => [...specs.values()].filter(s => s.slot === slot).sort((a, b) => a.order - b.order);
  /* every card in call order: slot by slot, each card followed by its sections' cards (and theirs) */
  const walk = slot => inSlot(slot).flatMap(s => [s, ...s.sections.flatMap(n => walk(s.id + "." + n))]);
  const callOrder = () => CARD_SLOTS.flatMap(walk);
  const register = spec => {
    const { id, slot, order, root = null, sections = [], mount = null, update = null } = spec || {};
    if (typeof id !== "string" || !id) throw new Error("registerCard: a card needs an id");
    if (specs.has(id)) throw new Error(`registerCard: "${id}" is registered twice`);
    if (!Number.isFinite(order)) throw new Error(`registerCard: "${id}" needs a numeric order`);
    if (!cardFnOk(mount) || !cardFnOk(update)) throw new Error(`registerCard: "${id}": mount and update are functions or null`);
    if (!Array.isArray(sections) || sections.some(n => typeof n !== "string" || !n)) throw new Error(`registerCard: "${id}": sections are names`);
    if (!CARD_SLOTS.includes(slot)) {
      const [owner, section, ...rest] = String(slot).split(".");
      const host = specs.get(owner);
      if (rest.length || !section || !host || !host.sections.includes(section)) throw new Error(`registerCard: "${id}": unknown slot "${slot}"`);
    }
    if (inSlot(slot).some(s => s.order === order)) throw new Error(`registerCard: "${id}": order ${order} is taken in slot "${slot}"`);
    const s = Object.freeze({ id, slot, order, root, sections: Object.freeze([...sections]), mount, update });
    specs.set(id, s);
    return s;
  };
  const card = id => { const s = specs.get(id); if (!s) throw new Error(`card "${id}" is not registered`); return s; };
  return {
    register,
    /* the registered specs in call order (the shell reads their roots to resolve the elements) */
    cards: callOrder,
    /* mount each card not mounted yet, with els[root] (null when the card has no root) */
    mountAll(els, ctx) {
      for (const s of callOrder()) {
        if (mounted.has(s.id)) continue;
        mounted.add(s.id);
        if (s.mount) s.mount(s.root ? els[s.root] : null, ctx);
      }
    },
    updateAll(ctx) { for (const s of callOrder()) if (s.update) s.update(ctx); },
    /* one card's update, where its old call stood in the shell (while cards move, P4a–P4c) */
    updateCard(id, ctx) { const s = card(id); if (s.update) s.update(ctx); },
  };
}

const PAGE_CARDS = cardRegistry();
export const registerCard = spec => PAGE_CARDS.register(spec);
export const registeredCards = () => PAGE_CARDS.cards();
export const mountAll = (els, ctx) => PAGE_CARDS.mountAll(els, ctx);
export const updateAll = ctx => PAGE_CARDS.updateAll(ctx);
export const updateCard = (id, ctx) => PAGE_CARDS.updateCard(id, ctx);
