import { ApiError } from '@/lib/api-errors';

/** Browse/load failures that should not surface as red toasts — empty UI is enough. */
export function isDriveBrowseSilentError(caught: unknown): boolean {
  const message =
    caught instanceof ApiError
      ? caught.message
      : caught instanceof Error
        ? caught.message
        : String(caught);
  const lower = message.toLowerCase();
  if (caught instanceof ApiError && caught.statusCode === 404) return true;
  return (
    lower.includes('drive context not found') ||
    lower.includes('cannot get /api/drive/library-entities') ||
    lower.includes('cannot get /api/drive/folders')
  );
}
