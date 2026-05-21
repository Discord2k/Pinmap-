import React from 'react';
import { tagColor, getPinIcon } from '../utils/helpers';

export function PinCard(props) {
  var pin = props.pin, uname = props.uname;
  var isOwner = uname && pin.owner === uname;
  var notOwner = !uname || pin.owner !== uname;
  var lang = props.lang || 'en';
  var t = props.t || function(key, p) {
    if (key === 'offline') return 'offline';
    if (key === 'expired') return 'Expired';
    if (key === 'saved_from') return 'saved from';
    if (key === 'save_btn') return 'Save';
    if (key === 'delete_confirm_pin') return 'Delete "' + (p ? p.name : '') + '"? This cannot be undone.';
    return key;
  };

  var cardStyle = {
    background:"#fbf8ee",border:"1px solid #e6dfca",borderRadius:14,padding:"14px 16px",
    marginBottom:10,cursor:"pointer",position:"relative",boxShadow:"0 1px 0 rgba(28,32,28,0.02)",
    transition:"border-color 0.15s, box-shadow 0.15s"
  };

  var miniBtnStyle = {
    background:"#f6f1e4",border:"1px solid #d8cfb8",color:"#3c4540",padding:"6px 12px",
    fontSize:12,cursor:"pointer",borderRadius:18,fontWeight:500,transition:"background 0.15s",letterSpacing:"0.01em"
  };

  var localizedPrivacy = (function() {
    var p = (pin.privacy || "").toLowerCase();
    if (p === 'public') return t('form_privacy_public');
    if (p === 'private') return t('form_privacy_private');
    if (p === 'insider') return t('form_privacy_insider');
    return pin.privacy;
  })();

  return (
    <div className="pm-card-hover" style={cardStyle} onClick={props.onFocus}>
      {pin.photo && <img src={pin.photo} style={{width:"100%",borderRadius:4,marginBottom:5,maxHeight:80,objectFit:"cover"}} alt="Pin photo" />}
      <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:1}}>
        <span style={{width:8,height:8,borderRadius:"50%",background:pin.color||tagColor(pin.tags&&pin.tags[0]||"x"),display:"inline-block",flexShrink:0}}></span>
        <span style={{fontSize:14,lineHeight:1}}>{getPinIcon(pin.tags)}</span>
        <span style={{fontWeight:700,fontSize:17,color:"#1a201c"}}>{pin.name}</span>
        {pin._offline && <span style={{fontSize:10,marginLeft:5,padding:"1px 5px",borderRadius:4,background:"#e3f2fd",color:"#1565c0",border:"1px solid #90caf9"}}>📡 {t('offline')}</span>}
        {pin.expires_at && (
          <span style={{
            fontSize:10,marginLeft:5,padding:"1px 5px",borderRadius:4,
            background:new Date(pin.expires_at)<new Date()?"#ffebee":"#fff8e1",
            color:new Date(pin.expires_at)<new Date()?"#c62828":"#e65100",
            border:"1px solid "+(new Date(pin.expires_at)<new Date()?"#ef9a9a":"#ffe082")
          }}>
            {new Date(pin.expires_at)<new Date()?t('expired'):(function(){
              var diff=new Date(pin.expires_at)-new Date();
              var days=Math.floor(diff/864e5);
              var hrs=Math.floor((diff%864e5)/36e5);
              return "⏰ "+(days>0?days+"d ":"")+hrs+"h";
            })()}
          </span>
        )}
      </div>
      <div style={{fontSize:11,color:"#6f786f",marginBottom:2}}>
        <span 
          style={{color:"#2a5d3c",cursor:"pointer",textDecoration:"underline",textDecorationStyle:"dotted"}}
          onClick={(ev) => {ev.stopPropagation();props.onViewUser&&props.onViewUser(pin.owner);}}
        >
          {"@"+pin.owner}
        </span>
        {pin.saved_from && <span>{" - " + t('saved_from') + " @" + pin.saved_from}</span>}
        {" - " + localizedPrivacy}
        {props.dist !== undefined && <span style={{color:"#2a5d3c",marginLeft:4}}>{props.dist.toFixed(1)}km</span>}
      </div>
      <div style={{fontSize:13,marginBottom:4}}>
        {(pin.tags||[]).map(function(t){
          return <span key={t} style={{color:tagColor(t),marginRight:3}}>{"#"+t}</span>;
        })}
      </div>
      <div style={{display:"flex",gap:4}} onClick={(ev) => ev.stopPropagation()}>
        {notOwner && (
          <React.Fragment>
            <button 
              style={Object.assign({},miniBtnStyle,{color:pin.upvotes&&uname&&pin.upvotes.indexOf(uname)>=0?"#2a5d3c":"#6f786f",fontWeight:pin.upvotes&&uname&&pin.upvotes.indexOf(uname)>=0?700:400})}
              onClick={() => props.onUpvote(pin.id)}
            >
              {"👍 "+(pin.upvotes?pin.upvotes.length:0)}
            </button>
            <button style={miniBtnStyle} onClick={() => props.onSave(pin)}>⭐ {t('save_btn')}</button>
          </React.Fragment>
        )}
        {isOwner && !pin.saved_from && (
          <button style={Object.assign({},miniBtnStyle,{color:"#c05050"})} onClick={() => {
            if(window.confirm(t('delete_confirm_pin', {name: pin.name}))) props.onDelete(pin.id);
          }}>
            🗑
          </button>
        )}
      </div>
    </div>
  );
}
