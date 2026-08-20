import type { CredentialConfidentiality } from './constants';

export function parseCredentialConfidentiality(
  value: string | null | undefined,
): CredentialConfidentiality {
  const key = value?.trim().toUpperCase();
  if (key === 'RESTRICTED') return 'RESTRICTED';
  if (key === 'OWNER_ONLY') return 'OWNER_ONLY';
  return 'NORMAL';
}

export function isOwnerOnlyConfidentiality(value: string | null | undefined): boolean {
  return parseCredentialConfidentiality(value) === 'OWNER_ONLY';
}
