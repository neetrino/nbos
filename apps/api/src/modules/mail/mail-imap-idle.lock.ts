import type Redis from 'ioredis';
import { MAIL_IDLE_LOCK_TTL_SECONDS, mailIdleLockKey } from './mail-sync-runtime.constants';

export type MailIdleLockRedis = Pick<Redis, 'set' | 'get' | 'del' | 'expire'>;

export async function acquireMailIdleLock(
  redis: MailIdleLockRedis,
  mailAccountId: string,
  holderId: string,
  ttlSeconds: number = MAIL_IDLE_LOCK_TTL_SECONDS,
): Promise<boolean> {
  const result = await redis.set(mailIdleLockKey(mailAccountId), holderId, 'EX', ttlSeconds, 'NX');
  return result === 'OK';
}

export async function refreshMailIdleLock(
  redis: MailIdleLockRedis,
  mailAccountId: string,
  holderId: string,
  ttlSeconds: number = MAIL_IDLE_LOCK_TTL_SECONDS,
): Promise<boolean> {
  const key = mailIdleLockKey(mailAccountId);
  const current = await redis.get(key);
  if (current !== holderId) {
    return false;
  }
  await redis.expire(key, ttlSeconds);
  return true;
}

export async function releaseMailIdleLock(
  redis: MailIdleLockRedis,
  mailAccountId: string,
  holderId: string,
): Promise<void> {
  const key = mailIdleLockKey(mailAccountId);
  const current = await redis.get(key);
  if (current === holderId) {
    await redis.del(key);
  }
}
