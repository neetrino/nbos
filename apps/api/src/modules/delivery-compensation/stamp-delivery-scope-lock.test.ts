import { describe, expect, it, vi } from 'vitest';
import {
  stampDeliveryScopeLockForExtension,
  stampDeliveryScopeLockForProduct,
} from './stamp-delivery-scope-lock';

function db(count: number) {
  return {
    deliveryConfiguration: { updateMany: vi.fn().mockResolvedValue({ count }) },
  };
}

describe('stampDeliveryScopeLockForProduct', () => {
  it('stamps only a configuration that was never closed before', async () => {
    const client = db(1);

    await expect(stampDeliveryScopeLockForProduct(client as never, 'prod-1')).resolves.toBe(1);
    expect(client.deliveryConfiguration.updateMany).toHaveBeenCalledWith({
      where: { productId: 'prod-1', scopeLockedAt: null },
      data: { scopeLockedAt: expect.any(Date) },
    });
  });

  it('is a no-op on a legacy card with no configuration', async () => {
    await expect(stampDeliveryScopeLockForProduct(db(0) as never, 'prod-legacy')).resolves.toBe(0);
  });
});

describe('stampDeliveryScopeLockForExtension', () => {
  it('never re-dates a freeze that already happened', async () => {
    const client = db(0);

    await expect(stampDeliveryScopeLockForExtension(client as never, 'ext-1')).resolves.toBe(0);
    expect(client.deliveryConfiguration.updateMany).toHaveBeenCalledWith({
      where: { extensionId: 'ext-1', scopeLockedAt: null },
      data: { scopeLockedAt: expect.any(Date) },
    });
  });
});
