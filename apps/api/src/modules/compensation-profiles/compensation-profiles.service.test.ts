import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { CompensationProfilesService } from './compensation-profiles.service';

describe('CompensationProfilesService.activate', () => {
  it('copies the profile salary onto the employee when the draft becomes active', async () => {
    const baseSalary = { toString: () => '180000.00' };
    const activated = {
      id: 'p1',
      employeeId: 'e1',
      baseSalary,
      currency: 'AMD',
      payoutSchedule: null,
      bonusPolicyId: null,
      bonusPolicy: null,
      kpiPolicyId: null,
      kpiPolicy: null,
      effectiveFrom: new Date('2026-09-01T00:00:00.000Z'),
      effectiveTo: null,
      status: 'ACTIVE',
      source: 'MANUAL',
      notes: null,
      approvedBy: null,
      approvedAt: new Date('2026-09-25T00:00:00.000Z'),
      createdAt: new Date('2026-09-01T00:00:00.000Z'),
      updatedAt: new Date('2026-09-25T00:00:00.000Z'),
    };
    const tx = {
      compensationProfile: {
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockResolvedValue(activated),
      },
      employee: { update: vi.fn().mockResolvedValue({ id: 'e1' }) },
    };
    const prisma = {
      compensationProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'p1',
          employeeId: 'e1',
          status: 'DRAFT',
          baseSalary,
          effectiveFrom: activated.effectiveFrom,
        }),
      },
      employee: { update: vi.fn() },
      $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
    };
    const service = new CompensationProfilesService(prisma as never);

    const result = await service.activate(
      {
        id: 'approver-1',
        permissions: { FINANCE_SALARY_EDIT: 'ALL', FINANCE_SALARY_VIEW: 'ALL' },
        departmentIds: [],
      },
      'p1',
      { approvedById: null },
    );

    expect(tx.employee.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { baseSalary },
    });
    expect(tx.compensationProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ approvedById: 'approver-1' }),
      }),
    );
    expect(result.baseSalary).toBe('180000.00');
    expect(result.status).toBe('ACTIVE');
  });

  it('rejects a foreign approvedById and does not write', async () => {
    const prisma = {
      compensationProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'p1',
          employeeId: 'e1',
          status: 'DRAFT',
          baseSalary: { toString: () => '1' },
          effectiveFrom: new Date('2026-09-01T00:00:00.000Z'),
        }),
      },
      $transaction: vi.fn(),
    };
    const service = new CompensationProfilesService(prisma as never);

    await expect(
      service.activate(
        {
          id: 'approver-1',
          permissions: { FINANCE_SALARY_EDIT: 'ALL', FINANCE_SALARY_VIEW: 'ALL' },
          departmentIds: [],
        },
        'p1',
        { approvedById: 'other-person' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
