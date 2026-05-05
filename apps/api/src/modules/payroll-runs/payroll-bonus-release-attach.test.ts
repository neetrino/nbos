import { describe, it, expect, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { attachBonusReleasesToPayrollRun } from './payroll-bonus-release-attach';

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

describe('attachBonusReleasesToPayrollRun', () => {
  it('throws when run is APPROVED', async () => {
    const tx = createTxMock();
    tx.payrollRun.findUnique.mockResolvedValue({ id: 'run1', status: 'APPROVED' });
    await expect(
      attachBonusReleasesToPayrollRun(tx as never, {
        payrollRunId: 'run1',
        releaseIds: ['r1'],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws when run missing', async () => {
    const tx = createTxMock();
    tx.payrollRun.findUnique.mockResolvedValue(null);
    await expect(
      attachBonusReleasesToPayrollRun(tx as never, {
        payrollRunId: 'run1',
        releaseIds: ['r1'],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws when SALES release attached but KPI actual missing', async () => {
    const tx = createTxMock();
    tx.payrollRun.findUnique.mockResolvedValue({
      id: 'run1',
      status: 'DRAFT',
      kpiSalesPlanAmount: new Decimal(1000),
      kpiSalesActualAmount: null,
    });
    tx.bonusRelease.findMany.mockResolvedValue([
      {
        id: 'rel1',
        employeeId: 'e1',
        amount: new Decimal(10),
        status: 'APPROVED',
        payrollRunId: null,
        bonusEntry: { type: 'SALES' },
      },
    ]);
    await expect(
      attachBonusReleasesToPayrollRun(tx as never, {
        payrollRunId: 'run1',
        releaseIds: ['rel1'],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates salary line and release then recalculates run totals', async () => {
    const tx = createTxMock();
    tx.payrollRun.findUnique.mockResolvedValue({
      id: 'run1',
      status: 'DRAFT',
      kpiSalesPlanAmount: null,
      kpiSalesActualAmount: null,
    });
    tx.bonusRelease.findMany.mockResolvedValue([
      {
        id: 'rel1',
        employeeId: 'e1',
        amount: new Decimal(50),
        status: 'APPROVED',
        payrollRunId: null,
        bonusEntry: { type: 'DELIVERY' },
      },
    ]);
    tx.salaryLine.findUnique.mockResolvedValue({
      id: 'sl1',
      payrollRunId: 'run1',
      employeeId: 'e1',
      baseSalary: new Decimal(100),
      bonusesTotal: new Decimal(0),
      adjustmentsTotal: new Decimal(0),
      deductionsTotal: new Decimal(0),
      totalPayable: new Decimal(100),
      paidAmount: new Decimal(0),
      remainingAmount: new Decimal(100),
      status: 'PENDING',
    });
    tx.salaryLine.aggregate.mockResolvedValue({
      _sum: {
        baseSalary: new Decimal(100),
        bonusesTotal: new Decimal(50),
        adjustmentsTotal: new Decimal(0),
        deductionsTotal: new Decimal(0),
        totalPayable: new Decimal(150),
        paidAmount: new Decimal(0),
      },
    });

    await attachBonusReleasesToPayrollRun(tx as never, {
      payrollRunId: 'run1',
      releaseIds: ['rel1'],
    });

    expect(tx.salaryLine.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sl1' },
        data: expect.objectContaining({
          bonusesTotal: new Decimal(50),
          totalPayable: new Decimal(150),
        }),
      }),
    );
    expect(tx.bonusRelease.update).toHaveBeenCalledWith({
      where: { id: 'rel1' },
      data: {
        status: 'INCLUDED_IN_PAYROLL',
        payrollRunId: 'run1',
        payrollIncludedAmount: new Decimal(50),
      },
    });
    expect(tx.payrollRun.update).toHaveBeenCalled();
  });

  it('applies sales KPI factor to SALES releases when plan/actual set', async () => {
    const tx = createTxMock();
    tx.payrollRun.findUnique.mockResolvedValue({
      id: 'run1',
      status: 'DRAFT',
      kpiSalesPlanAmount: new Decimal(1000),
      kpiSalesActualAmount: new Decimal(600),
    });
    tx.bonusRelease.findMany.mockResolvedValue([
      {
        id: 'rel1',
        employeeId: 'e1',
        amount: new Decimal(100),
        status: 'APPROVED',
        payrollRunId: null,
        bonusEntry: { type: 'SALES' },
      },
    ]);
    tx.salaryLine.findUnique.mockResolvedValue({
      id: 'sl1',
      payrollRunId: 'run1',
      employeeId: 'e1',
      baseSalary: new Decimal(100),
      bonusesTotal: new Decimal(0),
      adjustmentsTotal: new Decimal(0),
      deductionsTotal: new Decimal(0),
      totalPayable: new Decimal(100),
      paidAmount: new Decimal(0),
      remainingAmount: new Decimal(100),
      status: 'PENDING',
    });
    tx.salaryLine.aggregate.mockResolvedValue({
      _sum: {
        baseSalary: new Decimal(100),
        bonusesTotal: new Decimal(50),
        adjustmentsTotal: new Decimal(0),
        deductionsTotal: new Decimal(0),
        totalPayable: new Decimal(150),
        paidAmount: new Decimal(0),
      },
    });

    await attachBonusReleasesToPayrollRun(tx as never, {
      payrollRunId: 'run1',
      releaseIds: ['rel1'],
    });

    expect(tx.salaryLine.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bonusesTotal: new Decimal(50),
        }),
      }),
    );
    expect(tx.bonusRelease.update).toHaveBeenCalledWith({
      where: { id: 'rel1' },
      data: expect.objectContaining({
        payrollIncludedAmount: new Decimal(50),
      }),
    });
  });
});
