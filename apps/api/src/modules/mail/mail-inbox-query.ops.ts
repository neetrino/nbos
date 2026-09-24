import type { EntityLifecycleScope } from '@nbos/shared';
import type { Prisma, PrismaClient } from '@nbos/database';
import { buildScopeWhere } from '../../common/lifecycle/entity-lifecycle-scope';
import { mailAccountWhereForViewer } from './mail-account-scope';
import {
  MAIL_ACCOUNT_LIST_LIMIT,
  mailAccountPersonalWhere,
  resolveMailAccountViewerRelation,
} from './mail-account-relation.ops';
import { toAccountRow, toMessageRow, toThreadListRow } from './mail-dto-map';
import { getMailThreadWithMailboxAccess } from './mail-thread-access.ops';
import type { MailAccountRow, MailThreadDetailDto, MailThreadListPageDto } from './mail.types';
import { normalizeMailThreadSearchQuery } from './mail-thread-search';
import {
  buildMailThreadListPageMeta,
  normalizeMailThreadListPagination,
} from './mail-thread-list-pagination.ops';
import { mailThreadListActivityWhere } from './mail-thread-list-where';

export interface ListMailThreadsOptions {
  mailAccountId?: string;
  /** When set (and no single mailAccountId), restrict All-inbox to these accessible ids. */
  mailAccountIds?: string[];
  unreadOnly?: boolean;
  /** When true, only threads flagged for business context linking. */
  needsLinkOnly?: boolean;
  /** When true, only threads assigned to the requesting viewer (Mine). */
  assignedToMe?: boolean;
  /** When true, only threads with outbound activity (Sent). */
  sentOnly?: boolean;
  /** When true, only threads with an outbound DRAFT message. */
  draftsOnly?: boolean;
  /** When true, only threads flagged as spam. Default lists exclude spam. */
  spamOnly?: boolean;
  /** Active (default) or trash list scope. */
  scope?: EntityLifecycleScope;
  /** Case-insensitive substring match on `subjectNormalized` (from query `q`). */
  search?: string;
  /** 1-based page index (default 1). */
  page?: number;
  pageSize?: number;
}

export type ListMailThreadsQueryResult =
  | { ok: true; data: MailThreadListPageDto }
  | { ok: false; error: 'mail_account_not_found' };

function emptyMailThreadListPage(
  page?: number,
  pageSize?: number,
): Extract<ListMailThreadsQueryResult, { ok: true }> {
  const pagination = normalizeMailThreadListPagination({ page, pageSize });
  return {
    ok: true,
    data: {
      items: [],
      meta: buildMailThreadListPageMeta({
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalCount: 0,
      }),
    },
  };
}

export function inboxMailAccountIdsForList(
  accounts: { id: string; status: string }[],
  mailAccountId?: string,
  mailAccountIds?: string[],
): { ok: true; ids: string[] } | { ok: false; error: 'mail_account_not_found' } {
  if (mailAccountId) {
    if (!accounts.some((account) => account.id === mailAccountId)) {
      return { ok: false, error: 'mail_account_not_found' };
    }
    return { ok: true, ids: [mailAccountId] };
  }
  if (mailAccountIds !== undefined) {
    if (mailAccountIds.length === 0) {
      return { ok: true, ids: [] };
    }
    const allowed = new Set(accounts.map((account) => account.id));
    const ids = mailAccountIds.filter((id) => allowed.has(id));
    if (ids.length === 0) {
      return { ok: false, error: 'mail_account_not_found' };
    }
    return { ok: true, ids };
  }
  return {
    ok: true,
    ids: accounts.filter((account) => account.status !== 'DISABLED').map((account) => account.id),
  };
}

export async function listMailAccountsForViewer(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
  viewScope: string,
): Promise<MailAccountRow[]> {
  const rows = await prisma.mailAccount.findMany({
    where: mailAccountWhereForViewer(employeeId, viewScope),
    include: {
      providerConnection: true,
      providerSecret: { select: { id: true } },
      accesses: {
        where: { employeeId },
        select: { id: true },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: MAIL_ACCOUNT_LIST_LIMIT,
  });
  return rows.map((row) =>
    toAccountRow(
      row,
      resolveMailAccountViewerRelation({
        employeeId,
        ownerEmployeeId: row.ownerEmployeeId,
        hasDelegatedAccess: row.accesses.length > 0,
      }),
    ),
  );
}

export async function listMailThreadsForViewer(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
  viewScope: string,
  options: ListMailThreadsOptions = {},
): Promise<ListMailThreadsQueryResult> {
  const {
    mailAccountId,
    mailAccountIds,
    unreadOnly,
    needsLinkOnly,
    assignedToMe,
    sentOnly,
    spamOnly,
    draftsOnly,
  } = options;
  const scope = options.scope ?? 'active';
  const searchTerm = normalizeMailThreadSearchQuery(options.search);
  const accountWhere = mailAccountWhereForViewer(employeeId, viewScope);
  const restrictToPersonal = !mailAccountId && mailAccountIds === undefined;
  const accounts = await prisma.mailAccount.findMany({
    where: restrictToPersonal
      ? { AND: [accountWhere, mailAccountPersonalWhere(employeeId)] }
      : accountWhere,
    select: { id: true, status: true },
  });
  const scoped = inboxMailAccountIdsForList(accounts, mailAccountId, mailAccountIds);
  if (!scoped.ok) {
    return scoped;
  }
  const ids = scoped.ids;
  if (ids.length === 0) {
    return emptyMailThreadListPage(options.page, options.pageSize);
  }
  const where: Prisma.EmailThreadWhereInput = {
    mailAccountId: ids.length === 1 ? ids[0]! : { in: ids },
    ...buildScopeWhere(scope),
    ...(unreadOnly ? { hasUnread: true } : {}),
    ...(needsLinkOnly ? { needsBusinessLink: true } : {}),
    ...(assignedToMe ? { assignedToEmployeeId: employeeId } : {}),
    ...mailThreadListActivityWhere({ draftsOnly, sentOnly, spamOnly, scope }),
    ...(scope === 'active' ? (spamOnly ? { isSpam: true } : { isSpam: false }) : {}),
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
      orderBy: scope === 'trash' ? { trashedAt: 'desc' } : { lastMessageAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        assignedTo: { select: { firstName: true, lastName: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            direction: true,
            recipients: { select: { kind: true, email: true, displayName: true } },
          },
        },
      },
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
  const delegated = await prisma.mailAccountAccess.findFirst({
    where: { mailAccountId: thread.mailAccountId, employeeId: params.employeeId },
    select: { id: true },
  });
  const messages = await prisma.emailMessage.findMany({
    where: { threadId: params.threadId },
    orderBy: { createdAt: 'asc' },
    include: {
      attachments: { orderBy: { createdAt: 'asc' } },
      recipients: { orderBy: { createdAt: 'asc' } },
    },
  });
  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;
  return {
    mailAccount: toAccountRow(
      thread.mailAccount,
      resolveMailAccountViewerRelation({
        employeeId: params.employeeId,
        ownerEmployeeId: thread.mailAccount.ownerEmployeeId,
        hasDelegatedAccess: Boolean(delegated),
      }),
    ),
    thread: toThreadListRow({
      ...thread,
      messages: latestMessage
        ? [
            {
              direction: latestMessage.direction,
              recipients: latestMessage.recipients,
            },
          ]
        : [],
    }),
    messages: messages.map(toMessageRow),
  };
}
