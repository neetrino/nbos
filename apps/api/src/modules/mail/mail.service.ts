import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import {
  MAIL_AUDIT_ACTION_OUTBOUND_DRAFT_CREATED,
  MAIL_AUDIT_ACTION_OUTBOUND_MESSAGE_QUEUED,
  MAIL_AUDIT_ACTION_OUTBOUND_SEND_STUB_FAILED,
  MAIL_AUDIT_ACTION_THREAD_MARKED_READ,
  MAIL_AUDIT_ENTITY_MESSAGE,
  MAIL_AUDIT_ENTITY_THREAD,
} from './mail-audit.constants';
import { mailAccountWhereForViewer } from './mail-account-scope';
import { failQueuedOutboundStubNoProvider } from './mail-outbound-finalize-stub.ops';
import { MAIL_OUTBOUND_STUB_FAIL_REASON_NO_PROVIDER } from './mail-outbound-stub.constants';
import { getMailThreadWithMailboxAccess } from './mail-thread-access.ops';
import type { CreateMailOutboundDraftDto } from './dto/create-mail-outbound-draft.dto';
import { dedupeEmailsCaseInsensitive } from './mail-outbound-draft.helpers';
import { toAccountRow, toMessageRow, toThreadListRow } from './mail-dto-map';
import { persistOutboundDraftMessage } from './mail-outbound-draft.ops';
import { queueOutboundDraftMessage } from './mail-outbound-queue.ops';
import type { MailAccountRow, MailThreadDetailDto, MailThreadListRow } from './mail.types';

export interface ListMailThreadsOptions {
  mailAccountId?: string;
  unreadOnly?: boolean;
}

@Injectable()
export class MailService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
  ) {}

  async listAccounts(employeeId: string, viewScope: string): Promise<MailAccountRow[]> {
    const rows = await this.prisma.mailAccount.findMany({
      where: mailAccountWhereForViewer(employeeId, viewScope),
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map(toAccountRow);
  }

  async listThreads(
    employeeId: string,
    viewScope: string,
    options: ListMailThreadsOptions = {},
  ): Promise<MailThreadListRow[]> {
    const { mailAccountId, unreadOnly } = options;
    const accountWhere = mailAccountWhereForViewer(employeeId, viewScope);
    const accounts = await this.prisma.mailAccount.findMany({
      where: accountWhere,
      select: { id: true },
    });
    const ids = accounts.map((a) => a.id);
    if (ids.length === 0) {
      return [];
    }
    if (mailAccountId && !ids.includes(mailAccountId)) {
      throw new NotFoundException('Mail account not found');
    }
    const where: Prisma.EmailThreadWhereInput = {
      ...(mailAccountId ? { mailAccountId } : { mailAccountId: { in: ids } }),
      ...(unreadOnly ? { hasUnread: true } : {}),
    };
    const threads = await this.prisma.emailThread.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    });
    return threads.map(toThreadListRow);
  }

  async getThreadDetail(
    employeeId: string,
    viewScope: string,
    threadId: string,
  ): Promise<MailThreadDetailDto> {
    const thread = await getMailThreadWithMailboxAccess(this.prisma, {
      threadId,
      employeeId,
      accessScope: viewScope,
    });
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }
    const messages = await this.prisma.emailMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      include: { recipients: { orderBy: { createdAt: 'asc' } } },
    });
    return {
      mailAccount: toAccountRow(thread.mailAccount),
      thread: toThreadListRow(thread),
      messages: messages.map(toMessageRow),
    };
  }

  /**
   * Marks every message in the thread read and clears thread-level unread (NBOS user state).
   */
  async markThreadRead(
    employeeId: string,
    accessScope: string,
    threadId: string,
  ): Promise<MailThreadDetailDto> {
    const thread = await getMailThreadWithMailboxAccess(this.prisma, {
      threadId,
      employeeId,
      accessScope,
    });
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }
    await this.prisma.$transaction([
      this.prisma.emailMessage.updateMany({
        where: { threadId },
        data: { readState: 'READ' },
      }),
      this.prisma.emailThread.update({
        where: { id: threadId },
        data: { hasUnread: false },
      }),
    ]);
    const auditChanges: InputJsonValue = {
      mailAccountId: thread.mailAccountId,
      subjectNormalized: thread.subjectNormalized,
    };
    await this.auditService.log({
      entityType: MAIL_AUDIT_ENTITY_THREAD,
      entityId: threadId,
      action: MAIL_AUDIT_ACTION_THREAD_MARKED_READ,
      userId: employeeId,
      changes: auditChanges,
    });
    return this.getThreadDetail(employeeId, accessScope, threadId);
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
    const mailboxAccess = await getMailThreadWithMailboxAccess(this.prisma, {
      threadId,
      employeeId,
      accessScope,
    });
    if (!mailboxAccess) {
      throw new NotFoundException('Thread not found');
    }
    const msg = await this.prisma.emailMessage.findFirst({
      where: { id: messageId, threadId },
    });
    if (!msg) {
      throw new NotFoundException('Message not found');
    }
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
    const mailboxAccess = await getMailThreadWithMailboxAccess(this.prisma, {
      threadId,
      employeeId,
      accessScope,
    });
    if (!mailboxAccess) {
      throw new NotFoundException('Thread not found');
    }
    const msg = await this.prisma.emailMessage.findFirst({
      where: { id: messageId, threadId },
    });
    if (!msg) {
      throw new NotFoundException('Message not found');
    }
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
}
