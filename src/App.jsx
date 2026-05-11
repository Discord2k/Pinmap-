import React, { useState, useEffect, useRef } from 'react';
import { api, sb, subscribeToPush, uploadPhoto, callEdgeFunction } from './utils/api';
import { dbGetAll, dbPut, dbDelete, uid, formatLL, tagColor, getPinIcon, distKm, checkBannedTags, userName, userAvatar, dlFile, toGeoJSON, toGPX, WHATSNEW, ONBOARD_KEY, WHATSNEW_KEY, ALL_FEATURES, ONBOARD_STEPS } from './utils/helpers';
import { T, S } from './utils/styles';
import { Splash } from './components/Splash';
import { Onboarding } from './components/Onboarding';
import { Comments } from './components/Comments';
import { PinCard } from './components/PinCard';
import { ProfilePanel } from './components/ProfilePanel';
import { MineTab } from './components/MineTab';
import { WhatsNew } from './components/WhatsNew';

var e = React.createElement;

function App() {
  var mapDiv=useRef(null), mapObj=useRef(null), markers=useRef({}), baseLayers=useRef({}), currentBase=useRef(null), mapLayerRef=useRef("mine"), focusedMarker=useRef(null), focusPinId=useRef(null);
  var s1=useState(null);     var user=s1[0];           var setUser=s1[1];
  var s2=useState(false);    var sessionChecked=s2[0]; var setSessionChecked=s2[1];
  var s3=useState(false);    var splashDone=s3[0];     var setSplashDone=s3[1];
  var s4=useState([]);       var pins=s4[0];           var setPins=s4[1];
  var s5=useState(false);    var loading=s5[0];        var setLoading=s5[1];
  var s6=useState(false);    var open=s6[0];           var setOpen=s6[1];
  var s7=useState("search"); var tab=s7[0];            var setTab=s7[1];
  var fabSaved=(function(){try{var s=localStorage.getItem("pm-fab-pos");return s?JSON.parse(s):{bottom:32,right:20};}catch(e){return {bottom:32,right:20};}})();
  var s8=useState(fabSaved); var fabPos=s8[0]; var setFabPos=s8[1];
  var s9=useState("");       var searchTag=s9[0];      var setSearchTag=s9[1];
  var s34=useState("tags");   var searchMode=s34[0];    var setSearchMode=s34[1];
  var s35=useState("");      var addrSearch=s35[0];    var setAddrSearch=s35[1];
  var s36=useState([]);      var addrResults=s36[0];   var setAddrResults=s36[1];
  var s37=useState(false);   var addrLoading=s37[0];   var setAddrLoading=s37[1];
  var s10=useState(null);    var searchResults=s10[0]; var setSearchResults=s10[1];
  var s11=useState(null);    var activeFilter=s11[0];  var setActiveFilter=s11[1];
  var s12=useState({name:"",description:"",tags:"",privacy:"public",photo:null,color:"#2a5d3c"}); var form=s12[0]; var setForm=s12[1];
  var s13=useState(null);    var pendingLL=s13[0];     var setPendingLL=s13[1];
  var s14=useState(null);    var selPin=s14[0];        var setSelPin=s14[1];
  var s21=useState(null);    var editPin=s21[0];       var setEditPin=s21[1];
  var s22=useState({name:"",description:"",tags:"",color:"#2a5d3c",photo:null}); var editForm=s22[0]; var setEditForm=s22[1];
  var s15=useState("");      var toast=s15[0];         var setToast=s15[1];
  var s16=useState(null);    var userLL=s16[0];        var setUserLL=s16[1];
  var s17=useState(false);   var locating=s17[0];      var setLocating=s17[1];
  var s18=useState(10);      var nearbyKm=s18[0];      var setNearbyKm=s18[1];
  var s19=useState(null);    var nearbyRes=s19[0];     var setNearbyRes=s19[1];
  var s20=useState(localStorage.getItem(ONBOARD_KEY)?-1:0); var onboardStep=s20[0]; var setOnboardStep=s20[1];
  var s38=useState(
    localStorage.getItem(ONBOARD_KEY) && !localStorage.getItem(WHATSNEW_KEY)
  ); var showWhatsNew=s38[0]; var setShowWhatsNew=s38[1];
  var s23=useState("mine"); var mapLayer=s23[0]; var setMapLayer=s23[1];
  var s25=useState("osm"); var baseLayer=s25[0]; var setBaseLayer=s25[1];
  var s26=useState(false); var layerMenuOpen=s26[0]; var setLayerMenuOpen=s26[1];
  var s28=useState(null); var viewUser=s28[0]; var setViewUser=s28[1];
  var s29=useState([]); var userPins=s29[0]; var setUserPins=s29[1];
  var s30=useState(false); var userPinsLoading=s30[0]; var setUserPinsLoading=s30[1];
  var s31=useState([]); var follows=s31[0]; var setFollows=s31[1];
  var s32=useState([]); var trending=s32[0]; var setTrending=s32[1];
  var s33=useState(false); var trendingLoading=s33[0]; var setTrendingLoading=s33[1];
  var s24=useState(0); var unreadCount=s24[0]; var setUnreadCount=s24[1];
  var s39=useState([]); var unreadPinIds=s39[0]; var setUnreadPinIds=s39[1];
  var s41=useState(13); var mapZoom=s41[0]; var setMapZoom=s41[1];
  var s42=useState(null); var installPrompt=s42[0]; var setInstallPrompt=s42[1];
  var s44=useState([]); var userFollows=s44[0]; var setUserFollows=s44[1];
  var s43=useState(false); var showInstall=s43[0]; var setShowInstall=s43[1];
  var s45=useState(false); var pushEnabled=s45[0]; var setPushEnabled=s45[1];
  var s46=useState(null); var notifPin=s46[0]; var setNotifPin=s46[1];
  var s47=useState(null); var adminStats=s47[0]; var setAdminStats=s47[1];
  var s48=useState(false); var adminLoading=s48[0]; var setAdminLoading=s48[1];
  var s49=useState([]); var activeUsers=s49[0]; var setActiveUsers=s49[1];
  var s50=useState([]); var savedPins=s50[0]; var setSavedPins=s50[1];
  var s55=useState(false); var showExpiringOnly=s55[0]; var setShowExpiringOnly=s55[1];
  var s60=useState(null); var mapCenter=s60[0]; var setMapCenter=s60[1];
  var s63=useState(""); var quickSearch=s63[0]; var setQuickSearch=s63[1];
  var s62=useState(false); var showFirstPin=s62[0]; var setShowFirstPin=s62[1];
  var s64=useState(false); var showImport=s64[0]; var setShowImport=s64[1];
  var s65=useState("#2a5d3c"); var importColor=s65[0]; var setImportColor=s65[1];
  var s66=useState(""); var importTags=s66[0]; var setImportTags=s66[1];
  var s67=useState(null); var importPreview=s67[0]; var setImportPreview=s67[1];
  var s68=useState(false); var importLoading=s68[0]; var setImportLoading=s68[1];
  var s56=useState(navigator.onLine); var isOnline=s56[0]; var setIsOnline=s56[1];
  var s57=useState(0); var queueCount=s57[0]; var setQueueCount=s57[1];
  var s58=useState(false); var offlineDismissed=s58[0]; var setOfflineDismissed=s58[1];
  var s61=useState(window._swUpdateReady||false); var updateReady=s61[0]; var setUpdateReady=s61[1];
  var s59=useState(false); var showFeatures=s59[0]; var setShowFeatures=s59[1];
  var s51=useState(null); var myProfile=s51[0]; var setMyProfile=s51[1];
  var s52=useState(null); var viewProfile=s52[0]; var setViewProfile=s52[1];
  var s53=useState(false); var editingProfile=s53[0]; var setEditingProfile=s53[1];
  var s54=useState({bio:"",location:"",website:"",twitter:"",instagram:"",youtube:"",avatar_url:""}); var profileForm=s54[0]; var setProfileForm=s54[1];
  var s40=useState({}); var commentCounts=s40[0]; var setCommentCounts=s40[1];

  var uname = userName(user);

  function flash(msg) { setToast(msg); setTimeout(function(){setToast("");},3000); }

  function parseImportFile(file, onDone) {
    var name = file.name.toLowerCase();
    var reader = new FileReader();
    reader.onload = function(ev) {
      var text = ev.target.result;
      var pins = [];
      try {
        if (name.endsWith(".geojson") || name.endsWith(".json")) {
          var gj = JSON.parse(text);
          var features = gj.features || (gj.type === "Feature" ? [gj] : []);
          features.forEach(function(f) {
            if (f.geometry && f.geometry.type === "Point") {
              var c = f.geometry.coordinates;
              var p = f.properties || {};
              pins.push({ name: p.name || p.title || "Imported Pin", description: p.description || p.desc || "", lat: c[1], lng: c[0] });
            }
          });
        } else if (name.endsWith(".gpx")) {
          var parser = new DOMParser();
          var doc = parser.parseFromString(text, "text/xml");
          var wpts = Array.from(doc.querySelectorAll("wpt"));
          var trks = Array.from(doc.querySelectorAll("trkpt,rtept"));
          wpts.concat(trks).forEach(function(pt) {
            var lat = parseFloat(pt.getAttribute("lat")), lng = parseFloat(pt.getAttribute("lon"));
            if (!isNaN(lat) && !isNaN(lng)) {
              var n = pt.querySelector("name"); var d = pt.querySelector("desc") || pt.querySelector("cmt");
              pins.push({ name: (n && n.textContent) || "GPX Point", description: (d && d.textContent) || "", lat: lat, lng: lng });
            }
          });
        } else if (name.endsWith(".kml")) {
          var parser2 = new DOMParser();
          var doc2 = parser2.parseFromString(text, "text/xml");
          Array.from(doc2.querySelectorAll("Placemark")).forEach(function(pm) {
            var coords = pm.querySelector("coordinates");
            var n2 = pm.querySelector("name"); var d2 = pm.querySelector("description");
            if (coords) {
              var parts = coords.textContent.trim().split(/[,\s]+/);
              var lng2 = parseFloat(parts[0]), lat2 = parseFloat(parts[1]);
              if (!isNaN(lat2) && !isNaN(lng2))
                pins.push({ name: (n2 && n2.textContent) || "KML Placemark", description: (d2 && d2.textContent) || "", lat: lat2, lng: lng2 });
            }
          });
        } else if (name.endsWith(".csv")) {
          var lines = text.split("\n").filter(Boolean);
          var headers = lines[0].split(",").map(function(h){return h.trim().toLowerCase().replace(/"/g,"");});
          var li = headers.indexOf("lat") >= 0 ? headers.indexOf("lat") : headers.findIndex(function(h){return h.includes("lat");});
          var lo = headers.indexOf("lng") >= 0 ? headers.indexOf("lng") : headers.indexOf("lon") >= 0 ? headers.indexOf("lon") : headers.findIndex(function(h){return h.includes("lon")||h.includes("lng");});
          var ni = headers.indexOf("name") >= 0 ? headers.indexOf("name") : 0;
          var di = headers.indexOf("description") >= 0 ? headers.indexOf("description") : headers.indexOf("desc");
          lines.slice(1).forEach(function(line) {
            var cells = line.split(",").map(function(c){return c.trim().replace(/"/g,"");});
            var lat = parseFloat(cells[li]), lng = parseFloat(cells[lo]);
            if (!isNaN(lat) && !isNaN(lng))
              pins.push({ name: cells[ni] || "CSV Pin", description: di >= 0 ? (cells[di] || "") : "", lat: lat, lng: lng });
          });
        }
      } catch(e) { flash("Parse error: " + e.message); }
      onDone(pins);
    };
    reader.readAsText(file);
  }

  function doImport() {
    if (!importPreview || !importPreview.length) { flash("No pins to import"); return; }
    setImportLoading(true);
    var tags = importTags.split(/[,\s]+/).filter(Boolean).map(function(t){return t.replace(/^#/,"");});
    var toSave = importPreview.map(function(p) {
      return { id: uid(), name: p.name, description: p.description, lat: p.lat, lng: p.lng,
               tags: tags, color: importColor, privacy: "public", owner: uname,
               created_at: new Date().toISOString() };
    });
    var saved = 0;
    function saveNext(i) {
      if (i >= toSave.length) {
        setImportLoading(false);
        setShowImport(false);
        setImportPreview(null);
        setImportTags("");
        flash("Imported " + saved + " pins!");
        api.list().then(function(data){ if(Array.isArray(data)) setPins(data); });
        return;
      }
      api.insert(toSave[i]).then(function(){ saved++; saveNext(i+1); }).catch(function(){ saveNext(i+1); });
    }
    saveNext(0);
  }

  // Clear places results when panel closes
  useEffect(function(){
    if(!open){
      setAddrResults([]);
      setAddrSearch("");
    }
  },[open]);

  // Wire SW update signal
  useEffect(function(){
    window._setUpdateReady = setUpdateReady;
    if(window._swUpdateReady) setUpdateReady(true);
    return function(){ window._setUpdateReady = null; };
  },[]);

  // Online/offline detection with debounce to prevent flickering
  useEffect(function(){
    var offlineTimer = null;
    var onlineTimer = null;

    function goOnline() {
      clearTimeout(offlineTimer);
      // Debounce online detection by 1 second
      onlineTimer = setTimeout(function(){
        setIsOnline(true);
        syncOfflineQueue();
      }, 1000);
    }

    function goOffline() {
      clearTimeout(onlineTimer);
      // Debounce offline detection by 2 seconds to avoid false triggers
      offlineTimer = setTimeout(function(){
        setIsOnline(false);
        setOfflineDismissed(false);
        if(navigator.serviceWorker&&"SyncManager" in window){
          navigator.serviceWorker.ready.then(function(reg){
            reg.sync.register("pinmap-sync").catch(function(){});
          });
        }
      }, 2000);
    }

    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    function onSWMsg(e) { if(e.data&&e.data.type==="do-sync") syncOfflineQueue(); }
    navigator.serviceWorker&&navigator.serviceWorker.addEventListener("message", onSWMsg);
    return function(){
      clearTimeout(offlineTimer);
      clearTimeout(onlineTimer);
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
      navigator.serviceWorker&&navigator.serviceWorker.removeEventListener("message", onSWMsg);
    };
  },[]);

  // Update queue count on load
  useEffect(function(){
    Promise.all([dbGetAll("pins"), dbGetAll("comments")]).then(function(r){
      setQueueCount((r[0]||[]).length + (r[1]||[]).length);
    });
  },[]);

  // Sync offline queue to Supabase
  function syncOfflineQueue(){
    Promise.all([dbGetAll("pins"), dbGetAll("comments")]).then(function(results){
      var pendingPins = results[0]||[];
      var pendingComments = results[1]||[];
      var total = pendingPins.length + pendingComments.length;
      if(!total) return;
      flash("Syncing "+total+" offline item"+(total>1?"s":"")+"...");
      var pinPromises = pendingPins.map(function(pin){
        return api.insert(pin).then(function(){ return dbDelete("pins", pin.id); });
      });
      var commentPromises = pendingComments.map(function(c){
        return api.addComment(c).then(function(){ return dbDelete("comments", c.id); });
      });
      Promise.all(pinPromises.concat(commentPromises)).then(function(){
        setQueueCount(0);
        flash("✅ Synced "+total+" item"+(total>1?"s":"")+" successfully!");
        api.list().then(function(data){ if(Array.isArray(data)) setPins(data); });
      }).catch(function(){ flash("Sync failed — will retry when online"); });
    });
  }

  // Presence tracking - ping every 60 seconds while app is open
  useEffect(function(){
    if(!splashDone || !uname || uname==="guest") return;
    var presenceId = "presence-"+uname.toLowerCase().replace(/ /g,"-");

    function updatePresence(){
      var now = new Date().toISOString();
      var record = {id:presenceId, owner:uname, last_seen:now};
      if(userLL && userLL.lat) {
        record.lat = Math.round(userLL.lat*100)/100;
        record.lng = Math.round(userLL.lng*100)/100;
      }
      // Delete old entry then insert fresh - most reliable approach
      sb.from("presence").delete().eq("id",presenceId).then(function(){
        sb.from("presence").insert(record).then(function(r){
          if(r.error) console.log("presence insert error:", r.error.message);
        });
      });
    }

    updatePresence();
    var interval = setInterval(updatePresence, 60000);

    // Remove presence on page unload
    function onUnload(){
      sb.from("presence").delete().eq("id",presenceId);
    }
    window.addEventListener("beforeunload", onUnload);

    return function(){
      clearInterval(interval);
      window.removeEventListener("beforeunload", onUnload);
      sb.from("presence").delete().eq("id",presenceId);
    };
  },[splashDone, uname]);

  // Listen for hashchange (when SW navigates existing client)
  useEffect(function(){
    function onHashChange() {
      var hash = window.location.hash;
      console.log("hashchange fired:", hash);
      if(hash && hash.includes("pin=")) {
        var pinId = hash.split("pin=")[1].split("&")[0];
        if(pinId && pins.length) {
          var pin = pins.find(function(p){return p.id===pinId;});
          if(pin){
            window.location.hash = "";
            openNotifPin(pin);
          } else {
            window._pendingPinId = pinId;
          }
        } else if(pinId) {
          window._pendingPinId = pinId;
        }
      }
    }
    window.addEventListener("hashchange", onHashChange);
    return function(){ window.removeEventListener("hashchange", onHashChange); };
  },[pins]);

  // Listen via BroadcastChannel (most reliable cross-browser)
  useEffect(function(){
    var bc = null;
    try {
      bc = new BroadcastChannel("pinmap-notifications");
      bc.onmessage = function(event) {
        console.log("BroadcastChannel received:", JSON.stringify(event.data));
        if(event.data && (event.data.type === "check-notifications" || event.data.type === "open-pin")) {
          window.dispatchEvent(new Event("pinmap-check-notifications"));
        }
      };
    } catch(e) { console.log("BroadcastChannel not supported"); }
    return function(){ if(bc) bc.close(); };
  },[]);

  // Listen for SW postMessage when notification is clicked
  useEffect(function(){
    function onMessage(event) {
      console.log("SW message received:", JSON.stringify(event.data));
      if(event.data && (event.data.type === "check-notifications" || event.data.type === "open-pin")) {
        window.dispatchEvent(new Event("pinmap-check-notifications"));
      }
    }
    navigator.serviceWorker && navigator.serviceWorker.addEventListener("message", onMessage);
    return function(){ navigator.serviceWorker && navigator.serviceWorker.removeEventListener("message", onMessage); };
  },[]);

  // Check notifications from DB when SW signals
  useEffect(function(){
    function onCheckNotif(){
      if(!uname||uname==="guest") return;
      api.getNotifications(uname).then(function(notifs){
        if(!notifs||!notifs.length) return;
        var latest = notifs[0];
        // Only mark THIS notification as seen when user views it
        var pin = pins.find(function(p){return p.id===latest.pin_id;});
        if(pin){
          openNotifPin(pin, latest.id, notifs.length);
        } else {
          setNotifPin({id:latest.pin_id, name:latest.pin_name, tags:[], lat:0, lng:0, _noFocus:true, _notifId:latest.id, _remaining:notifs.length});
        }
      });
    }
    window.addEventListener("pinmap-check-notifications", onCheckNotif);
    return function(){ window.removeEventListener("pinmap-check-notifications", onCheckNotif); };
  },[uname, pins]);

  function openNotifPin(pin, notifId, remaining) {
    setNotifPin(Object.assign({}, pin, {_notifId:notifId, _remaining:remaining||1}));
    if(!pin._noFocus) focusPin(pin);
  }

  // Open pending pin when pins are available
  useEffect(function(){
    if(!splashDone || !pins.length) return;
    window._allPins = pins;
    var pinId = window._pendingPinId;
    if(!pinId && window.location.hash && window.location.hash.includes("pin=")) {
      pinId = window.location.hash.split("pin=")[1].split("&")[0];
    }
    if(!pinId) return;
    var pin = pins.find(function(p){return p.id===pinId;});
    if(!pin) return;
    window._pendingPinId = null;
    window.location.hash = "";
    var attempts = 0;
    var tryFocus = function(){
      if(mapObj.current && window.L){
        focusPin(pin);
      } else if(attempts < 20){
        attempts++;
        setTimeout(tryFocus, 300);
      }
    };
    setTimeout(tryFocus, 500);
  },[splashDone, pins]);

  // Keep mapLayerRef in sync so marker closures always see current value
  useEffect(function(){ mapLayerRef.current = mapLayer; },[mapLayer]);

  // Show install prompt after 5 seconds if available
  useEffect(function(){
    if(!splashDone) return;
    var timer = setTimeout(function(){
      // Check if already installed
      if(window.matchMedia("(display-mode: standalone)").matches) return;
      if(localStorage.getItem("pm-install-dismissed")) return;
      if(window._installPromptEvent){
        setInstallPrompt(window._installPromptEvent);
        setShowInstall(true);
      } else {
        // iOS or unsupported - show manual instructions
        var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        if(isIOS) setShowInstall("ios");
      }
    }, 5000);
    return function(){ clearTimeout(timer); };
  },[splashDone]);

  useEffect(function(){
    // Wire SW update flag to React state
    window._setUpdateReady = setUpdateReady;
    // Check if update was already detected before React mounted
    if(window._swUpdateReady) setUpdateReady(true);
    return function(){ window._setUpdateReady = null; };
  },[]);

  function checkNewComments(pinsData, nameOverride) {
    var name = nameOverride || uname;
    if(!name || name==="guest") return;
    var lastSeen = localStorage.getItem("pm-comments-seen-"+name);
    var lastSeenTime = lastSeen ? new Date(lastSeen) : new Date(0);
    var myPinIds = pinsData.filter(function(p){return p.owner===name&&!p.saved_from;}).map(function(p){return p.id;});
    if(!myPinIds.length) return;
    sb.from("comments").select("id,pin_id,created_at").in("pin_id",myPinIds).gt("created_at",lastSeenTime.toISOString()).then(function(r){
      if(r.data&&r.data.length>0){
        setUnreadCount(r.data.length);
        var ids=r.data.map(function(c){return c.pin_id;}).filter(function(v,i,a){return a.indexOf(v)===i;});
        setUnreadPinIds(ids);
      } else {
        setUnreadCount(0);
        setUnreadPinIds([]);
      }
    });
  }

  function markCommentsSeen() {
    localStorage.setItem("pm-comments-seen-"+uname, new Date().toISOString());
    setUnreadCount(0);
    setUnreadPinIds([]);
  }
  function dismissWhatsNew() {
    localStorage.setItem(WHATSNEW_KEY,"1");
    setShowWhatsNew(false);
  }

  function nextOnboard() {
    if(onboardStep>=ONBOARD_STEPS.length-1){ localStorage.setItem(ONBOARD_KEY,"1"); setOnboardStep(-1); }
    else { setOnboardStep(function(s){return s+1;}); }
  }
  function skipOnboard() { localStorage.setItem(ONBOARD_KEY,"1"); setOnboardStep(-1); }

  useEffect(function(){
    api.getSession().then(function(res){
      var session=res.data&&res.data.session;
      if(session&&session.user){ setUser(session.user); setSplashDone(true); }
      setSessionChecked(true);
    }).catch(function(err){
      console.error("Auth error:", err);
      setSessionChecked(true);
    });
    var sub=api.onAuthChange(function(event,session){
      if(session&&session.user){ setUser(session.user); setSplashDone(true); }
      else { setUser(null); }
    });
    return function(){ if(sub&&sub.data&&sub.data.subscription) sub.data.subscription.unsubscribe(); };
  },[]);

  useEffect(function(){
    function tryInit(){
      if(!mapDiv.current||!window.L){setTimeout(tryInit,100);return;}
      if(mapObj.current) return;
      var map=window.L.map(mapDiv.current,{zoomControl:false,scrollWheelZoom:true}).setView([39,-98],4);
      window.L.control.zoom({position:"bottomleft"}).addTo(map);
      var initTile = window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"(c) OpenStreetMap contributors",maxZoom:19});
      initTile.addTo(map);
      currentBase.current = [initTile];
      setTimeout(function(){map.invalidateSize();},300);
      map.on("moveend",function(){var c=map.getCenter();setMapCenter({lat:c.lat,lng:c.lng});});
      map.on("click",function(ev){setPendingLL(ev.latlng);setTab("add");setOpen(true);flash("📍 Location set — fill details in Drop tab");});
      map.on("zoomstart",function(){
        // Clear ALL markers immediately - prevents ghost clusters
        if(window._pinLayer) window._pinLayer.clearLayers();
        Object.values(markers.current).forEach(function(m){ try{m.remove();}catch(e){}; });
        markers.current = {};
      });
      map.on("zoomend",function(){
        if(window._pinLayer) window._pinLayer.clearLayers();
        Object.values(markers.current).forEach(function(m){ try{m.remove();}catch(e){}; });
        markers.current = {};
        setMapZoom(map.getZoom());
      });
      mapObj.current=map;
    }
    if(splashDone) tryInit();
  },[splashDone]);

  useEffect(function(){
    if(!splashDone) return;
    setLoading(true);
    api.list().then(function(data){
      if(Array.isArray(data)){
        setPins(data);
        window._allPins = data;
        window._pinsLoaded = true;
        checkNewComments(data);
      }
    }).catch(function(){flash("Could not load pins");}).finally(function(){setLoading(false);});
    // Load trending tags
    setTrendingLoading(true);
    api.getTrending().then(function(data){setTrending(data);setTrendingLoading(false);});
  },[splashDone]);

  useEffect(function(){
    if(!user||!uname||uname==="guest") return;
    api.getFollows(uname).then(function(data){setFollows(data||[]);});
    api.getUserFollows(uname).then(function(data){setUserFollows(data||[]);});
    api.getSavedPins(uname).then(function(data){setSavedPins(data||[]);});
    api.getProfile(uname).then(function(data){
      if(data) setMyProfile(data);
    });
    // Clean up old seen notifications (older than 7 days)
    api.deleteOldNotifs(uname);
    // Subscribe to push once - only if not already enabled
    if(!pushEnabled && "PushManager" in window && Notification.permission==="granted"){
      subscribeToPush(uname).then(function(){
        setPushEnabled(true);
      }).catch(function(){});
    }
  },[user]);

  // Switch base layer when baseLayer state changes
  useEffect(function(){
    if(!mapObj.current||!window.L) return;
    var def = BASE_LAYERS.find(function(b){return b.id===baseLayer;});
    if(!def) return;
    // Remove current base and overlay
    if(currentBase.current){ currentBase.current.forEach(function(l){l.remove();}); }
    // Add new base
    var layers = [];
    var base = window.L.tileLayer(def.url,{attribution:def.attr,maxZoom:19});
    base.addTo(mapObj.current);
    layers.push(base);
    if(def.overlay){
      var ov = window.L.tileLayer(def.overlay,{attribution:def.attr,maxZoom:19,opacity:0.85});
      ov.addTo(mapObj.current);
      layers.push(ov);
    }
    currentBase.current = layers;
  },[baseLayer]);

  // Re-check comments whenever user, pins or tab changes
  useEffect(function(){
    var name = user ? (user.user_metadata&&user.user_metadata.full_name ? user.user_metadata.full_name : (user.email?user.email.split("@")[0]:"")) : "";
    if(pins.length > 0 && name && name !== "guest") checkNewComments(pins, name);
    if(tab === "admin" && uname === "Seth Gray") loadAdminStats();
    // Auto-refresh admin stats every 30 seconds while on admin tab
    var adminInterval = null;
    if(tab === "admin" && uname === "Seth Gray"){
      adminInterval = setInterval(function(){ loadAdminStats(); }, 30000);
    }
    return function(){ if(adminInterval) clearInterval(adminInterval); };
    // Load comment counts for all my pins when Mine tab opens
    if(tab==="mine" && pins.length>0 && name && name!=="guest"){
      var myPinIds=pins.filter(function(p){return p.owner===name&&!p.saved_from;}).map(function(p){return p.id;});
      if(myPinIds.length){
        sb.from("comments").select("pin_id").in("pin_id",myPinIds).then(function(r){
          var counts={};
          (r.data||[]).forEach(function(c){counts[c.pin_id]=(counts[c.pin_id]||0)+1;});
          setCommentCounts(counts);
        });
      }
    }
  },[user, pins, tab]);

  useEffect(function(){
    if(!mapObj.current||!window.L) return;
    // Clear ALL existing markers atomically
    if(window._pinLayer){ window._pinLayer.clearLayers(); }
    else { window._pinLayer = window.L.layerGroup().addTo(mapObj.current); }
    Object.values(markers.current).forEach(function(m){ try{m.remove();}catch(e){} });
    markers.current={};
    var map=mapObj.current;
    var zoom=map.getZoom();

    if(zoom<=12){
      var clPins=pins.filter(function(p){
        if(mapLayerRef.current==="mine") return p.owner===uname;
        if(mapLayerRef.current==="public") return p.privacy==="public"||p.owner===uname;
        if(mapLayerRef.current==="none") return false;
        return true;
      });
      if(activeFilter) clPins=clPins.filter(function(p){return p.tags&&p.tags.indexOf(activeFilter)>=0;});
      var clusters=[], used=new Array(clPins.length).fill(false);
      for(var ci=0;ci<clPins.length;ci++){
        if(used[ci]) continue;
        var grp=[clPins[ci]]; used[ci]=true;
        var pt1=map.latLngToContainerPoint([clPins[ci].lat,clPins[ci].lng]);
        for(var cj=ci+1;cj<clPins.length;cj++){
          if(used[cj]) continue;
          var pt2=map.latLngToContainerPoint([clPins[cj].lat,clPins[cj].lng]);
          if(Math.sqrt(Math.pow(pt1.x-pt2.x,2)+Math.pow(pt1.y-pt2.y,2))<40){grp.push(clPins[cj]);used[cj]=true;}
        }
        clusters.push(grp);
      }
      clusters.forEach(function(grp){
        var clat=grp.reduce(function(s,p){return s+p.lat;},0)/grp.length;
        var clng=grp.reduce(function(s,p){return s+p.lng;},0)/grp.length;
        var clrColor=grp[0].color||tagColor(grp[0].tags&&grp[0].tags[0]||"x");
        if(grp.length===1){
          var pin=grp[0]; var color=pin.color||tagColor(pin.tags&&pin.tags[0]||"x");
          var pinEmoji=getPinIcon(pin.tags); var hasEmoji=pinEmoji!=="📍";
          var innerHtml=hasEmoji?'<foreignObject x="3" y="3" width="20" height="20"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:12px;text-align:center;line-height:20px">'+pinEmoji+'</div></foreignObject>':'<circle cx="13" cy="13" r="4" fill="white"/>';
          var icon=window.L.divIcon({className:"pm-pin",html:'<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.18))"><path d="M14 0 C 6.27 0 0 6.27 0 14 c 0 9.5 14 22 14 22 s 14 -12.5 14 -22 C 28 6.27 21.73 0 14 0 z" fill="'+color+'" stroke="#f6f1e4" stroke-width="1.5"/>'+innerHtml+'</svg>',iconSize:[28,36],iconAnchor:[14,36]});
          var m=window.L.marker([pin.lat,pin.lng],{icon:icon});
          m.on("click",function(){if(pin.owner!==uname&&(mapLayerRef.current==="mine"||mapLayerRef.current==="none"))setMapLayer("public");setSelPin(pin);setOpen(false);if(pin.owner===uname)markCommentsSeen();});
          m.addTo(window._pinLayer); markers.current[pin.id]=m;
        } else {
          var sz=grp.length>99?52:grp.length>9?46:40;
          var cIcon=window.L.divIcon({className:"",html:'<div style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:'+clrColor+';border:3px solid rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;cursor:pointer;font-size:'+(grp.length>9?12:14)+'px;font-family:Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.3)">'+grp.length+'</div>',iconSize:[sz,sz],iconAnchor:[sz/2,sz/2]});
          var cm=window.L.marker([clat,clng],{icon:cIcon});
          var grpCopy=grp.slice();
          cm.on("click",function(){map.fitBounds(window.L.latLngBounds(grpCopy.map(function(p){return[p.lat,p.lng];})),{padding:[60,60],maxZoom:14});});
          cm.addTo(window._pinLayer); markers.current["cl_"+ci]=cm;
        }
      });
      if(focusPinId.current){
        var fpid=focusPinId.current;
        setTimeout(function(){var fm=markers.current[fpid];if(fm&&fm._icon){if(focusedMarker.current&&focusedMarker.current._icon)focusedMarker.current._icon.classList.remove("pin-focused");fm._icon.classList.add("pin-focused");focusedMarker.current=fm;focusPinId.current=null;setTimeout(function(){if(fm._icon)fm._icon.classList.remove("pin-focused");},2200);}},200);
      }
      return;
    }

    var now = new Date();
    var soon = new Date(now.getTime()+7*24*60*60*1000);
    var layerPins = pins.filter(function(p){
      // Hide expired pins from map
      if(p.expires_at && new Date(p.expires_at) < now && p.owner!==uname) return false;
      // Expiring filter
      if(showExpiringOnly) return p.expires_at && new Date(p.expires_at)>now && new Date(p.expires_at)<soon && p.privacy==="public";
      if(mapLayer==="mine")   return p.owner===uname;
      if(mapLayer==="public") return p.privacy==="public"||p.owner===uname;
      if(mapLayer==="none")   return false;
      return true;
    });
    var visible=activeFilter?layerPins.filter(function(p){return p.tags&&p.tags.indexOf(activeFilter)>=0;}):layerPins;
    visible.forEach(function(pin){
      var color=pin.color||tagColor(pin.tags&&pin.tags[0]||"x");
      var pinEmoji=getPinIcon(pin.tags);
      var hasEmoji = pinEmoji !== "📍";
      var innerHtml = hasEmoji
        ? '<foreignObject x="3" y="3" width="20" height="20"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:12px;text-align:center;line-height:20px">'+pinEmoji+'</div></foreignObject>'
        : '<circle cx="13" cy="13" r="4" fill="white"/>';
      var icon=window.L.divIcon({
        className:"pm-pin",
        html:'<svg width="30" height="38" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg"><path d="M13 0C5.82 0 0 5.82 0 13c0 9.75 13 21 13 21S26 22.75 26 13C26 5.82 20.18 0 13 0z" fill="'+color+'" stroke="white" stroke-width="1.5"/>'+innerHtml+'</svg>',
        iconSize:[30,38],
        iconAnchor:[15,38]
      });
      var m=window.L.marker([pin.lat,pin.lng],{icon:icon}).addTo(window._pinLayer);
      m.on("click",function(){if(pin.owner!==uname&&(mapLayerRef.current==="mine"||mapLayerRef.current==="none")){setMapLayer("public");flash("Switched to show all public pins");}setSelPin(pin);setOpen(false);if(pin.owner===uname)markCommentsSeen();});
      markers.current[pin.id]=m;
    });
    // Apply pulse to focused pin after markers re-render
    if(focusPinId.current){
      var pid = focusPinId.current;
      setTimeout(function(){
        var m = markers.current[pid];
        if(m && m._icon){
          if(focusedMarker.current && focusedMarker.current._icon){
            focusedMarker.current._icon.classList.remove("pin-focused");
          }
          m._icon.classList.add("pin-focused");
          focusedMarker.current = m;
          focusPinId.current = null;
          setTimeout(function(){if(m._icon)m._icon.classList.remove("pin-focused");},2200);
        }
      }, 200);
    }
  },[pins,activeFilter,mapLayer,uname,mapZoom,showExpiringOnly]);

  function requireAuth(cb) { if(!user){api.signInGoogle();return;} cb(); }

  function loadAdminStats() {
    if(uname !== "Seth Gray") return;
    setAdminLoading(true);
    var now = new Date();
    var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    var weekStart = new Date(now.getTime() - 7*24*60*60*1000).toISOString();
    var fiveMinAgo = new Date(Date.now()-5*60*1000).toISOString();
    Promise.all([
      sb.from("pins").select("id,owner,created_at,tags,lat,lng").order("created_at",{ascending:false}),
      sb.from("comments").select("id,owner,created_at"),
      sb.from("push_subscriptions").select("owner"),
      sb.from("follows").select("owner,tag"),
      sb.from("user_follows").select("owner,following"),
      sb.from("notifications").select("id,owner,created_at,seen"),
      sb.from("presence").select("*").gte("last_seen",fiveMinAgo)
    ]).then(function(results) {
      var pins = results[0].data||[];
      var comments = results[1].data||[];
      var subs = results[2].data||[];
      var tagFollows = results[3].data||[];
      var userFollows = results[4].data||[];
      var notifs = results[5].data||[];
      var activeNow = results[6].data||[];

      // Unique users
      var allOwners = [...new Set(pins.map(function(p){return p.owner;}))];
      // Pins today
      var pinsToday = pins.filter(function(p){return p.created_at>=todayStart;}).length;
      var pinsWeek = pins.filter(function(p){return p.created_at>=weekStart;}).length;
      // Comments today
      var commentsToday = comments.filter(function(c){return c.created_at>=todayStart;}).length;
      // Top users by pin count
      var userPinCounts = {};
      pins.forEach(function(p){ userPinCounts[p.owner]=(userPinCounts[p.owner]||0)+1; });
      var topUsers = Object.keys(userPinCounts).map(function(u){return {user:u,count:userPinCounts[u]};}).sort(function(a,b){return b.count-a.count;}).slice(0,10);
      // Top tags
      var tagCounts = {};
      pins.forEach(function(p){(p.tags||[]).forEach(function(t){tagCounts[t]=(tagCounts[t]||0)+1;});});
      var topTags = Object.keys(tagCounts).map(function(t){return {tag:t,count:tagCounts[t]};}).sort(function(a,b){return b.count-a.count;}).slice(0,10);
      // Recent pins with location
      var recentPins = pins.slice(0,20);
      // Push enabled users
      var pushUsers = [...new Set(subs.map(function(s){return s.owner;}))];
      // Unseen notifications
      var unseenNotifs = notifs.filter(function(n){return !n.seen;}).length;

      setAdminStats({
        totalPins: pins.length,
        totalComments: comments.length,
        totalUsers: allOwners.length,
        pinsToday, pinsWeek, commentsToday,
        topUsers, topTags, recentPins,
        pushEnabled: pushUsers.length,
        tagFollows: tagFollows.length,
        userFollows: userFollows.length,
        unseenNotifs, pushUsers,
        activeNow: activeNow,
        activeCount: activeNow.length
      });
      setAdminLoading(false);
    });
  }

  function focusPin(pin) {
    if(pin.owner!==uname && (mapLayerRef.current==="mine"||mapLayerRef.current==="none")){
      setMapLayer("public");
    }
    // Zoom in close
    if(mapObj.current){
      // Pan pin to upper third so detail popup has room below
      var map=mapObj.current;
      map.setView([pin.lat,pin.lng],18);
      // Offset the center point down so pin appears in upper portion
      setTimeout(function(){
        var px=map.latLngToContainerPoint([pin.lat,pin.lng]);
        var offset=map.getSize().y*0.18; // shift pin up by 18% of screen height
        var newPx=window.L.point(px.x,px.y+offset);
        var newLatLng=map.containerPointToLatLng(newPx);
        map.setView(newLatLng,18,{animate:true});
      },100);
    }
    // Auto-open detail popup
    setSelPin(pin);
    setOpen(false);
    // Store pin id so sync markers can apply pulse after re-render
    focusPinId.current = pin.id;
    // Also try immediately in case markers don't need re-rendering
    setTimeout(function(){
      var m = markers.current[pin.id];
      if(m && m._icon){
        if(focusedMarker.current && focusedMarker.current._icon){
          focusedMarker.current._icon.classList.remove("pin-focused");
        }
        m._icon.classList.add("pin-focused");
        focusedMarker.current = m;
        focusPinId.current = null;
        setTimeout(function(){if(m._icon)m._icon.classList.remove("pin-focused");},2200);
      }
    }, 600);
  }

  function loadUserProfile(owner) {
    if(owner === uname) { setOpen(true); setTab("profile"); return; }
    setViewUser(owner);
    setUserPins([]);
    setUserPinsLoading(true);
    sb.from("pins").select("*").eq("owner",owner).eq("privacy","public").order("created_at",{ascending:false})
      .then(function(r){
        setUserPins(r.data||[]);
        setUserPinsLoading(false);
        // Fly map to show their pins
        if(r.data&&r.data.length>0&&mapObj.current&&window.L){
          var lats=r.data.map(function(p){return p.lat;});
          var lngs=r.data.map(function(p){return p.lng;});
          var bounds=window.L.latLngBounds(
            [Math.min.apply(null,lats),Math.min.apply(null,lngs)],
            [Math.max.apply(null,lats),Math.max.apply(null,lngs)]
          );
          mapObj.current.fitBounds(bounds,{padding:[60,60]});
        }
      });
    api.getProfile(owner).then(function(data){setViewProfile(data||{});});
  }

  function saveProfile(){
    var profile = Object.assign({id:uname, updated_at:new Date().toISOString()}, profileForm);
    api.upsertProfile(profile).then(function(r){
      if(r&&r.error) flash("Save failed: "+r.error.message);
      else { setMyProfile(profile); setEditingProfile(false); flash("Profile saved!"); }
    }).catch(function(e){flash("Save failed: "+e.message);});
  }

  function toggleSavePin(pin){
    requireAuth(function(){
      var isSaved = pin.saved_by && pin.saved_by.indexOf(uname)>=0;
      var newSavedBy = isSaved
        ? (pin.saved_by||[]).filter(function(u){return u!==uname;})
        : (pin.saved_by||[]).concat([uname]);
      api.savePin(pin.id, newSavedBy).then(function(){
        setPins(function(prev){return prev.map(function(p){return p.id===pin.id?Object.assign({},p,{saved_by:newSavedBy}):p;});});
        setSelPin(function(prev){return prev&&prev.id===pin.id?Object.assign({},prev,{saved_by:newSavedBy}):prev;});
        if(isSaved){
          setSavedPins(function(prev){return prev.filter(function(p){return p.id!==pin.id;});});
          flash("Pin unsaved");
        } else {
          setSavedPins(function(prev){return prev.concat([Object.assign({},pin,{saved_by:newSavedBy})]);});
          flash("Pin saved!");
        }
      });
    });
  }

  function toggleUserFollow(targetUser){
    requireAuth(function(){
      var existing=userFollows.find(function(f){return f.following===targetUser;});
      if(existing){
        api.unfollowUser(existing.id,uname).then(function(){
          setUserFollows(function(prev){return prev.filter(function(f){return f.id!==existing.id;});});
          flash("Unfollowed @"+targetUser);
        });
      } else {
        var id=uid();
        api.followUser(id,uname,targetUser).then(function(){
          setUserFollows(function(prev){return prev.concat([{id:id,owner:uname,following:targetUser}]);});
          flash("Following @"+targetUser);
        });
      }
    });
  }

  function toggleFollow(tag){
    requireAuth(function(){
      var existing = follows.find(function(f){return f.tag===tag;});
      if(existing){
        api.unfollow(existing.id,uname).then(function(){
          setFollows(function(prev){return prev.filter(function(f){return f.id!==existing.id;});});
          flash("Unfollowed #"+tag);
        });
      } else {
        var id = uid();
        api.follow(id,uname,tag).then(function(){
          setFollows(function(prev){return prev.concat([{id:id,owner:uname,tag:tag}]);});
          flash("Following #"+tag);
        });
      }
    });
  }

  function switchBaseLayer(id){
    setBaseLayer(id);
    setLayerMenuOpen(false);
  }

  function openEdit(pin){
    setEditPin(pin);
    setEditForm({name:pin.name,description:pin.description||"",tags:(pin.tags||[]).join(" "),color:pin.color||"#2a5d3c",photo:pin.photo||null});
    setSelPin(null);
  }

  function saveEdit(){
    if(!editForm.name.trim()){flash("Name required");return;}
    var tags=editForm.tags.split(/[\s,]+/).map(function(t){return t.replace(/^#/,"").toLowerCase();}).filter(Boolean);
    var banned=checkBannedTags(tags);
    if(banned.length>0){flash("Tag not allowed: #"+banned.join(", #"));return;}
    var doUpdate = function(photoUrl) {
      var patch={name:editForm.name.trim(),description:editForm.description.trim(),tags:tags,color:editForm.color,photo:photoUrl};
      api.update(editPin.id,patch,uname).then(function(){
        setPins(function(prev){return prev.map(function(p){return p.id===editPin.id?Object.assign({},p,patch):p;});});
        setEditPin(null);
        flash("Pin updated!");
      }).catch(function(){flash("Update failed");});
    };
    if(editForm.photo && editForm.photo.startsWith('data:')) {
      flash("Uploading photo...");
      uploadPhoto(editForm.photo, editPin.id).then(function(url){
        doUpdate(url);
      }).catch(function(){
        doUpdate(editForm.photo);
      });
    } else {
      doUpdate(editForm.photo||null);
    }
  }

  function savePin(){
    requireAuth(function(){
      if(!pendingLL){flash("Click the map first");return;}
      if(!form.name.trim()){flash("Name required");return;}
      if(!form.tags.trim()){flash("At least one tag required");return;}
      var tags=form.tags.split(/[\s,]+/).map(function(t){return t.replace(/^#/,"").toLowerCase();}).filter(Boolean);
      var banned=checkBannedTags(tags);
      if(banned.length>0){flash("Tag not allowed: #"+banned.join(", #"));return;}
      var pin={id:uid(),owner:uname,name:form.name.trim(),description:form.description.trim(),tags:tags,privacy:form.privacy,lat:pendingLL.lat,lng:pendingLL.lng,photo:form.photo||null,color:form.color||"#2a5d3c",upvotes:[],saved_by:[],saved_from:null,expires_at:form.expires_at?new Date(form.expires_at).toISOString():null};
      var photoData = pin.photo;
      var doInsert = function(photoUrl) {
        var pinToSave = Object.assign({}, pin, {photo: photoUrl});
        if(!navigator.onLine){
          // Save to offline queue
          dbPut("pins", Object.assign({}, pinToSave, {_offline:true})).then(function(){
            setPins(function(p){return [Object.assign({},pinToSave,{_offline:true})].concat(p);});
            setQueueCount(function(c){return c+1;});
            setForm({name:"",description:"",tags:"",privacy:"public",photo:null,color:"#2a5d3c",expires_at:""});
            setPendingLL(null);setTab("mine");
            flash("📡 Offline — pin saved locally, will sync when online");
          });
        } else {
          api.insert(pinToSave).then(function(){
            setPins(function(p){
              // Check if this is first pin before adding
              var isFirst=p.filter(function(x){return x.owner===uname&&!x.saved_from;}).length===0;
              if(isFirst) setTimeout(function(){setShowFirstPin(true);},600);
              return [pinToSave].concat(p);
            });
            setForm({name:"",description:"",tags:"",privacy:"public",photo:null,color:"#2a5d3c",expires_at:""});
            setPendingLL(null);setTab("mine");flash("Pin saved!");
            if(pinToSave.privacy==="public") {
              callEdgeFunction("new_pin", {pinOwner:uname, pinName:pinToSave.name, pinId:pinToSave.id});
            }
          }).catch(function(){flash("Save failed");});
        }
      };
      if(photoData && photoData.startsWith('data:')) {
        flash("Uploading photo...");
        uploadPhoto(photoData, pin.id).then(function(url){
          doInsert(url);
        }).catch(function(){
          // Fall back to base64 if upload fails
          doInsert(photoData);
          flash("Pin saved (photo stored locally)");
        });
      } else {
        doInsert(photoData);
      }
    });
  }

  function deletePin(id){
    api.remove(id,uname).then(function(){
      setPins(function(p){return p.filter(function(x){return x.id!==id;});});
      if(selPin&&selPin.id===id) setSelPin(null);
      flash("Removed");
    }).catch(function(){flash("Delete failed");});
  }

  function toggleUpvote(pinId){
    requireAuth(function(){
      var pin=pins.find(function(p){return p.id===pinId;}); if(!pin) return;
      var has=pin.upvotes&&pin.upvotes.indexOf(uname)>=0;
      var upvotes=has?pin.upvotes.filter(function(u){return u!==uname;}):(pin.upvotes||[]).concat([uname]);
      // Update local state immediately (optimistic update)
      setPins(function(prev){return prev.map(function(p){return p.id===pinId?Object.assign({},p,{upvotes:upvotes}):p;});});
      // Also update selPin so the open popup reflects immediately
      setSelPin(function(prev){return prev&&prev.id===pinId?Object.assign({},prev,{upvotes:upvotes}):prev;});
      api.upvotePin(pinId,upvotes).then(function(){
        setSelPin(function(sp){return sp&&sp.id===pinId?Object.assign({},sp,{upvotes:upvotes}):sp;});
      }).catch(function(){flash("Failed");});
    });
  }

  function saveToCollection(pin){
    requireAuth(function(){
      if(pin.owner===uname){flash("Already your pin");return;}
      var id=pin.id+"_saved_"+uname;
      if(pins.find(function(p){return p.id===id;})){flash("Already saved");return;}
      var saved=Object.assign({},pin,{id:id,owner:uname,saved_from:pin.owner,privacy:"private",upvotes:[],saved_by:[]});
      api.insert(saved).then(function(){setPins(function(p){return [saved].concat(p);});flash("Saved!");}).catch(function(){flash("Failed");});
    });
  }

  function doAddrSearch(){
    if(!addrSearch.trim()) return;
    setAddrLoading(true);
    setAddrResults([]);
    fetch("https://nominatim.openstreetmap.org/search?format=json&limit=5&q="+encodeURIComponent(addrSearch),{
      headers:{"Accept-Language":"en","User-Agent":"PINMAP-App"}
    }).then(function(r){return r.json();}).then(function(data){
      setAddrResults(data||[]);
      setAddrLoading(false);
    }).catch(function(){setAddrLoading(false);flash("Address search failed");});
  }

  function goToAddr(result){
    var lat=parseFloat(result.lat), lng=parseFloat(result.lon);
    if(mapObj.current){
      mapObj.current.setView([lat,lng],15);
      if(window.L){
        if(window._addrMarker) window._addrMarker.remove();
        window._addrMarker=window.L.marker([lat,lng],{
          icon:window.L.divIcon({
            className:"pm-pin",
            html:'<div style="background:#1565c0;color:#fff;border-radius:8px;padding:4px 8px;font-size:11px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-family:Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif">'+result.display_name.split(",")[0]+'</div>',
            iconAnchor:[0,0]
          })
        }).addTo(mapObj.current);
        setTimeout(function(){if(window._addrMarker)window._addrMarker.remove();},5000);
      }
    }
    setAddrResults([]);
    setAddrSearch("");
    flash("Found: "+result.display_name.split(",").slice(0,2).join(","));
  }

  function doSearch(){
    if(!searchTag.trim()) return;
    var tag=searchTag.replace(/^#/,"").toLowerCase().trim();
    api.search(tag).then(function(data){
      var results=Array.isArray(data)?data:[];
      setSearchResults({tag:tag,results:results});
      setActiveFilter(tag);
      setPins(function(prev){var ids=new Set(prev.map(function(p){return p.id;}));return prev.concat(results.filter(function(r){return !ids.has(r.id);}));});
      // If results contain other users' pins and layer would hide them, switch to public
      var hasOtherPins=results.some(function(r){return r.owner!==uname;});
      if(hasOtherPins&&(mapLayerRef.current==="mine"||mapLayerRef.current==="none")){
        setMapLayer("public");
        flash("Switched to show all public pins");
      } else if(!results.length) {
        flash("No public pins for #"+tag);
      }
    }).catch(function(){flash("Search failed");});
  }

  function findNearby(){
    if(!userLL){flash("Use GPS button first");return;}
    var results=pins.filter(function(p){return p.privacy==="public"||p.owner===uname;})
      .map(function(p){return Object.assign({},p,{dist:distKm(userLL.lat,userLL.lng,p.lat,p.lng)});})
      .filter(function(p){return p.dist<=nearbyKm;})
      .sort(function(a,b){return a.dist-b.dist;});
    setNearbyRes(results);
    if(!results.length) flash("No pins within "+nearbyKm+"km");
  }

  function gpsLocate(){
    if(!navigator.geolocation){flash("Not supported");return;}
    setLocating(true);
    navigator.geolocation.getCurrentPosition(function(pos){
      var lat=pos.coords.latitude,lng=pos.coords.longitude;
      setUserLL({lat:lat,lng:lng});
      if(mapObj.current) mapObj.current.setView([lat,lng],14);
      if(window._gpsM) window._gpsM.remove();
      if(window.L&&mapObj.current) window._gpsM=window.L.circleMarker([lat,lng],{radius:10,fillColor:"#1565c0",color:"#fff",weight:3,fillOpacity:0.85}).addTo(mapObj.current).bindPopup("You are here").openPopup();
      setLocating(false); flash("Location found!");
    },function(){setLocating(false);flash("Location unavailable");},{enableHighAccuracy:true,timeout:8000});
  }

  function compressAndSet(dataUrl, setter) {
    var img = new Image();
    img.onload = function(){
      var MAX=800, w=img.width, h=img.height;
      if(w>MAX||h>MAX){ if(w>h){h=Math.round(h*MAX/w);w=MAX;}else{w=Math.round(w*MAX/h);h=MAX;} }
      var canvas=document.createElement("canvas");
      canvas.width=w; canvas.height=h;
      canvas.getContext("2d").drawImage(img,0,0,w,h);
      var compressed=canvas.toDataURL("image/jpeg",0.75);
      setter(compressed);
      flash("Photo added ("+(Math.round(compressed.length*0.75/1024))+"KB)");
    };
    img.src = dataUrl;
  }

  function handlePhoto(ev){
    var file=ev.target.files[0]; if(!file) return;
    if(file.size>10*1024*1024){flash("Max 10MB");return;}
    var reader=new FileReader();
    reader.onload=function(ev2){
      compressAndSet(ev2.target.result, function(compressed){
        setForm(function(f){return Object.assign({},f,{photo:compressed});});
      });
    };
    reader.readAsDataURL(file);
  }

  function handlePhotoEdit(ev){
    var file=ev.target.files[0]; if(!file) return;
    if(file.size>10*1024*1024){flash("Max 10MB");return;}
    var reader=new FileReader();
    reader.onload=function(ev2){
      compressAndSet(ev2.target.result, function(compressed){
        setEditForm(function(f){return Object.assign({},f,{photo:compressed});});
      });
    };
    reader.readAsDataURL(file);
  }

  async function takePhoto(setter) {
    // Use Capacitor Camera if available, otherwise trigger file input
    if(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
      try {
        var Camera = window.Capacitor.Plugins.Camera;
        var image = await Camera.getPhoto({
          quality: 75,
          allowEditing: false,
          resultType: "base64",
          source: "PROMPT"  // shows camera + gallery choice
        });
        var dataUrl = "data:image/jpeg;base64," + image.base64String;
        compressAndSet(dataUrl, setter);
      } catch(err) {
        if(err.message !== "User cancelled photos app") flash("Camera unavailable");
      }
    } else {
      // Web/PWA - show choice between camera and gallery
      var choice = document.createElement("div");
      choice.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:flex-end;justify-content:center";
      var sheet = document.createElement("div");
      sheet.style.cssText = "background:#faf6ed;border-radius:16px 16px 0 0;padding:16px;width:100%;max-width:480px;font-family:Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      function makeBtn(label, capture) {
        var btn = document.createElement("button");
        btn.textContent = label;
        btn.style.cssText = "display:block;width:100%;padding:14px;margin-bottom:10px;background:#f0e8d4;border:1px solid #d8cfb8;border-radius:8px;font-size:15px;cursor:pointer;font-family:Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;color:#2c2416;text-align:left";
        btn.onclick = function(){
          document.body.removeChild(choice);
          var input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          if(capture) input.capture = capture;
          input.onchange = function(){
            var file = input.files[0]; if(!file) return;
            var reader = new FileReader();
            reader.onload = function(ev2){ compressAndSet(ev2.target.result, setter); };
            reader.readAsDataURL(file);
          };
          input.click();
        };
        return btn;
      }
      var cancelBtn = document.createElement("button");
      cancelBtn.textContent = "Cancel";
      cancelBtn.style.cssText = "display:block;width:100%;padding:14px;background:none;border:none;font-size:14px;cursor:pointer;font-family:Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;color:#9a8a70";
      cancelBtn.onclick = function(){ document.body.removeChild(choice); };
      sheet.appendChild(makeBtn("📷  Take a photo", "environment"));
      sheet.appendChild(makeBtn("🖼  Choose from gallery", ""));
      sheet.appendChild(cancelBtn);
      choice.appendChild(sheet);
      choice.onclick = function(ev){ if(ev.target===choice) document.body.removeChild(choice); };
      document.body.appendChild(choice);
    }
  }

  function onFabDown(ev){
    ev.preventDefault();
    var sx=ev.clientX,sy=ev.clientY,rect=ev.currentTarget.getBoundingClientRect(),moved=false;
    function onMove(e2){
      var dx=e2.clientX-sx,dy=e2.clientY-sy;
      if(Math.abs(dx)>5||Math.abs(dy)>5) moved=true;
      if(!moved) return;
      var np={right:Math.max(8,Math.min(window.innerWidth-64,window.innerWidth-(rect.right+dx))),bottom:Math.max(8,Math.min(window.innerHeight-64,window.innerHeight-(rect.bottom+dy)))};
      setFabPos(np);
      try{localStorage.setItem("pm-fab-pos",JSON.stringify(np));}catch(e){}
    }
    function onUp(){window.removeEventListener("pointermove",onMove);window.removeEventListener("pointerup",onUp);if(!moved)setOpen(function(o){return !o;});}
    window.addEventListener("pointermove",onMove);window.addEventListener("pointerup",onUp);
  }

  function bubblePos(){
    var vw=window.innerWidth,vh=window.innerHeight;
    var isDesktop=vw>=768;
    var bw=isDesktop?380:Math.min(340,vw-16);
    var bh=isDesktop?Math.min(vh*0.75,640):Math.min(vh*0.82,600);
    var right=fabPos.right,bottom=fabPos.bottom+58;
    if(bottom+bh>vh-12) bottom=Math.max(12,vh-bh-12);
    if(vw-right-bw<8) right=Math.max(8,vw-bw-8);
    return {position:"absolute",right:right,bottom:bottom,width:bw,maxHeight:bh,display:"flex",flexDirection:"column",background:"rgba(255,253,248,0.98)",backdropFilter:"blur(20px)",border:"1px solid #d8cfb8",borderRadius:16,boxShadow:"0 20px 60px rgba(0,0,0,0.18)",zIndex:1000,overflow:"hidden",transformOrigin:"bottom right"};
  }

  var myPins=pins.filter(function(p){return p.owner===uname;});
  var myTags=[].concat.apply([],[].map.call(myPins,function(p){return p.tags||[];})).filter(function(t,i,a){return a.indexOf(t)===i;});

  // Recent tags: from pins sorted by created_at desc, deduplicated, max 4
  var BASE_LAYERS = [
    {id:"osm",       label:"Standard",  icon:"🗺", url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",                                              attr:"(c) OpenStreetMap contributors"},
    {id:"topo",      label:"Topo",      icon:"▲",  url:"https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",                                               attr:"(c) OpenTopoMap contributors"},
    {id:"satellite", label:"Satellite", icon:"🛰",  url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",  attr:"(c) Esri"},
    {id:"trails",    label:"Trails",    icon:"🥾",  url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",                                              attr:"(c) OpenStreetMap contributors", overlay:"https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png"},
    {id:"seamap",    label:"Sea",       icon:"⚓",  url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",                                              attr:"(c) OpenSeaMap contributors",    overlay:"https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"}
  ];

  var DEFAULT_TAGS = ["trailhead","pub","murals","geocache","hiking","overlanding","kayaking","fishingspot"];
  var recentTagsSeen = {};
  var recentTags = [];
  var sortedPins = pins.slice().sort(function(a,b){return new Date(b.created_at)-new Date(a.created_at);});
  for(var _i=0; _i<sortedPins.length && recentTags.length<4; _i++){
    (sortedPins[_i].tags||[]).forEach(function(t){
      if(!recentTagsSeen[t] && recentTags.length<4){ recentTagsSeen[t]=1; recentTags.push(t); }
    });
  }
  // Pad with defaults if not enough recent tags
  var suggestTags = recentTags.slice();
  DEFAULT_TAGS.forEach(function(t){ if(suggestTags.length<8 && !recentTagsSeen[t]){ suggestTags.push(t); } });
  var TABS=[["search","Search"],["mine","Mine"],["add","Add"],["nearby","Nearby"],["profile","Profile"]].concat(uname==="Seth Gray"?[["admin","Admin"]]:[]);

  if(!sessionChecked||!splashDone){
    return e(Splash,{loading:!sessionChecked,onGoogle:api.signInGoogle,onGuest:function(){setSplashDone(true);}});
  }

  return e("div",{style:{position:"relative",height:"100vh",width:"100%",overflow:"hidden"}},

    e("div",{ref:mapDiv,style:{position:"absolute",top:0,left:0,right:0,bottom:"calc(60px + env(safe-area-inset-bottom,0px))",width:"100%",height:"100%",zIndex:0}}),

    showInstall && e("div",{style:{
      position:"fixed",
      animation:"slideUp 0.3s cubic-bezier(0.34,1.1,0.64,1) both",
      bottom:"calc(90px + env(safe-area-inset-bottom,0px))",
      left:16,right:16,
      background:"#1f4a30",color:"#fff",
      padding:"12px 16px",borderRadius:12,
      display:"flex",alignItems:"center",justifyContent:"space-between",
      zIndex:9997,boxShadow:"0 4px 20px rgba(0,0,0,0.3)",
      fontSize:13,gap:10
    }},
      e("div",{style:{display:"flex",alignItems:"center",gap:10,flex:1}},
        e("span",{style:{fontSize:22}},"📲"),
        e("div",null,
          e("div",{style:{fontWeight:700,fontSize:13}},"Install PINMAP"),
          e("div",{style:{fontSize:11,color:"rgba(255,255,255,0.7)"}},
            showInstall==="ios"
              ? "Tap Share → Add to Home Screen"
              : "Get the full app experience"
          )
        )
      ),
      e("div",{style:{display:"flex",gap:6,flexShrink:0}},
        e("button",{
          style:{background:"rgba(255,255,255,0.15)",color:"#fff",border:"1px solid rgba(255,255,255,0.3)",borderRadius:6,padding:"5px 10px",fontSize:11,cursor:"pointer"},
          onClick:function(){
            localStorage.setItem("pm-install-dismissed","1");
            setShowInstall(false);
          }
        },"Later"),
        showInstall!=="ios" && e("button",{
          style:{background:"#fff",color:"#1f4a30",border:"none",borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer"},
          onClick:function(){
            if(installPrompt){
              installPrompt.prompt();
              installPrompt.userChoice.then(function(){
                setShowInstall(false);
                setInstallPrompt(null);
              });
            }
          }
        },"Install")
      )
    ),

    showExpiringOnly && e("div",{style:{
      position:"fixed",
      top:"calc(56px + env(safe-area-inset-top,0px))",
      left:16,right:16,
      background:"#e65100",color:"#fff",
      padding:"8px 14px",borderRadius:10,
      display:"flex",alignItems:"center",justifyContent:"space-between",
      zIndex:9996,boxShadow:"0 2px 12px rgba(0,0,0,0.2)",
      fontSize:12
    }},
      e("span",null,"⏰ Showing expiring pins only"),
      e("button",{
        style:{background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",borderRadius:4,padding:"2px 8px",cursor:"pointer",fontSize:11},
        onClick:function(){setShowExpiringOnly(false);}
      },"✕ Clear")
    ),

    !isOnline && !offlineDismissed && e("div",{style:{
      position:"fixed",
      animation:"slideDown 0.25s ease both",
      top:"calc(56px + env(safe-area-inset-top,0px))",
      left:16,right:16,
      background:"#c62828",color:"#fff",
      padding:"8px 14px",borderRadius:10,
      display:"flex",alignItems:"center",justifyContent:"space-between",
      zIndex:9996,boxShadow:"0 2px 12px rgba(0,0,0,0.3)",
      fontSize:12,fontFamily:"Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",gap:10
    }},
      e("div",{style:{display:"flex",alignItems:"center",gap:8,flex:1}},
        e("span",{style:{fontSize:18}},"📡"),
        e("div",null,
          e("div",{style:{fontWeight:700}},"No connection"),
          e("div",{style:{fontSize:11,color:"rgba(255,255,255,0.8)"}},
            queueCount>0
              ? queueCount+" item"+(queueCount>1?"s":"")+" queued — pins & comments still work"
              : "Pins & comments still work offline"
          )
        )
      ),
      e("button",{
        style:{background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.4)",
          color:"#fff",borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer",
          fontFamily:"Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",flexShrink:0},
        onClick:function(){setOfflineDismissed(true);}
      },"OK")
    ),

    isOnline && queueCount>0 && e("div",{style:{
      position:"fixed",
      top:"calc(56px + env(safe-area-inset-top,0px))",
      left:16,right:16,
      background:"#2a5d3c",color:"#fff",
      padding:"8px 14px",borderRadius:10,
      display:"flex",alignItems:"center",justifyContent:"space-between",
      zIndex:9996,boxShadow:"0 2px 12px rgba(0,0,0,0.2)",
      fontSize:12,fontFamily:"Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    }},
      e("div",{style:{display:"flex",alignItems:"center",gap:8}},
        e("span",null,"✅"),
        e("div",null,"Back online — syncing "+queueCount+" item"+(queueCount>1?"s":"")+"...")
      )
    ),

    notifPin && e("div",{style:{
      position:"fixed",
      animation:"slideDown 0.25s ease both",
      top:"calc(70px + env(safe-area-inset-top,0px))",
      left:16,right:16,maxWidth:480,margin:"0 auto",
      background:"#1f4a30",color:"#fff",
      padding:"12px 16px",borderRadius:12,
      display:"flex",alignItems:"center",justifyContent:"space-between",
      zIndex:9997,boxShadow:"0 4px 20px rgba(0,0,0,0.3)",
      fontSize:13,gap:10
    }},
      e("div",{style:{display:"flex",alignItems:"center",gap:10,flex:1},
       },
        e("span",{style:{fontSize:22}},getPinIcon(notifPin.tags)),
        e("div",null,
          e("div",{style:{fontWeight:700,fontSize:13}},"💬 New comment on your pin"),
          e("div",{style:{fontSize:11,color:"rgba(255,255,255,0.7)"}},
            notifPin.name,
            notifPin._remaining>1&&e("span",{style:{marginLeft:6,background:"rgba(255,255,255,0.2)",padding:"1px 6px",borderRadius:10,fontSize:10}},"+"+( notifPin._remaining-1)+" more")
          )
        )
      ),
      e("button",{
        style:{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",color:"#fff",fontSize:11,cursor:"pointer",padding:"4px 10px",borderRadius:6,flexShrink:0},
        onClick:function(){
          if(notifPin._notifId) api.markNotifSeen(notifPin._notifId);
          setNotifPin(null);
          if(notifPin._remaining>1){ setTimeout(function(){ window.dispatchEvent(new Event("pinmap-check-notifications")); },400); }
        }
      },"Got it ✓")
    ),

    updateReady && e("div",{style:{
      position:"fixed",
      bottom:"calc(100px + env(safe-area-inset-bottom,0px))",
      left:16,right:16,
      background:"#2a5d3c",color:"#fff",
      padding:"12px 16px",borderRadius:12,
      display:"flex",alignItems:"center",justifyContent:"space-between",
      zIndex:9998,boxShadow:"0 4px 20px rgba(0,0,0,0.25)",
      fontSize:13,gap:10
    }},
      e("span",{style:{flex:1,lineHeight:1.4}},"New version of PINMAP is ready"),
      e("div",{style:{display:"flex",gap:8,flexShrink:0}},
        e("button",{
          style:{background:"rgba(255,255,255,0.2)",color:"#fff",border:"1px solid rgba(255,255,255,0.4)",borderRadius:6,padding:"6px 10px",fontSize:12,cursor:"pointer"},
          onClick:function(){setUpdateReady(false);}
        },"Later"),
        e("button",{
          style:{background:"#fff",color:"#2a5d3c",border:"none",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer"},
          onClick:function(){window.location.reload();}
        },"Update")
      )
    ),

    e("div",{style:{position:"absolute",top:"calc(16px + env(safe-area-inset-top,0px))",left:16,right:16,zIndex:999}},
      e("div",{style:{display:"flex",alignItems:"center",gap:8,background:"rgba(246,241,228,0.96)",backdropFilter:"blur(12px)",border:"1px solid "+T.border,borderRadius:12,padding:"10px 14px",boxShadow:T.shadow,cursor:"pointer"},
        onClick:function(){setSearchMode("tags");setTab("search");setOpen(true);}},
        e("svg",{width:16,height:16,viewBox:"0 0 24 24",fill:"none"},e("circle",{cx:"11",cy:"11",r:"8",stroke:T.ink3,strokeWidth:2}),e("path",{d:"M21 21l-4.35-4.35",stroke:T.ink3,strokeWidth:2,strokeLinecap:"round"})),
        e("span",{style:{fontSize:15,color:T.ink3,flex:1}},"Search tags or places…"),
        !open&&unreadCount>0&&e("div",{style:{width:8,height:8,borderRadius:"50%",background:"#b85c2a",flexShrink:0}})
      )
    ),
    // Active filter chip on map
    activeFilter && !open && e("div",{style:{
      position:"absolute",
      top:"calc(68px + env(safe-area-inset-top,0px))",
      left:"50%",
      transform:"translateX(-50%)",
      zIndex:999,
      display:"flex",
      alignItems:"center",
      gap:6,
      background:T.forest,
      color:T.paper,
      borderRadius:20,
      padding:"5px 8px 5px 14px",
      fontSize:13,
      fontWeight:600,
      boxShadow:T.shadowLg,
      whiteSpace:"nowrap",
      cursor:"default"
    }},
      e("span",null,"#"+activeFilter),
      e("button",{
        style:{
          width:22,height:22,borderRadius:"50%",
          background:"rgba(246,241,228,0.25)",
          border:"none",color:T.paper,cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:13,lineHeight:1,flexShrink:0
        },
        onClick:function(){
          setActiveFilter(null);
          setSearchResults(null);
          setSearchTag("");
        }
      },"×")
    ),

    // Right-side map controls
    e("div",{style:{position:"absolute",top:"calc(80px + env(safe-area-inset-top,0px))",right:14,zIndex:999,display:"flex",flexDirection:"column",gap:8}},

      // Pin layer toggle: All → Mine → Off
      e("button",{
        onClick:function(){
          setMapLayer(function(cur){
            if(cur==="mine")   return "public";
            if(cur==="public") return "none";
            return "mine";
          });
        },
        style:{width:40,height:40,borderRadius:10,cursor:"pointer",
          background:mapLayer==="mine"?T.forest:mapLayer==="none"?"rgba(246,241,228,0.7)":"rgba(246,241,228,0.95)",
          backdropFilter:"blur(12px)",
          border:"1px solid "+(mapLayer==="mine"?T.forest:mapLayer==="none"?T.border:T.border),
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
          boxShadow:T.shadow,gap:2}
      },
        e("svg",{width:16,height:16,viewBox:"0 0 24 24",fill:"none"},
          e("path",{d:"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",stroke:mapLayer==="mine"?T.paper:mapLayer==="none"?T.ink4:T.ink2,strokeWidth:2,strokeLinecap:"round"}),
          e("circle",{cx:"9",cy:"7",r:"4",stroke:mapLayer==="mine"?T.paper:mapLayer==="none"?T.ink4:T.ink2,strokeWidth:2}),
          mapLayer==="public"&&e("path",{d:"M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",stroke:T.ink2,strokeWidth:2,strokeLinecap:"round"})
        ),
        e("span",{style:{fontSize:8,letterSpacing:"0.06em",textTransform:"uppercase",fontFamily:T.mono,
          color:mapLayer==="mine"?T.paper:mapLayer==="none"?T.ink4:T.ink2,lineHeight:1}},
          mapLayer==="mine"?"mine":mapLayer==="public"?"all":"off"
        )
      ),

      // Layers button
      e("button",{
        onClick:function(){setLayerMenuOpen(function(v){return !v;});},
        style:{width:40,height:40,borderRadius:10,
          background:baseLayer!=="osm"?"rgba(42,93,60,0.12)":"rgba(246,241,228,0.95)",
          backdropFilter:"blur(12px)",
          border:"1px solid "+(baseLayer!=="osm"?T.forest:T.border),
          display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:T.shadow,
          position:"relative"}
      },
        e("svg",{width:18,height:18,viewBox:"0 0 24 24",fill:"none"},
          e("path",{d:"M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
            stroke:baseLayer!=="osm"?T.forest:T.ink2,strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"})
        ),
        layerMenuOpen && e("div",{style:{
          position:"absolute",right:48,top:0,
          background:"rgba(246,241,228,0.98)",backdropFilter:"blur(20px)",
          border:"1px solid "+T.border,borderRadius:12,
          boxShadow:T.shadowLg,
          padding:"8px 6px",display:"flex",flexDirection:"column",gap:4,minWidth:140,zIndex:1000
        }},
          BASE_LAYERS.map(function(layer){
            var active=baseLayer===layer.id;
            return e("button",{key:layer.id,onClick:function(){switchBaseLayer(layer.id);setLayerMenuOpen(false);},
              style:{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,border:"none",
                background:active?T.forest:"transparent",cursor:"pointer",textAlign:"left",width:"100%"}
            },
              e("span",{style:{fontSize:18,width:22,textAlign:"center",flexShrink:0}},layer.icon),
              e("div",null,
                e("div",{style:{fontSize:13,fontWeight:active?600:400,color:active?T.paper:T.ink}},(layer.label||layer.name)),
                active&&e("div",{style:{fontSize:10,color:"rgba(246,241,228,0.7)",fontFamily:T.mono,letterSpacing:"0.06em"}},"active")
              )
            );
          })
        )
      ),

      // Locate / GPS button
      e("button",{
        onClick:function(){
          if(!navigator.geolocation){flash("Geolocation not supported");return;}
          navigator.geolocation.getCurrentPosition(
            function(pos){
              var lat=pos.coords.latitude, lng=pos.coords.longitude;
              if(mapObj.current){
                mapObj.current.setView([lat,lng],15);
                // Remove old dot
                if(window._userDotMarker){ window._userDotMarker.remove(); }
                // Add pulsing blue dot
                var dotIcon=window.L.divIcon({
                  className:"",
                  html:'<div style="width:16px;height:16px;border-radius:50%;background:#2979ff;border:3px solid #fff;box-shadow:0 0 0 4px rgba(41,121,255,0.25);animation:pmpulse 2s infinite"></div>',
                  iconSize:[16,16],iconAnchor:[8,8]
                });
                window._userDotMarker=window.L.marker([lat,lng],{icon:dotIcon,zIndexOffset:1000}).addTo(mapObj.current);
              }
              setUserLL({lat:lat,lng:lng});
              flash("Your location");
            },
            function(err){flash("Location unavailable — check permissions");},
            {enableHighAccuracy:true,timeout:8000}
          );
        },
        style:{width:40,height:40,borderRadius:10,
          background:"rgba(246,241,228,0.95)",backdropFilter:"blur(12px)",
          border:"1px solid "+T.border,
          display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:T.shadow}
      },
        e("svg",{width:18,height:18,viewBox:"0 0 24 24",fill:"none"},
          e("circle",{cx:"12",cy:"12",r:"3",fill:T.forest}),
          e("circle",{cx:"12",cy:"12",r:"7",stroke:T.forest,strokeWidth:1.5,fill:"none"}),
          e("path",{d:"M12 2v4M12 18v4M2 12h4M18 12h4",stroke:T.ink2,strokeWidth:1.5,strokeLinecap:"round"})
        )
      )
    ),

    // Bottom-left: coordinates + zoom
    e("div",{style:{position:"absolute",bottom:"calc(70px + env(safe-area-inset-bottom,0px))",left:14,zIndex:999}},
      e("div",{style:{background:"rgba(246,241,228,0.90)",backdropFilter:"blur(8px)",border:"1px solid "+T.border,borderRadius:8,padding:"4px 10px",boxShadow:T.shadow}},
        e("span",{style:{fontSize:10,color:T.ink3,fontFamily:T.mono,letterSpacing:"0.06em"}},
          mapCenter
            ? formatLL(mapCenter.lat, mapCenter.lng, 2)+" · Z "+mapZoom
            : formatLL(28.54, -81.38, 2)+" · Z "+mapZoom
        )
      )
    ),

    // Bottom-right: touch hint / pin placed indicator



    loading && e("div",{style:{position:"absolute",top:70,left:"50%",transform:"translateX(-50%)",background:"rgba(255,253,248,0.97)",border:"1px solid #d8cfb8",borderRadius:20,padding:"5px 14px",fontSize:13,zIndex:999,color:"#6f786f"}},"Loading..."),

    open && e("div",{className:"bubble",style:{position:"fixed",left:0,right:0,top:0,bottom:60,zIndex:1000,background:T.paper,overflow:"hidden",display:"flex",flexDirection:"column",animation:"fadeIn 0.18s ease both"}},
      e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"calc(54px + env(safe-area-inset-top,0px)) 22px 14px",borderBottom:"1px solid #e6dfca",background:"#f6f1e4",flexShrink:0}},
        e("div",{style:{display:"flex",flexDirection:"column",gap:1}},
          e("span",{style:{fontSize:14,fontWeight:700,letterSpacing:2,color:"#2a5d3c"}},"📍 PINMAP"),
          e("span",{style:{fontSize:10,color:"#9a8f74",letterSpacing:0.3}},"(c) Seth Gray")
        ),
        e("div",{style:{display:"flex",alignItems:"center",gap:6}},
          user&&userAvatar(user)?e("img",{src:userAvatar(user),style:{width:22,height:22,borderRadius:"50%",border:"1px solid #d8cfb8"}}):null,
          e("span",{style:{fontSize:12,color:"#7a6a50",background:"#ece4cc",padding:"2px 7px",borderRadius:3,border:"1px solid #d8cfb8"}},uname),
          !user && e("button",{style:{fontSize:12,background:"#2a5d3c",color:"#fff",border:"none",padding:"3px 8px",borderRadius:3,cursor:"pointer"},onClick:api.signInGoogle},"Sign in"),
          e("button",{style:{background:"none",border:"none",color:T.ink3,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",width:32,height:32,borderRadius:8},onClick:function(){setOpen(false);}},e("svg",{width:18,height:18,viewBox:"0 0 24 24",fill:"none"},e("path",{d:"M18 6L6 18M6 6l12 12",stroke:T.ink3,strokeWidth:2,strokeLinecap:"round"})))
        )
      ),

      e("div",{style:{display:"none"}},
        TABS.map(function(t){
          return e("button",{key:t[0],onClick:function(){setTab(t[0]);},
            style:{flex:1,padding:"8px 2px",background:"none",border:"none",cursor:"pointer",fontSize:11,color:tab===t[0]?"#2a5d3c":"#6f786f",borderBottom:tab===t[0]?"2px solid #2e7d32":"2px solid transparent",fontFamily:"Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",fontWeight:tab===t[0]?700:500,display:"flex",flexDirection:"column",alignItems:"center",gap:2}},
            e("span",{style:{fontSize:14}},{"search":"🔍","mine":"📍","add":"➕","nearby":"📡","profile":"👤","admin":"⚙️"}[t[0]]||""),
            t[0]==="mine"
              ? e("span",{style:{position:"relative",display:"inline-flex",alignItems:"center",gap:3}},
                  t[1],
                  unreadPinIds.length>0&&e("span",{style:{width:7,height:7,borderRadius:"50%",background:"#c62828",display:"inline-block",flexShrink:0,marginBottom:4}})
                )
              : t[1]
          );
        })
      ),

      e("div",{style:{padding:11,flex:1,overflowY:"auto"}},
        unreadCount>0 && e("div",{
          onClick:function(){setTab("mine");},
          style:{background:"#fffbf0",border:"1px solid #ffc107",borderRadius:8,padding:"10px 12px",marginBottom:10,cursor:"pointer",display:"flex",alignItems:"center",gap:8}
        },
          e("div",{style:{width:8,height:8,borderRadius:"50%",background:"#c62828",flexShrink:0}}),
          e("div",null,
            e("div",{style:{fontSize:17,fontWeight:700,color:"#1a201c"}},"New comments on your pins"),
            e("div",{style:{fontSize:11,color:"#3c4540"}},"Tap to view your pins")
          )
        ),

        tab==="search" && e("div",{style:{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}},

        e("div",{style:{padding:"20px 22px 0",background:T.paper,flexShrink:0}},
          e("input",{
            style:{width:"100%",boxSizing:"border-box",background:T.paper2,border:"1px solid "+T.border,
              borderRadius:12,padding:"12px 16px",fontSize:16,outline:"none",color:T.ink,fontFamily:T.font,marginBottom:10},
            placeholder:searchMode==="tags"?"#hashtag or tag name":"Place, address or city…",
            value:searchMode==="tags"?searchTag:addrSearch,
            onChange:function(ev){if(searchMode==="tags")setSearchTag(ev.target.value);else setAddrSearch(ev.target.value);},
            onKeyDown:function(ev){if(ev.key==="Enter"){if(searchMode==="tags")doSearch();else{if(!addrSearch.trim())return;setAddrLoading(true);setAddrResults([]);fetch("https://nominatim.openstreetmap.org/search?format=json&limit=6&q="+encodeURIComponent(addrSearch),{headers:{"Accept-Language":"en","User-Agent":"PINMAP-App"}}).then(function(r){return r.json();}).then(function(d){setAddrResults(d||[]);setAddrLoading(false);}).catch(function(){setAddrLoading(false);});}}}
          }),
          e("button",{
            style:{width:"100%",padding:"11px",borderRadius:10,background:T.forest,color:T.paper,border:"none",fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:12},
            onClick:function(){if(searchMode==="tags")doSearch();else{if(!addrSearch.trim())return;setAddrLoading(true);setAddrResults([]);fetch("https://nominatim.openstreetmap.org/search?format=json&limit=6&q="+encodeURIComponent(addrSearch),{headers:{"Accept-Language":"en","User-Agent":"PINMAP-App"}}).then(function(r){return r.json();}).then(function(d){setAddrResults(d||[]);setAddrLoading(false);}).catch(function(){setAddrLoading(false);flash("Place search failed");});}}
          },"Search"),
          e("div",{style:{display:"flex",borderBottom:"1px solid "+T.borderSoft}},
            e("button",{style:{flex:1,padding:"8px 0",background:"none",border:"none",cursor:"pointer",fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:600,color:searchMode==="tags"?T.forest:T.ink3,fontFamily:T.mono,borderBottom:searchMode==="tags"?"2px solid "+T.forest:"2px solid transparent"},onClick:function(){setSearchMode("tags");setAddrResults([]);setAddrSearch("");}
            },"# Tags"),
            e("button",{style:{flex:1,padding:"8px 0",background:"none",border:"none",cursor:"pointer",fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:600,color:searchMode==="places"?T.forest:T.ink3,fontFamily:T.mono,borderBottom:searchMode==="places"?"2px solid "+T.forest:"2px solid transparent"},onClick:function(){setSearchMode("places");}
            },"📍 Places")
          )
        ),

        e("div",{style:{flex:1,overflowY:"auto",padding:"0 22px"}},
          searchMode==="places"
            ? e("div",null,
                addrLoading&&e("div",{style:{padding:"20px 0",textAlign:"center",color:T.ink3,fontSize:13}},"Searching…"),
                addrResults.length>0&&addrResults.map(function(r,i){
                  var parts=r.display_name.split(",");
                  return e("div",{key:i,style:{display:"flex",alignItems:"center",gap:12,padding:"14px 0",borderBottom:"1px solid "+T.borderSoft,cursor:"pointer"},onClick:function(){goToAddr(r);setOpen(false);}},
                    e("svg",{width:14,height:18,viewBox:"0 0 28 36",style:{flexShrink:0}},e("path",{d:"M14 0 C 6.27 0 0 6.27 0 14 c 0 9.5 14 22 14 22 s 14 -12.5 14 -22 C 28 6.27 21.73 0 14 0 z",fill:T.forest}),e("circle",{cx:"14",cy:"14",r:"5",fill:T.paper})),
                    e("div",{style:{flex:1,minWidth:0}},
                      e("div",{style:{fontWeight:600,fontSize:15,color:T.ink,marginBottom:2}},parts[0]),
                      e("div",{style:{fontSize:12,color:T.ink3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},parts.slice(1,3).join(",").trim())
                    )
                  );
                }),
                addrResults.length===0&&!addrLoading&&addrSearch&&e("div",{style:{padding:"20px 0",textAlign:"center",color:T.ink3,fontSize:13}},"No places found")
              )
            : e("div",null,
                activeFilter&&e("div",{style:{display:"flex",alignItems:"center",gap:8,padding:"12px 0",borderBottom:"1px solid "+T.borderSoft}},
                  e("span",{style:{fontSize:13,color:T.ink2}},"Filtered by"),
                  e("span",{style:{fontSize:13,fontWeight:600,color:T.forest,fontFamily:T.mono}},"#"+activeFilter),
                  e("button",{style:{marginLeft:"auto",fontSize:11,padding:"3px 10px",borderRadius:10,border:"1px solid "+T.border,background:"transparent",color:T.ink3,cursor:"pointer"},onClick:function(){setActiveFilter(null);setSearchResults(null);setSearchTag("");}
                  },"Clear")
                ),
                searchResults
                  ? e("div",null,
                      e("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",borderBottom:"1px solid "+T.borderSoft}},
                        e("div",{style:{fontSize:10.5,letterSpacing:"0.14em",color:T.ink3,textTransform:"uppercase",fontWeight:600,fontFamily:T.mono}},"#"+searchResults.tag+" · "+searchResults.results.length+" pins"),
                        e("button",{style:{fontSize:12,padding:"5px 14px",borderRadius:18,border:"1px solid "+(follows.some(function(f){return f.tag===searchResults.tag;})?T.forest:T.border),background:follows.some(function(f){return f.tag===searchResults.tag;})?T.forestPale:"transparent",color:follows.some(function(f){return f.tag===searchResults.tag;})?T.forest:T.ink3,cursor:"pointer",fontWeight:500},onClick:function(){toggleFollow(searchResults.tag);}
                        },follows.some(function(f){return f.tag===searchResults.tag;})?"Following":"Follow")
                      ),
                      searchResults.results.map(function(p){
                        return e("div",{key:p.id,style:{display:"flex",alignItems:"flex-start",gap:12,padding:"14px 0",borderBottom:"1px solid "+T.borderSoft,cursor:"pointer"},onClick:function(){if(mapObj.current)mapObj.current.setView([p.lat,p.lng],13);setSelPin(p);setOpen(false);}},
                          e("svg",{width:14,height:18,viewBox:"0 0 28 36",style:{flexShrink:0,marginTop:2}},e("path",{d:"M14 0 C 6.27 0 0 6.27 0 14 c 0 9.5 14 22 14 22 s 14 -12.5 14 -22 C 28 6.27 21.73 0 14 0 z",fill:p.color||T.forest}),e("circle",{cx:"14",cy:"14",r:"5",fill:T.paper})),
                          e("div",{style:{flex:1,minWidth:0}},
                            e("div",{style:{fontSize:16,fontWeight:600,color:T.ink,marginBottom:2}},p.name),
                            p.description&&e("div",{style:{fontSize:13,color:T.ink2,marginBottom:6,lineHeight:1.4}},p.description),
                            e("div",{style:{display:"flex",gap:6,flexWrap:"wrap"}},(p.tags||[]).slice(0,3).map(function(t){return e("span",{key:t,style:{fontSize:10.5,color:T.forest,background:T.forestPale,padding:"1px 6px",borderRadius:3,fontFamily:T.mono}},"#"+t);})),
                            p.owner&&e("span",{style:{fontSize:11,color:T.ink3,cursor:"pointer",textDecoration:"underline"},onClick:function(ev){ev.stopPropagation();loadUserProfile(p.owner);}
                            },"@"+p.owner)
                          )
                        );
                      })
                    )
                  : e("div",null,
                      trending.length>0&&e("div",{style:{paddingTop:16,marginBottom:20}},
                        e("div",{style:{fontSize:10.5,letterSpacing:"0.18em",color:T.ink3,textTransform:"uppercase",fontWeight:600,fontFamily:T.mono,marginBottom:14}},"Trending · Last 7 Days"),
                        trending.slice(0,6).map(function(t,i){
                          var isFollowing=follows.some(function(f){return f.tag===t.tag;});
                          return e("div",{key:t.tag,style:{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid "+T.borderSoft,cursor:"pointer"},onClick:function(){setSearchTag(t.tag);doSearch();}},
                            e("div",{style:{fontSize:11,color:T.ink4,fontFamily:T.mono,width:18,flexShrink:0}},String(i+1).padStart(2,"0")),
                            e("div",{style:{flex:1,fontWeight:700,fontSize:17,color:T.ink}},"#"+t.tag),
                            e("div",{style:{fontSize:13,color:T.ink3,fontFamily:T.mono}},t.count||""),
                            e("button",{style:{padding:"4px 10px",borderRadius:14,border:"1px solid "+(isFollowing?T.forest:T.border),background:isFollowing?T.forestPale:"transparent",color:isFollowing?T.forest:T.ink3,fontSize:11,cursor:"pointer",flexShrink:0},onClick:function(ev){ev.stopPropagation();toggleFollow(t.tag);}
                            },isFollowing?"Following":"Follow")
                          );
                        })
                      ),
                      e("div",{style:{marginBottom:20}},
                        e("div",{style:{fontSize:10.5,letterSpacing:"0.18em",color:T.ink3,textTransform:"uppercase",fontWeight:600,fontFamily:T.mono,marginBottom:12}},"Nearby"),
                        (function(){
                          var pub=pins.filter(function(p){return p.privacy==="public";});
                          var sorted=userLL?pub.slice().sort(function(a,b){return distKm(userLL.lat,userLL.lng,a.lat,a.lng)-distKm(userLL.lat,userLL.lng,b.lat,b.lng);}):pub;
                          return sorted.slice(0,5).map(function(p){
                            var dist=userLL?distKm(userLL.lat,userLL.lng,p.lat,p.lng):null;
                            var isFar=dist!==null&&dist>16;
                            var distLabel=dist===null?"":dist<1.6?"nearby":dist.toFixed(1)+" km";
                            return e("div",{key:p.id,style:{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid "+T.borderSoft,cursor:"pointer"},onClick:function(){if(mapObj.current)mapObj.current.setView([p.lat,p.lng],14);setSelPin(p);setOpen(false);}},
                              e("svg",{width:14,height:18,viewBox:"0 0 28 36",style:{flexShrink:0}},e("path",{d:"M14 0 C 6.27 0 0 6.27 0 14 c 0 9.5 14 22 14 22 s 14 -12.5 14 -22 C 28 6.27 21.73 0 14 0 z",fill:p.color||T.forest}),e("circle",{cx:"14",cy:"14",r:"5",fill:T.paper})),
                              e("div",{style:{flex:1,minWidth:0}},
                                e("div",{style:{fontWeight:600,fontSize:15,color:T.ink,marginBottom:1}},p.name),
                                e("div",{style:{fontSize:12,color:T.ink3}},e("span",{style:{cursor:"pointer"},onClick:function(ev){ev.stopPropagation();loadUserProfile(p.owner);}},"@"+p.owner),(p.tags&&p.tags[0]?" · #"+p.tags[0]:""))
                              ),
                              dist!==null&&e("div",{style:{fontSize:11,color:isFar?"#b85c2a":T.ink3,fontFamily:T.mono,flexShrink:0}},distLabel)
                            );
                          });
                        })()
                      )
                    )
              )
        )
      ),

      tab==="admin" && uname==="Seth Gray" && e("div",{style:{padding:"22px",overflowY:"auto",height:"100%",background:T.paper}},
        e("div",{style:{fontSize:10.5,letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600,color:T.ink3,fontFamily:T.mono,marginBottom:16}},"Admin · Seth Gray"),
        adminLoading&&e("div",{style:{color:T.ink3,fontSize:13,padding:"20px 0"}},"Loading stats…"),
        adminStats&&e("div",null,
          e("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}},
            [["📍","Total Pins",adminStats.totalPins],["💬","Total Comments",adminStats.totalComments],
             ["👤","Total Users",adminStats.totalUsers],["🔥","Active (7d)",adminStats.activeCount]
            ].map(function(s,i){
              return e("div",{key:i,style:{background:T.paper2,border:"1px solid "+T.borderSoft,borderRadius:10,padding:"14px",textAlign:"center"}},
                e("div",{style:{fontSize:11,marginBottom:4}},s[0]),
                e("div",{style:{fontSize:22,fontWeight:700,color:T.ink}},(s[2]||0).toLocaleString()),
                e("div",{style:{fontSize:11,color:T.ink3,fontFamily:T.mono,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:2}},s[1])
              );
            })
          ),
          adminStats.recentPins&&adminStats.recentPins.length>0&&e("div",null,
            e("div",{style:{fontSize:10.5,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:600,color:T.ink3,fontFamily:T.mono,marginBottom:10}},"Recent Pins"),
            adminStats.recentPins.slice(0,8).map(function(p,i){
              return e("div",{key:i,style:{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid "+T.borderSoft}},
                e("div",{style:{flex:1}},
                  e("div",{style:{fontWeight:600,fontSize:14,color:T.ink}},p.name),
                  e("div",{style:{fontSize:12,color:T.ink3}},"@"+(p.owner||"")+" · "+(p.created_at||"").slice(0,10))
                )
              );
            })
          )
        ),
        e("button",{style:{marginTop:16,padding:"10px 20px",borderRadius:10,background:T.forest,color:T.paper,border:"none",cursor:"pointer",fontSize:13,fontWeight:600},onClick:loadAdminStats},"↺ Refresh")
      ),

      tab==="mine" && e("div",{style:{display:"flex",flexDirection:"column",height:"100%",background:T.paper}},
        e(MineTab,{
          myPins:myPins, myTags:myTags, uname:uname,
          activeFilter:activeFilter, setActiveFilter:setActiveFilter,
          mapObj:mapObj, setSelPin:setSelPin, setOpen:setOpen,
          unreadPinIds:unreadPinIds, commentCounts:commentCounts,
          deletePin:deletePin, toggleUpvote:toggleUpvote,
          saveToCollection:saveToCollection, loadUserProfile:loadUserProfile,
          markCommentsSeen:markCommentsSeen
        })
      ),

      tab==="add" && e("div",{style:{padding:"22px",overflowY:"auto"}},
        e("div",{style:{padding:"0 0 16px"}},
          e("div",{style:{fontSize:10.5,letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600,color:T.ink3,fontFamily:T.mono,marginBottom:6}},"Drop a pin"),
          pendingLL && e("div",{style:{fontSize:12,color:T.forest,fontFamily:T.mono,marginTop:4}},
            formatLL(pendingLL.lat, pendingLL.lng, 4)
          )
        ),
        !user && e("div",{style:{background:T.paper2,border:"1px solid "+T.borderSoft,borderRadius:10,padding:14,marginBottom:12,textAlign:"center"}},
          e("div",{style:{fontSize:13,color:T.ink2,marginBottom:8}},"Sign in to save pins to your account"),
          e("button",{style:Object.assign({},S.btn,{width:"100%"}),onClick:api.signInGoogle},"Sign in with Google")
        ),
        e("div",{style:{position:"relative",marginBottom:10}},
          e("input",{style:S.input,placeholder:"Name / Place",value:form.name,
            onChange:function(ev){setForm(function(f){return Object.assign({},f,{name:ev.target.value});});}})
        ),
        e("textarea",{style:Object.assign({},S.input,{resize:"vertical",minHeight:70}),
          placeholder:"Description (optional)",value:form.description,
          onChange:function(ev){setForm(function(f){return Object.assign({},f,{description:ev.target.value});});}}),
        e("input",{style:S.input,placeholder:"#tags — space or comma separated",value:form.tags,
          onChange:function(ev){setForm(function(f){return Object.assign({},f,{tags:ev.target.value});});}}),
        e("div",{style:{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}},
          ["#2a5d3c","#b85c2a","#1565c0","#c62828","#6a1b9a","#00695c","#4e342e","#37474f","#f57f17"].map(function(c){
            return e("button",{key:c,onClick:function(){setForm(function(f){return Object.assign({},f,{color:c});});},
              style:{width:28,height:28,borderRadius:"50%",background:c,border:form.color===c?"3px solid "+T.ink:"3px solid transparent",cursor:"pointer"}});
          })
        ),
        e("div",{style:{display:"flex",gap:6,marginBottom:12}},
          ["public","private","shareable"].map(function(p){
            return e("button",{key:p,
              style:{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+(form.privacy===p?T.forest:T.border),
                background:form.privacy===p?T.forestPale:"transparent",color:form.privacy===p?T.forest:T.ink2,
                fontSize:12,cursor:"pointer",fontWeight:form.privacy===p?600:400,textTransform:"capitalize"},
              onClick:function(){setForm(function(f){return Object.assign({},f,{privacy:p});})}},p);
          })
        ),
        !pendingLL && e("div",{style:{background:T.paper2,border:"1px dashed "+T.border,borderRadius:10,padding:"16px",marginBottom:12,textAlign:"center",color:T.ink3,fontSize:13}},
          "Close this panel and touch the map to set a location"
        ),
        e("div",{style:{marginBottom:12}},
          e("label",{style:{fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,display:"block",marginBottom:4}},"Photo"),
          e("input",{type:"file",accept:"image/*",style:{fontSize:12,color:T.ink3},onChange:handlePhoto})
        ),
        e("div",{style:{marginBottom:12}},
          e("label",{style:{fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,display:"block",marginBottom:4}},"Expires (optional)"),
          e("input",{type:"datetime-local",style:S.input,value:form.expires_at,
            onChange:function(ev){setForm(function(f){return Object.assign({},f,{expires_at:ev.target.value});});}})
        ),
        e("button",{style:Object.assign({},S.btn,{width:"100%"}),onClick:savePin},"Save Pin")
      ),

      tab==="nearby" && e("div",{style:{padding:"22px",overflowY:"auto"}},
        e("div",{style:{fontSize:10.5,letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600,color:T.ink3,fontFamily:T.mono,marginBottom:16}},"Nearby Pins"),
        e("div",{style:{fontSize:13,color:T.ink3,marginBottom:16}},
          userLL ? "Showing pins closest to your location" : "Tap the GPS button on the map to find your location"
        ),
        (function(){
          var pub=pins.filter(function(p){return p.privacy==="public";});
          var sorted=userLL
            ? pub.slice().sort(function(a,b){return distKm(userLL.lat,userLL.lng,a.lat,a.lng)-distKm(userLL.lat,userLL.lng,b.lat,b.lng);})
            : pub;
          return sorted.slice(0,10).map(function(p){
            var dist=userLL?distKm(userLL.lat,userLL.lng,p.lat,p.lng):null;
            return e("div",{key:p.id,
              style:{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid "+T.borderSoft,cursor:"pointer"},
              onClick:function(){if(mapObj.current)mapObj.current.setView([p.lat,p.lng],14);setSelPin(p);setOpen(false);}
            },
              e("svg",{width:14,height:18,viewBox:"0 0 28 36",style:{flexShrink:0}},
                e("path",{d:"M14 0 C 6.27 0 0 6.27 0 14 c 0 9.5 14 22 14 22 s 14 -12.5 14 -22 C 28 6.27 21.73 0 14 0 z",fill:p.color||T.forest}),
                e("circle",{cx:"14",cy:"14",r:"5",fill:T.paper})
              ),
              e("div",{style:{flex:1,minWidth:0}},
                e("div",{style:{fontWeight:600,fontSize:15,color:T.ink,marginBottom:1}},p.name),
                e("div",{style:{fontSize:12,color:T.ink3}},e("span",{style:{cursor:"pointer"},onClick:function(ev){ev.stopPropagation();loadUserProfile(p.owner);}},"@"+p.owner),(p.tags&&p.tags[0]?" · #"+p.tags[0]:""))
              ),
              dist!==null && e("div",{style:{fontSize:11,color:dist>16?"#b85c2a":T.ink3,fontFamily:T.mono,flexShrink:0}},
                dist<1.6?"nearby":dist.toFixed(1)+" km"
              )
            );
          });
        })()
      ),



        tab==="profile" && e("div",null,
          e(ProfilePanel,{
          user:user,uname:uname,myPins:myPins,
          userFollows:userFollows,toggleUserFollow:toggleUserFollow,
          loadUserProfile:loadUserProfile,pushEnabled:pushEnabled,setPushEnabled:setPushEnabled,
          flash:flash,savedPins:savedPins,toggleSavePin:toggleSavePin,setOnboardStep:setOnboardStep,setShowWhatsNew:setShowWhatsNew,setOpen:setOpen,setShowFeatures:setShowFeatures,myProfile:myProfile,setMyProfile:setMyProfile,editingProfile:editingProfile,setEditingProfile:setEditingProfile,profileForm:profileForm,setProfileForm:setProfileForm,saveProfile:saveProfile,setShowImport:setShowImport,
          onSignOut:function(){api.signOut().then(function(){setUser(null);setSplashDone(false);});},
          onGeoJSON:function(){dlFile(toGeoJSON(myPins),"pins.geojson","application/json");},
          onGPX:function(){dlFile(toGPX(myPins),"pins.gpx","application/gpx+xml");}
        })
        )

      )
    ),

    

    selPin && e("div",{className:"detail pm-detail",style:{position:"absolute",top:"45%",bottom:"calc(68px + env(safe-area-inset-bottom,0px))",left:16,right:16,maxWidth:480,margin:"0 auto",background:"rgba(255,253,248,0.97)",border:"1px solid #d8cfb8",borderRadius:12,padding:"14px 15px",overflowY:"auto",zIndex:1001,boxShadow:"0 8px 32px rgba(0,0,0,0.13)","display":"flex","flexDirection":"column"}},
      e("button",{
      style:{position:"absolute",top:10,right:10,width:36,height:36,borderRadius:"50%",
        background:"rgba(26,32,28,0.72)",border:"2px solid rgba(246,241,228,0.6)",
        cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
        zIndex:10,boxShadow:"0 2px 8px rgba(0,0,0,0.25)"},
      onClick:function(){setSelPin(null);}
    },
      e("svg",{width:16,height:16,viewBox:"0 0 24 24",fill:"none"},
        e("path",{d:"M18 6L6 18M6 6l12 12",stroke:"#f6f1e4",strokeWidth:2.5,strokeLinecap:"round"})
      )
    ),
      selPin.photo&&e("img",{src:selPin.photo,style:{width:"100%",borderRadius:8,marginBottom:8,maxHeight:150,objectFit:"cover"}}),
      e("div",{style:{display:"flex",alignItems:"center",gap:7,marginBottom:2,paddingRight:20}},
      e("span",{style:{width:12,height:12,borderRadius:"50%",background:selPin.color||tagColor(selPin.tags&&selPin.tags[0]||"x"),display:"inline-block",flexShrink:0}}),
      e("span",{style:{fontSize:20,lineHeight:1}},getPinIcon(selPin.tags)),
      e("span",{style:{fontWeight:700,fontSize:20,color:"#1a201c"}},selPin.name,
      selPin.expires_at&&e("span",{style:{fontSize:11,marginLeft:6,padding:"2px 6px",borderRadius:4,
        background:new Date(selPin.expires_at)<new Date()?"#ffebee":"#fff8e1",
        color:new Date(selPin.expires_at)<new Date()?"#c62828":"#e65100",
        border:"1px solid "+(new Date(selPin.expires_at)<new Date()?"#ef9a9a":"#ffe082")
      }},new Date(selPin.expires_at)<new Date()?"Expired":(function(){
        var diff=new Date(selPin.expires_at)-new Date();
        var days=Math.floor(diff/864e5);
        var hrs=Math.floor((diff%864e5)/36e5);
        return "⏰ "+(days>0?days+"d ":"")+hrs+"h";
      })()))
    ),
      e("div",{style:{fontSize:13,color:"#6f786f",marginBottom:6}},
        e("span",{
          style:{color:"#2a5d3c",cursor:"pointer",textDecoration:"underline",textDecorationStyle:"dotted"},
          onClick:function(){loadUserProfile(selPin.owner);}
        },e("span",{style:{cursor:"pointer",fontWeight:500},onClick:function(){loadUserProfile(selPin.owner);}},"@"+selPin.owner)),
        selPin.owner!==uname&&e("span",{
          style:{fontSize:10,marginLeft:6,padding:"1px 6px",borderRadius:6,cursor:"pointer",
            background:userFollows.some(function(f){return f.following===selPin.owner;})?"#dde6dc":"#f0e8d4",
            color:userFollows.some(function(f){return f.following===selPin.owner;})?"#2a5d3c":"#6f786f",
            border:"1px solid "+(userFollows.some(function(f){return f.following===selPin.owner;})?"#a5d6a7":"#d8cfb8")
          },
          onClick:function(){toggleUserFollow(selPin.owner);}
        }, userFollows.some(function(f){return f.following===selPin.owner;})?"Following":"+ Follow"),
        selPin.saved_from&&e("span",{style:{color:"#e65100"}}," - saved from @"+selPin.saved_from)
      ),
      selPin.description&&e("div",{style:{fontSize:13,color:"#5a4a30",marginBottom:8,lineHeight:1.6}},selPin.description),
      e("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}},
        (selPin.tags||[]).map(function(t){
          return e("span",{key:t,style:{fontSize:12,padding:"2px 7px",borderRadius:10,background:tagColor(t)+"18",color:tagColor(t),border:"1px solid "+tagColor(t)+"40"}},"#"+t);
        })
      ),
      e("div",{style:{fontSize:11,color:"#9a8f74",fontFamily:"monospace",marginBottom:10}},selPin.lat.toFixed(5)+", "+selPin.lng.toFixed(5)),
      e("div",{style:{display:"flex",gap:6,flexWrap:"wrap",marginBottom:4}},
        (uname&&selPin.owner!==uname)&&e(React.Fragment,null,
          e("button",{style:{background:"none",border:"1px solid #d8cfb8",color:"#3c4540",padding:"4px 10px",fontSize:13,cursor:"pointer",borderRadius:10},onClick:function(){toggleUpvote(selPin.id);}},
            (selPin.upvotes&&selPin.upvotes.indexOf(uname)>=0?"* ":"o ")+(selPin.upvotes?selPin.upvotes.length:0)),
          selPin.owner!==uname&&e("button",{
            style:{fontSize:12,padding:"4px 10px",borderRadius:6,cursor:"pointer",fontFamily:"Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
              background:"none",border:"1px solid #d8cfb8",
              color:selPin.saved_by&&selPin.saved_by.indexOf(uname)>=0?"#e65100":"#6f786f"},
            onClick:function(){toggleSavePin(selPin);}
          },selPin.saved_by&&selPin.saved_by.indexOf(uname)>=0?"🔖 Saved":"🔖 Save")
        ),
        (uname&&selPin.owner===uname)&&e(React.Fragment,null,
          e("button",{style:{background:"none",border:"1px solid #2e7d32",color:"#2a5d3c",padding:"4px 10px",cursor:"pointer",fontSize:12,borderRadius:3},onClick:function(){openEdit(selPin);}},"Edit"),
          e("button",{style:{background:"none",border:"1px solid #c08080",color:"#c05050",padding:"4px 10px",cursor:"pointer",fontSize:12,borderRadius:3},onClick:function(){if(window.confirm("Delete \""+selPin.name+"\"? This cannot be undone.")){deletePin(selPin.id);setSelPin(null);}}},"Delete")
        ),
        e("button",{
          style:{background:"none",border:"1px solid #1565c0",color:"#1565c0",padding:"4px 10px",cursor:"pointer",fontSize:12,borderRadius:3},
          onClick:function(){
            var url="https://maps.google.com/?q="+selPin.lat+","+selPin.lng;
            if(/iPhone|iPad|iPod/i.test(navigator.userAgent)) url="http://maps.apple.com/?ll="+selPin.lat+","+selPin.lng;
            window.open(url,"_blank");
          }
        },"Open in Maps")
      ),
      e(Comments,{pinId:selPin.id,uname:uname,pinOwner:selPin.owner,pinName:selPin.name})
    ),

    showWhatsNew&&e(WhatsNew,{onDismiss:dismissWhatsNew}),

    showImport&&e("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:"calc(60px + env(safe-area-inset-bottom,0px))",background:T.paper,zIndex:2000,display:"flex",flexDirection:"column",overflow:"hidden"}},
      // Header
      e("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 22px 16px",borderBottom:"1px solid "+T.borderSoft,flexShrink:0}},
        e("div",{style:{fontSize:19,fontWeight:700,color:T.ink}},"Import Pins"),
        e("button",{style:{width:34,height:34,borderRadius:"50%",background:"rgba(26,32,28,0.08)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
          onClick:function(){setShowImport(false);setImportPreview(null);setImportTags("");setImportColor("#2a5d3c");}},
          e("svg",{width:16,height:16,viewBox:"0 0 24 24",fill:"none"},e("path",{d:"M18 6L6 18M6 6l12 12",stroke:T.ink,strokeWidth:2.5,strokeLinecap:"round"}))
        )
      ),
      // Body
      e("div",{style:{flex:1,overflowY:"auto",padding:"22px"}},
        // Step 1: Tags
        e("div",{style:{marginBottom:20}},
          e("div",{style:{fontSize:10.5,letterSpacing:"0.14em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,fontWeight:600,marginBottom:8}},"Step 1 — Tags for imported pins"),
          e("input",{style:Object.assign({},S.input,{marginBottom:0}),placeholder:"#tags — space or comma separated",value:importTags,
            onChange:function(ev){setImportTags(ev.target.value);}})
        ),
        // Step 2: Color
        e("div",{style:{marginBottom:20}},
          e("div",{style:{fontSize:10.5,letterSpacing:"0.14em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,fontWeight:600,marginBottom:10}},"Step 2 — Pin colour"),
          e("div",{style:{display:"flex",gap:10,flexWrap:"wrap"}},
            ["#2a5d3c","#1565c0","#b85c2a","#c62828","#6a1b9a","#00695c","#e65100","#4e342e","#37474f","#f57f17"].map(function(c){
              return e("button",{key:c,
                onClick:function(){setImportColor(c);},
                style:{width:36,height:36,borderRadius:"50%",background:c,
                  border:importColor===c?"3px solid "+T.ink:"3px solid transparent",cursor:"pointer",
                  boxShadow:importColor===c?"0 0 0 2px "+T.paper+", 0 0 0 4px "+c:"none"}});
            })
          )
        ),
        // Step 3: File
        e("div",{style:{marginBottom:24}},
          e("div",{style:{fontSize:10.5,letterSpacing:"0.14em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,fontWeight:600,marginBottom:10}},"Step 3 — Choose file"),
          e("label",{style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,padding:"28px 20px",border:"2px dashed "+T.border,borderRadius:14,background:T.paper2,cursor:"pointer",textAlign:"center"}},
            e("svg",{width:32,height:32,viewBox:"0 0 24 24",fill:"none"},
              e("path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",stroke:T.ink3,strokeWidth:1.8,strokeLinecap:"round"}),
              e("polyline",{points:"17 8 12 3 7 8",stroke:T.ink3,strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round"}),
              e("line",{x1:"12",y1:"3",x2:"12",y2:"15",stroke:T.ink3,strokeWidth:1.8,strokeLinecap:"round"})
            ),
            e("div",{style:{fontSize:14,color:T.ink2,fontWeight:500}},"Tap to choose file"),
            e("div",{style:{fontSize:12,color:T.ink3}},"KML · GPX · GeoJSON · CSV"),
            e("input",{type:"file",accept:".kml,.gpx,.geojson,.json,.csv",style:{display:"none"},
              onChange:function(ev){
                var file=ev.target.files&&ev.target.files[0];
                if(!file) return;
                parseImportFile(file,function(pins){
                  setImportPreview(pins);
                  if(pins.length===0) flash("No pins found in file");
                  else flash(pins.length+" pins ready to import");
                });
              }})
          )
        ),
        // Preview
        importPreview&&importPreview.length>0&&e("div",{style:{marginBottom:20}},
          e("div",{style:{fontSize:10.5,letterSpacing:"0.14em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,fontWeight:600,marginBottom:10}},
            "Preview — "+importPreview.length+" pin"+(importPreview.length!==1?"s":"")+" found"
          ),
          e("div",{style:{border:"1px solid "+T.borderSoft,borderRadius:10,overflow:"hidden"}},
            importPreview.slice(0,8).map(function(p,i){
              return e("div",{key:i,style:{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:i<Math.min(importPreview.length,8)-1?"1px solid "+T.borderSoft:"none"}},
                e("div",{style:{width:10,height:10,borderRadius:"50%",background:importColor,flexShrink:0}}),
                e("div",{style:{flex:1,minWidth:0}},
                  e("div",{style:{fontSize:14,fontWeight:600,color:T.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},p.name),
                  e("div",{style:{fontSize:11,color:T.ink3,fontFamily:T.mono}},formatLL(p.lat, p.lng, 4))
                )
              );
            }),
            importPreview.length>8&&e("div",{style:{padding:"8px 14px",fontSize:12,color:T.ink3,textAlign:"center"}},
              "…and "+(importPreview.length-8)+" more"
            )
          )
        ),
        importPreview&&importPreview.length>0&&e("button",{
          style:Object.assign({},S.btn,{width:"100%",opacity:importLoading?0.6:1}),
          onClick:doImport,
          disabled:importLoading
        },importLoading?"Importing…":"Import "+importPreview.length+" Pin"+(importPreview.length!==1?"s":""))
      )
    ),

    showFirstPin&&e("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}},
      e("div",{style:{background:T.paper,border:"none",borderRadius:20,padding:"28px 24px",maxWidth:360,width:"100%",boxShadow:T.shadowLg,animation:"scaleIn 0.25s cubic-bezier(0.34,1.2,0.64,1) both",textAlign:"center"}},
        e("div",{style:{fontSize:48,marginBottom:12}},"🎉"),
        e("div",{style:{fontSize:22,fontWeight:700,color:T.ink,marginBottom:8,letterSpacing:"-0.01em"}},"Your first pin!"),
        e("div",{style:{fontSize:15,color:T.ink2,lineHeight:1.6,marginBottom:20}},
          "Congratulations on dropping your first pin on PINMAP! ",
          e("strong",null,uname),
          " is now on the map. Keep exploring and sharing the places that matter to you."
        ),
        e("div",{style:{display:"flex",flexDirection:"column",gap:8}},
          e("button",{
            style:Object.assign({},S.btn,{width:"100%"}),
            onClick:function(){setShowFirstPin(false);setTab("mine");setOpen(true);}
          },"View in My Pins"),
          e("button",{
            style:{width:"100%",padding:"11px",borderRadius:10,border:"1px solid "+T.border,background:"transparent",fontSize:14,color:T.ink2,cursor:"pointer"},
            onClick:function(){setShowFirstPin(false);}
          },"Keep Exploring")
        )
      )
    ),
    showFeatures&&e("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}},
      e("div",{style:{background:"#f6f1e4",border:"none",boxShadow:"0 -4px 40px rgba(0,0,0,0.12)",borderRadius:16,padding:"24px 22px",maxWidth:420,width:"100%",boxShadow:"0 8px 40px rgba(0,0,0,0.28)",maxHeight:"80vh",display:"flex",flexDirection:"column"}},
        e("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}},
          e("div",null,
            e("div",{style:{fontSize:18,fontWeight:700,color:"#2a5d3c"}},"All Features"),
            e("div",{style:{fontSize:11,color:"#6f786f"}},"v 1.0.0")
          ),
          e("button",{style:{background:"none",border:"none",fontSize:22,color:"#6f786f",cursor:"pointer"},onClick:function(){setShowFeatures(false);}},"×")
        ),
        e("div",{style:{overflowY:"auto",flex:1,marginBottom:16}},
          ALL_FEATURES.map(function(item,i){
            return e("div",{key:i,style:{display:"flex",gap:12,padding:"10px 0",borderBottom:i<ALL_FEATURES.length-1?"1px solid #e8dcc4":"none"}},
              e("div",{style:{fontSize:24,flexShrink:0,width:32,textAlign:"center"}},item.emoji),
              e("div",null,
                e("div",{style:{fontWeight:700,fontSize:14,color:"#1a201c",marginBottom:2}},item.title),
                e("div",{style:{fontSize:12,color:"#3c4540",lineHeight:1.6}},item.body)
              )
            );
          })
        ),
        e("button",{
          style:{width:"100%",padding:"12px",background:"#2a5d3c",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"},
          onClick:function(){setShowFeatures(false);}
        },"Got it!")
      )
    ),
    !showWhatsNew&&onboardStep>=0&&e(Onboarding,{step:onboardStep,onNext:nextOnboard,onSkip:skipOnboard}),

    viewUser&&e("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:2000,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"0 0 0 0"}},
      e("div",{style:{background:"#f6f1e4",borderRadius:"20px 20px 0 0",boxShadow:"0 -4px 32px rgba(0,0,0,0.12)",animation:"slideUp 0.32s cubic-bezier(0.34,1.1,0.64,1) both",width:"100%",maxWidth:480,maxHeight:"80vh",display:"flex",flexDirection:"column",boxShadow:"0 -8px 40px rgba(0,0,0,0.2)"}},
        e("div",{style:{flexShrink:0}},
          e("div",{style:{
            background:"linear-gradient(135deg,#1b4332,#2e7d32)",
            height:80,borderRadius:"8px 8px 0 0",position:"relative"
          }}),
          e("div",{style:{padding:"0 16px 12px",marginTop:-28}},
            e("div",{style:{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:8}},
              e("div",{style:{width:56,height:56,borderRadius:"50%",border:"3px solid #faf6ed",overflow:"hidden",background:"#e6dfca",flexShrink:0}},
                e("img",{
                  src:(viewProfile&&viewProfile.avatar_url)||(viewProfile&&viewProfile.google_avatar)||"https://ui-avatars.com/api/?name="+encodeURIComponent(viewUser)+"&background=2e7d32&color=fff&size=56",
                  style:{width:"100%",height:"100%",objectFit:"cover"},
                  onError:function(ev){ev.target.src="https://ui-avatars.com/api/?name="+encodeURIComponent(viewUser)+"&background=2e7d32&color=fff&size=56";}
                })
              ),
              e("div",{style:{display:"flex",gap:6}},
                viewUser!==uname && e("button",{
                  style:{fontSize:12,padding:"5px 12px",borderRadius:8,cursor:"pointer",fontFamily:"Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",fontWeight:700,
                    background:userFollows.some(function(f){return f.following===viewUser;})?"#2a5d3c":"none",
                    color:userFollows.some(function(f){return f.following===viewUser;})?"#fff":"#2a5d3c",
                    border:"1px solid #2e7d32"},
                  onClick:function(){toggleUserFollow(viewUser);}
                }, userFollows.some(function(f){return f.following===viewUser;})?"Following":"Follow"),
                e("button",{style:{background:"none",border:"none",fontSize:20,color:"#6f786f",cursor:"pointer"},
                  onClick:function(){setViewUser(null);setUserPins([]);setViewProfile(null);}
                },"x")
              )
            ),
            e("div",{style:{fontWeight:700,fontSize:16,color:"#1a201c"}},"@"+viewUser),
            viewProfile&&viewProfile.location&&e("div",{style:{fontSize:12,color:"#6f786f",marginTop:2}},"📍 "+viewProfile.location),
            viewProfile&&viewProfile.bio&&e("div",{style:{fontSize:12,color:"#5a4a38",marginTop:6,lineHeight:1.5}},viewProfile.bio),
            e("div",{style:{display:"flex",gap:10,marginTop:6,flexWrap:"wrap"}},
              viewProfile&&viewProfile.website&&e("a",{href:viewProfile.website.startsWith("http")?viewProfile.website:"https://"+viewProfile.website,target:"_blank",rel:"noopener noreferrer",style:{fontSize:11,color:"#2a5d3c",textDecoration:"none"}},"🌐 "+viewProfile.website.replace(/https?:\/\//,"")),
              viewProfile&&viewProfile.twitter&&e("a",{href:"https://twitter.com/"+viewProfile.twitter,target:"_blank",rel:"noopener noreferrer",style:{fontSize:11,color:"#1da1f2",textDecoration:"none"}},"𝕏 @"+viewProfile.twitter),
              viewProfile&&viewProfile.instagram&&e("a",{href:"https://instagram.com/"+viewProfile.instagram,target:"_blank",rel:"noopener noreferrer",style:{fontSize:11,color:"#e1306c",textDecoration:"none"}},"📸 @"+viewProfile.instagram),
              viewProfile&&viewProfile.youtube&&e("a",{href:"https://youtube.com/@"+viewProfile.youtube,target:"_blank",rel:"noopener noreferrer",style:{fontSize:11,color:"#ff0000",textDecoration:"none"}},"▶ "+viewProfile.youtube)
            ),
            e("div",{style:{fontSize:11,color:"#6f786f",marginTop:6}},userPinsLoading?"Loading...":(userPins.length+" public pins"))
          ),
          e("div",{style:{height:1,background:"#e6dfca"}})
        ),
        e("div",{style:{overflowY:"auto",flex:1,padding:"12px 14px"}},
          userPinsLoading&&e("div",{style:{textAlign:"center",padding:24,color:"#6f786f",fontSize:14}},"Loading pins..."),
          !userPinsLoading&&userPins.length===0&&e("div",{style:{textAlign:"center",padding:24,color:"#6f786f",fontSize:14}},"No public pins yet."),
          !userPinsLoading&&userPins.map(function(p){
            return e(PinCard,{key:p.id,pin:p,uname:uname,
              onFocus:function(){setViewUser(null);focusPin(p);},
              onDelete:deletePin,onUpvote:toggleUpvote,onSave:saveToCollection,onViewUser:loadUserProfile});
          })
        )
      )
    ),

    editPin&&e("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}},
      e("div",{style:{background:"#f6f1e4",border:"none",boxShadow:"0 -4px 40px rgba(0,0,0,0.12)",borderRadius:14,padding:"22px 20px",width:"100%",maxWidth:420,boxShadow:"0 8px 40px rgba(0,0,0,0.25)"}},
        e("div",{style:{fontSize:15,fontWeight:700,color:"#1a201c",marginBottom:14}},"Edit Pin"),
        e("input",{style:Object.assign({},S.input),placeholder:"Name",value:editForm.name,onChange:function(ev){setEditForm(function(f){return Object.assign({},f,{name:ev.target.value});});}}),
        e("textarea",{style:Object.assign({},S.input,{height:60,resize:"none"}),placeholder:"Description",value:editForm.description,onChange:function(ev){setEditForm(function(f){return Object.assign({},f,{description:ev.target.value});});}}),
        e("input",{style:Object.assign({},S.input),placeholder:"#tags",value:editForm.tags,onChange:function(ev){setEditForm(function(f){return Object.assign({},f,{tags:ev.target.value});});}}),
        e("div",{style:{marginBottom:12}},
          e("div",{style:{fontSize:11,color:"#6f786f",marginBottom:6}},"Pin color"),
          e("div",{style:{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}},
            ["#2a5d3c","#e65100","#1565c0","#ad1457","#6a1599","#00695c","#c62828","#4e342e","#f57f17","#00838f"].map(function(col){
              return e("div",{key:col,onClick:function(){setEditForm(function(f){return Object.assign({},f,{color:col});});},
                style:{width:24,height:24,borderRadius:"50%",background:col,cursor:"pointer",border:editForm.color===col?"3px solid #2c2416":"3px solid transparent",boxSizing:"border-box"}});
            }),
            e("input",{type:"color",value:editForm.color,onChange:function(ev){setEditForm(function(f){return Object.assign({},f,{color:ev.target.value});});},
              style:{width:24,height:24,borderRadius:"50%",border:"none",padding:0,cursor:"pointer"}})
          )
        ),
        e("div",{style:{marginBottom:12}},
          e("div",{style:{fontSize:11,color:"#6f786f",marginBottom:6}},"Photo"),
          editForm.photo
            ? e("div",{style:{position:"relative",marginBottom:6}},
                e("img",{src:editForm.photo,style:{width:"100%",borderRadius:6,maxHeight:130,objectFit:"cover"}}),
                e("button",{
                  onClick:function(){setEditForm(function(f){return Object.assign({},f,{photo:null});});},
                  style:{position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.55)",border:"none",color:"#fff",borderRadius:"50%",width:22,height:22,cursor:"pointer",fontSize:12,lineHeight:1}
                },"x")
              )
            : null,
          e("button",{
            style:{display:"inline-flex",alignItems:"center",gap:6,fontSize:13,color:"#3c4540",cursor:"pointer",background:"#efe9d8",border:"1px solid #d8cfb8",borderRadius:6,padding:"8px 12px",fontFamily:"Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"},
            onClick:function(){takePhoto(function(compressed){setEditForm(function(f){return Object.assign({},f,{photo:compressed});});});}
          }, editForm.photo?"📷 Replace photo":"📷 Add photo")
        ),
        e("div",{style:{display:"flex",gap:8}},
          e("button",{style:{flex:1,padding:"9px",background:"none",border:"1px solid #d8cfb8",borderRadius:8,fontSize:13,color:"#6f786f",cursor:"pointer"},onClick:function(){setEditPin(null);}},"Cancel"),
          e("button",{style:{flex:2,padding:"9px",background:"#2a5d3c",border:"none",borderRadius:8,fontSize:13,color:"#fff",fontWeight:700,cursor:"pointer"},onClick:saveEdit},"Save Changes")
        )
      )
    ),

    updateReady && e("div",{style:{
      position:"fixed",bottom:"calc(80px + env(safe-area-inset-bottom,0px))",
      left:16,right:16,zIndex:9997,
      background:T.ink,color:T.paper,
      borderRadius:12,padding:"12px 16px",
      display:"flex",alignItems:"center",justifyContent:"space-between",
      boxShadow:T.shadowLg,animation:"slideUp 0.3s cubic-bezier(0.34,1.1,0.64,1) both"
    }},
      e("div",null,
        e("div",{style:{fontWeight:600,fontSize:14,marginBottom:2}},"Update available"),
        e("div",{style:{fontSize:12,color:"rgba(246,241,228,0.7)"}},
          "A new version of PINMAP is ready"
        )
      ),
      e("button",{
        style:{background:T.forest,color:T.paper,border:"none",borderRadius:8,
          padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer",flexShrink:0},
        onClick:function(){window.location.reload();}
      },"Reload")
    ),

    toast&&e("div",{className:"pm-toast",style:{position:"absolute",bottom:18,left:"50%",transform:"translateX(-50%)",background:"rgba(255,253,248,0.97)",border:"1px solid #d8cfb8",color:"#2a5d3c",padding:"7px 16px",borderRadius:20,fontSize:13,zIndex:1002,whiteSpace:"nowrap",boxShadow:"0 2px 12px rgba(0,0,0,0.1)"}},toast),

    e("div",{style:{position:"fixed",left:0,right:0,bottom:0,zIndex:1001,background:T.paper,borderTop:"1px solid "+T.borderSoft,paddingBottom:"calc(6px + env(safe-area-inset-bottom,0px))",boxShadow:"0 -1px 0 rgba(28,32,28,0.04), 0 -8px 24px rgba(28,32,28,0.06)"}},
      e("div",{style:{display:"flex",alignItems:"stretch",height:60}},
        [
          {id:"map",label:"Map"},
          {id:"search",label:"Search"},
          {id:"mine",label:"Mine"},
          {id:"profile",label:"Profile"}
        ].concat(uname==="Seth Gray"?[{id:"admin",label:"Admin"}]:[]).map(function(it){
          var active=open&&tab===it.id;
          var isMap=it.id==="map";
          var isActive=active||(isMap&&!open);
          var icons={
              map: e("svg",{width:20,height:20,viewBox:"0 0 24 24",fill:"none"},e("path",{d:"M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-1.447-.894L15 9m0 8V9m0 0L9 7",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round"})),
              search: e("svg",{width:20,height:20,viewBox:"0 0 24 24",fill:"none"},e("circle",{cx:"11",cy:"11",r:"8",stroke:"currentColor",strokeWidth:1.8}),e("path",{d:"M21 21l-4.35-4.35",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round"})),
              add: e("svg",{width:20,height:20,viewBox:"0 0 24 24",fill:"none"},e("circle",{cx:"12",cy:"12",r:"9",stroke:"currentColor",strokeWidth:1.8}),e("path",{d:"M12 8v8M8 12h8",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round"})),
              mine: e("svg",{width:20,height:20,viewBox:"0 0 24 24",fill:"none"},e("path",{d:"M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",stroke:"currentColor",strokeWidth:1.8,strokeLinejoin:"round"}),e("circle",{cx:"12",cy:"9",r:"2.5",stroke:"currentColor",strokeWidth:1.5})),
              nearby: e("svg",{width:20,height:20,viewBox:"0 0 24 24",fill:"none"},e("circle",{cx:"12",cy:"12",r:"3",stroke:"currentColor",strokeWidth:1.8}),e("path",{d:"M12 2v3M12 19v3M2 12h3M19 12h3",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round"}),e("circle",{cx:"12",cy:"12",r:"8",stroke:"currentColor",strokeWidth:1.2,strokeDasharray:"2 3"})),
              profile: e("svg",{width:20,height:20,viewBox:"0 0 24 24",fill:"none"},e("path",{d:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round"}),e("circle",{cx:"12",cy:"7",r:"4",stroke:"currentColor",strokeWidth:1.8})),
              admin: e("svg",{width:20,height:20,viewBox:"0 0 24 24",fill:"none"},e("path",{d:"M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",stroke:"currentColor",strokeWidth:1.8,strokeLinejoin:"round"}))
            };
            return e("button",{key:it.id,
            onClick:function(){
              if(isMap){ setOpen(false); return; }
              setTab(it.id); setOpen(true);
            },
            style:{flex:1,position:"relative",background:"transparent",border:"none",padding:"8px 0 6px",
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,
              color:isActive?T.forest:T.ink3,cursor:"pointer",fontFamily:T.font,transition:"color 0.15s"}
          },
            isActive && e("div",{style:{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:28,height:2,background:T.forest,borderRadius:"0 0 2px 2px"}}),
            e("div",{style:{opacity:isActive?1:0.7,transition:"opacity 0.15s"}},icons[it.id]||icons.map),
            e("span",{style:{fontSize:10,fontWeight:isActive?700:500,letterSpacing:"0.14em",textTransform:"uppercase"}},it.label),
            it.id==="mine" && unreadCount>0 && e("div",{style:{position:"absolute",top:8,right:"calc(50% - 18px)",width:6,height:6,borderRadius:"50%",background:"#b85c2a",pointerEvents:"none"}})
          );
        })
      )
    )

  );
}

export default App;
