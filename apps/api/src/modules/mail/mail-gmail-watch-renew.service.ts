import { Inject, Injectable, Logger } from '@nestjs/common';
import { MailSyncLogKind, PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import {
  MAIL_GMAIL_WATCH_RENEW_HORIZON_MS,
  MAIL_SYNCABLE_ACCOUNT_STATUSES,
} from './mail-sync-runtime.constants';
import { MailProviderAdapterFactory } from './providers/mail-provider-adapter.factory';
import { MailProviderConfig } from './providers/mail-provider.config';

export interface MailGmailWatchRenewResult {
  renewed: number;
  skipped: number;
}

@Injectable()
export class MailGmailWatchRenewService {
  private readonly logger = new Logger(MailGmailWatchRenewService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly adapterFactory: MailProviderAdapterFactory,
    private readonly config: MailProviderConfig,
  ) {}

  async renewExpiringWatches(): Promise<MailGmailWatchRenewResult> {
    if (!this.config.gmailPubsubTopic) {
      this.logger.log('mail-gmail-watch-renew skipped: topic not configured');
      return { renewed: 0, skipped: 0 };
    }
    const horizon = new Date(Date.now() + MAIL_GMAIL_WATCH_RENEW_HORIZON_MS);
    const accounts = await this.prisma.mailAccount.findMany({
      where: {
        providerType: 'GMAIL',
        status: { in: [...MAIL_SYNCABLE_ACCOUNT_STATUSES] },
        providerConnection: {
          OR: [{ gmailWatchExpiresAt: null }, { gmailWatchExpiresAt: { lt: horizon } }],
        },
      },
      include: { providerConnection: true },
    });
    let renewed = 0;
    let skipped = 0;
    for (const account of accounts) {
      const ok = await this.renewOne(account);
      if (ok) {
        renewed += 1;
      } else {
        skipped += 1;
      }
    }
    this.logger.log(`mail-gmail-watch-renew renewed=${renewed} skipped=${skipped}`);
    return { renewed, skipped };
  }

  private async renewOne(account: {
    id: string;
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
    } | null;
  }): Promise<boolean> {
    const connection = account.providerConnection;
    if (!connection) {
      return false;
    }
    try {
      return await this.renewWatchForConnection(account.id, {
        mailAccountId: account.id,
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
    } catch (error) {
      this.logger.warn(`Gmail watch renew failed for ${account.id}: ${String(error)}`);
      return false;
    }
  }

  private async renewWatchForConnection(
    mailAccountId: string,
    connection: Parameters<MailProviderAdapterFactory['forConnection']>[0],
  ): Promise<boolean> {
    const adapter = await this.adapterFactory.forConnection(connection);
    const watch = await adapter.startWatchOrIdle();
    if (!watch.watchExpiresAt) {
      return false;
    }
    await this.prisma.mailProviderConnection.update({
      where: { mailAccountId },
      data: { gmailWatchExpiresAt: watch.watchExpiresAt },
    });
    await this.prisma.mailSyncLog.create({
      data: { mailAccountId, kind: MailSyncLogKind.WATCH_RENEWED },
    });
    return true;
  }
}
