import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { mailAccountWhereForViewer } from './mail-account-scope';
import type {
  MailAccountRow,
  MailMessageRow,
  MailRecipientRow,
  MailThreadDetailDto,
  MailThreadListRow,
} from './mail.types';

interface MessageWithRecipients {
  id: string;
  direction: string;
  subject: string;
  bodyText: string | null;
  sentAt: Date | null;
  receivedAt: Date | null;
  readState: string;
  recipients: Array<{ kind: string; email: string; displayName: string | null }>;
}

@Injectable()
export class MailService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

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
    mailAccountId?: string,
  ): Promise<MailThreadListRow[]> {
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
    const where = mailAccountId ? { mailAccountId } : { mailAccountId: { in: ids } };
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
    const thread = await this.prisma.emailThread.findFirst({
      where: { id: threadId },
      include: { mailAccount: true },
    });
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }
    const accountOk = await this.prisma.mailAccount.findFirst({
      where: { id: thread.mailAccountId, ...mailAccountWhereForViewer(employeeId, viewScope) },
    });
    if (!accountOk) {
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
    const thread = await this.prisma.emailThread.findFirst({
      where: { id: threadId },
      include: { mailAccount: true },
    });
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }
    const accountOk = await this.prisma.mailAccount.findFirst({
      where: { id: thread.mailAccountId, ...mailAccountWhereForViewer(employeeId, accessScope) },
    });
    if (!accountOk) {
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
    return this.getThreadDetail(employeeId, accessScope, threadId);
  }
}

function toAccountRow(row: {
  id: string;
  emailAddress: string;
  displayName: string | null;
  providerType: string;
  status: string;
  lastSyncAt: Date | null;
  lastErrorAt: Date | null;
}): MailAccountRow {
  return {
    id: row.id,
    emailAddress: row.emailAddress,
    displayName: row.displayName,
    providerType: row.providerType,
    status: row.status,
    lastSyncAt: row.lastSyncAt?.toISOString() ?? null,
    lastErrorAt: row.lastErrorAt?.toISOString() ?? null,
  };
}

function toThreadListRow(row: {
  id: string;
  mailAccountId: string;
  subjectNormalized: string;
  lastMessageAt: Date;
  lastInboundAt: Date | null;
  lastOutboundAt: Date | null;
  hasUnread: boolean;
  needsBusinessLink: boolean;
  status: string;
}): MailThreadListRow {
  return {
    id: row.id,
    mailAccountId: row.mailAccountId,
    subjectNormalized: row.subjectNormalized,
    lastMessageAt: row.lastMessageAt.toISOString(),
    lastInboundAt: row.lastInboundAt?.toISOString() ?? null,
    lastOutboundAt: row.lastOutboundAt?.toISOString() ?? null,
    hasUnread: row.hasUnread,
    needsBusinessLink: row.needsBusinessLink,
    status: row.status,
  };
}

function toRecipientRow(r: {
  kind: string;
  email: string;
  displayName: string | null;
}): MailRecipientRow {
  return { kind: r.kind, email: r.email, displayName: r.displayName };
}

function toMessageRow(m: MessageWithRecipients): MailMessageRow {
  return {
    id: m.id,
    direction: m.direction,
    subject: m.subject,
    bodyText: m.bodyText,
    sentAt: m.sentAt?.toISOString() ?? null,
    receivedAt: m.receivedAt?.toISOString() ?? null,
    readState: m.readState,
    recipients: m.recipients.map(toRecipientRow),
  };
}
