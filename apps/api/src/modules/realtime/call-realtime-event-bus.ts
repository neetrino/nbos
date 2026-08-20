import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type Redis from 'ioredis';
import { CALL_REALTIME_CHANNEL, CALL_SSE_EVENT } from './call-realtime.constants';
import type { IncomingCallBusMessage } from './call-realtime.types';
import {
  createRedisEventsPublisherConnection,
  createRedisEventsSubscriberConnection,
  getRedisEventsUrl,
} from './redis-events-connection';

export type CallRealtimeHandler = (message: IncomingCallBusMessage) => void;

/**
 * Fan-out bus for incoming-call SSE.
 * Redis Pub/Sub across API replicas; in-process only when Redis is unset.
 */
@Injectable()
export class CallRealtimeEventBus implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CallRealtimeEventBus.name);
  private readonly localHandlers = new Set<CallRealtimeHandler>();
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;
  private subscribed = false;

  onModuleInit(): void {
    const url = getRedisEventsUrl();
    if (!url) {
      this.logger.warn('REDIS_EVENTS_URL/REDIS_URL unset — call realtime uses in-process bus only');
      return;
    }
    this.publisher = createRedisEventsPublisherConnection(url);
    this.subscriber = createRedisEventsSubscriberConnection(url);
    this.subscriber.on('message', (channel, raw) => {
      if (channel !== CALL_REALTIME_CHANNEL) return;
      this.dispatchLocal(this.parseMessage(raw));
    });
    void this.subscriber.subscribe(CALL_REALTIME_CHANNEL, (err) => {
      if (err) {
        this.logger.error(`Failed to subscribe ${CALL_REALTIME_CHANNEL}: ${String(err)}`);
        return;
      }
      this.subscribed = true;
      this.logger.log(`Subscribed to ${CALL_REALTIME_CHANNEL}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    this.localHandlers.clear();
    if (this.subscriber) {
      try {
        if (this.subscribed) {
          await this.subscriber.unsubscribe(CALL_REALTIME_CHANNEL);
        }
      } catch {
        /* ignore */
      }
      await this.subscriber.quit();
      this.subscriber = null;
    }
    if (this.publisher) {
      await this.publisher.quit();
      this.publisher = null;
    }
  }

  subscribe(handler: CallRealtimeHandler): () => void {
    this.localHandlers.add(handler);
    return () => {
      this.localHandlers.delete(handler);
    };
  }

  async publish(message: IncomingCallBusMessage): Promise<void> {
    if (message.event !== CALL_SSE_EVENT.INCOMING_CALL) return;

    if (!this.publisher) {
      this.dispatchLocal(message);
      return;
    }

    try {
      await this.publisher.publish(CALL_REALTIME_CHANNEL, JSON.stringify(message));
    } catch (err) {
      this.logger.error(`Failed to publish call realtime event: ${String(err)}`);
      this.dispatchLocal(message);
    }
  }

  get localHandlerCount(): number {
    return this.localHandlers.size;
  }

  private dispatchLocal(message: IncomingCallBusMessage | null): void {
    if (!message) return;
    for (const handler of this.localHandlers) {
      try {
        handler(message);
      } catch (err) {
        this.logger.error(`Call realtime handler failed: ${String(err)}`);
      }
    }
  }

  private parseMessage(raw: string): IncomingCallBusMessage | null {
    try {
      const parsed = JSON.parse(raw) as IncomingCallBusMessage;
      if (parsed?.event !== CALL_SSE_EVENT.INCOMING_CALL) return null;
      if (!parsed.payload?.employeeId || !parsed.payload.callId) return null;
      return parsed;
    } catch {
      return null;
    }
  }
}
