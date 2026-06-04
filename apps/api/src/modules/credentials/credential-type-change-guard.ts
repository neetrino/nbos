import { BadRequestException } from '@nestjs/common';
import { classifyCredentialTypeChange, type CredentialSecretsPresentFlags } from '@nbos/shared';
import type { UpdateCredentialDto } from './credential-domain.types';
import { buildSecretsPresent } from './credential-health.utils';

type ExistingCredentialRow = {
  credentialType: string;
  password: string | null;
  passphrase: string | null;
  apiKey: string | null;
  envData: string | null;
  secureNotes: string | null;
};

/**
 * Rejects cross-lane type changes that would orphan stored secrets unless the client
 * explicitly acknowledges (mirrors credential sheet dialog R1).
 */
export function assertCredentialTypeChangeAllowed(
  existing: ExistingCredentialRow,
  data: UpdateCredentialDto,
): void {
  const nextType = data.credentialType;
  if (!nextType || nextType === existing.credentialType) return;

  const secretsPresent: CredentialSecretsPresentFlags = buildSecretsPresent(existing);
  const level = classifyCredentialTypeChange(existing.credentialType, nextType, secretsPresent);
  if (level === 'green' || data.acknowledgeOrphanedSecrets === true) return;

  throw new BadRequestException(
    'Changing credential type would hide stored secrets. Confirm in the UI and resubmit with acknowledgeOrphanedSecrets.',
  );
}
