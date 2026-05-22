import React from 'react';
import { userAvatar, APP_VERSION } from '../utils/helpers';
import { api, subscribeToPush, sb } from '../utils/api';
import { T, S } from '../utils/styles';
import { UserBadges } from './UserBadges';

export function ProfilePanel(props) {
  var lang = props.lang || 'en';
  var t = props.t || function(key) { return key; };
  var setLang = props.setLang || function(){};
  var user = props.user, uname = props.uname, myPins = props.myPins;
  var userFollows = props.userFollows || [];
  var followers = props.followers || [];
  var [showAllFollowing, setShowAllFollowing] = React.useState(false);
  var [showAllFollowers, setShowAllFollowers] = React.useState(false);

  var mapPacks = props.mapPacks || [];
  var challenges = props.challenges || [];
  var allPins = props.allPins || [];
  var checkins = props.checkins || [];
  var activeMapPack = props.activeMapPack || null;
  var activeQuestId = props.activeQuestId || "";
  var setActiveQuestId = props.setActiveQuestId;
  var trails = props.trails || [];
  var activeTrail = props.activeTrail || null;
  
  var fileInputRef = React.useRef(null);
  var handleGpxImportChange = function(ev) {
    var file = ev.target.files[0];
    if (!file) return;
    if (props.onImportGPX) {
      props.onImportGPX(file);
    }
    ev.target.value = "";
  };

  var [showCreatePackModal, setShowCreatePackModal] = React.useState(false);
  var [packName, setPackName] = React.useState("");
  var [packDesc, setPackDesc] = React.useState("");
  var [packPublic, setPackPublic] = React.useState(true);

  var [showCreateChallengeModal, setShowCreateChallengeModal] = React.useState(false);
  var [chalTitle, setChalTitle] = React.useState("");
  var [chalDesc, setChalDesc] = React.useState("");
  var [chalIcon, setChalIcon] = React.useState("🏆");
  var [chalTag, setChalTag] = React.useState("");
  var [chalCount, setChalCount] = React.useState(3);

  var [questTab, setQuestTab] = React.useState("active");
  var [questsCollapsed, setQuestsCollapsed] = React.useState(true);
  var [collectionsCollapsed, setCollectionsCollapsed] = React.useState(true);
  var [trailsCollapsed, setTrailsCollapsed] = React.useState(true);
  var [badgesCollapsed, setBadgesCollapsed] = React.useState(true);
  var [followingCollapsed, setFollowingCollapsed] = React.useState(true);
  var [followersCollapsed, setFollowersCollapsed] = React.useState(true);
  var [helpPopup, setHelpPopup] = React.useState(null);
  var [trackedQuestIds, setTrackedQuestIds] = React.useState(function() {
    try {
      var saved = localStorage.getItem("pinmap_tracked_quests");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  var [deletedQuestIds, setDeletedQuestIds] = React.useState(function() {
    try {
      var saved = localStorage.getItem("pinmap_deleted_quests");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  var toggleTrackQuest = function(id) {
    setTrackedQuestIds(function(prev) {
      var next;
      if (prev.indexOf(id) >= 0) {
        next = prev.filter(function(x) { return x !== id; });
        flash(t('toast_trail_stopped_tracking'));
      } else {
        next = prev.concat([id]);
        flash(t('toast_trail_started_tracking'));
      }
      localStorage.setItem("pinmap_tracked_quests", JSON.stringify(next));
      return next;
    });
  };
  
  var toggleUserFollow = props.toggleUserFollow || function(){};
  var loadUserProfile = props.loadUserProfile || function(){};
  var focusUserPins = props.focusUserPins || function(){};
  var pushEnabled = props.pushEnabled || false;
  var setPushEnabled = props.setPushEnabled || function(){};
  var flash = props.flash || function(){};
  var savedPins = props.savedPins || [];
  var setOnboardStep = props.setOnboardStep || function(){};
  var setOpen = props.setOpen || function(){};
  var setShowFeatures = props.setShowFeatures || function(){};
  var setMyProfile = props.setMyProfile || function(){};
  var setShowImport = props.setShowImport || function(){};
  var myProfile = props.myProfile || null;
  var editingProfile = props.editingProfile || false;
  var setEditingProfile = props.setEditingProfile || function(){};
  var profileForm = props.profileForm || {};
  var setProfileForm = props.setProfileForm || function(){};
  var onStartOfflineMode = props.onStartOfflineMode || function(){};
  var onPurgeOfflineTiles = props.onPurgeOfflineTiles || function(){};
  
  var own = myPins.filter(function(p){return !p.saved_from;});
  var upvotes = own.reduce(function(a,p){return a+(p.upvotes?p.upvotes.length:0);},0);

  // Priority: custom uploaded photo → Google OAuth photo → null (shows initials)
  var googleAvatar = userAvatar(user);
  var avatar = (myProfile && myProfile.avatar_url) ? myProfile.avatar_url : googleAvatar;

  var myStats = [
    {v:own.length, l:t('pins_count')},
    {v:own.filter(function(p){return p.privacy==="public";}).length, l:t('public_count')},
    {v:savedPins.length, l:t('saved_count')},
    {v:upvotes, l:t('upvotes_count')}
  ];

  return (
    <div style={{height:"100%",overflowY:"auto",background:T.paper}}>
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 22px 10px",borderBottom:"1px solid "+T.borderSoft}}>
        <div style={{fontSize:10.5,letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600,color:T.ink3,fontFamily:T.mono}}>{t('profile')}</div>
        {user && !editingProfile && (
          <button 
            style={{fontSize:12,padding:"5px 14px",borderRadius:18,border:"1px solid "+T.border,background:"transparent",color:T.ink2,cursor:"pointer",fontWeight:500}}
            onClick={() => {
              setEditingProfile(true);
              api.getProfile(uname).then(function(data){
                setMyProfile(data);
                setProfileForm({
                  bio:(data&&data.bio)||"",location:(data&&data.location)||"",
                  website:(data&&data.website)||"",twitter:(data&&data.twitter)||"",
                  instagram:(data&&data.instagram)||"",youtube:(data&&data.youtube)||"",
                  avatar_url:(data&&data.avatar_url)||""
                });
              });
            }}
          >
            {t('edit')}
          </button>
        )}
      </div>

      {/* ── Identity ──────────────────────────────────────────────────────────── */}
      <div style={{padding:"14px 22px 12px",borderBottom:"1px solid "+T.borderSoft}}>
        <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
          {/* Avatar */}
          <div style={{width:56,height:56,borderRadius:28,background:avatar?"transparent":T.forest,
            color:T.paper,display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:24,fontWeight:700,flexShrink:0,overflow:"hidden",
            border:"2px solid "+T.borderSoft,boxShadow:"0 2px 8px rgba(0,0,0,0.10)"}}>
            {avatar 
              ? <img src={avatar} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={(ev)=>{ev.target.style.display="none";}} />
              : (uname&&uname!=="guest"?uname[0].toUpperCase():"?")
            }
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:18,fontWeight:700,color:T.ink,lineHeight:1.1,marginBottom:4}}>
              {uname&&uname!=="guest"?uname:(lang === 'es' ? "Invitado" : "Guest")}
            </div>
            {user && <div style={{fontSize:13,color:T.ink3}}>{"@"+(uname||"").toLowerCase().replace(/ /g,".")}</div>}
            <div style={{fontSize:10,color:T.ink3,marginTop:4,fontFamily:T.mono,letterSpacing:"0.1em",textTransform:"uppercase"}}>
              {myProfile&&myProfile.location?myProfile.location:(lang === 'es' ? "Miembro de PINMAP" : "PINMAP Member")}
            </div>
          </div>
        </div>
        
        {/* Bio */}
        {myProfile&&myProfile.bio 
          ? <div style={{fontSize:14.5,color:T.ink2,lineHeight:1.55}}>{myProfile.bio}</div>
          : !editingProfile && <div style={{fontSize:13,color:T.ink3,fontStyle:"italic"}}>{t('no_bio_yet')}</div>
        }
        
        {/* Social links */}
        {myProfile&&(myProfile.website||myProfile.twitter||myProfile.instagram) && (
          <div style={{display:"flex",gap:10,marginTop:10,flexWrap:"wrap"}}>
            {myProfile.website && <a href={myProfile.website.startsWith("http")?myProfile.website:"https://"+myProfile.website} target="_blank" style={{fontSize:12,color:T.forest,textDecoration:"none"}}>{myProfile.website.replace(/https?:\/\//,"")}</a>}
            {myProfile.twitter && <span style={{fontSize:12,color:T.ink3}}>{"𝕏 @"+myProfile.twitter}</span>}
            {myProfile.instagram && <span style={{fontSize:12,color:T.ink3}}>{"📸 @"+myProfile.instagram}</span>}
          </div>
        )}
      </div>

      {/* ── Edit Profile Form ──────────────────────────────────────────────────── */}
      {editingProfile && (
        <div style={{padding:"20px 22px",borderBottom:"1px solid "+T.borderSoft}}>
          {/* Avatar picker */}
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
            {/* Preview */}
            <div style={{width:64,height:64,borderRadius:32,overflow:"hidden",background:T.forestPale,
              flexShrink:0,border:"3px solid "+T.borderSoft,position:"relative",
              boxShadow:"0 2px 8px rgba(0,0,0,0.10)"}}>
              <img 
                src={profileForm.avatar_url||avatar||"https://ui-avatars.com/api/?name="+encodeURIComponent(uname)+"&background=2a5d3c&color=fff&size=64"}
                style={{width:"100%",height:"100%",objectFit:"cover"}}
                onError={(ev)=>{ev.target.src="https://ui-avatars.com/api/?name="+encodeURIComponent(uname)+"&background=2a5d3c&color=fff&size=64";}}
              />
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,marginBottom:6}}>{t('profile_photo')}</div>
              <label style={{
                display:"inline-flex",alignItems:"center",gap:6,
                padding:"8px 16px",borderRadius:10,
                background:T.forest,color:T.paper,
                fontSize:13,fontWeight:600,cursor:"pointer"
              }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy={13} r="4" stroke="currentColor" strokeWidth={2}/></svg>
                {t('choose_photo')}
                <input type="file" accept="image/*" style={{display:"none"}} onChange={(ev) => {
                  var file=ev.target.files[0]; if(!file) return;
                  flash(lang === 'es' ? "Subiendo..." : "Uploading…");
                  var reader=new FileReader();
                  reader.onload=function(e2){
                    var img=new Image();
                    img.onload=function(){
                      var MAX=512,w=img.width,h=img.height;
                      if(w>MAX||h>MAX){if(w>h){h=Math.round(h*MAX/w);w=MAX;}else{w=Math.round(w*MAX/h);h=MAX;}}
                      var canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
                      canvas.getContext("2d").drawImage(img,0,0,w,h);
                      canvas.toBlob(function(blob){
                        var path="avatars/"+uname.replace(/ /g,"-").toLowerCase()+".jpg";
                        // Use Supabase Storage SDK (handles auth automatically)
                        sb.storage.from("pin-images").upload(path, blob, {
                          contentType:"image/jpeg", upsert:true
                        }).then(function(res){
                          if(res.error){flash((lang === 'es' ? "Error al subir: " : "Upload failed: ") + res.error.message);return;}
                          var urlRes = sb.storage.from("pin-images").getPublicUrl(path);
                          var url = urlRes.data.publicUrl+"?t="+Date.now();
                          setProfileForm(function(f){return Object.assign({},f,{avatar_url:url});});
                          flash(lang === 'es' ? "✅ ¡Foto subida!" : "✅ Photo uploaded!");
                        }).catch(function(e){flash((lang === 'es' ? "Error al subir: " : "Upload failed: ") + e.message);});
                      },"image/jpeg",0.88);
                    };
                    img.src=e2.target.result;
                  };
                  reader.readAsDataURL(file);
                }} />
              </label>
              {googleAvatar && !profileForm.avatar_url && (
                <div style={{fontSize:11,color:T.ink3,marginTop:6}}>{t('using_google_photo')}</div>
              )}
              {profileForm.avatar_url && (
                <button style={{marginTop:6,fontSize:11,color:"#c05050",background:"none",border:"none",cursor:"pointer",padding:0}}
                  onClick={()=>setProfileForm(function(f){return Object.assign({},f,{avatar_url:""})})}>
                  {t('remove_custom_photo')}
                </button>
              )}
            </div>
          </div>
          
          {[[ "bio", t('bio'), t('bio_placeholder'), "textarea" ],
            [ "location", t('location'), t('location_placeholder'), "text" ],
            [ "website", t('website'), "yoursite.com", "text" ],
            [ "twitter", t('twitter'), "username", "text" ],
            [ "instagram", t('instagram'), "username", "text" ]
          ].map(function(field,i){
            return (
              <div key={i} style={{marginBottom:10}}>
                <div style={{fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,marginBottom:4}}>{field[1]}</div>
                {field[3]==="textarea"
                  ? <textarea id={field[0]} name={field[0]} style={S.textarea} placeholder={field[2]} rows={3} value={profileForm[field[0]]||""} onChange={(ev)=>{var k=field[0];var v=ev.target.value;setProfileForm(function(f){return Object.assign({},f,{[k]:v});});}} />
                  : <input id={field[0]} name={field[0]} style={S.input} placeholder={field[2]} value={profileForm[field[0]]||""} onChange={(ev)=>{var k=field[0];var v=ev.target.value;setProfileForm(function(f){return Object.assign({},f,{[k]:v});});}} />
                }
              </div>
            );
          })}
          
          <div style={{display:"flex",gap:8}}>
            <button style={Object.assign({},S.btn,{flex:1})} onClick={() => {
              // Always persist the google avatar as fallback so other users' cards show something
              var profile = Object.assign(
                {id:uname, updated_at:new Date().toISOString()},
                googleAvatar ? {google_avatar: googleAvatar} : {},
                profileForm
              );
              api.upsertProfile(profile).then(function(r){
                if(r&&r.error) flash(t('toast_profile_save_failed') + r.error.message);
                else { 
                  var savedData = (r.data && r.data.length > 0) ? r.data[0] : profile;
                  setMyProfile(savedData); 
                  setEditingProfile(false); 
                  flash(t('toast_profile_saved')); 
                }
              }).catch(function(e){flash(t('toast_profile_save_failed') + e.message);});
            }}>{t('save_profile')}</button>
            <button style={Object.assign({},S.btnOutline,{flex:1})} onClick={() => setEditingProfile(false)}>{t('cancel_profile')}</button>
          </div>
        </div>
      )}

      {/* ── Stats ──────────────────────────────────────────────────────────────── */}
      {!editingProfile && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",borderBottom:"1px solid "+T.borderSoft}}>
          {myStats.map(function(s,i){
            return (
              <div key={i} style={{textAlign:"center",padding:"12px 8px",borderRight:i<3?"1px solid "+T.borderSoft:"none"}}>
                <div style={{fontSize:24,fontWeight:700,color:T.ink,lineHeight:1}}>{s.v}</div>
                <div style={{fontSize:9.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,marginTop:4}}>{s.l}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Trails & Routes ────────────────────────────────────────────────── */}
      {!editingProfile && (
        <div style={{borderBottom:"1px solid "+T.borderSoft}}>
          <input type="file" ref={fileInputRef} accept=".gpx" style={{display:"none"}} onChange={handleGpxImportChange} />
          <div
            style={{padding:"16px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}
            onClick={function(){ setTrailsCollapsed(function(v){ return !v; }); }}
          >
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={S.secHead}>
                {t('trails_routes')+(trails.length>0?" \u00b7 "+trails.length:"")}
              </div>
              <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.06em",background:T.forest,color:T.paper,padding:"2.5px 6.5px",borderRadius:6,textTransform:"uppercase",lineHeight:1,fontFamily:T.font}}>GPS</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              {!trailsCollapsed && user && (
                <>
                  <button
                    style={Object.assign({},S.miniBtn,{background:"transparent",border:"1px solid "+T.forest,color:T.forest,display:"flex",alignItems:"center",gap:5,fontSize:11,padding:"4px 8px"})}
                    onClick={function(e){ e.stopPropagation(); if(fileInputRef.current) fileInputRef.current.click(); }}
                  >
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1M12 4v12m0-12L8 8m4-4l4 4" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {t('gpx_btn')}
                  </button>
                  <button
                    style={Object.assign({},S.miniBtn,{background:T.forest,color:T.paper,border:"none",display:"flex",alignItems:"center",gap:5,fontSize:11,padding:"4px 8px"})}
                    onClick={function(e){ e.stopPropagation(); props.setOpen(false); if(props.onStartTrailRecording) props.onStartTrailRecording(); }}
                  >
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={2.2}/><circle cx={12} cy={12} r={4.5} fill="#e05050"/></svg>
                    {t('record_btn')}
                  </button>
                </>
              )}
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{transition:"transform 0.2s",transform:trailsCollapsed?"rotate(0deg)":"rotate(180deg)",flexShrink:0}}>
                <path d="M6 9l6 6 6-6" stroke={T.ink3} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {!trailsCollapsed && (
            <div style={{padding:"0 22px 16px"}}>
            {trails.length === 0 ? (
              <div style={{fontSize:13,color:T.ink3,textAlign:"center",padding:"12px 0",fontStyle:"italic"}}>{t('no_recorded_trails')}</div>
          ) : (
            trails.map(function(trail){
              var isCurrentActive = activeTrail && activeTrail.id === trail.id;
              var isOwner = trail.owner === uname;
              
              var formatDuration = function(secs) {
                if (!secs) return "";
                var h = Math.floor(secs / 3600);
                var m = Math.floor((secs % 3600) / 60);
                var s = secs % 60;
                if (h > 0) return h + "h " + m + "m";
                if (m > 0) return m + "m " + s + "s";
                return s + "s";
              };

              var handleExport = function() {
                var gpx = '<?xml version="1.0" encoding="UTF-8"?>\n' +
                          '<gpx version="1.1" creator="PINMAP" xmlns="http://www.topografix.com/GPX/1/1">\n' +
                          '  <metadata>\n' +
                          '    <name>' + trail.name.replace(/[<>&'"]/g, function(c){ return { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]; }) + '</name>\n' +
                          '    <desc>' + (trail.description || '').replace(/[<>&'"]/g, function(c){ return { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]; }) + '</desc>\n' +
                          '  </metadata>\n' +
                          '  <trk>\n' +
                          '    <name>' + trail.name.replace(/[<>&'"]/g, function(c){ return { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]; }) + '</name>\n' +
                          '    <trkseg>\n' +
                          (trail.coordinates || []).map(function(pt) {
                            return '      <trkpt lat="' + pt[0] + '" lon="' + pt[1] + '"></trkpt>';
                          }).join('\n') + '\n' +
                          '    </trkseg>\n' +
                          '  </trk>\n' +
                          '</gpx>';
                
                var blob = new Blob([gpx], {type: "application/gpx+xml"});
                var url = URL.createObjectURL(blob);
                var a = document.createElement("a");
                a.href = url;
                a.download = trail.name.toLowerCase().replace(/[^a-z0-9]/g, "_") + ".gpx";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              };

              return (
                <div 
                  key={trail.id}
                  className="pm-card-hover"
                  style={Object.assign({}, S.card, {
                    padding: "12px 14px",
                    marginBottom: 10,
                    cursor: "default",
                    border: isCurrentActive ? "2px solid " + (trail.color || T.forest) : "1px solid " + T.borderSoft,
                    background: isCurrentActive ? T.paper : T.paper2
                  })}
                >
                  <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                    <div style={{width: 8, height: 8, borderRadius: "50%", background: trail.color || T.forest, marginTop: 5, flexShrink: 0}} />
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                        <span style={{fontWeight:700,fontSize:14,color:T.ink}}>{trail.name}</span>
                        {!trail.is_public && (
                          <span style={{fontSize:10,background:T.borderSoft,color:T.ink3,padding:"1px 5px",borderRadius:4}}>
                            {t('private_badge')}
                          </span>
                        )}
                        <span style={{color:T.ink3,fontSize:11}}>{t('by_author')} @{trail.owner}</span>
                      </div>
                      
                      {trail.description && (
                        <div style={{fontSize:12.5,color:T.ink2,marginTop:3,lineHeight:1.4}}>{trail.description}</div>
                      )}

                      <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
                        <span style={{fontSize:11,fontFamily:T.mono,background:T.paper3,color:T.ink2,padding:"2px 6px",borderRadius:6}}>
                          🥾 {Number(trail.distance_km || 0).toFixed(2)} km
                        </span>
                        {trail.duration_seconds > 0 && (
                          <span style={{fontSize:11,fontFamily:T.mono,background:T.paper3,color:T.ink2,padding:"2px 6px",borderRadius:6}}>
                            ⏱️ {formatDuration(trail.duration_seconds)}
                          </span>
                        )}
                      </div>
                      
                      <div style={{display:"flex",gap:8,marginTop:10}}>
                        <button 
                           style={Object.assign({}, S.miniBtn, {
                            background: isCurrentActive ? (trail.color || T.forest) : "transparent",
                            color: isCurrentActive ? T.paper : T.forest,
                            border: "1px solid " + (trail.color || T.forest),
                            padding: "4px 10px"
                          })}
                          onClick={function(){
                            props.setOpen(false); // Close Profile drawer
                            props.onSelectTrail(isCurrentActive ? null : trail);
                          }}
                        >
                          {isCurrentActive ? "🗺️ " + t('active_route') : "🗺️ " + t('view_trail')}
                        </button>
                        <button 
                          style={Object.assign({}, S.miniBtn, {
                            background: "transparent",
                            color: T.ink2,
                            border: "1px solid " + T.border,
                            padding: "4px 10px"
                          })}
                          onClick={handleExport}
                        >
                          📥 {t('export_gpx')}
                        </button>
                      </div>
                    </div>
                    {user && isOwner && (
                      <button 
                        style={{background:"none",border:"none",color:"#c05050",cursor:"pointer",padding:4}}
                        onClick={function(){
                          if(confirm(t('toast_trail_delete_confirm'))){
                            props.onDeleteTrail(trail.id);
                          }
                        }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })
            )}
            </div>
          )}
        </div>
      )}

      {/* ── Achievements ───────────────────────────────────────────────────────── */}
      {!editingProfile && (
        <div style={{borderBottom:"1px solid "+T.borderSoft}}>
          <div
            style={{padding:"16px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}
            onClick={function(){ setBadgesCollapsed(function(v){ return !v; }); }}
          >
            <div style={S.secHead}>{t('achievements')}</div>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{transition:"transform 0.2s",transform:badgesCollapsed?"rotate(0deg)":"rotate(180deg)"}}>
              <path d="M6 9l6 6 6-6" stroke={T.ink3} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {!badgesCollapsed && (
            <div style={{padding:"0 22px 12px"}}>
              <UserBadges pinsCount={own.length} checkinsCount={props.checkinsCount || 0} lang={lang} t={props.t} />
            </div>
          )}
        </div>
      )}

      {/* ── Explorer Challenges ────────────────────────────────────────────────── */}
      {!editingProfile && (
        <div style={{padding:"20px 22px",borderBottom:"1px solid "+T.borderSoft}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom: 12}}>
            <div 
              className="pm-section-header"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                userSelect: "none"
              }}
              onClick={function(){ setQuestsCollapsed(function(prev){ return !prev; }); }}
            >
              <span style={{fontSize: 10, color: T.ink3, display: "inline-block", transition: "transform 0.2s", transform: questsCollapsed ? "rotate(0deg)" : "rotate(90deg)"}}>▶</span>
              <span style={S.secHead}>{t('explorer_quests')}</span>
              <span 
                className="pm-info-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "rgba(26,32,28,0.06)",
                  fontSize: 11,
                  color: T.ink3,
                  marginLeft: 4,
                  cursor: "pointer"
                }} 
                onClick={function(e){ 
                  e.stopPropagation(); 
                  setHelpPopup({
                    title: t('explorer_quests'),
                    emoji: "🏆",
                    desc: lang === 'es' 
                      ? "¡Diseña o sigue desafíos personalizados basados en la ubicación! Ponte a prueba a ti mismo o a otros para visitar y registrarse en lugares con etiquetas específicas (ej. visitar 3 lugares etiquetados como #cascadas). El progreso se verifica automáticamente mediante GPS."
                      : "Design or track custom location-based challenges! Challenge yourself or others to visit and check in to spots with specific tags (e.g. visit 3 spots tagged #waterfalls). Progress is verified automatically using GPS."
                  });
                }}
              >
                ?
              </span>
            </div>
            {user && (
              <button 
                style={Object.assign({}, S.miniBtn, {
                  background: T.forestPale,
                  color: T.forest,
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  opacity: questsCollapsed ? 0 : 1,
                  transform: questsCollapsed ? "scale(0.9)" : "scale(1)",
                  pointerEvents: questsCollapsed ? "none" : "auto",
                  transition: "opacity 0.2s, transform 0.2s"
                })}
                onClick={function(){ setShowCreateChallengeModal(true); }}
              >
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"/></svg>
                <span>{t('design_quest')}</span>
              </button>
            )}
          </div>

          <div className={"pm-collapsible " + (questsCollapsed ? "collapsed" : "")}>
            <div>
              {/* Quest Tabs */}
              {(function() {
                var visibleChallenges = challenges.filter(function(ch) {
                  return deletedQuestIds.indexOf(ch.id) < 0;
                });
                var sortedChallenges = visibleChallenges.slice().sort(function(a, b) {
                  var aIsSystem = a.owner === "system" ? 1 : 0;
                  var bIsSystem = b.owner === "system" ? 1 : 0;
                  if (aIsSystem !== bIsSystem) {
                    return aIsSystem - bIsSystem; // system challenges go to the bottom (1 - 0 = 1, so b goes first)
                  }
                  return new Date(b.created_at || 0) - new Date(a.created_at || 0); // newest first
                });

                var activeCount = sortedChallenges.filter(function(ch) { return ch.owner === "system" || ch.owner === uname || trackedQuestIds.indexOf(ch.id) >= 0; }).length;
                var discoverCount = sortedChallenges.filter(function(ch) { return ch.owner !== "system" && ch.owner !== uname && trackedQuestIds.indexOf(ch.id) < 0; }).length;

                var filtered = sortedChallenges.filter(function(ch) {
                  var isMineOrSystem = ch.owner === "system" || ch.owner === uname || trackedQuestIds.indexOf(ch.id) >= 0;
                  return questTab === "active" ? isMineOrSystem : !isMineOrSystem;
                });

                return (
                  <>
                    <div style={{display: "flex", gap: 8, marginBottom: 12}}>
                      <button
                        style={{
                          flex: 1,
                          padding: "6px 12px",
                          borderRadius: 8,
                          fontSize: 12.5,
                          fontWeight: 700,
                          border: "none",
                          background: questTab === "active" ? T.forest : T.borderSoft,
                          color: questTab === "active" ? T.paper : T.ink2,
                          cursor: "pointer"
                        }}
                        onClick={function(){ setQuestTab("active"); }}
                      >
                        {t('my_quests')} ({activeCount})
                      </button>
                      <button
                        style={{
                          flex: 1,
                          padding: "6px 12px",
                          borderRadius: 8,
                          fontSize: 12.5,
                          fontWeight: 700,
                          border: "none",
                          background: questTab === "discover" ? T.forest : T.borderSoft,
                          color: questTab === "discover" ? T.paper : T.ink2,
                          cursor: "pointer"
                        }}
                        onClick={function(){ setQuestTab("discover"); }}
                      >
                        {t('discover')} ({discoverCount})
                      </button>
                    </div>

                    {filtered.length === 0 ? (
                      <div style={{fontSize:13,color:T.ink3,textAlign:"center",padding:"12px 0",fontStyle:"italic"}}>
                        {questTab === "active" ? t('no_active_quests') : t('no_community_quests')}
                      </div>
                    ) : (
                      filtered.map(function(ch){
                        var chTags = ch.tags || [];
                        var checkedPinIds = checkins.map(function(c) { return c.pin_id; });
                        var matchingPins = allPins.filter(function(p) {
                          if (checkedPinIds.indexOf(p.id) < 0) return false;
                          if (!p.tags) return false;
                          return p.tags.some(function(t) { return chTags.indexOf(t) >= 0; });
                        });
                        var count = Math.min(matchingPins.length, ch.required_count || 3);
                        var isDone = count >= (ch.required_count || 3);
                        var isTracked = trackedQuestIds.indexOf(ch.id) >= 0;

                        return (
                          <div 
                            key={ch.id} 
                            className="pm-card-hover"
                            style={Object.assign({}, S.card, {
                              padding: "12px 14px", 
                              marginBottom: 10, 
                              cursor: "default",
                              border: isDone ? "2px solid #d4af37" : "1px solid " + T.borderSoft,
                              background: isDone ? "linear-gradient(135deg, #fffaf0 0%, #fdf8ee 100%)" : T.paper2
                            })}
                          >
                            <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                              <div style={{fontSize:24,marginTop:2}}>{ch.icon || "🏆"}</div>
                              <div style={{flex:1}}>
                                <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                                  <span style={{fontWeight:700,fontSize:14,color:T.ink}}>{ch.title}</span>
                                  {isDone && (
                                    <span style={{background:"#d4af37",color:"#fff",fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:10,textTransform:"uppercase",letterSpacing:"0.05em"}}>
                                      {t('completed')}
                                    </span>
                                  )}
                                  {ch.owner && ch.owner !== "system" && (
                                    <span style={{color:T.ink3,fontSize:11}}>{t('by_author')} @{ch.owner}</span>
                                  )}
                                </div>
                                <div style={{fontSize:12.5,color:T.ink2,marginTop:3,lineHeight:1.4}}>{ch.description}</div>
                                
                                {/* Tags list */}
                                <div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>
                                  {chTags.map(function(t, idx){
                                    return (
                                      <span key={idx} style={{fontSize:10,background:"rgba(26,32,28,0.05)",color:T.ink2,padding:"2px 6px",borderRadius:4,fontFamily:T.mono}}>
                                        #{t}
                                      </span>
                                    );
                                  })}
                                </div>

                                {/* Progress Bar & Track/Untrack button */}
                                <div style={{marginTop:8, display:"flex", alignItems:"center", gap:10}}>
                                  <div style={{flex: 1}}>
                                    <div style={{display:"flex",justifyContent:"space-between",fontSize:10.5,color:T.ink3,fontFamily:T.mono,marginBottom:3}}>
                                      <span>{t('progress')}</span>
                                      <span style={{marginLeft:"auto"}}>{count} / {ch.required_count}</span>
                                    </div>
                                    <div style={{width:"100%",height:6,background:T.borderSoft,borderRadius:3,overflow:"hidden"}}>
                                      <div style={{width:(count/(ch.required_count || 3)*100)+"%",height:"100%",background:isDone ? "#d4af37" : T.forest,borderRadius:3}} />
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                                    {ch.owner !== "system" && ch.owner !== uname && (
                                      <button
                                        style={{
                                          background: isTracked ? "transparent" : T.borderSoft,
                                          color: isTracked ? T.ink3 : T.ink2,
                                          border: isTracked ? "1px solid " + T.borderSoft : "none",
                                          padding: "4px 8px",
                                          borderRadius: 6,
                                          fontSize: 11,
                                          fontWeight: 700,
                                          cursor: "pointer"
                                        }}
                                        onClick={function(e){ 
                                          e.stopPropagation(); 
                                          toggleTrackQuest(ch.id); 
                                        }}
                                      >
                                        {isTracked ? t('untrack') : t('track')}
                                      </button>
                                    )}
                                    
                                    <button
                                      style={{
                                        background: activeQuestId === ch.id ? "#d4af37" : T.forest,
                                        color: "#fff",
                                        border: "none",
                                        padding: "4px 8px",
                                        borderRadius: 6,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 3
                                      }}
                                      onClick={function(e){
                                        e.stopPropagation();
                                        if (activeQuestId === ch.id) {
                                          setActiveQuestId("");
                                          localStorage.setItem("pinmap_active_quest_id", "");
                                          flash(t('toast_quest_paused'));
                                        } else {
                                          if (!isTracked && ch.owner !== "system" && ch.owner !== uname) {
                                            toggleTrackQuest(ch.id);
                                          }
                                          setActiveQuestId(ch.id);
                                          localStorage.setItem("pinmap_active_quest_id", ch.id);
                                          flash(t('toast_quest_started'));
                                          if (props.setOpen) props.setOpen(false);
                                        }
                                      }}
                                    >
                                      {activeQuestId === ch.id ? "🎯 " + t('active') : t('start')}
                                    </button>
                                  </div>
                                </div>
                              </div>
                              {user && (ch.owner === uname || ch.owner === "system" || isTracked) && (
                                <button 
                                  style={{background:"none",border:"none",color:"#c05050",cursor:"pointer",padding:4}}
                                  onClick={function(){
                                    if(ch.owner === uname) {
                                      if(confirm(t('toast_quest_delete_confirm'))){
                                        props.onDeleteChallenge(ch.id);
                                      }
                                    } else {
                                      if(confirm(t('toast_quest_remove_confirm'))){
                                        var nextDeleted = deletedQuestIds.concat([ch.id]);
                                        setDeletedQuestIds(nextDeleted);
                                        localStorage.setItem("pinmap_deleted_quests", JSON.stringify(nextDeleted));
                                        flash(t('toast_quest_removed'));
                                      }
                                    }
                                  }}
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </>
                );
              })()}
          </div>
        </div>
      </div>
    )}

      {/* ── Collections ────────────────────────────────────────────────── */}
      {!editingProfile && (
        <div style={{padding:"20px 22px",borderBottom:"1px solid "+T.borderSoft}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div 
              className="pm-section-header"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: mapPacks.length > 1 ? "pointer" : "default",
                userSelect: "none"
              }}
              onClick={function(){
                if (mapPacks.length > 1) {
                  setCollectionsCollapsed(function(prev) { return !prev; });
                }
              }}
            >
              {mapPacks.length > 1 && (
                <span style={{
                  fontSize: 10,
                  color: T.ink3,
                  display: "inline-block",
                  transition: "transform 0.2s",
                  transform: collectionsCollapsed ? "rotate(0deg)" : "rotate(90deg)"
                }}>▶</span>
              )}
              <span style={S.secHead}>{t('collections')}</span>
              <span 
                className="pm-info-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "rgba(26,32,28,0.06)",
                  fontSize: 11,
                  color: T.ink3,
                  marginLeft: 4,
                  cursor: "pointer"
                }} 
                onClick={function(e){ 
                  e.stopPropagation(); 
                  setHelpPopup({
                    title: t('collections'),
                    emoji: "🧭",
                    desc: lang === 'es'
                      ? "Grupos temáticos de tus ubicaciones favoritas. Crea listas personalizadas como 'Cafés del fin de semana' o 'Miradores favoritos' desde tu perfil, luego actívalas para filtrar el mapa o añade nuevos pines directamente desde sus detalles."
                      : "Themed groups of your favorite locations. Create custom lists like 'Weekend Coffee Walks' or 'Favorite Viewpoints' from your profile, then toggle them to filter the map view or add new pins directly from their pin details."
                  });
                }}
              >
                ?
              </span>
            </div>
            {user && (
              <button 
                style={Object.assign({}, S.miniBtn, {
                  background: T.forestPale,
                  color: T.forest,
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  opacity: (mapPacks.length > 1 && collectionsCollapsed) ? 0 : 1,
                  transform: (mapPacks.length > 1 && collectionsCollapsed) ? "scale(0.9)" : "scale(1)",
                  pointerEvents: (mapPacks.length > 1 && collectionsCollapsed) ? "none" : "auto",
                  transition: "opacity 0.2s, transform 0.2s"
                })}
                onClick={function(){ setShowCreatePackModal(true); }}
              >
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"/></svg>
                <span>{t('create_collection')}</span>
              </button>
            )}
          </div>

          <div className={"pm-collapsible " + ((mapPacks.length > 1 && collectionsCollapsed) ? "collapsed" : "")}>
            <div>
              {mapPacks.length === 0 ? (
                <div style={{fontSize:13,color:T.ink3,textAlign:"center",padding:"12px 0",fontStyle:"italic"}}>{t('no_collections')}</div>
              ) : (
                mapPacks.map(function(pack){
                  var isCurrentActive = activeMapPack && activeMapPack.id === pack.id;
                  return (
                    <div 
                      key={pack.id}
                      className="pm-card-hover"
                      style={Object.assign({}, S.card, {
                        padding: "12px 14px",
                        marginBottom: 10,
                        cursor: "default",
                        border: isCurrentActive ? "2px solid " + T.forest : "1px solid " + T.borderSoft,
                        background: isCurrentActive ? T.paper : T.paper2
                      })}
                    >
                      <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                            <span style={{fontWeight:700,fontSize:14,color:T.ink}}>{pack.name}</span>
                            {!pack.is_public && (
                              <span style={{fontSize:10,background:T.borderSoft,color:T.ink3,padding:"1px 5px",borderRadius:4}}>
                                {t('private_badge')}
                              </span>
                            )}
                            <span style={{color:T.ink3,fontSize:11}}>{t('by_author')} @{pack.owner}</span>
                          </div>
                          {pack.description && (
                            <div style={{fontSize:12.5,color:T.ink2,marginTop:3,lineHeight:1.4}}>{pack.description}</div>
                          )}
                          
                          <div style={{display:"flex",gap:8,marginTop:10}}>
                            <button 
                              style={Object.assign({}, S.miniBtn, {
                                background: isCurrentActive ? T.forest : "transparent",
                                color: isCurrentActive ? T.paper : T.forest,
                                border: "1px solid " + T.forest,
                                padding: "4px 10px",
                                display: "flex",
                                alignItems: "center",
                                gap: 6
                              })}
                              onClick={function(){
                                props.onSelectMapPack(isCurrentActive ? null : pack);
                              }}
                            >
                              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-1.447-.894L15 9m0 8V9m0 0L9 7" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                              <span>{isCurrentActive ? (lang === 'es' ? "Colección Activa" : "Active Collection") : (lang === 'es' ? "Ver en el mapa" : "View on Map")}</span>
                            </button>
                          </div>
                        </div>
                        {user && pack.owner === uname && (
                          <button 
                            style={{background:"none",border:"none",color:"#c05050",cursor:"pointer",padding:4,display:"flex",alignItems:"center",justifyContent:"center"}}
                            onClick={function(){
                              if(confirm(t('delete_collection_confirm'))){
                                props.onDeleteMapPack(pack.id);
                              }
                            }}
                            title={lang === 'es' ? "Eliminar colección" : "Delete collection"}
                          >
                            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-6 5v6m4-6v6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Following ──────────────────────────────────────────────────────────── */}
      {!editingProfile && userFollows.length>0 && (
        <div style={{borderBottom:"1px solid "+T.borderSoft}}>
          <div
            style={{padding:"16px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}
            onClick={function(){ setFollowingCollapsed(function(v){ return !v; }); }}
          >
            <div style={S.secHead}>{(lang === 'es' ? "Siguiendo" : "Following") + " · " + userFollows.length}</div>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{transition:"transform 0.2s",transform:followingCollapsed?"rotate(0deg)":"rotate(180deg)"}}>
              <path d="M6 9l6 6 6-6" stroke={T.ink3} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {!followingCollapsed && (
            <div style={{padding:"0 22px 12px"}}>
              {(showAllFollowing ? userFollows : userFollows.slice(0,10)).map(function(f){
                var bellKey = "pm-bell-notify-"+f.following;
                var bellOn = localStorage.getItem(bellKey) !== "0";
                return (
                  <div key={f.following} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid "+T.borderSoft,cursor:"pointer"}} onClick={() => loadUserProfile(f.following)}>
                    <div style={{width:40,height:40,borderRadius:20,background:T.forestPale,color:T.forest,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,flexShrink:0}}>
                      {f.following[0].toUpperCase()}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:15,color:T.ink}}>{f.following}</div>
                      <div style={{fontSize:11,color:bellOn?T.forest:T.ink4,marginTop:2,display:"flex",alignItems:"center",gap:4}}>
                        {bellOn 
                          ? <><svg width={11} height={11} viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"/></svg>{lang === 'es' ? "Notificando" : "Notifying"}</>
                          : <><svg width={11} height={11} viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><path d="M13.73 21a2 2 0 0 1-3.46 0M18.8 13A6 6 0 0 0 6 8c0 1.25.25 2.44.7 3.5M3 17h14M18 8c0 3 .66 5.5 1.5 7M2 2l20 20" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"/></svg>{lang === 'es' ? "Silenciado" : "Muted"}</>
                        }
                      </div>
                    </div>
                    <button
                      title={lang === 'es' ? "Ver pines en el mapa" : "View pins on map"}
                      style={{width:34,height:34,borderRadius:8,border:"1px solid "+T.border,
                        background:"transparent",
                        display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,color:T.forest}}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        focusUserPins(f.following);
                      }}
                    >
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" fill="currentColor"/></svg>
                    </button>
                    <button
                      title={bellOn ? (lang === 'es' ? "Silenciar notificaciones de nuevos pines" : "Mute new pin notifications") : (lang === 'es' ? "Recibir notificaciones de nuevos pines" : "Get notified of new pins")}
                      style={{width:34,height:34,borderRadius:8,border:"1px solid "+(bellOn?T.forest:T.border),
                        background:bellOn?T.forestPale:"transparent",
                        display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,color:bellOn?T.forest:T.ink3}}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        var next = bellOn ? "0" : "1";
                        localStorage.setItem(bellKey, next);
                        flash(next === "1" ? (lang === 'es' ? "🔔 Notificaciones ACTIVADAS para @" + f.following : "🔔 Notifications ON for @" + f.following) : (lang === 'es' ? "🔕 Silenciado @" + f.following : "🔕 Muted @" + f.following));
                        setShowAllFollowing(function(v){return v;});
                      }}
                    >
                      {bellOn 
                        ? <svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                        : <svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><path d="M13.73 21a2 2 0 0 1-3.46 0M18.8 13A6 6 0 0 0 6 8c0 1.25.25 2.44.7 3.5M3 17h14M18 8c0 3 .66 5.5 1.5 7M2 2l20 20" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                      }
                    </button>
                    <button
                      style={{padding:"6px 14px",borderRadius:10,border:"1px solid "+T.border,background:"transparent",fontSize:13,cursor:"pointer",color:T.ink2}}
                      onClick={(ev) => {ev.stopPropagation();toggleUserFollow(f.following);}}
                    >
                      {lang === 'es' ? "Siguiendo" : "Following"}
                    </button>
                  </div>
                );
              })}
              {!showAllFollowing && userFollows.length > 10 && (
                <button style={{width:"100%",padding:"12px",marginTop:12,borderRadius:10,border:"1px solid "+T.borderSoft,background:T.paper2,color:T.ink2,fontSize:13,fontWeight:600,cursor:"pointer"}} onClick={() => setShowAllFollowing(true)}>
                  {(lang === 'es' ? "Mostrar todos: " : "Show all ") + userFollows.length}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Followers ──────────────────────────────────────────────────────────── */}
      {!editingProfile && followers.length>0 && (
        <div style={{borderBottom:"1px solid "+T.borderSoft}}>
          <div
            style={{padding:"16px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}
            onClick={function(){ setFollowersCollapsed(function(v){ return !v; }); }}
          >
            <div style={S.secHead}>{(lang === 'es' ? "Seguidores" : "Followers") + " · " + followers.length}</div>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{transition:"transform 0.2s",transform:followersCollapsed?"rotate(0deg)":"rotate(180deg)"}}>
              <path d="M6 9l6 6 6-6" stroke={T.ink3} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {!followersCollapsed && (
            <div style={{padding:"0 22px 12px"}}>
              {(showAllFollowers ? followers : followers.slice(0,10)).map(function(f){
                var isFollowingBack = userFollows.some(function(uf){return uf.following === f.owner;});
                return (
                  <div key={f.owner} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid "+T.borderSoft,cursor:"pointer"}} onClick={() => loadUserProfile(f.owner)}>
                    <div style={{width:40,height:40,borderRadius:20,background:T.forestPale,color:T.forest,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,flexShrink:0}}>
                      {f.owner[0].toUpperCase()}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:15,color:T.ink}}>{f.owner}</div>
                    </div>
                    <button
                      style={{padding:"6px 14px",borderRadius:10,border:"1px solid "+(isFollowingBack?T.border:T.forest),background:isFollowingBack?"transparent":T.forestPale,fontSize:13,cursor:"pointer",color:isFollowingBack?T.ink2:T.forest,fontWeight:isFollowingBack?400:600}}
                      onClick={(ev) => {ev.stopPropagation();toggleUserFollow(f.owner);}}
                    >
                      {isFollowingBack ? (lang === 'es' ? "Siguiendo" : "Following") : (lang === 'es' ? "Seguir" : "Follow")}
                    </button>
                  </div>
                );
              })}
              {!showAllFollowers && followers.length > 10 && (
                <button style={{width:"100%",padding:"12px",marginTop:12,borderRadius:10,border:"1px solid "+T.borderSoft,background:T.paper2,color:T.ink2,fontSize:13,fontWeight:600,cursor:"pointer"}} onClick={() => setShowAllFollowers(true)}>
                  {(lang === 'es' ? "Mostrar todos: " : "Show all ") + followers.length}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Settings ───────────────────────────────────────────────────────────── */}
      {!editingProfile && (
        <div style={{padding:"0 22px",borderBottom:"1px solid "+T.borderSoft}}>
          <div style={Object.assign({}, S.secHead, {padding:"20px 0 8px"})}>{t('settings')}</div>
          
          {/* Language Setting Dropdown */}
          <div style={{display:"flex",alignItems:"center",padding:"14px 0",borderBottom:"1px solid "+T.borderSoft}}>
            <div style={{flex:1,fontSize:15,color:T.ink}}>{lang === 'es' ? "Idioma" : "Language"}</div>
            <select
              style={{
                background: "transparent",
                color: T.ink,
                border: "1px solid " + T.border,
                borderRadius: 8,
                padding: "4px 8px",
                fontSize: 13,
                outline: "none",
                cursor: "pointer"
              }}
              value={lang}
              onChange={function(e) {
                var val = e.target.value;
                setLang(val);
                localStorage.setItem("pm-lang", val);
              }}
            >
              <option value="en" style={{background: T.paper, color: T.ink}}>🇺🇸 English</option>
              <option value="es" style={{background: T.paper, color: T.ink}}>🇪🇸 Español</option>
            </select>
          </div>

          <div style={{display:"flex",alignItems:"center",padding:"14px 0",borderBottom:"1px solid "+T.borderSoft}}>
            <div style={{flex:1,fontSize:15,color:T.ink}}>{t('push_notifications')}</div>
            {pushEnabled ? (
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{fontSize:13,color:T.forest,cursor:"pointer"}} onClick={()=>flash(lang === 'es' ? "Para desactivar: toca 🔒 en la barra de direcciones de tu navegador → Notificaciones → Bloquear" : "To disable: tap 🔒 in your browser address bar → Notifications → Block")}>{lang === 'es' ? "Activadas" : "On"}</div>
                <div style={{color:T.ink3,fontSize:16}}>{">"}</div>
              </div>
            ) : (
              <button 
                style={{fontSize:13,color:T.ink3,background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:6}}
                onClick={() => {
                  if(!("Notification" in window)){flash(lang === 'es' ? "No soportado en este navegador" : "Not supported on this browser");return;}
                  if(Notification.permission==="denied"){flash(lang === 'es' ? "Bloqueado — ve a la Configuración del navegador → Configuración del Sitio → Notificaciones → Permitir" : "Blocked — go to browser Settings → Site Settings → Notifications → Allow");return;}
                  subscribeToPush(uname).then(function(){if(Notification.permission==="granted"){setPushEnabled(true);flash(lang === 'es' ? "¡Activado!" : "Enabled!");}});
                }}
              >
                {lang === 'es' ? "Activar" : "Enable"} <div style={{color:T.ink3,fontSize:16}}>{">"}</div>
              </button>
            )}
          </div>
          
          <div style={{display:"flex",alignItems:"center",padding:"14px 0",borderBottom:"1px solid "+T.borderSoft,cursor:"pointer"}} onClick={()=>{localStorage.removeItem("pm-onboarded-v5");setOnboardStep(0);setOpen(false);}}>
            <div style={{flex:1,fontSize:15,color:T.ink}}>{lang === 'es' ? "Tutorial interactivo" : "Interactive Tutorial"}</div>
            <div style={{fontSize:13,color:T.ink3,display:"flex",alignItems:"center",gap:6}}>{lang === 'es' ? "Repetir" : "Replay"} <div style={{color:T.ink3,fontSize:16}}>{">"}</div></div>
          </div>
          
          <div style={{display:"flex",alignItems:"center",padding:"14px 0",borderBottom:"1px solid "+T.borderSoft,cursor:"pointer"}} onClick={()=>{setShowFeatures(true);setOpen(false);}}>
            <div style={{flex:1,fontSize:15,color:T.ink}}>{lang === 'es' ? "Todas las funciones" : "All features"}</div>
            <div style={{fontSize:13,color:T.ink3,display:"flex",alignItems:"center",gap:6}}>{lang === 'es' ? "Ver" : "View"} <div style={{color:T.ink3,fontSize:16}}>{">"}</div></div>
          </div>
          
          <div style={{display:"flex",alignItems:"center",padding:"14px 0",borderBottom:"1px solid "+T.borderSoft,cursor:"pointer"}} onClick={()=>setShowImport(true)}>
            <div style={{flex:1}}>
              <div style={{fontSize:15,color:T.ink}}>{lang === 'es' ? "Importar Pines" : "Import Pins"}</div>
              <div style={{fontSize:12,color:T.ink3,marginTop:2}}>KML · GPX · GeoJSON · CSV</div>
            </div>
            <div style={{fontSize:13,color:T.ink3,display:"flex",alignItems:"center",gap:6}}>{lang === 'es' ? "Importar" : "Import"} <div style={{color:T.ink3,fontSize:16}}>{">"}</div></div>
          </div>
 
          {/* Offline Maps */}
          <div style={{padding:"16px 0"}}>
            <div style={Object.assign({}, S.secHead, {marginBottom:10})}>{lang === 'es' ? "Mapas sin conexión" : "Offline Maps"}</div>
            <div style={{fontSize:12,color:T.ink3,marginBottom:12,lineHeight:1.5}}>{lang === 'es' ? "Guarda imágenes del mapa para usarlas sin señal. Navega a tu destino y luego descarga." : "Cache map tiles for use without a signal. Navigate to your destination, then download."}</div>
            <div style={{display:"flex",gap:8}}>
              <button
                style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"11px 0",borderRadius:10,border:"none",background:T.forest,color:T.paper,fontSize:13,fontWeight:600,cursor:"pointer"}}
                onClick={onStartOfflineMode}
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none"><path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                {lang === 'es' ? "Descargar región" : "Download Region"}
              </button>
              <button
                style={{padding:"11px 14px",borderRadius:10,border:"1px solid "+T.border,background:"transparent",color:T.ink3,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}
                onClick={onPurgeOfflineTiles}
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                {lang === 'es' ? "Limpiar" : "Purge"}
              </button>
            </div>
          </div>
          
          <div style={{display:"flex",alignItems:"center",padding:"14px 0"}}>
            <div style={{flex:1,fontSize:15,color:T.ink}}>{lang === 'es' ? "Acerca de" : "About"}</div>
            <div style={{fontSize:13,color:T.ink3,display:"flex",alignItems:"center",gap:6}}>v {APP_VERSION} <div style={{color:T.ink3,fontSize:16}}>{">"}</div></div>
          </div>
 
          <div style={{display:"flex",alignItems:"center",padding:"14px 0",cursor:"pointer"}} onClick={function(){window.open("https://pin-map.com/privacy","_blank");}}>
            <div style={{flex:1,fontSize:15,color:T.ink}}>{t('privacy_policy')}</div>
            <div style={{color:T.ink3,fontSize:16}}>{">"}</div>
          </div>
 
          <div style={{display:"flex",alignItems:"center",padding:"14px 0",cursor:"pointer"}} onClick={function(){window.open("https://pin-map.com/terms","_blank");}}>
            <div style={{flex:1,fontSize:15,color:T.ink}}>{t('terms_service')}</div>
            <div style={{color:T.ink3,fontSize:16}}>{">"}</div>
          </div>
 
          {user && (
            <div style={{display:"flex",alignItems:"center",padding:"14px 0",cursor:"pointer"}} onClick={props.onDeleteAccount}>
              <div style={{flex:1,fontSize:15,color:"#c05050",fontWeight:600}}>{t('delete_account')}</div>
              <div style={{color:"#c05050",fontSize:16}}>{">"}</div>
            </div>
          )}
        </div>
      )}
 
      {/* ── Sign out / sign in ──────────────────────────────────────────────────── */}
      {!editingProfile && (
        <div style={{padding:"20px 22px",borderBottom:"1px solid "+T.borderSoft}}>
          {user 
            ? <button style={{width:"100%",padding:"12px",borderRadius:10,border:"1px solid "+T.border,background:"transparent",fontSize:14,color:T.ink2,cursor:"pointer"}} onClick={props.onSignOut}>{lang === 'es' ? "Cerrar sesión" : "Sign out"}</button>
            : <button style={Object.assign({},S.btn,{width:"100%"})} onClick={api.signInGoogle}>{lang === 'es' ? "Iniciar sesión con Google" : "Sign in with Google"}</button>
          }
        </div>
      )}
 
      {/* ── Footer ──────────────────────────────────────────────────────────────── */}
      <div style={{padding:"32px 22px",textAlign:"center",color:T.ink4,fontSize:10,lineHeight:1.7,fontFamily:T.mono,letterSpacing:"0.1em",textTransform:"uppercase"}}>
        {"PINMAP · V " + APP_VERSION + " · Built May 2026"}<br/>
        © 2026 Seth Gray · All rights reserved
      </div>
      {/* ── Create Pack Modal ────────────────────────────────────────────────── */}
      {showCreatePackModal && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(26,32,28,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100,padding:16}}>
          <div style={{background:T.paper,border:"2px solid "+T.forest,borderRadius:16,padding:20,width:"100%",maxWidth:400,boxShadow:T.shadowLg}}>
            <div style={{fontSize:16,fontWeight:700,color:T.ink,marginBottom:14,fontFamily:T.mono,letterSpacing:"0.02em"}}>{lang === 'es' ? "Crear Nueva Colección" : "Create New Collection"}</div>
            
            <div style={{marginBottom:12}}>
              <label style={{fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,display:"block",marginBottom:4}}>{t('collection_name')}</label>
              <input 
                type="text" 
                style={S.input} 
                placeholder={lang === 'es' ? "ej. Mejores Caminatas, Ruta de Café" : "e.g. Best Hikes, Coffee Crawl"} 
                value={packName}
                onChange={function(e){ setPackName(e.target.value); }}
              />
            </div>
            
            <div style={{marginBottom:12}}>
              <label style={{fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,display:"block",marginBottom:4}}>{t('collection_desc')}</label>
              <textarea 
                style={S.textarea} 
                placeholder={lang === 'es' ? "Describe tu lista curada de lugares..." : "Describe your curated list of spots..."} 
                rows={3}
                value={packDesc}
                onChange={function(e){ setPackDesc(e.target.value); }}
              />
            </div>
 
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <input 
                type="checkbox" 
                id="isPublicPack"
                checked={packPublic}
                onChange={function(e){ setPackPublic(e.target.checked); }}
                style={{width:16,height:16,accentColor:T.forest}}
              />
              <label htmlFor="isPublicPack" style={{fontSize:13.5,color:T.ink,cursor:"pointer"}}>{lang === 'es' ? "Hacer colección pública para que cualquiera la vea" : "Make collection public for anyone to view"}</label>
            </div>
 
            <div style={{display:"flex",gap:8}}>
              <button 
                style={Object.assign({}, S.btn, {flex:1})}
                onClick={function(){
                  if(!packName.trim()){ flash(lang === 'es' ? "¡El nombre de la colección es obligatorio!" : "Collection name is required!"); return; }
                  props.onCreateMapPack({
                    id: Math.random().toString(36).slice(2, 10),
                    name: packName.trim(),
                    description: packDesc.trim(),
                    is_public: packPublic,
                    owner: uname
                  });
                  setPackName("");
                  setPackDesc("");
                  setPackPublic(true);
                  setShowCreatePackModal(false);
                }}
              >
                {t('confirm_create_collection')}
              </button>
              <button 
                style={Object.assign({}, S.btnOutline, {flex:1})}
                onClick={function(){ setShowCreatePackModal(false); }}
              >
                {t('cancel_collection')}
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* ── Create Challenge Modal ────────────────────────────────────────────── */}
      {showCreateChallengeModal && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(26,32,28,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100,padding:16}}>
          <div style={{background:T.paper,border:"2px solid "+T.forest,borderRadius:16,padding:20,width:"100%",maxWidth:400,boxShadow:T.shadowLg,maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{fontSize:16,fontWeight:700,color:T.ink,marginBottom:14,fontFamily:T.mono,letterSpacing:"0.02em"}}>{t('design_quest')}</div>
            
            <div style={{marginBottom:12}}>
              <label style={{fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,display:"block",marginBottom:4}}>{lang === 'es' ? "Nombre de la Búsqueda" : "Quest Name"}</label>
              <input 
                type="text" 
                style={S.input} 
                placeholder={lang === 'es' ? "ej. Cazador de Cascadas, Tour de Cafés" : "e.g. Waterfall Chaser, Cafe Tour"} 
                value={chalTitle}
                onChange={function(e){ setChalTitle(e.target.value); }}
              />
            </div>
            
            <div style={{marginBottom:12}}>
              <label style={{fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,display:"block",marginBottom:4}}>{t('quest_desc')}</label>
              <input 
                type="text" 
                style={S.input} 
                placeholder={lang === 'es' ? "ej. Visita 3 pines con la etiqueta #cascada" : "e.g. Check in to 3 pins tagged with #waterfall"} 
                value={chalDesc}
                onChange={function(e){ setChalDesc(e.target.value); }}
              />
            </div>
 
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div>
                <label style={{fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,display:"block",marginBottom:4}}>{t('quest_icon')}</label>
                <input 
                  type="text" 
                  style={S.input} 
                  maxLength={2}
                  placeholder="🧗, 🗺️, 🏕️, 🥪" 
                  value={chalIcon}
                  onChange={function(e){ setChalIcon(e.target.value); }}
                />
              </div>
              <div>
                <label style={{fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,display:"block",marginBottom:4}}>{t('quest_required_count')}</label>
                <select 
                  style={Object.assign({}, S.input, {padding:"10px 14px", height:43})}
                  value={chalCount}
                  onChange={function(e){ setChalCount(parseInt(e.target.value)); }}
                >
                  <option value={1}>{lang === 'es' ? "1 Visita" : "1 Check-in"}</option>
                  <option value={2}>{lang === 'es' ? "2 Visitas" : "2 Check-ins"}</option>
                  <option value={3}>{lang === 'es' ? "3 Visitas" : "3 Check-ins"}</option>
                  <option value={5}>{lang === 'es' ? "5 Visitas" : "5 Check-ins"}</option>
                  <option value={10}>{lang === 'es' ? "10 Visitas" : "10 Check-ins"}</option>
                </select>
              </div>
            </div>
 
            <div style={{marginBottom:16}}>
              <label style={{fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,display:"block",marginBottom:4}}>{lang === 'es' ? "Hashtags requeridos (separados por coma)" : "Required Hashtags (comma-separated)"}</label>
              <input 
                type="text" 
                style={S.input} 
                placeholder={lang === 'es' ? "ej. cascada, lago, rio" : "e.g. waterfall, lake, river"} 
                value={chalTag}
                onChange={function(e){ setChalTag(e.target.value); }}
              />
            </div>
 
            <div style={{display:"flex",gap:8}}>
              <button 
                style={Object.assign({}, S.btn, {flex:1})}
                onClick={function(){
                  if(!chalTitle.trim()){ flash(lang === 'es' ? "¡El nombre de la búsqueda es obligatorio!" : "Quest name is required!"); return; }
                  var parsedTags = chalTag.split(",")
                    .map(function(t){ return t.trim().toLowerCase().replace("#", ""); })
                    .filter(function(t){ return t.length > 0; });
                  if(parsedTags.length === 0){ flash(lang === 'es' ? "¡Se requiere al menos un hashtag!" : "At least one required hashtag is required!"); return; }
                  
                  props.onCreateChallenge({
                    id: Math.random().toString(36).slice(2, 10),
                    title: chalTitle.trim(),
                    description: chalDesc.trim() || (lang === 'es' ? ("Visita " + chalCount + " pines con las etiquetas objetivo") : ("Check in to " + chalCount + " pins with target tags")),
                    icon: chalIcon.trim() || "🏆",
                    tags: parsedTags,
                    required_count: chalCount,
                    owner: uname
                  });
                  setChalTitle("");
                  setChalDesc("");
                  setChalIcon("🏆");
                  setChalTag("");
                  setChalCount(3);
                  setShowCreateChallengeModal(false);
                }}
              >
                {t('quest_create')}
              </button>
              <button 
                style={Object.assign({}, S.btnOutline, {flex:1})}
                onClick={function(){ setShowCreateChallengeModal(false); }}
              >
                {t('quest_cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Help Explainer Modal ────────────────────────────────────────────── */}
      {helpPopup && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(26,32,28,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1200,padding:16}} onClick={function(){ setHelpPopup(null); }}>
          <div style={{background:T.paper,border:"2px solid "+T.forest,borderRadius:16,padding:22,width:"100%",maxWidth:400,boxShadow:T.shadowLg,animation:"slideUp 0.3s ease-out"}} onClick={function(e){ e.stopPropagation(); }}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <span style={{fontSize:28}}>{helpPopup.emoji}</span>
              <div style={{fontSize:16,fontWeight:700,color:T.ink,fontFamily:T.mono,letterSpacing:"0.02em"}}>{helpPopup.title}</div>
            </div>
            <div style={{fontSize:13.5,color:T.ink2,lineHeight:1.6,marginBottom:18}}>{helpPopup.desc}</div>
            <button 
              style={Object.assign({}, S.btn, {width:"100%"})}
              onClick={function(){ setHelpPopup(null); }}
            >
              {t('got_it')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
