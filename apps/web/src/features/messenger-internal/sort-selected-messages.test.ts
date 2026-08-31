import { describe, expect, it } from 'vitest';
import { sortSelectedMessages } from './sort-selected-messages';

describe('sortSelectedMessages', () => {
  it('orders by createdAt asc then id', () => {
    const rows = [
      { id: 'b', createdAt: '2026-08-31T12:00:00.000Z' },
      { id: 'a', createdAt: '2026-08-31T12:00:00.000Z' },
      { id: 'c', createdAt: '2026-08-31T11:00:00.000Z' },
    ];
    expect(sortSelectedMessages(rows).map((row) => row.id)).toEqual(['c', 'a', 'b']);
  });
});
