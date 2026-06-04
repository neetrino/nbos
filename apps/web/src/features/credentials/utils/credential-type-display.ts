import { CREDENTIAL_TYPES } from '@/features/credentials/constants/credentials';

/** Human-readable type label for vault list and sheet. */
export function formatCredentialTypeLabel(credentialType: string): string {
  const match = CREDENTIAL_TYPES.find((t) => t.value === credentialType);
  return match?.label ?? credentialType.replaceAll('_', ' ');
}
