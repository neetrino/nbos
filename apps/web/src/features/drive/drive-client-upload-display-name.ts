const MAX_DRIVE_UPLOAD_DISPLAY_NAME_LENGTH = 500;

/**
 * Client-side display name for Drive uploads. When the user picks a directory upload,
 * preserves relative paths in the name shown on the FileAsset (system libraries have no
 * physical subfolders for those paths).
 */
export function getDriveClientUploadDisplayName(file: File): string {
  const rel =
    'webkitRelativePath' in file && typeof file.webkitRelativePath === 'string'
      ? file.webkitRelativePath.trim()
      : '';
  const base = rel ? rel.replace(/\\/g, '/') : file.name.trim();
  return base.slice(0, MAX_DRIVE_UPLOAD_DISPLAY_NAME_LENGTH);
}
