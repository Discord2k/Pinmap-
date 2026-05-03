const CACHE = "pinmap-v119";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js",
  "https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js",
  "https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  // Network-first: map tiles, Supabase API
  if (
    e.request.url.includes("openstreetmap.org") ||
    e.request.url.includes("supabase.co")
  ) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  // Cache-first: app shell + CDN assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});

self.addEventListener("push", function(event) {
  var data = {};
  try { data = event.data.json(); } catch(e) { data = {title:"PINMAP", body:event.data ? event.data.text() : "New notification"}; }
  console.log("push received:", JSON.stringify(data));
  var notifUrl = data.url || "https://pin-map.com";
  event.waitUntil(
    self.registration.showNotification(data.title || "PINMAP", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: notifUrl },
      vibrate: [100, 50, 100],
      tag: "pinmap-notification",
      renotify: true
    })
  );
});

self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || "https://pin-map.com";
  console.log("notification clicked, url:", url);
  event.waitUntil(
    clients.matchAll({type:"window", includeUncontrolled:true}).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes("pin-map.com")) {
          // Send message to app with the pin URL
          client.postMessage({type:"open-pin", url:url});
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
