import React, { useState } from 'react';
import { formatLL, dlFile, toGeoJSON, toGPX, distKm } from '../utils/helpers';
import { T } from '../utils/styles';
import { sb } from '../utils/api';

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
function ActivityRow({ item, pinName, onClick, t, isNew }) {
  var isJournal = item.type === 'journal';
  var isUpvote  = item.type === 'upvote';

  var icon  = isUpvote ? '▲' : isJournal ? '📷' : '💬';
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
        background: isNew ? 'rgba(184, 92, 42, 0.05)' : 'transparent',
        borderLeft: isNew ? '3px solid #b85c2a' : 'none',
        paddingLeft: isNew ? 15 : 18
      }}
      onMouseEnter={function(e){ e.currentTarget.style.background = isNew ? 'rgba(184, 92, 42, 0.08)' : T.paper3; }}
      onMouseLeave={function(e){ e.currentTarget.style.background = isNew ? 'rgba(184, 92, 42, 0.05)' : 'transparent'; }}
    >
      <AvatarDot name={item.owner} size={30} />
      <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
        <div style={{ fontSize: 13.5, color: T.ink, lineHeight: 1.45 }}>
          <span style={{ fontWeight: 700, color: T.forest }}>@{item.owner}</span>
          {' '}{verb}{' '}
          <span style={{ fontWeight: 600, color: T.ink2 }}>{pinName || 'a pin'}</span>
          {isNew && <span style={{ marginLeft: 6, background: '#b85c2a', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 9, fontWeight: 700, letterSpacing: '0.04em' }}>NEW</span>}
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

  var lastSeen = props.uname ? localStorage.getItem("pm-comments-seen-" + props.uname) : null;
  var lastSeenTime = lastSeen ? new Date(lastSeen) : new Date(0);

  // Build upvote activity rows from newUpvotePinIds
  var upvoteRows = newUpvotePinIds.map(function(pid) {
    var p = pinById[pid];
    var upvoters = (p && Array.isArray(p.upvotes)) ? p.upvotes : [];
    if (upvoters.length) {
      return upvoters.map(function(owner) {
        return { type: 'upvote', pin_id: pid, owner: owner, created_at: null, isNew: true };
      });
    }
    return [{ type: 'upvote', pin_id: pid, owner: '?', created_at: null, isNew: true }];
  }).reduce(function(acc, arr) { return acc.concat(arr); }, []);

  // Annotate comment rows with type
  var commentRows = myActivity.map(function(r) {
    var pinSeen = props.uname ? localStorage.getItem("pm-pin-comments-seen-" + props.uname + "-" + r.pin_id) : null;
    var pinSeenTime = pinSeen ? new Date(pinSeen) : new Date(0);
    var cutoff = pinSeenTime > lastSeenTime ? pinSeenTime : lastSeenTime;
    var isNew = r.created_at && new Date(r.created_at) > cutoff;
    return Object.assign({}, r, { type: r.photo_url ? 'journal' : 'comment', isNew: isNew });
  });

  // Merge: upvote rows first (they're derived from current state), then comment rows
  var allRows = upvoteRows.concat(commentRows);

  var total = allRows.length;
  var unreadCount = allRows.filter(function(r){ return r.isNew; }).length;

  var hasNew = newUpvotePinIds.length > 0 || myActivity.length > 0;
  var [open, setOpen2] = React.useState(hasNew);

  if (total === 0) return null;

  function handleRowClick(row) {
    var pin = pinById[row.pin_id];
    if (!pin) return;
    if (props.focusPin) {
      props.focusPin(pin);
    } else {
      if (mapObj && mapObj.current) mapObj.current.setView([pin.lat, pin.lng], 14);
      setSelPin(pin);
      if (setOpen) setOpen(false);
    }
    if (markCommentsSeen) markCommentsSeen();
  }

  return (
    <div style={{ borderBottom: '2px solid ' + T.border, background: T.paper2, flexShrink: 0 }}>
      {/* Section header / toggle */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 18px',
          userSelect: 'none',
        }}
      >
        <div 
          onClick={function() { setOpen2(function(v){ return !v; }); }}
          style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, fontFamily: T.mono, color: T.ink3, flex: 1, cursor: 'pointer' }}
        >
          ⚡ {t ? t('recent_activity') : 'Recent Activity'}
        </div>
        {total > 0 && (
          <button
            onClick={function(ev) {
              ev.stopPropagation();
              if (markCommentsSeen) markCommentsSeen();
            }}
            style={{
              background: 'none', border: '1px solid ' + T.border,
              color: T.ink2, fontSize: 11, cursor: 'pointer',
              padding: '2px 8px', borderRadius: 4, marginRight: 8,
              fontWeight: 600, fontFamily: T.font
            }}
          >
            Clear All
          </button>
        )}
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
                isNew={row.isNew}
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
  var [sortBy, setSortBy] = useState("date-desc");
  var [isManageMode, setIsManageMode] = useState(false);
  var [selectedPinIds, setSelectedPinIds] = useState(new Set());

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

  // Sort the filtered pins
  var sortedPins = filteredPins.slice().sort(function(a, b) {
    if (sortBy === "name-asc") {
      return (a.name || "").localeCompare(b.name || "");
    }
    if (sortBy === "name-desc") {
      return (b.name || "").localeCompare(a.name || "");
    }
    if (sortBy === "date-asc") {
      var da = a.created_at ? new Date(a.created_at).getTime() : 0;
      var db = b.created_at ? new Date(b.created_at).getTime() : 0;
      return da - db;
    }
    if (sortBy === "date-desc") {
      var da = a.created_at ? new Date(a.created_at).getTime() : 0;
      var db = b.created_at ? new Date(b.created_at).getTime() : 0;
      return db - da;
    }
    if (sortBy === "engagement") {
      var engagementA = ((a.upvotes && a.upvotes.length) || 0) + (commentCounts[a.id] || 0);
      var engagementB = ((b.upvotes && b.upvotes.length) || 0) + (commentCounts[b.id] || 0);
      return engagementB - engagementA;
    }
    if (sortBy === "distance") {
      if (mapObj && mapObj.current) {
        var center = mapObj.current.getCenter();
        var distA = distKm(center.lat, center.lng, a.lat, a.lng);
        var distB = distKm(center.lat, center.lng, b.lat, b.lng);
        return distA - distB;
      }
      return 0;
    }
    return 0;
  });

  // Only show tags that have pins after filtering
  var filteredTags = myTags.filter(function(tag){
    return sortedPins.some(function(p){return (p.tags||[]).indexOf(tag)>=0;});
  });

  // Calculate scores for tag sorting
  var tagScores = {};
  filteredTags.forEach(function(tag) {
    var tagPins = sortedPins.filter(function(p){return (p.tags||[]).indexOf(tag)>=0;});
    if (sortBy === "name-asc" || sortBy === "name-desc") {
      tagScores[tag] = tag;
    } else if (sortBy === "date-asc" || sortBy === "date-desc") {
      var times = tagPins.map(function(p) { return p.created_at ? new Date(p.created_at).getTime() : 0; });
      tagScores[tag] = times.length ? Math.max.apply(null, times) : 0;
    } else if (sortBy === "engagement") {
      var sums = tagPins.map(function(p) { return ((p.upvotes && p.upvotes.length) || 0) + (commentCounts[p.id] || 0); });
      tagScores[tag] = sums.length ? Math.max.apply(null, sums) : 0;
    } else if (sortBy === "distance") {
      if (mapObj && mapObj.current) {
        var center = mapObj.current.getCenter();
        var distances = tagPins.map(function(p) { return distKm(center.lat, center.lng, p.lat, p.lng); });
        tagScores[tag] = distances.length ? Math.min.apply(null, distances) : Infinity;
      } else {
        tagScores[tag] = 0;
      }
    }
  });

  // Sort the tag groups
  var sortedTags = filteredTags.slice().sort(function(a, b) {
    if (sortBy === "name-asc") {
      return a.localeCompare(b);
    }
    if (sortBy === "name-desc") {
      return b.localeCompare(a);
    }
    if (sortBy === "date-desc" || sortBy === "engagement") {
      return tagScores[b] - tagScores[a];
    }
    if (sortBy === "date-asc") {
      return tagScores[a] - tagScores[b];
    }
    if (sortBy === "distance") {
      return tagScores[a] - tagScores[b];
    }
    return 0;
  });

  // Bulk Actions handlers
  function handleBulkDelete() {
    if (selectedPinIds.size === 0) return;
    var confirmMsg = "Are you sure you want to delete the " + selectedPinIds.size + " selected pin(s)? This cannot be undone.";
    if (!window.confirm(confirmMsg)) return;

    var idsArray = Array.from(selectedPinIds);
    sb.from("pins")
      .delete()
      .in("id", idsArray)
      .eq("owner", uname)
      .then(function(r) {
        if (r.error) {
          if (props.flash) props.flash("Failed to delete pins");
        } else {
          if (props.flash) props.flash("Deleted " + idsArray.length + " pin(s)");
          if (props.setPins) {
            props.setPins(function(prev) {
              return prev.filter(function(p) {
                return idsArray.indexOf(p.id) < 0;
              });
            });
          }
          setSelectedPinIds(new Set());
        }
      })
      .catch(function(e) {
        if (props.flash) props.flash("Deletion failed: " + e.message);
      });
  }

  function handleBulkPrivacy(newPrivacy) {
    if (selectedPinIds.size === 0) return;
    var idsArray = Array.from(selectedPinIds);
    sb.from("pins")
      .update({ privacy: newPrivacy })
      .in("id", idsArray)
      .eq("owner", uname)
      .then(function(r) {
        if (r.error) {
          if (props.flash) props.flash("Failed to update privacy");
        } else {
          if (props.flash) props.flash("Updated privacy for " + idsArray.length + " pin(s)");
          if (props.setPins) {
            props.setPins(function(prev) {
              return prev.map(function(p) {
                if (idsArray.indexOf(p.id) >= 0) {
                  return Object.assign({}, p, { privacy: newPrivacy });
                }
                return p;
              });
            });
          }
          setSelectedPinIds(new Set());
        }
      })
      .catch(function(e) {
        if (props.flash) props.flash("Update failed: " + e.message);
      });
  }

  function handleBulkExport(format) {
    if (selectedPinIds.size === 0) return;
    var selectedPins = myPins.filter(function(p) {
      return selectedPinIds.has(p.id);
    });
    
    if (format === "geojson") {
      dlFile(toGeoJSON(selectedPins), "selected-pins.geojson", "application/json");
    } else {
      dlFile(toGPX(selectedPins), "selected-pins.gpx", "application/gpx+xml");
    }
    if (props.flash) props.flash("Exported " + selectedPins.length + " pin(s)");
  }

  function handlePinRowClick(p) {
    if (isManageMode) {
      setSelectedPinIds(function(prev) {
        var next = new Set(prev);
        if (next.has(p.id)) {
          next.delete(p.id);
        } else {
          next.add(p.id);
        }
        return next;
      });
    } else {
      if (props.focusPin) {
        props.focusPin(p);
      } else {
        if(mapObj&&mapObj.current)mapObj.current.setView([p.lat,p.lng],14);
        setSelPin(p);
        setOpen(false);
      }
      if(props.markCommentsSeen)props.markCommentsSeen();
    }
  }

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      {/* ── Editorial header ───────────────────────────────────────────────────── */}
      <div style={{padding:"16px 22px 12px",borderBottom:"1px solid "+T.borderSoft,flexShrink:0}}>
        <div style={{fontSize:10.5,letterSpacing:"0.18em",color:T.ink3,textTransform:"uppercase",fontWeight:600,fontFamily:T.mono,marginBottom:4}}>
          {t('vol_ii')}
        </div>
        <div style={{fontSize:28,fontWeight:700,letterSpacing:"-0.02em",color:T.ink,lineHeight:1.1,marginBottom:6}}>{t('my_pins')}</div>
        {myPins.length>0 && (
          <div style={{fontSize:14,color:T.ink3}}>
            {myPins.length + " " + (myPins.length === 1 ? t('entry_noun') : t('entries_noun')) + " · " + totalUpvotes + " " + (totalUpvotes === 1 ? t('upvote_noun') : t('upvotes_noun')) + " " + t('received')}
          </div>
        )}
      </div>

      {/* Topo divider */}
      <div style={{height:16,position:"relative",overflow:"hidden",flexShrink:0,borderBottom:"1px solid "+T.borderSoft}}>
        <svg width="100%" height="100%" viewBox="0 0 400 16" preserveAspectRatio="none" style={{position:"absolute",inset:0}}>
          <g fill="none" stroke={T.border} strokeWidth="0.7">
            <path d="M-10 12 Q 60 6 120 10 T 260 5 T 420 9"></path>
            <path d="M-10 9 Q 60 3 120 7 T 260 2 T 420 6"></path>
            <path d="M-10 6 Q 60 0 120 4 T 260 -1 T 420 3"></path>
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
        <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
          {/* Search Bar */}
          <div style={{padding:"14px 22px 8px",background:T.paper,flexShrink:0}}>
            <input
              style={{width:"100%",boxSizing:"border-box",background:T.paper2,border:"1px solid "+T.border,borderRadius:12,padding:"10px 14px",fontSize:15,outline:"none",color:T.ink,fontFamily:T.font}}
              placeholder={t('search_my_pins')}
              value={searchQuery}
              onChange={(ev) => setSearchQuery(ev.target.value)}
            />
          </div>

          {/* Sort & Manage Control Bar */}
          <div style={{display:"flex",gap:8,padding:"0 22px 14px",background:T.paper,borderBottom:"1px solid "+T.borderSoft,flexShrink:0}}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                flex: 1,
                background: T.paper2,
                border: "1px solid " + T.border,
                borderRadius: 10,
                padding: "8px 10px",
                fontSize: 13,
                color: T.ink,
                outline: "none",
                fontFamily: T.font
              }}
            >
              <option value="date-desc">⏱️ Newest First</option>
              <option value="date-asc">⏱️ Oldest First</option>
              <option value="name-asc">🔤 A-Z</option>
              <option value="name-desc">🔤 Z-A</option>
              <option value="engagement">🔥 Most Popular</option>
              {mapObj && mapObj.current && <option value="distance">📍 Closest to Map</option>}
            </select>

            <button
              onClick={() => {
                setIsManageMode(!isManageMode);
                setSelectedPinIds(new Set());
              }}
              style={{
                background: isManageMode ? T.forest : "transparent",
                color: isManageMode ? T.paper : T.ink2,
                border: "1px solid " + (isManageMode ? T.forest : T.border),
                borderRadius: 10,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: T.font
              }}
            >
              {isManageMode ? "✓ Done" : "⚙️ Manage"}
            </button>
          </div>

          {/* List + Sidebar Wrapper */}
          <div style={{flex:1,position:"relative",minHeight:0}}>
            <div id="mine-tab-list" style={{position:"absolute",inset:0,overflowY:"auto",paddingRight:(!isManageMode && sortedTags.length > 0) ? 36 : 0}}>
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
                focusPin={props.focusPin}
                uname={uname}
                hasUnread={unreadPinIds.length > 0 || newUpvotePinIds.length > 0}
              />

              {/* ── Tag groups ──────────────────────────────────────────────────── */}
              {sortedTags.map(function(tag){
                var tp = sortedPins.filter(function(p){return (p.tags||[]).indexOf(tag)>=0;});
                var tagHasUnread = tp.some(function(p){return unreadPinIds.indexOf(p.id)>=0 || newUpvotePinIds.indexOf(p.id)>=0;});
                var isOpen = expanded[tag]===true;
                var tagComments = tp.reduce(function(s,p){return s+(commentCounts[p.id]||0);},0);

                return (
                  <div key={tag} id={"tag-group-" + tag} style={{borderBottom:"1px solid "+T.borderSoft}}>
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
                      var isSelected = selectedPinIds.has(p.id);

                      return (
                        <div key={p.id}
                          style={{
                            display:"flex",
                            gap:14,
                            padding: isManageMode ? "14px 22px 14px 22px" : "14px 22px 14px 38px",
                            borderTop:"1px solid "+T.borderSoft,
                            cursor:"pointer",
                            background: isSelected 
                              ? "rgba(42, 93, 60, 0.06)" 
                              : pinHasUnread 
                                ? "rgba(184,92,42,0.03)" 
                                : T.paper2,
                            transition: "background 0.15s"
                          }}
                          onClick={() => handlePinRowClick(p)}
                        >
                          {/* Manage Mode Checkbox */}
                          {isManageMode && (
                            <div
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                border: "2px solid " + (isSelected ? T.forest : T.border),
                                background: isSelected ? T.forest : "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: -4,
                                marginTop: 4,
                                flexShrink: 0,
                                transition: "all 0.1s"
                              }}
                            >
                              {isSelected && (
                                <span style={{ color: T.paper, fontSize: 11, fontWeight: 700 }}>✓</span>
                              )}
                            </div>
                          )}

                          {/* Color dot */}
                          <div style={{width:8,height:8,borderRadius:"50%",background:p.color||T.forest,marginTop:7,flexShrink:0}}></div>
                          <div style={{flex:1,minWidth:0}}>
                            {/* Entry stamp */}
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                              <div style={{fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,fontWeight:600}}>
                                {t('entry_no') + entryNum}
                                {pinHasUnread && <span style={{marginLeft:8,background:"#b85c2a",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:9,fontWeight:600,letterSpacing:"0.08em"}}>💬 {t('new_tag')}</span>}
                                {pinHasUpvoteNew && <span style={{marginLeft:4,background:"#2a5d3c",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:9,fontWeight:600,letterSpacing:"0.08em"}}>▲ {t('new_tag')}</span>}
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
                              <span>{"▲ "+upvoteCount+(pinHasUpvoteNew?" 🆕":"")}</span>
                              {commentCount>0 && <span style={{color:pinHasUnread?"#b85c2a":T.ink4,fontWeight:pinHasUnread?600:400}}>{"💬 "+commentCount+(pinHasUnread?" " + t('new_tag').toLowerCase():"")}</span>}
                              <span style={(function() {
                                var prv = (p.privacy || "").toLowerCase();
                                var base = {
                                  marginLeft: "auto",
                                  fontSize: 9,
                                  fontWeight: 700,
                                  letterSpacing: "0.06em",
                                  textTransform: "uppercase",
                                  padding: "2px 8px",
                                  borderRadius: 12,
                                  border: "1px solid"
                                };
                                if (prv === 'private') {
                                  return Object.assign(base, {
                                    color: "#37474f",
                                    backgroundColor: "#eceff1",
                                    borderColor: "#cfd8dc"
                                  });
                                } else if (prv === 'insider') {
                                  return Object.assign(base, {
                                    color: "#b85c2a",
                                    backgroundColor: "#fdf3eb",
                                    borderColor: "#f8d7c4"
                                  });
                                } else {
                                  return Object.assign(base, {
                                    color: T.forest,
                                    backgroundColor: T.forestPale,
                                    borderColor: "#c7d8c5"
                                  });
                                }
                              })()}>
                                {(function() {
                                  var prv = (p.privacy || "").toLowerCase();
                                  if (prv === 'public') return t('form_privacy_public');
                                  if (prv === 'private') return t('form_privacy_private');
                                  if (prv === 'insider') return t('form_privacy_insider');
                                  return p.privacy || t('form_privacy_public');
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
              {!isManageMode && myPins.length>0 && (
                <div style={{padding:"0 22px 24px",display:"flex",gap:8}}>
                  <button style={{flex:1,padding:"10px",borderRadius:10,border:"1px solid "+T.border,background:"transparent",color:T.ink2,fontSize:13,cursor:"pointer",fontWeight:500}} onClick={() => dlFile(toGeoJSON(myPins),"all-pins.geojson","application/json")}>GeoJSON</button>
                  <button style={{flex:1,padding:"10px",borderRadius:10,border:"1px solid "+T.border,background:"transparent",color:T.ink2,fontSize:13,cursor:"pointer",fontWeight:500}} onClick={() => dlFile(toGPX(myPins),"all-pins.gpx","application/gpx+xml")}>GPX</button>
                </div>
              )}
            </div>

            {/* Sidebar Index */}
            {!isManageMode && sortedTags.length > 0 && (
              <div 
                className="scroll-index-sidebar"
                style={{
                  position: "absolute",
                  right: 4,
                  top: 8,
                  bottom: 8,
                  width: 28,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  zIndex: 10,
                  overflowY: "auto",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none"
                }}
              >
                {sortedTags.map(function(tag) {
                  var displayTag = tag.slice(0, 3).toUpperCase();
                  return (
                    <div
                      key={tag}
                      onClick={function() {
                        var el = document.getElementById("tag-group-" + tag);
                        var container = document.getElementById("mine-tab-list");
                        if (el && container) {
                          container.scrollTo({ top: el.offsetTop, behavior: "smooth" });
                        }
                      }}
                      title={"#" + tag}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: T.paper3,
                        border: "1px solid " + T.border,
                        color: T.ink2,
                        fontSize: 8,
                        fontWeight: 700,
                        fontFamily: T.mono,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        userSelect: "none",
                        boxShadow: T.shadow,
                        transition: "all 0.1s"
                      }}
                      onMouseEnter={function(e) {
                        e.currentTarget.style.background = T.forest;
                        e.currentTarget.style.color = T.paper;
                        e.currentTarget.style.transform = "scale(1.15)";
                      }}
                      onMouseLeave={function(e) {
                        e.currentTarget.style.background = T.paper3;
                        e.currentTarget.style.color = T.ink2;
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      {displayTag}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sticky Bulk Action Bar */}
          {isManageMode && selectedPinIds.size > 0 && (
            <div style={{
              position: "sticky",
              bottom: 0,
              background: T.paper3,
              borderTop: "2px solid " + T.border,
              padding: "12px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              boxShadow: "0 -4px 16px rgba(0,0,0,0.06)",
              flexShrink: 0,
              zIndex: 100
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>
                  {selectedPinIds.size} pin{selectedPinIds.size === 1 ? "" : "s"} selected
                </span>
                <button 
                  style={{
                    background: "transparent",
                    border: "none",
                    color: T.ink3,
                    fontSize: 12,
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                  onClick={function() {
                    var allIds = sortedPins.map(function(p){return p.id;});
                    setSelectedPinIds(new Set(allIds));
                  }}
                >
                  Select All
                </button>
              </div>
              
              <div style={{ display: "flex", gap: 8 }}>
                {/* Privacy dropdown */}
                <select
                  value=""
                  onChange={function(e) {
                    if (e.target.value) {
                      handleBulkPrivacy(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  style={{
                    flex: 1,
                    background: T.paper2,
                    border: "1px solid " + T.border,
                    borderRadius: 8,
                    padding: "8px",
                    fontSize: 12.5,
                    color: T.ink2,
                    fontWeight: 600,
                    outline: "none"
                  }}
                >
                  <option value="" disabled>🔒 Edit Privacy...</option>
                  <option value="public">🔓 Public</option>
                  <option value="insider">👁️ Insider</option>
                  <option value="private">🔒 Private</option>
                </select>

                {/* Export dropdown */}
                <select
                  value=""
                  onChange={function(e) {
                    if (e.target.value) {
                      handleBulkExport(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  style={{
                    flex: 1,
                    background: T.paper2,
                    border: "1px solid " + T.border,
                    borderRadius: 8,
                    padding: "8px",
                    fontSize: 12.5,
                    color: T.ink2,
                    fontWeight: 600,
                    outline: "none"
                  }}
                >
                  <option value="" disabled>📤 Export...</option>
                  <option value="geojson">GeoJSON</option>
                  <option value="gpx">GPX</option>
                </select>

                {/* Delete button */}
                <button
                  onClick={handleBulkDelete}
                  style={{
                    background: "#c62828",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
