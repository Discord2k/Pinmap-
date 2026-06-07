import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { T, S } from '../utils/styles';
import { distKm } from '../utils/helpers';
import { HuntRadarOverlay } from './HuntRadarOverlay';

const e = React.createElement;

export function ScavengerHuntsPanel({ uname, userLL, pins = [], trails = [], lang = 'en', flash, initialHuntsTab = 'my_hunts', huntsUpdateTrigger, onHuntProgress }) {
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
  const [deletingHunt, setDeletingHunt] = useState(null); // hunt object queued for deletion
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [userEnrollments, setUserEnrollments] = useState([]); // hunt participant records for current user
  
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
        const enrollments = await api.getUserEnrollments(uname);
        setUserEnrollments(enrollments);
      } else {
        setUserEnrollments([]);
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

  // Sync state if check-in happens outside of this component (e.g., from map check-ins)
  useEffect(() => {
    if (huntsUpdateTrigger) {
      loadHuntsData();
      if (selectedHunt) {
        handleSelectHunt(selectedHunt);
      }
    }
  }, [huntsUpdateTrigger]);

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
        visibility: editingHunt.visibility,
        completion_message: editingHunt.completion_message || null,
        completion_url: editingHunt.completion_url || null
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

  // --- Delete hunt handler ---
  const handleDeleteHunt = async () => {
    if (!deletingHunt) return;
    setDeleteSaving(true);
    try {
      await api.deleteHunt(deletingHunt.id);
      flash(lang === 'es' ? '🗑️ Cacería eliminada.' : '🗑️ Hunt deleted successfully!');
      setDeletingHunt(null);
      loadHuntsData();
    } catch (err) {
      console.error('Failed to delete hunt:', err);
      flash(lang === 'es' ? 'Error al eliminar la cacería.' : 'Error deleting the hunt.');
    } finally {
      setDeleteSaving(false);
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
    if (points >= 1500) {
      return {
        title: lang === 'es' ? "Rastreador Leyenda" : "Legendary Tracker",
        icon: e('svg', { width: 32, height: 32, viewBox: '0 0 24 24', fill: 'none', stroke: '#ffd700', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
          e('path', { d: 'M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z' }),
          e('path', { d: 'M3 20h18' })
        )
      };
    }
    if (points >= 800) {
      return {
        title: lang === 'es' ? "Explorador Maestro" : "Master Explorer",
        icon: e('svg', { width: 32, height: 32, viewBox: '0 0 24 24', fill: 'none', stroke: '#c0c0c0', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
          e('path', { d: 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6' }),
          e('path', { d: 'M18 9h1.5a2.5 2.5 0 0 0 0-5H18' }),
          e('path', { d: 'M4 22h16' }),
          e('path', { d: 'M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22' }),
          e('path', { d: 'M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22' }),
          e('path', { d: 'M18 2H6v7a6 6 0 0 0 12 0V2z' })
        )
      };
    }
    if (points >= 300) {
      return {
        title: lang === 'es' ? "Guía de Ruta" : "Trailblazer",
        icon: e('svg', { width: 32, height: 32, viewBox: '0 0 24 24', fill: 'none', stroke: '#cd7f32', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
          e('circle', { cx: '12', cy: '12', r: '10' }),
          e('polygon', { points: '16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76' })
        )
      };
    }
    return {
      title: lang === 'es' ? "Iniciado" : "Scout",
      icon: e('svg', { width: 32, height: 32, viewBox: '0 0 24 24', fill: 'none', stroke: '#8d6e63', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
        e('polygon', { points: '3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21' }),
        e('line', { x1: '9', y1: '3', x2: '9', y2: '18' }),
        e('line', { x1: '15', y1: '6', x2: '15', y2: '21' })
      )
    };
  };

  const badgeTier = getBadgeTier(profileStats.accrued_points);

  // Active play computations
  const currentStepIndex = React.useMemo(() => {
    if (!huntSteps.length) return 0;
    for (let i = 0; i < huntSteps.length; i++) {
      const step = huntSteps[i];
      const stepLogs = activityLogs.filter(l => l.step_id === step.id);
      const loggedTypes = stepLogs.map(l => l.activity_type);
      const requiredTypes = Object.keys(step.point_rules || {});
      const remainingTypes = requiredTypes.filter(t => loggedTypes.indexOf(t) < 0);
      if (remainingTypes.length > 0) return i;
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
    if (distFt === null) return { label: '', color: '', icon: null };
    if (distFt <= 65) return {
      label: lang === 'es' ? "¡Aquí mismo!" : "Right Here!",
      color: '#2e7d32',
      icon: e('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: '#2e7d32', strokeWidth: 2.5, style: { flexShrink: 0 } },
        e('circle', { cx: '12', cy: '12', r: '10' }),
        e('circle', { cx: '12', cy: '12', r: '6' }),
        e('circle', { cx: '12', cy: '12', r: '2' })
      )
    };
    if (distFt <= 260) return {
      label: lang === 'es' ? "¡Hirviendo!" : "Burning Hot!",
      color: '#d84315',
      icon: e('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: '#d84315', strokeWidth: 2.5, style: { flexShrink: 0 } },
        e('path', { d: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3zM12 21a4 4 0 0 0 4-4c0-.88-.3-1.3-.6-1.9-.686-1.372-.143-2.6 1.28-3.8.3 1.6 1.3 3.1 2.5 4.1C20.3 16.4 21 17.6 21 18.9a6 6 0 1 1-12 0c0-.74.277-1.46.6-1.9a1.6 1.6 0 0 0 1.6 1.9z' })
      )
    };
    if (distFt <= 820) return {
      label: lang === 'es' ? "Caliente" : "Hot",
      color: '#ef6c00',
      icon: e('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: '#ef6c00', strokeWidth: 2.5, style: { flexShrink: 0 } },
        e('path', { d: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z' })
      )
    };
    if (distFt <= 1960) return {
      label: lang === 'es' ? "Tibio" : "Warm",
      color: '#fbc02d',
      icon: e('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: '#fbc02d', strokeWidth: 2.5, style: { flexShrink: 0 } },
        e('circle', { cx: '12', cy: '12', r: '4' }),
        e('path', { d: 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41' })
      )
    };
    return {
      label: lang === 'es' ? "Frío" : "Cold",
      color: '#1565c0',
      icon: e('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: '#1565c0', strokeWidth: 2.5, style: { flexShrink: 0 } },
        e('line', { x1: '12', y1: '2', x2: '12', y2: '22' }),
        e('line', { x1: '2', y1: '12', x2: '22', y2: '12' }),
        e('line', { x1: '4.93', y1: '4.93', x2: '19.07', y2: '19.07' }),
        e('line', { x1: '19.07', y1: '4.93', x2: '4.93', y2: '19.07' })
      )
    };
  };

  const performCheckIn = async () => {
    if (!isWithin65Ft) {
      flash(lang === 'es' ? "Debes estar a menos de 65 pies del objetivo." : "You must be within 65 feet of the objective.");
      return;
    }
    setCheckingIn(true);
    try {
      const checkinPoints = activeStep.point_rules.check_in || 100;
      const alreadyLogged = activityLogs.some(l => l.step_id === activeStep.id && l.activity_type === 'check_in');
      let addedPoints = 0;
      if (!alreadyLogged) {
        await api.logHuntActivity(participant.id, activeStep.id, 'check_in', checkinPoints);
        addedPoints = checkinPoints;
      }
      
      const newLogs = await api.getHuntActivityLogs(participant.id);
      setActivityLogs(newLogs);
      
      const stepLogs = newLogs.filter(l => l.step_id === activeStep.id);
      const loggedTypes = stepLogs.map(l => l.activity_type);
      const requiredTypes = Object.keys(activeStep.point_rules || {});
      const remainingTypes = requiredTypes.filter(t => loggedTypes.indexOf(t) < 0);
      
      const newPoints = participant.total_points + addedPoints;
      const allDone = currentStepIndex === huntSteps.length - 1;
      
      if (remainingTypes.length === 0) {
        const newStatus = allDone ? 'completed' : 'enrolled';
        const updatedPart = await api.updateParticipantStatus(participant.id, newStatus, newPoints);
        setParticipant(updatedPart);
        if (allDone) {
          flash(lang === 'es' ? `🏆 ¡Felicidades! ¡Completaste toda la búsqueda "${selectedHunt.name}"!` : `🏆 Congratulations! You completed the entire scavenger hunt "${selectedHunt.name}"!`);
        } else {
          flash(lang === 'es' ? "📍 ¡Etapa de la búsqueda completada! Siguiente pista revelada." : "📍 Hunt step completed! Next clue unlocked.");
        }
      } else {
        const updatedPart = await api.updateParticipantStatus(participant.id, participant.status, newPoints);
        setParticipant(updatedPart);
        const remainingLabels = remainingTypes.map(t => {
          if (t === 'check_in') return lang === 'es' ? 'Registrar visita' : 'Check-in';
          if (t === 'photo_upload') return lang === 'es' ? 'Subir foto' : 'Photo upload';
          if (t === 'comment') return lang === 'es' ? 'Bitácora' : 'Journal comment';
          if (t === 'create_trail') return lang === 'es' ? 'Vincular ruta' : 'Link trail';
          return t;
        });
        flash(lang === 'es' ? "📍 ¡Check-in verificado! Tareas restantes: " + remainingLabels.join(", ") : "📍 Check-in verified! Remaining tasks: " + remainingLabels.join(", "));
      }
      
      loadHuntsData();
      handleSelectHunt(selectedHunt);
      if (onHuntProgress) onHuntProgress();
    } catch (err) {
      console.error("Failed to check in:", err);
      flash(lang === 'es' ? "Error al realizar check-in." : "Error performing check-in.");
    } finally {
      setCheckingIn(false);
    }
  };

  const logModifierAction = async (actionType, defaultPoints) => {
    if (!participant || !activeStep) return;
    const alreadyLogged = activityLogs.some(l => l.step_id === activeStep.id && l.activity_type === actionType);
    if (alreadyLogged) return;

    try {
      const points = activeStep.point_rules[actionType] || defaultPoints;
      await api.logHuntActivity(participant.id, activeStep.id, actionType, points);
      
      const newLogs = await api.getHuntActivityLogs(participant.id);
      setActivityLogs(newLogs);

      const stepLogs = newLogs.filter(l => l.step_id === activeStep.id);
      const loggedTypes = stepLogs.map(l => l.activity_type);
      const requiredTypes = Object.keys(activeStep.point_rules || {});
      const remainingTypes = requiredTypes.filter(t => loggedTypes.indexOf(t) < 0);

      const newPoints = participant.total_points + points;
      const allDone = currentStepIndex === huntSteps.length - 1;

      if (remainingTypes.length === 0) {
        const newStatus = allDone ? 'completed' : 'enrolled';
        const updatedPart = await api.updateParticipantStatus(participant.id, newStatus, newPoints);
        setParticipant(updatedPart);
        if (allDone) {
          flash(lang === 'es' ? `🏆 ¡Felicidades! ¡Completaste toda la búsqueda "${selectedHunt.name}"!` : `🏆 Congratulations! You completed the entire scavenger hunt "${selectedHunt.name}"!`);
        } else {
          flash(lang === 'es' ? "📍 ¡Etapa de la búsqueda completada! Siguiente pista revelada." : "📍 Hunt step completed! Next clue unlocked.");
        }
      } else {
        const updatedPart = await api.updateParticipantStatus(participant.id, participant.status, newPoints);
        setParticipant(updatedPart);
        const remainingLabels = remainingTypes.map(t => {
          if (t === 'check_in') return lang === 'es' ? 'Registrar visita' : 'Check-in';
          if (t === 'photo_upload') return lang === 'es' ? 'Subir foto' : 'Photo upload';
          if (t === 'comment') return lang === 'es' ? 'Bitácora' : 'Journal comment';
          if (t === 'create_trail') return lang === 'es' ? 'Vincular ruta' : 'Link trail';
          return t;
        });
        flash(lang === 'es' ? "✨ ¡Tarea registrada! Tareas restantes: " + remainingLabels.join(", ") : "✨ Task registered! Remaining tasks: " + remainingLabels.join(", "));
      }
      
      loadHuntsData();
      handleSelectHunt(selectedHunt);
      if (onHuntProgress) onHuntProgress();
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
      e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center' } }, badgeTier.icon),
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
    (!loading && activeSubTab === 'my_hunts') && e('div', { style: { display: 'flex', flexDirection: 'column', gap: 18 } },
      // Section 1: Created Hunts
      e('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
        e('div', { style: { fontSize: 11, fontWeight: 700, color: T.ink3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 } },
          lang === 'es' ? "Creadas por Mí" : "Created by Me"),
        hunts.filter(h => h.creator === uname).length === 0 ? 
          e('div', { style: { textAlign: 'center', padding: '16px 0', color: T.ink4, fontStyle: 'italic', fontSize: 13, background: T.paper3, borderRadius: 10 } },
            lang === 'es' ? "Aún no has creado cacerías." : "You haven't created any hunts yet.")
          :
          e('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
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
                    ),
                    // Delete button
                    e('button', {
                      onClick: (ev) => {
                        ev.stopPropagation();
                        setDeletingHunt(h);
                      },
                      title: lang === 'es' ? 'Eliminar cacería' : 'Delete hunt',
                      style: {
                        background: 'none', border: '1px solid rgba(192, 80, 80, 0.25)', borderRadius: 8,
                        padding: '4px 9px', fontSize: 13, cursor: 'pointer', color: '#c05050',
                        display: 'flex', alignItems: 'center'
                      }
                    },
                      e('svg', { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
                        e('polyline', { points: '3 6 5 6 21 6' }),
                        e('path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }),
                        e('line', { x1: '10', y1: '11', x2: '10', y2: '17' }),
                        e('line', { x1: '14', y1: '11', x2: '14', y2: '17' })
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
                  }, h.visibility === 'private' ? 
                    e('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 4 } },
                      e('svg', { width: 11, height: 11, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2 },
                        e('rect', { x: 3, y: 11, width: 18, height: 11, rx: 2, ry: 2 }),
                        e('path', { d: 'M7 11V7a5 5 0 0 1 10 0v4' })
                      ),
                      lang === 'es' ? 'Privada' : 'Private'
                    ) : 
                    e('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 4 } },
                      e('svg', { width: 11, height: 11, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2 },
                        e('circle', { cx: 12, cy: 12, r: 10 }),
                        e('line', { x1: 2, y1: 12, x2: 22, y2: 12 }),
                        e('path', { d: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' })
                      ),
                      lang === 'es' ? 'Pública' : 'Public'
                    )
                  )
                )
              )
            ))
          )
      ),

      // Section 2: Joined & Participating Hunts
      e('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
        e('div', { style: { fontSize: 11, fontWeight: 700, color: T.ink3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 } },
          lang === 'es' ? "Búsquedas en Curso / Unidas" : "Joined & Participating Hunts"),
        hunts.filter(h => h.creator !== uname && userEnrollments.some(enroll => enroll.hunt_id === h.id)).length === 0 ? 
          e('div', { style: { textAlign: 'center', padding: '16px 0', color: T.ink4, fontStyle: 'italic', fontSize: 13, background: T.paper3, borderRadius: 10 } },
            lang === 'es' ? "No te has unido a ninguna búsqueda todavía." : "You haven't joined any hunts yet.")
          :
          e('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
            hunts.filter(h => h.creator !== uname && userEnrollments.some(enroll => enroll.hunt_id === h.id)).map(h => {
              const enroll = userEnrollments.find(e_rec => e_rec.hunt_id === h.id);
              const statusLabel = enroll.status === 'completed'
                ? e('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 4, color: T.forest } },
                    e('svg', { width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
                      e('path', { d: 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6' }),
                      e('path', { d: 'M18 9h1.5a2.5 2.5 0 0 0 0-5H18' }),
                      e('path', { d: 'M4 22h16' }),
                      e('path', { d: 'M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22' }),
                      e('path', { d: 'M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22' }),
                      e('path', { d: 'M18 2H6v7a6 6 0 0 0 12 0V2z' })
                    ),
                    lang === 'es' ? 'Completado' : 'Completed'
                  )
                : e('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 4, color: T.ink3 } },
                    e('svg', { width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
                      e('circle', { cx: 12, cy: 12, r: 10 }),
                      e('polyline', { points: '12 6 12 12 16 14' })
                    ),
                    lang === 'es' ? 'En progreso' : 'In Progress'
                  );
              return e('div', {
                key: h.id,
                style: Object.assign({}, S.card, { margin: 0, padding: 14, background: T.paper2, cursor: 'pointer' }),
                onClick: () => handleSelectHunt(h)
              },
                e('div', { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 } },
                  e('div', { style: { fontWeight: 700, fontSize: 15, color: T.ink, flex: 1 } }, h.name),
                  e('span', { style: { fontSize: 11, fontWeight: 700, color: T.forest, background: 'rgba(46,125,50,0.08)', padding: '2px 7px', borderRadius: 5 } }, `${enroll.total_points || 0} pts`)
                ),
                e('div', { style: { fontSize: 12.5, color: T.ink3, marginTop: 6 } }, h.description),
                e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 11, fontFamily: T.mono, color: T.ink4 } },
                  e('span', null, statusLabel),
                  e('span', null, `By: @${h.creator}`)
                )
              );
            })
          )
      )
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
          e('div', { style: { fontSize: 15, fontWeight: 800, color: T.ink, display: 'flex', alignItems: 'center', gap: 6 } },
            e('svg', { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2 },
              e('path', { d: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' }),
              e('path', { d: 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' })
            ),
            lang === 'es' ? 'Editar Cacería' : 'Edit Hunt'),
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
        // Completion Message
        e('div', null,
          e('label', { style: { fontSize: 12, fontWeight: 700, color: T.ink2 } }, lang === 'es' ? 'Mensaje de Finalización' : 'Completion Message'),
          e('textarea', {
            rows: 2, value: editingHunt.completion_message || '',
            onChange: (ev) => setEditingHunt(eh => ({ ...eh, completion_message: ev.target.value })),
            style: Object.assign({}, S.textarea, { marginTop: 4 })
          })
        ),
        // Completion URL
        e('div', null,
          e('label', { style: { fontSize: 12, fontWeight: 700, color: T.ink2 } }, lang === 'es' ? 'URL de Finalización' : 'Completion URL'),
          e('input', {
            type: 'url', value: editingHunt.completion_url || '',
            onChange: (ev) => setEditingHunt(eh => ({ ...eh, completion_url: ev.target.value })),
            style: Object.assign({}, S.input, { marginTop: 4 })
          })
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

    // ── Delete Hunt Modal ─────────────────────────────────────────────
    deletingHunt && e('div', {
      style: {
        position: 'fixed', inset: 0, background: 'rgba(26,32,28,0.55)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10100, padding: 16
      }
    },
      e('div', {
        style: {
          background: T.paper2, border: `1px solid ${T.border}`, borderRadius: 20,
          boxShadow: T.shadowLg, width: '100%', maxWidth: 400, padding: '22px 20px',
          boxSizing: 'border-box', fontFamily: T.font, display: 'flex', flexDirection: 'column', gap: 14
        }
      },
        // Header / Icon
        e('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center', margin: '8px 0' } },
          e('div', { style: { width: 48, height: 48, borderRadius: '50%', background: 'rgba(192, 80, 80, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c05050' } },
            e('svg', { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
              e('polyline', { points: '3 6 5 6 21 6' }),
              e('path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' })
            )
          ),
          e('div', { style: { fontSize: 16, fontWeight: 800, color: T.ink } },
            lang === 'es' ? '¿Eliminar Cacería?' : 'Delete Scavenger Hunt?'),
          e('div', { style: { fontSize: 13, color: T.ink3, lineHeight: '1.4' } },
            lang === 'es' 
              ? `¿Estás seguro de que deseas eliminar "${deletingHunt.name}"? Esta acción no se puede deshacer.`
              : `Are you sure you want to delete "${deletingHunt.name}"? This action cannot be undone.`)
        ),
        // Actions
        e('div', { style: { display: 'flex', gap: 8, marginTop: 4 } },
          e('button', {
            onClick: () => setDeletingHunt(null),
            style: Object.assign({}, S.btnOutline, { flex: 1 })
          }, lang === 'es' ? 'Cancelar' : 'Cancel'),
          e('button', {
            onClick: handleDeleteHunt, disabled: deleteSaving,
            style: Object.assign({}, S.btn, {
              flex: 1, background: deleteSaving ? '#b04040' : '#c05050',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            })
          },
            deleteSaving && e('div', { style: { width: 13, height: 13, border: '2px solid transparent', borderTopColor: T.paper, borderRadius: '50%', animation: 'spin 0.6s linear infinite' } }),
            lang === 'es' ? 'Eliminar' : 'Delete'
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
        }, e('svg', { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, style: { flexShrink: 0 } },
            e('circle', { cx: '12', cy: '12', r: '10' }),
            e('polygon', { points: '16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76' })
          ), lang === 'es' ? 'Radar' : 'Radar')
      ),

      // Enrollment Call-To-Action if not enrolled
      !participant && e('div', {
        style: {
          background: 'rgba(46,125,50,0.06)', border: `1px dashed ${T.forest}`,
          borderRadius: 14, padding: 18, textAlign: 'center',
          display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4
        }
      },
        e('div', { style: { fontSize: 14.5, fontWeight: 700, color: T.forest, lineHeight: 1.4 } },
          selectedHunt.creator === uname 
            ? (lang === 'es' ? "Eres el creador de esta búsqueda. Inscríbete para probarla y verificar los check-ins." : "You are the creator of this hunt. Enroll to play/test it and verify check-ins.")
            : (lang === 'es' ? "Aún no te has inscrito en esta búsqueda." : "You are not enrolled in this hunt yet.")
        ),
        e('button', {
          onClick: () => handleEnroll(selectedHunt),
          style: Object.assign({}, S.btn, {
            background: T.forest, color: T.paper, border: 'none',
            alignSelf: 'center', padding: '10px 24px', borderRadius: 10,
            fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(46,125,50,0.25)'
          })
        }, lang === 'es' ? "Inscribirse y Empezar" : "Enroll & Start")
      ),

      // Progress Tracker Card
      participant && e('div', { style: { background: T.paper3, borderRadius: 14, padding: 14 } },
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
      participant && (currentStepIndex >= huntSteps.length ?
        e('div', { style: { background: 'rgba(76, 175, 80, 0.08)', border: '1px solid rgba(76,175,80,0.15)', borderRadius: 16, padding: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' } },
          e('svg', { width: 42, height: 42, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, style: { color: T.forest } },
            e('path', { d: 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6' }),
            e('path', { d: 'M18 9h1.5a2.5 2.5 0 0 0 0-5H18' }),
            e('path', { d: 'M4 22h16' }),
            e('path', { d: 'M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22' }),
            e('path', { d: 'M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22' }),
            e('path', { d: 'M18 2H6v7a6 6 0 0 0 12 0V2z' })
          ),
          e('div', { style: { fontSize: 18, fontWeight: 800, color: T.forest } },
            lang === 'es' ? "¡Búsqueda Completada!" : "Hunt Completed!"),
          e('div', { style: { fontSize: 14, color: T.ink2, lineHeight: 1.5 } },
            selectedHunt.completion_message || (lang === 'es' ? "¡Has completado todos los pasos de este recorrido del tesoro!" : "You have finished all objectives for this hunt!")),
          selectedHunt.completion_url && e('a', {
            href: selectedHunt.completion_url,
            target: '_blank',
            rel: 'noopener noreferrer',
            style: {
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: T.forest, color: T.paper, textDecoration: 'none',
              padding: '10px 20px', borderRadius: 10, fontSize: 13.5, fontWeight: 700,
              boxShadow: '0 2px 8px rgba(46,125,50,0.35)', marginTop: 4, cursor: 'pointer'
            }
          }, lang === 'es' ? "Ver Recompensa / Enlace " : "Claim Reward / View Link ", e('svg', { width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, style: { marginLeft: 4, display: 'inline-block', verticalAlign: 'middle' } },
            e('path', { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }),
            e('polyline', { points: '15 3 21 3 21 9' }),
            e('line', { x1: 10, y1: 14, x2: 21, y2: 3 })
          ))
        )
        :
        // Active Step Details
        activeStep && e('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
          e('div', { style: { fontSize: 12, fontFamily: T.mono, color: T.ink3, textTransform: 'uppercase' } },
            `${lang === 'es' ? "ETAPA ACTIVA" : "ACTIVE OBJECTIVE"} (${currentStepIndex + 1}/${huntSteps.length})`),
          
          // Clue Box
          e('div', { style: { background: T.paper2, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 } },
            e('div', { style: { fontSize: 11.5, color: T.ink3, fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 } },
              e('svg', { width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
                e('path', { d: 'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5' }),
                e('line', { x1: 9, y1: 18, x2: 15, y2: 18 }),
                e('line', { x1: 10, y1: 22, x2: 14, y2: 22 })
              ),
              lang === 'es' ? "PISTA" : "CLUE"
            ),
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
                if (!temp || !temp.label) return null;
                return e('div', { style: { display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: temp.color } },
                  e('span', { style: { display: 'flex', alignItems: 'center' } }, temp.icon),
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
              e('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
                e('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, style: { color: T.ink3 } },
                  e('path', { d: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z' }),
                  e('circle', { cx: 12, cy: 13, r: 4 })
                ),
                e('span', { style: { fontSize: 13, color: T.ink2 } },
                  lang === 'es' ? `Subir foto del lugar (+${activeStep.point_rules.photo_upload} pts)` : `Upload photo of spot (+${activeStep.point_rules.photo_upload} pts)`)
              ),
              activityLogs.some(l => l.step_id === activeStep.id && l.activity_type === 'photo_upload') ?
                e('span', { style: { color: T.forest, fontWeight: 700, fontSize: 12 } }, '✓ Completed')
                :
                e('span', { style: { color: T.ink3, fontSize: 11.5, fontStyle: 'italic' } },
                  lang === 'es' ? "(En el detalle del pin)" : "(From pin detail)")
            ),

            // Create & Link Trail Modifier
            activeStep.point_rules.create_trail && e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.paper2, padding: 10, borderRadius: 10, border: `1px solid ${T.borderSoft}` } },
              e('div', { style: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1 } },
                e('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
                  e('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, style: { color: T.ink3 } },
                    e('path', { d: 'M3 7V5a2 2 0 0 1 2-2h2' }),
                    e('path', { d: 'M17 3h2a2 2 0 0 1 2 2v2' }),
                    e('path', { d: 'M21 17v2a2 2 0 0 1-2 2h-2' }),
                    e('path', { d: 'M7 21H5a2 2 0 0 1-2-2v-2' }),
                    e('circle', { cx: 12, cy: 12, r: 3 })
                  ),
                  e('span', { style: { fontSize: 13, color: T.ink2 } },
                    lang === 'es' ? `Grabar y vincular ruta (+${activeStep.point_rules.create_trail} pts)` : `Record & link trail (+${activeStep.point_rules.create_trail} pts)`)
                ),
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
            activeStep.point_rules.comment && e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.paper2, padding: 10, borderRadius: 10, border: `1px solid ${T.borderSoft}` } },
              e('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
                e('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, style: { color: T.ink3 } },
                  e('path', { d: 'M12 20h9' }),
                  e('path', { d: 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 9.5-9.5z' })
                ),
                e('span', { style: { fontSize: 13, color: T.ink2 } },
                  lang === 'es' ? `Escribir en la bitácora (+${activeStep.point_rules.comment} pts)` : `Write field journal entry (+${activeStep.point_rules.comment} pts)`)
              ),
              activityLogs.some(l => l.step_id === activeStep.id && l.activity_type === 'comment') ?
                e('span', { style: { color: T.forest, fontWeight: 700, fontSize: 12 } }, '✓ Completed')
                :
                e('span', { style: { color: T.ink3, fontSize: 11.5, fontStyle: 'italic' } },
                  lang === 'es' ? "(En el detalle del pin)" : "(From pin detail)")
            )
          )
        )),

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
