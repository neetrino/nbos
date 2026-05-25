import { describe, expect, it } from 'vitest';
import { summarizeWalletBonusForecast } from './wallet-bonus-forecast-summary';
import type { EmployeeWalletBonusRow } from '@/lib/api/me';

const row = (
  group: EmployeeWalletBonusRow['walletGroup'],
  amount: string,
  remaining = amount,
  paid = '0',
): EmployeeWalletBonusRow => ({
  id: group,
  type: 'SALES',
  status: 'INCOMING',
  walletGroup: group,
  amount,
  percent: '0',
  releasedAmount: '0',
  paidAmount: paid,
  remainingAmount: remaining,
  payrollMonth: null,
  kpiBurnedAmount: null,
  kpiBurnedReason: null,
  payrollCarryOverAmount: null,
  policyBreakdownStatuses: [],
  orderPaymentType: null,
  salesAccrualHint: null,
  productLabel: 'P',
  project: { code: 'PRJ', name: 'A' },
  order: { code: 'O' },
  createdAt: '',
});

describe('summarizeWalletBonusForecast', () => {
  it('splits incoming vs payroll pipeline vs paid', () => {
    const summary = summarizeWalletBonusForecast([
      row('POTENTIAL', '100'),
      row('IN_PROGRESS', '200'),
      row('NEXT_PAYROLL', '300', '150', '50'),
      row('PAID', '80', '0', '80'),
    ]);
    expect(summary.incomingPlanned).toBe(100);
    expect(summary.inProgressPlanned).toBe(200);
    expect(summary.nextPayrollRemaining).toBe(150);
    expect(summary.paidFromReleases).toBe(130);
  });
});
