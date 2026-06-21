import React, { useState, useEffect } from 'react';
import { api, sb } from '../utils/api';
import { T, S } from '../utils/styles';

const e = React.createElement;

export default function TeamRegistrationCard({ huntId, username, onEnrolled, onBack, lang = 'en' }) {
  const [hunt, setHunt] = useState(null);
  const [huntTeams, setHuntTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [huntRes, teamsRes, participantsRes] = await Promise.all([
          api.getHunt(huntId),
          api.getHuntTeams(huntId),
          sb.from("hunt_participants").select("team_id").eq("hunt_id", huntId)
        ]);

        if (!active) return;
        setHunt(huntRes);

        const counts = {};
        (participantsRes.data || []).forEach(p => {
          if (p.team_id) {
            counts[p.team_id] = (counts[p.team_id] || 0) + 1;
          }
        });

        setHuntTeams(teamsRes.map(t => ({
          ...t,
          memberCount: counts[t.id] || 0
        })));
      } catch (err) {
        console.error("Error loading team registration details:", err);
        setError(err.message || 'Failed to load details');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadData();
    return () => { active = false; };
  }, [huntId]);

  const handleJoinTeam = async (teamId) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Enroll in the hunt
      const part = await api.enrollInHunt(huntId, username, 'BROWSE_PUBLIC');
      // 2. Assign to team
      await api.assignParticipantToTeam(part.id, teamId, username);
      if (onEnrolled) onEnrolled(teamId);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to join team');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSoloOrManual = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.enrollInHunt(huntId, username, 'BROWSE_PUBLIC');
      if (onEnrolled) onEnrolled(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to enroll');
    } finally {
      setLoading(false);
    }
  };

  if (loading && huntTeams.length === 0) {
    return e('div', { style: { textAlign: 'center', padding: '20px 0', color: T.ink3 } },
      e('div', {
        style: {
          display: 'inline-block', width: 20, height: 20,
          border: `2px solid ${T.forestPale}`, borderTopColor: T.forest,
          borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 8
        }
      }),
      e('div', { style: { fontSize: 12 } }, lang === 'es' ? "Cargando opciones de juego…" : "Loading play modes…")
    );
  }

  const isManual = hunt?.team_assignment_mode === 'manual';
  const maxCap = hunt?.max_players_per_team || 10;

  return e('div', {
    style: {
      background: T.paper2, border: `1px solid ${T.border}`,
      borderRadius: 16, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12
    }
  },
    e('h3', { style: { fontSize: 16, fontWeight: 800, color: T.ink, textAlign: 'center', margin: 0 } }, 
      lang === 'es' ? "Elige cómo Jugar" : "Choose How to Play"
    ),
    e('p', { style: { fontSize: 11.5, color: T.ink3, textAlign: 'center', margin: '0 0 6px 0', lineHeight: 1.3 } },
      isManual
        ? (lang === 'es' ? "Esta cacería requiere que el organizador te asigne a un equipo manualmente." : "This hunt requires the organizer to assign you to a team manually.")
        : (lang === 'es' ? "Selecciona un equipo de la lista para unirte y comenzar." : "Select a team from the list to join and begin.")
    ),

    error && e('div', { style: { fontSize: 12, color: '#d32f2f', textAlign: 'center', background: 'rgba(211,47,47,0.06)', padding: 8, borderRadius: 8 } }, error),

    isManual ? (
      e('div', { style: { display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', padding: '10px 0' } },
        e('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' } },
          huntTeams.map(t => e('span', {
            key: t.id,
            style: {
              fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12,
              background: t.color + '1a', color: t.color, border: `1px solid ${t.color}33`
            }
          }, t.name))
        ),
        e('button', {
          onClick: handleJoinSoloOrManual,
          disabled: loading,
          style: Object.assign({}, S.btn, { width: '100%', background: T.forest, color: '#fff' })
        }, loading ? (lang === 'es' ? "Inscribiendo..." : "Enrolling...") : (lang === 'es' ? "Inscribirse y Esperar Asignación" : "Enroll & Wait for Assignment"))
      )
    ) : (
      e('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
        huntTeams.map(t => {
          const isFull = t.memberCount >= maxCap;
          return e('button', {
            key: t.id,
            disabled: loading || isFull,
            onClick: () => handleJoinTeam(t.id),
            style: {
              background: T.paper, border: `1px solid ${t.color}33`, borderRadius: 10,
              padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: isFull ? 'not-allowed' : 'pointer', opacity: isFull ? 0.6 : 1, transition: 'all 0.2s',
              textAlign: 'left'
            }
          },
            e('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
              e('div', { style: { width: 12, height: 12, borderRadius: '50%', background: t.color } }),
              e('div', null,
                e('span', { style: { fontWeight: 700, fontSize: 13, color: T.ink } }, t.name),
                e('div', { style: { fontSize: 10, color: T.ink3 } },
                  lang === 'es' ? `${t.memberCount} / ${maxCap} miembros` : `${t.memberCount} / ${maxCap} members`
                )
              )
            ),
            e('span', { style: { fontSize: 11, fontWeight: 700, color: t.color } },
              isFull ? (lang === 'es' ? "Lleno" : "Full") : (lang === 'es' ? "Unirse →" : "Join →")
            )
          );
        }),

        // Option to play Solo if no teams are configured or if they want to play alone
        huntTeams.length === 0 && e('button', {
          onClick: handleJoinSoloOrManual,
          disabled: loading,
          style: Object.assign({}, S.btn, { width: '100%', background: T.forest, color: '#fff' })
        }, lang === 'es' ? "Jugar Solo" : "Play Solo")
      )
    ),

    onBack && e('button', {
      onClick: onBack,
      style: {
        background: 'none', border: 'none', color: T.ink3, fontSize: 12, cursor: 'pointer',
        alignSelf: 'center', marginTop: 4, textDecoration: 'underline'
      }
    }, lang === 'es' ? "Atrás" : "Back")
  );
}
