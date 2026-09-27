import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { SalesBonusPolicyService } from './sales-bonus-policy.service';

const ACTOR = {
  id: 'emp-fin',
  permissions: {
    FINANCE_BONUSES_VIEW: 'ALL',
    FINANCE_BONUSES_EDIT: 'ALL',
  },
  departmentIds: [] as string[],
};

const OPEN_POLICY = {
  id: 'pol-1',
  fromCategory: 'SALES',
  paymentModel: 'CLASSIC',
  sellerPercent: 10,
  assistantPercent: 2,
  effectiveFrom: new Date('2026-02-10T00:00:00.000Z'),
  effectiveTo: null,
  isActive: true,
};

const CLOSED_POLICY = {
  ...OPEN_POLICY,
  id: 'pol-closed',
  sellerPercent: 8,
  assistantPercent: 2,
  effectiveFrom: new Date('2026-03-01T00:00:00.000Z'),
  effectiveTo: new Date('2026-03-01T12:00:00.000Z'),
  isActive: false,
};

describe('SalesBonusPolicyService', () => {
  let prisma: MockPrisma;
  let service: SalesBonusPolicyService;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.salesBonusPolicy.findUnique.mockResolvedValue(OPEN_POLICY);
    prisma.invoice.findMany.mockResolvedValue([{ id: 'inv-historical-unrelated' }]);
    service = new SalesBonusPolicyService(prisma as never);
  });

  it('publishes a new version and does not accrue an unrelated historical paid invoice', async () => {
    await service.update(ACTOR, 'pol-1', { sellerPercent: 12, assistantPercent: 3 });

    expect(prisma.salesBonusPolicy.update).not.toHaveBeenCalled();
    expect(prisma.salesBonusPolicy.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sellerPercent: 12,
          assistantPercent: 3,
          effectiveTo: null,
          isActive: true,
        }),
      }),
    );
    const createdFrom = prisma.salesBonusPolicy.create.mock.calls[0]?.[0]?.data?.effectiveFrom;
    expect(createdFrom).toBeInstanceOf(Date);
    expect(createdFrom.getTime()).not.toBe(OPEN_POLICY.effectiveFrom.getTime());
    expect(prisma.invoice.findMany).not.toHaveBeenCalled();
  });

  it('closes only the targeted open row on deactivation', async () => {
    await service.update(ACTOR, 'pol-1', { isActive: false });

    expect(prisma.salesBonusPolicy.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pol-1' },
        data: expect.objectContaining({ isActive: false }),
      }),
    );
    expect(prisma.salesBonusPolicy.updateMany).not.toHaveBeenCalled();
    expect(prisma.salesBonusPolicy.create).not.toHaveBeenCalled();
  });

  it('does not close a different open version when deactivating a historical id', async () => {
    prisma.salesBonusPolicy.findUnique.mockResolvedValue(CLOSED_POLICY);

    const result = await service.update(ACTOR, 'pol-closed', { isActive: false });

    expect(result).toEqual(CLOSED_POLICY);
    expect(prisma.salesBonusPolicy.update).not.toHaveBeenCalled();
    expect(prisma.salesBonusPolicy.updateMany).not.toHaveBeenCalled();
  });

  it('reactivates by inserting a new open version and leaves the closed window intact', async () => {
    prisma.salesBonusPolicy.findUnique.mockResolvedValue(CLOSED_POLICY);

    await service.update(ACTOR, 'pol-closed', { isActive: true });

    expect(prisma.salesBonusPolicy.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          fromCategory: CLOSED_POLICY.fromCategory,
          paymentModel: CLOSED_POLICY.paymentModel,
          effectiveTo: null,
        },
      }),
    );
    expect(prisma.salesBonusPolicy.update).not.toHaveBeenCalled();
    expect(prisma.salesBonusPolicy.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sellerPercent: CLOSED_POLICY.sellerPercent,
          assistantPercent: CLOSED_POLICY.assistantPercent,
          effectiveTo: null,
          isActive: true,
        }),
      }),
    );
    const createdFrom = prisma.salesBonusPolicy.create.mock.calls[0]?.[0]?.data?.effectiveFrom;
    expect(createdFrom).toBeInstanceOf(Date);
    expect(createdFrom.getTime()).not.toBe(CLOSED_POLICY.effectiveFrom.getTime());
  });

  it('rejects reactivation when another version of the same key is already open', async () => {
    prisma.salesBonusPolicy.findUnique.mockResolvedValue(CLOSED_POLICY);
    prisma.salesBonusPolicy.findFirst.mockResolvedValue({ id: 'pol-v2-open' });

    await expect(service.update(ACTOR, 'pol-closed', { isActive: true })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.salesBonusPolicy.create).not.toHaveBeenCalled();
    expect(prisma.salesBonusPolicy.update).not.toHaveBeenCalled();
    expect(prisma.salesBonusPolicy.updateMany).not.toHaveBeenCalled();
  });

  it('rejects an out-of-range percent', async () => {
    await expect(service.update(ACTOR, 'pol-1', { sellerPercent: 120 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.salesBonusPolicy.create).not.toHaveBeenCalled();
  });
});
