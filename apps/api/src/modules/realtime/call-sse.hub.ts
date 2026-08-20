import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type { Response } from 'express';
import { randomUUID } from 'node:crypto';
import { CALL_SSE_EVENT, CALL_SSE_HEARTBEAT_MS } from './call-realtime.constants';
import { CallRealtimeEventBus, type CallRealtimeHandler } from './call-realtime-event-bus';
import type { IncomingCallBusMessage, IncomingCallSsePayload } from './call-realtime.types';
import { applySseResponseHeaders, writeSseComment, writeSseFrame } from './notification-sse.util';

type SseConnection = {
  id: string;
  employeeId: string;
  res: Response;
  heartbeatId: ReturnType<typeof setInterval>;
};

/**
 * Per-process SSE registry for incoming calls.
 * Cross-instance delivery goes through {@link CallRealtimeEventBus}.
 */
@Injectable()
export class CallSseHub implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CallSseHub.name);
  private readonly connections = new Map<string, SseConnection>();
  private readonly byEmployee = new Map<string, Set<string>>();
  private unsubscribeBus: (() => void) | null = null;
  private nextFrameId = 1;

  constructor(private readonly eventBus: CallRealtimeEventBus) {}

  onModuleInit(): void {
    const handler: CallRealtimeHandler = (message) => {
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
    }, CALL_SSE_HEARTBEAT_MS);

    this.connections.set(id, { id, employeeId, res, heartbeatId });
    const bucket = this.byEmployee.get(employeeId) ?? new Set<string>();
    bucket.add(id);
    this.byEmployee.set(employeeId, bucket);

    const detach = (): void => {
      this.detach(id);
    };
    res.on('close', detach);
    res.on('error', detach);
    writeSseComment(res, 'connected');
    this.logger.debug(`Call SSE attached employee=${employeeId} connection=${id}`);
  }

  get activeConnectionCount(): number {
    return this.connections.size;
  }

  deliverForTest(message: IncomingCallBusMessage): void {
    this.deliverToEmployee(message);
  }

  private deliverToEmployee(message: IncomingCallBusMessage): void {
    const employeeId = message.payload.employeeId;
    const ids = this.byEmployee.get(employeeId);
    if (!ids || ids.size === 0) return;

    const clientPayload: IncomingCallSsePayload = toClientPayload(message.payload);
    for (const connectionId of [...ids]) {
      const connection = this.connections.get(connectionId);
      if (!connection) continue;
      writeSseFrame(connection.res, {
        event: CALL_SSE_EVENT.INCOMING_CALL,
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
    const bucket = this.byEmployee.get(connection.employeeId);
    if (!bucket) return;
    bucket.delete(id);
    if (bucket.size === 0) {
      this.byEmployee.delete(connection.employeeId);
    }
  }
}

function toClientPayload(payload: IncomingCallBusMessage['payload']): IncomingCallSsePayload {
  return {
    type: 'incoming_call',
    callId: payload.callId,
    direction: payload.direction,
    phone: payload.phone,
    contactName: payload.contactName,
    leadName: payload.leadName,
    dealName: payload.dealName,
    responsibleEmployeeName: payload.responsibleEmployeeName,
    leadId: payload.leadId,
    contactId: payload.contactId,
    dealId: payload.dealId,
  };
}
