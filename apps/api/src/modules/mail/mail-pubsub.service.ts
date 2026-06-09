import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { MailQueueService } from './mail-queue.service';
import { MailSyncService } from './mail-sync.service';
import { MailProviderConfig } from './providers/mail-provider.config';

interface PubSubPushBody {
  message?: { data?: string };
}

interface GmailNotification {
  emailAddress?: string;
  historyId?: string;
}

/** Handles Gmail Pub/Sub push notifications → triggers a mailbox sync. */
@Injectable()
export class MailPubSubService {
  private readonly logger = new Logger(MailPubSubService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly queueService: MailQueueService,
    private readonly syncService: MailSyncService,
    private readonly config: MailProviderConfig,
  ) {}

  async handlePush(token: string | undefined, body: PubSubPushBody): Promise<void> {
    const expected = this.config.gmailPubsubVerificationToken;
    if (expected && token !== expected) {
      throw new UnauthorizedException('Invalid Pub/Sub verification token');
    }
    const notification = this.decode(body);
    if (!notification?.emailAddress) {
      return;
    }
    const account = await this.prisma.mailAccount.findFirst({
      where: { providerType: 'GMAIL', emailAddress: notification.emailAddress, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!account) {
      return;
    }
    const queued = await this.queueService.enqueueSync(account.id);
    if (!queued) {
      await this.syncService.syncAccount(account.id);
    }
  }

  private decode(body: PubSubPushBody): GmailNotification | null {
    const data = body.message?.data;
    if (!data) {
      return null;
    }
    try {
      const json = Buffer.from(data, 'base64').toString('utf8');
      return JSON.parse(json) as GmailNotification;
    } catch (error) {
      this.logger.warn(`Failed to decode Pub/Sub payload: ${String(error)}`);
      return null;
    }
  }
}
