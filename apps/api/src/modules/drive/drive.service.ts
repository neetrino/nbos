import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException, Logger, Inject, BadRequestException } from '@nestjs/common';
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
  FileAssetQueryParams,
  FileEntry,
  FolderNode,
} from './drive.types';
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
import { DriveR2Client } from './drive-r2.client';
import { assertFilePreviewableForDocument } from '../documents/documents-assertions';
import type { DocumentsReadAccess } from '../documents/documents-access-read';
import { buildSessionUploadStorageKey } from './drive-upload-path';

const PRESIGNED_URL_EXPIRY_SECONDS = 3600;
const VERSION_UPLOAD_PREFIX = `${R2_DRIVE_PREFIX}uploads/versions`;

@Injectable()
export class DriveService {
  private readonly logger = new Logger(DriveService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly r2: DriveR2Client,
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

  async listFileAssets(params: FileAssetQueryParams) {
    const where = this.buildFileAssetWhere(params);
    return this.prisma.fileAsset.findMany({
      where,
      include: FILE_ASSET_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getFileAsset(id: string) {
    const file = await this.prisma.fileAsset.findUnique({
      where: { id },
      include: FILE_ASSET_INCLUDE,
    });
    if (!file) throw new NotFoundException(`File asset ${id} not found`);
    return file;
  }

  /**
   * Returns a time-limited URL suitable for `<img src>` or download redirects.
   * When `gate` is set, requires the same document read rules as Documents detail and a
   * `DocumentAttachment` or active `DOCUMENT` `FileLink` for the file on that document.
   */
  async getAssetViewUrl(
    assetId: string,
    gate?: { forDocumentId: string; documentsAccess: DocumentsReadAccess },
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
      where: { id: assetId, deletedAt: null, status: 'ACTIVE' },
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

    return file;
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

  async linkFileAsset(id: string, data: CreateFileLinkDto) {
    await this.getFileAsset(id);
    return this.prisma.fileLink.create({
      data: { fileAssetId: id, ...buildLinkCreateInput(data) },
    });
  }

  async createVersionUploadUrl(id: string, data: CreateFileVersionUploadDto) {
    const file = await this.getFileAsset(id);
    if (file.storageProvider !== 'R2') {
      throw new BadRequestException('Only R2-backed files support version uploads.');
    }
    const fileName = requireText(data.fileName, 'fileName');
    const contentType = requireText(data.contentType, 'contentType');
    const uploadId = randomUUID();
    const storageKey = buildSessionUploadStorageKey(uploadId, fileName).replace(
      `${R2_DRIVE_PREFIX}uploads/`,
      `${VERSION_UPLOAD_PREFIX}/${id}/`,
    );
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

  async completeFileVersion(id: string, actorId: string, data: CompleteFileVersionDto) {
    const storageKey = requireText(data.storageKey, 'storageKey');
    if (!storageKey.startsWith(`${VERSION_UPLOAD_PREFIX}/${id}/`)) {
      throw new BadRequestException('storageKey does not belong to this file version upload.');
    }
    await this.getFileAsset(id);
    try {
      await this.r2
        .ensureS3()
        .send(new HeadObjectCommand({ Bucket: this.r2.bucket, Key: storageKey }));
    } catch (err) {
      this.logger.warn(`HeadObject failed for file version ${id}: ${String(err)}`);
      throw new BadRequestException('Uploaded version object was not found in storage.');
    }

    return this.prisma.$transaction(async (tx) => {
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
    });
  }

  async unlinkFileAsset(id: string, linkId: string) {
    await this.getFileAsset(id);
    const link = await this.prisma.fileLink.findFirst({
      where: { id: linkId, fileAssetId: id, unlinkedAt: null },
    });
    if (!link) throw new NotFoundException(`File link ${linkId} not found`);
    return this.prisma.fileLink.update({ where: { id: linkId }, data: { unlinkedAt: new Date() } });
  }

  async archiveFileAsset(id: string, actorId?: string) {
    await this.getFileAsset(id);
    return this.prisma.fileAsset.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
        auditEvents: { create: { action: 'archived', actorId } },
      },
      include: FILE_ASSET_INCLUDE,
    });
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

  private buildFileAssetWhere(params: FileAssetQueryParams): Prisma.FileAssetWhereInput {
    const where: Prisma.FileAssetWhereInput = { deletedAt: null };
    if (params.status) where.status = params.status as FileAssetStatusEnum;
    if (params.purpose) where.purpose = params.purpose as FilePurposeEnum;
    if (params.sourceModule) where.sourceModule = params.sourceModule;
    if (params.entityType && params.entityId) {
      where.links = {
        some: { entityType: params.entityType, entityId: params.entityId, unlinkedAt: null },
      };
    }
    if (params.search) {
      where.OR = [
        { displayName: { contains: params.search, mode: 'insensitive' } },
        { originalName: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    return where;
  }
}
