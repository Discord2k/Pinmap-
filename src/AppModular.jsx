import React, { useState, useEffect, useRef } from 'react';
import { api, sb, subscribeToPush, uploadPhoto, callEdgeFunction, MAPTILER_KEY } from './utils/api';
import { dbGetAll, dbPut, dbDelete, uid, formatLL, tagColor, getPinIcon, distKm, checkBannedTags, userName, userAvatar, dlFile, toGeoJSON, toGPX, WHATSNEW, ONBOARD_KEY, WHATSNEW_KEY, ALL_FEATURES, ONBOARD_STEPS, getOnboardSteps, getWhatsNewList, getAllFeatures, getTutorialSteps } from './utils/helpers';
import { T, S } from './utils/styles';
import { Splash } from './components/Splash';
import { Onboarding } from './components/Onboarding';
import { Comments } from './components/Comments';
import { PinCard } from './components/PinCard';
import { ProfilePanel } from './components/ProfilePanel';
import { MineTab } from './components/MineTab';


import { BottomNav } from './components/ui/BottomNav';

import { NearbyScreen } from './components/screens/NearbyScreen';
import { PinDetailModal } from './components/overlays/PinDetailModal';
import { PhotoModal } from './components/overlays/PhotoModal';

import { AdminPanel } from './components/AdminPanel';
import { WhatsNew } from './components/WhatsNew';
import { CompassModal } from './components/CompassModal';
import { TrailRecorder } from './components/TrailRecorder';
import { LANGUAGES, translations } from './utils/i18n';
import { getBadgesStatus } from './utils/badges';
import JSZip from 'jszip';
import { SearchScreen } from './components/screens/SearchScreen';
import { AddPinForm } from './components/screens/AddPinForm';

var mapObjRef = { current: null };

window.L = {
  point: function(x, y) { return { x: x, y: y }; },
  latLng: function(lat, lng) {
    return {
      lat: lat,
      lng: lng,
      distanceTo: function(other) {
        var a = lat, b = lng, c = other.lat, d = other.lng;
        var R = 6371000; // Earth's radius in meters
        var dL = (c - a) * Math.PI / 180;
        var dl = (d - b) * Math.PI / 180;
        var x = Math.sin(dL/2) * Math.sin(dL/2) + Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) * Math.sin(dl/2) * Math.sin(dl/2);
        return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
      }
    };
  },
  latLngBounds: function(pts) {
    if (!pts || pts.length === 0) {
      return {
        isValid: function() { return false; },
        getSouthWest: function() { return { lat: 0, lng: 0 }; },
        getNorthEast: function() { return { lat: 0, lng: 0 }; }
      };
    }
    var lats = pts.map(function(p){ return p[0]; });
    var lngs = pts.map(function(p){ return p[1]; });
    return {
      isValid: function() { return true; },
      getSouthWest: function() { return { lat: Math.min.apply(null, lats), lng: Math.min.apply(null, lngs) }; },
      getNorthEast: function() { return { lat: Math.max.apply(null, lats), lng: Math.max.apply(null, lngs) }; }
    };
  },
  layerGroup: function(layers) {
    return {
      clearLayers: function() {
        if (layers) {
          layers.forEach(function(l) { if (l && l.remove) l.remove(); });
        }
        if (window._clearMapLibreMarkers) {
          window._clearMapLibreMarkers();
        }
      },
      addTo: function() { return this; },
      remove: function() {
        if (layers) {
          layers.forEach(function(l) { if (l && l.remove) l.remove(); });
        }
      }
    };
  },
  divIcon: function(options) {
    var el = document.createElement('div');
    el.className = options.className || '';
    el.innerHTML = options.html || '';
    if (options.iconSize) {
      el.style.width = options.iconSize[0] + 'px';
      el.style.height = options.iconSize[1] + 'px';
    }
    var anchor = 'center';
    if (options.iconAnchor) {
      if (options.iconAnchor[1] === options.iconSize[1]) {
        anchor = 'bottom';
      }
    }
    return { el: el, anchor: anchor };
  },
  marker: function(latlng, options) {
    var lat = latlng[0];
    var lng = latlng[1];
    var el = options.icon.el;
    var markerInstance = new window.maplibregl.Marker({
      element: el,
      anchor: options.icon.anchor || 'center'
    }).setLngLat([lng, lat]);
    
    markerInstance.on = function(event, cb) {
      if (event === 'click') {
        el.addEventListener('click', function(ev) {
          ev.stopPropagation(); // Prevent click from bubbling to the map
          cb(ev);
        });
      }
      return markerInstance;
    };
    
    var origAddTo = markerInstance.addTo.bind(markerInstance);
    markerInstance.addTo = function(target) {
      if (mapObjRef.current) {
        origAddTo(mapObjRef.current);
      }
      return markerInstance;
    };
    return markerInstance;
  },
  polyline: function(latlngs, options) {
    var id = "poly_" + Math.random().toString(36).slice(2, 10);
    var sourceId = id + "_source";
    var layerId = id + "_layer";
    
    var geojson = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: latlngs.map(function(pt) { return [pt[1], pt[0]]; })
      }
    };
    
    var activeMap = mapObjRef.current;
    if (activeMap) {
      activeMap.addSource(sourceId, {
        type: 'geojson',
        data: geojson
      });
      
      var isDashed = options.dashArray || options.className === "pm-recording-trail-line";
      var paintProps = {
        'line-color': options.color || '#ff0000',
        'line-width': options.weight || 4,
        'line-opacity': options.opacity || 0.8
      };
      if (isDashed) {
        paintProps['line-dasharray'] = [2, 2];
      }
      
      activeMap.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: paintProps
      });
    }
    
    return {
      remove: function() {
        if (activeMap) {
          if (activeMap.getLayer(layerId)) activeMap.removeLayer(layerId);
          if (activeMap.getSource(sourceId)) activeMap.removeSource(sourceId);
        }
      },
      getBounds: function() {
        var lats = latlngs.map(function(p){ return p[0]; });
        var lngs = latlngs.map(function(p){ return p[1]; });
        return {
          isValid: function() { return latlngs.length > 0; },
          getSouthWest: function() { return { lat: Math.min.apply(null, lats), lng: Math.min.apply(null, lngs) }; },
          getNorthEast: function() { return { lat: Math.max.apply(null, lats), lng: Math.max.apply(null, lngs) }; }
        };
      },
      addTo: function(target) {
        return this;
      }
    };
  }
};

var OSM_FALLBACK_STYLE = {
  "version": 8,
  "sources": {
    "osm-raster-tiles": {
      "type": "raster",
      "tiles": [
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      ],
      "tileSize": 256,
      "attribution": "© OpenStreetMap contributors"
    }
  },
  "layers": [
    {
      "id": "osm-raster-tiles",
      "type": "raster",
      "source": "osm-raster-tiles",
      "minzoom": 0,
      "maxzoom": 19
    }
  ]
};

var e = React.createElement;

function App() {
  var mapDiv=useRef(null), mapObj=useRef(null), markers=useRef({}), baseLayers=useRef({}), currentBase=useRef(null), mapLayerRef=useRef("public"), baseLayerRef=useRef("osm"), focusedMarker=useRef(null), focusPinId=useRef(null), is3dRef=useRef(false);
  var [styleLoadCount, setStyleLoadCount] = useState(0);
  var [is3d, setIs3d] = useState(false);
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
  var [mapPackSearch, setMapPackSearch] = useState("");
  var [activitySearch, setActivitySearch] = useState("");
  var [activityFeedFilter, setActivityFeedFilter] = useState(null);
  var [expeditionLog, setExpeditionLog] = useState([]);
  var [expeditionLogLoading, setExpeditionLogLoading] = useState(false);
  var s11=useState(null);    var activeFilter=s11[0];  var setActiveFilter=s11[1];
  var s12=useState({name:"",description:"",url:"",tags:"",privacy:"public",color:"#2a5d3c",icon:"",photo:null,photo_2:null,photo_3:null,trail_id:""}); var form=s12[0]; var setForm=s12[1];
  var s13=useState(null);    var pendingLL=s13[0];     var setPendingLL=s13[1];
  var s14=useState(null);    var selPin=s14[0];        var setSelPin=s14[1];
  var [selPinOwnerProfile, setSelPinOwnerProfile] = useState(null);
  var s21=useState(null);    var editPin=s21[0];       var setEditPin=s21[1];
  var [fullscreenPhoto, setFullscreenPhoto] = useState(null);
  var s22=useState({name:"",description:"",url:"",tags:"",privacy:"public",color:"#2a5d3c",icon:"",photo:null,photo_2:null,photo_3:null,trail_id:""}); var editForm=s22[0]; var setEditForm=s22[1];
  var s15=useState("");      var toast=s15[0];         var setToast=s15[1];
  var s16=useState(null);    var userLL=s16[0];        var setUserLL=s16[1];
  var s17=useState(false);   var locating=s17[0];      var setLocating=s17[1];
  var [followUser, setFollowUser] = useState(false);
  var [gpsTracking, setGpsTracking] = useState(false);
  var gpsWatchIdRef = useRef(null);
  var followUserRef = useRef(false);
  useEffect(function() {
    followUserRef.current = followUser;
    var coneEl = document.getElementById("user-direction-cone");
    if (coneEl) {
      coneEl.style.display = followUser ? "block" : "none";
    }
  }, [followUser]);
  useEffect(function() {
    window._setFollowUser = setFollowUser;
    window._flash = flash;
    return function() {
      window._setFollowUser = null;
      window._flash = null;
    };
  }, []);
  var s18=useState(10);      var nearbyKm=s18[0];      var setNearbyKm=s18[1];
  var s19=useState(null);    var nearbyRes=s19[0];     var setNearbyRes=s19[1];
  var initialTutorial = localStorage.getItem("pm-onboarded-welcome") ? null : "welcome";
  var initialStep = localStorage.getItem("pm-onboarded-welcome") ? -1 : 0;
  var s20=useState(initialStep); var onboardStep=s20[0]; var setOnboardStep=s20[1];
  var sOnboardTutorial=useState(initialTutorial); var onboardTutorial=sOnboardTutorial[0]; var setOnboardTutorial=sOnboardTutorial[1];
  var s38=useState(
    localStorage.getItem(ONBOARD_KEY) && !localStorage.getItem(WHATSNEW_KEY)
  ); var showWhatsNew=s38[0]; var setShowWhatsNew=s38[1];
  var s23=useState("public"); var mapLayer=s23[0]; var setMapLayer=s23[1];
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
  var sCommentsLastCleared=useState(Date.now()); var commentsLastCleared=sCommentsLastCleared[0]; var setCommentsLastCleared=sCommentsLastCleared[1];
  var s41=useState(13); var mapZoom=s41[0]; var setMapZoom=s41[1];
  var s42=useState(null); var installPrompt=s42[0]; var setInstallPrompt=s42[1];
  var s44=useState([]); var userFollows=s44[0]; var setUserFollows=s44[1];
  var sShowCompass=useState(false); var showCompass=sShowCompass[0]; var setShowCompass=sShowCompass[1];
  var sShowAddToCollectionsMenu=useState(false); var showAddToCollectionsMenu=sShowAddToCollectionsMenu[0]; var setShowAddToCollectionsMenu=sShowAddToCollectionsMenu[1];
  var s80=useState([]); var followers=s80[0]; var setFollowers=s80[1];
  var s43=useState(false); var showInstall=s43[0]; var setShowInstall=s43[1];
  var sReadyToShowBanner=useState(false); var readyToShowBanner=sReadyToShowBanner[0]; var setReadyToShowBanner=sReadyToShowBanner[1];
  var s45=useState(false); var pushEnabled=s45[0]; var setPushEnabled=s45[1];
  var s46=useState(null); var notifPin=s46[0]; var setNotifPin=s46[1];
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
  var s54=useState({full_name:"",bio:"",location:"",website:"",twitter:"",instagram:"",youtube:"",avatar_url:""}); var profileForm=s54[0]; var setProfileForm=s54[1];
  var s40=useState({}); var commentCounts=s40[0]; var setCommentCounts=s40[1];
  var s72=useState([]); var newUpvotePinIds=s72[0]; var setNewUpvotePinIds=s72[1];
  var s69=useState(function(){try{return JSON.parse(localStorage.getItem("pm-drafts")||"[]");}catch(e){return [];}}); var drafts=s69[0]; var setDrafts=s69[1];
  var s70=useState(false); var offlineMode=s70[0]; var setOfflineMode=s70[1];
  var [offlineDownloadProgress, setOfflineDownloadProgress] = useState(null);
  var [offlineDownloadTotal, setOfflineDownloadTotal] = useState(null);
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
  var [collabPackIds, setCollabPackIds] = useState([]);
  var [deletedQuestIds, setDeletedQuestIds] = useState(function() {
    try {
      var saved = localStorage.getItem("pinmap_deleted_quests");
      return saved ? JSON.parse(saved) : [];
    } catch(e) {
      return [];
    }
  });

  var [trails, setTrails] = useState([]);
  var [activeTrail, setActiveTrail] = useState(null);
  var [trailInfoExpanded, setTrailInfoExpanded] = useState(false);
  var [showTrailQuestPanel, setShowTrailQuestPanel] = useState(false);
  var [recordingTrail, setRecordingTrail] = useState(false);
  var [isRecordingPaused, setIsRecordingPaused] = useState(false);
  var [recordedPoints, setRecordedPoints] = useState([]);
  var [recordedDistanceKm, setRecordedDistanceKm] = useState(0);
  var [recordedDurationSec, setRecordedDurationSec] = useState(0);
  var [trailsListCollapsed, setTrailsListCollapsed] = useState(true);

  var processedTrails = React.useMemo(function() {
    if (!trails || trails.length === 0) return [];
    var list = trails.slice();
    if (userLL && userLL.lat && userLL.lng) {
      list = list.map(function(t) {
        var minDist = Infinity;
        if (t.coordinates && t.coordinates.length > 0) {
          for (var i = 0; i < t.coordinates.length; i++) {
            var pt = t.coordinates[i];
            var d = distKm(userLL.lat, userLL.lng, pt[0], pt[1]);
            if (d < minDist) minDist = d;
          }
        }
        return Object.assign({}, t, { _distanceKm: minDist });
      });
      list.sort(function(a, b) {
        return a._distanceKm - b._distanceKm;
      });
    }
    return list;
  }, [trails, userLL]);

  var recordingWatchId = useRef(null);
  var recordingTimerId = useRef(null);
  var activeTrailPolyline = useRef(null);
  var recordingTrailPolyline = useRef(null);

  React.useEffect(function(){
    setTrailInfoExpanded(false);
  }, [activeTrail]);

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

  var lastBackPressRef = useRef(0);
  var openViewsRef = useRef({
    showWhatsNew: false,
    onboardStep: -1,
    showFeatures: false,
    showInstall: false,
    editPin: null,
    gpxImportData: null,
    showImport: false,
    editingProfile: false,
    pendingLL: null,
    selPin: null,
    activeMapPack: null,
    viewUser: null,
    showTrailQuestPanel: false,
    layerMenuOpen: false,
    open: false
  });

  useEffect(function() {
    openViewsRef.current = {
      showWhatsNew: showWhatsNew,
      onboardStep: onboardStep,
      showFeatures: showFeatures,
      showInstall: showInstall,
      editPin: editPin,
      gpxImportData: gpxImportData,
      showImport: showImport,
      editingProfile: editingProfile,
      pendingLL: pendingLL,
      selPin: selPin,
      activeMapPack: activeMapPack,
      viewUser: viewUser,
      showTrailQuestPanel: showTrailQuestPanel,
      layerMenuOpen: layerMenuOpen,
      open: open
    };
  }, [
    showWhatsNew, onboardStep, showFeatures, showInstall, editPin,
    gpxImportData, showImport, editingProfile, pendingLL, selPin,
    activeMapPack, viewUser, showTrailQuestPanel, layerMenuOpen, open
  ]);

  var langRef = useRef(lang);
  useEffect(function() {
    langRef.current = lang;
  }, [lang]);

  useEffect(function() {
    // Push initial guard state to history
    window.history.pushState({ noExit: true }, '');

    function handlePopState() {
      var views = openViewsRef.current;
      var hasOpenSubview = 
        views.showWhatsNew || 
        (views.onboardStep >= 0) || 
        views.showFeatures || 
        views.showInstall || 
        views.editPin || 
        views.gpxImportData || 
        views.showImport || 
        views.editingProfile || 
        views.pendingLL || 
        views.selPin || 
        views.activeMapPack || 
        views.viewUser || 
        views.showTrailQuestPanel || 
        views.layerMenuOpen || 
        views.open;

      if (hasOpenSubview) {
        if (views.showWhatsNew) {
          setShowWhatsNew(false);
        } else if (views.onboardStep >= 0) {
          setOnboardStep(-1);
        } else if (views.showFeatures) {
          setShowFeatures(false);
        } else if (views.showInstall) {
          setShowInstall(false);
        } else if (views.editPin) {
          setEditPin(null);
        } else if (views.gpxImportData) {
          setGpxImportData(null);
        } else if (views.showImport) {
          setShowImport(false);
        } else if (views.editingProfile) {
          setEditingProfile(false);
        } else if (views.pendingLL) {
          setPendingLL(null);
        } else if (views.selPin) {
          setSelPin(null);
        } else if (views.activeMapPack) {
          setActiveMapPack(null);
        } else if (views.viewUser) {
          setViewUser(null);
        } else if (views.showTrailQuestPanel) {
          setShowTrailQuestPanel(false);
        } else if (views.layerMenuOpen) {
          setLayerMenuOpen(false);
        } else if (views.open) {
          setOpen(false);
        }
        
        // Re-push the guard state to keep intercepting
        window.history.pushState({ noExit: true }, '');
      } else {
        var now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          // Allow exit
          window.history.back();
        } else {
          lastBackPressRef.current = now;
          var currentLang = langRef.current || 'en';
          var dict = translations[currentLang] || translations.en;
          var msg = dict.toast_press_back_again || "Press back again to exit";
          flash(msg);
          // Re-push the guard state
          window.history.pushState({ noExit: true }, '');
        }
      }
    }

    window.addEventListener('popstate', handlePopState);
    return function() {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  var uname = userName(user);

  function flash(msg) { setToast(msg); setTimeout(function(){setToast("");},3000); }

  // --- REAL-TIME ACHIEVEMENT NOTIFICATION ENGINE ---
  useEffect(function() {
    if (!uname || uname === 'guest') return;
    
    var ownPins = pins.filter(function(p){ return p.owner === uname && !p.saved_from; }).length;
    var ownCheckins = checkins.length;
    var ownTrails = trails.filter(function(t){ return t.owner === uname; }).length;
    var ownMapPacks = mapPacks.filter(function(p){ return p.owner === uname; }).length;
    var ownChallenges = challenges.filter(function(c){ return c.owner === uname; }).length;

    var badgeStatuses = getBadgesStatus(ownPins, ownCheckins, ownTrails, ownMapPacks, ownChallenges, lang);
    var unlocked = badgeStatuses.filter(function(b) { return b.unlocked; }).map(function(b) { return b.id; });
    
    var storedStr = localStorage.getItem("pinmap_unlocked_badges");
    if (storedStr === null) {
      // First time loading - initialize silently
      localStorage.setItem("pinmap_unlocked_badges", JSON.stringify(unlocked));
      return;
    }

    try {
      var acknowledged = JSON.parse(storedStr) || [];
      var newUnlocks = badgeStatuses.filter(function(badge) {
        return badge.unlocked && acknowledged.indexOf(badge.id) < 0;
      });

      if (newUnlocks.length > 0) {
        newUnlocks.forEach(function(badge) {
          var msg = lang === 'es'
            ? `🎉 ¡Logro Desbloqueado: ${badge.emoji} ${badge.title}!`
            : `🎉 Achievement Unlocked: ${badge.emoji} ${badge.title}!`;
          flash(msg);
        });
        localStorage.setItem("pinmap_unlocked_badges", JSON.stringify(unlocked));
      }
    } catch (e) {
      console.error("Error in live achievement tracker:", e);
    }
  }, [pins, checkins, trails, mapPacks, challenges, uname, lang]);

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
    setForm({name:"",description:"",tags:"",privacy:"public",color:"#2a5d3c",icon:"",photo:null,photo_2:null,photo_3:null,expires_at:"",trail_id:""});
    setPendingLL(null);
  }

  // Disable / re-enable map gestures while the reticle is open
  React.useEffect(function(){
    if(!mapObj.current) return;
    var m = mapObj.current;
    if(offlineMode){
      // Initialise reticle to centre 70% of the viewport
      var vw = window.innerWidth, vh = window.innerHeight;
      var rw = Math.round(vw * 0.70), rh = Math.round(vh * 0.54);
      setReticleBox({ top: Math.round((vh-rh)/2), left: Math.round((vw-rw)/2), width: rw, height: rh });
      // Lock the map so touch/scroll gestures don't zoom the whole viewport
      if (m.dragPan) m.dragPan.disable();
      if (m.dragRotate) m.dragRotate.disable();
      if (m.touchZoomRotate) m.touchZoomRotate.disable();
      if (m.doubleClickZoom) m.doubleClickZoom.disable();
      if (m.scrollZoom) m.scrollZoom.disable();
    } else {
      if (m.dragPan) m.dragPan.enable();
      if (m.dragRotate) m.dragRotate.enable();
      if (m.touchZoomRotate) m.touchZoomRotate.enable();
      if (m.doubleClickZoom) m.doubleClickZoom.enable();
      if (m.scrollZoom) m.scrollZoom.enable();
    }
  }, [offlineMode]);

  function downloadOfflineTiles() {
    if(!mapObj.current || !reticleBox) return;
    var packName = window.prompt(lang === 'es' ? "Ingresa un nombre para tu mapa sin conexión:" : "Enter a name for your offline map pack:");
    if(!packName || packName.trim() === "") {
      setOfflineMode(false);
      return;
    }
    packName = packName.trim();
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
           if(baseLayer==="osm") {
             tiles.push("https://tiles.openfreemap.org/planet/v1/"+z+"/"+x+"/"+y+".pbf");
           } else if(baseLayer==="topo") {
             tiles.push("https://a.tile.opentopomap.org/"+z+"/"+x+"/"+y+".png");
           } else if(baseLayer==="trails") {
             tiles.push("https://tiles.openfreemap.org/planet/v1/"+z+"/"+x+"/"+y+".pbf");
             tiles.push("https://tile.waymarkedtrails.org/hiking/"+z+"/"+x+"/"+y+".png");
           } else if(baseLayer==="satellite") {
             tiles.push("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/"+z+"/"+y+"/"+x);
           }
        }
      }
    }
    tiles = tiles.filter(function(v,i,a){return a.indexOf(v)===i;});
    if(tiles.length > 8000) { flash(t("toast_trail_too_large", {count: tiles.length})); setOfflineMode(false); return; }
    
    var packId = "pack_" + Date.now();
    var newPack = {
      id: packId,
      name: packName,
      tileCount: tiles.length,
      bounds: [[llNW.lat, llNW.lng], [llSE.lat, llSE.lng]],
      date: Date.now(),
      baseLayer: baseLayer
    };
    try {
      var packs = JSON.parse(localStorage.getItem("pinmap_offline_packs") || "[]");
      packs.push(newPack);
      localStorage.setItem("pinmap_offline_packs", JSON.stringify(packs));
    } catch(e){}

    setOfflineMode(false);
    flash(t("toast_tiles_downloading", {count: tiles.length}));
    var loaded = 0;
    setOfflineDownloadProgress(0);
    setOfflineDownloadTotal(tiles.length);
    function fetchBatch(idx) {
      if(idx >= tiles.length) { 
        flash(t("toast_tiles_success")); 
        setOfflineDownloadProgress(null);
        setOfflineDownloadTotal(null);
        return; 
      }
      var batch = tiles.slice(idx, idx+20);
      Promise.all(batch.map(function(url){ return fetch(url,{mode:"no-cors"}).catch(function(){}); }))
        .then(function(){
          loaded += batch.length;
          setOfflineDownloadProgress(loaded);
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

  function parseKmlText(text, pins) {
    var parser2 = new DOMParser();
    var doc2 = parser2.parseFromString(text, "text/xml");
    Array.from(doc2.querySelectorAll("Placemark")).forEach(function(pm) {
      var coords = pm.querySelector("Point coordinates, coordinates");
      var n2 = pm.querySelector("name"); var d2 = pm.querySelector("description");
      if (coords) {
        var parts = coords.textContent.trim().split(/[,\s]+/);
        var lng2 = parseFloat(parts[0]), lat2 = parseFloat(parts[1]);
        if (!isNaN(lat2) && !isNaN(lng2))
          pins.push({ name: (n2 && n2.textContent.trim()) || "KML Placemark", description: (d2 && d2.textContent.trim()) || "", lat: lat2, lng: lng2 });
      }
    });
  }

  function parseImportFile(file, onDone) {
    var name = file.name.toLowerCase();

    // KMZ: unzip first, then parse the embedded doc.kml
    if (name.endsWith(".kmz")) {
      JSZip.loadAsync(file).then(function(zip) {
        var kmlFile = null;
        zip.forEach(function(relativePath, zipEntry) {
          if (!kmlFile && relativePath.toLowerCase().endsWith(".kml")) {
            kmlFile = zipEntry;
          }
        });
        if (!kmlFile) { flash("No KML found inside KMZ file"); onDone([]); return; }
        return kmlFile.async("string").then(function(kmlText) {
          var pins = [];
          try { parseKmlText(kmlText, pins); } catch(e) { flash(t("toast_import_error") + e.message); }
          onDone(pins);
        });
      }).catch(function(err) {
        flash(t("toast_import_error") + err.message);
        onDone([]);
      });
      return; // async path — exit early
    }

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
          parseKmlText(text, pins);
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
    Promise.all([dbGetAll("pins"), dbGetAll("comments"), dbGetAll("hunt_activity_logs")]).then(function(r){
      setQueueCount((r[0]||[]).length + (r[1]||[]).length + (r[2]||[]).length);
    });
  },[]);

  // Sync offline queue to Supabase
  function syncOfflineQueue(){
    Promise.all([dbGetAll("pins"), dbGetAll("comments"), dbGetAll("hunt_activity_logs")]).then(function(results){
      var pendingPins = results[0]||[];
      var pendingComments = results[1]||[];
      var pendingLogs = results[2]||[];
      var total = pendingPins.length + pendingComments.length + pendingLogs.length;
      if(!total) return;
      flash(t("toast_syncing_items", {count: total}));
      var pinPromises = pendingPins.map(function(pin){
        return api.insert(pin).then(function(){ return dbDelete("pins", pin.id); });
      });
      var commentPromises = pendingComments.map(function(c){
        return api.addComment(c).then(function(){ return dbDelete("comments", c.id); });
      });
      var logPromises = pendingLogs.map(function(l){
        const prevOnLine = navigator.onLine;
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
        return api.logHuntActivity(l.participant_id, l.step_id, l.activity_type, l.points_awarded)
          .then(function(){ 
            Object.defineProperty(navigator, 'onLine', { value: prevOnLine, configurable: true });
            return dbDelete("hunt_activity_logs", l.id); 
          });
      });
      Promise.all(pinPromises.concat(commentPromises).concat(logPromises)).then(function(){
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
          openNotifPin(Object.assign({}, pin, {_type:latest.type, _message:latest.message}), latest.id, notifs.length);
        } else {
          setNotifPin({id:latest.pin_id, name:latest.pin_name, tags:[], lat:0, lng:0, _noFocus:true, _notifId:latest.id, _remaining:notifs.length, _type:latest.type, _message:latest.message});
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

  function applyStyleWithFallback(map, styleUrlOrObject) {
    if (map._currentStyleUrl === styleUrlOrObject) {
      console.log("Style is already set to:", styleUrlOrObject);
      return;
    }
    if (typeof styleUrlOrObject === 'string' && styleUrlOrObject.startsWith('http')) {
      if (window._ofmFailed) {
        console.log("Using cached fallback style for OpenFreeMap.");
        map._currentStyleUrl = OSM_FALLBACK_STYLE;
        map.setStyle(OSM_FALLBACK_STYLE);
        return;
      }
      var loaded = false;
      var timeoutId = setTimeout(function() {
        if (!loaded) {
          console.warn("Style load timed out, falling back to OSM raster style:", styleUrlOrObject);
          window._ofmFailed = true;
          map._currentStyleUrl = OSM_FALLBACK_STYLE;
          map.setStyle(OSM_FALLBACK_STYLE);
          flash("⚠️ Standard map style took too long to load. Using fallback map.");
        }
      }, 12000); // 12 seconds

      var onLoad = function() {
        loaded = true;
        clearTimeout(timeoutId);
        map._currentStyleUrl = styleUrlOrObject;
        map.off('style.load', onLoad);
      };
      
      var onError = function(e) {
        if (!loaded && e.error && (e.error.message || "").toString().toLowerCase().includes("style")) {
          loaded = true;
          clearTimeout(timeoutId);
          console.warn("Style load failed, falling back to OSM raster style:", styleUrlOrObject, e.error);
          window._ofmFailed = true;
          map._currentStyleUrl = OSM_FALLBACK_STYLE;
          map.setStyle(OSM_FALLBACK_STYLE);
          flash("⚠️ Standard map style failed to load. Using fallback map.");
          map.off('style.load', onLoad);
          map.off('error', onError);
        }
      };

      map.on('style.load', onLoad);
      map.on('error', onError);
    } else {
      map._currentStyleUrl = styleUrlOrObject;
    }
    map.setStyle(styleUrlOrObject);
  }

  // Keep mapLayerRef in sync so marker closures always see current value
  useEffect(function(){ mapLayerRef.current = mapLayer; },[mapLayer]);
  useEffect(function(){ baseLayerRef.current = baseLayer; },[baseLayer]);
  useEffect(function(){ is3dRef.current = is3d; },[is3d]);

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
        var unreadComments = r.data.filter(function(c) {
          var pinSeen = localStorage.getItem("pm-pin-comments-seen-" + name + "-" + c.pin_id);
          if (pinSeen) {
            return new Date(c.created_at) > new Date(pinSeen);
          }
          return true;
        });
        setUnreadCount(unreadComments.length);
        var ids=unreadComments.map(function(c){return c.pin_id;}).filter(function(v,i,a){return a.indexOf(v)===i;});
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
    setCommentsLastCleared(Date.now());
    checkNewComments(pins, uname);
    setNewUpvotePinIds([]);
  }

  function markPinCommentsAsSeen(pinId) {
    if (!uname || uname === "guest") return;
    localStorage.setItem("pm-pin-comments-seen-" + uname + "-" + pinId, new Date().toISOString());
    checkNewComments(pins, uname);
  }

  useEffect(function() {
    if (selPin && selPin.id && selPin.owner === uname) {
      markPinCommentsAsSeen(selPin.id);
    }
  }, [selPin, uname, pins]);
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
    var steps = getTutorialSteps(onboardTutorial || 'welcome', lang);
    if(onboardStep >= steps.length - 1){ 
      if (onboardTutorial) {
        localStorage.setItem("pm-onboarded-" + onboardTutorial, "1");
      }
      localStorage.setItem(ONBOARD_KEY, "1"); 
      setOnboardStep(-1); 
      setOnboardTutorial(null);
      if (onboardTutorial === "welcome") {
        setShowFeatures(true);
      }
    }
    else { setOnboardStep(function(s){return s+1;}); }
  }

  function skipOnboard() { 
    if (onboardTutorial) {
      localStorage.setItem("pm-onboarded-" + onboardTutorial, "1");
    }
    localStorage.setItem(ONBOARD_KEY, "1"); 
    setOnboardStep(-1); 
    setOnboardTutorial(null);
    if (onboardTutorial === "welcome") {
      setShowFeatures(true);
    }
  }

  // Handle manual tutorial resets from profile settings
  useEffect(function() {
    if (onboardStep === 0 && !onboardTutorial) {
      localStorage.removeItem("pm-onboarded-welcome");
      localStorage.removeItem("pm-onboarded-search");
      localStorage.removeItem("pm-onboarded-add");
      localStorage.removeItem("pm-onboarded-mine");
      localStorage.removeItem("pm-onboarded-profile");
      localStorage.removeItem(ONBOARD_KEY);
      setOnboardTutorial("welcome");
    }
  }, [onboardStep, onboardTutorial]);

  // Trigger tutorials contextually when switching tabs
  useEffect(function() {
    if (!splashDone || onboardTutorial) return;

    if (tab === "search" && !localStorage.getItem("pm-onboarded-search")) {
      setOnboardTutorial("search");
      setOnboardStep(0);
    } else if (tab === "add" && !localStorage.getItem("pm-onboarded-add")) {
      setOnboardTutorial("add");
      setOnboardStep(0);
    } else if (tab === "mine" && !localStorage.getItem("pm-onboarded-mine")) {
      setOnboardTutorial("mine");
      setOnboardStep(0);
    } else if (tab === "profile" && !localStorage.getItem("pm-onboarded-profile")) {
      setOnboardTutorial("profile");
      setOnboardStep(0);
    }
  }, [tab, splashDone, onboardTutorial]);

  useEffect(function(){
    api.getSession().then(function(res){
      var session=res.data&&res.data.session;
      if(session&&session.user){ setUser(session.user); setSplashDone(true); setMapLayer("public"); }
      setSessionChecked(true);
    }).catch(function(err){
      console.error("Auth error:", err);
      setSessionChecked(true);
    });
    var sub=api.onAuthChange(function(event,session){
      if(session&&session.user){ setUser(session.user); setSplashDone(true); setMapLayer("public"); }
      else { setUser(null); }
    });
    return function(){ if(sub&&sub.data&&sub.data.subscription) sub.data.subscription.unsubscribe(); };
  },[]);

  useEffect(function(){
    var timer;
    function tryInit(){
      if(!mapDiv.current||!window.maplibregl){timer = setTimeout(tryInit,100);return;}
      if(mapObj.current) return;
      
      var map;
      try {
        var canvas = document.createElement('canvas');
        var supportsWebGL = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        if (!supportsWebGL) {
          throw new Error("WebGL is not supported or is disabled in your browser.");
        }
        var initialStyle = window._ofmFailed ? OSM_FALLBACK_STYLE : "https://tiles.openfreemap.org/styles/liberty";
        map = new window.maplibregl.Map({
          container: mapDiv.current,
          style: initialStyle,
          center: [-98, 39],
          zoom: 4,
          maxZoom: 19,
          maxBounds: [[-179.9, -85], [179.9, 85]],
          antialias: true
        });
        map._currentStyleUrl = initialStyle;

        // Set timeout and error listener for initial load if loading remote style
        if (initialStyle === "https://tiles.openfreemap.org/styles/liberty") {
          var loaded = false;
          var timeoutId = setTimeout(function() {
            if (!loaded) {
              console.warn("Initial style load timed out, falling back to OSM raster style.");
              window._ofmFailed = true;
              map._currentStyleUrl = OSM_FALLBACK_STYLE;
              map.setStyle(OSM_FALLBACK_STYLE);
              flash("⚠️ Standard map style took too long to load. Using fallback map.");
            }
          }, 18000); // 18 seconds

          var onLoad = function() {
            loaded = true;
            clearTimeout(timeoutId);
            map._currentStyleUrl = initialStyle;
            map.off('style.load', onLoad);
          };
          
          var onError = function(e) {
            if (!loaded && e.error && (e.error.message || "").toString().toLowerCase().includes("style")) {
              loaded = true;
              clearTimeout(timeoutId);
              console.warn("Initial style load failed, falling back to OSM raster style.", e.error);
              window._ofmFailed = true;
              map._currentStyleUrl = OSM_FALLBACK_STYLE;
              map.setStyle(OSM_FALLBACK_STYLE);
              flash("⚠️ Standard map style failed to load. Using fallback map.");
              map.off('style.load', onLoad);
              map.off('error', onError);
            }
          };

          map.on('style.load', onLoad);
          map.on('error', onError);
        }
      } catch (err) {
        console.error("MapLibre GL JS init failed:", err);
        flash("❌ Map Error: " + err.message);
        return;
      }
      
      // Monkey-patch Leaflet methods for backwards compatibility
      map.setView = function(latlng, zoom, options) {
        var lat = Array.isArray(latlng) ? latlng[0] : latlng.lat;
        var lng = Array.isArray(latlng) ? latlng[1] : latlng.lng;
        var finalZoom = zoom;
        if (is3dRef.current && finalZoom > 12) {
          finalZoom = 12;
        }
        map.jumpTo({ center: [lng, lat], zoom: finalZoom });
        return map;
      };

      var origPanTo = map.panTo.bind(map);
      map.panTo = function(latlng, options) {
        var lat = Array.isArray(latlng) ? latlng[0] : latlng.lat;
        var lng = Array.isArray(latlng) ? latlng[1] : latlng.lng;
        origPanTo([lng, lat], options);
        return map;
      };
      
      var origFitBounds = map.fitBounds.bind(map);
      map.fitBounds = function(bounds, options) {
        var coords;
        if (bounds && bounds.getNorthEast) {
          var ne = bounds.getNorthEast();
          var sw = bounds.getSouthWest();
          coords = [ [sw.lng, sw.lat], [ne.lng, ne.lat] ];
        } else if (Array.isArray(bounds) && bounds.length === 2 && Array.isArray(bounds[0])) {
          var b0_0 = bounds[0][0];
          var b0_1 = bounds[0][1];
          var b1_0 = bounds[1][0];
          var b1_1 = bounds[1][1];
          coords = [ [b0_1, b0_0], [b1_1, b1_0] ];
        } else {
          coords = bounds;
        }
        if (coords) {
          origFitBounds(coords, options);
        }
        return map;
      };
      
      map.getSize = function() {
        var rect = map.getContainer().getBoundingClientRect();
        return { x: rect.width, y: rect.height };
      };
      
      map.latLngToContainerPoint = function(latlng) {
        var lat = Array.isArray(latlng) ? latlng[0] : latlng.lat;
        var lng = Array.isArray(latlng) ? latlng[1] : latlng.lng;
        var pt = map.project([lng, lat]);
        return pt;
      };
      
      map.containerPointToLatLng = function(point) {
        var x = point.x !== undefined ? point.x : point[0];
        var y = point.y !== undefined ? point.y : point[1];
        var ll = map.unproject([x, y]);
        return { lat: ll.lat, lng: ll.lng };
      };
      
      map.invalidateSize = function() {
        map.resize();
        return map;
      };
      
      // Setup pin layer mocks
      window._clearMapLibreMarkers = function() {
        if (map) {
          try {
            var container = map.getContainer();
            if (container) {
              var markerEls = container.querySelectorAll('.pm-map-pin');
              markerEls.forEach(function(el) {
                var parent = el.closest('.maplibregl-marker');
                if (parent) parent.remove();
                else el.remove();
              });
            }
          } catch(e) {}
        }
        Object.values(markers.current).forEach(function(m){ try{m.remove();}catch(e){} });
        markers.current = {};
      };
      window._pinLayer = {
        clearLayers: function() {
          window._clearMapLibreMarkers();
        },
        addTo: function() { return this; }
      };
 
      mapObjRef.current = map;
 
      // Add navigation controls
      map.addControl(new window.maplibregl.NavigationControl({
        showCompass: true,
        visualizePitch: true
      }), 'bottom-left');
 
      setTimeout(function(){map.resize();},300);
      
      map.on("click",function(ev){
        var target = ev.originalEvent ? ev.originalEvent.target : null;
        if (target && (target.closest('.maplibregl-marker') || target.closest('.maplibregl-ctrl') || target.closest('.leaflet-marker-icon') || target.closest('.pm-pin') || target.closest('.pm-cluster'))) {
          return;
        }
        var latlng = { lat: ev.lngLat.lat, lng: ev.lngLat.lng };
        setPendingLL(latlng);
        setTab("add");
        setOpen(true);
        flash("📍 Location set — fill details in Drop tab");
      });
      map.on("movestart", function(e) {
        if (e.originalEvent) {
          var wasFollowing = followUserRef.current;
          if (wasFollowing) {
            followUserRef.current = false;
            if (window._setFollowUser) window._setFollowUser(false);
            if (window._flash) {
              window._flash(
                React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: "6px" } },
                  "🗺️ Free explore — tap ",
                  React.createElement("svg", { width: 14, height: 14, viewBox: "0 0 24 24", style: { display: "inline-block", verticalAlign: "middle" } },
                    React.createElement("circle", { cx: 12, cy: 12, r: 3, fill: "#2a5d3c" }),
                    React.createElement("circle", { cx: 12, cy: 12, r: 7, stroke: "#2a5d3c", strokeWidth: 1.5, fill: "none" }),
                    React.createElement("path", { d: "M12 2v4M12 18v4M2 12h4M18 12h4", stroke: "#2a5d3c", strokeWidth: 1.5, strokeLinecap: "round" })
                  ),
                  " to re-center"
                )
              );
            }
          }
        }
      });
      map.on("moveend",function(){
        var c = map.getCenter();
        setMapCenter({lat: c.lat, lng: c.lng});
        setMapZoom(map.getZoom());
      });
      
      map.on('style.load', function() {
        if (is3dRef.current) {
          if (!map.getSource('maptiler-dem')) {
            map.addSource('maptiler-dem', {
              type: 'raster-dem',
              tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
              encoding: 'terrarium',
              tileSize: 256,
              minzoom: 0,
              maxzoom: 15
            });
          }
          map.setTerrain({ source: 'maptiler-dem', exaggeration: 1.5 });
        }
        // 3D buildings are injected by a dedicated useEffect below (baseLayer + styleLoadCount)
        if (baseLayerRef.current === "trails") {
          if (!map.getSource('hiking-trails')) {
            map.addSource('hiking-trails', {
              type: 'raster',
              tiles: ['https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png'],
              tileSize: 256
            });
            map.addLayer({
              id: 'hiking-trails-layer',
              type: 'raster',
              source: 'hiking-trails',
              paint: { 'raster-opacity': 0.85 }
            });
          }
        }

        setStyleLoadCount(function(c){ return c + 1; });
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
    return function(){
      if (timer) clearTimeout(timer);
      if (gpsWatchIdRef.current) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
        setGpsTracking(false);
      }
      if (mapObj.current) {
        try { mapObj.current.remove(); } catch(e){}
        mapObj.current = null;
      }
    };
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
      console.error("Error loading pin collections:", err);
    });

    if (uname && uname !== 'guest') {
      api.getMapPacks(uname).then(function(data){
        setMapPacks(data || []);
      }).catch(function(e){ console.warn("Error refreshing mappacks on pin selection:", e); });

      sb.from("mappack_collaborators")
        .select("mappack_id")
        .eq("username", uname)
        .then(function(r) {
          setCollabPackIds((r.data || []).map(function(d) { return d.mappack_id; }));
        }).catch(function(e){ console.warn("Error refreshing collab packs on pin selection:", e); });
    }
  }, [selPin, uname]);

  useEffect(function(){
    if(!selPin) {
      setSelPinOwnerProfile(null);
      return;
    }
    api.getProfile(selPin.owner).then(function(profile){
      setSelPinOwnerProfile(profile);
    }).catch(function(){
      setSelPinOwnerProfile(null);
    });
  }, [selPin]);

  useEffect(function(){
    if (!uname || uname === 'guest') return;
    if (tab === 'profile' || tab === 'search') {
      api.getMapPacks(uname).then(function(data){
        setMapPacks(data || []);
      }).catch(function(e){ console.warn("Error refreshing mappacks on tab switch:", e); });

      sb.from("mappack_collaborators")
        .select("mappack_id")
        .eq("username", uname)
        .then(function(r) {
          setCollabPackIds((r.data || []).map(function(d) { return d.mappack_id; }));
        }).catch(function(e){ console.warn("Error refreshing collab packs on tab switch:", e); });
    }
  }, [tab, uname]);

  useEffect(function(){
    if (searchMode !== "activity") return;
    setExpeditionLogLoading(true);
    var followedUsers = userFollows.map(function(f){ return f.following; });
    var followedTags = follows.map(function(f){ return f.tag; });
    api.getExpeditionLog(followedUsers, followedTags).then(function(log){
      setExpeditionLog(log || []);
      setExpeditionLogLoading(false);
    }).catch(function(err){
      console.error("Error loading expedition log:", err);
      setExpeditionLogLoading(false);
    });
  }, [searchMode, userFollows, follows]);

  useEffect(function(){
    if(!user||!uname||uname==="guest") {
      setCollabPackIds([]);
      return;
    }
    api.getFollows(uname).then(function(data){setFollows(data||[]);}).catch(function(e){console.warn("getFollows error:",e);});
    api.getUserFollows(uname).then(function(data){setUserFollows(data||[]);}).catch(function(e){console.warn("getUserFollows error:",e);});
    api.getFollowers(uname).then(function(data){setFollowers(data||[]);}).catch(function(e){console.warn("getFollowers error:",e);});
    api.getSavedPins(uname).then(function(data){setSavedPins(data||[]);}).catch(function(e){console.warn("getSavedPins error:",e);});
    api.getCheckins(uname).then(function(data){setCheckins(data||[]);}).catch(function(e){console.warn("getCheckins error:",e);});
    api.getMapPacks(uname).then(function(data){setMapPacks(data||[]);}).catch(function(e){console.warn("getMapPacks error:",e);});
    sb.from("mappack_collaborators")
      .select("mappack_id")
      .eq("username", uname)
      .then(function(r) {
        setCollabPackIds((r.data || []).map(function(d) { return d.mappack_id; }));
      }).catch(function(e){ console.warn("getCollabPacks error:", e); });
    api.getTrails(uname).then(function(data){setTrails(data||[]);}).catch(function(e){console.warn("getTrails error:",e);});
    api.getSavedTrailIds(uname).then(function(data){setSavedTrailIds(data||[]);}).catch(function(e){console.warn("getSavedTrailIds error:",e);});
    api.getProfile(uname).then(function(data){
      if(data) {
        setMyProfile(data);
      } else {
        // Auto-create profile row if it doesn't exist yet
        var defaultProfile = {
          id: uname,
          full_name: user.user_metadata && user.user_metadata.full_name ? user.user_metadata.full_name : uname,
          avatar_url: user.user_metadata && user.user_metadata.avatar_url ? user.user_metadata.avatar_url : null,
          updated_at: new Date().toISOString()
        };
        api.upsertProfile(defaultProfile).then(function(r) {
          if (r && !r.error) {
            setMyProfile(defaultProfile);
          }
        });
        // Reset onboarding state so they see the tutorial
        localStorage.removeItem(ONBOARD_KEY);
        setOnboardStep(0);
      }
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
    if (open && tab === "profile" && uname && uname !== 'guest') {
      api.getMapPacks(uname).then(function(data){
        setMapPacks(data || []);
      }).catch(function(e){ console.warn("Error refreshing mappacks on profile open:", e); });
      sb.from("mappack_collaborators")
        .select("mappack_id")
        .eq("username", uname)
        .then(function(r) {
          setCollabPackIds((r.data || []).map(function(d) { return d.mappack_id; }));
        }).catch(function(e){ console.warn("Error refreshing collab packs on profile open:", e); });
    }
  }, [open, tab, uname]);

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
    if(!mapObj.current) return;
    var def = BASE_LAYERS.find(function(b){return b.id===baseLayer;});
    if(!def) return;
    
    var map = mapObj.current;
    var center = map.getCenter();
    var zoom = map.getZoom();
    var pitch = map.getPitch();
    var bearing = map.getBearing();
    
    var layerMaxZoom = baseLayer === "topo" ? 17 : 19;
    map.setMaxZoom(layerMaxZoom);
    if(zoom > layerMaxZoom){
      zoom = layerMaxZoom;
    }

    // Clean up overlays before switching styles/adding overlays
    try {
      if (map.getLayer('hiking-trails-layer')) map.removeLayer('hiking-trails-layer');
      if (map.getSource('hiking-trails')) map.removeSource('hiking-trails');
      if (map.getLayer('cycling-trails-layer')) map.removeLayer('cycling-trails-layer');
      if (map.getSource('cycling-trails')) map.removeSource('cycling-trails');
    } catch(e){}
    
    // Reset OpenFreeMap failure flag on manual style switch so we retry it
    if (baseLayer === "osm" || baseLayer === "trails") {
      window._ofmFailed = false;
    }

    if (baseLayer === "osm") {
      applyStyleWithFallback(map, "https://tiles.openfreemap.org/styles/liberty");
    } else if (baseLayer === "trails") {
      applyStyleWithFallback(map, "https://tiles.openfreemap.org/styles/liberty");
      // Add trails immediately if style is already loaded (otherwise style.load handles it)
      try {
        if (!map.getSource('hiking-trails')) {
          map.addSource('hiking-trails', {
            type: 'raster',
            tiles: ['https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png'],
            tileSize: 256
          });
        }
        if (!map.getLayer('hiking-trails-layer')) {
          map.addLayer({
            id: 'hiking-trails-layer',
            type: 'raster',
            source: 'hiking-trails',
            paint: { 'raster-opacity': 0.85 }
          });
        }
      } catch(e){}
    } else if (baseLayer === "cycling") {
      var cyclingStyle = {
        "version": 8,
        "sources": {
          "cycling-tiles": {
            "type": "raster",
            "tiles": [
              "https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
              "https://b.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
              "https://c.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png"
            ],
            "tileSize": 256,
            "attribution": "© CyclOSM © OpenStreetMap contributors"
          }
        },
        "layers": [
          {
            "id": "cycling-tiles",
            "type": "raster",
            "source": "cycling-tiles",
            "minzoom": 0,
            "maxzoom": 20
          }
        ]
      };
      map.setStyle(cyclingStyle);
      map._currentStyleUrl = cyclingStyle;
    } else if (baseLayer === "satellite") {
      var satelliteStyle = {
        "version": 8,
        "sources": {
          "satellite-tiles": {
            "type": "raster",
            "tiles": [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            ],
            "tileSize": 256,
            "attribution": "© Esri"
          }
        },
        "layers": [
          {
            "id": "satellite-tiles",
            "type": "raster",
            "source": "satellite-tiles",
            "minzoom": 0,
            "maxzoom": 20
          }
        ]
      };
      map.setStyle(satelliteStyle);
      map._currentStyleUrl = satelliteStyle;
    } else if (baseLayer === "topo") {
      var topoStyle = {
        "version": 8,
        "sources": {
          "topo-tiles": {
            "type": "raster",
            "tiles": [
              "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
              "https://b.tile.opentopomap.org/{z}/{x}/{y}.png",
              "https://c.tile.opentopomap.org/{z}/{x}/{y}.png"
            ],
            "tileSize": 256,
            "attribution": "© OpenTopoMap"
          }
        },
        "layers": [
          {
            "id": "topo-tiles",
            "type": "raster",
            "source": "topo-tiles",
            "minzoom": 0,
            "maxzoom": 17
          }
        ]
      };
      map.setStyle(topoStyle);
      map._currentStyleUrl = topoStyle;
    }
    
    // Preserve camera location and orientation across layer switches
    map.jumpTo({
      center: center,
      zoom: zoom,
      pitch: pitch,
      bearing: bearing
    });
  },[baseLayer]);

  // Inject 3D building extrusions whenever satellite style finishes loading.
  // Runs after every style switch (styleLoadCount increments in style.load).
  // Uses direct .pbf tile URLs to avoid async TileJSON fetch delays.
  useEffect(function() {
    var map = mapObj.current;
    if (!map || baseLayer !== 'satellite') return;
    try {
      var sourceId = 'pm-planet';
      if (!map.getSource('pm-planet')) {
        map.addSource('pm-planet', {
          type: 'vector',
          tiles: [
            'https://tiles.openfreemap.org/planet/v1/{z}/{x}/{y}.pbf'
          ],
          minzoom: 0,
          maxzoom: 14
        });
      }
      if (!map.getLayer('pm-3d-buildings')) {
        map.addLayer({
          id: 'pm-3d-buildings',
          type: 'fill-extrusion',
          source: sourceId,
          'source-layer': 'building',
          minzoom: 13,
          paint: {
            'fill-extrusion-color': [
              'interpolate', ['linear'],
              ['coalesce', ['get', 'render_height'], ['get', 'height'], 0],
              0,   '#d4c9b8',
              30,  '#b8ad9a',
              100, '#a89e94',
              300, '#988f84'
            ],
            'fill-extrusion-height': [
              'coalesce', ['get', 'render_height'], ['get', 'height'], 6
            ],
            'fill-extrusion-base': [
              'coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0
            ],
            'fill-extrusion-opacity': 0.85
          }
        });
        console.log('[PINMAP] 3D buildings injected OK');
      }
    } catch(e) {
      console.warn('[PINMAP] 3D buildings inject error:', e.message);
    }
  }, [baseLayer, styleLoadCount]);

  // Re-check comments whenever user, pins or tab changes
  useEffect(function(){
    if(pins.length > 0 && uname && uname !== "guest") checkNewComments(pins, uname);
    // Load comment counts + activity feed when Mine tab opens
    if(tab==="mine" && pins.length>0 && uname && uname!=="guest"){
      var myPinIds=pins.filter(function(p){return p.owner===uname&&!p.saved_from;}).map(function(p){return p.id;});
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
  },[user, pins, tab, uname]);

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
      
      // Solid background line
      var poly = window.L.polyline(latlngs, {
        color: activeTrail.color || "#2a5d3c",
        weight: 6,
        opacity: 0.8,
        lineJoin: 'round'
      });

      // Flowing dashed overlay line (animates along the path)
      var flowPoly = window.L.polyline(latlngs, {
        color: "#ffffff",
        weight: 3.5,
        opacity: 0.65,
        lineJoin: 'round',
        className: "pm-trail-flow"
      });

      var trailGroup = window.L.layerGroup([poly, flowPoly]).addTo(map);
      activeTrailPolyline.current = trailGroup;

      try {
        var bounds = poly.getBounds();
        if (bounds && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch (e) {
        console.error("Error fitting bounds:", e);
      }
    }
  }, [activeTrail, mapObj.current, styleLoadCount]);

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
        dashArray: "6, 12",
        lineJoin: 'round',
        className: "pm-recording-trail-line"
      }).addTo(map);

      recordingTrailPolyline.current = poly;
    }
  }, [recordingTrail, recordedPoints, mapObj.current, styleLoadCount]);

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
    if (window._clearMapLibreMarkers) {
      window._clearMapLibreMarkers();
    } else {
      if (map) {
        try {
          var container = map.getContainer();
          if (container) {
            var markerEls = container.querySelectorAll('.pm-map-pin');
            markerEls.forEach(function(el) {
              var parent = el.closest('.maplibregl-marker');
              if (parent) parent.remove();
              else el.remove();
            });
          }
        } catch(e) {}
      }
      Object.values(markers.current).forEach(function(m){ try{m.remove();}catch(e){} });
      markers.current={};
    }
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
      var bounds = map.getBounds();
      if(bounds) {
        clPins = clPins.filter(function(p){ return bounds.contains([p.lng, p.lat]); });
      }
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
          var icon=window.L.divIcon({className:"pm-pin pm-map-pin",html:'<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.18))"><path d="M14 0 C 6.27 0 0 6.27 0 14 c 0 9.5 14 22 14 22 s 14 -12.5 14 -22 C 28 6.27 21.73 0 14 0 z" fill="'+color+'" stroke="#f6f1e4" stroke-width="1.5"/>'+innerHtml+'</svg>',iconSize:[28,36],iconAnchor:[14,36]});
          var m=window.L.marker([pin.lat,pin.lng],{icon:icon});
          m.on("click",function(){if(!activeMapPack&&pin.owner!==uname&&(mapLayerRef.current==="mine"||mapLayerRef.current==="none"))setMapLayer("public");setSelPin(pin);setOpen(false);if(pin.owner===uname)markCommentsSeen();});
          m.addTo(window._pinLayer); markers.current[pin.id]=m;
        } else {
          var sz=grp.length>99?52:grp.length>9?46:40;
          var cIcon=window.L.divIcon({className:"pm-cluster pm-map-pin",html:'<div style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:'+clrColor+';border:3px solid rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;cursor:pointer;font-size:'+(grp.length>9?12:14)+'px;font-family:Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.3)">'+grp.length+'</div>',iconSize:[sz,sz],iconAnchor:[sz/2,sz/2]});
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
    var bounds = map.getBounds();
    if(bounds) {
      visible = visible.filter(function(p){ return bounds.contains([p.lng, p.lat]); });
    }
    visible.forEach(function(pin){
      var color=pin.color||tagColor(pin.tags&&pin.tags[0]||"x");
      var pinEmoji=getPinIcon(pin.tags);
      var hasEmoji = pinEmoji !== "📍";
      var innerHtml = hasEmoji
        ? '<foreignObject x="3" y="3" width="20" height="20"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:12px;text-align:center;line-height:20px">'+pinEmoji+'</div></foreignObject>'
        : '<circle cx="13" cy="13" r="4" fill="white"/>';
      var icon=window.L.divIcon({
        className:"pm-pin pm-map-pin",
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
  },[pins,activeFilter,mapLayer,uname,mapZoom,mapCenter,styleLoadCount,showExpiringOnly,activeMapPack,activeMapPackPinIds,focusedUser]);

  function requireAuth(cb) { if(!user){api.signInGoogle();return;} cb(); }



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
        flash("🧭 Collection '" + pack.name + "' created!");
      }
    }).catch(function(err) {
      flash("Failed to create collection: " + err.message);
    });
  }

  function handleDeleteMapPack(id) {
    api.deleteMapPack(id).then(function() {
      setMapPacks(function(prev) { return prev.filter(function(p) { return p.id !== id; }); });
      if(activeMapPack && activeMapPack.id === id) {
        setActiveMapPack(null);
        setActiveMapPackPinIds([]);
      }
      flash("Collection deleted.");
    }).catch(function(err) {
      flash("Failed to delete collection: " + err.message);
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
      flash("Collection mode deactivated.");
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
      flash("Failed to load collection pins.");
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
          api.callEdgeFunction("new_follow", {
            targetUser: targetUser,
            followerName: uname
          });
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
    var customIcon = (pin.tags || []).find(function(t) { return t.startsWith("_icon:"); });
    var customIconChar = customIcon ? customIcon.split(":")[1] : "";
    
    var desc = pin.description || "";
    var url = "";
    var lines = desc.split("\n");
    if (lines.length > 0) {
      var lastLine = lines[lines.length - 1].trim();
      var urlRegex = /^(https?:\/\/[^\s]+|www\.[^\s]+)$/i;
      if (urlRegex.test(lastLine)) {
        url = lastLine;
        lines.pop();
        desc = lines.join("\n").trim();
      }
    }

    setEditForm({
      name:pin.name,
      description:desc,
      url:url,
      tags:(pin.tags||[]).filter(function(t){return !t.startsWith("_icon:");}).join(" "),
      privacy:pin.privacy||"public",
      color:pin.color||"#2a5d3c",
      icon:customIconChar,
      photo:pin.photo||null,
      photo_2:pin.photo_2||null,
      photo_3:pin.photo_3||null,
      trail_id:""
    });
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
    
    var uploadOne = function(fieldName, dataVal) {
      if (dataVal && dataVal.startsWith('data:')) {
        return uploadPhoto(dataVal, editPin.id).then(function(url) {
          return {key: fieldName, url: url};
        });
      }
      return Promise.resolve({key: fieldName, url: dataVal});
    };

    var finalTags = tags.filter(function(t){return !t.startsWith("_icon:");});
    if(editForm.icon) {
      finalTags.push("_icon:" + editForm.icon);
    }

    flash("Saving changes...");
    Promise.all([
      uploadOne('photo', editForm.photo),
      uploadOne('photo_2', editForm.photo_2),
      uploadOne('photo_3', editForm.photo_3)
    ]).then(function(results) {
      var urls = {};
      results.forEach(function(r) { urls[r.key] = r.url; });
      
      var finalDesc = editForm.description.trim();
      if (editForm.url && editForm.url.trim()) {
        var formattedUrl = editForm.url.trim();
        if (!/^https?:\/\//i.test(formattedUrl) && !/^www\./i.test(formattedUrl)) {
          formattedUrl = "https://" + formattedUrl;
        }
        finalDesc = finalDesc ? finalDesc + "\n" + formattedUrl : formattedUrl;
      }

      var patch = {
        name: editForm.name.trim(),
        description: finalDesc,
        tags: finalTags,
        privacy: editForm.privacy,
        color: editForm.color,
        photo: urls.photo || null,
        photo_2: urls.photo_2 || null,
        photo_3: urls.photo_3 || null
      };

      api.update(editPin.id, patch, uname).then(function() {
        setPins(function(prev) {
          return prev.map(function(p) {
            return p.id === editPin.id ? Object.assign({}, p, patch) : p;
          });
        });
        
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
      }).catch(function() {
        flash("Update failed");
      });
    }).catch(function(err) {
      console.error("Upload error:", err);
      flash("Photo upload failed");
    });
  }

  function savePin(){
    requireAuth(function(){
      if(!pendingLL){flash("Click the map first");return;}
      if(!form.name.trim()){flash("Name required");return;}
      if(!form.tags.trim()){flash("At least one tag required");return;}
      var tags=form.tags.split(/[\s,]+/).map(function(t){return t.replace(/^#/,"").toLowerCase();}).filter(Boolean);
      var banned=checkBannedTags(tags);
      if(banned.length>0){flash("Tag not allowed: #"+banned.join(", #"));return;}
      
      var finalTags = tags.filter(function(t){return !t.startsWith("_icon:");});
      if(form.icon) {
        finalTags.push("_icon:" + form.icon);
      }

      var finalDesc = form.description.trim();
      if (form.url && form.url.trim()) {
        var formattedUrl = form.url.trim();
        if (!/^https?:\/\//i.test(formattedUrl) && !/^www\./i.test(formattedUrl)) {
          formattedUrl = "https://" + formattedUrl;
        }
        finalDesc = finalDesc ? finalDesc + "\n" + formattedUrl : formattedUrl;
      }

      var pin={
        id:uid(),
        owner:uname,
        name:form.name.trim(),
        description:finalDesc,
        tags:finalTags,
        privacy:form.privacy,
        lat:pendingLL.lat,
        lng:pendingLL.lng,
        photo:form.photo||null,
        photo_2:form.photo_2||null,
        photo_3:form.photo_3||null,
        color:form.color||"#2a5d3c",
        upvotes:[],
        saved_by:[],
        saved_from:null,
        expires_at:form.expires_at?new Date(form.expires_at).toISOString():null
      };

      var uploadOne = function(fieldName, dataVal) {
        if (dataVal && dataVal.startsWith('data:')) {
          return uploadPhoto(dataVal, pin.id).then(function(url) {
            return {key: fieldName, url: url};
          });
        }
        return Promise.resolve({key: fieldName, url: dataVal});
      };

      if(!navigator.onLine){
        // Save to offline queue
        dbPut("pins", Object.assign({}, pin, {_offline:true})).then(function(){
          setPins(function(p){return [Object.assign({},pin,{_offline:true})].concat(p);});
          setQueueCount(function(c){return c+1;});
          setForm({name:"",description:"",url:"",tags:"",privacy:"public",color:"#2a5d3c",icon:"",photo:null,photo_2:null,photo_3:null,expires_at:"",trail_id:""});
          setPendingLL(null);setTab("mine");
          flash("📡 Offline — pin saved locally, will sync when online");
        });
      } else {
        flash("Saving pin...");
        Promise.all([
          uploadOne('photo', form.photo),
          uploadOne('photo_2', form.photo_2),
          uploadOne('photo_3', form.photo_3)
        ]).then(function(results) {
          var urls = {};
          results.forEach(function(r) { urls[r.key] = r.url; });
          
          var pinToSave = Object.assign({}, pin, {
            photo: urls.photo || null,
            photo_2: urls.photo_2 || null,
            photo_3: urls.photo_3 || null
          });

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

            setForm({name:"",description:"",url:"",tags:"",privacy:"public",color:"#2a5d3c",icon:"",photo:null,photo_2:null,photo_3:null,expires_at:"",trail_id:""});
            setPendingLL(null);setTab("mine");flash("Pin saved!");
            if(pinToSave.privacy==="public") {
              callEdgeFunction("new_pin", {pinOwner:uname, pinName:pinToSave.name, pinId:pinToSave.id});
            }
          }).catch(function(){flash("Save failed");});
        }).catch(function(err) {
          console.error("Upload error:", err);
          flash("Photo upload failed");
        });
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
        if(!has && pin.owner !== uname) {
          api.callEdgeFunction("new_upvote", {
            pinOwner: pin.owner,
            upvoterName: uname,
            pinName: pin.name,
            pinId: pin.id
          });
        }
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
          
          var distanceFeet = distanceMeters * 3.28084;
          if(distanceFeet > 100){
            flash("❌ Too far! You must be within 100 feet. You are " + Math.round(distanceFeet) + " ft away.");
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
    var url = "https://nominatim.openstreetmap.org/search?format=json&limit=6&q="+encodeURIComponent(addrSearch);
    if(mapObj.current){
      try {
        var bounds = mapObj.current.getBounds();
        var west = bounds.getWest();
        var south = bounds.getSouth();
        var east = bounds.getEast();
        var north = bounds.getNorth();
        url += "&viewbox=" + west + "," + north + "," + east + "," + south;
      } catch(e) {
        console.error("Error getting map bounds for search biasing:", e);
      }
    }
    fetch(url,{
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
        window._addrMarker=window.L.marker([lat,lng],{
          icon:window.L.divIcon({
            className:"pm-pin",
            html:'<div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center">' +
                 '  <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:rgba(41,121,255,0.25);border:2px solid #2979ff;box-shadow:0 0 8px rgba(41,121,255,0.5);animation:pmpulse 1.8s infinite;top:0;left:0;"></div>' +
                 '  <svg width="24" height="30" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg" style="position:absolute;bottom:8px;left:8px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">' +
                 '    <path d="M14 0 C 6.27 0 0 6.27 0 14 c 0 9.5 14 22 14 22 s 14 -12.5 14 -22 C 28 6.27 21.73 0 14 0 z" fill="#2979ff" stroke="#ffffff" stroke-width="2"/>' +
                 '    <circle cx="14" cy="14" r="5" fill="#ffffff"/>' +
                 '  </svg>' +
                 '  <div style="position:absolute;top:-28px;background:#1565c0;color:#fff;border-radius:6px;padding:3px 8px;font-size:11px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-family:Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;font-weight:600">' + result.display_name.split(",")[0] + '</div>' +
                 '</div>',
            iconSize:[40,40],
            iconAnchor:[20,32]
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
      .map(function(p){return Object.assign({},p,{dist:distKm(userLL.lat,userLL.lng,p.lat,p.lng) * 0.621371});})
      .filter(function(p){return p.dist<=nearbyKm;})
      .sort(function(a,b){return a.dist-b.dist;});
    setNearbyRes(results);
    if(!results.length) flash("No pins within "+nearbyKm+" miles");
  }

  var hasAbsolute = false;
  function handleOrientation(event) {
    var heading = null;
    if (event.type === 'deviceorientationabsolute') {
      hasAbsolute = true;
      if (event.alpha !== null) {
        heading = 360 - event.alpha;
      }
    } else if (event.type === 'deviceorientation') {
      if (hasAbsolute) return;
      if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
        heading = event.webkitCompassHeading;
      } else if (event.alpha !== null) {
        heading = 360 - event.alpha;
      }
    }
    if (heading !== null) {
      window._userHeading = heading;
      var coneEl = document.getElementById("user-direction-cone");
      if (coneEl) {
        coneEl.style.transform = "rotate(" + Math.round(heading) + "deg)";
      }
    }
  }

  function updateUserLocationMarker(lat, lng) {
    if (!window.maplibregl || !mapObj.current) return;
    if (window._userDotMarker) {
      window._userDotMarker.setLngLat([lng, lat]);
      if (window._userHeading !== undefined && window._userHeading !== null) {
        var coneEl = document.getElementById("user-direction-cone");
        if (coneEl) {
          coneEl.style.transform = "rotate(" + Math.round(window._userHeading) + "deg)";
          coneEl.style.display = followUserRef.current ? "block" : "none";
        }
      }
      return;
    }
    var markerEl = document.createElement('div');
    markerEl.style.width = '16px';
    markerEl.style.height = '16px';
    markerEl.style.pointerEvents = 'none';
    markerEl.innerHTML =
      '<div style="position: relative; width: 0px; height: 0px;">' +
      '  <svg id="user-direction-cone" style="position: absolute; width: 100px; height: 100px; left: -50px; top: -50px; transform-origin: 50% 50%; pointer-events: none; transition: transform 0.1s ease-out; display: ' + (followUserRef.current ? 'block' : 'none') + '; transform: rotate(' + (window._userHeading !== undefined ? Math.round(window._userHeading) : 0) + 'deg);" viewBox="0 0 100 100">' +
      '    <defs>' +
      '      <radialGradient id="coneGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">' +
      '        <stop offset="0%" stop-color="#2979ff" stop-opacity="0.4"/>' +
      '        <stop offset="60%" stop-color="#2979ff" stop-opacity="0.15"/>' +
      '        <stop offset="100%" stop-color="#2979ff" stop-opacity="0"/>' +
      '      </radialGradient>' +
      '    </defs>' +
      '    <path d="M 50 50 L 21.13 0 A 50 50 0 0 1 78.87 0 Z" fill="url(#coneGradient)" />' +
      '  </svg>' +
      '  <div style="position: absolute; width: 16px; height: 16px; left: -8px; top: -8px; border-radius: 50%; background: #2979ff; border: 3px solid #fff; box-shadow: 0 0 0 4px rgba(41,121,255,0.25); animation: pmpulse 2s infinite; pointer-events: none;"></div>' +
      '</div>';
    var markerInstance = new window.maplibregl.Marker({
      element: markerEl,
      anchor: 'center'
    }).setLngLat([lng, lat]).addTo(mapObj.current);
    window._userDotMarker = markerInstance;
    window._gpsM = markerInstance;
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
  var myTags=[].concat.apply([],[].map.call(myPins,function(p){return p.tags||[];})).filter(function(t,i,a){return a.indexOf(t)===i && !t.startsWith("_icon:");});

  var BASE_LAYERS = [
    {id:"osm",       label:t("layer_standard", "Standard"),  iconSvg:e("svg",{width:18,height:18,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"},
      e("polygon",{points:"3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"}),
      e("line",{x1:9,y1:3,x2:9,y2:18}),
      e("line",{x1:15,y1:6,x2:15,y2:21})
    ), url:"https://tiles.openfreemap.org/planet/v1/{z}/{x}/{y}.pbf",                                  attr:"© OpenFreeMap © OpenStreetMap contributors"},
    {id:"topo",      label:t("layer_topo", "Topo"),      iconSvg:e("svg",{width:18,height:18,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"},
      e("path",{d:"M2 20h20"}),
      e("path",{d:"M21 20L12 4 3 20"}),
      e("path",{d:"M17 20l-5-8.8-5 8.8"})
    ),  url:"https://a.tile.opentopomap.org/{z}/{x}/{y}.png",                                      attr:"© OpenTopoMap © OpenStreetMap contributors"},
    {id:"satellite", label:t("layer_satellite", "Satellite"), iconSvg:e("svg",{width:18,height:18,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"},
      e("circle",{cx:12,cy:12,r:10}),
      e("path",{d:"M2 12h20"}),
      e("path",{d:"M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"})
    ),  url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",                  attr:"© Esri"},
    {id:"trails",    label:t("layer_trails", "Trails"),    iconSvg:e("svg",{width:18,height:18,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"},
      e("path",{d:"M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"}),
      e("circle",{cx:12,cy:10,r:3})
    ),  url:"https://tiles.openfreemap.org/planet/v1/{z}/{x}/{y}.pbf",                                     attr:"© OpenFreeMap © OpenStreetMap contributors",    overlay:"https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png"},
    {id:"cycling",   label:t("layer_cycling", "Cycling"),   iconSvg:e("svg",{width:18,height:18,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"},
      e("circle",{cx:5.5,cy:17.5,r:3.5}),
      e("circle",{cx:18.5,cy:17.5,r:3.5}),
      e("path",{d:"M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5L9 12H5M12 17.5l3.5-5.5H18m-3-6.5l-4 6.5"})
    ),  url:"https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",                                     attr:"© CyclOSM © OpenStreetMap contributors"}
  ];

  var DEFAULT_TAGS = ["trailhead","pub","murals","geocache","hiking","overlanding","kayaking","fishingspot"];
  var recentTagsSeen = {};
  var recentTags = [];
  var sortedPins = pins.slice().sort(function(a,b){return new Date(b.created_at)-new Date(a.created_at);});
  for(var _i=0; _i<sortedPins.length && recentTags.length<4; _i++){
    (sortedPins[_i].tags||[]).forEach(function(t){
      if(t && !t.startsWith("_icon:") && !recentTagsSeen[t] && recentTags.length<4){ recentTagsSeen[t]=1; recentTags.push(t); }
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

  function renderTagSuggestions(currentVal, updateFn) {
    var parts = (currentVal || "").split(/[\s,]+/);
    var lastPart = parts[parts.length - 1] || "";
    var cleanLast = lastPart.replace(/^#/, "").toLowerCase();
    
    var allExistingTags = [];
    var counts = {};
    pins.forEach(function(p) {
      if (p.tags) {
        p.tags.forEach(function(t) {
          if (t && !t.startsWith("_icon:")) {
            var tl = t.toLowerCase();
            counts[tl] = (counts[tl] || 0) + 1;
            if (allExistingTags.map(function(x){return x.toLowerCase();}).indexOf(tl) === -1) {
              allExistingTags.push(t);
            }
          }
        });
      }
    });

    var typedTags = parts.slice(0, parts.length - 1).map(function(t) {
      return t.replace(/^#/, "").toLowerCase();
    }).filter(Boolean);

    var suggestions = [];
    if (!cleanLast) {
      var sorted = allExistingTags.slice().sort(function(a, b) {
        return (counts[b.toLowerCase()] || 0) - (counts[a.toLowerCase()] || 0);
      });
      suggestions = sorted.filter(function(t) {
        return typedTags.indexOf(t.toLowerCase()) === -1;
      }).slice(0, 5);
    } else {
      suggestions = allExistingTags.filter(function(t) {
        var tl = t.toLowerCase();
        if (tl === cleanLast) return false;
        return (
          tl.indexOf(cleanLast) === 0 || 
          cleanLast.indexOf(tl) === 0 ||
          (tl.endsWith('s') && tl.slice(0, -1) === cleanLast) ||
          (cleanLast.endsWith('s') && cleanLast.slice(0, -1) === tl)
        );
      }).slice(0, 5);
    }

    if (suggestions.length === 0) return null;

    return e("div", {
      style: {
        display: "flex",
        gap: 6,
        overflowX: "auto",
        padding: "4px 0 8px 0",
        marginTop: -6,
        marginBottom: 8,
        WebkitOverflowScrolling: "touch",
        alignItems: "center"
      }
    },
      e("span", {style: {fontSize: 10, color: T.ink3, flexShrink: 0, fontFamily: T.mono, marginRight: 2}}, 
        cleanLast ? "Suggested:" : "Popular:"
      ),
      suggestions.map(function(tag) {
        return e("button", {
          key: tag,
          type: "button",
          style: {
            fontSize: 10.5,
            padding: "3px 8px",
            borderRadius: 10,
            background: T.forestPale,
            color: T.forest,
            border: "1px solid " + T.forest + "25",
            cursor: "pointer",
            flexShrink: 0,
            fontFamily: T.mono,
            transition: "all 0.15s ease"
          },
          onClick: function() {
            var newParts = parts.slice(0, parts.length - 1);
            newParts.push("#" + tag);
            var newVal = newParts.join(" ");
            if (newVal) newVal += " ";
            updateFn(newVal);
          }
        }, "#" + tag);
      })
    );
  }

  if(!sessionChecked||!splashDone){
    return e(Splash,{loading:!sessionChecked,onGoogle:api.signInGoogle,onGuest:function(){setSplashDone(true);},t:t});
  }

  return e("div",{style:{position:"relative",height:"100vh",width:"100%",overflow:"hidden"}},

    e("div",{ref:mapDiv,className:"pm-map-container"+(baseLayer==="satellite"?" pm-map-satellite":""),style:{position:"absolute",top:0,left:0,right:0,bottom:"calc(60px + env(safe-area-inset-bottom,0px))",width:"100%",height:"100%",zIndex:0}}),

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
        e("span",{style:{fontSize:22}},(function(){
          if(notifPin._type === 'upvote' || notifPin._type === 'comment_upvote') return '▲';
          if(notifPin._type === 'follow') return '👤';
          if(notifPin._type === 'collab_invite') return '👥';
          if(notifPin._type === 'comment') return '💬';
          return getPinIcon(notifPin.tags) || '🔔';
        })()),
        e("div",null,
          e("div",{style:{fontWeight:700,fontSize:13}},(function(){
            if(notifPin._message) return notifPin._message;
            if(notifPin._type === 'upvote') return (lang === 'es' ? "▲ Nuevo voto en tu pin" : "▲ New upvote on your pin");
            if(notifPin._type === 'comment_upvote') return (lang === 'es' ? "▲ Nuevo voto en tu comentario" : "▲ New upvote on your comment");
            if(notifPin._type === 'follow') return (lang === 'es' ? "👤 Alguien te ha seguido" : "👤 Someone followed you");
            if(notifPin._type === 'collab_invite') return (lang === 'es' ? "👥 Invitación a colaborar" : "👥 Collaboration invite");
            return (lang === 'es' ? "💬 Nuevo comentario en tu pin" : "💬 New comment on your pin");
          })()),
          e("div",{style:{fontSize:11,color:"rgba(255,255,255,0.7)"}},
            notifPin.name || "",
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
        id:"btn-pin-layer-toggle",
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

      // 2D/3D Terrain Toggle
      e("button",{
        id:"btn-3d-toggle",
        onClick:function(){
          setIs3d(function(prev) {
            var next = !prev;
            if (mapObj.current) {
              if (next) {
                // Enable 3D Terrain
                if (!mapObj.current.getSource('maptiler-dem')) {
                  mapObj.current.addSource('maptiler-dem', {
                    type: 'raster-dem',
                    tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
                    encoding: 'terrarium',
                    tileSize: 256,
                    minzoom: 0,
                    maxzoom: 15
                  });
                }
                mapObj.current.setTerrain({ source: 'maptiler-dem', exaggeration: 1.5 });
                mapObj.current.easeTo({ pitch: 55, bearing: -15, duration: 1000 });
              } else {
                // Disable 3D Terrain
                mapObj.current.easeTo({ pitch: 0, bearing: 0, duration: 600 });
                setTimeout(function() {
                  if (mapObj.current) {
                    mapObj.current.setTerrain(null);
                    mapObj.current.triggerRepaint();
                  }
                }, 600);
              }
            }
            return next;
          });
        },
        style:{width:40,height:40,borderRadius:10,cursor:"pointer",
          background:is3d ? T.forest : "rgba(246,241,228,0.95)",
          backdropFilter:"blur(12px)",
          border:"1px solid "+(is3d ? T.forest : T.border),
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
          boxShadow:T.shadow,gap:2}
      },
        e("span",{style:{fontSize:11,fontWeight:800,color:is3d ? T.paper : T.ink2,lineHeight:1,fontFamily:T.mono}}, is3d ? "3D" : "2D")
      ),

      // Layers button (div wrapper instead of button to prevent HTML validation warning from nested buttons)
      e("div",{
        onClick:function(){
          setLayerMenuOpen(function(v){
            var next = !v;
            if (next) {
              setShowTrailQuestPanel(false);
            }
            return next;
          });
        },
        style:{width:40,height:40,borderRadius:10,
          background:(layerMenuOpen || baseLayer!=="osm")?T.forest:"rgba(246,241,228,0.95)",
          backdropFilter:"blur(12px)",
          border:"1px solid "+((layerMenuOpen || baseLayer!=="osm")?T.forest:T.border),
          display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:T.shadow,
          position:"relative"}
      },
        e("svg",{width:18,height:18,viewBox:"0 0 24 24",fill:"none"},
          e("path",{d:"M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
            stroke:(layerMenuOpen || baseLayer!=="osm")?T.paper:T.ink2,strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"})
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
            return e("button",{key:layer.id,onClick:function(ev){ev.stopPropagation(); switchBaseLayer(layer.id);setLayerMenuOpen(false);},
              style:{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,border:"none",
                background:active?T.forest:"transparent",cursor:"pointer",textAlign:"left",width:"100%"}
            },
              e("span",{style:{width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:active?T.paper:T.ink2}},layer.iconSvg),
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
          onClick:function(){
            setShowTrailQuestPanel(function(v){
              var next = !v;
              if (next) {
                setLayerMenuOpen(false);
              }
              return next;
            });
          },
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
            e("div",{
              style:{display:"flex",alignItems:"center",gap:6,cursor:"pointer",userSelect:"none"},
              onClick:function(){ setTrailsListCollapsed(function(v){return !v;}); }
            },
              e("span",{style:{fontSize:11,color:T.ink3,transform:trailsListCollapsed?"rotate(0deg)":"rotate(90deg)",transition:"transform 0.2s",display:"inline-block"}},"▶"),
              e("div",{style:{fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:700,fontFamily:T.mono,color:T.ink3}},t("trails_routes"))
            ),
            e("button",{
              style:{padding:"4px 10px",borderRadius:6,border:"none",background:T.forest,color:T.paper,fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4},
              onClick:function(){ setShowTrailQuestPanel(false); if(window._startTrailRecording) window._startTrailRecording(); else flash(t("open_profile_to_record")); }
            },
              e("span",{style:{fontSize:8}},"🔴"),
              t("record_btn")
            )
          ),
          !trailsListCollapsed && (
            processedTrails.length===0
              ? e("div",{style:{padding:"10px 14px 12px",fontSize:12,color:T.ink4,fontStyle:"italic"}},t("no_recorded_trails"))
              : e("div",{style:{maxHeight:180,overflowY:"auto"}},
                  processedTrails.slice(0,4).map(function(trail){
                    var isActive = activeTrail && activeTrail.id===trail.id;
                    return e("div",{
                      key:trail.id,
                      style:{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderBottom:"1px solid "+T.borderSoft,cursor:"pointer"},
                      onClick:function(){ setShowTrailQuestPanel(false); setActiveTrail(isActive ? null : trail); }
                    },
                      e("div",{style:{width:7,height:7,borderRadius:"50%",background:trail.color||T.forest,flexShrink:0}}),
                      e("div",{style:{flex:1,minWidth:0}},
                        e("div",{style:{fontSize:12,fontWeight:600,color:T.ink,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},trail.name),
                        e("div",{style:{fontSize:10,color:T.ink4,fontFamily:T.mono}},Number((trail.distance_km||0)*0.621371).toFixed(2)+" mi")
                      ),
                      e("div",{style:{fontSize:10,fontWeight:700,color:isActive?T.forest:T.ink4,flexShrink:0}},isActive?t("active_badge_on"):t("view_label"))
                    );
                  })
                )
          )
        )
      ),

      // Locate / GPS button
      e("button",{
        onClick:function(){
          if(!navigator.geolocation){flash(t("toast_geo_not_supported"));return;}
          
          if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
              .then(function(state) {
                if (state === 'granted') {
                  window.addEventListener('deviceorientation', handleOrientation, true);
                }
              })
              .catch(function(e) { console.error("Orientation permission error", e); });
          } else {
            if (!window._orientationListenerAdded) {
              window._orientationListenerAdded = true;
              window.addEventListener('deviceorientationabsolute', handleOrientation, true);
              window.addEventListener('deviceorientation', handleOrientation, true);
            }
          }

          if (gpsWatchIdRef.current === null) {
            setLocating(true);
            var watchId = navigator.geolocation.watchPosition(
              function(pos) {
                var lat = pos.coords.latitude, lng = pos.coords.longitude;
                setUserLL({lat:lat,lng:lng});
                updateUserLocationMarker(lat, lng);
                setLocating(false);
                if (followUserRef.current) {
                  if (mapObj.current) {
                    mapObj.current.easeTo({ center: [lng, lat], duration: 300 });
                  }
                }
              },
              function(err) {
                setLocating(false);
                flash(t("toast_location_unavailable"));
              },
              {enableHighAccuracy:true,timeout:10000,maximumAge:0}
            );
            gpsWatchIdRef.current = watchId;
            setGpsTracking(true);
            followUserRef.current = true;
            setFollowUser(true);
            flash(
              React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: "6px" } },
                React.createElement("svg", { width: 14, height: 14, viewBox: "0 0 24 24", style: { display: "inline-block", verticalAlign: "middle" } },
                  React.createElement("circle", { cx: 12, cy: 12, r: 3, fill: "#2a5d3c" }),
                  React.createElement("circle", { cx: 12, cy: 12, r: 7, stroke: "#2a5d3c", strokeWidth: 1.5, fill: "none" }),
                  React.createElement("path", { d: "M12 2v4M12 18v4M2 12h4M18 12h4", stroke: "#2a5d3c", strokeWidth: 1.5, strokeLinecap: "round" })
                ),
                " Following your location — map will stay centered"
              )
            );
          } else {
            if (followUser) {
              navigator.geolocation.clearWatch(gpsWatchIdRef.current);
              gpsWatchIdRef.current = null;
              setGpsTracking(false);
              followUserRef.current = false;
              setFollowUser(false);
              setUserLL(null);
              if (window._userDotMarker) {
                try { window._userDotMarker.remove(); } catch(e){}
                window._userDotMarker = null;
                window._gpsM = null;
              }
              flash("⛔ GPS tracking stopped");
            } else {
              followUserRef.current = true;
              setFollowUser(true);
              if (userLL && mapObj.current) {
                mapObj.current.setView([userLL.lat, userLL.lng], 15);
              }
              flash(
                React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: "6px" } },
                  React.createElement("svg", { width: 14, height: 14, viewBox: "0 0 24 24", style: { display: "inline-block", verticalAlign: "middle" } },
                    React.createElement("circle", { cx: 12, cy: 12, r: 3, fill: "#2a5d3c" }),
                    React.createElement("circle", { cx: 12, cy: 12, r: 7, stroke: "#2a5d3c", strokeWidth: 1.5, fill: "none" }),
                    React.createElement("path", { d: "M12 2v4M12 18v4M2 12h4M18 12h4", stroke: "#2a5d3c", strokeWidth: 1.5, strokeLinecap: "round" })
                  ),
                  " Re-centering — following your location again"
                )
              );
            }
          }
        },
        style:{width:40,height:40,borderRadius:10,
          background: gpsTracking && followUser ? T.forest : "rgba(246,241,228,0.95)",
          backdropFilter:"blur(12px)",
          border:"1px solid "+(gpsTracking && !followUser ? T.forest : T.border),
          display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:T.shadow,
          transition:"background 0.2s, border 0.2s"},
        title: !gpsTracking ? "Start GPS Tracking" : (followUser ? "Stop GPS Tracking" : "Recenter on GPS")
      },
        e("svg",{width:18,height:18,viewBox:"0 0 24 24",fill:"none"},
          e("circle",{cx:"12",cy:"12",r:"3",fill: gpsTracking && followUser ? "#fff" : T.forest}),
          e("circle",{cx:"12",cy:"12",r:"7",stroke: gpsTracking && followUser ? "#fff" : T.forest,strokeWidth:1.5,fill:"none"}),
          e("path",{d:"M12 2v4M12 18v4M2 12h4M18 12h4",stroke: gpsTracking ? (followUser ? "#fff" : T.forest) : T.ink2,strokeWidth:1.5,strokeLinecap:"round"})
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
      e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"calc(16px + env(safe-area-inset-top,0px)) 22px 12px",borderBottom:"1px solid #e6dfca",background:"#f6f1e4",flexShrink:0}},
        e("div",{style:{display:"flex",alignItems:"center",gap:8}},
          e("svg",{viewBox:"0 0 64 64",width:24,height:24},
            e("circle",{cx:32,cy:32,r:32,fill:"#2a5d3c"}),
            e("path",{d:"M32 12C23.163 12 16 19.163 16 28c0 13 16 26 16 26s16-13 16-26c0-8.837-7.163-16-16-16z",fill:"#f6f1e4"}),
            e("circle",{cx:32,cy:28,r:7,fill:"#2a5d3c"})
          ),
          e("span",{style:{fontSize:16,fontWeight:800,letterSpacing:3,color:"#2a5d3c"}},"PINMAP")
        ),
        e("div",{style:{display:"flex",alignItems:"center",gap:6}},
          user&&userAvatar(user)?e("img",{src:userAvatar(user),style:{width:22,height:22,borderRadius:"50%",border:"1px solid #d8cfb8"}}):null,
          e("span",{style:{fontSize:12,color:"#7a6a50",background:"#ece4cc",padding:"3px 8px",borderRadius:6,border:"1px solid #d8cfb8",fontWeight:500}},uname),
          !user && e("button",{style:{fontSize:12,background:"#2a5d3c",color:"#fff",border:"none",padding:"4px 10px",borderRadius:6,cursor:"pointer",fontWeight:600},onClick:api.signInGoogle},"Sign in"),
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
          e("div",{
        className: "pm-drawer-content" + (tab === "search" ? " pm-search-tab-content" : ""),
        style: {flex:1,overflowY:"auto"}
      },
        unreadCount>0 && e("div",{
          className: "pm-unread-banner",
          style:{background:"#fffbf0",border:"1px solid #ffc107",borderRadius:8,padding:"10px 12px",display:"flex",alignItems:"center",gap:8,justifyContent:"space-between"}
        },
          e("div",{
            onClick:function(){setTab("mine");},
            style:{cursor:"pointer",display:"flex",alignItems:"center",gap:8,flex:1}
          },
            e("div",{style:{width:8,height:8,borderRadius:"50%",background:"#c62828",flexShrink:0}}),
            e("div",null,
              e("div",{style:{fontSize:17,fontWeight:700,color:"#1a201c"}},"New comments on your pins"),
              e("div",{style:{fontSize:11,color:"#3c4540"}},"Tap to view your pins")
            )
          ),
          e("button",{
            onClick:function(ev){
              ev.stopPropagation();
              markCommentsSeen();
            },
            style:{background:"none",border:"none",color:"#7a6a50",cursor:"pointer",fontSize:18,fontWeight:"bold",padding:"4px 8px"}
          },"×")
        ),


      tab === "search" && e(SearchScreen, {
        searchMode, setSearchMode, searchTag, setSearchTag, questSearch, setQuestSearch,
        trailSearch, setTrailSearch, mapPackSearch, setMapPackSearch, activitySearch, setActivitySearch,
        addrSearch, setAddrSearch, addrResults, setAddrResults, addrLoading, setAddrLoading,
        t, doSearch, doTrailSearch, doAddrSearch, goToAddr, setOpen, 
        challenges, deletedQuestIds, checkins, pins, uname, lang, flash,
        activeQuestId, setActiveQuestId, setDeletedQuestIds, setChallenges,
        setSearchResults, setTrailSearchResults, mapPacks, collabPackIds, activeMapPack,
        handleSelectMapPack, loadUserProfile, expeditionLog, expeditionLogLoading,
        mapObj, setSelPin, setActiveTrail, activeFilter, searchResults, follows, toggleFollow,
        trending, userLL, focusPin, api, trailSearchLoading, trailSearchResults,
        activeTrail, savedTrailIds, setSavedTrailIds, setTrails, setActiveFilter
      }),

      tab==="admin" && uname==="Seth Gray" && e(AdminPanel,{
        uname: uname,
        lang: lang,
        t: t,
        flash: flash,
        setOpen: setOpen,
        focusPin: focusPin,
        loadUserProfile: loadUserProfile,
        focusUserPins: focusUserPins
      }),

      tab==="mine" && e("div",{style:{display:"flex",flexDirection:"column",height:"100%",background:T.paper}},
        e(MineTab,{
          myPins:myPins, myTags:myTags, uname:uname,
          activeFilter:activeFilter, setActiveFilter:setActiveFilter,
          mapObj:mapObj, setSelPin:setSelPin, setOpen:setOpen,
          unreadPinIds:unreadPinIds, commentCounts:commentCounts,
          newUpvotePinIds:newUpvotePinIds, unreadCount:unreadCount,
          deletePin:deletePin, toggleUpvote:toggleUpvote,
          saveToCollection:saveToCollection, loadUserProfile:loadUserProfile,
          markCommentsSeen:markCommentsSeen,
          commentsLastCleared:commentsLastCleared,
          myActivity:myActivity, pins:pins,
          setPins:setPins, flash:flash,
          lang:lang, t:t,
          focusPin:focusPin
        })
      ),


      tab === "add" && e(AddPinForm, {
        pendingLL, setPendingLL, user, api, drafts, setDrafts, setForm, mapObj,
        form, t, saveDraft, trails, uname, savePin, takePhoto,
        setShowInsiderExplainer, renderTagSuggestions
      }),

      tab==="nearby" && e(NearbyScreen, { pins, userLL, t, distKm, getPinIcon, setSelPin, formatLL, follows, mapObj, setOpen, loadUserProfile }),

      tab==="profile" && e("div",null,
        e(ProfilePanel,{
          user:user,uname:uname,myPins:myPins,checkinsCount:checkins.length,
          userFollows:userFollows,followers:followers,toggleUserFollow:toggleUserFollow,
          loadUserProfile:loadUserProfile,pushEnabled:pushEnabled,setPushEnabled:setPushEnabled,
          focusUserPins:focusUserPins,
          flash:flash,savedPins:savedPins,toggleSavePin:toggleSavePin,setOnboardStep:setOnboardStep,setShowWhatsNew:setShowWhatsNew,setOpen:setOpen,setShowFeatures:setShowFeatures,myProfile:myProfile,setMyProfile:setMyProfile,editingProfile:editingProfile,setEditingProfile:setEditingProfile,profileForm:profileForm,setProfileForm:setProfileForm,saveProfile:saveProfile,setShowImport:setShowImport,
          mapPacks:mapPacks,
          collabPackIds:collabPackIds,
          challenges:challenges,
          deletedQuestIds:deletedQuestIds,
          setDeletedQuestIds:setDeletedQuestIds,
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

    

      selPin && !open && e(PinDetailModal, { selPin, setSelPin, uname, api, t, formatLL, distKm, userLL, userFollows, follows, loadUserProfile, setFullscreenPhoto, getPinIcon, tagColor, toggleFollow, checkins, mapPacks, activeMapPack, setSelPinOwnerProfile, selPinOwnerProfile, toggleUserFollow, selPinTrail, activeTrail, setActiveTrail, savedTrailIds, setSavedTrailIds, setTrails, flash, selPinCheckinsCount, toggleUpvote, lang, checkinToPin, openEdit, deletePin, setShowCompass, setShowAddToCollectionsMenu }),

    showWhatsNew&&e(WhatsNew,{onDismiss:dismissWhatsNew,lang:lang,t:t}),
    showCompass&&e(CompassModal,{pin:selPin,onClose:function(){setShowCompass(false);},flash:flash,lang:lang,t:t}),
    showAddToCollectionsMenu && e("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:9100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}},
      e("div",{style:{background:"#f6f1e4",border:"none",borderRadius:16,padding:"24px 22px",maxWidth:400,width:"100%",boxShadow:"0 8px 40px rgba(0,0,0,0.28)",maxHeight:"80vh",display:"flex",flexDirection:"column"}},
        e("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}},
          e("div",null,
            e("div",{style:{fontSize:18,fontWeight:700,color:"#2a5d3c"}}, "Add to Collections"),
            e("div",{style:{fontSize:12,color:"#6f786f"}}, "Add \"" + selPin.name + "\" to your collections")
          ),
          e("button",{style:{background:"none",border:"none",fontSize:22,color:"#6f786f",cursor:"pointer"},onClick:function(){setShowAddToCollectionsMenu(false);}},"×")
        ),
        e("div",{style:{overflowY:"auto",flex:1,marginBottom:16,display:"flex",flexDirection:"column",gap:10}},
          (function() {
            var myPacks = mapPacks.filter(function(g){ return g.owner === uname || collabPackIds.indexOf(g.id) >= 0; });
            if (myPacks.length === 0) {
              return e("div", {style: {fontSize: 13, color: T.ink3, padding: "20px 0", textAlign: "center"}}, "No collections yet.");
            }
            return myPacks.map(function(g) {
              var isInPack = selPinMapPackIds.indexOf(g.id) >= 0;
              return e("div", {
                key: g.id,
                style: {
                  fontSize: 14,
                  padding: "12px 14px",
                  borderRadius: 10,
                  cursor: "pointer",
                  background: isInPack ? T.forestPale : "transparent",
                  color: isInPack ? T.forest : T.ink3,
                  border: "1px solid " + (isInPack ? T.forest : T.border),
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
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
              }, 
                e("span", null, g.name + (g.owner !== uname ? " 👥" : "")),
                e("span", {style:{fontSize:16}}, isInPack ? "✓" : "＋")
              );
            });
          })()
        ),
        e("div",{style:{display:"flex",gap:10}},
          e("button",{
            style:{flex:1,padding:"12px",background:"transparent",border:"1px solid #2a5d3c",borderRadius:10,color:"#2a5d3c",fontSize:13,fontWeight:700,cursor:"pointer"},
            onClick: function() {
              var name = prompt("Enter a name for your new collection:");
              if (name && name.trim()) {
                handleCreateMapPack({
                  id: Math.random().toString(36).slice(2, 10),
                  name: name.trim(),
                  description: "",
                  is_public: false,
                  owner: uname
                });
              }
            }
          }, "＋ Create Collection"),
          e("button",{
            style:{padding:"12px 20px",background:"#2a5d3c",border:"none",borderRadius:10,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"},
            onClick:function(){setShowAddToCollectionsMenu(false);}
          },"Close")
        )
      )
    ),

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
            e("div",{style:{fontSize:12,color:T.ink3}},"KML · KMZ · GPX · GeoJSON · CSV"),
            e("input",{type:"file",accept:".kml,.kmz,.gpx,.geojson,.json,.csv",style:{display:"none"},
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
    !showWhatsNew&&!showFeatures&&!showInsiderExplainer&&onboardStep>=0&&e(Onboarding,{tutorial:onboardTutorial,step:onboardStep,onNext:nextOnboard,onSkip:skipOnboard,lang:lang,t:t}),

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
            e("div",{style:{fontWeight:700,fontSize:18,color:"#1a201c",letterSpacing:"-0.01em"}},(viewProfile && viewProfile.full_name) || viewUser),
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
      e("div",{style:{background:"#f6f1e4",border:"none",boxShadow:"0 -4px 40px rgba(0,0,0,0.12)",borderRadius:14,padding:"22px 20px",width:"100%",maxWidth:420,boxShadow:"0 8px 40px rgba(0,0,0,0.25)",maxHeight:"90vh",overflowY:"auto",boxSizing:"border-box"}},
        e("div",{style:{fontSize:15,fontWeight:700,color:"#1a201c",marginBottom:14}},t("form_title_edit")),
        e("input",{style:Object.assign({},S.input),placeholder:t("form_placeholder_name"),value:editForm.name,onChange:function(ev){setEditForm(function(f){return Object.assign({},f,{name:ev.target.value});});}}),
        e("textarea",{style:Object.assign({},S.input,{height:60,resize:"none"}),placeholder:t("form_placeholder_desc_optional"),value:editForm.description,onChange:function(ev){setEditForm(function(f){return Object.assign({},f,{description:ev.target.value});});}}),
        e("input",{style:Object.assign({},S.input),placeholder:"URL / Link (optional)",value:editForm.url || "",onChange:function(ev){setEditForm(function(f){return Object.assign({},f,{url:ev.target.value});});}}),
        e("input",{style:Object.assign({},S.input),placeholder:t("form_label_tags"),value:editForm.tags,onChange:function(ev){setEditForm(function(f){return Object.assign({},f,{tags:ev.target.value});});}}),
        renderTagSuggestions(editForm.tags, function(newTags) {
          setEditForm(function(f){return Object.assign({},f,{tags:newTags});});
        }, editPin ? editPin.lat : undefined, editPin ? editPin.lng : undefined),
        e("div",{style:{display:"flex",gap:6,marginBottom:12,marginTop:12}},
          ["public","private","insider"].map(function(p){
            return e("button",{key:p,
              style:{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+(editForm.privacy===p?T.forest:T.border),
                background:editForm.privacy===p?T.forestPale:"transparent",color:editForm.privacy===p?T.forest:T.ink2,
                fontSize:12,cursor:"pointer",fontWeight:editForm.privacy===p?600:400,textTransform:"capitalize"},
              onClick:function(){
                setEditForm(function(f){return Object.assign({},f,{privacy:p});});
                if(p==="insider" && !localStorage.getItem("pm-seen-insider-explainer")){
                  setShowInsiderExplainer(true);
                  localStorage.setItem("pm-seen-insider-explainer","1");
                }
              }},t("form_privacy_" + p));
          })
        ),
        e("div",{style:{marginBottom:12}},
          e("div",{style:{fontSize:11,color:"#6f786f",marginBottom:6}}, "Choose icon or click pin to add your own"),
          e("div",{style:{display:"flex",gap:8,alignItems:"center"}},
            e("input",{
              style:Object.assign({},S.input,{width:50,textAlign:"center",fontSize:16,padding:"6px",margin:0}),
              maxLength:2,
              placeholder:getPinIcon(editForm.tags.split(/[\s,]+/).filter(Boolean)),
              value:editForm.icon || "",
              onChange:function(ev){setEditForm(function(f){return Object.assign({},f,{icon:ev.target.value});});}
            }),
            e("div",{style:{display:"flex",gap:4,flexWrap:"wrap",flex:1}},
              ["🥾","⛺","☕","🍺","🚴","🎣","📷","🏔️"].map(function(emoji){
                return e("button",{
                  key:emoji,
                  type:"button",
                  style:{
                    padding:"5px 8px",borderRadius:6,border:"1px solid "+(editForm.icon===emoji?T.forest:T.border),
                    background:editForm.icon===emoji?T.forestPale:"#efe9d8",fontSize:13,cursor:"pointer"
                  },
                  onClick:function(){setEditForm(function(f){return Object.assign({},f,{icon:emoji});});}
                }, emoji);
              }),
              editForm.icon && e("button",{
                type:"button",
                style:{padding:"5px 8px",borderRadius:6,border:"1px solid "+T.border,background:"#fff",fontSize:11,cursor:"pointer",color:"#c05050"},
                onClick:function(){setEditForm(function(f){return Object.assign({},f,{icon:""});});}
              }, "Reset")
            )
          )
        ),
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
        e("div",{style:{marginBottom:16}},
          e("div",{style:{fontSize:11,color:"#6f786f",marginBottom:6}},t("photo_label")),
          e("div",{style:{display:"flex",gap:8,alignItems:"center"}},
            [1, 2, 3].map(function(idx) {
              var fieldName = idx === 1 ? 'photo' : 'photo_' + idx;
              var photoVal = editForm[fieldName];
              if (photoVal) {
                return e("div",{key:idx,style:{position:"relative",width:68,height:68,borderRadius:8,overflow:"hidden",border:"1px solid "+T.border,flexShrink:0}},
                  e("img",{src:photoVal,style:{width:"100%",height:"100%",objectFit:"cover"}}),
                  e("button",{
                    type:"button",
                    onClick:function(){setEditForm(function(f){var patch={};patch[fieldName]=null;return Object.assign({},f,patch);});},
                    style:{position:"absolute",top:2,right:2,background:"rgba(0,0,0,0.6)",border:"none",color:"#fff",borderRadius:"50%",width:16,height:16,cursor:"pointer",fontSize:10,lineHeight:"14px",display:"flex",alignItems:"center",justifyContent:"center"}
                  },"x")
                );
              } else {
                return e("button",{
                  key:idx,
                  type:"button",
                  style:{width:68,height:68,borderRadius:8,border:"1px dashed "+T.border,background:"#efe9d8",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#3c4540",gap:4,flexShrink:0},
                  onClick:function(){takePhoto(function(compressed){setEditForm(function(f){var patch={};patch[fieldName]=compressed;return Object.assign({},f,patch);});});}
                },
                  e("svg",{width:16,height:16,viewBox:"0 0 24 24",fill:"none"},
                    e("path",{d:"M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"}),
                    e("circle",{cx:"12",cy:"13",r:"4",stroke:"currentColor",strokeWidth:2})
                  ),
                  e("span",{style:{fontSize:8.5,fontWeight:600}},t("add_photo"))
                );
              }
            })
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
        onClick:function(){
          if (navigator.serviceWorker) {
            navigator.serviceWorker.getRegistration().then(function(reg) {
              if (reg && reg.waiting) {
                reg.waiting.postMessage({ action: 'skipWaiting' });
              } else {
                window.location.reload();
              }
            }).catch(function() {
              window.location.reload();
            });
          } else {
            window.location.reload();
          }
        }
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

    activeTrail && !open && e("div", {
      style: {
        position: "absolute",
        top: "calc(76px + env(safe-area-inset-top, 0px))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        background: "rgba(246,241,228,0.95)",
        backdropFilter: "blur(12px)",
        border: "1px solid " + T.border,
        borderRadius: 16,
        padding: "8px 14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 6,
        boxShadow: T.shadow,
        fontFamily: T.font,
        width: "90%",
        maxWidth: 320,
        boxSizing: "border-box"
      }
    },
      e("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          userSelect: "none"
        },
        onClick: function() { setTrailInfoExpanded(!trailInfoExpanded); }
      },
        e("div", { style: { width: 8, height: 8, borderRadius: "50%", backgroundColor: activeTrail.color || T.forest, flexShrink: 0 } }),
        e("div", { style: { fontSize: 13, fontWeight: 700, color: T.ink, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, 
          activeTrail.name
        ),
        e("div", { style: { fontSize: 11, fontFamily: T.mono, color: T.ink3, flexShrink: 0 } },
          Number((activeTrail.distance_km || 0) * 0.621371).toFixed(2) + " mi"
        ),
        e("span", { style: { fontSize: 10, color: T.ink3, marginLeft: 4, flexShrink: 0 } },
          trailInfoExpanded ? "▲" : "▼"
        ),
        e("button", {
          style: {
            background: "transparent",
            border: "none",
            color: T.ink3,
            cursor: "pointer",
            fontSize: 14,
            padding: "2px 6px",
            marginLeft: 6,
            flexShrink: 0
          },
          onClick: function(e) { e.stopPropagation(); setActiveTrail(null); }
        }, "✕")
      ),
      trailInfoExpanded && e("div", {
        style: {
          borderTop: "1px dashed " + T.border,
          paddingTop: 8,
          marginTop: 2,
          display: "flex",
          flexDirection: "column",
          gap: 6
        }
      },
        activeTrail.description && e("div", {
          style: {
            fontSize: 12.5,
            color: T.ink2,
            fontStyle: "italic",
            lineHeight: 1.4
          }
        }, activeTrail.description),
        e("div", {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 11,
            color: T.ink3
          }
        },
          activeTrail.duration_seconds > 0 && e("span", null, 
            "⏱️ " + (function(secs) {
              if (!secs) return "";
              var h = Math.floor(secs / 3600);
              var m = Math.floor((secs % 3600) / 60);
              var s = secs % 60;
              if (h > 0) return h + "h " + m + "m";
              if (m > 0) return m + "m " + s + "s";
              return s + "s";
            })(activeTrail.duration_seconds)
          ),
          activeTrail.owner && e("span", { style: { marginLeft: "auto" } }, 
            "👤 @" + activeTrail.owner
          )
        ),
        activeTrail.pin_id && e("button", {
          style: Object.assign({}, S.miniBtn, {
            width: "100%",
            justifyContent: "center",
            background: T.forestPale,
            color: T.forest,
            border: "none",
            padding: "5px",
            fontSize: 11.5,
            marginTop: 4
          }),
          onClick: function() {
            var matchingPin = pins.find(function(p) { return p.id === activeTrail.pin_id; });
            if (matchingPin) {
              focusPin(matchingPin);
            } else {
              flash("Linked pin not found on map");
            }
          }
        }, "📍 Focus Linked Pin")
      )
    ),

    fullscreenPhoto && e(PhotoModal, { fullscreenPhoto, setFullscreenPhoto, t }),

    offlineDownloadProgress !== null && offlineDownloadTotal !== null && e("div",{style:{position:"absolute",bottom:90,left:"50%",transform:"translateX(-50%)",background:T.paper,border:"1px solid "+T.borderSoft,padding:"12px 16px",borderRadius:16,zIndex:1001,boxShadow:S.shadow1,width:240,display:"flex",flexDirection:"column",gap:8}},
      e("div",{style:{fontSize:13,fontWeight:700,color:T.ink,textAlign:"center"}}, lang==='es'?'Descargando mapa...':'Downloading map pack...'),
      e("div",{style:{height:6,background:T.forestPale,borderRadius:3,overflow:"hidden"}},
        e("div",{style:{height:"100%",background:T.forest,width:Math.min(100, (offlineDownloadProgress/offlineDownloadTotal*100))+"%",transition:"width 0.2s ease"}})
      ),
      e("div",{style:{fontSize:11,color:T.ink3,textAlign:"center",fontFamily:T.mono}}, offlineDownloadProgress + " / " + offlineDownloadTotal + " " + (lang==='es'?'teselas':'tiles'))
    ),

    toast&&e("div",{className:"pm-toast",style:{position:"absolute",bottom:18,left:"50%",transform:"translateX(-50%)",background:"rgba(255,253,248,0.97)",border:"1px solid #d8cfb8",color:"#2a5d3c",padding:"7px 16px",borderRadius:20,fontSize:13,zIndex:1002,whiteSpace:"nowrap",boxShadow:"0 2px 12px rgba(0,0,0,0.1)"}},toast),

    e(BottomNav, { uname, open, tab, setOpen, setTab, t, unreadCount })

  );
}

export default App;
