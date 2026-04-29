import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MailDeliveryLogKind, PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import {
  MAIL_AUDIT_ACTION_OUTBOUND_FAILED_RESET_TO_DRAFT,
  MAIL_AUDIT_ACTION_OUTBOUND_MESSAGE_CANCELLED,
  MAIL_AUDIT_ACTION_OUTBOUND_MESSAGE_QUEUED,
  MAIL_AUDIT_ACTION_OUTBOUND_SEND_STUB_FAILED,
  MAIL_AUDIT_ENTITY_MESSAGE,
} from './mail-audit.constants';
import { appendMailDeliveryLog } from './mail-delivery-log-append.ops';
import { publishMailOutboundCancelledNotifications } from './mail-outbound-cancel-notify.ops';
import { cancelOutboundDraftOrQueued } from './mail-outbound-cancel.ops';
import { publishMailOutboundSendStubFailedNotifications } from './mail-outbound-finalize-stub-notify.ops';
import { failQueuedOutboundStubNoProvider } from './mail-outbound-finalize-stub.ops';
import { publishMailOutboundQueuedNotifications } from './mail-outbound-queue-notify.ops';
import { queueOutboundDraftMessage } from './mail-outbound-queue.ops';
import { publishMailOutboundFailedResetToDraftNotifications } from './mail-outbound-reset-failed-notify.ops';
import { applyFailedOutboundResetToDraft } from './mail-outbound-retry-failed.ops';
import { MAIL_OUTBOUND_STUB_FAIL_REASON_NO_PROVIDER } from './mail-outbound-stub.constants';
import { fetchMailThreadMessageForEdit } from './mail-thread-message-access.ops';
import { requireMailThreadDetailDto } from './mail-thread-detail-require.ops';
import type { MailThreadDetailDto } from './mail.types';

@Injectable()
export class MailOutboundSendMutationService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  async queueOutboundDraft(
    employeeId: string,
    accessScope: string,
    threadId: string,
    messageId: string,
  ): Promise<MailThreadDetailDto> {
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
    const { message: msg } = access;
    if (msg.direction !== 'OUTBOUND' || msg.deliveryStatus !== 'DRAFT') {
      throw new BadRequestException('Only outbound drafts can be queued for send');
    }
    const updated = await queueOutboundDraftMessage(this.prisma, { threadId, messageId });
    if (!updated) {
      throw new BadRequestException('Only outbound drafts can be queued for send');
    }
    const auditChanges: InputJsonValue = { threadId };
    await this.auditService.log({
      entityType: MAIL_AUDIT_ENTITY_MESSAGE,
      entityId: messageId,
      action: MAIL_AUDIT_ACTION_OUTBOUND_MESSAGE_QUEUED,
      userId: employeeId,
      changes: auditChanges,
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
    return requireMailThreadDetailDto(this.prisma, {
      employeeId,
      viewScope: accessScope,
      threadId,
    });
  }

  async finalizeQueuedOutboundStub(
    employeeId: string,
    accessScope: string,
    threadId: string,
    messageId: string,
  ): Promise<MailThreadDetailDto> {
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
    const { message: msg } = access;
    if (msg.direction !== 'OUTBOUND' || msg.deliveryStatus !== 'QUEUED') {
      throw new BadRequestException('Only queued outbound messages can be finalized (stub)');
    }
    const updated = await failQueuedOutboundStubNoProvider(this.prisma, { threadId, messageId });
    if (!updated) {
      throw new BadRequestException('Only queued outbound messages can be finalized (stub)');
    }
    const auditChanges: InputJsonValue = {
      threadId,
      reason: MAIL_OUTBOUND_STUB_FAIL_REASON_NO_PROVIDER,
    };
    await this.auditService.log({
      entityType: MAIL_AUDIT_ENTITY_MESSAGE,
      entityId: messageId,
      action: MAIL_AUDIT_ACTION_OUTBOUND_SEND_STUB_FAILED,
      userId: employeeId,
      changes: auditChanges,
    });
    const account = access.thread.mailAccount;
    await appendMailDeliveryLog(this.prisma, {
      emailMessageId: messageId,
      mailAccountId: account.id,
      actorEmployeeId: employeeId,
      kind: MailDeliveryLogKind.OUTBOUND_SEND_STUB_FAILED,
      detail: MAIL_OUTBOUND_STUB_FAIL_REASON_NO_PROVIDER,
    });
    await publishMailOutboundSendStubFailedNotifications(this.notificationService, {
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

  async cancelOutboundDraftOrQueued(
    employeeId: string,
    accessScope: string,
    threadId: string,
    messageId: string,
  ): Promise<MailThreadDetailDto> {
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
    const auditChanges: InputJsonValue = {
      threadId,
      previousDeliveryStatus,
    };
    await this.auditService.log({
      entityType: MAIL_AUDIT_ENTITY_MESSAGE,
      entityId: messageId,
      action: MAIL_AUDIT_ACTION_OUTBOUND_MESSAGE_CANCELLED,
      userId: employeeId,
      changes: auditChanges,
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
    const { message: msg } = access;
    if (msg.direction !== 'OUTBOUND' || msg.deliveryStatus !== 'FAILED') {
      throw new BadRequestException('Only failed outbound messages can be reset to draft');
    }
    const updated = await applyFailedOutboundResetToDraft(this.prisma, { threadId, messageId });
    if (!updated) {
      throw new BadRequestException('Only failed outbound messages can be reset to draft');
    }
    const auditChanges: InputJsonValue = { threadId };
    await this.auditService.log({
      entityType: MAIL_AUDIT_ENTITY_MESSAGE,
      entityId: messageId,
      action: MAIL_AUDIT_ACTION_OUTBOUND_FAILED_RESET_TO_DRAFT,
      userId: employeeId,
      changes: auditChanges,
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
}
