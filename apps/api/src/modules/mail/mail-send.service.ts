import { Inject, Injectable, Logger } from '@nestjs/common';
import { MailDeliveryLogKind, PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { DriveR2Client } from '../drive/drive-r2.client';
import { classifyMailProviderError } from './mail-provider-error.classify';
import { loadOutboundAttachmentParts } from './mail-send-attachments.ops';
import { gateOutboundSendAttempt } from './mail-send-claim.ops';
import { buildSendMessageInput, loadOutboundSendContext } from './mail-send.ops';
import {
  markMailboxNeedsReconnect,
  markOutboundFailed,
  markOutboundSent,
} from './mail-send-outcome.ops';
import { MailProviderAdapterFactory } from './providers/mail-provider-adapter.factory';

@Injectable()
export class MailSendService {
  private readonly logger = new Logger(MailSendService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly adapterFactory: MailProviderAdapterFactory,
    private readonly auditService: AuditService,
    private readonly driveR2: DriveR2Client,
  ) {}

  /** Worker send: claim SENDING, call provider once, throw transient errors for BullMQ. */
  async sendQueuedMessage(
    mailAccountId: string,
    messageId: string,
    actorEmployeeId: string,
  ): Promise<void> {
    const gate = await gateOutboundSendAttempt(this.prisma, messageId, mailAccountId);
    if (gate.action === 'exit') {
      return;
    }
    if (gate.action === 'finalize_sent') {
      await markOutboundSent({
        prisma: this.prisma,
        auditService: this.auditService,
        messageId,
        mailAccountId,
        actorEmployeeId,
        providerMessageId: gate.providerMessageId,
        messageIdHeader: null,
      });
      return;
    }
    const context = await loadOutboundSendContext(this.prisma, mailAccountId, messageId);
    if (!context) {
      return;
    }
    try {
      const attachments = await loadOutboundAttachmentParts(
        this.prisma,
        this.driveR2,
        messageId,
        context.bodyHtml,
      );
      const adapter = await this.adapterFactory.forConnection(context.connection);
      const result = await adapter.sendMessage(buildSendMessageInput(context, attachments));
      await markOutboundSent({
        prisma: this.prisma,
        auditService: this.auditService,
        messageId,
        mailAccountId,
        actorEmployeeId,
        providerMessageId: result.providerMessageId,
        messageIdHeader: result.messageIdHeader,
      });
    } catch (error) {
      await this.handleSendError(mailAccountId, messageId, actorEmployeeId, error);
    }
  }

  private async handleSendError(
    mailAccountId: string,
    messageId: string,
    actorEmployeeId: string,
    error: unknown,
  ): Promise<void> {
    const errorClass = classifyMailProviderError(error);
    const detail = error instanceof Error ? error.message : 'unknown error';
    this.logger.error(`Outbound send ${errorClass} for message ${messageId}: ${detail}`);
    if (errorClass === 'transient') {
      throw error;
    }
    const kind: MailDeliveryLogKind =
      errorClass === 'ambiguous' ? 'OUTCOME_UNKNOWN' : 'OUTBOUND_SEND_FAILED';
    await markOutboundFailed({
      prisma: this.prisma,
      auditService: this.auditService,
      messageId,
      mailAccountId,
      actorEmployeeId,
      detail,
      kind,
    });
    if (errorClass === 'auth') {
      await markMailboxNeedsReconnect(this.prisma, mailAccountId, detail);
    }
  }
}
