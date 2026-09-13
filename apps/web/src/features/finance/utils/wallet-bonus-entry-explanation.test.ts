import { describe, expect, it } from 'vitest';
import { resolveWalletBonusEntryExplanation } from './wallet-bonus-entry-explanation';
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
  kpiBurnedAmount: null,
  kpiBurnedReason: null,
  payrollCarryOverAmount: null,
  orderPaymentType: null,
  salesAccrualHint: null,
  productLabel: 'Website',
  project: { code: 'PRJ', name: 'Alpha' },
  order: { code: 'ORD-1' },
  policyBreakdownStatuses: [],
  createdAt: '',
};

describe('resolveWalletBonusEntryExplanation', () => {
  it('explains clawback', () => {
    expect(
      resolveWalletBonusEntryExplanation({
        ...base,
        status: 'CLAWBACK',
        walletGroup: 'CORRECTIONS',
      }),
    ).toEqual({ source: 'message', key: 'clawback' });
  });

  it('explains partial pay', () => {
    expect(
      resolveWalletBonusEntryExplanation({
        ...base,
        paidAmount: '200',
        remainingAmount: '800',
      }),
    ).toEqual({ source: 'message', key: 'partial' });
  });

  it('uses persisted burned reason when present', () => {
    expect(
      resolveWalletBonusEntryExplanation({
        ...base,
        type: 'SALES',
        kpiBurnedAmount: '50.00',
        kpiBurnedReason: 'Sales KPI: 60% of plan → 50% payout; 50.00 excluded',
      }),
    ).toEqual({
      source: 'raw',
      text: 'Sales KPI: 60% of plan → 50% payout; 50.00 excluded',
    });
  });
});
