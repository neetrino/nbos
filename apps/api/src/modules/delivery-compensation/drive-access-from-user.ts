import type { CurrentUserPayload } from '../../common/decorators';
import type { DriveEntityAccess } from '../drive/drive-access.types';

export function driveAccessFromUser(user: CurrentUserPayload): DriveEntityAccess {
  return {
    employeeId: user.id,
    departmentIds: user.requestPermissionDepartmentIds ?? user.departmentIds,
    driveScope: user.permissions.DRIVE_VIEW,
  };
}
