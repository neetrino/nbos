import { describe, expect, it } from 'vitest';
import { Decimal } from '@nbos/database';
import { attachLedgerFieldsToExpenseListItems } from './expense-list-ledger';

describe('expense-list-ledger', () => {
  it('attaches ledger fields from paid totals map', () => {
    const paidTotals = new Map<string, Decimal>([['e1', new Decimal('30')]]);
    const items = [{ id: 'e1', amount: new Decimal(100), name: 'X' }];
    const out = attachLedgerFieldsToExpenseListItems(items, paidTotals);
    expect(out[0]).toMatchObject({
      paidAmount: '30.00',
      remainingAmount: '70.00',
      paymentStatus: 'PARTIAL',
    });
  });

  it('treats missing totals as zero paid', () => {
    const paidTotals = new Map<string, Decimal>();
    const items = [{ id: 'e2', amount: new Decimal(50), name: 'Y' }];
    const out = attachLedgerFieldsToExpenseListItems(items, paidTotals);
    expect(out[0]).toMatchObject({
      paidAmount: '0.00',
      remainingAmount: '50.00',
      paymentStatus: 'UNPAID',
    });
  });
});
