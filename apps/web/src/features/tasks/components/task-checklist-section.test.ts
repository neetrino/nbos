import { describe, expect, it } from 'vitest';
import {
  checklistProgressLabel,
  newEmptyChecklistId,
  nextDefaultChecklistTitle,
  resolveChecklistTextCommit,
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

describe('nextDefaultChecklistTitle', () => {
  it('starts at Checklist 1 and fills the first gap', () => {
    expect(nextDefaultChecklistTitle([])).toBe('Checklist 1');
    expect(nextDefaultChecklistTitle(['Checklist 1', 'QA'])).toBe('Checklist 2');
    expect(nextDefaultChecklistTitle(['Checklist 2'])).toBe('Checklist 1');
  });
});

describe('resolveChecklistTextCommit', () => {
  it('cancels an empty draft', () => {
    expect(resolveChecklistTextCommit('   ', 'Item')).toEqual({ action: 'cancel' });
  });

  it('is a noop when text is unchanged', () => {
    expect(resolveChecklistTextCommit('Item', 'Item')).toEqual({ action: 'noop' });
  });

  it('commits a trimmed change', () => {
    expect(resolveChecklistTextCommit('  Next  ', 'Item')).toEqual({
      action: 'commit',
      value: 'Next',
    });
  });
});
