import { BadRequestException } from '@nestjs/common';
import { CREDENTIAL_BULK_MAX_IDS } from './credential-bulk.constants';

/** Normalizes and validates bulk credential id lists from API bodies. */
export function normalizeBulkCredentialIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    throw new BadRequestException('credentialIds must be a non-empty array');
  }
  const ids = [
    ...new Set(
      raw
        .filter((id): id is string => typeof id === 'string')
        .map((id) => id.trim())
        .filter((id) => id.length > 0),
    ),
  ];
  if (ids.length === 0) {
    throw new BadRequestException('credentialIds must be a non-empty array');
  }
  if (ids.length > CREDENTIAL_BULK_MAX_IDS) {
    throw new BadRequestException(`credentialIds cannot exceed ${CREDENTIAL_BULK_MAX_IDS}`);
  }
  return ids;
}
