/* A random character slot id (save v5, src/core/state.js): crypto.randomUUID() where the page has it (secure contexts),
   else a version 4 UUID from crypto.getRandomValues (the site opened over plain http on a LAN address). Never derived
   from the name, class or level. The core takes it as a parameter (loadState's newId), so it stays free of browser APIs. */
export function newId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16)); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
  const h = [...b].map(x => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
