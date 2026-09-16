import { describe, expect, it, vi } from 'vitest';
import type { Response } from 'express';
import { DeliveryRealtimeEventBus } from './delivery-realtime-event-bus';
import {
  DELIVERY_REALTIME_SCHEMA_VERSION,
  DELIVERY_SSE_EVENT,
} from './delivery-realtime.constants';
import { DeliverySseHub } from './delivery-sse.hub';
import type { DeliveryRealtimeBusMessage } from './delivery-realtime.types';

function itemChangedMessage(
  entityType: 'product' | 'extension' = 'product',
): DeliveryRealtimeBusMessage {
  return {
    event: DELIVERY_SSE_EVENT.ITEM_CHANGED,
    payload: {
      schemaVersion: DELIVERY_REALTIME_SCHEMA_VERSION,
      entityType,
      entityId: 'item-1',
      occurredAt: '2026-09-16T12:00:00.000Z',
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

function parseSseData(chunks: string[]): Record<string, unknown> {
  const line = chunks.find((chunk) => chunk.startsWith('data: '));
  expect(line).toBeTruthy();
  if (typeof line !== 'string') {
    throw new Error('expected SSE data line');
  }
  return JSON.parse(line.slice('data: '.length).trim()) as Record<string, unknown>;
}

describe('DeliverySseHub', () => {
  it('broadcasts delivery.item.changed to every attached connection', () => {
    const bus = new DeliveryRealtimeEventBus();
    const hub = new DeliverySseHub(bus);
    hub.onModuleInit();

    const a = mockRes();
    const b = mockRes();
    hub.attach('emp-a', a.res);
    hub.attach('emp-b', b.res);

    hub.deliverForTest(itemChangedMessage());

    const aJoined = a.chunks.join('');
    const bJoined = b.chunks.join('');
    expect(aJoined).toContain('delivery.item.changed');
    expect(bJoined).toContain('delivery.item.changed');
    expect(aJoined).toContain('"entityId":"item-1"');
    expect(bJoined).toContain('"entityId":"item-1"');

    hub.onModuleDestroy();
  });

  it('writes only the four invalidation payload fields on the wire', () => {
    const bus = new DeliveryRealtimeEventBus();
    const hub = new DeliverySseHub(bus);
    hub.onModuleInit();

    const { res, chunks } = mockRes();
    hub.attach('emp-a', res);
    hub.deliverForTest(itemChangedMessage('extension'));

    const payload = parseSseData(chunks);
    expect(Object.keys(payload).sort()).toEqual([
      'entityId',
      'entityType',
      'occurredAt',
      'schemaVersion',
    ]);
    expect(payload).toEqual({
      schemaVersion: DELIVERY_REALTIME_SCHEMA_VERSION,
      entityType: 'extension',
      entityId: 'item-1',
      occurredAt: '2026-09-16T12:00:00.000Z',
    });

    hub.onModuleDestroy();
  });
});

describe('DeliveryRealtimeEventBus (local)', () => {
  it('dispatches to local subscribers when Redis is unset', async () => {
    const prev = process.env.REDIS_URL;
    const prevEvents = process.env.REDIS_EVENTS_URL;
    delete process.env.REDIS_URL;
    delete process.env.REDIS_EVENTS_URL;

    const bus = new DeliveryRealtimeEventBus();
    bus.onModuleInit();
    const received: DeliveryRealtimeBusMessage[] = [];
    bus.subscribe((msg) => received.push(msg));

    await bus.publish(itemChangedMessage());

    expect(received).toHaveLength(1);
    expect(received[0]?.payload.entityId).toBe('item-1');
    await bus.onModuleDestroy();

    if (prev) process.env.REDIS_URL = prev;
    if (prevEvents) process.env.REDIS_EVENTS_URL = prevEvents;
  });
});
