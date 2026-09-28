import { describe, expect, it, vi } from 'vitest';

import { bufferWalletNotifications } from './wallet-notify-buffer';

describe('bufferWalletNotifications', () => {
  it('sends queued notices only when flushed after commit', async () => {
    const buffered = bufferWalletNotifications();
    const target = { create: vi.fn().mockResolvedValue(undefined) };

    await buffered.sink.create({
      type: 'bonus_paid',
      recipientId: 'e1',
      title: 'Bonus payout recorded',
      body: 'queued',
    });
    expect(target.create).not.toHaveBeenCalled();

    await buffered.flush(target);
    expect(target.create).toHaveBeenCalledTimes(1);
  });

  it('does not send when the caller skips flush after a rollback', async () => {
    const buffered = bufferWalletNotifications();
    const target = { create: vi.fn().mockResolvedValue(undefined) };
    await buffered.sink.create({
      type: 'bonus_paid',
      recipientId: 'e1',
      title: 'Bonus payout recorded',
      body: 'queued',
    });

    expect(target.create).not.toHaveBeenCalled();
  });
});
