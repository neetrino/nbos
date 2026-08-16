import { afterEach, describe, expect, it, vi } from 'vitest';
import { TASK_CARD_COMPLETE_FLASH_MS, waitAtLeast } from './task-card-complete-flash';

describe('waitAtLeast', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves immediately when the minimum already elapsed', async () => {
    await expect(
      waitAtLeast(Date.now() - TASK_CARD_COMPLETE_FLASH_MS, TASK_CARD_COMPLETE_FLASH_MS),
    ).resolves.toBeUndefined();
  });

  it('waits the remaining time', async () => {
    vi.useFakeTimers();
    const startedAt = Date.now();
    let settled = false;
    const pending = waitAtLeast(startedAt, TASK_CARD_COMPLETE_FLASH_MS).then(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(TASK_CARD_COMPLETE_FLASH_MS - 1);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(settled).toBe(true);
  });
});
