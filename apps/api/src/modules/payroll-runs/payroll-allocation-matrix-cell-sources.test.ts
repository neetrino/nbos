import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';

import { aggregatePayrollMatrixCellSources } from './payroll-allocation-matrix-cell-sources';

const PAYROLL_MONTH = '2026-05';
const PAYROLL_RUN_ID = 'pr1';
const EMPLOYEE_ID = 'e1';

function visibleEntry(params: {
  id: string;
  amount: number;
  earnedPeriod?: string | null;
  employeeId?: string;
}): {
  id: string;
  employeeId: string;
  title: string;
  type: string;
  amount: Decimal;
  originalAmount: Decimal;
  payableAmount: Decimal | null;
  earnedPeriod: string | null;
} {
  return {
    id: params.id,
    employeeId: params.employeeId ?? EMPLOYEE_ID,
    title: `Bonus ${params.id}`,
    type: 'DELIVERY',
    amount: new Decimal(params.amount),
    originalAmount: new Decimal(params.amount),
    payableAmount: params.earnedPeriod === null ? null : new Decimal(params.amount),
    earnedPeriod: params.earnedPeriod === undefined ? '2026-04' : params.earnedPeriod,
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
    expect(sources.sourceEntries.map((entry) => entry.remainingAmount)).toEqual(['50.00', '70.00']);
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
        remainingAmount: '50.00',
      }),
    ]);
  });

  it('does not invent a missing second entry or copy the first onto it', () => {
    const sources = aggregatePayrollMatrixCellSources({
      entries: [
        visibleEntry({ id: 'be-50', amount: 50 }),
        visibleEntry({ id: 'be-other', amount: 70, employeeId: 'e2' }),
        visibleEntry({ id: 'be-missing', amount: 90, earnedPeriod: null }),
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
    expect(sources.sourceEntries.map((entry) => entry.remainingAmount)).toEqual(['50.00', '50.00']);
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
    expect(sources.sourceEntries.map((entry) => entry.includedThisMonth)).toEqual([
      '10.00',
      '15.00',
    ]);
  });

  it('keeps August 40000 payable in October and does not rewrite the earned month', () => {
    const sources = aggregatePayrollMatrixCellSources({
      entries: [visibleEntry({ id: 'be-aug', amount: 40_000, earnedPeriod: '2026-08' })],
      employeeId: EMPLOYEE_ID,
      payrollMonth: '2026-10',
      payrollRunId: 'pr-oct',
      releases: [],
    });

    expect(sources.planned.toFixed(2)).toBe('40000.00');
    expect(sources.remaining.toFixed(2)).toBe('40000.00');
    expect(sources.sourceEntries).toEqual([
      expect.objectContaining({
        bonusEntryId: 'be-aug',
        plannedAmount: '40000.00',
        remainingAmount: '40000.00',
      }),
    ]);
    expect(sources.visibleEntries[0]?.earnedPeriod).toBe('2026-08');
  });

  it('does not hide or zero August 40000 when a newer project is paid', () => {
    const older = aggregatePayrollMatrixCellSources({
      entries: [visibleEntry({ id: 'be-aug', amount: 40_000, earnedPeriod: '2026-08' })],
      employeeId: EMPLOYEE_ID,
      payrollMonth: '2026-10',
      payrollRunId: 'pr-oct',
      releases: [],
    });
    const newer = aggregatePayrollMatrixCellSources({
      entries: [visibleEntry({ id: 'be-sep', amount: 100_000, earnedPeriod: '2026-09' })],
      employeeId: EMPLOYEE_ID,
      payrollMonth: '2026-10',
      payrollRunId: 'pr-oct',
      releases: [
        {
          id: 'rel-sep',
          bonusEntryId: 'be-sep',
          payrollRunId: 'pr-oct',
          status: 'INCLUDED_IN_PAYROLL',
          amount: new Decimal('100000.00'),
          payrollIncludedAmount: new Decimal('100000.00'),
        },
      ],
    });

    expect(older.remaining.toFixed(2)).toBe('40000.00');
    expect(older.visibleEntries[0]?.earnedPeriod).toBe('2026-08');
    expect(newer.thisRunReleaseAmount.toFixed(2)).toBe('100000.00');
    expect(newer.planned.toFixed(2)).toBe('100000.00');
    expect(newer.visibleEntries[0]?.earnedPeriod).toBe('2026-09');
  });

  it('does not create a second 40000 when the August release is repeated', () => {
    const afterFirst = aggregatePayrollMatrixCellSources({
      entries: [visibleEntry({ id: 'be-aug', amount: 40_000, earnedPeriod: '2026-08' })],
      employeeId: EMPLOYEE_ID,
      payrollMonth: '2026-10',
      payrollRunId: 'pr-oct',
      releases: [
        {
          id: 'rel-aug',
          bonusEntryId: 'be-aug',
          payrollRunId: 'pr-sep',
          status: 'INCLUDED_IN_PAYROLL',
          amount: new Decimal('40000.00'),
          payrollIncludedAmount: new Decimal('40000.00'),
        },
      ],
    });

    expect(afterFirst.planned.toFixed(2)).toBe('40000.00');
    expect(afterFirst.remaining.toFixed(2)).toBe('0.00');
    expect(afterFirst.visibleEntries).toHaveLength(1);
    expect(afterFirst.visibleEntries[0]?.earnedPeriod).toBe('2026-08');
  });
});
