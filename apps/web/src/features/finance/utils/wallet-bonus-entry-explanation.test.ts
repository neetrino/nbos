import { describe, expect, it } from 'vitest';
import { walletBonusEntryExplanation } from './wallet-bonus-entry-explanation';
import type { EmployeeWalletBonusRow } from '@/lib/api/me';

const base: EmployeeWalletBonusRow = {
  id: 'b1',
  type: 'DELIVERY',
  status: 'ACTIVE',
  walletGroup: 'NEXT_PAYROLL',
  amount: '1000',
  percent: '5',
  releasedAmount: '500',
  paidAmount: '0',
  remainingAmount: '500',
  payrollMonth: '2026-04',
  orderPaymentType: null,
  salesAccrualHint: null,
  productLabel: 'Website',
  project: { code: 'PRJ', name: 'Alpha' },
  order: { code: 'ORD-1' },
  createdAt: '',
};

describe('walletBonusEntryExplanation', () => {
  it('explains clawback', () => {
    expect(
      walletBonusEntryExplanation({ ...base, status: 'CLAWBACK', walletGroup: 'CORRECTIONS' }),
    ).toContain('Clawback');
  });

  it('explains partial pay', () => {
    const text = walletBonusEntryExplanation({
      ...base,
      paidAmount: '200',
      remainingAmount: '800',
    });
    expect(text).toContain('Partially paid');
  });
});
