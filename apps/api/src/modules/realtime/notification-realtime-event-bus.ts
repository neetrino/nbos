import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type Redis from 'ioredis';
import { closeRedisConnection } from '../../runtime/queue-redis';
import {
  NOTIFICATION_REALTIME_CHANNEL,
  NOTIFICATION_SSE_EVENT,
} from './notification-realtime.constants';
import type { NotificationRealtimeBusMessage } from './notification-realtime.types';
import {
  createRedisEventsPublisherConnection,
  createRedisEventsSubscriberConnection,
  getRedisEventsUrl,
} from './redis-events-connection';

export type NotificationRealtimeHandler = (message: NotificationRealtimeBusMessage) => void;

/**
 * Fan-out bus for notification SSE.
 * - With Redis: Pub/Sub across API replicas (+ workers as publishers).
 * - Without Redis: in-process handlers only (dev/single instance).
 */
@Injectable()
export class NotificationRealtimeEventBus implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationRealtimeEventBus.name);
  private readonly localHandlers = new Set<NotificationRealtimeHandler>();
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;
  private subscribed = false;

  onModuleInit(): void {
    const url = getRedisEventsUrl();
    if (!url) {
      this.logger.warn(
        'REDIS_EVENTS_URL/REDIS_URL unset — notification realtime uses in-process bus only',
      );
      return;
    }
    this.publisher = createRedisEventsPublisherConnection(url);
    this.subscriber = createRedisEventsSubscriberConnection(url);
    this.subscriber.on('message', (channel, raw) => {
      if (channel !== NOTIFICATION_REALTIME_CHANNEL) return;
      this.dispatchLocal(this.parseMessage(raw));
    });
    void this.subscriber.subscribe(NOTIFICATION_REALTIME_CHANNEL, (err) => {
      if (err) {
        this.logger.error(`Failed to subscribe ${NOTIFICATION_REALTIME_CHANNEL}: ${String(err)}`);
        return;
      }
      this.subscribed = true;
      this.logger.log(`Subscribed to ${NOTIFICATION_REALTIME_CHANNEL}`);
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
          await subscriber.unsubscribe(NOTIFICATION_REALTIME_CHANNEL);
        }
      } catch {
        /* ignore */
      }
    }
    await closeRedisConnection(subscriber);
    await closeRedisConnection(publisher);
  }

  subscribe(handler: NotificationRealtimeHandler): () => void {
    this.localHandlers.add(handler);
    return () => {
      this.localHandlers.delete(handler);
    };
  }

  async publish(message: NotificationRealtimeBusMessage): Promise<void> {
    if (
      message.event !== NOTIFICATION_SSE_EVENT.UNREAD_CHANGED &&
      message.event !== NOTIFICATION_SSE_EVENT.LIST_INVALIDATE
    ) {
      return;
    }

    if (!this.publisher) {
      this.dispatchLocal(message);
      return;
    }

    try {
      await this.publisher.publish(NOTIFICATION_REALTIME_CHANNEL, JSON.stringify(message));
    } catch (err) {
      this.logger.error(`Failed to publish notification realtime event: ${String(err)}`);
      // Same-process fallback so local SSE clients still update when Redis blips.
      this.dispatchLocal(message);
    }
  }

  /** Test/helper: number of local in-process handlers. */
  get localHandlerCount(): number {
    return this.localHandlers.size;
  }

  get usesRedis(): boolean {
    return this.publisher !== null;
  }

  private dispatchLocal(message: NotificationRealtimeBusMessage | null): void {
    if (!message) return;
    for (const handler of this.localHandlers) {
      try {
        handler(message);
      } catch (err) {
        this.logger.error(`Notification realtime handler failed: ${String(err)}`);
      }
    }
  }

  private parseMessage(raw: string): NotificationRealtimeBusMessage | null {
    try {
      const parsed = JSON.parse(raw) as NotificationRealtimeBusMessage;
      if (!parsed?.event || !parsed.payload?.employeeId) return null;
      if (typeof parsed.payload.unreadCount !== 'number') return null;
      if (typeof parsed.payload.version !== 'number') return null;
      return parsed;
    } catch {
      return null;
    }
  }
}
