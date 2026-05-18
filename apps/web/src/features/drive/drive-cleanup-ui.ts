/** Cleanup kinds that support `applyAll` on the API (capped batch). */
export const DRIVE_CLEANUP_APPLY_ALL_KINDS = new Set([
  'failed_upload_sessions',
  'expired_pending_upload_sessions',
  'temporary_exports',
]);

export function cleanupApplyAllLabel(kind: string): string {
  if (kind === 'temporary_exports') return 'Purge expired export ZIPs (batch)';
  if (kind === 'failed_upload_sessions') return 'Purge all failed sessions';
  if (kind === 'expired_pending_upload_sessions') return 'Purge all expired pending';
  return 'Apply all in category';
}
