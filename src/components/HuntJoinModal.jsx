import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { T, S } from '../utils/styles';

const e = React.createElement;

export function HuntJoinModal({ huntId, userId, lang = 'en', onJoined, onClose, flash }) {
  const [loading, setLoading] = useState(true);
  const [hunt, setHunt] = useState(null);
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!huntId) return;
    setLoading(true);
    setError(null);
    api.getHunt(huntId)
      .then(data => {
        setHunt(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching hunt details:", err);
        setError(lang === 'es' ? "No se pudo encontrar este desafío de búsqueda." : "Could not find this scavenger hunt.");
        setLoading(false);
      });
  }, [huntId, lang]);

  const handleJoin = async () => {
    if (!userId || userId === 'guest') {
      flash(lang === 'es' ? "¡Inicia sesión para unirte a la búsqueda!" : "Please sign in to join the hunt!");
      return;
    }
    setJoining(true);
    try {
      // Enroll participant with DEEP_LINK method as they got here via link
      const participant = await api.enrollInHunt(huntId, userId, 'DEEP_LINK');
      flash(lang === 'es' ? "🎉 ¡Te has unido a la búsqueda del tesoro!" : "🎉 Joined the treasure hunt successfully!");
      if (onJoined) {
        onJoined(hunt, participant);
      }
      onClose();
    } catch (err) {
      console.error("Failed to join hunt:", err);
      if (err.message && err.message.includes('unique_violation')) {
        // User is already enrolled, fetch participant data and bypass
        try {
          const part = await api.getParticipant(huntId, userId);
          flash(lang === 'es' ? "Ya estás inscrito en esta búsqueda." : "You are already enrolled in this hunt.");
          if (onJoined) onJoined(hunt, part);
          onClose();
        } catch (e2) {
          setError(lang === 'es' ? "Error al verificar inscripción." : "Failed to verify enrollment.");
        }
      } else {
        setError(lang === 'es' ? "Error al unirse a la búsqueda." : "Error joining the hunt.");
      }
    } finally {
      setJoining(false);
    }
  };

  // Render modal backdrop & card
  return e('div', {
    style: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(26, 32, 28, 0.45)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, padding: 16
    }
  },
    e('div', {
      style: {
        background: T.paper2, border: `1px solid ${T.border}`,
        borderRadius: 20, boxShadow: T.shadowLg,
        width: '100%', maxWidth: 440, padding: '24px 20px',
        position: 'relative', display: 'flex', flexDirection: 'column',
        boxSizing: 'border-box', fontFamily: T.font
      }
    },
      // Close button
      e('button', {
        onClick: onClose,
        style: {
          position: 'absolute', top: 16, right: 16,
          background: 'none', border: 'none', fontSize: 22,
          color: T.ink3, cursor: 'pointer', outline: 'none'
        }
      }, '×'),

      // Title
      e('div', {
        style: {
          fontSize: 11, fontFamily: T.mono, letterSpacing: '0.15em',
          textTransform: 'uppercase', color: T.forest, fontWeight: 700,
          marginBottom: 6
        }
      }, lang === 'es' ? "BÚSQUEDA DEL TESORO" : "SCAVENGER HUNT"),

      loading && e('div', { style: { textAlign: 'center', padding: '30px 0' } },
        e('div', {
          style: {
            display: 'inline-block', width: 24, height: 24,
            border: `3px solid ${T.forestPale}`, borderTopColor: T.forest,
            borderRadius: '50%', animation: 'spin 1s linear infinite',
            marginBottom: 8
          }
        }),
        e('div', { style: { fontSize: 13, color: T.ink3 } },
          lang === 'es' ? "Cargando detalles…" : "Loading details…")
      ),

      error && e('div', { style: { padding: '16px 0', color: '#c62828', textAlign: 'center' } },
        e('div', { style: { fontSize: 32, marginBottom: 8 } }, '⚠️'),
        e('div', { style: { fontSize: 14, fontWeight: 600 } }, error),
        e('button', {
          onClick: onClose,
          style: Object.assign({}, S.btnOutline, { marginTop: 16, width: '100%' })
        }, lang === 'es' ? "Cerrar" : "Close")
      ),

      (!loading && !error && hunt) && e('div', {
        style: { display: 'flex', flexDirection: 'column', gap: 14 }
      },
        e('div', { style: { fontSize: 18, fontWeight: 800, color: T.ink } }, hunt.name),

        hunt.description && e('div', {
          style: { fontSize: 13.5, color: T.ink2, lineHeight: 1.5, background: T.paper3, padding: 12, borderRadius: 10 }
        }, hunt.description),

        e('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } },
          e('div', { style: { background: T.paper, padding: 10, borderRadius: 10 } },
            e('div', { style: { fontSize: 10, color: T.ink3, fontWeight: 700, textTransform: 'uppercase' } },
              lang === 'es' ? "FECHA LÍMITE" : "END DATE"),
            e('div', { style: { fontSize: 12.5, fontWeight: 700, color: T.ink, marginTop: 2 } },
              new Date(hunt.end_date).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
          ),
          e('div', { style: { background: T.paper, padding: 10, borderRadius: 10 } },
            e('div', { style: { fontSize: 10, color: T.ink3, fontWeight: 700, textTransform: 'uppercase' } },
              lang === 'es' ? "ETAPAS / OBJETIVOS" : "STEPS / OBJECTIVES"),
            e('div', { style: { fontSize: 12.5, fontWeight: 700, color: T.ink, marginTop: 2 } },
              `${hunt.hunt_steps ? hunt.hunt_steps.length : 0} ${lang === 'es' ? 'puntos' : 'points'}`)
          )
        ),

        // Visibility Badge / Notice
        e('div', {
          style: {
            fontSize: 12, color: T.ink3, display: 'flex', alignItems: 'center', gap: 6,
            background: hunt.visibility === 'private' ? 'rgba(239, 108, 0, 0.08)' : 'rgba(46, 125, 50, 0.08)',
            padding: '8px 12px', borderRadius: 8, border: `1px solid ${hunt.visibility === 'private' ? 'rgba(239, 108, 0, 0.15)' : 'rgba(46, 125, 50, 0.15)'}`
          }
        },
          e('span', null, hunt.visibility === 'private' ? '🔒' : '🌐'),
          e('span', null, hunt.visibility === 'private'
            ? (lang === 'es' ? "Esta es una búsqueda privada. Debes registrarte mediante invitación." : "This is a private hunt. Enrollment is via shared link.")
            : (lang === 'es' ? "Esta es una búsqueda pública abierta a todos." : "This is a public hunt open to all participants."))
        ),

        // Action Buttons
        e('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 } },
          (!userId || userId === 'guest') ?
            e('div', { style: { textAlign: 'center', fontSize: 13, color: T.ink3, padding: '10px 0' } },
              lang === 'es' ? "Por favor inicia sesión para unirte a este desafío." : "Please sign in to join this challenge.")
            :
            e('button', {
              onClick: handleJoin,
              disabled: joining,
              style: Object.assign({}, S.btn, {
                width: '100%',
                background: joining ? T.forest2 : T.forest,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              })
            },
              joining && e('div', {
                style: {
                  width: 14, height: 14, border: '2px solid transparent',
                  borderTopColor: T.paper, borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite'
                }
              }),
              lang === 'es' ? "Unirse a la Búsqueda del Tesoro" : "Join Scavenger Hunt"
            ),
          e('button', {
            onClick: onClose,
            style: Object.assign({}, S.btnOutline, { width: '100%' })
          }, lang === 'es' ? "Cancelar" : "Cancel")
        )
      )
    )
  );
}
