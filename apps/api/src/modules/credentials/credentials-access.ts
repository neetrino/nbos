import type { CurrentUserPayload } from '../../common/decorators';
import { CEO_ROLE_SLUG } from '@nbos/shared';

export type CredentialsRbacAction = 'view' | 'edit' | 'delete';

/** Caller identity + RBAC scopes for row-level credential access. */
export interface CredentialsAccessContext {
  employeeId: string;
  departmentIds: string[];
  viewScope?: string;
  editScope?: string;
  deleteScope?: string;
  /** Founder identity only. Never granted by roles or CREDENTIALS_VIEW=ALL. */
  bypassRowVisibility: boolean;
  /** CEO operational vault: all NORMAL project/team/company rows, not secrets. */
  executiveProjectAccess: boolean;
}

export function credentialsRbacBypassesRowFilter(
  access: Pick<CredentialsAccessContext, 'bypassRowVisibility'> | boolean | undefined,
): boolean {
  if (typeof access === 'boolean') return access;
  return access?.bypassRowVisibility === true;
}

export function resolveCredentialsRbacScope(
  access: CredentialsAccessContext,
  action: CredentialsRbacAction,
): string | undefined {
  if (action === 'edit') return access.editScope ?? access.viewScope;
  if (action === 'delete') return access.deleteScope ?? access.viewScope;
  return access.viewScope;
}

export function credentialsAccessFromUser(user: CurrentUserPayload): CredentialsAccessContext {
  const isFounder = user.isPlatformOwner === true;
  return {
    employeeId: user.id,
    departmentIds: user.departmentIds ?? [],
    viewScope: user.permissions['CREDENTIALS_VIEW'],
    editScope: user.permissions['CREDENTIALS_EDIT'],
    deleteScope: user.permissions['CREDENTIALS_DELETE'],
    bypassRowVisibility: isFounder,
    executiveProjectAccess: !isFounder && user.role?.trim().toLowerCase() === CEO_ROLE_SLUG,
  };
}
