import { describe, expect, it } from 'vitest';

import { resolveExpenseBoardColumn } from './expense-board';

describe('resolveExpenseBoardColumn', () => {
  it('returns null for PAID, BACKLOG, and CANCELLED', () => {
    expect(
      resolveExpenseBoardColumn({
        status: 'PAID',
        dueDate: '2026-04-01T00:00:00.000Z',
      }),
    ).toBeNull();
    expect(
      resolveExpenseBoardColumn({
        status: 'BACKLOG',
        dueDate: '2026-04-01T00:00:00.000Z',
      }),
    ).toBeNull();
    expect(
      resolveExpenseBoardColumn({
        status: 'CANCELLED',
        dueDate: null,
      }),
    ).toBeNull();
  });

  it('maps board workflow statuses directly', () => {
    expect(resolveExpenseBoardColumn({ status: 'ON_HOLD', dueDate: null })).toBe('ON_HOLD');
    expect(resolveExpenseBoardColumn({ status: 'DUE_NOW', dueDate: null })).toBe('DUE_NOW');
    expect(
      resolveExpenseBoardColumn({
        status: 'OVERDUE',
        dueDate: '2026-04-01T00:00:00.000Z',
      }),
    ).toBe('OVERDUE');
    expect(
      resolveExpenseBoardColumn({
        status: 'DUE_SOON',
        dueDate: '2026-04-12T00:00:00.000Z',
      }),
    ).toBe('DUE_SOON');
    expect(
      resolveExpenseBoardColumn({
        status: 'PLANNED',
        dueDate: '2026-05-01T00:00:00.000Z',
      }),
    ).toBe('PLANNED');
  });
});
