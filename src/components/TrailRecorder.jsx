import React from 'react';
import { T, S } from '../utils/styles';
import { COLORS } from '../utils/helpers';

export function TrailRecorder(props) {
  var isRecording = props.isRecording;
  var distanceKm = props.distanceKm || 0;
  var durationSec = props.durationSec || 0;
  var onStart = props.onStart;
  var onPause = props.onPause;
  var onResume = props.onResume;
  var onSave = props.onSave;
  var onCancel = props.onCancel;
  var isPaused = props.isPaused;

  var [showSaveDialog, setShowSaveDialog] = React.useState(false);
  var [name, setName] = React.useState("");
  var [desc, setDesc] = React.useState("");
  var [color, setColor] = React.useState(COLORS[0] || "#2a5d3c");
  var [isPublic, setIsPublic] = React.useState(true);

  // Format seconds to HH:MM:SS or MM:SS
  var formatTime = function(totalSecs) {
    var h = Math.floor(totalSecs / 3600);
    var m = Math.floor((totalSecs % 3600) / 60);
    var s = totalSecs % 60;
    var pad = function(val) { return val < 10 ? "0" + val : val; };
    if (h > 0) {
      return pad(h) + ":" + pad(m) + ":" + pad(s);
    }
    return pad(m) + ":" + pad(s);
  };

  var handleSaveClick = function() {
    // Generate default name if empty
    var defaultName = "Trail Log " + new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    setName(defaultName);
    setShowSaveDialog(true);
  };

  var handleConfirmSave = function(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: desc.trim(),
      color: color,
      is_public: isPublic
    });
    setShowSaveDialog(false);
    setDesc("");
  };

  return (
    <div style={{
      position: "absolute",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 1000,
      width: "90%",
      maxWidth: 380,
      background: "rgba(246,241,228,0.96)",
      backdropFilter: "blur(16px)",
      border: "1px solid " + T.border,
      borderRadius: 20,
      padding: "16px 20px",
      boxShadow: T.shadowLg,
      fontFamily: T.font,
      boxSizing: "border-box"
    }}>
      {/* Metrics Section */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontSize: 10, fontFamily: T.mono, textTransform: "uppercase", color: T.ink3, letterSpacing: "0.1em" }}>Duration</div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: T.mono, color: T.ink }}>{formatTime(durationSec)}</div>
        </div>
        <div style={{ flex: 1, textAlign: "right" }}>
          <div style={{ fontSize: 10, fontFamily: T.mono, textTransform: "uppercase", color: T.ink3, letterSpacing: "0.1em" }}>Distance</div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: T.mono, color: T.ink }}>{distanceKm.toFixed(2)} <span style={{ fontSize: 14, fontWeight: 500, color: T.ink2 }}>km</span></div>
        </div>
      </div>

      {/* Controls Section */}
      <div style={{ display: "flex", gap: 10 }}>
        {!isRecording ? (
          <button 
            style={Object.assign({}, S.btn, { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 })} 
            onClick={onStart}
          >
            <span>⏺️</span> Start Recording
          </button>
        ) : (
          <>
            <button 
              style={Object.assign({}, S.btnOutline, { flex: 1, background: T.paper, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 })} 
              onClick={onCancel}
            >
              Cancel
            </button>
            {isPaused ? (
              <button 
                style={Object.assign({}, S.btn, { flex: 1, background: T.forest, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 })} 
                onClick={onResume}
              >
                <span>▶️</span> Resume
              </button>
            ) : (
              <button 
                style={Object.assign({}, S.btnOutline, { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 })} 
                onClick={onPause}
              >
                <span>⏸️</span> Pause
              </button>
            )}
            <button 
              style={Object.assign({}, S.btn, { flex: 1, background: T.forest, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 })} 
              onClick={handleSaveClick}
            >
              <span>💾</span> Save
            </button>
          </>
        )}
      </div>

      {/* Save Details Modal */}
      {showSaveDialog && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          top: 0,
          backgroundColor: "rgba(26,32,28,0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1100,
          padding: 16
        }}>
          <div style={{
            background: T.paper,
            border: "1px solid " + T.border,
            borderRadius: 18,
            width: "100%",
            maxWidth: 400,
            padding: 20,
            boxShadow: T.shadowLg,
            animation: "slideUp 0.25s ease-out",
            boxSizing: "border-box"
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 14, color: T.ink, fontFamily: T.font, fontSize: 18 }}>Save Recorded Trail</h3>
            
            <form onSubmit={handleConfirmSave}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontFamily: T.mono, color: T.ink3, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Trail Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={function(e) { setName(e.target.value); }} 
                  placeholder="e.g. Skyline Hiking Loop"
                  required 
                  style={S.input} 
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontFamily: T.mono, color: T.ink3, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Description</label>
                <textarea 
                  value={desc} 
                  onChange={function(e) { setDesc(e.target.value); }} 
                  placeholder="Add notes about trail conditions, terrain, or viewpoints..."
                  rows={3} 
                  style={S.textarea} 
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontFamily: T.mono, color: T.ink3, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Trail Line Color</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {COLORS.map(function(c) {
                    var isSelected = color === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={function() { setColor(c); }}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          backgroundColor: c,
                          border: isSelected ? "3px solid " + T.ink : "1px solid rgba(0,0,0,0.15)",
                          transform: isSelected ? "scale(1.15)" : "none",
                          cursor: "pointer",
                          transition: "all 0.1s ease"
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                <input 
                  type="checkbox" 
                  id="trail_public_check"
                  checked={isPublic} 
                  onChange={function(e) { setIsPublic(e.target.checked); }}
                  style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                <label htmlFor="trail_public_check" style={{ fontSize: 13.5, color: T.ink2, cursor: "pointer", userSelect: "none" }}>
                  Publish Trail publicly for other explorers
                </label>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button 
                  type="button" 
                  style={Object.assign({}, S.btnOutline, { flex: 1 })} 
                  onClick={function() { setShowSaveDialog(false); }}
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  style={Object.assign({}, S.btn, { flex: 2 })}
                >
                  Confirm & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
