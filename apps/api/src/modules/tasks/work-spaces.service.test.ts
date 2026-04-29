import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, beforeEach } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { WorkSpacesService } from './work-spaces.service';

describe('WorkSpacesService', () => {
  let prisma: MockPrisma;
  let service: WorkSpacesService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new WorkSpacesService(prisma as never);
  });

  it('lists Work Spaces by connected context', async () => {
    await service.findAll({ projectId: 'proj-1', type: 'PRODUCT_DELIVERY' });

    expect(prisma.workSpace.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          projectId: 'proj-1',
          type: 'PRODUCT_DELIVERY',
        }),
      }),
    );
  });

  it('creates standalone operational Work Space', async () => {
    prisma.workSpace.create.mockResolvedValue({ id: 'ws-1', type: 'STANDALONE_OPERATIONAL' });

    const result = await service.create({
      name: 'Internal Ops',
      type: 'STANDALONE_OPERATIONAL',
    });

    expect(result.type).toBe('STANDALONE_OPERATIONAL');
    expect(prisma.workSpace.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Internal Ops' }),
      }),
    );
  });

  it('rejects Product Work Space without productId', async () => {
    await expect(
      service.create({ name: 'Missing Product', type: 'PRODUCT_DELIVERY' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('ensures connected Product Work Space', async () => {
    prisma.product.findUnique.mockResolvedValue({
      id: 'prod-1',
      projectId: 'proj-1',
      name: 'Website',
    });
    prisma.workSpace.create.mockResolvedValue({ id: 'ws-1', productId: 'prod-1' });

    const result = await service.ensureForProduct('prod-1');

    expect(result.productId).toBe('prod-1');
    expect(prisma.workSpace.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: 'proj-1',
          productId: 'prod-1',
          type: 'PRODUCT_DELIVERY',
          scrumEnabled: true,
        }),
      }),
    );
  });

  it('throws when ensuring missing Product Work Space', async () => {
    await expect(service.ensureForProduct('missing')).rejects.toThrow(NotFoundException);
  });

  it('ensures connected Extension Work Space', async () => {
    prisma.extension.findUnique.mockResolvedValue({
      id: 'ext-1',
      projectId: 'proj-1',
      name: 'Checkout update',
    });
    prisma.workSpace.create.mockResolvedValue({ id: 'ws-1', extensionId: 'ext-1' });

    const result = await service.ensureForExtension('ext-1');

    expect(result.extensionId).toBe('ext-1');
    expect(prisma.workSpace.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: 'proj-1',
          extensionId: 'ext-1',
          type: 'EXTENSION_DELIVERY',
        }),
      }),
    );
  });
});
