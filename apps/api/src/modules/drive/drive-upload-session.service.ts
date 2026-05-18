import { randomUUID } from 'node:crypto';
import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type { CompleteUploadSessionDto, CreateUploadSessionDto } from './drive.types';
import {
  pickConfidentiality,
  pickLinkType,
  pickPurpose,
  pickVisibility,
  requireText,
} from './drive-metadata';
import { resolveDriveLibraryEntityType } from './drive-library';
import {
  UPLOAD_SESSION_PRESIGN_EXPIRY_SECONDS,
  UPLOAD_SESSION_TTL_MS,
} from './drive-upload.constants';
import { buildFileAssetCreateInputForCompletedSession } from './drive-upload-complete';
import { readTenantOrganizationId } from './drive-tenant';
import { resolveStorageHomeContextWithPurpose } from './drive-storage-home-resolver';
import { buildStorageHomeKeyFromParams } from './drive-storage-home-path';
import { FILE_ASSET_INCLUDE } from './drive-file-asset-include';
import { jsonSafeForHttp } from './drive-json-safe';
import { DriveR2Client } from './drive-r2.client';
import { DriveFolderService } from './drive-folder.service';
import type { DocumentsReadAccess } from '../documents/documents-access-read';
import type { DriveEntityAccess, DriveEntityContextAccess } from './drive-access.types';
import { assertDriveEntityContextAccessible } from './drive-entity-context-access';
import { buildDriveAssetAccessWhere } from './drive-asset-access.where';

@Injectable()
export class DriveUploadSessionService {
  private readonly logger = new Logger(DriveUploadSessionService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly r2: DriveR2Client,
    private readonly folders: DriveFolderService,
    private readonly config: ConfigService,
  ) {}

  async listDriveLibrary(
    contextType: string | undefined,
    contextId: string | undefined,
    access?: DriveEntityAccess,
    documentsAccess?: DocumentsReadAccess,
  ) {
    const entityType = resolveDriveLibraryEntityType(contextType);
    const entityId = requireText(contextId, 'contextId');
    return this.listFileAssetsByEntity(entityType, entityId, {
      ...(access ?? { employeeId: '', departmentIds: [] }),
      ...(documentsAccess ? { documentsAccess } : {}),
    });
  }

  async createUploadSession(
    dto: CreateUploadSessionDto,
    userId: string,
    access?: DriveEntityAccess,
    documentsAccess?: DocumentsReadAccess,
  ) {
    const fileName = requireText(dto.fileName, 'fileName');
    const contentType = requireText(dto.contentType, 'contentType');
    if (dto.folderId) {
      await this.folders.assertCanUseFolder(dto.folderId, userId);
    }
    if (!dto.folderId) {
      requireText(dto.entityType, 'entityType');
      requireText(dto.entityId, 'entityId');
    }

    const sessionId = randomUUID();
    const fileAssetId = randomUUID();
    const entityType = dto.entityType?.trim() ?? 'DRIVE_FOLDER';
    const entityId = dto.entityId?.trim() ?? dto.folderId ?? sessionId;
    if (!dto.folderId && access) {
      await assertDriveEntityContextAccessible(
        this.prisma,
        entityType,
        entityId,
        documentsAccess ? { ...access, documentsAccess } : access,
      );
    }
    const purpose = pickPurpose(dto.purpose);
    const displayName = (dto.displayName?.trim() || fileName).slice(0, 500);
    const orgId = readTenantOrganizationId(this.config);
    const contextPath = await resolveStorageHomeContextWithPurpose(
      this.prisma,
      entityType,
      entityId,
      purpose,
    );
    const storageKey = buildStorageHomeKeyFromParams(orgId, contextPath, {
      displayName,
      fileAssetId,
      purpose,
    });
    const expiresAt = new Date(Date.now() + UPLOAD_SESSION_TTL_MS);

    const session = await this.prisma.fileUploadSession.create({
      data: {
        id: sessionId,
        fileAssetId,
        storageKey,
        entityType,
        entityId,
        folderId: dto.folderId?.trim(),
        displayName,
        originalName: fileName,
        mimeType: contentType,
        purpose: pickPurpose(dto.purpose),
        sourceModule: dto.sourceModule?.trim(),
        visibility: pickVisibility(dto.visibility),
        confidentiality: pickConfidentiality(dto.confidentiality),
        linkType: pickLinkType(dto.linkType),
        createdById: userId,
        expiresAt,
      },
    });

    const command = new PutObjectCommand({
      Bucket: this.r2.bucket,
      Key: storageKey,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(this.r2.ensureS3(), command, {
      expiresIn: UPLOAD_SESSION_PRESIGN_EXPIRY_SECONDS,
    });

    return {
      sessionId: session.id,
      uploadUrl,
      storageKey: session.storageKey,
      expiresAt: session.expiresAt.toISOString(),
      publicUrl: this.r2.publicUrl ? `${this.r2.publicUrl}/${session.storageKey}` : '',
    };
  }

  async completeUploadSession(
    sessionId: string,
    userId: string,
    dto: CompleteUploadSessionDto,
    access?: DriveEntityAccess,
    documentsAccess?: DocumentsReadAccess,
  ) {
    const session = await this.prisma.fileUploadSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException(`Upload session ${sessionId} not found`);
    if (session.createdById !== userId) {
      throw new ForbiddenException('This upload session belongs to another user.');
    }
    if (session.status !== 'PENDING') {
      throw new BadRequestException(`Upload session is ${session.status}, expected PENDING.`);
    }
    if (session.expiresAt < new Date()) {
      await this.prisma.fileUploadSession.update({
        where: { id: sessionId },
        data: { status: 'EXPIRED', failedReason: 'session_expired' },
      });
      throw new BadRequestException('Upload session has expired.');
    }

    if (!session.folderId && access) {
      await assertDriveEntityContextAccessible(
        this.prisma,
        session.entityType,
        session.entityId,
        documentsAccess ? { ...access, documentsAccess } : access,
      );
    }

    try {
      await this.r2
        .ensureS3()
        .send(new HeadObjectCommand({ Bucket: this.r2.bucket, Key: session.storageKey }));
    } catch (err) {
      this.logger.warn(`HeadObject failed for upload session ${sessionId}: ${String(err)}`);
      await this.prisma.fileUploadSession.update({
        where: { id: sessionId },
        data: { status: 'FAILED', failedReason: 'storage_object_missing' },
      });
      throw new BadRequestException(
        'File was not found in storage. Upload to the presigned URL before completing.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const fresh = await tx.fileUploadSession.findUnique({ where: { id: sessionId } });
      if (!fresh || fresh.status !== 'PENDING') {
        throw new BadRequestException('Upload session is no longer pending.');
      }
      const createInput = buildFileAssetCreateInputForCompletedSession(fresh, userId, dto);
      const file = await tx.fileAsset.create({
        data: createInput,
        include: FILE_ASSET_INCLUDE,
      });
      await tx.fileUploadSession.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED', fileAssetId: file.id },
      });
      if (fresh.folderId) {
        await tx.driveFolderItem.create({
          data: {
            folderId: fresh.folderId,
            itemType: 'FILE',
            fileAssetId: file.id,
            placedById: userId,
          },
        });
      }
      return jsonSafeForHttp(file);
    });
  }

  async failUploadSession(sessionId: string, userId: string, reason?: string) {
    const session = await this.prisma.fileUploadSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException(`Upload session ${sessionId} not found`);
    if (session.createdById !== userId) {
      throw new ForbiddenException('This upload session belongs to another user.');
    }
    if (session.status !== 'PENDING') {
      throw new BadRequestException(`Upload session is ${session.status}, expected PENDING.`);
    }
    return this.prisma.fileUploadSession.update({
      where: { id: sessionId },
      data: {
        status: 'FAILED',
        failedReason: reason?.trim().slice(0, 500) || 'client_aborted',
      },
    });
  }

  private async listFileAssetsByEntity(
    entityType: string,
    entityId: string,
    access?: DriveEntityContextAccess,
  ) {
    const where: Prisma.FileAssetWhereInput = {
      deletedAt: null,
      links: { some: { entityType, entityId, unlinkedAt: null } },
      ...(access?.employeeId ? await buildDriveAssetAccessWhere(this.prisma, access) : {}),
    };
    return jsonSafeForHttp(
      await this.prisma.fileAsset.findMany({
        where,
        include: FILE_ASSET_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    );
  }
}
