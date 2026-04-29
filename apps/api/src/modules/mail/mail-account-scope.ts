import type { Prisma } from '@nbos/database';

const MAIL_VIEW_WIDE_SCOPES = new Set<string>(['ALL', 'DEPARTMENT']);

/**
 * RBAC VIEW scope for mailboxes: ALL/DEPARTMENT list company mail accounts; otherwise owned only.
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
