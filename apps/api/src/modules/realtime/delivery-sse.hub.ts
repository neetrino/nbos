import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type { Response } from 'express';
import { randomUUID } from 'node:crypto';
import { DELIVERY_SSE_HEARTBEAT_MS } from './delivery-realtime.constants';
import {
  DeliveryRealtimeEventBus,
  type DeliveryRealtimeHandler,
} from './delivery-realtime-event-bus';
import type {
  DeliveryItemChangedPayload,
  DeliveryRealtimeBusMessage,
} from './delivery-realtime.types';
import { applySseResponseHeaders, writeSseComment, writeSseFrame } from './notification-sse.util';

type SseConnection = {
  id: string;
  employeeId: string;
  res: Response;
  heartbeatId: ReturnType<typeof setInterval>;
};

/**
 * Per-process SSE registry for delivery-board invalidation.
 * Broadcasts to every attached connection. Cross-instance delivery goes through
 * {@link DeliveryRealtimeEventBus}.
 */
@Injectable()
export class DeliverySseHub implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DeliverySseHub.name);
  private readonly connections = new Map<string, SseConnection>();
  private unsubscribeBus: (() => void) | null = null;
  private nextFrameId = 1;

  constructor(private readonly eventBus: DeliveryRealtimeEventBus) {}

  onModuleInit(): void {
    const handler: DeliveryRealtimeHandler = (message) => {
      this.deliverToAll(message);
    };
    this.unsubscribeBus = this.eventBus.subscribe(handler);
  }

  onModuleDestroy(): void {
    this.unsubscribeBus?.();
    this.unsubscribeBus = null;
    for (const id of [...this.connections.keys()]) {
      this.detach(id);
    }
  }

  attach(employeeId: string, res: Response): void {
    applySseResponseHeaders(res);
    const id = randomUUID();
    const heartbeatId = setInterval(() => {
      writeSseComment(res, 'ping');
    }, DELIVERY_SSE_HEARTBEAT_MS);

    this.connections.set(id, { id, employeeId, res, heartbeatId });

    const detach = (): void => {
      this.detach(id);
    };
    res.on('close', detach);
    res.on('error', detach);
    writeSseComment(res, 'connected');
    this.logger.debug(`Delivery SSE attached employee=${employeeId} connection=${id}`);
  }

  get activeConnectionCount(): number {
    return this.connections.size;
  }

  deliverForTest(message: DeliveryRealtimeBusMessage): void {
    this.deliverToAll(message);
  }

  private deliverToAll(message: DeliveryRealtimeBusMessage): void {
    const clientPayload = toClientPayload(message.payload);
    for (const connection of [...this.connections.values()]) {
      writeSseFrame(connection.res, {
        event: message.event,
        id: String(this.nextFrameId++),
        data: JSON.stringify(clientPayload),
      });
    }
  }

  private detach(id: string): void {
    const connection = this.connections.get(id);
    if (!connection) return;
    clearInterval(connection.heartbeatId);
    this.connections.delete(id);
  }
}

function toClientPayload(payload: DeliveryItemChangedPayload): DeliveryItemChangedPayload {
  return {
    schemaVersion: payload.schemaVersion,
    entityType: payload.entityType,
    entityId: payload.entityId,
    occurredAt: payload.occurredAt,
  };
}
