import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import {
  MAIL_AUDIT_ACTION_OUTBOUND_DRAFT_CREATED,
  MAIL_AUDIT_ACTION_OUTBOUND_FAILED_RESET_TO_DRAFT,
  MAIL_AUDIT_ACTION_OUTBOUND_MESSAGE_CANCELLED,
  MAIL_AUDIT_ACTION_OUTBOUND_MESSAGE_QUEUED,
  MAIL_AUDIT_ACTION_OUTBOUND_SEND_STUB_FAILED,
  MAIL_AUDIT_ENTITY_MESSAGE,
} from './mail-audit.constants';
import { publishMailOutboundCancelledNotifications } from './mail-outbound-cancel-notify.ops';
import { cancelOutboundDraftOrQueued } from './mail-outbound-cancel.ops';
import { publishMailOutboundSendStubFailedNotifications } from './mail-outbound-finalize-stub-notify.ops';
import { failQueuedOutboundStubNoProvider } from './mail-outbound-finalize-stub.ops';
import { dedupeEmailsCaseInsensitive } from './mail-outbound-draft.helpers';
import { persistOutboundDraftMessage } from './mail-outbound-draft.ops';
import { queueOutboundDraftMessage } from './mail-outbound-queue.ops';
import { publishMailOutboundFailedResetToDraftNotifications } from './mail-outbound-reset-failed-notify.ops';
import { applyFailedOutboundResetToDraft } from './mail-outbound-retry-failed.ops';
import { MAIL_OUTBOUND_STUB_FAIL_REASON_NO_PROVIDER } from './mail-outbound-stub.constants';
import type { CreateMailOutboundDraftDto } from './dto/create-mail-outbound-draft.dto';
import { fetchMailThreadMessageForEdit } from './mail-thread-message-access.ops';
import { getMailThreadWithMailboxAccess } from './mail-thread-access.ops';
import type { MailThreadDetailDto } from './mail.types';
import { getMailThreadDetailDtoOrNull } from './mail-inbox-query.ops';

@Injectable()
export class MailOutboundMutationService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  private async requireThreadDetail(
    employeeId: string,
    accessScope: string,
    threadId: string,
  ): Promise<MailThreadDetailDto> {
    const dto = await getMailThreadDetailDtoOrNull(this.prisma, {
      employeeId,
      viewScope: accessScope,
      threadId,
    });
    if (!dto) {
      throw new NotFoundException('Thread not found');
    }
    return dto;
  }

  async createOutboundDraft(
    employeeId: string,
    accessScope: string,
    threadId: string,
    dto: CreateMailOutboundDraftDto,
  ): Promise<MailThreadDetailDto> {
    const thread = await getMailThreadWithMailboxAccess(this.prisma, {
      threadId,
      employeeId,
      accessScope,
    });
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }
    const account = thread.mailAccount;
    const toList = dedupeEmailsCaseInsensitive(dto.to);
    if (toList.length === 0) {
      throw new BadRequestException('At least one valid To address is required');
    }
    const ccList = dedupeEmailsCaseInsensitive(dto.cc ?? []);
    const { messageId } = await persistOutboundDraftMessage(this.prisma, {
      threadId,
      account,
      dto,
    });
    const auditChanges: InputJsonValue = {
      threadId,
      toCount: toList.length,
      ccCount: ccList.length,
      subjectPrefix: dto.subject.slice(0, 120),
    };
    await this.auditService.log({
      entityType: MAIL_AUDIT_ENTITY_MESSAGE,
      entityId: messageId,
      action: MAIL_AUDIT_ACTION_OUTBOUND_DRAFT_CREATED,
      userId: employeeId,
      changes: auditChanges,
    });
    return this.requireThreadDetail(employeeId, accessScope, threadId);
  }

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
    return this.requireThreadDetail(employeeId, accessScope, threadId);
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
    await publishMailOutboundSendStubFailedNotifications(this.notificationService, {
      actorEmployeeId: employeeId,
      threadId,
      messageId,
      subject: msg.subject,
      emailAddress: account.emailAddress,
      ownerEmployeeId: account.ownerEmployeeId,
    });
    return this.requireThreadDetail(employeeId, accessScope, threadId);
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
    await publishMailOutboundCancelledNotifications(this.notificationService, {
      actorEmployeeId: employeeId,
      threadId,
      messageId,
      subject: msg.subject,
      emailAddress: account.emailAddress,
      ownerEmployeeId: account.ownerEmployeeId,
      previousDeliveryStatus,
    });
    return this.requireThreadDetail(employeeId, accessScope, threadId);
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
    await publishMailOutboundFailedResetToDraftNotifications(this.notificationService, {
      actorEmployeeId: employeeId,
      threadId,
      messageId,
      subject: msg.subject,
      emailAddress: account.emailAddress,
      ownerEmployeeId: account.ownerEmployeeId,
    });
    return this.requireThreadDetail(employeeId, accessScope, threadId);
  }
}
