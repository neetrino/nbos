import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';

import {
  appendAccessibleBonusOnlyPayees,
  extraPayrollMatrixPayeeIds,
} from './payroll-allocation-matrix-unpaid-payees';

const AUGUST_UNPAID = {
  id: 'be-aug',
  employeeId: 'e-term',
  type: 'DELIVERY',
  amount: new Decimal('40000.00'),
  payableAmount: new Decimal('40000.00'),
  earnedPeriod: '2026-08',
};

describe('extraPayrollMatrixPayeeIds', () => {
  it('includes a terminated employee whose August 40000 is still unpaid in October', () => {
    expect(
      extraPayrollMatrixPayeeIds({
        entries: [AUGUST_UNPAID],
        releases: [],
        payrollMonth: '2026-10',
        payrollRunId: 'pr-oct',
        existingEmployeeIds: new Set(),
        draftEmployeeIds: [],
      }),
    ).toEqual(['e-term']);
  });

  it('does not add a payee whose 40000 was already released', () => {
    expect(
      extraPayrollMatrixPayeeIds({
        entries: [AUGUST_UNPAID],
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
        existingEmployeeIds: new Set(),
        draftEmployeeIds: [],
      }),
    ).toEqual([]);
  });

  it('does not duplicate an employee who already has a salary line', () => {
    expect(
      extraPayrollMatrixPayeeIds({
        entries: [AUGUST_UNPAID],
        releases: [],
        payrollMonth: '2026-10',
        payrollRunId: 'pr-oct',
        existingEmployeeIds: new Set(['e-term']),
        draftEmployeeIds: [],
      }),
    ).toEqual([]);
  });
});

describe('appendAccessibleBonusOnlyPayees', () => {
  it('appends a bonus-only October row with no salary line', async () => {
    const rows = await appendAccessibleBonusOnlyPayees({
      findEmployees: async () => [
        { id: 'e-term', firstName: 'Ada', lastName: 'Lovelace', position: null },
      ],
      rows: [],
      entries: [AUGUST_UNPAID],
      releases: [],
      payrollMonth: '2026-10',
      payrollRunId: 'pr-oct',
      draftEmployeeIds: [],
      draftBonusesByEmployee: new Map(),
      accessible: 'ALL',
    });

    expect(rows).toEqual([
      expect.objectContaining({
        employeeId: 'e-term',
        salaryLineId: null,
        baseSalary: '0.00',
      }),
    ]);
  });
});
