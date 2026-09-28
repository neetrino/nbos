import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';

import { DEFAULT_KPI_GATE_RULES } from './default-kpi-gate-rules';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { syncSalesKpiForEarnedPeriodEmployee } from './sync-sales-kpi-line';

const EARNED_PERIOD = '2026-03';
const POLICY_ACTIVE = 'kp-active';
const POLICY_TEMPLATE_AMOUNT = new Decimal('9999999.00');
const PLAN_A = new Decimal('1500000.00');
const PLAN_B = new Decimal('3000000.00');

function stubActivePolicy(prisma: MockPrisma, policyId = POLICY_ACTIVE): void {
  prisma.compensationProfile.findMany.mockResolvedValue([
    {
      id: 'cp1',
      baseSalary: { toString: () => '0' },
      currency: 'AMD',
      kpiPolicyId: policyId,
    },
  ]);
  prisma.kpiPolicy.findFirst.mockResolvedValue({
    id: policyId,
    gateRules: DEFAULT_KPI_GATE_RULES,
    targetAmount: POLICY_TEMPLATE_AMOUNT,
    targetSource: 'MANUAL_POLICY',
    resultSource: 'SALES_PAYMENTS',
  });
}

function stubPayments(prisma: MockPrisma, amount: Decimal, sellerId: string): void {
  prisma.payment.findMany.mockResolvedValue([
    {
      id: `pay-${sellerId}`,
      amount,
      paymentDate: new Date('2026-03-10T00:00:00.000Z'),
      invoice: {
        id: `inv-${sellerId}`,
        code: 'INV-1',
        order: {
          id: `ord-${sellerId}`,
          code: 'ORD-1',
          deal: { id: `deal-${sellerId}`, sellerId },
        },
      },
    },
  ]);
}

function stubExistingPlan(
  prisma: MockPrisma,
  params: { id: string; plan: Decimal; salaryLineId?: string | null },
): void {
  prisma.kpiResult.findMany.mockResolvedValue([
    {
      id: params.id,
      planAmount: params.plan,
      salaryLineId: params.salaryLineId ?? null,
    },
  ]);
}

function updateData(prisma: MockPrisma): Record<string, unknown> {
  const call = prisma.kpiResult.update.mock.calls[0]?.[0] as {
    data: Record<string, unknown>;
    where: { id: string };
  };
  return call.data;
}

describe('syncSalesKpiForEarnedPeriodEmployee', () => {
  it('writes factor 1 at exactly 70 percent of the stored individual plan', async () => {
    const prisma = createMockPrisma();
    stubActivePolicy(prisma);
    stubExistingPlan(prisma, { id: 'kr-a', plan: PLAN_A });
    stubPayments(prisma, new Decimal('1050000.00'), 'emp-a');

    const synced = await syncSalesKpiForEarnedPeriodEmployee(prisma as never, {
      employeeId: 'emp-a',
      earnedPeriod: EARNED_PERIOD,
    });

    expect(synced).toBe(true);
    expect(prisma.kpiResult.create).not.toHaveBeenCalled();
    expect(prisma.kpiResult.upsert).not.toHaveBeenCalled();
    expect(prisma.kpiResult.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'kr-a' } }),
    );
    const data = updateData(prisma);
    expect(data.payoutFactor).toBeInstanceOf(Decimal);
    expect((data.payoutFactor as Decimal).toString()).toBe('1');
    expect(data).not.toHaveProperty('planAmount');
  });

  it('writes factor 0.5 at exactly 50 percent and 0 just below 50 percent', async () => {
    const prisma = createMockPrisma();
    stubActivePolicy(prisma);
    stubExistingPlan(prisma, { id: 'kr-a', plan: PLAN_A });
    stubPayments(prisma, new Decimal('750000.00'), 'emp-a');

    await syncSalesKpiForEarnedPeriodEmployee(prisma as never, {
      employeeId: 'emp-a',
      earnedPeriod: EARNED_PERIOD,
    });
    expect((updateData(prisma).payoutFactor as Decimal).toString()).toBe('0.5');

    prisma.kpiResult.update.mockClear();
    stubPayments(prisma, new Decimal('749999.99'), 'emp-a');
    await syncSalesKpiForEarnedPeriodEmployee(prisma as never, {
      employeeId: 'emp-a',
      earnedPeriod: EARNED_PERIOD,
    });
    expect((updateData(prisma).payoutFactor as Decimal).toString()).toBe('0');
  });

  it('holds when Finance has not stored a plan and does not copy the policy template', async () => {
    const prisma = createMockPrisma();
    stubActivePolicy(prisma);
    prisma.kpiResult.findMany.mockResolvedValue([]);
    stubPayments(prisma, new Decimal('1050000.00'), 'emp-a');

    const synced = await syncSalesKpiForEarnedPeriodEmployee(prisma as never, {
      employeeId: 'emp-a',
      earnedPeriod: EARNED_PERIOD,
    });

    expect(synced).toBe(false);
    expect(prisma.kpiResult.create).not.toHaveBeenCalled();
    expect(prisma.kpiResult.update).not.toHaveBeenCalled();
    expect(prisma.kpiResult.upsert).not.toHaveBeenCalled();
    expect(prisma.payment.findMany).not.toHaveBeenCalled();
  });

  it('keeps employee A and B plans separate in the same month', async () => {
    const prisma = createMockPrisma();
    stubActivePolicy(prisma);
    prisma.kpiResult.findMany
      .mockResolvedValueOnce([{ id: 'kr-a', planAmount: PLAN_A, salaryLineId: null }])
      .mockResolvedValueOnce([{ id: 'kr-b', planAmount: PLAN_B, salaryLineId: null }]);
    stubPayments(prisma, new Decimal('1500000.00'), 'emp-b');

    await syncSalesKpiForEarnedPeriodEmployee(prisma as never, {
      employeeId: 'emp-a',
      earnedPeriod: EARNED_PERIOD,
    });
    await syncSalesKpiForEarnedPeriodEmployee(prisma as never, {
      employeeId: 'emp-b',
      earnedPeriod: EARNED_PERIOD,
    });

    const second = prisma.kpiResult.update.mock.calls[1]?.[0] as {
      where: { id: string };
      data: { payoutFactor: Decimal };
    };
    expect(second.where.id).toBe('kr-b');
    expect(second.data.payoutFactor.toString()).toBe('0.5');
    expect(second.data).not.toHaveProperty('planAmount');
  });

  it('replays against the same row', async () => {
    const prisma = createMockPrisma();
    stubActivePolicy(prisma);
    stubExistingPlan(prisma, { id: 'kr-a', plan: PLAN_A });
    stubPayments(prisma, new Decimal('1050000.00'), 'emp-a');

    await syncSalesKpiForEarnedPeriodEmployee(prisma as never, {
      employeeId: 'emp-a',
      earnedPeriod: EARNED_PERIOD,
    });
    await syncSalesKpiForEarnedPeriodEmployee(prisma as never, {
      employeeId: 'emp-a',
      earnedPeriod: EARNED_PERIOD,
    });

    expect(prisma.kpiResult.create).not.toHaveBeenCalled();
    expect(prisma.kpiResult.update).toHaveBeenCalledTimes(2);
    expect(prisma.kpiResult.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: { id: 'kr-a' } }),
    );
  });

  it('does not insert a second row when the KPI policy changes (Probation to Active)', async () => {
    const prisma = createMockPrisma();
    stubActivePolicy(prisma, POLICY_ACTIVE);
    stubExistingPlan(prisma, { id: 'kr-month', plan: PLAN_A });
    stubPayments(prisma, new Decimal('1050000.00'), 'emp-a');

    await syncSalesKpiForEarnedPeriodEmployee(prisma as never, {
      employeeId: 'emp-a',
      earnedPeriod: EARNED_PERIOD,
    });

    expect(prisma.kpiResult.create).not.toHaveBeenCalled();
    expect(prisma.kpiResult.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'kr-month' },
        data: expect.objectContaining({ kpiPolicyId: POLICY_ACTIVE }),
      }),
    );
  });

  it('holds when two results exist for the same employee and period', async () => {
    const prisma = createMockPrisma();
    stubActivePolicy(prisma);
    prisma.kpiResult.findMany.mockResolvedValue([
      { id: 'kr-1', planAmount: PLAN_A, salaryLineId: null },
      { id: 'kr-2', planAmount: PLAN_B, salaryLineId: null },
    ]);

    const synced = await syncSalesKpiForEarnedPeriodEmployee(prisma as never, {
      employeeId: 'emp-a',
      earnedPeriod: EARNED_PERIOD,
    });

    expect(synced).toBe(false);
    expect(prisma.kpiResult.update).not.toHaveBeenCalled();
    expect(prisma.kpiResult.create).not.toHaveBeenCalled();
  });

  it('does not overwrite a plan linked to a paid salary line', async () => {
    const prisma = createMockPrisma();
    stubActivePolicy(prisma);
    stubExistingPlan(prisma, {
      id: 'kr-paid',
      plan: PLAN_A,
      salaryLineId: 'sl-paid',
    });
    prisma.salaryLine.findUnique.mockResolvedValue({
      status: 'PAID',
      paidAmount: new Decimal('100.00'),
    });
    stubPayments(prisma, new Decimal('1050000.00'), 'emp-a');

    const synced = await syncSalesKpiForEarnedPeriodEmployee(prisma as never, {
      employeeId: 'emp-a',
      earnedPeriod: EARNED_PERIOD,
    });

    expect(synced).toBe(true);
    expect(prisma.kpiResult.update).not.toHaveBeenCalled();
    expect(prisma.payment.findMany).not.toHaveBeenCalled();
  });
});
