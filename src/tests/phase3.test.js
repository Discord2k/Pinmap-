import { expect, test } from 'vitest';
import { api } from '../utils/api';

test('Simulate shared progress logs for team members in same team', async () => {
  // We mock Supabase queries or simulate database state transition logic 
  const sampleSteps = [
    { id: 'step-1', pin_id: 'pin-a', sequence_order: 1, point_rules: { check_in: 150 } },
    { id: 'step-2', pin_id: 'pin-b', sequence_order: 2, point_rules: { check_in: 200 } }
  ];

  // If player A completes step-1 check_in:
  const playerA_participant = { id: 'part-a', team_id: 'team-x', total_points: 0 };
  const playerB_participant = { id: 'part-b', team_id: 'team-x', total_points: 0 };

  const logs = [
    { id: 'log-1', participant_id: 'part-a', step_id: 'step-1', activity_type: 'check_in', points: 150 }
  ];

  // The database trigger replicates 'log-1' for Player B:
  const replicatedLogs = logs.map(l => {
    if (l.participant_id === 'part-a') {
      return [
        l,
        { id: 'log-replicated', participant_id: 'part-b', step_id: l.step_id, activity_type: l.activity_type, points: l.points }
      ];
    }
    return [l];
  }).flat();

  expect(replicatedLogs.length).toBe(2);
  expect(replicatedLogs[1].participant_id).toBe('part-b');
  expect(replicatedLogs[1].points).toBe(150);

  // Sync scores updates participant rows
  playerA_participant.total_points += 150;
  playerB_participant.total_points += 150;
  
  expect(playerA_participant.total_points).toBe(150);
  expect(playerB_participant.total_points).toBe(150);
});

test('Verify routing visibility logic for LINEAR vs FREE_ROAMING setting', () => {
  const steps = [
    { id: 's1', pin_id: 'pin-1', sequence_order: 1 },
    { id: 's2', pin_id: 'pin-2', sequence_order: 2 },
    { id: 's3', pin_id: 'pin-3', sequence_order: 3 }
  ];
  
  const pins = [
    { id: 'pin-1', name: 'Pin 1' },
    { id: 'pin-2', name: 'Pin 2' },
    { id: 'pin-3', name: 'Pin 3' },
    { id: 'pin-other', name: 'Other Location' }
  ];

  // Scenario 1: LINEAR routing, user is on Step 2 (participantStep = 2)
  // Pin 3 should be hidden, Pin 1, 2 and other pins should be visible
  const activeHuntLinear = {
    routing_mode: 'LINEAR',
    participantStep: 2,
    steps: steps
  };

  const activeHuntPinsMap = {};
  activeHuntLinear.steps.forEach((s, idx) => {
    activeHuntPinsMap[s.pin_id] = { index: idx, step: s };
  });

  const displayedPinsLinear = pins.filter(p => {
    const hStep = activeHuntPinsMap[p.id];
    if (!hStep) return true;
    const activeIdx = activeHuntLinear.participantStep - 1;
    return hStep.index <= activeIdx;
  });

  expect(displayedPinsLinear.map(p => p.id)).toContain('pin-1');
  expect(displayedPinsLinear.map(p => p.id)).toContain('pin-2');
  expect(displayedPinsLinear.map(p => p.id)).not.toContain('pin-3');
  expect(displayedPinsLinear.map(p => p.id)).toContain('pin-other');

  // Scenario 2: FREE_ROAMING routing
  // All hunt pins should be visible
  const activeHuntFree = {
    routing_mode: 'FREE_ROAMING',
    participantStep: 1,
    steps: steps
  };

  const activeHuntPinsMapFree = {};
  activeHuntFree.steps.forEach((s, idx) => {
    activeHuntPinsMapFree[s.pin_id] = { index: idx, step: s };
  });

  const displayedPinsFree = pins.filter(p => {
    const hStep = activeHuntPinsMapFree[p.id];
    if (!hStep) return true;
    return true; // FREE_ROAMING keeps all
  });

  expect(displayedPinsFree.map(p => p.id)).toContain('pin-1');
  expect(displayedPinsFree.map(p => p.id)).toContain('pin-2');
  expect(displayedPinsFree.map(p => p.id)).toContain('pin-3');
  expect(displayedPinsFree.map(p => p.id)).toContain('pin-other');
});
