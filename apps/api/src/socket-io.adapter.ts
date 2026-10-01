import { Logger, type INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import type { Server, ServerOptions } from 'socket.io';
import type Redis from 'ioredis';
import { closeRedisConnection } from './runtime/queue-redis';
import {
  createRedisEventsPublisherConnection,
  createRedisEventsSubscriberConnection,
} from './modules/realtime/redis-events-connection';
import { parseCorsOriginsFromEnv } from './security/cors-origins';
import { resolveSocketIoFanout } from './socket-io-fanout';

const PROCESS_LOCAL_FANOUT_LOG =
  'REDIS_EVENTS_URL/REDIS_URL unset — Socket.IO fan-out is process-local for PROCESS_ROLE=all';

/** CORS-compatible Socket.IO adapter. Redis fan-out is attached only after `attachRedis`. */
export class SocketIoCorsAdapter extends IoAdapter {
  private redisFactory: ReturnType<typeof createAdapter> | null = null;
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;

  override createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, withSocketCors(options)) as Server;
    if (this.redisFactory) server.adapter(this.redisFactory);
    return server;
  }

  /** Uses the events Redis clients. Does not fall back to the in-memory adapter. */
  async attachRedis(url: string): Promise<void> {
    const publisher = createRedisEventsPublisherConnection(url);
    const subscriber = createRedisEventsSubscriberConnection(url);
    this.publisher = publisher;
    this.subscriber = subscriber;
    this.redisFactory = createAdapter(publisher, subscriber);
  }

  async closeRedis(): Promise<void> {
    const publisher = this.publisher;
    const subscriber = this.subscriber;
    this.publisher = null;
    this.subscriber = null;
    this.redisFactory = null;
    await closeRedisConnection(subscriber);
    await closeRedisConnection(publisher);
  }
}

/**
 * Installs Socket.IO for the API process.
 * `api` without Redis throws. Local `all` without Redis stays process-local.
 */
export async function installMessengerSocketIoAdapter(
  app: INestApplication,
): Promise<SocketIoCorsAdapter> {
  const fanout = resolveSocketIoFanout();
  if (fanout.mode === 'refused') throw new Error(fanout.reason);
  const adapter = new SocketIoCorsAdapter(app);
  if (fanout.mode === 'process-local') {
    new Logger(SocketIoCorsAdapter.name).warn(PROCESS_LOCAL_FANOUT_LOG);
  }
  if (fanout.mode === 'redis') await adapter.attachRedis(fanout.url);
  app.useWebSocketAdapter(adapter);
  return adapter;
}

function withSocketCors(options?: ServerOptions): ServerOptions {
  return {
    ...options,
    cors: {
      origin: parseCorsOriginsFromEnv(),
      credentials: true,
    },
  };
}
