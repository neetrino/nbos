import { ForbiddenException } from '@nestjs/common';
import { parseCredentialConfidentiality, type CredentialConfidentiality } from '@nbos/shared';
import type { CredentialsAccessContext } from './credentials-access';

function assertFounderCanSetRestricted(access: CredentialsAccessContext): void {
  if (access.bypassRowVisibility) return;
  throw new ForbiddenException('Only the platform owner can set this confidentiality.');
}

export function resolveCreateConfidentiality(
  access: CredentialsAccessContext,
  value: string | undefined,
): CredentialConfidentiality {
  const parsed = parseCredentialConfidentiality(value);
  if (parsed !== 'NORMAL') assertFounderCanSetRestricted(access);
  return parsed;
}

export function assertCanSetConfidentiality(access: CredentialsAccessContext, value: string): void {
  if (parseCredentialConfidentiality(value) === 'NORMAL') return;
  assertFounderCanSetRestricted(access);
}
