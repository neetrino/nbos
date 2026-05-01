import type { Prisma } from '@nbos/database';

const MAIL_VIEW_WIDE_SCOPES = new Set<string>(['ALL', 'DEPARTMENT']);

/**
 * RBAC scope for mailbox rows (VIEW and EDIT use the same rule in MVP):
 * ALL/DEPARTMENT → any account; otherwise owned mailboxes only.
 */
export function mailAccountWhereForViewer(
  employeeId: string,
  viewScope: string,
): Prisma.MailAccountWhereInput {
  if (MAIL_VIEW_WIDE_SCOPES.has(viewScope)) {
    return {};
  }
  return { ownerEmployeeId: employeeId };
}
