import React, { useState, useEffect, useRef } from 'react';
import { api, sb, subscribeToPush, uploadPhoto, callEdgeFunction } from './utils/api';
import { dbGetAll, dbPut, dbDelete, uid, formatLL, tagColor, getPinIcon, distKm, checkBannedTags, userName, userAvatar, dlFile, toGeoJSON, toGPX, WHATSNEW, ONBOARD_KEY, WHATSNEW_KEY, ALL_FEATURES, ONBOARD_STEPS, getOnboardSteps, getWhatsNewList, getAllFeatures } from './utils/helpers';
import { T, S } from './utils/styles';
import { Splash } from './components/Splash';
import { Onboarding } from './components/Onboarding';
import { Comments } from './components/Comments';
import { PinCard } from './components/PinCard';
import { ProfilePanel } from './components/ProfilePanel';
import { MineTab } from './components/MineTab';
import { WhatsNew } from './components/WhatsNew';
import { CompassModal } from './components/CompassModal';
import { TrailRecorder } from './components/TrailRecorder';
import { LANGUAGES, translations } from './utils/i18n';

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

  var sl=useState(function() {
    var stored = localStorage.getItem("pm-lang");
    if (stored) return stored;
    var navLang = navigator.language || navigator.userLanguage || "en";
    return navLang.startsWith("es") ? "es" : "en";
  });
  var lang = sl[0];
  var setLang = sl[1];

  React.useEffect(function() {
    localStorage.setItem("pm-lang", lang);
  }, [lang]);

  function t(key, params) {
    var dict = translations[lang] || translations.en;
    var str = dict[key];
    if (str === undefined) {
      str = translations.en[key] || (typeof params === "string" ? params : key);
    }
    if (params && typeof params === "object") {
      Object.keys(params).forEach(function(pKey) {
        str = str.split("{" + pKey + "}").join(params[pKey]);
      });
    }
    return str;
  }
  var fabSaved=(function(){try{var s=localStorage.getItem("pm-fab-pos");return s?JSON.parse(s):{bottom:32,right:20};}catch(e){return {bottom:32,right:20};}})();
  var s8=useState(fabSaved); var fabPos=s8[0]; var setFabPos=s8[1];
  var s9=useState("");       var searchTag=s9[0];      var setSearchTag=s9[1];
  var s34=useState("tags");   var searchMode=s34[0];    var setSearchMode=s34[1];
  var s35=useState("");      var addrSearch=s35[0];    var setAddrSearch=s35[1];
  var s36=useState([]);      var addrResults=s36[0];   var setAddrResults=s36[1];
  var s37=useState(false);   var addrLoading=s37[0];   var setAddrLoading=s37[1];
  var s106=useState("");     var questSearch=s106[0];  var setQuestSearch=s106[1];
  var s103=useState("");      var trailSearch=s103[0];   var setTrailSearch=s103[1];
  var s104=useState([]);      var trailSearchResults=s104[0]; var setTrailSearchResults=s104[1];
  var s105=useState(false);   var trailSearchLoading=s105[0]; var setTrailSearchLoading=s105[1];
  var s10=useState(null);    var searchResults=s10[0]; var setSearchResults=s10[1];
  var s11=useState(null);    var activeFilter=s11[0];  var setActiveFilter=s11[1];
  var s12=useState({name:"",description:"",tags:"",privacy:"public",photo:null,color:"#2a5d3c",trail_id:""}); var form=s12[0]; var setForm=s12[1];
  var s13=useState(null);    var pendingLL=s13[0];     var setPendingLL=s13[1];
  var s14=useState(null);    var selPin=s14[0];        var setSelPin=s14[1];
  var s21=useState(null);    var editPin=s21[0];       var setEditPin=s21[1];
  var s22=useState({name:"",description:"",tags:"",color:"#2a5d3c",photo:null,trail_id:""}); var editForm=s22[0]; var setEditForm=s22[1];
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
  var sShowCompass=useState(false); var showCompass=sShowCompass[0]; var setShowCompass=sShowCompass[1];
  var s80=useState([]); var followers=s80[0]; var setFollowers=s80[1];
  var s43=useState(false); var showInstall=s43[0]; var setShowInstall=s43[1];
  var sReadyToShowBanner=useState(false); var readyToShowBanner=sReadyToShowBanner[0]; var setReadyToShowBanner=sReadyToShowBanner[1];
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
  var sImportPrivacy=useState("public"); var importPrivacy=sImportPrivacy[0]; var setImportPrivacy=sImportPrivacy[1];
  var sGpxImportData=useState(null); var gpxImportData=sGpxImportData[0]; var setGpxImportData=sGpxImportData[1];
  var sGpxImportName=useState(""); var gpxImportName=sGpxImportName[0]; var setGpxImportName=sGpxImportName[1];
  var sGpxImportDesc=useState(""); var gpxImportDesc=sGpxImportDesc[0]; var setGpxImportDesc=sGpxImportDesc[1];
  var sGpxImportColor=useState("#2a5d3c"); var gpxImportColor=sGpxImportColor[0]; var setGpxImportColor=sGpxImportColor[1];
  var sGpxImportPrivacy=useState("public"); var gpxImportPrivacy=sGpxImportPrivacy[0]; var setGpxImportPrivacy=sGpxImportPrivacy[1];
  var sFocusedUser=useState(null); var focusedUser=sFocusedUser[0]; var setFocusedUser=sFocusedUser[1];
  var s90=useState([]); var checkins=s90[0]; var setCheckins=s90[1];
  var s91=useState(0); var selPinCheckinsCount=s91[0]; var setSelPinCheckinsCount=s91[1];
  var s92=useState(null); var selPinTrail=s92[0]; var setSelPinTrail=s92[1];
  var s93=useState([]); var savedTrailIds=s93[0]; var setSavedTrailIds=s93[1];
  var s95=useState(false); var showInsiderExplainer=s95[0]; var setShowInsiderExplainer=s95[1];
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
  var s72=useState([]); var newUpvotePinIds=s72[0]; var setNewUpvotePinIds=s72[1];
  var s69=useState(function(){try{return JSON.parse(localStorage.getItem("pm-drafts")||"[]");}catch(e){return [];}}); var drafts=s69[0]; var setDrafts=s69[1];
  var s70=useState(false); var offlineMode=s70[0]; var setOfflineMode=s70[1];
  // reticle box: {top,left,width,height} in viewport-px, initialised when offlineMode opens
  var s71=useState(null); var reticleBox=s71[0]; var setReticleBox=s71[1];
  var reticleDrag=useRef(null); // {startX,startY,origTop,origLeft}
  var reticleResize=useRef(null); // {corner,startX,startY,origBox}

  React.useEffect(function(){ localStorage.setItem("pm-drafts", JSON.stringify(drafts)); }, [drafts]);

  var [mapPacks, setMapPacks] = useState([]);
  var [challenges, setChallenges] = useState([]);
  var [activeMapPack, setActiveMapPack] = useState(null);
  var [activeQuestId, setActiveQuestId] = useState(function() {
    return localStorage.getItem("pinmap_active_quest_id") || "";
  });
  var [activeMapPackPinIds, setActiveMapPackPinIds] = useState([]);
  var [challengesLoading, setChallengesLoading] = useState(false);
  var [selPinMapPackIds, setSelPinMapPackIds] = useState([]);

  var [trails, setTrails] = useState([]);
  var [activeTrail, setActiveTrail] = useState(null);
  var [showTrailQuestPanel, setShowTrailQuestPanel] = useState(false);
  var [recordingTrail, setRecordingTrail] = useState(false);
  var [isRecordingPaused, setIsRecordingPaused] = useState(false);
  var [recordedPoints, setRecordedPoints] = useState([]);
  var [recordedDistanceKm, setRecordedDistanceKm] = useState(0);
  var [recordedDurationSec, setRecordedDurationSec] = useState(0);

  var recordingWatchId = useRef(null);
  var recordingTimerId = useRef(null);
  var activeTrailPolyline = useRef(null);
  var recordingTrailPolyline = useRef(null);

  var [myActivity, setMyActivity] = useState([]);
  var activityCache = useRef({data: null, ts: 0}); // {data:[], ts: ms epoch}

  var wakeLockRef = useRef(null);
  var appResumedTimeRef = useRef(0);

  async function requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log("Wake Lock acquired successfully");
      } catch (err) {
        console.error("Failed to acquire wake lock:", err);
      }
    }
  }

  function releaseWakeLock() {
    if (wakeLockRef.current) {
      wakeLockRef.current.release()
        .then(function() {
          wakeLockRef.current = null;
          console.log("Wake Lock released successfully");
        })
        .catch(function(err) {
          console.error("Failed to release wake lock:", err);
        });
    }
  }

  useEffect(function() {
    function handleVisibilityChange() {
      var now = Date.now();
      if (document.visibilityState === 'visible') {
        appResumedTimeRef.current = now;
        if (recordingTrail && !isRecordingPaused) {
          requestWakeLock();
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return function() {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [recordingTrail, isRecordingPaused]);

  useEffect(function() {
    return function() {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(function(){});
      }
    };
  }, []);

  var uname = userName(user);

  function flash(msg) { setToast(msg); setTimeout(function(){setToast("");},3000); }

  function saveDraft() {
    if(!form.name.trim() && !pendingLL) { flash(t("toast_draft_error")); return; }
    var draft = {
      id: "draft_"+Date.now(),
      form: Object.assign({}, form),
      pendingLL: pendingLL ? {lat: pendingLL.lat, lng: pendingLL.lng} : null,
      date: new Date().toISOString()
    };
    setDrafts(function(d){return [draft].concat(d);});
    flash(t("toast_save_draft"));
    setForm({name:"",description:"",tags:"",privacy:"public",photo:null,color:"#2a5d3c",expires_at:"",trail_id:""});
    setPendingLL(null);
  }

  // Disable / re-enable all Leaflet map gestures while the reticle is open
  React.useEffect(function(){
    if(!mapObj.current) return;
    var m = mapObj.current;
    if(offlineMode){
      // Initialise reticle to centre 70% of the viewport
      var vw = window.innerWidth, vh = window.innerHeight;
      var rw = Math.round(vw * 0.70), rh = Math.round(vh * 0.54);
      setReticleBox({ top: Math.round((vh-rh)/2), left: Math.round((vw-rw)/2), width: rw, height: rh });
      // Lock the map so touch/scroll gestures don't zoom the whole viewport
      m.dragging.disable();
      m.touchZoom.disable();
      m.doubleClickZoom.disable();
      m.scrollWheelZoom.disable();
      if(m.tap) m.tap.disable();
    } else {
      m.dragging.enable();
      m.touchZoom.enable();
      m.doubleClickZoom.enable();
      m.scrollWheelZoom.enable();
      if(m.tap) m.tap.enable();
    }
  }, [offlineMode]);

  function downloadOfflineTiles() {
    if(!mapObj.current || !reticleBox) return;
    var map = mapObj.current;
    // Convert reticle pixel corners to lat/lng using the frozen map state
    var rb = reticleBox;
    var llNW = map.containerPointToLatLng(window.L.point(rb.left, rb.top));
    var llSE = map.containerPointToLatLng(window.L.point(rb.left + rb.width, rb.top + rb.height));
    var zMin = mapZoom > 11 ? mapZoom - 1 : 11;
    var zMax = 16;
    var tiles = [];
    for(var z = zMin; z <= zMax; z++){
      var pNW = map.project(llNW, z);
      var pSE = map.project(llSE, z);
      var tNW = pNW.divideBy(256).floor();
      var tSE = pSE.divideBy(256).floor();
      for(var x = tNW.x; x <= tSE.x; x++){
        for(var y = tNW.y; y <= tSE.y; y++){
          if(baseLayer==="osm"||baseLayer==="trails"||baseLayer==="seamap") {
            tiles.push("https://a.tile.openstreetmap.org/"+z+"/"+x+"/"+y+".png");
            if(baseLayer==="trails") tiles.push("https://tile.waymarkedtrails.org/hiking/"+z+"/"+x+"/"+y+".png");
            if(baseLayer==="seamap") tiles.push("https://tiles.openseamap.org/seamark/"+z+"/"+x+"/"+y+".png");
          } else if(baseLayer==="topo") tiles.push("https://a.tile.opentopomap.org/"+z+"/"+x+"/"+y+".png");
          else if(baseLayer==="cycleosm") tiles.push("https://a.tile-cyclosm.openstreetmap.fr/cyclosm/"+z+"/"+x+"/"+y+".png");
        }
      }
    }
    tiles = tiles.filter(function(v,i,a){return a.indexOf(v)===i;});
    if(tiles.length > 8000) { flash(t("toast_trail_too_large", {count: tiles.length})); setOfflineMode(false); return; }
    setOfflineMode(false);
    flash(t("toast_tiles_downloading", {count: tiles.length}));
    var loaded = 0;
    function fetchBatch(idx) {
      if(idx >= tiles.length) { flash(t("toast_tiles_success")); return; }
      var batch = tiles.slice(idx, idx+20);
      Promise.all(batch.map(function(url){ return fetch(url,{mode:"no-cors"}).catch(function(){}); }))
        .then(function(){
          loaded += batch.length;
          if(loaded % 100 === 0 || loaded === tiles.length) flash(t("toast_trail_download_progress", {progress: Math.round((loaded/tiles.length)*100)}));
          fetchBatch(idx+20);
        });
    }
    fetchBatch(0);
  }

  function purgeOfflineTiles() {
    caches.delete("pinmap-tiles-v2").then(function(){
      flash(t("toast_tiles_cleared"));
    }).catch(function(){
      flash(t("toast_tiles_error"));
    });
  }

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
      } catch(e) { flash(t("toast_import_error") + e.message); }
      onDone(pins);
    };
    reader.readAsText(file);
  }

  function doImport() {
    if (!importPreview || !importPreview.length) { flash(t("toast_no_pins_import")); return; }
    setImportLoading(true);
    var tags = importTags.split(/[,\s]+/).filter(Boolean).map(function(t){return t.replace(/^#/,"");});
    var toSave = importPreview.map(function(p) {
      return { id: uid(), name: p.name, description: p.description, lat: p.lat, lng: p.lng,
               tags: tags, color: importColor, privacy: importPrivacy, owner: uname,
               created_at: new Date().toISOString() };
    });
    var saved = 0;
    function saveNext(i) {
      if (i >= toSave.length) {
        setImportLoading(false);
        setShowImport(false);
        setImportPreview(null);
        setImportTags("");
        setImportPrivacy("public");
        flash(t("toast_import_success", {count: saved}));
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
    window._startTrailRecording = handleStartTrailRecording;
    if(window._swUpdateReady) setUpdateReady(true);
    return function(){ window._setUpdateReady = null; window._startTrailRecording = null; };
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
      flash(t("toast_syncing_items", {count: total}));
      var pinPromises = pendingPins.map(function(pin){
        return api.insert(pin).then(function(){ return dbDelete("pins", pin.id); });
      });
      var commentPromises = pendingComments.map(function(c){
        return api.addComment(c).then(function(){ return dbDelete("comments", c.id); });
      });
      Promise.all(pinPromises.concat(commentPromises)).then(function(){
        setQueueCount(0);
        flash(t("toast_sync_success", {count: total}));
        api.list().then(function(data){ if(Array.isArray(data)) setPins(data); });
      }).catch(function(){ flash(t("toast_sync_failed")); });
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

  // Set timer to allow banner after 5 seconds
  useEffect(function(){
    if(!splashDone) return;
    var timer = setTimeout(function(){
      setReadyToShowBanner(true);
    }, 5000);
    return function(){ clearTimeout(timer); };
  },[splashDone]);

  // Capture install prompt reactively and show banner when ready
  useEffect(function(){
    if(!splashDone) return;

    function handlePrompt(e) {
      if(e.preventDefault) e.preventDefault();
      setInstallPrompt(e);
    }

    // Set initial from global if already captured
    if(window._installPromptEvent) {
      setInstallPrompt(window._installPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handlePrompt);
    // Also listen to custom event dispatched by index.html early capture
    window.addEventListener("installpromptavailable", function(e) {
      if (e.detail) handlePrompt(e.detail);
    });

    return function(){
      window.removeEventListener("beforeinstallprompt", handlePrompt);
    };
  },[splashDone]);

  // Determine when to show the install banner
  useEffect(function(){
    if(!readyToShowBanner) return;
    if(window.matchMedia("(display-mode: standalone)").matches) return;
    if(localStorage.getItem("pm-install-dismissed")) return;

    var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if(isIOS) {
      setShowInstall("ios");
    } else if(installPrompt) {
      setShowInstall(true);
    }
  },[readyToShowBanner, installPrompt]);



  function checkNewComments(pinsData, nameOverride) {
    var name = nameOverride || uname;
    if(!name || name==="guest") return;
    var lastSeen = localStorage.getItem("pm-comments-seen-"+name);
    // If this user has never had a "seen" timestamp, seed it to right now so
    // all existing comments are treated as already-read. Only comments posted
    // AFTER this first check will ever appear as new.
    if(!lastSeen) {
      var now = new Date().toISOString();
      localStorage.setItem("pm-comments-seen-"+name, now);
      lastSeen = now;
    }
    var lastSeenTime = new Date(lastSeen);
    var myPins = pinsData.filter(function(p){return p.owner===name&&!p.saved_from;});
    var myPinIds = myPins.map(function(p){return p.id;});
    if(!myPinIds.length) return;

    // ── Check new comments / journals ──────────────────────────────
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

    // ── Check new upvotes via localStorage snapshot ─────────────────
    // Stored as JSON: { pinId: upvoteCount, ... } at last-seen time
    var snapKey = "pm-upvote-snap-"+name;
    var snap = {};
    try { snap = JSON.parse(localStorage.getItem(snapKey)||"{}")||{}; } catch(e) {}
    var upvoteNewIds = [];
    myPins.forEach(function(p){
      var cur = (p.upvotes&&Array.isArray(p.upvotes)) ? p.upvotes.length : 0;
      var prev = snap[p.id] !== undefined ? snap[p.id] : cur; // first run: no diff
      if(cur > prev) upvoteNewIds.push(p.id);
    });
    // Save current snapshot
    var newSnap = {};
    myPins.forEach(function(p){ newSnap[p.id] = (p.upvotes&&Array.isArray(p.upvotes))?p.upvotes.length:0; });
    try { localStorage.setItem(snapKey, JSON.stringify(newSnap)); } catch(e) {}
    setNewUpvotePinIds(upvoteNewIds);
  }

  function markCommentsSeen() {
    localStorage.setItem("pm-comments-seen-"+uname, new Date().toISOString());
    setUnreadCount(0);
    setUnreadPinIds([]);
    setNewUpvotePinIds([]);
  }
  function dismissWhatsNew() {
    localStorage.setItem(WHATSNEW_KEY,"1");
    setShowWhatsNew(false);
    flash("💡 Tip: Visit 'Features' in the Profile menu anytime for an overview of what is available!");
  }

  useEffect(function(){
    if (showWhatsNew) {
      flash("🆕 PINMAP Updated! Visit 'Features' in your Profile for the full overview.");
    }
  }, [showWhatsNew]);

  function nextOnboard() {
    if(onboardStep>=getOnboardSteps(lang).length-1){ localStorage.setItem(ONBOARD_KEY,"1"); setOnboardStep(-1); }
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
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(pos) {
          var lat = pos.coords.latitude;
          var lng = pos.coords.longitude;
          setUserLL({lat: lat, lng: lng});
          map.setView([lat, lng], 13);
          updateUserLocationMarker(lat, lng);
        }, function(err) {
          console.warn("Auto-center geolocation failed:", err);
        });
      }
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

    // Fetch challenges
    setChallengesLoading(true);
    api.getChallenges()
      .then(function(data){ setChallenges(data); })
      .catch(function(err){ console.error("Could not load challenges:", err); })
      .finally(function(){ setChallengesLoading(false); });

    api.getTrails(uname || 'guest')
      .then(function(data){ setTrails(data || []); })
      .catch(function(err){ console.error("Could not load trails:", err); });
  },[splashDone]);

  useEffect(function(){
    if(!selPin) {
      setSelPinMapPackIds([]);
      return;
    }
    sb.from("mappack_pins").select("mappack_id").eq("pin_id", selPin.id).then(function(r){
      setSelPinMapPackIds((r.data||[]).map(function(d){ return d.mappack_id; }));
    }).catch(function(err){
      console.error("Error loading pin guides:", err);
    });
  }, [selPin]);

  useEffect(function(){
    if(!user||!uname||uname==="guest") return;
    api.getFollows(uname).then(function(data){setFollows(data||[]);});
    api.getUserFollows(uname).then(function(data){setUserFollows(data||[]);});
    api.getFollowers(uname).then(function(data){setFollowers(data||[]);});
    api.getSavedPins(uname).then(function(data){setSavedPins(data||[]);});
    api.getCheckins(uname).then(function(data){setCheckins(data||[]);});
    api.getMapPacks(uname).then(function(data){setMapPacks(data||[]);});
    api.getTrails(uname).then(function(data){setTrails(data||[]);});
    api.getSavedTrailIds(uname).then(function(data){setSavedTrailIds(data||[]);});
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

  useEffect(function(){
    if(!selPin) {
      setSelPinCheckinsCount(0);
      return;
    }
    api.getPinCheckinsCount(selPin.id).then(function(count){
      setSelPinCheckinsCount(count);
    }).catch(function(){
      setSelPinCheckinsCount(0);
    });
  }, [selPin]);

  useEffect(function(){
    if(!selPin) {
      setSelPinTrail(null);
      return;
    }
    api.getTrailForPin(selPin.id).then(function(trail){
      setSelPinTrail(trail || null);
    }).catch(function(){
      setSelPinTrail(null);
    });
  }, [selPin]);

  // Switch base layer when baseLayer state changes
  useEffect(function(){
    if(!mapObj.current||!window.L) return;
    var def = BASE_LAYERS.find(function(b){return b.id===baseLayer;});
    if(!def) return;
    // Remove current base and overlay
    if(currentBase.current){ currentBase.current.forEach(function(l){l.remove();}); }
    // OpenTopoMap only has tiles up to z17 — cap zoom for topo only
    var layerMaxZoom = baseLayer === "topo" ? 17 : 19;
    mapObj.current.setMaxZoom(layerMaxZoom);
    // If currently zoomed past the new max, pull back
    if(mapObj.current.getZoom() > layerMaxZoom){
      mapObj.current.setZoom(layerMaxZoom);
    }
    // Add new base
    var layers = [];
    var base = window.L.tileLayer(def.url,{attribution:def.attr,maxZoom:layerMaxZoom});
    base.addTo(mapObj.current);
    layers.push(base);
    if(def.overlay){
      var ov = window.L.tileLayer(def.overlay,{attribution:def.attr,maxZoom:layerMaxZoom,opacity:0.85});
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
    // Load comment counts + activity feed when Mine tab opens
    if(tab==="mine" && pins.length>0 && name && name!=="guest"){
      var myPinIds=pins.filter(function(p){return p.owner===name&&!p.saved_from;}).map(function(p){return p.id;});
      if(myPinIds.length){
        sb.from("comments").select("pin_id").in("pin_id",myPinIds).then(function(r){
          var counts={};
          (r.data||[]).forEach(function(c){counts[c.pin_id]=(counts[c.pin_id]||0)+1;});
          setCommentCounts(counts);
        });
        // Activity feed — throttle to once per 60 s
        var now = Date.now();
        if (!activityCache.current.data || (now - activityCache.current.ts) > 60000) {
          api.getMyActivity(myPinIds).then(function(rows) {
            activityCache.current = {data: rows, ts: Date.now()};
            setMyActivity(rows);
          }).catch(function() {});
        }
      }
    }
  },[user, pins, tab]);

  // --- GPX TRAILS REAL-TIME DRAWING & PERSISTENCE ---
  useEffect(function() {
    var map = mapObj.current;
    if (!map) return;

    if (activeTrailPolyline.current) {
      activeTrailPolyline.current.remove();
      activeTrailPolyline.current = null;
    }

    if (activeTrail && activeTrail.coordinates && activeTrail.coordinates.length > 0) {
      var latlngs = activeTrail.coordinates.map(function(pt) { return [pt[0], pt[1]]; });
      var poly = window.L.polyline(latlngs, {
        color: activeTrail.color || "#2a5d3c",
        weight: 5,
        opacity: 0.8,
        lineJoin: 'round'
      }).addTo(map);

      activeTrailPolyline.current = poly;

      try {
        var bounds = poly.getBounds();
        if (bounds && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch (e) {
        console.error("Error fitting bounds:", e);
      }
    }
  }, [activeTrail, mapObj.current]);

  useEffect(function() {
    var map = mapObj.current;
    if (!map) return;

    if (recordingTrailPolyline.current) {
      recordingTrailPolyline.current.remove();
      recordingTrailPolyline.current = null;
    }

    if (recordingTrail && recordedPoints && recordedPoints.length > 0) {
      var latlngs = recordedPoints.map(function(pt) { return [pt[0], pt[1]]; });
      var poly = window.L.polyline(latlngs, {
        color: "#e65100",
        weight: 6,
        opacity: 0.9,
        dashArray: "5, 10",
        lineJoin: 'round'
      }).addTo(map);

      recordingTrailPolyline.current = poly;
    }
  }, [recordingTrail, recordedPoints, mapObj.current]);

  useEffect(function() {
    return function() {
      if (recordingTimerId.current) clearInterval(recordingTimerId.current);
      if (recordingWatchId.current) navigator.geolocation.clearWatch(recordingWatchId.current);
    };
  }, []);

  function handleStartTrailRecording() {
    if (!navigator.geolocation) {
      flash("❌ Geolocation is not supported by your browser");
      return;
    }
    
    setRecordedPoints([]);
    setRecordedDistanceKm(0);
    setRecordedDurationSec(0);
    setRecordingTrail(true);
    setIsRecordingPaused(false);
    
    flash("⏺️ Trail recording started");
    requestWakeLock();

    if (recordingTimerId.current) clearInterval(recordingTimerId.current);
    recordingTimerId.current = setInterval(function() {
      setRecordedDurationSec(function(prev) { return prev + 1; });
    }, 1000);

    var lastPoint = null;
    var lastTime = Date.now();
    
    if (recordingWatchId.current) navigator.geolocation.clearWatch(recordingWatchId.current);
    recordingWatchId.current = navigator.geolocation.watchPosition(
      function(pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        var accuracy = pos.coords.accuracy;
        var now = Date.now();

        // 1. Accuracy Filter
        var isRecentlyResumed = (now - appResumedTimeRef.current) < 3000;
        var maxAllowedAccuracy = isRecentlyResumed ? 15 : 30;
        if (accuracy > maxAllowedAccuracy) {
          console.log("Discarded point due to poor accuracy:", accuracy, "meters (recently resumed:", isRecentlyResumed, ")");
          return;
        }

        setUserLL({lat: lat, lng: lng});
        updateUserLocationMarker(lat, lng);
        if (mapObj.current) {
          if (!lastPoint) {
            mapObj.current.setView([lat, lng], 18);
          } else {
            mapObj.current.panTo([lat, lng]);
          }
        }

        if (lastPoint) {
          var timeElapsed = (now - lastTime) / 1000;
          var distance = distKm(lastPoint[0], lastPoint[1], lat, lng);
          
          // 2. Speed Filter
          if (timeElapsed > 0) {
            var speedKmh = (distance * 3600) / timeElapsed;
            if (speedKmh > 100) {
              console.log("Discarded point due to high speed:", speedKmh, "km/h");
              return;
            }
          }

          if (timeElapsed >= 5 && distance >= 0.005) {
            setRecordedPoints(function(prev) {
              return prev.concat([[lat, lng]]);
            });
            setRecordedDistanceKm(function(prev) { return prev + distance; });
            lastPoint = [lat, lng];
            lastTime = now;
          }
        } else {
          setRecordedPoints([[lat, lng]]);
          lastPoint = [lat, lng];
          lastTime = now;
        }
      },
      function(err) {
        console.error("Geolocation recording error:", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  function handlePauseTrailRecording() {
    setIsRecordingPaused(true);
    releaseWakeLock();
    
    if (recordingTimerId.current) {
      clearInterval(recordingTimerId.current);
      recordingTimerId.current = null;
    }
    
    if (recordingWatchId.current) {
      navigator.geolocation.clearWatch(recordingWatchId.current);
      recordingWatchId.current = null;
    }
    
    flash("⏸️ Recording paused");
  }

  function handleResumeTrailRecording() {
    setIsRecordingPaused(false);
    flash("▶️ Recording resumed");
    requestWakeLock();

    recordingTimerId.current = setInterval(function() {
      setRecordedDurationSec(function(prev) { return prev + 1; });
    }, 1000);

    var points = recordedPoints;
    var lastPoint = points.length > 0 ? points[points.length - 1] : null;
    var lastTime = Date.now();

    recordingWatchId.current = navigator.geolocation.watchPosition(
      function(pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        var accuracy = pos.coords.accuracy;
        var now = Date.now();

        // 1. Accuracy Filter
        var isRecentlyResumed = (now - appResumedTimeRef.current) < 3000;
        var maxAllowedAccuracy = isRecentlyResumed ? 15 : 30;
        if (accuracy > maxAllowedAccuracy) {
          console.log("Discarded point due to poor accuracy:", accuracy, "meters (recently resumed:", isRecentlyResumed, ")");
          return;
        }

        setUserLL({lat: lat, lng: lng});
        updateUserLocationMarker(lat, lng);
        if (mapObj.current) {
          if (!lastPoint) {
            mapObj.current.setView([lat, lng], 18);
          } else {
            mapObj.current.panTo([lat, lng]);
          }
        }

        if (lastPoint) {
          var timeElapsed = (now - lastTime) / 1000;
          var distance = distKm(lastPoint[0], lastPoint[1], lat, lng);
          
          // 2. Speed Filter
          if (timeElapsed > 0) {
            var speedKmh = (distance * 3600) / timeElapsed;
            if (speedKmh > 100) {
              console.log("Discarded point due to high speed:", speedKmh, "km/h");
              return;
            }
          }

          if (timeElapsed >= 5 && distance >= 0.005) {
            setRecordedPoints(function(prev) { return prev.concat([[lat, lng]]); });
            setRecordedDistanceKm(function(prev) { return prev + distance; });
            lastPoint = [lat, lng];
            lastTime = now;
          }
        } else {
          setRecordedPoints([[lat, lng]]);
          lastPoint = [lat, lng];
          lastTime = now;
        }
      },
      function(err) {
        console.error("Geolocation error:", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  function cleanupRecording() {
    setRecordingTrail(false);
    setIsRecordingPaused(false);
    setRecordedPoints([]);
    setRecordedDistanceKm(0);
    setRecordedDurationSec(0);
    releaseWakeLock();

    if (recordingTimerId.current) {
      clearInterval(recordingTimerId.current);
      recordingTimerId.current = null;
    }
    if (recordingWatchId.current) {
      navigator.geolocation.clearWatch(recordingWatchId.current);
      recordingWatchId.current = null;
    }
    
    if (recordingTrailPolyline.current) {
      recordingTrailPolyline.current.remove();
      recordingTrailPolyline.current = null;
    }
  }

  function handleCancelTrailRecording() {
    if (confirm("Discard this recording session? All progress will be lost.")) {
      cleanupRecording();
      flash("❌ Recording discarded");
    }
  }

  function handleSaveTrailRecording(trailDetails) {
    if (recordedPoints.length < 2) {
      flash("⚠️ Trail needs at least 2 recorded points to save");
      return;
    }

    var newTrail = {
      id: uid(),
      name: trailDetails.name,
      description: trailDetails.description,
      color: trailDetails.color,
      coordinates: recordedPoints,
      distance_km: recordedDistanceKm,
      duration_seconds: recordedDurationSec,
      owner: uname,
      is_public: trailDetails.is_public
    };

    api.createTrail(newTrail)
      .then(function() {
        flash("💾 Trail saved successfully!");
        api.getTrails(uname).then(function(data) { setTrails(data || []); });
        cleanupRecording();
      })
      .catch(function(err) {
        console.error("Error saving trail:", err);
        flash("❌ Error saving trail");
      });
  }

  function handleDeleteTrail(id) {
    api.deleteTrail(id)
      .then(function() {
        flash("🗑️ Trail deleted");
        setTrails(function(prev) { return prev.filter(function(t) { return t.id !== id; }); });
        if (activeTrail && activeTrail.id === id) {
          setActiveTrail(null);
        }
      })
      .catch(function(err) {
        console.error("Error deleting trail:", err);
        flash("❌ Error deleting trail");
      });
  }

  function handleImportGPX(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var content = e.target.result;
        var parser = new DOMParser();
        var doc = parser.parseFromString(content, "application/xml");
        
        var parserError = doc.querySelector("parsererror");
        if (parserError) {
          throw new Error("Invalid XML file");
        }

        var trkpts = doc.querySelectorAll("trkpt");
        if (trkpts.length === 0) {
          flash("⚠️ No track points found in GPX file");
          return;
        }

        var coordinates = [];
        var totalDist = 0;
        var lastPt = null;

        for (var i = 0; i < trkpts.length; i++) {
          var pt = trkpts[i];
          var lat = parseFloat(pt.getAttribute("lat"));
          var lng = parseFloat(pt.getAttribute("lon"));
          
          if (!isNaN(lat) && !isNaN(lng)) {
            coordinates.push([lat, lng]);
            if (lastPt) {
              totalDist += distKm(lastPt[0], lastPt[1], lat, lng);
            }
            lastPt = [lat, lng];
          }
        }

        if (coordinates.length < 2) {
          flash("⚠️ GPX trail needs at least 2 points");
          return;
        }

        var nameNode = doc.querySelector("metadata > name") || doc.querySelector("trk > name");
        var name = nameNode ? nameNode.textContent.trim() : file.name.replace(/\.[^/.]+$/, "");
        
        var descNode = doc.querySelector("metadata > desc") || doc.querySelector("trk > desc");
        var desc = descNode ? descNode.textContent.trim() : "Imported GPX route";

        setGpxImportName(name || "Imported Trail");
        setGpxImportDesc(desc || "");
        setGpxImportColor("#2a5d3c");
        setGpxImportPrivacy("public");
        setGpxImportData({
          id: uid(),
          coordinates: coordinates,
          distance_km: totalDist
        });

      } catch (err) {
        console.error("GPX parsing error:", err);
        flash("❌ Error parsing GPX file. Make sure it is valid.");
      }
    };
    reader.readAsText(file);
  }

  function confirmGpxImport() {
    if (!gpxImportData) return;
    var newTrail = {
      id: gpxImportData.id,
      name: gpxImportName.trim() || "Imported Trail",
      description: gpxImportDesc.trim(),
      color: gpxImportColor,
      coordinates: gpxImportData.coordinates,
      distance_km: gpxImportData.distance_km,
      duration_seconds: 0,
      owner: uname,
      is_public: gpxImportPrivacy === "public"
    };

    api.createTrail(newTrail)
      .then(function() {
        flash("📥 GPX Trail imported successfully!");
        api.getTrails(uname).then(function(data) { setTrails(data || []); });
        setGpxImportData(null);
      })
      .catch(function(err) {
        console.error("Error saving imported trail:", err);
        flash("❌ Error saving imported trail");
      });
  }

  useEffect(function(){
    if(!mapObj.current||!window.L) return;
    
    var displayedPins = pins;
    if(focusedUser) {
      displayedPins = pins.filter(function(p){
        return p.owner === focusedUser && (p.privacy === "public" || p.owner === uname);
      });
    } else if(activeMapPack) {
      displayedPins = pins.filter(function(p){
        return activeMapPackPinIds.indexOf(p.id) >= 0;
      });
    }

    // Clear ALL existing markers atomically
    if(window._pinLayer){ window._pinLayer.clearLayers(); }
    else { window._pinLayer = window.L.layerGroup().addTo(mapObj.current); }
    Object.values(markers.current).forEach(function(m){ try{m.remove();}catch(e){} });
    markers.current={};
    var map=mapObj.current;
    var zoom=map.getZoom();

    if(zoom<=12){
      var clPins=displayedPins.filter(function(p){
        if(focusedUser) return true;
        if(activeMapPack) return true;
        if(mapLayerRef.current==="mine") return p.owner===uname;
        if(mapLayerRef.current==="public") {
          var pubOrMine = p.privacy==="public"||p.owner===uname;
          var insiderMatch = p.privacy==="insider" && activeFilter && p.tags && p.tags.indexOf(activeFilter)>=0;
          return pubOrMine || insiderMatch;
        }
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
          m.on("click",function(){if(!activeMapPack&&pin.owner!==uname&&(mapLayerRef.current==="mine"||mapLayerRef.current==="none"))setMapLayer("public");setSelPin(pin);setOpen(false);if(pin.owner===uname)markCommentsSeen();});
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
    var layerPins = displayedPins.filter(function(p){
      // Hide expired pins from map
      if(p.expires_at && new Date(p.expires_at) < now && p.owner!==uname) return false;
      // Expiring filter
      if(showExpiringOnly) return p.expires_at && new Date(p.expires_at)>now && new Date(p.expires_at)<soon && p.privacy==="public";
      if(focusedUser) return true;
      if(activeMapPack) return true;
      if(mapLayer==="mine")   return p.owner===uname;
      if(mapLayer==="public") {
        var pubOrMine = p.privacy==="public"||p.owner===uname;
        var insiderMatch = p.privacy==="insider" && activeFilter && p.tags && p.tags.indexOf(activeFilter)>=0;
        return pubOrMine || insiderMatch;
      }
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
      m.on("click",function(){if(!activeMapPack&&pin.owner!==uname&&(mapLayerRef.current==="mine"||mapLayerRef.current==="none")){setMapLayer("public");flash("Switched to show all public pins");}setSelPin(pin);setOpen(false);if(pin.owner===uname)markCommentsSeen();});
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
  },[pins,activeFilter,mapLayer,uname,mapZoom,showExpiringOnly,activeMapPack,activeMapPackPinIds,focusedUser]);

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

  function focusUserPins(username) {
    setFocusedUser(username);
    setOpen(false);
    setViewUser(null);
    var userPinsToFit = pins.filter(function(p){
      return p.owner === username && (p.privacy === "public" || p.owner === uname);
    });
    if(userPinsToFit.length > 0 && mapObj.current && window.L){
      var lats = userPinsToFit.map(function(p){return p.lat;});
      var lngs = userPinsToFit.map(function(p){return p.lng;});
      var bounds = window.L.latLngBounds(
        [Math.min.apply(null,lats), Math.min.apply(null,lngs)],
        [Math.max.apply(null,lats), Math.max.apply(null,lngs)]
      );
      mapObj.current.fitBounds(bounds,{padding:[60,60]});
    } else {
      flash(t("toast_no_pins_for_user", {user: username}));
    }
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
      if(r&&r.error) flash(t("toast_profile_save_failed") + r.error.message);
      else { setMyProfile(profile); setEditingProfile(false); flash(t("toast_profile_saved")); }
    }).catch(function(e){flash(t("toast_profile_save_failed") + e.message);});
  }

  function handleDeleteAccount(){
    var confirmFirst = window.confirm("⚠️ WARNING: Deleting your account will permanently erase your profile, pins, comments, checkins, and settings. This action is absolute and cannot be undone.\n\nAre you sure you want to proceed?");
    if (!confirmFirst) return;

    var confirmSecond = window.confirm("Final confirmation: Click OK if you are 100% sure you want to permanently delete your PINMAP account.");
    if (!confirmSecond) return;

    flash("Deleting account...");
    api.deleteAccount().then(function(){
      api.signOut().then(function(){
        setUser(null);
        setSplashDone(false);
        flash("👋 Account and all associated data have been permanently deleted.");
      });
    }).catch(function(e){
      flash("❌ Deletion failed: " + e.message);
    });
  }

  function handleCreateMapPack(pack) {
    api.createMapPack(pack).then(function(newPack) {
      if(newPack && newPack.length > 0) {
        setMapPacks(function(prev) { return [newPack[0]].concat(prev); });
        flash("🧭 Guide '" + pack.name + "' created!");
      }
    }).catch(function(err) {
      flash("Failed to create guide: " + err.message);
    });
  }

  function handleDeleteMapPack(id) {
    api.deleteMapPack(id).then(function() {
      setMapPacks(function(prev) { return prev.filter(function(p) { return p.id !== id; }); });
      if(activeMapPack && activeMapPack.id === id) {
        setActiveMapPack(null);
        setActiveMapPackPinIds([]);
      }
      flash("Guide deleted.");
    }).catch(function(err) {
      flash("Failed to delete guide: " + err.message);
    });
  }

  function handleCreateChallenge(challenge) {
    api.createChallenge(challenge).then(function(newChal) {
      if(newChal && newChal.length > 0) {
        setChallenges(function(prev) { return prev.concat([newChal[0]]); });
        flash("🏆 Quest '" + challenge.title + "' designed and published!");
      }
    }).catch(function(err) {
      flash("Failed to create quest: " + err.message);
    });
  }

  function handleDeleteChallenge(id) {
    api.deleteChallenge(id).then(function() {
      setChallenges(function(prev) { return prev.filter(function(c) { return c.id !== id; }); });
      flash("Quest deleted.");
    }).catch(function(err) {
      flash("Failed to delete quest: " + err.message);
    });
  }

  function handleSelectMapPack(pack) {
    if (!pack) {
      setActiveMapPack(null);
      setActiveMapPackPinIds([]);
      flash("Guide mode deactivated.");
      return;
    }
    setActiveMapPack(pack);
    setOpen(false); // Close Profile side drawer
    setTab("map");  // Show map
    api.getMapPackPins(pack.id).then(function(pinIds) {
      setActiveMapPackPinIds(pinIds || []);
      flash("Showing '" + pack.name + "' on map!");
    }).catch(function(err) {
      console.error(err);
      flash("Failed to load guide pins.");
    });
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
    setEditForm({name:pin.name,description:pin.description||"",tags:(pin.tags||[]).join(" "),color:pin.color||"#2a5d3c",photo:pin.photo||null,trail_id:""});
    setSelPin(null);
    api.getTrailForPin(pin.id).then(function(t) {
      if (t) {
        setEditForm(function(f) { return Object.assign({}, f, {trail_id: t.id}); });
      }
    }).catch(function(err) {
      console.error("Error fetching linked trail:", err);
    });
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
        
        // Handle updating linked trail
        api.unlinkTrailFromPin(editPin.id).then(function() {
          if (editForm.trail_id) {
            return api.linkTrailToPin(editForm.trail_id, editPin.id);
          }
        }).then(function() {
          api.getTrails(uname).then(function(data) { setTrails(data || []); });
        }).catch(function(err) {
          console.error("Error updating trail link:", err);
        });

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
            setForm({name:"",description:"",tags:"",privacy:"public",photo:null,color:"#2a5d3c",expires_at:"",trail_id:""});
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
            
            // Link trail if selected
            if (form.trail_id) {
              api.linkTrailToPin(form.trail_id, pinToSave.id)
                .then(function() {
                  api.getTrails(uname).then(function(data) { setTrails(data || []); });
                })
                .catch(function(err) {
                  console.error("Error linking trail to pin:", err);
                });
            }

            setForm({name:"",description:"",tags:"",privacy:"public",photo:null,color:"#2a5d3c",expires_at:"",trail_id:""});
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

  function checkinToPin(pin) {
    requireAuth(function(){
      if(pin.owner===uname){flash("You cannot check in to your own pin!");return;}
      if(!navigator.geolocation){flash("Geolocation is not supported by your browser");return;}
      flash("Verifying precise location...");
      navigator.geolocation.getCurrentPosition(
        function(pos){
          var lat=pos.coords.latitude, lng=pos.coords.longitude;
          setUserLL({lat:lat,lng:lng});
          
          if (!window.L) { flash("Map library not ready"); return; }
          var pinLatLng = window.L.latLng(pin.lat, pin.lng);
          var userLatLng = window.L.latLng(lat, lng);
          var distanceMeters = pinLatLng.distanceTo(userLatLng);
          
          if(distanceMeters > 30){
            flash("❌ Too far! You must be within 30 meters. You are " + Math.round(distanceMeters) + "m away.");
            return;
          }
          
          api.checkin(pin.id, uname, lat, lng).then(function(newCheckin){
            // Check challenge completions
            var updatedCheckins = checkins.concat([newCheckin]);
            var checkedPinIds = updatedCheckins.map(function(c) { return c.pin_id; });
            
            challenges.forEach(function(ch) {
              var chTags = ch.tags || [];
              
              var prevCheckedPinIds = checkins.map(function(c) { return c.pin_id; });
              var prevMatchingPins = pins.filter(function(p) {
                if (prevCheckedPinIds.indexOf(p.id) < 0) return false;
                if (!p.tags) return false;
                return p.tags.some(function(t) { return chTags.indexOf(t) >= 0; });
              });
              var prevCount = prevMatchingPins.length;
              var wasDone = prevCount >= (ch.required_count || 3);

              var newMatchingPins = pins.filter(function(p) {
                if (checkedPinIds.indexOf(p.id) < 0) return false;
                if (!p.tags) return false;
                return p.tags.some(function(t) { return chTags.indexOf(t) >= 0; });
              });
              var newCount = newMatchingPins.length;
              var isDone = newCount >= (ch.required_count || 3);

              if (!wasDone && newCount > prevCount) {
                var nextCountVal = Math.min(newCount, ch.required_count || 3);
                setTimeout(function() {
                  if (isDone) {
                    flash("🎉 Quest Completed: " + (ch.icon || "🏆") + " " + ch.title + " (" + nextCountVal + "/" + (ch.required_count || 3) + ")!");
                  } else {
                    flash("🎯 Quest Progress: " + (ch.icon || "🏆") + " " + ch.title + " (" + nextCountVal + "/" + (ch.required_count || 3) + ")!");
                  }
                }, 2000);
              }
            });

            setCheckins(updatedCheckins);
            setSelPinCheckinsCount(function(c){return c+1;});
            flash("✅ Checked in successfully!");
          }).catch(function(err){
            flash("Check-in failed: " + (err.message || "already checked in"));
          });
        },
        function(err){
          flash("Location access denied — check device settings");
        },
        {enableHighAccuracy:true,timeout:6000,maximumAge:0}
      );
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
        flash("No pins found for #"+tag);
      }
    }).catch(function(){flash("Search failed");});
  }

  function doTrailSearch(){
    setTrailSearchLoading(true);
    setTrailSearchResults([]);
    api.searchTrails(trailSearch).then(function(data){
      setTrailSearchResults(data || []);
      setTrailSearchLoading(false);
    }).catch(function(){
      setTrailSearchLoading(false);
      flash("Search failed");
    });
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

  function updateUserLocationMarker(lat, lng) {
    if (!window.L || !mapObj.current) return;
    if (window._gpsM) {
      try { window._gpsM.remove(); } catch(e) {}
    }
    if (window._userDotMarker) {
      try { window._userDotMarker.remove(); } catch(e) {}
    }
    var dotIcon = window.L.divIcon({
      className: "",
      html: '<div style="width:16px;height:16px;border-radius:50%;background:#2979ff;border:3px solid #fff;box-shadow:0 0 0 4px rgba(41,121,255,0.25);animation:pmpulse 2s infinite"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
    window._userDotMarker = window.L.marker([lat, lng], {
      icon: dotIcon,
      zIndexOffset: 1000
    }).addTo(mapObj.current);
    window._gpsM = window._userDotMarker;
  }

  function gpsLocate(){
    if(!navigator.geolocation){flash("Not supported");return;}
    setLocating(true);
    navigator.geolocation.getCurrentPosition(function(pos){
      var lat=pos.coords.latitude,lng=pos.coords.longitude;
      setUserLL({lat:lat,lng:lng});
      if(mapObj.current) mapObj.current.setView([lat,lng],14);
      updateUserLocationMarker(lat, lng);
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
    {id:"osm",       label:t("layer_standard", "Standard"),  icon:"🗺", url:"https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",                                              attr:"(c) OpenStreetMap contributors"},
    {id:"topo",      label:t("layer_topo", "Topo"),      icon:"▲",  url:"https://a.tile.opentopomap.org/{z}/{x}/{y}.png",                                               attr:"(c) OpenTopoMap contributors"},
    {id:"satellite", label:t("layer_satellite", "Satellite"), icon:"🛰",  url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",  attr:"(c) Esri"},
    {id:"trails",    label:t("layer_trails", "Trails"),    icon:"🥾",  url:"https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",                                              attr:"(c) OpenStreetMap contributors", overlay:"https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png"},
    {id:"cycleosm",  label:t("layer_cycle", "Cycle"),     icon:"🚲",  url:"https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",                              attr:"(c) OpenStreetMap contributors | Style: CyclOSM"},
    {id:"seamap",    label:t("layer_sea", "Sea"),       icon:"⚓",  url:"https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",                                              attr:"(c) OpenSeaMap contributors",    overlay:"https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"}
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

  // Get active quest details
  var activeQuest = null;
  var activeQuestProgress = { count: 0, required: 3 };
  if (activeQuestId) {
    activeQuest = challenges.find(function(ch) { return ch.id === activeQuestId; });
    if (activeQuest) {
      var chTags = activeQuest.tags || [];
      var checkedPinIds = checkins.map(function(c) { return c.pin_id; });
      var matchingPins = pins.filter(function(p) {
        if (checkedPinIds.indexOf(p.id) < 0) return false;
        if (!p.tags) return false;
        return p.tags.some(function(t) { return chTags.indexOf(t) >= 0; });
      });
      activeQuestProgress.count = Math.min(matchingPins.length, activeQuest.required_count || 3);
      activeQuestProgress.required = activeQuest.required_count || 3;
    }
  }

  if(!sessionChecked||!splashDone){
    return e(Splash,{loading:!sessionChecked,onGoogle:api.signInGoogle,onGuest:function(){setSplashDone(true);},t:t});
  }

  return e("div",{style:{position:"relative",height:"100vh",width:"100%",overflow:"hidden"}},

    e("div",{ref:mapDiv,style:{position:"absolute",top:0,left:0,right:0,bottom:"calc(60px + env(safe-area-inset-bottom,0px))",width:"100%",height:"100%",zIndex:0}}),

    activeMapPack && e("div", {
      style: {
        position: "absolute",
        top: "max(16px, env(safe-area-inset-top, 0px))",
        left: 16,
        right: 16,
        maxWidth: 480,
        margin: "0 auto",
        background: "rgba(246, 241, 228, 0.95)",
        border: "2px solid #2a5d3c",
        borderRadius: 14,
        padding: "12px 14px",
        zIndex: 1000,
        boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12
      }
    },
      e("div", {style: {flex: 1}},
        e("div", {style: {display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap"}},
          e("span", {style: {fontSize: 10, background: "#2a5d3c", color: "#f6f1e4", padding: "2px 6px", borderRadius: 10, fontFamily: "JetBrains Mono, monospace", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em"}}, "Active Collection"),
          e("span", {style: {fontWeight: 700, fontSize: 14, color: "#1a201c"}}, activeMapPack.name)
        ),
        e("div", {style: {fontSize: 11.5, color: "#3c4540", marginTop: 4, lineHeight: 1.3}}, activeMapPack.description || "Filtering map by this collection."),
        e("div", {style: {fontSize: 10, color: "#6f786f", marginTop: 2}}, "Created by @" + activeMapPack.owner)
      ),
      e("button", {
        style: {
          background: "rgba(42, 93, 60, 0.1)",
          border: "none",
          color: "#2a5d3c",
          fontWeight: 700,
          fontSize: 12,
          padding: "8px 12px",
          borderRadius: 8,
          cursor: "pointer",
          whiteSpace: "nowrap"
        },
        onClick: function() { handleSelectMapPack(null); }
      }, "✕ Exit")
    ),

    activeQuest && e("div", {
      style: {
        position: "absolute",
        top: activeMapPack ? "calc(110px + max(16px, env(safe-area-inset-top, 0px)))" : "max(16px, env(safe-area-inset-top, 0px))",
        left: 16,
        right: 16,
        maxWidth: 480,
        margin: "0 auto",
        background: "rgba(255, 255, 255, 0.95)",
        border: "2px solid #d4af37",
        borderRadius: 14,
        padding: "12px 14px",
        zIndex: 1000,
        boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12
      }
    },
      e("div", {style: {flex: 1, minWidth: 0}},
        e("div", {style: {display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap"}},
          e("span", {style: {fontSize: 10, background: "#d4af37", color: "#fff", padding: "2px 6px", borderRadius: 10, fontFamily: "JetBrains Mono, monospace", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em"}}, "Active Quest 🎯"),
          e("span", {style: {fontWeight: 700, fontSize: 13.5, color: "#1a201c"}}, (activeQuest.icon || "🏆") + " " + activeQuest.title)
        ),
        e("div", {style: {fontSize: 11.5, color: "#3c4540", marginTop: 4, lineHeight: 1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}, activeQuest.description),
        e("div", {style: {marginTop: 6, display: "flex", alignItems: "center", gap: 8}},
          e("div", {style: {flex: 1, height: 5, background: T.borderSoft, borderRadius: 2.5, overflow: "hidden"}},
            e("div", {style: {width: (activeQuestProgress.count / activeQuestProgress.required * 100) + "%", height: "100%", background: "#d4af37"}})
          ),
          e("span", {style: {fontSize: 10, color: T.ink2, fontFamily: T.mono, flexShrink:0}}, activeQuestProgress.count + " / " + activeQuestProgress.required)
        )
      ),
      e("button", {
        style: {
          background: "rgba(212, 175, 55, 0.1)",
          border: "none",
          color: "#d4af37",
          fontWeight: 700,
          fontSize: 11,
          padding: "6px 10px",
          borderRadius: 8,
          cursor: "pointer",
          whiteSpace: "nowrap"
        },
        onClick: function() {
          setActiveQuestId("");
          localStorage.setItem("pinmap_active_quest_id", "");
          flash("Quest paused. You can resume it anytime.");
        }
      }, "✕ Pause")
    ),

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
              try {
                installPrompt.prompt();
                installPrompt.userChoice.then(function(choiceResult){
                  console.log("PWA install choice outcome:", choiceResult ? choiceResult.outcome : "unknown");
                  setShowInstall(false);
                  setInstallPrompt(null);
                }).catch(function(err){
                  console.error("Error waiting for PWA install choice:", err);
                  setShowInstall(false);
                  setInstallPrompt(null);
                });
              } catch(err) {
                console.error("PWA install prompt error:", err);
                flash("Install prompt error: " + err.message);
              }
            } else {
              flash("Install prompt event is not ready. Please try again in a moment.");
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



    e("div",{style:{position:"absolute",top:"calc(16px + env(safe-area-inset-top,0px))",left:16,right:16,zIndex:999}},
      e("div",{style:{display:"flex",alignItems:"center",gap:8,background:"rgba(246,241,228,0.96)",backdropFilter:"blur(12px)",border:"1px solid "+T.border,borderRadius:12,padding:"10px 14px",boxShadow:T.shadow,cursor:"pointer"},
        onClick:function(){setSearchMode("tags");setTab("search");setOpen(true);}},
        e("svg",{width:16,height:16,viewBox:"0 0 24 24",fill:"none"},e("circle",{cx:"11",cy:"11",r:"8",stroke:T.ink3,strokeWidth:2}),e("path",{d:"M21 21l-4.35-4.35",stroke:T.ink3,strokeWidth:2,strokeLinecap:"round"})),
        e("span",{style:{fontSize:15,color:T.ink3,flex:1}},t("map_search_placeholder")),
        !open&&unreadCount>0&&e("div",{style:{width:8,height:8,borderRadius:"50%",background:"#b85c2a",flexShrink:0}})
      )
    ),
    // Active filter chips on map
    !open && (activeFilter || focusedUser) && e("div",{style:{
      position:"absolute",
      top:"calc(68px + env(safe-area-inset-top,0px))",
      left:"50%",
      transform:"translateX(-50%)",
      zIndex:999,
      display:"flex",
      flexDirection:"column",
      alignItems:"center",
      gap:6,
      pointerEvents:"none"
    }},
      focusedUser && e("div",{style:{
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
        cursor:"default",
        pointerEvents:"auto"
      }},
        e("span",null,t("filtered_by_user", {user: focusedUser})),
        e("button",{
          style:{
            width:22,height:22,borderRadius:"50%",
            background:"rgba(246,241,228,0.25)",
            border:"none",color:T.paper,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:13,lineHeight:1,flexShrink:0
          },
          onClick:function(){
            setFocusedUser(null);
          }
        },"×")
      ),
      activeFilter && e("div",{style:{
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
        cursor:"default",
        pointerEvents:"auto"
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
      )
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
          mapLayer==="mine"?t("layer_mine", "mine"):mapLayer==="public"?t("layer_all", "all"):t("layer_off", "off")
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
                active&&e("div",{style:{fontSize:10,color:"rgba(246,241,228,0.7)",fontFamily:T.mono,letterSpacing:"0.06em"}},t("layer_active"))
              )
            );
          })
        )
      ),

      // ── Trails & Quests quick-access ────────────────────────────────────
      e("div",{style:{position:"relative"}},
        e("button",{
          id:"btn-trail-quest",
          onClick:function(){ setShowTrailQuestPanel(function(v){return !v;}); },
          style:{width:40,height:40,borderRadius:10,
            background:showTrailQuestPanel ? T.forest : "rgba(246,241,228,0.95)",
            backdropFilter:"blur(12px)",
            border:"1px solid "+(showTrailQuestPanel ? T.forest : T.border),
            display:"flex",alignItems:"center",justifyContent:"center",
            cursor:"pointer",boxShadow:T.shadow}
        },
          e("svg",{width:18,height:18,viewBox:"0 0 24 24",fill:"none"},
            e("path",{d:"M3 17l4-8 4 4 4-6 4 10",stroke:showTrailQuestPanel ? T.paper : T.ink2,strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"})
          )
        ),

        showTrailQuestPanel && e("div",{
          style:{
            position:"absolute",right:48,top:0,
            width:260,
            background:"rgba(246,241,228,0.98)",backdropFilter:"blur(20px)",
            border:"1px solid "+T.border,borderRadius:14,
            boxShadow:T.shadowLg,overflow:"hidden",zIndex:1000
          }
        },
          // Panel header
          e("div",{style:{padding:"12px 14px",borderBottom:"1px solid "+T.borderSoft,display:"flex",alignItems:"center",justifyContent:"space-between"}},
            e("div",{style:{fontSize:10,letterSpacing:"0.16em",textTransform:"uppercase",fontWeight:700,fontFamily:T.mono,color:T.ink3}},t("trails_and_quests")),
            e("button",{onClick:function(){setShowTrailQuestPanel(false);},style:{background:"none",border:"none",cursor:"pointer",color:T.ink3,fontSize:18,lineHeight:1,padding:0}},"\u00d7")
          ),

          // Active quest
          (function(){
            var activeQ = challenges.find(function(c){return c.id === activeQuestId;});
            if (!activeQuestId || !activeQ) {
              return e("div",{style:{padding:"10px 14px",borderBottom:"1px solid "+T.borderSoft}},
                e("div",{style:{fontSize:12,color:T.ink4,fontStyle:"italic"}},t("no_active_quest_hint")),
                e("button",{
                  style:{marginTop:8,width:"100%",padding:"8px",borderRadius:8,border:"1px solid "+T.border,background:"transparent",color:T.ink2,fontSize:12,cursor:"pointer",fontWeight:600},
                  onClick:function(){ setShowTrailQuestPanel(false); setTab("profile"); setOpen(true); }
                },t("go_to_quests"))
              );
            }
            var chTags = activeQ.tags || [];
            var checkedPinIds = checkins.map(function(c){return c.pin_id;});
            var matchingCount = Math.min(
              pins.filter(function(p){
                if (checkedPinIds.indexOf(p.id) < 0) return false;
                return p.tags && p.tags.some(function(t){return chTags.indexOf(t)>=0;});
              }).length,
              activeQ.required_count || 3
            );
            var isDone = matchingCount >= (activeQ.required_count || 3);
            return e("div",{style:{padding:"10px 14px",borderBottom:"1px solid "+T.borderSoft}},
              e("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:6}},
                e("span",{style:{fontSize:18}},activeQ.icon||"\ud83c\udfc6"),
                e("div",{style:{flex:1,minWidth:0}},
                  e("div",{style:{fontSize:13,fontWeight:700,color:T.ink,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},activeQ.title),
                  e("div",{style:{fontSize:11,color:T.ink3,fontFamily:T.mono}},t("checkins_count_of", {count: matchingCount, total: activeQ.required_count||3})+(isDone?" ✅":""))
                ),
                e("button",{
                  onClick:function(){ setActiveQuestId(""); localStorage.setItem("pinmap_active_quest_id",""); flash(t("toast_quest_paused")); },
                  style:{padding:"4px 10px",borderRadius:6,border:"none",background:"#d4af37",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0}
                },"\u23f8 " + t("pause"))
              ),
              e("div",{style:{width:"100%",height:5,background:T.borderSoft,borderRadius:3,overflow:"hidden"}},
                e("div",{style:{width:(matchingCount/(activeQ.required_count||3)*100)+"%",height:"100%",background:isDone?"#d4af37":T.forest,borderRadius:3}})
              )
            );
          }()),

          // Collections quick-link
          e("div",{style:{padding:"8px 14px",borderBottom:"1px solid "+T.borderSoft,display:"flex",alignItems:"center",justifyContent:"space-between"}},
            e("div",{style:{fontSize:12,color:T.ink2,fontWeight:600}},
              "📂 " + t("collections"),
              e("span",{style:{marginLeft:6,fontSize:11,color:T.ink4}},mapPacks.length>0 ? mapPacks.length+" "+t("total") : t("none"))
            ),
            e("button",{
              style:{padding:"4px 10px",borderRadius:6,border:"1px solid "+T.border,background:"transparent",color:T.ink2,fontSize:11,cursor:"pointer"},
              onClick:function(){ setShowTrailQuestPanel(false); setTab("profile"); setOpen(true); }
            },t("manage_btn"))
          ),

          // Trails list
          e("div",{style:{padding:"8px 14px 4px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid "+T.borderSoft}},
            e("div",{style:{fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:700,fontFamily:T.mono,color:T.ink3}},t("trails_routes")),
            e("button",{
              style:{padding:"4px 10px",borderRadius:6,border:"none",background:T.forest,color:T.paper,fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4},
              onClick:function(){ setShowTrailQuestPanel(false); if(window._startTrailRecording) window._startTrailRecording(); else flash(t("open_profile_to_record")); }
            },
              e("span",{style:{fontSize:8}},"🔴"),
              t("record_btn")
            )
          ),
          trails.length===0
            ? e("div",{style:{padding:"10px 14px 12px",fontSize:12,color:T.ink4,fontStyle:"italic"}},t("no_recorded_trails"))
            : e("div",{style:{maxHeight:180,overflowY:"auto"}},
                trails.slice(0,8).map(function(trail){
                  var isActive = activeTrail && activeTrail.id===trail.id;
                  return e("div",{
                    key:trail.id,
                    style:{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderBottom:"1px solid "+T.borderSoft,cursor:"pointer"},
                    onClick:function(){ setShowTrailQuestPanel(false); setActiveTrail(isActive ? null : trail); }
                  },
                    e("div",{style:{width:7,height:7,borderRadius:"50%",background:trail.color||T.forest,flexShrink:0}}),
                    e("div",{style:{flex:1,minWidth:0}},
                      e("div",{style:{fontSize:12,fontWeight:600,color:T.ink,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},trail.name),
                      e("div",{style:{fontSize:10,color:T.ink4,fontFamily:T.mono}},Number(trail.distance_km||0).toFixed(2)+" "+t("km"))
                    ),
                    e("div",{style:{fontSize:10,fontWeight:700,color:isActive?T.forest:T.ink4,flexShrink:0}},isActive?t("active_badge_on"):t("view_label"))
                  );
                })
              )
        )
      ),

      // Locate / GPS button
      e("button",{
        onClick:function(){
          if(!navigator.geolocation){flash(t("toast_geo_not_supported"));return;}
          navigator.geolocation.getCurrentPosition(
            function(pos){
              var lat=pos.coords.latitude, lng=pos.coords.longitude;
              if(mapObj.current){
                mapObj.current.setView([lat,lng],15);
              }
              updateUserLocationMarker(lat, lng);
              setUserLL({lat:lat,lng:lng});
              flash(t("toast_your_location"));
            },
            function(err){flash(t("toast_location_unavailable"));},
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

    // Bottom-left: Zoom controls (above coordinates)
    e("div",{style:{position:"absolute",bottom:"calc(108px + env(safe-area-inset-bottom,0px))",left:14,zIndex:999,display:"flex",flexDirection:"column",borderRadius:10,overflow:"hidden",boxShadow:T.shadow,border:"1px solid "+T.border}},
      e("button",{
        id:"btn-zoom-in",
        onClick:function(){if(mapObj.current) mapObj.current.zoomIn();},
        style:{width:40,height:40,background:"rgba(246,241,228,0.95)",backdropFilter:"blur(12px)",
          border:"none",borderBottom:"1px solid "+T.border,
          display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:22,color:T.ink,fontWeight:300}
      },"+"),
      e("button",{
        id:"btn-zoom-out",
        onClick:function(){if(mapObj.current) mapObj.current.zoomOut();},
        style:{width:40,height:40,background:"rgba(246,241,228,0.95)",backdropFilter:"blur(12px)",
          border:"none",
          display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:28,color:T.ink,fontWeight:300,lineHeight:1}
      },"−")
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



    // Offline reticle overlay — draggable + resizable selection box
    offlineMode && reticleBox && (function(){
      var rb = reticleBox;
      var vw = window.innerWidth, vh = window.innerHeight;
      var MIN_SIZE = 80;

      // ── pointer helpers for drag ────────────────────────────────
      function onReticlePtrDown(ev) {
        ev.stopPropagation();
        var clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
        var clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
        reticleDrag.current = { startX:clientX, startY:clientY, origTop:rb.top, origLeft:rb.left };
      }
      function onReticlePtrMove(ev) {
        ev.preventDefault();
        var clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
        var clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
        // drag
        if(reticleDrag.current && !reticleResize.current) {
          var dx = clientX - reticleDrag.current.startX;
          var dy = clientY - reticleDrag.current.startY;
          var newTop  = Math.max(0, Math.min(vh - rb.height, reticleDrag.current.origTop  + dy));
          var newLeft = Math.max(0, Math.min(vw - rb.width,  reticleDrag.current.origLeft + dx));
          setReticleBox(function(b){ return Object.assign({},b,{top:newTop,left:newLeft}); });
        }
        // resize
        if(reticleResize.current) {
          var d = reticleResize.current;
          var ddx = clientX - d.startX, ddy = clientY - d.startY;
          var nb = Object.assign({},d.origBox);
          if(d.corner==='se'){ nb.width=Math.max(MIN_SIZE,d.origBox.width+ddx); nb.height=Math.max(MIN_SIZE,d.origBox.height+ddy); }
          if(d.corner==='sw'){ var nw=Math.max(MIN_SIZE,d.origBox.width-ddx); nb.left=d.origBox.left+(d.origBox.width-nw); nb.width=nw; nb.height=Math.max(MIN_SIZE,d.origBox.height+ddy); }
          if(d.corner==='ne'){ nb.width=Math.max(MIN_SIZE,d.origBox.width+ddx); var nh=Math.max(MIN_SIZE,d.origBox.height-ddy); nb.top=d.origBox.top+(d.origBox.height-nh); nb.height=nh; }
          if(d.corner==='nw'){ var nw2=Math.max(MIN_SIZE,d.origBox.width-ddx); nb.left=d.origBox.left+(d.origBox.width-nw2); nb.width=nw2; var nh2=Math.max(MIN_SIZE,d.origBox.height-ddy); nb.top=d.origBox.top+(d.origBox.height-nh2); nb.height=nh2; }
          setReticleBox(nb);
        }
      }
      function onReticlePtrUp() {
        reticleDrag.current = null;
        reticleResize.current = null;
      }
      function onResizePtrDown(corner, ev) {
        ev.stopPropagation();
        var clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
        var clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
        reticleResize.current = { corner:corner, startX:clientX, startY:clientY, origBox: Object.assign({},rb) };
      }

      // ── shade outside the reticle using 4 bars ─────────────────
      var shadeStyle = {position:"absolute",background:"rgba(0,0,0,0.58)"};

      return e("div", {
        style:{position:"fixed",inset:0,zIndex:2000,pointerEvents:"all",userSelect:"none"},
        onMouseMove:onReticlePtrMove, onTouchMove:onReticlePtrMove,
        onMouseUp:onReticlePtrUp,   onTouchEnd:onReticlePtrUp
      },
        // Shade: top
        e("div",{style:Object.assign({},shadeStyle,{top:0,left:0,right:0,height:rb.top})}),
        // Shade: bottom
        e("div",{style:Object.assign({},shadeStyle,{top:rb.top+rb.height,left:0,right:0,bottom:0})}),
        // Shade: left
        e("div",{style:Object.assign({},shadeStyle,{top:rb.top,left:0,width:rb.left,height:rb.height})}),
        // Shade: right
        e("div",{style:Object.assign({},shadeStyle,{top:rb.top,left:rb.left+rb.width,right:0,height:rb.height})}),

        // ── Reticle box (draggable) ────────────────────────────────
        e("div", {
          style:{
            position:"absolute",
            top:rb.top, left:rb.left, width:rb.width, height:rb.height,
            border:"2px solid rgba(246,241,228,0.92)",
            borderRadius:6,
            boxSizing:"border-box",
            cursor:"grab",
            touchAction:"none"
          },
          onMouseDown:onReticlePtrDown,
          onTouchStart:onReticlePtrDown
        },
          // ── Corner resize handles ────────────────────────────────
          // NW
          e("div",{style:{position:"absolute",top:-2,left:-2,width:22,height:22,cursor:"nwse-resize",borderTop:"3px solid #f6f1e4",borderLeft:"3px solid #f6f1e4",borderRadius:"4px 0 0 0",touchAction:"none"},onMouseDown:function(ev){onResizePtrDown('nw',ev);},onTouchStart:function(ev){onResizePtrDown('nw',ev);}}),
          // NE
          e("div",{style:{position:"absolute",top:-2,right:-2,width:22,height:22,cursor:"nesw-resize",borderTop:"3px solid #f6f1e4",borderRight:"3px solid #f6f1e4",borderRadius:"0 4px 0 0",touchAction:"none"},onMouseDown:function(ev){onResizePtrDown('ne',ev);},onTouchStart:function(ev){onResizePtrDown('ne',ev);}}),
          // SW
          e("div",{style:{position:"absolute",bottom:-2,left:-2,width:22,height:22,cursor:"nesw-resize",borderBottom:"3px solid #f6f1e4",borderLeft:"3px solid #f6f1e4",borderRadius:"0 0 0 4px",touchAction:"none"},onMouseDown:function(ev){onResizePtrDown('sw',ev);},onTouchStart:function(ev){onResizePtrDown('sw',ev);}}),
          // SE
          e("div",{style:{position:"absolute",bottom:-2,right:-2,width:22,height:22,cursor:"nwse-resize",borderBottom:"3px solid #f6f1e4",borderRight:"3px solid #f6f1e4",borderRadius:"0 0 4px 0",touchAction:"none"},onMouseDown:function(ev){onResizePtrDown('se',ev);},onTouchStart:function(ev){onResizePtrDown('se',ev);}}),

          // Instruction label inside reticle
          e("div",{style:{
            position:"absolute",top:"50%",left:0,right:0,
            transform:"translateY(-50%)",
            textAlign:"center",
            color:"rgba(246,241,228,0.7)",fontSize:11,letterSpacing:"0.08em",
            pointerEvents:"none",fontFamily:"Inter, system-ui, sans-serif"
          }},"✥ Drag to move · corners to resize")
        ),

        // ── Action bar below the reticle ───────────────────────────
        e("div",{style:{
          position:"absolute",
          top: Math.min(rb.top + rb.height + 16, vh - 80),
          left:0,right:0,
          display:"flex",justifyContent:"center",gap:12,
          padding:"0 24px"
        }},
          e("button",{
            style:{flex:1,maxWidth:160,padding:"13px 0",borderRadius:12,
              border:"1px solid rgba(246,241,228,0.4)",
              background:"rgba(26,32,28,0.82)",
              color:"rgba(246,241,228,0.85)",fontSize:14,cursor:"pointer",
              fontFamily:"Inter, system-ui, sans-serif"},
            onClick:function(){setOfflineMode(false);}
          },"Cancel"),
          e("button",{
            style:{flex:1,maxWidth:160,padding:"13px 0",borderRadius:12,
              border:"none",background:"#2a5d3c",
              color:"#f6f1e4",fontSize:14,fontWeight:700,cursor:"pointer",
              fontFamily:"Inter, system-ui, sans-serif",
              boxShadow:"0 4px 16px rgba(0,0,0,0.3)"},
            onClick:downloadOfflineTiles
          },"📥 Download")
        )
      );
    })(),

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
            placeholder:searchMode==="tags"?t("search_placeholder_tags_detail"):searchMode==="quests"?t("search_placeholder_quests"):searchMode==="trails"?t("search_placeholder_trails"):t("search_placeholder_places_detail"),
            value:searchMode==="tags"?searchTag:searchMode==="quests"?questSearch:searchMode==="trails"?trailSearch:addrSearch,
            onChange:function(ev){if(searchMode==="tags")setSearchTag(ev.target.value);else if(searchMode==="quests")setQuestSearch(ev.target.value);else if(searchMode==="trails")setTrailSearch(ev.target.value);else setAddrSearch(ev.target.value);},
            onKeyDown:function(ev){if(ev.key==="Enter"){if(searchMode==="tags")doSearch();else if(searchMode==="trails")doTrailSearch();else if(searchMode==="places"){if(!addrSearch.trim())return;setAddrLoading(true);setAddrResults([]);fetch("https://nominatim.openstreetmap.org/search?format=json&limit=6&q="+encodeURIComponent(addrSearch),{headers:{"Accept-Language":"en","User-Agent":"PINMAP-App"}}).then(function(r){return r.json();}).then(function(d){setAddrResults(d||[]);setAddrLoading(false);}).catch(function(){setAddrLoading(false);});}}}
          }),
          searchMode!=="quests" && e("button",{
            style:{width:"100%",padding:"11px",borderRadius:10,background:T.forest,color:T.paper,border:"none",fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:12},
            onClick:function(){if(searchMode==="tags")doSearch();else if(searchMode==="trails")doTrailSearch();else{if(!addrSearch.trim())return;setAddrLoading(true);setAddrResults([]);fetch("https://nominatim.openstreetmap.org/search?format=json&limit=6&q="+encodeURIComponent(addrSearch),{headers:{"Accept-Language":"en","User-Agent":"PINMAP-App"}}).then(function(r){return r.json();}).then(function(d){setAddrResults(d||[]);setAddrLoading(false);}).catch(function(){setAddrLoading(false);flash(t("toast_tiles_error"));});}}
          },t("search_btn")),
          e("div",{style:{display:"flex",borderBottom:"1px solid "+T.borderSoft,overflowX:"auto",scrollbarWidth:"none",msOverflowStyle:"none",WebkitOverflowScrolling:"touch"}},
            e("button",{style:{flex:1,flexShrink:0,whiteSpace:"nowrap",padding:"8px 12px",background:"none",border:"none",cursor:"pointer",fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:600,color:searchMode==="tags"?T.forest:T.ink3,fontFamily:T.mono,borderBottom:searchMode==="tags"?"2px solid "+T.forest:"2px solid transparent"},onClick:function(){setSearchMode("tags");setAddrResults([]);setSearchTag("");}
            },"# " + t("search_mode_tags")),
            e("button",{style:{flex:1,flexShrink:0,whiteSpace:"nowrap",padding:"8px 12px",background:"none",border:"none",cursor:"pointer",fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:600,color:searchMode==="places"?T.forest:T.ink3,fontFamily:T.mono,borderBottom:searchMode==="places"?"2px solid "+T.forest:"2px solid transparent"},onClick:function(){setSearchMode("places");}
            },"📍 " + t("search_mode_places")),
            e("button",{style:{flex:1,flexShrink:0,whiteSpace:"nowrap",padding:"8px 12px",background:"none",border:"none",cursor:"pointer",fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:600,color:searchMode==="quests"?T.forest:T.ink3,fontFamily:T.mono,borderBottom:searchMode==="quests"?"2px solid "+T.forest:"2px solid transparent"},onClick:function(){setSearchMode("quests");}
            },"🏆 " + t("search_mode_quests")),
            e("button",{style:{flex:1,flexShrink:0,whiteSpace:"nowrap",padding:"8px 12px",background:"none",border:"none",cursor:"pointer",fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:600,color:searchMode==="trails"?T.forest:T.ink3,fontFamily:T.mono,borderBottom:searchMode==="trails"?"2px solid "+T.forest:"2px solid transparent"},onClick:function(){setSearchMode("trails");}
            },"🥾 " + t("search_mode_trails"))
          )
        ),

        e("div",{style:{flex:1,overflowY:"auto",padding:"0 22px"}},
          searchMode==="places"
            ? e("div",null,
                addrLoading&&e("div",{style:{padding:"20px 0",textAlign:"center",color:T.ink3,fontSize:13}},t("searching_loading")),
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
                addrResults.length===0&&!addrLoading&&addrSearch&&e("div",{style:{padding:"20px 0",textAlign:"center",color:T.ink3,fontSize:13}},t("no_places_found"))
              )
            : searchMode==="quests"
            ? e("div",null,
                (function(){
                  var trackedList = [];
                  try {
                    var saved = localStorage.getItem("pinmap_tracked_quests");
                    trackedList = saved ? JSON.parse(saved) : [];
                  } catch(e){}

                  var deletedList = [];
                  try {
                    var savedDeleted = localStorage.getItem("pinmap_deleted_quests");
                    deletedList = savedDeleted ? JSON.parse(savedDeleted) : [];
                  } catch(e){}

                  var query = questSearch.toLowerCase().trim();
                  var visible = challenges.filter(function(ch) {
                    return deletedList.indexOf(ch.id) < 0;
                  });

                  var filtered = visible.filter(function(ch) {
                    if (!query) return true;
                    var titleMatch = ch.title && ch.title.toLowerCase().indexOf(query) >= 0;
                    var descMatch = ch.description && ch.description.toLowerCase().indexOf(query) >= 0;
                    var tagMatch = ch.tags && ch.tags.some(function(t) { return t.toLowerCase().indexOf(query) >= 0; });
                    return titleMatch || descMatch || tagMatch;
                  });

                  // Sort: community challenges first (ch.owner !== "system"), then system challenges last
                  var sorted = filtered.slice().sort(function(a, b) {
                    var aIsSystem = a.owner === "system" ? 1 : 0;
                    var bIsSystem = b.owner === "system" ? 1 : 0;
                    if (aIsSystem !== bIsSystem) {
                      return aIsSystem - bIsSystem; // system goes last
                    }
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0); // newest first
                  });

                  if (sorted.length === 0) {
                    return e("div",{style:{padding:"30px 0",textAlign:"center",color:T.ink3,fontSize:14,fontStyle:"italic"}},"No community quests found matching this search.");
                  }

                  return e("div",{style:{padding:"10px 0"}},
                    sorted.map(function(ch){
                      var chTags = ch.tags || [];
                      var checkedPinIds = checkins.map(function(c) { return c.pin_id; });
                      var matchingPins = pins.filter(function(p) {
                        if (checkedPinIds.indexOf(p.id) < 0) return false;
                        if (!p.tags) return false;
                        return p.tags.some(function(t) { return chTags.indexOf(t) >= 0; });
                      });
                      var count = Math.min(matchingPins.length, ch.required_count || 3);
                      var isDone = count >= (ch.required_count || 3);
                      var isTracked = trackedList.indexOf(ch.id) >= 0;

                      return e("div",{
                        key:ch.id,
                        style:{
                          background:T.paper2,
                          border:isDone ? "2px solid #d4af37" : "1px solid "+T.borderSoft,
                          borderRadius:14,
                          padding:"14px 16px",
                          marginBottom:12,
                          boxShadow:"0 1px 3px rgba(0,0,0,0.05)",
                          display:"flex",
                          gap:14,
                          alignItems:"flex-start"
                        }
                      },
                        e("div",{style:{fontSize:28,lineHeight:1.1,marginTop:2}},ch.icon || "🏆"),
                        e("div",{style:{flex:1,minWidth:0}},
                          e("div",{style:{display:"flex",alignItems:"baseline",gap:6,flexWrap:"wrap"}},
                            e("span",{style:{fontWeight:700,fontSize:14.5,color:T.ink}},ch.title),
                            ch.owner && ch.owner !== "system" && e("span",{style:{fontSize:11,color:T.ink3}},"by @"+ch.owner)
                          ),
                          e("div",{style:{fontSize:12.5,color:T.ink2,marginTop:4,lineHeight:1.4}},ch.description),
                          
                          // Tags
                          e("div",{style:{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}},
                            chTags.map(function(t, idx){
                              return e("span",{key:idx,style:{fontSize:9.5,background:"rgba(26,32,28,0.05)",color:T.ink2,padding:"2px 6px",borderRadius:4,fontFamily:T.mono}},"#"+t);
                            })
                          ),

                          // Progress bar
                          e("div",{style:{marginTop:10,display:"flex",alignItems:"center",gap:10}},
                            e("div",{style:{flex:1}},
                              e("div",{style:{display:"flex",justifyContent:"space-between",fontSize:10,color:T.ink3,fontFamily:T.mono,marginBottom:3}},
                                e("span",null,"Progress"),
                                e("span",null,count+" / "+(ch.required_count || 3))
                              ),
                              e("div",{style:{width:"100%",height:5,background:T.borderSoft,borderRadius:3,overflow:"hidden"}},
                                e("div",{style:{width:(count/(ch.required_count || 3)*100)+"%",height:"100%",background:isDone ? "#d4af37" : T.forest,borderRadius:3}})
                              )
                            ),
                            e("div",{style:{display:"flex",alignItems:"center",gap:8}},
                              ch.owner !== "system" && ch.owner !== uname && e("button",{
                                style:{
                                  background:isTracked ? "transparent" : T.borderSoft,
                                  color:isTracked ? T.ink3 : T.ink2,
                                  border:isTracked ? "1px solid "+T.borderSoft : "none",
                                  padding:"5px 10px",
                                  borderRadius:8,
                                  fontSize:11,
                                  fontWeight:700,
                                  cursor:"pointer"
                                },
                                onClick:function(){
                                  var list = [];
                                  try {
                                    var saved = localStorage.getItem("pinmap_tracked_quests");
                                    list = saved ? JSON.parse(saved) : [];
                                  } catch(e){}

                                  if (list.indexOf(ch.id) >= 0) {
                                    list = list.filter(function(x) { return x !== ch.id; });
                                    flash("Stopped tracking quest.");
                                    if (activeQuestId === ch.id) {
                                      setActiveQuestId("");
                                      localStorage.setItem("pinmap_active_quest_id", "");
                                    }
                                  } else {
                                    list = list.concat([ch.id]);
                                    flash("Started tracking quest! View in Profile.");
                                    // Remove from deleted/hidden if it was there
                                    try {
                                      var del = localStorage.getItem("pinmap_deleted_quests");
                                      var delList = del ? JSON.parse(del) : [];
                                      if (delList.indexOf(ch.id) >= 0) {
                                        delList = delList.filter(function(x) { return x !== ch.id; });
                                        localStorage.setItem("pinmap_deleted_quests", JSON.stringify(delList));
                                      }
                                    } catch(e){}
                                  }
                                  localStorage.setItem("pinmap_tracked_quests", JSON.stringify(list));
                                  // Force state update
                                  setChallenges(function(prev){ return prev.slice(); });
                                }
                              },isTracked ? "Tracked" : "Track"),
                              e("button",{
                                style:{
                                  background:activeQuestId === ch.id ? "#d4af37" : T.forest,
                                  color:"#fff",
                                  border:"none",
                                  padding:"5px 10px",
                                  borderRadius:8,
                                  fontSize:11,
                                  fontWeight:700,
                                  cursor:"pointer",
                                  display:"inline-flex",
                                  alignItems:"center",
                                  gap:3
                                },
                                onClick:function(){
                                  if (activeQuestId === ch.id) {
                                    setActiveQuestId("");
                                    localStorage.setItem("pinmap_active_quest_id", "");
                                    flash("Quest paused.");
                                  } else {
                                    // Track if not tracked and community quest
                                    if (!isTracked && ch.owner !== "system" && ch.owner !== uname) {
                                      var list = [];
                                      try {
                                        var saved = localStorage.getItem("pinmap_tracked_quests");
                                        list = saved ? JSON.parse(saved) : [];
                                      } catch(e){}
                                      if (list.indexOf(ch.id) < 0) {
                                        list = list.concat([ch.id]);
                                        localStorage.setItem("pinmap_tracked_quests", JSON.stringify(list));
                                      }
                                    }
                                    // Remove from deleted/hidden if it was there
                                    try {
                                      var del = localStorage.getItem("pinmap_deleted_quests");
                                      var delList = del ? JSON.parse(del) : [];
                                      if (delList.indexOf(ch.id) >= 0) {
                                        delList = delList.filter(function(x) { return x !== ch.id; });
                                        localStorage.setItem("pinmap_deleted_quests", JSON.stringify(delList));
                                      }
                                    } catch(e){}

                                    setActiveQuestId(ch.id);
                                    localStorage.setItem("pinmap_active_quest_id", ch.id);
                                    flash("🎯 Quest started! Follow your progress on the map.");
                                    setOpen(false); // Close sidebar drawer
                                  }
                                  // Force state update
                                  setChallenges(function(prev){ return prev.slice(); });
                                }
                              },activeQuestId === ch.id ? "🎯 Active" : "Start"),
                              e("button",{
                                style:{background:"none",border:"none",color:"#c05050",cursor:"pointer",padding:4,fontSize:14},
                                onClick:function(){
                                  if(ch.owner === uname) {
                                    if(confirm("Delete this challenge permanently for everyone?")){
                                      api.deleteChallenge(ch.id).then(function(){
                                        flash("Quest deleted permanently.");
                                        setChallenges(function(prev){ return prev.filter(function(x){ return x.id !== ch.id; }); });
                                      }).catch(function(err){
                                        flash("Delete failed: "+err.message);
                                      });
                                    }
                                  } else {
                                    if(confirm("Remove this quest from your list?")){
                                      var nextDeleted = [];
                                      try {
                                        var saved = localStorage.getItem("pinmap_deleted_quests");
                                        nextDeleted = saved ? JSON.parse(saved) : [];
                                      } catch(e){}
                                      nextDeleted = nextDeleted.concat([ch.id]);
                                      localStorage.setItem("pinmap_deleted_quests", JSON.stringify(nextDeleted));
                                      flash("Quest removed from your list.");
                                      // Force state update
                                      setChallenges(function(prev){ return prev.slice(); });
                                    }
                                  }
                                }
                              },"🗑️")
                            )
                          )
                        )
                      );
                    })
                  );
                })()
              )
            : searchMode==="trails"
            ? e("div",null,
                trailSearchLoading&&e("div",{style:{padding:"20px 0",textAlign:"center",color:T.ink3,fontSize:13}},t("searching_loading")),
                !trailSearchLoading&&trailSearchResults.length>0&&e("div",{style:{padding:"10px 0"}},
                  trailSearchResults.map(function(trail){
                    return e("div", {
                      key: trail.id,
                      style: {
                        padding: "14px 12px",
                        background: T.paper2,
                        border: "1px solid " + T.borderSoft,
                        borderRadius: 10,
                        marginBottom: 10,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8
                      }
                    },
                      e("div", {style: {display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8}},
                        e("div", {style: {flex: 1, minWidth: 0}},
                          e("div", {style: {fontWeight: 700, fontSize: 15, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}, trail.name || "Untitled Trail"),
                          e("div", {style: {fontSize: 12, color: T.ink3, marginTop: 2}},
                            "by ",
                            e("span", {
                              style: {cursor: "pointer", textDecoration: "underline", color: T.forest, fontWeight: 500},
                              onClick: function() { loadUserProfile(trail.owner); }
                            }, "@" + trail.owner),
                            " · " + Number(trail.distance_km || 0).toFixed(2) + " km" +
                            (trail.duration_seconds ? " · " + (function(sec){
                              var h = Math.floor(sec / 3600);
                              var m = Math.floor((sec % 3600) / 60);
                              return (h > 0 ? h + "h " : "") + m + "m";
                            })(trail.duration_seconds) : "")
                          )
                        ),
                        e("span", {
                          style: {
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            backgroundColor: trail.color || T.forest,
                            flexShrink: 0,
                            marginTop: 5
                          }
                        })
                      ),
                      trail.description && e("div", {
                        style: {
                          fontSize: 12.5,
                          color: T.ink2,
                          lineHeight: 1.4,
                          maxHeight: 40,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical"
                        }
                      }, trail.description),
                      e("div", {style: {display: "flex", gap: 8, marginTop: 4}},
                        e("button", {
                          style: {
                            flex: 1,
                            fontSize: 12,
                            padding: "6px 12px",
                            borderRadius: 8,
                            cursor: "pointer",
                            background: activeTrail && activeTrail.id === trail.id ? T.forest : "transparent",
                            color: activeTrail && activeTrail.id === trail.id ? "#fff" : T.forest,
                            border: "1px solid " + T.forest,
                            fontWeight: 600
                          },
                          onClick: function() {
                            if (activeTrail && activeTrail.id === trail.id) {
                              setActiveTrail(null);
                            } else {
                              setActiveTrail(trail);
                            }
                          }
                        }, activeTrail && activeTrail.id === trail.id ? "Showing" : t("view_trail")),
                        (uname && uname !== "guest") && (function() {
                          var isSaved = savedTrailIds.indexOf(trail.id) >= 0;
                          return e("button", {
                            style: {
                              flex: 1,
                              fontSize: 12,
                              padding: "6px 12px",
                              borderRadius: 8,
                              cursor: "pointer",
                              background: isSaved ? T.forestPale : "transparent",
                              color: isSaved ? T.forest : T.ink3,
                              border: "1px solid " + (isSaved ? T.forest : T.border),
                              fontWeight: 600
                            },
                            onClick: function() {
                              if (isSaved) {
                                api.unsaveTrail(trail.id, uname).then(function() {
                                  setSavedTrailIds(function(prev) { return prev.filter(function(id) { return id !== trail.id; }); });
                                  api.getTrails(uname).then(function(data) { setTrails(data || []); });
                                  flash("Trail removed from saves");
                                }).catch(function() { flash("Unsave failed"); });
                              } else {
                                api.saveTrail(trail.id, uname).then(function() {
                                  setSavedTrailIds(function(prev) { return prev.concat([trail.id]); });
                                  api.getTrails(uname).then(function(data) { setTrails(data || []); });
                                  flash("Trail saved to profile!");
                                }).catch(function() { flash("Save failed"); });
                              }
                            }
                          }, isSaved ? "★ " + t("unsave_trail") : "☆ " + t("save_trail"));
                        })()
                      )
                    );
                  })
                ),
                !trailSearchLoading&&trailSearchResults.length===0&&trailSearch&&e("div",{style:{padding:"20px 0",textAlign:"center",color:T.ink3,fontSize:13}},t("no_trails_found"))
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
                      (function() {
                        var tag = searchResults.tag.toLowerCase();
                        var related = challenges.filter(function(ch) {
                          var chTags = (ch.tags || []).map(function(t) { return t.toLowerCase(); });
                          return chTags.indexOf(tag) >= 0;
                        });
                        if (related.length === 0) return null;
                        return e("div", {style: {padding: "12px 0", borderBottom: "1px solid " + T.borderSoft}},
                          e("div", {style: {fontSize: 11, color: T.forest, fontWeight: 700, fontFamily: T.mono, textTransform: "uppercase", marginBottom: 8}}, "🏆 Related Quests"),
                          related.map(function(ch) {
                            var chTags = ch.tags || [];
                            var checkedPinIds = checkins.map(function(c) { return c.pin_id; });
                            var matchingPins = pins.filter(function(p) {
                              if (checkedPinIds.indexOf(p.id) < 0) return false;
                              if (!p.tags) return false;
                              return p.tags.some(function(t) { return chTags.indexOf(t) >= 0; });
                            });
                            var count = Math.min(matchingPins.length, ch.required_count || 3);
                            var isDone = count >= (ch.required_count || 3);
                            
                            // Check if this quest is tracked
                            var isTracked = ch.owner === "system" || ch.owner === uname;
                            if (!isTracked) {
                              try {
                                var saved = localStorage.getItem("pinmap_tracked_quests");
                                var savedList = saved ? JSON.parse(saved) : [];
                                isTracked = savedList.indexOf(ch.id) >= 0;
                              } catch (err) {}
                            }

                            return e("div", {
                              key: ch.id,
                              style: {
                                background: "rgba(42, 93, 60, 0.03)",
                                border: "1px solid " + (isDone ? "#d4af37" : T.borderSoft),
                                borderRadius: 10,
                                padding: "10px 12px",
                                marginBottom: 6,
                                display: "flex",
                                alignItems: "center",
                                gap: 10
                              }
                            },
                              e("div", {style: {fontSize: 20}}, ch.icon || "🏆"),
                              e("div", {style: {flex: 1, minWidth: 0}},
                                e("div", {style: {fontWeight: 600, fontSize: 13, color: T.ink, display: "flex", alignItems: "center", gap: 6}},
                                  ch.title,
                                  isDone && e("span", {style: {fontSize: 8, background: "#d4af37", color: "#fff", padding: "1px 4px", borderRadius: 4}}, "Completed")
                                ),
                                e("div", {style: {fontSize: 11, color: T.ink2, marginTop: 2, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap"}}, ch.description)
                              ),
                              e("button", {
                                style: {
                                  background: isTracked ? "transparent" : T.forest,
                                  color: isTracked ? T.ink3 : T.paper,
                                  border: isTracked ? "1px solid " + T.borderSoft : "none",
                                  padding: "4px 8px",
                                  borderRadius: 6,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: "pointer"
                                },
                                onClick: function() {
                                  // Trigger tracking toggle in localStorage
                                  var list = [];
                                  try {
                                    var saved = localStorage.getItem("pinmap_tracked_quests");
                                    list = saved ? JSON.parse(saved) : [];
                                  } catch(e){}
                                  
                                  if (list.indexOf(ch.id) >= 0) {
                                    list = list.filter(function(x) { return x !== ch.id; });
                                    flash("Stopped tracking quest.");
                                  } else {
                                    list = list.concat([ch.id]);
                                    flash("Started tracking quest! View in Profile tab.");
                                  }
                                  localStorage.setItem("pinmap_tracked_quests", JSON.stringify(list));
                                  // Refresh the component state
                                  setChallenges(function(prev) { return prev.slice(); });
                                }
                              }, isTracked ? "Tracked" : "Track")
                            );
                          })
                        );
                      })(),
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
          newUpvotePinIds:newUpvotePinIds,
          deletePin:deletePin, toggleUpvote:toggleUpvote,
          saveToCollection:saveToCollection, loadUserProfile:loadUserProfile,
          markCommentsSeen:markCommentsSeen,
          myActivity:myActivity, pins:pins,
          lang:lang, t:t
        })
      ),

      tab==="add" && e("div",{style:{padding:"22px",overflowY:"auto"}},
        e("div",{style:{padding:"0 0 16px"}},
          e("div",{style:{fontSize:10.5,letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600,color:T.ink3,fontFamily:T.mono,marginBottom:6}},t("form_title_add")),
          pendingLL && e("div",{style:{fontSize:12,color:T.forest,fontFamily:T.mono,marginTop:4}},
            formatLL(pendingLL.lat, pendingLL.lng, 4)
          )
        ),
        !user && e("div",{style:{background:T.paper2,border:"1px solid "+T.borderSoft,borderRadius:10,padding:14,marginBottom:12,textAlign:"center"}},
          e("div",{style:{fontSize:13,color:T.ink2,marginBottom:8}},t("signin_to_save_pins")),
          e("button",{style:Object.assign({},S.btn,{width:"100%"}),onClick:api.signInGoogle},t("signin_google"))
        ),
        drafts.length > 0 && e("div",{style:{marginBottom:16}},
          e("div",{style:{fontSize:11,color:T.ink3,marginBottom:8}},t("your_drafts")),
          drafts.map(function(d){
            return e("div",{key:d.id,style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:T.paper2,border:"1px solid "+T.borderSoft,borderRadius:10,marginBottom:6,cursor:"pointer"},onClick:function(){
              setForm(d.form);
              if(d.pendingLL){ setPendingLL(d.pendingLL); if(mapObj.current) mapObj.current.setView([d.pendingLL.lat, d.pendingLL.lng]); }
              else setPendingLL(null);
            }},
              e("div",{style:{flex:1}},
                e("div",{style:{fontWeight:600,fontSize:14,color:T.ink}},d.form.name || t("untitled_draft")),
                e("div",{style:{fontSize:11,color:T.ink3}},new Date(d.date).toLocaleString())
              ),
              e("button",{style:{background:"none",border:"none",color:"#c05050",cursor:"pointer",padding:5,fontSize:18,lineHeight:1},onClick:function(ev){ev.stopPropagation();setDrafts(function(ds){return ds.filter(function(x){return x.id!==d.id;});});}},"×")
            );
          })
        ),
        e("div",{style:{position:"relative",marginBottom:10}},
          e("input",{style:S.input,placeholder:t("form_placeholder_name"),value:form.name,
            onChange:function(ev){setForm(function(f){return Object.assign({},f,{name:ev.target.value});});}})
        ),
        e("textarea",{style:Object.assign({},S.input,{resize:"vertical",minHeight:70}),
          placeholder:t("form_placeholder_desc_optional"),value:form.description,
          onChange:function(ev){setForm(function(f){return Object.assign({},f,{description:ev.target.value});});}}),
        e("input",{style:S.input,placeholder:t("form_placeholder_tags_hint"),value:form.tags,
          onChange:function(ev){setForm(function(f){return Object.assign({},f,{tags:ev.target.value});});}}),
        e("div",{style:{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}},
          ["#2a5d3c","#b85c2a","#1565c0","#c62828","#6a1b9a","#00695c","#4e342e","#37474f","#f57f17"].map(function(c){
            return e("button",{key:c,onClick:function(){setForm(function(f){return Object.assign({},f,{color:c});});},
              style:{width:28,height:28,borderRadius:"50%",background:c,border:form.color===c?"3px solid "+T.ink:"3px solid transparent",cursor:"pointer"}});
          })
        ),
        e("div",{style:{display:"flex",gap:6,marginBottom:12}},
          ["public","private","insider"].map(function(p){
            return e("button",{key:p,
              style:{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+(form.privacy===p?T.forest:T.border),
                background:form.privacy===p?T.forestPale:"transparent",color:form.privacy===p?T.forest:T.ink2,
                fontSize:12,cursor:"pointer",fontWeight:form.privacy===p?600:400,textTransform:"capitalize"},
              onClick:function(){
                setForm(function(f){return Object.assign({},f,{privacy:p});});
                if(p==="insider" && !localStorage.getItem("pm-seen-insider-explainer")){
                  setShowInsiderExplainer(true);
                  localStorage.setItem("pm-seen-insider-explainer","1");
                }
              }},t("form_privacy_" + p));
          })
        ),
        !pendingLL && e("div",{style:{background:T.paper2,border:"1px dashed "+T.border,borderRadius:10,padding:"16px",marginBottom:12,textAlign:"center",color:T.ink3,fontSize:13}},
          t("form_no_location_hint")
        ),
        e("div",{style:{marginBottom:12}},
          e("div",{style:{fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,display:"block",marginBottom:6}},t("photo_label")),
          form.photo
            ? e("div",{style:{position:"relative",marginBottom:6}},
                e("img",{src:form.photo,style:{width:"100%",borderRadius:6,maxHeight:130,objectFit:"cover"}}),
                e("button",{
                  onClick:function(){setForm(function(f){return Object.assign({},f,{photo:null});});},
                  style:{position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.55)",border:"none",color:"#fff",borderRadius:"50%",width:22,height:22,cursor:"pointer",fontSize:12,lineHeight:1}
                },"x")
              )
            : null,
          e("button",{
            style:{display:"inline-flex",alignItems:"center",gap:6,fontSize:13,color:T.ink,cursor:"pointer",background:T.paper2,border:"1px solid "+T.border,borderRadius:6,padding:"8px 12px",fontFamily:T.font},
            onClick:function(){takePhoto(function(compressed){setForm(function(f){return Object.assign({},f,{photo:compressed});});});}
          }, 
            e("svg",{width:14,height:14,viewBox:"0 0 24 24",fill:"none",style:{flexShrink:0}},
              e("path",{d:"M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"}),
              e("circle",{cx:"12",cy:"13",r:"4",stroke:"currentColor",strokeWidth:2})
            ),
            form.photo?t("replace_photo"):t("add_photo")
          )
        ),
        e("div",{style:{marginBottom:12}},
          e("label",{style:{fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,display:"block",marginBottom:4}},t("expires_optional")),
          e("input",{type:"datetime-local",style:S.input,value:form.expires_at,
            onChange:function(ev){setForm(function(f){return Object.assign({},f,{expires_at:ev.target.value});});}})
        ),
        e("div",{style:{marginBottom:12}},
          e("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4}},
            e("label",{style:{fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,margin:0}},t("link_trail")),
            e("button",{
              type:"button",
              style:{
                background:"none",border:"none",padding:0,cursor:"pointer",color:T.ink3,
                display:"inline-flex",alignItems:"center",justifyContent:"center",
                opacity:0.7,fontSize:13
              },
              onClick:function(ev){
                ev.preventDefault();
                alert(t("link_trail_help"));
              }
            },"❓")
          ),
          e("select",{
            style:S.input,
            value:form.trail_id || "",
            onChange:function(ev){setForm(function(f){return Object.assign({},f,{trail_id:ev.target.value});});}
          },
            e("option",{value:""},t("none_option")),
            trails.filter(function(t){return t.owner===uname;}).map(function(trail){
              return e("option",{key:trail.id,value:trail.id},trail.name||"Untitled Trail");
            })
          )
        ),
        e("div",{style:{display:"flex",gap:8}},
          e("button",{style:Object.assign({},S.btn,{flex:1,background:"transparent",color:T.ink2,border:"1px solid "+T.border}),onClick:saveDraft},t("form_save_draft_btn")),
          e("button",{style:Object.assign({},S.btn,{flex:2}),onClick:savePin},t("publish_pin"))
        )
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
          user:user,uname:uname,myPins:myPins,checkinsCount:checkins.length,
          userFollows:userFollows,followers:followers,toggleUserFollow:toggleUserFollow,
          loadUserProfile:loadUserProfile,pushEnabled:pushEnabled,setPushEnabled:setPushEnabled,
          focusUserPins:focusUserPins,
          flash:flash,savedPins:savedPins,toggleSavePin:toggleSavePin,setOnboardStep:setOnboardStep,setShowWhatsNew:setShowWhatsNew,setOpen:setOpen,setShowFeatures:setShowFeatures,myProfile:myProfile,setMyProfile:setMyProfile,editingProfile:editingProfile,setEditingProfile:setEditingProfile,profileForm:profileForm,setProfileForm:setProfileForm,saveProfile:saveProfile,setShowImport:setShowImport,
          mapPacks:mapPacks,
          challenges:challenges,
          activeQuestId:activeQuestId,
          setActiveQuestId:setActiveQuestId,
          challengesLoading:challengesLoading,
          allPins:pins,
          checkins:checkins,
          activeMapPack:activeMapPack,
          trails:trails,
          activeTrail:activeTrail,
          onSelectTrail:setActiveTrail,
          onDeleteTrail:handleDeleteTrail,
          onStartTrailRecording:handleStartTrailRecording,
          onImportGPX:handleImportGPX,
          onCreateMapPack:handleCreateMapPack,
          onDeleteMapPack:handleDeleteMapPack,
          onCreateChallenge:handleCreateChallenge,
          onDeleteChallenge:handleDeleteChallenge,
          onSelectMapPack:handleSelectMapPack,
          onSignOut:function(){api.signOut().then(function(){setUser(null);setSplashDone(false);});},
          onDeleteAccount:handleDeleteAccount,
          onGeoJSON:function(){dlFile(toGeoJSON(myPins),"pins.geojson","application/json");},
          onGPX:function(){dlFile(toGPX(myPins),"pins.gpx","application/gpx+xml");},
          onStartOfflineMode:function(){setOpen(false);setOfflineMode(true);},
          onPurgeOfflineTiles:purgeOfflineTiles,
          lang:lang,
          setLang:setLang,
          t:t
        })
        )

      )
    ),

    

    selPin && e("div",{className:"detail pm-detail",style:{position:"absolute",top:"12%",bottom:"calc(68px + env(safe-area-inset-bottom,0px))",left:16,right:16,maxWidth:480,margin:"0 auto",background:"rgba(255,253,248,0.97)",border:"1px solid #d8cfb8",borderRadius:12,padding:"14px 15px",overflowY:"auto",zIndex:1001,boxShadow:"0 8px 32px rgba(0,0,0,0.13)","display":"flex","flexDirection":"column"}},
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

      uname && uname !== "guest" && e("div", {
        style: {
          marginTop: 6,
          marginBottom: 10,
          background: "rgba(42, 93, 60, 0.04)",
          border: "1px solid " + T.borderSoft,
          borderRadius: 10,
          padding: "8px 10px"
        }
      },
        e("div", {style: {fontSize: 10.5, color: T.forest, fontWeight: 700, fontFamily: T.mono, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6}}, "Add to Collections"),
        e("div", {style: {display: "flex", gap: 6, flexWrap: "wrap"}},
          (function() {
            var myPacks = mapPacks.filter(function(g){ return g.owner === uname; });
            if (myPacks.length === 0) {
              return e("div", {style: {fontSize: 12, color: T.ink3}},
                "No collections yet. ",
                e("span", {
                  style: {color: T.forest, textDecoration: "underline", cursor: "pointer", fontWeight: 700},
                  onClick: function() {
                    var name = prompt("Enter a name for your new collection:");
                    if (name && name.trim()) {
                      handleCreateMapPack({
                        id: Math.random().toString(36).slice(2, 10),
                        name: name.trim(),
                        description: "",
                        is_public: true,
                        owner: uname
                      });
                    }
                  }
                }, "Create one")
              );
            }
            return myPacks.map(function(g) {
              var isInPack = selPinMapPackIds.indexOf(g.id) >= 0;
              return e("div", {
                key: g.id,
                style: {
                  fontSize: 11.5,
                  padding: "4px 10px",
                  borderRadius: 14,
                  cursor: "pointer",
                  background: isInPack ? T.forestPale : "transparent",
                  color: isInPack ? T.forest : T.ink3,
                  border: "1px solid " + (isInPack ? T.forest : T.border),
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                },
                onClick: function() {
                  if (isInPack) {
                    api.removePinFromMapPack(g.id, selPin.id).then(function() {
                      setSelPinMapPackIds(function(prev) { return prev.filter(function(id) { return id !== g.id; }); });
                      if (activeMapPack && activeMapPack.id === g.id) {
                        setActiveMapPackPinIds(function(prev) { return prev.filter(function(id) { return id !== selPin.id; }); });
                      }
                      flash("Removed from " + g.name);
                    });
                  } else {
                    api.addPinToMapPack(g.id, selPin.id).then(function() {
                      setSelPinMapPackIds(function(prev) { return prev.concat([g.id]); });
                      if (activeMapPack && activeMapPack.id === g.id) {
                        setActiveMapPackPinIds(function(prev) { return prev.concat([selPin.id]); });
                      }
                      flash("Added to " + g.name);
                    });
                  }
                }
              }, (isInPack ? "✓ " : "＋ ") + g.name);
            });
          })()
        )
      ),

      selPinTrail && e("div", {
        style: {
          marginTop: 6,
          marginBottom: 10,
          background: "rgba(42, 93, 60, 0.04)",
          border: "1px solid " + T.borderSoft,
          borderRadius: 10,
          padding: "10px 12px"
        }
      },
        e("div", {style: {fontSize: 10.5, color: T.forest, fontWeight: 700, fontFamily: T.mono, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6}}, t("linked_trail_title")),
        e("div", {style: {display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8}},
          e("div", {style: {flex: 1, minWidth: 0}},
            e("div", {style: {fontWeight: 600, fontSize: 13, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}, selPinTrail.name || "Untitled Trail"),
            e("div", {style: {fontSize: 11, color: T.ink3, marginTop: 2}},
              Number(selPinTrail.distance_km || 0).toFixed(2) + " km" +
              (selPinTrail.duration_seconds ? " · " + (function(sec){
                var h = Math.floor(sec / 3600);
                var m = Math.floor((sec % 3600) / 60);
                return (h > 0 ? h + "h " : "") + m + "m";
              })(selPinTrail.duration_seconds) : "")
            )
          ),
          e("div", {style: {display: "flex", gap: 6, flexShrink: 0}},
            e("button", {
              style: {
                fontSize: 11,
                padding: "5px 10px",
                borderRadius: 6,
                cursor: "pointer",
                background: activeTrail && activeTrail.id === selPinTrail.id ? T.forest : "transparent",
                color: activeTrail && activeTrail.id === selPinTrail.id ? "#fff" : T.forest,
                border: "1px solid " + T.forest,
                fontWeight: 600
              },
              onClick: function() {
                if (activeTrail && activeTrail.id === selPinTrail.id) {
                  setActiveTrail(null);
                } else {
                  setActiveTrail(selPinTrail);
                }
              }
            }, activeTrail && activeTrail.id === selPinTrail.id ? "Showing" : t("view_trail")),
            (uname && uname !== "guest") && (function() {
              var isSaved = savedTrailIds.indexOf(selPinTrail.id) >= 0;
              return e("button", {
                style: {
                  fontSize: 11,
                  padding: "5px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: isSaved ? T.forestPale : "transparent",
                  color: isSaved ? T.forest : T.ink3,
                  border: "1px solid " + (isSaved ? T.forest : T.border),
                  fontWeight: 600
                },
                onClick: function() {
                  if (isSaved) {
                    api.unsaveTrail(selPinTrail.id, uname).then(function() {
                      setSavedTrailIds(function(prev) { return prev.filter(function(id) { return id !== selPinTrail.id; }); });
                      api.getTrails(uname).then(function(data) { setTrails(data || []); });
                      flash("Trail removed from saves");
                    }).catch(function() { flash("Unsave failed"); });
                  } else {
                    api.saveTrail(selPinTrail.id, uname).then(function() {
                      setSavedTrailIds(function(prev) { return prev.concat([selPinTrail.id]); });
                      api.getTrails(uname).then(function(data) { setTrails(data || []); });
                      flash("Trail saved to profile!");
                    }).catch(function() { flash("Save failed"); });
                  }
                }
              }, isSaved ? "★ " + t("unsave_trail") : "☆ " + t("save_trail"));
            })()
          )
        )
      ),

      e("div",{style:{fontSize:11,color:"#9a8f74",fontFamily:"monospace",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}},
        e("span",null,selPin.lat.toFixed(5)+", "+selPin.lng.toFixed(5)),
        e("span",{style:{color:"#6f786f",fontFamily:"sans-serif",fontWeight:500}}, "📍 " + (selPinCheckinsCount || 0) + " check-in" + (selPinCheckinsCount === 1 ? "" : "s"))
      ),
      e("div",{style:{display:"flex",gap:6,flexWrap:"wrap",marginBottom:4}},
        (uname&&selPin.owner!==uname)&&e(React.Fragment,null,
          e("button",{style:{background:"none",border:"1px solid #d8cfb8",color:"#3c4540",padding:"4px 10px",fontSize:13,cursor:"pointer",borderRadius:10},onClick:function(){toggleUpvote(selPin.id);}},
            (selPin.upvotes&&selPin.upvotes.indexOf(uname)>=0?"* ":"o ")+(selPin.upvotes?selPin.upvotes.length:0)),
          selPin.owner!==uname&&e("button",{
            style:{fontSize:12,padding:"4px 10px",borderRadius:6,cursor:"pointer",fontFamily:"Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
              background:"none",border:"1px solid #d8cfb8",
              color:selPin.saved_by&&selPin.saved_by.indexOf(uname)>=0?"#e65100":"#6f786f"},
            onClick:function(){toggleSavePin(selPin);}
          },selPin.saved_by&&selPin.saved_by.indexOf(uname)>=0?"🔖 Saved":"🔖 Save"),
          (uname&&uname!=="guest"&&selPin.owner!==uname)&&(
            checkins.some(function(c){return c.pin_id===selPin.id;})
              ? e("button",{style:{fontSize:12,padding:"4px 10px",borderRadius:6,border:"1px solid #2a5d3c",background:"#dde6dc",color:"#2a5d3c",cursor:"default"},disabled:true},"✓ Checked In")
              : e("button",{style:{fontSize:12,padding:"4px 10px",borderRadius:6,border:"1px solid #2a5d3c",background:"none",color:"#2a5d3c",cursor:"pointer"},onClick:function(){checkinToPin(selPin);}},"📍 Check In")
          )
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
        },"Open in Maps"),
        e("button",{
          style:{background:"none",border:"1px solid #2a5d3c",color:"#2a5d3c",padding:"4px 10px",cursor:"pointer",fontSize:12,borderRadius:3},
          onClick:function(){setShowCompass(true);}
        },"🧭 Compass")
      ),
      e(Comments,{pinId:selPin.id,uname:uname,pinOwner:selPin.owner,pinName:selPin.name,flash:flash,lang:lang,t:t})
    ),

    showWhatsNew&&e(WhatsNew,{onDismiss:dismissWhatsNew,lang:lang,t:t}),
    showCompass&&e(CompassModal,{pin:selPin,onClose:function(){setShowCompass(false);},flash:flash,lang:lang,t:t}),

    showImport&&e("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:"calc(60px + env(safe-area-inset-bottom,0px))",background:T.paper,zIndex:2000,display:"flex",flexDirection:"column",overflow:"hidden"}},
      // Header
      e("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 22px 16px",borderBottom:"1px solid "+T.borderSoft,flexShrink:0}},
        e("div",{style:{fontSize:19,fontWeight:700,color:T.ink}},"Import Pins"),
        e("button",{style:{width:34,height:34,borderRadius:"50%",background:"rgba(26,32,28,0.08)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
          onClick:function(){setShowImport(false);setImportPreview(null);setImportTags("");setImportColor("#2a5d3c");setImportPrivacy("public");}},
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
        // Step 3: Privacy
        e("div",{style:{marginBottom:20}},
          e("div",{style:{fontSize:10.5,letterSpacing:"0.14em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,fontWeight:600,marginBottom:10}},"Step 3 — Privacy"),
          e("div",{style:{display:"flex",gap:6}},
            ["public","private","insider"].map(function(p){
              return e("button",{key:p,
                style:{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+(importPrivacy===p?T.forest:T.border),
                  background:importPrivacy===p?T.forestPale:"transparent",color:importPrivacy===p?T.forest:T.ink2,
                  fontSize:12,cursor:"pointer",fontWeight:importPrivacy===p?600:400,textTransform:"capitalize"},
                onClick:function(){
                  setImportPrivacy(p);
                  if(p==="insider" && !localStorage.getItem("pm-seen-insider-explainer")){
                    setShowInsiderExplainer(true);
                    localStorage.setItem("pm-seen-insider-explainer","1");
                  }
                }},t("form_privacy_" + p));
            })
          )
        ),
        // Step 4: File
        e("div",{style:{marginBottom:24}},
          e("div",{style:{fontSize:10.5,letterSpacing:"0.14em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,fontWeight:600,marginBottom:10}},"Step 4 — Choose file"),
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

    gpxImportData&&e("div",{style:{
      position:"fixed",inset:0,background:"rgba(26,32,28,0.5)",backdropFilter:"blur(4px)",
      display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:2500,
      padding:"32px 16px 80px",overflowY:"auto",boxSizing:"border-box"
    }},
      e("div",{style:{
        background:T.paper,border:"1px solid "+T.border,borderRadius:18,
        width:"100%",maxWidth:400,padding:20,boxShadow:T.shadowLg,
        animation:"slideUp 0.25s ease-out",boxSizing:"border-box"
      }},
        e("h3",{style:{marginTop:0,marginBottom:14,color:T.ink,fontFamily:T.font,fontSize:18}},t("import_trail_title")),
        e("form",{onSubmit:function(ev){ev.preventDefault(); confirmGpxImport();}},
          // Name
          e("div",{style:{marginBottom:12}},
            e("label",{style:{fontSize:11,fontFamily:T.mono,color:T.ink3,textTransform:"uppercase",display:"block",marginBottom:4}},t("trail_name")),
            e("input",{type:"text",required:true,style:S.input,value:gpxImportName,
              placeholder:t("trail_name_placeholder"),
              onChange:function(e){setGpxImportName(e.target.value);}})
          ),
          // Description
          e("div",{style:{marginBottom:12}},
            e("label",{style:{fontSize:11,fontFamily:T.mono,color:T.ink3,textTransform:"uppercase",display:"block",marginBottom:4}},t("form_label_desc")),
            e("textarea",{rows:3,style:S.textarea,value:gpxImportDesc,
              placeholder:t("trail_desc_placeholder"),
              onChange:function(e){setGpxImportDesc(e.target.value);}})
          ),
          // Color
          e("div",{style:{marginBottom:16}},
            e("label",{style:{fontSize:11,fontFamily:T.mono,color:T.ink3,textTransform:"uppercase",display:"block",marginBottom:6}},t("trail_color")),
            e("div",{style:{display:"flex",gap:8,flexWrap:"wrap"}},
              ["#2a5d3c","#1565c0","#b85c2a","#c62828","#6a1b9a","#00695c","#e65100","#4e342e","#37474f","#f57f17"].map(function(c){
                var isSelected = gpxImportColor === c;
                return e("button",{key:c,type:"button",
                  onClick:function(){setGpxImportColor(c);},
                  style:{width:28,height:28,borderRadius:"50%",backgroundColor:c,
                    border:isSelected?"3px solid "+T.ink:"1px solid rgba(0,0,0,0.15)",
                    transform:isSelected?"scale(1.15)":"none",cursor:"pointer",transition:"all 0.1s ease"}});
              })
            )
          ),
          // Privacy
          e("div",{style:{marginBottom:20}},
            e("label",{style:{fontSize:11,fontFamily:T.mono,color:T.ink3,textTransform:"uppercase",display:"block",marginBottom:6}},t("form_label_visibility")),
            e("div",{style:{display:"flex",gap:6}},
              ["public","private","insider"].map(function(p){
                return e("button",{key:p,type:"button",
                  style:{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+(gpxImportPrivacy===p?T.forest:T.border),
                    background:gpxImportPrivacy===p?T.forestPale:"transparent",color:gpxImportPrivacy===p?T.forest:T.ink2,
                    fontSize:12,cursor:"pointer",fontWeight:gpxImportPrivacy===p?600:400,textTransform:"capitalize"},
                  onClick:function(){
                    setGpxImportPrivacy(p);
                    if(p==="insider" && !localStorage.getItem("pm-seen-insider-explainer")){
                      setShowInsiderExplainer(true);
                      localStorage.setItem("pm-seen-insider-explainer","1");
                    }
                  }},t("form_privacy_" + p));
              })
            )
          ),
          // Actions
          e("div",{style:{display:"flex",gap:10}},
            e("button",{type:"button",style:Object.assign({},S.btnOutline,{flex:1}),
              onClick:function(){setGpxImportData(null);}},t("back")),
            e("button",{type:"submit",style:Object.assign({},S.btn,{flex:2})},t("confirm_import"))
          )
        )
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
            e("div",{style:{fontSize:18,fontWeight:700,color:"#2a5d3c"}},lang === 'es' ? "Todas las funciones" : "All Features"),
            e("div",{style:{fontSize:11,color:"#6f786f"}},"v 1.0.0")
          ),
          e("button",{style:{background:"none",border:"none",fontSize:22,color:"#6f786f",cursor:"pointer"},onClick:function(){setShowFeatures(false);}},"×")
        ),
        e("div",{style:{overflowY:"auto",flex:1,marginBottom:16}},
          getAllFeatures(lang).map(function(item,i){
            var featList = getAllFeatures(lang);
            return e("div",{key:i,style:{display:"flex",gap:12,padding:"10px 0",borderBottom:i<featList.length-1?"1px solid #e8dcc4":"none"}},
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
        },t('got_it'))
      )
    ),
    !showWhatsNew&&onboardStep>=0&&e(Onboarding,{step:onboardStep,onNext:nextOnboard,onSkip:skipOnboard,lang:lang,t:t}),

    showInsiderExplainer && e("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:9100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}},
      e("div",{style:{background:"#f6f1e4",borderRadius:16,padding:"24px 22px",maxWidth:440,width:"100%",boxShadow:"0 8px 40px rgba(0,0,0,0.28)",animation:"slideUp 0.32s cubic-bezier(0.34,1.1,0.64,1) both",display:"flex",flexDirection:"column"}},
        e("div",{style:{display:"flex",alignItems:"center",gap:12,marginBottom:14}},
          e("span",{style:{fontSize:28}},"🕵️"),
          e("div",null,
            e("div",{style:{fontSize:18,fontWeight:700,color:"#2a5d3c"}},"Insider Pins"),
            e("div",{style:{fontSize:12,color:"#6f786f"}},"The Secret Code Feature")
          )
        ),
        e("div",{style:{fontSize:13,color:"#3c4540",lineHeight:1.6,marginBottom:18,maxHeight:"60vh",overflowY:"auto"}},
          e("p",{style:{marginBottom:12}},
            "An ",
            e("strong",null,"Insider Pin"),
            " is completely hidden from public maps, nearby lists, and trending tags by default. It can only be discovered by other users who search for its exact hashtag."
          ),
          e("div",{style:{background:"rgba(42,93,60,0.06)",border:"1px solid #c7dacb",borderRadius:10,padding:12,marginBottom:12}},
            e("div",{style:{fontWeight:700,color:"#2a5d3c",fontSize:12.5,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}},"💡 Creative Ideas:"),
            e("ul",{style:{paddingLeft:16,margin:0,display:"flex",flexDirection:"column",gap:8}},
              e("li",null,
                e("strong",null,"🔑 Secret Communities: "),
                "Share hidden surf spots, fishing spots, or camps only with friends by giving them a specific tag (e.g. #mysecretcove)."
              ),
              e("li",null,
                e("strong",null,"🧭 Scavenger Hunts: "),
                "Set up local exploration games where finding the next pin requires searching for a keyword discovered at the previous spot."
              ),
              e("li",null,
                e("strong",null,"🎉 Pop-up Events: "),
                "Create temporary pins for meetups or exclusive pop-ups where only people 'in the know' can locate the event coordinates."
              )
            )
          ),
          e("p",{style:{margin:0,fontSize:12,fontStyle:"italic",color:"#6f786f"}},
            "Make sure to assign a unique hashtag to this pin so your 'insiders' know what word to search for!"
          )
        ),
        e("button",{
          style:{width:"100%",padding:"12px",background:"#2a5d3c",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"},
          onClick:function(){setShowInsiderExplainer(false);}
        },"I Understand")
      )
    ),

    viewUser&&e("div",{
      style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:2000,display:"flex",alignItems:"flex-end",justifyContent:"center"},
      onClick:function(ev){if(ev.target===ev.currentTarget){setViewUser(null);setUserPins([]);setViewProfile(null);}}
    },
      e("div",{style:{
        background:"#f6f1e4",borderRadius:"20px 20px 0 0",
        width:"100%",maxWidth:500,
        maxHeight:"82vh",
        display:"flex",flexDirection:"column",
        boxShadow:"0 -8px 40px rgba(0,0,0,0.22)",
        animation:"slideUp 0.28s cubic-bezier(0.34,1.1,0.64,1) both",
        paddingBottom:"env(safe-area-inset-bottom,0px)"
      }},

        /* ── Header: gradient banner + avatar row ── */
        e("div",{style:{flexShrink:0,borderRadius:"20px 20px 0 0",position:"relative"}},

          /* Banner */
          e("div",{style:{
            background:"linear-gradient(135deg,#1b4332 0%,#2e7d32 100%)",
            height:100,borderRadius:"20px 20px 0 0",position:"relative"
          }},
            /* Close button top-right inside banner */
            e("button",{
              style:{position:"absolute",top:12,right:12,
                width:32,height:32,borderRadius:"50%",
                background:"rgba(0,0,0,0.25)",border:"none",
                color:"#f6f1e4",fontSize:18,lineHeight:"32px",textAlign:"center",
                cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
              onClick:function(){setViewUser(null);setUserPins([]);setViewProfile(null);}
            },
              e("svg",{width:14,height:14,viewBox:"0 0 24 24",fill:"none"},
                e("path",{d:"M18 6L6 18M6 6l12 12",stroke:"#f6f1e4",strokeWidth:2.5,strokeLinecap:"round"})
              )
            ),

            /* Avatar — absolutely positioned, centred on the banner bottom edge */
            e("div",{style:{
              position:"absolute",bottom:-36,left:18,
              width:72,height:72,borderRadius:"50%",
              border:"3px solid #f6f1e4",overflow:"hidden",
              background:"#e6dfca",flexShrink:0,
              boxShadow:"0 2px 8px rgba(0,0,0,0.18)",
              zIndex:2
            }},
              e("img",{
                src:(viewProfile&&viewProfile.avatar_url)||(viewProfile&&viewProfile.google_avatar)||
                    "https://ui-avatars.com/api/?name="+encodeURIComponent(viewUser)+"&background=2e7d32&color=fff&size=72",
                style:{width:"100%",height:"100%",objectFit:"cover"},
                onError:function(ev){
                  ev.target.src="https://ui-avatars.com/api/?name="+encodeURIComponent(viewUser)+"&background=2e7d32&color=fff&size=72";
                }
              })
            )
          ),

          /* Avatar + Follow row — content area, top padding makes room for the overlapping avatar */
          e("div",{style:{padding:"44px 18px 14px",background:"#f6f1e4"}},
            /* Follow button — floats top-right of content area */
            viewUser!==uname&&e("div",{style:{display:"flex",justifyContent:"flex-end",marginTop:-36,marginBottom:6,gap:8}},
              userFollows.some(function(f){return f.following===viewUser;})&&e("button",{
                style:{
                  fontSize:13,padding:"7px 14px",borderRadius:20,
                  cursor:"pointer",fontWeight:600,
                  fontFamily:"Inter, system-ui, sans-serif",
                  transition:"all 0.15s",
                  background:"transparent",
                  color:"#2a5d3c",
                  border:"1.5px solid #2e7d32",
                  display:"flex",alignItems:"center",gap:4
                },
                onClick:function(){focusUserPins(viewUser);}
              }, e("span",null,"🗺️"), t("show_pins")),
              e("button",{
                style:{
                  fontSize:13,padding:"7px 18px",borderRadius:20,
                  cursor:"pointer",fontWeight:700,
                  fontFamily:"Inter, system-ui, sans-serif",
                  transition:"all 0.15s",
                  background:userFollows.some(function(f){return f.following===viewUser;})?"#2a5d3c":"transparent",
                  color:userFollows.some(function(f){return f.following===viewUser;})?"#fff":"#2a5d3c",
                  border:"1.5px solid #2e7d32"
                },
                onClick:function(){toggleUserFollow(viewUser);}
              }, userFollows.some(function(f){return f.following===viewUser;})?"✓ Following":"+ Follow")
            ),

            /* Name & meta */
            e("div",{style:{fontWeight:700,fontSize:18,color:"#1a201c",letterSpacing:"-0.01em"}},viewUser),
            e("div",{style:{fontSize:12,color:"#6f786f",marginTop:1,fontFamily:"monospace"}},
              "@"+viewUser.toLowerCase().replace(/ /g,".")
            ),
            viewProfile&&viewProfile.location&&e("div",{style:{fontSize:12,color:"#6f786f",marginTop:4,display:"flex",alignItems:"center",gap:4}},
              e("span",null,"📍"),viewProfile.location
            ),
            viewProfile&&viewProfile.bio&&e("div",{style:{fontSize:13,color:"#3a3228",marginTop:8,lineHeight:1.55}},viewProfile.bio),

            /* Social links */
            (viewProfile&&(viewProfile.website||viewProfile.twitter||viewProfile.instagram||viewProfile.youtube))&&
            e("div",{style:{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}},
              viewProfile.website&&e("a",{href:viewProfile.website.startsWith("http")?viewProfile.website:"https://"+viewProfile.website,target:"_blank",rel:"noopener noreferrer",style:{fontSize:11,color:"#2a5d3c",textDecoration:"none",background:"#e8f5e9",padding:"2px 8px",borderRadius:10}},"🌐 "+viewProfile.website.replace(/https?:\/\//,"")),
              viewProfile.twitter&&e("a",{href:"https://twitter.com/"+viewProfile.twitter,target:"_blank",rel:"noopener noreferrer",style:{fontSize:11,color:"#1da1f2",textDecoration:"none",background:"#e8f4fd",padding:"2px 8px",borderRadius:10}},"𝕏 @"+viewProfile.twitter),
              viewProfile.instagram&&e("a",{href:"https://instagram.com/"+viewProfile.instagram,target:"_blank",rel:"noopener noreferrer",style:{fontSize:11,color:"#e1306c",textDecoration:"none",background:"#fce4ec",padding:"2px 8px",borderRadius:10}},"📸 @"+viewProfile.instagram),
              viewProfile.youtube&&e("a",{href:"https://youtube.com/@"+viewProfile.youtube,target:"_blank",rel:"noopener noreferrer",style:{fontSize:11,color:"#ff0000",textDecoration:"none",background:"#fff0f0",padding:"2px 8px",borderRadius:10}},"▶ "+viewProfile.youtube)
            ),

            /* Pin count */
            e("div",{style:{fontSize:11,color:"#9a8f74",marginTop:8,fontFamily:"monospace",letterSpacing:"0.05em"}},
              userPinsLoading?"Loading…":(userPins.length+" public pin"+(userPins.length!==1?"s":""))
            )
          ),

          /* Divider */
          e("div",{style:{height:1,background:"#e6dfca",margin:"0 18px"}})
        ),

        /* ── Pin list ── */
        e("div",{style:{overflowY:"auto",flex:1,padding:"10px 14px 16px"}},
          userPinsLoading&&e("div",{style:{textAlign:"center",padding:28,color:"#9a8f74",fontSize:14}},"Loading pins…"),
          !userPinsLoading&&userPins.length===0&&e("div",{style:{textAlign:"center",padding:28,color:"#9a8f74",fontSize:14}},"No public pins yet."),
          !userPinsLoading&&userPins.map(function(p){
            return e(PinCard,{key:p.id,pin:p,uname:uname,lang:lang,t:t,
              onFocus:function(){setViewUser(null);focusPin(p);},
              onDelete:deletePin,onUpvote:toggleUpvote,onSave:saveToCollection,onViewUser:loadUserProfile});
          })
        )
      )
    ),

    editPin&&e("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}},
      e("div",{style:{background:"#f6f1e4",border:"none",boxShadow:"0 -4px 40px rgba(0,0,0,0.12)",borderRadius:14,padding:"22px 20px",width:"100%",maxWidth:420,boxShadow:"0 8px 40px rgba(0,0,0,0.25)"}},
        e("div",{style:{fontSize:15,fontWeight:700,color:"#1a201c",marginBottom:14}},t("form_title_edit")),
        e("input",{style:Object.assign({},S.input),placeholder:t("form_placeholder_name"),value:editForm.name,onChange:function(ev){setEditForm(function(f){return Object.assign({},f,{name:ev.target.value});});}}),
        e("textarea",{style:Object.assign({},S.input,{height:60,resize:"none"}),placeholder:t("form_placeholder_desc_optional"),value:editForm.description,onChange:function(ev){setEditForm(function(f){return Object.assign({},f,{description:ev.target.value});});}}),
        e("input",{style:Object.assign({},S.input),placeholder:t("form_label_tags"),value:editForm.tags,onChange:function(ev){setEditForm(function(f){return Object.assign({},f,{tags:ev.target.value});});}}),
        e("div",{style:{marginBottom:12}},
          e("div",{style:{fontSize:11,color:"#6f786f",marginBottom:6}},t("form_label_color")),
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
          e("div",{style:{fontSize:11,color:"#6f786f",marginBottom:6}},t("photo_label")),
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
          }, 
            e("svg",{width:14,height:14,viewBox:"0 0 24 24",fill:"none",style:{flexShrink:0}},
              e("path",{d:"M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"}),
              e("circle",{cx:"12",cy:"13",r:"4",stroke:"currentColor",strokeWidth:2})
            ),
            editForm.photo?t("replace_photo"):t("add_photo")
          )
        ),
        e("div",{style:{marginBottom:12}},
          e("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:6}},
            e("div",{style:{fontSize:11,color:"#6f786f",margin:0}},t("link_trail")),
            e("button",{
              type:"button",
              style:{
                background:"none",border:"none",padding:0,cursor:"pointer",color:T.ink3,
                display:"inline-flex",alignItems:"center",justifyContent:"center",
                opacity:0.7,fontSize:13
              },
              onClick:function(ev){
                ev.preventDefault();
                alert(t("link_trail_help"));
              }
            },"❓")
          ),
          e("select",{
            style:Object.assign({},S.input),
            value:editForm.trail_id || "",
            onChange:function(ev){setEditForm(function(f){return Object.assign({},f,{trail_id:ev.target.value});});}
          },
            e("option",{value:""},t("none_option")),
            trails.filter(function(t){return t.owner===uname;}).map(function(trail){
              return e("option",{key:trail.id,value:trail.id},trail.name||"Untitled Trail");
            })
          )
        ),
        e("div",{style:{display:"flex",gap:8}},
          e("button",{style:{flex:1,padding:"9px",background:"none",border:"1px solid #d8cfb8",borderRadius:8,fontSize:13,color:"#6f786f",cursor:"pointer"},onClick:function(){setEditPin(null);}},t("form_cancel_btn")),
          e("button",{style:{flex:2,padding:"9px",background:"#2a5d3c",border:"none",borderRadius:8,fontSize:13,color:"#fff",fontWeight:700,cursor:"pointer"},onClick:saveEdit},t("form_save_changes_btn"))
        )
      )
    ),

    updateReady && e("div",{style:{
      position:"fixed",
      bottom:"calc(80px + env(safe-area-inset-bottom,0px))",
      left:16,right:16,
      maxWidth: 480,
      margin: "0 auto",
      background: "rgba(246, 241, 228, 0.96)",
      backdropFilter: "blur(12px)",
      border: "2px solid #2a5d3c",
      borderRadius: 14,
      padding: "12px 16px",
      display:"flex",alignItems:"center",justifyContent:"space-between",
      zIndex:9999,
      boxShadow:"0 8px 30px rgba(0,0,0,0.15)",
      animation:"slideUp 0.3s cubic-bezier(0.34,1.1,0.64,1) both",
      gap: 12
    }},
      e("div",null,
        e("div",{style:{fontWeight:700,fontSize:14,color:T.forest,marginBottom:2}},t("update_available")),
        e("div",{style:{fontSize:12,color:T.ink2}},
          t("update_ready_msg")
        )
      ),
      e("button",{
        style:{
          background:T.forest,
          color:T.paper,
          border:"none",
          borderRadius:8,
          padding:"8px 16px",
          fontSize:13,
          fontWeight:700,
          cursor:"pointer",
          flexShrink:0,
          boxShadow:T.shadow
        },
        onClick:function(){window.location.reload();}
      },t("reload_btn"))
    ),

    recordingTrail && e(TrailRecorder, {
      isRecording: recordingTrail,
      isPaused: isRecordingPaused,
      distanceKm: recordedDistanceKm,
      durationSec: recordedDurationSec,
      onStart: handleStartTrailRecording,
      onPause: handlePauseTrailRecording,
      onResume: handleResumeTrailRecording,
      onCancel: handleCancelTrailRecording,
      onSave: handleSaveTrailRecording,
      lang: lang,
      t: t
    }),

    activeTrail && e("div", {
      style: {
        position: "absolute",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        background: "rgba(246,241,228,0.95)",
        backdropFilter: "blur(12px)",
        border: "1px solid " + T.border,
        borderRadius: 16,
        padding: "8px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: T.shadow,
        fontFamily: T.font
      }
    },
      e("div", { style: { width: 8, height: 8, borderRadius: "50%", backgroundColor: activeTrail.color || T.forest } }),
      e("div", { style: { fontSize: 13, fontWeight: 600, color: T.ink } }, 
        activeTrail.name + " (" + Number(activeTrail.distance_km || 0).toFixed(2) + " km)"
      ),
      e("button", {
        style: {
          background: "transparent",
          border: "none",
          color: T.ink3,
          cursor: "pointer",
          fontSize: 14,
          padding: "2px 6px"
        },
        onClick: function() { setActiveTrail(null); }
      }, "✕")
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
            e("span",{style:{fontSize:10,fontWeight:isActive?700:500,letterSpacing:"0.14em",textTransform:"uppercase"}},t("tab_" + it.id, it.label)),
            it.id==="mine" && unreadCount>0 && e("div",{style:{position:"absolute",top:8,right:"calc(50% - 18px)",width:6,height:6,borderRadius:"50%",background:"#b85c2a",pointerEvents:"none"}})
          );
        })
      )
    )

  );
}

export default App;
