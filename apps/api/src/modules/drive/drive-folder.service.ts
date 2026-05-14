import { randomUUID } from 'node:crypto';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CopyObjectCommand } from '@aws-sdk/client-s3';
import { PrismaClient, type DriveSpaceEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type {
  CreateDriveFolderDto,
  DriveFolderQueryParams,
  RenameDriveFolderDto,
} from './drive.types';
import { DRIVE_ROOT_STORAGE_FOLDER_NAME } from './drive-root-folder.constants';
import { jsonSafeForHttp } from './drive-json-safe';
import { FILE_ASSET_INCLUDE } from './drive-file-asset-include';
import { DriveR2Client } from './drive-r2.client';
import { buildSessionUploadStorageKey } from './drive-upload-path';

const ROOT_PARENT_TOKEN = 'root';

@Injectable()
export class DriveFolderService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly r2: DriveR2Client,
  ) {}

  async listFolder(params: DriveFolderQueryParams, userId: string) {
    const space = normalizeSpace(params.space);
    const parentId = normalizeParentId(params.parentId);
    const ownerWhere = space === 'PERSONAL' ? { ownerId: userId } : {};
    const rootStorage = await this.findOrCreateRootStorageFolder(space, userId);
    const fileContainerId = parentId ?? rootStorage.id;

    const folderWhere =
      parentId === null
        ? {
            space,
            parentId: null,
            deletedAt: null,
            id: { not: rootStorage.id },
            ...ownerWhere,
          }
        : { space, parentId, deletedAt: null, ...ownerWhere };

    const [folders, placements] = await Promise.all([
      this.prisma.driveFolder.findMany({
        where: folderWhere,
        orderBy: [{ name: 'asc' }],
      }),
      this.prisma.driveFolderItem.findMany({
        where: { folderId: fileContainerId, removedAt: null, itemType: 'FILE' },
        include: { fileAsset: { include: FILE_ASSET_INCLUDE } },
        orderBy: { placedAt: 'desc' },
      }),
    ]);

    return jsonSafeForHttp({
      space,
      parentId,
      folders,
      files: placements.map((placement) => placement.fileAsset).filter(Boolean),
      rootStorageFolderId: rootStorage.id,
    });
  }

  async listFolderTree(space: string, userId: string) {
    const normalized = normalizeSpace(space);
    const ownerWhere = normalized === 'PERSONAL' ? { ownerId: userId } : {};
    const folders = await this.prisma.driveFolder.findMany({
      where: {
        space: normalized,
        deletedAt: null,
        NOT: {
          AND: [{ parentId: null }, { name: DRIVE_ROOT_STORAGE_FOLDER_NAME }],
        },
        ...ownerWhere,
      },
      orderBy: [{ name: 'asc' }],
    });
    return jsonSafeForHttp({ space: normalized, folders });
  }

  async renameFolder(folderId: string, dto: RenameDriveFolderDto, userId: string) {
    const existing = await this.assertCanUseFolder(folderId, userId);
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

  async deleteFolder(folderId: string, userId: string) {
    const existing = await this.assertCanUseFolder(folderId, userId);
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

  async createFolder(dto: CreateDriveFolderDto, userId: string) {
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Folder name is required.');
    if (name === DRIVE_ROOT_STORAGE_FOLDER_NAME) {
      throw new BadRequestException('This folder name is reserved.');
    }
    const space = normalizeSpace(dto.space);
    const parentId = normalizeParentId(dto.parentId);
    if (parentId) await this.assertFolderAccess(parentId, space, userId);

    const folder = await this.prisma.driveFolder.create({
      data: {
        name: name.slice(0, 180),
        space,
        parentId,
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

  async assertCanUseFolder(folderId: string, userId: string) {
    const folder = await this.prisma.driveFolder.findUnique({ where: { id: folderId } });
    if (!folder || folder.deletedAt) throw new NotFoundException(`Folder ${folderId} not found`);
    if (folder.space === 'PERSONAL' && folder.ownerId !== userId) {
      throw new NotFoundException(`Folder ${folderId} not found`);
    }
    return folder;
  }

  async placeFile(folderId: string, fileAssetId: string, userId: string) {
    await this.assertCanUseFolder(folderId, userId);
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
  async addFileToFolder(folderId: string, fileAssetId: string, userId: string) {
    await this.assertCanUseFolder(folderId, userId);
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

  async removeFile(folderId: string, fileAssetId: string, userId: string) {
    await this.assertCanUseFolder(folderId, userId);
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
  ) {
    await this.assertCanUseFolder(sourceFolderId, userId);
    await this.assertCanUseFolder(targetFolderId, userId);
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

  async copyFile(targetFolderId: string, fileAssetId: string, userId: string) {
    await this.assertCanUseFolder(targetFolderId, userId);
    const source = await this.prisma.fileAsset.findUnique({ where: { id: fileAssetId } });
    if (!source || source.deletedAt)
      throw new NotFoundException(`File asset ${fileAssetId} not found`);
    const storageKey = await this.copyStorageObject(source.storageKey, source.displayName);
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

  private async assertFolderAccess(folderId: string, space: DriveSpaceEnum, userId: string) {
    const folder = await this.prisma.driveFolder.findUnique({ where: { id: folderId } });
    if (!folder || folder.deletedAt || folder.space !== space) {
      throw new NotFoundException(`Folder ${folderId} not found`);
    }
    if (space === 'PERSONAL' && folder.ownerId !== userId) {
      throw new NotFoundException(`Folder ${folderId} not found`);
    }
  }

  private async copyStorageObject(sourceKey: string | null, displayName: string) {
    if (!sourceKey) return null;
    const targetKey = buildSessionUploadStorageKey(randomUUID(), displayName);
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

  private async findOrCreateRootStorageFolder(space: DriveSpaceEnum, userId: string) {
    const ownerFilter = space === 'PERSONAL' ? { ownerId: userId } : { ownerId: null };
    const existing = await this.prisma.driveFolder.findFirst({
      where: {
        space,
        parentId: null,
        name: DRIVE_ROOT_STORAGE_FOLDER_NAME,
        deletedAt: null,
        ...ownerFilter,
      },
    });
    if (existing) return existing;
    return this.prisma.driveFolder.create({
      data: {
        name: DRIVE_ROOT_STORAGE_FOLDER_NAME,
        space,
        parentId: null,
        ownerId: space === 'PERSONAL' ? userId : null,
        createdById: userId,
      },
    });
  }

  private isReservedRootStorageFolder(folder: { name: string; parentId: string | null }) {
    return folder.parentId === null && folder.name === DRIVE_ROOT_STORAGE_FOLDER_NAME;
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
