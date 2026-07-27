import { afterEach, describe, expect, it } from 'vitest';
import {
  createQueueProducerConnection,
  createQueueWorkerConnection,
  getRedisQueueUrl,
  summarizeRedisTopology,
} from './queue-redis';

describe('queue-redis', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it('falls back REDIS_QUEUE_URL to REDIS_URL', () => {
    delete process.env.REDIS_QUEUE_URL;
    process.env.REDIS_URL = 'redis://localhost:6379';
    expect(getRedisQueueUrl()).toBe('redis://localhost:6379');
  });

  it('summarizes dedicated vs shared without credentials', () => {
    process.env.REDIS_URL = 'redis://:secret@localhost:6379';
    delete process.env.REDIS_QUEUE_URL;
    process.env.REDIS_EVENTS_URL = 'redis://events:6379';
    const t = summarizeRedisTopology();
    expect(t.queue).toBe('shared fallback');
    expect(t.events).toBe('dedicated');
    expect(JSON.stringify(t)).not.toContain('secret');
  });

  it('producer and worker connections use different maxRetriesPerRequest', () => {
    process.env.NODE_ENV = 'development';
    const url = 'redis://127.0.0.1:6379';
    const producer = createQueueProducerConnection(url);
    const worker = createQueueWorkerConnection(url);
    expect(producer.options.maxRetriesPerRequest).toBe(1);
    expect(worker.options.maxRetriesPerRequest).toBeNull();
    void producer.disconnect();
    void worker.disconnect();
  });
});
