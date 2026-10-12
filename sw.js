// Bump CACHE whenever app files or questions change so phones pick up the update.
const CACHE = "study-app-v12";
const ASSETS = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "data/netplus.js",
  "data/netplus-lessons.js",
  "subnet.js",
  "drills.js",
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png"
];

// cache: "reload" skips the browser's HTTP cache so a new version never caches old files.
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network first so updates show up when online; fall back to cache when offline.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    // "no-cache" makes the browser check with the server instead of reusing a stale HTTP-cached copy.
    // (A navigation request can't be copied with options, so page loads are re-requested by URL.)
    fetch(e.request.mode === "navigate" ? e.request.url : e.request, { cache: "no-cache" })
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
