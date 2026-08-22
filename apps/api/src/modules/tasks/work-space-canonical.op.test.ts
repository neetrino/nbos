import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import {
  findProductWorkSpace,
  listDiscoverableWorkSpaces,
  resolveCanonicalWorkSpace,
} from './work-space-canonical.op';

describe('resolveCanonicalWorkSpace', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it('returns a Product Work Space unchanged', async () => {
    prisma.workSpace.findUnique.mockResolvedValue({
      id: 'ws-product',
      name: 'Product',
      type: 'PRODUCT_DELIVERY',
      projectId: 'proj-1',
      productId: 'prod-1',
      extensionId: null,
      scrumEnabled: true,
    });

    const resolved = await resolveCanonicalWorkSpace(prisma as never, 'ws-product');

    expect(resolved?.id).toBe('ws-product');
    expect(prisma.workSpace.findFirst).not.toHaveBeenCalled();
  });

  it('resolves Extension delivery via extensionId → Extension.productId → Product Work Space', async () => {
    prisma.workSpace.findUnique.mockResolvedValue({
      id: 'ws-ext',
      name: 'Extension shell',
      type: 'EXTENSION_DELIVERY',
      projectId: 'proj-1',
      productId: null,
      extensionId: 'ext-1',
      scrumEnabled: false,
    });
    prisma.extension.findUnique.mockResolvedValue({ productId: 'prod-1' });
    prisma.workSpace.findFirst.mockResolvedValue({
      id: 'ws-product',
      name: 'Product',
      type: 'PRODUCT_DELIVERY',
      projectId: 'proj-1',
      productId: 'prod-1',
      extensionId: null,
      scrumEnabled: true,
    });

    const resolved = await resolveCanonicalWorkSpace(prisma as never, 'ws-ext');

    expect(resolved?.id).toBe('ws-product');
    expect(prisma.extension.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'ext-1' } }),
    );
    expect(prisma.workSpace.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productId: 'prod-1', type: { not: 'EXTENSION_DELIVERY' } },
      }),
    );
  });

  it('lists discoverable workspaces without Extension delivery shells', async () => {
    prisma.workSpace.findMany.mockResolvedValue([]);
    await listDiscoverableWorkSpaces(prisma as never, { projectId: 'proj-1' });
    expect(prisma.workSpace.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: { not: 'EXTENSION_DELIVERY' },
          projectId: 'proj-1',
        }),
      }),
    );
  });

  it('finds a product workspace excluding Extension delivery', async () => {
    prisma.workSpace.findFirst.mockResolvedValue(null);
    await findProductWorkSpace(prisma as never, 'prod-1');
    expect(prisma.workSpace.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productId: 'prod-1', type: { not: 'EXTENSION_DELIVERY' } },
      }),
    );
  });

  it('does not treat an orphan Extension delivery row as a Product Work Space', async () => {
    prisma.workSpace.findUnique.mockResolvedValue({
      id: 'ws-ext',
      name: 'Orphan extension',
      type: 'EXTENSION_DELIVERY',
      projectId: 'proj-1',
      productId: null,
      extensionId: 'ext-1',
      scrumEnabled: false,
    });
    prisma.extension.findUnique.mockResolvedValue(null);
    await expect(resolveCanonicalWorkSpace(prisma as never, 'ws-ext')).resolves.toBeNull();
  });
});
