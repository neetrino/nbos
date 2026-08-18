import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MailDeliveryLogKind, PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import {
  MAIL_AUDIT_ACTION_OUTBOUND_FAILED_RESET_TO_DRAFT,
  MAIL_AUDIT_ACTION_OUTBOUND_MESSAGE_CANCELLED,
  MAIL_AUDIT_ACTION_OUTBOUND_MESSAGE_QUEUED,
  MAIL_AUDIT_ACTION_OUTBOUND_RETRY_SEND,
  MAIL_AUDIT_ENTITY_MESSAGE,
} from './mail-audit.constants';
import { appendMailDeliveryLog } from './mail-delivery-log-append.ops';
import { publishMailOutboundCancelledNotifications } from './mail-outbound-cancel-notify.ops';
import { cancelOutboundDraftOrQueued } from './mail-outbound-cancel.ops';
import { dispatchQueuedOutboundSend } from './mail-outbound-dispatch';
import { publishMailOutboundQueuedNotifications } from './mail-outbound-queue-notify.ops';
import { queueOutboundDraftMessage } from './mail-outbound-queue.ops';
import { publishMailOutboundFailedResetToDraftNotifications } from './mail-outbound-reset-failed-notify.ops';
import { applyFailedOutboundResetToDraft } from './mail-outbound-retry-failed.ops';
import { queueFailedOutboundForRetry } from './mail-outbound-retry-send.ops';
import { MailQueueService } from './mail-queue.service';
import { MailSendService } from './mail-send.service';
import { requireMailAccountSendRole } from './mail-send-access.ops';
import { fetchMailThreadMessageForEdit } from './mail-thread-message-access.ops';
import { requireMailThreadDetailDto } from './mail-thread-detail-require.ops';
import type { MailThreadDetailDto } from './mail.types';

@Injectable()
export class MailOutboundSendMutationService {
  private readonly logger = new Logger(MailOutboundSendMutationService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly queue: MailQueueService,
    private readonly sendService: MailSendService,
  ) {}

  async queueOutboundDraft(
    employeeId: string,
    accessScope: string,
    threadId: string,
    messageId: string,
  ): Promise<MailThreadDetailDto> {
    const access = await this.requireOutboundMessage(employeeId, accessScope, threadId, messageId);
    const { message: msg } = access;
    if (msg.direction !== 'OUTBOUND' || msg.deliveryStatus !== 'DRAFT') {
      throw new BadRequestException('Only outbound drafts can be queued for send');
    }
    await requireMailAccountSendRole(this.prisma, {
      mailAccountId: access.thread.mailAccountId,
      employeeId,
      viewScope: accessScope,
    });
    const updated = await queueOutboundDraftMessage(this.prisma, { threadId, messageId });
    if (!updated) {
      throw new BadRequestException('Only outbound drafts can be queued for send');
    }
    await this.auditService.log({
      entityType: MAIL_AUDIT_ENTITY_MESSAGE,
      entityId: messageId,
      action: MAIL_AUDIT_ACTION_OUTBOUND_MESSAGE_QUEUED,
      userId: employeeId,
      changes: { threadId } satisfies InputJsonValue,
    });
    const account = access.thread.mailAccount;
    await appendMailDeliveryLog(this.prisma, {
      emailMessageId: messageId,
      mailAccountId: account.id,
      actorEmployeeId: employeeId,
      kind: MailDeliveryLogKind.OUTBOUND_QUEUED,
    });
    await publishMailOutboundQueuedNotifications(this.notificationService, {
      actorEmployeeId: employeeId,
      threadId,
      messageId,
      subject: msg.subject,
      emailAddress: account.emailAddress,
      ownerEmployeeId: account.ownerEmployeeId,
    });
    await dispatchQueuedOutboundSend({
      queue: this.queue,
      sendService: this.sendService,
      logger: this.logger,
      mailAccountId: account.id,
      messageId,
      actorEmployeeId: employeeId,
    });
    return requireMailThreadDetailDto(this.prisma, {
      employeeId,
      viewScope: accessScope,
      threadId,
    });
  }

  async retryFailedOutboundSend(
    employeeId: string,
    accessScope: string,
    threadId: string,
    messageId: string,
  ): Promise<MailThreadDetailDto> {
    const access = await this.requireOutboundMessage(employeeId, accessScope, threadId, messageId);
    const { message: msg } = access;
    if (msg.direction !== 'OUTBOUND' || msg.deliveryStatus !== 'FAILED') {
      throw new BadRequestException('Only failed outbound messages can be retried');
    }
    await requireMailAccountSendRole(this.prisma, {
      mailAccountId: access.thread.mailAccountId,
      employeeId,
      viewScope: accessScope,
    });
    const updated = await queueFailedOutboundForRetry(this.prisma, { threadId, messageId });
    if (!updated) {
      throw new BadRequestException('Only failed outbound messages can be retried');
    }
    await this.auditService.log({
      entityType: MAIL_AUDIT_ENTITY_MESSAGE,
      entityId: messageId,
      action: MAIL_AUDIT_ACTION_OUTBOUND_RETRY_SEND,
      userId: employeeId,
      changes: { threadId } satisfies InputJsonValue,
    });
    const account = access.thread.mailAccount;
    await appendMailDeliveryLog(this.prisma, {
      emailMessageId: messageId,
      mailAccountId: account.id,
      actorEmployeeId: employeeId,
      kind: MailDeliveryLogKind.OUTBOUND_QUEUED,
      detail: 'retry-send',
    });
    await dispatchQueuedOutboundSend({
      queue: this.queue,
      sendService: this.sendService,
      logger: this.logger,
      mailAccountId: account.id,
      messageId,
      actorEmployeeId: employeeId,
    });
    return requireMailThreadDetailDto(this.prisma, {
      employeeId,
      viewScope: accessScope,
      threadId,
    });
  }

  async cancelOutboundDraftOrQueued(
    employeeId: string,
    accessScope: string,
    threadId: string,
    messageId: string,
  ): Promise<MailThreadDetailDto> {
    const access = await this.requireOutboundMessage(employeeId, accessScope, threadId, messageId);
    const { message: msg } = access;
    if (msg.direction !== 'OUTBOUND') {
      throw new BadRequestException('Only outbound messages can be cancelled');
    }
    if (msg.deliveryStatus !== 'DRAFT' && msg.deliveryStatus !== 'QUEUED') {
      throw new BadRequestException('Only draft or queued outbound messages can be cancelled');
    }
    const previousDeliveryStatus = msg.deliveryStatus;
    const updated = await cancelOutboundDraftOrQueued(this.prisma, { threadId, messageId });
    if (!updated) {
      throw new BadRequestException('Only draft or queued outbound messages can be cancelled');
    }
    await this.auditService.log({
      entityType: MAIL_AUDIT_ENTITY_MESSAGE,
      entityId: messageId,
      action: MAIL_AUDIT_ACTION_OUTBOUND_MESSAGE_CANCELLED,
      userId: employeeId,
      changes: { threadId, previousDeliveryStatus } satisfies InputJsonValue,
    });
    const account = access.thread.mailAccount;
    await appendMailDeliveryLog(this.prisma, {
      emailMessageId: messageId,
      mailAccountId: account.id,
      actorEmployeeId: employeeId,
      kind: MailDeliveryLogKind.OUTBOUND_SEND_CANCELLED,
      detail: `previousDeliveryStatus=${previousDeliveryStatus}`,
    });
    await publishMailOutboundCancelledNotifications(this.notificationService, {
      actorEmployeeId: employeeId,
      threadId,
      messageId,
      subject: msg.subject,
      emailAddress: account.emailAddress,
      ownerEmployeeId: account.ownerEmployeeId,
      previousDeliveryStatus,
    });
    return requireMailThreadDetailDto(this.prisma, {
      employeeId,
      viewScope: accessScope,
      threadId,
    });
  }

  async resetFailedOutboundToDraft(
    employeeId: string,
    accessScope: string,
    threadId: string,
    messageId: string,
  ): Promise<MailThreadDetailDto> {
    const access = await this.requireOutboundMessage(employeeId, accessScope, threadId, messageId);
    const { message: msg } = access;
    if (msg.direction !== 'OUTBOUND' || msg.deliveryStatus !== 'FAILED') {
      throw new BadRequestException('Only failed outbound messages can be reset to draft');
    }
    const updated = await applyFailedOutboundResetToDraft(this.prisma, { threadId, messageId });
    if (!updated) {
      throw new BadRequestException('Only failed outbound messages can be reset to draft');
    }
    await this.auditService.log({
      entityType: MAIL_AUDIT_ENTITY_MESSAGE,
      entityId: messageId,
      action: MAIL_AUDIT_ACTION_OUTBOUND_FAILED_RESET_TO_DRAFT,
      userId: employeeId,
      changes: { threadId } satisfies InputJsonValue,
    });
    const account = access.thread.mailAccount;
    await appendMailDeliveryLog(this.prisma, {
      emailMessageId: messageId,
      mailAccountId: account.id,
      actorEmployeeId: employeeId,
      kind: MailDeliveryLogKind.OUTBOUND_FAILED_RESET_TO_DRAFT,
    });
    await publishMailOutboundFailedResetToDraftNotifications(this.notificationService, {
      actorEmployeeId: employeeId,
      threadId,
      messageId,
      subject: msg.subject,
      emailAddress: account.emailAddress,
      ownerEmployeeId: account.ownerEmployeeId,
    });
    return requireMailThreadDetailDto(this.prisma, {
      employeeId,
      viewScope: accessScope,
      threadId,
    });
  }

  private async requireOutboundMessage(
    employeeId: string,
    accessScope: string,
    threadId: string,
    messageId: string,
  ) {
    const access = await fetchMailThreadMessageForEdit(this.prisma, {
      threadId,
      messageId,
      employeeId,
      accessScope,
    });
    if (access.status === 'no_mailbox') {
      throw new NotFoundException('Thread not found');
    }
    if (access.status === 'no_message') {
      throw new NotFoundException('Message not found');
    }
    return access;
  }
}
