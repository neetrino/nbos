import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type Redis from 'ioredis';
import { createRedisConnection, getRedisUrl } from '../../common/redis/redis-connection';
import {
  CREDENTIAL_VAULT_UNLOCK_TTL_MS,
  credentialVaultUnlockRedisKey,
} from './credential-vault-session.constants';
import { ttlSecondsUntil } from '../../common/security/jwt-denylist-redis';

export interface CredentialVaultSessionState {
  unlocked: boolean;
  expiresAt: string | null;
}

@Injectable()
export class CredentialVaultSessionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CredentialVaultSessionService.name);
  private readonly memory = new Map<string, number>();
  private redis: Redis | null = null;

  onModuleInit(): void {
    const url = getRedisUrl();
    if (!url) {
      this.logger.warn('REDIS_URL unset — credential vault unlock uses in-memory storage only');
      return;
    }
    this.redis = createRedisConnection(url);
    this.logger.log('Credential vault unlock backed by Redis');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }

  async getSession(employeeId: string): Promise<CredentialVaultSessionState> {
    const expiresAtMs = await this.readExpiryMs(employeeId);
    if (expiresAtMs === null || expiresAtMs <= Date.now()) {
      return { unlocked: false, expiresAt: null };
    }
    return { unlocked: true, expiresAt: new Date(expiresAtMs).toISOString() };
  }

  async isUnlocked(employeeId: string): Promise<boolean> {
    const session = await this.getSession(employeeId);
    return session.unlocked;
  }

  async unlock(employeeId: string): Promise<CredentialVaultSessionState> {
    const expiresAtMs = Date.now() + CREDENTIAL_VAULT_UNLOCK_TTL_MS;
    this.memory.set(employeeId, expiresAtMs);

    if (this.redis) {
      const ttlSeconds = ttlSecondsUntil(expiresAtMs);
      if (ttlSeconds > 0) {
        try {
          await this.redis.setex(
            credentialVaultUnlockRedisKey(employeeId),
            ttlSeconds,
            String(expiresAtMs),
          );
        } catch (err) {
          this.logger.error(`Failed to persist vault unlock to Redis: ${String(err)}`);
        }
      }
    }

    return { unlocked: true, expiresAt: new Date(expiresAtMs).toISOString() };
  }

  async lock(employeeId: string): Promise<void> {
    this.memory.delete(employeeId);
    if (!this.redis) return;
    try {
      await this.redis.del(credentialVaultUnlockRedisKey(employeeId));
    } catch (err) {
      this.logger.error(`Failed to clear vault unlock in Redis: ${String(err)}`);
    }
  }

  private async readExpiryMs(employeeId: string): Promise<number | null> {
    const memoryExpiry = this.memory.get(employeeId);
    if (memoryExpiry !== undefined) {
      if (memoryExpiry <= Date.now()) {
        this.memory.delete(employeeId);
        return null;
      }
      return memoryExpiry;
    }

    if (!this.redis) return null;

    try {
      const raw = await this.redis.get(credentialVaultUnlockRedisKey(employeeId));
      if (!raw) return null;
      const parsed = Number.parseInt(raw, 10);
      if (!Number.isFinite(parsed) || parsed <= Date.now()) {
        await this.redis.del(credentialVaultUnlockRedisKey(employeeId));
        return null;
      }
      this.memory.set(employeeId, parsed);
      return parsed;
    } catch (err) {
      this.logger.error(`Failed to read vault unlock from Redis: ${String(err)}`);
      return null;
    }
  }
}
