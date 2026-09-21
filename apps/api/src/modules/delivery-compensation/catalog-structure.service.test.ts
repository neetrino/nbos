import { describe, expect, it, vi } from 'vitest';
import { CatalogStructureService } from './catalog-structure.service';

function buildPrisma(overrides: Record<string, unknown> = {}) {
  const tx = {
    deliveryBaseProfileCoreItem: { deleteMany: vi.fn(), createMany: vi.fn() },
  };
  return {
    tx,
    prisma: {
      deliveryBaseProfileVersion: {
        findUnique: vi.fn().mockResolvedValue({ id: 'ver-1', status: 'DRAFT' }),
      },
      deliveryBaseProfileCoreItem: {
        findMany: vi.fn().mockResolvedValue([]),
        ...tx.deliveryBaseProfileCoreItem,
      },
      deliveryFunction: { count: vi.fn().mockResolvedValue(2) },
      $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
      ...overrides,
    },
  };
}

const FUNCTION_A = '11111111-1111-1111-1111-111111111111';
const FUNCTION_B = '22222222-2222-2222-2222-222222222222';

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

  it('refuses to edit a published core, which is history a client may have seen', async () => {
    const { prisma } = buildPrisma({
      deliveryBaseProfileVersion: {
        findUnique: vi.fn().mockResolvedValue({ id: 'ver-1', status: 'PUBLISHED' }),
      },
    });
    const service = new CatalogStructureService(prisma as never);

    await expect(service.replaceCoreItems('ver-1', [{ label: 'Главная' }])).rejects.toThrow(
      /draft base profile version/,
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
