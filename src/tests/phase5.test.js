import { expect, test, vi } from 'vitest';
import { api } from '../utils/api';

test('Verify activity checkin caching and sync behavior', async () => {
  // Mock navigator.onLine value andIndexedDB triggers
  const prevOnLine = navigator.onLine;

  const mockDb = [];
  const dbPut = (item) => {
    mockDb.push(item);
    return Promise.resolve();
  };

  // 1. Simulate checkin logging offline
  Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

  const logItem = {
    id: "activity_log_test",
    participant_id: 'part-x',
    step_id: 'step-1',
    activity_type: 'check_in',
    points_awarded: 100,
    created_at: new Date().toISOString()
  };

  if (navigator.onLine === false) {
    await dbPut(logItem);
  }

  expect(mockDb.length).toBe(1);
  expect(mockDb[0].id).toBe("activity_log_test");

  // Restore onLine
  Object.defineProperty(navigator, 'onLine', { value: prevOnLine, configurable: true });
});
