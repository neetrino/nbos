import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import {
  buildDriveAssetAccessWhere,
  buildDriveAssetBaseAccessWhere,
} from './drive-asset-access.where';
import type { DriveEntityAccess } from './drive-access.types';
import {
  DRIVE_FILE_ASSET_RESOURCE_TYPE,
  parseDriveGrantPermissionFromReason,
} from './drive-resource-access-grant.sync';
import { activeResourceAccessGrantWhere } from '../credentials/credential-active-grant.where';
import type { FileGrantPermission } from './drive-grant-permissions';
import {
  evaluateDriveFileAction,
  listAllowedDriveFileActions,
  type DriveFileAction,
  type DriveFileActionFileSnapshot,
  type DriveFileActorCapabilities,
} from './drive-file-action-policy';

interface DriveFilePolicyRow {
  id: string;
  ownerId: string | null;
  createdById: string | null;
  visibility: string;
  confidentiality: string;
  status: string;
}

export async function loadEmployeeDriveFileGrantPermissions(
  prisma: InstanceType<typeof PrismaClient>,
  fileAssetId: string,
  employeeId: string,
): Promise<Set<FileGrantPermission>> {
  const permissions = new Set<FileGrantPermission>();
  const legacy = await prisma.fileAssetGrant.findMany({
    where: {
      fileAssetId,
      granteeEmployeeId: employeeId,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { permission: true },
  });
  for (const row of legacy) {
    permissions.add(row.permission as FileGrantPermission);
  }

  const platform = await prisma.resourceAccessGrant.findMany({
    where: {
      resourceType: DRIVE_FILE_ASSET_RESOURCE_TYPE,
      resourceId: fileAssetId,
      employeeId,
      ...activeResourceAccessGrantWhere(),
    },
    select: { reason: true, level: true },
  });
  for (const row of platform) {
    const parsed = parseDriveGrantPermissionFromReason(row.reason);
    if (parsed) {
      permissions.add(parsed);
      continue;
    }
    if (row.level === 'VIEW') {
      permissions.add('VIEW');
    } else {
      permissions.add('EDIT_METADATA');
    }
  }
  return permissions;
}

export async function resolveDriveFileActorCapabilities(
  prisma: InstanceType<typeof PrismaClient>,
  file: DriveFilePolicyRow,
  access: DriveEntityAccess,
): Promise<DriveFileActorCapabilities> {
  const employeeId = access.employeeId;
  const isOrigin =
    file.ownerId === employeeId || (file.ownerId === null && file.createdById === employeeId);

  const baseWhere = await buildDriveAssetBaseAccessWhere(prisma, access);
  const hasBaseAccess = Boolean(
    await prisma.fileAsset.findFirst({
      where: { id: file.id, deletedAt: null, ...baseWhere },
      select: { id: true },
    }),
  );

  const grantPermissions = await loadEmployeeDriveFileGrantPermissions(prisma, file.id, employeeId);

  return { employeeId, isOrigin, hasBaseAccess, grantPermissions };
}

async function loadPolicyFileRow(
  prisma: InstanceType<typeof PrismaClient>,
  fileAssetId: string,
  access?: DriveEntityAccess,
): Promise<DriveFilePolicyRow> {
  const accessWhere = await buildDriveAssetAccessWhere(prisma, access);
  const row = await prisma.fileAsset.findFirst({
    where: { id: fileAssetId, deletedAt: null, ...accessWhere },
    select: {
      id: true,
      ownerId: true,
      createdById: true,
      visibility: true,
      confidentiality: true,
      status: true,
    },
  });
  if (!row) {
    throw new NotFoundException(`File asset ${fileAssetId} not found`);
  }
  return row;
}

export async function buildDriveFileActionSnapshot(
  prisma: InstanceType<typeof PrismaClient>,
  file: DriveFilePolicyRow,
  options?: { targetFolderSpace?: 'COMPANY' | 'PERSONAL' },
): Promise<DriveFileActionFileSnapshot> {
  const activeBusinessLinkCount = await prisma.fileLink.count({
    where: { fileAssetId: file.id, unlinkedAt: null },
  });
  return {
    visibility: file.visibility,
    confidentiality: file.confidentiality,
    status: file.status,
    activeBusinessLinkCount,
    targetFolderSpace: options?.targetFolderSpace,
  };
}

/** Throws when the actor may not perform the action (404 when file not visible). */
export async function assertDriveFileActionAllowed(
  prisma: InstanceType<typeof PrismaClient>,
  fileAssetId: string,
  access: DriveEntityAccess | undefined,
  action: DriveFileAction,
  options?: { targetFolderSpace?: 'COMPANY' | 'PERSONAL' },
): Promise<void> {
  if (!access?.employeeId) {
    throw new ForbiddenException('Authentication required for this Drive action.');
  }
  const file = await loadPolicyFileRow(prisma, fileAssetId, access);
  const capabilities = await resolveDriveFileActorCapabilities(prisma, file, access);
  const snapshot = await buildDriveFileActionSnapshot(prisma, file, options);
  const decision = evaluateDriveFileAction(capabilities, action, snapshot);
  if (!decision.allowed) {
    const message = decision.reason ?? 'Drive action not allowed.';
    if (
      action === 'COPY' &&
      (message.includes('cannot be copied') || message.includes('Personal Drive'))
    ) {
      throw new BadRequestException(message);
    }
    throw new ForbiddenException(message);
  }
}

export async function listDriveFileAllowedActionsForActor(
  prisma: InstanceType<typeof PrismaClient>,
  fileAssetId: string,
  access: DriveEntityAccess | undefined,
  options?: { targetFolderSpace?: 'COMPANY' | 'PERSONAL' },
): Promise<DriveFileAction[]> {
  if (!access?.employeeId) return [];
  const file = await loadPolicyFileRow(prisma, fileAssetId, access);
  const capabilities = await resolveDriveFileActorCapabilities(prisma, file, access);
  const snapshot = await buildDriveFileActionSnapshot(prisma, file, options);
  return listAllowedDriveFileActions(capabilities, snapshot);
}

/** Maps legacy grant permission checks to policy actions. */
export function driveGrantPermissionToActions(permission: FileGrantPermission): DriveFileAction[] {
  switch (permission) {
    case 'VIEW':
      return [];
    case 'SHARE':
      return ['SHARE'];
    case 'EDIT_METADATA':
      return ['EDIT_METADATA'];
    case 'UPLOAD_VERSION':
      return ['UPLOAD_VERSION'];
    case 'DELETE':
      return ['ARCHIVE', 'TRASH', 'PERMANENT_DELETE', 'UNLINK'];
    case 'EXPORT':
      return ['EXPORT'];
    default:
      return [];
  }
}
