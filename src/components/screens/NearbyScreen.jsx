import React from 'react';
import { T, S } from '../../utils/styles';
import { formatLL, getPinIcon, distKm, tagColor } from '../../utils/helpers';
const e = React.createElement;

export function NearbyScreen(props) {
  const { pins, userLL, distKm, mapObj, setSelPin, setOpen, loadUserProfile } = props;

  return e("div",{style:{padding:"16px",overflowY:"auto"}},
      e("div",{style:{fontSize:10.5,letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600,color:T.ink3,fontFamily:T.mono,marginBottom:10}},"Nearby Pins"),
      e("div",{style:{fontSize:13,color:T.ink3,marginBottom:10}},
        userLL ? "Showing pins closest to your location" : "Tap the GPS button on the map to find your location"
      ),
      (function(){
        var pub=pins.filter(function(p){return p.privacy==="public";});
        var sorted=userLL
          ? pub.slice().sort(function(a,b){return distKm(userLL.lat,userLL.lng,a.lat,a.lng)-distKm(userLL.lat,userLL.lng,b.lat,b.lng);})
          : pub;
        return sorted.slice(0,10).map(function(p){
          var dist=userLL?distKm(userLL.lat,userLL.lng,p.lat,p.lng):null;
          var distMi=dist!==null?dist*0.621371:null;
          return e("div",{key:p.id,
            style:{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid "+T.borderSoft,cursor:"pointer"},
            onClick:function(){if(mapObj.current)mapObj.current.setView([p.lat,p.lng],14);setSelPin(p);setOpen(false);}
          },
            e("svg",{width:14,height:18,viewBox:"0 0 28 36",style:{flexShrink:0}},
              e("path",{d:"M14 0 C 6.27 0 0 6.27 0 14 c 0 9.5 14 22 14 22 s 14 -12.5 14 -22 C 28 6.27 21.73 0 14 0 z",fill:p.color||T.forest}),
              e("circle",{cx:"14",cy:"14",r:"5",fill:T.paper})
            ),
            e("div",{style:{flex:1,minWidth:0}},
              e("div",{style:{fontWeight:600,fontSize:15,color:T.ink,marginBottom:1}},p.name),
              e("div",{style:{fontSize:12,color:T.ink3}},e("span",{style:{cursor:"pointer"},onClick:function(ev){ev.stopPropagation();loadUserProfile(p.owner);}},"@"+p.owner),(p.tags&&p.tags[0]?" · #"+p.tags[0]:""))
            ),
            distMi!==null && e("div",{style:{fontSize:11,color:distMi>10?"#b85c2a":T.ink3,fontFamily:T.mono,flexShrink:0}},
              distMi<1.0?"nearby":distMi.toFixed(1)+" mi"
            )
          );
        });
      })()
    );
}
