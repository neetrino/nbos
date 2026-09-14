import type { CurrentUserPayload } from '../../common/decorators';
import { permissionDepartmentIds } from '../../common/authorization/permission-department-scope';
import type { DocumentsDetailAccess, DocumentsReadAccess } from './documents-access-read';

/** RBAC key from `employee.guard` (`module_action`). */
export const DOCUMENTS_VIEW_PERMISSION_KEY = 'DOCUMENTS_VIEW' as const;
export const DOCUMENTS_VIEW_ACTIVITY_PERMISSION_KEY = 'DOCUMENTS_VIEW_ACTIVITY' as const;

export function buildDocumentsReadAccess(user: CurrentUserPayload): DocumentsReadAccess {
  return {
    employeeId: user.id,
    departmentIds: permissionDepartmentIds(user, DOCUMENTS_VIEW_PERMISSION_KEY),
    documentsViewScope: user.permissions[DOCUMENTS_VIEW_PERMISSION_KEY],
  };
}

export function buildDocumentsDetailAccess(user: CurrentUserPayload): DocumentsDetailAccess {
  return {
    ...buildDocumentsReadAccess(user),
    documentsViewActivityScope: user.permissions[DOCUMENTS_VIEW_ACTIVITY_PERMISSION_KEY],
  };
}
