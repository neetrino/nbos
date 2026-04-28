import { describe, expect, it } from 'vitest';
import { Decimal } from '@nbos/database';
import {
  computeExpenseLedgerPaymentStatus,
  sumExpensePaymentAmounts,
} from './expense-payment-rollup';

describe('expense-payment-rollup', () => {
  it('sums payment amounts', () => {
    const sum = sumExpensePaymentAmounts([
      { amount: new Decimal('10.50') },
      { amount: new Decimal('2.25') },
    ]);
    expect(sum.toFixed(2)).toBe('12.75');
  });

  it('computes ledger payment status', () => {
    const total = new Decimal(100);
    expect(computeExpenseLedgerPaymentStatus(total, new Decimal(0))).toBe('UNPAID');
    expect(computeExpenseLedgerPaymentStatus(total, new Decimal(40))).toBe('PARTIAL');
    expect(computeExpenseLedgerPaymentStatus(total, new Decimal(100))).toBe('PAID');
    expect(computeExpenseLedgerPaymentStatus(total, new Decimal(100.01))).toBe('PAID');
  });
});
