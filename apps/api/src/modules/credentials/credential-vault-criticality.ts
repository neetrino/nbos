export const CREDENTIAL_VAULT_UNLOCK_CRITICALITIES = new Set(['HIGH', 'CRITICAL']);

/** HIGH/CRITICAL secrets require a daily vault unlock; LOW/MEDIUM rely on login session only. */
export function credentialNeedsVaultUnlock(criticality: string | undefined): boolean {
  return criticality != null && CREDENTIAL_VAULT_UNLOCK_CRITICALITIES.has(criticality);
}
