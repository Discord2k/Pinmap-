import React from 'react';
import { userAvatar, APP_VERSION } from '../utils/helpers';
import { api, subscribeToPush } from '../utils/api';
import { T, S } from '../utils/styles';
import { UserBadges } from './UserBadges';

export function ProfilePanel(props) {
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
  
  var toggleUserFollow = props.toggleUserFollow || function(){};
  var loadUserProfile = props.loadUserProfile || function(){};
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
  
  var avatar = userAvatar(user);
  var myStats = [
    {v:own.length, l:"Pins"},
    {v:own.filter(function(p){return p.privacy==="public";}).length, l:"Public"},
    {v:savedPins.length, l:"Saved"},
    {v:upvotes, l:"Upvotes"}
  ];

  return (
    <div style={{height:"100%",overflowY:"auto",background:T.paper}}>
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 22px 16px",borderBottom:"1px solid "+T.borderSoft}}>
        <div style={{fontSize:10.5,letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600,color:T.ink3,fontFamily:T.mono}}>Profile</div>
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
            Edit
          </button>
        )}
      </div>

      {/* ── Identity ──────────────────────────────────────────────────────────── */}
      <div style={{padding:"20px 22px",borderBottom:"1px solid "+T.borderSoft}}>
        <div style={{display:"flex",gap:14,alignItems:"flex-start",marginBottom:16}}>
          {/* Avatar */}
          <div style={{width:64,height:64,borderRadius:32,background:avatar?"transparent":T.forest,
            color:T.paper,display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:28,fontWeight:700,flexShrink:0,overflow:"hidden",border:"2px solid "+T.borderSoft}}>
            {avatar 
              ? <img src={avatar} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={(ev)=>{ev.target.style.display="none";}} />
              : (uname&&uname!=="guest"?uname[0].toUpperCase():"?")
            }
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:22,fontWeight:700,color:T.ink,lineHeight:1.1,marginBottom:4}}>
              {uname&&uname!=="guest"?uname:"Guest"}
            </div>
            {user && <div style={{fontSize:13,color:T.ink3}}>{"@"+(uname||"").toLowerCase().replace(/ /g,".")}</div>}
            <div style={{fontSize:10,color:T.ink3,marginTop:4,fontFamily:T.mono,letterSpacing:"0.1em",textTransform:"uppercase"}}>
              {myProfile&&myProfile.location?myProfile.location:"PINMAP Member"}
            </div>
          </div>
        </div>
        
        {/* Bio */}
        {myProfile&&myProfile.bio 
          ? <div style={{fontSize:14.5,color:T.ink2,lineHeight:1.55}}>{myProfile.bio}</div>
          : !editingProfile && <div style={{fontSize:13,color:T.ink3,fontStyle:"italic"}}>No bio yet — tap Edit to add one.</div>
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
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
            <div style={{width:52,height:52,borderRadius:26,overflow:"hidden",background:T.forestPale,flexShrink:0,border:"2px solid "+T.borderSoft}}>
              <img 
                src={profileForm.avatar_url||avatar||"https://ui-avatars.com/api/?name="+encodeURIComponent(uname)+"&background=2a5d3c&color=fff&size=52"}
                style={{width:"100%",height:"100%",objectFit:"cover"}} 
              />
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,marginBottom:6}}>Photo</div>
              <input type="file" accept="image/*" style={{fontSize:11,color:T.ink3,width:"100%"}} onChange={(ev) => {
                var file=ev.target.files[0]; if(!file) return;
                var reader=new FileReader();
                reader.onload=function(e2){
                  var img=new Image();
                  img.onload=function(){
                    var MAX=256,w=img.width,h=img.height;
                    if(w>MAX||h>MAX){if(w>h){h=Math.round(h*MAX/w);w=MAX;}else{w=Math.round(w*MAX/h);h=MAX;}}
                    var canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
                    canvas.getContext("2d").drawImage(img,0,0,w,h);
                    canvas.toBlob(function(blob){
                      var path="avatars/"+uname.replace(/ /g,"-").toLowerCase()+".jpg";
                      fetch("https://uuxggoydnjvsssbenkkt.supabase.co/storage/v1/object/pin-images/"+path,{
                        method:"POST",headers:{"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1eGdnb3lkbmp2c3NzYmVua2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwODg4OTgsImV4cCI6MjA5MjY2NDg5OH0.VniG6qm6Z9spdezyw-85k4liEuyC9i3B_T2Pxo-9nK0","Content-Type":"image/jpeg","x-upsert":"true"},body:blob
                      }).then(function(){
                        var url="https://uuxggoydnjvsssbenkkt.supabase.co/storage/v1/object/public/pin-images/"+path+"?t="+Date.now();
                        setProfileForm(function(f){return Object.assign({},f,{avatar_url:url});});
                        flash("Photo uploaded!");
                      }).catch(function(){flash("Upload failed");});
                    },"image/jpeg",0.85);
                  };
                  img.src=e2.target.result;
                };
                reader.readAsDataURL(file);
              }} />
            </div>
          </div>
          
          {[["bio","Bio","Tell people about yourself…","textarea"],["location","Location","City, Country","text"],
            ["website","Website","yoursite.com","text"],["twitter","Twitter / X","username","text"],
            ["instagram","Instagram","username","text"]
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
              var profile=Object.assign({id:uname,updated_at:new Date().toISOString()},profileForm);
              console.log("🚀 SENDING PROFILE PAYLOAD:", profile);
              api.upsertProfile(profile).then(function(r){
                console.log("📥 SUPABASE RESPONSE:", r);
                if(r&&r.error) flash("Save failed: "+r.error.message);
                else { 
                  var savedData = (r.data && r.data.length > 0) ? r.data[0] : profile;
                  setMyProfile(savedData); 
                  setEditingProfile(false); 
                  flash("Profile saved!"); 
                }
              }).catch(function(e){flash("Save failed: "+e.message);});
            }}>Save</button>
            <button style={Object.assign({},S.btnOutline,{flex:1})} onClick={() => setEditingProfile(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Stats ──────────────────────────────────────────────────────────────── */}
      {!editingProfile && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",borderBottom:"1px solid "+T.borderSoft}}>
          {myStats.map(function(s,i){
            return (
              <div key={i} style={{textAlign:"center",padding:"18px 8px",borderRight:i<3?"1px solid "+T.borderSoft:"none"}}>
                <div style={{fontSize:24,fontWeight:700,color:T.ink,lineHeight:1}}>{s.v}</div>
                <div style={{fontSize:9.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,marginTop:4}}>{s.l}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Achievements ───────────────────────────────────────────────────────── */}
      {!editingProfile && (
        <div style={{padding:"0 22px 12px",borderBottom:"1px solid "+T.borderSoft}}>
          <UserBadges pinsCount={own.length} checkinsCount={props.checkinsCount || 0} />
        </div>
      )}

      {/* ── Explorer Challenges ────────────────────────────────────────────────── */}
      {!editingProfile && (
        <div style={{padding:"20px 22px",borderBottom:"1px solid "+T.borderSoft}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={S.secHead}>Explorer Quests</div>
            {user && (
              <button 
                style={Object.assign({}, S.miniBtn, {background: T.forestPale, color: T.forest, border: "none", display: "flex", alignItems: "center", gap: 4})}
                onClick={function(){ setShowCreateChallengeModal(true); }}
              >
                <span>➕ Design Quest</span>
              </button>
            )}
          </div>

          {challenges.length === 0 ? (
            <div style={{fontSize:13,color:T.ink3,textAlign:"center",padding:"12px 0",fontStyle:"italic"}}>No challenges available.</div>
          ) : (
            challenges.map(function(ch){
              var chTags = ch.tags || [];
              var checkedPinIds = checkins.map(function(c) { return c.pin_id; });
              var matchingPins = allPins.filter(function(p) {
                if (checkedPinIds.indexOf(p.id) < 0) return false;
                if (!p.tags) return false;
                return p.tags.some(function(t) { return chTags.indexOf(t) >= 0; });
              });
              var count = Math.min(matchingPins.length, ch.required_count || 3);
              var isDone = count >= (ch.required_count || 3);
              
              return (
                <div 
                  key={ch.id} 
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
                            Completed
                          </span>
                        )}
                        {ch.owner && ch.owner !== "system" && (
                          <span style={{color:T.ink3,fontSize:11}}>by @{ch.owner}</span>
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

                      {/* Progress Bar */}
                      <div style={{marginTop:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:10.5,color:T.ink3,fontFamily:T.mono,marginBottom:3}}>
                          <span>Progress</span>
                          <span style={{marginLeft:"auto"}}>{count} / {ch.required_count}</span>
                        </div>
                        <div style={{width:"100%",height:6,background:T.borderSoft,borderRadius:3,overflow:"hidden"}}>
                          <div style={{width:(count/(ch.required_count || 3)*100)+"%",height:"100%",background:isDone ? "#d4af37" : T.forest,borderRadius:3}} />
                        </div>
                      </div>
                    </div>
                    {user && ch.owner === uname && (
                      <button 
                        style={{background:"none",border:"none",color:"#c05050",cursor:"pointer",padding:4}}
                        onClick={function(){
                          if(confirm("Delete this challenge?")){
                            props.onDeleteChallenge(ch.id);
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

      {/* ── Guides & Map Packs ────────────────────────────────────────────────── */}
      {!editingProfile && (
        <div style={{padding:"20px 22px",borderBottom:"1px solid "+T.borderSoft}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={S.secHead}>Guides & Map Packs</div>
            {user && (
              <button 
                style={Object.assign({}, S.miniBtn, {background: T.forestPale, color: T.forest, border: "none", display: "flex", alignItems: "center", gap: 4})}
                onClick={function(){ setShowCreatePackModal(true); }}
              >
                <span>➕ Create Guide</span>
              </button>
            )}
          </div>

          {mapPacks.length === 0 ? (
            <div style={{fontSize:13,color:T.ink3,textAlign:"center",padding:"12px 0",fontStyle:"italic"}}>No curated guides yet.</div>
          ) : (
            mapPacks.map(function(pack){
              var isCurrentActive = activeMapPack && activeMapPack.id === pack.id;
              return (
                <div 
                  key={pack.id}
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
                            Private
                          </span>
                        )}
                        <span style={{color:T.ink3,fontSize:11}}>by @{pack.owner}</span>
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
                            padding: "4px 10px"
                          })}
                          onClick={function(){
                            props.onSelectMapPack(isCurrentActive ? null : pack);
                          }}
                        >
                          {isCurrentActive ? "🗺️ Active Guide" : "🗺️ View on Map"}
                        </button>
                      </div>
                    </div>
                    {user && pack.owner === uname && (
                      <button 
                        style={{background:"none",border:"none",color:"#c05050",cursor:"pointer",padding:4}}
                        onClick={function(){
                          if(confirm("Delete this guide?")){
                            props.onDeleteMapPack(pack.id);
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

      {/* ── Following ───────────────────────────────────────────────────────────── */}
      {!editingProfile && userFollows.length>0 && (
        <div style={{padding:"20px 22px",borderBottom:"1px solid "+T.borderSoft}}>
          <div style={{fontSize:10.5,letterSpacing:"0.14em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,fontWeight:600,marginBottom:12}}>{"Following · "+userFollows.length}</div>
          {(showAllFollowing ? userFollows : userFollows.slice(0,10)).map(function(f){
            return (
              <div key={f.following} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid "+T.borderSoft,cursor:"pointer"}} onClick={() => loadUserProfile(f.following)}>
                <div style={{width:40,height:40,borderRadius:20,background:T.forestPale,color:T.forest,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,flexShrink:0}}>
                  {f.following[0].toUpperCase()}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:15,color:T.ink}}>{f.following}</div>
                  <div style={{fontSize:13,color:T.ink3}}></div>
                </div>
                <button 
                  style={{padding:"6px 14px",borderRadius:10,border:"1px solid "+T.border,background:"transparent",fontSize:13,cursor:"pointer",color:T.ink2}}
                  onClick={(ev) => {ev.stopPropagation();toggleUserFollow(f.following);}}
                >
                  Following
                </button>
              </div>
            );
          })}
          {!showAllFollowing && userFollows.length > 10 && (
            <button style={{width:"100%",padding:"12px",marginTop:12,borderRadius:10,border:"1px solid "+T.borderSoft,background:T.paper2,color:T.ink2,fontSize:13,fontWeight:600,cursor:"pointer"}} onClick={() => setShowAllFollowing(true)}>
              Show all {userFollows.length}
            </button>
          )}
        </div>
      )}

      {/* ── Followers ───────────────────────────────────────────────────────────── */}
      {!editingProfile && followers.length>0 && (
        <div style={{padding:"20px 22px",borderBottom:"1px solid "+T.borderSoft}}>
          <div style={{fontSize:10.5,letterSpacing:"0.14em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,fontWeight:600,marginBottom:12}}>{"Followers · "+followers.length}</div>
          {(showAllFollowers ? followers : followers.slice(0,10)).map(function(f){
            var isFollowingBack = userFollows.some(function(uf){return uf.following === f.owner;});
            return (
              <div key={f.owner} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid "+T.borderSoft,cursor:"pointer"}} onClick={() => loadUserProfile(f.owner)}>
                <div style={{width:40,height:40,borderRadius:20,background:T.forestPale,color:T.forest,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,flexShrink:0}}>
                  {f.owner[0].toUpperCase()}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:15,color:T.ink}}>{f.owner}</div>
                  <div style={{fontSize:13,color:T.ink3}}></div>
                </div>
                <button 
                  style={{padding:"6px 14px",borderRadius:10,border:"1px solid "+(isFollowingBack?T.border:T.forest),background:isFollowingBack?"transparent":T.forestPale,fontSize:13,cursor:"pointer",color:isFollowingBack?T.ink2:T.forest,fontWeight:isFollowingBack?400:600}}
                  onClick={(ev) => {ev.stopPropagation();toggleUserFollow(f.owner);}}
                >
                  {isFollowingBack ? "Following" : "Follow"}
                </button>
              </div>
            );
          })}
          {!showAllFollowers && followers.length > 10 && (
            <button style={{width:"100%",padding:"12px",marginTop:12,borderRadius:10,border:"1px solid "+T.borderSoft,background:T.paper2,color:T.ink2,fontSize:13,fontWeight:600,cursor:"pointer"}} onClick={() => setShowAllFollowers(true)}>
              Show all {followers.length}
            </button>
          )}
        </div>
      )}

      {/* ── Settings ───────────────────────────────────────────────────────────── */}
      {!editingProfile && (
        <div style={{padding:"0 22px",borderBottom:"1px solid "+T.borderSoft}}>
          <div style={{fontSize:10.5,letterSpacing:"0.14em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,fontWeight:600,padding:"20px 0 8px"}}>Settings</div>
          
          <div style={{display:"flex",alignItems:"center",padding:"14px 0",borderBottom:"1px solid "+T.borderSoft}}>
            <div style={{flex:1,fontSize:15,color:T.ink}}>Push notifications</div>
            {pushEnabled ? (
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{fontSize:13,color:T.forest,cursor:"pointer"}} onClick={()=>flash("To disable: tap 🔒 in your browser address bar → Notifications → Block")}>On</div>
                <div style={{color:T.ink3,fontSize:16}}>{">"}</div>
              </div>
            ) : (
              <button 
                style={{fontSize:13,color:T.ink3,background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:6}}
                onClick={() => {
                  if(!("Notification" in window)){flash("Not supported on this browser");return;}
                  if(Notification.permission==="denied"){flash("Blocked — go to browser Settings → Site Settings → Notifications → Allow");return;}
                  subscribeToPush(uname).then(function(){if(Notification.permission==="granted"){setPushEnabled(true);flash("Enabled!");}});
                }}
              >
                Enable <div style={{color:T.ink3,fontSize:16}}>{">"}</div>
              </button>
            )}
          </div>
          
          <div style={{display:"flex",alignItems:"center",padding:"14px 0",borderBottom:"1px solid "+T.borderSoft,cursor:"pointer"}} onClick={()=>{localStorage.removeItem("pm-onboarded-v5");setOnboardStep(0);setOpen(false);}}>
            <div style={{flex:1,fontSize:15,color:T.ink}}>Tutorial</div>
            <div style={{fontSize:13,color:T.ink3,display:"flex",alignItems:"center",gap:6}}>Replay <div style={{color:T.ink3,fontSize:16}}>{">"}</div></div>
          </div>
          
          <div style={{display:"flex",alignItems:"center",padding:"14px 0",borderBottom:"1px solid "+T.borderSoft,cursor:"pointer"}} onClick={()=>{setShowFeatures(true);setOpen(false);}}>
            <div style={{flex:1,fontSize:15,color:T.ink}}>All features</div>
            <div style={{fontSize:13,color:T.ink3,display:"flex",alignItems:"center",gap:6}}>View <div style={{color:T.ink3,fontSize:16}}>{">"}</div></div>
          </div>
          
          <div style={{display:"flex",alignItems:"center",padding:"14px 0",borderBottom:"1px solid "+T.borderSoft,cursor:"pointer"}} onClick={()=>setShowImport(true)}>
            <div style={{flex:1}}>
              <div style={{fontSize:15,color:T.ink}}>Import Pins</div>
              <div style={{fontSize:12,color:T.ink3,marginTop:2}}>KML · GPX · GeoJSON · CSV</div>
            </div>
            <div style={{fontSize:13,color:T.ink3,display:"flex",alignItems:"center",gap:6}}>Import <div style={{color:T.ink3,fontSize:16}}>{">"}</div></div>
          </div>

          {/* Offline Maps */}
          <div style={{padding:"16px 0"}}>
            <div style={{fontSize:10.5,letterSpacing:"0.14em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,fontWeight:600,marginBottom:10}}>Offline Maps</div>
            <div style={{fontSize:12,color:T.ink3,marginBottom:12,lineHeight:1.5}}>Cache map tiles for use without a signal. Navigate to your destination, then download.</div>
            <div style={{display:"flex",gap:8}}>
              <button
                style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"11px 0",borderRadius:10,border:"none",background:T.forest,color:T.paper,fontSize:13,fontWeight:600,cursor:"pointer"}}
                onClick={onStartOfflineMode}
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none"><path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                Download Region
              </button>
              <button
                style={{padding:"11px 14px",borderRadius:10,border:"1px solid "+T.border,background:"transparent",color:T.ink3,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}
                onClick={onPurgeOfflineTiles}
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                Purge
              </button>
            </div>
          </div>
          
          <div style={{display:"flex",alignItems:"center",padding:"14px 0"}}>
            <div style={{flex:1,fontSize:15,color:T.ink}}>About</div>
            <div style={{fontSize:13,color:T.ink3,display:"flex",alignItems:"center",gap:6}}>v {APP_VERSION} <div style={{color:T.ink3,fontSize:16}}>{">"}</div></div>
          </div>

          <div style={{display:"flex",alignItems:"center",padding:"14px 0",cursor:"pointer"}} onClick={function(){window.open("https://pin-map.com/privacy","_blank");}}>
            <div style={{flex:1,fontSize:15,color:T.ink}}>Privacy Policy</div>
            <div style={{color:T.ink3,fontSize:16}}>{">"}</div>
          </div>

          <div style={{display:"flex",alignItems:"center",padding:"14px 0",cursor:"pointer"}} onClick={function(){window.open("https://pin-map.com/terms","_blank");}}>
            <div style={{flex:1,fontSize:15,color:T.ink}}>Terms of Service</div>
            <div style={{color:T.ink3,fontSize:16}}>{">"}</div>
          </div>

          {user && (
            <div style={{display:"flex",alignItems:"center",padding:"14px 0",cursor:"pointer"}} onClick={props.onDeleteAccount}>
              <div style={{flex:1,fontSize:15,color:"#c05050",fontWeight:600}}>Delete Account</div>
              <div style={{color:"#c05050",fontSize:16}}>{">"}</div>
            </div>
          )}
        </div>
      )}

      {/* ── Sign out / sign in ──────────────────────────────────────────────────── */}
      {!editingProfile && (
        <div style={{padding:"20px 22px",borderBottom:"1px solid "+T.borderSoft}}>
          {user 
            ? <button style={{width:"100%",padding:"12px",borderRadius:10,border:"1px solid "+T.border,background:"transparent",fontSize:14,color:T.ink2,cursor:"pointer"}} onClick={props.onSignOut}>Sign out</button>
            : <button style={Object.assign({},S.btn,{width:"100%"})} onClick={api.signInGoogle}>Sign in with Google</button>
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
            <div style={{fontSize:16,fontWeight:700,color:T.ink,marginBottom:14,fontFamily:T.mono,letterSpacing:"0.02em"}}>Create New Guide</div>
            
            <div style={{marginBottom:12}}>
              <label style={{fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,display:"block",marginBottom:4}}>Guide Name</label>
              <input 
                type="text" 
                style={S.input} 
                placeholder="e.g. Best Hikes, Coffee Crawl" 
                value={packName}
                onChange={function(e){ setPackName(e.target.value); }}
              />
            </div>
            
            <div style={{marginBottom:12}}>
              <label style={{fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,display:"block",marginBottom:4}}>Description</label>
              <textarea 
                style={S.textarea} 
                placeholder="Describe your curated list of spots..." 
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
              <label htmlFor="isPublicPack" style={{fontSize:13.5,color:T.ink,cursor:"pointer"}}>Make guide public for anyone to view</label>
            </div>

            <div style={{display:"flex",gap:8}}>
              <button 
                style={Object.assign({}, S.btn, {flex:1})}
                onClick={function(){
                  if(!packName.trim()){ flash("Guide name is required!"); return; }
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
                Create
              </button>
              <button 
                style={Object.assign({}, S.btnOutline, {flex:1})}
                onClick={function(){ setShowCreatePackModal(false); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Challenge Modal ────────────────────────────────────────────── */}
      {showCreateChallengeModal && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(26,32,28,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100,padding:16}}>
          <div style={{background:T.paper,border:"2px solid "+T.forest,borderRadius:16,padding:20,width:"100%",maxWidth:400,boxShadow:T.shadowLg,maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{fontSize:16,fontWeight:700,color:T.ink,marginBottom:14,fontFamily:T.mono,letterSpacing:"0.02em"}}>Design Explorer Quest</div>
            
            <div style={{marginBottom:12}}>
              <label style={{fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,display:"block",marginBottom:4}}>Quest Name</label>
              <input 
                type="text" 
                style={S.input} 
                placeholder="e.g. Waterfall Chaser, Cafe Tour" 
                value={chalTitle}
                onChange={function(e){ setChalTitle(e.target.value); }}
              />
            </div>
            
            <div style={{marginBottom:12}}>
              <label style={{fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,display:"block",marginBottom:4}}>Description</label>
              <input 
                type="text" 
                style={S.input} 
                placeholder="e.g. Check in to 3 pins tagged with #waterfall" 
                value={chalDesc}
                onChange={function(e){ setChalDesc(e.target.value); }}
              />
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div>
                <label style={{fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,display:"block",marginBottom:4}}>Icon (Emoji)</label>
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
                <label style={{fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,display:"block",marginBottom:4}}>Required Count</label>
                <select 
                  style={Object.assign({}, S.input, {padding:"10px 14px", height:43})}
                  value={chalCount}
                  onChange={function(e){ setChalCount(parseInt(e.target.value)); }}
                >
                  <option value={1}>1 Check-in</option>
                  <option value={2}>2 Check-ins</option>
                  <option value={3}>3 Check-ins</option>
                  <option value={5}>5 Check-ins</option>
                  <option value={10}>10 Check-ins</option>
                </select>
              </div>
            </div>

            <div style={{marginBottom:16}}>
              <label style={{fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,display:"block",marginBottom:4}}>Required Hashtags (comma-separated)</label>
              <input 
                type="text" 
                style={S.input} 
                placeholder="e.g. waterfall, lake, river" 
                value={chalTag}
                onChange={function(e){ setChalTag(e.target.value); }}
              />
            </div>

            <div style={{display:"flex",gap:8}}>
              <button 
                style={Object.assign({}, S.btn, {flex:1})}
                onClick={function(){
                  if(!chalTitle.trim()){ flash("Quest name is required!"); return; }
                  var parsedTags = chalTag.split(",")
                    .map(function(t){ return t.trim().toLowerCase().replace("#", ""); })
                    .filter(function(t){ return t.length > 0; });
                  if(parsedTags.length === 0){ flash("At least one required hashtag is required!"); return; }
                  
                  props.onCreateChallenge({
                    id: Math.random().toString(36).slice(2, 10),
                    title: chalTitle.trim(),
                    description: chalDesc.trim() || ("Check in to " + chalCount + " pins with target tags"),
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
                Design Quest
              </button>
              <button 
                style={Object.assign({}, S.btnOutline, {flex:1})}
                onClick={function(){ setShowCreateChallengeModal(false); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
