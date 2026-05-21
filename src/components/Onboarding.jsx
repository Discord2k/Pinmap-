import React from 'react';
import { getOnboardSteps } from '../utils/helpers';

export function Onboarding(props) {
  var lang = props.lang || 'en';
  var t = props.t || function(key, p) {
    if(key === 'onboarding_progress') return (p ? p.step : '') + ' of ' + (p ? p.total : '');
    if(key === 'skip') return 'Skip';
    if(key === 'next') return 'Next';
    if(key === 'get_started') return 'Get Started!';
    return key;
  };
  var steps = getOnboardSteps(lang);
  var step = props.step;
  var info = steps[step];
  var total = steps.length;
  var isLast = step === total-1;

  return (
    <div style={{position:"fixed",inset:0,zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.55)"}} onClick={props.onNext}></div>
      <div className="onb-card" style={{position:"relative",background:"#f6f1e4",border:"none",borderRadius:20,boxShadow:"0 12px 48px rgba(0,0,0,0.18)",animation:"scaleIn 0.25s cubic-bezier(0.34,1.2,0.64,1) both",padding:"28px 24px",maxWidth:320,width:"100%",zIndex:9001}}>
        <div style={{display:"flex",gap:5,marginBottom:20,justifyContent:"center"}}>
          {steps.map(function(_,i){
            return <div key={i} style={{width:i===step?24:7,height:7,borderRadius:4,background:i===step?"#2a5d3c":"#d8cfb8",transition:"width 0.2s"}}></div>;
          })}
        </div>
        <div style={{fontSize:18,fontWeight:700,color:"#1a201c",marginBottom:10,textAlign:"center"}}>{info.title}</div>
        <div style={{fontSize:14,color:"#5a4a30",lineHeight:1.75,textAlign:"center",marginBottom:24}}>{info.body}</div>
        <div style={{fontSize:14,color:"#9a8f74",textAlign:"center",marginBottom:16}}>
          {t('onboarding_progress', {step: step+1, total: total})}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button style={{flex:1,padding:"11px",background:"none",border:"1px solid #d8cfb8",borderRadius:8,fontSize:14,color:"#6f786f",cursor:"pointer"}} onClick={props.onSkip}>{t('skip')}</button>
          <button style={{flex:2,padding:"11px",background:"#2a5d3c",border:"none",borderRadius:8,fontSize:14,color:"#fff",fontWeight:700,cursor:"pointer"}} onClick={props.onNext}>{isLast?t('get_started'):t('next')}</button>
        </div>
      </div>
    </div>
  );
}
