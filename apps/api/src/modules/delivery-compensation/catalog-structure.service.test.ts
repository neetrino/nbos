import { describe, expect, it, vi } from 'vitest';
import { CatalogStructureService } from './catalog-structure.service';

function buildPrisma(overrides: Record<string, unknown> = {}) {
  const coreItems = {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
  };
  const prisma = {
    deliveryBaseProfileVersion: {
      findUnique: vi.fn().mockResolvedValue({ id: 'ver-1', status: 'DRAFT' }),
    },
    deliveryBaseProfileCoreItem: coreItems,
    deliveryFunction: { count: vi.fn().mockResolvedValue(2) },
    ...overrides,
    $transaction: vi.fn(async (fn: (client: typeof prisma) => Promise<unknown>) => fn(prisma)),
  };
  return { tx: prisma, prisma };
}

describe('CatalogStructureService core items', () => {
  it('numbers core items by their order, ignoring anything the client sends', async () => {
    const { prisma, tx } = buildPrisma();
    const service = new CatalogStructureService(prisma as never);

    await service.replaceCoreItems('ver-1', [
      { label: 'Главная', position: 99 },
      { label: 'Каталог' },
    ]);

    expect(tx.deliveryBaseProfileCoreItem.createMany).toHaveBeenCalledWith({
      data: [
        { profileVersionId: 'ver-1', position: 1, label: 'Главная', note: null },
        { profileVersionId: 'ver-1', position: 2, label: 'Каталог', note: null },
      ],
    });
  });

  it('writes a published core onto its open draft and leaves the published list frozen', async () => {
    const create = vi.fn();
    const { prisma, tx } = buildPrisma({
      deliveryBaseProfileVersion: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'ver-1',
          status: 'PUBLISHED',
          productType: 'ECOMMERCE',
        }),
        findFirst: vi.fn().mockResolvedValue({ id: 'draft-1' }),
        create,
      },
    });
    const service = new CatalogStructureService(prisma as never);

    const saved = await service.replaceCoreItems('ver-1', [{ label: 'Главная' }]);

    expect(saved.profileVersionId).toBe('draft-1');
    expect(create).not.toHaveBeenCalled();
    expect(tx.deliveryBaseProfileCoreItem.createMany).toHaveBeenCalledWith({
      data: [{ profileVersionId: 'draft-1', position: 1, label: 'Главная', note: null }],
    });
  });

  it('opens the next version when a published core has no draft', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'ver-2' });
    const priceCreate = vi.fn();
    const { prisma, tx } = buildPrisma({
      deliveryBaseProfileVersion: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'ver-1',
          status: 'PUBLISHED',
          productType: 'ECOMMERCE',
          productCategory: 'CODE',
          profileKey: 'ecommerce',
          version: 1,
          description: null,
          effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
          roleUnits: [{ roleKey: 'PM', unitKind: 'REQUIRED', units: { toString: () => '10' } }],
          includedFunctions: [],
        }),
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'ver-1',
            profileKey: 'ecommerce',
            version: 1,
            status: 'PUBLISHED',
            productCategory: 'CODE',
          },
        ]),
        create,
      },
      deliverySalePriceVersion: {
        findFirst: vi.fn().mockResolvedValue({
          effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
          amountPerUnit: { toString: () => '10000.0000' },
          currency: 'AMD',
          publishedAt: null,
          publishedById: null,
        }),
        create: priceCreate,
      },
    });
    const service = new CatalogStructureService(prisma as never);

    const saved = await service.replaceCoreItems('ver-1', [{ label: 'Главная' }]);

    expect(saved.profileVersionId).toBe('ver-2');
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ profileKey: 'ecommerce', version: 2, status: 'DRAFT' }),
      }),
    );
    expect(priceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          targetKey: 'CORE:ver-2',
          baseProfileVersionId: 'ver-2',
          status: 'PUBLISHED',
        }),
      }),
    );
    expect(tx.deliveryBaseProfileCoreItem.createMany).toHaveBeenCalledWith({
      data: [{ profileVersionId: 'ver-2', position: 1, label: 'Главная', note: null }],
    });
  });

  it('refuses an archived core, which is no longer the live list', async () => {
    const { prisma } = buildPrisma({
      deliveryBaseProfileVersion: {
        findUnique: vi.fn().mockResolvedValue({ id: 'ver-1', status: 'ARCHIVED' }),
      },
    });
    const service = new CatalogStructureService(prisma as never);

    await expect(service.replaceCoreItems('ver-1', [{ label: 'Главная' }])).rejects.toThrow(
      /published core/,
    );
  });

  it('reports a missing base profile version instead of writing orphans', async () => {
    const { prisma } = buildPrisma({
      deliveryBaseProfileVersion: { findUnique: vi.fn().mockResolvedValue(null) },
    });
    const service = new CatalogStructureService(prisma as never);

    await expect(service.listCoreItems('ver-404')).rejects.toThrow(/not found/);
  });
});
