// PINMAP — no JSX, no build step, runs natively in any browser
const e = React.createElement;
const { useState, useEffect, useRef } = React;

const SB_URL = "https://uuxggoydnjvsssbenkkt.supabase.co/rest/v1";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1eGdnb3lkbmp2c3NzYmVua2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwODg4OTgsImV4cCI6MjA5MjY2NDg5OH0.VniG6qm6Z9spdezyw-85k4liEuyC9i3B_T2Pxo-9nK0";
const HDR = { "Content-Type":"application/json", apikey:SB_KEY, Authorization:`Bearer ${SB_KEY}`, Prefer:"return=representation" };

const api = {
  list:        ()      => fetch(`${SB_URL}/pins?select=*&order=created_at.desc`,{headers:HDR}).then(r=>r.json()),
  insert:      pin     => fetch(`${SB_URL}/pins`,{method:"POST",headers:HDR,body:JSON.stringify(pin)}).then(r=>r.json()),
  update:      (id,p)  => fetch(`${SB_URL}/pins?id=eq.${id}`,{method:"PATCH",headers:HDR,body:JSON.stringify(p)}).then(r=>r.json()),
  remove:      id      => fetch(`${SB_URL}/pins?id=eq.${id}`,{method:"DELETE",headers:HDR}),
  search:      tag     => fetch(`${SB_URL}/pins?tags=cs.%7B${encodeURIComponent(tag)}%7D&privacy=eq.public&select=*`,{headers:HDR}).then(r=>r.json()),
};

const COLORS = ["#2e7d32","#e65100","#1565c0","#ad1457","#6a1599","#00695c","#c62828","#4e342e"];
const uid = () => Math.random().toString(36).slice(2,10);
const tagColor = tag => { let h=0; for(let c of tag) h=(h*31+c.charCodeAt(0))>>>0; return COLORS[h%COLORS.length]; };
const distKm = (a,b,c,d) => { const R=6371,dL=(c-a)*Math.PI/180,dl=(d-b)*Math.PI/180,x=Math.sin(dL/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dl/2)**2; return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)); };
const download = (content,name,type) => { const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=name; a.click(); };
const toGeoJSON = pins => JSON.stringify({type:"FeatureCollection",features:pins.map(p=>({type:"Feature",geometry:{type:"Point",coordinates:[p.lng,p.lat]},properties:{name:p.name,description:p.description,tags:p.tags,owner:p.owner}}))},null,2);
const toGPX = pins => `<?xml version="1.0"?><gpx version="1.1" creator="PINMAP">${pins.map(p=>`<wpt lat="${p.lat}" lon="${p.lng}"><n>${p.name}</n><desc>${p.description||""} ${(p.tags||[]).map(t=>"#"+t).join(" ")}</desc></wpt>`).join("")}</gpx>`;

// Inject Leaflet CSS
(function(){
  const l=document.createElement("link");
  l.rel="stylesheet";
  l.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
  document.head.appendChild(l);
  const s=document.createElement("script");
  s.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
  document.head.appendChild(s);
})();

// Inject global styles
const styleEl = document.createElement("style");
styleEl.textContent = `
  *{box-sizing:border-box;margin:0;padding:0}
  html,body,#root{height:100%;width:100%;overflow:hidden;background:#f0e8d0}
  :root{
    --sat: env(safe-area-inset-top, 0px);
    --sar: env(safe-area-inset-right, 0px);
    --sab: env(safe-area-inset-bottom, 0px);
    --sal: env(safe-area-inset-left, 0px);
  }
  .leaflet-container{height:100%!important;width:100%!important}
  .pm-pin{background:none!important;border:none!important}
  .safe-bottom{padding-bottom:env(safe-area-inset-bottom, 16px)}
  .safe-pad{padding-left:env(safe-area-inset-left,0);padding-right:env(safe-area-inset-right,0)}
  @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  @keyframes pop{0%{opacity:0;transform:scale(0.85)}70%{opacity:1;transform:scale(1.03)}100%{transform:scale(1)}}
  @keyframes fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
  .bubble{animation:pop .22s cubic-bezier(.34,1.3,.64,1) both}
  .detail{animation:fade .15s ease both}
  input,textarea,button{font-family:'Courier New',monospace}
`;
document.head.appendChild(styleEl);

// Shared styles object
const S = {
  input:{width:"100%",background:"#f0e8d4",border:"1px solid #d0c4a8",color:"#2c2416",padding:"7px 9px",fontSize:11,borderRadius:4,marginBottom:6,boxSizing:"border-box",outline:"none",display:"block"},
  btn:{background:"#2e7d32",color:"#fff",border:"none",padding:"7px 12px",fontWeight:700,fontSize:11,cursor:"pointer",borderRadius:4,whiteSpace:"nowrap"},
  miniBtn:{background:"none",border:"1px solid #d0c4a8",color:"#6a5a40",padding:"2px 7px",fontSize:10,cursor:"pointer",borderRadius:10},
  chip:{background:"none",border:"1px solid #c8b89a",color:"#2e7d32",padding:"3px 8px",fontSize:10,cursor:"pointer",borderRadius:12},
  secHead:{fontSize:9,letterSpacing:1,color:"#9a8a70",textTransform:"uppercase",marginBottom:7,borderBottom:"1px solid #e8dcc4",paddingBottom:4},
  hint:{fontSize:11,color:"#9a8a70",lineHeight:1.65},
  card:{background:"#f0e8d4",border:"1px solid #d0c4a8",borderRadius:5,padding:"7px 9px",marginBottom:6,cursor:"pointer",position:"relative"},
};

// ── PinCard component ─────────────────────────────────────────────────────────
function PinCard({pin, user, onFocus, onDelete, onUpvote, onSave, dist}) {
  return e("div", {style:S.card, onClick:onFocus},
    pin.photo && e("img",{src:pin.photo,style:{width:"100%",borderRadius:4,marginBottom:5,maxHeight:80,objectFit:"cover"}}),
    e("div",{style:{fontWeight:700,fontSize:11,color:"#2c2416",marginBottom:1}}, pin.name),
    e("div",{style:{fontSize:9,color:"#9a8a70",marginBottom:2}},
      `@${pin.owner}${pin.saved_from?" · saved from @"+pin.saved_from:""} · ${pin.privacy}`,
      dist !== undefined && e("span",{style:{color:"#2e7d32",marginLeft:4}}, `${dist.toFixed(1)}km`)
    ),
    e("div",{style:{fontSize:10,marginBottom:4}},
      (pin.tags||[]).map(t => e("span",{key:t,style:{color:tagColor(t),marginRight:3}}, `#${t}`))
    ),
    e("div",{style:{display:"flex",gap:4},onClick:ev=>ev.stopPropagation()},
      pin.owner !== user && e(React.Fragment, null,
        e("button",{style:S.miniBtn,onClick:()=>onUpvote(pin.id)}, `${pin.upvotes?.includes(user)?"★":"☆"} ${pin.upvotes?.length||0}`),
        e("button",{style:S.miniBtn,onClick:()=>onSave(pin)}, "⭐ Save")
      ),
      pin.owner === user && !pin.saved_from && e("button",{style:{...S.miniBtn,color:"#c05050"},onClick:()=>onDelete(pin.id)}, "🗑")
    )
  );
}

// ── Profile component ─────────────────────────────────────────────────────────
function Profile({user, myPins, onSave, onGeoJSON, onGPX}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(user);
  const own = myPins.filter(p=>!p.saved_from);
  const saved = myPins.filter(p=>p.saved_from);
  const upvotes = own.reduce((a,p)=>a+(p.upvotes?.length||0),0);
  const stats = [["📍",own.length,"pins"],["🌍",own.filter(p=>p.privacy==="public").length,"public"],["⭐",saved.length,"saved"],["★",upvotes,"upvotes"]];

  return e("div",null,
    e("div",{style:{textAlign:"center",marginBottom:14}},
      e("div",{style:{fontSize:36,marginBottom:4}}, "🧭"),
      editing
        ? e("div",{style:{display:"flex",gap:5}},
            e("input",{style:S.input,value:draft,onChange:ev=>setDraft(ev.target.value),
              onKeyDown:ev=>{ if(ev.key==="Enter"){onSave(draft.trim());setEditing(false);} }}),
            e("button",{style:S.btn,onClick:()=>{onSave(draft.trim());setEditing(false);}}, "✓")
          )
        : e("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:6}},
            e("span",{style:{fontWeight:700,fontSize:16,color:"#2c2416"}}, `@${user}`),
            e("button",{style:{background:"none",border:"none",cursor:"pointer",fontSize:13},onClick:()=>{setDraft(user);setEditing(true);}}, "✏️")
          )
    ),
    e("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}},
      stats.map(([icon,val,lbl]) => e("div",{key:lbl,style:{background:"#f0e8d4",border:"1px solid #d0c4a8",borderRadius:8,padding:"10px 8px",textAlign:"center"}},
        e("div",{style:{fontSize:18}},icon),
        e("div",{style:{fontWeight:700,fontSize:18,color:"#2e7d32"}},val),
        e("div",{style:{fontSize:9,color:"#9a8a70",textTransform:"uppercase",letterSpacing:0.5}},lbl)
      ))
    ),
    e("div",{style:S.secHead},"Export your data"),
    e("div",{style:{display:"flex",gap:6}},
      e("button",{style:{...S.btn,flex:1,fontSize:10},onClick:onGeoJSON},"GeoJSON"),
      e("button",{style:{...S.btn,flex:1,fontSize:10},onClick:onGPX},"GPX")
    )
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
function App() {
  const mapDiv  = useRef(null);
  const mapObj  = useRef(null);
  const markers = useRef({});

  const [user,    setUser]    = useState(()=>localStorage.getItem("pm-user")||"");
  const [udraft,  setUdraft]  = useState("");
  const [pins,    setPins]    = useState([]);
  const [loading, setLoading] = useState(false);

  const [open,    setOpen]    = useState(false);
  const [tab,     setTab]     = useState("search");
  const [fabPos,  setFabPos]  = useState({bottom:'calc(32px + env(safe-area-inset-bottom, 0px))',right:'calc(20px + env(safe-area-inset-right, 0px))'});

  const [searchTag,     setSearchTag]     = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [activeFilter,  setActiveFilter]  = useState(null);

  const [form,      setForm]      = useState({name:"",description:"",tags:"",privacy:"public",photo:null});
  const [pendingLL, setPendingLL] = useState(null);
  const [selPin,    setSelPin]    = useState(null);
  const [toast,     setToast]     = useState("");
  const [userLL,    setUserLL]    = useState(null);
  const [locating,  setLocating]  = useState(false);
  const [nearbyKm,  setNearbyKm]  = useState(10);
  const [nearbyRes, setNearbyRes] = useState(null);

  const flash = msg => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  // Init map — wait for Leaflet to load
  useEffect(()=>{
    if(mapObj.current) return;
    const tryInit = () => {
      if(!window.L || !mapDiv.current) { setTimeout(tryInit, 100); return; }
      const map = window.L.map(mapDiv.current,{zoomControl:false,scrollWheelZoom:true}).setView([39,-98],4);
      window.L.control.zoom({position:"bottomleft"}).addTo(map);
      window.L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",{
        attribution:"© OpenStreetMap contributors, © CARTO", maxZoom:19
      }).addTo(map);
      map.on("click", ev => { setPendingLL(ev.latlng); setTab("add"); setOpen(true); flash("📍 Location set"); });
      mapObj.current = map;
    };
    tryInit();
  },[]);

  // Load pins
  useEffect(()=>{
    if(!user) return;
    setLoading(true);
    api.list().then(data=>{ if(Array.isArray(data)) setPins(data); }).catch(()=>flash("⚠️ Couldn't load pins")).finally(()=>setLoading(false));
  },[user]);

  // Sync markers
  useEffect(()=>{
    if(!mapObj.current || !window.L) return;
    Object.values(markers.current).forEach(m=>m.remove());
    markers.current = {};
    const visible = activeFilter ? pins.filter(p=>p.tags&&p.tags.includes(activeFilter)) : pins;
    visible.forEach(pin=>{
      const color = tagColor(pin.tags?.[0]||"x");
      const icon = window.L.divIcon({
        className:"pm-pin",
        html:`<svg width="30" height="38" viewBox="0 0 26 34"><path d="M13 0C5.82 0 0 5.82 0 13c0 9.75 13 21 13 21S26 22.75 26 13C26 5.82 20.18 0 13 0z" fill="${color}" stroke="white" stroke-width="1.5"/><circle cx="13" cy="13" r="4" fill="white"/></svg>`,
        iconSize:[30,38], iconAnchor:[15,38]
      });
      const m = window.L.marker([pin.lat,pin.lng],{icon}).addTo(mapObj.current);
      m.on("click",()=>{ setSelPin(pin); setOpen(false); });
      markers.current[pin.id] = m;
    });
  },[pins,activeFilter]);

  async function savePin(){
    if(!pendingLL) return flash("⚠️ Click the map first");
    if(!form.name.trim()) return flash("⚠️ Name required");
    if(!form.tags.trim()) return flash("⚠️ At least one tag required");
    const tags = form.tags.split(/[\s,]+/).map(t=>t.replace(/^#/,"").toLowerCase()).filter(Boolean);
    const pin = {id:uid(),owner:user,name:form.name.trim(),description:form.description.trim(),tags,privacy:form.privacy,lat:pendingLL.lat,lng:pendingLL.lng,photo:form.photo||null,upvotes:[],saved_by:[],saved_from:null};
    try { await api.insert(pin); setPins(p=>[pin,...p]); setForm({name:"",description:"",tags:"",privacy:"public",photo:null}); setPendingLL(null); setTab("mine"); flash("✅ Pin saved!"); }
    catch(err){ flash("⚠️ Save failed"); }
  }

  async function deletePin(id){
    try { await api.remove(id); setPins(p=>p.filter(x=>x.id!==id)); if(selPin?.id===id) setSelPin(null); flash("🗑 Removed"); }
    catch(err){ flash("⚠️ Delete failed"); }
  }

  async function toggleUpvote(pinId){
    const pin=pins.find(p=>p.id===pinId); if(!pin) return;
    const has=pin.upvotes?.includes(user);
    const upvotes=has?pin.upvotes.filter(u=>u!==user):[...(pin.upvotes||[]),user];
    try { await api.update(pinId,{upvotes}); setPins(prev=>prev.map(p=>p.id===pinId?{...p,upvotes}:p)); setSelPin(sp=>sp?.id===pinId?{...sp,upvotes}:sp); }
    catch(err){ flash("⚠️ Failed"); }
  }

  async function saveToCollection(pin){
    if(pin.owner===user) return flash("Already your pin");
    const id=pin.id+"_saved_"+user;
    if(pins.find(p=>p.id===id)) return flash("Already saved");
    const saved={...pin,id,owner:user,saved_from:pin.owner,privacy:"private",upvotes:[],saved_by:[]};
    try { await api.insert(saved); setPins(p=>[saved,...p]); flash("⭐ Saved!"); }
    catch(err){ flash("⚠️ Failed"); }
  }

  async function doSearch(){
    if(!searchTag.trim()) return;
    const tag=searchTag.replace(/^#/,"").toLowerCase().trim();
    try {
      const data=await api.search(tag);
      const results=Array.isArray(data)?data:[];
      setSearchResults({tag,results});
      setActiveFilter(tag);
      setPins(prev=>{ const ids=new Set(prev.map(p=>p.id)); return [...prev,...results.filter(r=>!ids.has(r.id))]; });
      if(!results.length) flash(`No public pins for #${tag}`);
    } catch(err){ flash("⚠️ Search failed"); }
  }

  function findNearby(){
    if(!userLL) return flash("⚠️ Use GPS button first");
    const results=pins.filter(p=>p.privacy==="public"||p.owner===user).map(p=>({...p,dist:distKm(userLL.lat,userLL.lng,p.lat,p.lng)})).filter(p=>p.dist<=nearbyKm).sort((a,b)=>a.dist-b.dist);
    setNearbyRes(results);
    if(!results.length) flash(`No pins within ${nearbyKm}km`);
  }

  function gpsLocate(){
    if(!navigator.geolocation) return flash("⚠️ Not supported");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(pos=>{
      const {latitude:lat,longitude:lng}=pos.coords;
      setUserLL({lat,lng});
      mapObj.current?.setView([lat,lng],14);
      if(window._gpsM) window._gpsM.remove();
      window._gpsM=window.L.circleMarker([lat,lng],{radius:10,fillColor:"#1565c0",color:"#fff",weight:3,fillOpacity:0.85}).addTo(mapObj.current).bindPopup("You are here").openPopup();
      setLocating(false); flash("📡 Found!");
    },()=>{ setLocating(false); flash("⚠️ Location unavailable"); },{enableHighAccuracy:true,timeout:8000});
  }

  function handlePhoto(ev){
    const file=ev.target.files[0]; if(!file) return;
    if(file.size>2*1024*1024) return flash("⚠️ Max 2MB");
    const reader=new FileReader();
    reader.onload=e=>setForm(f=>({...f,photo:e.target.result}));
    reader.readAsDataURL(file);
  }

  function onFabDown(ev){
    ev.preventDefault();
    const sx=ev.clientX,sy=ev.clientY,rect=ev.currentTarget.getBoundingClientRect();
    let moved=false;
    const onMove=e=>{ const dx=e.clientX-sx,dy=e.clientY-sy; if(Math.abs(dx)>5||Math.abs(dy)>5) moved=true; if(!moved) return; setFabPos({right:Math.max(8,Math.min(window.innerWidth-64,window.innerWidth-(rect.right+dx))),bottom:Math.max(8,Math.min(window.innerHeight-64,window.innerHeight-(rect.bottom+dy)))}); };
    const onUp=()=>{ window.removeEventListener("pointermove",onMove); window.removeEventListener("pointerup",onUp); if(!moved) setOpen(o=>!o); };
    window.addEventListener("pointermove",onMove); window.addEventListener("pointerup",onUp);
  }

  function bubblePos(){
    const vw=window.innerWidth,vh=window.innerHeight,bw=300,bh=Math.min(vh*0.72,540);
    const sab=parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab'))||0;
    const sar=parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sar'))||0;
    let right=(typeof fabPos.right==='number'?fabPos.right:20)+sar,bottom=(typeof fabPos.bottom==='number'?fabPos.bottom:32)+58+sab;
    if(bottom+bh>vh-12) bottom=Math.max(12,vh-bh-12);
    if(vw-right-bw<8) right=Math.max(8,vw-bw-8);
    return {position:"absolute",right,bottom,width:bw,maxHeight:bh,display:"flex",flexDirection:"column",background:"rgba(255,253,248,0.98)",backdropFilter:"blur(20px)",border:"1px solid #d0c4a8",borderRadius:16,boxShadow:"0 20px 60px rgba(0,0,0,0.18)",zIndex:1000,overflow:"hidden",transformOrigin:"bottom right"};
  }

  const myPins = pins.filter(p=>p.owner===user);
  const myTags = [...new Set(myPins.flatMap(p=>p.tags||[]))];
  const TABS   = [["search","🔍"],["mine","🗂"],["add","➕"],["nearby","📡"],["profile","👤"]];

  // Gate
  if(!user) return e("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#f0e8d0"}},
    e("div",{style:{textAlign:"center",padding:36,border:"1px solid #c8b89a",borderRadius:10,background:"#faf6ed",maxWidth:320,width:"90%",boxShadow:"0 4px 24px rgba(0,0,0,0.08)"}},
      e("div",{style:{fontSize:24,fontWeight:900,letterSpacing:4,color:"#2e7d32",marginBottom:8}}, "📍 PINMAP"),
      e("p",{style:{color:"#9a8a70",fontSize:12,marginBottom:22,letterSpacing:1}}, "Tag the terrain. Share the stoke."),
      e("input",{style:{...S.input,textAlign:"center",fontSize:13},placeholder:"choose a username",value:udraft,onChange:ev=>setUdraft(ev.target.value),
        onKeyDown:ev=>{ if(ev.key==="Enter"&&udraft.trim()){localStorage.setItem("pm-user",udraft.trim());setUser(udraft.trim());} }}),
      e("button",{style:{...S.btn,width:"100%",padding:"10px 24px",fontSize:12,letterSpacing:2},
        onClick:()=>{ if(udraft.trim()){localStorage.setItem("pm-user",udraft.trim());setUser(udraft.trim());} }},
        "ENTER THE MAP →")
    )
  );

  return e("div",{style:{position:"relative",height:"100vh",width:"100%",overflow:"hidden"}},

    // Map
    e("div",{ref:mapDiv,style:{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:0}}),

    // Search bar
    !activeFilter && e("div",{style:{position:"absolute",top:"calc(16px + env(safe-area-inset-top, 0px))",left:"50%",transform:"translateX(-50%)",zIndex:999,width:"88%",maxWidth:380}},
      e("input",{style:{width:"100%",padding:"11px 20px",borderRadius:25,border:"none",boxShadow:"0 4px 14px rgba(0,0,0,0.13)",fontSize:14,outline:"none",background:"rgba(255,255,255,0.97)",color:"#2c2416"},
        placeholder:"Search #hashtags...",value:searchTag,onChange:ev=>setSearchTag(ev.target.value),
        onKeyDown:ev=>{ if(ev.key==="Enter"&&searchTag.trim()){doSearch();setOpen(true);setTab("search");} }})
    ),

    // Active filter pill
    activeFilter && e("div",{style:{position:"absolute",top:"calc(14px + env(safe-area-inset-top, 0px))",left:"50%",transform:"translateX(-50%)",background:"rgba(255,255,255,0.97)",borderRadius:25,padding:"6px 14px",fontSize:12,zIndex:999,display:"flex",alignItems:"center",gap:7,boxShadow:"0 4px 14px rgba(0,0,0,0.13)"}},
      e("span",{style:{color:tagColor(activeFilter),fontWeight:700}}, `#${activeFilter}`),
      e("button",{style:{background:"none",border:"none",color:"#9a8a70",cursor:"pointer",fontSize:12,padding:0},onClick:()=>{setActiveFilter(null);setSearchResults(null);setSearchTag("");}}, "✕")
    ),

    // GPS button
    e("button",{onClick:gpsLocate,title:"My location",style:{position:"absolute",top:"calc(70px + env(safe-area-inset-top, 0px))",right:"calc(14px + env(safe-area-inset-right, 0px))",width:42,height:42,borderRadius:"50%",background:"rgba(255,253,248,0.96)",backdropFilter:"blur(12px)",border:`1.5px solid ${locating?"#1565c0":"#c8b89a"}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:999,boxShadow:"0 4px 14px rgba(0,0,0,0.13)"}},
      locating
        ? e("span",{style:{fontSize:16,display:"inline-block",animation:"spin 1s linear infinite"}}, "⟳")
        : e("svg",{width:18,height:18,viewBox:"0 0 24 24",fill:"none",stroke:"#1565c0",strokeWidth:2.2,strokeLinecap:"round",strokeLinejoin:"round"},
            e("circle",{cx:12,cy:12,r:3}),
            e("path",{d:"M12 2v3M12 19v3M2 12h3M19 12h3"})
          )
    ),

    // Loading
    loading && e("div",{style:{position:"absolute",top:70,left:"50%",transform:"translateX(-50%)",background:"rgba(255,253,248,0.97)",border:"1px solid #d0c4a8",borderRadius:20,padding:"5px 14px",fontSize:11,zIndex:999,color:"#9a8a70"}}, "⟳ Loading..."),

    // Bubble
    open && e("div",{className:"bubble",style:bubblePos()},
      // Header
      e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 13px",borderBottom:"1px solid #e8dcc4",background:"rgba(245,238,218,0.9)",flexShrink:0}},
        e("span",{style:{fontSize:12,fontWeight:700,letterSpacing:2,color:"#2e7d32"}}, "📍 PINMAP"),
        e("div",{style:{display:"flex",alignItems:"center",gap:7}},
          e("span",{style:{fontSize:10,color:"#7a6a50",background:"#ece4cc",padding:"2px 7px",borderRadius:3,border:"1px solid #d0c4a8"}}, `@${user}`),
          e("button",{style:{background:"none",border:"none",color:"#9a8a70",cursor:"pointer",fontSize:14},onClick:()=>setOpen(false)}, "✕")
        )
      ),
      // Tabs
      e("div",{style:{display:"flex",borderBottom:"1px solid #e8dcc4",flexShrink:0,background:"rgba(250,246,236,0.8)"}},
        TABS.map(([t,lbl]) => e("button",{key:t,onClick:()=>setTab(t),style:{flex:1,padding:"8px 2px",background:"none",border:"none",cursor:"pointer",fontSize:16,color:tab===t?"#2e7d32":"#9a8a70",borderBottom:tab===t?"2px solid #2e7d32":"2px solid transparent"}}, lbl))
      ),
      // Body
      e("div",{style:{padding:11,flex:1,overflowY:"auto"}},

        // SEARCH
        tab==="search" && e("div",null,
          e("div",{style:{display:"flex",gap:5,marginBottom:7}},
            e("input",{style:S.input,placeholder:"#hashtag",value:searchTag,onChange:ev=>setSearchTag(ev.target.value),onKeyDown:ev=>ev.key==="Enter"&&doSearch()}),
            e("button",{style:S.btn,onClick:doSearch},"GO")
          ),
          activeFilter && e("button",{style:{...S.chip,marginBottom:7},onClick:()=>{setActiveFilter(null);setSearchResults(null);setSearchTag("");}}, `✕ #${activeFilter}`),
          searchResults
            ? e("div",null,
                e("div",{style:S.secHead}, `#${searchResults.tag} · ${searchResults.results.length} pins`),
                searchResults.results.map(p=>e(PinCard,{key:p.id,pin:p,user,onFocus:()=>{mapObj.current?.setView([p.lat,p.lng],13);setSelPin(p);setOpen(false);},onDelete:deletePin,onUpvote:toggleUpvote,onSave:saveToCollection}))
              )
            : e("div",{style:S.hint}, "Search public pins by hashtag.",
                e("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6}},
                  ["hiking","urbex","bikepacking","bouldering","overlanding","kayaking"].map(t=>e("span",{key:t,style:{fontSize:10,padding:"2px 8px",borderRadius:10,background:"#e8f5e9",color:"#2e7d32",border:"1px solid #a5d6a7",cursor:"pointer"},onClick:()=>setSearchTag(t)},`#${t}`))
                )
              )
        ),

        // MINE
        tab==="mine" && e("div",null,
          myTags.length===0 && e("div",{style:S.hint},"No pins yet — close this, click the map, then ➕."),
          myTags.map(tag=>{
            const tp=myPins.filter(p=>p.tags?.includes(tag));
            return e("div",{key:tag,style:{marginBottom:12}},
              e("div",{style:{display:"flex",alignItems:"center",gap:4,marginBottom:4}},
                e("span",{style:{color:tagColor(tag),fontWeight:700,fontSize:12}},`#${tag}`),
                e("span",{style:{fontSize:9,background:"#ddd5bb",padding:"1px 5px",borderRadius:8,color:"#2e7d32"}},tp.length),
                e("button",{style:{...S.miniBtn,marginLeft:"auto"},onClick:()=>setActiveFilter(activeFilter===tag?null:tag)},activeFilter===tag?"🗺✓":"🗺"),
                e("button",{style:S.miniBtn,onClick:()=>download(toGeoJSON(tp),"pins.geojson","application/json")},"GeoJSON"),
                e("button",{style:S.miniBtn,onClick:()=>download(toGPX(tp),"pins.gpx","application/gpx+xml")},"GPX")
              ),
              tp.map(p=>e(PinCard,{key:p.id,pin:p,user,onFocus:()=>{mapObj.current?.setView([p.lat,p.lng],13);setSelPin(p);setOpen(false);},onDelete:deletePin,onUpvote:toggleUpvote,onSave:saveToCollection}))
            );
          }),
          myPins.length>0 && e("div",{style:{display:"flex",gap:6,marginTop:8}},
            e("button",{style:{...S.btn,flex:1,fontSize:10},onClick:()=>download(toGeoJSON(myPins),"all-pins.geojson","application/json")},"Export All GeoJSON"),
            e("button",{style:{...S.btn,flex:1,fontSize:10},onClick:()=>download(toGPX(myPins),"all-pins.gpx","application/gpx+xml")},"Export All GPX")
          )
        ),

        // ADD
        tab==="add" && e("div",null,
          e("div",{style:S.secHead},"Drop a pin"),
          e("div",{style:{...S.hint,marginBottom:8}}, pendingLL?`📍 ${pendingLL.lat.toFixed(4)}, ${pendingLL.lng.toFixed(4)}`:"Close this and click the map to set location"),
          e("input",{style:S.input,placeholder:"Name / Place",value:form.name,onChange:ev=>setForm(f=>({...f,name:ev.target.value}))}),
          e("textarea",{style:{...S.input,height:46,resize:"none"},placeholder:"Description (optional)",value:form.description,onChange:ev=>setForm(f=>({...f,description:ev.target.value}))}),
          e("input",{style:S.input,placeholder:"#tags space or comma separated",value:form.tags,onChange:ev=>setForm(f=>({...f,tags:ev.target.value}))}),
          e("label",{style:{...S.hint,cursor:"pointer",display:"flex",alignItems:"center",gap:6,marginBottom:8}},
            `📷 ${form.photo?"Photo attached ✓":"Attach photo (optional, max 2MB)"}`,
            e("input",{type:"file",accept:"image/*",style:{display:"none"},onChange:handlePhoto})
          ),
          form.photo && e("div",{style:{position:"relative",marginBottom:8}},
            e("img",{src:form.photo,style:{width:"100%",borderRadius:6,maxHeight:120,objectFit:"cover"}}),
            e("button",{onClick:()=>setForm(f=>({...f,photo:null})),style:{position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.5)",border:"none",color:"#fff",borderRadius:"50%",width:20,height:20,cursor:"pointer",fontSize:11}}, "✕")
          ),
          e("div",{style:{display:"flex",gap:10,marginBottom:6}},
            ["public","private","shareable"].map(opt=>e("label",{key:opt,style:{fontSize:11,cursor:"pointer",color:"#6a5a40"}},
              e("input",{type:"radio",name:"priv",checked:form.privacy===opt,onChange:()=>setForm(f=>({...f,privacy:opt}))}), ` ${opt}`
            ))
          ),
          e("div",{style:{fontSize:10,color:"#9a8a70",marginBottom:10,fontStyle:"italic"}},
            form.privacy==="public"?"Searchable by everyone":form.privacy==="private"?"Only visible to you":"Link-only"
          ),
          e("button",{style:{...S.btn,width:"100%"},onClick:savePin},"SAVE PIN")
        ),

        // NEARBY
        tab==="nearby" && e("div",null,
          e("div",{style:S.secHead},"Nearby pins"),
          e("div",{style:{...S.hint,marginBottom:10}}, userLL?"📍 Location known":"Tap the GPS button first"),
          e("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:10,flexWrap:"wrap"}},
            e("span",{style:{fontSize:11,color:"#6a5a40"}},"Radius:"),
            [5,10,25,50].map(r=>e("button",{key:r,style:{...S.chip,background:nearbyKm===r?"#2e7d32":"none",color:nearbyKm===r?"#fff":"#2e7d32"},onClick:()=>setNearbyKm(r)},`${r}km`))
          ),
          e("button",{style:{...S.btn,width:"100%",marginBottom:10},onClick:findNearby},"Find Nearby"),
          nearbyRes && (nearbyRes.length===0
            ? e("div",{style:S.hint},`No pins within ${nearbyKm}km.`)
            : nearbyRes.map(p=>e(PinCard,{key:p.id,pin:p,user,dist:p.dist,onFocus:()=>{mapObj.current?.setView([p.lat,p.lng],14);setSelPin(p);setOpen(false);},onDelete:deletePin,onUpvote:toggleUpvote,onSave:saveToCollection}))
          )
        ),

        // PROFILE
        tab==="profile" && e(Profile,{user,myPins,
          onSave:name=>{ localStorage.setItem("pm-user",name); setUser(name); flash("✅ Updated!"); },
          onGeoJSON:()=>download(toGeoJSON(myPins),"pins.geojson","application/json"),
          onGPX:()=>download(toGPX(myPins),"pins.gpx","application/gpx+xml")
        })
      )
    ),

    // FAB
    e("button",{onPointerDown:onFabDown,title:"Tap to open · drag to move",style:{position:"absolute",bottom:fabPos.bottom,right:fabPos.right,width:50,height:50,borderRadius:"50%",background:"rgba(255,253,248,0.96)",backdropFilter:"blur(12px)",border:`1.5px solid ${open?"#2e7d32":"#c8b89a"}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"grab",zIndex:1001,boxShadow:"0 4px 18px rgba(0,0,0,0.15)",touchAction:"none",userSelect:"none"}},
      open
        ? e("span",{style:{fontSize:17,color:"#2e7d32"}}, "✕")
        : e("svg",{width:20,height:15,viewBox:"0 0 20 15",fill:"none"},
            e("rect",{width:20,height:2.4,rx:1.2,fill:"#2e7d32"}),
            e("rect",{y:6.3,width:20,height:2.4,rx:1.2,fill:"#2e7d32"}),
            e("rect",{y:12.6,width:20,height:2.4,rx:1.2,fill:"#2e7d32"})
          )
    ),

    // Pin detail popup
    selPin && e("div",{className:"detail",style:{position:"absolute",bottom:"calc(20px + env(safe-area-inset-bottom, 0px))",left:"calc(16px + env(safe-area-inset-left, 0px))",background:"rgba(255,253,248,0.97)",border:"1px solid #d0c4a8",borderRadius:12,padding:"13px 15px",minWidth:220,maxWidth:290,zIndex:1001,boxShadow:"0 8px 32px rgba(0,0,0,0.13)"}},
      e("button",{style:{position:"absolute",top:8,right:10,background:"none",border:"none",color:"#9a8a70",cursor:"pointer",fontSize:12},onClick:()=>setSelPin(null)}, "✕"),
      selPin.photo && e("img",{src:selPin.photo,style:{width:"100%",borderRadius:8,marginBottom:8,maxHeight:140,objectFit:"cover"}}),
      e("div",{style:{fontWeight:700,fontSize:14,color:"#2c2416",marginBottom:2,paddingRight:16}}, selPin.name),
      e("div",{style:{fontSize:10,color:"#9a8a70",marginBottom:6}}, `@${selPin.owner}`, selPin.saved_from&&e("span",{style:{color:"#e65100"}},` · saved from @${selPin.saved_from}`)),
      selPin.description && e("div",{style:{fontSize:11,color:"#5a4a30",marginBottom:6,lineHeight:1.5}}, selPin.description),
      e("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginBottom:6}},
        (selPin.tags||[]).map(t=>e("span",{key:t,style:{fontSize:10,padding:"2px 7px",borderRadius:10,background:tagColor(t)+"18",color:tagColor(t),border:`1px solid ${tagColor(t)}40`}},`#${t}`))
      ),
      e("div",{style:{fontSize:9,color:"#b0a080",fontFamily:"monospace",marginBottom:8}}, `${selPin.lat.toFixed(5)}, ${selPin.lng.toFixed(5)}`),
      e("div",{style:{display:"flex",gap:6,flexWrap:"wrap"}},
        selPin.owner!==user && e(React.Fragment,null,
          e("button",{style:{background:"none",border:"1px solid #d0c4a8",color:"#6a5a40",padding:"4px 10px",fontSize:11,cursor:"pointer",borderRadius:10},onClick:()=>toggleUpvote(selPin.id)}, `${selPin.upvotes?.includes(user)?"★":"☆"} ${selPin.upvotes?.length||0}`),
          e("button",{style:{background:"none",border:"1px solid #d0c4a8",color:"#6a5a40",padding:"4px 10px",fontSize:11,cursor:"pointer",borderRadius:10},onClick:()=>saveToCollection(selPin)}, "⭐ Save")
        ),
        selPin.owner===user && e("button",{style:{background:"none",border:"1px solid #c08080",color:"#c05050",padding:"4px 10px",cursor:"pointer",fontSize:10,borderRadius:3},onClick:()=>deletePin(selPin.id)}, "🗑 Delete")
      )
    ),

    // Toast
    toast && e("div",{style:{position:"absolute",bottom:"calc(18px + env(safe-area-inset-bottom, 0px))",left:"50%",transform:"translateX(-50%)",background:"rgba(255,253,248,0.97)",border:"1px solid #d0c4a8",color:"#2e7d32",padding:"7px 16px",borderRadius:20,fontSize:11,zIndex:1002,whiteSpace:"nowrap",boxShadow:"0 2px 12px rgba(0,0,0,0.1)"}}, toast)
  );
}

// Mount
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));

// Service worker
if("serviceWorker" in navigator) {
  window.addEventListener("load", ()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}
