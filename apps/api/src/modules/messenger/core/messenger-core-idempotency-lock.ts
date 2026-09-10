import type { PrismaClient } from '@nbos/database';

type PrismaLike = InstanceType<typeof PrismaClient>;

export const MESSENGER_HTTP_IDEMPOTENCY_LOCK_PREFIX = 'messenger-http-idempotency';
/** Fixed 64-bit namespace seed for hashtextextended (ASCII "NBOS"). */
export const MESSENGER_HTTP_IDEMPOTENCY_LOCK_SEED = 0x4e424f53;

/** Transaction-scoped advisory lock key for (conversationId, HTTP idempotencyKey). */
export function messengerHttpIdempotencyLockKey(
  conversationId: string,
  idempotencyKey: string,
): string {
  return `${MESSENGER_HTTP_IDEMPOTENCY_LOCK_PREFIX}:${conversationId}:${idempotencyKey}`;
}

/**
 * Serialize concurrent HTTP idempotent persists inside one PostgreSQL transaction.
 * Must run before the first idempotency read. Parameterized; no string-concat SQL.
 */
export async function lockMessengerHttpIdempotency(
  prisma: PrismaLike,
  conversationId: string,
  idempotencyKey: string,
): Promise<void> {
  const key = messengerHttpIdempotencyLockKey(conversationId, idempotencyKey);
  await prisma.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtextextended(${key}, ${MESSENGER_HTTP_IDEMPOTENCY_LOCK_SEED}))
  `;
}
