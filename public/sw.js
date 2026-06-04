var CACHE_NAME = "pinmap-v347";
var TILE_CACHE = "pinmap-tiles-v2";
var MAX_TILES = 10000;
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

  // Cache map tiles and Waymarked Trails overlay
  if (url.includes("tiles.openfreemap.org") ||
      url.includes("arcgisonline.com") ||
      url.includes("tile.openstreetmap.org") ||
      url.includes("opentopomap.org") ||
      url.includes("tile-cyclosm.openstreetmap.fr") ||
      url.includes("tile.waymarkedtrails.org")) {
    event.respondWith(cacheTile(event.request));
    return;
  }

  // App shell - Network-First for HTML/dev files, Cache-First for static assets
  if (url.includes("pin-map.com") || url.includes("localhost")) {
    var isHtml = event.request.mode === "navigate" || 
                 url.endsWith("/") || 
                 url.endsWith("/index.html") ||
                 url.includes("index.html");

    var isDevSource = url.includes("localhost") && 
                      (url.includes("/src/") || url.includes("@vite") || url.includes("node_modules"));

    if (isHtml || isDevSource) {
      event.respondWith(
        fetch(event.request).then(function(response) {
          if (response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
          }
          return response;
        }).catch(function() {
          return caches.match(event.request);
        })
      );
      return;
    }

    event.respondWith(
      caches.match(event.request).then(function(cached) {
        return cached || fetch(event.request).then(function(response) {
          if (response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
          }
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
        var url = request.url;
        // If it's a vector tile (.pbf), return a 204 No Content response so MapLibre handles it gracefully
        if (url.includes(".pbf")) {
          return new Response(null, { status: 204 });
        }
        // If it's style JSON or style assets, propagate the fetch failure (return 503)
        if (url.includes("/styles/") || url.includes(".json") || url.includes("/glyphs/")) {
          return new Response("Offline", { status: 503, statusText: "Offline" });
        }
        // Offline and not cached (raster tiles) - return a valid 1x1 transparent PNG
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
  var title = "PINMAP";
  var body = "You have a new notification - tap to view";
  var notifData = { checkNotifications: true };
  
  if (event.data) {
    try {
      var data = event.data.json();
      if (data.title) title = data.title;
      if (data.body) body = data.body;
      if (data.data) notifData = Object.assign({}, notifData, data.data);
    } catch(e) {
      var text = event.data.text();
      if (text) body = text;
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: notifData,
      vibrate: [100, 50, 100],
      tag: "pinmap-notification",
      renotify: true
    })
  );
});

self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  console.log("notification clicked");
  var targetUrl = self.registration.scope; // Fallback to PWA origin (works on localhost & production)
  if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }
  
  event.waitUntil(
    clients.matchAll({type:"window", includeUncontrolled:true}).then(function(clientList) {
      var payload = Object.assign({type:"check-notifications"}, event.notification.data);
      try {
        var bc = new BroadcastChannel("pinmap-notifications");
        bc.postMessage(payload);
        bc.close();
      } catch(e) {}
      for(var i = 0; i < clientList.length; i++) {
        try { clientList[i].postMessage(payload); } catch(e) {}
      }
      if(clientList.length > 0) return clientList[0].focus();
      return clients.openWindow(targetUrl);
    })
  );
});
