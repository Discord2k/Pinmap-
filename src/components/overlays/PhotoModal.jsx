import React, { useState, useRef } from 'react';

export function PhotoModal(props) {
  const { fullscreenPhoto, setFullscreenPhoto } = props;

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const scaleRef = useRef(1);
  const positionRef = useRef({ x: 0, y: 0 });
  const touchStartRef = useRef({ x: 0, y: 0, scale: 1 });
  const touchStartDistRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastTapRef = useRef(0);

  const updateScaleAndPosition = (newScale, newPos) => {
    scaleRef.current = newScale;
    positionRef.current = newPos;
    setScale(newScale);
    setPosition(newPos);
  };

  const handleTouchStart = (ev) => {
    if (ev.touches.length === 1) {
      isDraggingRef.current = true;
      touchStartRef.current = {
        x: ev.touches[0].clientX - positionRef.current.x,
        y: ev.touches[0].clientY - positionRef.current.y
      };
    } else if (ev.touches.length === 2) {
      isDraggingRef.current = false;
      const dist = Math.hypot(
        ev.touches[0].clientX - ev.touches[1].clientX,
        ev.touches[0].clientY - ev.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartRef.current.scale = scaleRef.current;
    }
  };

  const handleTouchMove = (ev) => {
    if (ev.touches.length === 1 && isDraggingRef.current && scaleRef.current > 1) {
      const x = ev.touches[0].clientX - touchStartRef.current.x;
      const y = ev.touches[0].clientY - touchStartRef.current.y;
      updateScaleAndPosition(scaleRef.current, { x, y });
    } else if (ev.touches.length === 2) {
      const dist = Math.hypot(
        ev.touches[0].clientX - ev.touches[1].clientX,
        ev.touches[0].clientY - ev.touches[1].clientY
      );
      const factor = dist / touchStartDistRef.current;
      const nextScale = Math.min(Math.max(touchStartRef.current.scale * factor, 1), 5);
      const nextPos = nextScale <= 1 ? { x: 0, y: 0 } : positionRef.current;
      updateScaleAndPosition(nextScale, nextPos);
    }
  };

  const handleTouchEnd = (ev) => {
    if (ev.touches.length === 0) {
      isDraggingRef.current = false;
      if (scaleRef.current <= 1) {
        updateScaleAndPosition(1, { x: 0, y: 0 });
      }
    } else if (ev.touches.length === 1) {
      isDraggingRef.current = true;
      touchStartRef.current = {
        x: ev.touches[0].clientX - positionRef.current.x,
        y: ev.touches[0].clientY - positionRef.current.y
      };
    }
  };

  const handleMouseDown = (ev) => {
    if (scaleRef.current > 1) {
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: ev.clientX - positionRef.current.x,
        y: ev.clientY - positionRef.current.y
      };
    }
  };

  const handleMouseMove = (ev) => {
    if (isDraggingRef.current && scaleRef.current > 1) {
      const x = ev.clientX - dragStartRef.current.x;
      const y = ev.clientY - dragStartRef.current.y;
      updateScaleAndPosition(scaleRef.current, { x, y });
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (ev) => {
    const zoomFactor = 0.15;
    const direction = ev.deltaY < 0 ? 1 : -1;
    const nextScale = Math.min(Math.max(scaleRef.current + direction * zoomFactor, 1), 5);
    const nextPos = nextScale <= 1 ? { x: 0, y: 0 } : positionRef.current;
    updateScaleAndPosition(nextScale, nextPos);
  };

  const handleDoubleClick = (ev) => {
    ev.stopPropagation();
    if (scaleRef.current > 1) {
      updateScaleAndPosition(1, { x: 0, y: 0 });
    } else {
      const rect = ev.currentTarget.getBoundingClientRect();
      const clickX = ev.clientX - rect.left - rect.width / 2;
      const clickY = ev.clientY - rect.top - rect.height / 2;
      updateScaleAndPosition(2.5, { x: -clickX * 1.5, y: -clickY * 1.5 });
    }
  };

  // Support single tap / click to dismiss if we are not zoomed in
  const handleOverlayClick = (ev) => {
    if (scaleRef.current <= 1) {
      setFullscreenPhoto(null);
    }
  };

  const handleDownload = async (ev) => {
    ev.stopPropagation();
    if (!fullscreenPhoto) return;

    try {
      if (fullscreenPhoto.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = fullscreenPhoto;
        link.download = 'pin_photo.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      const res = await fetch(fullscreenPhoto);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'pin_photo.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(fullscreenPhoto, '_blank');
    }
  };

  return React.createElement("div", {
    style: {
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(10, 15, 12, 0.95)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      zIndex: 3000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden"
    },
    onClick: handleOverlayClick
  },
    // Toolbar controls
    React.createElement("div", {
      style: {
        position: "absolute",
        top: 16,
        left: 16,
        right: 16,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 3100,
        pointerEvents: "none"
      }
    },
      React.createElement("div", { style: { display: "flex", gap: 10, pointerEvents: "auto" } },
        React.createElement("button", {
          style: {
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            color: "#fff",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: 8,
            padding: "8px 16px",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          },
          onClick: handleDownload
        }, "💾 Save"),
        scale > 1 && React.createElement("button", {
          style: {
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            color: "#fff",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: "600",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          },
          onClick: () => updateScaleAndPosition(1, { x: 0, y: 0 })
        }, "🔍 Reset Zoom")
      ),
      React.createElement("button", {
        style: {
          background: "rgba(255, 255, 255, 0.2)",
          color: "#fff",
          border: "none",
          borderRadius: "50%",
          width: 36,
          height: 36,
          cursor: "pointer",
          fontWeight: "bold",
          fontSize: 18,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "auto"
        },
        onClick: () => setFullscreenPhoto(null)
      }, "✕")
    ),

    // Image container and image
    React.createElement("div", {
      style: {
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        touchAction: "none"
      },
      onClick: (e) => e.stopPropagation(),
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onWheel: handleWheel
    },
      React.createElement("img", {
        src: fullscreenPhoto,
        alt: "Pin Photo Full View",
        onDoubleClick: handleDoubleClick,
        style: {
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDraggingRef.current ? "none" : "transform 0.15s ease-out",
          userSelect: "none",
          WebkitUserDrag: "none",
          cursor: scale > 1 ? "grab" : "zoom-in"
        }
      })
    )
  );
}
