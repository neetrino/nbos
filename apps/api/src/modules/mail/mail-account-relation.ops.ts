import type { Prisma } from '@nbos/database';

export type MailAccountViewerRelation = 'owned' | 'shared' | 'tenant';

export const MAIL_ACCOUNT_LIST_LIMIT = 200;

/** Owned or explicitly shared — default “My” mailboxes for daily inbox. */
export function mailAccountPersonalWhere(employeeId: string): Prisma.MailAccountWhereInput {
  return {
    OR: [{ ownerEmployeeId: employeeId }, { accesses: { some: { employeeId } } }],
  };
}

export function resolveMailAccountViewerRelation(input: {
  employeeId: string;
  ownerEmployeeId: string | null;
  hasDelegatedAccess: boolean;
}): MailAccountViewerRelation {
  if (input.ownerEmployeeId !== null && input.ownerEmployeeId === input.employeeId) {
    return 'owned';
  }
  if (input.hasDelegatedAccess) {
    return 'shared';
  }
  return 'tenant';
}

/**
 * Parses `mailAccountIds` query (comma-separated).
 * `undefined` = param absent (server default personal set).
 * `[]` = param present but empty (explicit empty My list).
 */
export function parseMailAccountIdsQuery(raw: string | undefined): string[] | undefined {
  if (raw === undefined) {
    return undefined;
  }
  const ids = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return [...new Set(ids)].slice(0, MAIL_ACCOUNT_LIST_LIMIT);
}
