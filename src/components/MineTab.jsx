import React, { useState } from 'react';
import { formatLL, dlFile, toGeoJSON, toGPX } from '../utils/helpers';
import { T } from '../utils/styles';

export function MineTab(props) {
  var myPins = props.myPins, myTags = props.myTags, uname = props.uname;
  var activeFilter = props.activeFilter, setActiveFilter = props.setActiveFilter;
  var mapObj = props.mapObj, setSelPin = props.setSelPin, setOpen = props.setOpen;
  var unreadPinIds = props.unreadPinIds || [];
  var commentCounts = props.commentCounts || {};
  var totalUpvotes = myPins.reduce(function(s,p){return s+((p.upvotes&&Array.isArray(p.upvotes))?p.upvotes.length:0);},0);
  
  var [expanded, setExpanded] = useState({});

  function toggleGroup(tag){
    setExpanded(function(prev){
      var next=Object.assign({},prev);
      next[tag]=!prev[tag];
      return next;
    });
  }

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      {/* ── Editorial header ───────────────────────────────────────────────────── */}
      <div style={{padding:"28px 22px 20px",borderBottom:"1px solid "+T.borderSoft,flexShrink:0}}>
        <div style={{fontSize:10.5,letterSpacing:"0.18em",color:T.ink3,textTransform:"uppercase",fontWeight:600,fontFamily:T.mono,marginBottom:8}}>
          Vol. II · Your Field Log
        </div>
        <div style={{fontSize:38,fontWeight:700,letterSpacing:"-0.02em",color:T.ink,lineHeight:1,marginBottom:10}}>My Pins</div>
        {myPins.length>0 && (
          <div style={{fontSize:14,color:T.ink3}}>
            {myPins.length+" entr"+(myPins.length===1?"y":"ies")+" · "+totalUpvotes+" upvote"+(totalUpvotes===1?"":"s")+" received"}
          </div>
        )}
      </div>

      {/* Topo divider */}
      <div style={{height:28,position:"relative",overflow:"hidden",flexShrink:0,borderBottom:"1px solid "+T.borderSoft}}>
        <svg width="100%" height="100%" viewBox="0 0 400 28" preserveAspectRatio="none" style={{position:"absolute",inset:0}}>
          <g fill="none" stroke={T.border} strokeWidth="0.7">
            <path d="M-10 22 Q 60 12 120 18 T 260 10 T 420 16"></path>
            <path d="M-10 16 Q 60 6 120 12 T 260 4 T 420 10"></path>
            <path d="M-10 10 Q 60 0 120 6 T 260 -2 T 420 4"></path>
          </g>
        </svg>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────────── */}
      {myPins.length === 0 ? (
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px",color:T.ink3}}>
          <div style={{fontSize:32,marginBottom:12}}>📍</div>
          <div style={{fontSize:15,fontWeight:600,color:T.ink2,marginBottom:6}}>No entries yet</div>
          <div style={{fontSize:13,color:T.ink3,lineHeight:1.6,textAlign:"center"}}>Touch the map to set a location, then fill in the details.</div>
        </div>
      ) : (
        <div style={{flex:1,overflowY:"auto"}}>
          {/* ── Tag groups ──────────────────────────────────────────────────── */}
          {myTags.map(function(tag){
            var tp = myPins.filter(function(p){return (p.tags||[]).indexOf(tag)>=0;});
            var tagHasUnread = tp.some(function(p){return unreadPinIds.indexOf(p.id)>=0;});
            var isOpen = expanded[tag]===true;
            var tagComments = tp.reduce(function(s,p){return s+(commentCounts[p.id]||0);},0);

            return (
              <div key={tag} style={{borderBottom:"1px solid "+T.borderSoft}}>
                {/* ── Group header ───────────────────────────── */}
                <div 
                  style={{display:"flex",alignItems:"center",gap:12,padding:"14px 22px",cursor:"pointer",background:tagHasUnread?"rgba(184,92,42,0.04)":T.paper}}
                  onClick={() => toggleGroup(tag)}
                >
                  <div style={{flex:1,display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:18}}></span>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontWeight:700,fontSize:16,color:T.ink}}>{"#"+tag}</span>
                        {activeFilter===tag && <span style={{fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:T.forest,background:T.forestPale,padding:"1px 6px",borderRadius:10,fontWeight:600}}>map</span>}
                        {tagHasUnread && <div style={{width:7,height:7,borderRadius:"50%",background:"#b85c2a",flexShrink:0}}></div>}
                      </div>
                      <div style={{fontSize:12,color:T.ink3,fontFamily:T.mono,marginTop:2}}>
                        {tp.length+" pin"+(tp.length!==1?"s":"")}
                        {tagComments>0?" · 💬 "+tagComments:""}
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                    <div style={{fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:600,fontFamily:T.mono,color:T.ink3,background:T.paper3,padding:"3px 10px",borderRadius:20}}>{tp.length}</div>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{transition:"transform 0.2s",transform:isOpen?"rotate(180deg)":"rotate(0deg)"}}>
                      <path d="M6 9l6 6 6-6" stroke={T.ink3} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </div>
                </div>

                {/* ── Pin entries ──────────────────────────────────────────── */}
                {isOpen && tp.map(function(p){
                  var entryNum = String(42+myPins.indexOf(p)).padStart(4,"0");
                  var commentCount = commentCounts[p.id]||0;
                  var upvoteCount = (p.upvotes&&Array.isArray(p.upvotes))?p.upvotes.length:0;
                  var pinHasUnread = unreadPinIds.indexOf(p.id)>=0;
                  var coordStr = p.lat&&p.lng?formatLL(p.lat, p.lng, 2):"";

                  return (
                    <div key={p.id}
                      style={{display:"flex",gap:14,padding:"14px 22px 14px 38px",borderTop:"1px solid "+T.borderSoft,cursor:"pointer",background:pinHasUnread?"rgba(184,92,42,0.03)":T.paper2}}
                      onClick={() => {
                        if(mapObj&&mapObj.current)mapObj.current.setView([p.lat,p.lng],14);
                        setSelPin(p);setOpen(false);
                        if(props.markCommentsSeen)props.markCommentsSeen();
                      }}
                    >
                      {/* Color dot */}
                      <div style={{width:8,height:8,borderRadius:"50%",background:p.color||T.forest,marginTop:7,flexShrink:0}}></div>
                      <div style={{flex:1,minWidth:0}}>
                        {/* Entry stamp */}
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                          <div style={{fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,fontWeight:600}}>
                            {"Entry № "+entryNum}
                            {pinHasUnread && <span style={{marginLeft:8,background:"#b85c2a",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:9,fontWeight:600,letterSpacing:"0.08em"}}>NEW</span>}
                          </div>
                          {coordStr && <div style={{fontSize:10,color:T.ink4,fontFamily:T.mono}}>{coordStr}</div>}
                        </div>
                        {/* Name with glyph */}
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:p.description?6:8}}>
                          <svg width={13} height={17} viewBox="0 0 28 36">
                            <path d="M14 0 C 6.27 0 0 6.27 0 14 c 0 9.5 14 22 14 22 s 14 -12.5 14 -22 C 28 6.27 21.73 0 14 0 z" fill={p.color||T.forest}></path>
                            <circle cx="14" cy="14" r="5" fill={T.paper}></circle>
                          </svg>
                          <div style={{fontWeight:700,fontSize:17,color:T.ink,letterSpacing:"-0.01em"}}>{p.name}</div>
                          {p.expires_at && (
                            <span style={{fontSize:10,marginLeft:4,padding:"1px 5px",borderRadius:4,
                              background:new Date(p.expires_at)<new Date()?"#ffebee":"#fff8e1",
                              color:new Date(p.expires_at)<new Date()?"#c62828":"#e65100",border:"1px solid "+(new Date(p.expires_at)<new Date()?"#ef9a9a":"#ffe082")
                            }}>
                              {new Date(p.expires_at)<new Date()?"Expired":"⏰ "+Math.ceil((new Date(p.expires_at)-new Date())/(864e5))+"d"}
                            </span>
                          )}
                        </div>
                        {/* Description */}
                        {p.description && (
                          <div style={{fontSize:13,color:T.ink2,lineHeight:1.55,marginBottom:8,fontStyle:"italic",borderLeft:"2px solid "+T.border,paddingLeft:10}}>
                            {"“"+p.description.slice(0,120)+(p.description.length>120?"…":"")+"”"}
                          </div>
                        )}
                        {/* Stats */}
                        <div style={{display:"flex",alignItems:"center",gap:10,fontSize:12,color:T.ink4}}>
                          <span>{"↑ "+upvoteCount}</span>
                          {commentCount>0 && <span style={{color:pinHasUnread?"#b85c2a":T.ink4,fontWeight:pinHasUnread?600:400}}>{"💬 "+commentCount+(pinHasUnread?" new":"")}</span>}
                          <span style={{marginLeft:"auto",fontSize:10,letterSpacing:"0.08em",textTransform:"uppercase"}}>{p.privacy}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
          
          {/* ── End marker ──────────────────────────────────────────────────── */}
          <div style={{textAlign:"center",padding:"24px",fontSize:11,letterSpacing:"0.18em",color:T.ink4,fontFamily:T.mono}}>-- End of Log --</div>
          
          {/* ── Export ──────────────────────────────────────────────────────── */}
          {myPins.length>0 && (
            <div style={{padding:"0 22px 24px",display:"flex",gap:8}}>
              <button style={{flex:1,padding:"10px",borderRadius:10,border:"1px solid "+T.border,background:"transparent",color:T.ink2,fontSize:13,cursor:"pointer",fontWeight:500}} onClick={() => dlFile(toGeoJSON(myPins),"all-pins.geojson","application/json")}>GeoJSON</button>
              <button style={{flex:1,padding:"10px",borderRadius:10,border:"1px solid "+T.border,background:"transparent",color:T.ink2,fontSize:13,cursor:"pointer",fontWeight:500}} onClick={() => dlFile(toGPX(myPins),"all-pins.gpx","application/gpx+xml")}>GPX</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
