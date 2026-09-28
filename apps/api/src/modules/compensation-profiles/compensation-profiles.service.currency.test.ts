import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { CompensationProfilesService } from './compensation-profiles.service';

const ACTOR = {
  id: 'approver-1',
  permissions: { FINANCE_SALARY_EDIT: 'ALL', FINANCE_SALARY_VIEW: 'ALL' },
  departmentIds: [] as string[],
};

function createdAmdRow() {
  return {
    id: 'p-new',
    employeeId: 'e1',
    baseSalary: { toString: () => '180000' },
    currency: 'AMD',
    payoutSchedule: null,
    bonusPolicyId: null,
    bonusPolicy: null,
    kpiPolicyId: null,
    kpiPolicy: null,
    effectiveFrom: new Date('2026-09-01T00:00:00.000Z'),
    effectiveTo: null,
    status: 'DRAFT',
    source: 'MANUAL',
    notes: null,
    approvedBy: null,
    approvedAt: null,
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
    updatedAt: new Date('2026-09-01T00:00:00.000Z'),
  };
}

function createPrisma() {
  return {
    employee: { findUnique: vi.fn().mockResolvedValue({ id: 'e1' }), update: vi.fn() },
    compensationProfile: {
      findUnique: vi.fn(),
      create: vi.fn().mockResolvedValue(createdAmdRow()),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };
}

describe('CompensationProfilesService AMD currency contract', () => {
  it('creates an omitted-currency draft as AMD take-home', async () => {
    const prisma = createPrisma();
    const service = new CompensationProfilesService(prisma as never);

    const result = await service.createDraft(ACTOR, 'e1', {
      baseSalary: 180000,
      effectiveFrom: '2026-09-01',
    });

    expect(prisma.compensationProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ currency: 'AMD' }),
      }),
    );
    expect(result.currency).toBe('AMD');
  });

  it('rejects creating a USD profile and does not save it as AMD', async () => {
    const prisma = createPrisma();
    const service = new CompensationProfilesService(prisma as never);

    await expect(
      service.createDraft(ACTOR, 'e1', {
        baseSalary: 180000,
        currency: 'USD',
        effectiveFrom: '2026-09-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.compensationProfile.create).not.toHaveBeenCalled();
  });

  it('rejects creating a EUR profile', async () => {
    const prisma = createPrisma();
    const service = new CompensationProfilesService(prisma as never);

    await expect(
      service.createDraft(ACTOR, 'e1', {
        baseSalary: 180000,
        currency: 'EUR',
        effectiveFrom: '2026-09-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.compensationProfile.create).not.toHaveBeenCalled();
  });

  it('rejects creating a blank-currency profile instead of rewriting it to AMD', async () => {
    const prisma = createPrisma();
    const service = new CompensationProfilesService(prisma as never);

    await expect(
      service.createDraft(ACTOR, 'e1', {
        baseSalary: 180000,
        currency: '',
        effectiveFrom: '2026-09-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.compensationProfile.create).not.toHaveBeenCalled();
  });

  it('rejects a USD draft patch and does not rewrite the stored currency', async () => {
    const prisma = createPrisma();
    prisma.compensationProfile.findUnique.mockResolvedValue({
      id: 'p1',
      employeeId: 'e1',
      status: 'DRAFT',
      currency: 'AMD',
    });
    const service = new CompensationProfilesService(prisma as never);

    await expect(service.patchDraft(ACTOR, 'p1', { currency: 'USD' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.compensationProfile.update).not.toHaveBeenCalled();
  });

  it('rejects activating a USD profile and does not save it as AMD', async () => {
    const prisma = createPrisma();
    prisma.compensationProfile.findUnique.mockResolvedValue({
      id: 'p-usd',
      employeeId: 'e1',
      status: 'DRAFT',
      currency: 'USD',
      baseSalary: { toString: () => '1000' },
      effectiveFrom: new Date('2026-09-01T00:00:00.000Z'),
      effectiveTo: null,
    });
    const service = new CompensationProfilesService(prisma as never);

    await expect(service.activate(ACTOR, 'p-usd', { approvedById: null })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.compensationProfile.update).not.toHaveBeenCalled();
  });
});
