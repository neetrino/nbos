import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type DriveSpaceEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type { CreateDriveFolderDto, DriveFolderQueryParams } from './drive.types';
import { jsonSafeForHttp } from './drive-json-safe';
import { FILE_ASSET_INCLUDE } from './drive-file-asset-include';

const ROOT_PARENT_TOKEN = 'root';

@Injectable()
export class DriveFolderService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async listFolder(params: DriveFolderQueryParams, userId: string) {
    const space = normalizeSpace(params.space);
    const parentId = normalizeParentId(params.parentId);
    const ownerWhere = space === 'PERSONAL' ? { ownerId: userId } : {};
    const folderWhere = { space, parentId, deletedAt: null, ...ownerWhere };

    const [folders, placements] = await Promise.all([
      this.prisma.driveFolder.findMany({
        where: folderWhere,
        orderBy: [{ name: 'asc' }],
      }),
      parentId
        ? this.prisma.driveFolderItem.findMany({
            where: { folderId: parentId, removedAt: null, itemType: 'FILE' },
            include: { fileAsset: { include: FILE_ASSET_INCLUDE } },
            orderBy: { placedAt: 'desc' },
          })
        : Promise.resolve([]),
    ]);

    return jsonSafeForHttp({
      space,
      parentId,
      folders,
      files: placements.map((placement) => placement.fileAsset).filter(Boolean),
    });
  }

  async createFolder(dto: CreateDriveFolderDto, userId: string) {
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Folder name is required.');
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

  private async assertFolderAccess(folderId: string, space: DriveSpaceEnum, userId: string) {
    const folder = await this.prisma.driveFolder.findUnique({ where: { id: folderId } });
    if (!folder || folder.deletedAt || folder.space !== space) {
      throw new NotFoundException(`Folder ${folderId} not found`);
    }
    if (space === 'PERSONAL' && folder.ownerId !== userId) {
      throw new NotFoundException(`Folder ${folderId} not found`);
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
