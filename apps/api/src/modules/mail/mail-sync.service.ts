import { Inject, Injectable, Logger } from '@nestjs/common';
import { MailSyncLogKind, PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { MailImapIdleService } from './mail-imap-idle.service';
import { applyMailSyncFailure } from './mail-sync-failure.ops';
import type { ProviderSyncCursor, WatchOrIdleResult } from './providers/mail-provider-adapter';
import { MailProviderAdapterFactory } from './providers/mail-provider-adapter.factory';
import { upsertNormalizedMessages } from './mail-sync-upsert.ops';

@Injectable()
export class MailSyncService {
  private readonly logger = new Logger(MailSyncService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly adapterFactory: MailProviderAdapterFactory,
    private readonly idleService: MailImapIdleService,
  ) {}

  /** Full receive flow: fetch delta → upsert → persist cursor → watch/IDLE side-effects. */
  async syncAccount(mailAccountId: string): Promise<{ stored: number }> {
    const account = await this.prisma.mailAccount.findUnique({
      where: { id: mailAccountId },
      include: { providerConnection: true },
    });
    if (!account?.providerConnection) {
      return { stored: 0 };
    }
    if (account.status === 'DISABLED' || account.status === 'PAUSED') {
      return { stored: 0 };
    }
    if (account.status === 'NEEDS_RECONNECT') {
      return { stored: 0 };
    }
    await this.log(mailAccountId, MailSyncLogKind.SYNC_STARTED);
    await this.prisma.mailAccount.update({
      where: { id: mailAccountId },
      data: { status: 'SYNCING' },
    });
    try {
      return await this.runSync(mailAccountId, account);
    } catch (error) {
      const outcome = await applyMailSyncFailure(this.prisma, mailAccountId, error);
      const detail = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`Mail sync ${outcome} for account ${mailAccountId}: ${detail}`);
      if (outcome === 'retry') {
        throw error;
      }
      return { stored: 0 };
    }
  }

  private async runSync(
    mailAccountId: string,
    account: {
      emailAddress: string;
      displayName: string | null;
      providerType: string;
      providerConnection: {
        username: string | null;
        imapHost: string | null;
        imapPort: number | null;
        secureMode: string | null;
        smtpHost: string | null;
        smtpPort: number | null;
        smtpSecureMode: string | null;
        gmailHistoryId: string | null;
        imapUidValidity: string | null;
        imapLastUid: string | null;
      };
    },
  ): Promise<{ stored: number }> {
    const connection = account.providerConnection;
    const adapter = await this.adapterFactory.forConnection({
      mailAccountId,
      emailAddress: account.emailAddress,
      displayName: account.displayName,
      providerType: account.providerType,
      username: connection.username,
      imapHost: connection.imapHost,
      imapPort: connection.imapPort,
      secureMode: connection.secureMode,
      smtpHost: connection.smtpHost,
      smtpPort: connection.smtpPort,
      smtpSecureMode: connection.smtpSecureMode,
    });
    const cursor: ProviderSyncCursor = {
      gmailHistoryId: connection.gmailHistoryId,
      imapUidValidity: connection.imapUidValidity ?? undefined,
      imapLastUid: connection.imapLastUid ?? undefined,
    };
    const result = await adapter.fetchDelta(cursor);
    const stored = await upsertNormalizedMessages(this.prisma, mailAccountId, result.messages);
    await this.persistCursorAndHealth(mailAccountId, result.cursor);
    await this.afterSuccessfulSync(mailAccountId, account.providerType, adapter);
    await this.log(mailAccountId, MailSyncLogKind.SYNC_COMPLETED, `stored=${stored}`);
    return { stored };
  }

  private async afterSuccessfulSync(
    mailAccountId: string,
    providerType: string,
    adapter: { startWatchOrIdle: () => Promise<WatchOrIdleResult> },
  ): Promise<void> {
    if (providerType === 'CORPORATE_IMAP_SMTP') {
      this.idleService.ensureIdle(mailAccountId);
      return;
    }
    if (providerType !== 'GMAIL') {
      return;
    }
    const watch = await adapter.startWatchOrIdle();
    if (!watch.watchExpiresAt) {
      return;
    }
    await this.prisma.mailProviderConnection.update({
      where: { mailAccountId },
      data: { gmailWatchExpiresAt: watch.watchExpiresAt },
    });
    await this.log(mailAccountId, MailSyncLogKind.WATCH_RENEWED);
  }

  private async persistCursorAndHealth(
    mailAccountId: string,
    cursor: ProviderSyncCursor,
  ): Promise<void> {
    await this.prisma.mailProviderConnection.update({
      where: { mailAccountId },
      data: {
        gmailHistoryId: cursor.gmailHistoryId ?? undefined,
        imapUidValidity: cursor.imapUidValidity ?? undefined,
        imapLastUid: cursor.imapLastUid ?? undefined,
        status: 'CONNECTED',
        lastValidatedAt: new Date(),
      },
    });
    await this.prisma.mailAccount.update({
      where: { id: mailAccountId },
      data: { status: 'ACTIVE', lastSyncAt: new Date() },
    });
  }

  private async log(mailAccountId: string, kind: MailSyncLogKind, detail?: string): Promise<void> {
    await this.prisma.mailSyncLog.create({ data: { mailAccountId, kind, detail: detail ?? null } });
  }
}
