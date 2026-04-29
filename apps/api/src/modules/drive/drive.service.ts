import { Injectable, NotFoundException, Logger, Inject, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
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

const PRESIGNED_URL_EXPIRY_SECONDS = 3600;
const FILE_ASSET_INCLUDE = {
  versions: { orderBy: { versionNumber: 'desc' as const } },
  links: { where: { unlinkedAt: null }, orderBy: { linkedAt: 'desc' as const } },
} satisfies Prisma.FileAssetInclude;

@Injectable()
export class DriveService {
  private readonly s3: S3Client | null;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly logger = new Logger(DriveService.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
  ) {
    const accountId = this.config.get<string>('R2_ACCOUNT_ID');
    this.bucket = this.config.get<string>('R2_BUCKET_NAME') ?? '';
    this.publicUrl = this.config.get<string>('R2_PUBLIC_URL') ?? '';

    if (!accountId) {
      this.logger.warn('R2 not configured — Drive module will return empty results');
      this.s3 = null;
      return;
    }

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.get<string>('R2_ACCESS_KEY_ID') ?? '',
        secretAccessKey: this.config.get<string>('R2_SECRET_ACCESS_KEY') ?? '',
      },
    });
  }

  private ensureS3(): S3Client {
    if (!this.s3) throw new NotFoundException('Drive (R2) is not configured');
    return this.s3;
  }

  async listFiles(projectId: string, prefix?: string): Promise<FileEntry[]> {
    const fullPrefix = buildProjectPrefix(projectId, prefix);

    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: fullPrefix,
      Delimiter: '/',
    });

    const response = await this.ensureS3().send(command);
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
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.ensureS3(), command, {
      expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
    });

    return {
      uploadUrl,
      key,
      publicUrl: this.publicUrl ? `${this.publicUrl}/${key}` : '',
    };
  }

  async getDownloadUrl(projectId: string, filePath: string): Promise<{ downloadUrl: string }> {
    const key = resolveProjectStorageKey(projectId, filePath);

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const downloadUrl = await getSignedUrl(this.ensureS3(), command, {
      expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
    });

    return { downloadUrl };
  }

  async deleteFile(projectId: string, filePath: string): Promise<void> {
    const key = resolveProjectStorageKey(projectId, filePath);

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.ensureS3().send(command);
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

  async linkFileAsset(id: string, data: CreateFileLinkDto) {
    await this.getFileAsset(id);
    return this.prisma.fileLink.create({
      data: { fileAssetId: id, ...buildLinkCreateInput(data) },
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
      Bucket: this.bucket,
      Prefix: prefix,
    });

    const response = await this.ensureS3().send(command);
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
