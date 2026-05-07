// Shared mock data, helpers, and base utilities for both PINMAP variations.
// Loaded as a regular Babel script — exposes globals on window.

// ─── Mock data ─────────────────────────────────────────────────────────────
const MOCK_PINS = [
  { id: 'p01', name: 'Hatcher\'s Pass overlook',           lat: 61.7791, lng: -149.2733, color: '#2a5d3c', tags: ['hiking','viewpoint','wildflower'],  icon: '🥾', owner: 'mira_h',     privacy: 'public',  upvotes: 24, comments: 8,  saved: 12, distKm: 1.2, photo: null, description: 'Best wildflower bloom mid-July. Park at the lower lot, follow the ridge trail.', expiresIn: null },
  { id: 'p02', name: 'Skyline brewpub',                    lat: 61.2181, lng: -149.9003, color: '#b85c2a', tags: ['pub','beer','live-music'],          icon: '🍺', owner: 'mira_h',     privacy: 'public',  upvotes: 41, comments: 14, saved: 22, distKm: 0.4, photo: null, description: 'Hazy IPA on tap, bluegrass on Thursdays. Patio fills up fast after 6.', expiresIn: null },
  { id: 'p03', name: 'Beluga Point lookout',               lat: 60.9939, lng: -149.5419, color: '#2a5d3c', tags: ['viewpoint','wildlife','photo'],     icon: '📷', owner: 'arctic_jay', privacy: 'public',  upvotes: 67, comments: 19, saved: 38, distKm: 18.4, photo: null, description: 'Belugas pass through July–August on the rising tide. Bring binoculars.', expiresIn: null },
  { id: 'p04', name: 'Eklutna Lake trailhead',             lat: 61.4108, lng: -149.1247, color: '#2a5d3c', tags: ['hiking','camp','kayak'],            icon: '⛺', owner: 'arctic_jay', privacy: 'public',  upvotes: 33, comments: 11, saved: 18, distKm: 5.0, photo: null, description: '12 mile lakeside trail. Bear country — carry spray.', expiresIn: null },
  { id: 'p05', name: 'Fri night farmers market',           lat: 61.2150, lng: -149.8930, color: '#b85c2a', tags: ['food','events'],                    icon: '🍽', owner: 'kira.w',     privacy: 'public',  upvotes: 19, comments: 5,  saved: 9,  distKm: 0.7, photo: null, description: 'Live food, live music. 5–9pm summer Fridays only.', expiresIn: 4 },
  { id: 'p06', name: 'Coastal Trail mile 2',               lat: 61.2074, lng: -149.9489, color: '#2a5d3c', tags: ['running','viewpoint','sunset'],     icon: '📷', owner: 'me',         privacy: 'private', upvotes: 0,  comments: 0,  saved: 0,  distKm: 1.9, photo: null, description: 'Personal note: golden hour shot looking back at downtown.', expiresIn: null },
  { id: 'p07', name: 'Crow Pass campground',               lat: 60.9711, lng: -149.0508, color: '#2a5d3c', tags: ['camp','hiking','river'],            icon: '⛺', owner: 'me',         privacy: 'public',  upvotes: 8,  comments: 2,  saved: 5,  distKm: 22.1, photo: null, description: 'Backcountry walk-in. Crystal clear creek for filtering water.', expiresIn: null },
  { id: 'p08', name: 'Westchester lagoon ice',             lat: 61.2050, lng: -149.9181, color: '#b85c2a', tags: ['skating','winter','events'],        icon: '🏔', owner: 'kira.w',     privacy: 'public',  upvotes: 12, comments: 4,  saved: 7,  distKm: 1.3, photo: null, description: 'City clears the lagoon Dec–Mar. Floodlit until 10pm.', expiresIn: null },
];

const MOCK_COMMENTS = {
  p02: [
    { id: 'c1', owner: 'kira.w',      body: 'The IPA flight is the move. Don\'t skip the pretzel.',                              upvotes: 6, ts: '2d' },
    { id: 'c2', owner: 'arctic_jay',  body: 'Confirmed. Got there 5:45 last week and grabbed the last patio table.',             upvotes: 3, ts: '1d' },
    { id: 'c3', owner: 'mira_h',      body: 'Thursday bluegrass is a whole scene btw — bring earplugs if you\'re sound-shy.',     upvotes: 9, ts: '6h' },
  ],
  p03: [
    { id: 'c4', owner: 'mira_h',      body: 'Saw a pod of 7 last Tuesday around high tide. Pure magic.',                          upvotes: 11, ts: '3d' },
    { id: 'c5', owner: 'kira.w',      body: 'Pull-out fills up by 11am on weekends — go early.',                                  upvotes: 4,  ts: '2d' },
  ],
};

const TRENDING_TAGS = [
  { tag: 'hiking',     count: 142, delta: '+12' },
  { tag: 'viewpoint',  count:  98, delta: '+8'  },
  { tag: 'wildlife',   count:  74, delta: '+22' },
  { tag: 'pub',        count:  61, delta: '+3'  },
  { tag: 'camp',       count:  54, delta: '+5'  },
  { tag: 'photo',      count:  47, delta: '+1'  },
  { tag: 'wildflower', count:  39, delta: '+18' },
  { tag: 'kayak',      count:  28, delta: '0'   },
];

const NEARBY_PINS = MOCK_PINS.filter(p => p.privacy === 'public').sort((a,b) => a.distKm - b.distKm).slice(0, 5);

const ME = {
  name: 'Seth Gray',
  handle: 'seth.g',
  email: 'seth@example.com',
  bio: 'Backcountry, brewpubs, and birds — I drop pins where the map gets quiet.',
  location: 'Anchorage, AK',
  joined: 'Jul 2024',
  avatar: null, // initial-based
  stats: { pins: 17, public: 12, saved: 9, upvotes: 187 },
  following: ['mira_h', 'arctic_jay', 'kira.w'],
  followingTags: ['hiking', 'viewpoint', 'pub'],
};

const PROFILES = {
  'mira_h':     { name: 'Mira Holm',    handle: 'mira_h',     bio: 'Trail runner. Wildflower obsessive. Anchorage → Talkeetna.', location: 'Anchorage, AK',   pinCount: 34, followers: 218, following: 84,  avatar: 'M' },
  'arctic_jay': { name: 'Jay Ostrom',   handle: 'arctic_jay', bio: 'Photographer. Coastal wildlife & long exposures.',           location: 'Girdwood, AK',    pinCount: 56, followers: 1240,following: 96,  avatar: 'J' },
  'kira.w':     { name: 'Kira Walsh',   handle: 'kira.w',     bio: 'Local food, live music, and quiet patios.',                  location: 'Spenard, AK',     pinCount: 22, followers: 187, following: 64,  avatar: 'K' },
};

// ─── Map utility ───────────────────────────────────────────────────────────
// Builds a real Leaflet map inside the given container. Returns the map +
// helper functions. Tiles are standard OSM but rendered with a CSS filter
// so they fit a paper / editorial look without requiring a custom tile server.
function makePinmapMap(containerEl, opts) {
  opts = opts || {};
  const filter = opts.filter || 'saturate(0.6) contrast(0.95) brightness(1.02) sepia(0.08)';
  const center = opts.center || [61.2181, -149.9003]; // Anchorage
  const zoom = opts.zoom || 11;

  const map = L.map(containerEl, {
    center, zoom,
    zoomControl: false,
    attributionControl: false,
    scrollWheelZoom: 'center',
    tap: true,
    minZoom: 4,
    maxZoom: 18,
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map);

  // Apply filter to tile pane only — markers stay vivid.
  setTimeout(() => {
    const pane = containerEl.querySelector('.leaflet-tile-pane');
    if (pane) pane.style.filter = filter;
  }, 50);

  return map;
}

// Drop a stylized marker — the marker visual is variant-specific so this
// just provides the L.divIcon scaffolding.
function pinMarker(pin, html, anchor) {
  return L.marker([pin.lat, pin.lng], {
    icon: L.divIcon({
      className: 'pinmap-marker',
      html,
      iconSize: anchor ? [anchor.w, anchor.h] : [32, 40],
      iconAnchor: anchor ? [anchor.x, anchor.y] : [16, 38],
    }),
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function initialOf(name) {
  return (name || '?').replace(/[^a-zA-Z0-9]/g, '').slice(0,1).toUpperCase();
}
function fmtCoord(lat, lng) {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  const f = (n) => Math.abs(n).toFixed(4);
  return `${f(lat)}°${ns}  ${f(lng)}°${ew}`;
}
function fmtCoordShort(lat, lng) {
  return `${lat.toFixed(2)}°${lat>=0?'N':'S'} ${Math.abs(lng).toFixed(2)}°${lng>=0?'E':'W'}`;
}

// ─── Expose to other Babel scripts ────────────────────────────────────────
Object.assign(window, {
  PM_MOCK_PINS: MOCK_PINS,
  PM_MOCK_COMMENTS: MOCK_COMMENTS,
  PM_TRENDING_TAGS: TRENDING_TAGS,
  PM_NEARBY_PINS: NEARBY_PINS,
  PM_ME: ME,
  PM_PROFILES: PROFILES,
  pmMakeMap: makePinmapMap,
  pmPinMarker: pinMarker,
  pmInitial: initialOf,
  pmFmtCoord: fmtCoord,
  pmFmtCoordShort: fmtCoordShort,
});
