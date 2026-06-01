import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type Redis from 'ioredis';
import { createRedisConnection, getRedisUrl } from '../redis/redis-connection';
import { jwtDenylistRedisKey, ttlSecondsUntil } from './jwt-denylist-redis';

/** Sweep expired in-memory entries at most once per this interval. */
const SWEEP_INTERVAL_MS = 60_000;

/** Fallback TTL when a token carries no `exp` claim (should not happen for our tokens). */
const FALLBACK_TTL_MS = 7 * 24 * 60 * 60 * 1_000;

const REDIS_REVOKED_VALUE = '1';

/**
 * JWT revocation list keyed by `jti`.
 *
 * When `REDIS_URL` is set, revocations are stored in Redis (`SETEX`) so they
 * survive restarts and propagate across API instances. An in-memory map is
 * always updated as a fast L1 cache.
 */
@Injectable()
export class TokenDenylistService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TokenDenylistService.name);
  private readonly revoked = new Map<string, number>();
  private lastSweep = 0;
  private redis: Redis | null = null;

  onModuleInit(): void {
    const url = getRedisUrl();
    if (!url) {
      this.logger.warn('REDIS_URL unset — JWT denylist uses in-memory storage only');
      return;
    }
    this.redis = createRedisConnection(url);
    this.logger.log('JWT denylist backed by Redis');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }

  /** Revoke a token by its `jti` until the given expiry (epoch ms). */
  async revokeUntil(jti: string, expiresAtMs: number): Promise<void> {
    const now = Date.now();
    const expiry = Number.isFinite(expiresAtMs) ? expiresAtMs : now + FALLBACK_TTL_MS;
    if (expiry <= now) {
      return;
    }

    this.revoked.set(jti, expiry);
    this.sweepIfDue(now);

    const ttlSeconds = ttlSecondsUntil(expiry, now);
    if (ttlSeconds <= 0 || !this.redis) {
      return;
    }

    try {
      await this.redis.setex(jwtDenylistRedisKey(jti), ttlSeconds, REDIS_REVOKED_VALUE);
    } catch (err) {
      this.logger.error(`Failed to persist JWT revocation to Redis: ${String(err)}`);
    }
  }

  /** Returns true when the token has been revoked and is still within its lifetime. */
  async isRevoked(jti: string | undefined): Promise<boolean> {
    if (!jti) {
      return false;
    }

    const memoryExpiry = this.revoked.get(jti);
    if (memoryExpiry !== undefined) {
      if (memoryExpiry <= Date.now()) {
        this.revoked.delete(jti);
        return false;
      }
      return true;
    }

    if (!this.redis) {
      return false;
    }

    try {
      const value = await this.redis.get(jwtDenylistRedisKey(jti));
      return value === REDIS_REVOKED_VALUE;
    } catch (err) {
      this.logger.error(`Failed to read JWT revocation from Redis: ${String(err)}`);
      return false;
    }
  }

  private sweepIfDue(now: number): void {
    if (now - this.lastSweep < SWEEP_INTERVAL_MS) {
      return;
    }
    this.lastSweep = now;
    for (const [key, expiresAt] of this.revoked) {
      if (expiresAt <= now) {
        this.revoked.delete(key);
      }
    }
  }
}
