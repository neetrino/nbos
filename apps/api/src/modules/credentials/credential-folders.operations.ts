import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@nbos/database';
import { buildCredentialRowVisibilityWhere } from './credential-visibility.loader';
import type { CredentialsAccessContext } from './credentials-access';
import type { CredentialsRuntime } from './credentials-runtime';

export interface CredentialFolderApiRow {
  id: string;
  name: string;
  scope: string;
  projectId: string | null;
  parentId: string | null;
  sortOrder: number;
  credentialCount: number;
}

function normalizeFolderScope(scope?: string): string {
  const normalized = (scope ?? 'PROJECT').trim().toUpperCase();
  if (['ALL', 'MY', 'TEAM', 'PROJECT', 'SECRET'].includes(normalized)) return normalized;
  return 'PROJECT';
}

function normalizeFolderName(name?: string): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) throw new BadRequestException('Folder name is required');
  if (trimmed.length > 80) throw new BadRequestException('Folder name is too long');
  return trimmed;
}

function folderWhereForAccess(
  access: CredentialsAccessContext,
  scope?: string,
  parentId?: string | null,
  projectId?: string,
) {
  const normalizedScope = scope ? normalizeFolderScope(scope) : undefined;
  const where: Prisma.CredentialFolderWhereInput = { archivedAt: null };
  if (normalizedScope && normalizedScope !== 'ALL') where.scope = normalizedScope;
  if (parentId !== undefined) where.parentId = parentId;
  if (projectId) where.projectId = projectId;
  return where;
}

/** `undefined` = all folders; `null` = root level only. */
function parseFolderParentIdFilter(parentId?: string): string | null | undefined {
  if (parentId === undefined) return undefined;
  const trimmed = parentId.trim();
  if (!trimmed || trimmed.toLowerCase() === 'root') return null;
  return trimmed;
}

export async function listCredentialFolders(
  runtime: CredentialsRuntime,
  access: CredentialsAccessContext,
  scope?: string,
  parentId?: string,
  projectId?: string,
): Promise<{ folders: CredentialFolderApiRow[] }> {
  const folders = await runtime.prisma.credentialFolder.findMany({
    where: folderWhereForAccess(
      access,
      scope,
      parseFolderParentIdFilter(parentId),
      projectId?.trim() || undefined,
    ),
    include: {
      memberships: {
        where: { credential: { archivedAt: null } },
        select: { credentialId: true },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  return {
    folders: folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      scope: folder.scope,
      projectId: folder.projectId,
      parentId: folder.parentId,
      sortOrder: folder.sortOrder,
      credentialCount: folder.memberships.length,
    })),
  };
}

export async function createCredentialFolder(
  runtime: CredentialsRuntime,
  input: { name?: string; scope?: string; projectId?: string | null; parentId?: string | null },
  access: CredentialsAccessContext,
): Promise<CredentialFolderApiRow> {
  const scope = normalizeFolderScope(input.scope);
  if (input.parentId) {
    const parent = await runtime.prisma.credentialFolder.findFirst({
      where: { id: input.parentId, archivedAt: null, scope },
      select: { id: true, projectId: true },
    });
    if (!parent) throw new BadRequestException('Parent folder is invalid');
    if (input.projectId && parent.projectId && parent.projectId !== input.projectId) {
      throw new BadRequestException('Parent folder belongs to a different project');
    }
  }

  const folder = await runtime.prisma.credentialFolder.create({
    data: {
      name: normalizeFolderName(input.name),
      scope,
      projectId: input.projectId ?? undefined,
      parentId: input.parentId ?? undefined,
      ownerId: access.employeeId,
    },
    include: { _count: { select: { memberships: true } } },
  });

  await runtime.auditService.log({
    entityType: 'credential_folder',
    entityId: folder.id,
    action: 'credential_folder.create',
    userId: access.employeeId,
    projectId: folder.projectId ?? undefined,
  });

  return {
    id: folder.id,
    name: folder.name,
    scope: folder.scope,
    projectId: folder.projectId,
    parentId: folder.parentId,
    sortOrder: folder.sortOrder,
    credentialCount: folder._count.memberships,
  };
}

export async function updateCredentialFolder(
  runtime: CredentialsRuntime,
  folderId: string,
  input: { name?: string },
  access: CredentialsAccessContext,
): Promise<CredentialFolderApiRow> {
  const existing = await runtime.prisma.credentialFolder.findFirst({
    where: { id: folderId, archivedAt: null },
  });
  if (!existing) throw new NotFoundException(`Credential folder ${folderId} not found`);

  const folder = await runtime.prisma.credentialFolder.update({
    where: { id: folderId },
    data: { name: normalizeFolderName(input.name) },
    include: { _count: { select: { memberships: true } } },
  });

  await runtime.auditService.log({
    entityType: 'credential_folder',
    entityId: folder.id,
    action: 'credential_folder.update',
    userId: access.employeeId,
    projectId: folder.projectId ?? undefined,
  });

  return {
    id: folder.id,
    name: folder.name,
    scope: folder.scope,
    projectId: folder.projectId,
    parentId: folder.parentId,
    sortOrder: folder.sortOrder,
    credentialCount: folder._count.memberships,
  };
}

const NON_EMPTY_FOLDER_MESSAGE = 'Move credentials to Trash or remove them first.';

export async function deleteCredentialFolder(
  runtime: CredentialsRuntime,
  folderId: string,
  access: CredentialsAccessContext,
) {
  const existing = await runtime.prisma.credentialFolder.findFirst({
    where: { id: folderId, archivedAt: null },
  });
  if (!existing) throw new NotFoundException(`Credential folder ${folderId} not found`);

  const [activeMemberships, childFolders] = await Promise.all([
    runtime.prisma.credentialFolderMembership.count({
      where: { folderId, credential: { archivedAt: null } },
    }),
    runtime.prisma.credentialFolder.count({
      where: { parentId: folderId, archivedAt: null },
    }),
  ]);

  if (activeMemberships > 0 || childFolders > 0) {
    throw new ConflictException(NON_EMPTY_FOLDER_MESSAGE);
  }

  await runtime.prisma.credentialFolder.delete({ where: { id: folderId } });

  await runtime.auditService.log({
    entityType: 'credential_folder',
    entityId: folderId,
    action: 'credential_folder.deleted',
    userId: access.employeeId,
    projectId: existing.projectId ?? undefined,
  });
}

/** @deprecated Use deleteCredentialFolder (Model 6 empty-only hard delete). */
export async function archiveCredentialFolder(
  runtime: CredentialsRuntime,
  folderId: string,
  access: CredentialsAccessContext,
) {
  return deleteCredentialFolder(runtime, folderId, access);
}

export function normalizeCredentialFolderIds(input: {
  folderIds?: string[];
  folderId?: string | null;
}): string[] | undefined {
  if (Array.isArray(input.folderIds)) {
    return [...new Set(input.folderIds.filter((id) => typeof id === 'string' && id.trim()))];
  }
  if (input.folderId !== undefined) return input.folderId ? [input.folderId] : [];
  return undefined;
}

function folderScopeForAccessLevel(accessLevel: string): string | null {
  switch (accessLevel) {
    case 'PERSONAL':
      return 'MY';
    case 'DEPARTMENT':
      return 'TEAM';
    case 'PROJECT_TEAM':
      return 'PROJECT';
    case 'SECRET':
      return 'SECRET';
    default:
      return null;
  }
}

function assertFoldersMatchCredentialScope(
  credential: { accessLevel: string; projectId: string | null },
  folders: { id: string; scope: string; projectId: string | null }[],
) {
  const expectedScope = folderScopeForAccessLevel(credential.accessLevel);
  if (!expectedScope) {
    throw new BadRequestException('Credentials of this access level cannot use folders');
  }
  for (const folder of folders) {
    if (folder.scope !== expectedScope) {
      throw new BadRequestException('Folder scope does not match credential section');
    }
    if (
      expectedScope === 'PROJECT' &&
      credential.projectId &&
      folder.projectId !== credential.projectId
    ) {
      throw new BadRequestException('Folder belongs to a different project');
    }
  }
}

export async function replaceCredentialFolderMemberships(
  runtime: CredentialsRuntime,
  credentialId: string,
  folderIds: string[],
  access: CredentialsAccessContext,
) {
  const visible = await runtime.prisma.credential.findFirst({
    where: {
      id: credentialId,
      archivedAt: null,
      ...(await buildCredentialRowVisibilityWhere(
        runtime.prisma,
        runtime.platformAccessResolver,
        access,
        'edit',
      )),
    },
    select: { id: true, projectId: true, accessLevel: true },
  });
  if (!visible) throw new NotFoundException(`Credential ${credentialId} not found`);

  if (folderIds.length > 0) {
    const folders = await runtime.prisma.credentialFolder.findMany({
      where: { id: { in: folderIds }, archivedAt: null },
      select: { id: true, scope: true, projectId: true },
    });
    if (folders.length !== folderIds.length) {
      throw new BadRequestException('One or more folders are invalid');
    }
    assertFoldersMatchCredentialScope(visible, folders);
  }

  await runtime.prisma.$transaction([
    runtime.prisma.credentialFolderMembership.deleteMany({ where: { credentialId } }),
    ...folderIds.map((folderId, index) =>
      runtime.prisma.credentialFolderMembership.create({
        data: {
          credentialId,
          folderId,
          isPrimary: index === 0,
          createdById: access.employeeId,
        },
      }),
    ),
  ]);

  await runtime.auditService.log({
    entityType: 'credential',
    entityId: credentialId,
    action: 'credential.folder_memberships.replace',
    userId: access.employeeId,
    projectId: visible.projectId ?? undefined,
    changes: { folderIds },
  });

  return { credentialId, folderIds };
}
