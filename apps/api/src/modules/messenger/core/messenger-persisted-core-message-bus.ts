import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type Redis from 'ioredis';
import { closeRedisConnection } from '../../../runtime/queue-redis';
import { resolveProcessRole, type ProcessRole } from '../../../runtime/process-role';
import {
  createRedisEventsPublisherConnection,
  createRedisEventsSubscriberConnection,
  getRedisEventsUrl,
} from '../../realtime/redis-events-connection';

export type MessengerPersistedCoreMessageEvent = {
  conversationId: string;
  messageId: string;
};

export type MessengerPersistedCoreMessageHandler = (
  event: MessengerPersistedCoreMessageEvent,
) => void | Promise<void>;

/** Redis when a publisher exists; in-process only for local `all`; otherwise withheld. */
export type PersistedCoreMessageFanout = 'redis' | 'in-process' | 'withheld';

export const MESSENGER_PERSISTED_CORE_MESSAGE_CHANNEL = 'nbos:messenger:persisted-core-message';

const WITHHELD_LOG =
  'REDIS_EVENTS_URL unset — persisted Core message was not published to API browsers';
const NO_SUBSCRIBER_LOG = 'Persisted Core message had no in-process API subscriber';

export function persistedCoreMessageFanout(
  role: ProcessRole,
  redisPublisherReady: boolean,
): PersistedCoreMessageFanout {
  if (redisPublisherReady) return 'redis';
  if (role === 'all') return 'in-process';
  return 'withheld';
}

export function isMessengerPersistedCoreMessageEvent(
  value: unknown,
): value is MessengerPersistedCoreMessageEvent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return isNonEmptyId(row.conversationId) && isNonEmptyId(row.messageId);
}

/**
 * Worker publishes persisted Client message ids. The API process subscribes and
 * reloads the row before Socket.IO. A worker without Redis does not fan out locally.
 */
@Injectable()
export class MessengerPersistedCoreMessageBus implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessengerPersistedCoreMessageBus.name);
  private readonly localHandlers = new Set<MessengerPersistedCoreMessageHandler>();
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;
  private subscribed = false;

  onModuleInit(): void {
    const url = getRedisEventsUrl();
    const role = resolveProcessRole();
    if (!url) {
      this.logger.warn(
        'REDIS_EVENTS_URL/REDIS_URL unset — persisted Core message bus is in-process only for PROCESS_ROLE=all',
      );
      return;
    }
    if (role === 'worker' || role === 'scheduler' || role === 'all') {
      this.publisher = createRedisEventsPublisherConnection(url);
    }
    if (role !== 'api' && role !== 'all') return;
    this.subscriber = createRedisEventsSubscriberConnection(url);
    this.subscriber.on('message', (channel, raw) => {
      if (channel !== MESSENGER_PERSISTED_CORE_MESSAGE_CHANNEL) return;
      void this.dispatchLocal(this.parseMessage(raw));
    });
    void this.subscriber.subscribe(MESSENGER_PERSISTED_CORE_MESSAGE_CHANNEL, (err) => {
      if (err) {
        this.logger.error(
          `Failed to subscribe ${MESSENGER_PERSISTED_CORE_MESSAGE_CHANNEL}: ${String(err)}`,
        );
        return;
      }
      this.subscribed = true;
      this.logger.log(`Subscribed to ${MESSENGER_PERSISTED_CORE_MESSAGE_CHANNEL}`);
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
    if (subscriber && subscribed) {
      try {
        await subscriber.unsubscribe(MESSENGER_PERSISTED_CORE_MESSAGE_CHANNEL);
      } catch {
        /* ignore */
      }
    }
    await closeRedisConnection(subscriber);
    await closeRedisConnection(publisher);
  }

  subscribe(handler: MessengerPersistedCoreMessageHandler): () => void {
    this.localHandlers.add(handler);
    return () => {
      this.localHandlers.delete(handler);
    };
  }

  async publish(event: MessengerPersistedCoreMessageEvent): Promise<boolean> {
    if (!isMessengerPersistedCoreMessageEvent(event)) return false;
    const mode = persistedCoreMessageFanout(resolveProcessRole(), this.publisher != null);
    if (mode === 'redis') return this.publishRedis(event);
    if (mode === 'in-process') return this.publishInProcess(event);
    this.logger.warn(WITHHELD_LOG);
    return false;
  }

  private async publishInProcess(event: MessengerPersistedCoreMessageEvent): Promise<boolean> {
    const delivered = await this.dispatchLocal(event);
    if (!delivered) this.logger.warn(NO_SUBSCRIBER_LOG);
    return delivered;
  }

  private async publishRedis(event: MessengerPersistedCoreMessageEvent): Promise<boolean> {
    const publisher = this.publisher;
    if (!publisher) return false;
    try {
      await publisher.publish(MESSENGER_PERSISTED_CORE_MESSAGE_CHANNEL, JSON.stringify(event));
      return true;
    } catch (error) {
      this.logger.error(`Failed to publish persisted Core message: ${String(error)}`);
      if (resolveProcessRole() !== 'all') return false;
      return this.publishInProcess(event);
    }
  }

  private async dispatchLocal(event: MessengerPersistedCoreMessageEvent | null): Promise<boolean> {
    if (!event || this.localHandlers.size === 0) return false;
    let delivered = false;
    for (const handler of this.localHandlers) {
      delivered = (await this.runHandler(handler, event)) || delivered;
    }
    return delivered;
  }

  private async runHandler(
    handler: MessengerPersistedCoreMessageHandler,
    event: MessengerPersistedCoreMessageEvent,
  ): Promise<boolean> {
    try {
      await handler(event);
      return true;
    } catch (error) {
      this.logger.error(`Persisted Core message handler failed: ${String(error)}`);
      return false;
    }
  }

  private parseMessage(raw: string): MessengerPersistedCoreMessageEvent | null {
    try {
      const parsed: unknown = JSON.parse(raw);
      return isMessengerPersistedCoreMessageEvent(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}

function isNonEmptyId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
