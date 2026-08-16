import { describe, expect, it, vi } from 'vitest';
import { NotificationRefetchRegistry } from './notification-refetch-registry';

describe('NotificationRefetchRegistry', () => {
  it('dedupes in-flight handlers for the same key', async () => {
    const registry = new NotificationRefetchRegistry();
    let runs = 0;
    registry.register('notifications/unread', async () => {
      runs += 1;
      await new Promise((r) => setTimeout(r, 30));
    });

    registry.request(['notifications/unread'], true);
    registry.request(['notifications/unread'], true);
    await new Promise((r) => setTimeout(r, 50));
    expect(runs).toBe(1);
  });

  it('debounces rapid requests into a single run', async () => {
    vi.useFakeTimers();
    const registry = new NotificationRefetchRegistry();
    let runs = 0;
    registry.register('notifications/list', () => {
      runs += 1;
    });

    registry.request(['notifications/list']);
    registry.request(['notifications/list']);
    registry.request(['notifications/list']);
    expect(runs).toBe(0);
    await vi.advanceTimersByTimeAsync(250);
    expect(runs).toBe(1);
    vi.useRealTimers();
  });
});
