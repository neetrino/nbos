import type { Prisma, PrismaClient } from '@nbos/database';
import { mailAccountWhereForViewer } from './mail-account-scope';
import { toAccountRow, toMessageRow, toThreadListRow } from './mail-dto-map';
import { getMailThreadWithMailboxAccess } from './mail-thread-access.ops';
import type { MailAccountRow, MailThreadDetailDto, MailThreadListPageDto } from './mail.types';
import { normalizeMailThreadSearchQuery } from './mail-thread-search';
import {
  buildMailThreadListPageMeta,
  normalizeMailThreadListPagination,
} from './mail-thread-list-pagination.ops';

export interface ListMailThreadsOptions {
  mailAccountId?: string;
  unreadOnly?: boolean;
  /** When true, only threads flagged for business context linking. */
  needsLinkOnly?: boolean;
  /** When true, only threads assigned to the requesting viewer (Mine). */
  assignedToMe?: boolean;
  /** When true, only threads with outbound activity (Sent). */
  sentOnly?: boolean;
  /** Case-insensitive substring match on `subjectNormalized` (from query `q`). */
  search?: string;
  /** 1-based page index (default 1). */
  page?: number;
  pageSize?: number;
}

export type ListMailThreadsQueryResult =
  | { ok: true; data: MailThreadListPageDto }
  | { ok: false; error: 'mail_account_not_found' };

export async function listMailAccountsForViewer(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
  viewScope: string,
): Promise<MailAccountRow[]> {
  const rows = await prisma.mailAccount.findMany({
    where: mailAccountWhereForViewer(employeeId, viewScope),
    include: { providerConnection: true },
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
  const { mailAccountId, unreadOnly, needsLinkOnly, assignedToMe, sentOnly } = options;
  const searchTerm = normalizeMailThreadSearchQuery(options.search);
  const accountWhere = mailAccountWhereForViewer(employeeId, viewScope);
  const accounts = await prisma.mailAccount.findMany({
    where: accountWhere,
    select: { id: true },
  });
  const ids = accounts.map((a) => a.id);
  if (ids.length === 0) {
    const { page, pageSize } = normalizeMailThreadListPagination({
      page: options.page,
      pageSize: options.pageSize,
    });
    return {
      ok: true,
      data: {
        items: [],
        meta: buildMailThreadListPageMeta({ page, pageSize, totalCount: 0 }),
      },
    };
  }
  if (mailAccountId && !ids.includes(mailAccountId)) {
    return { ok: false, error: 'mail_account_not_found' };
  }
  const where: Prisma.EmailThreadWhereInput = {
    ...(mailAccountId ? { mailAccountId } : { mailAccountId: { in: ids } }),
    ...(unreadOnly ? { hasUnread: true } : {}),
    ...(needsLinkOnly ? { needsBusinessLink: true } : {}),
    ...(assignedToMe ? { assignedToEmployeeId: employeeId } : {}),
    ...(sentOnly ? { lastOutboundAt: { not: null } } : {}),
    ...(searchTerm
      ? {
          subjectNormalized: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        }
      : {}),
  };
  const { page, pageSize, skip } = normalizeMailThreadListPagination({
    page: options.page,
    pageSize: options.pageSize,
  });
  const [totalCount, threads] = await prisma.$transaction([
    prisma.emailThread.count({ where }),
    prisma.emailThread.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      skip,
      take: pageSize,
      include: { assignedTo: { select: { firstName: true, lastName: true } } },
    }),
  ]);
  const items = threads.map(toThreadListRow);
  return {
    ok: true,
    data: {
      items,
      meta: buildMailThreadListPageMeta({ page, pageSize, totalCount }),
    },
  };
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
    include: {
      attachments: { orderBy: { createdAt: 'asc' } },
      recipients: { orderBy: { createdAt: 'asc' } },
    },
  });
  return {
    mailAccount: toAccountRow(thread.mailAccount),
    thread: toThreadListRow(thread),
    messages: messages.map(toMessageRow),
  };
}
