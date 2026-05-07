// Variation A — "Atlas"
// Modern editorial. Type-led. Hairline rules. Restrained ornament.
// Forest green primary, warm off-white paper, refined Inter throughout.

(function(){
const { useState, useEffect, useRef, useMemo } = React;

// Tokens ────────────────────────────────────────────────────────────────────
const T = {
  paper:   '#f6f1e4',
  paper2:  '#efe9d8',
  paper3:  '#e8e1cd',
  ink:     '#1a201c',
  ink2:    '#3c4540',
  ink3:    '#6f786f',
  ink4:    '#9aa097',
  forest:  '#2a5d3c',
  forest2: '#1f4a30',
  forestPale:'#dde6dc',
  rust:    '#b85c2a',
  border:  '#d8cfb8',
  borderSoft:'#e6dfca',
  shadow:  '0 1px 2px rgba(28,32,28,0.04), 0 6px 22px rgba(28,32,28,0.06)',
  shadowLg:'0 1px 2px rgba(28,32,28,0.04), 0 18px 40px rgba(28,32,28,0.14)',
  font: '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
};

// Inject base styles + topo SVG patterns ────────────────────────────────────
function AtlasStyles() {
  return (
    <style>{`
      .atlas { font-family: ${T.font}; color: ${T.ink}; -webkit-font-smoothing: antialiased; }
      .atlas, .atlas * { box-sizing: border-box; }
      .atlas button { font-family: inherit; cursor: pointer; }
      .atlas input, .atlas textarea { font-family: inherit; }
      .atlas .mono { font-family: ${T.mono}; font-feature-settings: "tnum"; }
      .atlas .caps { font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 600; }
      .atlas .hr { height: 1px; background: ${T.border}; }
      .atlas .scroll::-webkit-scrollbar { width: 0; height: 0; }
      .atlas .scroll { scrollbar-width: none; }
      .atlas-leaflet .leaflet-tile-pane { filter: saturate(0.45) contrast(0.92) brightness(1.04) sepia(0.06); }
      .atlas-leaflet .leaflet-container { background: ${T.paper2}; }
      @keyframes atlasSheetIn { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      @keyframes atlasFade { from { opacity: 0 } to { opacity: 1 } }
      .atlas-sheet { animation: atlasSheetIn .28s cubic-bezier(.25,1.05,.4,1) both; }
      .atlas-fade { animation: atlasFade .18s ease both; }
      .atlas-pin-marker { background: none !important; border: none !important; }
      .atlas-pin-shape { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.18)); }
      .atlas-pin-shape:hover { transform: translateY(-2px); transition: transform .15s; }
    `}</style>
  );
}

// Topo decorative SVG (used as subtle accent) ───────────────────────────────
function TopoLines({ opacity = 0.18, color = T.forest }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 200 80" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity }}>
      <g fill="none" stroke={color} strokeWidth="0.6">
        <path d="M-10 60 Q 30 40 70 50 T 150 35 T 220 45" />
        <path d="M-10 50 Q 30 28 70 38 T 150 22 T 220 32" />
        <path d="M-10 40 Q 30 18 70 26 T 150 10 T 220 20" />
        <path d="M-10 30 Q 30 10 70 16 T 150 -2 T 220 8" />
      </g>
    </svg>
  );
}

// Custom marker DOM string ───────────────────────────────────────────────────
function atlasMarkerHTML(pin) {
  return `
    <svg width="28" height="36" viewBox="0 0 28 36" class="atlas-pin-shape" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0 C 6.27 0 0 6.27 0 14 c 0 9.5 14 22 14 22 s 14 -12.5 14 -22 C 28 6.27 21.73 0 14 0 z"
            fill="${pin.color}" stroke="${T.paper}" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="5" fill="${T.paper}" />
    </svg>`;
}

// Pin glyph (shared) ─────────────────────────────────────────────────────────
function PinGlyph({ size = 16, color = T.forest }) {
  return (
    <svg width={size} height={size * 36/28} viewBox="0 0 28 36">
      <path d="M14 0 C 6.27 0 0 6.27 0 14 c 0 9.5 14 22 14 22 s 14 -12.5 14 -22 C 28 6.27 21.73 0 14 0 z" fill={color}/>
      <circle cx="14" cy="14" r="5" fill={T.paper} />
    </svg>
  );
}

// Wordmark ───────────────────────────────────────────────────────────────────
function AtlasWordmark({ color = T.ink }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <PinGlyph size={14} color={T.forest} />
      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.18em', color }}>PINMAP</div>
    </div>
  );
}

// ─── Splash ────────────────────────────────────────────────────────────────
function AtlasSplash({ onSignIn, onGuest }) {
  return (
    <div className="atlas-fade" style={{ position: 'absolute', inset: 0, background: T.paper, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Topo decoration */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5 }}>
        <TopoLines opacity={0.12} />
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(120% 70% at 50% 0%, transparent 40%, ${T.paper} 75%)` }} />
      </div>

      {/* Top meta strip */}
      <div style={{ padding: '52px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <div className="caps mono" style={{ color: T.ink3 }}>EDITION 02 · 2026</div>
        <div className="caps mono" style={{ color: T.ink3 }}>61.21°N 149.90°W</div>
      </div>

      {/* Hero */}
      <div style={{ flex: 1, padding: '0 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
        <div style={{ marginBottom: 28 }}>
          <PinGlyph size={36} color={T.forest} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.22em', color: T.forest, marginBottom: 12, textTransform: 'uppercase' }}>
          A Field Atlas
        </div>
        <div style={{ fontSize: 38, lineHeight: 1.05, fontWeight: 700, letterSpacing: '-0.02em', color: T.ink, marginBottom: 16 }}>
          The map of the<br/>places <em style={{ fontStyle: 'italic', fontWeight: 600, color: T.forest }}>that matter</em><br/>to you.
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.55, color: T.ink2, maxWidth: 320, marginBottom: 36 }}>
          Drop pins, tag them with anything, and discover the quiet places shared by people who care about the ground under their feet.
        </div>
      </div>

      {/* CTAs */}
      <div style={{ padding: '0 28px 40px', position: 'relative', zIndex: 2 }}>
        <button
          onClick={onSignIn}
          style={{
            width: '100%', padding: '15px 18px', borderRadius: 12,
            background: T.forest, color: T.paper, border: 'none',
            fontSize: 15, fontWeight: 600, letterSpacing: '0.01em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: T.shadow,
          }}>
          <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#fff" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65zM24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.16C6.51 42.62 14.62 48 24 48zM10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.16C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19zM24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.16C12.43 13.72 17.74 9.5 24 9.5z" opacity=".0"/><path fill="#fff" d="M24 19.5v9h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65 0-1.57-.15-3.09-.38-4.55H24z" opacity=".25"/></svg>
          Continue with Google
        </button>
        <button
          onClick={onGuest}
          style={{ width: '100%', marginTop: 10, padding: '13px 18px', borderRadius: 12, background: 'transparent', color: T.ink2, border: `1px solid ${T.border}`, fontSize: 14, fontWeight: 500 }}>
          Browse as guest
        </button>
        <div className="caps mono" style={{ marginTop: 24, textAlign: 'center', color: T.ink4, fontSize: 9 }}>
          © 2026 · DROP · DISCOVER · DOCUMENT
        </div>
      </div>
    </div>
  );
}

// ─── Map screen ────────────────────────────────────────────────────────────
function AtlasMap({ onPin, onSearch, onMenu, onLayers, onAdd, onGps, focusedPinId, mapId }) {
  const ref = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = pmMakeMap(ref.current);
    mapRef.current = map;

    PM_MOCK_PINS.forEach(p => {
      const m = pmPinMarker(p, atlasMarkerHTML(p), { w: 28, h: 36, x: 14, y: 36 });
      m.on('click', () => onPin && onPin(p));
      m.addTo(map);
    });

    return () => { try { map.remove(); } catch {} mapRef.current = null; };
  }, []);

  return (
    <div className="atlas-leaflet" style={{ position: 'absolute', inset: 0, background: T.paper2 }}>
      <div ref={ref} style={{ position: 'absolute', inset: 0 }} />

      {/* Top: search + menu */}
      <div style={{ position: 'absolute', top: 50, left: 12, right: 12, display: 'flex', gap: 8, zIndex: 400 }}>
        <button
          onClick={onMenu}
          style={{ width: 44, height: 44, borderRadius: 12, background: T.paper, border: `1px solid ${T.border}`, boxShadow: T.shadow, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none"><rect y="0" width="18" height="2" rx="1" fill={T.ink}/><rect y="6" width="13" height="2" rx="1" fill={T.ink}/><rect y="12" width="18" height="2" rx="1" fill={T.ink}/></svg>
        </button>
        <button
          onClick={onSearch}
          style={{ flex: 1, height: 44, borderRadius: 12, background: T.paper, border: `1px solid ${T.border}`, boxShadow: T.shadow, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10, color: T.ink3, fontSize: 14 }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke={T.ink3} strokeWidth="1.5"/><path d="m10.5 10.5 3 3" stroke={T.ink3} strokeWidth="1.5" strokeLinecap="round"/></svg>
          <span>Search tags or places…</span>
        </button>
      </div>

      {/* Right column: layers + visibility + gps */}
      <div style={{ position: 'absolute', top: 106, right: 12, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 400 }}>
        {[
          { glyph: <svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 1 1 5l7 4 7-4-7-4z M1 9l7 4 7-4 M1 12l7 4 7-4" stroke={T.ink} strokeWidth="1.2" fill="none" strokeLinejoin="round"/></svg>, onClick: onLayers, label: 'Layers' },
          { glyph: <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" stroke={T.ink} strokeWidth="1.2" fill="none"/><circle cx="8" cy="8" r="2.5" fill={T.forest}/></svg>, label: 'View' },
          { glyph: <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="3" fill={T.forest}/><circle cx="8" cy="8" r="6.5" stroke={T.forest} strokeWidth="1.2" fill="none"/><line x1="8" y1="0" x2="8" y2="3" stroke={T.ink} strokeWidth="1.2"/><line x1="8" y1="13" x2="8" y2="16" stroke={T.ink} strokeWidth="1.2"/><line x1="0" y1="8" x2="3" y2="8" stroke={T.ink} strokeWidth="1.2"/><line x1="13" y1="8" x2="16" y2="8" stroke={T.ink} strokeWidth="1.2"/></svg>, onClick: onGps, label: 'GPS' },
        ].map((b,i) => (
          <button key={i} onClick={b.onClick} title={b.label}
            style={{ width: 40, height: 40, borderRadius: 10, background: T.paper, border: `1px solid ${T.border}`, boxShadow: T.shadow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {b.glyph}
          </button>
        ))}
      </div>

      {/* Coordinate strip — bottom left */}
      <div style={{ position: 'absolute', bottom: 84, left: 12, display: 'flex', alignItems: 'center', gap: 8, zIndex: 400 }}>
        <div className="mono" style={{ fontSize: 10, padding: '5px 9px', background: T.paper, border: `1px solid ${T.border}`, borderRadius: 6, color: T.ink2, letterSpacing: '0.05em' }}>
          {pmFmtCoordShort(61.21, -149.90)}  ·  Z 11
        </div>
      </div>

      {/* FAB */}
      <button onClick={onAdd}
        style={{ position: 'absolute', bottom: 84, right: 12, height: 48, padding: '0 18px 0 14px', borderRadius: 14, background: T.forest, color: T.paper, border: 'none', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, boxShadow: T.shadowLg, zIndex: 400 }}>
        <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 0v14M0 7h14" stroke={T.paper} strokeWidth="2" strokeLinecap="round"/></svg>
        Drop pin
      </button>
    </div>
  );
}

// ─── Pin detail bottom sheet ───────────────────────────────────────────────
function AtlasPinDetail({ pin, onClose, onViewUser }) {
  if (!pin) return null;
  const comments = PM_MOCK_COMMENTS[pin.id] || [];
  const profile = PM_PROFILES[pin.owner] || { name: pin.owner, avatar: pmInitial(pin.owner) };
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 600, pointerEvents: 'none' }}>
      <div onClick={onClose} className="atlas-fade" style={{ position: 'absolute', inset: 0, background: 'rgba(20,24,20,0.32)', pointerEvents: 'auto' }}/>
      <div className="atlas-sheet scroll" style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        maxHeight: '78%', background: T.paper, borderRadius: '20px 20px 0 0',
        boxShadow: T.shadowLg, pointerEvents: 'auto', overflowY: 'auto',
        paddingBottom: 28,
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 0' }}>
          <div style={{ width: 36, height: 4, background: T.border, borderRadius: 4 }}/>
        </div>

        {/* Hero strip */}
        <div style={{ position: 'relative', padding: '14px 20px 0' }}>
          <div className="mono caps" style={{ color: T.ink3, marginBottom: 8 }}>{pmFmtCoord(pin.lat, pin.lng)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <PinGlyph size={20} color={pin.color} />
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', color: T.ink, lineHeight: 1.15, flex: 1 }}>{pin.name}</div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', padding: 4, color: T.ink3 }}>
              <svg width="20" height="20" viewBox="0 0 20 20"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button onClick={() => onViewUser && onViewUser(pin.owner)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', padding: 0 }}>
              <div style={{ width: 22, height: 22, borderRadius: 11, background: T.forestPale, color: T.forest, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>{profile.avatar || pmInitial(pin.owner)}</div>
              <span style={{ fontSize: 13, color: T.ink2, fontWeight: 500 }}>@{pin.owner}</span>
            </button>
            <span style={{ fontSize: 12, color: T.ink4 }}>·</span>
            <span className="caps" style={{ color: T.ink3 }}>{pin.privacy}</span>
            <span style={{ fontSize: 12, color: T.ink4 }}>·</span>
            <span className="mono" style={{ fontSize: 11, color: T.ink3 }}>{pin.distKm.toFixed(1)} km</span>
          </div>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 6, padding: '14px 20px 0', flexWrap: 'wrap' }}>
          {pin.tags.map(t => (
            <span key={t} style={{ fontSize: 12, color: T.forest, background: T.forestPale, padding: '4px 10px', borderRadius: 100, fontWeight: 500 }}>#{t}</span>
          ))}
        </div>

        {/* Description */}
        <div style={{ padding: '16px 20px 0', fontSize: 14.5, color: T.ink2, lineHeight: 1.6 }}>{pin.description}</div>

        {/* Stat row */}
        <div style={{ display: 'flex', gap: 8, padding: '16px 20px 0' }}>
          {[
            { v: pin.upvotes,  l: 'upvotes',  icon: '↑' },
            { v: pin.saved,    l: 'saved',    icon: '✦' },
            { v: pin.comments, l: 'comments', icon: '·' },
          ].map(s => (
            <div key={s.l} style={{ flex: 1, padding: '10px 12px', border: `1px solid ${T.border}`, borderRadius: 10, background: T.paper2 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.ink, letterSpacing: '-0.02em' }}>{s.v}</div>
              <div className="caps" style={{ color: T.ink3, fontSize: 9, marginTop: 1 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Action row */}
        <div style={{ display: 'flex', gap: 8, padding: '14px 20px 0' }}>
          <button style={{ flex: 1, padding: '11px', borderRadius: 10, background: T.forest, color: T.paper, border: 'none', fontSize: 13, fontWeight: 600 }}>↑ Upvote</button>
          <button style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'transparent', color: T.ink, border: `1px solid ${T.border}`, fontSize: 13, fontWeight: 500 }}>Save</button>
          <button style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'transparent', color: T.ink, border: `1px solid ${T.border}`, fontSize: 13, fontWeight: 500 }}>Share</button>
        </div>

        {/* Comments */}
        <div style={{ padding: '20px 20px 0' }}>
          <div className="caps" style={{ color: T.ink3, marginBottom: 12 }}>Comments · {comments.length}</div>
          {comments.map(c => (
            <div key={c.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${T.borderSoft}` }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.forest }}>@{c.owner}</span>
                <span className="mono" style={{ fontSize: 11, color: T.ink4 }}>{c.ts} ago</span>
              </div>
              <div style={{ fontSize: 14, color: T.ink2, lineHeight: 1.5 }}>{c.body}</div>
              <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
                <button style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 12, color: T.ink3 }}>↑ {c.upvotes}</button>
                <button style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 12, color: T.ink3 }}>Reply</button>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <input placeholder="Add a comment…" style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.paper, fontSize: 13, outline: 'none', color: T.ink }}/>
            <button style={{ padding: '10px 14px', borderRadius: 10, background: T.ink, color: T.paper, border: 'none', fontSize: 13, fontWeight: 600 }}>Post</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Search panel ──────────────────────────────────────────────────────────
function AtlasSearch({ onClose, onPickTag, onPickPin }) {
  const [q, setQ] = useState('');
  return (
    <div className="atlas-fade" style={{ position: 'absolute', inset: 0, background: T.paper, zIndex: 700, display: 'flex', flexDirection: 'column' }}>
      {/* Search input */}
      <div style={{ padding: '50px 12px 16px', display: 'flex', gap: 8, alignItems: 'center', borderBottom: `1px solid ${T.borderSoft}` }}>
        <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 10, background: 'transparent', border: 'none', color: T.ink, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="20" height="20" viewBox="0 0 20 20"><path d="M12 4l-7 6 7 6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{ flex: 1, height: 40, borderRadius: 10, background: T.paper2, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 10 }}>
          <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke={T.ink3} strokeWidth="1.5"/><path d="m10.5 10.5 3 3" stroke={T.ink3} strokeWidth="1.5" strokeLinecap="round"/></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus placeholder="hashtag or place name"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: T.ink }}/>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.borderSoft}`, padding: '0 16px' }}>
        {['# Tags', '📍 Places'].map((t,i) => (
          <button key={i} style={{ padding: '12px 4px', marginRight: 24, background: 'transparent', border: 'none', color: i===0 ? T.ink : T.ink3, fontWeight: i===0 ? 600 : 400, fontSize: 13, borderBottom: i===0 ? `2px solid ${T.forest}` : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {/* Body */}
      <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 80px' }}>
        <div className="caps" style={{ color: T.ink3, marginBottom: 12 }}>Trending · Last 7 days</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 24 }}>
          {PM_TRENDING_TAGS.slice(0,6).map((t,i) => (
            <button key={t.tag} onClick={() => onPickTag && onPickTag(t.tag)}
              style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '12px 4px', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.borderSoft}`, textAlign: 'left' }}>
              <span className="mono" style={{ fontSize: 12, color: T.ink4, width: 22 }}>{String(i+1).padStart(2,'0')}</span>
              <span style={{ fontSize: 17, fontWeight: 600, color: T.ink, letterSpacing: '-0.01em', flex: 1 }}>#{t.tag}</span>
              <span className="mono" style={{ fontSize: 12, color: T.ink3 }}>{t.count}</span>
              <span className="mono" style={{ fontSize: 11, color: t.delta.startsWith('+') ? T.forest : T.ink4, width: 30, textAlign: 'right' }}>{t.delta}</span>
            </button>
          ))}
        </div>

        <div className="caps" style={{ color: T.ink3, marginBottom: 12 }}>Nearby</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PM_NEARBY_PINS.slice(0,4).map(p => (
            <button key={p.id} onClick={() => onPickPin && onPickPin(p)}
              style={{ display: 'flex', gap: 12, padding: '12px', background: T.paper2, border: `1px solid ${T.borderSoft}`, borderRadius: 10, textAlign: 'left' }}>
              <PinGlyph size={16} color={p.color}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: T.ink3 }}>@{p.owner} · {p.tags.slice(0,2).map(t => '#'+t).join(' ')}</div>
              </div>
              <div className="mono" style={{ fontSize: 11, color: T.ink3 }}>{p.distKm.toFixed(1)}km</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Profile screen ────────────────────────────────────────────────────────
function AtlasProfile({ onClose }) {
  const me = PM_ME;
  return (
    <div className="atlas-fade scroll" style={{ position: 'absolute', inset: 0, background: T.paper, zIndex: 650, overflowY: 'auto', paddingBottom: 80 }}>
      {/* Header bar */}
      <div style={{ position: 'sticky', top: 0, background: T.paper, padding: '50px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.borderSoft}`, zIndex: 2 }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: 'transparent', border: 'none', color: T.ink }}>
          <svg width="20" height="20" viewBox="0 0 20 20"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
        <div className="caps" style={{ color: T.ink2 }}>Profile</div>
        <button style={{ width: 36, height: 36, borderRadius: 10, background: 'transparent', border: 'none', color: T.ink }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      </div>

      {/* Identity */}
      <div style={{ padding: '24px 20px 20px', position: 'relative' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: T.forest, color: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 600, letterSpacing: '0.02em', flexShrink: 0, boxShadow: T.shadow }}>{pmInitial(me.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.ink, letterSpacing: '-0.01em' }}>{me.name}</div>
            <div style={{ fontSize: 13, color: T.ink3, marginBottom: 6 }}>@{me.handle}</div>
            <div className="mono caps" style={{ color: T.ink3, fontSize: 10 }}>{me.location} · Member since {me.joined}</div>
          </div>
        </div>
        <div style={{ fontSize: 14, color: T.ink2, lineHeight: 1.5, marginTop: 14 }}>{me.bio}</div>
        <button style={{ marginTop: 14, padding: '9px 14px', borderRadius: 10, background: 'transparent', color: T.ink, border: `1px solid ${T.border}`, fontSize: 13, fontWeight: 500 }}>Edit profile</button>
      </div>

      <div className="hr"/>

      {/* Stats */}
      <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 0, borderBottom: `1px solid ${T.borderSoft}` }}>
        {[
          { v: me.stats.pins, l: 'pins' },
          { v: me.stats.public, l: 'public' },
          { v: me.stats.saved, l: 'saved' },
          { v: me.stats.upvotes, l: 'upvotes' },
        ].map((s, i) => (
          <div key={s.l} style={{ borderRight: i < 3 ? `1px solid ${T.borderSoft}` : 'none', textAlign: 'center', padding: '4px 0' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.ink, letterSpacing: '-0.02em' }}>{s.v}</div>
            <div className="caps" style={{ color: T.ink3, fontSize: 9, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Following */}
      <div style={{ padding: '20px' }}>
        <div className="caps" style={{ color: T.ink3, marginBottom: 12 }}>Following · {me.following.length}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {me.following.map(h => {
            const p = PM_PROFILES[h];
            return (
              <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${T.borderSoft}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 18, background: T.forestPale, color: T.forest, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>{p.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: T.ink3 }}>@{p.handle} · {p.pinCount} pins</div>
                </div>
                <button style={{ padding: '6px 12px', borderRadius: 8, background: 'transparent', color: T.ink2, border: `1px solid ${T.border}`, fontSize: 12 }}>Following</button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settings rows */}
      <div style={{ padding: '0 20px 20px' }}>
        <div className="caps" style={{ color: T.ink3, marginBottom: 12 }}>Settings</div>
        {[
          ['Push notifications', 'On'],
          ['Map layer', 'Standard'],
          ['Export data', 'GeoJSON · GPX'],
          ['Tutorial', 'Replay'],
          ['About', 'v 175'],
        ].map(([l,r]) => (
          <button key={l} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.borderSoft}`, textAlign: 'left' }}>
            <span style={{ fontSize: 14, color: T.ink }}>{l}</span>
            <span style={{ fontSize: 13, color: T.ink3, display: 'flex', alignItems: 'center', gap: 6 }}>{r} <svg width="6" height="10" viewBox="0 0 6 10"><path d="M1 1l4 4-4 4" stroke={T.ink3} strokeWidth="1.4" fill="none" strokeLinecap="round"/></svg></span>
          </button>
        ))}
      </div>

      <div style={{ padding: '0 20px 40px', textAlign: 'center' }}>
        <div className="mono caps" style={{ color: T.ink4, fontSize: 9, lineHeight: 1.7 }}>
          PINMAP · v 175<br/>
          Built May 2026<br/>
          © 2026 Seth Gray · All rights reserved
        </div>
      </div>
    </div>
  );
}

// ─── Mine list — logbook style (Direction B applied to Atlas palette) ─────
function AtlasMine({ onPick }) {
  const myPins = PM_MOCK_PINS.filter(p => p.owner === 'me');
  const totalUpvotes = myPins.reduce((a,p) => a + (p.upvotes||0), 0);
  return (
    <div className="atlas-fade scroll" style={{ position: 'absolute', inset: 0, background: T.paper, zIndex: 600, overflowY: 'auto', paddingTop: 50, paddingBottom: 80 }}>
      {/* Logbook header */}
      <div style={{ padding: '4px 22px 0' }}>
        <div className="mono caps" style={{ color: T.forest, fontSize: 10, letterSpacing: '0.16em', marginBottom: 8 }}>VOL. II · YOUR FIELD LOG</div>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', color: T.ink, lineHeight: 1.05 }}>Mine</div>
        <div style={{ fontSize: 14, color: T.ink2, marginTop: 6 }}>
          {myPins.length} entries · {totalUpvotes} upvotes received
        </div>
      </div>

      {/* Contour-style divider */}
      <svg width="100%" height="14" viewBox="0 0 360 14" preserveAspectRatio="none" style={{ display: 'block', marginTop: 18 }}>
        <path d="M0 7 Q40 1 80 7 T160 7 T240 7 T320 7 T400 7" stroke={T.border} strokeWidth="1" fill="none"/>
        <path d="M0 11 Q40 5 80 11 T160 11 T240 11 T320 11 T400 11" stroke={T.borderSoft} strokeWidth="1" fill="none"/>
      </svg>

      {/* Entry list */}
      <div style={{ padding: '6px 20px 0' }}>
        {myPins.map((p, i) => (
          <button key={p.id} onClick={() => onPick && onPick(p)}
            style={{ width: '100%', textAlign: 'left', padding: '14px 14px 12px', marginTop: 10,
                     background: T.paper2, border: `1px solid ${T.borderSoft}`, borderRadius: 10,
                     position: 'relative', display: 'block', cursor: 'pointer' }}>
            {/* Entry number stripe */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="mono caps" style={{ fontSize: 9.5, color: T.forest, letterSpacing: '0.14em', fontWeight: 600 }}>
                ENTRY № {String(42 + i).padStart(4,'0')}
              </span>
              <span className="mono" style={{ fontSize: 10, color: T.ink4 }}>
                {pmFmtCoordShort(p.lat, p.lng)}
              </span>
            </div>

            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <PinGlyph size={16} color={p.color}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 600, color: T.ink, letterSpacing: '-0.01em', lineHeight: 1.2 }}>{p.name}</div>
                <div style={{ fontSize: 13.5, color: T.ink2, lineHeight: 1.5, marginTop: 4, fontStyle: 'italic',
                              borderLeft: `2px solid ${T.borderSoft}`, paddingLeft: 10 }}>
                  "{p.description}"
                </div>
              </div>
            </div>

            {/* Footer meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
              {p.tags.slice(0,3).map(t => (
                <span key={t} className="mono" style={{
                  fontSize: 10.5, color: T.forest, padding: '2px 7px',
                  border: `1px solid ${T.forest}`, borderRadius: 3, letterSpacing: '0.04em',
                  background: T.forestPale,
                }}>#{t}</span>
              ))}
              <span style={{ flex: 1 }}/>
              <span className="mono caps" style={{ fontSize: 9.5, color: T.ink3, letterSpacing: '0.1em' }}>
                ↑ {p.upvotes} · {p.comments} ✎ · {p.privacy.toUpperCase()}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Footer mark */}
      <div style={{ padding: '28px 20px 0', textAlign: 'center' }}>
        <div className="mono caps" style={{ color: T.ink4, fontSize: 9, letterSpacing: '0.18em' }}>
          ── END OF LOG ──
        </div>
      </div>
    </div>
  );
}

// ─── Add pin sheet ─────────────────────────────────────────────────────────
function AtlasAdd({ onClose }) {
  const [name, setName] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 700 }}>
      <div onClick={onClose} className="atlas-fade" style={{ position: 'absolute', inset: 0, background: 'rgba(20,24,20,0.32)' }}/>
      <div className="atlas-sheet" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: T.paper, borderRadius: '20px 20px 0 0', boxShadow: T.shadowLg, padding: '14px 20px 28px', maxHeight: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <div style={{ width: 36, height: 4, background: T.border, borderRadius: 4 }}/>
        </div>
        <div className="caps" style={{ color: T.ink3, marginBottom: 6 }}>New pin</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: T.ink, marginBottom: 4, letterSpacing: '-0.01em' }}>Drop a pin</div>
        <div className="mono" style={{ fontSize: 11, color: T.ink3, marginBottom: 18 }}>{pmFmtCoord(61.2181, -149.9003)}</div>

        <label className="caps" style={{ color: T.ink3, display: 'block', marginBottom: 6 }}>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="What is this place?"
          style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.paper2, fontSize: 14, color: T.ink, marginBottom: 14, outline: 'none' }}/>

        <label className="caps" style={{ color: T.ink3, display: 'block', marginBottom: 6 }}>Tags</label>
        <input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="hiking viewpoint wildflower"
          style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.paper2, fontSize: 14, color: T.ink, marginBottom: 14, outline: 'none' }}/>

        <label className="caps" style={{ color: T.ink3, display: 'block', marginBottom: 6 }}>Color</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {['#2a5d3c','#b85c2a','#1565c0','#ad1457','#6a1599','#00695c','#c62828','#3a4540'].map((c,i) => (
            <div key={c} style={{ width: 28, height: 28, borderRadius: 14, background: c, border: i===0 ? `2px solid ${T.ink}` : 'none', flexShrink: 0 }}/>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '13px', borderRadius: 10, background: 'transparent', color: T.ink, border: `1px solid ${T.border}`, fontSize: 14, fontWeight: 500 }}>Cancel</button>
          <button style={{ flex: 2, padding: '13px', borderRadius: 10, background: T.forest, color: T.paper, border: 'none', fontSize: 14, fontWeight: 600 }}>Drop pin</button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab bar ───────────────────────────────────────────────────────────────
function AtlasTabBar({ tab, setTab }) {
  const tabs = [
    { id: 'map',     label: 'Map',     icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 5l5-2 6 2 5-2v12l-5 2-6-2-5 2V5z M7 3v14 M13 5v14" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg> },
    { id: 'search',  label: 'Search',  icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="m13.5 13.5 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> },
    { id: 'mine',    label: 'Mine',    icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 4h14M3 9h14M3 14h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> },
    { id: 'profile', label: 'Profile', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M3.5 17c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> },
  ];
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 64, background: T.paper, borderTop: `1px solid ${T.borderSoft}`, display: 'flex', zIndex: 800, paddingBottom: 6 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)}
          style={{ flex: 1, background: 'transparent', border: 'none', padding: '8px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: tab === t.id ? T.forest : T.ink3 }}>
          {t.icon}
          <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em' }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────
function AtlasApp() {
  const [phase, setPhase] = useState('splash'); // splash | app
  const [tab, setTab] = useState('map');
  const [pin, setPin] = useState(null);
  const [add, setAdd] = useState(false);
  const [search, setSearch] = useState(false);

  return (
    <div className="atlas" style={{ position: 'absolute', inset: 0, background: T.paper, overflow: 'hidden' }}>
      <AtlasStyles/>
      {phase === 'splash' && <AtlasSplash onSignIn={() => setPhase('app')} onGuest={() => setPhase('app')}/>}

      {phase === 'app' && (
        <>
          {tab === 'map' && (
            <AtlasMap
              onPin={p => setPin(p)}
              onSearch={() => setSearch(true)}
              onMenu={() => setTab('profile')}
              onAdd={() => setAdd(true)}
            />
          )}
          {tab === 'search' && <AtlasSearch onClose={() => setTab('map')} onPickPin={p => { setTab('map'); setTimeout(() => setPin(p), 200); }}/>}
          {tab === 'mine' && <AtlasMine onPick={p => { setTab('map'); setTimeout(() => setPin(p), 200); }}/>}
          {tab === 'profile' && <AtlasProfile onClose={() => setTab('map')}/>}

          {pin && <AtlasPinDetail pin={pin} onClose={() => setPin(null)}/>}
          {add && <AtlasAdd onClose={() => setAdd(false)}/>}

          <AtlasTabBar tab={tab} setTab={setTab}/>
        </>
      )}
    </div>
  );
}

window.AtlasApp = AtlasApp;
})();
