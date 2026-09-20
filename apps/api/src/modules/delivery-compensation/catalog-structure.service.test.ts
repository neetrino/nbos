import { describe, expect, it, vi } from 'vitest';
import { CatalogStructureService } from './catalog-structure.service';

function buildPrisma(overrides: Record<string, unknown> = {}) {
  const tx = {
    deliveryBaseProfileCoreItem: { deleteMany: vi.fn(), createMany: vi.fn() },
    deliveryConfigSizePreset: { deleteMany: vi.fn(), createMany: vi.fn() },
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
      deliveryConfigSizePreset: {
        findMany: vi.fn().mockResolvedValue([]),
        ...tx.deliveryConfigSizePreset,
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

describe('CatalogStructureService size presets', () => {
  it('replaces one size level of one profile', async () => {
    const { prisma, tx } = buildPrisma();
    const service = new CatalogStructureService(prisma as never);

    const result = await service.replaceSizePreset({
      profileKey: 'SHOP_CODE',
      configSize: 'CLASSIC',
      functionIds: [FUNCTION_A, FUNCTION_B],
    });

    expect(tx.deliveryConfigSizePreset.deleteMany).toHaveBeenCalledWith({
      where: { profileKey: 'SHOP_CODE', configSize: 'CLASSIC' },
    });
    expect(result.functionIds).toEqual([FUNCTION_A, FUNCTION_B]);
  });

  it('refuses a preset that points at a function which does not exist', async () => {
    const { prisma } = buildPrisma({ deliveryFunction: { count: vi.fn().mockResolvedValue(1) } });
    const service = new CatalogStructureService(prisma as never);

    await expect(
      service.replaceSizePreset({
        profileKey: 'SHOP_CODE',
        configSize: 'SMALL',
        functionIds: [FUNCTION_A, FUNCTION_B],
      }),
    ).rejects.toThrow(/does not exist/);
  });

  it('groups stored presets by size', async () => {
    const { prisma } = buildPrisma({
      deliveryConfigSizePreset: {
        findMany: vi.fn().mockResolvedValue([
          { configSize: 'SMALL', functionId: FUNCTION_A },
          { configSize: 'CLASSIC', functionId: FUNCTION_A },
          { configSize: 'CLASSIC', functionId: FUNCTION_B },
        ]),
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
    });
    const service = new CatalogStructureService(prisma as never);

    await expect(service.listSizePresets('SHOP_CODE')).resolves.toEqual([
      { profileKey: 'SHOP_CODE', configSize: 'SMALL', functionIds: [FUNCTION_A] },
      { profileKey: 'SHOP_CODE', configSize: 'CLASSIC', functionIds: [FUNCTION_A, FUNCTION_B] },
    ]);
  });
});
