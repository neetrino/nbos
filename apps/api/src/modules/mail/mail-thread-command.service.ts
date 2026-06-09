import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import {
  MAIL_AUDIT_ACTION_THREAD_MARKED_READ,
  MAIL_AUDIT_ACTION_THREAD_MARKED_UNREAD,
  MAIL_AUDIT_ACTION_THREAD_MARKED_SPAM,
  MAIL_AUDIT_ACTION_THREAD_NEEDS_LINK_UPDATED,
  MAIL_AUDIT_ACTION_THREAD_DELETED,
  MAIL_AUDIT_ENTITY_THREAD,
} from './mail-audit.constants';
import type { PatchMailThreadDto } from './dto/patch-mail-thread.dto';
import { patchThreadNeedsBusinessLinkIfChanged } from './mail-thread-needs-link.ops';
import { publishMailThreadNeedsLinkChangedNotifications } from './mail-thread-needs-link-notify.ops';
import { getMailThreadWithMailboxAccess } from './mail-thread-access.ops';
import {
  listUnreadInboundProviderMessageIds,
  markThreadReadOnProvider,
} from './mail-thread-mark-read-provider.ops';
import { requireMailThreadDetailDto } from './mail-thread-detail-require.ops';
import { MailProviderAdapterFactory } from './providers/mail-provider-adapter.factory';
import type { MailThreadDetailDto } from './mail.types';

@Injectable()
export class MailThreadCommandService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly adapterFactory: MailProviderAdapterFactory,
  ) {}

  /**
   * Marks every message in the thread read (NBOS first, then best-effort provider sync).
   * Idempotent when the thread is already read.
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
    if (!thread.hasUnread) {
      return requireMailThreadDetailDto(this.prisma, {
        employeeId,
        viewScope: accessScope,
        threadId,
      });
    }
    const providerMessageIds = await listUnreadInboundProviderMessageIds(this.prisma, threadId);
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
    await markThreadReadOnProvider(this.prisma, this.adapterFactory, {
      threadId,
      mailAccountId: thread.mailAccountId,
      providerThreadId: thread.providerThreadId,
      providerMessageIds,
    });
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
    return requireMailThreadDetailDto(this.prisma, {
      employeeId,
      viewScope: accessScope,
      threadId,
    });
  }

  /**
   * Marks the thread unread (NBOS user state). Marks the latest inbound message unread
   * so the unread affordance is consistent with the thread flag.
   */
  async markThreadUnread(
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
    await this.prisma.emailThread.update({
      where: { id: threadId },
      data: { hasUnread: true },
    });
    const auditChanges: InputJsonValue = {
      mailAccountId: thread.mailAccountId,
      subjectNormalized: thread.subjectNormalized,
    };
    await this.auditService.log({
      entityType: MAIL_AUDIT_ENTITY_THREAD,
      entityId: threadId,
      action: MAIL_AUDIT_ACTION_THREAD_MARKED_UNREAD,
      userId: employeeId,
      changes: auditChanges,
    });
    return requireMailThreadDetailDto(this.prisma, {
      employeeId,
      viewScope: accessScope,
      threadId,
    });
  }

  /**
   * Updates thread-level flags (MVP: `needsBusinessLink` only; real entity links come later).
   */
  async patchThread(
    employeeId: string,
    accessScope: string,
    threadId: string,
    dto: PatchMailThreadDto,
  ): Promise<MailThreadDetailDto> {
    const outcome = await patchThreadNeedsBusinessLinkIfChanged(this.prisma, {
      threadId,
      employeeId,
      accessScope,
      needsBusinessLink: dto.needsBusinessLink,
    });
    if (outcome.kind === 'no_access') {
      throw new NotFoundException('Thread not found');
    }
    if (outcome.kind === 'noop') {
      return requireMailThreadDetailDto(this.prisma, {
        employeeId,
        viewScope: accessScope,
        threadId,
      });
    }
    const auditChanges: InputJsonValue = {
      mailAccountId: outcome.mailAccountId,
      from: outcome.from,
      to: outcome.to,
    };
    await this.auditService.log({
      entityType: MAIL_AUDIT_ENTITY_THREAD,
      entityId: threadId,
      action: MAIL_AUDIT_ACTION_THREAD_NEEDS_LINK_UPDATED,
      userId: employeeId,
      changes: auditChanges,
    });
    await publishMailThreadNeedsLinkChangedNotifications(this.notificationService, {
      actorEmployeeId: employeeId,
      threadId,
      to: outcome.to,
      subjectNormalized: outcome.subjectNormalized,
      emailAddress: outcome.emailAddress,
      ownerEmployeeId: outcome.ownerEmployeeId,
    });
    return requireMailThreadDetailDto(this.prisma, {
      employeeId,
      viewScope: accessScope,
      threadId,
    });
  }

  /** Flags thread as spam in NBOS (no provider spam folder move in MVP). */
  async markThreadSpam(
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
    if (!thread.isSpam) {
      await this.prisma.emailThread.update({
        where: { id: threadId },
        data: { isSpam: true },
      });
      const auditChanges: InputJsonValue = {
        mailAccountId: thread.mailAccountId,
        subjectNormalized: thread.subjectNormalized,
      };
      await this.auditService.log({
        entityType: MAIL_AUDIT_ENTITY_THREAD,
        entityId: threadId,
        action: MAIL_AUDIT_ACTION_THREAD_MARKED_SPAM,
        userId: employeeId,
        changes: auditChanges,
      });
    }
    return requireMailThreadDetailDto(this.prisma, {
      employeeId,
      viewScope: accessScope,
      threadId,
    });
  }

  /** Removes thread and cascaded messages from NBOS (no provider mailbox delete in MVP). */
  async deleteThread(
    employeeId: string,
    accessScope: string,
    threadId: string,
  ): Promise<{ deleted: true; threadId: string }> {
    const thread = await getMailThreadWithMailboxAccess(this.prisma, {
      threadId,
      employeeId,
      accessScope,
    });
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }
    await this.prisma.emailThread.delete({ where: { id: threadId } });
    const auditChanges: InputJsonValue = {
      mailAccountId: thread.mailAccountId,
      subjectNormalized: thread.subjectNormalized,
    };
    await this.auditService.log({
      entityType: MAIL_AUDIT_ENTITY_THREAD,
      entityId: threadId,
      action: MAIL_AUDIT_ACTION_THREAD_DELETED,
      userId: employeeId,
      changes: auditChanges,
    });
    return { deleted: true, threadId };
  }
}
