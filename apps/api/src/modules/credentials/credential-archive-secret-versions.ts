import type { PrismaClient } from '@nbos/database';
import {
  SENSITIVE_FIELDS,
  type SensitiveField,
  type UpdateCredentialDto,
} from './credential-domain.types';
import type { CredentialSecretRotationSource } from './credential-secret-version.types';

export function resolveSecretRotationSource(
  data: UpdateCredentialDto,
): CredentialSecretRotationSource {
  if (data.lastRotatedAt !== undefined) return 'PLANNED';
  return 'MANUAL';
}

export async function archiveCredentialSecretVersions(
  prisma: InstanceType<typeof PrismaClient>,
  credentialId: string,
  existing: Partial<Record<SensitiveField, string | null>>,
  data: UpdateCredentialDto,
  encrypted: Partial<Record<SensitiveField, string | undefined | null>>,
  actorId: string,
  source: CredentialSecretRotationSource,
): Promise<void> {
  const reason = data.rotationReason?.trim() || null;

  for (const field of SENSITIVE_FIELDS) {
    if (data[field] === undefined) continue;
    const previous = existing[field];
    const next = encrypted[field];
    if (typeof previous !== 'string' || previous.length === 0) continue;
    if (next === previous) continue;

    const versionNumber =
      (await prisma.credentialSecretVersion.count({
        where: { credentialId, field },
      })) + 1;

    await prisma.credentialSecretVersion.create({
      data: {
        credentialId,
        field,
        ciphertext: previous,
        versionNumber,
        rotatedById: actorId,
        source,
        reason,
      },
    });
  }
}
