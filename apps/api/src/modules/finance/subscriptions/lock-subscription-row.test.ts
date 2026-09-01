import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { lockSubscriptionRow } from './lock-subscription-row';

describe('lockSubscriptionRow', () => {
  it('returns when a row is locked', async () => {
    const tx = { $queryRaw: vi.fn().mockResolvedValue([{ id: 'sub-1' }]) };
    await expect(lockSubscriptionRow(tx, 'sub-1')).resolves.toBeUndefined();
    expect(String(tx.$queryRaw.mock.calls[0]?.[0])).toContain('FOR UPDATE');
  });

  it('throws when no subscription row exists', async () => {
    const tx = { $queryRaw: vi.fn().mockResolvedValue([]) };
    await expect(lockSubscriptionRow(tx, 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
