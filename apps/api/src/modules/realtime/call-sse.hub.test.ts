import { describe, expect, it, vi } from 'vitest';
import { CallRealtimeEventBus } from './call-realtime-event-bus';
import { CALL_SSE_EVENT } from './call-realtime.constants';
import { CallSseHub } from './call-sse.hub';
import type { IncomingCallBusMessage } from './call-realtime.types';
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

function incomingMessage(employeeId: string): IncomingCallBusMessage {
  return {
    event: CALL_SSE_EVENT.INCOMING_CALL,
    payload: {
      employeeId,
      type: 'incoming_call',
      callId: 'call-1',
      direction: 'INBOUND',
      phone: '+37499111111',
      contactName: 'John Smith',
      leadName: 'Website project',
      dealName: 'Corporate website',
      responsibleEmployeeName: 'Edgar',
      leadId: 'lead-1',
      contactId: 'contact-1',
      dealId: 'deal-1',
    },
  };
}

describe('CallSseHub', () => {
  it('delivers incoming_call only to the matching employee', () => {
    const bus = new CallRealtimeEventBus();
    const hub = new CallSseHub(bus);
    hub.onModuleInit();

    const a = mockRes();
    const b = mockRes();
    hub.attach('emp-a', a.res);
    hub.attach('emp-b', b.res);

    hub.deliverForTest(incomingMessage('emp-a'));

    const aJoined = a.chunks.join('');
    const bJoined = b.chunks.join('');
    expect(aJoined).toContain('incoming_call');
    expect(aJoined).toContain('"callId":"call-1"');
    expect(aJoined).not.toContain('emp-a');
    expect(bJoined).not.toContain('incoming_call');

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
    const received: IncomingCallBusMessage[] = [];
    bus.subscribe((msg) => received.push(msg));

    await bus.publish(incomingMessage('e1'));

    expect(received).toHaveLength(1);
    expect(received[0]?.payload.employeeId).toBe('e1');
    await bus.onModuleDestroy();

    if (prev) process.env.REDIS_URL = prev;
    if (prevEvents) process.env.REDIS_EVENTS_URL = prevEvents;
  });
});
