import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';

import {
  allocateSalaryFirstCash,
  PAYROLL_CASH_ERRORS,
  parsePayrollCashBonusAssignments,
  salaryRemainingBeforeCash,
  summarizeBonusCashBalances,
} from './payroll-salary-first-cash';

const SALARY = new Decimal('300000.00');
const BONUS_60 = new Decimal('60000.00');
const BONUS_40 = new Decimal('40000.00');
const CASH_320 = new Decimal('320000.00');
const CASH_250 = new Decimal('250000.00');
const CASH_10 = new Decimal('10000.00');

const BONUSES_60_40 = [
  { bonusReleaseId: 'rel-60', remaining: BONUS_60 },
  { bonusReleaseId: 'rel-40', remaining: BONUS_40 },
] as const;

describe('P5-S1 salary-first cash allocation', () => {
  it('pays 320000 as 300000 salary then 20000 on the named 60000 bonus', () => {
    const allocation = allocateSalaryFirstCash({
      cash: CASH_320,
      salaryRemaining: SALARY,
      bonuses: BONUSES_60_40,
      assignments: parsePayrollCashBonusAssignments([
        { bonusReleaseId: 'rel-60', amount: '20000.00' },
      ]),
    });
    const bonusBalances = summarizeBonusCashBalances(BONUSES_60_40, allocation.bonusParts);

    expect(allocation.salaryAmount.toFixed(2)).toBe('300000.00');
    expect(allocation.salaryRemainingAfter.toFixed(2)).toBe('0.00');
    expect(allocation.bonusCash.toFixed(2)).toBe('20000.00');
    expect(allocation.salaryAmount.plus(allocation.bonusCash).toFixed(2)).toBe('320000.00');
    expect(bonusBalances[0]?.bonusReleaseId).toBe('rel-60');
    expect(bonusBalances[0]?.paid.toFixed(2)).toBe('20000.00');
    expect(bonusBalances[0]?.remaining.toFixed(2)).toBe('40000.00');
    expect(bonusBalances[1]?.bonusReleaseId).toBe('rel-40');
    expect(bonusBalances[1]?.paid.toFixed(2)).toBe('0.00');
    expect(bonusBalances[1]?.remaining.toFixed(2)).toBe('40000.00');
  });

  it('pays 250000 entirely to salary and leaves both bonuses unpaid', () => {
    const allocation = allocateSalaryFirstCash({
      cash: CASH_250,
      salaryRemaining: SALARY,
      bonuses: BONUSES_60_40,
      assignments: [],
    });
    const bonusBalances = summarizeBonusCashBalances(BONUSES_60_40, allocation.bonusParts);

    expect(allocation.salaryAmount.toFixed(2)).toBe('250000.00');
    expect(allocation.salaryRemainingAfter.toFixed(2)).toBe('50000.00');
    expect(allocation.bonusCash.toFixed(2)).toBe('0.00');
    expect(bonusBalances.every((row) => row.paid.isZero())).toBe(true);
    expect(bonusBalances.map((row) => row.remaining.toFixed(2))).toEqual(['60000.00', '40000.00']);
  });

  it('treats 10000 on a zero-salary 40000 bonus as assigned bonus cash', () => {
    const bonuses = [{ bonusReleaseId: 'rel-40', remaining: BONUS_40 }];
    const allocation = allocateSalaryFirstCash({
      cash: CASH_10,
      salaryRemaining: salaryRemainingBeforeCash(new Decimal(0), new Decimal(0)),
      bonuses,
      assignments: parsePayrollCashBonusAssignments([
        { bonusReleaseId: 'rel-40', amount: '10000.00' },
      ]),
    });

    expect(allocation.salaryAmount.toFixed(2)).toBe('0.00');
    expect(allocation.salaryRemainingAfter.toFixed(2)).toBe('0.00');
    expect(allocation.bonusCash.toFixed(2)).toBe('10000.00');
    const [balance] = summarizeBonusCashBalances(bonuses, allocation.bonusParts);
    expect(balance?.paid.toFixed(2)).toBe('10000.00');
    expect(balance?.remaining.toFixed(2)).toBe('30000.00');
  });

  it('rejects a bonus assignment that does not match bonus cash', () => {
    expect(() =>
      allocateSalaryFirstCash({
        cash: CASH_320,
        salaryRemaining: SALARY,
        bonuses: BONUSES_60_40,
        assignments: parsePayrollCashBonusAssignments([
          { bonusReleaseId: 'rel-60', amount: '30000.00' },
        ]),
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      allocateSalaryFirstCash({
        cash: CASH_320,
        salaryRemaining: SALARY,
        bonuses: BONUSES_60_40,
        assignments: [],
      }),
    ).toThrow(PAYROLL_CASH_ERRORS.bonusMustAssign);
  });

  it('rejects assigning more than the approved remaining bonus', () => {
    expect(() =>
      allocateSalaryFirstCash({
        cash: new Decimal('370000.00'),
        salaryRemaining: SALARY,
        bonuses: BONUSES_60_40,
        assignments: parsePayrollCashBonusAssignments([
          { bonusReleaseId: 'rel-60', amount: '70000.00' },
        ]),
      }),
    ).toThrow(PAYROLL_CASH_ERRORS.exceedsApproved);
  });

  it('does not pick a bonus by list order when cash is unnamed', () => {
    expect(() =>
      allocateSalaryFirstCash({
        cash: CASH_320,
        salaryRemaining: SALARY,
        bonuses: [...BONUSES_60_40].reverse(),
        assignments: [],
      }),
    ).toThrow(PAYROLL_CASH_ERRORS.bonusMustAssign);
  });

  it('pays 430000 as 300000 salary, 100000 named bonus, and 30000 line carry', () => {
    const bonuses = [{ bonusReleaseId: 'rel-100', remaining: new Decimal('100000.00') }];
    const allocation = allocateSalaryFirstCash({
      cash: new Decimal('430000.00'),
      salaryRemaining: SALARY,
      bonuses,
      assignments: parsePayrollCashBonusAssignments([
        { bonusReleaseId: 'rel-100', amount: '100000.00' },
      ]),
      carryRemaining: new Decimal('30000.00'),
    });
    const [bonus] = summarizeBonusCashBalances(bonuses, allocation.bonusParts);

    expect(allocation.salaryAmount.toFixed(2)).toBe('300000.00');
    expect(allocation.bonusCash.toFixed(2)).toBe('100000.00');
    expect(allocation.carryAmount.toFixed(2)).toBe('30000.00');
    expect(
      allocation.salaryAmount.plus(allocation.bonusCash).plus(allocation.carryAmount).toFixed(2),
    ).toBe('430000.00');
    expect(bonus?.paid.toFixed(2)).toBe('100000.00');
    expect(bonus?.remaining.toFixed(2)).toBe('0.00');
  });

  it('rejects putting carry onto this-run bonus above the approved amount', () => {
    expect(() =>
      allocateSalaryFirstCash({
        cash: new Decimal('430000.00'),
        salaryRemaining: SALARY,
        bonuses: [{ bonusReleaseId: 'rel-100', remaining: new Decimal('100000.00') }],
        assignments: parsePayrollCashBonusAssignments([
          { bonusReleaseId: 'rel-100', amount: '130000.00' },
        ]),
        carryRemaining: new Decimal('30000.00'),
      }),
    ).toThrow(PAYROLL_CASH_ERRORS.exceedsApproved);
  });
});
