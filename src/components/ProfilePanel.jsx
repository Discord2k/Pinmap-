import React from 'react';
import { userAvatar, userName, dlFile, toGeoJSON, toGPX } from '../utils/helpers';
import { api, subscribeToPush } from '../utils/api';
import { T, S } from '../utils/styles';

export function ProfilePanel(props) {
  var user = props.user, uname = props.uname, myPins = props.myPins;
  var userFollows = props.userFollows || [];
  var toggleUserFollow = props.toggleUserFollow || function(){};
  var loadUserProfile = props.loadUserProfile || function(){};
  var pushEnabled = props.pushEnabled || false;
  var setPushEnabled = props.setPushEnabled || function(){};
  var flash = props.flash || function(){};
  var savedPins = props.savedPins || [];
  var toggleSavePin = props.toggleSavePin || function(){};
  var setOnboardStep = props.setOnboardStep || function(){};
  var setShowWhatsNew = props.setShowWhatsNew || function(){};
  var setOpen = props.setOpen || function(){};
  var setShowFeatures = props.setShowFeatures || function(){};
  var setMyProfile = props.setMyProfile || function(){};
  var setShowImport = props.setShowImport || function(){};
  var myProfile = props.myProfile || null;
  var editingProfile = props.editingProfile || false;
  var setEditingProfile = props.setEditingProfile || function(){};
  var profileForm = props.profileForm || {};
  var setProfileForm = props.setProfileForm || function(){};
  var saveProfile = props.saveProfile || function(){};
  
  var own = myPins.filter(function(p){return !p.saved_from;});
  var saved = myPins.filter(function(p){return p.saved_from;});
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
                  ? <textarea style={S.textarea} placeholder={field[2]} rows={3} value={profileForm[field[0]]||""} onChange={(ev)=>{var k=field[0];var v=ev.target.value;setProfileForm(function(f){return Object.assign({},f,Object.fromEntries([[k,v]]));});}} />
                  : <input style={S.input} placeholder={field[2]} value={profileForm[field[0]]||""} onChange={(ev)=>{var k=field[0];var v=ev.target.value;setProfileForm(function(f){return Object.assign({},f,Object.fromEntries([[k,v]]));})}} />
                }
              </div>
            );
          })}
          
          <div style={{display:"flex",gap:8}}>
            <button style={Object.assign({},S.btn,{flex:1})} onClick={() => {
              var profile=Object.assign({id:uname,updated_at:new Date().toISOString()},profileForm);
              api.upsertProfile(profile).then(function(r){
                if(r&&r.error) flash("Save failed: "+r.error.message);
                else { setMyProfile(profile); setEditingProfile(false); flash("Profile saved!"); }
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

      {/* ── Following ───────────────────────────────────────────────────────────── */}
      {!editingProfile && userFollows.length>0 && (
        <div style={{padding:"20px 22px",borderBottom:"1px solid "+T.borderSoft}}>
          <div style={{fontSize:10.5,letterSpacing:"0.14em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,fontWeight:600,marginBottom:12}}>{"Following · "+userFollows.length}</div>
          {userFollows.map(function(f){
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
          
          <div style={{display:"flex",alignItems:"center",padding:"14px 0"}}>
            <div style={{flex:1,fontSize:15,color:T.ink}}>About</div>
            <div style={{fontSize:13,color:T.ink3,display:"flex",alignItems:"center",gap:6}}>v 1.0.0 <div style={{color:T.ink3,fontSize:16}}>{">"}</div></div>
          </div>
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
        PINMAP · V 1.0.0 · Built May 2026<br/>
        © 2026 Seth Gray · All rights reserved
      </div>
    </div>
  );
}
