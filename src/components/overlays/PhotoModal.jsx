import React from 'react';
import { T, S } from '../../utils/styles';
import { formatLL, getPinIcon, distKm, tagColor } from '../../utils/helpers';
const e = React.createElement;

export function PhotoModal(props) {
  const {
    fullscreenPhoto, setFullscreenPhoto, t
  } = props;

  return e("div",{
      style:{
        position:"fixed",
        top:0,left:0,right:0,bottom:0,
        background:"rgba(18, 25, 20, 0.93)",
        zIndex:3000,
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        padding:20
      },
      onClick:function(){setFullscreenPhoto(null);}
    },
      e("div",{style:{position:"relative",maxWidth:"90%",maxHeight:"90%",display:"flex",alignItems:"center",justifyContent:"center"},onClick:function(e){e.stopPropagation();}},
        e("img",{src:fullscreenPhoto,alt:"Pin Photo Full View",style:{maxWidth:"100%",maxHeight:"85vh",borderRadius:8,boxShadow:"0 12px 48px rgba(0,0,0,0.4)"}}),
        e("button",{
          style:{position:"absolute",top:-14,right:-14,background:"#c05050",color:"#fff",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",fontWeight:"bold",fontSize:14,boxShadow:"0 2px 8px rgba(0,0,0,0.2)",display:"flex",alignItems:"center",justifyContent:"center",padding:0},
          onClick:function(){setFullscreenPhoto(null);}
        },"✕")
      )
    );
}
