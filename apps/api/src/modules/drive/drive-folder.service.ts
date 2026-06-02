import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CopyObjectCommand } from '@aws-sdk/client-s3';
import { PrismaClient, type DriveSpaceEnum, type FilePurposeEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type {
  CreateDriveFolderDto,
  DriveFolderQueryParams,
  RenameDriveFolderDto,
} from './drive.types';
import { DRIVE_ROOT_STORAGE_FOLDER_NAME } from './drive-root-folder.constants';
import {
  parseEntityScope,
  scopeMatchesFolder,
  type DriveFolderEntityScopeFilter,
} from './drive-folder-scope';
import { jsonSafeForHttp } from './drive-json-safe';
import { FILE_ASSET_INCLUDE } from './drive-file-asset-include';
import { DriveR2Client } from './drive-r2.client';
import { readTenantOrganizationId } from './drive-tenant';
import { resolveStorageHomeContextPath } from './drive-storage-home-resolver';
import { buildStorageHomeKeyFromParams } from './drive-storage-home-path';
import { buildDriveAssetAccessWhere } from './drive-asset-access.where';
import type { DriveEntityAccess, DriveEntityContextAccess } from './drive-access.types';
import { buildLinkCreateInput } from './drive-metadata';
import { assertDriveFolderEntityScopeAccessible } from './drive-folder-entity-access';
import {
  buildDriveExplicitFolderGrantWhere,
  employeeCanManageDriveFolderGrants,
  employeeHasActiveDriveFolderGrant,
} from './drive-resource-access-grant.sync';

const ROOT_PARENT_TOKEN = 'root';
const COPY_RESTRICTED_VISIBILITIES = new Set<string>(['PERSONAL', 'RESTRICTED']);
const COPY_SENSITIVE_CONFIDENTIALITIES = new Set<string>([
  'FINANCE_SENSITIVE',
  'LEGAL_SENSITIVE',
  'SECRET_ADJACENT',
]);

@Injectable()
export class DriveFolderService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly r2: DriveR2Client,
    private readonly config: ConfigService,
  ) {}

  async listFolder(
    params: DriveFolderQueryParams,
    userId: string,
    access?: DriveEntityContextAccess,
  ) {
    const entityScope = parseEntityScope(params);
    await assertDriveFolderEntityScopeAccessible(this.prisma, entityScope, access);
    const space = entityScope ? 'COMPANY' : normalizeSpace(params.space);
    if (entityScope && params.space?.trim()) {
      const requested = params.space.trim().toUpperCase();
      if (requested !== 'COMPANY') {
        throw new BadRequestException('Entity-scoped folders use space COMPANY only.');
      }
    }
    const parentId = normalizeParentId(params.parentId);
    const ownerWhere =
      space === 'PERSONAL' ? { ownerId: userId } : entityScope ? { ownerId: null } : {};
    const scopeWhere = entityScopeWhere(entityScope);
    const rootStorage = await this.findOrCreateRootStorageFolder(space, userId, entityScope);
    if (parentId) {
      await this.assertFolderAccess(parentId, space, userId, entityScope, access);
    }
    const fileContainerId = parentId ?? rootStorage.id;
    await this.assertFolderContainerScope(fileContainerId, entityScope);

    const baseFolderWhere =
      parentId === null
        ? {
            space,
            parentId: null,
            deletedAt: null,
            id: { not: rootStorage.id },
            ...ownerWhere,
            ...scopeWhere,
          }
        : { space, parentId, deletedAt: null, ...ownerWhere, ...scopeWhere };
    const grantScope =
      parentId === null
        ? { space, parentId: null, deletedAt: null, ...scopeWhere }
        : { space, parentId, deletedAt: null, ...scopeWhere };
    const explicitGrantWhere = await buildDriveExplicitFolderGrantWhere(this.prisma, userId);
    const folderWhere = { OR: [baseFolderWhere, { AND: [explicitGrantWhere, grantScope] }] };

    const [folders, placements] = await Promise.all([
      this.prisma.driveFolder.findMany({
        where: folderWhere,
        orderBy: [{ name: 'asc' }],
      }),
      this.prisma.driveFolderItem.findMany({
        where: {
          folderId: fileContainerId,
          removedAt: null,
          itemType: 'FILE',
          fileAsset: {
            deletedAt: null,
            ...(await buildDriveAssetAccessWhere(this.prisma, access)),
          },
        },
        include: { fileAsset: { include: FILE_ASSET_INCLUDE } },
        orderBy: { placedAt: 'desc' },
      }),
    ]);

    return jsonSafeForHttp({
      space,
      parentId,
      scopeEntityType: entityScope?.scopeEntityType ?? null,
      scopeEntityId: entityScope?.scopeEntityId ?? null,
      folders,
      files: placements.map((placement) => placement.fileAsset).filter(Boolean),
      rootStorageFolderId: rootStorage.id,
    });
  }

  async listFolderTree(
    space: string,
    userId: string,
    scopeParams?: { scopeEntityType?: string; scopeEntityId?: string },
    access?: DriveEntityContextAccess,
  ) {
    const entityScope = parseEntityScope(scopeParams ?? {});
    await assertDriveFolderEntityScopeAccessible(this.prisma, entityScope, access);
    const normalized = entityScope ? 'COMPANY' : normalizeSpace(space);
    const ownerWhere =
      normalized === 'PERSONAL' ? { ownerId: userId } : entityScope ? { ownerId: null } : {};
    const folders = await this.prisma.driveFolder.findMany({
      where: {
        space: normalized,
        deletedAt: null,
        NOT: {
          AND: [{ parentId: null }, { name: DRIVE_ROOT_STORAGE_FOLDER_NAME }],
        },
        ...ownerWhere,
        ...entityScopeWhere(entityScope),
      },
      orderBy: [{ name: 'asc' }],
    });
    return jsonSafeForHttp({
      space: normalized,
      scopeEntityType: entityScope?.scopeEntityType ?? null,
      scopeEntityId: entityScope?.scopeEntityId ?? null,
      folders,
    });
  }

  async renameFolder(
    folderId: string,
    dto: RenameDriveFolderDto,
    userId: string,
    access?: DriveEntityContextAccess,
  ) {
    const existing = await this.assertCanUseFolder(folderId, userId, access);
    if (this.isReservedRootStorageFolder(existing)) {
      throw new BadRequestException('The root storage folder cannot be renamed.');
    }
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Folder name is required.');
    const folder = await this.prisma.driveFolder.update({
      where: { id: folderId },
      data: { name: name.slice(0, 180) },
    });
    return jsonSafeForHttp(folder);
  }

  async deleteFolder(folderId: string, userId: string, access?: DriveEntityContextAccess) {
    const existing = await this.assertCanUseFolder(folderId, userId, access);
    if (this.isReservedRootStorageFolder(existing)) {
      throw new BadRequestException('The root storage folder cannot be deleted.');
    }
    const childFolders = await this.prisma.driveFolder.count({
      where: { parentId: folderId, deletedAt: null },
    });
    if (childFolders > 0) {
      throw new BadRequestException('Remove or delete subfolders first.');
    }
    const activeItems = await this.prisma.driveFolderItem.count({
      where: { folderId, removedAt: null },
    });
    if (activeItems > 0) {
      throw new BadRequestException('Folder is not empty.');
    }
    await this.prisma.$transaction([
      this.prisma.driveFolderItem.updateMany({
        where: { childFolderId: folderId, removedAt: null },
        data: { removedAt: new Date() },
      }),
      this.prisma.driveFolder.update({
        where: { id: folderId },
        data: { deletedAt: new Date() },
      }),
    ]);
  }

  async createFolder(dto: CreateDriveFolderDto, userId: string, access?: DriveEntityContextAccess) {
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Folder name is required.');
    if (name === DRIVE_ROOT_STORAGE_FOLDER_NAME) {
      throw new BadRequestException('This folder name is reserved.');
    }
    const entityScope = parseEntityScope(dto);
    await assertDriveFolderEntityScopeAccessible(this.prisma, entityScope, access);
    const space = entityScope ? 'COMPANY' : normalizeSpace(dto.space);
    if (entityScope && dto.space?.trim() && dto.space.trim().toUpperCase() !== 'COMPANY') {
      throw new BadRequestException('Entity-scoped folders use space COMPANY only.');
    }
    const parentId = normalizeParentId(dto.parentId);
    if (parentId) await this.assertFolderAccess(parentId, space, userId, entityScope, access);

    const folder = await this.prisma.driveFolder.create({
      data: {
        name: name.slice(0, 180),
        space,
        parentId,
        scopeEntityType: entityScope?.scopeEntityType ?? null,
        scopeEntityId: entityScope?.scopeEntityId ?? null,
        ownerId: space === 'PERSONAL' ? userId : null,
        createdById: userId,
      },
    });

    if (parentId) {
      await this.prisma.driveFolderItem.create({
        data: {
          folderId: parentId,
          itemType: 'FOLDER',
          childFolderId: folder.id,
          placedById: userId,
        },
      });
    }

    return jsonSafeForHttp(folder);
  }

  async assertCanUseFolder(folderId: string, userId: string, access?: DriveEntityContextAccess) {
    const folder = await this.prisma.driveFolder.findUnique({ where: { id: folderId } });
    if (!folder || folder.deletedAt) throw new NotFoundException(`Folder ${folderId} not found`);
    if (await employeeHasActiveDriveFolderGrant(this.prisma, folderId, userId)) {
      return folder;
    }
    if (folder.space === 'PERSONAL' && folder.ownerId !== userId) {
      throw new NotFoundException(`Folder ${folderId} not found`);
    }
    if (folder.scopeEntityType && folder.scopeEntityId) {
      await assertDriveFolderEntityScopeAccessible(
        this.prisma,
        { scopeEntityType: folder.scopeEntityType, scopeEntityId: folder.scopeEntityId },
        access,
      );
    }
    return folder;
  }

  async assertCanManageFolderGrants(
    folderId: string,
    userId: string,
    access?: DriveEntityContextAccess,
  ) {
    const folder = await this.assertCanUseFolder(folderId, userId, access);
    const isOwner = folder.ownerId === userId || folder.createdById === userId;
    if (isOwner || (await employeeCanManageDriveFolderGrants(this.prisma, folderId, userId))) {
      return folder;
    }
    throw new ForbiddenException('You cannot manage access for this folder.');
  }

  async placeFile(
    folderId: string,
    fileAssetId: string,
    userId: string,
    access?: DriveEntityContextAccess,
  ) {
    await this.assertCanUseFolder(folderId, userId, access);
    return this.prisma.driveFolderItem.create({
      data: {
        folderId,
        itemType: 'FILE',
        fileAssetId,
        placedById: userId,
      },
    });
  }

  /** Adds a file to a folder when it is not already placed there (Library → Company/Personal). */
  async addFileToFolder(
    folderId: string,
    fileAssetId: string,
    userId: string,
    access?: DriveEntityAccess,
  ) {
    await this.assertCanUseFolder(folderId, userId, access);
    await this.assertCanAccessFileAsset(fileAssetId, access);
    const existing = await this.prisma.driveFolderItem.findFirst({
      where: { folderId, fileAssetId, itemType: 'FILE', removedAt: null },
    });
    if (existing) {
      return jsonSafeForHttp(existing);
    }
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.driveFolderItem.create({
        data: {
          folderId,
          itemType: 'FILE',
          fileAssetId,
          placedById: userId,
        },
      });
      await tx.fileAuditEvent.create({
        data: {
          fileAssetId,
          actorId: userId,
          action: 'folder_placement_added',
          metadata: { folderId, folderItemId: item.id },
        },
      });
      return jsonSafeForHttp(item);
    });
  }

  async removeFile(
    folderId: string,
    fileAssetId: string,
    userId: string,
    access?: DriveEntityContextAccess,
  ) {
    await this.assertCanUseFolder(folderId, userId, access);
    await this.assertCanAccessFileAsset(fileAssetId, access);
    const placement = await this.findActiveFilePlacement(folderId, fileAssetId);
    await this.prisma.$transaction(async (tx) => {
      await tx.driveFolderItem.update({
        where: { id: placement.id },
        data: { removedAt: new Date() },
      });
      await tx.fileAuditEvent.create({
        data: {
          fileAssetId,
          actorId: userId,
          action: 'folder_placement_removed',
          metadata: { folderId },
        },
      });
    });
  }

  async moveFile(
    sourceFolderId: string,
    targetFolderId: string,
    fileAssetId: string,
    userId: string,
    access?: DriveEntityAccess,
  ) {
    await this.assertCanUseFolder(sourceFolderId, userId, access);
    await this.assertCanUseFolder(targetFolderId, userId, access);
    await this.assertCanAccessFileAsset(fileAssetId, access);
    const placement = await this.findActiveFilePlacement(sourceFolderId, fileAssetId);
    const moved = await this.prisma.$transaction(async (tx) => {
      const row = await tx.driveFolderItem.update({
        where: { id: placement.id },
        data: { folderId: targetFolderId, placedById: userId, placedAt: new Date() },
        include: { fileAsset: { include: FILE_ASSET_INCLUDE } },
      });
      await tx.fileAuditEvent.create({
        data: {
          fileAssetId,
          actorId: userId,
          action: 'folder_placement_moved',
          metadata: { sourceFolderId, targetFolderId },
        },
      });
      return row;
    });
    return jsonSafeForHttp(moved.fileAsset);
  }

  async copyFile(
    targetFolderId: string,
    fileAssetId: string,
    userId: string,
    access?: DriveEntityAccess,
  ) {
    const targetFolder = await this.assertCanUseFolder(targetFolderId, userId, access);
    const source = await this.getAccessibleFileAsset(fileAssetId, access);
    await this.assertCopyAllowed(source.id, source, targetFolder);
    const storageKey = await this.copyStorageObject(
      source.storageKey,
      source.displayName,
      targetFolderId,
      source.purpose,
    );
    const copied = await this.prisma.fileAsset.create({
      data: {
        displayName: `${source.displayName} copy`,
        originalName: source.originalName,
        fileType: source.fileType,
        purpose: source.purpose,
        sourceModule: 'DRIVE',
        ownerId: userId,
        createdById: userId,
        visibility: source.visibility,
        confidentiality: source.confidentiality,
        storageProvider: source.storageProvider,
        storageKey,
        externalUrl: source.externalUrl,
        mimeType: source.mimeType,
        sizeBytes: source.sizeBytes,
        checksum: source.checksum,
        versions: storageKey
          ? {
              create: {
                versionNumber: 1,
                storageKey,
                uploadedById: userId,
                sizeBytes: source.sizeBytes,
                checksum: source.checksum,
                isCurrent: true,
              },
            }
          : undefined,
        links:
          targetFolder.scopeEntityType && targetFolder.scopeEntityId
            ? {
                create: buildLinkCreateInput({
                  entityType: targetFolder.scopeEntityType,
                  entityId: targetFolder.scopeEntityId,
                  linkType: 'ATTACHMENT',
                  linkedById: userId,
                }),
              }
            : undefined,
        folderPlacements: {
          create: { folderId: targetFolderId, itemType: 'FILE', placedById: userId },
        },
        auditEvents: {
          create: { action: 'copied', actorId: userId, metadata: { sourceFileAssetId: source.id } },
        },
      },
      include: FILE_ASSET_INCLUDE,
    });
    return jsonSafeForHttp(copied);
  }

  private async assertFolderContainerScope(
    folderId: string,
    entityScope: DriveFolderEntityScopeFilter | null,
  ) {
    const folder = await this.prisma.driveFolder.findUnique({ where: { id: folderId } });
    if (!folder || folder.deletedAt) {
      throw new NotFoundException(`Folder ${folderId} not found`);
    }
    if (!scopeMatchesFolder(folder, entityScope)) {
      throw new NotFoundException(`Folder ${folderId} not found`);
    }
  }

  private async assertFolderAccess(
    folderId: string,
    space: DriveSpaceEnum,
    userId: string,
    entityScope: DriveFolderEntityScopeFilter | null,
    access?: DriveEntityContextAccess,
  ) {
    const folder = await this.prisma.driveFolder.findUnique({ where: { id: folderId } });
    if (!folder || folder.deletedAt || folder.space !== space) {
      throw new NotFoundException(`Folder ${folderId} not found`);
    }
    if (!scopeMatchesFolder(folder, entityScope)) {
      throw new NotFoundException(`Folder ${folderId} not found`);
    }
    if (await employeeHasActiveDriveFolderGrant(this.prisma, folderId, userId)) {
      return;
    }
    if (space === 'PERSONAL' && folder.ownerId !== userId) {
      throw new NotFoundException(`Folder ${folderId} not found`);
    }
    if (folder.scopeEntityType && folder.scopeEntityId) {
      await assertDriveFolderEntityScopeAccessible(
        this.prisma,
        { scopeEntityType: folder.scopeEntityType, scopeEntityId: folder.scopeEntityId },
        access,
      );
    } else {
      await assertDriveFolderEntityScopeAccessible(this.prisma, entityScope, access);
    }
  }

  private async copyStorageObject(
    sourceKey: string | null,
    displayName: string,
    targetFolderId: string,
    purpose: FilePurposeEnum | null,
  ) {
    if (!sourceKey) return null;
    const fileAssetId = randomUUID();
    const orgId = readTenantOrganizationId(this.config);
    const contextPath = await resolveStorageHomeContextPath(
      this.prisma,
      'DRIVE_FOLDER',
      targetFolderId,
    );
    const targetKey = buildStorageHomeKeyFromParams(orgId, `${contextPath}/copies`, {
      displayName,
      fileAssetId,
      purpose: purpose ?? null,
    });
    await this.r2.ensureS3().send(
      new CopyObjectCommand({
        Bucket: this.r2.bucket,
        CopySource: `${this.r2.bucket}/${encodeURIComponent(sourceKey)}`,
        Key: targetKey,
      }),
    );
    return targetKey;
  }

  private async findActiveFilePlacement(folderId: string, fileAssetId: string) {
    const placement = await this.prisma.driveFolderItem.findFirst({
      where: { folderId, fileAssetId, itemType: 'FILE', removedAt: null },
    });
    if (!placement) throw new NotFoundException('File placement not found.');
    return placement;
  }

  private async findOrCreateRootStorageFolder(
    space: DriveSpaceEnum,
    userId: string,
    entityScope: DriveFolderEntityScopeFilter | null,
  ) {
    const ownerFilter = space === 'PERSONAL' ? { ownerId: userId } : { ownerId: null };
    const scopeWhere = entityScopeWhere(entityScope);
    const existing = await this.prisma.driveFolder.findFirst({
      where: {
        space,
        parentId: null,
        name: DRIVE_ROOT_STORAGE_FOLDER_NAME,
        deletedAt: null,
        ...ownerFilter,
        ...scopeWhere,
      },
    });
    if (existing) return existing;
    return this.prisma.driveFolder.create({
      data: {
        name: DRIVE_ROOT_STORAGE_FOLDER_NAME,
        space,
        parentId: null,
        scopeEntityType: entityScope?.scopeEntityType ?? null,
        scopeEntityId: entityScope?.scopeEntityId ?? null,
        ownerId: space === 'PERSONAL' ? userId : null,
        createdById: userId,
      },
    });
  }

  private isReservedRootStorageFolder(folder: { name: string; parentId: string | null }) {
    return folder.parentId === null && folder.name === DRIVE_ROOT_STORAGE_FOLDER_NAME;
  }

  private async assertCanAccessFileAsset(fileAssetId: string, access?: DriveEntityAccess) {
    await this.getAccessibleFileAsset(fileAssetId, access);
  }

  private async getAccessibleFileAsset(fileAssetId: string, access?: DriveEntityAccess) {
    const source = await this.prisma.fileAsset.findFirst({
      where: {
        id: fileAssetId,
        deletedAt: null,
        ...(await buildDriveAssetAccessWhere(this.prisma, access)),
      },
    });
    if (!source) {
      throw new NotFoundException(`File asset ${fileAssetId} not found`);
    }
    return source;
  }

  private async assertCopyAllowed(
    sourceFileAssetId: string,
    source: { visibility: string; confidentiality: string },
    targetFolder: {
      space: DriveSpaceEnum;
      scopeEntityType: string | null;
      scopeEntityId: string | null;
    },
  ) {
    if (
      COPY_RESTRICTED_VISIBILITIES.has(source.visibility) ||
      COPY_SENSITIVE_CONFIDENTIALITIES.has(source.confidentiality)
    ) {
      throw new BadRequestException(
        'Restricted or sensitive Drive files cannot be copied as independent files.',
      );
    }
    if (targetFolder.space === 'PERSONAL') {
      const activeLinks = await this.prisma.fileLink.count({
        where: { fileAssetId: sourceFileAssetId, unlinkedAt: null },
      });
      if (activeLinks > 0) {
        throw new BadRequestException(
          'Business-linked Drive files cannot be copied into Personal Drive.',
        );
      }
    }
  }
}

function normalizeSpace(input: string | undefined): DriveSpaceEnum {
  const value = input?.trim().toUpperCase();
  if (value === 'COMPANY' || value === 'PERSONAL') return value;
  throw new BadRequestException('space must be COMPANY or PERSONAL.');
}

function normalizeParentId(input: string | undefined): string | null {
  const value = input?.trim();
  if (!value || value === ROOT_PARENT_TOKEN) return null;
  return value;
}

function entityScopeWhere(scope: DriveFolderEntityScopeFilter | null) {
  if (!scope) {
    return { scopeEntityType: null, scopeEntityId: null };
  }
  return {
    scopeEntityType: scope.scopeEntityType,
    scopeEntityId: scope.scopeEntityId,
  };
}
