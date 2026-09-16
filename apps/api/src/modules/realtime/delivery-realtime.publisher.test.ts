import { describe, expect, it, vi } from 'vitest';
import { DeliveryRealtimePublisher } from './delivery-realtime.publisher';

describe('DeliveryRealtimePublisher', () => {
  it('swallows bus failures and does not propagate them', async () => {
    const publish = vi.fn().mockRejectedValue(new Error('redis down'));
    const publisher = new DeliveryRealtimePublisher({ publish } as never);

    await expect(publisher.publishItemChanged('product', 'p-1')).resolves.toBeUndefined();
    expect(publish).toHaveBeenCalledTimes(1);
  });
});
