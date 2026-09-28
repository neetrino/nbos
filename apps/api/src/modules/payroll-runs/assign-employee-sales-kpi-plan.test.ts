import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { beforeEach, describe, expect, it } from 'vitest';

import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { DEFAULT_KPI_GATE_RULES } from './default-kpi-gate-rules';
import { assignEmployeeSalesKpiPlan } from './assign-employee-sales-kpi-plan';

const PERIOD = '2026-03';
const FINANCE = {
  id: 'fin-1',
  permissions: { FINANCE_SALARY_EDIT: 'ALL' },
  departmentIds: [] as string[],
};

function stubMonthProfile(prisma: MockPrisma): void {
  prisma.compensationProfile.findMany.mockResolvedValue([
    {
      id: 'cp1',
      baseSalary: { toString: () => '0' },
      currency: 'AMD',
      kpiPolicyId: 'kp-active',
    },
  ]);
  prisma.kpiPolicy.findFirst.mockResolvedValue({
    id: 'kp-active',
    gateRules: DEFAULT_KPI_GATE_RULES,
    targetAmount: new Decimal('1500000.00'),
    targetSource: 'MANUAL_POLICY',
    resultSource: 'SALES_PAYMENTS',
  });
}

describe('assignEmployeeSalesKpiPlan', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.employee.findUnique.mockResolvedValue({ id: 'emp-a' });
    stubMonthProfile(prisma);
    prisma.payment.findMany.mockResolvedValue([]);
  });

  it('creates one employee KpiResult with the assigned plan and not the policy target', async () => {
    prisma.kpiResult.findMany.mockImplementation(() => {
      if (prisma.kpiResult.create.mock.calls.length === 0) {
        return Promise.resolve([]);
      }
      return Promise.resolve([
        {
          id: 'kr-new',
          planAmount: new Decimal('900000.00'),
          salaryLineId: null,
          actualAmount: null,
        },
      ]);
    });
    prisma.kpiResult.create.mockResolvedValue({ id: 'kr-new' });

    const out = await assignEmployeeSalesKpiPlan(prisma as never, FINANCE, {
      employeeId: 'emp-a',
      period: PERIOD,
      planAmount: 900_000,
    });

    expect(out).toEqual({
      id: 'kr-new',
      employeeId: 'emp-a',
      period: PERIOD,
      planAmount: '900000.00',
    });
    expect(prisma.kpiResult.create).toHaveBeenCalledTimes(1);
    expect(prisma.kpiResult.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          employeeId: 'emp-a',
          period: PERIOD,
          planAmount: new Decimal('900000.00'),
          source: 'MANUAL',
        }),
      }),
    );
    const created = prisma.kpiResult.create.mock.calls[0]?.[0] as {
      data: { planAmount: Decimal; employeeId: string };
    };
    expect(created.data.planAmount.toFixed(2)).toBe('900000.00');
    expect(created.data.planAmount.toFixed(2)).not.toBe('1500000.00');
    expect(prisma.kpiResult.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { employeeId: 'emp-a', period: PERIOD } }),
    );
    expect(prisma.bonusEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          employeeId: 'emp-a',
          type: 'SALES',
          earnedPeriod: PERIOD,
        }),
      }),
    );
  });

  it('refreshes Sales payable from a stored actual and does not invent one', async () => {
    prisma.kpiResult.findMany.mockResolvedValue([
      {
        id: 'kr-a',
        salaryLineId: null,
        planAmount: new Decimal('400000.00'),
        actualAmount: new Decimal('200000.00'),
      },
    ]);
    prisma.kpiResult.update.mockResolvedValue({ id: 'kr-a' });
    prisma.payment.findMany.mockResolvedValue([
      {
        id: 'pay-a',
        amount: new Decimal('200000.00'),
        paymentDate: new Date('2026-03-10T00:00:00.000Z'),
        invoice: {
          id: 'inv-a',
          code: 'INV-1',
          order: {
            id: 'ord-a',
            code: 'ORD-1',
            deal: { id: 'deal-a', sellerId: 'emp-a' },
          },
        },
      },
    ]);
    prisma.bonusEntry.findMany.mockResolvedValue([
      { id: 'be1', amount: new Decimal(400_000), payableAdjustment: new Decimal(0) },
    ]);

    await assignEmployeeSalesKpiPlan(prisma as never, FINANCE, {
      employeeId: 'emp-a',
      period: PERIOD,
      planAmount: 400_000,
    });

    expect(prisma.bonusEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'be1' },
        data: expect.objectContaining({
          payableAmount: new Decimal('200000.00'),
          kpiPayoutFactor: new Decimal('0.5'),
        }),
      }),
    );
  });

  it('updates the existing unpaid row instead of inserting another', async () => {
    prisma.kpiResult.findMany.mockResolvedValue([
      { id: 'kr-a', salaryLineId: null, planAmount: new Decimal('500000.00') },
    ]);
    prisma.kpiResult.update.mockResolvedValue({ id: 'kr-a' });

    await assignEmployeeSalesKpiPlan(prisma as never, FINANCE, {
      employeeId: 'emp-a',
      period: PERIOD,
      planAmount: 1_200_000,
    });

    expect(prisma.kpiResult.create).not.toHaveBeenCalled();
    expect(prisma.kpiResult.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'kr-a' },
        data: expect.objectContaining({
          planAmount: new Decimal('1200000.00'),
          source: 'MANUAL',
        }),
      }),
    );
  });

  it('rejects overwrite when the result is linked to a paid salary line', async () => {
    prisma.kpiResult.findMany.mockResolvedValue([
      { id: 'kr-paid', salaryLineId: 'sl-paid', planAmount: new Decimal('900000.00') },
    ]);
    prisma.salaryLine.findUnique.mockResolvedValue({
      status: 'PAID',
      paidAmount: new Decimal('100.00'),
    });

    await expect(
      assignEmployeeSalesKpiPlan(prisma as never, FINANCE, {
        employeeId: 'emp-a',
        period: PERIOD,
        planAmount: 1_200_000,
      }),
    ).rejects.toThrow(/paid salary line/);
    expect(prisma.kpiResult.update).not.toHaveBeenCalled();
    expect(prisma.kpiResult.create).not.toHaveBeenCalled();
  });

  it('rejects a caller without company-wide salary EDIT', async () => {
    await expect(
      assignEmployeeSalesKpiPlan(
        prisma as never,
        {
          id: 'fin-dept',
          permissions: { FINANCE_SALARY_EDIT: 'DEPARTMENT' },
          departmentIds: ['d1'],
        },
        { employeeId: 'emp-a', period: PERIOD, planAmount: 900_000 },
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.kpiResult.create).not.toHaveBeenCalled();
  });

  it('throws when the employee is missing', async () => {
    prisma.employee.findUnique.mockResolvedValue(null);
    await expect(
      assignEmployeeSalesKpiPlan(prisma as never, FINANCE, {
        employeeId: 'missing',
        period: PERIOD,
        planAmount: 900_000,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects a non YYYY-MM period', async () => {
    await expect(
      assignEmployeeSalesKpiPlan(prisma as never, FINANCE, {
        employeeId: 'emp-a',
        period: '2026-3',
        planAmount: 900_000,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
