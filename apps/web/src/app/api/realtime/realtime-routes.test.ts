import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/bff-proxy', () => ({
  proxyToBackend: vi.fn(),
}));

import { proxyToBackend } from '@/lib/bff-proxy';
import { GET as getCalls } from './calls/route';
import { GET as getNotifications } from './notifications/route';

describe('realtime SSE routes', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['calls', getCalls, ['realtime', 'calls']],
    ['notifications', getNotifications, ['realtime', 'notifications']],
  ] as const)('uses the refresh-capable BFF for %s', async (_name, handler, path) => {
    const request = new NextRequest(`http://localhost:3000/api/realtime/${path[1]}`);
    const expected = new NextResponse('event: ready\ndata: {}\n\n', {
      headers: { 'Content-Type': 'text/event-stream' },
    });
    vi.mocked(proxyToBackend).mockResolvedValue(expected);

    const response = await handler(request);

    expect(proxyToBackend).toHaveBeenCalledWith(request, [...path]);
    expect(response).toBe(expected);
  });
});
