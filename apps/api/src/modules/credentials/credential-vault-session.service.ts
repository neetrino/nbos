import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import type Redis from 'ioredis';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import {
  closeRedisConnection,
  createStateRedisConnection,
  getRedisStateUrl,
} from '../../runtime/queue-redis';
import {
  CREDENTIAL_VAULT_UNLOCK_TTL_MS,
  credentialVaultUnlockRedisKey,
  parseVaultUnlockEntry,
  serializeVaultUnlockEntry,
  type CredentialVaultUnlockEntry,
} from './credential-vault-session.constants';
import { ttlSecondsUntil } from '../../common/security/jwt-denylist-redis';

export interface CredentialVaultSessionState {
  unlocked: boolean;
  expiresAt: string | null;
}

const LOCKED: CredentialVaultSessionState = { unlocked: false, expiresAt: null };

/**
 * Daily vault unlock (24h) for HIGH/CRITICAL secret reveal/copy. The record carries the employee's
 * `authVersion`, so any auth-invalidating event ends the vault session even if the explicit `lock()`
 * write never reached Redis.
 */
@Injectable()
export class CredentialVaultSessionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CredentialVaultSessionService.name);
  private readonly memory = new Map<string, CredentialVaultUnlockEntry>();
  private redis: Redis | null = null;

  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  onModuleInit(): void {
    const url = getRedisStateUrl();
    if (!url) {
      this.logger.warn(
        'REDIS_STATE_URL/REDIS_URL unset — credential vault unlock uses in-memory storage only',
      );
      return;
    }
    this.redis = createStateRedisConnection(url);
    this.logger.log('Credential vault unlock backed by Redis');
  }

  async onModuleDestroy(): Promise<void> {
    const redis = this.redis;
    this.redis = null;
    await closeRedisConnection(redis);
  }

  async getSession(employeeId: string): Promise<CredentialVaultSessionState> {
    const entry = await this.readEntry(employeeId);
    if (entry === null) return LOCKED;

    const authVersion = await this.currentAuthVersion(employeeId);
    if (authVersion === null || authVersion !== entry.authVersion) {
      await this.lock(employeeId);
      return LOCKED;
    }

    return { unlocked: true, expiresAt: new Date(entry.expiresAtMs).toISOString() };
  }

  async isUnlocked(employeeId: string): Promise<boolean> {
    const session = await this.getSession(employeeId);
    return session.unlocked;
  }

  async unlock(employeeId: string): Promise<CredentialVaultSessionState> {
    const authVersion = await this.currentAuthVersion(employeeId);
    if (authVersion === null) {
      this.logger.warn(`Vault unlock skipped: employee ${employeeId} no longer exists`);
      return LOCKED;
    }

    const entry: CredentialVaultUnlockEntry = {
      expiresAtMs: Date.now() + CREDENTIAL_VAULT_UNLOCK_TTL_MS,
      authVersion,
    };
    this.memory.set(employeeId, entry);

    if (this.redis) {
      const ttlSeconds = ttlSecondsUntil(entry.expiresAtMs);
      if (ttlSeconds > 0) {
        try {
          await this.redis.setex(
            credentialVaultUnlockRedisKey(employeeId),
            ttlSeconds,
            serializeVaultUnlockEntry(entry),
          );
        } catch (err) {
          this.logger.error(`Failed to persist vault unlock to Redis: ${String(err)}`);
        }
      }
    }

    return { unlocked: true, expiresAt: new Date(entry.expiresAtMs).toISOString() };
  }

  /**
   * Clears the unlock. Returns `false` when the Redis copy survived; the `authVersion` binding is
   * the durable guarantee, this result only tells callers whether the fast path succeeded.
   */
  async lock(employeeId: string): Promise<boolean> {
    this.memory.delete(employeeId);
    if (!this.redis) return true;
    try {
      await this.redis.del(credentialVaultUnlockRedisKey(employeeId));
      return true;
    } catch (err) {
      this.logger.error(`Failed to clear vault unlock in Redis: ${String(err)}`);
      return false;
    }
  }

  private async currentAuthVersion(employeeId: string): Promise<number | null> {
    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
        select: { authVersion: true },
      });
      return employee?.authVersion ?? null;
    } catch (err) {
      this.logger.error(`Failed to read authVersion for vault unlock: ${String(err)}`);
      return null;
    }
  }

  private async readEntry(employeeId: string): Promise<CredentialVaultUnlockEntry | null> {
    const cached = this.memory.get(employeeId);
    if (cached !== undefined) {
      if (cached.expiresAtMs <= Date.now()) {
        this.memory.delete(employeeId);
        return null;
      }
      return cached;
    }

    if (!this.redis) return null;

    try {
      const raw = await this.redis.get(credentialVaultUnlockRedisKey(employeeId));
      if (!raw) return null;
      const entry = parseVaultUnlockEntry(raw);
      if (!entry || entry.expiresAtMs <= Date.now()) {
        await this.redis.del(credentialVaultUnlockRedisKey(employeeId));
        return null;
      }
      this.memory.set(employeeId, entry);
      return entry;
    } catch (err) {
      this.logger.error(`Failed to read vault unlock from Redis: ${String(err)}`);
      return null;
    }
  }
}
