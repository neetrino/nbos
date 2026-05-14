/** Mirrors API `drive-grant-permissions` / NBOS Drive canon. */
export const FILE_GRANT_PERMISSIONS = [
  'VIEW',
  'EDIT_METADATA',
  'UPLOAD_VERSION',
  'SHARE',
  'DELETE',
  'EXPORT',
] as const;

export type FileGrantPermission = (typeof FILE_GRANT_PERMISSIONS)[number];
