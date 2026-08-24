import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type Redis from 'ioredis';
import { closeRedisConnection } from '../../runtime/queue-redis';
import { CALL_REALTIME_CHANNEL, isCallLifecycleSseEvent } from './call-realtime.constants';
import type { ActiveCallBusMessage } from './call-realtime.types';
import {
  createRedisEventsPublisherConnection,
  createRedisEventsSubscriberConnection,
  getRedisEventsUrl,
} from './redis-events-connection';

export type CallRealtimeHandler = (message: ActiveCallBusMessage) => void;

/**
 * Fan-out bus for active-call SSE.
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
    const subscriber = this.subscriber;
    const publisher = this.publisher;
    const subscribed = this.subscribed;
    this.subscriber = null;
    this.publisher = null;
    this.subscribed = false;
    if (subscriber) {
      try {
        if (subscribed) {
          await subscriber.unsubscribe(CALL_REALTIME_CHANNEL);
        }
      } catch {
        /* ignore */
      }
    }
    await closeRedisConnection(subscriber);
    await closeRedisConnection(publisher);
  }

  subscribe(handler: CallRealtimeHandler): () => void {
    this.localHandlers.add(handler);
    return () => {
      this.localHandlers.delete(handler);
    };
  }

  async publish(message: ActiveCallBusMessage): Promise<void> {
    if (!isCallLifecycleSseEvent(message.event)) return;

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

  private dispatchLocal(message: ActiveCallBusMessage | null): void {
    if (!message) return;
    for (const handler of this.localHandlers) {
      try {
        handler(message);
      } catch (err) {
        this.logger.error(`Call realtime handler failed: ${String(err)}`);
      }
    }
  }

  private parseMessage(raw: string): ActiveCallBusMessage | null {
    try {
      const parsed = JSON.parse(raw) as ActiveCallBusMessage;
      if (!parsed?.event || !isCallLifecycleSseEvent(parsed.event)) return null;
      if (!parsed.payload?.employeeId || !parsed.payload.callId) return null;
      return parsed;
    } catch {
      return null;
    }
  }
}
