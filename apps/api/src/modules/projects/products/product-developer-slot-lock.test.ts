import { describe, expect, it } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { lockProductDeveloperSlots } from './product-developer-slot-lock';

const PRODUCT_ID = 'product-1';

describe('lockProductDeveloperSlots', () => {
  it('locks the product row then returns current developer slot ids', async () => {
    const tx = createMockPrisma();
    tx.$queryRaw.mockResolvedValue([{ id: PRODUCT_ID }]);
    tx.product.findUniqueOrThrow.mockResolvedValue({
      developerId: 'be-1',
      frontendDeveloperId: null,
    });

    await expect(lockProductDeveloperSlots(tx as never, PRODUCT_ID)).resolves.toEqual({
      developerId: 'be-1',
      frontendDeveloperId: null,
    });
    expect(tx.$queryRaw).toHaveBeenCalled();
    const sqlChunks = tx.$queryRaw.mock.calls[0]?.[0] as TemplateStringsArray | undefined;
    expect(String(sqlChunks?.raw ?? sqlChunks)).toContain('FOR UPDATE');
    expect(tx.product.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: PRODUCT_ID },
      select: { developerId: true, frontendDeveloperId: true },
    });
  });

  it('throws when the product row is missing', async () => {
    const tx = createMockPrisma();
    tx.$queryRaw.mockResolvedValue([]);

    await expect(lockProductDeveloperSlots(tx as never, PRODUCT_ID)).rejects.toThrow(
      NotFoundException,
    );
    expect(tx.product.findUniqueOrThrow).not.toHaveBeenCalled();
  });
});
