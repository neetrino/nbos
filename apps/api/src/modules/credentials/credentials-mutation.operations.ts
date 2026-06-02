import { NotFoundException } from '@nestjs/common';
import type { Prisma } from '@nbos/database';
import { resolveCredentialCreateDefaults } from '@nbos/shared';
import type { CredentialsAccessContext } from './credentials-access';
import type { CreateCredentialDto, UpdateCredentialDto } from './credential-domain.types';
import { nullableDate } from './credential-date.utils';
import { encryptSensitiveFields, decryptFieldIfEncrypted } from './credential-crypto.mapper';
import { toCredentialWithoutSecrets } from './credential-health.utils';
import { buildCredentialUpdateData, detectChangedCredentialFields } from './credential-update-data';
import { buildCredentialRowVisibilityWhere } from './credential-visibility.loader';
import { assertPermanentDeleteStepUp } from './credential-permanent-delete.policy';
import {
  archiveCredentialSecretVersions,
  resolveSecretRotationSource,
} from './credential-archive-secret-versions';
import {
  manualGrantsFromEmployeeIds,
  syncCredentialManualGrants,
} from './credential-manual-grants';
import type { CredentialsRuntime } from './credentials-runtime';

export async function findCredentialById(
  runtime: CredentialsRuntime,
  id: string,
  access: CredentialsAccessContext,
) {
  const credential = await runtime.prisma.credential.findFirst({
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
    include: { project: { select: { id: true, name: true } } },
  });
  if (!credential) throw new NotFoundException(`Credential ${id} not found`);

  await runtime.auditService.log({
    entityType: 'credential',
    entityId: id,
    action: 'credential.view',
    userId: access.employeeId,
    projectId: credential.projectId ?? undefined,
  });

  const base = toCredentialWithoutSecrets(credential);
  const comment = decryptComment(runtime, credential.secureNotes);
  return { ...base, comment };
}

function decryptComment(runtime: CredentialsRuntime, stored: unknown): string | null {
  if (typeof stored !== 'string' || stored.length === 0) return null;
  return decryptFieldIfEncrypted(stored, runtime.encryptionKey);
}

export async function createCredential(
  runtime: CredentialsRuntime,
  data: CreateCredentialDto,
  userId: string,
) {
  const encrypted = encryptSensitiveFields(data, runtime.encryptionKey);
  const credentialType =
    (data.credentialType as Prisma.CredentialCreateInput['credentialType']) ?? 'LOGIN_PASSWORD';
  const accessLevel =
    (data.accessLevel as Prisma.CredentialCreateInput['accessLevel']) ?? 'PROJECT_TEAM';
  const autoDefaults = resolveCredentialCreateDefaults({ credentialType, accessLevel });

  const credential = await runtime.prisma.credential.create({
    data: {
      projectId: data.projectId,
      productId: data.productId,
      domainId: data.domainId,
      clientServiceRecordId: data.clientServiceRecordId,
      departmentId: data.departmentId,
      ownerId: data.ownerId ?? (accessLevel === 'PERSONAL' ? userId : undefined),
      category: data.category as Prisma.CredentialCreateInput['category'],
      credentialType,
      criticality:
        (data.criticality as Prisma.CredentialCreateInput['criticality']) ??
        (autoDefaults.criticality as Prisma.CredentialCreateInput['criticality']),
      environment: data.environment,
      provider: data.provider,
      name: data.name,
      url: data.url,
      login: data.login,
      password: encrypted.password,
      apiKey: encrypted.apiKey,
      envData: encrypted.envData,
      phone: data.phone,
      notes: data.publicNotes ?? data.notes,
      publicNotes: data.publicNotes ?? data.notes,
      secureNotes: encrypted.secureNotes,
      lastRotatedAt: nullableDate(data.lastRotatedAt),
      nextRotationAt: nullableDate(data.nextRotationAt) ?? new Date(autoDefaults.nextRotationAt),
      rotationOwnerId: data.rotationOwnerId,
      accessLevel,
      allowedEmployees: data.allowedEmployees ?? [],
    },
    include: { project: { select: { id: true, name: true } } },
  });

  await runtime.auditService.log({
    entityType: 'credential',
    entityId: credential.id,
    action: 'credential.create',
    userId,
    projectId: credential.projectId ?? undefined,
  });

  const createGrants = data.manualGrants?.length
    ? data.manualGrants
    : credential.accessLevel === 'SECRET' && credential.allowedEmployees.length > 0
      ? manualGrantsFromEmployeeIds(credential.allowedEmployees)
      : [];
  if (createGrants.length > 0) {
    await syncCredentialManualGrants(runtime.prisma, credential.id, createGrants, userId);
  }

  return toCredentialWithoutSecrets(credential);
}

export async function updateCredential(
  runtime: CredentialsRuntime,
  id: string,
  data: UpdateCredentialDto,
  access: CredentialsAccessContext,
) {
  const existing = await runtime.prisma.credential.findFirst({
    where: {
      id,
      archivedAt: null,
      ...(await buildCredentialRowVisibilityWhere(
        runtime.prisma,
        runtime.platformAccessResolver,
        access,
        'edit',
      )),
    },
  });
  if (!existing) throw new NotFoundException(`Credential ${id} not found`);

  const encrypted = encryptSensitiveFields(data, runtime.encryptionKey);
  const changedFields = detectChangedCredentialFields(data, existing);

  await archiveCredentialSecretVersions(
    runtime.prisma,
    id,
    existing,
    data,
    encrypted,
    access.employeeId,
    resolveSecretRotationSource(data),
  );

  const credential = await runtime.prisma.credential.update({
    where: { id },
    data: buildCredentialUpdateData(data, encrypted),
    include: { project: { select: { id: true, name: true } } },
  });

  await runtime.auditService.log({
    entityType: 'credential',
    entityId: id,
    action: 'credential.update',
    userId: access.employeeId,
    projectId: credential.projectId ?? undefined,
    changes: changedFields,
  });

  if (data.manualGrants !== undefined) {
    await syncCredentialManualGrants(
      runtime.prisma,
      credential.id,
      data.manualGrants,
      access.employeeId,
    );
  } else if (credential.accessLevel === 'SECRET' && data.allowedEmployees !== undefined) {
    await syncCredentialManualGrants(
      runtime.prisma,
      credential.id,
      manualGrantsFromEmployeeIds(credential.allowedEmployees),
      access.employeeId,
    );
  }

  return toCredentialWithoutSecrets(credential);
}

export async function archiveCredential(
  runtime: CredentialsRuntime,
  id: string,
  access: CredentialsAccessContext,
) {
  const existing = await findMutableCredential(runtime, id, access, 'delete');
  await runtime.prisma.credential.update({
    where: { id },
    data: { archivedAt: new Date() },
  });
  await runtime.auditService.log({
    entityType: 'credential',
    entityId: id,
    action: 'credential.archived',
    userId: access.employeeId,
    projectId: existing.projectId ?? undefined,
  });
}

export async function restoreCredential(
  runtime: CredentialsRuntime,
  id: string,
  access: CredentialsAccessContext,
) {
  const existing = await runtime.prisma.credential.findFirst({
    where: {
      id,
      archivedAt: { not: null },
      ...(await buildCredentialRowVisibilityWhere(
        runtime.prisma,
        runtime.platformAccessResolver,
        access,
        'edit',
      )),
    },
  });
  if (!existing) throw new NotFoundException(`Credential ${id} not found`);

  await runtime.prisma.credential.update({ where: { id }, data: { archivedAt: null } });
  await runtime.auditService.log({
    entityType: 'credential',
    entityId: id,
    action: 'credential.restored',
    userId: access.employeeId,
    projectId: existing.projectId ?? undefined,
  });
}

export async function permanentlyDeleteCredential(
  runtime: CredentialsRuntime,
  id: string,
  access: CredentialsAccessContext,
  stepUpPassword?: string,
) {
  const existing = await runtime.prisma.credential.findFirst({
    where: {
      id,
      archivedAt: { not: null },
      ...(await buildCredentialRowVisibilityWhere(
        runtime.prisma,
        runtime.platformAccessResolver,
        access,
        'delete',
      )),
    },
    select: { id: true, projectId: true, criticality: true },
  });
  if (!existing) throw new NotFoundException(`Credential ${id} not found`);

  await assertPermanentDeleteStepUp(
    runtime,
    existing.criticality,
    access.employeeId,
    stepUpPassword,
  );

  await runtime.prisma.credential.delete({ where: { id } });
  await runtime.auditService.log({
    entityType: 'credential',
    entityId: id,
    action: 'credential.permanently_deleted',
    userId: access.employeeId,
    projectId: existing.projectId ?? undefined,
  });
}

async function findMutableCredential(
  runtime: CredentialsRuntime,
  id: string,
  access: CredentialsAccessContext,
  action: 'edit' | 'delete',
) {
  const existing = await runtime.prisma.credential.findFirst({
    where: {
      id,
      archivedAt: null,
      ...(await buildCredentialRowVisibilityWhere(
        runtime.prisma,
        runtime.platformAccessResolver,
        access,
        action,
      )),
    },
  });
  if (!existing) throw new NotFoundException(`Credential ${id} not found`);
  return existing;
}
