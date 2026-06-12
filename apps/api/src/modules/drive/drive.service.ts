import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException, Logger, Inject, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ListObjectsV2Command,
  DeleteObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  PrismaClient,
  type FilePurposeEnum,
  type FileAssetStatusEnum,
  type FileStorageProviderEnum,
  type Prisma,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type {
  CreateFileAssetDto,
  CompleteFileVersionDto,
  CreateGeneratedFileAssetDto,
  CreateFileVersionUploadDto,
  CreateFileLinkDto,
  CreateFileAssetGrantDto,
  FileAssetQueryParams,
  FileEntry,
  FolderNode,
} from './drive.types';
import type { DriveEntityAccess } from './drive-access.types';
import {
  buildInitialVersion,
  buildLinkCreateInput,
  pickConfidentiality,
  pickFileType,
  pickPurpose,
  pickVisibility,
  requireText,
} from './drive-metadata';
import {
  buildProjectPrefix,
  insertIntoTree,
  mapS3Folder,
  mapS3Object,
  resolveProjectStorageKey,
  R2_DRIVE_PREFIX,
} from './drive-storage';
import { FILE_ASSET_INCLUDE } from './drive-file-asset-include';
import { normalizeFileGrantPermission, type FileGrantPermission } from './drive-grant-permissions';
import { jsonSafeForHttp } from './drive-json-safe';
import { DriveR2Client } from './drive-r2.client';
import { notifyDriveFileGrantRecipient } from './drive-grant-notify.ops';
import { NotificationService } from '../notifications/notification.service';
import { assertFilePreviewableForDocument } from '../documents/documents-assertions';
import type { DocumentsReadAccess } from '../documents/documents-access-read';
import { readTenantOrganizationId } from './drive-tenant';
import { buildDriveRecoverableTrashWhere } from '../../common/lifecycle/entity-lifecycle-scope';
import { assertStorageKeyInTenantScope } from '../../common/security/storage-key-validation';
import { buildVersionStagingKey, versionStagingPrefix } from './drive-storage-home-path';
import {
  buildDriveAssetAccessWhere,
  buildDriveAssetBaseAccessWhere,
  buildDriveAssetGrantAccessWhere,
  buildSharedWithMeWhereClause,
} from './drive-asset-access.where';
import {
  revokeDriveFileResourceAccessGrant,
  syncDriveFileResourceAccessGrant,
} from './drive-resource-access-grant.sync';
import { DriveProjectHubService } from './drive-project-hub.service';
import { attachManualGrantCount, countDriveFileManualGrants } from './drive-manual-grant-counts';
import { assertDriveEntityContextAccessible } from './drive-entity-context-access';
import type { DriveEntityContextAccess } from './drive-access.types';
import {
  assertDriveFileActionAllowed,
  driveGrantPermissionToActions,
  listDriveFileAllowedActionsForActor,
} from './drive-file-action-guard.op';
import type { DriveFileAction } from './drive-file-action-policy';

const PRESIGNED_URL_EXPIRY_SECONDS = 3600;
const SENSITIVE_GRANT_LOCKED_CONFIDENTIALITIES = new Set<string>([
  'FINANCE_SENSITIVE',
  'LEGAL_SENSITIVE',
  'SECRET_ADJACENT',
]);

@Injectable()
export class DriveService {
  private readonly logger = new Logger(DriveService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly r2: DriveR2Client,
    private readonly notifications: NotificationService,
    private readonly projectHub: DriveProjectHubService,
    private readonly config: ConfigService,
  ) {}

  async listFiles(projectId: string, prefix?: string): Promise<FileEntry[]> {
    const fullPrefix = buildProjectPrefix(projectId, prefix);

    const command = new ListObjectsV2Command({
      Bucket: this.r2.bucket,
      Prefix: fullPrefix,
      Delimiter: '/',
    });

    const response = await this.r2.ensureS3().send(command);
    const files: FileEntry[] = [];

    for (const folder of response.CommonPrefixes ?? []) {
      if (!folder.Prefix) continue;
      files.push(mapS3Folder(folder.Prefix));
    }

    for (const obj of response.Contents ?? []) {
      if (!obj.Key || obj.Key === fullPrefix) continue;
      files.push(mapS3Object(obj));
    }

    return files;
  }

  async getUploadUrl(
    projectId: string,
    fileName: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    const key = `${R2_DRIVE_PREFIX}projects/${projectId}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.r2.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.r2.ensureS3(), command, {
      expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
    });

    return {
      uploadUrl,
      key,
      publicUrl: this.r2.publicUrl ? `${this.r2.publicUrl}/${key}` : '',
    };
  }

  async getDownloadUrl(projectId: string, filePath: string): Promise<{ downloadUrl: string }> {
    const key = resolveProjectStorageKey(projectId, filePath);

    const command = new GetObjectCommand({
      Bucket: this.r2.bucket,
      Key: key,
    });

    const downloadUrl = await getSignedUrl(this.r2.ensureS3(), command, {
      expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
    });

    return { downloadUrl };
  }

  async deleteFile(projectId: string, filePath: string): Promise<void> {
    const key = resolveProjectStorageKey(projectId, filePath);

    const command = new DeleteObjectCommand({
      Bucket: this.r2.bucket,
      Key: key,
    });

    await this.r2.ensureS3().send(command);
    this.logger.log(`Deleted file: ${key}`);
  }

  async listFileAssets(params: FileAssetQueryParams, access?: DriveEntityAccess) {
    const where = await this.buildFileAssetWhere(params, access);
    const orderBy =
      params.trash === true ? { updatedAt: 'desc' as const } : { createdAt: 'desc' as const };
    const rows = await this.prisma.fileAsset.findMany({
      where,
      include: FILE_ASSET_INCLUDE,
      orderBy,
      take: 100,
    });
    const counts = await countDriveFileManualGrants(
      this.prisma,
      rows.map((row) => row.id),
    );
    return jsonSafeForHttp(attachManualGrantCount(rows, counts));
  }

  async getLifecycleCounts(access?: DriveEntityAccess) {
    const accessWhere = await buildDriveAssetAccessWhere(this.prisma, access);
    const [archived, deleted] = await Promise.all([
      this.prisma.fileAsset.count({
        where: { deletedAt: null, status: 'ARCHIVED', ...accessWhere },
      }),
      this.prisma.fileAsset.count({
        where: { status: 'DELETED', deletedAt: { not: null }, ...accessWhere },
      }),
    ]);
    return { trash: archived + deleted };
  }

  async getFileAsset(
    id: string,
    access?: DriveEntityAccess,
    grantPermissions?: readonly FileGrantPermission[],
  ) {
    await this.assertDriveGrantPolicy(id, access, grantPermissions);
    const where = await buildDriveAssetAccessWhere(this.prisma, access);
    const file = await this.prisma.fileAsset.findFirst({
      where: { id, ...where, deletedAt: null },
      include: FILE_ASSET_INCLUDE,
    });
    if (!file) throw new NotFoundException(`File asset ${id} not found`);
    return jsonSafeForHttp(file);
  }

  async listDriveFileAllowedActions(
    fileAssetId: string,
    access?: DriveEntityAccess,
    targetFolderSpace?: 'COMPANY' | 'PERSONAL',
  ) {
    const actions = await listDriveFileAllowedActionsForActor(
      this.prisma,
      fileAssetId,
      access,
      targetFolderSpace ? { targetFolderSpace } : undefined,
    );
    return { actions };
  }

  /**
   * Returns a time-limited URL suitable for `<img src>` or download redirects.
   * Uses the same access rules as `getFileAsset` (any non-deleted status, e.g. ARCHIVED in archive view).
   * When `gate` is set, requires the same document read rules as Documents detail and a
   * `DocumentAttachment` or active `DOCUMENT` `FileLink` for the file on that document.
   */
  async getAssetViewUrl(
    assetId: string,
    gate?: { forDocumentId: string; documentsAccess: DocumentsReadAccess },
    access?: DriveEntityAccess,
  ): Promise<{ url: string; mimeType: string | null }> {
    if (gate?.forDocumentId) {
      await assertFilePreviewableForDocument(
        this.prisma,
        assetId,
        gate.forDocumentId,
        gate.documentsAccess,
      );
    }
    const file = await this.prisma.fileAsset.findFirst({
      where: {
        id: assetId,
        ...(await buildDriveAssetAccessWhere(this.prisma, access)),
        deletedAt: null,
      },
      include: {
        versions: { where: { isCurrent: true }, take: 1, orderBy: { versionNumber: 'desc' } },
      },
    });
    if (!file) throw new NotFoundException(`File asset ${assetId} not found`);
    if (file.storageProvider === 'EXTERNAL_URL' && file.externalUrl) {
      return { url: file.externalUrl, mimeType: file.mimeType };
    }
    const versionKey = file.versions[0]?.storageKey ?? null;
    const key = versionKey ?? file.storageKey;
    if (!key) {
      throw new BadRequestException('File asset has no storage key for preview.');
    }
    const command = new GetObjectCommand({
      Bucket: this.r2.bucket,
      Key: key,
      ResponseContentType: file.mimeType ?? undefined,
    });
    const url = await getSignedUrl(this.r2.ensureS3(), command, {
      expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
    });
    return { url, mimeType: file.mimeType };
  }

  async createFileAsset(data: CreateFileAssetDto) {
    const fileType = pickFileType(data.fileType, data.displayName, data.mimeType, data.externalUrl);
    const provider = data.externalUrl ? 'EXTERNAL_URL' : 'R2';
    if (provider === 'R2' && !data.storageKey) {
      throw new BadRequestException('storageKey is required for R2 file assets.');
    }
    if (provider === 'R2' && data.storageKey) {
      assertStorageKeyInTenantScope(data.storageKey, readTenantOrganizationId(this.config));
    }
    if (provider === 'EXTERNAL_URL' && !data.externalUrl) {
      throw new BadRequestException('externalUrl is required for external file assets.');
    }

    const file = await this.prisma.fileAsset.create({
      data: {
        displayName: requireText(data.displayName, 'displayName'),
        originalName: data.originalName,
        fileType,
        purpose: pickPurpose(data.purpose),
        sourceModule: data.sourceModule,
        ownerId: data.ownerId,
        createdById: data.createdById,
        visibility: pickVisibility(data.visibility),
        confidentiality: pickConfidentiality(data.confidentiality),
        storageProvider: provider as FileStorageProviderEnum,
        storageKey: data.storageKey,
        externalUrl: data.externalUrl,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        checksum: data.checksum,
        versions: provider === 'R2' ? { create: buildInitialVersion(data) } : undefined,
        links: data.link ? { create: buildLinkCreateInput(data.link) } : undefined,
        auditEvents: { create: { action: 'created', actorId: data.createdById } },
      },
      include: FILE_ASSET_INCLUDE,
    });

    return jsonSafeForHttp(file);
  }

  async createGeneratedFileAsset(data: CreateGeneratedFileAssetDto) {
    const body =
      typeof data.content === 'string' ? Buffer.from(data.content, 'utf8') : data.content;
    await this.r2.ensureS3().send(
      new PutObjectCommand({
        Bucket: this.r2.bucket,
        Key: data.storageKey,
        Body: body,
        ContentType: data.contentType,
      }),
    );
    return this.createFileAsset({
      displayName: data.displayName,
      originalName: data.originalName,
      fileType: data.fileType,
      purpose: data.purpose,
      sourceModule: data.sourceModule,
      ownerId: data.ownerId,
      createdById: data.createdById,
      visibility: data.visibility,
      confidentiality: data.confidentiality,
      storageKey: data.storageKey,
      mimeType: data.mimeType ?? data.contentType,
      checksum: data.checksum,
      link: data.link,
      sizeBytes: body.byteLength,
    });
  }

  async linkFileAsset(id: string, data: CreateFileLinkDto, access?: DriveEntityContextAccess) {
    await assertDriveFileActionAllowed(this.prisma, id, access, 'LINK');
    await this.getFileAsset(id, access);
    await this.assertTargetEntityLinkAllowed(data, access);
    return this.prisma.fileLink.create({
      data: { fileAssetId: id, ...buildLinkCreateInput(data) },
    });
  }

  async createVersionUploadUrl(
    id: string,
    data: CreateFileVersionUploadDto,
    access?: DriveEntityAccess,
  ) {
    const file = await this.getFileAsset(id, access, ['UPLOAD_VERSION']);
    if (file.storageProvider !== 'R2') {
      throw new BadRequestException('Only R2-backed files support version uploads.');
    }
    const fileName = requireText(data.fileName, 'fileName');
    const contentType = requireText(data.contentType, 'contentType');
    const orgId = readTenantOrganizationId(this.config);
    const uploadId = randomUUID();
    const storageKey = buildVersionStagingKey(orgId, id, uploadId, fileName);
    const command = new PutObjectCommand({
      Bucket: this.r2.bucket,
      Key: storageKey,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(this.r2.ensureS3(), command, {
      expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
    });
    return { uploadUrl, storageKey, expiresInSeconds: PRESIGNED_URL_EXPIRY_SECONDS };
  }

  async completeFileVersion(
    id: string,
    actorId: string,
    data: CompleteFileVersionDto,
    access?: DriveEntityAccess,
  ) {
    const storageKey = requireText(data.storageKey, 'storageKey');
    assertStorageKeyInTenantScope(storageKey, readTenantOrganizationId(this.config), id);
    const stagingPrefix = versionStagingPrefix(readTenantOrganizationId(this.config), id);
    if (!storageKey.startsWith(stagingPrefix)) {
      throw new BadRequestException('storageKey does not belong to this file version upload.');
    }
    await this.getFileAsset(id, access, ['UPLOAD_VERSION']);
    try {
      await this.r2
        .ensureS3()
        .send(new HeadObjectCommand({ Bucket: this.r2.bucket, Key: storageKey }));
    } catch (err) {
      this.logger.warn(`HeadObject failed for file version ${id}: ${String(err)}`);
      throw new BadRequestException('Uploaded version object was not found in storage.');
    }

    return jsonSafeForHttp(
      await this.prisma.$transaction(async (tx) => {
        const latest = await tx.fileVersion.findFirst({
          where: { fileAssetId: id },
          orderBy: { versionNumber: 'desc' },
        });
        const versionNumber = (latest?.versionNumber ?? 0) + 1;
        await tx.fileVersion.updateMany({ where: { fileAssetId: id }, data: { isCurrent: false } });
        const version = await tx.fileVersion.create({
          data: {
            fileAssetId: id,
            versionNumber,
            storageKey,
            uploadedById: actorId,
            sizeBytes: data.sizeBytes,
            checksum: data.checksum,
            changeNote: data.changeNote?.trim() || null,
            isCurrent: true,
          },
        });
        return tx.fileAsset.update({
          where: { id },
          data: {
            storageKey,
            sizeBytes: data.sizeBytes,
            checksum: data.checksum,
            currentVersionId: version.id,
            auditEvents: { create: { action: 'version_uploaded', actorId } },
          },
          include: FILE_ASSET_INCLUDE,
        });
      }),
    );
  }

  async unlinkFileAsset(id: string, linkId: string, access?: DriveEntityAccess) {
    await assertDriveFileActionAllowed(this.prisma, id, access, 'UNLINK');
    await this.getFileAsset(id, access);
    const link = await this.prisma.fileLink.findFirst({
      where: { id: linkId, fileAssetId: id, unlinkedAt: null },
    });
    if (!link) throw new NotFoundException(`File link ${linkId} not found`);
    return this.prisma.fileLink.update({ where: { id: linkId }, data: { unlinkedAt: new Date() } });
  }

  async archiveFileAsset(id: string, actorId?: string, access?: DriveEntityAccess) {
    await this.getFileAsset(id, access, ['DELETE']);
    return jsonSafeForHttp(
      await this.prisma.fileAsset.update({
        where: { id },
        data: {
          status: 'ARCHIVED',
          archivedAt: new Date(),
          auditEvents: { create: { action: 'archived', actorId } },
        },
        include: FILE_ASSET_INCLUDE,
      }),
    );
  }

  async restoreFileAsset(id: string, actorId?: string, access?: DriveEntityAccess) {
    await this.getFileAsset(id, access, ['DELETE']);
    return jsonSafeForHttp(
      await this.prisma.fileAsset.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          archivedAt: null,
          auditEvents: { create: { action: 'restored', actorId } },
        },
        include: FILE_ASSET_INCLUDE,
      }),
    );
  }

  async archiveFileAssets(ids: string[], actorId?: string, access?: DriveEntityAccess) {
    const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
    if (uniqueIds.length === 0) {
      throw new BadRequestException('ids must include at least one file id.');
    }
    const now = new Date();
    const accessWhere = await this.buildActionAccessWhere(access, ['DELETE']);
    const updated = await this.prisma.$transaction(async (tx) => {
      const matched = await tx.fileAsset.findMany({
        where: { id: { in: uniqueIds }, deletedAt: null, ...accessWhere },
        select: { id: true },
      });
      const matchedIds = matched.map((row) => row.id);
      if (matchedIds.length === 0) return [];
      await tx.fileAsset.updateMany({
        where: { id: { in: matchedIds }, deletedAt: null, ...accessWhere },
        data: { status: 'ARCHIVED', archivedAt: now },
      });
      await tx.fileAuditEvent.createMany({
        data: matchedIds.map((fileAssetId) => ({
          fileAssetId,
          actorId: actorId ?? null,
          action: 'archived',
        })),
      });
      return tx.fileAsset.findMany({
        where: { id: { in: matchedIds }, deletedAt: null, ...accessWhere },
        include: FILE_ASSET_INCLUDE,
        orderBy: { createdAt: 'desc' },
      });
    });
    return { updated: jsonSafeForHttp(updated) };
  }

  async restoreFileAssets(ids: string[], actorId?: string, access?: DriveEntityAccess) {
    const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
    if (uniqueIds.length === 0) {
      throw new BadRequestException('ids must include at least one file id.');
    }
    const accessWhere = await this.buildActionAccessWhere(access, ['DELETE']);
    const updated = await this.prisma.$transaction(async (tx) => {
      const matched = await tx.fileAsset.findMany({
        where: { id: { in: uniqueIds }, deletedAt: null, ...accessWhere },
        select: { id: true },
      });
      const matchedIds = matched.map((row) => row.id);
      if (matchedIds.length === 0) return [];
      await tx.fileAsset.updateMany({
        where: { id: { in: matchedIds }, deletedAt: null, ...accessWhere },
        data: { status: 'ACTIVE', archivedAt: null },
      });
      await tx.fileAuditEvent.createMany({
        data: matchedIds.map((fileAssetId) => ({
          fileAssetId,
          actorId: actorId ?? null,
          action: 'restored',
        })),
      });
      return tx.fileAsset.findMany({
        where: { id: { in: matchedIds }, deletedAt: null, ...accessWhere },
        include: FILE_ASSET_INCLUDE,
        orderBy: { createdAt: 'desc' },
      });
    });
    return { updated: jsonSafeForHttp(updated) };
  }

  async restoreTrashFileAsset(id: string, actorId?: string, access?: DriveEntityAccess) {
    const file = await this.findRecoverableTrashFileAsset(id, access, ['DELETE']);
    return jsonSafeForHttp(
      await this.prisma.fileAsset.update({
        where: { id: file.id },
        data: {
          status: 'ACTIVE',
          archivedAt: null,
          deletedAt: null,
          auditEvents: { create: { action: 'restored_from_trash', actorId } },
        },
        include: FILE_ASSET_INCLUDE,
      }),
    );
  }

  async restoreTrashFileAssets(ids: string[], actorId?: string, access?: DriveEntityAccess) {
    const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
    if (uniqueIds.length === 0) {
      throw new BadRequestException('ids must include at least one file id.');
    }
    const accessWhere = await this.buildActionAccessWhere(access, ['DELETE']);
    const recoverableTrashWhere = this.buildRecoverableTrashAccessWhere(accessWhere);
    const updated = await this.prisma.$transaction(async (tx) => {
      const matched = await tx.fileAsset.findMany({
        where: {
          id: { in: uniqueIds },
          ...recoverableTrashWhere,
        },
        select: { id: true },
      });
      const matchedIds = matched.map((row) => row.id);
      if (matchedIds.length === 0) return [];
      await tx.fileAsset.updateMany({
        where: {
          id: { in: matchedIds },
          ...recoverableTrashWhere,
        },
        data: { status: 'ACTIVE', archivedAt: null, deletedAt: null },
      });
      await tx.fileAuditEvent.createMany({
        data: matchedIds.map((fileAssetId) => ({
          fileAssetId,
          actorId: actorId ?? null,
          action: 'restored_from_trash',
        })),
      });
      return tx.fileAsset.findMany({
        where: { id: { in: matchedIds }, deletedAt: null, ...accessWhere },
        include: FILE_ASSET_INCLUDE,
        orderBy: { createdAt: 'desc' },
      });
    });
    return { updated: jsonSafeForHttp(updated) };
  }

  async moveFileAssetsToTrash(ids: string[], actorId: string, access?: DriveEntityAccess) {
    const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
    if (uniqueIds.length === 0) {
      throw new BadRequestException('ids must include at least one file id.');
    }
    const moved = [];
    for (const id of uniqueIds) {
      moved.push(await this.moveFileAssetToTrash(id, actorId, access));
    }
    return { updated: jsonSafeForHttp(moved) };
  }

  async listFileAssetGrants(fileAssetId: string, access?: DriveEntityAccess) {
    await this.getFileAsset(fileAssetId, access);
    const rows = await this.prisma.fileAssetGrant.findMany({
      where: { fileAssetId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (rows.length === 0) return [];
    const empIds = [...new Set(rows.map((r) => r.granteeEmployeeId))];
    const employees = await this.prisma.employee.findMany({
      where: { id: { in: empIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const employeeById = new Map(employees.map((e) => [e.id, e]));
    return rows.map((r) => {
      const employee = employeeById.get(r.granteeEmployeeId);
      return {
        ...jsonSafeForHttp(r),
        granteeLabel: employee
          ? `${employee.firstName} ${employee.lastName}`.trim()
          : r.granteeEmployeeId,
        granteeEmail: employee?.email ?? null,
      };
    });
  }

  async revokeFileAssetGrant(
    fileAssetId: string,
    grantId: string,
    actorId: string,
    access?: DriveEntityAccess,
  ) {
    await this.getFileAsset(fileAssetId, access, ['SHARE']);
    const grant = await this.prisma.fileAssetGrant.findFirst({
      where: { id: grantId, fileAssetId, revokedAt: null },
    });
    if (!grant) throw new NotFoundException('Grant not found or already revoked.');
    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.fileAssetGrant.update({
        where: { id: grantId },
        data: { revokedAt: new Date() },
      });
      await revokeDriveFileResourceAccessGrant(tx, fileAssetId, row.granteeEmployeeId);
      await tx.fileAuditEvent.create({
        data: {
          fileAssetId,
          actorId,
          action: 'grant_revoked',
          metadata: { granteeEmployeeId: row.granteeEmployeeId, grantId: row.id },
        },
      });
      return row;
    });
    return jsonSafeForHttp(updated);
  }

  async createFileAssetGrant(
    fileAssetId: string,
    body: CreateFileAssetGrantDto,
    actorId: string,
    access?: DriveEntityAccess,
  ) {
    const grantee = body.granteeEmployeeId.trim();
    requireText(grantee, 'granteeEmployeeId');
    const permission = normalizeFileGrantPermission(body.permission);
    const expiresAt = this.parseOptionalGrantExpiry(body.expiresAt);
    const reason = body.reason?.trim() || null;
    if (grantee === actorId) {
      throw new BadRequestException('You cannot grant Drive access to yourself.');
    }
    const file = await this.getFileAsset(fileAssetId, access, ['SHARE']);
    this.assertGrantCompatibleWithConfidentiality(file, permission);
    const existing = await this.prisma.fileAssetGrant.findFirst({
      where: { fileAssetId, granteeEmployeeId: grantee, revokedAt: null },
    });
    if (existing) {
      if (existing.permission === permission) {
        return jsonSafeForHttp(existing);
      }
      const row = await this.prisma.$transaction(async (tx) => {
        const updatedGrant = await tx.fileAssetGrant.update({
          where: { id: existing.id },
          data: { permission, expiresAt },
        });
        await syncDriveFileResourceAccessGrant(tx, {
          fileAssetId,
          employeeId: grantee,
          permission,
          grantedById: actorId,
          expiresAt,
          auditReason: reason,
        });
        await tx.fileAuditEvent.create({
          data: {
            fileAssetId,
            actorId,
            action: 'grant_updated',
            metadata: { granteeEmployeeId: grantee, permission, expiresAt, reason },
          },
        });
        return updatedGrant;
      });
      await notifyDriveFileGrantRecipient({
        prisma: this.prisma,
        notifications: this.notifications,
        logger: this.logger,
        kind: 'updated',
        fileAssetId,
        grantId: row.id,
        granteeEmployeeId: grantee,
        actorId,
        permission,
      });
      return jsonSafeForHttp(row);
    }
    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.fileAssetGrant.create({
        data: {
          fileAssetId,
          granteeEmployeeId: grantee,
          grantedById: actorId,
          permission,
          expiresAt,
        },
      });
      await syncDriveFileResourceAccessGrant(tx, {
        fileAssetId,
        employeeId: grantee,
        permission,
        grantedById: actorId,
        expiresAt,
        auditReason: reason,
      });
      await tx.fileAuditEvent.create({
        data: {
          fileAssetId,
          actorId,
          action: 'grant_created',
          metadata: { granteeEmployeeId: grantee, permission, expiresAt, reason },
        },
      });
      return created;
    });
    await notifyDriveFileGrantRecipient({
      prisma: this.prisma,
      notifications: this.notifications,
      logger: this.logger,
      kind: 'created',
      fileAssetId,
      grantId: row.id,
      granteeEmployeeId: grantee,
      actorId,
      permission,
    });
    return jsonSafeForHttp(row);
  }

  async getLibraryContextSummary(
    entityType: string | undefined,
    entityId: string | undefined,
    access?: DriveEntityContextAccess,
  ) {
    const et = requireText(entityType, 'entityType');
    const eid = requireText(entityId, 'entityId');
    if (access?.employeeId) {
      await assertDriveEntityContextAccessible(this.prisma, et, eid, access);
    }
    const where = await this.buildFileAssetWhere({ entityType: et, entityId: eid }, access);
    const rows = await this.prisma.fileAsset.groupBy({
      by: ['purpose'],
      where,
      _count: { id: true },
    });
    return rows.map((r) => ({
      purpose: r.purpose ?? 'UNKNOWN',
      count: r._count.id,
    }));
  }

  async getLibraryRelatedLinkAggregates(
    entityType: string | undefined,
    entityId: string | undefined,
    access?: DriveEntityContextAccess,
  ) {
    const et = requireText(entityType, 'entityType');
    const eid = requireText(entityId, 'entityId');
    if (access?.employeeId) {
      await assertDriveEntityContextAccessible(this.prisma, et, eid, access);
    }
    const fileWhere = await this.buildFileAssetWhere({ entityType: et, entityId: eid }, access);
    const rows = await this.prisma.fileLink.groupBy({
      by: ['entityType', 'entityId'],
      where: {
        unlinkedAt: null,
        NOT: { AND: [{ entityType: et }, { entityId: eid }] },
        fileAsset: fileWhere,
      },
      _count: { id: true },
    });
    return rows.map((r) => ({
      entityType: r.entityType,
      entityId: r.entityId,
      count: r._count.id,
    }));
  }

  async getDriveCleanupSummary() {
    const now = new Date();
    const [failedUploadSessions, expiredPendingUploadSessions] = await Promise.all([
      this.prisma.fileUploadSession.count({ where: { status: 'FAILED' } }),
      this.prisma.fileUploadSession.count({
        where: { status: 'PENDING', expiresAt: { lt: now } },
      }),
    ]);
    return { failedUploadSessions, expiredPendingUploadSessions };
  }

  async purgeDriveUploadSessions(kindParam: string) {
    const kind = kindParam.trim().toLowerCase().replace(/-/g, '_');
    if (kind !== 'expired_pending' && kind !== 'failed') {
      throw new BadRequestException('kind must be expired_pending (or expired-pending) or failed.');
    }
    const now = new Date();
    if (kind === 'failed') {
      const r = await this.prisma.fileUploadSession.deleteMany({ where: { status: 'FAILED' } });
      return { deleted: r.count, kind };
    }
    const r = await this.prisma.fileUploadSession.deleteMany({
      where: { status: 'PENDING', expiresAt: { lt: now } },
    });
    return { deleted: r.count, kind };
  }

  async moveFileAssetToTrash(id: string, actorId: string, access?: DriveEntityAccess) {
    await assertDriveFileActionAllowed(this.prisma, id, access, 'TRASH');
    const where = await buildDriveAssetAccessWhere(this.prisma, access);
    const file = await this.prisma.fileAsset.findFirst({
      where: { id, ...where, status: { not: 'DELETED' } },
      include: FILE_ASSET_INCLUDE,
    });
    if (!file) throw new NotFoundException(`File asset ${id} not found`);
    return jsonSafeForHttp(
      await this.prisma.$transaction(async (tx) => {
        await tx.fileAuditEvent.create({
          data: {
            fileAssetId: id,
            actorId,
            action: 'moved_to_trash',
            metadata: {},
          },
        });
        return tx.fileAsset.update({
          where: { id },
          data: { status: 'DELETED', deletedAt: new Date(), archivedAt: null },
          include: FILE_ASSET_INCLUDE,
        });
      }),
    );
  }

  /** Transitional alias — prefer `moveFileAssetToTrash`. */
  async permanentlyDeleteFileAsset(id: string, actorId: string, access?: DriveEntityAccess) {
    return this.moveFileAssetToTrash(id, actorId, access);
  }

  async getProjectStructure(projectId: string): Promise<FolderNode> {
    const prefix = `${R2_DRIVE_PREFIX}projects/${projectId}/`;

    const command = new ListObjectsV2Command({
      Bucket: this.r2.bucket,
      Prefix: prefix,
    });

    const response = await this.r2.ensureS3().send(command);
    const root: FolderNode = { name: projectId, path: prefix, children: [], files: [] };

    for (const obj of response.Contents ?? []) {
      if (!obj.Key) continue;
      const relativePath = obj.Key.slice(prefix.length);
      insertIntoTree(root, relativePath, obj);
    }

    return root;
  }

  /**
   * Reads the current R2 object for a file the viewer can access (for server-side packaging, e.g. ZIP export).
   * Returns null when the asset is not stored in R2.
   */
  async fetchR2CurrentObjectBuffer(
    fileId: string,
    access?: DriveEntityAccess,
    grantPermissions?: readonly FileGrantPermission[],
  ): Promise<{ displayName: string; mimeType: string | null; buffer: Buffer } | null> {
    await this.assertDriveGrantPolicy(fileId, access, grantPermissions);
    const accessWhere = await buildDriveAssetAccessWhere(this.prisma, access);
    const file = await this.prisma.fileAsset.findFirst({
      where: {
        id: fileId,
        deletedAt: null,
        ...accessWhere,
      },
      include: {
        versions: {
          where: { isCurrent: true },
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });
    if (!file || file.storageProvider !== 'R2') return null;
    const key = file.versions[0]?.storageKey ?? file.storageKey;
    if (!key) return null;
    const response = await this.r2
      .ensureS3()
      .send(new GetObjectCommand({ Bucket: this.r2.bucket, Key: key }));
    const stream = response.Body;
    if (!stream) {
      throw new BadRequestException('R2 object body missing.');
    }
    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
      chunks.push(Buffer.from(chunk));
    }
    return {
      displayName: file.displayName,
      mimeType: file.mimeType,
      buffer: Buffer.concat(chunks),
    };
  }

  private buildRecoverableTrashAccessWhere(
    accessWhere: Prisma.FileAssetWhereInput,
  ): Prisma.FileAssetWhereInput {
    return {
      AND: [buildDriveRecoverableTrashWhere(), accessWhere],
    };
  }

  private async findRecoverableTrashFileAsset(
    id: string,
    access?: DriveEntityAccess,
    grantPermissions?: readonly FileGrantPermission[],
  ) {
    await this.assertDriveGrantPolicy(id, access, grantPermissions);
    const accessWhere = await buildDriveAssetAccessWhere(this.prisma, access);
    const file = await this.prisma.fileAsset.findFirst({
      where: {
        id,
        ...this.buildRecoverableTrashAccessWhere(accessWhere),
      },
    });
    if (!file) throw new NotFoundException(`File asset ${id} not found in Trash`);
    return file;
  }

  private async buildFileAssetWhere(
    params: FileAssetQueryParams,
    access?: DriveEntityAccess,
  ): Promise<Prisma.FileAssetWhereInput> {
    const accessWhere = await buildDriveAssetAccessWhere(this.prisma, access);
    if (params.trash === true) {
      const clauses: Prisma.FileAssetWhereInput[] = [
        this.buildRecoverableTrashAccessWhere(accessWhere),
      ];
      if (params.search) {
        clauses.push({
          OR: [
            { displayName: { contains: params.search, mode: 'insensitive' } },
            { originalName: { contains: params.search, mode: 'insensitive' } },
          ],
        });
      }
      return clauses.length === 1 ? clauses[0]! : { AND: clauses };
    }

    const clauses: Prisma.FileAssetWhereInput[] = [{ deletedAt: null, ...accessWhere }];
    if (params.status) clauses.push({ status: params.status as FileAssetStatusEnum });
    if (params.purpose) clauses.push({ purpose: params.purpose as FilePurposeEnum });
    if (params.sourceModule) clauses.push({ sourceModule: params.sourceModule });
    if (params.projectHubProjectFiles && !params.projectId) {
      throw new BadRequestException('projectId is required for Project files.');
    }
    if (params.projectHubProjectFiles && params.projectId) {
      clauses.push(await this.projectHub.buildProjectLevelWhere(params.projectId));
    } else if (params.entityType && params.entityId) {
      clauses.push({
        links: {
          some: { entityType: params.entityType, entityId: params.entityId, unlinkedAt: null },
        },
      });
    }
    if (params.sharedWithMe === true) {
      const employeeId = access?.employeeId?.trim();
      if (!employeeId) {
        throw new BadRequestException('sharedWithMe requires an authenticated employee context.');
      }
      clauses.push(await buildSharedWithMeWhereClause(this.prisma, employeeId));
    }
    if (params.search) {
      clauses.push({
        OR: [
          { displayName: { contains: params.search, mode: 'insensitive' } },
          { originalName: { contains: params.search, mode: 'insensitive' } },
        ],
      });
    }
    return clauses.length === 1 ? clauses[0]! : { AND: clauses };
  }

  private async assertDriveGrantPolicy(
    fileAssetId: string,
    access: DriveEntityAccess | undefined,
    grantPermissions?: readonly FileGrantPermission[],
  ) {
    if (!access?.employeeId || !grantPermissions?.length) return;
    const actions = new Set<DriveFileAction>();
    for (const permission of grantPermissions) {
      for (const action of driveGrantPermissionToActions(permission)) {
        actions.add(action);
      }
    }
    for (const action of actions) {
      await assertDriveFileActionAllowed(this.prisma, fileAssetId, access, action);
    }
  }

  private async buildActionAccessWhere(
    access: DriveEntityAccess | undefined,
    grantPermissions: readonly FileGrantPermission[],
  ): Promise<Prisma.FileAssetWhereInput> {
    if (!access?.employeeId) return {};
    const baseWhere = await buildDriveAssetBaseAccessWhere(this.prisma, access);
    return {
      OR: [
        baseWhere,
        await buildDriveAssetGrantAccessWhere(this.prisma, access.employeeId, grantPermissions),
      ],
    };
  }

  private assertGrantCompatibleWithConfidentiality(
    file: { confidentiality?: string | null },
    permission: FileGrantPermission,
  ) {
    if (
      file.confidentiality &&
      SENSITIVE_GRANT_LOCKED_CONFIDENTIALITIES.has(file.confidentiality) &&
      permission !== 'VIEW'
    ) {
      throw new BadRequestException('Sensitive Drive files may only be shared with VIEW grants.');
    }
  }

  private parseOptionalGrantExpiry(value: string | undefined) {
    if (!value?.trim()) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('expiresAt must be a valid ISO datetime.');
    }
    return parsed;
  }

  private async assertTargetEntityLinkAllowed(
    data: CreateFileLinkDto,
    access?: DriveEntityContextAccess,
  ) {
    if (!access?.employeeId) return;
    await assertDriveEntityContextAccessible(this.prisma, data.entityType, data.entityId, access);
  }
}
