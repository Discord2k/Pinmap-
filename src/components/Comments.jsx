import React, { useState, useEffect } from 'react';
import { api, uploadJournalPhoto } from '../utils/api';
import { dbPut, uid } from '../utils/helpers';

export function Comments(props) {
  var pinId = props.pinId, uname = props.uname;
  var [comments, setComments] = useState([]);
  var [cLoading, setCLoading] = useState(true);
  var [draft, setDraft] = useState("");
  var [sending, setSending] = useState(false);
  var [replyTo, setReplyTo] = useState(null);
  var [selectedPhoto, setSelectedPhoto] = useState(null);
  var [fullscreenPhoto, setFullscreenPhoto] = useState(null);

  useEffect(function(){
    setCLoading(true);
    api.getComments(pinId).then(function(data){setComments(data);setCLoading(false);});
  }, [pinId]);

  function handleFileChange(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(event) {
      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement("canvas");
        var max_width = 1000;
        var max_height = 1000;
        var width = img.width;
        var height = img.height;
        if (width > height) {
          if (width > max_width) {
            height *= max_width / width;
            width = max_width;
          }
        } else {
          if (height > max_height) {
            width *= max_height / height;
            height = max_height;
          }
        }
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        var dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        setSelectedPhoto(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function submit(){
    if(!draft.trim() && !selectedPhoto) return;
    if(!uname){api.signInGoogle();return;}
    setSending(true);
    
    try {
      var photoUrl = null;
      if (selectedPhoto) {
        if (navigator.onLine) {
          photoUrl = await uploadJournalPhoto(selectedPhoto, pinId);
        } else {
          photoUrl = selectedPhoto;
        }
      }

      var c={id:uid(),pin_id:pinId,owner:uname,body:draft.trim(),
        reply_to:replyTo?replyTo.id:null,
        photo_url:photoUrl,
        upvotes:[],
        created_at:new Date().toISOString()};
      if(!navigator.onLine){
        dbPut("comments", Object.assign({},c,{_offline:true})).then(function(){
          setComments(function(prev){return prev.concat([Object.assign({},c,{_offline:true})]);});
          setDraft(""); setSelectedPhoto(null); setReplyTo(null); setSending(false);
          if(props.flash) props.flash("📡 Journal log saved offline — will sync when online");
        });
      } else {
        api.addComment(c).then(function(){
          setComments(function(prev){return prev.concat([c]);});
          setDraft(""); setSelectedPhoto(null); setReplyTo(null); setSending(false);
          if(props.pinOwner && props.pinOwner !== props.uname) {
            api.callEdgeFunction("new_comment", {
              pinOwner: props.pinOwner,
              commenterName: props.uname,
              pinName: props.pinName || "a pin",
              pinId: props.pinId
            });
          }
        }).catch(function(){setSending(false);});
      }
    } catch(e) {
      setSending(false);
      if(props.flash) props.flash("❌ Failed to upload photo: " + e.message);
    }
  }

  function del(id){
    api.deleteComment(id,uname).then(function(){
      setComments(function(prev){return prev.filter(function(c){return c.id!==id&&c.reply_to!==id;});});
    });
  }

  function toggleUpvote(comment){
    if(!uname){api.signInGoogle();return;}
    var ups=comment.upvotes||[];
    var newUps=ups.indexOf(uname)>=0
      ?ups.filter(function(u){return u!==uname;})
      :[].concat(ups,[uname]);
    api.upvoteComment(comment.id,newUps).then(function(){
      setComments(function(prev){return prev.map(function(c){return c.id===comment.id?Object.assign({},c,{upvotes:newUps}):c;});});
    });
  }

  var topLevel=comments.filter(function(c){return !c.reply_to;});
  var replies=comments.filter(function(c){return !!c.reply_to;});

  function renderComment(c,isReply){
    var myUpvote=(c.upvotes||[]).indexOf(uname)>=0;
    var cReplies=!isReply?replies.filter(function(r){return r.reply_to===c.id;}):[];
    var parentOwner=isReply?(comments.find(function(x){return x.id===c.reply_to;})||{}).owner:"";
    var timeStr = c.created_at ? new Date(c.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'}) : "";
    return (
      <div key={c.id}>
        <div style={{
          marginBottom:isReply?4:8,padding:"10px 12px",
          background:isReply?"#e8e0cc":"#f6f1e4",
          borderRadius:8,
          border:"1px solid "+(isReply?"#d8cbb0":"#dcd3bc"),
          position:"relative",
          marginLeft:isReply?20:0,
          borderLeft:isReply?"3px solid #2a5d3c":"none",
          boxShadow: isReply ? "none" : "0 1px 3px rgba(0,0,0,0.03)"
        }}>
          {isReply && <div style={{fontSize:10,color:"#2a5d3c",marginBottom:2}}>{"↩ replying to @"+parentOwner}</div>}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <div style={{fontSize:13,fontWeight:700,color:"#2a5d3c"}}>{"@"+c.owner}</div>
            <div style={{fontSize:10,color:"#9a8f74",fontFamily:"monospace"}}>{timeStr}</div>
          </div>
          
          <div style={{fontSize:14,color:"#1a201c",lineHeight:1.5,paddingRight:20,whiteSpace:"pre-wrap"}}>{c.body}</div>

          {c.photo_url && (
            <div 
              style={{
                margin: "8px 0",
                background: "#ffffff",
                padding: "6px 6px 12px 6px",
                borderRadius: 4,
                boxShadow: "0 4px 12px rgba(0,0,0,0.07)",
                border: "1px solid #e3dac1",
                maxWidth: 220,
                cursor: "pointer",
                transition: "transform 0.2s"
              }} 
              onClick={() => setFullscreenPhoto(c.photo_url)}
            >
              <img 
                src={c.photo_url} 
                alt="Journal log entry" 
                style={{
                  width: "100%",
                  aspectRatio: "4/3",
                  objectFit: "cover",
                  borderRadius: 2,
                  display: "block"
                }} 
              />
            </div>
          )}

          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
            <button 
              style={{background:"none",border:"none",fontSize:12,color:myUpvote?"#2a5d3c":"#6f786f",cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:3}}
              onClick={() => toggleUpvote(c)}
            >
              {"👍 "+((c.upvotes||[]).length||"")}
            </button>
            {!isReply && uname && (
              <button 
                style={{background:"none",border:"none",fontSize:12,color:"#6f786f",cursor:"pointer",padding:0}}
                onClick={() => {setReplyTo(replyTo&&replyTo.id===c.id?null:c);setDraft("");}}
              >
                ↩ Reply
              </button>
            )}
            {c.owner===uname && (
              <button 
                style={{position:"absolute",top:6,right:6,background:"none",border:"none",fontSize:12,color:"#c05050",cursor:"pointer",padding:"4px"}}
                onClick={() => del(c.id)}
              >
                ✕
              </button>
            )}
          </div>
        </div>
        {cReplies.map(function(r){return renderComment(r,true);})}
      </div>
    );
  }

  return (
    <div style={{borderTop:"1px solid #e8dcc4",marginTop:14,paddingTop:12}}>
      <div className="caps" style={{color:"#6f786f",marginBottom:10,fontSize:11,letterSpacing:"0.05em",textTransform:"uppercase",fontWeight:700}}>{"Journal Logs ("+(cLoading?"...":comments.length)+")"}</div>
      {cLoading ? (
        <div style={{fontSize:13,color:"#6f786f"}}>Loading journal...</div>
      ) : (
        <div>
          {topLevel.length===0 && <div style={{fontSize:13,color:"#9a8f74",fontStyle:"italic",marginBottom:12,textAlign:"center",padding:"16px 0",background:"#fcfbfa",borderRadius:8,border:"1px dashed #dcd3bc"}}>No logs recorded yet. Be the first to add to this pin's journal!</div>}
          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
            {topLevel.map(function(c){return renderComment(c,false);})}
          </div>
          
          {replyTo && (
            <div style={{fontSize:11,color:"#2a5d3c",marginBottom:4,marginTop:8,padding:"6px 10px",background:"#dde6dc",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span>{"Replying to @"+replyTo.owner}</span>
              <button style={{background:"none",border:"none",color:"#6f786f",cursor:"pointer",fontSize:13}} onClick={()=>{setReplyTo(null);setDraft("");}}>✕</button>
            </div>
          )}

          {selectedPhoto && (
            <div style={{position:"relative",display:"inline-block",margin:"6px 0",background:"#fff",padding:4,borderRadius:6,boxShadow:"0 2px 8px rgba(0,0,0,0.08)",border:"1px solid #d8cfb8"}}>
              <img src={selectedPhoto} alt="Upload Preview" style={{height:70,width:90,objectFit:"cover",borderRadius:4,display:"block"}} />
              <button 
                style={{position:"absolute",top:-6,right:-6,background:"#c05050",color:"#fff",border:"none",width:18,height:18,borderRadius:"50%",fontSize:10,cursor:"pointer",lineHeight:"18px",padding:0,textAlign:"center"}} 
                onClick={() => setSelectedPhoto(null)}
              >
                ✕
              </button>
            </div>
          )}

          <div style={{display:"flex",gap:6,marginTop:8,alignItems:"center"}}>
            {uname && (
              <>
                <button 
                  style={{background:"#efe9d8",border:"1px solid #d8cfb8",height:34,width:34,fontSize:15,borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}
                  onClick={() => document.getElementById("journal-file-input").click()}
                  title="Attach journal photo"
                >
                  📷
                </button>
                <input 
                  id="journal-file-input"
                  type="file"
                  accept="image/*"
                  style={{display:"none"}}
                  onChange={handleFileChange}
                />
              </>
            )}
            <input 
              style={{flex:1,background:"#efe9d8",border:"1px solid #d8cfb8",color:"#1a201c",padding:"8px 10px",fontSize:13,borderRadius:6,outline:"none",height:34,boxSizing:"border-box"}}
              placeholder={replyTo?"Reply to @"+replyTo.owner+"...":(uname?"Write journal log...":"Sign in to record logs")}
              value={draft}
              onChange={(ev) => setDraft(ev.target.value)}
              onKeyDown={(ev) => {if(ev.key==="Enter")submit();}}
            />
            <button 
              style={{background:"#2a5d3c",color:"#fff",border:"none",padding:"0 14px",height:34,fontSize:13,fontWeight:700,cursor:"pointer",borderRadius:6,opacity:sending?0.6:1}}
              onClick={submit}
              disabled={sending}
            >
              {sending?"...":"Post"}
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Modal */}
      {fullscreenPhoto && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(18, 25, 20, 0.93)",
            zIndex: 3000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }}
          onClick={() => setFullscreenPhoto(null)}
        >
          <div style={{position:"relative",maxWidth:"90%",maxHeight:"90%",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={(e)=>e.stopPropagation()}>
            <img src={fullscreenPhoto} alt="Journal Log Full" style={{maxWidth:"100%",maxHeight:"85vh",borderRadius:8,boxShadow:"0 12px 48px rgba(0,0,0,0.4)"}} />
            <button 
              style={{position:"absolute",top:-14,right:-14,background:"#c05050",color:"#fff",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",fontWeight:"bold",fontSize:14,boxShadow:"0 2px 8px rgba(0,0,0,0.2)",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}
              onClick={() => setFullscreenPhoto(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
