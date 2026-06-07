import React from 'react';
import { T, S } from '../../utils/styles';
import { formatLL, getPinIcon, distKm, tagColor } from '../../utils/helpers';
import { Comments } from '../Comments';
const e = React.createElement;

export function PinDetailModal(props) {
  const {
    selPin, setSelPin, uname, api, t, formatLL, distKm, userLL, userFollows, follows, loadUserProfile, setFullscreenPhoto, getPinIcon, tagColor, toggleFollow, checkins, mapPacks, activeMapPack, setSelPinOwnerProfile, selPinOwnerProfile, toggleUserFollow, selPinTrail, activeTrail, setActiveTrail, savedTrailIds, setSavedTrailIds, setTrails, flash, selPinCheckinsCount, toggleUpvote, lang, checkinToPin, openEdit, deletePin, setShowCompass, setShowAddToGuidesMenu
  } = props;

  return e("div",{className:"detail pm-detail",style:{position:"absolute",top:"12%",bottom:"calc(68px + env(safe-area-inset-bottom,0px))",left:16,right:16,maxWidth:480,margin:"0 auto",background:"rgba(255,253,248,0.97)",border:"1px solid #d8cfb8",borderRadius:12,padding:"14px 15px",overflow:"hidden",zIndex:1001,boxShadow:"0 8px 32px rgba(0,0,0,0.13)","display":"flex","flexDirection":"column"}},
      // Frozen Header
      e("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",paddingBottom:"10px",borderBottom:"1px solid #e8dcc4",marginBottom:"10px",flexShrink:0}},
        e("div",{style:{display:"flex",alignItems:"center",gap:7,minWidth:0,flex:1,paddingRight:12}},
          e("span",{style:{width:12,height:12,borderRadius:"50%",background:selPin.color||tagColor(selPin.tags&&selPin.tags[0]||"x"),display:"inline-block",flexShrink:0}}),
          e("span",{style:{fontSize:20,lineHeight:1}},getPinIcon(selPin.tags)),
          e("span",{style:{fontWeight:700,fontSize:18,color:"#1a201c",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}},selPin.name),
          selPin.expires_at&&e("span",{style:{fontSize:11,padding:"2px 6px",borderRadius:4,
            background:new Date(selPin.expires_at)<new Date()?"#ffebee":"#fff8e1",
            color:new Date(selPin.expires_at)<new Date()?"#c62828":"#e65100",
            border:"1px solid "+(new Date(selPin.expires_at)<new Date()?"#ef9a9a":"#ffe082"),
            flexShrink:0
          }},new Date(selPin.expires_at)<new Date()?"Expired":(function(){
            var diff=new Date(selPin.expires_at)-new Date();
            var days=Math.floor(diff/864e5);
            var hrs=Math.floor((diff%864e5)/36e5);
            return "⏰ "+(days>0?days+"d ":"")+hrs+"h";
          })())
        ),
        e("button",{
          style:{width:28,height:28,borderRadius:"50%",background:"rgba(26,32,28,0.08)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
          onClick:function(){setSelPin(null);}
        },
          e("svg",{width:12,height:12,viewBox:"0 0 24 24",fill:"none"},
            e("path",{d:"M18 6L6 18M6 6l12 12",stroke:"#1a201c",strokeWidth:2.5,strokeLinecap:"round"})
          )
        )
      ),
      // Scrollable Body
      e("div",{style:{overflowY:"auto",flex:1,display:"flex",flexDirection:"column",paddingRight:"4px"}},
        (selPin.photo || selPin.photo_2 || selPin.photo_3) && (function() {
          var activePhotos = [selPin.photo, selPin.photo_2, selPin.photo_3].filter(Boolean);
          if (activePhotos.length === 1) {
            return e("img",{src:activePhotos[0],style:{width:"100%",borderRadius:8,marginBottom:8,maxHeight:150,objectFit:"cover",cursor:"pointer",flexShrink:0},onClick:function(){setFullscreenPhoto(activePhotos[0]);}});
          }
          return e("div",{style:{display:"flex",gap:8,overflowX:"auto",marginBottom:8,paddingBottom:6,scrollSnapType:"x mandatory",WebkitOverflowScrolling:"touch",flexShrink:0}},
            activePhotos.map(function(url, idx) {
              return e("img",{
                key:idx,
                src:url,
                style:{width:"85%",height:150,borderRadius:8,objectFit:"cover",flexShrink:0,scrollSnapAlign:"start",cursor:"pointer"},
                onClick:function(){setFullscreenPhoto(url);}
              });
            })
          );
        })(),
      e("div",{style:{fontSize:13,color:"#6f786f",marginBottom:6}},
        e("span",{
          style:{color:"#2a5d3c",cursor:"pointer",textDecoration:"underline",textDecorationStyle:"dotted",display:"inline-flex",alignItems:"center",gap:4},
          onClick:function(){loadUserProfile(selPin.owner);}
        },
          e("span",{style:{cursor:"pointer",fontWeight:700,color:T.ink}},(selPinOwnerProfile && selPinOwnerProfile.full_name) || selPin.owner),
          e("span",{style:{cursor:"pointer",fontSize:11,color:T.ink3}},"@"+selPin.owner)
        ),
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
      selPin.description&&e("div",{style:{fontSize:13,color:"#5a4a30",marginBottom:8,lineHeight:1.6,whiteSpace:"pre-wrap",userSelect:"text",WebkitUserSelect:"text"}},
        (function(text) {
          if (!text) return "";
          var urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
          var parts = text.split(urlRegex);
          return parts.map(function(part, i) {
            if (/^https?:\/\//i.test(part)) {
              return e("a",{key:i,href:part,target:"_blank",rel:"noopener noreferrer",style:{color:"#2a5d3c",textDecoration:"underline",wordBreak:"break-all",userSelect:"text",WebkitUserSelect:"text"},onClick:function(ev){ev.stopPropagation();}},part);
            } else if (/^www\./i.test(part)) {
              return e("a",{key:i,href:"https://"+part,target:"_blank",rel:"noopener noreferrer",style:{color:"#2a5d3c",textDecoration:"underline",wordBreak:"break-all",userSelect:"text",WebkitUserSelect:"text"},onClick:function(ev){ev.stopPropagation();}},part);
            }
            return part;
          });
        })(selPin.description)
      ),
      e("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}},
        (selPin.tags||[]).filter(function(t){return !t.startsWith("_icon:");}).map(function(t){
          return e("span",{key:t,style:{fontSize:12,padding:"2px 7px",borderRadius:10,background:tagColor(t)+"18",color:tagColor(t),border:"1px solid "+tagColor(t)+"40"}},"#"+t);
        })
      ),

      null,

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
              Number((selPinTrail.distance_km || 0) * 0.621371).toFixed(2) + " mi" +
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
      e("div",{className:"pm-action-buttons"},
        (uname&&selPin.owner!==uname)&&e(React.Fragment,null,
          (function(){
            var isUpvoted = selPin.upvotes && selPin.upvotes.indexOf(uname) >= 0;
            return e("button",{
              className:"pm-action-btn",
              style:{
                background:"none",
                border:"1px solid " + (isUpvoted ? "#ff4500" : "#d8cfb8"),
                color: isUpvoted ? "#ff4500" : "#3c4540",
                fontWeight: isUpvoted ? 700 : 400
              },
              onClick:function(){toggleUpvote(selPin.id);}
            },
              e("svg",{
                width:13,
                height:13,
                viewBox:"0 0 24 24",
                fill: isUpvoted ? "currentColor" : "none",
                stroke:"currentColor",
                strokeWidth:"2.2",
                strokeLinecap:"round",
                strokeLinejoin:"round",
                style:{flexShrink:0}
               },
                e("path",{d:"M12 3l-7 8h4v9h6v-9h4z"})
              ),
              e("span",null,
                (isUpvoted 
                  ? (lang === 'es' ? "Votado " : "Upvoted ") 
                  : (lang === 'es' ? "Votar " : "Upvote ")) + 
                (selPin.upvotes?selPin.upvotes.length:0)
              )
            );
          })(),
          (uname&&uname!=="guest")&&(
            checkins.some(function(c){return c.pin_id===selPin.id;})
              ? e("button",{className:"pm-action-btn",style:{border:"1px solid #2a5d3c",background:"#dde6dc",color:"#2a5d3c",cursor:"default"},disabled:true},"✓ Checked In")
              : (selPin.owner!==uname || selPin.id === props.activeHuntPinId)
                ? e("button",{
                    className:"pm-action-btn",
                    style:{border:"1px solid #2a5d3c",background:"none",color:"#2a5d3c"},
                    onClick:function(){checkinToPin(selPin);}
                  },
                    e("svg",{
                      width:13,
                      height:13,
                      viewBox:"0 0 24 24",
                      fill:"none",
                      stroke:"currentColor",
                      strokeWidth:"2.2",
                      strokeLinecap:"round",
                      strokeLinejoin:"round",
                      style:{flexShrink:0}
                    },
                      e("path",{d:"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"}),
                      e("circle",{cx:12,cy:10,r:3})
                    ),
                    e("span",null,lang === 'es' ? "Registrar visita" : "Check In")
                  )
                : null
          )
        ),
        (uname&&selPin.owner===uname)&&e(React.Fragment,null,
          e("button",{className:"pm-action-btn",style:{background:"rgba(46,125,50,0.08)",border:"none",color:"#2a5d3c"},onClick:function(){openEdit(selPin);}},
            e("svg",{width:13,height:13,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",style:{flexShrink:0}},
              e("path",{d:"M11 20h9"}),
              e("path",{d:"M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"})
            ),
            e("span",null,"Edit")
          ),
          e("button",{className:"pm-action-btn",style:{background:"#fde8e8",border:"none",color:"#c81e1e"},onClick:function(){if(window.confirm("Delete \""+selPin.name+"\"? This cannot be undone.")){deletePin(selPin.id);setSelPin(null);}}},
            e("svg",{width:13,height:13,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",style:{flexShrink:0}},
              e("polyline",{points:"3 6 5 6 21 6"}),
              e("path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"}),
              e("line",{x1:"10",y1:"11",x2:"10",y2:"17"}),
              e("line",{x1:"14",y1:"11",x2:"14",y2:"17"})
            ),
            e("span",null,"Delete")
          )
        ),
        e("button",{
          className:"pm-action-btn",
          style:{background:"#e1effe",border:"none",color:"#1e429f"},
          onClick:function(){
            var url="https://maps.google.com/?q="+selPin.lat+","+selPin.lng;
            if(/iPhone|iPad|iPod/i.test(navigator.userAgent)) url="http://maps.apple.com/?ll="+selPin.lat+","+selPin.lng;
            window.open(url,"_blank");
          }
        },
          e("svg",{width:13,height:13,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",style:{flexShrink:0}},
            e("polygon",{points:"3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"}),
            e("line",{x1:"9",y1:"3",x2:"9",y2:"18"}),
            e("line",{x1:"15",y1:"6",x2:"15",y2:"21"})
          ),
          e("span",null,"Open in Maps")
        ),
        e("button",{
          className:"pm-action-btn",
          style:{background:"rgba(42,93,60,0.08)",border:"none",color:"#2a5d3c"},
          onClick:function(){setShowCompass(true);}
        },
          e("svg",{width:13,height:13,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",style:{flexShrink:0}},
            e("circle",{cx:"12",cy:"12",r:"10"}),
            e("polygon",{points:"16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"})
          ),
          e("span",null,"Compass")
        ),
        (uname && uname !== "guest") && e("button",{
          className:"pm-action-btn",
          style:{background:"rgba(42,93,60,0.08)",border:"none",color:"#2a5d3c"},
          onClick:function(){setShowAddToGuidesMenu(true);}
        },
          e("svg",{width:13,height:13,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",style:{flexShrink:0}},
            e("path",{d:"M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"}),
            e("path",{d:"M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"})
          ),
          e("span",null,"Add to Guide")
        )
      ),
      e(Comments,{pinId:selPin.id,uname:uname,pinOwner:selPin.owner,pinName:selPin.name,flash:flash,lang:lang,t:t})
      )
    );
}
