import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { T, S } from '../utils/styles';
import { distKm } from '../utils/helpers';
import { HuntRadarOverlay } from './HuntRadarOverlay';

const e = React.createElement;

export function ScavengerHuntsPanel({ uname, userLL, pins = [], trails = [], lang = 'en', flash, initialHuntsTab = 'my_hunts' }) {
  const [activeSubTab, setActiveSubTab] = useState(initialHuntsTab); // my_hunts, active_play
  const [hunts, setHunts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Active Play states
  const [selectedHunt, setSelectedHunt] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [huntSteps, setHuntSteps] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [checkingIn, setCheckingIn] = useState(false);
  const [writingComment, setWritingComment] = useState(null); // step object when writing
  const [commentText, setCommentText] = useState('');
  const [prevDistance, setPrevDistance] = useState(null);
  const [trend, setTrend] = useState(null); // 'closer', 'farther', null
  const [showRadar, setShowRadar] = useState(false);
  const [editingHunt, setEditingHunt] = useState(null); // hunt object being edited
  const [editSaving, setEditSaving] = useState(false);
  
  // Profile gamification states
  const [profileStats, setProfileStats] = useState({
    hunts_participated: 0,
    hunts_completed: 0,
    accrued_points: 0,
    badge_levels: {}
  });

  const loadHuntsData = async () => {
    setLoading(true);
    try {
      const allHunts = await api.listHunts();
      setHunts(allHunts);

      if (uname && uname !== 'guest') {
        const profile = await api.getProfile(uname);
        if (profile) {
          setProfileStats({
            hunts_participated: profile.hunts_participated || 0,
            hunts_completed: profile.hunts_completed || 0,
            accrued_points: profile.accrued_points || 0,
            badge_levels: profile.badge_levels || {}
          });
        }
      }
    } catch (err) {
      console.error("Failed to load scavenger hunts data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHuntsData();
  }, [uname]);

  // Sync if initialHuntsTab changes (e.g. deep-link from quick panel)
  useEffect(() => {
    if (initialHuntsTab && activeSubTab === 'my_hunts') {
      setActiveSubTab(initialHuntsTab);
    }
  }, [initialHuntsTab]);

  // --- Edit hunt handlers ---
  const handleSaveEdit = async () => {
    if (!editingHunt || !editingHunt.name.trim()) {
      flash(lang === 'es' ? 'El nombre es obligatorio.' : 'Hunt name is required.');
      return;
    }
    setEditSaving(true);
    try {
      await api.updateHunt(editingHunt.id, {
        name: editingHunt.name,
        description: editingHunt.description,
        start_date: new Date(editingHunt.start_date_local).toISOString(),
        end_date: new Date(editingHunt.end_date_local).toISOString(),
        visibility: editingHunt.visibility
      });
      flash(lang === 'es' ? '✅ Cacería actualizada.' : '✅ Hunt updated successfully!');
      setEditingHunt(null);
      loadHuntsData();
    } catch (err) {
      console.error('Failed to update hunt:', err);
      flash(lang === 'es' ? 'Error al actualizar la cacería.' : 'Error updating the hunt.');
    } finally {
      setEditSaving(false);
    }
  };


  const handleSelectHunt = async (hunt) => {
    setLoading(true);
    try {
      setSelectedHunt(hunt);
      const steps = await api.getHuntSteps(hunt.id);
      setHuntSteps(steps);

      // Check if user is enrolled
      const part = await api.getParticipant(hunt.id, uname);
      setParticipant(part);

      if (part) {
        const logs = await api.getHuntActivityLogs(part.id);
        setActivityLogs(logs);
      }

      const board = await api.getHuntLeaderboard(hunt.id);
      setLeaderboard(board);

      setActiveSubTab('active_play');
    } catch (err) {
      console.error("Failed to load hunt details:", err);
      flash(lang === 'es' ? "Error al cargar la búsqueda." : "Error loading hunt details.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (hunt) => {
    if (!uname || uname === 'guest') {
      flash(lang === 'es' ? "Inicia sesión para participar." : "Sign in to participate.");
      return;
    }
    try {
      const part = await api.enrollInHunt(hunt.id, uname, 'BROWSE_PUBLIC');
      setParticipant(part);
      setActivityLogs([]);
      flash(lang === 'es' ? "🎉 ¡Te has inscrito en la búsqueda!" : "🎉 Successfully enrolled in the hunt!");
      loadHuntsData();
      handleSelectHunt(hunt);
    } catch (err) {
      console.error("Failed to enroll:", err);
      flash(lang === 'es' ? "Error al inscribirse." : "Error enrolling in the hunt.");
    }
  };

  const getBadgeTier = (points) => {
    if (points >= 1500) return { title: lang === 'es' ? "Rastreador Leyenda" : "Legendary Tracker", emoji: "👑" };
    if (points >= 800) return { title: lang === 'es' ? "Explorador Maestro" : "Master Explorer", emoji: "🏆" };
    if (points >= 300) return { title: lang === 'es' ? "Guía de Ruta" : "Trailblazer", emoji: "🧭" };
    return { title: lang === 'es' ? "Iniciado" : "Scout", emoji: "🥾" };
  };

  const badgeTier = getBadgeTier(profileStats.accrued_points);

  // Active play computations
  const currentStepIndex = React.useMemo(() => {
    if (!huntSteps.length) return 0;
    // Find first step where check_in is NOT logged
    for (let i = 0; i < huntSteps.length; i++) {
      const step = huntSteps[i];
      const checkinLogged = activityLogs.some(l => l.step_id === step.id && l.activity_type === 'check_in');
      if (!checkinLogged) return i;
    }
    return huntSteps.length; // All completed
  }, [huntSteps, activityLogs]);

  const activeStep = huntSteps[currentStepIndex];

  // Geolocation math
  const getDistanceToPin = (pinId) => {
    if (!userLL || !userLL.lat || !userLL.lng) return null;
    const pin = pins.find(p => p.id === pinId);
    if (!pin) return null;
    return distKm(userLL.lat, userLL.lng, pin.lat, pin.lng) * 1000; // in meters
  };

  // Format distance: miles when >= 1000 ft, feet when closer
  const formatDistance = (distFt) => {
    if (distFt === null) return lang === 'es' ? "Buscando GPS..." : "Searching GPS...";
    if (distFt >= 1000) {
      const miles = distFt / 5280;
      return `${miles.toFixed(2)} mi`;
    }
    return `${distFt} ft`;
  };

  const currentDistanceM = activeStep ? getDistanceToPin(activeStep.pin_id) : null;
  const currentDistanceFt = currentDistanceM !== null ? Math.round(currentDistanceM * 3.28084) : null;
  const isWithin65Ft = currentDistanceFt !== null && currentDistanceFt <= 65;

  // Share a hunt via Web Share API or clipboard fallback
  const shareHunt = async (hunt, e_) => {
    e_.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?join_hunt=${hunt.id}`;
    const shareData = {
      title: hunt.name,
      text: lang === 'es'
        ? `¡Te invito a mi búsqueda del tesoro "${hunt.name}" en Pinmap! 🗺️`
        : `Join my Pinmap scavenger hunt "${hunt.name}"! 🗺️`,
      url: shareUrl
    };
    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        flash(lang === 'es' ? "🔗 Enlace copiado al portapapeles" : "🔗 Link copied to clipboard!");
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        // Fallback: try clipboard
        try {
          await navigator.clipboard.writeText(shareUrl);
          flash(lang === 'es' ? "🔗 Enlace copiado al portapapeles" : "🔗 Link copied to clipboard!");
        } catch {
          flash(lang === 'es' ? "No se pudo copiar el enlace." : "Could not copy the link.");
        }
      }
    }
  };

  const activeStepId = activeStep ? activeStep.id : null;
  useEffect(() => {
    setPrevDistance(null);
    setTrend(null);
  }, [activeStepId]);

  useEffect(() => {
    if (currentDistanceFt === null) return;
    if (prevDistance !== null) {
      const diff = currentDistanceFt - prevDistance;
      // Greater than 5 feet change to filter out minor GPS jitter
      if (diff < -5) {
        setTrend('closer');
      } else if (diff > 5) {
        setTrend('farther');
      }
    }
    setPrevDistance(currentDistanceFt);
  }, [currentDistanceFt]);

  const getProximityTemp = (distFt) => {
    if (distFt === null) return null;
    if (distFt <= 65) return { label: lang === 'es' ? "¡Aquí mismo!" : "Right Here!", color: '#2e7d32', icon: "🎯" };
    if (distFt <= 260) return { label: lang === 'es' ? "¡Hirviendo!" : "Burning Hot!", color: '#d84315', icon: "🌋" };
    if (distFt <= 820) return { label: lang === 'es' ? "Caliente" : "Hot", color: '#ef6c00', icon: "🔥" };
    if (distFt <= 1960) return { label: lang === 'es' ? "Tibio" : "Warm", color: '#fbc02d', icon: "🌤️" };
    return { label: lang === 'es' ? "Frío" : "Cold", color: '#1565c0', icon: "❄️" };
  };

  const performCheckIn = async () => {
    if (!isWithin65Ft) {
      flash(lang === 'es' ? "Debes estar a menos de 65 pies del objetivo." : "You must be within 65 feet of the objective.");
      return;
    }
    setCheckingIn(true);
    try {
      const checkinPoints = activeStep.point_rules.check_in || 100;
      await api.logHuntActivity(participant.id, activeStep.id, 'check_in', checkinPoints);
      
      const newLogs = await api.getHuntActivityLogs(participant.id);
      setActivityLogs(newLogs);
      
      const newPoints = participant.total_points + checkinPoints;
      const allDone = currentStepIndex === huntSteps.length - 1;
      const newStatus = allDone ? 'completed' : 'enrolled';
      
      const updatedPart = await api.updateParticipantStatus(participant.id, newStatus, newPoints);
      setParticipant(updatedPart);

      // Local push trigger
      if (allDone) {
        flash(lang === 'es' ? "🏆 ¡Felicidades! ¡Completaste toda la búsqueda del tesoro!" : "🏆 Congratulations! You completed the entire scavenger hunt!");
      } else {
        flash(lang === 'es' ? "📍 ¡Check-in completado! Pista del siguiente paso revelada." : "📍 Check-in successful! Next step clue revealed.");
      }
      
      // Refresh database stats
      loadHuntsData();
      handleSelectHunt(selectedHunt);
    } catch (err) {
      console.error("Failed to check in:", err);
      flash(lang === 'es' ? "Error al realizar check-in." : "Error performing check-in.");
    } finally {
      setCheckingIn(false);
    }
  };

  const logModifierAction = async (actionType, defaultPoints) => {
    if (!participant || !activeStep) return;
    // Check if already logged for this step
    const alreadyLogged = activityLogs.some(l => l.step_id === activeStep.id && l.activity_type === actionType);
    if (alreadyLogged) return;

    try {
      const points = activeStep.point_rules[actionType] || defaultPoints;
      await api.logHuntActivity(participant.id, activeStep.id, actionType, points);
      
      const newLogs = await api.getHuntActivityLogs(participant.id);
      setActivityLogs(newLogs);

      const newPoints = participant.total_points + points;
      const updatedPart = await api.updateParticipantStatus(participant.id, participant.status, newPoints);
      setParticipant(updatedPart);
      
      flash(lang === 'es' ? `✨ ¡Bono completado! +${points} puntos` : `✨ Bonus completed! +${points} points`);
      loadHuntsData();
    } catch (err) {
      console.error(`Failed to log modifier ${actionType}:`, err);
    }
  };

  const submitFieldJournal = async () => {
    if (!commentText.trim()) return;
    try {
      await api.addComment({
        pin_id: writingComment.pin_id,
        owner: uname,
        body: commentText
      });
      flash(lang === 'es' ? "Diario de campo guardado." : "Field journal entry saved.");
      setCommentText('');
      setWritingComment(null);
      
      // Log as modifier action
      logModifierAction('comment', 50);
    } catch (err) {
      console.error("Failed to add field journal:", err);
    }
  };

  return e(React.Fragment, null,
    e('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
    
    // Gamification Profile Header (only in main views)
    activeSubTab !== 'active_play' && e('div', {
      style: {
        background: T.forest, color: T.paper, padding: 16, borderRadius: 14,
        marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, boxShadow: T.shadow
      }
    },
      e('div', { style: { fontSize: 28 } }, badgeTier.emoji),
      e('div', null,
        e('div', { style: { fontSize: 11, fontFamily: T.mono, opacity: 0.8, textTransform: 'uppercase' } }, badgeTier.title),
        e('div', { style: { fontSize: 18, fontWeight: 800 } }, `${profileStats.accrued_points.toLocaleString()} pts`),
        e('div', { style: { fontSize: 11.5, opacity: 0.9, marginTop: 4 } },
          lang === 'es' ? `Búsquedas jugadas: ${profileStats.hunts_participated} | Completadas: ${profileStats.hunts_completed}`
          : `Hunts Entered: ${profileStats.hunts_participated} | Completed: ${profileStats.hunts_completed}`)
      )
    ),

    // Sub Tabs Menu — Discover removed (lives in Search screen)
    activeSubTab !== 'active_play' && e('div', {
      style: { display: 'flex', background: T.paper3, borderRadius: 12, padding: 4, marginBottom: 16 }
    },
      [
        { id: 'my_hunts', label: lang === 'es' ? "Mis Cacerías" : "My Hunts" }
      ].map(tabItem =>
        e('button', {
          key: tabItem.id,
          onClick: () => setActiveSubTab(tabItem.id),
          style: {
            flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
            background: activeSubTab === tabItem.id ? T.paper2 : 'transparent',
            color: activeSubTab === tabItem.id ? T.forest : T.ink2
          }
        }, tabItem.label)
      )
    ),

    // Loading / Empty States
    loading && e('div', { style: { textAlign: 'center', padding: '30px 0' } },
      e('div', {
        style: {
          display: 'inline-block', width: 24, height: 24, border: `3px solid ${T.forestPale}`,
          borderTopColor: T.forest, borderRadius: '50%', animation: 'spin 1s linear infinite'
        }
      })
    ),

    // List rendering
    (!loading && activeSubTab === 'my_hunts') && e('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
      hunts.filter(h => h.creator === uname).length === 0 ? 
        e('div', { style: { textAlign: 'center', padding: '24px 0', color: T.ink3, fontStyle: 'italic', fontSize: 13.5 } },
          lang === 'es' ? "Aún no has creado cacerías." : "You haven't created any hunts yet.")
        :
        hunts.filter(h => h.creator === uname).map(h => (

          e('div', {
            key: h.id,
            style: Object.assign({}, S.card, { margin: 0, padding: 14, background: T.paper2, cursor: 'pointer' })
          },
            e('div', {
              style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
              onClick: () => handleSelectHunt(h)
            },
              e('div', { style: { fontWeight: 700, fontSize: 15, color: T.ink, flex: 1 } }, h.name),
              // Action buttons
              e('div', { style: { display: 'flex', gap: 6, flexShrink: 0 } },
                // Edit button
                e('button', {
                  onClick: (ev) => {
                    ev.stopPropagation();
                    const sd = h.start_date ? h.start_date.slice(0,10) : '';
                    const ed = h.end_date ? h.end_date.slice(0,10) : '';
                    setEditingHunt({ ...h, start_date_local: sd, end_date_local: ed });
                  },
                  title: lang === 'es' ? 'Editar cacería' : 'Edit hunt',
                  style: {
                    background: 'none', border: `1px solid ${T.borderSoft}`, borderRadius: 8,
                    padding: '4px 9px', fontSize: 13, cursor: 'pointer', color: T.ink3,
                    display: 'flex', alignItems: 'center'
                  }
                },
                  e('svg', { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
                    e('path', { d: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' }),
                    e('path', { d: 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' })
                  )
                ),
                // Share button
                e('button', {
                  onClick: (ev) => shareHunt(h, ev),
                  title: lang === 'es' ? 'Compartir búsqueda' : 'Share hunt',
                  style: {
                    background: 'none', border: `1px solid ${T.borderSoft}`, borderRadius: 8,
                    padding: '4px 9px', fontSize: 13, cursor: 'pointer', color: T.ink3,
                    display: 'flex', alignItems: 'center'
                  }
                },
                  e('svg', { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
                    e('path', { d: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8' }),
                    e('polyline', { points: '16 6 12 2 8 6' }),
                    e('line', { x1: '12', y1: '2', x2: '12', y2: '15' })
                  )
                )
              )
            ),
            e('div', { style: { fontSize: 12.5, color: T.ink3, marginTop: 6 }, onClick: () => handleSelectHunt(h) }, h.description),
            e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 11, fontFamily: T.mono, color: T.ink4 }, onClick: () => handleSelectHunt(h) },
              e('span', null, `Expires: ${new Date(h.end_date).toLocaleDateString()}`),
              e('span', {
                style: {
                  textTransform: 'uppercase', fontWeight: 700, fontSize: 10.5,
                  padding: '2px 7px', borderRadius: 5,
                  background: h.visibility === 'private' ? 'rgba(239,108,0,0.10)' : 'rgba(46,125,50,0.10)',
                  color: h.visibility === 'private' ? '#ef6c00' : T.forest
                }
              }, h.visibility === 'private' ? '🔒 Private' : '🌐 Public')
            )
          )
        ))
    ),

    // ── Edit Hunt Modal ──────────────────────────────────────────────
    editingHunt && e('div', {
      style: {
        position: 'fixed', inset: 0, background: 'rgba(26,32,28,0.55)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10100, padding: 16
      }
    },
      e('div', {
        style: {
          background: T.paper2, border: `1px solid ${T.border}`, borderRadius: 20,
          boxShadow: T.shadowLg, width: '100%', maxWidth: 440, padding: '22px 20px',
          boxSizing: 'border-box', fontFamily: T.font, display: 'flex', flexDirection: 'column', gap: 12
        }
      },
        // Header
        e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 } },
          e('div', { style: { fontSize: 15, fontWeight: 800, color: T.ink } },
            lang === 'es' ? '✏️ Editar Cacería' : '✏️ Edit Hunt'),
          e('button', {
            onClick: () => setEditingHunt(null),
            style: { background: 'none', border: 'none', fontSize: 22, color: T.ink3, cursor: 'pointer' }
          }, '×')
        ),
        // Name
        e('div', null,
          e('label', { style: { fontSize: 12, fontWeight: 700, color: T.ink2 } }, lang === 'es' ? 'Nombre' : 'Hunt Name'),
          e('input', {
            type: 'text', value: editingHunt.name,
            onChange: (ev) => setEditingHunt(eh => ({ ...eh, name: ev.target.value })),
            style: Object.assign({}, S.input, { marginTop: 4 })
          })
        ),
        // Description
        e('div', null,
          e('label', { style: { fontSize: 12, fontWeight: 700, color: T.ink2 } }, lang === 'es' ? 'Descripción' : 'Description'),
          e('textarea', {
            rows: 2, value: editingHunt.description || '',
            onChange: (ev) => setEditingHunt(eh => ({ ...eh, description: ev.target.value })),
            style: Object.assign({}, S.textarea, { marginTop: 4 })
          })
        ),
        // Dates
        e('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } },
          e('div', null,
            e('label', { style: { fontSize: 12, fontWeight: 700, color: T.ink2 } }, lang === 'es' ? 'Inicio' : 'Start Date'),
            e('input', {
              type: 'date', value: editingHunt.start_date_local || '',
              onChange: (ev) => setEditingHunt(eh => ({ ...eh, start_date_local: ev.target.value })),
              style: Object.assign({}, S.input, { marginTop: 4 })
            })
          ),
          e('div', null,
            e('label', { style: { fontSize: 12, fontWeight: 700, color: T.ink2 } }, lang === 'es' ? 'Fin' : 'End Date'),
            e('input', {
              type: 'date', value: editingHunt.end_date_local || '',
              onChange: (ev) => setEditingHunt(eh => ({ ...eh, end_date_local: ev.target.value })),
              style: Object.assign({}, S.input, { marginTop: 4 })
            })
          )
        ),
        // Visibility
        e('div', null,
          e('label', { style: { fontSize: 12, fontWeight: 700, color: T.ink2 } }, lang === 'es' ? 'Visibilidad' : 'Visibility'),
          e('select', {
            value: editingHunt.visibility,
            onChange: (ev) => setEditingHunt(eh => ({ ...eh, visibility: ev.target.value })),
            style: Object.assign({}, S.input, { height: 42, marginTop: 4 })
          },
            e('option', { value: 'public' }, lang === 'es' ? 'Pública — todos pueden unirse' : 'Public — open to everyone'),
            e('option', { value: 'private' }, lang === 'es' ? 'Privada — solo con enlace' : 'Private — shared link only')
          )
        ),
        // Save / Cancel
        e('div', { style: { display: 'flex', gap: 8, marginTop: 4 } },
          e('button', {
            onClick: () => setEditingHunt(null),
            style: Object.assign({}, S.btnOutline, { flex: 1 })
          }, lang === 'es' ? 'Cancelar' : 'Cancel'),
          e('button', {
            onClick: handleSaveEdit, disabled: editSaving,
            style: Object.assign({}, S.btn, {
              flex: 1, background: editSaving ? T.forest2 : T.forest,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            })
          },
            editSaving && e('div', { style: { width: 13, height: 13, border: '2px solid transparent', borderTopColor: T.paper, borderRadius: '50%', animation: 'spin 0.6s linear infinite' } }),
            lang === 'es' ? 'Guardar Cambios' : 'Save Changes'
          )
        )
      )
    ),

    (!loading && activeSubTab === 'discover') && e('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
      hunts.filter(h => h.creator !== uname && h.visibility === 'public').length === 0 ?
        e('div', { style: { textAlign: 'center', padding: '24px 0', color: T.ink3, fontStyle: 'italic', fontSize: 13.5 } },
          lang === 'es' ? "No hay búsquedas públicas disponibles para explorar." : "No public scavenger hunts available to explore.")
        :
        hunts.filter(h => h.creator !== uname && h.visibility === 'public').map(h => (
          e('div', {
            key: h.id,
            style: Object.assign({}, S.card, { margin: 0, padding: 14, background: T.paper2, display: 'flex', flexDirection: 'column', gap: 8 })
          },
            e('div', { style: { fontWeight: 700, fontSize: 15, color: T.ink } }, h.name),
            e('div', { style: { fontSize: 12.5, color: T.ink3 } }, h.description),
            e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 } },
              e('span', { style: { fontSize: 11, color: T.ink4 } }, `Limit: ${new Date(h.end_date).toLocaleDateString()}`),
              e('button', {
                onClick: () => handleEnroll(h),
                style: Object.assign({}, S.miniBtn, { background: T.forest, color: T.paper, border: 'none' })
              }, lang === 'es' ? "Participar" : "Enroll")
            )
          )
        ))
    ),

    // Active Play view
    (!loading && activeSubTab === 'active_play' && selectedHunt) && e('div', {
      style: { display: 'flex', flexDirection: 'column', gap: 14 }
    },
      // Back button header
      e('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
        e('button', {
          onClick: () => { setSelectedHunt(null); setActiveSubTab('my_hunts'); setShowRadar(false); },
          style: S.miniBtn
        }, lang === 'es' ? "Atrás" : "Back"),
        e('div', { style: { fontSize: 16, fontWeight: 800, color: T.ink, flex: 1 } }, selectedHunt.name),
        // Hunt Radar button
        activeStep && e('button', {
          onClick: () => setShowRadar(true),
          title: lang === 'es' ? 'Abrir Radar de Caza' : 'Open Hunt Radar',
          style: {
            background: 'linear-gradient(135deg, #1a3a22, #2e7d32)',
            border: 'none', borderRadius: 10,
            padding: '7px 13px', fontSize: 13, cursor: 'pointer',
            color: '#fff', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 5,
            boxShadow: '0 2px 8px rgba(46,125,50,0.35)'
          }
        }, '🧭 ', lang === 'es' ? 'Radar' : 'Radar')
      ),

      // Progress Tracker Card
      e('div', { style: { background: T.paper3, borderRadius: 14, padding: 14 } },
        e('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.ink3 } },
          e('span', null, lang === 'es' ? "Tus Puntos" : "Your points"),
          e('span', null, lang === 'es' ? "Progreso" : "Progress")
        ),
        e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 } },
          e('span', { style: { fontSize: 20, fontWeight: 800, color: T.forest } },
            `${participant ? participant.total_points : 0} pts`),
          e('span', { style: { fontSize: 14, fontWeight: 700, color: T.ink } },
            `${currentStepIndex} / ${huntSteps.length} Steps`)
        )
      ),

      // Check if Completed
      currentStepIndex >= huntSteps.length ?
        e('div', { style: { background: 'rgba(76, 175, 80, 0.08)', border: '1px solid rgba(76,175,80,0.15)', borderRadius: 14, padding: 16, textAlign: 'center' } },
          e('div', { style: { fontSize: 32 } }, '🏆'),
          e('div', { style: { fontSize: 16, fontWeight: 800, color: T.forest, marginTop: 8 } },
            lang === 'es' ? "¡Búsqueda Completada!" : "Hunt Completed!"),
          e('div', { style: { fontSize: 13, color: T.ink3, marginTop: 4 } },
            lang === 'es' ? "¡Has completado todos los pasos de este recorrido del tesoro!" : "You have finished all objectives for this hunt!")
        )
        :
        // Active Step Details
        activeStep && e('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
          e('div', { style: { fontSize: 12, fontFamily: T.mono, color: T.ink3, textTransform: 'uppercase' } },
            `${lang === 'es' ? "ETAPA ACTIVA" : "ACTIVE OBJECTIVE"} (${currentStepIndex + 1}/${huntSteps.length})`),
          
          // Clue Box
          e('div', { style: { background: T.paper2, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 } },
            e('div', { style: { fontSize: 11.5, color: T.ink3, fontWeight: 700, textTransform: 'uppercase' } },
              lang === 'es' ? "💡 PISTA" : "💡 CLUE"),
            e('div', { style: { fontSize: 14.5, color: T.ink, fontWeight: 700, marginTop: 4, lineHeight: 1.5 } },
              activeStep.clue)
          ),

          // Distance and Verification
          e('div', {
            style: {
              background: isWithin65Ft ? 'rgba(76, 175, 80, 0.08)' : T.paper3,
              border: `1px solid ${isWithin65Ft ? 'rgba(76,175,80,0.15)' : T.border}`,
              borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10
            }
          },
            e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
              e('div', null,
                e('div', { style: { fontSize: 11, color: T.ink3 } }, lang === 'es' ? "DISTANCIA AL PIN" : "DISTANCE TO OBJECTIVE"),
                e('div', { style: { fontSize: 16, fontWeight: 800, color: isWithin65Ft ? T.forest : T.ink, marginTop: 2 } },
                  formatDistance(currentDistanceFt))
              ),
              participant && e('button', {
                onClick: performCheckIn,
                disabled: checkingIn || !isWithin65Ft,
                style: Object.assign({}, S.miniBtn, {
                  background: isWithin65Ft ? T.forest : T.paper,
                  color: isWithin65Ft ? T.paper : T.ink3,
                  border: isWithin65Ft ? 'none' : `1px solid ${T.border}`,
                  fontWeight: 700, padding: '8px 16px', borderRadius: 10
                })
              }, checkingIn ? '...' : (lang === 'es' ? "Check-in" : "Check-in"))
            ),
            // Hot / Cold temperature indicator and direction trend
            currentDistanceFt !== null && e('div', {
              style: {
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingTop: 10, borderTop: `1px solid ${T.borderSoft}`, fontSize: 13
              }
            },
              (() => {
                const temp = getProximityTemp(currentDistanceFt);
                return e('div', { style: { display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: temp.color } },
                  e('span', null, temp.icon),
                  e('span', null, temp.label)
                );
              })(),
              trend && e('div', {
                style: {
                  fontSize: 12, fontWeight: 700,
                  color: trend === 'closer' ? T.forest : '#c62828'
                }
              },
                trend === 'closer' 
                  ? (lang === 'es' ? "¡Te estás acercando! 📈" : "Getting closer! 📈")
                  : (lang === 'es' ? "Te estás alejando... 📉" : "Getting farther... 📉")
              )
            )
          ),

          // Optional Step Modifiers (Bonuses)
          participant && e('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 } },
            e('div', { style: { fontSize: 12, fontWeight: 700, color: T.ink2 } },
              lang === 'es' ? "Misiones Extra (Bonos de Puntos)" : "Step Modifiers (Bonus Points)"),
            
            // Photo Modifier
            activeStep.point_rules.photo_upload && e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.paper2, padding: 10, borderRadius: 10, border: `1px solid ${T.borderSoft}` } },
              e('span', { style: { fontSize: 13, color: T.ink2 } },
                lang === 'es' ? `📸 Subir foto del lugar (+${activeStep.point_rules.photo_upload} pts)` : `📸 Upload photo of spot (+${activeStep.point_rules.photo_upload} pts)`),
              activityLogs.some(l => l.step_id === activeStep.id && l.activity_type === 'photo_upload') ?
                e('span', { style: { color: T.forest, fontWeight: 700, fontSize: 12 } }, '✓ Completed')
                :
                e('button', {
                  onClick: () => logModifierAction('photo_upload', 50),
                  style: S.miniBtn
                }, lang === 'es' ? "Subir" : "Upload")
            ),

            // Create & Link Trail Modifier
            activeStep.point_rules.create_trail && e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.paper2, padding: 10, borderRadius: 10, border: `1px solid ${T.borderSoft}` } },
              e('div', { style: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1 } },
                e('span', { style: { fontSize: 13, color: T.ink2 } },
                  lang === 'es' ? `🥾 Grabar y vincular ruta (+${activeStep.point_rules.create_trail} pts) (mín. 500 ft)` : `🥾 Record & link trail (+${activeStep.point_rules.create_trail} pts) (min. 500 ft)`),
                !activityLogs.some(l => l.step_id === activeStep.id && l.activity_type === 'create_trail') && e('span', { style: { fontSize: 11, color: T.ink3 } },
                  (() => {
                    const linked = trails.find(t => t.owner === uname && t.pin_id === activeStep.pin_id);
                    if (!linked) {
                      return lang === 'es' ? "Graba una ruta de al menos 500 pies y vincúlala a este pin desde la pestaña Perfil." : "Record a trail of at least 500 feet & link it to this pin from the Profile tab.";
                    }
                    const lenFeet = Math.round(linked.distance_km * 3280.84);
                    if (lenFeet < 500) {
                      return lang === 'es' ? `¡Ruta muy corta! ${lenFeet} pies de 500 requeridos.` : `Trail too short! ${lenFeet} ft of 500 required.`;
                    }
                    return lang === 'es' ? `¡Ruta válida detectada! (${lenFeet} pies)` : `Valid trail detected! (${lenFeet} ft)`;
                  })()
                )
              ),
              activityLogs.some(l => l.step_id === activeStep.id && l.activity_type === 'create_trail') ?
                e('span', { style: { color: T.forest, fontWeight: 700, fontSize: 12 } }, '✓ Completed')
                :
                e('button', {
                  onClick: () => {
                    const linked = trails.find(t => t.owner === uname && t.pin_id === activeStep.pin_id);
                    if (!linked) {
                      flash(lang === 'es' ? "No se detectó ninguna ruta vinculada a este pin." : "No linked trail detected for this pin yet.");
                      return;
                    }
                    const lenFeet = Math.round(linked.distance_km * 3280.84);
                    if (lenFeet < 500) {
                      flash(lang === 'es' ? `La ruta es muy corta (${lenFeet} ft). Debe tener al menos 500 ft.` : `The trail is too short (${lenFeet} ft). It must be at least 500 ft.`);
                      return;
                    }
                    logModifierAction('create_trail', 150);
                  },
                  style: Object.assign({}, S.miniBtn, {
                    background: (() => {
                      const linked = trails.find(t => t.owner === uname && t.pin_id === activeStep.pin_id);
                      return (linked && Math.round(linked.distance_km * 3280.84) >= 500) ? T.forest : T.paper;
                    })(),
                    color: (() => {
                      const linked = trails.find(t => t.owner === uname && t.pin_id === activeStep.pin_id);
                      return (linked && Math.round(linked.distance_km * 3280.84) >= 500) ? T.paper : T.ink3;
                    })()
                  })
                }, lang === 'es' ? "Verificar" : "Verify")
            ),

            // Comment / Journal Modifier
            activeStep.point_rules.comment && e('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, background: T.paper2, padding: 10, borderRadius: 10, border: `1px solid ${T.borderSoft}` } },
              e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
                e('span', { style: { fontSize: 13, color: T.ink2 } },
                  lang === 'es' ? `✍️ Escribir en la bitácora (+${activeStep.point_rules.comment} pts)` : `✍️ Write field journal entry (+${activeStep.point_rules.comment} pts)`),
                activityLogs.some(l => l.step_id === activeStep.id && l.activity_type === 'comment') ?
                  e('span', { style: { color: T.forest, fontWeight: 700, fontSize: 12 } }, '✓ Completed')
                  :
                  e('button', {
                    onClick: () => setWritingComment(writingComment ? null : activeStep),
                    style: S.miniBtn
                  }, lang === 'es' ? "Escribir" : "Write")
              ),
              
              // Writing comment sub-input
              writingComment === activeStep && e('div', { style: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 } },
                e('label', { htmlFor: 'field-journal-input', style: { fontSize: 11.5, color: T.ink3, fontWeight: 700 } },
                  lang === 'es' ? "Observaciones de la bitácora" : "Field Journal Observations"),
                e('textarea', {
                  id: 'field-journal-input',
                  name: 'field_journal',
                  rows: 2,
                  placeholder: lang === 'es' ? "Escribe tus observaciones aquí..." : "Write your observations here...",
                  value: commentText,
                  onChange: (e) => setCommentText(e.target.value),
                  style: S.textarea
                }),
                e('button', {
                  onClick: submitFieldJournal,
                  style: Object.assign({}, S.miniBtn, { background: T.forest, color: T.paper, border: 'none', alignSelf: 'flex-end' })
                }, lang === 'es' ? "Guardar diario" : "Save Journal")
              )
            )
          )
        ),

      // Leaderboard section for this hunt
      leaderboard.length > 0 && e('div', { style: { marginTop: 16 } },
        e('div', { style: { fontSize: 12, fontWeight: 700, color: T.ink2, marginBottom: 8 } },
          lang === 'es' ? "Tabla de Posiciones" : "Leaderboard"),
        e('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
          leaderboard.map((player, pIdx) => (
            e('div', {
              key: pIdx,
              style: {
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: player.user_id === uname ? T.forestPale : T.paper2,
                padding: '8px 12px', borderRadius: 8, border: `1px solid ${player.user_id === uname ? T.forest : T.borderSoft}`
              }
            },
              e('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
                e('span', { style: { fontWeight: 700, fontSize: 12, color: T.ink3 } }, `#${pIdx + 1}`),
                e('span', { style: { fontWeight: 700, fontSize: 13, color: T.ink } }, `@${player.user_id}`),
                player.status === 'completed' && e('span', { style: { fontSize: 10, background: T.forest, color: T.paper, padding: '1px 5px', borderRadius: 4 } }, 'Finished')
              ),
              e('span', { style: { fontWeight: 700, fontSize: 13, color: T.forest } }, `${player.total_points} pts`)
            ))
          ))
      )
    )
  ), // end panel div

  // Hunt Radar Overlay — full-screen, rendered outside panel
  showRadar && activeStep && e(HuntRadarOverlay, {
    pin: pins.find(p => p.id === activeStep.pin_id) || null,
    userLL: userLL,
    distanceFt: currentDistanceFt,
    trend: trend,
    lang: lang,
    onClose: () => setShowRadar(false)
  })

  ); // end Fragment
}
