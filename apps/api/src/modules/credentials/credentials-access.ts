import type { CurrentUserPayload } from '../../common/decorators';

export type CredentialsRbacAction = 'view' | 'edit' | 'delete';

/** Caller identity + RBAC scopes for row-level credential access. */
export interface CredentialsAccessContext {
  employeeId: string;
  departmentIds: string[];
  /** RBAC CREDENTIALS VIEW scope; ALL bypasses credential-level visibility filter. */
  viewScope?: string;
  /** RBAC CREDENTIALS EDIT scope. */
  editScope?: string;
  /** RBAC CREDENTIALS DELETE scope. */
  deleteScope?: string;
}

/** When true, credential `accessLevel` row filter is not applied (Owner/CEO policy). */
export function credentialsRbacBypassesRowFilter(scope: string | undefined): boolean {
  return scope?.trim().toUpperCase() === 'ALL';
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
  return {
    employeeId: user.id,
    departmentIds: user.departmentIds ?? [],
    viewScope: user.permissions['CREDENTIALS_VIEW'],
    editScope: user.permissions['CREDENTIALS_EDIT'],
    deleteScope: user.permissions['CREDENTIALS_DELETE'],
  };
}
