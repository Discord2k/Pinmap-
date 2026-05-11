import React from 'react';
import { WHATSNEW } from '../utils/helpers';

export function WhatsNew(props) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#f6f1e4",border:"none",animation:"slideUp 0.32s cubic-bezier(0.34,1.1,0.64,1) both",borderRadius:16,padding:"24px 22px",maxWidth:420,width:"100%",boxShadow:"0 8px 40px rgba(0,0,0,0.28)",maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div>
            <div style={{fontSize:18,fontWeight:700,color:"#2a5d3c"}}>What's New</div>
            <div style={{fontSize:12,color:"#6f786f"}}>Latest updates to PINMAP</div>
          </div>
          <button style={{background:"none",border:"none",fontSize:22,color:"#6f786f",cursor:"pointer"}} onClick={props.onDismiss}>x</button>
        </div>
        <div style={{overflowY:"auto",flex:1,marginBottom:16}}>
          {WHATSNEW.map(function(item,i){
            return (
              <div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:i<WHATSNEW.length-1?"1px solid #e8dcc4":"none"}}>
                <div style={{fontSize:24,flexShrink:0,width:32,textAlign:"center"}}>{item.emoji}</div>
                <div>
                  <div style={{fontWeight:700,fontSize:14,color:"#1a201c",marginBottom:2}}>{item.title}</div>
                  <div style={{fontSize:12,color:"#3c4540",lineHeight:1.6}}>{item.body}</div>
                </div>
              </div>
            );
          })}
        </div>
        <button 
          style={{width:"100%",padding:"12px",background:"#2a5d3c",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}
          onClick={props.onDismiss}
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
