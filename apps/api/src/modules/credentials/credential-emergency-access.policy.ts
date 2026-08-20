import { ForbiddenException } from '@nestjs/common';
import type { CredentialsAccessContext } from './credentials-access';

export function assertFounderEmergencyDecision(access: CredentialsAccessContext): void {
  if (access.bypassRowVisibility) return;
  throw new ForbiddenException('Only the platform owner can decide emergency access.');
}
