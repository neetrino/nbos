import { NotFoundException } from '@nestjs/common';
import type { Prisma } from '@nbos/database';
import { resolveCredentialCreateDefaults } from '@nbos/shared';
import type { CredentialsAccessContext } from './credentials-access';
import type { CreateCredentialDto, UpdateCredentialDto } from './credential-domain.types';
import { assertCredentialTypeChangeAllowed } from './credential-type-change-guard';
import { nullableDate } from './credential-date.utils';
import { encryptSensitiveFields, decryptFieldIfEncrypted } from './credential-crypto.mapper';
import { mapCredentialForApi } from './credential-api.mapper';
import { buildCredentialUpdateData, detectChangedCredentialFields } from './credential-update-data';
import { buildCredentialRowVisibilityWhere } from './credential-visibility.loader';
import { assertPermanentDeleteStepUp } from './credential-permanent-delete.policy';
import {
  archiveCredentialSecretVersions,
  resolveSecretRotationSource,
} from './credential-archive-secret-versions';
import {
  loadCredentialManualGrants,
  manualGrantsFromEmployeeIds,
  syncCredentialManualGrants,
} from './credential-manual-grants';
import {
  normalizeCredentialFolderIds,
  replaceCredentialFolderMemberships,
} from './credential-folders.operations';
import type { CredentialsRuntime } from './credentials-runtime';

const CREDENTIAL_DETAIL_INCLUDE = {
  project: { select: { id: true, name: true } },
  provider: { select: { id: true, name: true, slug: true, website: true } },
  folderMemberships: {
    select: {
      folderId: true,
      isPrimary: true,
      folder: { select: { id: true, name: true } },
    },
  },
} as const;

type FavoriteDelegate = {
  findMany: (args: unknown) => Promise<Array<{ employeeId: string }>>;
};

function credentialFavoriteDelegate(runtime: CredentialsRuntime): FavoriteDelegate | null {
  return (
    (
      runtime.prisma as unknown as {
        credentialFavorite?: FavoriteDelegate;
      }
    ).credentialFavorite ?? null
  );
}

async function loadFavoriteRows(
  runtime: CredentialsRuntime,
  credentialId: string,
  employeeId: string,
): Promise<Array<{ employeeId: string }>> {
  const favoriteDelegate = credentialFavoriteDelegate(runtime);
  if (!favoriteDelegate) return [];
  return favoriteDelegate.findMany({
    where: { credentialId, employeeId },
    select: { employeeId: true },
  });
}

async function loadCredentialAfterFolderChange(runtime: CredentialsRuntime, credentialId: string) {
  return runtime.prisma.credential.findUnique({
    where: { id: credentialId },
    include: CREDENTIAL_DETAIL_INCLUDE,
  });
}

export async function findCredentialById(
  runtime: CredentialsRuntime,
  id: string,
  access: CredentialsAccessContext,
) {
  const credential = await runtime.prisma.credential.findFirst({
    where: {
      id,
      trashedAt: null,
      ...(await buildCredentialRowVisibilityWhere(
        runtime.prisma,
        runtime.platformAccessResolver,
        access,
        'view',
      )),
    },
    include: CREDENTIAL_DETAIL_INCLUDE,
  });
  if (!credential) throw new NotFoundException(`Credential ${id} not found`);

  const comment = decryptComment(runtime, credential.secureNotes);
  const [manualGrants, favorites] = await Promise.all([
    loadCredentialManualGrants(runtime.prisma, id),
    loadFavoriteRows(runtime, id, access.employeeId),
    runtime.auditService.log({
      entityType: 'credential',
      entityId: id,
      action: 'credential.view',
      userId: access.employeeId,
      projectId: credential.projectId ?? undefined,
    }),
  ]);
  return { ...mapCredentialForApi({ ...credential, favorites }), comment, manualGrants };
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
      providerId: data.providerId ?? undefined,
      name: data.name,
      url: data.url,
      login: data.login,
      password: encrypted.password,
      passphrase: encrypted.passphrase,
      apiKey: encrypted.apiKey,
      envData: encrypted.envData,
      phone: data.phone,
      phones: data.phones ?? (data.phone ? [data.phone] : []),
      appStorePlatform: data.appStorePlatform as Prisma.CredentialCreateInput['appStorePlatform'],
      notes: data.publicNotes ?? data.notes,
      publicNotes: data.publicNotes ?? data.notes,
      secureNotes: encrypted.secureNotes,
      lastRotatedAt: nullableDate(data.lastRotatedAt),
      nextRotationAt: nullableDate(data.nextRotationAt) ?? new Date(autoDefaults.nextRotationAt),
      rotationOwnerId: data.rotationOwnerId,
      accessLevel,
      allowedEmployees: data.allowedEmployees ?? [],
    },
    include: CREDENTIAL_DETAIL_INCLUDE,
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
  const folderIds = normalizeCredentialFolderIds(data);
  if (folderIds !== undefined && folderIds.length > 0) {
    await replaceCredentialFolderMemberships(runtime, credential.id, folderIds, {
      employeeId: userId,
      departmentIds: [],
      viewScope: 'ALL',
      editScope: 'ALL',
      deleteScope: 'ALL',
    });
    const updated = await loadCredentialAfterFolderChange(runtime, credential.id);
    if (updated) return mapCredentialForApi({ ...updated, favorites: [] });
  }

  return mapCredentialForApi({ ...credential, favorites: [] });
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
      trashedAt: null,
      ...(await buildCredentialRowVisibilityWhere(
        runtime.prisma,
        runtime.platformAccessResolver,
        access,
        'edit',
      )),
    },
  });
  if (!existing) throw new NotFoundException(`Credential ${id} not found`);

  assertCredentialTypeChangeAllowed(existing, data);

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
    include: CREDENTIAL_DETAIL_INCLUDE,
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
  const folderIds = normalizeCredentialFolderIds(data);
  if (folderIds !== undefined) {
    await replaceCredentialFolderMemberships(runtime, credential.id, folderIds, access);
    const updated = await loadCredentialAfterFolderChange(runtime, credential.id);
    if (updated) {
      const favorites = await loadFavoriteRows(runtime, updated.id, access.employeeId);
      return mapCredentialForApi({ ...updated, favorites });
    }
  }

  const favorites = await loadFavoriteRows(runtime, credential.id, access.employeeId);
  return mapCredentialForApi({ ...credential, favorites });
}

export async function archiveCredential(
  runtime: CredentialsRuntime,
  id: string,
  access: CredentialsAccessContext,
) {
  const existing = await findMutableCredential(runtime, id, access, 'delete');
  const trashedAt = new Date();
  await runtime.prisma.$transaction([
    runtime.prisma.credential.update({
      where: { id },
      data: { trashedAt },
    }),
    runtime.prisma.credentialFolderMembership.deleteMany({ where: { credentialId: id } }),
    runtime.prisma.credentialFavorite.deleteMany({ where: { credentialId: id } }),
  ]);
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
      trashedAt: { not: null },
      ...(await buildCredentialRowVisibilityWhere(
        runtime.prisma,
        runtime.platformAccessResolver,
        access,
        'edit',
      )),
    },
  });
  if (!existing) throw new NotFoundException(`Credential ${id} not found`);

  await runtime.prisma.credential.update({ where: { id }, data: { trashedAt: null } });
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
      trashedAt: { not: null },
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

  await assertPermanentDeleteStepUp(runtime, access.employeeId, stepUpPassword);

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
      trashedAt: null,
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
