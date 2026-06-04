import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MailDeliveryLogKind, PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type { ComposeMailDto, ReplyMailDto } from './dto/compose-mail.dto';
import { mailRoleCanSend } from './mail-access.policy';
import { loadMailAccountWithViewerRole } from './mail-account-role.ops';
import { appendMailDeliveryLog } from './mail-delivery-log-append.ops';
import { persistOutboundDraftMessage } from './mail-outbound-draft.ops';
import { queueOutboundDraftMessage } from './mail-outbound-queue.ops';
import { MailQueueService } from './mail-queue.service';
import { MailSendService } from './mail-send.service';
import { getMailThreadWithMailboxAccess } from './mail-thread-access.ops';
import { requireMailThreadDetailDto } from './mail-thread-detail-require.ops';
import { normalizeEmailSubject } from './providers/mail-html-sanitize';
import type { MailThreadDetailDto } from './mail.types';

@Injectable()
export class MailComposeService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly queueService: MailQueueService,
    private readonly sendService: MailSendService,
  ) {}

  /** Compose + send a brand-new email (creates a thread and dispatches via provider). */
  async composeNew(
    employeeId: string,
    viewScope: string,
    dto: ComposeMailDto,
  ): Promise<MailThreadDetailDto> {
    const loaded = await loadMailAccountWithViewerRole(this.prisma, {
      mailAccountId: dto.mailAccountId,
      employeeId,
      viewScope,
    });
    if (!loaded) {
      throw new NotFoundException('Mail account not found');
    }
    if (!mailRoleCanSend(loaded.role)) {
      throw new ForbiddenException('You cannot send from this mailbox');
    }
    const thread = await this.prisma.emailThread.create({
      data: {
        mailAccountId: dto.mailAccountId,
        subjectNormalized: normalizeEmailSubject(dto.subject) || '(no subject)',
        lastMessageAt: new Date(),
        hasUnread: false,
      },
    });
    const { messageId } = await persistOutboundDraftMessage(this.prisma, {
      threadId: thread.id,
      actorEmployeeId: employeeId,
      account: loaded.account,
      dto,
    });
    await this.dispatch(thread.id, messageId, dto.mailAccountId, employeeId);
    return requireMailThreadDetailDto(this.prisma, { employeeId, viewScope, threadId: thread.id });
  }

  /** Reply within an existing thread and dispatch via provider. */
  async reply(
    employeeId: string,
    viewScope: string,
    threadId: string,
    dto: ReplyMailDto,
  ): Promise<MailThreadDetailDto> {
    const thread = await getMailThreadWithMailboxAccess(this.prisma, {
      threadId,
      employeeId,
      accessScope: viewScope,
    });
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }
    const loaded = await loadMailAccountWithViewerRole(this.prisma, {
      mailAccountId: thread.mailAccountId,
      employeeId,
      viewScope,
    });
    if (!loaded || !mailRoleCanSend(loaded.role)) {
      throw new ForbiddenException('You cannot send from this mailbox');
    }
    const subject = dto.subject?.trim() || `Re: ${thread.subjectNormalized}`;
    const { messageId } = await persistOutboundDraftMessage(this.prisma, {
      threadId,
      actorEmployeeId: employeeId,
      account: thread.mailAccount,
      dto: {
        to: dto.to,
        cc: dto.cc,
        subject,
        bodyText: dto.bodyText,
        fileAssetIds: dto.fileAssetIds,
      },
    });
    await this.dispatch(threadId, messageId, thread.mailAccountId, employeeId);
    return requireMailThreadDetailDto(this.prisma, { employeeId, viewScope, threadId });
  }

  /** Moves the draft to QUEUED, logs it, and dispatches to the provider (queue or inline). */
  private async dispatch(
    threadId: string,
    messageId: string,
    mailAccountId: string,
    employeeId: string,
  ): Promise<void> {
    await queueOutboundDraftMessage(this.prisma, { threadId, messageId });
    await appendMailDeliveryLog(this.prisma, {
      emailMessageId: messageId,
      mailAccountId,
      actorEmployeeId: employeeId,
      kind: MailDeliveryLogKind.OUTBOUND_QUEUED,
    });
    const queued = await this.queueService.enqueueSend({
      mailAccountId,
      messageId,
      actorEmployeeId: employeeId,
    });
    if (!queued) {
      await this.sendService.sendQueuedMessage(mailAccountId, messageId, employeeId);
    }
  }
}
