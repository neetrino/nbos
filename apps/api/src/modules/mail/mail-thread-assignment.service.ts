import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import {
  MAIL_AUDIT_ACTION_THREAD_ASSIGNED,
  MAIL_AUDIT_ACTION_THREAD_UNASSIGNED,
  MAIL_AUDIT_ENTITY_THREAD,
} from './mail-audit.constants';
import { employeeHasMailAccountAccess } from './mail-account-access.ops';
import { getMailThreadWithMailboxAccess } from './mail-thread-access.ops';
import { requireMailThreadDetailDto } from './mail-thread-detail-require.ops';
import type { MailThreadDetailDto } from './mail.types';

@Injectable()
export class MailThreadAssignmentService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
  ) {}

  async assignThread(
    employeeId: string,
    accessScope: string,
    threadId: string,
    targetEmployeeId: string,
  ): Promise<MailThreadDetailDto> {
    const thread = await getMailThreadWithMailboxAccess(this.prisma, {
      threadId,
      employeeId,
      accessScope,
    });
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }
    const targetHasAccess = await employeeHasMailAccountAccess(
      this.prisma,
      thread.mailAccountId,
      targetEmployeeId,
    );
    if (!targetHasAccess) {
      throw new BadRequestException('Assignee must have access to this mailbox');
    }
    await this.prisma.emailThread.update({
      where: { id: threadId },
      data: {
        assignedToEmployeeId: targetEmployeeId,
        assignedByEmployeeId: employeeId,
        assignedAt: new Date(),
      },
    });
    const changes: InputJsonValue = { mailAccountId: thread.mailAccountId, targetEmployeeId };
    await this.auditService.log({
      entityType: MAIL_AUDIT_ENTITY_THREAD,
      entityId: threadId,
      action: MAIL_AUDIT_ACTION_THREAD_ASSIGNED,
      userId: employeeId,
      changes,
    });
    return requireMailThreadDetailDto(this.prisma, {
      employeeId,
      viewScope: accessScope,
      threadId,
    });
  }

  async unassignThread(
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
      data: { assignedToEmployeeId: null, assignedByEmployeeId: null, assignedAt: null },
    });
    const changes: InputJsonValue = { mailAccountId: thread.mailAccountId };
    await this.auditService.log({
      entityType: MAIL_AUDIT_ENTITY_THREAD,
      entityId: threadId,
      action: MAIL_AUDIT_ACTION_THREAD_UNASSIGNED,
      userId: employeeId,
      changes,
    });
    return requireMailThreadDetailDto(this.prisma, {
      employeeId,
      viewScope: accessScope,
      threadId,
    });
  }
}
