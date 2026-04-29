import type { Prisma, PrismaClient } from '@nbos/database';
import { mailAccountWhereForViewer } from './mail-account-scope';
import { toAccountRow, toMessageRow, toThreadListRow } from './mail-dto-map';
import { getMailThreadWithMailboxAccess } from './mail-thread-access.ops';
import type { MailAccountRow, MailThreadDetailDto, MailThreadListRow } from './mail.types';

export interface ListMailThreadsOptions {
  mailAccountId?: string;
  unreadOnly?: boolean;
  /** When true, only threads flagged for business context linking. */
  needsLinkOnly?: boolean;
}

export type ListMailThreadsQueryResult =
  | { ok: true; rows: MailThreadListRow[] }
  | { ok: false; error: 'mail_account_not_found' };

export async function listMailAccountsForViewer(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
  viewScope: string,
): Promise<MailAccountRow[]> {
  const rows = await prisma.mailAccount.findMany({
    where: mailAccountWhereForViewer(employeeId, viewScope),
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return rows.map(toAccountRow);
}

export async function listMailThreadsForViewer(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
  viewScope: string,
  options: ListMailThreadsOptions = {},
): Promise<ListMailThreadsQueryResult> {
  const { mailAccountId, unreadOnly, needsLinkOnly } = options;
  const accountWhere = mailAccountWhereForViewer(employeeId, viewScope);
  const accounts = await prisma.mailAccount.findMany({
    where: accountWhere,
    select: { id: true },
  });
  const ids = accounts.map((a) => a.id);
  if (ids.length === 0) {
    return { ok: true, rows: [] };
  }
  if (mailAccountId && !ids.includes(mailAccountId)) {
    return { ok: false, error: 'mail_account_not_found' };
  }
  const where: Prisma.EmailThreadWhereInput = {
    ...(mailAccountId ? { mailAccountId } : { mailAccountId: { in: ids } }),
    ...(unreadOnly ? { hasUnread: true } : {}),
    ...(needsLinkOnly ? { needsBusinessLink: true } : {}),
  };
  const threads = await prisma.emailThread.findMany({
    where,
    orderBy: { lastMessageAt: 'desc' },
    take: 100,
  });
  return { ok: true, rows: threads.map(toThreadListRow) };
}

export async function getMailThreadDetailDtoOrNull(
  prisma: InstanceType<typeof PrismaClient>,
  params: { employeeId: string; viewScope: string; threadId: string },
): Promise<MailThreadDetailDto | null> {
  const thread = await getMailThreadWithMailboxAccess(prisma, {
    threadId: params.threadId,
    employeeId: params.employeeId,
    accessScope: params.viewScope,
  });
  if (!thread) {
    return null;
  }
  const messages = await prisma.emailMessage.findMany({
    where: { threadId: params.threadId },
    orderBy: { createdAt: 'asc' },
    include: { recipients: { orderBy: { createdAt: 'asc' } } },
  });
  return {
    mailAccount: toAccountRow(thread.mailAccount),
    thread: toThreadListRow(thread),
    messages: messages.map(toMessageRow),
  };
}
