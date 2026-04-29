import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import {
  MAIL_AUDIT_ACTION_THREAD_MARKED_READ,
  MAIL_AUDIT_ACTION_THREAD_NEEDS_LINK_UPDATED,
  MAIL_AUDIT_ENTITY_THREAD,
} from './mail-audit.constants';
import type { PatchMailThreadDto } from './dto/patch-mail-thread.dto';
import { getMailThreadDetailDtoOrNull } from './mail-inbox-query.ops';
import { patchThreadNeedsBusinessLinkIfChanged } from './mail-thread-needs-link.ops';
import { getMailThreadWithMailboxAccess } from './mail-thread-access.ops';
import type { MailThreadDetailDto } from './mail.types';

@Injectable()
export class MailThreadCommandService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
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
    return this.requireThreadDetail(employeeId, accessScope, threadId);
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
      return this.requireThreadDetail(employeeId, accessScope, threadId);
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
    return this.requireThreadDetail(employeeId, accessScope, threadId);
  }
}
