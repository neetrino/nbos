import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { FunctionCollectionsService } from './function-collections.service';

describe('FunctionCollectionsService.remove', () => {
  it('deletes an existing collection', async () => {
    const prisma = {
      deliveryFunctionCollection: {
        findUnique: vi.fn().mockResolvedValue({ id: 'col-1' }),
        delete: vi.fn().mockResolvedValue({ id: 'col-1' }),
      },
    };
    const service = new FunctionCollectionsService(prisma as never);
    await service.remove('col-1');
    expect(prisma.deliveryFunctionCollection.delete).toHaveBeenCalledWith({
      where: { id: 'col-1' },
    });
  });

  it('refuses a missing collection', async () => {
    const prisma = {
      deliveryFunctionCollection: {
        findUnique: vi.fn().mockResolvedValue(null),
        delete: vi.fn(),
      },
    };
    const service = new FunctionCollectionsService(prisma as never);
    await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.deliveryFunctionCollection.delete).not.toHaveBeenCalled();
  });
});
