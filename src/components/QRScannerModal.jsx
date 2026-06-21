import React, { useEffect, useRef, useState } from 'react';

export function QRScannerModal({ isOpen, onClose, onScanSuccess, lang = 'en' }) {
  const [hasCamera, setHasCamera] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameId = useRef(null);

  const t = {
    en: {
      title: "Scan QR Code",
      close: "Close",
      denied: "Camera permission denied or unavailable. You can upload an image instead.",
      upload: "Upload QR Code Image",
      scanning: "Align QR code inside the frame to scan...",
      processing: "Processing...",
      success: "QR Code scanned successfully!",
    },
    es: {
      title: "Escanear Código QR",
      close: "Cerrar",
      denied: "Permiso de cámara denegado o no disponible. Puedes subir una imagen en su lugar.",
      upload: "Subir imagen de Código QR",
      scanning: "Alinea el código QR dentro del marco para escanear...",
      processing: "Procesando...",
      success: "¡Código QR escaneado con éxito!",
    }
  }[lang] || {
    title: "Scan QR Code",
    close: "Close",
    denied: "Camera permission denied or unavailable. You can upload an image instead.",
    upload: "Upload QR Code Image",
    scanning: "Align QR code inside the frame to scan...",
    processing: "Processing...",
    success: "QR Code scanned successfully!",
  };

  // Load jsQR library from CDN dynamically
  useEffect(() => {
    if (window.jsQR) return;
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Handle opening and starting camera
  useEffect(() => {
    if (!isOpen) return;
    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  async function startCamera() {
    setErrorMsg("");
    setHasCamera(true);
    setIsScanning(true);

    try {
      const constraints = {
        video: { facingMode: "environment" } // Prefer back camera
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true"); // Required for iOS
        videoRef.current.play();
        animationFrameId.current = requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      setHasCamera(false);
      setIsScanning(false);
      setErrorMsg(t.denied);
    }
  }

  function stopCamera() {
    setIsScanning(false);
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }

  function tick() {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameId.current = requestAnimationFrame(tick);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    
    // Set canvas dimensions to match video stream
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    if (window.jsQR) {
      const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      
      if (code) {
        stopCamera();
        onScanSuccess(code.data);
        return;
      }
    }

    if (isScanning) {
      animationFrameId.current = requestAnimationFrame(tick);
    }
  }

  // File Upload Fallback Logic
  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        if (window.jsQR) {
          const code = window.jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            onScanSuccess(code.data);
          } else {
            setErrorMsg(lang === 'es' ? "No se detectó un código QR válido en la imagen." : "No valid QR code detected in the image.");
          }
        } else {
          setErrorMsg("QR decoder library not loaded. Please try again.");
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.85)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '480px',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid #eee',
          background: '#f8f9fa'
        }}>
          <h3 style={{ margin: 0, color: '#333', fontSize: '18px', fontWeight: 'bold' }}>{t.title}</h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#999',
              padding: '0 5px'
            }}
          >&times;</button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {hasCamera ? (
            <div style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4/3',
              background: '#000',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
            }}>
              <video 
                ref={videoRef}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              
              {/* Overlay targeting box */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '180px',
                height: '180px',
                border: '4px solid #2979ff',
                borderRadius: '16px',
                boxShadow: '0 0 0 4000px rgba(0,0,0,0.5)',
                pointerEvents: 'none'
              }}>
                {/* Scanning green line animation */}
                <div style={{
                  width: '100%',
                  height: '3px',
                  background: '#00e676',
                  boxShadow: '0 0 8px #00e676',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  animation: 'qr-scan-line 2s linear infinite'
                }} />
              </div>
            </div>
          ) : (
            <div style={{
              width: '100%',
              padding: '30px 20px',
              textAlign: 'center',
              border: '2px dashed #ccc',
              borderRadius: '12px',
              background: '#fdfdfd',
              marginBottom: '15px'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>📷</div>
              <p style={{ color: '#666', fontSize: '14px', margin: '0 0 15px 0' }}>{errorMsg}</p>
              
              <label style={{
                display: 'inline-block',
                background: '#2979ff',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(41,121,255,0.3)',
                transition: 'background 0.2s'
              }}>
                {t.upload}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  style={{ display: 'none' }} 
                />
              </label>
            </div>
          )}

          {hasCamera && (
            <p style={{ margin: '15px 0 0 0', color: '#666', fontSize: '13px', textAlign: 'center' }}>
              {t.scanning}
            </p>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #eee',
          background: '#f8f9fa',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
          {hasCamera && (
            <label style={{
              background: '#f1f3f4',
              color: '#333',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              border: '1px solid #dadce0'
            }}>
              {lang === 'es' ? "Subir Foto" : "Upload Photo"}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
              />
            </label>
          )}
          <button 
            onClick={onClose}
            style={{
              background: '#fff',
              color: '#333',
              border: '1px solid #ccc',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {t.close}
          </button>
        </div>
      </div>
      
      {/* Dynamic Keyframes Animation Injection */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes qr-scan-line {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}} />
    </div>
  );
}
