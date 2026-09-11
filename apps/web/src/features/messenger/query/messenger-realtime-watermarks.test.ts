import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MESSENGER_READ_WATERMARK_MAX_PER_ZONE } from './messenger-query-policy';
import { advanceReadWatermark, getReadWatermark } from './messenger-realtime-watermarks';

const TANSTACK_DEFAULT_GC_TIME_MS = 5 * 60 * 1000;
const STAMP = '2026-09-05T12:00:00.000Z';
const UNUSED_QUERY_KEY = ['unused-observerless-query'] as const;

function createClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: TANSTACK_DEFAULT_GC_TIME_MS },
    },
  });
}

describe('read watermark session lifetime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps a watermark after unused-query gcTime elapses', async () => {
    const queryClient = createClient();
    queryClient.setQueryData(UNUSED_QUERY_KEY, { stale: true });
    expect(advanceReadWatermark(queryClient, 'INTERNAL', 'c1', STAMP)).toBe(true);
    expect(
      queryClient.getQueryCache().find({ queryKey: UNUSED_QUERY_KEY, exact: true }),
    ).toBeDefined();

    await vi.advanceTimersByTimeAsync(TANSTACK_DEFAULT_GC_TIME_MS + 1);

    expect(
      queryClient.getQueryCache().find({ queryKey: UNUSED_QUERY_KEY, exact: true }),
    ).toBeUndefined();
    expect(queryClient.getQueryData(UNUSED_QUERY_KEY)).toBeUndefined();
    expect(getReadWatermark(queryClient, 'INTERNAL', 'c1')).toBe(STAMP);
  });

  it('evicts the oldest per-zone entry and retains the newest at the cap', () => {
    const queryClient = createClient();
    const lastKept = `c${MESSENGER_READ_WATERMARK_MAX_PER_ZONE - 1}`;
    for (let index = 0; index < MESSENGER_READ_WATERMARK_MAX_PER_ZONE; index += 1) {
      advanceReadWatermark(queryClient, 'INTERNAL', `c${index}`, STAMP);
    }
    advanceReadWatermark(queryClient, 'INTERNAL', 'newest', STAMP);
    expect(getReadWatermark(queryClient, 'INTERNAL', 'c0')).toBeNull();
    expect(getReadWatermark(queryClient, 'INTERNAL', 'c1')).toBe(STAMP);
    expect(getReadWatermark(queryClient, 'INTERNAL', lastKept)).toBe(STAMP);
    expect(getReadWatermark(queryClient, 'INTERNAL', 'newest')).toBe(STAMP);
    expect(getReadWatermark(queryClient, 'CLIENT', 'c0')).toBeNull();
  });
});
