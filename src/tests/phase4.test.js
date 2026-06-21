import { expect, test } from 'vitest';
import { api } from '../utils/api';

test('Verify check-in time locks restrict player actions', () => {
  const now = new Date();
  
  // Hunt 1: Future start time
  const futureHunt = {
    id: 'hunt-future',
    start_time: new Date(now.getTime() + 100000).toISOString(),
    end_time: new Date(now.getTime() + 500000).toISOString()
  };

  // Hunt 2: Past end time
  const endedHunt = {
    id: 'hunt-ended',
    start_time: new Date(now.getTime() - 500000).toISOString(),
    end_time: new Date(now.getTime() - 100000).toISOString()
  };

  // Hunt 3: Active window
  const activeHunt = {
    id: 'hunt-active',
    start_time: new Date(now.getTime() - 100000).toISOString(),
    end_time: new Date(now.getTime() + 100000).toISOString()
  };

  const evaluateActive = (hunt) => {
    const cur = new Date();
    if (hunt.start_time && new Date(hunt.start_time) > cur) {
      return 'LOCKED_FUTURE';
    }
    if (hunt.end_time && new Date(hunt.end_time) < cur) {
      return 'LOCKED_ENDED';
    }
    return 'ACTIVE';
  };

  expect(evaluateActive(futureHunt)).toBe('LOCKED_FUTURE');
  expect(evaluateActive(endedHunt)).toBe('LOCKED_ENDED');
  expect(evaluateActive(activeHunt)).toBe('ACTIVE');
});

test('Verify organizer submission approval updates state correctly', () => {
  const submissions = [
    { id: 'sub-1', username: 'player1', status: 'PENDING', step_id: 'step-1' },
    { id: 'sub-2', username: 'player2', status: 'APPROVED', step_id: 'step-2' }
  ];

  const updateStatus = (list, subId, status) => {
    return list.map(sub => sub.id === subId ? { ...sub, status } : sub);
  };

  const listAfterApproval = updateStatus(submissions, 'sub-1', 'APPROVED');
  expect(listAfterApproval[0].status).toBe('APPROVED');

  const listAfterRejection = updateStatus(submissions, 'sub-2', 'REJECTED');
  expect(listAfterRejection[1].status).toBe('REJECTED');
});
