import { describe, expect, it } from 'vitest';
import { bonusSalesAccrualHint } from './bonus-sales-accrual-hint';
import type { BonusEntryListRow } from '@/lib/api/bonus';

const base: BonusEntryListRow = {
  id: 'b1',
  employeeId: 'e1',
  orderId: 'o1',
  projectId: 'p1',
  type: 'SALES',
  amount: '100',
  percent: '5',
  status: 'INCOMING',
  kpiGatePassed: null,
  payoutMonth: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  employee: { id: 'e1', firstName: 'A', lastName: 'B' },
  order: { id: 'o1', code: 'O1', totalAmount: '1000' },
  project: { id: 'p1', code: 'P1', name: 'Proj' },
};

describe('bonusSalesAccrualHint', () => {
  it('returns null for non-SALES', () => {
    expect(bonusSalesAccrualHint({ ...base, type: 'DELIVERY' })).toBeNull();
  });

  it('combines role and classic payment model', () => {
    const row: BonusEntryListRow = {
      ...base,
      salesBonusSlot: 'SELLER',
      calculationSnapshot: { paymentModel: 'CLASSIC' },
    };
    expect(bonusSalesAccrualHint(row)).toBe('Seller · Classic');
  });

  it('labels subscription recurring without slot', () => {
    const row: BonusEntryListRow = {
      ...base,
      salesBonusSlot: null,
      calculationSnapshot: { paymentModel: 'SUBSCRIPTION_RECURRING' },
    };
    expect(bonusSalesAccrualHint(row)).toBe('Subscription (month 2+)');
  });
});
