import { describe, expect, it } from 'vitest';
import { newEmptyChecklistId } from './TaskChecklistSection';

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
