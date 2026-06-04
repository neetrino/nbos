import type { Prisma } from '@nbos/database';
import { mailAccountAccessibleWhere } from './mail-access.policy';

/**
 * RBAC + sharing scope for mailbox rows: ALL/DEPARTMENT → any account;
 * otherwise owned mailboxes plus mailboxes shared with the viewer
 * (delegated MailAccountAccess). VIEW and EDIT use the same visibility rule;
 * finer send/manage checks live in {@link mail-access.policy}.
 */
export function mailAccountWhereForViewer(
  employeeId: string,
  viewScope: string,
): Prisma.MailAccountWhereInput {
  return mailAccountAccessibleWhere(employeeId, viewScope);
}
