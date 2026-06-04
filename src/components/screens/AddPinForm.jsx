import React from 'react';
import { T, S } from '../../utils/styles';
import { formatLL, getPinIcon } from '../../utils/helpers';
const e = React.createElement;

export function AddPinForm(props) {
  const {
    pendingLL, setPendingLL, user, api, drafts, setDrafts, setForm, mapObj,
    form, t, saveDraft, trails, uname, savePin, takePhoto,
    setShowInsiderExplainer, renderTagSuggestions
  } = props;

        return e("div",{style:{padding:"16px",overflowY:"auto"}},
        e("div",{style:{padding:"0 0 10px"}},
          e("div",{style:{fontSize:10.5,letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600,color:T.ink3,fontFamily:T.mono,marginBottom:6}},t("form_title_add")),
          pendingLL && e("div",{style:{fontSize:12,color:T.forest,fontFamily:T.mono,marginTop:4}},
            formatLL(pendingLL.lat, pendingLL.lng, 4)
          )
        ),
        !user && e("div",{style:{background:T.paper2,border:"1px solid "+T.borderSoft,borderRadius:10,padding:14,marginBottom:12,textAlign:"center"}},
          e("div",{style:{fontSize:13,color:T.ink2,marginBottom:8}},t("signin_to_save_pins")),
          e("button",{style:Object.assign({},S.btn,{width:"100%"}),onClick:api.signInGoogle},t("signin_google"))
        ),
        drafts.length > 0 && e("div",{style:{marginBottom:16}},
          e("div",{style:{fontSize:11,color:T.ink3,marginBottom:8}},t("your_drafts")),
          drafts.map(function(d){
            return e("div",{key:d.id,style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:T.paper2,border:"1px solid "+T.borderSoft,borderRadius:10,marginBottom:6,cursor:"pointer"},onClick:function(){
              setForm(d.form);
              if(d.pendingLL){ setPendingLL(d.pendingLL); if(mapObj.current) mapObj.current.setView([d.pendingLL.lat, d.pendingLL.lng]); }
              else setPendingLL(null);
            }},
              e("div",{style:{flex:1}},
                e("div",{style:{fontWeight:600,fontSize:14,color:T.ink}},d.form.name || t("untitled_draft")),
                e("div",{style:{fontSize:11,color:T.ink3}},new Date(d.date).toLocaleString())
              ),
              e("button",{style:{background:"none",border:"none",color:"#c05050",cursor:"pointer",padding:5,fontSize:18,lineHeight:1},onClick:function(ev){ev.stopPropagation();setDrafts(function(ds){return ds.filter(function(x){return x.id!==d.id;});});}},"×")
            );
          })
        ),
        e("div",{style:{position:"relative",marginBottom:10}},
          e("input",{id:"form-pin-name",style:S.input,placeholder:t("form_placeholder_name"),value:form.name,
            onChange:function(ev){setForm(function(f){return Object.assign({},f,{name:ev.target.value});});}})
        ),
        e("textarea",{id:"form-pin-desc",style:Object.assign({},S.input,{resize:"vertical",minHeight:70}),
          placeholder:t("form_placeholder_desc_optional"),value:form.description,
          onChange:function(ev){setForm(function(f){return Object.assign({},f,{description:ev.target.value});});}}),
        e("input",{style:S.input,placeholder:"URL / Link (optional)",value:form.url || "",
          onChange:function(ev){setForm(function(f){return Object.assign({},f,{url:ev.target.value});});}}),
        e("input",{id:"form-pin-tags",style:S.input,placeholder:t("form_placeholder_tags_hint"),value:form.tags,
          onChange:function(ev){setForm(function(f){return Object.assign({},f,{tags:ev.target.value});});}}),
        renderTagSuggestions(form.tags, function(newTags) {
          setForm(function(f){return Object.assign({},f,{tags:newTags});});
        }, pendingLL ? pendingLL.lat : undefined, pendingLL ? pendingLL.lng : undefined),
        e("div",{style:{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}},
          ["#2a5d3c","#b85c2a","#1565c0","#c62828","#6a1b9a","#00695c","#4e342e","#37474f","#f57f17"].map(function(c){
            return e("button",{key:c,onClick:function(){setForm(function(f){return Object.assign({},f,{color:c});});},
              style:{width:28,height:28,borderRadius:"50%",background:c,border:form.color===c?"3px solid "+T.ink:"3px solid transparent",cursor:"pointer"}});
          })
        ),
        e("div",{style:{display:"flex",gap:6,marginBottom:12}},
          ["public","private","insider"].map(function(p){
            return e("button",{key:p,
              style:{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+(form.privacy===p?T.forest:T.border),
                background:form.privacy===p?T.forestPale:"transparent",color:form.privacy===p?T.forest:T.ink2,
                fontSize:12,cursor:"pointer",fontWeight:form.privacy===p?600:400,textTransform:"capitalize"},
              onClick:function(){
                setForm(function(f){return Object.assign({},f,{privacy:p});});
                if(p==="insider" && !localStorage.getItem("pm-seen-insider-explainer")){
                  setShowInsiderExplainer(true);
                  localStorage.setItem("pm-seen-insider-explainer","1");
                }
              }},t("form_privacy_" + p));
          })
        ),
        e("div",{style:{marginBottom:12}},
          e("div",{style:{fontSize:11,color:"#6f786f",marginBottom:6}}, "Choose icon or click pin to add your own"),
          e("div",{style:{display:"flex",gap:8,alignItems:"center"}},
            e("input",{
              id:"form-pin-icon",
              style:Object.assign({},S.input,{width:50,textAlign:"center",fontSize:16,padding:"6px",margin:0}),
              maxLength:2,
              placeholder:getPinIcon(form.tags.split(/[\s,]+/).filter(Boolean)),
              value:form.icon || "",
              onChange:function(ev){setForm(function(f){return Object.assign({},f,{icon:ev.target.value});});}
            }),
            e("div",{style:{display:"flex",gap:4,flexWrap:"wrap",flex:1}},
              ["🥾","⛺","☕","🍺","🚴","🎣","📷","🏔️"].map(function(emoji){
                return e("button",{
                  key:emoji,
                  type:"button",
                  style:{
                    padding:"5px 8px",borderRadius:6,border:"1px solid "+(form.icon===emoji?T.forest:T.border),
                    background:form.icon===emoji?T.forestPale:"#efe9d8",fontSize:13,cursor:"pointer"
                  },
                  onClick:function(){setForm(function(f){return Object.assign({},f,{icon:emoji});});}
                }, emoji);
              }),
              form.icon && e("button",{
                type:"button",
                style:{padding:"5px 8px",borderRadius:6,border:"1px solid "+T.border,background:"#fff",fontSize:11,cursor:"pointer",color:"#c05050"},
                onClick:function(){setForm(function(f){return Object.assign({},f,{icon:""});});}
              }, "Reset")
            )
          )
        ),
        !pendingLL && e("div",{style:{background:T.paper2,border:"1px dashed "+T.border,borderRadius:10,padding:"16px",marginBottom:12,textAlign:"center",color:T.ink3,fontSize:13}},
          t("form_no_location_hint")
        ),
        e("div",{style:{marginBottom:16}},
          e("div",{style:{fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,display:"block",marginBottom:6}},t("photo_label")),
          e("div",{id:"form-photo-upload",style:{display:"flex",gap:8,alignItems:"center"}},
            [1, 2, 3].map(function(idx) {
              var fieldName = idx === 1 ? 'photo' : 'photo_' + idx;
              var photoVal = form[fieldName];
              if (photoVal) {
                return e("div",{key:idx,style:{position:"relative",width:68,height:68,borderRadius:8,overflow:"hidden",border:"1px solid "+T.border,flexShrink:0}},
                  e("img",{src:photoVal,style:{width:"100%",height:"100%",objectFit:"cover"}}),
                  e("button",{
                    type:"button",
                    onClick:function(){setForm(function(f){var patch={};patch[fieldName]=null;return Object.assign({},f,patch);});},
                    style:{position:"absolute",top:2,right:2,background:"rgba(0,0,0,0.6)",border:"none",color:"#fff",borderRadius:"50%",width:16,height:16,cursor:"pointer",fontSize:10,lineHeight:"14px",display:"flex",alignItems:"center",justifyContent:"center"}
                  },"x")
                );
              } else {
                return e("button",{
                  key:idx,
                  type:"button",
                  style:{width:68,height:68,borderRadius:8,border:"1px dashed "+T.border,background:T.paper2,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",color:T.ink3,gap:4,flexShrink:0},
                  onClick:function(){takePhoto(function(compressed){setForm(function(f){var patch={};patch[fieldName]=compressed;return Object.assign({},f,patch);});});}
                },
                  e("svg",{width:16,height:16,viewBox:"0 0 24 24",fill:"none"},
                    e("path",{d:"M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"}),
                    e("circle",{cx:"12",cy:"13",r:"4",stroke:"currentColor",strokeWidth:2})
                  ),
                  e("span",{style:{fontSize:8.5,fontWeight:600}},t("add_photo"))
                );
              }
            })
          )
        ),
        e("div",{style:{marginBottom:12}},
          e("label",{style:{fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,display:"block",marginBottom:4}},t("expires_optional")),
          e("input",{type:"datetime-local",style:S.input,value:form.expires_at,
            onChange:function(ev){setForm(function(f){return Object.assign({},f,{expires_at:ev.target.value});});}})
        ),
        e("div",{style:{marginBottom:12}},
          e("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4}},
            e("label",{style:{fontSize:10.5,letterSpacing:"0.12em",textTransform:"uppercase",color:T.ink3,fontFamily:T.mono,margin:0}},t("link_trail")),
            e("button",{
              type:"button",
              style:{
                background:"none",border:"none",padding:0,cursor:"pointer",color:T.ink3,
                display:"inline-flex",alignItems:"center",justifyContent:"center",
                opacity:0.7,fontSize:13
              },
              onClick:function(ev){
                ev.preventDefault();
                alert(t("link_trail_help"));
              }
            },"❓")
          ),
          e("select",{
            style:S.input,
            value:form.trail_id || "",
            onChange:function(ev){setForm(function(f){return Object.assign({},f,{trail_id:ev.target.value});});}
          },
            e("option",{value:""},t("none_option")),
            trails.filter(function(t){return t.owner===uname;}).map(function(trail){
              return e("option",{key:trail.id,value:trail.id},trail.name||"Untitled Trail");
            })
          )
        ),
        e("div",{style:{display:"flex",gap:8}},
          e("button",{style:Object.assign({},S.btn,{flex:1,background:"transparent",color:T.ink2,border:"1px solid "+T.border}),onClick:saveDraft},t("form_save_draft_btn")),
          e("button",{style:Object.assign({},S.btn,{flex:2}),onClick:savePin},t("publish_pin"))
        )
      );

}
