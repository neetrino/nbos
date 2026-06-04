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
    const result = await service.findAll({ projectId: 'proj-1', type: 'PRODUCT_DELIVERY' });

    expect(prisma.workSpace.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({ projectId: 'proj-1', type: { not: 'EXTENSION_DELIVERY' } }),
            { type: 'PRODUCT_DELIVERY' },
          ]),
        }),
        skip: 0,
        take: expect.any(Number),
      }),
    );
    expect(result.meta.page).toBe(1);
    expect(Array.isArray(result.items)).toBe(true);
    expect(prisma.workSpace.count).toHaveBeenCalled();
  });

  it('excludes legacy Extension Work Spaces from default listing', async () => {
    await service.findAll({});

    expect(prisma.workSpace.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: { not: 'EXTENSION_DELIVERY' },
        }),
      }),
    );
  });

  it('maps extension list queries to the parent Product Work Space', async () => {
    prisma.extension.findUnique.mockResolvedValue({ productId: 'prod-1' });

    await service.findAll({ extensionId: 'ext-1' });

    expect(prisma.workSpace.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          productId: 'prod-1',
          type: { not: 'EXTENSION_DELIVERY' },
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

  it('trims standalone Work Space name before create', async () => {
    prisma.workSpace.create.mockResolvedValue({ id: 'ws-1', name: 'Finance Ops' });

    await service.create({
      name: '  Finance Ops  ',
      type: 'STANDALONE_OPERATIONAL',
    });

    expect(prisma.workSpace.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Finance Ops' }),
      }),
    );
  });

  it('rejects blank standalone Work Space name', async () => {
    await expect(service.create({ name: '  ', type: 'STANDALONE_OPERATIONAL' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects standalone Work Space with Product context', async () => {
    await expect(
      service.create({
        name: 'Invalid standalone',
        type: 'STANDALONE_OPERATIONAL',
        productId: 'prod-1',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects invalid Work Space type', async () => {
    await expect(service.create({ name: 'Unknown', type: 'FINANCE' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects manual Extension Work Space creation', async () => {
    await expect(
      service.create({
        name: 'Extension board',
        type: 'EXTENSION_DELIVERY',
        extensionId: 'ext-1',
      }),
    ).rejects.toThrow(BadRequestException);
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

  it('returns existing connected Product Work Space', async () => {
    prisma.workSpace.findUnique.mockResolvedValue({ id: 'ws-existing', productId: 'prod-1' });

    const result = await service.ensureForProduct('prod-1');

    expect(result.id).toBe('ws-existing');
    expect(prisma.product.findUnique).not.toHaveBeenCalled();
    expect(prisma.workSpace.create).not.toHaveBeenCalled();
  });

  it('throws when ensuring missing Product Work Space', async () => {
    await expect(service.ensureForProduct('missing')).rejects.toThrow(NotFoundException);
  });

  it('finds Product Work Space by product id without creating', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'prod-1' });
    prisma.workSpace.findUnique.mockResolvedValue({ id: 'ws-existing', productId: 'prod-1' });

    const result = await service.findByProductId('prod-1');

    expect(result.id).toBe('ws-existing');
    expect(prisma.workSpace.create).not.toHaveBeenCalled();
  });

  it('throws when Product Work Space is missing for product', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'prod-1' });
    prisma.workSpace.findUnique.mockResolvedValue(null);

    await expect(service.findByProductId('prod-1')).rejects.toThrow(NotFoundException);
  });

  it('throws when product is missing for by-product lookup', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(service.findByProductId('missing')).rejects.toThrow(NotFoundException);
  });

  it('ensures an Extension uses its Product Work Space', async () => {
    prisma.extension.findUnique.mockResolvedValue({
      id: 'ext-1',
      productId: 'prod-1',
    });
    prisma.product.findUnique.mockResolvedValue({
      id: 'prod-1',
      projectId: 'proj-1',
      name: 'Website',
    });
    prisma.workSpace.create.mockResolvedValue({ id: 'ws-1', productId: 'prod-1' });

    const result = await service.ensureForExtension('ext-1');

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

  it('returns existing Product Work Space when ensuring an Extension', async () => {
    prisma.extension.findUnique.mockResolvedValue({
      id: 'ext-1',
      productId: 'prod-1',
    });
    prisma.workSpace.findUnique.mockResolvedValue({ id: 'ws-existing', productId: 'prod-1' });

    const result = await service.ensureForExtension('ext-1');

    expect(result.id).toBe('ws-existing');
    expect(prisma.workSpace.create).not.toHaveBeenCalled();
  });

  it('updates metadata only', async () => {
    prisma.workSpace.findUnique.mockResolvedValue({ id: 'ws-1', name: 'Old' });
    prisma.workSpace.update.mockResolvedValue({ id: 'ws-1', name: 'New' });

    const result = await service.update('ws-1', {
      name: ' New ',
      scrumEnabled: true,
      description: 'Updated',
    });

    expect(result.name).toBe('New');
    expect(prisma.workSpace.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: 'New',
          scrumEnabled: true,
          description: 'Updated',
        },
      }),
    );
  });
});
