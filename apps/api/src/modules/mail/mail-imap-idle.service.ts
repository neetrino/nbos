import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ImapFlow } from 'imapflow';
import { MailSyncLogKind, PrismaClient } from '@nbos/database';
import type Redis from 'ioredis';
import { shouldRegisterBullmqWorkers } from '../../runtime/process-role';
import {
  closeRedisConnection,
  createStateRedisConnection,
  getRedisQueueUrl,
} from '../../runtime/queue-redis';
import { PRISMA_TOKEN } from '../../database.module';
import { nextIdleBackoffMs } from './mail-imap-idle.backoff';
import {
  acquireMailIdleLock,
  refreshMailIdleLock,
  releaseMailIdleLock,
} from './mail-imap-idle.lock';
import { MailQueueService } from './mail-queue.service';
import {
  MAIL_IDLE_HEARTBEAT_MS,
  MAIL_IDLE_MAX_SOCKETS,
  MAIL_IDLE_WATCHDOG_MS,
  MAIL_SYNCABLE_ACCOUNT_STATUSES,
} from './mail-sync-runtime.constants';
import { isSecureModeTls } from './providers/mail-provider-adapter.factory';
import { MailProviderSecretStore } from './providers/mail-provider-secret.store';
import {
  attachImapClientErrorBoundary,
  formatImapClientError,
  type ImapClientErrorBoundary,
} from './providers/imap-client-error-boundary';

const IDLE_STOP_STATUSES = new Set(['DISABLED', 'PAUSED', 'NEEDS_RECONNECT']);

/**
 * Worker-only IMAP IDLE. One Redis lock per mailbox; cap on sockets per process.
 * `exists` enqueues `mail.sync` — never inline-syncs.
 */
@Injectable()
export class MailImapIdleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailImapIdleService.name);
  private readonly stopped = new Set<string>();
  private readonly clients = new Map<string, ImapFlow>();
  private readonly holders = new Map<string, string>();
  private redis: Redis | null = null;
  private destroyed = false;

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly secretStore: MailProviderSecretStore,
    private readonly queueService: MailQueueService,
  ) {}

  onModuleInit(): void {
    if (!shouldRegisterBullmqWorkers()) {
      return;
    }
    const redisUrl = getRedisQueueUrl();
    if (!redisUrl) {
      this.logger.warn('IMAP IDLE skipped: Redis is not configured');
      return;
    }
    this.redis = createStateRedisConnection(redisUrl);
    void this.startAll();
  }

  async onModuleDestroy(): Promise<void> {
    this.destroyed = true;
    const redis = this.redis;
    this.redis = null;
    for (const [accountId, client] of this.clients) {
      await client.logout().catch(() => undefined);
      const holderId = this.holders.get(accountId);
      if (redis && holderId) {
        await releaseMailIdleLock(redis, accountId, holderId).catch(() => undefined);
      }
    }
    this.clients.clear();
    await closeRedisConnection(redis);
  }

  /** Side-effect after a successful corporate sync. No dedicated idle job. */
  ensureIdle(mailAccountId: string): void {
    if (this.destroyed || !this.redis || !shouldRegisterBullmqWorkers()) {
      return;
    }
    this.startForAccount(mailAccountId);
  }

  private async startAll(): Promise<void> {
    const accounts = await this.prisma.mailAccount.findMany({
      where: {
        providerType: 'CORPORATE_IMAP_SMTP',
        status: { in: [...MAIL_SYNCABLE_ACCOUNT_STATUSES] },
      },
      select: { id: true },
    });
    for (const account of accounts) {
      this.startForAccount(account.id);
    }
  }

  startForAccount(mailAccountId: string): void {
    if (this.destroyed || this.clients.has(mailAccountId) || !this.redis) {
      return;
    }
    if (this.clients.size >= MAIL_IDLE_MAX_SOCKETS) {
      this.logger.warn(`IMAP IDLE cap ${MAIL_IDLE_MAX_SOCKETS} reached; relying on poll`);
      return;
    }
    this.stopped.delete(mailAccountId);
    void this.runLoop(mailAccountId).catch((error) => {
      this.logger.error(
        `IMAP IDLE loop stopped unexpectedly for ${mailAccountId}: ${formatImapClientError(error)}`,
      );
    });
  }

  private async runLoop(mailAccountId: string): Promise<void> {
    let attempt = 0;
    while (!this.destroyed && !this.stopped.has(mailAccountId)) {
      const shouldStop = await this.shouldStopAccount(mailAccountId);
      if (shouldStop) {
        this.stopped.add(mailAccountId);
        break;
      }
      try {
        const connected = await this.idleOnce(mailAccountId);
        if (connected) {
          attempt = 0;
        }
      } catch (error) {
        const detail = formatImapClientError(error);
        this.logger.warn(`IMAP IDLE error for ${mailAccountId}: ${detail}`);
        await this.log(mailAccountId, MailSyncLogKind.IDLE_RECONNECT, detail);
        await delay(nextIdleBackoffMs(attempt));
        attempt += 1;
      }
    }
    await this.releaseLocal(mailAccountId);
  }

  private async idleOnce(mailAccountId: string): Promise<boolean> {
    if (!this.redis || this.clients.size >= MAIL_IDLE_MAX_SOCKETS) {
      return false;
    }
    const holderId = this.holders.get(mailAccountId) ?? randomUUID();
    const locked = await acquireMailIdleLock(this.redis, mailAccountId, holderId);
    if (!locked) {
      await delay(MAIL_IDLE_HEARTBEAT_MS);
      return false;
    }
    this.holders.set(mailAccountId, holderId);
    const guarded = await this.buildClient(mailAccountId);
    if (!guarded) {
      this.stopped.add(mailAccountId);
      await releaseMailIdleLock(this.redis, mailAccountId, holderId);
      return false;
    }
    return this.holdIdle(mailAccountId, holderId, guarded.client, guarded.boundary);
  }

  private async holdIdle(
    mailAccountId: string,
    holderId: string,
    client: ImapFlow,
    boundary: ImapClientErrorBoundary,
  ): Promise<boolean> {
    this.clients.set(mailAccountId, client);
    let lastActivityAt = Date.now();
    client.on('exists', () => {
      lastActivityAt = Date.now();
      void this.onNewMail(mailAccountId);
    });
    await boundary.run(client.connect());
    await boundary.run(client.mailboxOpen('INBOX'));
    await this.log(mailAccountId, MailSyncLogKind.IDLE_STARTED);
    const heartbeat = setInterval(() => {
      void this.heartbeat(mailAccountId, holderId).catch((error) => {
        if (!this.destroyed) {
          this.logger.warn(
            `IMAP IDLE heartbeat failed for ${mailAccountId}: ${formatImapClientError(error)}`,
          );
        }
      });
    }, MAIL_IDLE_HEARTBEAT_MS);
    try {
      while (!this.destroyed && !this.stopped.has(mailAccountId) && client.usable) {
        if (await this.shouldStopAccount(mailAccountId)) {
          this.stopped.add(mailAccountId);
          break;
        }
        if (Date.now() - lastActivityAt >= MAIL_IDLE_WATCHDOG_MS) {
          await this.queueService.enqueueSync(mailAccountId);
          await this.log(mailAccountId, MailSyncLogKind.IDLE_RECONNECT, 'watchdog silence');
          break;
        }
        await boundary.run(client.idle());
      }
    } finally {
      clearInterval(heartbeat);
      await client.logout().catch(() => undefined);
      this.clients.delete(mailAccountId);
    }
    return true;
  }

  private async heartbeat(mailAccountId: string, holderId: string): Promise<void> {
    if (!this.redis) {
      return;
    }
    const ok = await refreshMailIdleLock(this.redis, mailAccountId, holderId);
    if (!ok) {
      this.stopped.add(mailAccountId);
      return;
    }
    await this.prisma.mailProviderConnection.updateMany({
      where: { mailAccountId },
      data: { imapIdleHeartbeatAt: new Date() },
    });
  }

  private async shouldStopAccount(mailAccountId: string): Promise<boolean> {
    const account = await this.prisma.mailAccount.findUnique({
      where: { id: mailAccountId },
      select: { status: true },
    });
    return !account || IDLE_STOP_STATUSES.has(account.status);
  }

  private async buildClient(
    mailAccountId: string,
  ): Promise<{ client: ImapFlow; boundary: ImapClientErrorBoundary } | null> {
    const connection = await this.prisma.mailProviderConnection.findUnique({
      where: { mailAccountId },
      select: { username: true, imapHost: true, imapPort: true, secureMode: true },
    });
    const secret = await this.secretStore.read(mailAccountId);
    if (!connection?.imapHost || !connection.imapPort || !secret || secret.kind !== 'corporate') {
      return null;
    }
    const client = new ImapFlow({
      host: connection.imapHost,
      port: connection.imapPort,
      secure: isSecureModeTls(connection.secureMode),
      auth: { user: connection.username ?? '', pass: secret.password },
      logger: false,
    });
    const boundary = attachImapClientErrorBoundary(client, {
      sensitiveValues: [secret.password],
      onError: (detail) =>
        this.logger.warn(`Corporate IMAP event for account ${mailAccountId}: ${detail}`),
    });
    return { client, boundary };
  }

  private async onNewMail(mailAccountId: string): Promise<void> {
    await this.queueService.enqueueSync(mailAccountId);
  }

  private async releaseLocal(mailAccountId: string): Promise<void> {
    this.clients.delete(mailAccountId);
    const holderId = this.holders.get(mailAccountId);
    this.holders.delete(mailAccountId);
    if (this.redis && holderId) {
      await releaseMailIdleLock(this.redis, mailAccountId, holderId);
    }
  }

  private async log(mailAccountId: string, kind: MailSyncLogKind, detail?: string): Promise<void> {
    await this.prisma.mailSyncLog.create({
      data: { mailAccountId, kind, detail: detail ?? null },
    });
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
