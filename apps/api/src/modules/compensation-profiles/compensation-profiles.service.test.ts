import { BadRequestException, ConflictException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CompensationProfilesService } from './compensation-profiles.service';

const ACTOR = {
  id: 'approver-1',
  permissions: { FINANCE_SALARY_EDIT: 'ALL', FINANCE_SALARY_VIEW: 'ALL' },
  departmentIds: [] as string[],
};

describe('CompensationProfilesService.activate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-27T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('copies the profile salary onto the employee when the draft becomes active this month', async () => {
    const baseSalary = { toString: () => '180000.00' };
    const { service, tx } = setupActivate({
      draft: {
        id: 'p1',
        employeeId: 'e1',
        status: 'DRAFT',
        baseSalary,
        effectiveFrom: new Date('2026-09-01T00:00:00.000Z'),
        effectiveTo: null,
      },
      others: [],
      activated: activatedRow({
        id: 'p1',
        baseSalary,
        effectiveFrom: new Date('2026-09-01T00:00:00.000Z'),
      }),
    });

    const result = await service.activate(ACTOR, 'p1', { approvedById: null });

    expect(tx.employee.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { baseSalary: '180000.00' },
    });
    expect(tx.compensationProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ approvedById: 'approver-1' }),
      }),
    );
    expect(result.baseSalary).toBe('180000.00');
    expect(result.status).toBe('ACTIVE');
  });

  it('keeps today’s 100000 profile when a 200000 future month is activated', async () => {
    const futureSalary = { toString: () => '200000' };
    const current = {
      id: 'p-current',
      effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
      effectiveTo: null,
    };
    const { service, tx, prisma } = setupActivate({
      draft: {
        id: 'p-future',
        employeeId: 'e1',
        status: 'DRAFT',
        baseSalary: futureSalary,
        effectiveFrom: new Date('2026-12-01T00:00:00.000Z'),
        effectiveTo: null,
      },
      others: [current],
      activated: activatedRow({
        id: 'p-future',
        baseSalary: futureSalary,
        effectiveFrom: new Date('2026-12-01T00:00:00.000Z'),
      }),
    });

    await service.activate(ACTOR, 'p-future', { approvedById: null });

    expect(tx.compensationProfile.update).toHaveBeenCalledWith({
      where: { id: 'p-current' },
      data: { effectiveTo: new Date('2026-11-30T00:00:00.000Z') },
    });
    expect(tx.compensationProfile.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'ARCHIVED' }),
      }),
    );
    expect(tx.employee.update).not.toHaveBeenCalled();
    expect(prisma.employee.update).not.toHaveBeenCalled();
  });

  it('does not archive the current month or recopy salary when the same profile is activated again', async () => {
    const baseSalary = { toString: () => '100000' };
    const prisma = {
      compensationProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'p-current',
          employeeId: 'e1',
          status: 'ACTIVE',
          baseSalary,
          effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
          effectiveTo: new Date('2026-11-30T00:00:00.000Z'),
          approvedBy: null,
          approvedAt: new Date('2026-01-02T00:00:00.000Z'),
          bonusPolicy: null,
          kpiPolicy: null,
          payoutSchedule: null,
          source: 'MANUAL',
          notes: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
          currency: 'AMD',
        }),
      },
      employee: { update: vi.fn().mockResolvedValue({ id: 'e1' }) },
      $transaction: vi.fn(),
    };
    const service = new CompensationProfilesService(prisma as never);

    const result = await service.activate(ACTOR, 'p-current', { approvedById: null });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.employee.update).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('ACTIVE');
    expect(result.baseSalary).toBe('100000');
  });

  it('rejects overlapping approved ranges for the same month', async () => {
    const { service, tx } = setupActivate({
      draft: {
        id: 'p-new',
        employeeId: 'e1',
        status: 'DRAFT',
        baseSalary: { toString: () => '200000' },
        effectiveFrom: new Date('2026-09-01T00:00:00.000Z'),
        effectiveTo: null,
      },
      others: [
        {
          id: 'p-current',
          effectiveFrom: new Date('2026-09-01T00:00:00.000Z'),
          effectiveTo: null,
        },
      ],
      activated: activatedRow({
        id: 'p-new',
        baseSalary: { toString: () => '200000' },
        effectiveFrom: new Date('2026-09-01T00:00:00.000Z'),
      }),
    });

    await expect(service.activate(ACTOR, 'p-new', { approvedById: null })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(tx.compensationProfile.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'ACTIVE' }),
      }),
    );
  });

  it('rejects a start month before the current payroll month and leaves the prior profile open', async () => {
    const { service, tx } = setupActivate({
      draft: {
        id: 'p-march',
        employeeId: 'e1',
        status: 'DRAFT',
        baseSalary: { toString: () => '350000' },
        effectiveFrom: new Date('2026-03-01T00:00:00.000Z'),
        effectiveTo: null,
      },
      others: [
        {
          id: 'p-january',
          effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
          effectiveTo: null,
        },
      ],
      activated: activatedRow({
        id: 'p-march',
        baseSalary: { toString: () => '350000' },
        effectiveFrom: new Date('2026-03-01T00:00:00.000Z'),
      }),
    });

    await expect(service.activate(ACTOR, 'p-march', { approvedById: null })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(tx.compensationProfile.update).not.toHaveBeenCalled();
    expect(tx.employee.update).not.toHaveBeenCalled();
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
      service.activate(ACTOR, 'p1', { approvedById: 'other-person' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

function activatedRow(params: {
  id: string;
  baseSalary: { toString(): string };
  effectiveFrom: Date;
}) {
  return {
    id: params.id,
    employeeId: 'e1',
    baseSalary: params.baseSalary,
    currency: 'AMD',
    payoutSchedule: null,
    bonusPolicyId: null,
    bonusPolicy: null,
    kpiPolicyId: null,
    kpiPolicy: null,
    effectiveFrom: params.effectiveFrom,
    effectiveTo: null,
    status: 'ACTIVE',
    source: 'MANUAL',
    notes: null,
    approvedBy: null,
    approvedAt: new Date('2026-09-25T00:00:00.000Z'),
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
    updatedAt: new Date('2026-09-25T00:00:00.000Z'),
  };
}

function setupActivate(params: {
  draft: {
    id: string;
    employeeId: string;
    status: string;
    baseSalary: { toString(): string };
    effectiveFrom: Date;
    effectiveTo: Date | null;
  };
  others: { id: string; effectiveFrom: Date; effectiveTo: Date | null }[];
  activated: ReturnType<typeof activatedRow>;
}) {
  const tx = {
    $queryRaw: vi.fn().mockResolvedValue([]),
    compensationProfile: {
      findMany: vi.fn().mockResolvedValue(params.others),
      update: vi
        .fn()
        .mockImplementation(
          async (args: { where: { id: string }; data: Record<string, unknown> }) => {
            if (args.where.id === params.draft.id) {
              return params.activated;
            }
            return { id: args.where.id, ...args.data };
          },
        ),
    },
    employee: { update: vi.fn().mockResolvedValue({ id: 'e1' }) },
  };
  const prisma = {
    compensationProfile: {
      findUnique: vi.fn().mockResolvedValue(params.draft),
    },
    employee: { update: vi.fn() },
    $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
  };
  return { service: new CompensationProfilesService(prisma as never), tx, prisma };
}
