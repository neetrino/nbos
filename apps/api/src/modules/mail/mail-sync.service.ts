import { Inject, Injectable, Logger } from '@nestjs/common';
import { MailSyncLogKind, PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { MailProviderAdapterFactory } from './providers/mail-provider-adapter.factory';
import type { ProviderSyncCursor } from './providers/mail-provider-adapter';
import { upsertNormalizedMessages } from './mail-sync-upsert.ops';

@Injectable()
export class MailSyncService {
  private readonly logger = new Logger(MailSyncService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly adapterFactory: MailProviderAdapterFactory,
  ) {}

  /** Full receive flow for one mailbox: fetch delta → normalize → upsert → advance cursor. */
  async syncAccount(mailAccountId: string): Promise<{ stored: number }> {
    const account = await this.prisma.mailAccount.findUnique({
      where: { id: mailAccountId },
      include: { providerConnection: true },
    });
    if (!account?.providerConnection) {
      return { stored: 0 };
    }
    const connection = account.providerConnection;
    await this.log(mailAccountId, MailSyncLogKind.SYNC_STARTED);
    await this.prisma.mailAccount.update({
      where: { id: mailAccountId },
      data: { status: 'SYNCING' },
    });
    try {
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
      await this.log(mailAccountId, MailSyncLogKind.SYNC_COMPLETED, `stored=${stored}`);
      return { stored };
    } catch (error) {
      await this.handleSyncFailure(mailAccountId, error);
      return { stored: 0 };
    }
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

  private async handleSyncFailure(mailAccountId: string, error: unknown): Promise<void> {
    const detail = error instanceof Error ? error.message : 'unknown error';
    this.logger.error(`Mail sync failed for account ${mailAccountId}: ${detail}`);
    await this.log(mailAccountId, MailSyncLogKind.SYNC_FAILED, detail);
    await this.prisma.mailAccount.update({
      where: { id: mailAccountId },
      data: { status: 'DEGRADED', lastErrorAt: new Date() },
    });
    await this.prisma.mailProviderConnection.update({
      where: { mailAccountId },
      data: { status: 'DEGRADED', lastErrorAt: new Date(), lastErrorMessage: detail },
    });
  }

  private async log(mailAccountId: string, kind: MailSyncLogKind, detail?: string): Promise<void> {
    await this.prisma.mailSyncLog.create({ data: { mailAccountId, kind, detail: detail ?? null } });
  }
}
