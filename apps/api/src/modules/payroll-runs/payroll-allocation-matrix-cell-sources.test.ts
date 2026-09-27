import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';

import { aggregatePayrollMatrixCellSources } from './payroll-allocation-matrix-cell-sources';

const PAYROLL_MONTH = '2026-05';
const PAYROLL_RUN_ID = 'pr1';
const EMPLOYEE_ID = 'e1';

function visibleEntry(params: {
  id: string;
  amount: number;
  earnedPeriod?: string;
  employeeId?: string;
}): {
  id: string;
  employeeId: string;
  title: string;
  type: string;
  amount: Decimal;
  originalAmount: Decimal;
  payableAmount: Decimal;
  earnedPeriod: string;
} {
  return {
    id: params.id,
    employeeId: params.employeeId ?? EMPLOYEE_ID,
    title: `Bonus ${params.id}`,
    type: 'DELIVERY',
    amount: new Decimal(params.amount),
    originalAmount: new Decimal(params.amount),
    payableAmount: new Decimal(params.amount),
    earnedPeriod: params.earnedPeriod ?? '2026-04',
  };
}

describe('aggregatePayrollMatrixCellSources', () => {
  it('sums two visible entries of 50 and 70 to planned 120 and keeps both entry ids', () => {
    const sources = aggregatePayrollMatrixCellSources({
      entries: [
        visibleEntry({ id: 'be-50', amount: 50 }),
        visibleEntry({ id: 'be-70', amount: 70 }),
      ],
      employeeId: EMPLOYEE_ID,
      payrollMonth: PAYROLL_MONTH,
      payrollRunId: PAYROLL_RUN_ID,
      releases: [],
    });

    expect(sources.planned.toFixed(2)).toBe('120.00');
    expect(sources.remaining.toFixed(2)).toBe('120.00');
    expect(sources.sourceEntries.map((entry) => entry.bonusEntryId)).toEqual(['be-50', 'be-70']);
    expect(sources.sourceEntries.map((entry) => entry.plannedAmount)).toEqual(['50.00', '70.00']);
  });

  it('keeps a single visible entry of 50 as planned 50', () => {
    const sources = aggregatePayrollMatrixCellSources({
      entries: [visibleEntry({ id: 'be-50', amount: 50 })],
      employeeId: EMPLOYEE_ID,
      payrollMonth: PAYROLL_MONTH,
      payrollRunId: PAYROLL_RUN_ID,
      releases: [],
    });

    expect(sources.planned.toFixed(2)).toBe('50.00');
    expect(sources.remaining.toFixed(2)).toBe('50.00');
    expect(sources.sourceEntries).toEqual([
      expect.objectContaining({
        bonusEntryId: 'be-50',
        plannedAmount: '50.00',
      }),
    ]);
  });

  it('does not invent a missing second entry or copy the first onto it', () => {
    const sources = aggregatePayrollMatrixCellSources({
      entries: [
        visibleEntry({ id: 'be-50', amount: 50 }),
        visibleEntry({ id: 'be-other', amount: 70, employeeId: 'e2' }),
        visibleEntry({ id: 'be-old', amount: 90, earnedPeriod: '2026-02' }),
      ],
      employeeId: EMPLOYEE_ID,
      payrollMonth: PAYROLL_MONTH,
      payrollRunId: PAYROLL_RUN_ID,
      releases: [],
    });

    expect(sources.planned.toFixed(2)).toBe('50.00');
    expect(sources.sourceEntries.map((entry) => entry.bonusEntryId)).toEqual(['be-50']);
  });

  it('subtracts prior releases from every source entry, not only the first', () => {
    const sources = aggregatePayrollMatrixCellSources({
      entries: [
        visibleEntry({ id: 'be-50', amount: 50 }),
        visibleEntry({ id: 'be-70', amount: 70 }),
      ],
      employeeId: EMPLOYEE_ID,
      payrollMonth: PAYROLL_MONTH,
      payrollRunId: PAYROLL_RUN_ID,
      releases: [
        {
          id: 'rel-prior-70',
          bonusEntryId: 'be-70',
          payrollRunId: 'pr-prior',
          status: 'PAID',
          amount: new Decimal(20),
          payrollIncludedAmount: new Decimal(20),
        },
      ],
    });

    expect(sources.planned.toFixed(2)).toBe('120.00');
    expect(sources.releasedBefore.toFixed(2)).toBe('20.00');
    expect(sources.remaining.toFixed(2)).toBe('100.00');
    expect(sources.sourceEntries.map((entry) => entry.bonusEntryId)).toEqual(['be-50', 'be-70']);
  });

  it('sums this-run included releases instead of taking the first match', () => {
    const sources = aggregatePayrollMatrixCellSources({
      entries: [
        visibleEntry({ id: 'be-50', amount: 50 }),
        visibleEntry({ id: 'be-70', amount: 70 }),
      ],
      employeeId: EMPLOYEE_ID,
      payrollMonth: PAYROLL_MONTH,
      payrollRunId: PAYROLL_RUN_ID,
      releases: [
        {
          id: 'rel-50',
          bonusEntryId: 'be-50',
          payrollRunId: PAYROLL_RUN_ID,
          status: 'INCLUDED_IN_PAYROLL',
          amount: new Decimal(10),
          payrollIncludedAmount: new Decimal(10),
        },
        {
          id: 'rel-70',
          bonusEntryId: 'be-70',
          payrollRunId: PAYROLL_RUN_ID,
          status: 'INCLUDED_IN_PAYROLL',
          amount: new Decimal(15),
          payrollIncludedAmount: new Decimal(15),
        },
      ],
    });

    expect(sources.thisRunReleaseAmount.toFixed(2)).toBe('25.00');
    expect(sources.thisRunReleaseId).toBe('rel-50');
    expect(sources.sourceEntries.map((entry) => entry.bonusEntryId)).toEqual(['be-50', 'be-70']);
  });
});
