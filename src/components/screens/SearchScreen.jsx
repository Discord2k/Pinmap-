import React from 'react';
import { T } from '../../utils/styles';
import { distKm } from '../../utils/helpers';
const e = React.createElement;

export function SearchScreen(props) {
  const {
     searchMode, setSearchMode, searchTag, setSearchTag, questSearch, setQuestSearch,
     trailSearch, setTrailSearch, mapPackSearch, setMapPackSearch, activitySearch, setActivitySearch,
     addrSearch, setAddrSearch, addrResults, setAddrResults, addrLoading, setAddrLoading,
     t, doSearch, doTrailSearch, doAddrSearch, goToAddr, setOpen, 
     challenges, deletedQuestIds, checkins, pins, uname, lang, flash,
     activeQuestId, setActiveQuestId, setDeletedQuestIds, setChallenges,
     setSearchResults, setTrailSearchResults, mapPacks, collabPackIds, activeMapPack,
     handleSelectMapPack, loadUserProfile, expeditionLog, expeditionLogLoading,
     mapObj, setSelPin, setActiveTrail, activeFilter, searchResults, follows, toggleFollow,
     trending, userLL, focusPin, api, trailSearchLoading, trailSearchResults,
     activeTrail, savedTrailIds, setSavedTrailIds, setTrails, setActiveFilter
  } = props;

  const [huntsList, setHuntsList] = React.useState([]);
  const [huntsLoading, setHuntsLoading] = React.useState(false);
  const [huntsSearch, setHuntsSearch] = React.useState("");

  React.useEffect(() => {
    if (searchMode === "hunts") {
      setHuntsLoading(true);
      api.listHunts()
        .then(data => {
          const publicHunts = (data || []).filter(h => h.visibility === 'public');
          setHuntsList(publicHunts);
          setHuntsLoading(false);
        })
        .catch(err => {
          console.error("Error fetching hunts in Search:", err);
          setHuntsLoading(false);
        });
    }
  }, [searchMode]);

  const handleEnrollHunt = async (hunt) => {
    if (!uname || uname === 'guest') {
      flash(lang === 'es' ? "Inicia sesión para participar." : "Sign in to participate.");
      return;
    }
    try {
      const part = await api.getParticipant(hunt.id, uname);
      if (part) {
        flash(lang === 'es' ? "Ya estás inscrito. ¡Visita tu Perfil para jugar!" : "Already enrolled. Go to Profile to play!");
        return;
      }
      await api.enrollInHunt(hunt.id, uname, 'BROWSE_PUBLIC');
      flash(lang === 'es' ? "🎉 ¡Te has unido! Visita la pestaña Perfil para jugar." : "🎉 Joined! Go to Profile tab to play.");
    } catch (err) {
      console.error("Enroll error:", err);
      flash(lang === 'es' ? "Error al inscribirse." : "Error enrolling in the hunt.");
    }
  };

  return e("div",{style:{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}},

    e("div",{className:"pm-search-input-wrap",style:{background:T.paper,flexShrink:0}},
      e("div",{style:{position:"relative",width:"100%",marginBottom:6}},
        e("input",{
          style:{width:"100%",boxSizing:"border-box",background:T.paper2,border:"1px solid "+T.border,
            borderRadius:12,padding:"12px 36px 12px 16px",fontSize:16,outline:"none",color:T.ink,fontFamily:T.font},
          placeholder:searchMode==="tags"?t("search_placeholder_tags_detail"):searchMode==="quests"?t("search_placeholder_quests"):searchMode==="trails"?t("search_placeholder_trails"):searchMode==="mappacks"?(lang==="es"?"Buscar guías...":"Search guides..."):searchMode==="activity"?(lang==="es"?"Filtrar activity...":"Filter activity..."):searchMode==="hunts"?(lang==="es"?"Buscar búsquedas públicas...":"Search public hunts..."):t("search_placeholder_places_detail"),
          value:searchMode==="tags"?searchTag:searchMode==="quests"?questSearch:searchMode==="trails"?trailSearch:searchMode==="mappacks"?mapPackSearch:searchMode==="activity"?activitySearch:searchMode==="hunts"?huntsSearch:addrSearch,
          onChange:function(ev){if(searchMode==="tags")setSearchTag(ev.target.value);else if(searchMode==="quests")setQuestSearch(ev.target.value);else if(searchMode==="trails")setTrailSearch(ev.target.value);else if(searchMode==="mappacks")setMapPackSearch(ev.target.value);else if(searchMode==="activity")setActivitySearch(ev.target.value);else if(searchMode==="hunts")setHuntsSearch(ev.target.value);else setAddrSearch(ev.target.value);},
          onKeyDown:function(ev){if(ev.key==="Enter"){if(searchMode==="tags")doSearch();else if(searchMode==="trails")doTrailSearch();else if(searchMode==="places")doAddrSearch();}}
        }),
        (function(){
          var val = searchMode==="tags"?searchTag:searchMode==="quests"?questSearch:searchMode==="trails"?trailSearch:searchMode==="mappacks"?mapPackSearch:searchMode==="activity"?activitySearch:searchMode==="hunts"?huntsSearch:addrSearch;
          if (!val) return null;
          return e("button",{
            style:{
              position:"absolute",
              right:12,
              top:"50%",
              transform:"translateY(-50%)",
              background:"none",
              border:"none",
              color:T.ink3,
              fontSize:22,
              fontWeight:"300",
              cursor:"pointer",
              padding:4,
              display:"flex",
              alignItems:"center",
              justifyContent:"center"
            },
            onClick:function(){
              if(searchMode==="tags"){setSearchTag("");setSearchResults(null);}
              else if(searchMode==="quests")setQuestSearch("");
              else if(searchMode==="trails"){setTrailSearch("");setTrailSearchResults([]);}
              else if(searchMode==="mappacks")setMapPackSearch("");
              else if(searchMode==="activity")setActivitySearch("");
              else if(searchMode==="hunts")setHuntsSearch("");
              else {setAddrSearch("");setAddrResults([]);}
            }
          },"×");
        })()
      ),
      (searchMode!=="quests" && searchMode!=="activity" && searchMode!=="mappacks" && searchMode!=="hunts") && e("button",{
        style:{width:"100%",padding:"11px",borderRadius:10,background:T.forest,color:T.paper,border:"none",fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:8},
        onClick:function(){if(searchMode==="tags")doSearch();else if(searchMode==="trails")doTrailSearch();else doAddrSearch();}
      },t("search_btn")),
          e("div",{id:"search-tabs",style:{display:"flex",flexWrap:"wrap",gap:"6px 8px",width:"100%",borderBottom:"1px solid "+T.borderSoft,padding:"8px 16px"}},
            e("button",{className:"pm-search-tab",style:{color:searchMode==="tags"?T.paper:T.ink3,background:searchMode==="tags"?T.forest:"transparent",border:"1px solid "+(searchMode==="tags"?T.forest:T.border),borderRadius:"20px",padding:"6px 12px",fontSize:"12px",fontWeight:"600",display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer"},onClick:function(){setSearchMode("tags");setAddrResults([]);setSearchTag("");}
            },
              e("svg",{width:12,height:12,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round"},e("path",{d:"M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"}),e("circle",{cx:"7",cy:"7",r:"0.5",fill:"currentColor"})),
              t("search_mode_tags")
            ),
            e("button",{className:"pm-search-tab",style:{color:searchMode==="places"?T.paper:T.ink3,background:searchMode==="places"?T.forest:"transparent",border:"1px solid "+(searchMode==="places"?T.forest:T.border),borderRadius:"20px",padding:"6px 12px",fontSize:"12px",fontWeight:"600",display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer"},onClick:function(){setSearchMode("places");}
            },
              e("svg",{width:12,height:12,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round"},e("path",{d:"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"}),e("circle",{cx:"12",cy:"10",r:"3"})),
              t("search_mode_places")
            ),
            e("button",{className:"pm-search-tab",style:{color:searchMode==="activity"?T.paper:T.ink3,background:searchMode==="activity"?T.forest:"transparent",border:"1px solid "+(searchMode==="activity"?T.forest:T.border),borderRadius:"20px",padding:"6px 12px",fontSize:"12px",fontWeight:"600",display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer"},onClick:function(){setSearchMode("activity");}
            },
              e("svg",{width:12,height:12,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round"},e("path",{d:"M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"}),e("circle",{cx:"5",cy:"19",r:"1",fill:"currentColor"})),
              t("search_mode_activity")
            ),
            e("button",{className:"pm-search-tab",style:{color:searchMode==="quests"?T.paper:T.ink3,background:searchMode==="quests"?T.forest:"transparent",border:"1px solid "+(searchMode==="quests"?T.forest:T.border),borderRadius:"20px",padding:"6px 12px",fontSize:"12px",fontWeight:"600",display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer"},onClick:function(){setSearchMode("quests");}
            },
              e("svg",{width:12,height:12,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round"},e("path",{d:"M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34M12 2a4 4 0 0 0-4 4v5c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V6a4 4 0 0 0-4-4z"})),
              t("search_mode_quests")
            ),
            e("button",{className:"pm-search-tab",style:{color:searchMode==="trails"?T.paper:T.ink3,background:searchMode==="trails"?T.forest:"transparent",border:"1px solid "+(searchMode==="trails"?T.forest:T.border),borderRadius:"20px",padding:"6px 12px",fontSize:"12px",fontWeight:"600",display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer"},onClick:function(){setSearchMode("trails"); doTrailSearch();}
            },
              e("svg",{width:12,height:12,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round"},e("path",{d:"M3 17l4-8 4 4 4-6 4 10"})),
              t("search_mode_trails")
            ),
            e("button",{className:"pm-search-tab",style:{color:searchMode==="mappacks"?T.paper:T.ink3,background:searchMode==="mappacks"?T.forest:"transparent",border:"1px solid "+(searchMode==="mappacks"?T.forest:T.border),borderRadius:"20px",padding:"6px 12px",fontSize:"12px",fontWeight:"600",display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer"},onClick:function(){setSearchMode("mappacks");}
            },
              e("svg",{width:12,height:12,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round"},e("path",{d:"M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"})),
              t("search_mode_mappacks")
            ),
            e("button",{className:"pm-search-tab",style:{color:searchMode==="hunts"?T.paper:T.ink3,background:searchMode==="hunts"?T.forest:"transparent",border:"1px solid "+(searchMode==="hunts"?T.forest:T.border),borderRadius:"20px",padding:"6px 12px",fontSize:"12px",fontWeight:"600",display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer"},onClick:function(){setSearchMode("hunts");}
            },
              e("svg",{width:12,height:12,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round"},e("path",{d:"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"}),e("line",{x1:"4",y1:"22",x2:"4",y2:"15"})),
              lang === "es" ? "Búsquedas" : "Hunts"
            )
          ),
        ),

        e("div",{className:"pm-search-results-wrap",style:{flex:1,overflowY:"auto"}},
          searchMode==="places"
            ? e("div",null,
                addrLoading&&e("div",{style:{padding:"20px 0",textAlign:"center",color:T.ink3,fontSize:13}},t("searching_loading")),
                addrResults.length>0&&addrResults.map(function(r,i){
                  var parts=r.display_name.split(",");
                  return e("div",{key:i,style:{display:"flex",alignItems:"center",gap:12,padding:"14px 0",borderBottom:"1px solid "+T.borderSoft,cursor:"pointer"},onClick:function(){goToAddr(r);setOpen(false);}},
                    e("svg",{width:14,height:18,viewBox:"0 0 28 36",style:{flexShrink:0}},e("path",{d:"M14 0 C 6.27 0 0 6.27 0 14 c 0 9.5 14 22 14 22 s 14 -12.5 14 -22 C 28 6.27 21.73 0 14 0 z",fill:T.forest}),e("circle",{cx:"14",cy:"14",r:"5",fill:T.paper})),
                    e("div",{style:{flex:1,minWidth:0}},
                      e("div",{style:{fontWeight:600,fontSize:15,color:T.ink,marginBottom:2}},parts[0]),
                      e("div",{style:{fontSize:12,color:T.ink3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},parts.slice(1,3).join(",").trim())
                    )
                  );
                }),
                addrResults.length===0&&!addrLoading&&addrSearch&&e("div",{style:{padding:"20px 0",textAlign:"center",color:T.ink3,fontSize:13}},t("no_places_found"))
              )
            : searchMode==="quests"
            ? e("div",null,
                (function(){
                  var trackedList = [];
                  try {
                    var saved = localStorage.getItem("pinmap_tracked_quests");
                    trackedList = saved ? JSON.parse(saved) : [];
                  } catch(e){}

                  var query = questSearch.toLowerCase().trim();
                  var visible = challenges.filter(function(ch) {
                    return deletedQuestIds.indexOf(ch.id) < 0;
                  });

                  var filtered = visible.filter(function(ch) {
                    if (!query) return true;
                    var titleMatch = ch.title && ch.title.toLowerCase().indexOf(query) >= 0;
                    var descMatch = ch.description && ch.description.toLowerCase().indexOf(query) >= 0;
                    var tagMatch = ch.tags && ch.tags.some(function(t) { return t.toLowerCase().indexOf(query) >= 0; });
                    return titleMatch || descMatch || tagMatch;
                  });

                  // Sort: community challenges first (ch.owner !== "system"), then system challenges last
                  var sorted = filtered.slice().sort(function(a, b) {
                    var aIsSystem = a.owner === "system" ? 1 : 0;
                    var bIsSystem = b.owner === "system" ? 1 : 0;
                    if (aIsSystem !== bIsSystem) {
                      return aIsSystem - bIsSystem; // system goes last
                    }
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0); // newest first
                  });

                  if (sorted.length === 0) {
                    return e("div",{style:{padding:"30px 0",textAlign:"center",color:T.ink3,fontSize:14,fontStyle:"italic"}},"No community quests found matching this search.");
                  }

                  return e("div",{style:{padding:"10px 0"}},
                    sorted.map(function(ch){
                      var chTags = ch.tags || [];
                      var checkedPinIds = checkins.map(function(c) { return c.pin_id; });
                      var matchingPins = pins.filter(function(p) {
                        if (checkedPinIds.indexOf(p.id) < 0) return false;
                        if (!p.tags) return false;
                        return p.tags.some(function(t) { return chTags.indexOf(t) >= 0; });
                      });
                      var count = Math.min(matchingPins.length, ch.required_count || 3);
                      var isDone = count >= (ch.required_count || 3);
                      var isTracked = trackedList.indexOf(ch.id) >= 0;

                      return e("div",{
                        key:ch.id,
                        style:{
                          background:T.paper2,
                          border:isDone ? "2px solid #d4af37" : "1px solid "+T.borderSoft,
                          borderRadius:14,
                          padding:"14px 16px",
                          marginBottom:12,
                          boxShadow:"0 1px 3px rgba(0,0,0,0.05)",
                          display:"flex",
                          gap:14,
                          alignItems:"flex-start"
                        }
                      },
                        e("div",{style:{fontSize:28,lineHeight:1.1,marginTop:2}},ch.icon || "🏆"),
                        e("div",{style:{flex:1,minWidth:0}},
                          e("div",{style:{display:"flex",alignItems:"baseline",gap:6,flexWrap:"wrap"}},
                            e("span",{style:{fontWeight:700,fontSize:14.5,color:T.ink}},ch.title),
                            ch.owner && ch.owner !== "system" && e("span",{style:{fontSize:11,color:T.ink3}},"by @"+ch.owner)
                          ),
                          e("div",{style:{fontSize:12.5,color:T.ink2,marginTop:4,lineHeight:1.4}},ch.description),
                          
                          // Tags
                          e("div",{style:{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}},
                            chTags.map(function(t, idx){
                              return e("span",{key:idx,style:{fontSize:9.5,background:"rgba(26,32,28,0.05)",color:T.ink2,padding:"2px 6px",borderRadius:4,fontFamily:T.mono}},"#"+t);
                            })
                          ),

                          // Progress bar
                          e("div",{style:{marginTop:10,display:"flex",alignItems:"center",gap:10}},
                            e("div",{style:{flex:1}},
                              e("div",{style:{display:"flex",justifyContent:"space-between",fontSize:10,color:T.ink3,fontFamily:T.mono,marginBottom:3}},
                                e("span",null,"Progress"),
                                e("span",null,count+" / "+(ch.required_count || 3))
                              ),
                              e("div",{style:{width:"100%",height:5,background:T.borderSoft,borderRadius:3,overflow:"hidden"}},
                                e("div",{style:{width:(count/(ch.required_count || 3)*100)+"%",height:"100%",background:isDone ? "#d4af37" : T.forest,borderRadius:3}})
                              )
                            ),
                            e("div",{style:{display:"flex",alignItems:"center",gap:8}},
                              ch.owner !== "system" && ch.owner !== uname && e("button",{
                                style:{
                                  background:isTracked ? "transparent" : T.borderSoft,
                                  color:isTracked ? T.ink3 : T.ink2,
                                  border:isTracked ? "1px solid "+T.borderSoft : "none",
                                  padding:"5px 10px",
                                  borderRadius:8,
                                  fontSize:11,
                                  fontWeight:700,
                                  cursor:"pointer"
                                },
                                onClick:function(){
                                  var list = [];
                                  try {
                                    var saved = localStorage.getItem("pinmap_tracked_quests");
                                    list = saved ? JSON.parse(saved) : [];
                                  } catch(e){}

                                  if (list.indexOf(ch.id) >= 0) {
                                    list = list.filter(function(x) { return x !== ch.id; });
                                    flash("Stopped tracking quest.");
                                    if (activeQuestId === ch.id) {
                                      setActiveQuestId("");
                                      localStorage.setItem("pinmap_active_quest_id", "");
                                    }
                                  } else {
                                    list = list.concat([ch.id]);
                                    flash("Started tracking quest! View in Profile.");
                                    // Remove from deleted/hidden if it was there
                                    setDeletedQuestIds(function(prev) {
                                      if (prev.indexOf(ch.id) >= 0) {
                                        var next = prev.filter(function(x) { return x !== ch.id; });
                                        localStorage.setItem("pinmap_deleted_quests", JSON.stringify(next));
                                        return next;
                                      }
                                      return prev;
                                    });
                                  }
                                  localStorage.setItem("pinmap_tracked_quests", JSON.stringify(list));
                                  // Force state update
                                  setChallenges(function(prev){ return prev.slice(); });
                                }
                              },isTracked ? "Tracked" : "Track"),
                              e("button",{
                                style:{
                                  background:activeQuestId === ch.id ? "#d4af37" : T.forest,
                                  color:"#fff",
                                  border:"none",
                                  padding:"5px 10px",
                                  borderRadius:8,
                                  fontSize:11,
                                  fontWeight:700,
                                  cursor:"pointer",
                                  display:"inline-flex",
                                  alignItems:"center",
                                  gap:3
                                },
                                onClick:function(){
                                  if (activeQuestId === ch.id) {
                                    setActiveQuestId("");
                                    localStorage.setItem("pinmap_active_quest_id", "");
                                    flash("Quest paused.");
                                  } else {
                                    // Track if not tracked and community quest
                                    if (!isTracked && ch.owner !== "system" && ch.owner !== uname) {
                                      var list = [];
                                      try {
                                        var saved = localStorage.getItem("pinmap_tracked_quests");
                                        list = saved ? JSON.parse(saved) : [];
                                      } catch(e){}
                                      if (list.indexOf(ch.id) < 0) {
                                        list = list.concat([ch.id]);
                                        localStorage.setItem("pinmap_tracked_quests", JSON.stringify(list));
                                      }
                                    }
                                    // Remove from deleted/hidden if it was there
                                    setDeletedQuestIds(function(prev) {
                                      if (prev.indexOf(ch.id) >= 0) {
                                        var next = prev.filter(function(x) { return x !== ch.id; });
                                        localStorage.setItem("pinmap_deleted_quests", JSON.stringify(next));
                                        return next;
                                      }
                                      return prev;
                                    });

                                    setActiveQuestId(ch.id);
                                    localStorage.setItem("pinmap_active_quest_id", ch.id);
                                    flash("🎯 Quest started! Follow your progress on the map.");
                                    setOpen(false); // Close sidebar drawer
                                  }
                                  // Force state update
                                  setChallenges(function(prev){ return prev.slice(); });
                                }
                              },activeQuestId === ch.id ? "🎯 Active" : "Start"),
                              e("button",{
                                style:{background:"none",border:"none",color:"#c05050",cursor:"pointer",padding:4,fontSize:14},
                                onClick:function(){
                                  if(ch.owner === uname) {
                                    if(confirm("Delete this challenge permanently for everyone?")){
                                      api.deleteChallenge(ch.id).then(function(){
                                        flash("Quest deleted permanently.");
                                        setChallenges(function(prev){ return prev.filter(function(x){ return x.id !== ch.id; }); });
                                      }).catch(function(err){
                                        flash("Delete failed: "+err.message);
                                      });
                                    }
                                  } else {
                                    if(confirm("Remove this quest from your list?")){
                                      setDeletedQuestIds(function(prev) {
                                        var next = prev.concat([ch.id]);
                                        localStorage.setItem("pinmap_deleted_quests", JSON.stringify(next));
                                        return next;
                                      });
                                      flash("Quest removed from your list.");
                                    }
                                  }
                                }
                              },"🗑️")
                            )
                          )
                        )
                      );
                    })
                  );
                })()
              )
            : searchMode==="trails"
            ? e("div",null,
                trailSearchLoading&&e("div",{style:{padding:"20px 0",textAlign:"center",color:T.ink3,fontSize:13}},t("searching_loading")),
                !trailSearchLoading&&trailSearchResults.length>0&&e("div",{style:{padding:"10px 0"}},
                  (function() {
                    var sorted = trailSearchResults.slice();
                    if (userLL && userLL.lat && userLL.lng) {
                      sorted = sorted.map(function(t) {
                        var minDist = Infinity;
                        if (t.coordinates && t.coordinates.length > 0) {
                          for (var i = 0; i < t.coordinates.length; i++) {
                            var pt = t.coordinates[i];
                            var d = distKm(userLL.lat, userLL.lng, pt[0], pt[1]);
                            if (d < minDist) minDist = d;
                          }
                        }
                        return Object.assign({}, t, { _distToUser: minDist });
                      });
                      sorted.sort(function(a, b) {
                        return a._distToUser - b._distToUser;
                      });
                    }
                    return sorted;
                  })().map(function(trail){
                    return e("div", {
                      key: trail.id,
                      style: {
                        padding: "14px 12px",
                        background: T.paper2,
                        border: "1px solid " + T.borderSoft,
                        borderRadius: 10,
                        marginBottom: 10,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        cursor: "pointer"
                      },
                      onClick: function() {
                        setActiveTrail(trail);
                        setOpen(false);
                      }
                    },
                      e("div", {style: {display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8}},
                        e("div", {style: {flex: 1, minWidth: 0}},
                          e("div", {style: {fontWeight: 700, fontSize: 15, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}, trail.name || "Untitled Trail"),
                          e("div", {style: {fontSize: 12, color: T.ink3, marginTop: 2}},
                            "by ",
                            e("span", {
                              style: {cursor: "pointer", textDecoration: "underline", color: T.forest, fontWeight: 500},
                              onClick: function(ev) { ev.stopPropagation(); loadUserProfile(trail.owner); }
                            }, "@" + trail.owner),
                            " · " + Number((trail.distance_km || 0) * 0.621371).toFixed(2) + " mi" +
                            (trail.duration_seconds ? " · " + (function(sec){
                              var h = Math.floor(sec / 3600);
                              var m = Math.floor((sec % 3600) / 60);
                              return (h > 0 ? h + "h " : "") + m + "m";
                            })(trail.duration_seconds) : "")
                          )
                        ),
                        e("span", {
                          style: {
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            backgroundColor: trail.color || T.forest,
                            flexShrink: 0,
                            marginTop: 5
                          }
                        })
                      ),
                      trail.description && e("div", {
                        style: {
                          fontSize: 12.5,
                          color: T.ink2,
                          lineHeight: 1.4,
                          maxHeight: 40,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical"
                        }
                      }, trail.description),
                      e("div", {style: {display: "flex", gap: 8, marginTop: 4}},
                        e("button", {
                          style: {
                            flex: 1,
                            fontSize: 12,
                            padding: "6px 12px",
                            borderRadius: 8,
                            cursor: "pointer",
                            background: activeTrail && activeTrail.id === trail.id ? T.forest : "transparent",
                            color: activeTrail && activeTrail.id === trail.id ? "#fff" : T.forest,
                            border: "1px solid " + T.forest,
                            fontWeight: 600
                          },
                          onClick: function(ev) {
                            ev.stopPropagation();
                            if (activeTrail && activeTrail.id === trail.id) {
                              setActiveTrail(null);
                            } else {
                              setActiveTrail(trail);
                              setOpen(false);
                            }
                          }
                        }, activeTrail && activeTrail.id === trail.id ? "Showing" : t("view_trail")),
                        (uname && uname !== "guest") && (function() {
                          var isSaved = savedTrailIds.indexOf(trail.id) >= 0;
                          return e("button", {
                            style: {
                              flex: 1,
                              fontSize: 12,
                              padding: "6px 12px",
                              borderRadius: 8,
                              cursor: "pointer",
                              background: isSaved ? T.forestPale : "transparent",
                              color: isSaved ? T.forest : T.ink3,
                              border: "1px solid " + (isSaved ? T.forest : T.border),
                              fontWeight: 600
                            },
                            onClick: function(ev) {
                              ev.stopPropagation();
                              if (isSaved) {
                                api.unsaveTrail(trail.id, uname).then(function() {
                                  setSavedTrailIds(function(prev) { return prev.filter(function(id) { return id !== trail.id; }); });
                                  api.getTrails(uname).then(function(data) { setTrails(data || []); });
                                  flash("Trail removed from saves");
                                }).catch(function() { flash("Unsave failed"); });
                              } else {
                                api.saveTrail(trail.id, uname).then(function() {
                                  setSavedTrailIds(function(prev) { return prev.concat([trail.id]); });
                                  api.getTrails(uname).then(function(data) { setTrails(data || []); });
                                  flash("Trail saved to profile!");
                                }).catch(function() { flash("Save failed"); });
                              }
                            }
                          }, isSaved ? "★ " + t("unsave_trail") : "☆ " + t("save_trail"));
                        })()
                      )
                    );
                  })
                ),
                !trailSearchLoading&&trailSearchResults.length===0&&trailSearch&&e("div",{style:{padding:"20px 0",textAlign:"center",color:T.ink3,fontSize:13}},t("no_trails_found"))
              )
            : searchMode==="mappacks"
            ? e("div",null,
                (function(){
                  var filtered = mapPacks.filter(function(g){
                    var hasAccess = g.is_public || g.owner === uname || collabPackIds.indexOf(g.id) >= 0;
                    return hasAccess && (
                      (g.name || "").toLowerCase().includes(mapPackSearch.toLowerCase()) || 
                      (g.description || "").toLowerCase().includes(mapPackSearch.toLowerCase())
                    );
                  });
                  if (filtered.length === 0) {
                    return e("div",{style:{padding:"20px 0",textAlign:"center",color:T.ink3,fontSize:13}}, lang === 'es' ? "No se encontraron guías." : "No guides found.");
                  }
                  return e("div",{style:{padding:"10px 0"}},
                    filtered.map(function(pack){
                      var isActive = activeMapPack && activeMapPack.id === pack.id;
                      return e("div",{key:pack.id,style:{padding:14,background:T.paper2,border:"1px solid "+T.borderSoft,borderRadius:10,marginBottom:10,cursor:"pointer"},onClick:function(){handleSelectMapPack(pack);setOpen(false);}},
                        e("div",{style:{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:4}},
                          e("span",{style:{fontWeight:700,fontSize:15,color:T.ink}},pack.name),
                          !pack.is_public && e("span",{style:{fontSize:10,background:T.borderSoft,color:T.ink3,padding:"1px 5px",borderRadius:4}}, t('private_badge')),
                          pack.owner !== uname && e("span",{style:{fontSize:10,background:"rgba(42,93,60,0.08)",color:T.forest,padding:"1px 5px",borderRadius:4,fontWeight:600}}, "👥 " + (lang === 'es' ? "Colaborador" : "Collaborator"))
                        ),
                        pack.description && e("div",{style:{fontSize:12.5,color:T.ink2,marginTop:4,lineHeight:1.4}},pack.description),
                        e("div",{style:{fontSize:11,color:T.ink3,marginTop:6}},
                          "by ",
                          e("span",{style:{cursor:"pointer",textDecoration:"underline"},onClick:function(ev){ev.stopPropagation();loadUserProfile(pack.owner);}},"@"+pack.owner)
                        ),
                        e("div",{style:{display:"flex",gap:8,marginTop:8}},
                          e("button",{
                            style:{
                              flex: 1,
                              fontSize: 12,
                              padding: "6px 12px",
                              borderRadius: 8,
                              cursor: "pointer",
                              background: isActive ? T.forest : "transparent",
                              color: isActive ? "#fff" : T.forest,
                              border: "1px solid " + T.forest,
                              fontWeight: 600
                            },
                            onClick:function(ev){
                              ev.stopPropagation();
                              if (isActive) {
                                handleSelectMapPack(null);
                              } else {
                                handleSelectMapPack(pack);
                                setOpen(false);
                              }
                            }
                          }, isActive ? "Showing" : "View on Map")
                        )
                      );
                    })
                  );
                })()
              )
            : searchMode==="hunts"
            ? e("div",null,
                huntsLoading && e("div",{style:{padding:"20px 0",textAlign:"center",color:T.ink3,fontSize:13}}, (lang === 'es' ? "Buscando..." : "Searching public hunts...")),
                !huntsLoading && (function(){
                  const query = huntsSearch.toLowerCase().trim();
                  const filtered = huntsList.filter(h => 
                    h.name.toLowerCase().includes(query) || 
                    (h.description && h.description.toLowerCase().includes(query)) ||
                    h.creator.toLowerCase().includes(query)
                  );
                  if (filtered.length === 0) {
                    return e("div",{style:{padding:"30px 0",textAlign:"center",color:T.ink3,fontSize:14,fontStyle:"italic"}}, lang === 'es' ? "No se encontraron búsquedas públicas." : "No public hunts found.");
                  }
                  return e("div",{style:{padding:"10px 0",display:"flex",flexDirection:"column",gap:10}},
                    filtered.map(hunt => 
                      e("div",{
                        key: hunt.id,
                        style:{
                          background: T.paper2, border: "1px solid " + T.borderSoft,
                          borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 8
                        }
                      },
                        e("div",{style:{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:8}},
                          e("span",{style:{fontWeight:700,fontSize:15,color:T.ink}}, hunt.name),
                          e("span",{style:{fontSize:11,color:T.ink3}}, `by @${hunt.creator}`)
                        ),
                        hunt.description && e("div",{style:{fontSize:12.5,color:T.ink2,lineHeight:1.4}}, hunt.description),
                        e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4}},
                          e("span",{style:{fontSize:11,color:T.ink3,fontFamily:T.mono}}, 
                            lang === 'es' ? `Termina: ${new Date(hunt.end_date).toLocaleDateString()}` 
                            : `Expires: ${new Date(hunt.end_date).toLocaleDateString()}`
                          ),
                          e("button",{
                            onClick: () => handleEnrollHunt(hunt),
                            style: { background: T.forest, color: T.paper, border: "none", padding: "6px 12px", borderRadius: 8, fontWeight: 700, fontSize: "12px", cursor: "pointer" }
                          }, lang === 'es' ? "Participar" : "Join Hunt")
                        )
                      )
                    )
                  );
                })()
              )
            : searchMode==="activity"
            ? e("div",null,
                expeditionLogLoading && e("div",{style:{padding:"20px 0",textAlign:"center",color:T.ink3,fontSize:13}}, "Loading activity feed..."),
                !expeditionLogLoading && expeditionLog.length === 0 && e("div",{style:{padding:"20px 0",textAlign:"center",color:T.ink3,fontSize:13}}, "No recent activity from users or tags you follow."),
                !expeditionLogLoading && expeditionLog.length > 0 && e("div",{style:{padding:"10px 0"}},
                  (function(){
                    var query = activitySearch.toLowerCase();
                    var filtered = expeditionLog.filter(function(item){
                      var matchText = (item.name || item.body || "").toLowerCase();
                      var matchOwner = (item.owner || "").toLowerCase();
                      return matchText.includes(query) || matchOwner.includes(query);
                    });
                    if (filtered.length === 0) {
                      return e("div",{style:{padding:"20px 0",textAlign:"center",color:T.ink3,fontSize:13}}, "No activity matching filter.");
                    }
                    return filtered.map(function(item){
                      var timeLabel = new Date(item.created_at).toLocaleDateString(undefined, {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
                      if (item.type === "pin") {
                        return e("div",{key:item.type+"_"+item.id,style:{padding:12,background:T.paper2,border:"1px solid "+T.borderSoft,borderRadius:10,marginBottom:8}},
                          e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}},
                            e("span",{style:{fontSize:11,fontWeight:700,color:T.forest,fontFamily:T.mono}},"📍 PIN ADDED"),
                            e("span",{style:{fontSize:10,color:T.ink3}},timeLabel)
                          ),
                          e("div",{style:{fontWeight:700,fontSize:15,color:T.ink,cursor:"pointer",textDecoration:"underline"},onClick:function(){if(mapObj.current)mapObj.current.setView([item.lat,item.lng],14);setSelPin(item);setOpen(false);}},item.name),
                          item.description && e("div",{style:{fontSize:12.5,color:T.ink2,marginTop:4,lineHeight:1.4}},item.description),
                          e("div",{style:{fontSize:11,color:T.ink3,marginTop:6}},
                            "by ",
                            e("span",{style:{cursor:"pointer",textDecoration:"underline"},onClick:function(){loadUserProfile(item.owner);}},"@"+item.owner)
                          )
                        );
                      } else if (item.type === "trail") {
                        return e("div",{key:item.type+"_"+item.id,style:{padding:12,background:T.paper2,border:"1px solid "+T.borderSoft,borderRadius:10,marginBottom:8}},
                          e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}},
                            e("span",{style:{fontSize:11,fontWeight:700,color:T.forest,fontFamily:T.mono}},"🥾 NEW TRAIL"),
                            e("span",{style:{fontSize:10,color:T.ink3}},timeLabel)
                          ),
                          e("div",{style:{fontWeight:700,fontSize:15,color:T.ink,cursor:"pointer",textDecoration:"underline"},onClick:function(){setActiveTrail(item);setOpen(false);}},item.name),
                          e("div",{style:{fontSize:12.5,color:T.ink2,marginTop:4}},Number((item.distance_km || 0) * 0.621371).toFixed(2)+" mi trail"),
                          e("div",{style:{fontSize:11,color:T.ink3,marginTop:6}},
                            "by ",
                            e("span",{style:{cursor:"pointer",textDecoration:"underline"},onClick:function(){loadUserProfile(item.owner);}},"@"+item.owner)
                          )
                        );
                      } else {
                        // comment / journal
                        return e("div",{key:item.type+"_"+item.id,style:{padding:12,background:T.paper2,border:"1px solid "+T.borderSoft,borderRadius:10,marginBottom:8}},
                          e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}},
                            e("span",{style:{fontSize:11,fontWeight:700,color:T.forest,fontFamily:T.mono}},"📝 JOURNAL ENTRY"),
                            e("span",{style:{fontSize:10,color:T.ink3}},timeLabel)
                          ),
                          (function(){
                            var text = item.body || "";
                            var urlRegex = /(https?:\/\/[^\s]+)/g;
                            var parts = text.split(urlRegex);
                            var nodes = [];
                            nodes.push('"');
                            parts.forEach(function(part, idx) {
                              if (part.startsWith("http://") || part.startsWith("https://")) {
                                nodes.push(e("a",{key:idx,href:part,target:"_blank",rel:"noopener noreferrer",style:{color:T.forest,textDecoration:"underline",wordBreak:"break-all",userSelect:"text",WebkitUserSelect:"text"},onClick:function(ev){ev.preventDefault(); ev.stopPropagation(); window.open(part, "_blank");}},part));
                              } else {
                                nodes.push(part);
                              }
                            });
                            nodes.push('"');
                            return e("div",{style:{fontSize:13,color:T.ink,fontStyle:"italic",marginTop:4,whiteSpace:"pre-wrap",userSelect:"text",WebkitUserSelect:"text"}},nodes);
                          })(),
                          e("div",{style:{fontSize:11.5,color:T.ink2,marginTop:6}},"on pin: ",e("span",{style:{fontWeight:600}},item.pins?item.pins.name:"Location")),
                          item.photo_url && e("img",{src:item.photo_url,style:{width:"100%",maxHeight:140,objectFit:"cover",borderRadius:6,marginTop:8,cursor:"pointer"},onClick:function(){window.open(item.photo_url,"_blank");}}),
                          e("div",{style:{fontSize:11,color:T.ink3,marginTop:6}},
                            "by ",
                            e("span",{style:{cursor:"pointer",textDecoration:"underline"},onClick:function(){loadUserProfile(item.owner);}},"@"+item.owner)
                          )
                        );
                      }
                    });
                  })()
                )
              )
            : e("div",null,
                activeFilter&&e("div",{style:{display:"flex",alignItems:"center",gap:8,padding:"12px 0",borderBottom:"1px solid "+T.borderSoft}},
                  e("span",{style:{fontSize:13,color:T.ink2}},"Filtered by"),
                  e("span",{style:{fontSize:13,fontWeight:600,color:T.forest,fontFamily:T.mono}},"#"+activeFilter),
                  e("button",{style:{marginLeft:"auto",fontSize:11,padding:"3px 10px",borderRadius:10,border:"1px solid "+T.border,background:"transparent",color:T.ink3,cursor:"pointer"},onClick:function(){setActiveFilter(null);setSearchResults(null);setSearchTag("");}
                  },"Clear")
                ),
                searchResults
                  ? e("div",null,
                      e("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",borderBottom:"1px solid "+T.borderSoft}},
                        e("div",{style:{fontSize:10.5,letterSpacing:"0.14em",color:T.ink3,textTransform:"uppercase",fontWeight:600,fontFamily:T.mono}},"#"+searchResults.tag+" · "+searchResults.results.length+" pins"),
                        e("button",{style:{fontSize:12,padding:"5px 14px",borderRadius:18,border:"1px solid "+(follows.some(function(f){return f.tag===searchResults.tag;})?T.forest:T.border),background:follows.some(function(f){return f.tag===searchResults.tag;})?T.forestPale:"transparent",color:follows.some(function(f){return f.tag===searchResults.tag;})?T.forest:T.ink3,cursor:"pointer",fontWeight:500},onClick:function(){toggleFollow(searchResults.tag);}
                        },follows.some(function(f){return f.tag===searchResults.tag;})?"Following":"Follow")
                      ),
                      (function() {
                        var tag = searchResults.tag.toLowerCase();
                        var related = challenges.filter(function(ch) {
                          var chTags = (ch.tags || []).map(function(t) { return t.toLowerCase(); });
                          return chTags.indexOf(tag) >= 0;
                        });
                        if (related.length === 0) return null;
                        return e("div", {style: {padding: "12px 0", borderBottom: "1px solid " + T.borderSoft}},
                          e("div", {style: {fontSize: 11, color: T.forest, fontWeight: 700, fontFamily: T.mono, textTransform: "uppercase", marginBottom: 8}}, "🏆 Related Quests"),
                          related.map(function(ch) {
                            var chTags = ch.tags || [];
                            var checkedPinIds = checkins.map(function(c) { return c.pin_id; });
                            var matchingPins = pins.filter(function(p) {
                              if (checkedPinIds.indexOf(p.id) < 0) return false;
                              if (!p.tags) return false;
                              return p.tags.some(function(t) { return chTags.indexOf(t) >= 0; });
                            });
                            var count = Math.min(matchingPins.length, ch.required_count || 3);
                            var isDone = count >= (ch.required_count || 3);
                            
                            // Check if this quest is tracked
                            var isTracked = ch.owner === "system" || ch.owner === uname;
                            if (!isTracked) {
                              try {
                                var saved = localStorage.getItem("pinmap_tracked_quests");
                                var savedList = saved ? JSON.parse(saved) : [];
                                isTracked = savedList.indexOf(ch.id) >= 0;
                              } catch (err) {}
                            }

                            return e("div", {
                              key: ch.id,
                              style: {
                                background: "rgba(42, 93, 60, 0.03)",
                                border: "1px solid " + (isDone ? "#d4af37" : T.borderSoft),
                                borderRadius: 10,
                                padding: "10px 12px",
                                marginBottom: 6,
                                display: "flex",
                                alignItems: "center",
                                gap: 10
                              }
                            },
                              e("div", {style: {fontSize: 20}}, ch.icon || "🏆"),
                              e("div", {style: {flex: 1, minWidth: 0}},
                                e("div", {style: {fontWeight: 600, fontSize: 13, color: T.ink, display: "flex", alignItems: "center", gap: 6}},
                                  ch.title,
                                  isDone && e("span", {style: {fontSize: 8, background: "#d4af37", color: "#fff", padding: "1px 4px", borderRadius: 4}}, "Completed")
                                ),
                                e("div", {style: {fontSize: 11, color: T.ink2, marginTop: 2, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap"}}, ch.description)
                              ),
                              e("button", {
                                style: {
                                  background: isTracked ? "transparent" : T.forest,
                                  color: isTracked ? T.ink3 : T.paper,
                                  border: isTracked ? "1px solid " + T.borderSoft : "none",
                                  padding: "4px 8px",
                                  borderRadius: 6,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: "pointer"
                                },
                                onClick: function() {
                                  // Trigger tracking toggle in localStorage
                                  var list = [];
                                  try {
                                    var saved = localStorage.getItem("pinmap_tracked_quests");
                                    list = saved ? JSON.parse(saved) : [];
                                  } catch(e){}
                                  
                                  if (list.indexOf(ch.id) >= 0) {
                                    list = list.filter(function(x) { return x !== ch.id; });
                                    flash("Stopped tracking quest.");
                                  } else {
                                    list = list.concat([ch.id]);
                                    flash("Started tracking quest! View in Profile tab.");
                                  }
                                  localStorage.setItem("pinmap_tracked_quests", JSON.stringify(list));
                                  // Refresh the component state
                                  setChallenges(function(prev) { return prev.slice(); });
                                }
                              }, isTracked ? "Tracked" : "Track")
                            );
                          })
                        );
                      })(),
                      (function() {
                        var list = searchResults.results.slice();
                        if (userLL && userLL.lat && userLL.lng) {
                          list.sort(function(a, b) {
                            var distA = distKm(userLL.lat, userLL.lng, a.lat, a.lng);
                            var distB = distKm(userLL.lat, userLL.lng, b.lat, b.lng);
                            return distA - distB;
                          });
                        }
                        return list.map(function(p){
                          var dist=userLL?distKm(userLL.lat,userLL.lng,p.lat,p.lng):null;
                          var distMi=dist!==null?dist*0.621371:null;
                          var distLabel=distMi===null?"":distMi<1.0?"nearby":distMi.toFixed(1)+" mi";
                          
                          return e("div",{key:p.id,style:{display:"flex",alignItems:"flex-start",gap:12,padding:"14px 0",borderBottom:"1px solid "+T.borderSoft,cursor:"pointer"},onClick:function(){focusPin(p);}},
                            e("svg",{width:14,height:18,viewBox:"0 0 28 36",style:{flexShrink:0,marginTop:2}},e("path",{d:"M14 0 C 6.27 0 0 6.27 0 14 c 0 9.5 14 22 14 22 s 14 -12.5 14 -22 C 28 6.27 21.73 0 14 0 z",fill:p.color||T.forest}),e("circle",{cx:"14",cy:"14",r:"5",fill:T.paper})),
                            e("div",{style:{flex:1,minWidth:0}},
                              e("div",{style:{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}},
                                e("div",{style:{fontSize:16,fontWeight:600,color:T.ink,marginBottom:2}},p.name),
                                dist!==null&&e("div",{style:{fontSize:11,color:T.ink3,fontFamily:T.mono,flexShrink:0,marginTop:4}},distLabel)
                              ),
                              p.description&&e("div",{style:{fontSize:13,color:T.ink2,marginBottom:6,lineHeight:1.4}},p.description),
                              e("div",{style:{display:"flex",gap:6,flexWrap:"wrap",marginBottom:4}},(p.tags||[]).slice(0,3).map(function(t){return e("span",{key:t,style:{fontSize:10.5,color:T.forest,background:T.forestPale,padding:"1px 6px",borderRadius:3,fontFamily:T.mono}},"#"+t);})),
                              p.owner&&e("span",{style:{fontSize:11,color:T.ink3,cursor:"pointer",textDecoration:"underline"},onClick:function(ev){ev.stopPropagation();loadUserProfile(p.owner);}
                              },"@"+p.owner)
                            )
                          );
                        });
                      })()
                    )
                  : e("div",null,
                      trending.length>0&&e("div",{style:{paddingTop:16,marginBottom:20}},
                        e("div",{style:{fontSize:10.5,letterSpacing:"0.18em",color:T.ink3,textTransform:"uppercase",fontWeight:600,fontFamily:T.mono,marginBottom:14}},"Trending · Last 7 Days"),
                        trending.slice(0,6).map(function(t,i){
                          var isFollowing=follows.some(function(f){return f.tag===t.tag;});
                          return e("div",{key:t.tag,style:{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid "+T.borderSoft,cursor:"pointer"},onClick:function(){setSearchTag(t.tag);doSearch();}},
                            e("div",{style:{fontSize:11,color:T.ink4,fontFamily:T.mono,width:18,flexShrink:0}},String(i+1).padStart(2,"0")),
                            e("div",{style:{flex:1,fontWeight:700,fontSize:17,color:T.ink}},"#"+t.tag),
                            e("div",{style:{fontSize:13,color:T.ink3,fontFamily:T.mono}},t.count||""),
                            e("button",{style:{padding:"4px 10px",borderRadius:14,border:"1px solid "+(isFollowing?T.forest:T.border),background:isFollowing?T.forestPale:"transparent",color:isFollowing?T.forest:T.ink3,fontSize:11,cursor:"pointer",flexShrink:0},onClick:function(ev){ev.stopPropagation();toggleFollow(t.tag);}
                            },isFollowing?"Following":"Follow")
                          );
                        })
                      ),
                      e("div",{style:{marginBottom:20}},
                        e("div",{style:{fontSize:10.5,letterSpacing:"0.18em",color:T.ink3,textTransform:"uppercase",fontWeight:600,fontFamily:T.mono,marginBottom:12}},"Nearby"),
                        (function(){
                          var pub=pins.filter(function(p){return p.privacy==="public";});
                          var sorted=userLL?pub.slice().sort(function(a,b){return distKm(userLL.lat,userLL.lng,a.lat,a.lng)-distKm(userLL.lat,userLL.lng,b.lat,b.lng);}):pub;
                          return sorted.slice(0,5).map(function(p){
                            var dist=userLL?distKm(userLL.lat,userLL.lng,p.lat,p.lng):null;
                            var distMi=dist!==null?dist*0.621371:null;
                            var isFar=distMi!==null&&distMi>10;
                            var distLabel=distMi===null?"":distMi<1.0?"nearby":distMi.toFixed(1)+" mi";
                            return e("div",{key:p.id,style:{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid "+T.borderSoft,cursor:"pointer"},onClick:function(){focusPin(p);}},
                              e("svg",{width:14,height:18,viewBox:"0 0 28 36",style:{flexShrink:0}},e("path",{d:"M14 0 C 6.27 0 0 6.27 0 14 c 0 9.5 14 22 14 22 s 14 -12.5 14 -22 C 28 6.27 21.73 0 14 0 z",fill:p.color||T.forest}),e("circle",{cx:"14",cy:"14",r:"5",fill:T.paper})),
                              e("div",{style:{flex:1,minWidth:0}},
                                e("div",{style:{fontWeight:600,fontSize:15,color:T.ink,marginBottom:1}},p.name),
                                e("div",{style:{fontSize:12,color:T.ink3}},e("span",{style:{cursor:"pointer"},onClick:function(ev){ev.stopPropagation();loadUserProfile(p.owner);}},"@"+p.owner),(p.tags&&p.tags[0]?" · #"+p.tags[0]:""))
                              ),
                              dist!==null&&e("div",{style:{fontSize:11,color:isFar?"#b85c2a":T.ink3,fontFamily:T.mono,flexShrink:0}},distLabel)
                            );
                          });
                        })()
                      )
                    )
              )
        )
      );

}
