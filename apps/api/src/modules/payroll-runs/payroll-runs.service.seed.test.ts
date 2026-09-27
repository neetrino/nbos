import { BadRequestException, ConflictException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { describe, expect, it, vi } from 'vitest';

import { planPayrollSalaryLines, seedPayrollRunSalaryLines } from './seed-payroll-run-salary-lines';

const CURRENT = {
  id: 'p-current',
  employeeId: 'e1',
  baseSalary: { toString: () => '100000' },
  currency: 'AMD',
  kpiPolicyId: null,
  effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
  effectiveTo: new Date('2026-11-30T00:00:00.000Z'),
  status: 'ACTIVE' as const,
};

const FUTURE = {
  id: 'p-future',
  employeeId: 'e1',
  baseSalary: { toString: () => '200000' },
  currency: 'AMD',
  kpiPolicyId: null,
  effectiveFrom: new Date('2026-12-01T00:00:00.000Z'),
  effectiveTo: null,
  status: 'ACTIVE' as const,
};

const OPEN_300000 = {
  id: 'p-open',
  employeeId: 'e1',
  baseSalary: { toString: () => '300000' },
  currency: 'AMD',
  kpiPolicyId: null,
  effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
  effectiveTo: null,
  status: 'ACTIVE' as const,
};

describe('planPayrollSalaryLines', () => {
  it('seeds today’s covering 100000 and does not write 200000 or 0', () => {
    const planned = planPayrollSalaryLines(
      [employee('e1', 'ACTIVE')],
      [CURRENT, FUTURE],
      '2026-09',
    );
    expect(planned).toHaveLength(1);
    expect(planned[0]?.compensationProfileId).toBe('p-current');
    expect(planned[0]?.baseSalary.toString()).toBe('100000');
  });

  it('omits a new hire whose first approved salary starts in a later month', () => {
    const planned = planPayrollSalaryLines([employee('e1', 'ACTIVE')], [FUTURE], '2026-09');
    expect(planned).toEqual([]);
  });

  it('fails a mid-history gap when a later approved profile exists', () => {
    const archived = {
      id: 'p-old',
      employeeId: 'e1',
      baseSalary: { toString: () => '300000' },
      currency: 'AMD',
      kpiPolicyId: null,
      effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
      effectiveTo: new Date('2026-06-30T00:00:00.000Z'),
      status: 'ARCHIVED' as const,
    };
    const august = {
      ...FUTURE,
      id: 'p-aug',
      baseSalary: { toString: () => '350000' },
      effectiveFrom: new Date('2026-08-01T00:00:00.000Z'),
    };
    expect(() =>
      planPayrollSalaryLines([employee('e1', 'ACTIVE')], [archived, august], '2026-07'),
    ).toThrow(/Ada Lovelace \(e1\)/);
  });

  it('fails a missing approved profile without inserting a guessed zero', () => {
    expect(() => planPayrollSalaryLines([employee('e1', 'ACTIVE')], [], '2026-09')).toThrow(
      /Ada Lovelace \(e1\)/,
    );
  });

  it('writes explicit approved 0 and does not throw', () => {
    const planned = planPayrollSalaryLines(
      [employee('e1', 'PROBATION')],
      [{ ...CURRENT, baseSalary: { toString: () => '0' }, effectiveTo: null }],
      '2026-09',
    );
    expect(planned[0]?.baseSalary.equals(0)).toBe(true);
  });

  it('includes a terminated employee with a covering profile and omits one without', () => {
    const planned = planPayrollSalaryLines(
      [
        employee('e1', 'TERMINATED', 'Ada', 'Lovelace', new Date('2026-09-15T00:00:00.000Z')),
        employee('e2', 'TERMINATED', 'Lin', 'Term'),
      ],
      [CURRENT],
      '2026-09',
    );
    expect(planned.map((line) => line.employeeId)).toEqual(['e1']);
  });

  it('includes May and omits June for an open-ended profile after a May fireDate', () => {
    const fired = employee(
      'e1',
      'TERMINATED',
      'Ada',
      'Lovelace',
      new Date('2026-05-10T00:00:00.000Z'),
    );
    const may = planPayrollSalaryLines([fired], [OPEN_300000], '2026-05');
    expect(may).toHaveLength(1);
    expect(may[0]?.baseSalary.toString()).toBe('300000');
    expect(planPayrollSalaryLines([fired], [OPEN_300000], '2026-06')).toEqual([]);
    expect(planPayrollSalaryLines([fired], [OPEN_300000], '2026-07')).toEqual([]);
  });

  it('omits a terminated employee with no fireDate even if a profile still covers the month', () => {
    const planned = planPayrollSalaryLines(
      [employee('e1', 'TERMINATED')],
      [OPEN_300000],
      '2026-06',
    );
    expect(planned).toEqual([]);
  });

  it('rejects overlapping approved ranges instead of picking by row order', () => {
    expect(() =>
      planPayrollSalaryLines(
        [employee('e1', 'ACTIVE')],
        [CURRENT, { ...CURRENT, id: 'p-overlap', baseSalary: { toString: () => '200000' } }],
        '2026-09',
      ),
    ).toThrow(ConflictException);
  });
});

describe('seedPayrollRunSalaryLines', () => {
  it('creates no salary line when a required profile is missing', async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      employee: { findMany: vi.fn().mockResolvedValue([employee('e1', 'ACTIVE')]) },
      compensationProfile: { findMany: vi.fn().mockResolvedValue([]) },
      salaryLine: { create: vi.fn() },
    };

    await expect(seedPayrollRunSalaryLines(tx as never, 'run-1', '2026-09')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(tx.salaryLine.create).not.toHaveBeenCalled();
  });

  it('inserts the covering profile amount including explicit 0', async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      employee: { findMany: vi.fn().mockResolvedValue([employee('e1', 'PROBATION')]) },
      compensationProfile: {
        findMany: vi
          .fn()
          .mockResolvedValue([
            { ...CURRENT, baseSalary: { toString: () => '0' }, effectiveTo: null },
          ]),
      },
      salaryLine: { create: vi.fn().mockResolvedValue({ id: 'sl-1' }) },
    };

    await seedPayrollRunSalaryLines(tx as never, 'run-1', '2026-09');

    const created = tx.salaryLine.create.mock.calls[0]?.[0] as {
      data: { employeeId: string; compensationProfileId: string; baseSalary: Decimal };
    };
    expect(created.data.baseSalary.toString()).toBe('0');
  });

  it('rejects a USD 1000 covering profile and does not insert a salary line', async () => {
    const tx = seedTx({
      employees: [employee('e1', 'ACTIVE')],
      profiles: [{ ...CURRENT, currency: 'USD', baseSalary: { toString: () => '1000' } }],
    });

    await expect(seedPayrollRunSalaryLines(tx as never, 'run-1', '2026-09')).rejects.toThrow(
      /Ada Lovelace \(e1\).*AMD, not USD/,
    );
    expect(tx.salaryLine.create).not.toHaveBeenCalled();
  });

  it('inserts one salary line for an AMD covering profile', async () => {
    const tx = seedTx({
      employees: [employee('e1', 'ACTIVE')],
      profiles: [CURRENT],
    });

    await seedPayrollRunSalaryLines(tx as never, 'run-1', '2026-09');

    expect(tx.salaryLine.create).toHaveBeenCalledTimes(1);
    const created = tx.salaryLine.create.mock.calls[0]?.[0] as {
      data: { employeeId: string; compensationProfileId: string; baseSalary: Decimal };
    };
    expect(created.data.employeeId).toBe('e1');
    expect(created.data.compensationProfileId).toBe('p-current');
    expect(created.data.baseSalary.toString()).toBe('100000');
  });

  it('rejects a blank covering currency and does not insert any salary line', async () => {
    const tx = seedTx({
      employees: [employee('e1', 'ACTIVE'), employee('e2', 'ACTIVE', 'Lin', 'Term')],
      profiles: [
        CURRENT,
        {
          ...CURRENT,
          id: 'p-blank',
          employeeId: 'e2',
          currency: '',
          baseSalary: { toString: () => '1000' },
        },
      ],
    });

    await expect(seedPayrollRunSalaryLines(tx as never, 'run-1', '2026-09')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(tx.salaryLine.create).not.toHaveBeenCalled();
  });
});

function seedTx(params: { employees: ReturnType<typeof employee>[]; profiles: unknown[] }) {
  return {
    $queryRaw: vi.fn().mockResolvedValue([]),
    employee: { findMany: vi.fn().mockResolvedValue(params.employees) },
    compensationProfile: { findMany: vi.fn().mockResolvedValue(params.profiles) },
    salaryLine: { create: vi.fn().mockResolvedValue({ id: 'sl-1' }) },
  };
}

function employee(
  id: string,
  status: string,
  firstName = 'Ada',
  lastName = 'Lovelace',
  fireDate: Date | null = null,
) {
  return { id, status, firstName, lastName, fireDate };
}
