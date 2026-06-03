import { CREDENTIAL_TYPES } from '@/features/credentials/constants/credentials';

export const LEGACY_CREDENTIAL_TYPE = 'OTHER_SECRET' as const;

export function isLegacyCredentialType(credentialType: string): boolean {
  return credentialType === LEGACY_CREDENTIAL_TYPE;
}

/** Human-readable type label for vault list and sheet. */
export function formatCredentialTypeLabel(credentialType: string): string {
  const match = CREDENTIAL_TYPES.find((t) => t.value === credentialType);
  return match?.label ?? credentialType.replaceAll('_', ' ');
}
