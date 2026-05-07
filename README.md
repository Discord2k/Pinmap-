# PINMAP — deploy bundle

Drop the contents of this folder onto any static host (Netlify, Vercel, GitHub Pages, S3+CloudFront, Cloudflare Pages, an nginx box).

## Files

- `index.html` — full-viewport app. Loads React + Leaflet + Babel from CDN, then mounts `AtlasApp`.
- `app/shared.jsx` — mock data + Leaflet map helper. Replace exports here with real API calls when you wire up the backend.
- `app/atlas.jsx` — all UI: splash, map, pin detail sheet, search, mine (logbook), profile, add-pin, tab bar.
- `manifest.webmanifest` — PWA manifest (add `icon-192.png` and `icon-512.png` next to it).

## Local check

Serve over HTTP (not file://) so the in-browser Babel transpile of the JSX scripts works:

```
python3 -m http.server 8080
# then open http://localhost:8080
```

## Production notes

The current build transpiles JSX in the browser via `@babel/standalone`. That's fine for a prototype but adds ~150kb and a paint delay. Before public launch:

1. Pre-compile `app/*.jsx` with esbuild/swc/babel-cli to plain JS.
2. Drop the `<script src="@babel/standalone">` tag.
3. Switch the `<script type="text/babel">` tags to `<script src="…">`.
4. Bundle React + ReactDOM into your own JS file (or keep CDN — your call).

The mock data in `app/shared.jsx` (`MOCK_PINS`, `MOCK_COMMENTS`, `TRENDING_TAGS`, `ME`, `PROFILES`) is all reads. Replace the `Object.assign(window, …)` block with `fetch()`-driven state once the API exists.

## Tab structure

Map · Search · Mine · Profile (bottom nav, 64px tall, sits above iOS home indicator).
The hamburger on the map screen routes to Profile; the FAB opens Add Pin.
