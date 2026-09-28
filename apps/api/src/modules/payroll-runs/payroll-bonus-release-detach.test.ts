import { describe, it, expect, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { detachBonusReleasesFromPayrollRun } from './payroll-bonus-release-detach';

function createTxMock() {
  return {
    payrollRun: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
    bonusRelease: {
      findMany: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(0),
    },
    salaryLine: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
      aggregate: vi.fn(),
    },
  };
}

describe('detachBonusReleasesFromPayrollRun', () => {
  it('throws when run is APPROVED', async () => {
    const tx = createTxMock();
    tx.payrollRun.findUnique.mockResolvedValue({ id: 'run1', status: 'APPROVED' });
    await expect(
      detachBonusReleasesFromPayrollRun(tx as never, {
        payrollRunId: 'run1',
        releaseIds: ['r1'],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws when run missing', async () => {
    const tx = createTxMock();
    tx.payrollRun.findUnique.mockResolvedValue(null);
    await expect(
      detachBonusReleasesFromPayrollRun(tx as never, {
        payrollRunId: 'run1',
        releaseIds: ['r1'],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('reverts salary line and release', async () => {
    const tx = createTxMock();
    tx.payrollRun.findUnique.mockResolvedValue({
      id: 'run1',
      status: 'DRAFT',
      payrollMonth: '2026-05',
    });
    tx.bonusRelease.findMany.mockResolvedValue([
      {
        id: 'rel1',
        employeeId: 'e1',
        amount: new Decimal(50),
        payrollIncludedAmount: new Decimal(50),
        payrollCarryOverAmount: null,
        payrollCarryOverRemaining: null,
        status: 'INCLUDED_IN_PAYROLL',
        payrollRunId: 'run1',
      },
    ]);
    tx.salaryLine.findUnique.mockResolvedValue({
      id: 'sl1',
      payrollRunId: 'run1',
      employeeId: 'e1',
      baseSalary: new Decimal(100),
      bonusesTotal: new Decimal(50),
      payrollCarryAppliedAmount: null,
      totalPayable: new Decimal(150),
      paidAmount: new Decimal(0),
      remainingAmount: new Decimal(150),
      status: 'APPROVED',
    });
    tx.salaryLine.aggregate.mockResolvedValue({
      _sum: {
        baseSalary: new Decimal(100),
        bonusesTotal: new Decimal(0),
        totalPayable: new Decimal(100),
        paidAmount: new Decimal(0),
      },
    });

    await detachBonusReleasesFromPayrollRun(tx as never, {
      payrollRunId: 'run1',
      releaseIds: ['rel1'],
    });

    expect(tx.salaryLine.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sl1' },
        data: expect.objectContaining({
          bonusesTotal: new Decimal(0),
          totalPayable: new Decimal(100),
        }),
      }),
    );
    expect(tx.bonusRelease.update).toHaveBeenCalledWith({
      where: { id: 'rel1' },
      data: {
        status: 'APPROVED',
        payrollRunId: null,
        payrollIncludedAmount: null,
        kpiBurnedAmount: null,
        kpiBurnedReason: null,
        payrollCarryOverAmount: null,
        payrollCarryOverRemaining: null,
      },
    });
    expect(tx.payrollRun.update).toHaveBeenCalled();
  });

  it.each([
    { remaining: null, label: 'fully consumed' },
    { remaining: new Decimal(100_000), label: 'unconsumed' },
    { remaining: new Decimal(40_000), label: 'partially unpaid' },
  ])(
    'preserves $label carry remaining on detach and does not restore it',
    async ({ remaining }) => {
      const tx = createTxMock();
      tx.payrollRun.findUnique.mockResolvedValue({
        id: 'run1',
        status: 'DRAFT',
        payrollMonth: '2026-05',
      });
      tx.bonusRelease.findMany.mockResolvedValue([
        {
          id: 'rel1',
          employeeId: 'e1',
          amount: new Decimal(300_000),
          payrollIncludedAmount: new Decimal(200_000),
          payrollCarryOverAmount: new Decimal(100_000),
          payrollCarryOverRemaining: remaining,
          status: 'INCLUDED_IN_PAYROLL',
          payrollRunId: 'run1',
        },
      ]);
      tx.salaryLine.findUnique.mockResolvedValue({
        id: 'sl1',
        payrollRunId: 'run1',
        employeeId: 'e1',
        baseSalary: new Decimal(100_000),
        bonusesTotal: new Decimal(200_000),
        payrollCarryAppliedAmount: null,
        totalPayable: new Decimal(300_000),
        paidAmount: new Decimal(0),
        remainingAmount: new Decimal(300_000),
        status: 'APPROVED',
      });
      tx.salaryLine.aggregate.mockResolvedValue({
        _sum: {
          baseSalary: new Decimal(100_000),
          bonusesTotal: new Decimal(0),
          totalPayable: new Decimal(100_000),
          paidAmount: new Decimal(0),
        },
      });

      await detachBonusReleasesFromPayrollRun(tx as never, {
        payrollRunId: 'run1',
        releaseIds: ['rel1'],
      });

      expect(tx.bonusRelease.update).toHaveBeenCalledWith({
        where: { id: 'rel1' },
        data: expect.objectContaining({
          payrollCarryOverAmount: new Decimal(100_000),
          payrollCarryOverRemaining: remaining,
        }),
      });
    },
  );

  it('subtracts payrollIncludedAmount when it differs from release amount', async () => {
    const tx = createTxMock();
    tx.payrollRun.findUnique.mockResolvedValue({
      id: 'run1',
      status: 'DRAFT',
      payrollMonth: '2026-05',
    });
    tx.bonusRelease.findMany.mockResolvedValue([
      {
        id: 'rel1',
        employeeId: 'e1',
        amount: new Decimal(100),
        payrollIncludedAmount: new Decimal(40),
        payrollCarryOverAmount: null,
        payrollCarryOverRemaining: null,
        status: 'INCLUDED_IN_PAYROLL',
        payrollRunId: 'run1',
      },
    ]);
    tx.salaryLine.findUnique.mockResolvedValue({
      id: 'sl1',
      payrollRunId: 'run1',
      employeeId: 'e1',
      baseSalary: new Decimal(100),
      bonusesTotal: new Decimal(40),
      payrollCarryAppliedAmount: null,
      totalPayable: new Decimal(140),
      paidAmount: new Decimal(0),
      remainingAmount: new Decimal(140),
      status: 'APPROVED',
    });
    tx.salaryLine.aggregate.mockResolvedValue({
      _sum: {
        baseSalary: new Decimal(100),
        bonusesTotal: new Decimal(0),
        totalPayable: new Decimal(100),
        paidAmount: new Decimal(0),
      },
    });

    await detachBonusReleasesFromPayrollRun(tx as never, {
      payrollRunId: 'run1',
      releaseIds: ['rel1'],
    });

    expect(tx.salaryLine.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bonusesTotal: new Decimal(0),
          totalPayable: new Decimal(100),
        }),
      }),
    );
  });

  it('reverses prior-month carry applied to line when last release is detached', async () => {
    const tx = createTxMock();
    tx.payrollRun.findUnique.mockResolvedValue({
      id: 'run1',
      status: 'DRAFT',
      payrollMonth: '2026-06',
    });
    const detachRelease = {
      id: 'rel1',
      employeeId: 'e1',
      amount: new Decimal(50),
      payrollIncludedAmount: new Decimal(50),
      payrollCarryOverAmount: null,
      payrollCarryOverRemaining: null,
      status: 'INCLUDED_IN_PAYROLL' as const,
      payrollRunId: 'run1',
    };
    // prettier-ignore
    const priorCarry = { id: 'rel-april', status: 'APPROVED', employeeId: 'e1', payrollRunId: null, payrollRun: null, payrollIncludedAmount: null, payrollCarryOverAmount: new Decimal(25), payrollCarryOverRemaining: new Decimal(0) };
    tx.bonusRelease.findMany.mockImplementation((args: { where?: { id?: { in?: string[] } } }) => {
      if (args.where?.id?.in) {
        return Promise.resolve([detachRelease]);
      }
      return Promise.resolve([priorCarry]);
    });
    tx.bonusRelease.count.mockResolvedValue(0);
    tx.salaryLine.findUnique
      .mockResolvedValueOnce({
        id: 'sl1',
        payrollRunId: 'run1',
        employeeId: 'e1',
        baseSalary: new Decimal(100),
        bonusesTotal: new Decimal(75),
        totalPayable: new Decimal(175),
        paidAmount: new Decimal(0),
        remainingAmount: new Decimal(175),
        status: 'APPROVED',
      })
      .mockResolvedValueOnce({
        id: 'sl1',
        baseSalary: new Decimal(100),
        bonusesTotal: new Decimal(25),
        paidAmount: new Decimal(0),
        payrollCarryAppliedAmount: new Decimal(25),
      });
    // prettier-ignore
    tx.salaryLine.aggregate.mockResolvedValue({ _sum: { baseSalary: new Decimal(100), bonusesTotal: new Decimal(0), totalPayable: new Decimal(100), paidAmount: new Decimal(0) } });

    await detachBonusReleasesFromPayrollRun(tx as never, {
      payrollRunId: 'run1',
      releaseIds: ['rel1'],
    });

    expect(tx.salaryLine.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          payrollCarryAppliedAmount: null,
          bonusesTotal: new Decimal(0),
        }),
      }),
    );
  });
});
