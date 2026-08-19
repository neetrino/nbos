import { describe, expect, it } from 'vitest';
import {
  checklistProgressLabel,
  newEmptyChecklistId,
  visibleChecklistItems,
} from './task-checklist-helpers';

describe('newEmptyChecklistId', () => {
  it('returns the last checklist when it has no items', () => {
    expect(
      newEmptyChecklistId([
        { id: 'a', items: [{ id: 'i' }] },
        { id: 'b', items: [] },
      ]),
    ).toBe('b');
  });

  it('returns null when the last checklist already has items', () => {
    expect(newEmptyChecklistId([{ id: 'a', items: [{ id: 'i' }] }])).toBeNull();
  });

  it('returns null when there are no checklists', () => {
    expect(newEmptyChecklistId([])).toBeNull();
  });
});

describe('visibleChecklistItems', () => {
  const items = [
    { id: 'a', checked: true },
    { id: 'b', checked: false },
  ];

  it('returns every item when hide is off', () => {
    expect(visibleChecklistItems(items, false)).toEqual(items);
  });

  it('drops completed items when hide is on', () => {
    expect(visibleChecklistItems(items, true)).toEqual([{ id: 'b', checked: false }]);
  });
});

describe('checklistProgressLabel', () => {
  it('formats done over total', () => {
    expect(checklistProgressLabel(0, 1)).toBe('0/1 done');
  });
});
