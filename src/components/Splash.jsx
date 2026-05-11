import React from 'react';
import { formatLL } from '../utils/helpers';

export function Splash(props) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,overflow:"hidden",fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,system-ui,sans-serif",background:"#f6f1e4"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"url(https://tile.openstreetmap.org/5/8/13.png)",backgroundSize:"cover",backgroundPosition:"center",filter:"blur(3px) brightness(0.35) saturate(0.4) sepia(0.2)",transform:"scale(1.05)"}}></div>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(160deg,rgba(31,74,48,0.85) 0%,rgba(26,32,28,0.92) 100%)"}}></div>
      <div style={{position:"relative",display:"flex",flexDirection:"column",height:"100%",padding:"0 28px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:"calc(52px + env(safe-area-inset-top,0px))"}}>
          <div style={{fontSize:10.5,letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600,color:"rgba(246,241,228,0.5)",fontFamily:"'JetBrains Mono',monospace"}}>EDITION 01 · 2026</div>
          <div style={{fontSize:10.5,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:600,color:"rgba(246,241,228,0.5)",fontFamily:"'JetBrains Mono',monospace"}}>{formatLL(28.54, -81.38, 2)}</div>
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center"}}>
          <div style={{marginBottom:20}}>
            <svg width={32} height={41} viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 0 C 6.27 0 0 6.27 0 14 c 0 9.5 14 22 14 22 s 14 -12.5 14 -22 C 28 6.27 21.73 0 14 0 z" fill="#f6f1e4"></path>
              <circle cx="14" cy="14" r="5" fill="#2a5d3c"></circle>
            </svg>
          </div>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.22em",color:"rgba(221,230,220,0.9)",marginBottom:14,textTransform:"uppercase"}}>A Field Atlas</div>
          <div style={{fontSize:38,lineHeight:1.05,fontWeight:700,letterSpacing:"-0.02em",color:"#f6f1e4",marginBottom:16}}>
            The map of the places <em style={{fontStyle:"italic",fontWeight:600,color:"#dde6dc"}}>that matter</em> to you.
          </div>
          <div style={{fontSize:15,lineHeight:1.6,color:"rgba(246,241,228,0.7)",maxWidth:320,marginBottom:36}}>
            Drop pins, add hashtags, and share your favourite spots. Discover locations shared by others.
          </div>
        </div>
        <div style={{paddingBottom:"calc(40px + env(safe-area-inset-bottom,0px))"}}>
          {props.loading ? (
            <div style={{textAlign:"center",color:"rgba(246,241,228,0.5)",fontSize:13,letterSpacing:"0.1em"}}>Loading...</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <button 
                style={{width:"100%",padding:"15px 18px",borderRadius:12,background:"#f6f1e4",color:"#1a201c",border:"none",fontSize:15,fontWeight:600,letterSpacing:"0.01em",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}
                onClick={props.onGoogle}
              >
                <svg width={16} height={16} viewBox="0 0 48 48">
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.16C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.16C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.16C12.43 13.72 17.74 9.5 24 9.5z"></path>
                </svg>
                Continue with Google
              </button>
              <button 
                style={{width:"100%",padding:"13px 18px",borderRadius:12,background:"transparent",color:"rgba(246,241,228,0.7)",border:"1px solid rgba(246,241,228,0.2)",fontSize:14,fontWeight:500}}
                onClick={props.onGuest}
              >
                Browse as guest
              </button>
            </div>
          )}
          <div style={{textAlign:"center",marginTop:20,fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:500,color:"rgba(246,241,228,0.3)",fontFamily:"'JetBrains Mono',monospace"}}>© 2026 Seth Gray · pin-map.com</div>
        </div>
      </div>
    </div>
  );
}
