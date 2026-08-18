import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import {
  MAIL_ORPHAN_QUEUED_AGE_MS,
  MAIL_OUTBOUND_RECONCILE_BATCH_SIZE,
  MAIL_STALE_SENDING_AGE_MS,
} from './mail-outbound-runtime.constants';
import { MailQueueService } from './mail-queue.service';
import { markOutboundSent } from './mail-send-outcome.ops';
import { AuditService } from '../audit/audit.service';

export interface MailOutboundReconcileResult {
  queuedEnqueued: number;
  sendingRequeued: number;
  sendingFinalized: number;
}

@Injectable()
export class MailOutboundReconcileService {
  private readonly logger = new Logger(MailOutboundReconcileService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly queue: MailQueueService,
    private readonly auditService: AuditService,
  ) {}

  async reconcileOrphans(): Promise<MailOutboundReconcileResult> {
    const queuedEnqueued = await this.reenqueueOrphanQueued();
    const sendingRequeued = await this.requeueStaleSendingWithoutProviderId();
    const sendingFinalized = await this.finalizeSendingWithProviderId();
    this.logger.log(
      `mail-outbound-reconcile queued=${queuedEnqueued} requeued=${sendingRequeued} finalized=${sendingFinalized}`,
    );
    return { queuedEnqueued, sendingRequeued, sendingFinalized };
  }

  private async reenqueueOrphanQueued(): Promise<number> {
    const cutoff = new Date(Date.now() - MAIL_ORPHAN_QUEUED_AGE_MS);
    const rows = await this.prisma.emailMessage.findMany({
      where: { direction: 'OUTBOUND', deliveryStatus: 'QUEUED', updatedAt: { lt: cutoff } },
      take: MAIL_OUTBOUND_RECONCILE_BATCH_SIZE,
      select: { id: true, mailAccountId: true },
    });
    let count = 0;
    for (const row of rows) {
      const actorEmployeeId = await this.resolveActorEmployeeId(row.id, row.mailAccountId);
      if (!actorEmployeeId) {
        continue;
      }
      if (
        await this.queue.enqueueSend({
          mailAccountId: row.mailAccountId,
          messageId: row.id,
          actorEmployeeId,
        })
      ) {
        count += 1;
      }
    }
    return count;
  }

  private async requeueStaleSendingWithoutProviderId(): Promise<number> {
    const cutoff = new Date(Date.now() - MAIL_STALE_SENDING_AGE_MS);
    const rows = await this.prisma.emailMessage.findMany({
      where: {
        direction: 'OUTBOUND',
        deliveryStatus: 'SENDING',
        providerMessageId: null,
        updatedAt: { lt: cutoff },
      },
      take: MAIL_OUTBOUND_RECONCILE_BATCH_SIZE,
      select: { id: true, mailAccountId: true },
    });
    let count = 0;
    for (const row of rows) {
      const reset = await this.prisma.emailMessage.updateMany({
        where: { id: row.id, deliveryStatus: 'SENDING', providerMessageId: null },
        data: { deliveryStatus: 'QUEUED' },
      });
      if (reset.count === 0) {
        continue;
      }
      const actorEmployeeId = await this.resolveActorEmployeeId(row.id, row.mailAccountId);
      if (
        actorEmployeeId &&
        (await this.queue.enqueueSend({
          mailAccountId: row.mailAccountId,
          messageId: row.id,
          actorEmployeeId,
        }))
      ) {
        count += 1;
      }
    }
    return count;
  }

  private async finalizeSendingWithProviderId(): Promise<number> {
    const rows = await this.prisma.emailMessage.findMany({
      where: {
        direction: 'OUTBOUND',
        deliveryStatus: 'SENDING',
        providerMessageId: { not: null },
      },
      take: MAIL_OUTBOUND_RECONCILE_BATCH_SIZE,
      select: { id: true, mailAccountId: true, providerMessageId: true, messageIdHeader: true },
    });
    let count = 0;
    for (const row of rows) {
      const actorEmployeeId = await this.resolveActorEmployeeId(row.id, row.mailAccountId);
      if (!actorEmployeeId) {
        continue;
      }
      await markOutboundSent({
        prisma: this.prisma,
        auditService: this.auditService,
        messageId: row.id,
        mailAccountId: row.mailAccountId,
        actorEmployeeId,
        providerMessageId: row.providerMessageId,
        messageIdHeader: row.messageIdHeader,
      });
      count += 1;
    }
    return count;
  }

  private async resolveActorEmployeeId(
    messageId: string,
    mailAccountId: string,
  ): Promise<string | null> {
    const log = await this.prisma.mailDeliveryLog.findFirst({
      where: { emailMessageId: messageId },
      orderBy: { createdAt: 'desc' },
      select: { actorEmployeeId: true },
    });
    if (log) {
      return log.actorEmployeeId;
    }
    const account = await this.prisma.mailAccount.findUnique({
      where: { id: mailAccountId },
      select: { ownerEmployeeId: true, createdByEmployeeId: true },
    });
    return account?.ownerEmployeeId ?? account?.createdByEmployeeId ?? null;
  }
}
