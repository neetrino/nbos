import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ImapFlow } from 'imapflow';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { MailQueueService } from './mail-queue.service';
import { MailSyncService } from './mail-sync.service';
import { isSecureModeTls } from './providers/mail-provider-adapter.factory';
import { MailProviderSecretStore } from './providers/mail-provider-secret.store';

const IDLE_RECONNECT_DELAY_MS = 15_000;

/**
 * Persistent IMAP IDLE listeners for active corporate mailboxes. On a new-mail
 * signal it enqueues a sync (the same receive entrypoint used by manual sync and
 * Gmail Pub/Sub). Reconnects with backoff on transient IMAP errors.
 */
@Injectable()
export class MailImapIdleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailImapIdleService.name);
  private readonly stopped = new Set<string>();
  private readonly clients = new Map<string, ImapFlow>();
  private destroyed = false;

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly secretStore: MailProviderSecretStore,
    private readonly queueService: MailQueueService,
    private readonly syncService: MailSyncService,
  ) {}

  onModuleInit(): void {
    void this.startAll();
  }

  async onModuleDestroy(): Promise<void> {
    this.destroyed = true;
    for (const client of this.clients.values()) {
      await client.logout().catch(() => undefined);
    }
  }

  private async startAll(): Promise<void> {
    const accounts = await this.prisma.mailAccount.findMany({
      where: { providerType: 'CORPORATE_IMAP_SMTP', status: { not: 'DISABLED' } },
      select: { id: true },
    });
    for (const account of accounts) {
      this.startForAccount(account.id);
    }
  }

  startForAccount(mailAccountId: string): void {
    if (this.destroyed || this.clients.has(mailAccountId)) {
      return;
    }
    this.stopped.delete(mailAccountId);
    void this.runLoop(mailAccountId);
  }

  private async runLoop(mailAccountId: string): Promise<void> {
    while (!this.destroyed && !this.stopped.has(mailAccountId)) {
      try {
        await this.idleOnce(mailAccountId);
      } catch (error) {
        this.logger.warn(`IMAP IDLE error for ${mailAccountId}: ${String(error)}`);
        await delay(IDLE_RECONNECT_DELAY_MS);
      }
    }
    this.clients.delete(mailAccountId);
  }

  private async idleOnce(mailAccountId: string): Promise<void> {
    const client = await this.buildClient(mailAccountId);
    if (!client) {
      this.stopped.add(mailAccountId);
      return;
    }
    this.clients.set(mailAccountId, client);
    client.on('exists', () => void this.onNewMail(mailAccountId));
    await client.connect();
    await client.mailboxOpen('INBOX');
    while (!this.destroyed && !this.stopped.has(mailAccountId) && client.usable) {
      await client.idle();
    }
    await client.logout().catch(() => undefined);
    this.clients.delete(mailAccountId);
  }

  private async buildClient(mailAccountId: string): Promise<ImapFlow | null> {
    const connection = await this.prisma.mailProviderConnection.findUnique({
      where: { mailAccountId },
      select: { username: true, imapHost: true, imapPort: true, secureMode: true },
    });
    const secret = await this.secretStore.read(mailAccountId);
    if (!connection?.imapHost || !connection.imapPort || !secret || secret.kind !== 'corporate') {
      return null;
    }
    return new ImapFlow({
      host: connection.imapHost,
      port: connection.imapPort,
      secure: isSecureModeTls(connection.secureMode),
      auth: { user: connection.username ?? '', pass: secret.password },
      logger: false,
    });
  }

  private async onNewMail(mailAccountId: string): Promise<void> {
    const queued = await this.queueService.enqueueSync(mailAccountId);
    if (!queued) {
      await this.syncService.syncAccount(mailAccountId).catch((error) => {
        this.logger.warn(`Inline IDLE sync failed for ${mailAccountId}: ${String(error)}`);
      });
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
