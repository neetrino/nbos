import { describe, it, expect, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { attachBonusReleasesToPayrollRun } from './payroll-bonus-release-attach';

function bonusEntry(type: string) {
  return { type, order: { code: 'ORD-1' } };
}

function mockAttachReleaseFindMany(
  tx: ReturnType<typeof createTxMock>,
  releases: Array<Record<string, unknown>>,
): void {
  tx.bonusRelease.findMany.mockImplementation((args: { where?: { id?: { in?: string[] } } }) => {
    if (args.where?.id?.in) {
      return Promise.resolve(releases);
    }
    return Promise.resolve([]);
  });
}

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
    compensationProfile: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
    kpiPolicy: {
      findFirst: vi.fn(),
    },
    kpiResult: {
      findFirst: vi.fn(),
    },
  };
}

describe('attachBonusReleasesToPayrollRun', () => {
  it('throws when run is APPROVED', async () => {
    const tx = createTxMock();
    tx.payrollRun.findUnique.mockResolvedValue({
      id: 'run1',
      status: 'APPROVED',
      payrollMonth: '2026-05',
    });
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

  it('throws when SALES release has a KPI policy but no KPI result snapshot', async () => {
    const tx = createTxMock();
    tx.payrollRun.findUnique.mockResolvedValue({
      id: 'run1',
      status: 'DRAFT',
      payrollMonth: '2026-05',
    });
    mockAttachReleaseFindMany(tx, [
      {
        id: 'rel1',
        employeeId: 'e1',
        amount: new Decimal(10),
        status: 'APPROVED',
        payrollRunId: null,
        bonusEntry: bonusEntry('SALES'),
      },
    ]);
    tx.salaryLine.findUnique.mockResolvedValue({
      id: 'sl1',
      baseSalary: new Decimal(100),
      bonusesTotal: new Decimal(0),
      adjustmentsTotal: new Decimal(0),
      deductionsTotal: new Decimal(0),
      paidAmount: new Decimal(0),
      payrollCarryAppliedAmount: null,
    });
    tx.compensationProfile.findFirst.mockResolvedValue({
      id: 'cp1',
      baseSalary: new Decimal(100),
      currency: 'AMD',
      kpiPolicyId: 'kp1',
    });
    tx.kpiPolicy.findFirst.mockResolvedValue({
      gateRules: { bands: [{ minAttainmentPct: 70, payoutFactor: 1 }] },
      bonusCapBaseSalaryMultiplier: new Decimal(2),
    });
    tx.kpiResult.findFirst.mockResolvedValue(null);

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
      payrollMonth: '2026-05',
    });
    mockAttachReleaseFindMany(tx, [
      {
        id: 'rel1',
        employeeId: 'e1',
        amount: new Decimal(50),
        status: 'APPROVED',
        payrollRunId: null,
        bonusEntry: bonusEntry('DELIVERY'),
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

    const events = await attachBonusReleasesToPayrollRun(tx as never, {
      payrollRunId: 'run1',
      releaseIds: ['rel1'],
    });

    expect(events).toEqual([]);

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
        kpiBurnedAmount: null,
        kpiBurnedReason: null,
        payrollCarryOverAmount: null,
        payrollCarryOverRemaining: null,
      },
    });
    expect(tx.payrollRun.update).toHaveBeenCalled();
  });

  it('skips releases already included in the same payroll run (idempotent attach)', async () => {
    const tx = createTxMock();
    tx.payrollRun.findUnique.mockResolvedValue({
      id: 'run1',
      status: 'DRAFT',
      payrollMonth: '2026-05',
    });
    mockAttachReleaseFindMany(tx, [
      {
        id: 'rel1',
        employeeId: 'e1',
        amount: new Decimal(50),
        status: 'INCLUDED_IN_PAYROLL',
        payrollRunId: 'run1',
        bonusEntry: bonusEntry('DELIVERY'),
      },
    ]);
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

    expect(tx.salaryLine.update).not.toHaveBeenCalled();
    expect(tx.bonusRelease.update).not.toHaveBeenCalled();
    expect(tx.payrollRun.update).toHaveBeenCalled();
  });

  it('applies sales KPI result payoutFactor to SALES releases', async () => {
    const tx = createTxMock();
    tx.payrollRun.findUnique.mockResolvedValue({
      id: 'run1',
      status: 'DRAFT',
      payrollMonth: '2026-05',
    });
    mockAttachReleaseFindMany(tx, [
      {
        id: 'rel1',
        employeeId: 'e1',
        amount: new Decimal(100),
        status: 'APPROVED',
        payrollRunId: null,
        bonusEntry: bonusEntry('SALES'),
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
      payrollCarryAppliedAmount: null,
    });
    tx.compensationProfile.findFirst.mockResolvedValue({
      id: 'cp1',
      baseSalary: new Decimal(100),
      currency: 'AMD',
      kpiPolicyId: 'kp1',
    });
    tx.kpiPolicy.findFirst.mockResolvedValue({
      gateRules: { bands: [{ minAttainmentPct: 70, payoutFactor: 1 }] },
      bonusCapBaseSalaryMultiplier: new Decimal(2),
    });
    tx.kpiResult.findFirst.mockResolvedValue({
      planAmount: new Decimal(1000),
      actualAmount: new Decimal(600),
      payoutFactor: new Decimal('0.5'),
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
        kpiBurnedAmount: new Decimal(50),
        payrollCarryOverAmount: null,
        payrollCarryOverRemaining: null,
      }),
    });
  });

  it('pays SALES release at 100% when employee has no KPI policy', async () => {
    const tx = createTxMock();
    tx.payrollRun.findUnique.mockResolvedValue({
      id: 'run1',
      status: 'DRAFT',
      payrollMonth: '2026-05',
    });
    mockAttachReleaseFindMany(tx, [
      {
        id: 'rel1',
        employeeId: 'e1',
        amount: new Decimal(100),
        status: 'APPROVED',
        payrollRunId: null,
        bonusEntry: bonusEntry('SALES'),
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
      payrollCarryAppliedAmount: null,
    });
    tx.salaryLine.aggregate.mockResolvedValue({
      _sum: {
        baseSalary: new Decimal(100),
        bonusesTotal: new Decimal(100),
        adjustmentsTotal: new Decimal(0),
        deductionsTotal: new Decimal(0),
        totalPayable: new Decimal(200),
        paidAmount: new Decimal(0),
      },
    });

    await attachBonusReleasesToPayrollRun(tx as never, {
      payrollRunId: 'run1',
      releaseIds: ['rel1'],
    });

    expect(tx.bonusRelease.update).toHaveBeenCalledWith({
      where: { id: 'rel1' },
      data: expect.objectContaining({
        payrollIncludedAmount: new Decimal(100),
        kpiBurnedAmount: null,
      }),
    });
  });

  it('defers excess as carry-over when monthly bonus cap is reached', async () => {
    const tx = createTxMock();
    tx.payrollRun.findUnique.mockResolvedValue({
      id: 'run1',
      status: 'DRAFT',
      payrollMonth: '2026-05',
    });
    mockAttachReleaseFindMany(tx, [
      {
        id: 'rel1',
        employeeId: 'e1',
        amount: new Decimal(80),
        status: 'APPROVED',
        payrollRunId: null,
        bonusEntry: bonusEntry('DELIVERY'),
      },
    ]);
    tx.salaryLine.findUnique.mockResolvedValue({
      id: 'sl1',
      payrollRunId: 'run1',
      employeeId: 'e1',
      baseSalary: new Decimal(100),
      bonusesTotal: new Decimal(150),
      adjustmentsTotal: new Decimal(0),
      deductionsTotal: new Decimal(0),
      totalPayable: new Decimal(250),
      paidAmount: new Decimal(0),
      remainingAmount: new Decimal(250),
      status: 'PENDING',
    });
    tx.salaryLine.aggregate.mockResolvedValue({
      _sum: {
        baseSalary: new Decimal(100),
        bonusesTotal: new Decimal(200),
        adjustmentsTotal: new Decimal(0),
        deductionsTotal: new Decimal(0),
        totalPayable: new Decimal(300),
        paidAmount: new Decimal(0),
      },
    });

    const events = await attachBonusReleasesToPayrollRun(tx as never, {
      payrollRunId: 'run1',
      releaseIds: ['rel1'],
    });

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'CARRY_DEFERRED',
          employeeId: 'e1',
          releaseId: 'rel1',
          amount: new Decimal(30),
        }),
      ]),
    );

    expect(tx.bonusRelease.update).toHaveBeenCalledWith({
      where: { id: 'rel1' },
      data: expect.objectContaining({
        payrollIncludedAmount: new Decimal(50),
        payrollCarryOverAmount: new Decimal(30),
        payrollCarryOverRemaining: new Decimal(30),
        kpiBurnedAmount: null,
      }),
    });
  });
});
