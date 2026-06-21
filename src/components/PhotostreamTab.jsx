import React, { useState } from 'react';
import { T, S } from '../utils/styles';

const e = React.createElement;

export function PhotostreamTab({ 
  submissions = [], 
  huntSteps = [], 
  activeStep = null, 
  participant = null, 
  hideSpoilers = true, 
  uname = "", 
  lang = 'en', 
  onLike, 
  onComment 
}) {
  const [activeCommentBoxId, setActiveCommentBoxId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [submittingCommentId, setSubmittingCommentId] = useState(null);

  const t = {
    en: {
      spoilerTitle: "Spoilers Ahead!",
      spoilerDesc: "Complete this checkpoint to unlock this photo.",
      likes: "likes",
      comments: "comments",
      addCommentPlaceholder: "Write a comment...",
      post: "Post",
      noPhotos: "No submissions yet. Be the first to upload a photo!",
      anonymous: "Anonymous Player"
    },
    es: {
      spoilerTitle: "¡Revelaciones (Spoilers)!",
      spoilerDesc: "Completa este punto de control para desbloquear la foto.",
      likes: "me gusta",
      comments: "comentarios",
      addCommentPlaceholder: "Escribe un comentario...",
      post: "Publicar",
      noPhotos: "Aún no hay publicaciones. ¡Sé el primero en subir una foto!",
      anonymous: "Jugador Anónimo"
    }
  }[lang] || {
    spoilerTitle: "Spoilers Ahead!",
    spoilerDesc: "Complete this checkpoint to unlock this photo.",
    likes: "likes",
    comments: "comments",
    addCommentPlaceholder: "Write a comment...",
    post: "Post",
    noPhotos: "No submissions yet. Be the first to upload a photo!",
    anonymous: "Anonymous Player"
  };

  const handleLikeClick = (sub) => {
    const hasLiked = sub.likes.includes(uname);
    onLike(sub.id, hasLiked);
  };

  const handleCommentSubmit = async (subId) => {
    if (!commentText.trim()) return;
    setSubmittingCommentId(subId);
    try {
      await onComment(subId, commentText);
      setCommentText('');
    } finally {
      setSubmittingCommentId(null);
    }
  };

  if (!submissions || submissions.length === 0) {
    return e('div', {
      style: {
        padding: '40px 20px',
        textAlign: 'center',
        color: T.ink3,
        background: T.paper3,
        borderRadius: 16,
        border: `1px dashed ${T.border}`,
        marginTop: 16
      }
    },
      e('div', { style: { fontSize: 32, marginBottom: 12 } }, "📷"),
      e('p', { style: { margin: 0, fontSize: 14 } }, t.noPhotos)
    );
  }

  // Get active step's sequence order
  const activeSequence = activeStep ? activeStep.sequence_order : 9999;

  return e('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      marginTop: 16
    }
  },
    submissions.map((sub) => {
      // Find matching step details
      const step = huntSteps.find(s => s.id === sub.step_id);
      const stepSeq = step ? step.sequence_order : 1;
      
      // Spoiler checks
      const isCompleted = participant && participant.status === 'completed';
      const isSpoiler = hideSpoilers && !isCompleted && stepSeq >= activeSequence;

      const hasLiked = sub.likes.includes(uname);

      return e('div', {
        key: sub.id,
        style: {
          background: T.paper3,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column'
        }
      },
        // Header (User, timestamp, step indicator)
        e('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: `1px solid ${T.borderSoft}`
          }
        },
          e('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
            e('div', {
              style: {
                width: 32, height: 32, borderRadius: '50%',
                background: T.forestPale, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, color: T.forest, fontSize: 14
              }
            }, (sub.username || 'U')[0].toUpperCase()),
            e('div', null,
              e('div', { style: { fontWeight: 700, fontSize: 13, color: T.ink } }, `@${sub.username || t.anonymous}`),
              e('div', { style: { fontSize: 10, color: T.ink3 } }, new Date(sub.created_at).toLocaleDateString())
            )
          ),
          e('div', {
            style: {
              background: T.forestPale, color: T.forest,
              fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 20
            }
          }, `${lang === 'es' ? 'Paso' : 'Step'} ${stepSeq}`)
        ),

        // Photo / Spoiler Overlay Container
        e('div', {
          style: {
            width: '100%',
            aspectRatio: '16/10',
            position: 'relative',
            background: '#000',
            overflow: 'hidden'
          }
        },
          isSpoiler ? [
            // Blurred spoiler placeholder image or background
            e('div', {
              key: 'blur-bg',
              style: {
                width: '100%', height: '100%',
                backgroundImage: `url(${sub.photo_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(35px) brightness(0.45)',
                transform: 'scale(1.2)'
              }
            }),
            // Warning message overlay
            e('div', {
              key: 'overlay',
              style: {
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: 20, textAlign: 'center', color: '#fff', zIndex: 10
              }
            },
              e('span', { style: { fontSize: 28, marginBottom: 8 } }, "🙈"),
              e('div', { style: { fontSize: 16, fontWeight: 800, marginBottom: 4 } }, t.spoilerTitle),
              e('div', { style: { fontSize: 12.5, opacity: 0.85, maxWidth: '280px' } }, t.spoilerDesc)
            )
          ] : e('img', {
            src: sub.photo_url,
            alt: "Submission",
            loading: "lazy", // Ensures fast initial viewport loads
            style: { width: '100%', height: '100%', objectFit: 'cover' }
          })
        ),

        // Caption & Social Interaction Bar
        e('div', { style: { padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 } },
          sub.caption && e('div', { style: { fontSize: 13.5, color: T.ink, lineHeight: 1.4 } }, 
            e('span', { style: { fontWeight: 700, marginRight: 6 } }, `@${sub.username}`),
            sub.caption
          ),

          // Likes / Comments Actions buttons
          e('div', {
            style: {
              display: 'flex', alignItems: 'center', gap: 16,
              borderTop: `1px solid ${T.borderSoft}`, paddingTop: 10, marginTop: 4
            }
          },
            e('button', {
              onClick: () => handleLikeClick(sub),
              style: {
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5, padding: '4px 0',
                color: hasLiked ? '#e91e63' : T.ink3,
                transition: 'transform 0.1s ease'
              }
            },
              e('svg', {
                width: 18, height: 18, viewBox: '0 0 24 24',
                fill: hasLiked ? 'currentColor' : 'none',
                stroke: 'currentColor', strokeWidth: 2
              },
                e('path', { d: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' })
              ),
              e('span', { style: { fontSize: 13, fontWeight: 700 } }, `${sub.likes.length} ${t.likes}`)
            ),

            e('button', {
              onClick: () => setActiveCommentBoxId(activeCommentBoxId === sub.id ? null : sub.id),
              style: {
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5, padding: '4px 0',
                color: activeCommentBoxId === sub.id ? T.forest : T.ink3
              }
            },
              e('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
                e('path', { d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' })
              ),
              e('span', { style: { fontSize: 13, fontWeight: 700 } }, `${(sub.comments || []).length} ${t.comments}`)
            )
          )
        ),

        // Comments Drawer / List (Visible when activeCommentBoxId === sub.id)
        activeCommentBoxId === sub.id && e('div', {
          style: {
            background: '#faf9f6',
            borderTop: `1px solid ${T.borderSoft}`,
            padding: '12px 16px',
            display: 'flex', flexDirection: 'column', gap: 8
          }
        },
          // List Comments
          (sub.comments || []).length > 0 && e('div', {
            style: {
              display: 'flex', flexDirection: 'column', gap: 8,
              maxHeight: '150px', overflowY: 'auto', paddingRight: 4
            }
          },
            (sub.comments || []).map((c, cIdx) => (
              e('div', { key: cIdx, style: { fontSize: 12.5, lineHeight: 1.4 } },
                e('span', { style: { fontWeight: 700, color: T.ink, marginRight: 6 } }, `@${c.username}`),
                e('span', { style: { color: T.ink2 } }, c.body)
              )
            ))
          ),

          // Add Comment Input Form
          e('div', { style: { display: 'flex', gap: 8, marginTop: 4 } },
            e('input', {
              type: 'text',
              placeholder: t.addCommentPlaceholder,
              value: commentText,
              onChange: (e) => setCommentText(e.target.value),
              onKeyDown: (e) => {
                if (e.key === 'Enter') handleCommentSubmit(sub.id);
              },
              style: Object.assign({}, S.input, { height: 34, flex: 1, fontSize: 12.5, padding: '0 10px', marginBottom: 0 })
            }),
            e('button', {
              onClick: () => handleCommentSubmit(sub.id),
              disabled: submittingCommentId === sub.id || !commentText.trim(),
              style: Object.assign({}, S.miniBtn, {
                background: T.forest, color: '#fff', border: 'none',
                fontWeight: 700, padding: '0 12px', borderRadius: 8, height: 34
              })
            }, t.post)
          )
        )
      );
    })
  );
}
