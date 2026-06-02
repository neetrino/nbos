import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { CredentialsAccessContext } from './credentials-access';
import { assertCredentialStepUpPassword } from './credential-step-up';
import { decryptFieldIfEncrypted } from './credential-crypto.mapper';
import { parseSecretField } from './credential-sensitive.utils';
import { assertSecretVersionRevealAllowed } from './credential-secret-version.policy';
import type { CredentialSecretVersionRow } from './credential-secret-version.types';
import { getAccessibleCredentialRow } from './credentials-secrets.operations';
import type { CredentialsRuntime } from './credentials-runtime';

function mapVersionRow(row: {
  id: string;
  field: string;
  versionNumber: number;
  rotatedAt: Date;
  source: string;
  reason: string | null;
  rotatedBy: { id: string; firstName: string; lastName: string };
}): CredentialSecretVersionRow {
  return {
    id: row.id,
    field: parseSecretField(row.field),
    versionNumber: row.versionNumber,
    rotatedAt: row.rotatedAt.toISOString(),
    source: row.source as CredentialSecretVersionRow['source'],
    reason: row.reason,
    rotatedBy: row.rotatedBy,
  };
}

export async function listCredentialSecretVersions(
  runtime: CredentialsRuntime,
  credentialId: string,
  access: CredentialsAccessContext,
) {
  await getAccessibleCredentialRow(runtime, credentialId, access);
  const rows = await runtime.prisma.credentialSecretVersion.findMany({
    where: { credentialId },
    orderBy: [{ field: 'asc' }, { versionNumber: 'desc' }],
    include: {
      rotatedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  return { items: rows.map(mapVersionRow) };
}

export async function revealCredentialSecretVersion(
  runtime: CredentialsRuntime,
  credentialId: string,
  versionId: string,
  stepUpPassword: string | undefined,
  access: CredentialsAccessContext,
) {
  await getAccessibleCredentialRow(runtime, credentialId, access);
  await assertSecretVersionRevealAllowed(runtime.prisma, access);
  await assertCredentialStepUpPassword(
    runtime.prisma,
    runtime.auditService,
    access.employeeId,
    stepUpPassword,
    'secret_version_reveal',
  );

  const version = await runtime.prisma.credentialSecretVersion.findFirst({
    where: { id: versionId, credentialId },
  });
  if (!version) throw new NotFoundException('Secret version not found');

  const field = parseSecretField(version.field);
  const value = decryptFieldIfEncrypted(version.ciphertext, runtime.encryptionKey);
  if (!value) throw new BadRequestException('Version has no decryptable value');

  await runtime.auditService.log({
    entityType: 'credential',
    entityId: credentialId,
    action: 'credential.secret_version_revealed',
    userId: access.employeeId,
    changes: { versionId, field, versionNumber: version.versionNumber },
  });

  return { field, versionNumber: version.versionNumber, value };
}
