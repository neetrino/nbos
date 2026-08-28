import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/realtime-session', () => ({
  recoverRealtimeSession: vi.fn(),
}));

import { recoverRealtimeSession } from '@/lib/auth/realtime-session';
import { connectCallSse } from './connect-call-sse';
import { connectNotificationSse } from './connect-notification-sse';

class FakeEventSource {
  static instances: FakeEventSource[] = [];

  onerror: ((event: Event) => void) | null = null;
  readonly close = vi.fn();
  readonly addEventListener = vi.fn();

  constructor(readonly url: string) {
    FakeEventSource.instances.push(this);
  }
}

describe('realtime invalid-session handling', () => {
  afterEach(() => {
    FakeEventSource.instances = [];
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('stops notification SSE reconnect after confirmed invalidity', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('EventSource', FakeEventSource);
    vi.mocked(recoverRealtimeSession).mockResolvedValue({ kind: 'session-invalid' });
    const onStatus = vi.fn();

    connectNotificationSse({
      onStatus,
      onUnreadChanged: vi.fn(),
      onListInvalidate: vi.fn(),
      onOpen: vi.fn(),
    });
    FakeEventSource.instances[0]?.onerror?.(new Event('error'));
    await vi.waitFor(() => expect(onStatus).toHaveBeenLastCalledWith('disconnected'));
    await vi.advanceTimersByTimeAsync(60_000);

    expect(FakeEventSource.instances).toHaveLength(1);
  });

  it('stops call SSE reconnect after confirmed invalidity', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('EventSource', FakeEventSource);
    vi.mocked(recoverRealtimeSession).mockResolvedValue({ kind: 'session-invalid' });
    const onStatus = vi.fn();

    connectCallSse({ onStatus, onCallEvent: vi.fn() });
    FakeEventSource.instances[0]?.onerror?.(new Event('error'));
    await vi.waitFor(() => expect(onStatus).toHaveBeenLastCalledWith('disconnected'));
    await vi.advanceTimersByTimeAsync(60_000);

    expect(FakeEventSource.instances).toHaveLength(1);
  });
});
