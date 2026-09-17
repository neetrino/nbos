import { BadRequestException } from '@nestjs/common';
import {
  DOMAIN_CONNECTION_MODES,
  isDomainConnectionMode,
  type DomainConnectionMode,
} from '@nbos/shared';
import type { ClientServiceConnectionMode } from '@nbos/database';
import { DOMAIN_CREDENTIAL_FORBIDDEN_FOR_DNS } from './domain-operation.errors';

export { DOMAIN_CONNECTION_MODES, isDomainConnectionMode };
export type { DomainConnectionMode };

export function requireDomainConnectionMode(
  value: string | null | undefined,
): ClientServiceConnectionMode {
  const normalized = value?.trim();
  if (!normalized || !isDomainConnectionMode(normalized)) {
    throw new BadRequestException('connectionMode is invalid');
  }
  return normalized;
}

export function assertClientDnsHasNoCredential(
  connectionMode: string | null | undefined,
  credentialId: string | null | undefined,
): void {
  if (connectionMode === 'CLIENT_DNS' && credentialId?.trim()) {
    throw new BadRequestException(DOMAIN_CREDENTIAL_FORBIDDEN_FOR_DNS);
  }
}

/** Fields that must move together when connection mode changes. */
export function clientServicePatchForConnectionMode(
  nextMode: DomainConnectionMode,
  options: { unlinkCredential?: boolean } = {},
): {
  connectionMode: DomainConnectionMode;
  billingModel?: 'REMINDER_ONLY';
  providerAccountId?: null;
  connectionVerifiedAt?: null;
} {
  if (nextMode === 'CLIENT_DNS') {
    return {
      connectionMode: nextMode,
      billingModel: 'REMINDER_ONLY',
      connectionVerifiedAt: null,
      ...(options.unlinkCredential ? { providerAccountId: null } : {}),
    };
  }
  return { connectionMode: nextMode };
}
