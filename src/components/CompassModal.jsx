import React, { useState, useEffect, useRef } from 'react';
import { distKm } from '../utils/helpers';

export function CompassModal({ pin, onClose, flash }) {
  var [heading, setHeading] = useState(0);
  var [userLoc, setUserLoc] = useState(null);
  var [sensorPermission, setSensorPermission] = useState('unknown');
  var watchIdRef = useRef(null);

  // Calculate bearing from user to pin
  function getBearing(lat1, lon1, lat2, lon2) {
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var rLat1 = lat1 * Math.PI / 180;
    var rLat2 = lat2 * Math.PI / 180;
    var y = Math.sin(dLon) * Math.cos(rLat2);
    var x = Math.cos(rLat1) * Math.sin(rLat2) - Math.sin(rLat1) * Math.cos(rLat2) * Math.cos(dLon);
    var brng = Math.atan2(y, x) * 180 / Math.PI;
    return (brng + 360) % 360;
  }

  // Request sensors
  function initOrientation() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(function(response) {
          if (response === 'granted') {
            setSensorPermission('granted');
            window.addEventListener('deviceorientation', handleOrientation, true);
          } else {
            setSensorPermission('denied');
            if (flash) flash("⚠️ Orientation sensor permission denied.");
          }
        })
        .catch(function(e) {
          console.error(e);
          setSensorPermission('denied');
        });
    } else {
      // Android / non-iOS standard browsers
      setSensorPermission('granted');
      window.addEventListener('deviceorientation', handleOrientation, true);
      // Try absolute orientation if available
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    }
  }

  function handleOrientation(event) {
    var compassHeading = 0;
    if (event.webkitCompassHeading !== undefined) {
      compassHeading = event.webkitCompassHeading;
    } else if (event.alpha !== null) {
      // Convert counter-clockwise alpha around z-axis to clockwise heading
      compassHeading = (360 - event.alpha) % 360;
    }
    setHeading(Math.round(compassHeading));
  }

  // Setup GPS tracking and orientation listener on mount
  useEffect(function() {
    // 1. Geolocation Watch
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        function(pos) {
          setUserLoc({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        function(err) {
          console.error(err);
          if (flash) flash("⚠️ GPS location tracking unavailable.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      if (flash) flash("⚠️ Geolocation is not supported by your browser.");
    }

    // 2. Automatically check if permission is already granted/not needed (non-iOS)
    if (typeof DeviceOrientationEvent === 'undefined' || typeof DeviceOrientationEvent.requestPermission !== 'function') {
      window.addEventListener('deviceorientation', handleOrientation, true);
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      setSensorPermission('granted');
    }

    return function() {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
    };
  }, []);

  // Compute stats
  var distance = userLoc ? distKm(userLoc.lat, userLoc.lng, pin.lat, pin.lng) : null;
  var bearing = userLoc ? getBearing(userLoc.lat, userLoc.lng, pin.lat, pin.lng) : 0;
  
  // Angle of the pin relative to the top of the phone screen
  var relativeArrowAngle = (bearing - heading + 360) % 360;

  return (
    <div 
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "radial-gradient(circle, #fcfaf2 0%, #ede6d0 100%)",
        zIndex: 2500,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "40px 24px",
        boxSizing: "border-box",
        fontFamily: "'Outfit', sans-serif"
      }}
    >
      {/* Header */}
      <div style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{fontSize:12,textTransform:"uppercase",letterSpacing:"0.15em",color:"#6f786f",fontWeight:700,marginBottom:4}}>Off-Grid Navigation</div>
          <div style={{fontSize:22,fontWeight:800,color:"#2a5d3c",lineHeight:1.2}}>{pin.name}</div>
        </div>
        <button 
          style={{background:"#2a5d3c",color:"#fff",border:"none",borderRadius:20,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 2px 8px rgba(42,93,60,0.2)"}}
          onClick={onClose}
        >
          Close
        </button>
      </div>

      {/* Main Dial Area */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,position:"relative",width:"100%"}}>
        {sensorPermission === 'unknown' ? (
          <div style={{textAlign:"center",padding:24,background:"rgba(255,255,255,0.7)",borderRadius:16,border:"1px solid #d8cfb8",maxWidth:300,boxShadow:"0 8px 24px rgba(0,0,0,0.05)"}}>
            <div style={{fontSize:42,marginBottom:12}}>🧭</div>
            <div style={{fontSize:16,fontWeight:700,color:"#2a5d3c",marginBottom:8}}>Sensor Access Required</div>
            <div style={{fontSize:13,color:"#6f786f",lineHeight:1.5,marginBottom:18}}>PINMAP needs access to your device orientation to rotate the compass dial.</div>
            <button 
              style={{background:"#2a5d3c",color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",fontSize:14,fontWeight:700,cursor:"pointer",width:"100%"}}
              onClick={initOrientation}
            >
              Allow Compass
            </button>
          </div>
        ) : (
          <div style={{position:"relative",width:280,height:280,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {/* Outer Brass Ring */}
            <div 
              style={{
                position:"absolute",
                width:280,
                height:280,
                borderRadius:"50%",
                border:"8px solid #b8a26c",
                boxShadow:"0 12px 32px rgba(0,0,0,0.15), inset 0 2px 8px rgba(255,255,255,0.5)",
                background:"transparent",
                boxSizing:"border-box",
                zIndex:2
              }}
            />

            {/* Rotating Dial Face */}
            <div 
              style={{
                position:"absolute",
                width:264,
                height:264,
                borderRadius:"50%",
                background:"#fdfcfa",
                border:"2px solid #d8cfb8",
                transform:`rotate(${-heading}deg)`,
                transition:"transform 0.15s cubic-bezier(0.1, 0.8, 0.25, 1)",
                boxSizing:"border-box",
                display:"flex",
                alignItems:"center",
                justifyContent:"center",
                zIndex:1
              }}
            >
              {/* Compass Card Marks */}
              <div style={{position:"absolute",top:8,fontWeight:900,color:"#c05050",fontSize:18}}>N</div>
              <div style={{position:"absolute",bottom:8,fontWeight:800,color:"#2a5d3c",fontSize:16}}>S</div>
              <div style={{position:"absolute",right:8,fontWeight:800,color:"#2a5d3c",fontSize:16}}>E</div>
              <div style={{position:"absolute",left:8,fontWeight:800,color:"#2a5d3c",fontSize:16}}>W</div>
              
              {/* Radial ticks */}
              {[...Array(12)].map(function(_, i) {
                return (
                  <div 
                    key={i} 
                    style={{
                      position:"absolute",
                      width:2,
                      height:10,
                      background:"#d8cfb8",
                      transform:`rotate(${i * 30}deg) translate(0, -118px)`
                    }} 
                  />
                );
              })}
            </div>

            {/* Needle pointing to Target Pin (Relative Angle) */}
            {userLoc && (
              <div 
                style={{
                  position:"absolute",
                  width:20,
                  height:220,
                  transform:`rotate(${relativeArrowAngle}deg)`,
                  transition:"transform 0.15s cubic-bezier(0.1, 0.8, 0.25, 1)",
                  zIndex:3,
                  pointerEvents:"none",
                  display:"flex",
                  flexDirection:"column",
                  alignItems:"center",
                  justifyContent:"flex-start"
                }}
              >
                {/* Arrowhead */}
                <div 
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: "10px solid transparent",
                    borderRight: "10px solid transparent",
                    borderBottom: "25px solid #2a5d3c",
                    filter: "drop-shadow(0 2px 4px rgba(42,93,60,0.35))"
                  }}
                />
                {/* Needle Line */}
                <div style={{width:4,height:95,background:"#2a5d3c"}} />
              </div>
            )}

            {/* Center Cap */}
            <div 
              style={{
                position:"absolute",
                width:20,
                height:20,
                borderRadius:"50%",
                background:"#b8a26c",
                border:"3px solid #fdfcfa",
                boxShadow:"0 2px 6px rgba(0,0,0,0.2)",
                zIndex:4
              }}
            />
          </div>
        )}
      </div>

      {/* Footer Navigation Metadata */}
      <div style={{width:"100%",display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
        {/* Navigation Stats */}
        <div style={{display:"flex",justifyContent:"space-around",width:"100%",textAlign:"center"}}>
          <div>
            <div style={{fontSize:11,textTransform:"uppercase",color:"#9a8f74",letterSpacing:"0.05em",marginBottom:4}}>Distance</div>
            <div style={{fontSize:28,fontWeight:900,color:"#1a201c"}}>
              {distance !== null ? (distance < 1 ? Math.round(distance * 1000) + " m" : distance.toFixed(2) + " km") : "Waiting..."}
            </div>
          </div>
          <div>
            <div style={{fontSize:11,textTransform:"uppercase",color:"#9a8f74",letterSpacing:"0.05em",marginBottom:4}}>Heading</div>
            <div style={{fontSize:28,fontWeight:900,color:"#1a201c"}}>
              {heading}° <span style={{fontSize:16,color:"#6f786f"}}>{heading >= 337.5 || heading < 22.5 ? "N" : heading >= 22.5 && heading < 67.5 ? "NE" : heading >= 67.5 && heading < 112.5 ? "E" : heading >= 112.5 && heading < 157.5 ? "SE" : heading >= 157.5 && heading < 202.5 ? "S" : heading >= 202.5 && heading < 247.5 ? "SW" : heading >= 247.5 && heading < 292.5 ? "W" : "NW"}</span>
            </div>
          </div>
        </div>

        {/* Tip banner */}
        <div style={{padding:"12px 16px",background:"rgba(42,93,60,0.06)",borderRadius:10,fontSize:12,color:"#2a5d3c",textAlign:"center",lineHeight:1.4,maxWidth:340,border:"1px solid rgba(42,93,60,0.1)"}}>
          💡 Keep your phone flat in front of you. The green arrow points directly to <b>{pin.name}</b>.
        </div>
      </div>
    </div>
  );
}
