import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { dbPut, uid } from '../utils/helpers';

export function Comments(props) {
  var pinId = props.pinId, uname = props.uname;
  var [comments, setComments] = useState([]);
  var [cLoading, setCLoading] = useState(true);
  var [draft, setDraft] = useState("");
  var [sending, setSending] = useState(false);
  var [replyTo, setReplyTo] = useState(null);

  useEffect(function(){
    setCLoading(true);
    api.getComments(pinId).then(function(data){setComments(data);setCLoading(false);});
  }, [pinId]);

  function submit(){
    if(!draft.trim()) return;
    if(!uname){api.signInGoogle();return;}
    setSending(true);
    var c={id:uid(),pin_id:pinId,owner:uname,body:draft.trim(),
      reply_to:replyTo?replyTo.id:null,
      upvotes:[],
      created_at:new Date().toISOString()};
    if(!navigator.onLine){
      dbPut("comments", Object.assign({},c,{_offline:true})).then(function(){
        setComments(function(prev){return prev.concat([Object.assign({},c,{_offline:true})]);});
        setDraft(""); setReplyTo(null); setSending(false);
        if(props.flash) props.flash("📡 Comment saved offline — will sync when online");
      });
    } else {
      api.addComment(c).then(function(){
        setComments(function(prev){return prev.concat([c]);});
        setDraft(""); setReplyTo(null); setSending(false);
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
    return (
      <div key={c.id}>
        <div style={{
          marginBottom:isReply?4:6,padding:"8px 10px",
          background:isReply?"#e8e0cc":"#f0e8d4",
          borderRadius:6,
          border:"1px solid "+(isReply?"#d8cbb0":"#e3dac1"),
          position:"relative",
          marginLeft:isReply?16:0,
          borderLeft:isReply?"3px solid #2e7d32":""
        }}>
          {isReply && <div style={{fontSize:10,color:"#2a5d3c",marginBottom:2}}>{"↩ replying to @"+parentOwner}</div>}
          <div style={{fontSize:13,fontWeight:700,color:"#2a5d3c",marginBottom:2}}>{"@"+c.owner}</div>
          <div style={{fontSize:15,color:"#1a201c",lineHeight:1.6,paddingRight:20}}>{c.body}</div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:5}}>
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
                style={{position:"absolute",top:6,right:6,background:"none",border:"none",fontSize:12,color:"#c05050",cursor:"pointer"}}
                onClick={() => del(c.id)}
              >
                x
              </button>
            )}
          </div>
        </div>
        {cReplies.map(function(r){return renderComment(r,true);})}
      </div>
    );
  }

  return (
    <div style={{borderTop:"1px solid #e8dcc4",marginTop:10,paddingTop:10}}>
      <div className="caps" style={{color:"#6f786f",marginBottom:10}}>{"Comments ("+(cLoading?"...":comments.length)+")"}</div>
      {cLoading ? (
        <div style={{fontSize:13,color:"#6f786f"}}>Loading...</div>
      ) : (
        <div>
          {topLevel.length===0 && <div style={{fontSize:13,color:"#9a8f74",fontStyle:"italic",marginBottom:8}}>No comments yet. Be the first!</div>}
          {topLevel.map(function(c){return renderComment(c,false);})}
          {replyTo && (
            <div style={{fontSize:11,color:"#2a5d3c",marginBottom:4,marginTop:8,padding:"4px 8px",background:"#dde6dc",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span>{"Replying to @"+replyTo.owner}</span>
              <button style={{background:"none",border:"none",color:"#6f786f",cursor:"pointer",fontSize:13}} onClick={()=>{setReplyTo(null);setDraft("");}}>x</button>
            </div>
          )}
          <div style={{display:"flex",gap:5,marginTop:8}}>
            <input 
              style={{flex:1,background:"#efe9d8",border:"1px solid #d8cfb8",color:"#1a201c",padding:"7px 9px",fontSize:13,borderRadius:4,outline:"none"}}
              placeholder={replyTo?"Reply to @"+replyTo.owner+"...":(uname?"Add a comment...":"Sign in to comment")}
              value={draft}
              onChange={(ev) => setDraft(ev.target.value)}
              onKeyDown={(ev) => {if(ev.key==="Enter")submit();}}
            />
            <button 
              style={{background:"#2a5d3c",color:"#fff",border:"none",padding:"7px 10px",fontSize:13,fontWeight:700,cursor:"pointer",borderRadius:4,opacity:sending?0.6:1}}
              onClick={submit}
              disabled={sending}
            >
              {sending?"...":"Post"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
