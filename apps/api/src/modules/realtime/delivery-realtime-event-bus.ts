import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type Redis from 'ioredis';
import { closeRedisConnection } from '../../runtime/queue-redis';
import {
  DELIVERY_REALTIME_CHANNEL,
  DELIVERY_REALTIME_SCHEMA_VERSION,
  isDeliveryRealtimeEntityType,
  isDeliverySseEvent,
} from './delivery-realtime.constants';
import type { DeliveryRealtimeBusMessage } from './delivery-realtime.types';
import {
  createRedisEventsPublisherConnection,
  createRedisEventsSubscriberConnection,
  getRedisEventsUrl,
} from './redis-events-connection';

export type DeliveryRealtimeHandler = (message: DeliveryRealtimeBusMessage) => void;

/**
 * Fan-out bus for delivery-board SSE.
 * Redis Pub/Sub across API replicas; in-process only when Redis is unset.
 */
@Injectable()
export class DeliveryRealtimeEventBus implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DeliveryRealtimeEventBus.name);
  private readonly localHandlers = new Set<DeliveryRealtimeHandler>();
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;
  private subscribed = false;

  onModuleInit(): void {
    const url = getRedisEventsUrl();
    if (!url) {
      this.logger.warn(
        'REDIS_EVENTS_URL/REDIS_URL unset — delivery realtime uses in-process bus only',
      );
      return;
    }
    this.publisher = createRedisEventsPublisherConnection(url);
    this.subscriber = createRedisEventsSubscriberConnection(url);
    this.subscriber.on('message', (channel, raw) => {
      if (channel !== DELIVERY_REALTIME_CHANNEL) return;
      this.dispatchLocal(this.parseMessage(raw));
    });
    void this.subscriber.subscribe(DELIVERY_REALTIME_CHANNEL, (err) => {
      if (err) {
        this.logger.error(`Failed to subscribe ${DELIVERY_REALTIME_CHANNEL}: ${String(err)}`);
        return;
      }
      this.subscribed = true;
      this.logger.log(`Subscribed to ${DELIVERY_REALTIME_CHANNEL}`);
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
          await subscriber.unsubscribe(DELIVERY_REALTIME_CHANNEL);
        }
      } catch {
        /* ignore */
      }
    }
    await closeRedisConnection(subscriber);
    await closeRedisConnection(publisher);
  }

  subscribe(handler: DeliveryRealtimeHandler): () => void {
    this.localHandlers.add(handler);
    return () => {
      this.localHandlers.delete(handler);
    };
  }

  async publish(message: DeliveryRealtimeBusMessage): Promise<void> {
    if (!isDeliverySseEvent(message.event)) return;

    if (!this.publisher) {
      this.dispatchLocal(message);
      return;
    }

    try {
      await this.publisher.publish(DELIVERY_REALTIME_CHANNEL, JSON.stringify(message));
    } catch (err) {
      this.logger.error(`Failed to publish delivery realtime event: ${String(err)}`);
      this.dispatchLocal(message);
    }
  }

  get localHandlerCount(): number {
    return this.localHandlers.size;
  }

  private dispatchLocal(message: DeliveryRealtimeBusMessage | null): void {
    if (!message) return;
    for (const handler of this.localHandlers) {
      try {
        handler(message);
      } catch (err) {
        this.logger.error(`Delivery realtime handler failed: ${String(err)}`);
      }
    }
  }

  private parseMessage(raw: string): DeliveryRealtimeBusMessage | null {
    try {
      const parsed = JSON.parse(raw) as DeliveryRealtimeBusMessage;
      if (!parsed?.event || !isDeliverySseEvent(parsed.event)) return null;
      const payload = parsed.payload;
      if (payload?.schemaVersion !== DELIVERY_REALTIME_SCHEMA_VERSION) return null;
      if (!payload.entityId || !isDeliveryRealtimeEntityType(payload.entityType)) return null;
      if (typeof payload.occurredAt !== 'string') return null;
      return parsed;
    } catch {
      return null;
    }
  }
}
