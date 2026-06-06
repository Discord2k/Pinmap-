import React, { useState, useEffect, useRef } from 'react';
import { distKm } from '../utils/helpers';

// Bearing calculation (degrees clockwise from North)
function getBearing(lat1, lon1, lat2, lon2) {
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var rLat1 = lat1 * Math.PI / 180;
  var rLat2 = lat2 * Math.PI / 180;
  var y = Math.sin(dLon) * Math.cos(rLat2);
  var x = Math.cos(rLat1) * Math.sin(rLat2) - Math.sin(rLat1) * Math.cos(rLat2) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

// Map distFt → temperature config
function getTemp(distFt, lang) {
  if (distFt === null) return null;
  const es = lang === 'es';
  if (distFt <= 65)   return { label: es ? '¡Aquí mismo!'  : 'Right Here!',   icon: '🎯', hue: 120, fill: 1.0,  glow: '#43a047' };
  if (distFt <= 260)  return { label: es ? '¡Hirviendo!'   : 'Burning Hot!',  icon: '🌋', hue: 12,  fill: 0.88, glow: '#d84315' };
  if (distFt <= 820)  return { label: es ? 'Caliente'      : 'Hot',           icon: '🔥', hue: 28,  fill: 0.66, glow: '#ef6c00' };
  if (distFt <= 1960) return { label: es ? 'Tibio'         : 'Warm',          icon: '🌤️', hue: 48,  fill: 0.44, glow: '#fbc02d' };
  if (distFt <= 5280) return { label: es ? 'Frío'          : 'Cold',          icon: '❄️', hue: 210, fill: 0.25, glow: '#1565c0' };
  return               { label: es ? 'Muy Frío'      : 'Freezing',      icon: '🧊', hue: 200, fill: 0.10, glow: '#0d47a1' };
}

export function HuntRadarOverlay({ pin, userLL, distanceFt, trend, lang, onClose }) {
  const [heading, setHeading] = useState(0);
  const [liveLL, setLiveLL] = useState(userLL || null);
  const [liveFt, setLiveFt] = useState(distanceFt);
  const [liveTrend, setLiveTrend] = useState(trend);
  const [prevFt, setPrevFt] = useState(distanceFt);
  const [sensorReady, setSensorReady] = useState(false);
  const [sensorAsked, setSensorAsked] = useState(false);
  const watchRef = useRef(null);
  // Needle wobble animation state
  const [wobble, setWobble] = useState(0);
  const wobbleDir = useRef(1);
  const wobbleRef = useRef(null);

  // --- GPS watch ---
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLiveLL(ll);
        if (pin) {
          const meters = distKm(ll.lat, ll.lng, pin.lat, pin.lng) * 1000;
          const ft = Math.round(meters * 3.28084);
          setLiveFt((prev) => {
            setPrevFt(prev);
            if (prev !== null) {
              const diff = ft - prev;
              if (diff < -5) setLiveTrend('closer');
              else if (diff > 5) setLiveTrend('farther');
            }
            return ft;
          });
        }
      },
      null,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
    return () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current); };
  }, [pin]);

  // --- Orientation listener ---
  function startOrientation() {
    setSensorAsked(true);
    function onOrient(evt) {
      let h = 0;
      if (evt.webkitCompassHeading !== undefined) {
        h = evt.webkitCompassHeading;
      } else if (evt.alpha !== null) {
        h = (360 - evt.alpha) % 360;
      }
      setHeading(Math.round(h));
    }
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then((r) => {
          if (r === 'granted') {
            setSensorReady(true);
            window.addEventListener('deviceorientation', onOrient, true);
          }
        }).catch(() => {});
    } else {
      setSensorReady(true);
      window.addEventListener('deviceorientation', onOrient, true);
      window.addEventListener('deviceorientationabsolute', onOrient, true);
    }
    return () => {
      window.removeEventListener('deviceorientation', onOrient, true);
      window.removeEventListener('deviceorientationabsolute', onOrient, true);
    };
  }

  // Auto-start orientation on non-iOS (no permission prompt needed)
  useEffect(() => {
    if (typeof DeviceOrientationEvent === 'undefined' || typeof DeviceOrientationEvent.requestPermission !== 'function') {
      const cleanup = startOrientation();
      return cleanup;
    }
  }, []);

  // Needle wobble (idle animation when no GPS yet)
  useEffect(() => {
    if (liveLL) { clearInterval(wobbleRef.current); setWobble(0); return; }
    wobbleRef.current = setInterval(() => {
      setWobble(w => {
        const next = w + wobbleDir.current * 2;
        if (next > 12 || next < -12) wobbleDir.current *= -1;
        return next;
      });
    }, 60);
    return () => clearInterval(wobbleRef.current);
  }, [!!liveLL]);

  const bearing = liveLL && pin ? getBearing(liveLL.lat, liveLL.lng, pin.lat, pin.lng) : 0;
  const needleAngle = liveLL ? (bearing - heading + 360) % 360 : wobble;
  const temp = getTemp(liveFt, lang);

  // Thermometer fill height (0–1) → percentage of the tube
  const fillPct = temp ? temp.fill * 100 : 10;
  const fillColor = temp
    ? `hsl(${temp.hue}, 90%, 50%)`
    : '#1565c0';
  const glowColor = temp ? temp.glow : '#1565c0';

  // Trend arrow
  const trendArrow = liveTrend === 'closer'
    ? { symbol: '▲', color: '#2e7d32', label: lang === 'es' ? '¡Acercándote!' : 'Getting Closer!' }
    : liveTrend === 'farther'
    ? { symbol: '▼', color: '#c62828', label: lang === 'es' ? 'Alejándote...' : 'Getting Farther...' }
    : null;

  // Distance label
  const distLabel = liveFt === null
    ? (lang === 'es' ? 'Buscando GPS...' : 'Searching GPS...')
    : liveFt >= 1000
    ? `${(liveFt / 5280).toFixed(2)} mi`
    : `${liveFt} ft`;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9500,
      background: 'linear-gradient(160deg, #0d1f13 0%, #1a2e1f 55%, #0d1f13 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'space-between', padding: '40px 24px 32px',
      boxSizing: 'border-box', fontFamily: "'Outfit', sans-serif",
      overflow: 'hidden'
    }}>

      {/* Ambient glow pulse */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 320, height: 320, borderRadius: '50%',
        background: `radial-gradient(circle, ${glowColor}22 0%, transparent 70%)`,
        animation: 'pulse 2.5s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.6;transform:translate(-50%,-50%) scale(1)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1.12)} }
        @keyframes thermFill { from{height:0%} to{height:var(--h)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      {/* Header */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.18em', color: '#78a87a', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            {lang === 'es' ? 'RADAR DE CAZA' : 'HUNT RADAR'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#e8f5e9', lineHeight: 1.2, maxWidth: 220 }}>
            {pin ? pin.name : (lang === 'es' ? 'Objetivo' : 'Objective')}
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 20, padding: '8px 18px', fontSize: 13, fontWeight: 700,
          color: '#e8f5e9', cursor: 'pointer'
        }}>
          {lang === 'es' ? 'Cerrar' : 'Close'}
        </button>
      </div>

      {/* Main area: compass + thermometer side by side */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, zIndex: 1, width: '100%', maxWidth: 380 }}>

        {/* === Compass === */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>

          {/* iOS permission prompt */}
          {typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function' &&
            !sensorAsked && (
            <button onClick={startOrientation} style={{
              background: 'rgba(120,168,122,0.18)', border: '1px solid #78a87a',
              borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#78a87a',
              cursor: 'pointer', marginBottom: 6
            }}>
              {lang === 'es' ? '🧭 Activar brújula' : '🧭 Enable Compass'}
            </button>
          )}

          {/* Compass ring */}
          <div style={{ position: 'relative', width: 220, height: 220 }}>
            {/* Outer ring */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '6px solid #b8a26c',
              boxShadow: `0 0 24px ${glowColor}55, 0 8px 24px rgba(0,0,0,0.5), inset 0 2px 6px rgba(255,255,255,0.1)`,
              background: 'radial-gradient(circle, #1a2a1d 60%, #0d1810 100%)',
              boxSizing: 'border-box'
            }} />

            {/* Dial face with N/S/E/W labels — rotates with device */}
            <div style={{
              position: 'absolute', inset: 6, borderRadius: '50%',
              transform: `rotate(${-heading}deg)`,
              transition: 'transform 0.15s cubic-bezier(0.1,0.8,0.25,1)'
            }}>
              {[
                { label: 'N', deg: 0,   color: '#ef5350', top: '6px',  left: '50%', transform: 'translateX(-50%)' },
                { label: 'S', deg: 180, color: '#78a87a', bottom: '6px', left: '50%', transform: 'translateX(-50%)' },
                { label: 'E', deg: 90,  color: '#78a87a', top: '50%',  right: '6px',  transform: 'translateY(-50%)' },
                { label: lang === 'es' ? 'O' : 'W', deg: 270, color: '#78a87a', top: '50%', left: '6px', transform: 'translateY(-50%)' },
              ].map(d => (
                <div key={d.label} style={{
                  position: 'absolute', fontWeight: 900, fontSize: 13,
                  color: d.color, top: d.top, bottom: d.bottom, left: d.left, right: d.right, transform: d.transform
                }}>{d.label}</div>
              ))}
              {/* Tick marks */}
              {[...Array(36)].map((_, i) => (
                <div key={i} style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: i % 3 === 0 ? 2 : 1,
                  height: i % 3 === 0 ? 10 : 6,
                  background: i % 3 === 0 ? 'rgba(184,162,108,0.7)' : 'rgba(184,162,108,0.3)',
                  transformOrigin: '50% 0',
                  transform: `rotate(${i * 10}deg) translate(-50%, -102px)`
                }} />
              ))}
            </div>

            {/* Needle — always points toward pin */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 0, height: 0,
              transform: `translate(-50%, -50%) rotate(${needleAngle}deg)`,
              transition: liveLL ? 'transform 0.25s cubic-bezier(0.1,0.8,0.25,1)' : 'none',
              zIndex: 3
            }}>
              {/* Arrow tip (pointing up = toward pin) */}
              <div style={{
                position: 'absolute', top: -92, left: -7,
                width: 14, height: 90,
                background: 'linear-gradient(to bottom, #43a047, #2e7d32)',
                clipPath: 'polygon(50% 0%, 100% 100%, 50% 80%, 0% 100%)',
                filter: `drop-shadow(0 0 8px ${glowColor}aa)`
              }} />
              {/* Tail */}
              <div style={{
                position: 'absolute', top: 4, left: -4,
                width: 8, height: 60,
                background: 'rgba(255,255,255,0.15)',
                clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)',
                borderRadius: 2
              }} />
            </div>

            {/* Center cap */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 16, height: 16, borderRadius: '50%',
              background: '#b8a26c', border: '3px solid #0d1810',
              transform: 'translate(-50%, -50%)',
              zIndex: 4, boxShadow: '0 2px 6px rgba(0,0,0,0.6)'
            }} />

            {/* "No GPS" spinner */}
            {!liveLL && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', background: 'rgba(13,24,16,0.6)', zIndex: 5
              }}>
                <div style={{
                  width: 28, height: 28, border: '3px solid rgba(120,168,122,0.3)',
                  borderTopColor: '#78a87a', borderRadius: '50%', animation: 'spin 1s linear infinite'
                }} />
              </div>
            )}
          </div>

          {/* Direction label */}
          <div style={{ fontSize: 13, color: '#78a87a', fontWeight: 700, letterSpacing: '0.08em', textAlign: 'center' }}>
            {liveLL
              ? `${Math.round(bearing)}° ${['N','NE','E','SE','S','SW','W','NW'][Math.round(bearing/45)%8]}`
              : (lang === 'es' ? 'Esperando GPS…' : 'Awaiting GPS…')}
          </div>
        </div>

        {/* === Thermometer === */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, userSelect: 'none' }}>

          {/* Temperature label & icon */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, lineHeight: 1 }}>{temp ? temp.icon : '❓'}</div>
            <div style={{
              fontSize: 13, fontWeight: 800, marginTop: 5,
              color: temp ? temp.glow : '#78a87a',
              textShadow: temp ? `0 0 10px ${temp.glow}99` : 'none'
            }}>
              {temp ? temp.label : '—'}
            </div>
          </div>

          {/* Thermometer tube */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Tube background */}
            <div style={{
              width: 28, height: 160, borderRadius: 14,
              background: 'rgba(255,255,255,0.07)', border: '2px solid rgba(255,255,255,0.12)',
              position: 'relative', overflow: 'hidden', boxSizing: 'border-box'
            }}>
              {/* Fill */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: `${fillPct}%`,
                background: `linear-gradient(to top, ${fillColor}, ${fillColor}99)`,
                borderRadius: '0 0 14px 14px',
                transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.8s ease',
                boxShadow: `0 0 12px ${glowColor}88`
              }} />
              {/* Graduation marks */}
              {[20, 40, 60, 80].map(p => (
                <div key={p} style={{
                  position: 'absolute', left: 4, right: 4,
                  bottom: `${p}%`, height: 1,
                  background: 'rgba(255,255,255,0.15)'
                }} />
              ))}
            </div>

            {/* Bulb */}
            <div style={{
              width: 36, height: 36, borderRadius: '50%', marginTop: -4,
              background: fillColor,
              boxShadow: `0 0 18px ${glowColor}cc, 0 4px 12px rgba(0,0,0,0.5)`,
              border: '3px solid rgba(255,255,255,0.15)',
              transition: 'background 0.8s ease, box-shadow 0.8s ease'
            }} />
          </div>

          {/* Zone labels beside tube */}
          <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.35)', textAlign: 'center', letterSpacing: '0.05em', lineHeight: 1.8 }}>
            <div>🎯 65ft</div>
            <div>🌋 260ft</div>
            <div>🔥 820ft</div>
            <div>🌤 1960ft</div>
            <div>❄️ 5280ft</div>
          </div>
        </div>
      </div>

      {/* Footer: distance + trend */}
      <div style={{ width: '100%', maxWidth: 360, zIndex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Distance pill */}
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 14, padding: '12px 20px'
        }}>
          <span style={{ fontSize: 11, color: '#78a87a', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
            {lang === 'es' ? 'Distancia' : 'Distance'}
          </span>
          <span style={{
            fontSize: 32, fontWeight: 900, color: '#e8f5e9',
            textShadow: liveFt !== null && liveFt <= 65 ? `0 0 16px #43a04788` : 'none',
            transition: 'all 0.4s'
          }}>
            {distLabel}
          </span>
        </div>

        {/* Trend indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          minHeight: 36
        }}>
          {trendArrow ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: `${trendArrow.color}22`, border: `1px solid ${trendArrow.color}44`,
              borderRadius: 10, padding: '7px 18px'
            }}>
              <span style={{ fontSize: 20, color: trendArrow.color, fontWeight: 900 }}>{trendArrow.symbol}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: trendArrow.color }}>{trendArrow.label}</span>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
              {lang === 'es' ? 'Muévete para detectar dirección…' : 'Start moving to detect direction…'}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
