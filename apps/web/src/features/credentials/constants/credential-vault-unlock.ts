/** HIGH/CRITICAL secrets require a daily vault unlock; LOW/MEDIUM rely on login session (7d). */
export const CREDENTIAL_VAULT_UNLOCK_CRITICALITIES = new Set(['HIGH', 'CRITICAL']);

export function credentialNeedsVaultUnlock(criticality: string | undefined): boolean {
  return criticality != null && CREDENTIAL_VAULT_UNLOCK_CRITICALITIES.has(criticality);
}

/** Permanent delete always requires fresh account password. */
export function credentialPermanentDeleteNeedsStepUp(): boolean {
  return true;
}
