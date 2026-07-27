import { describe, expect, it, vi } from 'vitest';
import { NotificationRealtimeEventBus } from './notification-realtime-event-bus';
import { NOTIFICATION_SSE_EVENT } from './notification-realtime.constants';
import { NotificationSseHub } from './notification-sse.hub';
import type { Response } from 'express';

function mockRes() {
  const chunks: string[] = [];
  const res = {
    writableEnded: false,
    setHeader: vi.fn(),
    flushHeaders: vi.fn(),
    write: (chunk: string) => {
      chunks.push(chunk);
      return true;
    },
    on: vi.fn(),
  };
  return { res: res as unknown as Response, chunks };
}

describe('NotificationSseHub', () => {
  it('delivers unread events only to the matching employee', () => {
    const bus = new NotificationRealtimeEventBus();
    const hub = new NotificationSseHub(bus);
    hub.onModuleInit();

    const a = mockRes();
    const b = mockRes();
    hub.attach('emp-a', a.res);
    hub.attach('emp-b', b.res);

    hub.deliverForTest({
      event: NOTIFICATION_SSE_EVENT.UNREAD_CHANGED,
      payload: {
        schemaVersion: 1,
        employeeId: 'emp-a',
        unreadCount: 3,
        version: 1,
        occurredAt: new Date().toISOString(),
        invalidateList: false,
      },
    });

    const aJoined = a.chunks.join('');
    const bJoined = b.chunks.join('');
    expect(aJoined).toContain('notifications.unread.changed');
    expect(aJoined).toContain('"unreadCount":3');
    expect(bJoined).not.toContain('notifications.unread.changed');

    hub.onModuleDestroy();
  });

  it('clears heartbeat on destroy', () => {
    vi.useFakeTimers();
    const bus = new NotificationRealtimeEventBus();
    const hub = new NotificationSseHub(bus);
    hub.onModuleInit();
    const { res, chunks } = mockRes();
    hub.attach('emp-a', res);
    hub.onModuleDestroy();
    const before = chunks.length;
    vi.advanceTimersByTime(60_000);
    expect(chunks.length).toBe(before);
    vi.useRealTimers();
  });
});

describe('NotificationRealtimeEventBus (local)', () => {
  it('dispatches to local subscribers when Redis is unset', async () => {
    const prev = process.env.REDIS_URL;
    const prevEvents = process.env.REDIS_EVENTS_URL;
    delete process.env.REDIS_URL;
    delete process.env.REDIS_EVENTS_URL;

    const bus = new NotificationRealtimeEventBus();
    bus.onModuleInit();
    const received: unknown[] = [];
    bus.subscribe((msg) => received.push(msg));

    await bus.publish({
      event: NOTIFICATION_SSE_EVENT.UNREAD_CHANGED,
      payload: {
        schemaVersion: 1,
        employeeId: 'e1',
        unreadCount: 1,
        version: 2,
        occurredAt: new Date().toISOString(),
        invalidateList: false,
      },
    });

    expect(received).toHaveLength(1);
    await bus.onModuleDestroy();

    if (prev) process.env.REDIS_URL = prev;
    if (prevEvents) process.env.REDIS_EVENTS_URL = prevEvents;
  });
});
