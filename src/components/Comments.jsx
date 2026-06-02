import React, { useState, useEffect } from 'react';
import { api, uploadJournalPhoto } from '../utils/api';
import { dbPut, uid } from '../utils/helpers';

export function Comments(props) {
  var pinId = props.pinId, uname = props.uname;
  var lang = props.lang || 'en';
  var t = props.t || function(key, p) {
    if (key === 'reply_placeholder') return "Reply to @" + (p ? p.owner : '') + "...";
    if (key === 'replying_to') return "Replying to @" + (p ? p.owner : '');
    return key;
  };
  var [comments, setComments] = useState([]);
  var [cLoading, setCLoading] = useState(true);
  var [draft, setDraft] = useState("");
  var [sending, setSending] = useState(false);
  var [replyTo, setReplyTo] = useState(null);
  var [selectedPhoto, setSelectedPhoto] = useState(null);
  var [fullscreenPhoto, setFullscreenPhoto] = useState(null);
  var [showPhotoSourcePrompt, setShowPhotoSourcePrompt] = useState(false);

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
            width = max_height;
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

  function triggerCapture(useCamera) {
    setShowPhotoSourcePrompt(false);
    var input = document.getElementById("journal-file-input");
    if (!input) return;
    if (useCamera) {
      input.setAttribute("capture", "environment");
    } else {
      input.removeAttribute("capture");
    }
    input.click();
  }

  async function submit(){
    var trimmedDraft = draft.trim();
    if(!trimmedDraft && !selectedPhoto) return;
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

      var finalBody = trimmedDraft;

      var c={id:uid(),pin_id:pinId,owner:uname,body:finalBody,
        reply_to:replyTo?replyTo.id:null,
        photo_url:photoUrl,
        upvotes:[],
        created_at:new Date().toISOString()};
      if(!navigator.onLine){
        dbPut("comments", Object.assign({},c,{_offline:true})).then(function(){
          setComments(function(prev){return prev.concat([Object.assign({},c,{_offline:true})]);});
          setDraft(""); setSelectedPhoto(null); setReplyTo(null); setSending(false);
          if(props.flash) props.flash(t('toast_comment_posted_offline'));
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
        }).catch(function(err){
          setSending(false);
          if(props.flash) props.flash("Failed to post comment: " + (err ? err.message : "Unknown error"));
        });
      }
    } catch(e) {
      setSending(false);
      if(props.flash) props.flash(t('toast_photo_upload_failed') + e.message);
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
    var has=ups.indexOf(uname)>=0;
    var newUps=has
      ?ups.filter(function(u){return u!==uname;})
      :[].concat(ups,[uname]);
    api.upvoteComment(comment.id,newUps).then(function(){
      setComments(function(prev){return prev.map(function(c){return c.id===comment.id?Object.assign({},c,{upvotes:newUps}):c;});});
      if(!has && comment.owner !== uname) {
        api.callEdgeFunction("comment_upvote", {
          commentOwner: comment.owner,
          upvoterName: uname,
          commentBody: comment.body,
          pinId: pinId
        });
      }
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
          {isReply && <div style={{fontSize:10,color:"#2a5d3c",marginBottom:2}}>{t('replying_to', {owner: parentOwner})}</div>}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <div style={{fontSize:13,fontWeight:700,color:"#2a5d3c"}}>{"@"+c.owner}</div>
            <div style={{fontSize:10,color:"#9a8f74",fontFamily:"monospace"}}>{timeStr}</div>
          </div>
          <div style={{fontSize:14,color:"#1a201c",lineHeight:1.5,paddingRight:20,whiteSpace:"pre-wrap",userSelect:"text",WebkitUserSelect:"text"}}>
            {(function(text) {
              if (!text) return "";
              var urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
              var parts = text.split(urlRegex);
              return parts.map(function(part, i) {
                if (/^https?:\/\//i.test(part)) {
                  return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{color: "#2a5d3c", textDecoration: "underline", wordBreak: "break-all", userSelect: "text", WebkitUserSelect: "text"}} onClick={function(ev){ev.stopPropagation();}}>{part}</a>;
                } else if (/^www\./i.test(part)) {
                  return <a key={i} href={"https://" + part} target="_blank" rel="noopener noreferrer" style={{color: "#2a5d3c", textDecoration: "underline", wordBreak: "break-all", userSelect: "text", WebkitUserSelect: "text"}} onClick={function(ev){ev.stopPropagation();}}>{part}</a>;
                }
                return part;
              });
            })(c.body)}
          </div>

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
              style={{
                background:"none",
                border:"none",
                fontSize:12,
                color:myUpvote?"#ff4500":"#6f786f",
                fontWeight:myUpvote?700:400,
                cursor:"pointer",
                padding:0,
                display:"flex",
                alignItems:"center",
                gap:4
              }}
              onClick={() => toggleUpvote(c)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill={myUpvote?"currentColor":"none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M12 3l-7 8h4v9h6v-9h4z" /></svg>
              <span>
                {myUpvote 
                  ? (lang === 'es' ? "Votado " : "Upvoted ") 
                  : (lang === 'es' ? "Votar " : "Upvote ")}
                {((c.upvotes||[]).length||"")}
              </span>
            </button>
            {!isReply && uname && (
              <button 
                style={{background:"none",border:"none",fontSize:12,color:"#6f786f",cursor:"pointer",padding:0}}
                onClick={() => {setReplyTo(replyTo&&replyTo.id===c.id?null:c);setDraft("");}}
              >
                {lang === 'es' ? "↩ Responder" : "↩ Reply"}
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
      <div className="caps" style={{color:"#6f786f",marginBottom:10,fontSize:11,letterSpacing:"0.05em",textTransform:"uppercase",fontWeight:700}}>{t('journal_logs') + " ("+(cLoading?"...":comments.length)+")"}</div>
      {cLoading ? (
        <div style={{fontSize:13,color:"#6f786f"}}>{t('loading_journal')}</div>
      ) : (
        <div>
          {topLevel.length===0 && <div style={{fontSize:13,color:"#9a8f74",fontStyle:"italic",marginBottom:12,textAlign:"center",padding:"16px 0",background:"#fcfbfa",borderRadius:8,border:"1px dashed #dcd3bc"}}>{t('no_logs_yet')}</div>}
          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
            {topLevel.map(function(c){return renderComment(c,false);})}
          </div>
          
          {replyTo && (
            <div style={{fontSize:11,color:"#2a5d3c",marginBottom:4,marginTop:8,padding:"6px 10px",background:"#dde6dc",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span>{t('replying_to', {owner: replyTo.owner})}</span>
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

          <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:8}}>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              {uname && (
                <>
                  <button 
                    style={{background:"#efe9d8",border:"1px solid #d8cfb8",height:34,width:34,fontSize:15,borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,color:"#6f786f"}}
                    onClick={() => setShowPhotoSourcePrompt(true)}
                    title={t('attach_photo_title')}
                  >
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy={13} r="4" stroke="currentColor" strokeWidth={2.2}/></svg>
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
                placeholder={replyTo ? t('reply_placeholder', {owner: replyTo.owner}) : (uname ? t('write_log_placeholder') : t('signin_to_log_placeholder'))}
                value={draft}
                onChange={(ev) => setDraft(ev.target.value)}
                onKeyDown={(ev) => {if(ev.key==="Enter")submit();}}
              />
              <button 
                style={{background:"#2a5d3c",color:"#fff",border:"none",padding:"0 14px",height:34,fontSize:13,fontWeight:700,cursor:"pointer",borderRadius:6,opacity:sending?0.6:1}}
                onClick={submit}
                disabled={sending}
              >
                {sending?"...":t('post_btn')}
              </button>
            </div>
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

      {/* Photo Source Selection Prompt */}
      {showPhotoSourcePrompt && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 3100,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center"
          }}
          onClick={() => setShowPhotoSourcePrompt(false)}
        >
          <div 
            style={{
              background: "#faf6ed",
              borderRadius: "16px 16px 0 0",
              padding: "20px 16px 24px",
              width: "100%",
              maxWidth: 480,
              boxShadow: "0 -4px 16px rgba(0,0,0,0.1)",
              boxSizing: "border-box",
              fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{fontSize:14,fontWeight:700,color:"#6f786f",marginBottom:16,textAlign:"center"}}>{t('attach_photo_title')}</div>
            
            <button 
              style={{
                display: "block",
                width: "100%",
                padding: "14px",
                marginBottom: 10,
                background: "#f6f1e4",
                border: "1px solid #dcd3bc",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                color: "#2a5d3c",
                cursor: "pointer",
                textAlign: "left"
              }}
              onClick={() => triggerCapture(true)}
            >
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy={13} r="4" stroke="currentColor" strokeWidth={2.2}/></svg>
                <span>{t('take_photo')}</span>
              </div>
            </button>
            
            <button 
              style={{
                display: "block",
                width: "100%",
                padding: "14px",
                marginBottom: 16,
                background: "#f6f1e4",
                border: "1px solid #dcd3bc",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                color: "#2a5d3c",
                cursor: "pointer",
                textAlign: "left"
              }}
              onClick={() => triggerCapture(false)}
            >
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span>{t('choose_gallery')}</span>
              </div>
            </button>
            
            <button 
              style={{
                display: "block",
                width: "100%",
                padding: "12px",
                background: "none",
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                color: "#c05050",
                cursor: "pointer",
                textAlign: "center",
                margin: "0 auto"
              }}
              onClick={() => setShowPhotoSourcePrompt(false)}
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
