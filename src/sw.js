/* Service worker for the standalone site (never part of the claude.ai build).
   scripts/build.mjs fills in the build id (content hash) and the precache list (app shell, icons, fonts).
   - index.html / navigations to the app: network first, cached copy when offline.
   - other same-origin files: cache first (the cache is replaced as a whole when the build changes).
   - Nothing cross-origin is handled: the fonts are served from this site since 0.1.5. */
const PREFIX = "aion2-route-";
const CACHE = PREFIX + "__BUILD__";
const PRECACHE = __PRECACHE__;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

/* Every other aion2-route-* cache is deleted: older builds, and the Google Fonts cache ("aion2-route-fonts") from before 0.1.5. */
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))))
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

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    const base = scopePath(), shell = url.pathname === base || url.pathname === base + "index.html";
    if (shell) { e.respondWith(networkFirst(req)); return; }
    if (req.mode === "navigate") return; /* other pages (404.html, …): plain network */
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
  }
});
