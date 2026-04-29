import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import {
  MAIL_AUDIT_ACTION_OUTBOUND_DRAFT_CREATED,
  MAIL_AUDIT_ACTION_OUTBOUND_FAILED_RESET_TO_DRAFT,
  MAIL_AUDIT_ACTION_OUTBOUND_MESSAGE_CANCELLED,
  MAIL_AUDIT_ACTION_OUTBOUND_MESSAGE_QUEUED,
  MAIL_AUDIT_ACTION_OUTBOUND_SEND_STUB_FAILED,
  MAIL_AUDIT_ENTITY_MESSAGE,
} from './mail-audit.constants';
import { cancelOutboundDraftOrQueued } from './mail-outbound-cancel.ops';
import { failQueuedOutboundStubNoProvider } from './mail-outbound-finalize-stub.ops';
import { MAIL_OUTBOUND_STUB_FAIL_REASON_NO_PROVIDER } from './mail-outbound-stub.constants';
import {
  getMailThreadDetailDtoOrNull,
  listMailAccountsForViewer,
  listMailThreadsForViewer,
} from './mail-inbox-query.ops';
import type { ListMailThreadsOptions } from './mail-inbox-query.ops';
import { fetchMailThreadMessageForEdit } from './mail-thread-message-access.ops';
import { getMailThreadWithMailboxAccess } from './mail-thread-access.ops';
import type { CreateMailOutboundDraftDto } from './dto/create-mail-outbound-draft.dto';
import { dedupeEmailsCaseInsensitive } from './mail-outbound-draft.helpers';
import { persistOutboundDraftMessage } from './mail-outbound-draft.ops';
import { queueOutboundDraftMessage } from './mail-outbound-queue.ops';
import { applyFailedOutboundResetToDraft } from './mail-outbound-retry-failed.ops';
import type { MailAccountRow, MailThreadDetailDto, MailThreadListRow } from './mail.types';

export type { ListMailThreadsOptions } from './mail-inbox-query.ops';

@Injectable()
export class MailService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
  ) {}

  async listAccounts(employeeId: string, viewScope: string): Promise<MailAccountRow[]> {
    return listMailAccountsForViewer(this.prisma, employeeId, viewScope);
  }

  async listThreads(
    employeeId: string,
    viewScope: string,
    options: ListMailThreadsOptions = {},
  ): Promise<MailThreadListRow[]> {
    const result = await listMailThreadsForViewer(this.prisma, employeeId, viewScope, options);
    if (!result.ok) {
      throw new NotFoundException('Mail account not found');
    }
    return result.rows;
  }

  async getThreadDetail(
    employeeId: string,
    viewScope: string,
    threadId: string,
  ): Promise<MailThreadDetailDto> {
    const dto = await getMailThreadDetailDtoOrNull(this.prisma, {
      employeeId,
      viewScope,
      threadId,
    });
    if (!dto) {
      throw new NotFoundException('Thread not found');
    }
    return dto;
  }

  /**
   * Persists an outbound message as DRAFT (no provider send / SMTP).
   */
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
    return this.getThreadDetail(employeeId, accessScope, threadId);
  }

  /**
   * Moves an outbound message from DRAFT to QUEUED (stub; no mail worker or SMTP).
   */
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
    return this.getThreadDetail(employeeId, accessScope, threadId);
  }

  /**
   * MVP stub: finalizes a QUEUED outbound message as FAILED (no SMTP/worker yet).
   */
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
    return this.getThreadDetail(employeeId, accessScope, threadId);
  }

  /**
   * Cancels an outbound message still in DRAFT or QUEUED (no provider interaction).
   */
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
    const updated = await cancelOutboundDraftOrQueued(this.prisma, { threadId, messageId });
    if (!updated) {
      throw new BadRequestException('Only draft or queued outbound messages can be cancelled');
    }
    const auditChanges: InputJsonValue = {
      threadId,
      previousDeliveryStatus: msg.deliveryStatus,
    };
    await this.auditService.log({
      entityType: MAIL_AUDIT_ENTITY_MESSAGE,
      entityId: messageId,
      action: MAIL_AUDIT_ACTION_OUTBOUND_MESSAGE_CANCELLED,
      userId: employeeId,
      changes: auditChanges,
    });
    return this.getThreadDetail(employeeId, accessScope, threadId);
  }

  /**
   * Resets a FAILED outbound message to DRAFT for local edit and re-queue (no provider).
   */
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
    return this.getThreadDetail(employeeId, accessScope, threadId);
  }
}
