import type { DocumentsReadAccess } from '../documents/documents-access-read';

export interface DriveEntityAccess {
  employeeId: string;
  departmentIds: string[];
  driveScope?: string;
}

export interface DriveEntityContextAccess extends DriveEntityAccess {
  documentsAccess?: DocumentsReadAccess;
}
