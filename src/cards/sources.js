/* The Confidence and Sources cards (0.4 P4a: moved verbatim from src/main.js's renderSources; markup in
   src/cards/sources.html, put in place by the build's @card line). Mount only: their text never changes after load.
   Links are plain links (Metabot asks for that).

   The tables they draw (CONF, SOURCES, SRC_SITE, compiled from data/**) are a pack's data, which src/cards/ may not
   import (docs/design/0.4-engine-contract.md §1): until P5d hands them over through the pack, the shell passes them to
   sourcesCards() and registers the specs it returns. */

/* Confidence: one paragraph and list per group of CONF */
export function renderConfidence(el, { CONF }) {
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  el.querySelector("#confBody").innerHTML = CONF.map(c => `<p><b>${c.g}</b> · ${c.sub}</p><ul class="conf">${c.items.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`).join("");
}
/* Sources: the intro, then one row per site */
export function renderSources(el, { SOURCES, SRC_SITE }) {
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  el.querySelector("#srcBody").innerHTML = `<p class="fine src-intro">Every sourced value in the guide comes from one of these pages (${SOURCES.reduce((t, g) => t + g.links.length, 0)} links, checked Oct 2026); values seen in game or worked out by the guide are marked in Confidence. Metabot data is used with credit: each item links to its Metabot page.</p>` +
    (() => { /* One row per site: how many pages and what they back; the page list opens per site. Sites with one page share a row. */
      const host = u => u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0], name = h => { const k = Object.keys(SRC_SITE).find(d => h.endsWith(d)); return k ? SRC_SITE[k] : h; };
      const by = new Map();
      SOURCES.forEach(g => g.links.forEach(([u, l]) => { const n = name(host(u)); if (!by.has(n)) by.set(n, { n, links: [], what: [] }); const x = by.get(n); x.links.push([u, l]); if (!x.what.includes(g.t)) x.what.push(g.t); }));
      const xs = [...by.values()].sort((a, b) => b.links.length - a.links.length || a.n.localeCompare(b.n)), big = xs.filter(x => x.links.length > 1), one = xs.filter(x => x.links.length === 1);
      if (one.length) big.push({ n: "Other sites", links: one.map(x => x.links[0]), what: [one.map(x => x.n).join(", ")] });
      return big.map(x => `<details class="mini srcg"><summary><span class="src-site">${esc(x.n)}</span><span class="src-n">${x.links.length}</span><span class="src-what">${esc(x.what.join(" · "))}</span></summary><ul class="sources">${x.links.map(([u, l]) => [u, x.n !== "Other sites" && l.toLowerCase().startsWith(x.n.toLowerCase() + ": ") ? l.slice(x.n.length + 2) : l]).sort((a, b) => a[1].localeCompare(b[1])).map(([u, l]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(l)}</a></li>`).join("")}</ul></details>`).join(""); })();
}

/* the two card specs (slot "foot"; orders 200 and 300 leave 100 for Route rules, P4c), drawing data = { CONF, SOURCES, SRC_SITE } */
export const sourcesCards = data => [
  { id: "confidence", slot: "foot", order: 200, root: "confCard", mount: el => renderConfidence(el, data), update: null },
  { id: "sources", slot: "foot", order: 300, root: "srcCard", mount: el => renderSources(el, data), update: null },
];
