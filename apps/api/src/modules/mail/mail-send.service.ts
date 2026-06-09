import { Inject, Injectable, Logger } from '@nestjs/common';
import { MailDeliveryLogKind, PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import {
  MAIL_AUDIT_ACTION_OUTBOUND_SENT,
  MAIL_AUDIT_ACTION_OUTBOUND_SEND_FAILED,
  MAIL_AUDIT_ENTITY_MESSAGE,
} from './mail-audit.constants';
import { appendMailDeliveryLog } from './mail-delivery-log-append.ops';
import { MailProviderAdapterFactory } from './providers/mail-provider-adapter.factory';
import { buildSendMessageInput, loadOutboundSendContext } from './mail-send.ops';

@Injectable()
export class MailSendService {
  private readonly logger = new Logger(MailSendService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly adapterFactory: MailProviderAdapterFactory,
    private readonly auditService: AuditService,
  ) {}

  /** Sends a QUEUED outbound message via its mailbox provider and records the outcome. */
  async sendQueuedMessage(
    mailAccountId: string,
    messageId: string,
    actorEmployeeId: string,
  ): Promise<void> {
    const context = await loadOutboundSendContext(this.prisma, mailAccountId, messageId);
    if (!context) {
      return;
    }
    try {
      const adapter = await this.adapterFactory.forConnection(context.connection);
      const result = await adapter.sendMessage(buildSendMessageInput(context));
      await this.markSent(messageId, mailAccountId, actorEmployeeId, result.messageIdHeader);
    } catch (error) {
      await this.markFailed(messageId, mailAccountId, actorEmployeeId, error);
    }
  }

  private async markSent(
    messageId: string,
    mailAccountId: string,
    actorEmployeeId: string,
    messageIdHeader: string | null,
  ): Promise<void> {
    const now = new Date();
    const message = await this.prisma.emailMessage.update({
      where: { id: messageId },
      data: {
        deliveryStatus: 'SENT',
        sentAt: now,
        ...(messageIdHeader ? { messageIdHeader } : {}),
      },
      select: { threadId: true },
    });
    await this.prisma.emailThread.update({
      where: { id: message.threadId },
      data: { lastOutboundAt: now, lastMessageAt: now },
    });
    await appendMailDeliveryLog(this.prisma, {
      emailMessageId: messageId,
      mailAccountId,
      actorEmployeeId,
      kind: MailDeliveryLogKind.OUTBOUND_SENT,
    });
    const changes: InputJsonValue = { mailAccountId };
    await this.auditService.log({
      entityType: MAIL_AUDIT_ENTITY_MESSAGE,
      entityId: messageId,
      action: MAIL_AUDIT_ACTION_OUTBOUND_SENT,
      userId: actorEmployeeId,
      changes,
    });
  }

  private async markFailed(
    messageId: string,
    mailAccountId: string,
    actorEmployeeId: string,
    error: unknown,
  ): Promise<void> {
    const detail = error instanceof Error ? error.message : 'unknown error';
    this.logger.error(`Outbound send failed for message ${messageId}: ${detail}`);
    await this.prisma.emailMessage.update({
      where: { id: messageId },
      data: { deliveryStatus: 'FAILED' },
    });
    await appendMailDeliveryLog(this.prisma, {
      emailMessageId: messageId,
      mailAccountId,
      actorEmployeeId,
      kind: MailDeliveryLogKind.OUTBOUND_SEND_FAILED,
      detail,
    });
    const changes: InputJsonValue = { mailAccountId, error: detail };
    await this.auditService.log({
      entityType: MAIL_AUDIT_ENTITY_MESSAGE,
      entityId: messageId,
      action: MAIL_AUDIT_ACTION_OUTBOUND_SEND_FAILED,
      userId: actorEmployeeId,
      changes,
    });
  }
}
