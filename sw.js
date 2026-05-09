var CACHE_NAME = "pinmap-v199"; // Incremented to force update
var TILE_CACHE = "pinmap-tiles-v1";
var MAX_TILES = 1000;

// Updated APP_SHELL: Removed deleted files like atlas.jsx to prevent install failure
var APP_SHELL = [
  "/", 
  "/index.html", 
  "/manifest.json", 
  "/icon-192.png", 
  "/icon-512.png"
];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // If any file in APP_SHELL is missing (404), the whole SW fails to install
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) {
          // Deletes all old caches except the current version
          return k !== CACHE_NAME && k !== TILE_CACHE;
        }).map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", function(event) {
  var url = event.request.url;

  // Cache map tiles (OSM standard only)
  if (url.includes("tile.openstreetmap.org") ||
      url.includes("tile.opentopomap.org")) {
    event.respondWith(cacheTile(event.request));
    return;
  }

  // App shell - cache first for offline use
  if (url.includes("pin-map.com") || url.includes("localhost")) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        return cached || fetch(event.request).then(function(response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
          return response;
        });
      })
    );
    return;
  }

  // Everything else - network first
  event.respondWith(fetch(event.request).catch(function() {
    return caches.match(event.request);
  }));
});

// Cache a map tile with LRU eviction
function cacheTile(request) {
  return caches.open(TILE_CACHE).then(function(cache) {
    return cache.match(request).then(function(cached) {
      if (cached) return cached;
      return fetch(request).then(function(response) {
        if (response.ok) {
          var clone = response.clone();
          cache.keys().then(function(keys) {
            if (keys.length >= MAX_TILES) {
              cache.delete(keys[0]);
            }
          });
          cache.put(request, clone);
        }
        return response;
      });
    });
  });
}