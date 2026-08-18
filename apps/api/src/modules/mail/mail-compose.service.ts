import {
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MailDeliveryLogKind, PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type { ComposeMailDto, ReplyMailDto } from './dto/compose-mail.dto';
import { mailRoleCanSend } from './mail-access.policy';
import { loadMailAccountWithViewerRole } from './mail-account-role.ops';
import { appendMailDeliveryLog } from './mail-delivery-log-append.ops';
import { dispatchQueuedOutboundSend } from './mail-outbound-dispatch';
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
  private readonly logger = new Logger(MailComposeService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly sendService: MailSendService,
    private readonly queue: MailQueueService,
  ) {}

  /** Persist a new thread + QUEUED message, then enqueue send. */
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
    const thread = await this.persistComposeThread(dto, employeeId, loaded.account);
    await this.dispatch(thread.id, thread.messageId, dto.mailAccountId, employeeId);
    return requireMailThreadDetailDto(this.prisma, { employeeId, viewScope, threadId: thread.id });
  }

  /** Reply within an existing thread and enqueue send. */
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
    const messageId = await this.persistQueuedReply(thread, employeeId, dto, subject);
    await this.dispatch(threadId, messageId, thread.mailAccountId, employeeId);
    return requireMailThreadDetailDto(this.prisma, { employeeId, viewScope, threadId });
  }

  private async persistComposeThread(
    dto: ComposeMailDto,
    employeeId: string,
    account: { id: string; emailAddress: string; displayName: string | null },
  ): Promise<{ id: string; messageId: string }> {
    try {
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
        account,
        dto,
      });
      await queueOutboundDraftMessage(this.prisma, { threadId: thread.id, messageId });
      await appendMailDeliveryLog(this.prisma, {
        emailMessageId: messageId,
        mailAccountId: dto.mailAccountId,
        actorEmployeeId: employeeId,
        kind: MailDeliveryLogKind.OUTBOUND_QUEUED,
      });
      return { id: thread.id, messageId };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new ServiceUnavailableException('Could not persist outbound message');
    }
  }

  private async persistQueuedReply(
    thread: {
      id: string;
      mailAccountId: string;
      mailAccount: { id: string; emailAddress: string; displayName: string | null };
    },
    employeeId: string,
    dto: ReplyMailDto,
    subject: string,
  ): Promise<string> {
    try {
      const { messageId } = await persistOutboundDraftMessage(this.prisma, {
        threadId: thread.id,
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
      await queueOutboundDraftMessage(this.prisma, { threadId: thread.id, messageId });
      await appendMailDeliveryLog(this.prisma, {
        emailMessageId: messageId,
        mailAccountId: thread.mailAccountId,
        actorEmployeeId: employeeId,
        kind: MailDeliveryLogKind.OUTBOUND_QUEUED,
      });
      return messageId;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new ServiceUnavailableException('Could not persist outbound message');
    }
  }

  private async dispatch(
    _threadId: string,
    messageId: string,
    mailAccountId: string,
    employeeId: string,
  ): Promise<void> {
    await dispatchQueuedOutboundSend({
      queue: this.queue,
      sendService: this.sendService,
      logger: this.logger,
      mailAccountId,
      messageId,
      actorEmployeeId: employeeId,
    });
  }
}
