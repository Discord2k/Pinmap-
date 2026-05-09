var CACHE_NAME = "pinmap-v208";
var TILE_CACHE = "pinmap-tiles-v1";
var MAX_TILES = 1000;
var APP_SHELL = ["/", "/index.html", "/manifest.json", "/icon-192.png", "/icon-512.png"];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) {
        return k !== CACHE_NAME && k !== TILE_CACHE;
      }).map(function(k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", function(event) {
  var url = event.request.url;

  // Cache map tiles (OSM standard only - not satellite)
  if (url.includes("tile.openstreetmap.org") ||
      url.includes("tile.opentopomap.org") ||
      url.includes("tile.waymarkedtrails.org") ||
      url.includes("tiles.openseamap.org")) {
    event.respondWith(cacheTile(event.request));
    return;
  }

  // App shell - cache first
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

  // Supabase API - network first, queue if offline
  if (url.includes("supabase.co")) {
    event.respondWith(
      fetch(event.request.clone()).catch(function() {
        // Return offline response for reads
        return new Response(JSON.stringify([]), {
          headers: { "Content-Type": "application/json" }
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
          // Evict oldest tiles if over limit
          cache.keys().then(function(keys) {
            if (keys.length >= MAX_TILES) {
              cache.delete(keys[0]);
            }
          });
          cache.put(request, clone);
        }
        return response;
      }).catch(function() {
        // Offline and not cached - return a valid 1x1 transparent PNG
        var transparentPng = new Uint8Array([
          137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,
          8,6,0,0,0,31,21,196,137,0,0,0,10,73,68,65,84,120,156,98,0,1,0,0,
          5,0,1,13,10,45,180,0,0,0,0,73,69,78,68,174,66,96,130
        ]);
        return new Response(transparentPng.buffer, {
          headers: { "Content-Type": "image/png" }
        });
      });
    });
  });
}

// ── Background Sync ───────────────────────────────────────────────────────────
self.addEventListener("sync", function(event) {
  if (event.tag === "pinmap-sync") {
    event.waitUntil(syncQueue());
  }
});

function syncQueue() {
  return self.clients.matchAll().then(function(clients) {
    clients.forEach(function(client) {
      client.postMessage({ type: "do-sync" });
    });
  });
}

// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener("push", function(event) {
  console.log("push ping received");
  event.waitUntil(
    self.registration.showNotification("PINMAP", {
      body: "You have a new notification - tap to view",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { checkNotifications: true },
      vibrate: [100, 50, 100],
      tag: "pinmap-notification",
      renotify: true
    })
  );
});

self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  console.log("notification clicked");
  event.waitUntil(
    clients.matchAll({type:"window", includeUncontrolled:true}).then(function(clientList) {
      try {
        var bc = new BroadcastChannel("pinmap-notifications");
        bc.postMessage({type:"check-notifications"});
        bc.close();
      } catch(e) {}
      for(var i = 0; i < clientList.length; i++) {
        try { clientList[i].postMessage({type:"check-notifications"}); } catch(e) {}
      }
      if(clientList.length > 0) return clientList[0].focus();
      return clients.openWindow("https://pin-map.com");
    })
  );
});
