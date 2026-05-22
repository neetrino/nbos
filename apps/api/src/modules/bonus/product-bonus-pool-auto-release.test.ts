import { describe, it, expect, beforeEach } from 'vitest';
import { Decimal } from '@nbos/database';
import { tryCreateProportionalAutoReleases } from './product-bonus-pool-auto-release';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('tryCreateProportionalAutoReleases', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it('returns false when product is not DONE', async () => {
    const done = await tryCreateProportionalAutoReleases(prisma as never, {
      order: {
        id: 'o1',
        projectId: 'p1',
        productId: 'prod1',
        extensionId: null,
        product: { status: 'TRANSFER' },
        extension: null,
      },
      received: new Decimal(1000),
      released: new Decimal(0),
    });
    expect(done).toBe(false);
    expect(prisma.bonusEntry.findMany).not.toHaveBeenCalled();
  });

  it('creates proportional AUTO releases when funded and DONE', async () => {
    prisma.bonusEntry.findMany.mockResolvedValue([
      { id: 'be1', employeeId: 'e1', projectId: 'p1', amount: new Decimal(30) },
      { id: 'be2', employeeId: 'e2', projectId: 'p1', amount: new Decimal(70) },
    ]);
    prisma.bonusRelease.groupBy.mockResolvedValue([]);
    prisma.$transaction.mockImplementation(async (arg: unknown) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return undefined;
    });
    prisma.bonusRelease.create.mockResolvedValue({ id: 'r1' });

    const done = await tryCreateProportionalAutoReleases(prisma as never, {
      order: {
        id: 'o1',
        projectId: 'p1',
        productId: 'prod1',
        extensionId: null,
        product: { status: 'DONE' },
        extension: null,
      },
      received: new Decimal(100),
      released: new Decimal(0),
    });

    expect(done).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.bonusRelease.create).toHaveBeenCalled();
  });

  it('is idempotent when planned amounts are already fully released', async () => {
    prisma.bonusEntry.findMany.mockResolvedValue([
      { id: 'be1', employeeId: 'e1', projectId: 'p1', amount: new Decimal(50) },
    ]);
    prisma.bonusRelease.groupBy.mockResolvedValue([
      { bonusEntryId: 'be1', _sum: { amount: new Decimal(50) } },
    ]);

    const done = await tryCreateProportionalAutoReleases(prisma as never, {
      order: {
        id: 'o1',
        projectId: 'p1',
        productId: 'prod1',
        extensionId: null,
        product: { status: 'DONE' },
        extension: null,
      },
      received: new Decimal(200),
      released: new Decimal(50),
    });

    expect(done).toBe(false);
    expect(prisma.bonusRelease.create).not.toHaveBeenCalled();
  });
});
