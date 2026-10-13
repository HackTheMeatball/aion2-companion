/* Service worker for the standalone site (never part of the claude.ai build).
   scripts/build.mjs fills in the build id (content hash) and the precache list (app shell + icons).
   - index.html / navigations to the app: network first, cached copy when offline.
   - other same-origin files: cache first (the cache is replaced as a whole when the build changes).
   - Google Fonts: stale-while-revalidate, so the fonts also work offline after the first visit. */
const PREFIX = "aion2-route-";
const CACHE = PREFIX + "__BUILD__";
const FONTS = PREFIX + "fonts";
const PRECACHE = __PRECACHE__;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE && k !== FONTS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const scopePath = () => new URL(self.registration.scope).pathname;

async function networkFirst(req) {
  const cache = await caches.open(CACHE), key = new URL("index.html", self.registration.scope).href;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(key, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(key);
    if (hit) return hit;
    throw err;
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(FONTS), hit = await cache.match(req);
  const net = fetch(req).then(res => { if (res.ok || res.type === "opaque") cache.put(req, res.clone()); return res; }).catch(() => hit);
  return hit || net;
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    const base = scopePath(), shell = url.pathname === base || url.pathname === base + "index.html";
    if (shell) { e.respondWith(networkFirst(req)); return; }
    if (req.mode === "navigate") return; /* other pages (404.html, …): plain network */
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
    return;
  }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") e.respondWith(staleWhileRevalidate(req));
});
