/** Criticalities that require step-up before permanent purge. */
export const CREDENTIAL_PERMANENT_DELETE_STEP_UP_CRITICALITIES = new Set(['HIGH', 'CRITICAL']);

export function credentialPermanentDeleteNeedsStepUp(criticality: string | undefined): boolean {
  return criticality != null && CREDENTIAL_PERMANENT_DELETE_STEP_UP_CRITICALITIES.has(criticality);
}
