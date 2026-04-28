import { describe, expect, it } from 'vitest';
import { resolveExpenseStatusFromLedger } from './expense-status-ledger-sync';

describe('expense-status-ledger-sync', () => {
  it('promotes to PAID when fully paid and not already PAID', () => {
    expect(resolveExpenseStatusFromLedger('THIS_MONTH', true)).toBe('PAID');
    expect(resolveExpenseStatusFromLedger('DELAYED', true)).toBe('PAID');
    expect(resolveExpenseStatusFromLedger('UNPAID', true)).toBe('PAID');
  });

  it('does not change PAID when still fully paid', () => {
    expect(resolveExpenseStatusFromLedger('PAID', true)).toBeNull();
  });

  it('demotes PAID to UNPAID when ledger no longer full', () => {
    expect(resolveExpenseStatusFromLedger('PAID', false)).toBe('UNPAID');
  });

  it('leaves non-PAID workflow alone when not fully paid', () => {
    expect(resolveExpenseStatusFromLedger('DELAYED', false)).toBeNull();
    expect(resolveExpenseStatusFromLedger('ON_HOLD', false)).toBeNull();
  });
});
