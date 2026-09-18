import { describe, expect, it } from 'vitest';
import type { Order } from '@/lib/api/finance';
import {
  buildOrderNotesPatch,
  createOrderNotesDraft,
  isOrderNotesDirty,
} from './order-notes-form-state';

const baseOrder = {
  id: 'ord-1',
  notes: 'Existing',
} as Order;

describe('order-notes-form-state', () => {
  it('creates a draft from order notes', () => {
    expect(createOrderNotesDraft(baseOrder)).toEqual({ notes: 'Existing' });
    expect(createOrderNotesDraft({ ...baseOrder, notes: null })).toEqual({ notes: '' });
  });

  it('patches trimmed notes and clears empty to null', () => {
    const snap = createOrderNotesDraft(baseOrder);
    expect(buildOrderNotesPatch(snap, { notes: '  Next  ' })).toEqual({ notes: 'Next' });
    expect(buildOrderNotesPatch({ notes: 'Next' }, { notes: '   ' })).toEqual({ notes: null });
    expect(buildOrderNotesPatch(snap, snap)).toEqual({});
  });

  it('detects dirty notes', () => {
    expect(isOrderNotesDirty({ notes: 'A' }, { notes: 'B' })).toBe(true);
    expect(isOrderNotesDirty({ notes: 'A' }, { notes: 'A' })).toBe(false);
  });
});
