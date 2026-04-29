import type { CurrentUserPayload } from '../../common/decorators';
import type { DocumentsReadAccess } from './documents-access-read';

/** RBAC key from `employee.guard` (`module_action`). */
export const DOCUMENTS_VIEW_PERMISSION_KEY = 'DOCUMENTS_VIEW' as const;

export function buildDocumentsReadAccess(user: CurrentUserPayload): DocumentsReadAccess {
  return {
    employeeId: user.id,
    departmentIds: user.departmentIds ?? [],
    documentsViewScope: user.permissions[DOCUMENTS_VIEW_PERMISSION_KEY],
  };
}
