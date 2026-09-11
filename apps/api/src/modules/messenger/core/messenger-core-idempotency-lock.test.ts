import { describe, expect, it, vi } from 'vitest';
import {
  lockMessengerHttpIdempotency,
  messengerHttpIdempotencyLockKey,
  MESSENGER_HTTP_IDEMPOTENCY_LOCK_PREFIX,
} from './messenger-core-idempotency-lock';

describe('Messenger HTTP idempotency advisory lock', () => {
  it('uses a stable namespaced lock key', () => {
    expect(messengerHttpIdempotencyLockKey('conv-c', 'http-k1')).toBe(
      `${MESSENGER_HTTP_IDEMPOTENCY_LOCK_PREFIX}:conv-c:http-k1`,
    );
  });

  it('issues parameterized transaction-scoped advisory lock SQL', async () => {
    const prisma = { $executeRaw: vi.fn().mockResolvedValue(1) };
    await lockMessengerHttpIdempotency(prisma as never, 'conv-c', 'http-k1');
    const chunks = prisma.$executeRaw.mock.calls[0]?.[0] as { strings?: string[] } | string[];
    const sql = Array.isArray(chunks) ? chunks.join('?') : String(chunks);
    expect(sql).toMatch(/pg_advisory_xact_lock\(hashtextextended\(/);
    expect(sql).not.toMatch(/hashtext\(/);
    expect(sql).not.toMatch(/conv-c/);
    expect(sql).not.toMatch(/http-k1/);
  });
});
