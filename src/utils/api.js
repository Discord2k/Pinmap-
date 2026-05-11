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
  deleteExpired:  function()            { return sb.from("pins").delete().lt("expires_at",new Date().toISOString()).not("expires_at","is",null); },
  remove:         function(id,uname)   { return sbWithUser(uname).from("pins").delete().eq("id",id); },
  search:         function(tag)        { return sb.from("pins").select("*").contains("tags",[tag]).eq("privacy","public").then(function(r){return r.data||[];}); },
  getComments:    function(pinId)      { return sb.from("comments").select("*").eq("pin_id",pinId).order("created_at",{ascending:true}).then(function(r){return r.data||[];}); },
  upvoteComment:  function(id,upvotes) { return sb.from("comments").update({upvotes:upvotes}).eq("id",id); },
  addComment:     function(c)          { return sb.from("comments").insert(c).select().then(function(r){return r.data;}); },
  deleteComment:  function(id,uname)   { return sbWithUser(uname).from("comments").delete().eq("id",id); },
  signInGoogle:   function()            { return sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin+window.location.pathname}}); },
  signOut:        function()            { return sb.auth.signOut(); },
  getSession:     function()            { return sb.auth.getSession(); },
  onAuthChange:   function(cb)          { return sb.auth.onAuthStateChange(cb); },
  getFollows:     function(owner)       { return sb.from("follows").select("*").eq("owner",owner).then(function(r){return r.data||[];}); },
  follow:         function(id,owner,tag){ return sb.from("follows").insert({id:id,owner:owner,tag:tag}).select().then(function(r){return r.data;}); },
  unfollow:       function(id,owner)    { return sbWithUser(owner).from("follows").delete().eq("id",id); },
  getUserFollows:   function(owner)        { return sb.from("user_follows").select("*").eq("owner",owner).then(function(r){return r.data||[];}); },
  getNotifications: function(owner)       { return sb.from("notifications").select("*").eq("owner",owner).eq("seen",false).order("created_at",{ascending:false}).then(function(r){return r.data||[];}); },
  getProfile:      function(id)          { return sb.from("profiles").select("*").eq("id",id).single().then(function(r){return r.data||null;}); },
  upsertProfile:   function(profile)     {
    return sb.from("profiles").update(profile).eq("id",profile.id).then(function(r){
      if(r.error || (r.data && r.data.length===0)) {
        return sb.from("profiles").insert(profile);
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
