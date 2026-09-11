import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type Redis from 'ioredis';
import { closeRedisConnection } from '../../../runtime/queue-redis';
import { resolveProcessRole } from '../../../runtime/process-role';
import {
  createRedisEventsPublisherConnection,
  createRedisEventsSubscriberConnection,
  getRedisEventsUrl,
} from '../../realtime/redis-events-connection';
import {
  isMessengerDeliveryStatusEvent,
  MESSENGER_DELIVERY_STATUS_CHANNEL,
  type MessengerDeliveryStatusEvent,
  type MessengerDeliveryStatusPublisher,
} from './messenger-delivery-status.types';

export type MessengerDeliveryStatusHandler = (event: MessengerDeliveryStatusEvent) => void;

@Injectable()
export class MessengerDeliveryStatusBus
  implements OnModuleInit, OnModuleDestroy, MessengerDeliveryStatusPublisher
{
  private readonly logger = new Logger(MessengerDeliveryStatusBus.name);
  private readonly localHandlers = new Set<MessengerDeliveryStatusHandler>();
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;
  private subscribed = false;

  onModuleInit(): void {
    const url = getRedisEventsUrl();
    const role = resolveProcessRole();
    const startPublisher = role === 'worker' || role === 'scheduler' || role === 'all';
    const startSubscriber = role === 'api' || role === 'all';
    if (!url) {
      this.logger.warn(
        'REDIS_EVENTS_URL/REDIS_URL unset — Messenger delivery bus is in-process only',
      );
      return;
    }
    if (startPublisher) this.publisher = createRedisEventsPublisherConnection(url);
    if (!startSubscriber) return;
    this.subscriber = createRedisEventsSubscriberConnection(url);
    this.subscriber.on('message', (channel, raw) => {
      if (channel !== MESSENGER_DELIVERY_STATUS_CHANNEL) return;
      this.dispatchLocal(this.parseMessage(raw));
    });
    void this.subscriber.subscribe(MESSENGER_DELIVERY_STATUS_CHANNEL, (err) => {
      if (err) {
        this.logger.error(
          `Failed to subscribe ${MESSENGER_DELIVERY_STATUS_CHANNEL}: ${String(err)}`,
        );
        return;
      }
      this.subscribed = true;
      this.logger.log(`Subscribed to ${MESSENGER_DELIVERY_STATUS_CHANNEL}`);
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
        if (subscribed) await subscriber.unsubscribe(MESSENGER_DELIVERY_STATUS_CHANNEL);
      } catch {
        /* ignore */
      }
    }
    await closeRedisConnection(subscriber);
    await closeRedisConnection(publisher);
  }

  subscribe(handler: MessengerDeliveryStatusHandler): () => void {
    this.localHandlers.add(handler);
    return () => {
      this.localHandlers.delete(handler);
    };
  }

  async publish(event: MessengerDeliveryStatusEvent): Promise<void> {
    if (!isMessengerDeliveryStatusEvent(event)) return;
    if (!this.publisher) {
      this.dispatchLocal(event);
      return;
    }
    try {
      await this.publisher.publish(MESSENGER_DELIVERY_STATUS_CHANNEL, JSON.stringify(event));
    } catch (error) {
      this.logger.error(`Failed to publish Messenger delivery event: ${String(error)}`);
      this.dispatchLocal(event);
    }
  }

  private dispatchLocal(event: MessengerDeliveryStatusEvent | null): void {
    if (!event) return;
    for (const handler of this.localHandlers) {
      try {
        handler(event);
      } catch (error) {
        this.logger.error(`Messenger delivery handler failed: ${String(error)}`);
      }
    }
  }

  private parseMessage(raw: string): MessengerDeliveryStatusEvent | null {
    try {
      const parsed: unknown = JSON.parse(raw);
      return isMessengerDeliveryStatusEvent(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}
