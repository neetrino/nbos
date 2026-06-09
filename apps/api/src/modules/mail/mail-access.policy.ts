import type { Prisma } from '@nbos/database';

/**
 * Effective mailbox role for the current viewer. `OWNER` is implicit via
 * `MailAccount.ownerEmployeeId`; ADMIN/READER/SENDER come from `MailAccountAccess`.
 * Platform-wide RBAC scope (ALL/DEPARTMENT) is treated as ADMIN-level override.
 */
export type MailViewerRole = 'OWNER' | 'ADMIN' | 'SENDER' | 'READER';

const MAIL_WIDE_SCOPES = new Set<string>(['ALL', 'DEPARTMENT']);

export function isWideMailScope(viewScope: string): boolean {
  return MAIL_WIDE_SCOPES.has(viewScope);
}

/**
 * Prisma filter for mail accounts the viewer may read: wide scope sees all,
 * otherwise owned mailboxes plus mailboxes shared with the viewer.
 */
export function mailAccountAccessibleWhere(
  employeeId: string,
  viewScope: string,
): Prisma.MailAccountWhereInput {
  if (isWideMailScope(viewScope)) {
    return {};
  }
  return {
    OR: [{ ownerEmployeeId: employeeId }, { accesses: { some: { employeeId } } }],
  };
}

export interface ResolveMailRoleInput {
  ownerEmployeeId: string | null;
  /** Role from a MailAccountAccess row for this viewer, if any. */
  accessRole: MailViewerRole | null;
  employeeId: string;
  viewScope: string;
}

export function resolveMailViewerRole(input: ResolveMailRoleInput): MailViewerRole | null {
  if (input.ownerEmployeeId && input.ownerEmployeeId === input.employeeId) {
    return 'OWNER';
  }
  if (input.accessRole) {
    return input.accessRole;
  }
  if (isWideMailScope(input.viewScope)) {
    return 'ADMIN';
  }
  return null;
}

export function mailRoleCanView(role: MailViewerRole | null): boolean {
  return role !== null;
}

export function mailRoleCanSend(role: MailViewerRole | null): boolean {
  return role === 'OWNER' || role === 'ADMIN' || role === 'SENDER';
}

export function mailRoleCanManageAccess(role: MailViewerRole | null): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}
