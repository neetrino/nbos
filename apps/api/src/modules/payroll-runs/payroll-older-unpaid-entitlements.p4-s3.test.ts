import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';

import { remainingForBonusEntry } from './payroll-allocation-source-amounts';
import {
  extraPayrollMatrixPayeeIds,
  payrollMatrixBonusOnlyEmployeeRows,
} from './payroll-allocation-matrix-unpaid-payees';
import {
  isPayrollMatrixBonusEntryVisible,
  payrollBonusReleaseBase,
} from './payroll-bonus-release-base';
import { canCreateTerminatedBonusSettlementLine } from './payroll-bonus-settlement-salary-line';
import { planPayrollSalaryLines } from './seed-payroll-run-salary-lines';

const AUGUST_UNPAID = {
  id: 'be-aug',
  employeeId: 'e-term',
  type: 'DELIVERY',
  amount: new Decimal('40000.00'),
  payableAmount: new Decimal('40000.00'),
  earnedPeriod: '2026-08',
};
const OPEN_PROFILE = {
  id: 'p-open',
  employeeId: 'e-term',
  baseSalary: { toString: () => '300000' },
  currency: 'AMD',
  kpiPolicyId: null,
  effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
  effectiveTo: null,
  status: 'ACTIVE' as const,
};

describe('P4-S3 older unpaid entitlements stay payable', () => {
  it('keeps an August 40000 unpaid bonus payable in October with earned month August', () => {
    expect(isPayrollMatrixBonusEntryVisible(AUGUST_UNPAID, '2026-10')).toBe(true);
    expect(payrollBonusReleaseBase(AUGUST_UNPAID, '2026-10').toFixed(2)).toBe('40000.00');
    expect(AUGUST_UNPAID.earnedPeriod).toBe('2026-08');
  });

  it('still shows the older 40000 in a month with no new bonus', () => {
    expect(isPayrollMatrixBonusEntryVisible(AUGUST_UNPAID, '2026-09')).toBe(true);
    expect(payrollBonusReleaseBase(AUGUST_UNPAID, '2026-09').toFixed(2)).toBe('40000.00');
    expect(isPayrollMatrixBonusEntryVisible(AUGUST_UNPAID, '2026-10')).toBe(true);
    expect(payrollBonusReleaseBase(AUGUST_UNPAID, '2026-10').toFixed(2)).toBe('40000.00');
  });

  it('does not treat a missing bonus as zero or drop a real unpaid amount', () => {
    expect(
      isPayrollMatrixBonusEntryVisible(
        {
          type: 'DELIVERY',
          amount: new Decimal('40000.00'),
          payableAmount: null,
          earnedPeriod: null,
        },
        '2026-10',
      ),
    ).toBe(false);
    expect(
      payrollBonusReleaseBase(
        {
          type: 'SALES',
          amount: new Decimal('40000.00'),
          payableAmount: null,
          earnedPeriod: '2026-08',
        },
        '2026-10',
      ).toFixed(2),
    ).toBe('0.00');
    expect(isPayrollMatrixBonusEntryVisible(AUGUST_UNPAID, '2026-10')).toBe(true);
    expect(payrollBonusReleaseBase(AUGUST_UNPAID, '2026-10').toFixed(2)).toBe('40000.00');
  });

  it('does not hide, zero, or require payment of August 40000 when a newer project is paid', () => {
    const afterNewer = remainingForBonusEntry({
      entry: AUGUST_UNPAID,
      releases: [
        {
          bonusEntryId: 'be-sep',
          payrollRunId: 'pr-oct',
          status: 'INCLUDED_IN_PAYROLL',
          amount: new Decimal('100000.00'),
        },
      ],
      payrollMonth: '2026-10',
      payrollRunId: 'pr-oct',
    });
    expect(afterNewer.toFixed(2)).toBe('40000.00');
    expect(AUGUST_UNPAID.earnedPeriod).toBe('2026-08');
  });

  it('does not create a second 40000 when the August release is repeated', () => {
    const remaining = remainingForBonusEntry({
      entry: AUGUST_UNPAID,
      releases: [
        {
          bonusEntryId: 'be-aug',
          payrollRunId: 'pr-oct',
          status: 'INCLUDED_IN_PAYROLL',
          amount: new Decimal('40000.00'),
        },
      ],
      payrollMonth: '2026-11',
      payrollRunId: 'pr-nov',
    });
    expect(remaining.toFixed(2)).toBe('0.00');
    expect(payrollBonusReleaseBase(AUGUST_UNPAID, '2026-11').toFixed(2)).toBe('40000.00');
    expect(AUGUST_UNPAID.earnedPeriod).toBe('2026-08');
  });

  it('does not seed a post-fire salary or invent a new bonus after August termination', () => {
    const fired = {
      id: 'e-term',
      status: 'TERMINATED',
      firstName: 'Ada',
      lastName: 'Lovelace',
      fireDate: new Date('2026-08-20T12:00:00.000Z'),
    };
    const fireMonth = planPayrollSalaryLines([fired], [OPEN_PROFILE], '2026-08');
    const october = planPayrollSalaryLines([fired], [OPEN_PROFILE], '2026-10');

    expect(fireMonth).toHaveLength(1);
    expect(fireMonth[0]?.baseSalary.toString()).toBe('300000');
    expect(october).toEqual([]);
    expect(canCreateTerminatedBonusSettlementLine(fired, '2026-10')).toBe(true);
    expect(canCreateTerminatedBonusSettlementLine(fired, '2026-08')).toBe(false);
    expect(isPayrollMatrixBonusEntryVisible(AUGUST_UNPAID, '2026-10')).toBe(true);
    expect(payrollBonusReleaseBase(AUGUST_UNPAID, '2026-10').toFixed(2)).toBe('40000.00');
    expect(AUGUST_UNPAID.earnedPeriod).toBe('2026-08');
  });

  it('adds a terminated unpaid payee to the October matrix without a salary line', () => {
    const extraIds = extraPayrollMatrixPayeeIds({
      entries: [AUGUST_UNPAID],
      releases: [],
      payrollMonth: '2026-10',
      payrollRunId: 'pr-oct',
      existingEmployeeIds: new Set(),
      draftEmployeeIds: [],
    });
    const rows = payrollMatrixBonusOnlyEmployeeRows(
      [{ id: 'e-term', firstName: 'Ada', lastName: 'Lovelace', position: null }],
      new Map(),
    );

    expect(extraIds).toEqual(['e-term']);
    expect(rows).toEqual([
      expect.objectContaining({
        employeeId: 'e-term',
        salaryLineId: null,
        baseSalary: '0.00',
        payableTotal: '0.00',
      }),
    ]);
  });
});
