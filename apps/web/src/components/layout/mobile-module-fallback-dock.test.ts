import { describe, expect, it } from 'vitest';
import { fallbackMobileDockItems } from './mobile-module-fallback-dock';

describe('fallbackMobileDockItems', () => {
  it('adds dashboard shortcuts', () => {
    expect(fallbackMobileDockItems('/dashboard').map((item) => item.id)).toEqual([
      'fallback:leads',
      'fallback:tasks',
      'fallback:invoices',
      'fallback:calendar',
    ]);
  });

  it('adds task destinations without treating recurring as the board', () => {
    const items = fallbackMobileDockItems('/tasks/recurring');
    expect(items.find((item) => item.id === 'fallback:task-board')?.active).toBe(false);
    expect(items.find((item) => item.id === 'fallback:recurring')?.active).toBe(true);
  });

  it('returns nothing when the page already has module tabs', () => {
    expect(fallbackMobileDockItems('/crm/leads')).toEqual([]);
  });
});
