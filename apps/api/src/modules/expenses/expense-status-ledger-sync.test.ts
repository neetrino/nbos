import { describe, expect, it } from 'vitest';
import { resolveExpenseStatusFromLedger } from './expense-status-ledger-sync';

describe('expense-status-ledger-sync', () => {
  it('promotes to PAID when fully paid and not already PAID', () => {
    expect(resolveExpenseStatusFromLedger('PLANNED', true, null)).toBe('PAID');
    expect(resolveExpenseStatusFromLedger('BACKLOG', true, null)).toBe('PAID');
    expect(resolveExpenseStatusFromLedger('DUE_NOW', true, null)).toBe('PAID');
  });

  it('does not change PAID when still fully paid', () => {
    expect(resolveExpenseStatusFromLedger('PAID', true, null)).toBeNull();
  });

  it('demotes PAID to time-based workflow when ledger no longer full', () => {
    expect(resolveExpenseStatusFromLedger('PAID', false, new Date('2099-06-01'))).toBe('PLANNED');
  });

  it('leaves non-PAID workflow alone when not fully paid', () => {
    expect(resolveExpenseStatusFromLedger('BACKLOG', false, null)).toBeNull();
    expect(resolveExpenseStatusFromLedger('ON_HOLD', false, null)).toBeNull();
  });
});
