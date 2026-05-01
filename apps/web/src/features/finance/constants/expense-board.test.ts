import { describe, expect, it } from 'vitest';
import { resolveExpenseBoardColumn, utcCalendarDayFromIso } from './expense-board';

describe('utcCalendarDayFromIso', () => {
  it('returns UTC calendar day', () => {
    expect(utcCalendarDayFromIso('2026-04-15T22:00:00.000Z')).toBe('2026-04-15');
  });
});

describe('resolveExpenseBoardColumn', () => {
  it('returns null for PAID and DELAYED', () => {
    expect(
      resolveExpenseBoardColumn(
        { status: 'PAID', dueDate: null },
        { referenceDayUtc: '2026-04-10' },
      ),
    ).toBeNull();
    expect(
      resolveExpenseBoardColumn(
        { status: 'DELAYED', dueDate: '2026-04-01T00:00:00.000Z' },
        { referenceDayUtc: '2026-04-10' },
      ),
    ).toBeNull();
  });

  it('maps ON_HOLD and PAY_NOW', () => {
    expect(
      resolveExpenseBoardColumn(
        { status: 'ON_HOLD', dueDate: null },
        { referenceDayUtc: '2026-04-10' },
      ),
    ).toBe('ON_HOLD');
    expect(
      resolveExpenseBoardColumn(
        { status: 'PAY_NOW', dueDate: null },
        { referenceDayUtc: '2026-04-10' },
      ),
    ).toBe('DUE_NOW');
  });

  it('maps UNPAID by due date vs reference day', () => {
    expect(
      resolveExpenseBoardColumn(
        { status: 'UNPAID', dueDate: '2026-04-09T12:00:00.000Z' },
        { referenceDayUtc: '2026-04-10' },
      ),
    ).toBe('OVERDUE');
    expect(
      resolveExpenseBoardColumn(
        { status: 'UNPAID', dueDate: '2026-04-11T12:00:00.000Z' },
        { referenceDayUtc: '2026-04-10' },
      ),
    ).toBe('DUE_NOW');
  });

  it('maps THIS_MONTH to OVERDUE, DUE_SOON, or PLANNED', () => {
    expect(
      resolveExpenseBoardColumn(
        { status: 'THIS_MONTH', dueDate: '2026-04-01T00:00:00.000Z' },
        { referenceDayUtc: '2026-04-10' },
      ),
    ).toBe('OVERDUE');
    expect(
      resolveExpenseBoardColumn(
        { status: 'THIS_MONTH', dueDate: '2026-04-12T00:00:00.000Z' },
        { referenceDayUtc: '2026-04-10' },
      ),
    ).toBe('DUE_SOON');
    expect(
      resolveExpenseBoardColumn(
        { status: 'THIS_MONTH', dueDate: '2026-05-01T00:00:00.000Z' },
        { referenceDayUtc: '2026-04-10' },
      ),
    ).toBe('PLANNED');
    expect(
      resolveExpenseBoardColumn(
        { status: 'THIS_MONTH', dueDate: null },
        { referenceDayUtc: '2026-04-10' },
      ),
    ).toBe('PLANNED');
  });
});
