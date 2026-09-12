import { describe, expect, it, vi } from 'vitest';
import { subscribeYerevanDeskClock, type DeskClockHost } from './desk-line-clock';

describe('subscribeYerevanDeskClock', () => {
  it('clears listeners and the midnight timer', () => {
    const tick = vi.fn();
    const delays: number[] = [];
    const host: DeskClockHost = {
      setTimeout: vi.fn((handler: () => void, delay: number) => {
        delays.push(delay);
        return 7;
      }),
      clearTimeout: vi.fn(),
      addWindowListener: vi.fn(),
      removeWindowListener: vi.fn(),
      addDocumentListener: vi.fn(),
      removeDocumentListener: vi.fn(),
      isDocumentVisible: () => true,
    };
    const stop = subscribeYerevanDeskClock(tick, host, () => new Date('2026-09-16T06:00:00.000Z'));
    expect(host.addWindowListener).toHaveBeenCalledWith('focus', tick);
    expect(delays[0]).toBe(50_400_000);
    stop();
    expect(host.removeWindowListener).toHaveBeenCalledWith('focus', tick);
    expect(host.clearTimeout).toHaveBeenCalledWith(7);
  });
});
