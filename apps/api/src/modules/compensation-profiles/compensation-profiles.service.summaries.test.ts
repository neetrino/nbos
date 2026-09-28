import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CompensationProfilesService } from './compensation-profiles.service';
import { endOfPayrollMonthUtc, startOfPayrollMonthUtc } from './compensation-profile-payroll-month';

const ACTOR = {
  id: 'approver-1',
  permissions: { FINANCE_SALARY_EDIT: 'ALL', FINANCE_SALARY_VIEW: 'ALL' },
  departmentIds: [] as string[],
};

describe('CompensationProfilesService.listActiveSummaries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-27T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns only the approved profile that covers the current payroll month', async () => {
    const prisma = {
      compensationProfile: {
        findMany: vi.fn().mockResolvedValue([
          {
            employeeId: 'e1',
            baseSalary: { toString: () => '100000' },
            currency: 'AMD',
            bonusPolicy: { name: 'Sales', templateCode: 'SALES' },
            kpiPolicy: { name: 'KPI' },
          },
        ]),
      },
    };
    const service = new CompensationProfilesService(prisma as never);

    const result = await service.listActiveSummaries(ACTOR);

    expect(result.items).toEqual([
      {
        employeeId: 'e1',
        baseSalary: '100000',
        currency: 'AMD',
        bonusPolicyName: 'Sales',
        bonusTemplateCode: 'SALES',
        kpiPolicyName: 'KPI',
      },
    ]);
    expect(prisma.compensationProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'ACTIVE',
          effectiveFrom: { lte: endOfPayrollMonthUtc('2026-09') },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: startOfPayrollMonthUtc('2026-09') } }],
        }),
      }),
    );
  });
});
