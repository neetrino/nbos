import { describe, expect, it, vi } from 'vitest';
import { SalePricesService } from './sale-prices.service';

const NOW = '2026-10-01T00:00:00.000Z';

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sp-1',
    targetKey: 'FUNCTION:fn-1',
    version: 1,
    status: 'DRAFT',
    effectiveFrom: new Date(NOW),
    multiplier: { toString: () => '10.0000' },
    fixedAmount: null,
    currency: 'AMD',
    ...overrides,
  };
}

function buildPrisma(overrides: Record<string, unknown> = {}) {
  return {
    deliverySalePriceVersion: {
      findMany: vi.fn().mockResolvedValue([row()]),
      findFirst: vi.fn().mockResolvedValue({ version: 2 }),
      findUnique: vi.fn().mockResolvedValue(row()),
      create: vi.fn().mockResolvedValue(row({ version: 3 })),
      update: vi.fn().mockResolvedValue(row({ status: 'PUBLISHED' })),
      updateMany: vi.fn(),
    },
    deliveryFunction: { count: vi.fn().mockResolvedValue(1) },
    deliveryFunctionTier: { count: vi.fn().mockResolvedValue(1) },
    deliveryBaseProfileVersion: { count: vi.fn().mockResolvedValue(1) },
    deliveryCompensationRuntimeSetting: {
      findUnique: vi.fn().mockResolvedValue({ defaultSaleMultiplier: { toString: () => '10' } }),
      upsert: vi.fn().mockResolvedValue({ defaultSaleMultiplier: { toString: () => '12' } }),
    },
    $transaction: vi.fn(async (fn: (client: unknown) => Promise<unknown>) => fn(buildTx())),
    ...overrides,
  };
}

function buildTx() {
  return {
    deliverySalePriceVersion: {
      updateMany: vi.fn(),
      update: vi.fn().mockResolvedValue(row({ status: 'PUBLISHED' })),
    },
  };
}

describe('SalePricesService', () => {
  it('numbers a new draft after the latest version of the same item', async () => {
    const prisma = buildPrisma();
    const service = new SalePricesService(prisma as never);

    await service.createDraft(
      { kind: 'FUNCTION', functionId: 'fn-1' },
      { multiplier: '12', effectiveFrom: NOW },
    );

    expect(prisma.deliverySalePriceVersion.create.mock.calls[0]?.[0].data).toMatchObject({
      targetKey: 'FUNCTION:fn-1',
      version: 3,
      status: 'DRAFT',
      multiplier: '12.0000',
      fixedAmount: null,
    });
  });

  it('prices a gradation without touching the function it belongs to', async () => {
    const prisma = buildPrisma();
    const service = new SalePricesService(prisma as never);

    await service.createDraft(
      { kind: 'TIER', tierId: 'tier-1' },
      { fixedAmount: 400000, effectiveFrom: NOW },
    );

    expect(prisma.deliverySalePriceVersion.create.mock.calls[0]?.[0].data).toMatchObject({
      targetKey: 'TIER:tier-1',
      tierId: 'tier-1',
      functionId: null,
      fixedAmount: '400000.00',
    });
  });

  it('refuses a price for an item that does not exist', async () => {
    const prisma = buildPrisma({ deliveryFunction: { count: vi.fn().mockResolvedValue(0) } });
    const service = new SalePricesService(prisma as never);

    await expect(
      service.createDraft(
        { kind: 'FUNCTION', functionId: 'gone' },
        { multiplier: '10', effectiveFrom: NOW },
      ),
    ).rejects.toThrow(/does not exist/);
  });

  it('publishes a draft and archives the previously published price of the same item', async () => {
    const prisma = buildPrisma();
    const service = new SalePricesService(prisma as never);

    await expect(service.publish('sp-1', 'emp-1')).resolves.toMatchObject({ status: 'PUBLISHED' });
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('refuses to publish anything but a draft', async () => {
    const prisma = buildPrisma({
      deliverySalePriceVersion: {
        ...buildPrisma().deliverySalePriceVersion,
        findUnique: vi.fn().mockResolvedValue(row({ status: 'PUBLISHED' })),
      },
    });
    const service = new SalePricesService(prisma as never);

    await expect(service.publish('sp-1', 'emp-1')).rejects.toThrow(/draft sale price/);
  });

  it('falls back to the agreed tenfold multiplier when no setting exists', async () => {
    const prisma = buildPrisma({
      deliveryCompensationRuntimeSetting: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn(),
      },
    });
    const service = new SalePricesService(prisma as never);

    await expect(service.defaultMultiplier()).resolves.toBe('10');
  });

  it('rejects a default multiplier of zero', async () => {
    const service = new SalePricesService(buildPrisma() as never);

    await expect(service.setDefaultMultiplier('0')).rejects.toThrow(/greater than zero/);
  });
});
