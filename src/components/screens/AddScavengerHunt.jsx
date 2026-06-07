import React, { useState } from 'react';
import { api } from '../../utils/api';
import { T, S } from '../../utils/styles';

const e = React.createElement;

export function AddScavengerHunt({ uname, pins = [], trails = [], lang = 'en', onCreated, onCancel, flash }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  });
  const [visibility, setVisibility] = useState('public');
  const [completionMessage, setCompletionMessage] = useState('');
  const [completionUrl, setCompletionUrl] = useState('');
  const [steps, setSteps] = useState([
    { sequence_order: 1, clue: '', pin_id: '', trail_id: '', point_rules: { check_in: 100 } }
  ]);
  const [saving, setSaving] = useState(false);

  const handleAddStep = () => {
    setSteps([
      ...steps,
      {
        sequence_order: steps.length + 1,
        clue: '',
        pin_id: '',
        trail_id: '',
        point_rules: { check_in: 100 }
      }
    ]);
  };

  const handleRemoveStep = (idx) => {
    const newSteps = steps.filter((_, i) => i !== idx).map((s, i) => ({
      ...s,
      sequence_order: i + 1
    }));
    setSteps(newSteps);
  };

  const handleStepChange = (idx, field, value) => {
    const newSteps = [...steps];
    newSteps[idx][field] = value;
    setSteps(newSteps);
  };

  const handleObjectiveToggle = (stepIdx, actionType, pointsVal) => {
    const newSteps = [...steps];
    const rules = { ...newSteps[stepIdx].point_rules };
    
    if (rules[actionType]) {
      delete rules[actionType];
    } else {
      rules[actionType] = pointsVal;
    }
    
    newSteps[stepIdx].point_rules = rules;
    setSteps(newSteps);
  };

  const handleObjectivePointsChange = (stepIdx, actionType, value) => {
    const newSteps = [...steps];
    newSteps[stepIdx].point_rules = {
      ...newSteps[stepIdx].point_rules,
      [actionType]: parseInt(value) || 0
    };
    setSteps(newSteps);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      flash(lang === 'es' ? "Por favor ingresa un nombre para la búsqueda." : "Please enter a name for the hunt.");
      return;
    }
    if (steps.some(s => !s.pin_id)) {
      flash(lang === 'es' ? "Todos los pasos deben tener un pin seleccionado." : "All steps must have a selected pin.");
      return;
    }
    if (steps.some(s => !s.clue.trim())) {
      flash(lang === 'es' ? "Por favor escribe una pista para cada paso." : "Please write a clue for each step.");
      return;
    }

    setSaving(true);
    try {
      const huntPayload = {
        creator: uname,
        name: name,
        description: description,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        visibility: visibility,
        completion_message: completionMessage || null,
        completion_url: completionUrl || null
      };

      const createdHunt = await api.createHunt(huntPayload);

      const stepPayloads = steps.map(s => ({
        hunt_id: createdHunt.id,
        sequence_order: s.sequence_order,
        clue: s.clue,
        pin_id: s.pin_id,
        trail_id: s.trail_id || null,
        point_rules: s.point_rules
      }));

      await api.createHuntSteps(stepPayloads);

      flash(lang === 'es' ? "🏆 ¡Búsqueda del tesoro creada con éxito!" : "🏆 Scavenger hunt created successfully!");
      if (onCreated) onCreated(createdHunt);
    } catch (err) {
      console.error("Failed to create scavenger hunt:", err);
      flash(lang === 'es' ? "Error al crear la búsqueda." : "Error creating the scavenger hunt.");
    } finally {
      setSaving(false);
    }
  };

  const myPins = pins.filter(p => p.owner === uname);
  const myTrails = trails.filter(t => t.owner === uname);

  // Haversine distance helper (in km)
  function getDistance(lat1, lon1, lat2, lon2) {
    if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return Infinity;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Cluster pins that are within 5km of each other
  function getClusteredPins(pinsList) {
    const thresholdKm = 5;
    const clusters = [];
    const visited = new Set();
    const sortedPins = [...pinsList].sort((a, b) => a.name.localeCompare(b.name));

    for (let i = 0; i < sortedPins.length; i++) {
      const pin = sortedPins[i];
      if (visited.has(pin.id)) continue;

      const clusterPins = [pin];
      visited.add(pin.id);

      for (let j = 0; j < sortedPins.length; j++) {
        const other = sortedPins[j];
        if (visited.has(other.id)) continue;

        const dist = getDistance(pin.lat, pin.lng, other.lat, other.lng);
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
  }

  const pinGroups = getClusteredPins(myPins);

  return e('div', { style: { display: 'flex', flexDirection: 'column', gap: 16 } },
    // Title
    e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.borderSoft}`, paddingBottom: 10 } },
      e('div', { style: { fontSize: 16, fontWeight: 800, color: T.ink } },
        lang === 'es' ? "Crear Nueva Búsqueda" : "Create New Hunt"),
      e('button', { onClick: onCancel, style: S.miniBtn }, lang === 'es' ? "Atrás" : "Back")
    ),

    // Form fields
    e('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
      e('label', { htmlFor: 'hunt-name-input', style: { fontSize: 12.5, fontWeight: 700, color: T.ink2 } }, lang === 'es' ? "Nombre de la Búsqueda" : "Hunt Name"),
      e('input', {
        id: 'hunt-name-input',
        name: 'hunt_name',
        type: 'text',
        placeholder: lang === 'es' ? "Búsqueda del Tesoro del Parque..." : "Park Treasure Hunt...",
        value: name,
        onChange: (e) => setName(e.target.value),
        style: S.input
      }),

      e('label', { htmlFor: 'hunt-description-input', style: { fontSize: 12.5, fontWeight: 700, color: T.ink2 } }, lang === 'es' ? "Descripción / Reglas" : "Description / Rules"),
      e('textarea', {
        id: 'hunt-description-input',
        name: 'hunt_description',
        rows: 2,
        placeholder: lang === 'es' ? "Encuentra los tesoros escondidos resolviendo las pistas..." : "Find the hidden spots by solving the clues...",
        value: description,
        onChange: (e) => setDescription(e.target.value),
        style: S.textarea
      }),

      e('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } },
        e('div', null,
          e('label', { htmlFor: 'hunt-start-date-input', style: { fontSize: 12, fontWeight: 700, color: T.ink3 } }, lang === 'es' ? "Fecha de Inicio" : "Start Date"),
          e('input', {
            id: 'hunt-start-date-input',
            name: 'hunt_start_date',
            type: 'date',
            value: startDate,
            onChange: (e) => setStartDate(e.target.value),
            style: S.input
          })
        ),
        e('div', null,
          e('label', { htmlFor: 'hunt-end-date-input', style: { fontSize: 12, fontWeight: 700, color: T.ink3 } }, lang === 'es' ? "Fecha Límite" : "End Date"),
          e('input', {
            id: 'hunt-end-date-input',
            name: 'hunt_end_date',
            type: 'date',
            value: endDate,
            onChange: (e) => setEndDate(e.target.value),
            style: S.input
          })
        )
      ),

      e('label', { htmlFor: 'hunt-visibility-input', style: { fontSize: 12.5, fontWeight: 700, color: T.ink2 } }, lang === 'es' ? "Visibilidad" : "Visibility"),
      e('select', {
        id: 'hunt-visibility-input',
        name: 'hunt_visibility',
        value: visibility,
        onChange: (e) => setVisibility(e.target.value),
        style: Object.assign({}, S.input, { height: 46 })
      },
        e('option', { value: 'public' }, lang === 'es' ? "Pública — todos pueden participar" : "Public — open to everyone"),
        e('option', { value: 'private' }, lang === 'es' ? "Privada — acceso con link de invitación" : "Private — shared link only")
      ),

      e('label', { htmlFor: 'hunt-completion-message-input', style: { fontSize: 12.5, fontWeight: 700, color: T.ink2 } }, lang === 'es' ? "Mensaje de Finalización" : "Completion Message"),
      e('textarea', {
        id: 'hunt-completion-message-input',
        name: 'completion_message',
        rows: 2,
        placeholder: lang === 'es' ? "¡Felicidades por completar la búsqueda! Aquí tienes tu recompensa..." : "Congrats on completing the hunt! Here is your reward details...",
        value: completionMessage,
        onChange: (e) => setCompletionMessage(e.target.value),
        style: S.textarea
      }),

      e('label', { htmlFor: 'hunt-completion-url-input', style: { fontSize: 12.5, fontWeight: 700, color: T.ink2 } }, lang === 'es' ? "Enlace / URL de Finalización" : "Completion URL / Link"),
      e('input', {
        id: 'hunt-completion-url-input',
        name: 'completion_url',
        type: 'url',
        placeholder: "https://example.com/reward",
        value: completionUrl,
        onChange: (e) => setCompletionUrl(e.target.value),
        style: S.input
      })
    ),

    // Steps list header
    e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, borderTop: `1px solid ${T.borderSoft}`, paddingTop: 16 } },
      e('div', { style: { fontSize: 14, fontWeight: 800, color: T.ink } },
        lang === 'es' ? "Puntos / Objetivos del Recorrido" : "Hunt Steps / Objectives"),
      e('button', {
        onClick: handleAddStep,
        style: Object.assign({}, S.miniBtn, { background: T.forest, color: T.paper, border: 'none' })
      }, lang === 'es' ? "+ Agregar Paso" : "+ Add Step")
    ),

    // Steps
    e('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
      steps.map((step, idx) => (
        e('div', {
          key: idx,
          style: {
            background: T.paper3, border: `1px solid ${T.border}`,
            borderRadius: 14, padding: 14, position: 'relative', display: 'flex', flexDirection: 'column', gap: 10
          }
        },
          // Remove button
          steps.length > 1 && e('button', {
            onClick: () => handleRemoveStep(idx),
            style: {
              position: 'absolute', top: 10, right: 10,
              background: 'none', border: 'none', color: '#c62828',
              fontWeight: 700, cursor: 'pointer', fontSize: 12
            }
          }, lang === 'es' ? "Eliminar" : "Remove"),

          e('div', { style: { fontSize: 13, fontWeight: 700, color: T.forest } },
            `${lang === 'es' ? "Paso" : "Step"} ${step.sequence_order}`),

          // Pin Selector
          e('div', null,
            e('label', { htmlFor: `step-pin-select-${idx}`, style: { fontSize: 11.5, color: T.ink3, fontWeight: 700, display: 'block', marginBottom: 4 } },
              lang === 'es' ? "Pin de Destino" : "Destination Pin"),
            e('select', {
              id: `step-pin-select-${idx}`,
              name: `step_pin_${idx}`,
              value: step.pin_id,
              onChange: (e) => handleStepChange(idx, 'pin_id', e.target.value),
              style: Object.assign({}, S.input, { height: 42, marginBottom: 0 })
            },
              e('option', { value: '' }, lang === 'es' ? "-- Selecciona un Pin --" : "-- Select a Pin --"),
              pinGroups.map((group, gIdx) =>
                e('optgroup', { key: gIdx, label: group.label },
                  group.pins.map(p => e('option', { key: p.id, value: p.id }, p.name))
                )
              )
            )
          ),

          // Clue
          e('div', null,
            e('label', { htmlFor: `step-clue-textarea-${idx}`, style: { fontSize: 11.5, color: T.ink3, fontWeight: 700, display: 'block', marginBottom: 4 } },
              lang === 'es' ? "Pista para este destino" : "Clue for this spot"),
            e('textarea', {
              id: `step-clue-textarea-${idx}`,
              name: `step_clue_${idx}`,
              rows: 2,
              placeholder: lang === 'es' ? "Busca debajo del gran roble..." : "Look near the old brick fountain...",
              value: step.clue,
              onChange: (e) => handleStepChange(idx, 'clue', e.target.value),
              style: Object.assign({}, S.textarea, { marginBottom: 0 })
            })
          ),

          // Trail Selector (Optional)
          e('div', null,
            e('label', { htmlFor: `step-trail-select-${idx}`, style: { fontSize: 11.5, color: T.ink3, fontWeight: 700, display: 'block', marginBottom: 4 } },
              lang === 'es' ? "Ruta a seguir (Opcional)" : "Follow Trail (Optional)"),
            e('select', {
              id: `step-trail-select-${idx}`,
              name: `step_trail_${idx}`,
              value: step.trail_id || '',
              onChange: (e) => handleStepChange(idx, 'trail_id', e.target.value),
              style: Object.assign({}, S.input, { height: 42, marginBottom: 0 })
            },
              e('option', { value: '' }, lang === 'es' ? "-- Ninguna ruta --" : "-- No trail --"),
              myTrails.map(t => e('option', { key: t.id, value: t.id }, t.name))
            )
          ),

          // Objectives / Stackable point customization
          e('div', { style: { background: T.paper, padding: 10, borderRadius: 10 } },
            e('div', { style: { fontSize: 11.5, color: T.ink2, fontWeight: 700, marginBottom: 6 } },
              lang === 'es' ? "Objetivos y Puntos del Paso" : "Objective Point Setup"),
            
            // Objectives Grid
            e('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
              // Check-in (always enabled by default, but customizable points)
              e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 } },
                e('label', { htmlFor: `step-checkin-checkbox-${idx}`, style: { display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 } },
                  e('input', { id: `step-checkin-checkbox-${idx}`, name: `step_checkin_cb_${idx}`, type: 'checkbox', checked: true, disabled: true }),
                  lang === 'es' ? "Llegar al Pin (Check-in)" : "Arrive at Pin (Check-in)"
                ),
                e('input', {
                  id: `step-checkin-points-${idx}`,
                  name: `step_checkin_pts_${idx}`,
                  type: 'number',
                  min: 0,
                  value: step.point_rules.check_in || 0,
                  onChange: (e) => handleObjectivePointsChange(idx, 'check_in', e.target.value),
                  style: { width: 60, padding: 4, borderRadius: 6, border: `1px solid ${T.border}`, textAlign: 'right' },
                  'aria-label': lang === 'es' ? "Puntos por check-in" : "Check-in points"
                })
              ),

              // Upload Photo (optional)
              e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 } },
                e('label', { htmlFor: `step-photo-checkbox-${idx}`, style: { display: 'flex', alignItems: 'center', gap: 6 } },
                  e('input', {
                    id: `step-photo-checkbox-${idx}`,
                    name: `step_photo_cb_${idx}`,
                    type: 'checkbox',
                    checked: !!step.point_rules.photo_upload,
                    onChange: () => handleObjectiveToggle(idx, 'photo_upload', 50)
                  }),
                  lang === 'es' ? "Subir Foto" : "Upload Photo"
                ),
                !!step.point_rules.photo_upload && e('input', {
                  id: `step-photo-points-${idx}`,
                  name: `step_photo_pts_${idx}`,
                  type: 'number',
                  min: 0,
                  value: step.point_rules.photo_upload || 0,
                  onChange: (e) => handleObjectivePointsChange(idx, 'photo_upload', e.target.value),
                  style: { width: 60, padding: 4, borderRadius: 6, border: `1px solid ${T.border}`, textAlign: 'right' },
                  'aria-label': lang === 'es' ? "Puntos por subir foto" : "Photo upload points"
                })
              ),

              // Leave Comment / Journal (optional)
              e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 } },
                e('label', { htmlFor: `step-comment-checkbox-${idx}`, style: { display: 'flex', alignItems: 'center', gap: 6 } },
                  e('input', {
                    id: `step-comment-checkbox-${idx}`,
                    name: `step_comment_cb_${idx}`,
                    type: 'checkbox',
                    checked: !!step.point_rules.comment,
                    onChange: () => handleObjectiveToggle(idx, 'comment', 50)
                  }),
                  lang === 'es' ? "Agregar Diario / Comentario" : "Write Field Journal"
                ),
                !!step.point_rules.comment && e('input', {
                  id: `step-comment-points-${idx}`,
                  name: `step_comment_pts_${idx}`,
                  type: 'number',
                  min: 0,
                  value: step.point_rules.comment || 0,
                  onChange: (e) => handleObjectivePointsChange(idx, 'comment', e.target.value),
                  style: { width: 60, padding: 4, borderRadius: 6, border: `1px solid ${T.border}`, textAlign: 'right' },
                  'aria-label': lang === 'es' ? "Puntos por escribir diario" : "Journal points"
                })
              ),

              // Create & Link Trail (optional)
              e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 } },
                e('label', { htmlFor: `step-createtrail-checkbox-${idx}`, style: { display: 'flex', alignItems: 'center', gap: 6 } },
                  e('input', {
                    id: `step-createtrail-checkbox-${idx}`,
                    name: `step_createtrail_cb_${idx}`,
                    type: 'checkbox',
                    checked: !!step.point_rules.create_trail,
                    onChange: () => handleObjectiveToggle(idx, 'create_trail', 150)
                  }),
                  lang === 'es' ? "Grabar y Vincular Ruta a este Pin" : "Record & Link Trail to this Pin"
                ),
                !!step.point_rules.create_trail && e('input', {
                  id: `step-createtrail-points-${idx}`,
                  name: `step_createtrail_pts_${idx}`,
                  type: 'number',
                  min: 0,
                  value: step.point_rules.create_trail || 0,
                  onChange: (e) => handleObjectivePointsChange(idx, 'create_trail', e.target.value),
                  style: { width: 60, padding: 4, borderRadius: 6, border: `1px solid ${T.border}`, textAlign: 'right' },
                  'aria-label': lang === 'es' ? "Puntos por grabar ruta" : "Create trail points"
                })
              ),

              // Follow Trail (optional, only show if trail is selected)
              step.trail_id && e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 } },
                e('label', { htmlFor: `step-trailfollow-checkbox-${idx}`, style: { display: 'flex', alignItems: 'center', gap: 6 } },
                  e('input', {
                    id: `step-trailfollow-checkbox-${idx}`,
                    name: `step_trailfollow_cb_${idx}`,
                    type: 'checkbox',
                    checked: !!step.point_rules.trail_follow,
                    onChange: () => handleObjectiveToggle(idx, 'trail_follow', 150)
                  }),
                  lang === 'es' ? "Completar Sendero" : "Follow Trail Route"
                ),
                !!step.point_rules.trail_follow && e('input', {
                  id: `step-trailfollow-points-${idx}`,
                  name: `step_trailfollow_pts_${idx}`,
                  type: 'number',
                  min: 0,
                  value: step.point_rules.trail_follow || 0,
                  onChange: (e) => handleObjectivePointsChange(idx, 'trail_follow', e.target.value),
                  style: { width: 60, padding: 4, borderRadius: 6, border: `1px solid ${T.border}`, textAlign: 'right' },
                  'aria-label': lang === 'es' ? "Puntos por seguir sendero" : "Follow trail points"
                })
              )
            )
          )
        )))
    ),

    // Save button
    e('button', {
      onClick: handleSave,
      disabled: saving,
      style: Object.assign({}, S.btn, {
        marginTop: 10,
        background: saving ? T.forest2 : T.forest,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
      })
    },
      saving && e('div', {
        style: {
          width: 14, height: 14, border: '2px solid transparent',
          borderTopColor: T.paper, borderRadius: '50%',
          animation: 'spin 0.6s linear infinite'
        }
      }),
      lang === 'es' ? "Publicar Búsqueda del Tesoro" : "Publish Scavenger Hunt"
    )
  );
}
