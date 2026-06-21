import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { T, S } from '../utils/styles';
import { distKm } from '../utils/helpers';
import { HuntRadarOverlay } from './HuntRadarOverlay';
import { QRScannerModal } from './QRScannerModal';
import { PhotostreamTab } from './PhotostreamTab';
import TeamRegistrationCard from './TeamRegistrationCard';

const e = React.createElement;

export function ScavengerHuntsPanel({ uname, userLL, pins = [], trails = [], lang = 'en', flash, initialHuntsTab = 'my_hunts', huntsUpdateTrigger, onHuntProgress }) {
  const [activeSubTab, setActiveSubTab] = useState(initialHuntsTab); // my_hunts, active_play
  const [hunts, setHunts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Active Play states
  const [selectedHunt, setSelectedHunt] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [teamDetails, setTeamDetails] = useState(null); // { team: {name, invite_code, ...}, members: [...] }
  const [showEnrollCard, setShowEnrollCard] = useState(false);
  const [huntSteps, setHuntSteps] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [checkingIn, setCheckingIn] = useState(false);
  const [writingComment, setWritingComment] = useState(null); // step object when writing
  const [commentText, setCommentText] = useState('');
  const [prevDistance, setPrevDistance] = useState(null);
  const [trend, setTrend] = useState(null); // 'closer', 'farther', null
  const [showRadar, setShowRadar] = useState(false);
  const [triviaAnswer, setTriviaAnswer] = useState('');
  const [selectedMCQ, setSelectedMCQ] = useState(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [playTab, setPlayTab] = useState('objectives');
  const [submissions, setSubmissions] = useState([]);
  const [editingHunt, setEditingHunt] = useState(null); // hunt object being edited
  const [editSaving, setEditSaving] = useState(false);
  const [deletingHunt, setDeletingHunt] = useState(null); // hunt object queued for deletion
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [userEnrollments, setUserEnrollments] = useState([]); // hunt participant records for current user
  const [selectedStepId, setSelectedStepId] = useState(null);
  const [editShowAllPins, setEditShowAllPins] = useState(false);
  const [editSearchQueries, setEditSearchQueries] = useState({});
  
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
    if (initialHuntsTab) {
      setActiveSubTab(initialHuntsTab);
    }
  }, [initialHuntsTab]);

  // Auto-select active enrolled hunt if opening active play tab directly
  useEffect(() => {
    if (activeSubTab === 'active_play' && !selectedHunt && hunts.length > 0 && userEnrollments.length > 0) {
      const activeEnroll = userEnrollments.find(e => e.status === 'enrolled');
      if (activeEnroll) {
        const activeHuntObj = hunts.find(h => h.id === activeEnroll.hunt_id);
        if (activeHuntObj) {
          handleSelectHunt(activeHuntObj);
        }
      }
    }
  }, [activeSubTab, hunts, userEnrollments, selectedHunt]);

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
    if (editingHunt.steps) {
      if (editingHunt.steps.some(s => !s.pin_id)) {
        flash(lang === 'es' ? "Todos los pasos deben tener un pin seleccionado." : "All steps must have a selected pin.");
        return;
      }
      if (editingHunt.steps.some(s => !s.clue.trim())) {
        flash(lang === 'es' ? "Por favor escribe una pista para cada paso." : "Please write a clue for each step.");
        return;
      }
    }
    setEditSaving(true);
    try {
      let sTimePart = "00:00";
      if (editingHunt.start_time) {
        const oldSDate = new Date(editingHunt.start_time);
        if (!isNaN(oldSDate.getTime())) {
          const hours = String(oldSDate.getHours()).padStart(2, '0');
          const minutes = String(oldSDate.getMinutes()).padStart(2, '0');
          sTimePart = `${hours}:${minutes}`;
        }
      }
      let eTimePart = "23:59";
      if (editingHunt.end_time) {
        const oldEDate = new Date(editingHunt.end_time);
        if (!isNaN(oldEDate.getTime())) {
          const hours = String(oldEDate.getHours()).padStart(2, '0');
          const minutes = String(oldEDate.getMinutes()).padStart(2, '0');
          eTimePart = `${hours}:${minutes}`;
        }
      }

      const sDateObj = new Date(`${editingHunt.start_date_local.replace(/-/g, '/')} ${sTimePart}`);
      const eDateObj = new Date(`${editingHunt.end_date_local.replace(/-/g, '/')} ${eTimePart}`);

      await api.updateHunt(editingHunt.id, {
        name: editingHunt.name,
        description: editingHunt.description,
        start_date: sDateObj.toISOString(),
        end_date: eDateObj.toISOString(),
        start_time: sDateObj.toISOString(),
        end_time: eDateObj.toISOString(),
        visibility: editingHunt.visibility,
        completion_message: editingHunt.completion_message || null,
        completion_url: editingHunt.completion_url || null,
        routing_mode: editingHunt.routing_mode || 'LINEAR',
        hide_spoilers: editingHunt.hide_spoilers === undefined ? true : editingHunt.hide_spoilers,
        reward_voucher: editingHunt.reward_voucher || null
      });

      if (editingHunt.steps) {
        // Find existing step IDs in db to see if any were deleted
        const dbSteps = await api.getHuntSteps(editingHunt.id);
        const currentIds = editingHunt.steps.map(s => s.id).filter(Boolean);
        const deletedIds = dbSteps.map(s => s.id).filter(id => !currentIds.includes(id));
        
        if (deletedIds.length > 0) {
          await api.deleteHuntSteps(deletedIds);
        }
        
        // Upsert the remaining/new steps
        const stepsPayload = editingHunt.steps.map((s, idx) => {
          const item = {
            hunt_id: editingHunt.id,
            sequence_order: idx + 1,
            clue: s.clue,
            pin_id: s.pin_id,
            trail_id: s.trail_id || null,
            point_rules: s.point_rules,
            type: s.type || 'GPS',
            expected_answer: s.expected_answer || null,
            choices: s.choices || null
          };
          if (s.id) {
            item.id = s.id;
          }
          return item;
        });
        
        await api.upsertHuntSteps(stepsPayload);
      }

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
      setPlayTab('objectives');
      setSelectedHunt(hunt);
      const steps = await api.getHuntSteps(hunt.id);
      setHuntSteps(steps);
      setSelectedStepId(null);
      setTeamDetails(null);
      setShowEnrollCard(false);

      // Check if user is enrolled
      const part = await api.getParticipant(hunt.id, uname);
      setParticipant(part);

      if (part) {
        const logs = await api.getHuntActivityLogs(part.id);
        setActivityLogs(logs);
        
        if (part.team_id) {
          try {
            const teamInfo = await api.getTeamDetails(part.team_id);
            setTeamDetails(teamInfo);
          } catch (tErr) {
            console.error("Failed to load team details:", tErr);
          }
        }
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
  const stepsStatus = React.useMemo(() => {
    return huntSteps.map(step => {
      const stepLogs = activityLogs.filter(l => l.step_id === step.id);
      const loggedTypes = stepLogs.map(l => l.activity_type);
      const requiredTypes = Object.keys(step.point_rules || {});
      const remainingTypes = requiredTypes.filter(t => loggedTypes.indexOf(t) < 0);
      const isCompleted = remainingTypes.length === 0;
      return {
        step,
        isCompleted,
        remainingTypes,
        loggedTypes
      };
    });
  }, [huntSteps, activityLogs]);

  const activeStep = React.useMemo(() => {
    if (!huntSteps.length) return null;
    const found = huntSteps.find(s => s.id === selectedStepId);
    if (found) return found;
    // Default to the first incomplete step
    const firstIncompleteIdx = stepsStatus.findIndex(s => !s.isCompleted);
    if (firstIncompleteIdx >= 0) return huntSteps[firstIncompleteIdx];
    return huntSteps[0];
  }, [huntSteps, selectedStepId, stepsStatus]);

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

  const getEditStepPinGroups = (stepIdx) => {
    let list = editShowAllPins ? pins : pins.filter(p => p.owner === uname);
    const query = (editSearchQueries[stepIdx] || '').trim().toLowerCase();
    if (query) {
      list = list.filter(p => {
        const nameMatch = p.name && p.name.toLowerCase().includes(query);
        const descMatch = p.description && p.description.toLowerCase().includes(query);
        const tagMatch = p.tags && p.tags.some ? p.tags.some(t => t.toLowerCase().includes(query)) : (typeof p.tags === 'string' && p.tags.toLowerCase().includes(query));
        return nameMatch || descMatch || tagMatch;
      });
    }
    if (userLL && typeof userLL.lat === 'number' && typeof userLL.lng === 'number') {
      list = [...list].sort((a, b) => {
        const distA = distKm(userLL.lat, userLL.lng, a.lat, a.lng);
        const distB = distKm(userLL.lat, userLL.lng, b.lat, b.lng);
        return distA - distB;
      });
    } else {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    
    const thresholdKm = 5;
    const clusters = [];
    const visited = new Set();
    const sortedPins = [...list];

    for (let i = 0; i < sortedPins.length; i++) {
      const pin = sortedPins[i];
      if (visited.has(pin.id)) continue;

      const clusterPins = [pin];
      visited.add(pin.id);

      for (let j = 0; j < sortedPins.length; j++) {
        const other = sortedPins[j];
        if (visited.has(other.id)) continue;

        const dist = distKm(pin.lat, pin.lng, other.lat, other.lng);
        if (dist <= thresholdKm) {
          clusterPins.push(other);
          visited.add(other.id);
        }
      }

      clusters.push({
        centerPin: pin,
        pins: clusterPins
      });
    }

    const multiPinGroups = [];
    const singlePins = [];

    clusters.forEach(c => {
      if (c.pins.length > 1) {
        multiPinGroups.push({
          label: lang === 'es' ? `Cerca de ${c.centerPin.name}` : `Near ${c.centerPin.name}`,
          pins: c.pins
        });
      } else {
        singlePins.push(c.pins[0]);
      }
    });

    const finalGroups = [...multiPinGroups];
    if (singlePins.length > 0) {
      finalGroups.push({
        label: lang === 'es' ? "Otras Ubicaciones" : "Other Locations",
        pins: singlePins
      });
    }

    return finalGroups;
  };

  const performCheckIn = async (bypassProximity = false) => {
    // 1. Scheduled Time Check Limits
    const now = new Date();
    const startTimeLimit = selectedHunt.start_time || selectedHunt.start_date;
    const endTimeLimit = selectedHunt.end_time || selectedHunt.end_date;

    if (startTimeLimit && new Date(startTimeLimit) > now) {
      flash(lang === 'es' ? "Esta búsqueda no ha comenzado todavía." : "This hunt hasn't started yet.");
      return;
    }
    if (endTimeLimit && new Date(endTimeLimit) < now) {
      flash(lang === 'es' ? "Esta búsqueda ha finalizado." : "This hunt has already ended.");
      return;
    }

    if (!bypassProximity && !isWithin65Ft) {
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
      
      const completedStepsCount = huntSteps.filter(step => {
        const sLogs = newLogs.filter(l => l.step_id === step.id);
        const lTypes = sLogs.map(l => l.activity_type);
        const rTypes = Object.keys(step.point_rules || {});
        return rTypes.every(t => lTypes.includes(t));
      }).length;
      const allDone = completedStepsCount === huntSteps.length;
      
      setTriviaAnswer('');
      setSelectedMCQ(null);
      
      if (remainingTypes.length === 0) {
        const newStatus = allDone ? 'completed' : 'enrolled';
        const updatedPart = await api.updateParticipantStatus(participant.id, newStatus, newPoints);
        setParticipant(updatedPart);
        if (allDone) {
          flash(lang === 'es' ? `🏆 ¡Felicidades! ¡Completaste toda la búsqueda "${selectedHunt.name}"!` : `🏆 Congratulations! You completed the entire scavenger hunt "${selectedHunt.name}"!`);
        } else {
          flash(lang === 'es' ? "📍 ¡Etapa de la búsqueda completada!" : "📍 Hunt step completed!");
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

  const submitTriviaAnswer = async () => {
    if (!activeStep) return;
    setCheckingIn(true);
    try {
      const isCorrect = await api.verifyCheckpointAnswer(activeStep.id, triviaAnswer);
      if (isCorrect) {
        flash(lang === 'es' ? "✅ ¡Respuesta correcta!" : "✅ Correct answer!");
        await performCheckIn(true);
      } else {
        flash(lang === 'es' ? "❌ Respuesta incorrecta. Inténtalo de nuevo." : "❌ Incorrect answer. Try again.");
      }
    } catch (err) {
      console.error(err);
      flash(lang === 'es' ? "Error al verificar respuesta" : "Error verifying answer");
    } finally {
      setCheckingIn(false);
    }
  };

  const submitMCQChoice = async (choice) => {
    if (!activeStep) return;
    setSelectedMCQ(choice);
    setCheckingIn(true);
    try {
      const isCorrect = await api.verifyCheckpointAnswer(activeStep.id, choice);
      if (isCorrect) {
        flash(lang === 'es' ? "✅ ¡Respuesta correcta!" : "✅ Correct answer!");
        await performCheckIn(true);
      } else {
        flash(lang === 'es' ? "❌ Respuesta incorrecta. Inténtalo de nuevo." : "❌ Incorrect answer. Try again.");
      }
    } catch (err) {
      console.error(err);
      flash(lang === 'es' ? "Error al verificar respuesta" : "Error verifying answer");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleQRScanSuccess = async (scannedText) => {
    setIsQrScannerOpen(false);
    if (!activeStep) return;
    setCheckingIn(true);
    try {
      const isCorrect = await api.verifyCheckpointAnswer(activeStep.id, scannedText);
      if (isCorrect) {
        flash(lang === 'es' ? "✅ Código QR verificado con éxito!" : "✅ QR Code verified successfully!");
        await performCheckIn(true);
      } else {
        flash(lang === 'es' ? "❌ Código QR incorrecto para esta ubicación." : "❌ Incorrect QR code for this location.");
      }
    } catch (err) {
      console.error(err);
      flash(lang === 'es' ? "Error al verificar código QR" : "Error verifying QR Code");
    } finally {
      setCheckingIn(false);
    }
  };

  const loadSubmissions = async () => {
    if (!selectedHunt) return;
    try {
      const data = await api.getHuntSubmissions(selectedHunt.id);
      setSubmissions(data);
    } catch(err) {
      console.error(err);
    }
  };

  const handleLikeSubmission = async (subId, hasLiked) => {
    const sub = submissions.find(s => s.id === subId);
    if (!sub) return;
    let newLikes = [];
    if (hasLiked) {
      newLikes = sub.likes.filter(u => u !== uname);
    } else {
      newLikes = [...sub.likes, uname];
    }
    setSubmissions(submissions.map(s => s.id === subId ? { ...s, likes: newLikes } : s));
    try {
      await api.updateSubmissionLikes(subId, newLikes);
    } catch(err) {
      console.error(err);
      loadSubmissions();
    }
  };

  const handleCommentSubmission = async (subId, text) => {
    const sub = submissions.find(s => s.id === subId);
    if (!sub) return;
    const newComment = {
      username: uname,
      body: text,
      created_at: new Date().toISOString()
    };
    const newComments = [...(sub.comments || []), newComment];
    setSubmissions(submissions.map(s => s.id === subId ? { ...s, comments: newComments } : s));
    try {
      await api.updateSubmissionComments(subId, newComments);
    } catch(err) {
      console.error(err);
      loadSubmissions();
    }
  };

  const handleReviewSubmission = async (subId, status) => {
    setSubmissions(submissions.map(s => s.id === subId ? { ...s, status } : s));
    try {
      await api.updateSubmissionStatus(subId, status);
      flash(lang === 'es' ? "¡Estado de envío actualizado!" : "Submission status updated successfully!");
    } catch(err) {
      console.error(err);
      loadSubmissions();
      flash(lang === 'es' ? "Error al actualizar envío" : "Error updating submission review status");
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
      
      const completedStepsCount = huntSteps.filter(step => {
        const sLogs = newLogs.filter(l => l.step_id === step.id);
        const lTypes = sLogs.map(l => l.activity_type);
        const rTypes = Object.keys(step.point_rules || {});
        return rTypes.every(t => lTypes.includes(t));
      }).length;
      const allDone = completedStepsCount === huntSteps.length;

      if (remainingTypes.length === 0) {
        const newStatus = allDone ? 'completed' : 'enrolled';
        const updatedPart = await api.updateParticipantStatus(participant.id, newStatus, newPoints);
        setParticipant(updatedPart);
        if (allDone) {
          flash(lang === 'es' ? `🏆 ¡Felicidades! ¡Completaste toda la búsqueda "${selectedHunt.name}"!` : `🏆 Congratulations! You completed the entire scavenger hunt "${selectedHunt.name}"!`);
        } else {
          flash(lang === 'es' ? "📍 ¡Etapa de la búsqueda completada!" : "📍 Hunt step completed!");
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
                      onClick: async (ev) => {
                        ev.stopPropagation();
                        const sd = h.start_date ? h.start_date.slice(0,10) : '';
                        const ed = h.end_date ? h.end_date.slice(0,10) : '';
                        try {
                          const steps = await api.getHuntSteps(h.id);
                          setEditingHunt({ ...h, start_date_local: sd, end_date_local: ed, steps: steps });
                        } catch (err) {
                          console.error("Failed to fetch steps for editing:", err);
                          setEditingHunt({ ...h, start_date_local: sd, end_date_local: ed, steps: [] });
                        }
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
          boxSizing: 'border-box', fontFamily: T.font, display: 'flex', flexDirection: 'column', gap: 12,
          maxHeight: '90vh', overflowY: 'auto'
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
        // Routing Mode
        e('div', null,
          e('label', { style: { fontSize: 12, fontWeight: 700, color: T.ink2 } }, lang === 'es' ? "Modo de Ruta" : "Routing Mode"),
          e('select', {
            value: editingHunt.routing_mode || 'LINEAR',
            onChange: (ev) => setEditingHunt(eh => ({ ...eh, routing_mode: ev.target.value })),
            style: Object.assign({}, S.input, { height: 42, marginTop: 4 })
          },
            e('option', { value: 'LINEAR' }, lang === 'es' ? "Ruta Lineal — objetivos en secuencia" : "Linear Path — sequential objectives"),
            e('option', { value: 'FREE_ROAMING' }, lang === 'es' ? "Ruta Libre — resolver en cualquier orden" : "Free Roaming — solve in any order")
          )
        ),
        // Team Play Info Card
        e('div', {
          style: {
            background: 'rgba(46, 125, 50, 0.05)',
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            padding: '10px 12px',
            marginTop: 4,
            marginBottom: 8,
            fontSize: 12,
            color: T.ink2,
            lineHeight: 1.4
          }
        },
          e('span', { style: { fontWeight: 700, color: T.forest } }, "👥 " + (lang === 'es' ? "Modo Multijugador/Equipos:" : "Team Play Support:")),
          " " + (lang === 'es' 
            ? "Esta cacería admite juego individual o en equipo. Al unirse, los jugadores podrán crear o unirse a un equipo con un código para compartir el progreso y puntuación en tiempo real." 
            : "This scavenger hunt supports both Solo and Team play. Upon enrolling, participants can create or join a team using a code to synchronize progress and scores in real-time.")
        ),
        // Hide Spoilers Toggle Checkbox
        e('div', { style: { display: 'flex', alignItems: 'center', gap: 6, margin: '6px 0' } },
          e('label', { style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: T.ink2, cursor: 'pointer' } },
            e('input', {
              type: 'checkbox',
              checked: editingHunt.hide_spoilers === undefined ? true : editingHunt.hide_spoilers,
              onChange: (ev) => setEditingHunt(eh => ({ ...eh, hide_spoilers: ev.target.checked }))
            }),
            lang === 'es' ? "Ocultar Spoilers (difuminar fotos de pasos bloqueados)" : "Hide Photo Spoilers (blur images from locked steps)"
          )
        ),
        // Reward Voucher
        e('div', null,
          e('label', { style: { fontSize: 12, fontWeight: 700, color: T.ink2 } }, lang === 'es' ? "Vale / Código de Recompensa (Voucher)" : "Completion Reward Voucher"),
          e('input', {
            type: 'text',
            placeholder: "e.g. FREEBEER2026, DISCOUNT50",
            value: editingHunt.reward_voucher || '',
            onChange: (ev) => setEditingHunt(eh => ({ ...eh, reward_voucher: ev.target.value })),
            style: Object.assign({}, S.input, { marginTop: 4 })
          })
        ),

        // Steps list header
        e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, borderTop: `1px solid ${T.borderSoft}`, paddingTop: 16 } },
          e('div', { style: { fontSize: 14, fontWeight: 800, color: T.ink } },
            lang === 'es' ? "Pasos de la Búsqueda" : "Hunt Steps / Objectives"),
          e('button', {
            onClick: () => {
              const newSteps = [...(editingHunt.steps || [])];
              newSteps.push({
                sequence_order: newSteps.length + 1,
                clue: '',
                pin_id: '',
                trail_id: '',
                point_rules: { check_in: 100 }
              });
              setEditingHunt({ ...editingHunt, steps: newSteps });
            },
            style: Object.assign({}, S.miniBtn, { background: T.forest, color: T.paper, border: 'none' })
          }, lang === 'es' ? "+ Agregar Paso" : "+ Add Step")
        ),

        // Show all pins toggle for editing
        e('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 } },
          e('input', {
            id: 'edit-scavenger-hunt-show-all-pins-toggle',
            type: 'checkbox',
            checked: editShowAllPins,
            onChange: (e) => setEditShowAllPins(e.target.checked),
            style: { cursor: 'pointer', width: 16, height: 16 }
          }),
          e('label', {
            htmlFor: 'edit-scavenger-hunt-show-all-pins-toggle',
            style: { fontSize: 13, fontWeight: 600, color: T.ink2, cursor: 'pointer', userSelect: 'none' }
          }, lang === 'es' ? "Incluir pines de otros creadores" : "Include pins from other creators")
        ),

        // Steps list
        e('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
          (editingHunt.steps || []).map((step, idx) => {
            const stepPinGroups = getEditStepPinGroups(idx);
            const myTrails = trails.filter(t => t.owner === uname);
            return e('div', {
              key: idx,
              style: {
                background: T.paper3, border: `1px solid ${T.border}`,
                borderRadius: 14, padding: 14, position: 'relative', display: 'flex', flexDirection: 'column', gap: 10
              }
            },
              // Remove button
              (editingHunt.steps || []).length > 1 && e('button', {
                onClick: () => {
                  const newSteps = (editingHunt.steps || []).filter((_, i) => i !== idx).map((s, i) => ({
                    ...s,
                    sequence_order: i + 1
                  }));
                  setEditingHunt({ ...editingHunt, steps: newSteps });
                },
                style: {
                  position: 'absolute', top: 10, right: 10,
                  background: 'none', border: 'none', color: '#c62828',
                  fontWeight: 700, cursor: 'pointer', fontSize: 12
                }
              }, lang === 'es' ? "Eliminar" : "Remove"),

              e('div', { style: { fontSize: 13, fontWeight: 700, color: T.forest } },
                `${lang === 'es' ? "Paso" : "Step"} ${step.sequence_order}`),

              // Pin Search
              e('div', null,
                e('label', { htmlFor: `edit-step-search-input-${idx}`, style: { fontSize: 11.5, color: T.ink3, fontWeight: 700, display: 'block', marginBottom: 4 } },
                  lang === 'es' ? "Buscar / Filtrar Pines" : "Search / Filter Pins"),
                e('input', {
                  id: `edit-step-search-input-${idx}`,
                  type: 'text',
                  placeholder: lang === 'es' ? "Buscar por nombre, etiqueta..." : "Search name, tag...",
                  value: editSearchQueries[idx] || '',
                  onChange: (e) => {
                    const val = e.target.value;
                    setEditSearchQueries(prev => Object.assign({}, prev, { [idx]: val }));
                  },
                  style: Object.assign({}, S.input, { height: 38, marginBottom: 0 })
                })
              ),

              // Pin Selector
              e('div', null,
                e('label', { htmlFor: `edit-step-pin-select-${idx}`, style: { fontSize: 11.5, color: T.ink3, fontWeight: 700, display: 'block', marginBottom: 4 } },
                  lang === 'es' ? "Pin de Destino" : "Destination Pin"),
                e('select', {
                  id: `edit-step-pin-select-${idx}`,
                  value: step.pin_id,
                  onChange: (e) => {
                    const newSteps = [...editingHunt.steps];
                    newSteps[idx].pin_id = e.target.value;
                    setEditingHunt({ ...editingHunt, steps: newSteps });
                  },
                  style: Object.assign({}, S.input, { height: 42, marginBottom: 0 })
                },
                  e('option', { value: '' }, lang === 'es' ? "-- Selecciona un Pin --" : "-- Select a Pin --"),
                  stepPinGroups.map((group, gIdx) =>
                    e('optgroup', { key: gIdx, label: group.label },
                      group.pins.map(p => e('option', { key: p.id, value: p.id }, p.name))
                    )
                  )
                )
              ),

              // Clue
              e('div', null,
                e('label', { htmlFor: `edit-step-clue-textarea-${idx}`, style: { fontSize: 11.5, color: T.ink3, fontWeight: 700, display: 'block', marginBottom: 4 } },
                  lang === 'es' ? "Pista para este destino" : "Clue for this spot"),
                e('textarea', {
                  id: `edit-step-clue-textarea-${idx}`,
                  rows: 2,
                  placeholder: lang === 'es' ? "Busca debajo del gran roble..." : "Look near the old brick fountain...",
                  value: step.clue,
                  onChange: (e) => {
                    const newSteps = [...editingHunt.steps];
                    newSteps[idx].clue = e.target.value;
                    setEditingHunt({ ...editingHunt, steps: newSteps });
                  },
                  style: Object.assign({}, S.textarea, { marginBottom: 0 })
                })
              ),

              // Trail Selector (Optional)
              e('div', null,
                e('label', { htmlFor: `edit-step-trail-select-${idx}`, style: { fontSize: 11.5, color: T.ink3, fontWeight: 700, display: 'block', marginBottom: 4 } },
                  lang === 'es' ? "Ruta a seguir (Opcional)" : "Follow Trail (Optional)"),
                e('select', {
                  id: `edit-step-trail-select-${idx}`,
                  value: step.trail_id || '',
                  onChange: (e) => {
                    const newSteps = [...editingHunt.steps];
                    newSteps[idx].trail_id = e.target.value || null;
                    setEditingHunt({ ...editingHunt, steps: newSteps });
                  },
                  style: Object.assign({}, S.input, { height: 42, marginBottom: 0 })
                },
                  e('option', { value: '' }, lang === 'es' ? "-- Ninguna ruta --" : "-- No trail --"),
                  myTrails.map(t => e('option', { key: t.id, value: t.id }, t.name))
                )
              ),

              // Challenge / Verification Type
              e('div', null,
                e('label', { htmlFor: `edit-step-type-select-${idx}`, style: { fontSize: 11.5, color: T.ink3, fontWeight: 700, display: 'block', marginBottom: 4 } },
                  lang === 'es' ? "Tipo de Desafío" : "Challenge Verification Type"),
                e('select', {
                  id: `edit-step-type-select-${idx}`,
                  value: step.type || 'GPS',
                  onChange: (e) => {
                    const newSteps = [...editingHunt.steps];
                    newSteps[idx].type = e.target.value;
                    newSteps[idx].expected_answer = '';
                    newSteps[idx].choices = [];
                    setEditingHunt({ ...editingHunt, steps: newSteps });
                  },
                  style: Object.assign({}, S.input, { height: 42, marginBottom: 0 })
                },
                  e('option', { value: 'GPS' }, lang === 'es' ? "📍 Ubicación GPS" : "📍 GPS Location Check-in"),
                  e('option', { value: 'QR_CODE' }, lang === 'es' ? "📷 Escanear Código QR" : "📷 Scan QR Code"),
                  e('option', { value: 'TRIVIA' }, lang === 'es' ? "❓ Trivia / Pregunta" : "❓ Trivia / Riddle Answer"),
                  e('option', { value: 'MULTIPLE_CHOICE' }, lang === 'es' ? "📝 Opción Múltiple" : "📝 Multiple Choice")
                )
              ),

              // Conditional inputs based on Challenge Type
              step.type === 'QR_CODE' && e('div', null,
                e('label', { htmlFor: `edit-step-qr-answer-${idx}`, style: { fontSize: 11.5, color: T.ink3, fontWeight: 700, display: 'block', marginBottom: 4 } },
                  lang === 'es' ? "Valor de QR Esperado" : "Expected QR Code Text"),
                e('input', {
                  id: `edit-step-qr-answer-${idx}`,
                  type: 'text',
                  placeholder: lang === 'es' ? "Ej: pinmap-secret-123" : "e.g. pinmap-secret-123",
                  value: step.expected_answer || '',
                  onChange: (e) => {
                    const newSteps = [...editingHunt.steps];
                    newSteps[idx].expected_answer = e.target.value;
                    setEditingHunt({ ...editingHunt, steps: newSteps });
                  },
                  style: S.input
                })
              ),

              step.type === 'TRIVIA' && e('div', null,
                e('label', { htmlFor: `edit-step-trivia-answer-${idx}`, style: { fontSize: 11.5, color: T.ink3, fontWeight: 700, display: 'block', marginBottom: 4 } },
                  lang === 'es' ? "Respuesta correcta a la Trivia" : "Expected Trivia Answer"),
                e('input', {
                  id: `edit-step-trivia-answer-${idx}`,
                  type: 'text',
                  placeholder: lang === 'es' ? "Ej: París" : "e.g. Paris",
                  value: step.expected_answer || '',
                  onChange: (e) => {
                    const newSteps = [...editingHunt.steps];
                    newSteps[idx].expected_answer = e.target.value;
                    setEditingHunt({ ...editingHunt, steps: newSteps });
                  },
                  style: S.input
                })
              ),

              step.type === 'MULTIPLE_CHOICE' && e('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
                e('label', { style: { fontSize: 11.5, color: T.ink3, fontWeight: 700, display: 'block', marginBottom: 4 } },
                  lang === 'es' ? "Opciones y Respuesta Correcta" : "Options & Correct Answer"),
                e('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
                  [0, 1, 2, 3].map((optIdx) => {
                    const choices = step.choices || [];
                    const optionVal = choices[optIdx] || '';
                    return e('div', { key: optIdx, style: { display: 'flex', alignItems: 'center', gap: 8 } },
                      e('input', {
                        type: 'radio',
                        name: `edit_correct_choice_${idx}`,
                        checked: step.expected_answer === optionVal && optionVal !== '',
                        onChange: () => {
                          const newSteps = [...editingHunt.steps];
                          newSteps[idx].expected_answer = optionVal;
                          setEditingHunt({ ...editingHunt, steps: newSteps });
                        },
                        disabled: optionVal === ''
                      }),
                      e('input', {
                        type: 'text',
                        placeholder: `${lang === 'es' ? "Opción" : "Option"} ${optIdx + 1}`,
                        value: optionVal,
                        onChange: (e) => {
                          const newSteps = [...editingHunt.steps];
                          const newChoices = [...choices];
                          newChoices[optIdx] = e.target.value;
                          newSteps[idx].choices = newChoices;
                          setEditingHunt({ ...editingHunt, steps: newSteps });
                        },
                        style: Object.assign({}, S.input, { height: 36, flex: 1, marginBottom: 0 })
                      })
                    );
                  })
                ),
                e('span', { style: { fontSize: 11, color: T.ink3 } },
                  lang === 'es' ? "* Escribe opciones y marca el botón de opción circular para la respuesta correcta." : "* Fill choices and mark the radio button next to the correct answer.")
              ),

              // Objectives / Point rules
              e('div', { style: { background: T.paper, padding: 10, borderRadius: 10 } },
                e('div', { style: { fontSize: 11.5, color: T.ink2, fontWeight: 700, marginBottom: 6 } },
                  lang === 'es' ? "Objetivos y Puntos del Paso" : "Objective Point Setup"),
                
                e('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
                  // Check-in (always enabled)
                  e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 } },
                    e('label', { htmlFor: `edit-step-checkin-checkbox-${idx}`, style: { display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 } },
                      e('input', { id: `edit-step-checkin-checkbox-${idx}`, type: 'checkbox', checked: true, disabled: true }),
                      lang === 'es' ? "Llegar al Pin (Check-in)" : "Arrive at Pin (Check-in)"
                    ),
                    e('input', {
                      id: `edit-step-checkin-points-${idx}`,
                      type: 'number',
                      min: 0,
                      value: step.point_rules.check_in || 0,
                      onChange: (e) => {
                        const newSteps = [...editingHunt.steps];
                        newSteps[idx].point_rules = { ...newSteps[idx].point_rules, check_in: parseInt(e.target.value) || 0 };
                        setEditingHunt({ ...editingHunt, steps: newSteps });
                      },
                      style: { width: 60, padding: 4, borderRadius: 6, border: `1px solid ${T.border}`, textAlign: 'right' }
                    })
                  ),

                  // Upload Photo
                  e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 } },
                    e('label', { htmlFor: `edit-step-photo-checkbox-${idx}`, style: { display: 'flex', alignItems: 'center', gap: 6 } },
                      e('input', {
                        id: `edit-step-photo-checkbox-${idx}`,
                        type: 'checkbox',
                        checked: !!step.point_rules.photo_upload,
                        onChange: () => {
                          const newSteps = [...editingHunt.steps];
                          const rules = { ...newSteps[idx].point_rules };
                          if (rules.photo_upload) {
                            delete rules.photo_upload;
                          } else {
                            rules.photo_upload = 50;
                          }
                          newSteps[idx].point_rules = rules;
                          setEditingHunt({ ...editingHunt, steps: newSteps });
                        }
                      }),
                      lang === 'es' ? "Subir Foto" : "Upload Photo"
                    ),
                    !!step.point_rules.photo_upload && e('input', {
                      id: `edit-step-photo-points-${idx}`,
                      type: 'number',
                      min: 0,
                      value: step.point_rules.photo_upload || 0,
                      onChange: (e) => {
                        const newSteps = [...editingHunt.steps];
                        newSteps[idx].point_rules = { ...newSteps[idx].point_rules, photo_upload: parseInt(e.target.value) || 0 };
                        setEditingHunt({ ...editingHunt, steps: newSteps });
                      },
                      style: { width: 60, padding: 4, borderRadius: 6, border: `1px solid ${T.border}`, textAlign: 'right' }
                    })
                  ),

                  // Field Journal
                  e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 } },
                    e('label', { htmlFor: `edit-step-comment-checkbox-${idx}`, style: { display: 'flex', alignItems: 'center', gap: 6 } },
                      e('input', {
                        id: `edit-step-comment-checkbox-${idx}`,
                        type: 'checkbox',
                        checked: !!step.point_rules.comment,
                        onChange: () => {
                          const newSteps = [...editingHunt.steps];
                          const rules = { ...newSteps[idx].point_rules };
                          if (rules.comment) {
                            delete rules.comment;
                          } else {
                            rules.comment = 50;
                          }
                          newSteps[idx].point_rules = rules;
                          setEditingHunt({ ...editingHunt, steps: newSteps });
                        }
                      }),
                      lang === 'es' ? "Agregar Diario / Comentario" : "Write Field Journal"
                    ),
                    !!step.point_rules.comment && e('input', {
                      id: `edit-step-comment-points-${idx}`,
                      type: 'number',
                      min: 0,
                      value: step.point_rules.comment || 0,
                      onChange: (e) => {
                        const newSteps = [...editingHunt.steps];
                        newSteps[idx].point_rules = { ...newSteps[idx].point_rules, comment: parseInt(e.target.value) || 0 };
                        setEditingHunt({ ...editingHunt, steps: newSteps });
                      },
                      style: { width: 60, padding: 4, borderRadius: 6, border: `1px solid ${T.border}`, textAlign: 'right' }
                    })
                  ),

                  // Link Trail
                  e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 } },
                    e('label', { htmlFor: `edit-step-createtrail-checkbox-${idx}`, style: { display: 'flex', alignItems: 'center', gap: 6 } },
                      e('input', {
                        id: `edit-step-createtrail-checkbox-${idx}`,
                        type: 'checkbox',
                        checked: !!step.point_rules.create_trail,
                        onChange: () => {
                          const newSteps = [...editingHunt.steps];
                          const rules = { ...newSteps[idx].point_rules };
                          if (rules.create_trail) {
                            delete rules.create_trail;
                          } else {
                            rules.create_trail = 150;
                          }
                          newSteps[idx].point_rules = rules;
                          setEditingHunt({ ...editingHunt, steps: newSteps });
                        }
                      }),
                      lang === 'es' ? "Grabar y Vincular Ruta" : "Record & Link Trail"
                    ),
                    !!step.point_rules.create_trail && e('input', {
                      id: `edit-step-createtrail-points-${idx}`,
                      type: 'number',
                      min: 0,
                      value: step.point_rules.create_trail || 0,
                      onChange: (e) => {
                        const newSteps = [...editingHunt.steps];
                        newSteps[idx].point_rules = { ...newSteps[idx].point_rules, create_trail: parseInt(e.target.value) || 0 };
                        setEditingHunt({ ...editingHunt, steps: newSteps });
                      },
                      style: { width: 60, padding: 4, borderRadius: 6, border: `1px solid ${T.border}`, textAlign: 'right' }
                    })
                  ),

                  // Follow Trail (only show if trail is selected)
                  step.trail_id && e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 } },
                    e('label', { htmlFor: `edit-step-trailfollow-checkbox-${idx}`, style: { display: 'flex', alignItems: 'center', gap: 6 } },
                      e('input', {
                        id: `edit-step-trailfollow-checkbox-${idx}`,
                        type: 'checkbox',
                        checked: !!step.point_rules.trail_follow,
                        onChange: () => {
                          const newSteps = [...editingHunt.steps];
                          const rules = { ...newSteps[idx].point_rules };
                          if (rules.trail_follow) {
                            delete rules.trail_follow;
                          } else {
                            rules.trail_follow = 150;
                          }
                          newSteps[idx].point_rules = rules;
                          setEditingHunt({ ...editingHunt, steps: newSteps });
                        }
                      }),
                      lang === 'es' ? "Completar Sendero" : "Follow Trail Route"
                    ),
                    !!step.point_rules.trail_follow && e('input', {
                      id: `edit-step-trailfollow-points-${idx}`,
                      type: 'number',
                      min: 0,
                      value: step.point_rules.trail_follow || 0,
                      onChange: (e) => {
                        const newSteps = [...editingHunt.steps];
                        newSteps[idx].point_rules = { ...newSteps[idx].point_rules, trail_follow: parseInt(e.target.value) || 0 };
                        setEditingHunt({ ...editingHunt, steps: newSteps });
                      },
                      style: { width: 60, padding: 4, borderRadius: 6, border: `1px solid ${T.border}`, textAlign: 'right' }
                    })
                  )
                )
              )
            );
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

      // Enrollment Call-To-Action or TeamRegistrationCard if not enrolled
      !participant && (showEnrollCard ? (
        e(TeamRegistrationCard, {
          huntId: selectedHunt.id,
          username: uname,
          onEnrolled: (teamId) => {
            setShowEnrollCard(false);
            handleSelectHunt(selectedHunt);
          },
          onBack: () => setShowEnrollCard(false)
        })
      ) : (
        e('div', {
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
            onClick: () => setShowEnrollCard(true),
            style: Object.assign({}, S.btn, {
              background: T.forest, color: T.paper, border: 'none',
              alignSelf: 'center', padding: '10px 24px', borderRadius: 10,
              fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(46,125,50,0.25)'
            })
          }, lang === 'es' ? "Inscribirse y Empezar" : "Enroll & Start")
        )
      )),

      // Progress Tracker Card
      participant && e('div', { style: { background: T.paper3, borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 } },
        e('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.ink3 } },
          e('span', null, lang === 'es' ? "Tus Puntos" : "Your points"),
          e('span', null, lang === 'es' ? "Progreso" : "Progress")
        ),
        e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 2 } },
          e('span', { style: { fontSize: 20, fontWeight: 800, color: T.forest } },
            `${participant ? participant.total_points : 0} pts`),
          e('span', { style: { fontSize: 14, fontWeight: 700, color: T.ink } },
            `${stepsStatus.filter(s => s.isCompleted).length} / ${huntSteps.length} Steps`)
        ),
        teamDetails && e('div', {
          style: {
            borderTop: `1px solid ${T.borderSoft}`,
            paddingTop: 10,
            marginTop: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }
        },
          e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            e('span', { style: { fontSize: 13, fontWeight: 800, color: T.ink } },
              `${lang === 'es' ? 'Equipo: ' : 'Team: '}${teamDetails.team.name}`
            ),
            e('span', { style: { fontSize: 11, fontFamily: T.mono, color: T.forest, background: T.forestPale, padding: '2px 6px', borderRadius: 4 } },
              `${lang === 'es' ? 'Código: ' : 'Code: '}${teamDetails.team.invite_code}`
            )
          ),
          e('div', { style: { fontSize: 11.5, color: T.ink3, marginTop: 2 } },
            `${lang === 'es' ? 'Miembros: ' : 'Members: '}${teamDetails.members.join(', ')}`
          )
        ),
        e('button', {
          onClick: function() {
            if (window.confirm(lang === 'es' ? "¿Estás seguro de que deseas salir de esta cacería?" : "Are you sure you want to leave this hunt?")) {
              api.leaveHunt(participant.id).then(function() {
                setSelectedHunt(null);
                setActiveSubTab('my_hunts');
                if (onHuntProgress) onHuntProgress('leave');
                flash(lang === 'es' ? "Has salido de la cacería." : "You left the hunt.");
              });
            }
          },
          style: {
            background: 'rgba(211, 47, 47, 0.08)',
            border: 'none',
            color: '#d32f2f',
            fontWeight: 700,
            fontSize: 11,
            padding: '6px 12px',
            borderRadius: 8,
            cursor: 'pointer',
            marginTop: 6,
            alignSelf: 'flex-start'
          }
        }, "🚪 " + (lang === 'es' ? "Abandonar Cacería" : "Leave Hunt"))
      ),

      // Play Tab Bar Toggle
      participant && e('div', {
        style: {
          display: 'flex', borderBottom: `1px solid ${T.borderSoft}`, marginBottom: 8, marginTop: 4
        }
      },
        e('button', {
          onClick: () => setPlayTab('objectives'),
          style: {
            flex: 1, padding: '10px 0', border: 'none', background: 'none',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            borderBottom: playTab === 'objectives' ? `3px solid ${T.forest}` : 'none',
            color: playTab === 'objectives' ? T.forest : T.ink3,
            fontFamily: T.font
          }
        }, lang === 'es' ? "Objetivos" : "Objectives"),
        e('button', {
          onClick: () => {
            setPlayTab('photostream');
            loadSubmissions();
          },
          style: {
            flex: 1, padding: '10px 0', border: 'none', background: 'none',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            borderBottom: playTab === 'photostream' ? `3px solid ${T.forest}` : 'none',
            color: playTab === 'photostream' ? T.forest : T.ink3,
            fontFamily: T.font
          }
        }, lang === 'es' ? "Fotos" : "Photostream"),
        selectedHunt.creator === uname && e('button', {
          onClick: () => {
            setPlayTab('organizer');
            loadSubmissions();
          },
          style: {
            flex: 1, padding: '10px 0', border: 'none', background: 'none',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            borderBottom: playTab === 'organizer' ? `3px solid ${T.forest}` : 'none',
            color: playTab === 'organizer' ? T.forest : T.ink3,
            fontFamily: T.font
          }
        }, lang === 'es' ? "Organizador" : "Console")
      ),

      // Play Tab Content Window
      participant && (playTab === 'photostream' ?
        e(PhotostreamTab, {
          submissions: submissions,
          huntSteps: huntSteps,
          activeStep: activeStep,
          participant: participant,
          hideSpoilers: selectedHunt.hide_spoilers !== false,
          uname: uname,
          lang: lang,
          onLike: handleLikeSubmission,
          onComment: handleCommentSubmission
        })
        :
        playTab === 'organizer' ?
        e('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
          e('div', { style: { fontSize: 14, fontWeight: 800, color: T.ink } },
            lang === 'es' ? "Consola del Organizador — Envíos" : "Organizer Review Console — Submissions"
          ),
          submissions.length === 0 ?
            e('div', { style: { padding: '24px 0', textAlign: 'center', color: T.ink3, fontStyle: 'italic', fontSize: 13 } },
              lang === 'es' ? "Aún no hay fotos enviadas." : "No submitted photos yet."
            )
            :
            submissions.map(sub => {
              const stepObj = huntSteps.find(s => s.id === sub.step_id);
              const stepOrder = stepObj ? stepObj.sequence_order : '?';
              const isPending = sub.status === 'PENDING' || !sub.status;
              const isApproved = sub.status === 'APPROVED';
              const isRejected = sub.status === 'REJECTED';

              return e('div', {
                key: sub.id,
                style: {
                  background: T.paper2,
                  border: `1px solid ${T.border}`,
                  borderRadius: 14,
                  padding: 12,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start'
                }
              },
                sub.photo_url && e('img', {
                  src: sub.photo_url,
                  alt: 'submission',
                  style: { width: 70, height: 70, borderRadius: 10, objectFit: 'cover', background: '#ccc' }
                }),
                e('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: 3 } },
                  e('div', { style: { fontSize: 13, fontWeight: 700 } },
                    `${lang === 'es' ? 'Paso' : 'Step'} ${stepOrder} • ${sub.username}`
                  ),
                  sub.caption && e('div', { style: { fontSize: 12, color: T.ink2 } }, `"${sub.caption}"`),
                  e('div', { style: { display: 'flex', gap: 8, marginTop: 6 } },
                    e('button', {
                      onClick: () => handleReviewSubmission(sub.id, 'APPROVED'),
                      style: {
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: 'none',
                        background: isApproved ? '#2e7d32' : 'rgba(46,125,50,0.1)',
                        color: isApproved ? '#fff' : '#2e7d32',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }
                    }, lang === 'es' ? "Aprobar" : "Approve"),
                    e('button', {
                      onClick: () => handleReviewSubmission(sub.id, 'REJECTED'),
                      style: {
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: 'none',
                        background: isRejected ? '#c62828' : 'rgba(198,40,40,0.1)',
                        color: isRejected ? '#fff' : '#c62828',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }
                    }, lang === 'es' ? "Rechazar" : "Reject")
                  )
                )
              );
            })
        )
        :
        (stepsStatus.every(s => s.isCompleted) ?
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
            )),
            selectedHunt.reward_voucher && e('div', {
              style: {
                marginTop: 14,
                padding: '12px 20px',
                background: T.paper,
                border: `2px dashed ${T.forest}`,
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
              }
            },
              e('span', { style: { fontSize: 11, fontWeight: 700, color: T.ink3, textTransform: 'uppercase', letterSpacing: '0.05em' } },
                lang === 'es' ? "CÓDIGO DE RECOMPENSA" : "REWARD VOUCHER CODE"
              ),
              e('span', { style: { fontSize: 18, fontWeight: 800, color: T.forest, fontFamily: T.mono, marginTop: 4, letterSpacing: '0.1em' } },
                selectedHunt.reward_voucher
              )
            )
          )
          :
          // Active Step Details
          activeStep && e('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
          // Step Selector Tabs
          e('div', { style: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 4 } },
            e('div', { style: { fontSize: 12, fontWeight: 700, color: T.ink2 } }, lang === 'es' ? "Objetivos de la Búsqueda" : "Hunt Objectives"),
            e('div', { style: { display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 } },
              stepsStatus.map((status, idx) => {
                const isSelected = activeStep.id === status.step.id;
                return e('button', {
                  key: status.step.id,
                  onClick: () => setSelectedStepId(status.step.id),
                  style: {
                    flexShrink: 0,
                    padding: '8px 12px',
                    borderRadius: 10,
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: isSelected ? `2px solid ${T.forest}` : `1px solid ${T.borderSoft}`,
                    background: isSelected ? T.forestPale : (status.isCompleted ? 'rgba(76,175,80,0.08)' : T.paper2),
                    color: isSelected ? T.forest : (status.isCompleted ? '#2e7d32' : T.ink),
                    fontFamily: T.font
                  }
                }, `${lang === 'es' ? "Paso" : "Step"} ${status.step.sequence_order || (idx + 1)} ${status.isCompleted ? '🏆' : ''}`);
              })
            )
          ),
          e('div', { style: { fontSize: 12, fontFamily: T.mono, color: T.ink3, textTransform: 'uppercase' } },
            `${lang === 'es' ? "ETAPA SELECCIONADA" : "SELECTED OBJECTIVE"} (${activeStep.sequence_order || (huntSteps.indexOf(activeStep) + 1)}/${huntSteps.length})`),
          
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
              participant && (activeStep.type === 'GPS' || !activeStep.type) && e('button', {
                onClick: () => performCheckIn(false),
                disabled: checkingIn || !isWithin65Ft,
                style: Object.assign({}, S.miniBtn, {
                  background: isWithin65Ft ? T.forest : T.paper,
                  color: isWithin65Ft ? T.paper : T.ink3,
                  border: isWithin65Ft ? 'none' : `1px solid ${T.border}`,
                  fontWeight: 700, padding: '8px 16px', borderRadius: 10
                })
              }, checkingIn ? '...' : (lang === 'es' ? "Check-in" : "Check-in"))
            ),

            // Challenge Task Input/Actions (Visible if not simple GPS check-in)
            activeStep && activeStep.type && activeStep.type !== 'GPS' && e('div', {
              style: {
                paddingTop: 10, borderTop: `1px solid ${T.borderSoft}`,
                display: 'flex', flexDirection: 'column', gap: 8, width: '100%'
              }
            },
              e('div', { style: { fontSize: 11, color: T.ink3, fontWeight: 700 } },
                lang === 'es' ? "DESAFÍO REQUERIDO" : "REQUIRED CHALLENGE"
              ),
              
              // QR Code challenge UI
              activeStep.type === 'QR_CODE' && e('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
                e('div', { style: { fontSize: 12.5, fontWeight: 600, color: T.ink2 } }, 
                  lang === 'es' ? "Escanea el código QR en esta ubicación para verificar." : "Scan the QR code at this spot to verify."
                ),
                e('button', {
                  onClick: () => setIsQrScannerOpen(true),
                  disabled: checkingIn,
                  style: Object.assign({}, S.btn, { background: T.forest, color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 10, fontWeight: 700 })
                }, lang === 'es' ? "📷 Abrir Escáner QR" : "📷 Open QR Scanner")
              ),

              // Trivia / Riddle UI
              activeStep.type === 'TRIVIA' && e('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
                e('div', { style: { fontSize: 12.5, fontWeight: 600, color: T.ink2 } }, 
                  lang === 'es' ? "Responde la pregunta / enigma:" : "Solve the riddle/trivia question:"
                ),
                e('input', {
                  type: 'text',
                  placeholder: lang === 'es' ? "Escribe tu respuesta aquí..." : "Type your answer here...",
                  value: triviaAnswer,
                  onChange: (e) => setTriviaAnswer(e.target.value),
                  style: Object.assign({}, S.input, { height: 38, marginBottom: 0 })
                }),
                e('button', {
                  onClick: submitTriviaAnswer,
                  disabled: checkingIn || !triviaAnswer.trim(),
                  style: Object.assign({}, S.btn, { background: T.forest, color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 10, fontWeight: 700 })
                }, checkingIn ? '...' : (lang === 'es' ? "Enviar Respuesta" : "Submit Answer"))
              ),

              // Multiple Choice UI
              activeStep.type === 'MULTIPLE_CHOICE' && e('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
                e('div', { style: { fontSize: 12.5, fontWeight: 600, color: T.ink2 } }, 
                  lang === 'es' ? "Selecciona la opción correcta:" : "Select the correct option:"
                ),
                e('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
                  (activeStep.choices || []).map((choice, cIdx) => {
                    return e('button', {
                      key: cIdx,
                      onClick: () => submitMCQChoice(choice),
                      disabled: checkingIn,
                      style: {
                        background: selectedMCQ === choice ? T.forest : T.paper3,
                        color: selectedMCQ === choice ? '#fff' : T.ink,
                        border: `1px solid ${selectedMCQ === choice ? T.forest : T.border}`,
                        padding: '10px 14px',
                        borderRadius: 10,
                        textAlign: 'left',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: 13
                      }
                    }, choice);
                  })
                )
              )
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
        ))),

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
  }),

  // QR Scanner Overlay
  isQrScannerOpen && e(QRScannerModal, {
    isOpen: isQrScannerOpen,
    onClose: () => setIsQrScannerOpen(false),
    onScanSuccess: handleQRScanSuccess,
    lang: lang
  })

  ); // end Fragment
}
