import { UPLOAD_FILENAME_MAX_LENGTH } from './drive-upload.constants';

/**
 * Safe single-segment filename for R2 keys (strips path, limits length).
 */
export function sanitizeUploadBaseName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop() ?? fileName;
  const stripped = base.replace(/[^\w.\-()+ ]/g, '_').trim();
  const slice = stripped.slice(0, UPLOAD_FILENAME_MAX_LENGTH);
  return slice.length > 0 ? slice : 'upload.bin';
}
