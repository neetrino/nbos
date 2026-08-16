import type { CurrentUserPayload } from '../../common/decorators';

export type CredentialsRbacAction = 'view' | 'edit' | 'delete';

/** Permission key: administrative bypass of credential row-level visibility. */
export const CREDENTIALS_BYPASS_ROW_VISIBILITY_KEY = 'CREDENTIALS_BYPASS_ROW_VISIBILITY';

/** Only a full ALL scope grants vault-wide row-visibility bypass. */
export const CREDENTIALS_BYPASS_REQUIRED_SCOPE = 'ALL';

/** Caller identity + RBAC scopes for row-level credential access. */
export interface CredentialsAccessContext {
  employeeId: string;
  departmentIds: string[];
  /** RBAC CREDENTIALS VIEW scope (does not bypass row visibility by itself). */
  viewScope?: string;
  /** RBAC CREDENTIALS EDIT scope. */
  editScope?: string;
  /** RBAC CREDENTIALS DELETE scope. */
  deleteScope?: string;
  /**
   * When true, credential `accessLevel` row filter is not applied.
   * Granted only via CREDENTIALS_BYPASS_ROW_VISIBILITY with scope ALL (Owner/CEO).
   */
  bypassRowVisibility: boolean;
}

/** True when the caller may skip credential accessLevel / grant row filters. */
export function credentialsRbacBypassesRowFilter(
  access: Pick<CredentialsAccessContext, 'bypassRowVisibility'> | boolean | undefined,
): boolean {
  if (typeof access === 'boolean') return access;
  return access?.bypassRowVisibility === true;
}

/** CREDENTIALS_BYPASS_ROW_VISIBILITY scope ALL enables vault-wide row bypass. */
export function hasCredentialsRowVisibilityBypass(
  permissions: Record<string, string | undefined>,
): boolean {
  const scope = permissions[CREDENTIALS_BYPASS_ROW_VISIBILITY_KEY]?.trim().toUpperCase();
  return scope === CREDENTIALS_BYPASS_REQUIRED_SCOPE;
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
    bypassRowVisibility: hasCredentialsRowVisibilityBypass(user.permissions),
  };
}
