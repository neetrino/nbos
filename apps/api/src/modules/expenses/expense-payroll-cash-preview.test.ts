import { describe, expect, it } from 'vitest';
import { Decimal } from '@nbos/database';

import { buildExpensePayrollCashPreview } from './expense-payroll-cash-preview';

const SALARY = new Decimal('300000.00');
const BONUS = new Decimal('60000.00');

describe('buildExpensePayrollCashPreview', () => {
  it('shows full salary and the included bonus before any payment', () => {
    const preview = buildExpensePayrollCashPreview({
      baseSalary: SALARY,
      carryAppliedAmount: null,
      payments: [],
      releases: [release('rel-60', BONUS, 'September bonus', 'ORD-1')],
    });

    expect(preview.salaryRemaining).toBe('300000.00');
    expect(preview.carryRemaining).toBe('0.00');
    expect(preview.bonuses).toEqual([
      {
        bonusReleaseId: 'rel-60',
        title: 'September bonus',
        orderCode: 'ORD-1',
        remaining: '60000.00',
      },
    ]);
  });

  it('leaves 40000 of the named bonus after a 320000 payment', () => {
    const preview = buildExpensePayrollCashPreview({
      baseSalary: SALARY,
      carryAppliedAmount: null,
      payments: [
        {
          id: 'pay-1',
          amount: new Decimal('320000.00'),
          notes: encodedCash('300000.00', 'rel-60', '20000.00'),
        },
      ],
      releases: [release('rel-60', BONUS, 'September bonus', 'ORD-1')],
    });

    expect(preview.salaryRemaining).toBe('0.00');
    expect(preview.bonuses).toEqual([
      {
        bonusReleaseId: 'rel-60',
        title: 'September bonus',
        orderCode: 'ORD-1',
        remaining: '40000.00',
      },
    ]);
  });
});

function release(
  id: string,
  amount: Decimal,
  title: string,
  orderCode: string,
): {
  id: string;
  amount: Decimal;
  payrollIncludedAmount: Decimal | null;
  status: string;
  title: string;
  orderCode: string;
} {
  return {
    id,
    amount,
    payrollIncludedAmount: amount,
    status: 'INCLUDED_IN_PAYROLL',
    title,
    orderCode,
  };
}

function encodedCash(salaryAmount: string, bonusReleaseId: string, bonusAmount: string): string {
  return `nbos:v1:payrollCash:${JSON.stringify({
    salaryAmount,
    bonusParts: [{ bonusReleaseId, amount: bonusAmount }],
    carryAmount: '0.00',
  })}`;
}
