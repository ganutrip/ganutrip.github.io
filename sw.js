/* ===== SERVICE WORKER · Trip Tracker ===== */
const CACHE_VERSION = "triptracker-v1";

const CACHE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable.png"
];

/* INSTALL — cache aset asas */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => {
        return cache.addAll(CACHE_ASSETS).catch((err) => {
          console.warn("Sebahagian aset gagal di-cache:", err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

/* ACTIVATE — buang cache lama */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
        );
      })
      .then(() => self.clients.claim())
  );
});

/* FETCH — strategi */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Jangan cache Firebase / Firestore API
  if (
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("firebase") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("gstatic.com")
  ) {
    return; // biar browser handle terus
  }

  // HTML/JS/CSS/JSON — network-first (dapat versi terbaru, fallback cache)
  if (
    event.request.mode === "navigate" ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".json")
  ) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(event.request, clone));
          return res;
        })
        .catch(() => {
          return caches.match(event.request).then((r) => r || caches.match("./index.html"));
        })
    );
    return;
  }

  // Aset statik lain (PNG, dll) — cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(event.request, clone));
        return res;
      });
    })
  );
});
