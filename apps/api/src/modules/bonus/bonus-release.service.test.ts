import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { BonusReleaseService } from './bonus-release.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import type { NotificationService } from '../notifications/notification.service';

const ALL = {
  id: 'emp1',
  permissions: {
    FINANCE_BONUSES_VIEW: 'ALL',
    FINANCE_BONUSES_ADD: 'ALL',
    FINANCE_BONUSES_EDIT: 'ALL',
  },
  departmentIds: [] as string[],
};

const SALARY_EDIT_ALL = {
  id: 'emp1',
  permissions: {
    FINANCE_BONUSES_VIEW: 'ALL',
    FINANCE_BONUSES_ADD: 'ALL',
    FINANCE_BONUSES_EDIT: 'ALL',
    FINANCE_SALARY_EDIT: 'ALL',
  },
  departmentIds: [] as string[],
};

const sampleEntry = {
  id: 'be1',
  employeeId: 'emp1',
  orderId: 'o1',
  projectId: 'p1',
  amount: new Decimal(100),
  order: { productId: 'prod1', extensionId: null as string | null },
};

describe('BonusReleaseService', () => {
  let prisma: MockPrisma;
  let service: BonusReleaseService;
  let notifications: NotificationService;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.bonusEntry.findMany.mockResolvedValue([]);
    notifications = { create: vi.fn() } as unknown as NotificationService;
    service = new BonusReleaseService(prisma as never, notifications);
  });

  it('listForEntry throws when entry missing', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue(null);
    await expect(service.listForEntry(ALL, 'missing')).rejects.toThrow(NotFoundException);
  });

  it('listForEntry returns paginated releases', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue({ id: 'be1', employeeId: 'emp1' });
    prisma.bonusRelease.findMany.mockResolvedValue([{ id: 'r1' }]);
    prisma.bonusRelease.count.mockResolvedValue(1);
    const out = await service.listForEntry(ALL, 'be1', { page: 1, pageSize: 20 });
    expect(out.items).toEqual([{ id: 'r1' }]);
    expect(out.meta).toEqual({ total: 1, page: 1, pageSize: 20, totalPages: 1 });
    expect(prisma.bonusRelease.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { bonusEntryId: 'be1' },
        skip: 0,
        take: 20,
      }),
    );
  });

  it('createForEntry rejects EARLY without reason', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue(sampleEntry);
    await expect(
      service.createForEntry(ALL, 'be1', { amount: 10, releaseType: 'EARLY' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('createForEntry rejects a foreign approvedById', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue(sampleEntry);
    await expect(
      service.createForEntry(ALL, 'be1', {
        amount: 10,
        releaseType: 'OVER_FUNDING',
        reason: 'ceo approved',
        approvedById: 'other-person',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.bonusRelease.create).not.toHaveBeenCalled();
  });

  it('createForEntry rejects unknown payroll run', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue(sampleEntry);
    prisma.payrollRun.findUnique.mockResolvedValue(null);
    await expect(
      service.createForEntry(SALARY_EDIT_ALL, 'be1', {
        amount: 10,
        releaseType: 'MANUAL',
        payrollRunId: 'pr-unknown',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('createForEntry rejects when over entry planned cap', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue(sampleEntry);
    prisma.payrollRun.findUnique.mockResolvedValue({ id: 'pr1' });
    prisma.bonusRelease.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(80) } });
    await expect(
      service.createForEntry(SALARY_EDIT_ALL, 'be1', {
        amount: 30,
        releaseType: 'MANUAL',
        payrollRunId: 'pr1',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('createForEntry persists and syncs pool', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue(sampleEntry);
    prisma.bonusRelease.aggregate
      .mockResolvedValueOnce({ _sum: { amount: null } })
      .mockResolvedValueOnce({ _sum: { amount: new Decimal(10) } });
    prisma.bonusRelease.create.mockResolvedValue({ id: 'rel1' });
    prisma.order.findUnique.mockResolvedValue({
      id: 'o1',
      projectId: 'p1',
      productId: 'prod1',
      extensionId: null,
    });
    prisma.bonusEntry.aggregate
      .mockResolvedValueOnce({ _sum: { amount: new Decimal(100) } })
      .mockResolvedValueOnce({ _sum: { amount: new Decimal(0) } });
    prisma.productBonusPool.upsert.mockResolvedValue({});

    const created = await service.createForEntry(ALL, 'be1', {
      amount: 10,
      releaseType: 'MANUAL',
    });

    expect(created).toEqual({ id: 'rel1' });
    expect(prisma.bonusRelease.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ approvedById: 'emp1', status: 'APPROVED' }),
      }),
    );
    expect(prisma.productBonusPool.upsert).toHaveBeenCalled();
  });

  it.each(['OWN', 'DEPARTMENT'] as const)(
    'createForEntry rejects payrollRunId when salary EDIT is %s',
    async (salaryEdit) => {
      prisma.bonusEntry.findUnique.mockResolvedValue(sampleEntry);
      await expect(
        service.createForEntry(
          {
            id: 'emp1',
            permissions: {
              FINANCE_BONUSES_VIEW: 'ALL',
              FINANCE_BONUSES_ADD: 'ALL',
              FINANCE_SALARY_EDIT: salaryEdit,
            },
            departmentIds: ['d1'],
          },
          'be1',
          { amount: 10, releaseType: 'MANUAL', payrollRunId: 'pr1' },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.bonusRelease.create).not.toHaveBeenCalled();
      expect(prisma.payrollRun.findUnique).not.toHaveBeenCalled();
    },
  );

  it('createForEntry attaches a payroll run when salary EDIT is ALL', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue(sampleEntry);
    prisma.payrollRun.findUnique.mockResolvedValue({ id: 'pr1' });
    prisma.bonusRelease.aggregate
      .mockResolvedValueOnce({ _sum: { amount: null } })
      .mockResolvedValueOnce({ _sum: { amount: new Decimal(10) } });
    prisma.bonusRelease.create.mockResolvedValue({ id: 'rel-pr' });
    prisma.order.findUnique.mockResolvedValue({
      id: 'o1',
      projectId: 'p1',
      productId: 'prod1',
      extensionId: null,
    });
    prisma.bonusEntry.aggregate
      .mockResolvedValueOnce({ _sum: { amount: new Decimal(100) } })
      .mockResolvedValueOnce({ _sum: { amount: new Decimal(0) } });
    prisma.productBonusPool.upsert.mockResolvedValue({});

    const created = await service.createForEntry(SALARY_EDIT_ALL, 'be1', {
      amount: 10,
      releaseType: 'MANUAL',
      payrollRunId: 'pr1',
    });

    expect(created).toEqual({ id: 'rel-pr' });
    expect(prisma.bonusRelease.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ payrollRunId: 'pr1' }),
      }),
    );
  });

  it('patchForEntry throws when release belongs to another entry', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue(sampleEntry);
    prisma.bonusRelease.findUnique.mockResolvedValue({
      id: 'r1',
      bonusEntryId: 'other',
      amount: new Decimal(10),
      status: 'APPROVED',
      releaseType: 'AUTO',
    });
    await expect(
      service.patchForEntry(ALL, 'be1', 'r1', { amount: 5, reason: 'x' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('patchForEntry rejects INCLUDED_IN_PAYROLL releases', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue(sampleEntry);
    prisma.bonusRelease.findUnique.mockResolvedValue({
      id: 'r1',
      bonusEntryId: 'be1',
      amount: new Decimal(10),
      status: 'INCLUDED_IN_PAYROLL',
      releaseType: 'AUTO',
    });
    await expect(
      service.patchForEntry(ALL, 'be1', 'r1', { amount: 5, reason: 'x' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('patchForEntry rejects unchanged amount', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue(sampleEntry);
    prisma.bonusRelease.findUnique.mockResolvedValue({
      id: 'r1',
      bonusEntryId: 'be1',
      amount: new Decimal(10),
      status: 'APPROVED',
      releaseType: 'MANUAL',
    });
    await expect(
      service.patchForEntry(ALL, 'be1', 'r1', { amount: 10, reason: 'x' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('patchForEntry rejects empty reason', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue(sampleEntry);
    prisma.bonusRelease.findUnique.mockResolvedValue({
      id: 'r1',
      bonusEntryId: 'be1',
      amount: new Decimal(10),
      status: 'APPROVED',
      releaseType: 'MANUAL',
    });
    await expect(
      service.patchForEntry(ALL, 'be1', 'r1', { amount: 20, reason: '   ' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('patchForEntry rejects when new total exceeds entry cap', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue(sampleEntry);
    prisma.bonusRelease.findUnique.mockResolvedValue({
      id: 'r1',
      bonusEntryId: 'be1',
      amount: new Decimal(10),
      status: 'APPROVED',
      releaseType: 'MANUAL',
    });
    prisma.bonusRelease.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(80) } });
    await expect(
      service.patchForEntry(ALL, 'be1', 'r1', { amount: 30, reason: 'too much' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('patchForEntry rejects a foreign approvedById', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue(sampleEntry);
    prisma.bonusRelease.findUnique.mockResolvedValue({
      id: 'r1',
      bonusEntryId: 'be1',
      amount: new Decimal(10),
      status: 'APPROVED',
      releaseType: 'OVER_FUNDING',
    });
    await expect(
      service.patchForEntry(ALL, 'be1', 'r1', {
        amount: 20,
        reason: 'ceo',
        approvedById: 'other-person',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.bonusRelease.update).not.toHaveBeenCalled();
  });

  it('patchForEntry updates AUTO to CORRECTION and syncs pool', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue(sampleEntry);
    prisma.bonusRelease.findUnique.mockResolvedValue({
      id: 'r1',
      bonusEntryId: 'be1',
      amount: new Decimal(100),
      status: 'APPROVED',
      releaseType: 'AUTO',
    });
    prisma.bonusRelease.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(0) } });
    prisma.bonusRelease.update.mockResolvedValue({
      id: 'r1',
      releaseType: 'CORRECTION',
    } as never);
    prisma.order.findUnique.mockResolvedValue(null);

    const out = await service.patchForEntry(ALL, 'be1', 'r1', {
      amount: 50,
      reason: 'rebalance per CEO',
    });

    expect(out.releaseType).toBe('CORRECTION');
    expect(prisma.bonusRelease.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'r1' },
        data: expect.objectContaining({
          releaseType: 'CORRECTION',
          reason: 'rebalance per CEO',
          approvedById: 'emp1',
        }),
      }),
    );
  });

  it.each(['PAID', 'INCLUDED_IN_PAYROLL', 'CANCELLED'] as const)(
    'createForEntry rejects %s status before create',
    async (status) => {
      prisma.bonusEntry.findUnique.mockResolvedValue(sampleEntry);
      await expect(
        service.createForEntry(ALL, 'be1', {
          amount: 10,
          releaseType: 'MANUAL',
          status,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.bonusRelease.create).not.toHaveBeenCalled();
    },
  );

  it('createForEntry still inserts nothing when PAID is sent twice', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue(sampleEntry);
    const paid = {
      amount: 10,
      releaseType: 'MANUAL' as const,
      status: 'PAID' as const,
    };
    await expect(service.createForEntry(ALL, 'be1', paid)).rejects.toThrow(BadRequestException);
    await expect(service.createForEntry(ALL, 'be1', paid)).rejects.toThrow(BadRequestException);
    expect(prisma.bonusRelease.create).not.toHaveBeenCalled();
  });

  it('createForEntry keeps missing status as APPROVED', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue(sampleEntry);
    prisma.bonusRelease.aggregate
      .mockResolvedValueOnce({ _sum: { amount: null } })
      .mockResolvedValueOnce({ _sum: { amount: new Decimal(10) } });
    prisma.bonusRelease.create.mockResolvedValue({ id: 'rel-approved' });
    prisma.order.findUnique.mockResolvedValue({
      id: 'o1',
      projectId: 'p1',
      productId: 'prod1',
      extensionId: null,
    });
    prisma.bonusEntry.aggregate
      .mockResolvedValueOnce({ _sum: { amount: new Decimal(100) } })
      .mockResolvedValueOnce({ _sum: { amount: new Decimal(0) } });
    prisma.productBonusPool.upsert.mockResolvedValue({});

    await service.createForEntry(ALL, 'be1', { amount: 10, releaseType: 'MANUAL' });

    expect(prisma.bonusRelease.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'APPROVED' }),
      }),
    );
  });

  it('createForEntry accepts DRAFT status', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue(sampleEntry);
    prisma.bonusRelease.create.mockResolvedValue({ id: 'rel-draft' });
    prisma.order.findUnique.mockResolvedValue(null);

    await service.createForEntry(ALL, 'be1', {
      amount: 10,
      releaseType: 'MANUAL',
      status: 'DRAFT',
    });

    expect(prisma.bonusRelease.aggregate).not.toHaveBeenCalled();
    expect(prisma.bonusRelease.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'DRAFT' }),
      }),
    );
  });
});
