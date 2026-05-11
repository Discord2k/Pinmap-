import React from 'react';
import { ONBOARD_STEPS } from '../utils/helpers';

export function Onboarding(props) {
  var step = props.step;
  var info = ONBOARD_STEPS[step];
  var total = ONBOARD_STEPS.length;
  var isLast = step === total-1;

  return (
    <div style={{position:"fixed",inset:0,zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.55)"}} onClick={props.onNext}></div>
      <div className="onb-card" style={{position:"relative",background:"#f6f1e4",border:"none",borderRadius:20,boxShadow:"0 12px 48px rgba(0,0,0,0.18)",animation:"scaleIn 0.25s cubic-bezier(0.34,1.2,0.64,1) both",padding:"28px 24px",maxWidth:320,width:"100%",zIndex:9001}}>
        <div style={{display:"flex",gap:5,marginBottom:20,justifyContent:"center"}}>
          {ONBOARD_STEPS.map(function(_,i){
            return <div key={i} style={{width:i===step?24:7,height:7,borderRadius:4,background:i===step?"#2a5d3c":"#d8cfb8",transition:"width 0.2s"}}></div>;
          })}
        </div>
        <div style={{fontSize:18,fontWeight:700,color:"#1a201c",marginBottom:10,textAlign:"center"}}>{info.title}</div>
        <div style={{fontSize:14,color:"#5a4a30",lineHeight:1.75,textAlign:"center",marginBottom:24}}>{info.body}</div>
        <div style={{fontSize:14,color:"#9a8f74",textAlign:"center",marginBottom:16}}>
          {(step+1)+" of "+total}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button style={{flex:1,padding:"11px",background:"none",border:"1px solid #d8cfb8",borderRadius:8,fontSize:14,color:"#6f786f",cursor:"pointer"}} onClick={props.onSkip}>Skip</button>
          <button style={{flex:2,padding:"11px",background:"#2a5d3c",border:"none",borderRadius:8,fontSize:14,color:"#fff",fontWeight:700,cursor:"pointer"}} onClick={props.onNext}>{isLast?"Get Started!":"Next"}</button>
        </div>
      </div>
    </div>
  );
}
