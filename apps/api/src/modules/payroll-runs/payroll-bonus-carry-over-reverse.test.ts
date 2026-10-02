import { Decimal } from '@nbos/database';
import { describe, expect, it, vi } from 'vitest';

import {
  PAYROLL_CARRY_REVERSE_ERRORS,
  restorePriorPayrollCarryConsumed,
  reversePayrollCarryAppliedOnSalaryLine,
} from './payroll-bonus-carry-over-reverse';

function lockedCarryReleases<T extends { id: string }>(rows: T[]) {
  return {
    findMany: vi.fn().mockResolvedValue(rows),
    findUnique: vi
      .fn()
      .mockImplementation((args: { where: { id: string } }) =>
        Promise.resolve(rows.find((row) => row.id === args.where.id) ?? null),
      ),
    update: vi.fn().mockResolvedValue({}),
  };
}

describe('restorePriorPayrollCarryConsumed', () => {
  it('restores remaining on prior releases in payroll-month order (oldest first)', async () => {
    const priorRows = [
      {
        id: 'r1',
        status: 'APPROVED',
        employeeId: 'e1',
        payrollRunId: null,
        payrollIncludedAmount: null,
        payrollCarryOverAmount: new Decimal(30),
        payrollCarryOverRemaining: new Decimal(10),
        payrollRun: { status: 'DRAFT', payrollMonth: '2026-03' },
      },
      {
        id: 'r2',
        status: 'APPROVED',
        employeeId: 'e1',
        payrollRunId: null,
        payrollIncludedAmount: null,
        payrollCarryOverAmount: new Decimal(10),
        payrollCarryOverRemaining: new Decimal(0),
        payrollRun: { status: 'DRAFT', payrollMonth: '2026-04' },
      },
    ];
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      bonusRelease: lockedCarryReleases(priorRows),
    };

    await restorePriorPayrollCarryConsumed(tx as never, {
      employeeId: 'e1',
      payrollMonth: '2026-05',
      restoreAmount: new Decimal(25),
    });

    expect(tx.bonusRelease.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ payrollRun: { payrollMonth: 'asc' } }, { updatedAt: 'asc' }],
      }),
    );
    expect(tx.bonusRelease.update).toHaveBeenCalledTimes(2);
    expect(tx.bonusRelease.update.mock.calls[0]?.[0]).toEqual({
      where: { id: 'r1' },
      data: { payrollCarryOverRemaining: new Decimal(30) },
    });
    expect(tx.bonusRelease.update.mock.calls[1]?.[0]).toEqual({
      where: { id: 'r2' },
      data: { payrollCarryOverRemaining: new Decimal(5) },
    });
  });

  it('puts 100000 back on an APPROVED April remaining', async () => {
    const aprilRows = [
      {
        id: 'rel-april',
        status: 'APPROVED',
        employeeId: 'e1',
        payrollRunId: null,
        payrollIncludedAmount: null,
        payrollCarryOverAmount: new Decimal(100_000),
        payrollCarryOverRemaining: null,
      },
    ];
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      bonusRelease: lockedCarryReleases(aprilRows),
    };

    await restorePriorPayrollCarryConsumed(tx as never, {
      employeeId: 'e1',
      payrollMonth: '2026-05',
      restoreAmount: new Decimal(100_000),
    });

    expect(tx.bonusRelease.update).toHaveBeenCalledWith({
      where: { id: 'rel-april' },
      data: { payrollCarryOverRemaining: new Decimal(100_000) },
    });
  });

  it('adds 100000 to a June re-attach even though June is after May', async () => {
    const tx = {
      bonusRelease: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'rel-april',
            status: 'INCLUDED_IN_PAYROLL',
            employeeId: 'e1',
            payrollRunId: 'run-june',
            payrollIncludedAmount: new Decimal(200_000),
            payrollCarryOverAmount: new Decimal(100_000),
            payrollCarryOverRemaining: null,
            payrollRun: { status: 'DRAFT', payrollMonth: '2026-06' },
          },
        ]),
        update: vi.fn().mockResolvedValue({}),
      },
      salaryLine: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'sl-june',
          baseSalary: new Decimal(100_000),
          bonusesTotal: new Decimal(200_000),
          paidAmount: new Decimal(0),
          status: 'APPROVED',
        }),
        update: vi.fn().mockResolvedValue({}),
        aggregate: vi.fn().mockResolvedValue({
          _sum: {
            baseSalary: new Decimal(100_000),
            bonusesTotal: new Decimal(300_000),
            totalPayable: new Decimal(400_000),
            paidAmount: new Decimal(0),
          },
        }),
      },
      payrollRun: { update: vi.fn().mockResolvedValue({}) },
    };

    await restorePriorPayrollCarryConsumed(tx as never, {
      employeeId: 'e1',
      payrollMonth: '2026-05',
      restoreAmount: new Decimal(100_000),
    });

    expect(tx.bonusRelease.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([{ status: 'INCLUDED_IN_PAYROLL' }]),
        }),
      }),
    );
    expect(tx.bonusRelease.update).toHaveBeenCalledWith({
      where: { id: 'rel-april' },
      data: {
        payrollIncludedAmount: new Decimal(300_000),
        payrollCarryOverAmount: null,
        payrollCarryOverRemaining: null,
      },
    });
    expect(tx.salaryLine.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sl-june' },
        data: expect.objectContaining({
          bonusesTotal: new Decimal(300_000),
        }),
      }),
    );
  });

  it('does not add money when the matching line is PAID', async () => {
    const tx = {
      bonusRelease: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'rel-april',
            status: 'INCLUDED_IN_PAYROLL',
            employeeId: 'e1',
            payrollRunId: 'run-june',
            payrollIncludedAmount: new Decimal(200_000),
            payrollCarryOverAmount: new Decimal(100_000),
            payrollCarryOverRemaining: null,
            payrollRun: { status: 'CLOSED', payrollMonth: '2026-06' },
          },
        ]),
        update: vi.fn().mockResolvedValue({}),
      },
      salaryLine: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'sl-june',
          status: 'PAID',
          baseSalary: new Decimal(100_000),
          bonusesTotal: new Decimal(200_000),
          paidAmount: new Decimal(300_000),
        }),
        update: vi.fn(),
      },
      payrollRun: { update: vi.fn() },
    };

    await restorePriorPayrollCarryConsumed(tx as never, {
      employeeId: 'e1',
      payrollMonth: '2026-05',
      restoreAmount: new Decimal(100_000),
    });

    expect(tx.bonusRelease.update).not.toHaveBeenCalled();
    expect(tx.salaryLine.update).not.toHaveBeenCalled();
  });

  it('adds 100000 to a re-attached April included amount and salary line', async () => {
    const tx = {
      bonusRelease: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'rel-april',
            status: 'INCLUDED_IN_PAYROLL',
            employeeId: 'e1',
            payrollRunId: 'run-april',
            payrollIncludedAmount: new Decimal(200_000),
            payrollCarryOverAmount: new Decimal(100_000),
            payrollCarryOverRemaining: null,
          },
        ]),
        update: vi.fn().mockResolvedValue({}),
      },
      salaryLine: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'sl-april',
          baseSalary: new Decimal(100_000),
          bonusesTotal: new Decimal(200_000),
          paidAmount: new Decimal(0),
        }),
        update: vi.fn().mockResolvedValue({}),
        aggregate: vi.fn().mockResolvedValue({
          _sum: {
            baseSalary: new Decimal(100_000),
            bonusesTotal: new Decimal(300_000),
            totalPayable: new Decimal(400_000),
            paidAmount: new Decimal(0),
          },
        }),
      },
      payrollRun: { update: vi.fn().mockResolvedValue({}) },
    };

    await restorePriorPayrollCarryConsumed(tx as never, {
      employeeId: 'e1',
      payrollMonth: '2026-05',
      restoreAmount: new Decimal(100_000),
    });

    expect(tx.bonusRelease.update).toHaveBeenCalledWith({
      where: { id: 'rel-april' },
      data: {
        payrollIncludedAmount: new Decimal(300_000),
        payrollCarryOverAmount: null,
        payrollCarryOverRemaining: null,
      },
    });
    expect(tx.salaryLine.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sl-april' },
        data: expect.objectContaining({
          bonusesTotal: new Decimal(300_000),
        }),
      }),
    );
  });
});

describe('reversePayrollCarryAppliedOnSalaryLine', () => {
  it('clears carry applied and reduces bonuses total when restore can land', async () => {
    const aprilRows = [
      {
        id: 'rel-april',
        status: 'APPROVED',
        employeeId: 'e1',
        payrollRunId: null,
        payrollIncludedAmount: null,
        payrollCarryOverAmount: new Decimal(25),
        payrollCarryOverRemaining: null,
      },
    ];
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      bonusRelease: lockedCarryReleases(aprilRows),
      salaryLine: { update: vi.fn().mockResolvedValue({}) },
      payrollRun: {},
    };

    await reversePayrollCarryAppliedOnSalaryLine(tx as never, {
      payrollRunId: 'run1',
      payrollMonth: '2026-05',
      employeeId: 'e1',
      line: {
        id: 'sl1',
        baseSalary: new Decimal(100),
        bonusesTotal: new Decimal(25),
        paidAmount: new Decimal(0),
        payrollCarryAppliedAmount: new Decimal(25),
      },
    });

    expect(tx.bonusRelease.update).toHaveBeenCalledWith({
      where: { id: 'rel-april' },
      data: { payrollCarryOverRemaining: new Decimal(25) },
    });
    expect(tx.salaryLine.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sl1' },
        data: expect.objectContaining({
          bonusesTotal: new Decimal(0),
          payrollCarryAppliedAmount: null,
        }),
      }),
    );
  });

  it('keeps May applied carry when closed April cannot restore 100000', async () => {
    const mayLine = {
      id: 'sl-may',
      baseSalary: new Decimal(100_000),
      bonusesTotal: new Decimal(100_000),
      paidAmount: new Decimal(0),
      payrollCarryAppliedAmount: new Decimal(100_000) as Decimal | null,
    };
    const tx = {
      bonusRelease: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'rel-april',
            status: 'INCLUDED_IN_PAYROLL',
            employeeId: 'e1',
            payrollRunId: 'run-april',
            payrollIncludedAmount: new Decimal(200_000),
            payrollCarryOverAmount: new Decimal(100_000),
            payrollCarryOverRemaining: null,
            payrollRun: { status: 'CLOSED', payrollMonth: '2026-04' },
          },
        ]),
        update: vi.fn().mockResolvedValue({}),
      },
      salaryLine: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'sl-april',
          status: 'PAID',
          baseSalary: new Decimal(100_000),
          bonusesTotal: new Decimal(200_000),
          paidAmount: new Decimal(300_000),
        }),
        update: vi.fn().mockImplementation((args: { where: { id: string }; data: object }) => {
          if (args.where.id === 'sl-may') {
            Object.assign(mayLine, args.data);
          }
          return Promise.resolve({});
        }),
      },
      payrollRun: { update: vi.fn() },
    };

    await expect(
      reversePayrollCarryAppliedOnSalaryLine(tx as never, {
        payrollRunId: 'run-may',
        payrollMonth: '2026-05',
        employeeId: 'e1',
        line: mayLine,
      }),
    ).rejects.toThrow(PAYROLL_CARRY_REVERSE_ERRORS.closedPriorRestore);

    expect(tx.bonusRelease.update).not.toHaveBeenCalled();
    expect(tx.salaryLine.update).not.toHaveBeenCalled();
    expect(mayLine.payrollCarryAppliedAmount?.toFixed(2)).toBe('100000.00');
    expect(mayLine.bonusesTotal.toFixed(2)).toBe('100000.00');
  });
});
