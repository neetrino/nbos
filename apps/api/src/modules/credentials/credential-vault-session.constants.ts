/** Daily vault unlock window for HIGH/CRITICAL secret copy/reveal and version history. */
export const CREDENTIAL_VAULT_UNLOCK_TTL_MS = 24 * 60 * 60 * 1000;

export const CREDENTIAL_VAULT_UNLOCK_REDIS_PREFIX = 'nbos:credentials:vault-unlock:';

export function credentialVaultUnlockRedisKey(employeeId: string): string {
  return `${CREDENTIAL_VAULT_UNLOCK_REDIS_PREFIX}${employeeId}`;
}
