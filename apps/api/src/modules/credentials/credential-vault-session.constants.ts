/** Daily vault unlock window for HIGH/CRITICAL secret copy/reveal and version history. */
export const CREDENTIAL_VAULT_UNLOCK_TTL_MS = 24 * 60 * 60 * 1000;

export const CREDENTIAL_VAULT_UNLOCK_REDIS_PREFIX = 'nbos:credentials:vault-unlock:';

export function credentialVaultUnlockRedisKey(employeeId: string): string {
  return `${CREDENTIAL_VAULT_UNLOCK_REDIS_PREFIX}${employeeId}`;
}

/**
 * Stored unlock record. `authVersion` ties the 24h vault session to the employee's auth generation,
 * so logout-all, password change/reset, terminate and owner-initiated sign-out invalidate it even
 * when the explicit `lock()` write is lost (for example a Redis outage).
 */
export interface CredentialVaultUnlockEntry {
  expiresAtMs: number;
  authVersion: number;
}

export function serializeVaultUnlockEntry(entry: CredentialVaultUnlockEntry): string {
  return JSON.stringify(entry);
}

/** Rejects malformed values and pre-`authVersion` records, which forces one fresh unlock. */
export function parseVaultUnlockEntry(raw: string): CredentialVaultUnlockEntry | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { expiresAtMs, authVersion } = parsed as Record<string, unknown>;
    if (!Number.isFinite(expiresAtMs) || !Number.isFinite(authVersion)) return null;
    return { expiresAtMs: Number(expiresAtMs), authVersion: Number(authVersion) };
  } catch {
    return null;
  }
}
