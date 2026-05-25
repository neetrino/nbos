export const GENERIC_STATUS_DEPRECATION_HEADER = 'true';

export const GENERIC_STATUS_DEPRECATION_DESCRIPTION =
  'Deprecated compatibility path. Use canonical delivery stage, pause, resume, cancel and complete endpoints for lifecycle changes.';

/** Audit action when deprecated PATCH …/status reaches a terminal legacy outcome (DONE | LOST). */
export const DEPRECATED_PATCH_STATUS_TERMINAL_AUDIT_ACTION =
  'delivery.deprecated_patch_status_terminal';

/** Legacy statuses that map to a terminal delivery resolution when used via PATCH …/status. */
export function isLegacyPatchStatusTerminalOutcome(status: string): boolean {
  return status === 'DONE' || status === 'LOST';
}
