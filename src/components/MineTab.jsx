import React, { useState } from 'react';
import { formatLL, dlFile, toGeoJSON, toGPX } from '../utils/helpers';
import { T } from '../utils/styles';

// ─── Relative time helper ────────────────────────────────────────────────────
function relTime(iso, t) {
  if (!iso) return '';
  var diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return t ? t('just_now') : 'just now';
  if (diff < 3600) return t ? t('m_ago', {count: Math.floor(diff / 60)}) : Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return t ? t('h_ago', {count: Math.floor(diff / 3600)}) : Math.floor(diff / 3600) + 'h ago';
  return t ? t('d_ago', {count: Math.floor(diff / 86400)}) : Math.floor(diff / 86400) + 'd ago';
}

// ─── Avatar initial circle ───────────────────────────────────────────────────
function AvatarDot({ name, size }) {
  var sz = size || 28;
  var initial = (name || '?').charAt(0).toUpperCase();
  // Deterministic hue from name string
  var hue = (name || '').split('').reduce(function(acc, c) { return acc + c.charCodeAt(0); }, 0) % 360;
  return (
    <div style={{
      width: sz, height: sz, borderRadius: '50%',
      background: 'hsl(' + hue + ',38%,48%)',
      color: '#fff', fontWeight: 700,
      fontSize: sz * 0.42, lineHeight: sz + 'px',
      textAlign: 'center', flexShrink: 0,
      userSelect: 'none'
    }}>
      {initial}
    </div>
  );
}

// ─── Activity row ─────────────────────────────────────────────────────────────
function ActivityRow({ item, pinName, onClick, t }) {
  var isJournal = item.type === 'journal';
  var isUpvote  = item.type === 'upvote';

  var icon  = isUpvote ? '👍' : isJournal ? '📷' : '💬';
  var verb  = isUpvote 
    ? (t ? t('verb_upvoted') : 'upvoted') 
    : isJournal 
      ? (t ? t('verb_added_photo') : 'added a photo to') 
      : (t ? t('verb_commented_on') : 'commented on');
  var preview = !isUpvote && item.body
    ? item.body.slice(0, 60) + (item.body.length > 60 ? '…' : '')
    : null;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '11px 18px', cursor: onClick ? 'pointer' : 'default',
        borderBottom: '1px solid ' + T.borderSoft,
        transition: 'background 0.12s',
      }}
      onMouseEnter={function(e){ e.currentTarget.style.background = T.paper3; }}
      onMouseLeave={function(e){ e.currentTarget.style.background = 'transparent'; }}
    >
      <AvatarDot name={item.owner} size={30} />
      <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
        <div style={{ fontSize: 13.5, color: T.ink, lineHeight: 1.45 }}>
          <span style={{ fontWeight: 700, color: T.forest }}>@{item.owner}</span>
          {' '}{verb}{' '}
          <span style={{ fontWeight: 600, color: T.ink2 }}>{pinName || 'a pin'}</span>
        </div>
        {preview && (
          <div style={{
            fontSize: 12, color: T.ink3, marginTop: 2,
            fontStyle: 'italic', lineHeight: 1.4,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {'"' + preview + '"'}
          </div>
        )}
        <div style={{ fontSize: 11, color: T.ink4, marginTop: 3, fontFamily: T.mono }}>
          {icon} {relTime(item.created_at, t)}
        </div>
      </div>
    </div>
  );
}

// ─── Activity feed section ────────────────────────────────────────────────────
function ActivitySection(props) {
  var myActivity      = props.myActivity || [];
  var newUpvotePinIds = props.newUpvotePinIds || [];
  var pins            = props.pins || [];
  var setSelPin       = props.setSelPin;
  var setOpen         = props.setOpen;
  var mapObj          = props.mapObj;
  var markCommentsSeen = props.markCommentsSeen;
  var t               = props.t;

  // Build a pinId → pin lookup
  var pinById = {};
  pins.forEach(function(p) { pinById[p.id] = p; });

  // Build upvote activity rows from newUpvotePinIds
  var upvoteRows = newUpvotePinIds.map(function(pid) {
    var p = pinById[pid];
    // Try to glean who upvoted from upvotes array (array of usernames in this schema)
    var upvoters = (p && Array.isArray(p.upvotes)) ? p.upvotes : [];
    // Show one row per upvoter, or one generic row if we can't tell
    if (upvoters.length) {
      return upvoters.map(function(owner) {
        return { type: 'upvote', pin_id: pid, owner: owner, created_at: null };
      });
    }
    return [{ type: 'upvote', pin_id: pid, owner: '?', created_at: null }];
  }).reduce(function(acc, arr) { return acc.concat(arr); }, []);

  // Annotate comment rows with type
  var commentRows = myActivity.map(function(r) {
    return Object.assign({}, r, { type: r.photo_url ? 'journal' : 'comment' });
  });

  // Merge: upvote rows first (they're derived from current state), then comment rows
  var allRows = upvoteRows.concat(commentRows);

  var total = allRows.length;

  // Collapsed by default only when there's nothing new
  var hasNew = newUpvotePinIds.length > 0 || myActivity.length > 0;
  var [open, setOpen2] = React.useState(hasNew);

  if (total === 0) return null;

  function handleRowClick(row) {
    var pin = pinById[row.pin_id];
    if (!pin) return;
    if (mapObj && mapObj.current) mapObj.current.setView([pin.lat, pin.lng], 14);
    setSelPin(pin);
    if (setOpen) setOpen(false);
    if (markCommentsSeen) markCommentsSeen();
  }

  return (
    <div style={{ borderBottom: '2px solid ' + T.border, background: T.paper2, flexShrink: 0 }}>
      {/* Section header / toggle */}
      <div
        onClick={function() { setOpen2(function(v){ return !v; }); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 18px', cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, fontFamily: T.mono, color: T.ink3, flex: 1 }}>
          ⚡ {t ? t('recent_activity') : 'Recent Activity'}
        </div>
        {!open && (
          <div style={{
            background: T.forest, color: T.paper, fontSize: 11,
            fontWeight: 700, borderRadius: 20, padding: '2px 9px',
            letterSpacing: '0.04em'
          }}>
            {total}
          </div>
        )}
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
          <path d="M6 9l6 6 6-6" stroke={T.ink3} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Rows */}
      {open && (
        <div>
          {allRows.slice(0, 20).map(function(row, i) {
            var pin = pinById[row.pin_id];
            var pinName = pin ? pin.name : row.pin_id;
            return (
              <ActivityRow
                key={row.id || ('upv-' + row.pin_id + '-' + row.owner + '-' + i)}
                item={row}
                pinName={pinName}
                onClick={pin ? function() { handleRowClick(row); } : null}
                t={t}
              />
            );
          })}
          {total === 0 && (
            <div style={{ padding: '12px 18px', fontSize: 13, color: T.ink4 }}>{t ? t('no_recent_activity') : 'No recent activity yet.'}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export function MineTab(props) {
  var myPins = props.myPins, myTags = props.myTags, uname = props.uname;
  var activeFilter = props.activeFilter, setActiveFilter = props.setActiveFilter;
  var mapObj = props.mapObj, setSelPin = props.setSelPin, setOpen = props.setOpen;
  var unreadPinIds = props.unreadPinIds || [];
  var newUpvotePinIds = props.newUpvotePinIds || [];
  var commentCounts = props.commentCounts || {};
  var myActivity = props.myActivity || [];
  var pins = props.pins || [];
  var totalUpvotes = myPins.reduce(function(s,p){return s+((p.upvotes&&Array.isArray(p.upvotes))?p.upvotes.length:0);},0);
  
  var t = props.t || function(key) { return key; };

  var [expanded, setExpanded] = useState({});
  var [searchQuery, setSearchQuery] = useState("");

  function toggleGroup(tag){
    setExpanded(function(prev){
      var next=Object.assign({},prev);
      next[tag]=!prev[tag];
      return next;
    });
  }

  // Filter pins based on search query
  var filteredPins = myPins;
  if (searchQuery.trim()) {
    var q = searchQuery.toLowerCase();
    filteredPins = myPins.filter(function(p){
      return (p.name && p.name.toLowerCase().indexOf(q) !== -1) ||
             (p.description && p.description.toLowerCase().indexOf(q) !== -1) ||
             (p.tags && p.tags.some(function(t){ return t.toLowerCase().indexOf(q) !== -1; }));
    });
  }

  // Only show tags that have pins after filtering
  var filteredTags = myTags.filter(function(tag){
    return filteredPins.some(function(p){return (p.tags||[]).indexOf(tag)>=0;});
  });

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      {/* ── Editorial header ───────────────────────────────────────────────────── */}
      <div style={{padding:"28px 22px 20px",borderBottom:"1px solid "+T.borderSoft,flexShrink:0}}>
        <div style={{fontSize:10.5,letterSpacing:"0.18em",color:T.ink3,textTransform:"uppercase",fontWeight:600,fontFamily:T.mono,marginBottom:8}}>
          {t('vol_ii')}
        </div>
        <div style={{fontSize:38,fontWeight:700,letterSpacing:"-0.02em",color:T.ink,lineHeight:1,marginBottom:10}}>{t('my_pins')}</div>
        {myPins.length>0 && (
          <div style={{fontSize:14,color:T.ink3}}>
            {myPins.length + " " + (myPins.length === 1 ? t('entry_noun') : t('entries_noun')) + " · " + totalUpvotes + " " + (totalUpvotes === 1 ? t('upvote_noun') : t('upvotes_noun')) + " " + t('received')}
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
          <div style={{fontSize:15,fontWeight:600,color:T.ink2,marginBottom:6}}>{t('no_my_entries')}</div>
          <div style={{fontSize:13,color:T.ink3,lineHeight:1.6,textAlign:"center"}}>{t('no_my_entries_desc')}</div>
        </div>
      ) : (
        <div style={{flex:1,overflowY:"auto"}}>

          {/* ── Recent Activity ──────────────────────────────────────────────── */}
          <ActivitySection
            myActivity={myActivity}
            newUpvotePinIds={newUpvotePinIds}
            pins={pins}
            setSelPin={setSelPin}
            setOpen={setOpen}
            mapObj={mapObj}
            markCommentsSeen={props.markCommentsSeen}
            t={t}
          />

          {/* Search Bar */}
          <div style={{padding:"14px 22px",borderBottom:"1px solid "+T.borderSoft,background:T.paper}}>
            <input
              style={{width:"100%",boxSizing:"border-box",background:T.paper2,border:"1px solid "+T.border,borderRadius:12,padding:"10px 14px",fontSize:15,outline:"none",color:T.ink,fontFamily:T.font}}
              placeholder={t('search_my_pins')}
              value={searchQuery}
              onChange={(ev) => setSearchQuery(ev.target.value)}
            />
          </div>

          {/* ── Tag groups ──────────────────────────────────────────────────── */}
          {filteredTags.map(function(tag){
            var tp = filteredPins.filter(function(p){return (p.tags||[]).indexOf(tag)>=0;});
            var tagHasUnread = tp.some(function(p){return unreadPinIds.indexOf(p.id)>=0 || newUpvotePinIds.indexOf(p.id)>=0;});
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
                        {activeFilter===tag && <span style={{fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:T.forest,background:T.forestPale,padding:"1px 6px",borderRadius:10,fontWeight:600}}>{t('tab_map').toLowerCase()}</span>}
                        {tagHasUnread && <div style={{width:7,height:7,borderRadius:"50%",background:"#b85c2a",flexShrink:0}}></div>}
                      </div>
                      <div style={{fontSize:12,color:T.ink3,fontFamily:T.mono,marginTop:2}}>
                        {tp.length + " " + (tp.length === 1 ? t('pin_noun') : t('pins_noun'))}
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
                  var pinHasUpvoteNew = newUpvotePinIds.indexOf(p.id)>=0;
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
                            {t('entry_no') + entryNum}
                            {pinHasUnread && <span style={{marginLeft:8,background:"#b85c2a",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:9,fontWeight:600,letterSpacing:"0.08em"}}>💬 {t('new_tag')}</span>}
                            {pinHasUpvoteNew && <span style={{marginLeft:4,background:"#2a5d3c",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:9,fontWeight:600,letterSpacing:"0.08em"}}>👍 {t('new_tag')}</span>}
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
                              {new Date(p.expires_at)<new Date()?t('expired'):"⏰ "+Math.ceil((new Date(p.expires_at)-new Date())/(864e5))+"d"}
                            </span>
                          )}
                        </div>
                        {/* Description */}
                        {p.description && (
                          <div style={{fontSize:13,color:T.ink2,lineHeight:1.55,marginBottom:8,fontStyle:"italic",borderLeft:"2px solid "+T.border,paddingLeft:10}}>
                            {"\u201c"+p.description.slice(0,120)+(p.description.length>120?"…":"")+"\u201d"}
                          </div>
                        )}
                        {/* Stats */}
                        <div style={{display:"flex",alignItems:"center",gap:10,fontSize:12,color:T.ink4}}>
                          <span>{"↑ "+upvoteCount+(pinHasUpvoteNew?" 🆕":"")}</span>
                          {commentCount>0 && <span style={{color:pinHasUnread?"#b85c2a":T.ink4,fontWeight:pinHasUnread?600:400}}>{"💬 "+commentCount+(pinHasUnread?" " + t('new_tag').toLowerCase():"")}</span>}
                          <span style={{marginLeft:"auto",fontSize:10,letterSpacing:"0.08em",textTransform:"uppercase"}}>
                            {(function() {
                              var prv = (p.privacy || "").toLowerCase();
                              if (prv === 'public') return t('form_privacy_public');
                              if (prv === 'private') return t('form_privacy_private');
                              if (prv === 'insider') return t('form_privacy_insider');
                              return p.privacy;
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
          
          {/* ── End marker ──────────────────────────────────────────────────── */}
          <div style={{textAlign:"center",padding:"24px",fontSize:11,letterSpacing:"0.18em",color:T.ink4,fontFamily:T.mono}}>{t('end_of_log')}</div>
          
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
