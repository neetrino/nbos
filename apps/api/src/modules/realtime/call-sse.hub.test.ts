import { describe, expect, it, vi } from 'vitest';
import type { Response } from 'express';
import { CallRealtimeEventBus } from './call-realtime-event-bus';
import { CALL_SSE_EVENT } from './call-realtime.constants';
import { CallSseHub } from './call-sse.hub';
import type { ActiveCallBusMessage } from './call-realtime.types';

function startedMessage(employeeId: string): ActiveCallBusMessage {
  return {
    event: CALL_SSE_EVENT.STARTED,
    payload: {
      employeeId,
      type: CALL_SSE_EVENT.STARTED,
      callId: 'call-1',
      uid: 'uid-1',
      direction: 'INBOUND',
      phase: 'ringing',
      phone: '+37499111111',
      displayName: 'John Smith',
    },
  };
}

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

describe('CallSseHub', () => {
  it('delivers call.started only to the matching employee', () => {
    const bus = new CallRealtimeEventBus();
    const hub = new CallSseHub(bus);
    hub.onModuleInit();

    const a = mockRes();
    const b = mockRes();
    hub.attach('emp-a', a.res);
    hub.attach('emp-b', b.res);

    hub.deliverForTest(startedMessage('emp-a'));

    const aJoined = a.chunks.join('');
    const bJoined = b.chunks.join('');
    expect(aJoined).toContain('call.started');
    expect(aJoined).toContain('"callId":"call-1"');
    expect(aJoined).not.toContain('emp-a');
    expect(bJoined).not.toContain('call.started');

    hub.onModuleDestroy();
  });
});

describe('CallRealtimeEventBus (local)', () => {
  it('dispatches to local subscribers when Redis is unset', async () => {
    const prev = process.env.REDIS_URL;
    const prevEvents = process.env.REDIS_EVENTS_URL;
    delete process.env.REDIS_URL;
    delete process.env.REDIS_EVENTS_URL;

    const bus = new CallRealtimeEventBus();
    bus.onModuleInit();
    const received: ActiveCallBusMessage[] = [];
    bus.subscribe((msg) => received.push(msg));

    await bus.publish(startedMessage('e1'));

    expect(received).toHaveLength(1);
    expect(received[0]?.payload.employeeId).toBe('e1');
    await bus.onModuleDestroy();

    if (prev) process.env.REDIS_URL = prev;
    if (prevEvents) process.env.REDIS_EVENTS_URL = prevEvents;
  });
});
