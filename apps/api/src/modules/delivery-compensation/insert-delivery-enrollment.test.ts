import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { insertDeliveryEnrollment } from './insert-delivery-enrollment';

function uniqueViolation() {
  return Object.assign(new Error('unique'), { code: 'P2002' });
}

describe('insertDeliveryEnrollment', () => {
  it('creates a V2 row for a product and returns its id', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'cfg-1' });
    const db = { deliveryConfiguration: { create, findFirst: vi.fn() } };

    await expect(
      insertDeliveryEnrollment(db as never, { productId: 'prod-1' }, 'order-1'),
    ).resolves.toBe('cfg-1');
    expect(create).toHaveBeenCalledWith({
      data: { orderId: 'order-1', productId: 'prod-1', entityKind: 'PRODUCT', mode: 'V2' },
      select: { id: true },
    });
  });

  it('marks an extension row as such', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'cfg-2' });
    const db = { deliveryConfiguration: { create, findFirst: vi.fn() } };

    await insertDeliveryEnrollment(db as never, { extensionId: 'ext-1' }, 'order-2');

    expect(create).toHaveBeenCalledWith({
      data: { orderId: 'order-2', extensionId: 'ext-1', entityKind: 'EXTENSION', mode: 'V2' },
      select: { id: true },
    });
  });

  it('resolves to the row the concurrent winner created', async () => {
    const db = {
      deliveryConfiguration: {
        create: vi.fn().mockRejectedValue(uniqueViolation()),
        findFirst: vi.fn().mockResolvedValue({ id: 'cfg-winner' }),
      },
    };

    await expect(
      insertDeliveryEnrollment(db as never, { productId: 'prod-1' }, 'order-1'),
    ).resolves.toBe('cfg-winner');
  });

  it('reports a conflict when the clash came from another row entirely', async () => {
    const db = {
      deliveryConfiguration: {
        create: vi.fn().mockRejectedValue(uniqueViolation()),
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };

    await expect(
      insertDeliveryEnrollment(db as never, { productId: 'prod-1' }, 'order-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not swallow an unrelated database error', async () => {
    const db = {
      deliveryConfiguration: {
        create: vi.fn().mockRejectedValue(new Error('connection lost')),
        findFirst: vi.fn(),
      },
    };

    await expect(
      insertDeliveryEnrollment(db as never, { productId: 'prod-1' }, 'order-1'),
    ).rejects.toThrow('connection lost');
  });
});
