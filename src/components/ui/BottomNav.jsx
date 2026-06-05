import React from 'react';
import { T } from '../../utils/styles';
const e = React.createElement;

export function BottomNav({ uname, open, tab, setOpen, setTab, t, unreadCount }) {
  return e("div",{style:{position:"fixed",left:0,right:0,bottom:0,zIndex:1001,background:T.paper,borderTop:"1px solid "+T.borderSoft,paddingBottom:"calc(6px + env(safe-area-inset-bottom,0px))",boxShadow:"0 -1px 0 rgba(28,32,28,0.04), 0 -8px 24px rgba(28,32,28,0.06)"}},
    e("div",{style:{display:"flex",alignItems:"stretch",height:60}},
      [
        {id:"map",label:"Map"},
        {id:"search",label:"Search"},
        {id:"mine",label:"Mine"},
        {id:"profile",label:"Profile"}
      ].concat(uname==="Seth Gray"?[{id:"admin",label:"Admin"}]:[]).map(function(it){
        var active=open&&tab===it.id;
        var isMap=it.id==="map";
        var isActive=active||(isMap&&!open);
        var icons={
            map: e("svg",{width:20,height:20,viewBox:"0 0 24 24",fill:"none"},e("path",{d:"M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-1.447-.894L15 9m0 8V9m0 0L9 7",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round"})),
            search: e("svg",{width:20,height:20,viewBox:"0 0 24 24",fill:"none"},e("circle",{cx:"11",cy:"11",r:"8",stroke:"currentColor",strokeWidth:1.8}),e("path",{d:"M21 21l-4.35-4.35",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round"})),
            add: e("svg",{width:20,height:20,viewBox:"0 0 24 24",fill:"none"},e("circle",{cx:"12",cy:"12",r:"9",stroke:"currentColor",strokeWidth:1.8}),e("path",{d:"M12 8v8M8 12h8",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round"})),
            mine: e("svg",{width:20,height:20,viewBox:"0 0 24 24",fill:"none"},e("path",{d:"M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",stroke:"currentColor",strokeWidth:1.8,strokeLinejoin:"round"}),e("circle",{cx:"12",cy:"9",r:"2.5",stroke:"currentColor",strokeWidth:1.5})),
            nearby: e("svg",{width:20,height:20,viewBox:"0 0 24 24",fill:"none"},e("circle",{cx:"12",cy:"12",r:"3",stroke:"currentColor",strokeWidth:1.8}),e("path",{d:"M12 2v3M12 19v3M2 12h3M19 12h3",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round"}),e("circle",{cx:"12",cy:"12",r:"8",stroke:"currentColor",strokeWidth:1.2,strokeDasharray:"2 3"})),
            profile: e("svg",{width:20,height:20,viewBox:"0 0 24 24",fill:"none"},e("path",{d:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round"}),e("circle",{cx:"12",cy:"7",r:"4",stroke:"currentColor",strokeWidth:1.8})),
            admin: e("svg",{width:20,height:20,viewBox:"0 0 24 24",fill:"none"},e("path",{d:"M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",stroke:"currentColor",strokeWidth:1.8,strokeLinejoin:"round"}))
          };
          return e("button",{key:it.id, id:"btn-tab-" + it.id,
          onClick:function(){
            if(isMap){ setOpen(false); return; }
            setTab(it.id); setOpen(true);
          },
          style:{flex:1,position:"relative",background:"transparent",border:"none",padding:"8px 0 6px",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,
            color:isActive?T.forest:T.ink3,cursor:"pointer",fontFamily:T.font,transition:"color 0.15s"}
        },
          isActive && e("div",{style:{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:28,height:2,background:T.forest,borderRadius:"0 0 2px 2px"}}),
          e("div",{style:{opacity:isActive?1:0.7,transition:"opacity 0.15s"}},icons[it.id]||icons.map),
          e("span",{style:{fontSize:10,fontWeight:isActive?700:500,letterSpacing:"0.14em",textTransform:"uppercase"}},t("tab_" + it.id, it.label)),
          it.id==="mine" && unreadCount>0 && e("div",{style:{position:"absolute",top:8,right:"calc(50% - 18px)",width:6,height:6,borderRadius:"50%",background:"#b85c2a",pointerEvents:"none"}})
        );
      })
    )
  );
}
