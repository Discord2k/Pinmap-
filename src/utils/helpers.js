export const COLORS = ["#2a5d3c","#e65100","#1565c0","#ad1457","#6a1599","#00695c","#c62828","#4e342e"];
export const ONBOARD_KEY = "pm-onboarded-v5";
export const WHATSNEW_KEY = "pm-whatsnew-v11";

export const WHATSNEW = [
  {emoji:"🎨", title:"New look — Atlas edition", body:"PINMAP has a completely new design. Warm paper tones, clean typography, and a fullscreen panel layout inspired by a field atlas. Everything is easier to read and navigate."},
  {emoji:"🗺", title:"Redesigned map screen", body:"The map now has a floating search bar at the top, a layers button, and a locate button. Touch anywhere on the map to place a pin — a hint tells you where to tap."},
  {emoji:"📋", title:"Mine is now your Field Log", body:"Your pins are presented as numbered log entries with coordinates, italic descriptions, and stamped tag chips. Scroll through your personal atlas of places."},
  {emoji:"🔍", title:"Search redesigned", body:"Trending tags are now ranked 01–06 with counts. Nearby shows real public pins sorted by your actual distance. Switch between # Tags and 📍 Places."},
  {emoji:"👤", title:"Profile redesigned", body:"Clean settings list with stats grid — Pins, Public, Saved, Upvotes. Following list with avatar initials. Push notifications, Tutorial and About in one place."},
  {emoji:"📡", title:"Offline mode", body:"Drop pins and comments without a connection. They sync automatically when you're back online. Visited map tiles are cached for offline viewing."}
];

export const ALL_FEATURES = [
  {emoji:"📍", title:"Drop pins", body:"Tap anywhere on the map to place a pin. Add a name, description, hashtags, colour, photo and optional expiry date."},
  {emoji:"🎨", title:"Pin colours & icons", body:"Choose from 9 colours for your pin. Icons are automatically assigned based on hashtags — 🍺 for #pub, 🥾 for #hiking, 🎣 for #fishingspot and more."},
  {emoji:"🔒", title:"Pin privacy", body:"Pins can be public (visible to all), private (only you), or shareable (via direct link)."},
  {emoji:"⏰", title:"Expiring pins", body:"Set a date and time when adding a pin. It counts down and auto-deletes when expired — perfect for events and pop-up spots."},
  {emoji:"🔖", title:"Pin saves", body:"Tap 🔖 Save on any public pin to bookmark it to your collection. Find saved pins in your Profile tab."},
  {emoji:"💬", title:"Comments & replies", body:"Tap any pin to leave a comment. Reply to comments with ↩ Reply. Threaded conversations keep discussions organised."},
  {emoji:"👍", title:"Upvotes", body:"Upvote pins and comments with 👍. Tap again to remove your upvote."},
  {emoji:"🔍", title:"Dual search", body:"Tap # Tags to search pins by hashtag or 📍 Places to search any address worldwide. Results update the map automatically."},
  {emoji:"🔥", title:"Trending hashtags", body:"The Search tab shows the most active hashtags from the last 7 days. Follow tags to track your favourite topics."},
  {emoji:"⏰", title:"Expiring soon", body:"The Search tab shows public pins expiring in the next 7 days. Tap Show on map to filter the map to only those pins."},
  {emoji:"🗺", title:"Map layers", body:"Switch between Standard, Topographic, Satellite, Hiking Trails and Nautical chart views using the Layers button."},
  {emoji:"🔵", title:"Pin clustering", body:"When zoomed out, nearby pins group into a circle. Tap the cluster to zoom in and separate them."},
  {emoji:"📡", title:"Nearby pins", body:"The Nearby tab shows public pins within a set radius of your current location."},
  {emoji:"👤", title:"User profiles", body:"Tap any username to see their public profile — bio, socials, location and all their public pins on the map."},
  {emoji:"👥", title:"Follow users", body:"Follow users from their profile or any pin. Get push notifications when they post new public pins."},
  {emoji:"❤️", title:"Follow hashtags", body:"Follow hashtags in the Search tab to stay updated on topics you care about."},
  {emoji:"🔔", title:"Push notifications", body:"Enable in your Profile tab to receive alerts for new comments and pins from users you follow — even when the app is closed."},
  {emoji:"📋", title:"Mine tab", body:"View all your pins grouped by hashtag. Drill into each tag to see individual pins, comment counts and new activity badges."},
  {emoji:"📤", title:"Export data", body:"Export all your pins as GeoJSON or GPX files from the Profile tab — compatible with Google Maps, QGIS and most mapping tools."},
  {emoji:"👤", title:"Custom profile", body:"Set up your profile with a bio, location, website, social links and a custom photo uploaded from your device."},
  {emoji:"📡", title:"Offline mode", body:"Drop pins and comments without a connection. They queue locally and sync automatically when you come back online. Visited map tiles are cached too."},
  {emoji:"🛡", title:"Admin dashboard", body:"Visible only to the app owner. Shows active users, top pins, trending tags, push subscribers and live usage stats."}
];

export const ONBOARD_STEPS = [
  {title:"Welcome to PINMAP!",body:"A social map for saving and sharing the places that matter to you. Drop pins, add hashtags, and discover locations shared by others. Let's show you around.",pos:"center"},
  {title:"The Bottom Tab Bar",body:"Use the tab bar at the bottom to navigate — Map, Search, Drop, Mine, Profile. The Mine tab shows a dot when you have new comments. Tap Map to return to the map at any time.",pos:"top"},
  {title:"Dual Search Bar",body:"Tap '# Tags' to search public pins by hashtag — the map auto-switches to show results. Tap '📍 Places' to search any address worldwide.",pos:"bottom"},
  {title:"Drop a Pin",body:"Touch anywhere on the map to place your pin — the Drop panel opens automatically. Give it a name, hashtags, colour, photo, and an optional expiry date for temporary spots. Hit Save to post it.",pos:"center"},
  {title:"Pin Saves",body:"Tap 🔖 Save on any public pin to bookmark it to your collection. Saved pins appear in the Saved Pins section of your Profile tab — tap to jump straight to them.",pos:"center"},
  {title:"Expiring Pins",body:"When adding a pin you can set an optional expiry date. The pin shows a countdown badge and is automatically deleted when it expires — perfect for events.",pos:"center"},
  {title:"Pin Icons and Clustering",body:"Pins show an emoji based on their hashtag — 🍺 for #pub, 🥾 for #hiking, 🎣 for #fishingspot. When zoomed out, nearby pins cluster — tap to zoom in.",pos:"center"},
  {title:"Map Layers",body:"Use the Layers button on the right to switch between Standard, Topographic, Satellite, Hiking Trails, and Nautical chart views.",pos:"center"},
  {title:"Pin Visibility",body:"The middle right button controls what shows on the map — your pins only, all public pins, or a clean map. Searching a hashtag auto-switches to show all public pins.",pos:"center"},
  {title:"GPS and Nearby",body:"Tap the GPS button to jump to your location. Use the Nearby tab to discover public pins within a radius of where you are.",pos:"bottom"},
  {title:"Follow Users and Hashtags",body:"Tap any username to view their public profile and follow them — you'll get a push notification when they post a new pin. Follow hashtags in the Search tab.",pos:"center"},
  {title:"Comments, Replies and Upvotes",body:"Tap any pin to leave a comment. Reply with ↩ Reply. Upvote comments with 👍. The Mine tab shows comment counts and highlights pins with new activity.",pos:"center"},
  {title:"Push Notifications",body:"Enable push notifications in your Profile tab to get alerts when someone comments on your pin or a user you follow posts something new.",pos:"center"},
  {title:"You are all set!",body:"Sign in with Google to save everything across your devices. Your pins, saves, follows and notifications are all stored securely. Happy exploring!",pos:"center"}
];

export function uid() { return Math.random().toString(36).slice(2,10); }

export function formatLL(lat, lng, prec) { 
  prec=prec||2; 
  return Math.abs(lat).toFixed(prec)+"°"+(lat>=0?"N":"S")+" "+Math.abs(lng).toFixed(prec)+"°"+(lng>=0?"E":"W"); 
}

const DB_NAME = "pinmap-offline", DB_VER = 1;
let offlineDB = null;

export function openDB() {
  if(offlineDB) return Promise.resolve(offlineDB);
  return new Promise(function(res, rej) {
    var req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = function(e) {
      var db = e.target.result;
      if(!db.objectStoreNames.contains("pins"))     db.createObjectStore("pins",     {keyPath:"id"});
      if(!db.objectStoreNames.contains("comments")) db.createObjectStore("comments", {keyPath:"id"});
    };
    req.onsuccess  = function(e) { offlineDB = e.target.result; res(offlineDB); };
    req.onerror    = function(e) { rej(e); };
  });
}

export function dbGetAll(store) {
  return openDB().then(function(db) {
    return new Promise(function(res, rej) {
      var tx = db.transaction(store, "readonly");
      var req = tx.objectStore(store).getAll();
      req.onsuccess = function() { res(req.result||[]); };
      req.onerror   = rej;
    });
  });
}

export function dbPut(store, item) {
  return openDB().then(function(db) {
    return new Promise(function(res, rej) {
      var tx = db.transaction(store, "readwrite");
      var req = tx.objectStore(store).put(item);
      req.onsuccess = res; req.onerror = rej;
    });
  });
}

export function dbDelete(store, id) {
  return openDB().then(function(db) {
    return new Promise(function(res, rej) {
      var tx = db.transaction(store, "readwrite");
      var req = tx.objectStore(store).delete(id);
      req.onsuccess = res; req.onerror = rej;
    });
  });
}

const BANNED_TAGS = [
  "porn","pornography","xxx","sex","nsfw","nude","nudity","naked","adult",
  "cocaine","heroin","meth","drugs","weed","marijuana","cannabis","crack",
  "kill","murder","rape","assault","bomb","explosive","weapon","gun","shoot",
  "nazi","racist","racism","terrorist","terrorism","jihad","isis",
  "hate","slur","nigger","faggot","chink","spic","kike",
  "illegal","stolen","trafficking","prostitute","escort",
  "gambling","casino","betting","scam","fraud","hack","phishing"
];

const BANNED_PATTERNS = [
  /^cp$/i,
  /child.*porn/i,
  /drug.*deal/i,
  /buy.*gun/i,
];

export function checkBannedTags(tags) {
  var found = [];
  tags.forEach(function(tag) {
    var t = tag.toLowerCase();
    if(BANNED_TAGS.indexOf(t) >= 0) { found.push(tag); return; }
    BANNED_PATTERNS.forEach(function(pat) {
      if(pat.test(t) && found.indexOf(tag) < 0) found.push(tag);
    });
  });
  return found;
}

export function getPinIcon(tags) {
  var t = (tags||[]).join(" ").toLowerCase();
  if(/pub|bar|brewery|beer|tavern/.test(t))          return "🍺";
  if(/trail|hike|hiking|trailhead|trek/.test(t))     return "🥾";
  if(/flower|wildflower|flora|bloom|garden/.test(t)) return "🌸";
  if(/mural|art|graffiti|street art/.test(t))        return "🎨";
  if(/fish|fishing|fishingspot|angling/.test(t))     return "🎣";
  if(/geocache|cache/.test(t))                       return "📦";
  if(/kayak|canoe|paddle|rowing/.test(t))            return "🚣";
  if(/camp|camping|campsite/.test(t))                return "⛺";
  if(/photo|viewpoint|vista|lookout/.test(t))        return "📷";
  if(/waterfall|lake|river|creek|swim/.test(t))      return "💧";
  if(/bike|cycling|mtb|cycle/.test(t))               return "🚴";
  if(/climb|boulder|crag/.test(t))                   return "🧗";
  if(/coffee|cafe|bakery/.test(t))                   return "☕";
  if(/food|restaurant|eat|diner/.test(t))            return "🍽";
  if(/museum|gallery|history|heritage/.test(t))      return "🏛";
  if(/beach|coast|sea|ocean|surf/.test(t))           return "🏖";
  if(/urban|urbex|abandoned/.test(t))                return "🏚";
  if(/bird|wildlife|nature|animal/.test(t))          return "🦜";
  if(/snow|ski|winter|mountain/.test(t))             return "🏔";
  if(/overlanding|4wd|offroad/.test(t))              return "🚙";
  return "📍";
}

export function tagColor(tag) { 
  var h=0; 
  for(var i=0;i<tag.length;i++) h=(h*31+tag.charCodeAt(i))>>>0; 
  return COLORS[h%COLORS.length]; 
}

export function distKm(a,b,c,d) { 
  var R=6371,dL=(c-a)*Math.PI/180,dl=(d-b)*Math.PI/180,x=Math.sin(dL/2)*Math.sin(dL/2)+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dl/2)*Math.sin(dl/2); 
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)); 
}

export function dlFile(content,name,type) { 
  var a=document.createElement("a"); 
  a.href=URL.createObjectURL(new Blob([content],{type:type})); 
  a.download=name; 
  a.click(); 
}

export function toGeoJSON(pins) { 
  return JSON.stringify({type:"FeatureCollection",features:pins.map(function(p){return {type:"Feature",geometry:{type:"Point",coordinates:[p.lng,p.lat]},properties:{name:p.name,description:p.description,tags:p.tags,owner:p.owner}};})},null,2); 
}

export function toGPX(pins) { 
  return '<?xml version="1.0"?><gpx version="1.1" creator="PINMAP">'+pins.map(function(p){return '<wpt lat="'+p.lat+'" lon="'+p.lng+'"><name>'+p.name+'</name><desc>'+(p.description||"")+' '+(p.tags||[]).map(function(t){return "#"+t;}).join(" ")+'</desc></wpt>';}).join("")+"</gpx>"; 
}

export function userName(u) { 
  return u?(u.user_metadata&&u.user_metadata.full_name?u.user_metadata.full_name:u.email.split("@")[0]):"guest"; 
}

export function userAvatar(u) { 
  return u&&u.user_metadata&&u.user_metadata.avatar_url?u.user_metadata.avatar_url:null; 
}
