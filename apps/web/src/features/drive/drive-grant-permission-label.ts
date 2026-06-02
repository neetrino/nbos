/** Compact label for permission chip trigger (Credentials-style uppercase). */
export function driveGrantPermissionShortLabel(permission: string): string {
  switch (permission) {
    case 'VIEW':
    case 'EXPORT':
    case 'SHARE':
    case 'DELETE':
      return permission;
    case 'EDIT_METADATA':
      return 'Edit';
    case 'UPLOAD_VERSION':
      return 'Upload';
    default:
      return permission.replace(/_/g, ' ').slice(0, 8).toUpperCase();
  }
}
