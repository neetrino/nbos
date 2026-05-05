import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { BonusReleaseService } from './bonus-release.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

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

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.bonusEntry.findMany.mockResolvedValue([]);
    service = new BonusReleaseService(prisma as never);
  });

  it('listForEntry throws when entry missing', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue(null);
    await expect(service.listForEntry('missing')).rejects.toThrow(NotFoundException);
  });

  it('listForEntry returns releases', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue({ id: 'be1' });
    prisma.bonusRelease.findMany.mockResolvedValue([{ id: 'r1' }]);
    const rows = await service.listForEntry('be1');
    expect(rows).toEqual([{ id: 'r1' }]);
    expect(prisma.bonusRelease.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { bonusEntryId: 'be1' } }),
    );
  });

  it('createForEntry rejects EARLY without reason', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue(sampleEntry);
    await expect(
      service.createForEntry('be1', { amount: 10, releaseType: 'EARLY' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('createForEntry rejects OVER_FUNDING without approver', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue(sampleEntry);
    await expect(
      service.createForEntry('be1', {
        amount: 10,
        releaseType: 'OVER_FUNDING',
        reason: 'ceo approved',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('createForEntry rejects unknown payroll run', async () => {
    prisma.bonusEntry.findUnique.mockResolvedValue(sampleEntry);
    prisma.payrollRun.findUnique.mockResolvedValue(null);
    await expect(
      service.createForEntry('be1', {
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
      service.createForEntry('be1', {
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

    const created = await service.createForEntry('be1', {
      amount: 10,
      releaseType: 'MANUAL',
    });

    expect(created).toEqual({ id: 'rel1' });
    expect(prisma.bonusRelease.create).toHaveBeenCalled();
    expect(prisma.productBonusPool.upsert).toHaveBeenCalled();
  });
});
