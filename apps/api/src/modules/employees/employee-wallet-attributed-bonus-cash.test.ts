import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';

import { encodePayrollCashNotes } from '../payroll-runs/payroll-salary-first-cash-notes';
import {
  allocateSalaryFirstCash,
  parsePayrollCashBonusAssignments,
} from '../payroll-runs/payroll-salary-first-cash';
import { moneyAmount } from '../payroll-runs/payroll-allocation-source-amounts';
import { loadAttributedBonusCashByRelease } from './employee-wallet-attributed-bonus-cash';

const SALARY = moneyAmount(new Decimal('300000'));
const BONUS = moneyAmount(new Decimal('60000'));
const CASH = moneyAmount(new Decimal('320000'));

describe('loadAttributedBonusCashByRelease', () => {
  it('reads 20000 from payment notes for an included release', async () => {
    const notes = encodePayrollCashNotes(
      allocateSalaryFirstCash({
        cash: CASH,
        salaryRemaining: SALARY,
        bonuses: [{ bonusReleaseId: 'rel-60', remaining: BONUS }],
        assignments: parsePayrollCashBonusAssignments([
          { bonusReleaseId: 'rel-60', amount: '20000.00' },
        ]),
      }),
    );
    const prisma = {
      salaryLine: {
        findMany: async () => [{ expenseId: 'ex-1' }],
      },
      expensePayment: {
        findMany: async () => [{ id: 'pay-1', amount: CASH, notes }],
      },
    };

    const paid = await loadAttributedBonusCashByRelease(prisma, 'emp-1', [
      { id: 'rel-60', payrollRunId: 'pr-1' },
    ]);
    expect(paid.get('rel-60')?.toFixed(2)).toBe('20000.00');
  });
});
