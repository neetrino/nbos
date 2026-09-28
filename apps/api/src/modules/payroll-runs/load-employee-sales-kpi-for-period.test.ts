import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';

import { createMockPrisma } from '../../test-utils/mock-prisma';
import { DEFAULT_KPI_GATE_RULES } from './default-kpi-gate-rules';
import {
  batchSalaryBoardSalesKpiSummaries,
  resolveEmployeeSalesKpiForPayoutMonth,
} from './load-employee-sales-kpi-for-period';

describe('resolveEmployeeSalesKpiForPayoutMonth', () => {
  it('does not invent a factor of 1 when the month result is missing', async () => {
    const prisma = createMockPrisma();
    prisma.compensationProfile.findMany.mockResolvedValue([
      {
        id: 'cp1',
        baseSalary: { toString: () => '0' },
        currency: 'AMD',
        kpiPolicyId: 'kp1',
      },
    ]);
    prisma.kpiPolicy.findFirst.mockResolvedValue({
      gateRules: DEFAULT_KPI_GATE_RULES,
      bonusCapBaseSalaryMultiplier: new Decimal(2),
    });
    prisma.kpiResult.findMany.mockResolvedValue([]);

    const detail = await resolveEmployeeSalesKpiForPayoutMonth(prisma as never, {
      employeeId: 'emp-a',
      payoutMonth: '2026-04',
    });

    expect(detail.hasKpiPolicy).toBe(true);
    expect(detail.source).toBe('NOT_SYNCED');
    expect(detail.payoutFactor).toBeNull();
    expect(detail.planAmount).toBeNull();
  });

  it('holds when two results exist for the same employee and period', async () => {
    const prisma = createMockPrisma();
    prisma.compensationProfile.findMany.mockResolvedValue([
      {
        id: 'cp1',
        baseSalary: { toString: () => '0' },
        currency: 'AMD',
        kpiPolicyId: 'kp-active',
      },
    ]);
    prisma.kpiPolicy.findFirst.mockResolvedValue({
      gateRules: DEFAULT_KPI_GATE_RULES,
      bonusCapBaseSalaryMultiplier: new Decimal(2),
    });
    prisma.kpiResult.findMany.mockResolvedValue([
      {
        planAmount: new Decimal('1500000'),
        actualAmount: new Decimal('1050000'),
        attainmentPct: new Decimal('70'),
        payoutFactor: new Decimal('1'),
      },
      {
        planAmount: new Decimal('3000000'),
        actualAmount: new Decimal('1500000'),
        attainmentPct: new Decimal('50'),
        payoutFactor: new Decimal('0.5'),
      },
    ]);

    const detail = await resolveEmployeeSalesKpiForPayoutMonth(prisma as never, {
      employeeId: 'emp-a',
      payoutMonth: '2026-04',
    });

    expect(detail.source).toBe('NOT_SYNCED');
    expect(detail.payoutFactor).toBeNull();
  });
});

describe('batchSalaryBoardSalesKpiSummaries', () => {
  it('uses the unique month row even when the current policy id differs', async () => {
    const prisma = createMockPrisma();
    prisma.compensationProfile.findMany.mockResolvedValue([
      {
        employeeId: 'emp-a',
        kpiPolicyId: 'kp-active',
        effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
        effectiveTo: null,
      },
    ]);
    prisma.kpiResult.findMany.mockResolvedValue([
      {
        employeeId: 'emp-a',
        period: '2026-03',
        kpiPolicyId: 'kp-probation',
        salaryLineId: 'sl1',
        payrollRunId: 'r1',
        planAmount: new Decimal('1500000'),
        actualAmount: new Decimal('1050000'),
        attainmentPct: new Decimal('70'),
        payoutFactor: new Decimal('1'),
      },
    ]);

    const summaries = await batchSalaryBoardSalesKpiSummaries(prisma as never, [
      {
        employeeId: 'emp-a',
        payoutMonth: '2026-04',
        salaryLineId: 'sl1',
        payrollRunId: 'r1',
      },
    ]);

    expect(summaries.get('sl1')).toMatchObject({
      earnedPeriod: '2026-03',
      source: 'KPI_RESULT',
      payoutFactorPct: '100',
      planAmount: '1500000.00',
    });
  });
});
