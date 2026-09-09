import { describe, expect, it } from 'vitest';
import { fallbackMobileDockItems } from './mobile-module-fallback-dock';

describe('fallbackMobileDockItems', () => {
  it('adds task destinations without treating recurring as the board', () => {
    const items = fallbackMobileDockItems('/tasks/recurring');
    expect(items.find((item) => item.id === 'fallback:task-board')?.active).toBe(false);
    expect(items.find((item) => item.id === 'fallback:recurring')?.active).toBe(true);
  });

  it('returns nothing for modules that already register their own map', () => {
    expect(fallbackMobileDockItems('/dashboard')).toEqual([]);
    expect(fallbackMobileDockItems('/crm/leads')).toEqual([]);
  });
});
