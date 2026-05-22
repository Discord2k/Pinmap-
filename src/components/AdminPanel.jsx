import React from 'react';
import { T, S } from '../utils/styles';
import { sb } from '../utils/api';

// Helper function to format relative time for last seen or activity
function formatLastSeen(dateString, lang) {
  if (!dateString) return lang === 'es' ? "Nunca" : "Never";
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return lang === 'es' ? "Activo ahora" : "Active now";
  if (diffMins < 60) return lang === 'es' ? `Hace ${diffMins} min` : `${diffMins}m ago`;
  if (diffHours < 24) return lang === 'es' ? `Hace ${diffHours} h` : `${diffHours}h ago`;
  if (diffDays < 30) return lang === 'es' ? `Hace ${diffDays} d` : `${diffDays}d ago`;
  return date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' });
}

// Helper function to format relative time for activity feed
function formatRelativeTime(dateInput, lang) {
  if (!dateInput) return "";
  const now = new Date();
  const date = new Date(dateInput);
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return lang === 'es' ? "Hace unos segundos" : "Just now";
  if (diffMins < 60) return lang === 'es' ? `Hace ${diffMins} min` : `${diffMins}m ago`;
  if (diffHours < 24) return lang === 'es' ? `Hace ${diffHours} h` : `${diffHours}h ago`;
  if (diffDays < 30) return lang === 'es' ? `Hace ${diffDays} d` : `${diffDays}d ago`;
  return date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' });
}

const defaultFlash = () => {};

export function AdminPanel(props) {
  const lang = props.lang || 'en';
  const flash = props.flash || defaultFlash;
  const setOpen = props.setOpen || function(){};
  const focusPin = props.focusPin || function(){};
  const loadUserProfile = props.loadUserProfile || function(){};
  
  const [activeTab, setActiveTab] = React.useState("overview"); // overview, users, feed
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  
  // Data State
  const [users, setUsers] = React.useState([]);
  const [pins, setPins] = React.useState([]);
  const [comments, setComments] = React.useState([]);
  const [checkins, setCheckins] = React.useState([]);
  const [trails, setTrails] = React.useState([]);
  const [presence, setPresence] = React.useState([]);
  const [mappacks, setMappacks] = React.useState([]);
  const [activeNowList, setActiveNowList] = React.useState([]);
  const [active24hList, setActive24hList] = React.useState([]);
  const [sortedTags, setSortedTags] = React.useState([]);
  const [feedItems, setFeedItems] = React.useState([]);
  const [feedFilter, setFeedFilter] = React.useState("all");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [
        resProfiles,
        resPins,
        resComments,
        resCheckins,
        resTrails,
        resPresence,
        resMappacks,
      ] = await Promise.all([
        sb.from("profiles").select("*"),
        sb.from("pins").select("*").order("created_at", { ascending: false }),
        sb.from("comments").select("*").order("created_at", { ascending: false }),
        sb.from("checkins").select("*").order("created_at", { ascending: false }),
        sb.from("trails").select("*").order("created_at", { ascending: false }),
        sb.from("presence").select("*").order("last_seen", { ascending: false }),
        sb.from("mappacks").select("*"),
      ]);

      const loadedProfiles = resProfiles.data || [];
      const loadedPins = resPins.data || [];
      const loadedComments = resComments.data || [];
      const loadedCheckins = resCheckins.data || [];
      const loadedTrails = resTrails.data || [];
      const loadedPresence = resPresence.data || [];
      const loadedMappacks = resMappacks.data || [];

      setUsers(loadedProfiles);
      setPins(loadedPins);
      setComments(loadedComments);
      setCheckins(loadedCheckins);
      setTrails(loadedTrails);
      setPresence(loadedPresence);
      setMappacks(loadedMappacks);

      // Compute presence list active now and in last 24h
      const nowMs = Date.now();
      const fiveMinAgo = nowMs - 5 * 60 * 1000;
      const active24h = nowMs - 24 * 60 * 60 * 1000;
      
      const nowList = loadedPresence.filter(p => new Date(p.last_seen).getTime() > fiveMinAgo);
      const list24h = loadedPresence.filter(p => new Date(p.last_seen).getTime() > active24h);

      setActiveNowList(nowList);
      setActive24hList(list24h);

      // Compute top tags
      const tagCounts = {};
      loadedPins.forEach(p => {
        (p.tags || []).forEach(t => {
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        });
      });
      const sorted = Object.keys(tagCounts)
        .map(tag => ({ tag, count: tagCounts[tag] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setSortedTags(sorted);

      // Create aggregated live activity feed items
      const items = [];
      
      // 1. Pins
      loadedPins.forEach(p => {
        items.push({
          id: `pin-${p.id}`,
          type: "pin",
          date: new Date(p.created_at),
          user: p.owner,
          text: lang === 'es' ? `Agregó el pin: "${p.name}"` : `Added pin: "${p.name}"`,
          subtitle: p.description,
          tags: p.tags,
          lat: p.lat,
          lng: p.lng,
          pinObject: p
        });
      });

      // 2. Comments
      loadedComments.forEach(c => {
        // Find corresponding pin for mapping
        const matchingPin = loadedPins.find(p => p.id === c.pin_id);
        items.push({
          id: `comment-${c.id}`,
          type: "comment",
          date: new Date(c.created_at),
          user: c.owner,
          text: lang === 'es' ? `Comentó: "${c.body}"` : `Logged entry: "${c.body}"`,
          subtitle: matchingPin ? `On pin: "${matchingPin.name}"` : null,
          photoUrl: c.photo_url,
          lat: matchingPin ? matchingPin.lat : null,
          lng: matchingPin ? matchingPin.lng : null,
          pinObject: matchingPin
        });
      });

      // 3. Checkins
      loadedCheckins.forEach(ch => {
        const matchingPin = loadedPins.find(p => p.id === ch.pin_id);
        items.push({
          id: `checkin-${ch.id}`,
          type: "checkin",
          date: new Date(ch.created_at),
          user: ch.visitor,
          text: lang === 'es' ? `Registró visita (Check-in)` : `Checked in`,
          subtitle: matchingPin ? `At spot: "${matchingPin.name}"` : null,
          lat: ch.lat || (matchingPin ? matchingPin.lat : null),
          lng: ch.lng || (matchingPin ? matchingPin.lng : null),
          pinObject: matchingPin
        });
      });

      // 4. Trails
      loadedTrails.forEach(tr => {
        // Grab start coordinate if available
        const firstCoord = tr.coordinates && tr.coordinates[0];
        items.push({
          id: `trail-${tr.id}`,
          type: "trail",
          date: new Date(tr.created_at),
          user: tr.owner,
          text: lang === 'es' ? `Grabó sendero: "${tr.name}"` : `Recorded trail: "${tr.name}"`,
          subtitle: `${Number(tr.distance_km || 0).toFixed(2)} km · ${tr.duration_seconds ? Math.round(tr.duration_seconds / 60) + 'm' : ''}`,
          lat: firstCoord ? firstCoord[0] : null,
          lng: firstCoord ? firstCoord[1] : null
        });
      });

      // Sort feed items: newest first
      items.sort((a, b) => b.date - a.date);
      setFeedItems(items);

    } catch (e) {
      console.error("Admin stats loading failed", e);
      flash(lang === 'es' ? "Error al cargar datos" : "Failed to load admin stats");
    } finally {
      setLoading(false);
    }
  }, [lang, flash]);

  React.useEffect(() => {
    let active = true;
    
    // Defer initial load to avoid synchronous setState during effect setup
    const timer = setTimeout(() => {
      if (active) {
        fetchData();
      }
    }, 0);

    const interval = setInterval(() => {
      if (active) {
        fetchData();
      }
    }, 60000);

    return () => {
      active = false;
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchData]);

  // Filter users list based on search query
  const filteredUsers = users.filter(u => {
    const nameMatch = (u.id || "").toLowerCase().includes(searchQuery.toLowerCase());
    const bioMatch = (u.bio || "").toLowerCase().includes(searchQuery.toLowerCase());
    const locMatch = (u.location || "").toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || bioMatch || locMatch;
  });

  // Filter feed items based on feed filters
  const filteredFeed = feedItems.filter(item => {
    if (feedFilter === "all") return true;
    return item.type === feedFilter;
  });

  return (
    <div style={{height:"100%", display:"flex", flexDirection:"column", background:T.paper}}>
      
      {/* ── Admin Header ── */}
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 22px 12px", borderBottom:"1px solid "+T.borderSoft, background:T.paper2, flexShrink:0}}>
        <div>
          <div style={{fontSize:10, fontFamily:T.mono, letterSpacing:"0.18em", textTransform:"uppercase", fontWeight:600, color:T.ink3, marginBottom:2}}>
            {lang === 'es' ? "Consola de Administración" : "Admin Console"}
          </div>
          <div style={{fontSize:16, fontWeight:800, color:T.ink}}>{lang === 'es' ? "Métricas de PINMAP" : "PINMAP Metrics"}</div>
        </div>
        <button 
          style={Object.assign({}, S.miniBtn, {background: T.forest, color: T.paper, border:"none", display:"flex", alignItems:"center", gap:5, padding:"5px 12px"})}
          onClick={fetchData}
          disabled={loading}
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{animation: loading ? "spin 1s linear infinite" : "none"}}>
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {lang === 'es' ? "Actualizar" : "Refresh"}
        </button>
      </div>

      {/* ── Sub Navigation Tabs ── */}
      <div style={{display:"flex", borderBottom:"1px solid "+T.borderSoft, background:T.paper2, padding:"0 16px", flexShrink:0, overflowX:"auto", scrollbarWidth:"none"}}>
        {[
          { id: "overview", label: lang === 'es' ? "Resumen" : "Overview", icon: "📊" },
          { id: "users", label: lang === 'es' ? "Usuarios" : "Users", icon: "👥", count: users.length },
          { id: "feed", label: lang === 'es' ? "Actividad" : "Activity", icon: "📡" }
        ].map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                minWidth: 100,
                padding: "14px 10px",
                background: "transparent",
                border: "none",
                borderBottom: active ? "2.5px solid "+T.forest : "2.5px solid transparent",
                color: active ? T.forest : T.ink3,
                fontWeight: active ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "color 0.2s"
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span style={{fontSize:10.5, background: active ? T.forestPale : "rgba(0,0,0,0.06)", color: active ? T.forest : T.ink2, padding:"2px 6px", borderRadius:10, fontWeight:700}}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content Area ── */}
      <div style={{flex:1, overflowY:"auto", padding:"18px 22px 28px"}}>
        {loading && feedItems.length === 0 ? (
          <div style={{textAlign:"center", padding:"48px 0", color:T.ink3, fontSize:14.5}}>
            <div style={{display:"inline-block", width:24, height:24, border:"3px solid "+T.forestPale, borderTopColor:T.forest, borderRadius:"50%", animation:"spin 1s linear infinite", marginBottom:12}} />
            <div>{lang === 'es' ? "Cargando panel de administración…" : "Loading admin panel metrics…"}</div>
          </div>
        ) : (
          <>
            {/* ── 1. Overview Tab ── */}
            {activeTab === "overview" && (
              <div>
                {/* Metric Dashboard Cards */}
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20}}>
                  {[
                    { label: lang === 'es' ? "Usuarios Totales" : "Total Users", val: users.length, icon: "👤", color: T.forest },
                    { label: lang === 'es' ? "Pines Guardados" : "Total Pins", val: pins.length, icon: "📍", color: "#e65100" },
                    { label: lang === 'es' ? "Registros de Bitácora" : "Field Entries", val: comments.length, icon: "💬", color: "#1565c0" },
                    { label: lang === 'es' ? "Check-ins GPS" : "GPS Check-ins", val: checkins.length, icon: "📡", color: "#ad1457" },
                    { label: lang === 'es' ? "Rutas GPX" : "GPX Trails", val: trails.length, icon: "🥾", color: "#6a1599" },
                    { label: lang === 'es' ? "Colecciones" : "Collections", val: mappacks.length, icon: "🧭", color: "#00695c" }
                  ].map((card, i) => (
                    <div key={i} style={Object.assign({}, S.card, {background:T.paper2, margin:0, padding:14, display:"flex", alignItems:"center", gap:12})}>
                      <div style={{width:38, height:38, borderRadius:10, background:T.paper3, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18}}>
                        {card.icon}
                      </div>
                      <div>
                        <div style={{fontSize:20, fontWeight:800, color:T.ink, lineHeight:1.1, marginBottom:2}}>{card.val.toLocaleString()}</div>
                        <div style={{fontSize:9.5, color:T.ink3, textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:T.mono}}>{card.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Session Active Counts */}
                <div style={{background:T.paper2, border:"1px solid "+T.borderSoft, borderRadius:14, padding:16, marginBottom:20}}>
                  <div style={{fontSize:11.5, letterSpacing:"0.08em", textTransform:"uppercase", fontWeight:700, color:T.ink3, fontFamily:T.mono, marginBottom:12, display:"flex", alignItems:"center", gap:6}}>
                    <span style={{width:8, height:8, borderRadius:"50%", background:"#4caf50", display:"inline-block"}} />
                    {lang === 'es' ? "Estado de Conexión en Tiempo Real" : "Real-time Presence status"}
                  </div>
                  
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, paddingBottom:14, borderBottom:"1px solid "+T.borderSoft}}>
                    <div>
                      <div style={{fontSize:24, fontWeight:800, color:T.forest}}>{activeNowList.length}</div>
                      <div style={{fontSize:12, color:T.ink2}}>{lang === 'es' ? "Activos (últimos 5 mins)" : "Online now (last 5 mins)"}</div>
                    </div>
                    <div>
                      <div style={{fontSize:24, fontWeight:800, color:T.ink}}>{active24hList.length}</div>
                      <div style={{fontSize:12, color:T.ink2}}>{lang === 'es' ? "Activos en las últimas 24h" : "Active in past 24 hours"}</div>
                    </div>
                  </div>

                  {/* Active list */}
                  <div style={{marginTop:12}}>
                    <div style={{fontSize:11, color:T.ink3, fontWeight:600, marginBottom:8}}>{lang === 'es' ? "USUARIOS ONLINE RECIENTEMENTE" : "RECENTLY ACTIVE USERS"}</div>
                    {active24hList.length === 0 ? (
                      <div style={{fontSize:12.5, color:T.ink4, fontStyle:"italic"}}>{lang === 'es' ? "Ningún usuario activo hoy" : "No users online today"}</div>
                    ) : (
                      <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
                        {active24hList.slice(0, 10).map((act, idx) => {
                          const isOnline = activeNowList.some(o => o.owner === act.owner);
                          return (
                            <span 
                              key={idx} 
                              onClick={() => loadUserProfile(act.owner)}
                              style={{
                                display:"inline-flex", 
                                alignItems:"center", 
                                gap:5, 
                                background:T.paper3, 
                                padding:"4px 10px", 
                                borderRadius:12, 
                                fontSize:12, 
                                color:T.ink, 
                                fontWeight:600, 
                                cursor:"pointer",
                                border:"1px solid "+T.borderSoft
                              }}
                            >
                              <span style={{width:6, height:6, borderRadius:"50%", background: isOnline ? "#4caf50" : "#ff9800"}} />
                              @{act.owner}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Popular Tags & System Quests Summary */}
                <div style={{display:"grid", gridTemplateColumns:"1fr", gap:16}}>
                  {/* Top Tags */}
                  <div style={{background:T.paper2, border:"1px solid "+T.borderSoft, borderRadius:14, padding:16}}>
                    <div style={Object.assign({}, S.secHead, {marginBottom:12})}>{lang === 'es' ? "Hashtags más populares" : "Popular Hashtags"}</div>
                    {sortedTags.length === 0 ? (
                      <div style={{fontSize:12.5, color:T.ink4, fontStyle:"italic"}}>{lang === 'es' ? "Sin etiquetas registradas" : "No hashtags logged yet"}</div>
                    ) : (
                      <div style={{display:"flex", flexDirection:"column", gap:8}}>
                        {sortedTags.map((tag, idx) => (
                          <div key={idx} style={{display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:13, color:T.ink2}}>
                            <span style={{fontFamily:T.mono, fontWeight:600}}>#{tag.tag}</span>
                            <span style={{background:T.paper3, padding:"2px 8px", borderRadius:10, fontSize:11, fontWeight:700}}>{tag.count} {lang === 'es' ? "pines" : "pins"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── 2. User Directory Tab ── */}
            {activeTab === "users" && (
              <div>
                {/* Search field */}
                <div style={{position:"relative", marginBottom:14}}>
                  <input
                    type="text"
                    placeholder={lang === 'es' ? "Buscar por usuario o ubicación…" : "Search users by name or location…"}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={Object.assign({}, S.input, {paddingLeft:"34px", background:T.paper2, marginBottom:0})}
                  />
                  <span style={{position:"absolute", left:12, top:"12px", color:T.ink3, fontSize:14}}>🔍</span>
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")} 
                      style={{position:"absolute", right:12, top:"8px", background:"transparent", border:"none", fontSize:18, color:T.ink3, cursor:"pointer"}}
                    >
                      ×
                    </button>
                  )}
                </div>

                <div style={{fontSize:11, color:T.ink3, fontFamily:T.mono, marginBottom:12, textTransform:"uppercase", letterSpacing:"0.06em"}}>
                  {lang === 'es' ? `Mostrando ${filteredUsers.length} de ${users.length} usuarios` : `Showing ${filteredUsers.length} of ${users.length} users`}
                </div>

                {/* Users List */}
                {filteredUsers.length === 0 ? (
                  <div style={{textAlign:"center", padding:"32px 0", color:T.ink3, fontSize:13.5, fontStyle:"italic"}}>
                    {lang === 'es' ? "No se encontraron usuarios coincidentes" : "No matching users found"}
                  </div>
                ) : (
                  <div style={{display:"flex", flexDirection:"column", gap:10}}>
                    {filteredUsers.map(user => {
                      const userPinsCount = pins.filter(p => p.owner === user.id).length;
                      const userCheckinsCount = checkins.filter(c => c.visitor === user.id).length;
                      const userTrailsCount = trails.filter(t => t.owner === user.id).length;
                      const userCommentsCount = comments.filter(c => c.owner === user.id).length;
                      
                      // Find presence last seen
                      const userPresence = presence.find(p => p.owner === user.id);
                      const isOnline = userPresence && activeNowList.some(o => o.owner === user.id);
                      const is24h = userPresence && active24hList.some(o => o.owner === user.id);
                      
                      // Resolve avatar
                      const initials = (user.id || "?").slice(0, 2).toUpperCase();
                      const avatarSrc = user.avatar_url || user.google_avatar;

                      return (
                        <div key={user.id} style={Object.assign({}, S.card, {padding:14, cursor:"default", background:T.paper2, margin:0})}>
                          <div style={{display:"flex", alignItems:"flex-start", gap:12}}>
                            {/* Avatar */}
                            <div style={{
                              width:44, height:44, borderRadius:"50%", 
                              background: T.forestPale, color: T.forest, 
                              display:"flex", alignItems:"center", justifyContent:"center", 
                              fontWeight:700, fontSize:15, flexShrink:0, overflow:"hidden",
                              border:"1px solid "+T.borderSoft
                            }}>
                              {avatarSrc ? (
                                <img src={avatarSrc} style={{width:"100%", height:"100%", objectFit:"cover"}} onError={e => e.target.style.display='none'} />
                              ) : initials}
                            </div>
                            
                            {/* Details */}
                            <div style={{flex:1, minWidth:0}}>
                              <div style={{display:"flex", alignItems:"center", gap:6, flexWrap:"wrap"}}>
                                <span style={{fontWeight:700, fontSize:15, color:T.ink}}>@{user.id}</span>
                                <span style={{
                                  display:"inline-flex", alignItems:"center", gap:3.5, 
                                  fontSize:10, background: isOnline ? "rgba(76,175,80,0.12)" : is24h ? "rgba(255,152,0,0.12)" : "rgba(0,0,0,0.05)",
                                  color: isOnline ? "#2e7d32" : is24h ? "#ef6c00" : T.ink3,
                                  padding:"2px 6px", borderRadius:8, fontWeight:700, fontFamily:T.mono
                                }}>
                                  <span style={{width:5, height:5, borderRadius:"50%", background: isOnline ? "#4caf50" : is24h ? "#ff9800" : "#9e9e9e"}} />
                                  {isOnline ? (lang === 'es' ? "En línea" : "Online") : formatLastSeen(userPresence?.last_seen, lang)}
                                </span>
                              </div>
                              
                              {user.location && (
                                <div style={{fontSize:11.5, color:T.ink3, marginTop:2, fontWeight:500}}>📍 {user.location}</div>
                              )}
                              
                              {user.bio && (
                                <div style={{fontSize:12.5, color:T.ink2, marginTop:4, fontStyle:"italic", lineHeight:1.35}}>{user.bio}</div>
                              )}

                              {/* Stats badges */}
                              <div style={{display:"flex", gap:5, marginTop:8, flexWrap:"wrap"}}>
                                {[
                                  { label: "pins", val: userPinsCount, icon: "📍" },
                                  { label: "logs", val: userCommentsCount, icon: "💬" },
                                  { label: "checkins", val: userCheckinsCount, icon: "📡" },
                                  { label: "trails", val: userTrailsCount, icon: "🥾" }
                                ].map((stat, sIdx) => (
                                  <span key={sIdx} style={{fontSize:10, fontFamily:T.mono, background:T.paper3, color:T.ink2, padding:"2px 6.5px", borderRadius:6, display:"inline-flex", alignItems:"center", gap:2}}>
                                    <span>{stat.icon}</span>
                                    <strong>{stat.val}</strong>
                                  </span>
                                ))}
                              </div>

                              {/* Actions */}
                              <div style={{display:"flex", gap:8, marginTop:10}}>
                                <button
                                  style={Object.assign({}, S.miniBtn, {fontSize:11, padding:"4.5px 10px", background:"transparent", color: T.forest, border:"1px solid "+T.forest})}
                                  onClick={() => {
                                    setOpen(false); // Close drawer
                                    // Pan to user pins or filter map to show only this user's pins
                                    // By setting map filter to user id
                                    if (props.focusUserPins) props.focusUserPins(user.id);
                                  }}
                                >
                                  🗺️ {lang === 'es' ? "Ver pines en mapa" : "Map Pins"}
                                </button>
                                <button
                                  style={Object.assign({}, S.miniBtn, {fontSize:11, padding:"4.5px 10px", background:T.paper3, color:T.ink2, border:"1px solid "+T.border})}
                                  onClick={() => loadUserProfile(user.id)}
                                >
                                  👤 {lang === 'es' ? "Ver Perfil" : "View Profile"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── 3. Live Activity Feed Tab ── */}
            {activeTab === "feed" && (
              <div>
                {/* Filters */}
                <div style={{display:"flex", gap:5, marginBottom:14, overflowX:"auto", scrollbarWidth:"none", paddingBottom:4}}>
                  {[
                    { id: "all", label: lang === 'es' ? "Todo" : "All" },
                    { id: "pin", label: lang === 'es' ? "Pines" : "Pins" },
                    { id: "comment", label: lang === 'es' ? "Registros" : "Field Logs" },
                    { id: "checkin", label: lang === 'es' ? "Checkins" : "Checkins" },
                    { id: "trail", label: lang === 'es' ? "Rutas" : "Trails" }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFeedFilter(f.id)}
                      style={{
                        background: feedFilter === f.id ? T.forest : T.paper2,
                        color: feedFilter === f.id ? T.paper : T.ink2,
                        border: "1px solid "+(feedFilter === f.id ? T.forest : T.border),
                        padding: "5px 12px",
                        borderRadius: 14,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Feed Items list */}
                {filteredFeed.length === 0 ? (
                  <div style={{textAlign:"center", padding:"32px 0", color:T.ink3, fontSize:13.5, fontStyle:"italic"}}>
                    {lang === 'es' ? "No hay actividad reciente en esta categoría" : "No recent activity in this category"}
                  </div>
                ) : (
                  <div style={{display:"flex", flexDirection:"column", gap:10}}>
                    {filteredFeed.slice(0, 40).map(item => {
                      const relativeTime = formatRelativeTime(item.date, lang);
                      
                      // Map icons and colors
                      const icons = {
                        pin: { emoji: "📍", bg: "#fff3e0", color: "#e65100" },
                        comment: { emoji: "💬", bg: "#e3f2fd", color: "#1565c0" },
                        checkin: { emoji: "📡", bg: "#fce4ec", color: "#ad1457" },
                        trail: { emoji: "🥾", bg: "#f3e5f5", color: "#6a1599" }
                      };
                      const styleConfig = icons[item.type] || { emoji: "📝", bg: T.paper2, color: T.ink };

                      return (
                        <div key={item.id} style={Object.assign({}, S.card, {padding:12, margin:0, background:T.paper2, cursor:"default"})}>
                          <div style={{display:"flex", alignItems:"flex-start", gap:10}}>
                            {/* Icon badge */}
                            <div style={{
                              width:30, height:30, borderRadius:8, 
                              background: styleConfig.bg, color: styleConfig.color, 
                              display:"flex", alignItems:"center", justifyContent:"center", 
                              fontSize:14, flexShrink:0
                            }}>
                              {styleConfig.emoji}
                            </div>
                            
                            {/* Content */}
                            <div style={{flex:1, minWidth:0}}>
                              <div style={{display:"flex", alignItems:"baseline", justifyContent:"space-between", gap:4}}>
                                <span style={{fontWeight:700, fontSize:13, color:T.ink, cursor:"pointer"}} onClick={() => loadUserProfile(item.user)}>
                                  @{item.user}
                                </span>
                                <span style={{fontSize:10.5, color:T.ink3, fontFamily:T.mono, flexShrink:0}}>{relativeTime}</span>
                              </div>
                              
                              <div style={{fontSize:13, color:T.ink2, marginTop:2, fontWeight:500}}>{item.text}</div>
                              
                              {item.subtitle && (
                                <div style={{fontSize:12, color:T.ink3, marginTop:2, fontStyle:"italic", overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical"}}>{item.subtitle}</div>
                              )}

                              {item.photoUrl && (
                                <div style={{marginTop:6, borderRadius:6, overflow:"hidden", maxHeight:80, border:"1px solid "+T.borderSoft, maxWidth:120}}>
                                  <img src={item.photoUrl} style={{width:"100%", height:"100%", objectFit:"cover"}} />
                                </div>
                              )}

                              {/* Show on Map button if location coordinates are available */}
                              {item.lat && item.lng && (
                                <button
                                  style={{
                                    marginTop: 8,
                                    background: "transparent",
                                    border: "none",
                                    color: T.forest,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    padding: 0,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 3
                                  }}
                                  onClick={() => {
                                    setOpen(false); // Close drawer
                                    if (item.pinObject) {
                                      focusPin(item.pinObject);
                                    } else {
                                      // Pan general location coordinates
                                      window._mapFocusCoords = [item.lat, item.lng];
                                      if (window.mapObjectInstance) {
                                        window.mapObjectInstance.setView([item.lat, item.lng], 16);
                                      }
                                    }
                                  }}
                                >
                                  🗺️ {lang === 'es' ? "Mostrar en Mapa" : "Show on Map"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
