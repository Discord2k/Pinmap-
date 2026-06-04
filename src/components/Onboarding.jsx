import React from 'react';
import { T, S } from '../utils/styles';
import { getOnboardSteps, getTutorialSteps } from '../utils/helpers';

export function Onboarding(props) {
  const lang = props.lang || 'en';
  const tutorial = props.tutorial || 'welcome';
  const step = props.step;
  const onNext = props.onNext || (() => {});
  const onSkip = props.onSkip || (() => {});

  const steps = getTutorialSteps(tutorial, lang);
  const info = steps[step] || { title: "", body: "", target: "welcome" };
  const total = steps.length;
  const isLast = step === total - 1;

  const [targetRect, setTargetRect] = React.useState(null);

  React.useEffect(() => {
    function updateRect() {
      const targetId = info.target;
      if (!targetId || targetId === 'welcome' || targetId === 'wrap-up') {
        setTargetRect(null);
        return;
      }

      if (targetId === 'map-center') {
        const width = 80;
        const height = 80;
        const left = window.innerWidth / 2 - width / 2;
        const top = window.innerHeight / 2 - height / 2;
        setTargetRect({ left, top, width, height });
        return;
      }

      const el = document.getElementById(targetId);
      if (el) {
        const r = el.getBoundingClientRect();
        setTargetRect({
          left: r.left,
          top: r.top,
          width: r.width,
          height: r.height
        });
      } else {
        setTargetRect(null);
      }
    }

    updateRect();
    
    // Add small delay to ensure elements have rendered and positions settled
    const timer = setTimeout(updateRect, 150);

    window.addEventListener('resize', updateRect);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRect);
    };
  }, [step, info.target]);

  // Determine card positioning and arrow direction
  const cardStyles = {
    position: "fixed",
    zIndex: 10002,
    background: T.paper,
    border: "1.5px solid " + T.border,
    borderRadius: 16,
    padding: "20px 20px 18px",
    boxShadow: T.shadowLg,
    width: "calc(100% - 32px)",
    maxWidth: 340,
    boxSizing: "border-box",
    transition: "all 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)",
    display: "flex",
    flexDirection: "column",
  };

  let arrowDirection = null;

  if (!targetRect) {
    // Center of screen
    cardStyles.left = "50%";
    cardStyles.top = "50%";
    cardStyles.transform = "translate(-50%, -50%)";
  } else if (info.target === 'map-center') {
    // Upper part of map
    cardStyles.left = "50%";
    cardStyles.top = "22%";
    cardStyles.transform = "translateX(-50%)";
  } else if (info.target.startsWith('btn-tab-')) {
    // Above bottom tab
    cardStyles.left = "50%";
    cardStyles.bottom = window.innerHeight - targetRect.top + 14;
    cardStyles.transform = "translateX(-50%)";
    arrowDirection = "down";
  } else if (info.target === 'btn-trail-quest' || info.target === 'btn-pin-layer-toggle' || info.target === 'btn-3d-toggle') {
    if (window.innerWidth < 480) {
      // Center card on mobile and place it below the target button
      cardStyles.left = "50%";
      cardStyles.top = targetRect.top + targetRect.height + 14;
      cardStyles.transform = "translateX(-50%)";
      arrowDirection = "up";
    } else {
      // Left of trails button
      cardStyles.right = window.innerWidth - targetRect.left + 14;
      cardStyles.top = targetRect.top + targetRect.height / 2;
      cardStyles.transform = "translateY(-50%)";
      arrowDirection = "right";
    }
  }

  // Spotlight helper
  const spotlightStyles = targetRect ? {
    position: "fixed",
    left: targetRect.left - 4,
    top: targetRect.top - 4,
    width: targetRect.width + 8,
    height: targetRect.height + 8,
    borderRadius: info.target === 'map-center' ? "50%" : 10,
    boxShadow: "0 0 0 9999px rgba(18, 22, 19, 0.65)",
    border: "2px solid " + T.forest,
    pointerEvents: "none",
    zIndex: 10001,
    transition: "all 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)"
  } : null;

  // Welcome Step (Step 0)
  if (tutorial === 'welcome' && step === 0) {
    return (
      <div style={{position:"fixed", inset:0, zIndex:10000, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(18,22,19,0.72)", padding:20, overflowY:"auto"}}>
        <div style={{position:"relative", background:T.paper, borderRadius:24, boxShadow:T.shadowLg, padding:"32px 28px", maxWidth:480, width:"100%", boxSizing:"border-box", display:"flex", flexDirection:"column", gap:20, animation:"scaleIn 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)"}}>
          {/* Logo / Header */}
          <div style={{display:"flex", alignItems:"center", gap:10, justifyContent:"center", borderBottom:"1.5px solid "+T.borderSoft, paddingBottom:16}}>
            <svg width={26} height={32} viewBox="0 0 28 36">
              <path d="M14 0 C 6.27 0 0 6.27 0 14 c 0 9.5 14 22 14 22 s 14 -12.5 14 -22 C 28 6.27 21.73 0 14 0 z" fill={T.forest} />
              <circle cx="14" cy="14" r="5" fill={T.paper} />
            </svg>
            <div>
              <div style={{fontSize:20, fontWeight:900, color:T.forest, letterSpacing:2.5, fontFamily:T.font}}>PINMAP</div>
              <div style={{fontSize:9.5, color:T.ink3, fontFamily:T.mono, letterSpacing:0.5}}>THE SOCIAL MAP</div>
            </div>
          </div>

          {/* Description */}
          <div style={{textAlign:"center", margin:"4px 0"}}>
            <div style={{fontSize:22, fontWeight:800, color:T.ink, marginBottom:8}}>{lang === 'es' ? "¡Bienvenido a PINMAP!" : "Welcome to PINMAP!"}</div>
            <div style={{fontSize:14.5, color:T.ink2, lineHeight:1.6}}>
              {lang === 'es' 
                ? "Una plataforma cartográfica que prioriza la privacidad para guardar, organizar y compartir lugares. Te mostraremos cómo funciona."
                : "A privacy-first mapping platform for saving, organizing, and sharing the places that matter. Let's show you around."}
            </div>
          </div>

          {/* Features list */}
          <div style={{display:"flex", flexDirection:"column", gap:12, background:T.paper2, border:"1px solid "+T.borderSoft, borderRadius:16, padding:"16px 18px"}}>
            {[
              { emoji: "🏷️", title: lang === 'es' ? "Descubrimiento por Hashtags" : "Hashtag Discovery", desc: lang === 'es' ? "Organiza y busca pines globales mediante #etiquetas." : "Organize and search pins globally using #hashtags." },
              { emoji: "🕵️", title: lang === 'es' ? "Controles de Privacidad" : "Privacy Controls", desc: lang === 'es' ? "Elige pines Públicos, Privados o Insider (ocultos)." : "Keep pins Public, Private, or Insider (hidden)." },
              { emoji: "🥾", title: lang === 'es' ? "Rutas y Desafíos" : "Trails & Quests", desc: lang === 'es' ? "Graba trayectos GPX en tiempo real y completa búsquedas." : "Record GPX paths in real-time and join location quests." },
              { emoji: "📡", title: lang === 'es' ? "Primero sin Conexión" : "Offline-First Support", desc: lang === 'es' ? "Usa mapas sin cobertura, con caché y sincronización en cola." : "Map off-grid with cached tiles and queued offline sync." }
            ].map((feat, idx) => (
              <div key={idx} style={{display:"flex", alignItems:"flex-start", gap:12}}>
                <span style={{fontSize:18, marginTop:2, flexShrink:0}}>{feat.emoji}</span>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:13.5, fontWeight:700, color:T.ink, lineHeight:1.2, marginBottom:2}}>{feat.title}</div>
                  <div style={{fontSize:12, color:T.ink3, lineHeight:1.4}}>{feat.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{display:"flex", gap:10, marginTop:8}}>
            <button 
              style={Object.assign({}, S.btnOutline, {flex:1, padding:"13px"})} 
              onClick={onSkip}
            >
              {lang === 'es' ? "Saltar" : "Skip"}
            </button>
            <button 
              style={Object.assign({}, S.btn, {flex:2, padding:"13px"})} 
              onClick={onNext}
            >
              {lang === 'es' ? "Iniciar Recorrido" : "Start Tour"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Interactive Tour Steps (Steps 1 to 5)
  return (
    <div style={{position:"fixed", inset:0, zIndex:10000, pointerEvents:"auto"}}>
      {/* Dark Backdrop Overlay */}
      {!targetRect && (
        <div style={{position:"absolute", inset:0, background:"rgba(18,22,19,0.65)", zIndex:10000}} onClick={onSkip} />
      )}
      
      {/* Spotlight for highlighted element */}
      {spotlightStyles && <div style={spotlightStyles} />}

      {/* Invisible backdrop for blocking clicks and clicking skip */}
      {targetRect && (
        <div 
          style={{position:"absolute", inset:0, zIndex:10000, pointerEvents:"auto", background:"transparent"}} 
          onClick={onSkip} 
        />
      )}

      {/* Floating Card */}
      <div style={cardStyles}>
        {arrowDirection && (
          <div style={{
            position: "absolute",
            width: 0,
            height: 0,
            borderStyle: "solid",
            ...(arrowDirection === "down" ? {
              bottom: -10,
              left: "50%",
              transform: "translateX(-50%)",
              borderWidth: "10px 10px 0 10px",
              borderColor: T.border + " transparent transparent transparent"
            } : {}),
            ...(arrowDirection === "right" ? {
              right: -10,
              top: "50%",
              transform: "translateY(-50%)",
              borderWidth: "10px 0 10px 10px",
              borderColor: "transparent transparent transparent " + T.border
            } : {}),
            ...(arrowDirection === "up" ? {
              top: -10,
              right: 24,
              borderWidth: "0 10px 10px 10px",
              borderColor: "transparent transparent " + T.border + " transparent"
            } : {})
          }} />
        )}
        
        {arrowDirection && (
          <div style={{
            position: "absolute",
            width: 0,
            height: 0,
            borderStyle: "solid",
            zIndex: 1,
            ...(arrowDirection === "down" ? {
              bottom: -8,
              left: "50%",
              transform: "translateX(-50%)",
              borderWidth: "9px 9px 0 9px",
              borderColor: T.paper + " transparent transparent transparent"
            } : {}),
            ...(arrowDirection === "right" ? {
              right: -8,
              top: "50%",
              transform: "translateY(-50%)",
              borderWidth: "9px 0 9px 9px",
              borderColor: "transparent transparent transparent " + T.paper
            } : {}),
            ...(arrowDirection === "up" ? {
              top: -8,
              right: 25,
              borderWidth: "0 9px 9px 9px",
              borderColor: "transparent transparent " + T.paper + " transparent"
            } : {})
          }} />
        )}

        {/* Step Content */}
        <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:10}}>
          <span style={{fontSize:18}}>
            {info.target === 'btn-tab-search' && "🔍"}
            {info.target === 'btn-tab-add' && "➕"}
            {info.target === 'form-pin-name' && "✏️"}
            {info.target === 'form-pin-desc' && "📝"}
            {info.target === 'form-pin-tags' && "🏷️"}
            {info.target === 'form-pin-icon' && "🎨"}
            {info.target === 'form-photo-upload' && "📷"}
            {info.target === 'map-center' && "📍"}
            {info.target === 'btn-pin-layer-toggle' && "👥"}
            {info.target === 'btn-3d-toggle' && "🏔"}
            {info.target === 'btn-trail-quest' && "🥾"}
            {info.target === 'btn-tab-profile' && "🏆"}
            {info.target === 'wrap-up' && "🎉"}
          </span>
          <div style={{fontSize:15, fontWeight:800, color:T.forest}}>{info.title}</div>
        </div>

        <div style={{fontSize:13, color:T.ink2, lineHeight:1.6, marginBottom:16}}>
          {info.body}
        </div>

        {/* Step dots & buttons */}
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginTop:"auto"}}>
          {/* Progress indicators */}
          <div style={{display:"flex", gap:4}}>
            {(tutorial === 'welcome' ? steps.slice(1) : steps).map((_, i) => {
              const active = tutorial === 'welcome' ? (i + 1 === step) : (i === step);
              return (
                <div 
                  key={i} 
                  style={{
                    width: active ? 12 : 5, 
                    height: 5, 
                    borderRadius: 3, 
                    background: active ? T.forest : T.border,
                    transition: "width 0.2s"
                  }} 
                />
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div style={{display:"flex", gap:6}}>
            <button 
              onClick={onSkip} 
              style={{
                background: "none", 
                border: "none", 
                color: T.ink3, 
                fontSize: 12.5, 
                fontWeight: 500, 
                cursor: "pointer", 
                padding: "6px 8px"
              }}
            >
              {lang === 'es' ? "Saltar" : "Skip"}
            </button>
            <button 
              onClick={onNext} 
              style={Object.assign({}, S.miniBtn, {
                background: T.forest, 
                color: T.paper, 
                border: "none", 
                fontWeight: 700, 
                padding: "6px 14px"
              })}
            >
              {isLast ? (lang === 'es' ? "Terminar" : "Done") : (lang === 'es' ? "Siguiente" : "Next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
