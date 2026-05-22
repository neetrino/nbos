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
    tx.payrollRun.findUnique.mockResolvedValue({ id: 'run1', status: 'DRAFT' });
    tx.bonusRelease.findMany.mockResolvedValue([
      {
        id: 'rel1',
        employeeId: 'e1',
        amount: new Decimal(50),
        payrollIncludedAmount: new Decimal(50),
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
      adjustmentsTotal: new Decimal(0),
      deductionsTotal: new Decimal(0),
      totalPayable: new Decimal(150),
      paidAmount: new Decimal(0),
      remainingAmount: new Decimal(150),
      status: 'APPROVED',
    });
    tx.salaryLine.aggregate.mockResolvedValue({
      _sum: {
        baseSalary: new Decimal(100),
        bonusesTotal: new Decimal(0),
        adjustmentsTotal: new Decimal(0),
        deductionsTotal: new Decimal(0),
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
        payrollCarryOverAmount: null,
        payrollCarryOverRemaining: null,
      },
    });
    expect(tx.payrollRun.update).toHaveBeenCalled();
  });

  it('restores payrollCarryOverRemaining when release had deferred carry', async () => {
    const tx = createTxMock();
    tx.payrollRun.findUnique.mockResolvedValue({ id: 'run1', status: 'DRAFT' });
    tx.bonusRelease.findMany.mockResolvedValue([
      {
        id: 'rel1',
        employeeId: 'e1',
        amount: new Decimal(80),
        payrollIncludedAmount: new Decimal(50),
        payrollCarryOverAmount: new Decimal(30),
        status: 'INCLUDED_IN_PAYROLL',
        payrollRunId: 'run1',
      },
    ]);
    tx.salaryLine.findUnique.mockResolvedValue({
      id: 'sl1',
      payrollRunId: 'run1',
      employeeId: 'e1',
      baseSalary: new Decimal(100),
      bonusesTotal: new Decimal(200),
      adjustmentsTotal: new Decimal(0),
      deductionsTotal: new Decimal(0),
      totalPayable: new Decimal(300),
      paidAmount: new Decimal(0),
      remainingAmount: new Decimal(300),
      status: 'APPROVED',
    });
    tx.salaryLine.aggregate.mockResolvedValue({
      _sum: {
        baseSalary: new Decimal(100),
        bonusesTotal: new Decimal(150),
        adjustmentsTotal: new Decimal(0),
        deductionsTotal: new Decimal(0),
        totalPayable: new Decimal(250),
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
        payrollCarryOverRemaining: new Decimal(30),
      }),
    });
  });

  it('subtracts payrollIncludedAmount when it differs from release amount', async () => {
    const tx = createTxMock();
    tx.payrollRun.findUnique.mockResolvedValue({ id: 'run1', status: 'DRAFT' });
    tx.bonusRelease.findMany.mockResolvedValue([
      {
        id: 'rel1',
        employeeId: 'e1',
        amount: new Decimal(100),
        payrollIncludedAmount: new Decimal(40),
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
      adjustmentsTotal: new Decimal(0),
      deductionsTotal: new Decimal(0),
      totalPayable: new Decimal(140),
      paidAmount: new Decimal(0),
      remainingAmount: new Decimal(140),
      status: 'APPROVED',
    });
    tx.salaryLine.aggregate.mockResolvedValue({
      _sum: {
        baseSalary: new Decimal(100),
        bonusesTotal: new Decimal(0),
        adjustmentsTotal: new Decimal(0),
        deductionsTotal: new Decimal(0),
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
});
