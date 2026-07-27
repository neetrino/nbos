import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type { Response } from 'express';
import { randomUUID } from 'node:crypto';
import {
  NOTIFICATION_SSE_EVENT,
  NOTIFICATION_SSE_HEARTBEAT_MS,
} from './notification-realtime.constants';
import {
  NotificationRealtimeEventBus,
  type NotificationRealtimeHandler,
} from './notification-realtime-event-bus';
import type {
  NotificationRealtimeBusMessage,
  NotificationUnreadChangedPayload,
} from './notification-realtime.types';
import { applySseResponseHeaders, writeSseComment, writeSseFrame } from './notification-sse.util';

type SseConnection = {
  id: string;
  employeeId: string;
  res: Response;
  heartbeatId: ReturnType<typeof setInterval>;
};

/**
 * Per-process SSE connection registry. Cross-instance delivery goes through
 * {@link NotificationRealtimeEventBus} (Redis Pub/Sub).
 */
@Injectable()
export class NotificationSseHub implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationSseHub.name);
  private readonly connections = new Map<string, SseConnection>();
  private readonly byEmployee = new Map<string, Set<string>>();
  private unsubscribeBus: (() => void) | null = null;
  private nextFrameId = 1;

  constructor(private readonly eventBus: NotificationRealtimeEventBus) {}

  onModuleInit(): void {
    const handler: NotificationRealtimeHandler = (message) => {
      this.deliverToEmployee(message);
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
    }, NOTIFICATION_SSE_HEARTBEAT_MS);

    const connection: SseConnection = { id, employeeId, res, heartbeatId };
    this.connections.set(id, connection);
    const bucket = this.byEmployee.get(employeeId) ?? new Set<string>();
    bucket.add(id);
    this.byEmployee.set(employeeId, bucket);

    const detach = (): void => {
      this.detach(id);
    };
    res.on('close', detach);
    res.on('error', detach);

    // Initial comment so proxies flush headers immediately.
    writeSseComment(res, 'connected');
    this.logger.debug(`SSE attached employee=${employeeId} connection=${id}`);
  }

  get activeConnectionCount(): number {
    return this.connections.size;
  }

  /** Unit-test helper: deliver as if a bus message arrived. */
  deliverForTest(message: NotificationRealtimeBusMessage): void {
    this.deliverToEmployee(message);
  }

  private deliverToEmployee(message: NotificationRealtimeBusMessage): void {
    const employeeId = message.payload.employeeId;
    const ids = this.byEmployee.get(employeeId);
    if (!ids || ids.size === 0) return;

    const frames: Array<{ event: string; payload: NotificationUnreadChangedPayload }> = [
      { event: NOTIFICATION_SSE_EVENT.UNREAD_CHANGED, payload: message.payload },
    ];
    if (
      message.payload.invalidateList ||
      message.event === NOTIFICATION_SSE_EVENT.LIST_INVALIDATE
    ) {
      frames.push({
        event: NOTIFICATION_SSE_EVENT.LIST_INVALIDATE,
        payload: message.payload,
      });
    }

    for (const connectionId of [...ids]) {
      const connection = this.connections.get(connectionId);
      if (!connection) continue;
      for (const frame of frames) {
        writeSseFrame(connection.res, {
          event: frame.event,
          id: String(this.nextFrameId++),
          data: JSON.stringify({
            unreadCount: frame.payload.unreadCount,
            version: frame.payload.version,
            occurredAt: frame.payload.occurredAt,
            schemaVersion: frame.payload.schemaVersion,
          }),
        });
      }
    }
  }

  private detach(id: string): void {
    const connection = this.connections.get(id);
    if (!connection) return;
    clearInterval(connection.heartbeatId);
    this.connections.delete(id);
    const bucket = this.byEmployee.get(connection.employeeId);
    if (bucket) {
      bucket.delete(id);
      if (bucket.size === 0) {
        this.byEmployee.delete(connection.employeeId);
      }
    }
  }
}
