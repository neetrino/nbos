import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import {
  MAIL_AUDIT_ACTION_OUTBOUND_DRAFT_CREATED,
  MAIL_AUDIT_ENTITY_MESSAGE,
} from './mail-audit.constants';
import { publishMailOutboundDraftCreatedNotifications } from './mail-outbound-draft-created-notify.ops';
import { dedupeEmailsCaseInsensitive } from './mail-outbound-draft.helpers';
import { persistOutboundDraftMessage } from './mail-outbound-draft.ops';
import type { CreateMailOutboundDraftDto } from './dto/create-mail-outbound-draft.dto';
import { getMailThreadWithMailboxAccess } from './mail-thread-access.ops';
import { requireMailThreadDetailDto } from './mail-thread-detail-require.ops';
import type { MailThreadDetailDto } from './mail.types';

@Injectable()
export class MailOutboundMutationService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

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
      actorEmployeeId: employeeId,
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
    await publishMailOutboundDraftCreatedNotifications(this.notificationService, {
      actorEmployeeId: employeeId,
      threadId,
      messageId,
      subject: dto.subject,
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
