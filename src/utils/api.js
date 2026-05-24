import { createClient } from '@supabase/supabase-js';

const SB_URL = "https://uuxggoydnjvsssbenkkt.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1eGdnb3lkbmp2c3NzYmVua2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwODg4OTgsImV4cCI6MjA5MjY2NDg5OH0.VniG6qm6Z9spdezyw-85k4liEuyC9i3B_T2Pxo-9nK0";
export const sb = createClient(SB_URL, SB_KEY);

function sbWithUser(uname) {
  return sb;
}

function uid() { return Math.random().toString(36).slice(2,10); }

export const api = {
  list:           function()           { return sb.from("pins").select("*").order("created_at",{ascending:false}).then(function(r){return r.data||[];}); },
  insert:         function(pin)        { return sb.from("pins").insert(pin).select().then(function(r){return r.data;}); },
  update:         function(id,p,uname) { return sbWithUser(uname).from("pins").update(p).eq("id",id).then(function(r){return r.data;}); },
  upvotePin:      function(id,upvotes)  { return sb.from("pins").update({upvotes:upvotes}).eq("id",id); },
  savePin:        function(id,savedBy)  { return sb.from("pins").update({saved_by:savedBy}).eq("id",id); },
  getSavedPins:   function(uname)       { return sb.from("pins").select("*").contains("saved_by",[uname]).then(function(r){return r.data||[];}); },
  getCheckins:    function(visitor)     { return sb.from("checkins").select("*").eq("visitor",visitor).then(function(r){return r.data||[];}); },
  checkin:        function(pinId,visitor,lat,lng){ return sb.from("checkins").insert({pin_id:pinId,visitor:visitor,lat:lat,lng:lng}).select().then(function(r){return r.data[0];}); },
  getPinCheckinsCount: function(pinId)  { return sb.from("checkins").select("*", { count: "exact", head: true }).eq("pin_id", pinId).then(function(r){return r.count||0;}); },
  deleteExpired:  function()            { return sb.from("pins").delete().lt("expires_at",new Date().toISOString()).not("expires_at","is",null); },
  remove:         function(id,uname)   { return sbWithUser(uname).from("pins").delete().eq("id",id); },
  search:         function(tag)        { return sb.from("pins").select("*").contains("tags",[tag]).in("privacy",["public","insider"]).then(function(r){return r.data||[];}); },
  getComments:    function(pinId)      { return sb.from("comments").select("*").eq("pin_id",pinId).order("created_at",{ascending:true}).then(function(r){return r.data||[];}); },
  upvoteComment:  function(id,upvotes) { return sb.from("comments").update({upvotes:upvotes}).eq("id",id); },
  addComment:     async function(c)    {
    if (c.photo_url && c.photo_url.startsWith("data:")) {
      try {
        var uploadedUrl = await uploadJournalPhoto(c.photo_url, c.pin_id);
        c.photo_url = uploadedUrl;
      } catch (e) {
        console.error("Failed to upload offline journal photo", e);
      }
    }
    return sb.from("comments").insert(c).select().then(function(r){return r.data;});
  },
  deleteComment:  function(id,uname)   { return sbWithUser(uname).from("comments").delete().eq("id",id); },
  signInGoogle:   function()            { return sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin+window.location.pathname}}); },
  signOut:        function()            { return sb.auth.signOut(); },
  getSession:     function()            { return sb.auth.getSession(); },
  onAuthChange:   function(cb)          { return sb.auth.onAuthStateChange(cb); },
  getFollows:     function(owner)       { return sb.from("follows").select("*").eq("owner",owner).then(function(r){return r.data||[];}); },
  follow:         function(id,owner,tag){ return sb.from("follows").insert({id:id,owner:owner,tag:tag}).select().then(function(r){return r.data;}); },
  unfollow:       function(id,owner)    { return sbWithUser(owner).from("follows").delete().eq("id",id); },
  getUserFollows:   function(owner)        { return sb.from("user_follows").select("*").eq("owner",owner).then(function(r){return r.data||[];}); },
  getFollowers:     function(uname)        { return sb.from("user_follows").select("*").eq("following",uname).then(function(r){return r.data||[];}); },
  getNotifications: function(owner)       { return sb.from("notifications").select("*").eq("owner",owner).eq("seen",false).order("created_at",{ascending:false}).then(function(r){return r.data||[];}); },
  getProfile:      function(id)          { return sb.from("profiles").select("*").eq("id",id).single().then(function(r){return r.data||null;}); },
  upsertProfile:   function(profile)     {
    return sb.from("profiles").upsert(profile, { onConflict: 'id' }).select().then(function(r) {
      if (!r.error && (!r.data || r.data.length === 0)) {
        return { error: { message: "Permission denied or row not found. Please check your SQL Row Level Security (RLS) policies for the profiles table." }, data: null };
      }
      return r;
    });
  },
  markNotifSeen:    function(id)          { return sb.from("notifications").update({seen:true}).eq("id",id); },
  markAllNotifSeen: function(owner)       { return sb.from("notifications").update({seen:true}).eq("owner",owner).eq("seen",false); },
  deleteOldNotifs:  function(owner)       { 
    var cutoff = new Date(Date.now()-7*24*60*60*1000).toISOString();
    return sb.from("notifications").delete().eq("owner",owner).eq("seen",true).lt("created_at",cutoff);
  },
  followUser:      function(id,owner,following){ return sb.from("user_follows").insert({id:id,owner:owner,following:following}).select().then(function(r){return r.data;}); },
  unfollowUser:    function(id,owner)         { return sbWithUser(owner).from("user_follows").delete().eq("id",id); },
  getTrending:    function(){
    var since=new Date(Date.now()-7*24*60*60*1000).toISOString();
    return sb.from("pins").select("tags").eq("privacy","public").gte("created_at",since).then(function(r){
      var counts={};
      (r.data||[]).forEach(function(p){(p.tags||[]).forEach(function(t){counts[t]=(counts[t]||0)+1;});});
      var result=[];
      Object.keys(counts).forEach(function(k){result.push({tag:k,count:counts[k]});});
      result.sort(function(a,b){return b.count-a.count;});
      return result.slice(0,10);
    });
  },
  deleteAccount: function() {
    return sb.rpc("delete_own_account");
  },
  getMapPacks: async function(uname) {
    if (!uname || uname === 'guest') {
      return sb.from("mappacks").select("*").eq("is_public", true).order("created_at", {ascending: false}).then(function(r){
        if (r.error) throw r.error;
        return r.data||[];
      });
    }
    try {
      var colRes = await sb.from("mappack_collaborators").select("mappack_id").eq("username", uname);
      var colIds = (colRes.data || []).map(function(d) { return d.mappack_id; });
      var query = sb.from("mappacks").select("*");
      if (colIds.length > 0) {
        var idList = colIds.map(function(id) { return `"${id}"`; }).join(",");
        query = query.or(`is_public.eq.true,owner.eq."${uname}",id.in.(${idList})`);
      } else {
        query = query.or(`is_public.eq.true,owner.eq."${uname}"`);
      }
      return query.order("created_at", {ascending: false}).then(function(r){
        if (r.error) throw r.error;
        return r.data||[];
      });
    } catch(e) {
      console.error("Error in getMapPacks:", e);
      return sb.from("mappacks").select("*").or(`is_public.eq.true,owner.eq."${uname}"`).order("created_at", {ascending: false}).then(function(r){
        if (r.error) throw r.error;
        return r.data||[];
      });
    }
  },
  createMapPack: function(pack) {
    return sb.from("mappacks").insert(pack).select().then(function(r){
      if (r.error) throw r.error;
      return r.data;
    });
  },
  deleteMapPack: function(id) {
    return sb.from("mappacks").delete().eq("id", id).then(function(r){
      if (r.error) throw r.error;
      return r.data;
    });
  },
  getMapPackPins: function(packId) {
    return sb.from("mappack_pins").select("pin_id").eq("mappack_id", packId).then(function(r){
      if (r.error) throw r.error;
      return (r.data||[]).map(function(d){return d.pin_id;});
    });
  },
  addPinToMapPack: function(packId, pinId) {
    return sb.from("mappack_pins").insert({mappack_id: packId, pin_id: pinId}).then(function(r){
      if (r.error) throw r.error;
      return r.data;
    });
  },
  removePinFromMapPack: function(packId, pinId) {
    return sb.from("mappack_pins").delete().eq("mappack_id", packId).eq("pin_id", pinId).then(function(r){
      if (r.error) throw r.error;
      return r.data;
    });
  },
  getChallenges: function() {
    return sb.from("challenges").select("*").not("owner", "eq", "system").order("created_at", {ascending: true}).then(function(r){
      if (r.error) throw r.error;
      return r.data||[];
    });
  },
  createChallenge: function(challenge) {
    return sb.from("challenges").insert(challenge).select().then(function(r){
      if (r.error) throw r.error;
      return r.data;
    });
  },
  deleteChallenge: function(id) {
    return sb.from("challenges").delete().eq("id", id).then(function(r){
      if (r.error) throw r.error;
      return r.data;
    });
  },
  getTrails: async function(uname) {
    if (!uname || uname === 'guest') {
      return sb.from("trails").select("*").eq("owner", "guest").order("created_at", {ascending: false}).then(function(r){
        if (r.error) throw r.error;
        return r.data||[];
      });
    }
    try {
      var savedRes = await sb.from("saved_trails").select("trail_id").eq("owner", uname);
      var savedIds = (savedRes.data || []).map(function(d) { return d.trail_id; });
      var query = sb.from("trails").select("*");
      if (savedIds.length > 0) {
        var idList = savedIds.map(function(id) { return `"${id}"`; }).join(",");
        query = query.or(`owner.eq."${uname}",id.in.(${idList})`);
      } else {
        query = query.eq("owner", uname);
      }
      return query.order("created_at", {ascending: false}).then(function(r) {
        if (r.error) throw r.error;
        return r.data || [];
      });
    } catch (e) {
      console.error("Error in getTrails:", e);
      return sb.from("trails").select("*").eq("owner", uname).order("created_at", {ascending: false}).then(function(r) {
        if (r.error) return [];
        return r.data || [];
      });
    }
  },
  createTrail: function(trail) {
    return sb.from("trails").insert(trail).select().then(function(r){
      if (r.error) throw r.error;
      return r.data;
    });
  },
  deleteTrail: function(id) {
    return sb.from("trails").delete().eq("id", id).then(function(r){
      if (r.error) throw r.error;
      return r.data;
    });
  },
  linkTrailToPin: function(trailId, pinId) {
    return sb.from("trails").update({pin_id: pinId}).eq("id", trailId).then(function(r){
      if (r.error) throw r.error;
      return r.data;
    });
  },
  saveTrail: function(trailId, uname) {
    return sb.from("saved_trails").insert({trail_id: trailId, owner: uname}).then(function(r){
      if (r.error) throw r.error;
      return r.data;
    });
  },
  unsaveTrail: function(trailId, uname) {
    return sb.from("saved_trails").delete().eq("trail_id", trailId).eq("owner", uname).then(function(r){
      if (r.error) throw r.error;
      return r.data;
    });
  },
  getSavedTrailIds: function(uname) {
    if (!uname || uname === 'guest') return Promise.resolve([]);
    return sb.from("saved_trails").select("trail_id").eq("owner", uname).then(function(r){
      if (r.error) {
        console.warn("Could not load saved trail IDs:", r.error.message);
        return [];
      }
      return (r.data || []).map(function(item) { return item.trail_id; });
    }).catch(function(err){
      console.warn("Error getting saved trail IDs:", err);
      return [];
    });
  },
  getTrailForPin: function(pinId) {
    return sb.from("trails").select("*").eq("pin_id", pinId).then(function(r) {
      if (r.error) throw r.error;
      return r.data && r.data.length > 0 ? r.data[0] : null;
    });
  },
  unlinkTrailFromPin: function(pinId) {
    return sb.from("trails").update({pin_id: null}).eq("pin_id", pinId).then(function(r) {
      if (r.error) throw r.error;
      return r.data;
    });
  },
  searchTrails: function(query) {
    var baseQuery = sb.from("trails").select("*").eq("is_public", true);
    if (!query) {
      return baseQuery.limit(50).then(function(r) {
        if (r.error) throw r.error;
        return r.data || [];
      });
    }
    return baseQuery.or(`name.ilike."%${query}%",description.ilike."%${query}%"`).limit(50).then(function(r) {
      if (r.error) throw r.error;
      return r.data || [];
    });
  },
  getMapPackCollaborators: function(packId) {
    return sb.from("mappack_collaborators").select("*").eq("mappack_id", packId).then(function(r){
      if (r.error) throw r.error;
      return r.data || [];
    });
  },
  addMapPackCollaborator: function(packId, username) {
    return sb.from("mappack_collaborators").insert({mappack_id: packId, username: username, role: 'editor'}).select().then(function(r){
      if (r.error) throw r.error;
      return r.data;
    });
  },
  removeMapPackCollaborator: function(packId, username) {
    return sb.from("mappack_collaborators").delete().eq("mappack_id", packId).eq("username", username).then(function(r){
      if (r.error) throw r.error;
      return r.data;
    });
  },
  getExpeditionLog: async function(followedUsers, followedTags) {
    followedUsers = followedUsers || [];
    followedTags = followedTags || [];
    if (followedUsers.length === 0 && followedTags.length === 0) {
      return [];
    }
    
    var queries = [];
    
    // 1. Fetch pins from followed users
    if (followedUsers.length > 0) {
      queries.push(
        sb.from("pins").select("*").in("owner", followedUsers).eq("privacy", "public").order("created_at", {ascending: false}).limit(20)
          .then(function(r) {
            return (r.data || []).map(function(item) {
              return Object.assign({}, item, {type: "pin"});
            });
          })
      );
    }
    
    // 2. Fetch pins with followed tags
    if (followedTags.length > 0) {
      queries.push(
        sb.from("pins").select("*").contains("tags", followedTags).eq("privacy", "public").order("created_at", {ascending: false}).limit(20)
          .then(function(r) {
            return (r.data || []).map(function(item) {
              return Object.assign({}, item, {type: "pin"});
            });
          })
      );
    }
    
    // 3. Fetch public trails from followed users
    if (followedUsers.length > 0) {
      queries.push(
        sb.from("trails").select("*").in("owner", followedUsers).eq("is_public", true).order("created_at", {ascending: false}).limit(20)
          .then(function(r) {
            return (r.data || []).map(function(item) {
              return Object.assign({}, item, {type: "trail"});
            });
          })
      );
    }
    
    // 4. Fetch comments (journals) from followed users
    if (followedUsers.length > 0) {
      queries.push(
        sb.from("comments").select("*, pins(name)").in("owner", followedUsers).order("created_at", {ascending: false}).limit(20)
          .then(function(r) {
            return (r.data || []).map(function(item) {
              return Object.assign({}, item, {type: "comment"});
            });
          })
      );
    }
    
    try {
      var results = await Promise.all(queries);
      var merged = [].concat.apply([], results);
      var seen = {};
      var filtered = merged.filter(function(item) {
        var key = item.type + "_" + item.id;
        if (seen[key]) return false;
        seen[key] = true;
        return true;
      });
      filtered.sort(function(a, b) {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      return filtered.slice(0, 30);
    } catch(e) {
      console.error("Error fetching expedition log:", e);
      return [];
    }
  },
  getMyActivity: function(myPinIds) {
    if (!myPinIds || !myPinIds.length) return Promise.resolve([]);
    return sb.from("comments")
      .select("id,pin_id,owner,body,photo_url,created_at")
      .in("pin_id", myPinIds)
      .order("created_at", {ascending: false})
      .limit(25)
      .then(function(r) { return r.data || []; });
  }
};

const VAPID_PUBLIC_KEY = "BPoen_AN-pimyj0ChkbFQybVATvnu1KBdntypfR9YOHbGbLUAe9h6oKixV52HobZyHF3dh5cEVT4Puvci-L1Qj0";

export function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);
  for (var i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function callEdgeFunction(type, data) {
  try {
    await fetch("https://uuxggoydnjvsssbenkkt.supabase.co/functions/v1/send-push", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SB_KEY}` },
      body: JSON.stringify(Object.assign({ type: type }, data))
    });
  } catch(e) { /* non-critical */ }
}

export async function savePushSubscription(sub, uname) {
  var json = sub.toJSON();
  var existing = await sb.from("push_subscriptions").select("id").eq("endpoint", json.endpoint).single();
  if(existing.data) {
    return;
  }
  await sb.from("push_subscriptions").insert({
    id: uid(),
    owner: uname,
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth
  });
}

export async function subscribeToPush(uname) {
  var isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
  if (isCapacitor) {
    try {
      var PushNotifications = window.Capacitor.Plugins.PushNotifications;
      if (PushNotifications) {
        var permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }
        if (permStatus.receive !== 'granted') {
          throw new Error("Permission denied");
        }
        await PushNotifications.register();
        return;
      }
    } catch(e) {
      console.warn("Capacitor Push registration failed", e);
      throw e;
    }
  }

  if(!("serviceWorker" in navigator)){throw new Error("Service worker not supported");}
  if(!("PushManager" in window)){throw new Error("Push not supported on this browser");}
  var reg = await navigator.serviceWorker.ready;
  var existing = await reg.pushManager.getSubscription();
  if(existing){
    await savePushSubscription(existing, uname);
    return;
  }
  var permission = await Notification.requestPermission();
  if(permission !== "granted") throw new Error("Permission denied");
  var sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });
  await savePushSubscription(sub, uname);
}

export async function uploadPhoto(dataUrl, pinId) {
  var parts = dataUrl.split(',');
  var mime = parts[0].match(/:(.*?);/)[1];
  var binary = atob(parts[1]);
  var array = new Uint8Array(binary.length);
  for(var i=0;i<binary.length;i++) array[i]=binary.charCodeAt(i);
  var blob = new Blob([array], {type:mime});
  var filename = 'pins/' + pinId + '_' + Date.now() + '.jpg';
  var res = await sb.storage.from('pin-images').upload(filename, blob, {contentType:'image/jpeg',upsert:true});
  if(res.error) throw res.error;
  var urlRes = sb.storage.from('pin-images').getPublicUrl(filename);
  return urlRes.data.publicUrl;
}

export async function uploadJournalPhoto(dataUrl, pinId) {
  var parts = dataUrl.split(',');
  var mime = parts[0].match(/:(.*?);/)[1];
  var binary = atob(parts[1]);
  var array = new Uint8Array(binary.length);
  for(var i=0;i<binary.length;i++) array[i]=binary.charCodeAt(i);
  var blob = new Blob([array], {type:mime});
  var filename = 'journals/' + pinId + '_' + Date.now() + '.jpg';
  var res = await sb.storage.from('journal-photos').upload(filename, blob, {contentType:'image/jpeg',upsert:true});
  if(res.error) throw res.error;
  var urlRes = sb.storage.from('journal-photos').getPublicUrl(filename);
  return urlRes.data.publicUrl;
}
