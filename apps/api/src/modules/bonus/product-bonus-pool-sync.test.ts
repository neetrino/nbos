import { beforeEach, describe, expect, it } from 'vitest';
import { Decimal } from '@nbos/database';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { syncProductBonusPoolForOrder } from './product-bonus-pool-sync';

const DONE_ORDER = {
  id: 'ord1',
  projectId: 'proj1',
  productId: 'prod1',
  extensionId: null,
  product: { status: 'DONE' },
  extension: null,
};

function mockPlannedReleasedPaid(
  prisma: MockPrisma,
  planned: string,
  released: string,
  paid = '0',
): void {
  prisma.bonusEntry.aggregate
    .mockResolvedValueOnce({ _sum: { amount: new Decimal(planned) } })
    .mockResolvedValueOnce({ _sum: { amount: new Decimal(paid) } });
  prisma.bonusRelease.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(released) } });
}

describe('syncProductBonusPoolForOrder delivery funding recalc', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.order.findUnique.mockResolvedValue(DONE_ORDER);
    prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(0) } });
    prisma.productBonusPool.upsert.mockResolvedValue({});
    prisma.bonusEntry.findMany.mockImplementation(
      (args: { where?: { type?: { in?: string[] } } }) => {
        if (args.where?.type?.in) {
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      },
    );
  });

  it('skips AUTO releases when product is not Done', async () => {
    prisma.order.findUnique.mockResolvedValue({
      ...DONE_ORDER,
      product: { status: 'TRANSFER' },
    });
    mockPlannedReleasedPaid(prisma, '200', '0');
    prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(500) } });

    await syncProductBonusPoolForOrder(prisma as never, 'ord1');

    expect(prisma.bonusRelease.create).not.toHaveBeenCalled();
    expect(prisma.productBonusPool.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          availableFunding: expect.any(Decimal),
        }),
      }),
    );
  });

  it('creates proportional AUTO releases when Done and client money funds the pool', async () => {
    mockPlannedReleasedPaid(prisma, '100', '0');
    prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(100) } });
    prisma.bonusEntry.findMany.mockImplementation(
      (args: { where?: { type?: { in?: string[] } } }) => {
        if (args.where?.type?.in) {
          return Promise.resolve([
            { id: 'be1', employeeId: 'e1', projectId: 'proj1', amount: new Decimal(30) },
            { id: 'be2', employeeId: 'e2', projectId: 'proj1', amount: new Decimal(70) },
          ]);
        }
        return Promise.resolve([{ id: 'be1' }, { id: 'be2' }]);
      },
    );
    prisma.bonusRelease.groupBy.mockResolvedValue([]);
    prisma.$transaction.mockImplementation(async (arg: unknown) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return undefined;
    });
    prisma.bonusRelease.create.mockResolvedValue({ id: 'rel1' });
    prisma.bonusRelease.aggregate
      .mockResolvedValueOnce({ _sum: { amount: new Decimal(0) } })
      .mockResolvedValueOnce({ _sum: { amount: new Decimal(100) } });
    prisma.bonusEntry.findUnique.mockResolvedValue({
      id: 'be1',
      status: 'INCOMING',
      amount: new Decimal(30),
      employeeId: 'e1',
      order: { code: 'O-1' },
    });

    await syncProductBonusPoolForOrder(prisma as never, 'ord1');

    expect(prisma.bonusRelease.create).toHaveBeenCalled();
    expect(prisma.productBonusPool.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          totalReleasedAmount: expect.objectContaining({ toString: expect.any(Function) }),
        }),
      }),
    );
  });

  it('allocates another slice when client payments increase after a partial release', async () => {
    mockPlannedReleasedPaid(prisma, '200', '50');
    prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(150) } });
    prisma.bonusEntry.findMany.mockImplementation(
      (args: { where?: { type?: { in?: string[] } } }) => {
        if (args.where?.type?.in) {
          return Promise.resolve([
            { id: 'be1', employeeId: 'e1', projectId: 'proj1', amount: new Decimal(200) },
          ]);
        }
        return Promise.resolve([{ id: 'be1' }]);
      },
    );
    prisma.bonusRelease.groupBy.mockResolvedValue([
      { bonusEntryId: 'be1', _sum: { amount: new Decimal(50) } },
    ]);
    prisma.$transaction.mockImplementation(async (arg: unknown) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return undefined;
    });
    prisma.bonusRelease.create.mockResolvedValue({ id: 'rel2' });
    prisma.bonusRelease.aggregate
      .mockResolvedValueOnce({ _sum: { amount: new Decimal(50) } })
      .mockResolvedValueOnce({ _sum: { amount: new Decimal(150) } });
    prisma.bonusEntry.findUnique.mockResolvedValue({
      id: 'be1',
      status: 'INCOMING',
      amount: new Decimal(200),
      employeeId: 'e1',
      order: { code: 'O-1' },
    });

    await syncProductBonusPoolForOrder(prisma as never, 'ord1');

    expect(prisma.bonusRelease.create).toHaveBeenCalled();
    const createArg = prisma.bonusRelease.create.mock.calls[0]?.[0] as {
      data: { amount: Decimal };
    };
    expect(createArg.data.amount.lte(new Decimal(100))).toBe(true);
  });
});
