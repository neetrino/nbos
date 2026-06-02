import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@nbos/database';
import type { CredentialsAccessContext } from './credentials-access';
import {
  type ExportCredentialsInput,
  SENSITIVE_FIELDS,
  type SensitiveField,
} from './credential-domain.types';
import { parseSecretField } from './credential-sensitive.utils';
import { decryptFieldIfEncrypted } from './credential-crypto.mapper';
import { assertCredentialStepUpPassword } from './credential-step-up';
import {
  notifyCredentialHighRiskRecipients,
  notifyHighRiskCredentialAction,
} from './credential-high-risk-notify';
import { isSafeCredentialOpenUrl } from './credential-url.utils';
import { buildCredentialRowVisibilityWhere } from './credential-visibility.loader';
import type { CredentialsRuntime } from './credentials-runtime';

async function getAccessibleCredentialRow(
  runtime: CredentialsRuntime,
  id: string,
  access: CredentialsAccessContext,
) {
  const row = await runtime.prisma.credential.findFirst({
    where: {
      id,
      archivedAt: null,
      ...(await buildCredentialRowVisibilityWhere(
        runtime.prisma,
        runtime.platformAccessResolver,
        access,
        'view',
      )),
    },
  });
  if (!row) throw new NotFoundException(`Credential ${id} not found`);
  return row;
}

async function readDecryptedSecret(
  runtime: CredentialsRuntime,
  id: string,
  field: string,
  stepUpPassword: string | undefined,
  access: CredentialsAccessContext,
  purpose: 'reveal' | 'copy',
) {
  const secretField = parseSecretField(field);
  await assertCredentialStepUpPassword(
    runtime.prisma,
    runtime.auditService,
    access.employeeId,
    stepUpPassword,
    `${purpose}:${secretField}`,
  );
  const row = await getAccessibleCredentialRow(runtime, id, access);
  const raw = row[secretField];
  if (!raw || typeof raw !== 'string') {
    throw new BadRequestException(`Credential has no ${secretField} value`);
  }
  const value = decryptFieldIfEncrypted(raw, runtime.encryptionKey);
  const auditAction =
    purpose === 'reveal' ? 'credential.secret_revealed' : 'credential.secret_copied';
  await runtime.auditService.log({
    entityType: 'credential',
    entityId: id,
    action: auditAction,
    userId: access.employeeId,
    projectId: row.projectId ?? undefined,
    changes: [secretField],
  });
  await notifyHighRiskCredentialAction(
    runtime.prisma,
    runtime.notifications,
    row,
    access.employeeId,
    purpose,
    secretField,
  );
  return { field: secretField, value };
}

export function revealCredentialSecret(
  runtime: CredentialsRuntime,
  id: string,
  field: string,
  stepUpPassword: string | undefined,
  access: CredentialsAccessContext,
) {
  return readDecryptedSecret(runtime, id, field, stepUpPassword, access, 'reveal');
}

export function copyCredentialSecret(
  runtime: CredentialsRuntime,
  id: string,
  field: string,
  stepUpPassword: string | undefined,
  access: CredentialsAccessContext,
) {
  return readDecryptedSecret(runtime, id, field, stepUpPassword, access, 'copy');
}

export async function exportCredentialsBundle(
  runtime: CredentialsRuntime,
  input: ExportCredentialsInput,
  access: CredentialsAccessContext,
) {
  await assertCredentialStepUpPassword(
    runtime.prisma,
    runtime.auditService,
    access.employeeId,
    input.stepUpPassword,
    'export',
  );
  const requestedFields = input.fields?.length ? input.fields : [...SENSITIVE_FIELDS];
  const fields = requestedFields.map((f) => parseSecretField(f));

  const where: Prisma.CredentialWhereInput = {
    archivedAt: null,
    ...(await buildCredentialRowVisibilityWhere(
      runtime.prisma,
      runtime.platformAccessResolver,
      access,
      'view',
    )),
  };
  if (input.credentialIds?.length) where.id = { in: input.credentialIds };

  const rows = await runtime.prisma.credential.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      category: true,
      credentialType: true,
      criticality: true,
      accessLevel: true,
      ownerId: true,
      projectId: true,
      password: true,
      apiKey: true,
      envData: true,
      secureNotes: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const exported = rows.map((row) => {
    const secrets: Partial<Record<SensitiveField, string>> = {};
    for (const field of fields) {
      const raw = row[field];
      if (typeof raw === 'string' && raw.length > 0) {
        secrets[field] = decryptFieldIfEncrypted(raw, runtime.encryptionKey);
      }
    }
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      credentialType: row.credentialType,
      criticality: row.criticality,
      accessLevel: row.accessLevel,
      projectId: row.projectId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      secrets,
    };
  });

  await runtime.auditService.log({
    entityType: 'credential',
    entityId: 'bulk_export',
    action: 'credential.exported',
    userId: access.employeeId,
    changes: { count: exported.length, fields },
  });
  await notifyCredentialHighRiskRecipients(runtime.prisma, runtime.notifications, {
    actorId: access.employeeId,
    title: 'Credentials export performed',
    body: `A credentials export was completed (${exported.length} records).`,
    entityId: 'bulk_export',
    dedupeSuffix: `${access.employeeId}:${exported.length}`,
  });

  return {
    exportedAt: new Date().toISOString(),
    count: exported.length,
    fields,
    items: exported,
  };
}

export async function recordCredentialUrlOpened(
  runtime: CredentialsRuntime,
  id: string,
  access: CredentialsAccessContext,
) {
  const row = await getAccessibleCredentialRow(runtime, id, access);
  const url = typeof row.url === 'string' ? row.url.trim() : '';
  if (!url || !isSafeCredentialOpenUrl(url)) {
    throw new BadRequestException('Credential has no safe http(s) URL to open');
  }
  await runtime.auditService.log({
    entityType: 'credential',
    entityId: id,
    action: 'credential.url_opened',
    userId: access.employeeId,
    projectId: row.projectId ?? undefined,
  });
  return { url };
}
